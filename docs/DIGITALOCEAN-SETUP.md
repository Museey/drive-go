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

ไฟล์ที่ DigitalOcean ใช้อยู่ใน repo แล้ว: `Dockerfile` (วิธีสร้างแอป) และ `.do/app.yaml` (ตั้งค่าแอป: เครื่อง 1 GB ที่สิงคโปร์,
งาน migrate ที่ปรับโครงสร้างฐานข้อมูลก่อน deploy ทุกครั้ง, งาน nightly ทุกคืน 03:17 น. (ลบข้อมูลร้านที่ครบกำหนดและไฟล์ที่ถูกลบเกิน 30 วัน),
งาน watch ทุกชั่วโมง (ดูข้อผิดพลาดของระบบ) ดู [STAFF-TOOLS.md](STAFF-TOOLS.md), การแจ้งเตือนเมื่อแอปล่มซ้ำหรือหน่วยความจำ/CPU เต็ม,
การผูกกับฐานข้อมูล) แอปจะ deploy จาก branch **`deploy/test`**
ซึ่ง CI ขยับให้เองหลังทดสอบผ่านครบเท่านั้น **เริ่มส่วนนี้เมื่อ Claude บอกว่า branch `deploy/test` พร้อมแล้ว**

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
8. **ตรวจว่าเว็บยังเปิดได้ (Uptime check)** หลังข้อ 7 ผ่านแล้ว:
   - เมนูซ้าย **Monitoring** → **Uptime** → **Create Uptime Check** → แบบ **HTTPS** → URL: URL ของแอปต่อด้วย **`/api/health`**
     (เช่น `https://drivego-test-xxxxx.ondigitalocean.app/api/health`) → Regions เลือก **Singapore** (และอีกที่ถ้ามี) → ชื่อ **drivego-test** → Create
   - หน้า check ที่สร้าง → **Create Uptime Alert** → ชนิด **Downtime** (เว็บไม่ตอบ) ส่งอีเมล → Save
     สร้างอีกอันชนิด **SSL Cert Expire** (ใบรับรองใกล้หมดอายุ) ก็ได้
   - `/api/health` ตอบสำเร็จเมื่อแอปทำงานและต่อฐานข้อมูลได้ ถ้าฐานข้อมูลล่มก็นับว่าเว็บล่ม
   - ราคา: ตรวจบนหน้าเว็บตอนสร้าง

**ข้อควรรู้**: ร้านตัวอย่างใช้รหัสที่เขียนไว้ในคู่มือนี้ ใครรู้ URL ก็เข้าได้ ใส่แต่ข้อมูลทดลอง ห้ามใส่ข้อมูลลูกค้าจริง
งาน migrate เปิดร้านตัวอย่างเฉพาะตอนฐานข้อมูลยังไม่มีร้าน และ deploy ครั้งต่อ ๆ ไปเกิดเองทุกครั้งที่ CI ผ่าน

## เสร็จส่วนที่ 1–2 แล้วบอก Claude

ส่งข้อความประมาณนี้ (ไม่มีรหัสใด ๆ):
"สมัครแล้ว เปิด 2FA แล้ว ทีม DriveGo โปรเจกต์ DriveGo test ฐานข้อมูล drivego-test-db PostgreSQL 16 สิงคโปร์ 1 GB สถานะเขียวแล้ว"

## ค่าใช้จ่ายโดยประมาณ (ตรวจราคาจริงบนหน้าเว็บตอนสมัคร)

| รายการ | ต่อเดือน |
|---|---|
| Managed PostgreSQL Basic 1 GB | ราว $15 |
| App Platform เครื่อง 1 GB | ราว $12 |
| งาน migrate และ nightly | คิดเฉพาะเวลาที่รัน (ไม่กี่วินาทีต่อครั้ง) แทบไม่มีค่าใช้จ่าย |
| **รวม** | **ราว $27 (ประมาณ 950 บาท)** |

ฐานข้อมูลเริ่มคิดเงินทันทีที่สร้าง (คิดตามชั่วโมง) ถ้าจะหยุดพักนาน ลบได้แล้วสร้างใหม่ทีหลัง (server ทดสอบไม่มีข้อมูลจริง)
