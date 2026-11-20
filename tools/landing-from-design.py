# Builds server/site/landing.js from the team's landing page design (a claude.ai artifact, saved as HTML): Thai and
# English only, the agreed text changes, "coming soon" tags (a trailing § on a text), styles through CSSOM (the page's
# CSP has no inline styles), and the demo summary sent on LINE. docs/NOTES.md "หน้าแรกและหน้าเข้าระบบกลาง".
#
#   python3 -I tools/landing-from-design.py <design.html> server/site/landing.js
#
# The design file is someone else's: keep it in its own folder, run with -I, and read the design's code before using it
# (no network calls, no eval). Only landing.js is built here: the design's HTML and CSS changes are merged into
# server/site/index.html and landing.css by hand (no inline styles, no links to pages that do not exist).
# Each text below must still be found in the design (the replacements exactly once): a changed one stops the build.
import sys, re
src, out = sys.argv[1], sys.argv[2]
html = open(src, encoding='utf-8').read()
scripts = [m for m in re.findall(r'<script[^>]*>(.*?)</script>', html, re.S) if '\nconst I={' in m]
assert len(scripts) == 1, 'the design script (const I={...}) not found once'
s = scripts[0]
th0 = s.index('\nth:{'); en0 = s.index('\nen:{'); zh0 = s.index('\nzh:{'); code0 = s.index('/* ============ helpers')
th = s[th0:en0]; en = s[en0:zh0]; code = s[code0:]
def rep(text, a, b, count=1):
    n = text.count(a)
    assert n == count, (a, n)
    return text.replace(a, b)
SOON_TH = [
  "fl1a:'ออก Coin ให้ลูกค้าแล้ว'", "fl2b:'กรองแอร์ (EV) เหลือ 8 ชิ้น เปิด PO-001 ให้แล้ว'",
  "'กำไรขาดทุนรายคัน รายวัน และรายสาขา'", "'เชื่อมลูกค้า ซัพพลายเออร์ ประกันภัย และสาขา'",
  "d:'ฐานลูกค้าผูกกับทะเบียนรถ ระบบคำนวณวันเช็กระยะ ต่อภาษี และต่อประกันจากเลขไมล์ที่ใช้จริง แล้วแจ้งเตือนให้อัตโนมัติ'",
  "'สมาชิกและ DriveGo Coins สะสมจากใบเสร็จที่ชำระแล้ว'", "'แจ้งเตือนเช็กระยะล่วงหน้าตามระยะทางเฉลี่ยต่อวัน'", "'โปรโมชันและคูปองดึงลูกค้าเก่ากลับมาใช้บริการ'",
  "d:'กระดานคิวซ่อมอัปเดตทันทีเมื่อสถานะเปลี่ยน เห็นว่ารถคันไหนอยู่ขั้นตอนใด และช่างคนไหนรับผิดชอบ'",
  "'คิวจากแอปจอง หน้าร้าน และใบเสนอราคา รวมในกระดานเดียว'", "'มอบหมายงานให้ช่าง เห็นภาระงานรายคน'",
  "d:'ทะเบียนอะไหล่พร้อมระดับ Min และ Max ตัดสต๊อกเมื่ออนุมัติซ่อม และเปิดใบขอซื้อให้เองเมื่อถึงจุดสั่งซื้อ'",
  "'รหัสสินค้าและบาร์โค้ดสำหรับรับเข้า เบิก และตรวจนับ'", "'กำไรขาดทุนรายคัน รายวัน และงบการเงินรายปี'",
  "d:'ประวัติซ่อมรายคันเก็บต่อเนื่องทุกครั้งที่เข้าบริการ พร้อมระยะรับประกันงานซ่อมและแบบประเมินหลังรับรถ'", "'คะแนนและรีวิวจากลูกค้าหลังปิดงาน'",
  "d:'เชื่อมอู่กับซัพพลายเออร์อะไหล่ บริษัทประกัน และแอปผู้ใช้รถ ทำงานผ่านเบราว์เซอร์ได้ทุกอุปกรณ์'",
  "'สั่งอะไหล่จากคลังกลางในราคาตรงจากซัพพลาย'", "'รับงานจอง ขอราคา และงานฉุกเฉินจากแอปผู้ใช้รถ'",
  "d:'กระดานคิวซ่อม'", "{t:'มอบหมายช่าง',d:'เลือกช่างตามความถนัด ชื่อช่างขึ้นบนการ์ดงานและนับเป็นปริมาณงานสะสม'}",
  "'ระบบเตือนรอบเซอร์วิส ทำให้ลูกค้ากลับมาเป็นรอบ'",
  "'แจ้งเตือนรอบเซอร์วิสถึงลูกค้า'", "'ผลงานช่างรายคนและการคิดค่าแรง'", "'เชื่อมต่อระบบภายนอกผ่าน API'",
  "'ผลงานช่างและการคิดค่าแรง'", "'เชื่อมต่อระบบภายนอก (API)'",
]
SOON_EN = [
  "fl1a:'Coins issued to customer'", "fl2b:'Cabin filter (EV) down to 8. PO-001 raised.'",
  "'Profit and loss per car, per day and per branch'", "'Links customers, suppliers, insurers and branches'",
  "d:'Customers are tied to their licence plates. The system works out service, road-tax and insurance dates from real mileage and sends the reminders for you.'",
  "'Membership and DriveGo Coins earned from paid receipts'", "'Service reminders timed by average daily distance'", "'Promotions and coupons that bring past customers back'",
  "d:'The repair board updates the moment a status changes. See which car is at which stage and which technician owns it.'",
  "'Bookings, walk-ins and quotations on one board'", "'Assign technicians and see each person’s workload'",
  "d:'A parts register with Min and Max levels. Stock is deducted when a repair is approved, and a purchase request opens itself at the reorder point.'",
  "'Item codes and barcodes for receiving, issuing and counting'", "'Profit and loss per car, per day, and annual statements'",
  "d:'Every visit adds to the car’s service history, together with the repair warranty period and a satisfaction survey after pickup.'", "'Ratings and reviews from customers after each job'",
  "d:'Connects the garage with parts suppliers, insurers and the driver app. It runs in the browser on any device.'",
  "'Order from the central catalogue at supplier-direct prices'", "'Receive bookings, quote requests and roadside jobs from the driver app'",
  "d:'Repair queue board'", "{t:'Assigning technicians',d:'Pick a technician by skill. The name appears on the job card and counts towards workload.'}",
  "'Service reminders bring customers back on schedule'",
  "'Service reminders sent to customers'", "'Technician performance and labour pay'", "'Connect external systems through an API'",
  "'Technician performance and labour pay'", "'External system connection (API)'",
]
def mark(text, items):
    for a in dict.fromkeys(items):
        n = text.count(a)
        assert n >= 1, a
        if a.endswith("'}"):    # {t:'..',d:'..'}: the tag goes after the title
            t_end = a.index("',d:'")
            b = a[:t_end] + "§" + a[t_end:]
        else:
            b = a[:-1] + "§'"
        text = text.replace(a, b)
    return text
th = mark(th, SOON_TH); en = mark(en, SOON_EN)
# Text changes agreed with the owner: Thai and English only (2026-11-17). The demo request as the design has it, plus
# a button that writes the e-mail and one that sends it on LINE (2026-11-18; the LINE text approved on 2026-11-17).
# The demo request became a sign-up for a trial (owner 2026-11-20 "แทนฟอร์มนัด Demo และแก้ wording เป็น ลงทะเบียนเพื่อทดลองใช้
# drivegoX"): the form is sent to the server (/api/signup), staff approve it on the staff page and the sign-in details go
# by e-mail (server/lib/signup.ts). Its texts replace the design's; the consent is the server's CONSENT word for word.
def line(text, key, new):
    out, n = re.subn(r"\n " + key + r":\{[^\n]*\},\n", lambda m: "\n " + new + ",\n", text)
    assert n == 1, key
    return out
th = line(th, 'cta', "cta:{eyebrow:'เริ่มต้นใช้งาน',h:'ลงทะเบียนเพื่อทดลองใช้ DriveGo X',p:'กรอกข้อมูลอู่ของคุณ ทีมงานจะตรวจแล้วเปิดร้านทดลองใช้ฟรี 60 วัน และส่งชื่อผู้ใช้กับรหัสผ่านไปทางอีเมล',l1:'ใช้ระบบจริงตั้งแต่รับรถจนถึงออกใบกำกับภาษี',l2:'ถามตอบเรื่องโมดูลที่เหมาะกับอู่ของคุณ',l3:'โทร 082-108-7000 หรืออีเมล sales@drivegox.com'}")
en = line(en, 'cta', "cta:{eyebrow:'Get started',h:'Register to try DriveGo X',p:'Tell us about your garage. The team checks it, opens a free 60-day trial shop and sends your user name and password by e-mail.',l1:'Use the real system from check-in to tax invoice',l2:'Ask which modules suit your garage',l3:'Call 082-108-7000 or e-mail sales@drivegox.com'}")
th = line(th, 'form', "form:{shop:'ชื่ออู่หรือศูนย์บริการ',owner:'ชื่อ-นามสกุลเจ้าของ',tel:'เบอร์โทร',email:'อีเมล (สำหรับรับชื่อผู้ใช้และรหัสผ่าน)',pkg:'แพ็กเกจ',pkgs:[['biz','DriveGo BaziX'],['prox','DriveGo ProX'],['franchise','DriveGo-Franchise (หลายสาขา)']],tax:'เลขประจำตัวผู้เสียภาษี (ไม่บังคับ)',zip:'รหัสไปรษณีย์ (ไม่บังคับ)',addr:'ที่อยู่ (ไม่บังคับ)',msg:'สิ่งที่อยากให้ระบบช่วย (ไม่บังคับ)',consent:'ยินยอมให้บริษัท ไดร์ฟบิซ เมคคาไลซ์ โซลูชั่น จำกัด เก็บและใช้ข้อมูลนี้เพื่อเปิดร้านทดลองใช้และติดต่อกลับ ตามนโยบายความเป็นส่วนตัว',send:'ลงทะเบียน',err:'กรอกชื่ออู่ ชื่อเจ้าของ เบอร์โทร และอีเมลให้ครบ แล้วติ๊กยินยอมก่อนส่ง',many:'ส่งหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่',fail:'ส่งไม่สำเร็จ กรุณาลองใหม่ หรือติดต่อทีมงานทาง LINE',okh:'ได้รับคำขอลงทะเบียนแล้ว',okp:'ทีมงานจะตรวจข้อมูลแล้วส่งชื่อผู้ใช้และรหัสผ่านไปที่อีเมลของคุณ มีคำถามติดต่อทีมงานทาง LINE Official'}")
en = line(en, 'form', "form:{shop:'Garage or service centre',owner:'Owner’s full name',tel:'Phone',email:'E-mail (for your user name and password)',pkg:'Package',pkgs:[['biz','DriveGo BaziX'],['prox','DriveGo ProX'],['franchise','DriveGo-Franchise (several branches)']],tax:'Tax ID (optional)',zip:'Postcode (optional)',addr:'Address (optional)',msg:'What should the system help with? (optional)',consent:'I agree that Drivebiz Mecalyze Solution Co., Ltd. keeps and uses these details to open my trial shop and contact me, under the privacy policy',send:'Register',err:'Fill in the garage, owner, phone and e-mail, and tick the consent first',many:'Too many tries. Please wait a moment and try again',fail:'Could not send. Please try again, or contact the team on LINE',okh:'We have your registration',okp:'The team will check it and send your user name and password to your e-mail. Questions: contact the team on LINE Official.'}")
th = rep(th, "cta1:'นัดดู Demo ระบบ'", "cta1:'ลงทะเบียนทดลองใช้'")
en = rep(en, "cta1:'Book a demo'", "cta1:'Register for a trial'")
en = rep(en, "cta:'Request a demo'}", "cta:'Free trial'}")
th = rep(th, "contact:'ติดต่อ',cta:'ทดลองใช้งานฟรี'}", "contact:'ติดต่อ',cta:'ทดลองใช้งานฟรี',sm:'ทดลองใช้'}")
en = rep(en, "cta:'Free trial'}", "cta:'Free trial',sm:'Trial'}")
th = rep(th, "form:'ข้อมูลที่กรอกใช้เพื่อติดต่อกลับเรื่องการนัด Demo เท่านั้น ดูรายละเอียดที่'", "form:'ข้อมูลที่กรอกใช้เพื่อเปิดร้านทดลองใช้และติดต่อกลับเท่านั้น ดูรายละเอียดที่'")
en = rep(en, "form:'The details you enter are used only to contact you about a demo. See our'", "form:'The details you enter are used only to open your trial shop and contact you. See our'")
th = rep(th, "f2:'ภาษา ไทย อังกฤษ จีน',", "")
en = rep(en, "f2:'languages: Thai, English, Chinese',", "")
th = rep(th, "\nth:{\n", "\nth:{\n soon:'เร็ว ๆ นี้',\n")
en = rep(en, "\nen:{\n", "\nen:{\n soon:'Coming soon',\n")
head = """// DriveGo's landing page (/, server/site/index.html): the team's design of 2026-11-17, updated 2026-11-18 (dark, amber;
// built by tools/landing-from-design.py), the owner's choices of 2026-11-17: Thai and English (no Chinese), what the
// system does not do yet tagged "เร็ว ๆ นี้" (a text ending in §); of 2026-11-18: the design's own pages (Test Drive,
// articles, privacy policy at /testdrive, /articles, /privacy); of 2026-11-20: the demo request became a sign-up for a
// trial, sent to the server (/api/signup) for staff to approve (server/lib/signup.ts).
// The page's Content-Security-Policy allows no inline styles: the mock screens' sizes go in data-css and are set
// through CSSOM (applyCss). Everything here is the page's own text; nothing typed by a visitor is put in as HTML.
(() => {
/* ============ Dictionary: TH / EN ============ */
const I={"""
dict = head + th + en.rstrip().rstrip(',') + "\n};\n"
# Code: no Chinese, styles through CSSOM, tags, the LINE button.
code = code.replace(' style="', ' data-css="')
code = rep(code, "const t=k=>{const v=dig(I[lang],k);return v==null?dig(I.th,k):v};",
  "const t=k=>{const v=dig(I[lang],k);return v==null?dig(I.th,k):v};\n"
  "// A text ending in § is something the system does not do yet: its tag.\n"
  "const sn=x=>typeof x==='string'&&x.endsWith('§')?x.slice(0,-1)+` <span class=\"coming\">${t('soon')}</span>`:x;\n"
  "const put=(e,x)=>{const s=typeof x==='string'&&x.endsWith('§');e.textContent=s?x.slice(0,-1):x;if(s){const b=document.createElement('span');b.className='coming';b.textContent=t('soon');e.append(' ',b)}};\n"
  "function applyCss(r=document){$$('[data-css]',r).forEach(e=>{for(const d of e.dataset.css.split(';')){const i=d.indexOf(':');if(i>0)e.style.setProperty(d.slice(0,i).trim(),d.slice(i+1).trim())}})}")
code = rep(code, "<b>${x.t}</b><small>${x.s}</small>", "<b>${sn(x.t)}</b><small>${x.s}</small>")
code = rep(code, "<p>${x.d}</p><ul>${x.b.map(b=>`<li>${ic('check')}<span>${b}</span></li>`).join('')}</ul>", "<p>${sn(x.d)}</p><ul>${x.b.map(b=>`<li>${ic('check')}<span>${sn(b)}</span></li>`).join('')}</ul>")
code = rep(code, "${r.t}<small>${r.d}</small>", "${r.t}<small>${sn(r.d)}</small>")
code = rep(code, "<span><b>${h.t}</b><span class=\"d\">${h.d}</span></span>", "<span><b>${sn(h.t)}</b><span class=\"d\">${sn(h.d)}</span></span>")
code = rep(code, "$$('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));", "$$('[data-i18n]').forEach(e=>put(e,t(e.dataset.i18n)));")
code = rep(code, "<p><b>${p[0]}</b><span>${p[1]}</span></p>", "<p><b>${sn(p[0])}</b><span>${sn(p[1])}</span></p>")
code = rep(code, "<small>${w.fixl}</small>${w.a[i]}</span>", "<small>${w.fixl}</small>${sn(w.a[i])}</span>")
code = rep(code, "${w.a.map(x=>`<li>${ic('check')}<span>${x}</span></li>`).join('')}", "${w.a.map(x=>`<li>${ic('check')}<span>${sn(x)}</span></li>`).join('')}")
code = rep(code, "${k.l.map(x=>`<li>${ic('check')}<span>${x}</span></li>`).join('')}", "${k.l.map(x=>`<li>${ic('check')}<span>${sn(x)}</span></li>`).join('')}")
code = rep(code, "<tr><td>${r}</td>", "<tr><td>${sn(r)}</td>")
code = rep(code, """  const f=t('form'), br=$('#fBr'), mo=$('#fMod'), bi=br.selectedIndex, mi=mo.selectedIndex;
  br.innerHTML=f.brs.map(x=>`<option>${x}</option>`).join('');
  mo.innerHTML=`<option>${f.all}</option>`+t('mods').map(x=>`<option>${x.t}</option>`).join('');
  if(bi>0)br.selectedIndex=bi; if(mi>0)mo.selectedIndex=mi;""", """  const f=t('form'), pk=$('#fPkg'), pi=pk.selectedIndex;
  pk.innerHTML=f.pkgs.map(([v,x])=>`<option value="${v}">${x}</option>`).join('');
  if(pi>0)pk.selectedIndex=pi;""")
code = rep(code, "  if($('#ctaB').classList.contains('sent'))buildSum();\n", "")
code = rep(code, "lang=l; document.documentElement.lang=l==='zh'?'zh-Hans':l;", "lang=l; document.documentElement.lang=l;")
code = rep(code, "renderStatic(); renderEco(); renderShow(); renderDevices();", "renderStatic(); renderEco(); renderShow(); renderDevices(); applyCss();")
code = rep(code, "$('#ecoM').innerHTML=MM[mod]();", "$('#ecoM').innerHTML=MM[mod](); applyCss($('#ecoP'));")
code = rep(code, "$('#showS').innerHTML=ROLE[role]();", "$('#showS').innerHTML=ROLE[role](); applyCss($('#showS'));")
FORM_START = "/* form: composes a message the visitor can copy. Wire the submit handler to your CRM, LINE or e-mail endpoint in production. */"
FORM_END = "  setTimeout(()=>b.textContent=t('form.copy'),1800)});\n"
a, b = code.index(FORM_START), code.index(FORM_END) + len(FORM_END)
assert code.count(FORM_START) == 1 and code.count(FORM_END) == 1
code = code[:a] + """/* form: a sign-up for a trial (DriveGo's, owner 2026-11-20): sent to the server (/api/signup), where staff approve it on the
   staff page and the sign-in details go to the e-mail given. #fTrap is a field people do not see (robots fill it in). */
$('#demoForm').addEventListener('submit',async e=>{e.preventDefault();const v=id=>$('#'+id).value.trim(),err=$('#fErr'),btn=e.currentTarget.querySelector('button[type=submit]');
  if(!v('fShop')||!v('fOwner')||v('fTel').replace(/\\D/g,'').length<9||!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(v('fEmail'))||!$('#fOk').checked){put(err,t('form.err'));return}
  put(err,'');btn.disabled=true;
  try{const r=await fetch('/api/signup',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({pkg:$('#fPkg').value,name:v('fShop'),owner:v('fOwner'),tel:v('fTel'),
      email:v('fEmail'),taxId:v('fTax'),addr:v('fAddr'),zip:v('fZip'),note:v('fMsg'),consent:true,lang,trap:$('#fTrap').value})});
    if(r.ok){$('#ctaB').classList.add('sent');return}
    put(err,t(r.status===429?'form.many':'form.fail'))}catch(x){put(err,t('form.fail'))}finally{btn.disabled=false}});
""" + code[b:]
# Labels read by screen readers (data-i18n-aria), and the menu of phones and tablets (index.html #menuB, #menuP).
HTML_LINE = "  $$('[data-i18n-html]').forEach(e=>e.innerHTML=t(e.dataset.i18nHtml));\n"
code = rep(code, HTML_LINE, HTML_LINE + "  $$('[data-i18n-aria]').forEach(e=>e.setAttribute('aria-label',t(e.dataset.i18nAria)));\n")
MENU = """
/* ============ menu of phones and tablets (DriveGo's addition, owner 2026-11-18) ============ */
/* The section links, sign-in and the demo button behind one button where the top bar has no room for them. */
(function(){
  const nav=$('#nav'),b=$('#menuB'),p=$('#menuP');
  const open=o=>{p.hidden=!o;b.setAttribute('aria-expanded',String(o));nav.classList.toggle('open',o)};
  b.addEventListener('click',()=>open(p.hidden));
  p.addEventListener('click',e=>{if(e.target.closest('a'))open(false)});
  document.addEventListener('click',e=>{if(!p.hidden&&!nav.contains(e.target))open(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!p.hidden){open(false);b.focus()}});
  matchMedia('(min-width:68rem)').addEventListener('change',e=>{if(e.matches)open(false)});
  // The menu's own language switch (the smallest phones; the top bar's one is wired above).
  $('#menuP .lang').addEventListener('click',e=>{const x=e.target.closest('button');if(x)setLang(x.dataset.lang)});
})();

"""
code = code.rstrip() + "\n" + MENU + "})();\n"
open(out, 'w', encoding='utf-8').write(dict + code)
print('ok', len(dict + code))
