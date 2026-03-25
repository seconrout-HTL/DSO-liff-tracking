// ============================================
// 🚀 APP — Initialization & Event Wiring
// ============================================

// --- LIFF Init ---
async function initLiff() {
    try {
        if (!LIFF_ID) {
            console.warn("LIFF ID is missing. Skipping LIFF initialization and running in Guest mode.");
            updateUserDisplay();
            return;
        }

        await liff.init({ liffId: LIFF_ID });

        if (liff.isLoggedIn()) {
            const profile = await liff.getProfile();
            currentUserId = profile.userId;
            updateUserDisplay(profile.displayName);
        } else {
            console.log("User is not logged in.");
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
window.onclick = function (event) {
    const dropdown = document.getElementById('desktop-filter-dropdown');
    const button = document.getElementById('desktop-filter-btn');
    if (button && dropdown && !button.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.add('hidden');
    }
};

// --- App Bootstrap ---
window.onload = async function () {
    await initLiff();
    setDefaultDate();

    // Fetch branches and users in parallel before main data
    await Promise.all([fetchUsers(), fetchBranches()]);

    fetchData();
    setInterval(() => fetchData(true), 20000);
};
