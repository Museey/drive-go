// Document numbers issued on the server (task 3.2, decisions R1, A7, F1).
//
// The legacy app numbers a document from a counter in DB.seq, one per branch,
// type and month (frontend/js/19.js docNoBase / nextDocNo): the counter's key
// is the number's base and the number is the base and the running number in
// at least five digits, 'MA-SA2610' + '00015'. Two browsers that save one
// counter at the same time both used the next number; the server keeps the
// one saved first and gives the other the next free number, in every record
// that save wrote (the document, its stock moves, the audit entry …). A
// counter never goes back, even when the app wipes its data or restores an
// older backup: the server keeps every counter at the last number it issued.
//
// Pure functions shared by the server and, bundled, by the browser's
// window.storage, so they must not use Node or browser APIs.
import { type Changes, type Split, assemble } from './units.ts';
export const COUNTERS = 'DB.seq';

// The numbers a save newly wrote, by counter (base). The browser knows which
// numbers the app issued (window.storage watches docNo, the one place the app
// takes a number from a counter), so an older document, or a number someone
// typed, is never mistaken for a new one.
export type Claims = Record<string, string[]>;
export interface Issued { base: string; no: string }
// [the number the browser wrote, the number saved instead]
export type Renumbered = [string, string][];
// [base, value]: counters the server saved with another value than the
// browser wrote (or kept although the browser removed them), in the order the
// browser must set them.
export type Counters = [string, number][];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const around = (inner: string) => new RegExp(`(?<![A-Za-z0-9])(?:${inner})(?!\\d)`, 'g');

export const numberOf = (base: string, seq: number) => base + String(seq).padStart(5, '0');
export const seqOf = (base: string, no: string) => Number(no.slice(base.length));

// Every number of one counter written in a text.
export function numbersIn(text: string, base: string): Set<string> {
  return new Set(text.match(around(`${escape(base)}\\d{5,}`)) || []);
}

// The counter (DB.seq key) a number the app just issued came from: the one
// whose value is the number's running number.
export function baseOf(seq: Record<string, unknown>, no: string): string | undefined {
  return Object.keys(seq).find(k => no.startsWith(k) && /^\d{5,}$/.test(no.slice(k.length)) && seqOf(k, no) === seq[k]);
}

// The issued numbers a save's text holds, by counter, in running order.
export function claimsIn(issued: Issued[], value: string): Claims {
  const out: Claims = {};
  for (const base of new Set(issued.map(x => x.base))) {
    const there = numbersIn(value, base);
    const nos = [...new Set(issued.filter(x => x.base === base && there.has(x.no)).map(x => x.no))];
    if (nos.length) out[base] = nos.sort((a, b) => seqOf(base, a) - seqOf(base, b));
  }
  return out;
}

// Numbers the app issued but has not saved yet (`later`), once a save's
// counters were corrected: those the corrected counters already cover move
// up after them, so they stay unique; returns them and the counters for the
// app's data from then on.
export function shiftLater(later: Issued[], counters: Counters): { renumbered: Renumbered; counters: Counters } {
  const renumbered: Renumbered = [], out: Counters = [];
  for (const [base, last] of counters) {
    const mine = [...new Set(later.filter(x => x.base === base).map(x => x.no))].sort((a, b) => seqOf(base, a) - seqOf(base, b));
    if (mine.some(no => seqOf(base, no) <= last)) {
      mine.forEach((no, i) => renumbered.push([no, numberOf(base, last + 1 + i)]));
      out.push([base, last + mine.length]);
    } else {
      out.push([base, Math.max(last, ...mine.map(no => seqOf(base, no)))]);
    }
  }
  return { renumbered, counters: out };
}

// Replaces numbers, all at once (16 -> 17 and 15 -> 16 in one save must not
// turn 15 into 17), wherever they are written whole.
export function renumberText(text: string, renumbered: Renumbered): string {
  if (!renumbered.length) return text;
  const to = new Map(renumbered);
  return text.replace(around(renumbered.map(([from]) => escape(from)).join('|')), m => to.get(m) ?? m);
}

// The same, for a value of the app's live data: every string in it.
export function renumberValue(value: unknown, renumbered: Renumbered): unknown {
  if (!renumbered.length) return value;
  if (typeof value === 'string') return renumberText(value, renumbered);
  const seen = new WeakSet<object>();
  const walk = (o: Record<string, unknown> | unknown[]) => {
    if (seen.has(o)) return;
    seen.add(o);
    for (const k of Object.keys(o)) {
      const v = (o as Record<string, unknown>)[k];
      if (typeof v === 'string') { const r = renumberText(v, renumbered); if (r !== v) (o as Record<string, unknown>)[k] = r; }
      else if (v && typeof v === 'object') walk(v as Record<string, unknown>);
    }
  };
  if (value && typeof value === 'object') walk(value as Record<string, unknown>);
  return value;
}

// Sets the counters the server corrected in the app's data (DB.seq).
export function setCounters(db: unknown, counters: Counters): void {
  const seq = (db as { seq?: unknown } | null)?.seq;
  if (!counters.length || !seq || typeof seq !== 'object') return;
  for (const [base, value] of counters) (seq as Record<string, number>)[base] = value;
}

const rowKey = (r: { unit: string; key: string }) => `${r.unit}\u0000${r.key}`;

// The rows that may hold numbers a save (`saved`, the split `sent`) issued, in
// a later state of the same data (`now`): those the save wrote, and every row
// changed since. Other rows keep their text: a number in them is an older one.
export function rowsToRenumber(sent: Split, saved: Changes, now: Split): Set<string> {
  const wrote = new Set(saved.upsert.map(rowKey));
  const was = new Map(sent.rows.map(r => [rowKey(r), r.data]));
  return new Set(now.rows.filter(r => wrote.has(rowKey(r)) || was.get(rowKey(r)) !== r.data).map(rowKey));
}
export const isRow = (rows: Set<string>, unit: string, key: string) => rows.has(rowKey({ unit, key }));

// A split with numbers replaced in some of its rows and counters set (in
// place, or added after the others), as the text the app would have written.
export function correctSplit(storeKey: string, s: Split, rows: Set<string>, renumbered: Renumbered, counters: Counters): string {
  const out = s.rows.map(r => renumbered.length && rows.has(rowKey(r)) ? { ...r, data: renumberText(r.data, renumbered) } : r);
  const at = new Map(out.map((r, i) => [rowKey(r), i]));
  for (const [base, value] of counters) {
    const i = at.get(rowKey({ unit: COUNTERS, key: base }));
    if (i !== undefined) out[i] = { ...out[i], data: String(value) };
    else out.push({ unit: COUNTERS, key: base, data: String(value) });
  }
  return assemble(storeKey, s.layout, out, { session: s.session, secrets: s.secrets });
}
