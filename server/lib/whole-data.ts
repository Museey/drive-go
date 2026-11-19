import type pg from 'pg';
import type { Changes } from './units.ts';
import { makeBackup } from './storage.ts';

// Saves that replace much of a shop's data (team's check of 2026-11-18, the owner's decision of 2026-11-19).
//
// A wipe, a restore, an import or sample data replaces the whole data on purpose: the browser keeps a safety copy first
// and says so ("whole", guardWholeData in 03.js). Anything else that removes many documents or master records at once
// is not something the screens do (they remove one record at a time; merging customers removes a few), so it is
// refused: the legacy test-copy functions called directly (seedDemoNow, PKG_TRIAL.fresh) went through as ordinary saves
// and replaced a paying shop's documents without a copy. A save marked "whole" gets the server's own copy when the
// browser did not make one just before.

// Documents and master records: what a shop would lose. Movements, the audit log, FIFO lots and other derived or
// growing lists are not counted (they are rebuilt or trimmed by the screens).
const KEPT = new Set(['stock', 'cust', 'vendors', 'purchases', 'quotes', 'receipts', 'emp', 'expenses', 'assets', 'capital',
  'claims', 'invoices', 'issues', 'stockCounts', 'billings', 'stockCuts', 'branches', 'custClaims', 'transfers',
  'creditNotes', 'payroll'].map(f => `DB.${f}`));
export const MASS_REMOVAL = 'mass removal';
export const MAX_REMOVED = 20;

// The reason to refuse an ordinary save that removes more than MAX_REMOVED documents or master records, or null.
export function refuseMassRemoval(changes: Changes, whole: unknown): string | null {
  if (whole) return null;
  const removed = changes.remove.filter(r => KEPT.has(r.unit)).length;
  return removed > MAX_REMOVED ? MASS_REMOVAL : null;
}

// Before a save that replaces the whole data: the server's copy of the data as it is, unless the browser made its
// safety copy in the last ten minutes. Its key is the browser's kind of key (KEY.bak.safety-<date>T<time>-<kind>), in
// Bangkok time, so the backup list shows it with the others.
export async function keepBeforeWhole(c: pg.ClientBase, branch: string, key: string, whole: string): Promise<void> {
  const { rows } = await c.query(
    `select 1 from backups where shop_id = app_shop() and branch_id = $1 and key like $2 and created_at > now() - interval '10 minutes' limit 1`,
    [branch, `${key}.bak.safety-%`]);
  if (rows.length) return;
  const t = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 19).replace(/:/g, '-');
  await makeBackup(c, branch, `${key}.bak.safety-${t}-${whole}`);
}
