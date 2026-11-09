// What the staff web page does with shops: the same as tools/shop-admin.mjs (licence-admin.ts, shop-open.ts), with
// the signed-in staff account as who did it in licence_log. The removal of a shop's data stays the nightly job's.
import type pg from 'pg';
import { withShop } from './db.ts';
import { type ShopLicence, close, listShops, openLicence, postpone, recordNotice, renew, retentionDue, setContact, shopOf } from './licence-admin.ts';
import { today } from './licence.ts';
import { type Package, openRealShop, resetPassword } from './shop-open.ts';

type Body = Record<string, unknown>;
const text = (v: unknown) => (v === undefined || v === null ? undefined : String(v).trim() || undefined);
const bad = (message: string) => Object.assign(new Error(message), { status: 400 });

// Every shop with its licence, and what the retention run would do with it today: notice (staff must call the shop,
// docs/STAFF-TOOLS.md), delete (its data goes tonight), purge (its kept history goes).
export async function shopsOverview(db: pg.Pool): Promise<{ today: string; shops: (ShopLicence & { due: string | null })[] }> {
  const on = today();
  const due = new Map((await retentionDue(db, on)).map(d => [d.shop.id, d.action]));
  const shops = (await listShops(db, { on })).map(s => ({ ...s, due: due.get(s.id) ?? null }));
  return { today: on, shops };
}

// One shop: its licence, its log (newest first) and the accounts whose password staff may give again: the owner
// (Biz, ProX) or the chain's accounts (Franchise).
export async function shopDetail(db: pg.Pool, code: string) {
  const { shops, today: on } = await shopsOverview(db);
  const s = shops.find(x => x.code === code);
  if (!s) throw bad(`no shop with code ${code}`);
  return withShop(db, s.id, '*', async c => {
    const { rows: log } = await c.query<{ at: Date; actor: string; action: string; detail: unknown }>(
      'select at, actor, action, detail from licence_log where shop_id = app_shop() order by id desc limit 200');
    const records = async (unit: string) => (await c.query<{ data: Record<string, unknown> }>(
      "select data from records where shop_id = app_shop() and branch_id = '' and unit = $1 order by pos, key", [unit])).rows.map(r => r.data);
    let accounts: { user: string; role: string; name: string; active: boolean }[] = [];
    if (s.status !== 'removed') {
      accounts = s.package === 'franchise'
        ? (await records('FR.accounts')).map(a => ({ user: String(a.user ?? ''), role: String(a.role ?? ''), name: String(a.name ?? ''), active: a.active !== false }))
        : (await records('DGB.shop')).filter(o => o?.ownerUser).map(o => ({ user: String(o.ownerUser), role: 'owner', name: String(o.owner ?? ''), active: true }));
    }
    return { today: on, shop: s, log, accounts };
  });
}

export async function openShop(db: pg.Pool, b: Body, actor: string) {
  const pkg = text(b.pkg) as Package;
  const kind = text(b.kind) as 'trial' | 'pilot';
  const r = await openRealShop(db, { code: text(b.code)?.toLowerCase() ?? '', pkg, kind, actor, from: text(b.from), contact: text(b.contact),
    name: text(b.name) ?? '', owner: text(b.owner) ?? '', user: text(b.user), taxId: text(b.taxId), addr: text(b.addr), zip: text(b.zip),
    tel: text(b.tel), email: text(b.email) });
  return { code: text(b.code)?.toLowerCase(), user: r.user, password: r.password, start: r.start, end: r.end };
}

// One action on one shop, as the command of the same name of tools/shop-admin.mjs.
export async function shopAction(db: pg.Pool, code: string, b: Body, actor: string): Promise<Record<string, unknown>> {
  await shopOf(db, code);
  const note = text(b.note);
  switch (b.action) {
    case 'password': return resetPassword(db, code, { user: text(b.user), actor });
    case 'open': {
      const kind = text(b.kind);
      if (kind !== 'trial' && kind !== 'pilot') throw bad('kind: trial or pilot');
      return { licence: await openLicence(db, code, { kind, from: text(b.from), contact: text(b.contact), actor }) };
    }
    case 'renew': return { licence: await renew(db, code, { years: Number(b.years), paidOn: text(b.paidOn), note, actor }) };
    case 'postpone': {
      const days = text(b.days) ? Number(b.days) : undefined;
      return { licence: await postpone(db, code, { to: text(b.to), days, note, actor }) };
    }
    case 'close': return { licence: await close(db, code, { lastDay: text(b.lastDay), note, actor }) };
    case 'contact': return { licence: await setContact(db, code, { contact: text(b.contact) ?? '', actor }) };
    case 'told': return recordNotice(db, code, { note, actor });
    default: throw bad(`no action ${String(b.action)}`);
  }
}
