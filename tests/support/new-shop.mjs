// TARGET=new: every test gets a shop of its own on the server, opened from
// the same fixture the legacy tests put into the browser. The test then signs
// in through the sign-in screen, as on the legacy app.
import pg from 'pg';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { withShop } from '../../server/lib/db.ts';
import { readMain } from '../../server/lib/storage.ts';
import { renew } from '../../server/lib/licence-admin.ts';

let pool, n = 0;

// licence: the shop's licence on the server (task 3.15); default: the fixture's own dates (seed.ts).
export async function openTestShop(dataset, licence) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  const pkg = dataset.split('-')[0];
  const code = `t${process.pid.toString(36)}-${++n}`;
  const data = readFixture(new URL(`../fixtures/${dataset}.json`, import.meta.url));
  await createShop(pool, { code, pkg, data, licence });
  return { code };
}

// What the server holds for a Biz / ProX shop's data (garage.v22), whole — what its owner would get, whoever
// saved it (task 3.9: an employee's browser holds less than the server).
export async function readTestShop(code) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  const { rows } = await pool.query('select id from shops where code = $1', [code]);
  if (!rows.length) throw new Error(`no shop ${code}`);
  const main = await withShop(pool, rows[0].id, '*', c => readMain(c, '', 'garage.v22'));
  return main ? JSON.parse(main.json) : null;
}

// What DriveGo's staff do with tools/shop-admin.mjs renew (task 3.15), for the shop the page is open at.
export async function renewTestShop(page, years, paidOn) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  const code = decodeURIComponent(new URL(page.url()).pathname.split('/')[1]);
  return renew(pool, code, { years, paidOn, actor: 'test' });
}
