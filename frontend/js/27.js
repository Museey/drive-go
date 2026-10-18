/* "ทะเบียนปัญหา" (problem register) for the 03 quote.
   · In the quote, the customer-reported problems (.qprob) and the findings (.qfind) stay free-text fields; on focus /
     typing they also offer the saved list to pick from. Nothing can be configured from inside the quote.
   · The list is kept on menu 11.2 — opened with the permission row "11.2 · ทะเบียนปัญหา" (view), changed with its
     "แก้ไข" (edit); the owner always can. Existing staff start without it.
   Stored in DB.qPresets = {probs:[text], finds:[text]}. */
(()=>{
 const KINDS={probs:{label:'ปัญหาที่ลูกค้าแจ้ง'},finds:{label:'รายการที่ตรวจพบ'}};
 const SEED={
  probs:['เบรกมีเสียงดัง','เบรกไม่ค่อยอยู่ / เหยียบลึก','แอร์ไม่เย็น','เครื่องยนต์สั่น','สตาร์ทติดยาก','ไฟเตือนเครื่องยนต์โชว์','พวงมาลัยสั่น','ช่วงล่างมีเสียงดัง','ความร้อนขึ้นสูง','น้ำมันรั่วซึม','ครบระยะเปลี่ยนถ่ายน้ำมันเครื่อง','เกียร์กระตุก / เข้ายาก'],
  finds:['ผ้าเบรกหน้าสึกหมด','ผ้าเบรกหลังสึกหมด','จานเบรกเป็นรอย / คด','น้ำยาแอร์ขาด','คอมเพรสเซอร์แอร์ชำรุด','ลูกหมากปีกนกหลวม','โช้คอัพรั่วซึม','ยางแท่นเครื่องชำรุด','หัวเทียนเสื่อม','แบตเตอรี่เสื่อม','สายพานหน้าเครื่องแตกร้าว','หม้อน้ำรั่ว','น้ำมันเครื่องถึงระยะเปลี่ยน','ยางรถสึกเกินกำหนด']
 };
 const list=k=>{if(!DB.qPresets)DB.qPresets={probs:SEED.probs.slice(),finds:SEED.finds.slice()};return DB.qPresets[k]||(DB.qPresets[k]=[]);};
 const mayEdit=()=>can('m.qPreset_edit'),mayView=()=>mayEdit()||can('m.qPreset_view');
 const kindOf=el=>el&&el.matches&&(el.matches('.qprob')?'probs':el.matches('.qfind')?'finds':null);

 /* ---------- In the quote: suggestion box under the field (pick only; typing stays free) ---------- */
 const box=document.createElement('div');box.className='pkg-qp-sug';box.hidden=true;box.setAttribute('role','listbox');document.body.append(box);
 let cur=null,hi=-1,rows=[];
 function close(){box.hidden=true;cur=null;rows=[];hi=-1;}
 function place(){if(!cur)return;if(!cur.isConnected||cur.closest('.modal:not(.on)'))return close();const r=cur.getBoundingClientRect(),below=innerHeight-r.bottom;box.style.left=r.left+'px';box.style.width=Math.max(r.width,280)+'px';
  if(below<240&&r.top>below){box.style.top='';box.style.bottom=(innerHeight-r.top+4)+'px';}else{box.style.bottom='';box.style.top=(r.bottom+4)+'px';}}
 function open(el){
  const k=kindOf(el);if(!k||el.disabled||el.readOnly)return close();
  cur=el;const q=el.value.trim().toLowerCase();
  rows=list(k).filter(t=>!q||t.toLowerCase().includes(q)).slice(0,40);
  const none=q?'ไม่มีในทะเบียน — พิมพ์ต่อได้เลย'+(mayEdit()?' (เพิ่มเข้าทะเบียนได้ที่เมนู 11.2)':''):'ยังไม่มีรายการในทะเบียน';
  box.innerHTML=`<div class="pkg-qp-head">ทะเบียนปัญหา · ${KINDS[k].label}<span>เลือกจากรายการ หรือพิมพ์เองได้</span></div>`+
   (rows.length?rows.map((t,i)=>`<div class="pkg-qp-it" data-i="${i}" role="option">${esc(t)}</div>`).join(''):`<div class="pkg-qp-none">${none}</div>`);
  hi=-1;box.hidden=false;place();
 }
 function mark(i){hi=i;[...box.querySelectorAll('.pkg-qp-it')].forEach(el=>el.classList.toggle('hi',+el.dataset.i===i));box.querySelector('.pkg-qp-it.hi')?.scrollIntoView({block:'nearest'});}
 function pick(i){
  const t=rows[i],el=cur;if(t==null||!el)return;
  el.value=t;el.dispatchEvent(new Event('input',{bubbles:true}));   /* the field's own handler stores it on the quote */
  close();el.focus();
 }
 box.addEventListener('mousedown',e=>{const it=e.target.closest('.pkg-qp-it');if(!it)return;e.preventDefault();pick(+it.dataset.i);});
 document.addEventListener('focusin',e=>{if(kindOf(e.target))open(e.target);else if(!box.contains(e.target))close();});
 document.addEventListener('input',e=>{if(kindOf(e.target)&&e.isTrusted!==false)open(e.target);});
 document.addEventListener('focusout',e=>{if(e.target===cur)setTimeout(()=>{if(document.activeElement!==cur)close();},120);});
 document.addEventListener('keydown',e=>{
  if(box.hidden||e.target!==cur)return;const n=rows.length;
  if(e.key==='ArrowDown'&&n){e.preventDefault();mark((hi+1)%n);}
  else if(e.key==='ArrowUp'&&n){e.preventDefault();mark((hi-1+n)%n);}
  else if(e.key==='Enter'&&hi>=0){e.preventDefault();pick(hi);}
  else if(e.key==='Escape'){e.stopPropagation();close();}
 },true);
 document.addEventListener('scroll',e=>{if(!box.hidden&&!box.contains(e.target))place();},true);
 window.addEventListener('resize',()=>place());
 /* the quote window closing (button, Esc, new document) takes the box with it */
 const closeM=closeModal;closeModal=function(id){if(id==='mQuoteEdit')close();return closeM.apply(this,arguments);};
 ['newQuote','fillQuoteForm','go'].forEach(n=>{const o=window[n];if(typeof o==='function')window[n]=function(){close();return o.apply(this,arguments);};});
 /* a one-line hint above the two quote sections (no settings in the quote) */
 const secs=[...document.querySelectorAll('#mQuoteEdit .body > .msec')];
 [secs[1],secs[2]].forEach(sec=>{const body=sec&&sec.querySelector('.msec-b');if(!body)return;
  const bar=document.createElement('div');bar.className='pkg-qp-bar';bar.innerHTML='<span class="hint">คลิกช่องเพื่อเลือกจากทะเบียนปัญหา หรือพิมพ์เองได้</span>';body.prepend(bar);});

 /* ---------- Menu 11.2 · the register itself ---------- */
 const el=document.createElement('div');
 el.innerHTML=`<div class="panel pkg-qp-page"><header><h2>11.2 · ทะเบียนปัญหา (ใช้ในใบเสนอราคา)</h2></header><div class="body">
  <p class="hint pkg-qp-note">รายการที่ตั้งไว้จะเด้งให้เลือกในใบเสนอราคา ช่อง “ปัญหาที่ลูกค้าแจ้ง” และ “รายการที่ตรวจพบ” · ช่องในใบเสนอราคายังพิมพ์เองได้เสมอ</p>
  <div class="seg pkg-qp-tabs"><button type="button" data-t="probs">ปัญหาที่ลูกค้าแจ้ง <b></b></button><button type="button" data-t="finds">รายการที่ตรวจพบ <b></b></button></div>
  <p class="pkg-qp-ro" id="pkgQpRo" hidden>ดูได้อย่างเดียว — การเพิ่ม / แก้ไขต้องได้รับสิทธิ์ “แก้ไข” ในแถว 11.2 ของตารางสิทธิ์</p>
  <div class="pkg-qp-add" id="pkgQpAddRow"><input type="text" id="pkgQpNew" placeholder="พิมพ์รายการใหม่ แล้วกด Enter หรือปุ่มเพิ่ม"><button type="button" class="btn pri" data-q="add">+ เพิ่ม</button></div>
  <div class="pkg-qp-find"><input type="search" id="pkgQpFind" placeholder="ค้นหาในทะเบียน"></div>
  <div class="pkg-qp-list" id="pkgQpList"></div>
  <div class="pkg-qp-foot"><span class="hint" id="pkgQpCount"></span><span class="pkg-qp-dirty" id="pkgQpDirty" hidden>มีการแก้ไขที่ยังไม่บันทึก</span>
   <button type="button" class="btn gh" data-q="revert">ยกเลิกการแก้ไข</button><button type="button" class="btn pri" data-q="save">บันทึก</button></div>
 </div></div>`;
 let tab='probs',draft=null,dirty=false;
 const $q=id=>document.getElementById(id);
 const snapshot=()=>({probs:list('probs').slice(),finds:list('finds').slice()});
 function showPage(){if(!draft||!dirty){draft=snapshot();dirty=false;}drawEd();}   /* unsaved edits survive leaving the page */
 function setDirty(v){dirty=v;$q('pkgQpDirty').hidden=!v;}
 function drawEd(){
  const ro=!mayEdit(),L=draft[tab],q=($q('pkgQpFind').value||'').trim().toLowerCase(),filt=!!q;
  el.querySelectorAll('[data-t]').forEach(b=>{b.classList.toggle('on',b.dataset.t===tab);b.querySelector('b').textContent='('+draft[b.dataset.t].length+')';});
  $q('pkgQpRo').hidden=!ro;$q('pkgQpAddRow').hidden=ro;el.querySelectorAll('[data-q="save"],[data-q="revert"]').forEach(b=>b.hidden=ro);
  $q('pkgQpList').innerHTML=L.length?L.map((t,i)=>`<div class="pkg-qp-row"${filt&&!t.toLowerCase().includes(q)?' hidden':''}><span class="n">${i+1}</span><input type="text" data-e="${i}" value="${esc(t)}" ${ro?'disabled':''}>
   ${ro?'':`<button type="button" class="btn sm gh" data-up="${i}" ${i&&!filt?'':'disabled'} title="เลื่อนขึ้น">▲</button><button type="button" class="btn sm gh" data-dn="${i}" ${i<L.length-1&&!filt?'':'disabled'} title="เลื่อนลง">▼</button>
   <button type="button" class="btn sm dgr" data-del="${i}" title="ลบรายการนี้">×</button>`}</div>`).join(''):'<p class="hint">ยังไม่มีรายการ — พิมพ์ด้านบนแล้วกดเพิ่ม</p>';
  $q('pkgQpCount').textContent=KINDS[tab].label+' · '+L.length+' รายการ'+(filt?' · กำลังค้นหา (เลื่อนลำดับได้เมื่อล้างคำค้น)':'');
  setDirty(dirty);
 }
 function addNew(){if(!mayEdit())return;const inp=$q('pkgQpNew'),t=inp.value.trim();if(!t)return;
  if(draft[tab].some(x=>x.toLowerCase()===t.toLowerCase()))return toast('มีรายการนี้อยู่แล้ว');draft[tab].push(t);inp.value='';setDirty(true);drawEd();inp.focus();}
 el.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.t){tab=d.t;drawEd();return;}
  if(d.q==='add')return addNew();
  if(d.q==='revert'){draft=snapshot();setDirty(false);drawEd();return;}
  const L=draft[tab];
  if(d.up!=null){const i=+d.up;[L[i-1],L[i]]=[L[i],L[i-1]];setDirty(true);drawEd();}
  if(d.dn!=null){const i=+d.dn;[L[i+1],L[i]]=[L[i],L[i+1]];setDirty(true);drawEd();}
  if(d.del!=null){L.splice(+d.del,1);setDirty(true);drawEd();}
  if(d.q==='save'){
   if(!mayEdit())return toast('บัญชีนี้ไม่มีสิทธิ์แก้ไขทะเบียนปัญหา');
   const clean=a=>[...new Map(a.map(x=>String(x).trim()).filter(Boolean).map(x=>[x.toLowerCase(),x])).values()];   /* trim, drop blanks and repeats */
   DB.qPresets={probs:clean(draft.probs),finds:clean(draft.finds)};save();
   draft=snapshot();setDirty(false);drawEd();toast('บันทึกทะเบียนปัญหาแล้ว');
  }
 });
 el.addEventListener('input',e=>{
  if(e.target.dataset.e!=null){draft[tab][+e.target.dataset.e]=e.target.value;setDirty(true);}
  if(e.target.id==='pkgQpFind')drawEd();
 });
 el.addEventListener('keydown',e=>{if(e.target.id==='pkgQpNew'&&e.key==='Enter'){e.preventDefault();addNew();}});
 if(window.PKG_UISET)PKG_UISET.addSub({key:'probs',label:'11.2 ทะเบียนปัญหา',allowed:mayView,el,show:showPage});
 window.PKG_QUOTE_PRESETS={list,open,pick:i=>pick(i),rows:()=>rows,show:showPage,isDirty:()=>dirty};
})();
