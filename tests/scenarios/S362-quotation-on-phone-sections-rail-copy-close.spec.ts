import { test, expect } from '../support/test';

// A phone (390 px): the numbered sections of the quote window fold and unfold, the floating rail's ▲ / ▼ jump to the
// top / bottom, the "⋯ เมนู" sheet has "คัดลอกใบนี้" (saved quotes only) and "ปิดหน้าต่าง", and the corner ✕ closes the
// window. No other scenario pressed them (docs/BEHAVIORS.md; on a computer the section titles are frames that do not fold).
test.use({ viewport: { width: 390, height: 844 } });

test('S362 ใบเสนอราคาบนมือถือ: พับ/กางหัวข้อ ปุ่มขึ้นบนสุด/ลงล่างสุด คัดลอกใบนี้ ปิดหน้าต่างจากเมนู ⋯ และปุ่ม ✕', async ({ app, page, golden }) => {
  test.slow();
  await app.loginAsOwner();

  const open = async (no: string) => {
    await page.getByRole('button', { name: '☰' }).click();
    await page.getByRole('button', { name: /^03 ใบเสนอราคา/ }).click();
    await page.getByText(no, { exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByRole('button', { name: /^⋯\s*เมนู$/ })).toBeVisible();
  };
  const sheet = page.locator('div').filter({ has: page.getByRole('button', { name: 'ปิดหน้าต่าง', exact: true }) })
    .filter({ has: page.getByRole('button', { name: 'พิมพ์ (ต้นฉบับ+สำเนา)', exact: true }) }).last();

  await open('MA-QT261000004');
  await golden.step('เปิดใบเสนอราคา MA-QT261000004 บนมือถือ');

  // Each numbered section: tap its title to fold or unfold it.
  for (const title of ['ลูกค้า & รถ', 'ปัญหาที่ลูกค้าแจ้ง', 'ตรวจพบ / แนวทางซ่อม', 'รายการอะไหล่ & ค่าแรง', 'ผู้เกี่ยวข้อง · สรุปยอด & ภาษี']) {
    const head = page.getByText(title, { exact: true }).filter({ visible: true }).first();
    await head.scrollIntoViewIfNeeded();
    await head.click();
    await golden.step('แตะหัวข้อ ' + title);
  }
  await golden.screen('sections-toggled');

  // The rail: ▼ to the bottom, ▲ back to the top.
  await page.getByRole('button', { name: /^▼\s*ล่างสุด$/ }).click();
  await page.waitForTimeout(800);
  await golden.step('แตะ ▼ ลงล่างสุด');
  await page.getByRole('button', { name: /^▲\s*บนสุด$/ }).click();
  await page.waitForTimeout(800);
  await golden.step('แตะ ▲ ขึ้นบนสุด');

  // "⋯ เมนู" → "คัดลอกใบนี้": a new quote from this one (nothing saved until บันทึก).
  await page.getByRole('button', { name: /^⋯\s*เมนู$/ }).click();
  await expect(sheet.getByRole('button', { name: 'คัดลอกใบนี้', exact: true })).toBeVisible();
  await golden.step('แตะ ⋯ เมนู เห็นคัดลอกใบนี้');
  const before = await app.state();
  await sheet.getByRole('button', { name: 'คัดลอกใบนี้', exact: true }).click();
  await golden.step('แตะคัดลอกใบนี้ ระบบถามยืนยัน');
  await page.getByRole('button', { name: 'คัดลอกเป็นใบใหม่', exact: true }).click();
  await app.settle();
  await golden.step('แตะคัดลอกใบนี้ เปิดใบใหม่ที่มีรายการเดิม');
  await golden.stateChange('copy-quote', before);

  // "⋯ เมนู" → "ปิดหน้าต่าง"
  await page.getByRole('button', { name: /^⋯\s*เมนู$/ }).click();
  await sheet.getByRole('button', { name: 'ปิดหน้าต่าง', exact: true }).click();
  await golden.step('แตะปิดหน้าต่างจากเมนู ระบบเตือนว่าใบที่คัดลอกยังไม่ได้บันทึก');
  await page.getByRole('button', { name: 'ปิดโดยไม่บันทึก', exact: true }).click();
  await app.settle();
  await golden.step('ปิดโดยไม่บันทึก');

  // The phone's own close at the screen corner (✕).
  await open('MA-QT261000004');
  await page.getByRole('button', { name: '✕', exact: true }).filter({ visible: true }).click();
  await app.settle();
  await golden.step('เปิดอีกครั้งแล้วแตะ ✕ ที่มุมจอ');
});
