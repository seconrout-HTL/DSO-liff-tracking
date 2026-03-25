// ============================================
// 🎨 UI — Rendering & Interactions
// ============================================

// --- Loading ---
function toggleLoading(isLoading) {
    document.querySelectorAll('.refresh-icon').forEach(i =>
        isLoading ? i.classList.add('spin-slow') : i.classList.remove('spin-slow')
    );
    if (isFirstLoad) {
        const skeleton = document.getElementById('loading-skeleton-mobile');
        const list = document.getElementById('m-list-container');
        isLoading
            ? (skeleton.classList.remove('hidden'), list.classList.add('hidden'))
            : (skeleton.classList.add('hidden'), list.classList.remove('hidden'));
    }
}

// ============================================
// 📱 MOBILE RENDERING
// ============================================

function renderMobileList(data) {
    const container = document.getElementById('m-list-container');
    if (data.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-10">
                <i class="fas fa-box-open text-4xl mb-2 text-gray-300"></i>
                <p class="text-gray-400 text-sm mt-2">ไม่พบรายการ</p>
            </div>`;
        return;
    }
    container.innerHTML = data.map((item, idx) => {
        const p = calculateProgress(item);
        const hasEdit = (item.editCount > 0);
        let width = '0%';
        if (p >= 4) width = '100%';
        else if (p === 3 || (p === 2 && hasEdit)) width = '64%';
        else if (p === 2) width = '38%';

        return `
        <div class="order-card rounded-2xl p-4 mb-3 animate-fade-in stagger-${(idx % 4) + 1}">
            <div class="flex justify-between mb-2">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="queue-badge text-[10px] px-2 py-0.5">${item.queueNo}</span>
                        <div class="font-bold text-gray-800 text-lg tracking-tight">${item.timestamp}</div>
                    </div>
                    <div class="text-xs text-gray-400 mt-0.5">
                        <span class="font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">${item.branch}</span>
                    </div>
                </div>
                <div class="text-right">
                     <div class="text-xs text-gray-400">DO</div>
                     <div class="text-xl font-bold text-ht-red leading-none">${item.amount}</div>
                     ${getStatusBadge(item, true)}
                </div>
            </div>
            <div class="flex gap-2 mb-4">
                 <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-100 flex-1">
                    <i class="fas fa-truck text-gray-400 mr-1"></i>Deliver: <span class="font-medium ml-1 text-gray-700">${item.deliveryDate}</span>
                </div>
                <div class="text-xs text-white bg-ht-blue p-2 rounded-lg border border-blue-600 min-w-[80px] text-center shadow-sm">
                    Shipment<br><span class="font-bold text-lg">${item.shipmentAmount}</span>
                </div>
            </div>
            <div class="relative px-1 pb-2 mt-2">
                <div class="absolute left-0 right-0 top-[6px] h-[2px] bg-gray-100 z-0 rounded-full"></div>
                <div class="absolute left-0 top-[6px] h-[2px] bg-ht-green z-0 transition-all duration-700 rounded-full" style="width: ${width}"></div>
                <div class="flex justify-between relative z-10 text-[9px] text-center">
                    ${renderMobileNode('งานใหม่', item.bill, true, 'bg-ht-green')}
                    ${renderMobileNode('ยืนยัน', item.conf, p >= 2, 'bg-blue-500')}
                    ${renderMobileNode(hasEdit ? 'แก้บิล' : '', { time: hasEdit ? item.editCount + ' ครั้ง' : '' }, hasEdit, 'bg-ht-orange', true)}
                    ${renderMobileNode('เสร็จสิ้น', item.ship, p >= 4, 'bg-green-600')}
                </div>
            </div>
            ${item.note ? `<div class="mt-2 text-[10px] text-gray-400 bg-yellow-50 p-2 rounded-lg border border-yellow-100"><i class="far fa-comment-dots mr-1"></i>${item.note}</div>` : ''}
        </div>`;
    }).join('');
}

function renderMobileNode(label, detail, isActive, colorClass, isEditNode = false) {
    if (isEditNode && !isActive) return `<div class="flex flex-col items-center w-1/4"><div class="w-2 h-2 rounded-full bg-gray-200 mt-0.5 mb-1"></div></div>`;
    const circle = isActive ? `w-3 h-3 ${colorClass} border border-white shadow-sm` : `w-3 h-3 bg-gray-200 border border-white`;
    const text = isActive ? 'text-gray-600 font-bold' : 'text-gray-300';
    return `
    <div class="flex flex-col items-center w-1/4">
        <div class="${circle} rounded-full mb-1"></div>
        <span class="${text}">${label}</span>
        <span class="text-gray-400 scale-90">${detail?.time || '-'}</span>
    </div>`;
}

// ============================================
// 🖥 DESKTOP RENDERING
// ============================================

function renderDesktopTable(data) {
    const tbody = document.getElementById('d-table-body');
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-10 text-center text-gray-400"><i class="fas fa-inbox text-3xl mb-2 block text-gray-300"></i>ไม่พบข้อมูลที่ค้นหา</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(item => {
        const p = calculateProgress(item);
        const hasEdit = (item.editCount > 0);
        let barWidth = '0%';
        if (p >= 4) barWidth = '76%';
        else if (p === 3 || (p === 2 && hasEdit)) barWidth = '52%';
        else if (p === 2) barWidth = '26%';

        return `
        <tr class="hover:bg-red-50/30 transition border-b border-gray-50 last:border-0 group">
            <td class="p-4 align-top text-center">
                <span class="queue-badge px-3 py-1 text-xs">${item.queueNo}</span>
            </td>
            <td class="p-4 align-top">
                <div class="font-bold text-gray-800 text-lg">${item.timestamp}</div>
            </td>
            <td class="p-4 align-top text-center">
                <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm border border-gray-200 font-medium">${item.branch}</span>
            </td>
            <td class="p-4 align-top text-center text-gray-600 font-medium">
                ${item.deliveryDate}
            </td>
            <td class="p-4 align-top text-center">
                ${getStatusBadge(item, false)}
            </td>
            <td class="p-4 align-middle">
                <div class="timeline-container">
                    <div class="timeline-line-bg"></div>
                    <div class="timeline-line-progress" style="width: ${barWidth}"></div>
                    <div class="flex justify-between relative z-10 px-2">
                        ${renderDesktopNode('งานใหม่', item.bill, true, 'border-gray-300')}
                        ${renderDesktopNode('ยืนยันแล้ว', item.conf, p >= 2, 'border-blue-400', 'bg-blue-400')}
                        ${renderEditNodeDesktop(hasEdit, item.editCount, item.note)}
                        ${renderDesktopNode('เสร็จสิ้น', item.ship, p >= 4, 'border-green-500', 'bg-green-500')}
                    </div>
                </div>
            </td>
            <td class="p-4 align-top text-right font-bold text-ht-red text-lg">${item.amount}</td>
            <td class="p-4 align-top text-right font-bold text-ht-blue text-lg">${item.shipmentAmount}</td>
        </tr>`;
    }).join('');
}

function renderDesktopNode(label, detail, isActive, borderColor, activeBg = 'bg-ht-green') {
    const circleStyle = isActive ? `bg-white border-2 ${borderColor}` : 'bg-gray-200 border-2 border-transparent';
    const dotStyle = isActive ? `w-2 h-2 rounded-full ${activeBg}` : '';
    const labelColor = isActive ? 'text-gray-700 font-bold' : 'text-gray-300';

    return `
    <div class="flex flex-col items-center w-1/4 relative group/node">
        <div class="w-4 h-4 rounded-full ${circleStyle} flex items-center justify-center mb-1 shadow-sm z-10">
            <div class="${dotStyle}"></div>
        </div>
        <div class="text-[10px] text-center w-full">
            <div class="${labelColor}">${label}</div>
            <div class="text-gray-400 font-mono scale-90">${detail?.time || '-'}</div>
        </div>
    </div>`;
}

function renderEditNodeDesktop(hasEdit, count, note) {
    if (!hasEdit) return `<div class="flex flex-col items-center w-1/4"><div class="w-3 h-3 rounded-full bg-gray-200 mt-0.5 mb-1"></div></div>`;
    return `
    <div class="flex flex-col items-center w-1/4">
        <div class="w-4 h-4 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center mb-1 shadow-sm z-10">
            <div class="w-2 h-2 rounded-full bg-orange-400"></div>
        </div>
        <div class="text-[10px] text-center">
            <div class="text-orange-500 font-bold">แก้บิล</div>
            <div class="text-gray-400 scale-90">${count} ครั้ง</div>
            ${note ? `<div class="text-gray-400 scale-90 cursor-help" title="${note}"><i class="far fa-comment-dots"></i></div>` : ''}
        </div>
    </div>`;
}

// ============================================
// 📑 TAB SWITCHING
// ============================================

function switchMobileTab(tab) {
    document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.querySelectorAll('.mobile-page').forEach(el => el.classList.add('hidden'));
    document.getElementById(`m-page-${tab}`).classList.remove('hidden');

    if (tab === 'report') {
        setTimeout(() => { switchReportType('daily'); }, 100);
    }
}

function switchDesktopTab(tab) {
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    const dNavTab = document.getElementById(`d-nav-${tab}`);
    if (dNavTab) dNavTab.classList.add('active');
    document.querySelectorAll('.desktop-page').forEach(el => el.classList.add('hidden'));
    const dPageTab = document.getElementById(`d-page-${tab}`);
    if (dPageTab) dPageTab.classList.remove('hidden');

    const titles = {
        'tracking': 'งานล่าสุด (Recent List)',
        'dashboard': 'แดชบอร์ด (Dashboard)',
        'report': 'รายงาน (Report)',
        'help': 'ช่วยเหลือ (Help Center)'
    };
    document.getElementById('desktop-page-title').innerText = titles[tab] || 'Fleet Order';

    if (tab === 'report') {
        setTimeout(() => { switchReportType('daily'); }, 100);
    }
}

function toggleAccordion(element) {
    element.classList.toggle('active');
}

// ============================================
// 📤 MODAL & FILTER
// ============================================

function openMobileFilter() {
    document.getElementById('mobile-filter-modal').classList.remove('hidden');
}

function closeMobileFilter() {
    document.getElementById('mobile-filter-modal').classList.add('hidden');
    applyFilters();
}

function toggleDesktopFilter(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('desktop-filter-dropdown');
    dropdown.classList.toggle('hidden');
}

function openExportModal() {
    const modal = document.getElementById('export-modal');
    const content = document.getElementById('export-modal-content');
    modal.classList.remove('hidden');
    content.classList.add('entering');
    setTimeout(() => {
        content.classList.remove('entering');
        content.classList.add('entered');
    }, 10);
}

function closeExportModal() {
    const modal = document.getElementById('export-modal');
    const content = document.getElementById('export-modal-content');
    content.classList.remove('entered');
    content.classList.add('entering');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function manualRefresh() {
    toggleLoading(true);
    fetchData(false);
}
