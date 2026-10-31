// k6/http's asyncRequest with fetch: the answer's status, headers (k6's spelling), body, timings.duration; a request
// that fails or runs out of time has status 0 and error, as in k6.
import { metric } from './state.mjs';
const seconds = t => typeof t === 'number' ? t / 1000 : /ms$/.test(t) ? parseFloat(t) / 1000 : /m$/.test(t) ? parseFloat(t) * 60 : parseFloat(t);
const canonical = n => n.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('-');
async function asyncRequest(method, url, body = null, params = {}) {
  const t0 = performance.now();
  const timeout = AbortSignal.timeout(seconds(params.timeout ?? '60s') * 1000);
  const res = { status: 0, headers: {}, body: null, error: '', timings: { duration: 0 }, request: { method, url } };
  try {
    const r = await fetch(url, { method, headers: params.headers || {}, body: body ?? undefined, signal: timeout, redirect: 'manual' });
    res.status = r.status;
    r.headers.forEach((v, k) => { if (k !== 'set-cookie') res.headers[canonical(k)] = v; });
    const cookies = r.headers.getSetCookie();
    if (cookies.length) res.headers['Set-Cookie'] = cookies.join(', ');
    if (params.responseType === 'none') { for await (const _ of r.body ?? []) { /* read and drop */ } }
    else res.body = await r.text();
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') res.error = 'request timeout';
    else res.error = String(e.cause?.code || e.message);
    if (res.status && res.error) res.status = 0;
  }
  res.timings.duration = performance.now() - t0;
  res.json = () => JSON.parse(res.body);
  metric('http_reqs', 'counter').add(1);
  metric('http_req_duration', 'trend', true).add(res.timings.duration);
  metric('http_req_failed', 'rate').add(res.status === 0 || res.status >= 400);
  return res;
}
export default { asyncRequest };
export { asyncRequest };
