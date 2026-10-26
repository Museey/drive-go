// Removes the data of shops that stopped using DriveGo (task 3.15, decisions 15.5, 15.6): 30 days before the
// removal day (90 days after the licence's last day, unless staff postponed it) the shop is told once; on the
// removal day, if it was told at least 30 days before and has not renewed, everything of the shop is removed
// for good but its change history, which is kept 5 more years (owner's answer of 2026-10-26, as R15) and then
// removed with the shop (purge). Staff tell the shop by phone during the pilot (15.4): the notices
// are printed for them; e-mail and running this on a schedule wait for the providers of task 3.16.
//
//   node tools/retention.mjs                 what would be done today (nothing is changed)
//   node tools/retention.mjs --apply         tell the shops and remove the data that is due
//   options: --db URL (or MIGRATE_DATABASE_URL, the owner), --by NAME, --day yyyy-mm-dd (as if run that day)
import { userInfo } from 'node:os';
import { parseArgs } from 'node:util';
import pg from 'pg';
import { carryOut, retentionDue } from '../server/lib/licence-admin.ts';
import { isDay, today } from '../server/lib/licence.ts';

const { values: o } = parseArgs({ options: { db: { type: 'string' }, apply: { type: 'boolean' }, by: { type: 'string' }, day: { type: 'string' } } });
const url = o.db || process.env.MIGRATE_DATABASE_URL;
if (!url) { console.error('give the owner database URL: --db URL or MIGRATE_DATABASE_URL'); process.exit(2); }
if (o.day !== undefined && !isDay(o.day)) { console.error(`--day: not a day: ${o.day}`); process.exit(2); }
const on = o.day ?? today();
const db = new pg.Pool({ connectionString: url, max: 2 });

// Until e-mail is chosen (3.16): what staff tell the shop.
const tell = async (d, removalOn) => console.log(
  `  TELL ${d.shop.code} (${d.shop.name || d.shop.package})${d.licence.contact ? ` · ${d.licence.contact}` : ''}: the licence ended on ${d.licence.end};` +
  ` its data will be removed on ${removalOn} (DriveGo keeps only its change history, 5 years) — export what it must keep (documents for 5 years) or renew before then`);

try {
  const due = await retentionDue(db, on);
  console.log(`${on}: ${due.length} shop(s) due${o.apply ? '' : ' (dry run: nothing changed; --apply to carry out)'}`);
  for (const d of due) {
    console.log(`${d.action.padEnd(6)} ${d.shop.code} — ${d.why}`);
    if (!o.apply) continue;
    const done = await carryOut(db, d, { actor: o.by || userInfo().username, on, tell });
    console.log(done ? `  done` : `  skipped: no longer due`);
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
