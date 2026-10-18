/* 07 parts register: a gear after the title opens "ตั้งค่าสินค้าและอะไหล่" — an accordion window like the reference ERP
   (user 2026-10-02; sections the user chose): 1 หมวดอะไหล่ (the original category manager's body, moved in; its toolbar
   button is hidden), 2 หน่วยนับ (DB.units — standard units stay, own ones can be removed when unused), 3 พื้นที่จัดเก็บ
   (DB.zones — the zone list the stock form offers; standard A–H), 4 ยี่ห้อรถ (DB.brands — added to BRANDS for the customer
   form), 7 รหัสสินค้า (DB.codeRule {on,prefix,digits}: a new item gets prefix + next running number filled in).
   Needs stock.edit, like the category manager. */
(()=>{
 const tbl=document.getElementById('stockTbl');if(!tbl||typeof openCatMgr!=='function')return;
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const may=()=>can('stock.edit');
 /* ---------- data lists ---------- */
 const ZB=ZONES.slice();   /* the original's A–H */
 const zones=()=>{DB.zones=Array.isArray(DB.zones)?DB.zones:[];const own=DB.zones.map(z=>String(z).trim().toUpperCase()).filter(z=>z&&!ZB.includes(z));
  const all=ZB.concat(own);ZONES.length=0;ZONES.push(...all);return all;};
 const brands=()=>{DB.brands=Array.isArray(DB.brands)?DB.brands:[];DB.brands.forEach(b=>{if(b&&!BRANDS.includes(b)){const i=BRANDS.findIndex(x=>/^อื่น/.test(x));BRANDS.splice(i<0?BRANDS.length:i,0,b);}});return DB.brands;};
 const rule=()=>DB.codeRule||(DB.codeRule={on:false,prefix:'',digits:4});
 const unitUse=u=>DB.stock.filter(s=>(s.unit||'ชิ้น')===u).length,zoneUse=z=>DB.stock.filter(s=>String(s.zone||'').toUpperCase()===z).length;
 const brandUse=b=>DB.cust.reduce((k,c)=>k+(c.vehicles||[]).filter(v=>v.brand===b).length,0);
 /* next code for the rule: prefix + (largest number already used with that prefix + 1) */
 function nextCode(){const r=rule();const act=(r.prefixes||[]).find(p=>p.on);const on=act?true:!!r.on,p=String(act?act.text:(r.prefix||'')).trim();if(!on)return '';const d=Math.max(1,Math.min(8,n(r.digits)||4));
  let mx=0;DB.stock.forEach(s=>{const c=String(s.code||'');if(!c.startsWith(p))return;const m=c.slice(p.length).match(/^(\d+)$/);if(m)mx=Math.max(mx,+m[1]);});
  return p+String(mx+1).padStart(d,'0');}
 /* ---------- window ---------- */
 const m=document.createElement('div');m.className='modal';m.id='mStockSet';
 m.innerHTML=`<div class="sheet" style="max-width:1000px"><div class="panel" style="margin-bottom:0;border:0;border-radius:0">
  <header><h2>ตั้งค่าสินค้าและอะไหล่</h2><button type="button" class="pkg-mx" title="ปิด" aria-label="ปิด" onclick="closeModal('mStockSet')">✕</button></header>
  <div class="body pkg-sset">
   <p class="hint pkg-sset-note">ค่าที่ตั้งไว้ที่นี่ใช้ร่วมกันทั้งระบบ · กดหัวข้อเพื่อเปิด / ปิด</p>
   <section class="pkg-acc" data-k="cat"><button type="button" class="pkg-acc-h"><span>หมวดอะไหล่</span><i></i></button><div class="pkg-acc-b" id="pkgSsetCat"></div></section>
   <section class="pkg-acc" data-k="pbrand"><button type="button" class="pkg-acc-h"><span>แบรนด์สินค้า</span><i></i></button><div class="pkg-acc-b" id="pkgSsetPbrand"></div></section>
   <section class="pkg-acc" data-k="unit"><button type="button" class="pkg-acc-h"><span>หน่วยนับ</span><i></i></button><div class="pkg-acc-b" id="pkgSsetUnit"></div></section>
   <section class="pkg-acc" data-k="zone"><button type="button" class="pkg-acc-h"><span>พื้นที่จัดเก็บ (โซน)</span><i></i></button><div class="pkg-acc-b" id="pkgSsetZone"></div></section>
   <section class="pkg-acc" data-k="brand"><button type="button" class="pkg-acc-h"><span>ยี่ห้อรถ</span><i></i></button><div class="pkg-acc-b" id="pkgSsetBrand"></div></section>
   <section class="pkg-acc" data-k="code"><button type="button" class="pkg-acc-h"><span>รหัสสินค้า</span><i></i></button><div class="pkg-acc-b" id="pkgSsetCode"></div></section>
  </div>
  <footer><button class="btn gh" onclick="closeModal('mStockSet')">ปิด</button></footer></div></div>`;
 document.body.append(m);
 /* section 1: the original's category manager body moves in (its functions keep their ids) */
 const catBody=document.querySelector('#mCatMgr .body');if(catBody){document.getElementById('pkgSsetCat').append(...catBody.children);}
 document.querySelectorAll('[onclick="openCatMgr()"]').forEach(b=>b.classList.add('pkg-io-moved'));
 /* ---------- sections in the reference's shape: a form on top (field + "สร้างข้อมูลใหม่" / "บันทึก"), then
    "แสดง N รายการ" + search and a numbered table (user 2026-10-02, screenshots) ---------- */
 const SEC={
  get pbrand(){return window.PKG_PBRAND?PKG_PBRAND.sec:null;},   /* แบรนด์สินค้า (DB.partBrands) — the section lives in product-brand.js, which loads later */
  unit:{label:'หน่วยนับ',ph:'เช่น แกลลอน',noun:'รายการ',items:()=>{syncLists();return UNITS.map(u=>({v:u,std:!(DB.units||[]).includes(u)}));},use:unitUse,
   add:v=>{if(UNITS.includes(v))return 'มีหน่วย “'+v+'” อยู่แล้ว';DB.units=DB.units||[];DB.units.push(v);syncLists();},
   rename:(o,v)=>{if(UNITS.includes(v))return 'มีหน่วย “'+v+'” อยู่แล้ว';DB.units=(DB.units||[]).map(u=>u===o?v:u);DB.stock.forEach(s=>{if((s.unit||'ชิ้น')===o)s.unit=v;});syncLists();},
   del:v=>{if(unitUse(v))return 'หน่วยนี้ยังมีสินค้าใช้อยู่';DB.units=(DB.units||[]).filter(u=>u!==v);syncLists();},kind:'stock'},
  zone:{label:'โซนจัดเก็บ',ph:'เช่น J หรือ MEZZ',noun:'รายการ',items:()=>zones().map(z=>({v:z,std:ZB.includes(z)})),use:zoneUse,norm:v=>v.toUpperCase(),
   add:v=>{if(zones().includes(v))return 'มีโซน “'+v+'” อยู่แล้ว';DB.zones.push(v);zones();},
   rename:(o,v)=>{if(zones().includes(v))return 'มีโซน “'+v+'” อยู่แล้ว';DB.zones=DB.zones.map(z=>String(z).toUpperCase()===o?v:z);DB.stock.forEach(s=>{if(String(s.zone||'').toUpperCase()===o)s.zone=v;});ZONES.length=0;ZONES.push(...ZB);zones();},
   del:v=>{if(zoneUse(v))return 'โซนนี้ยังมีสินค้าเก็บอยู่';DB.zones=(DB.zones||[]).filter(z=>String(z).toUpperCase()!==v);ZONES.length=0;ZONES.push(...ZB);zones();},kind:'stock'},
  brand:{label:'ชื่อยี่ห้อรถ',ph:'เช่น Sany (ซานี่)',noun:'คัน',items:()=>{brands();return BRANDS.map(b=>({v:b,std:!(DB.brands||[]).includes(b)}));},use:brandUse,
   add:v=>{if(BRANDS.some(b=>b.toLowerCase()===v.toLowerCase()))return 'มียี่ห้อ “'+v+'” อยู่แล้ว';DB.brands=DB.brands||[];DB.brands.push(v);brands();},
   rename:(o,v)=>{if(BRANDS.some(b=>b.toLowerCase()===v.toLowerCase()))return 'มียี่ห้อ “'+v+'” อยู่แล้ว';DB.brands=(DB.brands||[]).map(b=>b===o?v:b);const i=BRANDS.indexOf(o);if(i>=0)BRANDS[i]=v;DB.cust.forEach(c=>(c.vehicles||[]).forEach(x=>{if(x.brand===o)x.brand=v;}));},
   del:v=>{if(brandUse(v))return 'ยี่ห้อนี้ยังมีรถของลูกค้าใช้อยู่';DB.brands=(DB.brands||[]).filter(b=>b!==v);const i=BRANDS.indexOf(v);if(i>=0)BRANDS.splice(i,1);},kind:'cust'}};
 const ui={};   /* per section: editing value, search text, page size */
 const st=k=>ui[k]||(ui[k]={edit:'',q:'',lim:10});
 function section(k){
  const c=SEC[k],u=st(k),all=c.items(),q=u.q.toLowerCase(),rows=all.filter(x=>!q||x.v.toLowerCase().includes(q)),shown=rows.slice(0,u.lim);
  return `<div class="pkg-sset-form"><label class="f"><span>${c.label} <b class="req">*</b></span><input type="text" data-field="${k}" value="${esc2(u.edit)}" placeholder="${c.ph}"></label>
   <div class="pkg-sset-btns"><button type="button" class="btn pri pkg-btn-new" data-new="${k}">+ สร้างข้อมูลใหม่</button><span class="hint" data-editing="${k}">${u.edit?'กำลังแก้ไข “'+esc2(u.edit)+'” — เปลี่ยนชื่อแล้วกดบันทึก':''}</span><button type="button" class="btn pri pkg-btn-save" data-save="${k}">บันทึก</button></div></div>
   <div class="pkg-sset-tools"><label class="row">แสดง <select data-lim="${k}">${[10,25,50,100].map(x=>`<option value="${x}"${u.lim===x?' selected':''}>${x}</option>`).join('')}</select> รายการ</label><label class="row">ค้นหาข้อมูล <input type="text" data-q="${k}" value="${esc2(u.q)}" placeholder="ค้นหาข้อมูล"></label></div>
   <table class="tbl pkg-sset-tbl"><thead><tr><th class="ctr" style="width:90px">ลำดับ</th><th>${c.label}</th><th class="ctr" style="width:150px">สินค้าที่ใช้</th><th class="ctr" style="width:120px">ที่มา</th><th class="ctr" style="width:90px">ลบ</th></tr></thead><tbody>
   ${shown.map((x,i)=>{const used=c.use(x.v);return `<tr><td class="ctr">${i+1}</td><td><a href="#" class="pkg-sset-edit" data-edit="${k}" data-v="${esc2(x.v)}">${esc2(x.v)}</a></td><td class="ctr">${used?used+' '+c.noun:'<span class="hint">—</span>'}</td><td class="ctr">${x.std?'<span class="chip">มาตรฐาน</span>':'<span class="chip b">เพิ่มเอง</span>'}</td><td class="ctr">${x.std||used?'<span class="hint">—</span>':`<button type="button" class="btn sm dgr" data-del="${esc2(x.v)}">ลบ</button>`}</td></tr>`;}).join('')||'<tr><td colspan="5" class="hint ctr">ไม่พบรายการ</td></tr>'}
   </tbody></table><div class="hint pkg-sset-foot">แสดงอยู่ 1 ถึง ${shown.length} จาก ${rows.length} รายการ</div>`;
 }
 function codeSection(){
  const r=rule();r.prefixes=Array.isArray(r.prefixes)?r.prefixes:(r.prefix?[{text:r.prefix,on:!!r.on}]:[]);const u=st('code');
  const active=r.prefixes.find(p=>p.on);r.on=!!active;r.prefix=active?active.text:'';
  return `<p class="hint">ติ๊ก "ใช้งาน" ไว้ที่คำนำหน้าใดคำนำหน้าหนึ่ง เมื่อกด "+ เพิ่มอะไหล่" ระบบจะใส่รหัสถัดไปให้เอง (คำนำหน้า + เลขรันต่อจากรหัสสูงสุดที่มีคำนำหน้าเดียวกัน แก้ได้ก่อนบันทึก) · ไม่ติ๊กเลย = พิมพ์รหัสเอง</p>
   <div class="pkg-sset-form"><label class="f"><span>ข้อความหน้ารหัสสินค้า <b class="req">*</b></span><input type="text" data-field="code" value="${esc2(u.edit)}" placeholder="เช่น P- หรือ SP"></label>
   <div class="pkg-sset-btns"><button type="button" class="btn pri pkg-btn-new" data-new="code">+ สร้างข้อมูลใหม่</button><label class="row" style="gap:6px">จำนวนหลัก <select id="pkgSsetCodeDig">${[3,4,5,6].map(d=>`<option value="${d}"${(n(r.digits)||4)===d?' selected':''}>${d}</option>`).join('')}</select></label><span class="hint">ตัวอย่างรหัสถัดไป: <b id="pkgSsetCodeEg" class="mono">${esc2(nextCode()||'—')}</b></span><button type="button" class="btn pri pkg-btn-save" data-save="code">บันทึก</button></div></div>
   <table class="tbl pkg-sset-tbl"><thead><tr><th class="ctr" style="width:90px">ลำดับ</th><th>ข้อความ</th><th class="ctr" style="width:150px">รหัสที่ใช้อยู่</th><th class="ctr" style="width:110px">ใช้งาน</th><th class="ctr" style="width:90px">ลบ</th></tr></thead><tbody>
   ${r.prefixes.map((p,i)=>`<tr><td class="ctr">${i+1}</td><td><a href="#" class="pkg-sset-edit" data-edit="code" data-v="${esc2(p.text)}">${esc2(p.text)}</a></td><td class="ctr">${DB.stock.filter(s=>String(s.code||'').startsWith(p.text)).length||'<span class="hint">—</span>'}</td><td class="ctr"><input type="checkbox" data-on="${esc2(p.text)}"${p.on?' checked':''}></td><td class="ctr"><button type="button" class="btn sm dgr" data-delcode="${esc2(p.text)}">ลบ</button></td></tr>`).join('')||'<tr><td colspan="5" class="hint ctr">ยังไม่มีคำนำหน้า</td></tr>'}
   </tbody></table>`;
 }
 function render(){
  document.getElementById('pkgSsetUnit').innerHTML=section('unit');document.getElementById('pkgSsetZone').innerHTML=section('zone');document.getElementById('pkgSsetBrand').innerHTML=section('brand');
  if(SEC.pbrand)document.getElementById('pkgSsetPbrand').innerHTML=section('pbrand');
  document.getElementById('pkgSsetCode').innerHTML=codeSection();
 }
 function saveField(k){
  const inp=m.querySelector(`[data-field="${k}"]`),raw=inp.value.trim();if(!raw)return toast('กรอก'+(k==='code'?'ข้อความหน้ารหัสสินค้า':SEC[k].label)+'ก่อนบันทึก');
  const u=st(k);
  if(k==='code'){const r=rule();r.prefixes=r.prefixes||[];
   if(u.edit){const p=r.prefixes.find(x=>x.text===u.edit);if(p)p.text=raw;}else{if(r.prefixes.some(p=>p.text===raw))return toast('มีคำนำหน้านี้อยู่แล้ว');r.prefixes.push({text:raw,on:!r.prefixes.length});}
   r.digits=n(document.getElementById('pkgSsetCodeDig')?.value)||4;logAudit('stock',{no:raw},'save',(u.edit?'แก้ไข':'เพิ่ม')+'คำนำหน้ารหัสสินค้า “'+raw+'”');}
  else{const c=SEC[k],v=c.norm?c.norm(raw):raw;const err=u.edit?(u.edit===v?null:c.rename(u.edit,v)):c.add(v);if(err)return toast(err);
   logAudit(c.kind,{no:v},'save',(u.edit?'เปลี่ยนชื่อ “'+u.edit+'” เป็น':'เพิ่ม'+c.label)+' “'+v+'”');}
  u.edit='';save();render();if(typeof refreshCatViews==='function'&&k!=='code')try{renderStock();}catch(e){}
  toast('บันทึกแล้ว');
 }
 m.addEventListener('click',e=>{
  const h=e.target.closest('.pkg-acc-h');if(h){h.closest('.pkg-acc').classList.toggle('open');return;}
  const nw=e.target.closest('[data-new]');if(nw){st(nw.dataset.new).edit='';render();m.querySelector(`[data-field="${nw.dataset.new}"]`)?.focus();return;}
  const sv=e.target.closest('[data-save]');if(sv)return saveField(sv.dataset.save);
  const ed=e.target.closest('[data-edit]');if(ed){e.preventDefault();st(ed.dataset.edit).edit=ed.dataset.v;render();m.querySelector(`[data-field="${ed.dataset.edit}"]`)?.focus();return;}
  const dl=e.target.closest('[data-del]');if(dl){const k=dl.closest('.pkg-acc').dataset.k,c=SEC[k],v=dl.dataset.del,err=c.del(v);if(err)return toast(err);logAudit(c.kind,{no:v},'del','ลบ'+c.label+' “'+v+'”');save();render();return toast('ลบ “'+v+'” แล้ว');}
  const dc=e.target.closest('[data-delcode]');if(dc){const r=rule();r.prefixes=(r.prefixes||[]).filter(p=>p.text!==dc.dataset.delcode);save();render();return;}
 });
 m.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-field]')){e.preventDefault();saveField(e.target.dataset.field);}});
 m.addEventListener('input',e=>{const q=e.target.dataset.q;if(q){st(q).q=e.target.value;const sec=document.getElementById('pkgSset'+q[0].toUpperCase()+q.slice(1));const keep=e.target;sec.innerHTML=section(q);const ni=sec.querySelector(`[data-q="${q}"]`);ni.focus();ni.setSelectionRange(ni.value.length,ni.value.length);}});
 m.addEventListener('change',e=>{
  const l=e.target.dataset.lim;if(l){st(l).lim=+e.target.value;render();return;}
  const on=e.target.dataset.on;if(on!=null){const r=rule();(r.prefixes||[]).forEach(p=>p.on=e.target.checked&&p.text===on);save();render();return;}
  if(e.target.id==='pkgSsetCodeDig'){rule().digits=n(e.target.value)||4;save();document.getElementById('pkgSsetCodeEg').textContent=nextCode()||'—';}
 });
 function open(section){if(!may())return toast('บัญชีนี้ไม่มีสิทธิตั้งค่าสินค้า');syncLists();if(typeof renderCatMgr==='function')renderCatMgr();const cn=document.getElementById('catMgrNew');if(cn)cn.value='';
  Object.keys(ui).forEach(k=>{ui[k].edit='';ui[k].q='';});render();m.querySelectorAll('.pkg-acc').forEach(s=>s.classList.toggle('open',s.dataset.k===(section||'cat')));openModal('mStockSet');}
 window.openCatMgr=function(){open('cat');};   /* anything that still calls the old manager lands in section 1 */
 /* the gear after the register title */
 const gear=document.createElement('button');gear.type='button';gear.className='pkg-gear sc-edit';gear.title='ตั้งค่าสินค้าและอะไหล่';gear.setAttribute('aria-label','ตั้งค่าสินค้าและอะไหล่');
 gear.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
 gear.addEventListener('click',()=>open('cat'));
 /* after reg-layout has lifted the title above the frame (it does so on a timer after load) */
 const place=()=>{const panel=tbl.closest('.panel'),head=panel&&panel.previousElementSibling?.classList.contains('pkg-page-head')?panel.previousElementSibling:null;(head||panel.querySelector(':scope>header')).append(gear);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(place,0));else setTimeout(place,0);
 /* new item: the running code is filled in */
 const oOpen=window.openStock;window.openStock=function(id){const r=oOpen.apply(this,arguments);if(!id&&rule().on){const f=document.getElementById('fCode');if(f&&!f.value.trim())f.value=nextCode();}return r;};
 zones();brands();
 window.PKG_STOCK_SETTINGS={open,render,nextCode,rule,zones,brands};
})();
