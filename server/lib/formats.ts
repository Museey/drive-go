// Values the legacy screens put into HTML without escaping, checked on the server (security review 2026-11-23,
// docs/SECURITY-AUDIT-2026-11.md ก5): an employee could save, round the screens, a record whose id, status or
// picture closed the quote or the tag it is put in, and so run code in the owner's browser (it read every salary
// and national ID). The screens only write such values from their own generators (uid(), sid(), document numbers),
// from fixed lists, or as pictures the browser made; text people type is escaped where it is shown.
//
//   ids         a list's record keys (DB.receipts …), the map keys (DB.seq …) and every `id` / `…Id` / `…Ids` value:
//               no quote, angle bracket, ampersand, backslash, backtick or control character (they go into
//               onclick="fn('<id>')" in some 150 places)
//   labels      a quotation's status (the list of saved documents), a capital entry's type, a Franchise branch
//               request's status: no quote, angle bracket or backtick (other fields people type, such as a tyre
//               category 'ยาง 15"', are escaped where they are shown)
//   pictures    `img`, `logo`, `photo`, `image`, `thumb`, `url`, `src`, `href` that are text, and a knowledge entry's
//               `data` (its file, href="<data>"): empty, a link of the server's files, a data: URL or an http(s)
//               address, with nothing that ends the attribute (src="<picture>"; a slip's link, the ProX chain server)
import type { Changes } from './units.ts';

const UNSAFE_ID = /["'<>&\\`\u0000-\u001f\u007f]/;
const UNSAFE_ATTR = /["'<>`\s\\]/;
const UNSAFE_LABEL = /["'<>`]/;
const LABELS: Record<string, string> = { 'DB.quotes': 'status', 'DB.capital': 'type', 'FR.reqs': 'status' };
const PICTURES = new Set(['img', 'logo', 'photo', 'image', 'thumb', 'url', 'src', 'href']);
const FILE_LINK = /^\/api\/files\/[0-9a-f]{64}$/;
const DATA_URL = /^data:[\w.+-]+\/[\w.+-]+(;[\w.+-]+=[\w.+-]*)*(;base64)?,/i;
const WEB = /^https?:\/\//i;

const isIdField = (k: string) => k === 'id' || /[a-z]Ids?$/.test(k);
const pictureOk = (v: string) => v === '' || FILE_LINK.test(v) || ((DATA_URL.test(v) || WEB.test(v)) && !UNSAFE_ATTR.test(v));

// In a record's JSON text: a quote, angle bracket, backtick, ampersand, backslash, control character or script URL.
const SUSPECT = /\\["\\u]|['<>`&]|\\[nrtbf]|(java|vb)script:/i;

// The first value of a record that breaks a rule, as "field: why", or null. learn: a knowledge entry (DB.px.learn),
// whose `data` is its file (a download link, href="<data>").
export function valueProblem(value: unknown, path = '', learn = false): string | null {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) { const p = valueProblem(value[i], path, learn); if (p) return p; }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const at = path ? `${path}.${k}` : k;
    if (typeof v === 'string') {
      if (isIdField(k) && UNSAFE_ID.test(v)) return `${at}: id`;
      if (PICTURES.has(k) && !pictureOk(v)) return `${at}: picture`;
      if (learn && k === 'data' && !pictureOk(v)) return `${at}: file`;
    } else if (Array.isArray(v) && isIdField(k)) {
      for (const x of v) if (typeof x === 'string' && UNSAFE_ID.test(x)) return `${at}: id`;
      const p = valueProblem(v, at, learn); if (p) return p;
    } else if (v && typeof v === 'object') {
      const p = valueProblem(v, at, learn); if (p) return p;
    }
  }
  return null;
}

// Why a save's rows are refused (403), or null. Row keys of lists and maps are ids too ('#3' when a record has none).
export function formatProblem(changes: Changes): string | null {
  for (const r of changes.upsert) {
    if (r.key && UNSAFE_ID.test(r.key)) return `${r.unit}|${r.key.slice(0, 40)}: id`;
    if (!SUSPECT.test(r.data)) continue;   // the JSON text has nothing a rule refuses
    let v: unknown;
    try { v = JSON.parse(r.data); } catch { continue; }
    const label = LABELS[r.unit], top = v as Record<string, unknown> | null;
    if (label && top && typeof top[label] === 'string' && UNSAFE_LABEL.test(top[label] as string)) return `${r.unit}|${r.key.slice(0, 40)}: ${label}: label`;
    const p = valueProblem(v, '', r.unit === 'DB.px.learn');
    if (p) return `${r.unit}|${r.key.slice(0, 40)}: ${p}`;
  }
  return null;
}
