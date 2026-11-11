// The zip of every attachment (files-zip.ts): names every computer can save, a folder per kind, no two the same, and
// the list that maps the JSON backup's links to the files.
//   node --test server/lib/files-zip.test.ts   (npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readZip } from '../../tests/support/zip.ts';
import { type Listed, fileName, zipEntries, zipFileName, zipNames } from './files-zip.ts';
import { zipChunks } from './zip.ts';

const id = (c: string) => c.repeat(64);
const at = new Date('2026-10-13T01:30:00Z');   // 08:30 in Bangkok
const f = (o: Partial<Listed>): Listed => ({ id: id('a'), mime: 'image/jpeg', size: 3, name: '', use: 'picture', at, ...o });

test('a name every computer can save, with the type\'s extension', () => {
  assert.equal(fileName(f({ name: 'ผ้าเบรกหน้า' })), 'ผ้าเบรกหน้า.jpg');
  assert.equal(fileName(f({ name: 'สลิปโอน 13-10.png', mime: 'image/png' })), 'สลิปโอน 13-10.png');
  assert.equal(fileName(f({ name: 'ผ้าเบรก 1/2 "หน้า" <ซ้าย>:*?|' })), 'ผ้าเบรก 1_2 _หน้า_ _ซ้าย_____.jpg');
  assert.equal(fileName(f({ name: '../../etc/passwd', mime: 'text/plain' })), '_.._etc_passwd.txt');
  assert.equal(fileName(f({ name: '  ..  ', mime: 'application/pdf' })), 'aaaaaaaaaaaa.pdf');
  assert.equal(fileName(f({ name: 'con' })), '_con.jpg');
  assert.equal(fileName(f({ name: 'ไดสตาร์ท 12V/2.0kW' })), 'ไดสตาร์ท 12V_2.0kW.jpg');
  assert.equal(fileName(f({ name: 'ใบเสร็จ.PDF', mime: 'image/png' })), 'ใบเสร็จ.PDF');
  assert.equal(fileName(f({ name: 'บรรทัด\nใหม่\tแท็บ', mime: 'application/x-unknown' })), 'บรรทัด_ใหม่_แท็บ');
  assert.equal([...fileName(f({ name: 'ก'.repeat(200) }))].length, 84);
});

test('a folder per kind, no two names the same in a folder', () => {
  const files = [
    f({ name: 'ผ้าเบรกหน้า' }), f({ id: id('b'), name: 'ผ้าเบรกหน้า' }), f({ id: id('c'), name: 'ผ้าเบรกหน้า.JPG' }),
    f({ id: id('d'), name: 'ผ้าเบรกหน้า', use: 'evidence' }), f({ id: id('e'), name: 'คู่มือ', use: 'knowledge', mime: 'application/pdf' }),
    f({ id: id('f'), name: '', use: 'other', mime: 'image/png' }),
  ];
  assert.deepEqual(zipNames(files), [
    'รูปสินค้า/ผ้าเบรกหน้า.jpg', 'รูปสินค้า/ผ้าเบรกหน้า (2).jpg', 'รูปสินค้า/ผ้าเบรกหน้า (3).JPG',
    'หลักฐานทางบัญชี/ผ้าเบรกหน้า.jpg', 'คลังความรู้/คู่มือ.pdf', 'อื่น ๆ/ffffffffffff.png',
  ]);
});

test('the zip: the list first (links of the JSON backup, safe in a spreadsheet), then the files', async () => {
  const files = [f({ name: 'ผ้าเบรก' }), f({ id: id('b'), name: '=HYPERLINK("x")', use: 'evidence', mime: 'image/png', size: 4 })];
  const bytes: Record<string, Buffer> = { [id('a')]: Buffer.from('abc'), [id('b')]: Buffer.from('wxyz') };
  const { entries, length } = zipEntries(files, async x => bytes[x.id], new Date('2026-10-13T02:00:00Z'));
  const chunks: Buffer[] = [];
  for await (const c of zipChunks(entries)) chunks.push(c);
  const zip = Buffer.concat(chunks);
  assert.equal(zip.length, length);
  const back = readZip(zip);
  assert.deepEqual(back.map(e => e.name), ['รายการไฟล์แนบ.csv', 'รูปสินค้า/ผ้าเบรก.jpg', 'หลักฐานทางบัญชี/=HYPERLINK(_x_).png']);
  assert.equal(back[1].bytes.toString(), 'abc');
  assert.equal(back[1].date, '2026-10-13 08:30');
  assert.equal(back[0].bytes.toString('utf8'), '﻿' + [
    'ไฟล์ในชุดนี้,ลิงก์ในไฟล์สำรอง (JSON),ชนิดไฟล์,ขนาด (ไบต์),วันที่แนบ',
    `รูปสินค้า/ผ้าเบรก.jpg,/api/files/${id('a')},image/jpeg,3,2026-10-13 08:30`,
    `หลักฐานทางบัญชี/=HYPERLINK(_x_).png,/api/files/${id('b')},image/png,4,2026-10-13 08:30`,
  ].join('\r\n') + '\r\n');
  assert.equal(zipFileName('2026-10-14'), 'garage-files-2026-10-14.zip');
  assert.match(zipFileName(), /^garage-files-\d{4}-\d{2}-\d{2}\.zip$/);
});
