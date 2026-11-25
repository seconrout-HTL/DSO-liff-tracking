/**
 * ============================================================
 * DSO Fleet Order Tracking — Hardened Google Apps Script Backend
 * ============================================================
 *
 * Deployment checklist:
 * 1. Open Google Apps Script attached to your tracking Spreadsheet.
 * 2. Paste this code into Code.gs and adjust SHEET_CONFIG below if needed.
 * 3. Project Settings -> Script Properties -> Add:
 *      - LINE_CHANNEL_ID       : Your LINE Login Channel ID (numeric string from LINE Developers Console)
 *      - REQUIRE_AUTH          : "true" (recommended) or "false" (temporary migration mode for Desktop)
 *      - SPREADSHEET_ID        : (Optional) Explicit Spreadsheet ID if running as a standalone script
 *      - RATE_LIMIT_MAX        : (Optional) Max requests per window (default: 60)
 *      - RATE_LIMIT_WINDOW_SEC : (Optional) Rate limit window in seconds (default: 60)
 * 4. Deploy -> New deployment -> Web app:
 *      - Execute as: Me
 *      - Who has access: Anyone (authentication is enforced by LINE idToken + Users sheet)
 * 5. In frontend config.js, set SECURITY_CONFIG.USE_POST_AUTH = true
 *    (and REQUIRE_LIFF_LOGIN = true when ready to enforce LINE login for all users).
 */

const SHEET_CONFIG = {
  TRACKING_SHEET: 'Tracking', // Adjust to match your order tracking sheet name
  BRANCHES_SHEET: 'Branches', // Columns: BranchID, BranchName
  USERS_SHEET: 'Users',       // Columns: Userid, Name, Active (optional)
  CACHE_TTL_TOKEN_SEC: 60,
  DEFAULT_RATE_LIMIT_MAX: 60,
  DEFAULT_RATE_LIMIT_WINDOW_SEC: 60
};

const ALLOWED_ACTIONS = {
  getTrackingData: true,
  getBranches: true,
  getMe: true
};

/**
 * Primary authenticated endpoint (POST with text/plain JSON body to avoid CORS preflight).
 * Expected JSON body: { action: "getTrackingData" | "getBranches" | "getMe", idToken: "<LINE_ID_TOKEN>" }
 */
function doPost(e) {
  try {
    const body = parseRequestBody(e);
    const action = sanitizeString(body.action);

    if (!ALLOWED_ACTIONS[action]) {
      return jsonResponse({ status: 'error', code: 'INVALID_ACTION', message: 'Unsupported action' });
    }

    const requireAuth = getProperty('REQUIRE_AUTH', 'true').toLowerCase() === 'true';
    let authUser = null;

    if (requireAuth || action === 'getMe' || body.idToken) {
      const idToken = sanitizeString(body.idToken);
      if (!idToken) {
        return jsonResponse({ status: 'unauthorized', code: 'MISSING_TOKEN', message: 'LINE ID token is required' });
      }

      const tokenClaims = verifyLineIdToken(idToken);
      if (!tokenClaims || !tokenClaims.sub) {
        return jsonResponse({ status: 'unauthorized', code: 'INVALID_TOKEN', message: 'Invalid or expired LINE ID token' });
      }

      authUser = findAuthorizedUser(tokenClaims.sub);
      if (!authUser) {
        return jsonResponse({ status: 'unauthorized', code: 'USER_NOT_AUTHORIZED', message: 'LINE account is not authorized in Users sheet' });
      }
    }

    const rateKey = authUser ? `uid:${authUser.userId}` : 'anon:post';
    if (!checkRateLimit(rateKey)) {
      return jsonResponse({ status: 'error', code: 'RATE_LIMITED', message: 'Too many requests. Please retry shortly.' });
    }

    return dispatchAction(action, authUser);
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResponse({ status: 'error', code: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

/**
 * Legacy GET endpoint for gradual migration.
 * - Always blocks bulk `getUsers` (data minimization).
 * - Rejects all requests when Script Property REQUIRE_AUTH is "true".
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = sanitizeString(params.action);

    // Never expose the full employee Users sheet via GET or POST
    if (action === 'getUsers') {
      return jsonResponse({ status: 'forbidden', code: 'ACTION_DISABLED', message: 'Bulk user listing is disabled for privacy' });
    }

    const requireAuth = getProperty('REQUIRE_AUTH', 'true').toLowerCase() === 'true';
    if (requireAuth) {
      return jsonResponse({
        status: 'unauthorized',
        code: 'POST_AUTH_REQUIRED',
        message: 'Authentication required. Use POST with LINE idToken.'
      });
    }

    if (action !== 'getTrackingData' && action !== 'getBranches') {
      return jsonResponse({ status: 'error', code: 'INVALID_ACTION', message: 'Unsupported action' });
    }

    if (!checkRateLimit('anon:get')) {
      return jsonResponse({ status: 'error', code: 'RATE_LIMITED', message: 'Too many requests. Please retry shortly.' });
    }

    return dispatchAction(action, null);
  } catch (err) {
    Logger.log('doGet error: ' + err);
    return jsonResponse({ status: 'error', code: 'SERVER_ERROR', message: 'Internal server error' });
  }
}

function dispatchAction(action, authUser) {
  if (action === 'getMe') {
    if (!authUser) {
      return jsonResponse({ status: 'unauthorized', message: 'Authentication required' });
    }
    return jsonResponse({
      status: 'success',
      data: {
        displayName: authUser.displayName,
        role: authUser.role || 'user'
      }
    });
  }

  if (action === 'getBranches') {
    return jsonResponse({ status: 'success', data: readSheetAsObjects(SHEET_CONFIG.BRANCHES_SHEET) });
  }

  if (action === 'getTrackingData') {
    return jsonResponse({ status: 'success', data: readSheetAsObjects(SHEET_CONFIG.TRACKING_SHEET) });
  }

  return jsonResponse({ status: 'error', code: 'INVALID_ACTION', message: 'Unsupported action' });
}

/**
 * Verifies a LINE LIFF idToken via LINE's official OAuth2 verify endpoint.
 * Caches valid claim summaries briefly using a SHA-256 digest of the token.
 */
function verifyLineIdToken(idToken) {
  const channelId = getProperty('LINE_CHANNEL_ID', '');
  if (!channelId) {
    throw new Error('LINE_CHANNEL_ID Script Property is not configured');
  }

  const cache = CacheService.getScriptCache();
  const cacheKey = 'line_tok_' + sha256Hex(idToken).slice(0, 48);
  const cached = cache.get(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.exp && parsed.exp * 1000 > Date.now()) {
        return parsed;
      }
    } catch (_e) {}
  }

  const response = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post',
    payload: {
      id_token: idToken,
      client_id: channelId
    },
    muteHttpExceptions: true
  });

  if (response.getResponseCode() !== 200) {
    return null;
  }

  const claims = JSON.parse(response.getContentText());
  if (!claims || !claims.sub || String(claims.aud) !== String(channelId)) {
    return null;
  }
  if (!claims.exp || claims.exp * 1000 <= Date.now()) {
    return null;
  }

  const minimalClaims = {
    sub: String(claims.sub),
    name: claims.name ? String(claims.name) : '',
    exp: Number(claims.exp)
  };
  cache.put(cacheKey, JSON.stringify(minimalClaims), SHEET_CONFIG.CACHE_TTL_TOKEN_SEC);
  return minimalClaims;
}

/**
 * Checks whether the verified LINE userId exists (and is active) in the Users sheet.
 * Returns only the single matched user record.
 */
function findAuthorizedUser(lineUserId) {
  const rows = readSheetAsObjects(SHEET_CONFIG.USERS_SHEET);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const uid = sanitizeString(row.Userid || row.userid || row.userId || row.UserID);
    if (uid && uid === lineUserId) {
      const activeFlag = row.Active !== undefined ? String(row.Active).trim().toLowerCase() : 'true';
      if (activeFlag === 'false' || activeFlag === '0' || activeFlag === 'no' || activeFlag === 'disabled') {
        return null;
      }
      return {
        userId: uid,
        displayName: sanitizeString(row.Name || row.name || row.NAME) || 'Authorized User',
        role: sanitizeString(row.Role || row.role) || 'user'
      };
    }
  }
  return null;
}

/**
 * Fixed-window rate limiter backed by CacheService.
 */
function checkRateLimit(identityKey) {
  const maxRequests = parseInt(getProperty('RATE_LIMIT_MAX', String(SHEET_CONFIG.DEFAULT_RATE_LIMIT_MAX)), 10) || SHEET_CONFIG.DEFAULT_RATE_LIMIT_MAX;
  const windowSec = parseInt(getProperty('RATE_LIMIT_WINDOW_SEC', String(SHEET_CONFIG.DEFAULT_RATE_LIMIT_WINDOW_SEC)), 10) || SHEET_CONFIG.DEFAULT_RATE_LIMIT_WINDOW_SEC;
  const bucket = Math.floor(Date.now() / (windowSec * 1000));
  const cacheKey = 'rl_' + sha256Hex(identityKey).slice(0, 32) + '_' + bucket;

  const cache = CacheService.getScriptCache();
  const current = parseInt(cache.get(cacheKey) || '0', 10);
  if (current >= maxRequests) {
    return false;
  }
  cache.put(cacheKey, String(current + 1), windowSec + 5);
  return true;
}

function getSpreadsheet() {
  const explicitId = getProperty('SPREADSHEET_ID', '');
  return explicitId
    ? SpreadsheetApp.openById(explicitId)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function readSheetAsObjects(sheetName) {
  const ss = getSpreadsheet();
  if (!ss) return [];
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  const headers = values[0].map(h => String(h || '').trim());
  const results = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    let hasValue = false;
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      const cell = row[c];
      if (cell !== '' && cell !== null && cell !== undefined) {
        hasValue = true;
      }
      obj[key] = (cell instanceof Date) ? cell.toISOString() : cell;
    }
    if (hasValue) results.push(obj);
  }
  return results;
}

function parseRequestBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  const raw = String(e.postData.contents);
  if (raw.length > 32768) {
    throw new Error('Request payload too large');
  }
  return JSON.parse(raw);
}

function getProperty(key, defaultValue) {
  const val = PropertiesService.getScriptProperties().getProperty(key);
  return (val !== null && val !== undefined && String(val).trim() !== '') ? String(val).trim() : defaultValue;
}

function sanitizeString(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

function sha256Hex(input) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(input), Utilities.Charset.UTF_8);
  return digest.map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join('');
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
