// What the sign-in screen may know before anyone signs in (design §4.6): the
// shop account's code, name and dates (PUBLIC_SHOP), and whether the
// franchise mode is on, without branches, accounts, requests or stock.
// No shop data (garage.v22) at all.
import type pg from 'pg';
import { readMain } from './storage.ts';

const PUBLIC_SHOP = ['code', 'name', 'created', 'trialStart', 'licensed', 'licEnd'];

export async function publicValue(c: pg.ClientBase, storeKey: string): Promise<string | null> {
  if (storeKey !== 'dgb.v22' && storeKey !== 'franchise.v22') return null;
  const main = await readMain(c, '', storeKey);
  if (!main) return null;
  const v = JSON.parse(main.json);
  if (storeKey === 'dgb.v22') {
    // Only what the sign-in screen uses; nothing personal (the owner's name, tax ID — a person's ID number for a sole
    // trader —, address, phone, payments: security review 2026-10-31). Signed in, the app reads the shop account again.
    if (v.shop) v.shop = Object.fromEntries(PUBLIC_SHOP.filter(k => k in v.shop).map(k => [k, v.shop[k]]));
    v.session = { who: '' };
  } else {
    for (const k of ['branches', 'accounts', 'reqs', 'hqStock']) if (Array.isArray(v[k])) v[k] = [];
    v.session = { accId: '', inspect: '' };
  }
  return JSON.stringify(v);
}

export async function shopByCode(db: pg.Pool | pg.ClientBase, code: string): Promise<{ id: string; package: string; status: string } | null> {
  const { rows } = await db.query<{ id: string; package: string; status: string }>('select id, package, status from shops where code = $1', [code]);
  return rows[0] ?? null;
}
