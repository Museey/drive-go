// The restore drill's check (docs/RESTORE-DRILL.md): what a database holds, as counts per shop and a fingerprint,
// so the copy DigitalOcean restores can be compared with the database it came from. Nothing personal is printed.
//
//   node tools/restore-check.mjs [--marker TEXT] [--json]
//
// Run as the database owner (doadmin): from the app's Console on DigitalOcean (where DATABASE_CA_CERT is set), give the
// connection string in MIGRATE_DATABASE_URL, or paste it when asked (it is not shown, and not kept in the shell's history).
// --marker: also say in which shop and records a text is (the drill's customer, e.g. "ซ้อมกู้คืน").
import { parseArgs } from 'node:util';
import pg from 'pg';
import { pgConfig } from '../server/lib/pg-config.ts';
import { fingerprint } from '../server/lib/fingerprint.ts';

const { values } = parseArgs({ options: { marker: { type: 'string' }, json: { type: 'boolean' } } });

// A line typed without showing it (the connection string has the owner's password).
function askHidden(question) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    process.stdout.write(question);
    if (!input.isTTY) {
      let text = '';
      input.setEncoding('utf8');
      input.on('data', d => { text += d; const i = text.indexOf('\n'); if (i >= 0) { input.pause(); resolve(text.slice(0, i).trim()); } });
      input.on('end', () => resolve(text.trim()));
      return;
    }
    let text = '';
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    const done = v => { input.setRawMode(false); input.pause(); input.removeListener('data', on); process.stdout.write('\n'); v instanceof Error ? reject(v) : resolve(v.trim()); };
    const on = ch => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') return done(text);
        if (c === '\u0003') return done(new Error('cancelled'));
        if (c === '\u007f' || c === '\b') text = text.slice(0, -1); else text += c;
      }
    };
    input.on('data', on);
  });
}

const url = process.env.MIGRATE_DATABASE_URL || await askHidden('ข้อความเชื่อมต่อของ doadmin (วางแล้วกด Enter, จะไม่แสดงบนจอ): ');
if (!/^postgres(ql)?:\/\//.test(url)) { console.error('ไม่ใช่ข้อความเชื่อมต่อ (ต้องขึ้นต้นด้วย postgresql://)'); process.exit(2); }
const host = new URL(url).hostname;
const db = new pg.Pool({ ...pgConfig(url), max: 1 });
try {
  const p = await fingerprint(db, { marker: values.marker });
  if (values.json) console.log(JSON.stringify({ host, ...p }, null, 1));
  else {
    const th = t => (t ? new Date(t).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', hour12: false }) : '-');
    console.log(`ฐานข้อมูล ${host}`);
    console.log(`เวลาของฐานข้อมูล ${th(p.at)} · บันทึกล่าสุด ${th(p.lastWrite)}`);
    console.log(`โครงสร้าง ${p.migrations.length} ขั้น (ล่าสุด ${p.migrations.at(-1) ?? '-'}) · ตารางที่บังคับ RLS ${p.rlsTables} · role ของแอป ${p.appRole ? 'มี' : 'ไม่มี!'}` +
      ` · บัญชีที่ใช้ตรวจ${p.ownerSkipsRls ? 'ข้าม' : 'ไม่ข้าม'} RLS`);
    console.log(`ร้าน ${p.shops.length}`);
    for (const s of p.shops) {
      console.log(`  ${s.code.padEnd(16)} ${s.package.padEnd(9)} ${s.status.padEnd(8)} แถว ${s.records} (รุ่นรวม ${s.versions}) · เปลี่ยน ${s.changes} · บันทึก ${s.saves}` +
        ` · จุดสำรอง ${s.backups} · ไฟล์ ${s.files} · เลขเอกสาร ${s.counters}/${s.issued} · ล่าสุด ${th(s.lastChange)} · ${s.digest}`);
      if (s.marker) console.log(`    "${values.marker}": ${Object.keys(s.marker).length ? Object.entries(s.marker).map(([u, n]) => `${u} ${n} แถว`).join(', ') : 'ไม่พบ'}`);
    }
    console.log(`ลายนิ้วมือรวม ${p.digest}`);
  }
} catch (e) {
  console.error(`ต่อฐานข้อมูล ${host} ไม่ได้หรืออ่านไม่ได้: ${e.code ? `${e.code} ` : ''}${e.message.replace(url, '…')}`);
  process.exitCode = 1;
} finally {
  await db.end();
}
