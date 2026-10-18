# เปรียบเทียบผู้ให้บริการ server และฐานข้อมูล

ข้อมูล ณ 2026-10-18 · ทำให้เจ้าของโปรเจกต์ใช้ตัดสินใจก่อนเริ่มเฟส 2 (ดู [PLAN.md](PLAN.md) และกลุ่ม D ใน [NOTES.md](NOTES.md))

**ข้อจำกัด:** ข้อมูลรวบรวมจากผลค้นหาบนเว็บ (ส่วนใหญ่จากหน้าทางการ) เครื่องมือเปิดหน้าเว็บโดยตรงไม่ได้
ตัวเลขราคาเป็นการประมาณจากราคาประกาศ **ต้องตรวจใน pricing calculator ของผู้ให้บริการก่อนตัดสินใจ**
อัตราแลกเปลี่ยนประมาณ 33.5 บาท/USD ราคายังไม่รวม VAT

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
