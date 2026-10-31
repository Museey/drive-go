// Staff tool: the errors of the server and of the browsers (table errors, server/lib/errors.ts; kept 30 days),
// newest first, with what is known of each — when the hourly job alerted, or a shop says something went wrong.
//
//   node tools/errors.mjs [--hours 24] [--shop CODE] [--source server|browser] [--full]
//        --full: the whole stack of each error (otherwise its first lines)
//   (MIGRATE_DATABASE_URL or --db: the database owner)
import pg from 'pg';
import { parseArgs } from 'node:util';
import { pgConfig } from '../server/lib/pg-config.ts';

const { values: o } = parseArgs({ options: { db: { type: 'string' }, hours: { type: 'string' }, shop: { type: 'string' },
  source: { type: 'string' }, full: { type: 'boolean' } } });
const url = o.db || process.env.MIGRATE_DATABASE_URL;
if (!url) { console.error('give the owner database URL: --db URL or MIGRATE_DATABASE_URL'); process.exit(2); }
const hours = Number(o.hours ?? 24);
if (!(hours > 0)) { console.error(`--hours: not a number of hours: ${o.hours}`); process.exit(2); }
if (o.source && !['server', 'browser'].includes(o.source)) { console.error('--source: server or browser'); process.exit(2); }
const db = new pg.Pool({ ...pgConfig(url), max: 1 });

try {
  const { rows } = await db.query(
    `select e.at, e.source, coalesce(s.code, '') as shop, e.user_id, e.path, e.message, e.detail, e.agent
       from errors e left join shops s on s.id = e.shop_id
      where e.at > now() - make_interval(hours => $1) and ($2::text is null or s.code = $2) and ($3::text is null or e.source = $3)
      order by e.at desc limit 500`, [hours, o.shop ?? null, o.source ?? null]);
  for (const r of rows) {
    console.log(`${r.at.toISOString()} ${r.source.padEnd(7)} ${r.shop || '-'} ${r.user_id || '-'} ${r.path}`);
    console.log(`  ${r.message}`);
    const stack = r.detail.split('\n').filter(Boolean);
    for (const l of o.full ? stack : stack.slice(1, 4)) console.log(`    ${l.trim()}`);
    if (r.agent) console.log(`  ${r.agent}`);
  }
  console.log(`${rows.length} error(s) in the last ${hours} hour(s)${rows.length === 500 ? ' (the newest 500)' : ''}`);
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
