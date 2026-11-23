// Calls the new system's storage API directly with the browser's session, the
// way someone could without the screens (task T10: those calls must be refused
// where the account has no right). Only for TARGET=new scenarios. The calls are
// made from the page (fetch), so they carry exactly the browser's own cookie.
import type { Page } from '@playwright/test';

type Answer = { status: number; text: string };

export function storageApi(page: Page) {
  const call = (method: string, key: string, body?: unknown): Promise<Answer> => page.evaluate(async ([method, key, body]) => {
    const r = await fetch(`/api/storage/${encodeURIComponent(key as string)}`, {
      method: method as string, cache: 'no-store',
      ...(body === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    });
    return { status: r.status, text: await r.text() };
  }, [method, key, body] as const);
  const json = (a: Answer) => { try { return JSON.parse(a.text); } catch { return null; } };
  return {
    async read(key: string): Promise<{ status: number; data: any }> {
      const a = await call('GET', key);
      return { status: a.status, data: a.status === 200 ? JSON.parse(a.text.slice(a.text.indexOf('\n') + 1)) : null };
    },
    // One record's new value, as the browser would send it.
    async save(key: string, unit: string, rowKey: string, data: unknown, secrets: { unit: string; key: string; field: string; value: string }[] = []) {
      const a = await call('POST', key, { base: {}, changes: { upsert: [{ unit, key: rowKey, data: JSON.stringify(data) }], remove: [], order: {} }, secrets });
      return { status: a.status, body: json(a) };
    },
    // A save marked as replacing the whole data set (3.2d: wipe, restore, import, sample data), with no change in it.
    async saveWhole(key: string, whole: string) {
      const a = await call('POST', key, { base: {}, changes: { upsert: [], remove: [], order: {} }, whole });
      return { status: a.status, body: json(a) };
    },
    // Records removed in one ordinary save, as the browser would send it.
    async removeRows(key: string, rows: { unit: string; key: string }[]) {
      const a = await call('POST', key, { base: {}, changes: { upsert: [], remove: rows.map(r => ({ ...r, data: '' })), order: {} } });
      return { status: a.status, body: json(a) };
    },
    // A save as sent (any body): for the checks of the shape of a save (SECURITY-AUDIT-2026-11 ก4, S477).
    async post(key: string, body: unknown) {
      const a = await call('POST', key, body);
      return { status: a.status, body: json(a) };
    },
    // A STORE key written whole (a backup point, a flag of the screens).
    async put(key: string, text: string) {
      const a = await page.evaluate(async ([key, text]) => {
        const r = await fetch(`/api/storage/${encodeURIComponent(key)}`, { method: 'PUT', cache: 'no-store', body: text });
        return { status: r.status, text: await r.text() };
      }, [key, text] as const);
      return { status: a.status, body: json(a) };
    },
    async remove(key: string) {
      const a = await call('DELETE', key);
      return { status: a.status, body: json(a) };
    },
  };
}
