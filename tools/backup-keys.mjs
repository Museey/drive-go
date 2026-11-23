// The key pair of the off-site copies (server/lib/offsite.ts, docs/OFFSITE-BACKUP.md): run ONCE, on the owner's own
// computer, never on the server. The public key goes to DigitalOcean (BACKUP_PUBLIC_KEY of the job `offsite`): with it
// the server can make copies but not open them. The private key stays with the owner, protected with a passphrase,
// in two places away from DigitalOcean (e.g. a USB drive in the shop's safe and a password manager): without it no
// copy can be opened, by anyone, ever.
//
//   node tools/backup-keys.mjs [--out FOLDER]
//
// Writes FOLDER/drivego-backup-private.pem (the passphrase is asked twice, not shown) and prints the public key as one
// line to paste into DigitalOcean.
import { generateKeyPairSync, createPublicKey } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { askHidden } from './ask-hidden.mjs';

const { values: o } = parseArgs({ options: { out: { type: 'string', default: '.' } } });
const dir = resolve(o.out);
const file = join(dir, 'drivego-backup-private.pem');
if (existsSync(file)) { console.error(`มีไฟล์ ${file} อยู่แล้ว: ไม่เขียนทับ (กุญแจเดิมยังใช้เปิดสำเนาเก่าได้)`); process.exit(2); }

const pass = await askHidden('ตั้งรหัสผ่านของกุญแจ (อย่างน้อย 12 ตัว, จะไม่แสดงบนจอ): ');
if (pass.length < 12) { console.error('รหัสผ่านสั้นเกินไป'); process.exit(2); }
if (await askHidden('พิมพ์รหัสผ่านอีกครั้ง: ') !== pass) { console.error('รหัสผ่านสองครั้งไม่ตรงกัน'); process.exit(2); }

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase: pass },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});
mkdirSync(dir, { recursive: true });
writeFileSync(file, privateKey, { mode: 0o600 });
const pub = createPublicKey({ key: privateKey, passphrase: pass }).export({ type: 'spki', format: 'pem' });
console.log(`กุญแจลับ (เก็บไว้เอง 2 ที่ ห้ามส่งขึ้น server): ${file}`);
console.log('กุญแจสาธารณะ: คัดลอกบรรทัดถัดไปทั้งบรรทัด ไปใส่ใน DigitalOcean เป็นค่า BACKUP_PUBLIC_KEY ของ job offsite');
console.log(Buffer.from(pub).toString('base64'));
