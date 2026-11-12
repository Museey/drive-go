/* DriveGo new system (owner's decision of 2026-11-06, NOTES.md "งานบัญชีที่ค้าง" 4): selling a fixed asset, and the
   accounts of an asset that leaves the business.
   · The asset's window ("แก้ไข" in 06 · ซื้อสินทรัพย์ or the register): "ขายสินทรัพย์" on an asset in use asks the day sold, the buyer, the
     price before VAT and how the money came (cash or transfer, received that day). A VAT-registered shop issues a full
     tax invoice numbered with the sales' MA-TX… — the buyer is then one of the customers (name, address, tax ID) — and
     its VAT goes into the sales tax report of the sale's month (not in a closed month). The asset is then
     "จำหน่ายแล้ว" on the day sold (its depreciation stops there, 62-assets.js); its sale cannot be edited.
     The owner, or staff with "บันทึกค่าใช้จ่าย สินทรัพย์ และเงินลงทุน" (doc.acctEdit).
     a.sale = { date, buyer, custId, tax, rate, base, vat, gross, method, taxNo, nbv, gain, at, by, byName }
   · The accounts, in the year (and month) it left: the sale price before VAT less the value left (cost less the
     depreciation to that day) is a gain to 4040 กำไรจากการจำหน่ายสินทรัพย์ or a loss to 6140 ขาดทุนจากการจำหน่ายสินทรัพย์
     (accountant round 3 / owner 2026-11-11; before: 4030 / 6190; the codes come from PKG_LEDGER.sys); an asset marked
     "จำหน่าย / ตัดออกแล้ว" without a sale is a loss of its value left. The trial balance takes its cost and its
     accumulated depreciation out from that year; cash takes the money received; the sales tax its VAT.
   To be checked by the shop's accountant. */
(function(){
 const A=window.PKG_ASSETS;
 if(!A||typeof assetDep!=='function'||typeof renderAssets!=='function'||typeof finance!=='function'||typeof trialBalance!=='function')return;
 const $i=id=>document.getElementById(id),r2=v=>Math.round((n(v)+Number.EPSILON)*100)/100,yr=d=>+String(d||'').slice(0,4);
 const METHODS=['เงินสด','เงินโอน'];
 const all=()=>DB.assets||[];
 const mayEdit=()=>!curEmp()||!!can('doc.acctEdit');
 const gone=a=>a&&!a.cancelled&&a.status==='sold'&&!!a.out;
 /* what an asset that left gains or loses: the price before VAT less the value left on the day it left */
 const valueLeft=a=>r2(assetDep(a,yr(a.out)).nbv);
 const result=a=>r2((a.sale?n(a.sale.base):0)-valueLeft(a));

 /* ---------- selling ---------- */
 function custOptions(){return (DB.cust||[]).map(c=>`<option value="${esc(custName(c)||'')}"></option>`).join('');}
 function ask(a){return new Promise(res=>{
  const vat=vatDefault(),nbv=r2(assetDep(Object.assign({},a,{status:'sold',out:iso()}),yr(iso())).nbv);
  const msg=`<p>${esc(a.no)} · ${esc(a.name)} · มูลค่าตามบัญชี ณ วันนี้ ${money(nbv)} บาท</p><div class="grid g2" style="margin-top:8px">
   <label class="f"><span>วันที่ขาย</span><input type="date" id="asDate" value="${iso()}"></label>
   <label class="f"><span>ผู้ซื้อ${vat>0?' (จากทะเบียนลูกค้า)':''}</span><input id="asBuyer" list="asBuyerList"><datalist id="asBuyerList">${custOptions()}</datalist></label>
   <label class="f"><span>ราคาขาย (ก่อน VAT)</span><input type="number" min="0" step="0.01" id="asPrice"></label>
   <label class="f"><span>วิธีรับเงิน</span><select id="asMethod">${METHODS.map(m=>`<option>${m}</option>`).join('')}</select></label></div>
   ${vat>0?`<p class="hint">ออกใบกำกับภาษีเต็มรูป ภาษีมูลค่าเพิ่ม ${vat}%</p>`:''}`;
  askConfirm({title:'ขายสินทรัพย์ '+a.no,msg,yes:'บันทึกการขาย',no:'ยกเลิก',onNo:()=>res(null),
   onYes:()=>res({date:($i('asDate')||{}).value||iso(),buyer:String(($i('asBuyer')||{}).value||'').trim(),price:n(($i('asPrice')||{}).value),method:($i('asMethod')||{}).value||METHODS[0]})});});}
 async function sell(id){
  const a=all().find(x=>x.id===id);if(!a||a.cancelled||a.status==='sold')return;
  if(!mayEdit())return toast('บัญชีนี้ไม่มีสิทธิ์บันทึกสินทรัพย์');
  const f=await ask(a);if(!f)return;
  if(!(f.price>0))return toast('ใส่ราคาขายก่อน');
  if(f.date<a.date)return toast('วันที่ขายต้องไม่ก่อนวันที่ได้มา');
  const rate=vatRateOn(f.date)&&isVatReg()?vatRateOn(f.date):0;
  const c=(DB.cust||[]).find(x=>String(custName(x)||'').trim()===f.buyer)||null;
  if(rate>0&&!c)return toast('เลือกผู้ซื้อจากทะเบียนลูกค้า — การขายที่มี VAT ต้องออกใบกำกับภาษีที่มีชื่อ ที่อยู่ และเลขผู้เสียภาษีของผู้ซื้อ');
  if(!f.buyer)return toast('ใส่ชื่อผู้ซื้อก่อน');
  const T=window.PKG_TAX_PERIOD;if(rate>0&&T&&T.locked&&T.locked(f.date))return;
  const base=r2(f.price),vat=rate>0?vatOf(base,rate):0,gross=r2(base+vat);
  const old=Object.assign({},a);
  Object.assign(a,{status:'sold',out:f.date});
  const nbv=valueLeft(a);
  a.sale={date:f.date,buyer:c?custName(c):f.buyer,custId:c?c.id:'',tax:c?(c.tax||''):'',rate,base,vat,gross,method:f.method,
   taxNo:rate>0?docNo('TX'):'',nbv,gain:r2(base-nbv),at:nowTs(),by:DB.curEmp||'',byName:meName()};
  if(typeof stampRec==='function')stampRec(a,old);
  logAudit('asset',a,'save','ขายสินทรัพย์ '+a.no+' ให้ '+a.sale.buyer+' '+money(gross)+' บาท ('+f.method+')'+(a.sale.taxNo?' · ใบกำกับภาษี '+a.sale.taxNo:'')
   +' · '+(a.sale.gain>=0?'กำไร ':'ขาดทุน ')+money(Math.abs(a.sale.gain))+' บาท');
  save();redraw();
  toast('บันทึกการขาย '+a.no+' แล้ว'+(a.sale.taxNo?' · ใบกำกับภาษี '+a.sale.taxNo:'')+' · '+(a.sale.gain>=0?'กำไร ':'ขาดทุน ')+money(Math.abs(a.sale.gain))+' บาท');
  if(a.sale.taxNo)printInv(a);
 }
 function redraw(){['renderAssets','renderBuyAssets','renderAcct','renderHome'].forEach(f=>{try{if(typeof window[f]==='function')window[f]();}catch(e){}});}

 /* ---------- its tax invoice (a receipt too: the money came that day) ---------- */
 function sheet(a,copy){const s=a.sale,c=(DB.cust||[]).find(x=>x.id===s.custId);
  return sheetTop({title:'ใบกำกับภาษี / ใบเสร็จรับเงิน',en:'TAX INVOICE / RECEIPT',copy,fields:[['เลขที่',esc(s.taxNo)],['วันที่',thDate(s.date)]]})+`
  <table><tr><td style="vertical-align:top"><span class="lbl">ชื่อผู้ซื้อ / ผู้รับบริการ</span><br><b>${esc(s.buyer)}</b><br>${esc(addrLine(c&&c.addr))}<br>
   เลขประจำตัวผู้เสียภาษี ${esc(s.tax||'-')}${c&&c.branch?' ('+esc(c.branch)+')':''}</td></tr></table>
  <table style="margin-top:7px"><thead><tr><th style="width:30px">ลำดับ</th><th>รายการ</th><th style="width:48px">จำนวน</th><th style="width:110px">จำนวนเงิน</th></tr></thead><tbody>
   <tr><td style="text-align:center">1</td><td>ขายสินทรัพย์ ${esc(a.name)} (${esc(a.no)})</td><td style="text-align:center">1</td><td class="num">${money(s.base)}</td></tr>
   <tr><td colspan="3" style="text-align:right">มูลค่าสินค้า</td><td class="num">${money(s.base)}</td></tr>
   <tr><td colspan="3" style="text-align:right">ภาษีมูลค่าเพิ่ม ${s.rate}%</td><td class="num">${money(s.vat)}</td></tr>
   <tr><td colspan="3" style="text-align:right"><b>รวมทั้งสิ้น</b></td><td class="num"><b>${money(s.gross)}</b></td></tr>
   <tr><td colspan="4" style="text-align:center">(${bahtText(s.gross)})</td></tr></tbody></table>
  <div class="box"><span class="lbl">รับชำระโดย</span><br><span>${esc(s.method)} วันที่ ${thDate(s.date)}</span></div>
  <div class="sign"><div><div class="line"></div>( ${esc(s.byName||'.................................................')} )<br><span class="lbl">ผู้รับเงิน</span></div>
   <div><div class="line"></div>( ................................................. )<br><span class="lbl">ผู้ซื้อ</span></div></div></div>`;}
 function printInv(a){if(!a||!a.sale||!a.sale.taxNo)return;logAudit('asset',a,'print','ใบกำกับภาษี '+a.sale.taxNo+' 2 แผ่น');save();printDocs(sheet(a,'ต้นฉบับ')+sheet(a,'สำเนา'));}
 const tk0=docNoTaken;docNoTaken=function(no){return tk0.apply(this,arguments)||all().some(a=>a&&a.sale&&a.sale.taxNo===no);};

 /* ---------- the registers: the sale under an asset sold (the lists keep their buttons: the legacy screens are compared) ---------- */
 function paint(tblId){const tb=$i(tblId)&&$i(tblId).tBodies[0];if(!tb)return;
  [...tb.rows].forEach(tr=>{const b=tr.querySelector('button[onclick^="openAsset("]');if(!b)return;const id=(/openAsset\('([^']+)'\)/.exec(b.getAttribute('onclick'))||[])[1];
   const a=all().find(x=>x.id===id);if(!a||a.cancelled)return;
   if(a.sale){const cell=b.closest('tr').cells[2];if(cell&&!cell.querySelector('.pkg-asale'))cell.insertAdjacentHTML('beforeend',
    `<div class="hint pkg-asale">ขายให้ ${esc(a.sale.buyer)} ${thDate(a.sale.date)} · ${money(a.sale.gross)} บาท${a.sale.taxNo?` · <a href="#" data-ainv="${esc(a.id)}" data-no-translate>${esc(a.sale.taxNo)}</a>`:''}</div>`);}});}
 ['renderAssets','renderBuyAssets'].forEach(f=>{const o=window[f];if(typeof o!=='function')return;window[f]=function(){const out=o.apply(this,arguments);
  try{paint('assetTbl');paint('basTbl');}catch(e){}return out;};});
 document.addEventListener('click',e=>{const s=e.target.closest('[data-asell]');if(s){e.preventDefault();return sell(s.dataset.asell);}
  const p=e.target.closest('[data-ainv]');if(p){e.preventDefault();return printInv(all().find(x=>x.id===p.dataset.ainv));}});
 /* the asset's window: "ขายสินทรัพย์" for an asset in use (beside "พิมพ์ใบสำคัญจ่าย", hidden otherwise) */
 const foot=$i('mAsset')&&$i('mAsset').querySelector('footer');let sb=null;
 if(foot&&!$i('ySell')){sb=document.createElement('button');sb.type='button';sb.id='ySell';sb.className='btn gh';sb.textContent='ขายสินทรัพย์';sb.style.display='none';
  foot.insertBefore(sb,foot.firstChild);sb.addEventListener('click',async()=>{const id=editAssetId;if(!id)return;await sell(id);
   const a=all().find(x=>x.id===id);if(a&&a.sale&&typeof closeModal==='function')closeModal('mAsset');});}
 const oa0=window.openAsset;window.openAsset=function(id){const r=oa0.apply(this,arguments);
  try{const a=id?all().find(x=>x.id===id):null;if(sb)sb.style.display=a&&!a.cancelled&&a.status!=='sold'&&mayEdit()?'':'none';
   if(a&&a.sale&&$i('mAssetTitle'))$i('mAssetTitle').textContent+=' · ขายแล้ว'+(a.sale.taxNo?' · ใบกำกับภาษี '+a.sale.taxNo:'');}catch(e){}
  return r;};
 /* a sold asset's sale is kept as recorded: the form does not change it */
 const sv0=window.saveAsset;window.saveAsset=function(){const a=typeof editAssetId!=='undefined'&&editAssetId?all().find(x=>x.id===editAssetId):null;
  if(a&&a.sale)return toast('สินทรัพย์นี้ขายแล้ว — แก้ไขไม่ได้');return sv0.apply(this,arguments);};

 /* ---------- the sales tax report: its tax invoice in the month it was sold ---------- */
 const rt0=renderTax;renderTax=function(){
  const mo=acctM(),extra=all().filter(a=>a&&!a.cancelled&&a.sale&&a.sale.taxNo&&String(a.sale.date).slice(0,7)===mo).map(a=>({id:'FA'+a.id,no:a.sale.taxNo,taxNo:a.sale.taxNo,
   date:a.sale.date,custId:a.sale.custId,br:a.br||'',items:[],disc:0,vat:a.sale.rate,wht:0,whtBase:'labor',cancelled:false,paid:true,pay:{},payments:[],
   taxDocs:[{no:a.sale.taxNo,date:a.sale.date,cancelled:false,base:a.sale.base,vat:a.sale.vat,gross:a.sale.gross}]}));
  if(!extra.length)return rt0.apply(this,arguments);
  const real=DB.receipts;DB.receipts=real.concat(extra);try{return rt0.apply(this,arguments);}finally{DB.receipts=real;}
 };

 /* ---------- the accounts ---------- */
 function within(pred){const o={gain:0,loss:0,vat:0,cash:0};
  all().forEach(a=>{if(!gone(a))return;
   if(pred(a.out)){const g=result(a);if(g>=0)o.gain+=g;else o.loss-=g;if(a.sale)o.vat+=n(a.sale.vat);}});
  o.gain=r2(o.gain);o.loss=r2(o.loss);o.vat=r2(o.vat);return o;}
 const cashIn=y=>r2(all().filter(a=>gone(a)&&a.sale&&yr(a.sale.date)<=y).reduce((t,a)=>t+n(a.sale.gross),0));
 const fin0=window.finance;
 window.finance=function(y){const f=fin0.apply(this,arguments);if(!f)return f;
  const o=within(d=>inYear(d,y)),c=cashIn(y);if(!o.gain&&!o.loss&&!o.vat&&!c)return f;
  f.assetGain=o.gain;f.assetLoss=o.loss;f.vatSale+=o.vat;f.opex+=o.loss;f.np+=o.gain-o.loss;f.npm=f.revenue?f.np/f.revenue*100:0;
  f.cash+=c;f.assetsTotal+=c;f.equity+=c;
  f.roi=f.ownerCap>0?f.np/f.ownerCap*100:(f.equity>0?f.np/f.equity*100:0);f.roa=f.assetsTotal>0?f.np/f.assetsTotal*100:0;
  return f;};
 if(typeof monthlyPnL==='function'){const mp0=window.monthlyPnL;
  window.monthlyPnL=function(){const out=mp0.apply(this,arguments);
   (out||[]).forEach(m=>{const o=within(d=>String(d||'').slice(0,7)===m.key);if(o.gain||o.loss)m.np+=o.gain-o.loss;});return out;};}
 const tb0=window.trialBalance;
 window.trialBalance=function(y){const out=tb0.apply(this,arguments);
  try{const L=window.PKG_LEDGER,row=code=>{let w=out.find(r=>r.code===code);
    if(!w){w={code,name:L?L.nameOf(code):accName(code),type:L?L.typeOf(code):((DB.coa||[]).find(z=>z.code===code)||{}).type||'',debit:0,credit:0};out.push(w);}return w;};
   /* gone by the end of the year: its cost and depreciation leave the books */
   all().filter(a=>gone(a)&&yr(a.out)<=y&&yr(a.date)<=y).forEach(a=>{const [ac,dc]=assetAcc(a.cat),d=assetDep(a,y);
    const w1=out.find(r=>r.code===ac);if(w1)w1.debit=r2(w1.debit-n(a.cost));const w2=out.find(r=>r.code===dc);if(w2)w2.credit=r2(w2.credit-d.accEnd);});
   const o=within(d=>inYear(d,y));
   /* 4040 / 6140 (owner 2026-11-11 after accountant round 3, J20 J36; they were 4030 / 6190) */
   if(o.gain){const w=row(L?L.sys('gainAsset'):'4040');w.credit=r2(w.credit+o.gain);}
   if(o.loss){const w=row(L?L.sys('lossAsset'):'6140');w.debit=r2(w.debit+o.loss);}
  }catch(e){console.error('asset sale',e);}
  return out.filter(r=>Math.abs(r.debit)>=0.005||Math.abs(r.credit)>=0.005).sort((a,b)=>a.code.localeCompare(b.code));};
 /* 08 งบการเงิน: a row of its own before the net profit */
 if(typeof renderFS==='function'){const fs0=window.renderFS;
  window.renderFS=function(){const out=fs0.apply(this,arguments);
   try{const o=within(d=>inYear(d,acctY())),v=r2(o.gain-o.loss),tb=$i('plTbl')&&$i('plTbl').tBodies[0];
    const np=v&&tb&&[...tb.rows].find(r=>r.cells[0]&&r.cells[0].textContent.trim()==='กำไร (ขาดทุน) สุทธิก่อนภาษี');
    if(np&&!tb.querySelector('.pkg-fs-asale')){const tr=document.createElement('tr');tr.className='pkg-fs-asale';
     tr.innerHTML=`<td style="width:62%">${v>0?'บวก กำไรจากการจำหน่ายสินทรัพย์':'หัก ขาดทุนจากการจำหน่ายสินทรัพย์'}</td><td class="num">${money(Math.abs(v))}</td>`;np.before(tr);}}catch(e){}
   return out;};}

 window.PKG_ASSET_SALE={sell,printInv,result,valueLeft};
})();
