// Errors of the server and of the browsers (LAUNCH-CHECKLIST stage 1 "แจ้งเตือนเมื่อระบบมีปัญหา"; table errors,
// 0007_errors.sql): what failed, where, for which shop and person, kept ERROR_DAYS days. The app only adds them;
// staff read them (tools/errors.mjs) and the hourly job alerts on new ones (watch.ts).
import type pg from 'pg';

export const ERROR_DAYS = 30;
const CUT = { path: 300, message: 1000, detail: 4000, agent: 300 };

export interface ErrorReport {
  source: 'server' | 'browser';
  shopId?: string | null;
  userId?: string | null;
  path?: string;
  message: string;
  detail?: string;
  agent?: string;
}

const cut = (s: unknown, n: number) => String(s ?? '').slice(0, n);
// A path without its query string (which may carry a search or a name).
export const pathOnly = (p: unknown) => cut(String(p ?? '').split(/[?#]/)[0], CUT.path);

export async function recordError(db: pg.Pool | pg.ClientBase, e: ErrorReport): Promise<void> {
  await db.query('insert into errors (source, shop_id, user_id, path, message, detail, agent) values ($1, $2, $3, $4, $5, $6, $7)',
    [e.source, e.shopId ?? null, e.userId ?? null, pathOnly(e.path), cut(e.message, CUT.message) || '(no message)', cut(e.detail, CUT.detail), cut(e.agent, CUT.agent)]);
}

// A page in a loop, or someone sending reports on purpose, must not fill the table: at most PER_KEY reports a
// minute from one session (or address), and ALL a minute in all. Counted in this process (one web instance).
const PER_KEY = 20, ALL = 300, MINUTE = 60_000;
const seen = new Map<string, number>();
let minute = 0, total = 0;
export function allowReport(key: string, now = Date.now()): boolean {
  const m = Math.floor(now / MINUTE);
  if (m !== minute) { minute = m; total = 0; seen.clear(); }
  const n = (seen.get(key) ?? 0) + 1;
  seen.set(key, n);
  return n <= PER_KEY && ++total <= ALL;
}

// Server errors (instrumentation.ts) the same way (security review 2026-11-23, docs/SECURITY-AUDIT-2026-11.md ก2: a
// request that failed on purpose, 550 a second, wrote 9 MB a minute and made every hourly job alert): the same message
// at most SERVER_PER_MESSAGE times a minute, SERVER_ALL a minute in all. What is left out is counted and said in the log.
const SERVER_PER_MESSAGE = 3, SERVER_ALL = 60;
const serverSeen = new Map<string, number>();
let serverMinute = 0, serverTotal = 0, serverDropped = 0;
export function allowServerError(message: string, now = Date.now()): boolean {
  const m = Math.floor(now / MINUTE);
  if (m !== serverMinute) {
    if (serverDropped) console.warn(`errors: ${serverDropped} more server error(s) in the last minute were not recorded`);
    serverMinute = m; serverTotal = 0; serverDropped = 0; serverSeen.clear();
  }
  const key = String(message).slice(0, 200);
  const n = (serverSeen.get(key) ?? 0) + 1;
  serverSeen.set(key, n);
  const ok = n <= SERVER_PER_MESSAGE && serverTotal < SERVER_ALL;
  if (ok) serverTotal++; else serverDropped++;
  return ok;
}
