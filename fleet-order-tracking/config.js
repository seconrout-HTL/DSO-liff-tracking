// ============================================
// ⚙️ CONFIG — Settings & Constants
// ============================================

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbw02Dz7EsUdN2NZn6wdvtjbKNTz5_TJfZqSH7QX0jogmTgXn-qui-HIqyHSN0yv_Kfi/exec';
const LIFF_ID = '2008983827-ZbZI2YWu'; // ⚠️ ใส่ LIFF ID ของคุณที่นี่

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
