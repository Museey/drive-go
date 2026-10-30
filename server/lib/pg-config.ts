import type { ConnectionOptions } from 'node:tls';

// How everything reaches PostgreSQL: the app's pool (db.ts), the live updates' listening connection (live.ts), the
// migrations (db/migrate.ts) and the staff tools. A managed database (DigitalOcean, task 3.16) only takes TLS and signs
// its certificate with a CA of its own: its connection string says sslmode=require and the CA comes in DATABASE_CA_CERT
// (App Platform: ${db.CA_CERT}; a staff tool: DATABASE_CA_CERT="$(cat ca-certificate.crt)"). node-postgres lets ssl
// settings in the string override the ssl option beside it, so with a CA they are taken out of the string, and the
// server's certificate is checked against that CA and its host name (verify-full). Without DATABASE_CA_CERT the string is
// used as it is (the local and test databases: no TLS).
export function pgConfig(url: string): { connectionString: string; ssl?: ConnectionOptions } {
  const ca = process.env.DATABASE_CA_CERT;
  if (!ca) return { connectionString: url };
  const u = new URL(url);
  for (const k of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat']) u.searchParams.delete(k);
  return { connectionString: u.toString(), ssl: { ca, rejectUnauthorized: true } };
}
