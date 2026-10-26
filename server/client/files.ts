// Attachments in window.storage (task 3.11, decision R19-ค). The legacy
// screens put a file into the data as a data: URL (a product picture, a slip,
// a 50 ทวิ picture, a knowledge-library file). Before a save leaves the
// browser, every such file in the rows it changes is uploaded
// (POST /api/files) and replaced by its link (/api/files/<id>), in the save,
// in what the app wrote since, and in the app's live data (DB), like the
// document numbers of task 3.2. The shop logo stays inside the data.
import { INLINE_UNITS, dataUrlsIn, limitOf, mightHoldDataUrl, parseDataUrl, replaceStrings, useOf } from '../lib/attachments.ts';
import { type Changes, eachRecord } from '../lib/units.ts';

// Space the shop (or franchise branch) uses, as the last answer gave it: the
// screens refuse a picture or a knowledge file at once when it is used up (66-files.js).
export const space = { used: 0, quota: 0, known: false };
export const setSpace = (s: { used?: number; quota?: number }) => {
  if (typeof s.used === 'number' && typeof s.quota === 'number') Object.assign(space, { used: s.used, quota: s.quota, known: true });
};

// Uploaded this session: data: URL -> link (the same file is uploaded once, also when the app saves it again).
const uploaded = new Map<string, string>();

export type Refused = { error: 'too-large' | 'quota' | 'signed-out' | 'not-allowed' | string; limit?: number };

function bytesOf(url: string): { mime: string; bytes: Uint8Array } {
  const p = parseDataUrl(url)!;
  if (!p.base64) return { mime: p.mime, bytes: new TextEncoder().encode(decodeURIComponent(p.payload)) };
  const bin = atob(p.payload), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime: p.mime, bytes };
}

type Send = (input: string, init: RequestInit) => Promise<Response>;

// The files in the rows a save changes, uploaded. Returns the links by
// data: URL (empty when there is nothing to upload), or why the server refused one.
export async function uploadFiles(storeKey: string, changes: Changes, send: Send): Promise<Map<string, string> | Refused> {
  const map = new Map<string, string>();
  for (const r of changes.upsert) {
    if (INLINE_UNITS.has(r.unit) || !mightHoldDataUrl(r.data)) continue;
    for (const f of dataUrlsIn(JSON.parse(r.data))) {
      if (map.has(f.url)) continue;
      const known = uploaded.get(f.url);
      if (known) { map.set(f.url, known); continue; }
      const { mime, bytes } = bytesOf(f.url);
      if (bytes.length > limitOf(mime)) return { error: 'too-large', limit: limitOf(mime) };
      const q = new URLSearchParams({ key: storeKey, use: useOf(r.unit), name: f.name });
      const res = await send(`/api/files?${q}`, { method: 'POST', headers: { 'content-type': mime }, body: bytes as BodyInit });
      const body = await res.json().catch(() => ({})) as { url?: string; used?: number; quota?: number; error?: string; limit?: number };
      if (res.status === 401) return { error: 'signed-out' };
      if (res.status === 403) return { error: 'not-allowed' };
      if (!res.ok || !body.url) return { error: body.error || `upload ${res.status}`, limit: body.limit };
      setSpace(body);
      uploaded.set(f.url, body.url);
      map.set(f.url, body.url);
    }
  }
  return map;
}

// A whole STORE value with the uploaded files replaced by their links (rows
// of the logo's unit left as they are).
export function withLinks(storeKey: string, json: string, map: Map<string, string>): string {
  const value = JSON.parse(json);
  linkInPlace(storeKey, value, map);
  return JSON.stringify(value);
}

// The same, in place: the app's live data (DB) keeps its objects.
export function linkInPlace(storeKey: string, value: unknown, map: Map<string, string>): void {
  eachRecord(storeKey, value, (unit, _k, get, set) => {
    if (INLINE_UNITS.has(unit)) return;
    const v = get();
    const r = replaceStrings(v, map);
    if (r !== v) set(r);
  });
}

