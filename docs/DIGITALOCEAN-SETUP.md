# ตั้ง server ทดสอบบน DigitalOcean (สำหรับเจ้าของโปรเจกต์)

ข้อตัดสิน 2026-10-29: **App Platform** รันแอป + **Managed PostgreSQL** เก็บข้อมูล ทั้งคู่อยู่ที่ **สิงคโปร์** (เหตุผลอยู่ใน [HOSTING.md](HOSTING.md))
server ทดสอบนี้ใช้ข้อมูลทดลองเท่านั้น ข้อมูลจริงของอู่นำร่องต้องรอคำตอบเรื่อง PDPA ก่อน (LAUNCH-CHECKLIST.md ด่าน 2)

ทำ 3 ส่วน: **ส่วนที่ 1–2 ทำได้เลย** (ราว 30 นาที) ส่วนที่ 3 (สร้างแอป) ทำเมื่อ Claude บอกว่า branch `deploy/test` พร้อม
ชื่อปุ่มและเมนูอาจต่างจากที่เขียนเล็กน้อยถ้า DigitalOcean เปลี่ยนหน้าเว็บ ถ้าหาไม่เจอ ถาม Claude พร้อมบอกว่าเห็นอะไรบนจอ

## ก่อนเริ่ม: เรื่องความปลอดภัย

- **ห้ามส่งในแชต:** รหัสผ่าน, รหัส 2 ขั้นตอน (2FA), รหัสสำรอง, ข้อความเชื่อมต่อฐานข้อมูล (ที่ขึ้นต้นด้วย `postgresql://`) และ API token ทุกชนิด
- Claude ไม่ต้องเข้าบัญชี DigitalOcean ของคุณ: แอปจะ deploy จาก GitHub เอง และรหัสของฐานข้อมูลส่งถึงแอปภายใน DigitalOcean โดยไม่ผ่านใคร
- สิ่งที่ส่งให้ Claude ได้: ชื่อที่ตั้ง (ทีม โปรเจกต์ ฐานข้อมูล) region ที่เลือก และ URL ของแอปเมื่อมีแล้ว (URL เป็นข้อมูลเปิดเผย)

## ส่วนที่ 1: สมัครบัญชี (ราว 10 นาที)

1. ไปที่ https://cloud.digitalocean.com/registrations/new สมัครด้วยอีเมลที่จะใช้ดูแลระบบระยะยาว (อีเมลของธุรกิจดีที่สุด) แล้วยืนยันอีเมล
2. ใส่วิธีชำระเงิน (บัตรเครดิต/เดบิต หรือ PayPal) DigitalOcean อาจกันเงินจำนวนเล็กน้อยไว้ชั่วคราวเพื่อตรวจบัตร หรือขอยืนยันตัวตนเพิ่ม
3. **เปิดการยืนยัน 2 ขั้นตอน**: มุมขวาบน รูปบัญชี → **My Account** → **Security** → Two-factor authentication → ใช้แอปอย่าง Google Authenticator
   เก็บรหัสสำรอง (backup codes) ไว้ในที่ปลอดภัย ไม่ใช่ในแชตนี้
4. **ตั้งเตือนค่าใช้จ่าย**: เมนูซ้าย **Billing** → **Billing alerts** → เปิดและตั้งไว้ **$50** (ค่าที่คาดไว้ราว $27/เดือน ถ้าเกิน $50 แปลว่ามีอะไรผิดปกติ)
5. ตั้งชื่อทีม (Team) เป็น **DriveGo** (มุมซ้ายบน หรือ Settings → Team)
6. สร้างโปรเจกต์: เมนูซ้าย **Projects** → **New Project** → ชื่อ **DriveGo test** → จุดประสงค์ "Web Application" → สภาพแวดล้อม "Staging"
   (ถ้าถามให้ย้ายของเดิมเข้าโปรเจกต์ กด Skip)

## ส่วนที่ 2: สร้างฐานข้อมูล (ราว 10 นาที + รอสร้างราว 5 นาที)

ปุ่มเขียว **Create** มุมขวาบน → **Databases** แล้วเลือกตามตาราง:

| ช่อง | เลือก | ทำไม |
|---|---|---|
| Datacenter region | **Singapore (SGP1)** | อยู่ที่เดียวกับแอป ใกล้ไทยที่สุด |
| Database engine | **PostgreSQL** รุ่น **16** | รุ่นเดียวกับที่ CI ทดสอบทุกครั้ง |
| Database configuration / plan | **Basic** (shared CPU) **1 GB RAM / 1 vCPU / 10 GB** | ราว $15/เดือน พอสำหรับ server ทดสอบ |
| Standby nodes | **ไม่เพิ่ม (0)** | โหนดสำรองคิดเงินเท่าโหนดหลัก ตัดสินตอนอู่นำร่อง |
| Storage | 10 GB (ค่าเริ่มต้น) | เพิ่มทีหลังได้ ลดไม่ได้ |
| Database cluster name | **drivego-test-db** | |
| Project | **DriveGo test** | |

กด **Create Database Cluster** แล้วรอจนสถานะเป็นสีเขียว (ราว 5 นาที)
หน้าถัดไปที่ชวนให้ทำ "Getting Started" (ตั้ง trusted sources, ดูข้อความเชื่อมต่อ) **ข้ามไปก่อน** ส่วนที่ 3 จะจำกัดให้แอปของเราเท่านั้นที่ต่อได้
และไม่ต้องคัดลอกข้อความเชื่อมต่อไปไหน

## ส่วนที่ 3: สร้างแอปจาก GitHub (ราว 30 นาที)

ไฟล์ที่ DigitalOcean ใช้อยู่ใน repo แล้ว: `Dockerfile` (วิธีสร้างแอป) และ `.do/app.yaml` (ตั้งค่าแอป: เครื่อง 512 MB ที่สิงคโปร์ (ช่วงที่มีแต่ร้านตัวอย่าง),
งาน migrate ที่ปรับโครงสร้างฐานข้อมูลก่อน deploy ทุกครั้ง, งาน nightly ทุกคืน 03:17 น. (ลบข้อมูลร้านที่ครบกำหนดและไฟล์ที่ถูกลบเกิน 30 วัน),
งาน watch ทุกชั่วโมง (ดูข้อผิดพลาดของระบบ) ดู [STAFF-TOOLS.md](STAFF-TOOLS.md), การแจ้งเตือนเมื่อแอปล่มซ้ำหรือหน่วยความจำ/CPU เต็ม,
การผูกกับฐานข้อมูล) แอปจะ deploy จาก branch **`deploy/test`**
ซึ่งขยับไป commit ที่ CI ทดสอบผ่านครบเท่านั้น (คืนละครั้ง 23:30 น. หรือกดเอง ดู STAFF-TOOLS.md "เวอร์ชันใหม่ขึ้น server เมื่อไร") **เริ่มส่วนนี้เมื่อ Claude บอกว่า branch `deploy/test` พร้อมแล้ว**

1. **สร้าง user ของแอปในฐานข้อมูล**: Databases → **drivego-test-db** → แท็บ **Users & Databases** → Add new user →
   ชื่อ **`drivego_app`** (ตัวพิมพ์เล็ก มีขีดล่าง) → Save ไม่ต้องคัดลอกรหัสผ่าน DigitalOcean ส่งให้แอปเอง
   (แอปต่อฐานข้อมูลด้วย user นี้ ซึ่งถูกกันให้เห็นข้อมูลได้เฉพาะร้านที่เข้าระบบอยู่)
2. **สร้างแอป**: ปุ่ม **Create** → **Apps** → Git provider: **GitHub**
   - ครั้งแรกจะให้ติดตั้ง DigitalOcean บน GitHub: เลือก **Only select repositories** → **Museey/drive-go** → Install
   - Repository: **Museey/drive-go** · Branch: **deploy/test** · Source directory: `/` · Autodeploy: เปิด → Next
   - DigitalOcean จะเห็น Dockerfile และเสนอค่าตั้ง กดผ่านไปได้ (ข้อ 3 จะแทนด้วยไฟล์ของเรา) Region: **Singapore**
   - ชื่อแอป **drivego-test** โปรเจกต์ **DriveGo test** → Create Resources ครั้งแรกอาจ deploy ไม่ผ่าน ไม่เป็นไร
3. **ใช้ไฟล์ตั้งค่าของเรา**: ในแอป → **Settings** → หัวข้อ **App Spec** → Edit
   → ลบของเดิมทั้งหมด → วางเนื้อหาของ https://github.com/Museey/drive-go/blob/deploy/test/.do/app.yaml (กดปุ่ม Raw แล้วคัดลอกทั้งหมด) → Save
   จะมีส่วนประกอบ **web** (แอป), **migrate** (งานก่อน deploy), **nightly** (งานทุกคืน) และ **watch** (งานทุกชั่วโมง) และผูกกับ **drivego-test-db**
4. **ใส่รหัสเจ้าของฐานข้อมูลให้งาน migrate, nightly และ watch** (ห้ามส่งในแชต):
   - Databases → drivego-test-db → **Connection Details** → User: **doadmin** · แบบ **Connection string** → Copy
   - แอป → Settings → ส่วนประกอบ **migrate** → **Environment Variables** → Edit → Add
     Key: **`MIGRATE_DATABASE_URL`** · Value: วางที่คัดลอกมา · ติ๊ก **Encrypt** → Save
   - ทำซ้ำกับส่วนประกอบ **nightly** และ **watch** (Key และ Value เดียวกัน ติ๊ก Encrypt)
   - งาน nightly / watch ที่ล้ม, มีร้านต้องโทรแจ้ง หรือระบบมีข้อผิดพลาด DigitalOcean ส่งอีเมลแจ้งเตือน (กฎ `JOB_INVOCATION_FAILED`)
     ถึงอีเมลของบัญชี ว่าทำอะไรต่อดู [STAFF-TOOLS.md](STAFF-TOOLS.md) "งานทุกคืน" และ "เมื่อได้อีเมลแจ้งเตือน"
5. **ให้ฐานข้อมูลรับเฉพาะแอป**: Databases → drivego-test-db → **Settings** → **Trusted sources** → Edit → เพิ่มแอป **drivego-test** → Save
6. **Deploy**: แอป → ปุ่ม **Actions** → **Force rebuild and deploy** รอจนขึ้นสีเขียว (ราว 10 นาที)
   ถ้าไม่ผ่าน: แท็บ **Activity** → deploy ล่าสุด → ดู log ของ **migrate** หรือ **web** แล้วคัดลอกข้อความ error ส่งให้ Claude ได้ (log ไม่มีรหัส)
7. **ลองใช้**: เปิด URL ของแอป (ลงท้าย `.ondigitalocean.app`) ต่อด้วย `/demo-biz/` เข้าด้วย **dg1688 / 123456**
   (ร้านตัวอย่าง demo-biz, demo-prox รหัสเดียวกัน, demo-franchise ใช้ hq / 1234) แล้วส่ง URL ให้ Claude
   **ตั้งแต่ 2026-11-23 (มีอู่จริงบน server นี้แล้ว)**: งาน migrate ไม่สร้างร้านตัวอย่างแล้ว (`SEED_DEMO_SHOPS` เอาออก) และรหัสข้างบนต้องเปลี่ยน
   ตาม [STAFF-TOOLS.md](STAFF-TOOLS.md) "ร้านตัวอย่างบน server ที่มีอู่จริง" ถ้าสร้างแอปใหม่ ร้านตัวอย่างเปิดด้วย `shop-admin new` แทน
8. **ตรวจว่าเว็บยังเปิดได้ (Uptime check)** หลังข้อ 7 ผ่านแล้ว (ตามคู่มือ DigitalOcean ฉบับ 2026-10-06):
   - เมนูซ้าย **Insights** → แท็บ **Uptime** (หรือ https://cloud.digitalocean.com/insights/uptime/checks หรือพิมพ์ Uptime ในช่องค้นหาด้านบน)
     → **Create a new Uptime Check**
   - ชนิด **HTTPS** · URL: URL ของแอปต่อด้วย **`/api/health`** (เช่น `https://drivego-test-xxxxx.ondigitalocean.app/api/health`)
   - Regions: มี Asia East, Europe, USA East, USA West (ติ๊กไว้ทั้งหมดเป็นค่าเริ่ม) เลือก **Asia East** อย่างเดียวพอ
     (ผู้ใช้อยู่ไทย ยิ่งหลาย region ยิ่งมีโอกาสเตือนเพราะเน็ตระหว่างทวีป)
   - ชื่อ **drivego-test** → **Create Uptime Check**
   - การแจ้งเตือน: หน้าจอเดือน พ.ย. 2026 ใหม่กว่าคู่มือของ DigitalOcean ใช้ "Alert Rules" ตามตัววัด (ทำจริง 2026-11-01)
     - หน้าสถานะของ check → **Create Alert Rule**
     - Resource type **Uptime**
     - Metric **`do.uptime.probe_success`** (Uptime: Probe Success; 1 = ตอบปกติ, 0 = ไม่ตอบ)
       - ไม่ใช่ `probe_duration` ที่ขึ้นมาเป็นค่าเริ่ม ตัวนั้นวัดความช้า
     - Resource **drivego-test**
     - Condition **`<=` `0`** ระดับ Critical
     - Evaluation window **5 minutes**, Re-notify **Every 4 hours**
     - Notification method: **+ Create New Notification Channel** → Email → อีเมลของทีม แล้วเลือกช่องทางนั้น
     - Name **drivego-test down** → สร้าง
   - กฎใบรับรองใกล้หมดอายุ (`do.uptime.ssl_cert_expiry`) ไม่จำเป็น: App Platform ต่ออายุใบรับรองเอง
   - `/api/health` ตอบสำเร็จเมื่อแอปทำงานและต่อฐานข้อมูลได้ ถ้าฐานข้อมูลล่มก็นับว่าเว็บล่ม
   - ราคา: ตรวจบนหน้าเว็บตอนสร้าง

**ข้อควรรู้**: ร้านตัวอย่างใส่แต่ข้อมูลทดลอง ห้ามใส่ข้อมูลลูกค้าจริง ช่วงที่ยังใช้รหัสในคู่มือนี้ ใครรู้ URL ก็เข้าได้
deploy ครั้งต่อ ๆ ไปเกิดเองคืนละครั้ง 23:30 น. จาก commit ล่าสุดที่ CI ผ่าน หรือกดเองใน GitHub Actions (ผลตรวจ 2026-11 ก7, STAFF-TOOLS.md)

## ส่วนที่ 4: เปิดหน้าเว็บทีมงาน `/ops` (ราว 10 นาที, ทำหลังส่วนที่ 3)

หน้าเว็บทีมงาน (เปิดร้าน ตั้งรหัสใหม่ให้เจ้าของร้าน ต่ออายุ ปิดร้าน; [STAFF-TOOLS.md](STAFF-TOOLS.md)) อยู่ในแอป **drivego-test** เดิมที่ `/ops/`
(เจ้าของโปรเจกต์เลือก 2026-11-11) ไม่มีค่าใช้จ่ายเพิ่ม หน้านี้เปิดเมื่อแอปมีข้อความเชื่อมต่อของ user `drivego_staff` เท่านั้น ก่อนนั้น `/ops/` ตอบ 404

1. **สร้าง user ของหน้าทีมงานในฐานข้อมูล**: Databases → **drivego-test-db** → **Users & Databases** → Add new user →
   ชื่อ **`drivego_staff`** → Save
2. **คัดลอกข้อความเชื่อมต่อของ user นี้** (ห้ามส่งในแชต): drivego-test-db → **Connection Details** → User: **drivego_staff** ·
   แบบ **Connection string** → Copy
3. **ใส่ให้แอป**: แอป **drivego-test** → **Settings** → ส่วนประกอบ **web** → **Environment Variables** → Edit → Add
   Key: **`STAFF_DATABASE_URL`** · Value: วางที่คัดลอกมา · ติ๊ก **Encrypt** → Save
   แอปจะ deploy ใหม่เอง (งาน migrate ให้สิทธิ์ drivego_staff ระหว่าง deploy) รอจนขึ้นสีเขียว
4. **สร้างบัญชีทีมงานคนแรก**: แอป **drivego-test** → ส่วนประกอบ **web** → แท็บ **Console** → ทำตาม [STAFF-TOOLS.md](STAFF-TOOLS.md)
   "วิธีรันบน server ทดสอบ" (export MIGRATE_DATABASE_URL) แล้วพิมพ์
   `node tools/shop-admin.mjs staff add ชื่อผู้ใช้ --name "ชื่อจริง" --by ชื่อของคุณ` จะได้รหัสชั่วคราว (แสดงครั้งเดียว)
5. **ลองเข้า**: เปิด URL ของแอปต่อด้วย **`/ops/`** (`https://app.drivegox.com/ops/`) → ใส่ชื่อผู้ใช้และรหัสชั่วคราว
   → ตั้งรหัสผ่านของตัวเอง (อย่างน้อย 12 ตัว) → ติดตั้ง Google Authenticator หรือ Microsoft Authenticator ในมือถือ แล้วสแกน QR
   → ใส่รหัส 6 หลัก แล้วจะเห็นรายการร้านทั้งหมด

**ข้อควรรู้**: การเข้าระบบของหน้าทีมงานอยู่เฉพาะแท็บที่เข้า (แท็บใหม่ต้องเข้าใหม่ และถ้าเปิดหน้าร้านในแท็บเดียวกัน กลับมาต้องเข้าใหม่)
ถ้าวันหนึ่งวางไฟล์ `.do/app.yaml` ทับ App Spec อีกครั้ง ต้องใส่ `STAFF_DATABASE_URL` ใหม่ (เหมือน `MIGRATE_DATABASE_URL` ของงาน migrate, nightly, watch)

## ส่วนที่ 5: โดเมนของเราเอง (ทำแล้ว 2026-11-17: `app.drivegox.com`)

โดเมน `drivegox.com` ซื้อที่ GoDaddy และให้ GoDaddy ดูแล DNS ต่อ ใช้โดเมนย่อย `app` เพราะ GoDaddy ชี้ชื่อหลัก (@) ด้วย CNAME ไม่ได้
1. **DigitalOcean**: แอป **drivego-test** → แท็บ **Networking** → หัวข้อ **Domains** → **Add domain** → Domain: **`app.drivegox.com`**
   → Management options: **You manage your domain** → คัดลอก **CNAME alias** (ลงท้าย `ondigitalocean.app`) → **Add domain**
2. **GoDaddy**: โดเมน → **DNS** → **Add New Record** → Type **CNAME** · Name **`app`** · Value: alias ที่คัดลอกมา · TTL ค่าตั้งต้น → Save
3. รอให้ Networking → Domains ขึ้นว่าใช้งานได้ (ไม่กี่นาทีถึง 1 ชั่วโมง, นานสุด 72 ชั่วโมง) DigitalOcean ออกใบรับรอง https ให้เอง

- โดเมนอยู่ใน `.do/app.yaml` แล้ว (`domains:`) วางไฟล์ทับ App Spec อีกครั้งโดเมนจึงไม่หลุด (ไม่มี `zone` เพราะ DNS อยู่ที่ GoDaddy)
- ที่อยู่เดิม `https://drivego-test-asaao.ondigitalocean.app` ยังใช้ได้เหมือนเดิม
- ตรวจแล้ว 2026-11-17 ผ่านโดเมนใหม่: `node tools/server-check.mjs --url https://app.drivegox.com` ผ่าน 12 ข้อ (จาก session ของ Claude ต้องใส่
  `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` และเพิ่ม host ใน Allowed domains ของ environment ก่อน)
- ชื่อหลัก `drivegox.com` ยังเป็นหน้าของ GoDaddy ถ้าอยากให้พาไปที่ระบบ ตั้ง **Forwarding** ของโดเมนที่ GoDaddy ไป `https://app.drivegox.com` (ไม่บังคับ)
- ถ้าใบรับรองไม่ออก: ถ้าโดเมนมีรายการ CAA ต้องมีทั้ง `letsencrypt.org` และ `pki.goog`

## ส่วนที่ 6: ส่งอีเมลชื่อผู้ใช้และรหัสผ่านให้ร้านที่ลงทะเบียน (ราว 30 นาที + รอ DNS)

ฟอร์ม "ลงทะเบียนเพื่อทดลองใช้ DriveGo X" ที่หน้าแรก (เจ้าของโปรเจกต์ 2026-11-20): ทีมงานกดอนุมัติที่ `/ops` → "คำขอลงทะเบียน" แล้วระบบส่งอีเมล
ชื่อผู้ใช้และรหัสผ่านชั่วคราวให้เจ้าของร้าน ผ่านบริการ **Resend** (resend.com ส่งผ่าน HTTPS เพราะ DigitalOcean ปิดการส่งอีเมลแบบ SMTP;
แพ็กเกจฟรีส่งได้ 3,000 ฉบับ/เดือน 100 ฉบับ/วัน) **ก่อนตั้งค่า** ปุ่มอนุมัติยังใช้ได้ หน้า `/ops` แสดงรหัสผ่านให้ทีมงานโทรแจ้งแทน

1. **สมัคร Resend**: https://resend.com → Sign up (ใช้อีเมลของบริษัท) → เปิด 2FA ที่ Settings
2. **เพิ่มโดเมน**: **Domains** → **Add Domain** → `drivegox.com` · Region: **Tokyo (ap-northeast-1)** (ใกล้ที่สุด) → Add
   Resend แสดงรายการ DNS 3–4 รายการ (MX และ TXT ของ `send`, TXT ของ `resend._domainkey`)
3. **ใส่ DNS** ที่ที่ดูแล DNS ของ `drivegox.com` (ถ้าย้ายไป Cloudflare แล้ว: Cloudflare → DNS → Records → Add record ตามที่ Resend บอกทุกช่อง
   ตั้งเป็น **DNS only** (เมฆสีเทา) / ถ้ายังอยู่ GoDaddy: DNS → Add New Record) แล้วกลับไปกด **Verify DNS Records** ที่ Resend รอจนขึ้น Verified
   (ไม่กี่นาทีถึงหลายชั่วโมง) รายการเหล่านี้ไม่กระทบเว็บ `app.drivegox.com` และไม่กระทบอีเมลรับเข้า
4. **สร้าง API key**: **API Keys** → **Create API Key** → Name `drivego-app` · Permission **Sending access** · Domain `drivegox.com` → Add
   → คัดลอก key (ขึ้นต้น `re_` แสดงครั้งเดียว **ห้ามส่งในแชต**)
5. **ใส่ให้แอป**: แอป **drivego-test** → **Settings** → ส่วนประกอบ **web** → **Environment Variables** → Edit → Add
   Key: **`RESEND_API_KEY`** · Value: key ที่คัดลอก · ติ๊ก **Encrypt** → Save (แอป deploy ใหม่เอง)
6. **ลอง**: กรอกฟอร์มลงทะเบียนที่หน้าแรกด้วยอีเมลของคุณเอง → `/ops` → คำขอลงทะเบียน → ตั้งรหัสร้าน → อนุมัติและเปิดร้าน
   → หน้าควรขึ้นว่า "ส่งชื่อผู้ใช้และรหัสผ่านชั่วคราวไปที่ … แล้ว" และอีเมลมาถึงจาก `noreply@drivegox.com` (ดูในจดหมายขยะด้วย)
   ถ้าส่งไม่ได้ หน้าแสดงสาเหตุและรหัสผ่านให้โทรแจ้ง

**ข้อควรรู้**: ผู้ส่งเปลี่ยนได้ด้วย Environment Variable `MAIL_FROM` (ค่าตั้งต้น `DriveGo X <noreply@drivegox.com>` ต้องเป็นโดเมนที่ Verified ที่ Resend)
ถ้าวางไฟล์ `.do/app.yaml` ทับ App Spec ต้องใส่ `RESEND_API_KEY` ใหม่ (เหมือน `STAFF_DATABASE_URL`)

## เสร็จส่วนที่ 1–2 แล้วบอก Claude

ส่งข้อความประมาณนี้ (ไม่มีรหัสใด ๆ):
"สมัครแล้ว เปิด 2FA แล้ว ทีม DriveGo โปรเจกต์ DriveGo test ฐานข้อมูล drivego-test-db PostgreSQL 16 สิงคโปร์ 1 GB สถานะเขียวแล้ว"

## ค่าใช้จ่ายโดยประมาณ (ตรวจราคาจริงบนหน้าเว็บตอนสมัคร)

| รายการ | ต่อเดือน |
|---|---|
| Managed PostgreSQL Basic 1 GB | ราว $15 |
| App Platform เครื่อง 512 MB (เจ้าของโปรเจกต์เลือก 2026-11-01; ขยายเป็น 1 GB ราว $12 ก่อนเปิดอู่นำร่อง) | ถูกกว่า 1 GB ดูราคาบนหน้าเว็บ |
| งาน migrate และ nightly | คิดเฉพาะเวลาที่รัน (ไม่กี่วินาทีต่อครั้ง) แทบไม่มีค่าใช้จ่าย |
| **รวม** | **ต่ำกว่า $27 (ประมาณ 950 บาท) ตอนใช้เครื่อง 512 MB** |

ฐานข้อมูลเริ่มคิดเงินทันทีที่สร้าง (คิดตามชั่วโมง) ถ้าจะหยุดพักนาน ลบได้แล้วสร้างใหม่ทีหลัง (server ทดสอบไม่มีข้อมูลจริง)
