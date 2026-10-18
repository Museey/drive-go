// TARGET=new: every test gets a shop of its own on the server, opened from
// the same fixture the legacy tests put into the browser. The test then signs
// in through the sign-in screen, as on the legacy app.
import pg from 'pg';
import { createShop, readFixture } from '../../server/lib/seed.ts';

let pool, n = 0;

export async function openTestShop(dataset) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  const pkg = dataset.split('-')[0];
  const code = `t${process.pid.toString(36)}-${++n}`;
  const data = readFixture(new URL(`../fixtures/${dataset}.json`, import.meta.url));
  await createShop(pool, { code, pkg, data });
  return { code };
}
