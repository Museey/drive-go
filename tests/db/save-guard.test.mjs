// What a save may do to the shape of a shop's data, whole-data replacements and backup points (server/lib/save-guard.ts;
// security review 2026-11-23, docs/SECURITY-AUDIT-2026-11.md ก4). The route uses them (S477 through the API).
//
//   npm run test:db
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { startTempPostgres } from '../../tools/pg-temp.mjs';
import { migrate } from '../../server/db/migrate.ts';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { makeBackup } from '../../server/lib/storage.ts';
import { auditProblem, backupAllowed, backupNameOk, layoutComplete, layoutProblem, rowsProblem, sessionProblem, wholeProblem }
  from '../../server/lib/save-guard.ts';

let db, ownerPool, appPool, shopId, emp, n = 0;
const asApp = fn => withShop(appPool, shopId, '*', fn);
const owner = { pkg: 'biz', role: 'owner', ref: '', branch: '' };
const none = { upsert: [], remove: [], order: {} };

before(async () => {
  db = await startTempPostgres();
  await migrate(db.url);
  ownerPool = new pg.Pool({ connectionString: db.url });
  appPool = new pg.Pool({ connectionString: db.url.replace('//drivego@', '//drivego_app@') });
  ({ shopId } = await createShop(ownerPool, { code: `guard-${++n}`, pkg: 'biz', data: readFixture(new URL('../fixtures/biz-trial.json', import.meta.url)) }));
  // An employee with none of the data rights.
  const { rows } = await ownerPool.query("select key, data from records where shop_id = $1 and unit = 'DB.emp' order by pos", [shopId]);
  const plain = rows.find(r => !r.data?.perms?.doc?.backup && !r.data?.perms?.doc?.wipe);
  emp = { pkg: 'biz', role: 'emp', ref: plain.key, branch: '' };
});
after(async () => {
  await ownerPool?.end();
  await appPool?.end();
  await db?.stop();
});

describe('รูปแบบข้อมูลที่บันทึกได้', () => {
  test('layout ต้องถูกรูปแบบสำหรับทุกคน พนักงานเพิ่มหมวดได้แต่ลบหรือเปลี่ยนชนิดหมวดเดิมไม่ได้', async () => {
    const stored = JSON.parse((await ownerPool.query("select data::text as d from records where shop_id = $1 and unit = 'DB' and key = 'garage.v22'", [shopId])).rows[0].d);
    const check = (a, layout, whole) => asApp(c => layoutProblem(c, a, 'DB', '', 'garage.v22', layout, whole));
    assert.equal(await check(emp, undefined), null);
    // Not a layout at all, for anyone.
    assert.equal(await check(owner, '"D"'), 'DB: not a layout');
    assert.equal(await check(owner, 'not json'), 'DB: layout not JSON');
    assert.equal(await check(owner, '[["stock","M"]]'), 'DB.stock: kind M');
    assert.equal(await check(owner, '[["stock","L"],["stock","L"]]'), 'DB.stock: twice');
    assert.equal(await check(owner, '[["curEmp","D"]]'), 'DB.curEmp: kind D');
    // The employee: a field added is fine (the first credit note), one dropped or turned whole is not.
    assert.equal(await check(emp, JSON.stringify([...stored, ['creditNotes2026', 'D']])), null);
    assert.match(await check(emp, '[["emp","D"]]'), /: removed$/);
    const listToWhole = stored.map(([f, k]) => [f, f === 'stock' ? 'D' : k]);
    assert.equal(await check(emp, JSON.stringify(listToWhole)), 'DB.stock: kind changed');
    // The owner, and a whole-data replacement, may drop fields.
    assert.equal(await check(owner, '[["emp","D"]]'), null);
    assert.equal(await check(emp, '[["emp","D"]]', 'restore'), null);
  });

  test('แถวต้องอยู่ในหมวดของข้อมูลนั้น และหลังเปลี่ยน layout ทุกหมวดค่าเดี่ยวต้องมีค่าครบ', async () => {
    assert.equal(rowsProblem('DB', { ...none, upsert: [{ unit: 'DB.', key: '', data: '{}' }] }), 'DB.|: not a field of DB');
    assert.equal(rowsProblem('DB', { ...none, upsert: [{ unit: 'DB', key: 'garage.v22', data: '[]' }] }), 'DB|garage.v22: not a field of DB');
    assert.equal(rowsProblem('DB', { ...none, remove: [{ unit: 'FR.accounts', key: 'x' }] }), 'FR.accounts|x: not a field of DB');
    assert.equal(rowsProblem('DB', { ...none, upsert: [{ unit: 'DB.stock', key: 's1', data: '{}' }] }), null);
    // The stored data reads back; a layout naming a whole value with no row does not (checked inside a transaction).
    assert.equal(await asApp(c => layoutComplete(c, 'DB', '', 'garage.v22')), null);
    await assert.rejects(asApp(async c => {
      await c.query("update records set data = $1 where shop_id = app_shop() and unit = 'DB' and key = 'garage.v22'", [JSON.stringify([['nothing', 'D']])]);
      const p = await layoutComplete(c, 'DB', '', 'garage.v22');
      throw new Error(p ?? 'complete');
    }), /DB\.nothing: no single value/);
  });

  test('ค่าประจำเครื่องรับเฉพาะของหมวดนั้นและเป็น JSON', () => {
    assert.equal(sessionProblem('DB', undefined), null);
    assert.equal(sessionProblem('DB', { 'DB.curEmp': '""', 'DB.curBranch': '"main"' }), null);
    assert.equal(sessionProblem('DB', { 'DB.curBranch': '"main","emp":[]' }), 'session: DB.curBranch');
    assert.equal(sessionProblem('DB', { 'DB.perms': '1' }), 'session: DB.perms');
    assert.equal(sessionProblem('DB', { 'FR.session': '{}' }), 'session: FR.session');
    assert.equal(sessionProblem('FR', { 'FR.session': '{"accId":"","inspect":""}' }), null);
    assert.equal(sessionProblem('DB', ['x']), 'session: not an object');
  });
});

describe('แทนข้อมูลทั้งชุด จุดสำรอง และประวัติการใช้งาน', () => {
  test('ล้าง นำเข้า กู้คืน ตามสิทธิ์ของระบบเดิม ข้อมูลตัวอย่างเฉพาะเจ้าของ', async () => {
    const whole = (a, k) => asApp(c => wholeProblem(c, a, '', k));
    for (const k of ['wipe', 'import', 'restore', 'sample', 'demo36']) {
      assert.equal(await whole(owner, k), null, k);
      assert.equal(await whole(emp, k), `whole ${k}`, k);
    }
    assert.equal(await whole(owner, 'anything'), 'whole anything');
    assert.equal(await whole(emp, undefined), null);
    // The employee given "ล้างข้อมูลทั้งระบบ" and "สำรองและกู้คืนข้อมูลทั้งระบบ".
    await ownerPool.query(`update records set data = jsonb_set(jsonb_set(data::jsonb, '{perms,doc,wipe}', 'true', true), '{perms,doc,backup}', 'true', true)::json
      where shop_id = $1 and unit = 'DB.emp' and key = $2`, [shopId, emp.ref]);
    try {
      assert.equal(await whole(emp, 'wipe'), null);
      assert.equal(await whole(emp, 'restore'), null);
      assert.equal(await whole(emp, 'import'), 'whole import');
      assert.equal(await asApp(c => backupAllowed(c, emp, '', 'garage.v22.bak.before-restore', '2026-10-13')), 'make');
    } finally {
      await ownerPool.query(`update records set data = (data::jsonb #- '{perms,doc,wipe}' #- '{perms,doc,backup}')::json
        where shop_id = $1 and unit = 'DB.emp' and key = $2`, [shopId, emp.ref]);
    }
  });

  test('จุดสำรอง: ชื่อแบบที่หน้าจอสร้างเท่านั้น พนักงานสร้างได้เฉพาะจุดของวันนี้หรือเมื่อวานที่ยังไม่มี', async () => {
    for (const k of ['garage.v22.bak.2026-10-13', 'garage.v22.bak.before-restore', 'garage.v22.bak.before-saleflow',
      'garage.v22.bak.safety-2026-10-13T09-00-00-wipe', 'garage.v22.bak.safety-2026-10-13T09-00-00-demo36', 'garage.v22::B002.bak.2026-10-13'])
      assert.equal(backupNameOk(k), true, k);
    for (const k of ['garage.v22.bak.9999', 'garage.v22.bak.x', 'garage.v22.bak.2026-10-13.extra', 'dgb.v22.bak.2026-10-13'])
      assert.equal(backupNameOk(k), false, k);
    const may = (a, k) => asApp(c => backupAllowed(c, a, '', k, '2026-10-13'));
    assert.equal(await may(emp, 'garage.v22.bak.9999'), 'refuse');
    assert.equal(await may(emp, 'garage.v22.bak.2026-10-13'), 'make');
    assert.equal(await may(emp, 'garage.v22.bak.2026-10-12'), 'make');
    assert.equal(await may(emp, 'garage.v22.bak.2026-10-01'), 'skip');
    assert.equal(await may(emp, 'garage.v22.bak.before-restore'), 'skip');
    assert.equal(await may(owner, 'garage.v22.bak.before-restore'), 'make');
    // Once the day's point is there, the employee does not overwrite it; the owner may.
    await asApp(c => makeBackup(c, '', 'garage.v22.bak.2026-10-13'));
    assert.equal(await may(emp, 'garage.v22.bak.2026-10-13'), 'skip');
    assert.equal(await may(owner, 'garage.v22.bak.2026-10-13'), 'make');
  });

  test('ประวัติการใช้งานลบทีละมากได้เฉพาะการตัดให้เหลือ 3,000 รายการตามหน้าจอ', async () => {
    const audit = Number((await ownerPool.query("select count(*) as n from records where shop_id = $1 and unit = 'DB.audit'", [shopId])).rows[0].n);
    const removing = k => ({ ...none, remove: Array.from({ length: k }, (_, i) => ({ unit: 'DB.audit', key: `a${i}` })) });
    const check = (ch, whole) => asApp(c => auditProblem(c, '', ch, 20, whole));
    assert.equal(await check(removing(20)), null);
    assert.equal(await check(removing(Math.min(audit, 21))), audit >= 21 ? 'mass removal' : null);
    assert.equal(await check(removing(500), 'restore'), null);
    // A log of 4,001 entries trimmed to 3,000 (03.js logAudit): allowed.
    await ownerPool.query(`insert into records (shop_id, branch_id, unit, key, pos, data)
      select $1, '', 'DB.audit', 'fill' || g, 100000 + g, '{}'::json from generate_series(1, $2::int) g`, [shopId, 4001 - audit]);
    assert.equal(await check(removing(1001)), null);
    assert.equal(await check(removing(1002)), 'mass removal');
  });
});
