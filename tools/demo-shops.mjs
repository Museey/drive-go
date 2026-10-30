// The demo shops of a local run (tools/serve-new.mjs, npm run dev) and of the test server (tools/deploy-migrate.mjs
// with SEED_DEMO_SHOPS=1): the test fixtures' "ready to try" data of each package, with their owner accounts
// (tests/support/config.mjs OWNERS) and, for Franchise, the branch accounts b001 / 1234 and staff001 / 5678.
// Opened only in a database that has no shops yet, as the database owner (the URL the migrations use).
import pg from 'pg';
import { createShop, readFixture } from '../server/lib/seed.ts';
import { TRIAL_DAYS, addDays, today } from '../server/lib/licence.ts';
import { pgConfig } from '../server/lib/pg-config.ts';

export const DEMO_SHOPS = [
  { code: 'demo-biz', pkg: 'biz', dataset: 'biz-trial', who: 'dg1688 / 123456' },
  { code: 'demo-prox', pkg: 'prox', dataset: 'prox-trial', who: 'dg1688 / 123456' },
  { code: 'demo-franchise', pkg: 'franchise', dataset: 'franchise-trial', who: 'hq / 1234 (สาขา b001 / 1234)' },
];

export async function openDemoShops(ownerUrl) {
  // A trial from today (task 3.15), not the fixtures' licence, which ends on a fixed day.
  const licence = { kind: 'trial', start: today(), end: addDays(today(), TRIAL_DAYS) };
  const pool = new pg.Pool({ ...pgConfig(ownerUrl), max: 1 });
  try {
    if ((await pool.query('select count(*)::int as n from shops')).rows[0].n) return [];
    for (const d of DEMO_SHOPS)
      await createShop(pool, { code: d.code, pkg: d.pkg, licence, data: readFixture(new URL(`../tests/fixtures/${d.dataset}.json`, import.meta.url)) });
    return DEMO_SHOPS;
  } finally {
    await pool.end();
  }
}
