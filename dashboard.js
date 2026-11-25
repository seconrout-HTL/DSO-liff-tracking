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
                    label: t('chartDatasetOrders'),
                    data: [...slots],
                    backgroundColor: '#007947',
                    hoverBackgroundColor: '#005F37',
                    borderRadius: 999,
                    borderSkipped: false,
                    barThickness: 14,
                    order: 1
                },
                {
                    label: t('chartDatasetCap'),
                    data: bgTrack,
                    backgroundColor: '#EBF6F0',
                    hoverBackgroundColor: '#D8EFE3',
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
                    grid: { color: '#EEF5F1' }
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
    const emptyRow = `<tr><td colspan="7" class="p-4 text-center text-slate-400">${escapeHtml(t('emptyData'))}</td></tr>`;
    const mBody = document.getElementById('m-freq-table-body');
    const dBody = document.getElementById('d-freq-table-body');
    if (mBody) mBody.innerHTML = rows || emptyRow;
    if (dBody) dBody.innerHTML = rows || emptyRow;
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
    missingBranches.sort((a, b) => formatBranchName(a).localeCompare(formatBranchName(b)));

    let html = '';
    if (missingBranches.length > 0) {
        html += `<div class="mb-2 text-xs font-semibold text-brand-red">${escapeHtml(t('branchMissing', { n: missingBranches.length }))}</div>`;
        html += `<div class="flex flex-wrap gap-1.5 mb-4">`;
        missingBranches.forEach(b => {
            const safeCanon = escapeHtml(b);
            const safeLabel = escapeHtml(formatBranchName(b));
            html += `<button type="button" data-action="focus-branch" data-branch="${safeCanon}" class="px-2.5 py-1 badge-urgent-new hover:opacity-85 text-xs font-medium rounded-lg transition cursor-pointer">${safeLabel}</button>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="mb-4 text-center text-xs font-semibold text-brand-green bg-brand-green-soft p-2.5 rounded-xl border border-brand-green-border">${escapeHtml(t('branchAllSubmitted'))}</div>`;
    }

    const activeEntries = Object.entries(activeBranches);
    if (activeEntries.length > 0) {
        html += `<div class="mb-2 text-xs font-semibold text-slate-400">${escapeHtml(t('branchSubmitted', { n: activeEntries.length }))}</div>`;
        activeEntries.forEach(([name, info]) => {
            let color = 'text-brand-red', barColor = 'bg-brand-red', pct = '30%', statusTxt = t('statusNew');
            if (info.status === 'conf') { color = 'text-blue-600'; barColor = 'bg-blue-500'; pct = '68%'; statusTxt = t('statusConfirmed'); }
            else if (info.status === 'ship') { color = 'text-brand-green'; barColor = 'bg-brand-green'; pct = '100%'; statusTxt = t('statusShipped'); }
            else if (info.status === 'edit') { color = 'text-amber-600'; barColor = 'bg-amber-500'; pct = '50%'; statusTxt = t('statusEdited'); }
            const safeCanon = escapeHtml(name);
            const safeDisplay = escapeHtml(formatBranchName(name));
            const safeTime = escapeHtml(info.time || '-');
            const timeSuffix = info.time ? escapeHtml(t('timeSuffix')) : '';
            html += `
            <div data-action="focus-branch" data-branch="${safeCanon}" role="button" tabindex="0" class="p-3 bg-slate-50/70 rounded-xl border border-slate-100 mb-2 hover:bg-brand-green-soft/60 hover:border-brand-green-border transition cursor-pointer">
                <div class="flex justify-between items-center mb-1.5">
                    <div class="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                        <span>${safeDisplay}</span>
                        <span class="px-1.5 py-0.5 bg-white text-slate-600 rounded text-[10px] border border-slate-200">${escapeHtml(formatOrderCount(info.count))}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs ${color} font-semibold">${escapeHtml(statusTxt)}</span>
                        <span class="text-[11px] text-slate-400">${safeTime}${timeSuffix}</span>
                    </div>
                </div>
                <div class="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                    <div class="h-full ${barColor} rounded-full transition-all duration-500" style="width: ${pct}"></div>
                </div>
            </div>`;
        });
    } else {
        html += `<div class="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl mb-2">${escapeHtml(t('branchNoReports'))}</div>`;
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
    const sortedBranches = Array.from(uniqueBranches).sort((a, b) =>
        formatBranchName(a).localeCompare(formatBranchName(b))
    );
    ['m-branch-filter', 'd-branch-filter'].forEach(id => {
        const selectEl = document.getElementById(id);
        if (!selectEl) return;
        const prevVal = selectEl.value;
        selectEl.textContent = '';

        const allOpt = document.createElement('option');
        allOpt.value = '';
        allOpt.textContent = t('reportAllBranches');
        selectEl.appendChild(allOpt);

        sortedBranches.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b;
            opt.textContent = formatBranchName(b);
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
        html = `<tr><td colspan="8" class="p-6 text-center text-slate-400">${escapeHtml(t('emptyDate'))}</td></tr>`;
    } else {
        html = sortedData.map(row => {
            const dateParts = String(row.timestamp || '').split(' ');
            const notiDate = escapeHtml(dateParts[0] || '-');
            const notiTime = escapeHtml((row.bill && row.bill.time) ? row.bill.time : '-');
            const confTime = escapeHtml((row.conf && row.conf.time) ? row.conf.time : '-');
            const shipTime = escapeHtml((row.ship && row.ship.time) ? row.ship.time : '-');
            return `
            <tr class="hover:bg-slate-50/80 border-b border-slate-100 last:border-0 text-xs md:text-sm transition">
                <td class="p-2.5 md:p-3.5 font-semibold text-slate-800">${escapeHtml(formatBranchName(row.branch))}</td>
                <td class="p-2.5 md:p-3.5">${notiDate}</td>
                <td class="p-2.5 md:p-3.5">${escapeHtml(row.deliveryDate)}</td>
                <td class="p-2.5 md:p-3.5 text-center text-slate-500">${notiTime}</td>
                <td class="p-2.5 md:p-3.5 text-center text-slate-500">${confTime}</td>
                <td class="p-2.5 md:p-3.5 text-center text-slate-500">${shipTime}</td>
                <td class="p-2.5 md:p-3.5 text-right font-semibold text-brand-green">${escapeHtml(row.shipmentAmount)}</td>
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

    const branches = Object.keys(summary).sort((a, b) => formatBranchName(a).localeCompare(formatBranchName(b)));
    let html = '';
    if (branches.length === 0) {
        html = `<tr><td colspan="5" class="p-6 text-center text-slate-400">${escapeHtml(t('emptyMonth'))}</td></tr>`;
    } else {
        html = branches.map(b => {
            const s = summary[b];
            return `<tr class="hover:bg-slate-50/80 border-b border-slate-100 last:border-0 text-xs md:text-sm transition"><td class="p-2.5 md:p-3.5 font-semibold text-slate-800">${escapeHtml(formatBranchName(b))}</td><td class="p-2.5 md:p-3.5 text-center text-slate-500">-</td><td class="p-2.5 md:p-3.5 text-center font-medium text-slate-800">${escapeHtml(String(s.do))}</td><td class="p-2.5 md:p-3.5 text-center font-semibold text-brand-green">${escapeHtml(String(s.sh))}</td><td class="p-2.5 md:p-3.5 text-center text-slate-500">-</td></tr>`;
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
        showToast(t('toastExportNoLib'), 'error');
        return;
    }
    const startEl = document.getElementById('export-start');
    const endEl = document.getElementById('export-end');
    const start = startEl ? startEl.value : '';
    const end = endEl ? endEl.value : '';
    if (!start || !end) { showToast(t('toastSelectDates'), 'error'); return; }
    const exportData = globalData.filter(item => {
        if (!item.isoDate) return false;
        return item.isoDate >= start && item.isoDate <= end;
    });
    if (exportData.length === 0) { showToast(t('toastNoExportData'), 'error'); return; }

    const includeChartEl = document.getElementById('export-include-chart');
    const includeChart = Boolean(includeChartEl && includeChartEl.checked);
    const wb = XLSX.utils.book_new();
    const wsData = [[
        'สาขา', 'วันที่แจ้งงาน', 'วันที่ส่งสินค้า', 'เวลาแจ้งงาน', 'เวลายืนยัน',
        'เวลาออกใบจัดส่ง', 'จำนวนจัดส่ง', 'จำนวนการแก้ไข', 'ระยะเวลาดำเนินการ', 'หมายเหตุ'
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
    showToast(t('toastExportSuccess'));
}

function addChartToWorkbook(wb, start, end) {
    const canvasId = window.innerWidth >= 768 ? 'd-freq-chart' : 'm-freq-chart';
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        if (canvas.width === 0 || canvas.height === 0) {
            showToast(t('toastOpenDashForChart'), 'error');
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
            showToast(t('toastChartExportErr'), 'error');
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
let mapLegendContainers = [];
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

const EXTRA_LAYERS = Object.freeze([
    Object.freeze({ branch: 'เขตกลางคืน', prov: 'Phuket', type: 'circle', center: [7.885, 98.392], radius: 3800 })
]);

const STATUS_COLORS = Object.freeze({
    new: '#f00000',   // Brand Signal Red (New / Urgent)
    edit: '#F59E0B',  // Amber (Edited)
    conf: '#2563EB',  // Blue (Confirmed)
    ship: '#007947',  // Brand Green (Completed)
    empty: '#CBD5E1'  // Slate Gray (No Orders)
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
        btn.classList.toggle('active-map-btn', btn.getAttribute('data-style') === styleName);
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
            ? 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-green text-white border border-brand-green transition'
            : 'px-3 py-1.5 rounded-xl text-xs font-semibold bg-white text-slate-600 border border-slate-200 hover:text-brand-green transition';
    }
    rebindMapTooltips();
}

function rebindMapTooltips() {
    mapLayers.forEach(obj => {
        if (!obj.layer) return;
        obj.layer.unbindTooltip();
        obj.layer.bindTooltip(escapeHtml(formatBranchName(obj.branch)), {
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
            activeMap.fitBounds(targetObj.layer.getBounds(), { maxZoom: 10, padding: [30, 30] });
        } else if (targetObj.layer.getLatLng) {
            activeMap.setView(targetObj.layer.getLatLng(), 11);
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

function buildBranchSubtitle(branchName, rawProv, isGeoJson) {
    const provLabel = formatProvinceName(rawProv);
    if (!isGeoJson) {
        return t('mapPopupNightArea', { prov: provLabel });
    }
    const districtDesc = getBranchDistrictInfo(branchName);
    const prefix = t('mapPopupProvincePrefix');
    return `${prefix}${provLabel} — ${districtDesc}`;
}

function buildBranchPopupHtml(branchName, subtitleText, statusSummaryHtml) {
    const safeBranch = escapeHtml(formatBranchName(branchName));
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
                const subtitle = buildBranchSubtitle(bName, pName, true);

                layer.bindPopup(buildBranchPopupHtml(
                    bName,
                    subtitle,
                    `<span style="color:#94a3b8">${escapeHtml(t('mapPopupNoDataToday'))}</span>`
                ));
                layer.bindTooltip(escapeHtml(formatBranchName(bName)), {
                    permanent: showPermanentLabels,
                    direction: 'center',
                    className: 'branch-label-tooltip'
                });
                layer.on({
                    mouseover: (e) => {
                        e.target.setStyle({ weight: 3, color: '#007947', fillOpacity: 0.92 });
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
        const subtitle = buildBranchSubtitle(bName, area.prov, false);

        layer.bindPopup(buildBranchPopupHtml(
            bName,
            subtitle,
            `<span style="color:#94a3b8">${escapeHtml(t('mapPopupNoDataToday'))}</span>`
        ));
        layer.bindTooltip(escapeHtml(formatBranchName(bName)), {
            permanent: showPermanentLabels,
            direction: 'top',
            className: 'branch-label-tooltip'
        });
        layer.on({
            mouseover: (e) => { e.target.setStyle({ weight: 3, color: '#007947', fillOpacity: 0.95 }); e.target.bringToFront(); },
            mouseout: (e) => { const obj = mapLayers.find(m => m.layer === e.target); if (obj) e.target.setStyle(obj.defaultStyle); }
        });
        mapLayers.push({ layer, mapKey, prov: area.prov, branch: bName, isGeoJson: false, defaultStyle });
    });
    return group;
}

function buildMapLegendHtml() {
    return `
        <div class="map-legend-title mb-2">${escapeHtml(t('mapLegendTitle'))}</div>
        <div style="margin-bottom:4px"><i style="background:${STATUS_COLORS.new}"></i><span>${escapeHtml(t('mapLegendNew'))}</span></div>
        <div style="margin-bottom:4px"><i style="background:${STATUS_COLORS.edit}"></i><span>${escapeHtml(t('mapLegendEdit'))}</span></div>
        <div style="margin-bottom:4px"><i style="background:${STATUS_COLORS.conf}"></i><span>${escapeHtml(t('mapLegendConf'))}</span></div>
        <div style="margin-bottom:4px"><i style="background:${STATUS_COLORS.ship}"></i><span>${escapeHtml(t('mapLegendShip'))}</span></div>
        <div style="border-top: 1px solid #f1f5f9; margin-top: 6px; padding-top: 4px;">
            <i style="background:${STATUS_COLORS.empty}"></i><span style="color:#94a3b8">${escapeHtml(t('mapLegendEmpty'))}</span>
        </div>
    `;
}

function addMapLegend(map) {
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = function () {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = buildMapLegendHtml();
        mapLegendContainers.push(div);
        return div;
    };
    legend.addTo(map);
}

function refreshMapLanguage() {
    mapLegendContainers.forEach(div => {
        if (div) div.innerHTML = buildMapLegendHtml();
    });
    rebindMapTooltips();
    updateMapData(lastFilteredMapData);
}

async function initBranchMaps() {
    if (typeof L === 'undefined') return;
    try {
        await fetchGeoJson();
        mapLayers = [];
        mapLegendContainers = [];
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
            if (c.new > 0) { dotColor = 'bg-brand-red'; borderCls = 'badge-urgent-new font-semibold'; }
            else if (c.edit > 0) { dotColor = 'bg-amber-500'; borderCls = 'border-amber-200 bg-amber-50/70 text-amber-700 font-semibold'; }
            else if (c.conf > 0) { dotColor = 'bg-blue-600'; borderCls = 'border-blue-200 bg-blue-50/70 text-blue-700 font-semibold'; }
            else { dotColor = 'bg-brand-green'; borderCls = 'badge-completed font-semibold'; }
        }
        const safeBranchAttr = escapeHtml(bName);
        const safeLabel = escapeHtml(formatBranchName(bName, true));
        const badge = c && c.total > 0
            ? `<span class="ml-1 px-1.5 py-0.5 bg-white/95 rounded-full text-[10px]">${escapeHtml(String(c.total))}</span>`
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

        const subtitle = buildBranchSubtitle(obj.branch, obj.prov, obj.isGeoJson);
        const statusSummaryHtml = hasAnyData
            ? `<div style="line-height:1.7;">
                <div>${escapeHtml(t('mapPopupTotal'))} <b>${escapeHtml(formatOrderCount(count.total))}</b></div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; font-size:10px; margin-top:2px;">
                    <span style="color:#f00000; font-weight:700;">● ${escapeHtml(t('mapPopupNew'))} ${escapeHtml(String(count.new))}</span>
                    <span style="color:#2563EB; font-weight:700;">● ${escapeHtml(t('mapPopupConf'))} ${escapeHtml(String(count.conf))}</span>
                    <span style="color:#F59E0B; font-weight:700;">● ${escapeHtml(t('mapPopupEdit'))} ${escapeHtml(String(count.edit))}</span>
                    <span style="color:#007947; font-weight:700;">● ${escapeHtml(t('mapPopupShip'))} ${escapeHtml(String(count.ship))}</span>
                </div>
               </div>`
            : `<span style="color:#94a3b8">${escapeHtml(t('mapPopupNoDataDate'))}</span>`;

        obj.layer.setPopupContent(buildBranchPopupHtml(obj.branch, subtitle, statusSummaryHtml));
    });
}
