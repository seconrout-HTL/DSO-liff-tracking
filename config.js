// ============================================
// ⚙️ CONFIG — Settings & Constants
// ============================================

// 🔒 Encoded configuration (Base64)
const _c = [
    'aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J3MDJEejdFc1VkTjJOWm42d2R2dGpiS05UejVfVEpmWnFTSDdRWDBqb2dtVGdYbi1xdWktSElxeUhTTjB5dl9LZmkvZXhlYw==',
    'MjAwODk4MzgyNy1aYlpJMllXdQ=='
];
const GAS_API_URL = atob(_c[0]);
const LIFF_ID     = atob(_c[1]);

// 🛡️ Security Configuration
// Keep REQUIRE_LIFF_LOGIN & USE_POST_AUTH false until backend/Code.gs is deployed
// so Desktop browsers are not blocked immediately.
const SECURITY_CONFIG = Object.freeze({
    REQUIRE_LIFF_LOGIN: false,
    USE_POST_AUTH: false,
    API_TIMEOUT_MS: 15000,
    MAX_BRANCH_LEN: 100,
    MAX_NOTE_LEN: 500
});

if (!validateGasApiUrl(GAS_API_URL)) {
    console.error('Configured GAS_API_URL failed security validation.');
}

// --- Global State ---
let branchNames = createSafeMap();
let globalData = [];
let uniqueBranches = new Set();
let isFirstLoad = true;
let sortState = { column: 'default', direction: 'asc' };
let activeFilters = { new: true, conf: true, edit: true, ship: true };
let freqChartInstance = null;
let mFreqChartInstance = null;
let currentUserId = null;
let currentUserName = null;
let toastTimer = null;

// Canonical Master List of Southern Branches on the Map
const MASTER_SOUTHERN_BRANCHES = Object.freeze([
    'สาขาชุมพร',
    'สาขาหลังสวน',
    'สาขาระนอง',
    'สาขาสุราษฎร์ธานี',
    'สาขาพุนพิน',
    'สาขาสมุย',
    'เขตเกาะพะงัน',
    'สาขานครศรีธรรมราช',
    'สาขาทุ่งสง',
    'สาขาตะกั่วป่า',
    'สาขาพังงา',
    'เขตเกาะยาว',
    'สาขาภูเก็ต',
    'เขตกลางคืน',
    'สาขากระบี่',
    'สาขาตรัง',
    'สาขาพัทลุง',
    'สาขาสตูล',
    'สาขาหาดใหญ่',
    'สาขาปัตตานี',
    'สาขายะลา',
    'สาขานราธิวาส'
]);

// Normalize any raw branch name (e.g. spelling variants like สุราษฏร์ธานี vs สุราษฎร์ธานี, นครศรีฯ, etc.)
function getCanonicalBranch(raw) {
    if (!raw) return '-';
    const s = sanitizeText(raw, '', SECURITY_CONFIG.MAX_BRANCH_LEN);
    if (!s || s === '-') return '-';

    // Normalize common Thai spelling variants (ฏ -> ฎ) and remove spaces/dots
    const clean = s
        .replace(/ฏ/g, 'ฎ')
        .replace(/^(สาขา|เขตพื้นที่|เขต)\s*/g, '')
        .replace(/\s+/g, '')
        .replace(/\./g, '');

    if (clean.includes('นครศรี') || clean === 'นศ' || clean.toLowerCase().includes('nakhonsi')) return 'สาขานครศรีธรรมราช';
    if (clean.includes('ทุ่งสง') || clean.toLowerCase().includes('thungsong')) return 'สาขาทุ่งสง';
    if (clean.includes('สุราษ') || clean === 'สฎ' || clean.toLowerCase().includes('surat')) return 'สาขาสุราษฎร์ธานี';
    if (clean.includes('พุนพิน') || clean.toLowerCase().includes('phunphin')) return 'สาขาพุนพิน';
    if (clean.includes('สมุย') || clean.toLowerCase().includes('samui')) return 'สาขาสมุย';
    if (clean.includes('พะงัน') || clean.includes('พงัน')) return 'เขตเกาะพะงัน';
    if (clean.includes('หลังสวน')) return 'สาขาหลังสวน';
    if (clean.includes('ชุมพร')) return 'สาขาชุมพร';
    if (clean.includes('ระนอง')) return 'สาขาระนอง';
    if (clean.includes('ตะกั่วป่า')) return 'สาขาตะกั่วป่า';
    if (clean.includes('เกาะยาว')) return 'เขตเกาะยาว';
    if (clean.includes('พังงา')) return 'สาขาพังงา';
    if (clean.includes('กลางคืน') || clean.toLowerCase().includes('night')) return 'เขตกลางคืน';
    if (clean.includes('ภูเก็ต') || clean.includes('ภูเกต')) return 'สาขาภูเก็ต';
    if (clean.includes('กระบี่')) return 'สาขากระบี่';
    if (clean.includes('ตรัง')) return 'สาขาตรัง';
    if (clean.includes('พัทลุง')) return 'สาขาพัทลุง';
    if (clean.includes('สตูล')) return 'สาขาสตูล';
    if (clean.includes('หาดใหญ่') || clean.includes('สงขลา')) return 'สาขาหาดใหญ่';
    if (clean.includes('ปัตตานี')) return 'สาขาปัตตานี';
    if (clean.includes('ยะลา')) return 'สาขายะลา';
    if (clean.includes('นราธิวาส') || clean.includes('สุไหง')) return 'สาขานราธิวาส';

    return s.startsWith('สาขา') || s.startsWith('เขต') ? s : `สาขา${s}`;
}
