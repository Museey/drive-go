// Every attachment of a shop (franchise: of the branch whose data is open) in one zip (answer 11.5): the files the JSON
// backup links to (/api/files/<id>), in a folder per kind, each under the name the data gave it, and a list that maps
// each link of the JSON file to its file in the zip. For the owner (franchise: HQ, the branch head), like the backup.
import type pg from 'pg';
import type { Use } from './attachments.ts';
import { FILE_PATH } from './attachments.ts';
import { today } from './licence.ts';
import { type ZipEntry, zipLength } from './zip.ts';

export interface Listed { id: string; mime: string; size: number; name: string; use: Use; at: Date }

// The folders, in this order (new texts, approval pending in docs/NOTES.md "ไฟล์แนบทั้งหมดเป็น .zip").
export const FOLDERS: Record<Use, string> = { picture: 'รูปสินค้า', evidence: 'หลักฐานทางบัญชี', knowledge: 'คลังความรู้', other: 'อื่น ๆ' };
export const INDEX_NAME = 'รายการไฟล์แนบ.csv';
const INDEX_HEAD = ['ไฟล์ในชุดนี้', 'ลิงก์ในไฟล์สำรอง (JSON)', 'ชนิดไฟล์', 'ขนาด (ไบต์)', 'วันที่แนบ'];

export async function listFiles(c: pg.ClientBase, branch: string): Promise<Listed[]> {
  const { rows } = await c.query<{ id: string; mime: string; size: string; name: string; use: Use; created_at: Date }>(
    `select id, mime, size::text as size, name, use, created_at from files
      where shop_id = app_shop() and branch_id = $1 and deleted_at is null order by created_at, id`, [branch]);
  const order = Object.keys(FOLDERS);
  return rows.map(r => ({ id: r.id, mime: r.mime, size: Number(r.size), name: r.name ?? '', use: (r.use in FOLDERS ? r.use : 'other') as Use, at: r.created_at }))
    .sort((a, b) => order.indexOf(a.use) - order.indexOf(b.use));
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/bmp': 'bmp', 'image/svg+xml': 'svg',
  'application/pdf': 'pdf', 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm', 'text/plain': 'txt',
};
const KNOWN = new Set([...Object.values(EXT), 'jpeg', 'jpe', 'tif', 'tiff', 'heic', 'heif', 'avif', 'm4v', 'avi', 'mkv', '3gp',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'zip', 'rar', '7z', 'json']);

// A name every computer can save: no path or control characters, nothing Windows refuses, not too long, with the
// type's extension when it has none (a product picture is named after the product).
export function fileName(f: Pick<Listed, 'id' | 'mime' | 'name'>): string {
  let n = f.name.normalize('NFC').replace(/[\u0000-\u001f\u007f\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim().replace(/^[. ]+|[. ]+$/g, '');
  n = [...n].slice(0, 80).join('').trim();
  if (!n) n = f.id.slice(0, 12);
  if (/^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(n)) n = `_${n}`;
  const ext = EXT[f.mime], has = /\.([A-Za-z0-9]{1,5})$/.exec(n);
  if (ext && !(has && KNOWN.has(has[1].toLowerCase()))) n = `${n}.${ext}`;   // "ไดสตาร์ท 2.0kW" is not a file type
  return n;
}

// Names in the zip, each folder without two the same (whatever the letter case): "ชื่อ (2).png".
export function zipNames(files: Listed[]): string[] {
  const taken = new Set<string>();
  return files.map(f => {
    const base = fileName(f), dot = base.lastIndexOf('.');
    const [stem, ext] = dot > 0 ? [base.slice(0, dot), base.slice(dot)] : [base, ''];
    for (let k = 1; ; k++) {
      const name = `${FOLDERS[f.use]}/${k === 1 ? base : `${stem} (${k})${ext}`}`;
      if (!taken.has(name.toLowerCase())) { taken.add(name.toLowerCase()); return name; }
    }
  });
}

const bangkok = (d: Date) => new Date(d.getTime() + 7 * 3600_000).toISOString().slice(0, 16).replace('T', ' ');
// A cell of the list; text a spreadsheet would run as a formula starts with '.
const cell = (v: string | number) => {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function indexCsv(files: Listed[], names: string[]): Buffer {
  const lines = [INDEX_HEAD, ...files.map((f, i) => [names[i], FILE_PATH + f.id, f.mime, f.size, bangkok(f.at)])];
  return Buffer.from('﻿' + lines.map(l => l.map(cell).join(',')).join('\r\n') + '\r\n', 'utf8');
}

// The zip's entries: the list first, then the files (read one at a time by `read`).
export function zipEntries(files: Listed[], read: (f: Listed) => Promise<Buffer>, now = new Date()): { entries: ZipEntry[]; length: number } {
  const names = zipNames(files);
  const index = indexCsv(files, names);
  const entries: ZipEntry[] = [
    { name: INDEX_NAME, date: now, size: index.length, bytes: async () => index },
    ...files.map((f, i) => ({ name: names[i], date: f.at, size: f.size, bytes: () => read(f) })),
  ];
  return { entries, length: zipLength(entries) };
}

// The download's name: garage-files-<day in Thailand>.zip, like the backup's garage-backup-<day>.json.
export const zipFileName = (day = today()) => `garage-files-${day}.zip`;
