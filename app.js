// ============================================
// 🚀 APP — Initialization & Event Delegation
// ============================================

/**
 * Strips sensitive OAuth/LIFF callback query parameters (code, state, etc.)
 * from the browser URL bar and history immediately after liff.init().
 */
function cleanOAuthParamsFromUrl() {
    try {
        if (!window.history || typeof window.history.replaceState !== 'function') return;
        const url = new URL(window.location.href);
        const sensitiveParams = ['code', 'state', 'liffClientId', 'liffRedirectUri', 'error', 'error_description'];
        let modified = false;
        sensitiveParams.forEach(param => {
            if (url.searchParams.has(param)) {
                url.searchParams.delete(param);
                modified = true;
            }
        });
        if (modified) {
            const cleanSearch = url.searchParams.toString();
            const cleanUrl = url.pathname + (cleanSearch ? `?${cleanSearch}` : '') + url.hash;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    } catch (_err) {
        // Ignore history API errors in restricted environments
    }
}

// --- LIFF Init ---
async function initLiff() {
    let isAuthenticated = false;
    try {
        if (!LIFF_ID || typeof liff === 'undefined') {
            updateUserDisplay();
        } else {
            await liff.init({ liffId: LIFF_ID });
            if (liff.isLoggedIn()) {
                isAuthenticated = true;
                const profile = await liff.getProfile();
                currentUserId = sanitizeText(profile.userId, null, 128);
                currentUserName = sanitizeText(profile.displayName, 'LINE User', 120);
                updateUserDisplay(currentUserName);
            } else {
                updateUserDisplay();
            }
        }
    } catch (err) {
        console.warn('LIFF Initialization Error:', err && err.message ? err.message : err);
        updateUserDisplay();
    } finally {
        cleanOAuthParamsFromUrl();
    }

    if (SECURITY_CONFIG.REQUIRE_LIFF_LOGIN && !isAuthenticated) {
        openAuthGateModal(t('authMessage'));
        return false;
    }

    closeAuthGateModal();
    return true;
}

function updateUserDisplay(tempName) {
    const fallbackGuest = (typeof t === 'function') ? t('guestUser') : 'Guest User';
    const displayName = sanitizeText(tempName || currentUserName, fallbackGuest, 120);
    const mUser = document.getElementById('user-display-mobile');
    const dUser = document.getElementById('user-display-desktop');
    if (mUser) mUser.textContent = displayName;
    if (dUser) dUser.textContent = displayName;
}

function handleLiffLoginAction() {
    if (typeof liff !== 'undefined' && typeof liff.login === 'function') {
        liff.login();
    } else {
        showToast(t('toastLoginUnavailable'), 'error');
    }
}

// --- Centralized Event Delegation (Zero Inline Event Handlers) ---
function handleDelegatedAction(actionEl, event) {
    const action = actionEl.getAttribute('data-action');
    switch (action) {
        case 'set-lang': {
            const lang = actionEl.getAttribute('data-lang');
            if (lang) setLanguage(lang);
            break;
        }
        case 'hide-toast':
            hideToast();
            break;
        case 'open-export':
            openExportModal();
            break;
        case 'close-export':
            closeExportModal();
            break;
        case 'confirm-export':
            confirmExport();
            break;
        case 'open-mobile-filter':
            openMobileFilter();
            break;
        case 'close-mobile-filter':
            closeMobileFilter();
            break;
        case 'manual-refresh':
            manualRefresh();
            break;
        case 'toggle-desktop-filter':
            toggleDesktopFilter(event);
            break;
        case 'switch-mobile-tab': {
            const tab = actionEl.getAttribute('data-tab');
            if (tab) switchMobileTab(tab, actionEl);
            break;
        }
        case 'switch-desktop-tab': {
            const tab = actionEl.getAttribute('data-tab');
            if (tab) switchDesktopTab(tab);
            break;
        }
        case 'sort-column': {
            const column = actionEl.getAttribute('data-column');
            if (column) handleSort(column);
            break;
        }
        case 'switch-map-style': {
            const styleName = actionEl.getAttribute('data-style');
            if (styleName) switchMapStyle(styleName);
            break;
        }
        case 'toggle-map-labels':
            toggleMapLabels();
            break;
        case 'reset-map-view':
            resetMapView();
            break;
        case 'focus-branch': {
            const branch = actionEl.getAttribute('data-branch');
            if (branch) focusBranchOnMap(branch);
            break;
        }
        case 'switch-report-type': {
            const reportType = actionEl.getAttribute('data-report-type');
            if (reportType) switchReportType(reportType);
            break;
        }
        case 'toggle-accordion':
            toggleAccordion(actionEl);
            break;
        case 'liff-login':
            handleLiffLoginAction();
            break;
        case 'open-cancel-order': {
            const idx = parseInt(actionEl.getAttribute('data-item-index'), 10);
            if (!isNaN(idx)) openCancelOrderModalByIndex(idx);
            break;
        }
        case 'close-cancel-order':
            closeCancelOrderModal();
            break;
        case 'confirm-cancel-order':
            if (pendingCancelOrder) submitCancelOrder(pendingCancelOrder);
            break;
        default:
            break;
    }
}

function initEventListeners() {
    // Delegated click handler
    document.addEventListener('click', function (event) {
        const dropdown = document.getElementById('desktop-filter-dropdown');
        const button = document.getElementById('desktop-filter-btn');
        if (button && dropdown && !button.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.add('hidden');
        }

        // Close cancel modal when clicking backdrop
        const cancelModal = document.getElementById('cancel-order-modal');
        if (cancelModal && event.target === cancelModal) {
            closeCancelOrderModal();
            return;
        }

        const actionEl = event.target.closest('[data-action]');
        if (actionEl) {
            handleDelegatedAction(actionEl, event);
        }
    });

    // Keyboard activation for clickable non-button elements + Escape closes cancel modal
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeCancelOrderModal();
            return;
        }
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const actionEl = event.target.closest('[role="button"][data-action]');
        if (actionEl) {
            event.preventDefault();
            handleDelegatedAction(actionEl, event);
        }
    });

    // Delegated change handler (dates, selects, checkboxes)
    document.addEventListener('change', function (event) {
        const target = event.target;
        if (!target) return;

        const syncSource = target.getAttribute('data-sync-filter');
        if (syncSource) {
            syncFilters(syncSource);
            return;
        }

        const statusKey = target.getAttribute('data-status-filter');
        if (statusKey) {
            toggleStatusFilter(statusKey, target.checked);
            return;
        }

        const changeAction = target.getAttribute('data-change-action');
        if (changeAction === 'sort-mobile') {
            handleSortMobile();
        } else if (changeAction === 'daily-report') {
            updateDailyReport(target.getAttribute('data-source') || 'desktop');
        } else if (changeAction === 'monthly-report') {
            updateMonthlyReport(target.getAttribute('data-source') || 'desktop');
        }
    });

    // Delegated input handler (live text search & year typing)
    document.addEventListener('input', function (event) {
        const target = event.target;
        if (!target) return;

        const syncSource = target.getAttribute('data-sync-filter');
        if (syncSource && target.type === 'text') {
            syncFilters(syncSource);
            return;
        }

        const changeAction = target.getAttribute('data-change-action');
        if (changeAction === 'monthly-report' && target.type === 'number') {
            updateMonthlyReport(target.getAttribute('data-source') || 'desktop');
        }
    });
}

// --- App Bootstrap ---
document.addEventListener('DOMContentLoaded', async function () {
    initEventListeners();
    setLanguage(loadSavedLanguage(), true);
    setDefaultDate();
    const canProceed = await initLiff();
    if (!canProceed) return;

    await Promise.all([fetchCurrentUser(), fetchBranches()]);
    await fetchData();
    setInterval(() => fetchData(true), 20000);
    setTimeout(() => { initBranchMaps(); }, 300);
});
