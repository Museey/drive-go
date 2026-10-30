// Staff tool for a shop's attachments (task 3.11, owner's answer 11.1).
// Connects as the database owner (MIGRATE_DATABASE_URL); every change is a
// save of the shop's data recorded in its change log (no user = staff), and
// this tool prints what it did.
//
//   node tools/files.mjs list <shop code> [--branch B001] [--deleted]
//        the shop's files: id, branch, type, size, name, uploaded, deleted
//   node tools/files.mjs restore <shop code> <file id> [--branch B001] [--replace]
//        puts a deleted file back where the data last referred to it (30 days)
//   node tools/files.mjs purge [<shop code>]
//        removes for good what was deleted more than 30 days ago (the nightly job does it too, tools/nightly.mjs)
import pg from 'pg';
import { pgConfig } from '../server/lib/pg-config.ts';
import { withShop } from '../server/lib/db.ts';
import { purgeFiles } from '../server/lib/files.ts';
import { restoreFile } from '../server/lib/file-restore.ts';

const [cmd, ...rest] = process.argv.slice(2);
const flag = name => { const i = rest.indexOf(name); if (i < 0) return undefined; const v = rest[i + 1]; rest.splice(i, v && !v.startsWith('--') ? 2 : 1); return v && !v.startsWith('--') ? v : true; };
const url = process.env.MIGRATE_DATABASE_URL;
if (!url || !['list', 'restore', 'purge'].includes(cmd)) {
  console.error('usage: MIGRATE_DATABASE_URL=… node tools/files.mjs list|restore|purge … (see the top of tools/files.mjs)');
  process.exit(2);
}

const pool = new pg.Pool({ ...pgConfig(url), max: 1 });
const shopOf = async code => {
  const { rows } = await pool.query('select id, code from shops where code = $1', [code]);
  if (!rows.length) throw new Error(`no shop ${code}`);
  return rows[0];
};

try {
  const branch = flag('--branch'), deleted = flag('--deleted'), replace = flag('--replace');
  if (cmd === 'list') {
    const shop = await shopOf(rest[0]);
    const rows = await withShop(pool, shop.id, '*', async c => (await c.query(
      `select id, branch_id, mime, size, name, use, created_at, deleted_at from files
        where shop_id = app_shop() and ($1::text is null or branch_id = $1) and (not $2 or deleted_at is not null)
        order by created_at`, [typeof branch === 'string' ? branch : null, !!deleted])).rows);
    for (const r of rows) console.log([r.id, r.branch_id || '-', r.mime, r.size, r.use, JSON.stringify(r.name), r.created_at.toISOString(),
      r.deleted_at ? `deleted ${r.deleted_at.toISOString()}` : 'in use'].join('  '));
    console.log(`${rows.length} file(s)`);
  } else if (cmd === 'restore') {
    const shop = await shopOf(rest[0]);
    const r = await withShop(pool, shop.id, '*', c => restoreFile(c, typeof branch === 'string' ? branch : '', rest[1], { replace: !!replace }));
    console.log(`restored ${rest[1]} of ${shop.code}: ${r.how === 'row' ? 'the record came back' : 'the link is back in'} ${r.unit} ${r.key} (${r.storeKey})`);
  } else {
    const shops = rest[0] ? [await shopOf(rest[0])] : (await pool.query('select id, code from shops order by code')).rows;
    for (const shop of shops) {
      const gone = await withShop(pool, shop.id, '*', c => purgeFiles(c));
      if (gone.length) console.log(`${shop.code}: removed ${gone.length} file(s) for good`);
    }
  }
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
