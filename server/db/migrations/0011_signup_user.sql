-- The owner's user name is chosen on the website's sign-up form (the owner's decision of 2026-11-24, docs/NOTES.md
-- "รหัสร้าน 6 หลักและชื่อผู้ใช้จากฟอร์มลงทะเบียน"); the shop's code is a six-digit number made when it opens
-- (shop-open.ts newShopCode). Requests sent before keep an empty one: staff type it when they approve.
alter table signups add column login_user text not null default '';
