import { test, expect } from '../support/test';
import { managerWithoutCost, costLeaves } from '../support/cost-blind';
import { formatDiff, stateDiff } from '../support/state-diff.mjs';
import { legacyStateChange } from '../support/legacy-golden';
import { storageApi } from '../support/storage-api';

// New behaviour (task 3.9, R14-ข): someone without "แสดงต้นทุน" (EMP004 here, without the cost switch and the jobs
// that see purchase prices) gets no cost from the server, yet counts the air-conditioning parts as S32's owner did.
// Since accountant review 4.2 (the owner's decision of 2026-10-29, S257) the cost of goods over is confirmed by whoever
// approves, so EMP004 cannot approve the count while AC-230 is over (nothing is saved); with the shortage only the
// server works out the cost of what the shortfall took (120) exactly as the legacy app did in S32.
const S32 = 'S32-stock-count-adjust.spec.ts';

test('S185 ระบบใหม่: พนักงานที่ไม่เห็นทุนตรวจนับสินค้า อนุมัติใบที่มีของเกินไม่ได้ (ต้องยืนยันทุน) อนุมัติส่วนขาดได้ server คิดต้นทุนของส่วนขาดให้ตรงกับระบบเดิม', async ({ app, page }) => {
  test.slow();
  await managerWithoutCost(app, page);
  await page.getByText('สต๊อกอะไหล่', { exact: true }).click();
  await page.getByRole('button', { name: 'ตรวจนับสินค้า' }).click();
  await page.getByRole('button', { name: '+ สร้างใบตรวจนับใหม่' }).click();
  await page.getByLabel('ผู้ตรวจนับ *').filter({ visible: true }).selectOption({ label: 'มานะ บริหารเก่ง · ผู้จัดการอู่' });
  await page.getByLabel('กรองเฉพาะหมวด').filter({ visible: true }).selectOption({ label: 'อะไหล่แอร์' });
  await page.getByRole('button', { name: '+ ดึงทั้งหมวดที่เลือกมาเพิ่ม' }).click();
  await page.getByRole('row').filter({ hasText: 'AC-215' }).filter({ visible: true }).getByRole('spinbutton').fill('17');
  await page.getByRole('row').filter({ hasText: 'AC-230' }).filter({ visible: true }).getByRole('spinbutton').fill('20');
  await page.getByLabel('หมายเหตุ').filter({ visible: true }).fill('ตรวจนับประจำเดือน');

  const before = await app.serverDB();
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await expect(page.getByText('ใบตรวจนับนี้มีของเกิน 1 รายการที่ต้องยืนยันทุน — ให้ผู้มีสิทธิ์เห็นต้นทุนอนุมัติ', { exact: true }).filter({ visible: true })).toBeVisible();
  await app.settle();
  expect(JSON.parse(formatDiff(stateDiff({ DB: before }, { DB: await app.serverDB() })))).toEqual({});

  // AC-230 as the register has it: the shortage only.
  await page.getByRole('row').filter({ hasText: 'AC-230' }).filter({ visible: true }).getByRole('spinbutton').fill('19');
  await page.getByRole('button', { name: 'อนุมัติเอกสาร' }).click();
  await expect(page.getByRole('button', { name: 'ตกลง' })).toBeVisible();
  await app.settle();
  const after = await app.serverDB();
  const was = { ...before };
  for (const [k, v] of Object.entries(after)) if (Array.isArray(v) && !(k in was)) was[k] = [];
  // S32's costs but for the lot of the surplus (and its move, the second).
  const legacy = costLeaves(JSON.parse(legacyStateChange(S32, 'approve-count')));
  expect(legacy).toEqual({ 'DB.moves.added[0].cost': 0, 'DB.moves.added[1].cost': 0, 'DB.fifo.lots.added[0].cost': 1600, 'DB.fifo.allocs.added[0].cost': 120 });
  expect(costLeaves(JSON.parse(formatDiff(stateDiff({ DB: was }, { DB: after }))))).toEqual({ 'DB.moves.added[0].cost': 0, 'DB.fifo.allocs.added[0].cost': 120 });
  const sent = (await storageApi(page).read('garage.v22')).data;
  for (const u of ['lots', 'allocs']) expect(sent.fifo[u].every((l: any) => l.cost === null), u).toBe(true);
});
