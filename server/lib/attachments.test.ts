// What counts as an attachment in the shop's data (task 3.11).
//
//   npm run test:unit
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dataUrlsIn, isDataUrl, limitOf, linksIn, parseDataUrl, replaceStrings, useOf } from './attachments.ts';

const ID = 'a'.repeat(64);

test('ข้อความ data: ที่เป็นไฟล์ และชนิดของมัน', () => {
  assert.deepEqual(parseDataUrl('data:image/jpeg;base64,AAAA'), { mime: 'image/jpeg', base64: true, payload: 'AAAA' });
  assert.deepEqual(parseDataUrl('data:,hello%20x'), { mime: 'text/plain', base64: false, payload: 'hello%20x' });
  assert.equal(isDataUrl('data: ไม่ใช่ไฟล์'), false);
  assert.equal(isDataUrl('ข้อมูล data:image/png;base64,AA'), false);
});

test('หาไฟล์ในรายการพร้อมชื่อไฟล์ แล้วแทนด้วยลิงก์โดยไม่เปลี่ยนวัตถุเดิม', () => {
  const slips = [{ url: 'data:image/jpeg;base64,AA', name: 'สลิป.jpg', line: 1 }];
  const item = { title: 'x', fname: 'คู่มือ.pdf', data: 'data:application/pdf;base64,BB', tags: ['data:image/png;base64,CC'] };
  assert.deepEqual(dataUrlsIn(slips), [{ url: 'data:image/jpeg;base64,AA', name: 'สลิป.jpg' }]);
  assert.deepEqual(dataUrlsIn(item).map(f => f.name), ['คู่มือ.pdf', '']);
  const map = new Map([['data:image/jpeg;base64,AA', `/api/files/${ID}`], ['data:image/png;base64,CC', '/api/files/c']]);
  const first = slips[0];
  assert.equal(replaceStrings(slips, map), slips);
  assert.equal(slips[0], first);
  assert.equal(first.url, `/api/files/${ID}`);
  replaceStrings(item, map);
  assert.deepEqual(item.tags, ['/api/files/c']);
  assert.equal(replaceStrings('data:image/jpeg;base64,AA', map), `/api/files/${ID}`);
  assert.deepEqual(linksIn(JSON.stringify(slips) + `/api/files/${ID}`), [ID]);
});

test('ขนาดสูงสุดและชนิดการใช้ตามช่อง', () => {
  assert.equal(limitOf('application/pdf'), 5 * 1024 * 1024);
  assert.equal(limitOf('video/mp4'), 15 * 1024 * 1024);
  assert.deepEqual(['DB.paySlips', 'DB.whtDocs', 'DB.purchases', 'DB.stock', 'DB.px.learn', 'DB.cust'].map(useOf),
    ['evidence', 'evidence', 'evidence', 'picture', 'knowledge', 'other']);
});
