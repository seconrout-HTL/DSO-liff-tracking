// ============================================
// 🎨 UI — Rendering & Interactions
// ============================================

const ALLOWED_TABS = new Set(['tracking', 'dashboard', 'report', 'help']);

// --- Custom Toast Notification (No alert/confirm) ---
function showToast(msg, type = 'info') {
    const toast = document.getElementById('app-toast');
    const msgEl = document.getElementById('app-toast-msg');
    const iconEl = document.getElementById('app-toast-icon');
    if (!toast || !msgEl) return;
    msgEl.textContent = sanitizeText(msg, 'แจ้งเตือน', 300);
    if (iconEl) {
        iconEl.className = type === 'error'
            ? 'fas fa-exclamation-circle text-amber-400'
            : 'fas fa-check-circle text-emerald-400';
    }
    toast.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 4000);
}

function hideToast() {
    const toast = document.getElementById('app-toast');
    if (toast) toast.classList.add('hidden');
}

// --- Auth Gate Modal ---
function openAuthGateModal(message) {
    const modal = document.getElementById('auth-gate-modal');
    const msgEl = document.getElementById('auth-gate-message');
    if (msgEl && message) {
        msgEl.textContent = sanitizeText(message, msgEl.textContent, 300);
    }
    if (modal) modal.classList.remove('hidden');
}

function closeAuthGateModal() {
    const modal = document.getElementById('auth-gate-modal');
    if (modal) modal.classList.add('hidden');
}

// --- Loading ---
function toggleLoading(isLoading) {
    document.querySelectorAll('.refresh-icon').forEach(i =>
        isLoading ? i.classList.add('spin-slow') : i.classList.remove('spin-slow')
    );
    if (isFirstLoad) {
        const skeleton = document.getElementById('loading-skeleton-mobile');
        const list = document.getElementById('m-list-container');
        if (skeleton && list) {
            if (isLoading) {
                skeleton.classList.remove('hidden');
                list.classList.add('hidden');
            } else {
                skeleton.classList.add('hidden');
                list.classList.remove('hidden');
            }
        }
    }
}

// ============================================
// 📱 MOBILE RENDERING
// ============================================

function renderMobileList(data) {
    const container = document.getElementById('m-list-container');
    if (!container) return;
    if (data.length === 0) {
        container.innerHTML = `<div class="empty-state py-12"><i class="fas fa-box-open text-4xl mb-2 text-slate-300"></i><p class="text-slate-400 text-sm mt-2">ไม่พบรายการ</p></div>`;
        return;
    }
    container.innerHTML = data.map((item, idx) => {
        const p = calculateProgress(item);
        const hasEdit = (item.editCount > 0);
        let width = '0%';
        if (p >= 4) width = '100%';
        else if (p === 3 || (p === 2 && hasEdit)) width = '64%';
        else if (p === 2) width = '38%';

        const safeQueue = escapeHtml(item.queueNo);
        const safeTimestamp = escapeHtml(item.timestamp);
        const safeBranch = escapeHtml(item.branch);
        const safeAmount = escapeHtml(item.amount);
        const safeDelivery = escapeHtml(item.deliveryDate);
        const safeShipment = escapeHtml(item.shipmentAmount);
        const safeEditCount = escapeHtml(String(item.editCount));
        const safeNote = item.note ? escapeHtml(item.note) : '';

        return `
        <div class="order-card rounded-2xl p-4 mb-3 animate-fade-in stagger-${(idx % 4) + 1}">
            <div class="flex justify-between mb-3">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="queue-badge text-[11px] px-2 py-0.5">${safeQueue}</span>
                        <div class="font-bold text-slate-800 text-base tracking-tight">${safeTimestamp}</div>
                    </div>
                    <div class="text-xs text-slate-400 mt-1">
                        <span class="font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">${safeBranch}</span>
                    </div>
                </div>
                <div class="text-right">
                     <div class="text-[10px] font-medium text-slate-400 uppercase">DO Amount</div>
                     <div class="text-xl font-bold text-slate-900 leading-none mb-1">${safeAmount}</div>
                     ${getStatusBadge(item, true)}
                </div>
            </div>
            <div class="flex gap-2 mb-4">
                 <div class="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex-1 flex items-center">
                    <i class="fas fa-truck text-slate-400 mr-1.5"></i>Deliver: <span class="font-semibold ml-1 text-slate-700">${safeDelivery}</span>
                </div>
                <div class="text-xs text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 min-w-[85px] text-center">
                    <span class="text-[10px] text-blue-500 font-medium block">Shipment</span>
                    <span class="font-bold text-base text-blue-700">${safeShipment}</span>
                </div>
            </div>
            <div class="relative px-1 pb-1 mt-2">
                <div class="absolute left-0 right-0 top-[5px] h-[4px] bg-slate-100 z-0 rounded-full"></div>
                <div class="absolute left-0 top-[5px] h-[4px] bg-gradient-to-r from-blue-600 to-emerald-500 z-0 transition-all duration-700 rounded-full" style="width: ${width}"></div>
                <div class="flex justify-between relative z-10 text-[9px] text-center">
                    ${renderMobileNode('งานใหม่', item.bill, true, 'bg-blue-600')}
                    ${renderMobileNode('ยืนยัน', item.conf, p >= 2, 'bg-blue-600')}
                    ${renderMobileNode(hasEdit ? 'แก้บิล' : '', { time: hasEdit ? `${safeEditCount} ครั้ง` : '' }, hasEdit, 'bg-amber-500', true)}
                    ${renderMobileNode('เสร็จสิ้น', item.ship, p >= 4, 'bg-emerald-500')}
                </div>
            </div>
            ${safeNote ? `<div class="mt-2.5 text-[11px] text-amber-700 bg-amber-50/70 p-2 rounded-xl border border-amber-100"><i class="far fa-comment-dots mr-1"></i>${safeNote}</div>` : ''}
        </div>`;
    }).join('');
}

function renderMobileNode(label, detail, isActive, colorClass, isEditNode = false) {
    if (isEditNode && !isActive) return `<div class="flex flex-col items-center w-1/4"><div class="w-2.5 h-2.5 rounded-full bg-slate-200 mt-0.5 mb-1 border-2 border-white"></div></div>`;
    const circle = isActive ? `w-3.5 h-3.5 ${colorClass} border-2 border-white shadow-sm` : `w-3.5 h-3.5 bg-slate-200 border-2 border-white`;
    const text = isActive ? 'text-slate-700 font-semibold' : 'text-slate-300';
    const safeLabel = escapeHtml(label);
    const safeTime = escapeHtml((detail && detail.time) ? detail.time : '-');
    return `
    <div class="flex flex-col items-center w-1/4">
        <div class="${circle} rounded-full mb-1"></div>
        <span class="${text}">${safeLabel}</span>
        <span class="text-slate-400 scale-90">${safeTime}</span>
    </div>`;
}

// ============================================
// 🖥 DESKTOP RENDERING
// ============================================

function renderDesktopTable(data) {
    const tbody = document.getElementById('d-table-body');
    if (!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-12 text-center text-slate-400"><i class="fas fa-inbox text-3xl mb-2 block text-slate-300"></i>ไม่พบข้อมูลที่ค้นหา</td></tr>';
        return;
    }
    tbody.innerHTML = data.map(item => {
        const p = calculateProgress(item);
        const hasEdit = (item.editCount > 0);
        let barWidth = '0%';
        if (p >= 4) barWidth = '76%';
        else if (p === 3 || (p === 2 && hasEdit)) barWidth = '52%';
        else if (p === 2) barWidth = '26%';

        const safeQueue = escapeHtml(item.queueNo);
        const safeTimestamp = escapeHtml(item.timestamp);
        const safeBranch = escapeHtml(item.branch);
        const safeDelivery = escapeHtml(item.deliveryDate);
        const safeAmount = escapeHtml(item.amount);
        const safeShipment = escapeHtml(item.shipmentAmount);

        return `
        <tr class="hover:bg-slate-50/80 transition border-b border-slate-100 last:border-0 group">
            <td class="p-4 align-middle text-center"><span class="queue-badge px-2.5 py-1 text-xs">${safeQueue}</span></td>
            <td class="p-4 align-middle"><div class="font-semibold text-slate-800 text-sm">${safeTimestamp}</div></td>
            <td class="p-4 align-middle text-center"><span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">${safeBranch}</span></td>
            <td class="p-4 align-middle text-center text-slate-600 text-xs font-medium">${safeDelivery}</td>
            <td class="p-4 align-middle text-center">${getStatusBadge(item, false)}</td>
            <td class="p-4 align-middle">
                <div class="timeline-container">
                    <div class="timeline-line-bg"></div>
                    <div class="timeline-line-progress" style="width: ${barWidth}"></div>
                    <div class="flex justify-between relative z-10 px-2">
                        ${renderDesktopNode('งานใหม่', item.bill, true, 'border-blue-600', 'bg-blue-600')}
                        ${renderDesktopNode('ยืนยันแล้ว', item.conf, p >= 2, 'border-blue-600', 'bg-blue-600')}
                        ${renderEditNodeDesktop(hasEdit, item.editCount, item.note)}
                        ${renderDesktopNode('เสร็จสิ้น', item.ship, p >= 4, 'border-emerald-500', 'bg-emerald-500')}
                    </div>
                </div>
            </td>
            <td class="p-4 align-middle text-right font-bold text-slate-900 text-base">${safeAmount}</td>
            <td class="p-4 align-middle text-right font-bold text-blue-600 text-base">${safeShipment}</td>
        </tr>`;
    }).join('');
}

function renderDesktopNode(label, detail, isActive, borderColor, activeBg = 'bg-blue-600') {
    const circleStyle = isActive ? `bg-white border-2 ${borderColor}` : 'bg-slate-200 border-2 border-white';
    const dotStyle = isActive ? `w-2 h-2 rounded-full ${activeBg}` : '';
    const labelColor = isActive ? 'text-slate-700 font-semibold' : 'text-slate-300';
    const safeLabel = escapeHtml(label);
    const safeTime = escapeHtml((detail && detail.time) ? detail.time : '-');
    return `
    <div class="flex flex-col items-center w-1/4 relative group/node">
        <div class="w-4 h-4 rounded-full ${circleStyle} flex items-center justify-center mb-1 shadow-sm z-10">
            <div class="${dotStyle}"></div>
        </div>
        <div class="text-[10px] text-center w-full">
            <div class="${labelColor}">${safeLabel}</div>
            <div class="text-slate-400 font-mono scale-90">${safeTime}</div>
        </div>
    </div>`;
}

function renderEditNodeDesktop(hasEdit, count, note) {
    if (!hasEdit) return `<div class="flex flex-col items-center w-1/4"><div class="w-3 h-3 rounded-full bg-slate-200 mt-0.5 mb-1 border-2 border-white"></div></div>`;
    const safeCount = escapeHtml(String(count));
    const safeNoteAttr = note ? escapeHtml(note) : '';
    return `
    <div class="flex flex-col items-center w-1/4">
        <div class="w-4 h-4 rounded-full bg-white border-2 border-amber-500 flex items-center justify-center mb-1 shadow-sm z-10">
            <div class="w-2 h-2 rounded-full bg-amber-500"></div>
        </div>
        <div class="text-[10px] text-center">
            <div class="text-amber-600 font-semibold">แก้บิล</div>
            <div class="text-slate-400 scale-90">${safeCount} ครั้ง</div>
            ${safeNoteAttr ? `<div class="text-slate-400 scale-90 cursor-help" title="${safeNoteAttr}"><i class="far fa-comment-dots"></i></div>` : ''}
        </div>
    </div>`;
}

// ============================================
// 📑 TAB SWITCHING
// ============================================

function switchMobileTab(tab, el) {
    if (!ALLOWED_TABS.has(tab)) return;
    document.querySelectorAll('.mobile-nav-item').forEach(item => item.classList.remove('active'));
    const targetEl = el || document.querySelector(`.mobile-nav-item[data-tab="${tab}"]`);
    if (targetEl) targetEl.classList.add('active');
    document.querySelectorAll('.mobile-page').forEach(page => page.classList.add('hidden'));
    const pageEl = document.getElementById(`m-page-${tab}`);
    if (pageEl) pageEl.classList.remove('hidden');
    if (tab === 'report') setTimeout(() => { switchReportType('daily'); }, 100);
    if (tab === 'dashboard' && typeof invalidateMaps === 'function') invalidateMaps();
}

function switchDesktopTab(tab) {
    if (!ALLOWED_TABS.has(tab)) return;
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
    const dNavTab = document.getElementById(`d-nav-${tab}`);
    if (dNavTab) dNavTab.classList.add('active');
    document.querySelectorAll('.desktop-page').forEach(el => el.classList.add('hidden'));
    const dPageTab = document.getElementById(`d-page-${tab}`);
    if (dPageTab) dPageTab.classList.remove('hidden');
    const titles = {
        tracking: 'งานล่าสุด (Recent List)',
        dashboard: 'แดชบอร์ด (Dashboard)',
        report: 'รายงาน (Reports)',
        help: 'ช่วยเหลือ (Get Started)'
    };
    const titleEl = document.getElementById('desktop-page-title');
    if (titleEl) titleEl.textContent = titles[tab] || 'Fleet Order';
    if (tab === 'report') setTimeout(() => { switchReportType('daily'); }, 100);
    if (tab === 'dashboard' && typeof invalidateMaps === 'function') invalidateMaps();
}

function toggleAccordion(element) {
    if (element) element.classList.toggle('active');
}

// ============================================
// 📤 MODAL & FILTER
// ============================================

function openMobileFilter() {
    const modal = document.getElementById('mobile-filter-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeMobileFilter() {
    const modal = document.getElementById('mobile-filter-modal');
    if (modal) modal.classList.add('hidden');
    applyFilters();
}

function toggleDesktopFilter(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('desktop-filter-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function openExportModal() {
    const modal = document.getElementById('export-modal');
    const content = document.getElementById('export-modal-content');
    if (!modal || !content) return;
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
    if (!modal || !content) return;
    content.classList.remove('entered');
    content.classList.add('entering');
    setTimeout(() => { modal.classList.add('hidden'); }, 200);
}

function manualRefresh() {
    toggleLoading(true);
    fetchData(false);
}
