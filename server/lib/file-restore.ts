// Staff restore a deleted attachment for a shop (task 3.11, owner's answer
// 11.1: during the pilot staff restore files on request with a server tool,
// tools/files.mjs; a restore page in menu 10 comes in phase 4). Runs inside
// withShop() for the shop, as its database owner.
//
// A file is deleted when the last row referring to it changes or goes (a
// picture removed or replaced, a knowledge article deleted). Restoring it
// puts the link back where the change log saw it last: into the same field
// of the row (when that field is empty now), or the whole row back when the
// row is gone. The change is saved like any other (versions, change_log with
// no user = staff), so a browser still showing the old data gets the
// "someone else saved first" message on its next save of that row.
import type pg from 'pg';
import { linkOf } from './attachments.ts';
import { type Versions, vkey, writeMain } from './storage.ts';

export type Restored = { unit: string; key: string; storeKey: string; how: 'field' | 'row' };

type Path = (string | number)[];
function pathsOf(v: unknown, link: string, at: Path = [], out: Path[] = []): Path[] {
  if (v === link) out.push(at);
  else if (Array.isArray(v)) v.forEach((x, i) => pathsOf(x, link, [...at, i], out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) pathsOf(x, link, [...at, k], out);
  return out;
}
const empty = (v: unknown) => v === undefined || v === null || v === '' || v === false;

export async function restoreFile(c: pg.ClientBase, branch: string, id: string, { replace = false } = {}): Promise<Restored> {
  const link = linkOf(id);
  const file = await c.query<{ deleted: boolean }>(
    'select deleted_at is not null as deleted from files where shop_id = app_shop() and branch_id = $1 and id = $2', [branch, id]);
  if (!file.rowCount) throw new Error(`file ${id} is not kept for branch '${branch}' (removed for good, or never uploaded)`);
  if (!file.rows[0].deleted) throw new Error(`file ${id} is not deleted: the data still refers to it`);
  const { rows } = await c.query<{ store_key: string; unit: string; key: string; before: string }>(
    `select store_key, unit, key, before::text as before from change_log
      where shop_id = app_shop() and branch_id = $1 and strpos(before::text, $2) > 0 and (after is null or strpos(after::text, $2) = 0)
      order by id desc limit 1`, [branch, link]);
  if (!rows.length) throw new Error(`no change of the shop's data removed file ${id}`);
  const last = rows[0];
  const now = await c.query<{ data: string; version: number }>(
    'select data::text as data, version from records where shop_id = app_shop() and branch_id = $1 and unit = $2 and key = $3', [branch, last.unit, last.key]);
  let data: string, how: Restored['how'];
  const base: Versions = {};
  if (!now.rowCount) {
    data = last.before; how = 'row';
  } else {
    base[vkey(last.unit, last.key)] = now.rows[0].version;
    const before = JSON.parse(last.before), current = JSON.parse(now.rows[0].data);
    let value = current;
    for (const path of pathsOf(before, link)) {
      if (!path.length) { if (!empty(value) && !replace) throw taken(last, value); value = link; continue; }
      let at = value as Record<string | number, unknown>;
      for (const [i, step] of path.slice(0, -1).entries()) {
        if (!at[step] || typeof at[step] !== 'object') at[step] = typeof path[i + 1] === 'number' ? [] : {};
        at = at[step] as Record<string | number, unknown>;
      }
      const end = path[path.length - 1];
      if (!empty(at[end]) && at[end] !== link && !replace) throw taken(last, at[end]);
      at[end] = link;
    }
    data = JSON.stringify(value); how = 'field';
  }
  const r = await writeMain(c, branch, last.store_key, base, { upsert: [{ unit: last.unit, key: last.key, data }], remove: [], order: {} }, null);
  if (!r.ok) throw new Error(`saving ${last.unit} ${last.key}: ${r.conflicts.join(', ')}`);
  await c.query('update files set deleted_at = null, restored_at = now() where shop_id = app_shop() and branch_id = $1 and id = $2', [branch, id]);
  return { unit: last.unit, key: last.key, storeKey: last.store_key, how };
}

const taken = (at: { unit: string; key: string }, v: unknown) =>
  new Error(`${at.unit} ${at.key} holds another value there now (${String(v).slice(0, 80)}); restore with --replace to put the file back instead`);
