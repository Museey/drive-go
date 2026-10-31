
/* ══ DGB — ชั้นคลาวด์จำลอง drivegobiz.com ══ */
let DGB={shop:null,session:{who:''}};       /* who: 'owner' | <empId> | '' */
const DGBKEY='dgb.v22', DGB_TRIAL_DAYS=15, DGB_PRICE='12,000 บาท/ปี';
// โหมดพัฒนา: ไม่ล็อกเมื่อหมดอายุ และไม่แก้ข้อมูลสิทธิหรือประวัติชำระเงิน
// ตั้งเป็น false เมื่อต้องการทดสอบการหมดอายุแบบเดิม
const DGB_DEV_MODE=true;
async function dgbSave(){ try{ await STORE.set(DGBKEY,JSON.stringify(DGB)); }catch(e){} }
async function dgbLoad(){ try{ const v=await STORE.get(DGBKEY); if(v) DGB=Object.assign(DGB,JSON.parse(v)); }catch(e){} }
const telNorm=t=>String(t||'').replace(/\D/g,'');
const shopCodeNorm=c=>String(c||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
function dgbDaysLeft(){ if(!DGB.shop) return 0;
  const end=new Date(DGB.shop.trialStart+'T00:00:00'); end.setDate(end.getDate()+DGB_TRIAL_DAYS);
  return Math.ceil((end-new Date())/86400000); }
function dgbLicActive(){ return !!(DGB.shop&&DGB.shop.licensed&&DGB.shop.licEnd>=iso()); }
function dgbLocked(){ return !DGB_DEV_MODE&&!!DGB.shop&&!dgbLicActive()&&dgbDaysLeft()<=0; }

/* ── สลับหน้าจอชั้นคลาวด์ ── */
function dgbShow(v){
  const g=$('#dgbGate'); if(!g) return;
  if(!v){ g.style.display='none'; return; }
  g.style.display='block';
  ['dgbSignup','dgbLogin','dgbLock'].forEach(k=>{ const el=$('#'+k); if(el) el.style.display=(k==='dgb'+v[0].toUpperCase()+v.slice(1))?'':'none'; });
  if(v==='login'){ dgbRenderDemo(); const bk=$('#dgbLoBack'); if(bk) bk.style.display=DGB.shop?'none':''; }
  if(v==='signup'){ const bk=$('#dgbSuBack'); if(bk) bk.style.display=DGB.shop?'none':''; }
  if(v==='lock'){
    const s=DGB.shop;
    $('#dgbLockInfo').textContent='ร้าน: '+s.name+' · รหัสร้าน '+s.code+' · ทดลองใช้ตั้งแต่ '+thDate(s.trialStart)+' (ครบ '+DGB_TRIAL_DAYS+' วันแล้ว)';
    const owner=DGB.session.who==='owner';
    $('#dgbLockOwner').style.display=owner?'':'none';
    $('#dgbLockEmp').style.display=owner?'none':'';
  }
}
function dgbRenderDemo(){
  const el=$('#dgbLoDemo'); if(!el) return;
  if(!DGB.shop){ el.innerHTML=''; return; }
  const s=DGB.shop;
  const emps=(DB.emp||[]).filter(e=>empActive(e)&&e.dgbPass&&e.dgbActive!==false).slice(0,2);
  el.innerHTML='<b>ข้อมูลทดสอบ (Demo)</b><br>👤 เจ้าของ: <span class="mono">'+esc(s.ownerUser||s.email)+' / '+esc(s.pass)+'</span> (หรือใช้อีเมล '+esc(s.email)+') · รหัสร้าน <span class="mono"><b>'+esc(s.code)+'</b></span>'
    +(emps.length?'<br>'+emps.map(e=>'🟢 '+esc(e.name)+': เบอร์ <span class="mono">'+esc(e.tel||'-')+'</span> / รหัส <span class="mono">'+esc(e.dgbPass)+'</span>').join('<br>'):'<br><span style="font-size:11px">พนักงานยังไม่มีบัญชี — เจ้าของออกให้ในเมนู 10</span>');
}

/* ── ตัวตรวจข้อมูลจริง ── */
/* เลขบัตรประชาชนไทย 13 หลัก — ตรวจเลขตรวจสอบ (checksum) ตามสูตรกรมการปกครอง */
function thaiIdValid(id){ id=String(id||'').replace(/\D/g,'');
  if(!/^\d{13}$/.test(id)) return false;
  let sum=0; for(let i=0;i<12;i++) sum+=(+id[i])*(13-i);
  return ((11-(sum%11))%10)===(+id[12]); }
function taxIdValid(t){ return /^\d{13}$/.test(String(t||'').replace(/\D/g,'')); }
function zipValid(z){ return /^\d{5}$/.test(String(z||'').trim()); }
function telValid(t){ const d=String(t||'').replace(/\D/g,''); return d.length>=9&&d.length<=10; }

/* ── สมัครเปิดร้าน (ทดลองฟรี 15 วัน) — บังคับกรอกข้อมูลจริงครบถ้วน ── */
async function dgbSignup(){
  const err=$('#dgbSuErr'); const bad=m=>{ if(err){err.textContent=m;err.style.display='';} return false; };
  const V=id=>(($('#'+id)||{}).value||'').trim();
  const owner=V('dgbSuOwner'), idcard=V('dgbSuIdcard').replace(/\D/g,'');
  const shop=V('dgbSuShop'), biz=V('dgbSuBiz'), tax=V('dgbSuTax').replace(/\D/g,'');
  const addr=V('dgbSuAddr'), zip=V('dgbSuZip'), tel=V('dgbSuTel');
  const email=V('dgbSuEmail').toLowerCase();
  if(!owner||owner.split(/\s+/).length<2) return bad('กรุณากรอกชื่อและนามสกุลจริงของเจ้าของ (เว้นวรรคระหว่างชื่อ-นามสกุล)');
  if(!thaiIdValid(idcard)) return bad('เลขบัตรประชาชนไม่ถูกต้อง — ต้องเป็นเลข 13 หลักและผ่านการตรวจสอบเลขท้าย');
  if(!shop) return bad('กรุณากรอกชื่อร้าน / ชื่อบริษัท');
  if(!biz) return bad('กรุณาเลือกประเภทธุรกิจ');
  if(!taxIdValid(tax)) return bad('เลขประจำตัวผู้เสียภาษีต้องเป็นเลข 13 หลัก (บุคคลธรรมดาใช้เลขบัตรประชาชนได้)');
  if(!addr) return bad('กรุณากรอกที่อยู่สถานประกอบการ');
  if(!zipValid(zip)) return bad('รหัสไปรษณีย์ต้องเป็นเลข 5 หลัก');
  if(!telValid(tel)) return bad('เบอร์โทรไม่ถูกต้อง — กรอกเลข 9-10 หลัก');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('รูปแบบอีเมลไม่ถูกต้อง');
  if(err) err.style.display='none';
  /* ── ระบบออกรหัสให้อัตโนมัติ: รหัสร้าน · รหัสผู้ใช้เจ้าของ · รหัสผ่าน ── */
  const code='DG-'+String(Math.floor(1000+Math.random()*9000));
  const ownerUser=code.toLowerCase().replace('-','');            /* เช่น dg4821 */
  const ownerPass=String(Math.floor(100000+Math.random()*900000)); /* สุ่ม 6 หลัก */
  DGB.shop={code,name:shop,owner,idcard,bizType:biz,taxId:tax,addr,zip,tel,email,
    ownerUser,pass:ownerPass,
    created:iso(),trialStart:iso(),licensed:false,licEnd:'',payments:[]};
  DGB.session={who:'owner'}; await dgbSave();
  /* ข้อมูลจดทะเบียนไหลเข้าหน้าตั้งค่าองค์กร (เมนู 10) อัตโนมัติ — ไม่ต้องกรอกซ้ำ */
  try{ DB.shop.name=shop; DB.shop.person=owner; DB.shop.tax=tax; DB.shop.tel=tel;
    DB.shop.email=email; DB.shop.addr=addr+(zip?' '+zip:''); await save();
    if(typeof fillSetting==='function') try{fillSetting()}catch(e2){}
  }catch(e){}
  $('#dgbCodeShow').textContent=code;
  const cs=$('#dgbCredShow');
  if(cs) cs.innerHTML='🏪 <b>รหัสร้าน:</b> <span class="mono"><b>'+esc(code)+'</b></span> (พนักงานใช้เข้าระบบ)<br>'
    +'👤 <b>รหัสผู้ใช้เจ้าของ:</b> <span class="mono"><b>'+esc(ownerUser)+'</b></span> (หรือใช้อีเมลก็ได้)<br>'
    +'🔑 <b>รหัสผ่าน:</b> <span class="mono"><b>'+esc(ownerPass)+'</b></span>';
  $('#dgbCodeModal').style.display='flex';
  return true;
}
/* DriveGo new system (P3): a shop DriveGo's staff opened (tools/shop-admin.mjs new) has its registration in DGB.shop as
   the sign-up form left it; on the owner's first entry it goes into the organisation's settings (menu 10), as above */
async function dgbFillFromRegistration(){
  const s=DGB.shop; if(!s||!s.fillSettings||!DB.shop) return;
  if(!String(DB.shop.name||'').trim()){
    DB.shop.name=s.name||''; DB.shop.person=s.owner||''; DB.shop.tax=s.taxId||''; DB.shop.tel=s.tel||'';
    DB.shop.email=s.email||''; DB.shop.addr=(s.addr||'')+(s.zip?' '+s.zip:''); try{ await save(); }catch(e){}
    if(typeof fillSetting==='function') try{fillSetting()}catch(e2){}
  }
  delete s.fillSettings; await dgbSave();
}
function dgbCodeOk(){ $('#dgbCodeModal').style.display='none'; dgbEnter(); }

/* ── เข้าสู่ระบบ (เจ้าของ / พนักงาน) ── */
let dgbLoginMode='owner';
function dgbLoginTab(m){ dgbLoginMode=m;
  $$('#dgbLoginTabs button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  $('#dgbLoginOwner').style.display=m==='owner'?'':'none';
  $('#dgbLoginEmp').style.display=m==='emp'?'':'none';
  const er=$('#dgbLoErr'); if(er) er.style.display='none';
}
async function dgbLogin(){
  const err=$('#dgbLoErr'); const bad=m=>{ if(err){err.textContent=m;err.style.display='';} return false; };
  if(!DGB.shop) return bad('ยังไม่มีร้านในระบบ — กดสมัครเปิดร้านก่อน');
  if(dgbLoginMode==='owner'){
    const em=(($('#dgbLoEmail')||{}).value||'').trim().toLowerCase(), p=($('#dgbLoPass')||{}).value||'';
    const okUser=(em===DGB.shop.email)||(em===String(DGB.shop.ownerUser||'').toLowerCase());
    if(!okUser||!(await window.storage.checkSecret(DGBKEY,'DGB.shop','','pass',p))) return bad('รหัสผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง');
    DGB.session={who:'owner'}; await dgbSave();
    if($('#dgbLoPass')) $('#dgbLoPass').value='';
    dgbEnter(); return true;
  }
  /* พนักงาน: รหัสร้าน + เบอร์โทร + รหัสผ่านที่เจ้าของตั้ง */
  const sc=($('#dgbLeShop')||{}).value||'', tel=($('#dgbLeTel')||{}).value||'', p=($('#dgbLePass')||{}).value||'';
  if(shopCodeNorm(sc)!==shopCodeNorm(DGB.shop.code)) return bad('รหัสร้านไม่ถูกต้อง — สอบถามรหัสร้านจากเจ้าของ');
  if(!telNorm(tel)) return bad('กรุณากรอกเบอร์โทรพนักงาน');
  const e=(DB.emp||[]).find(x=>empActive(x)&&telNorm(x.tel)===telNorm(tel)&&x.dgbPass);
  if(!e) return bad('ไม่พบบัญชีพนักงานจากเบอร์นี้ — ให้เจ้าของร้านออกบัญชีในเมนู 10 ก่อน');
  if(e.dgbActive===false) return bad('บัญชีนี้ถูกระงับการใช้งาน — ติดต่อเจ้าของร้าน');
  if(!(await window.storage.checkSecret(KEY,'DB.emp',e.id,'dgbPass',p))) return bad('รหัสผ่านไม่ถูกต้อง');
  DGB.session={who:e.id}; await dgbSave();
  if($('#dgbLePass')) $('#dgbLePass').value='';
  dgbEnter(); return true;
}
async function dgbLogout(){
  if(DGB.session.who&&DGB.session.who!=='owner'){ DB.curEmp=''; try{ await save(); }catch(e){} applyPerms(); }
  DGB.session={who:''}; await dgbSave();
  dgbApplyUI();
}

/* ── เข้าแอปตาม session + บังคับล็อกเมื่อครบทดลองใช้ ── */
async function dgbEnter(){
  if(dgbLocked()){ dgbShow('lock'); dgbChip(); return; }
  const who=DGB.session.who;
  if(who&&who!=='owner'){
    const e=(DB.emp||[]).find(x=>x.id===who);
    if(!e||!empActive(e)||!e.dgbPass||e.dgbActive===false){ DGB.session={who:''}; await dgbSave(); dgbApplyUI(); return; }
    DB.curEmp=e.id; try{ await save(); }catch(er){}
    applyPerms();
    const first=PERM_TABS.find(([k])=>can('tabs.'+k));
    dgbShow(null); dgbApplyUI();
    go(first?first[0]:'home');
    toast('เข้าใช้งานในนาม '+e.name+' · ร้าน '+DGB.shop.code+' (ตามสิทธิที่เจ้าของกำหนด)');
  }else{
    DB.curEmp=''; try{ await save(); }catch(er){}
    await dgbFillFromRegistration();
    applyPerms();
    dgbShow(null); dgbApplyUI(); go('home');
    toast('ยินดีต้อนรับ '+DGB.shop.owner+' — เจ้าของร้าน '+DGB.shop.name);
  }
}

/* ── ชำระเงิน (จำลอง) → ปลดล็อก 1 ปี ── */
async function dgbPay(){
  if(DGB.session.who!=='owner') return toast('เฉพาะเจ้าของร้านเท่านั้นที่ชำระเงินได้');
  const ok=await askP({title:'ยืนยันการชำระเงิน (จำลอง)',
    text:'แพ็กเกจรายปี '+DGB_PRICE+' — ระบบจะปลดล็อกทันทีและใช้งานต่อจากข้อมูลเดิมทั้งหมด',yes:'ชำระเงิน',no:'ยกเลิก'});
  if(!ok) return;
  const end=new Date(); end.setDate(end.getDate()+365);
  DGB.shop.licensed=true; DGB.shop.licEnd=iso(end);
  DGB.shop.payments.push({date:iso(),amt:12000,note:'แพ็กเกจรายปี (เดโม)'});
  await dgbSave();
  toast('ชำระเงินสำเร็จ — ใช้งานได้ถึง '+thDate(DGB.shop.licEnd)+' ข้อมูลเดิมอยู่ครบทุกรายการ');
  dgbEnter();
}
/* เจ้าของเปลี่ยนรหัสผ่านเอง (แนะนำหลังเข้าครั้งแรก) */
async function dgbOwnerPass(){
  if(DGB.session.who!=='owner') return;
  const o=await askPromptP({title:'เปลี่ยนรหัสผ่านเจ้าของ',text:'ใส่รหัสผ่านเดิม',yes:'ต่อไป',no:'ยกเลิก'});
  if(o===null||o===undefined||o===false) return;
  if(!(await window.storage.checkSecret(DGBKEY,'DGB.shop','','pass',o))) return toast('รหัสผ่านเดิมไม่ถูกต้อง');
  const np=await askPromptP({title:'เปลี่ยนรหัสผ่านเจ้าของ',text:'ตั้งรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)',yes:'บันทึก',no:'ยกเลิก'});
  if(np===null||np===undefined||np===false) return;
  if(String(np).length<8) return toast('รหัสผ่านสั้นเกินไป — อย่างน้อย 8 ตัวอักษร');
  DGB.shop.pass=String(np); await dgbSave();
  toast('เปลี่ยนรหัสผ่านเรียบร้อย — ใช้รหัสใหม่ในการเข้าระบบครั้งถัดไป');
}
/* เครื่องมือเดโม: จำลองว่าครบ 15 วันแล้ว */
async function dgbSimExpire(){
  if(!DGB.shop) return;
  const d=new Date(); d.setDate(d.getDate()-(DGB_TRIAL_DAYS+1));
  DGB.shop.trialStart=iso(d); DGB.shop.licensed=false; DGB.shop.licEnd='';
  await dgbSave(); toast('จำลอง: ครบกำหนดทดลองใช้แล้ว — ระบบจะล็อกทันที'); dgbEnter();
}

function dgbBackTrial(){ if(DGB.shop){ dgbShow('login'); return; } dgbShow(null); dgbChip(); toast('กลับสู่โหมดทดลอง — สมัครเมื่อพร้อมได้ที่ปุ่มมุมขวาบน'); }

/* ── คู่มือทดสอบระบบ (ครอบทั้งอู่เดี่ยวและแฟรนไชส์) ── */
function dgbGuide(){
  let m=$('#dgbGuideModal');
  if(!m){
    m=document.createElement('div'); m.id='dgbGuideModal';
    m.style.cssText='position:fixed;inset:0;z-index:10002;background:rgba(0,0,0,.62);overflow:auto;display:none';
    m.innerHTML=`<div style="background:#fff;border-radius:14px;max-width:640px;margin:5vh auto 40px;padding:24px 26px;box-shadow:0 16px 50px rgba(0,0,0,.5)">
      <div style="display:flex;align-items:center"><h2 style="flex:1;margin:0">📖 คู่มือทดสอบระบบ DriveGo ProX Cloud</h2>
        <button onclick="document.getElementById('dgbGuideModal').style.display='none'" style="border:0;background:#eee;border-radius:8px;padding:6px 12px;cursor:pointer;font-family:inherit;font-weight:700">✕ ปิด</button></div>
      <div style="font-size:13.5px;line-height:2;margin-top:10px">
      <div style="background:#f6f8fa;border-radius:10px;padding:10px 14px;margin-bottom:12px">
        ตอนนี้คุณอยู่ใน <b>โหมดทดลอง (ยังไม่สมัคร)</b> — เข้าระบบมาแล้วในนามเจ้าของ
        เริ่มที่ <b>เมนู 10 ตั้งค่าองค์กร</b> (ข้อมูลองค์กรเว้นว่างรอกรอกจริง) ·
        เมนูอื่นมีข้อมูลตัวอย่างย้อนหลัง 36 เดือนให้ทดสอบครบทุกฟังก์ชัน</div>
      <b style="color:#2C66AF">🅰 ทดสอบแบบอู่เดี่ยว (ขายผ่าน www.drivegobiz.com)</b><br>
      1. เมนู 10 → กรอกข้อมูลองค์กร ธนาคาร โลโก้ → บันทึก<br>
      2. กดปุ่ม <b>"สมัคร / เข้าสู่ระบบ"</b> มุมขวาบน → กรอกข้อมูลจริง 9 รายการ →
         ระบบออก <b>รหัสร้าน · รหัสผู้ใช้ · รหัสผ่าน</b> ให้อัตโนมัติ (ทดลองฟรี 15 วัน)<br>
      3. เมนู 10 → แผง "บัญชีเข้าระบบพนักงาน" → ออกบัญชี (เบอร์โทร + รหัสผ่าน) ให้พนักงาน<br>
      4. ออกจากระบบ → เข้าแท็บ <b>พนักงาน</b> ด้วย รหัสร้าน + เบอร์โทร + รหัสผ่าน → เห็นเฉพาะเมนูตามสิทธิ<br>
      5. ปุ่ม <b>"⏱ เดโม: จำลองครบ 15 วัน"</b> → ระบบล็อก (ข้อมูลไม่หาย) → เจ้าของกดชำระเงิน → ปลดล็อก<br><br>
      <b style="color:#b45309">🅱 ทดสอบแบบหลายสาขา / แฟรนไชส์ (ProX Franchise Edition)</b><br>
      1. เมนู 10 → แผง <b>"DriveGo ProX · Franchise Edition"</b> → ใส่รหัสเปิดใช้ <span style="font-family:sans-serif"><b>PROX-FR-2026</b></span><br>
      2. ระบบสลับเป็นหน้า Login แฟรนไชส์ — ข้อมูลปัจจุบันกลายเป็น <b>สาขาหลัก B001</b> อัตโนมัติ<br>
      3. เข้าเป็น <b>HQ</b>: <span style="font-family:sans-serif">hq / 1234</span> → เปิด HQ Console:
         เพิ่มสาขา ออกรหัส คุมสิทธิรายเมนู คลังกลาง ใบขอเบิก แดชบอร์ดรวม<br>
      4. เข้าเป็น <b>สาขา</b>: <span style="font-family:sans-serif">b001 / 1234</span> หรือ <span style="font-family:sans-serif">b002 / 1234</span> →
         เมนู 07 มีแท็บ "เบิกสินค้าจาก HQ" (สร้างจาก Min-Max อัตโนมัติ)<br>
      5. เข้าเป็น <b>พนักงานสาขา</b>: บัญชีตัวอย่าง <span style="font-family:sans-serif">staff001 / 5678</span>
         หรือให้สาขาออกบัญชีใหม่ในเมนู 10<br>
      6. ปิดโหมดแฟรนไชส์ได้ที่เมนู 10 (ข้อมูลไม่หาย) — กลับสู่โหมดอู่เดี่ยว<br><br>
      <span style="color:#5f6d78;font-size:12px">🧪 ทางลัด: หน้า Login มีปุ่ม "เข้าทดสอบทันที — ในนามเจ้าของร้าน" และ
      "ล้างข้อมูลเดโม เริ่มใหม่" สำหรับเริ่มเดโมรอบใหม่ทั้งหมด · เปิดคู่มือนี้อีกครั้งที่ปุ่ม ❓ มุมขวาบน</span>
      </div></div>`;
    document.body.appendChild(m);
  }
  m.style.display='block';
}

/* ── ทางลัดทดสอบระบบ (เฉพาะไฟล์เดโม) ── */
async function dgbDemoOwner(){
  if(!DGB.shop){
    DGB.shop={code:'DG-1688',ownerUser:'dg1688',pass:'123456',
      name:'อู่เดโม ไดร์ฟโกบิซ',owner:'เจ้าของร้าน (เดโม)',idcard:'',bizType:'อู่ซ่อมรถยนต์ทั่วไป',
      taxId:'',addr:'66 ซอยแสมดำ 13 แขวงแสมดำ เขตบางขุนเทียน กรุงเทพมหานคร',zip:'10150',
      tel:'082-108-7000',email:'demo@drivegobiz.com',
      created:iso(),trialStart:iso(),licensed:false,licEnd:'',payments:[]};
    try{ if(DB.shop){ DB.shop.name=DB.shop.name||DGB.shop.name; } }catch(e){}
    toast('สร้างร้านเดโมให้แล้ว — รหัสร้าน DG-1688 · เจ้าของ dg1688 / 123456');
  }
  DGB.session={who:'owner'}; await dgbSave();
  await dgbEnter();
}
async function dgbDemoReset(){
  const ok=await askP({title:'ล้างข้อมูลเดโมทั้งหมด',
    text:'ลบข้อมูลร้าน บัญชี และฐานข้อมูลทุกสาขาในเครื่องนี้ แล้วเริ่มระบบใหม่ตั้งแต่หน้าสมัคร — ยืนยัน?',yes:'ล้างและเริ่มใหม่',no:'ยกเลิก'});
  if(!ok) return;
  try{
    const ks=await STORE.keys();
    for(const k of ks){ const kk=String(k);
      if(kk==='dgb.v22'||kk==='franchise.v22'||kk==='dgb.fresh.v22'||kk==='dgb.guide.v22'||kk.startsWith('garage.v22')) await STORE.del(kk); }
  }catch(e){}
  toast('ล้างข้อมูลแล้ว — กำลังเริ่มระบบใหม่');
  try{ location.reload(); }catch(e){ DGB={shop:null,session:{who:''}}; dgbApplyUI(); }
}

/* ── ชิปสถานะบนหัว + ล็อกช่องสลับผู้ใช้สำหรับ session พนักงาน ── */
function dgbChip(){
  let el=$('#dgbChip');
  if(!el){ const ub=document.querySelector('.userbox'); if(!ub) return;
    el=document.createElement('span'); el.id='dgbChip';
    el.style.cssText='display:inline-flex;gap:6px;align-items:center;margin-right:4px';
    ub.insertBefore(el,ub.firstChild); }
  if(!DGB.shop){
    el.innerHTML='<span style="background:#3a4652;color:#fff;font-weight:700;font-size:11px;padding:4px 10px;border-radius:20px;white-space:nowrap">☁ โหมดทดลอง — ยังไม่สมัครใช้งาน</span>'
     +'<button onclick="dgbShow(\'signup\')" style="background:#F0A400;color:#1a1204;border:0;border-radius:20px;padding:5px 13px;font-size:11.5px;font-weight:800;cursor:pointer;white-space:nowrap;font-family:inherit">สมัคร / เข้าสู่ระบบ</button>'
     +'<button onclick="dgbGuide()" title="คู่มือทดสอบระบบ" style="background:transparent;color:#fff;border:1px solid #6b7883;border-radius:20px;padding:4px 10px;font-size:11.5px;cursor:pointer;white-space:nowrap;font-family:inherit">❓ คู่มือ</button>';
    return;
  }
  if(!DGB.session.who){ el.innerHTML=''; return; }
  const who=DGB.session.who, owner=who==='owner';
  const e=!owner?(DB.emp||[]).find(x=>x.id===who):null;
  const lic=dgbLicActive(), days=dgbDaysLeft();
  const st=DGB_DEV_MODE?'โหมดพัฒนา · ไม่จำกัดวัน':lic?('ใช้งานเต็ม ถึง '+thDate(DGB.shop.licEnd))
    :(days>0?('ทดลองใช้ เหลือ '+days+' วัน'):'หมดอายุทดลองใช้');
  el.innerHTML='<span style="background:'+(owner?'#F0A400':'#15803d')+';color:'+(owner?'#1a1204':'#fff')+';font-weight:800;font-size:11px;padding:4px 9px;border-radius:20px;white-space:nowrap">☁ '
    +esc(DGB.shop.code)+' · '+(owner?'เจ้าของร้าน':esc(e?e.name:'พนักงาน'))+'</span>'
    +'<span style="background:'+(lic?'#dcfce7':'#fffbeb')+';color:'+(lic?'#15803d':'#b45309')+';font-weight:700;font-size:10.5px;padding:4px 8px;border-radius:20px;white-space:nowrap;border:1px solid '+(lic?'#86efac':'#fcd34d')+(owner&&!lic&&!DGB_DEV_MODE?';cursor:pointer':'')+'"'
    +(owner&&!lic&&!DGB_DEV_MODE?' onclick="dgbPay()" title="ชำระเงินเพื่อใช้งานเต็ม"':'')+'>'+st+'</span>'
    +(owner?'<button onclick="dgbOwnerPass()" title="เปลี่ยนรหัสผ่านเจ้าของ" style="background:transparent;color:#fff;border:1px solid #6b7883;border-radius:20px;padding:4px 9px;font-size:11.5px;cursor:pointer;white-space:nowrap">🔑</button>':'')
    +'<button onclick="dgbLogout()" title="ออกจากระบบ drivegobiz" style="background:transparent;color:#fff;border:1px solid #6b7883;border-radius:20px;padding:4px 11px;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap">ออกจากระบบ</button>';
}
function dgbApplyUI(){
  const who=DGB.shop?DGB.session.who:'';
  if(!DGB.shop){ dgbShow('signup'); }
  else if(!who){ dgbShow('login'); }
  else if(dgbLocked()){ dgbShow('lock'); }
  else dgbShow(null);
  dgbChip();
  const cu=$('#curUser');
  if(cu&&!FR.enabled){ const lockSel=!!(who&&who!=='owner');
    cu.disabled=lockSel; cu.title=lockSel?'ล็อกตามบัญชีพนักงานที่เข้าระบบ — กด "ออกจากระบบ" เพื่อเปลี่ยนผู้ใช้':''; }
}

/* ── แผงบัญชีพนักงานของเจ้าของ (เมนู 10) — เบอร์โทร + รหัสผ่านที่เจ้าของตั้ง ── */
function dgbRenderEmpPanel(){
  const w=$('#dgbEmpWrap'); if(!w) return;
  if(!DGB.shop||DGB.session.who!=='owner'){ w.innerHTML=''; return; }
  const emps=(DB.emp||[]).filter(e=>empActive(e));
  const nAcc=emps.filter(e=>e.dgbPass).length;
  const lic=dgbLicActive(), days=dgbDaysLeft();
  w.innerHTML=`<div class="panel" style="margin-bottom:14px;border:2px solid #F0A400">
    <header><h2>👤 บัญชีผู้ซื้อระบบ (เจ้าของร้าน) — drivegobiz.com</h2>
      <span class="tag" style="background:${lic?'#dcfce7':'#fffbeb'};color:${lic?'#15803d':'#b45309'}">${lic?('ใช้งานเต็ม ถึง '+thDate(DGB.shop.licEnd)):(days>0?('ทดลองใช้ เหลือ '+days+' วัน'):'หมดอายุทดลองใช้')}</span>
      <div class="spacer"></div>
      <button class="btn sm pri" onclick="dgbOwnerPass()"><i class="pkg-ic pkg-ic-key" aria-hidden="true"></i>เปลี่ยนรหัสผ่าน</button></header>
    <div class="grid g4" style="padding:12px 14px">
      <label class="f"><span>รหัสร้าน</span><input class="mono" value="${esc(DGB.shop.code)}" readonly style="background:#f6f8fa;font-weight:800"></label>
      <label class="f"><span>รหัสผู้ใช้เจ้าของ 🔒 <b style="color:#b91c1c">(รหัสถาวร — เปลี่ยนไม่ได้)</b></span><input class="mono" value="${esc(DGB.shop.ownerUser)}" readonly style="background:#f6f8fa;font-weight:800"></label>
      <label class="f"><span>อีเมลที่ลงทะเบียน (ใช้เข้าระบบแทนได้)</span><input class="mono" value="${esc(DGB.shop.email)}" readonly style="background:#f6f8fa"></label>
      <label class="f"><span>ผู้ถือบัญชี</span><input value="${esc(DGB.shop.owner)}" readonly style="background:#f6f8fa"></label></div>
    <div class="row" style="padding:0 14px 12px"><span class="hint">🔒 เพื่อความปลอดภัยและการตรวจสอบย้อนกลับ <b>รหัสผู้ใช้และอีเมลที่ลงทะเบียนเป็นข้อมูลถาวร แก้ไขเองไม่ได้</b> — เปลี่ยนได้เฉพาะ "รหัสผ่าน" เท่านั้น · หากต้องการแก้ข้อมูลจดทะเบียน ติดต่อฝ่ายบริการ DriveGoBiz</span></div>
  </div>
  <div class="panel" style="margin-bottom:14px;border:2px solid #2C66AF">
    <header><h2>☁ บัญชีเข้าระบบ drivegobiz.com ของพนักงาน — ร้าน ${esc(DGB.shop.code)}</h2>
      <span class="tag" style="background:#eef4fb;color:#2C66AF">${nAcc} บัญชี</span>
      <div class="spacer"></div>
      <button class="btn sm gh" style="color:var(--danger)" onclick="dgbSimExpire()"><i class="pkg-ic pkg-ic-clock" aria-hidden="true"></i>เดโม: จำลองครบ 15 วัน</button></header>
    <div class="row" style="padding:8px 12px 0"><span class="hint">พนักงานเข้าระบบที่หน้าเว็บด้วย <b>รหัสร้าน ${esc(DGB.shop.code)} + เบอร์โทรตัวเอง + รหัสผ่านที่เจ้าของตั้งให้</b> · เข้ามาแล้วใช้ได้เฉพาะเมนูตามสิทธิใน "ส่วนที่ 2" ด้านล่าง · เบอร์โทรห้ามซ้ำกันในร้าน</span></div>
    <div class="scroll" style="padding:6px 12px 12px"><table class="tbl">
      <thead><tr><th style="width:80px">รหัส</th><th>ชื่อพนักงาน / ตำแหน่ง</th>
        <th style="width:150px">เบอร์โทร (ใช้เข้าระบบ)</th><th style="width:110px">รหัสผ่าน</th>
        <th class="ctr" style="width:80px">สถานะ</th><th class="ctr" style="width:240px">จัดการ</th></tr></thead>
      <tbody>${emps.map(e=>`<tr><td class="mono">${esc(e.code)}</td>
        <td>${esc(e.name)}${e.position?' <span class="hint">('+esc(e.position)+')</span>':''}</td>
        <td><input class="mono" style="width:100%" value="${esc(e.tel||'')}" onchange="dgbEmpTel('${e.id}',this.value)"></td>
        <td class="mono">${e.dgbPass?esc(e.dgbPass):'-'}</td>
        <td class="ctr">${!e.dgbPass?'-':(e.dgbActive!==false?'ใช้งานได้':'<span style="color:#b91c1c;font-weight:700">ระงับ</span>')}</td>
        <td class="ctr">${e.dgbPass
          ?`<button class="btn sm gh" onclick="dgbEmpPass('${e.id}')">ตั้งรหัสใหม่</button>
            <button class="btn sm gh" onclick="dgbEmpToggle('${e.id}')">${e.dgbActive!==false?'⏸ ระงับ':'▶ เปิดใช้'}</button>`
          :`<button class="btn sm pri" onclick="dgbEmpPass('${e.id}')">+ ออกบัญชี (ตั้งรหัสผ่าน)</button>`}</td></tr>`).join('')
        ||'<tr><td colspan="6" class="hint">ยังไม่มีพนักงาน — เพิ่มที่ "ส่วนที่ 2" ด้านล่างก่อน</td></tr>'}</tbody></table></div></div>`;
}
function dgbTelDup(empId,tel){ const t=telNorm(tel); if(!t) return false;
  return (DB.emp||[]).some(x=>x.id!==empId&&empActive(x)&&telNorm(x.tel)===t); }
async function dgbEmpTel(empId,val){
  const e=(DB.emp||[]).find(x=>x.id===empId); if(!e) return;
  if(dgbTelDup(empId,val)){ toast('เบอร์นี้ซ้ำกับพนักงานคนอื่นในร้าน — เบอร์เข้าระบบต้องไม่ซ้ำกัน'); dgbRenderEmpPanel(); return; }
  e.tel=String(val).trim(); await save(); dgbRenderEmpPanel();
  try{ renderEmp(); }catch(er){}
  toast('บันทึกเบอร์โทรของ '+e.name+' แล้ว');
}
async function dgbEmpPass(empId){
  if(DGB.session.who!=='owner') return toast('เฉพาะเจ้าของร้านเท่านั้น');
  const e=(DB.emp||[]).find(x=>x.id===empId); if(!e) return;
  if(!telNorm(e.tel)) return toast('พนักงานคนนี้ยังไม่มีเบอร์โทร — กรอกเบอร์ก่อน (เบอร์ = ชื่อผู้ใช้เข้าระบบ)');
  if(dgbTelDup(empId,e.tel)) return toast('เบอร์ของพนักงานคนนี้ซ้ำกับคนอื่นในร้าน — แก้เบอร์ให้ไม่ซ้ำก่อน');
  const sug=String(Math.floor(10000000+Math.random()*90000000));
  const p=await askPromptP({title:'ตั้งรหัสผ่านให้ '+e.name,text:'รหัสผ่านสำหรับเข้าระบบ (อย่างน้อย 8 ตัว)\nแนะนำ: '+sug,yes:'บันทึก',no:'ยกเลิก'});
  if(p===null||p===undefined||p===false) return;
  const pass=String(p||'').trim()||sug;
  if(pass.length<8) return toast('รหัสผ่านสั้นเกินไป — อย่างน้อย 8 ตัวอักษร');
  e.dgbPass=pass; if(e.dgbActive===undefined) e.dgbActive=true;
  await save(); dgbRenderEmpPanel();
  toast('บัญชีพร้อมใช้ — แจ้งพนักงาน: รหัสร้าน '+DGB.shop.code+' · เบอร์ '+e.tel+' · รหัสผ่าน '+pass);
}
async function dgbEmpToggle(empId){
  const e=(DB.emp||[]).find(x=>x.id===empId); if(!e) return;
  e.dgbActive=e.dgbActive===false; await save(); dgbRenderEmpPanel();
  toast(e.dgbActive?('เปิดใช้บัญชีของ '+e.name+' แล้ว'):('ระงับบัญชีของ '+e.name+' แล้ว — เข้าระบบไม่ได้จนกว่าจะเปิดใช้'));
}

/* ── ผูกเหตุการณ์ + เริ่มระบบ ── */
(function(){
  const t=$('#dgbLoginTabs');
  if(t) t.addEventListener('click',e=>{ const b=e.target.closest('button[data-m]'); if(b) dgbLoginTab(b.dataset.m); });
  [['dgbLoPass','owner'],['dgbLePass','emp']].forEach(([id])=>{
    const el=$('#'+id); if(el) el.addEventListener('keydown',e=>{ if(e.key==='Enter') dgbLogin(); }); });
  const sp=$('#dgbSuEmail'); if(sp) sp.addEventListener('keydown',e=>{ if(e.key==='Enter') dgbSignup(); });
})();
const _dgbGoPrev=go;
go=function(v){ _dgbGoPrev(v); if(v==='setting') dgbRenderEmpPanel(); };
try{ Object.defineProperty(window,'DGB',{get:()=>DGB,set:v=>{DGB=v},configurable:true}); }catch(e){}
async function dgbFreshStart(){
  /* ไฟล์นี้เปิดมา "เสมือนเพิ่งเข้าระบบ พร้อมเริ่มตั้งค่าองค์กร" — ยังไม่สมัคร drivegobiz
     ข้อมูลตัวอย่าง 36 เดือน (ลูกค้า บิล สต๊อก พนักงาน) คงไว้ให้ทดสอบทุกเมนู
     แต่ล้างข้อมูลองค์กร (เมนู 10) ให้ว่าง รอกรอกจริง */
  try{
    if(!(await STORE.get('dgb.fresh.v22'))){
      Object.assign(DB.shop,{name:'',person:'',company:'',tax:'',tel:'',email:'',web:'',addr:'',branch:''});
      await save(); await STORE.set('dgb.fresh.v22','1');
      try{ if(typeof fillSetting==='function') fillSetting(); }catch(e){}
    }
  }catch(e){}
  dgbShow(null); dgbChip();
  try{ go('setting'); }catch(e){}
  if(!(await STORE.get('dgb.guide.v22'))){ dgbGuide(); await STORE.set('dgb.guide.v22','1'); }
}
(async()=>{
  for(let i=0;i<800&&!window.__frBootDone;i++) await new Promise(r=>setTimeout(r,25));
  await dgbLoad();
  if(DGB.shop&&DGB.session.who){ await dgbEnter(); }
  else if(!DGB.shop&&!FR.enabled){ /* copy login owns first-run presentation */ }
  else dgbApplyUI();
  window.__dgbReady=true;
})();
