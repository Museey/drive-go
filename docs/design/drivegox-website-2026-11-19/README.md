# เว็บ DriveGo X ตามแบบของทีม (2026-11-19)

เจ้าของโปรเจกต์ส่งมา 2026-11-19: ไฟล์ HTML ที่ทีมทำเลียนแบบ artifact "DriveGo ProX Landing Page"
(https://claude.ai/artifact/Y3eSDQfFeQc9F1tKjZiruf) พร้อมภาพเทียบ ทีมบอกว่าหน้าในแบบกับเว็บจริง (app.drivegox.com)
ไม่เหมือนกัน รวมทั้งภาพเคลื่อนไหว (animation) ที่ไม่ตามแบบ

- `index.html` `login.html` `testdrive.html` `privacy.html` `articles.html` `site.css` `site.js`: ไฟล์จาก zip ที่เจ้าของส่ง (ไม่ได้แก้)
  ภาพ `tour/*.webp` 58 ภาพใน zip เหมือน `server/site/tour/` ทุกไบต์ จึงไม่ได้เก็บซ้ำ (เปิดไฟล์ในโฟลเดอร์นี้ตรง ๆ ภาพ Test Drive จะไม่ขึ้น)
- `feedback-artifact-login.webp`: หน้าเข้าระบบในแบบ ("สำหรับสมาชิก · เข้าสู่ระบบ DriveGo" การ์ด 3 แพ็กเกจพร้อมไอคอน รายการความสามารถ
  ปุ่ม "เข้าสู่ระบบ BaziX →" และส่วน "คู่มือการใช้งานระบบ" ดาวน์โหลด PDF)
- `feedback-live-login.webp`: หน้าเข้าระบบบนเว็บจริงตอนนั้น (`/login`, server/site/login.html)

ตรวจแล้ว: ไม่มีการต่อเครือข่ายนอกจากฟอนต์ Google ไม่มี eval เป็นข้อมูลอ้างอิงของแบบเท่านั้น ไม่ได้เสิร์ฟจากระบบ
