/* "สิทธิ์เฉพาะทาง" — the two old tick lists in the staff form (27 stock-field / sensitive boxes) become four grouped
   boxes like the reference ERP (user 2026-10-01): แสดงต้นทุน (one switch), แสดงราคาขาย (A / B / C + set own price),
   ส่วนลด (allow / deny — the user now wants it), การเงิน, ระบบ. The old boxes stay in the form, hidden: these controls
   drive their hidden tick boxes, so saveEmp / permPreset / the stored data format are untouched.
   Cost switch = stock.cost + stock.summary + doc.homeMoney together (07 cost column, value card, category summary,
   home-page money, FIFO cost box, reports / Excel / PDF cost columns). Dropped stock-field switches (รหัส ชื่อ หมวด
   ปริมาณ Min-Max วันที่ พื้นที่ บัตรสินค้า รูป) are always on — 11.1 hides columns instead.
   New key doc.discount: the document discount field (03 / 4.1 / 4.4) is locked without it; existing staff keep it. */
(()=>{
 if(typeof PERM_DOC==='undefined'||typeof permBoxes!=='function')return;
 if(!PERM_DOC.some(([k])=>k==='discount'))PERM_DOC.push(['discount','ให้ส่วนลดในเอกสาร (ใบเสนอราคา · ใบเสร็จ · ขายหน้าร้าน)']);
 /* DriveGo new system (task 3.3, decisions R4-ข, T3, T10, T12): three tax rights under "การเงิน", which no staff member has
    until the owner ticks them (existing staff get nothing, the manager set leaves them off) */
 const TAX=[['noVat','เลือกไม่คิด VAT (ต้องใส่เหตุผล)'],['taxClose','ปิดงวดภาษี'],['creditNote','ออกใบลดหนี้']];
 TAX.forEach(r=>{if(!PERM_DOC.some(([k])=>k===r[0]))PERM_DOC.push(r);});
 /* staff who exist already could give discounts: keep that */
 (DB.emp||[]).forEach(e=>{if(e.perms&&e.perms.doc&&e.perms.doc.discount===undefined)e.perms.doc.discount=true;});
 const ALWAYS=['code','oem','name','cat','qty','minmax','lastmove','loc','card','img'];
 const COST=[['stock','cost'],['stock','summary'],['doc','homeMoney']];
 const FIN=[['payRec','รับชำระจากลูกหนี้'],['payGr','จ่ายเงินเจ้าหนี้'],['fin','ดูสรุปการเงิน ภาษี และเงินเดือน'],['acctEdit','บันทึกค่าใช้จ่าย สินทรัพย์ และเงินลงทุน'],['coa','จัดการผังบัญชีและการผูกบัญชี'],...TAX];
 const SYS=[['emp','ดูและแก้ไขพนักงานและสิทธิ์'],['orgEdit','ตั้งค่าองค์กร · ภาษี · อายุการใช้งาน'],['hrEdit','งานบุคคล การลา และใบเตือน'],['import','นำเข้าข้อมูลจากไฟล์'],['export','ส่งออกไฟล์สำรอง'],['backup','สำรองและกู้คืนข้อมูลทั้งระบบ'],['wipe','ล้างข้อมูลทั้งระบบ']];
 const pk=(g,k)=>document.querySelector(`.pk[data-g="${g}"][data-k="${k}"]`);
 const get=(g,k)=>!!pk(g,k)?.checked,set=(g,k,v)=>{const el=pk(g,k);if(el)el.checked=!!v;};
 const box=document.createElement('div');box.className='permbox pkg-perm-special';box.id='pkg-perm-special';
 const r=(name,val,label,on)=>`<label class="pkg-ps-opt"><input type="radio" name="${name}" value="${val}"${on?' checked':''}><span>${label}</span></label>`;
 const c=(key,label,on)=>`<label class="pkg-ps-opt"><input type="checkbox" data-ps="${key}"${on?' checked':''}><span>${label}</span></label>`;
 function render(){
  const owned=typeof pkgPermOwned==='function'?pkgPermOwned():new Set();
  const used=new Set([...COST.map(([g,k])=>g+'.'+k),...FIN.map(([k])=>'doc.'+k),...SYS.map(([k])=>'doc.'+k),'doc.editPrice','doc.discount','doc.qApprove','stock.pa','stock.pb','stock.pc',...ALWAYS.map(k=>'stock.'+k)]);
  const other=[...PERM_DOC.map(([k,l])=>['doc',k,l]),...PERM_STOCK.map(([k,l])=>['stock',k,l])].filter(([g,k])=>!used.has(g+'.'+k)&&!owned.has(g+'.'+k));
  const cost=get('stock','cost'),disc=get('doc','discount');
  box.innerHTML=`<h4>สิทธิ์เฉพาะทาง — ต้นทุน ราคา ส่วนลด การเงิน และระบบ</h4><div class="pkg-ps-grid">
   <section class="pkg-ps"><h5>แสดงต้นทุน</h5><div class="pkg-ps-row">${r('pkgPsCost','0','ไม่แสดงต้นทุน',!cost)}${r('pkgPsCost','1','แสดงต้นทุน',cost)}</div>
    <p class="hint">สวิตช์เดียวคุมทุกที่: ต้นทุนในทะเบียนอะไหล่ กล่องมูลค่ารวม สรุปตามหมวด ยอดเงินหน้าแรก ต้นทุน FIFO และช่องต้นทุนในรายงาน / Excel / PDF</p></section>
   <section class="pkg-ps"><h5>แสดงราคาขาย</h5><div class="pkg-ps-row">${c('stock.pa','ราคาขาย A',get('stock','pa'))}${c('stock.pb','ราคาขาย B',get('stock','pb'))}${c('stock.pc','ราคาขาย C',get('stock','pc'))}</div>
    <div class="pkg-ps-row">${c('doc.editPrice','กำหนดราคาเองในเอกสาร (อะไหล่ · ชุดอะไหล่ · ค่าแรง)',get('doc','editPrice'))}</div>
    <p class="hint">ระดับที่ไม่ติ๊กจะไม่เห็นในทะเบียนอะไหล่และไฟล์ที่ส่งออก · เอกสารใช้ราคาตามระดับของลูกค้าให้เอง</p></section>
   <section class="pkg-ps"><h5>การให้ส่วนลด</h5><div class="pkg-ps-row">${r('pkgPsDisc','1','อนุญาต',disc)}${r('pkgPsDisc','0','ไม่อนุญาต',!disc)}</div>
    <p class="hint">ไม่อนุญาต = ช่อง "ส่วนลด (บาท)" ในใบเสนอราคา ใบเสร็จ และขายหน้าร้านถูกล็อกไว้ที่ 0</p></section>
   <section class="pkg-ps"><h5>การเงิน</h5><div class="pkg-ps-col">${FIN.map(([k,l])=>c('doc.'+k,l,get('doc',k))).join('')}</div></section>
   <section class="pkg-ps"><h5>ระบบ</h5><div class="pkg-ps-col">${SYS.map(([k,l])=>c('doc.'+k,l,get('doc',k))).join('')}</div></section>
   ${other.length?`<section class="pkg-ps"><h5>อื่น ๆ</h5><div class="pkg-ps-col">${other.map(([g,k,l])=>c(g+'.'+k,l,get(g,k))).join('')}</div></section>`:''}
  </div>`;
  ALWAYS.forEach(k=>set('stock',k,true));   /* no switch any more: always on */
 }
 box.addEventListener('change',e=>{
  const t=e.target;if(t.name==='pkgPsCost')COST.forEach(([g,k])=>set(g,k,t.value==='1'));
  else if(t.name==='pkgPsDisc')set('doc','discount',t.value==='1');
  else if(t.dataset.ps){const [g,k]=t.dataset.ps.split('.');set(g,k,t.checked);}
 });
 /* the form: old boxes hidden, ours after the matrix */
 const o=window.permBoxes;window.permBoxes=function(){const out=o.apply(this,arguments);
  ['#permStock','#permDoc'].forEach(s=>document.querySelector(s)?.closest('.permbox')?.classList.add('pkg-perm-hidden'));
  const after=document.getElementById('pkg-perm-matrix')||document.querySelector('#permDoc')?.closest('.permbox');if(after&&box.parentElement!==after.parentElement)after.after(box);
  const emp=editEmpId?DB.emp.find(x=>x.id===editEmpId):null;if(emp&&emp.perms&&(!emp.perms.doc||emp.perms.doc.discount===undefined))set('doc','discount',true);   /* unset = allowed (as before) */
  render();return out;};
 /* ready-made sets: owner-like and manager sets may give discounts, the others not */
 const ps=window.presetPerms;if(typeof ps==='function')window.presetPerms=function(kind){const p=ps.apply(this,arguments);if(p&&p.doc){p.doc.discount=(kind==='all'||kind==='mgr');if(kind==='mgr')TAX.forEach(([k])=>p.doc[k]=false);}return p;};
 const pp=window.permPreset;if(typeof pp==='function')window.permPreset=function(){const out=pp.apply(this,arguments);render();return out;};
 /* ---------- enforcement ---------- */
 /* staff saved before this key existed could give discounts: an unset key still allows, until the owner saves a choice */
 const mayDisc=()=>{const e=curEmp();if(!e)return true;const d=e.perms&&e.perms.doc;return !d||d.discount===undefined||!!d.discount;};
 const ap=window.applyPerms;window.applyPerms=function(){const out=ap.apply(this,arguments);
  ['qDisc','rDisc'].forEach(id=>{const el=document.getElementById(id);if(!el)return;const ok=mayDisc();el.disabled=!ok;el.title=ok?'':'บัญชีนี้ไม่มีสิทธิ์ให้ส่วนลด';});
  return out;};
 /* a discount typed another way (script, old draft) is refused at save unless the document already carried it */
 const guard=(name,get,list)=>{const f=window[name];if(typeof f!=='function')return;window[name]=async function(){const d=get();
  if(d&&!mayDisc()&&n(d.disc)>0){const was=(list()||[]).find(x=>x.id===d.id);if(!was||n(d.disc)>n(was.disc))return toast('บัญชีนี้ไม่มีสิทธิ์ให้ส่วนลด — ตั้งส่วนลดเป็น 0 ก่อนบันทึก');}
  return f.apply(this,arguments);};};
 guard('saveQuote',()=>typeof Q!=='undefined'&&Q,()=>DB.quotes);guard('saveReceipt',()=>typeof R!=='undefined'&&R,()=>DB.receipts);
 /* cost switch covers the category summary (07 + home) and the stock report button too (the original never gated them) */
 document.getElementById('catSumPanel')?.classList.add('sc-summary');
 document.getElementById('homeSumTag')?.closest('.panel')?.classList.add('sc-cost');
 document.querySelectorAll('[onclick="printStockRep()"]').forEach(b=>b.classList.add('sc-cost'));
 const sum=[...document.querySelectorAll('h2')].find(h=>/^สรุปจำนวนและมูลค่าสินค้าคงคลังตามหมวด/.test(h.textContent));sum?.closest('.panel')?.classList.add('sc-summary');
 window.PKG_PERM_SPECIAL={render,box,COST,FIN,SYS,ALWAYS,mayDisc};
})();
