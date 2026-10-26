// What DriveGo's staff do with shops' licences (task 3.15, decisions 15.1, 15.2, 15.5, 15.6): open, renew,
// postpone the removal, close, and the retention job that tells a shop and then removes its data. Used by
// tools/shop-admin.mjs and tools/retention.mjs with the database owner's connection (never by the web app, whose
// role can only read its own shop's licence); renew() is also what a payment provider's webhook will call once
// one is chosen (task 3.16). Every action is written to licence_log, with who did it.
import type pg from 'pg';
import { withShop } from './db.ts';
import { COLUMNS, KEEP_DAYS, type Kind, type Licence, type LicenceRow, NOTICE_DAYS, PILOT_YEARS, TRIAL_DAYS,
  addDays, addYears, daysBetween, fromRow, isDay, today, writeLicenceIntoData } from './licence.ts';

export interface Shop { id: string; code: string; package: string; name: string; status: string }
export type ShopLicence = Shop & { licence: Licence | null };

export async function shopOf(db: pg.Pool | pg.ClientBase, code: string): Promise<Shop> {
  const { rows } = await db.query<Shop>('select id, code, package, name, status from shops where code = $1', [code]);
  if (!rows.length) throw new Error(`no shop with code ${code}`);
  return rows[0];
}

const day = (d: string | undefined, what: string) => {
  if (d === undefined) return undefined;
  if (!isDay(d)) throw new Error(`${what}: not a day (yyyy-mm-dd): ${d}`);
  return d;
};

// One change of one shop's licence, in one transaction: the row locked, changed, its dates put into the shop's
// data, and logged.
async function change(db: pg.Pool, code: string, actor: string, action: string,
  fn: (l: Licence | null) => { kind: Kind; start: string; end: string; deleteOn?: string | null; noticeSentOn?: string | null; contact?: string; detail?: object })
  : Promise<Licence> {
  const shop = await shopOf(db, code);
  return withShop(db, shop.id, '*', async c => {
    const { rows } = await c.query<LicenceRow>(`select ${COLUMNS} from licences where shop_id = app_shop() for update`);
    const before = rows.length ? fromRow(rows[0]) : null;
    const n = fn(before);
    if (n.end < n.start) throw new Error(`the last day ${n.end} is before the first ${n.start}`);
    if (n.deleteOn && n.deleteOn <= n.end) throw new Error(`the data cannot be removed (${n.deleteOn}) before the licence ends (${n.end})`);
    await c.query(
      `insert into licences (shop_id, kind, starts_on, ends_on, delete_on, notice_sent_on, contact)
       values (app_shop(), $1, $2, $3, $4, $5, $6)
       on conflict (shop_id) do update set kind = $1, starts_on = $2, ends_on = $3, delete_on = $4, notice_sent_on = $5, contact = $6, updated_at = now()`,
      [n.kind, n.start, n.end, n.deleteOn ?? null, n.noticeSentOn ?? null, n.contact ?? before?.contact ?? '']);
    const after = fromRow((await c.query<LicenceRow>(`select ${COLUMNS} from licences where shop_id = app_shop()`)).rows[0]);
    const rowsChanged = await writeLicenceIntoData(c, after);
    await log(c, shop, actor, action, { ...n.detail, before, after, dataRowsChanged: rowsChanged });
    return after;
  });
}

async function log(c: pg.ClientBase, shop: Shop, actor: string, action: string, detail: object) {
  await c.query('insert into licence_log (shop_id, shop_code, actor, action, detail) values ($1, $2, $3, $4, $5)',
    [shop.id, shop.code, actor, action, JSON.stringify(detail)]);
}

// Starts the counted time of a shop staff have just opened (15.2): a trial of TRIAL_DAYS days, or a pilot garage's
// PILOT_YEARS year(s), from `from` (default today). Replaces whatever licence the shop had.
export function openLicence(db: pg.Pool, code: string, o: { kind: 'trial' | 'pilot'; from?: string; actor: string; contact?: string }) {
  const start = day(o.from, 'from') ?? today();
  const end = o.kind === 'trial' ? addDays(start, TRIAL_DAYS) : addYears(start, PILOT_YEARS);
  return change(db, code, o.actor, 'open', () => ({ kind: o.kind, start, end, contact: o.contact, detail: { kind: o.kind } }));
}

// A paid renewal of `years` year(s) (15.2): from the last day while the licence still runs (on the day it was
// paid), otherwise from the day it was paid, as the legacy "ต่ออายุ" counted. The shop becomes a paying one, its
// data is no longer due for removal, and it may change its data again at once.
export function renew(db: pg.Pool, code: string, o: { years: number; paidOn?: string; actor: string; note?: string }) {
  if (!Number.isInteger(o.years) || o.years < 1 || o.years > 10) throw new Error(`years: a whole number from 1 to 10, not ${o.years}`);
  const paidOn = day(o.paidOn, 'paid on') ?? today();
  return change(db, code, o.actor, 'renew', l => {
    if (!l) throw new Error(`${code} has no licence yet: open it first`);
    const from = paidOn <= l.end ? l.end : paidOn;
    return { kind: 'paid', start: l.start, end: addYears(from, o.years), deleteOn: null, noticeSentOn: null,
      detail: { years: o.years, paidOn, note: o.note ?? '' } };
  });
}

// Moves the removal of an expired shop's data later (15.5), to a day or by some days; the notice is sent again
// NOTICE_DAYS before the new day.
export function postpone(db: pg.Pool, code: string, o: { to?: string; days?: number; actor: string; note?: string }) {
  return change(db, code, o.actor, 'postpone', l => {
    if (!l) throw new Error(`${code} has no licence`);
    const to = day(o.to, 'to') ?? (o.days && o.days > 0 ? addDays(l.deleteOn, o.days) : undefined);
    if (!to || to <= l.deleteOn) throw new Error(`the new removal day must be after ${l.deleteOn}`);
    return { kind: l.kind, start: l.start, end: l.end, deleteOn: to, noticeSentOn: null, detail: { from: l.deleteOn, to, note: o.note ?? '' } };
  });
}

// The shop stops using DriveGo: its last day becomes `lastDay` (default yesterday, so it is read-only at once)
// and its data is removed KEEP_DAYS later (15.5).
export function close(db: pg.Pool, code: string, o: { lastDay?: string; actor: string; note?: string }) {
  return change(db, code, o.actor, 'close', l => {
    if (!l) throw new Error(`${code} has no licence`);
    const last = day(o.lastDay, 'last day') ?? addDays(today(), -1);
    const end = last < l.start ? l.start : last;
    if (end > l.end) throw new Error(`${code} already ends on ${l.end}`);
    return { kind: l.kind, start: l.start, end, deleteOn: null, noticeSentOn: null, detail: { from: l.end, note: o.note ?? '' } };
  });
}

export function setContact(db: pg.Pool, code: string, o: { contact: string; actor: string }) {
  return change(db, code, o.actor, 'contact', l => {
    if (!l) throw new Error(`${code} has no licence`);
    return { ...l, contact: o.contact, detail: { contact: o.contact } };
  });
}

// Every shop with its licence, the ones that end first first. expiring: only licences whose last day is within
// that many days from `on` (and the ones already over).
export async function listShops(db: pg.Pool, { expiring, on = today() }: { expiring?: number; on?: string } = {}): Promise<ShopLicence[]> {
  const { rows } = await db.query<Shop & LicenceRow & { has: boolean }>(
    `select s.id, s.code, s.package, s.name, s.status, l.shop_id is not null as has,
            l.kind, l.starts_on::text, l.ends_on::text, l.delete_on::text, l.notice_sent_on::text, l.contact
       from shops s left join licences l on l.shop_id = s.id order by l.ends_on nulls first, s.code`);
  return rows.map(r => ({ id: r.id, code: r.code, package: r.package, name: r.name, status: r.status, licence: r.has ? fromRow(r) : null }))
    .filter(s => expiring === undefined || !s.licence || daysBetween(on, s.licence.end) <= expiring);
}

// ---------- retention (15.5, 15.6) ----------

export interface Due { shop: Shop; licence: Licence; action: 'notice' | 'delete'; why: string }

// What the retention job would do on `on`: tell the shops whose removal is NOTICE_DAYS away or nearer (once),
// and remove the data of those whose removal day has come — never sooner than NOTICE_DAYS after they were told,
// never a shop whose licence runs (a renewed one), never a shop without a licence.
export async function retentionDue(db: pg.Pool, on = today()): Promise<Due[]> {
  const out: Due[] = [];
  for (const s of await listShops(db)) {
    const l = s.licence;
    if (!l || on <= l.end) continue;
    if (!l.noticeSentOn) {
      if (on >= addDays(l.deleteOn, -NOTICE_DAYS)) out.push({ shop: s, licence: l, action: 'notice', why: `removal on ${l.deleteOn}` });
    } else if (on >= l.deleteOn && daysBetween(l.noticeSentOn, on) >= NOTICE_DAYS) {
      out.push({ shop: s, licence: l, action: 'delete', why: `ended ${l.end}, told ${l.noticeSentOn}, removal day ${l.deleteOn}` });
    }
  }
  return out;
}

// Sends the notices of a retention run. Until a provider is chosen (task 3.16) there is no e-mail: `tell` gets
// each one (tools/retention.mjs prints them for staff to call, as during the pilot, 15.4).
export type Tell = (d: Due, removalOn: string) => Promise<void>;

// Carries out one due action, checking again under lock that it is still due (a renewal in between wins).
export async function carryOut(db: pg.Pool, d: Due, o: { actor: string; on?: string; tell: Tell }): Promise<boolean> {
  const on = o.on ?? today();
  return withShop(db, d.shop.id, '*', async c => {
    const { rows } = await c.query<LicenceRow>(`select ${COLUMNS} from licences where shop_id = app_shop() for update`);
    if (!rows.length) return false;
    const l = fromRow(rows[0]);
    if (on <= l.end) return false;
    if (d.action === 'notice') {
      if (l.noticeSentOn || on < addDays(l.deleteOn, -NOTICE_DAYS)) return false;
      // Always a full NOTICE_DAYS: a late notice moves the removal day.
      const removal = daysBetween(on, l.deleteOn) >= NOTICE_DAYS ? l.deleteOn : addDays(on, NOTICE_DAYS);
      await c.query('update licences set notice_sent_on = $1, delete_on = $2, updated_at = now() where shop_id = app_shop()', [on, removal]);
      await o.tell(d, removal);
      await log(c, d.shop, o.actor, 'notice', { removalOn: removal, contact: l.contact });
      return true;
    }
    if (!l.noticeSentOn || on < l.deleteOn || daysBetween(l.noticeSentOn, on) < NOTICE_DAYS) return false;
    // Everything of the shop, its change history included (15.6): every table refers to shops with on delete cascade.
    await log(c, d.shop, o.actor, 'delete', { licence: l, package: d.shop.package, name: d.shop.name });
    await c.query('delete from shops where id = app_shop()');
    return true;
  });
}

export { KEEP_DAYS, NOTICE_DAYS };
