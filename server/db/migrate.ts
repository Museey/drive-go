// Applies server/db/migrations/*.sql in name order, each once, each in its own
// transaction. Run as the database owner (not the app's role):
//
//   MIGRATE_DATABASE_URL=postgres://… node server/db/migrate.ts
//
// Also used by tools/serve-new.mjs and the database tests.
import { readdirSync, readFileSync } from 'node:fs';
import pg from 'pg';
import { pgConfig } from '../lib/pg-config.ts';

const DIR = new URL('./migrations/', import.meta.url);

export async function migrate(url: string, log: (line: string) => void = () => {}): Promise<string[]> {
  const client = new pg.Client(pgConfig(url));
  await client.connect();
  const applied: string[] = [];
  try {
    await client.query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
    const done = new Set((await client.query<{ name: string }>('select name from schema_migrations')).rows.map(r => r.name));
    for (const name of readdirSync(DIR).filter(f => f.endsWith('.sql')).sort()) {
      if (done.has(name)) continue;
      await client.query('begin');
      try {
        await client.query(readFileSync(new URL(name, DIR), 'utf8'));
        await client.query('insert into schema_migrations (name) values ($1)', [name]);
        await client.query('commit');
      } catch (e) {
        await client.query('rollback');
        throw new Error(`migration ${name} failed: ${(e as Error).message}`);
      }
      applied.push(name);
      log(`applied ${name}`);
    }
  } finally {
    await client.end();
  }
  return applied;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.MIGRATE_DATABASE_URL;
  if (!url) { console.error('MIGRATE_DATABASE_URL is not set'); process.exit(1); }
  await migrate(url, console.log);
}
