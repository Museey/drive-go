/* Customer field quick buttons (03 quote, 4.2 billing, 4.3 tax invoice, 4.4 counter sale):
   ＋ add a new customer without leaving the document — the existing customer form (mCust) opens on top, prefilled with
     what was typed in the search box; once saved, the new customer is selected in the document that asked for it.
   ✕ clear a wrongly picked customer (the picker's own change handler runs, so vehicles / pulled receipts follow).
   Everything the staff already typed in the document stays as it is. */
(()=>{
 const TARGETS=[
  {inp:'qCustSearch',sel:'qCust',locked:()=>typeof Q!=='undefined'&&Q&&(Q.deducted||Q.cancelled)},
  {inp:'bnCustSearch',sel:'bnCust'},
  {inp:'ivCustSearch',sel:'ivCust'},
  {inp:'pkgRetailCustomerSearch',sel:'pkg-retail-customer',locked:()=>typeof R!=='undefined'&&R&&(R.deducted||R.cancelled)}
 ];
 const icon={add:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.6"/><path d="M2.8 20c.6-3.6 3.2-5.6 6.2-5.6s5.6 2 6.2 5.6"/><path d="M18.5 8v6M15.5 11h6"/></svg>',
  clear:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.6"/><path d="M2.8 20c.6-3.6 3.2-5.6 6.2-5.6s5.6 2 6.2 5.6"/><path d="M16 8.5l5 5M21 8.5l-5 5"/></svg>'};
 let pending=null;   /* the document field waiting for the customer being created */
 const locked=t=>{const inp=document.getElementById(t.inp),sel=document.getElementById(t.sel);return !inp||inp.disabled||sel.disabled||(t.locked&&t.locked());};
 /* Select a customer (or '' to clear) exactly like picking it from the list: value, change handler, label text. */
 function setCust(t,id){
  const inp=document.getElementById(t.inp),sel=document.getElementById(t.sel);if(!sel)return;
  if(sel.tagName==='SELECT'&&id&&![...sel.options].some(o=>o.value===id)){const o=document.createElement('option');o.value=id;o.textContent=custName(findCust(id));sel.append(o);}
  sel.value=id;sel.dispatchEvent(new Event('change'));
  inp.dispatchEvent(new Event('blur'));   /* the picker re-labels itself on blur */
  if(!id)inp.value='';
 }
 function paint(t){
  const box=t.box;if(!box)return;const off=locked(t),sel=document.getElementById(t.sel);
  box.querySelector('[data-c="add"]').disabled=off||!can('doc.custEdit');
  box.querySelector('[data-c="add"]').title=!can('doc.custEdit')?'บัญชีนี้ไม่มีสิทธิเพิ่มลูกค้า':'เพิ่มลูกค้าใหม่ (ไม่ต้องออกจากเอกสาร)';
  box.querySelector('[data-c="clear"]').disabled=off||!sel.value;
 }
 TARGETS.forEach(t=>{
  const inp=document.getElementById(t.inp),label=inp&&inp.closest('label'),title=label&&label.querySelector(':scope > span');if(!title)return;
  title.classList.add('pkg-cust-title');
  const box=document.createElement('span');box.className='pkg-cust-btns';
  box.innerHTML=`<button type="button" class="pkg-cust-btn add" data-c="add" aria-label="เพิ่มลูกค้าใหม่">${icon.add}</button><button type="button" class="pkg-cust-btn clear" data-c="clear" title="ล้างลูกค้าที่เลือก (เลือกผิด)" aria-label="ล้างลูกค้าที่เลือก">${icon.clear}</button>`;
  title.append(box);t.box=box;
  box.addEventListener('click',e=>{
   const c=e.target.closest('[data-c]')?.dataset.c;if(!c)return;e.preventDefault();e.stopPropagation();
   if(locked(t))return toast('เอกสารนี้ล็อกแล้ว — เปลี่ยนลูกค้าไม่ได้');
   if(c==='clear'){setCust(t,'');paint(t);toast('ล้างลูกค้าแล้ว — เลือกลูกค้าใหม่ได้เลย');inp.focus();return;}
   if(!can('doc.custEdit'))return toast('บัญชีนี้ไม่มีสิทธิเพิ่มลูกค้า');
   const typed=document.getElementById(t.sel).value?'':inp.value.trim();
   pending=t;openCust(null);document.getElementById('mCust').classList.add('pkg-over');
   if(typed){if(/^[\d\s+()-]{6,}$/.test(typed))document.getElementById('cTel').value=typed;else document.getElementById('cName').value=typed;}
   setTimeout(()=>document.getElementById(typed&&!/^[\d\s+()-]{6,}$/.test(typed)?'cTel':'cName')?.focus(),60);
  });
  const sel=document.getElementById(t.sel);
  sel.addEventListener('change',()=>paint(t));inp.addEventListener('blur',()=>setTimeout(()=>paint(t),200));
  new MutationObserver(()=>paint(t)).observe(inp,{attributes:true,attributeFilter:['disabled']});
  paint(t);
 });
 /* Saving the customer form: a newly created customer goes straight into the waiting document. */
 const saveO=saveCust;
 saveCust=function(){
  const before=new Set(DB.cust.map(c=>c.id)),t=pending;
  const r=saveO.apply(this,arguments);
  const added=DB.cust.find(c=>!before.has(c.id));
  if(t&&added){setCust(t,added.id);paint(t);toast('เพิ่มลูกค้า '+custName(added)+' และเลือกในเอกสารให้แล้ว');}
  return r;
 };
 const closeO=closeModal;
 closeModal=function(id){const r=closeO.apply(this,arguments);if(id==='mCust'){document.getElementById('mCust').classList.remove('pkg-over');setTimeout(()=>{pending=null;},0);}return r;};
 /* Documents opened / new documents: refresh the buttons' state. */
 ['fillQuoteForm','fillReceiptForm','newRetailReceipt','fillBillingForm','fillInvoiceForm'].forEach(name=>{
  const o=window[name];if(typeof o!=='function')return;
  window[name]=function(){const r=o.apply(this,arguments);TARGETS.forEach(paint);return r;};
 });
 window.PKG_CUST_QUICK={targets:TARGETS,setCust,paint};
})();

/* Star grade in the customer registers: a click no longer changes it at once (user 2026-10-09: a slip of the finger would
   raise or drop a customer's grade) — a question shows old → new first. The grade in the customer window is unchanged
   (it only counts when that window is saved). */
(()=>{
 if(typeof setStars!=='function'||typeof askP!=='function')return;
 const o=setStars,L=typeof STAR_LABEL==='object'?STAR_LABEL:{};
 const txt=v=>v?v+' ดาว · '+(L[v]||''):'ยังไม่มีเกรด';
 setStars=async function(id,v){const c=findCust(id);if(!c)return;const from=n(c.stars),to=from===v?0:v;
  if(!await askP({title:'เปลี่ยนเกรดลูกค้า',text:custName(c)+'\nจาก  '+'★'.repeat(from)+'☆'.repeat(5-from)+'  '+txt(from)+'\nเป็น  '+'★'.repeat(to)+'☆'.repeat(5-to)+'  '+txt(to),yes:'เปลี่ยนเกรด',no:'ไม่เปลี่ยน',tone:'warn'}))return;
  return o.call(this,id,v);};
 window.setStars=setStars;
})();

