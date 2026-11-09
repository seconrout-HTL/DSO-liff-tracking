// ============================================
// 🚀 APP — Initialization & Event Wiring
// ============================================

// --- LIFF Init ---
async function initLiff() {
    try {
        if (!LIFF_ID) {
            updateUserDisplay();
            return;
        }
        await liff.init({ liffId: LIFF_ID });
        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            currentUserId = profile.userId;
            updateUserDisplay(profile.displayName);
        } else {
            updateUserDisplay();
        }
    } catch (err) {
        console.error('LIFF Initialization Error:', err);
        updateUserDisplay();
    }
}

function updateUserDisplay(tempName) {
    let displayName = "Guest User";
    if (currentUserId && userMapping[currentUserId]) {
        displayName = userMapping[currentUserId];
    } else if (tempName) {
        displayName = tempName;
    }
    const mUser = document.getElementById('user-display-mobile');
    const dUser = document.getElementById('user-display-desktop');
    if (mUser) mUser.innerText = displayName;
    if (dUser) dUser.innerText = displayName;
}

// --- Global Event Listeners ---
window.addEventListener('click', function (event) {
    const dropdown = document.getElementById('desktop-filter-dropdown');
    const button = document.getElementById('desktop-filter-btn');
    if (button && dropdown && !button.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
});

// Patch tab switching to resize maps
const _origSwitchDesktopTab = switchDesktopTab;
switchDesktopTab = function(tab) {
    _origSwitchDesktopTab(tab);
    if (tab === 'dashboard') invalidateMaps();
};
const _origSwitchMobileTab = switchMobileTab;
switchMobileTab = function(tab, el) {
    _origSwitchMobileTab(tab, el);
    if (tab === 'dashboard') invalidateMaps();
};

// --- App Bootstrap ---
window.onload = async function () {
    await initLiff();
    setDefaultDate();
    await Promise.all([fetchUsers(), fetchBranches()]);
    fetchData();
    setInterval(() => fetchData(true), 20000);
    setTimeout(() => { initBranchMaps(); }, 500);
};
