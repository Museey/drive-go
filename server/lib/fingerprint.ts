// A database's fingerprint, to tell whether a restored copy holds the data it should (the restore drill,
// docs/RESTORE-DRILL.md, tools/restore-check.mjs; LAUNCH-CHECKLIST stage 1 "ซ้อมกู้คืนจริงหนึ่งรอบ"). Run as the
// database owner: shops and the schema are read directly, each shop's rows within the shop and by its id (Row-Level
// Security applies to an owner that is not a superuser; a superuser, as on a test database, skips it, so every query
// names the shop as well). It reports counts, version sums and times only — never a record's content, nor anything
// personal.
import { createHash } from 'node:crypto';
import type pg from 'pg';
import { withShop } from './db.ts';

export interface ShopPrint {
  code: string; package: string; status: string;
  records: number; versions: number; lastChange: string | null; changes: number; saves: number;
  backups: number; files: number; counters: number; issued: number;
  marker?: Record<string, number>;   // unit -> rows whose data has the marker text
  digest: string;                    // of the counts above (not the times): equal data, equal digest
}
export interface Print {
  at: string; migrations: string[]; rlsTables: number; appRole: boolean; ownerSkipsRls: boolean;
  shops: ShopPrint[]; lastWrite: string | null; digest: string;
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);
const sha = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 16);

export async function fingerprint(db: pg.Pool, { marker }: { marker?: string } = {}): Promise<Print> {
  const at = (await db.query<{ now: Date }>('select now()')).rows[0].now;
  const migrations = (await db.query<{ name: string }>('select name from schema_migrations order by name')).rows.map(r => r.name);
  const rlsTables = Number((await db.query<{ n: string }>(
    `select count(*) as n from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity and c.relforcerowsecurity`)).rows[0].n);
  const appRole = (await db.query("select 1 from pg_roles where rolname = 'drivego_app' and rolcanlogin")).rowCount === 1;
  // Whether the role this runs as is beyond Row-Level Security (a superuser, or BYPASSRLS): the staff tools name the shop
  // in every change they make either way.
  const ownerSkipsRls = (await db.query("select 1 from pg_roles where rolname = current_user and (rolsuper or rolbypassrls)")).rowCount === 1;
  const list = (await db.query<{ id: string; code: string; package: string; status: string }>(
    'select id, code, package, status from shops order by code')).rows;
  const shops: ShopPrint[] = [];
  let lastWrite: Date | null = null;
  for (const s of list) {
    const p = await withShop(db, s.id, '*', async c => {
      const one = async <T>(sql: string) => (await c.query(sql, [s.id])).rows[0] as T;
      const r = await one<{ n: string; v: string; last: Date | null }>('select count(*) as n, coalesce(sum(version), 0) as v, max(updated_at) as last from records where shop_id = $1');
      const ch = await one<{ n: string; last: Date | null }>('select count(*) as n, max(at) as last from change_log where shop_id = $1');
      const w = await one<{ n: string; last: Date | null }>('select count(*) as n, max(at) as last from write_log where shop_id = $1');
      const b = await one<{ n: string }>('select count(*) as n from backups where shop_id = $1');
      const f = await one<{ n: string }>('select count(*) as n from files where shop_id = $1');
      const d = await one<{ n: string; s: string }>('select count(*) as n, coalesce(sum(last), 0) as s from doc_counters where shop_id = $1');
      const found = marker ? (await c.query<{ unit: string; n: string }>(
        'select unit, count(*) as n from records where shop_id = $1 and strpos(data::text, $2) > 0 group by unit order by unit', [s.id, marker])).rows : [];
      const last = [r.last, ch.last, w.last].filter(Boolean).sort((a, b) => +b! - +a!)[0] ?? null;
      if (w.last && (!lastWrite || w.last > lastWrite)) lastWrite = w.last;
      const counts = { records: Number(r.n), versions: Number(r.v), changes: Number(ch.n), saves: Number(w.n),
        backups: Number(b.n), files: Number(f.n), counters: Number(d.n), issued: Number(d.s) };
      return { code: s.code, package: s.package, status: s.status, ...counts, lastChange: iso(last),
        ...(marker ? { marker: Object.fromEntries(found.map(x => [x.unit, Number(x.n)])) } : {}),
        digest: sha([s.code, s.status, counts]) };
    });
    shops.push(p);
  }
  return { at: iso(at)!, migrations, rlsTables, appRole, ownerSkipsRls, shops, lastWrite: iso(lastWrite),
    digest: sha([migrations, rlsTables, appRole, shops.map(s => s.digest)]) };
}
