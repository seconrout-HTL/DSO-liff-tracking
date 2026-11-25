// ============================================
// 📊 DASHBOARD — Stats, Charts & Reports
// ============================================

function updateDashboard(data) {
    const stats = { total: data.length, new: 0, conf: 0, edit: 0, shipped: 0 };
    data.forEach(item => {
        const p = calculateProgress(item);
        const hasEdit = item.editCount > 0;
        if (p >= 4) stats.shipped++;
        else if (p === 2) { stats.conf++; if (hasEdit) stats.edit++; }
        else stats.new++;
    });
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = String(val); };
    setTxt('m-dash-total', stats.total); setTxt('m-dash-new', stats.new);
    setTxt('m-dash-conf', stats.conf); setTxt('m-dash-shipped', stats.shipped);
    setTxt('d-dash-total', stats.total); setTxt('d-dash-new', stats.new);
    setTxt('d-dash-conf', stats.conf); setTxt('d-dash-shipped', stats.shipped);
}

function renderDashboardTables(filteredData) {
    renderFrequencyChart(filteredData);
    renderFrequencyTable(globalData);
    renderBranchStatusTable(filteredData);
}

// ============================================
// 📈 FREQUENCY CHART & TABLE
// ============================================

function buildFrequencyChartConfig(slots) {
    const labels = ['<16:00', '16-17:00', '17-17:30', '17:30-18', '18-18:30', '>18:30'];
    const maxVal = Math.max(...slots, 5);
    const bgTrack = slots.map(() => maxVal);

    return {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'จำนวนงาน (Orders)',
                    data: [...slots],
                    backgroundColor: '#2563EB',
                    hoverBackgroundColor: '#1D4ED8',
                    borderRadius: 999,
                    borderSkipped: false,
                    barThickness: 14,
                    order: 1
                },
                {
                    label: 'เพดานงาน',
                    data: bgTrack,
                    backgroundColor: '#EEF2FF',
                    hoverBackgroundColor: '#E0E7FF',
                    borderRadius: 999,
                    borderSkipped: false,
                    barThickness: 14,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: false,
                    border: { display: false },
                    ticks: { stepSize: 1, color: '#94A3B8', font: { size: 11 } },
                    grid: { color: '#F1F5F9' }
                },
                x: {
                    stacked: true,
                    border: { display: false },
                    ticks: { color: '#64748B', font: { size: 10, weight: '600' } },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    filter: (tooltipItem) => tooltipItem.datasetIndex === 0
                }
            },
            interaction: { intersect: false, mode: 'index' }
        }
    };
}

function renderFrequencyChart(currentDayData) {
    if (typeof Chart === 'undefined') return;
    const slots = [0, 0, 0, 0, 0, 0];
    currentDayData.forEach(item => {
        const parts = String(item.timestamp || '').split(' ');
        if (!parts[1]) return;
        const timeParts = parts[1].split(':');
        const h = parseInt(timeParts[0], 10);
        const m = parseInt(timeParts[1], 10);
        if (isNaN(h) || isNaN(m)) return;
        const minutes = h * 60 + m;
        if (minutes <= 960) slots[0]++;
        else if (minutes <= 1020) slots[1]++;
        else if (minutes <= 1050) slots[2]++;
        else if (minutes <= 1080) slots[3]++;
        else if (minutes <= 1110) slots[4]++;
        else slots[5]++;
    });

    const mCanvas = document.getElementById('m-freq-chart');
    if (mCanvas) {
        const ctxM = mCanvas.getContext('2d');
        if (mFreqChartInstance) mFreqChartInstance.destroy();
        mFreqChartInstance = new Chart(ctxM, buildFrequencyChartConfig(slots));
    }

    const dCanvas = document.getElementById('d-freq-chart');
    if (dCanvas) {
        const ctxD = dCanvas.getContext('2d');
        if (freqChartInstance) freqChartInstance.destroy();
        freqChartInstance = new Chart(ctxD, buildFrequencyChartConfig(slots));
    }
}

function renderFrequencyTable(allData) {
    const freqMap = createSafeMap();
    allData.forEach(item => {
        if (!item.isoDate || !isSafeDictKey(item.isoDate)) return;
        if (!freqMap[item.isoDate]) {
            freqMap[item.isoDate] = {
                iso: item.isoDate,
                d: String(item.timestamp || '').split(' ')[0] || item.isoDate,
                s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, s6: 0
            };
        }
        const parts = String(item.timestamp || '').split(' ');
        if (!parts[1]) return;
        const timeParts = parts[1].split(':');
        const h = parseInt(timeParts[0], 10);
        const m = parseInt(timeParts[1], 10);
        if (isNaN(h) || isNaN(m)) return;
        const minutes = h * 60 + m;
        if (minutes <= 960) freqMap[item.isoDate].s1++;
        else if (minutes <= 1020) freqMap[item.isoDate].s2++;
        else if (minutes <= 1050) freqMap[item.isoDate].s3++;
        else if (minutes <= 1080) freqMap[item.isoDate].s4++;
        else if (minutes <= 1110) freqMap[item.isoDate].s5++;
        else freqMap[item.isoDate].s6++;
    });
    const freqArr = Object.values(freqMap).sort((a, b) => b.iso.localeCompare(a.iso)).slice(0, 10);
    const createRow = (row) => `
        <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition">
            <td class="p-2.5 text-left font-semibold text-slate-700">${escapeHtml(row.d)}</td>
            <td class="p-2.5 text-slate-500">${row.s1 || '-'}</td>
            <td class="p-2.5 text-slate-500">${row.s2 || '-'}</td>
            <td class="p-2.5 text-slate-500">${row.s3 || '-'}</td>
            <td class="p-2.5 text-slate-500">${row.s4 || '-'}</td>
            <td class="p-2.5 text-slate-500">${row.s5 || '-'}</td>
            <td class="p-2.5 text-slate-500">${row.s6 || '-'}</td>
        </tr>`;
    const rows = freqArr.map(createRow).join('');
    const mBody = document.getElementById('m-freq-table-body');
    const dBody = document.getElementById('d-freq-table-body');
    if (mBody) mBody.innerHTML = rows || '<tr><td colspan="7" class="p-4 text-center text-slate-400">ไม่มีข้อมูล</td></tr>';
    if (dBody) dBody.innerHTML = rows || '<tr><td colspan="7" class="p-4 text-center text-slate-400">ไม่มีข้อมูล</td></tr>';
}

// ============================================
// 🏢 BRANCH STATUS TABLE
// ============================================

function renderBranchStatusTable(currentData) {
    const activeBranches = createSafeMap();
    const rank = { new: 4, edit: 3, conf: 2, ship: 1 };
    currentData.forEach(item => {
        const bName = getCanonicalBranch(item.branch);
        if (!isSafeDictKey(bName)) return;
        const timeStr = String(item.timestamp || '').split(' ')[1] || '';
        if (!activeBranches[bName]) {
            activeBranches[bName] = { status: getStatusCode(item), time: timeStr, count: 0 };
        }
        activeBranches[bName].count++;
        const st = getStatusCode(item);
        const cur = activeBranches[bName].status;
        if ((rank[st] || 0) > (rank[cur] || 0)) {
            activeBranches[bName].status = st;
            activeBranches[bName].time = timeStr;
        }
    });

    const missingBranches = [];
    const allKnownBranches = Array.from(new Set([
        ...MASTER_SOUTHERN_BRANCHES,
        ...Object.values(branchNames).map(getCanonicalBranch)
    ]));
    allKnownBranches.forEach(b => {
        if (b && b !== '-' && isSafeDictKey(b) && !activeBranches[b]) missingBranches.push(b);
    });
    missingBranches.sort();

    let html = '';
    if (missingBranches.length > 0) {
        html += `<div class="mb-2 text-xs font-semibold text-rose-500">ยังไม่แจ้งงาน (${missingBranches.length})</div>`;
        html += `<div class="flex flex-wrap gap-1.5 mb-4">`;
        missingBranches.forEach(b => {
            const safeBranch = escapeHtml(b);
            html += `<button type="button" data-action="focus-branch" data-branch="${safeBranch}" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-lg border border-rose-100 transition cursor-pointer">${safeBranch}</button>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="mb-4 text-center text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">ครบทุกสาขาแล้ว</div>`;
    }

    const activeEntries = Object.entries(activeBranches);
    if (activeEntries.length > 0) {
        html += `<div class="mb-2 text-xs font-semibold text-slate-400">แจ้งงานแล้ว (${activeEntries.length})</div>`;
        activeEntries.forEach(([name, info]) => {
            let color = 'text-rose-600', barColor = 'bg-rose-500', pct = '30%', statusTxt = 'งานใหม่';
            if (info.status === 'conf') { color = 'text-blue-600'; barColor = 'bg-blue-500'; pct = '68%'; statusTxt = 'ยืนยันแล้ว'; }
            else if (info.status === 'ship') { color = 'text-emerald-600'; barColor = 'bg-emerald-500'; pct = '100%'; statusTxt = 'เสร็จสิ้น'; }
            else if (info.status === 'edit') { color = 'text-amber-600'; barColor = 'bg-amber-500'; pct = '50%'; statusTxt = 'แก้ไขบิล'; }
            const safeName = escapeHtml(name);
            const safeTime = escapeHtml(info.time || '-');
            html += `
            <div data-action="focus-branch" data-branch="${safeName}" role="button" tabindex="0" class="p-3 bg-slate-50/70 rounded-xl border border-slate-100 mb-2 hover:bg-blue-50/40 hover:border-blue-200 transition cursor-pointer">
                <div class="flex justify-between items-center mb-1.5">
                    <div class="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                        <span>${safeName}</span>
                        <span class="px-1.5 py-0.5 bg-white text-slate-600 rounded text-[10px] border border-slate-200">${info.count} งาน</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs ${color} font-semibold">${statusTxt}</span>
                        <span class="text-[11px] text-slate-400">${safeTime} น.</span>
                    </div>
                </div>
                <div class="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                    <div class="h-full ${barColor} rounded-full transition-all duration-500" style="width: ${pct}"></div>
                </div>
            </div>`;
        });
    } else {
        html += `<div class="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl mb-2">ไม่มีข้อมูลการแจ้งงาน</div>`;
    }

    const mContainer = document.getElementById('m-branch-status-container');
    const dContainer = document.getElementById('d-branch-status-container');
    if (mContainer) mContainer.innerHTML = html;
    if (dContainer) dContainer.innerHTML = html;
}

// ============================================
// 📄 REPORT LOGIC
// ============================================

function populateBranchFilters() {
    const sortedBranches = Array.from(uniqueBranches).sort();
    ['m-branch-filter', 'd-branch-filter'].forEach(id => {
        const selectEl = document.getElementById(id);
        if (!selectEl) return;
        const prevVal = selectEl.value;
        selectEl.textContent = '';

        const allOpt = document.createElement('option');
        allOpt.value = '';
        allOpt.textContent = 'ทุกสาขา';
        selectEl.appendChild(allOpt);

        sortedBranches.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = b;
            selectEl.appendChild(opt);
        });

        if (prevVal && sortedBranches.includes(prevVal)) {
            selectEl.value = prevVal;
        }
    });
}

function switchReportType(type) {
    const safeType = type === 'monthly' ? 'monthly' : 'daily';
    const dBtnDaily = document.getElementById('d-btn-daily');
    const dBtnMonthly = document.getElementById('d-btn-monthly');
    const mBtnDaily = document.getElementById('m-btn-daily');
    const mBtnMonthly = document.getElementById('m-btn-monthly');
    if (safeType === 'daily') {
        if (dBtnDaily) dBtnDaily.className = 'report-btn active p-4 rounded-xl font-medium transition flex items-center justify-center gap-3';
        if (dBtnMonthly) dBtnMonthly.className = 'report-btn p-4 rounded-xl font-medium transition flex items-center justify-center gap-3';
        if (mBtnDaily) mBtnDaily.className = 'report-btn active p-3 rounded-xl text-sm font-medium transition';
        if (mBtnMonthly) mBtnMonthly.className = 'report-btn p-3 rounded-xl text-sm font-medium transition';
        ['d-daily-report', 'm-daily-report'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); });
        ['d-monthly-report', 'm-monthly-report'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
    } else {
        if (dBtnDaily) dBtnDaily.className = 'report-btn p-4 rounded-xl font-medium transition flex items-center justify-center gap-3';
        if (dBtnMonthly) dBtnMonthly.className = 'report-btn active p-4 rounded-xl font-medium transition flex items-center justify-center gap-3';
        if (mBtnDaily) mBtnDaily.className = 'report-btn p-3 rounded-xl text-sm font-medium transition';
        if (mBtnMonthly) mBtnMonthly.className = 'report-btn active p-3 rounded-xl text-sm font-medium transition';
        ['d-daily-report', 'm-daily-report'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
        ['d-monthly-report', 'm-monthly-report'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.remove('hidden'); });
    }
}

function updateDailyReport(source) {
    let activeDate = '';
    const mDateEl = document.getElementById('m-report-date');
    const dDateEl = document.getElementById('d-report-date');
    if (source === 'mobile' && mDateEl) {
        activeDate = mDateEl.value;
        if (dDateEl) dDateEl.value = activeDate;
    } else if (source === 'desktop' && dDateEl) {
        activeDate = dDateEl.value;
        if (mDateEl) mDateEl.value = activeDate;
    } else {
        activeDate = (dDateEl && dDateEl.value) || (mDateEl && mDateEl.value) || '';
    }
    const reportData = globalData.filter(item => item.isoDate === activeDate);
    renderDetailTable(reportData);
}

function renderDetailTable(data) {
    const mBODY = document.getElementById('m-detail-table-body');
    const dBODY = document.getElementById('d-detail-table-body');
    const sortedData = [...data].sort((a, b) => b.rawTimestamp - a.rawTimestamp);
    let html = '';
    if (sortedData.length === 0) {
        html = '<tr><td colspan="8" class="p-6 text-center text-slate-400">ไม่พบข้อมูลตามวันที่เลือก</td></tr>';
    } else {
        html = sortedData.map(row => {
            const dateParts = String(row.timestamp || '').split(' ');
            const notiDate = escapeHtml(dateParts[0] || '-');
            const notiTime = escapeHtml((row.bill && row.bill.time) ? row.bill.time : '-');
            const confTime = escapeHtml((row.conf && row.conf.time) ? row.conf.time : '-');
            const shipTime = escapeHtml((row.ship && row.ship.time) ? row.ship.time : '-');
            return `
            <tr class="hover:bg-slate-50/80 border-b border-slate-100 last:border-0 text-xs md:text-sm transition">
                <td class="p-2.5 md:p-3.5 font-semibold text-slate-800">${escapeHtml(row.branch)}</td>
                <td class="p-2.5 md:p-3.5">${notiDate}</td>
                <td class="p-2.5 md:p-3.5">${escapeHtml(row.deliveryDate)}</td>
                <td class="p-2.5 md:p-3.5 text-center text-slate-500">${notiTime}</td>
                <td class="p-2.5 md:p-3.5 text-center text-slate-500">${confTime}</td>
                <td class="p-2.5 md:p-3.5 text-center text-slate-500">${shipTime}</td>
                <td class="p-2.5 md:p-3.5 text-right font-semibold text-blue-600">${escapeHtml(row.shipmentAmount)}</td>
                <td class="p-2.5 md:p-3.5 text-center">${escapeHtml(row.processingTime || '-')}</td>
            </tr>`;
        }).join('');
    }
    if (mBODY) mBODY.innerHTML = html;
    if (dBODY) dBODY.innerHTML = html;
}

function updateMonthlyReport(source) {
    const mMonthEl = document.getElementById('m-report-month');
    const mYearEl = document.getElementById('m-report-year');
    const mBranchEl = document.getElementById('m-branch-filter');
    const dMonthEl = document.getElementById('d-report-month');
    const dYearEl = document.getElementById('d-report-year');
    const dBranchEl = document.getElementById('d-branch-filter');

    let activeMonth = '', activeYear = '', activeBranch = '';
    if (source === 'mobile') {
        activeMonth = mMonthEl ? mMonthEl.value : '';
        activeYear = mYearEl ? mYearEl.value : '';
        activeBranch = mBranchEl ? mBranchEl.value : '';
        if (dMonthEl) dMonthEl.value = activeMonth;
        if (dYearEl) dYearEl.value = activeYear;
        if (dBranchEl) dBranchEl.value = activeBranch;
    } else if (source === 'desktop') {
        activeMonth = dMonthEl ? dMonthEl.value : '';
        activeYear = dYearEl ? dYearEl.value : '';
        activeBranch = dBranchEl ? dBranchEl.value : '';
        if (mMonthEl) mMonthEl.value = activeMonth;
        if (mYearEl) mYearEl.value = activeYear;
        if (mBranchEl) mBranchEl.value = activeBranch;
    } else {
        activeMonth = dMonthEl ? dMonthEl.value : '';
        activeYear = dYearEl ? dYearEl.value : '';
        activeBranch = dBranchEl ? dBranchEl.value : '';
    }
    if (!activeYear) return;

    const filtered = globalData.filter(item => {
        if (!item.isoDate) return false;
        const [y, m] = item.isoDate.split('-');
        return parseInt(m, 10) === parseInt(activeMonth, 10)
            && parseInt(y, 10) === parseInt(activeYear, 10)
            && (activeBranch === '' || item.branch === activeBranch);
    });

    const summary = createSafeMap();
    filtered.forEach(item => {
        if (!isSafeDictKey(item.branch)) return;
        if (!summary[item.branch]) summary[item.branch] = { do: 0, sh: 0 };
        summary[item.branch].do++;
        const sAmt = parseFloat(String(item.shipmentAmount).replace(/,/g, ''));
        if (!isNaN(sAmt)) summary[item.branch].sh += sAmt;
    });

    const branches = Object.keys(summary).sort();
    let html = '';
    if (branches.length === 0) {
        html = '<tr><td colspan="5" class="p-6 text-center text-slate-400">ไม่พบข้อมูลในเดือนนี้</td></tr>';
    } else {
        html = branches.map(b => {
            const s = summary[b];
            return `<tr class="hover:bg-slate-50/80 border-b border-slate-100 last:border-0 text-xs md:text-sm transition"><td class="p-2.5 md:p-3.5 font-semibold text-slate-800">${escapeHtml(b)}</td><td class="p-2.5 md:p-3.5 text-center text-slate-500">-</td><td class="p-2.5 md:p-3.5 text-center font-medium text-slate-800">${escapeHtml(String(s.do))}</td><td class="p-2.5 md:p-3.5 text-center font-semibold text-blue-600">${escapeHtml(String(s.sh))}</td><td class="p-2.5 md:p-3.5 text-center text-slate-500">-</td></tr>`;
        }).join('');
    }
    const mBODY = document.getElementById('m-monthly-table-body');
    const dBODY = document.getElementById('d-monthly-table-body');
    if (mBODY) mBODY.innerHTML = html;
    if (dBODY) dBODY.innerHTML = html;
}

// ============================================
// 📤 EXPORT LOGIC (CWE-1236 Formula Injection Protected)
// ============================================

function confirmExport() {
    if (typeof XLSX === 'undefined') {
        showToast('ไม่พบไลบรารีส่งออก Excel', 'error');
        return;
    }
    const startEl = document.getElementById('export-start');
    const endEl = document.getElementById('export-end');
    const start = startEl ? startEl.value : '';
    const end = endEl ? endEl.value : '';
    if (!start || !end) { showToast('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด', 'error'); return; }
    const exportData = globalData.filter(item => {
        if (!item.isoDate) return false;
        return item.isoDate >= start && item.isoDate <= end;
    });
    if (exportData.length === 0) { showToast('ไม่พบข้อมูลในช่วงวันที่เลือก', 'error'); return; }

    const includeChartEl = document.getElementById('export-include-chart');
    const includeChart = Boolean(includeChartEl && includeChartEl.checked);
    const wb = XLSX.utils.book_new();
    const wsData = [[
        'สาขา', 'วันที่แจ้งงาน', 'วันที่ส่งสินค้า', 'เวลาแจ้งงาน', 'เวลายืนยัน',
        'เวลาออก shipment', 'จำนวน shipment', 'จำนวนการแก้ไข', 'ระยะเวลาดำเนินการ (นาที)', 'หมายเหตุ'
    ]];

    exportData.forEach(row => {
        const dateParts = String(row.timestamp || '').split(' ');
        const notiDate = dateParts[0] || '-';
        const notiTime = (row.bill && row.bill.time) ? row.bill.time : '-';
        let deliveryDate = row.deliveryDate || '-';
        if (deliveryDate !== '-') {
            const dateMatch = deliveryDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
            if (dateMatch) {
                let year = parseInt(dateMatch[3], 10);
                if (dateMatch[3].length === 2) year += 2000;
                deliveryDate = `${dateMatch[1]}/${dateMatch[2]}/${year}`;
            }
        }
        const safeRow = [
            row.branch || '-',
            notiDate,
            deliveryDate,
            notiTime,
            (row.conf && row.conf.time) ? row.conf.time : '-',
            (row.ship && row.ship.time) ? row.ship.time : '-',
            row.shipmentAmount !== '-' ? row.shipmentAmount : '',
            row.editCount > 0 ? String(row.editCount) : '0',
            row.processingTime !== '-' ? row.processingTime : '',
            row.note || ''
        ].map(sanitizeExcelCell);
        wsData.push(safeRow);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลการแจ้งงาน');
    if (includeChart) addChartToWorkbook(wb, start, end);

    const safeStart = sanitizeFilenameSegment(start, 'start');
    const safeEnd = sanitizeFilenameSegment(end, 'end');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FleetOrder_Export_${safeStart}_to_${safeEnd}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    closeExportModal();
    showToast('ดาวน์โหลดไฟล์ Excel เรียบร้อยแล้ว');
}

function addChartToWorkbook(wb, start, end) {
    const canvasId = window.innerWidth >= 768 ? 'd-freq-chart' : 'm-freq-chart';
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        if (canvas.width === 0 || canvas.height === 0) {
            showToast('กรุณาเปิดหน้าแดชบอร์ดก่อนบันทึกกราฟ', 'error');
            return;
        }
        try {
            const imageData = canvas.toDataURL('image/png', 1.0);
            const safeStartCell = sanitizeExcelCell(start);
            const safeEndCell = sanitizeExcelCell(end);
            const chartRows = [
                [sanitizeExcelCell('รายงานกราฟความถี่การแจ้งงาน')],
                [sanitizeExcelCell(`ช่วงวันที่: ${safeStartCell} ถึง ${safeEndCell}`)],
                [''],
                [sanitizeExcelCell('กราฟแสดงความถี่การแจ้งงานในช่วงเวลาต่างๆ ของวัน')]
            ];
            const chartWs = XLSX.utils.aoa_to_sheet(chartRows);
            chartWs['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, chartWs, 'กราฟความถี่');
            chartWs['A5'] = { t: 's', v: sanitizeExcelCell('📊 กราฟความถี่การแจ้งงาน') };

            const safeStart = sanitizeFilenameSegment(start, 'start');
            const safeEnd = sanitizeFilenameSegment(end, 'end');
            const imageLink = document.createElement('a');
            imageLink.download = `FleetOrder_Chart_${safeStart}_to_${safeEnd}.png`;
            imageLink.href = imageData;
            document.body.appendChild(imageLink);
            imageLink.click();
            document.body.removeChild(imageLink);
        } catch (e) {
            console.error('Chart Export Error:', e);
            showToast('เกิดข้อผิดพลาดในการบันทึกรูปกราฟ', 'error');
        }
    }
}

// ============================================
// 🗺️ GEO MAP — Pre-computed Southern Branch Coverage Areas
// ============================================

let mMapInstance = null;
let dMapInstance = null;
let mapLayerGroups = { mobile: null, desktop: null };
let mapBaseTileLayers = { mobile: [], desktop: [] };
let currentMapStyle = 'light';
let showPermanentLabels = true;
let geoJsonData = null;
let mapLayers = [];
let lastFilteredMapData = [];

const LOCAL_GEOJSON_URL = 'assets/thailand-south.geojson';

// Transparent 1x1 pixel fallback so broken tile icons never appear
const BLANK_TILE_DATA_URI = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Esri ArcGIS Online Public Tiles (No API Key Required & No Referer 403 Block)
const TILE_SOURCES = Object.freeze({
    light: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
    ],
    street: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    ],
    none: []
});

// District description per branch for rich popups
const BRANCH_DISTRICT_INFO = Object.freeze({
    'สาขานครศรีธรรมราช': 'อ.เมืองนครศรีฯ, ขนอม, สิชล, นบพิตำ, ท่าศาลา, พิปูน, พรหมคีรี, ลานสกา, พระพรหม, ปากพนัง, ร่อนพิบูลย์, เฉลิมพระเกียรติ, เชียรใหญ่, หัวไทร',
    'สาขาทุ่งสง': 'อ.ทุ่งสง, ถ้ำพรรณรา, ฉวาง, ช้างกลาง, ทุ่งใหญ่, นาบอน, บางขัน, จุฬาภรณ์, ชะอวด',
    'สาขาสุราษฎร์ธานี': 'อ.เมืองสุราษฎร์ธานี, กาญจนดิษฐ์, ดอนสัก, บ้านนาเดิม, บ้านนาสาร, เวียงสระ',
    'สาขาพุนพิน': 'อ.พุนพิน, ท่าชนะ, ไชยา, ท่าฉาง, วิภาวดี, บ้านตาขุน, คีรีรัฐนิคม, พนม, เคียนซา, พระแสง, ชัยบุรี',
    'สาขาสมุย': 'อ.เกาะสมุย',
    'เขตเกาะพะงัน': 'อ.เกาะพะงัน, เกาะเต่า',
    'สาขาชุมพร': 'อ.เมืองชุมพร, ท่าแซะ, ปะทิว',
    'สาขาหลังสวน': 'อ.หลังสวน, สวี, ทุ่งตะโก, พะโต๊ะ, ละแม'
});

const EXTRA_LAYERS = Object.freeze([
    Object.freeze({ branch: 'เขตกลางคืน', prov: 'Phuket', type: 'circle', center: [7.885, 98.392], radius: 3800 })
]);

const STATUS_COLORS = Object.freeze({
    new: '#EF4444',   // Rose Red (งานใหม่)
    edit: '#F59E0B',  // Amber (แก้ไขบิล)
    conf: '#2563EB',  // Royal Blue (ยืนยันแล้ว)
    ship: '#10B981',  // Emerald Green (เสร็จสิ้น)
    empty: '#CBD5E1'  // Slate Gray (ไม่มีงาน)
});

function applyTileLayersToMap(map, key, styleName) {
    if (mapBaseTileLayers[key]) {
        mapBaseTileLayers[key].forEach(tl => {
            if (map.hasLayer(tl)) map.removeLayer(tl);
        });
    }
    mapBaseTileLayers[key] = [];
    const urls = TILE_SOURCES[styleName] || [];
    urls.forEach(url => {
        const tl = L.tileLayer(url, {
            maxZoom: 18,
            errorTileUrl: BLANK_TILE_DATA_URI
        });
        tl.on('tileerror', function (e) {
            if (e && e.tile) e.tile.src = BLANK_TILE_DATA_URI;
        });
        tl.addTo(map);
        tl.bringToBack();
        mapBaseTileLayers[key].push(tl);
    });
}

function switchMapStyle(styleName) {
    if (!Object.prototype.hasOwnProperty.call(TILE_SOURCES, styleName)) return;
    currentMapStyle = styleName;
    document.querySelectorAll('.map-style-btn').forEach(btn => {
        if (btn.getAttribute('data-style') === styleName) {
            btn.className = btn.className.replace(/bg-slate-100 text-slate-600 border-slate-200/g, 'bg-blue-50 text-blue-600 border-blue-200');
        } else {
            btn.className = btn.className.replace(/bg-blue-50 text-blue-600 border-blue-200/g, 'bg-slate-100 text-slate-600 border-slate-200');
        }
    });
    if (mMapInstance) applyTileLayersToMap(mMapInstance, 'mobile', styleName);
    if (dMapInstance) applyTileLayersToMap(dMapInstance, 'desktop', styleName);
}

function resetMapView() {
    if (mMapInstance) { mMapInstance.invalidateSize(); mMapInstance.setView([8.45, 99.55], 7); }
    if (dMapInstance) { dMapInstance.invalidateSize(); dMapInstance.setView([8.45, 99.55], 7); }
}

function toggleMapLabels() {
    showPermanentLabels = !showPermanentLabels;
    const btn = document.getElementById('btn-toggle-labels');
    if (btn) {
        btn.className = showPermanentLabels
            ? 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 transition'
            : 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 transition';
    }
    mapLayers.forEach(obj => {
        if (!obj.layer) return;
        obj.layer.unbindTooltip();
        obj.layer.bindTooltip(escapeHtml(obj.branch), {
            permanent: showPermanentLabels,
            direction: obj.isGeoJson ? 'center' : 'top',
            className: 'branch-label-tooltip'
        });
    });
}

function focusBranchOnMap(branchName) {
    const canonical = getCanonicalBranch(branchName);
    const activeMap = window.innerWidth >= 768 ? dMapInstance : mMapInstance;
    const activeKey = window.innerWidth >= 768 ? 'desktop' : 'mobile';
    if (!activeMap) return;

    const targetObj = mapLayers.find(m => m.branch === canonical && m.mapKey === activeKey);
    if (targetObj && targetObj.layer) {
        activeMap.invalidateSize();
        if (targetObj.layer.getBounds) {
            activeMap.fitBounds(targetObj.layer.getBounds(), { maxZoom: 9, padding: [30, 30] });
        } else if (targetObj.layer.getLatLng) {
            activeMap.setView(targetObj.layer.getLatLng(), 10);
        }
        targetObj.layer.openPopup();
    }
}

function createMapInstance(containerId, key) {
    const map = L.map(containerId, {
        center: [8.45, 99.55],
        zoom: 7,
        minZoom: 6,
        maxZoom: 13,
        zoomControl: true,
        attributionControl: false
    });
    applyTileLayersToMap(map, key, currentMapStyle);

    // Automatically keep map responsive when container resizes or becomes visible
    const containerEl = document.getElementById(containerId);
    if (containerEl && window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
            map.invalidateSize();
        });
        ro.observe(containerEl);
    }
    return map;
}

async function fetchGeoJson() {
    if (geoJsonData) return geoJsonData;
    try {
        const response = await fetch(LOCAL_GEOJSON_URL, {
            credentials: 'same-origin',
            referrerPolicy: 'no-referrer'
        });
        if (!response.ok) throw new Error(`GeoJSON HTTP ${response.status}`);
        const raw = await response.json();
        if (raw && raw.type === 'FeatureCollection' && Array.isArray(raw.features)) {
            geoJsonData = raw;
        }
    } catch (e) {
        console.error('Failed to load local Southern Thailand GeoJSON:', e);
    }
    return geoJsonData;
}

function buildBranchPopupHtml(branchName, provName, subtitleText, statusSummaryHtml) {
    const safeBranch = escapeHtml(branchName);
    const safeSubtitle = escapeHtml(subtitleText);
    return `
        <div style="min-width:195px;">
            <div style="font-size:13px; font-weight:700; color:#0f172a;">${safeBranch}</div>
            <div style="font-size:10px; color:#64748b; margin-top:2px;">${safeSubtitle}</div>
            <hr style="margin:6px 0; border-color:#e2e8f0;">
            <div style="font-size:11px;">${statusSummaryHtml}</div>
        </div>
    `;
}

function renderBranchAreas(map, mapKey) {
    const group = L.layerGroup().addTo(map);
    if (geoJsonData && Array.isArray(geoJsonData.features)) {
        L.geoJSON(geoJsonData.features, {
            style: function () {
                return {
                    fillColor: STATUS_COLORS.empty,
                    weight: 2,
                    opacity: 1,
                    color: '#FFFFFF',
                    dashArray: '',
                    fillOpacity: 0.72
                };
            },
            onEachFeature: function (feature, layer) {
                const props = (feature && feature.properties) || {};
                const bName = getCanonicalBranch(props.branchName || props.name);
                const pName = sanitizeText(props.customProv || props.name, '-', 80);
                const districtDesc = BRANCH_DISTRICT_INFO[bName] || `พื้นที่บริการ ${bName}`;
                const subtitle = `จ.${pName} (${districtDesc})`;

                layer.bindPopup(buildBranchPopupHtml(
                    bName,
                    pName,
                    subtitle,
                    '<span style="color:#94a3b8">ไม่มีงานวันนี้</span>'
                ));
                layer.bindTooltip(escapeHtml(bName), {
                    permanent: showPermanentLabels,
                    direction: 'center',
                    className: 'branch-label-tooltip'
                });
                layer.on({
                    mouseover: (e) => {
                        e.target.setStyle({ weight: 3, color: '#1E293B', fillOpacity: 0.92 });
                        e.target.bringToFront();
                    },
                    mouseout: (e) => {
                        const obj = mapLayers.find(m => m.layer === e.target);
                        if (obj) e.target.setStyle(obj.defaultStyle);
                    }
                });
                mapLayers.push({
                    layer,
                    mapKey,
                    prov: pName,
                    branch: bName,
                    isGeoJson: true,
                    defaultStyle: { fillColor: STATUS_COLORS.empty, fillOpacity: 0.72, weight: 2, color: '#FFFFFF', dashArray: '' }
                });
            }
        }).addTo(group);
    }

    EXTRA_LAYERS.forEach(area => {
        const bName = getCanonicalBranch(area.branch);
        const defaultStyle = { fillColor: STATUS_COLORS.empty, fillOpacity: 0.75, weight: 2, color: '#FFFFFF', dashArray: '' };
        const layer = L.circle(area.center, { ...defaultStyle, radius: area.radius }).addTo(group);
        const subtitle = `พื้นที่กะกลางคืน (${area.prov})`;

        layer.bindPopup(buildBranchPopupHtml(
            bName,
            area.prov,
            subtitle,
            '<span style="color:#94a3b8">ไม่มีงานวันนี้</span>'
        ));
        layer.bindTooltip(escapeHtml(bName), {
            permanent: showPermanentLabels,
            direction: 'top',
            className: 'branch-label-tooltip'
        });
        layer.on({
            mouseover: (e) => { e.target.setStyle({ weight: 3, color: '#1E293B', fillOpacity: 0.95 }); e.target.bringToFront(); },
            mouseout: (e) => { const obj = mapLayers.find(m => m.layer === e.target); if (obj) e.target.setStyle(obj.defaultStyle); }
        });
        mapLayers.push({ layer, mapKey, prov: area.prov, branch: bName, isGeoJson: false, defaultStyle });
    });
    return group;
}

function addMapLegend(map) {
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
            <div class="map-legend-title mb-2">สถานะรายวัน (Status)</div>
            <div style="margin-bottom:4px"><i style="background:${STATUS_COLORS.new}"></i><span>งานใหม่ (รอตรวจสอบ)</span></div>
            <div style="margin-bottom:4px"><i style="background:${STATUS_COLORS.edit}"></i><span>ต้องแก้ไขบิล (Edit)</span></div>
            <div style="margin-bottom:4px"><i style="background:${STATUS_COLORS.conf}"></i><span>ยืนยันแล้ว (รับเรื่อง)</span></div>
            <div style="margin-bottom:4px"><i style="background:${STATUS_COLORS.ship}"></i><span>เสร็จสิ้นทั้งหมด (Shipped)</span></div>
            <div style="border-top: 1px solid #f1f5f9; margin-top: 6px; padding-top: 4px;">
                <i style="background:${STATUS_COLORS.empty}"></i><span style="color:#94a3b8">ไม่มีงาน/เขตว่าง</span>
            </div>
        `;
        return div;
    };
    legend.addTo(map);
}

async function initBranchMaps() {
    if (typeof L === 'undefined') return;
    try {
        await fetchGeoJson();
        mapLayers = [];
        const mContainer = document.getElementById('m-branch-map');
        const dContainer = document.getElementById('d-branch-map');
        if (mContainer && !mMapInstance) {
            mMapInstance = createMapInstance('m-branch-map', 'mobile');
            mapLayerGroups.mobile = renderBranchAreas(mMapInstance, 'mobile');
            addMapLegend(mMapInstance);
        }
        if (dContainer && !dMapInstance) {
            dMapInstance = createMapInstance('d-branch-map', 'desktop');
            mapLayerGroups.desktop = renderBranchAreas(dMapInstance, 'desktop');
            addMapLegend(dMapInstance);
        }
        updateMapData(lastFilteredMapData.length > 0 ? lastFilteredMapData : globalData);
    } catch (e) {
        console.error('Map init error:', e);
    }
}

function invalidateMaps() {
    setTimeout(() => {
        if (mMapInstance) mMapInstance.invalidateSize();
        if (dMapInstance) dMapInstance.invalidateSize();
    }, 200);
}

function renderMapBranchChips(branchCounts) {
    const dChips = document.getElementById('d-map-branch-chips');
    const mChips = document.getElementById('m-map-branch-chips');

    const html = MASTER_SOUTHERN_BRANCHES.map(bName => {
        const c = isSafeDictKey(bName) ? branchCounts[bName] : null;
        let dotColor = 'bg-slate-300';
        let borderCls = 'border-slate-200 bg-white text-slate-600';
        if (c && c.total > 0) {
            if (c.new > 0) { dotColor = 'bg-rose-500'; borderCls = 'border-rose-200 bg-rose-50/60 text-rose-700 font-semibold'; }
            else if (c.edit > 0) { dotColor = 'bg-amber-500'; borderCls = 'border-amber-200 bg-amber-50/60 text-amber-700 font-semibold'; }
            else if (c.conf > 0) { dotColor = 'bg-blue-600'; borderCls = 'border-blue-200 bg-blue-50/60 text-blue-700 font-semibold'; }
            else { dotColor = 'bg-emerald-500'; borderCls = 'border-emerald-200 bg-emerald-50/60 text-emerald-700 font-semibold'; }
        }
        const safeBranchAttr = escapeHtml(bName);
        const safeLabel = escapeHtml(bName.replace('สาขา', ''));
        const badge = c && c.total > 0
            ? `<span class="ml-1 px-1.5 py-0.5 bg-white/90 rounded-full text-[10px]">${escapeHtml(String(c.total))}</span>`
            : '';
        return `<button type="button" data-action="focus-branch" data-branch="${safeBranchAttr}" class="px-2.5 py-1 rounded-full border text-xs flex items-center gap-1.5 whitespace-nowrap hover:shadow-sm transition cursor-pointer ${borderCls}">
            <span class="w-2 h-2 rounded-full ${dotColor}"></span>
            <span>${safeLabel}</span>
            ${badge}
        </button>`;
    }).join('');

    if (dChips) dChips.innerHTML = html;
    if (mChips) mChips.innerHTML = html;
}

function updateMapData(filteredData) {
    lastFilteredMapData = Array.isArray(filteredData) ? filteredData : [];
    const branchCounts = createSafeMap();
    lastFilteredMapData.forEach(item => {
        const b = getCanonicalBranch(item.branch);
        if (!isSafeDictKey(b)) return;
        if (!branchCounts[b]) branchCounts[b] = { total: 0, new: 0, conf: 0, edit: 0, ship: 0 };
        branchCounts[b].total++;
        const st = getStatusCode(item);
        if (st === 'ship') branchCounts[b].ship++;
        else if (st === 'conf') branchCounts[b].conf++;
        else if (st === 'edit') branchCounts[b].edit++;
        else branchCounts[b].new++;
    });

    renderMapBranchChips(branchCounts);

    if (mapLayers.length === 0) return;

    mapLayers.forEach(obj => {
        const count = isSafeDictKey(obj.branch) ? branchCounts[obj.branch] : null;
        const hasAnyData = Boolean(count && count.total > 0);
        let finalColor = STATUS_COLORS.empty;
        let finalOpacity = 0.65;

        if (hasAnyData) {
            finalOpacity = 0.86;
            if (count.new > 0) finalColor = STATUS_COLORS.new;
            else if (count.edit > 0) finalColor = STATUS_COLORS.edit;
            else if (count.conf > 0) finalColor = STATUS_COLORS.conf;
            else finalColor = STATUS_COLORS.ship;
        }

        const newStyle = {
            fillColor: finalColor,
            fillOpacity: finalOpacity,
            weight: 2,
            color: '#FFFFFF',
            dashArray: ''
        };
        obj.defaultStyle = newStyle;
        obj.layer.setStyle(newStyle);

        const districtDesc = BRANCH_DISTRICT_INFO[obj.branch] || `พื้นที่บริการ ${obj.branch}`;
        const subtitle = obj.isGeoJson
            ? `จ.${obj.prov} (${districtDesc})`
            : `พื้นที่กะกลางคืน (${obj.prov})`;
        const statusSummaryHtml = hasAnyData
            ? `<div style="line-height:1.7;">
                <div>รวมทั้งหมด: <b>${escapeHtml(String(count.total))} งาน</b></div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; font-size:10px; margin-top:2px;">
                    <span style="color:#EF4444; font-weight:700;">● ใหม่ ${escapeHtml(String(count.new))}</span>
                    <span style="color:#2563EB; font-weight:700;">● ยืนยัน ${escapeHtml(String(count.conf))}</span>
                    <span style="color:#F59E0B; font-weight:700;">● แก้ไข ${escapeHtml(String(count.edit))}</span>
                    <span style="color:#10B981; font-weight:700;">● เสร็จ ${escapeHtml(String(count.ship))}</span>
                </div>
               </div>`
            : `<span style="color:#94a3b8">ไม่มีงานในวันที่เลือก</span>`;

        obj.layer.setPopupContent(buildBranchPopupHtml(obj.branch, obj.prov, subtitle, statusSummaryHtml));
    });
}
