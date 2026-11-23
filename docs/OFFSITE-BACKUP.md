# สำเนาฐานข้อมูลนอก DigitalOcean (job `offsite`)

ผลตรวจความปลอดภัย 2026-11 ข้อ ก6 ([SECURITY-AUDIT-2026-11.md](SECURITY-AUDIT-2026-11.md))

## ทำไมต้องมี

- backup ของ DigitalOcean (7 วัน, [RESTORE-DRILL.md](RESTORE-DRILL.md)) อยู่ในบัญชีและภูมิภาคเดียวกับฐานข้อมูล
  - บัญชีถูกปิด ถูกยึด จ่ายเงินไม่ผ่าน หรือมีคนได้รหัสเข้าบัญชีแล้วลบ cluster: ฐานข้อมูลและ backup หายพร้อมกัน
- จุดสำรองในเมนู 10 ของแต่ละร้านก็อยู่ในฐานข้อมูลเดียวกัน
- job `offsite` จึงทำสำเนาทั้งฐานข้อมูลทุกคืน **02:47 น.** แล้วส่งไปเก็บที่ผู้ให้บริการอื่น

## สำเนาปลอดภัยแค่ไหน

- **ล็อกด้วยกุญแจคู่**:
  - server มีแค่ **กุญแจสาธารณะ** ใช้ทำสำเนาได้ แต่เปิดอ่านไม่ได้
  - **กุญแจลับ** อยู่กับเจ้าของโปรเจกต์คนเดียว (มีรหัสผ่านอีกชั้น)
  - ผู้ให้บริการที่เก็บไฟล์ และคนที่ได้รหัสของ server ไป ก็อ่านข้อมูลอู่ไม่ได้
- **ไฟล์ที่ถูกแก้หรือไม่ครบ กู้ไม่ได้เลย** ระบบตรวจทั้งไฟล์ก่อน และไม่เขียนข้อมูลครึ่ง ๆ กลาง ๆ
- **กุญแจของ job เขียนไฟล์ได้อย่างเดียว** ลบหรืออ่านไฟล์เก่าไม่ได้
  - ไฟล์เก่าถูกลบโดยกฎของ bucket เอง เมื่อครบ 30 วัน
- **ในสำเนามี**:
  - ข้อมูลทุกร้าน ไฟล์แนบ จุดสำรอง
  - บัญชีผู้ใช้ วันหมดอายุ บัญชีทีมงาน
- **ในสำเนาไม่มี**:
  - การเข้าระบบที่ค้างอยู่ (กู้แล้วทุกคนเข้าระบบใหม่)
  - บันทึกข้อผิดพลาด

> **กุญแจลับหาย = สำเนาทุกไฟล์เปิดไม่ได้ตลอดไป** ไม่มีใครช่วยได้ ทั้ง Claude และผู้ให้บริการ
> เก็บไฟล์กุญแจไว้ **2 ที่** ที่ไม่ใช่ DigitalOcean และไม่ใช่ที่เดียวกับสำเนา (เช่น USB ในตู้เซฟ + โปรแกรมเก็บรหัสผ่าน)
> และจดรหัสผ่านของกุญแจแยกไว้

## ตั้งค่าครั้งแรก (ราว 40 นาที)

**รอเลือกผู้ให้บริการก่อน** (คำถามข้อ 1 ของ ก6): Backblaze B2 (แนะนำ ราคาถูก ราว 6 ดอลลาร์ต่อ TB ต่อเดือน) หรือ Google Cloud Storage
ชื่อเมนูข้างล่างเป็นของเดือน พ.ย. 2569 อาจต่างเล็กน้อย

### 1. สร้างกุญแจคู่ (บนคอมพิวเตอร์ของเจ้าของโปรเจกต์ ห้ามทำบน server)

ใช้เครื่องที่ลองระบบได้ตาม [TRY-LOCALLY.md](TRY-LOCALLY.md) (มี Node และ `npm install` แล้ว) ในโฟลเดอร์ drive-go:

```bash
node tools/backup-keys.mjs --out <โฟลเดอร์ที่จะเก็บกุญแจ เช่น USB>
```

- ตั้งรหัสผ่านของกุญแจ อย่างน้อย 12 ตัว (ถามสองครั้ง ไม่แสดงบนจอ)
- ได้ไฟล์ **`drivego-backup-private.pem`** = กุญแจลับ: คัดลอกไปเก็บที่ที่สอง
- บรรทัดยาวบรรทัดสุดท้าย = กุญแจสาธารณะ: คัดลอกไว้ใช้ข้อ 3 (ส่งในแชตได้ ไม่ใช่ความลับ)

### 2. สร้างที่เก็บ (bucket)

**Backblaze B2**
1. สมัครที่ backblaze.com → B2 Cloud Storage → **Buckets** → **Create a Bucket**
   - ชื่อ: `drivego-offsite-` ตามด้วยคำสุ่ม (ชื่อซ้ำกับคนอื่นทั่วโลกไม่ได้)
   - Files in Bucket: **Private**
   - Default Encryption: Enable
   - **Object Lock: Enable** → Default retention **Governance 30 days** (กันไม่ให้ใครลบสำเนาก่อน 30 วัน แม้ได้รหัสไป)
2. ที่ bucket → **Lifecycle Settings** → Custom: ซ่อนไฟล์หลังอัปโหลด **30** วัน ลบหลังซ่อน **1** วัน
3. จดค่า **Endpoint** ของ bucket (เช่น `s3.us-west-004.backblazeb2.com`) ส่วนกลาง `us-west-004` คือ region
4. **Application Keys** → **Add a New Application Key**
   - Name: `drivego-offsite`
   - Allow access to Bucket: เลือก bucket ข้อ 1 เท่านั้น
   - Type of Access: **Write Only**
   - คัดลอก **keyID** และ **applicationKey** (แสดงครั้งเดียว) ไปใส่ข้อ 3 ทันที ห้ามส่งในแชต

**Google Cloud Storage** (ถ้าเลือกแทน)
1. Cloud Storage → **Create bucket**: Location แบบ Region ที่ไม่ใช่สิงคโปร์ (เช่น asia-east1), Access control **Uniform**, Public access **Prevent**
   - Data protection: **Retention policy 30 days**
   - Lifecycle: Delete object เมื่ออายุ **31** วัน
2. IAM → Service Accounts → สร้าง `drivego-offsite` → ให้สิทธิ์ **Storage Object Creator** เฉพาะ bucket นี้
3. Cloud Storage → Settings → **Interoperability** → Create a key for a service account → เลือก `drivego-offsite`
   - ได้ Access key และ Secret ใช้แทน keyID / applicationKey ในข้อ 3
   - Endpoint `https://storage.googleapis.com` · region `auto`

### 3. เพิ่ม job ใน DigitalOcean

1. แอป **drivego-test** → **Settings** → **App Spec** → **Edit**
   - ใต้ `jobs:` วางส่วน `- name: offsite …` จาก `.do/app.yaml` ใน branch deploy/test (ตั้งแต่ `- name: offsite` ถึงก่อน `- name: watch`) → **Save**
2. ส่วนประกอบ **offsite** → **Environment Variables** → Edit → Add ทีละค่า (Run time):

| Key | ค่า | Encrypt |
|---|---|---|
| `MIGRATE_DATABASE_URL` | ข้อความเชื่อมต่อของ doadmin (เหมือนของ nightly) | ✔ |
| `BACKUP_PUBLIC_KEY` | กุญแจสาธารณะจากข้อ 1 | |
| `BACKUP_S3_ENDPOINT` | `https://` + Endpoint จากข้อ 2 (B2) หรือ `https://storage.googleapis.com` | |
| `BACKUP_S3_REGION` | เช่น `us-west-004` (B2) หรือ `auto` (Google) | |
| `BACKUP_S3_BUCKET` | ชื่อ bucket | |
| `BACKUP_S3_KEY_ID` | keyID / Access key | ✔ |
| `BACKUP_S3_SECRET` | applicationKey / Secret | ✔ |

3. **Save** แล้วรอ deploy เสร็จ

### 4. ตรวจคืนแรก

- เช้าวันถัดไป: แอป → **Activity** หรือส่วนประกอบ **offsite** → **Runtime Logs** ของรอบ 02:47
  - ต้องมี `copy made: …` และ `uploaded: <bucket>/drivego/<วันที่>.dgbk`
  - ส่ง 2 บรรทัดนี้ให้ Claude ได้ (ไม่มีรหัส)
- ที่ bucket ต้องเห็นไฟล์ `drivego/…dgbk`
- ถ้าไม่ได้ตั้งค่าหรือตั้งไม่ครบ job จบด้วย `STAFF ACTION NEEDED: the off-site copy is not set up …` และ DigitalOcean ส่งอีเมลแจ้งเตือนทุกคืน

## ตรวจทุกเดือน: สำเนาเปิดได้จริง (10 นาที)

1. ดาวน์โหลดไฟล์ `.dgbk` ล่าสุดจาก bucket มาที่คอมพิวเตอร์ของเจ้าของโปรเจกต์
   (B2: Browse Files → ไฟล์ → Download; ถ้ากุญแจของ job เขียนได้อย่างเดียว ให้เข้าเว็บของผู้ให้บริการด้วยบัญชีเจ้าของ)
2. รัน:
   ```bash
   node tools/backup-restore.mjs --file <ไฟล์.dgbk> --key <ที่เก็บ>/drivego-backup-private.pem --check
   ```
   ใส่รหัสผ่านของกุญแจ ต้องจบด้วย **"เปิดได้ครบทั้งไฟล์"** และจำนวน `shops` / `records` ใกล้เคียงกับที่คาด
3. ลบไฟล์ที่ดาวน์โหลดมาออกจากเครื่อง (มีข้อมูลทุกร้าน)

## เมื่อต้องกู้จริง (บัญชี DigitalOcean ใช้ไม่ได้ทั้งบัญชี)

1. สร้าง PostgreSQL 16 ใหม่ (DigitalOcean บัญชีใหม่ หรือที่อื่น) และ user `drivego_app`, `drivego_staff` ตาม [DIGITALOCEAN-SETUP.md](DIGITALOCEAN-SETUP.md) ส่วนที่ 2–4
2. ดาวน์โหลดสำเนาล่าสุด แล้วรันบนเครื่องที่ต่อฐานข้อมูลใหม่ได้ (เช่น Console ของแอปใหม่ หรือคอมพิวเตอร์ที่อยู่ใน Trusted sources):
   ```bash
   node tools/backup-restore.mjs --file <ไฟล์.dgbk> --key drivego-backup-private.pem
   ```
   - วางข้อความเชื่อมต่อของ doadmin ของฐานข้อมูลใหม่เมื่อถูกถาม (ไม่แสดงบนจอ)
   - เครื่องมือสร้างโครงสร้างก่อน แล้วใส่ข้อมูลทั้งหมดในครั้งเดียว ฐานข้อมูลต้องว่าง (ยังไม่มีร้าน)
   - ใช้รุ่นของโปรแกรมเดียวกับวันที่ทำสำเนา ถ้าโครงสร้างต่างกัน เครื่องมือจะบอกและไม่กู้
3. ผลท้ายสุดเป็นจำนวนต่อร้านและลายนิ้วมือ แบบเดียวกับ `tools/restore-check.mjs`
4. ชี้แอปไปฐานข้อมูลใหม่ตาม RESTORE-DRILL.md "เมื่อเกิดเรื่องจริง" ข้อ 3–5 แล้วแจ้งอู่ว่าข้อมูลย้อนไปคืนก่อนหน้า และต้องเข้าระบบใหม่

## ซ้อมกู้ (ทำครั้งแรกหลังตั้งค่า แล้วปีละครั้ง, 15 นาที)

บนคอมพิวเตอร์ที่ลองระบบได้ตาม [TRY-LOCALLY.md](TRY-LOCALLY.md):

1. ดาวน์โหลดสำเนาล่าสุดจาก bucket
2. Console ของแอป (web) รัน `node tools/restore-check.mjs` แล้ววางข้อความเชื่อมต่อของ doadmin เก็บผลไว้ (ผล "server")
3. บนคอมพิวเตอร์:
   ```bash
   node tools/backup-restore.mjs --file <ไฟล์.dgbk> --key <ที่เก็บ>/drivego-backup-private.pem --temp
   ```
   - กู้ลง PostgreSQL ชั่วคราวในเครื่อง (แบบเดียวกับ `npm run dev`) แล้วลบทิ้งเมื่อเสร็จ ไม่แตะ server
   - ร้านที่ไม่มีใครบันทึกระหว่างคืนนั้นกับตอนรันข้อ 2 ต้องได้ตัวเลขและลายนิ้วมือ (คอลัมน์ท้าย) ตรงกับผล "server"
4. ส่งผลทั้งสองให้ Claude (ไม่มีรหัส ไม่มีข้อมูลลูกค้า) แล้วลบไฟล์ `.dgbk` ออกจากเครื่อง

## สำหรับนักพัฒนา

- โค้ด: `server/lib/offsite.ts`
  - ทำสำเนาเป็น snapshot เดียว (repeatable read) ในฐานะ doadmin ซึ่ง RLS ยังบังคับ จึงระบุร้านทีละร้าน
  - คอลัมน์ json เก็บเป็นข้อความเดิมทุกไบต์
  - ผนึกด้วย gzip → AES-256-GCM (กุญแจครั้งเดียว ห่อด้วย RSA-OAEP-SHA256)
  - อัปโหลดแบบ S3 PUT + AWS Signature V4
- เครื่องมือ: `tools/backup-offsite.mjs` (job), `tools/backup-restore.mjs`, `tools/backup-keys.mjs`
- ทดสอบ:
  - `tests/db/offsite.test.mjs`: ทำสำเนาในฐานะ owner ที่ไม่ใช่ superuser, กู้ลงฐานข้อมูลว่างได้ทุกแถวตรงทุกไบต์,
    ไฟล์ถูกแก้ ถูกตัด หรือกุญแจผิด กู้ไม่ได้, ลายเซ็นตรงตัวอย่างของ AWS
  - `tools/image-smoke.mjs`: job ใน image จริง ผ่าน TLS ไปยัง bucket จำลอง
