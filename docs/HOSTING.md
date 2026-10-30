# เปรียบเทียบผู้ให้บริการ server และฐานข้อมูล

ข้อมูล ณ 2026-10-18 (อัปเดต 2026-10-20) · ทำให้เจ้าของโปรเจกต์ใช้ตัดสินใจก่อนเริ่มเฟส 2 (ดู [PLAN.md](PLAN.md) และกลุ่ม D ใน [NOTES.md](NOTES.md))

**ข้อจำกัด:** ข้อมูลรวบรวมจากผลค้นหาบนเว็บ (ส่วนใหญ่จากหน้าทางการ) เครื่องมือเปิดหน้าเว็บโดยตรงไม่ได้
ตัวเลขราคาเป็นการประมาณจากราคาประกาศ **ต้องตรวจใน pricing calculator ของผู้ให้บริการก่อนตัดสินใจ**
อัตราแลกเปลี่ยนประมาณ 33.5 บาท/USD ราคายังไม่รวม VAT

## ข้อตัดสิน 2026-10-27: DigitalOcean สิงคโปร์

เจ้าของโปรเจกต์เลือก DigitalOcean (ถามว่าใช้ Droplet หรือไม่) แบบที่เสนอ (**ยืนยันแล้ว 2026-10-29**, ขั้นตอนสมัคร: [DIGITALOCEAN-SETUP.md](DIGITALOCEAN-SETUP.md)): **App Platform** รันแอป (ต่อ GitHub แล้ว deploy เองทุกครั้งที่ push,
HTTPS/โดเมน/รีสตาร์ต/log มีให้ รัน migration เป็น job ก่อน deploy) + **Managed PostgreSQL** (สำรองรายวัน กู้ย้อนเวลาได้ 7 วัน อัปเดตให้)
ทั้งสองอยู่ region สิงคโปร์ ไม่ใช้ Droplet เพราะเป็นเครื่องเปล่า: อัปเดตระบบปฏิบัติการ ใบรับรอง HTTPS การ deploy การรีสตาร์ต และถ้าวางฐานข้อมูลไว้ในเครื่องเดียวกัน
การสำรองและกู้คืนเป็นงานของเราทั้งหมด ราคาใกล้กัน (Droplet $6 กับ App Platform $5–12)
ต้องระวังตอนตั้ง: การฟังการบันทึกของงาน 3.10 (`server/lib/live.ts`, LISTEN/NOTIFY) ต้องต่อฐานข้อมูลตรง หรือผ่าน connection pool แบบ session
ไม่ใช่แบบ transaction, เครื่องแอปขนาด 512 MB อาจไม่พอสำหรับ Next.js เริ่มที่ 1 GB, การเชื่อมต่อค้างนาน (SSE) ทดสอบบน server จริง (LAUNCH-CHECKLIST ด่าน 1)
ไฟล์ deploy (2026-10-30): `Dockerfile` + `.do/app.yaml` (แอป 1 GB + งาน migrate ก่อน deploy + ฐานข้อมูล drivego-test-db ผ่าน user drivego_app)
ขั้นตอนสร้างแอป: DIGITALOCEAN-SETUP.md ส่วนที่ 3 รายละเอียดใน NOTES.md "ไฟล์ deploy ของ server ทดสอบ"
ขนาดฐานข้อมูลที่แนะนำ (2026-10-29, เจ้าของโปรเจกต์ถามหน้าราคา Managed Databases): PostgreSQL แบบ Basic 1 GB RAM / 1 vCPU / 10 GB ราว $15/เดือน
region สิงคโปร์ (SGP1) โหนดเดียวสำหรับ server ทดสอบ ใช้ได้ 22 การเชื่อมต่อ (25 ต่อ 1 GB หักสำรอง 3) แอปหนึ่งเครื่องใช้สูงสุด 11 (pool 10 + ฟังการบันทึก 1
`server/lib/db.ts`) จึงพอสำหรับแอปเครื่องเดียว ถ้าเพิ่มเป็น 2 เครื่องต้องลด pool หรือขยายฐานข้อมูล โหนดสำรอง (standby) คิดราคาเท่าโหนดหลัก
ตัดสินตอนอู่นำร่อง (ข้อ "ระบบหยุดได้นานเท่าไร" ใน LAUNCH-CHECKLIST) กู้ย้อนเวลาได้ 7 วัน ตัวเลขจากผลค้นหา (เปิดหน้า digitalocean.com จาก session ไม่ได้) ต้องดูหน้าราคาจริงอีกครั้งตอนสมัคร
server ทดสอบใช้ข้อมูลทดลองเท่านั้น ส่วนอู่นำร่องที่ใช้ข้อมูลจริงยังต้องรอคำตอบเรื่อง PDPA ว่าเก็บที่สิงคโปร์ได้

## อัปเดต 2026-10-27: Cloudflare (เจ้าของโปรเจกต์ถาม)

**ไม่เหมาะเป็นที่รันระบบหลัก แต่ใช้คู่กับเจ้าอื่นได้ดี**
- ไม่มี PostgreSQL ของตัวเอง: D1 เป็น SQLite, Hyperdrive เป็นแค่ตัวต่อไปหาฐานข้อมูลที่อยู่ที่อื่น (มีพาร์ตเนอร์ PlanetScale) จึงยังต้องเช่าฐานข้อมูลอีกเจ้า
- Workers เป็น serverless: หน่วยความจำ 128 MB ต่อ isolate, โมดูล native (argon2 ที่ใช้ hash รหัสผ่าน) รันไม่ได้, Next.js ต้องผ่าน OpenNext (ยังก่อน 1.0)
  และไม่มีโปรแกรมที่รันค้าง จึงฟังการบันทึกจากฐานข้อมูล (LISTEN/NOTIFY) และส่งต่อแบบงาน 3.10 ไม่ได้ ต้องเขียนใหม่ด้วย Durable Objects
- Containers (GA เม.ย. 2026) รัน container ของเราได้ แต่คิดเงินตามเวลาที่ทำงาน server ที่ถือการเชื่อมต่อค้างไว้ทั้งวันจึงทำงานตลอด
  บทวิเคราะห์ภายนอก (ใช้ราคาช่วง beta) ประเมินว่าแพงกว่า host ที่คิดรายเดือนหลายเท่าสำหรับงานที่รันตลอด
- ส่วนที่คุ้ม: DNS + HTTPS + กันการโจมตีหน้าเว็บ (แพ็กเกจฟรี รับคำขอได้ถึง 100 MB) วางหน้า server เจ้าไหนก็ได้
  (ระบบส่ง ping ทุก 3 วินาที การเชื่อมต่อค้างนานจึงไม่เงียบ ต้องทดสอบ) และ R2 เก็บไฟล์แนบโดยไม่คิดค่าส่งข้อมูลออก เมื่อย้ายไฟล์ออกจากฐานข้อมูล

แหล่งข้อมูล: https://developers.cloudflare.com/changelog/2026-04-13-containers-sandbox-ga , https://developers.cloudflare.com/workers/platform/limits/index.md ,
https://opennext.js.org/cloudflare , https://developers.cloudflare.com/workers/learning/integrations/databases/ ,
https://sliplane.io/blog/cloudflare-released-containers-everything-you-need-to-know

## อัปเดต 2026-10-27: Railway (เจ้าของโปรเจกต์ถาม)

- **ที่ตั้ง**: มี region สิงคโปร์ (`asia-southeast1-eqsg3a`) สถานะเรื่อง PDPA เท่ากับ DigitalOcean และ Render
- **ราคาแบบจ่ายตามที่ใช้จริงรายวินาที**: RAM $10/GB/เดือน, CPU $20/vCPU/เดือน, พื้นที่ดิสก์ $0.15/GB/เดือน, ส่งข้อมูลออก $0.05/GB
  แพ็กเกจ Hobby $5 (รวมค่าใช้งาน $5) / Pro $20 (รวมค่าใช้งาน $20) ตั้งเพดานค่าใช้จ่ายได้ (ถึงเพดานแล้วระบบหยุด)
  server ทดสอบที่คนใช้น้อยน่าจะราว $10–20/เดือน (350–700 บาท) ถูกที่สุดในกลุ่ม ช่วงเริ่มเปิดขายน่าจะใกล้ DigitalOcean (ประมาณคร่าว ๆ)
- **PostgreSQL**: เป็น PostgreSQL ตัวมาตรฐานที่รันในโปรเจกต์ของเรา มีสำรองแบบ snapshot และกู้ย้อนเวลา (PITR ด้วย pgBackRest) มีแบบ HA
  แต่ไม่ได้ "ดูแลให้ทั้งหมด" เท่า DigitalOcean หรือ Cloud SQL (อัปเกรดรุ่นหลัก ดูแลประสิทธิภาพ เป็นงานของเรา)
  น่าจะได้ user หลักของฐานข้อมูลจึงสร้าง role ได้ (ยังไม่พบเอกสารยืนยัน ต้องลองบน server ทดสอบ)
- **การเชื่อมต่อค้างนาน**: container รันตลอด แต่คำขอหนึ่งครั้งยาวได้ไม่เกิน 15 นาที (มีรายงานว่าบางครั้ง 5 นาที) และตัดการเชื่อมต่อที่เงียบเกิน 60 วินาที
  ระบบเราส่ง ping ทุก 3 วินาที และเบราว์เซอร์ต่อใหม่เองพร้อมรับสิ่งที่พลาด (งาน 3.10) จึงน่าจะใช้ได้ ต้องทดสอบบน server ทดสอบ
- **ที่เก็บไฟล์**: มี bucket แบบ S3 ในตัว

แหล่งข้อมูล: https://docs.railway.com/pricing/plans.md , https://railway.com/pricing , https://docs.railway.com/deployments/regions ,
https://docs.railway.com/guides/postgres-backups-restores , https://docs.railway.com/volumes/point-in-time-recovery , https://docs.railway.com/pricing/cost-control ,
https://station.railway.com/questions/can-the-900-second-http-request-timeout-ff86a21d ,
https://station.railway.com/questions/edge-kills-requests-with-no-response-byt-c65210de

## อัปเดต 2026-10-20: สิ่งที่ระบบต้องการจริงหลังเฟส 2 และ server ทดสอบ (T12)

**สิ่งที่ระบบใหม่ต้องการ** (รู้แน่แล้วจากงานเฟส 2):
- server ที่ทำงานตลอด รัน Node.js 22 (Next.js) ใน container ได้ มีโมดูล native สำหรับ hash รหัสผ่าน (argon2) ซึ่งใช้ได้บน Linux ปกติ
- PostgreSQL 16 ที่ผู้ดูแลฐานข้อมูล **สร้าง role ใหม่ได้** (ระบบใช้ 2 role: เจ้าของตารางกับ role ของแอปที่ถูก Row-Level Security บังคับ) และสร้างฟังก์ชัน `security definer` ได้
- การเชื่อมต่อค้างนาน (SSE) สำหรับให้ทุกเครื่องเห็นการเปลี่ยนแปลงทันที (เฟส 3) และที่เก็บไฟล์แนบแบบ S3 (เฟส 3)
- HTTPS, backup อัตโนมัติ และกู้คืนย้อนเวลาได้ (PITR) ตั้งแต่อู่นำร่อง

**server ทดสอบ (T12)** ใช้เครื่องเล็กที่สุดที่รันได้ ไม่ต้องมีเครื่องสำรอง (ราคาประมาณ ต้องตรวจในหน้าราคาก่อน):

| ตัวเลือก | ประกอบด้วย | USD/เดือน | บาท/เดือน (ประมาณ) |
|---|---|---|---|
| Google Cloud กรุงเทพฯ | Cloud Run (หยุดเองเมื่อไม่มีคนใช้) + Cloud SQL แบบ shared core | 15–30 | 500–1,000 |
| DigitalOcean สิงคโปร์ | App Platform $5–12 + Managed PostgreSQL 1 GB $15 | 20–27 | 700–900 |
| Render สิงคโปร์ | Web service Standard $25 (Starter $7 มี RAM 512 MB น่าจะไม่พอ) + Postgres Basic-1GB ราว $19–20 | 27–45 | 900–1,500 |
| AWS กรุงเทพฯ | Fargate + RDS db.t4g.micro + load balancer (ราว $18 ค่าเดียว) | 50–60 | 1,700–2,000 |

**ข้อค้นพบใหม่**
- Google Cloud กรุงเทพฯ (asia-southeast3 เปิดเดือน ม.ค. 2026) มีทั้ง Cloud Run และ Cloud SQL for PostgreSQL แล้ว ยังไม่ได้ราคาเฉพาะกรุงเทพฯ (ต้องดูใน calculator)
  เครื่องทำงานของ Claude มีโปรแกรม `gcloud` ติดตั้งไว้แล้ว จึง deploy ได้ทันทีเมื่อได้สิทธิ์
- Render: ยังหาเอกสารทางการเรื่อง **การสร้าง role ในฐานข้อมูล** และ **การเชื่อมต่อ SSE ค้างนาน** ไม่ได้ (ในฟอรัมมีรายงานว่า SSE ถูกตัดหลัง 60 วินาที ทีมงาน Render ตอบว่าไม่ควรเกิด)
  ถ้าเลือก Render ต้องทดสอบสองเรื่องนี้เป็นอย่างแรกบน server ทดสอบ ถ้าไม่ผ่านต้องปรับระบบหรือเปลี่ยนเจ้า
- Render และ Google Cloud deploy เองจาก GitHub ได้ทุกครั้งที่ push (Render ใช้ไฟล์ `render.yaml` ใน repo) เจ้าของจึงไม่ต้องให้รหัสหรือ token กับ Claude ถ้าใช้วิธีนี้
- AWS ยังเป็นตัวเลือกที่ตั้งค่ามากที่สุด และ server ทดสอบแพงที่สุดเพราะต้องมี load balancer

**คำแนะนำ (ปรับ 2026-10-20):** เลือกเจ้าเดียวกันทั้ง server ทดสอบและของจริง เพื่อให้ server ทดสอบเป็นการซ้อมขึ้นระบบจริงไปในตัว
เรื่องที่ชี้ขาดคือข้อมูลต้องอยู่ในไทยหรือไม่
- ต้องอยู่ในไทย หรือยังไม่แน่ใจ → **Google Cloud กรุงเทพฯ** (อันดับ 1 เหมือนเดิม)
- อยู่สิงคโปร์ได้ และอยากใช้เจ้าที่คุ้นเคย → **Render สิงคโปร์** หลังทดสอบ role และ SSE ผ่าน (ไฟล์แนบใช้ Cloudflare R2)
- อยู่สิงคโปร์ได้ และต้องการประหยัดที่สุด → **DigitalOcean สิงคโปร์**

แหล่งข้อมูลเพิ่ม: https://cloud.google.com/run/pricing , https://docs.cloud.google.com/sql/docs/postgres/region-availability-overview ,
https://en.wikipedia.org/wiki/Google_data_centers , https://docs.digitalocean.com/products/app-platform/details/pricing/index.html.md ,
https://kuberns.com/blogs/digitalocean-pricing/ , https://www.budgetforge.dev/tools/render-pricing-2026 , https://kuberns.com/blogs/render-postgres-pricing-setup-limits/ ,
https://community.render.com/t/server-sent-events-connection-closes-after-one-minute/4597 , https://aws.amazon.com/blogs/aws/announcing-the-new-aws-asia-pacific-thailand-region/

---

ข้อมูลด้านล่างคือการเปรียบเทียบเดิม (2026-10-18) สำหรับระบบจริงในช่วงเริ่มและปีที่ 5 ยังใช้ได้

## สมมติฐานขนาดระบบ
- **ช่วงเริ่ม:** API 1 ตัว (2 vCPU / 4 GB), PostgreSQL 2 vCPU / 4–8 GB โซนเดียว มี backup และกู้คืนย้อนเวลาได้ (PITR), ฐานข้อมูล 50 GB, ไฟล์แนบ 200 GB, ส่งข้อมูลออกราว 200 GB/เดือน
- **ปีที่ 5:** API 3 ตัวหลัง load balancer, PostgreSQL 4 vCPU / 16 GB แบบมีเครื่องสำรอง (HA) + read replica 1 ตัว, Redis ขนาดเล็ก, ฐานข้อมูล 300 GB, ไฟล์แนบราว 3 TB, ส่งข้อมูลออกราว 1.5 TB/เดือน
- **คลิปวิดีโอคือตัวแปรที่ทำให้ค่าใช้จ่ายแกว่งมากที่สุด**

## ตารางเปรียบเทียบ

| ตัวเลือก | ที่ตั้ง | PostgreSQL แบบ managed | container ทำงานตลอด + SSE/WebSocket | ความง่าย | USD/เดือน ช่วงเริ่ม → ปีที่ 5 |
|---|---|---|---|---|---|
| **Google Cloud กรุงเทพฯ** (Cloud Run + Cloud SQL + Cloud Storage) | asia-southeast3 (กรุงเทพฯ) | Cloud SQL มี backup อัตโนมัติ + PITR | Cloud Run ตั้ง min instances ได้ รองรับ WS/SSE แต่ตัดการเชื่อมต่อทุก ≤ 60 นาที (ต้องต่อใหม่) | สูง | 200–350 → 1,300–2,000 |
| **AWS กรุงเทพฯ** (ECS Fargate + RDS + S3) | ap-southeast-7 (กรุงเทพฯ) | RDS PostgreSQL (Multi-AZ แบบ cluster ยังไม่มีในไทย) | ECS + load balancer ไม่มีเพดาน 60 นาที | กลาง (ต้องตั้งค่า VPC, load balancer, IAM) | 200–350 → 1,300–2,000 |
| Azure | ยังไม่มี region ไทยที่เปิดทั่วไป ต้องใช้สิงคโปร์ | Flexible Server | Container Apps | กลาง | ใกล้เคียง AWS/GCP |
| **DigitalOcean สิงคโปร์** | สิงคโปร์ (ราว 30 ms จากกรุงเทพฯ) ข้อมูลอยู่นอกประเทศ | มี PITR, HA ต้องเพิ่มเครื่องสำรองราคาเท่าเครื่องหลัก | App Platform หรือ Droplet | สูงมาก | 90–180 → 900–1,300 |
| Render / Railway / Fly.io | Render มีสิงคโปร์ เจ้าอื่นยังยืนยันไม่ได้ | มี backup/PITR ตามแพ็กเกจ | ได้ | สูง | 130–250 → 800–1,500 (ยังไม่ยืนยัน) |
| Vercel + Neon/Supabase | สิงคโปร์ | มี | **ไม่เหมาะ:** เป็น serverless การเชื่อมต่อถูกตัดเมื่อ function ครบเวลา | สูง แต่ไม่ตรงสถาปัตยกรรม | 70–200 + ค่า realtime แยก |
| Cloud ไทย (NIPA, INET, True IDC, NT) | ในประเทศ | ไม่พบ managed PostgreSQL ที่ยืนยันได้ ต้องดูแล PostgreSQL เอง | VM | ต่ำ | ต้องขอใบเสนอราคา |

| ค่าใช้จ่ายเป็นเงินบาท | ช่วงเริ่ม | ปีที่ 5 |
|---|---|---|
| Google Cloud หรือ AWS กรุงเทพฯ | ราว 7,000–12,000 บาท/เดือน | ราว 44,000–67,000 บาท/เดือน |
| DigitalOcean สิงคโปร์ | ราว 3,000–6,000 บาท/เดือน | ราว 30,000–44,000 บาท/เดือน |

ผูกสัญญา 1–3 ปีลดค่าฐานข้อมูลได้มาก (ตัวอย่าง RDS db.t4g.medium ในไทย $66 → $48 สัญญา 1 ปี → $35 สัญญา 3 ปี)
ความเสี่ยงติดผู้ให้บริการ (lock-in) ต่ำทุกเจ้า ถ้าใช้ PostgreSQL มาตรฐาน, Docker image และ S3 API

## คำแนะนำ

**อันดับ 1: Google Cloud กรุงเทพฯ** (Cloud Run ตั้ง min instances ≥ 1 + Cloud SQL for PostgreSQL + Cloud Storage)
- ข้อมูลอยู่ในไทย ลดเรื่องส่งข้อมูลข้ามแดนตาม PDPA (backup ต้องอยู่ region เดียวกันด้วย)
- ในกลุ่มผู้ให้บริการรายใหญ่ Cloud Run ง่ายที่สุด ส่ง container ขึ้นได้เลย มี HTTPS ให้ ไม่ต้องดูแล cluster เหมาะกับทีมเล็ก
- ข้อควรระวัง: การเชื่อมต่อ SSE/WebSocket ถูกตัดทุก ≤ 60 นาที (เบราว์เซอร์ต่อใหม่เองได้), หลาย instance ต้องกระจาย event ผ่าน Redis หรือ PostgreSQL LISTEN/NOTIFY,
  region เพิ่งเปิด ควรลองสร้าง Cloud SQL ขนาดที่ต้องการและแบบ HA ในกรุงเทพฯ ก่อน, ยังไม่ได้ยืนยันว่า Cloud Storage มีในกรุงเทพฯ

**อันดับ 2: AWS กรุงเทพฯ** (ECS Fargate + RDS for PostgreSQL + S3)
- region ไทยเปิดมานานกว่า มีผู้รับจ้างที่ชำนาญ AWS ในไทยมาก ไม่มีเพดาน 60 นาทีของ WebSocket
- ตั้งค่ามากกว่า และบริการแบบง่าย (App Runner, Lightsail) ใช้ในไทยไม่ได้

**ทางเลือกประหยัด: DigitalOcean สิงคโปร์** ถูกกว่าราวครึ่งและดูแลง่ายที่สุด ใช้ได้ถ้าตัดสินว่าข้อมูลอยู่นอกไทยได้ แต่ต้องทำตามกติกาส่งข้อมูลข้ามแดนของ PDPA

**Render (สิงคโปร์) ใช้ได้กับงานขนาดนี้** (เพิ่ม 2026-10-18 หลังเจ้าของบอกว่าเคยใช้ Render กับงานที่คล้ายกัน)
- ขนาดไม่ใช่ปัญหา: web service หลาย instance + PostgreSQL แบบ managed + Redis + background worker + cron ตรงกับสถาปัตยกรรมที่วางไว้
- ทีมเคยใช้แล้ว ซึ่งสำคัญมากสำหรับทีมเล็ก
- ข้อจำกัดเหมือน DigitalOcean: ไม่มี region ในไทย ข้อมูลอยู่สิงคโปร์ จึงขึ้นกับคำตอบเรื่อง PDPA
- Render ไม่มี object storage แบบ S3 ต้องใช้ของเจ้าอื่นคู่กัน (เช่น Cloudflare R2 ซึ่งไม่คิดค่าส่งข้อมูลออก เหมาะกับคลิปวิดีโอ)
- ราคาในปีที่ 5 ยังไม่ได้ยืนยัน ต้องตรวจราคา Postgres ขนาดใหญ่ แบบ HA และค่าส่งข้อมูลออกในหน้าราคาของ Render

**ไม่แนะนำ:** Azure (ยังไม่มี region ไทย), Vercel (ไม่ใช่ server ที่ทำงานตลอด), Cloud ไทยที่ไม่มี managed PostgreSQL (ภาระดูแลสูงเกินทีมเล็ก)

## PDPA: ยังไม่ชัด ควรถามนักกฎหมาย
- ไม่พบข้อกำหนดทั่วไปที่บังคับให้ข้อมูลอยู่ในไทย PDPA ใช้กติกา "ส่งข้อมูลข้ามแดน" (มาตรา 28/29 ประกาศมีผล 24 มี.ค. 2024):
  ปลายทางต้องมีมาตรฐานคุ้มครองเพียงพอ หรือมีมาตรการคุ้มครอง (สัญญามาตรฐาน, BCR) หรือได้รับความยินยอมจากเจ้าของข้อมูล
- ไม่พบรายชื่อประเทศที่ สคส. รับรอง (รวมถึงสิงคโปร์) — ยังไม่ยืนยัน
- ลูกค้าองค์กรหรือ HQ แฟรนไชส์อาจกำหนดในสัญญาให้ข้อมูลอยู่ในไทย

## สิ่งที่เจ้าของโปรเจกต์ต้องตัดสิน
1. ข้อมูลต้องอยู่ในไทยหรือไม่ — ชี้ขาดระหว่าง Google Cloud/AWS กรุงเทพฯ กับ DigitalOcean สิงคโปร์
2. งบประมาณต่อเดือน และยอมผูกสัญญา 1–3 ปีหรือไม่
3. ต้องมีฐานข้อมูลสำรอง (HA) ตั้งแต่วันแรกหรือไม่ (ค่าฐานข้อมูลเพิ่มราวเท่าตัว) ระบบหยุดได้นานเท่าไร และยอมให้ข้อมูลหายได้กี่นาที
4. นโยบายคลิปวิดีโอ (ขนาดและระยะเวลาเก็บ) ซึ่งกำหนดค่า storage และค่าส่งข้อมูล
5. ใครดูแลระบบและรับเวรแก้ปัญหา, จ่ายเงินเป็นบาทหรือ USD และต้องการเอกสารภาษีแบบไหนจากผู้ให้บริการ

## แหล่งอ้างอิง
- Google Cloud: https://cloud.google.com/blog/products/infrastructure/google-cloud-launches-new-region-in-bangkok-thailand ,
  https://docs.cloud.google.com/run/docs/locations , https://docs.cloud.google.com/run/docs/triggering/websockets , https://cloud.google.com/sql/pricing
- AWS: https://www.rcrwireless.com/20250110/featured/aws-region-thailand , https://dev.classmethod.jp/articles/aws-Thailand-region-ap-southeast-7-th/ ,
  https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RDS_Fea_Regions_DB-eng.Feature.MultiAZDBClusters.html ,
  https://www.bytebase.com/dbcost/rds/instance/db.t4g.medium/ , https://encore.dev/articles/end-of-app-runner ,
  https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.md
- Azure: https://www.beyondcloudwithchriz.com/post/new-planned-datacenter-region-in-thailand-thailand-south-enters-private-preview-on-azure
- DigitalOcean: https://docs.digitalocean.com/products/databases/postgresql/details/pricing/ , https://docs.digitalocean.com/products/app-platform/details/pricing/
- Render / Railway / Fly.io: https://render.com/docs/outbound-bandwidth , https://docs.railway.com/volumes/point-in-time-recovery , https://fly.io/docs/mpg/overview
- Vercel / Neon / Supabase: https://vercel.com/support/articles/do-vercel-serverless-functions-support-websocket-connections , https://neon.com/docs/introduction/regions , https://supabase.com/pricing
- Cloud ไทย: https://nipa.cloud/pricing/nipa-space/database-instance
- PDPA: https://www.tilleke.com/insights/thailand-unveils-regulations-for-cross-border-personal-data-transfer/2/ ,
  https://www.lawplusltd.com/2024/02/pdpc-rules-on-personal-data-cross-border-transfer-from-thailand-to-recipient-without-adequate-personal-data-protection-standards/
