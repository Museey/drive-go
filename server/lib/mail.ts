// Sending an e-mail (the owner's choice of 2026-11-20: the sign-in details of a shop opened from a website sign-up go
// to the e-mail given, server/lib/signup.ts). Through Resend's HTTP API (DigitalOcean blocks outgoing SMTP):
// RESEND_API_KEY (a secret of the app, docs/DIGITALOCEAN-SETUP.md) and MAIL_FROM, an address of a domain verified
// at Resend (default "DriveGo X <noreply@drivegox.com>"). MAIL_API_URL points elsewhere for the tests
// (tests/db/signup.test.mjs). Without a key nothing is sent and the caller says so.
export const mailOn = () => !!process.env.RESEND_API_KEY;

export interface Mail { to: string; subject: string; text: string }

export async function sendMail(m: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('mail: RESEND_API_KEY is not set');
  const r = await fetch(process.env.MAIL_API_URL || 'https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM || 'DriveGo X <noreply@drivegox.com>', to: [m.to], subject: m.subject, text: m.text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`mail: ${r.status} ${(await r.text().catch(() => '')).slice(0, 300)}`);
}
