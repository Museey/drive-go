
/* ══════════════════════════════════════════════════════════════
   FRANCHISE LAYER v17 — HQ / HB / SHB
   หลักการ: ไม่แตะตรรกะ BaziX/ProX เดิม — ครอบชั้นบัญชีผู้ใช้และ
   ฐานข้อมูลรายสาขา (คีย์ garage.v2::<branchId>) ไว้ด้านบน
   ══════════════════════════════════════════════════════════════ */
let FR={enabled:false,org:{name:'ALL EV SERVICE'},branches:[],accounts:[],reqs:[],hqStock:[],seq:{req:0,br:0},session:{accId:'',inspect:''}};
const FR_ACT_CODE='PROX-FR-2026';   /* รหัสเปิดใช้เดโม — ของจริงออกให้รายลูกค้าตอนซื้อแพ็กเกจ Franchise */
const FRKEY='franchise.v22';
let frHqPane='dash', RQ=null;
const FR_ST={pending:['รอ HQ อนุมัติ','#b45309'],shipped:['HQ จัดส่งแล้ว — รอสาขายืนยันรับ','#1d4ed8'],
             received:['รับของเข้าสต๊อกแล้ว','#15803d'],rejected:['HQ ปฏิเสธคำขอ','#b91c1c']};

async function frSave(){ try{ await STORE.set(FRKEY,JSON.stringify(FR)); }catch(e){} }
/* ── กติกาบัญชีผู้ใช้รวมศูนย์: username ไม่ซ้ำกันทั้งระบบ (HQ/HB/SHB ใช้ทะเบียนเดียวกัน) ── */
function frUserNorm(u){ return String(u||'').trim().toLowerCase(); }
function frUserValid(u){ return /^[a-z0-9][a-z0-9._-]{2,19}$/.test(frUserNorm(u)); }
function frUserTaken(u,exceptId){ u=frUserNorm(u);
  return FR.accounts.some(a=>a.id!==exceptId&&frUserNorm(a.user)===u); }
function frPassValid(p){ return String(p||'').length>=4; }
/* หา username ว่างจากคำตั้งต้น เช่น b001-emp003 → b001-emp003-2 ถ้าซ้ำ */
function frUserFree(base){ base=frUserNorm(base).replace(/[^a-z0-9._-]/g,'')||'user';
  if(base.length<3) base=(base+'000').slice(0,3);
  let u=base,i=1; while(frUserTaken(u)) u=base+'-'+(++i); return u; }
async function frLoadFR(){ try{ const v=await STORE.get(FRKEY); if(v) FR=Object.assign(FR,JSON.parse(v)); }catch(e){} }
function frAcc(){ return FR.accounts.find(a=>a.id===FR.session.accId)||null; }
function frRole(){ const a=frAcc(); return a?a.role:''; }
function frBranch(id){ return FR.branches.find(b=>b.id===id)||null; }
function brKey(b){ return b?(b.storeKey||('garage.v22::'+b.id)):'garage.v22'; }
/* DriveGo phase 2 (T8, Q3): HQ works on its own data set (it starts empty); garage.v22 stays the data of the branch whose storeKey it is (B001). */
const HQKEY='garage.v22::HQ';
async function frLoadHQ(){ KEY=HQKEY; DB=frFreshDB(); await load(); if(!DB.shop.name) DB.shop.name=FR.org.name||''; await frHqLicFromBranch(); boot(); }
/* The licence stays the first branch's, as in the test copy (owner 2026-10-19): HQ reads it on every load, and a change HQ makes
   (menu 10: dates, ต่ออายุ) is written to that branch too. Only HQ's own change is written, never a copy it read earlier. */
let frHqLic='';
const frLicOf=s=>JSON.stringify([s&&s.licStart||'',s&&s.licEnd||'']);
async function frHqLicFromBranch(){
  const db=FR.branches[0]?await frReadBranchDB(FR.branches[0]):null;
  if(db&&db.shop){ DB.shop.licStart=db.shop.licStart||''; DB.shop.licEnd=db.shop.licEnd||''; }
  frHqLic=frLicOf(DB.shop);
}
async function frHqLicToBranch(){
  if(KEY!==HQKEY||frLicOf(DB.shop)===frHqLic||!FR.branches[0]) return;
  const b=FR.branches[0], db=await frReadBranchDB(b); if(!db||!db.shop) return;
  db.shop.licStart=DB.shop.licStart; db.shop.licEnd=DB.shop.licEnd;
  await STORE.set(brKey(b),JSON.stringify(db));
  frHqLic=frLicOf(DB.shop);
}
{ const o=save; save=async function(){ const r=await o.apply(this,arguments); await frHqLicToBranch(); return r; }; }
function frCurBranchId(){ const a=frAcc(); if(!a) return ''; return (a.role==='HB'||a.role==='SHB')?a.branchId:(FR.session.inspect||''); }
function frWho(){ const a=frAcc(); const e=(typeof curEmp==='function')?curEmp():null; return e?e.name+' (SHB)':(a?a.name:'-'); }
function frFreshDB(){ return {stock:[],cust:[],vendors:[],purchases:[],quotes:[],receipts:[],moves:[],crm:[],emp:[],curEmp:'',
  expenses:[],assets:[],capital:[],claims:[],invoices:[],cats:[],catsOff:[],units:[],coa:[],map:{},audit:[],hr:[],warns:[],seq:{},
  shop:{type:'person',vatReg:false,person:'',company:'',email:'',web:'',logo:'',logoHead:true,logoOp:7,
    licStart:'',licEnd:'',name:'',tax:'',tel:'',addr:'',branch:'',bank:'',stale:6,warrM:3,ssoRate:5,ssoMin:1650,ssoMax:15000,ssoCap:750,warr:''}}; }

async function frSeed(){
  FR.branches=[
    {id:'B001',code:'B001',name:'สาขาหลัก รังสิต',addr:'ถ.รังสิต-ปทุมธานี ต.ประชาธิปัตย์ อ.ธัญบุรี ปทุมธานี',tel:'02-000-0000',manager:'',active:true,storeKey:'garage.v22',perms:null},
    {id:'B002',code:'B002',name:'สาขาบางนา',addr:'ถ.บางนา-ตราด กม.4 กรุงเทพฯ',tel:'02-111-1111',manager:'',active:true,perms:null}];
  FR.accounts=[
    {id:uid(),user:'hq',pass:'1234',role:'HQ',branchId:'',name:'สำนักงานใหญ่ (HQ)',active:true},
    {id:uid(),user:'b001',pass:'1234',role:'HB',branchId:'B001',name:'ผู้จัดการสาขาหลัก รังสิต',active:true},
    {id:uid(),user:'b002',pass:'1234',role:'HB',branchId:'B002',name:'ผู้จัดการสาขาบางนา',active:true}];
  FR.seq={req:0,br:2};
  /* บัญชี SHB ตัวอย่าง — ผูกพนักงานคนแรกของสาขาหลัก (ฐานข้อมูลปัจจุบันตอนเปิดใช้) */
  try{ const e=(DB.emp||[]).find(x=>empActive(x));
    if(e) FR.accounts.push({id:uid(),user:frUserFree('staff001'),pass:'5678',role:'SHB',branchId:'B001',empId:e.id,name:e.name,active:true});
  }catch(err){}
  await frSave();
}

/* ---------- สลับฐานข้อมูลรายสาขา ---------- */
async function frLoadBranch(brId){
  const b=frBranch(brId); if(!b) return;
  KEY=brKey(b);
  DB=frFreshDB();
  await load();
  if(!DB.shop.name){ DB.shop.name=(FR.org.name||'')+' — '+b.name; DB.shop.branch=b.name; DB.shop.tel=b.tel||''; DB.shop.addr=b.addr||''; }
  boot();
}

/* ---------- เข้า / ออกระบบ ---------- */
async function frDoLogin(){
  const u=(($('#frLoginUser')||{}).value||'').trim(), p=(($('#frLoginPass')||{}).value||'');
  const err=$('#frLoginErr');
  const showErr=m=>{ if(err){err.textContent=m;err.style.display='';} };
  /* ── ทะเบียนบัญชีรวมศูนย์: ทุกคน (HQ/HB/SHB) มี username เฉพาะตัว ไม่ซ้ำกันทั้งระบบ ── */
  const acc=FR.accounts.find(x=>frUserNorm(x.user)===frUserNorm(u));
  if(acc&&acc.role==='SHB'){
    if(!(await window.storage.checkSecret(FRKEY,'FR.accounts',acc.id,'pass',p))) return showErr('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    if(acc.active===false) return showErr('บัญชีนี้ถูกระงับการใช้งาน — ติดต่อหัวหน้าสาขา');
    const b=frBranch(acc.branchId);
    if(!b||b.active===false) return showErr('สาขานี้ถูกระงับการใช้งานโดย HQ');
    if(brKey(b)!==KEY) await frLoadBranch(b.id);
    const emp=(DB.emp||[]).find(e=>e.id===acc.empId);
    if(!emp) return showErr('บัญชีนี้ไม่พบข้อมูลพนักงานในสาขา — ติดต่อหัวหน้าสาขา');
    if(!empActive(emp)) return showErr('บัญชีพนักงานนี้ถูกปิดการใช้งานแล้ว เข้าระบบไม่ได้');
    if(err) err.style.display='none';
    if($('#frLoginPass')) $('#frLoginPass').value='';
    FR.session={accId:acc.id,inspect:'',empId:emp.id}; await frSave();
    DB.curEmp=emp.id; try{ await save(); }catch(e){}
    applyPerms(); frApplyUI();
    const first=PERM_TABS.find(([k])=>frBranchCan(k)&&can('tabs.'+k));
    go(first?first[0]:'home');
    toast('เข้าใช้งานในนาม '+emp.name+' · สาขา '+b.code+' (สิทธิ SHB ตามที่สาขากำหนด)');
    return;
  }
  /* ── Fallback รุ่นเก่า: รหัสสาขา.รหัสพนักงาน + PIN (ยังใช้ได้สำหรับพนักงานที่ยังไม่ถูกออกบัญชี) ── */
  const mm=acc?[]:u.split(/[.\/]/).map(x=>x.trim());
  if(mm.length===2&&mm[0]&&mm[1]){
    const hb=FR.accounts.find(x=>x.role==='HB'&&String(x.user||'').toLowerCase()===mm[0].toLowerCase());
    if(!hb) return showErr('ไม่พบรหัสสาขา "'+mm[0]+'" — ส่วนหน้าจุดต้องเป็นรหัสสาขา เช่น b001.EMP001');
    if(hb.active===false) return showErr('รหัสสาขานี้ถูกระงับการใช้งานโดย HQ');
    const b=frBranch(hb.branchId);
    if(!b||b.active===false) return showErr('สาขานี้ถูกระงับการใช้งานโดย HQ');
    if(brKey(b)!==KEY) await frLoadBranch(b.id);           /* โหลดฐานสาขาเพื่อค้นบัญชีพนักงาน */
    const emp=(DB.emp||[]).find(e=>String(e.code||'').toLowerCase()===mm[1].toLowerCase());
    if(!emp) return showErr('ไม่พบรหัสพนักงาน "'+mm[1]+'" ในสาขา '+b.code+' — ตรวจสอบรหัสในเมนู 10 ส่วนที่ 2');
    if(!empActive(emp)) return showErr('บัญชีพนักงานนี้ถูกปิดการใช้งานแล้ว เข้าระบบไม่ได้');
    if(!emp.pin) return showErr('พนักงานคนนี้ยังไม่ได้ตั้งรหัส PIN — ให้หัวหน้าสาขา (HB) ตั้งให้ในเมนู 10 ก่อน');
    if(!(await window.storage.checkSecret(KEY,'DB.emp',emp.id,'pin',p))) return showErr('รหัสผ่าน (PIN) ไม่ถูกต้อง');
    if(err) err.style.display='none';
    if($('#frLoginPass')) $('#frLoginPass').value='';
    FR.session={accId:hb.id,inspect:'',empId:emp.id}; await frSave();
    DB.curEmp=emp.id; try{ await save(); }catch(e){}
    applyPerms(); frApplyUI();
    const first=PERM_TABS.find(([k])=>frBranchCan(k)&&can('tabs.'+k));
    go(first?first[0]:'home');
    toast('เข้าใช้งานในนาม '+emp.name+' · สาขา '+b.code+' (สิทธิ SHB ตามที่สาขากำหนด)');
    return;
  }
  /* ── HQ / HB ── ชื่อผู้ใช้ไม่สนตัวพิมพ์ใหญ่-เล็ก (พิมพ์ HQ / hq / Hq ได้หมด) — รหัสผ่านยังต้องตรงเป๊ะ */
  const a=FR.accounts.find(x=>String(x.user||'').toLowerCase()===u.toLowerCase());
  if(!a||!(await window.storage.checkSecret(FRKEY,'FR.accounts',a.id,'pass',p))){ if(err){err.textContent='ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';err.style.display='';} return; }
  if(a.active===false){ if(err){err.textContent='รหัสนี้ถูกระงับการใช้งานโดย HQ — ติดต่อสำนักงานใหญ่';err.style.display='';} return; }
  if(a.role==='HB'){ const b=frBranch(a.branchId);
    if(!b||b.active===false){ if(err){err.textContent='สาขานี้ถูกระงับการใช้งานโดย HQ';err.style.display='';} return; } }
  if(err) err.style.display='none';
  if($('#frLoginPass')) $('#frLoginPass').value='';
  FR.session={accId:a.id,inspect:''}; await frSave();
  await frEnterSession();
}
async function frEnterSession(){
  const a=frAcc(); if(!a){ frApplyUI(); return; }
  if(a.role==='HQ'){
    if(KEY!==HQKEY) await frLoadHQ();             /* DriveGo phase 2 (Q3): HQ's own data (was: the first branch's) */
    /* v23: HQ เข้าระบบแล้วมาที่หน้าแรก ซึ่งแสดงยอดรวมทุกสาขา (เปิด HQ Console ได้จากปุ่มบนหน้านี้) */
    frApplyUI(); go('home');
  }else{
    await frLoadBranch(a.branchId);
    if(FR.session.empId){                       /* session พนักงาน (SHB) — ล็อกตามบัญชีพนักงาน */
      const e=(DB.emp||[]).find(x=>x.id===FR.session.empId);
      if(!e||!empActive(e)||!e.pin){ FR.session={accId:'',inspect:''}; await frSave(); frApplyUI(); return; }
      DB.curEmp=e.id; try{ await save(); }catch(err2){}
      applyPerms(); frApplyUI();
      const first=PERM_TABS.find(([k])=>frBranchCan(k)&&can('tabs.'+k));
      go(first?first[0]:'home');
      toast('เข้าสู่ระบบในนาม '+e.name+' (SHB)');
      return;
    }
    frApplyUI(); go('home');
  }
  toast('เข้าสู่ระบบในนาม '+a.name);
}
async function frLogout(){
  const ok=await askP({title:'ออกจากระบบ',text:'ต้องการออกจากระบบแฟรนไชส์และกลับสู่หน้า Login?',yes:'ออกจากระบบ',no:'ยกเลิก'});
  if(!ok) return;
  DB.curEmp=''; try{await save()}catch(e){}
  FR.session={accId:'',inspect:''}; await frSave();
  frApplyUI();
}

/* ---------- สิทธิเมนูรายสาขา (HQ ควบคุม HB) ---------- */
function frBranchCan(v){
  if(!FR.enabled) return v!=='hq';
  if(v==='hq') return false;
  const a=frAcc(); if(!a||(a.role!=='HB'&&a.role!=='SHB')) return true;
  const b=frBranch(a.branchId); if(!b||!b.perms||!b.perms.tabs) return true;
  return b.perms.tabs[v]!==false;
}

/* ---------- ครอบ go() : ด่านสิทธิแฟรนไชส์ ---------- */
const _frGoBase=go;
go=function(v){
  if(!FR.enabled){                       /* โหมดอู่เดี่ยว — พฤติกรรม ProX เดิมทุกประการ */
    if(v==='hq') return;                 /* เมนู HQ ไม่มีในโหมดนี้ */
    _frGoBase(v);
    if(v==='setting') frRenderSetBranch();  /* แผงเปิดใช้โหมดแฟรนไชส์ในเมนู 10 */
    return;
  }
  const a=frAcc();
  if(a&&(a.role==='HB'||a.role==='SHB')&&!frBranchCan(v)) return toast('สาขาของท่านไม่ได้รับสิทธิใช้เมนูนี้ — กำหนดโดยสำนักงานใหญ่ (HQ)');
  if(a&&a.role==='HQ'&&!FR.session.inspect&&v!=='hq'&&v!=='setting')
    return toast('อยู่ในโหมด HQ — กด "เข้าดูสาขา" เพื่อเปิดหน้าจอการทำงานของสาขา');
  _frGoBase(v);
  if(v==='hq') frRenderHq();
  if(v==='setting'){ frRenderSetBranch(); frRenderShbPanel(); }
};

/* ---------- ครอบ stkGo() : แท็บเบิกสินค้าจาก HQ ---------- */
const _frStkGoBase=stkGo;
stkGo=function(v){
  if(v==='hqreq'&&!FR.enabled) v='stock';   /* โหมดอู่เดี่ยวไม่มีแท็บเบิกจาก HQ */
  _frStkGoBase(v);
  if(v==='hqreq'){
    const h=$('#stkHint'); if(h) h.textContent='ขอเบิกสินค้าจากคลังกลางสำนักงานใหญ่ (HQ) — สร้างอัตโนมัติจากเกณฑ์ Min-Max หรือเลือกเอง · ติดตามสถานะและยืนยันรับของเข้าสต๊อกที่นี่';
    frRenderDraft(); frRenderMyReqs();
  }
};

/* ---------- UI กลาง: ป้ายบทบาท เมนู แถบตรวจสอบ ---------- */
function frApplyUI(){
  if(!FR.enabled){                        /* โหมดอู่เดี่ยว — หน้าตาเหมือน ProX เดิมเป๊ะ */
    const lg=$('#frLogin'); if(lg) lg.style.display='none';
    const nh=$('#navHQ'); if(nh) nh.style.display='none';
    const sb=$('#stkHqReqBtn'); if(sb) sb.style.display='none';
    const bar=$('#frInspectBar'); if(bar) bar.style.display='none';
    const bd=$('#frBadge'); if(bd) bd.innerHTML='';
    const cu0=$('#curUser'); if(cu0){cu0.disabled=false;cu0.title='';}
    $$('#tabs .navitem').forEach(it=>{ if(it.id!=='navHQ') it.style.display=''; });
    return;
  }
  const a=frAcc(), role=a?a.role:'';
  const lg=$('#frLogin'); if(lg) lg.style.display=a?'none':'flex';
  if(!a){ const dm=$('#frLoginDemo');
    if(dm&&FR.accounts.length){
      const hqs=FR.accounts.filter(x=>x.role==='HQ'&&x.active!==false);
      const hbs=FR.accounts.filter(x=>x.role==='HB'&&x.active!==false);
      dm.innerHTML='<b>รหัสทดสอบระบบ (Demo)</b><br>'
        +hqs.map(x=>'🟡 <b>HQ '+esc(x.name)+':</b> <span class="mono">'+esc(x.user)+' / '+esc(x.pass)+'</span> — เห็นทุกสาขา ออกรหัส คุมสิทธิ อนุมัติใบเบิก').join('<br>')
        +(hbs.length?'<br>'+hbs.map(x=>{const b=frBranch(x.branchId);return '🔵 <b>HB '+esc(b?b.code:'')+'</b> <span class="mono">'+esc(x.user)+' / '+esc(x.pass)+'</span>';}).join(' · '):'')
        +(FR.accounts.some(x=>x.role==='SHB'&&x.active!==false)
          ?'<br>'+FR.accounts.filter(x=>x.role==='SHB'&&x.active!==false).slice(0,3).map(x=>{const b=frBranch(x.branchId);
             return '🟢 <b>SHB '+esc(x.name)+' ('+esc(b?b.code:'')+'):</b> <span class="mono">'+esc(x.user)+' / '+esc(x.pass)+'</span>';}).join(' · ')
          :'')
        +'<br><span style="font-size:10.5px">พนักงานทุกคนมีชื่อผู้ใช้เฉพาะตัว — หัวหน้าสาขาออกบัญชีให้ในเมนู 10 · แบบเก่า <span class="mono">รหัสสาขา.รหัสพนักงาน</span> + PIN ยังใช้ได้ชั่วคราว</span>';
    } }
  frRenderBadge();
  const nh=$('#navHQ'); if(nh) nh.style.display=role==='HQ'?'':'none';
  const sb=$('#stkHqReqBtn'); if(sb) sb.style.display=(role==='HB'||role==='SHB'||(role==='HQ'&&FR.session.inspect))?'':'none';
  const hqLocked=role==='HQ'&&!FR.session.inspect;
  $$('#tabs .navitem').forEach(it=>{
    const b=it.querySelector('.navparent'); if(!b) return;
    if(it.id==='navHQ') return;
    const v=b.dataset.v;
    if(!a){ it.style.display=''; return; }
    if(hqLocked) it.style.display=(v==='setting'||v==='home')?'':'none';
    else if(role==='HB'||role==='SHB') it.style.display=frBranchCan(v)?'':'none';
    else it.style.display='';
  });
  const bar=$('#frInspectBar');
  if(bar){
    if(role==='HQ'&&FR.session.inspect){ const b=frBranch(FR.session.inspect);
      $('#frInspectName').textContent=b?(b.code+' · '+b.name):'';
      bar.style.display='flex'; }
    else bar.style.display='none';
  }
  frHqBadge();
  try{ if(typeof renderHqHome==='function') renderHqHome(); }catch(e){}
}
function frRenderBadge(){
  let el=$('#frBadge');
  if(!el){ const ub=document.querySelector('.userbox'); if(!ub) return;
    el=document.createElement('span'); el.id='frBadge';
    el.style.cssText='display:inline-flex;gap:6px;align-items:center;margin-right:4px';
    ub.insertBefore(el,ub.firstChild); }
  const a=frAcc();
  const cu=$('#curUser');
  if(!a){ el.innerHTML=''; if(cu){cu.disabled=false;cu.title='';} return; }
  const shb=!!FR.session.empId;
  /* SHB เข้าระบบด้วยรหัสตัวเอง — ล็อกช่องสลับผู้ใช้ กันสลับเป็นเจ้าของ/คนอื่นโดยไม่ออกจากระบบ */
  if(cu){ cu.disabled=shb; cu.title=shb?'ล็อกตามบัญชีพนักงานที่เข้าระบบ — กด "ออกจากระบบ" เพื่อเปลี่ยนผู้ใช้':'';
    const o0=cu.querySelector('option[value=""]');
    if(o0) o0.textContent=a.role==='HQ'?'โหมดตรวจสอบ HQ (สิทธิเต็ม)':'ผู้จัดการสาขา HB (สิทธิเต็ม)'; }
  const b=(a.role==='HB'||a.role==='SHB')?frBranch(a.branchId):(FR.session.inspect?frBranch(FR.session.inspect):null);
  const e=shb&&typeof curEmp==='function'?curEmp():null;
  const eIn=(!shb&&typeof curEmp==='function')?curEmp():null;   /* HB สลับทำงานในนามพนักงานผ่านด่าน PIN */
  const tag=a.role==='HQ'?(FR.session.inspect?'HQ <i class="pkg-ic-s" aria-hidden="true"></i>'+esc(b?b.code:'')+(eIn?' · ในนาม '+esc(eIn.name):''):'HQ · สำนักงานใหญ่')
    :shb?('SHB · '+esc(e?e.name:'พนักงาน')+' — '+esc(b?b.code:''))
    :('HB · '+esc(b?b.code:'')+(eIn?' · ในนาม '+esc(eIn.name):' '+esc(b?b.name:'')));
  const bg=a.role==='HQ'?'#F0A400':shb?'#15803d':'#2C66AF', fg=a.role==='HQ'?'#1a1204':'#fff';
  el.innerHTML=`<span style="background:${bg};color:${fg};font-weight:800;font-size:11px;padding:4px 9px;border-radius:20px;white-space:nowrap">${tag}</span>
  <button onclick="frChangePass()" title="เปลี่ยนรหัสผ่านของบัญชีที่ใช้อยู่"
    style="background:transparent;color:#fff;border:1px solid #6b7883;border-radius:20px;padding:4px 9px;font-size:11.5px;cursor:pointer;white-space:nowrap">🔑</button>
  <button onclick="frLogout()" title="ออกจากระบบแฟรนไชส์"
    style="background:transparent;color:#fff;border:1px solid #6b7883;border-radius:20px;padding:4px 11px;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap">ออกจากระบบ</button>`;
}

/* ---------- HQ Console ---------- */
function frRenderHq(){ frHqGo(frHqPane); frHqBadge(); }
function frHqGo(v){
  frHqPane=v;
  $$('#frHqTabs button').forEach(b=>b.classList.toggle('on',b.dataset.q===v));
  ['dash','br','req','stock'].forEach(k=>{ const el=$('#hq-'+k); if(el) el.style.display=k===v?'':'none'; });
  if(v==='dash') frRenderDash();
  if(v==='br') frRenderBranchMgr('#frBrWrap');
  if(v==='req') frRenderHqReqs();
  if(v==='stock') frRenderHqStock();
}
function frHqBadge(){
  const p=FR.reqs.filter(r=>r.status==='pending').length;
  const e=$('#frReqBdg'); if(e){ e.textContent=p; e.style.display=p?'':'none'; }
  const nb=$('#bdgHq'); if(nb){ nb.textContent=p; nb.style.display=(p&&frRole()==='HQ')?'':'none'; }
}

/* ---------- แดชบอร์ดรวมสาขา ---------- */
async function frReadBranchDB(b){
  if(brKey(b)===KEY) return DB;
  try{ const v=await STORE.get(brKey(b)); return v?JSON.parse(v):null; }catch(e){ return null; }
}
/* รวบรวมตัวเลขสดของทุกสาขา — ใช้ร่วมกันทั้ง HQ Console และหน้าแรก Mr.DriveGo */
async function frCollectBranches(mo){
  mo=mo||iso().slice(0,7);
  const rows=[];
  for(const b of FR.branches){
    const db=await frReadBranchDB(b);
    const rc=((db&&db.receipts)||[]).filter(r=>!r.cancelled);
    const rcMo=rc.filter(r=>String(r.date||'').slice(0,7)===mo);
    let sales=0,paid=0;
    rcMo.forEach(r=>{ let g=0; try{g=receiptTotals(r).gross}catch(e){}
      sales+=g; if(r.paid) paid+=g; });
    const alerts=((db&&db.stock)||[]).filter(s=>n(s.max)>0&&n(s.qty)<=n(s.min)).length;
    const book=((db&&db.px&&db.px.book)||[]).filter(j=>j.st==='wait').length;
    rows.push({b,has:!!db&&!!(db.receipts&&(db.receipts.length||db.stock.length||db.cust.length)),
      sales,paid,due:Math.max(0,sales-paid),rcCnt:rcMo.length,
      cust:((db&&db.cust)||[]).length,emp:((db&&db.emp)||[]).length,
      alerts,book,pendReq:FR.reqs.filter(r=>r.branchId===b.id&&r.status==='pending').length,
      shipReq:FR.reqs.filter(r=>r.branchId===b.id&&r.status==='shipped').length});
  }
  return rows;
}

async function frRenderDash(){
  const wrap=$('#frDashWrap'); if(!wrap) return;
  wrap.innerHTML='<div class="hint" style="padding:14px">⏳ กำลังรวบรวมข้อมูลสดจากทุกสาขา…</div>';
  const mo=iso().slice(0,7);
  const rows=await frCollectBranches(mo);
  const tot=rows.reduce((a,r)=>({s:a.s+r.sales,c:a.c+r.rcCnt,al:a.al+r.alerts,pq:a.pq+r.pendReq}),{s:0,c:0,al:0,pq:0});
  const card=(t,v,c)=>`<div class="panel" style="padding:13px 15px"><div class="hint">${t}</div><div style="font-size:21px;font-weight:800;margin-top:4px;color:${c||'inherit'}">${v}</div></div>`;
  wrap.innerHTML=
   `<div class="grid g4" style="margin-bottom:12px">
      ${card('ยอดขายรวมทุกสาขา · เดือนนี้','฿ '+money0(tot.s))}
      ${card('จำนวนบิลรวม · เดือนนี้',tot.c+' ใบ')}
      ${card('สินค้าต่ำกว่า Min (ทุกสาขารวม)',tot.al+' รายการ',tot.al?'#b45309':'')}
      ${card('ใบขอเบิกรอ HQ อนุมัติ',tot.pq+' ใบ',tot.pq?'#b91c1c':'')}
    </div>
    <div class="panel"><header><h2 class="mht">เปรียบเทียบรายสาขา · เดือน ${esc(mo)} — ข้อมูลสดจากฐานข้อมูลแต่ละสาขา</h2>
      <div class="spacer"></div><button class="btn sm" onclick="frRenderDash()">⟳ รีเฟรช</button></header>
    <div class="scroll"><table class="tbl">
      <thead><tr><th>สาขา</th><th class="num">ยอดขายเดือนนี้</th><th class="num">รับชำระแล้ว</th><th class="num">บิล</th><th class="num">ลูกค้าสะสม</th><th class="num">พนักงาน (SHB)</th><th class="num">ต่ำกว่า Min</th><th class="num">คิว BOOK รอรับ</th><th class="num">ใบเบิกค้าง</th><th class="ctr" style="width:140px">ตรวจสอบ</th></tr></thead>
      <tbody>${rows.map(r=>`<tr>
        <td><b>${esc(r.b.code)}</b> · ${esc(r.b.name)}${r.b.active===false?' <span style="color:#b91c1c;font-size:11px;font-weight:700">[ระงับ]</span>':''}${r.has?'':' <span class="hint">(ยังไม่เริ่มใช้งาน)</span>'}</td>
        <td class="num">${money0(r.sales)}</td><td class="num">${money0(r.paid)}</td>
        <td class="num">${r.rcCnt}</td><td class="num">${r.cust}</td><td class="num">${r.emp}</td>
        <td class="num" style="color:${r.alerts?'#b45309':'inherit'};font-weight:${r.alerts?'700':'400'}">${r.alerts}</td>
        <td class="num">${r.book}</td>
        <td class="num" style="color:${r.pendReq?'#b91c1c':'inherit'}">${r.pendReq+r.shipReq}</td>
        <td class="ctr"><button class="btn sm pri" onclick="frInspect('${r.b.id}')"><i class="pkg-ic-s" aria-hidden="true"></i>เข้าดูสาขา</button></td></tr>`).join('')}</tbody></table></div>
    <div class="row" style="padding:9px 12px"><span class="hint">🌐 การเชื่อมโยง DriveGo BOOK: ทุกสาขาในเครือปรากฏใน Garage Finder ของแอปลูกค้าเป็นเครือข่ายเดียวกันอัตโนมัติ — ประวัติซ่อมจากทุกสาขาไหลรวมเข้าสมุดบริการดิจิทัลเล่มเดียวของลูกค้า โดยระบุสาขาที่ให้บริการกำกับทุกรายการ</span></div>
    </div>`;
}


/* ══════════════════════════════════════════════════════════════════ */
/* ═══  v23 · หน้าแรก Mr.DriveGo สำหรับ HQ — ยอดขายรวมทุกสาขา  ═══════ */
/* ══════════════════════════════════════════════════════════════════ */

/* กลับจากโหมดตรวจสอบสาขา -> หน้าแรกยอดรวมทุกสาขา */
async function hqBackOverview(){
  FR.session.homeBranch='';
  if(FR.session.inspect){
    FR.session.inspect='';
    await frLoadHQ();                             /* DriveGo phase 2 (Q3): was the first branch's data */
  }
  await frSave();
  frApplyUI(); go('home');
  toast('📊 กลับสู่ยอดรวมทุกสาขา');
}

/* HQ ที่ยังไม่ได้กด "เข้าดูสาขา" = ให้หน้าแรกแสดงภาพรวมทั้งเครือ */
function hqHomeMode(){
  if(typeof FR==='undefined'||!FR.enabled) return false;
  const a=frAcc();
  return !!(a && a.role==='HQ' && !FR.session.inspect);
}
let _hqBusy=false;
function hqHomePick(v){ FR.session.homeBranch=v; frSave&&frSave(); renderHqHome(); }

async function renderHqHome(){
  const box=$('#hqHome'); if(!box) return;
  if(!hqHomeMode()){
    document.body.classList.remove('hqhome');
    /* HQ ที่กำลังตรวจสอบสาขา: หน้าแรกเป็นของสาขานั้น — ขึ้นแถบทางกลับสู่ยอดรวม */
    const a=(typeof frAcc==='function')?frAcc():null;
    if(a&&a.role==='HQ'&&FR.session.inspect){
      const b=frBranch(FR.session.inspect);
      box.style.display='';
      box.innerHTML=`<div class="hqbar" style="margin-bottom:12px">
        <div><h2>กำลังดูข้อมูลสาขา ${esc(b?b.code:'')}</h2>
          <div class="sub">${esc(b?b.name:'')} — ตัวเลขด้านล่างเป็นของสาขานี้เท่านั้น</div></div>
        <span class="hqmark">HQ <i class="pkg-ic-s" aria-hidden="true"></i></span>
        <div class="spacer" style="flex:1"></div>
        <button class="btn sm pri" onclick="hqBackOverview()">← กลับไปดูยอดรวมทุกสาขา</button>
      </div>`;
    } else { box.style.display='none'; }
    return;
  }
  box.style.display=''; document.body.classList.add('hqhome');
  if(_hqBusy) return; _hqBusy=true;
  if(!box.innerHTML) box.innerHTML='<div class="hint" style="padding:20px">⏳ กำลังรวบรวมยอดจากทุกสาขา…</div>';

  const mo=iso().slice(0,7);
  let rows=[];
  try{ rows=await frCollectBranches(mo); }catch(e){ rows=[]; }
  _hqBusy=false;

  const sel=FR.session.homeBranch||'';
  const one=sel?rows.find(r=>r.b.id===sel):null;
  const use=one?[one]:rows;
  const tot=use.reduce((a,r)=>({s:a.s+r.sales,p:a.p+r.paid,d:a.d+r.due,c:a.c+r.rcCnt,
      cu:a.cu+r.cust,em:a.em+r.emp,al:a.al+r.alerts,bk:a.bk+r.book,pq:a.pq+r.pendReq+r.shipReq}),
      {s:0,p:0,d:0,c:0,cu:0,em:0,al:0,bk:0,pq:0});
  const active=rows.filter(r=>r.b.active!==false).length;
  const avg=use.length?tot.s/use.length:0;

  const card=(t,v,sub,cls)=>`<div class="card${cls?' '+cls:''}"><div class="k">${t}</div>
    <div class="v">${v}</div><div class="s">${sub||''}</div></div>`;

  const opts=`<option value="">🏢 ทุกสาขารวมกัน (${rows.length} สาขา)</option>`
    +rows.map(r=>`<option value="${r.b.id}"${r.b.id===sel?' selected':''}>${esc(r.b.code)} · ${esc(r.b.name)}${r.b.active===false?' [ระงับ]':''}</option>`).join('');

  const maxS=Math.max(1,...rows.map(r=>r.sales));
  const rank=rows.slice().sort((a,b)=>b.sales-a.sales);

  box.innerHTML=
  `<div class="hqbar">
     <div>
       <h2>${one?'ยอดขายสาขา '+esc(one.b.code):'ภาพรวมทั้งเครือ · ทุกสาขารวมกัน'}</h2>
       <div class="sub">${one?esc(one.b.name):'สำนักงานใหญ่ (HQ) · '+active+' สาขาที่เปิดดำเนินการ'} — ข้อมูลสดเดือน ${esc(mo)}</div>
     </div>
     <span class="hqmark">HQ</span>
     <div class="spacer" style="flex:1"></div>
     <span class="lb">เลือกดู</span>
     <select id="hqHomeSel" onchange="hqHomePick(this.value)">${opts}</select>
     <button class="btn sm" onclick="renderHqHome()">⟳ รีเฟรช</button>
     ${one?`<button class="btn sm pri" onclick="frInspect('${one.b.id}')"><i class="pkg-ic-s" aria-hidden="true"></i>เข้าดูสาขานี้เต็มรูปแบบ</button>`:
           `<button class="btn sm pri" onclick="go('hq')">เปิด HQ Console</button>`}
   </div>

   <div class="cards c6" style="margin-bottom:14px">
     ${card('ยอดขาย'+(one?'':'รวมทุกสาขา')+' · เดือนนี้','฿ '+money0(tot.s),
            one?`${tot.c} ใบเสร็จ`:`เฉลี่ยสาขาละ <b>฿ ${money0(avg)}</b>`)}
     ${card('รับชำระแล้ว','฿ '+money0(tot.p),
            `คิดเป็น <b>${tot.s?Math.round(tot.p/tot.s*100):0}%</b> ของยอดขาย`,'green')}
     ${card('ค้างชำระ','฿ '+money0(tot.d),'ยอดที่ยังเก็บเงินไม่ได้',tot.d?'red':'')}
     ${card('จำนวนบิล · เดือนนี้',tot.c+' ใบ',`ลูกค้าสะสม <b>${tot.cu}</b> ราย`)}
     ${card('สินค้าต่ำกว่า Min',tot.al+' รายการ',
            `ใบขอเบิกค้าง <b>${tot.pq}</b> ใบ`,tot.al?'amber':'')}
     ${card('คิวจอง BOOK รอรับ',tot.bk+' คิว',`ช่างในเครือ <b>${tot.em}</b> คน`,tot.bk?'amber':'')}
   </div>

   ${one?'':`
   <div class="panel">
     <header><h2>จัดอันดับยอดขายรายสาขา · เดือน ${esc(mo)}</h2>
       <span class="tag">${rows.length} สาขา</span><div class="spacer"></div>
       <span class="hint">คลิกชื่อสาขาเพื่อดูเฉพาะสาขานั้น</span></header>
     <div class="scroll"><table class="tbl">
       <thead><tr><th>สาขา</th><th class="num">ยอดขายเดือนนี้</th><th style="width:130px">สัดส่วน</th>
         <th class="num">รับชำระแล้ว</th><th class="num">ค้างชำระ</th><th class="num">บิล</th>
         <th class="num">ลูกค้า</th><th class="num">ต่ำกว่า Min</th><th class="num">คิว BOOK</th>
         <th class="ctr" style="width:130px">ตรวจสอบ</th></tr></thead>
       <tbody>${rank.map((r,i)=>`<tr>
         <td><span class="rankno${i===0&&r.sales>0?' g1':''}">${i+1}</span>
             <a href="javascript:void(0)" onclick="hqHomePick('${r.b.id}')"><b>${esc(r.b.code)}</b> · ${esc(r.b.name)}</a>
             ${r.b.active===false?' <span style="color:#b91c1c;font-size:11px;font-weight:700">[ระงับ]</span>':''}
             ${r.has?'':' <span class="hint">(ยังไม่เริ่มใช้งาน)</span>'}</td>
         <td class="num"><b>${money0(r.sales)}</b></td>
         <td><div class="bar"><i style="width:${Math.round(r.sales/maxS*100)}%"></i></div></td>
         <td class="num">${money0(r.paid)}</td>
         <td class="num" style="color:${r.due?'#b91c1c':'inherit'}">${money0(r.due)}</td>
         <td class="num">${r.rcCnt}</td><td class="num">${r.cust}</td>
         <td class="num" style="color:${r.alerts?'#b45309':'inherit'};font-weight:${r.alerts?'700':'400'}">${r.alerts}</td>
         <td class="num">${r.book}</td>
         <td class="ctr"><button class="btn sm" onclick="frInspect('${r.b.id}')"><i class="pkg-ic-s" aria-hidden="true"></i>เข้าดูสาขา</button></td></tr>`).join('')}
       </tbody>
       <tfoot><tr style="background:var(--line2);font-weight:700">
         <td>รวมทุกสาขา</td><td class="num">${money0(tot.s)}</td><td></td>
         <td class="num">${money0(tot.p)}</td><td class="num">${money0(tot.d)}</td>
         <td class="num">${tot.c}</td><td class="num">${tot.cu}</td>
         <td class="num">${tot.al}</td><td class="num">${tot.bk}</td><td></td></tr></tfoot>
     </table></div>
   </div>`}

   ${one?`<div class="panel"><header><h2>ทางลัดของสาขา ${esc(one.b.code)}</h2></header>
     <div class="row" style="padding:12px;gap:10px;flex-wrap:wrap">
       <span class="hint">ตัวเลขข้างบนเป็นข้อมูลสดของสาขานี้ · ถ้าต้องการเปิดบิล ดูสต๊อก หรือแก้ไขข้อมูล ให้กด "เข้าดูสาขานี้เต็มรูปแบบ"</span>
       <div class="spacer" style="flex:1"></div>
       <button class="btn sm gh" onclick="hqHomePick('')">← กลับไปดูภาพรวมทุกสาขา</button>
     </div></div>`:''}

   <div class="row" style="padding:10px 2px">
     <span class="hint">💡 หน้านี้แสดงเมื่อเข้าระบบด้วยรหัส HQ — ตัวเลขดึงสดจากฐานข้อมูลของแต่ละสาขา ไม่ใช่ค่าที่คัดลอกไว้
     · เลือกสาขาจากช่องด้านบนเพื่อดูเฉพาะสาขานั้น หรือกด "เข้าดูสาขา" เพื่อเข้าไปทำงานแทนสาขาได้ทุกฟังก์ชัน</span>
   </div>`;
}

/* ---------- ทะเบียนสาขา + รหัสผู้ใช้ + สิทธิ ---------- */
function frRenderBranchMgr(sel){
  const w=$(sel); if(!w) return;
  w.innerHTML=`<div class="panel"><header><h2 class="mht">ทะเบียนสาขาแฟรนไชส์ · รหัสผู้ใช้ HB · สิทธิรายเมนู</h2><span class="tag">${FR.branches.length} สาขา</span>
    <div class="spacer"></div><button class="btn pri" onclick="frBrAdd()">+ เพิ่มสาขาใหม่ + ออกรหัส HB อัตโนมัติ</button></header>
    <div style="padding:10px 12px" id="frBrCards">${FR.branches.map(b=>frBrCard(b)).join('')}</div></div>`;
}
function frBrCard(b){
  const accs=FR.accounts.filter(a=>a.branchId===b.id);
  const perms=(b.perms&&b.perms.tabs)||{};
  return `<div class="permbox" style="margin-bottom:12px">
   <div class="row" style="gap:10px;flex-wrap:wrap;align-items:center">
     <b style="font-size:14px">${esc(b.code)} · ${esc(b.name)}</b>
     <span class="tag" style="background:${b.active!==false?'#dcfce7':'#fee2e2'};color:${b.active!==false?'#15803d':'#b91c1c'}">${b.active!==false?'เปิดใช้งาน':'ระงับชั่วคราว'}</span>
     <div class="spacer" style="flex:1"></div>
     <button class="btn sm pri" onclick="frInspect('${b.id}')"><i class="pkg-ic-s" aria-hidden="true"></i>เข้าดูสาขา (ทุกฟังก์ชัน)</button>
     <button class="btn sm gh" onclick="frBrToggle('${b.id}')">${b.active!==false?'⏸ ระงับสาขา':'▶ เปิดใช้งานสาขา'}</button></div>
   <div class="grid g4" style="margin-top:8px">
     <label class="f"><span>ชื่อสาขา</span><input value="${esc(b.name)}" onchange="frBrEdit('${b.id}','name',this.value)"></label>
     <label class="f"><span>ผู้จัดการสาขา</span><input value="${esc(b.manager||'')}" onchange="frBrEdit('${b.id}','manager',this.value)"></label>
     <label class="f"><span>เบอร์โทร</span><input value="${esc(b.tel||'')}" onchange="frBrEdit('${b.id}','tel',this.value)"></label>
     <label class="f"><span>ที่อยู่</span><input value="${esc(b.addr||'')}" onchange="frBrEdit('${b.id}','addr',this.value)"></label></div>
   <div style="margin-top:10px"><b style="font-size:12.5px">🔑 รหัสผู้ใช้ HB ของสาขานี้</b>
     <button class="btn sm gh" onclick="frAccAdd('${b.id}')">+ ออกรหัสเพิ่ม</button>
     <span class="hint" style="margin-left:6px">(ตัวอย่างระบบ — แสดงรหัสผ่านให้ HQ เห็น · ระบบจริงบน cloud จะเข้ารหัส bcrypt)</span>
     <table class="tbl" style="margin-top:6px"><thead><tr><th>ผู้ถือรหัส</th><th style="width:130px">Username</th><th style="width:110px">Password</th><th class="ctr" style="width:90px">สถานะ</th><th class="ctr" style="width:210px">จัดการ</th></tr></thead>
     <tbody>${accs.map(a=>`<tr><td>${esc(a.name)}</td><td><input class="mono" style="width:100%" value="${esc(a.user)}" onchange="frAccUser('${a.id}',this.value)"></td><td class="mono">${a.pass?'********':''}</td>
        <td class="ctr">${a.active!==false?'ใช้งานได้':'<span style="color:#b91c1c;font-weight:700">ระงับ</span>'}</td>
        <td class="ctr"><button class="btn sm gh" onclick="frAccReset('${a.id}')">รีเซ็ตรหัสผ่าน</button>
          <button class="btn sm gh" onclick="frAccToggle('${a.id}')">${a.active!==false?'⏸ ระงับ':'▶ เปิดใช้'}</button></td></tr>`).join('')
       ||'<tr><td colspan="5" class="hint">ยังไม่มีรหัส — กด + ออกรหัสเพิ่ม</td></tr>'}</tbody></table></div>
   <div style="margin-top:10px"><b style="font-size:12.5px">🎚 สิทธิการใช้งานเมนูของสาขา (HQ เปิด-ปิดได้ · มีผลกับทุกรหัสของสาขานี้)</b>
     <div class="permgrid" style="margin-top:6px">${PERM_TABS.map(([k,l])=>
       `<label class="row" style="gap:6px;align-items:center"><input type="checkbox" ${perms[k]===false?'':'checked'} onchange="frBrPerm('${b.id}','${k}',this.checked)"><span style="font-size:12px">${esc(l)}</span></label>`).join('')}</div></div>
  </div>`;
}
async function frBrAdd(){
  const nm=await askPromptP({title:'เพิ่มสาขาใหม่',text:'ชื่อสาขา (เช่น สาขาลาดพร้าว)',yes:'สร้างสาขา + ออกรหัส',no:'ยกเลิก'});
  if(!nm) return;
  FR.seq.br=(FR.seq.br||FR.branches.length)+1;
  const id='B'+String(FR.seq.br).padStart(3,'0');
  FR.branches.push({id,code:id,name:String(nm),addr:'',tel:'',manager:'',active:true,perms:null});
  let u=frUserFree(id);
  const pass=String(Math.floor(1000+Math.random()*9000));
  FR.accounts.push({id:uid(),user:u,pass,role:'HB',branchId:id,name:'ผู้จัดการ'+String(nm),active:true});
  await frSave();
  frRenderBranchMgr('#frBrWrap'); frRenderSetBranch();
  toast('สร้าง '+id+' · '+nm+' แล้ว — รหัส HB: '+u+' / '+pass);
}
function frBrEdit(id,k,v){ const b=frBranch(id); if(b){ b[k]=v; frSave(); } }
async function frBrToggle(id){
  const b=frBranch(id); if(!b) return;
  b.active=b.active===false?true:false;
  await frSave(); frRenderBranchMgr('#frBrWrap'); frRenderSetBranch();
  toast(b.active?'เปิดใช้งานสาขา '+b.code+' แล้ว':'ระงับสาขา '+b.code+' แล้ว — รหัสของสาขานี้เข้าระบบไม่ได้จนกว่าจะเปิดใหม่');
}
function frBrPerm(id,k,on){
  const b=frBranch(id); if(!b) return;
  b.perms=b.perms||{tabs:{}}; b.perms.tabs=b.perms.tabs||{};
  b.perms.tabs[k]=!!on; frSave();
}
async function frAccUser(accId,val){
  const ac=FR.accounts.find(x=>x.id===accId); if(!ac) return;
  const user=frUserNorm(val);
  if(!frUserValid(user)){ toast('ชื่อผู้ใช้ไม่ถูกต้อง — ใช้ a-z 0-9 . _ - ยาว 3-20 ตัวอักษร'); frRenderBranchMgr('#frBrWrap'); frRenderSetBranch(); return; }
  if(frUserTaken(user,accId)){ toast('ชื่อผู้ใช้ "'+user+'" ถูกใช้แล้วในระบบ — แนะนำ: '+frUserFree(user)); frRenderBranchMgr('#frBrWrap'); frRenderSetBranch(); return; }
  ac.user=user; await frSave(); toast('เปลี่ยนชื่อผู้ใช้เป็น '+user+' แล้ว');
}
async function frAccAdd(brId){
  const nm=await askPromptP({title:'ออกรหัสผู้ใช้ HB',text:'ชื่อผู้ถือรหัส (เช่น ผู้จัดการสาขา / รองผู้จัดการ)',yes:'ออกรหัส',no:'ยกเลิก'});
  if(!nm) return;
  let u=frUserFree(brId||'hb');
  const pass=String(Math.floor(1000+Math.random()*9000));
  FR.accounts.push({id:uid(),user:u,pass,role:'HB',branchId:brId,name:String(nm),active:true});
  await frSave(); frRenderBranchMgr('#frBrWrap'); frRenderSetBranch();
  toast('ออกรหัสแล้ว — '+u+' / '+pass);
}
async function frAccReset(id){
  const a=FR.accounts.find(x=>x.id===id); if(!a) return;
  const p=await askPromptP({title:'รีเซ็ตรหัสผ่าน',text:'รหัสผ่านใหม่ของ '+a.user,yes:'บันทึก',no:'ยกเลิก'});
  if(!p) return;
  a.pass=String(p); await frSave(); frRenderBranchMgr('#frBrWrap'); frRenderSetBranch();
  toast('เปลี่ยนรหัสผ่านของ '+a.user+' แล้ว');
}
async function frAccToggle(id){
  const a=FR.accounts.find(x=>x.id===id); if(!a) return;
  a.active=a.active===false?true:false;
  await frSave(); frRenderBranchMgr('#frBrWrap'); frRenderSetBranch();
  toast(a.active?'เปิดใช้รหัส '+a.user+' แล้ว':'ระงับรหัส '+a.user+' แล้ว');
}

/* ---------- แผงสาขาในหน้าตั้งค่าองค์กร (เมนู 10 · เฉพาะ HQ) ---------- */
function frRenderSetBranch(){
  const w=$('#frSetBranchWrap'); if(!w) return;
  if(!FR.enabled){
    /* โหมดอู่เดี่ยว — แผงชวนเปิดใช้ (จุดขายอัปเกรดของ Model B: ระบบเดียว ปลดล็อกด้วยรหัส) */
    w.innerHTML=`<div class="panel" style="margin-bottom:14px;border:2px dashed #2C66AF">
      <header><h2>🏬 DriveGo ProX · Franchise Edition — ระบบบริหารแฟรนไชส์หลายสาขา</h2>
        <span class="tag" style="background:#eef4fb;color:#2C66AF">ยังไม่เปิดใช้</span></header>
      <div style="padding:12px 14px">
        <div class="hint" style="line-height:1.8;margin-bottom:10px">
          ยกระดับจากอู่เดี่ยวเป็นเครือข่ายสาขาในคลิกเดียว — <b>ข้อมูลปัจจุบันทั้งหมดจะกลายเป็น "สาขาหลัก B001" อัตโนมัติ ไม่ต้องย้ายข้อมูล</b><br>
          🟡 <b>HQ</b> ถือรหัสแม่ — ออกรหัสสาขา คุมสิทธิรายเมนู เห็น/ตรวจสอบทุกสาขา อนุมัติใบขอเบิกจากคลังกลาง ·
          🔵 <b>HB</b> รหัสประจำสาขา ใช้งานเต็มเฉพาะข้อมูลสาขาตน ·
          🟢 <b>SHB</b> รหัสพนักงานที่สาขาออกเอง (ระบบสิทธิเดิมของ ProX)</div>
        <div class="row" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <input id="frActCode" class="mono" placeholder="รหัสเปิดใช้จากใบสั่งซื้อแพ็กเกจ Franchise" style="flex:1;min-width:240px;text-transform:uppercase">
          <button class="btn pri" onclick="frActivate()">🔓 เปิดใช้โหมดแฟรนไชส์</button>
        </div>
        <div class="hint" style="margin-top:8px">รหัสเปิดใช้สำหรับทดสอบ (เดโม): <span class="mono"><b>${FR_ACT_CODE}</b></span> — เวอร์ชันจำหน่ายจริงออกรหัสให้รายลูกค้าและผูกจำนวนสาขาตามแพ็กเกจ</div>
      </div></div>`;
    return;
  }
  if(frRole()!=='HQ'){ w.innerHTML=''; return; }
  w.innerHTML=`<div class="panel" style="margin-bottom:14px;border:2px solid #F0A400">
    <header><h2>🏬 สาขาแฟรนไชส์ — ส่วนนี้เห็นเฉพาะรหัส HQ</h2>
      <div class="spacer"></div>
      <button class="btn sm gh" style="color:var(--danger)" onclick="frDeactivate()">ปิดโหมดแฟรนไชส์ (เดโม)</button>
      <button class="btn pri sm" onclick="go('hq');frHqGo('br')">เปิดหน้าจัดการเต็มรูปแบบใน HQ Console ›</button></header>
    <div class="row" style="padding:8px 12px 0"><span class="hint">การตั้งค่าองค์กรด้านล่างเป็นข้อมูลของ "สาขาที่กำลังเปิดดูอยู่" · การจัดการเครือข่ายทั้งหมด (เพิ่มสาขา ออกรหัส คุมสิทธิ) ทำได้ที่นี่หรือใน HQ Console</span></div>
    <div id="frSetBrInner"></div></div>`;
  frRenderBranchMgr('#frSetBrInner');
}

/* ══ บัญชีเข้าระบบพนักงาน (SHB) — หัวหน้าสาขาออกให้ · username ไม่ซ้ำกันทั้งระบบ ══ */
function frShbAccOf(empId){ return FR.accounts.find(a=>a.role==='SHB'&&a.empId===empId); }
function frRenderShbPanel(){
  const w=$('#frShbWrap'); if(!w) return;
  const a=frAcc();
  const canMgr=FR.enabled&&a&&(a.role==='HB'||(a.role==='HQ'&&FR.session.inspect))&&!FR.session.empId;
  if(!canMgr){ w.innerHTML=''; return; }
  const brId=frCurBranchId(), b=frBranch(brId);
  const emps=(DB.emp||[]).filter(e=>empActive(e));
  w.innerHTML=`<div class="panel" style="margin-bottom:14px;border:2px solid #15803d">
    <header><h2>🟢 บัญชีเข้าระบบของพนักงาน (SHB) — สาขา ${esc(b?b.code+' '+b.name:'')}</h2>
      <span class="tag" style="background:#dcfce7;color:#15803d">${FR.accounts.filter(x=>x.role==='SHB'&&x.branchId===brId).length} บัญชี</span></header>
    <div class="row" style="padding:8px 12px 0"><span class="hint">พนักงานใช้ชื่อผู้ใช้ + รหัสผ่านของตัวเองเข้าระบบที่หน้า Login ได้โดยตรง — <b>ชื่อผู้ใช้ต้องไม่ซ้ำกับใครทั้งระบบ</b> (ระบบตรวจให้อัตโนมัติ) · เพิ่ม/แก้ข้อมูลพนักงานและสิทธิใช้งานทำที่ "ส่วนที่ 2" ด้านล่าง · PIN 4 หลักเดิมใช้เฉพาะสลับผู้ใช้ภายในร้าน</span></div>
    <div class="scroll" style="padding:6px 12px 12px"><table class="tbl">
      <thead><tr><th style="width:80px">รหัส</th><th>ชื่อพนักงาน / ตำแหน่ง</th>
        <th style="width:190px">ชื่อผู้ใช้ (Username)</th><th style="width:110px">รหัสผ่าน</th>
        <th class="ctr" style="width:80px">สถานะ</th><th class="ctr" style="width:230px">จัดการ</th></tr></thead>
      <tbody>${emps.map(e=>{ const ac=frShbAccOf(e.id);
        return `<tr><td class="mono">${esc(e.code)}</td><td>${esc(e.name)}${e.position?' <span class="hint">('+esc(e.position)+')</span>':''}</td>
        <td>${ac?`<input class="mono" style="width:100%" value="${esc(ac.user)}" onchange="frShbUser('${ac.id}',this.value)">`:'<span class="hint">ยังไม่มีบัญชี</span>'}</td>
        <td class="mono">${ac?(ac.pass?'********':''):'-'}</td>
        <td class="ctr">${!ac?'-':(ac.active!==false?'ใช้งานได้':'<span style="color:#b91c1c;font-weight:700">ระงับ</span>')}</td>
        <td class="ctr">${ac
          ?`<button class="btn sm gh" onclick="frShbReset('${ac.id}')">รีเซ็ตรหัสผ่าน</button>
            <button class="btn sm gh" onclick="frShbToggle('${ac.id}')">${ac.active!==false?'⏸ ระงับ':'▶ เปิดใช้'}</button>`
          :`<button class="btn sm pri" onclick="frShbCreate('${e.id}')">+ ออกบัญชีเข้าระบบ</button>`}</td></tr>`;}).join('')
        ||'<tr><td colspan="6" class="hint">ยังไม่มีพนักงานในสาขา — เพิ่มที่ส่วนที่ 2 ด้านล่างก่อน</td></tr>'}</tbody></table></div></div>`;
}
async function frShbCreate(empId){
  const e=(DB.emp||[]).find(x=>x.id===empId); if(!e) return;
  const brId=frCurBranchId(); const hb=FR.accounts.find(x=>x.role==='HB'&&x.branchId===brId&&x.active!==false);
  const sug=frUserFree(((hb?hb.user:'br')+'-'+String(e.code||'staff')));
  const u=await askPromptP({title:'ออกบัญชีเข้าระบบให้ '+e.name,text:'ตั้งชื่อผู้ใช้ (a-z 0-9 . _ - ยาว 3-20 ตัว · ต้องไม่ซ้ำกับใครทั้งระบบ)\nแนะนำ: '+sug,yes:'ต่อไป',no:'ยกเลิก'});
  if(u===null||u===undefined||u===false) return;
  const user=frUserNorm(u)||sug;
  if(!frUserValid(user)) return toast('ชื่อผู้ใช้ไม่ถูกต้อง — ใช้ a-z 0-9 . _ - ยาว 3-20 ตัวอักษร');
  if(frUserTaken(user)) return toast('ชื่อผู้ใช้ "'+user+'" ถูกใช้แล้วในระบบ — ตั้งชื่ออื่น (แนะนำ: '+frUserFree(user)+')');
  const pass=String(Math.floor(1000+Math.random()*9000));
  FR.accounts.push({id:uid(),user,pass,role:'SHB',branchId:brId,empId:e.id,name:e.name,active:true});
  await frSave(); frRenderShbPanel();
  toast('ออกบัญชีแล้ว — ชื่อผู้ใช้ '+user+' · รหัสผ่าน '+pass+' (แจ้งพนักงานและให้เปลี่ยนรหัสเมื่อเข้าครั้งแรก)');
}
async function frShbUser(accId,val){
  const ac=FR.accounts.find(x=>x.id===accId); if(!ac) return;
  const user=frUserNorm(val);
  if(!frUserValid(user)){ toast('ชื่อผู้ใช้ไม่ถูกต้อง — ใช้ a-z 0-9 . _ - ยาว 3-20 ตัวอักษร'); frRenderShbPanel(); return; }
  if(frUserTaken(user,accId)){ toast('ชื่อผู้ใช้ "'+user+'" ถูกใช้แล้วในระบบ — แนะนำ: '+frUserFree(user)); frRenderShbPanel(); return; }
  ac.user=user; await frSave(); frRenderShbPanel(); toast('เปลี่ยนชื่อผู้ใช้เป็น '+user+' แล้ว');
}
async function frShbReset(accId){
  const ac=FR.accounts.find(x=>x.id===accId); if(!ac) return;
  const pass=String(Math.floor(1000+Math.random()*9000));
  ac.pass=pass; await frSave(); frRenderShbPanel();
  toast('รหัสผ่านใหม่ของ '+ac.name+' คือ '+pass);
}
async function frShbToggle(accId){
  const ac=FR.accounts.find(x=>x.id===accId); if(!ac) return;
  ac.active=ac.active===false; await frSave(); frRenderShbPanel();
  toast(ac.active?('เปิดใช้บัญชี '+ac.user+' แล้ว'):('ระงับบัญชี '+ac.user+' แล้ว — เข้าระบบไม่ได้จนกว่าจะเปิดใช้'));
}
/* เปลี่ยนรหัสผ่านของบัญชีที่กำลังใช้งาน (HQ/HB/SHB) */
async function frChangePass(){
  const a=frAcc(); if(!a) return;
  const o=await askPromptP({title:'เปลี่ยนรหัสผ่าน',text:'ใส่รหัสผ่านเดิมของ '+a.user,yes:'ต่อไป',no:'ยกเลิก'});
  if(o===null||o===undefined||o===false) return;
  if(!(await window.storage.checkSecret(FRKEY,'FR.accounts',a.id,'pass',o))) return toast('รหัสผ่านเดิมไม่ถูกต้อง');
  const np=await askPromptP({title:'เปลี่ยนรหัสผ่าน',text:'ตั้งรหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)',yes:'บันทึก',no:'ยกเลิก'});
  if(np===null||np===undefined||np===false) return;
  if(!frPassValid(np)) return toast('รหัสผ่านสั้นเกินไป — อย่างน้อย 4 ตัวอักษร');
  a.pass=String(np); await frSave(); toast('เปลี่ยนรหัสผ่านเรียบร้อย — ใช้รหัสใหม่ในการเข้าระบบครั้งถัดไป');
}

/* ══ ด่านสลับผู้ใช้ (ช่อง "เข้าใช้งานในนาม") — โหมดแฟรนไชส์เข้มกว่าเดิม ══
   เดิม: พนักงานไม่มี PIN สลับได้เลย · กดกลับ "เจ้าของกิจการ" แค่ยืนยัน ไม่ต้องใส่รหัส
   ใหม่: สลับเป็นพนักงาน = ต้องมี PIN และใส่ให้ถูก · กลับโหมดผู้จัดการ = ต้องใส่รหัสผ่านบัญชี HB/HQ
   โหมดอู่เดี่ยว: คงพฤติกรรม ProX เดิมทุกประการ */
(function(){
  const sel=$('#curUser'); if(!sel) return;
  const base=sel.onchange;
  sel.onchange=async function(ev){
    if(!FR.enabled) return base&&base.call(this,ev);
    const a=frAcc(), id=sel.value;
    if(!a){ sel.value=DB.curEmp||''; return; }
    if(FR.session.empId){ sel.value=DB.curEmp||'';
      return toast('บัญชีพนักงานถูกล็อกตามการเข้าระบบ — กด "ออกจากระบบ" เพื่อเปลี่ยนผู้ใช้'); }
    if(a.role==='HQ'&&!FR.session.inspect){ sel.value=DB.curEmp||'';
      return toast('โหมด HQ — กด "เข้าดูสาขา" ก่อนจึงสลับผู้ใช้ทำงานได้'); }
    if(!id){                                    /* กลับโหมดผู้จัดการ (สิทธิเต็ม) — ยืนยันรหัสผ่านบัญชี */
      if(!DB.curEmp) return;
      const pw=await askPromptP({title:'กลับสู่โหมดผู้จัดการ (สิทธิเต็ม)',
        text:'ใส่รหัสผ่านของบัญชี "'+a.user+'" เพื่อยืนยันตัวตน',yes:'ยืนยัน',no:'ยกเลิก'});
      if(pw===null||pw===undefined||pw===false){ sel.value=DB.curEmp||''; return; }
      if(!(await window.storage.checkSecret(FRKEY,'FR.accounts',a.id,'pass',pw))){ sel.value=DB.curEmp||''; return toast('รหัสผ่านไม่ถูกต้อง'); }
      DB.curEmp=''; save(); applyPerms(); try{renderStock();renderHome();}catch(e){} frApplyUI();
      return toast('กลับสู่โหมดผู้จัดการ ('+a.user+')');
    }
    const e=(DB.emp||[]).find(x=>x.id===id);
    if(!empActive(e)){ sel.value=DB.curEmp||''; return toast('บัญชีนี้ถูกปิดการใช้งานแล้ว เข้าระบบไม่ได้'); }
    if(!e.pin){ sel.value=DB.curEmp||'';
      return toast('พนักงานคนนี้ยังไม่ได้ตั้งรหัส PIN — ผู้จัดการตั้งให้ในเมนู 10 ส่วนที่ 2 ก่อน จึงจะสลับเข้าทำงานได้'); }
    const p=await askPromptP({title:'ยืนยันตัวตน',text:'ใส่รหัส PIN 4 หลักของ '+e.name,yes:'เข้าใช้งาน',no:'ยกเลิก'});
    if(p===null||p===undefined||p===false){ sel.value=DB.curEmp||''; return; }
    if(!(await window.storage.checkSecret(KEY,'DB.emp',e.id,'pin',p))){ sel.value=DB.curEmp||''; return toast('รหัส PIN ไม่ถูกต้อง'); }
    DB.curEmp=id; save(); applyPerms(); try{renderStock();renderHome();}catch(e2){} frApplyUI();
    toast('เข้าใช้งานในนาม '+e.name);
  };
})();

/* ---------- เปิด / ปิดโหมดแฟรนไชส์ (สวิตช์ระดับองค์กร) ---------- */
async function frActivate(code){
  code=String(code!==undefined?code:(($('#frActCode')||{}).value||'')).trim().toUpperCase();
  if(code!==FR_ACT_CODE){ toast('รหัสเปิดใช้ไม่ถูกต้อง — ตรวจสอบรหัสจากใบสั่งซื้อแพ็กเกจ Franchise'); return false; }
  FR.enabled=true;
  if(DB.shop&&DB.shop.name) FR.org.name=DB.shop.name;
  if(!FR.accounts.length) await frSeed();     /* ข้อมูลเดิมผูกเป็นสาขาหลัก B001 (คีย์ garage.v2 เดิม) */
  DB.curEmp=''; try{ await save(); }catch(e){}
  FR.session={accId:'',inspect:''};
  await frSave();
  frApplyUI(); frRenderSetBranch();
  toast('เปิดใช้โหมดแฟรนไชส์แล้ว — เข้าสู่ระบบด้วยรหัส HQ เพื่อเริ่มจัดการสาขา');
  return true;
}
async function frDeactivate(){
  const a=frAcc(); if(!a||a.role!=='HQ') return toast('เฉพาะรหัส HQ เท่านั้น');
  const ok=await askP({title:'ปิดโหมดแฟรนไชส์ (เดโม)',
    text:'กลับสู่โหมดอู่เดี่ยว — ข้อมูลสาขา บัญชีผู้ใช้ และใบขอเบิกยังถูกเก็บไว้ครบ เปิดกลับมาได้ทุกเมื่อ · หน้าจอจะแสดงข้อมูลสาขาหลัก (B001)',yes:'ปิดโหมด',no:'ยกเลิก'});
  if(!ok) return;
  FR.enabled=false; FR.session={accId:'',inspect:''}; await frSave();
  if(KEY!=='garage.v22'&&FR.branches[0]) await frLoadBranch(FR.branches[0].id);
  frApplyUI(); frRenderSetBranch(); go('home');
  toast('กลับสู่โหมดอู่เดี่ยวแล้ว — เปิดใช้ใหม่ได้ที่เมนู 10');
}

/* ---------- โหมดตรวจสอบสาขาโดย HQ ---------- */
async function frInspect(brId){
  const a=frAcc(); if(!a||a.role!=='HQ') return toast('เฉพาะรหัส HQ เท่านั้น');
  FR.session.inspect=brId; await frSave();
  await frLoadBranch(brId);
  frApplyUI(); go('home');
  const b=frBranch(brId);
  toast('เข้าสู่โหมดตรวจสอบ '+(b?b.code+' · '+b.name:''));
}
async function frExitInspect(){
  FR.session.inspect=''; await frSave();
  await frLoadHQ();                               /* DriveGo phase 2 (Q3): was the first branch's data */
  frApplyUI(); go('hq');
}

/* ---------- ใบขอเบิก HB → HQ ---------- */
function frDraftInit(){ if(!RQ) RQ={items:[]}; }
function frReqFromMinMax(){
  frDraftInit();
  const lows=DB.stock.filter(s=>n(s.max)>0&&n(s.qty)<=n(s.min));
  if(!lows.length) return toast('ยังไม่มีสินค้าที่ต่ำกว่าจุด Min — สต๊อกสาขาอยู่ในเกณฑ์ปกติ');
  let add=0;
  lows.forEach(s=>{ if(RQ.items.some(i=>String(i.code).toLowerCase()===String(s.code).toLowerCase())) return;
    RQ.items.push({code:s.code,name:s.name,unit:s.unit||'ชิ้น',qty:Math.max(1,Math.round(n(s.max)-n(s.qty)))}); add++; });
  frRenderDraft();
  toast('เติม '+add+' รายการจากเกณฑ์ Min-Max ให้แล้ว (จำนวน = Max − คงเหลือ)');
}
function frReqAddLine(){ frDraftInit(); RQ.items.push({code:'',name:'',unit:'ชิ้น',qty:1}); frRenderDraft(); }
function frReqDelLine(i){ frDraftInit(); RQ.items.splice(i,1); frRenderDraft(); }
function frDraftEdit(i,k,v){
  frDraftInit(); const it=RQ.items[i]; if(!it) return;
  if(k==='qty') it.qty=Math.max(1,n(v)); else it[k]=v;
  if(k==='code'){ const s=DB.stock.find(x=>String(x.code).toLowerCase()===String(v).trim().toLowerCase());
    if(s){ it.name=s.name; it.unit=s.unit||'ชิ้น'; frRenderDraft(); } }
}
function frRenderDraft(){
  frDraftInit();
  const tb=$('#frDraftTbl tbody'); if(!tb) return;
  tb.innerHTML=RQ.items.map((it,i)=>`<tr>
    <td><input class="mono" style="width:135px" value="${esc(it.code)}" list="stockList" onchange="frDraftEdit(${i},'code',this.value)"></td>
    <td><input style="width:100%" value="${esc(it.name)}" onchange="frDraftEdit(${i},'name',this.value)"></td>
    <td class="ctr"><input style="width:70px;text-align:center" value="${esc(it.unit)}" onchange="frDraftEdit(${i},'unit',this.value)"></td>
    <td class="num"><input type="number" min="1" style="width:85px;text-align:right" value="${it.qty}" onchange="frDraftEdit(${i},'qty',this.value)"></td>
    <td class="ctr"><button class="btn sm gh" onclick="frReqDelLine(${i})">✕</button></td></tr>`).join('');
  const c=$('#frDraftCnt'); if(c) c.textContent=RQ.items.length+' รายการ';
}
async function frReqSubmit(){
  if(!can('stock.edit')) return toast('บัญชีนี้ไม่มีสิทธิจัดการสต๊อก จึงส่งใบขอเบิกไม่ได้ — ให้ผู้จัดการสาขา (HB) เป็นผู้ส่ง');
  frDraftInit();
  const items=RQ.items.filter(i=>String(i.code||'').trim()&&n(i.qty)>0);
  if(!items.length) return toast('ยังไม่มีรายการในใบขอเบิก — กดปุ่ม Min-Max หรือเพิ่มบรรทัดเองก่อน');
  const brId=frCurBranchId(); if(!brId) return toast('ไม่พบสาขาปัจจุบัน — ต้องเข้าระบบด้วยรหัสสาขา (HB) หรือโหมดตรวจสอบของ HQ');
  FR.seq.req=(FR.seq.req||0)+1;
  const d=new Date();
  const no='REQ-'+String((d.getFullYear()+543)%100).padStart(2,'0')+String(d.getMonth()+1).padStart(2,'0')+'-'+String(FR.seq.req).padStart(4,'0');
  FR.reqs.push({id:uid(),no,branchId:brId,date:iso(),
    items:items.map(i=>({code:i.code,name:i.name,unit:i.unit,qty:n(i.qty),apQty:n(i.qty)})),
    status:'pending',note:(($('#frRqNote')||{}).value||''),
    log:[{d:iso(),t:'สาขาส่งคำขอเบิก',by:frWho()}]});
  await frSave();
  RQ=null; if($('#frRqNote')) $('#frRqNote').value='';
  frRenderDraft(); frRenderMyReqs(); frHqBadge();
  toast('📨 ส่งใบขอเบิก '+no+' ไปยังสำนักงานใหญ่แล้ว — รอ HQ อนุมัติ');
}
function frMyReqs(){ const brId=frCurBranchId(); return FR.reqs.filter(r=>r.branchId===brId).slice().reverse(); }
function frRenderMyReqs(){
  const tb=$('#frMyReqTbl tbody'); if(!tb) return;
  const rows=frMyReqs();
  tb.innerHTML=rows.map(r=>{
    const st=FR_ST[r.status]||[r.status,'#555'];
    const qty=r.items.reduce((a,i)=>a+n(r.status==='pending'?i.qty:i.apQty),0);
    return `<tr><td class="mono">${esc(r.no)}</td><td>${thDate(r.date)}</td>
      <td class="num">${r.items.length}</td><td class="num">${qf(qty)}</td>
      <td><span style="color:${st[1]};font-weight:700">${st[0]}</span></td>
      <td class="ctr"><button class="btn sm gh" onclick="frReqDetail('${r.id}',0)">รายละเอียด</button>
        ${r.status==='shipped'?`<button class="btn sm pri" onclick="frReqReceive('${r.id}')">✔ ยืนยันรับของเข้าสต๊อก</button>`:''}</td></tr>`;
  }).join('');
  const e=$('#frMyReqEmpty'); if(e) e.style.display=rows.length?'none':'';
  const c=$('#frMyReqCnt'); if(c) c.textContent=rows.length+' ใบ';
}
function frRenderHqReqs(){
  const tb=$('#frHqReqTbl tbody'); if(!tb) return;
  const rows=FR.reqs.slice().reverse();
  tb.innerHTML=rows.map(r=>{
    const b=frBranch(r.branchId), st=FR_ST[r.status]||[r.status,'#555'];
    const qty=r.items.reduce((a,i)=>a+n(i.apQty),0);
    return `<tr><td class="mono">${esc(r.no)}</td><td><b>${b?esc(b.code):'-'}</b> · ${b?esc(b.name):'-'}</td>
      <td>${thDate(r.date)}</td><td class="num">${r.items.length}</td><td class="num">${qf(qty)}</td>
      <td><span style="color:${st[1]};font-weight:700">${st[0]}</span></td>
      <td class="ctr"><button class="btn sm ${r.status==='pending'?'pri':'gh'}" onclick="frReqDetail('${r.id}',1)">${r.status==='pending'?'ตรวจ / อนุมัติ':'รายละเอียด'}</button></td></tr>`;
  }).join('');
  const e=$('#frHqReqEmpty'); if(e) e.style.display=rows.length?'none':'';
  const c=$('#frHqReqCnt'); if(c) c.textContent=rows.length+' ใบ';
  frHqBadge();
}
function frReqDetail(id,hqMode){
  const r=FR.reqs.find(x=>x.id===id); if(!r) return;
  const b=frBranch(r.branchId), st=FR_ST[r.status]||[r.status,'#555'];
  const edit=hqMode&&r.status==='pending';
  $('#frDetTitle').textContent='ใบขอเบิก '+r.no+' — '+(b?b.code+' · '+b.name:'');
  $('#frDetBody').innerHTML=`
   <div class="hint" style="margin-bottom:8px">วันที่ ${thDate(r.date)} · สถานะ <b style="color:${st[1]}">${st[0]}</b>${r.note?' · หมายเหตุ: '+esc(r.note):''}</div>
   <table class="tbl"><thead><tr><th style="width:140px">รหัส</th><th>ชื่อสินค้า</th><th class="ctr" style="width:70px">หน่วย</th><th class="num" style="width:90px">ขอเบิก</th><th class="num" style="width:110px">อนุมัติ${edit?' (แก้ได้)':''}</th>${hqMode?'<th class="num" style="width:130px">คงคลัง HQ</th>':''}</tr></thead>
   <tbody>${r.items.map((i,x)=>{
     const hs=FR.hqStock.find(h=>String(h.code).toLowerCase()===String(i.code).toLowerCase());
     const enough=hs&&n(hs.qty)>=n(i.apQty);
     return `<tr><td class="mono">${esc(i.code)}</td><td>${esc(i.name)}</td><td class="ctr">${esc(i.unit||'')}</td>
      <td class="num">${qf(i.qty)}</td>
      <td class="num">${edit?`<input type="number" min="0" style="width:85px;text-align:right" value="${i.apQty}" onchange="frHqEditQty('${r.id}',${x},this.value)">`:qf(i.apQty)}</td>
      ${hqMode?`<td class="num" style="color:${enough?'inherit':'#b91c1c'};font-weight:${enough?'400':'700'}">${hs?qf(hs.qty):'— ไม่มีในคลัง'}</td>`:''}</tr>`;}).join('')}</tbody></table>
   <div style="margin-top:10px"><b style="font-size:12.5px">ประวัติการดำเนินการ (ตรวจสอบย้อนหลังได้)</b>
     <div class="hint" style="margin-top:3px">${r.log.map(l=>thDate(l.d)+' · '+esc(l.t)+' — '+esc(l.by)).join('<br>')}</div></div>
   ${edit?`<div class="row" style="margin-top:12px;gap:8px">
      <button class="btn pri" onclick="frHqShip('${r.id}')">✔ อนุมัติและจัดส่ง (ตัดคลัง HQ)</button>
      <button class="btn" style="color:var(--danger)" onclick="frHqReject('${r.id}')">✕ ปฏิเสธคำขอ</button></div>`:''}`;
  $('#frDet').style.display='flex';
}
function frDetClose(){ $('#frDet').style.display='none'; }
function frHqEditQty(id,x,v){ const r=FR.reqs.find(q=>q.id===id); if(r&&r.items[x]){ r.items[x].apQty=Math.max(0,n(v)); frSave(); } }
async function frHqShip(id){
  const r=FR.reqs.find(x=>x.id===id); if(!r||r.status!=='pending') return;
  const short=[];
  r.items.forEach(i=>{ if(n(i.apQty)<=0) return;
    const h=FR.hqStock.find(h=>String(h.code).toLowerCase()===String(i.code).toLowerCase());
    if(!h) short.push(i.code+' — ไม่มีในคลัง HQ');
    else if(n(h.qty)<n(i.apQty)) short.push(i.code+' — คงเหลือ '+qf(h.qty)+' / ขอ '+qf(i.apQty)); });
  if(short.length){
    const ok=await askP({title:'คลัง HQ ไม่พอจ่ายบางรายการ',
      text:short.join(' · ')+' — ยืนยันจัดส่งเท่าที่มี? ระบบจะปรับยอดอนุมัติลงให้เท่าที่จ่ายได้จริง (ไม่ตัดคลังติดลบ)',
      yes:'จัดส่งเท่าที่มี',no:'ยกเลิก'});
    if(!ok) return;
  }
  r.items.forEach(i=>{
    const h=FR.hqStock.find(h=>String(h.code).toLowerCase()===String(i.code).toLowerCase());
    if(!h){ i.apQty=0; return; }
    const give=Math.min(n(i.apQty),n(h.qty));
    i.apQty=give; h.qty=n(h.qty)-give;
  });
  r.status='shipped'; r.log.push({d:iso(),t:'HQ อนุมัติและจัดส่ง (ตัดคลังกลางแล้ว)',by:frWho()});
  await frSave();
  frDetClose(); frRenderHqReqs(); frRenderHqStock(); frHqBadge();
  toast('🚚 จัดส่งใบเบิก '+r.no+' แล้ว — รอสาขากดยืนยันรับของเข้าสต๊อก');
}
async function frHqReject(id){
  const r=FR.reqs.find(x=>x.id===id); if(!r||r.status!=='pending') return;
  const why=await askPromptP({title:'ปฏิเสธคำขอ',text:'เหตุผลที่ปฏิเสธ (สาขาจะเห็นข้อความนี้)',yes:'ปฏิเสธคำขอ',no:'ยกเลิก'});
  if(why===null||why===false||why===undefined) return;
  r.status='rejected'; r.note=(r.note?r.note+' · ':'')+'เหตุผลจาก HQ: '+String(why);
  r.log.push({d:iso(),t:'HQ ปฏิเสธคำขอ',by:frWho()});
  await frSave(); frDetClose(); frRenderHqReqs(); frHqBadge();
  toast('ปฏิเสธคำขอ '+r.no+' แล้ว');
}
async function frReqReceive(id){
  if(!can('stock.edit')) return toast('บัญชีนี้ไม่มีสิทธิรับสินค้าเข้าสต๊อก');
  const r=FR.reqs.find(x=>x.id===id); if(!r||r.status!=='shipped') return;
  if(r.branchId!==frCurBranchId()) return toast('ใบเบิกนี้เป็นของสาขาอื่น');
  const ok=await askP({title:'ยืนยันรับของ',text:'ยืนยันรับสินค้าตามใบเบิก '+r.no+' เข้าสต๊อกสาขา? ระบบจะเพิ่มยอดคงคลังและบันทึกการเคลื่อนไหว (ตรวจย้อนได้ในบัตรสินค้า)',yes:'รับของเข้าสต๊อก',no:'ยกเลิก'});
  if(!ok) return;
  const nc=window.PKG_STOCK_FIFO?await PKG_STOCK_FIFO.newCosts(r.items):{}; if(!nc) return;   /* DriveGo new system (task 3.6, R11): the cost of an item new to the branch */
  let cIn=0,cNew=0;
  r.items.forEach(i=>{
    const q=n(i.apQty); if(q<=0) return;
    let s=DB.stock.find(x=>String(x.code).toLowerCase()===String(i.code).toLowerCase());
    if(!s){ s={id:uid(),code:i.code,oem:'',name:i.name,cat:'อื่น ๆ',unit:i.unit||'ชิ้น',cost:n(nc[String(i.code).toLowerCase()]),pa:0,pb:0,pc:0,
        qty:0,min:0,max:0,stale:6,lastMove:iso(),warr:'',warrNote:'',zone:'',shelf:'',loc:''};
      DB.stock.push(s); cNew++; }
    s.qty=n(s.qty)+q; s.lastMove=iso();
    logMove(s.id,'in',q,iso(),'รับสินค้าเติมสต๊อกจาก HQ (ใบเบิกแฟรนไชส์)',r.no,'',n(s.cost));   /* DriveGo new system (task 3.6, R11): at the branch's register cost */
    cIn+=q;
  });
  r.status='received'; r.log.push({d:iso(),t:'สาขายืนยันรับของเข้าสต๊อก',by:frWho()});
  await save(); await frSave();
  frRenderMyReqs(); try{renderStock()}catch(e){}
  toast('✔ รับของเข้าสต๊อกแล้ว '+qf(cIn)+' ชิ้น'+(cNew?' · สร้างสินค้าใหม่ในทะเบียน '+cNew+' รายการ':''));
}

/* ---------- คลังกลาง HQ ---------- */
function frRenderHqStock(){
  const tb=$('#frHqStockTbl tbody'); if(!tb) return;
  tb.innerHTML=FR.hqStock.map((h,i)=>{
    const low=n(h.max)>0&&n(h.qty)<=n(h.min);
    return `<tr style="${low?'background:#fff7ed':''}">
     <td class="mono">${esc(h.code)}</td><td>${esc(h.name)}</td><td class="ctr">${esc(h.unit||'ชิ้น')}</td>
     <td class="num"><input type="number" style="width:95px;text-align:right;${low?'color:#b45309;font-weight:700':''}" value="${h.qty}" onchange="frHqStockEdit(${i},'qty',this.value)"></td>
     <td class="num"><input type="number" style="width:75px;text-align:right" value="${h.min}" onchange="frHqStockEdit(${i},'min',this.value)"></td>
     <td class="num"><input type="number" style="width:75px;text-align:right" value="${h.max}" onchange="frHqStockEdit(${i},'max',this.value)"></td>
     <td class="ctr"><button class="btn sm gh" onclick="frHqStockDel(${i})">✕</button></td></tr>`;}).join('');
  const c=$('#frHqStockCnt'); if(c) c.textContent=FR.hqStock.length+' รายการ';
  const e=$('#frHqStockEmpty'); if(e) e.style.display=FR.hqStock.length?'none':'';
}
function frHqStockEdit(i,k,v){ const h=FR.hqStock[i]; if(h){ h[k]=n(v); frSave(); } }
function frHqStockDel(i){ FR.hqStock.splice(i,1); frSave(); frRenderHqStock(); }
async function frHqStockSeed(){
  /* DriveGo phase 2 (Q3): on its own data HQ copies the first branch's register, as the test copy did (HQ worked on that branch's data) */
  const src=KEY===HQKEY?(((await frReadBranchDB(FR.branches[0]))||{}).stock||[]):DB.stock;
  if(!src.length) return toast('สาขาที่กำลังเปิดอยู่ยังไม่มีทะเบียนสินค้าให้คัดลอก — เข้าดูสาขาที่มีข้อมูลก่อน');
  let add=0;
  src.forEach(s=>{
    if(FR.hqStock.some(h=>String(h.code).toLowerCase()===String(s.code).toLowerCase())) return;
    FR.hqStock.push({id:uid(),code:s.code,name:s.name,unit:s.unit||'ชิ้น',
      qty:Math.max(200,Math.round(n(s.max)*4)||200),min:50,max:Math.max(400,Math.round(n(s.max)*8)||400)});
    add++; });
  await frSave(); frRenderHqStock();
  toast('นำเข้า '+add+' รายการจากทะเบียนสาขา — ตั้งยอดคงคลังตั้งต้นของ HQ ให้แล้ว');
}
async function frHqStockAdd(){
  const code=await askPromptP({title:'เพิ่มสินค้าในคลัง HQ',text:'รหัสสินค้า',yes:'ต่อไป',no:'ยกเลิก'}); if(!code) return;
  const name=await askPromptP({title:'เพิ่มสินค้าในคลัง HQ',text:'ชื่อสินค้า',yes:'บันทึก',no:'ยกเลิก'}); if(!name) return;
  FR.hqStock.push({id:uid(),code:String(code),name:String(name),unit:'ชิ้น',qty:0,min:0,max:0});
  await frSave(); frRenderHqStock();
}

/* ---------- ผูกเหตุการณ์ + จัดตำแหน่ง DOM หลัง boot ---------- */
const _frBaseBoot=boot;
boot=function(){
  _frBaseBoot();
  try{
    const m=document.querySelector('main');
    const hq=document.getElementById('v-hq');
    if(m&&hq&&hq.parentElement!==m) m.appendChild(hq);
    const t=$('#frHqTabs');
    if(t&&!t.__frBound){ t.__frBound=true;
      t.addEventListener('click',e=>{ const b=e.target.closest('button[data-q]'); if(b) frHqGo(b.dataset.q); }); }
    const lu=$('#frLoginUser'), lp=$('#frLoginPass');
    if(lp&&!lp.__frBound){ lp.__frBound=true;
      lp.addEventListener('keydown',e=>{ if(e.key==='Enter') frDoLogin(); });
      if(lu) lu.addEventListener('keydown',e=>{ if(e.key==='Enter'&&lp) lp.focus(); }); }
    frApplyUI();
  }catch(e){}
  window.__frBootDone=true;
};

/* ---------- เผยตัวแปรหลักไว้บน window (ใช้ตรวจสอบ/ทดสอบระบบ) ----------
   ตัวแปรที่ประกาศด้วย let ในสคริปต์ไม่ขึ้น window เอง — ผูก getter/setter ให้ชี้ค่าเดียวกันเสมอ */
try{
  Object.defineProperty(window,'FR',{get:()=>FR,set:v=>{FR=v},configurable:true});
  Object.defineProperty(window,'DB',{get:()=>DB,set:v=>{DB=v},configurable:true});
  Object.defineProperty(window,'KEY',{get:()=>KEY,set:v=>{KEY=v},configurable:true});
  Object.defineProperty(window,'RQ',{get:()=>RQ,set:v=>{RQ=v},configurable:true});
}catch(e){}

/* ---------- เริ่มระบบแฟรนไชส์ (หลังแอปหลัก boot เสร็จ) ---------- */
window.PKG_FR_BOOT=(async()=>{
  await frLoadFR();
  for(let i=0;i<600&&!window.__frBootDone;i++) await new Promise(r=>setTimeout(r,25));
  if(!FR.enabled){ frApplyUI(); return; }     /* โหมดอู่เดี่ยว — ใช้งานแบบ ProX เดิมทันที ไม่มีหน้า Login */
  /* DriveGo phase 2 (A1): no demo chain accounts when none are loaded */
  const a=frAcc();
  if(!a){ frApplyUI(); const u=$('#frLoginUser'); if(u) try{u.focus()}catch(e){} return; }
  if(a.role==='HQ'){
    if(FR.session.inspect){ await frLoadBranch(FR.session.inspect); frApplyUI(); go('home'); }
    else{ if(KEY!==HQKEY) await frLoadHQ(); frApplyUI(); go('hq'); }   /* DriveGo phase 2 (Q3): HQ's own data */
  }else{
    const b=frBranch(a.branchId);
    if(!b||b.active===false||a.active===false){ FR.session={accId:'',inspect:''}; await frSave(); frApplyUI(); return; }
    if(brKey(b)!==KEY) await frLoadBranch(a.branchId);
    if(FR.session.empId){                       /* เปิดหน้าใหม่ทั้ง session พนักงาน — กลับเข้าในนามคนเดิม */
      const e=(DB.emp||[]).find(x=>x.id===FR.session.empId);
      if(!e||!empActive(e)||!e.pin){ FR.session={accId:'',inspect:''}; await frSave(); frApplyUI(); return; }
      DB.curEmp=e.id; try{ await save(); }catch(err2){}
      applyPerms();
    }
    frApplyUI();
    const first=PERM_TABS.find(([k])=>frBranchCan(k)&&(!FR.session.empId||can('tabs.'+k)));
    if(first&&(FR.session.empId||!frBranchCan('home'))) go(first[0]);
  }
})();
