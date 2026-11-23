// Opens an off-site copy (tools/backup-offsite.mjs; docs/OFFSITE-BACKUP.md) with the owner's private key:
//
//   node tools/backup-restore.mjs --file COPY.dgbk --key drivego-backup-private.pem --check
//       reads the whole copy without a database: when it was made, its schema, rows per table (a monthly check that
//       the copies open, and that the key and its passphrase are still at hand)
//   node tools/backup-restore.mjs --file COPY.dgbk --key drivego-backup-private.pem
//       puts it into an EMPTY database (a new DigitalOcean cluster, or a local one): the schema is made first
//       (migrate, of this version: use the image/commit of the copy's time when the schema changed since), then
//       every row in one transaction, then prints the same summary as tools/restore-check.mjs
//   node tools/backup-restore.mjs --file COPY.dgbk --key drivego-backup-private.pem --temp
//       the same into a PostgreSQL of its own on this computer (tools/pg-temp.mjs, as npm run dev), removed at the
//       end: the drill, whose summary is compared with restore-check of the server
//
// The database: MIGRATE_DATABASE_URL, --db URL, or pasted when asked (not shown). The key's passphrase is asked.
// Garages sign in again afterwards (sessions are not in the copy).
import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { pgConfig } from '../server/lib/pg-config.ts';
import { migrate } from '../server/db/migrate.ts';
import { openCopy, restore } from '../server/lib/offsite.ts';
import { fingerprint } from '../server/lib/fingerprint.ts';
import { askHidden } from './ask-hidden.mjs';

const { values: o } = parseArgs({ options: { file: { type: 'string' }, key: { type: 'string' }, db: { type: 'string' }, check: { type: 'boolean' }, temp: { type: 'boolean' } } });
if (!o.file || !o.key) { console.error('usage: node tools/backup-restore.mjs --file COPY.dgbk --key PRIVATE.pem [--check | --temp | --db URL]'); process.exit(2); }
const pem = readFileSync(o.key, 'utf8');
const passphrase = pem.includes('ENCRYPTED') ? await askHidden('รหัสผ่านของกุญแจ (จะไม่แสดงบนจอ): ') : undefined;

if (o.check) {
  const per = new Map();
  let head = null;
  try {
    for await (const line of openCopy(o.file, pem, passphrase)) {
      if (!head) { head = JSON.parse(line.slice(line.indexOf(' ') + 1)); continue; }
      const t = line.slice(0, line.indexOf('\t'));
      per.set(t, (per.get(t) ?? 0) + 1);
    }
  } catch (e) {
    console.error(`เปิดสำเนาไม่ได้: ${e.message} (กุญแจหรือรหัสผ่านผิด หรือไฟล์ไม่ครบ/ถูกแก้)`);
    process.exit(1);
  }
  console.log(`สำเนาทำเมื่อ ${new Date(head.at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })} · โครงสร้างล่าสุด ${head.migrations.at(-1)}`);
  for (const t of head.tables) console.log(`  ${t.padEnd(16)} ${per.get(t) ?? 0}`);
  console.log('เปิดได้ครบทั้งไฟล์ (ตรวจลายเซ็นของไฟล์แล้ว)');
  process.exit(0);
}

// --temp: into a PostgreSQL of its own, thrown away at the end (the yearly drill on the owner's computer).
const temp = o.temp ? await (await import('./pg-temp.mjs')).startTempPostgres() : null;
const url = temp?.url || o.db || process.env.MIGRATE_DATABASE_URL || await askHidden('ข้อความเชื่อมต่อของฐานข้อมูลเปล่าที่จะกู้ลง (จะไม่แสดงบนจอ): ');
if (!/^postgres(ql)?:\/\//.test(url)) { console.error('ไม่ใช่ข้อความเชื่อมต่อ (ต้องขึ้นต้นด้วย postgresql://)'); process.exit(2); }
const host = new URL(url).hostname;
const db = new pg.Pool({ ...pgConfig(url), max: 1 });
try {
  const applied = await migrate(url);
  if (applied.length) console.log(`สร้างโครงสร้าง ${applied.length} ขั้น`);
  const r = await restore(db, openCopy(o.file, pem, passphrase));
  console.log(`กู้ลง ${host} แล้ว: ${r.rows} แถว จากสำเนาเมื่อ ${new Date(r.head.at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false })}`);
  const p = await fingerprint(db);
  for (const s of p.shops) console.log(`  ${s.code.padEnd(16)} ${s.package.padEnd(9)} แถว ${s.records} · จุดสำรอง ${s.backups} · ไฟล์ ${s.files} · ${s.digest}`);
  console.log(`ลายนิ้วมือรวม ${p.digest} (เทียบกับ node tools/restore-check.mjs ของฐานข้อมูลเดิม ณ เวลาเดียวกัน)`);
} catch (e) {
  console.error(`กู้ไม่สำเร็จ ไม่มีข้อมูลร้านถูกเขียนลง ${host}: ${e.code ? `${e.code} ` : ''}${String(e.message).replace(url, '…')}`);
  process.exitCode = 1;
} finally {
  await db.end();
  if (temp) { await temp.stop(); console.log('ลบฐานข้อมูลชั่วคราวแล้ว'); }
}
