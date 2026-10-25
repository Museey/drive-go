
/* ==========================================================
   ระบบบริหารงานหลังบ้านอู่ซ่อมรถ v2
   หน้าแรก · สต๊อก · จัดซื้อ · ผู้ขาย · ลูกค้า · ใบเสนอราคา · ใบเสร็จ/ใบกำกับภาษี
   ========================================================== */
const PROVINCES=["กรุงเทพมหานคร","กระบี่","กาญจนบุรี","กาฬสินธุ์","กำแพงเพชร","ขอนแก่น","จันทบุรี","ฉะเชิงเทรา","ชลบุรี","ชัยนาท","ชัยภูมิ","ชุมพร","เชียงราย","เชียงใหม่","ตรัง","ตราด","ตาก","นครนายก","นครปฐม","นครพนม","นครราชสีมา","นครศรีธรรมราช","นครสวรรค์","นนทบุรี","นราธิวาส","น่าน","บึงกาฬ","บุรีรัมย์","ปทุมธานี","ประจวบคีรีขันธ์","ปราจีนบุรี","ปัตตานี","พระนครศรีอยุธยา","พะเยา","พังงา","พัทลุง","พิจิตร","พิษณุโลก","เพชรบุรี","เพชรบูรณ์","แพร่","ภูเก็ต","มหาสารคาม","มุกดาหาร","แม่ฮ่องสอน","ยโสธร","ยะลา","ร้อยเอ็ด","ระนอง","ระยอง","ราชบุรี","ลพบุรี","ลำปาง","ลำพูน","เลย","ศรีสะเกษ","สกลนคร","สงขลา","สตูล","สมุทรปราการ","สมุทรสงคราม","สมุทรสาคร","สระแก้ว","สระบุรี","สิงห์บุรี","สุโขทัย","สุพรรณบุรี","สุราษฎร์ธานี","สุรินทร์","หนองคาย","หนองบัวลำภู","อ่างทอง","อำนาจเจริญ","อุดรธานี","อุตรดิตถ์","อุทัยธานี","อุบลราชธานี"];
const BRANDS=["Toyota (โตโยต้า)","Isuzu (อีซูซุ)","Honda (ฮอนด้า)","Mitsubishi (มิตซูบิชิ)","Nissan (นิสสัน)","Mazda (มาสด้า)","Ford (ฟอร์ด)","Chevrolet (เชฟโรเลต)","Suzuki (ซูซูกิ)","Hyundai (ฮุนได)","Kia (เกีย)","MG (เอ็มจี)","BYD (บีวายดี)","GWM / Haval (เกรท วอลล์)","ORA (โอร่า)","Tank (แทงค์)","NETA (เนต้า)","AION (ไอออน)","Deepal (ดีพาล)","Changan (ฉางอาน)","Chery (เชอรี่)","Omoda / Jaecoo","Jetour (เจ็ทัวร์)","Zeekr (ซีเคอร์)","XPeng (เอ็กซ์เผิง)","Wuling (อู่หลิง)","MAXUS (แม็กซัส)","GAC","Volvo (วอลโว่)","BMW (บีเอ็มดับเบิลยู)","MINI (มินิ)","Mercedes-Benz (เมอร์เซเดส-เบนซ์)","Audi (อาวดี้)","Volkswagen (โฟล์คสวาเกน)","Porsche (ปอร์เช่)","Lexus (เล็กซัส)","Subaru (ซูบารุ)","Peugeot (เปอโยต์)","Citroën (ซีตรอง)","Jaguar (จากัวร์)","Land Rover (แลนด์โรเวอร์)","Tesla (เทสลา)","Jeep (จี๊ป)","Alfa Romeo","Fiat (เฟียต)","Renault (เรโนลต์)","Škoda (สโกด้า)","SEAT","Opel (โอเปิ้ล)","Daihatsu (ไดฮัทสุ)","Proton (โปรตอน)","Perodua","Ssangyong (ซันยอง)","Tata (ทาทา)","Mahindra (มหินทรา)","Foton (โฟตอน)","JAC (เจเอซี)","DFSK (ดีเอฟเอสเค)","Seres (เซเรส)","Hino (ฮีโน่)","Fuso (ฟูโซ่)","UD Trucks","Scania (สแกนเนีย)","MAN (แมน)","Iveco (อีเวโก้)","Thairung (ไทยรุ่ง)","Rolls-Royce","Bentley (เบนท์ลี่)","Ferrari (เฟอร์รารี่)","Lamborghini (ลัมโบร์กินี)","Maserati (มาเซราติ)","Aston Martin","McLaren","Lotus (โลตัส)","Genesis (เจเนซิส)","Cadillac (แคดิลแลค)","Dodge / RAM","GMC","Infiniti (อินฟินิตี้)","Acura","Chrysler","Mitsuoka","อื่น ๆ (ระบุในรุ่นรถ)"];
const PLATE_LETTERS=["1กก","1กข","1กค","1กง","1กจ","1กฉ","1กช","2กก","2กข","2กค","3กก","กก","กข","กค","กง","กจ","กฉ","กช","กซ","กฌ","กญ","กฎ","กฏ","กฐ","กฑ","กฒ","กณ","กด","กต","กถ","กท","กธ","กน","กบ","กป","กผ","กพ","กฟ","กภ","กม","กย","กร","กล","กว","กศ","กษ","กส","กห","กฬ","กอ","กฮ","ขก","ขข","ขค","ขง","ขจ","ขฉ","ขช","ขต","ขท","ขน","ขบ","ขพ","ขม","ขย","ขร","ขล","ขว","ขส","ขห","ขอ","คก","คข","คค","คง","คจ","คฉ","คช","คต","คท","คน","คบ","คพ","คม","คย","คร","คล","คว","คส","คห","คอ","งก","งข","งค","งง","จก","จข","จค","ฉก","ฉข","ชก","ชข","ญก","ฐก","ฒก","ณก","ดก","ตก","ถก","ทก","ธก","นก","บก","ปก","ผก","ฝก","พก","ฟก","ภก","มก","ยก","รก","ลก","วก","ศก","ษก","สก","หก","ฬก","อก","ฮก"];
const CATS_BASE=["อะไหล่ไฟฟ้า","อะไหล่รถไฟฟ้า","อะไหล่แอร์","อะไหล่ช่วงล่าง","ระบบเบรก","หม้อน้ำ / ระบบระบายความร้อน","อะไหล่เครื่องยนต์","ระบบส่งกำลัง","อะไหล่บอดี้","น้ำมัน / ของเหลว","อะไหล่สิ้นเปลือง","อะไหล่เบ็ดเตล็ด","ยาง / ล้อ","อื่น ๆ"];
let CATS=CATS_BASE.slice();
const UNITS_BASE=["ชิ้น","กล่อง","เส้น","กิโลกรัม","ถัง","ชุด","คู่","ลิตร","ตัว","อัน","ม้วน"];
let UNITS=UNITS_BASE.slice();
/* หมวด "อื่น ๆ" เป็นหมวดปลายทาง — ลบไม่ได้ เพราะใช้รับสินค้าที่ถูกย้ายออกจากหมวดที่ถูกลบ */
const CAT_FALLBACK='อื่น ๆ';
function syncLists(){
  DB.cats=DB.cats||[]; DB.units=DB.units||[]; DB.catsOff=DB.catsOff||[];
  /* catsOff = หมวดมาตรฐานที่ผู้ใช้สั่งซ่อน — ลบออกจากรายการค่าคงที่ตรง ๆ ไม่ได้
     เพราะ CATS_BASE ถูกประกาศไว้ในโค้ด พอโหลดใหม่หมวดจะกลับมาเอง */
  CATS=CATS_BASE.filter(c=>c===CAT_FALLBACK||!DB.catsOff.includes(c))
    .concat(DB.cats.filter(c=>c&&!CATS_BASE.includes(c)));
  UNITS=UNITS_BASE.concat(DB.units.filter(u=>u&&!UNITS_BASE.includes(u)));
}

let KEY='garage.v22'; /* ALLIN v22: พื้นที่เก็บข้อมูลแยกจากไฟล์รุ่นเก่าทั้งหมด — FRANCHISE v17: เปลี่ยนเป็น let — สลับคีย์ฐานข้อมูลตามสาขา (HQ/HB) */
let DB={stock:[],cust:[],vendors:[],purchases:[],quotes:[],receipts:[],moves:[],crm:[],emp:[],curEmp:'',
  expenses:[],assets:[],capital:[],claims:[],invoices:[],cats:[],catsOff:[],units:[],coa:[],map:{},audit:[],hr:[],warns:[],seq:{},
  /* vatReg:false = ค่าเริ่มต้นของกิจการเปิดใหม่ — อู่ส่วนใหญ่ไม่ได้จดทะเบียน VAT
     ข้อมูลเดิมที่ไม่มีคีย์นี้ยังนับเป็น "จด" อยู่ เพราะทุกที่เช็คด้วย vatReg!==false */
  shop:{type:'person',vatReg:false,person:'',company:'',email:'',web:'',logo:'',logoHead:true,logoOp:7,
    licStart:'',licEnd:'',name:'หจก.เอกหม้อน้ำ',tax:'',tel:'',addr:'',branch:'สำนักงานใหญ่',bank:'',stale:6,warrM:3,ssoRate:5,ssoMin:1650,ssoMax:15000,ssoCap:750,
    warr:'รับประกันงานซ่อมและอะไหล่ที่เปลี่ยน 3 เดือน หรือ 5,000 กิโลเมตร แล้วแต่อย่างใดถึงก่อน ไม่รวมความเสียหายจากอุบัติเหตุ การใช้งานผิดประเภท หรือการดัดแปลงสภาพรถ'}};

/* ==========================================================
   ตัวเชื่อมที่เก็บข้อมูล — เลือกอัตโนมัติตามสภาพแวดล้อม
   host (แอปแม่) → IndexedDB (เปิดจากไฟล์/เว็บ) → localStorage → หน่วยความจำ
   ========================================================== */
let STORAGE_MODE='', memWarned=false;
const MEMSTORE={};
const STORAGE_LABEL={host:'ระบบเก็บข้อมูลของแอป',idb:'ฐานข้อมูลในเครื่อง (IndexedDB)',
  ls:'ที่เก็บข้อมูลเบราว์เซอร์ (localStorage)',mem:'หน่วยความจำชั่วคราว — ปิดหน้าจอแล้วข้อมูลหาย'};
const IDB={db:null,
  open(){ return new Promise((res,rej)=>{ const r=indexedDB.open('drivego-package-copy-v1-'+(window.PKG_PLAN||'selection'),1);
    r.onupgradeneeded=()=>{ if(!r.result.objectStoreNames.contains('kv')) r.result.createObjectStore('kv'); };
    r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); },
  async tx(mode){ this.db=this.db||await this.open();
    return this.db.transaction('kv',mode).objectStore('kv'); },
  async get(k){ const st=await this.tx('readonly');
    return new Promise((res,rej)=>{ const q=st.get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); },
  async set(k,v){ const st=await this.tx('readwrite');
    return new Promise((res,rej)=>{ const q=st.put(v,k); q.onsuccess=()=>res(true); q.onerror=()=>rej(q.error); }); },
  async del(k){ const st=await this.tx('readwrite');
    return new Promise((res,rej)=>{ const q=st.delete(k); q.onsuccess=()=>res(true); q.onerror=()=>rej(q.error); }); },
  async keys(){ const st=await this.tx('readonly');
    return new Promise((res,rej)=>{ const q=st.getAllKeys(); q.onsuccess=()=>res(q.result||[]); q.onerror=()=>rej(q.error); }); }
};
const STORE={
  async init(){
    if(STORAGE_MODE) return STORAGE_MODE;
    if(typeof window.storage==='object'&&window.storage&&typeof window.storage.get==='function'){
      STORAGE_MODE='host'; return STORAGE_MODE; }
    try{ if(typeof indexedDB!=='undefined'&&indexedDB){ await IDB.open(); STORAGE_MODE='idb'; return STORAGE_MODE; } }catch(e){}
    try{ COPY_LOCAL_STORAGE.setItem('__t','1'); COPY_LOCAL_STORAGE.removeItem('__t'); STORAGE_MODE='ls'; return STORAGE_MODE; }catch(e){}
    STORAGE_MODE='mem'; return STORAGE_MODE;
  },
  async get(k){ await this.init();
    try{
      if(STORAGE_MODE==='host'){ const r=await window.storage.get(k); return r?r.value:null; }
      if(STORAGE_MODE==='idb') return await IDB.get(k);
      if(STORAGE_MODE==='ls') return COPY_LOCAL_STORAGE.getItem(k);
      return MEMSTORE[k]||null;
    }catch(e){ return null; } },
  async set(k,v){ await this.init();
    try{
      if(STORAGE_MODE==='host'){ await window.storage.set(k,v); return true; }
      if(STORAGE_MODE==='idb'){ await IDB.set(k,v); return true; }
      if(STORAGE_MODE==='ls'){ COPY_LOCAL_STORAGE.setItem(k,v); return true; }
      MEMSTORE[k]=v; return true;
    }catch(e){
      if(STORAGE_MODE==='idb'||STORAGE_MODE==='host'){
        try{ COPY_LOCAL_STORAGE.setItem(k,v); STORAGE_MODE='ls'; return true; }catch(e2){}
      }
      MEMSTORE[k]=v; STORAGE_MODE='mem';
      if(!memWarned){ memWarned=true;
        toast('บันทึกถาวรไม่สำเร็จ — ข้อมูลจะอยู่จนกว่าจะปิดหน้าจอ กรุณาส่งออกไฟล์สำรองทันที'); }
      return false; } },
  async del(k){ await this.init();
    try{ if(STORAGE_MODE==='idb') return await IDB.del(k);
      if(STORAGE_MODE==='ls'){ COPY_LOCAL_STORAGE.removeItem(k); return true; }
      if(STORAGE_MODE==='host'&&window.storage.delete){ await window.storage.delete(k); return true; }
      delete MEMSTORE[k]; return true; }catch(e){ return false; } },
  async keys(){ await this.init();
    try{
      if(STORAGE_MODE==='idb') return await IDB.keys();
      if(STORAGE_MODE==='ls') return COPY_LOCAL_STORAGE.keys();
      if(STORAGE_MODE==='host'&&window.storage.list){ const r=await window.storage.list(KEY); return (r&&r.keys)||[]; }
      return Object.keys(MEMSTORE);
    }catch(e){ return []; } }
};
/* ---------- สำรองข้อมูลอัตโนมัติวันละครั้ง ---------- */
const BAK_KEEP=5;
let lastBakDay='';
async function autoBackup(prevJson){
  const day=iso();
  if(!prevJson||lastBakDay===day) return;
  lastBakDay=day;
  if(!['host','idb'].includes(STORAGE_MODE)) return;
  try{
    await STORE.set(KEY+'.bak.'+day,prevJson);
    const list=(await STORE.keys()).filter(k=>String(k).startsWith(KEY+'.bak.')&&!isSafetyBak(k)).sort();
    while(list.length>BAK_KEEP) await STORE.del(list.shift());
  }catch(e){}
}
/* DriveGo new system (task 3.2, decision F1): before the whole shop's data is wiped, restored, imported or replaced by
   sample data, a copy is kept (KEY.bak.safety-<date>T<time>-<kind>, 90 days on the server). The shop sees it in the
   restore list and can restore it; the daily backups never trim it. */
const SAFETY_KIND={wipe:'สำรองก่อนล้างข้อมูล',restore:'สำรองก่อนกู้คืน',import:'สำรองก่อนนำเข้าไฟล์',sample:'สำรองก่อนโหลดข้อมูลตัวอย่าง',demo36:'สำรองก่อนโหลดข้อมูลทดสอบ'};
const isSafetyBak=k=>String(k).includes('.bak.safety-');
function bakLabel(day){
  const m=/^safety-(\d{4}-\d\d-\d\d)T(\d\d)-(\d\d)-\d\d-(\w+)$/.exec(day);
  return m?(SAFETY_KIND[m[4]]||'สำรองอัตโนมัติ')+' '+thDate(m[1])+' '+m[2]+':'+m[3]:thDate(day);
}
/* The steps around replacing the whole data set (F1): the owner of the shop types its name to confirm, the copy is
   made, then o.run replaces the data (false = nothing changed) and the audit log records it. */
async function guardWholeData(o){
  const name=String((DB.shop&&DB.shop.name)||'').trim();
  if(!await askP(Object.assign({input:true,placeholder:'พิมพ์ชื่อร้าน '+name+' เพื่อยืนยัน',match:name},o.ask))) return false;
  if(['host','idb'].includes(STORAGE_MODE)){
    const d=new Date(),p=x=>String(x).padStart(2,'0');
    try{ await STORE.set(KEY+'.bak.safety-'+iso(d)+'T'+p(d.getHours())+'-'+p(d.getMinutes())+'-'+p(d.getSeconds())+'-'+o.kind,JSON.stringify(DB)); }catch(e){}
  }
  if(await o.run()===false) return false;
  logAudit('data',{id:'',no:''},o.act,o.note+' (ระบบสำรองข้อมูลไว้ก่อนแล้ว)'); save();
  return true;
}
async function listBackups(){
  const list=(await STORE.keys()).filter(k=>String(k).startsWith(KEY+'.bak.')).sort().reverse();
  return list.map(k=>({key:k,day:String(k).replace(KEY+'.bak.','')}));
}
async function load(){
  await STORE.init();
  try{ const v=await STORE.get(KEY); if(v) DB=Object.assign(DB,JSON.parse(v)); }catch(e){}
}
async function save(localOnly){
  const json=JSON.stringify(DB);
  try{ const prev=await STORE.get(KEY); autoBackup(prev); }catch(e){}
  await STORE.set(KEY,json);
}

/* ---------- utils ---------- */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const n=v=>{const x=parseFloat(v);return isNaN(x)?0:x};
/* DriveGo new system (task 3.3, decision R4): the VAT of each document is an amount in satang, rounded once on the
   document's total, halves away from zero (the legacy app kept it unrounded and rounded only when showing it) */
const round2=v=>{const x=n(v);return Math.sign(x)*Math.round(Number((Math.abs(x)*100).toPrecision(12)))/100;};
const vatOf=(base,rate)=>round2(n(base)*n(rate)/100);
const money=v=>n(v).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2});
const money0=v=>Math.round(n(v)).toLocaleString('th-TH');
/* จำนวน/ปริมาณ: แสดงไม่เกิน 2 ตำแหน่ง กันเศษทศนิยมยาวจากการคำนวณ */
const qf=v=>{const x=Math.round(n(v)*100)/100;return x.toLocaleString('th-TH',{maximumFractionDigits:2});};
const iso=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const TH_M=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function thDate(s){ if(!s) return '-'; const d=new Date(s+'T00:00:00'); if(isNaN(d)) return s;
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+(d.getFullYear()+543); }
function thLong(d){ d=d||new Date(); return d.getDate()+' '+TH_M[d.getMonth()]+' '+(d.getFullYear()+543); }
function addDays(s,d){const x=new Date(s+'T00:00:00');x.setDate(x.getDate()+n(d));return iso(x)}
function daysBetween(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000)}
function monthsSince(s){ if(!s) return 999; const d=new Date(s+'T00:00:00'); if(isNaN(d)) return 999;
  return (new Date()-d)/(1000*60*60*24*30.44); }
const ym=s=>String(s||'').slice(0,7);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2800)}
/* ป้ายยืนยันกลางจอ — ใช้กับการกระทำที่ผู้ใช้ต้องมั่นใจว่าสำเร็จจริง
   (บันทึกเอกสาร · ส่งขออนุมัติ · อนุมัติ) ข้อความเล็กมุมจอเดียวมองข้ามได้ง่าย */
/* ==========================================================
   กันป๊อปอัพซ้อนกัน
   บางขั้นตอนเรียกฟังก์ชันบันทึกให้เองก่อน (กดอนุมัติ / ส่งขออนุมัติ / ตัดสต๊อก)
   ถ้าปล่อยไว้ การ์ด "บันทึกเอกสารแล้ว" จะเด้งทับป๊อปอัพผลลัพธ์ที่ตามมาทันที
   → ปิดเสียงการ์ดเฉพาะช่วงที่บันทึกเป็นขั้นตอนภายใน แล้วให้ป๊อปอัพผลลัพธ์เป็นตัวรายงานแทน
   ========================================================== */
let FX_MUTE=0;
function fxMute(fn){ FX_MUTE++; try{ return fn(); } finally{ FX_MUTE--; } }
async function fxMuteAsync(fn){ FX_MUTE++; try{ return await fn(); } finally{ FX_MUTE--; } }
function saveFxHide(){ const el=$('#saveFx'); if(!el) return;
  clearTimeout(el._t); clearTimeout(el._t2); el.classList.remove('on','out'); }
function saveFx(title,sub){
  const el=$('#saveFx'); if(!el||FX_MUTE) return;
  $('#saveFxT1').textContent=title||'บันทึกเอกสารแล้ว';
  $('#saveFxT2').textContent=sub||'';
  clearTimeout(el._t); clearTimeout(el._t2);
  el.classList.remove('out'); el.classList.remove('on');
  void el.offsetWidth;                 /* บังคับให้อนิเมชั่นเริ่มใหม่ถ้ากดรัว ๆ */
  el.classList.add('on');
  el._t=setTimeout(()=>el.classList.add('out'),1250);
  el._t2=setTimeout(()=>{el.classList.remove('on','out')},1550);
}
function openModal(id){
  const m=$('#'+id); m.classList.add('on');
  /* ให้แถบอนุมัติเกาะใต้ header พอดีตามความสูงจริง */
  const sh=m.querySelector('.sheet.sticky-act'); if(sh){
    const h=sh.querySelector('.panel>header');
    if(h) sh.style.setProperty('--hdrH',Math.round(h.getBoundingClientRect().height)+'px');
  }
}
/* ปิดป๊อปอัพเมื่อไหร่ ทะเบียนของหน้านั้นโหลดใหม่ทันที — เห็นผลการบันทึกโดยไม่ต้องรีเฟรชเอง */
const MODAL_REFRESH={
  mQuoteEdit:()=>{ if(typeof renderQuoteOverview==='function') renderQuoteOverview(); renderHome(); },
  mReceiptEdit:()=>{ if(typeof renderDocOverview==='function') renderDocOverview();
    if(typeof renderTaxOverview==='function') renderTaxOverview(); renderHome(); },
  mBillingEdit:()=>{ if(typeof renderBillingList==='function') renderBillingList(); },
  mInvoiceEdit:()=>{ if(typeof renderDocOverview==='function') renderDocOverview(); },
  /* 4 ฟอร์มนี้เคยตกหล่น — ปิดฟอร์มแล้วทะเบียนข้างหลังค้างสถานะเก่า (เช่น ตีกลับแล้วยังโชว์รออนุมัติ) */
  mGREdit:()=>{ if(typeof renderGRList==='function') renderGRList(); },
  mClaimEdit:()=>{ if(typeof renderClaimList==='function') renderClaimList(); },
  mIssueEdit:()=>{ if(typeof renderIssueList==='function') renderIssueList(); },
  mCountEdit:()=>{ if(typeof renderCountList==='function') renderCountList(); },
  mTaxNew:()=>{ if(typeof renderTaxOverview==='function') renderTaxOverview(); },
  mBnPay:()=>{ if(typeof renderBillingList==='function') renderBillingList(); },
  mPartPay:()=>{ if(typeof acctPane!=='undefined'&&acctPane==='ar'&&typeof renderAcctAR==='function') renderAcctAR();
    if(typeof acctPane!=='undefined'&&acctPane==='ap'&&typeof renderAcctAP==='function') renderAcctAP(); },
  mStock:()=>{ if(typeof renderStock==='function') renderStock(); }
};
function closeModal(id){
  if(id==='mQuoteEdit'&&typeof pkgQuoteDirty==='function'&&pkgQuoteDirty()){
    const closingQuote=Q;
    askConfirm({title:'มีข้อมูลที่ยังไม่ได้บันทึก',
      text:'รายการสินค้าหรือข้อมูลในใบเสนอราคานี้ยังไม่ได้บันทึก ต้องการปิดจริงหรือไม่? หากปิด การแก้ไขที่ยังไม่ได้บันทึกจะไม่ถูกเก็บไว้',
      yes:'ปิดโดยไม่บันทึก',no:'กลับไปแก้ไข',
      onYes:()=>{if(Q!==closingQuote)return; $('#mQuoteEdit').classList.remove('on');
        const f=MODAL_REFRESH.mQuoteEdit;if(f)f();}});
    return;
  }
  $('#'+id).classList.remove('on');
  const f=MODAL_REFRESH[id]; if(f){ try{f()}catch(e){} }
}
/* คลิกฉากหลังมืดนอกกรอบเอกสาร = ปิดป๊อปอัพ (เทียบเท่าปุ่มปิด — ไม่ต้องเลื่อนหาปุ่ม)
   จับคู่ mousedown-click ที่ฉากหลังตัวเดียวกัน กันเผลอปิดตอนลากคลุมข้อความแล้วปล่อยนอกกรอบ */
let _bdDown=null;
document.addEventListener('mousedown',e=>{ _bdDown=e.target; });
document.addEventListener('click',e=>{
  const m=e.target;
  if(m===_bdDown&&m.classList&&m.classList.contains('modal')&&m.classList.contains('on')){
    if(m.id==='mAsk') askClose(false); else closeModal(m.id);
  }
});
/* ป๊อปอัพยืนยันกลางจอ — ใช้แทน confirm()/prompt() ของเบราว์เซอร์ทั้งระบบ
   o.msg = ข้อความแบบ HTML · o.text = ข้อความล้วน (ปลอดภัยกับชื่อ/ข้อมูลที่ผู้ใช้กรอก)
   o.input = โชว์ช่องกรอกข้อความ (แทน prompt) · o.onYes / o.onNo = callback ตามปุ่มที่กด */
let askCb=null, askCbNo=null;
function askConfirm(o){
  saveFxHide();   /* ตาข่ายกันซ้อน — ป๊อปอัพเปิดเมื่อไหร่ การ์ดบันทึกเก็บทันที ไม่ว่ามาจากทางไหน */
  $('#askTitle').textContent=o.title||'ยืนยัน';
  /* o.ok = ป๊อปอัพแจ้งผลสำเร็จ (ไม่ใช่คำถามเตือน) — ขึ้นเครื่องหมายถูกวาดตัวเองไว้ด้านบน
     ข้อความใน o.ok บอกว่าอะไรสำเร็จไปแล้ว ส่วนคำถามว่าจะทำอะไรต่ออยู่ในเนื้อความ */
  const tk=$('#askTick');
  if(tk){
    tk.style.display=o.ok?'block':'none';
    if(o.ok){
      $('#askTickT').textContent=(typeof o.ok==='string')?o.ok:'';
      const sv=tk.querySelector('svg path'), rg=tk.querySelector('.tick');
      [sv,rg].forEach(el=>{ if(el){ el.style.animation='none'; void el.offsetWidth; el.style.animation=''; } });
    }
  }
  if(o.text!==undefined) $('#askMsg').textContent=o.text; else $('#askMsg').innerHTML=o.msg||'';
  $('#askYes').textContent=o.yes||'ตกลง';
  $('#askNo').textContent=o.no||'ยังไม่ตอนนี้';
  /* ป๊อปอัพแจ้งผลสำเร็จมีปุ่มเดียวพอ — noHide:true ซ่อนปุ่มปฏิเสธ */
  const nbEl=$('#askNo'); if(nbEl) nbEl.style.display=o.noHide?'none':'';
  const inp=$('#askInput');
  if(inp){ inp.style.display=o.input?'block':'none'; inp.value=o.value||''; inp.placeholder=o.placeholder||''; }
  /* DriveGo new system (task 3.2, decision F1): o.match — the yes button works only once the box holds exactly that text;
     (task 3.3, decision R4-ข) o.required — only once the box holds some text */
  const yb=$('#askYes'), held=o.match||o.required; if(yb) yb.disabled=!!held;
  if(inp) inp.oninput=held?()=>{ if(yb) yb.disabled=o.match?inp.value.trim()!==o.match:!inp.value.trim(); }:null;
  askCb=o.onYes||null; askCbNo=o.onNo||null;
  openModal('mAsk');
  if(o.input&&inp) setTimeout(()=>inp.focus(),80);
}
function askClose(ok){
  if(ok&&$('#askYes').disabled) return;   /* Enter in the box of a popup that needs o.match / o.required */
  closeModal('mAsk');
  const cb=askCb, nb=askCbNo; askCb=null; askCbNo=null;
  if(ok){ if(typeof cb==='function') cb(); }
  else if(typeof nb==='function') nb();
}
/* แบบรอคำตอบ (Promise) — ใช้ใน async function: await askP({...}) ได้ true/false */
function askP(o){ return new Promise(res=>{ o=Object.assign({},o); o.onYes=()=>res(true); o.onNo=()=>res(false); askConfirm(o); }); }
/* แทน prompt(): ได้ข้อความที่กรอกเมื่อกดตกลง หรือ null เมื่อยกเลิก/ปิดป๊อปอัพ */
function askPromptP(o){ return new Promise(res=>{ o=Object.assign({input:true},o); o.onYes=()=>res($('#askInput').value); o.onNo=()=>res(null); askConfirm(o); }); }
function docNoBase(prefix){
  const d=new Date();
  return prefix+'.'+String(d.getFullYear()+543).slice(2)+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
/* กันเลขซ้ำเมื่อมีผู้ใช้หลายคนบันทึกพร้อมกัน — ตรวจกับเอกสารที่บันทึกจริง ไม่ใช่ดูแค่ตัวนับ */
function docNoTaken(no){
  const has=(arr,f)=>(arr||[]).some(f||(x=>x.no===no));
  return has(DB.quotes)||has(DB.invoices)||has(DB.billings)||has(DB.purchases)
    ||has(DB.claims)||has(DB.issues)||has(DB.stockCounts)
    ||has(DB.receipts,r=>r.no===no||(r.taxDocs||[]).some(d=>d.no===no));
}
function nextDocNo(prefix){
  const base=docNoBase(prefix);
  let i=(DB.seq[base]||0)+1;
  while(docNoTaken(base+'-'+String(i).padStart(2,'0'))) i++;
  return {base,i,no:base+'-'+String(i).padStart(2,'0')};
}
/* ดูเลขถัดไปโดยไม่จองเลข (ใช้โชว์ตอนยังไม่บันทึก) */
function peekDocNo(prefix){ return nextDocNo(prefix).no; }
function docNo(prefix){
  const r=nextDocNo(prefix);
  DB.seq[r.base]=r.i;
  return r.no;
}
function ensureDocNo(r,historyField,noField,prefix){
  r[historyField]=r[historyField]||[];
  const cur=r[historyField].length?r[historyField][r[historyField].length-1]:null;
  if(!cur||cur.cancelled){
    const no=docNo(prefix);
    r[historyField].push({no,date:iso(),cancelled:false,cancelReason:'',cancelDate:''});
    r[noField]=no;
  }
  return r[noField];
}
/* DriveGo new system (task 3.3, decisions R4, R5, R6-ก): a tax invoice keeps its own amounts from the moment it is
   issued, is dated on the day of the sale (the day the sales tax report files it under; `issued` is the day it was
   made), and one issued in place of a cancelled one records its number (`replaces`, as the legacy app's own reissue does) */
function stampTaxDoc(r){
  const docs=r.taxDocs||[], cur=docs[docs.length-1], prev=docs[docs.length-2];
  if(!cur||cur.cancelled||cur.base!==undefined) return;
  const t=receiptTotals(r);
  cur.issued=cur.date; cur.date=r.date||cur.date; cur.rate=n(r.vat); cur.base=round2(t.base); cur.vat=round2(t.vat); cur.gross=round2(t.gross);
  if(prev&&prev.cancelled) cur.replaces=prev.no;
}
/* what the sales tax report files a sale under: its valid tax invoice's own amounts, else the bill's */
function saleTaxOf(r){ const d=(r.taxDocs||[]).slice(-1)[0]; return d&&!d.cancelled&&d.base!==undefined?{base:d.base,vat:d.vat}:receiptTotals(r); }
async function toggleDocCancel(r,historyField,noField,legacyKind,label){
  r[historyField]=r[historyField]||[];
  const cur=r[historyField].length?r[historyField][r[historyField].length-1]:null;
  if(!cur||cur.no!==r[noField]) return;
  if(!cur.cancelled){
    const reason=await askPromptP({title:'ยกเลิก'+label+' '+cur.no,text:'ระบุเหตุผลที่ยกเลิก (ไม่บังคับ)',yes:'ยกเลิกเอกสาร',no:'ไม่ยกเลิก'});
    if(reason===null) return false;
    cur.cancelled=true; cur.cancelReason=String(reason||'').trim(); cur.cancelDate=iso();
    logAudit('receipt',r,legacyKind+'cancel','ยกเลิก'+label+' '+cur.no+(reason?' — '+reason:''));
    toast('ยกเลิก'+label+' '+cur.no+' แล้ว');
  } else {
    if(!await askP({title:'คืนสถานะเอกสาร',text:'คืนสถานะ'+label+' '+cur.no+' ให้เป็นปกติ (ไม่ยกเลิก) ?'})) return false;
    cur.cancelled=false; cur.cancelReason=''; cur.cancelDate='';
    logAudit('receipt',r,legacyKind+'uncancel','คืนสถานะ'+label+' '+cur.no);
    toast('คืนสถานะ'+label+' '+cur.no+' แล้ว');
  }
  return true;
}
function bahtText(num){
  const N=['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'],U=['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
  function conv(s){ s=String(parseInt(s,10)||0); if(s==='0') return 'ศูนย์'; let out='',len=s.length;
    for(let i=0;i<len;i++){ const d=+s[i], p=(len-i-1)%6, isM=(len-i-1)>=6&&(len-i-1)%6===0;
      if(d!==0){ if(p===1&&d===1) out+='สิบ'; else if(p===1&&d===2) out+='ยี่สิบ';
        else if(p===0&&d===1&&i>0&&/[1-9]/.test(s.slice(0,i))) out+='เอ็ด'; else out+=N[d]+U[p]; }
      if(isM) out+='ล้าน'; }
    return out.replace(/ล้านล้าน/g,'ล้าน'); }
  const neg=num<0; num=Math.abs(Math.round(n(num)*100)/100);
  const b=Math.floor(num), st=Math.round((num-b)*100);
  return (neg?'ลบ':'')+conv(b)+'บาท'+(st?conv(st)+'สตางค์':'ถ้วน');
}
const priceByTier=(s,t)=>t==='A'?n(s.pa):t==='C'?n(s.pc):n(s.pb);
const custName=c=>c?(c.type==='company'?(c.company||c.name):c.name):'';
const plateOf=v=>v?((v.plateL||'')+' '+(v.plateN||'')+(v.plateProv?' '+v.plateProv:'')).trim():'-';
const vehLabel=v=>v?[v.brand,v.model,v.color,plateOf(v)].filter(Boolean).join(' · '):'-';
/* เลขเครื่องยนต์ / หมายเลขตัวถัง — ต้องแสดงในเอกสารที่ออกให้ลูกค้าทุกฉบับ */
function vehIdLine(v){
  if(!v) return '<br>เลขเครื่องยนต์ -  ·  หมายเลขตัวถัง -';
  return '<br>เลขเครื่องยนต์ '+esc(v.engine||'-')+'  ·  หมายเลขตัวถัง '+esc(v.vin||'-');
}
function addrLine(a){ if(!a) return '-';
  const bkk=a.prov==='กรุงเทพมหานคร', p=[];
  if(a.no)p.push(a.no); if(a.village)p.push(a.village); if(a.moo)p.push('หมู่ '+a.moo);
  if(a.soi)p.push('ซ.'+a.soi); if(a.road)p.push('ถ.'+a.road);
  if(a.sub)p.push((bkk?'แขวง':'ต.')+a.sub); if(a.dist)p.push((bkk?'เขต':'อ.')+a.dist);
  if(a.prov)p.push((bkk?'':'จ.')+a.prov); if(a.zip)p.push(a.zip);
  return p.join(' ')||'-'; }
const findCust=id=>DB.cust.find(x=>x.id===id);
const findVen=id=>DB.vendors.find(x=>x.id===id);
const findQuote=id=>DB.quotes.find(x=>x.id===id);

/* ---------- tabs ---------- */
/* เมนูย่อยแรกของแต่ละหมวด — คลิกหัวข้อใหญ่แล้วเปิดหน้าแรกของหมวดนั้นทันที ไม่ค้างหน้าจอเดิม */
const NAV_FIRST_SUB={cust:()=>custGo('list'),receipt:()=>rOvGo('doc'),buy:()=>buyGo('gr'),
  stock:()=>stkGo('stock'),acct:()=>acctGo('health'),hr:()=>hrGo('sum')};
$('#tabs').addEventListener('click',e=>{
  const b=e.target.closest('button'); if(!b||!b.classList.contains('navparent'))return;
  const v=b.dataset.v;
  if(NAV_HAS_CHILDREN.includes(v)&&!$('#tabs').classList.contains('collapsed')){
    const it=b.closest('.navitem');
    const already=$$('#tabs button.navparent').find(x=>x.classList.contains('on'))===b;
    $$('#tabs .navitem.expanded').forEach(x=>{ if(x!==it) x.classList.remove('expanded'); });
    if(already){ it.classList.toggle('expanded'); return; }   /* อยู่หมวดนี้อยู่แล้ว = พับ/กางเมนูย่อยตามเดิม */
    it.classList.add('expanded');
    go(v);                                                    /* สลับหน้าจอไปหมวดที่คลิกทันที */
    if(NAV_FIRST_SUB[v]) try{ NAV_FIRST_SUB[v](); }catch(err){} /* และเปิดเมนูย่อยแรกของหมวดเสมอ */
    return;
  }
  go(v);
});
try{ if(COPY_LOCAL_STORAGE.getItem('sidebarCollapsed')==='1'){ $('#tabs').classList.add('collapsed'); $('#topBrand').classList.add('collapsed'); } }catch(e){}
try{ syncNavToggleIcon($('#tabs').classList.contains('collapsed')); }catch(e){}
const NAV_HAS_CHILDREN=['cust','receipt','buy','stock','acct','hr','prox','techroom'];
function syncNavExpand(v){
  $$('#tabs .navitem').forEach(it=>{
    const btn=it.querySelector('.navparent');
    it.classList.toggle('expanded', !!btn && btn.dataset.v===v && NAV_HAS_CHILDREN.includes(v));
  });
}
function toggleSidebar(){
  const collapsed=$('#tabs').classList.toggle('collapsed');
  $('#topBrand').classList.toggle('collapsed', collapsed);
  syncNavToggleIcon(collapsed);
  try{ COPY_LOCAL_STORAGE.setItem('sidebarCollapsed', collapsed?'1':'0'); }catch(e){}
}
function syncNavToggleIcon(collapsed){
  const b=$('#navToggleBtn'); if(!b)return;
  b.querySelector('.n').innerHTML=collapsed?'»<i>เมนู</i>':'◀';
  b.title=collapsed?'เปิดเมนูกลับ':'พับเมนู';
}
/* ชื่อหัวข้อใหญ่ใต้หัวดำ (โชว์เฉพาะจอมือถือ — จอกว้างถูกซ่อนด้วย CSS) เอาเลข+ชื่อจากเมนูข้างมาแสดง
   หมวดที่มีหมวดย่อย: ใช้ชื่อหมวดย่อยที่เลือกอยู่แทน เช่น 4.1 / 4.2 / 4.3 (หัวซ้ำในกรอบล่างถูกซ่อนด้วย .mht) */
function mSetPageTitle(v){
  const el=document.getElementById('mPageTitle'); if(!el) return;
  const nb=document.querySelector('#tabs .navparent[data-v="'+v+'"]');
  if(!nb){ el.textContent=''; return; }
  const num=(nb.querySelector('.n')||{}).textContent||'';
  const lbl=(nb.querySelector('.lbl')||{}).textContent||'';
  const sub=document.querySelector('#nc-'+v+' .navseg button.on');
  if(sub){
    /* ใช้ชื่อที่เก็บไว้ก่อนแปะป้ายตัวเลขรออนุมัติ ไม่งั้นจะได้ "ซื้อสินค้า0" ติดมา */
    const s=(sub.dataset.lbl||sub.textContent).replace(/^[\s★✚]+/,'').trim();
    if(/^\d+\.\d/.test(s)){ el.textContent=s; return; }          /* มีเลขหมวดย่อยในตัวแล้ว เช่น 4.1 */
    el.textContent=(num?num+' · ':'')+s.replace(/^\d+\s*·\s*/,''); return; /* ตัดเลขนำแบบ "1 ·" ของหมวด 06 ออก */
  }
  el.textContent=(num?num+' · ':'')+lbl;
}
function go(v){
  if(!can('tabs.'+v)){toast('บัญชีพนักงานนี้ไม่ได้รับสิทธิเข้าใช้เมนูดังกล่าว');return}
  $$('#tabs button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));
  mSetPageTitle(v); setTimeout(()=>mSetPageTitle(v),60);   /* เรียกซ้ำหลังแท็บย่อยติ๊ก .on เสร็จ */
  syncNavExpand(v);
  $$('section.view').forEach(s=>s.classList.toggle('on',s.id==='v-'+v));
  if(v==='home') renderHome();
  if(v==='prox'){ ensurePX(); pxGo(pxPane); }
  if(v==='techroom'){ ensurePX(); trGo(trPane); }
  if(v==='quote'){refreshQuoteRefs();renderQPrev();renderQuoteOverview()}
  if(v==='receipt'){refreshReceiptRefs();calcReceipt();rOvGo(rOvPane)}
  if(v==='buy'){refreshGRRefs();renderBuyPane()}
  if(v==='crm') renderCrm();
  if(v==='emp') renderEmp();
  if(v==='acct') renderAcct();
  if(v==='hr'){ hrMonth(); hrGo(hrPane); }
  if(v==='setting'){ fillSetting(); renderEmp(); renderLicense(); renderStoreBox(); }
  if(v==='vendor') renderVen();
  if(v==='cust') custGo(custPane);
  if(v==='stock') stkGo(stkPane);
  window.scrollTo(0,0);
}

/* ==========================================================
   หน้าแรก
   ========================================================== */
function quoteTotals(q){
  const sub=(q.items||[]).reduce((a,it)=>a+n(it.qty)*n(it.price),0);
  const base=Math.max(0,sub-n(q.disc)), vat=vatOf(base,q.vat);
  return {sub,disc:n(q.disc),base,vat,total:base+vat,
    labor:(q.items||[]).filter(i=>i.type==='labor').reduce((a,it)=>a+n(it.qty)*n(it.price),0)};
}
function cardBaseAmt(r,net){
  const p=(r&&r.pay)||{};
  if(!p.card) return 0;
  const hasSplitAmts=n(p.cashAmt)||n(p.transAmt)||n(p.cardAmt);
  return hasSplitAmts?n(p.cardAmt):n(net);
}
function cardFee(r,net){
  const p=(r&&r.pay)||{};
  if(!p.card||!n(p.cardPct)) return 0;
  return Math.round(cardBaseAmt(r,net)*n(p.cardPct))/100;
}
function receiptTotals(r){
  const sub=(r.items||[]).reduce((a,it)=>a+n(it.qty)*n(it.price),0);
  const disc=n(r.disc), base=Math.max(0,sub-disc), vat=vatOf(base,r.vat), gross=base+vat;
  const labor=(r.items||[]).filter(i=>i.type==='labor').reduce((a,it)=>a+n(it.qty)*n(it.price),0);
  const whtBaseAmt=r.whtBase==='labor'?labor:base, whtAmt=whtBaseAmt*n(r.wht)/100;
  const net=gross-whtAmt, fee=cardFee(r,net), cardBase=cardBaseAmt(r,net);
  return {sub,disc,base,vat,gross,labor,whtBaseAmt,whtAmt,net,fee,cardBase,
    cardChargeAmt:Math.round((cardBase+fee)*100)/100,payAmt:Math.round((net+fee)*100)/100};
}
/* ต้นทุนจริงต่อหน่วยหลังเฉลี่ยส่วนลดท้ายบิล — ใช้ตอนรับเข้าสต๊อกและตอนแสดงบนฟอร์ม
   เฉลี่ยตามสัดส่วนมูลค่า (แถวแพงรับส่วนลดมากกว่า) · เอกสารยังเก็บราคาตามบิลเป๊ะ ไม่ถูกแก้
   จึงไม่มีปัญหาหักส่วนลดซ้ำในยอดรวม และพิมพ์ใบออกมาตรงกับบิลผู้ขายเสมอ */
function grDiscFactor(g){
  const sub=(g.items||[]).reduce((a,it)=>a+n(it.qty)*n(it.cost),0);
  const disc=n(g.disc);
  if(!(sub>0)||!(disc>0)) return 1;
  return Math.max(0,sub-disc)/sub;
}
function grUnitCost(g,it){ return Math.round(n(it.cost)*grDiscFactor(g)*100)/100; }
function grTotals(g){
  const sub=(g.items||[]).reduce((a,it)=>a+n(it.qty)*n(it.cost),0);
  const base=Math.max(0,sub-n(g.disc)), vat=vatOf(base,g.vat);
  return {sub,disc:n(g.disc),base,vat,total:base+vat};
}
/* ใบเสร็จที่ถูกยกเลิกไม่นับ — ใบเสนอราคานั้นต้องกลับมาออกใบเสร็จใหม่ได้ */
const billedQuoteIds=()=>new Set(DB.receipts.filter(r=>!r.cancelled).map(r=>r.quoteId).filter(Boolean));
/* ใบเสนอราคา 1 ใบ ออกใบเสร็จได้ใบเดียว — คืนใบเสร็จที่ยังไม่ถูกยกเลิกของใบเสนอราคานั้น (ถ้ามี)
   ใบที่ยกเลิกแล้วไม่นับ จึงออกใหม่ได้หลังยกเลิกใบเดิม */
function activeReceiptOfQuote(qid,exceptId){
  if(!qid) return null;
  return DB.receipts.find(r=>r.quoteId===qid&&!r.cancelled&&r.id!==exceptId)||null;
}
/* เตือนว่าออกซ้ำไม่ได้ พร้อมทางลัดไปเปิดใบเดิม (จะได้กดยกเลิกที่นั่นถ้าต้องการออกใหม่) */
async function warnDupReceipt(rec,qno){
  if(await askP({title:'ใบเสนอราคานี้ออกใบเสร็จไปแล้ว',
    text:'ใบเสนอราคา '+(qno||'')+' ออกใบเสร็จ '+rec.no+' ไว้แล้ว\n\n'
      +'ออกใบเสร็จซ้ำจากใบเดียวกันไม่ได้ — ถ้าต้องการออกใบใหม่ ให้ยกเลิกใบเดิมก่อน',
    yes:'เปิดใบเสร็จเดิม',no:'ปิด'})) openReceiptById(rec.id);
}
function pendingJobs(){
  const billed=billedQuoteIds();
  return DB.quotes.filter(q=>!q.cancelled&&!billed.has(q.id)).sort((a,b)=>(a.jobIn||a.date).localeCompare(b.jobIn||b.date));
}
/* ---------- ตารางแจ้งเตือน Min/Max แบ่งหน้า 10 บรรทัด ---------- */
let MM_PAGE=1;
function renderMmTable(){
  const mm=DB.stock.map(it=>({it,f:flags(it)})).filter(x=>x.f.min||x.f.max)
    .sort((a,b)=>(b.f.min?1:0)-(a.f.min?1:0)||a.it.code.localeCompare(b.it.code));
  const per=10, pages=Math.max(1,Math.ceil(mm.length/per));
  if(MM_PAGE>pages) MM_PAGE=pages; if(MM_PAGE<1) MM_PAGE=1;
  const slice=mm.slice((MM_PAGE-1)*per,MM_PAGE*per);
  $('#mmTag').textContent=mm.length+' รายการ · หน้า '+MM_PAGE+'/'+pages;
  $('#mmTbl tbody').innerHTML=slice.map(x=>`<tr class="click" onclick="setCat('',true);go('stock')">
    <td class="mono">${esc(x.it.code)}</td><td>${esc(x.it.name)}</td><td class="num"><b>${qf(x.it.qty)}</b></td>
    <td class="num">${qf(x.it.min)}</td><td class="num">${qf(x.it.max)}</td>
    <td class="ctr">${x.f.min?'<span class="chip a">ถึงจุดสั่งซื้อ</span>':''}${x.f.max?'<span class="chip r">เกิน Max</span>':''}</td></tr>`).join('');
  $('#mmEmpty').style.display=mm.length?'none':'block';
  $('#mmPager').innerHTML=pagerHtml(MM_PAGE,pages,'mmGoPage');
}
function mmGoPage(p){ MM_PAGE=p; renderMmTable(); }
/* ---------- ตารางลูกหนี้คงค้าง แบ่งหน้า 10 บรรทัด ---------- */
let AR_PAGE=1;
function arPeriodChange(){
  $('#arCustomRow').style.display=$('#arPeriod').value==='custom'?'flex':'none';
  AR_PAGE=1; renderArTable();
}
function renderArTable(){
  const today=iso();
  const allRows=DB.receipts.filter(r=>!r.paid&&!r.cancelled)
    .map(r=>({r,amt:Math.max(0,receiptTotals(r).net-paidAmtOf(r)),due:r.pay.due||r.date,over:daysBetween(r.pay.due||r.date,today)}))
    .sort((a,b)=>b.over-a.over);
  const rg=periodRange('#arPeriod','#arFrom','#arTo');
  const arRows=allRows.filter(x=>(!rg.from||x.r.date>=rg.from)&&(!rg.to||x.r.date<=rg.to));
  const per=10, pages=Math.max(1,Math.ceil(arRows.length/per));
  if(AR_PAGE>pages) AR_PAGE=pages; if(AR_PAGE<1) AR_PAGE=1;
  const slice=arRows.slice((AR_PAGE-1)*per,AR_PAGE*per);
  $('#arCount').textContent=(rg.label==='ทั้งหมด'?'':rg.label+' · ')+arRows.length+' บิล · หน้า '+AR_PAGE+'/'+pages;
  $('#arTbl tbody').innerHTML=slice.map(x=>`<tr>
    <td class="mono" style="font-size:12px"><a href="#" onclick="openBill('receipt','${x.r.id}');return false">${esc(x.r.no)}</a></td>
    <td>${esc(custName(findCust(x.r.custId))||'-')}</td><td class="ctr">${thDate(x.due)}</td>
    <td class="ctr">${x.over>0?`<button class="stbtn st-red" onclick="openReceiptById('${x.r.id}')">เกินกำหนด ${x.over} วัน</button>`
      :`<button class="stbtn st-orange" onclick="openReceiptById('${x.r.id}')">รอรับชำระ</button>`}</td>
    <td class="num">${money(x.amt)}</td>
    <td class="ctr">${can('doc.payRec')?`<button class="btn sm gh" onclick="openPartPay('ar','${x.r.custId}','${x.r.id}')">รับชำระ</button>`:'<span class="hint">-</span>'}</td></tr>`).join('');
  $('#arEmpty').style.display=arRows.length?'none':'block';
  $('#arEmpty').textContent=allRows.length&&!arRows.length?'ไม่มีลูกหนี้ค้างชำระในช่วงเวลาที่เลือก':'ไม่มียอดลูกหนี้ค้างชำระ';
  $('#arPager').innerHTML=pagerHtml(AR_PAGE,pages,'arGoPage');
  return allRows;
}
function arGoPage(p){ AR_PAGE=p; renderArTable(); }
/* ปุ่มเปลี่ยนหน้าใต้แผงหน้า 00 — ใช้ pageNums() ตัวเดียวกับทะเบียนอื่นทั้งระบบ */
function pagerHtml(page,pages,fn){
  if(pages<=1) return '';
  return '<span class="pgbar">'
    +`<button onclick="${fn}(${page-1})" ${page<=1?'disabled':''} title="หน้าก่อนหน้า">‹</button>`
    +pageNums(page,pages).map(x=>x==='...'
      ? '<span class="gap">…</span>'
      : `<button class="${x===page?'on':''}" onclick="${fn}(${x})">${x}</button>`).join('')
    +`<button onclick="${fn}(${page+1})" ${page>=pages?'disabled':''} title="หน้าถัดไป">›</button>`
    +'</span>';
}
function renderHome(){
  /* v23: HQ เข้าระบบ -> หน้าแรกแสดงภาพรวมทุกสาขาแทนข้อมูลอู่เดี่ยว */
  try{ if(typeof renderHqHome==='function') renderHqHome(); }catch(e){}
  const today=iso();
  if(!$('#finMonth').value) $('#finMonth').value=today.slice(0,7);
  const mo=$('#finMonth').value;
  $('#today').textContent=thLong(); $('#todayEn').textContent='ข้อมูลอัปเดต ณ เวลาเปิดโปรแกรม'; renderLicense();
  $('#dayTag').textContent=thLong();
  const moLabel=TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543);
  $('#buyMonth').textContent=moLabel; $('#taxTag').textContent='งวด '+moLabel;

  /* ===== ส่วนที่ 1 · CRM ===== */
  const crm=DB.crm.filter(k=>!k.done), due=crm.filter(k=>daysBetween(today,k.date)<=7);
  const late=crm.filter(k=>daysBetween(k.date,today)>0);
  $('#hCrmDue').textContent=due.length; $('#hCrmLate').textContent=late.length;
  const billedCust=new Set(DB.receipts.filter(r=>!r.cancelled).map(r=>r.custId));
  $('#hCrmCust').textContent=billedCust.size;
  $('#hCrmVeh').textContent=DB.cust.filter(c=>billedCust.has(c.id)).reduce((a,c)=>a+(c.vehicles||[]).length,0);
  $('#hCrmWarr').textContent=crm.filter(k=>k.type==='warranty').length;
  $('#hCrmProspect').textContent=crm.filter(k=>k.type==='prospect').length;
  const dueSorted=due.sort((a,b)=>a.date.localeCompare(b.date));
  $('#crmHomeTag').textContent=dueSorted.length+' ราย';
  $('#crmHomeTbl tbody').innerHTML=dueSorted.slice(0,8).map(k=>crmRowHtml(k,true)).join('');
  $('#crmHomeEmpty').style.display=dueSorted.length?'none':'block';
  const bd=$('#bdgCrm'); bd.style.display=due.length?'inline':'none'; bd.textContent=due.length;

  renderBrandChart();
  renderCatChart();
  if($('#chartBrand2')) chartBars('#chartBrand2',brandStats(),v=>v+' คัน');
  if($('#chartCat2')) chartBars('#chartCat2',catSalesStats(),v=>money(v)+' บาท');

  /* ===== ส่วนที่ 2 · บัญชีและการเงิน ===== */
  const rm=DB.receipts.filter(r=>ym(r.date)===mo&&!r.cancelled&&(rOvPane!=='retail'||r.salesChannel==='retail'));
  const rev=rm.reduce((a,r)=>a+receiptTotals(r).gross,0), net=rm.reduce((a,r)=>a+receiptTotals(r).net,0);
  $('#hRev').textContent=money0(rev); $('#hRevNet').textContent=money0(net); $('#hRevCnt').textContent=rm.length;

  const pend=pendingJobs(), pendAmt=pend.reduce((a,q)=>a+quoteTotals(q).total,0);
  $('#hPend').textContent=pend.length; $('#hPendAmt').textContent=money0(pendAmt);
  $('#pendCount').textContent=pend.length+' คัน';
  $('#pendTbl tbody').innerHTML=pend.map(q=>{
    const c=findCust(q.custId), v=c&&(c.vehicles||[])[q.vehIdx], d=daysBetween(q.jobIn||q.date,today);
    return `<tr class="click" onclick="openBill('quote','${q.id}')"><td class="mono"><b>${esc(plateOf(v))}</b></td>
      <td>${esc(custName(c)||'-')}</td><td class="ctr">${thDate(q.jobIn||q.date)}</td>
      <td class="ctr">${d>7?`<span class="chip r">${d}</span>`:`<span class="chip">${d}</span>`}</td>
      <td class="num">${money(quoteTotals(q).total)}</td>
      <td class="ctr mono" style="font-size:11.5px">${esc(q.no||'-')}</td></tr>`}).join('');
  $('#pendEmpty').style.display=pend.length?'none':'block';

  const arRows=renderArTable();
  const arTot=arRows.reduce((a,x)=>a+x.amt,0), arOver=arRows.filter(x=>x.over>0).reduce((a,x)=>a+x.amt,0);
  $('#hAr').textContent=money0(arTot+pendAmt); $('#hArOver').textContent=money0(arOver);

  const apRows=DB.purchases.filter(p=>!p.paid&&!p.cancelled);
  const apTot=apRows.reduce((a,p)=>a+grTotals(p).total,0);
  const apOver=apRows.filter(p=>daysBetween(p.due||p.date,today)>0).reduce((a,p)=>a+grTotals(p).total,0);
  $('#hAp').textContent=money0(apTot); $('#hApOver').textContent=money0(apOver);

  const invCost=DB.stock.reduce((a,it)=>a+(typeof pkgFifoValue==='function'?pkgFifoValue(it):n(it.qty)*n(it.cost)),0);
  const invSale=DB.stock.reduce((a,it)=>a+n(it.qty)*priceByTier(it,'B'),0);
  $('#hInv').textContent=money0(invCost); $('#hInvItems').textContent=DB.stock.length;
  $('#hInv2').textContent=money0(invCost); $('#hInvSale').textContent=money0(invSale);

  const overdue=arRows.filter(x=>x.over>0);
  /* กล่องเตือนแบบยุบได้ — เดิมโชว์รายชื่อ 5 บรรทัดตลอดเวลา กินความสูง 228px ดันเนื้อหาหน้าแรกลงไปเกือบเต็มจอ
     ตอนนี้เหลือบรรทัดเดียว กดสามเหลี่ยมเพื่อกางดูรายชื่อ และมีปุ่มลิงก์ไปหน้ารายงานลูกหนี้เต็ม */
  $('#overdueAlert').innerHTML=overdue.length
    ? `<div class="card red"><div class="k">⚠ ลูกหนี้เกินกำหนดชำระ</div>
       <div class="v" style="color:var(--danger)">${overdue.length}<span style="font-size:13px;font-weight:500"> ราย</span></div>
       <div class="s">รวมค้าง <b>${money(overdue.reduce((a,x)=>a+x.amt,0))}</b> บาท · นานสุด ${Math.max(...overdue.map(x=>x.over))} วัน</div>
       <button class="btn sm dgr cbtn" onclick="openArReport()">ดูรายงานลูกหนี้</button></div>`
    : `<div class="card green"><div class="k">⚠ ลูกหนี้เกินกำหนดชำระ</div>
       <div class="v">0</div><div class="s">✓ ไม่มีลูกหนี้เกินกำหนด</div></div>`;
  const bh=$('#bdgHome'); bh.style.display=overdue.length?'inline':'none'; bh.textContent=overdue.length;
  renderApvAlert();

  const pm=DB.purchases.filter(p=>ym(p.date)===mo&&!p.cancelled);
  let paid=0,notdue=0,overdueBuy=0;
  pm.forEach(p=>{const t=grTotals(p).total; if(p.paid) paid+=t; else if(daysBetween(p.due||p.date,today)>0) overdueBuy+=t; else notdue+=t});
  $('#buyTbl tbody').innerHTML=pm.map(p=>{const t=grTotals(p).total, v=findVen(p.vendorId), lateP=!p.paid&&daysBetween(p.due||p.date,today)>0;
    return `<tr class="click" onclick="openBill('gr','${p.id}')"><td class="mono" style="font-size:12px">${esc(p.no)}</td>
      <td>${esc((v&&v.name)||'-')}</td><td class="ctr">${p.term==='credit'?thDate(p.due):'ชำระทันที'}</td><td class="ctr">${lateP?'<span class="chip r">เกินกำหนด</span>':'—'}</td>
      <td class="num">${p.paid?money(t):'-'}</td><td class="num">${p.paid?'-':money(t)}</td></tr>`}).join('');
  $('#buyEmpty').style.display=pm.length?'none':'block';

  /* ภาษี */
  const vatSale=rm.reduce((a,r)=>a+receiptTotals(r).vat,0), saleBase=rm.reduce((a,r)=>a+receiptTotals(r).base,0);
  const vatBuy=pm.reduce((a,p)=>a+grTotals(p).vat,0), buyBase=pm.reduce((a,p)=>a+grTotals(p).base,0);
  const wht=rm.reduce((a,r)=>a+receiptTotals(r).whtAmt,0);
  const sso=ssoSummaryOf(mo), vatPay=vatSale-vatBuy;
  /* กิจการที่ไม่ได้จดทะเบียน VAT ไม่มีหน้าที่ยื่น ภ.พ.30 — ตัดบรรทัด VAT ทั้งชุดทิ้ง
     ไม่งั้นผู้ใช้เห็นยอด "ต้องนำส่ง" แล้วเข้าใจผิดว่าต้องไปยื่นสรรพากร */
  $('#taxTbl tbody').innerHTML=(isVatReg()?`
    <tr><td>ยอดขาย / รายได้ก่อน VAT</td><td class="num">${money(saleBase)}</td></tr>
    <tr><td>ภาษีขาย (VAT จากใบกำกับภาษีที่ออก)</td><td class="num">${money(vatSale)}</td></tr>
    <tr><td>ยอดซื้อก่อน VAT</td><td class="num">${money(buyBase)}</td></tr>
    <tr><td>ภาษีซื้อ (VAT จากใบกำกับภาษีผู้ขาย)</td><td class="num">${money(vatBuy)}</td></tr>
    <tr style="background:#f6f8f9"><td><b>${vatPay>=0?'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30)':'เครดิตภาษียกไปงวดถัดไป'}</b></td>
      <td class="num"><b>${money(Math.abs(vatPay))}</b></td></tr>`:`
    <tr><td>ยอดขาย / รายได้ทั้งงวด</td><td class="num">${money(saleBase+vatSale)}</td></tr>
    <tr><td>ยอดซื้อทั้งงวด</td><td class="num">${money(buyBase+vatBuy)}</td></tr>
    <tr><td colspan="2" class="hint" style="padding-top:7px;padding-bottom:7px">
      กิจการไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม — <b>ไม่มีหน้าที่ยื่น ภ.พ.30</b>
      และขอคืนภาษีซื้อไม่ได้ (ภาษีซื้อที่จ่ายให้ผู้ขายถือเป็นต้นทุน)</td></tr>`)+`
    <tr><td>ภาษีหัก ณ ที่จ่ายที่ถูกลูกค้าหักไว้ (เครดิตภาษี)</td><td class="num">${money(wht)}</td></tr>
    <tr><td>เงินสมทบประกันสังคมที่ต้องนำส่ง (ลูกจ้าง + นายจ้าง)</td><td class="num">${money(sso.total)}</td></tr>`;

  /* ประกันสังคม / เงินเดือน */
  $('#ssoTag').textContent=empActiveList().length+' คน';
  $('#ssoTbl tbody').innerHTML=empActiveList().length?empActiveList().map(e=>{const x=ssoOf(e);
    return `<tr><td>${esc(e.code)} · ${esc(e.name)}</td><td class="num">${money(x.gross)}</td>
      <td class="num">${money(x.emp)}</td><td class="num">${money(x.er)}</td><td class="num">${money(x.emp+x.er)}</td></tr>`}).join('')
    +`<tr style="background:#f6f8f9"><td><b>รวมนำส่งสำนักงานประกันสังคม</b></td><td class="num"><b>${money(sso.gross)}</b></td>
      <td class="num"><b>${money(sso.emp)}</b></td><td class="num"><b>${money(sso.er)}</b></td><td class="num"><b>${money(sso.total)}</b></td></tr>`
    :'<tr><td class="empty" colspan="5">ยังไม่มีข้อมูลพนักงาน — เพิ่มที่เมนูพนักงาน</td></tr>';
  if(DB.emp.length&&!$('#ssoTbl thead')){
    $('#ssoTbl').insertAdjacentHTML('afterbegin','<thead><tr><th>พนักงาน</th><th class="num">รายได้รวม</th><th class="num">ลูกจ้าง 5%</th><th class="num">นายจ้าง 5%</th><th class="num">รวมนำส่ง</th></tr></thead>');
  }

  /* กราฟรายได้ 6 เดือน */
  const yNow=+iso().slice(0,4), mNow=+iso().slice(5,7);
  const sumMo=(y,m)=>{const k=y+'-'+String(m).padStart(2,'0');
    return DB.receipts.filter(r=>ym(r.date)===k&&!r.cancelled).reduce((a,r)=>a+receiptTotals(r).gross,0)};
  const curY=[],prevY=[]; for(let m=1;m<=12;m++){curY.push(sumMo(yNow,m)); prevY.push(sumMo(yNow-1,m));}
  REV_CMP={cur:curY,prev:prevY,mx:Math.max(1,...curY,...prevY),mNow,yNow};
  $('#revCmpTag').textContent='ปี '+(yNow+543);
  const mxBar=Math.max(1,...curY);   /* แท่งใช้สเกลของปีนี้เอง ให้แท่งเต็มพื้นที่สวยงาม */
  $('#revBars').innerHTML=curY.map((v,i)=>{
    const d1=prevY[i]?((v-prevY[i])/prevY[i]*100):0;
    const tip=TH_M[i]+' — ปีนี้ '+money(v)+' · ปีที่แล้ว '+money(prevY[i])
      +(prevY[i]&&i<mNow?(' ('+(d1>=0?'▲ +':'▼ ')+d1.toFixed(1)+'%)'):'');
    return `<div class="b ${i%2?'bdk':'blt'}" title="${tip}">
    <em>${v?money0(v):''}</em><i style="height:${Math.round(v/mxBar*82)}%"></i>
    <span>${TH_M[i]}</span></div>`}).join('');
  renderRevLineChart();

  /* ===== ส่วนที่ 3 · สินค้าคงคลัง ===== */
  const rows=catSummary(), tot=rows.reduce((a,r)=>({items:a.items+r.items,qty:a.qty+r.qty,cost:a.cost+r.cost,
    min:a.min+r.min,max:a.max+r.max,stale:a.stale+r.stale}),{items:0,qty:0,cost:0,min:0,max:0,stale:0});
  const mxc=Math.max(1,...rows.map(r=>r.cost));
  $('#homeSumTag').textContent=rows.filter(r=>r.items).length+' หมวดที่มีสินค้า';
  $('#homeCatTbl tbody').innerHTML=rows.filter(r=>r.items).map(r=>`<tr class="click" onclick="setCat('${r.cat}',true);go('stock')">
    <td><b>${esc(r.cat)}</b></td><td class="num">${r.items}</td><td class="num">${qf(r.qty)}</td>
    <td class="num">${money(r.cost)}</td>
    <td><div class="mbar"><i style="width:${Math.round(r.cost/mxc*100)}%"></i></div>
      <div class="hint mono" style="margin-top:2px">${tot.cost?(r.cost/tot.cost*100).toFixed(1):'0.0'}%</div></td>
    <td class="ctr">${r.min?`<span class="chip a">Min ${r.min}</span> `:''}${r.max?`<span class="chip r">Max ${r.max}</span> `:''}${r.stale?`<span class="chip" style="background:var(--c-stale)">ค้าง ${r.stale}</span>`:''}${(!r.min&&!r.max&&!r.stale)?'<span class="hint">ปกติ</span>':''}</td></tr>`).join('');
  $('#homeCatTbl tfoot').innerHTML=`<tr><td>รวมทุกหมวด</td><td class="num">${tot.items}</td><td class="num">${qf(tot.qty)}</td>
    <td class="num">${money(tot.cost)}</td><td class="hint">มูลค่าต้นทุนรวมทั้งคลัง</td>
    <td class="ctr">${tot.min+tot.max+tot.stale} รายการที่ต้องดู</td></tr>`;

  const fl=DB.stock.map(it=>({it,f:flags(it)}));
  const mm=fl.filter(x=>x.f.min||x.f.max), dead=fl.filter(x=>x.f.stale);
  $('#hMin').textContent=fl.filter(x=>x.f.min).length; $('#hMax').textContent=fl.filter(x=>x.f.max).length;
  $('#hDead').textContent=dead.length;
  $('#hDeadAmt').textContent=money0(dead.reduce((a,x)=>a+(typeof pkgFifoValue==='function'?pkgFifoValue(x.it):n(x.it.qty)*n(x.it.cost)),0));
  renderMmTable();
  $('#deadTag').textContent=dead.length+' รายการ';
  $('#deadTbl tbody').innerHTML=dead.map(x=>`<tr class="click" onclick="openCard('${x.it.id}')">
    <td class="mono">${esc(x.it.code)}</td><td>${esc(x.it.name)}</td><td><span class="chip">${esc(x.it.cat||'-')}</span></td>
    <td class="ctr">${thDate(x.it.lastMove)}</td><td class="num">${money((typeof pkgFifoValue==='function'?pkgFifoValue(x.it):n(x.it.qty)*n(x.it.cost)))}</td></tr>`).join('');
  $('#deadEmpty').style.display=dead.length?'none':'block';

  /* รายการวันนี้ */
  const day=[];
  DB.quotes.filter(q=>q.date===today).forEach(q=>{const c=findCust(q.custId);
    day.push({t:'ใบเสนอราคา',cls:'b',no:q.no,d:custName(c)+' · '+plateOf(c&&(c.vehicles||[])[q.vehIdx]),amt:quoteTotals(q).total,k:'quote',id:q.id})});
  DB.receipts.filter(r=>r.date===today&&!r.cancelled&&(rOvPane!=='retail'||r.salesChannel==='retail')).forEach(r=>day.push({t:'ใบเสร็จรับเงิน',cls:'g',no:r.no,
    d:custName(findCust(r.custId))+(r.taxNo?' · ใบกำกับภาษี '+r.taxNo:''),amt:receiptTotals(r).net,k:'receipt',id:r.id}));
  DB.purchases.filter(p=>p.date===today&&!p.cancelled).forEach(p=>day.push({t:'รับสินค้าเข้า',cls:'a',no:p.no,
    d:'ผู้ขาย '+((findVen(p.vendorId)||{}).name||'-')+' · '+(p.items||[]).length+' รายการ',amt:grTotals(p).total,k:'gr',id:p.id}));
  $('#dayTbl tbody').innerHTML=day.map(r=>`<tr><td class="ctr"><span class="chip ${r.cls}">${r.t}</span></td>
    <td class="mono" style="font-size:12px">${esc(r.no||'-')}</td><td>${esc(r.d)}</td>
    <td class="num">${money(r.amt)}</td>
    <td class="ctr"><button class="btn sm gh" onclick="openBill('${r.k}','${r.id}')">เปิด</button></td></tr>`).join('');
  $('#dayEmpty').style.display=day.length?'none':'block';

  /* สรุปการเคลมสินค้าประจำเดือน */
  const clm=DB.claims.filter(c=>ym(c.date)===mo);
  $('#clHomeTag').textContent=clm.length+' ใบ';
  $('#hClCount').textContent=clm.length;
  $('#hClQty').textContent=clm.reduce((a,c)=>a+clItemsClean(c).reduce((s,x)=>s+n(x.qty),0),0);
  $('#hClOpen').textContent=clm.filter(c=>c.status==='open').length;
  $('#hClSent').textContent=clm.filter(c=>c.status==='sent').length;
  $('#hClBack').textContent=clm.filter(c=>c.status==='back').length;
}
/* จานสีสำหรับกราฟแท่งแนวนอน — อันดับหนึ่งใช้สีเหลืองอำพันเสมอ ที่เหลือไล่สีให้ต่างกันทุกแท่ง */
const HBAR_PAL=['#1f5c8c','#2e8b57','#b0533a','#6a5acd','#0e8a8a','#c2803a','#7a4f9e','#3a6ea5','#8a8f3c','#a0526e','#4f7f52','#5b6873'];
function chartBars(sel,data,fmt,opts){
  opts=opts||{};
  const el=$(sel); if(!el) return;
  if(!data.length){el.innerHTML='<div class="empty">ยังไม่มีข้อมูลเพียงพอสำหรับสรุป</div>';return}
  const mx=opts.mx||Math.max(...data.map(d=>d.value))||1;
  const total=opts.total!=null?opts.total:data.reduce((a,d)=>a+d.value,0);
  const si=opts.startIndex||0;
  el.innerHTML=data.map((d,i)=>{
    const gi=si+i;
    const col=gi===0?'var(--amber)':HBAR_PAL[(gi-1)%HBAR_PAL.length];
    const w=Math.max(2,Math.round(d.value/mx*100));
    const pct=total?d.value/total*100:0;
    const inb=w>=16;      /* แถบสั้นมาก วาง % นอกแถบแทน */
    const pos=inb?`left:calc(${w}% - 5px);transform:translate(-100%,-50%)`:`left:calc(${w}% + 5px);transform:translateY(-50%)`;
    return `<div class="hbar"><span class="lb" title="${esc(d.label)}">${esc(d.label)}</span>
    <span class="tr"><i style="width:${w}%;background:${col}"></i><span class="pctlb ${inb?'in':'out'}" style="${pos}">${pct.toFixed(1)}%</span></span>
    <span class="vl">${fmt(d.value)}</span></div>`}).join('');
}
/* กราฟเปรียบเทียบสองช่วงเวลา: แถบบน=ช่วง A (สีตามอันดับ) แถบล่าง=ช่วง B (เทา) */
function chartBarsCompare(sel,rows,opts){
  const el=$(sel); if(!el) return;
  const {mx,ta,tb,la,lb,fmt,startIndex}=opts;
  if(!rows.length){el.innerHTML='<div class="empty">ยังไม่มีข้อมูลเพียงพอสำหรับสรุป</div>';return}
  const si=startIndex||0;
  const legend=`<div class="cmplegend"><span><i style="background:var(--amber)"></i>${esc(la)}</span><span><i style="background:#a9b3bb"></i>${esc(lb)} (เทา)</span></div>`;
  el.innerHTML=legend+rows.map((d,i)=>{
    const gi=si+i;
    const col=gi===0?'var(--amber)':HBAR_PAL[(gi-1)%HBAR_PAL.length];
    const wa=Math.max(2,Math.round(d.a/mx*100)), wb=Math.max(2,Math.round(d.b/mx*100));
    const pa=ta?d.a/ta*100:0, pb=tb?d.b/tb*100:0;
    const posa=wa>=16?`left:calc(${wa}% - 5px);transform:translate(-100%,-50%)`:`left:calc(${wa}% + 5px);transform:translateY(-50%)`;
    const posb=wb>=16?`left:calc(${wb}% - 5px);transform:translate(-100%,-50%)`:`left:calc(${wb}% + 5px);transform:translateY(-50%)`;
    let chg,cls;
    if(!d.b&&!d.a){chg='—';cls='fl';}
    else if(!d.b){chg='ใหม่';cls='up';}
    else{const p=(d.a-d.b)/d.b*100;
      chg=(p>0?'▲ +':p<0?'▼ ':'')+p.toFixed(1)+'%';
      cls=p>0.05?'up':p<-0.05?'dn':'fl';}
    return `<div class="hbarc"><span class="lb" title="${esc(d.label)}">${esc(d.label)}</span>
    <span class="trs">
      <span class="tr"><i style="width:${wa}%;background:${col}"></i><span class="pctlb ${wa>=16?'in':'out'}" style="${posa}">${pa.toFixed(1)}%</span></span>
      <span class="tr"><i style="width:${wb}%;background:#a9b3bb"></i><span class="pctlb ${wb>=16?'in':'out'}" style="${posb}">${pb.toFixed(1)}%</span></span>
    </span>
    <span class="vlc"><b>${fmt(d.a)}</b><small>${fmt(d.b)}</small><em class="chg ${cls}">${chg}</em></span></div>`}).join('');
}
/* รวมข้อมูลสองช่วงเป็นแถวเปรียบเทียบ */
function mergeCompareRows(da,db){
  const m={};
  da.forEach(d=>m[d.label]={label:d.label,a:d.value,b:0});
  db.forEach(d=>{(m[d.label]=m[d.label]||{label:d.label,a:0,b:0}).b=d.value});
  return Object.values(m).sort((x,y)=>y.a-x.a||y.b-x.b);
}
/* ซ่อน/แสดงตัวควบคุมช่วงเวลาของกราฟ (ใช้ร่วม cat / br) */
function syncRangeUI(px){
  const P=id=>$('#'+px+id);
  const cmp=P('Mode').value==='compare';
  P('Month').style.display=P('Period').value==='pickMonth'?'':'none';
  P('CustomWrap').style.display=P('Period').value==='custom'?'':'none';
  P('CmpWrap').style.display=cmp?'':'none';
  P('Month2').style.display=cmp&&P('Period2').value==='pickMonth'?'':'none';
  P('CustomWrap2').style.display=cmp&&P('Period2').value==='custom'?'':'none';
  P('CtrlRow').style.display=(cmp||P('Period').value==='custom'||P('Period').value==='pickMonth')?'flex':'none';
}
function brandStats(from,to){
  const m={};
  DB.quotes.forEach(q=>{
    if(q.cancelled) return;
    if(from&&q.date<from) return;
    if(to&&q.date>to) return;
    const c=findCust(q.custId), v=c&&(c.vehicles||[])[q.vehIdx];
    if(!v||!v.brand) return; const b=String(v.brand).replace(/\s*\(.*/,''); m[b]=(m[b]||0)+1});
  return Object.entries(m).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
}
function catSalesStats(from,to){
  const m={};
  DB.receipts.forEach(r=>{
    if(r.cancelled) return;
    if(from&&r.date<from) return;
    if(to&&r.date>to) return;
    (r.items||[]).forEach(it=>{
      if(it.type==='kit'){ pkgKitSplit(it).forEach(([k,v])=>m[k]=(m[k]||0)+v); return; }
      let key='ค่าแรง / บริการ';
      if(it.type!=='labor'){ const s=DB.stock.find(x=>x.id===it.stockId)||DB.stock.find(x=>x.code===it.code);
        key=(s&&s.cat)||'อื่น ๆ'; }
      m[key]=(m[key]||0)+n(it.qty)*n(it.price)});
  });
  return Object.entries(m).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
}
/* ช่วงเวลาแบบใช้ซ้ำได้: เดือนนี้ / เดือนที่แล้ว / ปีนี้ / ปีที่แล้ว / ทั้งหมด / กำหนดเอง */
function periodRange(pSel,fromSel,toSel,monthSel){
  const t=iso(), y=+t.slice(0,4), mo=t.slice(0,7);
  const p=$(pSel)?$(pSel).value:'month';
  if(p==='pickMonth'&&monthSel){
    let m=$(monthSel).value; if(!m){m=mo;$(monthSel).value=m;}
    const end=iso(new Date(+m.slice(0,4),+m.slice(5,7),0));
    return {from:m+'-01',to:end,label:TH_M[+m.slice(5,7)-1]+' '+(+m.slice(0,4)+543)};
  }
  if(p==='month')     return {from:mo+'-01',to:t,label:TH_M[+mo.slice(5,7)-1]+' '+(y+543)};
  if(p==='lastMonth'){const d=new Date(y,+t.slice(5,7)-2,1);const lm=iso(d).slice(0,7);
    const end=iso(new Date(y,+t.slice(5,7)-1,0));
    return {from:lm+'-01',to:end,label:TH_M[d.getMonth()]+' '+(d.getFullYear()+543)};}
  if(p==='year')      return {from:y+'-01-01',to:t,label:'ปี '+(y+543)};
  if(p==='lastYear')  return {from:(y-1)+'-01-01',to:(y-1)+'-12-31',label:'ปี '+(y-1+543)};
  if(p==='custom'){
    let f=$(fromSel).value, e=$(toSel).value;
    if(!f){f=mo+'-01';$(fromSel).value=f;} if(!e){e=t;$(toSel).value=e;}
    if(f>e){const x=f;f=e;e=x;}
    return {from:f,to:e,label:thDate(f)+' – '+thDate(e)};}
  return {from:'',to:'',label:'ทั้งหมด'};
}
function catRange(){ return periodRange('#catPeriod','#catFrom','#catTo','#catMonth'); }
let CAT_PAGE=1;
function catGoPage(p){ CAT_PAGE=p; renderCatChart(); }
function renderCatChart(){
  syncRangeUI('cat');
  const A=periodRange('#catPeriod','#catFrom','#catTo','#catMonth');
  if($('#catMode').value==='compare'){
    /* โหมดเปรียบเทียบ แสดงครั้งละ 5 รายการ ให้แถบใหญ่อ่านชัด */
    const per=5;
    const B=periodRange('#catPeriod2','#catFrom2','#catTo2','#catMonth2');
    const rows=mergeCompareRows(catSalesStats(A.from,A.to),catSalesStats(B.from,B.to));
    const pages=Math.max(1,Math.ceil(rows.length/per));
    if(CAT_PAGE>pages)CAT_PAGE=pages; if(CAT_PAGE<1)CAT_PAGE=1;
    $('#catRangeTag').textContent=A.label+' เทียบ '+B.label+' · หน้า '+CAT_PAGE+'/'+pages;
    chartBarsCompare('#chartCat',rows.slice((CAT_PAGE-1)*per,CAT_PAGE*per),{
      mx:Math.max(1,...rows.map(r=>Math.max(r.a,r.b))),
      ta:rows.reduce((x,r)=>x+r.a,0),tb:rows.reduce((x,r)=>x+r.b,0),
      la:A.label,lb:B.label,fmt:v=>money(v)+' บาท',startIndex:(CAT_PAGE-1)*per});
    $('#catPager').innerHTML=pagerHtml(CAT_PAGE,pages,'catGoPage');
  }else{
    $('#catRangeTag').textContent=A.label;
    const data=catSalesStats(A.from,A.to);
    chartBars('#chartCat',data,v=>money(v)+' บาท');
    $('#catPager').innerHTML='';
  }
}
/* ---------- กราฟยี่ห้อรถที่เข้าซ่อม: เลือกช่วง เปรียบเทียบ และแบ่งหน้า 10 บรรทัด ---------- */
let BR_PAGE=1;
function brGoPage(p){ BR_PAGE=p; renderBrandChart(); }
function renderBrandChart(){
  if(!$('#brPeriod')) return;
  syncRangeUI('br');
  const per=10;
  const A=periodRange('#brPeriod','#brFrom','#brTo','#brMonth');
  if($('#brMode').value==='compare'){
    const perC=5;   /* โหมดเปรียบเทียบ แสดงครั้งละ 5 รายการ */
    const B=periodRange('#brPeriod2','#brFrom2','#brTo2','#brMonth2');
    const rows=mergeCompareRows(brandStats(A.from,A.to),brandStats(B.from,B.to));
    const pages=Math.max(1,Math.ceil(rows.length/perC));
    if(BR_PAGE>pages)BR_PAGE=pages; if(BR_PAGE<1)BR_PAGE=1;
    $('#brRangeTag').textContent=A.label+' เทียบ '+B.label+' · '+rows.length+' ยี่ห้อ · หน้า '+BR_PAGE+'/'+pages;
    chartBarsCompare('#chartBrand',rows.slice((BR_PAGE-1)*perC,BR_PAGE*perC),{
      mx:Math.max(1,...rows.map(r=>Math.max(r.a,r.b))),
      ta:rows.reduce((x,r)=>x+r.a,0),tb:rows.reduce((x,r)=>x+r.b,0),
      la:A.label,lb:B.label,fmt:v=>v+' คัน',startIndex:(BR_PAGE-1)*perC});
    $('#brPager').innerHTML=pagerHtml(BR_PAGE,pages,'brGoPage');
  }else{
    const rows=brandStats(A.from,A.to);
    const pages=Math.max(1,Math.ceil(rows.length/per));
    if(BR_PAGE>pages)BR_PAGE=pages; if(BR_PAGE<1)BR_PAGE=1;
    $('#brRangeTag').textContent=(A.label==='ทั้งหมด'?'':A.label+' · ')+rows.length+' ยี่ห้อ · หน้า '+BR_PAGE+'/'+pages;
    chartBars('#chartBrand',rows.slice((BR_PAGE-1)*per,BR_PAGE*per),v=>v+' คัน',{
      mx:Math.max(1,...rows.map(r=>r.value)),
      total:rows.reduce((x,r)=>x+r.value,0),
      startIndex:(BR_PAGE-1)*per});
    $('#brPager').innerHTML=pagerHtml(BR_PAGE,pages,'brGoPage');
  }
}
async function markPaid(id){ if(!can('doc.payRec')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');
  const r=DB.receipts.find(x=>x.id===id); if(!r) return;
  const rem=Math.max(0,receiptTotals(r).net-paidAmtOf(r));
  if(!await askP({title:'รับชำระเงิน',text:'บันทึกรับชำระเงินบิล '+r.no+' ยอดคงค้าง '+money(rem)+' บาท?',yes:'บันทึกรับชำระ',no:'ยังไม่บันทึก'})) return;
  r.paid=true; r.paidDate=iso(); logAudit('receipt',r,'pay','รับชำระ '+money(rem)+' บาท'); save(); renderHome(); toast('บันทึกรับชำระ '+r.no+' แล้ว'); }

function openBill(kind,id){
  let h='';
  if(kind==='quote'){ const q=findQuote(id), c=findCust(q.custId), v=c&&(c.vehicles||[])[q.vehIdx], t=quoteTotals(q);
    const rec=DB.receipts.find(r=>r.quoteId===q.id);
    $('#mBillTitle').textContent='ใบเสนอราคา / อนุมัติซ่อม '+q.no;
    h=`<div class="grid g4">
      <div><span class="hint">ลูกค้า</span><div><b>${esc(custName(c)||'-')}</b></div><div class="hint">${esc((c&&c.tel)||'')}</div></div>
      <div><span class="hint">ทะเบียนรถ</span><div class="mono"><b>${esc(plateOf(v))}</b></div><div class="hint">${esc((v&&v.brand)||'')} ${esc((v&&v.model)||'')}</div></div>
      <div><span class="hint">วันที่รับรถเข้า</span><div>${thDate(q.jobIn||q.date)}</div><div class="hint">ค้าง ${daysBetween(q.jobIn||q.date,iso())} วัน</div></div>
      <div><span class="hint">สถานะ</span><div>${esc(q.status)}</div><div class="hint">${rec?'ออกใบเสร็จแล้ว '+esc(rec.no):'ยังไม่ได้เปิดใบเสร็จ'}</div></div></div>
      <table class="tbl" style="margin-top:10px"><thead><tr><th>รายการ</th><th class="num">จำนวน</th><th class="num">ราคา/หน่วย</th><th class="num">จำนวนเงิน</th></tr></thead>
      <tbody>${qItemsClean(q).map(it=>`<tr><td>${esc(it.name)}</td><td class="num">${qf(it.qty)}</td><td class="num">${money(it.price)}</td><td class="num">${money(n(it.qty)*n(it.price))}</td></tr>`).join('')}
      <tr><td colspan="3" class="num"><b>ยอดรวมสุทธิ</b></td><td class="num"><b>${money(t.total)}</b></td></tr></tbody></table>
      <div class="row" style="margin-top:12px"><button class="btn" onclick="closeModal('mBill');openQuoteById('${q.id}')">เปิดในหน้าใบเสนอราคา</button>
      <button class="btn gh" onclick="closeModal('mBill');openAudit('quote','${q.id}')">ตรวจสอบเอกสาร</button>
      ${rec?'':`<button class="btn pri" onclick="closeModal('mBill');billFromQuote('${q.id}')">เปิดใบเสร็จรับเงินจากบิลนี้</button>`}</div>`;
  }
  if(kind==='receipt'){ const r=DB.receipts.find(x=>x.id===id), c=findCust(r.custId), t=receiptTotals(r);
    $('#mBillTitle').textContent='ใบเสร็จรับเงิน '+r.no;
    h=`<div class="grid g4">
      <div><span class="hint">ลูกค้า</span><div><b>${esc(custName(c)||'-')}</b></div></div>
      <div><span class="hint">อ้างอิงใบเสนอราคา</span><div class="mono">${esc(r.ref||'-')}</div></div>
      <div><span class="hint">ใบกำกับภาษี</span><div class="mono">${esc(r.taxNo||'ไม่ได้ออก')}</div></div>
      <div><span class="hint">สถานะ</span><div>${r.paid?'<span class="chip g">ชำระแล้ว</span>':'<span class="chip r">ค้างชำระ · ครบกำหนด '+thDate(r.pay.due||r.date)+'</span>'}</div></div></div>
      <table class="tbl" style="margin-top:10px"><thead><tr><th>รายการ</th><th class="num">จำนวน</th><th class="num">จำนวนเงิน</th><th class="ctr">รับประกัน</th></tr></thead>
      <tbody>${rItemsClean(r).map(it=>`<tr><td>${esc(it.name)}</td><td class="num">${qf(it.qty)}</td><td class="num">${money(n(it.qty)*n(it.price))}</td><td class="ctr">${it.warr?n(it.warr)+' เดือน':'-'}</td></tr>`).join('')}
      <tr><td colspan="2" class="num">รวมทั้งสิ้น</td><td class="num">${money(t.gross)}</td><td></td></tr>
      <tr><td colspan="2" class="num">หัก ณ ที่จ่าย</td><td class="num">${money(t.whtAmt)}</td><td></td></tr>
      <tr><td colspan="2" class="num"><b>รับชำระสุทธิ</b></td><td class="num"><b>${money(t.net)}</b></td><td></td></tr></tbody></table>
      <div class="row" style="margin-top:12px"><button class="btn" onclick="closeModal('mBill');openReceiptById('${r.id}')">เปิดในหน้าใบเสร็จ</button>
      <button class="btn gh" onclick="closeModal('mBill');openAudit('receipt','${r.id}')">ตรวจสอบเอกสาร</button>
      ${r.paid?'':`<button class="btn pri pc-payRec" onclick="closeModal('mBill');openPartPay('ar','${r.custId}','${r.id}')">บันทึกรับชำระ</button>`}</div>`;
  }
  if(kind==='gr'){ const p=DB.purchases.find(x=>x.id===id), v=findVen(p.vendorId), t=grTotals(p);
    $('#mBillTitle').textContent='ใบรับสินค้า '+p.no;
    h=`<div class="grid g4">
      <div><span class="hint">ผู้ขาย</span><div><b>${esc((v&&v.name)||'-')}</b></div><div class="hint">${esc((v&&v.tel)||'')}</div></div>
      <div><span class="hint">ใบกำกับผู้ขาย</span><div class="mono">${esc(p.inv||'-')}</div><div class="hint">${thDate(p.invDate)}</div></div>
      <div><span class="hint">เงื่อนไข</span><div>${p.term==='credit'?'เครดิต '+n(p.days)+' วัน · ครบกำหนด '+thDate(p.due):'เงินสด'}</div></div>
      <div><span class="hint">สถานะ</span><div>${p.paid?'<span class="chip g">ชำระแล้ว</span>':'<span class="chip a">ยังไม่ชำระ</span>'}</div>
        ${p.paid?`<div class="hint">${esc(payMethodText(p))}</div>`:''}</div></div>
      <table class="tbl" style="margin-top:10px"><thead><tr><th>รหัส</th><th>สินค้า</th><th class="num">จำนวน</th><th class="num">ทุน/หน่วย</th><th class="num">รวม</th></tr></thead>
      <tbody>${grItemsClean(p).map(it=>`<tr><td class="mono">${esc(it.code)}</td><td>${esc(it.name)}</td><td class="num">${qf(it.qty)}</td><td class="num">${money(it.cost)}</td><td class="num">${money(n(it.qty)*n(it.cost))}</td></tr>`).join('')}
      <tr><td colspan="4" class="num"><b>ยอดสุทธิ</b></td><td class="num"><b>${money(t.total)}</b></td></tr></tbody></table>
      <div class="row" style="margin-top:12px"><button class="btn gh" onclick="closeModal('mBill');openAudit('gr','${p.id}')">ตรวจสอบเอกสาร</button>
      ${p.paid?'':`<button class="btn pri pc-payGr" onclick="closeModal('mBill');openPartPay('ap','${p.vendorId}','${p.id}')">บันทึกชำระเงินผู้ขาย</button>`}</div>`;
  }
  $('#mBillBody').innerHTML=h; openModal('mBill');
}

/* ==========================================================
   สต๊อกอะไหล่
   ========================================================== */
let catFilter='';
function flags(it){ const st=n(it.stale)||n(DB.shop.stale)||6;
  return {min:n(it.min)>0&&n(it.qty)<=n(it.min), max:n(it.max)>0&&n(it.qty)>n(it.max), stale:monthsSince(it.lastMove)>=st}; }
function flagColors(f){ const c=[]; if(f.min)c.push('var(--c-min)'); if(f.max)c.push('var(--c-max)'); if(f.stale)c.push('var(--c-stale)');
  if(!c.length) return '';
  if(c.length===1) return 'background:'+c[0];
  if(c.length===2) return 'background:linear-gradient(135deg,'+c[0]+' 0 50%,'+c[1]+' 50% 100%)';
  return 'background:linear-gradient(135deg,'+c[0]+' 0 33%,'+c[1]+' 33% 66%,'+c[2]+' 66% 100%)'; }
function flagText(f,it){ const t=[]; if(f.min)t.push('ถึงจุดสั่งซื้อ'); if(f.max)t.push('เกินระดับสูงสุด');
  if(f.stale)t.push('ไม่เคลื่อนไหวเกิน '+(n(it&&it.stale)||DB.shop.stale||6)+' เดือน'); return t.join(' · '); }
function invTotals(list){
  const tier=($('#sumTier')&&$('#sumTier').value)||'B';
  return (list||[]).reduce((a,it)=>({items:a.items+1,qty:a.qty+n(it.qty),
    cost:a.cost+(typeof pkgFifoValue==='function'?pkgFifoValue(it):n(it.qty)*n(it.cost)),sale:a.sale+n(it.qty)*priceByTier(it,tier)}),{items:0,qty:0,cost:0,sale:0});
}
function updateInvSum(shown){
  const all=invTotals(DB.stock), cur=invTotals(shown);
  const filtered=shown&&shown.length!==DB.stock.length;
  const tier=($('#sumTier')&&$('#sumTier').value)||'B';
  $('#invSum').innerHTML=`
    <div class="k">มูลค่ารวมสินค้าคงคลัง (ราคาทุน)</div>
    <div class="v sc-cost">${money(all.cost)} <span>บาท</span></div>
    <div class="s">นับรวม <b>${qf(all.qty)}</b> ชิ้น · <b>${all.items}</b> รายการ
      <span class="sc-cost">· มูลค่าขายประเมิน (ราคา ${tier}) <b>${money(all.sale)}</b> บาท</span></div>
    ${filtered?`<div class="s fl">ที่กำลังแสดง <b>${cur.items}</b> รายการ · <b>${qf(cur.qty)}</b> ชิ้น
      <span class="sc-cost">· ทุน <b>${money(cur.cost)}</b> บาท</span></div>`:''}`;
}
function renderCatBar(){
  const counts={}; DB.stock.forEach(s=>{const c=s.cat||'อื่น ๆ'; counts[c]=(counts[c]||0)+1});
  const el=$('#catBar'); if(!el) return;
  el.innerHTML=`<option value="">ทุกหมวด (${DB.stock.length} รายการ)</option>`
    +CATS.map(c=>`<option value="${esc(c)}">${esc(c)} (${counts[c]||0} รายการ)</option>`).join('');
  el.value=catFilter;
}
/* scroll=true เฉพาะตอนกระโดดมาจากหน้าอื่น — กดเลือกหมวดในหน้านี้ต้องไม่ดีดจอขึ้นบน */
function setCat(c,scroll){catFilter=c;renderStock();if(scroll)window.scrollTo(0,0)}
function catSummary(){
  const tier=($('#sumTier')&&$('#sumTier').value)||'B', map={};
  CATS.forEach(c=>map[c]={cat:c,items:0,qty:0,cost:0,sale:0,min:0,max:0,stale:0});
  DB.stock.forEach(it=>{
    const c=CATS.includes(it.cat)?it.cat:'อื่น ๆ', m=map[c], f=flags(it), q=n(it.qty);
    m.items++; m.qty+=q; m.cost+=(typeof pkgFifoValue==='function'?pkgFifoValue(it):n(it.qty)*n(it.cost)); m.sale+=q*priceByTier(it,tier);
    if(f.min)m.min++; if(f.max)m.max++; if(f.stale)m.stale++;});
  return CATS.map(c=>map[c]);
}
function renderCatSummary(){
  const rows=catSummary(), used=rows.filter(r=>r.items>0);
  const tot=rows.reduce((a,r)=>({items:a.items+r.items,qty:a.qty+r.qty,cost:a.cost+r.cost,sale:a.sale+r.sale,
    min:a.min+r.min,max:a.max+r.max,stale:a.stale+r.stale}),{items:0,qty:0,cost:0,sale:0,min:0,max:0,stale:0});
  const mx=Math.max(1,...rows.map(r=>r.cost));
  $('#sumTag').textContent=used.length+' หมวดที่มีสินค้า · รวม '+tot.items+' รายการ';
  $('#catSumTbl tbody').innerHTML=rows.map(r=>{
    const pct=tot.cost?r.cost/tot.cost*100:0;
    return `<tr class="click" onclick="setCat('${r.cat}')" style="${r.items?'':'opacity:.45'}">
      <td><b>${esc(r.cat)}</b>${catFilter===r.cat?' <span class="chip b">กำลังกรอง</span>':''}</td>
      <td class="num">${r.items}</td><td class="num">${qf(r.qty)}</td>
      <td class="num">${money(r.cost)}</td><td class="num">${money(r.sale)}</td>
      <td class="num">${money(r.sale-r.cost)}</td>
      <td><div class="mbar"><i style="width:${Math.round(r.cost/mx*100)}%"></i></div>
        <div class="hint mono" style="margin-top:2px">${pct.toFixed(1)}%</div></td>
      <td class="ctr">${r.min?`<span class="chip a" title="ถึงจุดสั่งซื้อ">Min ${r.min}</span> `:''}${r.max?`<span class="chip r" title="เกินระดับสูงสุด">Max ${r.max}</span> `:''}${r.stale?`<span class="chip" title="ไม่เคลื่อนไหว" style="background:var(--c-stale)">ค้าง ${r.stale}</span>`:''}${(!r.min&&!r.max&&!r.stale)?'<span class="hint">-</span>':''}</td></tr>`}).join('');
  $('#catSumTbl tfoot').innerHTML=`<tr><td>รวมทุกหมวด</td><td class="num">${tot.items}</td><td class="num">${qf(tot.qty)}</td>
    <td class="num">${money(tot.cost)}</td><td class="num">${money(tot.sale)}</td><td class="num">${money(tot.sale-tot.cost)}</td>
    <td class="hint">มูลค่าขายคำนวณที่ระดับราคา ${($('#sumTier')&&$('#sumTier').value)||'B'}</td>
    <td class="ctr">${tot.min+tot.max+tot.stale} รายการ</td></tr>`;
}
function openStockRep(){
  $('#rpCat').innerHTML='<option value="">ทุกหมวด</option>'+CATS.map(c=>{
    const cnt=DB.stock.filter(x=>(x.cat||'อื่น ๆ')===c).length;
    return `<option value="${esc(c)}" ${catFilter===c?'selected':''}>${esc(c)} (${cnt} รายการ)</option>`}).join('');
  if(catFilter) $('#rpCat').value=catFilter;
  updateRpInfo(); openModal('mStockRep');
}
function rpRows(){
  const cat=$('#rpCat').value, scope=$('#rpScope').value, sort=$('#rpSort').value, dir=$('#rpDir').value;
  let rows=DB.stock.filter(it=>!cat||(it.cat||'อื่น ๆ')===cat);
  if(scope==='has') rows=rows.filter(it=>n(it.qty)>0);
  if(scope==='zero') rows=rows.filter(it=>n(it.qty)<=0);
  if(scope==='min') rows=rows.filter(it=>flags(it).min);
  if(scope==='stale') rows=rows.filter(it=>flags(it).stale);
  const key=it=>sort==='value'?(typeof pkgFifoValue==='function'?pkgFifoValue(it):n(it.qty)*n(it.cost)):sort==='qty'?n(it.qty):
    sort==='code'?String(it.code||'').toLowerCase():sort==='lo'?String(locCode(it)||'zzz').toLowerCase():String(it.name||'').toLowerCase();
  rows.sort((a,b)=>{const ka=key(a),kb=key(b);
    const r=(typeof ka==='number')?ka-kb:String(ka).localeCompare(String(kb),'th');
    return dir==='desc'?-r:r;});
  return rows;
}
function updateRpInfo(){
  const rows=rpRows(), q=rows.reduce((a,it)=>a+n(it.qty),0), v=rows.reduce((a,it)=>a+(typeof pkgFifoValue==='function'?pkgFifoValue(it):n(it.qty)*n(it.cost)),0);
  $('#rpInfo').textContent='จะพิมพ์ '+rows.length+' รายการ · รวม '+q.toLocaleString('th-TH')+' ชิ้น · มูลค่าต้นทุน '+money(v)+' บาท';
}
['rpCat','rpScope','rpSort','rpDir','rpGroup'].forEach(id=>{const el=$('#'+id); if(el) el.onchange=updateRpInfo});
function printStockRep(){
  const rows=rpRows(); if(!rows.length){ toast('ไม่มีสินค้าตรงตามเงื่อนไขที่เลือก'); return; }
  const cat=$('#rpCat').value, scope=$('#rpScope').value, group=$('#rpGroup').value==='cat'&&!cat,
    price=$('#rpPrice').checked, sortLab=$('#rpSort').selectedOptions[0].textContent,
    dirLab=$('#rpDir').selectedOptions[0].textContent, scopeLab=$('#rpScope').selectedOptions[0].textContent;
  const cols=price?11:8;
  const head=`<tr><th style="width:26px">#</th><th style="width:92px">รหัสสินค้า</th><th style="width:86px">OEM</th>
    <th>ชื่อสินค้า</th><th style="width:38px">LO</th><th style="width:46px">คงเหลือ</th><th style="width:38px">หน่วย</th>
    <th style="width:40px">Min</th>${price?`<th style="width:72px">ราคาทุน</th><th style="width:80px">มูลค่าทุน</th><th style="width:80px">มูลค่าขาย B</th>`:''}</tr>`;
  const line=(it,i)=>`<tr><td style="text-align:center">${i}</td><td>${esc(it.code)}</td><td>${esc(it.oem||'-')}</td>
    <td>${esc(it.name)}</td><td style="text-align:center">${esc(locCode(it)||'-')}</td>
    <td style="text-align:center"><b>${qf(it.qty)}</b></td><td style="text-align:center">${esc(it.unit||'')}</td>
    <td style="text-align:center">${qf(it.min)}</td>
    ${price?`<td class="num">${money(n(it.qty)?(typeof pkgFifoValue==='function'?pkgFifoValue(it):n(it.qty)*n(it.cost))/n(it.qty):it.cost)}</td><td class="num">${money((typeof pkgFifoValue==='function'?pkgFifoValue(it):n(it.qty)*n(it.cost)))}</td>
      <td class="num">${money(n(it.qty)*priceByTier(it,'B'))}</td>`:''}</tr>`;
  const sub=(label,list)=>`<tr style="background:#eee"><td colspan="5"><b>${esc(label)}</b></td>
    <td style="text-align:center"><b>${qf(list.reduce((a,x)=>a+n(x.qty),0))}</b></td><td colspan="2" style="text-align:center">${list.length} รายการ</td>
    ${price?`<td></td><td class="num"><b>${money(list.reduce((a,x)=>a+(typeof pkgFifoValue==='function'?pkgFifoValue(x):n(x.qty)*n(x.cost)),0))}</b></td>
      <td class="num"><b>${money(list.reduce((a,x)=>a+n(x.qty)*priceByTier(x,'B'),0))}</b></td>`:''}</tr>`;
  let body=[], i=0;
  if(group){
    CATS.forEach(c=>{ const list=rows.filter(x=>(x.cat||'อื่น ๆ')===c); if(!list.length) return;
      body.push(`<tr style="background:#f4f4f4"><td colspan="${cols}"><b>หมวด ${esc(c)}</b></td></tr>`);
      list.forEach(it=>body.push(line(it,++i)));
      body.push(sub('รวมหมวด '+c,list)); });
  } else rows.forEach(it=>body.push(line(it,++i)));
  const tq=rows.reduce((a,x)=>a+n(x.qty),0), tc=rows.reduce((a,x)=>a+(typeof pkgFifoValue==='function'?pkgFifoValue(x):n(x.qty)*n(x.cost)),0),
        ts=rows.reduce((a,x)=>a+n(x.qty)*priceByTier(x,'B'),0);
  body.push(`<tr style="background:#ddd"><td colspan="5"><b>รวมทั้งรายงาน</b></td>
    <td style="text-align:center"><b>${tq}</b></td><td colspan="2" style="text-align:center"><b>${rows.length} รายการ</b></td>
    ${price?`<td></td><td class="num"><b>${money(tc)}</b></td><td class="num"><b>${money(ts)}</b></td>`:''}</tr>`);
  if(price) body.push(`<tr><td colspan="${cols}" style="text-align:center">มูลค่าต้นทุนคงเหลือ (${bahtText(tc)})</td></tr>`);
  const per=30, pages=Math.max(1,Math.ceil(body.length/per));
  const sub2=`${cat?'หมวด '+esc(cat):'ทุกหมวด'} · ${esc(scopeLab)}<br>เรียงตาม${esc(sortLab)} ${esc(dirLab)}`;
  let html='';
  for(let p=0;p<pages;p++){
    html+=sheetTop({title:'รายงานสินค้าคงเหลือ',en:'INVENTORY REPORT',copy:'รายงานภายใน',
      fields:[['ณ วันที่',thDate(iso())],['ขอบเขต',cat?esc(cat):'ทุกหมวด'],
        ['เรียงตาม',esc(sortLab)+' '+esc(dirLab)],['หน้า',(p+1)+' / '+pages]]})+`
      <table><thead>${head}</thead><tbody>${body.slice(p*per,(p+1)*per).join('')}</tbody></table>
      ${p===pages-1?`<div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
        <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ตรวจสอบ</span></div></div>`:''}</div>`;
  }
  closeModal('mStockRep'); printDocs(html);
  toast('เตรียมพิมพ์รายงานสินค้าคงเหลือ '+rows.length+' รายการ');
}

function printCatSummary(){
  const rows=catSummary(), tier=($('#sumTier')&&$('#sumTier').value)||'B';
  const tot=rows.reduce((a,r)=>({items:a.items+r.items,qty:a.qty+r.qty,cost:a.cost+r.cost,sale:a.sale+r.sale}),{items:0,qty:0,cost:0,sale:0});
  printDocs(sheetTop({title:'สรุปมูลค่าสินค้าคงคลังตามหมวด',en:'INVENTORY VALUE SUMMARY',copy:'รายงานภายใน',
    fields:[['ณ วันที่',thDate(iso())],['ระดับราคาที่ใช้ตีมูลค่า',tier]]})+`
    <table><thead><tr><th>หมวดอะไหล่</th><th style="width:70px">รายการ</th><th style="width:78px">คงเหลือ</th>
      <th style="width:96px">มูลค่าต้นทุน</th><th style="width:96px">มูลค่าขาย</th><th style="width:96px">กำไรขั้นต้น</th>
      <th style="width:60px">สัดส่วน</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>${esc(r.cat)}</td><td style="text-align:center">${r.items}</td>
        <td style="text-align:center">${qf(r.qty)}</td><td class="num">${money(r.cost)}</td>
        <td class="num">${money(r.sale)}</td><td class="num">${money(r.sale-r.cost)}</td>
        <td style="text-align:center">${tot.cost?(r.cost/tot.cost*100).toFixed(1):'0.0'}%</td></tr>`).join('')}
      <tr><td><b>รวมทุกหมวด</b></td><td style="text-align:center"><b>${tot.items}</b></td>
        <td style="text-align:center"><b>${qf(tot.qty)}</b></td><td class="num"><b>${money(tot.cost)}</b></td>
        <td class="num"><b>${money(tot.sale)}</b></td><td class="num"><b>${money(tot.sale-tot.cost)}</b></td>
        <td style="text-align:center">100%</td></tr>
      <tr><td colspan="7" style="text-align:center">มูลค่าต้นทุนรวม (${bahtText(tot.cost)})</td></tr></tbody></table>
    <div class="note">รายงานนี้คำนวณจากยอดคงเหลือในระบบ ณ เวลาที่พิมพ์ · มูลค่าต้นทุนใช้ราคาทุนล่าสุดของแต่ละรายการ</div>
    <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
      <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ตรวจสอบ</span></div></div></div>`);
}
function renderStock(){
  /* ช่องค้นหา/ตัวกรองเหลือชุดเดียว (แถบเหนือตาราง) — ไม่มีการซิงก์ค่าข้ามชุดอีกแล้ว */
  const q=($('#stockSearchBottom').value||'').toLowerCase().trim(), fl=$('#stockFilterBottom').value;
  let rows=DB.stock.filter(it=>{
    if(catFilter&&(it.cat||'อื่น ๆ')!==catFilter) return false;
    if(q&&![it.code,it.oem,it.name,it.brand,locCode(it)].some(v=>String(v||'').toLowerCase().includes(q))) return false;
    const f=flags(it);
    if(fl==='min') return f.min; if(fl==='max') return f.max; if(fl==='stale') return f.stale;
    if(fl==='any') return f.min||f.max||f.stale; return true; });
  rows=sortRows('stockTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'stk');
  $('#stockTbl tbody').innerHTML=rows.map(it=>{
    const f=flags(it), st=flagColors(f), any=f.min||f.max||f.stale;
    return `<tr>
      <td class="codecell sc-code" style="${st}" title="${esc(flagText(f,it))+' · คลิกเพื่อแก้ไขรายละเอียดสินค้า'}">
        <span class="codechip ${any?'flag':''}" style="cursor:pointer" onclick="openStock('${it.id}')">${esc(it.code)}</span>
        ${any?`<span class="flagdots">${f.min?'<i style="background:var(--c-min)"></i>':''}${f.max?'<i style="background:var(--c-max)"></i>':''}${f.stale?'<i style="background:var(--c-stale)"></i>':''}</span>`:''}</td>
      <td class="mono sc-oem" style="font-size:12.5px">${esc(it.oem||'-')}</td>
      <td class="sc-name">${esc(it.name)}${it.loc?`<div class="hint">${esc(it.loc)}</div>`:''}</td>
      <td class="sc-cat"><span class="chip">${esc(it.cat||'อื่น ๆ')}</span></td>
      <td class="ctr sc-loc"><b class="mono" style="font-size:13.5px" title="${esc(locText(it)||'ยังไม่ระบุพื้นที่จัดเก็บ')}">${esc(locCode(it)||'-')}</b></td>
      <td class="num sc-cost">${money(it.cost)}</td><td class="num sc-pa">${money(it.pa)}</td>
      <td class="num sc-pb">${money(it.pb)}</td><td class="num sc-pc">${money(it.pc)}</td>
      <td class="num sc-qty"><b>${qf(it.qty)}</b> <span class="hint">${esc(it.unit||'')}</span></td>
      <td class="num sc-minmax">${qf(it.min)}</td><td class="num sc-minmax">${qf(it.max)}</td>
      <td class="ctr sc-lastmove" style="font-size:12px">${thDate(it.lastMove)}</td>
      <td class="ctr">${it.img
        ? `<img class="thumb" src="${it.img}" alt="${esc(it.name)}" title="คลิกเพื่อดู / เปลี่ยนรูป" onclick="openImgModal('${it.id}')">`
        : `<span class="thumb-none">ไม่มีรูป</span>`}</td></tr>`}).join('');
  $('#stockEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('stockTbl');
  $('#stockCount').textContent=rows.length+' รายการ';
  updateInvSum(rows);
  const fnote=[]; if(catFilter) fnote.push('หมวด: '+catFilter);
  if(fl) fnote.push($('#stockFilterBottom').selectedOptions[0].textContent);
  if(q) fnote.push('คำค้น: '+q);
  $('#stockFilterNote').textContent=fnote.length?'กำลังกรอง — '+fnote.join(' · '):'';
  renderCatBar(); renderCatSummary(); refreshStockList();
}
function refreshOpenDocStockViews(){
  if($('#mQuoteEdit')&&$('#mQuoteEdit').classList.contains('on')&&typeof Q!=='undefined'&&Q) renderQItems();
  if($('#mReceiptEdit')&&$('#mReceiptEdit').classList.contains('on')&&typeof R!=='undefined'&&R) calcReceipt();
  if($('#v-buy')&&$('#v-buy').classList.contains('on')&&typeof G!=='undefined'&&G) renderGRItems();
  if($('#v-stock')&&$('#v-stock').classList.contains('on')&&typeof stkPane!=='undefined'&&stkPane==='claim'&&typeof C!=='undefined'&&C) renderClaimItems();
}
const STOCK_SUGGEST_MAX=5;
function refreshStockList(q){
  const el=$('#stockList'); if(!el) return;
  const key=String(q||'').toLowerCase().trim();
  const hit=key
    ? DB.stock.filter(s=>[s.code,s.oem,s.name].some(x=>String(x||'').toLowerCase().includes(key)))
    : DB.stock;
  el.innerHTML=hit.slice(0,STOCK_SUGGEST_MAX).map(s=>
    `<option value="${esc(s.code)}">${esc(s.name)} · OEM ${esc(s.oem||'-')} · คงเหลือ ${qf(s.qty)}</option>`).join('');
}
/* ช่องกรอกรหัสสินค้าทุกจุด (ใบเสนอราคา · ใบเสร็จ · ใบรับสินค้า · ใบเคลม · ใบเบิกใช้ภายใน)
   ใช้ datalist ร่วมกัน จึงดักที่ระดับเอกสารเพื่อให้ครอบคลุมแถวที่สร้างขึ้นภายหลังด้วย */
document.addEventListener('input',e=>{
  const t=e.target;
  if(t&&t.tagName==='INPUT'&&t.getAttribute('list')==='stockList') refreshStockList(t.value);
},true);
document.addEventListener('focusin',e=>{
  const t=e.target;
  if(t&&t.tagName==='INPUT'&&t.getAttribute('list')==='stockList') refreshStockList(t.value);
},true);
let editStockId=null;
const ZONES=['A','B','C','D','E','F','G','H'];
function locCode(it){ const z=(it.zone||'').toString().toUpperCase(), sh=n(it.shelf);
  return (z||sh)?(z+(sh?String(sh):'')):''; }
function locText(it){
  const p=[]; if(it.zone) p.push('โซน '+it.zone); if(n(it.shelf)) p.push('ชั้นที่ '+n(it.shelf));
  if(it.loc) p.push(it.loc); return p.join(' · '); }
function warrText(it){ const m=n(it.warr);
  return (m?m+' เดือน':'')+(it.warrNote?(m?' · ':'')+it.warrNote:''); }
function margin(cost,price){ cost=n(cost); price=n(price);
  if(!price) return '<span class="hint">กำไร -</span>';
  if(!cost) return '<span class="hint">ยังไม่ระบุต้นทุน</span>';
  const p=(price-cost)/cost*100, amt=price-cost;
  const col=p<0?'var(--danger)':(p<15?'#a86f00':'var(--ok)');
  return `<span style="color:${col}">กำไร ${p.toFixed(1)}% · ${money(amt)} บาท</span>`;
}
function calcMargin(){
  const c=$('#fCost').value;
  $('#mgA').innerHTML=margin(c,$('#fPA').value);
  $('#mgB').innerHTML=margin(c,$('#fPB').value);
  $('#mgC').innerHTML=margin(c,$('#fPC').value);
}
function applyMarginPct(tier){
  const cost=n($('#fCost').value), pct=$('#fPct'+tier).value;
  if(pct===''){ calcMargin(); return; }
  if(!cost){ toast('กรอกราคาซื้อ (ต้นทุน) ก่อน'); return; }
  $('#fP'+tier).value=Math.round(cost*(1+n(pct)/100)*100)/100;
  calcMargin();
}
function addUnit(){
  const v=$('#fUnitNew').value.trim(); if(!v) return toast('พิมพ์ชื่อหน่วยนับที่ต้องการเพิ่ม');
  DB.units=DB.units||[]; if(!UNITS.includes(v)) DB.units.push(v);
  syncLists(); save(); fillUnitSel(v); $('#fUnitNew').value=''; toast('เพิ่มหน่วยนับ “'+v+'” แล้ว');
}
function addCat(){
  const v=$('#fCatNew').value.trim(); if(!v) return toast('พิมพ์ชื่อหมวดอะไหล่ที่ต้องการเพิ่ม');
  DB.cats=DB.cats||[]; DB.catsOff=DB.catsOff||[];
  DB.catsOff=DB.catsOff.filter(c=>c!==v);   /* เคยซ่อนหมวดมาตรฐานชื่อนี้ไว้ — เพิ่มใหม่ = เอากลับมา */
  if(!CATS_BASE.includes(v)&&!DB.cats.includes(v)) DB.cats.push(v);
  syncLists(); logAudit('stock',{no:v},'save','เพิ่มหมวดอะไหล่ “'+v+'”'); save();
  fillCatSel(v); $('#fCatNew').value='';
  renderCatBar(); renderCatSummary(); toast('เพิ่มหมวด “'+v+'” แล้ว ใช้ได้ทั้งระบบ');
}
function fillUnitSel(v){ $('#fUnit').innerHTML=UNITS.map(u=>`<option>${esc(u)}</option>`).join(''); $('#fUnit').value=v||'ชิ้น'; }
function fillCatSel(v){ $('#fCat').innerHTML=CATS.map(c=>`<option>${esc(c)}</option>`).join(''); $('#fCat').value=v||'อื่น ๆ'; }

/* ==========================================================
   ตั้งค่าหมวดอะไหล่ — เพิ่ม / ลบหมวดที่ใช้ร่วมกันทั้งระบบ
   ========================================================== */
function catUseCount(c){ return DB.stock.filter(x=>(x.cat||CAT_FALLBACK)===c).length; }
function openCatMgr(){
  if(!can('stock.edit')) return toast('บัญชีนี้ไม่มีสิทธิตั้งค่าหมวดอะไหล่');
  syncLists(); renderCatMgr(); $('#catMgrNew').value=''; openModal('mCatMgr');
}
function renderCatMgr(){
  $('#catMgrTbl tbody').innerHTML=CATS.map(c=>{
    const used=catUseCount(c), base=CATS_BASE.includes(c), lock=(c===CAT_FALLBACK);
    return `<tr>
      <td><b>${esc(c)}</b>${lock?'<div class="hint">หมวดปลายทาง — สินค้าที่ถูกย้ายออกจากหมวดอื่นจะมาอยู่ที่นี่</div>':''}</td>
      <td class="ctr"><span class="chip${base?'':' b'}">${base?'มาตรฐาน':'เพิ่มเอง'}</span></td>
      <td class="num">${used?used+' รายการ':'<span class="hint">ยังไม่มี</span>'}</td>
      <td class="ctr">${lock?'<span class="hint">ลบไม่ได้</span>'
        :`<button class="btn sm dgr" onclick="catMgrDel('${esc(c).replace(/'/g,"\\'")}')">ลบ</button>`}</td></tr>`;
  }).join('');
}
function catMgrAdd(){
  const v=$('#catMgrNew').value.trim();
  if(!v) return toast('พิมพ์ชื่อหมวดอะไหล่ที่ต้องการเพิ่ม');
  if(CATS.some(c=>c.toLowerCase()===v.toLowerCase())) return toast('มีหมวด “'+v+'” อยู่แล้ว');
  DB.cats=DB.cats||[]; DB.catsOff=DB.catsOff||[];
  DB.catsOff=DB.catsOff.filter(c=>c!==v);   /* เผื่อเคยซ่อนหมวดมาตรฐานชื่อนี้ไว้ — เพิ่มใหม่ = เอากลับมา */
  if(!CATS_BASE.includes(v)&&!DB.cats.includes(v)) DB.cats.push(v);
  syncLists(); logAudit('stock',{no:v},'save','เพิ่มหมวดอะไหล่ “'+v+'”'); save();
  $('#catMgrNew').value=''; renderCatMgr(); refreshCatViews();
  toast('เพิ่มหมวด “'+v+'” แล้ว ใช้ได้ทั้งระบบ');
}
async function catMgrDel(c){
  if(c===CAT_FALLBACK) return;
  const used=catUseCount(c);
  const vend=DB.vendors.filter(v=>(v.cats||[]).includes(c)).length;
  const detail=[used?'สินค้า '+used+' รายการจะถูกย้ายไปหมวด “'+CAT_FALLBACK+'”':'',
    vend?'ผู้ขาย '+vend+' รายจะถูกถอดหมวดนี้ออกจากรายการสินค้าที่จำหน่าย':''].filter(Boolean).join('\n');
  if(!await askP({title:'ลบหมวดอะไหล่',
    text:'ลบหมวด “'+c+'” ออกจากระบบ?'+(detail?'\n\n'+detail:'\n\nยังไม่มีสินค้าหรือผู้ขายใช้หมวดนี้'),
    yes:'ลบหมวด',no:'ไม่ลบ'})) return;
  DB.stock.forEach(x=>{ if((x.cat||CAT_FALLBACK)===c) x.cat=CAT_FALLBACK; });
  DB.vendors.forEach(v=>{ if((v.cats||[]).includes(c)) v.cats=v.cats.filter(k=>k!==c); });
  DB.cats=(DB.cats||[]).filter(k=>k!==c);
  if(CATS_BASE.includes(c)){ DB.catsOff=DB.catsOff||[]; if(!DB.catsOff.includes(c)) DB.catsOff.push(c); }
  syncLists();
  logAudit('stock',{no:c},'save','ลบหมวดอะไหล่ “'+c+'”'
    +(used?' · ย้ายสินค้า '+used+' รายการไปหมวด “'+CAT_FALLBACK+'”':'')
    +(vend?' · ถอดออกจากผู้ขาย '+vend+' ราย':''));
  save(); renderCatMgr(); refreshCatViews();
  toast('ลบหมวด “'+c+'” แล้ว'+(used?' · ย้ายสินค้า '+used+' รายการไปหมวด “'+CAT_FALLBACK+'”':''));
}
/* หมวดถูกใช้หลายหน้า — เปลี่ยนแล้วต้องรีเฟรชให้ครบทุกที่ */
function refreshCatViews(){
  /* ถ้ากำลังกรองด้วยหมวดที่เพิ่งถูกลบ ต้องล้างตัวกรอง ไม่งั้นทะเบียนจะว่างเปล่าโดยไม่บอกสาเหตุ */
  if(catFilter&&!CATS.includes(catFilter)) catFilter='';
  renderStock(); renderCatBar(); renderCatSummary(); renderVen(); renderVenCatFilter();
  if($('#mStock')&&$('#mStock').classList.contains('on')) fillCatSel($('#fCat').value);
}
function openStock(id){
  /* เปิดดูรายละเอียดได้ทุกคนที่เข้าแท็บสต๊อกได้ — แต่เพิ่มสินค้าใหม่ต้องมีสิทธิ์แก้ไข */
  if(!id&&!can('stock.edit')) return toast('บัญชีนี้ไม่มีสิทธิเพิ่มสินค้าใหม่');
  const canEdit=can('stock.edit');
  editStockId=id||null; const it=id?DB.stock.find(x=>x.id===id):null;
  $('#mStockTitle').textContent=it?((canEdit?'แก้ไขรายละเอียดสินค้า':'รายละเอียดสินค้า (ดูอย่างเดียว)')+' · '+it.code+' — '+it.name):'รายละเอียดสินค้า (เพิ่มรายการใหม่)';
  /* เครื่องมือ (เพิ่มเติม / บัตรสินค้า / รูป / ลบ) ย้ายมาอยู่ในนี้แทนช่องจัดการในตาราง */
  $('#mStockTools').style.display=it?'flex':'none';
  $('#mStockImgBox').style.display=it?'':'none';
  setByBox('mStockByBox',it);   /* ชื่อผู้บันทึกอยู่ในฟอร์ม ไม่โชว์ในตารางทะเบียน */
  if(it){
    $('#mStockImgBtn').textContent=it.img?'เปลี่ยนรูป':'อัปโหลดรูป';
    $('#mStockImgWrap').innerHTML=it.img
      ? `<img src="${it.img}" alt="${esc(it.name)}" style="max-width:100%;max-height:230px;border-radius:6px;border:1px solid var(--line)">`
      : '<div class="hint">ยังไม่มีรูปอะไหล่ — กดปุ่ม “อัปโหลดรูป” ด้านบน</div>';
  }
  syncLists();
  const d=Object.assign({code:'',oem:'',name:'',cat:'อื่น ๆ',unit:'ชิ้น',cost:0,pa:0,pb:0,pc:0,qty:0,min:0,max:0,
    stale:0,lastMove:iso(),warr:'',warrNote:'',zone:'',shelf:'',loc:''},it||{});
  fillCatSel(d.cat||'อื่น ๆ'); fillUnitSel(d.unit||'ชิ้น');
  $('#fStale').innerHTML='<option value="">ใช้ค่ามาตรฐานของระบบ ('+(n(DB.shop.stale)||6)+' เดือน)</option>'
    +Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1} เดือน</option>`).join('');
  $('#fStale').value=d.stale?String(n(d.stale)):'';
  $('#fWarr').innerHTML='<option value="">ไม่ระบุ / ไม่มีการรับประกัน</option>'
    +Array.from({length:12},(_,i)=>`<option value="${i+1}">${i+1} เดือน</option>`).join('');
  $('#fWarr').value=n(d.warr)?String(n(d.warr)):'';
  $('#fZone').innerHTML='<option value="">— ยังไม่ระบุโซน —</option>'+ZONES.map(z=>`<option value="${z}">โซน ${z}</option>`).join('');
  $('#fZone').value=d.zone||'';
  $('#fShelf').innerHTML='<option value="">— ยังไม่ระบุชั้น —</option>'
    +Array.from({length:30},(_,i)=>`<option value="${i+1}">ชั้นวางที่ ${i+1}</option>`).join('');
  $('#fShelf').value=n(d.shelf)?String(n(d.shelf)):'';
  $('#fCode').value=d.code;$('#fOem').value=d.oem;$('#fName').value=d.name;$('#pkg-stock-brand').value=d.brand||'';
  $('#fCost').value=d.cost;$('#fPA').value=d.pa;$('#fPB').value=d.pb;$('#fPC').value=d.pc;
  $('#fPctA').value='';$('#fPctB').value='';$('#fPctC').value='';
  $('#fQty').value=d.qty;$('#fMin').value=d.min;$('#fMax').value=d.max;$('#fMove').value=d.lastMove;
  $('#fWarrNote').value=d.warrNote||'';$('#fLoc').value=d.loc||'';
  $('#fCatNew').value='';$('#fUnitNew').value='';
  /* คนมีสิทธิ์ดูอย่างเดียว — ล็อกทุกช่องไม่ให้แก้ (ปุ่มบันทึกถูกซ่อนด้วย .sc-edit อยู่แล้ว) */
  $$('#mStock .body input, #mStock .body select').forEach(el=>el.disabled=!canEdit);
  calcMargin(); openModal('mStock');
}
function saveStock(){
  if(!can('stock.edit')) return toast('บัญชีนี้ไม่มีสิทธิเพิ่ม / แก้ไขสินค้า');
  const code=$('#fCode').value.trim(), name=$('#fName').value.trim();
  if(!code||!name) return toast('กรอกรหัสสินค้าของอู่และชื่อสินค้าก่อนบันทึก');
  if(DB.stock.find(x=>x.code.toLowerCase()===code.toLowerCase()&&x.id!==editStockId)) return toast('รหัสสินค้านี้มีอยู่แล้วในระบบ');
  const old=editStockId?DB.stock.find(x=>x.id===editStockId):null;
  if(old&&n(old.qty)!==n($('#fQty').value)) return toast('แก้จำนวนคงเหลือไม่ได้ — ปรับยอดผ่าน “ตรวจนับสินค้า” เท่านั้น');
  if(old&&typeof pkgFifo!=='undefined'&&pkgFifo.touched(old.id)&&n(old.cost)!==n($('#fCost').value)) return toast('แก้ต้นทุนไม่ได้ — ต้นทุนมาจากใบรับสินค้า (FIFO)');
  const rec={id:editStockId||uid(),code,oem:$('#fOem').value.trim(),name,cat:$('#fCat').value,brand:$('#pkg-stock-brand').value.trim(),
    unit:$('#fUnit').value||'ชิ้น',cost:n($('#fCost').value),pa:n($('#fPA').value),pb:n($('#fPB').value),pc:n($('#fPC').value),
    qty:n($('#fQty').value),min:n($('#fMin').value),max:n($('#fMax').value),stale:n($('#fStale').value),
    lastMove:$('#fMove').value||iso(),warr:n($('#fWarr').value)||'',warrNote:$('#fWarrNote').value.trim(),
    zone:$('#fZone').value,shelf:n($('#fShelf').value)||'',loc:$('#fLoc').value.trim()};
  if(old&&n(old.qty)!==rec.qty) logMove(rec.id,'adj',rec.qty-n(old.qty),rec.lastMove,'ปรับยอดด้วยมือ','');
  if(!old&&rec.qty) logMove(rec.id,'in',rec.qty,rec.lastMove,'ยอดยกมา','');
  stampRec(rec,old);
  if(editStockId){const i=DB.stock.findIndex(x=>x.id===editStockId);DB.stock[i]=rec;} else DB.stock.push(rec);
  /* บันทึกร่องรอย — แก้ราคาทุนหรือจำนวนคงเหลือต้องตามหาคนทำได้ */
  logAudit('stock',{id:rec.id,no:rec.code},'save',old
    ?('แก้ไข '+rec.name+(n(old.cost)!==rec.cost?' · ต้นทุน '+money(old.cost)+' → '+money(rec.cost)+' บาท':'')
      +(n(old.qty)!==rec.qty?' · คงเหลือ '+old.qty+' → '+rec.qty+' '+rec.unit:''))
    :('เพิ่มสินค้าใหม่ '+rec.name+' · ยอดยกมา '+rec.qty+' '+rec.unit));
  save();closeModal('mStock');renderStock();refreshOpenDocStockViews();toast('บันทึกรายละเอียดสินค้าแล้ว');
}
async function delStock(id){ if(!can('stock.del')) return toast('บัญชีนี้ไม่มีสิทธิลบสินค้า');
  const it=DB.stock.find(x=>x.id===id);
  if(!await askP({title:'ลบสินค้า',text:'ลบ '+it.code+' — '+it.name+' ออกจากระบบ?',yes:'ลบ',no:'ไม่ลบ'})) return;
  DB.stock=DB.stock.filter(x=>x.id!==id);save();renderStock();refreshOpenDocStockViews();
  if(editStockId===id){ editStockId=null; closeModal('mStock'); }
  toast('ลบแล้ว'); }
/* ---------- นำเข้าสินค้าจากไฟล์ Excel / CSV ---------- */
const STOCK_TPL_COLS=[
  ['รหัสสินค้า (อู่) *','code','BR-999',true],
  ['รหัสอ้างอิง (OEM)','oem','04465-XXXXX',false],
  ['ชื่อสินค้า *','name','ตัวอย่าง ผ้าเบรกหน้า',true],
  ['หมวด','cat','ระบบเบรก',false],
  ['หน่วยนับ','unit','ชิ้น',false],
  ['ราคาซื้อ (ต้นทุน)','cost','850',false],
  ['ราคาขาย A','pa','1500',false],
  ['ราคาขาย B','pb','1350',false],
  ['ราคาขาย C','pc','1200',false],
  ['ปริมาณคงคลัง','qty','10',false],
  ['Min','min','2',false],
  ['Max','max','20',false],
  ['โซน (A-H)','zone','A',false],
  ['ชั้นวาง (ตัวเลข)','shelf','1',false],
  ['ตำแหน่งเพิ่มเติม','loc','หน้าร้าน',false],
  ['รับประกัน (เดือน)','warr','3',false],
  ['แบรนด์อะไหล่','brand','Denso',false]
];
function parseCsvRows(text){
  const rows=[]; let row=[], field='', inQuotes=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQuotes){
      if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else inQuotes=false; }
      else field+=c;
    } else {
      if(c==='"') inQuotes=true;
      else if(c===','){ row.push(field); field=''; }
      else if(c==='\r'){ /* skip */ }
      else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; }
      else field+=c;
    }
  }
  if(field!==''||row.length){ row.push(field); rows.push(row); }
  return rows;
}
function upsertStockFromImport(row){
  const code=String(row.code||'').trim(), name=String(row.name||'').trim();
  if(!code||!name) return {ok:false};
  const existing=DB.stock.find(x=>x.code.toLowerCase()===code.toLowerCase());
  const cat=CATS.includes(row.cat)?row.cat:(existing?existing.cat:'อื่น ๆ');
  const unit=row.unit?String(row.unit).trim():(existing?existing.unit:'ชิ้น');
  const rec={id:existing?existing.id:uid(),code,oem:String(row.oem||'').trim(),name,cat,unit,brand:row.brand===undefined?(existing?.brand||''):String(row.brand||'').trim(),
    cost:n(row.cost),pa:n(row.pa),pb:n(row.pb),pc:n(row.pc),
    qty:n(row.qty),min:n(row.min),max:n(row.max),
    stale:existing?existing.stale:0,lastMove:existing?existing.lastMove:iso(),
    warr:n(row.warr)||'',warrNote:existing?existing.warrNote:'',
    zone:String(row.zone||'').trim().toUpperCase(),shelf:n(row.shelf)||'',loc:String(row.loc||'').trim()};
  if(existing){
    const fifoLocked=typeof pkgFifo!=='undefined';
    if(fifoLocked){ rec.qty=n(existing.qty); if(pkgFifo.touched(existing.id)) rec.cost=n(existing.cost); }
    if(n(existing.qty)!==rec.qty) logMove(rec.id,'adj',rec.qty-n(existing.qty),rec.lastMove,'นำเข้าจากไฟล์ Excel/CSV (ปรับยอด)','');
    const i=DB.stock.findIndex(x=>x.id===existing.id); DB.stock[i]=rec;
    return {ok:true,mode:'update'};
  }
  if(rec.qty) logMove(rec.id,'in',rec.qty,rec.lastMove,'นำเข้าจากไฟล์ Excel/CSV (ยอดยกมา)','');
  DB.stock.push(rec);
  return {ok:true,mode:'add'};
}
function logMove(stockId,type,qty,date,ref,refNo,vendorId,cost){
  DB.moves.push({id:uid(),stockId,type,qty:n(qty),date:date||iso(),ref:ref||'',refNo:refNo||'',vendorId:vendorId||'',cost:n(cost)});
  if(typeof pkgFifo!=='undefined') pkgFifo.move(stockId,type,qty,date,ref,refNo,vendorId,cost);
}
let stockMenuId=null;
function openStockMenu(id){ if(!can('stock.card')) return toast('บัญชีนี้ไม่มีสิทธิดูประวัติสินค้า');
  const it=DB.stock.find(x=>x.id===id); stockMenuId=id;
  $('#mStockMenuTitle').textContent='เพิ่มเติม · '+it.code+' — '+it.name;
  openModal('mStockMenu'); }
function openStockGRHistory(){
  const id=stockMenuId, it=DB.stock.find(x=>x.id===id); if(!it) return;
  $('#mGRHistTitle').textContent='ประวัติการนำสินค้าเข้าคลัง · '+it.code+' — '+it.name;
  $('#ghFrom').value=''; $('#ghTo').value='';
  closeModal('mStockMenu'); openModal('mGRHist'); renderGRHist();
}
function renderGRHist(){
  const id=stockMenuId; if(!id) return;
  const from=$('#ghFrom').value, to=$('#ghTo').value;
  const buys=DB.purchases.filter(p=>(p.items||[]).some(i=>i.stockId===id)&&(!from||p.date>=from)&&(!to||p.date<=to));
  $('#mGRHistBody').innerHTML=buys.length?buys.map(p=>{const li=p.items.filter(i=>i.stockId===id), v=findVen(p.vendorId);
    return li.map(i=>`<tr class="click" onclick="openBill('gr','${p.id}')"><td class="mono" style="font-size:12px">${esc(p.no)}</td>
      <td>${esc((v&&v.name)||'-')}</td><td class="mono" style="font-size:12px">${esc(p.inv||'-')}</td>
      <td class="ctr">${thDate(p.date)}</td><td class="num">${qf(i.qty)}</td><td class="num">${money(i.cost)}</td></tr>`).join('')}).join('')
    :'<tr><td colspan="6" class="empty">ไม่พบประวัติการรับเข้าตามเงื่อนไขที่เลือก</td></tr>';
}
function openStockMoveReport(){
  const id=stockMenuId, it=DB.stock.find(x=>x.id===id); if(!it) return;
  $('#mMoveRepTitle').textContent='รายงานการเคลื่อนไหวสินค้า · '+it.code+' — '+it.name;
  $('#mrFrom').value=''; $('#mrTo').value='';
  closeModal('mStockMenu'); openModal('mMoveRep'); renderMoveRep();
}
function renderMoveRep(){
  const id=stockMenuId; if(!id) return;
  const from=$('#mrFrom').value, to=$('#mrTo').value;
  const mv=DB.moves.filter(m=>m.stockId===id&&(typeof PKG_BRANCH==='undefined'||PKG_BRANCH.here(m))&&(!from||m.date>=from)&&(!to||m.date<=to)).sort((a,b)=>b.date.localeCompare(a.date));
  $('#mMoveRepBody').innerHTML=mv.length?mv.map(m=>`<tr><td class="ctr">${thDate(m.date)}</td>
    <td><span class="chip ${m.qty>=0?'g':'r'}">${m.type==='in'?'รับเข้า':m.type==='out'?'ตัดออก':'ปรับยอด'}</span></td>
    <td>${esc(m.ref)} ${m.refNo?'<span class="mono hint">'+esc(m.refNo)+'</span>':''}</td>
    <td class="num">${m.qty>0?'+':''}${qf(m.qty)}</td></tr>`).join('')
    :'<tr><td colspan="4" class="empty">ยังไม่มีความเคลื่อนไหวในช่วงที่เลือก</td></tr>';
}
let imgStockId=null;
function openImgModal(id){ if(!can('stock.img')) return toast('บัญชีนี้ไม่มีสิทธิอัปโหลด/แก้ไขรูปสินค้า');
  const it=DB.stock.find(x=>x.id===id); if(!it) return; imgStockId=id;
  $('#imgInfo').textContent=it.code+' — '+it.name;
  $('#imgFile').value='';
  $('#imgPreviewWrap').innerHTML=it.img?`<img src="${it.img}" style="max-width:100%;max-height:260px;border-radius:8px">`:'<div class="hint">ยังไม่มีรูปสินค้า</div>';
  $('#imgDelBtn').style.display=it.img?'':'none';
  openModal('mImg');
}
function onImgPick(inp){
  const f=inp.files[0]; if(!f) return;
  if(!f.type.startsWith('image/')) return toast('เลือกไฟล์รูปภาพเท่านั้น');
  const rd=new FileReader();
  rd.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const max=500, scale=Math.min(1,max/Math.max(img.width,img.height));
      const c=document.createElement('canvas'); c.width=img.width*scale; c.height=img.height*scale;
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      const dataUrl=c.toDataURL('image/jpeg',0.82);
      const it=DB.stock.find(x=>x.id===imgStockId); if(!it) return;
      it.img=dataUrl; save(); renderStock(); refreshOpenDocStockViews(); syncStockDetailImg();
      $('#imgPreviewWrap').innerHTML=`<img src="${dataUrl}" style="max-width:100%;max-height:260px;border-radius:8px">`;
      $('#imgDelBtn').style.display=''; toast('บันทึกรูปสินค้าแล้ว');
    };
    img.src=rd.result;
  };
  rd.readAsDataURL(f);
}
function syncStockDetailImg(){
  const box=$('#mStockImgBox');
  if(!box||box.style.display==='none'||!editStockId) return;
  const it=DB.stock.find(x=>x.id===editStockId); if(!it) return;
  $('#mStockImgBtn').textContent=it.img?'เปลี่ยนรูป':'อัปโหลดรูป';
  $('#mStockImgWrap').innerHTML=it.img
    ? `<img src="${it.img}" alt="${esc(it.name)}" style="max-width:100%;max-height:230px;border-radius:6px;border:1px solid var(--line)">`
    : '<div class="hint">ยังไม่มีรูปอะไหล่ — กดปุ่ม “อัปโหลดรูป” ด้านบน</div>';
}
async function delStockImg(){
  const it=DB.stock.find(x=>x.id===imgStockId); if(!it) return;
  if(!await askP({title:'ลบรูปสินค้า',text:'ลบรูปสินค้าของ '+it.code+' ?',yes:'ลบ',no:'ไม่ลบ'})) return;
  delete it.img; save(); renderStock(); refreshOpenDocStockViews(); syncStockDetailImg();
  $('#imgPreviewWrap').innerHTML='<div class="hint">ยังไม่มีรูปสินค้า</div>'; $('#imgDelBtn').style.display='none';
  toast('ลบรูปสินค้าแล้ว');
}
function openCard(id){
  const it=DB.stock.find(x=>x.id===id);
  const mv=DB.moves.filter(m=>m.stockId===id&&(typeof PKG_BRANCH==='undefined'||PKG_BRANCH.here(m))).sort((a,b)=>b.date.localeCompare(a.date));
  $('#mCardTitle').textContent='บัตรสินค้า · '+it.code+' — '+it.name;
  const buys=DB.purchases.filter(p=>(p.items||[]).some(i=>i.stockId===id));
  $('#mCardBody').innerHTML=`
    ${it.img?`<img src="${it.img}" style="max-width:160px;max-height:160px;border-radius:8px;float:right;margin:0 0 8px 12px">`:''}
    <div class="grid g5">
      <div><span class="hint">หมวด</span><div>${esc(it.cat||'-')}</div></div>
      <div><span class="hint">OEM</span><div class="mono">${esc(it.oem||'-')}</div></div>
      <div><span class="hint">คงเหลือ</span><div><b>${qf(it.qty)}</b> ${esc(it.unit||'')}</div></div>
      <div><span class="hint">Min / Max</span><div>${qf(it.min)} / ${qf(it.max)}</div></div>
      <div><span class="hint">ต้นทุนล่าสุด</span><div>${money(it.cost)}</div></div>
    </div>
    <div class="grid g3" style="margin-top:8px">
      <div><span class="hint">ตำแหน่งจัดเก็บ (LO)</span><div><b class="mono">${esc(locCode(it)||'-')}</b>
        <span class="hint">${esc(locText(it)||'')}</span></div></div>
      <div><span class="hint">รับประกันจากผู้ผลิต</span><div>${esc(warrText(it)||'-')}</div></div>
      <div><span class="hint">กำไรที่ระดับราคา B</span><div>${margin(it.cost,it.pb)}</div></div>
    </div>
    <div class="hint" style="margin-top:10px">ผู้ขายที่จำหน่ายหมวด “${esc(it.cat||'-')}” :
      ${vendorsByCat(it.cat).length?vendorsByCat(it.cat).map(v=>esc(v.name)+(v.tel?' ('+esc(v.tel)+')':'')).join(' · '):'ยังไม่ได้ระบุผู้ขายสำหรับหมวดนี้'}</div>
    <div style="font-weight:600;font-size:12.5px;margin:14px 0 6px">ประวัติการรับเข้าจากผู้ขาย</div>
    <table class="tbl"><thead><tr><th>เลขที่ใบรับสินค้า</th><th>ผู้ขาย</th><th>ใบกำกับผู้ขาย</th><th class="ctr">วันที่</th><th class="num">จำนวน</th><th class="num">ทุน/หน่วย</th></tr></thead>
    <tbody>${buys.length?buys.map(p=>{const li=p.items.filter(i=>i.stockId===id), v=findVen(p.vendorId);
      return li.map(i=>`<tr class="click" onclick="openBill('gr','${p.id}')"><td class="mono" style="font-size:12px">${esc(p.no)}</td>
        <td>${esc((v&&v.name)||'-')}</td><td class="mono" style="font-size:12px">${esc(p.inv||'-')}</td>
        <td class="ctr">${thDate(p.date)}</td><td class="num">${qf(i.qty)}</td><td class="num">${money(i.cost)}</td></tr>`).join('')}).join('')
      :'<tr><td colspan="6" class="empty">ยังไม่มีประวัติการรับเข้าจากใบรับสินค้า</td></tr>'}</tbody></table>
    <div style="font-weight:600;font-size:12.5px;margin:14px 0 6px">ความเคลื่อนไหวทั้งหมด</div>
    <table class="tbl"><thead><tr><th class="ctr">วันที่</th><th>ประเภท</th><th>อ้างอิง</th><th class="num">จำนวน</th></tr></thead>
    <tbody>${mv.length?mv.map(m=>`<tr><td class="ctr">${thDate(m.date)}</td>
      <td><span class="chip ${m.qty>=0?'g':'r'}">${m.type==='in'?'รับเข้า':m.type==='out'?'ตัดออก':'ปรับยอด'}</span></td>
      <td>${esc(m.ref)} ${m.refNo?'<span class="mono hint">'+esc(m.refNo)+'</span>':''}</td>
      <td class="num">${m.qty>0?'+':''}${qf(m.qty)}</td></tr>`).join('')
      :'<tr><td colspan="4" class="empty">ยังไม่มีความเคลื่อนไหว</td></tr>'}</tbody></table>`;
  openModal('mCard');
}
if($('#catBar')) $('#catBar').onchange=e=>setCat(e.target.value);
$('#stockSearchBottom').oninput=renderStock;
$('#stockFilterBottom').onchange=renderStock;
$('#sumTier').onchange=renderStock;

/* ==========================================================
   ผู้ขาย
   ========================================================== */
function vendorSpend(id){ return DB.purchases.filter(p=>p.vendorId===id&&!p.cancelled).reduce((a,p)=>a+grTotals(p).total,0); }
const BANKS=["ธนาคารกสิกรไทย","ธนาคารไทยพาณิชย์","ธนาคารกรุงเทพ","ธนาคารกรุงไทย","ธนาคารกรุงศรีอยุธยา",
  "ธนาคารทหารไทยธนชาต (ttb)","ธนาคารออมสิน","ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)","ธนาคารอาคารสงเคราะห์",
  "ธนาคารเกียรตินาคินภัทร","ธนาคารซีไอเอ็มบี ไทย","ธนาคารทิสโก้","ธนาคารยูโอบี","ธนาคารแลนด์ แอนด์ เฮ้าส์",
  "ธนาคารไอซีบีซี (ไทย)","ธนาคารสแตนดาร์ดชาร์เตอร์ด (ไทย)","ธนาคารอิสลามแห่งประเทศไทย","ธนาคารซิตี้แบงก์","พร้อมเพย์ / อื่น ๆ"];
function venCashToggle(){ const c=$('#vCash').checked; $('#vDays').disabled=c; if(c) $('#vDays').value=0; }
function venBankText(v){ if(!v) return '';
  const nm=v.bankName||'', no=v.bankNo||v.bank||'';
  return [nm,no].filter(Boolean).join(' ')+(v.bankAcc?' ('+v.bankAcc+')':''); }
function venTerm(v){ return (v&&(v.cash||!n(v.days)))?'เงินสด':n(v.days)+' วัน'; }
function venCatAll(v){ $$('.vck').forEach(el=>el.checked=v); }
function vendorsByCat(cat){ return DB.vendors.filter(v=>(v.cats||[]).includes(cat)); }
function renderVenCatFilter(){
  const cur=$('#venCatFilter').value;
  const cnt={}; DB.vendors.forEach(v=>(v.cats||[]).forEach(c=>cnt[c]=(cnt[c]||0)+1));
  $('#venCatFilter').innerHTML='<option value="">ทุกประเภทสินค้า</option>'
    +CATS.map(c=>`<option value="${c}">${c} (${cnt[c]||0})</option>`).join('')
    +'<option value="__none">ยังไม่ระบุประเภท</option>';
  $('#venCatFilter').value=cur;
}
function renderVen(){
  const q=($('#venSearch').value||'').toLowerCase().trim(), fc=$('#venCatFilter').value;
  renderVenCatFilter();
  let rows=DB.vendors.filter(v=>{
    if(fc==='__none'&&(v.cats||[]).length) return false;
    if(fc&&fc!=='__none'&&!(v.cats||[]).includes(fc)) return false;
    return !q||[v.name,v.tax,v.tel,v.contact,(v.cats||[]).join(' ')].some(x=>String(x||'').toLowerCase().includes(q));});
  rows=sortRows('venTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'ven');
  $('#venTbl tbody').innerHTML=rows.map(v=>`<tr>
    <td><span class="chip ${v.type==='company'?'a':''}">${v.type==='company'?'นิติบุคคล':'บุคคลธรรมดา'}</span></td>
    <td><b>${esc(v.name)}</b>${v.note?`<div class="hint">${esc(v.note)}</div>`:''}
      ${venBankText(v)?`<div class="hint mono">${esc(venBankText(v))}</div>`:''}</td>
    <td>${(v.cats||[]).length?(v.cats||[]).map(c=>`<span class="chip b" style="margin:1px 2px 1px 0">${esc(c)}</span>`).join(''):'<span class="hint">ยังไม่ระบุ</span>'}</td>
    <td style="font-size:12.5px">${esc(addrLine(v.addr))}</td>
    <td style="font-size:12.5px">${esc(v.contact||'-')}<div class="mono hint">${esc(v.tel||'')}</div></td>
    <td class="ctr">${(v.cash||!n(v.days))?'<span class="chip g">เงินสด</span>':'<span class="chip a">'+n(v.days)+' วัน</span>'}</td>
    <td class="num">${money(vendorSpend(v.id))}</td>
    ${byCell(v)}
    <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
      <button class="btn sm gh" onclick="openVen('${v.id}')">แก้ไข</button>
      <button class="btn sm gh" onclick="buyFrom('${v.id}')">เปิดใบรับสินค้า</button>
      <button class="btn sm dgr" onclick="delVen('${v.id}')">ลบ</button></div></td></tr>`).join('');
  $('#venEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('venTbl');
  $('#venCount').textContent=rows.length+' ราย';
  if(typeof mkCards==='function') mkCards('venTbl');
  refreshGRRefs();
}
$('#venSearch').oninput=renderVen; $('#venCatFilter').onchange=renderVen;
$('#vTypeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  $$('#vTypeSeg button').forEach(x=>x.classList.toggle('on',x===b))});
let editVenId=null;
function openVen(id){
  editVenId=id||null; const v=id?findVen(id):null;
  $('#mVenTitle').textContent=v?'แก้ไขข้อมูลผู้ขาย · '+v.name:'เพิ่มข้อมูลผู้ขาย';
  const t=(v&&v.type)||'company';
  $$('#vTypeSeg button').forEach(x=>x.classList.toggle('on',x.dataset.t===t));
  const a=(v&&v.addr)||{};
  $('#vName').value=(v&&v.name)||'';$('#vTax').value=(v&&v.tax)||'';$('#vDays').value=(v&&v.days)||30;
  $('#vNo').value=a.no||'';$('#vVillage').value=a.village||'';$('#vMoo').value=a.moo||'';$('#vSoi').value=a.soi||'';
  $('#vRoad').value=a.road||'';$('#vSub').value=a.sub||'';$('#vDist').value=a.dist||'';
  $('#vProv').value=a.prov||'กรุงเทพมหานคร';$('#vZip').value=a.zip||'';
  $('#vContact').value=(v&&v.contact)||'';$('#vTel').value=(v&&v.tel)||'';$('#vTel2').value=(v&&v.tel2)||'';
  $('#vBankName').innerHTML='<option value="">— ไม่ระบุธนาคาร —</option>'+BANKS.map(b=>`<option>${b}</option>`).join('');
  $('#vBankName').value=(v&&v.bankName)||'';
  $('#vBankNo').value=(v&&(v.bankNo||v.bank))||'';$('#vBankAcc').value=(v&&v.bankAcc)||'';
  $('#vNote').value=(v&&v.note)||'';
  $('#vCash').checked=!!(v&&(v.cash||(v&&!n(v.days)&&v.cash!==false)));
  if(!v) $('#vCash').checked=false;
  venCashToggle();
  const cs=(v&&v.cats)||[];
  $('#vCats').innerHTML=CATS.map(c=>`<label><input type="checkbox" class="vck" value="${c}" ${cs.includes(c)?'checked':''}> ${c}</label>`).join('');
  openModal('mVen');
}
function saveVen(){
  if(!can('doc.venEdit')) return toast('บัญชีนี้ไม่มีสิทธิเพิ่ม/แก้ไขข้อมูลผู้ขาย');
  const name=$('#vName').value.trim(); if(!name) return toast('กรอกชื่อผู้ขายก่อนบันทึก');
  const rec={id:editVenId||uid(),type:$('#vTypeSeg button.on').dataset.t,name,tax:$('#vTax').value.trim(),
    days:$('#vCash').checked?0:n($('#vDays').value),contact:$('#vContact').value.trim(),tel:$('#vTel').value.trim(),tel2:$('#vTel2').value.trim(),
    cash:$('#vCash').checked,bankName:$('#vBankName').value,bankNo:$('#vBankNo').value.trim(),
    bankAcc:$('#vBankAcc').value.trim(),bank:[$('#vBankName').value,$('#vBankNo').value.trim()].filter(Boolean).join(' '),
    note:$('#vNote').value.trim(),
    cats:$$('.vck').filter(x=>x.checked).map(x=>x.value),
    addr:{no:$('#vNo').value.trim(),village:$('#vVillage').value.trim(),moo:$('#vMoo').value.trim(),soi:$('#vSoi').value.trim(),
      road:$('#vRoad').value.trim(),sub:$('#vSub').value.trim(),dist:$('#vDist').value.trim(),prov:$('#vProv').value,zip:$('#vZip').value.trim()}};
  const oldVen=editVenId?DB.vendors.find(x=>x.id===editVenId):null;
  stampRec(rec,oldVen);
  if(editVenId){const i=DB.vendors.findIndex(x=>x.id===editVenId);DB.vendors[i]=rec;} else DB.vendors.push(rec);
  logAudit('vendor',{id:rec.id,no:rec.name},'save',oldVen?'แก้ไขข้อมูลผู้ขาย':'เพิ่มผู้ขายใหม่');
  save();closeModal('mVen');renderVen();toast('บันทึกข้อมูลผู้ขายแล้ว');
}
async function delVen(id){
  if(!can('doc.venEdit')) return toast('บัญชีนี้ไม่มีสิทธิลบข้อมูลผู้ขาย'); if(DB.purchases.some(p=>p.vendorId===id)) return toast('ผู้ขายรายนี้มีประวัติการซื้อแล้ว ลบไม่ได้');
  if(!await askP({title:'ลบผู้ขาย',text:'ลบผู้ขายรายนี้?',yes:'ลบ',no:'ไม่ลบ'})) return; DB.vendors=DB.vendors.filter(x=>x.id!==id);save();renderVen();toast('ลบแล้ว'); }
function buyFrom(id){ go('buy'); buyGo('gr'); newGR(); $('#grVendor').value=id; grVenSync(); G.vendorId=id; calcGR(); }

/* ==========================================================
   ซื้อสินค้า / ใบรับสินค้า
   ========================================================== */
let G=null;
function blankGR(){ return {id:uid(),no:'',date:iso(),vendorId:'',inv:'',invDate:iso(),term:'cash',days:30,due:'',
  paid:false,payDate:'',by:'',check:'',note:'',items:[],disc:0,vat:vatDefault(),posted:false,apv:{status:'draft',byName:'',date:'',note:''}}; }
function newGR(silent){ G=blankGR(); fillGRForm(); if(silent) return; openModal('mGREdit'); toast('เริ่มใบรับสินค้าใหม่'); }
function fillGRForm(){ grAdjReset();
  $('#grNo').textContent=G.no?('เลขที่ '+G.no+(G.posted?' · รับเข้าสต๊อกแล้ว':'')):'เอกสารใหม่ (ยังไม่บันทึก)';
  $('#grDate').value=G.date;$('#grInv').value=G.inv;$('#grInvDate').value=G.invDate;
  $('#grTerm').value=G.term;$('#grDays').value=G.days;$('#grPaid').value=G.paid?'1':'0';
  $('#grBy').value=G.by;$('#grCheck').value=G.check;$('#grNote').value=G.note;
  $('#grDisc').value=G.disc;$('#grVat').value=G.vat;
  refreshGRRefs(); $('#grVendor').value=G.vendorId; grVenSync(); renderGRItems(); renderApvBars();
}
function refreshGRRefs(){
  /* ช่องผู้ขายเป็นช่องพิมพ์ค้นหาแล้ว (ค่าจริงเก็บใน input ซ่อน #grVendor เหมือนเดิม
     โค้ดเดิมทุกจุดที่อ่าน/เขียน .value จึงใช้ต่อได้ไม่ต้องแก้) */
  const cur=$('#grVendor').value;
  $('#grVendor').value=cur||(G?G.vendorId:'')||'';
  grVenSync();
  const co=$('#grOpen').value;
  $('#grOpen').innerHTML='<option value="">— เปิดใบรับสินค้าที่บันทึกไว้ —</option>'+DB.purchases.slice().reverse().map(p=>{
    const v=findVen(p.vendorId);
    return `<option value="${p.id}">${esc(p.no)} · ${thDate(p.date)} · ${esc((v&&v.name)||'-')} · ${money(grTotals(p).total)}</option>`}).join('');
  $('#grOpen').value=co; refreshStockList();
}
function blankGRLine(){ return {stockId:'',code:'',oem:'',name:'',cat:'อื่น ๆ',qty:1,cost:0}; }
function grFilled(it){ return !!(it&&(String(it.code||'').trim()||String(it.name||'').trim())); }
function grItemsClean(g){ return JSON.parse(JSON.stringify((g.items||[]).filter(grFilled))); }
/* เดิมเตรียมช่องว่างรอ 10 บรรทัด — ตอนนี้แถวเด้งเข้ามาเมื่อค้นหาเจอเท่านั้น
   (ใบเสนอราคา/ใบเสร็จยังใช้ padQLines/padRLines ของเดิม ไม่เกี่ยวกัน) */
function padGRLines(){ G.items=G.items||[]; }
function addGRLine(){ if(G.posted) return toast('ใบนี้รับเข้าสต๊อกแล้ว แก้ไขรายการไม่ได้');
  G.items.push(blankGRLine()); renderGRItems(); }
function renderGRItems(){
  padGRLines();
  const lock=!!G.posted;
  $('#grItems tbody').innerHTML=!G.items.length
    ?'<tr><td colspan="9" class="empty">ยังไม่มีรายการ — ค้นหาสินค้าด้านบน เจอแล้วแถวจะเด้งเข้ามาเอง · สินค้าที่ยังไม่เคยมีในสต๊อกใช้ปุ่ม "+ สินค้าใหม่"</td></tr>'
    :G.items.map((it,i)=>`<tr class="${GADJ.sel.has(i)?'gadjsel':''}">
    <td class="ctr">${lock?'':`<input type="checkbox" class="gsel" data-i="${i}" ${GADJ.sel.has(i)?'checked':''} style="width:auto">`}</td>
    <td class="ctr hint">${i+1}</td>
    <td>${lock?esc(it.code||''):`<input type="text" list="stockList" class="mono gcode" data-i="${i}" value="${esc(it.code)}" placeholder="รหัสอู่">`}</td>
    <td>${lock?esc(it.oem||''):`<input type="text" class="mono goem" data-i="${i}" value="${esc(it.oem)}">`}</td>
    <td>${lock?esc(it.name||''):`<input type="text" class="gname" data-i="${i}" value="${esc(it.name)}">`}</td>
    <td class="num">${lock?qf(it.qty):`<input type="number" class="gqty" data-i="${i}" value="${it.qty}" style="text-align:right">`}</td>
    <td class="num">${lock?money(it.cost):`<div class="costcell"><input type="number" class="gcost" data-i="${i}" value="${it.cost}" step="0.01" style="text-align:right"><button class="btn sm pri gplus" title="ปรับต้นทุนเฉพาะแถวนี้" onclick="openGrAdj(${i})"><i class="pkg-ic pkg-ic-scale pkg-ic-only" aria-hidden="true"></i></button></div>`}${grCostHint(it,i)}</td>
    <td class="num">${money(n(it.qty)*n(it.cost))}</td>
    <td class="ctr">${lock?'':`<button class="btn sm dgr" onclick="delGRLine(${i})">×</button>`}</td></tr>`).join('');
  if(!lock){
    $$('.gcode').forEach(el=>el.onchange=e=>{const i=+e.target.dataset.i, code=e.target.value.trim();
      const s=DB.stock.find(x=>x.code.toLowerCase()===code.toLowerCase());
      if(s){const fromStock=!n(G.items[i].cost);
        G.items[i]=Object.assign(G.items[i],{stockId:s.id,code:s.code,oem:s.oem,name:s.name,cat:s.cat||'อื่น ๆ',cost:n(G.items[i].cost)||n(s.cost)});
        if(fromStock) GADJ.stockSrc.add(i); else GADJ.stockSrc.delete(i);}
      else{G.items[i].code=code;G.items[i].stockId='';toast('รหัสใหม่ — ระบบจะสร้างสินค้านี้ในสต๊อกเมื่อบันทึก');}
      renderGRItems();});
    $$('.goem').forEach(el=>el.oninput=e=>G.items[+e.target.dataset.i].oem=e.target.value);
    $$('.gname').forEach(el=>el.oninput=e=>G.items[+e.target.dataset.i].name=e.target.value);
    $$('.gqty').forEach(el=>el.oninput=e=>{G.items[+e.target.dataset.i].qty=n(e.target.value);calcGR()});
    $$('.gcost').forEach(el=>el.oninput=e=>{const gi=+e.target.dataset.i;G.items[gi].cost=n(e.target.value);GADJ.stockSrc.delete(gi);calcGR();
      const td=e.target.closest('td'), old=td.querySelector('.prevcost');
      if(old) old.outerHTML=grCostHint(G.items[gi],gi); else td.insertAdjacentHTML('beforeend',grCostHint(G.items[gi],gi));});
    $$('.gsel').forEach(el=>el.onchange=e=>{const gi=+e.target.dataset.i;
      if(e.target.checked) GADJ.sel.add(gi); else GADJ.sel.delete(gi);
      e.target.closest('tr').classList.toggle('gadjsel',e.target.checked); grAdjSync();});
  }
  const li=$('#grLineInfo'); if(li) li.textContent=(lock?'ใบนี้รับเข้าสต๊อกแล้ว — ล็อกรายการไม่ให้แก้ไข':(G.items.length?('ในใบนี้ '+grItemsClean(G).length+' รายการ'):''));
  $$('#v-buy button[onclick^="addGRLine"]').forEach(b=>b.disabled=lock);
  calcGR(); grAdjSync();
}
function delGRLine(i){ if(G.posted) return toast('ใบนี้รับเข้าสต๊อกแล้ว แก้ไขรายการไม่ได้');
  G.items.splice(i,1); grAdjReset(); renderGRItems(); }
function calcGR(){
  G.date=$('#grDate').value||iso(); G.inv=$('#grInv').value; G.invDate=$('#grInvDate').value;
  G.vendorId=$('#grVendor').value; G.term=$('#grTerm').value; G.days=n($('#grDays').value);
  G.paid=$('#grPaid').value==='1'; G.by=$('#grBy').value; G.check=$('#grCheck').value; G.note=$('#grNote').value;
  G.disc=n($('#grDisc').value); G.vat=n($('#grVat').value);
  G.due=G.term==='credit'?addDays(G.date,G.days):G.date;
  $('#grDue').value=G.term==='credit'?thDate(G.due):'ชำระทันที';
  const t=grTotals(G);
  $('#grSub').textContent=money(t.sub);$('#grDiscOut').textContent=money(t.disc);
  $('#grVatOut').textContent=money(t.vat);$('#grTotal').textContent=money(t.total);
  const rows=$$('#grItems tbody tr');
  G.items.forEach((it,i)=>{if(rows[i])rows[i].children[7].textContent=money(n(it.qty)*n(it.cost))});   /* เพิ่มช่องติ๊ก +1 · ถอดช่องหมวด -1 · สุทธิช่องรวมเงินคือ index 7 */
}
['grDate','grInv','grInvDate','grDays','grBy','grCheck','grNote','grDisc'].forEach(id=>$('#'+id).oninput=calcGR);
['grVendor','grTerm','grPaid','grVat'].forEach(id=>$('#'+id).onchange=()=>{
  if(id==='grVendor'){const v=findVen($('#grVendor').value);
    if(v){ if(v.cash||!n(v.days)){$('#grTerm').value='cash';$('#grDays').value=0;}
      else {$('#grTerm').value='credit';$('#grDays').value=v.days;} }}
  calcGR();});
/* ==========================================================
   ปรับต้นทุนหลายแถวในใบรับสินค้า
   ใช้ได้ทั้งกิจการที่จด VAT (เฉลี่ยส่วนลดท้ายบิล / ค่าขนส่ง ลงต้นทุนรายชิ้น)
   และกิจการที่ไม่จด VAT (บวก VAT 7% เข้าต้นทุน เพราะขอคืนภาษีซื้อไม่ได้)
   ปุ่มลัด VAT 7% โผล่เฉพาะกิจการที่ไม่จด — กันกิจการที่จดกดซ้ำจนต้นทุนเฟ้อ 14%
   สถานะการติ๊ก/ปรับแล้ว เก็บนอกตัวเอกสาร (GADJ) ไม่ปนลงข้อมูลที่บันทึก
   ========================================================== */
/* stockSrc = แถวที่ราคาถูกเติมจากต้นทุนเดิมในสต๊อก (ยังไม่ได้พิมพ์เอง)
   ใช้แยก "ราคาจากบิลนี้" ออกจาก "ต้นทุนเดิมในระบบ" ให้ปุ่มติ๊กเฉพาะบิลนี้ */
let GADJ={sel:new Set(),done:new Set(),stockSrc:new Set(),snap:null,dir:1,mode:'pct',scope:null};
function grAdjReset(){ GADJ.sel.clear(); GADJ.done.clear(); GADJ.stockSrc.clear(); GADJ.snap=null; GADJ.scope=null;
  const u=$('#grAdjUndo'); if(u) u.style.display='none'; }
function grLineUsable(it){ return String((it&&(it.code||it.name))||'').trim()!==''; }
function grTickAll(v){ if(G.posted){ const a=$('#grSelAll'); if(a) a.checked=false; return; }
  GADJ.sel.clear(); if(v) G.items.forEach((it,i)=>{ if(grLineUsable(it)) GADJ.sel.add(i); });
  renderGRItems(); }
function grTickBillOnly(){
  if(G.posted) return;
  GADJ.sel.clear();
  G.items.forEach((it,i)=>{ if(grLineUsable(it)&&!GADJ.stockSrc.has(i)&&!GADJ.done.has(i)) GADJ.sel.add(i); });
  renderGRItems();
  toast(GADJ.sel.size?('ติ๊กเฉพาะแถวที่พิมพ์ราคาเองจากบิลนี้ '+GADJ.sel.size+' แถว')
    :'ไม่มีแถวที่พิมพ์ราคาเอง — ทุกแถวใช้ต้นทุนเดิมในระบบหรือปรับไปแล้ว');
}
function grAdjRows(){ return GADJ.scope===null
  ? [...GADJ.sel].filter(i=>G.items[i]).map(i=>({i,it:G.items[i]}))
  : (G.items[GADJ.scope]?[{i:GADJ.scope,it:G.items[GADJ.scope]}]:[]); }
function grAdjSync(){ const b=$('#grAdjBtn'); if(!b) return;
  const k=GADJ.sel.size, usable=G.items.filter(grLineUsable).length;
  b.innerHTML='<i class="pkg-ic pkg-ic-scale" aria-hidden="true"></i>ปรับต้นทุนแถวที่ติ๊ก'+(k?' ('+k+' แถว)':'');
  b.disabled=!!G.posted||!k;
  const inf=$('#grSelInfo');
  if(inf) inf.textContent=G.posted?'':(k?('ติ๊กไว้ '+k+' แถว จาก '+usable+' แถว'):'');
  const all=$('#grSelAll');
  if(all){ all.checked=usable>0&&k>=usable; all.disabled=!!G.posted; } }
function grCostHint(it,i){
  if(!grLineUsable(it)) return '';
  /* มีส่วนลดท้ายบิล = ต้นทุนที่เข้าสต๊อกจะต่ำกว่าราคาบนบิล — บอกให้เห็นตรงนี้เลย ไม่คิดลับหลัง */
  const uc=grUnitCost(G,it), showUc=n(G.disc)>0&&Math.abs(uc-n(it.cost))>=0.005
    ? ` <b style="color:var(--ok)">→ เข้าสต๊อก ${money(uc)}</b>` : '';
  const done=GADJ.done.has(i)?' <span class="chip g" style="font-size:10px;padding:0 5px">ปรับแล้ว</span>':'';
  const src=GADJ.stockSrc.has(i)
    ? ' <span class="chip" style="font-size:10px;padding:0 5px">ต้นทุนเดิมในระบบ</span>'
    : ' <span class="chip b" style="font-size:10px;padding:0 5px">ราคาจากบิลนี้</span>';
  const st=stockOfLine(it);
  if(!st) return `<div class="prevcost"><span class="chip b" style="font-size:10px;padding:0 5px">สินค้าใหม่ — ยังไม่เคยรับเข้า</span>${showUc}${done}</div>`;
  const d=n(it.cost)-n(st.cost);
  const mark=Math.abs(d)<0.005?'':d>0?` <span class="up">↑ ${money(d)}</span>`:` <span class="dn">↓ ${money(-d)}</span>`;
  return `<div class="prevcost">เดิมในระบบ ${money(st.cost)}${mark}${showUc}${src}${done}</div>`;
}
/* ---------- ค้นหาเพื่อเพิ่มแถว — แถวเด้งเมื่อเจอ ไม่มีช่องว่างรอ ---------- */
function grAddStock(s){
  if(!s) return;
  if(G.posted) return toast('ใบนี้รับเข้าสต๊อกแล้ว เพิ่มรายการไม่ได้');
  const idx=G.items.findIndex(it=>it.stockId===s.id
    ||(it.code&&String(it.code).toLowerCase()===String(s.code).toLowerCase()));
  if(idx>=0){ G.items[idx].qty=n(G.items[idx].qty)+1; renderGRItems(); grFocusQty(idx);
    return toast(s.code+' มีในใบแล้ว — เพิ่มจำนวนเป็น '+G.items[idx].qty); }
  G.items.push(Object.assign(blankGRLine(),{stockId:s.id,code:s.code,oem:s.oem||'',name:s.name,cat:s.cat||'อื่น ๆ',qty:1,cost:n(s.cost)}));
  GADJ.stockSrc.add(G.items.length-1);   /* ราคามาจากต้นทุนเดิมในระบบ จนกว่าผู้ใช้จะพิมพ์ทับ */
  renderGRItems(); grFocusQty(G.items.length-1);
  toast('เพิ่ม '+s.code+' · '+s.name);
}
function grFocusQty(i){ const r=$$('#grItems tbody tr')[i]; const q=r&&r.querySelector('.gqty'); if(q){ q.focus(); q.select(); } }
function grKwMatches(q){ q=String(q||'').toLowerCase();
  return q?DB.stock.filter(x=>[x.name,x.code,x.oem].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,12):[]; }
/* GRKW.hl = แถวที่ไฮไลต์อยู่ — ลูกศรขึ้นลงเลื่อน · Enter ดึงเข้าใบแล้วพิมพ์ตัวถัดไปต่อได้เลย */
let GRKW={list:[],hl:0};
function grKwRender(){
  const box=$('#grKwList'), q=($('#grKw').value||'').trim();
  if(!box) return;
  if(!q){ box.style.display='none'; GRKW={list:[],hl:0}; return; }
  const list=grKwMatches(q);
  GRKW={list:list,hl:list.length?0:-1};
  box.innerHTML=list.length?list.map((s,gi)=>`<div class="grpick-it${gi===0?' hl':''}" data-gi="${gi}" onmousedown="grPickKw('${s.id}')">
      <span class="nm"><b class="mono" style="font-size:12.5px">${esc(s.code)}</b> · ${esc(s.name)} <span style="color:var(--slate);font-size:11.5px">· ทุนเดิม ${money(s.cost)}</span></span>
      <span class="sub">คงเหลือ ${qf(s.qty)}</span></div>`).join('')
    :'<div class="grpick-emp">ไม่พบ — ลองคำอื่น หรือใช้ "ค้นหาละเอียด" / "+ สินค้าใหม่"</div>';
  box.style.display='';
}
function grPickKw(id){ const s=DB.stock.find(x=>x.id===id);
  $('#grKw').value=''; $('#grKwList').style.display='none';
  grAddStock(s); $('#grKw').focus(); }
/* ค้นหาละเอียด: บังคับลำดับ เลือกหมวดก่อน → พิมพ์ชื่อในหมวด */
/* ป๊อปอัพค้นหาละเอียดใช้ร่วมกัน 2 ปลายทาง — GFMODE บอกว่า "+ เพิ่ม" จะส่งของเข้าใบไหน */
let GFMODE='gr';
function gfOpen(mode){
  GFMODE=mode;
  $('#gfCat').innerHTML='<option value="">— ทุกหมวด —</option>'+CATS.map(c=>`<option>${esc(c)}</option>`).join('');
  $('#gfKw').value=''; gfRender(); openModal('mGrFind');
  setTimeout(()=>$('#gfCat').focus(),60);
}
function openGrFind(){
  if(G.posted) return toast('ใบนี้รับเข้าสต๊อกแล้ว เพิ่มรายการไม่ได้');
  gfOpen('gr');
}
function scFind(){
  if(typeof SC==='undefined'||!SC) return;
  if(SC.applied) return toast('ใบนี้ปรับยอดไปแล้ว เพิ่มรายการไม่ได้');
  if(SC.cancelled) return toast('ใบนี้ถูกยกเลิกแล้ว แก้ไขไม่ได้');
  gfOpen('count');
}
function gfPick(id){
  const st=DB.stock.find(x=>x.id===id); if(!st) return;
  if(GFMODE==='count') scAddStock(st); else grAddStock(st);
}
function gfRender(){
  const cat=$('#gfCat').value, q=($('#gfKw').value||'').trim().toLowerCase();
  let list=DB.stock.filter(x=>!cat||(x.cat||'อื่น ๆ')===cat);
  if(q) list=list.filter(x=>[x.name,x.code,x.oem].some(v=>String(v||'').toLowerCase().includes(q)));
  $('#gfCount').textContent=list.length+' รายการ';
  $('#gfBody').innerHTML=list.slice(0,80).map(s=>`<tr>
    <td class="mono" style="font-size:12px">${esc(s.code)}</td><td>${esc(s.name)}</td>
    <td>${esc(s.cat||'อื่น ๆ')}</td><td class="num">${qf(s.qty)}</td><td class="num">${money(s.cost)}</td>
    <td class="ctr"><button class="btn pri sm" onclick="gfPick('${s.id}')">+ เพิ่ม</button></td></tr>`).join('')
    ||'<tr><td colspan="6" class="empty">ไม่พบสินค้าตามเงื่อนไข</td></tr>';
}
if($('#grKw')){ $('#grKw').oninput=grKwRender;
  $('#grKw').onkeydown=e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault();
      if(!GRKW.list.length) return;
      GRKW.hl=(GRKW.hl+(e.key==='ArrowDown'?1:-1)+GRKW.list.length)%GRKW.list.length;
      $$('#grKwList .grpick-it').forEach(el=>{
        const on=+el.dataset.gi===GRKW.hl;
        el.classList.toggle('hl',on);
        if(on) el.scrollIntoView({block:'nearest'});
      }); return; }
    if(e.key==='Enter'){ e.preventDefault();
      if(GRKW.list.length&&GRKW.hl>=0) grPickKw(GRKW.list[GRKW.hl].id); return; }
    if(e.key==='Escape'){ const b=$('#grKwList'); if(b) b.style.display='none'; } };
  $('#grKw').onblur=()=>setTimeout(()=>{ const b=$('#grKwList'); if(b) b.style.display='none'; },200); }
function openGrAdj(one){
  if(G.posted) return toast('ใบนี้รับเข้าสต๊อกแล้ว แก้ไขต้นทุนไม่ได้');
  GADJ.scope=(typeof one==='number')?one:null;
  const s=grAdjRows();
  if(!s.length) return toast('ติ๊กเลือกแถวที่จะปรับต้นทุนก่อน หรือกดปุ่มปรับต้นทุนท้ายช่องต้นทุนของแถวนั้น');
  $('#gaScope').textContent=GADJ.scope===null
    ? s.length+' แถวที่ติ๊กไว้'
    : 'เฉพาะแถวนี้ · '+((G.items[GADJ.scope].code||'')||('แถวที่ '+(GADJ.scope+1)));
  $('#gaScope').className=GADJ.scope===null?'chip a':'chip b';
  $('#gaVal').value='';
  gaSetDir(1); gaSetMode('pct');
  openModal('mGrAdj'); setTimeout(()=>$('#gaVal').focus(),60);
  const dup=s.filter(x=>GADJ.done.has(x.i)).length;
  if(dup) toast('⚠ มี '+dup+' แถวที่เพิ่งปรับไปรอบก่อน — ดูตารางตัวอย่างก่อนกดยืนยัน กันปรับซ้ำ');
}
function gaSetDir(d){ GADJ.dir=d;
  $('#gaDirUp').classList.toggle('on',d===1);
  $('#gaDirDn').classList.toggle('on',d===-1);
  gaQuickBtns(); gaPreview(); }
function gaSetMode(m){ GADJ.mode=m;
  [['gaMpct','pct'],['gaMunit','unit'],['gaMlump','lump']].forEach(([id,k])=>{$('#'+id).classList.toggle('on',m===k);});
  $('#gaSuf').textContent=m==='pct'?'%':m==='unit'?'บาท/หน่วย':'บาททั้งก้อน';
  gaQuickBtns(); gaPreview(); }
function gaQuickBtns(){ const q=$('#gaQuick'); if(!q) return; let h='';
  if(GADJ.mode==='pct'&&GADJ.dir===1&&!isVatReg()) h+='<button class="btn pri sm" onclick="gaQuick(7)">VAT 7%</button>';
  if(GADJ.mode==='pct'){ const pcts=(GADJ.dir===1&&!isVatReg())?[3,5,10]:[3,5,7,10];   /* มีปุ่มทอง VAT 7% อยู่แล้วก็ไม่ใส่ 7 ซ้ำ */
    h+=pcts.map(v=>`<button class="btn gh sm" onclick="gaQuick(${v})">${v}%</button>`).join(''); }
  q.innerHTML=h; q.style.display=h?'flex':'none'; }
function gaQuick(v){ $('#gaVal').value=v; gaPreview(); }
function gaCompute(v){ const s=grAdjRows(), r2=x=>Math.round(x*100)/100;
  if(GADJ.mode==='lump'){
    /* เฉลี่ยตามสัดส่วนมูลค่า — แถวมูลค่ามากรับส่วนแบ่งมาก · ราคา/หน่วยปัด 2 ตำแหน่ง
       จึงอาจเหลือเศษสตางค์ ระบบแจ้งตรง ๆ ใน gaPreview ไม่ปัดกลบแบบเงียบ ๆ */
    const tot=s.reduce((a,x)=>a+n(x.it.qty)*n(x.it.cost),0);
    if(!tot) return s.map(x=>({i:x.i,it:x.it,nc:n(x.it.cost)}));
    return s.map(x=>{ const share=(n(x.it.qty)*n(x.it.cost))/tot;
      return {i:x.i,it:x.it,nc:Math.max(0,r2(n(x.it.cost)+GADJ.dir*(v*share)/Math.max(1,n(x.it.qty))))}; });
  }
  return s.map(x=>({i:x.i,it:x.it,
    nc:Math.max(0,r2(GADJ.mode==='pct'?n(x.it.cost)*(1+GADJ.dir*v/100):n(x.it.cost)+GADJ.dir*v))}));
}
function gaPreview(){ const v=n($('#gaVal').value);
  if(!(v>0)){ $('#gaPrevWrap').style.display='none'; $('#gaOk').disabled=true; return; }
  const out=gaCompute(v); let delta=0;
  $('#gaPrevBody').innerHTML=out.map(({it,i,nc})=>{ delta+=(nc-n(it.cost))*n(it.qty);
    return `<tr><td class="mono" style="font-size:12px;width:92px">${esc(it.code||'-')}${GADJ.done.has(i)?' <span class="chip r" style="font-size:10px">ปรับแล้ว</span>':''}</td>
      <td>${esc(String(it.name||'').slice(0,24))}</td>
      <td class="num" style="width:86px">${money(it.cost)}</td><td class="gaarw">→</td>
      <td class="num ganew ${nc>=n(it.cost)?'up':'dn'}" style="width:86px">${money(nc)}</td></tr>`; }).join('');
  $('#gaPrevLbl').textContent=delta>=0?'ต้นทุนรวมเพิ่มขึ้น':'ต้นทุนรวมลดลง';
  $('#gaPrevDelta').textContent=money(Math.abs(delta))+' บาท';
  const gap=$('#gaGap');
  if(GADJ.mode==='lump'&&Math.abs(Math.abs(delta)-v)>=0.005){ gap.style.display='';
    gap.textContent='หารลงรายชิ้นไม่ลงตัว เหลือเศษ '+money(Math.abs(Math.abs(delta)-v))+' บาท จากยอดที่ใส่ '+money(v)+' บาท'; }
  else gap.style.display='none';
  $('#gaPrevWrap').style.display=''; $('#gaOk').disabled=false; }
function gaApply(){ const v=n($('#gaVal').value); if(!(v>0)) return;
  /* จำไว้ว่าใบนี้เฉลี่ยส่วนลดลงต้นทุนแล้ว — ใช้เป็นเงื่อนไขตอนบันทึก (ดู saveGR) */
  GADJ.snap=G.items.map(it=>n(it.cost));
  const out=gaCompute(v);
  out.forEach(({i,nc})=>{ G.items[i].cost=nc; GADJ.done.add(i); });
  closeModal('mGrAdj'); renderGRItems();
  const u=$('#grAdjUndo'); if(u) u.style.display='';
  toast('ปรับต้นทุน '+out.length+' แถวแล้ว — กด "ย้อนกลับ" ได้ถ้ากดผิด'); }
function grAdjUndo(){ if(!GADJ.snap) return;
  GADJ.snap.forEach((c,i)=>{ if(G.items[i]) G.items[i].cost=c; });
  GADJ.snap=null; GADJ.done.clear();
  const u=$('#grAdjUndo'); if(u) u.style.display='none';
  renderGRItems(); toast('ย้อนต้นทุนกลับเป็นค่าก่อนกดปรับแล้ว'); }
async function saveGR(){ if(typeof pkgPermNeed==='function'&&!pkgPermNeed('buyGr',typeof G!=='undefined'&&G&&DB.purchases.some(x=>x.id===G.id)?'edit':'add')) return;
  if(G&&G.cancelled) return toast('ใบรับสินค้า '+G.no+' ถูกยกเลิกแล้ว แก้ไขไม่ได้ — ใช้ปุ่ม "คัดลอก" ในทะเบียนเพื่อทำใบใหม่');
  if(!G.vendorId) return toast('เลือกผู้ขายก่อนบันทึก');
  /* ชั้นกติกา — ใบใหม่ของกิจการที่ไม่จดทะเบียนต้องไม่มีบรรทัด VAT ติดไปกับเอกสาร
     (ใบเก่าที่ออกตอนยังจดทะเบียนอยู่ ยังเก็บอัตราเดิมของตัวเองไว้) */
  if(!G.no&&!isVatReg()&&n($('#grVat').value)>0){ $('#grVat').value='0'; G.vat=0;
    toast('กิจการไม่ได้จดทะเบียน VAT — ระบบปรับบรรทัด VAT เป็น 0 ให้แล้ว · VAT ที่จ่ายผู้ขายให้บวกเข้าต้นทุนด้วยปุ่ม "ปรับต้นทุน"'); }
  if(!grItemsClean(G).length) return toast('กรอกรายการสินค้าอย่างน้อย 1 บรรทัด');
  calcGR();
  const wasPosted=G.posted;
  if(!G.no) G.no=docNo('GR');
  if(wasPosted){ const orig=DB.purchases.find(x=>x.id===G.id);
    if(orig) G.items=JSON.parse(JSON.stringify(orig.items)); }
  G.items=grItemsClean(G);
  /* บันทึก = เก็บใบในสถานะรออนุมัติเท่านั้น — สินค้าเข้าสต๊อกทางเดียวคือปุ่ม "อนุมัติ"
     เดิมถ้าคนบันทึกมีสิทธิอนุมัติ ระบบแอบอนุมัติ+รับเข้าสต๊อกให้ทันทีตอนกดบันทึก
     ซ้ำซ้อนกับปุ่มอนุมัติและข้ามจังหวะตรวจทาน — ถอดออกแล้ว */
  if(!wasPosted&&apvOf(G).status==='draft'){ G.apv={status:'pending',by:DB.curEmp||'',byName:meName(),date:iso(),note:''}; }
  const i=DB.purchases.findIndex(x=>x.id===G.id);
  stampRec(G,i>=0?DB.purchases[i]:null);
  const gc=JSON.parse(JSON.stringify(G)); gc.items=grItemsClean(G);
  if(i>=0) DB.purchases[i]=gc; else DB.purchases.push(gc);
  logAudit('gr',G,'save','ยอดสุทธิ '+money(grTotals(G).total)+' บาท');
  save(); renderStock(); renderGRList(); refreshGRRefs(); renderVen(); renderGRItems();
  $('#grNo').textContent='เลขที่ '+G.no+(G.posted?' · รับเข้าสต๊อกแล้ว':' · รออนุมัติ');
  renderApvBars();
  saveFx('บันทึกเอกสารแล้ว',G.no);
  toast(wasPosted?'บันทึกการแก้ไขใบรับสินค้าแล้ว'
    :'บันทึกใบรับสินค้าแล้ว — สินค้าจะเข้าสต๊อกเมื่อกดปุ่ม "อนุมัติ"');
}
$('#grOpen').onchange=()=>{const id=$('#grOpen').value; if(!id) return;
  const p=DB.purchases.find(x=>x.id===id); if(!p) return; logAudit('gr',p,'open'); G=JSON.parse(JSON.stringify(p)); fillGRForm(); openModal('mGREdit'); toast('เปิด '+p.no);};
function renderGRList(){
  const q=($('#grSearch').value||'').toLowerCase().trim();
  /* ลำดับแนะนำ: วันที่รับสินค้าล่าสุดขึ้นก่อน
     (เดิมใช้ reverse() = เรียงตามลำดับที่บันทึกเข้าระบบ ทำให้ใบเก่าที่เพิ่งย้อนมาบันทึกเด้งขึ้นบนสุด) */
  let rows=DB.purchases.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))
    ||String(b.no||'').localeCompare(String(a.no||'')))
    .filter(p=>{const v=findVen(p.vendorId);
      return !q||[p.no,p.inv,(v&&v.name)].some(x=>String(x||'').toLowerCase().includes(q))});
  rows=applyDateFilter(rows,'grOvDate');
  rows=sortRows('grTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'gr');
  $('#grTbl tbody').innerHTML=rows.map(p=>{const v=findVen(p.vendorId), t=grTotals(p), late=!p.paid&&p.term==='credit'&&daysBetween(p.due,iso())>0;
    return `<tr${p.cancelled?' class="cancelrow"':''}><td class="mono" style="font-size:12px"><span class="docno" onclick="openGRById('${p.id}')">${p.cancelled?'<s>'+esc(p.no)+'</s>':esc(p.no)}</span>
        ${p.cancelled?`<div><span class="chip r" title="${esc(p.cancelReason||'')}">ยกเลิกแล้ว</span></div>`:''}</td><td class="ctr">${thDate(p.date)}</td>
      <td>${esc((v&&v.name)||'-')}</td><td class="mono" style="font-size:12px">${esc(p.inv||'-')}</td>
      <td class="ctr">${p.term==='credit'?thDate(p.due):'เงินสด'}</td><td class="num">${money(t.total)}</td>
      <td class="ctr">${p.cancelled?'<span class="hint">-</span>':apvOf(p).status==='approved'?'<span class="stbtn st-green">อนุมัติแล้ว</span>'
        :apvOf(p).status==='rejected'?'<span class="stbtn st-red">ตีกลับ</span>'
        :'<span class="stbtn st-orange">รออนุมัติ</span>'}
        ${p.posted||p.cancelled?'':'<div class="hint">ยังไม่เข้าสต๊อก</div>'}</td>
      <td class="ctr">${p.cancelled?'<span class="hint">-</span>':p.paid?`<span class="stbtn st-green" title="${esc(payMethodText(p))}">จ่ายแล้ว</span>`
        :(late?'<span class="stbtn st-red">เกินกำหนด</span>':'<span class="stbtn st-orange">รอจ่ายเจ้าหนี้</span>')}</td>
      ${byCell(p)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px;width:106px">
        <!-- เปิดใบ = คลิกเลขที่สีส้ม · บันทึกจ่ายเงิน = หน้า 08 เจ้าหนี้ ที่เดียว -->
        <button class="btn sm gh" onclick="copyGR('${p.id}')" title="คัดลอกรายการทั้งใบไปสร้างใบใหม่ — ใช้คู่กับการยกเลิกใบที่รับเข้าผิด">คัดลอก</button>
        ${p.cancelled?'':`<button class="btn sm dgr pc-delDoc" onclick="cancelGR('${p.id}')">ยกเลิก</button>`}</div></td></tr>`}).join('');
  $('#grEmpty').style.display=rows.length?'none':'block';
  if(typeof mkCards==='function') mkCards('grTbl');
  $('#grCount').textContent=rows.length+' ใบ';
  if(typeof paintSort==='function') paintSort('grTbl');
}
if($('#grSearch')) $('#grSearch').onkeydown=e=>{ if(e.key==='Enter') renderGRList(); };
const PAY_METHOD_LABEL={cash:'เงินสด',trans:'เงินโอน',card:'บัตรเครดิต/เดบิต',check:'เช็ค'};
function payMethodText(p){
  if(!p.paid) return '';
  if(!p.payMethod) return 'ชำระแล้ว วันที่ '+thDate(p.payDate)+' (ไม่มีรายละเอียดวิธีชำระ)';
  let m=PAY_METHOD_LABEL[p.payMethod]||p.payMethod;
  if(p.payMethod==='trans') m+=(p.payBank?' · '+p.payBank:'')+(p.payRef?' · อ้างอิง '+p.payRef:'');
  else if(p.payMethod==='card') m+=(p.payBank?' · '+p.payBank:'')+(p.payCard4?' เลขท้าย '+p.payCard4:'')+(p.payRef?' · เลขอนุมัติ '+p.payRef:'');
  else if(p.payMethod==='check') m+=(p.payBank?' · '+p.payBank:'')+(p.payRef?' · เลขที่เช็ค '+p.payRef:'')+(p.chkDate?' · ลงวันที่ '+thDate(p.chkDate):'');
  return 'ชำระแล้ว วันที่ '+thDate(p.payDate)+' · '+m+(p.payBy?' · ผู้จ่าย '+p.payBy:'');
}
function pgShowWrap(method){
  $('#pgTransWrap').style.display=method==='trans'?'':'none';
  $('#pgCardWrap').style.display=method==='card'?'':'none';
  $('#pgCheckWrap').style.display=method==='check'?'':'none';
}
let payGRCtx=null;
function payGR(id){ if(!can('doc.payGr')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกชำระเจ้าหนี้');
  const p=DB.purchases.find(x=>x.id===id); if(!p) return;
  payGRCtx=id;
  const v=findVen(p.vendorId);
  $('#pgInfo').innerHTML='ใบ <b>'+esc(p.no)+'</b> · ผู้ขาย '+esc((v&&v.name)||'-')+'<br>ยอดที่ต้องชำระ <b>'+money(grTotals(p).total)+' บาท</b> — เลือกวิธีชำระเงินก่อนยืนยัน';
  $$('#pgMethod button').forEach(b=>b.classList.toggle('on',b.dataset.m==='cash'));
  pgShowWrap('cash');
  $('#pgBank').value=''; $('#pgRef').value='';
  $('#pgCardBank').value=''; $('#pgCard4').value=''; $('#pgCardRef').value='';
  $('#pgChkBank').value=''; $('#pgChkNo').value=''; $('#pgChkDate').value='';
  $('#pgDate').value=iso(); $('#pgBy').value=''; $('#pgNote').value='';
  if(typeof fillBankList==='function') fillBankList();
  openModal('mPayGR');
}
$('#pgMethod').addEventListener('click',e=>{const b=e.target.closest('button'); if(!b) return;
  $$('#pgMethod button').forEach(x=>x.classList.toggle('on',x===b));
  pgShowWrap(b.dataset.m);
});
async function doPayGR(){
  const p=DB.purchases.find(x=>x.id===payGRCtx); if(!p) return;
  const method=$('#pgMethod button.on').dataset.m;
  if(method==='trans'&&!$('#pgBank').value.trim()) return toast('เลือกหรือกรอกบัญชีที่โอนจ่ายก่อน');
  if(method==='card'&&!$('#pgCardBank').value.trim()) return toast('กรอกธนาคาร / ผู้ให้บริการบัตรก่อน');
  if(method==='check'&&(!$('#pgChkBank').value.trim()||!$('#pgChkNo').value.trim())) return toast('กรอกธนาคารและเลขที่เช็คก่อน');
  if(!await askP({title:'ยืนยันชำระเงิน',text:'ยืนยันบันทึกชำระเงินใบ '+p.no+' ยอด '+money(grTotals(p).total)+' บาท ด้วย'+(PAY_METHOD_LABEL[method]||method)+'?',yes:'บันทึกชำระ',no:'ยังไม่บันทึก'})) return;
  p.paid=true; p.payDate=$('#pgDate').value||iso(); p.payMethod=method;
  p.payBank=''; p.payRef=''; p.payCard4=''; p.chkDate='';
  if(method==='trans'){ p.payBank=$('#pgBank').value.trim(); p.payRef=$('#pgRef').value.trim(); }
  else if(method==='card'){ p.payBank=$('#pgCardBank').value.trim(); p.payCard4=$('#pgCard4').value.trim(); p.payRef=$('#pgCardRef').value.trim(); }
  else if(method==='check'){ p.payBank=$('#pgChkBank').value.trim(); p.payRef=$('#pgChkNo').value.trim(); p.chkDate=$('#pgChkDate').value||''; }
  p.payBy=$('#pgBy').value.trim(); p.payNote=$('#pgNote').value.trim();
  const methodTxt=payMethodText(p).split(' · ').slice(1).join(' · ');
  logAudit('gr',p,'pay','จ่ายเจ้าหนี้ '+money(grTotals(p).total)+' บาท · '+methodTxt);
  save(); closeModal('mPayGR'); renderGRList(); renderHome();
  if(acctPane==='ap') renderAcctAP();   /* รีเฟรชทะเบียนเจ้าหนี้ในหัวข้อ 08 ถ้าเปิดอยู่ */
  toast('บันทึกชำระแล้ว ('+methodTxt+')');
}
/* ยกเลิกใบรับสินค้า — กติกาเดียวกับหมวด 03/04/07: เอกสารไม่หายจากทะเบียน
   ใบที่เข้าสต๊อกแล้วระบบดึงยอดออกให้ · รับเข้าผิดให้ยกเลิกแล้วกด "คัดลอก" ทำใบใหม่
   สต๊อกจะวิ่งออก-วิ่งกลับครบวงจร ตรวจย้อนหลังได้ทุกจังหวะ */
async function cancelGR(id){
  if(!can('doc.cancelDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกใบรับสินค้า');
  if(!can('doc.delDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกเอกสาร');
  const p=DB.purchases.find(x=>x.id===id); if(!p) return;
  if(p.cancelled) return toast('ใบรับสินค้า '+p.no+' ถูกยกเลิกไปแล้ว');
  if(p.posted&&typeof pkgFifo!=='undefined'&&pkgFifo.grUsed(p.no)) return toast('สินค้าจากใบรับ '+p.no+' ถูกตัดใช้ไปแล้ว ยกเลิกไม่ได้ — หากจำนวนไม่ตรงให้ปรับผ่าน “ตรวจนับสินค้า”');
  if(p.paid) return toast('ใบนี้บันทึกจ่ายเงินเจ้าหนี้แล้ว ยกเลิกไม่ได้ — ต้องแก้รายการจ่ายที่หน้า 08 · เจ้าหนี้ ก่อน');
  const reason=await askPromptP({title:'ยกเลิกใบรับสินค้า '+p.no,
    text:'ระบุเหตุผลที่ยกเลิก (ไม่บังคับ)'
      +(p.posted?'\n\nใบนี้รับเข้าสต๊อกแล้ว ระบบจะดึงยอดสต๊อกออกให้อัตโนมัติ':'\n\nใบนี้ยังไม่เข้าสต๊อก จึงไม่มียอดต้องดึงออก')
      +'\n\nใบที่ยกเลิกยังอยู่ในทะเบียนให้ดูย้อนหลังได้ แต่แก้ไขไม่ได้อีก — ใช้ปุ่ม "คัดลอก" เพื่อทำใบใหม่',
    yes:'ยืนยันยกเลิก',no:'ไม่ยกเลิก'});
  if(reason===null) return;
  const undo=!!p.posted;
  if(undo){ grItemsClean(p).forEach(it=>{ const s2=stockOfLine(it);
      if(s2){ s2.qty=n(s2.qty)-n(it.qty); s2.lastMove=iso();
        logMove(s2.id,'adj',-n(it.qty),iso(),'ดึงสต๊อกออกจากการยกเลิกใบรับสินค้า',p.no); }});
    p.posted=false; }
  p.cancelled=true; p.cancelReason=String(reason||'').trim(); p.cancelDate=iso();
  logAudit('gr',p,'del','ยกเลิกใบรับสินค้า'+(undo?' · ดึงสต๊อกออกแล้ว':'')+(p.cancelReason?' — '+p.cancelReason:''));
  save(); renderStock(); renderGRList();
  if(G&&G.id===p.id){ G.cancelled=true; G.posted=false; }
  toast('ยกเลิกใบรับสินค้า '+p.no+' แล้ว'+(undo?' · ดึงสต๊อกออกเรียบร้อย':'')+' — กด "คัดลอก" เพื่อทำใบใหม่ได้เลย');
}
/* คัดลอกทั้งใบไปเป็นใบใหม่ — รายการ ราคา ผู้ขาย ติดมาครบ แต่สถานะเริ่มนับหนึ่งใหม่ */
function copyGR(id){
  const src=DB.purchases.find(x=>x.id===id); if(!src) return;
  G=JSON.parse(JSON.stringify(src));
  G.id=uid(); G.no=''; G.date=iso();
  G.posted=false; G.paid=false; G.payDate=''; G.payMethod=''; G.payBank=''; G.payRef=''; G.payCard4=''; G.chkDate='';
  G.cancelled=false; G.cancelReason=''; G.cancelDate='';
  G.apv={status:'draft',byName:'',date:'',note:''};
  G.copiedFrom=src.no;
  G.note=(G.note?G.note+' · ':'')+'คัดลอกจาก '+src.no;
  ['createdBy','createdByName','createdAt','updatedBy','updatedByName','updatedAt'].forEach(k=>delete G[k]);
  fillGRForm(); go('buy'); buyGo('gr'); openModal('mGREdit');
  toast('คัดลอกจาก '+src.no+' แล้ว — แก้ไขรายการให้ถูกต้องแล้วบันทึกเป็นใบใหม่');
}

/* ==========================================================
   ข้อมูลลูกค้า
   ========================================================== */
/* ---------- เกรดลูกค้า (ให้ดาว 1–5) ---------- */
const STAR_LABEL={5:'ลูกค้าคนสำคัญ (VIP)',4:'ลูกค้าประจำ',3:'ลูกค้าทั่วไป',2:'ลูกค้าขาจร',1:'ต้องติดตามเป็นพิเศษ',0:'ยังไม่จัดเกรด'};
let custStarFilter='';
function starHtml(v,id){
  v=n(v);
  const s=[1,2,3,4,5].map(i=>id
    ? `<i onclick="setStars('${id}',${i});event.stopPropagation()" title="${i} ดาว · ${STAR_LABEL[i]}">${i<=v?'<b>★</b>':'☆'}</i>`
    : (i<=v?'<b>★</b>':'☆')).join('');
  return `<span class="stars ${id?'click':''}">${s}</span>`;
}
function setStars(id,v){
  const c=findCust(id); if(!c) return;
  c.stars=(n(c.stars)===v)?0:v; save(); renderCust(); if(custPane==='list') renderCustList();
  toast(custName(c)+' → '+(n(c.stars)?n(c.stars)+' ดาว · '+STAR_LABEL[n(c.stars)]:'ล้างเกรดแล้ว'));
}
let formStars=0;
function setFormStars(v){ formStars=(formStars===v&&v!==0)?0:v; drawFormStars(); }
function drawFormStars(){
  $('#cStarsBox').innerHTML=[1,2,3,4,5].map(i=>
    `<i onclick="setFormStars(${i})" style="cursor:pointer;font-size:16px;color:${i<=formStars?'var(--amber)':'#d6dbe0'}">${i<=formStars?'★':'☆'}</i>`).join('');
  $('#cStarsLabel').textContent=STAR_LABEL[formStars]||STAR_LABEL[0];
}
function gradeStats(){
  const g={}; [5,4,3,2,1,0].forEach(k=>g[k]={star:k,cnt:0,veh:0,spend:0});
  DB.cust.forEach(c=>{const k=n(c.stars)||0, x=g[k];
    x.cnt++; x.veh+=(c.vehicles||[]).length; x.spend+=custSpend(c.id)});
  return [5,4,3,2,1,0].map(k=>g[k]);
}
function renderStarBar(){
  const g=gradeStats(), tot=DB.cust.length;
  $('#starBar').innerHTML=`<button class="${custStarFilter===''?'on':''}" onclick="setStarFilter('')">ลูกค้าทั้งหมด<span class="c">${tot}</span></button>`
    +g.map(x=>`<button class="${custStarFilter===String(x.star)?'on':''}" onclick="setStarFilter('${x.star}')">
      ${x.star?`<span class="st">${'★'.repeat(x.star)}</span>`:'ยังไม่จัดเกรด'} ${x.star?STAR_LABEL[x.star]:''}<span class="c">${x.cnt}</span></button>`).join('');
}
function setStarFilter(v){ custStarFilter=v; renderCust(); go('cust'); window.scrollTo(0,0); }
function renderGrade(){
  const g=gradeStats(), totSpend=g.reduce((a,x)=>a+x.spend,0), totCnt=g.reduce((a,x)=>a+x.cnt,0);
  const mx=Math.max(1,...g.map(x=>x.spend));
  $('#gradeTag').textContent=totCnt+' ราย';
  $('#gradeTbl tbody').innerHTML=g.map(x=>`<tr class="click" onclick="setStarFilter('${x.star}')" style="${x.cnt?'':'opacity:.45'}">
    <td>${starHtml(x.star,'')}</td><td>${esc(STAR_LABEL[x.star])}</td>
    <td class="num">${x.cnt}</td><td class="num">${x.veh}</td><td class="num">${money(x.spend)}</td>
    <td class="num">${money(x.cnt?x.spend/x.cnt:0)}</td>
    <td><div class="mbar"><i style="width:${Math.round(x.spend/mx*100)}%"></i></div>
      <div class="hint mono" style="margin-top:2px">${totSpend?(x.spend/totSpend*100).toFixed(1):'0.0'}%</div></td>
    <td class="ctr"><button class="btn sm gh" onclick="setStarFilter('${x.star}');event.stopPropagation()">ดูรายชื่อ</button></td></tr>`).join('');
  $('#gradeTbl tfoot').innerHTML=`<tr><td colspan="2">รวมลูกค้าทั้งหมด</td><td class="num">${totCnt}</td>
    <td class="num">${g.reduce((a,x)=>a+x.veh,0)}</td><td class="num">${money(totSpend)}</td>
    <td class="num">${money(totCnt?totSpend/totCnt:0)}</td><td colspan="2" class="hint">ยอดซ่อมสะสมคำนวณจากใบเสร็จรับเงินทั้งหมด</td></tr>`;
  if(typeof renderGradeList==='function') renderGradeList();
}

/* ใบเสร็จที่ยกเลิกแล้วไม่ใช่ยอดซ่อมจริง — ต้องไม่นับ ไม่งั้นลูกค้าได้เกรดดาวเกินจริง
   ตัวนี้ใช้ร่วมกัน 4 ที่: คอลัมน์ยอดซ่อมสะสม · ตัวเรียงคอลัมน์ · ตารางสรุปเกรด · รายชื่อตามเกรด */
function custSpend(id){ return DB.receipts.filter(r=>r.custId===id&&!r.cancelled).reduce((a,r)=>a+receiptTotals(r).gross,0); }
/* รายชื่อลูกค้าตามเกรด — อยู่ในหน้าเดียวกับตารางสรุป ไม่ต้องกระโดดกลับแท็บแรกอีก */
function renderGradeList(){
  const gsel=($('#starGrade')||{}).value??'';
  let rows=DB.cust.filter(c=>gsel===''||String(n(c.stars)||0)===gsel)
    .map(c=>({c,spend:custSpend(c.id)}));
  rows.sort((a,b)=>b.spend-a.spend||String(custName(a.c)||'').localeCompare(String(custName(b.c)||''),'th'));
  /* ⚠️ เรียงก่อนตัดแถวเสมอ */
  rows=limitRows(rows,'star');
  $('#starTbl tbody').innerHTML=rows.map(({c,spend})=>{
    const plates=(c.vehicles||[]).map(plateOf).filter(x=>x&&x!=='-');
    return `<tr class="click" onclick="openCust('${c.id}')">
      <td>${starHtml(n(c.stars)||0,'')}</td>
      <td><b>${esc(custName(c)||'-')}</b></td>
      <td class="mono" style="font-size:12.5px">${esc(c.tel||'-')}</td>
      <td class="mono" style="font-size:12.5px">${esc(plates.slice(0,3).join(' · ')||'-')}${plates.length>3?' <span class="hint">+'+(plates.length-3)+'</span>':''}</td>
      <td class="num">${(c.vehicles||[]).length}</td>
      <td class="num"><b>${money(spend)}</b></td>
      <td class="ctr"><button class="btn sm gh" onclick="openCust('${c.id}');event.stopPropagation()">เปิดแฟ้ม</button></td></tr>`;}).join('');
  $('#starEmpty').style.display=rows.length?'none':'block';
  const tag=$('#starTag'); if(tag) tag.textContent=rows.length+' ราย';
}
if($('#starGrade')) $('#starGrade').onchange=renderGradeList;
function renderCust(){
  const q=($('#custSearch').value||'').toLowerCase().trim();
  let rows=DB.cust.filter(c=>{
    if(custStarFilter!==''&&String(n(c.stars)||0)!==custStarFilter) return false;
    return !q||[c.name,c.company,c.tax,c.tel,c.tel2].some(v=>String(v||'').toLowerCase().includes(q))
      ||(c.vehicles||[]).some(v=>plateOf(v).toLowerCase().includes(q));});
  rows=sortRows('custTbl',rows);   /* กดหัวคอลัมน์เพื่อเรียง */
  $('#custTbl tbody').innerHTML=rows.map(c=>`<tr>
    <td><span class="chip ${c.type==='company'?'a':''}">${c.type==='company'?'นิติบุคคล':'บุคคลธรรมดา'}</span></td>
    <td><b>${esc(custName(c))}</b>${c.type==='company'&&c.name?`<div class="hint">ผู้นำมาซ่อม: ${esc(c.name)}</div>`:''}<div class="hint">ระดับราคา ${esc(c.tier||'B')}</div></td>
    <td>${starHtml(n(c.stars),c.id)}<div class="hint">${esc(STAR_LABEL[n(c.stars)]||STAR_LABEL[0])}</div></td>
    <td class="mono" style="font-size:12.5px">${esc(c.tax||'-')}</td>
    <td style="font-size:12.5px">${esc(addrLine(c.addr))}</td>
    <td class="mono" style="font-size:12.5px">${esc(c.tel||'-')}${c.tel2?'<br>'+esc(c.tel2):''}</td>
    <td style="font-size:12.5px">${(c.vehicles||[]).map(v=>esc(vehLabel(v))).join('<br>')||'-'}</td>
    <td class="num">${money(custSpend(c.id))}</td>
    <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
      <button class="btn sm gh" onclick="openCust('${c.id}')">แก้ไข</button>
      <button class="btn sm gh" onclick="quoteFor('${c.id}')">เปิดใบเสนอราคา</button>
      <button class="btn sm dgr" onclick="delCust('${c.id}')">ลบ</button></div></td></tr>`).join('');
  $('#custEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('custTbl');
  $('#custCount').textContent=rows.length+' ราย'+(custStarFilter!==''?' · '+(STAR_LABEL[+custStarFilter]||''):'');
  if(typeof mkCards==='function') mkCards('custTbl');
  renderStarBar(); renderGrade(); refreshQuoteRefs();
  if(typeof renderCustList==='function'&&custPane==='list') renderCustList();
}
$('#custSearch').oninput=renderCust;
$('#cTypeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  $$('#cTypeSeg button').forEach(x=>x.classList.toggle('on',x===b));
  $('#cCoWrap').style.display=b.dataset.t==='company'?'grid':'none';});
let editCustId=null;
function vehRow(v){ v=v||{};
  return `<div class="grid g6" style="border:1px solid var(--line2);padding:8px;border-radius:2px;margin-bottom:7px">
    <label class="f"><span>ยี่ห้อรถ</span><select class="vBrand">${BRANDS.map(b=>`<option ${v.brand===b?'selected':''}>${b}</option>`).join('')}</select></label>
    <label class="f"><span>รุ่นรถ</span><input type="text" class="vModel" value="${esc(v.model)}"></label>
    <label class="f"><span>สีรถ</span><input type="text" class="vColor" value="${esc(v.color)}"></label>
    <label class="f"><span>ทะเบียน · หมวดอักษร</span><input type="text" class="vPL mono" list="plateList" value="${esc(v.plateL)}"></label>
    <label class="f"><span>ทะเบียน · หมวดตัวเลข</span><input type="text" class="vPN mono" maxlength="4" value="${esc(v.plateN)}"></label>
    <label class="f"><span>จังหวัดทะเบียน</span><select class="vPP">${PROVINCES.map(p=>`<option ${v.plateProv===p?'selected':''}>${p}</option>`).join('')}</select></label>
    <label class="f"><span>เลขไมล์ล่าสุด</span><input type="number" class="vMile" value="${v.mile||''}"></label>
    <label class="f"><span>เลขเครื่องยนต์</span><input type="text" class="vEngine mono" value="${esc(v.engine||'')}"></label>
    <label class="f"><span>หมายเลขตัวถัง (VIN)</span><input type="text" class="vVin mono" value="${esc(v.vin)}"></label>
    <label class="f"><span>ปีจดทะเบียน</span><input type="text" class="vYear" value="${esc(v.year)}"></label>
    <div style="display:flex;align-items:flex-end;padding-bottom:9px"><button class="btn sm dgr" onclick="this.closest('div.grid').remove()">ลบคันนี้</button></div>
  </div>`; }
function addVeh(v){ $('#vehWrap').insertAdjacentHTML('beforeend',vehRow(v)); }
function openCust(id){
  editCustId=id||null; const c=id?findCust(id):null;
  $('#mCustTitle').textContent=c?'แก้ไขลูกค้า · '+custName(c):'เพิ่มลูกค้า';
  setByBox('mCustByBox',c);   /* ชื่อผู้บันทึกอยู่ในฟอร์ม ไม่โชว์ในตารางรายชื่อลูกค้า */
  const t=(c&&c.type)||'person';
  $$('#cTypeSeg button').forEach(x=>x.classList.toggle('on',x.dataset.t===t));
  $('#cCoWrap').style.display=t==='company'?'grid':'none';
  const a=(c&&c.addr)||{};
  $('#cTax').value=(c&&c.tax)||'';$('#cName').value=(c&&c.name)||'';$('#cCompany').value=(c&&c.company)||'';
  $('#cBranch').value=(c&&c.branch)||'';$('#cTier').value=(c&&c.tier)||'B';
  formStars=n(c&&c.stars)||0; drawFormStars();
  $('#aNo').value=a.no||'';$('#aVillage').value=a.village||'';$('#aMoo').value=a.moo||'';$('#aSoi').value=a.soi||'';
  $('#aRoad').value=a.road||'';$('#aSub').value=a.sub||'';$('#aDist').value=a.dist||'';
  $('#aProv').value=a.prov||'กรุงเทพมหานคร';$('#aZip').value=a.zip||'';
  $('#cTel').value=(c&&c.tel)||'';$('#cTel2').value=(c&&c.tel2)||'';
  $('#vehWrap').innerHTML=''; ((c&&c.vehicles)||[{}]).forEach(addVeh);
  openModal('mCust');
}
/* ==========================================================
   นำเข้าข้อมูลจากไฟล์ CSV (ลูกค้า / ทะเบียนสินค้า)
   - แบบฟอร์มดาวน์โหลดเป็น CSV มี BOM — เปิดใน Excel ภาษาไทยไม่เพี้ยน
   - ผู้ใช้ต้องบันทึกกลับเป็น "CSV UTF-8" เท่านั้น (มีหมายเหตุบนหน้าจอ)
   - กันซ้ำ: สินค้าเทียบรหัส · ลูกค้าเทียบชื่อ+เบอร์ · แถวซ้ำ/ไม่ครบ = ข้าม พร้อมสรุปให้เห็นก่อนยืนยัน
   ========================================================== */
function csvDownload(name,rows){
  const csv='\ufeff'+rows.map(r=>r.map(x=>{x=String(x==null?'':x);
    return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;}).join(',')).join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
function csvParse(text){
  text=String(text||'').replace(/^\ufeff/,'');
  const rows=[]; let row=[],cur='',q=false;
  for(let i=0;i<text.length;i++){ const ch=text[i];
    if(q){ if(ch==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else q=false; } else cur+=ch; }
    else if(ch==='"') q=true;
    else if(ch===','){ row.push(cur); cur=''; }
    else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n') i++;
      row.push(cur); rows.push(row); row=[]; cur=''; }
    else cur+=ch; }
  if(cur!==''||row.length){ row.push(cur); rows.push(row); }
  return rows.filter(r=>r.some(x=>String(x).trim()!==''));
}
function impCustForm(){
  csvDownload('แบบฟอร์มนำเข้าลูกค้า.csv',[
    ['ชื่อลูกค้า*','ชื่อบริษัท (ถ้าเป็นนิติบุคคล)','เบอร์โทร','เบอร์สำรอง','เลขผู้เสียภาษี','ที่อยู่','จังหวัด','ทะเบียนรถ','จังหวัดทะเบียน','ยี่ห้อรถ','รุ่นรถ'],
    ['สมชาย ใจดี','','0812345678','','','123 ถ.สุขุมวิท','กรุงเทพมหานคร','1กข 4567','กรุงเทพมหานคร','Toyota','Vigo'],
    ['วิภา รุ่งเรือง','บริษัท ขนส่งไทย จำกัด','021234567','0899999999','0105561234567','99 ถ.บางนา','สมุทรปราการ','2ฮค 8899','สมุทรปราการ','Isuzu','D-Max']]);
  toast('ดาวน์โหลดแบบฟอร์มแล้ว — กรอกใน Excel แล้วบันทึกเป็น CSV UTF-8');
}
function impStockForm(){
  csvDownload('แบบฟอร์มนำเข้าสินค้า.csv',[
    ['รหัสสินค้า(อู่)*','รหัส OEM','ชื่อสินค้า*','หมวด','หน่วย','จำนวนคงเหลือ','ต้นทุน/หน่วย','ราคาขาย A','ราคาขาย B','ราคาขาย C','จุดสั่งซื้อ Min','สต๊อกสูงสุด Max'],
    ['BRK-001','04465-0K260','ผ้าเบรกหน้า Toyota Vigo','ระบบเบรก','ชุด','10','850','1300','1200','1100','2','20']]);
  toast('ดาวน์โหลดแบบฟอร์มแล้ว — กรอกใน Excel แล้วบันทึกเป็น CSV UTF-8');
}
let IMPMODE='';
function impPick(mode){
  if(!can('doc.import')) return toast('บัญชีนี้ไม่มีสิทธินำเข้าข้อมูล');
  if(mode==='stock'&&!can('stock.edit')) return toast('บัญชีนี้ไม่มีสิทธิเพิ่ม/แก้ไขสินค้า');
  IMPMODE=mode;
  const f=$('#impCsvFile'); if(!f) return;
  if(!f._bound){ f._bound=true; f.onchange=impFileChanged; }
  f.value=''; f.click();
}
async function impFileChanged(){
  const f=$('#impCsvFile'), file=f.files&&f.files[0]; if(!file) return;
  let rows=[];
  try{ rows=csvParse(await file.text()); }
  catch(e){ return toast('อ่านไฟล์ไม่ได้ — ตรวจว่าเป็นไฟล์ CSV'); }
  if(!rows.length) return toast('ไฟล์ว่าง หรืออ่านไม่ได้ — ตรวจว่าบันทึกเป็น CSV UTF-8');
  const h=String(rows[0][0]||'');
  if(h.includes('ชื่อลูกค้า')||h.includes('รหัสสินค้า')) rows.shift();   /* ตัดแถวหัวตาราง */
  if(!rows.length) return toast('ไม่มีข้อมูลใต้หัวตาราง');
  if(IMPMODE==='cust') await impCustApply(rows); else await impStockApply(rows);
}
async function impCustApply(rows){
  const add=[]; let skip=0;
  rows.forEach(r=>{ const g=i=>String(r[i]==null?'':r[i]).trim();
    const name=g(0),company=g(1),tel=g(2),tel2=g(3),tax=g(4),addr1=g(5),prov=g(6),
      plate=g(7),pprov=g(8),brand=g(9),model=g(10);
    if(!name){ skip++; return; }
    if(DB.cust.some(c=>(c.name||'')===name&&(!tel||(c.tel||'')===tel))){ skip++; return; }
    let plateL='',plateN='';
    if(plate){ const parts=plate.split(/\s+/); plateN=parts.length>1?parts.pop():''; plateL=parts.join(' ')||plate; }
    const rec={id:uid(),type:company?'company':'person',tax:tax,name:name,company:company,branch:'',tier:'B',stars:0,
      addr:{no:addr1,village:'',moo:'',soi:'',road:'',sub:'',dist:'',prov:prov,zip:''},
      tel:tel,tel2:tel2,
      vehicles:(plate||brand||model)?[{brand:brand,model:model,color:'',plateL:plateL,plateN:plateN,plateProv:pprov,mile:'',engine:'',vin:'',year:''}]:[]};
    stampRec(rec,null); add.push(rec); });
  if(!add.length) return toast('ไม่มีรายการใหม่ให้เพิ่ม — ข้าม '+skip+' แถว (ชื่อว่างหรือซ้ำกับที่มีอยู่)');
  if(!await askP({title:'นำเข้าลูกค้าจาก CSV',
    text:'พบลูกค้าใหม่ '+add.length+' ราย'+(skip?'\nข้าม '+skip+' แถว (ชื่อว่าง หรือชื่อ+เบอร์ซ้ำกับที่มีอยู่)':'')+'\n\nยืนยันนำเข้า?',
    yes:'นำเข้า',no:'ยกเลิก'})) return;
  add.forEach(c=>DB.cust.push(c));
  logAudit('cust',{id:'',no:'CSV'},'save','นำเข้าลูกค้าจากไฟล์ '+add.length+' ราย · ข้าม '+skip+' แถว');
  save(); renderCust(); if(typeof renderGrade==='function') renderGrade(); refreshQuoteRefs();
  saveFx('นำเข้าลูกค้าแล้ว',add.length+' ราย');
  toast('นำเข้าลูกค้า '+add.length+' ราย'+(skip?' · ข้าม '+skip+' แถว':''));
}
async function impStockApply(rows){
  const nn=v=>n(String(v==null?'':v).replace(/,/g,''));
  const add=[]; let skip=0;
  rows.forEach(r=>{ const g=i=>String(r[i]==null?'':r[i]).trim();
    const code=g(0),oem=g(1),name=g(2),cat=g(3),unit=g(4);
    if(!code||!name){ skip++; return; }
    if(DB.stock.some(x=>String(x.code||'').toLowerCase()===code.toLowerCase())){ skip++; return; }
    if(add.some(x=>x.code.toLowerCase()===code.toLowerCase())){ skip++; return; }   /* ซ้ำกันเองในไฟล์ */
    const rec={id:uid(),code:code,oem:oem,name:name,cat:cat||'อื่น ๆ',unit:unit||'ชิ้น',
      qty:nn(r[5]),cost:nn(r[6]),pa:nn(r[7]),pb:nn(r[8]),pc:nn(r[9]),min:nn(r[10]),max:nn(r[11]),
      lastMove:iso(),loc:'',zone:'',shelf:'',warr:''};
    stampRec(rec,null); add.push(rec); });
  if(!add.length) return toast('ไม่มีรายการใหม่ให้เพิ่ม — ข้าม '+skip+' แถว (ข้อมูลไม่ครบหรือรหัสซ้ำ)');
  if(!await askP({title:'นำเข้าสินค้าจาก CSV',
    text:'พบสินค้าใหม่ '+add.length+' รายการ'+(skip?'\nข้าม '+skip+' แถว (รหัส/ชื่อว่าง หรือรหัสซ้ำ)':'')
      +'\nยอดคงเหลือที่นำเข้าถือเป็นยอดยกมา\n\nยืนยันนำเข้า?',
    yes:'นำเข้า',no:'ยกเลิก'})) return;
  add.forEach(x=>{ DB.stock.push(x);
    if(n(x.qty)>0) logMove(x.id,'in',n(x.qty),iso(),'ยอดยกมาจากการนำเข้าไฟล์ CSV','CSV'); });
  logAudit('stock',{id:'',no:'CSV'},'save','นำเข้าสินค้าจากไฟล์ '+add.length+' รายการ · ข้าม '+skip+' แถว');
  save(); renderStock();
  saveFx('นำเข้าสินค้าแล้ว',add.length+' รายการ');
  toast('นำเข้าสินค้า '+add.length+' รายการ'+(skip?' · ข้าม '+skip+' แถว':''));
}
function saveCust(){
  if(!can('doc.custEdit')) return toast('บัญชีนี้ไม่มีสิทธิเพิ่ม/แก้ไขข้อมูลลูกค้า');
  const name=$('#cName').value.trim(); if(!name) return toast('กรอกชื่อเจ้าของ / ผู้นำมาซ่อมก่อนบันทึก');
  const vehicles=$$('#vehWrap > div.grid').map(r=>({
    brand:r.querySelector('.vBrand').value,model:r.querySelector('.vModel').value.trim(),
    color:r.querySelector('.vColor').value.trim(),plateL:r.querySelector('.vPL').value.trim(),
    plateN:r.querySelector('.vPN').value.trim(),plateProv:r.querySelector('.vPP').value,
    mile:r.querySelector('.vMile').value,engine:r.querySelector('.vEngine').value.trim(),
    vin:r.querySelector('.vVin').value.trim(),year:r.querySelector('.vYear').value.trim()
  })).filter(v=>v.model||v.plateN||v.plateL);
  const rec={id:editCustId||uid(),type:$('#cTypeSeg button.on').dataset.t,tax:$('#cTax').value.trim(),name,
    company:$('#cCompany').value.trim(),branch:$('#cBranch').value.trim(),tier:$('#cTier').value,stars:formStars,
    addr:{no:$('#aNo').value.trim(),village:$('#aVillage').value.trim(),moo:$('#aMoo').value.trim(),soi:$('#aSoi').value.trim(),
      road:$('#aRoad').value.trim(),sub:$('#aSub').value.trim(),dist:$('#aDist').value.trim(),prov:$('#aProv').value,zip:$('#aZip').value.trim()},
    tel:$('#cTel').value.trim(),tel2:$('#cTel2').value.trim(),vehicles};
  const oldCust=editCustId?DB.cust.find(x=>x.id===editCustId):null;
  stampRec(rec,oldCust);
  if(editCustId){const i=DB.cust.findIndex(x=>x.id===editCustId);DB.cust[i]=rec;} else DB.cust.push(rec);
  logAudit('cust',{id:rec.id,no:rec.name},'save',(oldCust?'แก้ไขข้อมูลลูกค้า':'เพิ่มลูกค้าใหม่')+' · รถ '+vehicles.length+' คัน');
  save();closeModal('mCust');
  $('#clFilter').value='';$('#clSearch').value='';
  renderCust();renderCustList();toast('บันทึกข้อมูลลูกค้าแล้ว');
}
async function delCust(id){
  if(!can('doc.custEdit')) return toast('บัญชีนี้ไม่มีสิทธิลบข้อมูลลูกค้า'); const c=findCust(id);
  if(DB.quotes.some(q=>q.custId===id)) return toast('ลูกค้ารายนี้มีเอกสารในระบบแล้ว ลบไม่ได้');
  if(!await askP({title:'ลบลูกค้า',text:'ลบลูกค้า '+custName(c)+' ?',yes:'ลบ',no:'ไม่ลบ'})) return;
  DB.cust=DB.cust.filter(x=>x.id!==id);save();renderCust();toast('ลบแล้ว'); }
function quoteFor(id){ newQuote(); $('#qCust').value=id; qCustSyncLabel(); Q.custId=id; fillVehSelect(); renderQPrev(); go('quote'); }

/* ==========================================================
   ใบเสนอราคา / ใบอนุมัติซ่อม
   ========================================================== */
let Q=null;
const FIND_ACT=[['fix','ซ่อม'],['part','เปลี่ยนอะไหล่บางชิ้น'],['new','เปลี่ยนอะไหล่ใหม่']];
function blankFinds(){ return Array.from({length:10},()=>({t:'',fix:false,part:false,new:false})); }
function normFinds(f){ const out=blankFinds();
  (f||[]).slice(0,10).forEach((x,i)=>{ if(typeof x==='string') out[i].t=x;
    else if(x&&typeof x==='object') out[i]=Object.assign(out[i],{t:x.t||'',fix:!!x.fix,part:!!x.part,new:!!x.new}); });
  return out; }
function empSel(id,val,ph){
  const el=$('#'+id); if(!el) return;
  /* เอกสารใหม่เลือกได้เฉพาะคนที่ยังปฏิบัติงานอยู่ — แต่ถ้าเปิดเอกสารเก่าที่ระบุคนที่ลาออกไปแล้ว
     ต้องคงชื่อเดิมไว้เป็นตัวเลือกหนึ่ง ไม่ให้ค่าหายไปเงียบ ๆ ตอนบันทึกซ้ำ */
  const list=empActiveList();
  const cur=val?DB.emp.find(e=>e.id===val):null;
  if(cur&&!empActive(cur)) list.push(cur);
  el.innerHTML='<option value="">'+(ph||'— ไม่ระบุ —')+'</option>'
    +list.map(e=>`<option value="${esc(e.id)}">${esc(e.code)} · ${esc(e.name)}${e.position?' ('+esc(e.position)+')':''}${empActive(e)?'':' — ลาออกแล้ว'}</option>`).join('');
  el.value=val||'';
  if(val&&el.value!==val) el.value='';
}
function empName(id,snap){
  const e=DB.emp.find(x=>x.id===id);
  if(e) return e.name+(e.position?' ('+e.position+')':'');
  return snap||'';
}
function blankQuote(){ return {id:uid(),no:'',previewNo:peekDocNo('QO'),date:iso(),jobIn:iso(),custId:'',vehIdx:0,mile:'',probs:['','',''],
  finds:blankFinds(),tier:'B',items:[],disc:0,vat:vatDefault(),byPos:'',byName:'',apPos:'',apName:'',tech:'',techName:'',status:'ร่าง',deducted:false,apv:{status:'draft',byName:'',date:'',note:''}}; }
function newQuote(){ Q=blankQuote(); fillQuoteForm(); openModal('mQuoteEdit');
  toast('เริ่มใบเสนอราคาใหม่ · เลขที่ '+Q.previewNo+' (ยังไม่จองเลขจนกว่าจะบันทึก)'); }
/* คัดลอกใบเสนอราคาเดิมเป็นใบใหม่ — ใช้ได้ทั้งใบที่ถูกตีกลับ/ยกเลิก และใบปกติ
   ใบเดิมไม่ถูกแตะต้อง ใบใหม่ยังไม่มีเลขที่จนกว่าจะบันทึก */
function copyQuote(){
  if(!Q) return;
  if(!Q.no) return toast('ใบนี้ยังไม่ได้บันทึก จึงยังไม่มีข้อมูลให้คัดลอก');
  const src=Q.no;
  /* ป๊อปอัพยืนยันของระบบ (กลางจอ) แทน confirm ของเบราว์เซอร์ */
  askConfirm({title:'คัดลอกใบเสนอราคาเป็นใบใหม่',
    msg:'คัดลอก <b>'+esc(src)+'</b> เป็นใบใหม่หรือไม่?'
      +'<br><br>· คัดลอกลูกค้า รถ อาการที่พบ และรายการทั้งหมดมาให้'
      +'<br>· ใบใหม่เริ่มที่สถานะ <b>ร่าง</b> ยังไม่อนุมัติและยังไม่ตัดสต๊อก'
      +'<br>· ใบเดิมยังอยู่เหมือนเดิม ไม่ถูกแก้ไข',
    yes:'คัดลอกเป็นใบใหม่', no:'ยกเลิก',
    onYes:()=>{
      const c=JSON.parse(JSON.stringify(Q));
      c.id=uid(); c.no=''; c.previewNo=peekDocNo('QO'); c.date=iso(); c.jobIn=iso();
      c.status='ร่าง'; c.deducted=false;
      c.cancelled=false; c.cancelReason=''; c.cancelDate='';
      c.apv={status:'draft',byName:'',date:'',note:''};
      c.copiedFrom=src;
      Q=c; Q.finds=normFinds(Q.finds); Q.items=Q.items||[]; padQLines();
      fillQuoteForm();
      toast('คัดลอกจาก '+src+' แล้ว — แก้ไขรายการได้ แล้วกดส่งขออนุมัติหรือพิมพ์เพื่อบันทึกเป็นใบใหม่');
    }});
}
/* ยกเลิกใบเสนอราคา — ใบที่ตัดสต๊อกแล้วจะคืนสต๊อกอัตโนมัติ
   ใบที่ยกเลิกล็อกถาวร เหลือแค่คัดลอกเป็นใบใหม่ (แก้รายการ → อนุมัติ → ตัดสต๊อกรอบใหม่) */
async function cancelQuoteDoc(){
  if(!can('doc.cancelDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกใบเสนอราคา');
  if(!can('doc.delDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกเอกสาร');
  if(!Q||!Q.no) return toast('ใบนี้ยังไม่ได้บันทึก จึงไม่ต้องยกเลิก — กด "สร้างใบใหม่" ได้เลย');
  const q=findQuote(Q.id); if(!q) return;
  if(q.cancelled) return toast('ใบนี้ถูกยกเลิกไปแล้ว');
  const activeRec=DB.receipts.find(r=>r.quoteId===q.id&&!r.cancelled);
  if(activeRec) return toast('ใบนี้ออกใบเสร็จ '+activeRec.no+' ไปแล้ว — ต้องยกเลิกใบเสร็จก่อน จึงจะยกเลิกใบเสนอราคาได้');
  const reason=await askPromptP({title:'ยกเลิกใบเสนอราคา '+q.no,text:'ระบุเหตุผลที่ยกเลิก (เช่น ประเมินผิด / ลูกค้าขอเปลี่ยนรายการ)',yes:'ยกเลิกเอกสาร',no:'ไม่ยกเลิก'});
  if(reason===null) return;
  const parts=q.deducted?pkgStockLines(qItemsClean(q)):[];
  askConfirm({
    title:'ยืนยันยกเลิกใบเสนอราคา '+q.no,
    msg:(q.deducted
        ?'ใบนี้ตัดสต๊อกไปแล้ว ระบบจะ<b>คืนสต๊อกอัตโนมัติ</b>ดังนี้<br>'
          +(parts.length?parts.map(it=>'· '+esc(it.name||it.code)+' × '+n(it.qty)+' '+esc(it.unit||'ชิ้น')).join('<br>')
            :'· (ไม่มีรายการอะไหล่ที่ผูกสต๊อก)')+'<br><br>'
        :'ใบนี้ยังไม่ได้ตัดสต๊อก จึงไม่มีรายการต้องคืน<br><br>')
      +'ใบที่ยกเลิกจะ<b>แก้ไขไม่ได้อีก</b> เหลือเพียงคัดลอกเป็นใบใหม่และพิมพ์<br>ยืนยันการยกเลิกหรือไม่?',
    yes:'ยืนยันยกเลิก', no:'ไม่ยกเลิก',
    onYes:()=>{
      if(q.deducted) parts.forEach(it=>{
        const s=DB.stock.find(x=>x.id===it.stockId);
        if(s){ s.qty=n(s.qty)+n(it.qty); s.lastMove=iso();
          logMove(s.id,'in',n(it.qty),iso(),'คืนสต๊อกจากการยกเลิกใบอนุมัติซ่อม',q.no); }});
      q.cancelled=true; q.cancelReason=String(reason||'').trim(); q.cancelDate=iso();
      q.status='ยกเลิกแล้ว';
      logAudit('quote',q,'del','ยกเลิกใบเสนอราคา'+(q.deducted?' · คืนสต๊อก '+parts.length+' รายการ':'')
        +(q.cancelReason?' — '+q.cancelReason:''));
      save();
      if(Q&&Q.id===q.id){ Q.cancelled=true; Q.cancelReason=q.cancelReason; Q.cancelDate=q.cancelDate; Q.status=q.status; fillQuoteForm(); }
      renderQuoteOverview(); renderHome();
      toast('ยกเลิกใบเสนอราคา '+q.no+' แล้ว'+(q.deducted?' · คืนสต๊อกเรียบร้อย':'')+' — คัดลอกเป็นใบใหม่ได้จากปุ่มม่วง');
    }
  });
}
function fillYearSelect(id){
  const el=$('#'+id); if(!el) return;
  const y=new Date().getFullYear();
  el.innerHTML=Array.from({length:8},(_,i)=>y-6+i).map(gy=>`<option value="${gy}">${gy+543}</option>`).join('');
  el.value=String(y);
}
function toggleDateFilterUI(prefix){
  const mode=$('#'+prefix+'Mode').value;
  const set=(suf,show)=>{const el=$('#'+prefix+suf); if(el) el.style.display=show?'':'none';};
  set('D1',mode==='one'||mode==='range');
  set('D2Wrap',mode==='range');
  set('MonthWrap',mode==='month');
  set('Year',mode==='year');
}
const TH_M_FULL=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
function fillMonthSelect(id){
  const el=$('#'+id); if(!el) return;
  el.innerHTML=TH_M_FULL.map((m,i)=>`<option value="${String(i+1).padStart(2,'0')}">${m}</option>`).join('');
  el.value=String(new Date().getMonth()+1).padStart(2,'0');
}
function applyDateFilter(rows,prefix){
  const el=$('#'+prefix+'Mode'); if(!el) return rows;
  const mode=el.value, today=iso();
  if(mode==='today') return rows.filter(x=>x.date===today);
  if(mode==='one'){ const d=$('#'+prefix+'D1').value; return d?rows.filter(x=>x.date===d):rows; }
  if(mode==='range'){ let r=rows; const d1=$('#'+prefix+'D1').value, d2=$('#'+prefix+'D2').value;
    if(d1) r=r.filter(x=>x.date>=d1); if(d2) r=r.filter(x=>x.date<=d2); return r; }
  if(mode==='month'){
    const ms=$('#'+prefix+'MonthM');
    if(ms){ const y=($('#'+prefix+'MonthY')||{}).value, m=ms.value;
      if(!m||!y) return rows;
      return rows.filter(x=>x.date.slice(0,7)===y+'-'+m); }
    const m1=$('#'+prefix+'Month').value; if(!m1) return rows;
    const m2=$('#'+prefix+'Month2').value||m1;
    return rows.filter(x=>{const ym0=x.date.slice(0,7); return ym0>=m1&&ym0<=m2;}); }
  if(mode==='year'){ const y=$('#'+prefix+'Year').value; return y?rows.filter(x=>x.date.slice(0,4)===y):rows; }
  return rows;
}
/* ==========================================================
   ตัดแถวตามจำนวนที่เลือก + ปุ่มแบ่งหน้า
   เดิมตัดแค่ n แถวแรก ข้อมูลที่เหลือดูไม่ได้เลยจนกว่าจะเปลี่ยนเป็น 500
   ตอนนี้เดินหน้า-ถอยหลังได้ · เลขหน้าย่อด้วย … เมื่อมีหลายหน้า
   LIM_PAGE เก็บหน้าปัจจุบันของแต่ละทะเบียน · LIM_RENDER คือตัววาดใหม่ของทะเบียนนั้น
   ========================================================== */
const LIM_PAGE={}, LIM_RENDER={};
function limGo(prefix,pg){ LIM_PAGE[prefix]=pg;
  const f=LIM_RENDER[prefix]; if(f){ try{f()}catch(e){} }
  const el=$('#'+prefix+'Info'); if(el&&el.scrollIntoView) el.scrollIntoView({block:'nearest'});
}
/* เลขหน้าที่จะแสดง — เสมอมีหน้าแรก หน้าสุดท้าย และหน้ารอบ ๆ ที่อยู่ตอนนี้ */
function pageNums(cur,pages){
  if(pages<=7) return Array.from({length:pages},(_,i)=>i+1);
  const set=new Set([1,pages,cur,cur-1,cur+1]);
  if(cur<=3) [2,3,4].forEach(x=>set.add(x));
  if(cur>=pages-2) [pages-1,pages-2,pages-3].forEach(x=>set.add(x));
  const list=[...set].filter(x=>x>=1&&x<=pages).sort((a,b)=>a-b);
  const out=[];
  list.forEach((x,i)=>{ if(i&&x-list[i-1]>1) out.push('...'); out.push(x); });
  return out;
}
/* สร้าง/อัปเดตแถบเลขหน้า — วางไว้ 2 ที่: ท้ายแถบเครื่องมือด้านบน และใต้ตาราง
   แถบล่างสร้างอัตโนมัติจากโครงของแผง ไม่ต้องไปเติม HTML ทีละ 18 ทะเบียน */
function limBar(host,cls,html,pos){
  if(!host) return;
  let bar=host.querySelector(':scope > .'+cls);
  if(!html){ if(bar) bar.remove(); return; }
  if(!bar){ bar=document.createElement('div'); bar.className=cls;
    if(pos&&pos.parentElement===host) pos.insertAdjacentElement('afterend',bar); else host.appendChild(bar); }
  bar.innerHTML=html;
}
function limitRows(rows,prefix){
  const el=$('#'+prefix+'Limit'), info=$('#'+prefix+'Info');
  const lim=n(el&&el.value)||50, total=rows.length;
  const pages=Math.max(1,Math.ceil(total/lim));
  let cur=n(LIM_PAGE[prefix])||1;
  if(cur>pages) cur=pages; if(cur<1) cur=1;
  LIM_PAGE[prefix]=cur;
  const from=(cur-1)*lim+1, to=Math.min(total,cur*lim);
  const txt=pages<=1?('พบ '+total+' รายการ · ครบทุกรายการ')
    :('พบ '+total+' รายการ · แสดง '+from+'–'+to+' · หน้า '+cur+'/'+pages);
  const bar=pages<=1?'':'<span class="pgbar">'
    +`<button onclick="limGo('${prefix}',${cur-1})" ${cur<=1?'disabled':''} title="หน้าก่อนหน้า">‹</button>`
    +pageNums(cur,pages).map(x=>x==='...'
      ? '<span class="gap">…</span>'
      : `<button class="${x===cur?'on':''}" onclick="limGo('${prefix}',${x})">${x}</button>`).join('')
    +`<button onclick="limGo('${prefix}',${cur+1})" ${cur>=pages?'disabled':''} title="หน้าถัดไป">›</button>`
    +'</span>';
  if(info){
    info.textContent=txt;
    limBar(info.parentElement,'pgtop',bar);            /* บน — ชิดขวาสุดของแถบเครื่องมือ */
    const panel=info.closest('.panel');
    if(panel) limBar(panel,'pgbottom',bar?('<span class="hint">'+txt+'</span>'+bar):'',
      panel.querySelector(':scope > .scroll'));        /* ล่าง — ใต้ตาราง กดต่อได้ทันที */
  }
  return rows.slice((cur-1)*lim,cur*lim);
}
const OVERVIEW_RENDERERS={qOvDate:()=>renderQuoteOverview(),docOvDate:()=>renderDocOverview(),
  taxOvDate:()=>renderTaxOverview(),bnOvDate:()=>renderBillingList(),grOvDate:()=>renderGRList(),
  /* ตัวกรองวันที่ของรายการใบเสร็จในฟอร์มใบวางบิล (ไม่ใช่ทะเบียน แต่ใช้กลไกเดียวกัน) */
  bnItemDate:()=>renderBillingItems(),
  /* หมวด 07 · ใช้ตัวกรองวันที่ชุดเดียวกับทะเบียนเอกสารหมวด 03/04 */
  clmDate:()=>renderClaimList(),isuDate:()=>renderIssueList(),scnDate:()=>renderCountList(),
  scutDate:()=>{ if(typeof pkgRenderCuts==='function') pkgRenderCuts(); },
  sinvDate:()=>{ if(typeof pkgRenderInv==='function') pkgRenderInv(); },srcpDate:()=>{ if(typeof pkgRenderRcp==='function') pkgRenderRcp(); },swhtDate:()=>{ if(typeof pkgRenderWht==='function') pkgRenderWht(); },swhtOutDate:()=>{ if(typeof pkgRenderWhtOut==='function') pkgRenderWhtOut(); }};
[['qOv',()=>renderQuoteOverview()],['docOv',()=>renderDocOverview()],
 ['taxOv',()=>renderTaxOverview()],['bnOv',()=>renderBillingList()],
 /* ทะเบียนที่เพิ่งเติมช่องเลือกจำนวนแถว — ใช้กลไก limitRows เดียวกับด้านบน */
 ['stk',()=>renderStock()],['ven',()=>renderVen()],['custL',()=>renderCustList()],
 ['gr',()=>renderGRList()],['clm',()=>renderClaimList()],['isu',()=>renderIssueList()],
 ['scn',()=>renderCountList()],['crm',()=>renderCrm()],['rec',()=>renderHrRec()],
 ['exp',()=>renderExp()],['scut',()=>{ if(typeof pkgRenderCuts==='function') pkgRenderCuts(); }],['sinv',()=>{ if(typeof pkgRenderInv==='function') pkgRenderInv(); }],['srcp',()=>{ if(typeof pkgRenderRcp==='function') pkgRenderRcp(); }],['swht',()=>{ if(typeof pkgRenderWht==='function') pkgRenderWht(); }],['swhtOut',()=>{ if(typeof pkgRenderWhtOut==='function') pkgRenderWhtOut(); }],['apvList',()=>renderApvList()],['star',()=>renderGradeList()]].forEach(([p,fn])=>{
  LIM_RENDER[p]=fn;                       /* ให้ปุ่มเลขหน้ารู้ว่าต้องวาดทะเบียนไหนใหม่ */
  const el=$('#'+p+'Limit');
  if(el) el.onchange=()=>{ LIM_PAGE[p]=1; fn(); };   /* เปลี่ยนจำนวนแถว = กลับหน้าแรก */
});
/* จอมือถือเลื่อนยาวกว่ามาก — ตั้งค่าเริ่มต้นเป็น 20 แถว (จอกว้างคง 50 เหมือนเดิม)
   ผู้ใช้ยังเปลี่ยนเป็น 50/100/500 ได้เอง ระบบไม่ไปทับค่าที่เลือกแล้ว */
setTimeout(()=>{ if(typeof isMobUI==='function'&&isMobUI())
  document.querySelectorAll('select[id$="Limit"]').forEach(el=>{ if(el.value==='50'&&el.querySelector('option[value="20"]')) el.value='20'; });
},400);
Object.keys(OVERVIEW_RENDERERS).forEach(prefix=>{
  fillYearSelect(prefix+'Year'); fillYearSelect(prefix+'MonthY'); fillMonthSelect(prefix+'MonthM');
  const fn=OVERVIEW_RENDERERS[prefix];
  $('#'+prefix+'Mode').onchange=()=>{toggleDateFilterUI(prefix);fn();};
  ['D1','D2','Month','Month2','Year','MonthM','MonthY'].forEach(suf=>{ const el=$('#'+prefix+suf); if(el) el.onchange=fn; });
});
function renderQuoteOverview(){
  const today=iso(), mo=today.slice(0,7);
  $('#qOvToday').textContent='วันนี้ '+DB.quotes.filter(q=>q.date===today&&!q.cancelled).length+' ใบ';
  $('#qOvMonth').textContent='เดือนนี้ '+DB.quotes.filter(q=>ym(q.date)===mo&&!q.cancelled).length+' ใบ';
  const q=($('#qOvSearch').value||'').toLowerCase().trim(), billed=billedQuoteIds();
  qOvBilled=billed;   /* ให้ตัวเรียงคอลัมน์ "ใบเสร็จ" ใช้ชุดเดียวกัน ไม่ต้องคำนวณซ้ำทุกแถว */
  /* ลำดับแนะนำ: ใบล่าสุดขึ้นก่อน — ใช้เมื่อผู้ใช้ยังไม่ได้กดเรียงคอลัมน์ไหน */
  let rows=DB.quotes.filter(d=>typeof pkgOwnOk!=='function'||pkgOwnOk('quote',d)).sort((a,b)=>b.date.localeCompare(a.date)||String(b.no).localeCompare(String(a.no)));
  if(q) rows=rows.filter(x=>{const c=findCust(x.custId), v=c&&(c.vehicles||[])[x.vehIdx];
    return [x.no,custName(c),plateOf(v)].some(s=>String(s||'').toLowerCase().includes(q));});
  rows=applyDateFilter(rows,'qOvDate');
  rows=sortRows('qOvTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว ไม่งั้นจะเรียงแค่หน้าที่เห็น */
  rows=limitRows(rows,'qOv');
  $('#qOvTbl tbody').innerHTML=rows.map(x=>{
    const c=findCust(x.custId), v=c&&(c.vehicles||[])[x.vehIdx], t=quoteTotals(x), apv=apvOf(x).status;
    const apvLbl=x.superseded?`<span class="chip" title="แก้ไขเป็น ${esc(x.revisedTo||'')}">แก้ไขเป็นฉบับใหม่</span>`:x.cancelled?`<span class="chip r" title="${esc(x.cancelReason||'')}">ยกเลิกแล้ว</span>`
      :apv==='approved'?'<span class="chip g">อนุมัติแล้ว</span>':apv==='rejected'?'<span class="chip r">ตีกลับ</span>':'<span class="chip a">รออนุมัติ</span>';
    return `<tr${x.cancelled?' class="cancelrow"':x.superseded?' class="pkg-superseded"':''}><td class="mono" style="font-size:12.5px"><span class="docno" onclick="openQuoteById('${x.id}')">${x.cancelled?'<s>'+esc(x.no||'')+'</s>':esc(x.no||'(ยังไม่บันทึก)')}</span></td>
      <td class="ctr">${thDate(x.date)}</td><td>${esc(custName(c)||'-')}</td><td class="mono">${esc(plateOf(v))}</td>
      <td class="num">${money(t.total)}</td><td class="ctr">${apvLbl}</td>
      <td class="ctr">${x.cancelled?'<span class="hint">-</span>':billed.has(x.id)?'<span class="chip g">ออกแล้ว</span>':x.superseded?'<span class="hint">-</span>':x.deducted?'<span class="chip b">ตัดสต๊อกแล้ว</span>':'<span class="hint">ยังไม่ออก</span>'}</td>
      ${byCell(x)}</tr>`;}).join('');
  $('#qOvEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('qOvTbl');
  if(typeof mkCards==='function') mkCards('qOvTbl');
}
let qOvBilled=new Set();   /* ชุด id ใบเสนอราคาที่ออกใบเสร็จแล้ว — ตั้งค่าใน renderQuoteOverview */
if($('#qOvSearch')) $('#qOvSearch').onkeydown=e=>{ if(e.key==='Enter') renderQuoteOverview(); };
function pkgSyncQuoteCopy(){
  const saved=!!(Q&&Q.no&&DB.quotes.some(q=>q.id===Q.id&&q.no));
  document.querySelectorAll('.pkg-quote-copy').forEach(button=>{button.hidden=!saved;});
}
function fillQuoteForm(){
  pkgSyncQuoteCopy();
  $('#qNo').textContent=Q.no?('เลขที่ '+Q.no+' · '+Q.status)
    :('เลขที่ '+(Q.previewNo||peekDocNo('QO'))+' · ยังไม่บันทึก'
      +(Q.copiedFrom?' · คัดลอกจาก '+Q.copiedFrom:''));
  $('#qDate').value=Q.date;$('#qJobIn').value=Q.jobIn||Q.date;$('#qMile').value=Q.mile;$('#qTier').value=Q.tier;
  $('#qDisc').value=Q.disc;$('#qVat').value=Q.vat;
  empSel('qTech',Q.tech,'— ยังไม่ระบุช่างผู้ประเมิน —');
  $('#qByPos').value=Q.byPos;qByNameFill(Q.byName);$('#qApPos').value=Q.apPos;$('#qApName').value=Q.apName;
  $$('.qprob').forEach((el,i)=>el.value=Q.probs[i]||'');
  refreshQuoteRefs(); $('#qCust').value=Q.custId; fillVehSelect(); $('#qVeh').value=Q.vehIdx;
  renderFinds(); renderQItems(); renderApvBars();
}
/* ใบเสนอราคาล็อกรายการเมื่อ: ยกเลิก · ตัดสต๊อกแล้ว · ถูกแทนด้วยฉบับแก้ไข · อนุมัติแล้ว / ไม่อนุมัติ
   (ร่าง และรออนุมัติ ยังแก้ได้) — จะแก้ใบที่ล็อกให้ทำ “ฉบับแก้ไข” (user 2026-10-03) */
function pkgQLock(q){ if(!q) return false; if(q.cancelled||q.deducted||q.superseded) return true;
  if(!q.no) return false; const st=apvOf(q).status; return st==='approved'||st==='rejected'; }
function pkgQLockMsg(q){ if(!q) return '';
  if(q.cancelled) return 'ใบนี้ถูกยกเลิกแล้ว แก้ไขรายการไม่ได้ — ใช้ “คัดลอกใบนี้”';
  if(q.superseded) return 'ใบนี้ถูกแก้ไขเป็น '+(q.revisedTo||'ฉบับใหม่')+' แล้ว — แก้ไขรายการไม่ได้';
  if(q.deducted) return 'ใบนี้ตัดสต็อกแล้ว — ล็อกรายการ · จะแก้ต้องยกเลิกใบตัดสต็อก (4.4) ก่อน แล้วกด “ฉบับแก้ไข”';
  const st=apvOf(q).status;
  if(st==='approved') return 'ใบนี้อนุมัติแล้ว — ล็อกรายการ · จะแก้ให้กด “ฉบับแก้ไข”';
  if(st==='rejected') return 'ใบนี้ไม่อนุมัติ — ล็อกรายการ · กด “ฉบับแก้ไข” แล้วส่งขออนุมัติใหม่';
  return ''; }
function renderFinds(){
  Q.finds=normFinds(Q.finds);
  const qlock=pkgQLock(Q);
  $('#qFindWrap').innerHTML=Q.finds.map((v,i)=>`<tr>
    <td class="ctr hint">${i+1}</td>
    <td><input type="text" class="qfind" data-i="${i}" placeholder="ระบุอาการ / ปัญหาที่ตรวจพบข้อที่ ${i+1}" value="${esc(v.t)}"></td>
    ${FIND_ACT.map(([k])=>`<td class="ctr"><input type="checkbox" class="qfa" data-i="${i}" data-k="${k}" ${v[k]?'checked':''}></td>`).join('')}
    <td class="ctr">${qlock?'':`<button class="btn sm dgr qfdel" data-i="${i}" title="ลบข้อนี้">×</button>`}</td>
  </tr>`).join('');
  $$('.qfind').forEach(el=>el.oninput=e=>{Q.finds[+e.target.dataset.i].t=e.target.value;renderQPrev()});
  $$('.qfa').forEach(el=>el.onchange=e=>{Q.finds[+e.target.dataset.i][e.target.dataset.k]=e.target.checked;renderQPrev()});
  $$('.qfdel').forEach(el=>el.onclick=e=>{delFind(+e.currentTarget.dataset.i)});
}
/* ลบอาการตรวจพบทีละข้อ — ข้อถัดไปเลื่อนขึ้นแทน (ระบบเติมแถวว่างท้ายให้ครบ 10 ข้อเอง) */
function delFind(i){
  if(pkgQLock(Q)) return toast(pkgQLockMsg(Q));
  Q.finds.splice(i,1);
  renderFinds(); renderQPrev();
}
function refreshQuoteRefs(){
  /* ช่องลูกค้าเป็นช่องพิมพ์ค้นหาแล้ว — ค่าจริงอยู่ใน input ซ่อน #qCust เหมือนเดิม */
  const cur=$('#qCust').value;
  $('#qCust').value=cur||(Q?Q.custId:'')||'';
  qCustSyncLabel();
  const co=$('#qOpen').value;
  $('#qOpen').innerHTML='<option value="">— เปิดเอกสารที่บันทึกไว้ —</option>'+DB.quotes.slice().reverse().map(q=>{
    const c=findCust(q.custId);
    return `<option value="${q.id}">${esc(q.no)} · ${thDate(q.date)} · ${esc(custName(c)||'ไม่ระบุ')} · ${q.status}</option>`}).join('');
  $('#qOpen').value=co; refreshStockList();
}
function fillVehSelect(){
  const c=findCust($('#qCust').value), vs=(c&&c.vehicles)||[];
  $('#qVeh').innerHTML=vs.length?vs.map((v,i)=>`<option value="${i}">${esc(vehLabel(v))}</option>`).join('')
    :'<option value="0">— ลูกค้ารายนี้ยังไม่มีข้อมูลรถ —</option>';
  $('#qVeh').value=Math.min(Q.vehIdx,Math.max(0,vs.length-1));
  const v=vs[Q.vehIdx]||vs[0];
  $('#qVehInfo').textContent=v?('ยี่ห้อ '+(v.brand||'-')+' · รุ่น '+(v.model||'-')+' · สี '+(v.color||'-')+' · ทะเบียน '+plateOf(v)
    +' · เลขเครื่องยนต์ '+(v.engine||'-')+' · หมายเลขตัวถัง '+(v.vin||'-')):'';
  if(c&&!$('#qMile').value&&v&&v.mile){$('#qMile').value=v.mile;Q.mile=v.mile}
  if(c&&c.tier){$('#qTier').value=c.tier;Q.tier=c.tier}
}
$('#qCust').onchange=()=>{Q.custId=$('#qCust').value;Q.vehIdx=0;fillVehSelect();renderQPrev()};
/* ช่องลูกค้าแบบพิมพ์ค้นหา — รองรับลูกค้าหลายร้อยราย ค้นจากชื่อ / บริษัท / เบอร์โทร */
/* ==========================================================
   ช่องพิมพ์ค้นหาแบบมีรายการแนะนำลอย (ใช้แทน <select> ที่มีตัวเลือกหลายร้อยรายการ)
   ----------------------------------------------------------
   คงตัว <select> เดิมไว้แต่ซ่อนตา — โค้ดส่วนอื่นที่อ่าน .value หรือฟัง onchange
   จึงทำงานได้เหมือนเดิมทั้งหมด ไม่ต้องไล่แก้ตาม
   getRows() คืน [{id,text,sub,find}] · find = ข้อความเพิ่มที่ให้ค้นหาเจอ (เบอร์โทร ฯลฯ)
   ========================================================== */
const PICKER_MAX=30;
function bindPicker(inputId,sugId,selId,getRows,opt){
  const inp=$('#'+inputId), sug=$('#'+sugId), sel=$('#'+selId);
  if(!inp||!sug||!sel) return null;
  const clr=document.getElementById(inputId.replace(/Search$/,'')+'Clear');
  const sync=()=>{ const r=(getRows()||[]).find(x=>String(x.id)===sel.value);
    inp.value=r?(r.sub?r.text+' · '+r.sub:r.text):''; inp.disabled=sel.disabled;
    if(clr) clr.classList.toggle('on',!!sel.value&&!sel.disabled); };
  let hl=-1,hcnt=0;
  const show=()=>{
    if(inp.disabled) return;
    let q=(inp.value||'').toLowerCase().trim(); const all=getRows()||[];
    const selRow=all.find(x=>String(x.id)===sel.value);
    /* ข้อความยังเป็นชื่อที่เลือกอยู่ = ยังไม่ได้เริ่มค้นใหม่ — โชว์ทั้งหมด ไม่ต้องลบชื่อก่อน */
    if(selRow&&q===(selRow.sub?selRow.text+' · '+selRow.sub:selRow.text).toLowerCase()) q='';
    const list=all.filter(r=>!q||((r.text||'')+' '+(r.find||'')).toLowerCase().includes(q));
    hcnt=Math.min(list.length,PICKER_MAX); hl=hcnt?0:-1;
    /* จัดเป็น 2 คอลัมน์ — ซ้าย: ชื่อหลัก + รายละเอียดรอง · ขวา: ตัวเลข/วันที่
       (เดิมต่อกันเป็นบรรทัดเดียว ชื่อยาว ๆ ตัดบรรทัดกลางคำอ่านยาก) */
    sug.innerHTML=(list.length?list.slice(0,PICKER_MAX).map((r,gi)=>
        `<div class="it${gi===0?' hl':''}" data-gi="${gi}" data-id="${esc(r.id)}">`
        +`<span class="l"><b>${esc(r.text)}</b>${r.sub?`<span class="s${r.subBold?' sb':''}">${esc(r.sub)}</span>`:''}</span>`
        +((r.meta||r.meta2)?`<span class="r">${esc(r.meta||'')}${r.meta2?`<b class="r2">${esc(r.meta2)}</b>`:''}</span>`:'')
        +'</div>').join('')
      :'<div class="it none"><span class="hint">ไม่พบรายการที่ตรงกับคำค้น</span></div>')
      +(list.length>PICKER_MAX?`<div class="it none"><span class="hint">…และอีก ${list.length-PICKER_MAX} รายการ — พิมพ์เพิ่มเพื่อค้นหา</span></div>`:'');
    sug.style.display='block';
  };
  const pick=id=>{ sel.value=id; sug.style.display='none'; sync(); sel.dispatchEvent(new Event('change'));
    /* ช่องแบบ "เลือกแล้วเปิดเอกสาร" ไม่ได้เก็บค่าไว้ — ล้างช่องหลังเปิด จะได้พิมพ์ค้นใบถัดไปได้ทันที */
    if(opt&&opt.clearAfterPick){ sel.value=''; inp.value=''; } };
  /* ใช้ mousedown เพราะ blur ของช่องพิมพ์มาก่อน click — ถ้ารอ click รายการจะถูกซ่อนไปแล้ว */
  sug.addEventListener('mousedown',e=>{ const it=e.target.closest('.it[data-id]');
    if(it){ e.preventDefault(); pick(it.dataset.id); } });
  inp.addEventListener('input',show);
  inp.addEventListener('focus',()=>{ show(); inp.select(); });
  inp.addEventListener('blur',()=>setTimeout(()=>{ sug.style.display='none'; sync(); },150));
  inp.addEventListener('keydown',e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault();
      if(hcnt<1) return;
      hl=(hl+(e.key==='ArrowDown'?1:-1)+hcnt)%hcnt;
      sug.querySelectorAll('.it[data-id]').forEach(el=>{ const on=+el.dataset.gi===hl;
        el.classList.toggle('hl',on); if(on) el.scrollIntoView({block:'nearest'}); });
      return; }
    if(e.key==='Enter'){ e.preventDefault();
      const f=sug.querySelector('.it[data-id][data-gi="'+hl+'"]')||sug.querySelector('.it[data-id]');
      if(f) pick(f.dataset.id); }
    if(e.key==='Escape'){ sug.style.display='none'; inp.blur(); }
  });
  const clear=()=>{ sel.value=''; sug.style.display='none'; sync(); sel.dispatchEvent(new Event('change')); inp.focus(); };
  return {sync,show,pick,clear};
}
/* รายชื่อลูกค้าสำหรับช่องค้นหา — ค้นได้จากชื่อ บริษัท เบอร์โทร และทะเบียนรถ */
function custPickerRows(){
  return DB.cust.map(c=>({id:c.id,text:custName(c)||'(ไม่มีชื่อ)',sub:c.tel||'',
    find:[c.name,c.company,c.tel,c.tel2,c.tax,(c.vehicles||[]).map(plateOf).join(' ')].filter(Boolean).join(' ')}));
}
/* รายชื่อผู้ขาย — ใช้ร่วมทุกช่องเลือกผู้ขาย (ใบรับสินค้า · ใบเคลม) */
function venPickerRows(){
  return DB.vendors.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'th'))
    .map(v=>({id:v.id,text:v.name||'(ไม่มีชื่อ)',sub:v.tel||'',
      find:[v.name,v.tel,v.tax,v.contact].filter(Boolean).join(' ')}));
}
/* ใบเสนอราคาสำหรับช่องดึงเข้าใบเสร็จ — ใบยกเลิกไม่ขึ้น ใบที่ออกใบเสร็จแล้วติดป้ายบอกท้ายบรรทัด */
function rSrcRows(){
  const billed=billedQuoteIds();
  return DB.quotes.filter(q=>!q.cancelled).slice().reverse().map(q=>{
    const c=findCust(q.custId), v=c&&(c.vehicles||[])[q.vehIdx], pl=plateOf(v);
    const done=billed.has(q.id)&&q.id!==(typeof R!=='undefined'&&R?R.quoteId:'');
    return {id:q.id,text:q.no,subBold:true,sub:(custName(c)||'-')+(pl&&pl!=='-'?' · '+pl:''),
      meta:thDate(q.date)+' · '+money(quoteTotals(q).total),meta2:done?'ออกใบเสร็จแล้ว':'',
      find:[q.no,custName(c),pl,c&&c.tel].filter(Boolean).join(' ')};
  });
}
/* ทุกช่องเลือกผู้ขาย/ลูกค้า/ใบเสนอราคา ใช้ bindPicker ชุดเดียวกันทั้งระบบ
   — หน้าตาและคีย์ลัดเหมือนกันหมด และหลังบ้านแปลงเป็นคอมโพเนนต์เดียวได้ */
/* ใบเสร็จขายสำหรับช่องอ้างอิงในใบเคลม */
function clRcptRows(){
  return DB.receipts.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).map(r=>{
    const c=findCust(r.custId), v=c&&(c.vehicles||[])[r.vehIdx], pl=plateOf(v);
    return {id:r.id,text:r.no,subBold:true,sub:(custName(c)||'-')+(pl&&pl!=='-'?' · '+pl:''),
      meta:thDate(r.date)+' · '+money(receiptTotals(r).gross),
      find:[r.no,custName(c),pl,c&&c.tel].filter(Boolean).join(' ')};
  });
}
/* ใบซื้อสินค้าสำหรับช่องอ้างอิงในใบเคลม — รู้ว่าของที่เคลมมาจากใบรับเข้าใบไหน */
function clGrRows(){
  return DB.purchases.filter(g=>!g.cancelled).slice()
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).map(g=>{
    const v=findVen(g.vendorId);
    return {id:g.id,text:g.no,subBold:true,sub:(v&&v.name)||'-',
      meta:thDate(g.date)+' · '+money(grTotals(g).total)+(g.inv?' · '+g.inv:''),
      find:[g.no,g.inv,(v&&v.name)].filter(Boolean).join(' ')};
  });
}
const grVendorPicker=bindPicker('grVendorPick','grVendorList','grVendor',venPickerRows);
const clRcptPicker=bindPicker('clReceiptRefSearch','clReceiptRefSug','clReceiptRef',clRcptRows);
const clGrPicker=bindPicker('clGrRefSearch','clGrRefSug','clGrRef',clGrRows);
const clVendorPicker=bindPicker('clVendorSearch','clVendorSug','clVendor',venPickerRows);
/* เลือก/ล้างผู้ขายแล้วต้องอัปเดตตัวเอกสารทันที ไม่รอจังหวะบันทึก
   (เดิมค่าค้างอยู่แค่ในช่อง พอสลับใบเลยดูเหมือนข้อมูลใบเก่าติดมา) */
if($('#clVendor')) $('#clVendor').addEventListener('change',()=>{
  if(typeof C!=='undefined'&&C) C.vendorId=$('#clVendor').value||'';
});
const qCustPicker=bindPicker('qCustSearch','qCustList','qCust',custPickerRows);
const ivCustPicker=bindPicker('ivCustSearch','ivCustSug','ivCust',custPickerRows);
const rSrcPicker=bindPicker('rSrcSearch','rSrcSug','rSrc',rSrcRows);
function grVenSync(){ if(grVendorPicker) grVendorPicker.sync(); }
function qCustSyncLabel(){ if(qCustPicker) qCustPicker.sync(); }
/* ==========================================================
   ช่อง "เปิดเอกสารที่บันทึกไว้" ทั้ง 9 จุด
   ----------------------------------------------------------
   เดิมเป็น <select> ที่ยัดเอกสารทุกใบลงไป — ข้อมูลจริงเพียง 1 ปีบวมถึง 400+
   ตัวเลือกในช่องเดียว เลื่อนหาไม่ไหวและพิมพ์ค้นไม่ได้
   เปลี่ยนเป็นช่องพิมพ์ค้นหา โดยคง <select> เดิมไว้ (ซ่อนตา) ให้ onchange เดิมทำงานต่อ
   ========================================================== */
const cN=id=>custName(findCust(id))||'-';
const vN=id=>{const v=findVen(id); return (v&&v.name)||'-'};
const DOC_PICKERS=[
  ['qOpen', ()=>DB.quotes.slice().reverse().map(q=>{const c=findCust(q.custId), v=c&&(c.vehicles||[])[q.vehIdx];
      return {id:q.id,text:q.no+' · '+thDate(q.date),sub:(custName(c)||'ไม่ระบุ')+' · '+q.status,
        find:[q.no,custName(c),c&&c.tel,plateOf(v),q.status].filter(Boolean).join(' ')}})],
  ['rOpen', ()=>DB.receipts.slice().reverse().map(r=>({id:r.id,text:r.no+' · '+thDate(r.date),sub:cN(r.custId),
      find:[r.no,r.taxNo,cN(r.custId)].filter(Boolean).join(' ')}))],
  ['grOpen',()=>DB.purchases.slice().reverse().map(p=>({id:p.id,text:p.no+' · '+thDate(p.date),
      sub:vN(p.vendorId)+' · '+money(grTotals(p).total)+' บาท',
      find:[p.no,p.inv,vN(p.vendorId)].filter(Boolean).join(' ')}))],
  ['bnOpen',()=>DB.billings.slice().sort((a,b)=>b.date.localeCompare(a.date))
      .map(b=>({id:b.id,text:b.no+' · '+thDate(b.date),sub:cN(b.custId),find:[b.no,cN(b.custId)].join(' ')}))],
  ['ivOpen',()=>DB.invoices.slice().sort((a,b)=>b.date.localeCompare(a.date))
      .map(iv=>({id:iv.id,text:iv.no+' · '+thDate(iv.date),sub:cN(iv.custId),find:[iv.no,cN(iv.custId)].join(' ')}))],
  ['clOpen',()=>DB.claims.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.no||'').localeCompare(String(a.no||'')))
      .map(c=>({id:c.id,text:c.no+' · '+thDate(c.date),sub:vN(c.vendorId),find:[c.no,vN(c.vendorId),c.plate].filter(Boolean).join(' ')}))],
  ['isOpen',()=>DB.issues.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.no||'').localeCompare(String(a.no||'')))
      .map(d=>({id:d.id,text:d.no+' · '+thDate(d.date),sub:d.by||'-',find:[d.no,d.by,d.dept].filter(Boolean).join(' ')}))],
  ['scOpen',()=>DB.stockCounts.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.no||'').localeCompare(String(a.no||'')))
      .map(d=>({id:d.id,text:d.no+' · '+thDate(d.date),sub:d.by||'-',find:[d.no,d.by,d.catFilter].filter(Boolean).join(' ')}))],
  ['wnOpen',()=>(DB.warns||[]).slice().sort((a,b)=>b.date.localeCompare(a.date))
      .map(w=>({id:w.id,text:w.no+' · '+thDate(w.date),sub:empName(w.emp)+' · '+(w.topic||''),
        find:[w.no,empName(w.emp),w.topic].filter(Boolean).join(' ')}))]
];
DOC_PICKERS.forEach(([id,rows])=>bindPicker(id+'Search',id+'Sug',id,rows,{clearAfterPick:true}));
(function(){ const _fq=fillQuoteForm; fillQuoteForm=function(){ const r=_fq.apply(this,arguments); qCustSyncLabel(); return r; }; })();
$('#qVeh').onchange=()=>{Q.vehIdx=+$('#qVeh').value;fillVehSelect();renderQPrev()};
/* ชื่อผู้เสนอซ่อมเลือกจากพนักงานที่ยังปฏิบัติงานอยู่ — ใบเก่าที่ชื่อไม่อยู่ในทะเบียนแล้ว
   ยังคงชื่อเดิมไว้เป็นตัวเลือกหนึ่ง ไม่ให้ค่าหายเงียบ ๆ (แนวเดียวกับ empSel) */
function qByNameFill(cur){
  const el=$('#qByName'); if(!el) return;
  const list=empActiveList();
  let h='<option value="">— เลือกผู้เสนอซ่อม —</option>'
    +list.map(e=>`<option value="${esc(e.name)}">${esc(e.name)}${e.position?' · '+esc(e.position):''}</option>`).join('');
  if(cur&&!list.some(e=>e.name===cur)) h+=`<option value="${esc(cur)}">${esc(cur)} (พ้นสภาพ/นอกทะเบียน)</option>`;
  el.innerHTML=h; el.value=cur||'';
}
/* เลือกชื่อแล้วตำแหน่งเปลี่ยนตามคนนั้นทุกครั้ง — เปลี่ยนคนใหม่ตำแหน่งต้องตามมาด้วย
   (เดิมเติมเฉพาะตอนช่องว่าง เลือกคนผิดแล้วตำแหน่งค้างของคนแรกตลอด)
   แก้ตำแหน่งเองหลังเลือกยังได้ตามปกติ ระบบทับเฉพาะจังหวะที่เปลี่ยนคน */
if($('#qByName')) $('#qByName').addEventListener('change',()=>{
  const e=empActiveList().find(x=>x.name===$('#qByName').value);
  const posEl=$('#qByPos');
  if(e&&posEl){ posEl.value=e.position||''; if(typeof Q!=='undefined'&&Q) Q.byPos=posEl.value; renderQPrev(); }
});
['qDate','qJobIn','qMile','qByPos','qByName','qApPos','qApName'].forEach(id=>$('#'+id).oninput=()=>{
  Q.date=$('#qDate').value;Q.jobIn=$('#qJobIn').value;Q.mile=$('#qMile').value;
  Q.byPos=$('#qByPos').value;Q.byName=$('#qByName').value;Q.apPos=$('#qApPos').value;Q.apName=$('#qApName').value;
  Q.tech=$('#qTech').value;Q.techName=empName(Q.tech,Q.techName);renderQPrev()});
$('#qTech').onchange=()=>{ Q.tech=$('#qTech').value; Q.techName=empName(Q.tech,Q.techName); renderQPrev(); };
$$('.qprob').forEach((el,i)=>el.oninput=()=>{Q.probs[i]=el.value;renderQPrev()});
$('#qTier').onchange=()=>{ if(pkgQLock(Q)) return toast(pkgQLockMsg(Q));
  Q.tier=$('#qTier').value;
  Q.items.forEach(it=>{if(it.type==='part'&&it.stockId){const s=DB.stock.find(x=>x.id===it.stockId); if(s)it.price=priceByTier(s,Q.tier);}});
  renderQItems();};
$('#qDisc').oninput=()=>{Q.disc=n($('#qDisc').value);calcQuote()};
$('#qVat').onchange=()=>vatPick($('#qVat'),Q,v=>{Q.vat=v;calcQuote()});
const QMIN_LINES=0;
function blankQLine(type){ return {type:type||'part',code:'',oem:'',name:type==='labor'?'ค่าแรง':'',qty:1,price:0,stockId:'',warr:''}; }
function qFilled(it){ return !!(it&&(String(it.code||'').trim()||String(it.name||'').trim()||n(it.price))); }
function qItemsClean(q){ return JSON.parse(JSON.stringify((q.items||[]).filter(qFilled))); }
function cleanQuote(q){ const c=JSON.parse(JSON.stringify(q)); c.items=qItemsClean(q); return c; }
function padQLines(){ while(Q.items.length<QMIN_LINES) Q.items.push(blankQLine('part')); }
function addQLine(type){
  if(Q.cancelled) return toast('ใบนี้ถูกยกเลิกแล้ว แก้ไขรายการไม่ได้');
  if(pkgQLock(Q)) return toast(pkgQLockMsg(Q));
  Q.items.push(blankQLine(type)); renderQItems(); }
function renderQItems(){
  padQLines();
  const lock=pkgQLock(Q);
  $('#qItems tbody').innerHTML=Q.items.map((it,i)=>{
    const s=it.stockId?DB.stock.find(x=>x.id===it.stockId):null, left=s?n(s.qty):'', short=s&&n(it.qty)>n(s.qty);
    return `<tr><td class="ctr hint">${i+1}</td>
      <td>${lock?esc(it.code||''):(it.type==='part'?`<input type="text" list="stockList" class="mono qcode" data-i="${i}" value="${esc(it.code)}" placeholder="พิมพ์รหัส">`:'<span class="chip">ค่าแรง</span>')}</td>
      <td class="mono hint" style="font-size:12px">${esc(it.oem||'')}</td>
      <td>${lock?esc(it.name||''):`<input type="text" class="qname" data-i="${i}" value="${esc(it.name)}">`}</td>
      <td class="num">${lock?qf(it.qty):`<input type="number" class="qqty" data-i="${i}" value="${it.qty}" style="text-align:right">`}</td>
      <td class="num">${lock?money(it.price):`<input type="number" class="qprice" data-i="${i}" value="${it.price}" step="0.01" style="text-align:right">`}</td>
      <td class="num">${money(n(it.qty)*n(it.price))}</td>
      <td class="num" style="${short?'color:var(--danger);font-weight:600':''}">${left===''?'-':left}${short?' ⚠':''}</td>
      <td class="ctr">${lock?'':`<button class="btn sm dgr" onclick="delQLine(${i})">×</button>`}</td></tr>`}).join('');
  if(!lock){
    $$('.qcode').forEach(el=>el.onchange=e=>{const i=+e.target.dataset.i, code=e.target.value.trim();
      const s=DB.stock.find(x=>x.code.toLowerCase()===code.toLowerCase());
      if(s) Q.items[i]={type:'part',code:s.code,oem:s.oem,name:s.name,qty:n(Q.items[i].qty)||1,price:priceByTier(s,Q.tier),stockId:s.id,warr:s.warr||''};
      else{Q.items[i].code=code;Q.items[i].stockId='';toast('ไม่พบรหัสนี้ในสต๊อก — พิมพ์ชื่อรายการเองได้');}
      renderQItems();});
    $$('.qname').forEach(el=>el.oninput=e=>{Q.items[+e.target.dataset.i].name=e.target.value;renderQPrev()});
    $$('.qqty').forEach(el=>el.oninput=e=>{Q.items[+e.target.dataset.i].qty=n(e.target.value);calcQuote()});
    $$('.qprice').forEach(el=>el.oninput=e=>{Q.items[+e.target.dataset.i].price=n(e.target.value);calcQuote()});
  }
  const used=qItemsClean(Q).length;
  const li=$('#qLineInfo'); if(li) li.textContent=(lock?pkgQLockMsg(Q)+' · ':'')+'กรอกแล้ว '+used+' รายการ จากทั้งหมด '+Q.items.length+' บรรทัด';
  $$('#v-quote button[onclick^="addQLine"]').forEach(b=>b.disabled=lock);
  if($('#qTier')) $('#qTier').disabled=lock;
  calcQuote();
}
function delQLine(i){ if(pkgQLock(Q)) return toast(pkgQLockMsg(Q));
  Q.items.splice(i,1); if(Q.items.length<QMIN_LINES) Q.items.push(blankQLine('part')); renderQItems(); }
function calcQuote(){
  const rows=$$('#qItems tbody tr');
  Q.items.forEach((it,i)=>{if(rows[i])rows[i].children[6].textContent=money(n(it.qty)*n(it.price))});
  const t=quoteTotals(Q);
  $('#qSub').textContent=money(t.sub);$('#qDiscOut').textContent=money(t.disc);
  $('#qVatOut').textContent=money(t.vat);$('#qTotal').textContent=money(t.total);
  renderQPrev();
}
function saveQuote(){
  if(!can('doc.docQuote')) return toast('บัญชีนี้ไม่มีสิทธิออกใบเสนอราคา');
  if(Q.cancelled) return toast('ใบนี้ถูกยกเลิกแล้ว แก้ไข/บันทึกไม่ได้ — ใช้ปุ่ม "คัดลอกใบนี้" เปิดเป็นใบใหม่แทน');
  if(!Q.custId) return toast('เลือกลูกค้าก่อนบันทึกเอกสาร');
  /* ด่านกติกา — กันกรณีฟอร์มถูกเปิดค้างไว้ก่อนที่อีกหน้าจะปิดการจดทะเบียน VAT
     เช็คเฉพาะใบที่ยังไม่มีเลขที่ ใบเก่าเก็บอัตราของตัวเองไว้ไม่ถูกแตะ */
  if(!Q.no&&vatGuard(Q,'ใบเสนอราคา')) calcQuote();
  Q.date=$('#qDate').value||iso(); Q.jobIn=$('#qJobIn').value||Q.date; Q.mile=$('#qMile').value;
  let renumbered='';
  if(!Q.no){
    const want=Q.previewNo;
    Q.no=docNo('QO');
    if(want&&want!==Q.no) renumbered=' · เลข '+want+' ถูกใช้ไปก่อนแล้ว ระบบเลื่อนเป็นใบถัดไปให้อัตโนมัติ';
  }
  delete Q.previewNo;
  if(pkgQLock(Q)){ const orig=DB.quotes.find(x=>x.id===Q.id);
    if(orig) Q.items=JSON.parse(JSON.stringify(orig.items)); }
  const i=DB.quotes.findIndex(x=>x.id===Q.id), was=i>=0?DB.quotes[i]:null;
  stampRec(Q,was);
  if(i>=0) DB.quotes[i]=cleanQuote(Q); else DB.quotes.push(cleanQuote(Q));
  logAudit('quote',Q,'save','ยอดรวม '+money(quoteTotals(Q).total)+' บาท'+(Q.copiedFrom?' · คัดลอกจาก '+Q.copiedFrom:'')+noVatNote(Q,was));
  save(); refreshQuoteRefs(); refreshReceiptRefs();
  $('#qNo').textContent='เลขที่ '+Q.no+' · '+Q.status; renderQPrev();
  pkgSyncQuoteCopy();if(typeof pkgQuoteMarkSaved==="function")pkgQuoteMarkSaved();
  saveFx('บันทึกเอกสารแล้ว',Q.no);
  toast('บันทึกใบเสนอราคา '+Q.no+' แล้ว'+renumbered);
}
/* ตัดสต๊อกตามใบเสนอราคาใบใดก็ได้ (ใช้ทั้งจากหน้าใบเสนอราคา และจากหน้าใบเสร็จ) */
/* ชุดอะไหล่ = บรรทัดเดียวในเอกสาร แต่สต๊อก/รายงานเห็นเป็นอะไหล่ย่อยตามสำเนา kitItems ที่เก็บตอนเลือก */
function pkgExpandKits(items){ return (items||[]).flatMap(it=>it&&it.type==='kit'
  ?(it.kitItems||[]).map(k=>({type:'part',stockId:k.stockId||'',code:k.code||'',name:k.name||'',unit:k.unit||'',qty:n(it.qty)*n(k.qty),kit:it.name||''})):[it]); }
function pkgStockLines(items){ return pkgExpandKits(items).filter(it=>it&&it.type==='part'&&it.stockId); }
function pkgKitSplit(it){
  const amt=n(it.qty)*n(it.price), parts=(it.kitItems||[]).map(k=>{ const s=DB.stock.find(x=>x.id===k.stockId)||DB.stock.find(x=>x.code===k.code);
    return {cat:(s&&s.cat)||'อื่น ๆ',w:n(k.qty)*(s?n(s.cost):0),q:n(k.qty)}; });
  const tw=parts.reduce((a,p)=>a+p.w,0), tq=parts.reduce((a,p)=>a+p.q,0);
  return parts.length?parts.map(p=>[p.cat,amt*(tw>0?p.w/tw:(tq>0?p.q/tq:1/parts.length))]):[['อื่น ๆ',amt]]; }
function pkgKitPrint(it,d){ if(!it||it.type!=='kit'||!d||!d.kitDetail) return '';
  return '<div style="font-size:90%;color:#555;margin-top:2px">'+(it.kitItems||[]).map(k=>'· '+esc(k.code||'')+' '+esc(k.name||'')+' × '+qf(n(k.qty)*n(it.qty))).join('<br>')+'</div>'; }
async function deductQuoteStock(q){
  if(q.deducted) return true;
  const parts=pkgStockLines(q.items);
  const short=parts.filter(it=>{const s=DB.stock.find(x=>x.id===it.stockId);return s&&n(it.qty)>n(s.qty)});
  if(short.length&&!await askP({title:'สต๊อกไม่พอ',text:'อะไหล่ '+short.length+' รายการมีไม่พอในสต๊อก ยืนยันตัดสต๊อกให้ติดลบหรือไม่?',yes:'ตัดสต๊อกติดลบ',no:'ยังไม่ตัด'})) return false;
  parts.forEach(it=>{const s=DB.stock.find(x=>x.id===it.stockId);
    if(s){s.qty=n(s.qty)-n(it.qty); s.lastMove=iso(); logMove(s.id,'out',-n(it.qty),iso(),'เบิกใช้ตามใบอนุมัติซ่อม'+(it.kit?' · ชุด '+it.kit:''),q.no);}});
  q.deducted=true; q.status='อนุมัติซ่อมแล้ว';
  const i=DB.quotes.findIndex(x=>x.id===q.id);
  if(i>=0&&DB.quotes[i]!==q) DB.quotes[i]=cleanQuote(q);
  if(Q&&Q.id===q.id&&Q!==q){ Q.deducted=true; Q.status=q.status; }
  logAudit('quote',q,'deduct','ตัดสต๊อก '+parts.length+' รายการ');
  save(); renderStock(); refreshQuoteRefs(); refreshReceiptRefs();
  return true;
}
async function approveQuote(){
  if(Q&&Q.cancelled) return toast('ใบนี้ถูกยกเลิกแล้ว อนุมัติไม่ได้ — คัดลอกเป็นใบใหม่แทน');
  if(!can('doc.qApprove')) return toast('บัญชีนี้ไม่มีสิทธิอนุมัติซ่อมและตัดสต๊อก');
  if(!isApproved(Q)) return toast('เอกสารยังไม่ผ่านการอนุมัติ — ต้องให้ผู้มีสิทธิกดอนุมัติใบเสนอราคาก่อน');
  if(!Q.custId) return toast('เลือกลูกค้าก่อน');
  if(!Q.no) fxMute(()=>saveQuote());
  if(Q.deducted) return toast('ใบนี้ตัดสต๊อกไปแล้ว');
  if(!await deductQuoteStock(Q)) return;
  $('#qNo').textContent='เลขที่ '+Q.no+' · '+Q.status; renderQPrev();
  toast('อนุมัติซ่อมและตัดสต๊อกแล้ว');
  const qid=Q.id, qno=Q.no;
  const parts=pkgStockLines(Q.items).length;
  askConfirm({
    ok:'ตัดสต๊อกเรียบร้อยแล้ว'+(parts?' · '+parts+' รายการ':''),
    title:'อนุมัติซ่อมและตัดสต๊อกเรียบร้อยแล้ว',
    msg:'ใบเสนอราคา <b>'+esc(qno)+'</b> อนุมัติซ่อมและตัดสต๊อกเรียบร้อย'
      +'<br><br>ต้องการส่งต่อไปออก <b>ใบเสร็จรับเงิน / ใบแจ้งหนี้</b> เลยหรือไม่?',
    yes:'ไปออกใบเสร็จรับเงิน / ใบแจ้งหนี้',
    no:'ยังไม่ตอนนี้',
    onYes:()=>{ closeModal('mQuoteEdit'); billFromQuote(qid); }
  });
}
$('#qOpen').onchange=()=>{const id=$('#qOpen').value; if(id) openQuoteById(id)};
function openQuoteById(id){ const q=findQuote(id); if(!q) return; logAudit('quote',q,'open');
  Q=JSON.parse(JSON.stringify(q)); Q.finds=normFinds(Q.finds); Q.items=Q.items||[]; padQLines(); fillQuoteForm(); go('quote'); openModal('mQuoteEdit'); toast('เปิดเอกสาร '+q.no); }

/* ---------- แบบฟอร์มใบเสนอราคา ---------- */
function licEnd(){ return DB.shop.licEnd||addDays(DB.shop.licStart||iso(),365); }
function licLeft(){ return daysBetween(iso(),licEnd()); }
function renderLicense(){
  const left=licLeft(), end=licEnd(), warn=left<=30;
  const box=$('#licBox');
  if(box) box.innerHTML=left<0
    ? `<span class="warn">⚠</span> Expired Date <b>${thDate(end)}</b> · <span class="exp">หมดอายุการใช้งานแล้ว ${-left} วัน</span>`
    : `${warn?'<span class="warn">⚠</span>':''}Expired Date <b>${thDate(end)}</b> · เหลืออายุการใช้งาน <b class="${warn?'days':''}">${left}</b> วัน`;
  const al=$('#licAlert');
  if(al) al.innerHTML=left<0
    ? `<div class="licbar dead"><b>⚠ โปรแกรมหมดอายุการใช้งานแล้วเมื่อวันที่ ${thDate(end)}</b>
       <div class="hint" style="margin-top:4px">กรุณาต่ออายุการใช้งานรายปี ติดต่อ Drivebiz Mecalyze Solution Co.,Ltd. (DriveGobaziX<sup class="rmark">®</sup> / DrivegoProX<sup class="rmark">®</sup>) โทร. 082-1087000</div></div>`
    : (warn?`<div class="licbar"><b>⚠ โปรแกรมจะหมดอายุในอีก ${left} วัน (Expired Date ${thDate(end)})</b>
       <div class="hint" style="margin-top:4px">กรุณาต่ออายุการใช้งานรายปีก่อนวันหมดอายุ ติดต่อ Drivebiz Mecalyze Solution Co.,Ltd. (DriveGobaziX<sup class="rmark">®</sup> / DrivegoProX<sup class="rmark">®</sup>) โทร. 082-1087000</div></div>`:'');
  const f=$('#sLicLeft');
  if(f) f.value=left<0?('หมดอายุแล้ว '+(-left)+' วัน'):(left+' วัน');
}
function extendLic(y){
  const base=licLeft()>0?licEnd():iso();
  const d=new Date(base+'T00:00:00'); d.setFullYear(d.getFullYear()+y);
  DB.shop.licEnd=iso(d); if(!DB.shop.licStart) DB.shop.licStart=iso();
  save(); fillSetting(); renderLicense(); toast('ต่ออายุการใช้งานถึงวันที่ '+thDate(DB.shop.licEnd)+' แล้ว');
}
function orgName(){ const s=DB.shop;
  return (s.type==='company'?(s.company||s.name):(s.name||s.person))||'-'; }
/* มุมซ้ายบนแสดงโลโก้ + ชื่อกิจการจากหน้าตั้งค่า (10) — ไม่ใช่โลโก้ผู้พัฒนาแล้ว
   ต้องเรียกซ้ำทุกครั้งที่อัปโหลด/ลบโลโก้ หรือแก้ชื่อกิจการ ให้หัวเว็บตามทัน */
function renderBrand(){
  const img=$('#appLogoImg'), mark=$('#appBrandMark'), nm=$('#appBrandName');
  if(!img||!mark||!nm) return;
  const name=orgName()==='-'?'':orgName();
  nm.textContent=name;
  if(DB.shop.logo){ img.src=DB.shop.logo; img.style.display=''; mark.style.display='none'; }
  else{ img.removeAttribute('src'); img.style.display='none'; mark.style.display='';
    mark.textContent=(name||'D').trim().charAt(0).toUpperCase(); }
}
/* ==========================================================
   กติกาภาษีมูลค่าเพิ่ม — ด่านกลางของทั้งระบบ
   ใช้ isVatReg() ทุกที่แทนการอ่าน DB.shop.vatReg ตรง ๆ
   เพื่อให้หลังบ้าน (Cloud SaaS) แปลงเป็น validation ฝั่ง API ได้จุดเดียว
   ⚠️ เอกสารเก่าอ่านอัตราภาษีจากตัวเองเสมอ (grTotals/receiptTotals อ่าน .vat ของเอกสาร)
      ฟังก์ชันชุดนี้จึงคุมแค่ "เอกสารที่กำลังจะบันทึกใหม่" ไม่ย้อนไปแตะของเก่า
   ========================================================== */
function isVatReg(){ return DB.shop.vatReg!==false; }
/* DriveGo new system (task 3.3, decision R4): the VAT rate in one table, by the day it takes effect (a row is added when
   the rate changes); a document keeps the rate it was made with (its own `vat`) */
const VAT_RATES=[{from:'',rate:7}];
function vatRateOn(d){ const day=String(d||iso()).slice(0,10); return VAT_RATES.reduce((a,x)=>x.from<=day&&x.from>=a.from?x:a,{from:'',rate:0}).rate; }
function vatDefault(){ return isVatReg()?vatRateOn(iso()):0; }
/* เคยออกใบกำกับภาษี / มีภาษีซื้อบันทึกไว้หรือยัง — ใช้ตัดสินว่าจะยังให้เข้าดูย้อนหลังได้ไหม */
function hasVatHistory(){
  return (DB.receipts||[]).some(r=>r.taxNo)
      || (DB.purchases||[]).some(p=>n(p.vat)>0)
      || (DB.expenses||[]).some(x=>n(x.vat)>0);
}
/* ด่านบังคับตอนบันทึก — ถ้าไม่ได้จดทะเบียนแล้วยังมี VAT หลุดมา ให้ตีกลับเป็น 0
   คืน true = ถูกแก้ค่า (ผู้เรียกควรวาดฟอร์มใหม่) */
function vatGuard(doc,label){
  if(isVatReg()||!doc||!n(doc.vat)) return false;
  doc.vat=0;
  toast('กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม — ระบบปรับ VAT ใน'+(label||'เอกสาร')+'เป็น 0 ให้แล้ว');
  return true;
}
/* DriveGo new system (task 3.3, decision R4-ข): in a VAT-registered shop, leaving VAT off a sales document takes the
   right "เลือกไม่คิด VAT (ต้องใส่เหตุผล)" (doc.noVat, 14.js) and a reason, which the document keeps (noVatReason) and the
   audit log records when it is saved. sel: the VAT box that changed; doc: the document in the form; apply(rate): what
   the box did before. */
async function askNoVat(){
  if(!can('doc.noVat')){ toast('บัญชีนี้ไม่มีสิทธิ์เลือกไม่คิด VAT'); return null; }
  const why=await askPromptP({title:'ไม่คิด VAT',text:'เหตุผลที่ไม่คิด VAT',yes:'ตกลง',no:'ยกเลิก',required:true});
  return why===null?null:String(why).trim()||null;
}
async function vatPick(sel,doc,apply){
  const v=n(sel.value);
  if(v||!isVatReg()||!n(doc.vat)){ if(v) delete doc.noVatReason; return apply(v); }
  sel.value=String(doc.vat);   /* stays as it was until the reason is in */
  const why=await askNoVat(); if(why===null) return;
  doc.noVatReason=why; sel.value='0'; apply(0);
}
/* the audit note of a save: the reason, when VAT was left off by this save */
function noVatNote(doc,was){ return doc.noVatReason&&!n(doc.vat)&&(!was||n(was.vat)||was.noVatReason!==doc.noVatReason)?' · ไม่คิด VAT: '+doc.noVatReason:''; }
function wmark(){ const s=DB.shop;
  return s.logo?`<div class="wmark"><img src="${s.logo}" style="opacity:${(n(s.logoOp)||7)/100}"></div>`:''; }
function orgSubName(){ const s=DB.shop;
  if(s.type==='company'&&s.name&&s.name!==s.company) return s.name;
  if(s.type!=='company'&&s.person&&s.person!==s.name) return 'โดย '+s.person;
  return ''; }
function docHead(o){
  const s=DB.shop, f=(o.fields||[]).filter(x=>x&&x[1]);
  const info=[];
  if(s.addr) info.push(esc(s.addr));
  const l2=[]; if(s.tel) l2.push('โทร. '+esc(s.tel)); if(s.email) l2.push(esc(s.email)); if(s.web) l2.push(esc(s.web));
  if(l2.length) info.push(l2.join(' · '));
  const l3=[]; if(s.tax) l3.push('เลขประจำตัวผู้เสียภาษี <b>'+esc(s.tax)+'</b>');
  if(s.type==='company'&&s.branch) l3.push(esc(s.branch));
  if(!isVatReg()) l3.push('(ไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม)');
  if(l3.length) info.push(l3.join(' · '));
  const sub=orgSubName();
  return `<div class="dochd">
    <div class="brand">${s.logo&&s.logoHead!==false?`<img class="dlogo" src="${s.logo}" alt="">`:''}
      <div style="min-width:0">
        <div class="bname">${esc(orgName())}</div>
        ${sub?`<div class="bsub">${esc(sub)}</div>`:''}
        <div class="binfo">${info.join('<br>')}</div>
      </div></div>
    <div class="dmeta">
      ${o.copy?`<div class="copybox">${esc(o.copy)}</div>`:''}
      <div class="dtitle"${o.tsmall?' style="font-size:12.5px;letter-spacing:0;white-space:nowrap"':''}>${esc(o.title||'')}</div>
      ${o.en?`<div class="den">${esc(o.en)}</div>`:''}
      ${f.length?`<table class="dfields">${f.map(([k,v])=>`<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('')}</table>`:''}
      ${o.note?`<div class="dnote">${o.note}</div>`:''}
      ${o.stamp?`<div class="dstamp">${esc(o.stamp)}</div>`:''}
    </div></div>`;
}
function shopHead(){ return docHead({title:'',fields:[]}); }
function sheetTop(o){ return `<div class="sheetpage">${wmark()}${o.stamp?'<div class="apvwm"><span>'+esc(o.stamp)+'</span></div>':''}${docHead(o)}`; }
function sheetQuote(q,copy){
  const c=findCust(q.custId), v=c&&(c.vehicles||[])[q.vehIdx], t=quoteTotals(q), fnd=normFinds(q.finds), its=qItemsClean(q);
  return sheetTop({title:'ใบเสนอราคา / ใบอนุมัติซ่อม',en:'QUOTATION / REPAIR ORDER',copy:copy,
    stamp:q.cancelled?'ยกเลิกแล้ว':(isApproved(q)?'':'ยังไม่อนุมัติ'),
    fields:[['เลขที่',esc(q.no||'(ยังไม่บันทึก)')],['วันที่เอกสาร',thDate(q.date)],
      ['วันที่รับรถเข้า',thDate(q.jobIn||q.date)],['ทะเบียนรถ',esc(plateOf(v))]]})+`
  <table><tr>
    <td style="width:52%;vertical-align:top"><span class="lbl">ลูกค้า (${c?(c.type==='company'?'นิติบุคคล':'บุคคลธรรมดา'):'-'})</span><br>
      <b>${esc(custName(c)||'-')}</b>${c&&c.type==='company'&&c.name?'<br>ผู้นำมาซ่อม: '+esc(c.name):''}<br>
      ${esc(addrLine(c&&c.addr))}<br>เลขประจำตัวผู้เสียภาษี ${esc((c&&c.tax)||'-')}${c&&c.branch?' ('+esc(c.branch)+')':''}<br>
      โทร. ${esc((c&&c.tel)||'-')}${c&&c.tel2?' / '+esc(c.tel2):''}</td>
    <td style="vertical-align:top"><span class="lbl">รายละเอียดรถ</span><br>
      ยี่ห้อ <b>${esc((v&&v.brand)||'-')}</b> · รุ่น ${esc((v&&v.model)||'-')} · สี ${esc((v&&v.color)||'-')}<br>
      ทะเบียน <b>${esc(plateOf(v))}</b><br>เลขไมล์ ${q.mile?n(q.mile).toLocaleString():'-'} กม.${vehIdLine(v)}</td></tr></table>
  <div class="box" style="padding:3px 6px"><span class="lbl">ปัญหาที่ลูกค้าแจ้ง</span>
    <table style="margin-top:2px"><tbody><tr>${q.probs.map((p,i)=>
      `<td style="width:33.3%">${i+1}. ${esc(p||'-')}</td>`).join('')}</tr></tbody></table></div>
  <div class="box" style="padding:4px 6px"><span class="lbl">ปัญหาที่อู่ตรวจพบ และแนวทางแก้ไข &nbsp;(ซ = ซ่อม · บ = เปลี่ยนอะไหล่บางชิ้น · ม = เปลี่ยนอะไหล่ใหม่)${
    empName(q.tech,q.techName)?' &nbsp;·&nbsp; <b>ผู้ประเมินอาการซ่อม: '+esc(empName(q.tech,q.techName))+'</b>':''}</span>
    <table style="margin-top:3px"><tbody><tr>${[0,5].map(off=>`<td style="width:50%;padding:0;border:0;vertical-align:top">
      <table style="margin:0"><thead><tr><th style="width:22px">#</th><th>รายการที่ตรวจพบ</th>
        <th style="width:24px">ซ</th><th style="width:24px">บ</th><th style="width:24px">ม</th></tr></thead><tbody>
      ${[0,1,2,3,4].map(k=>{const f=fnd[off+k];
        return `<tr><td style="text-align:center">${off+k+1}</td><td>${esc(f.t||'')}</td>
        <td style="text-align:center">${f.fix?'✓':''}</td><td style="text-align:center">${f.part?'✓':''}</td>
        <td style="text-align:center">${f.new?'✓':''}</td></tr>`}).join('')}
      </tbody></table></td>`).join('')}</tr></tbody></table></div>
  <table style="margin-top:8px"><thead><tr><th style="width:30px">#</th><th style="width:105px">รหัสสินค้า</th>
    <th style="width:100px">OEM</th><th>รายการอะไหล่ / ค่าแรง เสนอซ่อม</th><th style="width:48px">จำนวน</th>
    <th style="width:78px">ราคา/หน่วย</th><th style="width:88px">จำนวนเงิน</th></tr></thead><tbody>
    ${its.length?its.map((it,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(it.code||'-')}</td>
      <td>${esc(it.oem||'-')}</td><td>${esc(it.name)}${pkgKitPrint(it,q)}</td><td style="text-align:center">${qf(it.qty)}</td>
      <td class="num">${money(it.price)}</td><td class="num">${money(n(it.qty)*n(it.price))}</td></tr>`).join('')
      :'<tr><td colspan="7" style="text-align:center;color:#777">— ยังไม่มีรายการเสนอซ่อม —</td></tr>'}
    <tr><td colspan="6" style="text-align:right">รวมเป็นเงิน</td><td class="num">${money(t.sub)}</td></tr>
    <tr><td colspan="6" style="text-align:right">หักส่วนลด</td><td class="num">${money(t.disc)}</td></tr>
    <tr><td colspan="6" style="text-align:right">ภาษีมูลค่าเพิ่ม ${n(q.vat)}%</td><td class="num">${money(t.vat)}</td></tr>
    <tr><td colspan="6" style="text-align:right"><b>ยอดรวมสุทธิ</b></td><td class="num"><b>${money(t.total)}</b></td></tr>
    <tr><td colspan="7" style="text-align:center">(${bahtText(t.total)})</td></tr></tbody></table>
  <div class="note" style="margin-top:5px"><b>หมายเหตุ</b> &nbsp;1. เจ้าของรถ / ผู้อนุมัติซ่อม ได้รับทราบถึงรายการและค่าใช้จ่ายตามใบเสนอซ่อมนี้เป็นที่เรียบร้อย ไม่มีข้อโต้แย้งใด &nbsp; 2. การเสนอซ่อมตามใบเสนอราคานี้ เป็นการเสนอตามอาการที่วิเคราะห์ได้ครั้งแรก หากทำการซ่อมแล้วมีอะไหล่หรืออาการเสียเพิ่มเติม ผู้อนุมัติซ่อมยินดีที่จะให้ซ่อมจนแล้วเสร็จ โดยผู้เสนอราคาจะทำการแจ้งอีกครั้งหนึ่ง</div>
  <div class="sign">
    <div><div class="line"></div>( ${esc(q.byName||'.................................................')} )<br>
      <span class="lbl">ผู้เสนอซ่อม · ${esc(q.byPos||'ตำแหน่ง.............................')}</span><br><span class="lbl">วันที่ ......../......../........</span></div>
    <div><div class="line"></div>( ${esc(q.apName||'.................................................')} )<br>
      <span class="lbl">ผู้อนุมัติซ่อม · ${esc(q.apPos||'ตำแหน่ง.............................')}</span><br><span class="lbl">วันที่ ......../......../........</span></div>
  </div>${apvFoot(q)}</div>`;
}
function quoteSheets(q){ return sheetQuote(q,'ต้นฉบับ')+sheetQuote(q,'สำเนา'); }
function renderQPrev(){ $('#qPrev').innerHTML=quoteSheets(Q); fitSheets($('#qPrev')); }
const A4H=1045;   /* ความสูงที่พิมพ์ได้จริงต่อหน้า (px @96dpi) */
function fitSheets(box){
  if(!box) return;
  [...box.querySelectorAll('.sheetpage')].forEach(el=>{
    el.classList.remove('tight','tighter');
    if(!el.scrollHeight) return;
    if(el.scrollHeight>A4H) el.classList.add('tight');
    if(el.scrollHeight>A4H) el.classList.add('tighter');
  });
}
function printDocs(html){
  const st=$('#printStage'); st.innerHTML=html;
  st.style.cssText='display:block;position:absolute;left:-10000px;top:0;width:210mm';
  fitSheets(st);
  st.style.cssText='';
  setTimeout(()=>window.print(),80);
}
function printQuote(){
  saveQuote(); if(!Q.no) return;
  logAudit('quote',Q,'print','ต้นฉบับ + สำเนา'); save(); printDocs(quoteSheets(Q)); }

/* ==========================================================
   ใบเสร็จรับเงิน / ใบกำกับภาษี
   ========================================================== */
let R=null;
function blankReceipt(){ return {id:uid(),no:'',taxNo:'',taxDocs:[],issueTax:false,date:iso(),quoteId:'',ref:'',custId:'',vehIdx:0,
  items:[],disc:0,vat:vatDefault(),wht:0,whtBase:'labor',warr:DB.shop.warr||'',deducted:false,
  pay:{cash:false,trans:false,credit:false,card:false,chk:false,days:30,due:'',bank:'',when:'',cardBank:'',card4:'',cardPct:0,cardRef:'',cashAmt:0,transAmt:0,cardAmt:0,chkAmt:0,chkBank:'',chkNo:'',chkDate:''},
  tech1:'',tech1Name:'',tech2:'',tech2Name:'',paid:false,paidDate:'',by:'',note:'',taxCancelled:false,taxCancelReason:'',taxCancelDate:'',
  apv:{status:'draft',byName:'',date:'',note:''}}; }
function newReceipt(){ R=blankReceipt(); fillReceiptForm(); openModal('mReceiptEdit'); toast('เริ่มใบเสร็จใหม่ · ลงวันที่ '+thDate(R.date)); }
let rOvPane='doc';
const ROV_TITLE={doc:'4.1 ใบแจ้งหนี้ / ใบเสร็จรับเงิน',billing:'4.2 ใบวางบิล',tax:'4.3 ใบกำกับภาษี',retail:'4.4 ตัดสต็อกสินค้า'};
function rOvGo(v){
  rOvPane=v;
  $$('#rOvTabs button').forEach(x=>x.classList.toggle('on',x.dataset.t===v));
  $('#rOv-doc').style.display=v==='doc'?'':'none';
  $('#rOv-tax').style.display=v==='tax'?'':'none';
  $('#rOv-billing').style.display=v==='billing'?'':'none';
  if($('#rOv-cut')) $('#rOv-cut').style.display=v==='retail'?'':'none';
  const ttl=$('#rOvTitle'); if(ttl) ttl.textContent=ROV_TITLE[v]||ROV_TITLE.doc;
  if(v==='retail'){ if(typeof pkgRenderCuts==='function') pkgRenderCuts(); }
  else if(v==='tax') renderTaxOverview();
  else if(v==='billing') renderBillingList();
  else renderDocOverview();
}
if($('#rOvTabs')) $('#rOvTabs').addEventListener('click',e=>{const b=e.target.closest('button'); if(b){ go('receipt'); rOvGo(b.dataset.t); }});
/* ตารางรวม ใบแจ้งหนี้ + ใบเสร็จรับเงิน
   แยก "ประเภทเอกสาร" ออกจาก "การชำระเงิน" คนละคอลัมน์ เพราะเป็นคนละเรื่องกัน */
function docRowsAll(){
  const inInv={};
  DB.invoices.forEach(inv=>{ if(inv.srcType==='tax') (inv.refIds||[]).forEach(rid=>{ inInv[rid]=inv.no; }); });
  const invRows=DB.invoices.map(inv=>{
    const items=(inv.refIds||[]).map(id=>invoiceRefDocFor(inv,id)).filter(Boolean);
    return {kind:'inv',id:inv.id,no:inv.no,date:inv.date,custId:inv.custId,
      gross:items.reduce((s,d)=>s+(inv.srcType==='quote'?quoteTotals(d).total:receiptTotals(d).gross),0),
      amt:items.reduce((s,d)=>s+invoiceRefAmtFor(inv,d),0),
      paid:!!inv.settled,due:inv.due||inv.date,note:'',obj:inv};
  });
  /* แยกป้ายกำกับกับเลขที่ออกจากกัน เพื่อให้แสดงคนละบรรทัดในตาราง —
     ถ้ารวมเป็นข้อความเดียว ("ใบกำกับภาษี RT.69-08-13-02") คอลัมน์เลขที่ต้องกว้างเกินจำเป็น */
  const recRows=DB.receipts.map(r=>{
    const lbl=inInv[r.id]?'อยู่ในใบแจ้งหนี้':(r.taxNo?'ใบกำกับภาษี':'');
    const val=inInv[r.id]?inInv[r.id]:(r.taxNo||'');
    return {kind:'rec',id:r.id,no:r.no,date:r.date,custId:r.custId,
      gross:receiptTotals(r).gross,amt:receiptTotals(r).net,paid:!!r.paid,due:(r.pay&&r.pay.due)||r.date,
      noteLbl:lbl,noteVal:val,note:lbl?(lbl+' '+val):'',obj:r};
  });
  return [...invRows,...recRows];
}
function docPayState(x,today){
  if(x.paid) return 'paid';
  return daysBetween(x.due||x.date,today)>0?'over':'unpaid';
}
function renderDocOverview(){
  if(typeof pkgRetailOverview==='function') pkgRetailOverview();
  const today=iso(), mo=today.slice(0,7);
  $('#rOvToday').textContent='วันนี้ '+DB.receipts.filter(r=>r.date===today&&!r.cancelled&&(rOvPane!=='retail'||r.salesChannel==='retail')).length+' ใบ';
  $('#rOvMonth').textContent='เดือนนี้ '+DB.receipts.filter(r=>ym(r.date)===mo&&!r.cancelled&&(rOvPane!=='retail'||r.salesChannel==='retail')).length+' ใบ';
  const q=($('#docOvSearch').value||'').toLowerCase().trim();
  const fPay=($('#docOvPay')||{}).value||'';   /* ช่องกรองการชำระเงินถูกถอดออกจากหน้าจอแล้ว — สถานะยังดูได้จากป้ายในตาราง */
  let rows=docRowsAll().filter(x=>rOvPane!=='retail'||(x.kind==='rec'&&x.obj.salesChannel==='retail')).sort((a,b)=>b.date.localeCompare(a.date)||String(b.no).localeCompare(String(a.no)));
  if(fPay) rows=rows.filter(x=>docPayState(x,today)===fPay);
  if(q) rows=rows.filter(x=>[x.no,custName(findCust(x.custId))].some(s=>String(s||'').toLowerCase().includes(q)));
  rows=applyDateFilter(rows,'docOvDate');
  $('#docOvCount').textContent=rows.length+' ใบ';
  $('#docOvDue').textContent='ค้างชำระ '+rows.filter(x=>!x.paid).length+' ใบ';
  rows=sortRows('docOvTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'docOv');
  const PAY_CHIP={paid:'<span class="stbtn st-green">ชำระแล้ว</span>',
    over:'<span class="stbtn st-red">เกินกำหนด</span>',
    unpaid:'<span class="stbtn st-orange">ค้างชำระ</span>'};
  $('#docOvTbl tbody').innerHTML=rows.map(x=>{
    const c=findCust(x.custId), isInv=x.kind==='inv';
    const open=isInv?`openInvoiceById('${x.id}')`:`openReceiptById('${x.id}')`;
    const settle=isInv?`settleInvoiceDoc('${x.id}');renderDocOverview()`:`openPartPay('ar','${x.custId}','${x.id}')`;
    const cancelled=!!x.obj.cancelled;
    const a=apvOf(x.obj).status;
    const apvChipHtml=cancelled?'<span class="stbtn st-red" title="'+esc(x.obj.cancelReason||'')+'">ยกเลิกแล้ว</span>'
      :a==='approved'?'<span class="stbtn st-green">อนุมัติแล้ว</span>'
      :a==='rejected'?'<span class="stbtn st-red">ตีกลับ</span>'
      :'<span class="stbtn st-blue">รออนุมัติ</span>';
    const cancelFn=isInv?`cancelInvoiceDoc('${x.id}')`:`cancelReceiptDoc('${x.id}')`;
    return `<tr${cancelled?' class="cancelrow"':''}>
      <td class="mono" style="font-size:12.5px"><span class="docno" onclick="${open}">${esc(x.no||'(ไม่มีเลขที่)')}</span>
        ${x.noteLbl?`<div class="hint">${esc(x.noteLbl)}</div><div class="hint">${esc(x.noteVal)}</div>`:''}</td>
      <td class="ctr">${thDate(x.date)}</td><td>${esc(custName(c)||(x.obj.salesChannel==='retail'?'ลูกค้าทั่วไป / ขายหน้าร้าน':'-'))}</td>
      <td class="num">${money(x.gross)}</td>
      <td class="num"><b>${money(x.amt)}</b></td>
      <td class="ctr">${x.due?thDate(x.due):'-'}</td>
      <td class="ctr">${apvChipHtml}</td>
      <td class="ctr">${cancelled?'<span class="hint">-</span>':PAY_CHIP[docPayState(x,today)]}</td>
      ${byCell(x.obj)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px;width:106px">
        ${cancelled?'<span class="hint">ยกเลิกแล้ว</span>':`<button class="btn sm dgr pc-delDoc" onclick="${cancelFn};event.stopPropagation()">ยกเลิก</button>`}
      </div></td></tr>`;}).join('');
  $('#docOvEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('docOvTbl');
  if(typeof mkCards==='function') mkCards('docOvTbl');
}
const renderReceiptOverview=renderDocOverview, renderInvoiceList=renderDocOverview;
['docOvPay'].forEach(id=>{ const el=$('#'+id); if(el) el.onchange=renderDocOverview; });
if($('#docOvSearch')) $('#docOvSearch').onkeydown=e=>{ if(e.key==='Enter') renderDocOverview(); };
/* ใบเสร็จที่ยังออกใบกำกับภาษีได้ — ใบที่มีใบกำกับใช้งานอยู่แล้วจะไม่อยู่ในรายการ */
function taxEligibleReceipts(){
  return DB.receipts.filter(r=>{
    if(r.cancelled) return false;   /* ใบเสร็จที่ยกเลิกแล้ว ออกใบกำกับภาษีไม่ได้ */
    const last=(r.taxDocs||[]).length?r.taxDocs[r.taxDocs.length-1]:null;
    return !last||last.cancelled;
  }).sort((a,b)=>b.date.localeCompare(a.date));
}
function taxPickerRows(){
  return taxEligibleReceipts().map(r=>{ const c=findCust(r.custId);
    return {id:r.id, text:r.no, sub:custName(c)||'-',
      meta:money(receiptTotals(r).net)+' บาท\n'+thDate(r.date),
      find:[r.no,custName(c),c&&c.name,c&&c.company,c&&c.tel,c&&c.tel2].filter(Boolean).join(' ')};
  });
}
function refreshTaxReceiptPicker(){
  const el=$('#taxNewReceipt'); if(!el) return;
  const cur=el.value, eligible=taxEligibleReceipts();
  el.innerHTML='<option value="">— เลือกใบเสร็จ —</option>'
    +eligible.map(r=>`<option value="${r.id}">${esc(r.no)} · ${esc(custName(findCust(r.custId))||'-')} · ${money(receiptTotals(r).net)} บาท</option>`).join('');
  el.value=eligible.some(r=>r.id===cur)?cur:'';
  const em=$('#taxNewEmpty'); if(em) em.style.display=eligible.length?'none':'';
  el.disabled=!eligible.length;
  if(taxPicker) taxPicker.sync();   /* ซิงก์ช่องพิมพ์ค้นหาตามรายการที่เหลืออยู่จริง */
}
/* ช่องเลือกใบเสร็จเป็นแบบพิมพ์ค้นหา — ค้นได้ทั้งเลขที่ใบเสร็จ ชื่อลูกค้า และเบอร์โทร */
const taxPicker=bindPicker('taxNewSearch','taxNewSug','taxNewReceipt',taxPickerRows);
function taxPickerClear(){ if(taxPicker) taxPicker.clear(); toast('ล้างใบที่เลือกแล้ว — เลือกใบใหม่ได้เลย'); }
function openTaxNew(){
  if(!isVatReg()) return toast('กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงออกใบกำกับภาษีไม่ได้');
  if(!can('doc.rIssue')) return toast('บัญชีนี้ไม่มีสิทธิออกใบกำกับภาษี');
  refreshTaxReceiptPicker();
  openModal('mTaxNew');
}
async function issueTaxFromRegistry(){
  const rid=$('#taxNewReceipt').value;
  if(!rid) return toast('เลือกใบเสร็จที่จะออกใบกำกับภาษีก่อน');
  closeModal('mTaxNew');
  openReceiptById(rid);
  $('#rIssueTax').checked=true;
  calcReceipt();
  await saveReceipt();
  renderTaxOverview();
}
function renderTaxOverview(){
  refreshTaxReceiptPicker();
  /* the date filter goes by the day an invoice was made (task 3.3: it is dated on the day of the sale) */
  const rows0=DB.receipts.flatMap(r=>(r.taxDocs||[]).map((d,i,arr)=>({r,d,isLatest:i===arr.length-1,date:d.issued||d.date})));
  $('#taxOvCount').textContent=rows0.length+' ใบ';
  $('#taxOvCancelCount').textContent='ยกเลิก '+rows0.filter(x=>x.d.cancelled).length+' ใบ';
  const q=($('#taxOvSearch').value||'').toLowerCase().trim();
  let rows=rows0.slice().sort((a,b)=>b.d.date.localeCompare(a.d.date)||String(b.d.no).localeCompare(String(a.d.no)));
  if(q) rows=rows.filter(x=>[x.d.no,x.r.no,custName(findCust(x.r.custId))].some(s=>String(s||'').toLowerCase().includes(q)));
  rows=applyDateFilter(rows,'taxOvDate');
  rows=sortRows('taxOvTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'taxOv');
  $('#taxOvTbl tbody').innerHTML=rows.map(x=>{
    const c=findCust(x.r.custId), t=x.d.gross!==undefined?{gross:x.d.gross}:receiptTotals(x.r);
    return `<tr${x.d.cancelled?' class="cancelrow"':''}><td class="mono" style="font-size:12.5px"><span class="docno" onclick="openReceiptById('${x.r.id}')">${esc(x.d.no)}</span></td><td class="mono click" style="font-size:12.5px" onclick="openReceiptById('${x.r.id}')">${esc(x.r.no)}</td>
      <td class="ctr">${thDate(x.d.date)}${x.d.issued&&x.d.issued!==x.d.date?'<div class="hint">ออก '+thDate(x.d.issued)+'</div>':''}</td><td>${esc(custName(c)||'-')}</td>
      <td class="num">${money(t.gross)}</td>
      <td class="ctr">${x.d.cancelled?'<span class="chip r" title="'+esc(x.d.cancelReason||'')+'">ยกเลิก</span>':'<span class="chip g">ปกติ</span>'}</td>
      ${byCell(x.r)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px;width:106px">
        ${x.d.cancelled?'':`<button class="btn sm gh" onclick="printTaxDoc('${x.r.id}','${esc(x.d.no)}')">พิมพ์</button>`}
        ${(!x.d.cancelled&&x.isLatest)
          ? `<button class="btn sm dgr pc-rIssue" onclick="toggleTaxCancel('${x.r.id}')">ยกเลิก</button>`:''}</div></td></tr>`;}).join('');
  $('#taxOvEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('taxOvTbl');
  if(typeof mkCards==='function') mkCards('taxOvTbl');
}
if($('#taxOvSearch')) $('#taxOvSearch').onkeydown=e=>{ if(e.key==='Enter') renderTaxOverview(); };
function syncTaxLegacy(r){
  const cur=(r.taxDocs||[]).length?r.taxDocs[r.taxDocs.length-1]:null;
  r.taxCancelled=!!(cur&&cur.cancelled); r.taxCancelReason=(cur&&cur.cancelReason)||''; r.taxCancelDate=(cur&&cur.cancelDate)||'';
}
async function handleIssueTaxToggle(){
  const cb=$('#rIssueTax');
  if(cb.checked){ calcReceipt(); return; }
  const cur=(R.taxDocs||[]).length?R.taxDocs[R.taxDocs.length-1]:null;
  if(!cur||cur.cancelled){ calcReceipt(); return; }
  if(!await toggleDocCancel(R,'taxDocs','taxNo','tax','ใบกำกับภาษี')){ cb.checked=true; calcReceipt(); return; }
  syncTaxLegacy(R);
  const i=DB.receipts.findIndex(x=>x.id===R.id);
  if(i>=0){ DB.receipts[i].taxDocs=JSON.parse(JSON.stringify(R.taxDocs)); DB.receipts[i].taxNo=R.taxNo; syncTaxLegacy(DB.receipts[i]); }
  save();
  $('#rTaxNo').value=R.taxNo;
  calcReceipt();
  toast('ยกเลิกใบกำกับภาษี '+cur.no+' แล้ว');
}
async function toggleTaxCancel(id){
  if(!can('doc.rIssue')) return toast('บัญชีนี้ไม่มีสิทธิจัดการใบกำกับภาษี');
  const r=DB.receipts.find(x=>x.id===id); if(!r||!r.taxNo) return;
  /* ใบกำกับภาษีที่ยกเลิกแล้วคืนสถานะไม่ได้ตามหลักภาษี ต้องออกเลขที่ใหม่แทน */
  const cur=(r.taxDocs||[]).length?r.taxDocs[r.taxDocs.length-1]:null;
  if(cur&&cur.cancelled) return toast('ใบกำกับภาษี '+cur.no+' ถูกยกเลิกแล้ว คืนสถานะไม่ได้');
  if(r.cancelled) return toast('เอกสาร '+r.no+' ถูกยกเลิกไปแล้ว');
  /* DriveGo new system (task 3.3, decision R6-ก): only the tax invoice is cancelled (a wrong name or tax ID); the bill,
     its payments and the stock stay as they are, and a new tax invoice can be issued in its place */
  const no=cur?cur.no:r.taxNo;
  if(!await askP({title:'ยกเลิกใบกำกับภาษี '+no,yes:'ยกเลิกใบกำกับภาษี',no:'ไม่ยกเลิก',
    text:'ยกเลิกเฉพาะใบกำกับภาษี '+no+' บิล การรับเงิน และสต๊อกไม่เปลี่ยน\nออกใบกำกับภาษีใบใหม่แทนได้'})) return;
  if(!await toggleDocCancel(r,'taxDocs','taxNo','tax','ใบกำกับภาษี')) return;
  syncTaxLegacy(r); r.issueTax=false; r.taxNo='';   /* the cancelled number stays in taxDocs */
  save(); renderTaxOverview(); renderDocOverview(); renderHome();
  if(R&&R.id===id){ R.issueTax=false; R.taxNo=''; R.taxCancelled=r.taxCancelled;
    R.taxCancelReason=r.taxCancelReason; R.taxCancelDate=r.taxCancelDate; fillReceiptForm(); }
  toast('ยกเลิกใบกำกับภาษี '+no+' แล้ว — ออกใบกำกับภาษีใบใหม่แทนได้');
}
/* พิมพ์ใบกำกับภาษีโดยตรงจากทะเบียน 4.3 (ต้นฉบับ + สำเนา)
   รองรับเลขที่ในประวัติด้วย จึงส่งเลขที่มาระบุ ไม่ยึด r.taxNo ล่าสุดเสมอ */
function printTaxDoc(id,no){
  const r=DB.receipts.find(x=>x.id===id); if(!r) return;
  if(!r.taxNo) return toast('ใบเสร็จนี้ยังไม่มีเลขที่ใบกำกับภาษี');
  const doc=(r.taxDocs||[]).slice().reverse().find(d=>d.no===no);
  const rr=JSON.parse(JSON.stringify(r));
  /* ใบที่ถูกยกเลิกยังพิมพ์เก็บเป็นหลักฐานได้ แต่ประทับลายน้ำ "ยกเลิกแล้ว" กันนำไปใช้ซ้ำ */
  if(doc&&doc.cancelled){ rr.cancelled=true; toast('ใบกำกับภาษี '+no+' ถูกยกเลิกแล้ว — พิมพ์พร้อมลายน้ำ "ยกเลิกแล้ว"'); }
  if(no) rr.taxNo=no;
  if(doc&&doc.date) rr.date=doc.date;
  logAudit('receipt',r,'print','ใบกำกับภาษี '+(no||r.taxNo)+' 2 แผ่น');
  save();
  printDocs(sheetReceipt(rr,'RT','ต้นฉบับ')+sheetReceipt(rr,'RT','สำเนา'));
}
/* ==========================================================
   ใบแจ้งหนี้ — ดึงจากใบกำกับภาษี (ใบเสร็จค้างชำระ) หรือใบเสนอราคา (ที่ยังไม่ออกใบเสร็จ)
   รวมได้หลายรายการต่อ 1 ใบแจ้งหนี้
   ========================================================== */
let IV=null;
function blankInvoice(){ return {id:uid(),no:'',date:iso(),custId:'',due:'',srcType:'tax',refIds:[],note:'',
  settled:false,settledDate:'',apv:{status:'draft',byName:'',date:'',note:''}}; }
function newInvoiceDoc(){ IV=blankInvoice(); fillInvoiceForm(); toast('เปิดใบแจ้งหนี้ใบใหม่'); }
function filterSelectOptions(selId,q){
  q=(q||'').toLowerCase().trim();
  $$('#'+selId+' option').forEach(o=>{ o.style.display=(!q||!o.value||o.textContent.toLowerCase().includes(q))?'':'none'; });
}
function fillInvoiceForm(){
  if(!IV) return;
  $('#ivNo').textContent=IV.no||'เอกสารใหม่';
  $('#ivDate').value=IV.date; $('#ivDue').value=IV.due||''; $('#ivNote').value=IV.note||''; $('#ivSrcType').value=IV.srcType||'tax';
  const cur=$('#ivCust').value;
  $('#ivCust').innerHTML='<option value="">— เลือกลูกค้า —</option>'+DB.cust.map(c=>
    `<option value="${c.id}">${esc(custName(c))}${c.tel?' · '+esc(c.tel):''}</option>`).join('');
  $('#ivCust').value=IV.custId||cur||'';
  if(typeof ivCustPicker!=='undefined'&&ivCustPicker) ivCustPicker.sync();
  renderInvoiceItems(); renderApvBars();
}
function eligibleInvoiceSrc(custId,srcType){
  if(!custId) return [];
  if(srcType==='quote'){
    const billed=billedQuoteIds();
    return DB.quotes.filter(q=>q.custId===custId&&!billed.has(q.id)).sort((a,b)=>b.date.localeCompare(a.date));
  }
  return DB.receipts.filter(r=>r.custId===custId&&r.taxNo&&!r.taxCancelled&&!r.paid&&!r.cancelled).sort((a,b)=>b.date.localeCompare(a.date));
}
function invoiceRefDocFor(inv,id){ return inv.srcType==='quote'?findQuote(id):DB.receipts.find(x=>x.id===id); }
function invoiceRefAmtFor(inv,d){ return inv.srcType==='quote'?quoteTotals(d).total:receiptTotals(d).net; }
function onInvoiceCustOrTypeChange(){
  const newCust=$('#ivCust').value, newType=$('#ivSrcType').value;
  if(!IV.settled&&(newCust!==IV.custId||newType!==IV.srcType)) IV.refIds=[];
  IV.custId=newCust; IV.srcType=newType;
  renderInvoiceItems();
}
function pullInvoiceRefs(){
  if(IV.settled) return toast('ใบนี้บันทึกรับชำระแล้ว ดึงรายการใหม่ไม่ได้');
  IV.custId=$('#ivCust').value; IV.srcType=$('#ivSrcType').value;
  if(!IV.custId) return toast('เลือกลูกค้าก่อน');
  const list=eligibleInvoiceSrc(IV.custId,IV.srcType);
  if(!list.length) return toast(IV.srcType==='quote'?'ลูกค้ารายนี้ไม่มีใบเสนอราคาที่ยังไม่ออกใบเสร็จ':'ลูกค้ารายนี้ไม่มีใบกำกับภาษีค้างชำระ');
  IV.refIds=list.map(x=>x.id);
  renderInvoiceItems();
  toast('ดึงรายการมา '+list.length+' รายการ');
}
function toggleInvoiceLine(id){
  if(IV.settled) return;
  const i=IV.refIds.indexOf(id);
  if(i>=0) IV.refIds.splice(i,1); else IV.refIds.push(id);
  renderInvoiceItems();
}
function renderInvoiceItems(){
  const lock=!!IV.settled;
  const elig=eligibleInvoiceSrc(IV.custId,IV.srcType), eligIds=new Set(elig.map(x=>x.id));
  const extra=IV.refIds.filter(id=>!eligIds.has(id)).map(id=>invoiceRefDocFor(IV,id)).filter(Boolean);
  const all=[...elig,...extra];
  const q=($('#ivDocSearch').value||'').toLowerCase().trim();
  const rows=q?all.filter(d=>String(d.no||'').toLowerCase().includes(q)):all;
  $('#ivItems tbody').innerHTML=rows.length?rows.map(d=>{
    const checked=IV.refIds.includes(d.id);
    return `<tr>
      <td class="ctr">${lock?(checked?'✓':''):`<input type="checkbox" ${checked?'checked':''} onchange="toggleInvoiceLine('${d.id}')">`}</td>
      <td class="mono" style="font-size:12px">${esc(d.no||'(ยังไม่บันทึก)')}</td>
      <td class="ctr">${thDate(d.date)}</td>
      <td class="num">${money(invoiceRefAmtFor(IV,d))}</td></tr>`;
  }).join(''):'<tr><td colspan="4" class="empty">ไม่มีรายการให้เลือก — เลือกลูกค้าและประเภทเอกสารก่อน</td></tr>';
  invoiceLineInfo();
}
function invoiceLineInfo(){
  const li=$('#ivLineInfo'); if(!li) return;
  const items=IV.refIds.map(id=>invoiceRefDocFor(IV,id)).filter(Boolean);
  const total=items.reduce((a,d)=>a+invoiceRefAmtFor(IV,d),0);
  li.textContent=(IV.settled?'ใบนี้บันทึกรับชำระแล้ว — ':'')+'เลือกแล้ว '+items.length+' รายการ · ยอดรวม '+money(total)+' บาท';
}
function collectInvoice(){
  IV.date=$('#ivDate').value||iso(); IV.custId=$('#ivCust').value; IV.srcType=$('#ivSrcType').value;
  IV.due=$('#ivDue').value; IV.note=$('#ivNote').value.trim();
}
function saveInvoiceDoc(){
  collectInvoice();
  if(!IV.custId) return toast('เลือกลูกค้าก่อนบันทึก');
  if(!IV.refIds.length) return toast('เลือกเอกสารอ้างอิงอย่างน้อย 1 รายการ');
  if(!IV.no) IV.no=docNo('IV');
  const i=DB.invoices.findIndex(x=>x.id===IV.id);
  stampRec(IV,i>=0?DB.invoices[i]:null);
  const rec=JSON.parse(JSON.stringify(IV));
  if(i>=0) DB.invoices[i]=rec; else DB.invoices.push(rec);
  logAudit('invoice',IV,'save',IV.refIds.length+' รายการ');
  save(); $('#ivNo').textContent=IV.no; refreshInvoiceOpenSelect(); renderInvoiceList(); renderApvBars();
  saveFx('บันทึกเอกสารแล้ว',IV.no);
  toast('บันทึกใบแจ้งหนี้ '+IV.no+' แล้ว');
}
function sheetInvoiceDoc(inv,copy){
  const c=findCust(inv.custId);
  const items=inv.refIds.map(id=>invoiceRefDocFor(inv,id)).filter(Boolean);
  const total=items.reduce((a,d)=>a+invoiceRefAmtFor(inv,d),0);
  const bank=(DB.shop.banks||[]).find(x=>x.general)||(DB.shop.banks||[])[0];
  const srcLabel=inv.srcType==='quote'?'ใบเสนอราคา':'ใบกำกับภาษี';
  return sheetTop({title:'ใบแจ้งหนี้',en:'INVOICE',copy:copy,
    stamp:inv.cancelled?'ยกเลิกแล้ว':(isApproved(inv)?'':'ยังไม่อนุมัติ'),
    fields:[['เลขที่',esc(inv.no||'(ยังไม่บันทึก)')],['วันที่ออกใบแจ้งหนี้',thDate(inv.date)],
      ['กำหนดชำระ',inv.due?thDate(inv.due):'-'],['อ้างอิงจาก',srcLabel+' '+items.length+' ใบ']]})+`
  <table><tr><td><span class="lbl">เรียน</span><br>
    <b>${esc(custName(c)||'-')}</b>${c&&c.type==='company'&&c.name?'<br>ผู้ติดต่อ: '+esc(c.name):''}<br>
    ${esc(addrLine(c&&c.addr))}<br>เลขประจำตัวผู้เสียภาษี ${esc((c&&c.tax)||'-')}${c&&c.branch?' ('+esc(c.branch)+')':''}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:34px">ลำดับ</th><th style="width:140px">เลขที่${srcLabel}</th>
    <th style="width:90px">วันที่</th><th>รายละเอียด</th><th style="width:100px">จำนวนเงิน</th></tr></thead><tbody>
    ${items.map((d,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(d.no)}</td>
      <td style="text-align:center">${thDate(d.date)}</td>
      <td>${esc(srcLabel)}</td><td class="num">${money(invoiceRefAmtFor(inv,d))}</td></tr>`).join('')}
    <tr><td colspan="4" style="text-align:right"><b>ยอดรวมที่แจ้งหนี้</b></td><td class="num"><b>${money(total)}</b></td></tr>
    <tr><td colspan="5" style="text-align:center">(${bahtText(total)})</td></tr>
  </tbody></table>
  <div class="box"><span class="lbl">เงื่อนไขการชำระเงิน</span><br>
    กรุณาชำระเงินภายในวันที่ <b>${inv.due?thDate(inv.due):'-'}</b> เป็นจำนวนเงิน <b>${money(total)} บาท</b>
    ${bank?'<br>โอนเข้าบัญชี '+esc(bankLabel(bank)):''}
    ${inv.note?'<br><span class="lbl">หมายเหตุ: '+esc(inv.note)+'</span>':''}</div>
  <div class="sign">
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้แจ้งหนี้</span></div>
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้รับแจ้งหนี้</span></div>
  </div>
  ${apvFoot(inv)}</div>`;
}
function printInvoiceDoc(){
  if(!IV) return;
  collectInvoice();
  if(!IV.refIds.length) return toast('เลือกเอกสารอ้างอิงก่อนพิมพ์');
  if(!IV.no) toast('แนะนำให้บันทึกก่อนพิมพ์ เพื่อให้มีเลขที่เอกสาร');
  logAudit('invoice',IV,'print','ต้นฉบับ + สำเนา'); save();
  printDocs(sheetInvoiceDoc(IV,'ต้นฉบับ')+sheetInvoiceDoc(IV,'สำเนา'));
}
function openInvoiceById(id){
  const inv=DB.invoices.find(x=>x.id===id); if(!inv) return;
  logAudit('invoice',inv,'open');
  IV=JSON.parse(JSON.stringify(inv)); fillInvoiceForm();
  go('receipt'); rOvGo('invoice'); openModal('mInvoiceEdit'); toast('เปิด '+inv.no);
}
/* ยกเลิกใบเสร็จรับเงิน / ใบแจ้งหนี้ — เก็บไว้ดูย้อนหลัง ไม่ลบทิ้ง
   และยกเลิกใบกำกับภาษีที่ผูกอยู่ให้ด้วย เพราะใบกำกับของเอกสารที่ยกเลิกใช้ไม่ได้ */
/* ยกเลิกใบที่กำลังเปิดอยู่ในฟอร์ม — ใช้ตรรกะเดียวกับปุ่มยกเลิกในทะเบียนทุกประการ
   (เช็คสิทธิ · เช็คว่าอยู่ในใบวางบิลไหม · ถามเหตุผล · ยกเลิกใบกำกับภาษีที่ผูกอยู่) */
async function cancelCurrentReceipt(){
  if(typeof R==='undefined'||!R||!R.no) return toast('ยังไม่ได้บันทึกเอกสาร จึงไม่มีอะไรให้ยกเลิก');
  const cur=DB.receipts.find(x=>x.id===R.id);
  if(!cur) return toast('ยังไม่ได้บันทึกเอกสาร จึงไม่มีอะไรให้ยกเลิก');
  if(cur.cancelled) return toast('เอกสารนี้ถูกยกเลิกไปแล้ว');
  await cancelReceiptDoc(R.id);
  const after=DB.receipts.find(x=>x.id===R.id);
  if(after&&after.cancelled){                 /* ยกเลิกสำเร็จ — ดึงสถานะใหม่เข้าฟอร์มที่เปิดค้างอยู่ */
    R=JSON.parse(JSON.stringify(after)); fillReceiptForm(); syncReceiptCancelUI();
  }
}
/* ใบที่ยกเลิกแล้วต้องไม่มีปุ่มยกเลิกซ้ำ และต้องเห็นชัดว่าเป็นใบที่ยกเลิกไปแล้ว */
function syncReceiptCancelUI(){
  const b=$('#rCancelBtn'); if(!b) return;
  const saved=!!(R&&R.no), done=!!(R&&R.cancelled);
  b.style.display=(saved&&!done)?'':'none';
  const t=$('#rNo');
  if(t&&done&&t.textContent.indexOf('ยกเลิกแล้ว')<0) t.textContent+=' · ยกเลิกแล้ว';
}
async function cancelReceiptDoc(id){
  if(!can('doc.cancelDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกเอกสารการเงิน');
  if(!can('doc.delDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกเอกสาร');
  const r=DB.receipts.find(x=>x.id===id); if(!r) return;
  if(r.cancelled) return toast('เอกสารนี้ถูกยกเลิกไปแล้ว');
  const inBn=DB.billings.find(b=>!b.cancelled&&(b.receiptIds||[]).includes(r.id));
  if(inBn) return toast('เอกสารนี้อยู่ในใบวางบิล '+inBn.no+' — ยกเลิกใบวางบิลก่อน');
  const reason=await askPromptP({title:'ยกเลิกเอกสาร '+r.no,text:'ระบุเหตุผลที่ยกเลิก (ไม่บังคับ)',yes:'ยกเลิกเอกสาร',no:'ไม่ยกเลิก'});
  if(reason===null) return;
  const cur=(r.taxDocs||[]).length?r.taxDocs[r.taxDocs.length-1]:null;
  if(cur&&!cur.cancelled&&!await askP({title:'มีใบกำกับภาษีผูกอยู่',text:'เอกสารนี้มีใบกำกับภาษี '+cur.no+'\nยกเลิกแล้วใบกำกับภาษีจะถูกยกเลิกไปด้วย ยืนยันหรือไม่?',yes:'ยืนยันยกเลิก',no:'ไม่ยกเลิก'})) return;
  if(cur&&!cur.cancelled){
    cur.cancelled=true; cur.cancelReason='ยกเลิกตามเอกสาร '+r.no; cur.cancelDate=iso();
    syncTaxLegacy(r);
    logAudit('receipt',r,'taxcancel','ยกเลิกใบกำกับภาษี '+cur.no+' ตามการยกเลิกเอกสาร');
  }
  r.cancelled=true; r.cancelReason=String(reason||'').trim(); r.cancelDate=iso();
  r.paid=false; r.paidDate='';
  logAudit('receipt',r,'del','ยกเลิกเอกสาร'+(r.cancelReason?' — '+r.cancelReason:''));
  save(); renderHome(); renderDocOverview(); renderTaxOverview();
  if(R&&R.id===id){ R.cancelled=true; fillReceiptForm(); }
  toast('ยกเลิกเอกสาร '+r.no+' แล้ว'+(cur?' · ยกเลิกใบกำกับภาษี '+cur.no+' ด้วย':''));
}
async function cancelInvoiceDoc(id){
  if(!can('doc.cancelDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกใบแจ้งหนี้');
  if(!can('doc.delDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกเอกสาร');
  const inv=DB.invoices.find(x=>x.id===id); if(!inv) return;
  if(inv.cancelled) return toast('เอกสารนี้ถูกยกเลิกไปแล้ว');
  const reason=await askPromptP({title:'ยกเลิกใบแจ้งหนี้ '+inv.no,text:'ระบุเหตุผลที่ยกเลิก (ไม่บังคับ)',yes:'ยกเลิกเอกสาร',no:'ไม่ยกเลิก'});
  if(reason===null) return;
  if(inv.settled&&inv.srcType==='tax') inv.refIds.forEach(rid=>{
    const r=DB.receipts.find(x=>x.id===rid);
    if(r){ r.paid=false; r.paidDate=''; logAudit('receipt',r,'save','คืนสถานะค้างชำระจากการยกเลิกใบแจ้งหนี้ '+inv.no); }
  });
  inv.cancelled=true; inv.cancelReason=String(reason||'').trim(); inv.cancelDate=iso();
  inv.settled=false; inv.settledDate='';
  logAudit('invoice',inv,'del','ยกเลิกใบแจ้งหนี้'+(inv.cancelReason?' — '+inv.cancelReason:''));
  save(); renderHome(); renderDocOverview();
  toast('ยกเลิกใบแจ้งหนี้ '+inv.no+' แล้ว');
}
async function delInvoiceDoc(id){
  if(!can('doc.delDoc')) return toast('บัญชีนี้ไม่มีสิทธิลบเอกสาร');
  const inv=DB.invoices.find(x=>x.id===id); if(!inv) return;
  if(!await askP({title:'ลบใบแจ้งหนี้',text:'ลบใบแจ้งหนี้ '+inv.no+' ?'+(inv.settled&&inv.srcType==='tax'?'\nระบบจะคืนสถานะใบเสร็จที่อ้างอิงกลับเป็นค้างชำระให้ด้วย':''),yes:'ลบ',no:'ไม่ลบ'})) return;
  if(inv.settled&&inv.srcType==='tax') inv.refIds.forEach(rid=>{
    const r=DB.receipts.find(x=>x.id===rid);
    if(r){ r.paid=false; logAudit('receipt',r,'save','ยกเลิกการรับชำระจากใบแจ้งหนี้ '+inv.no); }
  });
  logAudit('invoice',inv,'del');
  DB.invoices=DB.invoices.filter(x=>x.id!==id);
  save(); renderHome(); renderInvoiceList(); refreshInvoiceOpenSelect();
  if(IV&&IV.id===id) newInvoiceDoc();
  toast('ลบใบแจ้งหนี้แล้ว');
}
async function settleInvoiceDoc(id){
  if(!can('doc.payRec')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');
  const inv=DB.invoices.find(x=>x.id===id); if(!inv) return;
  if(inv.settled) return toast('ใบนี้บันทึกรับชำระไปแล้ว');
  const items=inv.refIds.map(rid=>invoiceRefDocFor(inv,rid)).filter(Boolean);
  const total=items.reduce((a,d)=>a+invoiceRefAmtFor(inv,d),0);
  if(!await askP({title:'รับชำระใบแจ้งหนี้',text:'บันทึกรับชำระใบแจ้งหนี้ '+inv.no+' ยอดรวม '+money(total)+' บาท ('+items.length+' รายการ) ?',yes:'บันทึกรับชำระ',no:'ยังไม่บันทึก'})) return;
  if(inv.srcType==='tax') items.forEach(r=>{
    const rem=Math.max(0,receiptTotals(r).net-paidAmtOf(r));
    r.payments=r.payments||[];
    if(rem>0) r.payments.push({id:uid(),date:iso(),amt:rem,method:'',bank:'',ref:'',card4:'',chkDate:'',
      by:meName(),note:'รับชำระผ่านใบแจ้งหนี้ '+inv.no});
    r.paid=true; r.paidDate=iso(); logAudit('receipt',r,'pay','รับชำระผ่านใบแจ้งหนี้ '+inv.no); });
  inv.settled=true; inv.settledDate=iso();
  logAudit('invoice',inv,'pay','รับชำระรวม '+money(total)+' บาท');
  save(); renderHome(); renderInvoiceList();
  if(IV&&IV.id===id){ IV.settled=true; IV.settledDate=inv.settledDate; fillInvoiceForm(); }
  toast('บันทึกรับชำระใบแจ้งหนี้ '+inv.no+' แล้ว');
}
function refreshInvoiceOpenSelect(){
  const el=$('#ivOpen'); if(!el) return;
  el.innerHTML='<option value="">— เปิดใบแจ้งหนี้ที่บันทึกไว้ —</option>'
    +DB.invoices.slice().sort((a,b)=>b.date.localeCompare(a.date))
      .map(inv=>`<option value="${inv.id}">${esc(inv.no)} · ${esc(custName(findCust(inv.custId))||'-')}</option>`).join('');
}
$('#ivOpen').onchange=()=>{ const id=$('#ivOpen').value; if(id) openInvoiceById(id); };

function fillReceiptForm(){
  $('#rNo').textContent=R.no?('เลขที่ '+R.no+(R.taxNo?' · ใบกำกับภาษี '+R.taxNo:'')):'เอกสารใหม่ (ยังไม่บันทึก)';
  $('#rDate').value=R.date;$('#rVat').value=R.vat;$('#rWht').value=R.wht;$('#rWhtBase').value=R.whtBase;
  $('#rDisc').value=R.disc;$('#rBy').value=R.by;$('#rNote').value=R.note;$('#rRef').value=R.ref;
  $('#rTaxNo').value=R.taxNo||'';$('#rIssueTax').checked=!!R.issueTax;$('#rWarr').value=R.warr||'';
  $('#pCash').checked=R.pay.cash;$('#pTrans').checked=R.pay.trans;$('#pCredit').checked=R.pay.credit;
  $('#pDays').value=R.pay.days;$('#pBank').value=R.pay.bank||'';$('#pWhen').value=R.pay.when||'';$('#pPaid').checked=!!R.paid;
  $('#pCard').checked=!!R.pay.card;$('#pCardBank').value=R.pay.cardBank||'';$('#pCard4').value=R.pay.card4||'';
  $('#pCardPct').value=n(R.pay.cardPct)||0;$('#pCardRef').value=R.pay.cardRef||'';
  $('#pChk').checked=!!R.pay.chk;$('#pChkBank').value=R.pay.chkBank||'';
  $('#pChkNo').value=R.pay.chkNo||'';$('#pChkDate').value=R.pay.chkDate||'';
  $('#pCashAmt').value=n(R.pay.cashAmt)||''; $('#pTransAmt').value=n(R.pay.transAmt)||''; $('#pCardAmt').value=n(R.pay.cardAmt)||''; $('#pChkAmt').value=n(R.pay.chkAmt)||'';
  empSel('rTech1',R.tech1,'— ไม่ระบุช่างผู้ซ่อม —'); empSel('rTech2',R.tech2,'— ไม่มีช่างผู้ช่วย —');
  const _q=findQuote(R.quoteId); $('#rTechQ').value=_q?empName(_q.tech,_q.techName):'';
  refreshReceiptRefs(); $('#rSrc').value=R.quoteId; if(typeof rSrcPicker!=='undefined'&&rSrcPicker) rSrcPicker.sync(); calcReceipt(); renderApvBars();
  if(typeof syncReceiptCancelUI==='function') syncReceiptCancelUI();
  rFormSig=receiptSig();
}
/* กันปิดฟอร์มทิ้งโดยยังไม่ได้บันทึก — สาเหตุที่เอกสารไม่ขึ้นในทะเบียน */
let rFormSig='';
function receiptSig(){
  if(!R) return '';
  return JSON.stringify({no:R.no,cust:R.custId,quote:R.quoteId,items:rItemsClean(R),
    disc:R.disc,vat:R.vat,wht:R.wht,paid:R.paid,note:R.note,issueTax:R.issueTax});
}
async function closeReceiptForm(){
  if(R&&receiptSig()!==rFormSig){
    const msg=R.no
      ? 'ใบเสร็จ '+R.no+' มีการแก้ไขที่ยังไม่ได้บันทึก'
      : 'เอกสารนี้ยังไม่ได้บันทึก จึงจะยังไม่ขึ้นในทะเบียน';
    if(!await askP({title:'ยังไม่ได้บันทึก',text:msg,yes:'ปิดโดยไม่บันทึก',no:'กลับไปบันทึกก่อน'})) return;
  }
  closeModal('mReceiptEdit'); renderDocOverview(); renderTaxOverview();
}
function refreshReceiptRefs(){
  const billed=billedQuoteIds();
  const cur=$('#rSrc').value;
  $('#rSrc').innerHTML='<option value="">— เลือกใบเสนอราคา —</option>'+DB.quotes.filter(q=>!q.cancelled).slice().reverse().map(q=>{
    const c=findCust(q.custId), done=billed.has(q.id)&&q.id!==(R?R.quoteId:'');
    return `<option value="${q.id}">${esc(q.no)} · ${thDate(q.date)} · ${esc(custName(c)||'-')} · ${money(quoteTotals(q).total)}${done?' (ออกใบเสร็จแล้ว)':''}</option>`}).join('');
  $('#rSrc').value=cur||(R?R.quoteId:'');
  if(typeof rSrcPicker!=='undefined'&&rSrcPicker) rSrcPicker.sync();
  const co=$('#rOpen').value;
  $('#rOpen').innerHTML='<option value="">— เปิดใบเสร็จที่บันทึกไว้ —</option>'+DB.receipts.slice().reverse().map(r=>{
    const c=findCust(r.custId);
    return `<option value="${r.id}">${esc(r.no)} · ${thDate(r.date)} · ${esc(custName(c)||'-')}</option>`}).join('');
  $('#rOpen').value=co;
}
function loadFromQuote(q){
  R.quoteId=q.id; R.ref=q.no; R.custId=q.custId; R.vehIdx=q.vehIdx;
  R.items=JSON.parse(JSON.stringify(qItemsClean(q))).map(it=>Object.assign({warr:''},it));
  R.disc=n(q.disc); R.vat=n(q.vat); if(q.noVatReason&&!R.vat) R.noVatReason=q.noVatReason;
  /* มีค่าแรง/ค่าบริการในใบเสนอราคา → ตั้งหักภาษี ณ ที่จ่าย 3% เฉพาะฐานค่าแรงให้อัตโนมัติ
     (calcReceipt อ่านค่าจาก DOM จึงต้องเซ็ตช่องก่อนเรียก) */
  const hasLabor=R.items.some(it=>it.type==='labor'&&n(it.qty)*n(it.price)>0);
  if(hasLabor){ R.wht=3; R.whtBase='labor'; $('#rWht').value='3'; $('#rWhtBase').value='labor'; }
  $('#rRef').value=q.no; $('#rDisc').value=R.disc; $('#rVat').value=R.vat;
  calcReceipt();
  if(hasLabor) toast('ใบนี้มีค่าแรง — ตั้งหักภาษี ณ ที่จ่าย 3% (เฉพาะค่าแรง) ให้อัตโนมัติ แก้ไขได้ที่ช่องด้านบน');
}
/* ใบเสนอราคายังไม่พร้อม → เด้งถามและจัดการให้เสร็จตรงหน้าใบเสร็จ ไม่ต้องออกไปหน้าอื่น */
async function readyQuoteInline(q){
  if(q.cancelled){ toast('ใบเสนอราคา '+q.no+' ถูกยกเลิกแล้ว ออกใบเสร็จไม่ได้ — คัดลอกเป็นใบใหม่ก่อน'); return false; }
  if(!q.no){ toast('ใบเสนอราคานี้ยังไม่ได้บันทึก จึงยังออกใบเสร็จ / ใบแจ้งหนี้ไม่ได้'); return false; }
  const needApv=!isApproved(q), needDeduct=!q.deducted;
  if(!needApv&&!needDeduct) return true;
  if(needApv&&!can('apv.quote')) { toast('ใบเสนอราคา '+q.no+' ยังไม่ผ่านการอนุมัติ และบัญชีนี้ไม่มีสิทธิอนุมัติ — ให้ผู้มีสิทธิอนุมัติก่อน'); return false; }
  if(needDeduct&&!can('doc.qApprove')) { toast('ใบเสนอราคา '+q.no+' ยังไม่ได้ตัดสต๊อก และบัญชีนี้ไม่มีสิทธิตัดสต๊อก — ให้ผู้มีสิทธิดำเนินการก่อน'); return false; }
  const todo=[needApv?'อนุมัติเอกสาร':'',needDeduct?'ตัดสต๊อก':''].filter(Boolean);
  const msg='ใบเสนอราคา '+q.no+' ยังไม่พร้อมออกใบเสร็จ / ใบแจ้งหนี้\n\n'
    +(needApv?'· ยังไม่ได้อนุมัติเอกสาร\n':'')
    +(needDeduct?'· ยังไม่ได้ตัดสต๊อก\n':'')
    +'\nกด “ตกลง” เพื่อ'+todo.join('และ')+'ให้เลยตอนนี้ แล้วออกใบเสร็จต่อได้ทันที'
    +'\nกด “ยกเลิก” เพื่อไม่ดึงใบนี้';
  if(!await askP({title:'ใบเสนอราคายังไม่พร้อมออกใบเสร็จ',text:msg,yes:'ทำให้เลยตอนนี้',no:'ไม่ดึงใบนี้'})) return false;
  if(needApv){
    q.apv={status:'approved',by:DB.curEmp||'',byName:meName(),date:iso(),note:''};
    if(Q&&Q.id===q.id&&Q!==q) Q.apv=JSON.parse(JSON.stringify(q.apv));
    logAudit('quote',q,'approve','อนุมัติจากหน้าใบเสร็จ โดย '+meName());
    save();
  }
  if(needDeduct&&!await deductQuoteStock(q)) return false;
  toast(todo.join('และ')+'ใบ '+q.no+' เรียบร้อย — ดึงข้อมูลมาออกใบเสร็จได้เลย');
  return true;
}
$('#rSrc').onchange=async()=>{const rsync=()=>{ if(rSrcPicker) rSrcPicker.sync(); };
  const q=findQuote($('#rSrc').value); if(!q){ rsync(); return; }
  if(!await readyQuoteInline(q)){ $('#rSrc').value=R.quoteId||''; rsync(); return; }
  /* กันออกใบเสร็จซ้ำจากใบเสนอราคาเดียวกัน — ต้องยกเลิกใบเดิมก่อนถึงจะออกใหม่ได้ */
  const dup=activeReceiptOfQuote(q.id,R.id);
  if(dup){ $('#rSrc').value=R.quoteId||''; rsync(); await warnDupReceipt(dup,q.no); return; }
  loadFromQuote(q); $('#rSrc').value=q.id; rsync(); toast('ดึงข้อมูลจาก '+q.no+' แล้ว')};
async function billFromQuote(id){ const q=findQuote(id); if(!q) return;
  /* ด่านแรก — กันตั้งแต่ยังไม่เปิดฟอร์ม จะได้ไม่เสียเวลากรอกแล้วมาติดตอนบันทึก */
  const dup=activeReceiptOfQuote(q.id);
  if(dup) return warnDupReceipt(dup,q.no);
  if(!await readyQuoteInline(q)) return;
  logAudit('quote',q,'bill','เปิดใบเสร็จจากเอกสารนี้'); newReceipt(); loadFromQuote(q); $('#rSrc').value=q.id; if(typeof rSrcPicker!=='undefined'&&rSrcPicker) rSrcPicker.sync(); go('receipt'); }
['rDate','rDisc','rBy','rNote','pBank','pWhen','rWarr'].forEach(id=>$('#'+id).oninput=calcReceipt);
['rWht','rWhtBase'].forEach(id=>$('#'+id).onchange=calcReceipt);
$('#rVat').onchange=()=>vatPick($('#rVat'),R,()=>calcReceipt());
['pCash','pTrans'].forEach(id=>$('#'+id).onchange=autoPaidSync);
$('#pCredit').onchange=autoPaidSync;
/* ══ สถานะ "รับชำระครบแล้ว" คำนวณจากยอดเงินที่กรอกจริง ไม่ให้กดเอง ══
   เดิมช่องนี้กดเองได้ และมีแต่ "เงินเชื่อ" เท่านั้นที่สั่งมันได้ — ติ๊กเงินสดแล้วช่องนี้ไม่ขยับเลย
   เอกสารจึงขึ้นเป็นค้างชำระทั้งที่เก็บเงินสดมาแล้ว ทำให้ยอดลูกหนี้ผิด */
function autoPaidSync(){
  calcReceipt();                       /* อ่านฟอร์มเข้า R และเติมยอดตามวิธีชำระให้ครบก่อน */
  const box=$('#pPaid'); if(!box||typeof R==='undefined'||!R) return;
  if((R.payments||[]).length) return;  /* ใบที่รับชำระเป็นงวดแล้ว ให้ระบบงวดเป็นเจ้าของสถานะ ฟอร์มห้ามทับ */
  const net=receiptTotals(R).net;
  const got=n(R.pay.cashAmt)+n(R.pay.transAmt)+n(R.pay.cardAmt)+n(R.pay.chkAmt);
  const want=net>0&&got>=net-0.005;    /* เผื่อเศษสตางค์จากการปัดเลข */
  if(box.checked!==want){ box.checked=want; calcReceipt(); }
}
$('#pDays').oninput=calcReceipt;
function blankRLine(type){ return {type:type||'part',code:'',oem:'',name:type==='labor'?'ค่าแรง':'',qty:1,price:0,stockId:'',warr:''}; }
function rItemsClean(r){ return JSON.parse(JSON.stringify((r.items||[]).filter(qFilled))); }
function padRLines(){ R.items=R.items||[]; while(R.items.length<QMIN_LINES) R.items.push(blankRLine('part')); }
function addRLine(type){ if(R.deducted) return toast('ใบนี้ตัดสต๊อกไปแล้ว แก้ไขรายการไม่ได้');
  R.items.push(blankRLine(type)); calcReceipt(); }
function delRLine(i){ if(R.deducted) return toast('ใบนี้ตัดสต๊อกไปแล้ว แก้ไขรายการไม่ได้');
  R.items.splice(i,1); if(R.items.length<QMIN_LINES) R.items.push(blankRLine('part')); calcReceipt(); }
function rTier(){ const c=findCust(R.custId); return (c&&c.tier)||'B'; }
function calcReceipt(){
  R.date=$('#rDate').value||iso(); R.disc=n($('#rDisc').value); R.vat=n($('#rVat').value);
  R.wht=n($('#rWht').value); R.whtBase=$('#rWhtBase').value; R.by=$('#rBy').value; R.note=$('#rNote').value;
  R.warr=$('#rWarr').value; R.issueTax=$('#rIssueTax').checked;
  R.pay.cash=$('#pCash').checked; R.pay.trans=$('#pTrans').checked; R.pay.credit=$('#pCredit').checked;
  R.pay.days=n($('#pDays').value); R.pay.bank=$('#pBank').value; R.pay.when=$('#pWhen').value;
  R.pay.card=$('#pCard').checked; R.pay.cardBank=$('#pCardBank').value.trim(); R.pay.card4=$('#pCard4').value.trim();
  R.pay.cardPct=n($('#pCardPct').value); R.pay.cardRef=$('#pCardRef').value.trim();
  R.pay.chk=$('#pChk').checked; R.pay.chkBank=$('#pChkBank').value.trim();
  R.pay.chkNo=$('#pChkNo').value.trim(); R.pay.chkDate=$('#pChkDate').value;
  R.tech1=$('#rTech1').value; R.tech1Name=empName(R.tech1,R.tech1Name);
  R.tech2=$('#rTech2').value; R.tech2Name=empName(R.tech2,R.tech2Name);
  R.pay.due=R.pay.credit?addDays(R.date,R.pay.days):R.date;
  syncPaySplit();
  updateCardBox();
  /* สถานะรับชำระต้องมาจากช่องติ๊กเท่านั้น ห้ามบังคับเป็น "ชำระแล้ว" เอง
     เพราะเอกสารที่ยังไม่เก็บเงินคือใบแจ้งหนี้ ต้องขึ้นเป็นค้างชำระ */
  R.paid=$('#pPaid').checked;
  if(R.paid&&!R.paidDate) R.paidDate=iso();
  if(!R.paid) R.paidDate='';
  $('#pDue').value=R.pay.credit?thDate(R.pay.due):'— ชำระทันที —';
  $('#rTaxHint').textContent=!isVatReg()
    ? 'กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงออกได้เฉพาะใบเสร็จรับเงิน 2 ชุด (ต้นฉบับ + สำเนา)'
    : (R.issueTax
      ? (R.taxNo?'ออกใบกำกับภาษีเลขที่ '+R.taxNo+' — กดปุ่ม “พิมพ์ใบกำกับภาษี” เพื่อพิมพ์ต้นฉบับ + สำเนา'
               :'ติ๊กออกใบกำกับภาษีแล้ว — กดบันทึกเพื่อออกเลขที่ จึงจะพิมพ์ใบกำกับภาษีได้')
      : 'ไม่ออกใบกำกับภาษี → พิมพ์เฉพาะใบเสร็จรับเงิน / ใบแจ้งหนี้ 2 ชุด (ต้นฉบับ + สำเนา)');
  $('#rSheetInfo').textContent=(R.issueTax?4:2)+' แผ่น';
  syncTaxPrintBtn();
  syncSaveBtn();
  padRLines();
  const lock=!!R.deducted||!!R.quoteId;
  $('#rItems tbody').innerHTML=R.items.map((it,i)=>`<tr>
    <td class="ctr hint">${i+1}</td>
    <td>${lock?esc(it.code||(it.type==='labor'?'ค่าแรง':'')):(it.type==='labor'?'<span class="chip">ค่าแรง</span>':`<input type="text" list="stockList" class="mono rcode" data-i="${i}" value="${esc(it.code)}" placeholder="พิมพ์รหัส">`)}</td>
    <td>${lock?esc(it.name||''):`<input type="text" class="rname" data-i="${i}" value="${esc(it.name)}">`}</td>
    <td class="num">${lock?qf(it.qty):`<input type="number" class="rqty" data-i="${i}" value="${it.qty}" style="text-align:right">`}</td>
    <td class="num">${lock?money(it.price):`<input type="number" class="rprice" data-i="${i}" value="${it.price}" step="0.01" style="text-align:right">`}</td>
    <td class="num">${money(n(it.qty)*n(it.price))}</td>
    <td class="ctr">${R.deducted?(it.warr||'-'):`<input type="number" class="rwarr" data-i="${i}" value="${it.warr||''}" placeholder="เดือน" style="text-align:center">`}</td>
    <td class="ctr">${lock?'':`<button class="btn sm dgr" onclick="delRLine(${i})">×</button>`}</td></tr>`).join('');
  if(!lock){
    $$('.rcode').forEach(el=>el.onchange=e=>{const i=+e.target.dataset.i, code=e.target.value.trim();
      const st=DB.stock.find(x=>x.code.toLowerCase()===code.toLowerCase());
      if(st) R.items[i]=Object.assign(R.items[i],{type:'part',code:st.code,oem:st.oem,name:st.name,
        price:n(R.items[i].price)||priceByTier(st,rTier()),stockId:st.id,warr:R.items[i].warr||st.warr||''});
      else{R.items[i].code=code;R.items[i].stockId='';}
      calcReceipt();});
    $$('.rname').forEach(el=>el.oninput=e=>{R.items[+e.target.dataset.i].name=e.target.value;renderRPrev()});
    $$('.rqty').forEach(el=>el.oninput=e=>{R.items[+e.target.dataset.i].qty=n(e.target.value);updateRAmounts()});
    $$('.rprice').forEach(el=>el.oninput=e=>{R.items[+e.target.dataset.i].price=n(e.target.value);updateRAmounts()});
    $$('.rwarr').forEach(el=>el.oninput=e=>{R.items[+e.target.dataset.i].warr=e.target.value;renderRPrev()});
  }
  const li=$('#rLineInfo'); if(li) li.textContent=(lock?'ใบนี้ตัดสต๊อกแล้ว — ล็อกรายการไม่ให้แก้ไข · ':'')+'กรอกแล้ว '+rItemsClean(R).length+' รายการ จากทั้งหมด '+R.items.length+' บรรทัด';
  $$('#v-receipt button[onclick^="addRLine"]').forEach(b=>b.disabled=lock);
  const t=receiptTotals(R);
  $('#rSub').textContent=money(t.sub);$('#rDiscOut').textContent=money(t.disc);$('#rBase').textContent=money(t.base);
  $('#rVatOut').textContent=money(t.vat);$('#rGross').textContent=money(t.gross);
  $('#rWhtOut').textContent=money(t.whtAmt);$('#rNet').textContent=money(t.net);
  if($('#cardFeeTxt')) $('#cardFeeTxt').textContent=money(t.fee);
  if($('#cardPayTxt')) $('#cardPayTxt').textContent=money(t.cardChargeAmt);
  renderRPrev();
}
['rTech1','rTech2'].forEach(id=>{ const el=$('#'+id); if(el) el.onchange=()=>calcReceipt(); });
function syncPaySplit(){
  const netNow=receiptTotals(R).net;
  const onCash=R.pay.cash, onTrans=R.pay.trans, onCard=R.pay.card, onChk=R.pay.chk,
        methodsOn=[onCash,onTrans,onCard,onChk].filter(Boolean).length;
  const splitBox=$('#pSplitBox'); if(!splitBox) return;
  if(methodsOn>=2){
    splitBox.style.display='';
    $('#pCashAmtWrap').style.display=onCash?'':'none';
    $('#pTransAmtWrap').style.display=onTrans?'':'none';
    $('#pCardAmtWrap').style.display=onCard?'':'none';
    $('#pChkAmtWrap').style.display=onChk?'':'none';
    R.pay.cashAmt=onCash?n($('#pCashAmt').value):0;
    R.pay.transAmt=onTrans?n($('#pTransAmt').value):0;
    R.pay.cardAmt=onCard?n($('#pCardAmt').value):0;
    R.pay.chkAmt=onChk?n($('#pChkAmt').value):0;
    const allocated=n(R.pay.cashAmt)+n(R.pay.transAmt)+n(R.pay.cardAmt)+n(R.pay.chkAmt);
    const diff=Math.round((netNow-allocated)*100)/100;
    const info=$('#pSplitInfo');
    info.innerHTML=Math.abs(diff)<0.01?('จัดสรรครบ '+money(allocated)+' บาท ✓')
      :('<span style="color:var(--danger)">จัดสรรแล้ว '+money(allocated)+' จาก '+money(netNow)+' บาท · '+(diff>0?'ขาดอีก '+money(diff):'เกินไป '+money(-diff))+' บาท</span>');
  } else {
    splitBox.style.display='none';
    R.pay.cashAmt=onCash?netNow:0; R.pay.transAmt=onTrans?netNow:0; R.pay.cardAmt=onCard?netNow:0; R.pay.chkAmt=onChk?netNow:0;
    $('#pCashAmt').value=R.pay.cashAmt||''; $('#pTransAmt').value=R.pay.transAmt||''; $('#pCardAmt').value=R.pay.cardAmt||''; $('#pChkAmt').value=R.pay.chkAmt||'';
  }
}
function updateCardBox(){
  const on=$('#pCard')&&$('#pCard').checked;
  const box=$('#cardBox'); if(box) box.style.display=on?'':'none';
  const chkOn=$('#pChk')&&$('#pChk').checked;
  const cbox=$('#chkBox'); if(cbox) cbox.style.display=chkOn?'':'none';
  const t=receiptTotals(R);
  if($('#cardFeeTxt')) $('#cardFeeTxt').textContent=money(t.fee);
  if($('#cardPayTxt')) $('#cardPayTxt').textContent=money(t.cardChargeAmt);
}
function updateRAmounts(){
  const rows=$$('#rItems tbody tr');
  R.items.forEach((it,i)=>{if(rows[i])rows[i].children[5].textContent=money(n(it.qty)*n(it.price))});
  const t=receiptTotals(R);
  $('#rSub').textContent=money(t.sub);$('#rDiscOut').textContent=money(t.disc);$('#rBase').textContent=money(t.base);
  $('#rVatOut').textContent=money(t.vat);$('#rGross').textContent=money(t.gross);
  $('#rWhtOut').textContent=money(t.whtAmt);$('#rNet').textContent=money(t.net);
  syncPaySplit(); updateCardBox();
  const li=$('#rLineInfo'); if(li) li.textContent='กรอกแล้ว '+rItemsClean(R).length+' รายการ จากทั้งหมด '+R.items.length+' บรรทัด';
  renderRPrev();
}
function techLine(r){
  const t1=empName(r.tech1,r.tech1Name), t2=empName(r.tech2,r.tech2Name);
  if(!t1&&!t2) return '';
  return '<br><span class="lbl">ช่างผู้ซ่อม</span> <b>'+esc(t1||'-')+'</b>'+(t2?' · ช่างผู้ช่วย '+esc(t2):'');
}
function sheetReceipt(r,kind,copy){
  const c=findCust(r.custId), v=c&&(c.vehicles||[])[r.vehIdx], t=receiptTotals(r), its=rItemsClean(r);
  const tk=b=>`<span class="tick">${b?'✓':''}</span>`;
  const anyWarr=its.some(it=>n(it.warr)>0);
  const title=kind==='RT'?'ใบกำกับภาษี':'ใบส่งมอบงาน / ใบเสร็จรับเงิน / ใบแจ้งหนี้';
  const no=kind==='RT'?(r.taxNo||'(ยังไม่บันทึก)'):(r.no||'(ยังไม่บันทึก)');
  return sheetTop({title:title,tsmall:kind!=='RT',en:kind==='RT'?'TAX INVOICE':'OFFICIAL RECEIPT / INVOICE',copy:copy,
    stamp:r.cancelled?'ยกเลิกแล้ว':(isApproved(r)?'':'ยังไม่อนุมัติ'),
    fields:[['เลขที่',esc(no)],['วันที่',thDate(r.date)],['อ้างอิงใบเสนอราคา',esc(r.ref||'-')],
      kind==='RT'?['คู่กับใบเสร็จเลขที่',esc(r.no||'')]:['ใบกำกับภาษีเลขที่',esc(r.taxNo||'')],
      ['ทะเบียนรถ',esc(plateOf(v))]]})+`
  <table><tr>
    <td style="width:58%;vertical-align:top"><span class="lbl">${kind==='RT'?'ชื่อผู้ซื้อ / ผู้รับบริการ':'ได้รับเงินจาก'}</span><br>
      <b>${esc(custName(c)||'-')}</b>${c&&c.type==='company'&&c.name?'<br>ผู้ติดต่อ: '+esc(c.name):''}<br>
      ${esc(addrLine(c&&c.addr))}<br>เลขประจำตัวผู้เสียภาษี ${esc((c&&c.tax)||'-')}${c&&c.branch?' ('+esc(c.branch)+')':''}<br>
      โทร. ${esc((c&&c.tel)||'-')}</td>
    <td style="vertical-align:top"><span class="lbl">รถที่รับบริการ</span><br>
      ${esc((v&&v.brand)||'-')} ${esc((v&&v.model)||'')}<br>ทะเบียน <b>${esc(plateOf(v))}</b><br>สี ${esc((v&&v.color)||'-')}${vehIdLine(v)}
      ${techLine(r)}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:30px">ลำดับ</th><th style="width:100px">รหัส</th>
    <th>รายการ</th><th style="width:48px">จำนวน</th><th style="width:78px">หน่วยละ</th>
    <th style="width:88px">จำนวนเงิน</th>${anyWarr?'<th style="width:62px">รับประกัน</th>':''}</tr></thead><tbody>
    ${its.length?its.map((it,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(it.code||'-')}</td>
      <td>${esc(it.name)}${pkgKitPrint(it,r)}</td><td style="text-align:center">${qf(it.qty)}</td><td class="num">${money(it.price)}</td>
      <td class="num">${money(n(it.qty)*n(it.price))}</td>${anyWarr?`<td style="text-align:center">${n(it.warr)?n(it.warr)+' เดือน':'-'}</td>`:''}</tr>`).join('')
      :`<tr><td colspan="${anyWarr?7:6}" style="text-align:center;color:#777">— ไม่มีรายการ —</td></tr>`}
    <tr><td colspan="${anyWarr?6:5}" style="text-align:right">รวมเป็นเงิน</td><td class="num">${money(t.sub)}</td></tr>
    <tr><td colspan="${anyWarr?6:5}" style="text-align:right">หักส่วนลด</td><td class="num">${money(t.disc)}</td></tr>
    <tr><td colspan="${anyWarr?6:5}" style="text-align:right">มูลค่าก่อนภาษี</td><td class="num">${money(t.base)}</td></tr>
    <tr><td colspan="${anyWarr?6:5}" style="text-align:right">ภาษีมูลค่าเพิ่ม ${n(r.vat)}%</td><td class="num">${money(t.vat)}</td></tr>
    <tr><td colspan="${anyWarr?6:5}" style="text-align:right">รวมทั้งสิ้น</td><td class="num">${money(t.gross)}</td></tr>
    ${kind==='RE'?`<tr><td colspan="${anyWarr?6:5}" style="text-align:right">หัก ภาษี ณ ที่จ่าย ${n(r.wht)}% (${r.whtBase==='labor'?'ค่าบริการ':'ทั้งใบ'} ${money(t.whtBaseAmt)})</td><td class="num">${money(t.whtAmt)}</td></tr>
    <tr><td colspan="${anyWarr?6:5}" style="text-align:right"><b>จำนวนเงินที่รับชำระสุทธิ</b></td><td class="num"><b>${money(t.net)}</b></td></tr>
    <tr><td colspan="${anyWarr?7:6}" style="text-align:center">(${bahtText(t.net)})</td></tr>`
    :`<tr><td colspan="${anyWarr?7:6}" style="text-align:center">(${bahtText(t.gross)})</td></tr>`}
    </tbody></table>
  ${kind==='RE'?`<div class="box"><span class="lbl">ชำระโดย</span><br>
    ${tk(r.pay.cash)}เงินสด &nbsp; ${tk(r.pay.trans)}เงินโอน ${r.pay.bank?'· '+esc(r.pay.bank):''} ${r.pay.when?'· '+esc(r.pay.when):''}
    &nbsp; ${tk(r.pay.credit)}เงินเชื่อ ${r.pay.credit?n(r.pay.days)+' วัน · ครบกำหนดชำระ '+thDate(r.pay.due):'........ วัน'}
    <br>${tk(r.pay.card)}บัตรเครดิต ${r.pay.card?esc(r.pay.cardBank||'')+(r.pay.card4?' เลขท้าย '+esc(r.pay.card4):'')
      +(r.pay.cardRef?' · เลขอนุมัติ '+esc(r.pay.cardRef):'')
      +(n(r.pay.cardPct)?' · ค่าธรรมเนียม '+n(r.pay.cardPct)+'% เป็นเงิน '+money(t.fee)+' บาท':''):'........................'}
    ${r.pay.card&&n(r.pay.cardPct)?'<br><b>ยอดที่รูดบัตรรวมค่าธรรมเนียม '+money(t.cardChargeAmt)+' บาท ('+bahtText(t.cardChargeAmt)+')</b>':''}
    <br>${tk(r.pay.chk)}เช็ค ${r.pay.chk?esc(r.pay.chkBank||'')+(r.pay.chkNo?' · เลขที่เช็ค '+esc(r.pay.chkNo):'')
      +(r.pay.chkDate?' · ลงวันที่ '+thDate(r.pay.chkDate):''):'........................'}
    ${[r.pay.cash,r.pay.trans,r.pay.card,r.pay.chk].filter(Boolean).length>=2?'<br><span class="lbl">แบ่งชำระ</span> '+
      [r.pay.cash?'เงินสด '+money(n(r.pay.cashAmt))+' บาท':'',r.pay.trans?'เงินโอน '+money(n(r.pay.transAmt))+' บาท':'',
       r.pay.card?'บัตรเครดิต '+money(n(r.pay.cardAmt))+' บาท':'',
       r.pay.chk?'เช็ค '+money(n(r.pay.chkAmt))+' บาท':''].filter(Boolean).join(' + '):''}
    ${r.note?'<br><span class="lbl">หมายเหตุ: '+esc(r.note)+'</span>':''}</div>
  <div class="box"><span class="lbl">เงื่อนไขการรับประกัน</span><br>
    ${anyWarr?'รับประกันตามระยะเวลาที่ระบุรายชิ้นในตารางข้างต้น นับจากวันที่ในใบเสร็จรับเงิน<br>':''}
    ${esc(r.warr||'-')}</div>`:''}
  <div class="sign">
    <div><div class="line"></div>( ${esc(r.by||'.................................................')} )<br>
      <span class="lbl">${kind==='RT'?'ผู้ออกใบกำกับภาษี':'ผู้รับเงิน'}</span></div>
    <div><div class="line"></div>( ................................................. )<br>
      <span class="lbl">${kind==='RT'?'ผู้ซื้อ / ผู้รับบริการ':'ผู้จ่ายเงิน'}</span></div>
  </div>
  <div class="note">${kind==='RT'
    ? 'เอกสารออกเป็นชุด ต้นฉบับ (ผู้ซื้อ) และสำเนา (ผู้ขาย) · ใบกำกับภาษีนี้ออกคู่กับใบเสร็จรับเงินเลขที่ '+esc(r.no||'-')
    : 'เอกสารออกเป็นชุด ต้นฉบับ (ลูกค้า) และสำเนา (อู่) · ผู้รับบริการที่หักภาษี ณ ที่จ่าย กรุณาส่งมอบหนังสือรับรองการหักภาษี ณ ที่จ่ายให้ผู้รับเงิน'}</div>
  ${apvFoot(r)}</div>`;
}
function receiptSheets(r){
  let h=sheetReceipt(r,'RE','ต้นฉบับ')+sheetReceipt(r,'RE','สำเนา');
  if(r.issueTax) h+=sheetReceipt(r,'RT','ต้นฉบับ')+sheetReceipt(r,'RT','สำเนา');
  return h;
}
function renderRPrev(){ $('#rPrev').innerHTML=receiptSheets(R); fitSheets($('#rPrev')); }
async function saveReceipt(){
  if(!can('doc.rIssue')) return toast('บัญชีนี้ไม่มีสิทธิออกใบเสร็จ / ใบกำกับภาษี');
  if(!rItemsClean(R).length) return toast('กรอกรายการอย่างน้อย 1 บรรทัด หรือเลือกใบเสนอราคาก่อนบันทึก');
  /* ⚠️ ด่านจริงของกติกา "1 ใบเสนอราคา = 1 ใบเสร็จ" — ต้องกันตรงนี้เสมอ
     เพราะฟอร์มอาจถูกเปิดค้างไว้ก่อนที่อีกคนจะออกใบเสร็จของใบเดียวกันไปแล้ว */
  const dupSave=activeReceiptOfQuote(R.quoteId,R.id);
  if(dupSave){ await warnDupReceipt(dupSave,R.ref||''); return; }
  /* ด่านกติกา VAT — ใบใหม่ของกิจการที่ไม่ได้จดทะเบียนต้องไม่มี VAT ติดไปกับเอกสาร
     ⚠️ calcReceipt() อ่านค่ากลับจาก #rVat / #rIssueTax ทุกครั้ง จึงต้องแก้ที่ช่องในฟอร์มด้วย
        ไม่ใช่แก้แค่ในออบเจ็กต์ ไม่งั้นค่าจะถูกเขียนทับกลับมาทันที */
  if(!R.no&&vatGuard(R,'ใบเสร็จ')) $('#rVat').value='0';
  if(!isVatReg()&&$('#rIssueTax').checked){ $('#rIssueTax').checked=false; R.issueTax=false;
    toast('กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม — ระบบยกเลิกการออกใบกำกับภาษีของใบนี้ให้แล้ว'); }
  calcReceipt();
  /* ต้องระบุวิธีชำระเงินทุกครั้ง ไม่งั้นเอกสารจะไม่รู้ว่าเป็นเงินสดหรือขายเชื่อ */
  if(![R.pay.cash,R.pay.trans,R.pay.card,R.pay.chk,R.pay.credit].some(Boolean)){
    const box=$('#pCash'); if(box&&box.focus) box.focus();
    return toast('เลือกวิธีการชำระเงินก่อนบันทึก — เงินสด / เงินโอน / บัตรเครดิต / เช็ค / เงินเชื่อ');
  }
  if([R.pay.cash,R.pay.trans,R.pay.card,R.pay.chk].filter(Boolean).length>=2){
    const netNow=receiptTotals(R).net;
    const allocated=n(R.pay.cashAmt)+n(R.pay.transAmt)+n(R.pay.cardAmt)+n(R.pay.chkAmt);
    if(Math.abs(netNow-allocated)>=0.01) return toast('ยอดที่แบ่งชำระ (เงินสด+โอน+บัตร+เช็ค) รวม '+money(allocated)+' บาท ไม่เท่ากับยอดสุทธิ '+money(netNow)+' บาท กรุณาแก้ไขให้ครบก่อนบันทึก');
  }
  if(!R.no) R.no=docNo('RE');
  if(R.issueTax){ ensureDocNo(R,'taxDocs','taxNo','RT'); stampTaxDoc(R); }
  if(R.paid&&!R.paidDate) R.paidDate=iso();
  if(R.deducted){ const orig=DB.receipts.find(x=>x.id===R.id);
    if(orig) R.items=JSON.parse(JSON.stringify(orig.items)); }
  else if(!R.quoteId){
    const parts=pkgStockLines(rItemsClean(R));
    const short=parts.filter(it=>{const s=DB.stock.find(x=>x.id===it.stockId);return s&&n(it.qty)>n(s.qty)});
    if(short.length&&!await askP({title:'สต๊อกไม่พอ',text:'อะไหล่ '+short.length+' รายการมีไม่พอในสต๊อก ยืนยันตัดสต๊อกให้ติดลบหรือไม่?',yes:'ตัดสต๊อกติดลบ',no:'ยังไม่ตัด'})) return;
    parts.forEach(it=>{const s=DB.stock.find(x=>x.id===it.stockId);
      if(s){s.qty=n(s.qty)-n(it.qty); s.lastMove=R.date; logMove(s.id,'out',-n(it.qty),R.date,'ขายหน้าร้าน (ใบเสร็จ)',R.no);}});
    R.deducted=true;
    logAudit('receipt',R,'deduct','ตัดสต๊อกขายหน้าร้าน '+parts.length+' รายการ');
  }
  const i=DB.receipts.findIndex(x=>x.id===R.id), was=i>=0?DB.receipts[i]:null;
  stampRec(R,was);
  const rc=JSON.parse(JSON.stringify(R)); rc.items=rItemsClean(R);
  if(i>=0) DB.receipts[i]=rc; else DB.receipts.push(rc);
  const q=findQuote(R.quoteId); if(q) q.status='ส่งมอบรถ / ออกใบเสร็จแล้ว';
  logAudit('receipt',R,'save','รับชำระสุทธิ '+money(receiptTotals(R).net)+' บาท'+(R.taxNo?' · ใบกำกับภาษี '+R.taxNo:'')+noVatNote(R,was));
  save(); refreshReceiptRefs(); refreshQuoteRefs(); renderStock(); calcReceipt();
  $('#rTaxNo').value=R.taxNo||''; $('#rNo').textContent='เลขที่ '+R.no+(R.taxNo?' · ใบกำกับภาษี '+R.taxNo:'');
  renderRPrev(); renderApvBars(); rFormSig=receiptSig(); syncSaveBtn(); syncReceiptCancelUI(); renderDocOverview();
  saveFx('บันทึกเอกสารแล้ว',R.no+(R.taxNo?' · ใบกำกับภาษี '+R.taxNo:''));
  toast('บันทึกใบเสร็จ '+R.no+(R.taxNo?' และใบกำกับภาษี '+R.taxNo:'')+' แล้ว');
}
$('#rOpen').onchange=()=>{const id=$('#rOpen').value; if(id) openReceiptById(id)};
function openReceiptById(id){ const r=DB.receipts.find(x=>x.id===id); if(!r) return; logAudit('receipt',r,'open');
  R=JSON.parse(JSON.stringify(r)); fillReceiptForm(); go('receipt'); openModal('mReceiptEdit'); toast('เปิดใบเสร็จ '+r.no); }
function printReceipt(){ if(!R.no) toast('แนะนำให้บันทึกก่อนพิมพ์ เพื่อให้มีเลขที่เอกสาร');
  logAudit('receipt',R,'print','ใบเสร็จรับเงิน / ใบแจ้งหนี้ 2 แผ่น'); save();
  printDocs(sheetReceipt(R,'RE','ต้นฉบับ')+sheetReceipt(R,'RE','สำเนา')); }
/* พิมพ์เฉพาะใบกำกับภาษี — ต้องติ๊ก "ออกใบกำกับภาษีด้วย" แล้วบันทึกให้มีเลขที่ก่อน */
function printReceiptTax(){
  if(!isVatReg()) return toast('กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงออกใบกำกับภาษีไม่ได้');
  if(!R.taxNo) return toast('ใบนี้ยังไม่มีเลขที่ใบกำกับภาษี — ติ๊ก “ออกใบกำกับภาษีด้วย” แล้วกดบันทึกก่อน จึงจะพิมพ์ได้');
  const cur=(R.taxDocs||[]).length?R.taxDocs[R.taxDocs.length-1]:null;
  if(cur&&cur.cancelled) return toast('ใบกำกับภาษี '+cur.no+' ถูกยกเลิกแล้ว พิมพ์ให้ลูกค้าไม่ได้');
  logAudit('receipt',R,'print','ใบกำกับภาษี '+R.taxNo+' 2 แผ่น'); save();
  printDocs(sheetReceipt(R,'RT','ต้นฉบับ')+sheetReceipt(R,'RT','สำเนา'));
}
/* ปุ่มบันทึกของใบเสร็จ — บอกสถานะแทนที่จะเป็นปุ่มนิ่ง ๆ ที่กะพริบตลอดเวลา
   มีของค้าง = เด่น กดได้ กะพริบ · ไม่มีอะไรค้าง = จาง "บันทึกแล้ว" กดไม่ได้ */
function syncSaveBtn(){
  if(typeof R==='undefined'||!R) return;
  const hasContent=rItemsClean(R).length>0;
  const unsaved=!R.no&&hasContent;              /* ใบใหม่ที่กรอกแล้วแต่ยังไม่เคยบันทึก */
  const changed=!!R.no&&receiptSig()!==rFormSig; /* ใบเดิมที่ถูกแก้หลังบันทึก */
  const dirty=unsaved||changed;
  const saved=!!R.no&&!changed;
  const b=$('#rSaveBtn');
  if(b){
    b.disabled=!dirty;
    b.classList.toggle('blinkbtn',dirty);
    b.classList.toggle('pri',dirty);
    b.textContent=saved?'บันทึกแล้ว':'บันทึก';
    b.hidden=saved;
    b.title=dirty?'มีการแก้ไขที่ยังไม่ได้บันทึก':(saved?'บันทึกเรียบร้อยแล้ว ไม่มีอะไรค้าง':'ยังไม่มีรายการให้บันทึก');
  }
  /* ปุ่ม ✓ บนแถบลอยมือถือของใบเสร็จก็คือปุ่มบันทึกตัวเดียวกัน */
  const rb=document.querySelector('#mReceiptEdit .mrail .mr-ok');
  if(rb){
    rb.disabled=!dirty;
    const lbl=rb.querySelector('.ml');
    if(lbl) lbl.textContent=saved?'บันทึกแล้ว':'บันทึก';
    rb.title=b?b.title:'';
  }
}
function syncTaxPrintBtn(){
  const b=$('#rPrintTax'); if(!b) return;
  const cur=R&&(R.taxDocs||[]).length?R.taxDocs[R.taxDocs.length-1]:null;
  const ok=!!(R&&R.taxNo)&&isVatReg()&&!(cur&&cur.cancelled);
  /* จอมือถือซ่อนปุ่มบนหัวป๊อปอัพทั้งแถบ — ปุ่มพิมพ์ใบกำกับภาษีจึงต้องมีคู่กันในเมนู ⋯
     โชว์เฉพาะตอนออกใบกำกับภาษีแล้วจริง (มีเลขที่ · ยังไม่ถูกยกเลิก · กิจการจด VAT) */
  const bm=$('#rPrintTaxM'); if(bm) bm.style.display=ok?'':'none';
  b.disabled=!ok;
  b.title=ok?'พิมพ์ใบกำกับภาษี '+R.taxNo
    :(!isVatReg()?'กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม'
      :(cur&&cur.cancelled)?'ใบกำกับภาษีถูกยกเลิกแล้ว'
      :'ต้องติ๊ก “ออกใบกำกับภาษีด้วย” แล้วบันทึกก่อน');
}
/* ==========================================================
   ใบวางบิล
   ========================================================== */
let BN=null;
function blankBilling(){ return {id:uid(),no:'',date:iso(),custId:'',due:'',receiptIds:[],note:'',
  settled:false,settledDate:'',apv:{status:'draft',byName:'',date:'',note:''}}; }
function newBilling(){ BN=blankBilling(); fillBillingForm(); toast('เปิดใบวางบิลใบใหม่'); }
function fillBillingForm(){
  if(!BN) return;
  $('#bnNo').textContent=BN.no||'เอกสารใหม่';
  $('#bnDate').value=BN.date; $('#bnDue').value=BN.due||''; $('#bnNote').value=BN.note||'';
  $('#bnCust').innerHTML='<option value="">— เลือกลูกค้า —</option>'+DB.cust.map(c=>
    `<option value="${c.id}">${esc(custName(c))}${c.tel?' · '+esc(c.tel):''}</option>`).join('');
  /* ยึด BN.custId เป็นหลักอย่างเดียว — เดิมมีการถอยไปใช้ค่าที่ค้างในช่อง ทำให้กด
     "สร้างใบใหม่" แล้วชื่อลูกค้าใบก่อนยังค้างอยู่ ทั้งที่เอกสารยังไม่ได้เลือกลูกค้าจริง */
  $('#bnCust').value=BN.custId||'';
  if(bnCustPicker) bnCustPicker.sync();   /* ช่องพิมพ์ค้นหาต้องขึ้นชื่อลูกค้าตามใบที่เปิดอยู่ */
  refreshBillingRefs(); renderBillingItems(); renderApvBars();
}
/* ช่องลูกค้าของใบวางบิลเป็นแบบพิมพ์ค้นหา — รองรับลูกค้าหลักร้อยหลักพันราย */
const bnCustPicker=bindPicker('bnCustSearch','bnCustSug','bnCust',custPickerRows);
function pullBillingReceipts(){
  if(BN.settled) return toast('ใบนี้บันทึกรับชำระแล้ว ดึงรายการใหม่ไม่ได้');
  BN.custId=$('#bnCust').value;
  if(!BN.custId) return toast('เลือกลูกค้าก่อน');
  const list=DB.receipts.filter(r=>r.custId===BN.custId&&(typeof PKG_BRANCH==='undefined'||PKG_BRANCH.here(r))&&!r.paid&&!r.cancelled);
  if(!list.length) return toast('ลูกค้ารายนี้ไม่มีใบเสร็จค้างชำระ');
  BN.receiptIds=list.map(r=>r.id);
  renderBillingItems();
  toast('ดึงรายการมา '+list.length+' ใบ');
}
function toggleBillingLine(id){
  if(BN.settled) return;
  const i=BN.receiptIds.indexOf(id);
  if(i>=0) BN.receiptIds.splice(i,1); else BN.receiptIds.push(id);
  renderBillingItems();
}
function renderBillingItems(){
  const lock=!!BN.settled;
  /* ⚠️ ใบที่ยกเลิกมีสถานะ "ยังไม่ชำระ" เหมือนใบปกติ ถ้าไม่กันจะถูกหยิบมาวางบิลได้ */
  const pool=DB.receipts.filter(r=>r.custId===BN.custId&&(typeof PKG_BRANCH==='undefined'||PKG_BRANCH.here(r)||BN.receiptIds.includes(r.id))&&!r.cancelled&&(!r.paid||BN.receiptIds.includes(r.id)));
  /* กรองตามช่วงวันที่ที่เลือก — ใบที่ติ๊กไว้แล้วยังคงติ๊กอยู่แม้จะถูกกรองออกจากจอ
     (บอกจำนวนไว้ใต้ตาราง จะได้ไม่เผลอวางบิลใบที่มองไม่เห็น) */
  const all=applyDateFilter(pool,'bnItemDate');
  $('#bnItems tbody').innerHTML=all.length?all.map(r=>{
    const checked=BN.receiptIds.includes(r.id), t=receiptTotals(r);
    return `<tr>
      <td class="ctr">${lock?(checked?'✓':''):`<input type="checkbox" ${checked?'checked':''} onchange="toggleBillingLine('${r.id}')">`}</td>
      <td class="mono" style="font-size:12px">${esc(r.no)}</td>
      <td class="ctr">${thDate(r.date)}</td>
      <td class="ctr">${r.pay.due?thDate(r.pay.due):'-'}</td>
      <td class="num">${money(t.net)}</td></tr>`;
  }).join(''):`<tr><td colspan="5" class="empty">${pool.length?'ไม่มีใบเสร็จในช่วงวันที่ที่เลือก':'ยังไม่ได้ดึงรายการ'}</td></tr>`;
  billingLineInfo(pool.length,all.length);
}
/* เลือก / ล้าง ทุกใบที่กำลังแสดงอยู่ (ตามตัวกรองวันที่) — ไม่ไปยุ่งกับใบที่ถูกกรองออก */
function bnPickAllShown(on){
  if(BN&&BN.settled) return toast('ใบนี้บันทึกรับชำระแล้ว แก้ไขรายการไม่ได้');
  const pool=DB.receipts.filter(r=>r.custId===BN.custId&&(typeof PKG_BRANCH==='undefined'||PKG_BRANCH.here(r)||BN.receiptIds.includes(r.id))&&!r.cancelled&&(!r.paid||BN.receiptIds.includes(r.id)));
  const shown=applyDateFilter(pool,'bnItemDate').map(r=>r.id);
  if(!shown.length) return toast('ไม่มีรายการที่แสดงอยู่');
  BN.receiptIds=on
    ? [...new Set([...(BN.receiptIds||[]),...shown])]
    : (BN.receiptIds||[]).filter(id=>!shown.includes(id));
  renderBillingItems();
  toast(on?('เลือกครบ '+shown.length+' ใบที่แสดงอยู่'):'ล้างรายการที่แสดงอยู่แล้ว');
}
function billingLineInfo(poolN,shownN){
  const li=$('#bnLineInfo'); if(!li) return;
  const items=DB.receipts.filter(r=>BN.receiptIds.includes(r.id));
  const total=items.reduce((a,r)=>a+receiptTotals(r).net,0);
  /* เตือนถ้ามีใบที่ติ๊กไว้แต่ถูกตัวกรองซ่อนอยู่ — กันวางบิลเกินโดยไม่รู้ตัว */
  let hidden=0;
  if(typeof shownN==='number'&&poolN>shownN){
    const shownIds=applyDateFilter(
      DB.receipts.filter(r=>r.custId===BN.custId&&(typeof PKG_BRANCH==='undefined'||PKG_BRANCH.here(r)||BN.receiptIds.includes(r.id))&&!r.cancelled&&(!r.paid||BN.receiptIds.includes(r.id))),'bnItemDate').map(r=>r.id);
    hidden=items.filter(r=>!shownIds.includes(r.id)).length;
  }
  li.textContent=(BN.settled?'ใบนี้บันทึกรับชำระแล้ว — ':'')
    +'เลือกแล้ว '+items.length+' ใบ · ยอดรวม '+money(total)+' บาท'
    +(typeof shownN==='number'&&poolN>shownN?' · แสดง '+shownN+' จาก '+poolN+' ใบ':'')
    +(hidden?' · ⚠ มีใบที่เลือกไว้ถูกซ่อนจากตัวกรอง '+hidden+' ใบ':'');
}
function collectBilling(){
  BN.date=$('#bnDate').value||iso(); BN.custId=$('#bnCust').value; BN.due=$('#bnDue').value; BN.note=$('#bnNote').value.trim();
}
function saveBilling(){
  if(!can('doc.rIssue')) return toast('บัญชีนี้ไม่มีสิทธิออกใบวางบิล');
  collectBilling();
  if(!BN.custId) return toast('เลือกลูกค้าก่อนบันทึก');
  if(!BN.receiptIds.length) return toast('เลือกใบเสร็จอย่างน้อย 1 ใบ');
  if(!BN.no) BN.no=docNo('BN');
  const i=DB.billings.findIndex(x=>x.id===BN.id);
  stampRec(BN,i>=0?DB.billings[i]:null);
  const rec=JSON.parse(JSON.stringify(BN));
  if(i>=0) DB.billings[i]=rec; else DB.billings.push(rec);
  logAudit('billing',BN,'save',BN.receiptIds.length+' ใบ');
  save(); $('#bnNo').textContent=BN.no; refreshBillingRefs(); renderBillingList(); renderApvBars();
  saveFx('บันทึกเอกสารแล้ว',BN.no);
  toast('บันทึกใบวางบิล '+BN.no+' แล้ว');
}
function sheetBilling(b,copy){
  const c=findCust(b.custId);
  const items=DB.receipts.filter(r=>b.receiptIds.includes(r.id));
  const total=items.reduce((a,r)=>a+receiptTotals(r).net,0);
  const bank=(DB.shop.banks||[]).find(x=>x.general)||(DB.shop.banks||[])[0];
  return sheetTop({title:'ใบวางบิล',en:'BILLING NOTE',copy:copy,
    stamp:b.cancelled?'ยกเลิกแล้ว':(isApproved(b)?'':'ยังไม่อนุมัติ'),
    fields:[['เลขที่',esc(b.no||'(ยังไม่บันทึก)')],['วันที่วางบิล',thDate(b.date)],
      ['กำหนดชำระ',b.due?thDate(b.due):'-'],['จำนวนรายการ',items.length+' ใบ']]})+`
  <table><tr><td><span class="lbl">เรียน</span><br>
    <b>${esc(custName(c)||'-')}</b>${c&&c.type==='company'&&c.name?'<br>ผู้ติดต่อ: '+esc(c.name):''}<br>
    ${esc(addrLine(c&&c.addr))}<br>เลขประจำตัวผู้เสียภาษี ${esc((c&&c.tax)||'-')}${c&&c.branch?' ('+esc(c.branch)+')':''}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:34px">ลำดับ</th><th style="width:130px">เลขที่เอกสาร</th>
    <th style="width:90px">วันที่</th><th style="width:90px">ครบกำหนด</th><th>รายละเอียด</th><th style="width:100px">จำนวนเงิน</th></tr></thead><tbody>
    ${items.map((r,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(r.no)}</td>
      <td style="text-align:center">${thDate(r.date)}</td><td style="text-align:center">${r.pay.due?thDate(r.pay.due):'-'}</td>
      <td>${esc(r.taxNo?'ใบกำกับภาษี '+r.taxNo:'ใบเสร็จรับเงิน')}</td><td class="num">${money(receiptTotals(r).net)}</td></tr>`).join('')}
    <tr><td colspan="5" style="text-align:right"><b>ยอดรวมที่วางบิล</b></td><td class="num"><b>${money(total)}</b></td></tr>
    <tr><td colspan="6" style="text-align:center">(${bahtText(total)})</td></tr>
  </tbody></table>
  <div class="box"><span class="lbl">เงื่อนไขการชำระเงิน</span><br>
    กรุณาชำระเงินภายในวันที่ <b>${b.due?thDate(b.due):'-'}</b> เป็นจำนวนเงิน <b>${money(total)} บาท</b>
    ${bank?'<br>โอนเข้าบัญชี '+esc(bankLabel(bank)):''}
    ${b.note?'<br><span class="lbl">หมายเหตุ: '+esc(b.note)+'</span>':''}</div>
  <div class="sign">
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้วางบิล</span></div>
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้รับวางบิล</span></div>
  </div>
  ${apvFoot(b)}</div>`;
}
function printBilling(){
  if(!BN) return;
  collectBilling();
  if(!BN.no) toast('แนะนำให้บันทึกก่อนพิมพ์ เพื่อให้มีเลขที่เอกสาร');
  logAudit('billing',BN,'print','ต้นฉบับ + สำเนา'); save();
  printDocs(sheetBilling(BN,'ต้นฉบับ')+sheetBilling(BN,'สำเนา'));
}
function openBillingById(id){
  const b=DB.billings.find(x=>x.id===id); if(!b) return;
  logAudit('billing',b,'open');
  BN=JSON.parse(JSON.stringify(b)); fillBillingForm();
  go('receipt'); rOvGo('billing'); openModal('mBillingEdit'); toast('เปิด '+b.no);
}
const BN_PAY_LABEL={cash:'เงินสด',trans:'เงินโอน',check:'เช็ค',card:'บัตรเครดิต / เดบิต'};
let bnPayId=null;
function settleBilling(id){
  if(!can('doc.payRec')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');
  const b=DB.billings.find(x=>x.id===id); if(!b) return;
  if(b.cancelled) return toast('ใบวางบิล '+b.no+' ถูกยกเลิกแล้ว รับชำระไม่ได้');
  if(b.settled) return toast('ใบนี้บันทึกรับชำระไปแล้ว');
  const items=DB.receipts.filter(r=>b.receiptIds.includes(r.id));
  const remOf=r=>r.paid?0:Math.max(0,receiptTotals(r).net-paidAmtOf(r));
  const remTot=items.reduce((a,r)=>a+remOf(r),0);
  /* ใบลูกถูกชำระรายใบครบหมดแล้ว (จากหน้า 4.1 / 08) — ปิดใบวางบิลให้เลย ไม่ต้องรับเงินซ้ำ */
  if(remTot<=0.005){
    b.settled=true; b.settledDate=iso();
    b.pay={method:'',label:'ชำระรายใบครบทุกใบ (ไม่มียอดรับเพิ่ม)',date:iso(),bank:'',ref:'',note:'',byName:meName()};
    logAudit('billing',b,'pay','ปิดใบวางบิล — ใบเสร็จที่อ้างอิงถูกชำระรายใบครบทุกใบแล้ว ไม่มียอดรับเพิ่ม');
    save(); renderBillingList(); renderHome();
    if(BN&&BN.id===b.id){ BN.settled=true; BN.settledDate=b.settledDate; BN.pay=b.pay; fillBillingForm(); }
    return toast('ใบวางบิล '+b.no+' ถูกชำระรายใบครบทุกใบแล้ว — ปิดใบให้เรียบร้อย');
  }
  bnPayId=id;
  $('#bnPayInfo').innerHTML='ใบวางบิล <b>'+esc(b.no)+'</b> · '+esc(custName(findCust(b.custId))||'-')
    +'<br>'+items.map(r=>{
      const net=receiptTotals(r).net, rm=remOf(r);
      return esc(r.no)+' — ยอดบิล '+money(net)
        +(net-rm>0.005?' · ชำระแล้ว '+money(net-rm):'')
        +(rm>0.005?' · คงค้าง <b>'+money(rm)+'</b> บาท':' · <span class="stbtn st-green">ชำระครบแล้ว</span>');
    }).join('<br>')
    +'<br><b>ยอดที่ต้องรับชำระครั้งนี้ '+money(remTot)+' บาท</b> ('+items.filter(r=>remOf(r)>0.005).length+' ใบที่ยังค้าง'
    +(items.some(r=>remOf(r)<=0.005)?' · ใบที่ชำระครบแล้วจะไม่ถูกตัดซ้ำ':'')+')';
  $('#bnPayMethod').value='cash'; $('#bnPayDate').value=iso();
  $('#bnPayBank').value=''; $('#bnPayRef').value=''; $('#bnPayNote').value='';
  openModal('mBnPay');
}
function confirmSettleBilling(){
  const b=DB.billings.find(x=>x.id===bnPayId); if(!b) return;
  const method=$('#bnPayMethod').value;
  const pay={method:method,label:BN_PAY_LABEL[method]||method,date:$('#bnPayDate').value||iso(),
    bank:$('#bnPayBank').value.trim(),ref:$('#bnPayRef').value.trim(),note:$('#bnPayNote').value.trim(),
    byName:meName()};
  const items=DB.receipts.filter(r=>b.receiptIds.includes(r.id));
  /* ยอดที่รับจริง = คงค้างรวมของใบลูก (ใบที่ชำระรายใบไปแล้วไม่ถูกตัดซ้ำ) */
  const total=items.reduce((a,r)=>a+(r.paid?0:Math.max(0,receiptTotals(r).net-paidAmtOf(r))),0);
  items.forEach(r=>{
    /* ลงประวัติงวดให้ใบลูกด้วย — ยอด = คงค้างจริงของใบนั้น เพื่อให้ประวัติรวมเท่ายอดบิลเสมอ */
    const rem=r.paid?0:Math.max(0,receiptTotals(r).net-paidAmtOf(r));
    r.payments=r.payments||[];
    if(rem>0){
      r.payments.push({id:uid(),date:pay.date,amt:rem,method:method,bank:pay.bank,ref:pay.ref,
        card4:'',chkDate:'',by:pay.byName,note:'รับชำระผ่านใบวางบิล '+b.no,billingId:b.id});
      logAudit('receipt',r,'pay','รับชำระผ่านใบวางบิล '+b.no+' · '+money(rem)+' บาท · '+pay.label);
    }
    r.paid=true; r.paidDate=r.paidDate||pay.date; });
  b.settled=true; b.settledDate=pay.date; b.pay=pay;
  logAudit('billing',b,'pay','รับชำระรวม '+money(total)+' บาท (เฉพาะยอดคงค้าง) · '+pay.label
    +(pay.bank?' · '+pay.bank:'')+(pay.ref?' · เลขที่ '+pay.ref:''));
  save(); closeModal('mBnPay'); renderHome(); renderBillingList();
  if(BN&&BN.id===b.id){ BN.settled=true; BN.settledDate=b.settledDate; BN.pay=pay; fillBillingForm(); }
  toast('บันทึกรับชำระใบวางบิล '+b.no+' ('+pay.label+') แล้ว');
}
/* ยกเลิกใบวางบิล — ไม่ลบทิ้ง เก็บไว้ดูย้อนหลังพร้อมเหตุผล */
async function cancelBilling(id){
  if(!can('doc.cancelDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกใบวางบิล');
  if(!can('doc.delDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกเอกสาร');
  const b=DB.billings.find(x=>x.id===id); if(!b) return;
  if(b.cancelled) return toast('ใบวางบิลนี้ถูกยกเลิกไปแล้ว');
  const reason=await askPromptP({title:'ยกเลิกใบวางบิล '+b.no,text:'ระบุเหตุผลที่ยกเลิก (ไม่บังคับ)',yes:'ยกเลิกเอกสาร',no:'ไม่ยกเลิก'});
  if(reason===null) return;
  if(b.settled&&!await askP({title:'ใบนี้รับชำระแล้ว',text:'ใบนี้บันทึกรับชำระไว้แล้ว\nยกเลิกจะคืนใบเสร็จที่อ้างอิงกลับเป็นค้างชำระด้วย ยืนยันหรือไม่?',yes:'ยืนยันยกเลิก',no:'ไม่ยกเลิก'})) return;
  if(b.settled) b.receiptIds.forEach(rid=>{
    const r=DB.receipts.find(x=>x.id===rid);
    if(r){ r.paid=false; r.paidDate='';
      /* ยกเลิกงวดที่มาจากใบวางบิลนี้ด้วย ไม่งั้นยอดคงค้างจะเพี้ยน */
      (r.payments||[]).filter(p=>p.billingId===b.id&&!p.cancelled).forEach(p=>{
        p.cancelled=true; p.cancelDate=iso(); p.cancelBy=meName();
        p.cancelReason='ยกเลิกใบวางบิล '+b.no; });
      logAudit('receipt',r,'save','คืนสถานะค้างชำระจากการยกเลิกใบวางบิล '+b.no); }
  });
  b.cancelled=true; b.cancelReason=String(reason||'').trim(); b.cancelDate=iso();
  b.settled=false; b.settledDate='';
  logAudit('billing',b,'del','ยกเลิกใบวางบิล'+(b.cancelReason?' — '+b.cancelReason:''));
  save(); renderHome(); renderBillingList(); refreshBillingRefs();
  if(BN&&BN.id===id) fillBillingForm();
  toast('ยกเลิกใบวางบิล '+b.no+' แล้ว');
}
function refreshBillingRefs(){
  const el=$('#bnOpen'); if(!el) return;
  el.innerHTML='<option value="">— เปิดใบวางบิลที่บันทึกไว้ —</option>'
    +DB.billings.slice().sort((a,b)=>b.date.localeCompare(a.date))
      .map(b=>`<option value="${b.id}">${esc(b.no)} · ${esc(custName(findCust(b.custId))||'-')}</option>`).join('');
}
$('#bnOpen').onchange=()=>{ const id=$('#bnOpen').value; if(id) openBillingById(id); };
/* ยอดของใบวางบิล — คิดจากใบเสร็จลูกเสมอ ใบที่ถูกชำระรายใบจากหน้าอื่น (4.1 / 08)
   จะสะท้อนที่นี่ทันที · แยกออกมาให้ทั้งตารางและตัวเรียงคอลัมน์ใช้สูตรเดียวกัน */
function bnAmt(b){
  const items=DB.receipts.filter(r=>(b.receiptIds||[]).includes(r.id));
  const total=items.reduce((s,r)=>s+receiptTotals(r).net,0);
  const rem=items.reduce((s,r)=>s+(r.paid?0:Math.max(0,receiptTotals(r).net-paidAmtOf(r))),0);
  return {items,total,rem,paid:Math.max(0,total-rem)};
}
function renderBillingList(){
  const q=($('#bnOvSearch').value||'').toLowerCase().trim();
  let rows=DB.billings.slice().sort((a,b)=>b.date.localeCompare(a.date));
  if(q) rows=rows.filter(b=>[b.no,custName(findCust(b.custId))].some(s=>String(s||'').toLowerCase().includes(q)));
  rows=applyDateFilter(rows,'bnOvDate');
  rows=sortRows('bnTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  const bnTotal=rows.length;
  rows=limitRows(rows,'bnOv');
  $('#bnTbl tbody').innerHTML=rows.map(b=>{
    const a=bnAmt(b), items=a.items, total=a.total, rem=a.rem, paidShown=a.paid;
    const allPaidByItems=!b.settled&&!b.cancelled&&items.length>0&&rem<=0.005;
    const st=b.cancelled?'<span class="stbtn st-red" title="'+esc(b.cancelReason||'')+'">ยกเลิกแล้ว</span>'
      :b.settled?'<span class="stbtn st-green">รับชำระแล้ว</span>'
      :allPaidByItems?'<span class="stbtn st-green">ชำระครบแล้ว</span><div class="hint">ชำระรายใบครบทุกใบ</div>'
      :(paidShown>0.005?'<span class="stbtn st-blue">ชำระบางส่วน</span> ':'')+'<span class="stbtn st-orange">รอรับชำระ</span>';
    const payInfo=b.settled&&b.pay
      ?`<div class="hint">ชำระโดย ${esc(b.pay.label||'-')}${b.pay.bank?' · '+esc(b.pay.bank):''}${b.pay.ref?' · '+esc(b.pay.ref):''} · ${thDate(b.pay.date)}</div>`:'';
    return `<tr${b.cancelled?' class="cancelrow"':''}>
      <td class="mono" style="font-size:12px"><span class="docno" onclick="openBillingById('${b.id}')">${esc(b.no||'(ไม่มีเลขที่)')}</span></td>
      <td class="ctr">${thDate(b.date)}</td>
      <td>${esc(custName(findCust(b.custId))||'-')}${payInfo}</td>
      <td class="num">${b.receiptIds.length}</td>
      <td class="num">${money(total)}</td>
      <td class="num">${paidShown>0.005?money(paidShown):'-'}</td>
      <td class="num"><b>${money(b.cancelled?0:rem)}</b></td>
      <td class="ctr">${st}</td>
      ${byCell(b)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px;width:106px">
        ${allPaidByItems?`<button class="btn sm gh pc-payRec" onclick="settleBilling('${b.id}')">ปิดใบวางบิล</button>`:''}
        ${b.cancelled?'<span class="hint">ยกเลิกแล้ว</span>':`<button class="btn sm dgr pc-delDoc" onclick="cancelBilling('${b.id}')">ยกเลิก</button>`}</div></td></tr>`;
  }).join('');
  $('#bnEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('bnTbl');
  if(typeof mkCards==='function') mkCards('bnTbl');
  $('#bnCount').textContent=bnTotal+' ใบ';
}
if($('#bnOvSearch')) $('#bnOvSearch').onkeydown=e=>{ if(e.key==='Enter') renderBillingList(); };
[['clmSearch',()=>renderClaimList()],['isuSearch',()=>renderIssueList()],['scnSearch',()=>renderCountList()]]
  .forEach(([id,fn])=>{ const el=$('#'+id); if(el) el.onkeydown=e=>{ if(e.key==='Enter') fn(); }; });

/* ---------- ใบรับสินค้า (พิมพ์) ---------- */
function sheetGR(g,copy){
  const v=findVen(g.vendorId), t=grTotals(g), s=DB.shop, its=grItemsClean(g);
  return sheetTop({title:'ใบรับสินค้า',en:'GOODS RECEIVED NOTE',copy:copy,
    stamp:g.cancelled?'ยกเลิกแล้ว':(isApproved(g)?'':'ยังไม่อนุมัติ'),
    fields:[['เลขที่',esc(g.no||'(ยังไม่บันทึก)')],['วันที่รับสินค้า',thDate(g.date)],
      ['ใบกำกับผู้ขาย',esc(g.inv||'-')],['ลงวันที่',thDate(g.invDate)]]})+`
  <table><tr><td style="width:58%;vertical-align:top"><span class="lbl">ผู้ขาย</span><br>
      <b>${esc((v&&v.name)||'-')}</b><br>${esc(addrLine(v&&v.addr))}<br>
      เลขประจำตัวผู้เสียภาษี ${esc((v&&v.tax)||'-')}<br>ผู้ติดต่อ ${esc((v&&v.contact)||'-')} โทร. ${esc((v&&v.tel)||'-')}</td>
    <td style="vertical-align:top"><span class="lbl">เงื่อนไขการชำระเงิน</span><br>
      ${g.term==='credit'?'เครดิต '+n(g.days)+' วัน<br>ครบกำหนดชำระ <b>'+thDate(g.due)+'</b>':'เงินสด / โอนทันที'}<br>
      สถานะ ${g.paid?'ชำระแล้ว':'ยังไม่ชำระ'}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:30px">#</th><th style="width:110px">รหัสสินค้า</th>
    <th style="width:100px">OEM</th><th>รายการ</th><th style="width:100px">หมวด</th><th style="width:48px">จำนวน</th>
    <th style="width:78px">ทุน/หน่วย</th><th style="width:88px">จำนวนเงิน</th></tr></thead><tbody>
    ${its.map((it,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(it.code)}</td><td>${esc(it.oem||'-')}</td>
      <td>${esc(it.name)}</td><td>${esc(it.cat||'-')}</td><td style="text-align:center">${qf(it.qty)}</td>
      <td class="num">${money(it.cost)}</td><td class="num">${money(n(it.qty)*n(it.cost))}</td></tr>`).join('')}
    <tr><td colspan="7" style="text-align:right">รวมเป็นเงิน</td><td class="num">${money(t.sub)}</td></tr>
    <tr><td colspan="7" style="text-align:right">หักส่วนลด</td><td class="num">${money(t.disc)}</td></tr>
    <tr><td colspan="7" style="text-align:right">ภาษีมูลค่าเพิ่ม ${n(g.vat)}%</td><td class="num">${money(t.vat)}</td></tr>
    <tr><td colspan="7" style="text-align:right"><b>ยอดสุทธิ</b></td><td class="num"><b>${money(t.total)}</b></td></tr>
    <tr><td colspan="8" style="text-align:center">(${bahtText(t.total)})</td></tr></tbody></table>
  ${g.note?`<div class="box"><span class="lbl">หมายเหตุ</span><br>${esc(g.note)}</div>`:''}
  <div class="sign">
    <div><div class="line"></div>( ${esc(g.by||'.................................................')} )<br><span class="lbl">ผู้รับสินค้า</span></div>
    <div><div class="line"></div>( ${esc(g.check||'.................................................')} )<br><span class="lbl">ผู้ตรวจรับ</span></div>
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ส่งสินค้า</span></div>
  </div>
  <div class="note">${g.posted?'สินค้าตามรายการนี้ถูกบันทึกเข้าสต๊อกแล้ว สามารถตรวจสอบย้อนกลับได้จากบัตรสินค้าแต่ละรายการ':'รอการอนุมัติ — ยังไม่ได้บันทึกเข้าสต๊อก'} · ${esc(s.name||'')}</div>${apvFoot(g)}</div>`;
}
function printGR(){ if(!G.no) toast('แนะนำให้บันทึกก่อนพิมพ์ เพื่อให้มีเลขที่เอกสาร');
  logAudit('gr',G,'print','ต้นฉบับ + สำเนา'); save();
  printDocs(sheetGR(G,'ต้นฉบับ')+sheetGR(G,'สำเนา')); }

/* ==========================================================
   ตั้งค่า / ข้อมูล
   ========================================================== */
function bankRowHtml(b){ b=b||{};
  return `<div class="row bankrow" style="gap:8px;flex-wrap:nowrap;margin-bottom:7px;align-items:center">
    <select class="bkName" style="flex:1.3"><option value="">— เลือกธนาคาร —</option>${BANKS.map(x=>`<option ${b.name===x?'selected':''}>${esc(x)}</option>`).join('')}</select>
    <input type="text" class="bkNo mono" style="flex:1" placeholder="เลขที่บัญชี" value="${esc(b.no)}">
    <input type="text" class="bkAcc" style="flex:1.2" placeholder="ชื่อบัญชี" value="${esc(b.acc)}">
    <label class="row" style="gap:5px;white-space:nowrap"><input type="checkbox" class="bkGen" ${b.general?'checked':''}> เงินกิจการทั่วไป</label>
    ${isVatReg()?`<label class="row" style="gap:5px;white-space:nowrap"><input type="checkbox" class="bkVat" ${b.vat?'checked':''}> บัญชีภาษีมูลค่าเพิ่ม</label>`
      :`<input type="hidden" class="bkVat" data-v="${b.vat?'1':''}">`}
    <button class="btn sm dgr" onclick="this.closest('.bankrow').remove()">ลบ</button></div>`; }
function addBankRow(b){ $('#bankRows').insertAdjacentHTML('beforeend',bankRowHtml(b)); }
function collectBanks(){ return $$('#bankRows .bankrow').map(r=>({
    name:r.querySelector('.bkName').value,no:r.querySelector('.bkNo').value.trim(),
    acc:r.querySelector('.bkAcc').value.trim(),general:r.querySelector('.bkGen').checked,
    /* กิจการที่ไม่จด VAT ไม่เห็นช่องติ๊กนี้ — เก็บค่าเดิมไว้ใน data-v ไม่ให้ถูกล้างทิ้ง
       ถ้าวันหลังไปจดทะเบียน VAT ค่าที่เคยติ๊กไว้จะกลับมาเหมือนเดิม */
    vat:bkVatOf(r.querySelector('.bkVat'))})).filter(b=>b.name||b.no); }
function bkVatOf(el){ return !el?false:el.type==='hidden'?el.dataset.v==='1':el.checked; }
function bankLabel(b){ return [b.name,b.no].filter(Boolean).join(' ')+(b.acc?' ('+b.acc+')':''); }
function fillBankList(){
  const dl=$('#shopBankList'); if(!dl) return;
  dl.innerHTML=(DB.shop.banks||[]).map(b=>`<option value="${esc(bankLabel(b))}">`).join(''); }
function fillSetting(){ const s=DB.shop;
  $$('#sTypeSeg button').forEach(b=>b.classList.toggle('on',b.dataset.t===(s.type||'person')));
  $$('#sVatSeg button').forEach(b=>b.classList.toggle('on',b.dataset.v===(isVatReg()?'1':'0')));
  $('#sCoWrap').style.opacity=(s.type==='company')?1:.55;
  $('#sPerson').value=s.person||'';$('#sName').value=s.name||'';$('#sCompany').value=s.company||'';
  $('#sTax').value=s.tax||'';$('#sBranch').value=s.branch||'';
  $('#sAddr').value=s.addr||'';$('#sTel').value=s.tel||'';$('#sEmail').value=s.email||'';$('#sWeb').value=s.web||'';
  $('#sStale').value=s.stale||6;$('#sWarrM').value=s.warrM||3;$('#sWarr').value=s.warr||'';
  $('#sSsoRate').value=s.ssoRate||5;$('#sSsoMin').value=s.ssoMin||1650;
  $('#sSsoMax').value=s.ssoMax||15000;$('#sSsoCap').value=s.ssoCap||750;
  $('#bankRows').innerHTML='';
  const bl=(s.banks&&s.banks.length)?s.banks:(s.bank?[{name:'',no:s.bank,acc:'',general:true,vat:false}]:[{general:true}]);
  bl.forEach(addBankRow); fillBankList();
  $('#sLicStart').value=s.licStart||iso();$('#sLicEnd').value=licEnd();
  $('#sLogoHead').checked=s.logoHead!==false;$('#sLogoOp').value=n(s.logoOp)||7;$('#sLogoOpV').textContent=(n(s.logoOp)||7)+'%';
  $('#logoBox').innerHTML=s.logo?`<img src="${s.logo}" style="max-width:100%;max-height:100%">`:'<span class="hint">ยังไม่มีโลโก้</span>';
  $('#shopName').textContent=orgName();
}
$('#sTypeSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  $$('#sTypeSeg button').forEach(x=>x.classList.toggle('on',x===b));
  $('#sCoWrap').style.opacity=b.dataset.t==='company'?1:.55;});
$('#sVatSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  $$('#sVatSeg button').forEach(x=>x.classList.toggle('on',x===b));});
$('#sLogoOp').oninput=()=>$('#sLogoOpV').textContent=$('#sLogoOp').value+'%';
function pickLogo(inp){
  const f=inp.files[0]; if(!f) return; const rd=new FileReader();
  rd.onload=()=>{ const img=new Image();
    img.onload=()=>{ const max=480, sc=Math.min(1,max/Math.max(img.width,img.height));
      const cv=document.createElement('canvas'); cv.width=Math.round(img.width*sc)||1; cv.height=Math.round(img.height*sc)||1;
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      DB.shop.logo=cv.toDataURL('image/png'); save(); fillSetting(); renderBrand(); renderQPrev(); renderRPrev();
      toast('อัปโหลดโลโก้แล้ว · ระบบจะพิมพ์เป็นลายน้ำจาง ๆ กลางเอกสารให้อัตโนมัติ'); };
    img.onerror=()=>toast('อ่านไฟล์ภาพไม่ได้ ลองไฟล์ PNG หรือ JPG อีกครั้ง');
    img.src=rd.result; };
  rd.readAsDataURL(f); inp.value='';
}
async function clearLogo(){ if(!DB.shop.logo) return toast('ยังไม่มีโลโก้ในระบบ');
  if(!await askP({title:'ลบโลโก้',text:'ลบโลโก้ออกจากระบบ?',yes:'ลบ',no:'ไม่ลบ'})) return;
  DB.shop.logo=''; save(); fillSetting(); renderBrand(); renderQPrev(); renderRPrev(); toast('ลบโลโก้แล้ว'); }
async function saveSetting(){
  if(!can('doc.orgEdit')) return toast('บัญชีนี้ไม่มีสิทธิแก้ไขตั้งค่าองค์กร');
  const tb=$('#sTypeSeg button.on'), vb=$('#sVatSeg button.on');
  /* ปิดการจดทะเบียน VAT ทั้งที่เคยออกใบกำกับภาษีไปแล้ว — ต้องให้ยืนยันก่อน
     เอกสารเก่าไม่ถูกลบหรือแก้ แต่ออกใบกำกับใบใหม่ไม่ได้อีก */
  const wantReg=vb?vb.dataset.v==='1':isVatReg();
  if(isVatReg()&&!wantReg){
    const cnt=(DB.receipts||[]).filter(r=>r.taxNo).length;
    if(cnt&&!await askP({title:'ปิดการจดทะเบียนภาษีมูลค่าเพิ่ม',
      text:'พบใบกำกับภาษีที่ออกไปแล้ว '+cnt+' ฉบับ\n\n'
        +'เอกสารเดิมทั้งหมดยังอยู่ครบและเปิดดูย้อนหลังได้ตามปกติ\n'
        +'แต่หลังจากนี้จะออกใบกำกับภาษีใบใหม่ไม่ได้ และหน้าสรุปภาษีจะเลิกแสดง ภ.พ.30\n\n'
        +'ยืนยันหรือไม่',
      yes:'ยืนยัน ปิดการจดทะเบียน',no:'ไม่ ยกเลิก'})){
      fillSetting(); return toast('ยกเลิกแล้ว — การตั้งค่ายังเป็นกิจการที่จดทะเบียนภาษีมูลค่าเพิ่มเหมือนเดิม');
    }
  }
  DB.shop=Object.assign({},DB.shop,{type:tb?tb.dataset.t:'person',vatReg:wantReg,
    person:$('#sPerson').value.trim(),name:$('#sName').value.trim(),company:$('#sCompany').value.trim(),
    tax:$('#sTax').value.trim(),branch:$('#sBranch').value.trim(),
    addr:$('#sAddr').value.trim(),tel:$('#sTel').value.trim(),email:$('#sEmail').value.trim(),web:$('#sWeb').value.trim(),
    stale:n($('#sStale').value)||6,warrM:n($('#sWarrM').value)||3,warr:$('#sWarr').value,
    ssoRate:n($('#sSsoRate').value)||5,ssoMin:n($('#sSsoMin').value)||1650,
    ssoMax:n($('#sSsoMax').value)||15000,ssoCap:n($('#sSsoCap').value)||750,
    banks:collectBanks(),bank:(()=>{const b=collectBanks();const g=b.find(x=>x.general)||b[0];return g?bankLabel(g):''})(),
    licStart:$('#sLicStart').value||iso(),licEnd:$('#sLicEnd').value||addDays(iso(),365),
    logoHead:$('#sLogoHead').checked,logoOp:n($('#sLogoOp').value)||7});
  save();fillSetting();renderBrand();fillBankList();applyVatMode();renderStock();renderQPrev();renderRPrev();renderHome();renderLicense();
  toast('บันทึกการตั้งค่าองค์กรแล้ว');
}
function applyVatMode(){
  const reg=isVatReg(), tax=$('#rIssueTax');
  if(tax){ tax.disabled=!reg; if(!reg){tax.checked=false; if(R) R.issueTax=false;} }
  if(!reg){ if(Q&&!Q.no){Q.vat=0;$('#qVat').value='0';} if(R&&!R.no){R.vat=0;$('#rVat').value='0';} }
  /* ฝั่งขาย — ไม่จดทะเบียนแล้วเก็บ VAT จากลูกค้าไม่ได้ ล็อกช่องไว้เลย ไม่ใช่แค่ตั้งค่าเริ่มต้นให้
     เอกสารเก่าที่ออกตอนยังจดทะเบียนอยู่ยังโชว์อัตราเดิมของตัวเอง แค่แก้ไม่ได้ */
  vatLock('qVat',reg); vatLock('rVat',reg);
  /* ฝั่งซื้อ: ล็อกไว้กันกดพลาด — ถ้าปล่อยให้เลือก 7% ได้ แล้วผู้ใช้ไปกดปุ่มปรับต้นทุน "+VAT 7%" ด้วย
     ยอดจะมี VAT สองรอบ (อยู่ในต้นทุน + บรรทัด VAT ท้ายบิล) */
  vatLock('grVat',reg,true); vatLock('yVat',reg,true);
  /* ฝั่งซื้อยังกรอก VAT ได้ตามปกติ (ยังต้องจ่ายให้ผู้ขายอยู่ดี) แต่เปลี่ยนป้ายให้ตรงความจริง —
     ไม่จดทะเบียน = ภาษีซื้อขอคืนไม่ได้ มันคือต้นทุน ไม่ใช่ลูกหนี้สรรพากร */
  const vlbl=reg?'ภาษีซื้อ':'VAT (รวมเป็นต้นทุน)';
  [['expThVat',reg?'VAT':'VAT (ต้นทุน)'],['expCatThVat',vlbl],['xSumVatLbl',vlbl]]
    .forEach(([id,txt])=>{ const el=$('#'+id); if(el) el.textContent=txt; });
  const xv=$('#xVat'); if(xv&&xv.options[0])
    xv.options[0].textContent=reg?'VAT 7% (มีใบกำกับภาษี)':'VAT 7% (บวกเป็นต้นทุน ขอคืนไม่ได้)';
  const h=$('#rTaxHint');
  if(h&&!reg) h.textContent='กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงออกได้เฉพาะใบเสร็จรับเงิน 2 ชุด (ต้นฉบับ + สำเนา)';
  vatGateApply();
}
/* ล็อก/ปลดล็อกช่องเลือก VAT พร้อมเปลี่ยนป้ายชื่อให้รู้เหตุผล */
function vatLock(id,reg,buy){
  const el=$('#'+id); if(!el) return;
  el.disabled=!reg;
  if(!reg&&n(el.value)>0&&(!G||!G.no||id!=='grVat')) el.value='0';
  const lb=el.closest('label.f'); const sp=lb&&lb.querySelector('span');
  if(sp) sp.textContent=reg?'ภาษีมูลค่าเพิ่ม'
    :(buy?'ภาษีมูลค่าเพิ่ม · ไม่ได้จดทะเบียน (บวกเข้าต้นทุนแทน)':'ภาษีมูลค่าเพิ่ม · ไม่ได้จดทะเบียน');
  if(lb) lb.title=reg?'':(buy
    ?'กิจการยังไม่ได้จดทะเบียน VAT จึงขอคืนภาษีซื้อไม่ได้ — VAT ที่จ่ายให้ผู้ขายถือเป็นต้นทุน ใช้ปุ่ม "ปรับต้นทุน" บวก 7% เข้าราคาต่อหน่วยแทน'
    :'กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงเรียกเก็บ VAT จากลูกค้าไม่ได้ — ตั้งค่าที่หน้า 10 ตั้งค่าองค์กร');
}
/* ถ้ายังไม่จดทะเบียน VAT ปิดการใช้งานแท็บใบกำกับภาษี (04) และรายงานภาษี (08) */
const VAT_GATE_HOSTS=['rOv-tax','a-tax'];
function vatGateApply(){
  /* ไม่จดทะเบียน + ไม่เคยมีเอกสารภาษีเลย = ปิดสนิท ทั้งปุ่มเมนูและเนื้อหา
     ไม่จดทะเบียน + เคยมีของเก่า = เปิดให้เข้าดูย้อนหลังได้ (ออกใบใหม่ยังถูกกันที่ปุ่มออกใบกำกับอยู่แล้ว) */
  const reg=isVatReg(), keep=reg||hasVatHistory();
  vatMenuBtn('#rOvTabs button[data-t="tax"]',keep,()=>{ if(rOvPane==='tax') rOvGo('doc'); });
  vatMenuBtn('#acctTabs button[data-a="tax"]',keep,()=>{ if(acctPane==='tax') acctGo('health'); });
  VAT_GATE_HOSTS.forEach(hid=>{
    const host=$('#'+hid); if(!host) return;
    if(!host.querySelector(':scope>.vatgate')){
      const g=document.createElement('div');
      g.className='vatgate';
      g.innerHTML='<b>กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม จึงไม่สามารถออกเอกสารได้</b>'
        +'กรุณาตั้งค่าที่หน้า 10 · ตั้งค่าองค์กร<br><br>'
        +'<button class="btn pri" onclick="go(\'setting\')">ไปหน้าตั้งค่าองค์กร</button>';
      host.insertBefore(g,host.firstChild);
    }
    host.classList.toggle('vatoff',!keep);
    /* เข้าดูของเก่าได้ แต่ต้องรู้ว่าออกใบใหม่ไม่ได้แล้ว */
    let ro=host.querySelector(':scope>.vatro');
    if(!reg&&keep){
      if(!ro){ ro=document.createElement('div'); ro.className='vatro';
        ro.innerHTML='กิจการยังไม่ได้จดทะเบียนภาษีมูลค่าเพิ่ม — หน้านี้เปิดไว้ให้<b>ดูเอกสารย้อนหลัง</b>เท่านั้น ออกใบกำกับภาษีใบใหม่ไม่ได้';
        host.insertBefore(ro,host.firstChild); }
      ro.style.display='';
    }else if(ro) ro.style.display='none';
  });
}
/* ซ่อน/โชว์ปุ่มแท็บ พร้อมเด้งออกจากแท็บนั้นถ้ากำลังเปิดค้างอยู่ */
function vatMenuBtn(sel,show,leave){
  const b=document.querySelector(sel); if(!b) return;
  b.style.display=show?'':'none';
  if(!show&&typeof leave==='function') leave();
}
async function renderStoreBox(){
  const el=$('#storeInfo'); if(!el) return;
  await STORE.init();
  const warn=STORAGE_MODE==='mem'||STORAGE_MODE==='ls';
  el.innerHTML=`ระบบกำลังเก็บข้อมูลไว้ที่ <b>${esc(STORAGE_LABEL[STORAGE_MODE]||STORAGE_MODE)}</b>`
    +(STORAGE_MODE==='idb'?'<br>ข้อมูลอยู่ในเครื่องนี้เท่านั้น รองรับข้อมูลขนาดใหญ่ และสำรองอัตโนมัติให้วันละครั้ง'
     :STORAGE_MODE==='host'?'<br>ข้อมูลถูกจัดเก็บโดยแอปที่เปิดโปรแกรมนี้ และสำรองอัตโนมัติให้วันละครั้ง'
     :STORAGE_MODE==='ls'?'<br><span style="color:var(--danger)">พื้นที่จำกัดประมาณ 5 MB และไม่มีสำรองอัตโนมัติ — ควรกดส่งออกไฟล์สำรองเป็นประจำ</span>'
     :'<br><span style="color:var(--danger)">โหมดนี้ข้อมูลจะหายเมื่อปิดหน้าจอ — กรุณาส่งออกไฟล์สำรองทันที</span>')
    +`<br>ขนาดข้อมูลปัจจุบันประมาณ <b>${(JSON.stringify(DB).length/1024/1024).toFixed(2)} MB</b>`;
  const sel=$('#bakList'); if(!sel) return;
  const list=await listBackups();
  sel.innerHTML=list.length?list.map(b=>`<option value="${esc(b.key)}">${esc(bakLabel(b.day))}</option>`).join('')
    :'<option value="">— ยังไม่มีจุดสำรองอัตโนมัติ —</option>';
}
async function backupNow(){
  await STORE.init();
  if(!['host','idb'].includes(STORAGE_MODE)) return toast('โหมดที่เก็บข้อมูลนี้ยังไม่รองรับจุดสำรองในเครื่อง — ใช้ปุ่มส่งออกไฟล์สำรองแทน');
  lastBakDay=''; await autoBackup(JSON.stringify(DB)); await renderStoreBox();
  toast('สร้างจุดสำรองของวันนี้แล้ว');
}
async function restoreBackup(){
  if(!can('doc.backup')) return toast('บัญชีนี้ไม่มีสิทธิกู้คืนข้อมูล');
  const key=$('#bakList').value; if(!key) return toast('ยังไม่มีจุดสำรองให้กู้คืน');
  const label=bakLabel(String(key).replace(KEY+'.bak.',''));
  await guardWholeData({kind:'restore',act:'restore',note:'กู้คืนข้อมูลจากจุดสำรอง '+label,
    ask:{title:'กู้คืนข้อมูล',text:'กู้คืนข้อมูลจากจุดสำรอง '+label+' ?\nข้อมูลปัจจุบันจะถูกแทนที่ทั้งหมด',yes:'กู้คืน',no:'ยังไม่กู้คืน'},
    run:async()=>{
      try{
        const v=await STORE.get(key); if(!v){ toast('อ่านจุดสำรองไม่สำเร็จ'); return false; }
        await STORE.set(KEY+'.bak.before-restore',JSON.stringify(DB));
        DB=Object.assign(DB,JSON.parse(v)); await save(true); boot(); renderStoreBox();
        toast('กู้คืนข้อมูลเรียบร้อยแล้ว');
      }catch(e){ toast('กู้คืนไม่สำเร็จ: '+e.message); return false; }
    }});
}
function exportData(){ if(!can('doc.export')) return toast('บัญชีนี้ไม่มีสิทธิส่งออกข้อมูล');
  const b=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='garage-backup-'+iso()+'.json';a.click();toast('ส่งออกไฟล์สำรองแล้ว'); }
function importData(inp){ if(!can('doc.import')){ if(inp) inp.value=''; return toast('บัญชีนี้ไม่มีสิทธินำเข้าข้อมูล'); } const f=inp.files[0]; if(!f) return; const rd=new FileReader();
  rd.onload=()=>{let v;try{v=JSON.parse(rd.result);}catch(e){return toast('ไฟล์ไม่ถูกต้อง อ่านข้อมูลไม่ได้');}
    guardWholeData({kind:'import',act:'import',note:'นำเข้าข้อมูลจากไฟล์ '+f.name,
      ask:{title:'นำเข้าข้อมูล',text:'นำเข้าข้อมูลจากไฟล์ '+f.name+' ?\nข้อมูลปัจจุบันจะถูกแทนที่ทั้งหมด',yes:'นำเข้า',no:'ยังไม่นำเข้า'},
      run:()=>{try{DB=Object.assign(DB,v);save();boot();toast('นำเข้าข้อมูลเรียบร้อย');}catch(e){toast('ไฟล์ไม่ถูกต้อง อ่านข้อมูลไม่ได้');return false;}}});};
  rd.readAsText(f); inp.value=''; }
async function wipe(){ if(!can('doc.wipe')) return toast('บัญชีนี้ไม่มีสิทธิล้างข้อมูล');
  await guardWholeData({kind:'wipe',act:'wipe',note:'ล้างข้อมูลทั้งหมด',
    ask:{title:'ล้างข้อมูลทั้งหมด',text:'ล้างข้อมูลทั้งหมดออกจากระบบ?',yes:'ล้างข้อมูล',no:'ไม่ล้าง'},run:()=>{
  DB={stock:[],cust:[],vendors:[],purchases:[],quotes:[],receipts:[],moves:[],crm:[],emp:[],curEmp:'',
    expenses:[],assets:[],capital:[],claims:[],issues:[],stockCounts:[],billings:[],invoices:[],cats:[],catsOff:[],units:[],coa:DB.coa,map:DB.map,audit:[],hr:[],warns:[],seq:{},shop:DB.shop};
  Q=null;R=null;G=null;IS=null;SC=null;BN=null;IV=null;save();boot();toast('ล้างข้อมูลแล้ว'); }}); }
function seedDemo(){
  return guardWholeData({kind:'sample',act:'demo',note:'โหลดข้อมูลตัวอย่าง',
    ask:{title:'โหลดข้อมูลตัวอย่าง',text:'โหลดข้อมูลตัวอย่าง?\nข้อมูลปัจจุบันจะถูกแทนที่ทั้งหมด',yes:'โหลดข้อมูล',no:'ไม่โหลด'},run:seedDemoNow});
}
function seedDemoNow(){
  const today=new Date(), old=new Date(); old.setMonth(old.getMonth()-9);
  const lastMo=new Date(); lastMo.setMonth(lastMo.getMonth()-1);
  const sid=()=>uid();
  const st=[
    {code:'EL-101',oem:'27060-0L080',name:'ไดชาร์จ Toyota Revo',cat:'อะไหล่ไฟฟ้า',cost:4200,pa:6500,pb:6100,pc:5800,qty:2,min:2,max:8,lastMove:iso(today),zone:'A',shelf:1,loc:'',warr:6},
    {code:'EL-118',oem:'GS-75D26L',name:'แบตเตอรี่ 75Ah',cat:'อะไหล่ไฟฟ้า',cost:2350,pa:3400,pb:3200,pc:3050,qty:3,min:3,max:10,lastMove:iso(today),zone:'A',shelf:2,loc:'หน้าร้าน',warr:12},
    {code:'AC-204',oem:'88320-0K330',name:'คอมเพรสเซอร์แอร์ D-Max',cat:'อะไหล่แอร์',cost:5600,pa:8900,pb:8400,pc:8000,qty:1,min:1,max:4,lastMove:iso(lastMo),zone:'B',shelf:1,loc:'',warr:6},
    {code:'AC-215',oem:'87139-0K030',name:'กรองแอร์ในห้องโดยสาร',cat:'อะไหล่แอร์',cost:120,pa:350,pb:300,pc:260,qty:26,min:8,max:20,lastMove:iso(today),zone:'B',shelf:2,loc:'',warr:''},
    {code:'SU-330',oem:'48510-0K190',name:'โช้คอัพหน้า Hilux',cat:'อะไหล่ช่วงล่าง',cost:1750,pa:2900,pb:2700,pc:2500,qty:6,min:2,max:12,lastMove:iso(old),zone:'C',shelf:1,loc:'',warr:6},
    {code:'SU-341',oem:'48815-0K010',name:'ยางกันโคลงหน้า',cat:'อะไหล่ช่วงล่าง',cost:180,pa:450,pb:400,pc:360,qty:12,min:6,max:24,lastMove:iso(today),zone:'C',shelf:2,loc:'',warr:''},
    {code:'BR-001',oem:'04465-0K260',name:'ผ้าเบรกหน้า Toyota Revo',cat:'ระบบเบรก',cost:850,pa:1500,pb:1350,pc:1200,qty:2,min:4,max:20,lastMove:iso(today),zone:'A',shelf:3,loc:'',warr:3},
    {code:'BR-014',oem:'43512-0K090',name:'จานเบรกหน้า',cat:'ระบบเบรก',cost:1450,pa:2400,pb:2200,pc:2000,qty:4,min:2,max:8,lastMove:iso(today),zone:'A',shelf:3,loc:'',warr:6},
    {code:'CO-402',oem:'16400-0L340',name:'หม้อน้ำ D-Max',cat:'หม้อน้ำ / ระบบระบายความร้อน',cost:3200,pa:5200,pb:4900,pc:4600,qty:2,min:1,max:5,lastMove:iso(old),zone:'D',shelf:1,loc:'',warr:12},
    {code:'CO-410',oem:'16100-0L090',name:'ปั๊มน้ำ',cat:'หม้อน้ำ / ระบบระบายความร้อน',cost:1600,pa:2800,pb:2600,pc:2400,qty:5,min:2,max:8,lastMove:iso(today),zone:'D',shelf:1,loc:'',warr:6},
    {code:'EN-501',oem:'90915-YZZD2',name:'กรองน้ำมันเครื่อง Toyota',cat:'อะไหล่เครื่องยนต์',cost:95,pa:220,pb:190,pc:170,qty:48,min:10,max:40,lastMove:iso(today),zone:'B',shelf:2,loc:'',warr:''},
    {code:'EN-512',oem:'17801-0L040',name:'กรองอากาศ D-Max',cat:'อะไหล่เครื่องยนต์',cost:210,pa:480,pb:430,pc:390,qty:14,min:5,max:25,lastMove:iso(old),zone:'B',shelf:1,loc:'',warr:''},
    {code:'TR-601',oem:'31250-0K021',name:'ชุดคลัตช์ครบชุด',cat:'ระบบส่งกำลัง',cost:4800,pa:7500,pb:7100,pc:6800,qty:1,min:1,max:4,lastMove:iso(lastMo),zone:'E',shelf:1,loc:'',warr:6},
    {code:'BD-701',oem:'53101-0K901',name:'กระจังหน้า Revo',cat:'อะไหล่บอดี้',cost:1900,pa:3200,pb:2950,pc:2750,qty:1,min:1,max:4,lastMove:iso(lastMo),zone:'F',shelf:1,loc:'',warr:''},
    {code:'OI-801',oem:'08880-83112',name:'น้ำมันเครื่องดีเซล 5W-30 (6 ลิตร)',cat:'น้ำมัน / ของเหลว',cost:980,pa:1600,pb:1450,pc:1350,qty:20,min:6,max:30,lastMove:iso(today),zone:'G',shelf:1,loc:'',warr:''},
    {code:'TY-901',oem:'265/65R17',name:'ยาง 265/65R17',cat:'ยาง / ล้อ',cost:3100,pa:4600,pb:4400,pc:4200,qty:8,min:4,max:16,lastMove:iso(today),zone:'H',shelf:1,loc:'ลานยาง',warr:12},
    {code:'CS-950',oem:'-',name:'ไส้กรองดักน้ำมันเชื้อเพลิง',cat:'อะไหล่สิ้นเปลือง',cost:260,pa:520,pb:470,pc:430,qty:18,min:6,max:24,lastMove:iso(today),zone:'B',shelf:3,loc:'',warr:''},
    {code:'CS-961',oem:'-',name:'ใบปัดน้ำฝน 22 นิ้ว',cat:'อะไหล่สิ้นเปลือง',cost:180,pa:420,pb:380,pc:340,qty:30,min:8,max:24,lastMove:iso(today),zone:'B',shelf:3,loc:'',warr:''},
    {code:'MS-980',oem:'-',name:'น็อตล้อ + แหวนรอง (ชุด)',cat:'อะไหล่เบ็ดเตล็ด',cost:45,pa:120,pb:100,pc:90,qty:120,min:30,max:150,lastMove:iso(today),zone:'G',shelf:5,loc:'ลิ้นชัก 1',warr:''},
    {code:'MS-985',oem:'-',name:'สายรัดพลาสติก / คลิปล็อกกันชน',cat:'อะไหล่เบ็ดเตล็ด',cost:12,pa:40,pb:35,pc:30,qty:250,min:50,max:200,lastMove:iso(old),zone:'G',shelf:6,loc:'ลิ้นชัก 2',warr:''},
    {code:'MS-990',oem:'-',name:'กาวซิลิโคนทนความร้อน',cat:'อะไหล่เบ็ดเตล็ด',cost:150,pa:320,pb:290,pc:260,qty:9,min:4,max:15,lastMove:iso(today),zone:'G',shelf:2,loc:'',warr:''},
    {code:'EV-101',oem:'-',name:'สายชาร์จ AC Type 2 (7.4 kW)',cat:'อะไหล่รถไฟฟ้า',cost:4200,pa:6900,pb:6400,pc:6000,qty:3,min:2,max:8,lastMove:iso(today),zone:'A',shelf:5,loc:'',warr:12},
    {code:'EV-110',oem:'-',name:'น้ำยาหล่อเย็นชุดแบตเตอรี่ EV (5 ลิตร)',cat:'อะไหล่รถไฟฟ้า',cost:850,pa:1500,pb:1400,pc:1300,qty:6,min:3,max:12,lastMove:iso(today),zone:'G',shelf:3,loc:'',warr:''},
    {code:'EV-120',oem:'-',name:'ฟิวส์แรงดันสูง 500V ชุดแบตเตอรี่',cat:'อะไหล่รถไฟฟ้า',cost:1250,pa:2200,pb:2000,pc:1850,qty:2,min:2,max:6,lastMove:iso(old),zone:'A',shelf:6,loc:'',warr:6}
  ].map(x=>Object.assign({id:sid(),unit:'ชิ้น'},x));
  const ven=[
    {id:sid(),type:'company',name:'บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด',tax:'0105539001234',days:30,contact:'คุณสมพงษ์',tel:'02-411-2233',tel2:'081-411-2233',
      cash:false,bankName:'ธนาคารกสิกรไทย',bankNo:'111-2-33344-5',bankAcc:'บจก. อะไหล่ยนต์รุ่งเรือง',
      bank:'ธนาคารกสิกรไทย 111-2-33344-5',note:'อะไหล่แท้ ศูนย์บริการ',
      cats:['อะไหล่เครื่องยนต์','อะไหล่ไฟฟ้า','อะไหล่รถไฟฟ้า','ระบบส่งกำลัง','อะไหล่บอดี้'],
      addr:{no:'99/1',village:'',moo:'2',soi:'',road:'เพชรเกษม',sub:'บางแค',dist:'บางแค',prov:'กรุงเทพมหานคร',zip:'10160'}},
    {id:sid(),type:'company',name:'หจก. ไทยพาร์ท ซัพพลาย',tax:'0103545006789',days:15,contact:'คุณมาลี',tel:'02-899-4455',tel2:'',
      cash:false,bankName:'ธนาคารไทยพาณิชย์',bankNo:'222-3-44455-6',bankAcc:'หจก. ไทยพาร์ท ซัพพลาย',
      bank:'ธนาคารไทยพาณิชย์ 222-3-44455-6',note:'ส่งของถึงอู่ทุกวันอังคาร',
      cats:['อะไหล่ช่วงล่าง','ระบบเบรก','อะไหล่แอร์','หม้อน้ำ / ระบบระบายความร้อน','อะไหล่สิ้นเปลือง'],
      addr:{no:'145',village:'',moo:'',soi:'ประชาอุทิศ 33',road:'ประชาอุทิศ',sub:'บางมด',dist:'ทุ่งครุ',prov:'กรุงเทพมหานคร',zip:'10140'}},
    {id:sid(),type:'person',name:'ร้านยางเจริญยนต์',tax:'3100900123456',days:0,contact:'เฮียหมง',tel:'081-777-8899',tel2:'',
      cash:true,bankName:'พร้อมเพย์ / อื่น ๆ',bankNo:'081-777-8899',bankAcc:'นายมงคล เจริญยนต์',
      bank:'พร้อมเพย์ 081-777-8899',note:'รับตั้งศูนย์ถ่วงล้อ · รับเงินสดหน้าร้าน',
      cats:['ยาง / ล้อ','อะไหล่เบ็ดเตล็ด','น้ำมัน / ของเหลว'],
      addr:{no:'56',village:'',moo:'4',soi:'',road:'พระราม 2',sub:'ท่าข้าม',dist:'บางขุนเทียน',prov:'กรุงเทพมหานคร',zip:'10150'}}
  ];
  const cust=[
    {id:sid(),type:'person',tax:'1103700123456',name:'สมชาย ใจดี',company:'',branch:'',tier:'B',
     stars:4,addr:{no:'88/12',village:'หมู่บ้านสวนทอง',moo:'5',soi:'ลาดพร้าว 71',road:'ลาดพร้าว',sub:'สะพานสอง',dist:'วังทองหลาง',prov:'กรุงเทพมหานคร',zip:'10310'},
     tel:'081-234-5678',tel2:'02-123-4567',
     vehicles:[{brand:'Toyota (โตโยต้า)',model:'Hilux Revo 2.4',color:'ขาวมุก',plateL:'1กข',plateN:'4567',plateProv:'กรุงเทพมหานคร',mile:'128500',engine:'2GD-1234567',vin:'MR0FR22G',year:'2562'}]},
    {id:sid(),type:'company',tax:'0105561234567',name:'ฝ่ายจัดซื้อ คุณวราภรณ์',company:'บริษัท ขนส่งไทยรุ่งเรือง จำกัด',branch:'สำนักงานใหญ่',tier:'A',
     stars:5,addr:{no:'199',village:'',moo:'3',soi:'',road:'บางนา-ตราด',sub:'บางเสาธง',dist:'บางเสาธง',prov:'สมุทรปราการ',zip:'10570'},
     tel:'02-750-1234',tel2:'089-999-1111',
     vehicles:[{brand:'Isuzu (อีซูซุ)',model:'D-Max Blue Power',color:'เทา',plateL:'2กค',plateN:'8899',plateProv:'สมุทรปราการ',mile:'215400',engine:'4JK1-889900',vin:'MPATFS85J',year:'2563'},
               {brand:'Isuzu (อีซูซุ)',model:'D-Max Spark',color:'ขาว',plateL:'3กก',plateN:'1122',plateProv:'สมุทรปราการ',mile:'98700',engine:'4JA1-556677',vin:'MPATFR86H',year:'2564'}]},
    {id:sid(),type:'person',tax:'',name:'ปรีชา ทองสุข',company:'',branch:'',tier:'C',
     stars:3,addr:{no:'27',village:'',moo:'8',soi:'',road:'เอกชัย',sub:'บางบอน',dist:'บางบอน',prov:'กรุงเทพมหานคร',zip:'10150'},
     tel:'092-555-4433',tel2:'',
     vehicles:[{brand:'Honda (ฮอนด้า)',model:'City 1.0 Turbo',color:'แดง',plateL:'กจ',plateN:'2244',plateProv:'กรุงเทพมหานคร',mile:'64300',engine:'P10A2-334455',vin:'MRHGM66',year:'2565'}]}
  ];
  DB.stock=st; DB.vendors=ven; DB.cust=cust; DB.purchases=[]; DB.quotes=[]; DB.receipts=[]; DB.moves=[]; DB.seq={};
  DB.billings=[]; DB.invoices=[];   /* ล้างเอกสารที่อ้างใบเสร็จชุดเก่า ไม่ให้ค้างข้ามการโหลดตัวอย่าง */
  DB.crm=[]; DB.curEmp='';
  /* พนักงานตัวอย่างครบทุกตำแหน่ง — สิทธิ์มาจาก presetPerms() ชุดเดียวกับปุ่มในฟอร์มพนักงาน
     สามคนแรกต้องคงลำดับเดิม เพราะเอกสารตัวอย่างด้านล่างอ้างถึง DB.emp[0..2] */
  DB.emp=[
    {id:sid(),code:'EMP001',name:'ศักดิ์ชัย มั่นคง',idcard:'3100500123456',birth:'1978-04-12',age:48,
     edu:'ปวส. ช่างยนต์',hospital:'โรงพยาบาลบางมด',position:'หัวหน้าช่าง',start:'2015-03-01',tel:'081-555-1234',
     salary:25000,ot:3500,bonus:2000,pin:'',note:'ดูแลงานช่างทั้งหมด · อนุมัติใบเสนอราคาและสั่งตัดสต๊อกได้',emg:'คุณสมหญิง (ภรรยา) 089-111-2222',perms:presetPerms('lead')},
    {id:sid(),code:'EMP002',name:'ธนา บัญชีดี',idcard:'1102700456789',birth:'1992-09-05',age:33,
     edu:'ปริญญาตรี การบัญชี',hospital:'โรงพยาบาลจอมทอง',position:'บัญชีการเงิน',start:'2021-06-15',tel:'089-777-4321',
     salary:18000,ot:0,bonus:1500,pin:'',note:'ออกบิล วางบิล เก็บเงิน · อนุมัติใบเสร็จ/ใบกำกับ/วางบิล',emg:'คุณมานะ (บิดา) 081-333-4444',perms:presetPerms('acc')},
    {id:sid(),code:'EMP003',name:'วิชัย ขยันงาน',idcard:'1509900112233',birth:'2000-01-20',age:26,
     edu:'ปวช. ช่างยนต์',hospital:'โรงพยาบาลบางมด',position:'ช่างซ่อมทั่วไป',start:'2024-02-01',tel:'092-444-5566',
     salary:12000,ot:2200,bonus:800,pin:'',note:'ดูใบงานและสต๊อก ไม่เห็นราคา',emg:'',perms:presetPerms('tech')},
    {id:sid(),code:'EMP004',name:'มานะ บริหารเก่ง',idcard:'3101200334455',birth:'1975-11-02',age:50,
     edu:'ปริญญาตรี วิศวกรรมยานยนต์',hospital:'โรงพยาบาลจอมทอง',position:'ผู้จัดการอู่',start:'2012-01-10',tel:'081-900-1122',
     salary:35000,ot:0,bonus:5000,pin:'',note:'ดูแลภาพรวมทั้งอู่ · ทำได้และอนุมัติได้ทุกอย่าง ยกเว้นส่งออก/ล้างข้อมูล',emg:'คุณวันดี (ภรรยา) 089-200-3344',perms:presetPerms('mgr')},
    {id:sid(),code:'EMP005',name:'ฝนทิพย์ ต้อนรับ',idcard:'1103300556677',birth:'1998-03-14',age:28,
     edu:'ปวส. การตลาด',hospital:'โรงพยาบาลบางมด',position:'ธุรการหน้าร้าน',start:'2023-05-02',tel:'092-111-2233',
     salary:16000,ot:0,bonus:1000,pin:'',note:'รับลูกค้า เปิดบิล รับชำระ นัดหมาย · ไม่มีสิทธิอนุมัติ/ยกเลิกเอกสาร',emg:'คุณฝนแก้ว (มารดา) 081-444-5566',perms:presetPerms('front')},
    {id:sid(),code:'EMP006',name:'อนุมัติ ถี่ถ้วน',idcard:'3100800778899',birth:'1980-07-21',age:46,
     edu:'ปริญญาโท บริหารธุรกิจ',hospital:'โรงพยาบาลจอมทอง',position:'หัวหน้าฝ่ายอนุมัติ',start:'2018-09-01',tel:'081-666-7788',
     salary:28000,ot:0,bonus:3000,pin:'',note:'อนุมัติ/ตีกลับเอกสารได้ทุกประเภท แต่ไม่ทำเอกสารเอง',emg:'',perms:presetPerms('apv')},
    {id:sid(),code:'EMP007',name:'สมปอง คลังแน่น',idcard:'1104500990011',birth:'1995-12-08',age:30,
     edu:'ปวส. โลจิสติกส์',hospital:'โรงพยาบาลบางมด',position:'เจ้าหน้าที่คลังอะไหล่',start:'2022-03-01',tel:'092-777-8899',
     salary:16000,ot:1200,bonus:1000,pin:'',note:'จัดการสต๊อกเต็ม · อนุมัติใบรับ/เบิก/นับ/เคลมสินค้า',emg:'',perms:presetPerms('stk')},
    {id:sid(),code:'EMP008',name:'เก็บเงิน แม่นยำ',idcard:'1105600112233',birth:'2001-06-30',age:25,
     edu:'ปวช. การบัญชี',hospital:'โรงพยาบาลบางมด',position:'แคชเชียร์',start:'2025-01-06',tel:'092-333-4455',
     salary:14000,ot:0,bonus:500,pin:'',note:'บันทึกรับชำระจากลูกหนี้อย่างเดียว',emg:'',perms:presetPerms('cash')},
    {id:sid(),code:'EMP009',name:'วิเคราะห์ รอบคอบ',idcard:'3102900445566',birth:'1985-02-17',age:41,
     edu:'ปริญญาตรี การบัญชี (ผู้ตรวจสอบภายใน)',hospital:'โรงพยาบาลจอมทอง',position:'ผู้ตรวจสอบภายใน',start:'2020-11-16',tel:'081-888-9900',
     salary:22000,ot:0,bonus:0,pin:'',note:'เห็นทุกเมนูทุกตัวเลข ทำอะไรไม่ได้ · ใช้ตรวจสอบย้อนหลัง',emg:'',perms:presetPerms('audit')}
  ];
  DB.shop=Object.assign({},DB.shop,{type:'company',vatReg:true,person:'ศักดิ์ชัย มั่นคง',
    company:'หจก.เอกหม้อน้ำ',email:'service@ekmornam.co.th',web:'',
    name:'หจก.เอกหม้อน้ำ',tax:'0105545001234',tel:'02-555-1234, 081-555-1234',
    addr:'123/45 ถ.พระราม 2 แขวงบางมด เขตจอมทอง กรุงเทพมหานคร 10150',branch:'สำนักงานใหญ่',
    bank:'ธนาคารกสิกรไทย 123-4-56789-0',
    banks:[{name:'ธนาคารกสิกรไทย',no:'123-4-56789-0',acc:'หจก.เอกหม้อน้ำ',general:true,vat:false},
           {name:'ธนาคารไทยพาณิชย์',no:'456-7-89012-3',acc:'หจก.เอกหม้อน้ำ',general:false,vat:true},
           {name:'ธนาคารกรุงเทพ',no:'789-0-12345-6',acc:'หจก.เอกหม้อน้ำ',general:true,vat:true}],
    stale:6,warrM:3,
    licStart:iso(new Date(today.getFullYear(),today.getMonth()-10,1)),licEnd:addDays(iso(),52),
    warr:'รับประกันงานซ่อมและอะไหล่ที่เปลี่ยน 3 เดือน หรือ 5,000 กิโลเมตร แล้วแต่อย่างใดถึงก่อน ไม่รวมความเสียหายจากอุบัติเหตุ การใช้งานผิดประเภท หรือการดัดแปลงสภาพรถ'});

  /* ตัวอย่างเอกสาร: ใบซื้อ 2 ใบ · งานค้างส่งมอบ 1 คัน · บิลเครดิตเกินกำหนด 1 ใบ */
  const g1={id:sid(),no:'GR.'+String(today.getFullYear()+543).slice(2)+'-'+String(today.getMonth()+1).padStart(2,'0')+'-01-01',
    date:iso(new Date(today.getFullYear(),today.getMonth(),1)),vendorId:ven[0].id,inv:'IV-6801234',invDate:iso(new Date(today.getFullYear(),today.getMonth(),1)),
    term:'credit',days:30,due:addDays(iso(new Date(today.getFullYear(),today.getMonth(),1)),30),paid:false,payDate:'',by:'ธนา',check:'ศักดิ์ชัย มั่นคง',note:'',
    items:[{stockId:st[0].id,code:st[0].code,oem:st[0].oem,name:st[0].name,cat:st[0].cat,qty:2,cost:4200},
           {stockId:st[6].id,code:st[6].code,oem:st[6].oem,name:st[6].name,cat:st[6].cat,qty:4,cost:850}],
    disc:0,vat:7,posted:true};
  const g2={id:sid(),no:'GR.'+String(today.getFullYear()+543).slice(2)+'-'+String(today.getMonth()+1).padStart(2,'0')+'-05-01',
    date:iso(new Date(today.getFullYear(),today.getMonth(),5)),vendorId:ven[1].id,inv:'TP-2210',invDate:iso(new Date(today.getFullYear(),today.getMonth(),5)),
    term:'cash',days:0,due:iso(new Date(today.getFullYear(),today.getMonth(),5)),paid:true,payDate:iso(new Date(today.getFullYear(),today.getMonth(),5)),
    by:'ธนา',check:'ศักดิ์ชัย มั่นคง',note:'',
    items:[{stockId:st[3].id,code:st[3].code,oem:st[3].oem,name:st[3].name,cat:st[3].cat,qty:20,cost:120}],
    disc:0,vat:7,posted:true};
  DB.purchases=[g1,g2];
  g1.items.concat(g2.items).forEach(it=>logMove(it.stockId,'in',it.qty,g1.date,'รับเข้าจากใบรับสินค้า','ตัวอย่าง'));

  const jobIn=addDays(iso(today),-9);
  const q1={id:sid(),no:'QO.'+String(today.getFullYear()+543).slice(2)+'-'+jobIn.slice(5,7)+'-'+jobIn.slice(8,10)+'-01',
    date:jobIn,jobIn,custId:cust[0].id,vehIdx:0,mile:'128500',
    probs:['เบรกมีเสียงดังตอนเหยียบ','แอร์ไม่ค่อยเย็นช่วงรถติด',''],
    finds:normFinds([{t:'ผ้าเบรกหน้าหมด',new:true},{t:'จานเบรกเป็นร่อง',fix:true,part:true},
      {t:'กรองแอร์อุดตัน',new:true},{t:'น้ำยาแอร์พร่อง ต้องเติมและตรวจรอยรั่ว',fix:true}]),
    tier:'B',items:[
      {type:'part',code:'BR-001',oem:'04465-0K260',name:'ผ้าเบรกหน้า Toyota Revo',qty:1,price:1350,stockId:st[6].id,warr:3},
      {type:'part',code:'BR-014',oem:'43512-0K090',name:'จานเบรกหน้า',qty:2,price:2200,stockId:st[7].id,warr:6},
      {type:'labor',code:'',oem:'',name:'ค่าแรงเปลี่ยนผ้าเบรก + เจียจานเบรก',qty:1,price:800,stockId:'',warr:''}],
    disc:0,vat:7,tech:DB.emp[0].id,techName:DB.emp[0].name,byPos:'หัวหน้าช่าง',byName:'ศักดิ์ชัย มั่นคง',apPos:'เจ้าของรถ',apName:'สมชาย ใจดี',
    status:'อนุมัติซ่อมแล้ว',deducted:true};
  const q2d=addDays(iso(today),-40);
  const q2={id:sid(),no:'QO.'+String(today.getFullYear()+543).slice(2)+'-'+q2d.slice(5,7)+'-'+q2d.slice(8,10)+'-01',
    date:q2d,jobIn:q2d,custId:cust[1].id,vehIdx:0,mile:'215400',
    probs:['เครื่องร้อนจัด ไฟเตือนขึ้น','','' ],
    finds:normFinds([{t:'หม้อน้ำรั่วบริเวณรังผึ้ง',new:true},{t:'ปั๊มน้ำมีเสียงดัง แบริ่งหลวม',new:true},
      {t:'ท่อยางหม้อน้ำเสื่อมสภาพ',part:true},{t:'ล้างระบบระบายความร้อน',fix:true}]),
    tier:'A',items:[
      {type:'part',code:'CO-402',oem:'16400-0L340',name:'หม้อน้ำ D-Max',qty:1,price:5200,stockId:st[8].id,warr:12},
      {type:'part',code:'CO-410',oem:'16100-0L090',name:'ปั๊มน้ำ',qty:1,price:2800,stockId:st[9].id,warr:6},
      {type:'labor',code:'',oem:'',name:'ค่าแรงถอด-ประกอบระบบระบายความร้อน',qty:1,price:1500,stockId:'',warr:''}],
    disc:0,vat:7,tech:DB.emp[0].id,techName:DB.emp[0].name,byPos:'หัวหน้าช่าง',byName:'ศักดิ์ชัย มั่นคง',apPos:'ผู้จัดการฝ่ายจัดซื้อ',apName:'วราภรณ์ สุขใจ',
    status:'ส่งมอบรถ / ออกใบเสร็จแล้ว',deducted:true};
  DB.quotes=[q2,q1];
  const rd=addDays(q2d,2);
  const r1={id:sid(),no:'RE.'+String(today.getFullYear()+543).slice(2)+'-'+rd.slice(5,7)+'-'+rd.slice(8,10)+'-01',
    taxNo:'RT.'+String(today.getFullYear()+543).slice(2)+'-'+rd.slice(5,7)+'-'+rd.slice(8,10)+'-01',issueTax:true,
    date:rd,quoteId:q2.id,ref:q2.no,custId:cust[1].id,vehIdx:0,
    items:JSON.parse(JSON.stringify(q2.items)),disc:0,vat:7,wht:3,whtBase:'labor',
    tech1:DB.emp[0].id,tech1Name:DB.emp[0].name,tech2:'',tech2Name:'',
    warr:DB.shop.warr,pay:{cash:false,trans:false,credit:true,card:false,days:30,due:addDays(rd,30),bank:'',when:'',cardBank:'',card4:'',cardPct:0,cardRef:''},
    paid:false,paidDate:'',by:'ธนา บัญชี',note:'วางบิลทุกวันที่ 25'};
  const q3d=addDays(iso(today),-10);
  const q3={id:sid(),no:'QO.'+String(today.getFullYear()+543).slice(2)+'-'+q3d.slice(5,7)+'-'+q3d.slice(8,10)+'-02',
    date:q3d,jobIn:q3d,custId:cust[2].id,vehIdx:0,mile:'64300',
    probs:['ถึงระยะเปลี่ยนถ่ายน้ำมันเครื่อง','แอร์มีกลิ่นอับ',''],
    finds:normFinds([{t:'ครบระยะเปลี่ยนถ่ายน้ำมันเครื่อง 10,000 กม.',new:true},
      {t:'กรองแอร์สกปรก มีกลิ่นอับ',new:true},{t:'ใบปัดน้ำฝนแข็ง ปัดไม่สะอาด',new:true},
      {t:'ตรวจเช็กระดับของเหลวและลมยาง',fix:true}]),
    tier:'C',items:[
      {type:'part',code:'OI-801',oem:'08880-83112',name:'น้ำมันเครื่องดีเซล 5W-30 (6 ลิตร)',qty:1,price:1350,stockId:st[14].id,warr:''},
      {type:'part',code:'EN-501',oem:'90915-YZZD2',name:'กรองน้ำมันเครื่อง Toyota',qty:1,price:170,stockId:st[10].id,warr:''},
      {type:'part',code:'AC-215',oem:'87139-0K030',name:'กรองแอร์ในห้องโดยสาร',qty:1,price:260,stockId:st[3].id,warr:''},
      {type:'part',code:'CS-961',oem:'-',name:'ใบปัดน้ำฝน 22 นิ้ว',qty:2,price:340,stockId:st[17].id,warr:''},
      {type:'labor',code:'',oem:'',name:'ค่าแรงเปลี่ยนถ่ายน้ำมันเครื่องและตรวจเช็กระยะ',qty:1,price:500,stockId:'',warr:''}],
    disc:0,vat:7,tech:DB.emp[0].id,techName:DB.emp[0].name,byPos:'หัวหน้าช่าง',byName:'ศักดิ์ชัย มั่นคง',apPos:'เจ้าของรถ',apName:'ปรีชา ทองสุข',
    status:'ส่งมอบรถ / ออกใบเสร็จแล้ว',deducted:true};
  DB.quotes.push(q3);
  const r2d=addDays(iso(today),-9);
  const r2={id:sid(),no:'RE.'+String(today.getFullYear()+543).slice(2)+'-'+r2d.slice(5,7)+'-'+r2d.slice(8,10)+'-01',
    taxNo:'RT.'+String(today.getFullYear()+543).slice(2)+'-'+r2d.slice(5,7)+'-'+r2d.slice(8,10)+'-01',issueTax:true,
    date:r2d,quoteId:q3.id,ref:q3.no,custId:cust[2].id,vehIdx:0,
    items:JSON.parse(JSON.stringify(q3.items)),disc:0,vat:7,wht:0,whtBase:'labor',
    warr:'รับประกันงานเปลี่ยนถ่ายน้ำมันเครื่อง 3 เดือน หรือ 5,000 กิโลเมตร',
    tech1:DB.emp[0].id,tech1Name:DB.emp[0].name,tech2:'',tech2Name:'',
    pay:{cash:true,trans:false,credit:false,card:false,days:0,due:r2d,bank:'',when:'',cardBank:'',card4:'',cardPct:0,cardRef:''},
    paid:true,paidDate:r2d,by:'ธนา บัญชีดี',note:''};

  /* ตัวอย่างใบเสร็จขายหน้าร้าน (ไม่ผ่านใบเสนอราคา) จ่ายแบ่ง 2 ส่วน เงินสด+บัตรเครดิต */
  const r3d=addDays(iso(today),-3);
  const r3={id:sid(),no:'RE.'+String(today.getFullYear()+543).slice(2)+'-'+r3d.slice(5,7)+'-'+r3d.slice(8,10)+'-02',
    taxNo:'',issueTax:false,date:r3d,quoteId:'',ref:'',custId:cust[0].id,vehIdx:0,
    items:[{type:'part',code:st[15].code,oem:st[15].oem,name:st[15].name,qty:1,price:3000,stockId:st[15].id,warr:12},
           {type:'labor',code:'',oem:'',name:'ค่าแรงเปลี่ยนยางและถ่วงล้อ',qty:1,price:200,stockId:'',warr:''}],
    disc:0,vat:0,wht:0,whtBase:'labor',warr:'',
    tech1:DB.emp[2].id,tech1Name:DB.emp[2].name,tech2:'',tech2Name:'',
    pay:{cash:true,trans:false,credit:false,card:true,days:0,due:r3d,bank:'',when:'',cardBank:'ธนาคารกสิกรไทย',card4:'4521',cardPct:3,cardRef:'AP778812',cashAmt:3000,transAmt:0,cardAmt:200},
    paid:true,paidDate:r3d,by:'วิชัย ขยันงาน',note:'ลูกค้าซื้อยางอะไหล่หน้าร้าน ไม่ผ่านใบเสนอราคา · จ่ายเงินสด 3,000 + บัตรเครดิต 200 บาท',
    deducted:true};
  st[15].qty=n(st[15].qty)-1; st[15].lastMove=r3d;
  logMove(st[15].id,'out',-1,r3d,'ขายหน้าร้าน (ใบเสร็จ)',r3.no);

  /* ตัวอย่างใบกำกับภาษีที่ถูกยกเลิก (ออกชื่อผู้ซื้อผิด ต้องออกใหม่) */
  const r4d=addDays(iso(today),-6);
  const r4={id:sid(),no:'RE.'+String(today.getFullYear()+543).slice(2)+'-'+r4d.slice(5,7)+'-'+r4d.slice(8,10)+'-04',
    taxNo:'RT.'+String(today.getFullYear()+543).slice(2)+'-'+r4d.slice(5,7)+'-'+r4d.slice(8,10)+'-02',issueTax:true,
    date:r4d,quoteId:'',ref:'',custId:cust[1].id,vehIdx:0,
    items:[{type:'labor',code:'',oem:'',name:'ค่าแรงตรวจเช็กสภาพทั่วไป',qty:1,price:500,stockId:'',warr:''}],
    disc:0,vat:7,wht:0,whtBase:'labor',warr:'',
    tech1:DB.emp[0].id,tech1Name:DB.emp[0].name,tech2:'',tech2Name:'',
    pay:{cash:true,trans:false,credit:false,card:false,days:0,due:r4d,bank:'',when:'',cardBank:'',card4:'',cardPct:0,cardRef:'',cashAmt:535,transAmt:0,cardAmt:0},
    paid:true,paidDate:r4d,by:'ธนา บัญชีดี',note:'',
    taxCancelled:true,taxCancelReason:'ออกชื่อผู้ซื้อผิด ลูกค้าขอให้ออกใบกำกับภาษีใหม่',taxCancelDate:addDays(r4d,1)};
  DB.receipts=[r1,r2,r3,r4];

  /* ══ ตัวอย่างลูกหนี้ค้างรับ 10 ใบ + เจ้าหนี้ค้างจ่าย 10 ใบ (หลายราย)
     สำหรับทดลองปุ่ม "ชำระเงิน" ในหัวข้อ 08 — คละใบเกินกำหนด / ยังไม่ถึงกำหนด
     และมีใบที่รับ/จ่ายบางส่วนไปแล้ว เพื่อทดสอบยอด "ชำระแล้ว / คงค้าง" ══ */
  const yb=String(today.getFullYear()+543).slice(2);
  const mkRe=(i,daysAgo,ci,labor,part,creditDays,partial)=>{
    const d=addDays(iso(today),-daysAgo);
    const r={id:sid(),no:'RE.'+yb+'-'+d.slice(5,7)+'-'+d.slice(8,10)+'-'+String(20+i),taxNo:'',issueTax:false,
      date:d,quoteId:'',ref:'',custId:cust[ci].id,vehIdx:0,
      items:[].concat(part?[{type:'part',code:'',oem:'',name:'อะไหล่ตามใบสั่งซ่อม',qty:1,price:part,stockId:'',warr:''}]:[])
        .concat([{type:'labor',code:'',oem:'',name:'ค่าแรงซ่อมตามใบสั่งซ่อม',qty:1,price:labor,stockId:'',warr:''}]),
      disc:0,vat:7,wht:0,whtBase:'labor',warr:'',
      tech1:DB.emp[0].id,tech1Name:DB.emp[0].name,tech2:'',tech2Name:'',
      pay:{cash:false,trans:false,credit:true,card:false,days:creditDays,due:addDays(d,creditDays),bank:'',when:'',cardBank:'',card4:'',cardPct:0,cardRef:''},
      paid:false,paidDate:'',by:'ฝนทิพย์ ต้อนรับ',note:'ขายเชื่อ เครดิต '+creditDays+' วัน',deducted:true};
    if(partial) r.payments=[{id:sid(),date:addDays(d,5),amt:partial,method:'trans',
      bank:'ธนาคารกสิกรไทย 123-4-56789-0',ref:'TR-DEMO-'+String(20+i),card4:'',chkDate:'',by:'ธนา บัญชีดี',note:'รับชำระงวดแรก'}];
    return r;
  };
  DB.receipts.push(
    mkRe(1,55,0,2500,6000,30,3000),   /* สมชาย — เกินกำหนดนาน · รับงวดแรกแล้ว 3,000 */
    mkRe(2,48,1,4500,18000,45,0),     /* ขนส่งไทยฯ — เพิ่งเกินกำหนด */
    mkRe(3,41,1,3000,9500,30,5000),   /* ขนส่งไทยฯ — เกินกำหนด · รับแล้ว 5,000 */
    mkRe(4,34,2,1500,2400,15,0),      /* ปรีชา — เกินกำหนด */
    mkRe(5,27,0,2000,0,30,0),         /* สมชาย — ใกล้ครบกำหนด */
    mkRe(6,21,1,5500,22000,30,0),     /* ขนส่งไทยฯ — ยังไม่ถึงกำหนด */
    mkRe(7,14,2,1200,3800,15,0),      /* ปรีชา — ครบกำหนดพรุ่งนี้ */
    mkRe(8,12,0,800,2600,30,0),       /* สมชาย — ยังไม่ถึงกำหนด */
    mkRe(9,7,1,3500,12500,15,4000),   /* ขนส่งไทยฯ — รับแล้ว 4,000 */
    mkRe(10,2,2,600,1800,7,0));      /* ปรีชา — ใบใหม่ */

  const ven4={id:sid(),type:'person',name:'ร้านน้ำมันหล่อลื่นทองแสง',tax:'3101800445566',days:7,contact:'คุณทองแสง',tel:'081-222-3344',tel2:'',
    cash:false,bankName:'ธนาคารกรุงไทย',bankNo:'987-6-54321-0',bankAcc:'นายทองแสง ดีงาม',bank:'ธนาคารกรุงไทย 987-6-54321-0',
    note:'ส่งน้ำมันเครื่องทุกต้นเดือน',cats:['น้ำมัน / ของเหลว'],
    addr:{no:'12',village:'',moo:'1',soi:'',road:'สุขสวัสดิ์',sub:'บางปะกอก',dist:'ราษฎร์บูรณะ',prov:'กรุงเทพมหานคร',zip:'10140'}};
  const ven5={id:sid(),type:'company',name:'บริษัท แบตเตอรี่ไทยเพาเวอร์ จำกัด',tax:'0105560098765',days:45,contact:'คุณพลัง',tel:'02-333-9900',tel2:'',
    cash:false,bankName:'ธนาคารกรุงเทพ',bankNo:'333-4-55566-7',bankAcc:'บจก. แบตเตอรี่ไทยเพาเวอร์',bank:'ธนาคารกรุงเทพ 333-4-55566-7',
    note:'เครดิตยาว 45 วัน',cats:['อะไหล่ไฟฟ้า','อะไหล่รถไฟฟ้า'],
    addr:{no:'88',village:'',moo:'6',soi:'',road:'กิ่งแก้ว',sub:'ราชาเทวะ',dist:'บางพลี',prov:'สมุทรปราการ',zip:'10540'}};
  DB.vendors.push(ven4,ven5);
  const vlist=[ven[0],ven[1],ven[2],ven4,ven5];
  const mkGr=(i,daysAgo,vi,cost,creditDays,itemName,partial)=>{
    const d=addDays(iso(today),-daysAgo);
    const g={id:sid(),no:'GR.'+yb+'-'+d.slice(5,7)+'-'+d.slice(8,10)+'-'+String(20+i),
      date:d,vendorId:vlist[vi].id,inv:'INV-'+String(1000+i*17),invDate:d,
      term:'credit',days:creditDays,due:addDays(d,creditDays),paid:false,payDate:'',
      by:'สมปอง คลังแน่น',check:'ศักดิ์ชัย มั่นคง',note:'ตัวอย่างเจ้าหนี้ค้างจ่าย เครดิต '+creditDays+' วัน',
      items:[{stockId:'',code:'',oem:'',name:itemName,cat:'อะไหล่เบ็ดเตล็ด',qty:1,cost:cost}],
      disc:0,vat:7,posted:true};
    if(partial) g.payments=[{id:sid(),date:addDays(d,7),amt:partial,method:'trans',
      bank:'ธนาคารกสิกรไทย 123-4-56789-0',ref:'PO-DEMO-'+String(20+i),card4:'',chkDate:'',by:'ธนา บัญชีดี',note:'จ่ายงวดแรก'}];
    return g;
  };
  DB.purchases.push(
    mkGr(1,60,0,15000,30,'ชุดอะไหล่เครื่องยนต์ตามใบสั่งซื้อ',5000),  /* อะไหล่ยนต์รุ่งเรือง — เกินกำหนดนาน · จ่ายแล้ว 5,000 */
    mkGr(2,52,1,8200,15,'ชุดผ้าเบรกและจานเบรก',0),                  /* ไทยพาร์ท — เกินกำหนด */
    mkGr(3,45,3,4600,7,'น้ำมันเครื่องรวม 12 ถัง',0),                 /* ทองแสง — เกินกำหนด */
    mkGr(4,38,4,26500,45,'แบตเตอรี่ 75Ah จำนวน 10 ลูก',10000),      /* แบตเตอรี่ไทยเพาเวอร์ — จ่ายแล้ว 10,000 */
    mkGr(5,31,2,9800,0,'ยางรถกระบะ 4 เส้น',0),                      /* ร้านยาง — เงินสดค้างจ่าย เกินกำหนด */
    mkGr(6,24,0,12400,30,'คอมเพรสเซอร์แอร์และอะไหล่แอร์',0),        /* อะไหล่ยนต์รุ่งเรือง — ใกล้ครบกำหนด */
    mkGr(7,18,1,3300,15,'อะไหล่ช่วงล่างคละรายการ',0),               /* ไทยพาร์ท — เกินกำหนด 3 วัน */
    mkGr(8,10,3,2800,7,'น้ำยาหล่อเย็นและของเหลว',0),                /* ทองแสง — เกินกำหนด 3 วัน */
    mkGr(9,6,4,18900,45,'สายชาร์จรถไฟฟ้า 3 ชุด',0),                 /* แบตเตอรี่ไทยเพาเวอร์ — ยังไม่ถึงกำหนด */
    mkGr(10,3,2,5200,0,'ยางและอุปกรณ์ถ่วงล้อ',0));                  /* ร้านยาง — ใบใหม่ */

  const wd=new Date(rd+'T00:00:00'); wd.setMonth(wd.getMonth()+3);
  const m1=iso(new Date(today.getFullYear(),today.getMonth(),3)), m2=iso(new Date(today.getFullYear(),today.getMonth(),8));
  const yy=String(today.getFullYear()+543).slice(2);
  DB.expenses=[
    {id:sid(),no:'EX.'+yy+'-'+m1.slice(5,7)+'-03-01',date:m1,cat:'ค่าเช่าสถานที่',
     desc:'ค่าเช่าอาคารอู่ประจำเดือน',payee:'คุณสุนทร เจ้าของอาคาร',tax:'3101200456789',inv:'',base:25000,vat:0,wht:5,
     method:'เงินโอน',paid:true,note:''},
    {id:sid(),no:'EX.'+yy+'-'+m1.slice(5,7)+'-03-02',date:m1,cat:'ค่าไฟฟ้า',
     desc:'ค่าไฟฟ้าประจำเดือน',payee:'การไฟฟ้านครหลวง',tax:'0994000165676',inv:'MEA-2569',base:8400,vat:7,wht:0,
     method:'เงินโอน',paid:true,note:''},
    {id:sid(),no:'EX.'+yy+'-'+m2.slice(5,7)+'-08-01',date:m2,cat:'ค่าโทรศัพท์และอินเทอร์เน็ต',
     desc:'อินเทอร์เน็ตและโทรศัพท์สำนักงาน',payee:'บมจ. ทรู คอร์ปอเรชั่น',tax:'0107536000081',inv:'TRUE-88123',base:1200,vat:7,wht:0,
     method:'เงินโอน',paid:true,note:''},
    {id:sid(),no:'EX.'+yy+'-'+m2.slice(5,7)+'-08-02',date:m2,cat:'ค่าบริการวิชาชีพ (บัญชี / กฎหมาย)',
     desc:'ค่าทำบัญชีและยื่นภาษีรายเดือน',payee:'สำนักงานบัญชีเลิศพัฒนา',tax:'0105551234567',inv:'AC-0725',base:3500,vat:7,wht:3,
     method:'เงินโอน',paid:false,note:'วางบิลทุกสิ้นเดือน'}
  ];
  DB.assets=[
    {id:sid(),no:'FA.'+yy+'-01-05-01',date:iso(new Date(today.getFullYear()-2,0,5)),
     name:'ลิฟต์ยกรถ 2 เสา 4 ตัน',cat:'เครื่องจักรและอุปกรณ์โรงงาน',vendor:'บริษัท ไทยลิฟต์ เอ็นจิเนียริ่ง จำกัด',
     inv:'TL-1201',cost:185000,vat:7,life:5,salvage:1,method:'sl',status:'use',out:'',note:'ติดตั้งช่องซ่อมที่ 1'},
    {id:sid(),no:'FA.'+yy+'-03-12-01',date:iso(new Date(today.getFullYear()-1,2,12)),
     name:'เครื่องวิเคราะห์กล่อง ECU',cat:'เครื่องมือช่าง',vendor:'ร้านเครื่องมือช่างสมบูรณ์',
     inv:'SB-4410',cost:68000,vat:7,life:5,salvage:1,method:'sl',status:'use',out:'',note:''},
    {id:sid(),no:'FA.'+yy+'-06-01-01',date:iso(new Date(today.getFullYear(),5,1)),
     name:'คอมพิวเตอร์สำนักงานพร้อมเครื่องพิมพ์',cat:'คอมพิวเตอร์และโปรแกรมคอมพิวเตอร์',vendor:'ไอทีซิตี้',
     inv:'IT-9902',cost:32000,vat:7,life:3,salvage:1,method:'sl',status:'use',out:'',note:''}
  ];
  DB.capital=[
    {id:sid(),date:iso(new Date(today.getFullYear()-2,0,2)),type:'invest',amt:800000,note:'เงินลงทุนตั้งต้นของหุ้นส่วน'},
    {id:sid(),date:iso(new Date(today.getFullYear()-1,5,15)),type:'loan',amt:300000,note:'สินเชื่อ SME ธนาคารกสิกรไทย'},
    {id:sid(),date:iso(new Date(today.getFullYear(),2,10)),type:'repay',amt:60000,note:'ผ่อนชำระเงินกู้'},
    {id:sid(),date:iso(new Date(today.getFullYear(),4,20)),type:'draw',amt:50000,note:'ถอนใช้ส่วนตัวของเจ้าของ'}
  ];
  DB.crm=[
    {id:sid(),custId:cust[1].id,vehIdx:0,type:'warranty',date:iso(wd),owner:'ธนา บัญชีดี',
     note:'ครบกำหนดตรวจเช็กตามเงื่อนไขรับประกัน 3 เดือน หลังเปลี่ยนหม้อน้ำและปั๊มน้ำ',refId:r1.id,refNo:r1.no,done:false,openedAt:rd},
    {id:sid(),custId:cust[1].id,vehIdx:1,type:'prospect',date:addDays(iso(today),4),owner:'ธนา บัญชีดี',
     note:'เสนอโปรโมชันเปลี่ยนถ่ายน้ำมันเครื่องรถคันที่สองของบริษัท',refId:'',refNo:'',done:false,openedAt:iso(today)}
  ];
  const m0=iso().slice(0,7);
  DB.hr=[
    {id:sid(),emp:DB.emp[0].id,type:'late',date:m0+'-03',qty:20,end:'',stat:'-',note:'รถติดจากฝนตกหนัก',by:'ธนา บัญชีดี'},
    {id:sid(),emp:DB.emp[2].id,type:'late',date:m0+'-05',qty:35,end:'',stat:'-',note:'ตื่นสาย',by:'ธนา บัญชีดี'},
    {id:sid(),emp:DB.emp[2].id,type:'late',date:m0+'-12',qty:25,end:'',stat:'-',note:'ตื่นสาย',by:'ธนา บัญชีดี'},
    {id:sid(),emp:DB.emp[2].id,type:'absent',date:m0+'-15',qty:1,end:'',stat:'no',note:'ไม่มาทำงานและติดต่อไม่ได้',by:'ศักดิ์ชัย มั่นคง'},
    {id:sid(),emp:DB.emp[1].id,type:'sick',date:m0+'-08',qty:2,end:m0+'-09',stat:'ok',note:'ไข้หวัดใหญ่ มีใบรับรองแพทย์',by:'ธนา บัญชีดี'},
    {id:sid(),emp:DB.emp[0].id,type:'personal',date:m0+'-18',qty:1,end:'',stat:'ok',note:'ธุระที่อำเภอ',by:'ธนา บัญชีดี'},
    {id:sid(),emp:DB.emp[1].id,type:'vacation',date:m0+'-22',qty:2,end:m0+'-23',stat:'wait',note:'พาครอบครัวไปต่างจังหวัด',by:'ธนา บัญชีดี'},
    {id:sid(),emp:DB.emp[0].id,type:'ot',date:m0+'-10',qty:4,end:'',stat:'ok',note:'เร่งงานส่งลูกค้า',by:'ศักดิ์ชัย มั่นคง'}
  ];
  DB.warns=[
    {id:sid(),no:'WN.'+String(today.getFullYear()+543).slice(2)+'-'+m0.slice(5,7)+'-16-01',
     emp:DB.emp[2].id,date:m0+'-16',when:m0+'-15',times:'1',topic:'ขาดงานโดยไม่ลา',
     rule:'ระเบียบการทำงาน ข้อ 5 เรื่องการลาและการหยุดงาน',
     detail:'ไม่มาปฏิบัติงานในวันที่ระบุ โดยไม่ได้แจ้งลาล่วงหน้าและติดต่อไม่ได้ ทำให้งานซ่อมของลูกค้าล่าช้า 1 วัน',
     action:'ตักเตือนเป็นลายลักษณ์อักษร',
     warnTxt:'หากกระทำผิดซ้ำในลักษณะเดียวกันภายใน 1 ปี บริษัทอาจพิจารณาลงโทษสถานหนักขึ้นหรือเลิกจ้างโดยไม่จ่ายค่าชดเชย',
     by:'ศักดิ์ชัย มั่นคง',hr:'ธนา บัญชีดี',witness:'วิชัย ขยันงาน'}
  ];
  const apvOK={status:'approved',by:'',byName:'EMP002 · ธนา บัญชีดี',date:iso(),note:''};
  DB.quotes.forEach(x=>x.apv=JSON.parse(JSON.stringify(apvOK)));
  DB.receipts.forEach(x=>x.apv=JSON.parse(JSON.stringify(apvOK)));
  DB.purchases.forEach(x=>x.apv=JSON.parse(JSON.stringify(apvOK)));

  /* ตัวอย่างใบเสนอราคาที่ยังรออนุมัติ (ทดสอบ popup สร้าง/แก้ไข และการล็อกรายการหลังอนุมัติ) */
  const q4d=addDays(iso(today),-2);
  const q4={id:sid(),no:'QO.'+String(today.getFullYear()+543).slice(2)+'-'+q4d.slice(5,7)+'-'+q4d.slice(8,10)+'-04',
    date:q4d,jobIn:q4d,custId:cust[0].id,vehIdx:0,mile:'129000',
    probs:['มีเสียงดังใต้ท้องรถตอนเข้าโค้ง','',''],
    finds:normFinds([{t:'โช้คอัพหน้าเสื่อมสภาพ มีเสียงดัง',new:true},{t:'ตรวจเช็กช่วงล่างทั้งระบบ',fix:true}]),
    tier:'B',items:[
      {type:'part',code:st[4].code,oem:st[4].oem,name:st[4].name,qty:2,price:2700,stockId:st[4].id,warr:6},
      {type:'labor',code:'',oem:'',name:'ค่าแรงเปลี่ยนโช้คอัพหน้าและตรวจเช็กช่วงล่าง',qty:1,price:600,stockId:'',warr:''}],
    disc:0,vat:7,tech:DB.emp[0].id,techName:DB.emp[0].name,byPos:'หัวหน้าช่าง',byName:'ศักดิ์ชัย มั่นคง',apPos:'',apName:'',
    status:'ร่าง',deducted:false,apv:{status:'pending',byName:'ธนา บัญชีดี',date:q4d,note:''}};
  DB.quotes.push(q4);

  /* ตัวอย่างใบเคลมสินค้าที่ยังรอส่งเคลม (ทดสอบการล็อกรายการหลังตัดสต๊อกส่งเคลม) */
  const cl1d=addDays(iso(today),-1);
  const cl1={id:sid(),no:'CL.'+String(today.getFullYear()+543).slice(2)+'-'+cl1d.slice(5,7)+'-'+cl1d.slice(8,10)+'-01',
    date:cl1d,vendorId:ven[0].id,ref:'',status:'open',
    items:[{stockId:st[0].id,code:st[0].code,name:st[0].name,qty:1,reason:'ไดชาร์จเสีย ชาร์จไฟไม่เข้าตั้งแต่แกะกล่อง'}],
    recv:'',by:'ศักดิ์ชัย มั่นคง',ap:'',note:'รอส่งคืนผู้ขาย',deduct:true,deducted:false,
    apv:{status:'pending',byName:'ธนา บัญชีดี',date:cl1d,note:''}};
  DB.claims=[cl1];

  save(); boot(); go('home'); toast('โหลดข้อมูลตัวอย่างพร้อมเอกสารตัวอย่างแล้ว');
}


/* ==========================================================
   ข้อมูลทดสอบย้อนหลัง 36 เดือน — ยอดขาย 2-5 ล้านบาท/เดือน
   ครอบคลุมทุกเมนู: ลูกค้า/CRM/ใบเสนอราคา/ใบเสร็จ/ใบกำกับภาษี/
   ใบวางบิล/ใบแจ้งหนี้/ผู้ขาย/ใบรับสินค้า/ค่าใช้จ่าย/เงินเดือน/
   สินทรัพย์/เงินทุน/สต๊อก/เคลม/เบิกภายใน/ตรวจนับ/บัญชี/HR/ตรวจสอบย้อนกลับ
   ========================================================== */
function seedDemo36(){
  return guardWholeData({kind:'demo36',act:'demo',note:'โหลดข้อมูลทดสอบ 36 เดือน',
    ask:{title:'โหลดข้อมูลทดสอบ 36 เดือน',text:'โหลดข้อมูลทดสอบ 36 เดือน?\nข้อมูลปัจจุบันจะถูกแทนที่ทั้งหมด',yes:'โหลดข้อมูล',no:'ไม่โหลด'},run:seedDemo36Now});
}
function seedDemo36Now(){
  /* ---------- เครื่องมือสุ่มแบบกำหนดผลได้ (ผลเหมือนเดิมทุกครั้งที่กด) ---------- */
  let _s=20260815;
  const rnd=()=>{_s=(_s*1664525+1013904223)>>>0; return _s/4294967296;};
  const ri=(a,b)=>a+Math.floor(rnd()*(b-a+1));
  const pick=arr=>arr[Math.floor(rnd()*arr.length)];
  const chance=p=>rnd()<p;

  const today=new Date(); today.setHours(0,0,0,0);
  const TODAY=iso(today);
  const sid=()=>uid();
  const be=d=>String((+String(d).slice(0,4))+543).slice(2);
  const seqMap={};
  const dno=(prefix,d)=>{const base=prefix+'.'+be(d)+'-'+d.slice(5,7)+'-'+d.slice(8,10);
    const i=(seqMap[base]||0)+1; seqMap[base]=i; return base+'-'+String(i).padStart(2,'0');};
  const niceP=v=>v>=500?Math.round(v/10)*10:Math.round(v/5)*5;
  const monthStart=k=>new Date(today.getFullYear(),today.getMonth()-k,1);   /* k=35..0 */
  const lastDayOf=(y,m)=>new Date(y,m+1,0).getDate();
  const AP=(name,d)=>({status:'approved',by:'',byName:name,date:d,note:''});
  const NM_ACC='EMP002 · ธนา บัญชีดี', NM_STK='EMP007 · สมปอง คลังแน่น',
        NM_MGR='EMP004 · มานะ บริหารเก่ง', NM_APV='EMP006 · อนุมัติ ถี่ถ้วน',
        NM_FRONT='EMP005 · ฝนทิพย์ ต้อนรับ', NM_LEAD='EMP001 · ศักดิ์ชัย มั่นคง';
  const stamp=(rec,d,who)=>{const ts=d+'T0'+ri(8,9)+':'+String(ri(10,55)).padStart(2,'0')+':00.000Z';
    rec.createdBy=''; rec.createdByName=who; rec.createdAt=ts;
    rec.updatedBy=''; rec.updatedByName=who; rec.updatedAt=ts; return rec;};

  /* ---------- 1) ทะเบียนอะไหล่ 52 รายการ ครบทุกหมวด ---------- */
  /* [code,oem,name,cat,cost,min,max,zone,shelf,warrM] */
  const CATALOG=[
    ['EL-101','27060-0L080','ไดชาร์จ Toyota Revo','อะไหล่ไฟฟ้า',4200,2,8,'A',1,6],
    ['EL-105','28100-0L090','ไดสตาร์ท D-Max','อะไหล่ไฟฟ้า',3600,2,6,'A',1,6],
    ['EL-118','GS-75D26L','แบตเตอรี่ 75Ah','อะไหล่ไฟฟ้า',2350,4,16,'A',2,12],
    ['EL-125','90919-01253','ชุดคอยล์จุดระเบิด','อะไหล่ไฟฟ้า',980,4,12,'A',2,6],
    ['EL-133','81110-0K450','ไฟหน้า LED Revo (ข้าง)','อะไหล่ไฟฟ้า',5400,1,4,'A',4,6],
    ['EV-101','-','สายชาร์จ AC Type 2 (7.4 kW)','อะไหล่รถไฟฟ้า',4200,2,8,'A',5,12],
    ['EV-110','-','น้ำยาหล่อเย็นชุดแบตเตอรี่ EV (5 ลิตร)','อะไหล่รถไฟฟ้า',850,3,12,'G',3,0],
    ['EV-120','-','ฟิวส์แรงดันสูง 500V ชุดแบตเตอรี่','อะไหล่รถไฟฟ้า',1250,2,6,'A',6,6],
    ['EV-130','-','ชุดกรองแอร์ EV พร้อมฟิลเตอร์ PM2.5','อะไหล่รถไฟฟ้า',380,4,16,'B',5,0],
    ['AC-204','88320-0K330','คอมเพรสเซอร์แอร์ D-Max','อะไหล่แอร์',5600,1,4,'B',1,6],
    ['AC-215','87139-0K030','กรองแอร์ในห้องโดยสาร','อะไหล่แอร์',120,10,40,'B',2,0],
    ['AC-222','88460-0K160','แผงคอยล์ร้อน Revo','อะไหล่แอร์',2900,1,4,'B',1,6],
    ['AC-230','R134a-13.6','น้ำยาแอร์ R134a (ถัง 13.6 กก.)','อะไหล่แอร์',1600,2,6,'G',4,0],
    ['SU-330','48510-0K190','โช้คอัพหน้า Hilux','อะไหล่ช่วงล่าง',1750,4,16,'C',1,6],
    ['SU-335','48530-0K080','โช้คอัพหลัง Hilux','อะไหล่ช่วงล่าง',1450,4,16,'C',1,6],
    ['SU-341','48815-0K010','ยางกันโคลงหน้า','อะไหล่ช่วงล่าง',180,8,30,'C',2,0],
    ['SU-350','43330-09510','ลูกหมากปีกนกล่าง','อะไหล่ช่วงล่าง',650,6,20,'C',2,6],
    ['SU-360','48654-0K040','บูชปีกนก (ชุด)','อะไหล่ช่วงล่าง',320,6,24,'C',3,0],
    ['BR-001','04465-0K260','ผ้าเบรกหน้า Toyota Revo','ระบบเบรก',850,6,24,'A',3,3],
    ['BR-005','04466-0K120','ผ้าเบรกหลัง D-Max','ระบบเบรก',780,6,24,'A',3,3],
    ['BR-014','43512-0K090','จานเบรกหน้า','ระบบเบรก',1450,4,12,'A',3,6],
    ['BR-020','47201-0K040','แม่ปั๊มเบรกบน','ระบบเบรก',2200,2,6,'A',4,6],
    ['BR-025','DOT4-1L','น้ำมันเบรก DOT4 (1 ลิตร)','ระบบเบรก',180,8,30,'G',2,0],
    ['CO-402','16400-0L340','หม้อน้ำ D-Max','หม้อน้ำ / ระบบระบายความร้อน',3200,2,6,'D',1,12],
    ['CO-410','16100-0L090','ปั๊มน้ำ','หม้อน้ำ / ระบบระบายความร้อน',1600,3,10,'D',1,6],
    ['CO-415','16571-0L110','ท่อยางหม้อน้ำบน-ล่าง (ชุด)','หม้อน้ำ / ระบบระบายความร้อน',520,4,16,'D',2,0],
    ['CO-420','LLC-5L','น้ำยาหล่อเย็น (5 ลิตร)','หม้อน้ำ / ระบบระบายความร้อน',380,6,24,'G',3,0],
    ['EN-501','90915-YZZD2','กรองน้ำมันเครื่อง Toyota','อะไหล่เครื่องยนต์',95,20,80,'B',2,0],
    ['EN-505','8-98165071-0','กรองน้ำมันเครื่อง Isuzu','อะไหล่เครื่องยนต์',110,20,80,'B',2,0],
    ['EN-512','17801-0L040','กรองอากาศ D-Max','อะไหล่เครื่องยนต์',210,10,40,'B',1,0],
    ['EN-520','13540-0L010','ชุดตั้งโซ่ราวลิ้น','อะไหล่เครื่องยนต์',1850,2,6,'B',4,6],
    ['EN-530','04111-0L050','ชุดปะเก็นเครื่องบน','อะไหล่เครื่องยนต์',3400,1,4,'B',4,6],
    ['EN-540','23670-0L110','หัวฉีดดีเซลคอมมอนเรล','อะไหล่เครื่องยนต์',6800,2,8,'B',6,12],
    ['TR-601','31250-0K021','ชุดคลัตช์ครบชุด','ระบบส่งกำลัง',4800,2,6,'E',1,6],
    ['TR-610','GL5-80W90','น้ำมันเกียร์-เฟืองท้าย 80W-90 (4 ลิตร)','ระบบส่งกำลัง',620,4,16,'G',2,0],
    ['TR-620','41110-0K330','ยอยกากบาทเพลากลาง','ระบบส่งกำลัง',850,3,10,'E',2,6],
    ['BD-701','53101-0K901','กระจังหน้า Revo','อะไหล่บอดี้',1900,1,4,'F',1,0],
    ['BD-710','52119-0K940','กันชนหน้า D-Max','อะไหล่บอดี้',2600,1,4,'F',1,0],
    ['BD-720','87910-0K020','กระจกมองข้างไฟฟ้า (ข้าง)','อะไหล่บอดี้',1450,2,6,'F',2,0],
    ['OI-801','08880-83112','น้ำมันเครื่องดีเซล 5W-30 (6 ลิตร)','น้ำมัน / ของเหลว',980,10,40,'G',1,0],
    ['OI-805','08880-84006','น้ำมันเครื่องเบนซิน 0W-20 (4 ลิตร)','น้ำมัน / ของเหลว',850,6,24,'G',1,0],
    ['TY-901','265/65R17','ยาง 265/65R17','ยาง / ล้อ',3100,8,32,'H',1,12],
    ['TY-905','215/55R17','ยาง 215/55R17','ยาง / ล้อ',2400,4,16,'H',1,12],
    ['TY-910','-','จุ๊บลมยาง TPMS','ยาง / ล้อ',150,8,30,'H',2,0],
    ['CS-950','-','ไส้กรองดักน้ำมันเชื้อเพลิง','อะไหล่สิ้นเปลือง',260,8,30,'B',3,0],
    ['CS-961','-','ใบปัดน้ำฝน 22 นิ้ว','อะไหล่สิ้นเปลือง',180,10,40,'B',3,0],
    ['CS-970','-','หลอดไฟหน้า H4 (คู่)','อะไหล่สิ้นเปลือง',220,8,30,'B',3,0],
    ['MS-980','-','น็อตล้อ + แหวนรอง (ชุด)','อะไหล่เบ็ดเตล็ด',45,30,150,'G',5,0],
    ['MS-985','-','สายรัดพลาสติก / คลิปล็อกกันชน','อะไหล่เบ็ดเตล็ด',12,50,200,'G',6,0],
    ['MS-990','-','กาวซิลิโคนทนความร้อน','อะไหล่เบ็ดเตล็ด',150,4,15,'G',2,0],
    ['MS-995','-','น้ำยาล้างระบบเชื้อเพลิง','อะไหล่เบ็ดเตล็ด',240,4,16,'G',2,0],
    ['OT-999','-','ค่าอะไหล่จัดหาพิเศษนอกสต๊อก','อื่น ๆ',0,0,0,'G',9,0]
  ];
  const st=CATALOG.map(a=>({id:sid(),code:a[0],oem:a[1],name:a[2],cat:a[3],cost:a[4],
    pa:niceP(a[4]*1.75),pb:niceP(a[4]*1.62),pc:niceP(a[4]*1.5),
    qty:0,min:a[5],max:a[6],lastMove:'',zone:a[7],shelf:a[8],loc:'',unit:'ชิ้น',
    warr:a[9]||''}));
  const S={}; st.forEach(x=>S[x.code]=x);
  S['OI-801'].unit='ชุด'; S['AC-230'].unit='ถัง'; S['TY-901'].unit='เส้น'; S['TY-905'].unit='เส้น';

  /* ---------- 2) ผู้ขาย 8 ราย ครอบคลุมทุกหมวด ---------- */
  const mkAddr=(no,moo,soi,road,sub,dist,prov,zip)=>({no,village:'',moo,soi,road,sub,dist,prov,zip});
  const ven=[
    {id:sid(),type:'company',name:'บริษัท อะไหล่ยนต์รุ่งเรือง จำกัด',tax:'0105539001234',days:30,contact:'คุณสมพงษ์',tel:'02-411-2233',tel2:'081-411-2233',cash:false,
     bankName:'ธนาคารกสิกรไทย',bankNo:'111-2-33344-5',bankAcc:'บจก. อะไหล่ยนต์รุ่งเรือง',bank:'ธนาคารกสิกรไทย 111-2-33344-5',
     note:'อะไหล่แท้ ศูนย์บริการ · เครดิต 30 วัน',cats:['อะไหล่เครื่องยนต์','ระบบส่งกำลัง','อะไหล่บอดี้'],
     addr:mkAddr('99/1','2','','เพชรเกษม','บางแค','บางแค','กรุงเทพมหานคร','10160')},
    {id:sid(),type:'company',name:'หจก. ไทยพาร์ท ซัพพลาย',tax:'0103545006789',days:15,contact:'คุณมาลี',tel:'02-899-4455',tel2:'',cash:false,
     bankName:'ธนาคารไทยพาณิชย์',bankNo:'222-3-44455-6',bankAcc:'หจก. ไทยพาร์ท ซัพพลาย',bank:'ธนาคารไทยพาณิชย์ 222-3-44455-6',
     note:'ส่งของถึงอู่ทุกวันอังคาร',cats:['อะไหล่ช่วงล่าง','ระบบเบรก'],
     addr:mkAddr('145','','ประชาอุทิศ 33','ประชาอุทิศ','บางมด','ทุ่งครุ','กรุงเทพมหานคร','10140')},
    {id:sid(),type:'company',name:'บริษัท เย็นสบายแอร์พาร์ท จำกัด',tax:'0105552013456',days:30,contact:'คุณเย็นจิต',tel:'02-742-8899',tel2:'',cash:false,
     bankName:'ธนาคารกรุงศรีอยุธยา',bankNo:'444-1-22233-9',bankAcc:'บจก. เย็นสบายแอร์พาร์ท',bank:'ธนาคารกรุงศรีอยุธยา 444-1-22233-9',
     note:'อะไหล่แอร์และระบบระบายความร้อน',cats:['อะไหล่แอร์','หม้อน้ำ / ระบบระบายความร้อน'],
     addr:mkAddr('301','','','ศรีนครินทร์','หนองบอน','ประเวศ','กรุงเทพมหานคร','10250')},
    {id:sid(),type:'person',name:'ร้านยางเจริญยนต์',tax:'3100900123456',days:0,contact:'เฮียหมง',tel:'081-777-8899',tel2:'',cash:true,
     bankName:'พร้อมเพย์ / อื่น ๆ',bankNo:'081-777-8899',bankAcc:'นายมงคล เจริญยนต์',bank:'พร้อมเพย์ 081-777-8899',
     note:'รับตั้งศูนย์ถ่วงล้อ · รับเงินสดหน้าร้าน',cats:['ยาง / ล้อ'],
     addr:mkAddr('56','4','','พระราม 2','ท่าข้าม','บางขุนเทียน','กรุงเทพมหานคร','10150')},
    {id:sid(),type:'person',name:'ร้านน้ำมันหล่อลื่นทองแสง',tax:'3101800445566',days:7,contact:'คุณทองแสง',tel:'081-222-3344',tel2:'',cash:false,
     bankName:'ธนาคารกรุงไทย',bankNo:'987-6-54321-0',bankAcc:'นายทองแสง ดีงาม',bank:'ธนาคารกรุงไทย 987-6-54321-0',
     note:'ส่งน้ำมันเครื่องทุกต้นเดือน',cats:['น้ำมัน / ของเหลว'],
     addr:mkAddr('12','1','','สุขสวัสดิ์','บางปะกอก','ราษฎร์บูรณะ','กรุงเทพมหานคร','10140')},
    {id:sid(),type:'company',name:'บริษัท แบตเตอรี่ไทยเพาเวอร์ จำกัด',tax:'0105560098765',days:45,contact:'คุณพลัง',tel:'02-333-9900',tel2:'',cash:false,
     bankName:'ธนาคารกรุงเทพ',bankNo:'333-4-55566-7',bankAcc:'บจก. แบตเตอรี่ไทยเพาเวอร์',bank:'ธนาคารกรุงเทพ 333-4-55566-7',
     note:'เครดิตยาว 45 วัน · อะไหล่ไฟฟ้าและ EV',cats:['อะไหล่ไฟฟ้า','อะไหล่รถไฟฟ้า'],
     addr:mkAddr('88','6','','กิ่งแก้ว','ราชาเทวะ','บางพลี','สมุทรปราการ','10540')},
    {id:sid(),type:'company',name:'หจก. สยามคอนซูมเมเบิล',tax:'0103558011223',days:15,contact:'คุณสมร',tel:'02-415-6677',tel2:'',cash:false,
     bankName:'ธนาคารทหารไทยธนชาต',bankNo:'555-2-33444-8',bankAcc:'หจก. สยามคอนซูมเมเบิล',bank:'ธนาคารทหารไทยธนชาต 555-2-33444-8',
     note:'ของสิ้นเปลืองและเบ็ดเตล็ด สั่งขั้นต่ำ 2,000 บาท',cats:['อะไหล่สิ้นเปลือง','อะไหล่เบ็ดเตล็ด','อื่น ๆ'],
     addr:mkAddr('220/5','','เอกชัย 30','เอกชัย','บางขุนเทียน','จอมทอง','กรุงเทพมหานคร','10150')},
    {id:sid(),type:'company',name:'บริษัท ออโต้พาร์ทดีโป้ จำกัด (มหาชน)',tax:'0107561000456',days:30,contact:'คุณดนัย',tel:'02-105-3344',tel2:'',cash:false,
     bankName:'ธนาคารกสิกรไทย',bankNo:'777-1-88899-2',bankAcc:'บมจ. ออโต้พาร์ทดีโป้',bank:'ธนาคารกสิกรไทย 777-1-88899-2',
     note:'สั่งออนไลน์ ส่งภายใน 24 ชม.',cats:['อะไหล่บอดี้','อะไหล่ไฟฟ้า','ระบบเบรก'],
     addr:mkAddr('1888','','','บางนา-ตราด กม.4','บางนา','บางนา','กรุงเทพมหานคร','10260')}
  ];
  const venOfCat=c=>{const v=ven.find(x=>x.cats.includes(c)); return v||ven[6];};

  /* ---------- 3) ลูกค้า 30 ราย: กองรถ 6 · SME 8 · บุคคล 16 ---------- */
  const PROV=['กรุงเทพมหานคร','สมุทรปราการ','สมุทรสาคร','นนทบุรี','ปทุมธานี'];
  const pkL=['1กข','2กค','3กก','4ขค','กจ','ขน','ฆด','งจ','ฐบ','ธร','บม','ผก','1ขฆ','2ขจ','ษร','ฮอ'];
  let pkSeq=1000;
  const mkVeh=(brand,model,color,mile,year)=>({brand,model,color,plateL:pick(pkL),plateN:String(pkSeq+=ri(7,97)),
    plateProv:pick(PROV),mile:String(mile),engine:pick(['2GD','4JK1','1GD','4N15','YS2E'])+'-'+ri(100000,999999),
    vin:'MR0'+String(ri(100000,999999)),year:String(year)});
  const TRUCKS=[['Isuzu (อีซูซุ)','D-Max Blue Power'],['Toyota (โตโยต้า)','Hilux Revo 2.4'],['Isuzu (อีซูซุ)','ELF NLR130'],
    ['Hino (ฮีโน่)','300 Series'],['Mitsubishi (มิตซูบิชิ)','Triton 2.4'],['Ford (ฟอร์ด)','Ranger 2.0 Bi-Turbo']];
  const CARS=[['Honda (ฮอนด้า)','City 1.0 Turbo'],['Toyota (โตโยต้า)','Yaris Ativ'],['Mazda (มาสด้า)','Mazda2 1.3'],
    ['Honda (ฮอนด้า)','Civic e:HEV'],['Toyota (โตโยต้า)','Corolla Cross'],['Nissan (นิสสัน)','Almera 1.0'],
    ['MG (เอ็มจี)','ZS 1.5'],['Suzuki (ซูซูกิ)','Swift GLX']];
  const EVS=[['BYD (บีวายดี)','Atto 3'],['MG (เอ็มจี)','MG4 Electric'],['Neta (เนต้า)','Neta V-II'],['Ora (โอร่า)','Good Cat']];
  const COLORS=['ขาวมุก','เทา','ดำ','แดง','ขาว','เงิน','น้ำเงิน','บรอนซ์ทอง'];
  const cust=[];
  const FLEETS=[
    ['บริษัท ขนส่งไทยรุ่งเรือง จำกัด','ฝ่ายจัดซื้อ คุณวราภรณ์','0105561234567','A',5,6],
    ['บริษัท โลจิสติกส์สยามด่วน จำกัด','คุณอำนาจ (ผจก.ซ่อมบำรุง)','0105558044321','A',5,5],
    ['หจก. บางมดขนส่ง','คุณสมบัติ','0103549007788','A',4,4],
    ['บริษัท ผักสดเดลิเวอรี่ จำกัด','คุณเจริญ','0105563112233','B',4,4],
    ['บริษัท ก่อสร้างพระราม 2 จำกัด','คุณช่างใหญ่วีระ','0105550990011','B',4,3],
    ['สหกรณ์แท็กซี่บางขุนเทียน','คุณประธานหมัด','0993000445566','B',3,4]
  ];
  FLEETS.forEach((f,i)=>{
    const vehicles=[]; for(let v=0;v<f[5];v++){const t=pick(TRUCKS);
      vehicles.push(mkVeh(t[0],t[1],pick(COLORS),ri(80000,260000),2560+ri(0,7)));}
    cust.push({id:sid(),type:'company',tax:f[2],name:f[1],company:f[0],branch:'สำนักงานใหญ่',tier:f[3],stars:f[4],
      addr:mkAddr(String(ri(1,299)),String(ri(1,9)),'',pick(['บางนา-ตราด','พระราม 2','สุขสวัสดิ์','เอกชัย','กาญจนาภิเษก']),'บางเสาธง','บางเสาธง',pick(PROV),'105'+ri(10,70)),
      tel:'02-'+ri(400,899)+'-'+ri(1000,9999),tel2:'08'+ri(1,9)+'-'+ri(100,999)+'-'+ri(1000,9999),vehicles});
  });
  const SMES=[
    ['ร้านวัสดุก่อสร้างเจริญชัย','คุณเจริญชัย','B'],['บริษัท เบเกอรี่หอมกรุ่น จำกัด','คุณขนมปัง','B'],
    ['คลินิกสัตวแพทย์บางมด','หมอโต้ง','C'],['ร้านกาแฟริมคลอง','คุณกานดา','C'],
    ['หจก. ประปาไทยบริการ','คุณประปา','B'],['โรงเรียนกวดวิชาปัญญาเลิศ','อ.ปัญญา','C'],
    ['บริษัท รักษาความปลอดภัยเข้มแข็ง จำกัด','คุณเข้ม','B'],['ร้านซักรีดสะอาดใส','คุณสะอาด','C']];
  SMES.forEach((f,i)=>{
    const nveh=chance(.5)?2:1, vehicles=[];
    for(let v=0;v<nveh;v++){const t=chance(.6)?pick(TRUCKS):pick(CARS);
      vehicles.push(mkVeh(t[0],t[1],pick(COLORS),ri(40000,180000),2560+ri(2,8)));}
    cust.push({id:sid(),type:'company',tax:'01055'+ri(50,69)+String(ri(100000,999999)),name:f[1],company:f[0],branch:'สำนักงานใหญ่',
      tier:f[2],stars:ri(3,5),addr:mkAddr(String(ri(1,299)),'','',pick(['ลาดพร้าว','เอกชัย','พระราม 2','สุขสวัสดิ์','ประชาอุทิศ']),'บางมด','จอมทอง','กรุงเทพมหานคร','10150'),
      tel:'02-'+ri(400,899)+'-'+ri(1000,9999),tel2:'',vehicles});
  });
  const FIRST=['สมชาย','ปรีชา','วิภา','อนงค์','ธีรพล','กมล','ศรีสุดา','ประเสริฐ','จินตนา','อาทิตย์','นภาพร','เกรียงไกร','สุนีย์','บุญมี','อรทัย','ชูชาติ'];
  const LAST=['ใจดี','ทองสุข','ศรีสมบูรณ์','แก้วใส','พูลสวัสดิ์','เจริญพร','มั่งมี','สุขเกษม','วงศ์ใหญ่','รักไทย','บุญรอด','ประดิษฐ์','ทวีทรัพย์','แสงทอง','คำมูล','อินทร์จันทร์'];
  FIRST.forEach((fn,i)=>{
    const isEV=i<3, t=isEV?EVS[i%EVS.length]:(chance(.35)?pick(TRUCKS):pick(CARS));
    cust.push({id:sid(),type:'person',tax:chance(.4)?('110'+ri(1,9)+'700'+ri(100000,999999)):'',
      name:fn+' '+LAST[i],company:'',branch:'',tier:chance(.3)?'B':'C',stars:ri(2,5),
      addr:mkAddr(String(ri(1,299)),String(ri(0,9)||''),'',pick(['ลาดพร้าว 71','เอกชัย','พระราม 2','สุขสวัสดิ์ 26','ประชาอุทิศ 33']),'บางมด','จอมทอง','กรุงเทพมหานคร','10150'),
      tel:'08'+ri(1,9)+'-'+ri(100,999)+'-'+ri(1000,9999),tel2:'',
      vehicles:[mkVeh(t[0],t[1],pick(COLORS),ri(15000,150000),2562+ri(0,6))]});
  });
  const fleets=cust.slice(0,6), smes=cust.slice(6,14), persons=cust.slice(14);

  /* ---------- 4) พนักงาน 11 คน (3 คนแรกคงลำดับเดิม) ---------- */
  const emp=[
    {id:sid(),code:'EMP001',name:'ศักดิ์ชัย มั่นคง',idcard:'3100500123456',birth:'1978-04-12',age:48,edu:'ปวส. ช่างยนต์',hospital:'โรงพยาบาลบางมด',position:'หัวหน้าช่าง',start:'2015-03-01',tel:'081-555-1234',salary:25000,ot:3500,bonus:2000,pin:'',note:'ดูแลงานช่างทั้งหมด · อนุมัติใบเสนอราคาและสั่งตัดสต๊อกได้',emg:'คุณสมหญิง (ภรรยา) 089-111-2222',perms:presetPerms('lead')},
    {id:sid(),code:'EMP002',name:'ธนา บัญชีดี',idcard:'1102700456789',birth:'1992-09-05',age:33,edu:'ปริญญาตรี การบัญชี',hospital:'โรงพยาบาลจอมทอง',position:'บัญชีการเงิน',start:'2021-06-15',tel:'089-777-4321',salary:18000,ot:0,bonus:1500,pin:'',note:'ออกบิล วางบิล เก็บเงิน · อนุมัติใบเสร็จ/ใบกำกับ/วางบิล',emg:'คุณมานะ (บิดา) 081-333-4444',perms:presetPerms('acc')},
    {id:sid(),code:'EMP003',name:'วิชัย ขยันงาน',idcard:'1509900112233',birth:'2000-01-20',age:26,edu:'ปวช. ช่างยนต์',hospital:'โรงพยาบาลบางมด',position:'ช่างซ่อมทั่วไป',start:'2022-02-01',tel:'092-444-5566',salary:12000,ot:2200,bonus:800,pin:'',note:'ดูใบงานและสต๊อก ไม่เห็นราคา',emg:'',perms:presetPerms('tech')},
    {id:sid(),code:'EMP004',name:'มานะ บริหารเก่ง',idcard:'3101200334455',birth:'1975-11-02',age:50,edu:'ปริญญาตรี วิศวกรรมยานยนต์',hospital:'โรงพยาบาลจอมทอง',position:'ผู้จัดการอู่',start:'2012-01-10',tel:'081-900-1122',salary:35000,ot:0,bonus:5000,pin:'',note:'ดูแลภาพรวมทั้งอู่ · ทำได้และอนุมัติได้ทุกอย่าง ยกเว้นส่งออก/ล้างข้อมูล',emg:'คุณวันดี (ภรรยา) 089-200-3344',perms:presetPerms('mgr')},
    {id:sid(),code:'EMP005',name:'ฝนทิพย์ ต้อนรับ',idcard:'1103300556677',birth:'1998-03-14',age:28,edu:'ปวส. การตลาด',hospital:'โรงพยาบาลบางมด',position:'ธุรการหน้าร้าน',start:'2022-05-02',tel:'092-111-2233',salary:16000,ot:0,bonus:1000,pin:'',note:'รับลูกค้า เปิดบิล รับชำระ นัดหมาย · ไม่มีสิทธิอนุมัติ/ยกเลิกเอกสาร',emg:'คุณฝนแก้ว (มารดา) 081-444-5566',perms:presetPerms('front')},
    {id:sid(),code:'EMP006',name:'อนุมัติ ถี่ถ้วน',idcard:'3100800778899',birth:'1980-07-21',age:46,edu:'ปริญญาโท บริหารธุรกิจ',hospital:'โรงพยาบาลจอมทอง',position:'หัวหน้าฝ่ายอนุมัติ',start:'2018-09-01',tel:'081-666-7788',salary:28000,ot:0,bonus:3000,pin:'',note:'อนุมัติ/ตีกลับเอกสารได้ทุกประเภท แต่ไม่ทำเอกสารเอง',emg:'',perms:presetPerms('apv')},
    {id:sid(),code:'EMP007',name:'สมปอง คลังแน่น',idcard:'1104500990011',birth:'1995-12-08',age:30,edu:'ปวส. โลจิสติกส์',hospital:'โรงพยาบาลบางมด',position:'เจ้าหน้าที่คลังอะไหล่',start:'2022-03-01',tel:'092-777-8899',salary:16000,ot:1200,bonus:1000,pin:'',note:'จัดการสต๊อกเต็ม · อนุมัติใบรับ/เบิก/นับ/เคลมสินค้า',emg:'',perms:presetPerms('stk')},
    {id:sid(),code:'EMP008',name:'เก็บเงิน แม่นยำ',idcard:'1105600112233',birth:'2001-06-30',age:25,edu:'ปวช. การบัญชี',hospital:'โรงพยาบาลบางมด',position:'แคชเชียร์',start:'2025-01-06',tel:'092-333-4455',salary:14000,ot:0,bonus:500,pin:'',note:'บันทึกรับชำระจากลูกหนี้อย่างเดียว',emg:'',perms:presetPerms('cash')},
    {id:sid(),code:'EMP009',name:'วิเคราะห์ รอบคอบ',idcard:'3102900445566',birth:'1985-02-17',age:41,edu:'ปริญญาตรี การบัญชี (ผู้ตรวจสอบภายใน)',hospital:'โรงพยาบาลจอมทอง',position:'ผู้ตรวจสอบภายใน',start:'2020-11-16',tel:'081-888-9900',salary:22000,ot:0,bonus:0,pin:'',note:'เห็นทุกเมนูทุกตัวเลข ทำอะไรไม่ได้ · ใช้ตรวจสอบย้อนหลัง',emg:'',perms:presetPerms('audit')},
    {id:sid(),code:'EMP010',name:'ประสิทธิ์ มือทอง',idcard:'1103700889900',birth:'1990-08-11',age:36,edu:'ปวส. ช่างยนต์',hospital:'โรงพยาบาลบางมด',position:'ช่างซ่อมช่วงล่าง-เบรก',start:'2019-04-01',tel:'092-888-1122',salary:15000,ot:2600,bonus:1000,pin:'',note:'เชี่ยวชาญช่วงล่าง เบรก และยาง',emg:'',perms:presetPerms('tech')},
    {id:sid(),code:'EMP011',name:'อดิศักดิ์ ไฟแรง',idcard:'1104900667788',birth:'1996-05-25',age:30,edu:'ปวส. ไฟฟ้ากำลัง (อบรมระบบ EV)',hospital:'โรงพยาบาลจอมทอง',position:'ช่างไฟฟ้า / รถ EV',start:'2023-01-16',tel:'092-999-3344',salary:15500,ot:2400,bonus:1200,pin:'',note:'งานระบบไฟฟ้า แอร์ และรถยนต์ไฟฟ้า',emg:'',perms:presetPerms('tech')}
  ];
  const TECHS=[emp[0],emp[2],emp[9],emp[10]];

  /* ---------- รีเซ็ตฐานข้อมูล ---------- */
  DB.stock=st; DB.vendors=ven; DB.cust=cust; DB.emp=emp; DB.curEmp='';
  DB.purchases=[]; DB.quotes=[]; DB.receipts=[]; DB.moves=[]; DB.crm=[];
  DB.expenses=[]; DB.assets=[]; DB.capital=[]; DB.claims=[]; DB.issues=[]; DB.stockCounts=[];
  DB.billings=[]; DB.invoices=[]; DB.hr=[]; DB.warns=[]; DB.audit=[]; DB.seq={};
  DB.shop=Object.assign({},DB.shop,{type:'company',vatReg:true,person:'ศักดิ์ชัย มั่นคง',
    company:'หจก.เอกหม้อน้ำ',email:'service@ekmornam.co.th',web:'',
    name:'หจก.เอกหม้อน้ำ',tax:'0105545001234',tel:'02-555-1234, 081-555-1234',
    addr:'123/45 ถ.พระราม 2 แขวงบางมด เขตจอมทอง กรุงเทพมหานคร 10150',branch:'สำนักงานใหญ่',
    bank:'ธนาคารกสิกรไทย 123-4-56789-0',
    banks:[{name:'ธนาคารกสิกรไทย',no:'123-4-56789-0',acc:'หจก.เอกหม้อน้ำ',general:true,vat:false},
           {name:'ธนาคารไทยพาณิชย์',no:'456-7-89012-3',acc:'หจก.เอกหม้อน้ำ',general:false,vat:true},
           {name:'ธนาคารกรุงเทพ',no:'789-0-12345-6',acc:'หจก.เอกหม้อน้ำ',general:true,vat:true}],
    stale:6,warrM:3,
    licStart:iso(new Date(today.getFullYear(),today.getMonth()-10,1)),licEnd:addDays(TODAY,120),
    warr:'รับประกันงานซ่อมและอะไหล่ที่เปลี่ยน 3 เดือน หรือ 5,000 กิโลเมตร แล้วแต่อย่างใดถึงก่อน ไม่รวมความเสียหายจากอุบัติเหตุ การใช้งานผิดประเภท หรือการดัดแปลงสภาพรถ'});

  /* ---------- 5) แม่แบบงานซ่อม 14 ประเภท ---------- */
  /* parts: [code, qtyMin, qtyMax] · labor: [ชื่อ, ราคาต่ำ, ราคาสูง] */
  const JOBS=[
    {k:'brake',probs:['เบรกมีเสียงดังตอนเหยียบ','เหยียบเบรกแล้วสั่น'],
     finds:[{t:'ผ้าเบรกหน้าหมด',new:true},{t:'จานเบรกเป็นร่อง',fix:true,part:true}],
     parts:[['BR-001',1,1],['BR-014',0,2],['BR-025',1,1]],labor:['ค่าแรงเปลี่ยนผ้าเบรก + เจียจานเบรก',800,1400]},
    {k:'brake2',probs:['เบรกต่ำ ต้องย้ำสองครั้ง'],
     finds:[{t:'ผ้าเบรกหลังหมด',new:true},{t:'แม่ปั๊มเบรกบนรั่วซึม',new:true}],
     parts:[['BR-005',1,1],['BR-020',0,1],['BR-025',1,2]],labor:['ค่าแรงเปลี่ยนแม่ปั๊มเบรกและไล่ลม',900,1600]},
    {k:'susp',probs:['มีเสียงดังใต้ท้องรถตอนเข้าโค้ง','พวงมาลัยสั่นที่ความเร็วสูง'],
     finds:[{t:'โช้คอัพเสื่อมสภาพ มีคราบน้ำมันซึม',new:true},{t:'ลูกหมากปีกนกหลวม',new:true},{t:'ตรวจเช็กช่วงล่างทั้งระบบ',fix:true}],
     parts:[['SU-330',2,2],['SU-335',0,2],['SU-350',0,2],['SU-341',0,2],['SU-360',0,1]],labor:['ค่าแรงเปลี่ยนโช้คอัพและตรวจเช็กช่วงล่าง',1200,2400]},
    {k:'cool',probs:['เครื่องร้อนจัด ไฟเตือนขึ้น','น้ำหล่อเย็นพร่องบ่อย'],
     finds:[{t:'หม้อน้ำรั่วบริเวณรังผึ้ง',new:true},{t:'ปั๊มน้ำมีเสียงดัง แบริ่งหลวม',new:true},{t:'ล้างระบบระบายความร้อน',fix:true}],
     parts:[['CO-402',1,1],['CO-410',0,1],['CO-415',0,1],['CO-420',1,2]],labor:['ค่าแรงถอด-ประกอบระบบระบายความร้อน',1500,2500]},
    {k:'ac',probs:['แอร์ไม่ค่อยเย็นช่วงรถติด','แอร์มีกลิ่นอับ'],
     finds:[{t:'คอมเพรสเซอร์เสียงดัง แรงดันตก',new:true},{t:'กรองแอร์อุดตัน',new:true},{t:'เติมน้ำยาแอร์และตรวจรอยรั่ว',fix:true}],
     parts:[['AC-204',0,1],['AC-222',0,1],['AC-215',1,1],['AC-230',1,1]],labor:['ค่าแรงระบบแอร์ ล้างตู้ เติมน้ำยา',1000,2000]},
    {k:'pm',probs:['ถึงระยะเปลี่ยนถ่ายน้ำมันเครื่อง'],
     finds:[{t:'ครบระยะเปลี่ยนถ่ายน้ำมันเครื่อง 10,000 กม.',new:true},{t:'ตรวจเช็กระดับของเหลวและลมยาง',fix:true}],
     parts:[['OI-801',1,1],['EN-501',1,1],['EN-512',0,1],['CS-961',0,2]],labor:['ค่าแรงเปลี่ยนถ่ายน้ำมันเครื่องและตรวจเช็กระยะ',400,700]},
    {k:'pmb',probs:['เข้าเช็กระยะรถเก๋ง'],
     finds:[{t:'ครบระยะเปลี่ยนถ่ายน้ำมันเครื่อง',new:true},{t:'กรองแอร์สกปรก',new:true}],
     parts:[['OI-805',1,1],['EN-501',1,1],['AC-215',1,1]],labor:['ค่าแรงเช็กระยะรถเก๋ง',350,600]},
    {k:'elec',probs:['สตาร์ทไม่ติดตอนเช้า','ไฟชาร์จไม่เข้า'],
     finds:[{t:'ไดชาร์จชาร์จไฟอ่อน',new:true},{t:'แบตเตอรี่เสื่อม เก็บไฟไม่อยู่',new:true}],
     parts:[['EL-101',0,1],['EL-105',0,1],['EL-118',1,1],['EL-125',0,1]],labor:['ค่าแรงตรวจระบบไฟชาร์จและเปลี่ยนอะไหล่',600,1200]},
    {k:'trans',probs:['คลัตช์ลื่น ขึ้นทางชันไม่มีกำลัง','มีเสียงหอนจากเพลากลาง'],
     finds:[{t:'ผ้าคลัตช์หมด ลื่นเมื่อบรรทุกหนัก',new:true},{t:'ยอยเพลากลางหลวม',new:true}],
     parts:[['TR-601',1,1],['TR-620',0,1],['TR-610',1,1]],labor:['ค่าแรงยกเกียร์เปลี่ยนชุดคลัตช์',2800,4200]},
    {k:'tire',probs:['ยางสึกไม่เท่ากัน ดอกหมด'],
     finds:[{t:'ยางหมดดอก 4 เส้น',new:true},{t:'ตั้งศูนย์ถ่วงล้อ',fix:true}],
     parts:[['TY-901',4,4],['TY-910',0,4]],labor:['ค่าแรงเปลี่ยนยาง ตั้งศูนย์ถ่วงล้อ',600,1000]},
    {k:'tire2',probs:['ยางรถเก๋งบวม แก้มยางแตกลายงา'],
     finds:[{t:'ยางเสื่อมสภาพตามอายุ',new:true}],
     parts:[['TY-905',2,4],['TY-910',0,4]],labor:['ค่าแรงเปลี่ยนยางและถ่วงล้อ',400,800]},
    {k:'eng',probs:['เครื่องสั่น เร่งไม่ขึ้น ควันดำ','กินน้ำมันผิดปกติ'],
     finds:[{t:'หัวฉีดสึก จ่ายน้ำมันไม่สม่ำเสมอ',new:true},{t:'ปะเก็นฝาสูบซึม',new:true},{t:'ล้างระบบเชื้อเพลิง',fix:true}],
     parts:[['EN-540',0,2],['EN-530',0,1],['EN-520',0,1],['CS-950',1,1],['MS-995',1,1],['OI-801',1,1],['EN-501',1,1]],labor:['ค่าแรงยกเครื่องบน เปลี่ยนหัวฉีดและปะเก็น',5000,9000]},
    {k:'body',probs:['เฉี่ยวชนด้านหน้า กันชนแตก'],
     finds:[{t:'กันชนหน้าแตก กระจังหน้าหัก',new:true},{t:'กระจกมองข้างพับไม่ได้',new:true}],
     parts:[['BD-710',0,1],['BD-701',0,1],['BD-720',0,1],['MS-985',2,6]],labor:['ค่าแรงถอดเปลี่ยนชิ้นส่วนบอดี้',800,1800]},
    {k:'ev',probs:['รถ EV ขึ้นเตือนระบบระบายความร้อนแบตเตอรี่','สายชาร์จเดิมชำรุด'],ev:true,
     finds:[{t:'น้ำยาหล่อเย็นชุดแบตเตอรี่พร่อง',new:true},{t:'เปลี่ยนกรองแอร์และตรวจระบบแรงดันสูง',fix:true}],
     parts:[['EV-110',1,2],['EV-130',1,1],['EV-101',0,1],['EV-120',0,1]],labor:['ค่าแรงตรวจระบบ EV และเปลี่ยนของเหลว',800,1600]}
  ];
  const FLEET_JOBS=['brake','susp','cool','pm','tire','trans','eng','elec','brake2'];

  /* ---------- ตัวช่วยสร้างเอกสาร ---------- */
  const qmap={}; st.forEach(x=>qmap[x.code]=0);          /* ยอดคงเหลือจำลองตามเวลา */
  const monthGR={};                                        /* ใบรับสินค้าประจำเดือนต่อผู้ขาย */
  let arCount=0;
  const priceOf=(item,tier)=>tier==='A'?item.pa:tier==='B'?item.pb:item.pc;

  function ensureStock(code,need,d,ym){
    const it=S[code];
    if(qmap[code]>=need) return;
    const v=venOfCat(it.cat), key=ym+'|'+v.id;
    let g=monthGR[key];
    if(!g){
      g={id:sid(),no:dno('GR',d),date:d,vendorId:v.id,inv:(v.type==='company'?'IV-':'BIL-')+be(d)+String(ri(1000,9899)),invDate:d,
        term:v.cash?'cash':'credit',days:v.days,due:addDays(d,v.days),paid:false,payDate:'',
        by:'สมปอง คลังแน่น',check:'ศักดิ์ชัย มั่นคง',note:'',items:[],disc:0,vat:7,posted:true,
        apv:AP(NM_STK,d)};
      stamp(g,d,NM_STK);
      monthGR[key]=g; DB.purchases.push(g);
    }
    const line=g.items.find(x=>x.code===code);
    const order=Math.max(need-qmap[code],it.max||need);
    if(line) line.qty+=order;
    else g.items.push({stockId:it.id,code:it.code,oem:it.oem,name:it.name,cat:it.cat,qty:order,cost:it.cost});
    qmap[code]+=order;
    logMove(it.id,'in',order,d,'รับเข้าจากใบรับสินค้า',g.no,v.id,it.cost);
    it.lastMove=d;
  }
  function takeStock(code,q,d,ref,refNo){
    const it=S[code];
    qmap[code]=Math.max(0,qmap[code]-q);
    logMove(it.id,'out',ref==='เบิกใช้ตามใบอนุมัติซ่อม'||ref==='ขายหน้าร้าน (ใบเสร็จ)'?-q:q,d,ref,refNo);
    it.lastMove=d;
  }
  function buildItems(tpl,tier,scale){
    const items=[]; let hasPart=false;
    tpl.parts.forEach(p=>{
      let q=ri(p[1],p[2]); if(!q) return;
      q=Math.max(1,Math.round(q*scale));
      const it=S[p[0]];
      items.push({type:'part',code:it.code,oem:it.oem,name:it.name,qty:q,price:priceOf(it,tier),stockId:it.id,warr:it.warr||''});
      hasPart=true;
    });
    if(!hasPart){const it=S[tpl.parts[0][0]];
      items.push({type:'part',code:it.code,oem:it.oem,name:it.name,qty:Math.max(1,Math.round(scale)),price:priceOf(it,tier),stockId:it.id,warr:it.warr||''});}
    items.push({type:'labor',code:'',oem:'',name:tpl.labor[0],qty:1,price:niceP(ri(tpl.labor[1],tpl.labor[2])*Math.max(1,scale*0.8))*1,stockId:'',warr:''});
    return items;
  }
  const gsum=items=>{const s=items.reduce((a,it)=>a+n(it.qty)*n(it.price),0); return s*1.07;};

  /* ใบเสนอราคา + ใบเสร็จ 1 งาน — คืนยอด gross ของใบเสร็จ */
  function makeJob(c,vi,tpl,d,ym,opts,pre){
    opts=opts||{};
    const items=pre||buildItems(tpl,c.tier,opts.scale||1);
    const needMap={};
    items.filter(x=>x.type==='part').forEach(x=>needMap[x.code]=(needMap[x.code]||0)+n(x.qty));
    Object.keys(needMap).forEach(cd2=>ensureStock(cd2,needMap[cd2],d,ym));
    const veh=c.vehicles[vi];
    const tech=opts.ev?emp[10]:pick(TECHS);
    const probs=[pick(tpl.probs),chance(.3)?pick(tpl.probs):'',''];
    const mile=String(Math.max(1000,n(veh.mile)-ri(500,4000)));
    const q={id:sid(),no:dno('QO',d),date:d,jobIn:d,custId:c.id,vehIdx:vi,mile,
      probs,finds:normFinds(tpl.finds.map(f=>Object.assign({},f))),tier:c.tier,items,
      disc:opts.disc||0,vat:7,tech:tech.id,techName:tech.name,
      byPos:'หัวหน้าช่าง',byName:'ศักดิ์ชัย มั่นคง',
      apPos:c.type==='company'?'ผู้มีอำนาจสั่งซ่อม':'เจ้าของรถ',apName:custShort(c),
      status:'ส่งมอบรถ / ออกใบเสร็จแล้ว',deducted:true,apv:AP(NM_LEAD,d)};
    stamp(q,d,NM_FRONT);
    DB.quotes.push(q);
    items.filter(x=>x.type==='part').forEach(x=>takeStock(x.code,n(x.qty),d,'เบิกใช้ตามใบอนุมัติซ่อม',q.no));

    const rd0=addDays(d,ri(0,3)), rd=rd0>TODAY?TODAY:rd0;
    const isCo=c.type==='company';
    const issueTax=isCo||chance(.5);
    const wht=(isCo&&issueTax&&chance(.7))?3:0;
    const credit=opts.credit!=null?opts.credit:(isCo);
    const days=credit?(c.tier==='A'?30:chance(.5)?30:45):0;
    const useCard=!credit&&chance(.18), useTrans=!credit&&!useCard&&chance(.4);
    const tech2=chance(.3)?pick(TECHS.filter(t=>t.id!==tech.id)):null;
    const r={id:sid(),no:dno('RE',rd),taxNo:'',taxDocs:[],issueTax,date:rd,quoteId:q.id,ref:q.no,
      custId:c.id,vehIdx:vi,items:JSON.parse(JSON.stringify(items)),disc:q.disc,vat:7,
      wht,whtBase:'labor',warr:DB.shop.warr,
      tech1:tech.id,tech1Name:tech.name,tech2:tech2?tech2.id:'',tech2Name:tech2?tech2.name:'',
      pay:{cash:!credit&&!useTrans&&!useCard,trans:useTrans,credit,card:useCard,days,
        due:addDays(rd,days),bank:useTrans?'ธนาคารกสิกรไทย 123-4-56789-0':'',when:'',
        cardBank:useCard?'ธนาคารกสิกรไทย':'',card4:useCard?String(ri(1000,9999)):'',
        cardPct:useCard?3:0,cardRef:useCard?('AP'+ri(100000,999999)):''},
      paid:false,paidDate:'',by:pick(['ธนา บัญชีดี','ฝนทิพย์ ต้อนรับ']),note:opts.note||'',deducted:true,
      apv:AP(NM_ACC,rd)};
    if(issueTax){r.taxNo=dno('RT',rd); r.taxDocs=[{no:r.taxNo,date:rd,cancelled:false,cancelReason:'',cancelDate:''}];}
    stamp(r,rd,r.by==='ธนา บัญชีดี'?NM_ACC:NM_FRONT);
    if(!credit){r.paid=true; r.paidDate=rd;}
    DB.receipts.push(r);
    return r;
  }
  function custShort(c){const s=c.name||''; return s.replace(/^ฝ่าย\S*\s*/,'').replace(/^คุณ\s*/,'');}

  /* ขายหน้าร้าน (ไม่ผ่านใบเสนอราคา) */
  function makeCounterSale(c,d,ym){
    const it=pick([S['EL-118'],S['CS-961'],S['TY-905'],S['OI-801'],S['AC-215'],S['CS-970'],S['BR-025'],S['MS-990']]);
    const q=it.code.indexOf('TY')===0?ri(1,2):ri(1,3);
    ensureStock(it.code,q,d,ym);
    const items=[{type:'part',code:it.code,oem:it.oem,name:it.name,qty:q,price:priceOf(it,c.tier),stockId:it.id,warr:it.warr||''}];
    if(chance(.5)) items.push({type:'labor',code:'',oem:'',name:'ค่าแรงเปลี่ยน/ติดตั้งหน้าร้าน',qty:1,price:niceP(ri(100,400)),stockId:'',warr:''});
    const useCard=chance(.15), issueTax=chance(.35);
    const r={id:sid(),no:dno('RE',d),taxNo:'',taxDocs:[],issueTax,date:d,quoteId:'',ref:'',custId:c.id,vehIdx:0,
      items,disc:0,vat:7,wht:0,whtBase:'labor',warr:'',
      tech1:emp[2].id,tech1Name:emp[2].name,tech2:'',tech2Name:'',
      pay:{cash:!useCard,trans:false,credit:false,card:useCard,days:0,due:d,bank:'',when:'',
        cardBank:useCard?'ธนาคารกสิกรไทย':'',card4:useCard?String(ri(1000,9999)):'',cardPct:useCard?3:0,cardRef:useCard?('AP'+ri(100000,999999)):''},
      paid:true,paidDate:d,by:'ฝนทิพย์ ต้อนรับ',note:'ขายหน้าร้าน ไม่ผ่านใบเสนอราคา',deducted:true,
      apv:AP(NM_ACC,d)};
    if(issueTax){r.taxNo=dno('RT',d); r.taxDocs=[{no:r.taxNo,date:d,cancelled:false,cancelReason:'',cancelDate:''}];}
    stamp(r,d,NM_FRONT);
    takeStock(it.code,q,d,'ขายหน้าร้าน (ใบเสร็จ)',r.no);
    DB.receipts.push(r);
    return r;
  }


  /* ใบเบิกใช้ภายใน */
  function makeIssue(d,ym){
    const picks=[['MS-980',ri(3,8),'ใช้งานซ่อมรถกิจการ'],['MS-990',1,'งานซีลประจำอู่'],['CS-961',ri(1,2),'เปลี่ยนให้รถรับส่งอะไหล่'],['BR-025',1,'เติมระบบทดสอบเบรก']];
    const lines=picks.filter(()=>chance(.7)).slice(0,3);
    if(!lines.length) return;
    const needMap={};
    lines.forEach(l=>needMap[l[0]]=(needMap[l[0]]||0)+l[1]);
    Object.keys(needMap).forEach(cd2=>ensureStock(cd2,needMap[cd2],d,ym));
    const byE=pick([emp[2],emp[9],emp[6]]);
    const is={id:sid(),no:dno('IS',d),date:d,by:byE.name,byId:byE.id,dept:pick(['ฝ่ายช่าง','รถบริการเคลื่อนที่','สำนักงาน']),
      items:lines.map(l=>({code:l[0],name:S[l[0]].name,qty:l[1],reason:l[2],stockId:S[l[0]].id})),
      note:'',deducted:true,apv:AP(NM_STK,d)};
    stamp(is,d,byE===emp[6]?NM_STK:NM_LEAD);
    DB.issues.push(is);
    lines.forEach(l=>{qmap[l[0]]=Math.max(0,qmap[l[0]]-l[1]);
      logMove(S[l[0]].id,'out',l[1],d,'เบิกใช้ภายใน — '+is.dept+' · '+l[2],is.no); S[l[0]].lastMove=d;});
  }
  /* ใบตรวจนับสินค้า */
  function makeCount(d,ym){
    const cats=pick([['ระบบเบรก','อะไหล่ช่วงล่าง'],['อะไหล่เครื่องยนต์','น้ำมัน / ของเหลว'],['อะไหล่ไฟฟ้า','อะไหล่รถไฟฟ้า'],['อะไหล่สิ้นเปลือง','อะไหล่เบ็ดเตล็ด']]);
    const its=st.filter(x=>cats.includes(x.cat)).slice(0,12);
    const no=dno('SC',d);
    const items=its.map((x,i)=>{
      const sys=qmap[x.code];
      let diff=(i<2&&chance(.8))?pick([-2,-1,1]):0;
      if(sys+diff<0) diff=0;                      /* ห้ามนับได้ติดลบ */
      const counted=sys+diff;
      if(diff){qmap[x.code]=counted;
        logMove(x.id,'adj',diff,d,'ปรับยอดจากตรวจนับสินค้า',no);
        x.lastMove=d;}
      return {stockId:x.id,code:x.code,name:x.name,cat:x.cat,sysQty:sys,countedQty:counted};
    });
    const sc={id:sid(),no,date:d,by:'สมปอง คลังแน่น',catFilter:'',items,
      note:'ตรวจนับประจำไตรมาส หมวด '+cats.join(' + '),applied:true,apv:AP(NM_MGR,d)};
    stamp(sc,d,NM_STK);
    DB.stockCounts.push(sc);
  }

  /* ---------- 6) วนสร้างข้อมูลรายเดือน 36 เดือน ---------- */
  const ymOf=d=>d.slice(0,7);
  const monthReceipts={};    /* ym → receipts เครดิตของลูกค้ากองรถ */
  const salaryTotal=emp.reduce((a,e)=>a+n(e.salary)+n(e.ot)+n(e.bonus),0);
  const ssoErTotal=emp.reduce((a,e)=>a+Math.min(Math.round(Math.min(Math.max(n(e.salary),1650),15000)*0.05),750),0);

  for(let k=35;k>=0;k--){
    const ms=monthStart(k), y=ms.getFullYear(), m=ms.getMonth();
    const mlast=lastDayOf(y,m);
    const isCur=(k===0);
    const maxDay=isCur?today.getDate():mlast;
    const ym=iso(ms).slice(0,7);
    const D=day=>iso(new Date(y,m,Math.min(day,maxDay)));

    /* เป้ายอดขายเดือนนี้: 2-5 ล้านบาท มีแนวโน้มเติบโต + ฤดูกาล + ความผันผวน */
    let target=2350000*Math.pow(1.011,35-k)*(1+0.09*Math.sin((m+1)/12*2*Math.PI))*(0.93+rnd()*0.14);
    target=Math.max(2100000,Math.min(4850000,target));
    if(isCur) target=target*maxDay/mlast;   /* เดือนปัจจุบันคิดตามวันที่ผ่านมาแล้ว */

    /* วางแผนงานทั้งเดือนก่อน แล้วค่อยลงมือสร้างตามลำดับวันที่
       เพื่อให้การรับเข้า-เบิกออกสต๊อกเรียงตามเวลาไม่ติดลบ */
    let sum=0; const credits=[]; const plan=[];
    /* งานกองรถ (ใบใหญ่ รวมงานหลายคัน/หลายระบบในใบเดียว) — คุมสัดส่วน ~60-70% ของยอดเดือน */
    const fleetBudget=target*(0.58+rnd()*0.12);
    let fguard=0;
    while(sum<fleetBudget&&fguard++<24){
      const c=fleets[fguard%fleets.length];
      const day=ri(2,Math.max(3,maxDay-2));
      const nT=ri(2,3), used=[]; let items=[];
      const scale=3+rnd()*3.8;                       /* เหมาซ่อมรถ 3-7 คันของกองรถ */
      for(let t=0;t<nT;t++){
        let fk=pick(FLEET_JOBS); let g2=0;
        while(used.includes(fk)&&g2++<8) fk=pick(FLEET_JOBS);
        used.push(fk);
        items=items.concat(buildItems(JOBS.find(x=>x.k===fk),c.tier,scale));
      }
      const tpl0=JOBS.find(x=>x.k===used[0]);
      sum+=gsum(items);
      plan.push({day,kind:'job',c,vi:ri(0,c.vehicles.length-1),tpl:tpl0,items,
        opts:{credit:true,note:'งานเหมาซ่อมบำรุงกองรถ '+scale.toFixed(0)+' คัน ('+used.length+' ระบบ)'}});
    }
    /* งานซ่อม SME / บุคคล / ขายหน้าร้าน เติมจนถึงเป้า */
    let guard=0;
    while(sum<target&&guard++<90){
      const day=ri(1,maxDay);
      const roll=rnd();
      if(roll<.52){                                     /* SME รถกระบะ งานกลาง-ใหญ่ */
        const c=pick(smes), tpl=pick(JOBS.filter(t=>!t.ev));
        const items=buildItems(tpl,c.tier,1.8+rnd()*1.8);
        sum+=gsum(items);
        plan.push({day,kind:'job',c,vi:ri(0,c.vehicles.length-1),tpl,items,
          opts:{disc:chance(.15)?niceP(ri(100,800)):0}});
      }else if(roll<.88){                               /* บุคคลทั่วไป */
        const c=pick(persons);
        const evCust=persons.indexOf(c)<3;
        const tpl=evCust?JOBS[JOBS.length-1]:pick(JOBS.filter(t=>!t.ev));
        const items=buildItems(tpl,c.tier,1.2+rnd()*0.8);
        sum+=gsum(items);
        plan.push({day,kind:'job',c,vi:0,tpl,items,opts:{ev:evCust,disc:chance(.12)?niceP(ri(50,500)):0}});
      }else{                                            /* ขายหน้าร้าน */
        plan.push({day,kind:'counter',c:pick(persons)});
        sum+=2600;                                      /* ประมาณการยอดขายหน้าร้าน */
      }
    }
    /* ใบเบิกใช้ภายในและใบตรวจนับ เข้าคิวตามวันที่พร้อมงานขาย */
    plan.push({day:ri(6,Math.max(7,maxDay-3)),kind:'issue'});
    if(k%3===1) plan.push({day:Math.min(27,maxDay),kind:'count'});
    plan.sort((a,b)=>a.day-b.day);
    plan.forEach(p=>{
      const d=D(p.day);
      if(p.kind==='counter'){ makeCounterSale(p.c,d,ym); return; }
      if(p.kind==='issue'){ makeIssue(d,ym); return; }
      if(p.kind==='count'){ makeCount(d,ym); return; }
      const r=makeJob(p.c,p.vi,p.tpl,d,ym,p.opts,p.items);
      if(r.pay.credit) credits.push(r);
    });
    monthReceipts[ym]=credits;

    /* ใบวางบิล (BN) และใบแจ้งหนี้ (IV) สิ้นเดือน — แยกตามลูกค้ากองรถ */
    if(!isCur||maxDay>=25){
      const bd=D(Math.min(25,maxDay));
      fleets.forEach((c,fi)=>{
        const list=credits.filter(r=>r.custId===c.id&&!r.cancelled);
        if(!list.length) return;
        const due=addDays(bd,15);
        const useInvoice=(fi%3===2);
        const total=list.reduce((a,r)=>a+receiptTotals(r).net,0);
        if(useInvoice){
          const inv={id:sid(),no:dno('IV',bd),date:bd,custId:c.id,due,srcType:'tax',
            refIds:list.filter(r=>r.taxNo).map(r=>r.id),note:'สรุปยอดค้างชำระประจำเดือน',
            settled:false,settledDate:'',apv:AP(NM_ACC,bd)};
          stamp(inv,bd,NM_ACC);
          if(inv.refIds.length) DB.invoices.push(inv);
          if(due<addDays(TODAY,-7)){
            const pd=addDays(due,ri(-5,8));
            inv.settled=true; inv.settledDate=pd;
            list.forEach(r=>{r.paid=true;r.paidDate=pd;
              r.payments=[{id:sid(),date:pd,amt:receiptTotals(r).net,method:'trans',
                bank:'ธนาคารกสิกรไทย 123-4-56789-0',ref:'TR'+ri(100000,999999),card4:'',chkDate:'',
                by:'เก็บเงิน แม่นยำ',note:'รับชำระตามใบแจ้งหนี้ '+inv.no}];});
          }
        }else{
          const b={id:sid(),no:dno('BN',bd),date:bd,custId:c.id,due,receiptIds:list.map(r=>r.id),
            note:'วางบิลรอบวันที่ 25',settled:false,settledDate:'',apv:AP(NM_ACC,bd)};
          stamp(b,bd,NM_ACC);
          DB.billings.push(b);
          if(due<addDays(TODAY,-7)){
            const pd=addDays(due,ri(-5,10));
            b.settled=true; b.settledDate=pd;
            b.pay={method:'trans',label:'เงินโอน',date:pd,bank:'ธนาคารกสิกรไทย 123-4-56789-0',
              ref:'TR'+ri(100000,999999),note:'',byName:'EMP008 · เก็บเงิน แม่นยำ'};
            list.forEach(r=>{r.paid=true;r.paidDate=pd;
              r.payments=[{id:sid(),date:pd,amt:receiptTotals(r).net,method:'trans',
                bank:'ธนาคารกสิกรไทย 123-4-56789-0',ref:b.pay.ref,card4:'',chkDate:'',
                by:'เก็บเงิน แม่นยำ',note:'รับชำระผ่านใบวางบิล '+b.no,billingId:b.id}];});
          }
        }
      });
    }
    /* ลูกหนี้เครดิตรายอื่น (SME) — ครบกำหนดแล้วให้ชำระ */
    credits.filter(r=>!fleets.some(c=>c.id===r.custId)).forEach(r=>{
      const due=r.pay.due;
      if(due<addDays(TODAY,-10)&&!r.paid){
        const pd=addDays(due,ri(-7,12));
        r.paid=true; r.paidDate=pd;
        r.payments=[{id:sid(),date:pd,amt:receiptTotals(r).net,method:pick(['trans','cash']),
          bank:'ธนาคารกสิกรไทย 123-4-56789-0',ref:'TR'+ri(100000,999999),card4:'',chkDate:'',
          by:'เก็บเงิน แม่นยำ',note:''}];
      }
    });

    /* ค่าใช้จ่ายประจำเดือน */
    const yy2=be(D(1));
    const mkExp=(day,cat,desc,payee,tax,inv,base,vat,wht,paid,note)=>{
      const d=D(day);
      const e={id:sid(),no:dno('EX',d),date:d,cat,desc,payee,tax:tax||'',inv:inv||'',
        base:Math.round(base),vat:vat||0,wht:wht||0,method:'เงินโอน',paid:paid!==false,note:note||''};
      stamp(e,d,NM_ACC); DB.expenses.push(e); return e;};
    mkExp(3,'ค่าเช่าสถานที่','ค่าเช่าอาคารอู่ประจำเดือน','คุณสุนทร เจ้าของอาคาร','3101200456789','',25000,0,5);
    mkExp(5,'ค่าไฟฟ้า','ค่าไฟฟ้าประจำเดือน','การไฟฟ้านครหลวง','0994000165676','MEA-'+yy2+ym.slice(5,7),ri(9000,16500),7,0);
    mkExp(5,'ค่าน้ำประปา','ค่าน้ำประปาประจำเดือน','การประปานครหลวง','0994000165684','MWA-'+yy2+ym.slice(5,7),ri(1400,2800),7,0);
    mkExp(8,'ค่าโทรศัพท์และอินเทอร์เน็ต','อินเทอร์เน็ตและโทรศัพท์สำนักงาน','บมจ. ทรู คอร์ปอเรชั่น','0107536000081','TRUE-'+ri(80000,99999),1299,7,0);
    mkExp(ri(6,20),'ค่าน้ำมันเชื้อเพลิงและขนส่ง','น้ำมันรถรับ-ส่งอะไหล่และรถบริการ','สถานีบริการ ปตท. พระราม 2','0107537000939','',ri(3500,8200),7,0);
    mkExp(ri(24,27),'ค่าบริการวิชาชีพ (บัญชี / กฎหมาย)','ค่าทำบัญชีและยื่นภาษีรายเดือน','สำนักงานบัญชีเลิศพัฒนา','0105551234567','AC-'+yy2+ym.slice(5,7),3500,7,3,k>0,'วางบิลทุกสิ้นเดือน');
    mkExp(ri(10,25),'ค่าธรรมเนียมธนาคารและดอกเบี้ยจ่าย','ค่าธรรมเนียมโอนและเครื่องรูดบัตร','ธนาคารกสิกรไทย','0107536000315','',ri(400,1400),0,0);
    if(chance(.5)) mkExp(ri(8,22),'ค่าโฆษณาและส่งเสริมการขาย','โฆษณาออนไลน์และป้ายโปรโมชั่น','เฟซบุ๊กเพจ/โรงพิมพ์ท้องถิ่น','',null,ri(1500,7500),chance(.5)?7:0,0);
    if(chance(.45)) mkExp(ri(5,25),'วัสดุสิ้นเปลืองสำนักงาน','กระดาษ หมึกพิมพ์ อุปกรณ์สำนักงาน','ร้านเครื่องเขียนสมใจ','',null,ri(800,2600),7,0);
    if(chance(.3)) mkExp(ri(5,25),'เครื่องมือช่างมูลค่าต่ำ','ประแจ/บล็อก/เครื่องมือย่อยทดแทนของสึกหรอ','ร้านเครื่องมือช่างสมบูรณ์','',null,ri(900,3800),7,0);
    if(chance(.25)) mkExp(ri(10,26),'ค่าซ่อมแซมและบำรุงรักษา','ซ่อมบำรุงลิฟต์ยกรถ/เครื่องมือประจำอู่','บจก. ไทยลิฟต์ เอ็นจิเนียริ่ง','0105540887766',null,ri(1500,6500),7,3);
    if(chance(.2)) mkExp(ri(12,26),'ค่ารับรองและบริจาค','เลี้ยงรับรองลูกค้ากองรถ/ทำบุญประจำปี','-','',null,ri(800,3500),0,0);
    if(m===0) mkExp(15,'ค่าเบี้ยประกันภัย','เบี้ยประกันอัคคีภัยอาคารและเครื่องจักร (รายปี)','บมจ. วิริยะประกันภัย','0107536000871','POL-'+yy2+'-9912',24000,0,0);
    if(m===5) mkExp(20,'ภาษีและค่าธรรมเนียมราชการ','ต่อทะเบียนพาณิชย์และค่าธรรมเนียมราชการ','กรมพัฒนาธุรกิจการค้า','',null,ri(1200,2600),0,0);

    /* เงินเดือน 2 รายการสิ้นเดือน (รูปแบบเดียวกับปุ่มจ่ายเงินเดือน) */
    const pd=iso(new Date(y,m+1,0));
    if(pd<=TODAY){
      const lbl='งวด '+TH_M[m]+' '+(y+543);
      const emps=emp.filter(e=>e.start<=pd);
      const g=emps.reduce((a,e)=>a+n(e.salary)+n(e.ot)+n(e.bonus),0);
      const er=emps.reduce((a,e)=>a+Math.min(Math.round(Math.min(Math.max(n(e.salary),1650),15000)*0.05),750),0);
      const e1={id:sid(),no:dno('EX',pd),date:pd,cat:'เงินเดือนและค่าแรงงาน',
        desc:'จ่ายเงินเดือนและค่าล่วงเวลา '+lbl,payee:'พนักงาน '+emps.length+' คน',tax:'',inv:'',
        base:g,vat:0,wht:0,method:'เงินโอน',paid:true,note:'หักประกันสังคมลูกจ้าง '+money(er)+' บาท · จ่ายสุทธิ '+money(g-er)+' บาท'};
      const e2={id:sid(),no:dno('EX',pd),date:pd,cat:'เงินเดือนและค่าแรงงาน',
        desc:'เงินสมทบประกันสังคมส่วนนายจ้าง '+lbl,payee:'พนักงาน '+emps.length+' คน',tax:'',inv:'',
        base:er,vat:0,wht:0,method:'เงินโอน',paid:true,note:'นำส่งพร้อมส่วนลูกจ้าง รวม '+money(er*2)+' บาท'};
      stamp(e1,pd,NM_ACC); stamp(e2,pd,NM_ACC);
      DB.expenses.push(e1,e2);
    }

    /* บันทึก HR ประจำเดือน */
    const HRT=[['late',ri(15,45),'-','รถติด/ตื่นสาย'],['sick',ri(1,2),'ok','ไข้หวัด มีใบรับรองแพทย์'],
      ['personal',1,'ok','ธุระส่วนตัว'],['vacation',ri(1,3),'ok','ลาพักร้อนตามสิทธิ'],['ot',ri(2,5),'ok','เร่งงานส่งลูกค้า']];
    for(let h=0;h<ri(3,6);h++){
      const e=pick(emp), t=pick(HRT);
      const dd=D(ri(1,Math.max(2,maxDay-1)));
      const rec2={id:sid(),emp:e.id,type:t[0],date:dd,qty:t[1],
        end:(t[0]==='sick'||t[0]==='vacation')&&t[1]>1?addDays(dd,t[1]-1):'',stat:t[2],note:t[3],
        by:pick(['ธนา บัญชีดี','ศักดิ์ชัย มั่นคง'])};
      DB.hr.push(rec2);
    }
    if(chance(.12)){const e=pick([emp[2],emp[9],emp[10]]);
      const dd=D(ri(5,Math.max(6,maxDay-1)));
      DB.hr.push({id:sid(),emp:e.id,type:'absent',date:dd,qty:1,end:'',stat:'no',note:'ไม่มาทำงานและติดต่อไม่ได้',by:'ศักดิ์ชัย มั่นคง'});}
  }

  /* ---------- 7) สถานะจ่ายเจ้าหนี้ (ใบรับสินค้า) ---------- */
  DB.purchases.forEach((g,i)=>{
    const oldDue=g.due<addDays(TODAY,-12);
    if(oldDue&&!(g.due>=addDays(TODAY,-75)&&chance(.18))){
      g.paid=true; g.payDate=addDays(g.due,ri(-6,9));
      if(g.payDate>TODAY) g.payDate=TODAY;
    }else if(g.due<TODAY){
      /* เกินกำหนดแต่ยังไม่จ่าย — เจ้าหนี้ค้างจ่ายเกินกำหนด บางใบจ่ายงวดแรกแล้ว */
      if(chance(.5)){const t=grTotals(g).total;
        g.payments=[{id:sid(),date:addDays(g.date,ri(5,12)),amt:Math.round(t*pick([0.3,0.5])),method:'trans',
          bank:'ธนาคารกสิกรไทย 123-4-56789-0',ref:'PO'+ri(100000,999999),card4:'',chkDate:'',
          by:'ธนา บัญชีดี',note:'จ่ายงวดแรก'}];}
    }
  });

  /* ---------- 8) ลูกหนี้ค้างรับเพิ่มเติม + งวดชำระบางส่วน (ทดสอบ AR aging) ---------- */
  DB.receipts.filter(r=>r.pay.credit&&!r.paid).forEach(r=>{
    if(r.pay.due<TODAY&&chance(.45)){
      const net=receiptTotals(r).net;
      r.payments=[{id:sid(),date:addDays(r.date,ri(5,15)),amt:Math.round(net*pick([0.25,0.4,0.5])),method:'trans',
        bank:'ธนาคารกสิกรไทย 123-4-56789-0',ref:'TR'+ri(100000,999999),card4:'',chkDate:'',
        by:'เก็บเงิน แม่นยำ',note:'รับชำระงวดแรก'}];
    }
  });

  /* ---------- 9) เอกสารยกเลิก (ทดสอบการยกเลิกและตรวจสอบย้อนกลับ) ---------- */
  {
    const cand=DB.receipts.filter(r=>!r.quoteId&&r.paid&&!r.taxNo);
    for(let i=0;i<3&&i<cand.length;i++){
      const r=cand[Math.floor(cand.length/(i+2))];
      r.cancelled=true; r.cancelReason=pick(['ลูกค้าคืนสินค้า เปลี่ยนรุ่น','พนักงานคีย์รายการผิด เปิดใบใหม่แทน','ลูกค้ายกเลิกงานหน้างาน']);
      r.cancelDate=addDays(r.date,1);
    }
    const tcand=DB.receipts.filter(r=>r.taxNo&&r.paid&&!r.cancelled);
    for(let i=0;i<2&&i<tcand.length;i++){
      const r=tcand[Math.floor(tcand.length*(i+1)/4)];
      r.taxCancelled=true; r.taxCancelReason='ออกชื่อผู้ซื้อผิด ลูกค้าขอให้ออกใบกำกับภาษีใหม่';
      r.taxCancelDate=addDays(r.date,1);
      if(r.taxDocs&&r.taxDocs.length){r.taxDocs[r.taxDocs.length-1].cancelled=true;
        r.taxDocs[r.taxDocs.length-1].cancelReason=r.taxCancelReason;
        r.taxDocs[r.taxDocs.length-1].cancelDate=r.taxCancelDate;}
    }
  }

  /* ---------- 10) ใบเคลมสินค้า 12 ใบ กระจายตลอด 3 ปี ---------- */
  {
    const claimPool=[['EL-101','ไดชาร์จเสีย ชาร์จไฟไม่เข้าตั้งแต่แกะกล่อง'],['EL-118','แบตเตอรี่บวม เก็บไฟไม่อยู่ในประกัน'],
      ['AC-204','คอมเพรสเซอร์มีเสียงดังผิดปกติหลังติดตั้ง'],['CO-402','หม้อน้ำรั่วบริเวณตะเข็บ ของใหม่'],
      ['TY-901','ยางบวมจากความบกพร่องการผลิต'],['EN-540','หัวฉีดค่าไม่ผ่านเครื่องทดสอบ'],
      ['SU-330','โช้คอัพรั่วซึมภายใน 1 เดือน'],['BR-014','จานเบรกคดจากโรงงาน']];
    for(let i=0;i<12;i++){
      const mAgo=Math.floor(i*3+ri(0,2));
      const ms=monthStart(Math.min(35,mAgo));
      const d=iso(new Date(ms.getFullYear(),ms.getMonth(),ri(3,25)));
      const dd=d>TODAY?TODAY:d;
      const p=pick(claimPool), it=S[p[0]], v=venOfCat(it.cat);
      const refGR=DB.purchases.filter(g=>g.vendorId===v.id&&g.date<=dd);
      const status=mAgo>6?'back':(mAgo>2?pick(['sent','back','reject']):pick(['open','sent']));
      const qy=p[0]==='TY-901'?ri(1,2):1;
      const cl={id:sid(),no:dno('CL',dd),date:dd,vendorId:v.id,
        ref:refGR.length?refGR[refGR.length-1].no:'',status,
        items:[{stockId:it.id,code:it.code,name:it.name,qty:qy,reason:p[1]}],
        recv:status==='back'?addDays(dd,ri(7,20)):'',by:'สมปอง คลังแน่น',ap:'ศักดิ์ชัย มั่นคง',
        note:status==='reject'?'ผู้ขายแจ้งว่าความเสียหายเกิดจากการติดตั้ง ไม่รับเคลม':'',
        deduct:true,deducted:status!=='open',apv:status==='open'&&mAgo<1?{status:'pending',byName:NM_STK,date:dd,note:''}:AP(NM_STK,dd)};
      stamp(cl,dd,NM_STK);
      if(cl.deducted){ensureStock(it.code,qmap[it.code]+qy,dd,dd.slice(0,7));
        qmap[it.code]-=qy;
        logMove(it.id,'out',qy,dd,'ส่งเคลมสินค้า — '+p[1],cl.no,v.id,it.cost); it.lastMove=dd;}
      if(status==='back'){cl.restocked=true; cl.restockDate=cl.recv;
        qmap[it.code]+=qy;
        logMove(it.id,'in',qy,cl.recv,'รับสินค้าคืนจากเคลม (เปลี่ยนชิ้นใหม่)',cl.no,v.id,it.cost); it.lastMove=cl.recv;}
      DB.claims.push(cl);
    }
  }

  /* ---------- 11) ทะเบียนสินทรัพย์ 8 รายการ ---------- */
  {
    const A=(mAgo,name,cat,vendor,cost,life,note)=>{
      const ms=monthStart(Math.min(35,mAgo));
      const d=iso(new Date(ms.getFullYear(),ms.getMonth(),ri(2,20)));
      const a={id:sid(),no:dno('FA',d),date:d,name,cat,vendor,inv:'AS-'+ri(1000,9999),
        cost,vat:7,life,salvage:1,method:'sl',status:'use',out:'',note:note||''};
      stamp(a,d,NM_MGR); DB.assets.push(a);};
    A(35,'ลิฟต์ยกรถ 2 เสา 4 ตัน','เครื่องจักรและอุปกรณ์โรงงาน','บริษัท ไทยลิฟต์ เอ็นจิเนียริ่ง จำกัด',185000,5,'ติดตั้งช่องซ่อมที่ 1');
    A(33,'ลิฟต์ยกรถ 2 เสา 4 ตัน (ตัวที่ 2)','เครื่องจักรและอุปกรณ์โรงงาน','บริษัท ไทยลิฟต์ เอ็นจิเนียริ่ง จำกัด',185000,5,'ติดตั้งช่องซ่อมที่ 2');
    A(30,'ป้ายหน้าร้าน LED พร้อมโครงสร้าง','ป้ายและงานตกแต่งร้าน','ร้านป้ายรุ่งเรืองอาร์ต',75000,5,'');
    A(28,'เครื่องถอดยาง + เครื่องถ่วงล้อ','เครื่องจักรและอุปกรณ์โรงงาน','บจก. ไทร์อีควิปเมนท์',96000,5,'');
    A(25,'ชุดเฟอร์นิเจอร์ห้องรับรองลูกค้า','เฟอร์นิเจอร์และเครื่องตกแต่ง','อินเด็กซ์ ลิฟวิ่งมอลล์',42000,5,'');
    A(22,'เครื่องเติมน้ำยาแอร์อัตโนมัติ','เครื่องมือช่าง','บจก. เย็นสบายแอร์พาร์ท',58000,5,'');
    A(12,'เครื่องวิเคราะห์ระบบ EV และแบตเตอรี่แรงดันสูง','เครื่องมือช่าง','บจก. แบตเตอรี่ไทยเพาเวอร์',145000,5,'รองรับงานซ่อมรถยนต์ไฟฟ้า');
    A(6,'คอมพิวเตอร์ POS หน้าร้านพร้อมเครื่องพิมพ์','คอมพิวเตอร์และโปรแกรมคอมพิวเตอร์','ไอทีซิตี้',32000,3,'');
  }

  /* ---------- 12) เงินลงทุน / เงินกู้ / ถอนทุน ---------- */
  {
    const C=(mAgo,day,type,amt,note)=>{
      const ms=monthStart(Math.min(35,mAgo));
      let d=iso(new Date(ms.getFullYear(),ms.getMonth(),day)); if(d>TODAY)d=TODAY;
      DB.capital.push({id:sid(),date:d,type,amt,note});};
    C(35,2,'invest',2500000,'เงินลงทุนตั้งต้นของหุ้นส่วน');
    C(30,10,'loan',800000,'สินเชื่อ SME ธนาคารกสิกรไทย ดอกเบี้ย MRR+1');
    C(20,15,'invest',500000,'หุ้นส่วนเพิ่มทุนขยายช่องซ่อม EV');
    for(let q=0;q<9;q++) C(27-q*3,25,'repay',40000,'ผ่อนชำระเงินกู้ SME งวดไตรมาส');
    for(let q=0;q<11;q++) C(33-q*3,20,'draw',60000,'ถอนใช้ส่วนตัวของหุ้นส่วน');
    C(8,12,'other_in',25000,'ขายเศษเหล็กและอะไหล่เก่า');
    C(5,18,'other_out',18000,'ค่าปรับปรุงลานจอดรถ (จ่ายครั้งเดียว)');
  }

  /* ---------- 13) CRM: นัดตรวจตามระยะรับประกัน + ลูกค้าเป้าหมาย ---------- */
  {
    const recent=DB.receipts.filter(r=>!r.cancelled&&r.quoteId&&r.date>=addDays(TODAY,-150))
      .filter(r=>(r.items||[]).some(it=>n(it.warr)>=3));
    recent.slice(0,36).forEach((r,i)=>{
      const mos=Math.max(3,...(r.items||[]).map(it=>n(it.warr)||0));
      const dd=new Date(r.date+'T00:00:00'); dd.setMonth(dd.getMonth()+Math.min(mos,3));
      const d=iso(dd);
      const done=d<addDays(TODAY,-2);
      DB.crm.push({id:sid(),custId:r.custId,vehIdx:r.vehIdx||0,type:'warranty',date:d,
        owner:pick(['ธนา บัญชีดี','ฝนทิพย์ ต้อนรับ']),
        note:'ครบกำหนดตรวจเช็กตามเงื่อนไขรับประกัน '+Math.min(mos,3)+' เดือน หลังรับบริการตามใบเสร็จ '+r.no,
        refId:r.id,refNo:r.no,done,doneDate:done?addDays(d,ri(0,3)):'',openedAt:r.date});
    });
    for(let i=0;i<6;i++){
      const c=pick(cust);
      DB.crm.push({id:sid(),custId:c.id,vehIdx:0,type:pick(['prospect','service']),
        date:addDays(TODAY,ri(1,21)),owner:pick(['ธนา บัญชีดี','ฝนทิพย์ ต้อนรับ','มานะ บริหารเก่ง']),
        note:pick(['เสนอโปรโมชันเช็กระยะพร้อมเปลี่ยนถ่ายน้ำมันเครื่อง','เชิญเข้าตรวจสภาพก่อนหน้าฝน ฟรีค่าตรวจ 20 รายการ','ติดตามใบเสนอราคางานซ่อมใหญ่ที่ยังไม่อนุมัติ','นัดรับรถเข้าซ่อมตามคิวช่าง']),
        refId:'',refNo:'',done:false,openedAt:TODAY});
    }
  }

  /* ---------- 14) ใบเตือนพนักงาน 5 ใบ ---------- */
  {
    const W=(mAgo,eIdx,topic,detail)=>{
      const ms=monthStart(Math.min(35,mAgo));
      let d=iso(new Date(ms.getFullYear(),ms.getMonth(),ri(10,25))); if(d>TODAY)d=TODAY;
      const w={id:sid(),no:dno('WN',d),emp:emp[eIdx].id,date:d,when:addDays(d,-1),times:'1',topic,
        rule:'ระเบียบการทำงาน ข้อ 5 เรื่องการลาและการหยุดงาน',detail,
        action:'ตักเตือนเป็นลายลักษณ์อักษร',
        warnTxt:'หากกระทำผิดซ้ำในลักษณะเดียวกันภายใน 1 ปี บริษัทอาจพิจารณาลงโทษสถานหนักขึ้นหรือเลิกจ้างโดยไม่จ่ายค่าชดเชย',
        by:'ศักดิ์ชัย มั่นคง',hr:'ธนา บัญชีดี',witness:'วิชัย ขยันงาน'};
      DB.warns.push(w);};
    W(30,2,'ขาดงานโดยไม่ลา','ไม่มาปฏิบัติงานโดยไม่ได้แจ้งลาล่วงหน้าและติดต่อไม่ได้ ทำให้งานซ่อมลูกค้าล่าช้า 1 วัน');
    W(22,9,'มาทำงานสายเกิน 3 ครั้งในเดือนเดียว','มาสายรวม 4 ครั้ง กระทบคิวรับรถลูกค้าช่วงเช้า');
    W(14,10,'ไม่ปฏิบัติตามขั้นตอนความปลอดภัย','ไม่ตัดระบบไฟแรงดันสูงก่อนถอดชิ้นส่วนรถ EV ตามคู่มือความปลอดภัย');
    W(7,2,'ขาดงานโดยไม่ลา (ครั้งที่ 2)','ขาดงานซ้ำภายในรอบปี หลังเคยได้รับใบเตือนแล้ว');
    W(2,9,'ใช้เครื่องมือของอู่ผิดวัตถุประสงค์','นำเครื่องมือช่างกลับไปใช้งานส่วนตัวโดยไม่ขออนุญาต');
  }

  /* ---------- 15) เอกสารค้างดำเนินการของเดือนปัจจุบัน (ทดสอบสถานะรออนุมัติ/ค้างส่งมอบ) ---------- */
  {
    const ym=TODAY.slice(0,7);
    /* งานอนุมัติซ่อมแล้ว รอส่งมอบรถ (ยังไม่ออกใบเสร็จ) */
    for(let i=0;i<3;i++){
      const c=pick(cust), tpl=pick(JOBS.filter(t=>!t.ev));
      const d=addDays(TODAY,-ri(1,6));
      const items=buildItems(tpl,c.tier,1);
      const needMap={};
      items.filter(x=>x.type==='part').forEach(x=>needMap[x.code]=(needMap[x.code]||0)+n(x.qty));
      Object.keys(needMap).forEach(cd2=>ensureStock(cd2,needMap[cd2],d,ym));
      const tech=pick(TECHS);
      const q={id:sid(),no:dno('QO',d),date:d,jobIn:d,custId:c.id,vehIdx:0,mile:String(n(c.vehicles[0].mile)-ri(100,900)),
        probs:[pick(tpl.probs),'',''],finds:normFinds(tpl.finds.map(f=>Object.assign({},f))),tier:c.tier,items,
        disc:0,vat:7,tech:tech.id,techName:tech.name,byPos:'หัวหน้าช่าง',byName:'ศักดิ์ชัย มั่นคง',
        apPos:c.type==='company'?'ผู้มีอำนาจสั่งซ่อม':'เจ้าของรถ',apName:custShort(c),
        status:'อนุมัติซ่อมแล้ว',deducted:true,apv:AP(NM_LEAD,d)};
      stamp(q,d,NM_FRONT); DB.quotes.push(q);
      items.filter(x=>x.type==='part').forEach(x=>takeStock(x.code,n(x.qty),d,'เบิกใช้ตามใบอนุมัติซ่อม',q.no));
    }
    /* ใบเสนอราคาร่าง + รออนุมัติ */
    for(let i=0;i<2;i++){
      const c=pick(cust), tpl=pick(JOBS.filter(t=>!t.ev));
      const d=addDays(TODAY,-ri(0,2));
      const items=buildItems(tpl,c.tier,1);
      const q={id:sid(),no:dno('QO',d),date:d,jobIn:d,custId:c.id,vehIdx:0,mile:String(n(c.vehicles[0].mile)),
        probs:[pick(tpl.probs),'',''],finds:normFinds(tpl.finds.map(f=>Object.assign({},f))),tier:c.tier,items,
        disc:0,vat:7,tech:'',techName:'',byPos:'หัวหน้าช่าง',byName:'ศักดิ์ชัย มั่นคง',apPos:'',apName:'',
        status:'ร่าง',deducted:false,
        apv:i===0?{status:'pending',byName:NM_FRONT,date:d,note:''}:{status:'draft',byName:'',date:'',note:''}};
      stamp(q,d,NM_FRONT); DB.quotes.push(q);
    }
    /* ใบวางบิลรออนุมัติของเดือนนี้ */
    const b0=DB.billings[DB.billings.length-1];
    if(b0&&!b0.settled) b0.apv={status:'pending',byName:NM_ACC,date:b0.date,note:''};
  }

  /* ---------- 16) สรุปยอดคงเหลือจริงเข้าทะเบียนอะไหล่ ---------- */
  st.forEach(x=>{x.qty=qmap[x.code]||0; if(!x.lastMove) x.lastMove=TODAY;});
  /* บางรายการให้ต่ำกว่าจุดสั่งซื้อ เพื่อทดสอบป้ายเตือนสต๊อกต่ำ */
  ['BR-001','EV-120','AC-204'].forEach(cd=>{const x=S[cd];
    if(x.qty>x.min-1){const cut=x.qty-Math.max(0,x.min-1);
      if(cut>0){x.qty-=cut; qmap[cd]-=cut;
        logMove(x.id,'out',cut,TODAY,'เบิกใช้ตามใบอนุมัติซ่อม',DB.quotes[DB.quotes.length-3].no);}}});

  /* ---------- 17) เลขที่เอกสารรันต่อเนื่อง + ประวัติการใช้งาน (audit) ---------- */
  DB.seq={}; Object.keys(seqMap).forEach(k2=>DB.seq[k2]=seqMap[k2]);
  {
    const push=(ts,userName,kind,doc,act,note)=>DB.audit.push({id:sid(),ts,user:'',userName,kind,
      docId:doc.id,no:doc.no||'',act,note:note||''});
    const cutoff=addDays(TODAY,-92);
    const T=(d,h)=>d+'T0'+h+':'+String(ri(10,55)).padStart(2,'0')+':00.000Z';
    DB.quotes.filter(x=>x.date>=cutoff).forEach(q=>{
      push(T(q.date,8),NM_FRONT,'quote',q,'save',(q.items||[]).length+' รายการ');
      if(q.deducted){push(T(q.date,9),NM_LEAD,'quote',q,'apv','อนุมัติเอกสาร');
        push(T(q.date,9),NM_LEAD,'quote',q,'deduct','ตัดสต๊อก '+(q.items||[]).filter(i=>i.type==='part').length+' รายการ');}
    });
    DB.receipts.filter(x=>x.date>=cutoff).forEach(r=>{
      push(T(r.date,9),r.by==='ธนา บัญชีดี'?NM_ACC:NM_FRONT,'receipt',r,'save',(r.items||[]).length+' รายการ');
      push(T(r.date,9),NM_ACC,'receipt',r,'apv','อนุมัติเอกสาร');
      (r.payments||[]).forEach(p=>{if(p.date>=cutoff)push(T(p.date,9),'EMP008 · เก็บเงิน แม่นยำ','receipt',r,'pay','รับชำระ '+money(p.amt)+' บาท · '+(p.method==='trans'?'เงินโอน':'เงินสด'));});
      if(r.paid&&!(r.payments||[]).length&&r.paidDate>=cutoff)push(T(r.paidDate,10),NM_FRONT,'receipt',r,'pay','รับชำระเต็มจำนวน');
      if(r.cancelled)push(T(r.cancelDate,11),NM_MGR,'receipt',r,'del','ยกเลิกใบเสร็จ — '+r.cancelReason);
    });
    DB.purchases.filter(x=>x.date>=cutoff).forEach(g=>{
      push(T(g.date,8),NM_STK,'gr',g,'save',(g.items||[]).length+' รายการ');
      push(T(g.date,8),NM_STK,'gr',g,'apv','อนุมัติและรับเข้าสต๊อก');
      if(g.paid&&g.payDate>=cutoff)push(T(g.payDate,10),NM_ACC,'gr',g,'pay','จ่ายชำระผู้ขายเต็มจำนวน');
    });
    DB.billings.filter(x=>x.date>=cutoff).forEach(b=>{
      push(T(b.date,10),NM_ACC,'billing',b,'save',(b.receiptIds||[]).length+' ใบ');
      if(b.settled)push(T(b.settledDate,10),'EMP008 · เก็บเงิน แม่นยำ','billing',b,'pay','รับชำระตามใบวางบิล');
    });
    DB.invoices.filter(x=>x.date>=cutoff).forEach(v2=>{
      push(T(v2.date,10),NM_ACC,'invoice',v2,'save',(v2.refIds||[]).length+' รายการ');
      if(v2.settled)push(T(v2.settledDate,10),'EMP008 · เก็บเงิน แม่นยำ','invoice',v2,'pay','รับชำระตามใบแจ้งหนี้');
    });
    DB.issues.filter(x=>x.date>=cutoff).forEach(d2=>{push(T(d2.date,9),NM_LEAD,'issue',d2,'save',(d2.items||[]).length+' รายการ');
      push(T(d2.date,9),NM_STK,'issue',d2,'apv','อนุมัติและตัดสต๊อก');});
    DB.stockCounts.filter(x=>x.date>=cutoff).forEach(d2=>{push(T(d2.date,9),NM_STK,'count',d2,'save',(d2.items||[]).length+' รายการ');
      push(T(d2.date,9),NM_MGR,'count',d2,'apv','อนุมัติและปรับยอด');});
    DB.claims.filter(x=>x.date>=cutoff).forEach(d2=>push(T(d2.date,9),NM_STK,'claim',d2,'save',(d2.items||[]).length+' รายการ'));
    DB.expenses.filter(x=>x.date>=cutoff).forEach(e2=>push(T(e2.date,9),NM_ACC,'expense',e2,'save',e2.cat+' · '+money(e2.base)+' บาท'));
    DB.crm.filter(x=>(x.openedAt||'')>=cutoff).forEach(k2=>push(T(k2.openedAt,9),k2.owner?('· '+k2.owner):NM_FRONT,'crm',k2,'save','นัดหมายวันที่ '+thDate(k2.date)));
    DB.audit.sort((a,b)=>a.ts.localeCompare(b.ts));
    if(DB.audit.length>3800)DB.audit=DB.audit.slice(-3800);
  }

  save(); boot(); go('home');
  toast('โหลดข้อมูลทดสอบย้อนหลัง 36 เดือนแล้ว · ใบเสร็จ '+DB.receipts.length+' ใบ · ยอดขาย 2-5 ล้านบาท/เดือน');
}


/* ==========================================================
   CRM · นัดหมายและติดตามลูกค้า
   ========================================================== */
const CRM_TYPE={warranty:'ตรวจเช็กตามระยะรับประกัน',service:'นัดเข้าซ่อม / ตรวจสภาพ',prospect:'ลูกค้าเป้าหมาย เชิญชวน'};
function crmStatus(k){
  const d=daysBetween(iso(),k.date);
  if(k.done) return {cls:'g',txt:'ติดตามแล้ว',ord:9};
  if(d<0) return {cls:'r',txt:'เลยกำหนด '+(-d)+' วัน',ord:0};
  if(d===0) return {cls:'r',txt:'ถึงกำหนดวันนี้',ord:1};
  if(d<=7) return {cls:'a',txt:'อีก '+d+' วัน',ord:2};
  return {cls:'',txt:'อีก '+d+' วัน',ord:3};
}
function crmRowHtml(k,compact){
  const c=findCust(k.custId), v=c&&(c.vehicles||[])[k.vehIdx], st=crmStatus(k);
  const act=can('doc.crmEdit');
  if(compact) return `<tr><td><b>${esc(custName(c)||'-')}</b></td><td class="mono">${esc(plateOf(v))}</td>
    <td class="mono" style="font-size:12px;white-space:nowrap">${esc((c&&c.tel)||'-')}</td>
    <td class="ctr">${thDate(k.date)}<div class="hint">${st.txt}</div></td>
    <td class="ctr"><span class="chip ${k.type==='prospect'?'b':'a'}">${CRM_TYPE[k.type]||'-'}</span></td>
    <td class="ctr">${act?`<button class="btn sm gh" onclick="crmDone('${k.id}')">บันทึกติดตาม</button>`:'<span class="hint">-</span>'}</td></tr>`;
  return `<tr><td><b>${esc(custName(c)||'-')}</b> ${starHtml(n(c&&c.stars),'')}${c&&c.type==='company'&&c.name?`<div class="hint">${esc(c.name)}</div>`:''}</td>
    <td class="mono">${esc(plateOf(v))}<div class="hint">${esc(((v&&v.brand)||'').replace(/\s*\(.*/,''))} ${esc((v&&v.model)||'')}</div></td>
    <td class="mono" style="font-size:12px;white-space:nowrap">${esc((c&&c.tel)||'-')}${c&&c.tel2?'<br>'+esc(c.tel2):''}</td>
    <td class="ctr">${thDate(k.date)}</td>
    <td class="ctr"><span class="chip ${st.cls}">${st.txt}</span></td>
    <td class="ctr"><span class="chip ${k.type==='prospect'?'b':'a'}">${CRM_TYPE[k.type]||'-'}</span></td>
    <td style="font-size:12.5px">${esc(k.note||'-')}${k.refNo?`<div class="hint mono">อ้างอิงใบเสร็จ ${esc(k.refNo)}</div>`:''}${k.owner?`<div class="hint">ผู้ติดตาม: ${esc(k.owner)}</div>`:''}</td>
    ${byCell(k)}
    <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">${act?`${k.done?`<button class="btn sm gh" onclick="crmDone('${k.id}')">ย้อนสถานะ</button>`:`<button class="btn sm gh" onclick="crmDone('${k.id}')">บันทึกติดตาม</button>`}
      <button class="btn sm gh pc-crmEdit" onclick="openCrm('${k.id}')">แก้ไข</button>
      <button class="btn sm dgr" onclick="crmDel('${k.id}')">ลบ</button>`:'<span class="hint">-</span>'}</div></td></tr>`;
}
function renderCrm(){
  const f=$('#crmFilter').value, today=iso();
  let rows=DB.crm.slice();
  if(f==='due') rows=rows.filter(k=>!k.done&&daysBetween(today,k.date)<=7);
  else if(f==='done') rows=rows.filter(k=>k.done);
  else if(f==='warranty') rows=rows.filter(k=>k.type==='warranty');
  else if(f==='prospect') rows=rows.filter(k=>k.type==='prospect');
  rows.sort((a,b)=>{const sa=crmStatus(a),sb=crmStatus(b); return sa.ord-sb.ord||a.date.localeCompare(b.date)});
  rows=sortRows('crmTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'crm');
  $('#crmTbl tbody').innerHTML=rows.map(k=>crmRowHtml(k,false)).join('');
  $('#crmEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('crmTbl');
  $('#crmCount').textContent=rows.length+' รายการ';
}
let editCrmId=null;
function crmCustomers(){ const ids=new Set(DB.receipts.filter(r=>!r.cancelled).map(r=>r.custId)); return DB.cust.filter(c=>ids.has(c.id)); }
function openCrm(id){
  if(!can('doc.crmEdit')) return toast('บัญชีนี้ไม่มีสิทธิแก้ไขนัดหมาย CRM');
  const list=crmCustomers();
  if(!list.length) return toast('ยังไม่มีลูกค้าที่ออกใบเสร็จรับเงิน — CRM จะเริ่มได้หลังปิดบิลแรก');
  editCrmId=id||null; const k=id?DB.crm.find(x=>x.id===id):null;
  $('#mCrmTitle').textContent=k?'แก้ไขนัดหมายลูกค้า':'บันทึกนัดหมายลูกค้า';
  $('#kCust').innerHTML=list.map(c=>`<option value="${c.id}">${esc(custName(c))}${c.tel?' · '+esc(c.tel):''}</option>`).join('');
  $('#kCust').value=(k&&k.custId)||list[0].id;
  crmFillVeh(); if(k){$('#kVeh').value=k.vehIdx; $('#kRef').value=k.refId||''}
  $('#kType').value=(k&&k.type)||'warranty';
  $('#kDate').value=(k&&k.date)||addDays(iso(),n(DB.shop.warrM||3)*30);
  fillCrmOwnerSel(k);$('#kNote').value=(k&&k.note)||'';
  openModal('mCrm');
}
function crmFillVeh(){
  const c=findCust($('#kCust').value), vs=(c&&c.vehicles)||[];
  $('#kVeh').innerHTML=vs.map((v,i)=>`<option value="${i}">${esc(vehLabel(v))}</option>`).join('')||'<option value="0">-</option>';
  const rs=DB.receipts.filter(r=>r.custId===(c&&c.id)&&!r.cancelled);
  $('#kRef').innerHTML='<option value="">— ไม่อ้างอิง —</option>'+rs.map(r=>`<option value="${r.id}">${esc(r.no)} · ${thDate(r.date)} · ${money(receiptTotals(r).gross)}</option>`).join('');
  const last=rs[rs.length-1];
  $('#kInfo').textContent=last?('ใบเสร็จล่าสุด '+last.no+' วันที่ '+thDate(last.date)+' · เงื่อนไขรับประกัน: '+(last.warr?last.warr.slice(0,80):'ตามมาตรฐานอู่')):'';
}
$('#kCust').onchange=crmFillVeh;
function fillCrmOwnerSel(k){
  const el=$('#kOwner'); if(!el) return;
  const curId=(k&&k.ownerId)||'', curName=(k&&k.owner)||'';
  el.innerHTML='<option value="">— ไม่ระบุ —</option>'
    +empActiveList().map(e=>`<option value="${esc(e.id)}">${esc(e.code)} · ${esc(e.name)}${e.position?' ('+esc(e.position)+')':''}</option>`).join('');
  /* ถ้านัดหมายเดิมระบุคนที่ลาออกไปแล้ว ให้เติมกลับเป็นตัวเลือก ไม่ให้ค่าหาย */
  const curEmpRec=curId?DB.emp.find(e=>e.id===curId):null;
  if(curEmpRec&&!empActive(curEmpRec)) el.insertAdjacentHTML('beforeend',`<option value="${esc(curEmpRec.id)}">${esc(curEmpRec.code)} · ${esc(curEmpRec.name)} — ลาออกแล้ว</option>`);
  if(curId&&DB.emp.some(e=>e.id===curId)){ el.value=curId; return; }
  const hit=curName&&DB.emp.find(e=>e.name===curName);
  if(hit){ el.value=hit.id; return; }
  if(curName){ el.insertAdjacentHTML('beforeend',
    `<option value="legacy:${esc(curName)}">${esc(curName)} (ข้อมูลเดิม — ไม่มีในทะเบียนพนักงาน)</option>`);
    el.value='legacy:'+curName; }
  else el.value='';
}
function crmOwnerPick(){
  const v=$('#kOwner').value;
  if(!v) return {ownerId:'',owner:''};
  if(v.indexOf('legacy:')===0) return {ownerId:'',owner:v.slice(7)};
  const e=DB.emp.find(x=>x.id===v);
  return e?{ownerId:e.id,owner:e.name}:{ownerId:'',owner:''};
}
function saveCrm(){
  if(!can('doc.crmEdit')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกนัดหมายลูกค้า');
  const custId=$('#kCust').value, date=$('#kDate').value;
  if(!custId||!date) return toast('เลือกลูกค้าและวันที่นัดหมายก่อนบันทึก');
  const ref=DB.receipts.find(r=>r.id===$('#kRef').value);
  const ow=crmOwnerPick();
  const rec={id:editCrmId||uid(),custId,vehIdx:+$('#kVeh').value||0,type:$('#kType').value,date,
    owner:ow.owner,ownerId:ow.ownerId,note:$('#kNote').value.trim(),refId:ref?ref.id:'',refNo:ref?ref.no:'',
    done:editCrmId?(DB.crm.find(x=>x.id===editCrmId)||{}).done||false:false,openedAt:iso()};
  const isNew=!editCrmId;
  stampRec(rec,editCrmId?DB.crm.find(x=>x.id===editCrmId):null);
  if(editCrmId){const i=DB.crm.findIndex(x=>x.id===editCrmId);DB.crm[i]=rec} else DB.crm.push(rec);
  logAudit('crm',{id:rec.id},'save','ลูกค้า '+custName(findCust(custId))+' · นัดหมายวันที่ '+thDate(date)+(isNew?' (สร้างใหม่)':' (แก้ไข)'));
  save();closeModal('mCrm');renderCrm();renderHome();toast('บันทึกนัดหมายวันที่ '+thDate(date)+' แล้ว');
}
async function crmDone(id){
  const k=DB.crm.find(x=>x.id===id); if(!k) return;
  const c=findCust(k.custId);
  if(!k.done){ if(!await askP({title:'บันทึกการติดตาม',text:'ยืนยันบันทึกว่าติดตามลูกค้า '+custName(c)+' รายนี้แล้ว?',yes:'บันทึก'})) return; }
  else { if(!await askP({title:'ย้อนสถานะนัดหมาย',text:'ยืนยันย้อนสถานะนัดหมายของ '+custName(c)+' กลับเป็น "ยังไม่ติดตาม" ?',yes:'ย้อนสถานะ'})) return; }
  k.done=!k.done; k.doneDate=k.done?iso():'';
  logAudit('crm',{id:k.id},k.done?'done':'undone','ลูกค้า '+custName(c)+' · นัดหมายวันที่ '+thDate(k.date));
  save();renderCrm();renderHome();toast(k.done?'บันทึกว่าติดตามแล้ว':'ย้อนสถานะเป็นยังไม่ติดตาม'); }
async function crmDel(id){ const k=DB.crm.find(x=>x.id===id); if(!k) return;
  if(!await askP({title:'ลบนัดหมาย',text:'ลบนัดหมายนี้?',yes:'ลบ',no:'ไม่ลบ'})) return;
  logAudit('crm',{id:k.id},'del','ลูกค้า '+custName(findCust(k.custId))+' · นัดหมายวันที่ '+thDate(k.date));
  DB.crm=DB.crm.filter(x=>x.id!==id);save();renderCrm();renderHome();toast('ลบนัดหมายแล้ว'); }
function openCrmHistory(){
  DB.audit=DB.audit||[];
  auditCtx={scope:'all',kind:'crm',docId:'',title:'ประวัติการติดตามลูกค้าทั้งหมด'};
  $('#mAuditTitle').textContent='ประวัติการติดตามลูกค้า (CRM)';
  $$('#auditScope button').forEach(b=>b.classList.toggle('on',b.dataset.s==='all'));
  $('#auditKind').innerHTML='<option value="">ทุกประเภทเอกสาร</option>'+Object.entries(AUD_KIND).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  $('#auditKind').value='crm';
  $('#auditAct').innerHTML='<option value="">ทุกการกระทำ</option>'+Object.entries(AUD_ACT).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  const users=[...new Set(DB.audit.map(a=>a.userName))];
  $('#auditUser').innerHTML='<option value="">ผู้ใช้งานทุกคน</option>'+users.map(u=>`<option>${esc(u)}</option>`).join('');
  $('#auditDoc').innerHTML='';
  renderAudit(); openModal('mAudit');
}
function autoCrm(){
  if(!can('doc.crmEdit')) return toast('บัญชีนี้ไม่มีสิทธิแก้ไขนัดหมาย CRM');
  let add=0;
  DB.receipts.forEach(r=>{
    if(DB.crm.some(k=>k.refId===r.id&&k.type==='warranty')) return;
    const mos=Math.max(n(DB.shop.warrM)||3,...(r.items||[]).map(it=>n(it.warr)||0));
    const d=new Date(r.date+'T00:00:00'); d.setMonth(d.getMonth()+mos);
    DB.crm.push({id:uid(),custId:r.custId,vehIdx:r.vehIdx||0,type:'warranty',date:iso(d),owner:'',
      note:'ครบกำหนดตรวจเช็กตามเงื่อนไขรับประกัน '+mos+' เดือน หลังรับบริการตามใบเสร็จ '+r.no,
      refId:r.id,refNo:r.no,done:false,openedAt:iso()});
    add++;});
  save();renderCrm();renderHome();
  toast(add?('สร้างนัดตรวจเช็กตามระยะรับประกัน '+add+' รายการ'):'ทุกใบเสร็จมีนัดตรวจเช็กครบแล้ว');
}
$('#crmFilter').onchange=renderCrm;

/* ==========================================================
   พนักงาน · สิทธิการใช้งาน
   ========================================================== */
const PERM_TABS=[['home','00 · หน้าแรก (แดชบอร์ด)'],['crm','01 · ลูกค้าสัมพันธ์'],['prox','P1 · DriveGo ProX — Ecosystem'],['cust','02 · ข้อมูลลูกค้า'],
  ['quote','03 · ใบเสนอราคา / อนุมัติซ่อม'],['receipt','04 · ใบเสร็จรับเงิน / ใบกำกับภาษี'],['vendor','05 · ข้อมูลผู้ขาย'],
  ['buy','06 · รายจ่าย / ซื้อสินค้า'],['stock','07 · สต๊อกอะไหล่'],['acct','08 · บัญชี - การเงิน'],
  ['hr','09 · งานบุคคล'],['techroom','P2 · ห้องข้อมูลเทคนิค'],['setting','10 · ตั้งค่าองค์กร']];
const PERM_STOCK=[['code','ช่อง 1 · รหัสสินค้า (อู่)'],['oem','ช่อง 2 · รหัสอ้างอิง OEM'],['name','ช่อง 3 · ชื่อสินค้า'],
  ['cat','ช่องหมวดอะไหล่'],['cost','ช่อง 4 · ราคาซื้อ (ต้นทุน)'],['pa','ช่อง 5 · ราคาขาย A'],['pb','ราคาขาย B'],
  ['pc','ราคาขาย C'],['qty','ปริมาณสินค้าคงคลัง'],['minmax','ค่า Min – Max'],['lastmove','วันที่เคลื่อนไหวล่าสุด'],['loc','ช่องพื้นที่จัดเก็บ (LO)'],
  ['card','เปิดบัตรสินค้า / ประวัติผู้ขาย / เมนูเพิ่มเติม'],['img','อัปโหลด / แก้ไขรูปสินค้า'],
  ['edit','เพิ่ม / แก้ไขสินค้า'],['del','ลบสินค้า'],['summary','ดูสรุปมูลค่าคงคลังตามหมวด']];
const PERM_DOC=[['qApprove','ตัดสต๊อกตามใบเสนอราคา (4.4)'],['rIssue','บันทึก/ออกใบเสร็จและใบกำกับภาษี'],
  ['payRec','บันทึกรับชำระจากลูกหนี้'],['payGr','บันทึกชำระเงินเจ้าหนี้'],['fin','ดูสรุปการเงิน ภาษี และเงินเดือน'],
  ['crmEdit','เพิ่ม / แก้ไขนัดหมาย CRM'],['export','ส่งออกข้อมูล (ไฟล์สำรอง)'],['import','นำเข้าข้อมูลจากไฟล์ (ลูกค้า / สินค้า / ไฟล์สำรอง)'],['wipe','ล้างข้อมูลทั้งระบบ'],['homeMoney','ดูยอดเงินและมูลค่าในหน้าแรก'],['delDoc','ลบเอกสารและใบรับสินค้า'],
  ['emp','ดูและแก้ไขข้อมูลพนักงานและสิทธิใช้งาน'],['hrEdit','บันทึกงานบุคคล การลา และออกใบเตือน'],['acctEdit','บันทึกค่าใช้จ่าย สินทรัพย์ และเงินลงทุน'],
  /* ---- คีย์ที่เพิ่มรอบยกเครื่องสิทธิ์ ---- */
  ['docQuote','ออกและแก้ไขใบเสนอราคา'],
  ['editPrice','แก้ไขราคาขายในเอกสาร (อะไหล่ · ชุดอะไหล่ · ค่าแรง)'],
  ['docStock','ออกและแก้ไขใบเคลม / ใบเบิก / ใบตรวจนับ'],
  ['cancelDoc','ยกเลิกเอกสารการเงิน (ใบเสร็จ · ใบกำกับ · ใบวางบิล · ใบแจ้งหนี้ · ใบรับสินค้า)'],
  ['custEdit','เพิ่ม / แก้ไข / ลบข้อมูลลูกค้า'],
  ['venEdit','เพิ่ม / แก้ไข / ลบข้อมูลผู้ขาย'],
  ['orgEdit','แก้ไขตั้งค่าองค์กร · ภาษี · อายุการใช้งาน'],
  ['coa','จัดการผังบัญชีและการผูกบัญชี'],
  ['backup','สำรองและกู้คืนข้อมูลทั้งระบบ']];
/* ==========================================================
   สิทธิ์ระดับหมวดย่อย — เดิมเปิดหมวดใหญ่ = ได้หมวดย่อยทั้งพวง
   เช่น เปิด 08 ให้คนตามหนี้ เขาจะเห็นงบการเงิน เงินลงทุน รายงานภาษีไปด้วย
   รูปแบบ: [คีย์, ป้ายบนหน้าจอ, หมวดใหญ่, ตัวเลือกปุ่มแท็บ, ฟังก์ชันเด้งออกถ้าเปิดค้างอยู่]
   ========================================================== */
const PERM_SUB=[
  ['custList','02 · รายชื่อลูกค้า','cust','#custTabs button[data-c="list"]'],
  ['custGrade','02 · สรุปลูกค้าตามเกรดดาว','cust','#custTabs button[data-c="grade"]'],
  ['rcptDoc','04.1 · ใบแจ้งหนี้ / ใบเสร็จรับเงิน','receipt','#rOvTabs button[data-t="doc"]'],
  ['rcptBilling','04.2 · ใบวางบิล','receipt','#rOvTabs button[data-t="billing"]'],
  ['rcptRetail','04.4 · ตัดสต็อกสินค้า','receipt','#rOvTabs button[data-t="retail"]'],
  ['rcptTax','04.3 · ใบกำกับภาษี','receipt','#rOvTabs button[data-t="tax"]'],
  ['buyGr','06.1 · ซื้อสินค้า','buy','#buyTabs button[data-b="gr"]'],
  ['buyUtil','06.2 · ค่าน้ำค่าไฟ','buy','#buyTabs button[data-b="util"]'],
  ['buyAsset','06.3 · ซื้อสินทรัพย์','buy','#buyTabs button[data-b="asset"]'],
  ['buyPay','06.4 · จ่ายเงินเดือน','buy','#buyTabs button[data-b="pay"]'],
  ['buyOffice','06.5 · อุปกรณ์สำนักงาน','buy','#buyTabs button[data-b="office"]'],
  ['buyOther','06.6 · อื่น ๆ','buy','#buyTabs button[data-b="other"]'],
  ['stkStock','07 · ทะเบียนอะไหล่','stock','#stkTabs button[data-s="stock"]'],
  ['stkClaim','07 · เคลมผู้ขาย','stock','#stkTabs button[data-s="claim"]'],
  ['stkIssue','07 · เบิกใช้ภายใน','stock','#stkTabs button[data-s="issue"]'],
  ['stkKits','07 · ชุดอะไหล่ซ่อมบำรุง','stock','#stkTabs button[data-s="kits"]'],
  ['stkMove','07 · โอนสินค้าระหว่างสาขา','stock','#stkTabs button[data-s="move"]'],
  ['stkCClaim','07 · เคลมสินค้าลูกค้า','stock','#stkTabs button[data-s="cclaim"]'],
  ['stkCount','07 · ตรวจนับสินค้า','stock','#stkTabs button[data-s="count"]'],
  ['acctHealth','08 · สุขภาพการเงิน','acct','#acctTabs button[data-a="health"]'],
  ['acctAr','08 · ลูกหนี้ (ค้างรับ)','acct','#acctTabs button[data-a="ar"]'],
  ['acctAp','08 · เจ้าหนี้ (ค้างจ่าย)','acct','#acctTabs button[data-a="ap"]'],
  ['acctExp','08 · ค่าใช้จ่ายกิจการ','acct','#acctTabs button[data-a="exp"]'],
  ['acctAsset','08 · ทะเบียนสินทรัพย์','acct','#acctTabs button[data-a="asset"]'],
  ['acctCap','08 · เงินลงทุน / เงินสด','acct','#acctTabs button[data-a="cap"]'],
  ['acctTax','08 · รายงานภาษี','acct','#acctTabs button[data-a="tax"]'],
  ['acctCoa','08 · ผังบัญชี','acct','#acctTabs button[data-a="coa"]'],
  ['acctFs','08 · งบการเงิน','acct','#acctTabs button[data-a="fs"]'],
  ['hrSum','09 · สรุปรายเดือน','hr','#hrTabs button[data-h="sum"]'],
  ['hrRec','09 · บันทึกการทำงานและการลา','hr','#hrTabs button[data-h="rec"]'],
  ['hrLoad','09 · ปริมาณงานซ่อมสะสม','hr','#hrTabs button[data-h="load"]'],
  ['hrWarn','09 · ใบเตือน','hr','#hrTabs button[data-h="warn"]']
];
/* ==========================================================
   ตารางสิทธิ์รายหน้า × การกระทำ (สำเนาทดสอบ)
   perms.m['<row>_<act>'] คือแหล่งจริงของสิทธิ์ในตาราง; คีย์เดิม (tabs/sub/doc/apv/stock) ที่ตารางครอบคลุม
   จะถูกคำนวณจากตารางตอนบันทึกพนักงาน (pkgPermDerive) เพื่อให้โค้ดเดิมที่เรียก can('doc.xxx') ยังทำงานเหมือนเดิม
   และถ้าถอดฟีเจอร์นี้ออก คีย์เดิมในข้อมูลก็ยังถูกต้องครบ
   การกระทำที่แยกละเอียดกว่าคีย์เดิม (เพิ่ม/แก้ไข/ยกเลิก/พิมพ์/เฉพาะของตนเอง) ถูกตรวจซ้ำที่ฟังก์ชันใน perm-matrix.js
   ========================================================== */
const PERM_ACTS=[['view','เข้าดู'],['add','เพิ่ม'],['edit','แก้ไข'],['apv','อนุมัติ'],['cancel','ยกเลิก / ลบ'],['print','พิมพ์เอกสาร'],['export','ส่งออกข้อมูล'],['own','เฉพาะของตนเอง']];   /* ส่งออก = ปุ่ม Excel / PDF เหนือทะเบียน แยกจากพิมพ์เอกสาร (ผู้ใช้ 1 ต.ค. 2569) */
/* แต่ละการกระทำ: [] = ตรวจด้วยกติกาใหม่เท่านั้น, ['doc.x',...] = ผูกกับคีย์เดิมด้วย; ไม่มีฟิลด์ = ไม่มีช่องนี้ในแถว */
const PERM_M=[
  {k:'home',l:'00 · หน้าแรก (แดชบอร์ด)',tab:'home'},
  {k:'crm',l:'01 · ลูกค้าสัมพันธ์ / นัดหมาย',tab:'crm',add:['doc.crmEdit'],edit:['doc.crmEdit'],print:[],export:[]},
  {k:'prox',l:'P1 · DriveGo ProX — Ecosystem',tab:'prox'},
  {k:'custList',l:'02 · รายชื่อลูกค้า',tab:'cust',sub:'custList',add:['doc.custEdit'],edit:['doc.custEdit'],cancel:['doc.custEdit'],print:[],export:[]},
  {k:'custGrade',l:'02 · สรุปลูกค้าตามเกรดดาว',tab:'cust',sub:'custGrade'},
  {k:'quote',l:'03 · ใบเสนอราคา / อนุมัติซ่อม',tab:'quote',add:['doc.docQuote'],edit:['doc.docQuote'],apv:['apv.quote'],cancel:['doc.cancelDoc','doc.delDoc'],print:[],export:[],own:[],doc:1},
  {k:'rcptDoc',l:'04.1 · ใบแจ้งหนี้ / ใบเสร็จรับเงิน',tab:'receipt',sub:'rcptDoc',add:['doc.rIssue'],edit:['doc.rIssue'],apv:['apv.receipt','apv.invoice'],cancel:['doc.cancelDoc','doc.delDoc'],print:[],export:[],own:[],doc:1},
  {k:'rcptBilling',l:'04.2 · ใบวางบิล',tab:'receipt',sub:'rcptBilling',add:['doc.rIssue'],edit:['doc.rIssue'],apv:['apv.billing'],cancel:['doc.cancelDoc','doc.delDoc'],print:[],export:[],doc:1},
  {k:'rcptTax',l:'04.3 · ใบกำกับภาษี',tab:'receipt',sub:'rcptTax',apv:['apv.tax'],print:[],export:[]},
  /* 4.4 ตัดสต็อกสินค้า (2026-10-03: 4.4 ขายหน้าร้าน + 4.5 ตัดสต็อก รวมเป็นหน้าเดียว) — เพิ่ม = เปิดใบตัดสต็อก / ชำระเงิน
     (ขายหน้าร้าน หรือดึงใบเสนอราคาที่อนุมัติแล้ว) · ยกเลิก = ยกเลิกใบตัดสต็อก ของคืนเข้าสต๊อก
     พนักงานเดิม: ได้ “เพิ่ม” ถ้าเคยออกบิลขายหน้าร้าน (doc.rIssue) หรือเคยตัดสต๊อกตามใบเสนอราคา (doc.qApprove) */
  {k:'rcptCut',l:'04.4 · ตัดสต็อกสินค้า',tab:'receipt',sub:'rcptRetail',add:[],edit:[],cancel:[],print:[],export:[],own:[],doc:1},
  {k:'vendor',l:'05 · ข้อมูลผู้ขาย',tab:'vendor',add:['doc.venEdit'],edit:['doc.venEdit'],cancel:['doc.venEdit'],print:[],export:[]},
  {k:'buyGr',l:'06.1 · ซื้อสินค้า (ใบรับสินค้า)',tab:'buy',sub:'buyGr',add:[],edit:[],apv:['apv.gr'],cancel:['doc.cancelDoc','doc.delDoc'],print:[],export:[],doc:1},
  {k:'buyUtil',l:'06.2 · ค่าน้ำค่าไฟ',tab:'buy',sub:'buyUtil',print:[],export:[]},
  {k:'buyAsset',l:'06.3 · ซื้อสินทรัพย์',tab:'buy',sub:'buyAsset',print:[],export:[]},
  {k:'buyPay',l:'06.4 · จ่ายเงินเดือน',tab:'buy',sub:'buyPay'},
  {k:'buyOffice',l:'06.5 · อุปกรณ์สำนักงาน',tab:'buy',sub:'buyOffice',print:[],export:[]},
  {k:'buyOther',l:'06.6 · อื่น ๆ',tab:'buy',sub:'buyOther',print:[],export:[]},
  {k:'stkStock',l:'07 · ทะเบียนอะไหล่',tab:'stock',sub:'stkStock',add:['stock.edit'],edit:['stock.edit'],cancel:['stock.del'],print:[],export:[]},
  {k:'stkClaim',l:'07 · เคลมผู้ขาย',tab:'stock',sub:'stkClaim',add:['doc.docStock'],edit:['doc.docStock'],apv:['apv.claim'],cancel:['doc.delDoc'],print:[],export:[],doc:1},
  {k:'stkIssue',l:'07 · เบิกใช้ภายใน',tab:'stock',sub:'stkIssue',add:['doc.docStock'],edit:['doc.docStock'],apv:['apv.issue'],cancel:['doc.delDoc'],print:[],export:[],doc:1},
  {k:'stkCount',l:'07 · ตรวจนับสินค้า',tab:'stock',sub:'stkCount',add:['doc.docStock'],edit:['doc.docStock'],apv:['apv.count'],cancel:['doc.delDoc'],print:[],export:[],doc:1},
  {k:'stkKits',l:'07 · ชุดอะไหล่ซ่อมบำรุง',tab:'stock',sub:'stkKits',add:[],edit:[],print:[],export:[]},
  {k:'stkMove',l:'07 · โอนสินค้าระหว่างสาขา',tab:'stock',sub:'stkMove',add:[],cancel:[],print:[],export:[]},
  {k:'stkCClaim',l:'07 · เคลมสินค้าลูกค้า',tab:'stock',sub:'stkCClaim',add:['doc.docStock'],cancel:['doc.delDoc'],print:[],export:[]},
  {k:'acctHealth',l:'08 · สุขภาพการเงิน',tab:'acct',sub:'acctHealth'},
  {k:'acctAr',l:'08 · ลูกหนี้ (ค้างรับ)',tab:'acct',sub:'acctAr',print:[],export:[]},
  {k:'acctAp',l:'08 · เจ้าหนี้ (ค้างจ่าย)',tab:'acct',sub:'acctAp',print:[],export:[]},
  {k:'acctExp',l:'08 · ค่าใช้จ่ายกิจการ',tab:'acct',sub:'acctExp',print:[],export:[]},
  {k:'acctAsset',l:'08 · ทะเบียนสินทรัพย์',tab:'acct',sub:'acctAsset',print:[],export:[]},
  {k:'acctCap',l:'08 · เงินลงทุน / เงินสด',tab:'acct',sub:'acctCap'},
  {k:'acctTax',l:'08 · รายงานภาษี',tab:'acct',sub:'acctTax'},
  {k:'acctCoa',l:'08 · ผังบัญชี',tab:'acct',sub:'acctCoa'},
  {k:'acctFs',l:'08 · งบการเงิน',tab:'acct',sub:'acctFs'},
  {k:'hrSum',l:'09 · สรุปรายเดือน',tab:'hr',sub:'hrSum'},
  {k:'hrRec',l:'09 · บันทึกการทำงานและการลา',tab:'hr',sub:'hrRec',print:[],export:[]},
  {k:'hrLoad',l:'09 · ปริมาณงานซ่อมสะสม',tab:'hr',sub:'hrLoad'},
  {k:'hrWarn',l:'09 · ใบเตือน',tab:'hr',sub:'hrWarn',print:[],export:[]},
  {k:'techroom',l:'P2 · ห้องข้อมูลเทคนิค',tab:'techroom'},
  {k:'setting',l:'10 · ตั้งค่าองค์กร',tab:'setting',print:[],export:[]},
  /* เมนู 11 (หมวดชั่วคราว) — tab 'uiset' ไม่มีคีย์เดิม: ชุดสิทธิ์สำเร็จรูป/ข้อมูลเดิมจึงไม่ได้สิทธิ์นี้อัตโนมัติ ต้องให้เอง */
  {k:'qPreset',l:'11.2 · ทะเบียนปัญหา (ใช้ในใบเสนอราคา)',tab:'uiset',edit:[]}
].filter(r=>!r.sub||PERM_SUB.some(([k])=>k===r.sub));
/* คีย์เดิมที่ตารางเป็นเจ้าของ — กล่องสิทธิ์แบบเดิมจะซ่อนคีย์เหล่านี้ */
function pkgPermOwned(){
  const set=new Set();
  PERM_M.forEach(r=>{set.add('tabs.'+r.tab);if(r.sub)set.add('sub.'+r.sub);
    PERM_ACTS.forEach(([a])=>(Array.isArray(r[a])?r[a]:[]).forEach(k=>set.add(k)));});
  return set;
}
const pkgPermGet=(p,path)=>{const [g,k]=path.split('.');return !!(p&&p[g]&&p[g][k]);};
/* คีย์เดิม → ตาราง (ใช้ตอนย้ายข้อมูลพนักงานเดิมและชุดสิทธิ์สำเร็จรูป): สิ่งที่เคยทำได้ ต้องทำได้ต่อ */
function pkgPermFromLegacy(p){
  const m={};
  /* ชุดสิทธิ์สำเร็จรูปเดิมเปิดเมนูหลักแต่ไม่เคยเปิดหมวดย่อย (เข้าเมนูได้แต่ไม่มีหน้าใดใช้ได้)
     เมนูหลักที่เปิดอยู่แต่หมวดย่อยปิดทั้งหมด จึงถือว่าให้ทุกหมวดย่อยของเมนูนั้น */
  const allSubsOff=tab=>PERM_SUB.filter(x=>x[2]===tab).every(([k])=>!pkgPermGet(p,'sub.'+k));
  PERM_M.forEach(r=>{
    const view=pkgPermGet(p,'tabs.'+r.tab)&&(!r.sub||pkgPermGet(p,'sub.'+r.sub)||allSubsOff(r.tab));
    m[r.k+'_view']=view;
    PERM_ACTS.forEach(([a])=>{
      if(a==='view'||!Array.isArray(r[a]))return;
      let v;
      if(a==='print')v=view;
      else if(a==='own'||a==='export')v=false;   /* ส่งออกข้อมูลไม่ให้อัตโนมัติ — เจ้าของติ๊กให้เอง */
      else if(r[a].length)v=view&&r[a].every(k=>pkgPermGet(p,k));
      else if(r.k==='stkKits'||r.k==='stkMove')v=view&&pkgPermGet(p,'stock.edit');
      else if(r.k==='rcptCut'&&a==='edit')v=view&&pkgPermGet(p,'doc.editPrice');   /* แก้ไข = ปรับเพิ่ม / ลดยอดใบตัดสต็อก (ระบบขายแบบใหม่) — เฉพาะผู้มีสิทธิ์แก้ราคา ไม่ผูกคีย์ doc.editPrice เข้าตาราง */
      else if(r.k==='rcptCut')v=view&&(pkgPermGet(p,'doc.qApprove')||(a==='add'?pkgPermGet(p,'doc.rIssue'):pkgPermGet(p,'doc.cancelDoc')&&pkgPermGet(p,'doc.delDoc')));
      else v=view;                                   /* เช่น ใบรับสินค้าเดิมไม่มีการตรวจสิทธิ์ */
      m[r.k+'_'+a]=!!v;
    });
  });
  return m;
}
/* ตาราง → คีย์เดิม: คีย์เดิมเปิดเมื่อมีช่องใดในตารางที่ผูกกับคีย์นั้นเปิดอยู่ */
function pkgPermDerive(p){
  if(!p||!p.m)return p;
  ['tabs','sub','doc','apv','stock'].forEach(g=>{if(!p[g])p[g]={};});
  const owned=pkgPermOwned(),on={};
  PERM_M.forEach(r=>{
    const view=!!p.m[r.k+'_view'];
    if(view){on['tabs.'+r.tab]=true;if(r.sub)on['sub.'+r.sub]=true;}
    PERM_ACTS.forEach(([a])=>{if(a!=='view'&&Array.isArray(r[a])&&view&&p.m[r.k+'_'+a])r[a].forEach(k=>on[k]=true);});
  });
  owned.forEach(path=>{const [g,k]=path.split('.');p[g][k]=!!on[path];});
  return p;
}

function blankPerms(v){ const p={tabs:{},stock:{},doc:{},apv:{},sub:{},m:{}};
  PERM_TABS.forEach(([k])=>p.tabs[k]=v); PERM_STOCK.forEach(([k])=>p.stock[k]=v);
  PERM_DOC.forEach(([k])=>p.doc[k]=v); PERM_APV.forEach(([k])=>p.apv[k]=v);
  PERM_SUB.forEach(([k])=>p.sub[k]=v);
  PERM_M.forEach(r=>PERM_ACTS.forEach(([a])=>{ if(a==='view'||Array.isArray(r[a])) p.m[r.k+'_'+a]=a==='own'?false:v; }));
  return p; }
/* ย้ายข้อมูลพนักงานเดิมให้รู้จักคีย์ใหม่ — ทำครั้งเดียวตอนเปิดระบบ
   หลักการ: สิ่งที่เขาเคยทำได้ต้องทำได้ต่อ (ไม่มีใครทำงานไม่ได้เช้าวันจันทร์)
   ยกเว้น 3 ตัวอ่อนไหว (ตั้งค่าองค์กร · กู้คืนข้อมูล · ยกเลิกเอกสารการเงิน) ปิดไว้ก่อนให้เจ้าของเปิดเอง */
function migratePerms(){
  let changed=false;
  (DB.emp||[]).forEach(e=>{
    if(!e.perms) return;
    const t=e.perms.tabs||{}, d=e.perms.doc||(e.perms.doc={});
    const setIf=(k,v)=>{ if(d[k]===undefined){ d[k]=!!v; changed=true; } };
    setIf('docQuote',t.quote); setIf('docStock',t.stock); setIf('editPrice',d.docQuote||d.rIssue||t.quote||t.receipt);
    setIf('custEdit',t.cust); setIf('venEdit',t.vendor); setIf('coa',t.acct);
    setIf('cancelDoc',false); setIf('orgEdit',false); setIf('backup',false);
    if(!e.perms.sub){ e.perms.sub={}; changed=true; }
    PERM_SUB.forEach(([k,,parent])=>{ if(e.perms.sub[k]===undefined){ e.perms.sub[k]=!!t[parent]; changed=true; } });
    setIf('import',d.export); setIf('wipe',d.export); setIf('homeMoney',d.fin||t.acct);
    if(!e.perms.m){ e.perms.m=pkgPermFromLegacy(e.perms); changed=true; }
    else PERM_M.forEach(r=>PERM_ACTS.forEach(([a])=>{ const k=r.k+'_'+a; if((a==='view'||Array.isArray(r[a]))&&e.perms.m[k]===undefined){ e.perms.m[k]=!!pkgPermFromLegacy(e.perms)[k]; changed=true; } }));
  });
  if(changed) save();
}
function curEmp(){ return DB.curEmp?DB.emp.find(e=>e.id===DB.curEmp):null; }
function can(path){ const e=curEmp(); if(!e) return true;
  const [g,k]=path.split('.'); return !!(e.perms&&e.perms[g]&&e.perms[g][k]); }
/* ถ้าหน้าย่อยที่เปิดค้างอยู่ถูกปิดสิทธิ์ ให้ย้ายไปหน้าแรกที่ยังเข้าได้ในหมวดเดียวกัน
   ไม่ปล่อยให้ค้างอยู่หน้าที่ไม่มีสิทธิ์ (กันข้อมูลโผล่ผ่านหน้าที่เปิดทิ้งไว้) */
function subGuard(){
  const groups=[
    ['cust',()=>typeof custPane!=='undefined'&&custPane,v=>custGo(v),{list:'custList',grade:'custGrade'}],
    ['receipt',()=>typeof rOvPane!=='undefined'&&rOvPane,v=>rOvGo(v),{doc:'rcptDoc',billing:'rcptBilling',tax:'rcptTax',retail:'rcptRetail'}],
    ['buy',()=>typeof buyPane!=='undefined'&&buyPane,v=>buyGo(v),{gr:'buyGr',util:'buyUtil',asset:'buyAsset',pay:'buyPay',office:'buyOffice',other:'buyOther'}],
    ['stock',()=>typeof stkPane!=='undefined'&&stkPane,v=>stkGo(v),{stock:'stkStock',claim:'stkClaim',issue:'stkIssue',count:'stkCount',kits:'stkKits',move:'stkMove',cclaim:'stkCClaim'}],
    ['acct',()=>typeof acctPane!=='undefined'&&acctPane,v=>acctGo(v),{health:'acctHealth',ar:'acctAr',ap:'acctAp',exp:'acctExp',asset:'acctAsset',cap:'acctCap',tax:'acctTax',coa:'acctCoa',fs:'acctFs'}],
    ['hr',()=>typeof hrPane!=='undefined'&&hrPane,v=>hrGo(v),{sum:'hrSum',rec:'hrRec',load:'hrLoad',warn:'hrWarn'}]
  ];
  groups.forEach(([,getCur,goFn,map])=>{
    const cur=getCur(); if(!cur||!map[cur]) return;
    if(can('sub.'+map[cur])) return;
    const first=Object.keys(map).find(v=>can('sub.'+map[v]));
    if(first) try{ goFn(first); }catch(e){}
  });
}
function applyPerms(){
  /* ถ้าบัญชีที่กำลังใช้งานอยู่ถูกปิด (หรือถูกลบ) ให้เด้งกลับโหมดเจ้าของกิจการทันที
     ไม่ปล่อยให้ทำงานต่อด้วยสิทธิเดิมค้างอยู่ */
  if(DB.curEmp && !empActive(DB.emp.find(x=>x.id===DB.curEmp))){
    DB.curEmp=''; save(); toast('บัญชีที่ใช้งานอยู่ถูกปิดการใช้งาน — กลับสู่โหมดเจ้าของกิจการ');
  }
  const e=curEmp();
  PERM_TABS.forEach(([k])=>{const b=document.querySelector('#tabs button[data-v="'+k+'"]');
    if(b) b.style.display=can('tabs.'+k)?'':'none'});
  const css=PERM_STOCK.filter(([k])=>!can('stock.'+k)).map(([k])=>'.sc-'+k+'{display:none!important}')
    .concat(PERM_DOC.filter(([k])=>!can('doc.'+k)).map(([k])=>'.pc-'+k+'{display:none!important}'));
  let sty=$('#permStyle');
  if(!sty){sty=document.createElement('style');sty.id='permStyle';document.head.appendChild(sty)}
  sty.textContent=css.join('\n');
  /* หมวดย่อย — ซ่อนปุ่มแท็บที่ไม่มีสิทธิ์ และถ้ากำลังเปิดค้างอยู่ให้เด้งไปหน้าแรกที่เข้าได้ */
  PERM_SUB.forEach(([k,,,sel])=>{ const b=document.querySelector(sel);
    if(b) b.style.display=can('sub.'+k)?'':'none'; });
  subGuard();
  /* สรุปการเงิน/ภาษี/เงินเดือน — คีย์ doc.fin ที่เดิมประกาศไว้เฉย ๆ ไม่เคยถูกใช้ */
  [['#taxHomeBox','fin'],['#ssoHomeBox','fin']].forEach(([sel,k])=>{
    const el=document.querySelector(sel); if(el) el.style.display=can('doc.'+k)?'':'none'; });
  const eb=$('#empBlock'); if(eb) eb.style.display=can('doc.emp')?'':'none';
  const cur=$$('section.view.on')[0];
  if(cur&&!can('tabs.'+cur.id.slice(2))){ const first=PERM_TABS.find(([k])=>can('tabs.'+k)); if(first) go(first[0]); }
  $('#curUser').value=DB.curEmp||'';
  document.title=(e?e.name+' · ':'')+'ระบบบริหารงานอู่ซ่อมรถ';
}
/* ==========================================================
   สถานะบัญชีพนักงาน — ลาออกแล้วให้ "ปิดบัญชี" ไม่ใช่ลบทิ้ง
   ----------------------------------------------------------
   เอกสารเก่าอ้างชื่อพนักงานไว้ (ผู้บันทึก · ผู้อนุมัติ · ช่างผู้ประเมิน · ผู้เบิก)
   ถ้าลบข้อมูลออก การตรวจสอบย้อนหลังจะหาต้นทางไม่เจอ
   ฝั่งหลังบ้าน: is_active + resigned_at — ตอนล็อกอินต้องเช็ค is_active ด้วยเสมอ
   ========================================================== */
function empActive(e){ return !!e && e.active!==false; }
function empActiveList(){ return DB.emp.filter(empActive); }
/* รายชื่อพนักงานที่ "อยู่ในงวดเดือนนั้นจริง" — เริ่มงานไม่เกินสิ้นเดือน และยังไม่ลาออกก่อนต้นเดือน
   ใช้กับรายงานภาษี/ประกันสังคมที่ต้องย้อนดูงวดเก่าได้ (เดิมใช้รายชื่อวันนี้ ทุกงวดเลยได้เลขเดียวกัน) */
function empListOfMonth(mo){
  if(!mo) return empActiveList();
  const first=mo+'-01', last=mo+'-31';
  return DB.emp.filter(e=>{
    const st=String(e.start||''), lv=String(e.leftDate||'');
    if(st&&st>last) return false;              /* ยังไม่เข้าทำงานในงวดนี้ */
    if(lv&&lv<first) return false;             /* ลาออกไปก่อนงวดนี้ */
    if(!lv&&!empActive(e)) return false;       /* ปิดบัญชีแต่ไม่ระบุวันลาออก — ไม่นับ */
    return true;
  });
}
function ssoSummaryOf(mo){ return empListOfMonth(mo).reduce((a,e)=>{const x=ssoOf(e);
  return {gross:a.gross+x.gross,emp:a.emp+x.emp,er:a.er+x.er,total:a.total+x.emp+x.er}},{gross:0,emp:0,er:0,total:0}); }
function fillUserSelect(){
  /* คนที่ปิดบัญชีแล้วต้องไม่โผล่ในช่องเข้าใช้งาน — กันไว้ตั้งแต่ไม่ให้เลือก */
  $('#curUser').innerHTML='<option value="">เจ้าของกิจการ / ผู้ดูแลระบบ</option>'+
    empActiveList().map(e=>`<option value="${e.id}">${esc(e.code)} · ${esc(e.name)}${e.position?' ('+esc(e.position)+')':''}</option>`).join('');
  $('#curUser').value=DB.curEmp||'';
}
$('#curUser').onchange=async()=>{
  const id=$('#curUser').value;
  if(!id){ if(DB.emp.length&&DB.curEmp&&!await askP({title:'สลับผู้ใช้งาน',text:'กลับสู่โหมดเจ้าของกิจการ (เห็นทุกเมนู)?',yes:'สลับ',no:'ไม่สลับ'})){$('#curUser').value=DB.curEmp;return} }
  else { const e=DB.emp.find(x=>x.id===id);
    /* ด่านกันในฟังก์ชัน ไม่ใช่แค่ซ่อนตัวเลือก */
    if(!empActive(e)){ toast('บัญชีนี้ถูกปิดการใช้งานแล้ว เข้าระบบไม่ได้'); $('#curUser').value=DB.curEmp||''; return; }
    if(e&&e.pin){ const p=await askPromptP({title:'ยืนยันตัวตน',text:'ใส่รหัสผ่าน 4 หลักของ '+e.name,yes:'เข้าใช้งาน',no:'ยกเลิก'}); if(!(await window.storage.checkSecret(KEY,'DB.emp',e.id,'pin',p))){toast('รหัสผ่านไม่ถูกต้อง');$('#curUser').value=DB.curEmp||'';return} } }
  DB.curEmp=id; save(); applyPerms(); renderStock(); renderHome();
  toast(id?('เข้าใช้งานในนาม '+(DB.emp.find(x=>x.id===id)||{}).name):'กลับสู่โหมดผู้ดูแลระบบ');
};
function tenure(start){ if(!start) return '-';
  const d=daysBetween(start,iso()); if(d<0) return '-';
  const y=Math.floor(d/365), m=Math.floor((d%365)/30);
  return (y?y+' ปี ':'')+m+' เดือน'; }
function ssoOf(e){
  const rate=n(DB.shop.ssoRate||5), lo=n(DB.shop.ssoMin||1650), hi=n(DB.shop.ssoMax||15000), cap=n(DB.shop.ssoCap||750);
  const gross=n(e.salary)+n(e.ot)+n(e.bonus);
  if(!n(e.salary)) return {gross,base:0,emp:0,er:0};
  const base=Math.min(Math.max(n(e.salary),lo),hi);
  const amt=Math.min(Math.round(base*rate/100),cap);
  return {gross,base,emp:amt,er:amt};
}
function ssoSummary(){ return empActiveList().reduce((a,e)=>{const x=ssoOf(e);
  return {gross:a.gross+x.gross,emp:a.emp+x.emp,er:a.er+x.er,total:a.total+x.emp+x.er}},{gross:0,emp:0,er:0,total:0}); }
function permCount(e){ let on=0,all=0;
  ['tabs','stock','doc','apv'].forEach(g=>Object.values((e.perms||{})[g]||{}).forEach(v=>{all++;if(v)on++}));
  return on+'/'+all; }
function renderEmp(){
  const q=($('#empSearch').value||'').toLowerCase().trim();
  let rows=DB.emp.filter(e=>!q||[e.code,e.name,e.position,e.idcard].some(x=>String(x||'').toLowerCase().includes(q)));
  rows=sortRows('empTbl',rows);   /* กดหัวคอลัมน์เพื่อเรียง */
  $('#empTbl tbody').innerHTML=rows.map(e=>{const x=ssoOf(e);
    const off=!empActive(e);
    return `<tr${off?' class="cancelrow"':''}><td class="mono"><b>${esc(e.code)}</b></td>
      <td>${esc(e.name)}${off?` <span class="chip r">ลาออกแล้ว</span><div class="hint">พ้นสภาพ ${thDate(e.leftDate)}${e.leftNote?' · '+esc(e.leftNote):''}</div>`:''}${e.tel?`<div class="hint mono">${esc(e.tel)}</div>`:''}</td>
      <td class="ctr">${e.age||'-'}</td><td class="mono" style="font-size:12px">${esc(e.idcard||'-')}</td>
      <td>${esc(e.position||'-')}<div class="hint">${esc(e.edu||'')}${e.hospital?' · รพ. '+esc(e.hospital):''}</div></td>
      <td class="ctr" style="white-space:nowrap">${tenure(e.start)}</td><td class="num">${money(e.salary)}</td>
      <td class="num">${money(x.gross)}<div class="hint">OT ${money(e.ot)} · พิเศษ ${money(e.bonus)}</div></td>
      <td class="ctr"><span class="chip ${permCount(e).split('/')[0]==='0'?'r':'b'}">${permCount(e)}</span></td>
      ${byCell(e)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
        <button class="btn sm gh" onclick="openEmp('${e.id}')">แก้ไข / สิทธิ</button>
        <button class="btn sm dgr" onclick="delEmp('${e.id}')">ลบ</button></div></td></tr>`}).join('');
  $('#empEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('empTbl');
  const off=rows.filter(e=>!empActive(e)).length;
  $('#empCount').textContent=(rows.length-off)+' คน'+(off?' · ลาออกแล้ว '+off+' คน':'');
  fillUserSelect();
}
$('#empSearch').oninput=renderEmp;
let editEmpId=null;
function permBoxes(){
  const e=editEmpId?DB.emp.find(x=>x.id===editEmpId):null, p=(e&&e.perms)||blankPerms(false);
  const mk=(list,grp,tgt)=>$(tgt).innerHTML=list.map(([k,label])=>
    `<label><input type="checkbox" class="pk" data-g="${grp}" data-k="${k}" ${p[grp]&&p[grp][k]?'checked':''}> ${label}</label>`).join('');
  mk(PERM_TABS,'tabs','#permTabs'); mk(PERM_STOCK,'stock','#permStock'); mk(PERM_DOC,'doc','#permDoc');
  mk(PERM_APV,'apv','#permApv'); mk(PERM_SUB,'sub','#permSub');
  permSubCount();
}
/* กล่องหมวดย่อยยาว 28 ช่อง — พับไว้ก่อน กางเมื่ออยากลงรายละเอียด */
function permSubTg(h){
  const box=$('#permSub'), ch=$('#permSubCh'); if(!box) return;
  const open=box.style.display==='none';
  box.style.display=open?'':'none';
  if(ch) ch.textContent=open?'▾ พับเก็บ':'▸ กางดู';
}
function permSubCount(){
  const el=$('#permSubCnt'); if(!el) return;
  const on=$$('#permSub .pk').filter(x=>x.checked).length, all=$$('#permSub .pk').length;
  el.textContent='· เปิดอยู่ '+on+' จาก '+all+' หน้า';
}
document.addEventListener('change',e=>{ if(e.target&&e.target.classList&&e.target.classList.contains('pk')) permSubCount(); });
/* ชุดสิทธิ์สำเร็จรูปตามตำแหน่ง — แหล่งเดียว ใช้ทั้งปุ่มในฟอร์มพนักงานและข้อมูลตัวอย่าง:
   mgr   ผู้จัดการอู่      ทุกเมนู ทุกสิทธิ์ ทุกการอนุมัติ ยกเว้น ส่งออก/ล้างข้อมูล (ของเจ้าของ)
   front ธุรการหน้าร้าน    ลูกค้า/ใบเสนอราคา/ใบเสร็จ + รับชำระ + นัดหมาย · เห็นราคาขาย ไม่เห็นทุน · ไม่มีอนุมัติ/ยกเลิก
   tech  ช่างซ่อม          ดูใบงานและสต๊อก (ไม่เห็นราคาทุน-ราคาขาย) · ไม่แตะเงิน ไม่มีอนุมัติ
   lead  หัวหน้าช่าง       เหมือนช่าง + อนุมัติใบเสนอราคา + อนุมัติซ่อม/ตัดสต๊อก + นัดหมายลูกค้า
   stk   คลังอะไหล่        สต๊อกเต็มทุกช่อง + ซื้อสินค้า/ผู้ขาย + อนุมัติใบรับ/เบิก/นับ/เคลม · ไม่แตะเงินรับ-จ่าย
   acc   บัญชีการเงิน      เอกสารเงินทุกใบ รับ-จ่าย สรุปการเงิน บันทึกค่าใช้จ่าย + อนุมัติใบเสร็จ/ใบกำกับ/วางบิล/ใบแจ้งหนี้
   cash  แคชเชียร์         รับชำระจากลูกหนี้อย่างเดียว
   apv   หัวหน้าฝ่ายอนุมัติ อนุมัติเอกสารได้ทุกประเภท แต่ไม่ทำเอกสารเอง
   audit ผู้ตรวจสอบ        เห็นทุกเมนู ทุกตัวเลข รวมสรุปการเงิน — ทำอะไรไม่ได้เลย */
function presetPerms(kind){
  const p=blankPerms(kind==='all'||kind==='mgr');
  const on=(g,keys)=>keys.forEach(k=>{if(k in p[g]) p[g][k]=true});
  if(kind==='mgr') p.doc.export=false;
  if(kind==='front'){ on('tabs',['home','crm','cust','quote','receipt']);
    on('stock',['code','oem','name','cat','loc','qty','lastmove','pa','pb','pc']);
    on('doc',['rIssue','payRec','crmEdit']); }
  if(kind==='tech'||kind==='lead'){ on('tabs',['home','cust','quote','stock']);
    on('stock',['code','oem','name','cat','loc','qty','minmax','lastmove','card']); }
  if(kind==='lead'){ on('tabs',['crm']); on('doc',['qApprove','crmEdit']); on('apv',['quote']); }
  if(kind==='stk'){ on('tabs',['home','stock','buy','vendor']);
    PERM_STOCK.forEach(([k])=>p.stock[k]=true);
    on('apv',['gr','claim','issue','count']); }
  if(kind==='acc'){ on('tabs',['home','crm','cust','quote','receipt','vendor','buy','stock','acct']);
    on('stock',['code','oem','name','cat','loc','cost','pa','pb','pc','qty','minmax','lastmove','card','summary']);
    on('doc',['rIssue','payRec','payGr','fin','acctEdit','delDoc','crmEdit']);
    on('apv',['receipt','tax','billing','invoice']); }
  if(kind==='cash'){ on('tabs',['home','receipt']); on('doc',['payRec']); }
  if(kind==='apv'){ on('tabs',['home','cust','quote','receipt','buy','stock']);
    on('stock',['code','oem','name','cat','qty','lastmove']);
    PERM_APV.forEach(([k])=>p.apv[k]=true); }
  if(kind==='audit'){ PERM_TABS.forEach(([k])=>p.tabs[k]=true);
    on('stock',['code','oem','name','cat','cost','pa','pb','pc','qty','minmax','lastmove','loc','card','summary']);
    on('doc',['fin']); }
  if(kind!=='all'&&kind!=='mgr') p.doc.homeMoney=!!(p.doc.fin||p.tabs.acct);
  if(kind==='mgr'){ p.doc.import=false; p.doc.wipe=false; }
  if(kind==='stk'||kind==='tech'||kind==='lead'){ p.tabs.receipt=true; p.sub.rcptRetail=true; }
  if(kind==='stk') p.doc.qApprove=true;
  p.m=pkgPermFromLegacy(p);
  if(kind==='tech'&&p.m) p.m.rcptCut_print=false;
  if(kind==='acc'&&p.m) p.m.rcptCut_export=true;
  return p;
}
function permPreset(kind){
  const p=presetPerms(kind);
  $$('.pk').forEach(el=>{el.checked=!!(p[el.dataset.g]&&p[el.dataset.g][el.dataset.k])});
  const names={all:'เลือกสิทธิทั้งหมด',none:'ล้างสิทธิทั้งหมด',
    mgr:'ชุดผู้จัดการอู่ — ทุกสิทธิ์ ยกเว้นส่งออก/ล้างข้อมูล',
    front:'ชุดธุรการหน้าร้าน — เปิดบิล รับชำระ นัดหมาย (ไม่มีอนุมัติ/ยกเลิก)',
    tech:'ชุดช่างซ่อม — ดูใบงานและสต๊อก ไม่เห็นราคา ไม่แตะเงิน',
    lead:'ชุดหัวหน้าช่าง — ช่าง + อนุมัติใบเสนอราคา/อนุมัติซ่อมตัดสต๊อก',
    stk:'ชุดคลังอะไหล่ — สต๊อกเต็ม + อนุมัติใบรับ/เบิก/นับ/เคลม',
    acc:'ชุดบัญชีการเงิน — การเงินเต็ม + อนุมัติใบเสร็จ/ใบกำกับ/วางบิล',
    cash:'ชุดแคชเชียร์ — รับชำระอย่างเดียว',
    apv:'ชุดหัวหน้าฝ่ายอนุมัติ — อนุมัติทุกเอกสาร ไม่ทำเอกสารเอง',
    audit:'ชุดผู้ตรวจสอบ — เห็นทุกเมนู ทำอะไรไม่ได้'};
  toast(names[kind]||'ใช้ชุดสิทธิสำเร็จรูปแล้ว');
}
function openEmp(id){
  editEmpId=id||null; const e=id?DB.emp.find(x=>x.id===id):null;
  $('#mEmpTitle').textContent=e?('แก้ไขพนักงาน · '+e.code+' '+e.name):'เพิ่มพนักงาน';
  const d=Object.assign({code:'',name:'',idcard:'',birth:'',age:'',edu:'',hospital:'',position:'',start:iso(),
    tel:'',salary:0,ot:0,bonus:0,pin:'',note:'',emg:'',active:true,leftDate:'',leftNote:''},e||{});
  if(!e) d.code='EMP'+String(DB.emp.length+1).padStart(3,'0');
  $('#eCode').value=d.code;$('#eName').value=d.name;$('#eId').value=d.idcard;$('#eBirth').value=d.birth;
  $('#eAge').value=d.age;$('#eEdu').value=d.edu;$('#eHos').value=d.hospital;$('#ePos').value=d.position;
  $('#eStart').value=d.start;$('#eTenure').value=tenure(d.start);$('#eTel').value=d.tel;
  $('#eSalary').value=d.salary;$('#eOt').value=d.ot;$('#eBonus').value=d.bonus;$('#ePin').value=d.pin;
  $('#eNote').value=d.note;$('#eEmg').value=d.emg;
  $('#eLeftDate').value=d.leftDate||''; $('#eLeftNote').value=d.leftNote||'';
  setEmpActiveUI(d.active!==false);
  permBoxes(); openModal('mEmp');
}
/* สลับสถานะปฏิบัติงาน / ลาออก */
function setEmpActiveUI(on){
  $$('#eActiveSeg button').forEach(b=>b.classList.toggle('on',(b.dataset.a==='1')===!!on));
  $('#eLeftWrap').style.display=on?'none':'grid';
  $('#eActiveHint').textContent=on
    ? 'เข้าใช้งานระบบได้ตามสิทธิที่กำหนดไว้'
    : 'เข้าระบบไม่ได้ · ไม่ถูกนับในเงินเดือนและประกันสังคม · ข้อมูลและเอกสารเก่ายังอยู่ครบ';
  if(!on&&!$('#eLeftDate').value) $('#eLeftDate').value=iso();
}
$('#eActiveSeg').addEventListener('click',e=>{const b=e.target.closest('button'); if(b) setEmpActiveUI(b.dataset.a==='1');});
$('#eStart').onchange=()=>$('#eTenure').value=tenure($('#eStart').value);
$('#eBirth').onchange=()=>{const b=$('#eBirth').value; if(b) $('#eAge').value=Math.floor(daysBetween(b,iso())/365.25)};
function saveEmp(){
  if(!can('doc.emp')) return toast('บัญชีนี้ไม่มีสิทธิแก้ไขข้อมูลพนักงานและสิทธิใช้งาน');
  const code=$('#eCode').value.trim(), name=$('#eName').value.trim();
  if(!code||!name) return toast('กรอกรหัสพนักงานและชื่อ - นามสกุลก่อนบันทึก');
  if(DB.emp.some(x=>x.code.toLowerCase()===code.toLowerCase()&&x.id!==editEmpId)) return toast('รหัสพนักงานนี้มีอยู่แล้ว');
  const perms=blankPerms(false);
  $$('.pk').forEach(el=>{ if(perms[el.dataset.g]) perms[el.dataset.g][el.dataset.k]=el.checked; });
  pkgPermDerive(perms);
  const rec={id:editEmpId||uid(),code,name,idcard:$('#eId').value.trim(),birth:$('#eBirth').value,age:n($('#eAge').value)||'',
    edu:$('#eEdu').value.trim(),hospital:$('#eHos').value.trim(),position:$('#ePos').value.trim(),start:$('#eStart').value,
    tel:$('#eTel').value.trim(),salary:n($('#eSalary').value),ot:n($('#eOt').value),bonus:n($('#eBonus').value),
    pin:$('#ePin').value.trim(),note:$('#eNote').value.trim(),emg:$('#eEmg').value.trim(),
    active:!!document.querySelector('#eActiveSeg button[data-a="1"].on'),
    leftDate:$('#eLeftDate').value||'',leftNote:$('#eLeftNote').value.trim(),perms};
  if(!rec.active&&!rec.leftDate) rec.leftDate=iso();
  if(rec.active){ rec.leftDate=''; rec.leftNote=''; }
  const oldEmp=editEmpId?DB.emp.find(x=>x.id===editEmpId):null;
  stampRec(rec,oldEmp);
  if(editEmpId){const i=DB.emp.findIndex(x=>x.id===editEmpId);DB.emp[i]=rec} else DB.emp.push(rec);
  /* การแก้สิทธิ์ใช้งานต้องตามหาคนทำได้เสมอ — เป็นจุดที่อ่อนไหวที่สุดในระบบ */
  const stChanged=oldEmp&&empActive(oldEmp)!==rec.active;
  logAudit('emp',{id:rec.id,no:rec.code},'save',(oldEmp?'แก้ไขพนักงาน ':'เพิ่มพนักงานใหม่ ')+rec.name
    +(oldEmp&&permCount(oldEmp)!==permCount(rec)?' · สิทธิใช้งาน '+permCount(oldEmp)+' → '+permCount(rec):' · สิทธิใช้งาน '+permCount(rec))
    +(oldEmp&&(oldEmp.pin||'')!==rec.pin?' · เปลี่ยนรหัสผ่านเข้าใช้งาน':'')
    +(stChanged?(rec.active?' · เปิดบัญชีกลับมาใช้งาน':' · ปิดบัญชี (ลาออก '+thDate(rec.leftDate)+')'):''));
  save();closeModal('mEmp');renderEmp();renderHome();applyPerms();
  toast(stChanged&&!rec.active?('ปิดบัญชี '+rec.name+' แล้ว — เข้าระบบไม่ได้ แต่ข้อมูลและเอกสารเก่ายังอยู่ครบ')
    :'บันทึกข้อมูลพนักงานและสิทธิใช้งานแล้ว');
}
/* นับร่องรอยที่พนักงานคนนี้ทิ้งไว้ในระบบ — ถ้ามี ห้ามลบ ให้ปิดบัญชีแทน */
function empFootprint(id){
  const nm=(DB.emp.find(x=>x.id===id)||{}).name||'';
  let n1=0;
  const hitId=v=>v===id, hitNm=v=>!!nm&&String(v||'').includes(nm);
  ['quotes','receipts','purchases','claims','issues','stockCounts','billings','invoices'].forEach(k=>{
    (DB[k]||[]).forEach(d=>{
      if(hitId(d.createdBy)||hitId(d.updatedBy)) n1++;
      else if(d.apv&&hitId(d.apv.by)) n1++;
      else if(hitId(d.tech)||hitId(d.tech1)||hitId(d.tech2)||hitId(d.byId)) n1++;
      else if(hitNm(d.by)||hitNm(d.byName)) n1++;
    });
  });
  const hr=(DB.hr||[]).filter(x=>x.emp===id).length;
  const wn=(DB.warns||[]).filter(x=>x.emp===id).length;
  const au=(DB.audit||[]).filter(x=>x.user===id).length;
  return {docs:n1,hr,wn,audit:au,total:n1+hr+wn+au};
}
async function delEmp(id){
  if(!can('doc.emp')) return toast('บัญชีนี้ไม่มีสิทธิลบข้อมูลพนักงาน'); const e=DB.emp.find(x=>x.id===id); if(!e) return;
  const f=empFootprint(id);
  if(f.total){
    /* ลบทิ้งแล้วชื่อผู้บันทึก/ผู้อนุมัติในเอกสารเก่าจะตามหาต้นทางไม่ได้อีก */
    const lines=[f.docs?'เอกสาร '+f.docs+' ใบ':'',f.hr?'บันทึกงานบุคคล '+f.hr+' รายการ':'',
      f.wn?'ใบเตือน '+f.wn+' ใบ':'',f.audit?'ประวัติการใช้งาน '+f.audit+' รายการ':''].filter(Boolean).join('\n');
    await askP({title:'ลบพนักงานไม่ได้',
      text:'พนักงาน '+e.code+' '+e.name+' มีร่องรอยในระบบอยู่แล้ว\n\n'+lines
        +'\n\nถ้าลาออก ให้ใช้ "ปิดบัญชี" ในหน้าแก้ไขพนักงานแทน — จะเข้าระบบไม่ได้ แต่เอกสารเก่ายังตรวจย้อนหลังได้',
      yes:'เข้าใจแล้ว',no:''});
    openEmp(id); return;
  }
  if(!await askP({title:'ลบพนักงาน',text:'ลบพนักงาน '+e.code+' '+e.name+' ?\n(ยังไม่มีเอกสารหรือประวัติใด ๆ ในระบบ)',yes:'ลบ',no:'ไม่ลบ'})) return;
  DB.emp=DB.emp.filter(x=>x.id!==id); if(DB.curEmp===id) DB.curEmp='';
  save();renderEmp();applyPerms();renderHome();toast('ลบแล้ว'); }


/* ==========================================================
   แบบฟอร์มเปล่าสำหรับพิมพ์ไปกรอกด้วยมือ
   ========================================================== */
const BLANK_FORMS=[
  ['intake','ใบรับรถเข้าซ่อม / บันทึกข้อมูลลูกค้าใหม่'],
  ['quote','ใบเสนอราคา / ใบอนุมัติซ่อม (เปล่า)'],
  ['receipt','ใบเสร็จรับเงิน (เปล่า)'],
  ['gr','ใบรับสินค้า / บันทึกซื้อสินค้า (เปล่า)'],
  ['count','ใบตรวจนับสต๊อก (พิมพ์รายการปัจจุบัน + ช่องนับจริง)']
];
const L=w=>`<span class="bl" style="min-width:${w}px"></span>`;
const BOX='<span class="tick"></span>';
function formHead(title,sub,en,copy){
  return docHead({title:title,en:en||'FORM',copy:copy||'แบบฟอร์มเปล่า',
    fields:[['เลขที่',sub||'..................'],['วันที่','......... / ......... / .............']]});
}
function rowsBlank(cols,rows,h){
  return Array.from({length:rows},()=>`<tr>${Array.from({length:cols},()=>`<td style="height:${h||19}px"></td>`).join('')}</tr>`).join('');
}
function formIntake(){
  return `<div class="sheetpage">${wmark()}
  ${formHead('ใบรับรถเข้าซ่อม / ข้อมูลลูกค้า','...................','VEHICLE INTAKE FORM','แบบฟอร์มรับรถ')}
  <div class="box"><span class="lbl">ประเภทลูกค้า</span> &nbsp; ${BOX}บุคคลธรรมดา &nbsp;&nbsp; ${BOX}นิติบุคคล
    &nbsp;&nbsp; เลขประจำตัวผู้เสียภาษี ${L(190)} &nbsp; สาขา ${L(90)}<br>
    <span class="lbl">ชื่อเจ้าของรถ / ผู้นำมาซ่อม</span> ${L(300)} &nbsp; <span class="lbl">ชื่อนิติบุคคล</span> ${L(240)}</div>
  <div class="box"><span class="lbl">ที่อยู่ติดต่อ</span><br>
    เลขที่ ${L(70)} หมู่บ้าน/อาคาร ${L(150)} หมู่ที่ ${L(45)} ซอย ${L(110)} ถนน ${L(120)}<br>
    แขวง/ตำบล ${L(140)} เขต/อำเภอ ${L(140)} จังหวัด ${L(130)} รหัสไปรษณีย์ ${L(80)}<br>
    เบอร์โทรติดต่อ ${L(160)} &nbsp; เบอร์โทรสำรอง ${L(160)} &nbsp; อีเมล ${L(160)}</div>
  <div class="box"><span class="lbl">รายละเอียดรถยนต์</span><br>
    ยี่ห้อรถ ${L(170)} รุ่นรถ ${L(170)} สีรถ ${L(110)} ปีจดทะเบียน ${L(80)}<br>
    ทะเบียนรถ — หมวดอักษร ${L(90)} หมวดตัวเลข ${L(90)} จังหวัด ${L(130)} เลขไมล์ ${L(110)} กม.<br>
    เลขเครื่องยนต์ ${L(200)} &nbsp; หมายเลขตัวถัง (VIN) ${L(200)}<br>
    ประกันภัย / บริษัท ${L(180)}</div>
  <div class="box"><span class="lbl">ปัญหาที่ลูกค้าแจ้ง</span>
    <div>1. ${L(560)}</div><div>2. ${L(560)}</div><div>3. ${L(560)}</div></div>
  <div class="box" style="padding:4px 6px"><span class="lbl">ปัญหาที่อู่ตรวจพบ และแนวทางแก้ไข (ซ = ซ่อม · บ = เปลี่ยนอะไหล่บางชิ้น · ม = เปลี่ยนอะไหล่ใหม่)</span>
    <table style="margin-top:3px"><tbody><tr>${[0,5].map(off=>`<td style="width:50%;padding:0;border:0;vertical-align:top">
      <table style="margin:0"><thead><tr><th style="width:22px">#</th><th>รายการที่ตรวจพบ</th>
      <th style="width:24px">ซ</th><th style="width:24px">บ</th><th style="width:24px">ม</th></tr></thead><tbody>
      ${[0,1,2,3,4].map(k=>`<tr><td style="text-align:center">${off+k+1}</td><td style="height:20px"></td><td></td><td></td><td></td></tr>`).join('')}
      </tbody></table></td>`).join('')}</tr></tbody></table></div>
  <div class="box"><span class="lbl">ของใช้ / อุปกรณ์ที่ฝากไว้ในรถ</span> ${L(430)}<br>
    <span class="lbl">ระดับน้ำมันเชื้อเพลิงเมื่อรับรถ</span> ${BOX}E &nbsp;${BOX}1/4 &nbsp;${BOX}1/2 &nbsp;${BOX}3/4 &nbsp;${BOX}F
    &nbsp;&nbsp; <span class="lbl">นัดรับรถวันที่</span> ......... / ......... / .............</div>
  <div class="sign">
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้นำรถมาซ่อม</span></div>
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้รับรถ / เจ้าหน้าที่อู่</span></div>
  </div>
  <div class="note">กรอกข้อมูลในแบบฟอร์มนี้ที่หน้างาน แล้วนำมาบันทึกเข้าระบบในเมนู “ข้อมูลลูกค้า” และ “ใบเสนอราคา / อนุมัติซ่อม”</div></div>`;
}
function formQuote(){
  return `<div class="sheetpage">${wmark()}
  ${formHead('ใบเสนอราคา / ใบอนุมัติซ่อม','...................','QUOTATION / REPAIR ORDER','แบบฟอร์มเปล่า')}
  <table><tr>
    <td style="width:52%;vertical-align:top"><span class="lbl">ลูกค้า</span> ${BOX}บุคคลธรรมดา ${BOX}นิติบุคคล<br>
      ชื่อ ${L(230)}<br>ที่อยู่ ${L(250)}<br>${L(300)}<br>
      เลขประจำตัวผู้เสียภาษี ${L(150)}<br>โทร. ${L(120)} / ${L(120)}</td>
    <td style="vertical-align:top"><span class="lbl">รายละเอียดรถ</span><br>
      ยี่ห้อ ${L(120)} รุ่น ${L(100)}<br>สี ${L(90)} ปี ${L(60)}<br>
      ทะเบียน ${L(110)} จังหวัด ${L(90)}<br>เลขไมล์ ${L(110)} กม.<br>
      เลขเครื่องยนต์ ${L(150)}<br>หมายเลขตัวถัง ${L(150)}<br>วันที่รับรถเข้า ....... / ....... / .........</td></tr></table>
  <div class="box"><span class="lbl">ปัญหาที่ลูกค้าแจ้ง</span>
    <div>1. ${L(560)}</div><div>2. ${L(560)}</div><div>3. ${L(560)}</div></div>
  <div class="box" style="padding:4px 6px"><span class="lbl">ปัญหาที่อู่ตรวจพบ และแนวทางแก้ไข (ซ = ซ่อม · บ = เปลี่ยนอะไหล่บางชิ้น · ม = เปลี่ยนอะไหล่ใหม่)</span>
    <table style="margin-top:3px"><tbody><tr>${[0,5].map(off=>`<td style="width:50%;padding:0;border:0;vertical-align:top">
      <table style="margin:0"><thead><tr><th style="width:22px">#</th><th>รายการที่ตรวจพบ</th>
      <th style="width:24px">ซ</th><th style="width:24px">บ</th><th style="width:24px">ม</th></tr></thead><tbody>
      ${[0,1,2,3,4].map(k=>`<tr><td style="text-align:center">${off+k+1}</td><td style="height:20px"></td><td></td><td></td><td></td></tr>`).join('')}
      </tbody></table></td>`).join('')}</tr></tbody></table></div>
  <table style="margin-top:6px"><thead><tr><th style="width:30px">#</th><th style="width:105px">รหัสสินค้า</th>
    <th style="width:100px">OEM</th><th>รายการอะไหล่ / ค่าแรง เสนอซ่อม</th><th style="width:48px">จำนวน</th>
    <th style="width:78px">ราคา/หน่วย</th><th style="width:88px">จำนวนเงิน</th></tr></thead><tbody>
    ${Array.from({length:10},(_,i)=>`<tr><td style="text-align:center;height:19px">${i+1}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}
    <tr><td colspan="6" style="text-align:right">รวมเป็นเงิน</td><td></td></tr>
    <tr><td colspan="6" style="text-align:right">หักส่วนลด</td><td></td></tr>
    <tr><td colspan="6" style="text-align:right">ภาษีมูลค่าเพิ่ม ${isVatReg()?'7%':'-'}</td><td></td></tr>
    <tr><td colspan="6" style="text-align:right"><b>ยอดรวมสุทธิ</b></td><td></td></tr></tbody></table>
  <div class="note"><b>หมายเหตุ</b><br>
  1. เจ้าของรถ / ผู้อนุมัติซ่อม ได้รับทราบถึงรายการและค่าใช้จ่ายตามใบเสนอซ่อมนี้เป็นที่เรียบร้อย ไม่มีข้อโต้แย้งใด<br>
  2. การเสนอซ่อมตามใบเสนอราคานี้ เป็นการเสนอตามอาการที่วิเคราะห์ได้ครั้งแรก หากทำการซ่อมแล้วมีอะไหล่หรืออาการเสียเพิ่มเติม ผู้อนุมัติซ่อมยินดีที่จะให้ซ่อมจนแล้วเสร็จ โดยผู้เสนอราคาจะทำการแจ้งอีกครั้งหนึ่ง</div>
  <div class="sign">
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้เสนอซ่อม · ตำแหน่ง .............................</span></div>
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้อนุมัติซ่อม · ตำแหน่ง .............................</span></div>
  </div></div>`;
}
function formReceipt(){
  const vat=isVatReg();
  return `<div class="sheetpage">${wmark()}
  ${formHead('ใบเสร็จรับเงิน'+(vat?' / ใบกำกับภาษี':''),'...................',vat?'RECEIPT / TAX INVOICE':'OFFICIAL RECEIPT','แบบฟอร์มเปล่า')}
  <table><tr>
    <td style="width:58%;vertical-align:top"><span class="lbl">ได้รับเงินจาก</span><br>
      ชื่อ ${L(260)}<br>ที่อยู่ ${L(280)}<br>${L(330)}<br>
      เลขประจำตัวผู้เสียภาษี ${L(160)} &nbsp; โทร. ${L(120)}</td>
    <td style="vertical-align:top"><span class="lbl">รถที่รับบริการ</span><br>
      ยี่ห้อ / รุ่น ${L(130)}<br>ทะเบียน ${L(120)}<br>สี ${L(90)} เลขไมล์ ${L(80)}<br>
      เลขเครื่องยนต์ ${L(140)}<br>หมายเลขตัวถัง ${L(140)}</td></tr></table>
  <table style="margin-top:6px"><thead><tr><th style="width:34px">ลำดับ</th><th style="width:100px">รหัส</th>
    <th>รายการ</th><th style="width:48px">จำนวน</th><th style="width:78px">หน่วยละ</th>
    <th style="width:88px">จำนวนเงิน</th><th style="width:62px">รับประกัน</th></tr></thead><tbody>
    ${Array.from({length:10},(_,i)=>`<tr><td style="text-align:center;height:19px">${i+1}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}
    <tr><td colspan="6" style="text-align:right">รวมเป็นเงิน</td><td></td></tr>
    <tr><td colspan="6" style="text-align:right">หักส่วนลด</td><td></td></tr>
    <tr><td colspan="6" style="text-align:right">มูลค่าก่อนภาษี</td><td></td></tr>
    <tr><td colspan="6" style="text-align:right">ภาษีมูลค่าเพิ่ม ${vat?'7%':'-'}</td><td></td></tr>
    <tr><td colspan="6" style="text-align:right">รวมทั้งสิ้น</td><td></td></tr>
    <tr><td colspan="6" style="text-align:right">หัก ภาษี ณ ที่จ่าย ......... %</td><td></td></tr>
    <tr><td colspan="6" style="text-align:right"><b>จำนวนเงินที่รับชำระสุทธิ</b></td><td></td></tr>
    <tr><td colspan="7" style="text-align:center">( ตัวอักษร ${L(320)} )</td></tr></tbody></table>
  <div class="box"><span class="lbl">ชำระโดย</span><br>
    ${BOX}เงินสด &nbsp; ${BOX}เงินโอน ธนาคาร/บัญชี ${L(180)} วันเวลาที่โอน ${L(120)}<br>
    ${BOX}เครดิต ......... วัน &nbsp; ครบกำหนดชำระ ......... / ......... / ............. &nbsp; ${BOX}รับชำระครบแล้ว</div>
  <div class="box"><span class="lbl">เงื่อนไขการรับประกัน</span> ${L(520)}<br>${L(560)}</div>
  <div class="sign">
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้รับเงิน</span></div>
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จ่ายเงิน</span></div>
  </div></div>`;
}
function formGR(){
  return `<div class="sheetpage">${wmark()}
  ${formHead('ใบรับสินค้า / บันทึกซื้อสินค้า','...................','GOODS RECEIVED NOTE','แบบฟอร์มเปล่า')}
  <table><tr><td style="width:58%;vertical-align:top"><span class="lbl">ผู้ขาย</span><br>
      ชื่อผู้ขาย ${L(240)}<br>ที่อยู่ ${L(280)}<br>
      เลขประจำตัวผู้เสียภาษี ${L(150)} &nbsp; โทร. ${L(120)}<br>
      เลขที่ใบส่งของ / ใบกำกับผู้ขาย ${L(150)} วันที่ ....... / ....... / .........</td>
    <td style="vertical-align:top"><span class="lbl">เงื่อนไขการชำระเงิน</span><br>
      ${BOX}เงินสด / โอนทันที<br>${BOX}เครดิต ......... วัน<br>
      ครบกำหนดชำระ ....... / ....... / .........<br>สถานะ ${BOX}ชำระแล้ว ${BOX}ยังไม่ชำระ</td></tr></table>
  <table style="margin-top:6px"><thead><tr><th style="width:30px">#</th><th style="width:110px">รหัสสินค้า (อู่)</th>
    <th style="width:100px">OEM</th><th>รายการ</th><th style="width:100px">หมวด</th><th style="width:48px">จำนวน</th>
    <th style="width:78px">ทุน/หน่วย</th><th style="width:88px">จำนวนเงิน</th></tr></thead><tbody>
    ${Array.from({length:14},(_,i)=>`<tr><td style="text-align:center;height:19px">${i+1}</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`).join('')}
    <tr><td colspan="7" style="text-align:right">รวมเป็นเงิน</td><td></td></tr>
    <tr><td colspan="7" style="text-align:right">หักส่วนลด</td><td></td></tr>
    <tr><td colspan="7" style="text-align:right">ภาษีมูลค่าเพิ่ม 7%</td><td></td></tr>
    <tr><td colspan="7" style="text-align:right"><b>ยอดสุทธิ</b></td><td></td></tr></tbody></table>
  <div class="sign">
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้รับสินค้า</span></div>
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ตรวจรับ</span></div>
    <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ส่งสินค้า</span></div>
  </div></div>`;
}
function formCount(){
  const rows=DB.stock.filter(it=>!catFilter||(it.cat||'อื่น ๆ')===catFilter);
  const per=26, pages=Math.max(1,Math.ceil(rows.length/per));
  return Array.from({length:pages},(_,p)=>{
    const part=rows.slice(p*per,(p+1)*per);
    return `<div class="sheetpage">${wmark()}
    ${docHead({title:'ใบตรวจนับสินค้าคงคลัง',en:'STOCK COUNT SHEET',copy:'ใบตรวจนับ',
      fields:[['วันที่นับ','......... / ......... / ..........'],['หน้า',(p+1)+' / '+pages],
        ['หมวด',catFilter?esc(catFilter):'ทุกหมวด']]})}
    <table><thead><tr><th style="width:28px">#</th><th style="width:100px">รหัสสินค้า</th><th style="width:90px">OEM</th>
      <th>ชื่อสินค้า</th><th style="width:88px">หมวด</th><th style="width:42px">LO</th><th style="width:58px">ในระบบ</th>
      <th style="width:62px">นับจริง</th><th style="width:56px">ผลต่าง</th><th style="width:70px">หมายเหตุ</th></tr></thead><tbody>
      ${part.map((it,i)=>`<tr><td style="text-align:center">${p*per+i+1}</td><td>${esc(it.code)}</td>
        <td>${esc(it.oem||'-')}</td><td>${esc(it.name)}</td><td>${esc(it.cat||'-')}</td>
        <td style="text-align:center">${esc(locCode(it)||'-')}</td>
        <td style="text-align:center">${qf(it.qty)}</td><td style="height:19px"></td><td></td><td></td></tr>`).join('')}
      ${part.length<per?rowsBlank(10,Math.min(4,per-part.length)):''}
    </tbody></table>
    <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ตรวจนับ</span></div>
      <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ตรวจสอบ</span></div></div>
    <div class="note">นับสินค้าจริงแล้วบันทึกส่วนต่างเข้าระบบที่เมนูสต๊อกอะไหล่ → ปุ่ม “รับเข้า” หรือ “ตัดออก” ของแต่ละรายการ</div></div>`;
  }).join('');
}
function openForms(pre){
  $('#formList').innerHTML=BLANK_FORMS.map(([k,label])=>
    `<label><input type="checkbox" class="fk" value="${k}" ${pre===k?'checked':''}> ${label}</label>`).join('');
  openModal('mForm');
}
function printForms(){
  const picks=$$('.fk').filter(x=>x.checked).map(x=>x.value);
  if(!picks.length) return toast('เลือกแบบฟอร์มที่ต้องการพิมพ์อย่างน้อย 1 ชนิด');
  const copies=Math.max(1,Math.min(20,n($('#formCopies').value)||1));
  const maker={intake:formIntake,quote:formQuote,receipt:formReceipt,gr:formGR,count:formCount};
  let html='';
  picks.forEach(k=>{ const c=(k==='count')?1:copies; for(let i=0;i<c;i++) html+=maker[k](); });
  closeModal('mForm'); printDocs(html);
  toast('เตรียมพิมพ์แบบฟอร์ม '+picks.length+' ชนิด'+(copies>1?' ชนิดละ '+copies+' ชุด':''));
}


/* ==========================================================
   บัญชี - การเงิน
   ========================================================== */
const EXP_CATS=['เงินเดือนและค่าแรงงาน','ค่าเช่าสถานที่','ค่าไฟฟ้า','ค่าน้ำประปา','ค่าโทรศัพท์และอินเทอร์เน็ต',
  'ค่าน้ำมันเชื้อเพลิงและขนส่ง','ค่าซ่อมแซมและบำรุงรักษา','วัสดุสิ้นเปลืองสำนักงาน','เครื่องมือช่างมูลค่าต่ำ',
  'ค่าโฆษณาและส่งเสริมการขาย','ค่าธรรมเนียมธนาคารและดอกเบี้ยจ่าย','ค่าบริการวิชาชีพ (บัญชี / กฎหมาย)',
  'ค่าเบี้ยประกันภัย','ภาษีและค่าธรรมเนียมราชการ','ค่ารับรองและบริจาค','ค่าใช้จ่ายเบ็ดเตล็ด'];
const ASSET_CATS=[['อาคารและสิ่งปลูกสร้าง',20],['เครื่องจักรและอุปกรณ์โรงงาน',5],['เครื่องมือช่าง',5],
  ['ยานพาหนะ',5],['เครื่องใช้สำนักงาน',5],['เฟอร์นิเจอร์และเครื่องตกแต่ง',5],
  ['คอมพิวเตอร์และโปรแกรมคอมพิวเตอร์',3],['ป้ายและงานตกแต่งร้าน',5],['สินทรัพย์อื่น ๆ',5]];
const CAP_LABEL={invest:'เงินลงทุนเพิ่มโดยเจ้าของ',draw:'ถอนทุน / เงินใช้ส่วนตัว',loan:'เงินกู้ยืมเข้ากิจการ',
  repay:'ชำระคืนเงินกู้',other_in:'รายรับอื่น ๆ',other_out:'รายจ่ายอื่น ๆ'};
let acctPane='health';

function acctY(){ return n($('#acctYear').value)||new Date().getFullYear(); }
function acctM(){ return $('#acctMonth').value||iso().slice(0,7); }
function inYear(d,y){ return String(d||'').slice(0,4)===String(y); }
function expTotals(x){ const base=n(x.base), vat=vatOf(base,x.vat), wht=base*n(x.wht)/100;
  return {base,vat,wht,gross:base+vat,net:base+vat-wht}; }
function cogsOf(r){ if(typeof pkgFifoCogs==='function') return pkgFifoCogs(r); return (r.items||[]).filter(i=>i.type!=='labor').reduce((a,i)=>{
  const st=DB.stock.find(x=>x.id===i.stockId)||DB.stock.find(x=>x.code===i.code);
  return a+n(i.qty)*(st?n(st.cost):n(i.price)*0.65)},0); }
function assetDep(a,y){
  const cost=n(a.cost), sal=n(a.salvage), life=Math.max(1,n(a.life)||5);
  const annual=Math.max(0,(cost-sal)/life);
  const y0=+String(a.date).slice(0,4), m0=+String(a.date).slice(5,7);
  if(!y0) return {annual:0,thisYear:0,accBefore:0,accEnd:0,nbv:cost};
  const monthsIn=y=>{ if(y<y0) return 0; if(y===y0) return 13-m0; const done=(y-y0)*12+(13-m0); return Math.min(12,Math.max(0,life*12-((y-1-y0)*12+(13-m0)))); };
  let accBefore=0; for(let k=y0;k<y;k++) accBefore+=annual*monthsIn(k)/12;
  const thisYear=annual*monthsIn(y)/12;
  accBefore=Math.min(accBefore,cost-sal);
  const accEnd=Math.min(accBefore+thisYear,cost-sal);
  return {annual,thisYear:accEnd-accBefore,accBefore,accEnd,nbv:cost-accEnd};
}
function payrollMonthly(){ return empActiveList().reduce((a,e)=>{const x=ssoOf(e); return a+x.gross+x.er},0); }
function monthsElapsed(y){ const now=new Date();
  return y<now.getFullYear()?12:(y>now.getFullYear()?0:now.getMonth()+1); }

function finance(y){
  const rc=DB.receipts.filter(r=>inYear(r.date,y)&&!r.cancelled), pu=DB.purchases.filter(p=>inYear(p.date,y)&&!p.cancelled);
  const ex=DB.expenses.filter(x=>inYear(x.date,y)), as=DB.assets.filter(a=>+String(a.date).slice(0,4)<=y);
  const revenue=rc.reduce((a,r)=>a+receiptTotals(r).base,0);
  const vatSale=rc.reduce((a,r)=>a+receiptTotals(r).vat,0);
  const whtIn=rc.reduce((a,r)=>a+receiptTotals(r).whtAmt,0);
  const cogs=rc.reduce((a,r)=>a+cogsOf(r),0);
  const expBase=ex.reduce((a,x)=>a+expTotals(x).base,0);
  const vatBuyExp=ex.reduce((a,x)=>a+expTotals(x).vat,0);
  const whtOut=ex.reduce((a,x)=>a+expTotals(x).wht,0);
  const vatBuyPur=pu.reduce((a,p)=>a+grTotals(p).vat,0);
  const payroll=payrollMonthly()*monthsElapsed(y);
  const dep=as.reduce((a,x)=>a+assetDep(x,y).thisYear,0);
  const opex=expBase+payroll+dep;
  const gp=revenue-cogs, np=gp-opex;
  /* กระแสเงินสดสะสมถึงสิ้นปี y */
  const upto=d=>+String(d||'').slice(0,4)<=y;
  const cashIn=DB.receipts.filter(r=>r.paid&&upto(r.date)).reduce((a,r)=>a+receiptTotals(r).net,0);
  const cashPur=DB.purchases.filter(p=>p.paid&&!p.cancelled&&upto(p.date)).reduce((a,p)=>a+grTotals(p).total,0);
  const cashExp=DB.expenses.filter(x=>x.paid&&upto(x.date)).reduce((a,x)=>a+expTotals(x).net,0);
  const cashAsset=DB.assets.filter(a=>upto(a.date)).reduce((a,x)=>a+n(x.cost)*(1+n(x.vat)/100),0);
  const cap=DB.capital.filter(c=>upto(c.date));
  const invest=cap.filter(c=>c.type==='invest').reduce((a,c)=>a+n(c.amt),0);
  const draw=cap.filter(c=>c.type==='draw').reduce((a,c)=>a+n(c.amt),0);
  const loan=cap.filter(c=>c.type==='loan').reduce((a,c)=>a+n(c.amt),0);
  const repay=cap.filter(c=>c.type==='repay').reduce((a,c)=>a+n(c.amt),0);
  const othIn=cap.filter(c=>c.type==='other_in').reduce((a,c)=>a+n(c.amt),0);
  const othOut=cap.filter(c=>c.type==='other_out').reduce((a,c)=>a+n(c.amt),0);
  const payrollPaid=payrollMonthly()*Math.min(12,monthsElapsed(y))* (y<=new Date().getFullYear()?1:0);
  const cash=invest+loan+othIn+cashIn-cashPur-cashExp-cashAsset-draw-repay-othOut-payrollPaid;
  const ar=DB.receipts.filter(r=>!r.paid&&!r.cancelled).reduce((a,r)=>a+receiptTotals(r).net,0);
  const ap=DB.purchases.filter(p=>!p.paid&&!p.cancelled).reduce((a,p)=>a+grTotals(p).total,0)
          +DB.expenses.filter(x=>!x.paid).reduce((a,x)=>a+expTotals(x).net,0);
  const inv=DB.stock.reduce((a,it)=>a+(typeof pkgFifoValue==='function'?pkgFifoValue(it):n(it.qty)*n(it.cost)),0);
  const nbv=as.reduce((a,x)=>a+(x.status==='sold'?0:assetDep(x,y).nbv),0);
  const assetsTotal=cash+ar+inv+nbv;
  const loanOut=Math.max(0,loan-repay);
  const liab=ap+loanOut;
  const equity=assetsTotal-liab;
  const ownerCap=invest-draw;
  return {y,rc,pu,ex,as,revenue,vatSale,whtIn,cogs,expBase,vatBuyExp,vatBuyPur,whtOut,payroll,dep,opex,gp,np,
    gpm:revenue?gp/revenue*100:0, npm:revenue?np/revenue*100:0,
    cash,ar,ap,inv,nbv,assetsTotal,loanOut,liab,equity,invest,draw,loan,repay,ownerCap,payrollPaid,
    roi:ownerCap>0?np/ownerCap*100:(equity>0?np/equity*100:0), roa:assetsTotal>0?np/assetsTotal*100:0};
}
/* กราฟเส้นเทียบปีนี้-ปีที่แล้ว — แผงแยกของตัวเอง มีแกนตัวเลข เส้นกริด และจุดทุกเดือน */
let REV_CMP=null;
/* แกนกลางกราฟเส้นเทียบสองปี ใช้ร่วมทั้งหน้า Mr.DriveGo และเมนูบัญชี */
function yearLineSVG(cur,prev,mNow,yNow,H){
  const mx=Math.max(1,...cur,...prev);
  const W=1200,L=95,R=25,T=14,B=38;
  const pw=W-L-R, ph=H-T-B;
  const rawStep=mx/4, pow=Math.pow(10,Math.floor(Math.log10(rawStep||1)));
  const step=[1,2,2.5,5,10].map(k=>k*pow).find(v=>v>=rawStep)||rawStep;
  const top=step*4;
  const X=i=>L+pw*(i+0.5)/12;
  const Y=v=>T+ph*(1-Math.min(1,v/top));
  const path=p=>p.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
  const ptsPrev=prev.map((v,i)=>[X(i),Y(v)]);
  const ptsCur=cur.slice(0,Math.min(12,mNow)).map((v,i)=>[X(i),Y(v)]);
  let grid='';
  for(let g=0;g<=4;g++){const yv=step*g, yy=Y(yv);
    grid+='<line x1="'+L+'" y1="'+yy.toFixed(1)+'" x2="'+(W-R)+'" y2="'+yy.toFixed(1)+'" stroke="#e4e9ef" stroke-width="1"/>'
      +'<text x="'+(L-10)+'" y="'+(yy+4).toFixed(1)+'" text-anchor="end" font-size="12.5" fill="#7b8794" font-family="Sarabun,sans-serif">'+money0(yv)+'</text>';}
  const curYr=+iso().slice(0,4), hlm=(yNow===curYr)?mNow-1:-1;
  const xlabels=TH_M.map((m,i)=>'<text x="'+X(i).toFixed(1)+'" y="'+(H-14)+'" text-anchor="middle" font-size="13.5" font-weight="'+(i===hlm?'700':'400')+'" fill="'+(i===hlm?'#1f2a35':'#7b8794')+'">'+m+'</text>').join('');
  const area=ptsCur.length>1?('<path d="'+path(ptsCur)+' L'+ptsCur[ptsCur.length-1][0].toFixed(1)+' '+(T+ph)+' L'+ptsCur[0][0].toFixed(1)+' '+(T+ph)+' Z" fill="rgba(240,164,0,.10)"/>'):'';
  return '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;display:block" role="img" aria-label="กราฟเส้นเปรียบเทียบยอดขายสองปี">'
    +grid+xlabels+area
    +'<path d="'+path(ptsPrev)+'" fill="none" stroke="#98a3ad" stroke-width="2.6" stroke-dasharray="8 6" stroke-linejoin="round" stroke-linecap="round"/>'
    +ptsPrev.map((q,i)=>'<circle cx="'+q[0].toFixed(1)+'" cy="'+q[1].toFixed(1)+'" r="3.4" fill="#fff" stroke="#98a3ad" stroke-width="2"><title>'+TH_M[i]+' ปี '+(yNow-1+543)+' — '+money(prev[i])+' บาท</title></circle>').join('')
    +'<path d="'+path(ptsCur)+'" fill="none" stroke="var(--amber)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'
    +ptsCur.map((q,i)=>'<circle cx="'+q[0].toFixed(1)+'" cy="'+q[1].toFixed(1)+'" r="4" fill="#fff" stroke="var(--amber)" stroke-width="2.4"><title>'+TH_M[i]+' ปี '+(yNow+543)+' — '+money(cur[i])+' บาท</title></circle>').join('')
    +'</svg>';
}
function yearLegendHtml(yNow){
  return '<span><i style="background:var(--amber);height:4px;border-radius:2px"></i>ปี '+(yNow+543)+'</span>'
    +'<span><i style="background:#98a3ad;height:3px;border-radius:2px"></i>ปี '+(yNow-1+543)+' (เส้นประ)</span>';
}
function yearDeltaText(cur,prev,mNow){
  const last=Math.max(0,mNow-2);
  const d=prev[last]?((cur[last]-prev[last])/prev[last]*100):0;
  return prev[last]?(TH_M[last]+' '+(d>=0?'▲ +':'▼ ')+d.toFixed(1)+'% จากปีก่อน'):'เทียบปีก่อน';
}
function renderRevLineChart(){
  const host=$('#revLineChart'); if(!host||!REV_CMP) return;
  const {cur,prev,mNow,yNow}=REV_CMP;
  host.innerHTML=yearLineSVG(cur,prev,mNow,yNow,250);
  $('#revLegend').innerHTML=yearLegendHtml(yNow);
  $('#revLineTag').textContent=yearDeltaText(cur,prev,mNow);
}
/* กราฟเส้นซ้อนบนกราฟแท่ง: ลากผ่านยอดของแต่ละแท่ง พร้อมจุดกลมทุกเดือน */
function drawTrendLine(sel){
  const box=$(sel); if(!box) return;
  const old=box.querySelector('svg.trend'); if(old) old.remove();
  const paint=()=>{
    const bars=[...box.querySelectorAll('.b i')]; if(!bars.length) return;
    const rb=box.getBoundingClientRect(); if(!rb.width||!rb.height) return;   /* สภาพแวดล้อมไม่มี layout = ข้าม */
    const pts=bars.map(b=>{const r=b.getBoundingClientRect();
      return [((r.left+r.right)/2-rb.left), (r.top-rb.top)];});
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('class','trend');
    svg.setAttribute('viewBox','0 0 '+rb.width.toFixed(0)+' '+rb.height.toFixed(0));
    svg.setAttribute('preserveAspectRatio','none');
    svg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:2';
    const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    svg.innerHTML='<path d="'+d+'" fill="none" stroke="var(--amber)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>' 
      +pts.map(p=>'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.6" fill="#fff" stroke="var(--amber)" stroke-width="2.2"/>').join('');
    box.style.position='relative';
    box.appendChild(svg);
  };
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(paint); else paint();
}
let _trendResizeBound=false;
if(!_trendResizeBound){ _trendResizeBound=true;
  window.addEventListener('resize',()=>{ clearTimeout(window.__trendRz);
    window.__trendRz=setTimeout(()=>{},160); });
}
function monthlyPnL(y){
  const out=[];
  for(let m=1;m<=12;m++){
    const key=y+'-'+String(m).padStart(2,'0');
    const rc=DB.receipts.filter(r=>ym(r.date)===key&&!r.cancelled);
    const rev=rc.reduce((a,r)=>a+receiptTotals(r).base,0);
    const cogs=rc.reduce((a,r)=>a+cogsOf(r),0);
    const ex=DB.expenses.filter(x=>ym(x.date)===key).reduce((a,x)=>a+expTotals(x).base,0);
    const pay=payrollMonthly(), dep=DB.assets.reduce((a,x)=>a+assetDep(x,y).thisYear/12,0);
    const opex=ex+pay+dep;
    out.push({m,key,rev,cogs,gp:rev-cogs,opex,np:rev-cogs-opex});
  }
  return out;
}
/* ---------- แท็บย่อย ---------- */
$('#acctTabs').addEventListener('click',e=>{const b=e.target.closest('button'); if(b){ go('acct'); acctGo(b.dataset.a); }});
function acctGo(a){ acctPane=a;
  $$('#acctTabs button').forEach(x=>x.classList.toggle('on',x.dataset.a===a));
  $$('.apane').forEach(p=>p.style.display=(p.id==='a-'+a)?'':'none');
  renderAcct(); }
function fillAcctPeriod(){
  const yNow=new Date().getFullYear();
  if(!$('#acctYear').options.length){
    const ys=[]; for(let y=yNow-4;y<=yNow+1;y++) ys.push(y);
    $('#acctYear').innerHTML=ys.map(y=>`<option value="${y}">${y+543}</option>`).join('');
    $('#acctYear').value=yNow;
  }
  if(!$('#acctMonth').value) $('#acctMonth').value=iso().slice(0,7);
}
$('#acctYear').onchange=renderAcct; $('#acctMonth').onchange=renderAcct;
function renderAcct(){
  fillAcctPeriod();
  if(acctPane==='health') renderHealth();
  if(acctPane==='ar') renderAcctAR();
  if(acctPane==='ap') renderAcctAP();
  if(acctPane==='exp') renderExp();
  if(acctPane==='asset') renderAssets();
  if(acctPane==='cap') renderCap();
  if(acctPane==='tax') renderTax();
  if(acctPane==='coa'){ renderCoa(); renderMap(); renderTrial(); }
  if(acctPane==='fs') renderFS();
}
/* ---------- ลูกหนี้ (ค้างรับ) · เจ้าหนี้ (ค้างจ่าย) ---------- */
/* ยอดที่ชำระเข้ามาแล้วบางส่วน เก็บใน doc.payments = [{date,amt,method,...}]
   รายการที่ถูกยกเลิก (ตัดยอดผิด) ยังอยู่ในประวัติ แต่ไม่ถูกนับยอด */
function paidAmtOf(d){ return (d.payments||[]).filter(p=>!p.cancelled).reduce((a,p)=>a+n(p.amt),0); }
function renderAcctAR(){
  const today=iso();
  /* การ์ดสรุปคิดจากยอดค้างจริงเสมอ — ตัวกรองสถานะ/ค้นหามีผลเฉพาะตาราง */
  let base=docRowsAll().filter(x=>!x.obj.cancelled);
  base.forEach(x=>{ x.over=daysBetween(x.due||x.date,today);
    x.paidAmt=x.kind==='rec'?paidAmtOf(x.obj):0;
    x.rem=x.paid?0:Math.max(0,x.amt-x.paidAmt); });
  const out=base.filter(x=>!x.paid), over=out.filter(x=>x.over>0);
  $('#arSumTot').textContent=money0(out.reduce((a,x)=>a+x.rem,0));
  $('#arSumCnt').textContent=out.length;
  $('#arSumOverCnt').textContent=over.length;
  $('#arSumOverAmt').textContent=money0(over.reduce((a,x)=>a+x.rem,0));
  $('#arSumCust').textContent=new Set(out.map(x=>x.custId).filter(Boolean)).size;
  const st=(($('#aArStatus')&&$('#aArStatus').value)||'out');
  let rows=st==='out'?out:st==='paid'?base.filter(x=>x.paid):base;
  const q=(($('#aArSearch')&&$('#aArSearch').value)||'').toLowerCase().trim();
  if(q) rows=rows.filter(x=>[x.no,custName(findCust(x.custId))].some(s=>String(s||'').toLowerCase().includes(q)));
  rows.sort((a,b)=>(b.paid?-1:b.over)-(a.paid?-1:a.over)||b.date.localeCompare(a.date));
  $('#aArCount').textContent=rows.length+' ใบ';
  rows=sortRows('aArTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'aAr');
  $('#aArTbl tbody').innerHTML=rows.map(x=>{
    const isInv=x.kind==='inv';
    const open=isInv?`openInvoiceById('${x.id}')`:`openReceiptById('${x.id}')`;
    const pay=isInv?`settleInvoiceDoc('${x.id}');renderAcctAR()`:`openPartPay('ar','${x.custId}','${x.id}')`;
    const shownPaid=x.paid?(x.paidAmt||x.amt):x.paidAmt;
    const histBtn=!isInv&&(shownPaid>0||x.paid)?`<button class="btn sm gh" onclick="openPayHist('ar','${x.id}')">ประวัติชำระ</button>`:'';
    return `<tr>
      <td class="mono" style="font-size:12.5px"><span class="docno" onclick="${open}">${esc(x.no||'(ไม่มีเลขที่)')}</span>
        ${x.noteLbl?`<div class="hint">${esc(x.noteLbl)}</div><div class="hint">${esc(x.noteVal)}</div>`:''}</td>
      <td class="ctr">${thDate(x.date)}</td><td>${esc(custName(findCust(x.custId))||'-')}</td>
      <td class="num">${money(x.amt)}</td>
      <td class="num">${shownPaid&&!isInv?`<span class="docno" onclick="openPayHist('ar','${x.id}')" title="คลิกดูประวัติการชำระ">${money(shownPaid)}</span>`:(shownPaid?money(shownPaid):'-')}</td>
      <td class="num"><b>${money(x.rem)}</b></td>
      <td class="ctr">${thDate(x.due||x.date)}</td>
      <td class="ctr">${x.paid?'<span class="stbtn st-green">ชำระครบแล้ว</span>'
        :(x.paidAmt?'<span class="stbtn st-blue">ชำระบางส่วน</span> ':'')+(x.over>0?`<span class="stbtn st-red">เกินกำหนด ${x.over} วัน</span>`:'<span class="stbtn st-orange">รอรับชำระ</span>')}</td>
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px;width:106px">
        ${x.paid?'':`<button class="btn sm gh pc-payRec" onclick="${pay}">ชำระเงิน</button>`}${histBtn}</div></td></tr>`;}).join('');
  $('#aArEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('aArTbl');
  if(typeof mkCards==='function') mkCards('aArTbl');
}
function renderAcctAP(){
  const today=iso();
  const venOf=p=>DB.vendors.find(v=>v.id===p.vendorId);
  let base=DB.purchases
    .map(p=>({p,amt:grTotals(p).total,due:p.due||p.date,over:daysBetween(p.due||p.date,today),paidAmt:paidAmtOf(p)}));
  base.forEach(x=>x.rem=x.p.paid?0:Math.max(0,x.amt-x.paidAmt));
  const out=base.filter(x=>!x.p.paid), over=out.filter(x=>x.over>0);
  $('#apSumTot').textContent=money0(out.reduce((a,x)=>a+x.rem,0));
  $('#apSumCnt').textContent=out.length;
  $('#apSumOverCnt').textContent=over.length;
  $('#apSumOverAmt').textContent=money0(over.reduce((a,x)=>a+x.rem,0));
  $('#apSumVen').textContent=new Set(out.map(x=>x.p.vendorId).filter(Boolean)).size;
  const st=(($('#aApStatus')&&$('#aApStatus').value)||'out');
  let rows=st==='out'?out:st==='paid'?base.filter(x=>x.p.paid):base;
  const q=(($('#aApSearch')&&$('#aApSearch').value)||'').toLowerCase().trim();
  if(q) rows=rows.filter(x=>[x.p.no,(venOf(x.p)||{}).name].some(s=>String(s||'').toLowerCase().includes(q)));
  rows.sort((a,b)=>(b.p.paid?-1:b.over)-(a.p.paid?-1:a.over)||String(b.p.date).localeCompare(String(a.p.date)));
  $('#aApCount').textContent=rows.length+' ใบ';
  rows=sortRows('aApTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'aAp');
  $('#aApTbl tbody').innerHTML=rows.map(x=>{
    const v=venOf(x.p);
    const shownPaid=x.p.paid?(x.paidAmt||x.amt):x.paidAmt;
    const histBtn=(shownPaid>0||x.p.paid)?`<button class="btn sm gh" onclick="openPayHist('ap','${x.p.id}')">ประวัติชำระ</button>`:'';
    return `<tr>
      <td class="mono" style="font-size:12.5px"><span class="docno" onclick="openGRById('${x.p.id}')">${esc(x.p.no||'(ไม่มีเลขที่)')}</span></td>
      <td class="ctr">${thDate(x.p.date)}</td><td>${esc((v&&v.name)||'-')}</td>
      <td class="num">${money(x.amt)}</td>
      <td class="num">${shownPaid?`<span class="docno" onclick="openPayHist('ap','${x.p.id}')" title="คลิกดูประวัติการชำระ">${money(shownPaid)}</span>`:'-'}</td>
      <td class="num"><b>${money(x.rem)}</b></td>
      <td class="ctr">${thDate(x.due)}</td>
      <td class="ctr">${x.p.paid?'<span class="stbtn st-green">ชำระครบแล้ว</span>'
        :(x.paidAmt?'<span class="stbtn st-blue">ชำระบางส่วน</span> ':'')+(x.over>0?`<span class="stbtn st-red">เกินกำหนด ${x.over} วัน</span>`:'<span class="stbtn st-orange">รอชำระ</span>')}</td>
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px;width:106px">
        ${x.p.paid?'':`<button class="btn sm gh pc-payGr" onclick="openPartPay('ap','${x.p.vendorId}','${x.p.id}')">ชำระเงิน</button>`}${histBtn}</div></td></tr>`;}).join('');
  $('#aApEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('aApTbl');
  if(typeof mkCards==='function') mkCards('aApTbl');
}
[['aAr',()=>renderAcctAR()],['aAp',()=>renderAcctAP()]].forEach(([p,fn])=>{
  const lim=$('#'+p+'Limit'); if(lim) lim.onchange=fn;
  const src=$('#'+p+'Search'); if(src) src.oninput=fn;
  const stt=$('#'+p+'Status'); if(stt) stt.onchange=fn;
});

/* ---------- ประวัติการชำระรายใบ + ยกเลิกรายการที่ตัดยอดผิด ---------- */
const PH={mode:'ar',docId:''};
function phDoc(){ return PH.mode==='ar'?DB.receipts.find(x=>x.id===PH.docId):DB.purchases.find(x=>x.id===PH.docId); }
function payMethodDetail(p){
  let m=PAY_METHOD_LABEL[p.method]||p.method||'-';
  if(p.method==='trans') m+=(p.bank?' · '+p.bank:'')+(p.ref?' · อ้างอิง '+p.ref:'');
  else if(p.method==='card') m+=(p.bank?' · '+p.bank:'')+(p.card4?' เลขท้าย '+p.card4:'')+(p.ref?' · เลขอนุมัติ '+p.ref:'');
  else if(p.method==='check') m+=(p.bank?' · '+p.bank:'')+(p.ref?' · เลขที่เช็ค '+p.ref:'')+(p.chkDate?' · ลงวันที่ '+thDate(p.chkDate):'');
  return m;
}
function openPayHist(mode,docId){
  PH.mode=mode; PH.docId=docId;
  renderPayHist(); openModal('mPayHist');
}
function renderPayHist(){
  const d=phDoc(); if(!d) return;
  const isAr=PH.mode==='ar';
  const total=isAr?receiptTotals(d).net:grTotals(d).total;
  const who=isAr?(custName(findCust(d.custId))||'-')
    :(((DB.vendors.find(v=>v.id===d.vendorId))||{}).name||'-');
  const paidA=paidAmtOf(d), rem=d.paid?0:Math.max(0,total-paidA);
  $('#phTitle').textContent='ประวัติการชำระเงิน · '+(d.no||'(ไม่มีเลขที่)');
  $('#phHead').innerHTML=`
    <div><span class="hint">${isAr?'ลูกค้า':'ผู้ขาย / ผู้รับเงิน'}</span><div><b>${esc(who)}</b></div></div>
    <div><span class="hint">ยอดบิล</span><div><b>${money(total)}</b> บาท</div></div>
    <div><span class="hint">ชำระแล้ว</span><div><b>${money(d.paid?(paidA||total):paidA)}</b> บาท</div></div>
    <div><span class="hint">คงค้าง</span><div><b style="color:${rem>0?'var(--danger,#c0392b)':'inherit'}">${money(rem)}</b> บาท
      ${d.paid?'<span class="stbtn st-green">ชำระครบแล้ว</span>':''}</div></div>`;
  const perm=isAr?'pc-payRec':'pc-payGr';
  const list=(d.payments||[]).slice();
  let rows=list.map(p=>{
    const canc=!!p.cancelled;
    return `<tr${canc?' class="cancelrow"':''}>
      <td class="ctr">${thDate(p.date)}</td>
      <td class="num">${canc?`<s>${money(p.amt)}</s>`:`<b>${money(p.amt)}</b>`}</td>
      <td style="font-size:12.5px">${esc(payMethodDetail(p))}</td>
      <td style="font-size:12.5px">${esc(p.by||'-')}</td>
      <td style="font-size:12.5px">${esc(p.note||'')}</td>
      <td class="ctr">${canc
        ?`<span class="stbtn st-red">ยกเลิกแล้ว</span>
          <div class="hint" style="margin-top:3px">โดย ${esc(p.cancelBy||'-')} · ${thDate(p.cancelDate)}${p.cancelReason?'<br>เหตุผล: '+esc(p.cancelReason):''}</div>`
        :`<button class="btn sm dgr ${perm}" onclick="voidPayment('${PH.mode}','${d.id}','${p.id}')">ยกเลิกรายการ</button>`}</td></tr>`;
  });
  /* ใบที่ถูกกดชำระครบแบบเก่า (ไม่มีรายการงวด) — แสดงเป็นรายการเดียว ยกเลิกได้เหมือนกัน */
  if(d.paid&&!list.filter(p=>!p.cancelled).length){
    rows.push(`<tr><td class="ctr">${thDate(isAr?d.paidDate:d.payDate)}</td>
      <td class="num"><b>${money(total)}</b></td>
      <td style="font-size:12.5px">${esc(isAr?'รับชำระเต็มจำนวน':payMethodText(d))}</td>
      <td style="font-size:12.5px">-</td><td style="font-size:12.5px">บันทึกชำระครบทั้งใบ (ไม่แยกงวด)</td>
      <td class="ctr"><button class="btn sm dgr ${perm}" onclick="voidPayment('${PH.mode}','${d.id}','__full')">ยกเลิกรายการ</button></td></tr>`);
  }
  $('#phTbl tbody').innerHTML=rows.join('');
  $('#phEmpty').style.display=rows.length?'none':'block';
}
async function voidPayment(mode,docId,payId){
  if(mode==='ar'&&!can('doc.payRec')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');
  if(mode==='ap'&&!can('doc.payGr')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกชำระเจ้าหนี้');
  const d=mode==='ar'?DB.receipts.find(x=>x.id===docId):DB.purchases.find(x=>x.id===docId);
  if(!d) return;
  const isFull=payId==='__full';
  const p=isFull?null:(d.payments||[]).find(x=>x.id===payId);
  if(!isFull&&(!p||p.cancelled)) return;
  const amt=isFull?(mode==='ar'?receiptTotals(d).net:grTotals(d).total):n(p.amt);
  const reason=await askPromptP({title:'ยกเลิกรายการชำระ '+money(amt)+' บาท',text:'ใบ '+(d.no||'')+' — ระบุเหตุผลที่ยกเลิก (เช่น ตัดยอดผิดใบ / ยอดผิด / บันทึกซ้ำ)',yes:'ยกเลิกรายการ',no:'ไม่ยกเลิก'});
  if(reason===null) return;
  const rs=String(reason).trim()||'ไม่ระบุเหตุผล';
  const stamp={cancelDate:iso(),cancelBy:meName(),cancelReason:rs};
  if(isFull){
    /* เก็บร่องรอยการชำระเต็มใบแบบเก่าไว้เป็นรายการที่ถูกยกเลิก */
    d.payments=d.payments||[];
    d.payments.push(Object.assign({id:uid(),date:(mode==='ar'?d.paidDate:d.payDate)||iso(),amt,
      method:(mode==='ap'&&d.payMethod)||'cash',bank:d.payBank||'',ref:d.payRef||'',card4:d.payCard4||'',chkDate:d.chkDate||'',
      by:d.payBy||'-',note:'บันทึกชำระครบทั้งใบ (ไม่แยกงวด)',cancelled:true},stamp));
  } else Object.assign(p,{cancelled:true},stamp);
  /* เปิดใบกลับมาเป็นค้างชำระ ให้ตัดใหม่ได้ */
  const total=mode==='ar'?receiptTotals(d).net:grTotals(d).total;
  if(d.paid&&total-paidAmtOf(d)>0.005){
    d.paid=false;
    if(mode==='ar') d.paidDate=''; else { d.payDate=''; }
  }
  logAudit(mode==='ar'?'receipt':'gr',d,'payvoid',
    'ยกเลิกรายการชำระ '+money(amt)+' บาท (ตัดยอดเมื่อ '+thDate(isFull?iso():p.date)+') · เหตุผล: '+rs+' · ใบกลับเป็นค้างชำระ '+money(Math.max(0,total-paidAmtOf(d)))+' บาท');
  save(); renderPayHist(); renderHome();
  if(typeof renderGRList==='function'&&mode==='ap') renderGRList();
  if(acctPane==='ar') renderAcctAR(); if(acctPane==='ap') renderAcctAP();
  toast('ยกเลิกรายการชำระ '+money(amt)+' บาทแล้ว — ใบกลับเป็นค้างชำระ ตัดยอดใหม่ได้');
}

/* ---------- ป๊อปอัพชำระเงิน (ลูกหนี้ / เจ้าหนี้) — รองรับชำระบางส่วนและจัดสรรอัตโนมัติ ---------- */
const PP={mode:'ar',billPre:''};
function ppOutDocs(){
  return PP.mode==='ar'
    ? DB.receipts.filter(r=>!r.paid&&!r.cancelled)
        .map(r=>({d:r,who:r.custId,no:r.no||'(ไม่มีเลขที่)',date:r.date,due:(r.pay&&r.pay.due)||r.date,total:receiptTotals(r).net}))
    : DB.purchases.filter(p=>!p.paid&&!p.cancelled)
        .map(p=>({d:p,who:p.vendorId,no:p.no||'(ไม่มีเลขที่)',date:p.date,due:p.due||p.date,total:grTotals(p).total}));
}
function ppWhoName(id){
  return PP.mode==='ar'?(custName(findCust(id))||'(ไม่ระบุลูกค้า)')
    :(((DB.vendors.find(v=>v.id===id))||{}).name||'(ไม่ระบุผู้ขาย)');
}
function openPartPay(mode,whoId,billId){
  if(mode==='ar'&&!can('doc.payRec')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');
  if(mode==='ap'&&!can('doc.payGr')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกชำระเจ้าหนี้');
  PP.mode=mode; PP.billPre=billId||'';
  $('#ppTitle').textContent=mode==='ar'?'รับชำระเงินลูกหนี้':'ชำระเงินเจ้าหนี้';
  $('#ppWhoLbl').textContent=mode==='ar'?'ลูกค้า *':'ผู้ขาย / ผู้รับเงิน *';
  $('#ppDate').value=iso(); $('#ppBy').value=meName(); $('#ppNote').value='';
  $('#ppAmt').value=''; $('#ppAllocInfo').textContent='';
  ['ppBank','ppRef','ppCardBank','ppCard4','ppCardRef','ppChkBank','ppChkNo','ppChkDate'].forEach(id=>$('#'+id).value='');
  ppSetMethod('cash');
  /* รายชื่อเฉพาะคนที่มียอดค้าง — ช่องพิมพ์ค้นหา ชื่อ/บริษัท/เบอร์โทร + รายการแนะนำพร้อมยอดค้าง */
  const docs=ppOutDocs(), by={};
  docs.forEach(x=>{ (by[x.who]=by[x.who]||[]).push(x); });
  PP.whoOpts=Object.keys(by).map(id=>{
    const rem=by[id].reduce((a,x)=>a+Math.max(0,x.total-paidAmtOf(x.d)),0);
    const w=mode==='ar'?findCust(id):DB.vendors.find(v=>v.id===id);
    const name=ppWhoName(id);
    const extra=mode==='ar'?((w&&w.type==='company'&&w.name)||''):((w&&w.contact)||'');
    const tel=(w&&w.tel)||'';
    return {id,name,cnt:by[id].length,rem,sub:[extra,tel].filter(Boolean).join(' · '),
      search:(name+' '+extra+' '+tel).toLowerCase()};
  }).sort((a,b)=>b.rem-a.rem);   /* ยอดค้างมากสุดขึ้นก่อน */
  if(!PP.whoOpts.length){ toast(mode==='ar'?'ไม่มีลูกหนี้ค้างชำระ':'ไม่มีเจ้าหนี้ค้างจ่าย'); return; }
  $('#ppWhoSearch').placeholder=mode==='ar'
    ?'พิมพ์ชื่อลูกค้า / บริษัท / เบอร์โทร — หรือคลิกเพื่อเลือกจากรายการ'
    :'พิมพ์ชื่อผู้ขาย / ผู้ติดต่อ / เบอร์โทร — หรือคลิกเพื่อเลือกจากรายการ';
  if(whoId&&by[whoId]) ppSelectWho(whoId,true);
  else { $('#ppWho').value=''; $('#ppWhoSearch').value=''; ppFillBills(); }
  openModal('mPartPay');
  if(!$('#ppWho').value) setTimeout(()=>$('#ppWhoSearch').focus(),60);
}
function ppRenderSug(){
  const q=(($('#ppWhoSearch').value)||'').toLowerCase().trim();
  const list=(PP.whoOpts||[]).filter(o=>!q||o.search.includes(q));
  const box=$('#ppWhoSug');
  box.innerHTML=(list.length?list.slice(0,30).map(o=>
    `<div class="it" data-id="${o.id}" onmousedown="ppSelectWho('${o.id}')"><b>${esc(o.name)}</b>
      <span class="hint">— ค้าง ${o.cnt} ใบ · ${money(o.rem)} บาท</span>
      ${o.sub?`<div class="hint">${esc(o.sub)}</div>`:''}</div>`).join('')
    :'<div class="it"><span class="hint">ไม่พบรายชื่อที่ตรงกับคำค้น</span></div>')
    +(list.length>30?`<div class="it"><span class="hint">…และอีก ${list.length-30} ราย — พิมพ์เพิ่มเพื่อค้นหา</span></div>`:'');
  box.style.display='block';
}
function ppSelectWho(id,keepPre){
  const o=(PP.whoOpts||[]).find(x=>x.id===id); if(!o) return;
  if(!keepPre) PP.billPre='';
  $('#ppWho').value=id;
  $('#ppWhoSearch').value=o.name;
  $('#ppWhoSug').style.display='none';
  ppFillBills();
}
$('#ppWhoSearch').addEventListener('input',()=>{ $('#ppWho').value=''; PP.billPre=''; ppRenderSug(); ppFillBills(); });
$('#ppWhoSearch').addEventListener('focus',ppRenderSug);
$('#ppWhoSearch').addEventListener('blur',()=>setTimeout(()=>{const b=$('#ppWhoSug'); if(b) b.style.display='none';},150));
$('#ppWhoSearch').addEventListener('keydown',e=>{
  if(e.key==='Enter'){ e.preventDefault(); const first=$('#ppWhoSug .it[data-id]'); if(first) ppSelectWho(first.dataset.id); }
  if(e.key==='Escape') $('#ppWhoSug').style.display='none';
});
function ppSetMethod(m){
  $$('#ppMethod button').forEach(x=>x.classList.toggle('on',x.dataset.m===m));
  $('#ppTransWrap').style.display=m==='trans'?'':'none';
  $('#ppCardWrap').style.display=m==='card'?'':'none';
  $('#ppCheckWrap').style.display=m==='check'?'':'none';
}
$('#ppMethod').addEventListener('click',e=>{const b=e.target.closest('button'); if(b) ppSetMethod(b.dataset.m);});
function ppBillRows(){
  /* เรียงใบเก่าสุดขึ้นก่อน — ลำดับเดียวกับการตัดยอดอัตโนมัติ */
  return ppOutDocs().filter(x=>x.who===$('#ppWho').value)
    .map(x=>Object.assign(x,{paidAmt:paidAmtOf(x.d),rem:Math.max(0,x.total-paidAmtOf(x.d))}))
    .sort((a,b)=>String(a.date).localeCompare(String(b.date)));
}
function ppFillBills(){
  if(!$('#ppWho').value){
    $('#ppOutSum').innerHTML='<span class="hint">พิมพ์ชื่อในช่องด้านบน หรือคลิกช่องเพื่อเลือกจากรายชื่อผู้ที่มียอดค้างทั้งหมด — เลือกแล้วรายการบิลจะแสดงตรงนี้</span>';
    $('#ppTbl tbody').innerHTML=''; ppRecalc(); return;
  }
  const rows=ppBillRows(), today=iso();
  $('#ppOutSum').innerHTML='<b>'+esc(ppWhoName($('#ppWho').value))+'</b> มียอดค้างทั้งหมด <b>'+rows.length+'</b> ใบ รวม <b>'
    +money(rows.reduce((a,x)=>a+x.rem,0))+'</b> บาท';
  $('#ppTbl tbody').innerHTML=rows.map(x=>{
    const over=daysBetween(x.due,today);
    return `<tr>
      <td class="ctr"><input type="checkbox" id="ppck_${x.d.id}" onchange="ppCk('${x.d.id}')"></td>
      <td class="mono" style="font-size:12.5px">${esc(x.no)}${over>0?` <span class="stbtn st-red">เกิน ${over} วัน</span>`:''}</td>
      <td class="ctr">${thDate(x.date)}</td><td class="ctr">${thDate(x.due)}</td>
      <td class="num">${money(x.total)}</td>
      <td class="num">${x.paidAmt?money(x.paidAmt):'-'}</td>
      <td class="num"><b>${money(x.rem)}</b></td>
      <td class="num"><input type="number" id="ppamt_${x.d.id}" step="0.01" min="0" max="${x.rem}" disabled
        style="width:118px;text-align:right" oninput="ppRecalc()"></td></tr>`;}).join('');
  if(PP.billPre){ const ck=$('#ppck_'+PP.billPre); if(ck){ ck.checked=true; ppCk(PP.billPre); } }
  ppRecalc();
}
function ppCk(id){
  const ck=$('#ppck_'+id), inp=$('#ppamt_'+id); if(!ck||!inp) return;
  inp.disabled=!ck.checked;
  if(ck.checked&&!n(inp.value)){ const x=ppBillRows().find(b=>b.d.id===id); inp.value=x?x.rem:''; }
  if(!ck.checked) inp.value='';
  ppRecalc();
}
function ppAuto(){
  let left=n($('#ppAmt').value);
  if(left<=0) return toast('กรอกยอดเงินที่รับในช่อง "รับเงินรวม" ก่อน แล้วกดจัดสรรอัตโนมัติ');
  const rows=ppBillRows(); let used=0,cnt=0;
  rows.forEach(x=>{
    const ck=$('#ppck_'+x.d.id), inp=$('#ppamt_'+x.d.id);
    const pay=Math.min(x.rem,Math.max(0,left));
    if(pay>0){ ck.checked=true; inp.disabled=false; inp.value=Math.round(pay*100)/100; left-=pay; used+=pay; cnt++; }
    else { ck.checked=false; inp.disabled=true; inp.value=''; }
  });
  $('#ppAllocInfo').textContent='จัดสรรแล้ว '+cnt+' ใบ รวม '+money(used)+' บาท'
    +(left>0.005?' · เงินเหลือ '+money(left)+' บาท (เกินยอดค้างทั้งหมด)':'');
  ppRecalc();
}
function ppAllocs(){
  return ppBillRows().map(x=>{
    const ck=$('#ppck_'+x.d.id), inp=$('#ppamt_'+x.d.id);
    return (ck&&ck.checked)?{x,amt:Math.round(n(inp.value)*100)/100}:null;
  }).filter(a=>a&&a.amt>0);
}
function ppRecalc(){
  const rows=ppBillRows();
  /* กันกรอกเกินยอดคงค้างของใบ */
  rows.forEach(x=>{ const inp=$('#ppamt_'+x.d.id);
    if(inp&&n(inp.value)>x.rem+0.005){ inp.value=x.rem; toast('ยอดชำระของใบ '+x.no+' เกินยอดคงค้าง — ปรับให้เท่ายอดคงค้างแล้ว'); } });
  const out=rows.reduce((a,x)=>a+x.rem,0);
  const pay=ppAllocs().reduce((a,al)=>a+al.amt,0);
  $('#ppSumOut').textContent=money(out);
  $('#ppSumPay').textContent=money(pay);
  $('#ppSumAfter').textContent=money(Math.max(0,out-pay));
}
function ppConfirm(){
  const mode=PP.mode;
  if(mode==='ar'&&!can('doc.payRec')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');
  if(mode==='ap'&&!can('doc.payGr')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกชำระเจ้าหนี้');
  if(!$('#ppWho').value) return toast(mode==='ar'?'พิมพ์ค้นหาและเลือกลูกค้าก่อน':'พิมพ์ค้นหาและเลือกผู้ขายก่อน');
  const allocs=ppAllocs();
  if(!allocs.length) return toast('ติ๊กเลือกใบและระบุยอดที่จะชำระอย่างน้อย 1 ใบ');
  const m=($('#ppMethod button.on')||{}).dataset?$('#ppMethod button.on').dataset.m:'cash';
  if(m==='trans'&&!$('#ppBank').value.trim()) return toast('เลือกหรือกรอกบัญชีธนาคารก่อน');
  if(m==='card'&&!$('#ppCardBank').value.trim()) return toast('กรอกธนาคาร / ผู้ให้บริการบัตรก่อน');
  if(m==='check'&&(!$('#ppChkBank').value.trim()||!$('#ppChkNo').value.trim())) return toast('กรอกธนาคารและเลขที่เช็คก่อน');
  const total=allocs.reduce((a,al)=>a+al.amt,0);
  const date=$('#ppDate').value||iso();
  askConfirm({
    title:mode==='ar'?'ยืนยันบันทึกรับชำระ':'ยืนยันบันทึกชำระเจ้าหนี้',
    msg:'ชำระ <b>'+allocs.length+'</b> ใบ รวม <b>'+money(total)+'</b> บาท ด้วย<b>'+(PAY_METHOD_LABEL[m]||m)+'</b>'
      +'<br>ของ <b>'+esc(ppWhoName($('#ppWho').value))+'</b> วันที่ '+thDate(date),
    yes:'ยืนยันบันทึกชำระ', no:'กลับไปแก้ไข',
    onYes:()=>{
      const pay={date,method:m,by:$('#ppBy').value.trim(),note:$('#ppNote').value.trim(),
        bank:m==='trans'?$('#ppBank').value.trim():m==='card'?$('#ppCardBank').value.trim():m==='check'?$('#ppChkBank').value.trim():'',
        ref:m==='trans'?$('#ppRef').value.trim():m==='card'?$('#ppCardRef').value.trim():m==='check'?$('#ppChkNo').value.trim():'',
        card4:m==='card'?$('#ppCard4').value.trim():'', chkDate:m==='check'?($('#ppChkDate').value||''):''};
      allocs.forEach(({x,amt})=>{
        const d=x.d;
        d.payments=d.payments||[];
        d.payments.push(Object.assign({id:uid(),amt},pay));
        const rem=x.total-paidAmtOf(d);
        if(rem<=0.005){
          d.paid=true;
          if(mode==='ar'){ d.paidDate=date; }
          else { d.payDate=date; d.payMethod=m; d.payBank=pay.bank; d.payRef=pay.ref; d.payCard4=pay.card4; d.chkDate=pay.chkDate; d.payBy=pay.by; d.payNote=pay.note; }
        }
        logAudit(mode==='ar'?'receipt':'gr',d,'pay',
          (mode==='ar'?'รับชำระ ':'จ่ายเจ้าหนี้ ')+money(amt)+' บาท ('+(PAY_METHOD_LABEL[m]||m)+')'
          +(rem<=0.005?' · ชำระครบแล้ว':' · คงค้าง '+money(Math.max(0,rem))+' บาท'));
      });
      save(); closeModal('mPartPay');
      renderHome(); if(typeof renderGRList==='function'&&mode==='ap') renderGRList();
      if(typeof renderDocOverview==='function'&&mode==='ar') renderDocOverview();
      if(acctPane==='ar') renderAcctAR(); if(acctPane==='ap') renderAcctAP();
      toast('บันทึกชำระ '+allocs.length+' ใบ รวม '+money(total)+' บาทแล้ว');
    }
  });
}

/* ---------- สุขภาพการเงิน ---------- */
function expenseRank(y){
  const f=finance(y), m={};
  m['ต้นทุนอะไหล่และวัสดุที่ขาย']=f.cogs;
  m['เงินเดือนและสวัสดิการพนักงาน']=f.payroll;
  m['ค่าเสื่อมราคาสินทรัพย์']=f.dep;
  DB.expenses.filter(x=>inYear(x.date,y)).forEach(x=>{const k=x.cat||'ค่าใช้จ่ายเบ็ดเตล็ด';
    m[k]=(m[k]||0)+expTotals(x).base});
  return Object.entries(m).filter(([,v])=>v>0).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
}
function renderHealth(){
  const y=acctY(), f=finance(y);
  $('#fRev').textContent=money0(f.revenue); $('#fCogs').textContent=money0(f.cogs); $('#fGp').textContent=money0(f.gp);
  $('#fNp').textContent=money0(f.np); $('#fGpm').textContent=f.gpm.toFixed(1)+'%'; $('#fNpm').textContent=f.npm.toFixed(1)+'%';
  $('#fCash').textContent=money0(f.cash); $('#fAr2').textContent=money0(f.ar); $('#fAp2').textContent=money0(f.ap);
  $('#fRoi').textContent=f.roi.toFixed(1)+'%'; $('#fRoa').textContent=f.roa.toFixed(1)+'%';
  const rank=expenseRank(y);
  $('#expTag').textContent='รวม '+money0(rank.reduce((a,x)=>a+x.value,0))+' บาท';
  chartBars('#chartExp',rank.slice(0,10),v=>money0(v)+' บาท');
  /* ยอดขาย 12 เดือน */
  const mp=monthlyPnL(y), mx=Math.max(1,...mp.map(x=>x.rev));
  const mpPrev=monthlyPnL(y-1);
  const cur12=mp.map(x=>x.rev), prev12=mpPrev.map(x=>x.rev);
  const yCur=+iso().slice(0,4);
  const mEnd=(y===yCur)?+iso().slice(5,7):(y<yCur?12:0);   /* ปีที่เลือกเป็นปีปัจจุบัน ลากเส้นถึงเดือนนี้ */
  $('#salesBars12').innerHTML=mp.map((x,i)=>{
    const d1=prev12[i]?((x.rev-prev12[i])/prev12[i]*100):0;
    const tip=TH_M[i]+' — ปี '+(y+543)+' '+money(x.rev)+' · ปี '+(y-1+543)+' '+money(prev12[i])
      +(prev12[i]&&i<mEnd?(' ('+(d1>=0?'▲ +':'▼ ')+d1.toFixed(1)+'%)'):'');
    return `<div class="b ${i%2?'bdk':'blt'}" title="${tip}">
    <em>${x.rev?money0(x.rev):''}</em><i style="height:${Math.round(x.rev/mx*82)}%"></i><span>${TH_M[x.m-1]}</span></div>`}).join('');
  $('#sales12Line').innerHTML=yearLineSVG(cur12,prev12,mEnd,y,250);
  $('#sales12Legend').innerHTML=yearLegendHtml(y);
  $('#sales12Tag').textContent=yearDeltaText(cur12,prev12,mEnd||1);
  /* เงินสด */
  $('#cashTbl tbody').innerHTML=`
    <tr><td>เงินลงทุนของเจ้าของ (สะสม)</td><td class="num">${money(f.invest)}</td></tr>
    <tr><td>เงินกู้ยืมเข้ากิจการ</td><td class="num">${money(f.loan)}</td></tr>
    <tr><td>รับชำระจากลูกค้า (สะสม)</td><td class="num">${money(DB.receipts.filter(r=>r.paid).reduce((a,r)=>a+receiptTotals(r).net,0))}</td></tr>
    <tr><td>จ่ายค่าอะไหล่ / ผู้ขาย</td><td class="num">-${money(DB.purchases.filter(p=>p.paid&&!p.cancelled).reduce((a,p)=>a+grTotals(p).total,0))}</td></tr>
    <tr><td>จ่ายค่าใช้จ่ายดำเนินงาน</td><td class="num">-${money(DB.expenses.filter(x=>x.paid).reduce((a,x)=>a+expTotals(x).net,0))}</td></tr>
    <tr><td>จ่ายเงินเดือนและประกันสังคม (ประมาณการ)</td><td class="num">-${money(f.payrollPaid)}</td></tr>
    <tr><td>ซื้อสินทรัพย์ถาวร</td><td class="num">-${money(DB.assets.reduce((a,x)=>a+n(x.cost)*(1+n(x.vat)/100),0))}</td></tr>
    <tr><td>ถอนทุน / ชำระคืนเงินกู้</td><td class="num">-${money(f.draw+f.repay)}</td></tr>
    <tr style="background:#f6f8f9"><td><b>เงินสด / เงินฝากคงเหลือโดยประมาณ</b></td><td class="num"><b>${money(f.cash)}</b></td></tr>`;
  /* อัตราส่วน */
  const invTurn=f.inv?f.cogs/f.inv:0, arDays=f.revenue?f.ar/f.revenue*365:0;
  const bep=f.gpm>0?(f.opex/12)/(f.gpm/100):0;
  $('#ratioTbl tbody').innerHTML=`
    <tr><td>อัตรากำไรขั้นต้น</td><td class="num">${f.gpm.toFixed(1)}%</td><td class="hint">เกณฑ์อู่ทั่วไป 30–45%</td></tr>
    <tr><td>อัตรากำไรสุทธิ</td><td class="num">${f.npm.toFixed(1)}%</td><td class="hint">ควรมากกว่า 5–10%</td></tr>
    <tr><td>ผลตอบแทนจากเงินลงทุน (ROI)</td><td class="num">${f.roi.toFixed(1)}%</td><td class="hint">กำไรสุทธิ ÷ เงินลงทุนเจ้าของ</td></tr>
    <tr><td>ผลตอบแทนจากสินทรัพย์ (ROA)</td><td class="num">${f.roa.toFixed(1)}%</td><td class="hint">กำไรสุทธิ ÷ สินทรัพย์รวม</td></tr>
    <tr><td>อัตราส่วนทุนหมุนเวียน</td><td class="num">${f.ap?((f.cash+f.ar+f.inv)/f.ap).toFixed(2):'-'}</td><td class="hint">ควรมากกว่า 1.5 เท่า</td></tr>
    <tr><td>ระยะเวลาเก็บหนี้เฉลี่ย</td><td class="num">${arDays.toFixed(0)} วัน</td><td class="hint">ยิ่งสั้นยิ่งดี</td></tr>
    <tr><td>อัตราหมุนเวียนสินค้าคงคลัง</td><td class="num">${invTurn.toFixed(2)} รอบ/ปี</td><td class="hint">ต่ำ = สต๊อกจม</td></tr>
    <tr><td>จุดคุ้มทุนต่อเดือน (ยอดขายขั้นต่ำ)</td><td class="num">${money0(bep)}</td><td class="hint">คำนวณจากค่าใช้จ่ายคงที่ ÷ อัตรากำไรขั้นต้น</td></tr>`;
  /* ข้อสังเกต */
  const notes=[];
  if(f.np<0) notes.push('กิจการมีผลขาดทุนสะสมในปีนี้ ควรทบทวนราคาขายและค่าใช้จ่ายคงที่');
  if(f.cash<0) notes.push('กระแสเงินสดติดลบ — เงินจ่ายออกมากกว่าเงินรับเข้า ควรเร่งเก็บหนี้และชะลอการสั่งของ');
  if(f.gpm<25&&f.revenue>0) notes.push('อัตรากำไรขั้นต้นต่ำกว่า 25% ควรตรวจสอบราคาซื้ออะไหล่และการตั้งราคาขาย A/B/C');
  if(f.ar>f.revenue*0.2&&f.revenue>0) notes.push('ยอดลูกหนี้สูงเกิน 20% ของรายได้ ควรทวงถามบิลที่เกินกำหนด');
  if(f.inv>f.cogs*0.6&&f.cogs>0) notes.push('มูลค่าสินค้าคงคลังสูงเมื่อเทียบกับต้นทุนขาย มีความเสี่ยงสต๊อกจม');
  const dead=DB.stock.filter(it=>flags(it).stale).reduce((a,it)=>a+(typeof pkgFifoValue==='function'?pkgFifoValue(it):n(it.qty)*n(it.cost)),0);
  if(dead>f.inv*0.1&&f.inv>0) notes.push('มีสินค้าไม่เคลื่อนไหวมูลค่า '+money0(dead)+' บาท ควรจัดโปรโมชันระบายสต๊อก');
  if(!DB.capital.length) notes.push('ยังไม่ได้บันทึกเงินลงทุนของเจ้าของ ทำให้คำนวณ ROI และส่วนของเจ้าของไม่ครบถ้วน');
  $('#healthAlert').innerHTML=notes.length?`<div class="alert" style="background:#fff8e6;border-color:#f0d79a;border-left-color:var(--amber)">
    <b>ข้อสังเกตจากการวิเคราะห์ข้อมูลการเงิน</b><div class="hint" style="margin-top:5px">${notes.map(t=>'• '+esc(t)).join('<br>')}</div></div>`:'';
  /* ตารางรายเดือน */
  $('#pnlMonthTag').textContent='ปีบัญชี '+(y+543);
  $('#pnlMonthTbl tbody').innerHTML=mp.map(x=>`<tr><td>${TH_M[x.m-1]} ${String(y+543).slice(2)}</td>
    <td class="num">${money(x.rev)}</td><td class="num">${money(x.cogs)}</td><td class="num">${money(x.gp)}</td>
    <td class="num">${money(x.opex)}</td><td class="num" style="${x.np<0?'color:var(--danger)':''}">${money(x.np)}</td>
    <td class="num">${x.rev?(x.np/x.rev*100).toFixed(1)+'%':'-'}</td></tr>`).join('');
  const t=mp.reduce((a,x)=>({rev:a.rev+x.rev,cogs:a.cogs+x.cogs,gp:a.gp+x.gp,opex:a.opex+x.opex,np:a.np+x.np}),{rev:0,cogs:0,gp:0,opex:0,np:0});
  $('#pnlMonthTbl tfoot').innerHTML=`<tr><td>รวมทั้งปี</td><td class="num">${money(t.rev)}</td><td class="num">${money(t.cogs)}</td>
    <td class="num">${money(t.gp)}</td><td class="num">${money(t.opex)}</td><td class="num">${money(t.np)}</td>
    <td class="num">${t.rev?(t.np/t.rev*100).toFixed(1)+'%':'-'}</td></tr>`;
}
/* ---------- ค่าใช้จ่าย ---------- */
let editExpId=null;
function showExpAcc(){ const el=$('#xAccInfo'); if(el) el.textContent='ลงบัญชี '+accLabel(expAcc($('#xCat').value));
  fillPayeeSel($('#xCat').value); }
function calcExpTotal(){ const x={base:$('#xBase').value,vat:$('#xVat').value,wht:$('#xWht').value}, t=expTotals(x);
  $('#xSumBase').textContent=money(t.base);$('#xSumVat').textContent=money(t.vat);
  $('#xSumWht').textContent=money(t.wht);$('#xSumNet').textContent=money(t.net); }
function openExp(id,presetCat){
  editExpId=id||null; const x=id?DB.expenses.find(e=>e.id===id):null;
  $('#mExpTitle').textContent=x?'แก้ไขค่าใช้จ่าย · '+x.no:'บันทึกค่าใช้จ่ายกิจการ';
  $('#xCat').innerHTML=EXP_CATS.map(c=>`<option>${c}</option>`).join('');
  const d=Object.assign({date:iso(),cat:EXP_CATS[2],desc:'',payee:'',tax:'',inv:'',base:0,vat:vatDefault(),wht:0,method:'เงินโอน',paid:1,note:''},x||{});
  if(!x&&presetCat) d.cat=presetCat;
  $('#xDate').value=d.date;$('#xCat').value=d.cat;$('#xDesc').value=d.desc;$('#xPayee').value=d.payee;
  $('#xTax').value=d.tax;$('#xInv').value=d.inv;$('#xBase').value=d.base;$('#xVat').value=String(n(d.vat));
  $('#xWht').value=String(n(d.wht));$('#xMethod').value=d.method;$('#xPaid').value=String(d.paid?1:0);$('#xNote').value=d.note;
  showExpAcc(); calcExpTotal(); openModal('mExp');
}
function saveExp(){
  if(!can('doc.acctEdit')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกค่าใช้จ่าย');
  const desc=$('#xDesc').value.trim(); if(!desc) return toast('กรอกรายละเอียดค่าใช้จ่ายก่อนบันทึก');
  if(n($('#xBase').value)<=0) return toast('กรอกมูลค่าก่อนภาษีให้มากกว่า 0');
  const rec={id:editExpId||uid(),no:(editExpId?DB.expenses.find(e=>e.id===editExpId).no:docNo('EX')),
    date:$('#xDate').value||iso(),cat:$('#xCat').value,desc,payee:$('#xPayee').value.trim(),tax:$('#xTax').value.trim(),
    inv:$('#xInv').value.trim(),base:n($('#xBase').value),vat:n($('#xVat').value),wht:n($('#xWht').value),
    method:$('#xMethod').value,paid:$('#xPaid').value==='1',note:$('#xNote').value.trim()};
  logAudit('expense',rec,'save',rec.cat+' · '+money(expTotals(rec).net)+' บาท');
  stampRec(rec,editExpId?DB.expenses.find(e=>e.id===editExpId):null);
  if(editExpId){const i=DB.expenses.findIndex(e=>e.id===editExpId);DB.expenses[i]=rec} else DB.expenses.push(rec);
  save();closeModal('mExp');renderExp();renderBuyPane();renderHome();toast('บันทึกค่าใช้จ่าย '+rec.no+' แล้ว');
}
async function delExp(id){
  if(!can('doc.acctEdit')) return toast('บัญชีนี้ไม่มีสิทธิลบค่าใช้จ่าย'); const x=DB.expenses.find(e=>e.id===id);
  if(!await askP({title:'ลบรายการค่าใช้จ่าย',text:'ลบรายการค่าใช้จ่าย '+x.no+' ?',yes:'ลบ',no:'ไม่ลบ'})) return;
  logAudit('expense',x,'del');DB.expenses=DB.expenses.filter(e=>e.id!==id);save();renderExp();renderBuyPane();toast('ลบแล้ว'); }
function payExp(id){ const x=DB.expenses.find(e=>e.id===id); x.paid=true; x.payDate=iso();
  save();renderExp();renderBuyPane();renderHome();toast('บันทึกการจ่ายเงินแล้ว'); }
function renderExp(){
  const y=acctY(), q=($('#expSearch').value||'').toLowerCase().trim(), fc=$('#expCatFilter').value;
  if($('#expCatFilter').options.length<2)
    $('#expCatFilter').innerHTML='<option value="">ทุกหมวดค่าใช้จ่าย</option>'+EXP_CATS.map(c=>`<option>${c}</option>`).join('');
  let rows=DB.expenses.filter(x=>inYear(x.date,y)&&(!fc||x.cat===fc)&&
    (!q||[x.no,x.desc,x.payee,x.inv].some(v=>String(v||'').toLowerCase().includes(q))))
    .sort((a,b)=>b.date.localeCompare(a.date));
  rows=sortRows('expTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'exp');
  $('#expTbl tbody').innerHTML=rows.map(x=>{const t=expTotals(x);
    return `<tr><td class="mono" style="font-size:12px">${esc(x.no)}</td><td class="ctr">${thDate(x.date)}</td>
      <td class="mono"><b>${esc(expAcc(x.cat))}</b></td><td>${esc(x.cat)}</td>
      <td>${esc(x.desc)}${x.payee?`<div class="hint">${esc(x.payee)}${x.inv?' · '+esc(x.inv):''}</div>`:''}</td>
      <td class="num">${money(t.base)}</td><td class="num">${money(t.vat)}</td><td class="num">${money(t.wht)}</td>
      <td class="num">${money(t.net)}</td>
      <td class="ctr">${x.paid?'<span class="stbtn st-green">จ่ายแล้ว</span>'
        :`<button class="stbtn st-orange" onclick="payExp('${x.id}')">ค้างจ่าย</button>`}</td>
      ${byCell(x)}
      <td class="ctr"><div style="display:flex;width:80px;margin:0 auto;flex-direction:column;align-items:stretch;gap:4px">${x.paid?'<button class="btn sm gh" disabled style="opacity:.4;cursor:default">จ่ายแล้ว</button>':`<button class="btn sm gh" onclick="payExp('${x.id}')">จ่าย</button>`}
        <button class="btn sm gh" onclick="openExp('${x.id}')">แก้ไข</button>
        <button class="btn sm dgr" onclick="delExp('${x.id}')">ลบ</button></div></td></tr>`}).join('');
  const t=rows.reduce((a,x)=>{const v=expTotals(x);return{base:a.base+v.base,vat:a.vat+v.vat,wht:a.wht+v.wht,net:a.net+v.net}},{base:0,vat:0,wht:0,net:0});
  $('#expTbl tfoot').innerHTML=`<tr><td colspan="5">รวม ${rows.length} รายการ</td><td class="num">${money(t.base)}</td>
    <td class="num">${money(t.vat)}</td><td class="num">${money(t.wht)}</td><td class="num">${money(t.net)}</td><td colspan="3"></td></tr>`;
  $('#expEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('expTbl');
  $('#expCount').textContent=rows.length+' รายการ';
  const byCat={}; DB.expenses.filter(x=>inYear(x.date,y)).forEach(x=>{const k=x.cat||'อื่น ๆ';
    byCat[k]=byCat[k]||{cnt:0,base:0,vat:0}; byCat[k].cnt++; const v=expTotals(x); byCat[k].base+=v.base; byCat[k].vat+=v.vat;});
  const tot=Object.values(byCat).reduce((a,x)=>a+x.base,0), mx=Math.max(1,...Object.values(byCat).map(x=>x.base));
  $('#expCatTbl tbody').innerHTML=Object.entries(byCat).sort((a,b)=>b[1].base-a[1].base).map(([k,v])=>
    `<tr><td>${esc(k)}</td><td class="num">${v.cnt}</td><td class="num">${money(v.base)}</td><td class="num">${money(v.vat)}</td>
     <td><div class="mbar"><i style="width:${Math.round(v.base/mx*100)}%"></i></div>
       <div class="hint mono">${tot?(v.base/tot*100).toFixed(1):'0.0'}%</div></td></tr>`).join('')
    ||'<tr><td colspan="5" class="empty">ยังไม่มีค่าใช้จ่ายในปีบัญชีนี้</td></tr>';
  $('#expCatTbl tfoot').innerHTML=`<tr><td>รวมทั้งสิ้น</td><td class="num">${Object.values(byCat).reduce((a,x)=>a+x.cnt,0)}</td>
    <td class="num">${money(tot)}</td><td class="num">${money(Object.values(byCat).reduce((a,x)=>a+x.vat,0))}</td><td></td></tr>`;
}
$('#expSearch').oninput=renderExp; $('#expCatFilter').onchange=renderExp;
/* ---------- สินทรัพย์ ---------- */
let editAssetId=null, ALINES=[];
const ALINE_MIN=5;
function blankALine(){ const c=ASSET_CATS[2];
  return {name:'',cat:c[0],cost:0,life:c[1],salvage:1,note:''}; }
function aFilled(x){ return !!(x&&(String(x.name||'').trim()||n(x.cost))); }
function padALines(){ while(ALINES.length<ALINE_MIN) ALINES.push(blankALine()); }
function addAssetLine(){ ALINES.push(blankALine()); renderALines(); }
function delALine(i){ ALINES.splice(i,1); if(ALINES.length<ALINE_MIN) ALINES.push(blankALine()); renderALines(); }
function assetCatChange(){ /* คงไว้เพื่อความเข้ากันได้ */ }
function renderALines(){
  padALines();
  $('#yItems tbody').innerHTML=ALINES.map((x,i)=>{
    const an=Math.max(0,(n(x.cost)-n(x.salvage))/Math.max(1,n(x.life)));
    return `<tr><td class="ctr hint">${i+1}</td>
      <td><input type="text" class="al-name" data-i="${i}" value="${esc(x.name)}" placeholder="เช่น เครื่องเชื่อม CO2"></td>
      <td><select class="al-cat" data-i="${i}">${ASSET_CATS.map(([c])=>`<option ${x.cat===c?'selected':''}>${c}</option>`).join('')}</select></td>
      <td><input type="number" class="al-cost" data-i="${i}" value="${x.cost}" step="0.01" style="text-align:right"></td>
      <td><input type="number" class="al-life" data-i="${i}" value="${x.life}" style="text-align:right"></td>
      <td><input type="number" class="al-sal" data-i="${i}" value="${x.salvage}" style="text-align:right"></td>
      <td class="num">${money(an)}</td>
      <td><input type="text" class="al-note" data-i="${i}" value="${esc(x.note)}"></td>
      <td class="ctr"><button class="btn sm dgr" onclick="delALine(${i})">×</button></td></tr>`}).join('');
  $$('.al-name').forEach(el=>el.oninput=e=>ALINES[+e.target.dataset.i].name=e.target.value);
  $$('.al-note').forEach(el=>el.oninput=e=>ALINES[+e.target.dataset.i].note=e.target.value);
  $$('.al-cat').forEach(el=>el.onchange=e=>{const i=+e.target.dataset.i, c=ASSET_CATS.find(x=>x[0]===e.target.value);
    ALINES[i].cat=e.target.value; if(c) ALINES[i].life=c[1]; renderALines();});
  $$('.al-cost').forEach(el=>el.oninput=e=>{ALINES[+e.target.dataset.i].cost=n(e.target.value);calcAssetLines()});
  $$('.al-life').forEach(el=>el.oninput=e=>{ALINES[+e.target.dataset.i].life=n(e.target.value);calcAssetLines()});
  $$('.al-sal').forEach(el=>el.oninput=e=>{ALINES[+e.target.dataset.i].salvage=n(e.target.value);calcAssetLines()});
  calcAssetLines();
}
function calcAssetLines(){
  const rows=$$('#yItems tbody tr'), vat=n($('#yVat').value);
  let cost=0, dep=0;
  ALINES.forEach((x,i)=>{ const an=Math.max(0,(n(x.cost)-n(x.salvage))/Math.max(1,n(x.life)));
    if(rows[i]) rows[i].children[6].textContent=money(an);
    if(aFilled(x)){ cost+=n(x.cost); dep+=an; } });
  const filled=ALINES.filter(aFilled).length;
  $('#yItems tfoot').innerHTML=`<tr><td colspan="3">รวม ${filled} รายการ</td>
    <td class="num"><b>${money(cost)}</b></td><td colspan="2" class="hint">รวม VAT ${money(cost*(1+vat/100))}</td>
    <td class="num"><b>${money(dep)}</b></td><td colspan="2" class="hint">ค่าเสื่อมรวมต่อปี</td></tr>`;
  const li=$('#yLineInfo'); if(li) li.textContent='กรอกแล้ว '+filled+' รายการ · เดือนละ '+money(dep/12)+' บาท';
}
function openAsset(id){
  editAssetId=id||null; const a=id?DB.assets.find(x=>x.id===id):null;
  $('#mAssetTitle').textContent=a?('แก้ไขสินทรัพย์ · '+a.no):'บันทึกการซื้อสินทรัพย์ถาวร (กรอกได้หลายรายการ)';
  $('#venList').innerHTML=DB.vendors.map(v=>`<option value="${esc(v.name)}">`).join('');
  const d=Object.assign({date:iso(),vendor:'',inv:'',vat:vatDefault(),method:'sl',status:'use',out:''},a||{});
  $('#yDate').value=d.date;$('#yVendor').value=d.vendor;$('#yInv').value=d.inv;
  $('#yVat').value=String(n(d.vat));$('#yMethod').value=d.method;$('#yStatus').value=d.status;$('#yOut').value=d.out;
  ALINES=a?[{name:a.name,cat:a.cat,cost:n(a.cost),life:n(a.life),salvage:n(a.salvage),note:a.note||''}]:[];
  if(!a) padALines();
  renderALines(); openModal('mAsset');
}
function saveAsset(){
  if(!can('doc.acctEdit')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกสินทรัพย์');
  /* กิจการที่ไม่จดทะเบียน VAT ขอคืนภาษีซื้อไม่ได้ — VAT ที่จ่ายถือเป็นต้นทุนของทรัพย์สิน
     ให้กรอกราคารวมภาษีในช่องราคาแทน ไม่แยกบรรทัด VAT */
  if(!isVatReg()&&n($('#yVat').value)>0){ $('#yVat').value='0'; if(typeof calcAssetLines==='function') calcAssetLines();
    toast('กิจการไม่ได้จดทะเบียน VAT — ระบบปรับ VAT เป็น 0 ให้แล้ว · ให้กรอกราคาที่รวมภาษีแล้วเป็นต้นทุนทรัพย์สิน'); }
  const head={date:$('#yDate').value||iso(),vendor:$('#yVendor').value.trim(),inv:$('#yInv').value.trim(),
    vat:n($('#yVat').value),method:$('#yMethod').value,status:$('#yStatus').value,out:$('#yOut').value};
  const lines=ALINES.filter(aFilled);
  if(!lines.length) return toast('กรอกชื่อสินทรัพย์และราคาทุนอย่างน้อย 1 บรรทัด');
  if(lines.some(x=>n(x.cost)<=0)) return toast('ราคาทุนของทุกรายการต้องมากกว่า 0');
  if(editAssetId){
    const i=DB.assets.findIndex(x=>x.id===editAssetId), old=DB.assets[i], x=lines[0];
    const rec=Object.assign({},old,head,{name:x.name.trim(),cat:x.cat,cost:n(x.cost),
      life:Math.max(1,n(x.life)),salvage:n(x.salvage),note:x.note.trim()});
    stampRec(rec,old);
    DB.assets[i]=rec; logAudit('asset',rec,'save',rec.name+' · ราคาทุน '+money(rec.cost)+' บาท');
  } else {
    lines.forEach(x=>{
      const rec=Object.assign({id:uid(),no:docNo('FA')},head,{name:x.name.trim(),cat:x.cat,cost:n(x.cost),
        life:Math.max(1,n(x.life)),salvage:n(x.salvage),note:x.note.trim()});
      stampRec(rec);
      DB.assets.push(rec); logAudit('asset',rec,'save',rec.name+' · ราคาทุน '+money(rec.cost)+' บาท');
    });
  }
  save();closeModal('mAsset');renderAssets();renderBuyPane();
  toast(editAssetId?'บันทึกการแก้ไขสินทรัพย์แล้ว':('บันทึกสินทรัพย์ '+lines.length+' รายการแล้ว · รวม '+money(lines.reduce((a,x)=>a+n(x.cost),0))+' บาท'));
}
async function delAsset(id){
  if(!can('doc.acctEdit')) return toast('บัญชีนี้ไม่มีสิทธิลบสินทรัพย์'); const a=DB.assets.find(x=>x.id===id);
  if(!await askP({title:'ลบสินทรัพย์',text:'ลบสินทรัพย์ '+a.no+' — '+a.name+' ?',yes:'ลบ',no:'ไม่ลบ'})) return;
  logAudit('asset',a,'del');DB.assets=DB.assets.filter(x=>x.id!==id);save();renderAssets();renderBuyPane();toast('ลบแล้ว'); }
function renderAssets(){
  const y=acctY();
  let rows=DB.assets.slice().sort((a,b)=>a.date.localeCompare(b.date));
  rows=sortRows('assetTbl',rows);   /* กดหัวคอลัมน์เพื่อเรียง */
  $('#assetTbl tbody').innerHTML=rows.map(a=>{const d=assetDep(a,y);
    return `<tr><td class="mono" style="font-size:12px">${esc(a.no)}</td><td class="ctr">${thDate(a.date)}</td>
      <td>${esc(a.name)}${a.vendor?`<div class="hint">${esc(a.vendor)}${a.inv?' · '+esc(a.inv):''}</div>`:''}
        ${a.status==='sold'?'<span class="chip r">จำหน่ายแล้ว</span>':''}</td>
      <td class="mono"><b>${esc(assetAcc(a.cat)[0])}</b><div class="hint mono">${esc(assetAcc(a.cat)[1])}</div></td>
      <td>${esc(a.cat)}</td><td class="num">${money(a.cost)}</td><td class="ctr">${n(a.life)}</td>
      <td class="num">${money(d.annual)}</td><td class="num">${money(d.accEnd)}</td>
      <td class="num"><b>${money(a.status==='sold'?0:d.nbv)}</b></td>
      ${byCell(a)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
        <button class="btn sm gh" onclick="openAsset('${a.id}')">แก้ไข</button>
        <button class="btn sm dgr" onclick="delAsset('${a.id}')">ลบ</button></div></td></tr>`}).join('');
  const t=rows.reduce((acc,a)=>{const d=assetDep(a,y);
    return {cost:acc.cost+n(a.cost),an:acc.an+d.annual,acc:acc.acc+d.accEnd,nbv:acc.nbv+(a.status==='sold'?0:d.nbv),cur:acc.cur+d.thisYear}},
    {cost:0,an:0,acc:0,nbv:0,cur:0});
  $('#assetTbl tfoot').innerHTML=`<tr><td colspan="5">รวม ${rows.length} รายการ</td><td class="num">${money(t.cost)}</td><td></td>
    <td class="num">${money(t.an)}</td><td class="num">${money(t.acc)}</td><td class="num">${money(t.nbv)}</td><td colspan="2"></td></tr>`;
  $('#assetEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('assetTbl');
  $('#assetCount').textContent=rows.length+' รายการ';
  $('#depTag').textContent='ปีบัญชี '+(y+543)+' · ค่าเสื่อมปีนี้ '+money(t.cur)+' บาท';
  $('#depTbl tbody').innerHTML=rows.map(a=>{const d=assetDep(a,y);
    return `<tr><td>${esc(a.name)}</td><td class="ctr">${thDate(a.date)}</td><td class="num">${money(a.cost)}</td>
      <td class="num">${money(d.thisYear)}</td><td class="num">${money(d.accBefore)}</td>
      <td class="num">${money(d.accEnd)}</td><td class="num">${money(d.nbv)}</td></tr>`}).join('')
    ||'<tr><td colspan="7" class="empty">ยังไม่มีสินทรัพย์ถาวรในทะเบียน</td></tr>';
  $('#depTbl tfoot').innerHTML=`<tr><td colspan="2">รวม</td><td class="num">${money(t.cost)}</td><td class="num">${money(t.cur)}</td>
    <td class="num">${money(rows.reduce((a,x)=>a+assetDep(x,y).accBefore,0))}</td><td class="num">${money(t.acc)}</td>
    <td class="num">${money(t.nbv)}</td></tr>`;
}
/* ---------- เงินลงทุน / เงินสด ---------- */
let editCapId=null;
function openCap(id){ editCapId=id||null; const c=id?DB.capital.find(x=>x.id===id):null;
  $('#mCapTitle').textContent=c?'แก้ไขรายการ':'บันทึกเงินลงทุน / เงินสด';
  $('#zDate').value=(c&&c.date)||iso();$('#zType').value=(c&&c.type)||'invest';
  $('#zAmt').value=(c&&c.amt)||0;$('#zNote').value=(c&&c.note)||''; openModal('mCap'); }
function saveCap(){
  if(!can('doc.acctEdit')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกเงินลงทุน');
  if(n($('#zAmt').value)<=0) return toast('กรอกจำนวนเงินให้มากกว่า 0');
  const rec={id:editCapId||uid(),date:$('#zDate').value||iso(),type:$('#zType').value,
    amt:n($('#zAmt').value),note:$('#zNote').value.trim()};
  const oldCap=editCapId?DB.capital.find(x=>x.id===editCapId):null;
  stampRec(rec,oldCap);
  if(editCapId){const i=DB.capital.findIndex(x=>x.id===editCapId);DB.capital[i]=rec} else DB.capital.push(rec);
  logAudit('capital',{id:rec.id},'save',(oldCap?'แก้ไข ':'')
    +(($('#zType').selectedOptions[0]||{}).text||rec.type)+' · '+money(rec.amt)+' บาท');
  save();closeModal('mCap');renderCap();toast('บันทึกรายการแล้ว');
}
async function delCap(id){
  if(!can('doc.acctEdit')) return toast('บัญชีนี้ไม่มีสิทธิลบรายการเงินลงทุน'); if(!await askP({title:'ลบรายการ',text:'ลบรายการนี้?',yes:'ลบ',no:'ไม่ลบ'})) return;
  DB.capital=DB.capital.filter(x=>x.id!==id);save();renderCap();toast('ลบแล้ว'); }
function renderCap(){
  const y=acctY(), f=finance(y);
  $('#cInvest').textContent=money0(f.invest); $('#cDraw').textContent=money0(f.draw);
  $('#cLoan').textContent=money0(f.loan); $('#cRepay').textContent=money0(f.repay);
  $('#cCash').textContent=money0(f.cash); $('#cEquity').textContent=money0(f.equity);
  $('#cAssets').textContent=money0(f.assetsTotal); $('#cLiab').textContent=money0(f.liab);
  let rows=DB.capital.slice().sort((a,b)=>b.date.localeCompare(a.date));
  rows=sortRows('capTbl',rows);   /* กดหัวคอลัมน์เพื่อเรียง */
  $('#capTbl tbody').innerHTML=rows.map(c=>`<tr><td class="ctr">${thDate(c.date)}</td>
    <td><span class="chip ${['invest','loan','other_in'].includes(c.type)?'g':'r'}">${CAP_LABEL[c.type]||c.type}</span></td>
    <td>${esc(c.note||'-')}</td><td class="num">${money(c.amt)}</td>
    ${byCell(c)}
    <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
      <button class="btn sm gh" onclick="openCap('${c.id}')">แก้ไข</button>
      <button class="btn sm dgr" onclick="delCap('${c.id}')">ลบ</button></div></td></tr>`).join('');
  $('#capEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('capTbl');
  $('#capCount').textContent=rows.length+' รายการ';
}
/* ---------- รายงานภาษี ---------- */
/* ==========================================================
   รายงานภาษีขาย / ภาษีซื้อ — แบ่งหน้าครั้งละ 10 ฉบับ
   สองตารางนี้กรองตามงวดเดือนอยู่แล้ว จึงไม่ยาวสะสมข้ามเดือน
   แต่เดือนที่ออกบิล/ซื้อเยอะ ๆ แถวลงมายาวมาก เลยตัดหน้าให้อ่านง่าย
   ยอดรวมท้ายตาราง (tfoot) ยังเป็นยอดรวมทั้งงวดเสมอ ไม่ใช่แค่หน้านี้
   ========================================================== */
let TAXSALE_PAGE=1, TAXSALE_ROWS=[], TAXSALE_VAT=0, TAXSALE_MO='';
const TAXSALE_PER=10;
function taxSaleGoPage(p){ TAXSALE_PAGE=p; renderTaxSaleRows();
  const el=$('#taxSaleTbl'); if(el&&el.scrollIntoView) el.scrollIntoView({block:'nearest'}); }
/* all=true → วางทุกแถวลง DOM ไม่แบ่งหน้า — ใช้ตอนสั่งพิมพ์
   รายงานภาษีขายที่ยื่นสรรพากรต้องมีครบทุกฉบับในงวด ไม่ใช่แค่ 10 แถวแรก */
function renderTaxSaleRows(all){
  const rows=TAXSALE_ROWS, per=TAXSALE_PER;
  const pages=Math.max(1,Math.ceil(rows.length/per));
  if(TAXSALE_PAGE>pages) TAXSALE_PAGE=pages; if(TAXSALE_PAGE<1) TAXSALE_PAGE=1;
  const from=all?0:(TAXSALE_PAGE-1)*per;
  const slice=all?rows:rows.slice(from,from+per);
  $('#taxSaleTag').textContent=rows.length+' ฉบับ · ภาษีขาย '+money(TAXSALE_VAT)
    +(!all&&pages>1?' · หน้า '+TAXSALE_PAGE+'/'+pages:'');
  $('#taxSaleTbl tbody').innerHTML=slice.map((r,i)=>{const c=findCust(r.custId), t=saleTaxOf(r);
    return `<tr><td class="ctr">${from+i+1}</td><td class="ctr">${thDate(r.date)}</td>
      <td class="mono" style="font-size:12px">${esc(r.taxNo||r.no)}</td><td>${esc(custName(c)||'-')}</td>
      <td class="mono" style="font-size:12px">${esc((c&&c.tax)||'-')}</td>
      <td class="num">${money(t.base)}</td><td class="num">${money(t.vat)}</td></tr>`}).join('')
    ||'<tr><td colspan="7" class="empty">งวดนี้ยังไม่มีใบกำกับภาษีขาย</td></tr>';
  $('#taxSalePager').innerHTML=all?'':pagerHtml(TAXSALE_PAGE,pages,'taxSaleGoPage');
}
let TAXBUY_PAGE=1, TAXBUY_ROWS=[], TAXBUY_VAT=0, TAXBUY_MO='';
const TAXBUY_PER=10;
function taxBuyGoPage(p){ TAXBUY_PAGE=p; renderTaxBuyRows();
  const el=$('#taxBuyTbl'); if(el&&el.scrollIntoView) el.scrollIntoView({block:'nearest'}); }
/* all=true → วางทุกแถวลง DOM ไม่แบ่งหน้า — ใช้ตอนสั่งพิมพ์
   เพราะรายงานภาษีซื้อที่ยื่นสรรพากรต้องมีครบทุกฉบับในงวด ไม่ใช่แค่ 10 แถวแรก */
function renderTaxBuyRows(all){
  const rows=TAXBUY_ROWS, per=TAXBUY_PER;
  const pages=Math.max(1,Math.ceil(rows.length/per));
  if(TAXBUY_PAGE>pages) TAXBUY_PAGE=pages; if(TAXBUY_PAGE<1) TAXBUY_PAGE=1;
  const from=all?0:(TAXBUY_PAGE-1)*per;
  const slice=all?rows:rows.slice(from,from+per);
  $('#taxBuyTag').textContent=rows.length+' ฉบับ · ภาษีซื้อ '+money(TAXBUY_VAT)
    +(!all&&pages>1?' · หน้า '+TAXBUY_PAGE+'/'+pages:'');
  /* ⚠️ เดิมช่องนี้แสดง r.no ซึ่งเป็น "เลขใบกำกับ หรือ เลขเอกสารของเรา" — พอไม่มีใบกำกับ
     ก็ยังขึ้นเลขเอกสารให้ดูเหมือนครบ หาแถวที่ขาดไม่เจอ · ตอนนี้แยกให้ชัดและทำสีให้สะดุดตา */
  $('#taxBuyTbl tbody').innerHTML=slice.map((r,i)=>{
    const miss=!String(r.inv||'').trim()&&n(r.vat)>0;
    return `<tr${miss?' class="noinv"':''}><td class="ctr">${from+i+1}</td><td class="ctr">${thDate(r.date)}</td>
    <td class="mono" style="font-size:12px">${miss
      ? `<b style="color:var(--danger)">⚠ ยังไม่ระบุ</b><div class="hint">${esc(r.src)} ${esc(r.ref||'')}</div>`
      : esc(r.inv||r.no||'-')}</td><td>${esc(r.name)}</td>
    <td class="mono" style="font-size:12px">${esc(r.tax||'-')}</td>
    <td class="num">${money(r.base)}</td><td class="num">${money(r.vat)}</td></tr>`}).join('')
    ||'<tr><td colspan="7" class="empty">งวดนี้ยังไม่มีใบกำกับภาษีซื้อ</td></tr>';
  $('#taxBuyPager').innerHTML=all?'':pagerHtml(TAXBUY_PAGE,pages,'taxBuyGoPage');
}
function renderTax(){
  const mo=acctM(), y=+mo.slice(0,4);
  $('#taxMonthLabel').textContent=TH_M[+mo.slice(5,7)-1]+' '+(y+543);
  const rc=DB.receipts.filter(r=>ym(r.date)===mo&&n(r.vat)>0&&!r.cancelled);
  const pu=DB.purchases.filter(p=>ym(p.date)===mo&&n(p.vat)>0&&!p.cancelled);
  const ex=DB.expenses.filter(x=>ym(x.date)===mo&&n(x.vat)>0);
  const asx=DB.assets.filter(a=>ym(a.date)===mo&&n(a.vat)>0);
  const saleBase=rc.reduce((a,r)=>a+saleTaxOf(r).base,0), saleVat=rc.reduce((a,r)=>a+saleTaxOf(r).vat,0);
  /* inv = เลขที่ใบกำกับภาษีของผู้ขาย (ไม่ใช่เลขที่เอกสารของเรา) — เก็บดิบไว้ตรวจว่าครบไหม
     ขอคืนภาษีซื้อได้ต่อเมื่อมีใบกำกับตัวจริง จึงต้องเตือนถ้าช่องนี้ว่าง */
  const buyRows=[...pu.map(p=>({date:p.date,no:p.inv||p.no,inv:p.inv||'',ref:p.no||'',src:'ใบรับสินค้า',srcGo:'buy',name:(findVen(p.vendorId)||{}).name||'-',tax:(findVen(p.vendorId)||{}).tax||'',base:grTotals(p).base,vat:grTotals(p).vat})),
    ...ex.map(x=>({date:x.date,no:x.inv||x.no,inv:x.inv||'',ref:x.no||'',src:'ค่าใช้จ่ายกิจการ',srcGo:'acct',name:x.payee||x.desc,tax:x.tax,base:expTotals(x).base,vat:expTotals(x).vat})),
    ...asx.map(a=>({date:a.date,no:a.inv||a.no,inv:a.inv||'',ref:a.no||'',src:'ทะเบียนสินทรัพย์',srcGo:'acct',name:a.vendor||a.name,tax:'',base:n(a.cost),vat:vatOf(a.cost,a.vat)}))]
    .sort((a,b)=>a.date.localeCompare(b.date));
  const buyBase=buyRows.reduce((a,r)=>a+r.base,0), buyVat=buyRows.reduce((a,r)=>a+r.vat,0);
  const whtOutRows=DB.expenses.filter(x=>ym(x.date)===mo&&n(x.wht)>0);
  const whtOut=whtOutRows.reduce((a,x)=>a+expTotals(x).wht,0);
  const whtInRows=DB.receipts.filter(r=>ym(r.date)===mo&&n(r.wht)>0&&!r.cancelled);
  const whtIn=whtInRows.reduce((a,r)=>a+receiptTotals(r).whtAmt,0);
  const sso=ssoSummaryOf(mo), pay=empListOfMonth(mo).reduce((a,e)=>a+ssoOf(e).gross,0);
  const vatPay=saleVat-buyVat;
  $('#taxSumTbl tbody').innerHTML=`
    <tr><td style="width:60%">ยอดขายที่ต้องเสียภาษี (ก่อน VAT)</td><td class="num">${money(saleBase)}</td></tr>
    <tr><td>ภาษีขาย</td><td class="num">${money(saleVat)}</td></tr>
    <tr><td>ยอดซื้อและค่าใช้จ่ายที่กรอก VAT ไว้</td><td class="num">${money(buyBase)}</td></tr>
    <tr><td>ภาษีซื้อ</td><td class="num">${money(buyVat)}</td></tr>
    <tr style="background:#f6f8f9"><td><b>${vatPay>=0?'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30) ภายในวันที่ 15 ของเดือนถัดไป':'ภาษีซื้อมากกว่าภาษีขาย — ขอคืน / เครดิตยกไป'}</b></td>
      <td class="num"><b>${money(Math.abs(vatPay))}</b></td></tr>
    <tr><td>ภาษีหัก ณ ที่จ่ายที่กิจการต้องนำส่ง (ภ.ง.ด.3 / 53) ภายในวันที่ 7 ของเดือนถัดไป (ยื่นแบบกระดาษ)</td><td class="num">${money(whtOut)}</td></tr>
    <tr><td>ภาษีถูกหัก ณ ที่จ่าย ใช้เป็นเครดิตภาษีตอนยื่นแบบประจำปี</td><td class="num">${money(whtIn)}</td></tr>
    <tr><td>เงินสมทบประกันสังคมนำส่ง (สปส.1-10) ภายในวันที่ 15 ของเดือนถัดไป (ยื่นแบบกระดาษ)</td><td class="num">${money(sso.total)}</td></tr>
    <tr><td>ฐานเงินเดือนสำหรับ ภ.ง.ด.1</td><td class="num">${money(pay)}</td></tr>`;
  /* จุดที่ 1 · เตือนรายการที่กรอก VAT ไว้แต่ยังไม่มีเลขใบกำกับ — ยอดยังนับตามเดิม
     (ใบกำกับในธุรกิจอู่มักได้รับทีหลัง ถ้าตัดออกเลยตัวเลขจะแกว่งทุกครั้งที่ใบทยอยมา) */
  const noInv=buyRows.filter(r=>!String(r.inv||'').trim()&&n(r.vat)>0);
  const noInvVat=noInv.reduce((a,r)=>a+n(r.vat),0);
  const note=$('#taxSumNote');
  if(note) note.innerHTML=
    (noInv.length?(()=>{
      /* จัดกลุ่มตามหน้าที่ต้องไปแก้ ผู้ใช้จะได้รู้ว่าต้องเปิดเมนูไหน */
      const by={}; noInv.forEach(r=>{ by[r.src]=by[r.src]||{c:0,v:0}; by[r.src].c++; by[r.src].v+=n(r.vat); });
      const lines=Object.keys(by).map(k=>'· <b>'+esc(k)+'</b> '+by[k].c+' รายการ · ภาษีซื้อ '+money(by[k].v)+' บาท').join('<br>');
      return `<div class="note" style="background:#fff8e6;border:1px solid #f0d79a;color:#7a5600;margin-bottom:8px">
        ⚠️ มี <b>${noInv.length} รายการ</b> ที่กรอก VAT ไว้แต่ยังไม่ระบุเลขที่ใบกำกับภาษี ·
        รวมภาษีซื้อ <b>${money(noInvVat)} บาท</b> — ขอคืนภาษีซื้อได้ต่อเมื่อมีใบกำกับตัวจริง<br>
        <span style="display:inline-block;margin-top:6px">${lines}</span><br>
        <span style="display:inline-block;margin-top:6px">👉 ดูรายการที่ทำแถบสีเหลืองไว้ในตาราง
        <b>“รายงานภาษีซื้อ”</b> ด้านล่างหน้านี้ — แต่ละแถวบอกไว้ว่ามาจากเอกสารใบไหน
        แล้วเข้าไปเติมเลขที่ใบกำกับในเอกสารต้นทาง</span>
      </div>`;})():'')
    +`<div class="note">ตัวเลขคำนวณจากเอกสารที่บันทึกในระบบ ณ เวลาที่เรียกดู — โปรดตรวจสอบกับใบกำกับภาษีตัวจริงก่อนยื่นทุกครั้ง<br>
      การยื่นแบบผ่านระบบอิเล็กทรอนิกส์ได้รับการขยายกำหนดเวลาตามประกาศกรมสรรพากร · หากวันครบกำหนดตรงวันหยุดราชการ ให้เลื่อนเป็นวันทำการถัดไป</div>`;
  /* เปลี่ยนงวดเดือน = เริ่มนับหน้าใหม่เสมอ ไม่งั้นค้างอยู่หน้า 3 ของเดือนก่อน */
  if(TAXSALE_MO!==mo){ TAXSALE_MO=mo; TAXSALE_PAGE=1; }
  TAXSALE_ROWS=rc; TAXSALE_VAT=saleVat;
  renderTaxSaleRows();
  $('#taxSaleTbl tfoot').innerHTML=`<tr><td colspan="5">รวม</td><td class="num">${money(saleBase)}</td><td class="num">${money(saleVat)}</td></tr>`;
  if(TAXBUY_MO!==mo){ TAXBUY_MO=mo; TAXBUY_PAGE=1; }
  TAXBUY_ROWS=buyRows; TAXBUY_VAT=buyVat;
  renderTaxBuyRows();
  $('#taxBuyTbl tfoot').innerHTML=`<tr><td colspan="5">รวม</td><td class="num">${money(buyBase)}</td><td class="num">${money(buyVat)}</td></tr>`;
  $('#whtOutTbl tbody').innerHTML=whtOutRows.map(x=>{const t=expTotals(x);
    return `<tr><td class="ctr">${thDate(x.date)}</td><td>${esc(x.payee||x.desc)}<div class="hint">${esc(x.cat)}</div></td>
      <td class="num">${money(t.base)}</td><td class="ctr">${n(x.wht)}%</td><td class="num">${money(t.wht)}</td></tr>`}).join('')
    ||'<tr><td colspan="5" class="empty">งวดนี้ไม่มีรายการที่ต้องหักภาษี ณ ที่จ่าย</td></tr>';
  $('#whtOutTbl tfoot').innerHTML=`<tr><td colspan="4">รวมที่ต้องนำส่ง</td><td class="num">${money(whtOut)}</td></tr>`;
  $('#whtInTbl tbody').innerHTML=whtInRows.map(r=>{const t=receiptTotals(r);
    return `<tr><td class="ctr">${thDate(r.date)}</td><td>${esc(custName(findCust(r.custId))||'-')}<div class="hint">${esc(r.no)}</div></td>
      <td class="num">${money(t.whtBaseAmt)}</td><td class="ctr">${n(r.wht)}%</td><td class="num">${money(t.whtAmt)}</td></tr>`}).join('')
    ||'<tr><td colspan="5" class="empty">งวดนี้ไม่มีลูกค้าหักภาษี ณ ที่จ่าย</td></tr>';
  $('#whtInTbl tfoot').innerHTML=`<tr><td colspan="4">รวมเครดิตภาษี</td><td class="num">${money(whtIn)}</td></tr>`;
  $('#payrollTbl tbody').innerHTML=empActiveList().map(e=>{const x=ssoOf(e);
    return `<tr><td>${esc(e.code)} · ${esc(e.name)}</td><td>${esc(e.position||'-')}</td>
      <td class="num">${money(e.salary)}</td><td class="num">${money(e.ot)}</td><td class="num">${money(e.bonus)}</td>
      <td class="num">${money(x.gross)}</td><td class="num">${money(x.emp)}</td><td class="num">${money(x.er)}</td>
      <td class="num">${money(x.emp+x.er)}</td></tr>`}).join('')
    ||'<tr><td colspan="9" class="empty">ยังไม่มีข้อมูลพนักงาน</td></tr>';
  $('#payrollTbl tfoot').innerHTML=`<tr><td colspan="5">รวม ${empActiveList().length} คน</td><td class="num">${money(pay)}</td>
    <td class="num">${money(sso.emp)}</td><td class="num">${money(sso.er)}</td><td class="num">${money(sso.total)}</td></tr>`;
}
/* ---------- งบการเงิน ---------- */
function renderFS(){
  const y=acctY(), f=finance(y);
  $('#fsYear1').textContent=y+543; $('#fsYear2').textContent=y+543;
  const row=(t,v,b)=>`<tr><td style="width:62%">${b?'<b>'+t+'</b>':t}</td><td class="num">${b?'<b>'+money(v)+'</b>':money(v)}</td></tr>`;
  const M=DB.map||{};
  $('#plTbl tbody').innerHTML=
    row((M.revParts?M.revParts+' / '+M.revLabor+' ':'')+'รายได้จากการขายและบริการ',f.revenue)+
    row((M.cogs?M.cogs+' ':'')+'หัก ต้นทุนอะไหล่และวัสดุที่ขาย',f.cogs)+
    row('กำไรขั้นต้น',f.gp,1)+
    row('6000 ค่าใช้จ่ายในการขายและบริหาร',f.expBase)+
    row((M.payroll?M.payroll+' ':'')+'เงินเดือนและเงินสมทบนายจ้าง',f.payroll)+
    row((M.dep?M.dep+' ':'')+'ค่าเสื่อมราคา',f.dep)+
    row('รวมค่าใช้จ่ายดำเนินงาน',f.opex,1)+
    row('กำไร (ขาดทุน) สุทธิก่อนภาษี',f.np,1)+
    `<tr><td class="hint" colspan="2">อัตรากำไรขั้นต้น ${f.gpm.toFixed(1)}% · อัตรากำไรสุทธิ ${f.npm.toFixed(1)}%</td></tr>`;
  $('#bsTbl tbody').innerHTML=
    `<tr><td colspan="2"><b>สินทรัพย์</b></td></tr>`+
    row('เงินสดและเงินฝากธนาคาร (ประมาณการ)',f.cash)+
    row('ลูกหนี้การค้า',f.ar)+
    row('สินค้าคงเหลือ (ราคาทุน)',f.inv)+
    row('ที่ดิน อาคาร และอุปกรณ์ — สุทธิ',f.nbv)+
    row('รวมสินทรัพย์',f.assetsTotal,1)+
    `<tr><td colspan="2"><b>หนี้สินและส่วนของเจ้าของ</b></td></tr>`+
    row('เจ้าหนี้การค้าและค่าใช้จ่ายค้างจ่าย',f.ap)+
    row('เงินกู้ยืมคงเหลือ',f.loanOut)+
    row('รวมหนี้สิน',f.liab,1)+
    row('ส่วนของเจ้าของ (ทุน + กำไรสะสม)',f.equity,1)+
    row('รวมหนี้สินและส่วนของเจ้าของ',f.liab+f.equity,1);
  $('#cfTbl tbody').innerHTML=
    `<tr><td colspan="2"><b>กระแสเงินสดจากกิจกรรมดำเนินงาน</b></td></tr>`+
    row('เงินสดรับจากลูกค้า',DB.receipts.filter(r=>r.paid&&inYear(r.date,y)).reduce((a,r)=>a+receiptTotals(r).net,0))+
    row('เงินสดจ่ายค่าอะไหล่และผู้ขาย',DB.purchases.filter(p=>p.paid&&!p.cancelled&&inYear(p.date,y)).reduce((a,p)=>a+grTotals(p).total,0))+
    row('เงินสดจ่ายค่าใช้จ่ายดำเนินงาน',DB.expenses.filter(x=>x.paid&&inYear(x.date,y)).reduce((a,x)=>a+expTotals(x).net,0))+
    row('เงินสดจ่ายเงินเดือนและประกันสังคม',payrollMonthly()*monthsElapsed(y))+
    `<tr><td colspan="2"><b>กระแสเงินสดจากกิจกรรมลงทุน</b></td></tr>`+
    row('เงินสดจ่ายซื้อสินทรัพย์ถาวร',DB.assets.filter(a=>inYear(a.date,y)).reduce((a,x)=>a+n(x.cost)*(1+n(x.vat)/100),0))+
    `<tr><td colspan="2"><b>กระแสเงินสดจากกิจกรรมจัดหาเงิน</b></td></tr>`+
    row('เงินลงทุนเพิ่มจากเจ้าของ',DB.capital.filter(c=>c.type==='invest'&&inYear(c.date,y)).reduce((a,c)=>a+n(c.amt),0))+
    row('เงินกู้ยืมรับ',DB.capital.filter(c=>c.type==='loan'&&inYear(c.date,y)).reduce((a,c)=>a+n(c.amt),0))+
    row('ถอนทุนและชำระคืนเงินกู้',DB.capital.filter(c=>['draw','repay'].includes(c.type)&&inYear(c.date,y)).reduce((a,c)=>a+n(c.amt),0))+
    row('เงินสดคงเหลือปลายงวด (ประมาณการ)',f.cash,1);
  const cnt=(x)=>x.length.toLocaleString('th-TH');
  $('#closingNote').innerHTML=`<div class="grid g4">
    <div><span class="hint">ใบกำกับภาษีขาย</span><div><b>${cnt(DB.receipts.filter(r=>inYear(r.date,y)&&r.taxNo&&!r.cancelled))}</b> ฉบับ</div></div>
    <div><span class="hint">ใบรับสินค้า / ซื้ออะไหล่</span><div><b>${cnt(DB.purchases.filter(p=>inYear(p.date,y)))}</b> ฉบับ</div></div>
    <div><span class="hint">บันทึกค่าใช้จ่าย</span><div><b>${cnt(DB.expenses.filter(x=>inYear(x.date,y)))}</b> รายการ</div></div>
    <div><span class="hint">ทะเบียนสินทรัพย์ถาวร</span><div><b>${cnt(DB.assets)}</b> รายการ</div></div></div>
    <p class="hint" style="margin-top:10px">ข้อมูลชุดนี้เป็นเอกสารตั้งต้นสำหรับให้ผู้ทำบัญชีจัดทำงบการเงินและแบบแสดงรายการภาษีประจำปี (ภ.ง.ด.50 / ภ.ง.ด.94) โดยระบบเก็บรายงานภาษีขาย รายงานภาษีซื้อ ทะเบียนทรัพย์สินพร้อมค่าเสื่อมราคา และทะเบียนค่าใช้จ่ายไว้ครบตามที่ประมวลรัษฎากรกำหนด · ตัวเลขเงินสด เงินเดือน และค่าเสื่อมเป็นการประมาณการจากข้อมูลที่บันทึกในระบบ ควรให้ผู้ทำบัญชีตรวจสอบก่อนนำส่งกรมสรรพากร</p>`;
}

/* ==========================================================
   ผังบัญชีมาตรฐาน (Chart of Accounts) และงบทดลอง
   ========================================================== */
const ACC_TYPES=[['asset','1 · สินทรัพย์'],['liab','2 · หนี้สิน'],['equity','3 · ส่วนของเจ้าของ'],
  ['revenue','4 · รายได้'],['cogs','5 · ต้นทุนขาย'],['expense','6 · ค่าใช้จ่ายในการขายและบริหาร']];
const ACC_TYPE_LABEL=Object.fromEntries(ACC_TYPES);
const DEFAULT_COA=[
  ['1010','เงินสด','asset'],['1020','เงินฝากธนาคาร','asset'],['1030','ลูกหนี้การค้า','asset'],
  ['1040','สินค้าคงเหลือ (อะไหล่)','asset'],['1050','ภาษีซื้อ','asset'],['1060','ภาษีถูกหัก ณ ที่จ่าย','asset'],
  ['1210','อาคารและสิ่งปลูกสร้าง','asset'],['1211','ค่าเสื่อมราคาสะสม - อาคาร','asset'],
  ['1220','เครื่องจักรและอุปกรณ์โรงงาน','asset'],['1221','ค่าเสื่อมราคาสะสม - เครื่องจักร','asset'],
  ['1230','เครื่องมือช่าง','asset'],['1231','ค่าเสื่อมราคาสะสม - เครื่องมือช่าง','asset'],
  ['1240','ยานพาหนะ','asset'],['1241','ค่าเสื่อมราคาสะสม - ยานพาหนะ','asset'],
  ['1250','เครื่องใช้สำนักงาน','asset'],['1251','ค่าเสื่อมราคาสะสม - เครื่องใช้สำนักงาน','asset'],
  ['1260','เฟอร์นิเจอร์และเครื่องตกแต่ง','asset'],['1261','ค่าเสื่อมราคาสะสม - เฟอร์นิเจอร์','asset'],
  ['1270','คอมพิวเตอร์และโปรแกรมคอมพิวเตอร์','asset'],['1271','ค่าเสื่อมราคาสะสม - คอมพิวเตอร์','asset'],
  ['1280','ป้ายและงานตกแต่งร้าน','asset'],['1281','ค่าเสื่อมราคาสะสม - ป้ายและงานตกแต่ง','asset'],
  ['1290','สินทรัพย์ถาวรอื่น','asset'],['1291','ค่าเสื่อมราคาสะสม - สินทรัพย์อื่น','asset'],
  ['2010','เจ้าหนี้การค้า','liab'],['2020','ค่าใช้จ่ายค้างจ่าย','liab'],['2030','ภาษีขาย','liab'],
  ['2040','ภาษีมูลค่าเพิ่มค้างชำระ','liab'],['2050','ภาษีหัก ณ ที่จ่ายค้างนำส่ง','liab'],
  ['2060','เงินสมทบประกันสังคมค้างนำส่ง','liab'],['2100','เงินกู้ยืม','liab'],
  ['3010','ทุนของเจ้าของ / หุ้นส่วน','equity'],['3020','ถอนทุน / เงินใช้ส่วนตัว','equity'],
  ['3030','กำไร (ขาดทุน) สะสม','equity'],
  ['4010','รายได้จากการขายอะไหล่','revenue'],['4020','รายได้ค่าแรงและบริการซ่อม','revenue'],['4030','รายได้อื่น','revenue'],
  ['5010','ต้นทุนอะไหล่และวัสดุที่ขาย','cogs'],
  ['6010','เงินเดือนและค่าแรงงาน','expense'],['6011','เงินสมทบประกันสังคม (ส่วนนายจ้าง)','expense'],
  ['6020','ค่าเช่าสถานที่','expense'],['6030','ค่าไฟฟ้า','expense'],['6031','ค่าน้ำประปา','expense'],
  ['6032','ค่าโทรศัพท์และอินเทอร์เน็ต','expense'],['6040','ค่าน้ำมันเชื้อเพลิงและขนส่ง','expense'],
  ['6050','ค่าซ่อมแซมและบำรุงรักษา','expense'],['6060','วัสดุสิ้นเปลืองสำนักงาน','expense'],
  ['6061','เครื่องมือช่างมูลค่าต่ำ','expense'],['6070','ค่าโฆษณาและส่งเสริมการขาย','expense'],
  ['6080','ค่าธรรมเนียมธนาคารและดอกเบี้ยจ่าย','expense'],['6090','ค่าบริการวิชาชีพ (บัญชี / กฎหมาย)','expense'],
  ['6100','ค่าเบี้ยประกันภัย','expense'],['6110','ภาษีและค่าธรรมเนียมราชการ','expense'],
  ['6120','ค่ารับรองและบริจาค','expense'],['6130','ค่าเสื่อมราคา','expense'],['6190','ค่าใช้จ่ายเบ็ดเตล็ด','expense']
].map(([code,name,type])=>({code,name,type}));
const DEFAULT_MAP={
  cash:'1010',bank:'1020',ar:'1030',inv:'1040',vatIn:'1050',whtIn:'1060',
  ap:'2010',accrued:'2020',vatOut:'2030',whtOut:'2050',sso:'2060',loan:'2100',
  capital:'3010',draw:'3020',retained:'3030',
  revParts:'4010',revLabor:'4020',revOther:'4030',cogs:'5010',
  payroll:'6010',ssoEr:'6011',dep:'6130',
  exp:{'เงินเดือนและค่าแรงงาน':'6010','ค่าเช่าสถานที่':'6020','ค่าไฟฟ้า':'6030','ค่าน้ำประปา':'6031',
    'ค่าโทรศัพท์และอินเทอร์เน็ต':'6032','ค่าน้ำมันเชื้อเพลิงและขนส่ง':'6040','ค่าซ่อมแซมและบำรุงรักษา':'6050',
    'วัสดุสิ้นเปลืองสำนักงาน':'6060','เครื่องมือช่างมูลค่าต่ำ':'6061','ค่าโฆษณาและส่งเสริมการขาย':'6070',
    'ค่าธรรมเนียมธนาคารและดอกเบี้ยจ่าย':'6080','ค่าบริการวิชาชีพ (บัญชี / กฎหมาย)':'6090','ค่าเบี้ยประกันภัย':'6100',
    'ภาษีและค่าธรรมเนียมราชการ':'6110','ค่ารับรองและบริจาค':'6120','ค่าใช้จ่ายเบ็ดเตล็ด':'6190'},
  asset:{'อาคารและสิ่งปลูกสร้าง':['1210','1211'],'เครื่องจักรและอุปกรณ์โรงงาน':['1220','1221'],
    'เครื่องมือช่าง':['1230','1231'],'ยานพาหนะ':['1240','1241'],'เครื่องใช้สำนักงาน':['1250','1251'],
    'เฟอร์นิเจอร์และเครื่องตกแต่ง':['1260','1261'],'คอมพิวเตอร์และโปรแกรมคอมพิวเตอร์':['1270','1271'],
    'ป้ายและงานตกแต่งร้าน':['1280','1281'],'สินทรัพย์อื่น ๆ':['1290','1291']}
};
function coaInit(){
  if(!DB.coa||!DB.coa.length) DB.coa=JSON.parse(JSON.stringify(DEFAULT_COA));
  if(!DB.map||!DB.map.exp) DB.map=JSON.parse(JSON.stringify(DEFAULT_MAP));
  CATS.forEach(()=>{});
}
const accName=code=>{const a=(DB.coa||[]).find(x=>x.code===code); return a?a.name:''; };
const accLabel=code=>code?(code+' '+accName(code)):'-';
function expAcc(cat){ return (DB.map.exp&&DB.map.exp[cat])||DB.map.exp&&DB.map.exp['ค่าใช้จ่ายเบ็ดเตล็ด']||'6190'; }
function assetAcc(cat){ const m=DB.map.asset&&DB.map.asset[cat]; return m||['1290','1291']; }
function coaSel(id,val,filter){
  const list=(DB.coa||[]).filter(a=>!filter||filter.includes(a.type));
  return `<select id="${id}">${list.map(a=>`<option value="${a.code}" ${a.code===val?'selected':''}>${a.code} ${esc(a.name)}</option>`).join('')}</select>`;
}
/* ---------- ตารางผังบัญชี ---------- */
function renderCoa(){
  coaInit();
  if($('#coaType').options.length<2)
    $('#coaType').innerHTML='<option value="">ทุกหมวดบัญชี</option>'+ACC_TYPES.map(([k,l])=>`<option value="${k}">${l}</option>`).join('');
  const q=($('#coaSearch').value||'').toLowerCase().trim(), ft=$('#coaType').value;
  const bal=trialBalance(acctY());
  const rows=DB.coa.filter(a=>(!ft||a.type===ft)&&(!q||(a.code+' '+a.name).toLowerCase().includes(q)))
    .sort((a,b)=>a.code.localeCompare(b.code));
  $('#coaTbl tbody').innerHTML=rows.map(a=>{const b=bal.find(x=>x.code===a.code);
    return `<tr><td class="mono"><b>${esc(a.code)}</b></td><td>${esc(a.name)}</td>
      <td><span class="chip">${esc(ACC_TYPE_LABEL[a.type]||a.type)}</span></td>
      <td class="num">${b?money(b.debit||b.credit):'-'}</td>
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
        <button class="btn sm gh" onclick="editCoa('${esc(a.code)}')">แก้ไข</button>
        <button class="btn sm dgr" onclick="delCoa('${esc(a.code)}')">ลบ</button></div></td></tr>`}).join('')
    ||'<tr><td colspan="5" class="empty">ไม่พบบัญชีตามเงื่อนไข</td></tr>';
  $('#coaCount').textContent=DB.coa.length+' บัญชี';
}
async function addCoa(){
  if(!can('doc.coa')) return toast('บัญชีนี้ไม่มีสิทธิเพิ่มผังบัญชี');
  const code=await askPromptP({title:'เพิ่มบัญชีใหม่',text:'รหัสบัญชีใหม่ (เช่น 6140)',yes:'ถัดไป'}); if(!code) return;
  if(DB.coa.some(a=>a.code===code.trim())) return toast('รหัสบัญชีนี้มีอยู่แล้ว');
  const name=await askPromptP({title:'เพิ่มบัญชี '+code.trim(),text:'ชื่อบัญชี',yes:'ถัดไป'}); if(!name) return;
  const t=await askPromptP({title:'เพิ่มบัญชี '+code.trim(),text:'หมวดบัญชี: asset / liab / equity / revenue / cogs / expense',value:'expense',yes:'บันทึก'});
  if(!ACC_TYPE_LABEL[t]) return toast('หมวดบัญชีไม่ถูกต้อง');
  DB.coa.push({code:code.trim(),name:name.trim(),type:t}); save(); renderCoa(); renderMap();
  toast('เพิ่มบัญชี '+code+' แล้ว');
}
async function editCoa(code){
  const a=DB.coa.find(x=>x.code===code); if(!a) return;
  const name=await askPromptP({title:'แก้ไขบัญชี '+code,text:'ชื่อบัญชีของรหัส '+code,value:a.name,yes:'บันทึก'}); if(name===null) return;
  a.name=name.trim(); save(); renderCoa(); renderMap(); toast('แก้ไขบัญชีแล้ว');
}
async function delCoa(code){
  if(!can('doc.coa')) return toast('บัญชีนี้ไม่มีสิทธิลบผังบัญชี');
  if(!await askP({title:'ลบบัญชี',text:'ลบบัญชี '+code+' ออกจากผังบัญชี?',yes:'ลบ',no:'ไม่ลบ'})) return;
  DB.coa=DB.coa.filter(x=>x.code!==code); save(); renderCoa(); renderMap(); toast('ลบบัญชีแล้ว');
}
async function resetCoa(){
  if(!can('doc.coa')) return toast('บัญชีนี้ไม่มีสิทธิรีเซ็ตผังบัญชี');
  if(!await askP({title:'คืนค่าผังบัญชีมาตรฐาน',text:'คืนค่าผังบัญชีและการผูกบัญชีทั้งหมดกลับเป็นมาตรฐานกรมพัฒนาธุรกิจการค้า?',yes:'คืนค่า',no:'ยังไม่คืนค่า'})) return;
  DB.coa=JSON.parse(JSON.stringify(DEFAULT_COA)); DB.map=JSON.parse(JSON.stringify(DEFAULT_MAP));
  save(); renderCoa(); renderMap(); renderTrial(); toast('คืนค่าผังบัญชีมาตรฐานแล้ว');
}
function exportCoaCsv(){
  const rows=[['รหัสบัญชี','ชื่อบัญชี','หมวดบัญชี']].concat(DB.coa.map(a=>[a.code,a.name,ACC_TYPE_LABEL[a.type]]));
  dlCsv(rows,'chart-of-accounts-'+iso()+'.csv'); }
function dlCsv(rows,name){
  const csv='\ufeff'+rows.map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(',')).join('\n');
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=name; a.click(); toast('ส่งออกไฟล์ '+name+' แล้ว'); }
$('#coaSearch').oninput=renderCoa; $('#coaType').onchange=renderCoa;
/* ---------- การผูกบัญชี ---------- */
const MAP_CORE=[['cash','เงินสด',['asset']],['bank','เงินฝากธนาคาร',['asset']],['ar','ลูกหนี้การค้า',['asset']],
  ['inv','สินค้าคงเหลือ',['asset']],['vatIn','ภาษีซื้อ',['asset']],['whtIn','ภาษีถูกหัก ณ ที่จ่าย',['asset']],
  ['ap','เจ้าหนี้การค้า',['liab']],['accrued','ค่าใช้จ่ายค้างจ่าย',['liab']],['vatOut','ภาษีขาย',['liab']],
  ['whtOut','ภาษีหัก ณ ที่จ่ายค้างนำส่ง',['liab']],['sso','ประกันสังคมค้างนำส่ง',['liab']],['loan','เงินกู้ยืม',['liab']],
  ['capital','ทุนของเจ้าของ',['equity']],['draw','ถอนทุน',['equity']],['retained','กำไรสะสม',['equity']],
  ['revParts','รายได้ค่าอะไหล่',['revenue']],['revLabor','รายได้ค่าแรง / บริการ',['revenue']],
  ['revOther','รายได้อื่น',['revenue']],['cogs','ต้นทุนขาย',['cogs']],
  ['payroll','เงินเดือนและค่าแรง',['expense']],['ssoEr','ประกันสังคมส่วนนายจ้าง',['expense']],['dep','ค่าเสื่อมราคา',['expense']]];
function renderMap(){
  coaInit();
  $('#mapCore').innerHTML=MAP_CORE.map(([k,label,f])=>
    `<label class="f"><span>${esc(label)}</span>${coaSel('mp_'+k,DB.map[k],f)}</label>`).join('');
  $('#mapExp').innerHTML=EXP_CATS.map((c,i)=>
    `<label class="f"><span>${esc(c)}</span>${coaSel('mpx_'+i,expAcc(c),['expense','cogs'])}</label>`).join('');
  $('#mapAsset').innerHTML=ASSET_CATS.map(([c],i)=>{const m=assetAcc(c);
    return `<div class="f"><span style="display:block;font-size:11.5px;color:var(--slate);margin-bottom:3px;font-weight:500">${esc(c)}</span>
      <div class="row" style="gap:6px;flex-wrap:nowrap">${coaSel('mpa_'+i,m[0],['asset'])}${coaSel('mpd_'+i,m[1],['asset'])}</div></div>`}).join('');
}
function saveMap(){
  if(!can('doc.coa')) return toast('บัญชีนี้ไม่มีสิทธิแก้ไขการผูกบัญชี');
  MAP_CORE.forEach(([k])=>{const el=$('#mp_'+k); if(el) DB.map[k]=el.value});
  DB.map.exp={}; EXP_CATS.forEach((c,i)=>{const el=$('#mpx_'+i); if(el) DB.map.exp[c]=el.value});
  DB.map.asset={}; ASSET_CATS.forEach(([c],i)=>{const a=$('#mpa_'+i),d=$('#mpd_'+i);
    if(a&&d) DB.map.asset[c]=[a.value,d.value]});
  save(); renderCoa(); renderTrial(); toast('บันทึกการผูกรหัสบัญชีแล้ว');
}
/* ---------- งบทดลอง ---------- */
function trialBalance(y){
  coaInit();
  const f=finance(y), m=DB.map, out=[], add=(code,dr,cr)=>{
    if(!code) return; if(Math.abs(dr||0)<0.005&&Math.abs(cr||0)<0.005) return;
    const ex=out.find(x=>x.code===code);
    if(ex){ex.debit+=dr||0;ex.credit+=cr||0} else out.push({code,name:accName(code),
      type:(DB.coa.find(a=>a.code===code)||{}).type||'',debit:dr||0,credit:cr||0});
  };
  const rcY=DB.receipts.filter(r=>inYear(r.date,y)&&!r.cancelled);
  let revParts=0,revLabor=0;
  rcY.forEach(r=>{ (r.items||[]).forEach(it=>{ const amt=n(it.qty)*n(it.price);
    if(it.type==='labor') revLabor+=amt; else revParts+=amt; }); });
  const disc=rcY.reduce((a,r)=>a+n(r.disc),0);
  const scale=(revParts+revLabor)>0?Math.max(0,(revParts+revLabor-disc))/(revParts+revLabor):1;
  add(m.cash,Math.max(0,f.cash),Math.max(0,-f.cash));
  add(m.ar,f.ar,0); add(m.inv,f.inv,0);
  add(m.vatIn,f.vatBuyExp+f.vatBuyPur,0); add(m.whtIn,f.whtIn,0);
  DB.assets.filter(a=>+String(a.date).slice(0,4)<=y).forEach(a=>{
    const [ac,dc]=assetAcc(a.cat), d=assetDep(a,y);
    add(ac,n(a.cost),0); add(dc,0,d.accEnd); });
  add(m.ap,0,DB.purchases.filter(p=>!p.paid&&!p.cancelled).reduce((a,p)=>a+grTotals(p).total,0));
  add(m.accrued,0,DB.expenses.filter(x=>!x.paid).reduce((a,x)=>a+expTotals(x).net,0));
  add(m.vatOut,0,f.vatSale); add(m.whtOut,0,f.whtOut);
  add(m.sso,0,ssoSummary().total);
  add(m.loan,0,f.loanOut);
  add(m.capital,0,f.invest); add(m.draw,f.draw,0);
  add(m.revParts,0,revParts*scale); add(m.revLabor,0,revLabor*scale);
  add(m.cogs,f.cogs,0);
  add(m.payroll,payrollMonthly()*monthsElapsed(y)-ssoSummary().er*monthsElapsed(y),0);
  add(m.ssoEr,ssoSummary().er*monthsElapsed(y),0);
  add(m.dep,f.dep,0);
  DB.expenses.filter(x=>inYear(x.date,y)).forEach(x=>add(expAcc(x.cat),expTotals(x).base,0));
  return out.sort((a,b)=>a.code.localeCompare(b.code));
}
function renderTrial(){
  const y=acctY(), rows=trialBalance(y);
  $('#tbYear').textContent=y+543;
  const dr=rows.reduce((a,x)=>a+x.debit,0), cr=rows.reduce((a,x)=>a+x.credit,0);
  $('#tbTbl tbody').innerHTML=rows.map(x=>`<tr><td class="mono"><b>${esc(x.code)}</b></td><td>${esc(x.name)}</td>
    <td><span class="chip">${esc(ACC_TYPE_LABEL[x.type]||'-')}</span></td>
    <td class="num">${x.debit?money(x.debit):''}</td><td class="num">${x.credit?money(x.credit):''}</td></tr>`).join('')
    ||'<tr><td colspan="5" class="empty">ยังไม่มีรายการบัญชีในปีนี้</td></tr>';
  const diff=dr-cr;
  $('#tbTbl tfoot').innerHTML=`<tr><td colspan="3">รวมทั้งสิ้น</td><td class="num"><b>${money(dr)}</b></td><td class="num"><b>${money(cr)}</b></td></tr>
    <tr><td colspan="3" class="hint">${Math.abs(diff)<1?'เดบิตและเครดิตสมดุล':'ผลต่างจากการประมาณการ (ผู้ทำบัญชีปรับปรุงเป็นกำไรสะสม/รายการปรับปรุง)'}</td>
    <td class="num" colspan="2">${money(Math.abs(diff))}</td></tr>`;
}
function exportTbCsv(){
  const y=acctY(), rows=trialBalance(y);
  const out=[['รหัสบัญชี','ชื่อบัญชี','หมวดบัญชี','เดบิต','เครดิต']]
    .concat(rows.map(x=>[x.code,x.name,ACC_TYPE_LABEL[x.type]||'',x.debit.toFixed(2),x.credit.toFixed(2)]));
  dlCsv(out,'trial-balance-'+(y+543)+'.csv');
}
function printTrial(){
  const y=acctY(), rows=trialBalance(y);
  const dr=rows.reduce((a,x)=>a+x.debit,0), cr=rows.reduce((a,x)=>a+x.credit,0);
  printDocs(repHead('งบทดลอง (Trial Balance)','สำหรับปีบัญชีสิ้นสุดวันที่ 31 ธันวาคม '+(y+543)+'<br>พิมพ์วันที่ '+thDate(iso()))+
    `<table><thead><tr><th style="width:80px">รหัสบัญชี</th><th>ชื่อบัญชี</th><th style="width:120px">หมวดบัญชี</th>
      <th style="width:100px">เดบิต</th><th style="width:100px">เครดิต</th></tr></thead><tbody>
      ${rows.map(x=>`<tr><td>${esc(x.code)}</td><td>${esc(x.name)}</td><td>${esc(ACC_TYPE_LABEL[x.type]||'')}</td>
        <td class="num">${x.debit?money(x.debit):''}</td><td class="num">${x.credit?money(x.credit):''}</td></tr>`).join('')}
      <tr><td colspan="3" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td class="num"><b>${money(dr)}</b></td><td class="num"><b>${money(cr)}</b></td></tr>
      </tbody></table>
    <div class="note">จัดทำตามผังบัญชีมาตรฐานกรมพัฒนาธุรกิจการค้า · ยอดเงินสดและเงินเดือนเป็นการประมาณการจากข้อมูลในระบบ ผู้ทำบัญชีควรปรับปรุงรายการก่อนปิดงบ</div>
    <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
      <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ทำบัญชี</span></div></div></div>`);
}

/* ---------- พิมพ์รายงาน ---------- */
function repHead(title,sub,en){
  return sheetTop({title:title,en:en||'INTERNAL REPORT',copy:'รายงานภายใน',
    fields:[['วันที่พิมพ์',thDate(iso())]],
    note:String(sub||'').replace(/พิมพ์วันที่[^<]*/g,'').replace(/(<br>)+$/,'')}); }
function printExpReport(){
  const y=acctY(), rows=DB.expenses.filter(x=>inYear(x.date,y)).sort((a,b)=>a.date.localeCompare(b.date));
  const t=rows.reduce((a,x)=>{const v=expTotals(x);return{base:a.base+v.base,vat:a.vat+v.vat,wht:a.wht+v.wht,net:a.net+v.net}},{base:0,vat:0,wht:0,net:0});
  printDocs(repHead('ทะเบียนค่าใช้จ่ายกิจการ','ปีบัญชี '+(y+543)+'<br>พิมพ์วันที่ '+thDate(iso()))+
    `<table><thead><tr><th style="width:95px">เลขที่</th><th style="width:64px">วันที่</th>
      <th style="width:58px">รหัสบัญชี</th><th style="width:125px">หมวด</th>
      <th>รายละเอียด / ผู้รับเงิน</th><th style="width:80px">ก่อนภาษี</th><th style="width:66px">VAT</th>
      <th style="width:66px">หัก ณ ที่จ่าย</th><th style="width:80px">จ่ายจริง</th></tr></thead><tbody>
      ${rows.map(x=>{const v=expTotals(x);return `<tr><td>${esc(x.no)}</td><td>${thDate(x.date)}</td>
        <td>${esc(expAcc(x.cat))}</td><td>${esc(x.cat)}</td>
        <td>${esc(x.desc)}${x.payee?' — '+esc(x.payee):''}</td><td class="num">${money(v.base)}</td>
        <td class="num">${money(v.vat)}</td><td class="num">${money(v.wht)}</td><td class="num">${money(v.net)}</td></tr>`}).join('')}
      <tr><td colspan="5" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td class="num"><b>${money(t.base)}</b></td>
        <td class="num"><b>${money(t.vat)}</b></td><td class="num"><b>${money(t.wht)}</b></td><td class="num"><b>${money(t.net)}</b></td></tr>
      </tbody></table>
    <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
      <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้อนุมัติ</span></div></div></div>`);
}
function printAssetReg(){
  const y=acctY(), rows=DB.assets.slice().sort((a,b)=>a.date.localeCompare(b.date));
  const t=rows.reduce((acc,a)=>{const d=assetDep(a,y);
    return{cost:acc.cost+n(a.cost),cur:acc.cur+d.thisYear,acc:acc.acc+d.accEnd,nbv:acc.nbv+(a.status==='sold'?0:d.nbv)}},{cost:0,cur:0,acc:0,nbv:0});
  printDocs(repHead('ทะเบียนทรัพย์สินและค่าเสื่อมราคา','ปีบัญชี '+(y+543)+' · วิธีเส้นตรง<br>พิมพ์วันที่ '+thDate(iso()))+
    `<table><thead><tr><th style="width:88px">เลขทะเบียน</th><th style="width:64px">วันที่ได้มา</th><th>รายการ</th>
      <th style="width:52px">รหัสบัญชี</th><th style="width:110px">ประเภท</th><th style="width:40px">อายุ</th><th style="width:80px">ราคาทุน</th>
      <th style="width:78px">ค่าเสื่อมปีนี้</th><th style="width:82px">ค่าเสื่อมสะสม</th><th style="width:80px">คงเหลือสุทธิ</th></tr></thead><tbody>
      ${rows.map(a=>{const d=assetDep(a,y);return `<tr><td>${esc(a.no)}</td><td>${thDate(a.date)}</td>
        <td>${esc(a.name)}${a.status==='sold'?' (จำหน่ายแล้ว)':''}</td>
        <td>${esc(assetAcc(a.cat)[0])}</td><td>${esc(a.cat)}</td>
        <td style="text-align:center">${n(a.life)}</td><td class="num">${money(a.cost)}</td>
        <td class="num">${money(d.thisYear)}</td><td class="num">${money(d.accEnd)}</td>
        <td class="num">${money(a.status==='sold'?0:d.nbv)}</td></tr>`}).join('')}
      <tr><td colspan="6" style="text-align:right"><b>รวม</b></td><td class="num"><b>${money(t.cost)}</b></td>
        <td class="num"><b>${money(t.cur)}</b></td><td class="num"><b>${money(t.acc)}</b></td><td class="num"><b>${money(t.nbv)}</b></td></tr>
      </tbody></table>
    <div class="note">จัดทำตามมาตรา 65 ทวิ (2) แห่งประมวลรัษฎากร · อัตราค่าเสื่อมราคาคำนวณตามอายุการใช้งานที่กำหนดในทะเบียน</div>
    <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
      <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้อนุมัติ</span></div></div></div>`);
}
function printTaxReports(){
  renderTax(); const mo=acctM(), y=+mo.slice(0,4), lbl=TH_M[+mo.slice(5,7)-1]+' '+(y+543);
  /* คลายหน้าออกก่อน — ฉบับที่ยื่นต้องมีครบทุกใบในงวด ไม่ใช่แค่หน้าที่เปิดค้างไว้ */
  renderTaxSaleRows(true); renderTaxBuyRows(true);
  const tbl=(id,head)=>{const el=$(id); return `<table><thead>${el.querySelector('thead').innerHTML}</thead>
    <tbody>${el.querySelector('tbody').innerHTML}</tbody><tfoot>${el.querySelector('tfoot')?el.querySelector('tfoot').innerHTML:''}</tfoot></table>`;};
  try{ printDocs(
    repHead('รายงานภาษีขาย','งวดเดือน '+lbl)+tbl('#taxSaleTbl')+
    `<div class="note">จัดทำตามประกาศอธิบดีกรมสรรพากร เกี่ยวกับภาษีมูลค่าเพิ่ม (ฉบับที่ 89)</div></div>`+
    repHead('รายงานภาษีซื้อ','งวดเดือน '+lbl)+tbl('#taxBuyTbl')+
    `<div class="note">เก็บรักษาพร้อมใบกำกับภาษีซื้อไม่น้อยกว่า 5 ปี</div></div>`+
    repHead('สรุปภาษีที่ต้องนำส่ง','งวดเดือน '+lbl)+`<table>${$('#taxSumTbl').innerHTML}</table>`+
    `<div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
      <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้มีอำนาจลงนาม</span></div></div></div>`);
  } finally { renderTaxSaleRows(); renderTaxBuyRows(); }   /* พิมพ์เสร็จกลับมาแบ่งหน้าเหมือนเดิม */
}
function printFS(){
  renderFS(); const y=acctY();
  printDocs(repHead('งบกำไรขาดทุน','สำหรับปีบัญชีสิ้นสุดวันที่ 31 ธันวาคม '+(y+543))+
    `<table>${$('#plTbl').innerHTML}</table></div>`+
    repHead('งบแสดงฐานะการเงิน','ณ วันที่ 31 ธันวาคม '+(y+543))+
    `<table>${$('#bsTbl').innerHTML}</table>
     <div class="note">ตัวเลขบางรายการเป็นการประมาณการจากข้อมูลที่บันทึกในระบบ ควรให้ผู้ทำบัญชีตรวจสอบและปรับปรุงรายการก่อนนำส่งกรมสรรพากร</div>
     <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำบัญชี</span></div>
       <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้มีอำนาจลงนาม</span></div></div></div>`+
    repHead('งบกระแสเงินสด (อย่างย่อ)','สำหรับปีบัญชี '+(y+543))+`<table>${$('#cfTbl').innerHTML}</table></div>`);
}
function printHealth(){
  const y=acctY(), f=finance(y);
  printDocs(repHead('รายงานสุขภาพการเงินของกิจการ','ปีบัญชี '+(y+543)+'<br>พิมพ์วันที่ '+thDate(iso()))+
    `<table><tbody>${$('#ratioTbl tbody').innerHTML}</tbody></table>
     <div class="box"><span class="lbl">สรุปผลการดำเนินงาน</span><br>
       รายได้ ${money(f.revenue)} บาท · ต้นทุนขาย ${money(f.cogs)} บาท · กำไรขั้นต้น ${money(f.gp)} บาท<br>
       ค่าใช้จ่ายดำเนินงาน ${money(f.opex)} บาท · กำไรสุทธิ ${money(f.np)} บาท<br>
       เงินสดคงเหลือโดยประมาณ ${money(f.cash)} บาท · ลูกหนี้ ${money(f.ar)} บาท · เจ้าหนี้ ${money(f.ap)} บาท</div>
     <table style="margin-top:8px"><thead>${$('#pnlMonthTbl thead').innerHTML}</thead>
       <tbody>${$('#pnlMonthTbl tbody').innerHTML}</tbody><tfoot>${$('#pnlMonthTbl tfoot').innerHTML}</tfoot></table></div>`);
}


/* ==========================================================
   ขั้นตอนการอนุมัติเอกสาร
   ========================================================== */
const PERM_APV=[['quote','อนุมัติใบเสนอราคา / ใบอนุมัติซ่อม'],['receipt','อนุมัติใบเสร็จรับเงิน'],
  ['tax','อนุมัติใบกำกับภาษี'],['gr','อนุมัติใบรับสินค้า / ใบซื้อสินค้า'],['claim','อนุมัติใบเคลมสินค้า'],
  ['issue','อนุมัติใบเบิกของภายใน'],['count','อนุมัติใบตรวจนับสินค้า'],['billing','อนุมัติใบวางบิล'],['invoice','อนุมัติใบแจ้งหนี้']];
const APV_LABEL={draft:'ร่าง',pending:'รออนุมัติ',approved:'อนุมัติแล้ว',rejected:'ไม่อนุมัติ / ตีกลับ'};
const APV_CLS={draft:'',pending:'a',approved:'g',rejected:'r'};
function apvOf(d){ return (d&&d.apv)||{status:'draft',byName:'',date:'',note:''}; }
function isApproved(d){ return apvOf(d).status==='approved'; }
function meName(){ const e=curEmp(); return e?(e.code+' · '+e.name):'เจ้าของกิจการ / ผู้ดูแลระบบ'; }

/* ==========================================================
   ชื่อผู้บันทึก — ตรวจสอบย้อนหลังได้ว่าใครเป็นคนทำรายการนี้
   ----------------------------------------------------------
   ฝั่งหลังบ้าน (Cloud SaaS) แมปเป็นคอลัมน์มาตรฐานได้ตรง ๆ:
     createdBy / createdAt / updatedBy / updatedAt
   เก็บ "ชื่อ ณ ตอนบันทึก" (createdByName) ไว้คู่กับ id ด้วย
   เพราะพนักงานอาจเปลี่ยนชื่อ ย้ายตำแหน่ง หรือถูกปิดบัญชีภายหลัง
   ถ้าเก็บแต่ id เอกสารเก่าจะกลายเป็นชื่อว่างทันทีที่คนนั้นออก
   ========================================================== */
function stampRec(rec,old){
  if(!rec) return rec;
  const id=DB.curEmp||'', nm=meName(), ts=nowTs();
  /* หาต้นทางของ "ผู้สร้าง" — บางหน้าประกอบ object ใหม่ทุกครั้งที่บันทึก
     ต้องดึงของเดิมมาใส่ ไม่งั้นคนที่เข้ามาแก้จะกลายเป็นคนสร้างแทน */
  const src=(old&&old.createdAt)?old:(rec.createdAt?rec:null);
  if(src){ rec.createdBy=src.createdBy||''; rec.createdByName=src.createdByName||''; rec.createdAt=src.createdAt; }
  else   { rec.createdBy=id; rec.createdByName=nm; rec.createdAt=ts; }
  rec.updatedBy=id; rec.updatedByName=nm; rec.updatedAt=ts;
  return rec;
}
/* ตัดรหัสพนักงานออกเหลือแต่ชื่อ ให้คอลัมน์ในตารางไม่กว้างเกินไป */
function byShort(rec){
  const s=(rec&&(rec.createdByName||rec.updatedByName))||'';
  if(!s) return '';
  if(s.indexOf('เจ้าของกิจการ')===0) return 'เจ้าของกิจการ';
  const i=s.indexOf(' · '); return i>=0?s.slice(i+3):s;
}
/* ข้อความเต็มสำหรับ tooltip — บอกทั้งคนสร้างและคนแก้ล่าสุด */
function byTip(rec){
  if(!rec||!rec.createdAt) return 'ไม่มีข้อมูลผู้บันทึก — รายการนี้บันทึกไว้ก่อนเปิดใช้ระบบบันทึกชื่อผู้ทำรายการ';
  let t='บันทึกโดย '+(rec.createdByName||'-')+'\nเมื่อ '+thDateTime(rec.createdAt);
  if(rec.updatedAt&&rec.updatedAt!==rec.createdAt)
    t+='\n\nแก้ไขล่าสุดโดย '+(rec.updatedByName||'-')+'\nเมื่อ '+thDateTime(rec.updatedAt);
  return t;
}
/* <td> คอลัมน์ผู้บันทึก — มี ✎ ต่อท้ายถ้าเคยถูกแก้ไขหลังสร้าง */
function byCell(rec){
  const nm=byShort(rec);
  const edited=rec&&rec.updatedAt&&rec.createdAt&&rec.updatedAt!==rec.createdAt;
  /* รายการเก่าที่บันทึกก่อนเปิดใช้ระบบนี้ปล่อยช่องว่างไว้ ไม่ใส่ "-"
     เพราะบนมือถือการ์ดจะซ่อนช่องว่างให้เอง ไม่งั้นทุกใบเก่าจะมีบรรทัดเปล่าเกินมา */
  return `<td class="byc" title="${esc(byTip(rec))}">`
    +(nm?esc(nm)+(edited?'<span class="byedit">✎</span>':''):'')+'</td>';
}
/* กล่อง "ประวัติการบันทึก" ในฟอร์มรายละเอียด — ใช้กับทะเบียนที่ไม่โชว์คอลัมน์
   ในตารางด้านนอก (ทะเบียนอะไหล่ · ลูกค้า) เพื่อไม่ให้ตารางกว้างเกินจอ
   ช่องเป็น readonly ทั้งหมด ระบบเก็บให้เอง ผู้ใช้แก้ไม่ได้ */
function byBoxHtml(rec){
  if(!rec) return '<p class="hint" style="margin:0">ระบบจะบันทึกชื่อผู้ทำรายการให้อัตโนมัติเมื่อกดบันทึกครั้งแรก</p>';
  if(!rec.createdAt) return '<p class="hint" style="margin:0">รายการนี้บันทึกไว้ก่อนเปิดใช้ระบบบันทึกชื่อผู้ทำรายการ จึงไม่มีข้อมูลย้อนหลัง</p>';
  const edited=rec.updatedAt&&rec.updatedAt!==rec.createdAt;
  const f=(lb,v)=>`<label class="f"><span>${lb}</span><input type="text" value="${esc(v)}" readonly></label>`;
  return '<div class="grid g4" style="margin-bottom:0">'
    +f('ผู้สร้างรายการ',rec.createdByName||'-')
    +f('วันเวลาที่สร้าง',thDateTime(rec.createdAt))
    +f('ผู้แก้ไขล่าสุด',edited?(rec.updatedByName||'-'):'— ยังไม่เคยถูกแก้ไข —')
    +f('วันเวลาที่แก้ไขล่าสุด',edited?thDateTime(rec.updatedAt):'-')
    +'</div>';
}
function setByBox(elId,rec){ const el=$('#'+elId); if(el) el.innerHTML=byBoxHtml(rec); }
/* บรรทัดผู้บันทึกสำหรับหัวเอกสาร / การ์ดบนมือถือ */
function byLine(rec){
  const nm=byShort(rec); if(!nm) return '';
  const edited=rec&&rec.updatedAt&&rec.createdAt&&rec.updatedAt!==rec.createdAt;
  return `<span class="hint byline" title="${esc(byTip(rec))}">ผู้บันทึก: ${esc(nm)}${edited?' ✎':''}</span>`;
}
function apvChip(d){ const a=apvOf(d); return `<span class="chip ${APV_CLS[a.status]||''}">${APV_LABEL[a.status]||'ร่าง'}</span>`; }
function apvInfo(d){ const a=apvOf(d);
  if(a.status==='approved') return 'อนุมัติโดย '+a.byName+' เมื่อ '+thDate(a.date);
  if(a.status==='rejected') return 'ตีกลับโดย '+a.byName+' เมื่อ '+thDate(a.date)+(a.note?' · เหตุผล: '+a.note:'');
  if(a.status==='pending') return 'ส่งขออนุมัติเมื่อ '+thDate(a.date)+' — รอผู้มีสิทธิอนุมัติ';
  return 'ยังไม่ได้ส่งขออนุมัติ'; }
function curDoc(kind){ return kind==='quote'?Q:kind==='receipt'?R:kind==='claim'?C:kind==='issue'?IS:kind==='count'?SC:kind==='billing'?BN:kind==='invoice'?IV:G; }
function apvSaveDoc(kind){
  const d=curDoc(kind);
  if(kind==='quote'){ const i=DB.quotes.findIndex(x=>x.id===d.id); if(i>=0) DB.quotes[i]=cleanQuote(d); }
  if(kind==='receipt'){ const i=DB.receipts.findIndex(x=>x.id===d.id);
    if(i>=0){ const rc=JSON.parse(JSON.stringify(d)); rc.items=rItemsClean(d); DB.receipts[i]=rc; } }
  if(kind==='gr'){ const i=DB.purchases.findIndex(x=>x.id===d.id);
    if(i>=0){ const gc=JSON.parse(JSON.stringify(d)); gc.items=grItemsClean(d); DB.purchases[i]=gc; } }
  if(kind==='claim'){ const i=DB.claims.findIndex(x=>x.id===d.id);
    if(i>=0){ const cc=JSON.parse(JSON.stringify(d)); cc.items=clItemsClean(d); DB.claims[i]=cc; } }
  if(kind==='issue'){ const i=DB.issues.findIndex(x=>x.id===d.id);
    if(i>=0){ const ic=JSON.parse(JSON.stringify(d)); ic.items=isItemsClean(d); DB.issues[i]=ic; } }
  if(kind==='count'){ const i=DB.stockCounts.findIndex(x=>x.id===d.id);
    if(i>=0) DB.stockCounts[i]=JSON.parse(JSON.stringify(d)); }
  if(kind==='billing'){ const i=DB.billings.findIndex(x=>x.id===d.id);
    if(i>=0) DB.billings[i]=JSON.parse(JSON.stringify(d)); }
  if(kind==='invoice'){ const i=DB.invoices.findIndex(x=>x.id===d.id);
    if(i>=0) DB.invoices[i]=JSON.parse(JSON.stringify(d)); }
  save();
}
function apvKeyOf(kind,d){ return (kind==='receipt'&&d&&d.issueTax)?'receipt':kind; }
/* เตือนกันลืมใส่ค่าแรงในใบเสนอราคา — เตือนเมื่อมีรายการอะไหล่แล้วแต่ไม่มีบรรทัดค่าแรงที่มีราคา */
let laborWarnBypass=false;
function quoteMissingLabor(q){
  const its=((q&&q.items)||[]).filter(qFilled);
  if(!its.length) return false;   /* ใบเปล่าไม่ต้องเตือน */
  return !its.some(it=>it.type==='labor'&&n(it.price)>0);
}
async function sendApv(kind){
  let d=curDoc(kind);
  if(d&&d.cancelled) return toast('เอกสารนี้ถูกยกเลิกแล้ว ส่งขออนุมัติไม่ได้');
  /* ชั้นที่สอง — ซ่อน/ทำจางปุ่มอย่างเดียวไม่พอ เพราะบน Cloud อาจมีคนเปิดใบเดียวกันพร้อมกันคนละเครื่อง
     ถ้าปล่อยให้กดซ้ำได้ เวลาที่ส่งครั้งแรกจะถูกทับ (ดูไม่ออกว่าใบไหนค้างนาน) และประวัติเอกสารจะรก */
  const st0=apvOf(d).status;
  if(st0==='pending') return toast('ใบนี้ส่งขออนุมัติไปแล้ว — กำลังรอผู้มีสิทธิอนุมัติ');
  if(st0==='approved') return toast('ใบนี้อนุมัติเรียบร้อยแล้ว ไม่ต้องส่งขออนุมัติอีก');
  if(kind==='quote'&&d&&!laborWarnBypass&&quoteMissingLabor(d)){
    askConfirm({title:'ยังไม่ได้ใส่ค่าแรง / ค่าบริการ',
      msg:'ใบเสนอราคานี้มีรายการอะไหล่ แต่<b>ยังไม่มีบรรทัดค่าแรง / ค่าบริการ</b>'
        +'<br>หากลืมใส่ ให้กลับไปเพิ่มก่อนส่งขออนุมัติ',
      yes:'ส่งขออนุมัติโดยไม่มีค่าแรง', no:'กลับไปใส่ค่าแรง',
      onYes:async()=>{ laborWarnBypass=true; try{ await sendApv(kind); }finally{ laborWarnBypass=false; } }});
    return;
  }
  /* บันทึกให้เองก่อนส่งเสมอ — เดิมทำเฉพาะใบเสนอราคา อีก 7 ประเภทเด้งให้ไปกดบันทึกเองก่อน
     ซึ่งเป็นเหตุให้คนบันทึกแล้วลืมส่ง เอกสารเลยกองอยู่โดยไม่มีใครรู้ */
  const APV_SAVE={quote:'saveQuote',receipt:'saveReceipt',gr:'saveGR',claim:'saveClaim',
    issue:'saveIssue',count:'saveCount',billing:'saveBilling',invoice:'saveInvoiceDoc'};
  const sv=window[APV_SAVE[kind]];
  if(typeof sv==='function') await fxMuteAsync(()=>sv());
  d=curDoc(kind);
  if(!d||!d.no) return;   /* บันทึกไม่ผ่าน — ฟังก์ชันบันทึกแจ้งเหตุผลไปแล้ว ไม่ต้องเด้งซ้ำ */
  d.apv={status:'pending',by:DB.curEmp||'',byName:meName(),date:iso(),note:''};
  logAudit(kind,d,'send'); apvSaveDoc(kind); renderApvBars(); renderApvAlert();
  saveFx('ส่งขออนุมัติแล้ว',d.no);
  toast('ส่งเอกสาร '+d.no+' ขออนุมัติแล้ว — ผู้มีสิทธิ์อนุมัติจะเห็นแจ้งเตือนบนหน้าแรก');
}
async function approveDoc(kind){
  const d=curDoc(kind);
  if(d&&d.cancelled) return toast('เอกสารนี้ถูกยกเลิกแล้ว อนุมัติไม่ได้');
  if(kind==='quote'&&d){ fxMute(()=>saveQuote()); if(!d.no) return; }
  /* ประเภทอื่นก็บันทึกให้เองเมื่อยังไม่มีเลขที่ — กดอนุมัติจังหวะเดียวจบ
     ใช้ตารางฟังก์ชันบันทึกชุดเดียวกับ sendApv · บันทึกไม่ผ่านตัวบันทึกแจ้งเหตุผลเองแล้ว */
  if(kind!=='quote'&&d&&!d.no){
    const sv=window[{receipt:'saveReceipt',gr:'saveGR',claim:'saveClaim',issue:'saveIssue',
      count:'saveCount',billing:'saveBilling',invoice:'saveInvoiceDoc'}[kind]];
    /* saveGR / saveReceipt เป็น async (มีป๊อปอัพถามระหว่างทาง) — ต้องรอให้บันทึกจบก่อน
       ไม่งั้นจะเช็คเลขที่เอกสารตอนที่ยังบันทึกไม่เสร็จ */
    if(typeof sv==='function') await fxMuteAsync(()=>sv());
    if(!d.no) return;
  }
  if(!d||!d.no) return toast('บันทึกเอกสารให้มีเลขที่ก่อน');
  if(!can('apv.'+apvKeyOf(kind,d))) return toast('บัญชีนี้ไม่ได้รับสิทธิอนุมัติเอกสารประเภทนี้');
  if(kind==='receipt'&&d.issueTax&&!can('apv.tax')) return toast('ใบนี้ออกใบกำกับภาษีด้วย ต้องมีสิทธิอนุมัติใบกำกับภาษี');
  /* เตือนก่อนตัดสต๊อก แบบเดียวกับใบเสนอราคา/ใบเสร็จ — กดยืนยันแล้วยอมให้ติดลบ
     (ยอมติดลบดีกว่ากลืนส่วนเกินเงียบ ๆ เพราะตัวเลขติดลบเห็นได้ว่าต้องไปตามของ) */
  const shortSrc=kind==='claim'?(d.deduct!==false&&!d.deducted?clItemsClean(d):[])
    :kind==='issue'?(!d.deducted?isItemsClean(d):[]):[];
  const short=shortLines(shortSrc);
  if(short.length&&!await askP({title:'สต๊อกไม่พอ',
    text:'อะไหล่ '+short.length+' รายการมีไม่พอในสต๊อก\n\n'+shortText(short)
      +'\n\nอนุมัติต่อไปสต๊อกจะติดลบ (ตัวเลขติดลบคือสัญญาณว่าต้องไปตามของเข้าระบบ)\nยืนยันอนุมัติหรือไม่',
    yes:'ยืนยันอนุมัติ',no:'ยังไม่อนุมัติ'})) return;
  d.apv={status:'approved',by:DB.curEmp||'',byName:meName(),date:iso(),note:''};
  logAudit(kind,d,'approve','อนุมัติโดย '+meName());
  if(kind==='gr'&&!d.posted&&grItemsClean(d).length){ postGR(d); logAudit('gr',d,'post','รับเข้าสต๊อก '+grItemsClean(d).length+' รายการ'); }
  if(kind==='claim'&&!d.deducted&&d.deduct!==false&&clItemsClean(d).length){ postClaim(d);
    logAudit('claim',d,'deduct2','ตัดสต๊อกส่งเคลม '+clItemsClean(d).length+' รายการ'); }
  if(kind==='issue'&&!d.deducted&&isItemsClean(d).length){ postIssue(d);
    logAudit('issue',d,'deduct3','ตัดสต๊อกเบิกใช้ภายใน '+isItemsClean(d).length+' รายการ'); }
  if(kind==='count'&&!d.applied&&(d.items||[]).length){ postCount(d);
    logAudit('count',d,'adjust','ปรับยอด '+(d.items||[]).filter(it=>n(it.countedQty)!==n(it.sysQty)).length+' รายการ'); }
  apvSaveDoc(kind); renderApvBars(); renderApvAlert();
  if(kind==='quote'){ refreshQuoteRefs(); renderQPrev(); }
  if(kind==='receipt'){ renderRPrev(); }
  if(kind==='gr'){ renderStock(); renderGRList(); renderGRItems();
    const gn=$('#grNo'); if(gn&&d.no) gn.textContent='เลขที่ '+d.no+' · รับเข้าสต๊อกแล้ว'; }
  if(kind==='claim'){ renderStock(); renderClaimList(); fillClaimForm(); }
  if(kind==='issue'){ renderStock(); renderIssueList(); fillIssueForm(); }
  if(kind==='count'){ renderStock(); renderCountList(); fillCountForm(); }
  if(kind==='billing'){ renderBillingList(); fillBillingForm(); }
  if(kind==='invoice'){ renderInvoiceList(); fillInvoiceForm(); }
  /* 4 ประเภทที่กระทบสต๊อก ใช้ป๊อปอัพเครื่องหมายถูกแบบเดียวกับ "อนุมัติซ่อมและตัดสต๊อก"
     บอกชัดว่าสต๊อกขยับกี่รายการ · ประเภทอื่นใช้การ์ดกลางจอเหมือนเดิม */
  const TICK={
    gr:['อนุมัติใบรับสินค้าแล้ว','รับสินค้าเข้าสต๊อก '+grItemsClean(d).length+' รายการ'],
    claim:['อนุมัติใบเคลมสินค้าแล้ว',(d.deduct===false?'ใบนี้ไม่ตัดสต๊อก':'ตัดสต๊อกส่งเคลม '+clItemsClean(d).length+' รายการ')],
    issue:['อนุมัติใบเบิกของแล้ว','ตัดสต๊อกเบิกใช้ภายใน '+isItemsClean(d).length+' รายการ'],
    count:['อนุมัติใบตรวจนับแล้ว','ปรับยอดสต๊อกตามผลนับ '+((d.items||[]).filter(it=>n(it.countedQty)!==n(it.sysQty)).length)+' รายการ']
  }[kind];
  if(TICK) askConfirm({ ok:TICK[1], title:TICK[0],
    msg:'เอกสาร <b>'+esc(d.no)+'</b> อนุมัติโดย '+esc(meName()),
    yes:'ตกลง', noHide:true });
  else saveFx('อนุมัติเอกสารแล้ว',d.no);
  toast('อนุมัติเอกสาร '+d.no+' แล้ว โดย '+meName());
}
async function rejectDoc(kind){
  const d=curDoc(kind);
  if(!can('apv.'+apvKeyOf(kind,d))) return toast('บัญชีนี้ไม่ได้รับสิทธิอนุมัติเอกสารประเภทนี้');
  /* กติกา: อนุมัติแล้ว = สิ้นสุด คืนสถานะ/ตีกลับไม่ได้อีก (ทุกบัญชีรวมเจ้าของกิจการ)
     ตีกลับได้เฉพาะใบที่รออนุมัติ — ใบอนุมัติแล้วที่มีปัญหาให้คัดลอกเป็นใบใหม่ หรือยกเลิกเอกสาร */
  if(isApproved(d)) return toast('เอกสาร '+(d.no||'')+' อนุมัติแล้ว ตีกลับ/คืนสถานะไม่ได้ — หากใบนี้มีปัญหาให้ใช้ "คัดลอกใบนี้" สร้างใบใหม่ หรือยกเลิกเอกสาร');
  const note=await askPromptP({title:'ไม่อนุมัติ / ตีกลับเอกสาร '+(d.no||''),text:'ระบุเหตุผลที่ไม่อนุมัติ / ตีกลับ',yes:'ตีกลับเอกสาร',no:'ยกเลิก'});
  if(note===null) return;
  d.apv={status:'rejected',by:DB.curEmp||'',byName:meName(),date:iso(),note:String(note||'').trim()};
  logAudit(kind,d,'reject',String(note||'').trim()); apvSaveDoc(kind); renderApvBars(); renderApvAlert();
  /* วาดทะเบียนเบื้องหลังใหม่ทันที ไม่ต้องรอปิดป๊อปอัพ — ให้เท่าเทียมกับตอนกดอนุมัติ */
  const RJ={quote:()=>renderQuoteOverview(),receipt:()=>{renderDocOverview();renderTaxOverview();},
    gr:()=>renderGRList(),claim:()=>renderClaimList(),issue:()=>renderIssueList(),
    count:()=>renderCountList(),billing:()=>renderBillingList(),invoice:()=>renderDocOverview()}[kind];
  if(RJ){ try{RJ()}catch(e){} }
  toast('ตีกลับเอกสาร '+(d.no||'')+' แล้ว');
}
function apvBarHtml(kind,d){
  const a=apvOf(d), key=apvKeyOf(kind,d), may=can('apv.'+key);
  const btn=[];
  /* ปุ่มส่งขออนุมัติ: ไม่ซ่อน แต่ทำจาง+เปลี่ยนข้อความตามสถานะ ผู้ใช้จะได้รู้ว่ากดไปแล้วหรือยัง
     ตำแหน่งปุ่มไม่ขยับ (กันกดผิดปุ่ม) และข้อความบอกเหตุผลเองโดยไม่ต้องเอาเมาส์ชี้ — สำคัญกับมือถือ
     ใบที่ถูกตีกลับต้องกลับมากดส่งใหม่ได้ ไม่งั้นเอกสารจะค้างแก้ไม่ได้ */
  const sent=(a.status==='pending'||a.status==='approved');
  /* ยังไม่มีเลขที่ = ยังไม่เคยบันทึก — บอกให้ชัดว่าปุ่มนี้บันทึกให้ด้วยในตัว จะได้ไม่ต้องกดบันทึกก่อน */
  const sendLbl=a.status==='pending'?'ส่งขออนุมัติแล้ว'
    :a.status==='approved'?'ส่งขออนุมัติแล้ว'
    :a.status==='rejected'?'ส่งขออนุมัติอีกครั้ง'
    :(d&&!d.no)?'บันทึก & ส่งขออนุมัติ':'ส่งขออนุมัติ';
  const sendTip=a.status==='pending'?'ใบนี้ส่งขออนุมัติไปแล้ว กำลังรอผู้มีสิทธิอนุมัติ'
    :a.status==='approved'?'ใบนี้อนุมัติเรียบร้อยแล้ว'
    :a.status==='rejected'?'ใบนี้ถูกตีกลับ — แก้ไขแล้วกดส่งขออนุมัติได้อีกครั้ง':'ส่งเอกสารให้ผู้มีสิทธิอนุมัติ';
  if(a.status!=='approved') btn.push(`<button class="btn sm grn" ${sent?'disabled':''} title="${esc(sendTip)}" onclick="sendApv('${kind}')">${sendLbl}</button>`);
  if(may&&a.status!=='approved') btn.push(`<button class="btn sm grn" ${a.status==='approved'?'disabled title="เอกสารนี้อนุมัติแล้ว"':''} onclick="approveDoc('${kind}')">${a.status==='approved'?'อนุมัติแล้ว':'อนุมัติเอกสาร'}</button>`);
  if(may&&a.status==='pending') btn.push(`<button class="btn sm dgr" onclick="rejectDoc('${kind}')">ไม่อนุมัติ / ตีกลับ</button>`);
  return `<b style="font-size:12.5px">สถานะการอนุมัติ</b> ${apvChip(d)}
    <span class="who">${esc(apvInfo(d))}</span><div class="spacer"></div>
    <div class="apv-actions">
      <button class="btn sm gh" onclick="openAudit('${kind}','${esc(d.id||'')}')">ตรวจสอบเอกสาร</button>${btn.join(' ')}
    </div>`;
}
function renderApvBars(){
  if($('#cApvBar')&&C) $('#cApvBar').innerHTML=apvBarHtml('claim',C);
  if($('#qApvBar')&&Q) $('#qApvBar').innerHTML=apvBarHtml('quote',Q);
  if($('#rApvBar')&&R) $('#rApvBar').innerHTML=apvBarHtml('receipt',R);
  if($('#gApvBar')&&G) $('#gApvBar').innerHTML=apvBarHtml('gr',G);
  if($('#isApvBar')&&IS) $('#isApvBar').innerHTML=apvBarHtml('issue',IS);
  if($('#scApvBar')&&SC) $('#scApvBar').innerHTML=apvBarHtml('count',SC);
  if($('#bnApvBar')&&BN) $('#bnApvBar').innerHTML=apvBarHtml('billing',BN);
  if($('#ivApvBar')&&IV) $('#ivApvBar').innerHTML=apvBarHtml('invoice',IV);
  syncQuoteRailApv();
}
/* ปุ่ม ✓ "ขออนุมัติ" บนแถบลอยมือถือของใบเสนอราคา เรียกฟังก์ชันตรง ๆ ไม่ได้ผ่านแถบอนุมัติ
   จึงต้องซิงก์สถานะให้เองด้วย ไม่งั้นบนมือถือปุ่มจะกดได้เรื่อย ๆ ทั้งที่ส่งไปแล้ว */
function syncQuoteRailApv(){
  const b=document.querySelector('#mQuoteEdit .mrail .mr-ok'); if(!b) return;
  const st=Q?apvOf(Q).status:'draft';
  const done=!!(Q&&Q.cancelled)||st==='pending'||st==='approved';
  const lbl=b.querySelector('.ml');
  b.disabled=done;
  b.title=done?(st==='approved'?'ใบนี้อนุมัติแล้ว':(Q&&Q.cancelled)?'ใบนี้ถูกยกเลิกแล้ว':'ส่งขออนุมัติไปแล้ว รอผู้มีสิทธิอนุมัติ')
    :(st==='rejected'?'ใบนี้ถูกตีกลับ — แก้แล้วส่งใหม่ได้':'ส่งขออนุมัติ');
  if(lbl) lbl.textContent=done?'ส่งแล้ว':(st==='rejected'?'ส่งใหม่':'ขออนุมัติ');
}
/* ══════════ เอกสารที่รอ "คนที่กำลังใช้งานอยู่" อนุมัติ ══════════
   เดิมไม่มีจุดไหนแจ้งผู้มีสิทธิ์อนุมัติเลย เอกสารที่ส่งไปแล้วจึงกองเงียบ ๆ
   จนกว่าเขาจะเดินเข้าไปเปิดทะเบียนแล้วกรองสถานะเอง */
const APV_SRC=[
  ['quote',   'ใบเสนอราคา',            ()=>DB.quotes,      'openQuoteById',   'quote'],
  ['receipt', 'ใบเสร็จ / ใบแจ้งหนี้',   ()=>DB.receipts,    'openReceiptById', 'receipt'],
  ['gr',      'ใบรับสินค้า',            ()=>DB.purchases,   'openGRById',      'buy'],
  ['claim',   'ใบเคลมสินค้า',           ()=>DB.claims,      'openClaimById',   'stock'],
  ['issue',   'ใบเบิกใช้ภายใน',         ()=>DB.issues,      'openIssueById',   'stock'],
  ['count',   'ใบตรวจนับสินค้า',        ()=>DB.stockCounts, 'openCountById',   'stock'],
  ['billing', 'ใบวางบิล',              ()=>DB.billings,    'openBillingById', 'receipt'],
  ['invoice', 'ใบแจ้งหนี้',            ()=>DB.invoices,    'openInvoiceById', 'receipt']
];
function pendingApvList(){
  const out=[];
  APV_SRC.forEach(([kind,label,get,opener,tab])=>{
    (get()||[]).forEach(d=>{
      if(!d||d.cancelled) return;
      if(apvOf(d).status!=='pending') return;
      if(!can('apv.'+apvKeyOf(kind,d))) return;   /* เห็นเฉพาะใบที่ตัวเองมีสิทธิ์อนุมัติ */
      const a=apvOf(d);
      out.push({kind,label,opener,tab,id:d.id,no:d.no||'(ยังไม่มีเลขที่)',date:a.date,by:a.byName||'-',d});
    });
  });
  return out.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));   /* ค้างนานสุดขึ้นก่อน */
}
function openApvDoc(kind,id){
  const row=APV_SRC.find(x=>x[0]===kind); if(!row) return;
  const fn=window[row[3]];
  if(typeof fn==='function') fn(id); else toast('เปิดเอกสารประเภทนี้อัตโนมัติไม่ได้ — เข้าไปที่ทะเบียนแล้วกรองสถานะ "รออนุมัติ"');
}
/* ยอดเงินและคู่ค้าของเอกสารแต่ละประเภท — ใช้ในรายงานเอกสารรออนุมัติ
   ห่อ try ไว้เพราะเอกสารภายใน (ใบเบิก/ตรวจนับ) ไม่มีคู่ค้าและบางใบไม่มียอดเงิน */
function apvAmount(kind,d){
  try{
    if(kind==='quote')   return quoteTotals(d).total;
    if(kind==='receipt') return receiptTotals(d).net;
    if(kind==='gr')      return grTotals(d).total;
    if(kind==='billing') return (d.receiptIds||[]).reduce((a,id)=>{const r=DB.receipts.find(x=>x.id===id);return a+(r?receiptTotals(r).net:0)},0);
    if(kind==='invoice') return (d.refIds||[]).reduce((a,id)=>{const r=DB.receipts.find(x=>x.id===id);return a+(r?receiptTotals(r).net:0)},0);
  }catch(e){}
  return null;
}
function apvParty(kind,d){
  try{
    if(kind==='gr'||kind==='claim'){ const v=findVen(d.vendorId); return (v&&v.name)||'-'; }
    if(d.custId){ return custName(findCust(d.custId))||'-'; }
  }catch(e){}
  return '-';
}
function canApproveAnything(){ return APV_SRC.some(([k])=>can('apv.'+k)); }
/* ── รายงานเอกสารรอการอนุมัติ ── */
let apvListFilter='';
function openApvList(){ apvListFilter=''; renderApvList(); openModal('mApvList'); }
function apvListSet(k){ apvListFilter=k; renderApvList(); }
function apvOpenFromList(kind,id){ closeModal('mApvList'); openApvDoc(kind,id); }
function renderApvList(){
  const rows=pendingApvList(), today=iso();
  const byKind={}; rows.forEach(x=>{ byKind[x.kind]=(byKind[x.kind]||0)+1; });
  /* การ์ดสรุปด้านบน — กดเพื่อกรองเฉพาะประเภทนั้น */
  const card=(k,label,cnt)=>`<button class="apvcard ${apvListFilter===k?'on':''}" onclick="apvListSet('${k}')">
    <span class="ic"><svg class="pkg-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/></svg></span><span class="tx"><b>${esc(label)}</b><span>จำนวน ${cnt} รายการ</span></span></button>`;
  $('#apvListCards').innerHTML=[card('','ทั้งหมด',rows.length)]
    .concat(APV_SRC.filter(([k])=>byKind[k]).map(([k,label])=>card(k,label,byKind[k]))).join('');
  let list=apvListFilter?rows.filter(x=>x.kind===apvListFilter):rows;
  list=sortRows('apvListTbl',list);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  list=limitRows(list,'apvList');
  $('#apvListTbl tbody').innerHTML=list.map((x,i)=>{
    const amt=apvAmount(x.kind,x.d), wait=Math.max(0,daysBetween(x.date,today));
    const wc=wait>=7?'w2':wait>=3?'w1':'w0';
    return `<tr>
      <td class="ctr hint">${i+1}</td>
      <td><span class="chip b">${esc(x.label)}</span></td>
      <td class="ctr">${thDate(x.date)}</td>
      <td class="mono docno" onclick="apvOpenFromList('${x.kind}','${esc(x.id)}')">${esc(x.no)}</td>
      <td>${esc(apvParty(x.kind,x.d))}</td>
      <td class="num">${amt===null?'<span class="hint">-</span>':money(amt)}</td>
      <td style="font-size:12.5px">${esc(x.by)}</td>
      <td class="ctr"><span class="apvwait ${wc}">${wait===0?'วันนี้':wait+' วัน'}</span></td>
      <td class="ctr"><button class="btn sm gh" onclick="apvOpenFromList('${x.kind}','${esc(x.id)}')">เปิดเอกสาร</button></td>
    </tr>`;}).join('');
  $('#apvListEmpty').style.display=list.length?'none':'block';
  $('#apvListCount').textContent=rows.length+' ใบ'+(apvListFilter?' · กรอง '+list.length+' ใบ':'');
  if(typeof paintSort==='function') paintSort('apvListTbl');
  if(typeof mkCards==='function') mkCards('apvListTbl');
}
/* เมนูย่อยที่เอกสารแต่ละประเภทไปอยู่ — ใช้ยิงป้ายตัวเลขลงถึงชั้นเมนูย่อย
   เดิมป้ายขึ้นแค่หมวดหลัก (เช่น "07 สต๊อกอะไหล่ ③") ผู้ใช้กดเข้าไปแล้ว
   ยังต้องเดาเองว่าของค้างอยู่ที่เคลม เบิก หรือตรวจนับ */
const APV_SUBTAB={
  claim:  '#stkTabs button[data-s="claim"]',
  issue:  '#stkTabs button[data-s="issue"]',
  count:  '#stkTabs button[data-s="count"]',
  gr:     '#buyTabs button[data-b="gr"]',
  receipt:'#rOvTabs button[data-t="doc"]',
  invoice:'#rOvTabs button[data-t="doc"]',
  billing:'#rOvTabs button[data-t="billing"]'
};
/* ป้ายตัวเลขบนเมนู — บอกว่าเอกสารที่รออนุมัติอยู่ในหมวดไหนบ้าง */
/* ---- เสียงกระดิ่งแจ้งเตือน (สังเคราะห์ในตัว ไม่ใช้ไฟล์เสียง) ---- */
let dgACtx=null,bellReady=false;
addEventListener('pointerdown',()=>{bellReady=true},{once:true,capture:true});
function bellSound(){
  if(!bellReady)return; /* เบราว์เซอร์อนุญาตเสียงหลังผู้ใช้แตะจอครั้งแรก */
  try{
    dgACtx=dgACtx||new (window.AudioContext||window.webkitAudioContext)();
    if(dgACtx.state==='suspended')dgACtx.resume();
    const t=dgACtx.currentTime;
    [[1318.5,0,.22],[1760,.09,.18],[2637,.09,.05]].forEach(([f,dt,vol])=>{
      const o=dgACtx.createOscillator(),g=dgACtx.createGain();
      o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(.0001,t+dt);
      g.gain.exponentialRampToValueAtTime(vol,t+dt+.012);
      g.gain.exponentialRampToValueAtTime(.0001,t+dt+.95);
      o.connect(g);g.connect(dgACtx.destination);
      o.start(t+dt);o.stop(t+dt+1.05);
    });
  }catch(e){}
  const bl=$('#apvBell');
  if(bl){bl.classList.remove('ring');void bl.offsetWidth;bl.classList.add('ring');setTimeout(()=>bl.classList.remove('ring'),800)}
}
let _lastBellN=null;
function syncApvBadges(){
  const cnt={}, sub={};
  pendingApvList().forEach(x=>{
    cnt[x.tab]=(cnt[x.tab]||0)+1;
    if(APV_SUBTAB[x.kind]) sub[APV_SUBTAB[x.kind]]=(sub[APV_SUBTAB[x.kind]]||0)+1;
  });
  ['quote','receipt','buy','stock'].forEach(v=>{
    const btn=document.querySelector('#tabs .navparent[data-v="'+v+'"]'); if(!btn) return;
    let b=btn.querySelector('.bdg.apvbdg');
    if(!b){ b=document.createElement('span'); b.className='bdg apvbdg'; b.title='เอกสารรออนุมัติ';
      const chev=btn.querySelector('.chev');
      if(chev) btn.insertBefore(b,chev); else btn.appendChild(b); }
    const n=cnt[v]||0;
    b.style.display=n?'inline':'none'; b.textContent=n;
    b.title=n?('มีเอกสารรออนุมัติ '+n+' ใบในหมวดนี้ — กดเข้าไปดูเมนูย่อยที่มีตัวเลขกำกับ'):'เอกสารรออนุมัติ';
  });
  /* ป้ายชั้นเมนูย่อย — ชี้ให้ตรงว่าของค้างอยู่เมนูไหน */
  Object.entries(APV_SUBTAB).forEach(([,sel])=>{
    const btn=document.querySelector(sel); if(!btn) return;
    let b=btn.querySelector('.subbdg');
    if(!b){ b=document.createElement('span'); b.className='subbdg';
      /* เก็บชื่อเมนูเดิมไว้ก่อนแปะป้ายตัวเลข — หัวข้อใหญ่บนมือถืออ่านชื่อจากปุ่มนี้
         ถ้าอ่าน textContent สด ๆ จะได้เลขป้ายติดมาด้วย เช่น "ซื้อสินค้า0" */
      btn.dataset.lbl=btn.textContent.replace(/\s+/g,' ').trim();
      btn.appendChild(b); }
    const n=sub[sel]||0;
    b.style.display=n?'inline-block':'none'; b.textContent=n;
    btn.title=n?('รออนุมัติ '+n+' ใบ — เปิดเอกสารที่มีป้าย "รออนุมัติ" แล้วกดปุ่มอนุมัติ ตัวเลขจะหายไปเอง'):'';
  });
  /* กระดิ่ง: โชว์ให้คนที่มีสิทธิ์อนุมัติเสมอ (จะได้กดเข้ารายงานได้) แต่สั่น+ขึ้นเลขเฉพาะตอนมีของค้าง */
  const bell=$('#apvBell');
  if(bell){
    const total=Object.values(cnt).reduce((a,x)=>a+x,0);
    bell.classList.toggle('show',canApproveAnything());
    bell.classList.toggle('on',total>0);
    bell.title=total>0?('มีเอกสารรอการอนุมัติ '+total+' ใบ — กดเพื่อดูรายงาน'):'ไม่มีเอกสารรอการอนุมัติ';
    const c=$('#apvBellCount'); if(c) c.textContent=total>99?'99+':total;
    if(_lastBellN!==null&&total>_lastBellN)bellSound();
    _lastBellN=total;
  }
  /* ถ้ารายงานเปิดค้างอยู่ ให้อัปเดตตามไปด้วย */
  if($('#mApvList')&&$('#mApvList').classList.contains('on')) renderApvList();
}
/* กล่องเตือนหน้าแรกแบบยุบได้ — จำสถานะกางไว้ระหว่างการเรนเดอร์ซ้ำ */
let alertOpen={ar:false,apv:false};
function toggleHomeAlert(k){
  alertOpen[k]=!alertOpen[k];
  const box=(k==='ar'?$('#overdueAlert'):$('#apvAlert')).querySelector('.alert-slim');
  if(box) box.classList.toggle('open',alertOpen[k]);
}
/* กดจากกล่องเตือน → เข้าหน้ารายงานลูกหนี้ (08 บัญชี · แท็บลูกหนี้) พร้อมกรองเฉพาะที่ค้างชำระ */
function openArReport(){
  go('acct'); acctGo('ar');
  const st=$('#aArStatus'); if(st){ st.value='out'; }
  const s=$('#aArSearch'); if(s) s.value='';
  if(typeof renderAcctAR==='function') renderAcctAR(); else renderAcct();
  const el=$('#a-ar'); if(el) el.scrollIntoView({block:'start'});
  toast('เปิดรายงานลูกหนี้ — กรองเฉพาะรายการที่ยังค้างชำระ');
}
function renderApvAlert(){
  const box=$('#apvAlert'); if(!box) return;
  const pend=pendingApvList();
  box.innerHTML=pend.length
    ? `<div class="card amber"><div class="k">📋 เอกสารรอคุณอนุมัติ</div>
       <div class="v">${pend.length}<span style="font-size:13px;font-weight:500"> ใบ</span></div>
       <div class="s">เก่าสุด: ${esc(pend[0].label)} <b>${esc(pend[0].no)}</b></div>
       <button class="btn sm pri cbtn" onclick="openApvList()">ดูรายการรออนุมัติ</button></div>`
    : `<div class="card green"><div class="k">📋 เอกสารรอคุณอนุมัติ</div>
       <div class="v">0</div><div class="s">✓ ไม่มีเอกสารค้างอนุมัติ</div></div>`;
  syncApvBadges();
}
function apvStamp(d){ return isApproved(d)?'':'<div class="draftstamp">ยังไม่ผ่านการอนุมัติ</div>'; }
function apvFoot(d){ const a=apvOf(d);
  return a.status==='approved'?`<div class="note">ผู้อนุมัติเอกสารในระบบ: ${esc(a.byName)} · วันที่อนุมัติ ${thDate(a.date)}</div>`:''; }
function postGR(g){
  g.items.forEach(it=>{
    let st=it.stockId?DB.stock.find(x=>x.id===it.stockId):DB.stock.find(x=>x.code.toLowerCase()===String(it.code).toLowerCase());
    const uc=grUnitCost(g,it);   /* ต้นทุนหลังเฉลี่ยส่วนลดท้ายบิลแล้ว */
    if(!st){ st={id:uid(),code:it.code||('NEW-'+Math.random().toString(36).slice(2,6).toUpperCase()),oem:it.oem,name:it.name||'สินค้าใหม่',
      cat:it.cat||'อื่น ๆ',cost:uc,pa:0,pb:0,pc:0,unit:'ชิ้น',qty:0,min:0,max:0,lastMove:g.date,loc:'',zone:'',shelf:'',warr:''};
      DB.stock.push(st); }
    it.stockId=st.id; it.code=st.code;
    st.qty=n(st.qty)+n(it.qty); st.cost=uc||n(st.cost); st.lastMove=g.date;
    if(it.oem&&!st.oem) st.oem=it.oem;
    logMove(st.id,'in',n(it.qty),g.date,'รับเข้าจากใบรับสินค้า'+(n(g.disc)>0?' (เฉลี่ยส่วนลดท้ายบิลแล้ว)':''),g.no,g.vendorId,uc);
  });
  g.posted=true;
}


/* ==========================================================
   ตรวจสอบเอกสารย้อนหลัง (Audit trail)
   ========================================================== */
const AUD_KIND={hr:'บันทึกงานบุคคล',warn:'ใบเตือนพนักงาน',quote:'ใบเสนอราคา / อนุมัติซ่อม',receipt:'ใบเสร็จ / ใบกำกับภาษี',gr:'ใบรับสินค้า / ซื้อสินค้า',claim:'ใบเคลมสินค้า',
  issue:'ใบเบิกของภายใน',count:'ใบตรวจนับสินค้า',billing:'ใบวางบิล',invoice:'ใบแจ้งหนี้',
  expense:'ค่าใช้จ่ายกิจการ',asset:'ทะเบียนสินทรัพย์',capital:'เงินลงทุน / เงินสด',stock:'สต๊อกอะไหล่',crm:'นัดหมายลูกค้า',
  cust:'ข้อมูลลูกค้า',vendor:'ข้อมูลผู้ขาย',emp:'ข้อมูลพนักงานและสิทธิใช้งาน',data:'ข้อมูลทั้งร้าน'};
const AUD_ACT={open:'เปิดดูเอกสาร',save:'บันทึก / แก้ไข',print:'สั่งพิมพ์เอกสาร',send:'ส่งขออนุมัติ',
  approve:'อนุมัติเอกสาร',reject:'ไม่อนุมัติ / ตีกลับ',post:'รับสินค้าเข้าสต๊อก',deduct:'ตัดสต๊อกตามใบอนุมัติซ่อม',
  pay:'บันทึกรับ / จ่ายเงิน',bill:'ออกใบเสร็จจากเอกสารนี้',del:'ลบเอกสาร',deduct2:'ตัดสต๊อกส่งเคลม',
  deduct3:'ตัดสต๊อกตามใบเบิกของภายใน',adjust:'ปรับยอดจากตรวจนับสินค้า',
  done:'บันทึกว่าติดตามแล้ว',undone:'ย้อนสถานะการติดตาม',payvoid:'ยกเลิกรายการชำระ (ตัดยอดผิด)',
  wipe:'ล้างข้อมูลทั้งหมด',restore:'กู้คืนข้อมูล',import:'นำเข้าข้อมูล',demo:'โหลดข้อมูลตัวอย่าง'};
const AUD_CLS={approve:'g',reject:'r',del:'r',print:'b',save:'a',post:'g',deduct:'a',pay:'g',done:'g',undone:'a',deduct3:'a',adjust:'a',payvoid:'r'};
function nowTs(){ return new Date().toISOString(); }
function thDateTime(ts){ if(!ts) return '-'; const d=new Date(ts); if(isNaN(d)) return ts;
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+(d.getFullYear()+543)+' '
    +String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function logAudit(kind,doc,act,note){
  DB.audit=DB.audit||[];
  const e=curEmp();
  DB.audit.push({id:uid(),ts:nowTs(),user:DB.curEmp||'',userName:e?(e.code+' · '+e.name):'เจ้าของกิจการ / ผู้ดูแลระบบ',
    kind,docId:(doc&&doc.id)||'',no:(doc&&doc.no)||'',act,note:note||''});
  if(DB.audit.length>4000) DB.audit=DB.audit.slice(-3000);
}
let auditCtx={scope:'doc',kind:'',docId:'',title:''};
function openAudit(kind,docId){
  DB.audit=DB.audit||[];
  const list=DB[kind==='quote'?'quotes':kind==='receipt'?'receipts':kind==='gr'?'purchases':kind==='claim'?'claims':kind==='expense'?'expenses':kind==='crm'?'crm':kind==='invoice'?'invoices':'assets']||[];
  const doc=list.find(x=>x.id===docId)||curDoc(kind==='quote'||kind==='receipt'||kind==='gr'?kind:'quote');
  auditCtx={scope:'doc',kind,docId:docId||(doc&&doc.id)||'',title:(doc&&doc.no)||''};
  $('#mAuditTitle').textContent='ตรวจสอบเอกสารย้อนหลัง'+(auditCtx.title?' · '+auditCtx.title:'');
  $$('#auditScope button').forEach(b=>b.classList.toggle('on',b.dataset.s==='doc'));
  $('#auditKind').innerHTML='<option value="">ทุกประเภทเอกสาร</option>'+Object.entries(AUD_KIND).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  $('#auditAct').innerHTML='<option value="">ทุกการกระทำ</option>'+Object.entries(AUD_ACT).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  const users=[...new Set(DB.audit.map(a=>a.userName))];
  $('#auditUser').innerHTML='<option value="">ผู้ใช้งานทุกคน</option>'+users.map(u=>`<option>${esc(u)}</option>`).join('');
  $('#auditDoc').innerHTML=doc?auditDocHead(kind,doc):'';
  renderAudit(); openModal('mAudit');
}
function auditDocHead(kind,doc){
  const a=apvOf(doc), mine=(DB.audit||[]).filter(x=>x.docId===doc.id);
  const first=mine[0], last=mine[mine.length-1];
  return `<div class="grid g4">
    <div><span class="hint">ประเภทเอกสาร</span><div><b>${esc(AUD_KIND[kind]||'-')}</b></div></div>
    <div><span class="hint">เลขที่เอกสาร</span><div class="mono"><b>${esc(doc.no||'(ยังไม่บันทึก)')}</b></div></div>
    <div><span class="hint">สถานะอนุมัติ</span><div>${apvChip(doc)} <span class="hint">${esc(apvInfo(doc))}</span></div></div>
    <div><span class="hint">จำนวนครั้งที่มีการใช้งาน</span><div><b>${mine.length}</b> ครั้ง</div></div></div>
    <div class="grid g2" style="margin-top:6px">
      <div class="hint">บันทึกครั้งแรก: ${first?esc(thDateTime(first.ts)+' โดย '+first.userName):'-'}</div>
      <div class="hint">ใช้งานล่าสุด: ${last?esc(thDateTime(last.ts)+' โดย '+last.userName+' · '+(AUD_ACT[last.act]||last.act)):'-'}</div>
    </div>`;
}
$('#auditScope').addEventListener('click',e=>{const b=e.target.closest('button'); if(!b)return;
  $$('#auditScope button').forEach(x=>x.classList.toggle('on',x===b)); auditCtx.scope=b.dataset.s; renderAudit();});
['auditKind','auditUser','auditAct'].forEach(id=>{const el=$('#'+id); if(el) el.onchange=renderAudit;});
function auditRows(){
  let rows=(DB.audit||[]).slice().reverse();
  if(auditCtx.scope==='doc'&&auditCtx.docId) rows=rows.filter(a=>a.docId===auditCtx.docId);
  const k=$('#auditKind').value, u=$('#auditUser').value, ac=$('#auditAct').value;
  if(k) rows=rows.filter(a=>a.kind===k);
  if(u) rows=rows.filter(a=>a.userName===u);
  if(ac) rows=rows.filter(a=>a.act===ac);
  return rows.slice(0,400);
}
function renderAudit(){
  const rows=auditRows();
  $('#auditTbl tbody').innerHTML=rows.map(a=>`<tr>
    <td class="mono" style="font-size:12px">${esc(thDateTime(a.ts))}</td>
    <td>${esc(a.userName)}</td>
    <td><span class="chip ${AUD_CLS[a.act]||''}">${esc(AUD_ACT[a.act]||a.act)}</span></td>
    <td style="font-size:12.5px">${esc(AUD_KIND[a.kind]||a.kind)}</td>
    <td class="mono" style="font-size:12px">${esc(a.no||'-')}</td>
    <td style="font-size:12.5px">${esc(a.note||'')}</td></tr>`).join('');
  $('#auditEmpty').style.display=rows.length?'none':'block';
  $('#auditCount').textContent=rows.length+' รายการ';
}
function exportAuditCsv(){
  const rows=[['วัน-เวลา','ผู้ใช้งาน','การกระทำ','ประเภทเอกสาร','เลขที่เอกสาร','รายละเอียด']]
    .concat(auditRows().map(a=>[thDateTime(a.ts),a.userName,AUD_ACT[a.act]||a.act,AUD_KIND[a.kind]||a.kind,a.no,a.note]));
  dlCsv(rows,'audit-log-'+iso()+'.csv');
}
function printAudit(){
  const rows=auditRows(), sc=auditCtx.scope==='doc'?('เฉพาะเอกสาร '+(auditCtx.title||'-')):'ทุกเอกสารในระบบ';
  const per=32, pages=Math.max(1,Math.ceil(rows.length/per));
  let html='';
  for(let p=0;p<pages;p++){
    html+=repHead('รายงานตรวจสอบการใช้งานเอกสาร',sc+'<br>พิมพ์วันที่ '+thDateTime(nowTs())+'<br>หน้า '+(p+1)+' / '+pages)+
      `<table><thead><tr><th style="width:100px">วัน-เวลา</th><th style="width:130px">ผู้ใช้งาน</th>
        <th style="width:105px">การกระทำ</th><th style="width:110px">ประเภทเอกสาร</th>
        <th style="width:100px">เลขที่</th><th>รายละเอียด</th></tr></thead><tbody>
        ${rows.slice(p*per,(p+1)*per).map(a=>`<tr><td>${esc(thDateTime(a.ts))}</td><td>${esc(a.userName)}</td>
          <td>${esc(AUD_ACT[a.act]||a.act)}</td><td>${esc(AUD_KIND[a.kind]||a.kind)}</td>
          <td>${esc(a.no||'-')}</td><td>${esc(a.note||'')}</td></tr>`).join('')}</tbody></table>
      ${p===pages-1?`<div class="note">รายงานนี้บันทึกโดยระบบอัตโนมัติทุกครั้งที่มีการเปิดดู บันทึก พิมพ์ อนุมัติ หรือลบเอกสาร เพื่อใช้ตรวจสอบย้อนหลัง</div>
      <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ตรวจสอบ</span></div>
        <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้มีอำนาจ</span></div></div>`:''}</div>`;
  }
  printDocs(html);
}


/* ==========================================================
   ดูทั้งหมด · รายการเอกสารทุกประเภท
   ========================================================== */
const DL_CFG={
  quote:{title:'ใบเสนอราคา / ใบอนุมัติซ่อม — ดูทั้งหมด',who:'ชื่อลูกค้า',
    filters:[['','ทุกสถานะ'],['pending','รออนุมัติ'],['approved','อนุมัติแล้ว'],['rejected','ตีกลับ'],
      ['nobill','ยังไม่ได้ออกใบเสร็จ'],['billed','ออกใบเสร็จแล้ว']]},
  receipt:{title:'ใบเสร็จรับเงิน / ใบกำกับภาษี — ดูทั้งหมด',who:'ชื่อลูกค้า',
    filters:[['','ทุกสถานะ'],['unpaid','รอรับชำระ'],['paid','ชำระแล้ว'],['overdue','เกินกำหนดชำระ'],
      ['pending','รออนุมัติ'],['approved','อนุมัติแล้ว'],['tax','ออกใบกำกับภาษี']]},
  gr:{title:'ใบรับสินค้า / ใบซื้อสินค้า — ดูทั้งหมด',who:'ชื่อผู้ขาย',
    filters:[['','ทุกสถานะ'],['unpaid','ยังไม่จ่ายเจ้าหนี้'],['paid','จ่ายแล้ว'],['overdue','เกินกำหนดชำระ'],
      ['pending','รออนุมัติ'],['approved','อนุมัติแล้ว'],['notposted','ยังไม่รับเข้าสต๊อก']]},
  expense:{title:'ค่าใช้จ่ายกิจการ — ดูทั้งหมด',who:'ผู้รับเงิน / รายละเอียด',
    filters:[['','ทุกสถานะ'],['unpaid','ค้างจ่าย'],['paid','จ่ายแล้ว']]},
  claim:{title:'ใบเคลมสินค้า — ดูทั้งหมด',who:'ชื่อผู้ขาย',
    filters:[['','ทุกสถานะ'],['open','รอส่งเคลม'],['sent','ส่งเคลมแล้ว'],['return','ส่งคืนสินค้า'],['back','รับสินค้าคืนแล้ว'],
      ['reject','ผู้ขายปฏิเสธ'],['pending','รออนุมัติ'],['approved','อนุมัติแล้ว']]}
};
let DOCL={kind:'quote'};
function stBtn(label,cls,onclick,title){
  return `<button class="stbtn ${cls}" title="${esc(title||'')}" onclick="${onclick};event.stopPropagation()">${esc(label)}</button>`;
}
function dlRows(kind){
  const today=iso(), billed=billedQuoteIds();
  if(kind==='quote') return DB.quotes.map(d=>({d,date:d.date,no:d.no,
    who:custName(findCust(d.custId))||'-',
    sub:plateOf((findCust(d.custId)||{vehicles:[]}).vehicles[d.vehIdx]),
    amt:quoteTotals(d).total,apv:apvOf(d).status,
    fin:billed.has(d.id)?'billed':'nobill'}));
  if(kind==='receipt') return DB.receipts.filter(d=>!d.cancelled).map(d=>{const t=receiptTotals(d), due=d.pay.due||d.date;
    return {d,date:d.date,no:d.no+(d.taxNo?' / '+d.taxNo:''),who:custName(findCust(d.custId))||'-',
      sub:d.ref?'อ้างอิง '+d.ref:'',amt:t.net,apv:apvOf(d).status,
      fin:d.paid?'paid':(daysBetween(due,today)>0?'overdue':'unpaid'),due}});
  if(kind==='gr') return DB.purchases.filter(d=>!d.cancelled).map(d=>{const v=findVen(d.vendorId), due=d.due||d.date;
    return {d,date:d.date,no:d.no,who:(v&&v.name)||'-',sub:d.inv?'ใบกำกับ '+d.inv:'',
      amt:grTotals(d).total,apv:apvOf(d).status,
      fin:d.paid?'paid':(d.term==='credit'&&daysBetween(due,today)>0?'overdue':'unpaid'),
      posted:d.posted,due}});
  if(kind==='claim') return DB.claims.map(d=>{const v=findVen(d.vendorId), its=clItemsClean(d);
    return {d,date:d.date,no:d.no,who:(v&&v.name)||'-',
      sub:its.length+' รายการ'+(d.ref?' · อ้างอิง '+d.ref:''),
      amt:its.reduce((a,x)=>a+n(x.qty),0),apv:apvOf(d).status,fin:d.status||'open'}});
  return DB.expenses.map(d=>({d,date:d.date,no:d.no,who:d.payee||d.desc,sub:d.cat,
    amt:expTotals(d).net,apv:'',fin:d.paid?'paid':'unpaid'}));
}
function dlFilter(rows){
  const f=$('#dlFilter').value, q=($('#dlSearch').value||'').toLowerCase().trim();
  let out=rows.filter(r=>!q||[r.no,r.who,r.sub].some(x=>String(x||'').toLowerCase().includes(q)));
  if(f) out=out.filter(r=>{
    if(['pending','approved','rejected'].includes(f)) return r.apv===f;
    if(f==='tax') return !!r.d.taxNo;
    if(f==='notposted') return !r.posted;
    return r.fin===f;});
  const sort=$('#dlSort').value;
  out.sort((a,b)=>sort==='date_asc'?String(a.date).localeCompare(b.date):
    sort==='amt_desc'?b.amt-a.amt:sort==='amt_asc'?a.amt-b.amt:
    sort==='no'?String(a.no).localeCompare(String(b.no)):String(b.date).localeCompare(a.date));
  return out;
}
function dlOpenDoc(kind,id){
  closeModal('mDocs');
  if(kind==='quote') openQuoteById(id);
  if(kind==='receipt') openReceiptById(id);
  if(kind==='gr') openGRById(id);
  if(kind==='claim') openClaimById(id);
  if(kind==='expense'){ go('acct'); acctGo('exp'); openExp(id); }
}
function openGRById(id){ const p=DB.purchases.find(x=>x.id===id); if(!p) return;
  logAudit('gr',p,'open'); G=JSON.parse(JSON.stringify(p)); fillGRForm();
  go('buy'); buyGo('gr'); openModal('mGREdit'); toast('เปิด '+p.no); }
function docListOpen(kind){
  DOCL.kind=kind; const c=DL_CFG[kind];
  $('#dlTitle').textContent=c.title;
  $('#dlTbl').querySelector('thead tr').children[2].textContent=c.who;
  $('#dlFilter').innerHTML=c.filters.map(([v,l])=>`<option value="${v}">${l}</option>`).join('');
  $('#dlSearch').value=''; $('#dlSort').value='date_desc';
  if($('#dlDateMode')){ $('#dlDateMode').value=''; toggleDateFilterUI('dlDate'); }
  LIM_PAGE.dl=1;
  renderDocList(); openModal('mDocs');
}
/* เปลี่ยนเงื่อนไขใด ๆ = กลับหน้าแรกเสมอ ไม่ให้ค้างอยู่หน้า 5 ของผลลัพธ์ชุดใหม่ */
const dlRe=()=>{ LIM_PAGE.dl=1; renderDocList(); };
['dlSearch','dlFilter','dlSort'].forEach(id=>{const el=$('#'+id); if(el) el[id==='dlSearch'?'oninput':'onchange']=dlRe;});
LIM_RENDER.dl=renderDocList;
if($('#dlLimit')) $('#dlLimit').onchange=dlRe;
/* ตัวกรองวันที่ใช้กลไกเดียวกับทะเบียนอื่น (applyDateFilter + toggleDateFilterUI) */
fillYearSelect('dlDateMonthY'); fillMonthSelect('dlDateMonthM');
if($('#dlDateMode')) $('#dlDateMode').onchange=()=>{ toggleDateFilterUI('dlDate'); dlRe(); };
['D1','D2','MonthM','MonthY'].forEach(suf=>{ const el=$('#dlDate'+suf); if(el) el.onchange=dlRe; });
function renderDocList(){
  const kind=DOCL.kind, all=dlRows(kind);
  /* ⚠️ ลำดับสำคัญ: กรอง → คำนวณการ์ดสรุป/ยอดรวมจากชุดเต็ม → ค่อยตัดแถวตามหน้า
     ถ้าตัดก่อน การ์ดสรุปจะบอกยอดแค่หน้าที่เห็น ซึ่งผิด */
  const full=applyDateFilter(dlFilter(all),'dlDate');
  const rows=limitRows(full,'dl');
  const APV={draft:['ร่าง','st-grey'],pending:['รออนุมัติ','st-orange'],approved:['อนุมัติแล้ว','st-green'],rejected:['ตีกลับ','st-red']};
  const FIN={paid:['ชำระแล้ว','st-green'],unpaid:['รอรับชำระ','st-orange'],overdue:['เกินกำหนดชำระ','st-red'],
    billed:['ออกใบเสร็จแล้ว','st-green'],nobill:['ยังไม่ออกใบเสร็จ','st-orange']};
  if(kind==='gr'){FIN.unpaid=['รอจ่ายเจ้าหนี้','st-orange'];FIN.paid=['จ่ายแล้ว','st-green'];}
  if(kind==='expense'){FIN.unpaid=['ค้างจ่าย','st-orange'];FIN.paid=['จ่ายแล้ว','st-green'];}
  if(kind==='claim'){FIN.open=['รอส่งเคลม','st-orange'];FIN.sent=['ส่งเคลมแล้ว','st-blue'];
    FIN['return']=['ส่งคืนสินค้า','st-grey'];
    FIN.back=['รับสินค้าคืนแล้ว','st-green'];FIN.reject=['ผู้ขายปฏิเสธ','st-red'];}
  $('#dlTbl tbody').innerHTML=rows.map(r=>{
    const a=APV[r.apv]||null, f=FIN[r.fin]||['-','st-grey'];
    const go=`dlOpenDoc('${kind}','${r.d.id}')`;
    return `<tr class="click" onclick="${go}">
      <td class="ctr">${thDate(r.date)}</td>
      <td class="mono" style="font-size:12px"><b>${esc(r.no||'(ไม่มีเลขที่)')}</b></td>
      <td>${esc(r.who)}${r.sub?`<div class="hint">${esc(r.sub)}</div>`:''}</td>
      <td class="num"><b>${kind==='claim'?n(r.amt)+' ชิ้น':money(r.amt)}</b></td>
      <td class="ctr">${a?stBtn(a[0],a[1],go,apvInfo(r.d)):'<span class="hint">-</span>'}
        ${kind==='gr'&&!r.posted?'<div class="hint">ยังไม่เข้าสต๊อก</div>':''}</td>
      <td class="ctr">${stBtn(f[0],f[1],go,r.due?('ครบกำหนด '+thDate(r.due)):'')}
        ${r.fin==='overdue'&&r.due?`<div class="hint">เกิน ${daysBetween(r.due,iso())} วัน</div>`:''}</td>
      <td class="ctr"><button class="btn sm gh" onclick="${go};event.stopPropagation()">เปิด</button></td></tr>`}).join('');
  $('#dlEmpty').style.display=rows.length?'none':'block';
  const sum=k=>full.filter(r=>r.fin===k).reduce((a,r)=>a+r.amt,0);
  const cnt=k=>full.filter(r=>r.fin===k).length;
  const apvCnt=k=>full.filter(r=>r.apv===k).length;
  const tot=full.reduce((a,r)=>a+r.amt,0);
  const cards=[
    ['ทั้งหมดที่กรองได้',full.length+' ฉบับ',kind==='claim'?(tot+' ชิ้น'):(money(tot)+' บาท'),''],
    kind==='quote'?['ยังไม่ออกใบเสร็จ',cnt('nobill')+' ฉบับ',money(sum('nobill'))+' บาท','amber']
      :kind==='claim'?['รอส่งเคลม / ส่งแล้ว',(cnt('open')+cnt('sent'))+' ฉบับ',(sum('open')+sum('sent'))+' ชิ้น','amber']
      :[kind==='gr'?'รอจ่ายเจ้าหนี้':kind==='expense'?'ค้างจ่าย':'รอรับชำระ',(cnt('unpaid')+cnt('overdue'))+' ฉบับ',money(sum('unpaid')+sum('overdue'))+' บาท','amber'],
    kind==='quote'?['ออกใบเสร็จแล้ว',cnt('billed')+' ฉบับ',money(sum('billed'))+' บาท','green']
      :kind==='claim'?['รับสินค้าคืนแล้ว',cnt('back')+' ฉบับ',sum('back')+' ชิ้น','green']
      :[kind==='expense'?'จ่ายแล้ว':'ชำระแล้ว',cnt('paid')+' ฉบับ',money(sum('paid'))+' บาท','green'],
    kind==='expense'?['รายการทั้งหมด',all.length+' รายการ','','']
      :['รออนุมัติ',apvCnt('pending')+apvCnt('draft')+' ฉบับ','อนุมัติแล้ว '+apvCnt('approved')+' ฉบับ','red']
  ];
  $('#dlCards').innerHTML=cards.map(([k,v,s2,cls])=>`<div class="card ${cls||''}">
    <div class="k">${esc(k)}</div><div class="v" style="font-size:19px">${esc(v)}</div><div class="s">${esc(s2)}</div></div>`).join('');
  $('#dlTbl tfoot').innerHTML=`<tr><td colspan="3">รวม ${full.length} ฉบับ</td><td class="num"><b>${money(tot)}</b></td>
    <td colspan="3" class="hint">คลิกแถวเพื่อเปิดเอกสารและดำเนินการต่อ</td></tr>`;
}
function printDocList(){
  /* พิมพ์ต้องได้ครบทุกแถวตามตัวกรอง — ไม่ตัดตามหน้าที่กำลังดูอยู่ */
  const kind=DOCL.kind, rows=applyDateFilter(dlFilter(dlRows(kind)),'dlDate'), c=DL_CFG[kind];
  const LBL={draft:'ร่าง',pending:'รออนุมัติ',approved:'อนุมัติแล้ว',rejected:'ตีกลับ',
    paid:kind==='gr'||kind==='expense'?'จ่ายแล้ว':'ชำระแล้ว',unpaid:kind==='gr'?'รอจ่ายเจ้าหนี้':kind==='expense'?'ค้างจ่าย':'รอรับชำระ',
    overdue:'เกินกำหนดชำระ',billed:'ออกใบเสร็จแล้ว',nobill:'ยังไม่ออกใบเสร็จ'};
  const per=30, pages=Math.max(1,Math.ceil(rows.length/per)), tot=rows.reduce((a,r)=>a+r.amt,0);
  let html='';
  for(let p=0;p<pages;p++){
    html+=repHead(c.title.replace(' — ดูทั้งหมด',''),'รายการเอกสาร · พิมพ์วันที่ '+thDate(iso())+'<br>หน้า '+(p+1)+' / '+pages)+
    `<table><thead><tr><th style="width:70px">วันที่</th><th style="width:120px">เลขที่เอกสาร</th>
      <th>${esc(c.who)}</th><th style="width:90px">จำนวนเงิน</th>
      <th style="width:78px">การอนุมัติ</th><th style="width:88px">สถานะการเงิน</th></tr></thead><tbody>
      ${rows.slice(p*per,(p+1)*per).map(r=>`<tr><td>${thDate(r.date)}</td><td>${esc(r.no||'-')}</td>
        <td>${esc(r.who)}</td><td class="num">${money(r.amt)}</td>
        <td style="text-align:center">${esc(LBL[r.apv]||'-')}</td>
        <td style="text-align:center">${esc(LBL[r.fin]||'-')}</td></tr>`).join('')}
      ${p===pages-1?`<tr><td colspan="3" style="text-align:right"><b>รวม ${rows.length} ฉบับ</b></td>
        <td class="num"><b>${money(tot)}</b></td><td colspan="2"></td></tr>`:''}
      </tbody></table></div>`;
  }
  printDocs(html);
}


/* ==========================================================
   รายจ่าย / ซื้อสินค้า — เมนูย่อย 5 หัวข้อ
   ========================================================== */
const UTIL_CATS=['ค่าไฟฟ้า','ค่าน้ำประปา','ค่าโทรศัพท์และอินเทอร์เน็ต'];
const OFFICE_CATS=['วัสดุสิ้นเปลืองสำนักงาน','เครื่องมือช่างมูลค่าต่ำ'];
const PROVIDERS={
  'ค่าไฟฟ้า':['การไฟฟ้านครหลวง (MEA)','การไฟฟ้าส่วนภูมิภาค (PEA)'],
  'ค่าน้ำประปา':['การประปานครหลวง (กปน.)','การประปาส่วนภูมิภาค (กปภ.)','ประปาหมู่บ้าน / อบต.'],
  'ค่าโทรศัพท์และอินเทอร์เน็ต':['บมจ. ทรู คอร์ปอเรชั่น','บมจ. แอดวานซ์ อินโฟร์ เซอร์วิส (AIS)',
    'บมจ. โทรคมนาคมแห่งชาติ (NT)','บมจ. ทริปเปิลที บรอดแบนด์ (3BB)'],
  'ค่าเช่าสถานที่':['เจ้าของอาคาร / ผู้ให้เช่า'],
  'ค่าน้ำมันเชื้อเพลิงและขนส่ง':['บมจ. ปตท. น้ำมันและการค้าปลีก (PTT Station)','บมจ. บางจาก คอร์ปอเรชั่น',
    'เชลล์ (Shell)','เอสโซ่ / บางจาก ศรีราชา','คาลเท็กซ์ (Caltex)'],
  'วัสดุสิ้นเปลืองสำนักงาน':['บจก. ออฟฟิศเมท (OfficeMate)','บมจ. ซีโอแอล / B2S','ร้านเครื่องเขียนท้องถิ่น'],
  'เครื่องมือช่างมูลค่าต่ำ':['บมจ. โฮมโปร','บจก. ไทวัสดุ','บมจ. โกลบอลเฮ้าส์','ร้านเครื่องมือช่างท้องถิ่น'],
  'ค่าเบี้ยประกันภัย':['บมจ. วิริยะประกันภัย','บมจ. ทิพยประกันภัย','บมจ. กรุงเทพประกันภัย','บมจ. สินมั่นคงประกันภัย'],
  'ค่าธรรมเนียมธนาคารและดอกเบี้ยจ่าย':['ธนาคารกสิกรไทย','ธนาคารไทยพาณิชย์','ธนาคารกรุงเทพ','ธนาคารกรุงไทย'],
  'ค่าบริการวิชาชีพ (บัญชี / กฎหมาย)':['สำนักงานบัญชี','สำนักงานกฎหมาย'],
  'ภาษีและค่าธรรมเนียมราชการ':['กรมสรรพากร','กรมพัฒนาธุรกิจการค้า','สำนักงานประกันสังคม','เทศบาล / อบต.']
};
function fillPayeeSel(cat){
  const list=PROVIDERS[cat]||[], ven=DB.vendors.map(v=>v.name);
  const all=[...new Set(list.concat(ven))];
  const el=$('#xPayeeSel'); if(!el) return;
  el.innerHTML='<option value="">— เลือกผู้ให้บริการ / ผู้ขาย —</option>'
    +all.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')
    +'<option value="__other">อื่น ๆ (พิมพ์เอง)</option>';
  const cur=$('#xPayee').value.trim();
  el.value=all.includes(cur)?cur:'';
}
function pickPayee(){ const v=$('#xPayeeSel').value;
  if(v&&v!=='__other') $('#xPayee').value=v;
  if(v==='__other'){ $('#xPayee').value=''; $('#xPayee').focus(); } }
const PAY_CAT='เงินเดือนและค่าแรงงาน';
let buyPane='gr';
const BUY_HINT={gr:'บันทึกการซื้ออะไหล่เข้าสต๊อก พร้อมออกใบรับสินค้าและตัดเจ้าหนี้',
  util:'บันทึกค่าน้ำ ค่าไฟ ค่าโทรศัพท์ ที่ใช้เป็นภาษีซื้อและค่าใช้จ่ายของกิจการ',
  asset:'ซื้อของที่ใช้งานเกิน 1 ปี กรอกได้หลายรายการในใบเดียว ระบบคิดค่าเสื่อมราคาให้อัตโนมัติ',
  pay:'คำนวณเงินเดือน ค่าล่วงเวลา และเงินสมทบประกันสังคมของงวดนั้น',
  office:'วัสดุสำนักงานและเครื่องมือมูลค่าต่ำที่ใช้หมดไปภายในปี',
  other:'รายจ่ายอื่นที่ไม่เข้าห้าหัวข้อแรก เลือกหมวดหรือระบุรายละเอียดเอง'};
$('#buyTabs').addEventListener('click',e=>{const b=e.target.closest('button'); if(b){ go('buy'); buyGo(b.dataset.b); }});
function buyGo(v){
  buyPane=v;
  $$('#buyTabs button').forEach(x=>x.classList.toggle('on',x.dataset.b===v));
  $$('.bpane').forEach(p=>p.style.display=(p.id==='b-'+v)?'':'none');
  $('#buyHint').textContent=BUY_HINT[v]||'';
  renderBuyPane();
}
function fillYearSel(id){
  const el=$('#'+id); if(!el||el.options.length) return;
  const y=new Date().getFullYear(); const ys=[];
  for(let i=y+1;i>=y-4;i--) ys.push(i);
  el.innerHTML=ys.map(x=>`<option value="${x}">ปี ${x+543}</option>`).join('');
  el.value=y; el.onchange=renderBuyPane;
}
function expStatusCell(x){
  return x.paid?'<span class="stbtn st-green">จ่ายแล้ว</span>'
    :`<button class="stbtn st-orange" onclick="payExp('${x.id}')">ค้างจ่าย</button>`;
}
function renderBuyPane(){
  fillYearSel('utilYear'); fillYearSel('othYear'); fillYearSel('offYear');
  if(buyPane==='gr'){ renderGRList(); return; }
  if(buyPane==='util') return renderUtil();
  if(buyPane==='asset') return renderBuyAssets();
  if(buyPane==='pay') return renderPayroll();
  if(buyPane==='office') return renderOffice();
  if(buyPane==='other') return renderOther();
}
/* ---------- 2 · ค่าน้ำค่าไฟ ---------- */
function renderUtil(){
  const y=n($('#utilYear').value)||new Date().getFullYear();
  const rows=DB.expenses.filter(x=>UTIL_CATS.includes(x.cat)&&inYear(x.date,y))
    .sort((a,b)=>b.date.localeCompare(a.date));
  $('#utilTbl tbody').innerHTML=rows.map(x=>{const t=expTotals(x);
    return `<tr><td class="mono" style="font-size:12px">${esc(x.no)}</td><td class="ctr">${thDate(x.date)}</td>
      <td class="mono"><b>${esc(expAcc(x.cat))}</b></td><td>${esc(x.cat)}</td>
      <td>${esc(x.desc)}${x.payee?`<div class="hint">${esc(x.payee)}${x.inv?' · '+esc(x.inv):''}</div>`:''}</td>
      <td class="num">${money(t.base)}</td><td class="num">${money(t.vat)}</td><td class="num"><b>${money(t.net)}</b></td>
      <td class="ctr">${expStatusCell(x)}</td>
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
        <button class="btn sm gh" onclick="openExp('${x.id}')">แก้ไข</button>
        <button class="btn sm dgr" onclick="delExp('${x.id}')">ลบ</button></div></td></tr>`}).join('');
  const t=rows.reduce((a,x)=>{const v=expTotals(x);return{b:a.b+v.base,v:a.v+v.vat,n:a.n+v.net}},{b:0,v:0,n:0});
  $('#utilTbl tfoot').innerHTML=`<tr><td colspan="5">รวม ${rows.length} รายการ</td><td class="num">${money(t.b)}</td>
    <td class="num">${money(t.v)}</td><td class="num"><b>${money(t.n)}</b></td><td colspan="2"></td></tr>`;
  $('#utilEmpty').style.display=rows.length?'none':'block';
  if(typeof mkCards==='function') mkCards('utilTbl');
  $('#utilCount').textContent=rows.length+' รายการ';
  const byCat=c=>rows.filter(x=>x.cat===c).reduce((a,x)=>a+expTotals(x).net,0);
  $('#utilCards').innerHTML=[['ค่าไฟฟ้า','amber'],['ค่าน้ำประปา','green'],['ค่าโทรศัพท์และอินเทอร์เน็ต',''],
    ['รวมทั้งปี','red']].map(([k,cls])=>{
    const v=k==='รวมทั้งปี'?t.n:byCat(k);
    const cnt=k==='รวมทั้งปี'?rows.length:rows.filter(x=>x.cat===k).length;
    return `<div class="card ${cls}"><div class="k">${esc(k)}</div><div class="v">${money0(v)}</div>
      <div class="s">${cnt} รายการ · ปี ${(n($('#utilYear').value)||0)+543}</div></div>`}).join('');
}
/* ---------- 3 · ซื้อสินทรัพย์ ---------- */
function renderBuyAssets(){
  const rows=DB.assets.slice().sort((a,b)=>b.date.localeCompare(a.date));
  $('#basTbl tbody').innerHTML=rows.map(a=>`<tr>
    <td class="mono" style="font-size:12px">${esc(a.no)}</td><td class="ctr">${thDate(a.date)}</td>
    <td>${esc(a.name)}${a.note?`<div class="hint">${esc(a.note)}</div>`:''}</td>
    <td class="mono"><b>${esc(assetAcc(a.cat)[0])}</b></td><td>${esc(a.cat)}</td>
    <td>${esc(a.vendor||'-')}${a.inv?`<div class="hint mono">${esc(a.inv)}</div>`:''}</td>
    <td class="num">${money(a.cost)}</td><td class="num">${money(n(a.cost)*(1+n(a.vat)/100))}</td>
    <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
      <button class="btn sm gh" onclick="openAsset('${a.id}')">แก้ไข</button>
      <button class="btn sm dgr" onclick="delAsset('${a.id}')">ลบ</button></div></td></tr>`).join('');
  const c=rows.reduce((a,x)=>a+n(x.cost),0), g=rows.reduce((a,x)=>a+n(x.cost)*(1+n(x.vat)/100),0);
  $('#basTbl tfoot').innerHTML=`<tr><td colspan="6">รวม ${rows.length} รายการ</td>
    <td class="num"><b>${money(c)}</b></td><td class="num"><b>${money(g)}</b></td><td></td></tr>`;
  $('#basEmpty').style.display=rows.length?'none':'block';
  if(typeof mkCards==='function') mkCards('basTbl');
  $('#basCount').textContent=rows.length+' รายการ';
}
/* ---------- 4 · จ่ายเงินเดือน ---------- */
function payMonthVal(){ if(!$('#payMonth').value) $('#payMonth').value=iso().slice(0,7); return $('#payMonth').value; }
function payrollRows(){ return empActiveList().map(e=>{const x=ssoOf(e);
  return {e,gross:x.gross,emp:x.emp,er:x.er,net:x.gross-x.emp}; }); }
function renderPayroll(){
  const mo=payMonthVal(), rows=payrollRows();
  $('#payTag').textContent='งวด '+TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543)+' · '+rows.length+' คน';
  $('#payTbl tbody').innerHTML=rows.map(r=>`<tr>
    <td class="mono">${esc(r.e.code)}</td><td>${esc(r.e.name)}</td><td>${esc(r.e.position||'-')}</td>
    <td class="num">${money(r.e.salary)}</td><td class="num">${money(r.e.ot)}</td><td class="num">${money(r.e.bonus)}</td>
    <td class="num"><b>${money(r.gross)}</b></td><td class="num">${money(r.emp)}</td>
    <td class="num"><b>${money(r.net)}</b></td><td class="num">${money(r.er)}</td></tr>`).join('');
  const t=rows.reduce((a,r)=>({g:a.g+r.gross,e:a.e+r.emp,n:a.n+r.net,r:a.r+r.er}),{g:0,e:0,n:0,r:0});
  $('#payTbl tfoot').innerHTML=`<tr><td colspan="6">รวม ${rows.length} คน</td><td class="num"><b>${money(t.g)}</b></td>
    <td class="num"><b>${money(t.e)}</b></td><td class="num"><b>${money(t.n)}</b></td><td class="num"><b>${money(t.r)}</b></td></tr>
    <tr><td colspan="9" class="hint">ยอดที่ต้องนำส่งประกันสังคม (ลูกจ้าง ${money(t.e)} + นายจ้าง ${money(t.r)})</td>
    <td class="num"><b>${money(t.e+t.r)}</b></td></tr>`;
  $('#payEmpty').style.display=rows.length?'none':'block';
  const hist=DB.expenses.filter(x=>x.cat===PAY_CAT).sort((a,b)=>b.date.localeCompare(a.date));
  $('#payHistTbl tbody').innerHTML=hist.map(x=>`<tr><td class="mono" style="font-size:12px">${esc(x.no)}</td>
    <td class="ctr">${thDate(x.date)}</td><td>${esc(x.desc)}${x.note?`<div class="hint">${esc(x.note)}</div>`:''}</td>
    <td class="num"><b>${money(expTotals(x).net)}</b></td><td class="ctr">${expStatusCell(x)}</td>
    <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
      <button class="btn sm gh" onclick="openExp('${x.id}')">แก้ไข</button>
      <button class="btn sm dgr" onclick="delExp('${x.id}')">ลบ</button></div></td></tr>`).join('');
  $('#payHistEmpty').style.display=hist.length?'none':'block';
  $('#payHistTag').textContent=hist.length+' รายการ';
}
$('#payMonth').onchange=renderPayroll;
async function payrollRun(){
  const mo=payMonthVal(), rows=payrollRows();
  if(!rows.length) return toast('ยังไม่มีข้อมูลพนักงาน — เพิ่มที่เมนูตั้งค่าองค์กร');
  const lbl='งวด '+TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543);
  if(DB.expenses.some(x=>x.cat===PAY_CAT&&String(x.desc||'').includes(lbl)))
    if(!await askP({title:'งวดนี้บันทึกแล้ว',text:'งวดนี้บันทึกจ่ายเงินเดือนไปแล้ว ต้องการบันทึกซ้ำหรือไม่?',yes:'บันทึกซ้ำ',no:'ไม่บันทึก'})) return;
  const t=rows.reduce((a,r)=>({g:a.g+r.gross,e:a.e+r.emp,n:a.n+r.net,r:a.r+r.er}),{g:0,e:0,n:0,r:0});
  const last=new Date(+mo.slice(0,4),+mo.slice(5,7),0), d=iso(last);
  const mk=(desc,base,note)=>({id:uid(),no:docNo('EX'),date:d,cat:PAY_CAT,desc,payee:'พนักงาน '+rows.length+' คน',
    tax:'',inv:'',base,vat:0,wht:0,method:'เงินโอน',paid:true,note});
  const e1=mk('จ่ายเงินเดือนและค่าล่วงเวลา '+lbl,t.g,'หักประกันสังคมลูกจ้าง '+money(t.e)+' บาท · จ่ายสุทธิ '+money(t.n)+' บาท');
  const e2=mk('เงินสมทบประกันสังคมส่วนนายจ้าง '+lbl,t.r,'นำส่งพร้อมส่วนลูกจ้าง รวม '+money(t.e+t.r)+' บาท');
  DB.expenses.push(e1,e2);
  logAudit('expense',e1,'save','จ่ายเงินเดือน '+lbl+' รวม '+money(t.g)+' บาท');
  save(); renderPayroll(); renderHome();
  toast('บันทึกจ่ายเงินเดือน '+lbl+' แล้ว · เงินเดือน '+money0(t.g)+' + สมทบนายจ้าง '+money0(t.r)+' บาท');
}
function printPayroll(){
  const mo=payMonthVal(), rows=payrollRows(), lbl=TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543);
  const t=rows.reduce((a,r)=>({g:a.g+r.gross,e:a.e+r.emp,n:a.n+r.net,r:a.r+r.er}),{g:0,e:0,n:0,r:0});
  printDocs(sheetTop({title:'ใบจ่ายเงินเดือนพนักงาน',en:'PAYROLL SHEET',copy:'เอกสารภายใน',
    fields:[['งวดเดือน',lbl],['จำนวนพนักงาน',rows.length+' คน'],['วันที่พิมพ์',thDate(iso())]]})+
    `<table><thead><tr><th style="width:60px">รหัส</th><th>ชื่อ - นามสกุล</th><th style="width:95px">ตำแหน่ง</th>
      <th style="width:70px">เงินเดือน</th><th style="width:60px">ล่วงเวลา</th><th style="width:60px">เงินพิเศษ</th>
      <th style="width:74px">รวมรายได้</th><th style="width:66px">หัก ปกส.</th><th style="width:78px">จ่ายสุทธิ</th>
      <th style="width:70px">ลงชื่อรับเงิน</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>${esc(r.e.code)}</td><td>${esc(r.e.name)}</td><td>${esc(r.e.position||'-')}</td>
        <td class="num">${money(r.e.salary)}</td><td class="num">${money(r.e.ot)}</td><td class="num">${money(r.e.bonus)}</td>
        <td class="num">${money(r.gross)}</td><td class="num">${money(r.emp)}</td><td class="num">${money(r.net)}</td>
        <td></td></tr>`).join('')}
      <tr><td colspan="6" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td class="num"><b>${money(t.g)}</b></td>
        <td class="num"><b>${money(t.e)}</b></td><td class="num"><b>${money(t.n)}</b></td><td></td></tr>
      <tr><td colspan="9" style="text-align:right">เงินสมทบประกันสังคมส่วนนายจ้าง</td><td class="num">${money(t.r)}</td></tr>
      <tr><td colspan="9" style="text-align:right"><b>รวมนำส่งสำนักงานประกันสังคม</b></td><td class="num"><b>${money(t.e+t.r)}</b></td></tr>
      </tbody></table>
    <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
      <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้อนุมัติจ่าย</span></div></div></div>`);
}
/* ---------- 5 · อุปกรณ์สำนักงาน ---------- */
function renderOffice(){
  const y=n($('#offYear').value)||new Date().getFullYear();
  const rows=DB.expenses.filter(x=>OFFICE_CATS.includes(x.cat)&&inYear(x.date,y))
    .sort((a,b)=>b.date.localeCompare(a.date));
  $('#offTbl tbody').innerHTML=rows.map(x=>{const t=expTotals(x);
    return `<tr><td class="mono" style="font-size:12px">${esc(x.no)}</td><td class="ctr">${thDate(x.date)}</td>
      <td class="mono"><b>${esc(expAcc(x.cat))}</b></td><td>${esc(x.cat)}</td>
      <td>${esc(x.desc)}${x.payee?`<div class="hint">${esc(x.payee)}${x.inv?' · '+esc(x.inv):''}</div>`:''}</td>
      <td class="num">${money(t.base)}</td><td class="num">${money(t.vat)}</td><td class="num"><b>${money(t.net)}</b></td>
      <td class="ctr">${expStatusCell(x)}</td>
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
        <button class="btn sm gh" onclick="openExp('${x.id}')">แก้ไข</button>
        <button class="btn sm dgr" onclick="delExp('${x.id}')">ลบ</button></div></td></tr>`}).join('');
  const t=rows.reduce((a,x)=>{const v=expTotals(x);return{b:a.b+v.base,v:a.v+v.vat,n:a.n+v.net}},{b:0,v:0,n:0});
  $('#offTbl tfoot').innerHTML=`<tr><td colspan="5">รวม ${rows.length} รายการ</td><td class="num">${money(t.b)}</td>
    <td class="num">${money(t.v)}</td><td class="num"><b>${money(t.n)}</b></td><td colspan="2"></td></tr>`;
  $('#offEmpty').style.display=rows.length?'none':'block';
  if(typeof mkCards==='function') mkCards('offTbl');
  $('#offCount').textContent=rows.length+' รายการ';
  const byCat=c=>rows.filter(x=>x.cat===c).reduce((a,x)=>a+expTotals(x).net,0);
  $('#offCards').innerHTML=[['วัสดุสิ้นเปลืองสำนักงาน','amber'],['เครื่องมือช่างมูลค่าต่ำ','green'],
    ['รวมทั้งปี','red'],['เฉลี่ยต่อเดือน','']].map(([k,cls])=>{
    const v=k==='รวมทั้งปี'?t.n:(k==='เฉลี่ยต่อเดือน'?t.n/12:byCat(k));
    const cnt=['รวมทั้งปี','เฉลี่ยต่อเดือน'].includes(k)?rows.length:rows.filter(x=>x.cat===k).length;
    return `<div class="card ${cls}"><div class="k">${esc(k)}</div><div class="v">${money0(v)}</div>
      <div class="s">${cnt} รายการ · ปี ${y+543}</div></div>`}).join('');
}
/* ---------- 6 · อื่น ๆ ---------- */
function renderOther(){
  const y=n($('#othYear').value)||new Date().getFullYear();
  const q=($('#othSearch').value||'').toLowerCase().trim();
  const rows=DB.expenses.filter(x=>!UTIL_CATS.includes(x.cat)&&!OFFICE_CATS.includes(x.cat)&&x.cat!==PAY_CAT&&inYear(x.date,y)
      &&(!q||[x.no,x.desc,x.payee,x.cat].some(v=>String(v||'').toLowerCase().includes(q))))
    .sort((a,b)=>b.date.localeCompare(a.date));
  $('#othTbl tbody').innerHTML=rows.map(x=>{const t=expTotals(x);
    return `<tr><td class="mono" style="font-size:12px">${esc(x.no)}</td><td class="ctr">${thDate(x.date)}</td>
      <td class="mono"><b>${esc(expAcc(x.cat))}</b></td><td>${esc(x.cat)}</td>
      <td>${esc(x.desc)}${x.payee?`<div class="hint">${esc(x.payee)}</div>`:''}</td>
      <td class="num">${money(t.base)}</td><td class="num">${money(t.wht)}</td><td class="num"><b>${money(t.net)}</b></td>
      <td class="ctr">${expStatusCell(x)}</td>
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
        <button class="btn sm gh" onclick="openExp('${x.id}')">แก้ไข</button>
        <button class="btn sm dgr" onclick="delExp('${x.id}')">ลบ</button></div></td></tr>`}).join('');
  const t=rows.reduce((a,x)=>{const v=expTotals(x);return{b:a.b+v.base,w:a.w+v.wht,n:a.n+v.net}},{b:0,w:0,n:0});
  $('#othTbl tfoot').innerHTML=`<tr><td colspan="5">รวม ${rows.length} รายการ</td><td class="num">${money(t.b)}</td>
    <td class="num">${money(t.w)}</td><td class="num"><b>${money(t.n)}</b></td><td colspan="2"></td></tr>`;
  $('#othEmpty').style.display=rows.length?'none':'block';
  if(typeof mkCards==='function') mkCards('othTbl');
  $('#othCount').textContent=rows.length+' รายการ';
}
$('#othSearch').oninput=renderOther;


/* ==========================================================
   รายชื่อลูกค้า · เรียงตามวันที่เข้ารับบริการล่าสุด
   ========================================================== */
let custPane='list';
$('#custTabs').addEventListener('click',e=>{const b=e.target.closest('button'); if(b){ go('cust'); custGo(b.dataset.c); }});
function custGo(v){
  custPane=v;
  $$('#custTabs button').forEach(x=>x.classList.toggle('on',x.dataset.c===v));
  $$('.cpane').forEach(p=>p.style.display=(p.id==='c-'+v)?'':'none');
  $('#custHint').textContent=v==='list'?'เรียงตามวันที่เข้ารับบริการล่าสุด':'จัดกลุ่มลูกค้าตามเกรดดาวเพื่อวางแผนการตลาด';
  if(v==='list') renderCustList(); else renderCust();
}
function lastService(custId,vehIdx){
  let d='',ref='';
  DB.receipts.forEach(r=>{ if(r.custId===custId&&(r.vehIdx||0)===vehIdx&&r.date>d){d=r.date;ref=r.no;} });
  if(!d) DB.quotes.forEach(q=>{ if(q.custId===custId&&(q.vehIdx||0)===vehIdx&&q.date>d){d=q.date;ref=q.no;} });
  return {date:d,ref};
}
function custRows(){
  const out=[];
  DB.cust.forEach(c=>{
    const vs=(c.vehicles||[]);
    if(!vs.length){ out.push({c,v:null,vi:0,last:{date:'',ref:''}}); return; }
    vs.forEach((v,i)=>out.push({c,v,vi:i,last:lastService(c.id,i)}));
  });
  return out;
}
function renderCustList(){
  const q=($('#clSearch').value||'').toLowerCase().trim(), f=$('#clFilter').value, today=iso();
  let rows=custRows().filter(r=>{
    const brand=String((r.v&&r.v.brand)||'').replace(/\s*\(.*/,'');
    if(q&&![brand,(r.v&&r.v.brand),(r.v&&r.v.model),plateOf(r.v),custName(r.c),r.c.tel,r.c.tel2]
      .some(x=>String(x||'').toLowerCase().includes(q))) return false;
    if(!f) return true;
    if(f==='none') return !r.last.date;
    if(!r.last.date) return false;
    const days=daysBetween(r.last.date,today);
    if(f==='recent') return days<=90;
    if(f==='6m') return days>180;
    if(f==='1y') return days>365;
    return true;
  });
  rows.sort((a,b)=>(b.last.date||'').localeCompare(a.last.date||''));
  rows=sortRows('custLTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'custL');
  $('#custLTbl tbody').innerHTML=rows.map(r=>{
    const brand=String((r.v&&r.v.brand)||'-').replace(/\s*\(.*/,'');
    const days=r.last.date?daysBetween(r.last.date,today):null;
    const cls=days===null?'st-grey':days<=90?'st-green':days<=180?'st-blue':days<=365?'st-orange':'st-red';
    const lbl=days===null?'ยังไม่เคยใช้บริการ':thDate(r.last.date);
    return `<tr class="click" onclick="openCust('${r.c.id}')">
      <td class="ctr"><span class="stbtn ${cls}">${lbl}</span>
        ${days!==null?`<div class="hint">${days===0?'วันนี้':'ผ่านมา '+days+' วัน'}${r.last.ref?' · '+esc(r.last.ref):''}</div>`:''}</td>
      <td><b>${esc(brand)}</b>${r.v&&r.v.model?`<div class="hint">${esc(r.v.model)}${r.v.color?' · '+esc(r.v.color):''}</div>`:''}</td>
      <td class="mono"><b>${esc(plateOf(r.v))}</b></td>
      <td>${esc(custName(r.c))}<div class="hint">${r.c.type==='company'?'นิติบุคคล':'บุคคลธรรมดา'}${r.c.tier?' · ระดับราคา '+esc(r.c.tier):''}</div></td>
      <td class="mono" style="font-size:12.5px">${esc(r.c.tel||'-')}${r.c.tel2?'<br>'+esc(r.c.tel2):''}</td>
      <td>${starHtml(n(r.c.stars),r.c.id)}<div class="hint">${esc(STAR_LABEL[n(r.c.stars)]||STAR_LABEL[0])}</div></td>
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
        <button class="btn sm gh" onclick="openCust('${r.c.id}');event.stopPropagation()">แก้ไข</button>
        <button class="btn sm gh" onclick="quoteFor('${r.c.id}');event.stopPropagation()">เปิดใบเสนอราคา</button>
        <button class="btn sm dgr" onclick="delCust('${r.c.id}');event.stopPropagation()">ลบ</button></div></td></tr>`}).join('');
  $('#custLEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('custLTbl');
  const filtered=q||f;
  $('#custLCount').textContent=rows.length+' คัน · '+new Set(rows.map(r=>r.c.id)).size+' ราย'+(filtered?' (กำลังกรองอยู่)':'');
  if(typeof mkCards==='function') mkCards('custLTbl');
}
$('#clSearch').oninput=renderCustList; $('#clFilter').onchange=renderCustList;
function printCustList(){
  const rows=custRows().sort((a,b)=>(b.last.date||'').localeCompare(a.last.date||''));
  const per=32, pages=Math.max(1,Math.ceil(rows.length/per));
  let html='';
  for(let p=0;p<pages;p++){
    html+=sheetTop({title:'รายชื่อลูกค้าและรถในความดูแล',en:'CUSTOMER LIST',copy:'รายงานภายใน',
      fields:[['ณ วันที่',thDate(iso())],['จำนวน',rows.length+' คัน'],['หน้า',(p+1)+' / '+pages]]})+
      `<table><thead><tr><th style="width:26px">#</th><th style="width:82px">วันที่เข้ารับบริการ</th>
        <th style="width:100px">ยี่ห้อรถ</th><th style="width:98px">ทะเบียนรถ</th>
        <th>ชื่อลูกค้า</th><th style="width:90px">เบอร์โทร</th>
        <th style="width:58px">เกรด</th></tr></thead><tbody>
        ${rows.slice(p*per,(p+1)*per).map((r,i)=>`<tr><td style="text-align:center">${p*per+i+1}</td>
          <td style="text-align:center">${r.last.date?thDate(r.last.date):'-'}</td>
          <td>${esc(String((r.v&&r.v.brand)||'-').replace(/\s*\(.*/,''))}</td>
          <td>${esc(plateOf(r.v))}</td><td>${esc(custName(r.c))}</td><td>${esc(r.c.tel||'-')}</td>
          <td style="text-align:center">${n(r.c.stars)?'★'.repeat(n(r.c.stars)):'-'}</td></tr>`).join('')}
        </tbody></table>
      ${p===pages-1?'<div class="note">เรียงตามวันที่เข้ารับบริการล่าสุด ใช้สำหรับวางแผนติดตามลูกค้าและงานการตลาด</div>':''}</div>`;
  }
  printDocs(html);
}


/* ==========================================================
   เคลมสินค้า · ใบเคลมสินค้าส่งผู้ขาย
   ========================================================== */
const CLAIM_ST={open:['รอส่งเคลม','st-orange'],sent:['ส่งเคลมแล้ว','st-blue'],
  return:['ส่งคืนสินค้า','st-grey'],   /* ร้านส่งของผิด — ตัดสต๊อกออกจบเลย ไม่มีขารับคืน */
  back:['รับสินค้าคืนแล้ว','st-green'],reject:['ผู้ขายปฏิเสธ','st-red']};
let C=null, IS=null, SC=null, stkPane='stock';
const CLMIN=0, ISMIN=0;
$('#stkTabs').addEventListener('click',e=>{const b=e.target.closest('button'); if(b){ go('stock'); stkGo(b.dataset.s); }});
function stkGo(v){
  stkPane=v;
  $$('#stkTabs button').forEach(x=>x.classList.toggle('on',x.dataset.s===v));
  $$('.spane').forEach(p=>p.style.display=(p.id==='s-'+v)?'':'none');
  $('#stkHint').textContent=v==='cclaim'?'รับเคลมสินค้าที่ลูกค้านำกลับมา ตรวจประกัน เปลี่ยนชิ้นใหม่ให้ และส่งต่อเคลมผู้ขาย'
    :v==='claim'?'ออกใบเคลมสินค้าส่งผู้ขาย พร้อมตัดสต๊อกเมื่ออนุมัติ'
    :v==='issue'?'บันทึกการเบิกอะไหล่ไปใช้ภายใน (ไม่ผ่านใบอนุมัติซ่อม) พร้อมตัดสต๊อกเมื่ออนุมัติ'
    :v==='count'?'ตรวจนับยอดสต๊อกจริงเทียบกับระบบ แล้วปรับยอดเมื่ออนุมัติ'
    :v==='px'?'คลังกลาง ProX — สั่งตรงราคาซัพพลาย เพิ่มเข้าทะเบียนอะไหล่ได้ทันที (โมดูลเสริมจาก Ecosystem)'
    :'ทะเบียนสินค้า ราคา 3 ระดับ ตำแหน่งจัดเก็บ และสัญญาณเตือน';
  if(v==='px'){ ensurePX(); if(PXNET.on){dcPull();renderPxCatNet();}else{renderPxCat(); renderPxReqs();} }
  if(v==='kits'){ if(typeof pkgRenderKits==='function') pkgRenderKits(); return; }
  if(v==='move'){ if(typeof pkgRenderMoves==='function') pkgRenderMoves(); return; }
  if(v==='cclaim'){ if(typeof pkgRenderCClaims==='function') pkgRenderCClaims(); return; }
  if(v==='claim'){ if(!C) newClaim(true); else fillClaimForm(); renderClaimList(); }
  else if(v==='issue'){ if(!IS) newIssue(true); else fillIssueForm(); renderIssueList(); }
  else if(v==='count'){ if(!SC) newCount(true); else fillCountForm(); renderCountList(); }
  else renderStock();
}
function blankCLine(){ return {stockId:'',code:'',name:'',qty:1,reason:''}; }
function clFilled(x){ return !!(x&&(String(x.code||'').trim()||String(x.name||'').trim())); }
function clItemsClean(c){ return JSON.parse(JSON.stringify((c.items||[]).filter(clFilled))); }
function padCLines(){ C.items=C.items||[]; while(C.items.length<CLMIN) C.items.push(blankCLine()); }
function addClaimLine(){ if(C.deducted) return toast('ใบนี้ตัดสต๊อกไปแล้ว แก้ไขรายการไม่ได้');
  C.items.push(blankCLine()); renderClaimItems(); }
function delCLine(i){ if(C.deducted) return toast('ใบนี้ตัดสต๊อกไปแล้ว แก้ไขรายการไม่ได้');
  C.items.splice(i,1); if(C.items.length<CLMIN) C.items.push(blankCLine()); renderClaimItems(); }
function newClaim(silent){
  /* เดิมตั้งผู้ขายเป็นรายแรกในทะเบียนให้อัตโนมัติ — ดูเหมือนข้อมูลใบเก่าติดมา และลบออกไม่ได้
     ใบใหม่ต้องเริ่มจากว่างเสมอ ให้ผู้ใช้เลือกเอง */
  C={id:uid(),no:'',date:iso(),vendorId:'',ref:'',grId:'',status:'open',receiptId:'',plate:'',
    items:[],recv:'',by:'',ap:'',note:'',deduct:true,deducted:false,
    apv:{status:'draft',byName:'',date:'',note:''}};
  padCLines(); fillClaimForm(); if(silent) return; openModal('mClaimEdit'); toast('เปิดใบเคลมสินค้าใบใหม่');
}
function fillClaimForm(){
  if(!C) return;
  $('#clNo').textContent=C.no||'ยังไม่มีเลขที่';
  $('#clVendor').innerHTML='<option value="">— เลือกผู้ขาย —</option>'+DB.vendors.map(v=>`<option value="${v.id}">${esc(v.name)}</option>`).join('')
    ||'<option value="">— ยังไม่มีผู้ขายในระบบ —</option>';
  /* เดิม: ไม่เจอผู้ขังในทะเบียน = เด้งไปเป็นรายแรกเสมอ — ทำให้ใบใหม่ (ผู้ขายว่าง) ถูกเติมให้ทุกครั้งที่เปิดฟอร์ม
     ตอนนี้เติมเฉพาะกรณีที่ "เคยเลือกไว้แล้วผู้ขายรายนั้นถูกลบทิ้ง" → ล้างเป็นว่าง · ใบใหม่คงว่างตามเดิม */
  if(C.vendorId&&!DB.vendors.some(v=>v.id===C.vendorId)) C.vendorId='';
  $('#clVendor').value=C.vendorId; if(typeof clVendorPicker!=='undefined'&&clVendorPicker) clVendorPicker.sync();
  $('#clDate').value=C.date; $('#clStatus').value=C.status||'open';
  $('#clRecv').value=C.recv||''; $('#clBy').value=C.by||''; $('#clAp').value=C.ap||'';
  $('#clNote').value=C.note||''; $('#clDeduct').checked=C.deduct!==false;
  $('#clDeduct').disabled=!!C.deducted;
  $('#clReceiptRef').innerHTML='<option value="">— ไม่ระบุ —</option>'+DB.receipts.slice().sort((a,b)=>b.date.localeCompare(a.date))
    .map(r=>`<option value="${r.id}">${esc(r.no)} · ${esc(custName(findCust(r.custId))||'-')}</option>`).join('');
  $('#clReceiptRef').value=C.receiptId||''; $('#clPlate').value=C.plate||'';
  $('#clGrRef').innerHTML='<option value="">— ไม่ระบุ —</option>'+DB.purchases.filter(g=>!g.cancelled).slice()
    .sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))
    .map(g=>`<option value="${g.id}">${esc(g.no)}</option>`).join('');
  $('#clGrRef').value=C.grId||'';
  if(typeof clRcptPicker!=='undefined'&&clRcptPicker) clRcptPicker.sync();
  if(typeof clGrPicker!=='undefined'&&clGrPicker) clGrPicker.sync();
  refreshClaimRefs(); renderClaimItems(); renderApvBars();
}
/* เลือกใบซื้อในใบเคลมแล้ว: ผู้ขายเซ็ตตามใบนั้นทันที และถ้าเลขอ้างอิงยังว่างก็เติมให้
   — เคสร้านส่งของผิด 1 ใน 5 รายการ จะรู้ทันทีว่าของชิ้นนั้นมากับใบไหน ของผู้ขายรายใด */
/* กติกา: อ้างอิงได้ทีละใบเท่านั้น (ใบซื้อ หรือ ใบเสร็จขาย) — เลือกอันใหม่ อันเก่าเด้งออกเอง
   ไม่งั้นใบเคลมที่พิมพ์ออกมาจะมีเลขอ้างอิงสองใบปนกัน · ล้างด้วยปุ่ม ✕ ได้ทั้งคู่ */
function clDropRcptRef(){
  if(!$('#clReceiptRef').value) return false;
  $('#clReceiptRef').value='';
  if(typeof clRcptPicker!=='undefined'&&clRcptPicker) clRcptPicker.sync();
  if(typeof C!=='undefined'&&C){ C.receiptId=''; C.plate=''; }
  $('#clPlate').value='';
  return true;
}
function clDropGrRef(){
  if(!$('#clGrRef').value) return false;
  $('#clGrRef').value='';
  if(typeof clGrPicker!=='undefined'&&clGrPicker) clGrPicker.sync();
  if(typeof C!=='undefined'&&C){ C.grId=''; C.ref=''; }
  return true;
}
if($('#clGrRef')) $('#clGrRef').onchange=()=>{
  const g=DB.purchases.find(x=>x.id===$('#clGrRef').value);
  if(!g){ /* ถูกล้างค่า (ปุ่ม ✕) */ if(typeof C!=='undefined'&&C){ C.grId=''; C.ref=''; } return; }
  const dropped=clDropRcptRef();
  if(typeof C!=='undefined'&&C) C.grId=g.id;
  $('#clVendor').value=g.vendorId;
  if(typeof clVendorPicker!=='undefined'&&clVendorPicker) clVendorPicker.sync();
  if(typeof C!=='undefined'&&C) C.vendorId=g.vendorId;
  if(typeof C!=='undefined'&&C) C.ref=g.no+(g.inv?' / '+g.inv:'');
  toast('อ้างอิง '+g.no+' — ดึงชื่อผู้ขายและเลขอ้างอิงให้แล้ว'+(dropped?' · ล้างอ้างอิงใบเสร็จขายออกให้ (อ้างได้ทีละใบ)':''));
  clPullOpen('gr');
};
function clRcptChanged(){
  const r=DB.receipts.find(x=>x.id===$('#clReceiptRef').value);
  if(!r){ /* ถูกล้างค่า (ปุ่ม ✕) */ if(typeof C!=='undefined'&&C){ C.receiptId=''; C.plate=''; } fillClaimPlate(); return; }
  const dropped=clDropGrRef();
  if(typeof C!=='undefined'&&C) C.receiptId=r.id;
  fillClaimPlate();
  if(dropped) toast('อ้างอิง '+r.no+' — ล้างอ้างอิงใบซื้อออกให้ (อ้างได้ทีละใบ)');
  clPullOpen('rcpt');
}
/* หยิบรายการจากใบอ้างอิงเข้าใบเคลม
   src='gr' ใบซื้อ · src='rcpt' ใบเสร็จขาย (เอาเฉพาะอะไหล่ ข้ามบรรทัดค่าแรง)
   ไม่ระบุ src = ปุ่มบนหัวตาราง เลือกใบซื้อก่อน ไม่มีค่อยใช้ใบเสร็จ
   เคลมที่ไม่อ้างใบไหนเลย ก็พิมพ์กรอกในตารางเองได้เหมือนเดิม */
let CLPULL={items:[],no:''};
function clPullOpen(src){
  if(typeof C==='undefined'||!C) return;
  if(C.cancelled) return toast('ใบเคลมนี้ถูกยกเลิกแล้ว');
  if(C.deducted) return toast('ใบนี้ตัดสต๊อกส่งเคลมแล้ว แก้ไขรายการไม่ได้');
  let doc=null,items=[],no='';
  const g=DB.purchases.find(x=>x.id===$('#clGrRef').value);
  const r=DB.receipts.find(x=>x.id===$('#clReceiptRef').value);
  if(src==='gr'&&g){ doc=g; } else if(src==='rcpt'&&r){ doc=r; }
  else if(!src){ doc=g||r; if(!doc) return toast('เลือกใบซื้อสินค้าหรือใบเสร็จขายที่จะอ้างอิงก่อน'); }
  if(!doc) return;
  if(doc===g){ items=grItemsClean(g).map(it=>({stockId:it.stockId||'',code:it.code||'',name:it.name||'',qty:n(it.qty)})); no=g.no; }
  else{ items=pkgExpandKits(doc.items||[]).filter(it=>it&&it.type!=='labor'&&(String(it.code||it.name||'').trim()))
      .map(it=>({stockId:it.stockId||'',code:it.code||'',name:it.name||'',qty:n(it.qty)})); no=doc.no; }
  if(!items.length) return toast('ใบ '+no+' ไม่มีรายการอะไหล่ให้หยิบ');
  CLPULL={items:items,no:no};
  $('#cpTag').textContent=no+' · '+items.length+' รายการ';
  $('#cpBody').innerHTML=items.map((it,i)=>`<tr>
    <td class="mono" style="font-size:12px">${esc(it.code||'-')}</td><td>${esc(it.name||'-')}</td>
    <td class="num">${qf(it.qty)}</td>
    <td class="ctr"><button class="btn pri sm" onclick="clPullAdd(${i})">+ เคลมชิ้นนี้</button></td></tr>`).join('');
  openModal('mClPull');
}
function clPullAdd(i){
  const it=CLPULL.items[i]; if(!it) return;
  if(C.cancelled||C.deducted) return toast('ใบนี้แก้ไขรายการไม่ได้แล้ว');
  C.items=C.items||[];
  const dup=C.items.find(x=>clFilled(x)&&((it.stockId&&x.stockId===it.stockId)
    ||(x.code&&String(x.code).toLowerCase()===String(it.code||'').toLowerCase())));
  if(dup) return toast((it.code||it.name)+' อยู่ในรายการเคลมแล้ว — แก้จำนวนในตารางได้เลย');
  /* ช่องสาเหตุปล่อยว่างให้กรอกเหตุผลจริงของการเคลม (ของเสีย/ส่งผิดรุ่น ฯลฯ)
     — เลขใบที่อ้างอิงเก็บอยู่ที่หัวเอกสารแล้ว ไม่ต้องซ้ำในทุกบรรทัด */
  const line=Object.assign(blankCLine(),{stockId:it.stockId,code:it.code,name:it.name,qty:it.qty||1});
  const empty=C.items.findIndex(x=>!clFilled(x));
  if(empty>=0) C.items[empty]=line; else C.items.push(line);
  renderClaimItems();
  toast('เพิ่ม '+(it.code||it.name)+' เข้าใบเคลมแล้ว');
}
/* ---------- บันทึกผลการเคลมรายบรรทัด ----------
   back=รับคืนเข้าสต๊อก (แก้จำนวนได้ เคลม 4 ได้คืน 2 ก็ระบุ) · loss=ตีเป็นของเสีย ไม่กลับเข้าระบบ
   credit=หักยอดกับผู้ขาย — ระบบจดยอดรวมไว้ที่ใบ ให้ไปหักกับเจ้าหนี้ที่หน้า 08 ตามจริง
   ทำครั้งเดียวต่อใบ (ธง restocked เดิม) */
let CLRECV=[];
function clRecvOpen(){
  if(typeof C==='undefined'||!C||C.restocked) return;
  const items=clItemsClean(C); if(!items.length) return;
  CLRECV=items.map(it=>{ const st=stockOfLine(it);
    return {stockId:it.stockId||'',code:it.code,name:it.name,qty:n(it.qty),t:'back',recv:n(it.qty),
      amt:Math.round(n(it.qty)*n(st?st.cost:0)*100)/100}; });
  $('#crTag').textContent=C.no+' · '+items.length+' รายการ';
  clRecvRender(); openModal('mClRecv');
}
function clRecvRender(){
  $('#crBody').innerHTML=CLRECV.map((x,i)=>`<tr>
    <td class="mono" style="font-size:12px">${esc(x.code||'-')}</td><td>${esc(x.name||'-')}</td>
    <td class="num">${qf(x.qty)}</td>
    <td><select onchange="clRecvType(${i},this.value)">
      <option value="back" ${x.t==='back'?'selected':''}>รับคืนสินค้า</option>
      <option value="loss" ${x.t==='loss'?'selected':''}>สินค้าเสียหาย</option>
      <option value="credit" ${x.t==='credit'?'selected':''}>หักยอดสินค้า</option></select></td>
    <td class="num">${x.t==='back'
      ?`<input type="number" min="0" max="${x.qty}" value="${x.recv}" style="text-align:right" oninput="clRecvVal(${i},this.value)">`
      :x.t==='credit'
      ?`<input type="number" min="0" step="0.01" value="${x.amt}" style="text-align:right" oninput="clRecvVal(${i},this.value)">`
      :'<span class="hint">ตัดเป็นของเสีย</span>'}</td></tr>`).join('');
  clRecvSum();
}
function clRecvType(i,v){ CLRECV[i].t=v; clRecvRender(); }
function clRecvVal(i,v){ const x=CLRECV[i];
  if(x.t==='back') x.recv=Math.max(0,Math.min(n(v),x.qty)); else x.amt=Math.max(0,n(v));
  clRecvSum(); }
function clRecvSum(){
  const backQ=CLRECV.filter(x=>x.t==='back').reduce((a,x)=>a+x.recv,0);
  const loss=CLRECV.filter(x=>x.t==='loss').length;
  const cr=CLRECV.filter(x=>x.t==='credit').reduce((a,x)=>a+x.amt,0);
  $('#crSum').textContent='รับคืนเข้าสต๊อก '+backQ+' ชิ้น · ตีเสีย '+loss+' รายการ · หักยอดรวม '+money(cr)+' บาท';
}
function clRecvApply(){
  if(C.restocked) return closeModal('mClRecv');
  CLRECV.forEach(x=>{
    if(x.t!=='back'||!(x.recv>0)) return;
    const st=stockOfLine(x);
    if(st){ st.qty=n(st.qty)+x.recv; st.lastMove=iso();
      logMove(st.id,'in',x.recv,iso(),'รับสินค้าเคลมคืนเข้าสต๊อก',C.no,C.vendorId,st.cost); }
  });
  const credit=Math.round(CLRECV.filter(x=>x.t==='credit').reduce((a,x)=>a+x.amt,0)*100)/100;
  /* จดผลติดไว้รายบรรทัดของเอกสาร — ตรวจย้อนหลังได้ว่าชิ้นไหนจบแบบไหน */
  C.items=(C.items||[]).map(it=>{ if(!clFilled(it)) return it;
    const x=CLRECV.find(y=>y.code===it.code&&y.name===it.name);
    if(x) it.result={t:x.t,qty:x.t==='back'?x.recv:0,amt:x.t==='credit'?x.amt:0};
    return it; });
  const backQ=CLRECV.filter(x=>x.t==='back').reduce((a,x)=>a+x.recv,0);
  C.restocked=true; C.restockDate=iso(); C.creditAmt=credit;
  C.recvSummary='รับคืน '+backQ+' ชิ้น · ตีเสีย '+CLRECV.filter(x=>x.t==='loss').length+' รายการ'
    +(credit?' · หักยอด '+money(credit)+' บาท':'');
  logAudit('claim',C,'restock',C.recvSummary);
  const ci=DB.claims.findIndex(x=>x.id===C.id);
  if(ci>=0){ const rec=JSON.parse(JSON.stringify(C)); rec.items=clItemsClean(C); DB.claims[ci]=rec; }
  save(); renderStock(); renderClaimList(); renderClaimItems();
  closeModal('mClRecv');
  saveFx('บันทึกผลการเคลมแล้ว',C.no);
  toast(C.recvSummary+(credit?' — อย่าลืมไปหักยอดกับเจ้าหนี้ที่หน้า 08':''));
}
function fillClaimPlate(){
  const rid=$('#clReceiptRef').value;
  const r=DB.receipts.find(x=>x.id===rid);
  if(!r){ $('#clPlate').value=''; return; }
  const c=findCust(r.custId), v=c&&(c.vehicles||[])[r.vehIdx];
  $('#clPlate').value=plateOf(v);
}
function renderClaimItems(){
  padCLines();
  const lock=!!C.deducted;
  $('#clItems tbody').innerHTML=C.items.map((it,i)=>`<tr>
    <td class="ctr hint">${i+1}</td>
    <td>${lock?esc(it.code||''):`<input type="text" list="stockList" class="mono ccode" data-i="${i}" value="${esc(it.code)}" placeholder="พิมพ์รหัส">`}</td>
    <td>${lock?esc(it.name||''):`<input type="text" class="cname" data-i="${i}" value="${esc(it.name)}">`}</td>
    <td class="num">${lock?qf(it.qty):`<input type="number" class="cqty" data-i="${i}" value="${it.qty}" style="text-align:right">`}</td>
    <td>${lock?esc(it.reason||''):`<input type="text" class="creason" data-i="${i}" value="${esc(it.reason)}" placeholder="เช่น ชำรุดจากการผลิต / ผิดรุ่น / แตกหักระหว่างขนส่ง">`}</td>
    <td class="ctr">${lock?'':`<button class="btn sm dgr" onclick="delCLine(${i})">×</button>`}</td></tr>`).join('');
  if(!lock){
    $$('.ccode').forEach(el=>el.onchange=e=>{const i=+e.target.dataset.i, code=e.target.value.trim();
      const st=DB.stock.find(x=>x.code.toLowerCase()===code.toLowerCase());
      if(st){ C.items[i]=Object.assign(C.items[i],{code:st.code,name:st.name,stockId:st.id}); }
      else { C.items[i].code=code; C.items[i].stockId=''; }
      renderClaimItems();});
    $$('.cname').forEach(el=>el.oninput=e=>C.items[+e.target.dataset.i].name=e.target.value);
    $$('.cqty').forEach(el=>el.oninput=e=>{C.items[+e.target.dataset.i].qty=n(e.target.value);clLineInfo()});
    $$('.creason').forEach(el=>el.oninput=e=>C.items[+e.target.dataset.i].reason=e.target.value);
  }
  $$('#v-stock button[onclick^="addClaimLine"]').forEach(b=>b.disabled=lock);
  clLineInfo();
}
function clLineInfo(){
  const li=$('#clLineInfo'); if(!li) return;
  const f=clItemsClean(C);
  li.textContent=(C.deducted?'ใบนี้ตัดสต๊อกแล้ว — ล็อกรายการไม่ให้แก้ไข · ':'')+'กรอกแล้ว '+f.length+' รายการ · จำนวนรวม '+f.reduce((a,x)=>a+n(x.qty),0)+' ชิ้น จากทั้งหมด '+C.items.length+' บรรทัด';
}
function collectClaim(){
  C.date=$('#clDate').value||iso(); C.vendorId=$('#clVendor').value;
  C.status=$('#clStatus').value; C.recv=$('#clRecv').value.trim(); C.by=$('#clBy').value.trim();
  C.ap=$('#clAp').value.trim(); C.note=$('#clNote').value.trim(); C.deduct=$('#clDeduct').checked;
  C.receiptId=$('#clReceiptRef').value; C.grId=$('#clGrRef').value; C.plate=$('#clPlate').value.trim();
}
function saveClaim(){
  if(!can('doc.docStock')) return toast('บัญชีนี้ไม่มีสิทธิออกใบเคลมสินค้า');
  /* ใบที่ยกเลิกแล้วแก้ไม่ได้อีก — กันที่ฟังก์ชันบันทึกด้วย ไม่ใช่แค่ซ่อนปุ่ม
     เพราะฟอร์มอาจถูกเปิดค้างไว้ก่อนที่อีกหน้าจะกดยกเลิก */
  if(C&&C.cancelled) return toast('ใบเคลม '+C.no+' ถูกยกเลิกแล้ว แก้ไขไม่ได้ — กด "สร้างใบใหม่" แทน');
  collectClaim();
  if(!clItemsClean(C).length) return toast('กรอกรายการสินค้าที่เคลมอย่างน้อย 1 บรรทัด');
  if(!C.vendorId) return toast('เลือกชื่อผู้ขายก่อนบันทึก');
  if(clItemsClean(C).some(x=>n(x.qty)<=0)) return toast('ระบุจำนวนของทุกรายการให้มากกว่า 0');
  if(!C.no) C.no=docNo('CL');
  if(C.deducted){ const orig=DB.claims.find(x=>x.id===C.id);
    if(orig) C.items=JSON.parse(JSON.stringify(orig.items)); }
  /* สถานะ "รับสินค้าคืน / เปลี่ยนใหม่แล้ว" = ผู้ขายส่งของชิ้นใหม่มาแล้ว
     ระบบรับกลับเข้าสต๊อกให้เองที่นี่ ไม่ต้องทำใบรับสินค้าใหม่ (ทำใบรับใหม่จะกลายเป็นซื้อซ้ำ ต้นทุนบวม)
     ทำครั้งเดียวต่อใบ (ธง restocked) และเมื่อรับคืนแล้วห้ามถอยสถานะกลับ กันสต๊อกเบิ้ล */
  const prevC=DB.claims.find(x=>x.id===C.id);
  if((prevC&&prevC.restocked)||C.restocked){
    C.restocked=true; C.restockDate=C.restockDate||(prevC&&prevC.restockDate)||iso();
    if(C.status!=='back'){ C.status='back'; $('#clStatus').value='back';
      toast('ใบนี้รับสินค้าคืนเข้าสต๊อกไปแล้ว — สถานะต้องคงเป็น "รับสินค้าคืน / เปลี่ยนใหม่แล้ว"'); }
  }else if(C.status==='back'&&C.deducted){
    /* เดิมรับคืนเหมาเข่งทั้งใบ — ตอนนี้เปิดหน้าบันทึกผลรายบรรทัดแทน (รับคืน/ตีเสีย/หักยอด)
       ของเข้าสต๊อกเมื่อกดยืนยันในหน้านั้น · ปิดไปก่อนได้ กดบันทึกใบอีกครั้งหน้านี้จะเปิดใหม่ */
    setTimeout(clRecvOpen,60);
  }else if(C.status==='back'&&!C.deducted){
    toast('ใบนี้ไม่ได้ตัดสต๊อกตอนส่งเคลม จึงไม่มีของต้องรับคืนเข้าระบบ');
  }
  const i=DB.claims.findIndex(x=>x.id===C.id);
  stampRec(C,i>=0?DB.claims[i]:null);
  const rec=JSON.parse(JSON.stringify(C)); rec.items=clItemsClean(C);
  if(i>=0) DB.claims[i]=rec; else DB.claims.push(rec);
  logAudit('claim',C,'save',clItemsClean(C).length+' รายการ · จำนวนรวม '+clItemsClean(C).reduce((a,x)=>a+n(x.qty),0)+' ชิ้น');
  save(); $('#clNo').textContent=C.no; refreshClaimRefs(); renderClaimList(); renderApvBars();
  saveFx('บันทึกเอกสารแล้ว',C.no);
  toast('บันทึกใบเคลมสินค้า '+C.no+' แล้ว'+(C.deducted?'':' · สินค้าจะถูกตัดสต๊อกเมื่อผู้มีสิทธิกดอนุมัติ'));
}
/* รายการที่จำนวนขอเกินของที่มีในสต๊อก — ใช้เตือนก่อนตัด แบบเดียวกับใบเสนอราคา/ใบเสร็จ */
function shortLines(items){
  return (items||[]).map(it=>({it,st:stockOfLine(it)}))
    .filter(x=>x.st&&n(x.it.qty)>n(x.st.qty));
}
function shortText(list){
  return list.slice(0,6).map(x=>'· '+(x.it.name||x.it.code)+' — ขอ '+n(x.it.qty)+' มีจริง '+n(x.st.qty)).join('\n')
    +(list.length>6?'\n· … และอีก '+(list.length-6)+' รายการ':'');
}
function postClaim(c){
  if(c.deducted||c.deduct===false) return;
  clItemsClean(c).forEach(it=>{
    const st=it.stockId?DB.stock.find(x=>x.id===it.stockId)
      :DB.stock.find(x=>x.code.toLowerCase()===String(it.code).toLowerCase());
    if(!st) return;
    /* เดิมใช้ Math.max(0,…) = ตัดเหลือ 0 เงียบ ๆ พอยกเลิกใบทีหลังระบบคืนของตามจำนวนที่ขอ
       ทำให้สต๊อกงอกเกินจริง — ตอนนี้ปล่อยติดลบเหมือนใบเสร็จขาย ตัวเลขจึงตรงและตรวจย้อนหลังได้ */
    st.qty=n(st.qty)-n(it.qty); st.lastMove=c.date;
    logMove(st.id,'out',n(it.qty),c.date,'ส่งเคลมสินค้า'+(it.reason?' — '+it.reason:''),c.no,c.vendorId,st.cost);
  });
  c.deducted=true;
}
function openClaimById(id){
  const c=DB.claims.find(x=>x.id===id); if(!c) return;
  logAudit('claim',c,'open');
  C=JSON.parse(JSON.stringify(c)); padCLines(); fillClaimForm(); openModal('mClaimEdit');
  go('stock'); stkGo('claim'); toast('เปิด '+c.no);
}
/* ==========================================================
   ยกเลิกเอกสารหมวด 07 — เคลมสินค้า · เบิกใช้ภายใน · ตรวจนับสินค้า
   ใช้กติกาเดียวกับหมวด 03/04 : เอกสารไม่หายจากทะเบียน แค่ติดสถานะ "ยกเลิกแล้ว"
   เดิมเป็นการลบทิ้งจริง (DB.xxx = filter ออก) ซึ่งทำให้ตรวจย้อนหลังไม่ได้ว่าเคยมีใบนี้
   ⚠️ คืนสต๊อกก่อนติดธงเสมอ แล้วล้าง deducted/applied เพื่อให้สถานะตรงกับความจริง
      ว่า "ใบนี้ไม่ได้กันของไว้แล้ว"
   ========================================================== */
async function cancelStockDoc(cfg){
  if(!can('doc.delDoc')) return toast('บัญชีนี้ไม่มีสิทธิยกเลิกเอกสาร');
  const d=cfg.find(); if(!d) return;
  if(d.cancelled) return toast(cfg.label+' '+d.no+' ถูกยกเลิกไปแล้ว');
  if(!d.no) return toast('ใบนี้ยังไม่ได้บันทึก จึงไม่ต้องยกเลิก');
  const undo=!!d[cfg.flag];
  const reason=await askPromptP({title:'ยกเลิก'+cfg.label+' '+d.no,
    text:'ระบุเหตุผลที่ยกเลิก (ไม่บังคับ)'
      +(undo?'\n\n'+cfg.undoText:'\n\nใบนี้ยังไม่ได้กระทบสต๊อก จึงไม่มีรายการต้องคืน')
      +'\n\nใบที่ยกเลิกจะยังอยู่ในทะเบียนให้ดูย้อนหลังได้ แต่แก้ไขไม่ได้อีก',
    yes:'ยืนยันยกเลิก',no:'ไม่ยกเลิก'});
  if(reason===null) return;
  if(undo){ cfg.restore(d); d[cfg.flag]=false; }
  d.cancelled=true; d.cancelReason=String(reason||'').trim(); d.cancelDate=iso();
  logAudit(cfg.kind,d,'del','ยกเลิก'+cfg.label+' '+d.no
    +(undo?' · คืนสต๊อกแล้ว':'')+(d.cancelReason?' — '+d.cancelReason:''));
  save(); renderStock(); cfg.render();
  if(cfg.reopen) cfg.reopen(d);
  toast('ยกเลิก'+cfg.label+' '+d.no+' แล้ว'+(undo?' · คืนสต๊อกเรียบร้อย':''));
}
/* หาสินค้าในสต๊อกจาก stockId ก่อน ถ้าไม่เจอค่อยเทียบรหัส — ใช้ร่วมกันทั้งใบเคลมและใบเบิก */
function cancelTag(rows){ const c=rows.filter(x=>x.cancelled).length;
  return rows.length+' ใบ'+(c?' · ยกเลิก '+c+' ใบ':''); }
function stockOfLine(it){
  return it.stockId?DB.stock.find(x=>x.id===it.stockId)
    :DB.stock.find(x=>x.code.toLowerCase()===String(it.code).toLowerCase());
}
async function cancelClaim(id){
  const c0=DB.claims.find(x=>x.id===id);
  if(c0&&c0.restocked) return toast('ใบเคลม '+c0.no+' รับสินค้าเปลี่ยนคืนเข้าสต๊อกแล้ว ยกเลิกไม่ได้ — วงจรเคลมจบสมบูรณ์แล้ว');
  await cancelStockDoc({
    kind:'claim', label:'ใบเคลม', flag:'deducted',
    undoText:'ใบนี้ตัดสต๊อกไปแล้ว ระบบจะคืนสต๊อกให้อัตโนมัติ',
    find:()=>DB.claims.find(x=>x.id===id),
    restore:c=>clItemsClean(c).forEach(it=>{ const st=stockOfLine(it);
      if(st){ st.qty=n(st.qty)+n(it.qty); st.lastMove=iso();
        logMove(st.id,'in',n(it.qty),iso(),'คืนสต๊อกจากการยกเลิกใบเคลมสินค้า',c.no,c.vendorId,st.cost); }}),
    render:()=>{ renderClaimList(); refreshClaimRefs(); },
    reopen:c=>{ if(C&&C.id===c.id) openClaimById(c.id); }
  });
}
function refreshClaimRefs(){
  const el=$('#clOpen'); if(!el) return;
  el.innerHTML='<option value="">— เปิดใบเคลมที่บันทึกไว้ —</option>'
    +DB.claims.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.no||'').localeCompare(String(a.no||'')))
      .map(c=>`<option value="${c.id}">${esc(c.no)} · ${esc((findVen(c.vendorId)||{}).name||'-')}${c.cancelled?' · (ยกเลิกแล้ว)':''}</option>`).join('');
}
$('#clOpen').onchange=()=>{ const id=$('#clOpen').value; if(id) openClaimById(id); };
function renderClaimList(){
  let rows=DB.claims.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.no||'').localeCompare(String(a.no||'')));
  const qc=(($('#clmSearch')||{}).value||'').toLowerCase().trim();
  if(qc) rows=rows.filter(c=>[c.no,(findVen(c.vendorId)||{}).name,c.plate].some(s=>String(s||'').toLowerCase().includes(qc)));
  rows=applyDateFilter(rows,'clmDate');
  rows=sortRows('clTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'clm');
  $('#clTbl tbody').innerHTML=rows.map(c=>{
    const v=findVen(c.vendorId), st=CLAIM_ST[c.status]||CLAIM_ST.open, a=apvOf(c);
    const items=clItemsClean(c);
    return `<tr class="click${c.cancelled?' cancelrow':''}" onclick="openClaimById('${c.id}')">
      <td class="mono" style="font-size:12px"><b>${esc(c.no||'(ไม่มีเลขที่)')}</b>
        ${c.cancelled?`<div><span class="chip r" title="${esc(c.cancelReason||'')}">ยกเลิกแล้ว</span></div>`:''}</td>
      <td class="ctr">${thDate(c.date)}</td>
      <td>${esc((v&&v.name)||'-')}${c.ref?`<div class="hint mono">อ้างอิง ${esc(c.ref)}</div>`:''}</td>
      <td class="ctr mono">${esc(c.plate||'-')}</td>
      <td class="num">${items.length}</td>
      <td class="num"><b>${qf(items.reduce((s,x)=>s+n(x.qty),0))}</b></td>
      <td class="ctr">${a.status==='approved'?'<span class="stbtn st-green">อนุมัติแล้ว</span>'
        :a.status==='rejected'?'<span class="stbtn st-red">ตีกลับ</span>'
        :'<span class="stbtn st-orange">รออนุมัติ</span>'}
        ${c.deducted?'':'<div class="hint">ยังไม่ตัดสต๊อก</div>'}</td>
      <td class="ctr"><span class="stbtn ${st[1]}">${st[0]}</span>${c.recvSummary?`<div class="hint">${esc(c.recvSummary)}</div>`:''}</td>
      ${byCell(c)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px;width:106px">
        <button class="btn sm gh" onclick="openClaimById('${c.id}');event.stopPropagation()">เปิด</button>
        ${c.cancelled?'':`<button class="btn sm dgr pc-delDoc" onclick="cancelClaim('${c.id}');event.stopPropagation()">ยกเลิก</button>`}
      </div></td></tr>`}).join('');
  $('#clEmpty').style.display=rows.length?'none':'block';
  $('#clCount').textContent=cancelTag(rows);
  if(typeof paintSort==='function') paintSort('clTbl');
  if(typeof mkCards==='function') mkCards('clTbl');
}
/* ---------- เอกสารพิมพ์ ---------- */
function sheetClaim(c,copy){
  const v=findVen(c.vendorId), its=clItemsClean(c), st=CLAIM_ST[c.status]||CLAIM_ST.open;
  const rec=c.receiptId?DB.receipts.find(x=>x.id===c.receiptId):null;
  return sheetTop({title:'ใบเคลมสินค้า',en:'CLAIM NOTE / RETURN TO VENDOR',copy:copy,
    stamp:c.cancelled?'ยกเลิกแล้ว':(isApproved(c)?'':'ยังไม่อนุมัติ'),
    fields:[['เลขที่',esc(c.no||'(ยังไม่บันทึก)')],['วันที่เคลมสินค้า',thDate(c.date)],
      ['อ้างอิงเอกสาร',esc(c.ref||'-')],['สถานะการเคลม',esc(st[0])],
      ['ใบเสร็จขายที่เกี่ยวข้อง',esc((rec&&rec.no)||'-')],['ทะเบียนรถ',esc(c.plate||'-')]]})+`
  <table><tr><td style="width:58%;vertical-align:top"><span class="lbl">ผู้ขาย / ผู้รับเคลม</span><br>
      <b>${esc((v&&v.name)||'-')}</b><br>${esc(addrLine((v&&v.addr)||{}))}<br>
      เลขประจำตัวผู้เสียภาษี ${esc((v&&v.tax)||'-')}${v&&v.contact?' · ผู้ติดต่อ '+esc(v.contact):''}
      ${v&&v.tel?' · โทร. '+esc(v.tel):''}</td>
    <td style="vertical-align:top"><span class="lbl">สรุปรายการเคลม</span><br>
      จำนวนรายการ <b>${its.length}</b> รายการ<br>
      จำนวนรวม <b>${qf(its.reduce((a,x)=>a+n(x.qty),0))}</b> ชิ้น<br>
      ${c.deducted?'ตัดออกจากสต๊อกแล้ว':'ยังไม่ได้ตัดออกจากสต๊อก'}</td></tr></table>

  <table style="margin-top:6px"><thead><tr><th style="width:44px">ลำดับที่</th><th style="width:105px">รหัสสินค้า</th>
    <th>ชื่อสินค้า</th><th style="width:52px">จำนวน</th><th style="width:230px">สาเหตุเคลม / ความเสียหาย</th></tr></thead><tbody>
    ${its.map((it,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(it.code||'-')}</td>
      <td>${esc(it.name)}</td><td style="text-align:center">${qf(it.qty)}</td>
      <td>${esc(it.reason||'-')}</td></tr>`).join('')}
    ${Array.from({length:Math.max(0,8-its.length)}).map((_,i)=>`<tr><td style="text-align:center;height:18px">${its.length+i+1}</td>
      <td></td><td></td><td></td><td></td></tr>`).join('')}
  </tbody></table>
  ${c.note?`<div class="box"><span class="lbl">หมายเหตุ</span> ${esc(c.note)}</div>`:''}
  <div class="note">ผู้ขายได้รับสินค้าตามรายการข้างต้นไว้เพื่อตรวจสอบและดำเนินการเคลมตามเงื่อนไขการรับประกันของผู้ผลิต
    หากผลการตรวจสอบไม่เข้าเงื่อนไขการรับประกัน ผู้ขายจะแจ้งให้ทราบและส่งสินค้าคืนตามเดิม</div>
  <div class="sign">
    <div><div class="line"></div>( ${esc(c.recv||'.'.repeat(26))} )<br><span class="lbl">ผู้รับเคลม</span><br>
      <span class="lbl">วันที่ ......../......../........</span></div>
    <div><div class="line"></div>( ${esc(c.by||'.'.repeat(26))} )<br><span class="lbl">ผู้ทำเอกสาร</span><br>
      <span class="lbl">วันที่ ......../......../........</span></div>
    <div><div class="line"></div>( ${esc(c.ap||'.'.repeat(26))} )<br><span class="lbl">ผู้อนุมัติ</span><br>
      <span class="lbl">วันที่ ......../......../........</span></div>
  </div>${apvFoot(c)}</div>`;
}
function printClaim(){
  if(!C) return;
  collectClaim();
  if(!C.no) toast('แนะนำให้บันทึกก่อนพิมพ์ เพื่อให้มีเลขที่เอกสาร');
  logAudit('claim',C,'print','ต้นฉบับ + สำเนา'); save();
  printDocs(sheetClaim(C,'ต้นฉบับ (ผู้ขาย)')+sheetClaim(C,'สำเนา (อู่)'));
}

/* ==========================================================
   เบิกของ (เบิกใช้ภายใน)
   ========================================================== */
function blankISLine(){ return {stockId:'',code:'',name:'',qty:1,reason:''}; }
function isFilled(x){ return !!(x&&(String(x.code||'').trim()||String(x.name||'').trim())); }
function isItemsClean(d){ return JSON.parse(JSON.stringify((d.items||[]).filter(isFilled))); }
function padISLines(){ IS.items=IS.items||[]; while(IS.items.length<ISMIN) IS.items.push(blankISLine()); }
function addIssueLine(){ if(IS.deducted) return toast('ใบนี้ตัดสต๊อกไปแล้ว แก้ไขรายการไม่ได้');
  IS.items.push(blankISLine()); renderIssueItems(); }
function delISLine(i){ if(IS.deducted) return toast('ใบนี้ตัดสต๊อกไปแล้ว แก้ไขรายการไม่ได้');
  IS.items.splice(i,1); if(IS.items.length<ISMIN) IS.items.push(blankISLine()); renderIssueItems(); }
function newIssue(silent){
  IS={id:uid(),no:'',date:iso(),by:'',byId:'',dept:'',items:[],note:'',deducted:false,
    apv:{status:'draft',byName:'',date:'',note:''}};
  padISLines(); fillIssueForm(); if(silent) return; openModal('mIssueEdit'); toast('เปิดใบเบิกของใบใหม่');
}
/* ช่องผู้เบิกดึงรายชื่อพนักงานจากระบบ ไม่ต้องพิมพ์เอง — เก็บทั้ง id และชื่อ ณ ตอนบันทึก
   (เก็บชื่อด้วยเพราะเอกสารที่พิมพ์ออกไปแล้วต้องคงชื่อเดิมไว้ แม้พนักงานจะเปลี่ยนชื่อหรือลาออก) */
const IS_BY_LEGACY='__legacy';
function fillIssueBySel(){
  const el=$('#isBy'); if(!el) return;
  empSel('isBy',IS.byId,'— เลือกพนักงานผู้เบิก —');
  /* ใบเก่าที่พิมพ์ชื่อไว้เองตอนยังไม่มีตัวเลือกนี้ — คงชื่อเดิมไว้เป็นตัวเลือกหนึ่ง ไม่ให้หายเงียบ ๆ */
  if(!el.value&&IS.by){
    const o=document.createElement('option');
    o.value=IS_BY_LEGACY; o.textContent=IS.by+'  (ชื่อเดิมที่พิมพ์ไว้)';
    el.appendChild(o); el.value=IS_BY_LEGACY;
  }
  el.disabled=!!IS.deducted;   /* ตัดสต๊อกแล้วห้ามเปลี่ยนตัวผู้เบิก */
}
function fillIssueForm(){
  if(!IS) return;
  $('#isNo').textContent=IS.no||'ยังไม่มีเลขที่';
  $('#isDate').value=IS.date; $('#isDept').value=IS.dept||''; $('#isNote').value=IS.note||'';
  fillIssueBySel();
  refreshIssueRefs(); renderIssueItems(); renderApvBars();
}
function renderIssueItems(){
  padISLines();
  const lock=!!IS.deducted;
  $('#isItems tbody').innerHTML=IS.items.map((it,i)=>`<tr>
    <td class="ctr hint">${i+1}</td>
    <td>${lock?esc(it.code||''):`<input type="text" list="stockList" class="mono iscode" data-i="${i}" value="${esc(it.code)}" placeholder="พิมพ์รหัส">`}</td>
    <td>${lock?esc(it.name||''):`<input type="text" class="isname" data-i="${i}" value="${esc(it.name)}">`}</td>
    <td class="num">${lock?qf(it.qty):`<input type="number" class="isqty" data-i="${i}" value="${it.qty}" style="text-align:right">`}</td>
    <td>${lock?esc(it.reason||''):`<input type="text" class="isreason" data-i="${i}" value="${esc(it.reason)}" placeholder="เช่น ใช้ซ่อมรถกิจการ / งานทดสอบ">`}</td>
    <td class="ctr">${lock?'':`<button class="btn sm dgr" onclick="delISLine(${i})">×</button>`}</td></tr>`).join('');
  if(!lock){
    $$('.iscode').forEach(el=>el.onchange=e=>{const i=+e.target.dataset.i, code=e.target.value.trim();
      const st=DB.stock.find(x=>x.code.toLowerCase()===code.toLowerCase());
      if(st){ IS.items[i]=Object.assign(IS.items[i],{code:st.code,name:st.name,stockId:st.id}); }
      else { IS.items[i].code=code; IS.items[i].stockId=''; }
      renderIssueItems();});
    $$('.isname').forEach(el=>el.oninput=e=>IS.items[+e.target.dataset.i].name=e.target.value);
    $$('.isqty').forEach(el=>el.oninput=e=>{IS.items[+e.target.dataset.i].qty=n(e.target.value);isLineInfo()});
    $$('.isreason').forEach(el=>el.oninput=e=>IS.items[+e.target.dataset.i].reason=e.target.value);
  }
  $$('#v-stock button[onclick^="addIssueLine"]').forEach(b=>b.disabled=lock);
  isLineInfo();
}
function isLineInfo(){
  const li=$('#isLineInfo'); if(!li) return;
  const f=isItemsClean(IS);
  li.textContent=(IS.deducted?'ใบนี้ตัดสต๊อกแล้ว — ล็อกรายการไม่ให้แก้ไข · ':'')+'กรอกแล้ว '+f.length+' รายการ · จำนวนรวม '+f.reduce((a,x)=>a+n(x.qty),0)+' ชิ้น จากทั้งหมด '+IS.items.length+' บรรทัด';
}
function collectIssue(){
  IS.date=$('#isDate').value||iso(); IS.dept=$('#isDept').value.trim(); IS.note=$('#isNote').value.trim();
  const v=($('#isBy')||{}).value||'';
  if(v===IS_BY_LEGACY) return;               /* ใบเก่ายังไม่ได้เลือกใหม่ — คง byId/by เดิมไว้ */
  IS.byId=v; IS.by=v?empName(v):'';
}
function saveIssue(){
  if(!can('doc.docStock')) return toast('บัญชีนี้ไม่มีสิทธิออกใบเบิกของ');
  /* ใบที่ยกเลิกแล้วแก้ไม่ได้อีก — กันที่ฟังก์ชันบันทึกด้วย ไม่ใช่แค่ซ่อนปุ่ม
     เพราะฟอร์มอาจถูกเปิดค้างไว้ก่อนที่อีกหน้าจะกดยกเลิก */
  if(IS&&IS.cancelled) return toast('ใบเบิก '+IS.no+' ถูกยกเลิกแล้ว แก้ไขไม่ได้ — กด "สร้างใบใหม่" แทน');
  collectIssue();
  if(!isItemsClean(IS).length) return toast('กรอกรายการอะไหล่ที่เบิกอย่างน้อย 1 บรรทัด');
  if(!IS.by) return toast('เลือกพนักงานผู้เบิกก่อนบันทึก');
  if(isItemsClean(IS).some(x=>n(x.qty)<=0)) return toast('ระบุจำนวนของทุกรายการให้มากกว่า 0');
  if(!IS.no) IS.no=docNo('IS');
  if(IS.deducted){ const orig=DB.issues.find(x=>x.id===IS.id); if(orig) IS.items=JSON.parse(JSON.stringify(orig.items)); }
  const i=DB.issues.findIndex(x=>x.id===IS.id);
  stampRec(IS,i>=0?DB.issues[i]:null);
  const rec=JSON.parse(JSON.stringify(IS)); rec.items=isItemsClean(IS);
  if(i>=0) DB.issues[i]=rec; else DB.issues.push(rec);
  logAudit('issue',IS,'save',isItemsClean(IS).length+' รายการ · จำนวนรวม '+isItemsClean(IS).reduce((a,x)=>a+n(x.qty),0)+' ชิ้น');
  save(); $('#isNo').textContent=IS.no; refreshIssueRefs(); renderIssueList(); renderApvBars();
  saveFx('บันทึกเอกสารแล้ว',IS.no);
  toast('บันทึกใบเบิกของ '+IS.no+' แล้ว'+(IS.deducted?'':' · สินค้าจะถูกตัดสต๊อกเมื่อผู้มีสิทธิกดอนุมัติ'));
}
function postIssue(d){
  if(d.deducted) return;
  isItemsClean(d).forEach(it=>{
    const st=it.stockId?DB.stock.find(x=>x.id===it.stockId)
      :DB.stock.find(x=>x.code.toLowerCase()===String(it.code).toLowerCase());
    if(!st) return;
    st.qty=n(st.qty)-n(it.qty); st.lastMove=d.date;
    logMove(st.id,'out',n(it.qty),d.date,'เบิกใช้ภายใน'+(d.dept?' — '+d.dept:'')+(it.reason?' · '+it.reason:''),d.no);
  });
  d.deducted=true;
}
function openIssueById(id){
  const d=DB.issues.find(x=>x.id===id); if(!d) return;
  logAudit('issue',d,'open');
  IS=JSON.parse(JSON.stringify(d)); padISLines(); fillIssueForm(); openModal('mIssueEdit');
  go('stock'); stkGo('issue'); toast('เปิด '+d.no);
}
async function cancelIssue(id){
  await cancelStockDoc({
    kind:'issue', label:'ใบเบิก', flag:'deducted',
    undoText:'ใบนี้ตัดสต๊อกไปแล้ว ระบบจะคืนสต๊อกให้อัตโนมัติ',
    find:()=>DB.issues.find(x=>x.id===id),
    restore:d=>isItemsClean(d).forEach(it=>{ const st=stockOfLine(it);
      if(st){ st.qty=n(st.qty)+n(it.qty); st.lastMove=iso();
        logMove(st.id,'in',n(it.qty),iso(),'คืนสต๊อกจากการยกเลิกใบเบิกของภายใน',d.no); }}),
    render:()=>{ renderIssueList(); refreshIssueRefs(); },
    reopen:d=>{ if(IS&&IS.id===d.id) openIssueById(d.id); }
  });
}
function refreshIssueRefs(){
  const el=$('#isOpen'); if(!el) return;
  el.innerHTML='<option value="">— เปิดใบเบิกที่บันทึกไว้ —</option>'
    +DB.issues.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.no||'').localeCompare(String(a.no||'')))
      .map(d=>`<option value="${d.id}">${esc(d.no)} · ${esc(d.by||'-')}${d.cancelled?' · (ยกเลิกแล้ว)':''}</option>`).join('');
}
$('#isOpen').onchange=()=>{ const id=$('#isOpen').value; if(id) openIssueById(id); };
function renderIssueList(){
  let rows=DB.issues.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.no||'').localeCompare(String(a.no||'')));
  const qi=(($('#isuSearch')||{}).value||'').toLowerCase().trim();
  if(qi) rows=rows.filter(d=>[d.no,d.by,d.dept].some(s=>String(s||'').toLowerCase().includes(qi)));
  rows=applyDateFilter(rows,'isuDate');
  rows=sortRows('isTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'isu');
  $('#isTbl tbody').innerHTML=rows.map(d=>{
    const a=apvOf(d), items=isItemsClean(d);
    return `<tr class="click${d.cancelled?' cancelrow':''}" onclick="openIssueById('${d.id}')">
      <td class="mono" style="font-size:12px"><b>${esc(d.no||'(ไม่มีเลขที่)')}</b>
        ${d.cancelled?`<div><span class="chip r" title="${esc(d.cancelReason||'')}">ยกเลิกแล้ว</span></div>`:''}</td>
      <td class="ctr">${thDate(d.date)}</td>
      <td>${esc(d.by||'-')}</td>
      <td>${esc(d.dept||'-')}</td>
      <td class="num">${items.length}</td>
      <td class="num"><b>${qf(items.reduce((s,x)=>s+n(x.qty),0))}</b></td>
      <td class="ctr">${a.status==='approved'?'<span class="stbtn st-green">อนุมัติแล้ว</span>'
        :a.status==='rejected'?'<span class="stbtn st-red">ตีกลับ</span>'
        :'<span class="stbtn st-orange">รออนุมัติ</span>'}
        ${d.deducted?'':'<div class="hint">ยังไม่ตัดสต๊อก</div>'}</td>
      ${byCell(d)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px;width:106px">
        <button class="btn sm gh" onclick="openIssueById('${d.id}');event.stopPropagation()">เปิด</button>
        ${d.cancelled?'':`<button class="btn sm dgr pc-delDoc" onclick="cancelIssue('${d.id}');event.stopPropagation()">ยกเลิก</button>`}
      </div></td></tr>`}).join('');
  $('#isEmpty').style.display=rows.length?'none':'block';
  $('#isCount').textContent=cancelTag(rows);
  if(typeof paintSort==='function') paintSort('isTbl');
  if(typeof mkCards==='function') mkCards('isTbl');
}
function sheetIssue(d,copy){
  const its=isItemsClean(d);
  return sheetTop({title:'ใบเบิกของ (เบิกใช้ภายใน)',en:'INTERNAL STOCK ISSUE NOTE',copy:copy,
    stamp:d.cancelled?'ยกเลิกแล้ว':(isApproved(d)?'':'ยังไม่อนุมัติ'),
    fields:[['เลขที่',esc(d.no||'(ยังไม่บันทึก)')],['วันที่เบิก',thDate(d.date)],
      ['ผู้เบิก',esc(d.by||'-')],['แผนก / งานที่นำไปใช้',esc(d.dept||'-')]]})+`
  <table><tr><td><span class="lbl">สรุปรายการเบิก</span><br>
      จำนวนรายการ <b>${its.length}</b> รายการ<br>
      จำนวนรวม <b>${qf(its.reduce((a,x)=>a+n(x.qty),0))}</b> ชิ้น<br>
      ${d.deducted?'ตัดออกจากสต๊อกแล้ว':'ยังไม่ได้ตัดออกจากสต๊อก'}</td></tr></table>

  <table style="margin-top:6px"><thead><tr><th style="width:44px">ลำดับที่</th><th style="width:105px">รหัสสินค้า</th>
    <th>ชื่อสินค้า</th><th style="width:52px">จำนวน</th><th style="width:230px">เหตุผล / นำไปใช้งานใด</th></tr></thead><tbody>
    ${its.map((it,i)=>`<tr><td style="text-align:center">${i+1}</td><td>${esc(it.code||'-')}</td>
      <td>${esc(it.name)}</td><td style="text-align:center">${qf(it.qty)}</td>
      <td>${esc(it.reason||'-')}</td></tr>`).join('')}
    ${Array.from({length:Math.max(0,8-its.length)}).map((_,i)=>`<tr><td style="text-align:center;height:18px">${its.length+i+1}</td>
      <td></td><td></td><td></td><td></td></tr>`).join('')}
  </tbody></table>
  ${d.note?`<div class="box"><span class="lbl">หมายเหตุ</span> ${esc(d.note)}</div>`:''}
  <div class="sign">
    <div><div class="line"></div>( ${esc(d.by||'.'.repeat(26))} )<br><span class="lbl">ผู้เบิก</span><br>
      <span class="lbl">วันที่ ......../......../........</span></div>
    <div><div class="line"></div>( ${'.'.repeat(26)} )<br><span class="lbl">ผู้จ่ายของ</span><br>
      <span class="lbl">วันที่ ......../......../........</span></div>
    <div><div class="line"></div>( ${'.'.repeat(26)} )<br><span class="lbl">ผู้อนุมัติ</span><br>
      <span class="lbl">วันที่ ......../......../........</span></div>
  </div>${apvFoot(d)}</div>`;
}
function printIssue(){
  if(!IS) return;
  collectIssue();
  if(!IS.no) toast('แนะนำให้บันทึกก่อนพิมพ์ เพื่อให้มีเลขที่เอกสาร');
  logAudit('issue',IS,'print','ต้นฉบับ + สำเนา'); save();
  printDocs(sheetIssue(IS,'ต้นฉบับ')+sheetIssue(IS,'สำเนา'));
}

/* ==========================================================
   ตรวจนับสินค้า
   ========================================================== */
function newCount(silent){
  SC={id:uid(),no:'',date:iso(),by:'',catFilter:'',items:[],note:'',applied:false,
    apv:{status:'draft',byName:'',date:'',note:''}};
  fillCountForm(); if(silent) return; openModal('mCountEdit'); toast('เปิดใบตรวจนับใบใหม่');
}
function fillCountForm(){
  if(!SC) return;
  $('#scNo').textContent=SC.no||'ยังไม่มีเลขที่';
  $('#scDate').value=SC.date; scByFill(SC.by||''); $('#scNote').value=SC.note||'';
  $('#scCat').innerHTML='<option value="">— ทุกหมวด —</option>'+CATS.map(c=>`<option>${esc(c)}</option>`).join('');
  $('#scCat').value=SC.catFilter||'';
  refreshCountRefs(); renderCountItems(); renderApvBars();
}
/* เดิมดึงได้ทีละหมวดและทับรายการเก่าทั้งชุด — ตอนนี้ "เพิ่มต่อท้าย" แทน
   จึงผสมสินค้าหลายหมวดในใบเดียวได้ และตัวเลขที่นับไว้แล้วไม่หาย */
function pullCountItems(){
  if(SC.applied) return toast('ใบนี้ปรับยอดไปแล้ว ดึงรายการใหม่ไม่ได้');
  if(SC.cancelled) return toast('ใบนี้ถูกยกเลิกแล้ว แก้ไขไม่ได้');
  const cat=$('#scCat').value;
  const have=new Set((SC.items||[]).map(x=>x.stockId));
  const list=DB.stock.filter(s=>(!cat||(s.cat||'อื่น ๆ')===cat)&&!have.has(s.id));
  if(!list.length) return toast(cat?'สินค้าหมวดนี้อยู่ในรายการครบแล้ว หรือไม่มีสินค้าในหมวด':'สินค้าทุกตัวอยู่ในรายการแล้ว');
  SC.items=(SC.items||[]).concat(list.map(s=>({stockId:s.id,code:s.code,name:s.name,sysQty:n(s.qty),countedQty:n(s.qty)})));
  scSetFilterLabel(); renderCountItems();
  toast('เพิ่มมา '+list.length+' รายการ · รวมทั้งใบ '+SC.items.length+' รายการ');
}
/* เพิ่มทีละรายการจากช่องพิมพ์ — หารหัสตรงก่อน ไม่เจอค่อยเทียบชื่อ */
function addCountItem(){
  if(SC.applied) return toast('ใบนี้ปรับยอดไปแล้ว เพิ่มรายการไม่ได้');
  if(SC.cancelled) return toast('ใบนี้ถูกยกเลิกแล้ว แก้ไขไม่ได้');
  const el=$('#scAdd'), q=(el&&el.value||'').trim(); if(!q) return;
  const ql=q.toLowerCase();
  const s=DB.stock.find(x=>String(x.code||'').toLowerCase()===ql)
        ||DB.stock.find(x=>String(x.name||'').toLowerCase().includes(ql));
  if(!s) return toast('ไม่พบ "'+q+'" ในสต๊อก — พิมพ์รหัสหรือบางส่วนของชื่อสินค้า');
  SC.items=SC.items||[];
  if(SC.items.some(x=>x.stockId===s.id)){ el.value=''; return toast(s.code+' อยู่ในรายการแล้ว'); }
  SC.items.push({stockId:s.id,code:s.code,name:s.name,sysQty:n(s.qty),countedQty:n(s.qty)});
  el.value=''; el.focus();
  scSetFilterLabel(); renderCountItems();
  toast('เพิ่ม '+s.code+' · '+s.name);
}
function delCountItem(i){
  if(SC.applied) return toast('ใบนี้ปรับยอดไปแล้ว แก้รายการไม่ได้');
  if(SC.cancelled) return toast('ใบนี้ถูกยกเลิกแล้ว แก้ไขไม่ได้');
  (SC.items||[]).splice(i,1); scSetFilterLabel(); renderCountItems();
}
/* ป้าย "หมวดที่ตรวจ" ในทะเบียนคำนวณจากรายการจริง — หมวดเดียวขึ้นชื่อหมวด ผสมขึ้น "หลายหมวด" */
function scSetFilterLabel(){
  const cats=[...new Set((SC.items||[]).map(x=>{const st=DB.stock.find(s=>s.id===x.stockId);return (st&&st.cat)||'อื่น ๆ';}))];
  SC.catFilter=cats.length===0?'':cats.length===1?cats[0]:'หลายหมวด ('+cats.length+')';
}
function renderCountItems(){
  const lock=!!SC.applied||!!SC.cancelled, items=SC.items||[];
  $('#scItems tbody').innerHTML=items.length?items.map((it,i)=>{
    const diff=n(it.countedQty)-n(it.sysQty);
    return `<tr><td class="mono" style="font-size:12px">${esc(it.code)}</td><td>${esc(it.name)}</td>
      <td class="num">${qf(it.sysQty)}</td>
      <td class="num">${lock?n(it.countedQty):`<input type="number" class="sccnt" data-i="${i}" value="${it.countedQty}" style="text-align:right;width:80px">`}</td>
      <td class="num sccdiff" style="color:${diff===0?'inherit':(diff>0?'var(--ok)':'var(--danger)')}">${diff>0?'+':''}${diff}</td>
      <td class="ctr">${lock?'':`<button class="btn sm dgr" title="นำออกจากรายการ" onclick="delCountItem(${i})">×</button>`}</td></tr>`;
  }).join(''):'<tr><td colspan="6" class="empty">ยังไม่มีรายการ — ดึงทั้งหมวด หรือพิมพ์เพิ่มทีละรายการด้านบน</td></tr>';
  if(!lock){
    $$('.sccnt').forEach(el=>el.oninput=e=>{
      const i=+e.target.dataset.i; SC.items[i].countedQty=n(e.target.value);
      const diff=n(SC.items[i].countedQty)-n(SC.items[i].sysQty);
      const cell=e.target.closest('tr').querySelector('.sccdiff');
      cell.textContent=(diff>0?'+':'')+diff; cell.style.color=diff===0?'inherit':(diff>0?'var(--ok)':'var(--danger)');
      scLineInfo();
    });
  }
  scLineInfo();
}
function scLineInfo(){
  const li=$('#scLineInfo'); if(!li) return;
  const items=SC.items||[];
  if(!items.length){ li.textContent='ยังไม่มีรายการตรวจนับ — ดึงทั้งหมวดจากด้านบน หรือพิมพ์รหัสสินค้าเพิ่มทีละรายการ'; return; }
  const diffCount=items.filter(it=>n(it.countedQty)!==n(it.sysQty)).length;
  li.textContent=(SC.applied?'ใบนี้ปรับยอดสต๊อกแล้ว — ':'')+'ทั้งหมด '+items.length+' รายการ · พบผลต่าง '+diffCount+' รายการ';
}
function collectCount(){ scSetFilterLabel();
  SC.date=$('#scDate').value||iso(); SC.by=$('#scBy').value.trim(); SC.note=$('#scNote').value.trim();
}
function saveCount(){
  if(!can('doc.docStock')) return toast('บัญชีนี้ไม่มีสิทธิออกใบตรวจนับ');
  /* ใบที่ยกเลิกแล้วแก้ไม่ได้อีก — กันที่ฟังก์ชันบันทึกด้วย ไม่ใช่แค่ซ่อนปุ่ม
     เพราะฟอร์มอาจถูกเปิดค้างไว้ก่อนที่อีกหน้าจะกดยกเลิก */
  if(SC&&SC.cancelled) return toast('ใบตรวจนับ '+SC.no+' ถูกยกเลิกแล้ว แก้ไขไม่ได้ — กด "สร้างใบใหม่" แทน');
  collectCount();
  if(!SC.by) return toast('กรอกชื่อผู้ตรวจนับก่อนบันทึก');
  if(!(SC.items||[]).length) return toast('ดึงรายการสินค้ามาตรวจนับก่อนบันทึก');
  if(!SC.no) SC.no=docNo('SC');
  if(SC.applied){ const orig=DB.stockCounts.find(x=>x.id===SC.id); if(orig) SC.items=JSON.parse(JSON.stringify(orig.items)); }
  const i=DB.stockCounts.findIndex(x=>x.id===SC.id);
  stampRec(SC,i>=0?DB.stockCounts[i]:null);
  const rec=JSON.parse(JSON.stringify(SC));
  if(i>=0) DB.stockCounts[i]=rec; else DB.stockCounts.push(rec);
  logAudit('count',SC,'save',(SC.items||[]).length+' รายการ');
  save(); $('#scNo').textContent=SC.no; refreshCountRefs(); renderCountList(); renderApvBars();
  saveFx('บันทึกเอกสารแล้ว',SC.no);
  toast('บันทึกใบตรวจนับ '+SC.no+' แล้ว'+(SC.applied?'':' · สต๊อกจะถูกปรับยอดเมื่อผู้มีสิทธิกดอนุมัติ'));
}
function postCount(d){
  if(d.applied) return;
  (d.items||[]).forEach(it=>{
    const diff=n(it.countedQty)-n(it.sysQty); if(!diff) return;
    const st=DB.stock.find(x=>x.id===it.stockId); if(!st) return;
    st.qty=n(it.countedQty); st.lastMove=d.date;
    logMove(st.id,'adj',diff,d.date,'ปรับยอดจากตรวจนับสินค้า',d.no);
  });
  d.applied=true;
}
function openCountById(id){
  const d=DB.stockCounts.find(x=>x.id===id); if(!d) return;
  logAudit('count',d,'open');
  SC=JSON.parse(JSON.stringify(d)); fillCountForm(); openModal('mCountEdit');
  go('stock'); stkGo('count'); toast('เปิด '+d.no);
}
async function cancelCount(id){
  await cancelStockDoc({
    kind:'count', label:'ใบตรวจนับ', flag:'applied',
    undoText:'ใบนี้ปรับยอดสต๊อกไปแล้ว ระบบจะคืนยอดกลับไปเป็นก่อนตรวจนับ',
    find:()=>DB.stockCounts.find(x=>x.id===id),
    restore:d=>(d.items||[]).forEach(it=>{ const st=DB.stock.find(x=>x.id===it.stockId);
      if(st){ st.qty=n(it.sysQty); st.lastMove=iso();
        logMove(st.id,'adj',n(it.sysQty)-n(it.countedQty),iso(),'คืนยอดจากการยกเลิกใบตรวจนับสินค้า',d.no); }}),
    render:()=>{ renderCountList(); refreshCountRefs(); },
    reopen:d=>{ if(SC&&SC.id===d.id) openCountById(d.id); }
  });
}
function refreshCountRefs(){
  const el=$('#scOpen'); if(!el) return;
  el.innerHTML='<option value="">— เปิดใบตรวจนับที่บันทึกไว้ —</option>'
    +DB.stockCounts.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.no||'').localeCompare(String(a.no||'')))
      .map(d=>`<option value="${d.id}">${esc(d.no)} · ${esc(d.by||'-')}${d.cancelled?' · (ยกเลิกแล้ว)':''}</option>`).join('');
}
$('#scOpen').onchange=()=>{ const id=$('#scOpen').value; if(id) openCountById(id); };
/* หมวดที่ตรวจในทะเบียนคำนวณจากรายการจริงแล้ว (scSetFilterLabel) — dropdown เป็นแค่ตัวกรองตอนดึง */
/* เพิ่มสินค้าเข้าใบตรวจนับจากผลค้นหา — ยอดในระบบติดมาให้ นับได้จริงตั้งต้นเท่ายอดระบบ */
/* ผู้ตรวจนับเลือกจากพนักงานที่ยังปฏิบัติงานอยู่ — ใบเก่าที่ชื่อหลุดทะเบียนยังคงชื่อเดิมไว้ */
function scByFill(cur){
  const el=$('#scBy'); if(!el) return;
  const list=empActiveList();
  let h='<option value="">— เลือกผู้ตรวจนับ —</option>'
    +list.map(e=>`<option value="${esc(e.name)}">${esc(e.name)}${e.position?' · '+esc(e.position):''}</option>`).join('');
  if(cur&&!list.some(e=>e.name===cur)) h+=`<option value="${esc(cur)}">${esc(cur)} (พ้นสภาพ/นอกทะเบียน)</option>`;
  el.innerHTML=h; el.value=cur||'';
}
function scAddStock(st){
  if(!st) return;
  if(SC.applied) return toast('ใบนี้ปรับยอดไปแล้ว เพิ่มรายการไม่ได้');
  if(SC.cancelled) return toast('ใบนี้ถูกยกเลิกแล้ว แก้ไขไม่ได้');
  SC.items=SC.items||[];
  if(SC.items.some(x=>x.stockId===st.id)) return toast(st.code+' อยู่ในรายการตรวจนับแล้ว');
  SC.items.push({stockId:st.id,code:st.code,name:st.name,sysQty:n(st.qty),countedQty:n(st.qty)});
  scSetFilterLabel(); renderCountItems();
  toast('เพิ่ม '+st.code+' · '+st.name);
}
let SCKW={list:[],hl:0};
function scKwRender(){
  const box=$('#scKwList'), q=($('#scKw').value||'').trim();
  if(!box) return;
  if(!q){ box.style.display='none'; SCKW={list:[],hl:0}; return; }
  const list=grKwMatches(q);
  SCKW={list:list,hl:list.length?0:-1};
  box.innerHTML=list.length?list.map((st,gi)=>`<div class="grpick-it${gi===0?' hl':''}" data-gi="${gi}" onmousedown="scPickKw('${st.id}')">
      <span class="nm"><b class="mono" style="font-size:12.5px">${esc(st.code)}</b> · ${esc(st.name)}</span>
      <span class="sub">คงเหลือ ${qf(st.qty)}</span></div>`).join('')
    :'<div class="grpick-emp">ไม่พบ — ลองคำอื่น หรือใช้ "ค้นหาละเอียด"</div>';
  box.style.display='';
}
function scPickKw(id){ const st=DB.stock.find(x=>x.id===id);
  $('#scKw').value=''; $('#scKwList').style.display='none';
  scAddStock(st); $('#scKw').focus(); }
if($('#scKw')){ const t=$('#scKw');
  t.oninput=scKwRender;
  t.onkeydown=e=>{
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault();
      if(!SCKW.list.length) return;
      SCKW.hl=(SCKW.hl+(e.key==='ArrowDown'?1:-1)+SCKW.list.length)%SCKW.list.length;
      $$('#scKwList .grpick-it').forEach(el=>{ const on=+el.dataset.gi===SCKW.hl;
        el.classList.toggle('hl',on); if(on) el.scrollIntoView({block:'nearest'}); });
      return; }
    if(e.key==='Enter'){ e.preventDefault();
      if(SCKW.list.length&&SCKW.hl>=0) scPickKw(SCKW.list[SCKW.hl].id); return; }
    if(e.key==='Escape'){ const b=$('#scKwList'); if(b) b.style.display='none'; } };
  t.onblur=()=>setTimeout(()=>{ const b=$('#scKwList'); if(b) b.style.display='none'; },200);
}
function renderCountList(){
  let rows=DB.stockCounts.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.no||'').localeCompare(String(a.no||'')));
  const qs=(($('#scnSearch')||{}).value||'').toLowerCase().trim();
  if(qs) rows=rows.filter(d=>[d.no,d.by].some(s=>String(s||'').toLowerCase().includes(qs)));
  rows=applyDateFilter(rows,'scnDate');
  rows=sortRows('scTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'scn');
  $('#scTbl tbody').innerHTML=rows.map(d=>{
    const a=apvOf(d), items=d.items||[], diffCount=items.filter(it=>n(it.countedQty)!==n(it.sysQty)).length;
    return `<tr class="click${d.cancelled?' cancelrow':''}" onclick="openCountById('${d.id}')">
      <td class="mono" style="font-size:12px"><b>${esc(d.no||'(ไม่มีเลขที่)')}</b>
        ${d.cancelled?`<div><span class="chip r" title="${esc(d.cancelReason||'')}">ยกเลิกแล้ว</span></div>`:''}</td>
      <td class="ctr">${thDate(d.date)}</td>
      <td>${esc(d.by||'-')}</td>
      <td>${esc(d.catFilter||'ทุกหมวด')}</td>
      <td class="num">${items.length}</td>
      <td class="num"><b>${diffCount}</b></td>
      <td class="ctr">${a.status==='approved'?'<span class="stbtn st-green">อนุมัติแล้ว</span>'
        :a.status==='rejected'?'<span class="stbtn st-red">ตีกลับ</span>'
        :'<span class="stbtn st-orange">รออนุมัติ</span>'}
        ${d.applied?'':'<div class="hint">ยังไม่ปรับยอด</div>'}</td>
      ${byCell(d)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px;width:106px">
        <button class="btn sm gh" onclick="openCountById('${d.id}');event.stopPropagation()">เปิด</button>
        ${d.cancelled?'':`<button class="btn sm dgr pc-delDoc" onclick="cancelCount('${d.id}');event.stopPropagation()">ยกเลิก</button>`}
      </div></td></tr>`}).join('');
  $('#scEmpty').style.display=rows.length?'none':'block';
  $('#scCount').textContent=cancelTag(rows);
  if(typeof paintSort==='function') paintSort('scTbl');
  if(typeof mkCards==='function') mkCards('scTbl');
}
function sheetCount(d,copy){
  const items=d.items||[], diffs=items.filter(it=>n(it.countedQty)!==n(it.sysQty));
  return sheetTop({title:'ใบตรวจนับสินค้า',en:'STOCK COUNT ADJUSTMENT NOTE',copy:copy,
    stamp:d.cancelled?'ยกเลิกแล้ว':(isApproved(d)?'':'ยังไม่อนุมัติ'),
    fields:[['เลขที่',esc(d.no||'(ยังไม่บันทึก)')],['วันที่ตรวจนับ',thDate(d.date)],
      ['ผู้ตรวจนับ',esc(d.by||'-')],['หมวดที่ตรวจ',esc(d.catFilter||'ทุกหมวด')]]})+`
  <table><tr><td><span class="lbl">สรุปผลการตรวจนับ</span><br>
      จำนวนรายการที่ตรวจ <b>${items.length}</b> รายการ<br>
      พบผลต่าง <b>${diffs.length}</b> รายการ<br>
      ${d.applied?'ปรับยอดสต๊อกแล้ว':'ยังไม่ได้ปรับยอดสต๊อก'}</td></tr></table>

  <table style="margin-top:6px"><thead><tr><th style="width:105px">รหัสสินค้า</th>
    <th>ชื่อสินค้า</th><th style="width:80px">ยอดในระบบ</th><th style="width:80px">นับได้จริง</th><th style="width:70px">ผลต่าง</th></tr></thead><tbody>
    ${items.map(it=>{const diff=n(it.countedQty)-n(it.sysQty); return `<tr><td>${esc(it.code||'-')}</td>
      <td>${esc(it.name)}</td><td style="text-align:center">${qf(it.sysQty)}</td>
      <td style="text-align:center">${qf(it.countedQty)}</td><td style="text-align:center">${diff>0?'+':''}${diff}</td></tr>`}).join('')}
  </tbody></table>
  ${d.note?`<div class="box"><span class="lbl">หมายเหตุ</span> ${esc(d.note)}</div>`:''}
  <div class="sign">
    <div><div class="line"></div>( ${esc(d.by||'.'.repeat(26))} )<br><span class="lbl">ผู้ตรวจนับ</span><br>
      <span class="lbl">วันที่ ......../......../........</span></div>
    <div><div class="line"></div>( ${'.'.repeat(26)} )<br><span class="lbl">ผู้อนุมัติ</span><br>
      <span class="lbl">วันที่ ......../......../........</span></div>
  </div>${apvFoot(d)}</div>`;
}
function printCount(){
  if(!SC) return;
  collectCount();
  if(!SC.no) toast('แนะนำให้บันทึกก่อนพิมพ์ เพื่อให้มีเลขที่เอกสาร');
  logAudit('count',SC,'print','ต้นฉบับ'); save();
  printDocs(sheetCount(SC,'ต้นฉบับ'));
}


/* ==========================================================
   งานบุคคล — บันทึกการทำงาน การลา ปริมาณงาน และใบเตือน
   ========================================================== */
const HR_TYPES=[
  ['late','มาสาย','นาที','นาทีที่สาย','-'],
  ['absent','ขาดงานไม่ลา','วัน','จำนวนวัน','-'],
  ['sick','ลาป่วย','วัน','จำนวนวัน','ok'],
  ['personal','ลากิจ','วัน','จำนวนวัน','wait'],
  ['vacation','ลาพักร้อน','วัน','จำนวนวัน','wait'],
  ['maternity','ลาคลอด','วัน','จำนวนวัน','ok'],
  ['military','ลารับราชการทหาร','วัน','จำนวนวัน','ok'],
  ['training','ลาเพื่อฝึกอบรม','วัน','จำนวนวัน','wait'],
  ['ot','ทำงานล่วงเวลา','ชั่วโมง','จำนวนชั่วโมง','ok'],
  ['leave_early','ออกก่อนเวลา','นาที','นาทีที่ออกก่อน','-']
];
const HR_LABEL=Object.fromEntries(HR_TYPES.map(t=>[t[0],t[1]]));
const HR_UNIT=Object.fromEntries(HR_TYPES.map(t=>[t[0],t[2]]));
/* สิทธิการลาขั้นต่ำตามกฎหมายคุ้มครองแรงงาน (ใช้เป็นค่าอ้างอิง) */
const LEAVE_QUOTA={sick:30,personal:3,vacation:6};
const HR_STAT={ok:['อนุมัติแล้ว','st-green'],wait:['รออนุมัติ','st-orange'],no:['ไม่อนุมัติ','st-red'],'-':['ไม่ต้องอนุมัติ','st-grey']};
let hrPane='sum', editHrId=null, WN=null;

function hrMonth(){ if(!$('#hrMonth').value) $('#hrMonth').value=iso().slice(0,7); return $('#hrMonth').value; }
$('#hrTabs').addEventListener('click',e=>{const b=e.target.closest('button'); if(b){ go('hr'); hrGo(b.dataset.h); }});
function hrGo(v){
  hrPane=v;
  $$('#hrTabs button').forEach(x=>x.classList.toggle('on',x.dataset.h===v));
  $$('.hpane').forEach(p=>p.style.display=(p.id==='h-'+v)?'':'none');
  renderHr();
}
$('#hrMonth').onchange=renderHr;
function renderHr(){
  hrMonth();
  if(hrPane==='sum') return renderHrSum();
  if(hrPane==='rec') return renderHrRec();
  if(hrPane==='load') return renderWorkload();
  if(hrPane==='warn') return renderWarnList();
}
/* ---------- สรุปรายเดือน ---------- */
function hrRows(mo){ return (DB.hr||[]).filter(x=>!mo||ym(x.date)===mo); }
function hrStat(empId,mo){
  let rows=hrRows(mo).filter(x=>x.emp===empId);
  const sum=t=>rows.filter(x=>x.type===t).reduce((a,x)=>a+n(x.qty),0);
  const cnt=t=>rows.filter(x=>x.type===t).length;
  return {lateCnt:cnt('late'),lateMin:sum('late'),absent:sum('absent'),sick:sum('sick'),
    personal:sum('personal'),vacation:sum('vacation'),ot:sum('ot'),early:cnt('leave_early'),rows};
}
function workOf(empId,mo,scope){
  const inScope=d=>{ if(scope==='all') return true;
    if(scope==='year') return String(d).slice(0,4)===String((mo||iso()).slice(0,4));
    return ym(d)===mo; };
  const qs=DB.quotes.filter(q=>q.tech===empId&&!q.cancelled&&inScope(q.date));
  /* งานจากใบที่ยกเลิกไม่ใช่ผลงานจริง — ไม่นับ (ตัวเลขนี้ใช้พิจารณาโบนัส) */
  const r1=DB.receipts.filter(r=>r.tech1===empId&&!r.cancelled&&inScope(r.date));
  const r2=DB.receipts.filter(r=>r.tech2===empId&&!r.cancelled&&inScope(r.date));
  const val=r1.reduce((a,r)=>a+receiptTotals(r).base,0)+r2.reduce((a,r)=>a+receiptTotals(r).base,0)/2;
  return {quotes:qs.length,main:r1.length,help:r2.length,jobs:r1.length+r2.length,value:val};
}
function warnCount(empId,mo){ return (DB.warns||[]).filter(w=>w.emp===empId&&(!mo||ym(w.date)===mo)).length; }
function renderHrSum(){
  const mo=hrMonth();
  $('#hrMonthLabel').textContent=TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543);
  const rows=DB.emp.map(e=>({e,s:hrStat(e.id,mo),w:workOf(e.id,mo,'month'),wn:warnCount(e.id,mo)}));
  $('#hrTbl tbody').innerHTML=rows.map(r=>{
    const bad=r.s.absent>0||r.s.lateCnt>=3||r.wn>0;
    return `<tr class="click" onclick="openHr(null,'${r.e.id}')">
      <td><b>${esc(r.e.name)}</b><div class="hint mono">${esc(r.e.code)}</div></td>
      <td>${esc(r.e.position||'-')}</td>
      <td class="num">${r.s.lateCnt||'-'}</td><td class="num">${r.s.lateMin?money0(r.s.lateMin):'-'}</td>
      <td class="num" style="${r.s.absent?'color:var(--danger);font-weight:600':''}">${r.s.absent||'-'}</td>
      <td class="num">${r.s.sick||'-'}</td><td class="num">${r.s.personal||'-'}</td><td class="num">${r.s.vacation||'-'}</td>
      <td class="num"><b>${r.w.jobs||'-'}</b>${r.w.value?`<div class="hint">${money0(r.w.value)} บาท</div>`:''}</td>
      <td class="ctr">${r.wn?`<span class="stbtn st-red">${r.wn} ใบ</span>`:'<span class="hint">-</span>'}</td>
      <td class="ctr">${bad?'<span class="stbtn st-orange">ต้องติดตาม</span>':'<span class="stbtn st-green">ปกติ</span>'}</td></tr>`}).join('');
  const t=rows.reduce((a,r)=>({late:a.late+r.s.lateCnt,min:a.min+r.s.lateMin,ab:a.ab+r.s.absent,
    sick:a.sick+r.s.sick,per:a.per+r.s.personal,vac:a.vac+r.s.vacation,jobs:a.jobs+r.w.jobs,wn:a.wn+r.wn}),
    {late:0,min:0,ab:0,sick:0,per:0,vac:0,jobs:0,wn:0});
  $('#hrTbl tfoot').innerHTML=`<tr><td colspan="2">รวม ${rows.length} คน</td><td class="num">${t.late}</td>
    <td class="num">${money0(t.min)}</td><td class="num">${t.ab}</td><td class="num">${t.sick}</td>
    <td class="num">${t.per}</td><td class="num">${t.vac}</td><td class="num">${t.jobs}</td>
    <td class="ctr">${t.wn}</td><td></td></tr>`;
  $('#hrEmpty').style.display=rows.length?'none':'block';
  $('#hrCount').textContent=rows.length+' คน';
  const days=hrRows(mo).length;
  $('#hrCards').innerHTML=[
    ['พนักงานทั้งหมด',rows.length+' คน','บันทึกในงวดนี้ '+days+' รายการ',''],
    ['มาสายรวม',t.late+' ครั้ง','รวม '+money0(t.min)+' นาที','amber'],
    ['ขาดงานไม่ลา',t.ab+' วัน','ลาป่วย '+t.sick+' · ลากิจ '+t.per+' · พักร้อน '+t.vac,'red'],
    ['งานซ่อมที่ปิดได้',t.jobs+' งาน','ใบเตือนที่ออกในงวดนี้ '+t.wn+' ใบ','green']
  ].map(([k,v,s2,c])=>`<div class="card ${c}"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div>
    <div class="s">${esc(s2)}</div></div>`).join('');
}
/* ---------- บันทึกการทำงาน ---------- */
function openHr(id,presetEmp){
  if(!can('doc.hrEdit')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกงานบุคคล');
  editHrId=id||null; const x=id?(DB.hr||[]).find(h=>h.id===id):null;
  $('#mHrTitle').textContent=x?'แก้ไขบันทึกงานบุคคล':'บันทึกการทำงานและการลา';
  empSel('hEmp',x?x.emp:(presetEmp||''),'— เลือกพนักงาน —');
  $('#hType').innerHTML=HR_TYPES.map(([k,l])=>`<option value="${k}">${l}</option>`).join('');
  const d=Object.assign({type:'late',date:iso(),qty:1,end:'',stat:'-',note:'',by:meName()},x||{});
  $('#hType').value=d.type; $('#hDate').value=d.date; $('#hQty').value=d.qty;
  $('#hEnd').value=d.end||''; $('#hStat').value=d.stat; $('#hNote').value=d.note; $('#hBy').value=d.by;
  hrTypeChange(!x); openModal('mHr');
}
function hrTypeChange(setDefault){
  const t=HR_TYPES.find(x=>x[0]===$('#hType').value)||HR_TYPES[0];
  $('#hQtyLabel').textContent=t[3];
  if(setDefault){ $('#hStat').value=t[4]; $('#hQty').value=(t[0]==='late'||t[0]==='leave_early')?15:1; }
  const emp=$('#hEmp').value, q=LEAVE_QUOTA[$('#hType').value];
  if(q&&emp){
    const used=(DB.hr||[]).filter(h=>h.emp===emp&&h.type===$('#hType').value
      &&String(h.date).slice(0,4)===String($('#hDate').value||iso()).slice(0,4)&&h.stat!=='no')
      .reduce((a,h)=>a+n(h.qty),0);
    $('#hHint').textContent='ปีนี้ใช้สิทธิ '+HR_LABEL[$('#hType').value]+' ไปแล้ว '+used+' วัน · สิทธิขั้นต่ำตามกฎหมาย '+q+' วันต่อปี (นโยบายบริษัทอาจให้มากกว่านี้)';
  } else $('#hHint').textContent='';
}
$('#hEmp')&&($('#hEmp').onchange=()=>hrTypeChange(false));
function saveHr(){
  if(!can('doc.hrEdit')) return toast('บัญชีนี้ไม่มีสิทธิบันทึกงานบุคคล');
  const emp=$('#hEmp').value; if(!emp) return toast('เลือกพนักงานก่อนบันทึก');
  if(n($('#hQty').value)<=0) return toast('ระบุจำนวนให้มากกว่า 0');
  const rec={id:editHrId||uid(),emp,type:$('#hType').value,date:$('#hDate').value||iso(),
    qty:n($('#hQty').value),end:$('#hEnd').value,stat:$('#hStat').value,
    note:$('#hNote').value.trim(),by:$('#hBy').value.trim()};
  DB.hr=DB.hr||[];
  stampRec(rec,editHrId?DB.hr.find(h=>h.id===editHrId):null);
  if(editHrId){const i=DB.hr.findIndex(h=>h.id===editHrId);DB.hr[i]=rec} else DB.hr.push(rec);
  logAudit('hr',{id:rec.id,no:HR_LABEL[rec.type]},'save',empName(emp)+' · '+HR_LABEL[rec.type]+' '+rec.qty+' '+HR_UNIT[rec.type]);
  save(); closeModal('mHr'); renderHr(); toast('บันทึกรายการงานบุคคลแล้ว');
}
async function delHr(id){
  if(!can('doc.hrEdit')) return toast('บัญชีนี้ไม่มีสิทธิลบบันทึกงานบุคคล');
  const x=(DB.hr||[]).find(h=>h.id===id); if(!x) return;
  if(!await askP({title:'ลบบันทึก',text:'ลบบันทึกนี้?',yes:'ลบ',no:'ไม่ลบ'})) return;
  DB.hr=DB.hr.filter(h=>h.id!==id); save(); renderHr(); toast('ลบแล้ว');
}
function renderHrRec(){
  const mo=hrMonth();
  if($('#recType').options.length<2)
    $('#recType').innerHTML='<option value="">ทุกประเภท</option>'+HR_TYPES.map(([k,l])=>`<option value="${k}">${l}</option>`).join('');
  if($('#recEmp').options.length<2) empSel('recEmp','','พนักงานทุกคน');
  const fe=$('#recEmp').value, ft=$('#recType').value;
  let rows=hrRows(mo).filter(x=>(!fe||x.emp===fe)&&(!ft||x.type===ft))
    .sort((a,b)=>b.date.localeCompare(a.date));
  rows=sortRows('recTbl',rows);   /* ⚠️ ต้องเรียงก่อนตัดแถว */
  rows=limitRows(rows,'rec');
  $('#recTbl tbody').innerHTML=rows.map(x=>{const st=HR_STAT[x.stat]||HR_STAT['-'];
    return `<tr><td class="ctr">${thDate(x.date)}${x.end?`<div class="hint">ถึง ${thDate(x.end)}</div>`:''}</td>
      <td>${esc(empName(x.emp))}</td><td>${esc(HR_LABEL[x.type]||x.type)}</td>
      <td class="num"><b>${qf(x.qty)}</b> <span class="hint">${esc(HR_UNIT[x.type]||'')}</span></td>
      <td>${esc(x.note||'-')}</td>
      <td class="ctr"><span class="stbtn ${st[1]}">${st[0]}</span></td>
      <td style="font-size:12px">${esc(x.by||'-')}</td>
      ${byCell(x)}
      <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
        <button class="btn sm gh pc-hrEdit" onclick="openHr('${x.id}')">แก้ไข</button>
        <button class="btn sm dgr" onclick="delHr('${x.id}')">ลบ</button></div></td></tr>`}).join('');
  $('#recEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('recTbl');
  $('#recCount').textContent=rows.length+' รายการ';
}
$('#recEmp')&&($('#recEmp').onchange=renderHrRec);
$('#recType')&&($('#recType').onchange=renderHrRec);
/* ---------- ปริมาณงานซ่อม ---------- */
function renderWorkload(){
  const mo=hrMonth(), scope=$('#loadScope').value;
  const rows=DB.emp.map(e=>({e,w:workOf(e.id,mo,scope)})).filter(r=>r.w.jobs||r.w.quotes);
  const mx=Math.max(1,...rows.map(r=>r.w.jobs));
  const tot=rows.reduce((a,r)=>a+r.w.jobs,0);
  $('#loadTag').textContent=scope==='month'?('งวด '+TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543))
    :scope==='year'?('ปี '+(+mo.slice(0,4)+543)):'ทั้งหมด';
  $('#loadTbl tbody').innerHTML=rows.sort((a,b)=>b.w.jobs-a.w.jobs).map(r=>`<tr>
    <td><b>${esc(r.e.name)}</b><div class="hint mono">${esc(r.e.code)}</div></td>
    <td>${esc(r.e.position||'-')}</td>
    <td class="num">${r.w.quotes||'-'}</td><td class="num">${r.w.main||'-'}</td>
    <td class="num">${r.w.help||'-'}</td><td class="num"><b>${r.w.jobs}</b></td>
    <td class="num">${money(r.w.value)}</td>
    <td><div class="mbar"><i style="width:${Math.round(r.w.jobs/mx*100)}%"></i></div>
      <div class="hint mono">${tot?(r.w.jobs/tot*100).toFixed(1):'0.0'}%</div></td></tr>`).join('');
  $('#loadTbl tfoot').innerHTML=`<tr><td colspan="2">รวม ${rows.length} คน</td>
    <td class="num">${rows.reduce((a,r)=>a+r.w.quotes,0)}</td><td class="num">${rows.reduce((a,r)=>a+r.w.main,0)}</td>
    <td class="num">${rows.reduce((a,r)=>a+r.w.help,0)}</td><td class="num"><b>${tot}</b></td>
    <td class="num"><b>${money(rows.reduce((a,r)=>a+r.w.value,0))}</b></td><td></td></tr>`;
  $('#loadEmpty').style.display=rows.length?'none':'block';
}
$('#loadScope')&&($('#loadScope').onchange=renderWorkload);
/* ---------- ใบเตือน ---------- */
function blankWarn(){ return {id:uid(),no:'',emp:'',date:iso(),when:iso(),times:'1',topic:'มาทำงานสาย',
  rule:'',detail:'',action:'ตักเตือนเป็นลายลักษณ์อักษร',
  warnTxt:'หากกระทำผิดซ้ำในลักษณะเดียวกันภายใน 1 ปี บริษัทอาจพิจารณาลงโทษสถานหนักขึ้นหรือเลิกจ้างโดยไม่จ่ายค่าชดเชย',
  by:'',hr:'',witness:''}; }
function newWarn(){ WN=blankWarn(); fillWarnForm(); toast('เริ่มใบเตือนใหม่'); }
function fillWarnForm(){
  if(!WN) WN=blankWarn();
  empSel('wnEmp',WN.emp,'— เลือกพนักงาน —');
  $('#wnNo').textContent=WN.no||'ยังไม่มีเลขที่';
  $('#wnDate').value=WN.date; $('#wnWhen').value=WN.when; $('#wnTimes').value=WN.times;
  $('#wnTopic').value=WN.topic; $('#wnRule').value=WN.rule; $('#wnDetail').value=WN.detail;
  $('#wnAction').value=WN.action; $('#wnWarnTxt').value=WN.warnTxt;
  $('#wnBy').value=WN.by; $('#wnHr').value=WN.hr; $('#wnWitness').value=WN.witness;
  refreshWarnRefs();
}
function readWarn(){
  WN.emp=$('#wnEmp').value; WN.date=$('#wnDate').value||iso(); WN.when=$('#wnWhen').value;
  WN.times=$('#wnTimes').value; WN.topic=$('#wnTopic').value; WN.rule=$('#wnRule').value.trim();
  WN.detail=$('#wnDetail').value.trim(); WN.action=$('#wnAction').value; WN.warnTxt=$('#wnWarnTxt').value.trim();
  WN.by=$('#wnBy').value.trim(); WN.hr=$('#wnHr').value.trim(); WN.witness=$('#wnWitness').value.trim();
}
function saveWarn(){
  if(!can('doc.hrEdit')) return toast('บัญชีนี้ไม่มีสิทธิออกใบเตือน');
  readWarn();
  if(!WN.emp) return toast('เลือกพนักงานที่ถูกตักเตือนก่อนบันทึก');
  if(!WN.detail) return toast('กรอกรายละเอียดการกระทำผิดก่อนบันทึก');
  if(!WN.no) WN.no=docNo('WN');
  DB.warns=DB.warns||[];
  const i=DB.warns.findIndex(x=>x.id===WN.id);
  stampRec(WN,i>=0?DB.warns[i]:null);
  if(i>=0) DB.warns[i]=JSON.parse(JSON.stringify(WN)); else DB.warns.push(JSON.parse(JSON.stringify(WN)));
  logAudit('warn',WN,'save',empName(WN.emp)+' · ครั้งที่ '+WN.times+' · '+WN.topic);
  save(); fillWarnForm(); renderWarnList(); renderHr();
  toast('บันทึกใบเตือน '+WN.no+' แล้ว');
}
function openWarnById(id){
  const w=(DB.warns||[]).find(x=>x.id===id); if(!w) return;
  WN=JSON.parse(JSON.stringify(w)); logAudit('warn',w,'open');
  go('hr'); hrGo('warn'); fillWarnForm(); toast('เปิดใบเตือน '+w.no);
}
async function delWarn(id){
  if(!can('doc.hrEdit')) return toast('บัญชีนี้ไม่มีสิทธิลบใบเตือน');
  const w=(DB.warns||[]).find(x=>x.id===id); if(!w) return;
  if(!await askP({title:'ลบใบเตือน',text:'ลบใบเตือน '+w.no+' ?',yes:'ลบ',no:'ไม่ลบ'})) return;
  logAudit('warn',w,'del'); DB.warns=DB.warns.filter(x=>x.id!==id);
  save(); renderWarnList(); toast('ลบแล้ว');
}
function refreshWarnRefs(){
  const el=$('#wnOpen'); if(!el) return;
  el.innerHTML='<option value="">— เปิดใบเตือนที่บันทึกไว้ —</option>'
    +(DB.warns||[]).slice().sort((a,b)=>b.date.localeCompare(a.date))
      .map(w=>`<option value="${w.id}">${esc(w.no)} · ${esc(empName(w.emp))} · ${esc(w.topic)}</option>`).join('');
  el.value='';
}
$('#wnOpen')&&($('#wnOpen').onchange=()=>{ if($('#wnOpen').value) openWarnById($('#wnOpen').value); });
function renderWarnList(){
  if(!WN) { WN=blankWarn(); fillWarnForm(); }
  let rows=(DB.warns||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
  rows=sortRows('wnTbl',rows);   /* กดหัวคอลัมน์เพื่อเรียง */
  $('#wnTbl tbody').innerHTML=rows.map(w=>`<tr class="click" onclick="openWarnById('${w.id}')">
    <td class="mono" style="font-size:12px"><b>${esc(w.no)}</b></td><td class="ctr">${thDate(w.date)}</td>
    <td>${esc(empName(w.emp))}</td>
    <td class="ctr"><span class="stbtn ${w.times==='3'?'st-red':w.times==='2'?'st-orange':'st-grey'}">ครั้งที่ ${esc(w.times)}</span></td>
    <td>${esc(w.topic)}${w.detail?`<div class="hint">${esc(w.detail.slice(0,60))}</div>`:''}</td>
    <td style="font-size:12px">${esc(w.action)}</td>
    ${byCell(w)}
    <td class="ctr"><div style="display:inline-flex;flex-direction:column;align-items:stretch;gap:4px">
      <button class="btn sm gh" onclick="openWarnById('${w.id}');event.stopPropagation()">เปิด</button>
      <button class="btn sm dgr" onclick="delWarn('${w.id}');event.stopPropagation()">ลบ</button></div></td></tr>`).join('');
  $('#wnEmpty').style.display=rows.length?'none':'block';
  if(typeof paintSort==='function') paintSort('wnTbl');
  $('#wnCount').textContent=rows.length+' ใบ';
  refreshWarnRefs();
}
/* ---------- เอกสารที่พิมพ์ ---------- */
function printWarn(){
  readWarn();
  if(!WN.emp) return toast('เลือกพนักงานก่อนพิมพ์');
  const e=DB.emp.find(x=>x.id===WN.emp)||{};
  logAudit('warn',WN,'print'); save();
  const sheet=copy=>sheetTop({title:'หนังสือเตือนพนักงาน',en:'EMPLOYEE WARNING LETTER',copy:copy,
    fields:[['เลขที่',esc(WN.no||'(ยังไม่บันทึก)')],['วันที่ออกหนังสือ',thDate(WN.date)],
      ['ครั้งที่',esc(WN.times)],['วันที่กระทำผิด',thDate(WN.when)]]})+`
    <table><tr><td style="width:50%;vertical-align:top"><span class="lbl">เรียน</span><br>
      <b>${esc(e.name||'-')}</b><br>ตำแหน่ง ${esc(e.position||'-')} · รหัสพนักงาน ${esc(e.code||'-')}<br>
      วันที่เริ่มงาน ${thDate(e.start)}</td>
      <td style="vertical-align:top"><span class="lbl">เรื่อง</span><br><b>${esc(WN.topic)}</b><br>
      ${WN.rule?'ระเบียบที่ฝ่าฝืน: '+esc(WN.rule):''}</td></tr></table>
    <div class="box"><span class="lbl">รายละเอียดการกระทำผิด</span><br>${esc(WN.detail||'-')}</div>
    <div class="box"><span class="lbl">มาตรการ / บทลงโทษ</span><br>${esc(WN.action)}</div>
    <div class="box"><span class="lbl">คำเตือน</span><br>${esc(WN.warnTxt)}</div>
    <div class="note">หนังสือฉบับนี้จัดทำขึ้นเพื่อเป็นการตักเตือนตามระเบียบข้อบังคับเกี่ยวกับการทำงาน
      และเก็บไว้เป็นหลักฐานในแฟ้มประวัติพนักงาน · ต้นฉบับมอบให้พนักงาน สำเนาเก็บที่ฝ่ายบุคคล</div>
    <div class="sign">
      <div><div class="line"></div>( ${esc(WN.by||'.................................................')} )<br>
        <span class="lbl">ผู้ออกหนังสือเตือน (ผู้บังคับบัญชา)</span><br><span class="lbl">วันที่ ......../......../........</span></div>
      <div><div class="line"></div>( ${esc(WN.hr||'.................................................')} )<br>
        <span class="lbl">ฝ่ายบุคคล / ผู้จัดการ</span><br><span class="lbl">วันที่ ......../......../........</span></div>
      <div><div class="line"></div>( ${esc(e.name||'.................................................')} )<br>
        <span class="lbl">พนักงานผู้รับทราบ</span><br><span class="lbl">วันที่ ......../......../........</span></div>
      <div><div class="line"></div>( ${esc(WN.witness||'.................................................')} )<br>
        <span class="lbl">พยาน</span><br><span class="lbl">วันที่ ......../......../........</span></div>
    </div></div>`;
  printDocs(sheet('ต้นฉบับ (พนักงาน)')+sheet('สำเนา (ฝ่ายบุคคล)'));
}
function printHrSummary(){
  const mo=hrMonth(), lbl=TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543);
  const rows=DB.emp.map(e=>({e,s:hrStat(e.id,mo),w:workOf(e.id,mo,'month'),wn:warnCount(e.id,mo)}));
  printDocs(sheetTop({title:'รายงานสรุปการทำงานของพนักงาน',en:'MONTHLY ATTENDANCE REPORT',copy:'เอกสารภายใน',
    fields:[['งวดเดือน',lbl],['จำนวนพนักงาน',rows.length+' คน'],['วันที่พิมพ์',thDate(iso())]]})+`
    <table><thead><tr><th style="width:70px">รหัส</th><th>ชื่อ - นามสกุล</th><th style="width:92px">ตำแหน่ง</th>
      <th style="width:52px">มาสาย</th><th style="width:56px">นาทีสาย</th><th style="width:52px">ขาดงาน</th>
      <th style="width:48px">ลาป่วย</th><th style="width:48px">ลากิจ</th><th style="width:56px">พักร้อน</th>
      <th style="width:52px">งานซ่อม</th><th style="width:52px">ใบเตือน</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>${esc(r.e.code)}</td><td>${esc(r.e.name)}</td><td>${esc(r.e.position||'-')}</td>
        <td style="text-align:center">${r.s.lateCnt||'-'}</td><td style="text-align:center">${r.s.lateMin||'-'}</td>
        <td style="text-align:center">${r.s.absent||'-'}</td><td style="text-align:center">${r.s.sick||'-'}</td>
        <td style="text-align:center">${r.s.personal||'-'}</td><td style="text-align:center">${r.s.vacation||'-'}</td>
        <td style="text-align:center">${r.w.jobs||'-'}</td><td style="text-align:center">${r.wn||'-'}</td></tr>`).join('')}
      </tbody></table>
    <div class="note">รายงานนี้ใช้ประกอบการพิจารณาเงินเดือน โบนัส และการประเมินผลการปฏิบัติงาน</div>
    <div class="sign"><div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้จัดทำ</span></div>
      <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้อนุมัติ</span></div></div></div>`);
}
function printWorkload(){
  const mo=hrMonth(), scope=$('#loadScope').value;
  const lbl=scope==='month'?('งวด '+TH_M[+mo.slice(5,7)-1]+' '+(+mo.slice(0,4)+543))
    :scope==='year'?('ปีบัญชี '+(+mo.slice(0,4)+543)):'สะสมทั้งหมด';
  const rows=DB.emp.map(e=>({e,w:workOf(e.id,mo,scope)})).filter(r=>r.w.jobs||r.w.quotes)
    .sort((a,b)=>b.w.jobs-a.w.jobs);
  const tot=rows.reduce((a,r)=>a+r.w.jobs,0);
  printDocs(sheetTop({title:'รายงานปริมาณงานซ่อมของช่าง',en:'TECHNICIAN WORKLOAD REPORT',copy:'เอกสารภายใน',
    fields:[['ช่วงข้อมูล',lbl],['จำนวนช่าง',rows.length+' คน'],['วันที่พิมพ์',thDate(iso())]]})+`
    <table><thead><tr><th style="width:70px">รหัส</th><th>ชื่อ - นามสกุล</th><th style="width:100px">ตำแหน่ง</th>
      <th style="width:70px">ประเมิน</th><th style="width:70px">ซ่อมหลัก</th><th style="width:70px">ช่วยซ่อม</th>
      <th style="width:60px">รวมงาน</th><th style="width:90px">มูลค่างาน</th><th style="width:60px">สัดส่วน</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>${esc(r.e.code)}</td><td>${esc(r.e.name)}</td><td>${esc(r.e.position||'-')}</td>
        <td style="text-align:center">${r.w.quotes||'-'}</td><td style="text-align:center">${r.w.main||'-'}</td>
        <td style="text-align:center">${r.w.help||'-'}</td><td style="text-align:center"><b>${r.w.jobs}</b></td>
        <td class="num">${money(r.w.value)}</td>
        <td style="text-align:center">${tot?(r.w.jobs/tot*100).toFixed(1):'0.0'}%</td></tr>`).join('')}
      <tr><td colspan="6" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td style="text-align:center"><b>${tot}</b></td>
        <td class="num"><b>${money(rows.reduce((a,r)=>a+r.w.value,0))}</b></td><td></td></tr>
      </tbody></table>
    <div class="note">นับจากใบเสนอราคาที่ระบุชื่อช่างผู้ประเมิน และใบเสร็จรับเงินที่ระบุชื่อช่างผู้ซ่อม · มูลค่างานของช่างผู้ช่วยคิดให้ครึ่งหนึ่ง</div></div>`);
}

/* ---------- boot ---------- */
function boot(){
  $('#aProv').innerHTML=PROVINCES.map(p=>`<option>${p}</option>`).join('');
  $('#vProv').innerHTML=PROVINCES.map(p=>`<option>${p}</option>`).join('');
  if(!$('#plateList')){const dl=document.createElement('datalist');dl.id='plateList';
    dl.innerHTML=PLATE_LETTERS.map(p=>`<option>${p}</option>`).join('');document.body.appendChild(dl);}
  const dl=$('#stockList'); if(dl&&dl.parentElement!==document.body) document.body.appendChild(dl);
  DB.moves=DB.moves||[]; DB.vendors=DB.vendors||[]; DB.purchases=DB.purchases||[]; DB.seq=DB.seq||{};
  DB.issues=DB.issues||[]; DB.stockCounts=DB.stockCounts||[]; DB.billings=DB.billings||[];
  if(!DB.invoices){
    DB.invoices=[];
    DB.receipts.forEach(r=>{
      (r.invDocs||[]).filter(d=>!d.cancelled).forEach(d=>{
        DB.invoices.push({id:uid(),no:d.no,date:d.date,custId:r.custId,due:(r.pay&&r.pay.due)||'',
          srcType:'tax',refIds:[r.id],note:'ย้ายจากระบบเดิม (อ้างอิงใบเสร็จ '+r.no+')',
          settled:!!r.paid,settledDate:r.paidDate||'',
          apv:{status:'approved',byName:'ระบบเดิม (ก่อนเปิดใช้ขั้นตอนอนุมัติ)',date:d.date,note:''}});
      });
    });
  }
  DB.receipts.forEach(r=>{
    if(!r.taxDocs) r.taxDocs=r.taxNo?[{no:r.taxNo,date:r.date,cancelled:!!r.taxCancelled,cancelReason:r.taxCancelReason||'',cancelDate:r.taxCancelDate||''}]:[];
  });
  syncLists();
  DB.stock.forEach(s=>{if(!s.cat)s.cat='อื่น ๆ'; if(s.loc&&!s.zone&&!s.shelf){
    const m=String(s.loc).match(/ชั้น\s*([A-Ha-h])\s*(\d+)?/); if(m){s.zone=m[1].toUpperCase(); s.shelf=m[2]?+m[2]:''; s.loc='';}}});
  DB.crm=DB.crm||[]; DB.emp=DB.emp||[]; DB.curEmp=DB.curEmp||'';
  DB.expenses=DB.expenses||[]; DB.assets=DB.assets||[]; DB.capital=DB.capital||[];
  DB.hr=DB.hr||[]; DB.warns=DB.warns||[]; DB.claims=DB.claims||[];
  DB.coa=DB.coa||[]; DB.map=DB.map||{}; DB.audit=DB.audit||[]; coaInit();
  DB.shop.banks=DB.shop.banks||(DB.shop.bank?[{name:'',no:DB.shop.bank,acc:'',general:true,vat:false}]:[]);
  fillBankList();
  if(!DB.shop.licStart) DB.shop.licStart=iso();
  if(!DB.shop.licEnd) DB.shop.licEnd=addDays(DB.shop.licStart,365);
  [['quotes','quote'],['receipts','receipt'],['purchases','gr'],['claims','claim']].forEach(([k])=>{
    (DB[k]||[]).forEach(d=>{ if(!d.apv) d.apv={status:'approved',byName:'ระบบเดิม (ก่อนเปิดใช้ขั้นตอนอนุมัติ)',date:d.date||iso(),note:''}; }); });
  /* ข้อมูลเก่าไม่มีฟิลด์สถานะ — ถือว่ายังปฏิบัติงานอยู่ทั้งหมด */
  DB.emp.forEach(e=>{ if(e.active===undefined) e.active=true; if(e.leftDate===undefined) e.leftDate='';
    if(e.leftNote===undefined) e.leftNote=''; });
  DB.emp.forEach(e=>{ if(!e.perms.apv) e.perms.apv={quote:false,receipt:false,tax:false,gr:false,claim:false};
    if(e.perms.apv.claim===undefined) e.perms.apv.claim=!!e.perms.apv.gr;
    if(e.perms&&e.perms.doc){ if(e.perms.doc.emp===undefined) e.perms.doc.emp=!!(e.perms.tabs&&e.perms.tabs.emp);
    if(e.perms.doc.acctEdit===undefined) e.perms.doc.acctEdit=!!e.perms.doc.fin;
    if(e.perms.tabs&&e.perms.tabs.acct===undefined) e.perms.tabs.acct=!!e.perms.doc.fin; } });
  DB.emp.forEach(e=>{ if(e.perms&&e.perms.stock&&e.perms.stock.loc===undefined) e.perms.stock.loc=!!e.perms.stock.name;
    if(e.perms&&e.perms.stock&&e.perms.stock.img===undefined) e.perms.stock.img=!!e.perms.stock.edit; });
  DB.emp.forEach(e=>{ if(e.perms&&e.perms.apv){ if(e.perms.apv.issue===undefined) e.perms.apv.issue=!!e.perms.apv.claim;
    if(e.perms.apv.count===undefined) e.perms.apv.count=!!e.perms.apv.claim; } });
  DB.vendors.forEach(v=>{ if(v.cats===undefined) v.cats=[];
    if(v.bank&&!v.bankName&&!v.bankNo){ const hit=BANKS.find(b=>v.bank.includes(b.replace('ธนาคาร','')));
      v.bankName=hit||''; v.bankNo=hit?v.bank.replace(hit,'').replace(hit.replace('ธนาคาร',''),'').trim():v.bank; }
    if(v.cash===undefined) v.cash=!n(v.days); });
  fillUserSelect(); migratePerms(); applyPerms();
  /* ผูกปุ่มเรียงหัวตาราง — ทำครั้งเดียว ตัวช่วยกันผูกซ้ำเองถ้า boot() ถูกเรียกอีก */
  [/* กลุ่ม 1 · ทะเบียนเอกสาร */
   ['qOvTbl',renderQuoteOverview],['docOvTbl',renderDocOverview],['bnTbl',renderBillingList],
   ['taxOvTbl',renderTaxOverview],['grTbl',renderGRList],['clTbl',renderClaimList],
   ['isTbl',renderIssueList],['scTbl',renderCountList],
   /* กลุ่ม 2 · ทะเบียนข้อมูลหลัก */
   ['stockTbl',renderStock],['custLTbl',renderCustList],['custTbl',renderCust],
   ['venTbl',renderVen],['empTbl',renderEmp],
   /* กลุ่ม 3 · บัญชี - การเงิน */
   ['expTbl',renderExp],['assetTbl',renderAssets],['capTbl',renderCap],
   ['aArTbl',renderAcctAR],['aApTbl',renderAcctAP],
   /* กลุ่ม 4 · อื่น ๆ */
   ['crmTbl',renderCrm],['recTbl',renderHrRec],['wnTbl',renderWarnList],
   ['apvListTbl',renderApvList]].forEach(([id,fn])=>bindSort(id,fn));
  fillSetting(); renderStock(); renderCust(); renderVen(); renderGRList(); renderCrm(); renderEmp();
  Q=Q||blankQuote(); R=R||blankReceipt(); G=G||blankGR();
  fillQuoteForm(); fillReceiptForm(); fillGRForm(); applyVatMode(); renderBrand(); buyGo(buyPane); custGo(custPane);
  if(!C) newClaim(true); else fillClaimForm();
  refreshClaimRefs(); renderClaimList();
  if(!IS) newIssue(true); else fillIssueForm();
  refreshIssueRefs(); renderIssueList();
  if(!SC) newCount(true); else fillCountForm();
  refreshCountRefs(); renderCountList();
  if(!BN) newBilling(); else fillBillingForm();
  refreshBillingRefs(); renderBillingList();
  if(!IV) newInvoiceDoc(); else fillInvoiceForm();
  refreshInvoiceOpenSelect(); renderInvoiceList();
  fillAcctPeriod(); renderAcct(); renderHome(); applyPerms(); renderLicense(); renderStoreBox(); renderBrand();
  /* เดิมสั่งให้ปุ่มบันทึกทุกปุ่มกะพริบวนไม่รู้จบ ไม่ว่าจะบันทึกแล้วหรือยัง กลายเป็นสัญญาณรบกวน
     ตอนนี้ให้กะพริบเฉพาะตอนมีของค้างจริง ๆ (ดู syncSaveBtn ของหน้าใบเสร็จ) */
  vatGateApply();
}
$('#finMonth').onchange=renderHome;
/* ══════════ ชั้นรองรับจอมือถือ (JS) ══════════ */
/* เงื่อนไขจอมือถือ ต้องตรงกับ @media ฝั่ง CSS เสมอ — จอแคบ ≤720px หรือมือถือแนวนอน (จอสัมผัสเตี้ย) */
const MQ_MOB=matchMedia('(max-width:720px), ((orientation:landscape) and (pointer:coarse) and (max-height:600px))');
function isMobUI(){ return MQ_MOB.matches; }
/* จอแคบต้องเป็นเมนูเต็มเสมอ — ถอดสถานะ "พับเมนู" ของโหมด PC ที่อาจค้างมาจาก localStorage */
function mNavUnfold(){
  if(!isMobUI()) return;
  document.getElementById('tabs').classList.remove('collapsed');
  const tb=document.getElementById('topBrand'); if(tb) tb.classList.remove('collapsed');
}
document.getElementById('mburger').addEventListener('click',mNavUnfold);
window.addEventListener('resize',mNavUnfold);
setTimeout(mNavUnfold,300);
/* จอมือถือ: ย้ายช่องผู้ใช้ (เข้าใช้งานในนาม) จากหัวดำ ไปไว้บนสุดของเมนูข้าง เหนือหมวด 00 หน้าแรก
   จอกว้าง: ย้ายกลับหัวดำที่เดิม — ตัว select เป็นตัวเดิมตัวเดียว ไม่มีการคัดลอก id ซ้ำ */
function placeUserbox(){
  const ub=document.querySelector('.userbox'); if(!ub) return;
  if(isMobUI()){
    const tabs=document.getElementById('tabs'), first=tabs.querySelector('.navitem');
    if(ub.parentElement!==tabs) tabs.insertBefore(ub,first);
  }else{
    const tm=document.querySelector('.top-main');
    /* วางไว้ก่อนกระดิ่งเสมอ ลำดับบนแถบบนจะได้คงที่: ชื่อร้าน · ช่องผู้ใช้ · กระดิ่ง */
    if(tm&&ub.parentElement!==tm) tm.insertBefore(ub,document.getElementById('apvBell')?.parentElement===tm?document.getElementById('apvBell'):null);
  }
}
/* ป้ายเลขที่เอกสารถูกตัดด้วย … เมื่อข้อความยาว (เช่นหลังกด "คัดลอกใบนี้" จะมี "· คัดลอกจาก QO.xx" ต่อท้าย)
   ใส่ title ให้ชี้เมาส์อ่านข้อความเต็มได้ — ใช้ตัวเฝ้าดูแทนการไล่แก้ทุกจุดที่เขียนข้อความ (มี 7 จุด)
   จะได้ครอบคลุมจุดที่เพิ่มในอนาคตโดยไม่ต้องแก้ซ้ำ */
(function(){
  const sync=el=>{ const t=(el.textContent||'').trim(); if(el.title!==t) el.title=t; };
  ['qNo','rNo','grNo'].forEach(id=>{ const el=document.getElementById(id); if(!el) return;
    sync(el); new MutationObserver(()=>sync(el)).observe(el,{childList:true,characterData:true,subtree:true}); });
})();
window.addEventListener('resize',placeUserbox);
if(MQ_MOB.addEventListener) MQ_MOB.addEventListener('change',placeUserbox);
placeUserbox(); setTimeout(placeUserbox,300);
/* ตั้งชื่อหัวข้อบนหัวดำตามหน้าที่เปิดอยู่ตอนโหลด (หลังจากนี้ go() อัปเดตให้เอง) */
setTimeout(()=>{ const on=document.querySelector('#tabs .navparent.on'); mSetPageTitle(on?on.dataset.v:'home'); },300);
/* กดสลับแท็บย่อยในเมนูข้าง (4.1/4.2/… ) → อัปเดตชื่อหัวข้อใหญ่ตามแท็บที่เลือก */
document.querySelectorAll('#tabs .navseg').forEach(sg=>sg.addEventListener('click',()=>setTimeout(()=>{
  const on=document.querySelector('#tabs .navparent.on'); if(on) mSetPageTitle(on.dataset.v);
},80)));
function msecTg(h){ if(!isMobUI()) return; h.parentElement.classList.toggle('open'); }
/* ปุ่มเพิ่มอาการตรวจพบ (มือถือ) — เผยแถวว่างถัดไปจากทั้งหมด 10 ข้อ */
function mShowNextFind(){
  if(!Q||Q.deducted||Q.cancelled) return;
  pkgApplyFindRows();
  const count=pkgFindRows.get(Q);
  if(count>=10) return;
  pkgFindRows.set(Q,count+1);pkgApplyFindRows();
  document.querySelectorAll('#qFindWrap .qfind')[count]?.focus();
}
function mSheet(id){ const el=document.getElementById(id); if(el) el.classList.toggle('on'); }
document.getElementById('tabs').addEventListener('click',e=>{
  if(!isMobUI()) return;
  const b=e.target.closest('button'); if(!b||b.classList.contains('navtoggle')) return;
  /* หัวข้อหลักที่มีเมนูย่อย (เช่น 04) = กดแล้วแค่กางเมนู ไม่ปิดแถบ —
     ปิดอัตโนมัติเฉพาะตอนเลือกหน้าปลายทางจริง (หัวข้อเดี่ยว หรือหัวข้อย่อย) */
  if(b.classList.contains('navparent')){
    const item=b.closest('.navitem');
    if(item&&item.querySelector('.navchildren')) return;
  }
  setTimeout(()=>document.body.classList.remove('mnav'),120);
});
/* ยอดรวมในแถบล่าง อัปเดตตามยอดจริงของฟอร์ม */
function mSyncTotals(){
  const q=document.getElementById('qTotal'), qm=document.getElementById('qTotalM');
  if(q&&qm) qm.textContent=q.textContent;
  const r=document.getElementById('rNet'), rm=document.getElementById('rNetM');
  if(r&&rm) rm.textContent=r.textContent;
}
document.addEventListener('input',()=>{ mSyncTotals(); setTimeout(mSyncTotals,120); });
document.addEventListener('click',()=>{ mSyncTotals(); setTimeout(mSyncTotals,120); });
(function(){ const _om=openModal; openModal=function(id){ _om(id); mSyncTotals(); setTimeout(mSyncTotals,120); }; })();
/* ทะเบียนแบบยุบคอลัมน์ตามความสำคัญ (ตามแบบอ้างอิง) — pri = คอลัมน์หลัก, act = ช่องปุ่มจัดการ */
/* หมายเหตุ: act / pri เป็น "เลขลำดับคอลัมน์" — ถ้าเพิ่มหรือย้ายคอลัมน์ในตารางเหล่านี้
   ต้องเลื่อนเลขตรงนี้ให้ตรงด้วย ไม่งั้นการ์ดบนมือถือจะจับคอลัมน์ผิด
   (คอลัมน์ "ผู้บันทึก" ถูกแทรกไว้ก่อนคอลัมน์จัดการทุกตาราง จึงดัน act ไป 1 ช่อง) */
/* ==========================================================
   เรียงลำดับตารางด้วยการกดหัวคอลัมน์
   ----------------------------------------------------------
   ประกาศตัวช่วยไว้ที่เดียว ตารางอื่นเรียกใช้ซ้ำได้ทันที
   SORT_DEF[tblId].cols = { เลขคอลัมน์: {key:(row)=>ค่าที่ใช้เรียง, lbl:'ชื่อในช่องเรียงของมือถือ'} }
   sortState[tblId] = {col,dir} · เป็น null คือใช้ "เรียงแบบแนะนำ" ของหน้านั้น
   ⚠️ ต้องเรียงก่อนเรียก limitRows เสมอ ไม่งั้นจะเรียงแค่แถวที่ถูกตัดมาแล้ว
   ========================================================== */
const SORT_DEF={}, sortState={};
function sortRows(tblId,rows){
  const st=sortState[tblId], def=SORT_DEF[tblId];
  if(!st||!def||!def.cols[st.col]) return rows;          /* ไม่ได้เลือก = คงลำดับแนะนำเดิม */
  const c=def.cols[st.col], sgn=st.dir==='desc'?-1:1;
  /* Array.sort ของ JS รักษาลำดับเดิมของค่าที่เท่ากันอยู่แล้ว ไม่ต้องใส่ตัวตัดสินรอง */
  return rows.slice().sort((a,b)=>{
    const ka=c.key(a), kb=c.key(b);
    if(typeof ka==='number'&&typeof kb==='number') return (ka-kb)*sgn;
    return String(ka==null?'':ka).localeCompare(String(kb==null?'':kb),'th')*sgn;
  });
}
function bindSort(tblId,render){
  const tbl=document.getElementById(tblId), def=SORT_DEF[tblId];
  if(!tbl||!def||tbl.dataset.sortBound) return;
  tbl.dataset.sortBound='1';
  [...tbl.querySelectorAll('thead th')].forEach((th,i)=>{
    /* เก็บชื่อคอลัมน์เดิมไว้ เพราะเดี๋ยวจะมีลูกศรต่อท้าย และการ์ดมือถือใช้ชื่อนี้เป็นป้าย */
    th.dataset.lbl=th.textContent.replace(/\s+/g,' ').trim();
    if(!def.cols[i]) return;
    th.classList.add('sortable');
    th.addEventListener('click',()=>{
      const st=sortState[tblId];
      /* กดวน 3 จังหวะ: น้อย→มาก · มาก→น้อย · กลับไปเรียงแบบแนะนำ */
      if(!st||st.col!==i) sortState[tblId]={col:i,dir:'asc'};
      else if(st.dir==='asc') sortState[tblId]={col:i,dir:'desc'};
      else sortState[tblId]=null;
      render();
    });
  });
}
/* วาดลูกศรบอกสถานะ — โผล่เฉพาะคอลัมน์ที่กำลังเรียงอยู่คอลัมน์เดียว ไม่กินที่หัวตาราง */
function paintSort(tblId){
  const tbl=document.getElementById(tblId); if(!tbl) return;
  const st=sortState[tblId];
  [...tbl.querySelectorAll('thead th')].forEach((th,i)=>{
    const on=!!(st&&st.col===i);
    th.classList.toggle('sorted',on);
    const old=th.querySelector('.sarr'); if(old) old.remove();
    if(on){ const s=document.createElement('span'); s.className='sarr';
      s.textContent=st.dir==='asc'?'▴':'▾'; th.appendChild(s); }
  });
}
/* นิยามการเรียงของแต่ละตาราง — เลขคีย์คือลำดับคอลัมน์ในหัวตาราง (นับจาก 0)
   ⚠️ ถ้าเพิ่มหรือย้ายคอลัมน์ ต้องเลื่อนเลขตรงนี้ให้ตรงเหมือน MC_CFG */
const APV_RANK={draft:0,pending:1,rejected:2,approved:3};
SORT_DEF.qOvTbl={cols:{
  0:{lbl:'เลขที่',        key:x=>String(x.no||'')},
  1:{lbl:'วันที่',        key:x=>String(x.date||'')},
  2:{lbl:'ชื่อลูกค้า',    key:x=>custName(findCust(x.custId))||''},
  3:{lbl:'ทะเบียนรถ',     key:x=>{const c=findCust(x.custId); return plateOf(c&&(c.vehicles||[])[x.vehIdx])||''}},
  4:{lbl:'ยอดรวม',        key:x=>quoteTotals(x).total},
  5:{lbl:'สถานะอนุมัติ',  key:x=>x.cancelled?9:(APV_RANK[apvOf(x).status]||0)},
  6:{lbl:'สถานะใบเสร็จ',  key:x=>x.cancelled?2:(qOvBilled.has(x.id)?1:0)},
  7:{lbl:'ผู้บันทึก',     key:x=>byShort(x)||''}
}};
/* 4.1 · แถวเป็นกล่องห่อจาก docRowsAll() (รวมใบเสร็จกับใบแจ้งหนี้) เอกสารจริงอยู่ที่ x.obj */
SORT_DEF.docOvTbl={cols:{
  0:{lbl:'เลขที่',              key:x=>String(x.no||'')},
  1:{lbl:'วันที่',              key:x=>String(x.date||'')},
  2:{lbl:'ลูกค้า',              key:x=>custName(findCust(x.custId))||''},
  3:{lbl:'ยอดรวม',              key:x=>n(x.gross)},
  4:{lbl:'ยอดหลังหัก ณ ที่จ่าย', key:x=>n(x.amt)},
  5:{lbl:'ครบกำหนด',            key:x=>String(x.due||'')},
  6:{lbl:'สถานะเอกสาร',         key:x=>x.obj&&x.obj.cancelled?9:(APV_RANK[apvOf(x.obj).status]||0)},
  7:{lbl:'การชำระเงิน',         key:x=>String(docPayState(x,iso())||'')},
  8:{lbl:'ผู้บันทึก',           key:x=>byShort(x.obj)||''}
}};
SORT_DEF.bnTbl={cols:{
  0:{lbl:'เลขที่',    key:x=>String(x.no||'')},
  1:{lbl:'วันที่',    key:x=>String(x.date||'')},
  2:{lbl:'ลูกค้า',    key:x=>custName(findCust(x.custId))||''},
  3:{lbl:'รายการ',    key:x=>(x.receiptIds||[]).length},
  4:{lbl:'ยอดรวม',    key:x=>bnAmt(x).total},
  5:{lbl:'ชำระแล้ว',  key:x=>bnAmt(x).paid},
  6:{lbl:'คงค้าง',    key:x=>bnAmt(x).rem},
  7:{lbl:'สถานะ',     key:x=>x.cancelled?3:(x.settled?2:(bnAmt(x).rem<=0.005?1:0))},
  8:{lbl:'ผู้บันทึก', key:x=>byShort(x)||''}
}};
/* 4.3 · แถวเป็น {r:ใบเสร็จ, d:ใบกำกับ} — ใบเสร็จหนึ่งใบมีใบกำกับได้หลายใบ */
SORT_DEF.taxOvTbl={cols:{
  0:{lbl:'เลขที่ใบกำกับ',  key:x=>String(x.d.no||'')},
  1:{lbl:'อ้างอิงใบเสร็จ', key:x=>String(x.r.no||'')},
  2:{lbl:'วันที่',         key:x=>String(x.d.date||'')},
  3:{lbl:'ลูกค้า',         key:x=>custName(findCust(x.r.custId))||''},
  4:{lbl:'มูลค่ารวม VAT',  key:x=>receiptTotals(x.r).gross},
  5:{lbl:'สถานะ',          key:x=>x.d.cancelled?1:0},
  6:{lbl:'ผู้บันทึก',      key:x=>byShort(x.r)||''}
}};
SORT_DEF.grTbl={cols:{
  0:{lbl:'เลขที่',        key:x=>String(x.no||'')},
  1:{lbl:'วันที่',        key:x=>String(x.date||'')},
  2:{lbl:'ผู้ขาย',        key:x=>{const v=findVen(x.vendorId); return (v&&v.name)||''}},
  3:{lbl:'ใบกำกับผู้ขาย', key:x=>String(x.inv||'')},
  4:{lbl:'ครบกำหนด',      key:x=>x.term==='credit'?String(x.due||''):''},
  5:{lbl:'ยอดสุทธิ',      key:x=>grTotals(x).total},
  6:{lbl:'สถานะอนุมัติ',  key:x=>APV_RANK[apvOf(x).status]||0},
  7:{lbl:'สถานะการเงิน',  key:x=>x.paid?2:((!x.paid&&x.term==='credit'&&daysBetween(x.due,iso())>0)?0:1)},
  8:{lbl:'ผู้บันทึก',     key:x=>byShort(x)||''}
}};
SORT_DEF.clTbl={cols:{
  0:{lbl:'เลขที่',        key:x=>String(x.no||'')},
  1:{lbl:'วันที่',        key:x=>String(x.date||'')},
  2:{lbl:'ผู้ขาย',        key:x=>{const v=findVen(x.vendorId); return (v&&v.name)||''}},
  3:{lbl:'ทะเบียนรถ',     key:x=>String(x.plate||'')},
  4:{lbl:'รายการ',        key:x=>clItemsClean(x).length},
  5:{lbl:'จำนวนรวม',      key:x=>clItemsClean(x).reduce((a,i)=>a+n(i.qty),0)},
  6:{lbl:'สถานะอนุมัติ',  key:x=>APV_RANK[apvOf(x).status]||0},
  7:{lbl:'สถานะการเคลม',  key:x=>String(x.status||'')},
  8:{lbl:'ผู้บันทึก',     key:x=>byShort(x)||''}
}};
SORT_DEF.isTbl={cols:{
  0:{lbl:'เลขที่',       key:x=>String(x.no||'')},
  1:{lbl:'วันที่',       key:x=>String(x.date||'')},
  2:{lbl:'ผู้เบิก',      key:x=>String(x.by||'')},
  3:{lbl:'แผนก / งาน',   key:x=>String(x.dept||'')},
  4:{lbl:'รายการ',       key:x=>isItemsClean(x).length},
  5:{lbl:'จำนวนรวม',     key:x=>isItemsClean(x).reduce((a,i)=>a+n(i.qty),0)},
  6:{lbl:'สถานะอนุมัติ', key:x=>APV_RANK[apvOf(x).status]||0},
  7:{lbl:'ผู้บันทึก',    key:x=>byShort(x)||''}
}};
SORT_DEF.scTbl={cols:{
  0:{lbl:'เลขที่',         key:x=>String(x.no||'')},
  1:{lbl:'วันที่',         key:x=>String(x.date||'')},
  2:{lbl:'ผู้ตรวจนับ',     key:x=>String(x.by||'')},
  3:{lbl:'หมวดที่ตรวจ',    key:x=>String(x.catFilter||'')},
  4:{lbl:'รายการ',         key:x=>(x.items||[]).length},
  5:{lbl:'รายการที่ต่าง',  key:x=>(x.items||[]).filter(it=>n(it.countedQty)!==n(it.sysQty)).length},
  6:{lbl:'สถานะอนุมัติ',   key:x=>APV_RANK[apvOf(x).status]||0},
  7:{lbl:'ผู้บันทึก',      key:x=>byShort(x)||''}
}};
/* ---------- กลุ่ม 2 · ทะเบียนข้อมูลหลัก ---------- */
SORT_DEF.stockTbl={cols:{
  0:{lbl:'รหัสสินค้า',      key:x=>String(x.code||'')},
  1:{lbl:'รหัสอ้างอิง OEM', key:x=>String(x.oem||'')},
  2:{lbl:'ชื่อสินค้า',      key:x=>String(x.name||'')},
  3:{lbl:'หมวด',            key:x=>String(x.cat||'')},
  4:{lbl:'ตำแหน่งจัดเก็บ',  key:x=>String(locCode(x)||'zzz')},
  5:{lbl:'ราคาซื้อ',        key:x=>n(x.cost)},
  6:{lbl:'ราคาขาย A',       key:x=>n(x.pa)},
  7:{lbl:'ราคาขาย B',       key:x=>n(x.pb)},
  8:{lbl:'ราคาขาย C',       key:x=>n(x.pc)},
  9:{lbl:'ปริมาณคงคลัง',    key:x=>n(x.qty)},
  10:{lbl:'Min',            key:x=>n(x.min)},
  11:{lbl:'Max',            key:x=>n(x.max)},
  12:{lbl:'เคลื่อนไหวล่าสุด',key:x=>String(x.lastMove||'')}
}};
/* 02 · แถวเป็น {c:ลูกค้า, v:รถ, last:{date,ref}} */
SORT_DEF.custLTbl={cols:{
  0:{lbl:'วันที่เข้ารับบริการล่าสุด',key:x=>String(x.last.date||'')},
  1:{lbl:'ยี่ห้อรถ',   key:x=>String((x.v&&x.v.brand)||'')},
  2:{lbl:'ทะเบียนรถ',  key:x=>String(plateOf(x.v)||'')},
  3:{lbl:'ชื่อลูกค้า', key:x=>custName(x.c)||''},
  4:{lbl:'เบอร์โทร',   key:x=>String((x.c&&x.c.tel)||'')},
  5:{lbl:'เกรดดาว',    key:x=>n(x.c&&x.c.stars)}
}};
SORT_DEF.custTbl={cols:{
  0:{lbl:'ประเภท',        key:x=>String(x.type||'')},
  1:{lbl:'ชื่อลูกค้า',    key:x=>custName(x)||''},
  2:{lbl:'เกรดลูกค้า',    key:x=>n(x.stars)},
  3:{lbl:'เลขผู้เสียภาษี',key:x=>String(x.tax||'')},
  4:{lbl:'ที่อยู่',       key:x=>String(addrLine(x.addr)||'')},
  5:{lbl:'โทรศัพท์',      key:x=>String(x.tel||'')},
  6:{lbl:'รถในความดูแล',  key:x=>(x.vehicles||[]).length},
  7:{lbl:'ยอดซ่อมสะสม',   key:x=>custSpend(x.id)}
}};
SORT_DEF.venTbl={cols:{
  0:{lbl:'ประเภท',            key:x=>String(x.type||'')},
  1:{lbl:'ชื่อผู้ขาย',        key:x=>String(x.name||'')},
  2:{lbl:'ประเภทสินค้าที่ขาย',key:x=>(x.cats||[]).length},
  3:{lbl:'ที่อยู่',           key:x=>String(addrLine(x.addr)||'')},
  4:{lbl:'ผู้ติดต่อ',         key:x=>String(x.contact||'')},
  5:{lbl:'เครดิต',            key:x=>(x.cash||!n(x.days))?0:n(x.days)},
  6:{lbl:'ยอดซื้อสะสม',       key:x=>vendorSpend(x.id)},
  7:{lbl:'ผู้บันทึก',         key:x=>byShort(x)||''}
}};
SORT_DEF.empTbl={cols:{
  0:{lbl:'รหัสพนักงาน',   key:x=>String(x.code||'')},
  1:{lbl:'ชื่อ - นามสกุล',key:x=>String(x.name||'')},
  2:{lbl:'อายุ',          key:x=>n(x.age)},
  3:{lbl:'เลขบัตรประชาชน',key:x=>String(x.idcard||'')},
  4:{lbl:'ตำแหน่งงาน',    key:x=>String(x.position||'')},
  /* เรียงด้วยวันเริ่มงาน — น้อย→มาก คือคนที่เข้าทำงานก่อน (อายุงานมากสุดขึ้นก่อน) */
  5:{lbl:'อายุงาน',       key:x=>String(x.start||'9999')},
  6:{lbl:'เงินเดือน',     key:x=>n(x.salary)},
  7:{lbl:'รวมรายได้',     key:x=>ssoOf(x).gross},
  8:{lbl:'สิทธิใช้งาน',   key:x=>+String(permCount(x)).split('/')[0]},
  9:{lbl:'ผู้บันทึก',     key:x=>byShort(x)||''}
}};
/* ---------- กลุ่ม 3 · บัญชี - การเงิน ---------- */
SORT_DEF.expTbl={cols:{
  0:{lbl:'เลขที่',        key:x=>String(x.no||'')},
  1:{lbl:'วันที่',        key:x=>String(x.date||'')},
  2:{lbl:'รหัสบัญชี',     key:x=>String(expAcc(x.cat)||'')},
  3:{lbl:'หมวดค่าใช้จ่าย',key:x=>String(x.cat||'')},
  4:{lbl:'รายละเอียด',    key:x=>String(x.desc||'')},
  5:{lbl:'มูลค่าก่อนภาษี',key:x=>expTotals(x).base},
  6:{lbl:'VAT',           key:x=>expTotals(x).vat},
  7:{lbl:'หัก ณ ที่จ่าย', key:x=>expTotals(x).wht},
  8:{lbl:'จ่ายจริง',      key:x=>expTotals(x).net},
  9:{lbl:'สถานะ',         key:x=>x.paid?1:0},
  10:{lbl:'ผู้บันทึก',    key:x=>byShort(x)||''}
}};
SORT_DEF.assetTbl={cols:{
  0:{lbl:'เลขที่ทะเบียน',  key:x=>String(x.no||'')},
  1:{lbl:'วันที่ได้มา',    key:x=>String(x.date||'')},
  2:{lbl:'รายการสินทรัพย์',key:x=>String(x.name||'')},
  3:{lbl:'รหัสบัญชี',      key:x=>String(assetAcc(x.cat)[0]||'')},
  4:{lbl:'ประเภท',         key:x=>String(x.cat||'')},
  5:{lbl:'ราคาทุน',        key:x=>n(x.cost)},
  6:{lbl:'อายุ (ปี)',      key:x=>n(x.life)},
  7:{lbl:'ค่าเสื่อม/ปี',   key:x=>assetDep(x,acctY()).annual},
  8:{lbl:'ค่าเสื่อมสะสม',  key:x=>assetDep(x,acctY()).accEnd},
  9:{lbl:'มูลค่าคงเหลือ',  key:x=>x.status==='sold'?0:assetDep(x,acctY()).nbv},
  10:{lbl:'ผู้บันทึก',     key:x=>byShort(x)||''}
}};
SORT_DEF.capTbl={cols:{
  0:{lbl:'วันที่',       key:x=>String(x.date||'')},
  1:{lbl:'ประเภทรายการ', key:x=>String(CAP_LABEL[x.type]||x.type||'')},
  2:{lbl:'รายละเอียด',   key:x=>String(x.note||'')},
  3:{lbl:'จำนวนเงิน',    key:x=>n(x.amt)},
  4:{lbl:'ผู้บันทึก',    key:x=>byShort(x)||''}
}};
/* 08 · ลูกหนี้ — แถวมาจาก docRowsAll() พร้อมฟิลด์ over/rem/paidAmt ที่คำนวณเพิ่ม */
SORT_DEF.aArTbl={cols:{
  0:{lbl:'เลขที่เอกสาร',key:x=>String(x.no||'')},
  1:{lbl:'วันที่',      key:x=>String(x.date||'')},
  2:{lbl:'ลูกค้า',      key:x=>custName(findCust(x.custId))||''},
  3:{lbl:'ยอดบิล',      key:x=>n(x.amt)},
  4:{lbl:'ชำระแล้ว',    key:x=>n(x.paid?(x.paidAmt||x.amt):x.paidAmt)},
  5:{lbl:'คงค้าง',      key:x=>n(x.rem)},
  6:{lbl:'ครบกำหนด',    key:x=>String(x.due||x.date||'')},
  7:{lbl:'สถานะ',       key:x=>x.paid?2:(x.over>0?0:1)}
}};
/* 08 · เจ้าหนี้ — แถวเป็น {p:ใบรับสินค้า, amt, due, over, paidAmt, rem} */
SORT_DEF.aApTbl={cols:{
  0:{lbl:'เลขที่ใบรับสินค้า',key:x=>String(x.p.no||'')},
  1:{lbl:'วันที่',           key:x=>String(x.p.date||'')},
  2:{lbl:'ผู้ขาย',           key:x=>{const v=findVen(x.p.vendorId); return (v&&v.name)||''}},
  3:{lbl:'ยอดบิล',           key:x=>n(x.amt)},
  4:{lbl:'ชำระแล้ว',         key:x=>n(x.p.paid?(x.paidAmt||x.amt):x.paidAmt)},
  5:{lbl:'คงค้าง',           key:x=>n(x.rem)},
  6:{lbl:'ครบกำหนด',         key:x=>String(x.due||'')},
  7:{lbl:'สถานะ',            key:x=>x.p.paid?2:(x.over>0?0:1)}
}};
/* ---------- กลุ่ม 4 · อื่น ๆ ---------- */
SORT_DEF.crmTbl={cols:{
  0:{lbl:'ลูกค้า',        key:x=>custName(findCust(x.custId))||''},
  1:{lbl:'ทะเบียนรถ',     key:x=>{const c=findCust(x.custId); return plateOf(c&&(c.vehicles||[])[x.vehIdx])||''}},
  2:{lbl:'เบอร์โทร',      key:x=>{const c=findCust(x.custId); return String((c&&c.tel)||'')}},
  3:{lbl:'วันที่แจ้งเตือน',key:x=>String(x.date||'')},
  4:{lbl:'สถานะแจ้งเตือน',key:x=>crmStatus(x).ord},
  5:{lbl:'ประเภท',        key:x=>String(CRM_TYPE[x.type]||'')},
  6:{lbl:'รายละเอียด',    key:x=>String(x.note||'')},
  7:{lbl:'ผู้บันทึก',     key:x=>byShort(x)||''}
}};
SORT_DEF.recTbl={cols:{
  0:{lbl:'วันที่',            key:x=>String(x.date||'')},
  1:{lbl:'พนักงาน',           key:x=>empName(x.emp)||''},
  2:{lbl:'ประเภท',            key:x=>String(HR_LABEL[x.type]||x.type||'')},
  3:{lbl:'จำนวน',             key:x=>n(x.qty)},
  4:{lbl:'เหตุผล',            key:x=>String(x.note||'')},
  5:{lbl:'สถานะอนุมัติ',      key:x=>String(x.stat||'')},
  6:{lbl:'ผู้บันทึกตามฟอร์ม', key:x=>String(x.by||'')},
  7:{lbl:'ผู้บันทึกในระบบ',   key:x=>byShort(x)||''}
}};
SORT_DEF.wnTbl={cols:{
  0:{lbl:'เลขที่',        key:x=>String(x.no||'')},
  1:{lbl:'วันที่',        key:x=>String(x.date||'')},
  2:{lbl:'พนักงาน',       key:x=>empName(x.emp)||''},
  3:{lbl:'ครั้งที่',      key:x=>n(x.times)},
  4:{lbl:'เรื่องที่ตักเตือน',key:x=>String(x.topic||'')},
  5:{lbl:'มาตรการ',       key:x=>String(x.action||'')},
  6:{lbl:'ผู้บันทึก',     key:x=>byShort(x)||''}
}};
/* รายงานเอกสารรออนุมัติ — คอลัมน์ "ลำดับ" เป็นเลขวิ่ง ไม่ให้เรียง */
SORT_DEF.apvListTbl={cols:{
  1:{lbl:'ประเภทเอกสาร',   key:x=>String(x.label||'')},
  2:{lbl:'วันที่ส่ง',      key:x=>String(x.date||'')},
  3:{lbl:'เลขที่เอกสาร',   key:x=>String(x.no||'')},
  4:{lbl:'ชื่อลูกค้า / ผู้ขาย',key:x=>String(apvParty(x.kind,x.d)||'')},
  5:{lbl:'ราคาสุทธิ',      key:x=>{const a=apvAmount(x.kind,x.d); return a===null?-1:n(a)}},
  6:{lbl:'ผู้ส่งขออนุมัติ',key:x=>String(x.by||'')},
  7:{lbl:'รอมาแล้ว (วัน)', key:x=>Math.max(0,daysBetween(x.date,iso()))}
}};
const MC_CFG={
  qOvTbl:{pri:[0,1,2],act:null},
  docOvTbl:{pri:[0,1,2],act:9},
  bnTbl:{pri:[0,1,2],act:9},
  taxOvTbl:{pri:[0,2,3],act:7},
  apvListTbl:{pri:[1,3,4],act:8},
  custLTbl:{pri:[0,1,2],act:6},
  custTbl:{pri:[0,1,2],act:8},
  venTbl:{pri:[0,1],act:8},
  /* หมวด 06 · ทุกหมวดย่อยเป็นการ์ดบนมือถือ ยกเว้น "จ่ายเงินเดือน" (payTbl)
     ที่ตั้งใจคงเป็นตาราง เพราะต้องเทียบตัวเลขหลายคนพร้อมกัน */
  grTbl:{pri:[0,1,2],act:9},
  utilTbl:{pri:[0,1,4],act:9},
  basTbl:{pri:[0,1,2],act:8},
  offTbl:{pri:[0,1,4],act:9},
  othTbl:{pri:[0,1,4],act:9},
  /* หมวด 07 · เคลม/เบิก/ตรวจนับเป็นการ์ดบนมือถือ (ทะเบียนอะไหล่คงเป็นตารางตามที่สั่ง
     เพราะต้องกวาดตาเทียบราคาหลายช่องพร้อมกัน) */
  clTbl:{pri:[0,2,7],act:9},
  isTbl:{pri:[0,2,6],act:8},
  scTbl:{pri:[0,2,6],act:8},
  /* หมวด 08 · ลูกหนี้ / เจ้าหนี้ — ชูเลขที่ · คู่ค้า · ยอดคงค้าง */
  aArTbl:{pri:[0,2,5],act:8},
  aApTbl:{pri:[0,2,5],act:8}
};
function mSheetScroll(id,dir){
  const sh=document.querySelector('#'+id+' .sheet');
  if(sh) sh.scrollTo({top:dir?sh.scrollHeight:0,behavior:'smooth'});
}
/* ซ่อนแถวอาการตรวจพบที่ว่างบนมือถือ — เหลือแถวว่างเดียวไว้กรอกต่อ */
const pkgFindRows=new WeakMap();
function pkgApplyFindRows(){
  if(!Q) return;
  let used=0;
  (Q.finds||[]).forEach((v,i)=>{if(v&&(String(v.t||'').trim()||v.fix||v.part||v.new)) used=i+1;});
  const count=Math.min(10,Math.max(3,used,pkgFindRows.get(Q)||3));
  pkgFindRows.set(Q,count);
  document.querySelectorAll('#qFindWrap tr').forEach((row,i)=>row.classList.toggle('mhide',i>=count));
  const button=document.querySelector('.pkg-add-find');
  if(button) button.hidden=count>=10||!!(Q.deducted||Q.cancelled);
}
(function(){ const original=renderFinds; renderFinds=function(){
  const result=original.apply(this,arguments);pkgApplyFindRows();return result;
}; })();
/* ซ่อนบรรทัดว่างของตารางรายการบนมือถือ — เหลือบรรทัดว่างบรรทัดเดียวไว้กรอกต่อ */
(function(){ const _ri=renderQItems; renderQItems=function(){ const r=_ri.apply(this,arguments);
  if(isMobUI()){ let empt=0;
    document.querySelectorAll('#qItems tbody tr').forEach(tr=>{
      const filled=[...tr.querySelectorAll('input')].some(i=>i.type!=='checkbox'&&String(i.value||'').trim()&&i.value!=='0'&&i.value!=='1');
      const hasChip=tr.textContent.includes('ค่าแรง')&&filled;
      if(filled||hasChip){ tr.classList.remove('mhide'); }
      else { empt++; tr.classList.toggle('mhide',empt>1); }
    }); }
  return r; }; })();
/* ซ่อนบรรทัดว่างของตารางรายการ+รับประกันในใบเสร็จบนมือถือ — เหลือบรรทัดว่างเดียวไว้กรอกต่อ
   ตารางนี้ถูกเรนเดอร์ใหม่จากใน calcReceipt() ซึ่งมีผู้เรียกหลายทาง จึงใช้ MutationObserver
   เฝ้า tbody แทนการครอบฟังก์ชัน (handler บางตัวจับ reference ของ calcReceipt ไว้ตรงๆ)
   ใบที่ล็อกแล้ว (ตัดสต๊อก/ยกเลิก) ไม่มีช่องกรอก → ซ่อนบรรทัดว่างทั้งหมด */
(function(){
  const tb=document.querySelector('#rItems tbody'); if(!tb) return;
  function mHideRItems(){
    if(!isMobUI()) return;
    let empt=0;
    tb.querySelectorAll('tr').forEach(tr=>{
      const nameInp=tr.querySelector('.rname'), codeInp=tr.querySelector('.rcode');
      const editable=!!(nameInp||codeInp);
      const filled=editable
        ? !!((nameInp&&nameInp.value.trim())||(codeInp&&codeInp.value.trim())||tr.textContent.includes('ค่าแรง'))
        : !!(tr.children[2]&&tr.children[2].textContent.trim());
      if(filled){ tr.classList.remove('mhide'); }
      else { empt++; tr.classList.toggle('mhide',editable?empt>1:true); }
    });
  }
  new MutationObserver(mHideRItems).observe(tb,{childList:true});
  window.addEventListener('resize',mHideRItems);
})();
function mkCards(tblId){
  /* ติดป้ายชื่อคอลัมน์ (data-l) + แยกคอลัมน์หลัก/รอง — ตารางเดิม ปุ่มเดิม CSS จัดรูปเอง */
  const cfg=MC_CFG[tblId], tbl=document.getElementById(tblId); if(!cfg||!tbl) return;
  tbl.classList.add('rt');
  /* ใช้ชื่อคอลัมน์ที่เก็บไว้ก่อน ไม่ใช่ textContent สด — เพราะหัวคอลัมน์ที่เรียงอยู่มีลูกศรต่อท้าย
     ถ้าอ่านสดป้ายบนการ์ดมือถือจะกลายเป็น "วันที่▾" */
  const ths=[...tbl.querySelectorAll('thead th')].map(th=>(th.dataset.lbl||th.textContent).replace(/\s+/g,' ').trim());
  tbl.querySelectorAll('tbody tr').forEach(tr=>{
    [...tr.children].forEach((td,i)=>{
      td.setAttribute('data-l',ths[i]||'');
      td.classList.remove('rt-p','rt-s','rt-x','rt-empty');
      if(cfg.act===i) td.classList.add('rt-x');
      else if(cfg.pri.indexOf(i)>-1) td.classList.add('rt-p');
      else td.classList.add('rt-s');
      if(cfg.act!==i&&!td.textContent.trim()) td.classList.add('rt-empty');
    });
  });
  /* แถวสรุปท้ายตาราง — เดิมไม่ถูกแปลงเป็นการ์ดด้วย เลยกลายเป็นตัวเลขเรียงลอย ๆ ไม่มีป้ายบอกว่าคืออะไร
     ต้องไล่ตาม colspan เพื่อรู้ว่าแต่ละช่องตรงกับคอลัมน์ไหนในหัวตาราง */
  tbl.querySelectorAll('tfoot tr').forEach(tr=>{
    let col=0;
    [...tr.children].forEach(td=>{
      const span=+(td.getAttribute('colspan')||1), txt=td.textContent.trim();
      td.classList.remove('rt-ftitle','rt-empty');
      if(col===0){ td.classList.add('rt-ftitle'); td.removeAttribute('data-l'); }   /* ช่องแรก = หัวเรื่องสรุป */
      else if(!txt) td.classList.add('rt-empty');
      else td.setAttribute('data-l',ths[col]||'');
      col+=span;
    });
  });
}
(async()=>{ await load();
  /* เปิดครั้งแรกและยังไม่มีข้อมูล — โหลดข้อมูลทดสอบ 36 เดือนให้อัตโนมัติ */
  if(!DB.receipts.length&&!DB.cust.length&&!DB.stock.length){ boot(); /* DriveGo phase 2 (A1): no demo data */ }
  else boot(); })();

/* ==========================================================
   P1 · DriveGo ProX — โมดูล Ecosystem (ต่อยอดบน BaziX เดิม)
   หลักการ: ไม่แตะโค้ดเดิม — เก็บข้อมูลใน DB.px (persist ผ่าน save() เดิม)
   เชื่อมของจริง: คิวจาก BOOK → DB.cust + DB.quotes · Coins ← DB.receipts · คลังกลาง → DB.stock
   ========================================================== */
let pxPane='book';
function ensurePX(){
  if(!DB.px){
    DB.px={queue:[],inq:[],sos:[],coins:[],coined:{},shop:{desc:'',line:'',fb:'',ph:''},seq:0};
    pxSeed();
  }
  if(!DB.px.catalog) DB.px.catalog=PXCAT.map(x=>({...x}));
  if(!DB.px.reqs) DB.px.reqs=[];
  if(!DB.px.topics) DB.px.topics=['ปริมาณเติมน้ำยาแอร์','ปริมาณน้ำมันคอมพ์','การแก้ Code','ระบบส่งกำลัง'];
  if(!DB.px.learn) DB.px.learn=[
    {id:uid(),title:'ตารางปริมาณน้ำยาแอร์ + น้ำมันคอมพ์ 12 รุ่นยอดนิยม',cat:'ปริมาณเติมน้ำยาแอร์',kind:'note',fname:'',mime:'',data:null,
     desc:'สรุปจากแท็บสเปคเทคนิค: รถไฮบริด/EV ใช้คอมไฟฟ้า ต้องใช้น้ำมัน POE เท่านั้น ห้ามปน PAG แม้หยดเดียว เพราะฉนวนไฟฟ้าเสื่อมทำคอมพัง — เช็คสติกเกอร์ฝากระโปรงก่อนเติมทุกครั้ง',
     vis:'published',by:'ช่างหนึ่ง',date:iso()},
    {id:uid(),title:'วิธีเคลียร์ Code P0420 หลังเปลี่ยนแคทฯ (ภายในอู่)',cat:'การแก้ Code',kind:'note',fname:'',mime:'',data:null,
     desc:'ขั้นตอนภายในอู่เรา: ลบ code → ขับ drive cycle 15 นาที ความเร็วคงที่ 80 → เช็ค readiness monitor ครบก่อนคืนรถ ลูกค้าเจ้าประจำมักกลับมาถามถ้าไฟโชว์ซ้ำ',
     vis:'private',by:'ช่างเอก',date:iso()}
  ];
}
function pxSeed(){
  const p=DB.px;
  p.queue=[
    {id:uid(),when:'พรุ่งนี้ 09:00',plateL:'8กด',plateN:'5219',prov:'กรุงเทพมหานคร',brand:'Toyota',model:'Corolla Cross 1.8 HEV',year:'2022',owner:'คุณเมษา วงศ์สว่าง',tel:'081-000-1122',mile:'58920',vin:'MR2K33FB8P0xxxxxx',engine:'2ZR-W123456',sv:'เช็คระยะ 60,000 กม.',st:'wait'},
    {id:uid(),when:'ศ. 15:30',plateL:'2ขค',plateN:'1846',prov:'นนทบุรี',brand:'Isuzu',model:'D-Max 1.9 Ddi Hi-Lander',year:'2021',owner:'คุณธนา กิจเจริญ',tel:'089-555-6677',mile:'104350',vin:'MP1TFR86JP0xxxxxx',engine:'RZ4E-K778901',sv:'ตรวจช่วงล่าง + เบรก',st:'done',note:'รับเข้าระบบแล้ว'}
  ];
  p.inq=[
    {id:uid(),plateL:'2ขค',plateN:'1846',prov:'นนทบุรี',brand:'Isuzu',model:'D-Max 1.9 Ddi',year:'2021',owner:'คุณธนา กิจเจริญ',tel:'089-555-6677',mile:'104350',
     txt:'ขับเกิน 90 แล้วพวงมาลัยสั่น เบรกมีเสียงเอี๊ยดตอนเช้า ยางหน้าซ้ายดูสึกไม่เท่ากัน เป็นมา 3 สัปดาห์',st:'wait'},
    {id:uid(),plateL:'8กด',plateN:'5219',prov:'กรุงเทพมหานคร',brand:'Toyota',model:'Corolla Cross HEV',year:'2022',owner:'คุณเมษา วงศ์สว่าง',tel:'081-000-1122',mile:'58920',
     txt:'แอร์ไม่ค่อยเย็นช่วงเที่ยง มีกลิ่นอับตอนเปิดใหม่ ๆ',st:'done',note:'ออกใบเสนอราคาแล้ว'}
  ];
  p.sos=[
    {id:uid(),type:'🔋 แบตหมด',plateL:'5ขจ',plateN:'2210',prov:'กรุงเทพมหานคร',car:'BYD Atto 3 · ปั๊ม ปตท. ลาดพร้าว 64 (ห่าง ~1.8 กม.)',kit:'แบต 12V เสริม: LN1 45Ah · ระบบ EV แจ้งช่างก่อนพ่วง',st:'wait'}
  ];
}
function pxSave(){ try{ save(); }catch(e){} }
function pxBadge(){
  ensurePX();
  const p=DB.px;
  const n=(PXNET.on?PXNET.q.filter(x=>x.status==='wait').length
          :p.queue.filter(x=>x.st==='wait').length)
        +p.inq.filter(x=>x.st==='wait').length+p.sos.filter(x=>x.st==='wait').length;
  const b=$('#bdgProx'); if(b){ b.style.display=n?'inline':'none'; b.textContent=n; }
}
function pxGo(v){
  pxPane=v;
  $$('#proxTabs button').forEach(x=>x.classList.toggle('on',x.dataset.p===v));
  $$('#v-prox .ppane').forEach(pn=>pn.style.display=(pn.id==='p-'+v)?'':'none');
  if(v==='book')renderPxBook();
  if(v==='inq')renderPxInq();
  if(v==='sos')renderPxSos();
  if(v==='coins')renderPxCoins();
  if(v==='shop')fillPxShop();
}
/* ---- ผูกลูกค้า BOOK เข้าเมนู 02 (สร้างถ้ายังไม่มี — จับคู่ด้วยทะเบียน) ---- */
function pxFindCust(pl,pn){
  return DB.cust.find(c=>(c.vehicles||[]).some(v=>v.plateL===pl&&String(v.plateN)===String(pn)));
}
function pxEnsureCust(j){
  let c=pxFindCust(j.plateL,j.plateN);
  if(c) return {c,isNew:false};
  c={id:uid(),type:'person',tax:'',name:j.owner||('เจ้าของรถ '+j.plateL+' '+j.plateN),company:'',branch:'',tier:'C',stars:0,
    addr:{no:'',village:'',moo:'',soi:'',road:'',sub:'',dist:'',prov:j.prov||'',zip:''},
    tel:j.tel||'',tel2:'',
    vehicles:[{brand:j.brand||'',model:j.model||'',color:'',plateL:j.plateL,plateN:j.plateN,plateProv:j.prov||'',
      mile:j.mile||'',engine:j.engine||'',vin:j.vin||'',year:j.year||''}]};
  try{ stampRec(c,null); }catch(e){}
  DB.cust.push(c);
  try{ logAudit('cust',{id:c.id,no:c.name},'save','เพิ่มลูกค้าอัตโนมัติจาก DriveGo BOOK · '+j.plateL+' '+j.plateN); }catch(e){}
  return {c,isNew:true};
}
/* DriveGo new system (task 3.2): quotations opened from BOOK, symptom reports, SOS and the chain take the next number of
   the shop's quotation counter like every other quotation (MA-QT2610…, issued on the server), not their own count of the
   day (QO.69-10-13-01) that no counter knew about. */
function pxQuoteNo(){
  return docNo('QO');
}
/* ---- คิวจองจาก BOOK → สร้างใบเสนอราคาร่าง (เมนู 03) ---- */
function pxAcceptBook(id){
  ensurePX();
  const j=DB.px.queue.find(x=>x.id===id); if(!j||j.st!=='wait')return;
  const {c,isNew}=pxEnsureCust(j);
  const q={id:uid(),no:pxQuoteNo(),date:iso(),jobIn:iso(),custId:c.id,vehIdx:0,mile:j.mile||'',
    probs:[ j.sv||'งานจองจาก DriveGo BOOK','',''],finds:[],tier:c.tier||'C',items:[],disc:0,vat:DB.shop.vatReg!==false?7:0,
    tech:'',techName:'',byPos:'',byName:'',apPos:'',apName:'',status:'ร่าง',bookRef:'BOOK · นัด '+j.when};
  DB.quotes.push(q);
  j.st='done'; j.note='รับเข้าระบบ · '+q.no;
  try{ logAudit('quote',{id:q.id,no:q.no},'save','เปิดใบเสนอราคาจากคิวจอง DriveGo BOOK · '+j.plateL+' '+j.plateN); }catch(e){}
  pxSave(); renderPxBook(); pxBadge();
  toast((isNew?'สร้างลูกค้าใหม่ (เมนู 02) และ':'ผูกลูกค้าเดิม —')+' เปิดใบเสนอราคา '+q.no+' (เมนู 03) แล้ว');
}
/* ---- ชุดข้อมูลจำลอง (สุ่มวนหลายเคสจริง ครอบ ICE/Hybrid/EV/กระบะ) ---- */
const SIM_BOOKS=[
  {when:'เสาร์ 10:30',plateL:'1ขข',prov:'กรุงเทพมหานคร',brand:'Honda',model:'City e:HEV',year:'2023',owner:'คุณพิม สายใจ',tel:'080-333-9911',mile:'21500',vin:'MRHDG168PT',engine:'LEB8-1102233',sv:'เช็คระยะ 20,000 กม. + สลับยาง'},
  {when:'จันทร์ 09:00',plateL:'3กท',prov:'นนทบุรี',brand:'BYD',model:'Atto 3',year:'2024',owner:'คุณกานต์ ธาราทิพย์',tel:'081-777-2049',mile:'18400',vin:'LGXC74C4XP',engine:'TZ200XS',sv:'เปลี่ยนกรองแอร์ G-Part EV + เช็คระบบหล่อเย็นแบต'},
  {when:'พุธ 13:30',plateL:'ผก',prov:'สมุทรปราการ',brand:'Isuzu',model:'D-Max 3.0 Ddi',year:'2020',owner:'หจก.ขนส่งรุ่งเรือง',tel:'02-388-1177',mile:'187500',vin:'MP1TFS86JT',engine:'4JJ3-77190',sv:'เปลี่ยนถ่ายน้ำมันเครื่อง + ไส้กรองโซล่า'},
  {when:'ศุกร์ 15:00',plateL:'8ฉฉ',prov:'ปทุมธานี',brand:'Toyota',model:'Yaris Cross HEV',year:'2024',owner:'คุณนุ่น พิมพ์ลดา',tel:'086-901-5544',mile:'9800',vin:'MR2B29F3PP',engine:'M15A-30581',sv:'ล้างแอร์ + เปลี่ยนกรองแอร์ Protect Filter'},
  {when:'อาทิตย์ 11:00',plateL:'2ฒณ',prov:'กรุงเทพมหานคร',brand:'Ford',model:'Ranger Wildtrak',year:'2022',owner:'คุณเดช พลภักดี',tel:'089-224-8813',mile:'64200',vin:'MNBUMFF80N',engine:'YN2S-51377',sv:'ตรวจเบรก + ช่วงล่างก่อนเดินทางไกล'}];
const SIM_INQS=[
  {plateL:'5ทท',prov:'กรุงเทพมหานคร',brand:'Mazda',model:'2 Skyactiv-D',year:'2019',owner:'คุณโบว์ ชลิดา',tel:'084-556-7712',mile:'88400',txt:'สตาร์ทตอนเช้าเครื่องสั่นแรง ควันขาวออกท่อ 2-3 นาทีแล้วหาย เป็นมาอาทิตย์กว่า น้ำมันเครื่องพร่องเร็วผิดปกติ'},
  {plateL:'9กบ',prov:'นนทบุรี',brand:'MG',model:'ZS EV',year:'2022',owner:'คุณต้น วราเทพ',tel:'092-118-3306',mile:'45100',txt:'ชาร์จ AC ที่บ้านแล้วตัดเองบ่อย ขึ้นเตือนรูปกุญแจสีเหลือง แอร์เย็นช้ากว่าเดิมมาก'},
  {plateL:'4จร',prov:'สมุทรปราการ',brand:'Toyota',model:'Vios 1.5',year:'2017',owner:'คุณแอน สุกัญญา',tel:'081-440-9928',mile:'132600',txt:'เกียร์กระตุกตอนเปลี่ยนจาก 1 ไป 2 เวลารถร้อน มีเสียงหอนเบาๆ ความเร็ว 60-80'},
  {plateL:'7ขจ',prov:'ปทุมธานี',brand:'Honda',model:'CR-V 2.4',year:'2018',owner:'คุณบอย ครรชิต',tel:'095-667-2210',mile:'109800',txt:'พวงมาลัยหนักผิดปกติตอนเลี้ยวซ้าย มีเสียงดังกึกๆ ใต้ท้องตอนขึ้นลูกระนาด'},
  {plateL:'6มม',prov:'กรุงเทพมหานคร',brand:'NETA',model:'V-II',year:'2024',owner:'คุณฟ้า ปวีณ์',tel:'083-901-7845',mile:'12300',txt:'จอเซ็นเตอร์ดับเองแล้วรีบูตระหว่างขับ กล้องถอยไม่ขึ้นภาพบางครั้ง'}];
const SIM_SOS=[
  {type:'🔋 แบตหมด',plateL:'5ขจ',prov:'กรุงเทพมหานคร',car:'BYD Atto 3 · ปั๊ม ปตท. ลาดพร้าว 64 (~1.8 กม.)',kit:'แบต 12V เสริม LN1 45Ah · EV แจ้งช่างก่อนพ่วง'},
  {type:'🛞 ยางแบน',plateL:'1นบ',prov:'นนทบุรี',car:'Toyota Fortuner · หน้าเซ็นทรัล เวสต์เกต (~2.4 กม.)',kit:'ยาง 265/60R18 · มียางอะไหล่ใต้ท้อง ขอเครื่องมือถอด'},
  {type:'⛽ น้ำมันหมด',plateL:'3ถถ',prov:'ปทุมธานี',car:'Isuzu MU-X · ถ.รังสิต-นครนายก คลอง 4 ขาเข้า (~3.1 กม.)',kit:'ดีเซล B7 ขอ 10 ลิตรพอถึงปั๊ม'},
  {type:'🔒 กุญแจติดในรถ',plateL:'8พร',prov:'กรุงเทพมหานคร',car:'Honda City · ลานจอดตลาดนัดเลียบด่วนรามอินทรา (~2.0 กม.)',kit:'ระบบ keyless · เจ้าของยืนยันตัวตนพร้อมเล่มทะเบียน'}];
function pxSimBook(){
  ensurePX();
  const i=(DB.px.seq=(DB.px.seq||0)+1);
  const demo={...SIM_BOOKS[i%SIM_BOOKS.length]};
  demo.plateN=String(1000+((i*731)%9000));
  demo.vin=demo.vin+String(100000+i*7).slice(-6);
  DB.px.queue.unshift({id:uid(),st:'wait',...demo});
  pxSave(); renderPxBook(); pxBadge();
  bellSound();
  toast('📲 คิวจองใหม่จาก BOOK — '+demo.brand+' '+demo.model+' ('+demo.plateL+' '+demo.plateN+') นัด '+demo.when);
}
function pxSimInq(){
  ensurePX();
  const i=(DB.px.seq=(DB.px.seq||0)+1);
  const demo={...SIM_INQS[i%SIM_INQS.length]};
  demo.plateN=String(1000+((i*577)%9000));
  DB.px.inq.unshift({id:uid(),st:'wait',...demo});
  pxSave(); renderPxInq(); pxBadge();
  bellSound();
  toast('📝 ลูกค้าแจ้งอาการใหม่ — '+demo.brand+' '+demo.model+' ('+demo.plateL+' '+demo.plateN+')');
}
function pxSimSos(){
  ensurePX();
  const i=(DB.px.seq=(DB.px.seq||0)+1);
  const demo={...SIM_SOS[i%SIM_SOS.length]};
  demo.plateN=String(1000+((i*389)%9000));
  DB.px.sos.unshift({id:uid(),st:'wait',...demo});
  pxSave(); renderPxSos(); pxBadge();
  bellSound();
  toast('🆘 เหตุฉุกเฉินใกล้อู่ — '+demo.type+' '+demo.plateL+' '+demo.plateN);
}
function pxSimLearn(){
  ensurePX();
  const packs=[
    {title:'ตารางแรงขันน็อตล้อ (Torque) รถยอดนิยม',cat:'ระบบส่งกำลัง',vis:'published',by:'ช่างเอก',desc:'เก๋งญี่ปุ่น 103-108 Nm · กระบะ 118-127 Nm · EV ล้อ 18"+ 140 Nm — ขันด้วยประแจปอนด์เท่านั้น ห้ามใช้บล็อกลมยิงจนสุด เกลียวยืดเสี่ยงล้อหลุด'},
    {title:'จุดต่อสายพ่วงแบต Hybrid Toyota (ห้ามพ่วงผิดขั้ว)',cat:'ปริมาณเติมน้ำยาแอร์',vis:'published',by:'ช่างหนึ่ง',desc:'จุดพ่วงอยู่กล่องฟิวส์ห้องเครื่องเท่านั้น ห้ามพ่วงตรงขั้วแบตเสริมท้ายรถ · หลังติดเครื่องถอดสายย้อนลำดับ และรอ READY ก่อนปลด'},
    {title:'เช็คลิสต์ก่อนคืนรถลูกค้า 12 ข้อ (ภายในอู่)',cat:'การแก้ Code',vis:'private',by:'เจ้าของอู่',desc:'1.ลบ code+ตรวจ readiness 2.เช็คแรงดันลมยาง 4 ล้อ+อะไหล่ 3.ไล่ระดับของเหลว 5 จุด 4.ทดสอบขับ 3 กม. 5.เก็บเบาะ/พวงมาลัยด้วยพลาสติกก่อนส่งมอบ ...'}
  ];
  let added=0;
  packs.forEach(p=>{
    if(DB.px.learn.some(x=>x.title===p.title))return;
    DB.px.learn.unshift({id:uid(),date:iso(),kind:'note',fname:'',mime:'',data:null,...p});
    added++;
  });
  pxSave();
  if($('#v-techroom').classList.contains('on'))renderPxLearn();
  toast(added?('📚 เติมความรู้ตัวอย่าง '+added+' ชิ้นแล้ว — ดูที่เมนู P2 ห้องข้อมูลเทคนิค'):'ชุดตัวอย่างถูกเติมไว้แล้ว — ดูที่เมนู P2');
}
function pxResetDemo(){
  if(!confirm('รีเซ็ตข้อมูลสาธิตโมดูล ProX ทั้งหมด?\n(คิวจอง/อาการเสีย/SOS/Coins/ความรู้/คำขอสินค้า — ข้อมูล BaziX เดิมไม่ถูกแตะ)'))return;
  DB.px=null; ensurePX(); pxSave();
  pxGo('book'); pxBadge();
  toast('⟳ รีเซ็ตข้อมูลสาธิต ProX แล้ว — เริ่มชุดทดสอบใหม่ได้เลย');
}
function renderPxBookNet(){
  const rows=PXNET.q;
  $('#pxBookCount').textContent='🌐 '+rows.filter(x=>x.status==='wait').length+' งานรอรับ (ออนไลน์จริง)';
  const S={wait:['#fff3cd;color:#7a5600','รอรับ'],accepted:['#e6f4ea;color:#1f7a4d','รับแล้ว'],billed:['#fdebd0;color:#9a5b00','รอชำระ'],paid:['#e6f4ea;color:#1f7a4d','✓ จบงาน']};
  $('#pxBookTbl tbody').innerHTML=rows.map(b=>{
    const s=S[b.status]||S.wait;let act='';
    if(b.status==='wait')act='<button class="btn pri sm" onclick="pxNetAccept('+b.id+')">รับเข้าระบบ → เปิดใบเสนอราคา</button>';
    if(b.status==='accepted')act='<input id="nAmt'+b.id+'" type="number" placeholder="฿ ยอดสุทธิ" class="mono" style="width:110px"> <button class="btn sm" onclick="pxNetBill('+b.id+')">🧾 ออกใบเสร็จ</button>';
    if(b.status==='billed')act='<span class="mono">'+b.rc_no+' · '+money(b.amount)+'</span> <button class="btn pri sm" onclick="pxNetPay('+b.id+')">💵 รับชำระ → Coins เครือ</button>';
    if(b.status==='paid')act='<span class="mono" style="color:#1f7a4d">'+b.rc_no+' · +'+Math.floor(b.amount/100)+' Coins</span>';
    return '<tr><td>#'+b.id+'<br><span class="hint">'+String(b.created_at||'').slice(5,16)+'</span></td>'
      +'<td class="mono">'+b.plate+'</td>'
      +'<td>'+(b.owner||'-')+'<br><span class="hint">'+(b.car||'')+'</span></td>'
      +'<td>'+b.service+'</td><td class="ctr">—</td>'
      +'<td class="ctr"><span class="tag" style="background:'+s[0]+'">'+s[1]+'</span></td>'
      +'<td class="ctr">'+act+'</td></tr>';
  }).join('');
  $('#pxBookEmpty').style.display=rows.length?'none':'';
  if(!rows.length)$('#pxBookEmpty').textContent='🌐 ออนไลน์แล้ว — รอคิวจองจากมือถือลูกค้าจริง (เปิด BOOK แล้วจองเข้าสาขานี้)';
}
function renderPxBook(){
  ensurePX();
  if(PXNET.on){renderPxBookNet();return}
  const rows=DB.px.queue;
  $('#pxBookCount').textContent=rows.filter(x=>x.st==='wait').length+' งานรอรับ';
  const tb=$('#pxBookTbl tbody');
  tb.innerHTML=rows.map(j=>'<tr>'
    +'<td>'+j.when+'</td>'
    +'<td class="mono">'+j.plateL+' '+j.plateN+'<br><span class="hint">'+(j.prov||'')+'</span></td>'
    +'<td>'+j.brand+' '+j.model+' '+(j.year||'')+'<br><span class="hint">'+(j.owner||'')+' · '+(j.tel||'')+'</span></td>'
    +'<td>'+(j.sv||'')+'</td>'
    +'<td class="ctr mono">'+(j.mile?Number(j.mile).toLocaleString('th-TH'):'-')+'</td>'
    +'<td class="ctr">'+(j.st==='wait'?'<span class="tag" style="background:#fff3cd;color:#7a5600">รอรับ</span>':'<span class="tag" style="background:#e6f4ea;color:#1f7a4d">'+(j.note||'รับแล้ว')+'</span>')+'</td>'
    +'<td class="ctr">'+(j.st==='wait'?'<button class="btn pri sm" onclick="pxAcceptBook(\''+j.id+'\')">รับเข้าระบบ → เปิดใบเสนอราคา</button>':'<button class="btn sm" onclick="go(\'quote\')">ดูเมนู 03 ›</button>')+'</td>'
    +'</tr>').join('');
  $('#pxBookEmpty').style.display=rows.length?'none':'';
}
/* ---- อาการเสีย → ใบเสนอราคาอัตโนมัติ ---- */
function pxQuoteFromInq(id){
  ensurePX();
  const j=DB.px.inq.find(x=>x.id===id); if(!j||j.st!=='wait')return;
  const {c,isNew}=pxEnsureCust(j);
  const probs=[j.txt.slice(0,120),'',''];
  const q={id:uid(),no:pxQuoteNo(),date:iso(),jobIn:iso(),custId:c.id,vehIdx:0,mile:j.mile||'',
    probs,finds:[],tier:c.tier||'C',items:[],disc:0,vat:DB.shop.vatReg!==false?7:0,
    tech:'',techName:'',byPos:'',byName:'',apPos:'',apName:'',status:'ร่าง',bookRef:'BOOK · ลูกค้าแจ้งอาการเอง'};
  DB.quotes.push(q);
  j.st='done'; j.note='ออก '+q.no;
  try{ logAudit('quote',{id:q.id,no:q.no},'save','ใบเสนอราคาอัตโนมัติจากอาการเสียที่ลูกค้าแจ้ง (BOOK) · '+j.plateL+' '+j.plateN); }catch(e){}
  pxSave(); renderPxInq(); pxBadge();
  toast('เปิดใบเสนอราคา '+q.no+' — อาการ/รถ/ไมล์ ถูกกรอกให้แล้ว อู่เติมรายการซ่อมและราคาในเมนู 03');
}
function renderPxInq(){
  ensurePX();
  const rows=DB.px.inq;
  $('#pxInqCount').textContent=rows.filter(x=>x.st==='wait').length+' รอออกใบเสนอราคา';
  $('#pxInqTbl tbody').innerHTML=rows.map(j=>'<tr>'
    +'<td class="mono">'+j.plateL+' '+j.plateN+'</td>'
    +'<td>'+j.brand+' '+j.model+'<br><span class="hint">'+(j.owner||'')+'</span></td>'
    +'<td>“'+j.txt+'”</td>'
    +'<td class="ctr mono">'+(j.mile?Number(j.mile).toLocaleString('th-TH'):'-')+'</td>'
    +'<td class="ctr">'+(j.st==='wait'?'<span class="tag" style="background:#fff3cd;color:#7a5600">รอ</span>':'<span class="tag" style="background:#e6f4ea;color:#1f7a4d">'+(j.note||'เรียบร้อย')+'</span>')+'</td>'
    +'<td class="ctr">'+(j.st==='wait'?'<button class="btn pri sm" onclick="pxQuoteFromInq(\''+j.id+'\')">เปิดใบเสนอราคาอัตโนมัติ</button>':'<button class="btn sm" onclick="go(\'quote\')">ดูเมนู 03 ›</button>')+'</td>'
    +'</tr>').join('');
  $('#pxInqEmpty').style.display=rows.length?'none':'';
}
/* ---- SOS ---- */
function pxSosAccept(id){
  const j=DB.px.sos.find(x=>x.id===id); if(!j)return;
  j.st='done';
  pxSave(); renderPxSos(); pxBadge();
  toast('รับงานฉุกเฉินแล้ว — ลูกค้าเห็นสถานะ "อู่กำลังไปหา" ทันทีบนแอป BOOK');
}
function renderPxSos(){
  ensurePX();
  const rows=DB.px.sos;
  $('#pxSosCount').textContent=rows.filter(x=>x.st==='wait').length+' เหตุรอรับ';
  $('#pxSosTbl tbody').innerHTML=rows.map(j=>'<tr>'
    +'<td>'+j.type+'</td>'
    +'<td class="mono">'+j.plateL+' '+j.plateN+'</td>'
    +'<td>'+j.car+'</td>'
    +'<td><span class="hint">'+j.kit+'</span></td>'
    +'<td class="ctr">'+(j.st==='wait'?'<span class="tag" style="background:#fdecea;color:#a8342a">ด่วน</span>':'<span class="tag" style="background:#e6f4ea;color:#1f7a4d">รับแล้ว</span>')+'</td>'
    +'<td class="ctr">'+(j.st==='wait'?'<button class="btn pri sm" onclick="pxSosAccept(\''+j.id+'\')">รับงานฉุกเฉิน</button>':'—')+'</td>'
    +'</tr>').join('');
  $('#pxSosEmpty').style.display=rows.length?'none':'';
}
/* ---- Coins: ออกจากใบเสร็จ (เมนู 04) ที่ชำระครบจริงเท่านั้น ---- */
function pxScanCoins(){
  ensurePX();
  let made=0;
  DB.receipts.forEach(r=>{
    if(!r.paid) return;
    if(DB.px.coined[r.id]) return;
    const c=DB.cust.find(x=>x.id===r.custId);
    const v=c&&(c.vehicles||[])[r.vehIdx||0];
    const total=(typeof quoteTotals==='function')?quoteTotals(r).total:0;
    const earn=Math.floor(total/100);
    if(earn<=0){ DB.px.coined[r.id]=true; return; }
    DB.px.coins.unshift({rcNo:r.no||r.id,plate:v?(v.plateL+' '+v.plateN):'-',cust:c?c.name:'-',amt:total,earn,date:r.paidDate||iso()});
    DB.px.coined[r.id]=true;
    made++;
  });
  pxSave(); renderPxCoins();
  $('#pxCoinInfo').textContent=made?('ออกใหม่ '+made+' ใบเสร็จ'):'ไม่มีใบเสร็จชำระครบที่ยังไม่ได้ออก Coins';
  if(made)toast('ออก DriveGo Coins จากใบเสร็จชำระแล้ว '+made+' ใบ — ลูกค้าเห็นในแอป BOOK ทันที');
}
function renderPxCoins(){
  ensurePX();
  const all=DB.px.coins;
  const rows=all.slice(0,100);
  $('#pxCoinInfo').textContent=all.length>100?('แสดง 100 รายการล่าสุด จากทั้งหมด '+all.length.toLocaleString('th-TH')+' ใบ'):'';
  $('#pxCoinTbl tbody').innerHTML=rows.map(x=>'<tr>'
    +'<td class="mono">'+x.rcNo+'</td><td class="mono">'+x.plate+'</td><td>'+x.cust+'</td>'
    +'<td class="num mono">'+money(x.amt)+'</td><td class="num mono" style="color:#7a5600;font-weight:600">+'+x.earn+'</td>'
    +'<td class="mono">'+x.date+'</td></tr>').join('');
  $('#pxCoinEmpty').style.display=all.length?'none':'';
  const bal={};
  all.forEach(x=>{const k=x.plate+'|'+x.cust;bal[k]=(bal[k]||0)+x.earn});
  const bk=Object.entries(bal);
  $('#pxCoinBalTbl tbody').innerHTML=bk.map(([k,v])=>{const [pl,cn]=k.split('|');
    return '<tr><td class="mono">'+pl+'</td><td>'+cn+'</td><td class="num mono" style="font-weight:600">'+v.toLocaleString('th-TH')+' Coin</td></tr>'}).join('');
  $('#pxCoinBalEmpty').style.display=bk.length?'none':'';
}
/* ---- หน้าร้านบนแอป BOOK ---- */
function fillPxShop(){
  ensurePX();
  const s=DB.px.shop;
  $('#pxShopDesc').value=s.desc||'';
  $('#pxShopLine').value=s.line||'';
  $('#pxShopFb').value=s.fb||'';
  $('#pxShopPh').value=s.ph||'';
  $('#pxShopInfo').textContent='ชื่อร้าน/โทร ใช้จากตั้งค่าองค์กร: '+(DB.shop.name||'-')+' · '+(DB.shop.tel||'-');
}
function pxSaveShop(){
  ensurePX();
  const s=DB.px.shop;
  s.desc=$('#pxShopDesc').value.trim();
  s.line=$('#pxShopLine').value.trim();
  s.fb=$('#pxShopFb').value.trim();
  s.ph=$('#pxShopPh').value.split(',').map(x=>x.trim()).filter(Boolean).slice(0,10).join(', ');
  $('#pxShopPh').value=s.ph;
  pxSave();
  toast('บันทึกหน้าร้านบนแอปแล้ว — ผู้ใช้ DriveGo BOOK เห็นข้อมูลใหม่ทันที ('+(s.ph?s.ph.split(',').length:0)+'/10 รูป)');
}
/* ---- คลังกลาง ProX → เพิ่มเข้าทะเบียนอะไหล่ (DB.stock schema เดิมทุกช่อง) ---- */
const PXCAT=[
  {code:'PX-CF01',oem:'87139-0K070',name:'กรองแอร์ Protect Filter — Toyota (Vios/Yaris/Cross)',cat:'ไส้กรอง',unit:'ชิ้น',cost:95,pa:260},
  {code:'PX-CF02',oem:'80292-TG0-Q01',name:'กรองแอร์ Protect Filter — Honda (City/Civic/HR-V)',cat:'ไส้กรอง',unit:'ชิ้น',cost:95,pa:260},
  {code:'PX-CF03',oem:'GPART-EV01',name:'กรองแอร์ G-Part EV Series — BYD Atto3/Dolphin',cat:'ไส้กรอง',unit:'ชิ้น',cost:120,pa:320},
  {code:'PX-OF01',oem:'90915-YZZD4',name:'กรองน้ำมันเครื่อง — Toyota เบนซิน/ไฮบริด',cat:'ไส้กรอง',unit:'ลูก',cost:70,pa:170},
  {code:'PX-BT01',oem:'LN1-45',name:'แบตเตอรี่ 12V LN1 45Ah (รองรับ Hybrid/EV เสริม)',cat:'อะไหล่ไฟฟ้า',unit:'ลูก',cost:1750,pa:2590},
  {code:'PX-WP01',oem:'-',name:'ใบปัดน้ำฝนซิลิโคน 24"+16" (คู่)',cat:'อะไหล่สิ้นเปลือง',unit:'คู่',cost:180,pa:390},
  {code:'PX-RF01',oem:'R-134a',name:'น้ำยาแอร์ R-134a ถัง 13.6 กก. (ราคาตรงซัพพลาย)',cat:'น้ำมัน / ของเหลว',unit:'ถัง',cost:2350,pa:0},
  {code:'PX-RF02',oem:'R-1234yf',name:'น้ำยาแอร์ R-1234yf ถัง 4.5 กก. (รถยุโรป/EV ใหม่)',cat:'น้ำมัน / ของเหลว',unit:'ถัง',cost:6900,pa:0}
];
function renderPxCat(){
  ensurePX();
  if(PXNET.on){renderPxCatNet();return}
  const CAT=DB.px.catalog;
  $('#pxCatCount').textContent=CAT.length+' รายการ';
  $('#pxCatTbl tbody').innerHTML=CAT.map((x,i)=>{
    const dup=DB.stock.some(s=>s.code.toLowerCase()===x.code.toLowerCase());
    return '<tr><td class="mono">'+x.code+'</td><td class="mono">'+x.oem+'</td><td>'+x.name+'</td><td>'+x.cat+'</td>'
      +'<td class="num mono">'+money(x.cost)+'</td><td class="num mono">'+(x.pa?money(x.pa):'-')+'</td>'
      +'<td class="ctr">'+(dup?'<span class="tag" style="background:#e6f4ea;color:#1f7a4d">อยู่ในทะเบียนแล้ว</span>'
        :'<button class="btn pri sm" onclick="pxAddStock('+i+')">+ เพิ่มเข้าทะเบียนอะไหล่</button>')+'</td></tr>';
  }).join('');
}
function pxAddStock(i){
  const x=DB.px.catalog[i];
  if(DB.stock.some(s=>s.code.toLowerCase()===x.code.toLowerCase())){renderPxCat();return}
  const rec={id:uid(),code:x.code,oem:x.oem,name:x.name,cat:x.cat,unit:x.unit,
    cost:x.cost,pa:x.pa||0,pb:0,pc:0,qty:0,min:2,max:12,stale:6,lastMove:iso(),warr:'',warrNote:'',zone:'',shelf:'',loc:''};
  try{ stampRec(rec,null); }catch(e){}
  DB.stock.push(rec);
  try{ logAudit('stock',{id:rec.id,no:rec.code},'save','เพิ่มจากคลังกลาง DriveGo ProX · ราคาตรง ทุน '+money(rec.cost)); }catch(e){}
  pxSave(); renderPxCat();
  toast('เพิ่ม '+x.code+' เข้าทะเบียนอะไหล่แล้ว (คงเหลือ 0 — บันทึกรับของผ่านเมนู 06 ตามโฟลว์เดิม)');
}
/* ---- แจ้งเพิ่มสินค้าใหม่ → HeadAdmin DriveGo อนุมัติ → ขึ้นคลังกลาง ---- */
function openPxReq(){
  ['rqName','rqOem','rqCost','rqNote'].forEach(id=>{const el=$('#'+id);if(el)el.value='';});
  $('#mPxReq').classList.add('on');
}
function sendPxReq(){
  ensurePX();
  const name=$('#rqName').value.trim();
  if(!name){toast('กรอกชื่อสินค้าก่อนส่งคำขอ');return}
  const req={id:uid(),date:iso(),name,oem:$('#rqOem').value.trim()||'-',cat:$('#rqCat').value,
    unit:$('#rqUnit').value.trim()||'ชิ้น',cost:parseFloat($('#rqCost').value)||0,
    note:$('#rqNote').value.trim(),st:'wait'};
  DB.px.reqs.unshift(req);
  pxSave(); renderPxReqs();
  $('#mPxReq').classList.remove('on');
  toast('📨 ส่งคำขอ "'+name.slice(0,30)+'" ถึง HeadAdmin DriveGo แล้ว — รออนุมัติ');
  try{ logAudit('stock',{id:req.id,no:'PX-REQ'},'save','แจ้งขอเพิ่มสินค้าใหม่เข้าคลังกลาง ProX: '+name); }catch(e){}
  /* เดโม: จำลอง HeadAdmin อนุมัติภายใน ~8 วินาที (ระบบจริงผ่านเซิร์ฟเวอร์กลาง) */
  setTimeout(()=>pxApproveReq(req.id),8000);
}
function pxApproveReq(id){
  ensurePX();
  const r=DB.px.reqs.find(x=>x.id===id); if(!r||r.st!=='wait')return;
  r.st='approved';
  const seq=DB.px.catalog.filter(x=>x.code.startsWith('PX-NEW')).length+1;
  const code='PX-NEW'+String(seq).padStart(2,'0');
  r.code=code;
  DB.px.catalog.push({code,oem:r.oem,name:r.name,cat:r.cat,unit:r.unit,cost:r.cost||0,pa:r.cost?Math.round(r.cost*2.4):0});
  pxSave();
  bellSound();
  toast('🔔 HeadAdmin DriveGo อนุมัติ "'+r.name.slice(0,28)+'" แล้ว — ขึ้นคลังกลางเป็นรหัส '+code+' กด + เพิ่มเข้าทะเบียนได้เลย');
  renderPxReqs(); if($('#s-px')&&$('#s-px').style.display!=='none')renderPxCat();
}
function renderPxReqs(){
  ensurePX();
  const rows=DB.px.reqs; const tb=$('#pxReqTbl tbody'); if(!tb)return;
  $('#pxReqCount').textContent=rows.filter(x=>x.st==='wait').length+' รออนุมัติ / '+rows.length+' คำขอ';
  tb.innerHTML=rows.map(r=>'<tr>'
    +'<td class="mono">'+r.date+'</td>'
    +'<td><b>'+r.name+'</b>'+(r.oem&&r.oem!=='-'?' <span class="hint mono">OEM '+r.oem+'</span>':'')
    +(r.note?'<br><span class="hint">'+r.note+'</span>':'')+'</td>'
    +'<td>'+r.cat+'</td>'
    +'<td class="num mono">'+(r.cost?money(r.cost):'-')+'</td>'
    +'<td class="ctr">'+(r.st==='wait'
      ?'<span class="reqst rq-w">⏳ รอ HeadAdmin อนุมัติ</span>'
      :'<span class="reqst rq-a">✓ อนุมัติแล้ว · '+(r.code||'')+'</span>')+'</td>'
    +'</tr>').join('');
  $('#pxReqEmpty').style.display=rows.length?'none':'';
}
/* ---- ห้องข้อมูลเทคนิค ---- */
const PX_TECH=[
  {m:'Toyota Corolla Cross 1.8 HEV',ref:'R-1234yf',g:'475±25',oil:'ND-OIL 12 (POE 40cc)',batt:'LN1 45Ah',cf:'Protect Filter PX-CF01',note:'ไฮบริด: คอมไฟฟ้า ห้ามใช้น้ำมัน PAG เด็ดขาด',isNew:false},
  {m:'Toyota Yaris ATIV 2022+',ref:'R-134a',g:'420±20',oil:'ND-OIL 8 (PAG46)',batt:'LN0 38Ah',cf:'Protect Filter PX-CF01',note:'',isNew:false},
  {m:'Honda City / City e:HEV',ref:'R-134a',g:'390±20',oil:'PAG46 80cc',batt:'44B19L / LN1',cf:'Protect Filter PX-CF02',note:'e:HEV ตรวจชนิดคอมก่อนเติมน้ำมัน',isNew:false},
  {m:'Honda HR-V e:HEV',ref:'R-1234yf',g:'450±25',oil:'POE (คอมไฟฟ้า)',batt:'LN1 45Ah',cf:'Protect Filter PX-CF02',note:'คอมไฟฟ้า — ใช้เครื่องชาร์จสายแยก POE เท่านั้น',isNew:true},
  {m:'Isuzu D-Max 1.9/3.0 Ddi',ref:'R-134a',g:'500±25',oil:'PAG46 120cc',batt:'85D26L',cf:'PX-CF04 (แจ้งเพิ่มได้)',note:'รุ่นแค็บ/4 ประตู ปริมาณต่างกัน เช็คสติกเกอร์ฝากระโปรง',isNew:false},
  {m:'Mazda 2 (DJ) / CX-3',ref:'R-134a',g:'430±20',oil:'PAG46',batt:'Q-85 (i-stop)',cf:'แจ้งเพิ่มในคลังกลาง',note:'i-stop ต้องใช้แบต EFB Q-85 เท่านั้น มิฉะนั้นระบบตัด',isNew:false},
  {m:'MG ZS EV',ref:'R-134a',g:'520±30',oil:'POE (คอมไฟฟ้า)',batt:'LN1 45Ah (12V)',cf:'G-Part EV PX-CF03',note:'EV: ปลด service plug ก่อนงานระบบแรงดันสูงทุกครั้ง',isNew:false},
  {m:'BYD Atto 3 / Dolphin',ref:'R-1234yf',g:'560±30',oil:'POE 25 (ห้ามปน PAG)',batt:'LN1 45Ah (12V)',cf:'G-Part EV PX-CF03',note:'EV heat-pump: เติมตามสเปคเป๊ะ น้อย/เกินกระทบระยะทางวิ่ง',isNew:false},
  {m:'BYD Seal / Sealion 6',ref:'R-1234yf',g:'620±30',oil:'POE 25',batt:'LN2 60Ah (12V)',cf:'G-Part EV PX-CF03',note:'',isNew:true},
  {m:'Tesla Model 3 / Y (LHD→RHD)',ref:'R-1234yf',g:'~1,000',oil:'POE เฉพาะทาง',batt:'ลิเธียม 15.5V',cf:'แจ้งเพิ่มในคลังกลาง',note:'ระบบ octovalve — แนะนำส่งศูนย์เฉพาะทางถ้าไม่มีเครื่องมือ',isNew:true},
  {m:'Ford Ranger / Everest 2.0',ref:'R-134a',g:'560±25',oil:'PAG46 150cc',batt:'LN3 70Ah (Start-Stop ใช้ AGM)',cf:'PX-CF05 (แจ้งเพิ่มได้)',note:'',isNew:false},
  {m:'NETA V / V-II',ref:'R-134a',g:'480±25',oil:'POE (คอมไฟฟ้า)',batt:'LN1 45Ah (12V)',cf:'G-Part EV PX-CF03',note:'EV จีน: เช็คหัวชาร์จน้ำยาเป็น adapter เฉพาะบางล็อต',isNew:false}
];
function renderPxTech(){
  const q=($('#pxTechQ').value||'').toLowerCase();
  const rows=PX_TECH.filter(x=>!q||x.m.toLowerCase().includes(q)||x.ref.toLowerCase().includes(q));
  $('#pxTechCount').textContent=rows.length+' รุ่น';
  $('#pxTechTbl tbody').innerHTML=rows.map(x=>'<tr>'
    +'<td><b>'+x.m+'</b>'+(x.isNew?' <span class="reqst rq-a" style="font-size:10px">NEW จาก HQ</span>':'')+'</td>'
    +'<td class="mono">'+x.ref+'</td><td class="ctr mono">'+x.g+'</td>'
    +'<td>'+x.oil+'</td><td class="mono">'+x.batt+'</td><td>'+x.cf+'</td>'
    +'<td><span class="hint">'+(x.note||'—')+'</span></td></tr>').join('');
}

/* ---- คลังความรู้: บทความ + คลิป · หมวดหมู่ · Private/Published ---- */
let trPane='prox', learnVisMode='published', pxTopicSel='ทั้งหมด', pxPendFile=null;
function trGo(r){
  trPane=r;
  $$('#trTabs button,#trTabsIn button').forEach(b=>b.classList.toggle('on',b.dataset.r===r));
  const spec=r==='prox';
  $('#tech-spec').style.display=spec?'':'none';
  $('#tech-learn').style.display=spec?'none':'';
  if(spec){ renderPxTech(); return; }
  learnVisMode=r==='pub'?'published':'private';
  renderPxLearn();
}
function renderPxTopics(){
  const all=['ทั้งหมด',...DB.px.topics];
  $('#pxTopicChips').innerHTML=all.map(t=>`<button class="topicChip ${pxTopicSel===t?'on':''}" onclick="pxTopicSel='${t.replace(/'/g,"\\'")}';renderPxLearn()">${t}</button>`).join('');
}
function lrnIcon(x){
  if(x.kind==='clip')return '🎬';
  if(x.mime&&x.mime.startsWith('image/'))return '🖼️';
  if(x.mime==='application/pdf')return '📕';
  if(x.fname)return '📎';
  return '📝';
}
function renderPxLearn(){
  ensurePX(); renderPxTopics();
  const modeRows=DB.px.learn.filter(x=>x.vis===learnVisMode);
  const rows=modeRows.filter(x=>pxTopicSel==='ทั้งหมด'||x.cat===pxTopicSel);
  $('#pxLearnCount').textContent=(learnVisMode==='published'?'🌐 Publish Data · แบ่งปันเครือข่าย ProX · ':'🔒 Private Data · เฉพาะภายในอู่ · ')+modeRows.length+' รายการ';
  $('#pxLearnList').innerHTML=rows.map(x=>`
    <div class="lrnCard">
      <div class="lic2">${lrnIcon(x)}</div>
      <div class="lbody">
        <b>${x.title}</b>
        <div class="lmeta">📁 ${x.cat} · โดย ${x.by||'อู่'} · ${x.date}${x.fname?' · '+x.fname+(x.data?'':' (อ้างอิง — ไฟล์ใหญ่)'):''}</div>
        ${x.desc?`<div class="ldesc">${x.desc}</div>`:''}
      </div>
      <div class="lact">
        <span class="visw" onclick="pxToggleVis('${x.id}')" title="คลิกเพื่อสลับการมองเห็น">
          <span class="pv ${x.vis==='private'?'on':''}">🔒 Private</span><span class="pb ${x.vis==='published'?'on':''}">🌐 Published</span>
        </span>
        <div style="display:flex;gap:6px">
          ${(x.data||x.desc)?`<button class="btn" style="padding:4px 10px;font-size:12px" onclick="pxViewLearn('${x.id}')">เปิดดู</button>`:''}
          <button class="btn" style="padding:4px 10px;font-size:12px;color:var(--danger)" onclick="pxDelLearn('${x.id}')">ลบ</button>
        </div>
      </div>
    </div>`).join('');
  $('#pxLearnEmpty').style.display=rows.length?'none':'';
}
function pxToggleVis(id){
  const x=DB.px.learn.find(r=>r.id===id); if(!x)return;
  x.vis=x.vis==='private'?'published':'private';
  pxSave(); renderPxLearn();
  toast(x.vis==='published'?'🌐 แบ่งปัน "'+x.title.slice(0,26)+'" เข้าเครือข่าย DriveGo ProX แล้ว':'🔒 ตั้ง "'+x.title.slice(0,26)+'" เป็นส่วนตัวภายในอู่');
}
function pxDelLearn(id){
  const i=DB.px.learn.findIndex(r=>r.id===id); if(i<0)return;
  if(!confirm('ลบ "'+DB.px.learn[i].title+'" ?'))return;
  DB.px.learn.splice(i,1); pxSave(); renderPxLearn();
}
function openPxTopic(){ ensurePX(); $('#tpName').value=''; renderTpTbl(); $('#mPxTopic').classList.add('on'); }
function tpCount(t){ return DB.px.learn.filter(x=>x.cat===t).length; }
function renderTpTbl(){
  $('#tpTbl tbody').innerHTML=DB.px.topics.map((t,i)=>'<tr>'
    +'<td><input class="tpEdit" data-i="'+i+'" value="'+t.replace(/"/g,'&quot;')+'" style="width:100%"></td>'
    +'<td class="ctr mono">'+tpCount(t)+' ชิ้น</td>'
    +'<td class="ctr"><button class="btn sm" onclick="pxRenameTopic('+i+')" title="บันทึกชื่อใหม่">💾 บันทึก</button> '
    +'<button class="btn sm" style="color:var(--danger)" onclick="pxDelTopic('+i+')" title="ลบหมวด">🗑</button></td>'
    +'</tr>').join('');
}
function savePxTopic(){
  const n=$('#tpName').value.trim();
  if(!n){toast('กรอกชื่อหมวดก่อน');return}
  if(DB.px.topics.includes(n)){toast('มีหมวดนี้อยู่แล้ว');return}
  DB.px.topics.push(n); pxSave();
  $('#tpName').value='';
  renderTpTbl(); pxTopicSel=n; renderPxLearn();
  toast('+ เพิ่มหมวด "'+n+'" แล้ว');
}
function pxRenameTopic(i){
  const inp=document.querySelector('.tpEdit[data-i="'+i+'"]'); if(!inp)return;
  const oldName=DB.px.topics[i], n=inp.value.trim();
  if(!n){toast('ชื่อหมวดห้ามว่าง');inp.value=oldName;return}
  if(n===oldName){toast('ชื่อเดิมอยู่แล้ว — ไม่มีอะไรต้องแก้');return}
  if(DB.px.topics.includes(n)){toast('มีหมวดชื่อ "'+n+'" อยู่แล้ว — ใช้ชื่ออื่น');inp.value=oldName;return}
  DB.px.topics[i]=n;
  let moved=0;
  DB.px.learn.forEach(x=>{ if(x.cat===oldName){x.cat=n;moved++;} });
  if(pxTopicSel===oldName)pxTopicSel=n;
  pxSave(); renderTpTbl(); renderPxLearn();
  toast('💾 แก้ชื่อหมวด "'+oldName+'" → "'+n+'"'+(moved?' — ย้ายเนื้อหาตาม '+moved+' ชิ้น':''));
}
function pxDelTopic(i){
  const t=DB.px.topics[i];
  if(DB.px.topics.length<=1){toast('ต้องเหลือหมวดอย่างน้อย 1 หมวด');return}
  const n=tpCount(t);
  if(!confirm('ลบหมวด "'+t+'"'+(n?' ?\nมีเนื้อหา '+n+' ชิ้น จะถูกย้ายไปหมวด "ทั่วไป" (ไม่มีอะไรหาย)':' ?')))return;
  if(n){
    if(!DB.px.topics.includes('ทั่วไป'))DB.px.topics.push('ทั่วไป');
    DB.px.learn.forEach(x=>{ if(x.cat===t)x.cat='ทั่วไป'; });
  }
  DB.px.topics.splice(DB.px.topics.indexOf(t),1);
  if(pxTopicSel===t)pxTopicSel='ทั้งหมด';
  pxSave(); renderTpTbl(); renderPxLearn();
  toast('🗑 ลบหมวด "'+t+'" แล้ว'+(n?' — เนื้อหา '+n+' ชิ้นย้ายไป "ทั่วไป"':''));
}
function openPxLearn(){
  ensurePX(); pxPendFile=null;
  $('#lnTitle').value=''; $('#lnDesc').value=''; $('#lnFile').value=''; $('#lnFileInfo').textContent='';
  $('#lnCat').innerHTML=DB.px.topics.map(t=>`<option ${t===pxTopicSel?'selected':''}>${t}</option>`).join('');
  $('#lnVis').value=learnVisMode;
  $('#mPxLearn').classList.add('on');
}
(function(){
  const f=$('#lnFile');
  if(f)f.addEventListener('change',()=>{
    const file=f.files[0]; pxPendFile=null;
    if(!file){$('#lnFileInfo').textContent='';return}
    const isClip=file.type.startsWith('video/');
    const lim=(isClip?15:5)*1024*1024;
    const mb=(file.size/1048576).toFixed(1);
    if(file.size>lim){
      pxPendFile={fname:file.name,mime:file.type,data:null,kind:isClip?'clip':'file'};
      $('#lnFileInfo').textContent='⚠ '+file.name+' ('+mb+' MB) ใหญ่เกินเก็บในเครื่อง — จะบันทึกเป็นรายการอ้างอิง';
      return;
    }
    const rd=new FileReader();
    rd.onload=()=>{ pxPendFile={fname:file.name,mime:file.type,data:rd.result,kind:isClip?'clip':'file'};
      $('#lnFileInfo').textContent='✓ แนบ '+file.name+' ('+mb+' MB) '+(isClip?'— เปิดเล่นคลิปในระบบได้':'— เปิดดูในระบบได้'); };
    rd.readAsDataURL(file);
  });
})();
function savePxLearn(){
  const title=$('#lnTitle').value.trim();
  if(!title){toast('กรอกชื่อเรื่องก่อน');return}
  const rec={id:uid(),title,cat:$('#lnCat').value,vis:$('#lnVis').value,
    desc:$('#lnDesc').value.trim(),date:iso(),
    by:(typeof curEmp!=='undefined'&&curEmp&&curEmp.name)?curEmp.name:'อู่',
    kind:pxPendFile?pxPendFile.kind:'note',
    fname:pxPendFile?pxPendFile.fname:'',mime:pxPendFile?pxPendFile.mime:'',data:pxPendFile?pxPendFile.data:null};
  if(!rec.fname&&!rec.desc){toast('แนบไฟล์ หรือพิมพ์คำอธิบายอย่างน้อยหนึ่งอย่าง');return}
  DB.px.learn.unshift(rec); pxSave();
  $('#mPxLearn').classList.remove('on');
  pxTopicSel=rec.cat;
  if($('#v-techroom').classList.contains('on')) trGo(rec.vis==='published'?'pub':'prv');
  else renderPxLearn();
  toast((rec.kind==='clip'?'🎬 อัปโหลดคลิป':'📎 เพิ่มบทความ')+' "'+title.slice(0,26)+'" ('+(rec.vis==='published'?'🌐 Published':'🔒 Private')+') แล้ว');
}
function pxViewLearn(id){
  const x=DB.px.learn.find(r=>r.id===id); if(!x)return;
  $('#pxvTitle').textContent=x.title;
  let b='';
  if(x.desc)b+='<div style="font-size:13.5px;line-height:1.8;margin-bottom:12px">'+x.desc+'</div>';
  if(x.data){
    if(x.kind==='clip')b+='<video controls style="width:100%;border-radius:8px;background:#000" src="'+x.data+'"></video>';
    else if(x.mime.startsWith('image/'))b+='<img src="'+x.data+'" style="max-width:100%;border-radius:8px;border:1px solid var(--line2)">';
    else if(x.mime==='application/pdf')b+='<iframe src="'+x.data+'" style="width:100%;height:62vh;border:1px solid var(--line2);border-radius:8px"></iframe>';
    else b+='<a class="btn pri" download="'+x.fname+'" href="'+x.data+'">⬇ ดาวน์โหลด '+x.fname+'</a>';
  }else if(x.fname){
    b+='<div class="hint">📎 '+x.fname+' — ไฟล์ใหญ่ เก็บเป็นรายการอ้างอิง (ระบบจริงเปิดจากเซิร์ฟเวอร์กลาง)</div>';
  }
  $('#pxvBody').innerHTML=b;
  $('#mPxView').classList.add('on');
}

/* ═════ โหมดออนไลน์ ProX: ต่อเซิร์ฟเวอร์เครือ (Live v2 Multi-Branch) ═════ */
let PXNET={url:'',token:'',me:null,on:false,q:[],timer:null};
async function pxNetApi(p,opt){
  opt=opt||{};opt.headers=Object.assign({},opt.headers,PXNET.token?{Authorization:'Bearer '+PXNET.token}:{});
  const r=await fetch(PXNET.url+p,opt);return r.json();
}
async function pxNetToggle(){
  if(PXNET.on){pxNetOff();toast('🔌 ตัดการเชื่อมต่อ — กลับโหมดเดโมในเครื่อง');return}
  const u=($('#pxNetUrl').value||'').trim().replace(/\/+$/,'');
  if(!u){toast('กรอก URL เซิร์ฟเวอร์ก่อน');return}
  $('#pxNetSt').textContent='กำลังเชื่อมต่อ...';
  try{
    const r=await (await fetch(u+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:$('#pxNetUser').value.trim(),password:$('#pxNetPass').value})})).json();
    if(r.error)throw new Error(r.error);
    PXNET.url=u;PXNET.token=r.token;PXNET.me=r.user;PXNET.on=true;
    try{DB.px.net={url:u,user:$('#pxNetUser').value.trim()};pxSave();}catch(e){}
    $('#pxNetSt').textContent='🟢 ออนไลน์ · '+(r.user.branch?r.user.branch.name:r.user.display);
    $('#pxNetBtn').textContent='🔌 ตัดการเชื่อมต่อ';
    toast('🌐 เชื่อมเครือสำเร็จ — '+(r.user.branch?r.user.branch.name:r.user.display)+' · คิวจริงจากมือถือลูกค้าจะไหลเข้าตารางสด');
    pxNetPull();dcPull();pxStockReport(true);PXNET.timer=setInterval(()=>{pxNetPull();dcPull();pxStockReport(false);},7000);
  }catch(e){
    $('#pxNetSt').textContent='✗ '+(e.message||'เชื่อมไม่ได้');
  }
}
function pxNetOff(){
  PXNET.on=false;PXNET.token='';clearInterval(PXNET.timer);PXNET.q=[];
  $('#pxNetSt').textContent='ออฟไลน์ — โหมดเดโมในเครื่อง';
  $('#pxNetBtn').textContent='🔌 เชื่อมต่อสาขา';
  renderPxBook();pxBadge();
}
async function pxNetPull(){
  if(!PXNET.on)return;
  try{
    const q=await pxNetApi('/api/queue');
    if(Array.isArray(q)){
      const newWait=q.filter(x=>x.status==='wait').length,oldWait=PXNET.q.filter(x=>x.status==='wait').length;
      if(newWait>oldWait&&PXNET.q.length)toast('📲 มีคิวจองใหม่จากมือถือลูกค้า!');
      PXNET.q=q;
      if(pxPane==='book'&&$('#v-prox').classList.contains('on'))renderPxBook();
      pxBadge();
    }
  }catch(e){}
}
/* รับงานออนไลน์: แจ้งเซิร์ฟเวอร์ + สร้างลูกค้า/ใบเสนอราคาใน BaziX ควบคู่ */
async function pxNetAccept(id){
  const bk=PXNET.q.find(x=>x.id===id);if(!bk)return;
  const r=await pxNetApi('/api/accept/'+id,{method:'POST'});
  if(r.error){toast('✗ '+r.error);return}
  const [pl,pn]=String(bk.plate).split(' ');
  const {c,isNew}=pxEnsureCust({plateL:pl||bk.plate,plateN:pn||'',prov:'',brand:(bk.car||'').split(' ')[0]||'',
    model:(bk.car||'').split(' ').slice(1).join(' '),owner:bk.owner,tel:'',mile:'',vin:'',engine:'',year:''});
  const q={id:uid(),no:pxQuoteNo(),date:iso(),jobIn:iso(),custId:c.id,vehIdx:0,mile:'',
    probs:[bk.service||'งานจองจากเครือ DriveGo','',''],finds:[],tier:c.tier||'C',items:[],disc:0,
    vat:DB.shop.vatReg!==false?7:0,tech:'',techName:'',byPos:'',byName:'',apPos:'',apName:'',
    status:'ร่าง',bookRef:'เครือ DriveGo · ใบจอง #'+bk.id};
  DB.quotes.push(q);pxSave();
  toast((isNew?'สร้างลูกค้าใหม่ + ':'')+'เปิดใบเสนอราคา '+q.no+' (เมนู 03) — ลูกค้าเห็น "สาขายืนยันนัด" บนมือถือแล้ว');
  pxNetPull();
}
async function pxNetBill(id){
  const el=$('#nAmt'+id);const amt=parseInt(el&&el.value,10);
  if(!amt||amt<=0){toast('กรอกยอดเงินก่อนออกใบเสร็จ');return}
  const r=await pxNetApi('/api/bill/'+id,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:amt})});
  if(r.error){toast('✗ '+r.error);return}
  toast('🧾 ออกใบเสร็จ '+r.booking.rc_no+' — ลูกค้าเห็นยอดรอชำระบนมือถือ');
  pxNetPull();
}
async function pxNetPay(id){
  const r=await pxNetApi('/api/pay/'+id,{method:'POST'});
  if(r.error){toast('✗ '+r.error);return}
  toast('💰 รับชำระแล้ว → +'+r.earn+' DriveGo Coins เข้าเครือ (ยอดสะสมทะเบียนนี้ '+r.total+') — เด้งบนมือถือลูกค้าทันที');
  pxNetPull();
}
/* ---- Stock Sync: รายงานยอดคงเหลือของสาขาขึ้นเซิร์ฟเวอร์ (HQ มอนิเตอร์ได้) ---- */
let lastStockSync=0;
async function pxStockReport(force){
  if(!PXNET.on||PXNET.me.role!=='branch')return;
  if(!force&&Date.now()-lastStockSync<55000)return;   /* ส่งอย่างมากทุก ~1 นาที */
  try{
    const items=DB.stock.map(s=>({code:s.code,name:s.name,unit:s.unit||'',qty:+s.qty||0,min:+s.min||0}));
    const r=await pxNetApi('/api/stock/report',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({items})});
    if(r.ok){lastStockSync=Date.now();
      if(force)toast('📤 ซิงก์สต๊อกขึ้นเซิร์ฟเวอร์แล้ว '+r.synced+' รายการ — HQ เห็นยอดคงเหลือสาขานี้สด');}
  }catch(e){}
}

/* ---- Distribution: ขอเติมสต๊อกจากคลังกลางจริง → รับของเข้าสต๊อก BaziX ---- */
let DCPROD=[],DCREQS=[];
async function dcPull(){
  if(!PXNET.on)return;
  try{
    DCPROD=await pxNetApi('/api/dc/products');
    DCREQS=await pxNetApi('/api/dc/requests');
    if(Array.isArray(DCPROD)&&$('#s-px')&&$('#s-px').style.display!=='none')renderPxCatNet();
  }catch(e){}
}
function renderPxCatNet(){
  $('#pxCatCount').textContent='🌐 คลังกลางจริง · '+DCPROD.length+' สินค้า';
  $('#pxCatTbl tbody').innerHTML=DCPROD.map(p=>'<tr>'
    +'<td class="mono">'+p.code+'</td><td class="mono">'+(p.oem||'-')+'</td>'
    +'<td>'+p.name+'<br><span class="hint">สต๊อกกลางคงเหลือ <b>'+p.stock_hq.toLocaleString('th-TH')+'</b> '+p.unit+'</span></td>'
    +'<td>'+(p.cat||'-')+'</td>'
    +'<td class="num mono">'+money(p.cost)+'</td><td class="num mono">'+(p.price?money(p.price):'-')+'</td>'
    +'<td class="ctr"><input id="dcq'+p.id+'" type="number" min="1" placeholder="จำนวน" class="mono" style="width:70px"> '
    +'<button class="btn pri sm" onclick="dcRequest('+p.id+')">🚚 ขอเติม</button></td>'
    +'</tr>').join('');
  renderDcReqs();
}
async function dcRequest(pid){
  const q=parseInt(($('#dcq'+pid)||{}).value,10);
  if(!q||q<=0){toast('ใส่จำนวนที่ต้องการก่อน');return}
  const r=await pxNetApi('/api/dc/request',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({items:[{product_id:pid,qty:q}],note:'ขอเติมจากหน้าสต๊อก ProX'})});
  if(r.error){toast('✗ '+r.error);return}
  toast('🚚 ส่งคำขอเติมสต๊อกถึงศูนย์กระจายสินค้า HQ แล้ว (#'+r.request.id+') — รออนุมัติ/จัดส่ง');
  dcPull();
}
function renderDcReqs(){
  const tb=$('#pxReqTbl tbody'); if(!tb)return;
  const S={requested:['rq-w','⏳ รอ HQ อนุมัติ'],approved:['rq-w','✓ อนุมัติ · รอจัดส่ง'],shipped:['rq-a','🚚 จัดส่งแล้ว — กดรับของ'],received:['rq-a','✓ รับเข้าสต๊อกแล้ว'],rejected:['rq-w','✗ ไม่อนุมัติ']};
  $('#pxReqCount').textContent='🌐 '+DCREQS.filter(r=>r.status!=='received'&&r.status!=='rejected').length+' คำขอค้าง / '+DCREQS.length;
  tb.innerHTML=DCREQS.map(r=>{
    const s=S[r.status]||S.requested;
    const items=(r.items||[]).map(i=>i.code+' ×'+i.qty).join(', ');
    return '<tr><td class="mono">'+String(r.created_at||'').slice(0,10)+'</td>'
      +'<td><b>#'+r.id+'</b> '+items+(r.note?'<br><span class="hint">'+r.note+'</span>':'')+'</td>'
      +'<td>คลังกลาง HQ</td><td class="num mono">'+money((r.items||[]).reduce((a,i)=>a+i.cost*i.qty,0))+'</td>'
      +'<td class="ctr"><span class="reqst '+s[0]+'">'+s[1]+'</span>'
      +(r.status==='shipped'?'<br><button class="btn pri sm" style="margin-top:5px" onclick="dcReceive('+r.id+')">📦 รับของเข้าสต๊อก (07)</button>':'')
      +'</td></tr>';
  }).join('');
  $('#pxReqEmpty').style.display=DCREQS.length?'none':'';
}
async function dcReceive(id){
  const r=await pxNetApi('/api/dc/receive/'+id,{method:'POST'});
  if(r.error){toast('✗ '+r.error);return}
  /* เพิ่มยอดเข้า DB.stock ของ BaziX จริง (สร้างรายการใหม่ถ้ายังไม่มี) */
  let added=0,created=0;
  (r.request.items||[]).forEach(i=>{
    let s=DB.stock.find(x=>x.code.toLowerCase()===i.code.toLowerCase());
    if(!s){
      s={id:uid(),code:i.code,oem:'',name:i.name,cat:'ไส้กรอง',unit:i.unit||'ชิ้น',
        cost:i.cost||0,pa:0,pb:0,pc:0,qty:0,min:2,max:50,stale:6,lastMove:iso(),warr:'',warrNote:'',zone:'',shelf:'',loc:''};
      try{stampRec(s,null)}catch(e){}
      DB.stock.push(s);created++;
    }
    s.qty=(s.qty||0)+i.qty; s.lastMove=iso(); added+=i.qty;
    try{logAudit('stock',{id:s.id,no:s.code},'save','รับของจากศูนย์กระจายสินค้า HQ · คำขอ #'+id+' · +'+i.qty+' '+(i.unit||''));}catch(e){}
  });
  pxSave();
  toast('📦 รับของเข้าทะเบียนอะไหล่แล้ว +'+added+' ชิ้น'+(created?' (สร้างรายการใหม่ '+created+')':'')+' — ดูยอดที่เมนู 07 แท็บแรก');
  dcPull(); pxStockReport(true);
}
/* ═════ จบโมดูลเครือ ═════ */

/* ---- wiring แท็บย่อย + badge ตอนเปิดโปรแกรม ---- */
(function(){
  ['trTabs','trTabsIn'].forEach(id=>{
    const tr=$('#'+id);
    if(tr)tr.addEventListener('click',e=>{const b=e.target.closest('button[data-r]');if(!b)return;
      if(!$('#v-techroom').classList.contains('on'))go('techroom');
      trGo(b.dataset.r)});
  });
  const t=$('#proxTabs');
  if(t) t.addEventListener('click',e=>{
    const b=e.target.closest('button[data-p]'); if(!b)return;
    if($$('#v-prox')[0] && !$('#v-prox').classList.contains('on')) go('prox');
    pxGo(b.dataset.p);
  });
  try{ ensurePX(); pxBadge();
    if(DB.px.net){ const a=$('#pxNetUrl'),b=$('#pxNetUser'); if(a)a.value=DB.px.net.url||''; if(b)b.value=DB.px.net.user||''; }
  }catch(e){}
})();
