// Attachments in the shop's data (task 3.11, decision R19-ค): what counts as
// one, how big it may be and where it is kept. The legacy screens put a file
// into the data as a data: URL (a product picture, a slip, a knowledge-library
// file); the new system keeps the file on its own and the data keeps a link
// (/api/files/<SHA-256 of the bytes>) in the same field, so the legacy <img>,
// <video>, <iframe> and <a download> keep working. Used by the server and,
// bundled, by the browser's window.storage, so no Node or browser APIs here.

export const FILE_PATH = '/api/files/';
export const linkOf = (id: string) => FILE_PATH + id;
// Every link in a text (a row's JSON).
export const linksIn = (text: string): string[] =>
  [...new Set([...text.matchAll(/\/api\/files\/([0-9a-f]{64})/g)].map(m => m[1]))];

const MiB = 1024 * 1024;
// The legacy knowledge library's own limits (frontend/js/03.js lnFile): 5 MiB, 15 MiB for a clip (11.4).
export const limitOf = (mime: string) => (/^video\//i.test(mime) ? 15 : 5) * MiB;
// Space of a shop, of each franchise branch (HQ counts as one), 11.2–11.3.
export const QUOTA = 2 * 1024 * MiB;

// Units whose data: URLs stay in the data: the shop logo, which the printed
// documents draw 80 ms after building the page (owner's answers, "พฤติกรรมที่เปลี่ยน").
export const INLINE_UNITS = new Set(['DB.shop']);

// evidence: accounting evidence (payment slips, 50 ทวิ pictures), accepted even when the space is used up (11.2).
export type Use = 'evidence' | 'picture' | 'knowledge' | 'other';
export function useOf(unit: string): Use {
  if (unit === 'DB.paySlips' || unit === 'DB.whtDocs' || unit === 'DB.purchases') return 'evidence';
  if (unit === 'DB.stock') return 'picture';
  if (unit === 'DB.px.learn') return 'knowledge';
  return 'other';
}

const DATA_URL = /^data:([\w.+-]+\/[\w.+-]+)?((?:;[\w.+-]+=[^;,]*)*)(;base64)?,/i;
export const isDataUrl = (v: unknown): v is string => typeof v === 'string' && DATA_URL.test(v);
export const mightHoldDataUrl = (text: string) => text.includes('"data:');

// The type and the bytes (base64 or percent-encoded text) of a data: URL.
export function parseDataUrl(url: string): { mime: string; base64: boolean; payload: string } | null {
  const m = DATA_URL.exec(url);
  if (!m) return null;
  const mime = (m[1] || 'text/plain').toLowerCase();
  return { mime, base64: !!m[3], payload: url.slice(m[0].length) };
}

export interface Found { url: string; name: string }
// The data: URLs of a value (a record), each with the file name its record
// gives (knowledge library: fname; slips and 50 ทวิ: name).
export function dataUrlsIn(value: unknown, out: Found[] = []): Found[] {
  if (Array.isArray(value)) value.forEach(v => dataUrlsIn(v, out));
  else if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const v of Object.values(o)) {
      if (isDataUrl(v)) out.push({ url: v, name: String(o.fname ?? o.name ?? '').slice(0, 200) });
      else dataUrlsIn(v, out);
    }
  } else if (isDataUrl(value)) out.push({ url: value, name: '' });
  return out;
}

// Replaces, in place where it can (the app's live objects keep their
// identity), every string the map knows; returns the value (a new one only
// when the value itself is such a string).
export function replaceStrings(value: unknown, map: Map<string, string>): unknown {
  if (typeof value === 'string') return map.get(value) ?? value;
  if (Array.isArray(value)) { value.forEach((v, i) => { if (typeof v === 'string') { if (map.has(v)) value[i] = map.get(v); } else replaceStrings(v, map); }); return value; }
  if (value && typeof value === 'object') {
    const o = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(o)) { if (typeof v === 'string') { if (map.has(v)) o[k] = map.get(v); } else replaceStrings(v, map); }
  }
  return value;
}
