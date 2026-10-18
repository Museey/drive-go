// TARGET=new: every test gets a shop of its own on the server, opened from
// the same fixture the legacy tests put into the browser, and a signed-in
// session for it (the sign-in screen itself still runs in the browser until
// task T7, so the session only opens the shop's data).
import pg from 'pg';
import { withShop } from '../../server/lib/db.ts';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { startSession } from '../../server/lib/session.ts';

let pool, n = 0;

export async function openTestShop(dataset) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  const pkg = dataset.split('-')[0];
  const code = `t${process.pid.toString(36)}-${++n}`;
  const data = readFixture(new URL(`../fixtures/${dataset}.json`, import.meta.url));
  const { shopId } = await createShop(pool, { code, pkg, data, keepSecrets: true });
  const token = await withShop(pool, shopId, '*', async c => {
    const user = (await c.query("insert into users (shop_id, kind) values (app_shop(), 'owner') returning id")).rows[0].id;
    return (await startSession(c, user, pkg === 'franchise' ? '*' : '')).token;
  });
  return { code, token };
}
