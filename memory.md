# memory.md — สิ่งที่ session ต้องรู้ต่อหลัง clear / compact context

เจ้าของโปรเจกต์ขอ (2026-10-30): **เมื่อ context เริ่มเยอะ ให้เขียน/อัปเดตไฟล์นี้** แล้ว commit + push เพื่อให้ทำงานต่อได้หลัง clear/compact
ไฟล์นี้คือสมุดจดของงานที่ค้างอยู่และข้อตกลงในแชต ส่วนสถานะของโปรเจกต์ทั้งหมดอยู่ใน `docs/LAUNCH-CHECKLIST.md` (อ่านก่อนเสมอ)
อัปเดตล่าสุด: 2026-10-30 (หลังทำงานเอาส่วนของสำเนาทดสอบออก)

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
- วัดแล้ว 2026-10-31: ระบบเดิมไม่มี error ที่หน้าจอไม่ได้จับในสถานการณ์ทดสอบ (88/90 จบ อีก 2 ล้มเพราะดิสก์เต็ม; page.on('pageerror') ชั่วคราว ไม่ commit)
- ดิสก์ของ session เต็มได้: Docker vfs กินที่มาก ลบ image/`docker builder prune -af` และผล test เก่าใน scratchpad เมื่อเต็ม
- Docker Hub ตอบ 429 (ดึง node base image ไม่ได้) ใน session นี้: ทดสอบ image ด้วย overlay บน `drivego:smoke` เดิม
  (`FROM drivego:smoke` + COPY server/lib, tools) ถ้าไม่ได้แก้ส่วนที่ build ของ web
- ค้าง (ไม่เร่ง): S16 ระบบใหม่พังเป็นครั้งคราว แถบเลขหน้า "‹ 1 ›" ของรายการ 4.2 หายตอนถ่ายภาพ (NOTES.md "เกิดอีก 2026-10-30") ถ้าเกิดอีกให้หาสาเหตุ ไม่ใช่รันซ้ำ

## สิ่งที่รอเจ้าของโปรเจกต์

- DigitalOcean ส่วนที่ 1–3 (`docs/DIGITALOCEAN-SETUP.md`) แล้วส่ง URL ของแอป → Claude ตรวจบน server จริง
  (RLS แยกร้าน, `/api/live` ผ่าน load balancer, บันทึกใหญ่ 30 MB, ซ้อมกู้คืน)
- ส่งไฟล์ "ชุดตรวจผู้ทำบัญชี รอบ 3.xlsx" ให้ A และ B (สร้างใหม่ 2026-10-30 จาก scratchpad `round3/ledger_round3.py`
  ไม่ commit; สคริปต์เดียวกันเขียน `docs/LEDGER-POSTING.md`) → ได้คำตอบแล้วทำรายงานบัญชีแยกประเภท (8.2)
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
