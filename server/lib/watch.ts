// The hourly job (.do/app.yaml job `watch`, tools/watch.mjs; LAUNCH-CHECKLIST stage 1 "แจ้งเตือนเมื่อระบบมีปัญหา"):
// the errors recorded since it last looked (table errors, errors.ts), grouped by message. Any server error, or
// BROWSER_ALERT browser errors in a run, means the team must look: the job then ends with status 3, which makes
// DigitalOcean's JOB_INVOCATION_FAILED alert e-mail them (as the nightly job does for shops to call).
import type pg from 'pg';

export const BROWSER_ALERT = 10;

export interface Seen { source: 'server' | 'browser'; shop: string; path: string; message: string; count: number; first: Date; last: Date }
export interface Look { since: Date; until: Date; seen: Seen[]; server: number; browser: number; alert: boolean }

export async function watch(db: pg.Pool): Promise<Look> {
  const c = await db.connect();
  try {
    await c.query('begin');
    // One run at a time: the mark is read and moved under its lock.
    await c.query("insert into watch_marks (name, at) values ('errors', now() - interval '1 hour') on conflict do nothing");
    // The times stay in the database (microseconds; a JavaScript Date keeps milliseconds): now() is the same all
    // through this transaction.
    const { rows: [m] } = await c.query<{ since: Date; until: Date }>(
      "select at as since, now() as until from watch_marks where name = 'errors' for update");
    const { rows } = await c.query<Seen & { count: string }>(
      `select e.source, coalesce(s.code, '') as shop, e.path, e.message, count(*) as count, min(e.at) as first, max(e.at) as last
         from errors e left join shops s on s.id = e.shop_id
        where e.at > (select at from watch_marks where name = 'errors') and e.at <= now()
        group by e.source, s.code, e.path, e.message order by e.source desc, count(*) desc, min(e.at)`);
    await c.query("update watch_marks set at = now() where name = 'errors'");
    await c.query('commit');
    const seen = rows.map(r => ({ ...r, count: Number(r.count) }));
    const total = (src: string) => seen.filter(r => r.source === src).reduce((a, r) => a + r.count, 0);
    const server = total('server'), browser = total('browser');
    return { since: m.since, until: m.until, seen, server, browser, alert: server > 0 || browser >= BROWSER_ALERT };
  } catch (e) {
    await c.query('rollback').catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
