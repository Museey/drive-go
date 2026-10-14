import { test } from '../support/test';

test('S00 เจ้าของร้านเข้าสู่ระบบแล้วเห็นหน้าแรก', async ({ app, golden }) => {
  const before = await (async () => { await app.open(); return app.state(); })();
  await golden.step('หน้าเข้าสู่ระบบ');
  await golden.screen('login');

  await app.login('dg1688', '123456');
  await golden.step('หลังเข้าสู่ระบบ');
  await golden.screen('home');
  await golden.stateChange('login', before);
});
