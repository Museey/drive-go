// The test server's hourly job (.do/app.yaml: job `watch`; docs/STAFF-TOOLS.md): the errors of the server and of the
// browsers recorded since the last run (server/lib/watch.ts), as lines for the job's log.
//
//   node tools/watch.mjs          (MIGRATE_DATABASE_URL or --db: the database owner)
//
// Exit status: 0 nothing to look at · 3 a server error, or many browser errors: DigitalOcean's alert
// JOB_INVOCATION_FAILED e-mails the team (as for a failed run; the log says which) · 1 failed.
import pg from 'pg';
import { parseArgs } from 'node:util';
import { pgConfig } from '../server/lib/pg-config.ts';
import { BROWSER_ALERT, watch } from '../server/lib/watch.ts';

const { values: o } = parseArgs({ options: { db: { type: 'string' } } });
const url = o.db || process.env.MIGRATE_DATABASE_URL;
if (!url) { console.error('give the owner database URL: --db URL or MIGRATE_DATABASE_URL'); process.exit(2); }
const db = new pg.Pool({ ...pgConfig(url), max: 1 });
const at = d => d.toISOString().replace('T', ' ').slice(0, 19);

try {
  const w = await watch(db);
  console.log(`${at(w.since)} → ${at(w.until)} UTC: ${w.server} server error(s), ${w.browser} browser error(s)`);
  for (const s of w.seen)
    console.log(`${s.source.toUpperCase().padEnd(7)} ×${s.count} ${s.shop || '-'} ${s.path} ${at(s.first)}${s.count > 1 ? `…${at(s.last)}` : ''} — ${s.message.split('\n')[0].slice(0, 300)}`);
  if (w.alert) {
    console.log(`STAFF ACTION NEEDED: ${w.server ? 'the server failed on requests' : `${w.browser} browser errors (alert from ${BROWSER_ALERT})`}` +
      ' — details: node tools/errors.mjs (this run ends with status 3 so that the team is alerted)');
    process.exitCode = 3;
  }
} catch (e) {
  console.error(e.stack || e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
