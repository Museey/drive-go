import { test, expect } from '../support/test';

// The top bar's two small menus: "เมนูบัญชี" (opened with a click, closed with Escape) and the language flag (opened,
// closed with Escape, opened from the keyboard with ↓, English picked, Thai again). Then the window is narrowed to phone
// width and widened again (the top bar's tools move into the menu drawer and back, column widths follow the window).
test('S406 เปิดเมนูบัญชีแล้วกด Esc ปิด เปลี่ยนภาษาเป็นอังกฤษจากเมนูธงด้วยเมาส์และแป้นพิมพ์แล้วกลับเป็นไทย และย่อหน้าจอเป็นขนาดมือถือ', async ({ app, page, golden }) => {
  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  const account = page.getByRole('button', { name: 'เมนูบัญชี' });
  await account.click();
  await expect(account).toHaveAttribute('aria-expanded', 'true');
  await golden.step('เปิดเมนูบัญชี');
  await page.keyboard.press('Escape');
  await expect(account).toHaveAttribute('aria-expanded', 'false');
  await expect(account).toBeFocused();
  await golden.step('กด Esc ปิดเมนูบัญชี');

  const flag = page.getByRole('button', { name: 'Language' });
  await flag.click();
  await expect(flag).toHaveAttribute('aria-expanded', 'true');
  await golden.step('เปิดเมนูภาษา');
  await page.keyboard.press('Escape');
  await expect(flag).toHaveAttribute('aria-expanded', 'false');
  await golden.step('กด Esc ปิดเมนูภาษา');
  await flag.focus();
  await page.keyboard.press('ArrowDown');
  await expect(flag).toHaveAttribute('aria-expanded', 'true');
  await golden.step('กดลูกศรลงที่ธง เปิดเมนูภาษา');

  const before = await app.state();
  await page.getByRole('button', { name: '🇺🇸 English' }).click();
  await expect(flag).toHaveText('🇺🇸');
  await app.settle();
  await golden.step('เลือก English');
  await golden.screen('home-in-english');
  await golden.stateChange('english', before);

  await flag.click();
  await page.getByRole('button', { name: '🇹🇭 Thai' }).click();
  await expect(flag).toHaveText('🇹🇭');
  await app.settle();
  await golden.step('กลับเป็นภาษาไทย');

  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForTimeout(400);
  await app.settle();
  await golden.step('ย่อหน้าจอเป็นขนาดมือถือ');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(400);
  await app.settle();
  await golden.step('ขยายหน้าจอกลับ');
});
