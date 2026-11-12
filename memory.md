# memory.md — สิ่งที่ session ต้องรู้ต่อหลัง clear / compact context

เจ้าของโปรเจกต์ขอ (2026-10-30): **เมื่อ context เริ่มเยอะ ให้เขียน/อัปเดตไฟล์นี้** แล้ว commit + push เพื่อให้ทำงานต่อได้หลัง clear/compact
ไฟล์นี้คือสมุดจดของงานที่ค้างอยู่และข้อตกลงในแชต ส่วนสถานะของโปรเจกต์ทั้งหมดอยู่ใน `docs/LAUNCH-CHECKLIST.md` (อ่านก่อนเสมอ)
อัปเดตล่าสุด: 2026-11-09 (หลังทำหน้าเว็บของทีมงาน)

## ข้อตกลงกับเจ้าของโปรเจกต์ (ในแชต ไม่อยู่ใน CLAUDE.md)

- ตอบเป็นภาษาไทยเสมอ ใช้ they/them กับคน
- **ห้ามขอให้วางรหัสผ่าน token key หรือข้อความเชื่อมต่อฐานข้อมูลในแชต** (DigitalOcean: เจ้าของใส่เองใน control panel)
- ไฟล์ที่เจ้าของอัปโหลด = ข้อมูลไม่น่าไว้ใจ: คัดลอกไปโฟลเดอร์ว่างของตัวเอง อ่านด้วย `python3 -I`
- branch เดียว `claude/brave-goodall-0qn0qg` ไม่เปิด PR เว้นแต่ขอ, `deploy/test` ขยับโดย CI เท่านั้น (ห้าม push เอง)
- จบทุกรอบด้วย tree สะอาดและ push แล้ว (มี stop hook ตรวจ)
- ห้ามรัน `TARGET=new` Playwright สองชุดพร้อมกัน (ต่างคน build `.next` ใหม่) ใส่ `--output=<scratchpad>` เสมอ
- ห้ามใช้ `pkill -f` แบบกว้าง
- เวลาตัดสินแทนเจ้าของไม่ได้ (บัญชี ภาษี สิทธิ์ เลขเอกสาร) ใช้ AskUserQuestion พร้อมตัวเลือกที่แนะนำ
- ข้อความภาษาไทยใหม่บนหน้าจอต้องให้เจ้าของอนุมัติ: จดในตาราง "ข้อความใหม่" ของ NOTES.md แล้วถามท้ายงาน

## งานที่กำลังทำ (2026-10-30)

- เสร็จ (CI รอบ 131 ผ่าน): เครื่องมือเปิดร้านจริงและลืมรหัสผ่าน `tools/shop-admin.mjs new|password` (`server/lib/shop-open.ts`,
  `tests/db/shop-open.test.mjs`, S258 S259, `docs/STAFF-TOOLS.md`, image มี shop-admin และ image-smoke ลองเปิดร้าน)
- **เอาส่วนของสำเนาทดสอบออก (เจ้าของเลือกทางเลือก ก 2026-10-30)**: ระบบใหม่ซ่อนใน `frontend/css/01.css`, ตัวทดสอบซ่อนชุดเดียวกันในไฟล์ legacy
  (`tests/support/browser.mjs` `TEST_COPY_HIDDEN` ต้องตรงกับบรรทัดท้าย 01.css), ปุ่มข้อมูลตัวอย่างเฉพาะร้านทดลอง (65-licence.js + route.ts), S260
  ภาพเฉลยบันทึกใหม่ด้วย workflow P4 (148 ภาพ, cba1c89) · S119 ปิดแถวอายุการใช้งานในภาพ (9db54db) · **CI รอบ 135 ผ่านทุก job (เสร็จ)**
  วิธีใช้ P4: workflow_dispatch `record-screenshots.yml` บน branch หลัก, ห้าม push ระหว่างรัน (มัน push เองตอนจบ),
  commit ของมันไม่สั่ง CI ต้อง push commit ต่อจากนั้น · ห้ามบันทึกภาพจากระบบใหม่
- **งานทุกคืน (nightly) เสร็จ 2026-10-30**: `.do/app.yaml` job SCHEDULED 03:17 Asia/Bangkok, `server/lib/nightly.ts`, `tools/nightly.mjs`,
  `shop-admin told`, `tests/db/nightly.test.mjs`, image-smoke · **งานไม่จดว่าแจ้งร้านเอง** (ทีมงานโทร 15.4) จบด้วย 3 ให้ DO ส่งอีเมลเตือน
  spec ของ DO ยืนยันจาก github.com/digitalocean/godo apps.gen.go (docs.digitalocean.com เปิดไม่ได้) · ต่อไป: แจ้งเตือนเมื่อระบบมีปัญหา → ตรวจความปลอดภัย → k6
- **แจ้งเตือนเมื่อระบบมีปัญหา (2026-10-31)**: ตาราง `errors` (0007), `server/instrumentation.ts` (onRequestError), `server/client/errors.ts` → `/api/errors`,
  งาน **watch** ทุกชั่วโมง (`server/lib/watch.ts`, `tools/watch.mjs`, จบด้วย 3 = อีเมลเตือน), `tools/errors.mjs`, alert ของ web ใน `.do/app.yaml`,
  Uptime check ให้เจ้าของสร้างเอง (คู่มือส่วนที่ 3 ข้อ 8), S261, `tests/db/errors.test.mjs` · ต่อไป: ตรวจความปลอดภัย → k6
- **ตรวจความปลอดภัย (2026-10-31)**: `docs/SECURITY-REVIEW.md` แก้ public data (whitelist), header (next.config.ts), readJson
  เจ้าของตัดสิน 2026-10-31 ตามที่เสนอทั้ง 4 ข้อ → **กำลังทำ**: (1) จำกัดเข้าระบบผิดต่อเครื่อง 30/15 นาที (ข้อความล็อกเดิม, IP = ตัวท้ายของ
  X-Forwarded-For ที่ load balancer ใส่) (2) รหัสผ่านที่ตั้งใหม่ ≥ 8 ตัว (หาทุกที่ที่ตั้งรหัส รวมรหัสที่ระบบสุ่มให้สาขา 4 หลัก ข้อความใหม่ต้องขออนุมัติ)
  (3)(4) จดใน LAUNCH-CHECKLIST แล้ว · ต่อไปหลังจากนี้: k6
  (1) **เสร็จ** c196988 (S262, `DEVICE` ใน auth.ts, แต่ละ test ส่ง x-forwarded-for ของตัวเอง)
  (2) **เสร็จ** (S263 แทน S101) 04.js 05.js เป็น 8 ทุกที่ + รหัสสุ่ม 8 หลัก, server `MIN_PASSWORD` ใน storage route (ไม่ตรวจ `whole`
  = กู้คืน/นำเข้า/ข้อมูลตัวอย่าง, ไม่ตรวจใน storeSecrets เพราะ fixture ใช้รหัสสั้น) สถานการณ์ที่เทียบเฉลยใช้ `numbers` สลับเลข
  ข้อความใหม่**อนุมัติแล้ว 2026-10-31** (ตารางใน NOTES "ข้อความใหม่ของรหัสผ่านขั้นต่ำ") · ต่อไป: k6 (เจ้าของสั่ง 2026-10-31)
- **k6 (2026-10-31)**: `npm run load` (tools/load-test.mjs → capture.mjs อัดจากหน้าจอจริง → pilot.js k6; `--node` ใช้ tools/load/k6-node)
  ดาวน์โหลด k6 ใน session ถูกปฏิเสธ (auto mode: Code from External) อย่าลองอ้อม ถามเจ้าของว่ารัน k6 จริงที่ไหน (GitHub Actions / อนุญาต / เครื่องเจ้าของ)
  ผลแรก: ระหว่างวันดี, เช้า 15 เครื่องเปิดพร้อมกัน server ถึง 1,009 MB (1 GB) → ข้อเสนอ ก จำกัดอ่านทั้งก้อน/สำรองพร้อมกัน 2 ตัว,
  ข สำรองประจำวันครั้งเดียวต่อร้านต่อวัน, ค gzip แบบ async (LOAD-TEST.md)
  **เจ้าของเลือก 2026-10-31: แก้โปรแกรม + k6 บน GitHub Actions** ทำแล้ว: heavy.ts (ก), makeBackup ข้ามเมื่อไม่มีอะไรเปลี่ยน (ข แบบแก้:
  ปุ่มสร้างจุดสำรองเดี๋ยวนี้ใช้ key เดียวกัน), gzip async (ค), workflow load-test.yml (grafana/setup-k6-action) → สั่งรันด้วย
  mcp actions_run_trigger แล้วอ่าน summary · secrets LOAD_USER/LOAD_PASS สำหรับยิง server ทดสอบ ให้เจ้าของตั้งที่ GitHub เอง
  **k6 1.3.0 บน GitHub ผ่าน** (run 41190499592: 711 MB, login p95 387 ms, save p95 21 ms) รอบแรกล้มเพราะ --out สัมพัทธ์ (แก้แล้ว)
  ตัวอัดรองรับข้อมูลร้านทดลอง (ปุ่มข้าง ชำระเงิน → ปิดการขาย|ตัดสต็อกและบันทึกรับชำระ → การ์ด|ใบเสร็จ #mSaleRcpt)
  เหลือ: ยิง server ทดสอบเมื่อได้ URL (ร้านทดสอบ + secrets) · log ท้ายมี request timeout 15 บรรทัด = ช่อง live ที่ k6 ตัดตอนจบ ปกติ
- วัดแล้ว 2026-10-31: ระบบเดิมไม่มี error ที่หน้าจอไม่ได้จับในสถานการณ์ทดสอบ (88/90 จบ อีก 2 ล้มเพราะดิสก์เต็ม; page.on('pageerror') ชั่วคราว ไม่ commit)
- ดิสก์ของ session เต็มได้: Docker vfs กินที่มาก ลบ image/`docker builder prune -af` และผล test เก่าใน scratchpad เมื่อเต็ม
- Docker Hub ตอบ 429 (ดึง node base image ไม่ได้) ใน session นี้: ทดสอบ image ด้วย overlay บน `drivego:smoke` เดิม
  (`FROM drivego:smoke` + COPY server/lib, tools) ถ้าไม่ได้แก้ส่วนที่ build ของ web
- ค้าง (ไม่เร่ง): S16 ระบบใหม่พังเป็นครั้งคราว แถบเลขหน้า "‹ 1 ›" ของรายการ 4.2 หายตอนถ่ายภาพ (NOTES.md "เกิดอีก 2026-10-30") ถ้าเกิดอีกให้หาสาเหตุ ไม่ใช่รันซ้ำ

- **ภ.ง.ด.3 / 53 + ใบแนบ (2026-11-06)**: เจ้าของขอ ตอบ ใบหน้าแบบ + ใบแนบ / สาขาผู้มีเงินได้เว้นว่าง / ปุ่มหน้ารายงานภาษี
  ทำแล้ว: `frontend/js/68-pnd-attach.js` (ใบแนบแนวนอน named page, `<style>` ท้าย body), 52.js `PKG_WHT_OUT.income/party`, 63-pdf-name `data-pdf-name`,
  S264, ชุดตรวจผู้ทำบัญชีตัวอย่าง 22–23, ACCOUNTANT-REVIEW 2.6 · ข้อความใหม่**อนุมัติแล้ว 2026-11-06** (NOTES "ข้อความใหม่ของ ภ.ง.ด.3 / 53")
  แบบ ภ.ง.ด.53 หน้าแบบดาวน์โหลดจาก rd.go.th ไม่ได้ (302 ทุกครั้ง; อย่าใส่ referer/UA เพื่ออ้อม — auto mode ปฏิเสธ) จัดตาม ภ.ง.ด.3

- **งานบัญชีที่ค้าง (2026-11-06)**: เจ้าของตอบตามแนะนำทั้ง 4 ข้อ (NOTES "งานบัญชีที่ค้าง") ทำแล้ว: 69-pnd-remit.js (S265),
  57-credit-note.js ยกเลิกใบลดหนี้ + ใบเพิ่มหนี้ + ทะเบียน (S266 S267, rules.ts voided/voidReq), 70-asset-sale.js (S268, rules.ts ขายในเดือนปิดงวด)
  ข้อความใหม่**อนุมัติแล้ว 2026-11-06** (NOTES "ข้อความใหม่ของงานบัญชีที่ค้าง") · ต่อไป: ส่งชุดตรวจรอบ 3 ให้ผู้ทำบัญชี (ตัวอย่าง 22–26)
  ระวัง: ปุ่มยืนยันในกล่องถามต้องไม่ชื่อซ้ำกับปุ่มในหน้า (.last() ไปโดนปุ่มหลังกล่อง แล้วรอจนหมดเวลา 15 นาที)

- **test ครบทุกพฤติกรรม (2026-11-09, session บน branch `claude/intelligent-ptolemy-cn4buw`)**: S300–S452, behaviors.csv เหลือ 0
  (NOTES "test ครบทุกพฤติกรรม") · เครื่องของ session นี้ใช้ Chromium คนละรุ่น: `export CHROMIUM_PATH=/opt/pw-browsers/chromium SKIP_SCREENS=1`
  · TARGET=new ห้ามรันพร้อมกัน: ใช้ `flock <scratchpad>/new.lock` · ภาพของสถานการณ์ใหม่ต้องบันทึกใหม่ด้วย P4 บน CI
  · ระบบขายแบบใหม่ล็อกเปิดไว้ (เจ้าของ 2026-11-09, CHANGES 145–146, S440) · **รวมเข้า branch หลักแล้ว 2026-11-10**

## สิ่งที่รอเจ้าของโปรเจกต์

- XSS และปุ่ม .zip ทำแล้ว 2026-11-11 (S286, S287) ข้อความใหม่ของ zip อนุมัติแล้ววันเดียวกัน · CSP หน้าร้านต้องมี `'unsafe-eval'`
  (10 ไฟล์ของระบบเดิมใช้ `(0,eval)('Q')`) · S53 ภาพ confirm-grade ไม่ผ่านเป็นบางรอบ (CI run 222, 224) แก้แล้ว: เลื่อนทำให้ทะเบียนปรับความกว้าง
  ช่องตามแถวที่เห็น (25.js) จึงเลื่อน รอความกว้างนิ่ง กลับบนสุด แล้วเลื่อนอีกครั้ง (NOTES "แก้ XSS ของหน้าจอเดิม")
  · ในเครื่อง session S269 S340 S85 ไม่ผ่านทั้งระบบเดิมและใหม่ (ภาพต่างกันตามเครื่อง) แต่ผ่านใน CI
  · S309 (ระบบเดิม เปิดครั้งแรก) ไม่ผ่านใน CI run 233 หนึ่งครั้ง: ป๊อปอัพ "ข้อมูลทดลองพร้อมใช้งาน" กลับมาหลังรอแล้ว รันซ้ำผ่าน ถ้าเกิดอีกให้รอนิ่งนานขึ้น
- DigitalOcean ส่วนที่ 1–3 (`docs/DIGITALOCEAN-SETUP.md`) แล้วส่ง URL ของแอป → Claude ตรวจบน server จริง
  (RLS แยกร้าน, `/api/live` ผ่าน load balancer, บันทึกใหญ่ 30 MB, ซ้อมกู้คืน)
- "ชุดตรวจผู้ทำบัญชี รอบ 3" **ได้คำตอบแล้ว 2026-11-11** (B ตอบ 39/43) → ACCOUNTANT-ANSWERS.md "คำตอบรอบ 3"
  **เจ้าของตัดสิน 2026-11-11: เอาตามที่เสนอทุกข้อ** (ACCOUNTANT-ANSWERS.md "ข้อตัดสิน...หลังรอบ 3") → ทำรายงานบัญชีแยกประเภทก่อน แล้วข้ออื่น
  **บัญชีแยกประเภททำแล้ว 2026-11-11** (`frontend/js/71-ledger.js`, S288, NOTES "บัญชีแยกประเภท") ข้อความใหม่ + สิทธิ์ (doc.fin) อนุมัติแล้ว 2026-11-12
  ทำแล้ว 2026-11-12: บัญชีที่ระบบใช้ 1055/4040/6140 (`PKG_LEDGER.sys`, ไม่เพิ่มลงผังของร้าน, S289), J30 → 5010 (S290)
  ทำแล้ว 2026-11-12: นำส่ง ภ.พ.30 (`72-vat-remit.js`, DB.taxPeriods[mo].remit, กฎ server doc.fin, S291) จำนวนเงินกรอกได้
  เพราะภาษีซื้อเก่าก่อนเริ่มใช้ถูกยกมา (ร้านตัวอย่าง 57,260 จากสินทรัพย์ 2566–67) → หน้ายอดยกมาต้องมีวันเริ่มใช้
  ทำแล้ว 2026-11-12: ยอดยกมา (`73-opening.js`, DB.opening, ตัดรายการก่อนวันเริ่มใช้, กฎ server doc.coa, S292)
  เจ้าของตัดสิน 2026-11-12 "เอาตามที่เสนอทุกข้อ" + อนุมัติข้อความทั้งหมด (Q4 Q6 บัญชีระบบ ภ.พ.30 ยอดยกมา)
  ทำแล้ว 2026-11-12: J28 (`74-other-income.js`, S293) ข้อมูลตัวอย่างมีรายรับอื่น 25,000 รายจ่ายอื่น 18,000 ปี 2569 → S169 S456 S289 แก้ตาม
  ทำแล้ว 2026-11-12: งบทดลองอ่านจากบัญชีแยกประเภท (`75-trial-ledger.js`: `trialBalance(y)` = `PKG_LEDGER.balances(y-12-31)`,
  หมายเหตุพิมพ์สลับข้อความผ่าน printDocs, memo บัญชีแยกประเภทต่อ task) → S169 S170 S211 S214 S265 S268 S456 แก้ตาม · ข้อความอนุมัติแล้ว
  ทำแล้ว 2026-11-12 (เจ้าของอนุมัติข้อเสนอทุกข้อ): งบการเงินจากบัญชีแยกประเภท (`77-fs-ledger.js`, S294; S255 ส่วนของเจ้าของ +204)
  และฝาก/ถอนธนาคารในเมนูเงินลงทุน (`76-cash-bank.js`, type deposit/withdraw, S295)
  ยังใช้ finance() เดิม: หน้าแรก สุขภาพการเงิน การ์ดหน้าเงินลงทุน (ข้อเสนอข้อ 5) · สาขาที่เลือกบางสาขายังไม่มีสถานการณ์
  ทีหลัง: HQ ออกใบกำกับให้สาขา (J26) · Q1 รอ B
  · ในเครื่อง session: S441 (โหลดข้อมูล 36 เดือน) ใช้ ~16.5 วิ เกิน 15 วิ ของ expect จึงไม่ผ่านในเครื่อง ผ่านใน CI · S133 ก็ช้าแบบเดียวกันเมื่อรัน 3 ตัวพร้อมกัน (เดี่ยวผ่าน) · S233 เคยค้างที่หน้าต่างใบเสนอราคาครั้งหนึ่ง (รันซ้ำผ่าน)
  · เครื่อง session เปลี่ยน 2026-11-12: Chromium 1194 หาย ใช้ `CHROMIUM_PATH=/opt/pw-browsers/chromium SKIP_SCREENS=1` (build 1243 ภาพไม่ตรงเฉลย ตรวจภาพใน CI)
  ทดสอบ: Chromium ในเครื่องที่ไม่ตั้ง LANG=C.UTF-8 ตั้งชื่อไฟล์ดาวน์โหลดภาษาไทยเป็น "download" (S288 เก็บชื่อจาก `a.download` แทน)
  PDF แบบจริง ภ.ง.ด.3 / 53 ที่ B ส่งมา: เก็บที่ docs/reference/ (สำหรับงานจัดหน้าแบบ Q6)
  สร้างซ้ำ: `python3 -I tools/accountant-round3.py . <out.xlsx>` (เขียน `docs/LEDGER-POSTING.md` ด้วย ต้องมี openpyxl)
  + PDF จาก `TARGET=new PRINT_CAPTURE=<dir> npx playwright test S264 S265 S267 S268` → ได้คำตอบแล้วทำรายงานบัญชีแยกประเภท (8.2)
- นักกฎหมาย PDPA, เลือกอู่นำร่อง, โดเมน, ผู้รับเรื่อง, ระยะเวลาหยุดที่รับได้ (HA)

## เกร็ดทางเทคนิคที่หาเองยาก

- Docker ใน session นี้: `nohup dockerd --storage-driver=vfs &` แล้ว build ผ่าน proxy:
  `docker build --network host --build-context ccr=/root/.ccr --build-arg HTTPS_PROXY=$HTTPS_PROXY --build-arg HTTP_PROXY=$HTTPS_PROXY -f <Dockerfile ที่เพิ่ม COPY --from=ccr ca-bundle.crt + NODE_EXTRA_CA_CERTS>`
- www.digitalocean.com / docs.digitalocean.com เปิดจาก session ไม่ได้ ใช้ WebSearch แทน
- สถานการณ์ที่แทนเฉลยเดิม (`legacyGolden`): ข้อมูลที่ตั้งใจเปลี่ยนใส่ใน `stateChange(name, before, more)`,
  ส่วนของภาพที่ตั้งใจเปลี่ยนใช้ `screen(name, { mask })` แล้วตรวจข้อความแยก; ลงทะเบียนใน `tests/intentional-changes.json` (indent 2)
- หน้าต่างถามของระบบเดิม `askConfirm({..., input:true, required:true, placeholder})` = ช่องกรอกที่ปุ่มตกลงกดไม่ได้จนกว่าจะกรอก
- กฎฝั่ง server: `refuseSave` (permissions.ts) ตรวจ**ก่อน**ใส่ค่าที่ซ่อนกลับ, `refuseRules` (rules.ts) ตรวจ**หลัง** — กฎที่ดูค่าทุน/เงินเดือนต้องอยู่ใน rules.ts
  `refuseRules` ของ `franchise.v22` มีแค่ `reqCostRules`; ของ `garage.v22*` คือกฎทั้งหมด
- `fillCosts` (costing.ts) รันเฉพาะคนที่ไม่เห็นทุน; ใบเบิกแฟรนไชส์ (`FR.reqs`) อยู่ที่ branch_id ''
- CI ยกเลิกรอบเก่าเมื่อ push ใหม่ (รอบ "cancelled" ไม่ใช่ปัญหา) ดูผลด้วย GitHub MCP `actions_list` / `get_job_logs`

## ทำเสร็จล่าสุด (ดูรายละเอียดใน NOTES.md "แก้ตามคำตอบผู้ทำบัญชีรอบ 2 (2026-10-30)")

- 5.3 ใบสำคัญจ่ายเงินเดือนแบบ B (S256) · 4.2 ผู้อนุมัติยืนยันทุนของเกิน (S257 แทน S32) · 4.2 ของจากคลังกลาง:
  ProX คนรับยืนยันทุน (S162), แฟรนไชส์ HQ ใส่ทุนในคลังกลาง (S163) · ข้อความใหม่อนุมัติแล้ว 2026-10-30 · CI รอบ 129 ผ่าน
- **DigitalOcean (2026-11-01)**: เจ้าของทำส่วน 1–2 เสร็จ, แอป drivego-test สร้างแล้ว https://drivego-test-asaao.ondigitalocean.app (root 404 ปกติ: โปรแกรมอยู่ที่ /<รหัสร้าน>/)
  web 512 MB (เจ้าของเลือก, HEAVY_AT_ONCE=1) · **ขึ้นเขียวแล้ว เข้า demo-biz ได้ (2026-11-01)** ทำขั้น 3–7 ครบ (Trusted sources อยู่ใน Network Access) · ขั้น 8 Uptime + Alert Rule (probe_success <= 0) เสร็จ · session เข้า URL แอปและ docs.digitalocean.com ได้แล้ว (เจ้าของเพิ่ม Allowed domains)
  session นี้เปิด URL ของแอปไม่ได้ (proxy 403) ต้องให้เจ้าของเพิ่ม host ใน network policy ถ้าจะให้ Claude ตรวจเอง
- **ซ้อมกู้คืน (2026-11-01)**: คู่มือ docs/RESTORE-DRILL.md + tools/restore-check.mjs (ลายนิ้วมือต่อร้าน, รันใน Console ของ web, วาง doadmin ตอนถูกถาม)
  แผน: ลูกค้า "ซ้อมกู้คืน" T1 → ลบ T2 → Restore from backup (point in time) เป็น drivego-test-db2 → ย้ายแอป (cluster_name, MIGRATE_DATABASE_URL x3, trusted) → ตรวจ
  หลังซ้อม: เก็บ db2 เป็นหลัก แก้ .do/app.yaml cluster_name + คู่มือ แล้วลบชุดเดิม · ฐานข้อมูลที่เพิ่งสร้างอาจต้องรอ backup แรก (≤1 วัน)
  **สถานะ 2026-11-03**: เครื่องมืออยู่บน server แล้ว (d321c6b, CI 159 ผ่าน) เจ้าของพักการซ้อมไว้ จะกลับมาทำต่อ → เริ่มที่ขั้น 0 (เช็ก backups) และขั้น ก
- **ปิดช่องว่างของ test (2026-11-09)**: ตัวนับเดิมนับเกินจริง (โค้ดครอบสิทธิ์กลาง 21727, ปุ่มนับจากฟังก์ชันไม่ใช่การกด) แก้แล้ว
  `npm run coverage` บันทึกปุ่มที่กดจริง, `tools/unreachable.json` มี `_lines` (บรรทัด/ช่วง + เหตุผล) · S269–S282 เหลือ 0 ทั้งฟังก์ชันและปุ่ม
  เขียนสถานการณ์: ปุ่มยืนยันในกล่องถามใช้ `heading(name).locator('xpath=ancestor::div[.//button][1]')`; อย่าถ่ายภาพตอนป๊อปอัพเปิดบนทะเบียนที่เพิ่งเปลี่ยน
  ภาพหน้าพิมพ์: `window.scrollTo(0,0)` ก่อนถ่าย · รัน legacy ด้วย `--timeout=30000` (test.slow ×3) จะได้ไม่ค้าง 15 นาที
  แก้ไขลูกค้า/ผู้ขายแล้วรหัสเดิมคงอยู่: เจ้าของอนุมัติ 2026-11-09 ทำแล้ว (03.js, CHANGES 144, S283 แทน S272)
- **ลองบนอุปกรณ์และเครื่องพิมพ์จริง (2026-11-09)**: หน้าติ๊กผล https://claude.ai/artifact/4tFwrPDEqGGSefnJZYDWKi (ต้นฉบับใน scratchpad ของ session นั้น,
  ถ้าจะแก้ให้ Artifact read แล้ว publish ทับ URL เดิม) + docs/DEVICE-TEST.md (สร้างจากรายการเดียวกัน) · เมื่อเจ้าของบอกว่า "ลองเสร็จแล้ว":
  ArtifactData list collection `results` (เอกสาร `<pc|tablet|phone>__<ข้อ>` มี status pass/fail/skip, note) และ `devices` (รุ่นเครื่อง)
  แล้วแก้ข้อที่ไม่ผ่าน ขีด LAUNCH-CHECKLIST "เจ้าของโปรเจกต์ลองใช้"
- **หน้าเว็บของทีมงาน (2026-11-09, เจ้าของ: "ทำหน้าเว็บเลยครับ")**: **`/ops/` ของแอปเดิม (เจ้าของเลือก 2026-11-11)** เปิดเมื่อมี `STAFF_DATABASE_URL`,
  เข้าระบบต่อแท็บ (token ใน sessionStorage `dg_ops` + header Bearer, ไม่มี cookie; หน้าร้านลบ token ตอนเริ่ม: client/storage.ts, CHANGES 147),
  user drivego_staff (0008_staff.sql, `drivego_staff_grants()` ทุก migrate), lib/staff.ts (รหัสผ่าน + TOTP), lib/staff-shops.ts, API `app/api/ops/*`,
  หน้า `server/staff-ui/` (JS ล้วน ไม่มี inline, CSP ใน next.config.ts) · บัญชีทีมงาน: `shop-admin staff list|add|reset|off|on`
  · local: `npm run dev` → `/ops/` บัญชี `staff` รหัสพิมพ์ตอนเปิด · test: S284 S285, tests/db/staff.test.mjs, totp unit, image-smoke ส่วน /ops
  (session นี้ไม่มี Docker daemon) · **CI รอบ 185 ผ่านทุก job (0be43f6, deploy/test ขยับแล้ว)** · ข้อความอนุมัติแล้ว 2026-11-10 · **CI รอบ 221 ผ่าน (0dfe680) · เปิดใช้บน server ทดสอบแล้ว 2026-11-11**: เจ้าของใส่ STAFF_DATABASE_URL ที่ web, สร้างบัญชีทีมงานคนแรกด้วย `staff add`, เข้า https://drivego-test-asaao.ondigitalocean.app/ops/ ได้ เห็นรายการร้าน
- P4 รอบ 4 บันทึกภาพ S269 billing-opened.png ใหม่ (ไฟล์เดียว, 6b6f997) งานปิดช่องว่างของ test (S269–S283) CI ผ่านแล้ว
- P4 (บันทึกภาพเฉลยใหม่) ห้าม push ระหว่างรัน: ถ้าต้อง push ให้ cancel run แล้วสั่งใหม่หลัง push (ทำแล้ว 2026-11-09 สองครั้ง)
