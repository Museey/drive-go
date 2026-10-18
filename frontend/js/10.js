/* Retail bills share receipt persistence, numbering, stock posting and accounting. */
function pkgRetailOverview(){
  const retail=rOvPane==='retail', box=document.querySelector('#rOv-doc');
  const create=box.querySelector('button[onclick*="newReceipt"],button[data-retail-create]');
  create.dataset.retailCreate='';
  document.getElementById('docOvEmpty').textContent=retail?'ยังไม่มีบิลขายหน้าร้านในช่วงวันที่เลือก':'ยังไม่มีใบแจ้งหนี้หรือใบเสร็จในระบบ';
  create.textContent=retail?'+ เปิดบิลขายหน้าร้าน':'+ สร้างใบเสร็จรับเงิน / ใบแจ้งหนี้';
  create.setAttribute('onclick',retail?'newRetailReceipt()':'newReceipt()');
  box.querySelector('[onclick="docListOpen(\'receipt\')"]').hidden=retail;
  box.querySelector('[onclick="openForms(\'receipt\')"]').hidden=retail;
}
function newRetailReceipt(){
  if(!can('doc.rIssue')||!can('sub.rcptRetail')) return toast('บัญชีนี้ไม่มีสิทธิเปิดบิลขายหน้าร้าน');
  R=blankReceipt(); R.salesChannel='retail'; R.warr='';
  fillReceiptForm();openModal('mReceiptEdit');
}
(function(){
  const modal=document.getElementById('mReceiptEdit');
  const head=modal.querySelector('header h2'), oldTitle=head.textContent;
  const customer=document.createElement('label'); customer.className='f pkg-retail-customer';customer.style.position='relative';
  customer.innerHTML='<span>ลูกค้า</span><input type="text" id="pkgRetailCustomerSearch" autocomplete="off" placeholder="พิมพ์ชื่อลูกค้า / บริษัท / เบอร์โทร"><div id="pkgRetailCustomerSug" class="whoSug" style="display:none"></div><select id="pkg-retail-customer" style="display:none"><option value="">ลูกค้าทั่วไป / ขายหน้าร้าน</option></select>';
  document.getElementById('rHeadGrid').append(customer);
  const select=customer.querySelector('select');
  select.onchange=()=>{if(!R||R.deducted||R.cancelled)return;R.custId=select.value;R.vehIdx=-1;calcReceipt();};
  const customerPicker=bindPicker('pkgRetailCustomerSearch','pkgRetailCustomerSug','pkg-retail-customer',()=>[{id:'',text:'ลูกค้าทั่วไป / ขายหน้าร้าน',find:'ขายสด'},...custPickerRows()]);
  const src=document.getElementById('rSrc').closest('label'),ref=document.getElementById('rRef').closest('label');
  const tech=document.getElementById('rTech1').closest('.grid');
  const labor=modal.querySelector('[onclick="addRLine(\'labor\')"]');
  const note=modal.querySelector('.grid.g2 > .hint'),oldNote=note.textContent;
  const warr=document.getElementById('rWarr').previousElementSibling, oldWarr=warr.textContent;
  const create=modal.querySelector('[onclick="newReceipt()"]');
  create.onclick=()=>R&&R.salesChannel==='retail'?newRetailReceipt():newReceipt();
  const original=fillReceiptForm;
  fillReceiptForm=function(){
    const retail=R.salesChannel==='retail';
    modal.classList.toggle('pkg-retail-form',retail);
    head.textContent=retail?'ขายสินค้าหน้าร้าน / ใบเสร็จรับเงิน':oldTitle;
    [src,ref,tech,labor].forEach(el=>el.hidden=retail);
    customer.hidden=!retail;
    select.innerHTML='<option value="">ลูกค้าทั่วไป / ขายหน้าร้าน</option>'+DB.cust.map(c=>'<option value="'+esc(c.id)+'">'+esc(custName(c))+'</option>').join('');
    select.value=R.custId||'';select.disabled=!!(R.deducted||R.cancelled);customerPicker.sync();
    note.textContent=retail?'เลือกสินค้าจากคลัง ระบุจำนวนและวิธีชำระเงิน แล้วบันทึกเพื่อออกเลขที่บิลและตัดสต๊อก':oldNote;
    warr.textContent=retail?'เงื่อนไขการรับประกันสินค้า':oldWarr;
    return original.apply(this,arguments);
  };
  const saveOriginal=saveReceipt;
  saveReceipt=async function(){
    if(R&&R.salesChannel==='retail'){
      if(!can('sub.rcptRetail')||R.cancelled)return toast('ไม่สามารถบันทึกบิลนี้ได้');
      if(R.quoteId)return toast('บิลขายหน้าร้านไม่สามารถเชื่อมใบเสนอราคาได้');
      if(!R.deducted&&rItemsClean(R).some(it=>(it.type==='kit'?!(it.kitItems||[]).length||it.kitItems.some(k=>!DB.stock.some(s=>s.id===k.stockId)):(it.type!=='part'||!DB.stock.some(s=>s.id===it.stockId)))||!Number.isFinite(Number(it.qty))||Number(it.qty)<=0))return toast('เลือกสินค้าจากคลังและระบุจำนวนมากกว่า 0');
      if(!R.custId&&(document.getElementById('pCredit').checked||document.getElementById('rIssueTax').checked))return toast('เลือกลูกค้าก่อนขายเชื่อหรือออกใบกำกับภาษี');
    }
    return saveOriginal.apply(this,arguments);
  };
  const cancelOriginal=cancelReceiptDoc;
  cancelReceiptDoc=async function(id){
    const bill=DB.receipts.find(r=>r.id===id);
    /* Any receipt that deducted stock itself (4.4, or an older 4.1 bill without a quote) returns it exactly once. */
    const restore=bill&&!bill.quoteId&&!bill.saleId&&bill.deducted&&!bill.cancelled&&!bill.retailStockReturned&&!bill.stockReturned;   /* saleId: the stock belongs to the 4.4 ตัดสต็อก document */
    await cancelOriginal.apply(this,arguments);
    if(restore&&bill.cancelled){
      pkgStockLines(rItemsClean(bill)).forEach(it=>{
        const stock=DB.stock.find(s=>s.id===it.stockId);if(!stock)return;
        stock.qty=n(stock.qty)+n(it.qty);stock.lastMove=iso();
        logMove(stock.id,'in',n(it.qty),iso(),bill.salesChannel==='retail'?'คืนสต๊อกจากยกเลิกขายหน้าร้าน':'คืนสต๊อกจากการยกเลิกใบเสร็จ',bill.no);
      });
      bill.stockReturned=true;if(bill.salesChannel==='retail')bill.retailStockReturned=true;
      if(R&&R.id===id){R.stockReturned=true;R.retailStockReturned=bill.retailStockReturned;}
      save();renderStock();renderHome();
    }
  };
  const sheetOriginal=sheetReceipt;
  sheetReceipt=function(r,kind,copy){
    const html=sheetOriginal.apply(this,arguments);if(r.salesChannel!=='retail')return html;
    const template=document.createElement('template');template.innerHTML=html;
    template.content.querySelectorAll('td').forEach(td=>{
      if(td.querySelector('.lbl')?.textContent==='รถที่รับบริการ')td.innerHTML='<span class="lbl">ประเภทการขาย</span><br><b>ขายสินค้าหน้าร้าน</b>';
      if(td.textContent.trim()==='ทะเบียนรถ'||td.textContent.trim()==='อ้างอิงใบเสนอราคา')td.parentElement.remove();
    });
    if(!r.custId){const label=[...template.content.querySelectorAll('.lbl')].find(el=>el.textContent==='ได้รับเงินจาก');if(label)label.parentElement.querySelector('b').textContent='ลูกค้าทั่วไป / ขายหน้าร้าน';}
    return template.innerHTML.replace('ใบส่งมอบงาน / ใบเสร็จรับเงิน / ใบแจ้งหนี้','ใบเสร็จรับเงิน / ใบแจ้งหนี้');
  };
})();
