// Every device sees the others' changes at once (task 3.10, decision Q8, the owner's answers 10.1–10.7). Each save
// writes one write_log row (storage.ts writeMain); its trigger announces it on channel drivego_live at commit
// (0006_live.sql). Each server process keeps one connection that LISTENs, reads each announced row once and hands
// it to the browsers of that shop whose branch scope reaches it (api/live, a stream of server-sent events). The
// browser then asks for the rows that changed (api/storage/<key>/rows), with what the person may not see left out.
// Several server processes each listen for themselves, so it works with more than one instance (docs/HOSTING.md).
import pg from 'pg';
import { pool, withShop } from './db.ts';
import { inScope } from './storage.ts';

// What a device hears about one save: the STORE key and branch, who and when, and the rows written (with their new
// versions), removed and reordered. layout: the key's layout changed (fields added or dropped); whole: the save
// replaced the whole data set (10.5).
export interface LiveEntry {
  id: number; branch: string; key: string; at: string; by: { kind: string; ref: string } | null;
  rows: [string, string, number][]; removed: [string, string][]; ordered: string[]; layout?: true; whole?: string;
  late?: true;   // heard when the device caught up (after connecting, or a gap), not as it happened
}

const unitKey = (vk: string): [string, string] => { const i = vk.indexOf('|'); return [vk.slice(0, i), vk.slice(i + 1)]; };

type Stored = { id: string; branch_id: string; at: Date; units: string; kind: string | null; ref: string | null };
function entryOf(r: Stored): LiveEntry {
  const u = JSON.parse(r.units) as { key: string; versions: Record<string, number>; removed?: string[]; ordered?: string[]; whole?: string };
  const e: LiveEntry = { id: Number(r.id), branch: r.branch_id, key: u.key, at: r.at.toISOString(), by: r.kind ? { kind: r.kind, ref: r.ref ?? '' } : null,
    rows: [], removed: (u.removed || []).map(unitKey), ordered: u.ordered || [] };
  for (const [vk, v] of Object.entries(u.versions || {})) {
    const [unit, key] = unitKey(vk);
    if (!unit.includes('.')) e.layout = true;   // the layout row: unit = the root (DB, FR, DGB)
    else e.rows.push([unit, key, v]);
  }
  if (u.whole) e.whole = u.whole;
  return e;
}

const SELECT = `select w.id::text, w.branch_id, w.at, w.units::text as units, u.kind, u.ref
  from write_log w left join users u on u.shop_id = w.shop_id and u.id = w.user_id where w.shop_id = app_shop()`;

// The saves after `since` that the transaction's branch scope reaches (inside withShop), oldest first.
export async function entriesSince(c: pg.ClientBase, since: number, limit: number): Promise<LiveEntry[]> {
  const { rows } = await c.query<Stored>(`${SELECT} and w.id > $1 order by w.id limit $2`, [since, limit]);
  return rows.map(entryOf);
}

// Where a device starts listening: the last save it may hear about, taken before it reads the data, so nothing
// saved while it reads is missed (hearing a save it already has is harmless: the versions tell).
export async function liveCursor(c: pg.ClientBase): Promise<number> {
  const { rows } = await c.query<{ id: string | null }>('select max(id)::text as id from write_log where shop_id = app_shop()');
  return Number(rows[0].id ?? 0);
}

export interface Listener {
  shopId: string; scope: string;
  deliver(e: LiveEntry): void;
  // The listening connection was lost and is back: saves announced meanwhile were not heard.
  gap(): void;
}

class Hub {
  private listeners = new Set<Listener>();
  private client: pg.Client | null = null;
  private connecting = false;

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    void this.connect();
    return () => { this.listeners.delete(l); };
  }

  private async connect(): Promise<void> {
    if (this.client || this.connecting || !this.listeners.size) return;
    this.connecting = true;
    const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
    let lost = false;
    const drop = () => {
      if (lost) return;
      lost = true;
      if (this.client === c) this.client = null;
      c.end().catch(() => {});
      setTimeout(() => void this.connect().then(() => { if (this.client) for (const l of this.listeners) l.gap(); }), 1000);
    };
    c.on('notification', m => { if (m.channel === 'drivego_live' && m.payload) void this.announce(m.payload); });
    c.on('error', drop);
    c.on('end', drop);
    try {
      await c.connect();
      await c.query('listen drivego_live');
      this.client = c;
    } catch {
      drop();
    } finally {
      this.connecting = false;
    }
  }

  private async announce(payload: string): Promise<void> {
    let p: { shop: string; branch: string; id: number };
    try { p = JSON.parse(payload); } catch { return; }
    const to = [...this.listeners].filter(l => l.shopId === p.shop && inScope(l.scope, p.branch));
    if (!to.length) return;
    try {
      const { rows } = await withShop(pool(), p.shop, '*', c => c.query<Stored>(`${SELECT} and w.id = $1`, [p.id]));
      if (!rows.length) return;
      const e = entryOf(rows[0]);
      for (const l of to) l.deliver(e);
    } catch {
      for (const l of to) l.gap();
    }
  }
}

// One per server process (Next.js dev reloads modules, so it lives on globalThis, like the pool).
const holder = globalThis as typeof globalThis & { __drivegoLive?: Hub };
export const hub = () => (holder.__drivegoLive ??= new Hub());
