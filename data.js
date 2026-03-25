// ============================================
// 🔄 DATA — Fetching, Mapping & Helpers
// ============================================

// --- Fetch branch names from server ---
async function fetchBranches() {
    try {
        const response = await fetch(`${GAS_API_URL}?action=getBranches`);
        const json = await response.json();

        if (json.status === 'success' && json.data) {
            json.data.forEach(b => {
                const id = b.BranchID || b.id || b.code;
                const name = b.BranchName || b.name || b.branch;
                if (id && name) {
                    branchNames[id] = name;
                }
            });
            console.log("Updated Branch List:", branchNames);
        }
    } catch (err) {
        console.log('Branch fetch error (using defaults):', err);
    }
}

// --- Fetch user mapping ---
async function fetchUsers() {
    try {
        const response = await fetch(`${GAS_API_URL}?action=getUsers`);
        const json = await response.json();

        if (json.status === 'success' && json.data) {
            json.data.forEach(u => {
                const uid = u.Userid || u.userid || u.userId || u.UserID;
                const name = u.Name || u.name || u.NAME;
                if (uid && name) {
                    userMapping[uid] = name;
                }
            });
            updateUserDisplay();
        }
    } catch (err) {
        console.log('User fetch error:', err);
    }
}

// --- Main data fetch ---
async function fetchData(isSilent = false) {
    if (!isSilent) toggleLoading(true);
    try {
        const response = await fetch(`${GAS_API_URL}?action=getTrackingData&t=${new Date().getTime()}`);
        const json = await response.json();

        if (json.status === 'success') {
            let mappedData = json.data.map((item, i) => mapRoutingOrderData(item, i));
            globalData = calculateQueueLogic(mappedData);

            mappedData.forEach(item => {
                if (item.branch && item.branch !== '-') uniqueBranches.add(item.branch);
            });

            applyFilters();

            populateBranchFilters();
            updateDailyReport();
            updateMonthlyReport();
        }
    } catch (error) {
        console.error('Fetch Error:', error);
    } finally {
        if (!isSilent) toggleLoading(false);
        isFirstLoad = false;
    }
}

// ============================================
// 🛠 MAPPER & HELPERS
// ============================================

function mapRoutingOrderData(item, index) {
    const dObj = parseDateObject(item.timestamp);
    let displayDate = item.timestamp;
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

    const rawBranch = item.branch || '-';
    const branchName = branchNames[rawBranch] || rawBranch;

    return {
        timestamp: displayDate,
        isoDate: isoDate,
        rawTimestamp: rawTimestamp,
        originalIndex: index || 0,
        branch: branchName,
        deliveryDate: item.targetDate || '-',
        bill: { time: item.timeBill, by: '-' },
        conf: { time: item.timeConf, by: '-' },
        ship: { time: item.timeShip, by: '-' },
        amount: item.currentAmount || '-',
        shipmentAmount: item.Amt_Ship || item.shipmentAmount || '-',
        editCount: parseInt(item.editCount || 0),
        note: item.note,
        processingTime: item.diff2 || '-'
    };
}

function calculateQueueLogic(data) {
    data.sort((a, b) => {
        const timeDiff = a.rawTimestamp - b.rawTimestamp;
        if (timeDiff !== 0) return timeDiff;
        return a.originalIndex - b.originalIndex;
    });

    const queueMap = {};
    const queueWaitMap = {};

    data.forEach(item => {
        if (!item.isoDate) {
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
    if (val instanceof Date) return val;
    const str = val.toString().trim();
    const regex = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:[,\sT]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/;
    const match = str.match(regex);
    if (match) {
        let year = parseInt(match[3]);
        if (match[3].length === 2) year += 2000;
        return new Date(year, parseInt(match[2]) - 1, parseInt(match[1]), match[4] ? parseInt(match[4]) : 0, match[5] ? parseInt(match[5]) : 0);
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

    if (p >= 4) return '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 shadow-sm">เสร็จสิ้น</span>';
    if (isEdit && p < 4) return '<span class="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold border border-orange-200 shadow-sm">แก้ไขบิล</span>';
    if (p === 2) return '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200 shadow-sm">ยืนยันแล้ว</span>';

    if (item.queueWait >= 0) {
        const align = isMobile ? 'items-end' : 'items-center';

        let queueText = "";
        let queueColor = "";

        if (item.queueWait === 0) {
            queueText = "ถึงคิวแล้ว";
            queueColor = "text-ht-green";
        } else {
            queueText = `รออีก ${item.queueWait} คิว`;
            queueColor = "text-ht-red";
        }

        return `
        <div class="flex flex-col ${align}">
            <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200 shadow-sm">งานใหม่</span>
            <span class="text-[10px] ${queueColor} font-bold mt-1 whitespace-nowrap">${queueText}</span>
        </div>`;
    }
    return '<span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold border border-gray-200 shadow-sm">งานใหม่</span>';
}

// ============================================
// 🔄 FILTER & SORT
// ============================================

function setDefaultDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const ids = ['date-mobile', 'date-desktop', 'export-start', 'export-end', 'm-report-date', 'd-report-date'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = today;
    });

    ['m-report-month', 'd-report-month'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = parseInt(month).toString();
    });

    ['m-report-year', 'd-report-year'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = year;
    });
}

function handleSort(column) {
    if (sortState.column === column) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.column = column;
        if (['timestamp', 'amount', 'shipment', 'queue', 'status'].includes(column)) {
            sortState.direction = 'desc';
        } else {
            sortState.direction = 'asc';
        }
    }
    updateSortIcons();
    applyFilters();
}

function handleSortMobile() {
    const val = document.getElementById('mobile-sort-select').value;
    if (val === 'default') {
        sortState = { column: 'default', direction: 'asc' };
    } else {
        const [col, dir] = val.split('_');
        sortState = { column: col, direction: dir };
    }
    applyFilters();
}

function updateSortIcons() {
    document.querySelectorAll('th i').forEach(i => i.className = 'fas fa-sort text-gray-300 ml-1 group-hover:text-ht-red');
    if (sortState.column !== 'default') {
        const icon = document.getElementById(`icon-${sortState.column}`);
        if (icon) {
            icon.className = `fas fa-sort-${sortState.direction === 'asc' ? 'up' : 'down'} text-ht-red ml-1`;
        }
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
            case 'queue':
                valA = parseInt(a.queueNo.replace('#', '')) || 0;
                valB = parseInt(b.queueNo.replace('#', '')) || 0;
                break;
            case 'timestamp':
                valA = a.rawTimestamp;
                valB = b.rawTimestamp;
                break;
            case 'branch':
                valA = a.branch.toLowerCase();
                valB = b.branch.toLowerCase();
                break;
            case 'deliveryDate':
                valA = a.isoDate || '';
                valB = b.isoDate || '';
                break;
            case 'status':
                valA = calculateProgress(a);
                valB = calculateProgress(b);
                break;
            case 'amount':
                valA = parseFloat(String(a.amount).replace(/,/g, '')) || 0;
                valB = parseFloat(String(b.amount).replace(/,/g, '')) || 0;
                break;
            case 'shipment':
                valA = parseFloat(String(a.shipmentAmount).replace(/,/g, '')) || 0;
                valB = parseFloat(String(b.shipmentAmount).replace(/,/g, '')) || 0;
                break;
            default:
                return 0;
        }

        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
    });
}

function syncFilters(source) {
    const searchVal = document.getElementById(`search-${source}`).value;
    const dateVal = document.getElementById(`date-${source}`).value;
    const target = source === 'mobile' ? 'desktop' : 'mobile';
    document.getElementById(`search-${target}`).value = searchVal;
    document.getElementById(`date-${target}`).value = dateVal;
    applyFilters();
}

function applyFilters() {
    const searchQuery = document.getElementById('search-mobile').value.toLowerCase();
    const dateQuery = document.getElementById('date-mobile').value;

    let filtered = globalData.filter(item => {
        const branchStr = String(item.branch || '').toLowerCase();
        const matchesSearch = branchStr.includes(searchQuery);

        let matchesDate = true;
        if (dateQuery) matchesDate = item.isoDate === dateQuery;

        const status = getStatusCode(item);
        const matchesStatus = activeFilters[status];

        return matchesSearch && matchesDate && matchesStatus;
    });

    filtered = sortData(filtered, sortState.column, sortState.direction);

    updateDashboard(filtered);
    renderDashboardTables(filtered);
    renderMobileList(filtered);
    renderDesktopTable(filtered);
}

function toggleStatusFilter(key, isChecked) {
    activeFilters[key] = isChecked;
    const dChk = document.getElementById(`d-chk-${key}`);
    const mChk = document.getElementById(`m-chk-${key}`);
    if (dChk) dChk.checked = isChecked;
    if (mChk) mChk.checked = isChecked;

    if (window.innerWidth >= 768) {
        applyFilters();
    }
}
