// DriveGo staff's tool for shops' licences (task 3.15, decisions 15.1, 15.2, 15.5): run on the server with the
// database owner's connection — never part of the web app. Every action is logged (table licence_log) with who
// ran it (--by, or the operating system user).
//
//   node tools/shop-admin.mjs list [--expiring DAYS]          shops and their licences (only those ending within DAYS)
//   node tools/shop-admin.mjs show CODE                       one shop's licence and its log
//   node tools/shop-admin.mjs open CODE --trial|--pilot [--from DAY] [--contact TEXT]
//                                                             start a trial (60 days) or a pilot garage's year
//   node tools/shop-admin.mjs renew CODE --years N [--paid-on DAY] [--note TEXT]
//                                                             paid renewal: from the last day if it still runs, else from the payment day
//   node tools/shop-admin.mjs postpone CODE (--to DAY | --days N) [--note TEXT]
//                                                             move the removal of an expired shop's data later
//   node tools/shop-admin.mjs close CODE [--last-day DAY] [--note TEXT]
//                                                             the shop stops: read-only after its last day (default yesterday),
//                                                             data removed 90 days later
//   node tools/shop-admin.mjs contact CODE TEXT               who to call or e-mail about renewal and removal
//
// Connection: --db URL or MIGRATE_DATABASE_URL (the owner, as for migrations). Days are yyyy-mm-dd.
import { userInfo } from 'node:os';
import { parseArgs } from 'node:util';
import pg from 'pg';
import { close, listShops, openLicence, postpone, renew, setContact, shopOf } from '../server/lib/licence-admin.ts';
import { today } from '../server/lib/licence.ts';

const { values: o, positionals: [cmd, code, ...rest] } = parseArgs({
  allowPositionals: true,
  options: {
    db: { type: 'string' }, by: { type: 'string' }, expiring: { type: 'string' },
    trial: { type: 'boolean' }, pilot: { type: 'boolean' }, from: { type: 'string' }, contact: { type: 'string' },
    years: { type: 'string' }, 'paid-on': { type: 'string' }, note: { type: 'string' },
    to: { type: 'string' }, days: { type: 'string' }, 'last-day': { type: 'string' },
  },
});
const url = o.db || process.env.MIGRATE_DATABASE_URL;
const usage = () => { console.error('usage: see the top of tools/shop-admin.mjs'); process.exit(2); };
if (!cmd) usage();
if (!url) { console.error('give the owner database URL: --db URL or MIGRATE_DATABASE_URL'); process.exit(2); }
const actor = o.by || userInfo().username;
const db = new pg.Pool({ connectionString: url, max: 2 });

const line = s => {
  const l = s.licence;
  const left = l ? `${l.kind.padEnd(5)} ${l.start} → ${l.end}  removal ${l.deleteOn}${l.noticeSentOn ? ` (told ${l.noticeSentOn})` : ''}` : '(no licence)';
  return `${s.code.padEnd(20)} ${s.package.padEnd(9)} ${s.status.padEnd(9)} ${left}${l?.contact ? `  ${l.contact}` : ''}`;
};
const show = l => console.log(`${code}: ${l.kind} ${l.start} → ${l.end} · removal ${l.deleteOn}${l.noticeSentOn ? ` (told ${l.noticeSentOn})` : ''}`);
const need = (v, what) => { if (v === undefined || v === '') { console.error(`${cmd}: ${what} is required`); process.exit(2); } return v; };

try {
  switch (cmd) {
    case 'list': {
      const shops = await listShops(db, { expiring: o.expiring === undefined ? undefined : Number(o.expiring) });
      console.log(`today ${today()} · ${shops.length} shop(s)`);
      for (const s of shops) console.log(line(s));
      break;
    }
    case 'show': {
      const s = await shopOf(db, need(code, 'CODE'));
      const [shop] = (await listShops(db)).filter(x => x.id === s.id);
      console.log(line(shop));
      const { rows } = await db.query('select at, actor, action, detail from licence_log where shop_id = $1 order by id', [s.id]);
      for (const r of rows) console.log(`  ${r.at.toISOString()} ${r.actor.padEnd(12)} ${r.action.padEnd(8)} ${JSON.stringify(r.detail.after ? { after: r.detail.after } : r.detail)}`);
      break;
    }
    case 'open': {
      if (!!o.trial === !!o.pilot) { console.error('open: --trial or --pilot'); process.exit(2); }
      show(await openLicence(db, need(code, 'CODE'), { kind: o.trial ? 'trial' : 'pilot', from: o.from, actor, contact: o.contact }));
      break;
    }
    case 'renew':
      show(await renew(db, need(code, 'CODE'), { years: Number(need(o.years, '--years')), paidOn: o['paid-on'], actor, note: o.note }));
      break;
    case 'postpone':
      show(await postpone(db, need(code, 'CODE'), { to: o.to, days: o.days === undefined ? undefined : Number(o.days), actor, note: o.note }));
      break;
    case 'close':
      show(await close(db, need(code, 'CODE'), { lastDay: o['last-day'], actor, note: o.note }));
      break;
    case 'contact':
      show(await setContact(db, need(code, 'CODE'), { contact: need(rest.join(' '), 'TEXT'), actor }));
      break;
    default:
      usage();
  }
} catch (e) {
  console.error(`${cmd}: ${e.message}`);
  process.exitCode = 1;
} finally {
  await db.end();
}
