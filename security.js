// ============================================
// 🛡️ SECURITY — Sanitization, Validation & Safe API Helpers
// ============================================

const DANGEROUS_DICT_KEYS = new Set([
    '__proto__',
    'constructor',
    'prototype',
    'toString',
    'valueOf',
    'hasOwnProperty',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__'
]);

const HTML_ESCAPE_MAP = Object.freeze({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;'
});

/**
 * Escapes HTML special characters to prevent Stored/DOM XSS.
 */
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"'`]/g, ch => HTML_ESCAPE_MAP[ch]);
}

/**
 * Normalizes untrusted text by stripping control characters and enforcing optional max length.
 */
function sanitizeText(value, fallback = '', maxLength = 0) {
    if (value === null || value === undefined) return fallback;
    let str = String(value)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim();
    if (!str) return fallback;
    if (maxLength > 0 && str.length > maxLength) {
        str = str.slice(0, maxLength);
    }
    return str;
}

/**
 * Neutralizes Excel/CSV Formula Injection (CWE-1236) while preserving safe values.
 */
function sanitizeExcelCell(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : '';
    }
    const str = String(value).replace(/\u0000/g, '');
    if (!str || str === '-') return str;
    if (/^[\s\uFEFF]*[=+\-@\t\r\n]/.test(str)) {
        return `'${str}`;
    }
    return str;
}

/**
 * Sanitizes filename segments used for client-side downloads.
 */
function sanitizeFilenameSegment(value, fallback = 'export') {
    const cleaned = sanitizeText(value, '')
        .replace(/[^a-zA-Z0-9_-]/g, '');
    return cleaned || fallback;
}

/**
 * Creates a prototype-less dictionary to prevent Prototype Pollution.
 */
function createSafeMap() {
    return Object.create(null);
}

/**
 * Validates that a dynamic dictionary key is not a prototype/object-property key.
 */
function isSafeDictKey(key) {
    if (typeof key !== 'string' && typeof key !== 'number') return false;
    const str = String(key);
    if (!str) return false;
    return !DANGEROUS_DICT_KEYS.has(str);
}

/**
 * Validates that the Google Apps Script endpoint is an HTTPS script.google.com/macros/s/.../exec URL.
 */
function validateGasApiUrl(url) {
    if (typeof url !== 'string' || !url.trim()) return false;
    try {
        const parsed = new URL(url.trim());
        if (parsed.protocol !== 'https:') return false;
        if (parsed.username || parsed.password) return false;
        if (parsed.hostname === 'script.google.com') {
            return /^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(parsed.pathname);
        }
        if (parsed.hostname === 'script.googleusercontent.com') {
            return parsed.pathname.startsWith('/macros/');
        }
        return false;
    } catch (_err) {
        return false;
    }
}

/**
 * Safely retrieves the current LINE LIFF ID token if initialized and logged in.
 */
function getLiffIdTokenSafe() {
    try {
        if (
            typeof liff !== 'undefined' &&
            typeof liff.isLoggedIn === 'function' &&
            liff.isLoggedIn() &&
            typeof liff.getIDToken === 'function'
        ) {
            const token = liff.getIDToken();
            return typeof token === 'string' && token.trim() ? token.trim() : null;
        }
    } catch (_err) {
        // Ignore LIFF token read errors outside LIFF context
    }
    return null;
}

/**
 * Performs a hardened API request to the configured Google Apps Script backend
 * with URL validation, 15s timeout, no-referrer policy, and optional POST ID-token auth.
 */
async function secureApiRequest(action, params = {}, options = {}) {
    if (!validateGasApiUrl(GAS_API_URL)) {
        throw new Error('Blocked request: GAS_API_URL failed security validation');
    }
    if (typeof action !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(action)) {
        throw new Error('Invalid API action');
    }

    const timeoutMs = Number(
        options.timeoutMs ||
        (typeof SECURITY_CONFIG !== 'undefined' && SECURITY_CONFIG.API_TIMEOUT_MS) ||
        15000
    );
    const usePostAuth = Boolean(
        options.usePostAuth !== undefined
            ? options.usePostAuth
            : (typeof SECURITY_CONFIG !== 'undefined' && SECURITY_CONFIG.USE_POST_AUTH)
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        let requestUrl = GAS_API_URL;
        const fetchOpts = {
            method: 'GET',
            referrerPolicy: 'no-referrer',
            credentials: 'omit',
            cache: 'no-store',
            signal: controller.signal
        };

        if (usePostAuth) {
            const payload = { action };
            if (params && typeof params === 'object') {
                Object.keys(params).forEach(k => {
                    if (isSafeDictKey(k) && params[k] !== undefined && params[k] !== null) {
                        payload[k] = params[k];
                    }
                });
            }
            const idToken = getLiffIdTokenSafe();
            if (idToken) payload.idToken = idToken;

            fetchOpts.method = 'POST';
            fetchOpts.headers = { 'Content-Type': 'text/plain;charset=utf-8' };
            fetchOpts.body = JSON.stringify(payload);
        } else {
            const urlObj = new URL(GAS_API_URL);
            urlObj.searchParams.set('action', action);
            if (params && typeof params === 'object') {
                Object.keys(params).forEach(k => {
                    if (isSafeDictKey(k) && params[k] !== undefined && params[k] !== null) {
                        urlObj.searchParams.set(k, String(params[k]));
                    }
                });
            }
            requestUrl = urlObj.toString();
        }

        const response = await fetch(requestUrl, fetchOpts);
        if (!response.ok) {
            throw new Error(`API HTTP error: ${response.status}`);
        }
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

window.AppSecurity = Object.freeze({
    escapeHtml,
    sanitizeText,
    sanitizeExcelCell,
    sanitizeFilenameSegment,
    createSafeMap,
    isSafeDictKey,
    validateGasApiUrl,
    getLiffIdTokenSafe,
    secureApiRequest
});
