// The shops' app and the staff web page answer only their own paths (portal.ts, server/proxy.ts).
//   node --test server/lib/portal.test.ts   (npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, portalOf } from './portal.ts';

const SHOP = ['/demo-biz/', '/demo-biz/js/03.js', '/api/auth/login', '/api/storage', '/api/health', '/api/staffing', '/staffroom/'];
const STAFF = ['/staff', '/staff/', '/staff/staff.js', '/api/staff/sign-in', '/api/staff/shops/demo-biz'];

test('which app: unset or anything else is the shops\' app', () => {
  assert.equal(portalOf(undefined), 'shop');
  assert.equal(portalOf(''), 'shop');
  assert.equal(portalOf('STAFF'), 'shop');
  assert.equal(portalOf('staff'), 'staff');
  assert.equal(portalOf('both'), 'both');
});

test('the shops\' app: no staff page', () => {
  for (const p of SHOP) assert.equal(answer('shop', p), 'pass', p);
  for (const p of STAFF) assert.equal(answer('shop', p), 'not-found', p);
});

test('the staff app: the staff page and the health check only; its root goes to the page', () => {
  for (const p of STAFF) assert.equal(answer('staff', p), 'pass', p);
  assert.equal(answer('staff', '/api/health'), 'pass');
  assert.equal(answer('staff', '/'), 'to-staff');
  for (const p of SHOP.filter(p => p !== '/api/health')) assert.equal(answer('staff', p), 'not-found', p);
});

test('a local run and the tests: both', () => {
  for (const p of [...SHOP, ...STAFF, '/']) assert.equal(answer('both', p), 'pass', p);
});
