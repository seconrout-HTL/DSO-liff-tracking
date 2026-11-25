# Security Hardening Guide — DSO Fleet Order Tracking

เอกสารนี้สรุปมาตรการด้านความปลอดภัยที่ปรับปรุงในกิ่ง `security-hardening` พร้อมคู่มือการเปิดใช้งานระบบยืนยันตัวตนฝั่ง Google Apps Script และการดูแลรักษาไฟล์ Asset

---

## 1. สรุปมาตรการความปลอดภัยที่ดำเนินการแล้ว

### 1.1 ป้องกัน Stored / DOM XSS & Prototype Pollution
- เพิ่มโมดูล [`security.js`](security.js) ซึ่งโหลดก่อนสคริปต์อื่นทั้งหมด พร้อมฟังก์ชันหลัก:
  - `escapeHtml(value)` — เข้ารหัสอักขระพิเศษ (`&`, `<`, `>`, `"`, `'`, `` ` ``) ทุกจุดก่อนแสดงผลผ่าน `innerHTML` ใน `ui.js`, `dashboard.js`, `data.js` และ Popup/Tooltip ของแผนที่ Leaflet
  - `sanitizeText(value, fallback, maxLength)` — ลบอักขระควบคุม (Control Characters) และจำกัดความยาวข้อความจาก API
  - `createSafeMap()` / `isSafeDictKey(key)` — ใช้ `Object.create(null)` และบล็อกคีย์อันตราย (`__proto__`, `constructor`, `prototype` ฯลฯ) ทุกโครงสร้าง Dictionary (`branchNames`, `queueMap`, `freqMap`, `activeBranches`, `summary`, `branchCounts`)
  - `validateGasApiUrl(url)` — ตรวจสอบว่า Endpoint เป็น `https://script.google.com/macros/s/.../exec` หรือ `https://script.googleusercontent.com/macros/...` เท่านั้น
  - `getLiffIdTokenSafe()` — ดึง LINE `idToken` อย่างปลอดภัยเมื่อผู้ใช้เข้าสู่ระบบ LIFF แล้ว
  - `secureApiRequest(action, params, options)` — ส่งคำขอพร้อม Timeout 15 วินาที (`AbortController`), `referrerPolicy: 'no-referrer'`, `credentials: 'omit'`, `cache: 'no-store'` และรองรับโหมด `POST` พร้อม `idToken`

### 1.2 Strict Content Security Policy (CSP) & ลบ Inline Event Handlers 100%
- ลบ Inline Event Handlers (`onclick`, `onchange`, `onkeyup`) ออกจาก `index.html` และ `dashboard.js` ทั้งหมด 100% และย้ายมาจัดการผ่าน Event Delegation (`data-action`, `data-sync-filter`, `data-status-filter`, `data-change-action`) ใน `app.js`
- ตั้งค่า Strict CSP ใน `<meta http-equiv="Content-Security-Policy">` โดย **ไม่อนุญาต `'unsafe-inline'` และ `'unsafe-eval'` ใน `script-src`**
- เพิ่ม `<meta name="referrer" content="strict-origin">` เพื่อลดการรั่วไหลของ Path/Query
- ล้างพารามิเตอร์ OAuth (`code`, `state`, `liffClientId`, `liffRedirectUri`, `error`, `error_description`) ออกจาก URL Bar ทันทีหลัง `liff.init()` ผ่าน `window.history.replaceState`

### 1.3 Supply Chain Security, SheetJS Upgrade & Subresource Integrity (SRI)
- อัปเกรด **SheetJS (`xlsx`)** จาก `0.18.5` เป็น **`0.20.3`** เพื่อปิดช่องโหว่ Prototype Pollution (**CVE-2023-30533**) และ ReDoS (**CVE-2024-22363**)
- ล็อกเวอร์ชันทุก CDN พร้อม `integrity="sha384-..."` และ `crossorigin="anonymous"`:
  - `chart.js@4.4.8`
  - `xlsx@0.20.3` (`cdn.sheetjs.com`)
  - `leaflet@1.9.4` (CSS + JS)
  - `font-awesome@6.4.0`
- คอมไพล์ Tailwind CSS ล่วงหน้าเก็บไว้ใน `assets/tailwind.min.css` แทน `cdn.tailwindcss.com` (ลดการรัน JIT compiler ในเบราว์เซอร์และผ่าน Strict CSP)
- คำนวณแบ่งขอบเขตพื้นที่สาขาภาคใต้ทั้ง 21 พื้นที่ล่วงหน้าเก็บไว้ใน `assets/thailand-south.geojson` แทนการดึง `raw.githubusercontent.com/.../thailand.json` และตัด `turf.min.js` ออกจาก Runtime

### 1.4 ป้องกัน Excel / CSV Formula Injection (CWE-1236)
- ใช้ `sanitizeExcelCell()` ใน `confirmExport()` และ `addChartToWorkbook()` เพื่อเติมเครื่องหมาย `'` นำหน้าข้อความที่ขึ้นต้นด้วย `=`, `+`, `-`, `@`, `\t`, `\r`, `\n` ป้องกันการรันสูตรหรือ DDE Injection เมื่อเปิดไฟล์ใน Microsoft Excel / LibreOffice / Google Sheets
- ทำความสะอาดชื่อไฟล์ดาวน์โหลดด้วย `sanitizeFilenameSegment()`

### 1.5 Data Minimization & Authentication Readiness
- ยกเลิกการดึงและเก็บ `userMapping` (รายชื่อ `UserID` พนักงานทั้งหมด) เมื่อเป็น Guest User เพื่อไม่ให้ข้อมูล PII ของพนักงานรั่วไหลฝั่ง Client
- เพิ่ม `SECURITY_CONFIG` ใน `config.js`:
  - ค่าเริ่มต้น: `REQUIRE_LIFF_LOGIN: false` และ `USE_POST_AUTH: false` เพื่อคงความเข้ากันได้กับหน้าเว็บ Desktop และ GAS เดิมทันทีหลัง Merge
  - เตรียม Modal `#auth-gate-modal` สำหรับบังคับเข้าสู่ระบบผ่าน LINE เมื่อพร้อมเปิดใช้งานจริง

---

## 2. คู่มือเปิดใช้งานการยืนยันตัวตนเต็มรูปแบบ (Google Apps Script)

1. เปิดโปรเจกต์ Google Apps Script ของระบบแล้วนำโค้ดจาก [`backend/Code.gs`](backend/Code.gs) ไปวาง
2. ตรวจสอบชื่อชีตใน `SHEET_CONFIG` (`Tracking`, `Branches`, `Users`) ให้ตรงกับ Google Sheets ของคุณ
3. ไปที่ **Project Settings → Script Properties** แล้วเพิ่มค่า:
   - `LINE_CHANNEL_ID`: Channel ID ของ LINE Login Channel ที่ผูกกับ LIFF App
   - `REQUIRE_AUTH`: ตั้งเป็น `true` (หรือตั้งเป็น `false` ชั่วคราวระหว่างทดสอบ)
   - `RATE_LIMIT_MAX`: จำนวนคำขอสูงสุดต่อช่วงเวลา (ค่าเริ่มต้น `60`)
   - `RATE_LIMIT_WINDOW_SEC`: ช่วงเวลา Rate Limit เป็นวินาที (ค่าเริ่มต้น `60`)
4. ไปที่ **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (ระบบจะตรวจ `idToken` กับ LINE API และตรวจสิทธิ์กับชีต `Users` ทุกคำขอ)
5. เมื่อ Deploy `backend/Code.gs` เสร็จแล้ว ให้แก้ไขใน [`config.js`](config.js):
   ```js
   const SECURITY_CONFIG = Object.freeze({
       REQUIRE_LIFF_LOGIN: true,
       USE_POST_AUTH: true,
       API_TIMEOUT_MS: 15000,
       MAX_BRANCH_LEN: 100,
       MAX_NOTE_LEN: 500
   });
   ```

> **หมายเหตุเรื่อง HTTP Headers:** หากอนาคตย้ายไปโฮสต์บนเซิร์ฟเวอร์ที่กำหนด HTTP Response Header ได้ (เช่น Cloudflare Pages / Nginx) แนะนำให้เพิ่ม `frame-ancestors 'self' https://liff.line.me;` และ `X-Content-Type-Options: nosniff` ใน HTTP Header เพิ่มเติม (directive `frame-ancestors` ไม่สามารถบังคับใช้ผ่าน `<meta>` tag ได้)

---

## 3. การสร้างไฟล์ Asset ใหม่เมื่อมีการแก้ UI หรือขอบเขตแผนที่

### 3.1 คอมไพล์ `assets/tailwind.min.css` ใหม่
เมื่อมีการเพิ่มคลาส Tailwind ใหม่ในไฟล์ `.html` หรือ `.js`:
```bash
npx tailwindcss@3.4.17 \
  -c tailwind.config.js \
  -i input.css \
  -o assets/tailwind.min.css \
  --minify
```
โดยกำหนด `content: ["./index.html", "./*.js"]` และสีเดิมของระบบ (`ht-red`, `ht-green`, `ht-orange`, `ht-blue`, `ht-gray`, `excel-green`)

### 3.2 อัปเดต `assets/thailand-south.geojson`
ไฟล์ `assets/thailand-south.geojson` เก็บ FeatureCollection ของพื้นที่ 21 สาขาภาคใต้ (และ `เขตกลางคืน` แสดงเป็นวงกลมใน `dashboard.js`) หากมีการปรับพิกัดแบ่งเขต ให้รันสคริปต์แบ่งพื้นที่ด้วย `@turf/turf@6.5.0` แบบ Offline แล้วนำไฟล์ GeoJSON ผลลัพธ์มาแทนที่ `assets/thailand-south.geojson` โดยไม่ต้องโหลด Turf.js บนเบราว์เซอร์

---

## 4. GitHub Actions Pages Workflow

ไฟล์ `.github/workflows/static.yml` ถูกปรับปรุงให้:
- ล็อก Action ทุกตัวด้วย Commit SHA เต็ม (ป้องกัน Tag Hijacking)
- จำกัดสิทธิ์แบบ Least Privilege (`permissions: {}` ระดับ Workflow และเปิดเฉพาะ `contents: read`, `pages: write`, `id-token: write` ใน Job Deploy)
- คัดลอกเฉพาะไฟล์หน้าเว็บที่จำเป็น (`index.html`, `styles.css`, `security.js`, `config.js`, `data.js`, `ui.js`, `dashboard.js`, `app.js`, `assets/`) ลง `_site/` ก่อน Deploy เพื่อไม่ให้เผยแพร่ `backend/Code.gs`, `SECURITY.md`, หรือไฟล์ระบบขึ้น GitHub Pages
- ลบ Workflow ที่ไม่ได้ใช้งาน (`jekyll-gh-pages.yml` และ `npm-publish-github-packages.yml`)
