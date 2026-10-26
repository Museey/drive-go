/* DriveGo new system (task 3.9, decision R14 and the owner's answers of 2026-10-26): what each person may see, on the
   screens. The server sends nobody the values they may not see (server/lib/visibility.ts) and keeps the whole-data
   copies (backup points) for the shop's owner — Franchise HQ or the branch head:
   · the whole shop's backup file (ส่งออกไฟล์สำรอง) and restoring a backup point are the owner's;
   · other employees' pay and personal data: the payroll's own checks are in 60-payroll.js;
   · costs (F7 = ก, SCENARIOS.md finding 13): whoever has neither "แสดงต้นทุน" nor a job that works with purchase
     prices (COST_JOBS, the same list as the server's) gets no cost from the server and sees none: the stock
     register's cost total, the product form's purchase price and margins, the product card's cost, profit and
     cost columns, the cost columns of the goods-received history and the move report; recording a vendor
     claim's result (its amounts default to the cost) asks for someone who sees costs. Such a job given in the
     staff form turns "แสดงต้นทุน" on with it, and the form says so. */
(function(){
 if(typeof exportData!=='function'||typeof restoreBackup!=='function')return;
 const $i=id=>document.getElementById(id);
 /* the owner here: no employee signed in, and in a franchise HQ or the branch head (not a staff account) */
 const ownerHere=()=>{if(curEmp())return false;const a=typeof frAcc==='function'?frAcc():null;return !a||a.role==='HQ'||a.role==='HB';};
 const ex0=window.exportData;window.exportData=function(){if(!ownerHere())return toast('ส่งออกไฟล์สำรองทั้งร้านได้เฉพาะเจ้าของร้าน');return ex0.apply(this,arguments);};
 const rb0=window.restoreBackup;window.restoreBackup=function(){if(!ownerHere())return toast('กู้คืนจากจุดสำรองได้เฉพาะเจ้าของร้าน');return rb0.apply(this,arguments);};

 /* ---------- costs ---------- */
 const COST_JOBS=['stock.cost','apv.gr','sub.buyGr','doc.payGr','sub.acctAp','doc.fin'];   /* = server/lib/visibility.ts */
 const costOk=()=>!curEmp()||COST_JOBS.some(k=>can(k));
 const st=document.createElement('style');
 st.textContent='.pkg-nocost .pkg-cost{display:none!important}';
 document.head.append(st);
 /* the product form: the purchase price and the margins */
 const fc=$i('fCost'),fl=fc&&fc.closest('label');if(fl)fl.classList.add('pkg-cost');
 ['mgA','mgB','mgC','fPctA','fPctB','fPctC'].forEach(id=>{const el=$i(id);if(el)el.classList.add('pkg-cost');});
 const mark=()=>document.documentElement.classList.toggle('pkg-nocost',!costOk());
 if(typeof applyPerms==='function'){const o=window.applyPerms;window.applyPerms=function(){const r=o.apply(this,arguments);try{mark();}catch(e){}return r;};}
 mark();
 /* a table's columns whose heading names a cost */
 function hideCostCols(tbl){if(!tbl||costOk())return;const head=tbl.tHead&&tbl.tHead.rows[0];if(!head)return;
  const at=[...head.cells].map((c,i)=>/ทุน/.test(c.textContent)?i:-1).filter(i=>i>=0);
  [...tbl.rows].forEach(r=>{if(r.cells.length<head.cells.length)return;at.forEach(i=>{if(r.cells[i])r.cells[i].style.display='none';});});}
 if(typeof openCard==='function'){const o=window.openCard;window.openCard=function(){const r=o.apply(this,arguments);
  try{if(!costOk()){const b=$i('mCardBody');[...b.querySelectorAll('.hint')].filter(h=>/^(ต้นทุนล่าสุด|กำไรที่ระดับราคา B)$/.test(h.textContent.trim())).forEach(h=>{if(h.parentElement)h.parentElement.style.display='none';});
   b.querySelectorAll('table').forEach(hideCostCols);}}catch(e){}return r;};}
 [['renderGRHist','mGRHist'],['renderMoveRep','mMoveRep']].forEach(([fn,box])=>{const o=window[fn];if(typeof o!=='function')return;
  window[fn]=function(){const r=o.apply(this,arguments);try{const m=$i(box);if(m)m.querySelectorAll('table').forEach(hideCostCols);}catch(e){}return r;};});

 if(typeof clRecvOpen==='function'){const o=window.clRecvOpen;window.clRecvOpen=function(){
  if(!costOk())return toast('บันทึกผลเคลม (รับคืน / ตีเสีย / หักยอด) ต้องให้ผู้มีสิทธิ์เห็นต้นทุนเป็นผู้บันทึก');return o.apply(this,arguments);};}
 /* the staff form: a job that sees purchase prices turns the cost switch on (stock.cost, stock.summary and
    doc.homeMoney, as the switch does, 14.js) */
 if(typeof pkgPermDerive==='function'){const o=window.pkgPermDerive;window.pkgPermDerive=function(p){const r=o.apply(this,arguments);
  try{const q=r||p;if(q&&COST_JOBS.slice(1).some(k=>{const [g,f]=k.split('.');return q[g]&&q[g][f]===true;})){
   q.stock=q.stock||{};q.doc=q.doc||{};q.stock.cost=true;q.stock.summary=true;q.doc.homeMoney=true;}}catch(e){}return r;};}
 if(typeof permBoxes==='function'){const o=window.permBoxes;window.permBoxes=function(){const r=o.apply(this,arguments);
  try{const h=[...document.querySelectorAll('#pkg-perm-special h5')].find(x=>x.textContent.trim()==='แสดงต้นทุน'),sec=h&&h.parentElement;
   if(sec&&!sec.querySelector('.pkg-cost-jobs')){const p=document.createElement('p');p.className='hint pkg-cost-jobs';
    p.textContent='งานที่เห็นราคาซื้อ (ใบรับสินค้า อนุมัติใบรับสินค้า จ่ายเงินเจ้าหนี้ เจ้าหนี้ค้างจ่าย ดูสรุปการเงิน) เปิด "แสดงต้นทุน" ให้เองเมื่อบันทึก';sec.append(p);}}catch(e){}return r;};}

 window.PKG_RIGHTS={ownerHere,costOk,COST_JOBS};
})();
