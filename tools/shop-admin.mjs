// DriveGo staff's tool for shops (task 3.15, decisions 15.1, 15.2, 15.5; opening real shops and forgotten passwords,
// LAUNCH-CHECKLIST stage 2): run on the server with the database owner's connection — never part of the web app.
// Every action is logged (table licence_log) with who ran it (--by, or the operating system user). How to run it on
// the test server and what to check before giving a password: docs/STAFF-TOOLS.md.
//
//   node tools/shop-admin.mjs new CODE --biz|--prox|--franchise --trial|--pilot --name TEXT --owner TEXT
//        [--user NAME] [--tax-id N] [--addr TEXT] [--zip N] [--tel N] [--email E] [--from DAY] [--contact TEXT]
//                                                             open an empty shop (no sample data) at /CODE/ with its owner's
//                                                             (Franchise: HQ's) account; shows the temporary password once
//   node tools/shop-admin.mjs password CODE [--user NAME]    a new temporary password for the owner (Franchise: HQ, or
//                                                             the chain's account NAME); the old one stops working
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
import { pgConfig } from '../server/lib/pg-config.ts';
import { close, listShops, openLicence, postpone, renew, setContact, shopOf } from '../server/lib/licence-admin.ts';
import { today } from '../server/lib/licence.ts';
import { openRealShop, resetPassword } from '../server/lib/shop-open.ts';

const { values: o, positionals: [cmd, code, ...rest] } = parseArgs({
  allowPositionals: true,
  options: {
    db: { type: 'string' }, by: { type: 'string' }, expiring: { type: 'string' },
    trial: { type: 'boolean' }, pilot: { type: 'boolean' }, from: { type: 'string' }, contact: { type: 'string' },
    years: { type: 'string' }, 'paid-on': { type: 'string' }, note: { type: 'string' },
    to: { type: 'string' }, days: { type: 'string' }, 'last-day': { type: 'string' },
    biz: { type: 'boolean' }, prox: { type: 'boolean' }, franchise: { type: 'boolean' }, name: { type: 'string' }, owner: { type: 'string' },
    user: { type: 'string' }, 'tax-id': { type: 'string' }, addr: { type: 'string' }, zip: { type: 'string' }, tel: { type: 'string' },
    email: { type: 'string' },
  },
});
const url = o.db || process.env.MIGRATE_DATABASE_URL;
const usage = () => { console.error('usage: see the top of tools/shop-admin.mjs'); process.exit(2); };
if (!cmd) usage();
if (!url) { console.error('give the owner database URL: --db URL or MIGRATE_DATABASE_URL'); process.exit(2); }
const actor = o.by || userInfo().username;
const db = new pg.Pool({ ...pgConfig(url), max: 2 });

const line = s => {
  const l = s.licence;
  const left = l ? `${l.kind.padEnd(5)} ${l.start} → ${l.end}  removal ${l.deleteOn}${l.noticeSentOn ? ` (told ${l.noticeSentOn})` : ''}` : '(no licence)';
  return `${s.code.padEnd(20)} ${s.package.padEnd(9)} ${s.status.padEnd(9)} ${left}${l?.contact ? `  ${l.contact}` : ''}`;
};
const show = l => console.log(`${code}: ${l.kind} ${l.start} → ${l.end} · removal ${l.deleteOn}${l.noticeSentOn ? ` (told ${l.noticeSentOn})` : ''}`);
const need = (v, what) => { if (v === undefined || v === '') { console.error(`${cmd}: ${what} is required`); process.exit(2); } return v; };
// A password is shown once, here; DriveGo's staff tell it to the owner by phone (docs/STAFF-TOOLS.md).
const tell = (u, pass) => console.log(`  user ${u}\n  temporary password ${pass}\n` +
  '  (shown once: tell it to the owner by phone, never by chat or e-mail; ask them to change it after signing in)');

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
    case 'new': {
      const pkgs = ['biz', 'prox', 'franchise'].filter(p => o[p]);
      if (pkgs.length !== 1) { console.error('new: one of --biz, --prox, --franchise'); process.exit(2); }
      if (!!o.trial === !!o.pilot) { console.error('new: --trial or --pilot'); process.exit(2); }
      const r = await openRealShop(db, { code: need(code, 'CODE'), pkg: pkgs[0], kind: o.trial ? 'trial' : 'pilot', from: o.from, contact: o.contact,
        actor, name: need(o.name, '--name'), owner: need(o.owner, '--owner'), user: o.user, taxId: o['tax-id'], addr: o.addr, zip: o.zip,
        tel: o.tel, email: o.email });
      console.log(`${code}: opened (${pkgs[0]}, ${o.trial ? 'trial' : 'pilot'} ${r.start} → ${r.end}) at /${code}/`);
      tell(r.user, r.password);
      break;
    }
    case 'password': {
      const r = await resetPassword(db, need(code, 'CODE'), { user: o.user, actor });
      console.log(`${code}: new password; the old one no longer works and the account's sessions ended`);
      tell(r.user, r.password);
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
