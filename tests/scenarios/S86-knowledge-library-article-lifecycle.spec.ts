import { test, expect } from '../support/test';

test.use({ dataset: 'prox-trial' });

test('S86 คลังความรู้ P2: เติมชุดตัวอย่าง เพิ่มบทความพร้อมรูป เปิดดู สลับเป็น Private แล้วลบ', async ({ app, page, golden }) => {
  // ระบบเดิมถามยืนยันการลบด้วยกล่อง confirm ของเบราว์เซอร์ ซึ่งกรรมการลำดับขั้นตอนมองไม่เห็น
  // จึงเก็บข้อความไว้ตรวจกับเฉลยแยก (confirm-dialogs.txt) และกด "ตกลง" ให้
  const confirms: string[] = [];
  page.on('dialog', dialog => { confirms.push(`${dialog.type()}: ${dialog.message()}`); dialog.accept(); });

  await app.loginAsOwner();
  await golden.step('หน้าแรก');

  await page.getByRole('button', { name: /DriveGo ProX · Ecosystem/ }).click();
  const fillSamples = page.getByRole('button', { name: '▶ เติมชุดความรู้ตัวอย่าง (P2)' });
  let before = await app.state();
  await fillSamples.click();
  await golden.step('เมนู P1 กดเติมชุดความรู้ตัวอย่าง');
  await golden.stateChange('sample-knowledge', before);

  // กดซ้ำ: ไม่เพิ่มซ้ำ มีแค่ข้อความบอก
  await fillSamples.click();
  await golden.step('กดเติมชุดความรู้ตัวอย่างซ้ำ');

  await page.getByRole('button', { name: /ห้องข้อมูลเทคนิค/ }).click();
  await page.getByRole('button', { name: '🌐 Publish Data · แบ่งปันเครือข่าย' }).click();
  await page.getByRole('button', { name: '+ เพิ่มบทความ / อัปโหลดคลิป' }).click();
  await golden.step('P2 แท็บ Publish Data เปิดฟอร์มเพิ่มบทความ');

  const save = page.getByRole('button', { name: 'บันทึกเข้าคลังความรู้' });
  await save.click();
  await golden.step('กดบันทึกโดยยังไม่กรอกชื่อเรื่อง');

  const title = 'ค่าแรงดันน้ำยาแอร์ที่วัดได้ Toyota Yaris ATIV';
  await page.getByLabel('ชื่อเรื่อง *').fill(title);
  await page.getByLabel('หมวดหมู่').filter({ visible: true }).selectOption('ปริมาณน้ำมันคอมพ์');
  await save.click();
  await golden.step('กดบันทึกโดยยังไม่แนบไฟล์และไม่มีคำอธิบาย');

  await page.getByLabel('แนบไฟล์บทความ (PDF / รูป / เอกสาร) หรือคลิปวิดีโอ').setInputFiles('tests/assets/S86-ac-gauge-reading.png');
  await expect(page.getByText('✓ แนบ S86-ac-gauge-reading.png', { exact: false })).toBeVisible();
  await page.getByLabel('คำอธิบาย / สรุปเนื้อหา (ไม่แนบไฟล์ก็บันทึกเป็นบทความข้อความได้)')
    .fill('รอบเดินเบา แอร์เปิดสุด: ฝั่งต่ำ 30–35 psi ฝั่งสูง 180–200 psi ที่อุณหภูมิ 32°C');

  before = await app.state();
  await save.click();
  const del = page.getByRole('button', { name: 'ลบ', exact: true }).filter({ visible: true });
  await expect(del).toHaveCount(1);
  await golden.step('แนบรูป กรอกคำอธิบาย แล้วบันทึกเข้าคลังความรู้');
  await golden.stateChange('save-article', before);
  await golden.screen('published-article');

  await page.getByRole('button', { name: 'เปิดดู', exact: true }).filter({ visible: true }).click();
  await golden.step('เปิดดูบทความ');
  await golden.screen('view-article');
  await page.getByRole('button', { name: 'ปิด', exact: true }).filter({ visible: true }).click();

  before = await app.state();
  await page.getByTitle('คลิกเพื่อสลับการมองเห็น').click();
  await expect(del).toHaveCount(0);
  await golden.step('ปิดหน้าดูบทความ แล้วกดสลับเป็น Private');
  await golden.stateChange('toggle-private', before);

  await page.getByRole('button', { name: '🔒 Private Data · เฉพาะภายในอู่' }).click();
  await expect(del).toHaveCount(1);
  await golden.step('แท็บ Private Data');

  before = await app.state();
  await del.click();
  await expect(del).toHaveCount(0);
  await golden.step('หลังกดลบและยืนยัน');
  await golden.stateChange('delete-article', before);

  expect(confirms.join('\n') + '\n').toMatchSnapshot('confirm-dialogs.txt');
});
