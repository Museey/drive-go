/* 02 customers and 05 vendors: a gear after the register title opens "ตั้งค่าทะเบียนลูกค้า" / "ตั้งค่าทะเบียนคู่ค้า" with
   one section, the record code (user 2026-10-02, reference screenshots): a list of code prefixes (up to 5 characters), one
   ticked "ใช้งาน"; while one is active every new customer / vendor gets prefix + running number as its code (DB.custRule /
   DB.venRule {prefixes:[{text,on}],digits}). The code shows in the form title and under the name in the register. Needs
   the same right as editing that register. */
(()=>{
 if(typeof saveCust!=='function'||typeof saveVen!=='function')return;
 const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const KINDS={
  cust:{title:'ตั้งค่าทะเบียนลูกค้า',sec:'รหัสลูกค้า',rule:'custRule',list:()=>DB.cust,tbl:'custLTbl',may:()=>can('doc.custEdit'),nameCol:'ชื่อลูกค้า',titleEl:'mCustTitle',audit:'cust'},
  vendor:{title:'ตั้งค่าทะเบียนคู่ค้า',sec:'รหัสคู่ค้า',rule:'venRule',list:()=>DB.vendors,tbl:'venTbl',may:()=>can('doc.venEdit'),nameCol:'ชื่อผู้ขาย',titleEl:'mVenTitle',audit:'vendor'}};
 const DIGITS=5;   /* running number always 5 digits, e.g. C00001 (user 2026-10-09) */
 /* a code runs from the start (user 2026-10-11): with no prefix list yet the register gets C (customers) / V (vendors),
    ticked. The gear window still changes it; un-ticking every prefix = no codes, as before. */
 const DEF={cust:'C',vendor:'V'};
 const rule=k=>{const r=DB[KINDS[k].rule]||(DB[KINDS[k].rule]={prefixes:[],digits:DIGITS});
  if(!Array.isArray(r.prefixes)||!r.prefixes.length)r.prefixes=[{text:DEF[k],on:true}];return r;};
 function nextCode(k){const r=rule(k),a=(r.prefixes||[]).find(p=>p.on);if(!a)return '';const p=a.text,d=DIGITS;
  let mx=0;KINDS[k].list().forEach(x=>{const c=String(x.code||'');if(!c.startsWith(p))return;const m=c.slice(p.length).match(/^(\d+)$/);if(m)mx=Math.max(mx,+m[1]);});return p+String(mx+1).padStart(d,'0');}
 const ui={};const st=k=>ui[k]||(ui[k]={edit:''});
 function body(k){
  const r=rule(k),u=st(k),K=KINDS[k];r.prefixes=Array.isArray(r.prefixes)?r.prefixes:[];
  return `<div class="pkg-sset-form"><label class="f"><span>อักษรนำหน้ารหัส <b class="req">*</b></span><input type="text" maxlength="5" data-field="${k}" value="${esc2(u.edit)}" placeholder="ระบุสูงสุด 5 ตัวอักษร"></label>
   <div class="pkg-sset-btns"><button type="button" class="btn pri pkg-btn-new" data-new="${k}">+ สร้างข้อมูลใหม่</button><span class="hint">เลขรัน ${DIGITS} หลัก</span><span class="hint">รหัสถัดไป: <b class="mono" data-eg="${k}">${esc2(nextCode(k)||'—')}</b></span><button type="button" class="btn pri pkg-btn-save" data-save="${k}">บันทึก</button></div></div>
   <p class="hint">ติ๊ก "เลือกรหัสที่ต้องการใช้งาน" ไว้ที่อักษรนำหน้าเดียว · ${k==='cust'?'ลูกค้า':'คู่ค้า'}ใหม่ทุกรายจะได้รหัสถัดไปโดยอัตโนมัติ · ไม่ติ๊กเลย = ไม่ออกรหัส</p>
   <table class="tbl pkg-sset-tbl"><thead><tr><th class="ctr" style="width:90px">ลำดับ</th><th>อักษรนำหน้ารหัส</th><th class="ctr" style="width:150px">รายที่ใช้รหัสนี้</th><th class="ctr" style="width:200px">เลือกรหัสที่ต้องการใช้งาน</th><th class="ctr" style="width:90px">ลบ</th></tr></thead><tbody>
   ${r.prefixes.map((p,i)=>`<tr><td class="ctr">${i+1}</td><td><a href="#" class="pkg-sset-edit" data-edit="${k}" data-v="${esc2(p.text)}">${esc2(p.text)}</a></td><td class="ctr">${K.list().filter(x=>String(x.code||'').startsWith(p.text)).length||'<span class="hint">—</span>'}</td><td class="ctr"><input type="checkbox" data-on="${k}" data-v="${esc2(p.text)}"${p.on?' checked':''}></td><td class="ctr"><button type="button" class="btn sm dgr" data-del="${k}" data-v="${esc2(p.text)}">ลบ</button></td></tr>`).join('')||'<tr><td colspan="5" class="hint ctr">ยังไม่มีอักษรนำหน้ารหัส</td></tr>'}
   </tbody></table><div class="hint pkg-sset-foot">แสดงอยู่ 1 ถึง ${r.prefixes.length} จาก ${r.prefixes.length} รายการ</div>`;
 }
 const modals={};
 function modal(k){
  if(modals[k])return modals[k];const K=KINDS[k],m=document.createElement('div');m.className='modal';m.id='mSet_'+k;
  m.innerHTML=`<div class="sheet" style="max-width:1000px"><div class="panel" style="margin-bottom:0;border:0;border-radius:0"><header><h2>${K.title}</h2><button type="button" class="pkg-mx" title="ปิด" aria-label="ปิด" onclick="closeModal('mSet_${k}')">✕</button></header>
   <div class="body pkg-sset"><section class="pkg-acc open" data-k="${k}"><button type="button" class="pkg-acc-h"><span>${K.sec}</span><i></i></button><div class="pkg-acc-b" data-body="${k}"></div></section></div>
   <footer><button class="btn gh" onclick="closeModal('mSet_${k}')">ปิด</button></footer></div></div>`;
  document.body.append(m);
  m.addEventListener('click',e=>{
   const h=e.target.closest('.pkg-acc-h');if(h){h.closest('.pkg-acc').classList.toggle('open');return;}
   const nw=e.target.closest('[data-new]');if(nw){st(k).edit='';render(k);m.querySelector('[data-field]').focus();return;}
   const sv=e.target.closest('[data-save]');if(sv)return saveField(k);
   const ed=e.target.closest('[data-edit]');if(ed){e.preventDefault();st(k).edit=ed.dataset.v;render(k);m.querySelector('[data-field]').focus();return;}
   const dl=e.target.closest('[data-del]');if(dl){const r=rule(k);r.prefixes=r.prefixes.filter(p=>p.text!==dl.dataset.v);logAudit(K.audit,{no:dl.dataset.v},'del','ลบอักษรนำหน้ารหัส “'+dl.dataset.v+'”');save();render(k);return;}
  });
  m.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('[data-field]')){e.preventDefault();saveField(k);}});
  m.addEventListener('change',e=>{
   if(e.target.dataset.on){const r=rule(k);r.prefixes.forEach(p=>p.on=e.target.checked&&p.text===e.target.dataset.v);save();render(k);return;}
   if(e.target.dataset.dig){rule(k).digits=n(e.target.value)||4;save();m.querySelector('[data-eg]').textContent=nextCode(k)||'—';}
  });
  return modals[k]=m;
 }
 function render(k){modal(k).querySelector(`[data-body="${k}"]`).innerHTML=body(k);}
 function saveField(k){
  const K=KINDS[k],m=modal(k),raw=m.querySelector('[data-field]').value.trim().slice(0,5);if(!raw)return toast('กรอกอักษรนำหน้ารหัสก่อนบันทึก');
  const r=rule(k),u=st(k);
  if(u.edit){const p=r.prefixes.find(x=>x.text===u.edit);if(p)p.text=raw;}else{if(r.prefixes.some(p=>p.text===raw))return toast('มีอักษรนำหน้านี้อยู่แล้ว');r.prefixes.push({text:raw,on:!r.prefixes.length});}
  r.digits=DIGITS;logAudit(K.audit,{no:raw},'save',(u.edit?'แก้ไข':'เพิ่ม')+'อักษรนำหน้ารหัส “'+raw+'”');u.edit='';save();render(k);toast('บันทึกแล้ว');
 }
 function open(k){const K=KINDS[k];if(!K.may())return toast('บัญชีนี้ไม่มีสิทธิ์ตั้งค่าทะเบียนนี้');st(k).edit='';render(k);openModal('mSet_'+k);}
 /* ---------- codes on new records ---------- */
 const fill=k=>{if(typeof DB==='undefined'||!DB||!Array.isArray(KINDS[k].list()))return 0;if(!nextCode(k))return 0;
  const todo=KINDS[k].list().filter(x=>x&&!x.code);todo.forEach(x=>{x.code=nextCode(k);});return todo.length;};
 const assign=(k)=>{if(fill(k))save();};
 /* records made before codes ran (and ones other screens add straight into the list) get theirs in list order */
 const backfill=()=>{let n=0;try{n=fill('cust')+fill('vendor');}catch(e){}if(n){save();paint('cust');paint('vendor');}};
 const wrapSave=(name,k)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(){const before=new Set(KINDS[k].list().map(x=>x.id));const r=o.apply(this,arguments);
  const done=()=>{assign(k,before);paint(k);};if(r&&typeof r.then==='function')return r.then(x=>{done();return x;});done();return r;};};
 wrapSave('saveCust','cust');wrapSave('saveVen','vendor');wrapSave('impCustApply','cust');
 if(typeof PKG_DATA_IO!=='undefined'&&PKG_DATA_IO.venApply){const o=PKG_DATA_IO.venApply;PKG_DATA_IO.venApply=async function(){const before=new Set(DB.vendors.map(x=>x.id));const r=await o.apply(this,arguments);assign('vendor',before);paint('vendor');return r;};}
 /* ---------- where the code shows: form title + under the name in the register ---------- */
 const wrapOpen=(name,k)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(id){const r=o.apply(this,arguments);const rec=id&&KINDS[k].list().find(x=>x.id===id),h=document.getElementById(KINDS[k].titleEl);
  if(h)h.querySelector('.pkg-code-tag')?.remove();
  /* the code as the first field of the form: read-only, the next code for a new record */
  const f=field(k);if(f){const nx=nextCode(k);f.value=rec?(rec.code||nx||''):(nx||'');f.placeholder=nx?'':'ยังไม่ได้เปิดใช้รหัส';
   f.title=rec&&rec.code?'รหัสนี้ระบบออกให้ แก้ไขไม่ได้':(nx?'ระบบจะออกรหัสนี้ให้เมื่อกดบันทึก':'');}
  return r;};};
 const FIELD={cust:{anchor:'cTax',id:'pkgCustCode',label:'รหัสลูกค้า',cls:'c'},vendor:{anchor:'vName',id:'pkgVenCode',label:'รหัสผู้ขาย',cls:'v'}};
 function field(k){const F=FIELD[k];let f=document.getElementById(F.id);if(f)return f;const a=document.getElementById(F.anchor),row=a&&a.closest('label')&&a.closest('label').parentElement;if(!row)return null;
  const l=document.createElement('label');l.className='f pkg-code-f';l.innerHTML='<span>'+F.label+' <small class="hint">(อัตโนมัติ)</small></span><input type="text" class="mono" id="'+F.id+'" readonly tabindex="-1" aria-readonly="true">';
  row.prepend(l);row.classList.add('pkg-code-row','pkg-code-row-'+F.cls);return document.getElementById(F.id);}
 wrapOpen('openCust','cust');wrapOpen('openVen','vendor');
 function paint(k){const K=KINDS[k],t=document.getElementById(K.tbl);if(!t||!t.tHead)return;
  const ci=[...t.tHead.rows[0].cells].findIndex(th=>(th.dataset.lbl||th.textContent).trim().startsWith(K.nameCol));if(ci<0)return;
  [...t.tBodies[0].rows].forEach(tr=>{const key=tr.dataset.pkgKey;if(!key||tr.cells.length<=ci||tr.querySelector('.pkg-code-line'))return;const id=String(key).split('|')[0],rec=K.list().find(x=>x.id===id);
   if(rec&&rec.code){const d=document.createElement('div');d.className='hint mono pkg-code-line';d.textContent=rec.code;tr.cells[ci].append(d);}});}
 ['renderCustList','renderVen'].forEach((name,i)=>{const o=window[name];if(typeof o!=='function')return;const k=i?'vendor':'cust';window[name]=function(){const r=o.apply(this,arguments);setTimeout(()=>paint(k),0);return r;};});
 /* ---------- gears after the register titles ---------- */
 const GEAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>';
 function place(){Object.entries(KINDS).forEach(([k,K])=>{const t=document.getElementById(K.tbl);if(!t)return;const panel=t.closest('.panel'),head=panel&&panel.previousElementSibling?.classList.contains('pkg-page-head')?panel.previousElementSibling:null;
  const g=document.createElement('button');g.type='button';g.className='pkg-gear pkg-gear-'+k;g.title=K.title;g.setAttribute('aria-label',K.title);g.innerHTML=GEAR;g.addEventListener('click',()=>open(k));(head||panel.querySelector(':scope>header')).append(g);});paintGears();}
 function paintGears(){Object.entries(KINDS).forEach(([k,K])=>document.querySelectorAll('.pkg-gear-'+k).forEach(g=>g.hidden=!K.may()));}
 const ap=window.applyPerms;window.applyPerms=function(){const r=ap.apply(this,arguments);paintGears();backfill();return r;};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(place,0));else setTimeout(place,0);
 window.PKG_CODE_SETTINGS={open,render,nextCode,rule,paint,backfill,kinds:KINDS};
})();
