// What the server leaves out for the signed-in person (task 3.9, server/lib/visibility.ts): read from its answer,
// and applied to another state, so that a state taken as the owner compares with one taken as that person.
import type { Page } from '@playwright/test';
import { assemble, split } from '../../server/lib/units.ts';
import { type Mask, maskRows } from '../../server/lib/visibility.ts';

export async function masksOfSession(page: Page): Promise<Mask[]> {
  return page.evaluate(async () => {
    const r = await fetch('/api/storage/garage.v22', { cache: 'no-store' });
    return JSON.parse(decodeURIComponent(r.headers.get('x-drivego-masks') || '%5B%5D'));
  });
}

export function maskState<T extends { DB: unknown }>(state: T, masks: Mask[]): T {
  const s = split('garage.v22', JSON.stringify(state.DB));
  return { ...state, DB: JSON.parse(assemble('garage.v22', s.layout, maskRows(s.rows, masks), { session: s.session })) };
}
