// The test server's job before each deploy (App Platform PRE_DEPLOY, .do/app.yaml, task 3.16): applies the schema
// as the database owner, and with SEED_DEMO_SHOPS=1 opens the demo shops while the database has no shop yet
// (tools/demo-shops.mjs). A failed job stops the deploy: the running version stays.
//
//   MIGRATE_DATABASE_URL=… [DATABASE_CA_CERT=…] [SEED_DEMO_SHOPS=1] node tools/deploy-migrate.mjs
import pg from 'pg';
import { migrate } from '../server/db/migrate.ts';
import { pgConfig } from '../server/lib/pg-config.ts';
import { openDemoShops } from './demo-shops.mjs';

const url = process.env.MIGRATE_DATABASE_URL;
if (!url) { console.error('MIGRATE_DATABASE_URL is not set (the database owner, doadmin on DigitalOcean)'); process.exit(1); }

const applied = await migrate(url, console.log);
if (!applied.length) console.log('schema up to date');

// The app's role must be able to sign in with a password: on DigitalOcean it is the database user drivego_app made in
// the control panel before the first deploy (docs/DIGITALOCEAN-SETUP.md). A role the migration had to create has none.
const c = new pg.Client(pgConfig(url));
await c.connect();
try {
  const { rows } = await c.query("select rolsuper, rolbypassrls from pg_roles where rolname = 'drivego_app'");
  if (!rows.length || rows[0].rolsuper || rows[0].rolbypassrls) throw new Error('drivego_app is missing, a superuser or BYPASSRLS');
} finally {
  await c.end();
}

if (process.env.SEED_DEMO_SHOPS === '1') {
  const opened = await openDemoShops(url);
  console.log(opened.length ? `opened demo shops: ${opened.map(d => `${d.code} (${d.who})`).join(', ')}` : 'demo shops: the database already has shops');
}
