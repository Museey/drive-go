# DriveGo

ระบบบริหารงานอู่ซ่อมรถ (DriveGoBiz / ProX / Franchise) กำลังย้ายจากไฟล์ HTML ไฟล์เดียวไปเป็นระบบ full stack

- แผนทั้งหมด: [docs/PLAN.md](docs/PLAN.md)
- ข้อค้นพบและข้อตัดสินใจ: [docs/NOTES.md](docs/NOTES.md)
- **เฟสปัจจุบัน: เฟส 3 (ย้าย logic สำคัญไปทำที่ server)** งานย่อยอยู่ใน PLAN.md, คำตอบของเจ้าของโปรเจกต์อยู่ใน [docs/PHASE3-QUESTIONS.md](docs/PHASE3-QUESTIONS.md)
  (เฟส 2 เสร็จแล้ว ยกเว้น T12 server ทดสอบที่รอเลือกผู้ให้บริการ แบบของเฟส 2 อยู่ใน [docs/PHASE2-DESIGN.md](docs/PHASE2-DESIGN.md))
- **สิ่งที่เหลือทั้งหมดก่อนให้ผู้ใช้จริงเข้าใช้: [docs/LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md)** อ่านก่อนเริ่มงาน
  ส่วน "สถานะล่าสุด" ต้นไฟล์บอกว่าตอนนี้รออะไรอยู่ (ณ 2026-10-30: เฟส 3 งาน 3.1–3.15 เสร็จ, 3.16 ใช้ DigitalOcean สิงคโปร์ App Platform + Managed PostgreSQL (ยืนยัน 2026-10-29) ไฟล์ deploy เสร็จ 2026-10-30 เจ้าของโปรเจกต์กำลังสมัครและสร้างแอปตาม docs/DIGITALOCEAN-SETUP.md,
  แก้ตามคำตอบผู้ทำบัญชีแล้ว (เอาตาม B, docs/ACCOUNTANT-ANSWERS.md "ทำแล้ว") ข้อความใหม่อนุมัติแล้ว 2026-10-29, งานจากคำตอบรอบ 2 (5.3, 4.2 ของเกินและคลังกลาง) ทำแล้ว 2026-10-30 ข้อความใหม่อนุมัติแล้ว 2026-10-30, บัญชีแยกประเภทรอ B ตรวจวิธีลงบัญชีในรอบ 3 ดู LAUNCH-CHECKLIST)
- **อ่าน [memory.md](memory.md) ด้วย**: งานที่ค้างอยู่และข้อตกลงกับเจ้าของโปรเจกต์ในแชต เมื่อ context เริ่มเยอะให้อัปเดตไฟล์นี้แล้ว commit + push
- **session ไม่รู้กันเอง** สิ่งที่ session อื่นเห็นมีแค่ไฟล์ใน branch หลัก `claude/brave-goodall-0qn0qg` (branch ตั้งต้นของ repo)
  ทำอะไรเสร็จหรือได้คำตอบจากเจ้าของโปรเจกต์ ให้ขีดรายการใน LAUNCH-CHECKLIST.md (พร้อมวันที่) แก้ "สถานะล่าสุด" และสถานะใน PLAN.md
  จดข้อตัดสินใน NOTES.md แล้ว commit และ push ในรอบเดียวกัน งานที่ทำบน branch อื่นต้องรวมเข้า branch หลักก่อน session อื่นจึงจะเห็น

## โครงสร้าง

| ที่อยู่ | คืออะไร |
|---|---|
| `legacy/DRIVEGO_TRIAL_v24.html` | ระบบเดิม = **เฉลย** ห้ามแก้ |
| `frontend/` | หน้าจอของระบบ: ระบบเดิมที่แยกเป็นไฟล์ (`index.html`, `js/`, `css/`, `assets/`) ในเฟส 1 ตั้งแต่เฟส 2 แก้ได้ แต่ทุกจุดต้องจดใน `frontend/CHANGES.md` และห้ามสร้างใหม่ทับด้วย `tools/split-legacy.mjs` |
| `server/` | ระบบใหม่ (เฟส 2): แอป Next.js + TypeScript ที่เสิร์ฟหน้าจอจาก `frontend/` ที่ `/<รหัสร้าน>/` และ API ที่ `/api/` (แบบที่อนุมัติ: `docs/PHASE2-DESIGN.md`) |
| `tests/scenarios/` | สถานการณ์ทดสอบ หนึ่งไฟล์ต่อหนึ่งสถานการณ์ ชื่อ `Sxx-<english-slug>.spec.ts` ชื่อ test เป็นภาษาไทย |
| `tests/golden/<spec file>/` | เฉลยที่บันทึกจากระบบเดิม (`flow.json`, `*-state.json`, `*.png`) |
| `tests/fixtures/` | ข้อมูลตั้งต้นที่ถูก restore ลงเบราว์เซอร์ก่อนทุก test |
| `tests/support/` | ตัวช่วยของ test: กรรมการ 3 ตัว, ตัวขับระบบเดิม, การตั้งค่าเบราว์เซอร์ |
| `Dockerfile`, `.do/app.yaml` | server ทดสอบบน DigitalOcean App Platform (งาน 3.16): image ของแอป และค่าตั้งของแอป (deploy จาก branch `deploy/test` ที่ CI ขยับหลังผ่านทุก job) คู่มือ: `docs/DIGITALOCEAN-SETUP.md` |
| `tools/` | สคริปต์: static server, สร้าง fixture, ดึงฟอนต์, ทำรายการพฤติกรรม, รายงาน coverage, PostgreSQL ชั่วคราว (`pg-temp.mjs`), เปิดระบบใหม่ (`serve-new.mjs`) |

## คำสั่ง

```bash
npm install
npm test                                   # รันทุกสถานการณ์ เทียบกับเฉลย (ระบบเดิม)
TARGET=new npm test                        # รันทุกสถานการณ์กับระบบใหม่ (build server/ + PostgreSQL ชั่วคราว ให้เอง แต่ละ test ได้อู่ของตัวเองจาก fixture)
npm run dev                                # เปิดระบบใหม่แบบ next dev + PostgreSQL ชั่วคราว ที่ port 3000 พร้อมร้านตัวอย่าง demo-biz, demo-prox, demo-franchise (ข้อมูลหายเมื่อปิด; คู่มือสำหรับเจ้าของโปรเจกต์: docs/TRY-LOCALLY.md)
npm run typecheck                          # ตรวจ TypeScript ของ server/
npm run test:db                            # test ของฐานข้อมูล: แยกข้อมูลระหว่างอู่/สาขา (RLS), เก็บ/อ่าน/บันทึกข้อมูลร้าน
npm run test:unit                          # test ของ server/lib (แบ่งข้อมูลเป็นหน่วยแล้วประกอบกลับได้ทุกไบต์ ฯลฯ)
node tools/split-legacy.mjs --check        # พิสูจน์ว่า frontend/ ตรงกับระบบเดิมทุกไบต์ ยกเว้นจุดที่จดใน frontend/CHANGES.md
node tools/build-client.mjs                # สร้าง frontend/js/00-server-storage.js จาก server/client/ (--check ตรวจว่าตรงกับต้นฉบับ)
node tools/accountant-pack.mjs            # ชุดตรวจสำหรับผู้ทำบัญชี: คำถามจาก docs/ACCOUNTANT-REVIEW.md เป็น Excel ให้ตอบ + เอกสารที่ระบบใหม่พิมพ์ (PDF) รวมเป็น accountant-pack.zip
docker build -t drivego:smoke . && node tools/image-smoke.mjs   # ลอง image ของ server ทดสอบแบบที่ DigitalOcean รัน (ฐานข้อมูล TLS, job migrate, เข้าระบบร้านตัวอย่าง, เปิดร้านจริง)
node tools/shop-admin.mjs new|password|list|show|renew|close|told …   # เครื่องมือทีมงาน: เปิดร้านจริง ลืมรหัสผ่าน วันหมดอายุ จดว่าโทรแจ้งร้านแล้ว (คู่มือ docs/STAFF-TOOLS.md)
node tools/nightly.mjs                     # งานทุกคืนของ server (.do/app.yaml job nightly): ลบข้อมูลร้านที่ครบกำหนด ไฟล์ที่ถูกลบเกิน 30 วัน และบอกร้านที่ทีมงานต้องโทรแจ้ง (จบด้วย 3)
node tools/watch.mjs                       # งานทุกชั่วโมง (.do/app.yaml job watch): ข้อผิดพลาดของ server และหน้าจอตั้งแต่ครั้งก่อน (จบด้วย 3 = แจ้งเตือน) · รายละเอียด: node tools/errors.mjs
npm run test:record -- tests/scenarios/S05-xxx.spec.ts   # บันทึกเฉลยจากระบบเดิม (เฉพาะไฟล์ที่ระบุ)
npm run fixture -- biz trial               # สร้างข้อมูลตั้งต้นใหม่ (biz | prox | franchise) — ปกติไม่ต้องสร้างใหม่ ใช้ไฟล์ที่ commit ไว้
npm run inventory                          # สร้าง docs/behaviors.csv ใหม่
npm run coverage                           # รันทุก test พร้อมวัดว่าฟังก์ชันไหนยังไม่เคยถูกเรียก
npm run selfcheck                          # พิสูจน์ว่ากรรมการ 3 ตัวยังจับความผิดปกติได้ (ทำระบบพังโดยตั้งใจ 3 แบบ)
node tools/explore.mjs <ชื่อ> "<คำสั่ง Playwright>" [dataset]   # สำรวจหน้าจอตอนเขียนสถานการณ์ (ภาพอยู่ที่ .explore/)
COVERAGE=1 npx playwright test <ไฟล์> && node tools/which-ran.mjs <ชื่อฟังก์ชัน…>   # ตรวจว่าสถานการณ์เรียกฟังก์ชันที่ต้องการจริง
```

CI (GitHub Actions, `.github/workflows/ci.yml`) รันทุกอย่างข้างบนทุกครั้งที่ push ในสภาพแวดล้อมที่ล็อกไว้ (`.github/actions/setup`):
image ของ Playwright 1.56.1 บน Ubuntu 24.04, Node 22.22.0, PostgreSQL 16 และฟอนต์กับการตั้งค่าฟอนต์ชุดเดียวกับเครื่องที่บันทึกเฉลย
(`tests/support/fontconfig/`) เครื่องมือที่เปิด Chromium เองต้องใช้ `LAUNCH_OPTIONS` จาก `tests/support/config.mjs` (สั่งไม่จัดตัวอักษรให้ตรงพิกเซล ดู NOTES.md งาน T11)
ถ้าวันหนึ่งภาพใน CI ไม่ตรงกับเฉลย ดูขั้น ci-diff-report ใน log ก่อน และใช้ workflow "Record screenshot goldens (P4)" (บันทึกใหม่จากระบบเดิมเท่านั้น) เมื่อแก้ที่สภาพแวดล้อมไม่ได้

PostgreSQL ไม่ต้องติดตั้ง server เอง: `tools/pg-temp.mjs` สร้างฐานข้อมูลชั่วคราวจากโปรแกรม PostgreSQL ในเครื่อง (ไม่ใช้ Docker)
บนพอร์ตสุ่ม แล้วลบทิ้งเมื่อปิด ถ้าตั้ง `DATABASE_URL` ไว้จะใช้ฐานข้อมูลนั้นแทน

ถ้ารัน Playwright หลายชุดพร้อมกัน (เช่น หลาย agent) ให้ใส่ `--output=<โฟลเดอร์ของตัวเอง>`
เพราะทุกการรันจะล้าง `test-results/` ของชุดอื่นทิ้ง ส่วน server ของไฟล์เดิมไม่ต้องเปิดเอง
ทุกการรันและทุกเครื่องมือเปิด server ของตัวเองบนพอร์ตสุ่ม (`LEGACY_PORT`) จึงไม่ปิดของกันและกัน

## กติกา (ห้ามละเมิด)

1. **ห้ามแก้ `legacy/`** ไฟล์นี้คือเฉลย
2. **ดูพฤติกรรมจากการรันระบบเดิม ไม่ใช่จากการอ่านโค้ด** ฟังก์ชัน 204 ตัวถูกครอบหรือแทนที่ซ้อนกันหลายชั้นตอนทำงาน (ดู `docs/BEHAVIORS.md` คอลัมน์ live_line)
   เช่น `markPaid` ที่บรรทัด 8531 ถูกครอบที่บรรทัด 23541 จนทำงานต่างจากที่อ่านเจอ ฟังก์ชันที่ทำงานจริงคือ `window[name]` หลังโหลดเสร็จ
3. **ห้ามแก้หรือลบไฟล์ใน `tests/golden/` และห้ามข้าม ปิด หรือผ่อน test เพื่อให้ผ่าน**
   เฉลยบันทึกได้จากระบบเดิมเท่านั้น (`TARGET=legacy`) และต้องได้รับอนุมัติจากเจ้าของโปรเจกต์
4. **ถ้าไม่แน่ใจเรื่องบัญชี ภาษี (VAT, หัก ณ ที่จ่าย) ประกันสังคม เลขที่เอกสาร หรือสิทธิ์ ให้หยุดและถามเจ้าของโปรเจกต์** ห้ามเดา
5. **พฤติกรรมที่ตั้งใจเปลี่ยนจากระบบเดิม** (เช่น รหัสผ่านแบบข้อความธรรมดา) ต้องได้รับอนุมัติ บันทึกใน `docs/NOTES.md` และเขียนสถานการณ์ใหม่แทนการลอกเฉลย
6. **งานจะนับว่าเสร็จเมื่อ** กรรมการทั้ง 3 ตัวผ่าน และ `docs/behaviors.csv` ในขอบเขตของงานไม่มีแถวที่ยังไม่มี test
7. ข้อความภาษาไทยบนหน้าจอต้องเหมือนระบบเดิมทุกตัวอักษร
8. ตั้งแต่เฟส 2: `shop_id` มาจาก session ฝั่ง server เท่านั้น และทุกตารางของอู่ต้องผ่าน Row-Level Security (ดู NOTES.md)

## วิธีเขียนสถานการณ์

```ts
import { test } from '../support/test';

test('S05 รับชำระใบตัดสต็อกที่ค้างชำระ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');                    // กรรมการ 3: หน้า, ป๊อปอัพ, ข้อความที่เห็นในแต่ละขั้น
  const before = await app.state();
  // ... กดตามที่ผู้ใช้กด โดยหาปุ่มจากข้อความที่ผู้ใช้เห็น ...
  await golden.step('หลังกดรับชำระ');
  await golden.stateChange('pay', before);         // กรรมการ 1: ข้อมูลที่เปลี่ยน
  await golden.screen('after-pay');                // กรรมการ 2: ภาพหน้าจอ
});
```

- หาปุ่มและช่องกรอกจากข้อความหรือ label ที่ผู้ใช้เห็น (`getByRole`, `getByText`, `getByPlaceholder`) ไม่ใช่ id ภายใน
  เพื่อให้สถานการณ์เดียวกันใช้กับระบบใหม่ได้
- ห้ามเรียกฟังก์ชันของระบบเดิมโดยตรงใน test ยกเว้นตอนสร้าง fixture ต้องกดผ่านหน้าจอเหมือนผู้ใช้
- ทุก test เริ่มจาก fixture `biz-trial` (ข้อมูลชุด "พร้อมทดลอง" ที่ระบบสร้างเองตอนเจ้าของร้านเข้าระบบครั้งแรก) และยังไม่ได้ล็อกอิน
  แพ็กเกจอื่นใช้ `test.use({ dataset: 'prox-trial' })` หรือ `'franchise-trial'` ระบบจะเปิดด้วย `?package=` ที่ตรงกัน
  และ `app.loginAsOwner()` ใช้บัญชีเจ้าของของแพ็กเกจนั้น (Franchise = HQ `hq / 1234`)
  ข้อมูลถูกเขียนลงเบราว์เซอร์ก่อนเปิดโปรแกรมทุกครั้ง (`restoreDataset` ใน `tests/support/browser.mjs`)
- เวลาถูกล็อกไว้ที่ `2026-10-13 09:00` (Asia/Bangkok) ส่วน fixture สร้างที่ 08:00 วันเดียวกัน
  และ `Math.random` ถูกล็อกค่าตั้งต้น ผลจึงต้องเหมือนเดิมทุกรอบ
- ฟอนต์ Google ถูกเก็บไว้ใน `tests/support/fonts/` และ test ไม่เชื่อมต่ออินเทอร์เน็ต
- พฤติกรรมที่ขึ้นกับวันที่ (เช่น บิลเลยกำหนด) ให้ตั้งเวลาก่อนเปิดโปรแกรมด้วย `await page.clock.setFixedTime(...)` (ดู S77)
- กรรมการลำดับขั้นตอน (`golden.step`) บันทึก: เมนู เมนูย่อย และแท็บที่เปิดอยู่ (หรือ "(หน้าเข้าสู่ระบบ)"),
  ป๊อปอัพ แผงข้าง การ์ดยืนยัน และหน้าต่าง/แถบของ Franchise ที่เปิดอยู่, และข้อความที่ขึ้นตั้งแต่ขั้นก่อน
  รวมข้อความผิดพลาดของหน้าเข้าระบบ (ข้อความเดียวกันที่ขึ้นติดกันนับครั้งเดียว) แต่ไม่นับข้อความที่ขึ้นระหว่างเปิดโปรแกรม (ดู NOTES.md)
  หน้าต่าง `confirm()` ของเบราว์เซอร์ไม่อยู่ในนี้: ถ้าสถานการณ์ต้องตอบ ให้ใช้ `page.on('dialog')` แล้วเก็บข้อความด้วย `toMatchSnapshot` (ดู S86)
- ตัวช่วยของ `app`: `loginAsOwner()`, `open()`, `login(user, pass)`, `logout()` (ตอบการ์ดยืนยันของ Franchise; ร้าน Biz ออกทันทีไม่ถาม ดู S101),
  `loginRefused(user, pass)` (คืนข้อความผิดพลาดของหน้าเข้าระบบ), `state()`, `settle()`
- ปุ่มที่เปลี่ยนข้อมูลทั้งก้อน (ล้างข้อมูล, กู้คืน, นำเข้า, โหลดข้อมูลตัวอย่าง) ใช้ `golden.counts(name)` แทน `stateChange`
  เพราะส่วนต่างเต็ม ๆ จะใหญ่หลาย MB
- ไฟล์ที่ผู้ใช้อัปโหลดในสถานการณ์ (รูป, CSV, ไฟล์สำรอง) เก็บใน `tests/assets/` ชื่อขึ้นต้นด้วยเลขสถานการณ์
- โหมดออนไลน์ของ ProX ต่อกับ server เครือจำลอง `tests/support/chain-server.ts` (ยังไม่มีของจริง ดู S123–S125)
- หน้าต่างที่มีปุ่มข้าง (ปิด / บันทึก ที่ขอบขวา) จัดตำแหน่งปุ่มอีกครั้ง 350 ms หลังเปิด ถ้าสถานการณ์ทำให้ฟอร์มสูงขึ้นก่อนถ่ายภาพ ให้รอ 400 ms หลังเปิดหน้าต่างก่อนกรอก (ดู S72)
- `golden.screen` ย้ายเมาส์ไปมุมซ้ายบน รอให้ความกว้างคอลัมน์ตารางนิ่ง แล้วจึงถ่าย และซ่อนข้อความที่หายเองตามเวลา (toast, การ์ดบันทึก)
- เบราว์เซอร์ของ test เปิดเมนูย่อยด้านซ้ายทันทีโดยไม่มีภาพเคลื่อนไหว (กดระหว่างเมนูกางทำให้แถบเมนูเลื่อนแบบสุ่ม ดู NOTES.md)
- ฟังก์ชันที่กดจากหน้าจอไม่ถึง (โค้ดเก่าที่ถูกแทนที่) อยู่ใน `tools/unreachable.json` พร้อมเหตุผล ไม่ต้องเขียนสถานการณ์และไม่ต้องย้าย
  ถ้าเจอเพิ่ม ให้ตรวจในโปรแกรมที่ทำงานจริงก่อน แล้วเพิ่มลงไฟล์นั้น
- เพิ่มสถานการณ์ใหม่แล้วต้องเพิ่มคำอธิบายภาษาไทยใน `docs/SCENARIOS.md` ด้วย
