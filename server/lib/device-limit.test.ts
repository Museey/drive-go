// The sign-in limit per device (auth.ts DEVICE; security review proposal 1): 30 failures within 15 minutes from one
// address and it waits; the wait ends 15 minutes after the failures; other addresses are not touched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEVICE, deviceFailed, deviceLocked } from './auth.ts';
import { clientAddress } from './api.ts';

test('เครื่องเดียวผิดครบ 30 ครั้งใน 15 นาทีต้องรอ ครบ 15 นาทีหลังครั้งที่ผิดแล้วเข้าได้อีก เครื่องอื่นไม่เกี่ยว', () => {
  const t0 = Date.UTC(2026, 9, 31, 2, 0, 0), minute = 60_000;
  for (let i = 0; i < DEVICE.failures - 1; i++) deviceFailed('A', t0 + i * 10_000);
  assert.equal(deviceLocked('A', t0 + 5 * minute), false);
  deviceFailed('A', t0 + 5 * minute);
  assert.equal(deviceLocked('A', t0 + 5 * minute), true);
  assert.equal(deviceLocked('B', t0 + 5 * minute), false);
  // The first failures leave the window one by one: 15 minutes after the first one, 29 are left.
  assert.equal(deviceLocked('A', t0 + 15 * minute + 1), false);
  assert.equal(deviceLocked('A', t0 + 20 * minute + 1), false);
});

test('ที่อยู่ของเครื่องคือตัวท้ายของ X-Forwarded-For (ที่ load balancer ใส่) ตัวหน้าที่เบราว์เซอร์ส่งมาเองไม่นับ', () => {
  const req = (h?: string) => new Request('http://app/api/auth/login', { headers: h === undefined ? {} : { 'x-forwarded-for': h } });
  assert.equal(clientAddress(req('1.2.3.4')), '1.2.3.4');
  assert.equal(clientAddress(req('9.9.9.9, 1.2.3.4')), '1.2.3.4');
  assert.equal(clientAddress(req()), '');
});
