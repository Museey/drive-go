// Errors a page did not catch (LAUNCH-CHECKLIST stage 1 "แจ้งเตือนเมื่อระบบมีปัญหา"): sent to the server
// (POST /api/errors, server/lib/errors.ts) so that staff see what went wrong for a shop and the hourly job can
// alert them. Each message at most twice and at most MAX a page, so that a loop cannot flood the server; the
// person using the page sees nothing of it.
const MAX = 20, SAME = 2;

type Win = { addEventListener(type: string, fn: (e: Event) => void): void; location: { pathname: string; origin: string; href: string } };
export type Post = (body: string) => Promise<unknown>;

export function reportErrors(win: Win, post: Post): void {
  const times = new Map<string, number>();
  let sent = 0;
  const send = (message: string, detail: string) => {
    const n = (times.get(message) ?? 0) + 1;
    times.set(message, n);
    if (n > SAME || sent >= MAX) return;
    sent++;
    post(JSON.stringify({ message: message.slice(0, 1000), detail: detail.slice(0, 4000), path: win.location.pathname })).catch(() => {});
  };
  win.addEventListener('error', ev => {
    const e = ev as Partial<ErrorEvent>;
    // A script of another site (a browser extension …) tells nothing ("Script error.", no error object) or has its own
    // address: not the app's to fix. The page's own code — its files, inline scripts, onclick attributes — is.
    let foreign = !e.error;
    if (e.filename) try { foreign ||= new URL(e.filename, win.location.href).origin !== win.location.origin; } catch { foreign = true; }
    if (foreign) return;
    send(e.message || 'error', e.error?.stack || `${e.filename}:${e.lineno}:${e.colno}`);
  });
  win.addEventListener('unhandledrejection', ev => {
    const r = (ev as Partial<PromiseRejectionEvent>).reason as { message?: string; stack?: string } | string | undefined;
    send(`unhandled rejection: ${typeof r === 'object' && r ? r.message ?? String(r) : String(r)}`, typeof r === 'object' && r ? r.stack ?? '' : '');
  });
}

// What the program met that the person cannot tell staff in full — a save refused or not taken, a reload asked for, the
// screen covered while the server could not be reached (2026-11-28: a garage reported the program slow and "kicked
// out", and none of it had reached the server): sent like an error, each at most twice and at most MAX a page.
const problemTimes = new Map<string, number>();
let problemsSent = 0;
export function reportProblem(message: string, detail = '', post: Post = postError): void {
  const n = (problemTimes.get(message) ?? 0) + 1;
  problemTimes.set(message, n);
  if (n > SAME || problemsSent >= MAX) return;
  problemsSent++;
  const path = typeof location === 'undefined' ? '' : location.pathname;
  post(JSON.stringify({ message: message.slice(0, 1000), detail: detail.slice(0, 4000), path })).catch(() => {});
}

export const postError: Post = body => fetch('/api/errors', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true, credentials: 'same-origin' });
