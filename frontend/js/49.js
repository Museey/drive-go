/* A copied quote replaces the old one (user 2026-10-12: when the payer changes — e.g. to the customer's company — the staff
   copy the quote, change the customer and run the chain again, "จะได้เป็นเส้นตรง"; "ให้ระบบถามว่ายกเลิกใบเสนอราคาเดิมด้วย").
   The first time a copy (Q.copiedFrom = the source number) is saved, the program asks whether to cancel the source quote.
   · yes → the source is cancelled with the same writes as the original cancelQuoteDoc for a quote that was not cut
     (cancelled / cancelReason / cancelDate / status + audit line), reason = "คัดลอกเป็นใบใหม่ <no>"
   · the source already has a stock-cut document, a receipt or an invoice → it cannot be cancelled from here; the dialog
     says what has to be cancelled first
   · needs the same rights as cancelling a quote, and the account's own cancel period (perm-matrix.js) */
(()=>{
 if(typeof saveQuote!=='function'||typeof askP!=='function')return;
 const cur=()=>{try{return (0,eval)('Q');}catch(e){return null;}};
 const mayCancel=q=>{try{if(!can('doc.cancelDoc')||!can('doc.delDoc'))return false;if(typeof pkgCancelWindowOk==='function'&&!pkgCancelWindowOk(q))return false;return true;}catch(e){return false;}};
 const blockers=q=>{const out=[];
  try{const c=window.PKG_STOCK_CUT&&PKG_STOCK_CUT.activeCut(q);if(c)out.push('ใบตัดสต็อก '+c.no);}catch(e){}
  const r=(DB.receipts||[]).find(x=>x.quoteId===q.id&&!x.cancelled);if(r)out.push('ใบเสร็จ '+r.no);
  const iv=(DB.invoices||[]).find(v=>!v.cancelled&&v.srcType==='quote'&&(v.refIds||[]).includes(q.id));if(iv)out.push('ใบแจ้งหนี้ '+iv.no);
  if(q.deducted&&!out.length)out.push('การตัดสต๊อกของใบนี้');return out;};
 async function after(srcNo,newNo){
  const q=(DB.quotes||[]).find(x=>x.no===srcNo);if(!q||q.cancelled||q.superseded)return;
  const b=blockers(q);
  if(b.length){await askP({title:'ใบเสนอราคาเดิมยังยกเลิกไม่ได้',text:'ใบใหม่ '+newNo+' คัดลอกมาจาก '+srcNo+' ซึ่งมี '+b.join(' · ')+' อยู่ — ต้องยกเลิกเอกสารนั้นก่อน แล้วจึงยกเลิกใบเสนอราคา '+srcNo+' เพื่อไม่ให้มีสองใบสำหรับงานเดียวกัน',yes:'รับทราบ',no:'ปิด',tone:'warn'});return;}
  if(!mayCancel(q))return toast('ใบเดิม '+srcNo+' ยังอยู่ — บัญชีนี้ไม่มีสิทธิ์ยกเลิก ให้ผู้มีสิทธิ์ยกเลิกใบนั้นด้วย');
  const yes=await askP({title:'ยกเลิกใบเสนอราคาเดิมด้วยไหม',text:'ใบใหม่ '+newNo+' คัดลอกมาจาก '+srcNo+' — ยกเลิกใบเดิม เพื่อไม่ให้มีสองใบสำหรับงานเดียวกัน?',yes:'ยกเลิกใบเดิม '+srcNo,no:'เก็บใบเดิมไว้',tone:'warn'});
  if(!yes)return;
  if(q.cancelled||blockers(q).length)return;   /* changed while the question was open */
  q.cancelled=true;q.cancelReason='คัดลอกเป็นใบใหม่ '+newNo;q.cancelDate=iso();q.status='ยกเลิกแล้ว';
  logAudit('quote',q,'del','ยกเลิกใบเสนอราคา — '+q.cancelReason);save();
  try{renderQuoteOverview();renderHome();}catch(e){}
  toast('ยกเลิกใบเสนอราคาเดิม '+srcNo+' แล้ว · ใช้ใบใหม่ '+newNo+' ต่อ');
 }
 const o=saveQuote;
 saveQuote=window.saveQuote=function(){
  const q0=cur(),first=q0&&!q0.no&&q0.copiedFrom?String(q0.copiedFrom):'';
  const r=o.apply(this,arguments);
  const done=()=>{const q=cur();if(first&&q&&q.no&&q.no!==first)setTimeout(()=>after(first,q.no),700);};   /* after the "saved" tick */
  if(r&&typeof r.then==='function')r.then(done);else done();return r;};
 window.PKG_QUOTE_COPY_CANCEL={after};
})();
