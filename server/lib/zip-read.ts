// Reads a zip the way an unzip program does, from the end: the (ZIP64) end record, the central directory, then each
// entry's local header and bytes, checking every CRC. For the tests of the zip of attachments (zip.ts, S287): stored
// entries only, so a compressed entry is an error here. Kept in server/ because the image builds server/ alone and
// type-checks its unit tests.
import { crc32 } from 'node:zlib';

export interface ZipRead { name: string; bytes: Buffer; date: string; utf8: boolean; zip64: boolean }

export function readZip(zip: Buffer): ZipRead[] {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0 || eocd + 22 > zip.length) throw new Error('no end of central directory');
  let count = zip.readUInt16LE(eocd + 10), cdSize = zip.readUInt32LE(eocd + 12), cdAt = zip.readUInt32LE(eocd + 16);
  if (count === 0xffff || cdSize === 0xffffffff || cdAt === 0xffffffff) {
    const loc = eocd - 20;
    if (zip.readUInt32LE(loc) !== 0x07064b50) throw new Error('no ZIP64 locator');
    const z = Number(zip.readBigUInt64LE(loc + 8));
    if (zip.readUInt32LE(z) !== 0x06064b50) throw new Error('no ZIP64 end record');
    count = Number(zip.readBigUInt64LE(z + 32));
    cdSize = Number(zip.readBigUInt64LE(z + 40));
    cdAt = Number(zip.readBigUInt64LE(z + 48));
    if (cdAt + cdSize !== z) throw new Error('central directory not before the ZIP64 end record');
  } else if (cdAt + cdSize !== eocd) throw new Error('central directory not before the end record');
  const out: ZipRead[] = [];
  let p = cdAt;
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error(`central record ${i}: bad signature`);
    const flags = zip.readUInt16LE(p + 8), method = zip.readUInt16LE(p + 10);
    const time = zip.readUInt16LE(p + 12), date = zip.readUInt16LE(p + 14), crc = zip.readUInt32LE(p + 16);
    const size = zip.readUInt32LE(p + 20), nameLen = zip.readUInt16LE(p + 28), extraLen = zip.readUInt16LE(p + 30), commentLen = zip.readUInt16LE(p + 32);
    let at = zip.readUInt32LE(p + 42);
    const name = zip.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    let zip64 = false;
    for (let x = p + 46 + nameLen; x < p + 46 + nameLen + extraLen;) {
      const id = zip.readUInt16LE(x), len = zip.readUInt16LE(x + 2);
      if (id === 0x0001 && at === 0xffffffff) { at = Number(zip.readBigUInt64LE(x + 4)); zip64 = true; }
      x += 4 + len;
    }
    if (method !== 0) throw new Error(`${name}: compressed (method ${method})`);
    if (zip.readUInt32LE(at) !== 0x04034b50) throw new Error(`${name}: bad local header`);
    if (zip.readUInt16LE(at + 26) !== nameLen || zip.subarray(at + 30, at + 30 + nameLen).toString('utf8') !== name) throw new Error(`${name}: local name differs`);
    const start = at + 30 + nameLen + zip.readUInt16LE(at + 28);
    const bytes = zip.subarray(start, start + size);
    if ((crc32(bytes) >>> 0) !== crc || zip.readUInt32LE(at + 14) !== crc) throw new Error(`${name}: CRC differs`);
    const d = `${1980 + (date >> 9)}-${String((date >> 5) & 15).padStart(2, '0')}-${String(date & 31).padStart(2, '0')} ` +
      `${String(time >> 11).padStart(2, '0')}:${String((time >> 5) & 63).padStart(2, '0')}`;
    out.push({ name, bytes: Buffer.from(bytes), date: d, utf8: (flags & 0x0800) !== 0, zip64 });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}
