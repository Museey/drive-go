-- A password DriveGo's team issued (opening a shop, a website sign-up approved, a forgotten password: shop-open.ts) must
-- be replaced by its owner at the first sign-in (the owner's decision of 2026-11-20, docs/NOTES.md "บังคับตั้งรหัสผ่าน
-- ใหม่"): the sign-in answers mustChange and the shop's page asks for a new password (frontend/js/81-first-password.js).
-- A password set from the app (auth.ts storeSecrets) clears it.
alter table users add column must_change boolean not null default false;
