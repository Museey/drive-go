// The scheduled job (LAUNCH-CHECKLIST stage 1 "ตารางเวลางานเบื้องหลัง"; .do/app.yaml job `nightly`, tools/nightly.mjs):
// each night, the removals of task 3.15 that are due (15.5, 15.6) and the attachments deleted more than 30 days ago
// or never saved (task 3.11, purgeFiles). Shops that must be told before their data is removed are not told here:
// during the pilot staff phone them (15.4) and then record it (tools/shop-admin.mjs told) — a notice nobody gave
// must never start the 30 days to a removal. The job lists them so that staff are alerted.
import type pg from 'pg';
import { withShop } from './db.ts';
import { purgeFiles } from './files.ts';
import { type Due, carryOut, listShops, retentionDue } from './licence-admin.ts';
import { today } from './licence.ts';
import { DEMO_CODES } from './shop-open.ts';

export interface Night {
  on: string;
  done: { code: string; action: 'delete' | 'purge'; why: string }[];   // carried out tonight
  call: Due[];             // shops staff must tell (by phone) before their data can be removed
  demo: Due[];             // DriveGo's own demo shops whose trial ended: nobody to tell, staff open a new trial
  files: { code: string; removed: number }[];
}

export async function nightly(db: pg.Pool, { on = today(), actor = 'schedule' }: { on?: string; actor?: string } = {}): Promise<Night> {
  const night: Night = { on, done: [], call: [], demo: [], files: [] };
  for (const d of await retentionDue(db, on)) {
    if (DEMO_CODES.includes(d.shop.code)) night.demo.push(d);
    else if (d.action === 'notice') night.call.push(d);
    else if (await carryOut(db, d, { actor, on, tell: async () => {} })) night.done.push({ code: d.shop.code, action: d.action, why: d.why });
  }
  for (const s of await listShops(db)) {
    if (s.status === 'removed') continue;
    const gone = await withShop(db, s.id, '*', c => purgeFiles(c));
    if (gone.length) night.files.push({ code: s.code, removed: gone.length });
  }
  return night;
}
