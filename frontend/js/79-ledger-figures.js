/* DriveGo new system (team's check of 2026-11-18, the owner's decision of 2026-11-19 "ทำ 1-4 ได้เลย", item 3): a figure
   is the same on every page that shows it.
   · 00 หน้าแรก "ยอดลูกหนี้คงค้าง" = the ledger's receivables (1030) at the end of this year, as 08 งบการเงิน shows them.
     The original added the jobs not yet billed (they have their own card, "งานค้างส่งมอบรถ") and took off the withholding
     customers will deduct (the ledger keeps it owed until the certificate comes with the payment). "เกินกำหนดชำระ" and the
     table "ลูกหนี้คงค้าง" stay as they were.
   · 00 หน้าแรก "สรุปภาษีประจำงวด" of a VAT-registered shop: the month's expenses with VAT count in the purchases and the
     input VAT, as 08 รายงานภาษี and the ledger (1050) count them; the VAT to pay (ภ.พ.30) follows. The goods received and
     the assets bought were counted already (03.js, 62-assets.js), the card fees too (53.js).
   · finance(y) — 08 สุขภาพการเงิน and what reads it: the receivables are the ledger's at the end of year y (the receipts
     from before the sale flow paid in part counted whole); total assets and equity move with them.
   Within a branch report the figures are the branches' (PKG_BRANCH_REPORT), as the rest of the page. */
(function(){
 const L=window.PKG_LEDGER;if(!L||typeof L.arOn!=='function'||typeof renderHome!=='function')return;
 const $i=id=>document.getElementById(id),r2=v=>Math.round((+v||0)*100)/100;
 const num=c=>n(String(c&&c.textContent||'').replace(/[^0-9.\-]/g,''));
 const row=(id,t)=>{const tb=$i(id)&&$i(id).tBodies[0];return tb?[...tb.rows].find(r=>r.cells[0]&&r.cells[0].textContent.trim()===t)||null:null;};
 const yearEnd=y=>String(y)+'-12-31';

 const hm0=window.renderHome;
 window.renderHome=function(){const out=hm0.apply(this,arguments);
  try{
   const R=window.PKG_BRANCH_REPORT,inHome=f=>R?R.run('home',f):f();
   const mo=($i('finMonth')&&$i('finMonth').value)||iso().slice(0,7);
   const got=inHome(()=>{
    const ex=(DB.expenses||[]).filter(x=>x&&String(x.date||'').slice(0,7)===mo&&n(x.vat)>0);
    return {ar:L.arOn(yearEnd(iso().slice(0,4))),base:r2(ex.reduce((a,x)=>a+expTotals(x).base,0)),vat:r2(ex.reduce((a,x)=>a+expTotals(x).vat,0))};});
   const ar=$i('hAr');if(ar&&typeof money0==='function')ar.textContent=money0(got.ar);
   if(isVatReg()&&(got.base||got.vat)){
    const bb=row('taxTbl','ยอดซื้อก่อน VAT'),bv=row('taxTbl','ภาษีซื้อ (VAT จากใบกำกับภาษีผู้ขาย)'),sv=row('taxTbl','ภาษีขาย (VAT จากใบกำกับภาษีที่ออก)'),
     pay=row('taxTbl','ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30)')||row('taxTbl','เครดิตภาษียกไปงวดถัดไป');
    if(bb&&bv&&sv&&pay){
     bb.cells[1].textContent=money(r2(num(bb.cells[1])+got.base));bv.cells[1].textContent=money(r2(num(bv.cells[1])+got.vat));
     const d=r2(num(sv.cells[1])-num(bv.cells[1]));
     pay.cells[0].innerHTML='<b>'+(d>=0?'ภาษีมูลค่าเพิ่มที่ต้องนำส่ง (ภ.พ.30)':'เครดิตภาษียกไปงวดถัดไป')+'</b>';pay.cells[1].innerHTML='<b>'+money(Math.abs(d))+'</b>';}
   }
  }catch(e){}
  return out;};

 if(typeof finance==='function'){const fin0=window.finance;
  window.finance=function(y){const f=fin0.apply(this,arguments);if(!f)return f;
   try{const d=r2(L.arOn(yearEnd(y))-f.ar);
    if(Math.abs(d)>=0.005){f.ar=r2(f.ar+d);f.assetsTotal+=d;f.equity+=d;
     f.roi=f.ownerCap>0?f.np/f.ownerCap*100:(f.equity>0?f.np/f.equity*100:0);f.roa=f.assetsTotal>0?f.np/f.assetsTotal*100:0;}
   }catch(e){}
   return f;};}
})();
