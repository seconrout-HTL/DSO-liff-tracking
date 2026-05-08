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

// Tailwind config override
tailwind.config = {
    theme: {
        extend: {
            colors: {
                'ht-red': '#E41E2B',
                'ht-green': '#007A33',
                'ht-orange': '#F59E0B',
                'ht-blue': '#0056b3',
                'ht-gray': '#F4F4F4',
                'excel-green': '#1D6F42',
            }
        }
    }
};

// --- Global State ---
let branchNames = {};
let globalData = [];
let uniqueBranches = new Set();
let isFirstLoad = true;
let sortState = { column: 'default', direction: 'asc' };
let activeFilters = { new: true, conf: true, edit: true, ship: true };
let freqChartInstance = null;
let mFreqChartInstance = null;
let userMapping = {};
let currentUserId = null;
