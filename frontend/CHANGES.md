# จุดที่แก้ใน frontend/ หลังแยกไฟล์จากระบบเดิม

`frontend/` สร้างจาก `legacy/DRIVEGO_TRIAL_v23.html` ด้วย `tools/split-legacy.mjs` (เฟส 1) ตั้งแต่เฟส 2 แก้ได้
แต่ทุกจุดต้องอยู่ในรายการนี้ พร้อมเหตุผลและข้อตัดสินที่อนุญาต และ `node tools/split-legacy.mjs --check`
จะล้มถ้ามีไฟล์ที่ต่างจากระบบเดิมแต่ไม่อยู่ในรายการ (ช่อง "ไฟล์")

| # | ไฟล์ | แก้อะไร | ทำไม |
|---|---|---|---|
| 1 | `frontend/js/00-server-storage.js` | ไฟล์ใหม่ สร้างจาก `server/client/storage.ts` ด้วย `tools/build-client.mjs` ห้ามแก้ตรง ๆ | `window.storage` ที่เก็บข้อมูลไว้บน server (เฟส 2 งาน T6, เอกสารออกแบบหัวข้อ 4.1) |
| 2 | `frontend/index.html` | โหลด `js/00-server-storage.js` ก่อน script อื่นทั้งหมด | ต้องมี `window.storage` ก่อน `STORE.init()` ทำงาน |
| 3 | `frontend/js/03.js` | `STORE.init`: เอา `false&&` ออก เพื่อเปิดโหมด `host` ที่ระบบเดิมเขียนไว้แล้ว | ให้ระบบเดิมเก็บข้อมูลผ่าน `window.storage` แทน IndexedDB, ข้อความในหน้าตั้งค่าเป็นของโหมด `host` (Q6) |
