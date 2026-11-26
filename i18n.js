// ============================================
// 🌐 I18N — Pure Thai / Pure English Localization
// ============================================

const I18N_STORAGE_KEY = 'dso_lang';
let currentLang = 'th';

const PROVINCE_TH_NAMES = Object.freeze({
    'Chumphon': 'ชุมพร',
    'Ranong': 'ระนอง',
    'Surat Thani': 'สุราษฎร์ธานี',
    'Nakhon Si Thammarat': 'นครศรีธรรมราช',
    'Phangnga': 'พังงา',
    'Phuket': 'ภูเก็ต',
    'Krabi': 'กระบี่',
    'Trang': 'ตรัง',
    'Phatthalung': 'พัทลุง',
    'Satun': 'สตูล',
    'Songkhla': 'สงขลา',
    'Pattani': 'ปัตตานี',
    'Yala': 'ยะลา',
    'Narathiwat': 'นราธิวาส'
});

const BRANCH_EN_NAMES = Object.freeze({
    'สาขาชุมพร': 'Chumphon',
    'สาขาหลังสวน': 'Lang Suan',
    'สาขาระนอง': 'Ranong',
    'สาขาสุราษฎร์ธานี': 'Surat Thani',
    'สาขาพุนพิน': 'Phunphin',
    'สาขาสมุย': 'Samui',
    'เขตเกาะพะงัน': 'Koh Phangan',
    'สาขานครศรีธรรมราช': 'Nakhon Si Thammarat',
    'สาขาทุ่งสง': 'Thung Song',
    'สาขาตะกั่วป่า': 'Takua Pa',
    'สาขาพังงา': 'Phang Nga',
    'เขตเกาะยาว': 'Koh Yao',
    'สาขาภูเก็ต': 'Phuket',
    'เขตกลางคืน': 'Night Shift',
    'สาขากระบี่': 'Krabi',
    'สาขาตรัง': 'Trang',
    'สาขาพัทลุง': 'Phatthalung',
    'สาขาสตูล': 'Satun',
    'สาขาหาดใหญ่': 'Hat Yai',
    'สาขาปัตตานี': 'Pattani',
    'สาขายะลา': 'Yala',
    'สาขานราธิวาส': 'Narathiwat'
});

const BRANCH_DISTRICT_INFO_I18N = Object.freeze({
    th: Object.freeze({
        'สาขานครศรีธรรมราช': 'อ.เมืองนครศรีฯ, ขนอม, สิชล, นบพิตำ, ท่าศาลา, พิปูน, พรหมคีรี, ลานสกา, พระพรหม, ปากพนัง, ร่อนพิบูลย์, เฉลิมพระเกียรติ, เชียรใหญ่, หัวไทร',
        'สาขาทุ่งสง': 'อ.ทุ่งสง, ถ้ำพรรณรา, ฉวาง, ช้างกลาง, ทุ่งใหญ่, นาบอน, บางขัน, จุฬาภรณ์, ชะอวด',
        'สาขาสุราษฎร์ธานี': 'อ.เมืองสุราษฎร์ธานี, กาญจนดิษฐ์, ดอนสัก, บ้านนาเดิม, บ้านนาสาร, เวียงสระ',
        'สาขาพุนพิน': 'อ.พุนพิน, ท่าชนะ, ไชยา, ท่าฉาง, วิภาวดี, บ้านตาขุน, คีรีรัฐนิคม, พนม, เคียนซา, พระแสง, ชัยบุรี',
        'สาขาสมุย': 'อ.เกาะสมุย',
        'เขตเกาะพะงัน': 'อ.เกาะพะงัน, เกาะเต่า',
        'สาขาชุมพร': 'อ.เมืองชุมพร, ท่าแซะ, ปะทิว',
        'สาขาหลังสวน': 'อ.หลังสวน, สวี, ทุ่งตะโก, พะโต๊ะ, ละแม',
        'สาขาตะกั่วป่า': 'อ.ตะกั่วป่า, คุระบุรี, กะปง',
        'สาขาพังงา': 'อ.เมืองพังงา, ทับปุด, ท้ายเหมือง, ตะกั่วทุ่ง',
        'เขตเกาะยาว': 'อ.เกาะยาว, เกาะยาวใหญ่, เกาะยาวน้อย'
    }),
    en: Object.freeze({
        'สาขานครศรีธรรมราช': 'Mueang Nakhon Si Thammarat, Khanom, Sichon, Nopphitam, Tha Sala, Phipun, Phrom Khiri, Lan Saka, Phra Phrom, Pak Phanang, Ron Phibun, Chaloem Phra Kiat, Chian Yai, Hua Sai',
        'สาขาทุ่งสง': 'Thung Song, Tham Phannara, Chawang, Chang Klang, Thung Yai, Na Bon, Bang Khan, Chulabhorn, Cha-uat',
        'สาขาสุราษฎร์ธานี': 'Mueang Surat Thani, Kanchanadit, Don Sak, Ban Na Doem, Ban Na San, Wiang Sa',
        'สาขาพุนพิน': 'Phunphin, Tha Chana, Chaiya, Tha Chang, Vibhavadi, Ban Ta Khun, Khiri Rat Nikhom, Phanom, Khian Sa, Phra Saeng, Chai Buri',
        'สาขาสมุย': 'Koh Samui',
        'เขตเกาะพะงัน': 'Koh Phangan, Koh Tao',
        'สาขาชุมพร': 'Mueang Chumphon, Tha Sae, Pathio',
        'สาขาหลังสวน': 'Lang Suan, Sawi, Thung Tako, Phato, Lamae',
        'สาขาตะกั่วป่า': 'Takua Pa, Khura Buri, Kapong',
        'สาขาพังงา': 'Mueang Phang Nga, Thap Put, Thai Mueang, Takua Thung',
        'เขตเกาะยาว': 'Koh Yao Yai, Koh Yao Noi'
    })
});

const I18N_MESSAGES = Object.freeze({
    th: Object.freeze({
        pageTitle: 'ระบบติดตามคำสั่งซื้อ',
        brandSub: 'ระบบติดตามคำสั่งซื้อ',
        brandSubMobile: 'ติดตามคำสั่งซื้อ',
        roleSub: 'ระบบจัดส่งสายรอง',
        guestUser: 'ผู้ใช้งานทั่วไป',
        toastDefault: 'แจ้งเตือน',
        navTracking: 'งานล่าสุด',
        navDashboard: 'แดชบอร์ด',
        navDashboardMobile: 'ภาพรวม',
        navReport: 'รายงาน',
        navSupport: 'ศูนย์ช่วยเหลือ',
        navHelp: 'ช่วยเหลือ',
        titleTracking: 'งานล่าสุด',
        titleDashboard: 'แดชบอร์ด',
        titleReport: 'รายงาน',
        titleHelp: 'ช่วยเหลือและคำถามที่พบบ่อย',
        btnExport: 'ส่งออกข้อมูล',
        btnRefreshTitle: 'รีเฟรชข้อมูล',
        filterDateLabel: 'วันที่:',
        filterStatusLabel: 'สถานะ:',
        filterBranchLabel: 'สาขา:',
        filterStatusTitle: 'ตัวกรองสถานะงาน',
        filterStatusShow: 'สถานะที่แสดง',
        filterAll: 'ทั้งหมด',
        filterSelected: 'เลือก {n} สถานะ',
        searchPlaceholderMobile: 'ค้นหาสาขา...',
        searchPlaceholderDesktop: 'ค้นหาชื่อสาขา เช่น ภูเก็ต',
        btnConfirm: 'ตกลง',
        btnCancel: 'ยกเลิก',
        btnDownload: 'ดาวน์โหลด',
        sortLabel: 'เรียง:',
        sortDefault: 'คิวล่าสุด',
        sortTimestampAsc: 'เวลาเก่าสุด',
        sortQueueAsc: 'ลำดับคิว',
        sortBranchAsc: 'สาขา ก-ฮ',
        sortAmountDesc: 'ยอดบิลมากสุด',
        colQueue: 'ลำดับ',
        colTimestamp: 'วันเวลาแจ้งงาน',
        colBranch: 'สาขา',
        colDeliveryDate: 'วันที่ส่งสินค้า',
        colStatus: 'สถานะ',
        colTimeline: 'สถานะขั้นตอน',
        colDoAmount: 'จำนวน DO',
        colShipment: 'จำนวนจัดส่ง',
        colAction: 'จัดการ',
        btnCancelOrder: 'ยกเลิกรายการ',
        cancelModalTitle: 'ยืนยันการยกเลิกรายการ',
        cancelModalWarning: 'รายการนี้จะถูกลบออกจากชีท Log ทันที และระบบจะจัดลำดับคิวของวันนั้นใหม่ (ไม่สามารถกู้คืนได้)',
        cancelModalClose: 'ปิด',
        cancelModalConfirm: 'ยืนยันยกเลิก',
        cancelModalProcessing: 'กำลังยกเลิก...',
        cancelSummaryBranch: 'สาขา',
        cancelSummaryQueue: 'ลำดับคิว',
        cancelSummaryDelivery: 'วันที่ส่งสินค้า',
        cancelSummaryDo: 'จำนวน DO',
        cancelSummaryStatus: 'สถานะปัจจุบัน',
        toastCancelSuccess: 'ยกเลิกรายการ {branch} เรียบร้อยแล้ว',
        toastCancelAlreadyShipped: 'งานนี้ปิด Shipment ไปแล้ว ไม่สามารถยกเลิกได้',
        toastCancelNotFound: 'ไม่พบรายการนี้ หรืออาจถูกยกเลิกไปแล้ว',
        toastCancelError: 'ยกเลิกรายการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
        cardDoLabel: 'จำนวน DO',
        cardDeliverLabel: 'วันที่ส่ง:',
        cardShipmentLabel: 'จัดส่ง',
        statusNew: 'งานใหม่',
        statusConfirmed: 'ยืนยันแล้ว',
        statusConfirmedShort: 'ยืนยัน',
        statusEdited: 'แก้ไขบิล',
        statusEditedShort: 'แก้บิล',
        statusShipped: 'เสร็จสิ้น',
        statusNewDesc: 'งานใหม่ รอตรวจสอบ',
        statusConfirmedDesc: 'ยืนยันแล้ว รับเรื่อง',
        statusEditedDesc: 'แก้ไขบิล มีการปรับปรุง',
        statusShippedDesc: 'เสร็จสิ้น ออกใบจัดส่งแล้ว',
        queueReady: 'ถึงคิวแล้ว ▲',
        queueWaiting: 'รออีก {n} คิว ▼',
        editTimes: '{n} ครั้ง',
        emptyList: 'ไม่พบรายการ',
        emptySearch: 'ไม่พบข้อมูลที่ค้นหา',
        emptyData: 'ไม่มีข้อมูล',
        emptyDate: 'ไม่พบข้อมูลตามวันที่เลือก',
        emptyMonth: 'ไม่พบข้อมูลในเดือนนี้',
        statTotal: 'งานทั้งหมด',
        statNew: 'งานใหม่',
        statConfirmed: 'ยืนยันแล้ว',
        statCompleted: 'เสร็จสิ้น',
        chartTitleDesktop: 'ความถี่การแจ้งงานประจำวัน',
        chartTitleMobile: 'ความถี่การแจ้งงาน',
        chartSubtitleDesktop: 'แบ่งตามช่วงเวลา',
        chartSubtitleMobile: 'รายช่วงเวลา',
        chartDatasetOrders: 'จำนวนงาน',
        chartDatasetCap: 'เพดานงาน',
        freqTitleDesktop: 'ตารางความถี่ย้อนหลัง',
        freqTitleMobile: 'ตารางความถี่ย้อนหลัง',
        freqLast10Days: '10 วันล่าสุด',
        freqDateCol: 'วันที่',
        branchStatusTitleDesktop: 'สถานะรายสาขา',
        branchStatusTitleMobile: 'สถานะรายสาขา',
        branchStatusBadge: 'อัปเดตอัตโนมัติ',
        branchMissing: 'ยังไม่แจ้งงาน ({n})',
        branchAllSubmitted: 'ครบทุกสาขาแล้ว',
        branchSubmitted: 'แจ้งงานแล้ว ({n})',
        branchNoReports: 'ไม่มีข้อมูลการแจ้งงาน',
        branchOrderCount: '{n} งาน',
        timeSuffix: ' น.',
        mapTitleDesktop: 'แผนที่พื้นที่สาขาภาคใต้',
        mapTitleMobile: 'แผนที่พื้นที่สาขา',
        mapHint: 'คลิกที่ปุ่มชื่อสาขาด้านล่าง หรือคลิกบนพื้นที่แผนที่เพื่อดูรายละเอียดจำนวนงานรายสาขา',
        mapStyleLight: 'แผนที่สีอ่อน',
        mapStyleLightShort: 'สีอ่อน',
        mapStyleStreet: 'แผนที่ถนนและอำเภอ',
        mapStyleStreetShort: 'ถนน/อำเภอ',
        mapStyleNone: 'โหมดไร้พื้นหลัง',
        mapStyleNoneShort: 'ไร้พื้นหลัง',
        mapToggleLabels: 'ชื่อสาขา',
        mapResetView: 'รีเซ็ตมุมมอง',
        mapLegendTitle: 'สถานะรายวัน',
        mapLegendNew: 'งานใหม่ รอตรวจสอบ',
        mapLegendEdit: 'ต้องแก้ไขบิล',
        mapLegendConf: 'ยืนยันแล้ว รับเรื่อง',
        mapLegendShip: 'เสร็จสิ้นทั้งหมด',
        mapLegendEmpty: 'ไม่มีงานหรือเขตว่าง',
        mapPopupProvincePrefix: 'จ.',
        mapPopupServiceArea: 'พื้นที่บริการ {branch}',
        mapPopupNightArea: 'พื้นที่กะกลางคืน จังหวัด{prov}',
        mapPopupNoDataToday: 'ไม่มีงานวันนี้',
        mapPopupNoDataDate: 'ไม่มีงานในวันที่เลือก',
        mapPopupTotal: 'รวมทั้งหมด:',
        mapPopupNew: 'ใหม่',
        mapPopupConf: 'ยืนยัน',
        mapPopupEdit: 'แก้ไข',
        mapPopupShip: 'เสร็จ',
        reportTypeTitle: 'เลือกรูปแบบรายงาน',
        reportDaily: 'รายงานรายวัน',
        reportDailyShort: 'รายวัน',
        reportMonthly: 'รายงานสรุปรายเดือน',
        reportMonthlyShort: 'รายเดือน',
        reportPickDate: 'เลือกวันที่ตรวจสอบ',
        reportPickDateShort: 'เลือกวันที่',
        reportDetailTitle: 'รายงานรายละเอียด',
        reportPickMonthYear: 'เลือกเดือนและปี',
        reportFilterBranch: 'กรองตามสาขา',
        reportAllBranches: 'ทุกสาขา',
        reportYearPlaceholder: 'ปี ค.ศ.',
        reportMonthlyTitle: 'สรุปรายเดือน',
        rColBranch: 'สาขา',
        rColNotiDate: 'วันที่แจ้ง',
        rColDelivDate: 'วันที่ส่ง',
        rColNotiTime: 'เวลาแจ้ง',
        rColConfTime: 'เวลายืนยัน',
        rColShipTime: 'เวลาออกใบจัดส่ง',
        rColShipTimeShort: 'เวลาจัดส่ง',
        rColShipAmt: 'จำนวนจัดส่ง',
        rColShipAmtShort: 'จัดส่ง',
        rColProcMin: 'ดำเนินการ นาที',
        rColProcMinShort: 'นาที',
        rColAvgTime: 'เวลาแจ้งเฉลี่ย',
        rColDoCount: 'จำนวน DO',
        rColShCount: 'จำนวนจัดส่ง',
        rColProcTime: 'เวลาดำเนินการ',
        month1: 'มกราคม', month2: 'กุมภาพันธ์', month3: 'มีนาคม', month4: 'เมษายน',
        month5: 'พฤษภาคม', month6: 'มิถุนายน', month7: 'กรกฎาคม', month8: 'สิงหาคม',
        month9: 'กันยายน', month10: 'ตุลาคม', month11: 'พฤศจิกายน', month12: 'ธันวาคม',
        exportModalTitle: 'ส่งออกข้อมูลเป็นไฟล์ตาราง',
        exportStartLabel: 'วันที่เริ่มต้น',
        exportEndLabel: 'วันที่สิ้นสุด',
        exportIncludeChart: 'บันทึกรูปกราฟความถี่ด้วย',
        toastSelectDates: 'กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด',
        toastNoExportData: 'ไม่พบข้อมูลในช่วงวันที่เลือก',
        toastExportSuccess: 'ดาวน์โหลดไฟล์เรียบร้อยแล้ว',
        toastExportNoLib: 'ไม่พบเครื่องมือส่งออกไฟล์',
        toastOpenDashForChart: 'กรุณาเปิดหน้าแดชบอร์ดก่อนบันทึกกราฟ',
        toastChartExportErr: 'เกิดข้อผิดพลาดในการบันทึกรูปกราฟ',
        toastUnauthorized: 'ไม่มีสิทธิ์เข้าถึงข้อมูล กรุณาเข้าสู่ระบบผ่านไลน์',
        toastLoginUnavailable: 'ไม่สามารถเปิดหน้าเข้าสู่ระบบไลน์ได้ในขณะนี้',
        authTitle: 'ต้องเข้าสู่ระบบผ่านไลน์',
        authMessage: 'กรุณาเข้าสู่ระบบด้วยบัญชีไลน์ที่ได้รับอนุญาตเพื่อเข้าถึงข้อมูลระบบติดตามคำสั่งซื้อ',
        authLoginBtn: 'เข้าสู่ระบบด้วยไลน์',
        helpTitle: 'ช่วยเหลือและคำถามที่พบบ่อย',
        helpTimelineTitle: 'คำอธิบายสถานะขั้นตอน',
        faq1Q: 'ตัวเลขและสีในหน้าแดชบอร์ดหมายถึงอะไร?',
        faq1AIntro: 'หน้าแดชบอร์ดจะสรุปสถานะงานทั้งหมดของวันที่เลือก',
        faq1ATotal: 'จำนวนคำสั่งซื้อทั้งหมด',
        faq1ANew: 'คำสั่งซื้อที่รอการตรวจสอบ',
        faq1AConf: 'คำสั่งซื้อที่กำลังดำเนินการ',
        faq1AShip: 'คำสั่งซื้อที่ออกใบจัดส่งเรียบร้อยแล้ว',
        faq2Q: 'วิธีการส่งออกข้อมูลและรูปกราฟทำอย่างไร?',
        faq2S1: 'กดปุ่มส่งออกข้อมูลที่มุมขวาบน',
        faq2S2: 'เลือกวันที่เริ่มต้นและวันที่สิ้นสุด',
        faq2S3: 'หากต้องการรูปกราฟ ให้ติ๊กถูกที่ช่องบันทึกรูปกราฟความถี่ด้วย',
        faq2S4: 'กดปุ่มดาวน์โหลด',
        faq3Q: 'ระบบอัปเดตข้อมูลอัตโนมัติหรือไม่?',
        faq3A: 'ระบบจะอัปเดตข้อมูลอัตโนมัติทุกๆ 20 วินาที หรือกดปุ่มรีเฟรชเพื่อดึงข้อมูลล่าสุดได้ทันที',
        faq4Q: 'กราฟความถี่แสดงข้อมูลอะไร?',
        faq4A: 'แสดงปริมาณงานในแต่ละช่วงเวลาของวันที่เลือก เพื่อช่วยวางแผนการทำงานในช่วงเวลาหนาแน่น',
        faq5Q: 'การจัดลำดับคิวทำงานอย่างไร?',
        faq5A: 'ใช้หลักมาก่อนได้ก่อน เรียงตามเวลาที่แจ้งงาน คิวจะเริ่มนับใหม่ที่ #01 ทุกวัน',
        faq6Q: 'หากพบข้อมูลผิดพลาดต้องทำอย่างไร?',
        faq6A: 'แจ้งปัญหาได้ทางไลน์หรือติดต่อทีมไอที โดยระบุสาขา วันที่ และรายละเอียดที่พบ'
    }),
    en: Object.freeze({
        pageTitle: 'Fleet Order Tracking',
        brandSub: 'Fleet Order Tracking',
        brandSubMobile: 'Fleet Order',
        roleSub: 'Secondary Routing',
        guestUser: 'Guest User',
        toastDefault: 'Notification',
        navTracking: 'Recent Orders',
        navDashboard: 'Dashboard',
        navDashboardMobile: 'Overview',
        navReport: 'Reports',
        navSupport: 'Support',
        navHelp: 'Help',
        titleTracking: 'Recent Orders',
        titleDashboard: 'Dashboard',
        titleReport: 'Reports',
        titleHelp: 'Help & FAQ',
        btnExport: 'Export Excel',
        btnRefreshTitle: 'Refresh Data',
        filterDateLabel: 'Date:',
        filterStatusLabel: 'Status:',
        filterBranchLabel: 'Branch:',
        filterStatusTitle: 'Order Status Filter',
        filterStatusShow: 'Visible Statuses',
        filterAll: 'All',
        filterSelected: '{n} Selected',
        searchPlaceholderMobile: 'Search branch...',
        searchPlaceholderDesktop: 'Search branch, e.g. Phuket',
        btnConfirm: 'Apply',
        btnCancel: 'Cancel',
        btnDownload: 'Download',
        sortLabel: 'Sort:',
        sortDefault: 'Latest Queue',
        sortTimestampAsc: 'Oldest Time',
        sortQueueAsc: 'Queue No.',
        sortBranchAsc: 'Branch A-Z',
        sortAmountDesc: 'Highest DO',
        colQueue: 'Queue',
        colTimestamp: 'Timestamp',
        colBranch: 'Branch',
        colDeliveryDate: 'Delivery Date',
        colStatus: 'Status',
        colTimeline: 'Timeline',
        colDoAmount: 'DO Amount',
        colShipment: 'Shipment',
        colAction: 'Action',
        btnCancelOrder: 'Cancel Order',
        cancelModalTitle: 'Confirm Order Cancellation',
        cancelModalWarning: 'This order will be permanently deleted from the Log sheet and daily queue numbers will be recalculated.',
        cancelModalClose: 'Close',
        cancelModalConfirm: 'Confirm Cancel',
        cancelModalProcessing: 'Canceling...',
        cancelSummaryBranch: 'Branch',
        cancelSummaryQueue: 'Queue',
        cancelSummaryDelivery: 'Delivery Date',
        cancelSummaryDo: 'DO Amount',
        cancelSummaryStatus: 'Current Status',
        toastCancelSuccess: 'Order for {branch} has been canceled',
        toastCancelAlreadyShipped: 'This order is already shipped and cannot be canceled',
        toastCancelNotFound: 'Order not found or may already be canceled',
        toastCancelError: 'Failed to cancel order. Please try again.',
        cardDoLabel: 'DO Amount',
        cardDeliverLabel: 'Delivery:',
        cardShipmentLabel: 'Shipment',
        statusNew: 'New',
        statusConfirmed: 'Confirmed',
        statusConfirmedShort: 'Confirmed',
        statusEdited: 'Edited',
        statusEditedShort: 'Edited',
        statusShipped: 'Completed',
        statusNewDesc: 'New — Pending Review',
        statusConfirmedDesc: 'Confirmed — In Progress',
        statusEditedDesc: 'Edited — Bill Revised',
        statusShippedDesc: 'Completed — Shipped',
        queueReady: 'Up Next ▲',
        queueWaiting: '{n} ahead ▼',
        editTimes: '{n}x',
        emptyList: 'No orders found',
        emptySearch: 'No matching orders found',
        emptyData: 'No data',
        emptyDate: 'No orders found for the selected date',
        emptyMonth: 'No data for the selected month',
        statTotal: 'Total Orders',
        statNew: 'New Orders',
        statConfirmed: 'Confirmed',
        statCompleted: 'Completed',
        chartTitleDesktop: 'Daily Order Activity',
        chartTitleMobile: 'Order Activity',
        chartSubtitleDesktop: 'By Time Slot',
        chartSubtitleMobile: 'Time Slots',
        chartDatasetOrders: 'Orders',
        chartDatasetCap: 'Capacity',
        freqTitleDesktop: 'Historical Frequency Log',
        freqTitleMobile: 'Frequency Log',
        freqLast10Days: 'Last 10 Days',
        freqDateCol: 'Date',
        branchStatusTitleDesktop: 'Branch Status & Progress',
        branchStatusTitleMobile: 'Branch Leaderboard',
        branchStatusBadge: 'Live',
        branchMissing: 'Not Submitted ({n})',
        branchAllSubmitted: 'All branches submitted',
        branchSubmitted: 'Submitted ({n})',
        branchNoReports: 'No branch submissions yet',
        branchOrderCount: '{n} orders',
        timeSuffix: '',
        mapTitleDesktop: 'Southern Branch Coverage Map',
        mapTitleMobile: 'Branch Coverage Map',
        mapHint: 'Click a branch chip below or any region on the map to inspect order details',
        mapStyleLight: 'Light Map',
        mapStyleLightShort: 'Light',
        mapStyleStreet: 'Street Map',
        mapStyleStreetShort: 'Street',
        mapStyleNone: 'No Basemap',
        mapStyleNoneShort: 'Plain',
        mapToggleLabels: 'Branch Labels',
        mapResetView: 'Reset View',
        mapLegendTitle: 'Daily Status',
        mapLegendNew: 'New (Pending Review)',
        mapLegendEdit: 'Bill Revision Needed',
        mapLegendConf: 'Confirmed (In Progress)',
        mapLegendShip: 'All Completed',
        mapLegendEmpty: 'No Orders',
        mapPopupProvincePrefix: '',
        mapPopupServiceArea: 'Service Area: {branch}',
        mapPopupNightArea: 'Night Shift Zone ({prov})',
        mapPopupNoDataToday: 'No orders today',
        mapPopupNoDataDate: 'No orders on selected date',
        mapPopupTotal: 'Total:',
        mapPopupNew: 'New',
        mapPopupConf: 'Conf',
        mapPopupEdit: 'Edit',
        mapPopupShip: 'Done',
        reportTypeTitle: 'Report Type',
        reportDaily: 'Daily Report',
        reportDailyShort: 'Daily',
        reportMonthly: 'Monthly Summary',
        reportMonthlyShort: 'Monthly',
        reportPickDate: 'Select Date',
        reportPickDateShort: 'Select Date',
        reportDetailTitle: 'Detail Report',
        reportPickMonthYear: 'Select Month & Year',
        reportFilterBranch: 'Filter by Branch',
        reportAllBranches: 'All Branches',
        reportYearPlaceholder: 'Year',
        reportMonthlyTitle: 'Monthly Summary',
        rColBranch: 'Branch',
        rColNotiDate: 'Order Date',
        rColDelivDate: 'Delivery Date',
        rColNotiTime: 'Order Time',
        rColConfTime: 'Confirmed',
        rColShipTime: 'Shipment Time',
        rColShipTimeShort: 'Shipped',
        rColShipAmt: 'Shipment Qty',
        rColShipAmtShort: 'Shipment',
        rColProcMin: 'Duration (min)',
        rColProcMinShort: 'Min',
        rColAvgTime: 'Avg Order Time',
        rColDoCount: 'DO Count',
        rColShCount: 'Shipments',
        rColProcTime: 'Processing Time',
        month1: 'January', month2: 'February', month3: 'March', month4: 'April',
        month5: 'May', month6: 'June', month7: 'July', month8: 'August',
        month9: 'September', month10: 'October', month11: 'November', month12: 'December',
        exportModalTitle: 'Export Excel Report',
        exportStartLabel: 'Start Date',
        exportEndLabel: 'End Date',
        exportIncludeChart: 'Also download Frequency Chart PNG',
        toastSelectDates: 'Please select both start and end dates',
        toastNoExportData: 'No records found in the selected date range',
        toastExportSuccess: 'Excel file downloaded successfully',
        toastExportNoLib: 'Excel export library not loaded',
        toastOpenDashForChart: 'Please open the Dashboard tab before exporting the chart',
        toastChartExportErr: 'Failed to export chart image',
        toastUnauthorized: 'Unauthorized access. Please sign in with LINE.',
        toastLoginUnavailable: 'LINE login is unavailable right now',
        authTitle: 'LINE Sign-In Required',
        authMessage: 'Please sign in with an authorized LINE account to access Fleet Order Tracking.',
        authLoginBtn: 'Sign in with LINE',
        helpTitle: 'Help & FAQ',
        helpTimelineTitle: 'Timeline Status Guide',
        faq1Q: 'What do the numbers and colors on the Dashboard mean?',
        faq1AIntro: 'The Dashboard summarizes all order statuses for the selected date.',
        faq1ATotal: 'Total number of orders',
        faq1ANew: 'Orders pending initial review',
        faq1AConf: 'Orders confirmed and in progress',
        faq1AShip: 'Orders with shipments completed',
        faq2Q: 'How do I export data and chart images?',
        faq2S1: 'Click the Export button in the top-right header',
        faq2S2: 'Select the Start Date and End Date',
        faq2S3: 'Check "Also download Frequency Chart PNG" if needed',
        faq2S4: 'Click Download',
        faq3Q: 'Does the dashboard refresh automatically?',
        faq3A: 'Yes. Data auto-refreshes every 20 seconds, or you can click Refresh at any time.',
        faq4Q: 'What does the activity frequency chart show?',
        faq4A: 'It shows order volume across daily time slots to help identify peak hours.',
        faq5Q: 'How does queue numbering work?',
        faq5A: 'Orders follow First Come, First Served by submission timestamp and reset to #01 daily.',
        faq6Q: 'What should I do if I notice incorrect data?',
        faq6A: 'Report the issue via LINE or contact IT with the branch name, date, and details.'
    })
});

function t(key, params) {
    const dict = I18N_MESSAGES[currentLang] || I18N_MESSAGES.th;
    let text = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : key;
    if (params && typeof params === 'object') {
        Object.keys(params).forEach(k => {
            text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
        });
    }
    return text;
}

function formatBranchName(canonicalBranch, shortMode = false) {
    if (!canonicalBranch || canonicalBranch === '-') return '-';
    if (currentLang === 'en') {
        if (Object.prototype.hasOwnProperty.call(BRANCH_EN_NAMES, canonicalBranch)) {
            return BRANCH_EN_NAMES[canonicalBranch];
        }
        return canonicalBranch;
    }
    return shortMode ? canonicalBranch.replace(/^สาขา/, '') : canonicalBranch;
}

const PROVINCE_EN_NAMES = Object.freeze({
    'Phangnga': 'Phang Nga'
});

function formatProvinceName(rawProv) {
    if (!rawProv || rawProv === '-') return '-';
    if (currentLang === 'th') {
        return Object.prototype.hasOwnProperty.call(PROVINCE_TH_NAMES, rawProv)
            ? PROVINCE_TH_NAMES[rawProv]
            : rawProv;
    }
    return Object.prototype.hasOwnProperty.call(PROVINCE_EN_NAMES, rawProv)
        ? PROVINCE_EN_NAMES[rawProv]
        : rawProv;
}

function formatOrderCount(n) {
    const count = Number(n) || 0;
    if (currentLang === 'en') {
        return count === 1 ? '1 order' : `${count} orders`;
    }
    return `${count} งาน`;
}

function getBranchDistrictInfo(canonicalBranch) {
    const langMap = BRANCH_DISTRICT_INFO_I18N[currentLang] || BRANCH_DISTRICT_INFO_I18N.th;
    if (Object.prototype.hasOwnProperty.call(langMap, canonicalBranch)) {
        return langMap[canonicalBranch];
    }
    return t('mapPopupServiceArea', { branch: formatBranchName(canonicalBranch) });
}

function loadSavedLanguage() {
    try {
        const saved = window.localStorage ? window.localStorage.getItem(I18N_STORAGE_KEY) : null;
        if (saved === 'th' || saved === 'en') return saved;
    } catch (_err) {
        // Ignore storage errors
    }
    return 'th';
}

function setLanguage(lang, skipReRender = false) {
    if (lang !== 'th' && lang !== 'en') return;
    currentLang = lang;
    try {
        if (window.localStorage) window.localStorage.setItem(I18N_STORAGE_KEY, lang);
    } catch (_err) {
        // Ignore storage errors
    }

    document.documentElement.lang = lang;
    document.title = t('pageTitle');

    // Update static text nodes
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) el.textContent = t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) el.setAttribute('placeholder', t(key));
    });

    // Update title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (key) el.setAttribute('title', t(key));
    });

    // Update language toggle button states
    document.querySelectorAll('[data-action="set-lang"]').forEach(btn => {
        const isActive = btn.getAttribute('data-lang') === lang;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    // Update desktop header title according to active tab
    const activeDesktopNav = document.querySelector('.sidebar-link.active');
    const activeTab = activeDesktopNav ? activeDesktopNav.getAttribute('data-tab') : 'tracking';
    const titleEl = document.getElementById('desktop-page-title');
    if (titleEl) {
        const titleKeyMap = {
            tracking: 'titleTracking',
            dashboard: 'titleDashboard',
            report: 'titleReport',
            help: 'titleHelp'
        };
        titleEl.textContent = t(titleKeyMap[activeTab] || 'titleTracking');
    }

    // Update status summary text
    if (typeof updateStatusSummaryText === 'function') updateStatusSummaryText();
    if (typeof updateUserDisplay === 'function') updateUserDisplay();

    if (!skipReRender) {
        if (typeof applyFilters === 'function') applyFilters();
        if (typeof populateBranchFilters === 'function') populateBranchFilters();
        if (typeof updateDailyReport === 'function') updateDailyReport();
        if (typeof updateMonthlyReport === 'function') updateMonthlyReport();
        if (typeof refreshMapLanguage === 'function') refreshMapLanguage();
        if (typeof populateCancelModalSummary === 'function' && typeof pendingCancelOrder !== 'undefined' && pendingCancelOrder) {
            populateCancelModalSummary(pendingCancelOrder);
        }
    }
}
