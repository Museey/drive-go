import pg from 'pg';

// One pool per server process. Next.js dev reloads modules, so the pool lives
// on globalThis instead of in this module. The app connects as drivego_app,
// which Row-Level Security applies to (server/db/migrations/0001_core.sql).
const holder = globalThis as typeof globalThis & { __drivegoPool?: pg.Pool };

export function pool(): pg.Pool {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  return (holder.__drivegoPool ??= new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 }));
}

// Branch scope of a transaction: '' Biz/ProX, '*' franchise HQ (all
// branches), or one franchise branch id.
export type Scope = string;

// Runs fn in one transaction that can only reach the given shop (and branch
// scope). Every query on a shop's tables goes through here; the values come
// from the server-side session, never from the request.
export async function withShop<T>(db: pg.Pool | pg.ClientBase, shopId: string, scope: Scope, fn: (c: pg.ClientBase) => Promise<T>): Promise<T> {
  const c = db instanceof pg.Pool ? await db.connect() : db;
  const own = c !== db;
  try {
    await c.query('begin');
    await c.query("select set_config('app.shop_id', $1, true), set_config('app.branch_scope', $2, true)", [shopId, scope]);
    const r = await fn(c);
    await c.query('commit');
    return r;
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    if (own) (c as pg.PoolClient).release();
  }
}
