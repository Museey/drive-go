// Attachments in the new system (task 3.11): what the scenarios check about
// a file the app uploaded, and the staff's server tools they use. Only for
// TARGET=new scenarios.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import type { Page } from '@playwright/test';
import { withShop } from '../../server/lib/db.ts';
import { restoreFile } from '../../server/lib/file-restore.ts';

export const LINK = /^\/api\/files\/([0-9a-f]{64})$/;
export const sha256 = (b: Buffer | Uint8Array) => createHash('sha256').update(b).digest('hex');
export const linkOfFile = (path: string) => `/api/files/${sha256(readFileSync(path))}`;

// The bytes of a data: URL (base64).
export const bytesOfDataUrl = (url: string) => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

// GET of a link with the browser's own session.
export async function fetchFile(page: Page, link: string) {
  const r = await page.evaluate(async link => {
    const res = await fetch(link, { cache: 'no-store' });
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return { status: res.status, type: res.headers.get('content-type'), csp: res.headers.get('content-security-policy'),
      nosniff: res.headers.get('x-content-type-options'), base64: btoa(bin) };
  }, link);
  return { ...r, bytes: Buffer.from(r.base64, 'base64') };
}

let pool: pg.Pool | undefined;
const owner = () => (pool ??= new pg.Pool({ connectionString: process.env.DRIVEGO_OWNER_DB, max: 2 }));

// The shop the page is signed in to (its address is /<shop code>/).
const codeOf = (page: Page) => decodeURIComponent(new URL(page.url()).pathname.split('/')[1]);
async function inShopOf<T>(page: Page, fn: (c: pg.ClientBase) => Promise<T>): Promise<T> {
  const { rows } = await owner().query('select id from shops where code = $1', [codeOf(page)]);
  return withShop(owner(), rows[0].id, '*', fn);
}

// What staff run for a shop (tools/files.mjs restore, owner's answer 11.1).
export const staffRestore = (page: Page, id: string, branch = '') => inShopOf(page, c => restoreFile(c, branch, id));

// The state of a file on the server: in use, deleted (restorable) or gone.
export const fileState = (page: Page, id: string) => inShopOf(page, async c =>
  (await c.query<{ deleted: boolean }>('select deleted_at is not null as deleted from files where id = $1', [id])).rows[0]?.deleted === false ? 'in use'
    : (await c.query('select 1 from files where id = $1', [id])).rowCount ? 'deleted' : 'gone');

// Fills the shop's space up to `free` bytes short of the 2 GB with one file the data does not refer to (a test's stand-in for 2 GB of pictures).
export const fillSpace = (page: Page, free: number, branch = '') => inShopOf(page, c => c.query(
  "insert into files (shop_id, branch_id, id, mime, size, use) values (app_shop(), $1, $2, 'image/jpeg', $3, 'picture')",
  [branch, 'f'.repeat(64), 2 * 1024 ** 3 - free]));
