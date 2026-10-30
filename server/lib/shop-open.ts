// What DriveGo's staff do to open a real shop and to help an owner who forgot the password (LAUNCH-CHECKLIST,
// stage 2; decision P3: shops are opened by staff, there is no sign-up page). Used by tools/shop-admin.mjs with the
// database owner's connection, never by the web app. Every action is written to licence_log with who did it; a
// password is never written anywhere but as its hash (users), and the staff tool shows it once.
//
// A real shop starts empty: no sample data. Its owner account is what the legacy sign-up form made (05.js dgbSignup:
// DGB.shop with the shop's registration and the owner's user name and password; Franchise: the chain with its HQ
// account), and on the owner's first entry the registration goes into the organisation's settings as that form did
// (05.js dgbFillFromRegistration). The app makes the rest of the data the first time it is opened.
import type pg from 'pg';
import { randomInt } from 'node:crypto';
import { endStaleSessions, storeSecrets } from './auth.ts';
import { withShop } from './db.ts';
import { PILOT_YEARS, TRIAL_DAYS, addDays, addYears, isDay, today } from './licence.ts';
import { shopOf } from './licence-admin.ts';
import { createShop } from './seed.ts';

export type Package = 'biz' | 'prox' | 'franchise';
export interface RealShop {
  code: string; pkg: Package; kind: 'trial' | 'pilot'; from?: string; contact?: string; actor: string;
  name: string;            // the shop's (or the chain's) name
  owner: string;           // the owner's first and last name
  user?: string;           // the owner's (HQ's) user name; default: the code without hyphens (Franchise: hq)
  taxId?: string; addr?: string; zip?: string; tel?: string; email?: string;
}

// A code is the shop's address (/<code>/): small letters, digits and hyphens, not a path of the app itself.
const CODE = /^[a-z0-9][a-z0-9-]{2,31}$/;
// DriveGo's own demo shops (tools/demo-shops.mjs: a local run and the test server).
export const DEMO_CODES = ['demo-biz', 'demo-prox', 'demo-franchise'];
const RESERVED = new Set(['api', ...DEMO_CODES]);

// A password to read out over the phone: no letters that look alike (0/O, 1/l/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
export function temporaryPassword(length = 10): string {
  let s = '';
  for (let i = 0; i < length; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

const need = (v: string | undefined, what: string) => { if (!v || !String(v).trim()) throw new Error(`${what} is required`); return String(v).trim(); };

// Opens an empty shop with its owner account and its trial (TRIAL_DAYS days) or pilot (PILOT_YEARS year) licence.
// Returns the owner's user name and temporary password, to be told to the owner (not written down anywhere).
export async function openRealShop(db: pg.Pool, s: RealShop): Promise<{ shopId: string; user: string; password: string; start: string; end: string }> {
  const code = need(s.code, 'code');
  if (!CODE.test(code) || RESERVED.has(code)) throw new Error(`code: 3–32 small letters, digits or hyphens, not ${[...RESERVED].join(', ')}: ${code}`);
  if (!['biz', 'prox', 'franchise'].includes(s.pkg)) throw new Error(`package: biz, prox or franchise, not ${s.pkg}`);
  if (s.kind !== 'trial' && s.kind !== 'pilot') throw new Error('kind: trial or pilot');
  if (s.from !== undefined && !isDay(s.from)) throw new Error(`from: not a day (yyyy-mm-dd): ${s.from}`);
  const name = need(s.name, 'name'), owner = need(s.owner, 'owner');
  if ((await db.query('select 1 from shops where code = $1', [code])).rows.length) throw new Error(`a shop with code ${code} exists already`);
  const user = (s.user ?? (s.pkg === 'franchise' ? 'hq' : code.replace(/-/g, ''))).trim().toLowerCase();
  if (!/^[a-z0-9._-]{2,40}$/.test(user)) throw new Error(`user: 2–40 small letters, digits, dots, hyphens or underscores: ${user}`);
  const start = s.from ?? today();
  const end = s.kind === 'trial' ? addDays(start, TRIAL_DAYS) : addYears(start, PILOT_YEARS);
  const password = temporaryPassword();
  const store: Record<string, string> = {};
  if (s.pkg === 'franchise') {
    store['dgb.v22'] = JSON.stringify({ shop: null, session: { who: '' } });
    store['franchise.v22'] = JSON.stringify({ enabled: true, org: { name }, branches: [],
      accounts: [{ id: `hq-${Date.now().toString(36)}`, user, pass: password, role: 'HQ', branchId: '', name: 'สำนักงานใหญ่ (HQ)', active: true }],
      reqs: [], hqStock: [], seq: { req: 0, br: 0 }, session: { accId: '', inspect: '' } });
  } else {
    store['dgb.v22'] = JSON.stringify({ shop: { code: code.toUpperCase(), name, owner, taxId: s.taxId ?? '', addr: s.addr ?? '', zip: s.zip ?? '',
      tel: s.tel ?? '', email: (s.email ?? '').toLowerCase(), ownerUser: user, pass: password, created: today(), trialStart: start,
      licensed: false, licEnd: '', payments: [], fillSettings: true }, session: { who: '' } });
  }
  const { shopId } = await createShop(db, { code, pkg: s.pkg, name, data: { store, localStorage: [] },
    licence: { kind: s.kind, start, end, contact: s.contact } });
  await withShop(db, shopId, '*', c => c.query('insert into licence_log (shop_id, shop_code, actor, action, detail) values ($1, $2, $3, $4, $5)',
    [shopId, code, s.actor, 'new', JSON.stringify({ pkg: s.pkg, kind: s.kind, start, end, name, owner, user, contact: s.contact ?? '' })]));
  return { shopId, user, password, start, end };
}

// A new temporary password for a shop's owner (Biz, ProX) or a chain's account (Franchise: HQ, or the user name
// given), when it was forgotten: the old one stops working, failed attempts are forgotten, and the account's
// sessions end. Employees' passwords are the owner's to set in the app (menu 10); a branch's are HQ's.
export async function resetPassword(db: pg.Pool, code: string, o: { user?: string; actor: string }): Promise<{ user: string; password: string }> {
  const shop = await shopOf(db, code);
  const password = temporaryPassword();
  return withShop(db, shop.id, '*', async c => {
    const one = async (unit: string) => {
      const { rows } = await c.query<{ key: string; data: string }>(
        "select key, data::text as data from records where shop_id = app_shop() and branch_id = '' and unit = $1 order by pos, key", [unit]);
      return rows.map(r => ({ key: r.key, data: JSON.parse(r.data) as Record<string, unknown> }));
    };
    let user: string, secret: { unit: string; key: string; field: string; value: string };
    if (shop.package === 'franchise') {
      const accounts = await one('FR.accounts');
      const want = o.user?.trim().toLowerCase();
      const a = accounts.find(x => want ? String(x.data.user ?? '').toLowerCase() === want : x.data.role === 'HQ');
      if (!a) throw new Error(want ? `${code}: no account ${want}` : `${code}: no HQ account`);
      user = String(a.data.user);
      secret = { unit: 'FR.accounts', key: a.key, field: 'pass', value: password };
    } else {
      if (o.user) throw new Error('--user is for a franchise chain\'s accounts; a shop\'s employees get theirs from the owner (menu 10)');
      const [s] = await one('DGB.shop');
      if (!s?.data) throw new Error(`${code}: the shop has no owner account`);
      user = String(s.data.ownerUser ?? '');
      secret = { unit: 'DGB.shop', key: '', field: 'pass', value: password };
    }
    const changed = await storeSecrets(c, '', [secret]);
    await endStaleSessions(c, shop.package, null, changed);
    await c.query('insert into licence_log (shop_id, shop_code, actor, action, detail) values ($1, $2, $3, $4, $5)',
      [shop.id, shop.code, o.actor, 'password', JSON.stringify({ user })]);
    return { user, password };
  });
}
