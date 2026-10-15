import { test, expect } from '../support/test';

test.use({ dataset: 'prox-trial' });

test('S87 คลังความรู้ P2: จัดการหมวดหมู่ เพิ่มหมวด แก้ชื่อหมวดที่มีบทความ และลบหมวดที่มีบทความ (ย้ายไป "ทั่วไป")', async ({ app, page, golden }) => {
  // ระบบเดิมถามยืนยันการลบด้วยกล่อง confirm ของเบราว์เซอร์ ซึ่งกรรมการลำดับขั้นตอนมองไม่เห็น
  // จึงเก็บข้อความไว้ตรวจกับเฉลยแยก (confirm-dialogs.txt) และกด "ตกลง" ให้
  const confirms: string[] = [];
  page.on('dialog', dialog => { confirms.push(`${dialog.type()}: ${dialog.message()}`); dialog.accept(); });

  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /ห้องข้อมูลเทคนิค/ }).click();
  await page.getByRole('button', { name: '🌐 Publish Data · แบ่งปันเครือข่าย' }).click();
  await page.getByRole('button', { name: '🗂 หมวดหมู่ — เพิ่ม / แก้ชื่อ / ลบ' }).click();
  await golden.step('P2 แท็บ Publish Data เปิดหน้าต่างจัดการหมวดหมู่ความรู้');

  const newName = page.getByPlaceholder('ชื่อหมวดใหม่ เช่น ระบบไฟฟ้า EV แรงดันสูง');
  const add = page.getByRole('button', { name: '+ เพิ่มหมวด' });
  await add.click();
  await golden.step('กดเพิ่มหมวดโดยยังไม่กรอกชื่อ');

  await newName.fill('การแก้ Code');
  await add.click();
  await golden.step('เพิ่มหมวดชื่อซ้ำ "การแก้ Code"');

  // แถวของหมวดในตาราง: ช่องชื่อหมวดแสดงชื่อเดิมไว้ให้พิมพ์ทับ
  const topicRow = (name: string) => page.getByRole('row').filter({ has: page.locator(`input[value="${name}"]`) });

  let before = await app.state();
  await newName.fill('ระบบไฟฟ้า EV แรงดันสูง');
  await add.click();
  await expect(topicRow('ระบบไฟฟ้า EV แรงดันสูง')).toHaveCount(1);
  await golden.step('หลังเพิ่มหมวด "ระบบไฟฟ้า EV แรงดันสูง"');
  await golden.stateChange('add-topic', before);

  const aircon = topicRow('ปริมาณเติมน้ำยาแอร์');
  await aircon.getByRole('textbox').fill('ปริมาณน้ำมันคอมพ์');
  await aircon.getByRole('button', { name: '💾 บันทึก' }).click();
  await golden.step('แก้ชื่อหมวดให้ซ้ำกับหมวดที่มีอยู่');

  before = await app.state();
  await aircon.getByRole('textbox').fill('น้ำยาแอร์ / สเปคเติม');
  await aircon.getByRole('button', { name: '💾 บันทึก' }).click();
  await expect(topicRow('น้ำยาแอร์ / สเปคเติม')).toHaveCount(1);
  await golden.step('หลังแก้ชื่อหมวด "ปริมาณเติมน้ำยาแอร์" เป็น "น้ำยาแอร์ / สเปคเติม"');
  await golden.stateChange('rename-topic', before);

  before = await app.state();
  await topicRow('การแก้ Code').getByRole('button', { name: '🗑' }).click();
  await expect(topicRow('การแก้ Code')).toHaveCount(0);
  await golden.step('หลังลบหมวด "การแก้ Code" ที่มีบทความ 1 ชิ้น');
  await golden.stateChange('delete-topic-with-content', before);

  before = await app.state();
  await topicRow('ระบบส่งกำลัง').getByRole('button', { name: '🗑' }).click();
  await expect(topicRow('ระบบส่งกำลัง')).toHaveCount(0);
  await golden.step('หลังลบหมวด "ระบบส่งกำลัง" ที่ยังไม่มีบทความ');
  await golden.stateChange('delete-empty-topic', before);
  await golden.screen('topics-after');

  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).click();
  await page.getByRole('button', { name: '🔒 Private Data · เฉพาะภายในอู่' }).click();
  await page.getByRole('button', { name: 'ทั่วไป', exact: true }).click();
  await golden.step('ปิดหน้าต่าง ไปแท็บ Private Data หมวด "ทั่วไป"');
  await golden.screen('private-general-topic');

  expect(confirms.join('\n') + '\n').toMatchSnapshot('confirm-dialogs.txt');
});
