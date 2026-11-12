/* DriveGo new system (the owner's decision of 2026-11-12: "งบทดลองและงบการเงินอ่านจากบัญชีแยกประเภท", then "ทำงบทดลอง
   ต่อเลย"): the trial balance is the general ledger's (71-ledger.js).
   · trialBalance(y) — 08 → ผังบัญชี's balance column, "งบทดลอง (Trial Balance)", its CSV and its print — is every
     account's balance at the end of year y from the journal built from the documents: the profit-and-loss accounts for
     that year, earlier years in 3030 กำไร (ขาดทุน) สะสม; money received or paid by transfer, card or cheque on 1020; the
     VAT months that have ended closed into 2040 / 1055; the opening balances (73-opening.js) when the shop has them. It
     balances. What the modules before this one added to the old trial balance (03.js and its wrappers) is in the
     ledger's own postings, so the old one is no longer called.
   · The text under the table and the printed note say where the figures come from (the old ones said cash was
     estimated). The financial statements are still worked out as before. */
(function(){
 const L=window.PKG_LEDGER;
 if(!L||typeof trialBalance!=='function')return;
 const r2=v=>Math.round((+v||0)*100)/100;
 /* the journal once per task: 08 → ผังบัญชี asks for the trial balance twice in one drawing (the chart's balances and the
    table); a shop with three years of documents takes about a second to build it */
 let memo=null;
 const list=()=>{const k=[DB,DB.receipts,DB.stock,DB.capital];if(memo&&memo.k.every((x,i)=>x===k[i]))return memo.v;
  const v=L.entries();memo={k,v};Promise.resolve().then(()=>{memo=null;});return v;};
 window.trialBalance=function(y){
  return L.balances(String(y)+'-12-31',list()).map(r=>({code:r.code,name:r.name,type:r.type,debit:r2(r.debit),credit:r2(r.credit)}));};

 /* the text under the table */
 const NOTE='งบทดลองนี้มาจากบัญชีแยกประเภทที่สร้างจากเอกสารในระบบ ผู้ทำบัญชีควรตรวจและปรับปรุงรายการก่อนปิดงบและนำส่งกรมสรรพากร';
 const tbl=document.getElementById('tbTbl'),hint=tbl&&tbl.closest('.panel')&&tbl.closest('.panel').querySelector('.body > p.hint');
 if(hint)hint.textContent=NOTE;

 /* the print: the note says where the figures come from (the old one said cash and pay were estimated) */
 const OLD='ยอดเงินสดและเงินเดือนเป็นการประมาณการจากข้อมูลในระบบ ผู้ทำบัญชีควรปรับปรุงรายการก่อนปิดงบ',
  NEW='จากบัญชีแยกประเภทที่สร้างจากเอกสารในระบบ ผู้ทำบัญชีควรตรวจและปรับปรุงรายการก่อนปิดงบ';
 if(typeof printTrial==='function'){const pt0=window.printTrial;
  window.printTrial=function(){const pd=window.printDocs;
   window.printDocs=function(h){return pd.call(this,String(h).replace(OLD,NEW));};
   try{return pt0.apply(this,arguments);}finally{window.printDocs=pd;}};}
})();
