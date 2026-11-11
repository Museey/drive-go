// The zip of attachments (zip.ts): read back as an unzip program does (tests/support/zip.ts), with and without ZIP64
// records, the length known before any file is read.
//   node --test server/lib/zip.test.ts   (npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readZip } from './zip-read.ts';
import { type ZipEntry, type Zip64, zipChunks, zipLength } from './zip.ts';

const at = new Date('2026-10-13T02:00:40Z');   // 09:00:40 in Bangkok
const entry = (name: string, bytes: Buffer, date = at): ZipEntry => ({ name, date, size: bytes.length, bytes: async () => bytes });
async function zipOf(entries: ZipEntry[], zip64: Zip64 = 'auto') {
  const chunks: Buffer[] = [];
  for await (const c of zipChunks(entries, zip64)) chunks.push(c);
  return Buffer.concat(chunks);
}

const FILES = [
  entry('รูปสินค้า/ผ้าเบรกหน้า.png', Buffer.from('\x89PNG\r\n\x1a\nnot a real picture')),
  entry('หลักฐาน/สลิปโอน 13-10.jpg', Buffer.alloc(70_000, 7)),
  entry('อื่น ๆ/ว่าง.txt', Buffer.alloc(0)),
];

for (const zip64 of ['auto', 'always'] as const) {
  test(`files, Thai names in UTF-8, dates in Bangkok time (ZIP64 ${zip64})`, async () => {
    const zip = await zipOf(FILES, zip64);
    assert.equal(zip.length, zipLength(FILES, zip64));
    const back = readZip(zip);
    assert.deepEqual(back.map(e => e.name), FILES.map(e => e.name));
    for (const [i, e] of back.entries()) {
      assert.ok(e.bytes.equals(await FILES[i].bytes()), e.name);
      assert.equal(e.utf8, true);
      assert.equal(e.zip64, zip64 === 'always');
      assert.equal(e.date, '2026-10-13 09:00');
    }
  });
}

test('an empty zip is a valid zip', async () => {
  const zip = await zipOf([]);
  assert.equal(zip.length, 22);
  assert.deepEqual(readZip(zip), []);
});

test('a file is read only when its turn comes, and must be as long as listed', async () => {
  const read: string[] = [];
  const lazy = (name: string, size: number, real = size): ZipEntry => ({ name, date: at, size, bytes: async () => { read.push(name); return Buffer.alloc(real); } });
  const it = zipChunks([lazy('a', 3), lazy('b', 5, 4)]);
  await it.next();                    // a's header
  assert.deepEqual(read, ['a']);
  await it.next();                    // a's bytes
  assert.deepEqual(read, ['a']);
  await assert.rejects(it.next(), /b: 4 bytes, 5 expected/);
  assert.deepEqual(read, ['a', 'b']);
});

test('ZIP64 offsets past 4 GiB: only the length is worked out (no 4 GiB in a test)', () => {
  const big = Array.from({ length: 3 }, (_, i) => ({ name: `f${i}`, date: at, size: 0xffff_0000 }));
  // Three local headers of 32 bytes, the files, central records (46 + 2; only the 3rd starts past 4 GiB and has a
  // 12-byte ZIP64 extra), the ZIP64 end record and locator (76) and the end record (22).
  assert.equal(zipLength(big), 3 * (32 + 0xffff_0000) + 3 * 48 + 12 + 76 + 22);
  assert.equal(zipLength(big.slice(0, 1)), 32 + 0xffff_0000 + 48 + 22);
  assert.throws(() => zipLength([{ name: 'x', date: at, size: 0xffff_ffff }]), /4 GiB/);
});
