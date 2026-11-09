// Codes of the staff page's authenticator apps (totp.ts): the test values of RFC 4226 and RFC 6238.
//   node --test server/lib/totp.test.ts   (npm run test:unit)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { base32, codeAt, fromBase32, matchingStep, newSecret, otpauthUri, qrSvg, stepAt } from './totp.ts';

const SECRET = base32(Buffer.from('12345678901234567890'));

test('base32 as RFC 4648 and the apps write it', () => {
  assert.equal(SECRET, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
  assert.equal(fromBase32('gezd gnbv-gy3t qojq gezd gnbv gy3t qojq').toString(), '12345678901234567890');
  assert.equal(base32(Buffer.from('f')), 'MY');
  assert.equal(base32(Buffer.from('foobar')), 'MZXW6YTBOI');
  const s = newSecret();
  assert.match(s, /^[A-Z2-7]{32}$/);
  assert.equal(base32(fromBase32(s)), s);
  assert.throws(() => fromBase32('A1'));
});

test('HOTP: the values of RFC 4226 appendix D', () => {
  const want = ['755224', '287082', '359152', '969429', '338314', '254676', '287922', '162583', '399871', '520489'];
  want.forEach((code, step) => assert.equal(codeAt(SECRET, step), code));
});

test('TOTP: the SHA-1 values of RFC 6238 appendix B', () => {
  const want: [number, string][] = [[59, '94287082'], [1111111109, '07081804'], [1111111111, '14050471'],
    [1234567890, '89005924'], [2000000000, '69279037'], [20000000000, '65353130']];
  for (const [t, code] of want) assert.equal(codeAt(SECRET, stepAt(t * 1000), 8), code, `T=${t}`);
});

test('a typed code: this step, the one before or after, once', () => {
  const now = 1_700_000_000_000, at = stepAt(now);
  assert.equal(matchingStep(SECRET, codeAt(SECRET, at), now), at);
  assert.equal(matchingStep(SECRET, codeAt(SECRET, at - 1), now), at - 1);
  assert.equal(matchingStep(SECRET, codeAt(SECRET, at + 1), now), at + 1);
  assert.equal(matchingStep(SECRET, codeAt(SECRET, at - 2), now), null);
  assert.equal(matchingStep(SECRET, ` ${codeAt(SECRET, at).slice(0, 3)} ${codeAt(SECRET, at).slice(3)} `, now), at);
  // Used already: neither that code nor an older one.
  assert.equal(matchingStep(SECRET, codeAt(SECRET, at), now, at), null);
  assert.equal(matchingStep(SECRET, codeAt(SECRET, at - 1), now, at), null);
  assert.equal(matchingStep(SECRET, codeAt(SECRET, at + 1), now, at), at + 1);
  for (const bad of ['', '12345', '1234567', 'abcdef', undefined as unknown as string]) assert.equal(matchingStep(SECRET, bad, now), null);
});

test('the otpauth link and its QR code', () => {
  assert.equal(otpauthUri(SECRET, 'somchai'),
    'otpauth://totp/DriveGo%3Asomchai?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=DriveGo&algorithm=SHA1&digits=6&period=30');
  const svg = qrSvg(otpauthUri(SECRET, 'somchai'));
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="(\d+)" height="\1"/);
  assert.match(svg, /<path d="M\d/);
});
