// The test server's scheduled job (.do/app.yaml: job `nightly`, each night at 03:17 Bangkok time; docs/STAFF-TOOLS.md):
// carries out the data removals that are due and removes deleted attachments for good (server/lib/nightly.ts).
// Shops that must be told before their data is removed are listed, not told: staff phone them, then record it with
// `node tools/shop-admin.mjs told CODE`.
//
//   node tools/nightly.mjs [--day yyyy-mm-dd]          (MIGRATE_DATABASE_URL or --db: the database owner)
//
// Exit status: 0 done · 3 done, and shops staff must call: DigitalOcean's alert JOB_INVOCATION_FAILED e-mails the
// team (as for a failed run; the log says which) every night until they are told · 1 failed.
import pg from 'pg';
import { parseArgs } from 'node:util';
import { pgConfig } from '../server/lib/pg-config.ts';
import { isDay } from '../server/lib/licence.ts';
import { nightly } from '../server/lib/nightly.ts';

const { values: o } = parseArgs({ options: { db: { type: 'string' }, day: { type: 'string' } } });
const url = o.db || process.env.MIGRATE_DATABASE_URL;
if (!url) { console.error('give the owner database URL: --db URL or MIGRATE_DATABASE_URL'); process.exit(2); }
if (o.day !== undefined && !isDay(o.day)) { console.error(`--day: not a day: ${o.day}`); process.exit(2); }
const db = new pg.Pool({ ...pgConfig(url), max: 2 });

try {
  const n = await nightly(db, { on: o.day });
  console.log(`${n.on}: ${n.done.length} removal(s), ${n.files.reduce((a, f) => a + f.removed, 0)} file(s) removed, ${n.call.length} shop(s) to call`);
  for (const d of n.done) console.log(`DONE   ${d.action.padEnd(6)} ${d.code} — ${d.why}`);
  for (const f of n.files) console.log(`FILES  ${f.code}: ${f.removed} removed for good`);
  for (const d of n.demo) console.log(`DEMO   ${d.shop.code}: the trial ended ${d.licence.end} (a new trial: node tools/shop-admin.mjs open ${d.shop.code} --trial)`);
  for (const d of n.call) console.log(`CALL   ${d.shop.code} (${d.shop.name || d.shop.package})${d.licence.contact ? ` · ${d.licence.contact}` : ''}:` +
    ` the licence ended ${d.licence.end}; tell the shop that its data will be removed (${d.why}) — export what it must keep or renew —` +
    ` then: node tools/shop-admin.mjs told ${d.shop.code} --by NAME`);
  if (n.call.length) {
    console.log('STAFF ACTION NEEDED: shops to call (this run ends with status 3 so that the team is alerted)');
    process.exitCode = 3;
  }
} catch (e) {
  console.error(e.stack || e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
