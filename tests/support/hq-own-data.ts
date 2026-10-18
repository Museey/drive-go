// Decision Q3 (task T8): in the new system HQ works on its own data set, not
// on the first branch's (B001) as the test copy did. On HQ's own screens that
// shows in four places, which the HQ scenarios check here and leave out of
// the comparison with the legacy screenshots:
//   name at the top of the side menu  the chain's name (B001's is Drivego Service)
//   licence line                      HQ's own data set's: a year from its first day, like a new branch's
//   badge of menu 00                  HQ's own overdue bills: none
//   approval bell                     HQ's own documents waiting for approval: none
import type { Locator, Page } from '@playwright/test';
import { expect } from './test';

export async function hqOwnData(page: Page): Promise<Locator[]> {
  const brand = page.getByText('ALL EV SERVICE', { exact: true }).filter({ visible: true });
  const licence = page.getByText(/^Expired Date/).filter({ visible: true });
  const home = page.getByRole('button', { name: /00 Mr\.DriveGo/ });
  const bell = page.getByTitle(/เอกสารรอการอนุมัติ/);
  await expect(brand).toBeVisible();
  await expect(licence).toHaveText('Expired Date 13/10/2570 · เหลืออายุการใช้งาน 365 วัน');
  // No count after the menu name (the test copy showed B001's overdue bills).
  await expect.poll(async () => (await home.innerText()).replace(/\s+/g, ' ').trim()).toBe('00 Mr.DriveGo');
  await expect(bell).toHaveAttribute('title', 'ไม่มีเอกสารรอการอนุมัติ');
  // The name comes with its first letter in a badge beside it.
  return [brand.locator('..'), licence, home, bell];
}

// Password cells of the account tables (decision A3): ******** where the test copy showed the password.
export async function hiddenPasswords(scope: Page | Locator, count: number): Promise<Locator> {
  const cells = scope.getByRole('cell', { name: '********', exact: true });
  await expect(cells).toHaveCount(count);   // visible ones: role locators skip hidden copies
  await expect(scope.getByRole('cell', { name: /^\d{4}$/ })).toHaveCount(0);
  return cells;
}

// Every password cell on screen (other branches' cards too), for a screen's mask.
export const allPasswordCells = (page: Page) => page.getByRole('cell', { name: '********', exact: true });
