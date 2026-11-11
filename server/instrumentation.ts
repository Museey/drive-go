// Every request that failed on the server (an error a route did not handle: the browser gets 500) is recorded in
// table errors with the session's shop and person (server/lib/errors.ts; LAUNCH-CHECKLIST stage 1), besides Next's own
// log line. The hourly job alerts on it (server/lib/watch.ts).
import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  // Recording must never fail the request a second time nor hide the first error.
  try {
    const [{ pool }, { recordError }, { getSession }, { getStaffSession }] = await Promise.all([
      import('@/lib/db'), import('@/lib/errors'), import('@/lib/session'), import('@/lib/staff')]);
    const headers = new Headers();
    for (const [k, v] of Object.entries(request.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
    const req = new Request(new URL(request.path, 'http://app'), { headers });
    // The staff web page (/ops): who of the staff, instead of a shop's person.
    const st = request.path.startsWith('/api/ops/') ? await getStaffSession(req).catch(() => null) : null;
    const s = st ? null : await getSession(req).catch(() => null);
    const e = error as { message?: string; stack?: string; digest?: string };
    await recordError(pool(), { source: 'server', shopId: s?.shopId, userId: st ? `staff:${st.staff.login}` : s?.userId, path: request.path,
      message: `${request.method} ${context.routePath}: ${e?.message ?? String(error)}`, detail: e?.stack ?? '',
      agent: headers.get('user-agent') ?? '' });
  } catch (e) {
    console.error('could not record the error:', (e as Error).message);
  }
};
