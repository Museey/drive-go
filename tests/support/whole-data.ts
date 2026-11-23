// Replacing the whole data set in the new system (task 3.2, decision F1):
// wiping, restoring a backup point, importing a file and loading sample or
// test data ask for a word first, and their button works only once it is
// typed.
import { expect, type Page } from '@playwright/test';

// All of them ask for the word "confirm" (owner 2026-11-23; it was the shop's name), upper or lower case alike.
export async function confirmWithWord(page: Page, button: string, typed = 'confirm') {
  const yes = page.getByRole('button', { name: button, exact: true }).filter({ visible: true });
  await expect(yes).toBeDisabled();
  await page.getByPlaceholder('พิมพ์ confirm เพื่อยืนยัน', { exact: true }).fill(typed);
  await yes.click();
}

// The entry the audit log gets for it.
export const auditNote = (note: string) => `${note} (ระบบสำรองข้อมูลไว้ก่อนแล้ว)`;
