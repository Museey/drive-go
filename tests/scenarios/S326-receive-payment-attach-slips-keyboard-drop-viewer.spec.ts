import { readFileSync } from 'node:fs';
import { test, expect } from '../support/test';

// The slip area of the settlement window (รับชำระเงินลูกหนี้): choosing a picture from the keyboard (Enter on the upload
// area), dropping a file onto it (drag over, leave, drop), and the full-screen viewer (next / previous, close). No legacy
// scenario attached a slip here (S192/S193 are new-system scenarios). Nothing is saved: the window is closed.
test('S326 รับชำระลูกหนี้: แนบสลิปด้วยแป้นพิมพ์และลากไฟล์มาวาง แล้วดูสลิปเต็มจอ', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();
  await page.getByText('บัญชี - การเงิน', { exact: true }).click();
  await page.getByRole('button', { name: 'ลูกหนี้ (ค้างรับ)' }).click();
  await page.getByRole('button', { name: '+ รับชำระเงิน', exact: true }).click();
  await page.getByRole('button').filter({ hasText: 'ปรีชา ทองสุข' }).filter({ visible: true }).click();
  await golden.step('รับชำระเงินลูกหนี้ เลือกปรีชา ทองสุข');

  // Keyboard: Tab to the upload area, Enter opens the file chooser.
  const zone = page.getByRole('button', { name: 'แนบรูปสลิป' });
  await zone.focus();
  const chooser = page.waitForEvent('filechooser');
  await page.keyboard.press('Enter');
  await (await chooser).setFiles('tests/assets/S326-transfer-slip.png');
  const preview = page.getByTitle('แตะเพื่อดูเต็มจอ');
  await expect(preview).toBeVisible();
  await golden.step('กด Enter ที่ช่องแนบสลิป เลือกรูปสลิปโอน');

  // Drop a second picture on the slip box.
  const data = readFileSync('tests/assets/S326-wide-cheque.png').toString('base64');
  const dt = await page.evaluateHandle(b64 => {
    const bin = atob(b64), bytes = Uint8Array.from(bin, c => c.charCodeAt(0)), t = new DataTransfer();
    t.items.add(new File([bytes], 'S326-wide-cheque.png', { type: 'image/png' }));
    return t;
  }, data);
  await preview.dispatchEvent('dragover', { dataTransfer: dt });
  await preview.dispatchEvent('dragleave', { dataTransfer: dt });
  await preview.dispatchEvent('dragover', { dataTransfer: dt });
  await preview.dispatchEvent('drop', { dataTransfer: dt });
  await expect(page.getByText('2 / 2').or(page.getByText(/รูปที่ 2/)).first()).toBeAttached();
  await golden.step('ลากรูปเช็คมาวาง มีสลิป 2 รูป');

  // Full-screen viewer.
  await preview.click();
  const viewer = page.getByRole('dialog', { name: 'ดูสลิปเต็มจอ' });
  await expect(viewer).toBeVisible();
  await golden.step('ดูสลิปเต็มจอ');
  await viewer.getByRole('button', { name: 'รูปก่อนหน้า' }).click();
  await viewer.getByRole('button', { name: 'รูปถัดไป' }).click();
  await golden.step('เลื่อนดูรูปก่อนหน้าและถัดไป');
  await viewer.getByRole('button', { name: 'ปิด' }).click();
  await expect(viewer).toBeHidden();
  await golden.step('ปิดหน้าดูสลิป');

  // Close without saving.
  const before = await app.state();
  await page.locator('#mPartPay').getByRole('button', { name: 'ปิด', exact: true }).click();
  await golden.step('ปิดหน้าต่างรับชำระโดยไม่บันทึก');
  await golden.stateChange('close-without-saving', before);
});
