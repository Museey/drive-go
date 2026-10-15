// Referee 1: what an action changed in the persisted state.
//
// stateDiff(before, after) returns a flat, readable map of "path → change":
//   "DB.receipts[MA-SA261000003].paid": [false, true]
//   "DB.audit": { "added": [ {...} ] }
//
// Records that carry an `id` are matched by id, but ids are random, so every id
// is replaced by a readable alias built from the record's own label
// ("@DB.cust[ปรีชา ทองสุข]", "@DB.receipts[MA-SA261000003]"). References to it
// elsewhere (custId, quoteId…) get the same alias. That keeps the golden stable
// across runs and comparable with a future system whose ids are different.
//
// Generated ids also appear in other fields (payId "SPmv619vk062x4o"…). The
// legacy uid() is Date.now() in base 36 plus 5 random characters, and the clock
// is frozen (fixture and tests each at their own time), so any such value is
// shown as "<uid>" ("SP<uid>"). Ids used as object keys (stock per branch:
// bq.<branch id>) are replaced by their alias too.
import { FIXED_NOW, FIXTURE_NOW } from './config.mjs';

const UID = new RegExp(`(${Date.parse(FIXED_NOW).toString(36)}|${Date.parse(FIXTURE_NOW).toString(36)})[0-9a-z]{5}`, 'g');

const LABEL_FIELDS = ['no', 'code', 'docNo', 'name', 'title'];

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const hasIds = arr => arr.some(x => isObj(x) && typeof x.id === 'string');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function labelOf(rec, index) {
  for (const f of LABEL_FIELDS) {
    const v = rec[f];
    if ((typeof v === 'string' && v.trim()) || typeof v === 'number') return String(v);
  }
  return '#' + index;
}

// Walks a state and assigns an alias to every id found in an array of records.
function collectAliases(value, path, aliases, taken) {
  if (Array.isArray(value)) {
    value.forEach((x, i) => {
      if (isObj(x) && typeof x.id === 'string' && !aliases.has(x.id)) {
        let alias = `${path}[${labelOf(x, i)}]`;
        if (taken.has(alias)) alias = `${path}[${labelOf(x, i)}#${i}]`;
        aliases.set(x.id, alias);
        taken.add(alias);
      }
      collectAliases(x, `${path}[${isObj(x) && typeof x.id === 'string' ? labelOf(x, i) : i}]`, aliases, taken);
    });
  } else if (isObj(value)) {
    for (const k of Object.keys(value)) collectAliases(value[k], `${path}.${k}`, aliases, taken);
  }
}

function replaceIds(value, aliases) {
  if (typeof value === 'string') return aliases.has(value) ? '@' + aliases.get(value) : value.replace(UID, '<uid>');
  if (Array.isArray(value)) return value.map(v => replaceIds(v, aliases));
  if (isObj(value)) {
    const out = {};
    for (const k of Object.keys(value)) out[aliases.has(k) ? '@' + aliases.get(k) : k] = replaceIds(value[k], aliases);
    return out;
  }
  return value;
}

function diffInto(a, b, path, out, aliases) {
  if (same(a, b)) return;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (hasIds(a) || hasIds(b)) {
      const key = x => (isObj(x) && typeof x.id === 'string' ? x.id : JSON.stringify(x));
      const am = new Map(a.map(x => [key(x), x]));
      const bm = new Map(b.map(x => [key(x), x]));
      const added = [], removed = [];
      b.forEach((x, i) => {
        const k = key(x);
        if (!am.has(k)) added.push(x);
        else diffInto(am.get(k), x, `${path}[${isObj(x) && typeof x.id === 'string' ? labelOf(x, i) : i}]`, out, aliases);
      });
      a.forEach(x => { if (!bm.has(key(x))) removed.push(x); });
      if (added.length || removed.length) {
        out[path] = Object.assign(out[path] || {},
          added.length ? { added } : {}, removed.length ? { removed } : {});
      }
      // Same records, new order.
      if (!added.length && !removed.length && !same(a.map(key), b.map(key)))
        out[path] = Object.assign(out[path] || {}, { reordered: true });
      return;
    }
    // Plain values (category names, units…): compare as a multiset.
    const count = arr => arr.reduce((m, x) => m.set(JSON.stringify(x), (m.get(JSON.stringify(x)) || 0) + 1), new Map());
    const ac = count(a), bc = count(b);
    const added = [], removed = [];
    for (const [k, n] of bc) for (let i = 0; i < n - (ac.get(k) || 0); i++) added.push(JSON.parse(k));
    for (const [k, n] of ac) for (let i = 0; i < n - (bc.get(k) || 0); i++) removed.push(JSON.parse(k));
    out[path] = Object.assign({}, added.length ? { added } : {}, removed.length ? { removed } : {},
      !added.length && !removed.length ? { reordered: true } : {});
    return;
  }
  if (isObj(a) && isObj(b)) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)]))
      diffInto(a[k], b[k], `${path}.${aliases.has(k) ? '@' + aliases.get(k) : k}`, out, aliases);
    return;
  }
  out[path] = [a === undefined ? null : a, b === undefined ? null : b];
}

export function stateDiff(before, after) {
  const aliases = new Map(), taken = new Set();
  collectAliases(before, '', aliases, taken);
  collectAliases(after, '', aliases, taken);
  // Aliases were built with a leading "." from the empty root path.
  for (const [id, alias] of aliases) aliases.set(id, alias.replace(/^\./, ''));
  const out = {};
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) diffInto(before[k], after[k], k, out, aliases);
  return replaceIds(out, aliases);
}

// Size of every collection (and plain values at the top of each store), for
// actions that replace the whole data set where a full diff would be huge.
export function stateCounts(state) {
  const out = {};
  for (const [store, value] of Object.entries(state)) {
    if (!isObj(value)) { out[store] = value; continue; }
    for (const [k, v] of Object.entries(value)) {
      if (Array.isArray(v)) out[`${store}.${k}`] = v.length;
      else if (isObj(v)) out[`${store}.${k}`] = `{${Object.keys(v).length} keys}`;
      else out[`${store}.${k}`] = v;
    }
  }
  return out;
}

export function formatDiff(diff) {
  return JSON.stringify(diff, null, 2) + '\n';
}
