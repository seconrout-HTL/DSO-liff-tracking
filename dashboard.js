// ============================================
// 📊 DASHBOARD — Stats, Charts & Reports
// ============================================

function updateDashboard(data) {
    let stats = { total: data.length, new: 0, conf: 0, edit: 0, shipped: 0 };
    data.forEach(item => {
        const p = calculateProgress(item);
        const hasEdit = item.editCount > 0;
        if (p >= 4) {
            stats.shipped++;
        } else if (p === 2) {
            stats.conf++;
            if (hasEdit) stats.edit++;
        } else {
            stats.new++;
        }
    });

    const setTxt = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    };

    setTxt('m-dash-total', stats.total);
    setTxt('m-dash-new', stats.new);
    setTxt('m-dash-conf', stats.conf);
    setTxt('m-dash-shipped', stats.shipped);

    setTxt('d-dash-total', stats.total);
    setTxt('d-dash-new', stats.new);
    setTxt('d-dash-conf', stats.conf);
    setTxt('d-dash-shipped', stats.shipped);
}

function renderDashboardTables(filteredData) {
    renderFrequencyChart(filteredData);
    renderFrequencyTable(globalData);
    renderBranchStatusTable(filteredData);
}

// ============================================
// 📈 FREQUENCY CHART & TABLE
// ============================================

function renderFrequencyChart(currentDayData) {
    let slots = [0, 0, 0, 0, 0, 0];

    currentDayData.forEach(item => {
        const timeParts = item.timestamp.split(' ')[1].split(':');
        const h = parseInt(timeParts[0]);
        const m = parseInt(timeParts[1]);
        const minutes = h * 60 + m;

        if (minutes <= 960) slots[0]++;
        else if (minutes <= 1020) slots[1]++;
        else if (minutes <= 1050) slots[2]++;
        else if (minutes <= 1080) slots[3]++;
        else if (minutes <= 1110) slots[4]++;
        else slots[5]++;
    });

    const labels = ['<16:00', '16-17:00', '17-17:30', '17:30-18', '18-18:30', '>18:30'];
    const dataset = {
        label: 'จำนวนงาน (Orders)',
        data: slots,
        borderColor: '#E41E2B',
        backgroundColor: (ctx) => {
            const canvas = ctx.chart.ctx;
            const gradient = canvas.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(228, 30, 43, 0.15)');
            gradient.addColorStop(1, 'rgba(228, 30, 43, 0.01)');
            return gradient;
        },
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#E41E2B',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
    };

    const config = {
        type: 'line',
        data: { labels: labels, datasets: [dataset] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 },
                    grid: { color: 'rgba(0,0,0,0.04)' }
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    };

    const ctxM = document.getElementById('m-freq-chart').getContext('2d');
    if (mFreqChartInstance) mFreqChartInstance.destroy();
    mFreqChartInstance = new Chart(ctxM, JSON.parse(JSON.stringify(config)));
    // Recreate gradient for mobile
    mFreqChartInstance.data.datasets[0].backgroundColor = (ctx) => {
        const canvas = ctx.chart.ctx;
        const gradient = canvas.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(228, 30, 43, 0.15)');
        gradient.addColorStop(1, 'rgba(228, 30, 43, 0.01)');
        return gradient;
    };
    mFreqChartInstance.update();

    const ctxD = document.getElementById('d-freq-chart').getContext('2d');
    if (freqChartInstance) freqChartInstance.destroy();
    freqChartInstance = new Chart(ctxD, config);
}

function renderFrequencyTable(allData) {
    const freqMap = {};
    allData.forEach(item => {
        if (!item.isoDate) return;
        if (!freqMap[item.isoDate]) freqMap[item.isoDate] = { d: item.timestamp.split(' ')[0], s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, s6: 0 };

        const timeParts = item.timestamp.split(' ')[1].split(':');
        const h = parseInt(timeParts[0]);
        const m = parseInt(timeParts[1]);
        const minutes = h * 60 + m;

        if (minutes <= 960) freqMap[item.isoDate].s1++;
        else if (minutes <= 1020) freqMap[item.isoDate].s2++;
        else if (minutes <= 1050) freqMap[item.isoDate].s3++;
        else if (minutes <= 1080) freqMap[item.isoDate].s4++;
        else if (minutes <= 1110) freqMap[item.isoDate].s5++;
        else freqMap[item.isoDate].s6++;
    });

    const freqArr = Object.values(freqMap).sort((a, b) => b.d.localeCompare(a.d)).slice(0, 10);

    const createRow = (row) => `
        <tr class="border-b border-gray-100 hover:bg-red-50/30 transition">
            <td class="p-2 text-left font-medium text-gray-700">${row.d}</td>
            <td class="p-2 text-gray-500">${row.s1 || '-'}</td>
            <td class="p-2 text-gray-500">${row.s2 || '-'}</td>
            <td class="p-2 text-gray-500">${row.s3 || '-'}</td>
            <td class="p-2 text-gray-500">${row.s4 || '-'}</td>
            <td class="p-2 text-gray-500">${row.s5 || '-'}</td>
            <td class="p-2 text-gray-500">${row.s6 || '-'}</td>
        </tr>
    `;

    const rows = freqArr.map(createRow).join('');

    const mBody = document.getElementById('m-freq-table-body');
    const dBody = document.getElementById('d-freq-table-body');
    if (mBody) mBody.innerHTML = rows || '<tr><td colspan="7" class="p-4 text-center text-gray-400">ไม่มีข้อมูล</td></tr>';
    if (dBody) dBody.innerHTML = rows || '<tr><td colspan="7" class="p-4 text-center text-gray-400">ไม่มีข้อมูล</td></tr>';
}

// ============================================
// 🏢 BRANCH STATUS TABLE
// ============================================

function renderBranchStatusTable(currentData) {
    const activeBranches = {};
    currentData.forEach(item => {
        activeBranches[item.branch] = { status: getStatusCode(item), time: item.timestamp.split(' ')[1] };
    });

    const missingBranches = [];
    const masterBranches = Object.values(branchNames);

    masterBranches.forEach(b => {
        if (!activeBranches[b]) missingBranches.push(b);
    });

    missingBranches.sort();

    let html = '';

    if (missingBranches.length > 0) {
        html += `<div class="mb-2 text-xs font-bold text-red-400">ยังไม่แจ้งงาน (${missingBranches.length})</div>`;
        html += `<div class="flex flex-wrap gap-2 mb-4">`;
        missingBranches.forEach(b => {
            html += `<span class="px-2 py-1 bg-red-50 text-red-400 text-xs rounded-lg border border-red-100">${b}</span>`;
        });
        html += `</div>`;
    } else {
        html += `<div class="mb-4 text-center text-xs text-green-500 bg-green-50 p-2 rounded-lg">ครบทุกสาขาแล้ว</div>`;
    }

    if (Object.keys(activeBranches).length > 0) {
        html += `<div class="mb-2 text-xs font-bold text-gray-500">แจ้งงานแล้ว (${Object.keys(activeBranches).length})</div>`;
        Object.entries(activeBranches).forEach(([name, info]) => {
            let color = 'text-gray-600';
            let statusTxt = 'งานใหม่';
            if (info.status === 'conf') { color = 'text-blue-500'; statusTxt = 'ยืนยันแล้ว'; }
            else if (info.status === 'ship') { color = 'text-green-600'; statusTxt = 'เสร็จสิ้น'; }
            else if (info.status === 'edit') { color = 'text-orange-500'; statusTxt = 'แก้ไข'; }

            html += `
            <div class="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100 mb-1 hover:bg-gray-100 transition">
                <div class="font-bold text-sm text-gray-700">${name}</div>
                <div class="text-right">
                    <div class="text-xs ${color} font-bold">${statusTxt}</div>
                    <div class="text-[10px] text-gray-400">${info.time} น.</div>
                </div>
            </div>`;
        });
    } else {
        html += `<div class="p-4 text-center text-sm text-gray-400 bg-gray-50 rounded-lg mb-2">ไม่มีข้อมูลการแจ้งงาน</div>`;
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
    const mFilter = document.getElementById('m-branch-filter');
    const dFilter = document.getElementById('d-branch-filter');

    let options = '<option value="">ทุกสาขา</option>';
    const sortedBranches = Array.from(uniqueBranches).sort();
    sortedBranches.forEach(b => {
        options += `<option value="${b}">${b}</option>`;
    });

    if (mFilter && mFilter.options.length <= 1) mFilter.innerHTML = options;
    if (dFilter && dFilter.options.length <= 1) dFilter.innerHTML = options;
}

function switchReportType(type) {
    const dBtnDaily = document.getElementById('d-btn-daily');
    const dBtnMonthly = document.getElementById('d-btn-monthly');
    const mBtnDaily = document.getElementById('m-btn-daily');
    const mBtnMonthly = document.getElementById('m-btn-monthly');

    if (type === 'daily') {
        if (dBtnDaily) dBtnDaily.className = 'report-btn active p-4 rounded-xl font-medium transition';
        if (dBtnMonthly) dBtnMonthly.className = 'report-btn p-4 rounded-xl font-medium transition';
        if (mBtnDaily) mBtnDaily.className = 'report-btn active p-3 rounded-xl text-sm font-medium transition';
        if (mBtnMonthly) mBtnMonthly.className = 'report-btn p-3 rounded-xl text-sm font-medium transition';

        ['d-daily-report', 'm-daily-report'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('hidden');
        });
        ['d-monthly-report', 'm-monthly-report'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    } else {
        if (dBtnDaily) dBtnDaily.className = 'report-btn p-4 rounded-xl font-medium transition';
        if (dBtnMonthly) dBtnMonthly.className = 'report-btn active p-4 rounded-xl font-medium transition';
        if (mBtnDaily) mBtnDaily.className = 'report-btn p-3 rounded-xl text-sm font-medium transition';
        if (mBtnMonthly) mBtnMonthly.className = 'report-btn active p-3 rounded-xl text-sm font-medium transition';

        ['d-daily-report', 'm-daily-report'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        ['d-monthly-report', 'm-monthly-report'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('hidden');
        });
    }
}

function updateDailyReport(source) {
    let activeDate = "";
    if (source === 'mobile') {
        activeDate = document.getElementById('m-report-date').value;
        document.getElementById('d-report-date').value = activeDate;
    } else if (source === 'desktop') {
        activeDate = document.getElementById('d-report-date').value;
        document.getElementById('m-report-date').value = activeDate;
    } else {
        activeDate = document.getElementById('d-report-date').value || document.getElementById('m-report-date').value;
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
        html = '<tr><td colspan="8" class="p-6 text-center text-gray-400">ไม่พบข้อมูลตามวันที่เลือก</td></tr>';
    } else {
        html = sortedData.map(row => {
            const dateParts = row.timestamp.split(' ');
            const notiDate = dateParts[0];
            const notiTime = row.bill.time || '-';
            return `
            <tr class="hover:bg-red-50/30 border-b border-gray-100 last:border-0 text-xs md:text-sm transition">
                <td class="p-2 md:p-3 font-medium text-gray-800">${row.branch}</td>
                <td class="p-2 md:p-3">${notiDate}</td>
                <td class="p-2 md:p-3">${row.deliveryDate}</td>
                <td class="p-2 md:p-3 text-center text-gray-500">${notiTime}</td>
                <td class="p-2 md:p-3 text-center text-gray-500">${row.conf.time || '-'}</td>
                <td class="p-2 md:p-3 text-center text-gray-500">${row.ship.time || '-'}</td>
                <td class="p-2 md:p-3 text-right font-medium text-blue-600">${row.shipmentAmount}</td>
                <td class="p-2 md:p-3 text-center">${row.processingTime || '-'}</td>
            </tr>`;
        }).join('');
    }

    if (mBODY) mBODY.innerHTML = html;
    if (dBODY) dBODY.innerHTML = html;
}

function updateMonthlyReport(source) {
    let activeMonth, activeYear, activeBranch;

    if (source === 'mobile') {
        activeMonth = document.getElementById('m-report-month').value;
        activeYear = document.getElementById('m-report-year').value;
        activeBranch = document.getElementById('m-branch-filter').value;

        document.getElementById('d-report-month').value = activeMonth;
        document.getElementById('d-report-year').value = activeYear;
        document.getElementById('d-branch-filter').value = activeBranch;
    } else if (source === 'desktop') {
        activeMonth = document.getElementById('d-report-month').value;
        activeYear = document.getElementById('d-report-year').value;
        activeBranch = document.getElementById('d-branch-filter').value;

        document.getElementById('m-report-month').value = activeMonth;
        document.getElementById('m-report-year').value = activeYear;
        document.getElementById('m-branch-filter').value = activeBranch;
    } else {
        activeMonth = document.getElementById('d-report-month').value;
        activeYear = document.getElementById('d-report-year').value;
        activeBranch = document.getElementById('d-branch-filter').value;
    }

    if (!activeYear) return;

    const filtered = globalData.filter(item => {
        if (!item.isoDate) return false;
        const [y, m, d] = item.isoDate.split('-');
        const matchMonth = parseInt(m) === parseInt(activeMonth);
        const matchYear = parseInt(y) === parseInt(activeYear);
        const matchBranch = activeBranch === "" || item.branch === activeBranch;
        return matchMonth && matchYear && matchBranch;
    });

    const summary = {};
    filtered.forEach(item => {
        if (!summary[item.branch]) summary[item.branch] = { do: 0, sh: 0 };
        summary[item.branch].do++;
        const sAmt = parseFloat(String(item.shipmentAmount).replace(/,/g, ''));
        if (!isNaN(sAmt)) summary[item.branch].sh += sAmt;
    });

    const branches = Object.keys(summary).sort();
    let html = '';

    if (branches.length === 0) {
        html = '<tr><td colspan="5" class="p-6 text-center text-gray-400">ไม่พบข้อมูลในเดือนนี้</td></tr>';
    } else {
        html = branches.map(b => {
            const s = summary[b];
            return `
            <tr class="hover:bg-red-50/30 border-b border-gray-100 last:border-0 text-xs md:text-sm transition">
                <td class="p-2 md:p-3 font-medium text-gray-800">${b}</td>
                <td class="p-2 md:p-3 text-center text-gray-500">-</td>
                <td class="p-2 md:p-3 text-center text-gray-800">${s.do}</td>
                <td class="p-2 md:p-3 text-center font-medium text-blue-600">${s.sh}</td>
                <td class="p-2 md:p-3 text-center text-gray-500">-</td>
            </tr>`;
        }).join('');
    }

    const mBODY = document.getElementById('m-monthly-table-body');
    const dBODY = document.getElementById('d-monthly-table-body');
    if (mBODY) mBODY.innerHTML = html;
    if (dBODY) dBODY.innerHTML = html;
}

// ============================================
// 📤 EXPORT LOGIC
// ============================================

function confirmExport() {
    const start = document.getElementById('export-start').value;
    const end = document.getElementById('export-end').value;

    if (!start || !end) {
        alert("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด");
        return;
    }

    const exportData = globalData.filter(item => {
        if (!item.isoDate) return false;
        return item.isoDate >= start && item.isoDate <= end;
    });

    if (exportData.length === 0) {
        alert("ไม่พบข้อมูลในช่วงวันที่เลือก");
        return;
    }

    const includeChart = document.getElementById('export-include-chart').checked;

    const wb = XLSX.utils.book_new();

    const wsData = [
        ["สาขา", "วันที่แจ้งงาน", "วันที่ส่งสินค้า", "เวลาแจ้งงาน", "เวลายืนยัน", "เวลาออก shipment", "จำนวน shipment", "ระยะเวลาดำเนินการ (นาที)", "จำนวนการแก้ไข", "หมายเหตุ"]
    ];

    exportData.forEach(row => {
        const dateParts = row.timestamp.split(' ');
        const notiDate = dateParts[0] || '-';
        const notiTime = row.bill.time || '-';

        let deliveryDate = row.deliveryDate || '-';
        if (deliveryDate !== '-') {
            const dateMatch = deliveryDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
            if (dateMatch) {
                let year = parseInt(dateMatch[3]);
                if (dateMatch[3].length === 2) year += 2000;
                deliveryDate = `${dateMatch[1]}/${dateMatch[2]}/${year}`;
            }
        }

        wsData.push([
            row.branch || '-',
            notiDate,
            deliveryDate,
            notiTime,
            row.conf.time || '-',
            row.ship.time || '-',
            row.shipmentAmount !== '-' ? row.shipmentAmount : '',
            row.editCount > 0 ? row.editCount.toString() : '0',
            row.processingTime !== '-' ? row.processingTime : '',
            row.note || ''
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = [
        { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
        { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 12 },
        { wch: 25 }, { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "ข้อมูลการแจ้งงาน");

    if (includeChart) {
        addChartToWorkbook(wb, start, end);
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `FleetOrder_Export_${start}_to_${end}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    closeExportModal();
}

function addChartToWorkbook(wb, start, end) {
    const canvasId = window.innerWidth >= 768 ? 'd-freq-chart' : 'm-freq-chart';
    const canvas = document.getElementById(canvasId);

    if (canvas) {
        if (canvas.width === 0 || canvas.height === 0) {
            alert("ไม่สามารถบันทึกรูปกราฟได้ เนื่องจากกราฟถูกซ่อนอยู่\n\nคำแนะนำ: กรุณากดเข้าเมนู 'ภาพรวม (Dashboard)' แล้วลอง Export ใหม่อีกครั้งครับ");
            return;
        }

        try {
            const imageData = canvas.toDataURL('image/png', 1.0);

            const chartWs = XLSX.utils.aoa_to_sheet([
                ["รายงานกราฟความถี่การแจ้งงาน"],
                [`ช่วงวันที่: ${start} ถึง ${end}`],
                [""],
                ["กราฟแสดงความถี่การแจ้งงานในช่วงเวลาต่างๆ ของวัน"]
            ]);

            chartWs['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, chartWs, "กราฟความถี่");

            chartWs['A5'] = {
                t: 's',
                v: '📊 กราฟความถี่การแจ้งงาน (คลิกเพื่อดูรูปภาพ)'
            };

            if (!wb.Props) wb.Props = {};
            wb.Props.ChartImage = imageData;

            const imageLink = document.createElement('a');
            imageLink.download = `FleetOrder_Chart_${start}_to_${end}.png`;
            imageLink.href = imageData;
            document.body.appendChild(imageLink);
            imageLink.click();
            document.body.removeChild(imageLink);

            console.log("Chart image prepared for Excel export");

        } catch (e) {
            console.error("Chart Export Error:", e);
            alert("เกิดข้อผิดพลาดในการบันทึกรูปภาพกราฟ: " + e.message);
        }
    } else {
        alert("ไม่พบกราฟ");
    }
}
