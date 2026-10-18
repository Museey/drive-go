/* "ลำดับ" column on every register (like the reference ERP). Each row's number belongs to the record: it is its place
   in the register's normal order (after the filters), so re-sorting by another column keeps the numbers on their rows.
   Document registers count down (newest document on top carries the highest number, e.g. 932 of 932); master lists
   (stock, customers, vendors, staff, assets) count up. The ลำดับ header sorts like any other column.
   The column is inserted once in the header and the index-based configs (sort columns, mobile card columns) are
   shifted by one so they still point at the same data. */
(()=>{
 const DOCS={qOvTbl:'qOv',docOvTbl:'docOv',taxOvTbl:'taxOv',bnTbl:'bnOv',scutTbl:'scut',sinvTbl:'sinv',srcpTbl:'srcp',swhtTbl:'swht',swhtOutTbl:'swhtOut',mvTbl:'mv',ccTbl:'cc',grTbl:'gr',clTbl:'clm',isTbl:'isu',scTbl:'scn',
  aArTbl:'aAr',aApTbl:'aAp',expTbl:'exp',utilTbl:'',basTbl:'',offTbl:'',othTbl:'',wnTbl:'',crmTbl:'crm',recTbl:'rec'};
 const LISTS={stockTbl:'stk','kit-register':'kit',venTbl:'ven',custTbl:'',custLTbl:'custL',empTbl:'',assetTbl:''};
 const ALL={...DOCS,...LISTS},BY_PREFIX={},bound=[];   /* bound: tables whose sort headers were reset at load */
 Object.entries(ALL).forEach(([id,p])=>{if(p)BY_PREFIX[p]=id;});
 const S={};   /* per table: rank (record → place in normal order), total, sorted (after sortRows), shown (current page) */
 const st=id=>S[id]||(S[id]={});
 const numOf=(id,r)=>{const s=st(id),k=s.rank&&s.rank.get(r);return k==null?null:(id in DOCS?s.total-k:k+1);};
 /* sortRows receives the filtered rows in the register's normal order — that order defines the numbers. */
 const sortO=sortRows;
 sortRows=function(id,rows){
  if(!(id in ALL))return sortO.apply(this,arguments);
  const s=st(id);s.rank=new Map(rows.map((r,i)=>[r,i]));s.total=rows.length;s.shown=null;
  const out=sortO.apply(this,arguments);s.sorted=out;return out;
 };
 const limO=limitRows;
 limitRows=function(rows,prefix){
  const out=limO.apply(this,arguments),id=BY_PREFIX[prefix];
  if(id){const s=st(id),el=document.getElementById(prefix+'Limit'),lim=n(el&&el.value)||50,cur=n(LIM_PAGE[prefix])||1;
   s.shown=out;s.offset=(cur-1)*lim;s.pageTotal=rows.length;
   /* one page: the original draws no pager; keep a "‹ 1 ›" so the row stays put when a second page appears (user 2026-10-01) */
   const info=document.getElementById(prefix+'Info');
   if(info&&rows.length<=lim&&typeof limBar==='function'){const one='<span class="pgbar pkg-pg-one"><button type="button" disabled title="หน้าก่อนหน้า">‹</button><button type="button" class="on">1</button><button type="button" disabled title="หน้าถัดไป">›</button></span>';
    limBar(info.parentElement,'pgtop',one);const panel=info.closest('.panel');if(panel)limBar(panel,'pgbottom','<span class="hint">'+info.textContent+'</span>'+one,panel.querySelector(':scope > .scroll'));}}
  return out;
 };
 function head(tbl){
  const tr=tbl.tHead&&tbl.tHead.rows[0];if(!tr||tr.cells[0]?.classList.contains('pkg-seq'))return;
  const th=document.createElement('th');th.className='ctr pkg-seq';th.dataset.lbl='ลำดับ';
  th.innerHTML='ลำดับ'+(tickable(tbl.id)?'<input type="checkbox" class="pkg-seq-all" title="เลือกทุกรายการที่แสดงในหน้านี้" aria-label="เลือกทุกรายการที่แสดงในหน้านี้">':'');
  th.querySelector('input')?.addEventListener('click',e=>e.stopPropagation());   /* ticking must not sort the column */
  tr.prepend(th);
  [...tbl.tHead.rows].slice(1).forEach(r=>{const c=r.cells[0];if(c)c.colSpan+=1;});
 }
 function number(id){
  const tbl=document.getElementById(id);if(!tbl||!tbl.tBodies[0])return;
  head(tbl);
  const cols=tbl.tHead?tbl.tHead.rows[0].cells.length:0,data=[];
  [...tbl.tBodies[0].rows].forEach(tr=>{
   const c0=tr.cells[0];if(!c0||c0.classList.contains('pkg-seq')||tr.dataset.pkgSeq){if(c0?.classList.contains('pkg-seq'))data.push(tr);return;}
   if(tr.cells.length===1&&c0.colSpan>1){c0.colSpan=Math.min(cols,c0.colSpan+1);tr.dataset.pkgSeq='span';return;}
   const td=document.createElement('td');td.className='ctr pkg-seq';
   td.innerHTML=tickable(id)?'<label class="pkg-seq-cell"><input type="checkbox" class="pkg-seq-pick" aria-label="เลือกรายการนี้"><span></span></label>':'<label class="pkg-seq-cell no-tick"><span></span></label>';
   td.addEventListener('click',e=>e.stopPropagation());   /* rows that open a document on click stay closed */
   tr.prepend(td);data.push(tr);
  });
  [...(tbl.tFoot?tbl.tFoot.rows:[])].forEach(tr=>{if(tr.dataset.pkgSeq||!tr.cells[0])return;tr.cells[0].colSpan+=1;tr.dataset.pkgSeq='foot';});
  const s=st(id),recs=s.shown||s.sorted,k=data.length,down=id in DOCS;
  /* The record behind each row (one row per record) gives its own number; otherwise number by position. */
  const byRec=!!recs&&recs.length===k&&recs.every(r=>s.rank.has(r));
  const offset=s.shown&&s.offset+k<=s.pageTotal?s.offset:0,total=s.shown&&s.pageTotal>=k?s.pageTotal:k;
  const sel=picked(id),col=TIME[id]&&byRec?labels(tbl).findIndex(l=>/^วันที่/.test(l)):-1;
  data.forEach((tr,i)=>{
   const v=String(byRec?numOf(id,recs[i]):(down?total-offset-i:offset+i+1)),sp=tr.cells[0].querySelector('span');
   if(sp&&sp.textContent!==v){sp.textContent=v;sp.style.setProperty('--len',v.length);}   /* write only on change: the observer sees our own edits */
   const r=byRec?recs[i]:null,key=r?keyOf(r,v):'row:'+tr.cells[1]?.textContent.trim();
   tr.dataset.pkgKey=key;const cb=tr.cells[0].querySelector('input');if(cb)cb.checked=sel.has(key);
   const td=col>0?tr.cells[col]:null;if(td&&!td.querySelector('.pkg-time')){const t=timeLine(r);if(t)td.insertAdjacentHTML('beforeend','<div class="pkg-time">'+t+'</div>');}
  });
  paintSel(id);
 }
 /* The time a document was saved, under its date (user 2026-10-01, like the reference ERP) — 12 document registers.
    A backdated document shows "บันทึก dd/mm/yy" + time instead, so the time is never read as the document date's.
    A tax invoice has no time of its own: it shows its receipt's save time only when it was issued with that receipt. */
 const TIME={qOvTbl:1,docOvTbl:1,bnTbl:1,taxOvTbl:1,scutTbl:1,mvTbl:1,ccTbl:1,grTbl:1,clTbl:1,isTbl:1,scTbl:1,aArTbl:1,aApTbl:1,expTbl:1,assetTbl:1};
 const two=v=>String(v).padStart(2,'0');
 function timeLine(r){
  if(!r)return '';let at,date,strict=false;
  if(r.r&&r.d){const first=(r.r.taxDocs||[])[0];if(!first||first.no!==r.d.no)return '';at=r.r.createdAt;date=r.d.date;strict=true;}
  else{const d=r.obj||r.p||r;at=d.createdAt;date=r.date||d.date;}
  const t=at?new Date(at):null;if(!t||isNaN(t))return '';
  const day=t.getFullYear()+'-'+two(t.getMonth()+1)+'-'+two(t.getDate()),hm=two(t.getHours())+':'+two(t.getMinutes());
  if(day===date)return hm+':'+two(t.getSeconds());
  return strict?'':'บันทึก '+two(t.getDate())+'/'+two(t.getMonth()+1)+'/'+String(t.getFullYear()+543).slice(2)+'<br>'+hm;
 }
 /* a record's key: its id / number / code; customer-list rows are one per car → customer id | car index */
 const keyOf=(r,v)=>String(r.id||r.no||r.code||(r.c&&r.c.id?r.c.id+'|'+(r.vi??0):'')||v);
 /* ---------- Selection: row ticks + "select the whole page" in the header ----------
    A ticked row keeps a copy of its cells, so ticks made on page 1 and page 2 export together. */
 const SEL={},picked=id=>SEL[id]||(SEL[id]=new Map());
 const labels=tbl=>[...tbl.tHead.rows[0].cells].map(th=>(th.dataset.lbl||th.textContent).replace(/[▴▾]/g,'').replace(/\s+/g,' ').trim());
 /* a cell that names its own file value (data-xv, and data-xv2 for a second line) is exported by it; a table marked
    data-pkg-snap="lines" (the sale-flow registers: cells with second lines, a select, a tick box) is read the way the
    Excel / PDF export reads a cell — lines joined with " · ", buttons / inputs / selects left out. Others: as before. */
 const snap=(tbl,tr)=>{const L=labels(tbl),X=tbl.dataset.pkgSnap==='lines'&&window.PKG_REG_EXPORT&&PKG_REG_EXPORT.cellText;
  return [...tr.cells].map((td,i)=>i===0?td.querySelector('span')?.textContent||'':(!L[i]?null:td.dataset.xv!==undefined?[td.dataset.xv,td.dataset.xv2].filter(Boolean).join(' · '):X?X(td):td.textContent.replace(/\s+/g,' ').trim()));};
 const rowsOf=tbl=>[...tbl.tBodies[0].rows].filter(tr=>tr.dataset.pkgKey&&tr.cells[0]?.classList.contains('pkg-seq'));
 function bar(id){
  const tbl=document.getElementById(id),host=tbl.closest('.scroll')||tbl;let b=host.previousElementSibling;
  if(b&&b.classList.contains('pkg-sel-bar'))return b;
  b=document.createElement('div');b.className='pkg-sel-bar is-empty';b.inert=true;
  b.innerHTML='<div class="pkg-sel-clip"><div class="pkg-sel-in"><span>เลือกไว้ <b>0</b> รายการ</span><span class="pkg-sel-acts"></span><button type="button" class="btn sm gh" data-x="clear">ล้างการเลือก</button></div></div>';
  b.addEventListener('click',e=>{const x=e.target.closest('[data-x]')?.dataset.x;if(!x)return;
   if(x==='clear'){picked(id).clear();number(id);return;}
   const a=actsOf(id).find(a=>a.k===x);if(a)a.run(id,[...picked(id).keys()]);});
  host.before(b);return b;
 }
 /* What the ticked rows can do — each register its own buttons (user 2026-09-30: some registers must not export; quotes
    approve many at once). A register without its own list keeps "export the ticked rows" (needs the export right). */
 const ACTS={},EXPORT={k:'csv',label:'ส่งออกรายการที่เลือก (CSV)',cls:'gh',ok:()=>can('doc.export'),run:id=>exportSel(id)};
 const actsOf=id=>(ACTS[id]||[EXPORT]).filter(a=>!a.ok||a.ok());
 /* an empty list = this register has no tick boxes at all (user 2026-09-30: removed on 17 registers); the ลำดับ number stays */
 const tickable=id=>!(id in ACTS)||ACTS[id].length>0;
 function setActions(id,list){ACTS[id]=list;const t=document.getElementById(id);if(!t)return;
  if(!tickable(id)){picked(id).clear();t.querySelectorAll('.pkg-seq-all').forEach(x=>x.remove());
   t.querySelectorAll('td.pkg-seq .pkg-seq-cell').forEach(l=>{l.querySelector('input')?.remove();l.classList.add('no-tick');});}
  if(t.tBodies[0])paintSel(id);}
 function paintSel(id){
  const tbl=document.getElementById(id);
  if(!tickable(id)){const b=(tbl.closest('.scroll')||tbl).previousElementSibling;if(b&&b.classList.contains('pkg-sel-bar'))b.remove();return;}   /* register without ticks: no bar */
  const sel=picked(id),rows=rowsOf(tbl),on=rows.filter(tr=>sel.has(tr.dataset.pkgKey)).length;
  const all=tbl.querySelector('.pkg-seq-all');if(all){all.checked=!!rows.length&&on===rows.length;all.indeterminate=on>0&&on<rows.length;}
  /* nothing ticked: the bar folds away (no space); the first tick slides it down (user 2026-09-30) */
  const b=bar(id);b.classList.toggle('is-empty',!sel.size);b.inert=!sel.size;b.setAttribute('aria-hidden',sel.size?'false':'true');b.querySelector('b').textContent=sel.size;
  const acts=actsOf(id),box=b.querySelector('.pkg-sel-acts'),sig=acts.map(a=>a.k).join()||'-';
  if(box&&box.dataset.sig!==sig){box.dataset.sig=sig;
   box.innerHTML=acts.map(a=>`<button type="button" class="btn sm ${a.cls||'gh'}" data-x="${a.k}">${a.label}</button>`).join('')||'<span class="hint">บัญชีนี้ไม่มีสิทธิ์ใช้คำสั่งกับรายการที่เลือก</span>';}
 }
 function exportSel(id){
  const tbl=document.getElementById(id),sel=picked(id);if(!sel.size)return;if(!can('doc.export'))return toast('บัญชีนี้ไม่มีสิทธินำเข้า/ส่งออกข้อมูล');
  const hid=window.PKG_REG_LAYOUT?PKG_REG_LAYOUT.hidden(id):[],L=labels(tbl),keep=L.map((l,i)=>(i===0||!!l)&&!hid[i]),rows=[...sel.values()];   /* export what the shop shows */
  const panel=tbl.closest('.panel'),lifted=panel?.previousElementSibling?.classList.contains('pkg-page-head')?panel.previousElementSibling:null;   /* title above the frame (reg-layout) */
  const title=((lifted||panel)?.querySelector('h2')?.textContent||id).trim();
  csvDownload(title.replace(/[\\/:*?"<>|]/g,' ').slice(0,60)+' '+iso(new Date())+'.csv',[L.filter((_,i)=>keep[i]),...rows.map(r=>r.filter((_,i)=>keep[i]))]);
 }
 function tick(id,tr,on){const sel=picked(id),k=tr.dataset.pkgKey;if(on)sel.set(k,snap(document.getElementById(id),tr));else sel.delete(k);tr.cells[0].querySelector('input').checked=on;}
 /* Shift the column-number configs once and make ลำดับ (column 0) sortable. */
 Object.keys(ALL).forEach(id=>{
  const tbl=document.getElementById(id);
  /* Headers already bound (data loaded before this module): drop those click handlers by cloning the header cells,
     so the table's next redraw binds them again with the new column numbers. */
  if(tbl&&tbl.dataset.sortBound&&tbl.tHead){[...tbl.tHead.rows[0].cells].forEach(th=>{const c=th.cloneNode(true);c.classList.remove('sortable','sorted');c.querySelector('.sarr')?.remove();th.replaceWith(c);});delete tbl.dataset.sortBound;sortState[id]=null;bound.push(id);}
  const def=SORT_DEF[id];
  if(def&&def.cols&&!def.pkgSeq){const c={};/* ลำดับ is not sortable (user 2026-10-04: no use, saves width) */Object.keys(def.cols).forEach(k=>c[+k+1]=def.cols[k]);def.cols=c;def.pkgSeq=1;}
  const mc=MC_CFG[id];if(mc&&!mc.pkgSeq){mc.pri=mc.pri.map(x=>x+1);if(mc.act!=null)mc.act+=1;mc.pkgSeq=1;}
  if(tbl)head(tbl);
 });
 /* Any later (re)bind sees the ลำดับ column first. Tables reset above get their handlers back on the next redraw. */
 const bindO=bindSort;bindSort=function(id){if(id in ALL){const t=document.getElementById(id);if(t)head(t);}return bindO.apply(this,arguments);};
 /* Cards are built from column numbers, so number the rows first (synchronously). */
 /* Re-bind reset headers now (the system binds sort headers once at start-up, parts-kits once at load). */
 const RENDER={qOvTbl:'renderQuoteOverview',docOvTbl:'renderDocOverview',bnTbl:'renderBillingList',taxOvTbl:'renderTaxOverview',scutTbl:'pkgRenderCuts',sinvTbl:'pkgRenderInv',srcpTbl:'pkgRenderRcp',swhtTbl:'pkgRenderWht',swhtOutTbl:'pkgRenderWhtOut',mvTbl:'pkgRenderMoves',ccTbl:'pkgRenderCClaims',
  grTbl:'renderGRList',clTbl:'renderClaimList',isTbl:'renderIssueList',scTbl:'renderCountList',stockTbl:'renderStock',
  custLTbl:'renderCustList',custTbl:'renderCust',venTbl:'renderVen',empTbl:'renderEmp',expTbl:'renderExp',assetTbl:'renderAssets',
  aArTbl:'renderAcctAR',aApTbl:'renderAcctAP',crmTbl:'renderCrm',recTbl:'renderHrRec',wnTbl:'renderWarnList'};
 bound.forEach(id=>{
  const name=RENDER[id],fn=id==='kit-register'?(LIM_RENDER.kit&&(()=>LIM_RENDER.kit())):(typeof window[name]==='function'&&(()=>window[name]()));
  if(fn)bindSort(id,fn);
 });
 const mkO=mkCards;mkCards=function(id){if(id in ALL)number(id);return mkO.apply(this,arguments);};
 /* Every other redraw: watch the table and number new rows. */
 Object.keys(ALL).forEach(id=>{
  const tbl=document.getElementById(id);if(!tbl)return;
  new MutationObserver(()=>number(id)).observe(tbl,{childList:true,subtree:true});
  tbl.addEventListener('change',e=>{
   if(e.target.classList.contains('pkg-seq-pick'))tick(id,e.target.closest('tr'),e.target.checked);
   else if(e.target.classList.contains('pkg-seq-all'))rowsOf(tbl).forEach(tr=>tick(id,tr,e.target.checked));   /* whole page as shown */
   else return;
   paintSel(id);
  });
  number(id);
 });
 window.PKG_ROW_NUMBER={number,state:S,rebound:bound,selected:picked,exportSel,setActions,actions:actsOf,tickable,keyOf,timeLine};
})();
