/* DriveGo new system (the owner's decision of 2026-11-12: "เอาตามที่เสนอทุกข้อ"): cash taken to the bank and back.
   08 → เงินลงทุน / เงินสด has two more kinds of entry, "ฝากเงินสดเข้าธนาคาร" and "ถอนเงินจากธนาคารเป็นเงินสด": the
   general ledger moves the amount between cash (1010) and the bank (1020) on that day (71-ledger.js); the business's
   money as a whole does not change, so the capital page's cards and the old figures (finance) leave them out. In the
   register they are not money in or out (no green / red chip). */
(function(){
 if(typeof CAP_LABEL==='undefined'||typeof renderCap!=='function')return;
 const KINDS=[['deposit','ฝากเงินสดเข้าธนาคาร'],['withdraw','ถอนเงินจากธนาคารเป็นเงินสด']];
 KINDS.forEach(([k,t])=>{CAP_LABEL[k]=t;});
 const sel=document.getElementById('zType');
 if(sel)KINDS.forEach(([k,t])=>{if(!sel.querySelector('option[value="'+k+'"]')){const o=document.createElement('option');o.value=k;o.textContent=t;sel.append(o);}});
 const names=new Set(KINDS.map(([,t])=>t));
 const rc0=window.renderCap;
 window.renderCap=function(){const out=rc0.apply(this,arguments);
  try{document.querySelectorAll('#capTbl tbody .chip').forEach(c=>{if(names.has(c.textContent.trim()))c.className='chip';});}catch(e){}
  return out;};
})();
