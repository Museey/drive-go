// Sign-ups from the website (the owner's request of 2026-11-20, docs/NOTES.md "ลงทะเบียนทดลองใช้จากหน้าเว็บ"): the form
// of the landing page (POST /api/signup) adds a request; staff see it on the staff web page (/ops, api/ops/signups),
// open the shop from it as "เปิดร้านใหม่" does (staff-shops.ts openShop: a trial unless staff choose otherwise), and
// the owner's user name and temporary password go to the e-mail of the request (mail.ts). Without e-mail (no key, or
// it failed) the page shows them once, for staff to tell on the phone. A request can also be turned down.
import type pg from 'pg';
import { mailOn, sendMail } from './mail.ts';
import { openShop } from './staff-shops.ts';

type Body = Record<string, unknown>;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bad = (message: string) => Object.assign(new Error(message), { status: 400 });

// The consent ticked on the form, as the page shows it (server/site/landing.js form.consent): kept with the request.
export const CONSENT = {
  th: 'ยินยอมให้บริษัท ไดร์ฟบิซ เมคคาไลซ์ โซลูชั่น จำกัด เก็บและใช้ข้อมูลนี้เพื่อเปิดร้านทดลองใช้และติดต่อกลับ ตามนโยบายความเป็นส่วนตัว',
  en: 'I agree that Drivebiz Mecalyze Solution Co., Ltd. keeps and uses these details to open my trial shop and contact me, under the privacy policy',
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// A request from the form. 'trap' is a field people do not see: something in it is a robot, quietly not kept.
export async function addSignup(db: pg.Pool, b: Body, meta: { address: string; agent: string }): Promise<{ kept: boolean }> {
  if (str(b.trap, 200)) return { kept: false };
  const lang = b.lang === 'en' ? 'en' : 'th';
  const s = {
    pkg: str(b.pkg, 20), name: str(b.name, 200), owner: str(b.owner, 200), tel: str(b.tel, 40), email: str(b.email, 200).toLowerCase(),
    taxId: str(b.taxId, 20), addr: str(b.addr, 500), zip: str(b.zip, 10), note: str(b.note, 2000),
  };
  if (!['biz', 'prox', 'franchise'].includes(s.pkg)) throw bad('pkg');
  if (!s.name || !s.owner) throw bad('name');
  if (s.tel.replace(/\D/g, '').length < 9) throw bad('tel');
  if (!EMAIL.test(s.email)) throw bad('email');
  if (b.consent !== true) throw bad('consent');
  await db.query(`insert into signups (pkg, name, owner, tel, email, tax_id, addr, zip, note, lang, consent, address, agent)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
  [s.pkg, s.name, s.owner, s.tel, s.email, s.taxId, s.addr, s.zip, s.note, lang, CONSENT[lang], meta.address, meta.agent.slice(0, 300)]);
  return { kept: true };
}

// At most SIGNUP_LIMIT requests an hour from one address (in this server's memory; a robot without the trap field).
export const SIGNUP_LIMIT = 5;
const recent = new Map<string, number[]>();
export function allowSignup(address: string, now = Date.now()): boolean {
  const list = (recent.get(address) ?? []).filter(t => t > now - 3_600_000);
  if (list.length >= SIGNUP_LIMIT) { recent.set(address, list); return false; }
  list.push(now);
  recent.set(address, list);
  if (recent.size > 10_000) for (const [k, v] of recent) if (!v.some(t => t > now - 3_600_000)) recent.delete(k);
  return true;
}

const COLUMNS = `id, at, pkg, name, owner, tel, email, tax_id as "taxId", addr, zip, note, lang, consent, status, decided_at as "decidedAt",
  decided_by as "decidedBy", decision_note as "decisionNote", shop_code as "shopCode", mailed_at as "mailedAt", mail_error as "mailError"`;

// The requests, new ones first, then the latest decided.
export async function listSignups(db: pg.Pool) {
  const r = await db.query(`select ${COLUMNS} from signups order by (status = 'new') desc, id desc limit 300`);
  return { signups: r.rows, mail: mailOn() };
}

async function pending(db: pg.Pool, id: number) {
  const r = await db.query(`select ${COLUMNS} from signups where id = $1`, [id]);
  if (!r.rows.length) throw bad('no such request');
  if (r.rows[0].status !== 'new') throw bad(`decided already (${r.rows[0].status})`);
  return r.rows[0];
}

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CARD = { biz: 'DriveGo BaziX', prox: 'DriveGo ProX', franchise: 'DriveGo-Franchise' } as Record<string, string>;
const SITE = () => (process.env.SITE_URL || 'https://app.drivegox.com').replace(/\/$/, '');

// The e-mail with the sign-in details (the owner approves its words: docs/NOTES.md).
export function signInMail(o: { lang: string; to: string; owner: string; name: string; pkg: string; code: string; user: string; password: string; end: string }) {
  const [y, m, d] = o.end.split('-').map(Number);
  if (o.lang === 'en') return { to: o.to, subject: `${o.name} is ready to try DriveGo X`,
    text: [`Dear ${o.owner},`, '', `The DriveGo team has opened your trial shop. It can be used until ${d} ${EN_MONTHS[m - 1]} ${y}.`, '',
      `Log in at ${SITE()}/login on the ${CARD[o.pkg]} card:`, `Shop code: ${o.code}`, `User name: ${o.user}`, `Temporary password: ${o.password}`, '',
      'After logging in, change the password to one of your own (menu 10).', 'The user manual can be downloaded from the log-in page.',
      'Questions: call 082-108-7000 or LINE https://lin.ee/tV7nV8x', '', 'DriveGo X team'].join('\n') };
  return { to: o.to, subject: `${o.name} พร้อมทดลองใช้ DriveGo X แล้ว`,
    text: [`เรียน คุณ${o.owner}`, '', `ทีมงาน DriveGo เปิดร้านทดลองใช้ให้แล้ว ใช้ได้ถึง ${d} ${MONTHS[m - 1]} ${y + 543}`, '',
      `เข้าสู่ระบบที่ ${SITE()}/login ที่การ์ด ${CARD[o.pkg]}`, `รหัสร้าน: ${o.code}`, `ชื่อผู้ใช้: ${o.user}`, `รหัสผ่านชั่วคราว: ${o.password}`, '',
      'เข้าครั้งแรกแล้วเปลี่ยนรหัสผ่านเป็นของคุณเอง (เมนู 10 ตั้งค่าองค์กร)', 'คู่มือการใช้งานดาวน์โหลดได้ที่หน้าเข้าสู่ระบบ',
      'สอบถาม โทร 082-108-7000 หรือ LINE https://lin.ee/tV7nV8x', '', 'ทีมงาน DriveGo X'].join('\n') };
}

// Opens the shop from the request with what staff checked on the page (the same fields as "เปิดร้านใหม่"), then sends
// the sign-in e-mail. The shop is open even when the e-mail fails: the answer carries the password for staff.
export async function approveSignup(db: pg.Pool, id: number, b: Body, actor: string) {
  const s = await pending(db, id);
  const opened = await openShop(db, { ...b, contact: b.contact ?? `${s.owner} ${s.tel} ${s.email}` }, actor);
  await db.query(`update signups set status = 'approved', decided_at = now(), decided_by = $2, shop_code = $3 where id = $1`, [id, actor, opened.code]);
  const email = String(b.email ?? s.email).trim().toLowerCase();
  let mailed = false, mailError = '';
  if (!mailOn()) mailError = 'not-configured';
  else {
    try {
      await sendMail(signInMail({ lang: s.lang, to: email, owner: String(b.owner ?? s.owner), name: String(b.name ?? s.name), pkg: String(b.pkg ?? s.pkg),
        code: opened.code!, user: opened.user, password: opened.password, end: opened.end }));
      mailed = true;
    } catch (e) {
      mailError = (e as Error).message.slice(0, 300);
    }
  }
  await db.query(`update signups set mailed_at = case when $2 then now() end, mail_error = $3 where id = $1`, [id, mailed, mailError]);
  return { ...opened, email, mailed, mailError };
}

export async function rejectSignup(db: pg.Pool, id: number, note: string, actor: string) {
  await pending(db, id);
  await db.query(`update signups set status = 'rejected', decided_at = now(), decided_by = $2, decision_note = $3 where id = $1 and status = 'new'`,
    [id, actor, note.slice(0, 500)]);
  return { ok: true };
}
