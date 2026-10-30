// node --test server/lib/pg-config.test.ts   (npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pgConfig } from './pg-config.ts';

const CA = '-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n';

test('ไม่มี DATABASE_CA_CERT ใช้ข้อความเชื่อมต่อตามเดิม (ฐานข้อมูลในเครื่องและของ test)', () => {
  delete process.env.DATABASE_CA_CERT;
  assert.deepEqual(pgConfig('postgres://drivego_app@127.0.0.1:5432/drivego'), { connectionString: 'postgres://drivego_app@127.0.0.1:5432/drivego' });
});

test('มี DATABASE_CA_CERT เอา sslmode ออกจากข้อความแล้วตรวจใบรับรองกับ CA นั้น (ข้อความของ DigitalOcean)', () => {
  process.env.DATABASE_CA_CERT = CA;
  try {
    const c = pgConfig('postgresql://drivego_app:secret@db-x.ondigitalocean.com:25060/defaultdb?sslmode=require');
    assert.equal(c.connectionString, 'postgresql://drivego_app:secret@db-x.ondigitalocean.com:25060/defaultdb');
    assert.deepEqual(c.ssl, { ca: CA, rejectUnauthorized: true });
    // other settings of the string stay
    assert.equal(pgConfig('postgresql://u:p@h:25060/d?sslmode=require&application_name=web').connectionString, 'postgresql://u:p@h:25060/d?application_name=web');
  } finally {
    delete process.env.DATABASE_CA_CERT;
  }
});
