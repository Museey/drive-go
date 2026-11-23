// lib/formats.ts: values the screens put into HTML unescaped (SECURITY-AUDIT-2026-11 ก5) are refused when they could
// end the attribute or tag they go into; what the screens and people normally write is kept.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatProblem, valueProblem } from './formats.ts';
import { split } from './units.ts';
import { readFixture } from './seed.ts';

const save = (unit: string, key: string, value: unknown) => ({ upsert: [{ unit, key, data: JSON.stringify(value) }], remove: [], order: {} });

test('id ที่ปิดเครื่องหมายคำพูดหรือแท็กได้ ไม่รับ ทั้งแถวและในข้อมูล', () => {
  assert.equal(formatProblem(save('DB.receipts', "x');alert(1);('", { id: "x');alert(1);('" })), "DB.receipts|x');alert(1);(': id");
  assert.equal(formatProblem(save('DB.receipts', 'R1', { id: 'R1', custId: 'C1"><img src=x onerror=alert(1)>' })), 'DB.receipts|R1: custId: id');
  assert.equal(formatProblem(save('DB.quotes', 'Q1', { id: 'Q1', items: [{ id: 'a&#39;b' }] })), 'DB.quotes|Q1: items.id: id');
  assert.equal(formatProblem(save('DB.hr', 'H1', { id: 'H1', empIds: ['E1', 'E2\\'] })), 'DB.hr|H1: empIds: id');
  assert.equal(formatProblem(save('DB.seq', "MA-RE'1", 3)), "DB.seq|MA-RE'1: id");
  // What the generators make, names people type, document numbers, the fallback key of a record without an id.
  for (const [unit, key, v] of [
    ['DB.receipts', 'MA-SA261000015', { id: 'MA-SA261000015', custId: 'C00028', items: [{ id: 'lq3k9x2a', name: 'ใบปัดน้ำฝน 22" (คู่)' }] }],
    ['DB.cust', 'C00028', { id: 'C00028', name: 'หจก. A & B "ช่างดี"', lineId: '@shop.th', taxId: '0105556000000' }],
    ['DB.stock', 'DC-OF21', { id: 'DC-OF21', cat: 'ยาง 15"', img: '/api/files/' + 'a'.repeat(64) }],
    ['DB.crm', '#0', { note: "it's <5 mm" }],
  ] as const) assert.equal(formatProblem(save(unit, key, v)), null, key);
});

test('สถานะใบเสนอราคา ประเภทรายการทุน สถานะใบขอเบิก ต้องไม่มีเครื่องหมายคำพูดหรือแท็ก', () => {
  assert.equal(formatProblem(save('DB.quotes', 'Q1', { id: 'Q1', status: '<img src=x onerror=alert(1)>' })), 'DB.quotes|Q1: status: label');
  assert.equal(formatProblem(save('DB.capital', 'K1', { id: 'K1', type: '<svg onload=alert(1)>' })), 'DB.capital|K1: type: label');
  assert.equal(formatProblem(save('FR.reqs', 'R1', { id: 'R1', status: '"><b>x' })), 'FR.reqs|R1: status: label');
  assert.equal(formatProblem(save('DB.quotes', 'Q1', { id: 'Q1', status: 'ส่งมอบรถ / ออกใบเสร็จแล้ว' })), null);
  assert.equal(formatProblem(save('DB.capital', 'K1', { id: 'K1', type: 'invest', note: 'ทุน <เพิ่ม>' })), null);
});

test('รูปและลิงก์: ไฟล์ของ server, data: URL หรือ http(s) ที่ไม่มีเครื่องหมายปิด attribute', () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  assert.equal(valueProblem({ img: png }), null);
  assert.equal(valueProblem({ logo: png, logoOp: 7 }), null);
  assert.equal(valueProblem({ img: { url: '/api/files/' + 'b'.repeat(64) } }), null);
  assert.equal(valueProblem({ url: 'https://chain.example.co.th/api' }), null);
  assert.equal(valueProblem({ img: png + '" onerror="alert(1)' }), 'img: picture');
  assert.equal(valueProblem({ logo: 'x" onerror="alert(1)' }), 'logo: picture');
  assert.equal(valueProblem({ img: { url: 'javascript:alert(1)' } }), 'img.url: picture');
  assert.equal(valueProblem({ data: 'javascript:alert(1)' }, '', true), 'data: file');
  assert.equal(valueProblem({ data: 'javascript:alert(1)' }), null, 'data of other records is not a link');
  assert.equal(formatProblem(save('DB.px.learn', 'L1', { id: 'L1', data: 'javascript:alert(document.cookie)' })), 'DB.px.learn|L1: data: file');
});

test('ข้อมูลตั้งต้นทั้ง 3 แพ็กเกจผ่านทุกแถว', () => {
  for (const name of ['biz-trial', 'prox-trial', 'franchise-trial']) {
    const { store } = readFixture(new URL(`../../tests/fixtures/${name}.json`, import.meta.url));
    for (const [key, text] of Object.entries(store)) {
      if (!/^(garage\.v22(::[^.]+)?|franchise\.v22|dgb\.v22)$/.test(key) || !text) continue;
      const { rows } = split(key, text);
      assert.equal(formatProblem({ upsert: rows, remove: [], order: {} }), null, `${name} ${key}`);
    }
  }
});
