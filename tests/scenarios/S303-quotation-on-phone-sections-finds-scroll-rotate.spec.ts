import { test, expect } from '../support/test';

// A phone (390 px), the parts of the phone layout no other scenario used (docs/BEHAVIORS.md): tapping a section
// header of the quote window folds/unfolds it, "+ เพิ่มอาการที่ตรวจพบ" shows one more empty line, the rail's
// ▼ ล่างสุด / ▲ บนสุด scroll the window, tapping the dimmed page beside the ☰ menu closes the menu, and turning
// the phone sideways (the window is resized) is handled.
test.use({ viewport: { width: 390, height: 844 } });

test('S303 ใบเสนอราคาบนมือถือ: แตะหัวข้อพับ/กาง เพิ่มบรรทัดอาการที่ตรวจพบ เลื่อนลงล่างสุดและขึ้นบนสุด ปิดเมนู ☰ ด้วยการแตะพื้นหลัง และหมุนจอ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรกบนมือถือ');

  // ☰ opens the side menu; tapping the dimmed page beside it closes it again.
  await page.getByRole('button', { name: '☰' }).click();
  const quotesMenu = page.getByRole('button', { name: /^03 ใบเสนอราคา/ });
  await expect(quotesMenu).toBeInViewport();
  await golden.step('กด ☰ เปิดเมนู');
  await page.mouse.click(380, 600);
  await expect(quotesMenu).not.toBeInViewport();
  await golden.step('แตะพื้นหลังข้างเมนู เมนูปิด');

  await page.getByRole('button', { name: '☰' }).click();
  await quotesMenu.click();
  await page.getByText('MA-QT261000001', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByTitle('ลงล่างสุด').filter({ visible: true })).toBeVisible();
  await golden.step('เปิดใบเสนอราคา MA-QT261000001 บนมือถือ');

  // Section 3 starts folded: tap its header, then add a line for one more finding.
  const addFind = page.getByRole('button', { name: '+ เพิ่มอาการที่ตรวจพบ' });
  await expect(addFind).toBeHidden();
  await page.getByText('ตรวจพบ / แนวทางซ่อม', { exact: true }).click();
  await expect(addFind).toBeVisible();
  await golden.step('แตะหัวข้อ 3 ตรวจพบ / แนวทางซ่อม กางออก');
  const findLines = page.getByRole('textbox').filter({ visible: true });
  const linesBefore = await findLines.count();
  await addFind.click();
  await expect(findLines).toHaveCount(linesBefore + 1);
  await expect(page.locator(':focus')).toBeVisible();
  await golden.step('กดเพิ่มอาการที่ตรวจพบ ได้บรรทัดว่างเพิ่ม 1 บรรทัด');
  await golden.screen('find-line-added');

  // Section 1 starts open: tap its header to fold it.
  const customer = page.getByText('ลูกค้า & รถ', { exact: true });
  await customer.click();
  await golden.step('แตะหัวข้อ 1 ลูกค้า & รถ พับเก็บ');
  await customer.click();
  await golden.step('แตะอีกครั้ง กางออก');

  // The rail: bottom, then top (smooth scrolling).
  await page.getByTitle('ลงล่างสุด').filter({ visible: true }).click();
  await expect(customer).not.toBeInViewport();
  await golden.step('กด ▼ ล่างสุด ที่แถบลอย');
  await page.getByTitle('ขึ้นบนสุด').filter({ visible: true }).click();
  await expect(customer).toBeInViewport();
  await golden.step('กด ▲ บนสุด ที่แถบลอย');

  // Turn the phone sideways and back.
  await page.setViewportSize({ width: 844, height: 390 });
  await app.settle();
  await golden.step('หมุนจอเป็นแนวนอน');
  await page.setViewportSize({ width: 390, height: 844 });
  await app.settle();
  await golden.step('หมุนจอกลับแนวตั้ง');
});
