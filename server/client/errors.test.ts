// Errors the pages did not catch go to the server (errors.ts): once or twice per message, never more than 20 a page,
// not those of other sites' scripts, and unhandled rejections too.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reportErrors } from './errors.ts';

function page() {
  const on: Record<string, ((e: Event) => void)[]> = {};
  const posted: { message: string; detail: string; path: string }[] = [];
  const win = { addEventListener: (t: string, fn: (e: Event) => void) => { (on[t] ??= []).push(fn); },
    location: { pathname: '/demo-biz/', origin: 'https://app.example', href: 'https://app.example/demo-biz/' } };
  reportErrors(win, async body => { posted.push(JSON.parse(body)); });
  const fire = (t: string, e: object) => on[t].forEach(fn => fn(e as Event));
  return { posted, fire };
}

test('ข้อผิดพลาดที่หน้าจอไม่ได้จับ ส่งไปที่ server พร้อมหน้าและ stack', () => {
  const p = page();
  p.fire('error', { message: 'TypeError: x is undefined', error: { stack: 'TypeError: x is undefined\n    at f (js/03.js:10:5)' }, filename: 'https://app.example/demo-biz/js/03.js' });
  p.fire('unhandledrejection', { reason: { message: 'boom', stack: 'Error: boom\n    at g' } });
  p.fire('unhandledrejection', { reason: 'plain text' });
  assert.deepEqual(p.posted, [
    { message: 'TypeError: x is undefined', detail: 'TypeError: x is undefined\n    at f (js/03.js:10:5)', path: '/demo-biz/' },
    { message: 'unhandled rejection: boom', detail: 'Error: boom\n    at g', path: '/demo-biz/' },
    { message: 'unhandled rejection: plain text', detail: '', path: '/demo-biz/' },
  ]);
});

test('สคริปต์ของเว็บอื่น (ส่วนเสริมของเบราว์เซอร์) ไม่ส่ง สคริปต์ในหน้าเองส่ง', () => {
  const p = page();
  p.fire('error', { message: 'Script error.', filename: '', error: null });
  p.fire('error', { message: 'oops', filename: 'chrome-extension://abc/content.js', error: { stack: 'Error: oops' } });
  assert.equal(p.posted.length, 0);
  // An inline script of the page (no file of its own) is the app's.
  p.fire('error', { message: 'Uncaught Error: inline', filename: '', lineno: 1, error: { stack: 'Error: inline\n    at <anonymous>:1:7' } });
  assert.deepEqual(p.posted.map(x => x.message), ['Uncaught Error: inline']);
});

test('ข้อความเดียวกันส่งไม่เกิน 2 ครั้ง และทั้งหน้าไม่เกิน 20 ครั้ง', () => {
  const p = page();
  for (let i = 0; i < 5; i++) p.fire('unhandledrejection', { reason: 'same' });
  assert.equal(p.posted.length, 2);
  for (let i = 0; i < 50; i++) p.fire('unhandledrejection', { reason: `loop ${i}` });
  assert.equal(p.posted.length, 20);
});
