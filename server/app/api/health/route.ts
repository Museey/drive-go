// The server is up and reaches its database (DigitalOcean's health check and Uptime check).
// ?deep=1 also says whether Row-Level Security holds for the app's connection (LAUNCH-CHECKLIST stage 1, checked from
// outside by tools/server-check.mjs): the app's role cannot skip it, and as a shop that does not exist no rows are seen.
// That part never fails the health check itself.
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await pool().query('select 1');
  } catch {
    return Response.json({ ok: false, db: false }, { status: 503 });
  }
  const body: { ok: true; db: true; rls?: boolean | null } = { ok: true, db: true };
  if (new URL(req.url).searchParams.get('deep') === '1') {
    // As a shop that does not exist: every shop's rows are someone else's, so none may be seen.
    const c = await pool().connect();
    try {
      await c.query('begin');
      await c.query("select set_config('app.shop_id', gen_random_uuid()::text, true), set_config('app.branch_scope', '*', true)");
      const role = await c.query<{ skips: boolean }>('select (rolsuper or rolbypassrls) as skips from pg_roles where rolname = current_user');
      const rows = await c.query<{ seen: boolean }>('select exists (select 1 from records) as seen');
      body.rls = role.rows.length === 1 && !role.rows[0].skips && !rows.rows[0].seen;
    } catch {
      body.rls = null;
    } finally {
      await c.query('rollback').catch(() => {});
      c.release();
    }
  }
  return Response.json(body);
}
