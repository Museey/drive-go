// What a signed-in person may not see of a shop's data (task 3.9, decision R14-ข and the owner's answers of
// 2026-10-26): the server leaves those values out of the rows it sends (they read null, or [] for a list) and
// puts the stored values back when that person saves a row. Shared by the server and, bundled, the browser
// (which masks its own copy the same way before it compares it with the server's), so no Node or browser APIs.
//
//   pay   other employees' pay and personal data — the owner, or the rights "ดูสรุปการเงิน ภาษี และเงินเดือน"
//         (doc.fin) or "ดูและแก้ไขข้อมูลพนักงานและสิทธิใช้งาน" (doc.emp)
import type { Row } from './units.ts';

// A path inside a record: "salary", "lines" (the whole value), "items[].cost" (in every element of a list).
export interface Mask { unit: string; paths: string[]; except?: string[] }

// owner: the shop's owner, Franchise HQ or a branch head. self: the employee the person is (their own record shows whole).
export interface Rights { owner: boolean; pay: boolean; self: string }

// Pay and personal data of an employee (DB.emp): what the HR form and the payroll use, and nothing the rest of
// the app needs (names, codes, positions, phone numbers, dates of work, rights and sign-in stay).
export const EMP_PRIVATE = ['idcard', 'birth', 'age', 'edu', 'hospital', 'salary', 'ot', 'bonus', 'regular', 'emg', 'addr'];

export function masksFor(r: Rights): Mask[] {
  const out: Mask[] = [];
  if (!r.pay) {
    out.push({ unit: 'DB.emp', paths: EMP_PRIVATE, except: r.self ? [r.self] : [] });
    out.push({ unit: 'DB.payroll', paths: ['lines'] });   // one line per employee; the totals stay (they are expenses too)
  }
  if (!r.owner) out.push({ unit: 'DGB.shop', paths: ['idcard'] });   // the owner's national id, on the shop account
  return out;
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

// Calls fn(holder, field) for every place a path reaches in a record (fields that are not there are skipped).
function reach(v: unknown, path: string, fn: (holder: Record<string, unknown>, field: string) => void): void {
  const dot = path.indexOf('.');
  const head = dot < 0 ? path : path.slice(0, dot), rest = dot < 0 ? '' : path.slice(dot + 1);
  if (!isObject(v)) return;
  if (head.endsWith('[]')) {
    const list = v[head.slice(0, -2)];
    if (Array.isArray(list) && rest) for (const x of list) reach(x, rest, fn);
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(v, head)) return;
  if (rest) reach(v[head], rest, fn); else fn(v, head);
}

const blank = (v: unknown) => (Array.isArray(v) ? [] : null);

function masksOf(masks: Mask[], unit: string, key: string): string[] {
  const paths: string[] = [];
  for (const m of masks) if (m.unit === unit && !(m.except || []).includes(key)) paths.push(...m.paths);
  return paths;
}

// A row as the person may see it.
export function maskRow(row: Row, masks: Mask[]): Row {
  const paths = masksOf(masks, row.unit, row.key);
  if (!paths.length) return row;
  const v = JSON.parse(row.data);
  let changed = false;
  for (const p of paths) reach(v, p, (h, f) => { const b = blank(h[f]); if (JSON.stringify(h[f]) !== JSON.stringify(b)) { h[f] = b; changed = true; } });
  return changed ? { ...row, data: JSON.stringify(v) } : row;
}

export const maskRows = (rows: Row[], masks: Mask[]) => rows.map(r => maskRow(r, masks));

// A row the person saved, with the stored values put back where they could not see them. Each hidden value
// stays where the person's copy has it (their copy keeps the field, as null), so the text keeps its order.
export function restoreRow(row: Row, stored: string | undefined, masks: Mask[]): Row {
  const paths = masksOf(masks, row.unit, row.key);
  if (!paths.length || stored === undefined) return row;
  const v = JSON.parse(row.data), old = JSON.parse(stored);
  for (const p of paths) {
    // What the stored row has at each place, in order (list elements by their index).
    const before: unknown[] = [];
    reach(old, p, (h, f) => before.push(h[f]));
    let i = 0;
    reach(v, p, (h, f) => { if (i < before.length) h[f] = before[i]; i++; });
  }
  return { ...row, data: JSON.stringify(v) };
}

// Whether any row of a unit can be masked.
export const masksUnit = (masks: Mask[], unit: string) => masks.some(m => m.unit === unit);
