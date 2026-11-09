// TARGET=new: every test gets a shop of its own on the server, opened from
// the same fixture the legacy tests put into the browser. The test then signs
// in through the sign-in screen, as on the legacy app.
import pg from 'pg';
import { createShop, readFixture } from '../../server/lib/seed.ts';
import { withShop } from '../../server/lib/db.ts';
import { readMain } from '../../server/lib/storage.ts';
import { close, renew } from '../../server/lib/licence-admin.ts';
import { openRealShop, resetPassword } from '../../server/lib/shop-open.ts';
import { addStaff } from '../../server/lib/staff.ts';
import { codeAt, newSecret, stepAt } from '../../server/lib/totp.ts';
import { hash } from '@node-rs/argon2';

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

// What DriveGo's staff do with tools/shop-admin.mjs renew / close (task 3.15), for the shop the page is open at.
const shopOfPage = page => decodeURIComponent(new URL(page.url()).pathname.split('/')[1]);
export async function renewTestShop(page, years, paidOn) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  return renew(pool, shopOfPage(page), { years, paidOn, actor: 'test' });
}
export async function closeTestShop(page, lastDay) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  return close(pool, shopOfPage(page), { lastDay, actor: 'test' });
}

// The errors recorded for the shop the page is open at (table errors, server/lib/errors.ts), oldest first.
export async function recordedErrors(page) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  const { rows } = await pool.query(
    `select e.source, e.user_id, e.path, e.message, e.detail, e.agent from errors e join shops s on s.id = e.shop_id
      where s.code = $1 order by e.id`, [shopOfPage(page)]);
  return rows;
}

// What DriveGo's staff do with tools/shop-admin.mjs new / password (server/lib/shop-open.ts): a real, empty shop
// with its owner's account, and a new password when it was forgotten. Returns the code, user and password.
let realShops = 0;
export async function openRealTestShop(o) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  const code = `real-${process.pid.toString(36)}-${++realShops}`;
  const r = await openRealShop(pool, { kind: 'trial', actor: 'test', ...o, code });
  return { code, user: r.user, password: r.password };
}
export async function resetTestPassword(code, o = {}) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  return resetPassword(pool, code, { actor: 'test', ...o });
}

// A staff account of the staff web page (server/lib/staff.ts; tools/shop-admin.mjs staff add): with its temporary
// password, or (ready) with its own password and its authenticator app already set up, as after a first sign-in.
let staffAccounts = 0;
export async function addTestStaff({ ready = false } = {}) {
  pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 });
  const r = await addStaff(pool, { login: `st${process.pid.toString(36)}-${++staffAccounts}`, name: `ทีมงาน ${staffAccounts}`, actor: 'test' });
  if (!ready) return r;
  const password = `${r.password}-own-password`, secret = newSecret();
  await pool.query('update staff set password_hash = $2, must_change = false, totp_secret = $3 where login = $1', [r.login, await hash(password), secret]);
  return { login: r.login, password, secret };
}
// The code the authenticator app shows now, or `ahead` steps of 30 seconds later (a code works once).
export const appCode = (secret, ahead = 0) => codeAt(secret, stepAt(Date.now()) + ahead);
