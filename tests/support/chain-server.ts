// A stand-in for the ProX chain server ("Live v2 Multi-Branch", task T13).
// The real server does not exist yet (decision Q4), so its API is the one the
// legacy app calls (legacy lines 19097-19254: pxNetApi and its callers), with
// answers shaped the way that code reads them. It runs inside the test's own
// browser (page.route) at a fixed address, so nothing listens on a port and
// the address the app saves (DB.px.net.url) is the same on every run.
// Messages it answers with are its own: the legacy app only shows them.
import { expect, type Page } from '@playwright/test';

export const CHAIN_URL = 'https://chain.drivego.test';

// The fixed clock (tests/support/config.mjs): what the server stamps on new records.
const NOW = '2026-10-13T09:00:00';

export interface Booking {
  id: number; status: 'wait' | 'accepted' | 'billed' | 'paid';
  plate: string; car: string; owner: string; service: string; created_at: string;
  rc_no?: string; amount?: number;
}
export interface DcProduct { id: number; code: string; oem: string; name: string; cat: string; unit: string; cost: number; price: number; stock_hq: number }
export interface DcItem { product_id: number; code: string; name: string; unit: string; cost: number; qty: number }
export interface DcRequest { id: number; status: 'requested' | 'approved' | 'shipped' | 'received' | 'rejected'; created_at: string; note: string; items: DcItem[] }
export interface ChainSetup {
  accounts: { username: string; password: string; display: string; branch: string }[];
  queue?: Booking[];
  products?: DcProduct[];
  requests?: DcRequest[];
}

export async function chainServer(page: Page, setup: ChainSetup) {
  const state = {
    queue: structuredClone(setup.queue ?? []),
    products: structuredClone(setup.products ?? []),
    requests: structuredClone(setup.requests ?? []),
    coins: {} as Record<string, number>,
    stockReports: [] as unknown[][],
    // The chain cannot be reached (task 3.12, answer 12.7): every request fails as a lost connection would.
    down: false,
  };
  const calls: string[] = [];
  const waiting: { path: string; done: () => void }[] = [];
  await page.route(`${CHAIN_URL}/api/**`, async route => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    calls.push(`${req.method()} ${path}`);
    if (state.down) return route.abort('connectionrefused');
    const body = req.postDataJSON?.() ?? null;
    const signedIn = setup.accounts.find(a => req.headers().authorization === `Bearer token-${a.username}`);
    const answer = async (status: number, json: unknown) => {
      await route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(json) });
      for (const w of waiting.filter(x => x.path === path)) { waiting.splice(waiting.indexOf(w), 1); w.done(); }
    };
    const id = Number(path.split('/').pop());
    const booking = state.queue.find(b => b.id === id);
    const request = state.requests.find(r => r.id === id);

    if (path === '/api/auth/login') {
      const a = setup.accounts.find(x => x.username === body?.username && x.password === body?.password);
      if (!a) return answer(401, { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      return answer(200, { token: `token-${a.username}`, user: { display: a.display, role: 'branch', branch: { name: a.branch } } });
    }
    if (!signedIn) return answer(401, { error: 'กรุณาเข้าสู่ระบบ' });
    if (path === '/api/queue') return answer(200, state.queue);
    if (path.startsWith('/api/accept/')) {
      if (!booking || booking.status !== 'wait') return answer(409, { error: 'คิวนี้มีสาขาอื่นรับไปแล้ว' });
      booking.status = 'accepted';
      return answer(200, { ok: true, booking });
    }
    if (path.startsWith('/api/bill/')) {
      if (!booking || booking.status !== 'accepted') return answer(409, { error: 'คิวนี้ออกใบเสร็จไม่ได้' });
      Object.assign(booking, { status: 'billed', amount: body.amount, rc_no: `RC-${booking.id}` });
      return answer(200, { ok: true, booking });
    }
    if (path.startsWith('/api/pay/')) {
      if (!booking || booking.status !== 'billed') return answer(409, { error: 'คิวนี้ยังไม่ได้ออกใบเสร็จ' });
      booking.status = 'paid';
      const earn = Math.floor((booking.amount ?? 0) / 100);
      state.coins[booking.plate] = (state.coins[booking.plate] ?? 0) + earn;
      return answer(200, { ok: true, earn, total: state.coins[booking.plate] });
    }
    if (path === '/api/stock/report') {
      state.stockReports.push(body.items);
      return answer(200, { ok: true, synced: body.items.length });
    }
    if (path === '/api/dc/products') return answer(200, state.products);
    if (path === '/api/dc/requests') return answer(200, state.requests);
    if (path === '/api/dc/request') {
      const items = body.items.map((i: { product_id: number; qty: number }) => {
        const p = state.products.find(x => x.id === i.product_id)!;
        return { product_id: p.id, code: p.code, name: p.name, unit: p.unit, cost: p.cost, qty: i.qty };
      });
      const r: DcRequest = { id: Math.max(0, ...state.requests.map(x => x.id)) + 1, status: 'requested', created_at: NOW, note: body.note ?? '', items };
      state.requests.unshift(r);
      return answer(200, { ok: true, request: r });
    }
    if (path.startsWith('/api/dc/receive/')) {
      if (!request || request.status !== 'shipped') return answer(409, { error: 'คำขอนี้ยังไม่ได้จัดส่ง' });
      request.status = 'received';
      return answer(200, { ok: true, request });
    }
    return answer(404, { error: 'not found' });
  });
  // While online the app reloads its tables from the server every 7 seconds,
  // which also empties a number being typed into them (an amount, a quantity),
  // as it would for a person. A test types right after a reload: resolves a
  // moment after the server has answered the next request to `path`.
  const nextPoll = (path: string) => new Promise<void>(resolve =>
    waiting.push({ path, done: () => setTimeout(resolve, 300) }));
  return { calls, state, nextPoll };
}

// Connects the open ProX app (menu P1, "คิวจองจาก BOOK") to the chain server
// through its own form, as a garage would.
export async function connectToChain(page: Page, user: string, pass: string) {
  await page.getByPlaceholder('URL เซิร์ฟเวอร์ เช่น https://drivegobiz.com').fill(CHAIN_URL);
  await page.getByPlaceholder('ผู้ใช้สาขา (เช่น rangsit)').fill(user);
  await page.getByPlaceholder('รหัสผ่าน').filter({ visible: true }).fill(pass);
  await page.getByRole('button', { name: '🔌 เชื่อมต่อสาขา' }).click();
}

// The stock report the app sends once it is connected (and after receiving
// goods) ends with this message; waiting for it keeps the steps' messages in order.
export const stockSynced = (page: Page) =>
  expect(page.getByText(/^📤 ซิงก์สต๊อกขึ้นเซิร์ฟเวอร์แล้ว/)).toBeVisible();
