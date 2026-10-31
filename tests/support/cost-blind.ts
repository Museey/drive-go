// Scenarios where someone who may not see costs does what a legacy scenario's owner did (task 3.9): the server
// must end up with the same costs the legacy app worked out with every cost in hand. Only for TARGET=new.
import type { Page } from '@playwright/test';
import { expect } from './test';
import { formatDiff, stateDiff } from './state-diff.mjs';
import { legacyStateChange } from './legacy-golden';
import { storageApi } from './storage-api';

type App = { loginAsOwner(): Promise<void>; login(u: string, p: string): Promise<void>; settle(): Promise<void>; state(): Promise<any> };

// EMP004 (the garage manager: every right) without "แสดงต้นทุน" and without any job that sees purchase prices
// (goods receipts and their approval, paying vendors, payables, the finance summaries), signed in.
export async function managerWithoutCost(app: App, page: Page) {
  await app.loginAsOwner();
  await page.getByRole('button', { name: '09 งานบุคคล' }).click();
  await page.getByRole('row').filter({ hasText: 'EMP004' }).getByRole('button', { name: 'แก้ไข / สิทธิ' }).click();
  await page.getByRole('radio', { name: 'ไม่แสดงต้นทุน', exact: true }).check();
  for (const name of ['ดูสรุปการเงิน ภาษี และเงินเดือน', 'จ่ายเงินเจ้าหนี้', '06.1 · ซื้อสินค้า (ใบรับสินค้า) · เข้าดู', '08 · เจ้าหนี้ (ค้างจ่าย) · เข้าดู'])
    await page.getByRole('checkbox', { name, exact: true }).uncheck();
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).last().click();
  await app.settle();
  const perms = (await app.state()).DB.emp.find((e: any) => e.code === 'EMP004').perms;
  expect(perms).toMatchObject({ stock: { cost: false }, doc: { fin: false, payGr: false, emp: true }, sub: { buyGr: false, acctAp: false }, apv: { gr: false } });
  await page.getByRole('button', { name: '10 ตั้งค่าองค์กร' }).click();
  const staff = page.getByRole('row').filter({ hasText: 'EMP004' });
  await staff.getByRole('button', { name: '+ ออกบัญชี (ตั้งรหัสผ่าน)' }).click();
  await page.locator('input:focus').waitFor();
  await page.keyboard.type('44444444');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).filter({ visible: true }).click();
  await expect(staff).toContainText('ใช้งานได้');
  await page.getByText('ออกจากระบบ', { exact: true }).filter({ visible: true }).first().click();
  await page.getByPlaceholder('กรอกรหัสผ่าน').waitFor();
  await app.login('081-900-1122', '44444444');
}

// Every cost in a change (fields named cost, cogs, creditAmt): where it is and what it is.
export function costLeaves(diff: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const walk = (v: unknown, path: string) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
      if (/^(cost|cogs|creditAmt)$/.test(k)) out[`${path}.${k}`] = x;
      else walk(x, `${path}.${k}`);
    }
  };
  for (const [k, v] of Object.entries(diff as Record<string, unknown>)) {
    if (/\.(cost|cogs|creditAmt)$/.test(k)) out[k] = v; else walk(v, k);
  }
  return out;
}

// The costs the server now holds changed as the legacy scenario's did, and what the server sends the person has
// none (their browser keeps whatever it worked out itself without them, e.g. 0 for a lot it opened).
export async function sameCostsAsLegacy(app: App & { serverDB(): Promise<any> }, page: Page, scenario: string, name: string, before: any) {
  const after = await app.serverDB();
  // A list the shop has never had a row in is not stored; the legacy app had it empty.
  const was = { ...before };
  for (const [k, v] of Object.entries(after)) if (Array.isArray(v) && !(k in was)) was[k] = [];
  const actual = JSON.parse(formatDiff(stateDiff({ DB: was }, { DB: after })));
  const expected = JSON.parse(legacyStateChange(scenario, name));
  const want = costLeaves(expected);
  expect(Object.keys(want).length, 'the legacy change has costs').toBeGreaterThan(0);
  expect(costLeaves(actual)).toEqual(want);
  const sent = (await storageApi(page).read('garage.v22')).data;
  expect(sent.stock.every((s: any) => s.cost === null), 'no cost sent').toBe(true);
  for (const u of ['lots', 'allocs']) expect(sent.fifo[u].every((l: any) => l.cost === null), u).toBe(true);
  expect(sent.moves.every((m: any) => m.cost === null), 'moves').toBe(true);
}
