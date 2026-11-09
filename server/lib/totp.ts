// Codes from an authenticator app (Google Authenticator, Microsoft Authenticator …) for the staff page's second step
// of signing in: TOTP of RFC 6238 with the apps' usual settings (HMAC-SHA1, 6 digits, a new code every 30 seconds).
// The secret is base32 (RFC 4648) as the apps take it, typed or from the QR code of an otpauth:// link.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import qrcode from 'qrcode-generator';

export const PERIOD = 30;
export const DIGITS = 6;
// A code of the step before or after still works: the phone's clock may be a little off.
const WINDOW = 1;

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32(bytes: Uint8Array): string {
  let out = '', bits = 0, value = 0;
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function fromBase32(text: string): Buffer {
  const s = text.toUpperCase().replace(/[\s=-]/g, '');
  const out: number[] = [];
  let bits = 0, value = 0;
  for (const ch of s) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error('not base32');
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

// A new secret: 160 bits, as RFC 4226 recommends.
export const newSecret = () => base32(randomBytes(20));

export const stepAt = (ms: number) => Math.floor(ms / 1000 / PERIOD);

// The code of one 30-second step (RFC 4226 HOTP with the step as the counter).
export function codeAt(secret: string, step: number, digits = DIGITS): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac('sha1', fromBase32(secret)).update(counter).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digits).padStart(digits, '0');
}

// The step whose code was typed, or null. A step not after `lastStep` (a code already used) never matches.
export function matchingStep(secret: string, typed: string, now = Date.now(), lastStep = 0): number | null {
  const code = String(typed ?? '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(code)) return null;
  const at = stepAt(now);
  for (let s = at - WINDOW; s <= at + WINDOW; s++) {
    if (s <= lastStep) continue;
    if (timingSafeEqual(Buffer.from(codeAt(secret, s)), Buffer.from(code))) return s;
  }
  return null;
}

// What the app reads from the QR code: it lists the account as DriveGo (login).
export function otpauthUri(secret: string, login: string, issuer = 'DriveGo'): string {
  const label = encodeURIComponent(`${issuer}:${login}`);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD}`;
}

// The link as a QR code, an SVG of black squares on white (shown in the page as an <img> of a data: URL).
export function qrSvg(text: string, cell = 5, margin = 4): string {
  const qr = qrcode(0, 'M');
  qr.addData(text, 'Byte');
  qr.make();
  const n = qr.getModuleCount(), size = (n + 2 * margin) * cell;
  let path = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (qr.isDark(r, c)) path += `M${(c + margin) * cell} ${(r + margin) * cell}h${cell}v${cell}h-${cell}z`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}
