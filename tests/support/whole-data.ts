// Replacing the whole data set in the new system (task 3.2, decision F1):
// wiping, restoring a backup point, importing a file and loading sample or
// test data ask for the shop's name first, and their button works only once
// it is typed exactly.
import { expect, type Page } from '@playwright/test';

export async function confirmWithShopName(page: Page, shopName: string, button: string) {
  const yes = page.getByRole('button', { name: button, exact: true }).filter({ visible: true });
  await expect(yes).toBeDisabled();
  await page.getByPlaceholder(`พิมพ์ชื่อร้าน ${shopName} เพื่อยืนยัน`, { exact: true }).fill(shopName);
  await yes.click();
}

// Wiping asks for the word "confirm" instead (owner 2026-11-23), upper or lower case alike.
export async function confirmWipe(page: Page, button: string, typed = 'confirm') {
  const yes = page.getByRole('button', { name: button, exact: true }).filter({ visible: true });
  await expect(yes).toBeDisabled();
  await page.getByPlaceholder('พิมพ์ confirm เพื่อยืนยัน', { exact: true }).fill(typed);
  await yes.click();
}

// The entry the audit log gets for it.
export const auditNote = (note: string) => `${note} (ระบบสำรองข้อมูลไว้ก่อนแล้ว)`;
