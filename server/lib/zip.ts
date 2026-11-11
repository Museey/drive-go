// A zip written as it goes (answer 11.5: every attachment of a shop in one download): entries are stored as they are
// (pictures, PDFs and clips are compressed already), names in UTF-8 (Thai), and ZIP64 records once the archive passes
// 4 GiB or 65,535 entries (a franchise chain has 2 GB per branch). Only what a download needs: no compression, no
// encryption, one disk. Where each record goes depends only on the names and sizes, so the length is known before
// any file is read (zipLength: the download shows its progress).
import { crc32 } from 'node:zlib';

export interface ZipItem { name: string; date: Date; size: number }
// The bytes of an entry, read when its turn comes; they must be `size` long.
export type ZipEntry = ZipItem & { bytes: () => Promise<Buffer> };

const U16 = 0xffff, U32 = 0xffffffff;
export type Zip64 = 'auto' | 'always';     // 'always' only for the tests

// DOS date and time of the shops' clock (Asia/Bangkok, no daylight saving).
function dos(d: Date): { date: number; time: number } {
  const t = new Date(d.getTime() + 7 * 3600_000);
  const year = Math.min(Math.max(t.getUTCFullYear(), 1980), 2107);
  return {
    date: ((year - 1980) << 9) | ((t.getUTCMonth() + 1) << 5) | t.getUTCDate(),
    time: (t.getUTCHours() << 11) | (t.getUTCMinutes() << 5) | (t.getUTCSeconds() >> 1),
  };
}

// Where each entry's local header starts, whether it needs a ZIP64 offset, and the whole length.
function plan(items: ZipItem[], zip64: Zip64) {
  const always = zip64 === 'always';
  let offset = 0, cdSize = 0;
  const at = items.map(it => {
    const name = Buffer.byteLength(it.name, 'utf8');
    if (it.size >= U32) throw new Error(`${it.name}: one file of 4 GiB or more`);
    if (name > U16) throw new Error(`${it.name}: name too long`);
    const p = { offset, big: always || offset >= U32 };
    offset += 30 + name + it.size;
    cdSize += 46 + name + (p.big ? 12 : 0);
    return p;
  });
  const cdAt = offset;
  const big = always || items.length >= U16 || cdAt >= U32 || cdSize >= U32;
  return { at, cdAt, cdSize, big, length: cdAt + cdSize + (big ? 76 : 0) + 22 };
}

export const zipLength = (items: ZipItem[], zip64: Zip64 = 'auto') => plan(items, zip64).length;

// The zip of `entries`, chunk by chunk; each file is read only when the one before it has been taken.
export async function* zipChunks(entries: ZipEntry[], zip64: Zip64 = 'auto'): AsyncGenerator<Buffer> {
  const p = plan(entries, zip64);
  const central: Buffer[] = [];
  for (const [i, e] of entries.entries()) {
    const { offset, big } = p.at[i];
    const name = Buffer.from(e.name, 'utf8');
    const bytes = await e.bytes();
    if (bytes.length !== e.size) throw new Error(`${e.name}: ${bytes.length} bytes, ${e.size} expected`);
    const { date, time } = dos(e.date);
    const crc = crc32(bytes) >>> 0;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(big ? 45 : 20, 4);     // version needed to extract
    local.writeUInt16LE(0x0800, 6);            // the name is UTF-8
    local.writeUInt16LE(0, 8);                 // stored
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(e.size, 18);
    local.writeUInt32LE(e.size, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    yield Buffer.concat([local, name]);
    yield bytes;

    // The central record; a ZIP64 extra field holds the offset once it is past 4 GiB.
    const rec = Buffer.alloc(46 + name.length + (big ? 12 : 0));
    rec.writeUInt32LE(0x02014b50, 0);
    // Made on Unix, a file readable by all (rw-r--r--): unzip then reads the name as the UTF-8 flag says; "made on
    // MS-DOS" makes Info-ZIP's unzip read Thai names as an old DOS code page.
    rec.writeUInt16LE(0x0300 | (big ? 45 : 20), 4);
    rec.writeUInt16LE(big ? 45 : 20, 6);
    rec.writeUInt16LE(0x0800, 8);
    rec.writeUInt16LE(0, 10);
    rec.writeUInt16LE(time, 12);
    rec.writeUInt16LE(date, 14);
    rec.writeUInt32LE(crc, 16);
    rec.writeUInt32LE(e.size, 20);
    rec.writeUInt32LE(e.size, 24);
    rec.writeUInt16LE(name.length, 28);
    rec.writeUInt16LE(big ? 12 : 0, 30);       // extra field
    // comment, disk, internal attributes: 0
    rec.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    rec.writeUInt32LE(big ? U32 : offset, 42);
    name.copy(rec, 46);
    if (big) {
      rec.writeUInt16LE(0x0001, 46 + name.length);
      rec.writeUInt16LE(8, 48 + name.length);
      rec.writeBigUInt64LE(BigInt(offset), 50 + name.length);
    }
    central.push(rec);
  }

  const end = Buffer.alloc((p.big ? 76 : 0) + 22);
  let o = 0;
  if (p.big) {
    const zAt = p.cdAt + p.cdSize, n = BigInt(entries.length);
    end.writeUInt32LE(0x06064b50, 0);          // ZIP64 end of central directory
    end.writeBigUInt64LE(44n, 4);
    end.writeUInt16LE(45, 12);
    end.writeUInt16LE(45, 14);
    end.writeBigUInt64LE(n, 24);
    end.writeBigUInt64LE(n, 32);
    end.writeBigUInt64LE(BigInt(p.cdSize), 40);
    end.writeBigUInt64LE(BigInt(p.cdAt), 48);
    end.writeUInt32LE(0x07064b50, 56);         // its locator
    end.writeBigUInt64LE(BigInt(zAt), 64);
    end.writeUInt32LE(1, 72);
    o = 76;
  }
  end.writeUInt32LE(0x06054b50, o);
  end.writeUInt16LE(p.big ? U16 : entries.length, o + 8);
  end.writeUInt16LE(p.big ? U16 : entries.length, o + 10);
  end.writeUInt32LE(p.big ? U32 : p.cdSize, o + 12);
  end.writeUInt32LE(p.big ? U32 : p.cdAt, o + 16);
  for (const r of central) yield r;
  yield end;
}
