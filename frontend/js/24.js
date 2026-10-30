/* What ticked rows can do, per register (user 2026-09-30, decided register by register):
   · approve many at once — 03 quotes, 4.1 receipts / invoices, 4.2 billing, 07 claims / issues / counts: the same record the
     approve button in each document window writes (approved by / date, audit line, and for claims / issues / counts the same
     stock posting). Cancelled, unsaved, already approved, sent-back (ตีกลับ), not-own and no-right documents are left out and
     stay ticked so they can be opened one by one.
   · 02 customer list → "รวมข้อมูลลูกค้า": merge customers created twice into one (cars, documents, blank details).
   · no tick boxes at all on 17 registers (the ลำดับ number stays). 07 stock keeps "export" until its own button is decided.
   Registers not listed keep "export the ticked rows". */
(()=>{
 const RN=window.PKG_ROW_NUMBER;if(!RN||!RN.setActions)return;   /* not "R": that is the open receipt */
 const has=f=>typeof window[f]==='function',call=f=>{if(has(f))window[f]();};
 const cur=v=>{try{return (0,eval)(v);}catch(e){return null;}};   /* the open document of a window (Q, R, IV, BN, C, IS, SC) — read in global scope */
 /* ---------- approve many at once ---------- */
 const K={
  quote:{list:()=>DB.quotes,row:()=>'quote',ok:()=>can('apv.quote'),open:'Q',total:d=>n(quoteTotals(d).total),after:()=>{call('renderQuoteOverview');refreshQuoteRefs();}},
  receipt:{list:()=>DB.receipts,row:d=>has('rcptRow')?rcptRow(d):'rcptDoc',ok:d=>can('apv.'+apvKeyOf('receipt',d))&&(!d||!d.issueTax||can('apv.tax')),open:'R',label:'ใบเสร็จ',after:()=>call('renderDocOverview')},
  invoice:{list:()=>DB.invoices,row:()=>'rcptDoc',ok:()=>can('apv.invoice'),open:'IV',label:'ใบแจ้งหนี้',after:()=>call('renderDocOverview')},
  billing:{list:()=>DB.billings,row:()=>'rcptBilling',ok:()=>can('apv.billing'),open:'BN',after:()=>call('renderBillingList')},
  claim:{list:()=>DB.claims,row:()=>'stkClaim',ok:()=>can('apv.claim'),open:'C',items:d=>d.deduct!==false&&!d.deducted?clItemsClean(d):[],
   post:d=>{if(!d.deducted&&d.deduct!==false&&clItemsClean(d).length){postClaim(d);logAudit('claim',d,'deduct2','ตัดสต๊อกส่งเคลม '+clItemsClean(d).length+' รายการ');}},
   after:()=>{call('renderClaimList');call('renderStock');}},
  issue:{list:()=>DB.issues,row:()=>'stkIssue',ok:()=>can('apv.issue'),open:'IS',items:d=>!d.deducted?isItemsClean(d):[],
   post:d=>{if(!d.deducted&&isItemsClean(d).length){postIssue(d);logAudit('issue',d,'deduct3','ตัดสต๊อกเบิกใช้ภายใน '+isItemsClean(d).length+' รายการ');}},
   after:()=>{call('renderIssueList');call('renderStock');}},
  count:{list:()=>DB.stockCounts,row:()=>'stkCount',ok:()=>can('apv.count'),open:'SC',
   hold:d=>window.PKG_STOCK_FIFO&&PKG_STOCK_FIFO.surplusOf(d).length?'มีของเกินที่ต้องยืนยันทุน (อนุมัติทีละใบ)':'',   /* accountant review 4.2 (59-stock-fifo.js) */
   post:d=>{if(!d.applied&&(d.items||[]).length){postCount(d);logAudit('count',d,'adjust','ปรับยอด '+(d.items||[]).filter(it=>n(it.countedQty)!==n(it.sysQty)).length+' รายการ');}},
   after:()=>{call('renderCountList');call('renderStock');}}};
 const REG={qOvTbl:['quote'],docOvTbl:['receipt','invoice'],bnTbl:['billing'],clTbl:['claim'],isTbl:['issue'],scTbl:['count']};
 const find=(id,key)=>{for(const kind of REG[id]){const d=K[kind].list().find(x=>x.id===key);if(d)return{kind,d};}return null;};
 async function approve(id,keys){
  const kinds=REG[id];if(!kinds.some(k=>K[k].ok()))return toast('บัญชีนี้ไม่ได้รับสิทธิอนุมัติเอกสารประเภทนี้');
  const ok=[],skip={},miss=k=>{skip[k]=(skip[k]||0)+1;};
  keys.forEach(key=>{const f=find(id,key);if(!f)return miss('ไม่พบในระบบ');const{kind,d}=f,k=K[kind],st=apvOf(d).status;
   if(d.cancelled)return miss('ยกเลิกแล้ว');if(!d.no)return miss('ยังไม่บันทึก');
   if(window.PKG_BRANCH&&!PKG_BRANCH.here(d))return miss('เป็นเอกสารของสาขาอื่น — สลับสาขาก่อน');
   if(has('pkgOwnOk')&&!pkgOwnOk(k.row(d),d))return miss('ไม่ใช่เอกสารของตนเอง');   /* same limit as opening it */
   if(!k.ok(d))return miss('ไม่มีสิทธิ์อนุมัติ');
   if(k.hold&&k.hold(d))return miss(k.hold(d));
   if(st==='approved')return miss('อนุมัติแล้ว');if(st==='rejected')return miss('ตีกลับ');ok.push({key,kind,d});});
  const skipped=Object.values(skip).reduce((a,b)=>a+b,0),why=Object.entries(skip).map(([k,v])=>k+' '+v).join(' · ');
  if(!ok.length)return toast('ไม่มีใบที่อนุมัติได้ในรายการที่เลือก'+(skipped?' — '+why:''));
  /* stock the claims / issues will take, all together: warn like the window does, then allow going negative */
  const need=new Map();ok.forEach(({kind,d})=>(K[kind].items?K[kind].items(d):[]).forEach(it=>{const st=stockOfLine(it);if(st)need.set(st,(need.get(st)||0)+n(it.qty));}));
  const short=[...need].filter(([st,q])=>q>n(st.qty));
  const nos=ok.slice(0,6).map(x=>esc(x.d.no)).join(', ')+(ok.length>6?' และอีก '+(ok.length-6)+' ใบ':'');
  const by={};ok.forEach(x=>{const l=K[x.kind].label;if(l)by[l]=(by[l]||0)+1;});
  const parts=Object.keys(by).length>1?' ('+Object.entries(by).map(([l,c])=>l+' '+c).join(' · ')+')':'';
  const total=ok.every(x=>K[x.kind].total)?' · รวม '+money(ok.reduce((s,x)=>s+K[x.kind].total(x.d),0))+' บาท':'';
  const stockNote={claim:'ตัดสต๊อกส่งเคลมตามรายการในใบ',issue:'ตัดสต๊อกเบิกใช้ตามรายการในใบ',count:'ปรับยอดสต๊อกตามผลนับ'}[kinds[0]];
  if(!await askP({title:'อนุมัติเอกสารที่เลือก',
   msg:`<div class="pkg-imp-l"><b>อนุมัติ ${ok.length} ใบ${parts}${total}</b><div class="hint">${nos}</div></div>`
    +(stockNote?`<div class="pkg-imp-l"><b>${stockNote}</b><div class="hint">เหมือนกดอนุมัติทีละใบ</div></div>`:'')
    +(short.length?`<div class="pkg-imp-l warn"><b>สต๊อกไม่พอ ${short.length} รายการ — อนุมัติต่อสต๊อกจะติดลบ</b><div class="hint">${short.slice(0,5).map(([st,q])=>esc(st.name||st.code)+' ขอ '+q+' มีจริง '+n(st.qty)).join('<br>')}${short.length>5?'<br>… และอีก '+(short.length-5)+' รายการ':''}</div></div>`:'')
    +(skipped?`<div class="pkg-imp-l skip"><b>ไม่อนุมัติ ${skipped} ใบ</b><div class="hint">${esc(why)}${skip['ตีกลับ']?' — ใบที่ตีกลับให้เปิดดูทีละใบ':''}</div></div>`:'')
    +`<div class="pkg-imp-q">อนุมัติโดย ${esc(meName())} · ยืนยันหรือไม่?</div>`,
   yes:'อนุมัติ '+ok.length+' ใบ',no:'ยกเลิก'}))return;
  const sel=RN.selected(id),stamp={status:'approved',by:DB.curEmp||'',byName:meName(),date:iso(),note:''};let done=0;
  ok.forEach(({key,kind,d})=>{if(!K[kind].ok(d))return;const k=K[kind];
   d.apv=Object.assign({},stamp);logAudit(kind,d,'approve','อนุมัติโดย '+meName()+' · อนุมัติพร้อมกัน '+ok.length+' ใบจากทะเบียน');
   if(k.post)k.post(d);
   const w=cur(k.open);if(w&&w.id===d.id){w.apv=Object.assign({},stamp);if('deducted' in d)w.deducted=d.deducted;if('applied' in d)w.applied=d.applied;}   /* the open window must not write the old status back */
   sel.delete(key);done++;});
  save();[...new Set(kinds)].forEach(k=>K[k].after());call('renderApvBars');call('renderApvAlert');
  RN.number(id);
  saveFx('อนุมัติเอกสารแล้ว',done+' ใบ');
  toast('อนุมัติแล้ว '+done+' ใบ'+(skipped?' · ไม่อนุมัติ '+skipped+' ใบ ('+why+') — ยังติ๊กค้างไว้':''));
 }
 Object.entries(REG).forEach(([id,kinds])=>RN.setActions(id,[{k:'apv',label:'อนุมัติใบที่เลือก',cls:'grn',ok:()=>kinds.some(k=>K[k].ok()),run:approve}]));
 /* ---------- 02 customer list: merge a customer created twice ---------- */
 const dig=s=>String(s||'').replace(/\D/g,'');
 const docsOf=c=>['quotes','receipts','invoices','billings','crm'].reduce((s,k)=>s+(DB[k]||[]).filter(d=>d.custId===c.id).length,0);
 async function mergeCustomers(id,keys){
  if(!can('doc.custEdit'))return toast('บัญชีนี้ไม่มีสิทธิเพิ่ม/แก้ไขข้อมูลลูกค้า');
  const ids=[...new Set(keys.map(k=>String(k).split('|')[0]))],cs=ids.map(x=>DB.cust.find(c=>c.id===x)).filter(Boolean);
  if(cs.length<2)return toast('ติ๊กลูกค้าที่ซ้ำกันอย่างน้อย 2 ราย แล้วกดรวมข้อมูลลูกค้า');
  if(cs.length>10)return toast('รวมได้ครั้งละไม่เกิน 10 ราย — ติ๊กเฉพาะรายที่ซ้ำกัน');
  const pick=cs.slice().sort((a,b)=>docsOf(b)-docsOf(a)||(b.vehicles||[]).length-(a.vehicles||[]).length||String(a.createdAt||'').localeCompare(String(b.createdAt||'')))[0];
  const opt=c=>`<label class="pkg-merge-opt"><input type="radio" name="pkgKeep" value="${esc(c.id)}"${c===pick?' checked':''}><span><b>${esc(custName(c))}</b>${c.type==='company'&&c.name?' · '+esc(c.name):''}<div class="hint">${esc([c.tel,c.tax?'เลขภาษี '+c.tax:''].filter(Boolean).join(' · ')||'ไม่มีเบอร์ / เลขภาษี')} · รถ ${(c.vehicles||[]).length} คัน · เอกสาร ${docsOf(c)} ใบ</div></span></label>`;
  if(!await askP({title:'รวมข้อมูลลูกค้า',
   msg:`<div class="pkg-imp-l"><b>รวม ${cs.length} ราย ให้เหลือรายเดียว</b><div class="hint">เลือกรายที่จะเก็บไว้ — รายอื่นจะย้ายรถและเอกสารทั้งหมดมาไว้ที่รายนี้ แล้วถูกลบออก</div></div>`
    +cs.map(opt).join('')
    +`<div class="pkg-imp-l"><b>สิ่งที่จะเกิดขึ้น</b><div class="hint">รถที่ทะเบียนซ้ำกันรวมเป็นคันเดียว · ใบเสนอราคา ใบเสร็จ ใบแจ้งหนี้ ใบวางบิล และนัดหมาย ย้ายมาอยู่รายที่เก็บไว้ · ช่องที่ว่างในรายที่เก็บไว้เติมจากรายอื่น (ของเดิมไม่ถูกทับ)</div></div>`
    +'<div class="pkg-imp-q">ย้อนกลับไม่ได้ — ถ้าไม่แน่ใจให้ส่งออกไฟล์สำรองก่อน (เมนู 11.3) · ยืนยันรวมหรือไม่?</div>',
   yes:'รวมข้อมูลลูกค้า',no:'ยกเลิก'}))return;
  if(!can('doc.custEdit'))return;
  const keepId=document.querySelector('#askMsg input[name="pkgKeep"]:checked')?.value||pick.id,main=cs.find(c=>c.id===keepId)||pick,others=cs.filter(c=>c!==main);
  const same=window.PKG_CUST_IMPORT?PKG_CUST_IMPORT.sameCar:(a,b)=>false,fill=(a,b,ks)=>ks.forEach(k=>{if(!a[k]&&b[k])a[k]=b[k];});
  const CAR=['brand','model','color','plateL','plateN','plateProv','mile','engine','vin','year'];
  const wins=['Q','R','IV','BN'].map(cur).filter(Boolean);
  let moved=0,joined=0,docs=0;
  main.vehicles=main.vehicles||[];main.addr=main.addr||{};
  others.forEach(o=>{
   const map={};
   (o.vehicles||[]).forEach((v,j)=>{const hit=main.vehicles.findIndex(x=>same(x,v));
    if(hit>=0){fill(main.vehicles[hit],v,CAR);map[j]=hit;joined++;}else{main.vehicles.push(JSON.parse(JSON.stringify(v)));map[j]=main.vehicles.length-1;moved++;}});
   if(main.tel&&o.tel&&dig(main.tel)!==dig(o.tel)&&!main.tel2)main.tel2=o.tel;   /* keep the other phone number too */
   fill(main,o,['company','tax','branch','tel','tel2']);if(!n(main.stars)&&n(o.stars))main.stars=o.stars;
   const oa=o.addr||{};['no','village','moo','soi','road','sub','dist','prov','zip'].forEach(k=>{if(!main.addr[k]&&oa[k])main.addr[k]=oa[k];});
   /* documents follow the customer; a car index moves to where that car now sits (a dangling one → no car) */
   const re=d=>{if(d.custId!==o.id)return false;d.custId=main.id;if(d.vehIdx!=null&&d.vehIdx>=0)d.vehIdx=(d.vehIdx in map)?map[d.vehIdx]:-1;return true;};
   ['quotes','receipts','crm','invoices','billings'].forEach(k=>(DB[k]||[]).forEach(d=>{if(re(d))docs++;}));
   wins.forEach(re);
  });
  DB.cust=DB.cust.filter(c=>!others.includes(c));stampRec(main,main);
  logAudit('cust',{id:main.id,no:main.name},'save','รวมข้อมูลลูกค้า '+cs.length+' ราย → '+custName(main)+' · ย้ายรถ '+moved+' คัน'+(joined?' (ทะเบียนซ้ำรวม '+joined+' คัน)':'')+' · ย้ายเอกสาร '+docs+' ใบ · รายที่รวมเข้ามา: '+others.map(o=>custName(o)+(o.tel?' '+o.tel:'')).join(', '));
  save();RN.selected(id).clear();
  ['renderCust','renderCustList','renderQuoteOverview','renderDocOverview','renderBillingList','renderCrm'].forEach(call);refreshQuoteRefs();call('refreshReceiptRefs');
  RN.number(id);
  saveFx('รวมข้อมูลลูกค้าแล้ว',custName(main));
  toast('รวมข้อมูลลูกค้าแล้ว — '+custName(main)+' · รถ '+main.vehicles.length+' คัน · ย้ายเอกสาร '+docs+' ใบ');
 }
 RN.setActions('custLTbl',[{k:'merge',label:'รวมข้อมูลลูกค้า',cls:'pri',ok:()=>can('doc.custEdit'),run:mergeCustomers}]);
 /* ---------- registers without tick boxes (user 2026-09-30) ----------
    2026-10-12 (owner: "4.1 4.2 4.3 4.4 ไม่มีช่องให้กดเลือก" → chose only "ส่งออกเฉพาะแถวที่ติ๊ก"): scutTbl, sinvTbl, srcpTbl,
    swhtTbl and swhtOutTbl left this list — they have the standard ticks with the generic "export the ticked rows" and
    nothing else in the bar (the stock-cut register also with the sale-flow switch off: one behaviour for the register). */
 ['crmTbl','custTbl','taxOvTbl','mvTbl','ccTbl','venTbl','grTbl','utilTbl','basTbl','offTbl','othTbl','kit-register','aArTbl','aApTbl','expTbl','assetTbl','recTbl','wnTbl','empTbl'].forEach(id=>RN.setActions(id,[]));
 window.PKG_SEL_ACTIONS={approve,mergeCustomers,kinds:K,registers:REG};
})();
