// The user manual of DriveGo ProX (tools/manual/build.mjs --package prox; the owner's request of 2026-11-19).
// ProX is everything in BaziX (the same screens and menus, content.mjs) plus menus P1 and P2 and the ProX central stock
// in menu 07. Those three run on the DriveGo network (DriveGo BOOK, central data), which is not open yet: the website
// tags them "เร็ว ๆ นี้" and so does this manual. Pictures 21-*: tools/manual/21-prox.spec.ts (the prox-trial shop).
import { chapters as biz } from './content.mjs';

export const title = 'คู่มือการใช้งาน DriveGo ProX';
export const subtitle = 'ระบบบริหารงานอู่ซ่อมรถ · สำหรับเจ้าของร้านและพนักงาน';
export const edition = 'ฉบับอู่นำร่อง · พฤศจิกายน 2569 · https://app.drivegox.com';
export const footer = 'DriveGo ProX';

// Chapter 1 of BaziX, with the ProX card on the sign-in page and the branches of ProX.
const start = biz[0];
const blocks = [];
for (const b of start.blocks) {
  if (b.p && b.p.startsWith('DriveGoBiz ใช้งานผ่านเว็บ')) {
    blocks.push({ p: b.p.replace('DriveGoBiz ใช้งานผ่านเว็บ', 'DriveGo ProX ใช้งานผ่านเว็บ') });
    blocks.push({ note: 'DriveGo ProX มีทุกอย่างของ DriveGo BaziX หน้าจอและเมนู 00–11 เหมือนกันทุกขั้น ภาพหน้าจอในคู่มือนี้ส่วนใหญ่จึงถ่ายจากร้าน BaziX (หัวโปรแกรมแสดงชื่อ DriveGoBiz) ส่วนที่ ProX มีเพิ่ม (เมนู P1 P2 และคลังกลาง ProX) อยู่ในบทที่ 12' });
  } else if (b.steps && b.steps.some(s => s.includes('เข้าสู่ระบบ BaziX'))) {
    blocks.push({ steps: b.steps.map(s => s.includes('เข้าสู่ระบบ BaziX')
      ? 'หน้าเข้าสู่ระบบมีการ์ดของแต่ละแพ็กเกจ ร้าน ProX กด `เข้าสู่ระบบ ProX` ที่การ์ด DriveGo ProX (ในโปรแกรมแสดงชื่อ DriveGoProX) ถ้ากดผิดการ์ด ระบบจะบอกการ์ดที่ถูก'
      : s) });
  } else if (b.img === '01-plans') {
    continue;
  } else if (b.img === '01-signin') {
    blocks.push({ img: '21-signin', cap: 'การ์ด DriveGo ProX: กรอกรหัสร้าน ชื่อผู้ใช้ และรหัสผ่าน', small: true });
  } else if (b.steps && b.steps.some(s => s.includes('DriveGo BaziX ใช้ได้ 1 สาขา'))) {
    blocks.push({ ...b, steps: b.steps.map(s => s.includes('DriveGo BaziX ใช้ได้ 1 สาขา') ? '**สาขา** ที่กำลังทำงาน ร้าน ProX มีได้หลายสาขา เลือกสาขาที่ช่องนี้' : s) });
  } else {
    blocks.push(b);
  }
}

const prox = {
  title: 'ความสามารถของ ProX: P1 Ecosystem, P2 ห้องข้อมูลเทคนิค และคลังกลาง ProX',
  blocks: [
    { p: 'ส่วนในบทนี้ทำงานร่วมกับเครือข่าย DriveGo (แอปลูกค้า DriveGo BOOK และข้อมูลจากส่วนกลาง) ซึ่ง**ยังไม่เปิดใช้ (เร็ว ๆ นี้)** ตอนนี้ร้านทดลองเห็นข้อมูลตัวอย่างและกดปุ่มจำลองดูการทำงานได้ ทีมงานจะแจ้งเมื่อเปิดใช้จริง' },
    { h: 'P1 DriveGo ProX · Ecosystem' },
    { steps: [
      'กดเมนู `P1 DriveGo ProX · Ecosystem`',
      'เมนูย่อยคือช่องทางที่งานจากลูกค้าเข้ามา: `คิวจองจาก BOOK` `อาการเสีย → ใบเสนอราคา` `งานฉุกเฉิน SOS` `DriveGo Coins` และ `หน้าร้านบนแอป BOOK`',
    ] },
    { img: '21-p1', cap: 'เมนู P1: คิวจองจากแอป DriveGo BOOK' },
    { p: 'เมื่อลูกค้าจองคิวหรือแจ้งอาการจากแอป กด `รับเข้าระบบ` ระบบสร้างหรือผูกข้อมูลลูกค้า (เมนู 02) และเปิดใบเสนอราคาร่าง (เมนู 03) ให้เอง จากนั้นทำงานต่อตามบทที่ 4 เหมือนงานซ่อมทั่วไป' },
    { h: 'P2 ห้องข้อมูลเทคนิค' },
    { steps: [
      '`ProX Data · สเปคจากส่วนกลาง` สเปคที่ช่างต้องใช้ (น้ำยาแอร์ น้ำมันคอมเพรสเซอร์ แบตเตอรี่ กรองแอร์) ที่ส่วนกลาง DriveGo อัปเดตให้',
      '`Publish Data · แบ่งปันเครือข่าย` ความรู้ที่อู่ในเครือข่ายแบ่งปันกัน',
      '`Private Data · เฉพาะภายในอู่` ความรู้ของอู่เอง เห็นเฉพาะคนในร้าน',
    ] },
    { img: '21-p2', cap: 'เมนู P2: สเปคเทคนิคจากส่วนกลาง' },
    { h: 'คลังกลาง ProX (เมนู 07)' },
    { steps: [
      'กดเมนู `07 สต๊อกอะไหล่` แล้วกด `★ คลังกลาง ProX`',
      'สินค้าที่มีในคลังกลาง กด `+ เพิ่มเข้าทะเบียนอะไหล่` สินค้าเข้าทะเบียนอะไหล่ของร้าน เริ่มคงเหลือ 0 แล้วบันทึกรับของจริงที่เมนู 06 ตามบทที่ 6',
      'ไม่มีสินค้าที่ต้องการ กด `+ แจ้งเพิ่มรายการสินค้าใหม่` ส่วนกลางตรวจและอนุมัติแล้วแจ้งกลับมาที่ร้าน',
    ] },
    { img: '21-central', cap: 'คลังกลาง ProX' },
  ],
};

// Chapters 1–11 as in BaziX (chapter 1 for ProX), then ProX's own, before "เมื่อมีปัญหา".
export const chapters = [{ ...start, blocks }, ...biz.slice(1, -1), prox, biz[biz.length - 1]];
