// Opens a shop and fills it with a data set the legacy app saved (a fixture
// in tests/fixtures/, i.e. Playwright's storageState of the legacy page):
// decision P3 (shops are opened by an admin script) and task T4.
import type pg from 'pg';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { storeSecrets } from './auth.ts';
import { withShop } from './db.ts';
import { type Kind, type Licence, TRIAL_DAYS, addDays, isDay, pinRow, today } from './licence.ts';
import { branchOf, writeBlob, writeMain } from './storage.ts';
import { type Secret, rootOf, split } from './units.ts';

export interface Dataset {
  store: Record<string, string>;          // STORE key -> stored text
  localStorage: { name: string; value: string }[];
}

export function readFixture(path: string | URL): Dataset {
  const state = JSON.parse(readFileSync(path, 'utf8'));
  const origin = state.origins[0];
  const store: Record<string, string> = {};
  for (const db of origin.indexedDB || []) for (const st of db.stores) for (const r of st.records) store[String(r.key)] = r.value;
  return { store, localStorage: origin.localStorage || [] };
}

// licence (task 3.15): the shop's licence, which the staff tools always give. Without one (tests, demo shops):
// a trial with the dates the data's own DB.shop has, or else of TRIAL_DAYS days from today (decision 15.2).
// Its dates go into the data's DB.shop rows (lib/licence.ts).
export interface NewShop { code: string; pkg: 'biz' | 'prox' | 'franchise'; name?: string; data?: Dataset; keepSecrets?: boolean;
  licence?: { kind: Kind; start: string; end: string; contact?: string } }

// Creates the shop and its data in one transaction. Run as the database
// owner (the app's role may not create shops). Passwords found in the data
// become sign-in accounts (argon2id hashes in users); the rows keep only a
// placeholder. Who was signed in when the data was saved is dropped: a new
// shop starts signed out.
export async function createShop(db: pg.Pool | pg.ClientBase, shop: NewShop): Promise<{ shopId: string; secrets: (Secret & { storeKey: string })[] }> {
  const shopId = randomUUID();
  const secrets: (Secret & { storeKey: string })[] = [];
  const store = shop.data?.store ?? {};
  const fr = store['franchise.v22'] ? JSON.parse(store['franchise.v22']) : null;
  const l: NonNullable<NewShop['licence']> = shop.licence ?? datesIn(store) ?? { kind: 'trial', start: today(), end: addDays(today(), TRIAL_DAYS) };
  const lic: Licence = { kind: l.kind, start: l.start, end: l.end, deleteOn: '', noticeSentOn: null, removedOn: null, contact: l.contact ?? '' };
  await withShop(db, shopId, '*', async c => {
    await c.query('insert into shops (id, code, package, name) values ($1, $2, $3, $4)', [shopId, shop.code, shop.pkg, shop.name ?? '']);
    await c.query('insert into licences (shop_id, kind, starts_on, ends_on, contact) values ($1, $2, $3, $4, $5)', [shopId, lic.kind, lic.start, lic.end, lic.contact]);
    for (const [key, value] of Object.entries(store)) {
      if (!rootOf(key)) { await writeBlob(c, '', key, value); continue; }
      const s = split(key, value, { keepSecrets: shop.keepSecrets });
      secrets.push(...s.secrets.map(x => ({ ...x, storeKey: key })));
      const branch = branchOf(shop.pkg, key, fr?.branches);
      const r = await writeMain(c, branch, key, {}, { layout: s.layout, upsert: s.rows.map(x => pinRow(x, lic)), remove: [], order: {} }, null, { log: false });
      if (!r.ok) throw new Error(`seeding ${key}: ${r.conflicts.join(', ')}`);
      await storeSecrets(c, branch, s.secrets);
    }
  });
  return { shopId, secrets };
}

// The licence dates of a data set (its first main data key with both), as a trial.
function datesIn(store: Record<string, string>): { kind: Kind; start: string; end: string } | null {
  for (const [key, value] of Object.entries(store)) {
    if (rootOf(key) !== 'DB') continue;
    const shop = JSON.parse(value)?.shop;
    if (isDay(shop?.licStart) && isDay(shop?.licEnd) && shop.licEnd >= shop.licStart) return { kind: 'trial', start: shop.licStart, end: shop.licEnd };
  }
  return null;
}
