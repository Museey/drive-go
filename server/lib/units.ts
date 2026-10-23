// How the legacy app's stored data (one JSON text per STORE key) is split into
// rows of the records table, and put back together byte for byte
// (docs/PHASE2-DESIGN.md §3.2). Used by the server and, bundled, by the
// browser's window.storage, so it must not use Node or browser APIs.
//
// A STORE key's JSON becomes:
//   layout   the order and kind of every field (one row, unit = root, key = '')
//   rows     one per record of a list ('DB.receipts', key = id), one per entry
//            of a map ('DB.seq', key = 'MA-RE2610'), one per other field
//            ('DB.shop', key = '')
//   session  fields that belong to the signed-in person, not to the shop
//   secrets  passwords, replaced in the rows by SECRET_PLACEHOLDER
// Fields the table below does not know are kept whole as one row, so nothing
// the legacy app adds later is lost.

export type Root = 'DB' | 'FR' | 'DGB';
export interface Row { unit: string; key: string; data: string }
export interface Secret { unit: string; key: string; field: string; value: string }
export interface Split { layout: string; rows: Row[]; session: Record<string, string>; secrets: Secret[] }

// Layout entries: [field, kind] in the order of the JSON. Kinds: L list by id,
// K list by code (chart of accounts), M map, D whole value, S session, or a
// nested layout for a group (DB.px, DB.fifo).
type Kind = 'L' | 'K' | 'M' | 'D' | 'S';
type Layout = [string, Kind | Layout][];

const LIST = 'L', BY_CODE = 'K', MAP = 'M', GROUP = 'G', SESSION = 'S';
const RULES: Record<string, string> = {};
for (const f of ['stock', 'cust', 'vendors', 'purchases', 'quotes', 'receipts', 'moves', 'crm', 'emp', 'expenses', 'assets',
  'capital', 'claims', 'invoices', 'audit', 'hr', 'warns', 'issues', 'stockCounts', 'billings', 'stockCuts', 'branches',
  'custClaims', 'transfers']) RULES[`DB.${f}`] = LIST;
for (const f of ['queue', 'inq', 'sos', 'learn']) RULES[`DB.px.${f}`] = LIST;
for (const f of ['lots', 'allocs']) RULES[`DB.fifo.${f}`] = LIST;
for (const f of ['branches', 'accounts', 'reqs', 'hqStock']) RULES[`FR.${f}`] = LIST;
RULES['DB.coa'] = BY_CODE;
for (const f of ['seq', 'paySlips', 'whtDocs']) RULES[`DB.${f}`] = MAP;
RULES['DB.px'] = GROUP;
RULES['DB.fifo'] = GROUP;
for (const u of ['DB.curEmp', 'FR.session', 'DGB.session']) RULES[u] = SESSION;

// Value of a session field when nobody is signed in (as the legacy app starts).
export const SESSION_DEFAULTS: Record<string, string> = {
  'DB.curEmp': '""',
  'FR.session': '{"accId":"","inspect":""}',
  'DGB.session': '{"who":""}',
};

// Password fields (design §1.4): never stored in records, never sent to the browser.
export const SECRET_FIELDS: Record<string, string[]> = {
  'DB.emp': ['dgbPass', 'pin'],
  'FR.accounts': ['pass'],
  'DGB.shop': ['pass'],
};
export const SECRET_PLACEHOLDER = '********';

export function rootOf(storeKey: string): Root | null {
  if (/^garage\.v22(::[^.]+)?$/.test(storeKey)) return 'DB';
  if (storeKey === 'franchise.v22') return 'FR';
  if (storeKey === 'dgb.v22') return 'DGB';
  return null;
}

function byUnit(rows: Row[]): Map<string, Row[]> {
  const m = new Map<string, Row[]>();
  for (const r of rows) {
    const list = m.get(r.unit);
    if (list) list.push(r); else m.set(r.unit, [r]);
  }
  return m;
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

// Keys of a list's records: the id (or code), "<id>#2", "<id>#3" … for
// repeats (the 36-month demo data has two pairs of moves with the same id),
// "#<index>" for a record without one.
function listKeys(items: Record<string, unknown>[], field: string): string[] {
  const seen = new Map<string, number>();
  return items.map((x, i) => {
    const id = x[field];
    if (typeof id !== 'string' && typeof id !== 'number') return `#${i}`;
    const k = String(id), n = (seen.get(k) || 0) + 1;
    seen.set(k, n);
    return n === 1 ? k : `${k}#${n}`;
  });
}

function hideSecrets(unit: string, key: string, value: unknown, out: Split & { keep?: boolean }): unknown {
  const fields = SECRET_FIELDS[unit];
  if (!fields || !isObject(value)) return value;
  const secrets = out.secrets;
  let copy: Record<string, unknown> | null = null;
  for (const field of fields) {
    const v = value[field];
    if (typeof v === 'string' && v !== '') {
      secrets.push({ unit, key, field, value: v });
      if (out.keep) continue;
      copy ??= { ...value };   // spreading keeps the key order; the field stays where it was
      copy[field] = SECRET_PLACEHOLDER;
    }
  }
  return copy ?? value;
}

function splitFields(obj: Record<string, unknown>, path: string, out: Split & { keep?: boolean }): Layout {
  const layout: Layout = [];
  for (const [field, value] of Object.entries(obj)) {
    const unit = `${path}.${field}`, rule = RULES[unit];
    if (rule === SESSION) {
      out.session[unit] = JSON.stringify(value);
      layout.push([field, 'S']);
    } else if (rule === GROUP && isObject(value)) {
      layout.push([field, splitFields(value, unit, out)]);
    } else if ((rule === LIST || rule === BY_CODE) && Array.isArray(value) && value.every(isObject)) {
      const keys = listKeys(value as Record<string, unknown>[], rule === LIST ? 'id' : 'code');
      value.forEach((x, i) => out.rows.push({ unit, key: keys[i], data: JSON.stringify(hideSecrets(unit, keys[i], x, out)) }));
      layout.push([field, rule === LIST ? 'L' : 'K']);
    } else if (rule === MAP && isObject(value)) {
      for (const [k, x] of Object.entries(value)) out.rows.push({ unit, key: k, data: JSON.stringify(x) });
      layout.push([field, 'M']);
    } else {
      out.rows.push({ unit, key: '', data: JSON.stringify(hideSecrets(unit, '', value, out)) });
      layout.push([field, 'D']);
    }
  }
  return layout;
}

// Splits the JSON text the legacy app stores under storeKey. keepSecrets
// leaves password fields in the rows (they are still listed in secrets):
// only until the server signs people in itself (task T7), because the legacy
// sign-in still compares passwords in the browser.
export function split(storeKey: string, json: string, { keepSecrets = false }: { keepSecrets?: boolean } = {}): Split {
  const root = rootOf(storeKey);
  if (!root) throw new Error(`not a main data key: ${storeKey}`);
  const value: unknown = JSON.parse(json);
  const out: Split & { keep?: boolean } = { layout: '', rows: [], session: {}, secrets: [], keep: keepSecrets };
  if (!isObject(value)) {
    out.rows.push({ unit: `${root}.`, key: '', data: JSON.stringify(value) });
    out.layout = '"D"';
  } else {
    out.layout = JSON.stringify(splitFields(value, root, out));
  }
  delete out.keep;
  return out;
}

// Puts a split back together. rows: in record order within each unit (the
// order of the records table's pos). session: values for the session fields
// (missing ones get SESSION_DEFAULTS). secrets: only for exact copies (tests,
// exports); without them password fields read SECRET_PLACEHOLDER.
export function assemble(storeKey: string, layout: string, rows: Row[],
  { session = {}, secrets = [] }: { session?: Record<string, string>; secrets?: Secret[] } = {}): string {
  const root = rootOf(storeKey);
  if (!root) throw new Error(`not a main data key: ${storeKey}`);
  const units = byUnit(rows);
  const reveal = new Map<string, Secret[]>();
  for (const s of secrets) {
    const k = `${s.unit}\u0000${s.key}`;
    reveal.set(k, [...(reveal.get(k) || []), s]);
  }
  const text = (r: Row) => {
    const hidden = reveal.get(`${r.unit}\u0000${r.key}`);
    if (!hidden) return r.data;
    const v = JSON.parse(r.data);
    for (const s of hidden) v[s.field] = s.value;
    return JSON.stringify(v);
  };
  const one = (unit: string) => {
    const r = units.get(unit);
    if (!r || r.length !== 1 || r[0].key !== '') throw new Error(`missing or repeated row for ${unit}`);
    return text(r[0]);
  };
  const build = (entries: Layout, path: string): string => '{' + entries.map(([field, kind]) => {
    const unit = `${path}.${field}`;
    let v: string;
    if (Array.isArray(kind)) v = build(kind, unit);
    else if (kind === 'L' || kind === 'K') v = '[' + (units.get(unit) || []).map(text).join(',') + ']';
    else if (kind === 'M') v = '{' + (units.get(unit) || []).map(r => JSON.stringify(r.key) + ':' + r.data).join(',') + '}';
    else if (kind === 'S') v = session[unit] ?? SESSION_DEFAULTS[unit] ?? 'null';
    else v = one(unit);
    return JSON.stringify(field) + ':' + v;
  }).join(',') + '}';
  const parsed = JSON.parse(layout) as Layout | 'D';
  return parsed === 'D' ? one(`${root}.`) : build(parsed, root);
}

// The records of a STORE key's live value (the legacy app's DB object), as
// split() makes rows of them: for each, its unit and key, and its value to
// read or replace in place. Session fields are not records.
export function eachRecord(storeKey: string, value: unknown,
  fn: (unit: string, key: string, get: () => unknown, set: (v: unknown) => void) => void): void {
  const root = rootOf(storeKey);
  if (!root || !isObject(value)) return;
  const walk = (obj: Record<string, unknown>, path: string) => {
    for (const [field, v] of Object.entries(obj)) {
      const unit = `${path}.${field}`, rule = RULES[unit];
      if (rule === SESSION) continue;
      if (rule === GROUP && isObject(v)) walk(v, unit);
      else if ((rule === LIST || rule === BY_CODE) && Array.isArray(v) && v.every(isObject)) {
        const list = v as Record<string, unknown>[], keys = listKeys(list, rule === LIST ? 'id' : 'code');
        list.forEach((_, i) => fn(unit, keys[i], () => list[i], x => { list[i] = x as Record<string, unknown>; }));
      } else if (rule === MAP && isObject(v)) {
        for (const k of Object.keys(v)) fn(unit, k, () => v[k], x => { v[k] = x; });
      } else {
        fn(unit, '', () => obj[field], x => { obj[field] = x; });
      }
    }
  };
  walk(value, root);
}

// What a save changed, row by row (design §4.1–4.2). New records of a unit
// are listed in order and get positions after the existing ones; if the
// existing records changed order, or a new one is not at the end, order gives
// the unit's full key order.
export interface Changes {
  layout?: string;
  upsert: Row[];
  remove: { unit: string; key: string }[];
  order: Record<string, string[]>;
}

export function diff(before: Split, after: Split): Changes {
  const changes: Changes = { upsert: [], remove: [], order: {} };
  if (before.layout !== after.layout) changes.layout = after.layout;
  const old = byUnit(before.rows), now = byUnit(after.rows);
  for (const unit of new Set([...old.keys(), ...now.keys()])) {
    const a = old.get(unit) || [], b = now.get(unit) || [];
    const prev = new Map(a.map(r => [r.key, r.data]));
    const next = new Set(b.map(r => r.key));
    for (const r of b) if (prev.get(r.key) !== r.data) changes.upsert.push(r);
    for (const r of a) if (!next.has(r.key)) changes.remove.push({ unit, key: r.key });
    const kept = b.filter(r => prev.has(r.key)).map(r => r.key);
    const keptBefore = a.filter(r => next.has(r.key)).map(r => r.key);
    const firstNew = b.findIndex(r => !prev.has(r.key));
    const newAtEnd = firstNew < 0 || b.slice(firstNew).every(r => !prev.has(r.key));
    if (kept.join('\u0000') !== keptBefore.join('\u0000') || !newAtEnd) changes.order[unit] = b.map(r => r.key);
  }
  return changes;
}
