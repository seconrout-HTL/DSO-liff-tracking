// ============================================
// 🔄 DATA — Fetching, Mapping & Helpers
// ============================================

const ALLOWED_STATUS_KEYS = new Set(['new', 'conf', 'edit', 'ship']);

async function fetchBranches() {
    try {
        const json = await secureApiRequest('getBranches');
        if (json && json.status === 'success' && Array.isArray(json.data)) {
            json.data.forEach(b => {
                if (!b || typeof b !== 'object') return;
                const id = sanitizeText(b.BranchID || b.id || b.code, '', 64);
                const name = sanitizeText(b.BranchName || b.name || b.branch, '', SECURITY_CONFIG.MAX_BRANCH_LEN);
                if (id && name && isSafeDictKey(id)) {
                    branchNames[id] = getCanonicalBranch(name);
                }
            });
        }
    } catch (err) {
        console.warn('Branch fetch error (using defaults):', err.message || err);
    }
}

/**
 * Data minimization: never fetches bulk userMapping for Guest Users.
 * Only fetches the current authenticated user's profile when USE_POST_AUTH is enabled.
 */
async function fetchCurrentUser() {
    if (!SECURITY_CONFIG.USE_POST_AUTH) return;
    const idToken = getLiffIdTokenSafe();
    if (!idToken) return;

    try {
        const json = await secureApiRequest('getMe');
        if (json && json.status === 'success' && json.data && json.data.displayName) {
            currentUserName = sanitizeText(json.data.displayName, '', 120);
            updateUserDisplay(currentUserName);
        }
    } catch (err) {
        console.warn('Current user profile fetch error:', err.message || err);
    }
}

async function fetchData(isSilent = false) {
    if (!isSilent) toggleLoading(true);
    try {
        const json = await secureApiRequest('getTrackingData', { t: String(Date.now()) });
        if (json && json.status === 'unauthorized') {
            if (SECURITY_CONFIG.REQUIRE_LIFF_LOGIN && typeof openAuthGateModal === 'function') {
                openAuthGateModal(json.message || t('authMessage'));
            } else if (!isSilent) {
                showToast(t('toastUnauthorized'), 'error');
            }
            return;
        }
        if (json && json.status === 'success' && Array.isArray(json.data)) {
            const mappedData = json.data
                .filter(item => item && typeof item === 'object')
                .map((item, i) => mapRoutingOrderData(item, i));
            globalData = calculateQueueLogic(mappedData);
            uniqueBranches = new Set();
            mappedData.forEach(item => {
                if (item.branch && item.branch !== '-') uniqueBranches.add(item.branch);
            });
            applyFilters();
            populateBranchFilters();
            updateDailyReport();
            updateMonthlyReport();
        }
    } catch (error) {
        console.error('Fetch Error:', error.message || error);
    } finally {
        if (!isSilent) toggleLoading(false);
        isFirstLoad = false;
    }
}

function normalizeTimeField(val) {
    const cleaned = sanitizeText(val, '', 32);
    return cleaned === '-' ? '' : cleaned;
}

async function submitCancelOrder(orderItem) {
    if (!orderItem || typeof isCancelingOrder !== 'undefined' && isCancelingOrder) return;
    if (calculateProgress(orderItem) >= 4) {
        showToast(t('toastCancelAlreadyShipped'), 'error');
        closeCancelOrderModal(true);
        return;
    }

    setCancelModalBusy(true);
    try {
        const json = await secureApiRequest('cancelOrder', {
            rowIndex: orderItem.rowIndex,
            branch: orderItem.rawBranch,
            targetDate: orderItem.deliveryDate,
            timestamp: orderItem.rawTimestampStr,
            actorName: currentUserName || 'Web User'
        }, { usePostAuth: true });

        if (json && json.status === 'success') {
            closeCancelOrderModal(true);
            showToast(t('toastCancelSuccess', { branch: formatBranchName(orderItem.branch) }), 'info');
            await fetchData(true);
            return;
        }

        const code = json && json.code ? String(json.code) : '';
        if (code === 'ALREADY_SHIPPED') {
            closeCancelOrderModal(true);
            showToast(t('toastCancelAlreadyShipped'), 'error');
            await fetchData(true);
        } else if (code === 'NOT_FOUND') {
            closeCancelOrderModal(true);
            showToast(t('toastCancelNotFound'), 'error');
            await fetchData(true);
        } else {
            showToast(t('toastCancelError'), 'error');
        }
    } catch (error) {
        console.error('Cancel Order Error:', error && error.message ? error.message : error);
        showToast(t('toastCancelError'), 'error');
    } finally {
        setCancelModalBusy(false);
    }
}

function mapRoutingOrderData(item, index) {
    const rawTs = sanitizeText(item.timestamp, '', 64);
    const dObj = parseDateObject(rawTs);
    let displayDate = rawTs || '-';
    let isoDate = '';
    let rawTimestamp = 0;
    if (dObj) {
        const day = String(dObj.getDate()).padStart(2, '0');
        const month = String(dObj.getMonth() + 1).padStart(2, '0');
        const year = dObj.getFullYear();
        const hours = String(dObj.getHours()).padStart(2, '0');
        const mins = String(dObj.getMinutes()).padStart(2, '0');
        displayDate = `${day}/${month}/${year} ${hours}:${mins}`;
        isoDate = `${year}-${month}-${day}`;
        rawTimestamp = dObj.getTime();
    }
    const rawBranch = sanitizeText(item.branch, '-', SECURITY_CONFIG.MAX_BRANCH_LEN);
    const mappedName = (isSafeDictKey(rawBranch) && branchNames[rawBranch]) ? branchNames[rawBranch] : rawBranch;
    const branchName = getCanonicalBranch(mappedName);
    const parsedEditCount = parseInt(item.editCount, 10);
    const parsedRowIndex = parseInt(item.rowIndex, 10);

    return {
        rowIndex: Number.isFinite(parsedRowIndex) && parsedRowIndex >= 2 ? parsedRowIndex : 0,
        rawBranch,
        rawTimestampStr: rawTs,
        timestamp: displayDate,
        isoDate,
        rawTimestamp,
        originalIndex: Number.isInteger(index) ? index : 0,
        branch: branchName,
        deliveryDate: sanitizeText(item.targetDate, '-', 64),
        bill: { time: normalizeTimeField(item.timeBill), by: '-' },
        conf: { time: normalizeTimeField(item.timeConf), by: '-' },
        ship: { time: normalizeTimeField(item.timeShip), by: '-' },
        amount: sanitizeText(item.currentAmount, '-', 32),
        shipmentAmount: sanitizeText(item.Amt_Ship || item.shipmentAmount, '-', 32),
        editCount: Number.isFinite(parsedEditCount) && parsedEditCount > 0 ? parsedEditCount : 0,
        note: sanitizeText(item.note, '', SECURITY_CONFIG.MAX_NOTE_LEN),
        processingTime: sanitizeText(item.diff2, '-', 32)
    };
}

function calculateQueueLogic(data) {
    data.sort((a, b) => {
        const timeDiff = a.rawTimestamp - b.rawTimestamp;
        if (timeDiff !== 0) return timeDiff;
        return a.originalIndex - b.originalIndex;
    });
    const queueMap = createSafeMap();
    const queueWaitMap = createSafeMap();
    data.forEach(item => {
        if (!item.isoDate || !isSafeDictKey(item.isoDate)) {
            item.queueNo = '-';
            item.queueWait = -1;
            return;
        }
        if (!queueMap[item.isoDate]) queueMap[item.isoDate] = 0;
        queueMap[item.isoDate]++;
        const q = String(queueMap[item.isoDate]).padStart(2, '0');
        item.queueNo = `#${q}`;
        const status = getStatusCode(item);
        if (status === 'new') {
            if (!queueWaitMap[item.isoDate]) queueWaitMap[item.isoDate] = 0;
            item.queueWait = queueWaitMap[item.isoDate];
            queueWaitMap[item.isoDate]++;
        } else {
            item.queueWait = -1;
        }
    });
    return data;
}

function parseDateObject(val) {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    const str = val.toString().trim();
    const regex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:[,\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
    const match = str.match(regex);
    if (match) {
        let year = parseInt(match[3], 10);
        if (match[3].length === 2) year += 2000;
        return new Date(
            year,
            parseInt(match[2], 10) - 1,
            parseInt(match[1], 10),
            match[4] ? parseInt(match[4], 10) : 0,
            match[5] ? parseInt(match[5], 10) : 0
        );
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

function calculateProgress(item) {
    if (item.ship && item.ship.time) return 4;
    if (item.conf && item.conf.time) return 2;
    if (item.bill && item.bill.time) return 1;
    return 0;
}

function getStatusCode(item) {
    const p = calculateProgress(item);
    const hasEdit = item.editCount > 0;
    if (p >= 4) return 'ship';
    if (p === 3 || (p === 2 && hasEdit)) return 'edit';
    if (p === 2) return 'conf';
    return 'new';
}

function getStatusBadge(item, isMobile = false) {
    const p = calculateProgress(item);
    const isEdit = item.editCount > 0;
    if (p >= 4) {
        return `<span class="px-3 py-1 badge-completed rounded-full text-xs font-semibold">${escapeHtml(t('statusShipped'))}</span>`;
    }
    if (isEdit && p < 4) {
        return `<span class="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-semibold border border-amber-200/80">${escapeHtml(t('statusEdited'))}</span>`;
    }
    if (p === 2) {
        return `<span class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200/80">${escapeHtml(t('statusConfirmed'))}</span>`;
    }
    if (Number.isInteger(item.queueWait) && item.queueWait >= 0) {
        const align = isMobile ? 'items-end' : 'items-center';
        let queueText = '';
        let queueColor = '';
        if (item.queueWait === 0) {
            queueText = escapeHtml(t('queueReady'));
            queueColor = 'text-brand-green';
        } else {
            queueText = escapeHtml(t('queueWaiting', { n: item.queueWait }));
            queueColor = 'text-brand-red';
        }
        return `<div class="flex flex-col ${align}"><span class="px-3 py-1 badge-urgent-new rounded-full text-xs font-semibold">${escapeHtml(t('statusNew'))}</span><span class="text-[10px] ${queueColor} font-semibold mt-1 whitespace-nowrap">${queueText}</span></div>`;
    }
    return `<span class="px-3 py-1 badge-urgent-new rounded-full text-xs font-semibold">${escapeHtml(t('statusNew'))}</span>`;
}

function setDefaultDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    ['date-mobile', 'date-desktop', 'export-start', 'export-end', 'm-report-date', 'd-report-date'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = today;
    });
    ['m-report-month', 'd-report-month'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = parseInt(month, 10).toString();
    });
    ['m-report-year', 'd-report-year'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = year;
    });
}

function handleSort(column) {
    const allowedColumns = ['queue', 'timestamp', 'branch', 'deliveryDate', 'status', 'amount', 'shipment'];
    if (!allowedColumns.includes(column)) return;
    if (sortState.column === column) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.column = column;
        if (['timestamp', 'amount', 'shipment', 'queue', 'status'].includes(column)) sortState.direction = 'desc';
        else sortState.direction = 'asc';
    }
    updateSortIcons();
    applyFilters();
}

function handleSortMobile() {
    const selectEl = document.getElementById('mobile-sort-select');
    if (!selectEl) return;
    const val = selectEl.value;
    if (val === 'default') {
        sortState = { column: 'default', direction: 'asc' };
    } else {
        const [col, dir] = val.split('_');
        if (['timestamp', 'queue', 'branch', 'amount'].includes(col) && ['asc', 'desc'].includes(dir)) {
            sortState = { column: col, direction: dir };
        }
    }
    applyFilters();
}

function updateSortIcons() {
    document.querySelectorAll('th i').forEach(i => {
        i.className = 'fas fa-sort text-slate-300 ml-1 group-hover:text-brand-green';
    });
    if (sortState.column !== 'default') {
        const icon = document.getElementById(`icon-${sortState.column}`);
        if (icon) icon.className = `fas fa-sort-${sortState.direction === 'asc' ? 'up' : 'down'} text-brand-green ml-1`;
    }
}

function sortData(data, column, direction) {
    const dir = direction === 'asc' ? 1 : -1;
    return data.sort((a, b) => {
        let valA, valB;
        if (column === 'default') {
            const timeDiff = b.rawTimestamp - a.rawTimestamp;
            if (timeDiff !== 0) return timeDiff;
            return b.originalIndex - a.originalIndex;
        }
        switch (column) {
            case 'queue': valA = parseInt(String(a.queueNo).replace('#', ''), 10) || 0; valB = parseInt(String(b.queueNo).replace('#', ''), 10) || 0; break;
            case 'timestamp': valA = a.rawTimestamp; valB = b.rawTimestamp; break;
            case 'branch': valA = formatBranchName(a.branch).toLowerCase(); valB = formatBranchName(b.branch).toLowerCase(); break;
            case 'deliveryDate': valA = a.isoDate || ''; valB = b.isoDate || ''; break;
            case 'status': valA = calculateProgress(a); valB = calculateProgress(b); break;
            case 'amount': valA = parseFloat(String(a.amount).replace(/,/g, '')) || 0; valB = parseFloat(String(b.amount).replace(/,/g, '')) || 0; break;
            case 'shipment': valA = parseFloat(String(a.shipmentAmount).replace(/,/g, '')) || 0; valB = parseFloat(String(b.shipmentAmount).replace(/,/g, '')) || 0; break;
            default: return 0;
        }
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
    });
}

function syncFilters(source) {
    if (source !== 'mobile' && source !== 'desktop') return;
    const srcSearch = document.getElementById(`search-${source}`);
    const srcDate = document.getElementById(`date-${source}`);
    const target = source === 'mobile' ? 'desktop' : 'mobile';
    const tgtSearch = document.getElementById(`search-${target}`);
    const tgtDate = document.getElementById(`date-${target}`);
    if (srcSearch && tgtSearch) tgtSearch.value = srcSearch.value;
    if (srcDate && tgtDate) tgtDate.value = srcDate.value;
    applyFilters();
}

function applyFilters() {
    const searchEl = document.getElementById('search-mobile');
    const dateEl = document.getElementById('date-mobile');
    const searchQuery = (searchEl ? searchEl.value : '').trim().toLowerCase();
    const dateQuery = dateEl ? dateEl.value : '';
    let filtered = globalData.filter(item => {
        const canonicalStr = String(item.branch || '').toLowerCase();
        const displayStr = formatBranchName(item.branch).toLowerCase();
        const matchesSearch = !searchQuery || canonicalStr.includes(searchQuery) || displayStr.includes(searchQuery);
        let matchesDate = true;
        if (dateQuery) matchesDate = item.isoDate === dateQuery;
        const status = getStatusCode(item);
        const matchesStatus = Boolean(activeFilters[status]);
        return matchesSearch && matchesDate && matchesStatus;
    });
    filtered = sortData(filtered, sortState.column, sortState.direction);
    updateDashboard(filtered);
    renderDashboardTables(filtered);
    renderMobileList(filtered);
    renderDesktopTable(filtered);
    updateMapData(filtered);
}

function updateStatusSummaryText() {
    const activeCount = Object.values(activeFilters).filter(Boolean).length;
    const summaryEl = document.getElementById('desktop-status-summary');
    if (summaryEl) {
        summaryEl.textContent = activeCount === 4 ? t('filterAll') : t('filterSelected', { n: activeCount });
    }
}

function toggleStatusFilter(key, isChecked) {
    if (!ALLOWED_STATUS_KEYS.has(key)) return;
    activeFilters[key] = Boolean(isChecked);
    const dChk = document.getElementById(`d-chk-${key}`);
    const mChk = document.getElementById(`m-chk-${key}`);
    if (dChk) dChk.checked = Boolean(isChecked);
    if (mChk) mChk.checked = Boolean(isChecked);

    updateStatusSummaryText();

    if (window.innerWidth >= 768) applyFilters();
}
