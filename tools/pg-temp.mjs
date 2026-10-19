// A throwaway PostgreSQL for tests and local runs: a fresh cluster in a temp
// directory on a random port, removed again on stop(). Uses the PostgreSQL
// binaries on this machine (no Docker needed); set PG_BIN to pick a version.
//
//   node tools/pg-temp.mjs          start one, print its URL, stop on Ctrl+C
//
//   import { startTempPostgres } from './pg-temp.mjs';
//   const pg = await startTempPostgres();   // { url, port, stop(): Promise }
//
// initdb and postgres refuse to run as root, so as root they run as the
// "postgres" system user (the cloud container runs everything as root).
// Works on Linux, macOS (Postgres.app or Homebrew) and Windows (the
// PostgreSQL installer); see docs/TRY-LOCALLY.md.
import { execFileSync, spawn } from 'node:child_process';
import { chownSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { pathToFileURL } from 'node:url';

const PREFIX = 'drivego-pg-';

const exe = name => process.platform === 'win32' ? `${name}.exe` : name;

// The newest version under root/<version>/bin (Debian, Windows) or
// root/postgresql@<version>/bin (Homebrew).
function newestUnder(root) {
  if (!existsSync(root)) return null;
  const version = d => Number(d.replace(/^postgresql@/, '')) || 0;
  const v = readdirSync(root).filter(d => version(d) && existsSync(join(root, d, 'bin', exe('initdb')))).sort((a, b) => version(b) - version(a))[0];
  return v ? join(root, v, 'bin') : null;
}

function binDir() {
  if (process.env.PG_BIN) return process.env.PG_BIN;
  try { return execFileSync('pg_config', ['--bindir'], { encoding: 'utf8' }).trim(); } catch {}
  const found = [
    newestUnder('/usr/lib/postgresql'),
    '/Applications/Postgres.app/Contents/Versions/latest/bin',
    newestUnder('/opt/homebrew/opt'),
    newestUnder('/usr/local/opt'),
    newestUnder(join(process.env.ProgramFiles || 'C:\\Program Files', 'PostgreSQL')),
  ].find(d => d && existsSync(join(d, exe('initdb'))));
  if (found) return found;
  throw new Error('PostgreSQL binaries not found: install PostgreSQL or set PG_BIN');
}

const freePort = () => new Promise((res, rej) => {
  const s = createServer().listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => res(port)); }).on('error', rej);
});

const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };

// A run that was killed outright (SIGKILL) cannot clean up after itself.
// Each cluster records the process that made it (owner.pid); clusters whose
// owner is gone are stopped and removed. Clusters of running processes (other
// test files running in parallel) are left alone, even while initdb is still
// creating them.
function sweep() {
  for (const d of readdirSync(tmpdir())) {
    if (!d.startsWith(PREFIX)) continue;
    const dir = join(tmpdir(), d);
    const pid = file => { try { return Number(readFileSync(join(dir, file), 'utf8').split('\n')[0]); } catch { return 0; } };
    const owner = pid('owner.pid');
    if (owner ? alive(owner) : Date.now() - statSync(dir).mtimeMs < 60_000) continue;
    const server = pid('data/postmaster.pid');
    if (server && alive(server)) try { process.kill(server, 'SIGQUIT'); } catch {}
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function startTempPostgres({ database = 'drivego', user = 'drivego' } = {}) {
  const bin = binDir();
  // As root, every PostgreSQL program runs as the postgres user directly (no
  // runuser in between, so signals reach the server itself).
  const asUser = process.getuid && process.getuid() === 0
    ? { uid: Number(execFileSync('id', ['-u', 'postgres'], { encoding: 'utf8' })), gid: Number(execFileSync('id', ['-g', 'postgres'], { encoding: 'utf8' })) }
    : {};
  const run = (cmd, args) => execFileSync(join(bin, cmd), args, { ...asUser, stdio: 'ignore' });
  try { sweep(); } catch {}
  const dir = mkdtempSync(join(tmpdir(), PREFIX));
  writeFileSync(join(dir, 'owner.pid'), String(process.pid));
  if (asUser.uid !== undefined) chownSync(dir, asUser.uid, asUser.gid);
  const data = join(dir, 'data');
  // C locale: sorting and comparisons are byte order, the same on every machine.
  run('initdb', ['-D', data, '-U', user, '--auth=trust', '-E', 'UTF8', '--locale=C']);
  const port = await freePort();
  // Durability settings off: a test database is thrown away anyway.
  // Clients connect over TCP; the socket goes in the cluster's own directory
  // (Windows: none).
  const socket = process.platform === 'win32' ? ['-c', 'unix_socket_directories='] : ['-k', dir];
  const proc = spawn(join(bin, 'postgres'), ['-D', data, '-p', String(port), ...socket, '-c', 'listen_addresses=127.0.0.1',
    '-c', 'fsync=off', '-c', 'synchronous_commit=off', '-c', 'full_page_writes=off'], { ...asUser, stdio: 'ignore' });
  const exited = new Promise(r => proc.once('exit', r));
  for (let i = 0; ; i++) {
    try { run('pg_isready', ['-h', '127.0.0.1', '-p', String(port), '-U', user]); break; }
    catch { if (i > 100 || proc.exitCode !== null) throw new Error('temporary PostgreSQL did not start'); await new Promise(r => setTimeout(r, 100)); }
  }
  run('createdb', ['-h', '127.0.0.1', '-p', String(port), '-U', user, database]);
  let stopping;
  // Smart shutdown first (waits for clients that are still closing, so they
  // do not get a "terminating connection" error), then fast, then immediate.
  const stop = () => stopping ||= (async () => {
    // Windows has no signals: pg_ctl asks the server to stop (fast shutdown).
    if (process.platform === 'win32') try { run('pg_ctl', ['stop', '-D', data, '-m', 'fast', '-w']); } catch {}
    for (const [signal, ms] of [['SIGTERM', 3000], ['SIGINT', 5000], ['SIGQUIT', 5000]]) {
      if (proc.exitCode !== null || proc.signalCode !== null) break;
      proc.kill(signal);
      if (await Promise.race([exited.then(() => true), new Promise(r => setTimeout(r, ms, false))])) break;
    }
    // Retries: Windows may hold the files open for a moment after the server exits.
    rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  })();
  return { url: `postgres://${user}@127.0.0.1:${port}/${database}`, port, stop };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pg = await startTempPostgres();
  console.log(pg.url);
  const end = () => pg.stop().then(() => process.exit(0));
  for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(s, end);
}
