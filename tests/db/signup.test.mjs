// Sign-ups from the website (0009_signups.sql, server/lib/signup.ts, mail.ts; the owner's request of 2026-11-20):
// the public form's role adds requests and reads none back; staff list, approve (the shop opens and the sign-in
// e-mail goes out) or turn down; e-mail through a stand-in of Resend's API.
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { signInBiz } from '../../server/lib/auth.ts';
import { CONSENT, addSignup, allowSignup, approveSignup, listSignups, rejectSignup, signInMail, SIGNUP_LIMIT } from '../../server/lib/signup.ts';

let db, ownerPool, appPool, staffPool, mailServer;
const sent = [];

before(async () => {
  db = await startTempPostgres();
  const c = new pg.Client({ connectionString: db.url });
  await c.connect();
  await c.query('create role drivego_staff login');
  await c.end();
  await migrate(db.url);
  ownerPool = new pg.Pool({ connectionString: db.url });
  appPool = new pg.Pool({ connectionString: db.url.replace('//drivego@', '//drivego_app@') });
  staffPool = new pg.Pool({ connectionString: db.url.replace('//drivego@', '//drivego_staff@') });
  // Resend's API, standing in: keeps what it got, refuses an address of fail.test.
  mailServer = createServer((req, res) => {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      const m = JSON.parse(raw);
      if (m.to[0].endsWith('@fail.test')) { res.statusCode = 422; res.end('{"message":"bad address"}'); return; }
      sent.push({ auth: req.headers.authorization, ...m });
      res.end('{"id":"x"}');
    });
  });
  await new Promise(r => mailServer.listen(0, '127.0.0.1', r));
  process.env.MAIL_API_URL = `http://127.0.0.1:${mailServer.address().port}/emails`;
});
after(async () => {
  delete process.env.RESEND_API_KEY; delete process.env.MAIL_API_URL;
  await ownerPool?.end(); await appPool?.end(); await staffPool?.end();
  mailServer?.close();
  await db?.stop();
});

const form = (more = {}) => ({ pkg: 'biz', name: 'อู่แดงการช่าง', owner: 'แดง ใจดี', tel: '081-234-5678', email: 'Daeng@Example.com',
  taxId: '', addr: '', zip: '', note: 'อยากรู้ต้นทุนรายบิล', user: 'Daeng', consent: true, lang: 'th', ...more });
const meta = { address: '203.0.113.9', agent: 'test' };
const refused = async (pool, sql) => assert.rejects(pool.query(sql), e => e.code === '42501', sql);

describe('คำขอลงทะเบียนจากหน้าเว็บ', () => {
  test('ฟอร์มสาธารณะเพิ่มคำขอได้ อ่าน แก้ หรือเพิ่มคำขอที่อนุมัติแล้วไม่ได้ และกรองข้อมูลที่ไม่ครบ', async () => {
    assert.deepEqual(await addSignup(appPool, form(), meta), { kept: true });
    const row = (await ownerPool.query('select * from signups')).rows[0];
    assert.equal(row.email, 'daeng@example.com');
    assert.equal(row.login_user, 'daeng');   // the owner's user name from the form, in small letters
    assert.equal(row.consent, CONSENT.th);
    assert.equal(row.status, 'new');
    // The app reads nothing back and cannot add a decided request.
    await refused(appPool, 'select * from signups');
    await refused(appPool, "update signups set status = 'approved'");
    await assert.rejects(appPool.query(`insert into signups (pkg, name, owner, tel, email, consent, status) values ('biz','a','b','081','a@b.co','x','approved')`),
      e => e.code === '42501');
    // What the form must have.
    for (const [more, message] of [[{ pkg: 'x' }, 'pkg'], [{ owner: ' ' }, 'name'], [{ tel: '12345' }, 'tel'], [{ email: 'no-at' }, 'email'], [{ user: '' }, 'user'], [{ user: 'แดง' }, 'user'], [{ user: 'd' }, 'user'], [{ consent: false }, 'consent']])
      await assert.rejects(addSignup(appPool, form(more), meta), e => e.status === 400 && e.message === message);
    // The field people do not see: a robot's request is not kept.
    assert.deepEqual(await addSignup(appPool, form({ trap: 'http://spam' }), meta), { kept: false });
    assert.equal((await ownerPool.query('select count(*)::int as n from signups')).rows[0].n, 1);
  });

  test('ส่งได้ไม่เกิน SIGNUP_LIMIT ครั้งต่อชั่วโมงต่อเครื่อง', () => {
    const now = Date.now();
    for (let i = 0; i < SIGNUP_LIMIT; i++) assert.equal(allowSignup('198.51.100.1', now + i), true);
    assert.equal(allowSignup('198.51.100.1', now + 10), false);
    assert.equal(allowSignup('198.51.100.2', now + 10), true);
    assert.equal(allowSignup('198.51.100.1', now + 3_600_001), true);
  });

  test('ทีมงานอนุมัติ: เปิดร้านทดลองใช้ ส่งอีเมลชื่อผู้ใช้และรหัสผ่าน แล้วเจ้าของร้านเข้าระบบได้', async () => {
    process.env.RESEND_API_KEY = 're_test';
    const { signups, mail } = await listSignups(staffPool);
    assert.equal(mail, true);
    const s = signups[0];
    assert.equal(s.user, 'daeng');
    // A code staff might still send is not used: the shop's code is a new six-digit number (owner 2026-11-24).
    const r = await approveSignup(staffPool, s.id, { code: 'daeng-garage', pkg: s.pkg, kind: 'trial', name: s.name, owner: s.owner, email: s.email, tel: s.tel }, 'web:test');
    assert.match(r.code, /^[1-9]\d{5}$/);
    assert.deepEqual([r.user, r.mailed, r.mailError], ['daeng', true, '']);
    const m = sent.at(-1);
    assert.equal(m.auth, 'Bearer re_test');
    assert.deepEqual(m.to, ['daeng@example.com']);
    assert.equal(m.subject, 'อู่แดงการช่าง พร้อมทดลองใช้ DriveGo X แล้ว');
    assert.ok(m.text.includes(`รหัสร้าน: ${r.code}\nชื่อผู้ใช้: daeng\nรหัสผ่านชั่วคราว: `));
    assert.ok(m.text.includes(`รหัสผ่านชั่วคราว: ${r.password}`));
    assert.match(m.text, /ที่การ์ด DriveGo BaziX/);
    const after = (await listSignups(staffPool)).signups.find(x => x.id === s.id);
    assert.deepEqual([after.status, after.shopCode, after.decidedBy, after.mailedAt !== null], ['approved', r.code, 'web:test', true]);
    // The owner signs in with what the e-mail says.
    const shop = (await ownerPool.query('select id from shops where code = $1', [r.code])).rows[0];
    assert.equal((await withShop(appPool, shop.id, '*', c => signInBiz(c, 'daeng', r.password))).ok, true);
    // Decided once.
    await assert.rejects(approveSignup(staffPool, s.id, { code: 'daeng-2', pkg: 'biz', kind: 'trial', name: 'x', owner: 'y' }, 'web:test'), e => e.status === 400);
  });

  test('อีเมลส่งไม่ได้: ร้านเปิดแล้ว ทีมงานได้รหัสผ่านไว้โทรแจ้ง และจดสาเหตุไว้', async () => {
    await addSignup(appPool, form({ name: 'อู่ดำ', email: 'dam@fail.test', lang: 'en' }), meta);
    const s = (await listSignups(staffPool)).signups.find(x => x.status === 'new');
    assert.equal(s.consent, CONSENT.en);
    const r = await approveSignup(staffPool, s.id, { code: 'dam-garage', pkg: 'prox', kind: 'trial', name: 'อู่ดำ', owner: s.owner, email: s.email }, 'web:test');
    assert.equal(r.mailed, false);
    assert.match(r.mailError, /422/);
    assert.ok(r.password.length >= 8);
    delete process.env.RESEND_API_KEY;
    await addSignup(appPool, form({ name: 'อู่เขียว' }), meta);
    const g = (await listSignups(staffPool)).signups.find(x => x.status === 'new');
    const n = await approveSignup(staffPool, g.id, { code: 'kheaw', pkg: 'biz', kind: 'trial', name: 'อู่เขียว', owner: g.owner }, 'web:test');
    assert.deepEqual([n.mailed, n.mailError], [false, 'not-configured']);
  });

  test('ทีมงานปฏิเสธคำขอพร้อมหมายเหตุ', async () => {
    await addSignup(appPool, form({ name: 'ทดสอบสแปม' }), meta);
    const s = (await listSignups(staffPool)).signups.find(x => x.status === 'new');
    await rejectSignup(staffPool, s.id, 'ข้อมูลไม่จริง', 'web:test');
    const r = (await listSignups(staffPool)).signups.find(x => x.id === s.id);
    assert.deepEqual([r.status, r.decisionNote], ['rejected', 'ข้อมูลไม่จริง']);
    await assert.rejects(rejectSignup(staffPool, s.id, '', 'web:test'), e => e.status === 400);
  });

  test('อีเมลภาษาอังกฤษสำหรับคำขอที่กรอกเป็นภาษาอังกฤษ', () => {
    const m = signInMail({ lang: 'en', to: 'a@b.co', owner: 'Dam', name: 'Dam Garage', pkg: 'franchise', code: 'dam', user: 'hq', password: 'Pw', end: '2027-01-18' });
    assert.equal(m.subject, 'Dam Garage is ready to try DriveGo X');
    assert.match(m.text, /until 18 Jan 2027\.\n\nLog in at https:\/\/app\.drivegox\.com\/login on the DriveGo-Franchise card:/);
    assert.match(signInMail({ lang: 'th', to: 'a@b.co', owner: 'ดำ', name: 'อู่ดำ', pkg: 'biz', code: 'dam', user: 'dam', password: 'Pw', end: '2027-01-18' }).text,
      /ใช้ได้ถึง 18 ม\.ค\. 2570/);
  });
});
