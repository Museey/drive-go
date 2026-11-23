import { test, expect } from '../support/test';
import { LEGACY_ORIGIN } from '../support/config.mjs';
import { recordedErrors } from '../support/new-shop.mjs';

// Security review 2026-11-23 (docs/SECURITY-AUDIT-2026-11.md ก1; the owner: "ทำข้อที่คุณทำเองได้ก่อนเลยครับ"): the server
// answers a request without a session before it reads the request's body or waits for a turn of the heavy requests.
// Before, a save's body (up to 30 MB) was read and parsed first, so a few such requests from anyone ran the server out
// of memory, and an empty one ended in a server error that was written to the errors table. A signed-in browser may
// keep at most 10 live channels open at once (one per tab); one more is refused until one closes.
test('S476 ระบบใหม่: คำขอที่ไม่ได้เข้าระบบถูกปฏิเสธก่อนอ่านข้อมูลที่ส่งมา ช่องอัปเดตสดเปิดพร้อมกันได้ไม่เกิน 10 ช่องต่อการเข้าระบบ และ server รับเฉพาะข้อมูลที่รู้จัก', async ({ app, page, playwright }) => {
  test.slow();
  const anon = await playwright.request.newContext({ baseURL: LEGACY_ORIGIN });
  const big = 'x'.repeat(29 * 1024 * 1024);
  for (const [method, path, data] of [
    ['POST', '/api/storage/garage.v22', big],
    ['POST', '/api/storage/garage.v22', '{}'],
    ['PUT', '/api/storage/dgb.v22.anything', big],
    ['POST', '/api/storage/garage.v22/rows', '{"rows":[]}'],
    ['GET', '/api/storage/garage.v22', undefined],
  ] as const) {
    const r = await anon.fetch(path, { method, data, headers: { 'content-type': 'application/json' } });
    expect([method, path, r.status(), await r.json()]).toEqual([method, path, 401, { error: 'signed-out' }]);
  }
  await anon.dispose();

  // Signed in: 10 live channels open, the 11th is refused; once one closes, another opens. (Opened from here, not from
  // the page: a browser keeps at most 6 connections to one server over HTTP/1.1.)
  await app.loginAsOwner();
  const cookie = (await page.context().cookies()).map(c => `${c.name}=${c.value}`).join('; ');   // (Secure: not listed for an http address)
  const streams: AbortController[] = [];
  const open = async () => {
    const c = new AbortController();
    const r = await fetch(`${LEGACY_ORIGIN}/api/live`, { headers: { cookie }, signal: c.signal });
    if (r.status === 200) streams.push(c); else await r.body?.cancel();
    return r.status;
  };
  const statuses: number[] = [];
  for (let i = 0; i < 11; i++) statuses.push(await open());
  // The program's own channel is one of the 10.
  expect(statuses.filter(s => s === 200).length).toBe(9);
  expect(statuses.slice(-2)).toEqual([429, 429]);
  streams.shift()!.abort();
  await expect.poll(open).toBe(200);
  streams.forEach(c => c.abort());

  // Signed in (SECURITY-AUDIT ก2): a save that is not shaped as one is a bad request, not a server error written to the
  // errors table; only the keys the screens keep beside their data are taken, each at its size.
  const send = async (method: string, path: string, body: string) => {
    const r = await fetch(`${LEGACY_ORIGIN}${path}`, { method, body, headers: { cookie, 'content-type': 'application/json' } });
    return [r.status, await r.json()];
  };
  expect(await send('POST', '/api/storage/garage.v22', '{"base":{},"changes":{}}')).toEqual([400, { error: 'bad request' }]);
  expect(await send('PUT', '/api/storage/dgb.anything.v22', 'x'.repeat(1000))).toEqual([400, { error: 'not a known key', what: 'dgb.anything.v22' }]);
  expect(await send('PUT', '/api/storage/dgb.guide.v22', 'x'.repeat(100))).toEqual([413, { error: 'too-large' }]);
  expect(await send('PUT', '/api/storage/dgb.guide.v22', '1')).toEqual([200, { ok: true }]);
  expect((await recordedErrors(page)).filter((e: { source: string }) => e.source === 'server')).toEqual([]);
});
