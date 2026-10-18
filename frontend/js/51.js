/* ระบบขายแบบใหม่ · phase 2 — the sale window (SALE-FLOW-TECH.md §5 phase 2, SALE-FLOW-PLAN.md "Answers 12 Oct").
   Everything here shows only while DB.pkgSaleFlow.on; with the switch off the window is today's, untouched.
   stock-cut.js keeps the window, the lines table and the R2 payment panel; it calls in here at five points:
   · paint() → PKG_SALE_PAY.mount(doc,{saved,locked}): state chip, the two buttons "บันทึกขาย · รอชำระ" (amber) and
     "ชำระเงิน" (green), technicians (repair jobs), the expected-withholding control (juristic customers only), the "จัดการ"
     block (ปรับเพิ่ม / ลด + reason), the payments of a saved sale with "รับชำระ" and "ยกเลิกการรับชำระ".
   · the line renderer → lineExtra(it,i,{saved,locked}): warranty months per stock line (editable before saving).
     Other modules add their own part through window.PKG_SALE_LINE_EXTRA (same signature) — see stock-cut.js.
   · "ชำระเงิน" → open(): the existing R2 panel (#mSalePay, same ids / data attributes, window.pkgSalePay) with a context:
     part payment allowed (shop setting), เงินเชื่อ tile alone with a customer; its result becomes
     PKG_SALE.saveSale(S,'pay'|'credit',draft) — the payment is checked first, nothing is cut when it is wrong.
   · register / 03 register → chip(c,mode), nos(c) · done pop-up → done(c,el).
   Bridge until phase 3 (receive step with withholding confirmation, slips, receipt viewer): receive(saleId) opens the
   same panel for the remainder of a saved sale (money only) and the payments list can cancel a receiving — without
   them a counter sale saved as "รอชำระ" could not be paid anywhere. */
(()=>{
 const S=window.PKG_SALE,SC=window.PKG_STOCK_CUT,M=document.getElementById('mSale');
 if(!S||!SC||!M||!window.pkgSalePay)return;
 const $i=id=>document.getElementById(id),W=SC.state,on=()=>S.on();
 const r2=v=>Math.round(n(v)*100)/100;
 const isCo=d=>{const cu=d&&d.custId?findCust(d.custId):null;return !!(cu&&cu.type==='company');};
 const mayAdj=()=>S.canAdjust(),mayRecv=()=>S.canRecv();
 const empSel=(id,val,none)=>`<select id="${id}"><option value="">${none}</option>${DB.emp.filter(e=>e.active!==false||e.id===val).map(e=>`<option value="${esc(e.id)}"${e.id===val?' selected':''}>${esc(e.name)}</option>`).join('')}</select>`;
 const LBL={wait:['รอชำระ','st-orange'],part:['ชำระบางส่วน','st-blue'],paid:['ชำระแล้ว','st-green'],credit:['เงินเชื่อ','st-blue'],cancel:['ยกเลิกแล้ว','st-red'],revised:['มีฉบับแก้ไข','st-grey']};
 const PMT={cash:'เงินสด',trans:'เงินโอน',card:'บัตร',check:'เช็ค'};
 /* ---------- state chip: 0 window title · 1 register 4.4 · 2 register 03 ---------- */
 function chip(c,mode){
  const st=S.stat(c),[t,cls]=LBL[st.k]||['',''],some=st.k==='credit'&&st.got+st.wht>0.005;
  if(mode===2)return st.k==='paid'?'<span class="pkg-q2-y">✓ ชำระแล้ว</span>':'<span class="pkg-q2-w">'+t+(some?' · ชำระบางส่วน':'')+'</span>';
  const tip=st.k==='cancel'?' title="'+esc(c.cancelReason||'')+'"':'';
  let h='<span class="stbtn '+cls+'"'+tip+'>'+t+(st.k==='cancel'&&mode===0?' · คืนสต๊อก':'')+(some?' · ชำระบางส่วน':'')+'</span>';
  if(mode===1&&(st.k==='part'||some))h+='<div class="pkg-sa-sub">ค้าง '+money(st.rem)+'</div>';
  if(mode===1&&st.k==='revised')h+='<div class="pkg-sa-sub" data-no-translate>ถูกแก้ไขเป็น '+esc(c.revisedTo||'')+'</div>';
  return h;
 }
 const nos=c=>{const L=S.led(c);return L?S.invAll(L).map(d=>d.no).concat((L.payments||[]).map(p=>p.reNo)).filter(Boolean):[];};
 /* ---------- warranty months on a stock line ---------- */
 function lineExtra(it,i,o){
  if(!it||it.type!=='part')return '';
  if(o.saved)return n(it.warr)>0?'<div class="hint pkg-sl-warr">ประกัน '+qf(it.warr)+' เดือน</div>':'';
  return '<div class="pkg-sl-warr"><span>ประกัน</span><input type="number" class="saWarr" data-i="'+i+'" value="'+(it.warr===''||it.warr==null?'':n(it.warr))+'" min="0" step="1" inputmode="numeric" aria-label="ประกัน (เดือน)"><span>เดือน</span></div>';
 }
 /* ---------- expected withholding ---------- */
 const whtAmt=(d,w)=>receiptTotals({pkgSale:1,items:(d.items||[]),disc:n(d.disc),vat:n(d.vat),adj:d.adj,whtExp:{rate:n(w&&w.rate),base:w&&w.base==='all'?'all':'labor'},payments:[],pay:{}}).whtExp;
 const whtText=w=>!w||!(n(w.rate)>0)?'ไม่หัก':n(w.rate)+'% '+(w.base==='all'?'ของยอดก่อน VAT ทั้งใบ':'เฉพาะค่าแรง');
 function whtHtml(d,o){
  const co=isCo(d);
  if(o.saved){const w=d.wht,a=w&&n(w.rate)>0?whtAmt(d,w):0;
   return `<fieldset class="pkg-fs pkg-sf-wht"><legend>หัก ณ ที่จ่าย (ที่คาดว่าลูกค้าจะหัก)</legend><p class="pkg-sf-line"><b>${whtText(w)}</b>${a>0?' · ประมาณ <b>'+money(a)+'</b> บาท':''}</p><p class="hint">ยอดที่หักจริงยืนยันตอนรับชำระ — ตัวเลขนี้ใช้แสดงในใบแจ้งหนี้เท่านั้น ไม่ลดยอดขาย</p></fieldset>`;}
  if(!d.wht||d.wht.auto||!co)d.wht=co&&d.wht&&!d.wht.auto?S.normWht(d.wht,d):S.whtDefault(d);
  const w=d.wht,a=n(w.rate)>0?whtAmt(d,w):0,t=SC.tot(d);
  return `<fieldset class="pkg-fs pkg-sf-wht"><legend>หัก ณ ที่จ่าย (ที่คาดว่าลูกค้าจะหัก)</legend>
   <div class="pkg-sf-rates" role="group" aria-label="อัตราหัก ณ ที่จ่าย">${[0,1,2,3,5].map(r=>`<button type="button" class="pkg-sf-rate${n(w.rate)===r?' on':''}" data-sp="wht" data-r="${r}" aria-pressed="${n(w.rate)===r}"${co?'':' disabled'}>${r?r+'%':'ไม่หัก'}</button>`).join('')}
    <label class="f"><span>คิดจาก</span><select id="spWhtBase"${co&&n(w.rate)>0?'':' disabled'}><option value="labor"${w.base!=='all'?' selected':''}>เฉพาะค่าแรง</option><option value="all"${w.base==='all'?' selected':''}>ยอดก่อน VAT ทั้งใบ</option></select></label></div>
   ${co?`<p class="pkg-sf-line">${a>0?'คาดว่าลูกค้าจะหัก <b>'+money(a)+'</b> บาท · คาดว่าได้รับเงิน <b>'+money(t.gross-a)+'</b> บาท':'ไม่หัก ณ ที่จ่าย — รับเงินเต็มยอด <b>'+money(t.gross)+'</b> บาท'}${w.auto?' <span class="hint">(ค่าเริ่มต้น: 3% เฉพาะค่าแรง เมื่อใบนี้มีค่าแรง)</span>':''}</p>`
    :`<p class="hint pkg-sf-lock">หัก ณ ที่จ่ายใช้กับลูกค้านิติบุคคลเท่านั้น — ลูกค้ารายนี้เป็น${d.custId?'บุคคลธรรมดา':'ลูกค้าทั่วไป'} จึงเป็น “ไม่หัก”</p>`}
   <p class="hint">ยอดที่หักจริงยืนยันตอนรับชำระ — ตัวเลขนี้ใช้แสดงในใบแจ้งหนี้เท่านั้น ไม่ลดยอดขาย</p></fieldset>`;
 }
 /* ---------- จัดการ: ปรับเพิ่ม / ลด + เหตุผล ---------- */
 const ADJ={type:'down',amt:'',reason:'',note:''};
 function adjHtml(d,o){
  const st=o.saved?S.stat(d):null,taxed=!!(o.saved&&S.taxOf(d)),open=o.saved?(['wait','part','credit'].includes(st.k)&&!!st.led&&!taxed):true,can=mayAdj(),list=d.adj||[];
  const rows=list.map((a,i)=>`<tr><td><span class="stbtn ${a.type==='up'?'st-green':'st-red'}">${a.type==='up'?'ปรับเพิ่ม':'ปรับลด'}</span></td><td class="num">${a.type==='up'?'+':'−'}${money(a.amt)}</td>
    <td data-no-translate>${esc(a.reason||'')}${a.note?' — '+esc(a.note):''}</td><td class="hint" data-no-translate>${a.byName?esc(String(a.byName).replace(/^.*· /,''))+' · '+(a.at?thDateTime(a.at):''):''}</td>
    <td class="ctr">${open&&can?`<button type="button" class="btn sm dgr" data-sp="adjdel" data-id="${esc(a.id||'')}" data-ix="${i}">ลบ</button>`:''}</td></tr>`).join('');
  const form=open&&can?`<div class="pkg-sf-adjform">
    <div class="pkg-sf-seg" role="group" aria-label="ประเภทการปรับ"><button type="button" class="${ADJ.type==='up'?'on':''}" data-sp="adjtype" data-t="up" aria-pressed="${ADJ.type==='up'}">ปรับเพิ่ม</button><button type="button" class="${ADJ.type==='down'?'on':''}" data-sp="adjtype" data-t="down" aria-pressed="${ADJ.type==='down'}">ปรับลด</button></div>
    <label class="f"><span>จำนวนเงิน (รวม VAT)</span><div class="pkg-unit"><input type="number" id="spAdjAmt" min="0" step="0.01" inputmode="decimal" value="${esc(ADJ.amt)}" placeholder="0.00"><em>บาท</em></div></label>
    <div class="f pkg-sf-why"><span>เหตุผล (จำเป็น)</span><div class="pkg-sf-picks">${S.ADJ_REASONS.map(r=>`<button type="button" class="pkg-sf-pick${ADJ.reason===r?' on':''}" data-sp="adjwhy" data-r="${esc(r)}" aria-pressed="${ADJ.reason===r}">${r}</button>`).join('')}</div></div>
    <label class="f pkg-sf-note"><span>หมายเหตุ${ADJ.reason==='อื่น ๆ'?' (จำเป็น)':''}</span><input type="text" id="spAdjNote" value="${esc(ADJ.note)}" placeholder="รายละเอียดเพิ่มเติม"></label>
    <button type="button" class="btn ${o.saved?'pri':'gh'}" data-sp="adjadd">${o.saved?'บันทึกการปรับยอด':'+ เพิ่มรายการปรับยอด'}</button></div>${BACK?'<div class="pkg-sf-back"><span>ยอดที่พิมพ์ไว้ในหน้ารับชำระยังอยู่</span><button type="button" class="btn grn" data-sp="backpay">กลับไปรับชำระ</button></div>':''}`
   :`<p class="hint">${!open?(taxed?S.TAX_LOCK:st&&st.k==='paid'?'ชำระครบแล้ว — ปรับยอดไม่ได้':'ใบนี้ปรับยอดไม่ได้แล้ว'):'บัญชีนี้ไม่มีสิทธิ์ปรับเพิ่ม / ลดยอดใบตัดสต็อก'}</p>`;
  return `<fieldset class="pkg-fs pkg-sf-adj"><legend>ปรับเพิ่ม / ลด</legend>
   <p class="hint">ใช้เมื่อยอดที่รับจริงต่างจากใบตัดสต็อกเล็กน้อย (เช่น ปัดเศษ ลูกค้าโอนขาด) — ใส่ได้จนกว่าจะชำระครบ ระบบบันทึกผู้ทำ เวลา และเหตุผลไว้</p>
   ${rows?`<div class="scroll"><table class="tbl pkg-sf-adjtbl"><thead><tr><th>ประเภท</th><th class="num">จำนวนเงิน</th><th>เหตุผล</th><th>ผู้บันทึก</th><th class="ctr"></th></tr></thead><tbody>${rows}</tbody></table></div>`:''}${form}</fieldset>`;
 }
 /* ---------- payments of a saved sale ---------- */
 function paysHtml(c){
  const st=S.stat(c),L=st.led;if(!L)return '';
  const rows=(L.payments||[]).map(p=>{const ms=(p.methods||[]).map(m=>PMT[m.k]||m.k).join(' + ')||PMT[p.method]||'ไม่ระบุวิธี';
   return `<tr${p.cancelled?' class="cancelrow"':''}><td class="ctr">${thDate(p.date)}${p.time?' '+esc(p.time):''}</td><td class="mono"${p.reNo?' data-no-translate':''}>${p.reNo?`<span class="docno" data-sp="rcpt" data-id="${esc(p.id)}" title="เปิดใบเสร็จรับเงิน">${p.cancelled?'<s>'+esc(p.reNo)+'</s>':esc(p.reNo)}</span>`:p.src==='legacy'?'<span class="hint">เอกสารเดิม</span>':p.cancelled?'-':`<span class="hint">ยังไม่ออกใบเสร็จ</span>${mayDoc()&&!c.cancelled?` <button type="button" class="btn sm pri" data-sp="rcptnew" data-id="${esc(p.id)}">สร้างใบเสร็จรับเงิน</button>`:''}`}</td><td class="num"><b>${money(p.amt)}</b>${p.wht&&n(p.wht.amt)>0&&!p.cancelled?'<div class="pkg-sa-sub">หัก ณ ที่จ่าย '+money(p.wht.amt)+(p.wht.got?' · ได้รับหนังสือรับรองแล้ว':p.wht.got===false?' · รอหนังสือรับรอง':'')+'</div>':''}</td>
    <td>${esc(ms)}</td><td data-no-translate>${esc(String(p.by||'').replace(/^.*· /,''))}</td>
    <td class="ctr">${p.cancelled?`<span class="hint" data-no-translate title="${esc(p.cancelReason||'')}">ยกเลิกแล้ว${p.cancelReason?' — '+esc(p.cancelReason):''}</span>`:(!c.cancelled&&mayCancelPay()?`<button type="button" class="btn sm dgr" data-sp="paycancel" data-id="${esc(p.id)}">ยกเลิกการรับชำระ</button>`:'')}</td></tr>`;}).join('');
  const canPay=['wait','part'].includes(st.k)&&mayRecv(),iv=S.invOf(L),adjs=(c.adj||[]);
  return `<fieldset class="pkg-fs pkg-sf-pays"><legend>การรับชำระของใบนี้</legend>
   <div class="pkg-sf-fig"><div><span>ยอดขาย</span><b>${money(st.total)}</b></div><div><span>รับแล้ว</span><b>${money(st.got)}</b></div>${st.wht>0?`<div><span>ลูกค้าหัก ณ ที่จ่าย</span><b>${money(st.wht)}</b></div>`:''}
    <div class="${st.rem>0.005?'due':'ok'}"><span>คงค้าง</span><b>${money(st.rem)}</b></div>
    ${canPay?'<button type="button" class="btn grn" data-sp="receive">รับชำระ</button>':''}</div>
   ${st.k==='credit'?`<div class="pkg-sf-credit"><span>เงินเชื่อ — ตัดชำระที่หน้าลูกหนี้เท่านั้น${n(c.credit&&c.credit.days)?' · เครดิต '+n(c.credit.days)+' วัน':''} · ครบกำหนด ${thDate((c.credit&&c.credit.due)||c.date)}</span>${mayRecv()&&c.custId?'<button type="button" class="btn gh" data-sp="tosettle">ไปหน้าตัดชำระลูกหนี้</button>':''}</div>`:''}
   ${iv?`<p class="hint">ใบแจ้งหนี้เลขที่ <span class="docno" data-sp="invopen" data-no-translate title="เปิดใบแจ้งหนี้">${esc(iv.no)}</span> · ${thDate(iv.date)}${S.invApv(iv)==='pending'?' · <span class="chip a">รออนุมัติ</span>':''}</p>`:(!S.invCan(c)&&mayDoc()?'<p class="hint">ยังไม่มีใบแจ้งหนี้ <button type="button" class="btn sm pri" data-sp="invnew">สร้างใบแจ้งหนี้</button></p>':'')}
   ${adjs.length?`<p class="hint" data-no-translate>${'ปรับเพิ่ม / ลด: '+adjs.map(a=>(a.type==='up'?'+':'−')+money(a.amt)+' '+esc(a.reason||'')).join(' · ')}</p>`:''}
   ${rows?`<div class="scroll"><table class="tbl pkg-sf-paytbl"><thead><tr><th class="ctr">วันที่รับเงิน</th><th>เลขที่ใบเสร็จ</th><th class="num">จำนวนเงิน</th><th>วิธีชำระ</th><th>ผู้รับเงิน</th><th class="ctr"></th></tr></thead><tbody>${rows}</tbody></table></div>`:'<p class="hint">ยังไม่มีการรับชำระ</p>'}</fieldset>`;
 }
 const mayCancelPay=()=>!curEmp()||!!can('m.rcptDoc_cancel'),mayDoc=()=>!curEmp()||!!can('m.rcptDoc_add');
 /* ---------- technicians of a repair job (default: the quote's technician) ---------- */
 function techHtml(d,o){
  if(!d.quoteId&&!d.tech1&&!d.tech2)return '';
  if(o.saved)return d.tech1||d.tech2?`<fieldset class="pkg-fs pkg-sf-tech"><legend>ช่างผู้รับผิดชอบ</legend><p class="pkg-sf-line">ช่างผู้ซ่อม: <b data-no-translate>${esc(empName(d.tech1,d.tech1Name)||'-')}</b>${d.tech2?' · ช่างผู้ช่วย: <b data-no-translate>'+esc(empName(d.tech2,d.tech2Name))+'</b>':''}</p></fieldset>`:'';
  if(d.tech1===undefined){const q=findQuote(d.quoteId),t=q&&(q.tech1||q.tech)||'';d.tech1=t;d.tech1Name=t?empName(t,''):'';d.tech2=(q&&q.tech2)||'';d.tech2Name=d.tech2?empName(d.tech2,''):'';}
  return `<fieldset class="pkg-fs pkg-sf-tech"><legend>ช่างผู้รับผิดชอบ</legend><div class="pkg-sa-g2"><label class="f"><span>ช่างผู้ซ่อม</span>${empSel('spTech1',d.tech1,'— ไม่ระบุช่างผู้ซ่อม —')}</label><label class="f"><span>ช่างผู้ช่วย</span>${empSel('spTech2',d.tech2,'— ไม่มีช่างผู้ช่วย —')}</label></div></fieldset>`;
 }
 /* ---------- ฉบับแก้ไข (phase 4): counter sales only ---------- */
 const mayCost=()=>!curEmp()||!!can('stock.cost');
 const chainOf=c=>{const base=c.baseNo||c.no;return SC.list().filter(x=>(x.baseNo||x.no)===base).sort((a,b)=>n(a.revN)-n(b.revN));};
 function revEntry(d){
  const ch=chainOf(d),vers=ch.length>1?`<p class="hint pkg-sf-vers">ฉบับของใบตัดสต็อกนี้: ${ch.map(x=>x.id===d.id?`<b data-no-translate>${esc(x.no)}</b>`:`<span class="docno" data-sp="openver" data-id="${esc(x.id)}" data-no-translate>${esc(x.no)}</span>`).join(' · ')}</p>`:'';
  if(d.cancelled)return vers;
  if(d.superseded)return `<p class="pkg-sf-oldver">ใบนี้ถูกแก้ไขเป็น <b data-no-translate>${esc(d.revisedTo||'')}</b> แล้ว — เอกสารนี้ปิดแล้ว ดูได้อย่างเดียว</p>${vers}`;
  if(d.quoteId)return `<p class="hint pkg-sf-revhint">งานจากใบเสนอราคา: ยกเลิกใบตัดสต็อกแล้วแก้ที่ใบเสนอราคา (ฉบับแก้ไข) จากนั้นตัดสต็อกใหม่</p>`;
  const P=S.revisePlan(d),ok=mayAdj()&&(!curEmp()||can('doc.editPrice'));
  return (ok?(P.ok?`<div class="pkg-sf-reventry"><button type="button" class="btn gh" data-sp="revise">ทำฉบับแก้ไข</button><span class="hint">แก้จำนวน ราคา หรือส่วนลดของใบตัดสต็อกนี้ — สต็อกขยับเฉพาะส่วนต่าง วันที่ขายไม่เปลี่ยน</span></div>`:`<p class="hint pkg-sf-revhint">${esc(P.error)}</p>`):'')+vers;
 }
 function startRevise(c){
  const P=S.revisePlan(c);if(!P.ok)return toast(P.error);
  if(!mayAdj()||!(!curEmp()||can('doc.editPrice')))return toast('บัญชีนี้ไม่มีสิทธิ์ทำฉบับแก้ไข');
  W.cur=null;W.S={id:'',no:'',date:c.date,channel:c.channel||'retail',wh:c.wh,custId:c.custId||'',vehIdx:c.vehIdx==null?-1:c.vehIdx,seller:c.seller||'',tier:c.tier||'B',items:JSON.parse(JSON.stringify(c.items||[])),disc:n(c.disc),vat:n(c.vat),
   note:c.note||'',remark:c.remark||'',ref:c.ref||'',quoteId:'',wht:c.wht?Object.assign({},c.wht):undefined,adj:JSON.parse(JSON.stringify(c.adj||[])),revOf:c.id};
  repaint();M.scrollTop=0;toast('แก้รายการ ราคา หรือส่วนลด แล้วกด “บันทึกฉบับแก้ไข”');
 }
 function revPreviewHtml(D){
  const c=SC.list().find(x=>x.id===D.revOf);if(!c)return '';const P=S.revisePlan(c,D);
  if(!P.ok)return `<p class="pkg-sf-oldver">${esc(P.error)}</p>`;
  const mv=P.moves.length?P.moves.map(m=>`<li class="${m.d>0?'out':'in'}"><span data-no-translate>${esc(m.code)} ${esc(m.name)}</span> — ${m.d>0?'ตัดสต็อกเพิ่ม':'คืนเข้าสต๊อก'} <b>${qf(Math.abs(m.d))}</b> ${esc(m.unit||'')}${m.short?' <em>(ของไม่พอ — จะถามยืนยัน)</em>':''}</li>`).join(''):'<li class="none">ไม่มีการเคลื่อนไหวสต๊อก (แก้เฉพาะราคา / ส่วนลด)</li>';
  const arrow=(a,b)=>money(a)+' → <b>'+money(b)+'</b>'+(Math.abs(b-a)>0.005?' <span class="'+(b>a?'up':'dn')+'">('+(b>a?'+':'−')+money(Math.abs(b-a))+')</span>':'');
  return `<div class="pkg-sf-prevgrid"><div><span>เลขที่ฉบับแก้ไข</span><b data-no-translate>${esc(P.no)}</b></div><div><span>ฉบับเดิม</span><b data-no-translate>${esc(P.from)}</b><small>จะถูกปิดอัตโนมัติ</small></div><div><span>วันที่ขาย</span><b>${thDate(c.date)}</b><small>ไม่เปลี่ยน — ยอดของวันนั้นถูกปรับตาม</small></div></div>
   <ul class="pkg-sf-moves">${mv}</ul>
   <p class="pkg-sf-line">ยอดขายรวม: ${arrow(P.oldTotal,P.newTotal)} บาท${mayCost()?' · <span class="sc-cost">กำไรขั้นต้น: '+arrow(P.oldBase-P.oldCost,P.newBase-P.newCost)+' บาท</span>':''}</p>
   ${P.same?'<p class="hint">ยังไม่ได้แก้ไขอะไร</p>':''}`;
 }
 const revPreview=()=>{const el=$i('spRevPrev'),D=W.S;if(el&&D&&D.revOf)el.innerHTML=revPreviewHtml(D);};
 async function saveRevise(){
  const D=W.S,c=D&&D.revOf?SC.list().find(x=>x.id===D.revOf):null;if(!c)return;
  const nw=await S.revise(c,D);if(!nw)return;
  W.S=null;W.cur=nw;repaint();toast('บันทึกฉบับแก้ไข '+nw.no+' แล้ว · ฉบับเดิม '+c.no+' ถูกปิด');return nw;
 }
 const cancelRevise=()=>{const D=W.S;if(!D||!D.revOf)return;const id=D.revOf;W.S=null;SC.open(id);};
 /* ---------- mount (called by paint) ---------- */
 let box=null,adjRow=null;
 function mount(d,o){
  document.documentElement.classList.toggle('pkg-sf-on',on());
  if(window.PKG_SALE_DOCS&&PKG_SALE_DOCS.printBox)PKG_SALE_DOCS.printBox(d,on()&&!!o.saved);   /* ใบแจ้งหนี้ (A4 / 80 มม.) · ใบเสร็จรับเงิน (A4) in the print box */
  const acts=$i('saActs'),host=acts&&acts.closest('fieldset');if(!host)return;
  if(!box){box=document.createElement('div');box.id='saFlow';box.className='pkg-sf-box';host.before(box);}
  if(!adjRow){adjRow=document.createElement('div');adjRow.id='saAdjRow';adjRow.innerHTML='<span>ปรับเพิ่ม / ลด</span><b></b>';const net=M.querySelector('.pkg-sa-sum .pkg-sa-net');if(net)net.before(adjRow);}
  const bill=$i('saBillBtn');
  if(!on()){box.hidden=true;box.innerHTML='';adjRow.hidden=true;if(bill)bill.classList.remove('pkg-sf-hide');railSave(null);return;}
  box.hidden=false;if(bill)bill.classList.add('pkg-sf-hide');     /* the receipt is made by receiving money, not from this button */
  const t=SC.tot(d),g=n(t.adjGross);adjRow.hidden=!g;adjRow.querySelector('b').textContent=(g>0?'+':g<0?'−':'')+money(Math.abs(g));
  if(o.saved){
   $i('saState').innerHTML=chip(d,0);
   const inFlow=!!S.led(d);
   box.innerHTML=inFlow?revEntry(d)+techHtml(d,o)+whtHtml(d,o)+(d.superseded?'':paysHtml(d)):'<p class="hint">ใบนี้ยังไม่อยู่ในระบบขายแบบใหม่ (มีเอกสารเดิมที่ต้องตรวจ)</p>';   /* phase 8: ปรับเพิ่ม / ลด is the "ปรับยอด" button of the 4.1 register (#mSaleAdj) */
   railSave(null);
   if(d.superseded){const cb=M.querySelector('#saTools [data-a="cancel"]');if(cb)cb.hidden=true;}
   const paid=acts.querySelector('.pkg-sa-paid');
   if(paid&&inFlow){const st=S.stat(d),cost=paid.querySelector('.sc-cost');paid.innerHTML='สถานะ: <b>'+(LBL[st.k]||[''])[0]+'</b>'+(st.k==='credit'&&d.credit&&d.credit.due?' · ครบกำหนด '+thDate(d.credit.due):'')+' '+(cost?cost.outerHTML:'');}
   return;}
  if(d.revOf){const c=SC.list().find(x=>x.id===d.revOf),P=c?S.revisePlan(c):{ok:false};
   $i('saTitle').textContent='ฉบับแก้ไขของ '+(c?c.no:'');if(P.ok)$i('saNo').value=P.no;$i('saDate').value=c?thDate(c.date)+' (วันที่ขายเดิม)':'';
   $i('saCustSearch').disabled=true;$i('saVeh').disabled=true;$i('saChannel').disabled=true;$i('saDocSearch').disabled=true;const wb=M.querySelector('[data-a="waiting"]');if(wb)wb.disabled=true;
   box.innerHTML=`<fieldset class="pkg-fs pkg-sf-rev"><legend>ผลของฉบับแก้ไข</legend><div id="spRevPrev">${revPreviewHtml(d)}</div></fieldset>`+whtHtml(d,o)+((d.adj||[]).length?'<p class="hint">รายการปรับเพิ่ม / ลดของฉบับเดิมยกมาทั้งหมด — แก้ได้ที่ปุ่ม “ปรับยอด” ในหน้ารายการ หลังบันทึกฉบับแก้ไข</p>':'');
   acts.innerHTML='<button type="button" class="btn gh" data-sp="revcancel">ยกเลิกการแก้ไข</button><button type="button" class="btn pri" data-sp="revsave">บันทึกฉบับแก้ไข</button>';
   railSave('revsave','บันทึกฉบับแก้ไข');return;}
  box.innerHTML=techHtml(d,o)+whtHtml(d,o)+((d.adj||[]).length?`<p class="hint pkg-sf-draftadj" data-no-translate>${'ปรับเพิ่ม / ลด: '+d.adj.map(a=>(a.type==='up'?'+':'−')+money(a.amt)+' '+esc(a.reason||'')).join(' · ')} <button type="button" class="btn sm gh" data-sp="adjopen">แก้ไข</button></p>`:'');
  acts.innerHTML='<button type="button" class="btn gh" data-a="new">+ สร้างข้อมูลใหม่</button><button type="button" class="btn pri" data-sp="wait">'+SAVE_LBL+'</button><button type="button" class="btn grn" data-a="pay">ชำระเงิน</button>';
  railSave('wait',SAVE_LBL);
 }
 /* the side rail's amber save: "บันทึก / รอรับชำระ" for a new document while the switch is on (it used to open the payment step) */
 const SAVE_LBL='บันทึก / รอรับชำระ';
 function railSave(act,label){
  const b=$i('saSideSave');if(!b)return;const l=b.querySelector('.pkg-rail-lbl');
  if(act){delete b.dataset.a;b.dataset.sp=act;b.title=label;b.setAttribute('aria-label',label);if(l)l.textContent=label;b.classList.add('pkg-sf-railsave');}
  else if(b.dataset.sp){delete b.dataset.sp;b.dataset.a='pay';if(l)l.textContent=(window.PKG_RAIL&&PKG_RAIL.LBL['s-save'])||'บันทึก';b.classList.remove('pkg-sf-railsave');}
 }
 const repaint=()=>{if(typeof window.pkgSaleRender==='function')window.pkgSaleRender();};
 const afterSave=doc=>{W.S=null;W.cur=doc;repaint();SC.done(doc);};
 /* ---------- บันทึกขาย · รอชำระ ---------- */
 async function saveWait(){
  const D=W.S;if(!D||!on()||D.revOf)return null;
  const doc=await S.saveSale(D,'wait');if(!doc)return null;afterSave(doc);return doc;
 }
 /* ---------- the receive step (phase 3): the R2 panel + money date, withholding confirmation, slips, "ปรับยอดที่ใบตัดสต็อก" ----------
    RC = what the step holds besides the panel's own state: {id (saved sale) | null (draft), date, time, wht:{rate,base,amt,got,gotDate,img}} */
 let RC=null,BACK=null,RCI=null;   /* RCI = the cut whose receive step was opened from "+ สร้างใบเสร็จรับเงิน" (4.3): the receipt is issued with the save */
 const panel=()=>$i('mSalePay'),PYS=()=>window.pkgSalePay.state;
 const target=()=>RC&&RC.id?SC.list().find(x=>x.id===RC.id):W.S;
 const dueBefore=()=>{const d=target();if(!d)return 0;return RC.id?S.stat(d).rem:SC.tot(d).gross;};
 const whtOn=()=>{const d=target();return !!(d&&isCo(d)&&!(RC.id&&S.stat(d).wht>0.005));};      /* juristic customer, and not confirmed on an earlier receiving */
 const whtNow=()=>RC&&whtOn()?Math.max(0,r2(RC.wht.amt)):0;
 const dueNow=()=>Math.max(0,r2(dueBefore()-whtNow()));
 const gotNow=()=>{const st=PYS();return r2(st.order.filter(k=>k!=='credit').reduce((a,k)=>a+(st.lines[k]||[]).reduce((x,l)=>x+n(l.amt),0),0));};
 const whtBaseAmt=(d,base)=>{const t=RC.id&&S.led(d)?receiptTotals(S.led(d)):SC.tot(d);return base==='all'?t.base:Math.min(n(t.labor),t.base);};
 function newRC(id){
  const d=id?SC.list().find(x=>x.id===id):W.S,w=(d&&d.wht)||{},rate=isCo(d)?n(w.rate):0,base=w.base==='all'?'all':'labor',now=new Date();
  RC={id:id||null,date:iso(),time:String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'),wht:{rate,base,amt:'',got:false,gotDate:iso(),img:null}};
  RC.wht.amt=rate>0?String(r2(whtBaseAmt(d,base)*rate/100)):'';
 }
 function stepExtra(){
  const d=target();if(!d||!RC)return '';const w=RC.wht,co=isCo(d),done=RC.id&&S.stat(d).wht>0.005;
  const wht=!co?`<p class="hint pkg-sf-lock" id="spWhtNone">ลูกค้าบุคคลธรรมดา — ไม่มีหัก ณ ที่จ่าย</p>`
   :done?`<p class="hint pkg-sf-lock">หัก ณ ที่จ่ายของใบนี้ยืนยันไว้แล้ว ${money(S.stat(d).wht)} บาท (ตอนรับชำระครั้งก่อน)</p>`
   :`<fieldset class="pkg-fs pkg-sf-whtc" id="spWhtBox"><legend>ลูกค้าหัก ณ ที่จ่าย (นิติบุคคล)</legend>
     <div class="pkg-pay-2"><label class="f"><span>อัตรา</span><select data-rc="rate">${[0,1,2,3,5].map(r=>`<option value="${r}"${n(w.rate)===r?' selected':''}>${r?r+'%':'ไม่หัก'}</option>`).join('')}</select></label>
      <label class="f"><span>คิดจาก</span><select data-rc="base"${n(w.rate)>0?'':' disabled'}><option value="labor"${w.base!=='all'?' selected':''}>เฉพาะค่าแรง</option><option value="all"${w.base==='all'?' selected':''}>ยอดก่อน VAT ทั้งใบ</option></select></label></div>
     <label class="f"><span>ยอดที่หักจริง</span><div class="pkg-amt"><input class="pkg-amtbig" data-rc="amt" inputmode="decimal" value="${esc(w.amt)}" placeholder="0.00"${n(w.rate)>0?'':' disabled'}><em>บาท</em></div></label>
     <div class="pkg-sf-cert"${n(w.rate)>0?'':' hidden'}><span>ได้รับหนังสือรับรอง (50 ทวิ) จากลูกค้าแล้วหรือยัง?</span>
      <div class="pkg-sf-certopts"><button type="button" class="${w.got?'on':''}" data-rcgot="1" aria-pressed="${!!w.got}">ได้รับแล้ว</button><button type="button" class="${w.got?'':'on'}" data-rcgot="0" aria-pressed="${!w.got}">ยังไม่ได้รับ — ตามทีหลัง</button></div>
      ${w.got?`<div class="pkg-pay-2"><label class="f"><span>วันที่ได้รับ</span><input type="date" data-rc="gotDate" value="${esc(w.gotDate||iso())}" max="${iso()}"></label>
       <div class="f"><span>รูปหนังสือรับรอง (ไม่บังคับ)</span><div class="pkg-sf-slip">${w.img?`<button type="button" class="pkg-sf-thumb" data-rcimg="view" title="ดูรูป"><img src="${w.img.url}" alt="รูปหนังสือรับรอง"></button><button type="button" class="btn sm gh" data-rcimg="del">เอารูปออก</button>`:'<button type="button" class="btn sm gh" data-rcimg="add">แนบรูป</button>'}</div></div></div>`:''}</div></fieldset>`;
  return `<div class="pkg-sf-step" id="spStep"><div class="pkg-pay-2"><label class="f"><span>วันที่รับเงิน</span><input type="date" data-rc="date" value="${esc(RC.date)}" max="${iso()}"></label><label class="f"><span>เวลา</span><input type="time" data-rc="time" value="${esc(RC.time)}"></label></div>
   ${wht}<p class="hint pkg-sf-payhint" id="spStepHint"></p>
   <div class="pkg-sf-fix" id="spFix" hidden><span id="spFixTxt"></span><button type="button" class="btn sm gh" data-rcfix="1">ปรับยอดที่ใบตัดสต็อก</button></div></div>`;
 }
 /* figures that follow typing — nothing is rebuilt */
 function stepUpdate(){
  const P=panel();if(!P||P.hidden||!RC||!$i('spStep'))return;
  const tb=P.querySelector('.pkg-r2tot b');if(tb)tb.textContent=money(dueNow());
  window.pkgSalePay.update();
  const got=gotNow(),due=dueNow(),diff=r2(due-got),w=whtNow(),h=$i('spStepHint'),fx=$i('spFix');
  if(h)h.textContent=(w>0?'ยอดขายที่ค้าง '+money(dueBefore())+' − หัก ณ ที่จ่าย '+money(w)+' = เงินที่ต้องรับ '+money(due)+' บาท':'')+(S.partialOk()?'':(w>0?' · ':'')+'ร้านตั้งค่าให้รับเต็มจำนวนเท่านั้น');
  if(fx){const small=got>0&&Math.abs(diff)>0.005;fx.hidden=!small||!mayAdj();if(small)$i('spFixTxt').textContent=diff>0?'รับน้อยกว่ายอดที่ต้องรับ '+money(diff)+' บาท — ถ้าไม่เก็บส่วนนี้แล้ว':'รับมากกว่ายอดที่ต้องรับ '+money(-diff)+' บาท — ถ้าเป็นค่าบริการเพิ่ม';}
 }
 /* a slip per transfer line (settle.js reads / shrinks the picture and shows it full screen) */
 const stepLine=(k,l,i)=>k!=='trans'?'':`<div class="f pkg-sf-slipf"><span>สลิปของรายการโอนนี้</span><div class="pkg-sf-slip">${l.slip?`<button type="button" class="pkg-sf-thumb" data-rcslip="view:${i}" title="ดูสลิป"><img src="${l.slip.url}" alt="สลิป"></button><button type="button" class="btn sm gh" data-rcslip="del:${i}">เอาสลิปออก</button>`:`<button type="button" class="btn sm gh" data-rcslip="add:${i}">แนบสลิป</button>`}</div></div>`;
 const file=document.createElement('input');file.type='file';file.accept='image/*';file.hidden=true;file.id='spSlipFile';M.append(file);
 let fileFor=null;
 function takeSlip(f,forWhat){
  const X=window.PKG_SETTLE;if(!f||!X||!X.shrink)return Promise.resolve();
  return X.shrink(f).then(pic=>putSlip(pic.url,pic.name,forWhat)).catch(()=>toast('เลือกไฟล์รูปภาพเท่านั้น (jpg / png)'));
 }
 function putSlip(url,name,forWhat){
  if(!RC)return;const pic={url,name:name||'สลิป'};
  if(forWhat==='wht')RC.wht.img=pic;else{const l=(PYS().lines.trans||[])[+forWhat];if(!l)return;l.slip=pic;}
  window.pkgSalePay.draw();stepUpdate();
 }
 file.addEventListener('change',()=>{const f=file.files[0],w=fileFor;file.value='';fileFor=null;if(f)takeSlip(f,w);});
 const viewPic=(pic,label)=>{const X=window.PKG_SETTLE;if(pic&&X&&X.viewer)X.viewer.open([{url:pic.url,name:pic.name,label}],0);};
 /* the panel's result → the draft of one payment record */
 function draftOf(pay,got){
  const rec=S.legacyPay(pay,got,{}),slips=[];
  (pay.transLines||[]).forEach((l,i)=>{if(l&&l.slip&&rec.transLines[i]){rec.transLines[i].slip=true;slips.push({url:l.slip.url,name:l.slip.name||'สลิป',line:i+1});}});
  const d={methods:rec.methods,transLines:rec.transLines,by:pay.by||'',note:pay.note||'',slips};
  if(RC){d.date=RC.date||iso();d.time=RC.time||'';const w=whtNow();
   if(w>0){const dd=target();d.wht={rate:n(RC.wht.rate),base:RC.wht.base,baseAmt:r2(whtBaseAmt(dd,RC.wht.base)),amt:w,got:!!RC.wht.got,gotDate:RC.wht.got?(RC.wht.gotDate||iso()):''};if(RC.wht.got&&RC.wht.img)d.whtDoc=RC.wht.img;}}
  return d;
 }
 const ctxBase=()=>({total:dueNow,partial:S.partialOk(),extra:stepExtra,lineExtra:stepLine,zeroOk:()=>whtNow()>0&&dueNow()<=0.005});
 /* ชำระเงิน on a draft: cut + first payment (or credit) in one save */
 function open(o){
  const D=W.S;if(!D)return;if(!on())return window.pkgSalePay.open();
  if(D.revOf)return toast('กำลังทำฉบับแก้ไข — กด “บันทึกฉบับแก้ไข”');
  if(!mayRecv())return toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ — ใช้ “บันทึก / รอรับชำระ” แล้วให้ผู้มีสิทธิรับชำระ');
  const keep=!!(o&&o.keep&&RC&&!RC.id);if(!keep)newRC(null);
  window.pkgSalePay.open(Object.assign(ctxBase(),{draft:true,keep,title:'ชำระเงิน',ok:'ตัดสต็อกและบันทึกรับชำระ',
   finish:async(pay,got,close)=>{
    let doc;
    if(pay.credit){close();doc=await S.saveSale(D,'credit',null,{credit:{days:n(pay.days),due:pay.due||''}});}
    else{const dr=draftOf(pay,got),er=S.payError(SC.tot(D).gross,dr,D);if(er)return toast(er);close();doc=await S.saveSale(D,'pay',dr);}
    if(doc){RC=null;BACK=null;afterSave(doc);}}}));
  if(panel())panel().classList.remove('pkg-sf-nocredit');stepUpdate();
 }
 /* รับชำระ on a saved sale */
 function receive(id,o){
  const c=SC.list().find(x=>x.id===id);if(!c||!on())return;
  const st=S.stat(c);if(st.led&&st.k==='credit')return toast(S.CREDIT_LOCK(c));
  if(!st.led||!['wait','part'].includes(st.k))return toast('ใบตัดสต็อก '+c.no+' รับชำระเพิ่มไม่ได้');
  if(!mayRecv())return toast('บัญชีนี้ไม่มีสิทธิบันทึกรับชำระ');const issue=!!(o&&o.issue)||(RCI===c.id&&!!(o&&o.keep));RCI=issue?c.id:null;
  if(!W.cur||W.cur.id!==c.id||!M.classList.contains('on'))SC.open(c.id);
  const keep=!!(o&&o.keep&&RC&&RC.id===c.id);if(!keep)newRC(c.id);
  window.pkgSalePay.open(Object.assign(ctxBase(),{doc:c,noCredit:true,keep,title:'รับชำระ',sub:c.no+' · ค้าง '+money(st.rem)+' บาท',ok:'บันทึกรับชำระ',
   finish:(pay,got,close)=>{const p=S.addPayment(c,draftOf(pay,got),{issue});if(!p)return;RC=null;BACK=null;RCI=null;close();repaint();
    toast('รับชำระ '+money(p.amt)+' บาท · '+(p.reNo?'ใบเสร็จ '+p.reNo:'ยังไม่ออกใบเสร็จ')+(S.stat(c).k==='paid'?' · ชำระครบแล้ว':' · คงค้าง '+money(S.stat(c).rem)+' บาท'));
    if(window.PKG_SALE_DOCS&&PKG_SALE_DOCS.redraw)PKG_SALE_DOCS.redraw();
    if(p.reNo&&window.PKG_SALE_DOCS)PKG_SALE_DOCS.openReceipt(c.id,p.id);else SC.done(c);}}));
  if(panel())panel().classList.add('pkg-sf-nocredit');stepUpdate();
 }
 /* "ปรับยอดที่ใบตัดสต็อก": leave the step with what was typed kept, the จัดการ form prefilled with the difference */
 function toAdjust(){
  const diff=r2(dueNow()-gotNow());if(Math.abs(diff)<=0.005)return;
  Object.assign(ADJ,{type:diff>0?'down':'up',amt:String(Math.abs(diff)),reason:'',note:''});BACK={id:RC.id};
  window.pkgSalePay.close();repaint();openAdj(RC.id||null);
  toast('ใส่เหตุผลของการปรับยอด แล้วกด “กลับไปรับชำระ”');
 }
 const backToPay=()=>{const b=BACK;if(!b)return;BACK=null;if($i('mSaleAdj').classList.contains('on'))closeModal('mSaleAdj');return b.id?receive(b.id,{keep:true}):open({keep:true});};
 /* ---------- ปรับยอด (phase 8): a small window opened from the "จัดการ" column of the 4.1 register (and from the receive step) ---------- */
 const AW=document.createElement('div');AW.className='modal';AW.id='mSaleAdj';
 AW.innerHTML=`<div class="sheet" style="max-width:680px"><div class="panel" style="margin-bottom:0"><header><h2 id="sjTitle">ปรับยอด</h2><span class="tag" id="sjState"></span></header><div class="body" id="sjBody"></div>
  <footer class="pkg-sr-foot"><button type="button" class="btn gh" onclick="closeModal('mSaleAdj')">ปิด</button></footer></div></div>`;
 (document.getElementById('pkg-app')||document.body).append(AW);
 let AJ=null;
 const adjDoc=()=>AJ?(AJ.id?SC.list().find(x=>x.id===AJ.id):W.S):null;
 const adjCan=c=>{if(!on()||!c||c.cancelled||c.superseded)return false;const st=S.stat(c);return !!st.led&&['wait','part','credit'].includes(st.k)&&!S.taxOf(c);};
 function paintAdj(){
  const d=adjDoc();if(!d)return;const saved=!!AJ.id,st=saved?S.stat(d):null,t=SC.tot(d);
  $i('sjTitle').textContent='ปรับยอด'+(saved?' · '+d.no:'');$i('sjState').innerHTML=saved?chip(d,0):'';
  $i('sjBody').innerHTML=`<div class="pkg-sf-fig"><div><span>ยอดขาย</span><b>${money(saved?st.total:t.gross)}</b></div>${saved?`<div><span>รับแล้ว</span><b>${money(st.got+st.wht)}</b></div><div class="${st.rem>0.005?'due':'ok'}"><span>คงค้าง</span><b>${money(st.rem)}</b></div>`:''}</div>`+adjHtml(d,{saved});
 }
 function openAdj(id){
  if(!on())return false;
  if(id){const c=SC.list().find(x=>x.id===id);if(!c||!S.led(c))return false;if(!mayAdj()){toast('บัญชีนี้ไม่มีสิทธิ์ปรับเพิ่ม / ลดยอดใบตัดสต็อก');return false;}AJ={id};}
  else{if(!W.S||W.cur)return false;AJ={draft:true};}
  if(!BACK)Object.assign(ADJ,{amt:'',reason:'',note:''});
  paintAdj();openModal('mSaleAdj');return true;
 }
 const rowActs=c=>adjCan(c)&&mayAdj()?`<button type="button" class="btn sm gh" data-sfadj="${esc(c.id)}" title="ปรับเพิ่ม / ลดยอดของใบตัดสต็อก">ปรับยอด</button>`:'';
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-sfadj]');if(b&&on())openAdj(b.dataset.sfadj);});
 AW.addEventListener('input',e=>{const t=e.target;if(t.id==='spAdjAmt')ADJ.amt=t.value;if(t.id==='spAdjNote')ADJ.note=t.value;});
 AW.addEventListener('click',e=>{const b=e.target.closest('[data-sp]');if(!b||!on()||!AJ)return;const d=adjDoc();if(!d)return;
  if(b.dataset.sp==='backpay')return backToPay();
  if(adjAct(b,AJ.id?d:null,AJ.id?null:d)){paintAdj();repaint();}});
 /* one add / delete / choose step of the adjust form; true = something to redraw */
 function adjAct(b,c,D){
  const a=b.dataset.sp;
  if(a==='adjtype'){ADJ.type=b.dataset.t;return true;}
  if(a==='adjwhy'){ADJ.reason=ADJ.reason===b.dataset.r?'':b.dataset.r;return true;}
  if(a==='adjadd'){
   const rec={type:ADJ.type,amt:r2(ADJ.amt),reason:ADJ.reason,note:String(ADJ.note||'').trim()};
   if(c){if(!S.adjust(c,rec))return false;}
   else if(D){if(!mayAdj()){toast('บัญชีนี้ไม่มีสิทธิ์ปรับเพิ่ม / ลดยอดใบตัดสต็อก');return false;}const g=SC.tot(D).gross,er=S.adjCheck(D,rec,g,g);if(er){toast(er);return false;}D.adj=(D.adj||[]).concat([rec]);}
   else return false;
   Object.assign(ADJ,{amt:'',reason:'',note:''});return true;}
  if(a==='adjdel'){if(c)return !!S.adjDel(c,b.dataset.id);if(D){D.adj=(D.adj||[]).filter((x,i)=>i!==+b.dataset.ix);return true;}}
  return false;
 }
 if(panel()){
  panel().addEventListener('input',e=>{const k=e.target.dataset.rc;if(k&&RC){if(k==='amt')RC.wht.amt=e.target.value;else if(k==='date'||k==='time')RC[k]=e.target.value;else if(k==='gotDate')RC.wht.gotDate=e.target.value;}
   if(RC&&window.pkgSalePay.ctx()&&window.pkgSalePay.ctx().extra===stepExtra)setTimeout(stepUpdate,0);});
  panel().addEventListener('change',e=>{const k=e.target.dataset.rc;if(!k||!RC)return;
   if(k==='rate'||k==='base'){RC.wht[k]=k==='rate'?n(e.target.value):e.target.value;const d=target();RC.wht.amt=n(RC.wht.rate)>0?String(r2(whtBaseAmt(d,RC.wht.base)*n(RC.wht.rate)/100)):'';window.pkgSalePay.draw();stepUpdate();}
   if(k==='date'&&RC.date>iso()){RC.date=iso();e.target.value=RC.date;toast('วันที่รับเงินเป็นวันล่วงหน้าไม่ได้');}});
  panel().addEventListener('click',e=>{
   if(!RC)return;const t=e.target;
   const g=t.closest('[data-rcgot]');if(g){RC.wht.got=g.dataset.rcgot==='1';if(RC.wht.got&&!RC.wht.gotDate)RC.wht.gotDate=iso();window.pkgSalePay.draw();return stepUpdate();}
   const im=t.closest('[data-rcimg]');if(im){const a=im.dataset.rcimg;if(a==='add'){fileFor='wht';file.click();}else if(a==='del'){RC.wht.img=null;window.pkgSalePay.draw();stepUpdate();}else viewPic(RC.wht.img,'หนังสือรับรองหัก ณ ที่จ่าย');return;}
   const sl=t.closest('[data-rcslip]');if(sl){const [a,i]=sl.dataset.rcslip.split(':'),l=(PYS().lines.trans||[])[+i];if(!l)return;
    if(a==='add'){fileFor=i;file.click();}else if(a==='del'){delete l.slip;window.pkgSalePay.draw();stepUpdate();}else viewPic(l.slip,'โอน '+(+i+1));return;}
   if(t.closest('[data-rcfix]'))return toAdjust();
   setTimeout(stepUpdate,0);});
 }
 /* ---------- window events ---------- */
 M.addEventListener('input',e=>{
  const D=W.S,t=e.target;
  if(t.id==='spAdjAmt')ADJ.amt=t.value;if(t.id==='spAdjNote')ADJ.note=t.value;
  if(D&&D.revOf&&!W.cur&&on())setTimeout(revPreview,0);
  if(D&&!W.cur&&t.classList.contains('saWarr')){const it=D.items[+t.dataset.i];if(it)it.warr=t.value===''?'':n(t.value);}
 });
 M.addEventListener('change',e=>{
  const D=W.S,t=e.target;if(!D||W.cur||!on())return;
  if(t.id==='spWhtBase'){D.wht=Object.assign({},D.wht,{base:t.value,auto:false});repaint();}
  if(t.id==='spTech1'){D.tech1=t.value;D.tech1Name=t.value?empName(t.value,''):'';}
  if(t.id==='spTech2'){D.tech2=t.value;D.tech2Name=t.value?empName(t.value,''):'';}
 });
 M.addEventListener('click',async e=>{
  const b=e.target.closest('[data-sp]');if(!b||!on())return;const a=b.dataset.sp,D=W.S,c=W.cur;
  if(a==='wait')return saveWait();
  if(a==='revise'&&c)return startRevise(c);
  if(a==='revsave')return saveRevise();
  if(a==='revcancel')return cancelRevise();
  if(a==='openver')return SC.open(b.dataset.id);
  if(a==='receive'&&c)return receive(c.id);
  if(a==='backpay')return backToPay();
  if(a==='rcpt'&&c&&window.PKG_SALE_DOCS)return PKG_SALE_DOCS.openReceipt(c.id,b.dataset.id);
  if(a==='rcptnew'&&c){const p=S.issueReceipt(c,b.dataset.id);if(p&&p.reNo){toast('สร้างใบเสร็จรับเงิน '+p.reNo+' แล้ว');repaint();if(window.PKG_SALE_DOCS&&PKG_SALE_DOCS.redraw)PKG_SALE_DOCS.redraw();}return;}
  if(a==='invnew'&&c&&window.PKG_SALE_DOCS)return PKG_SALE_DOCS.makeInvoice(c.id);
  if(a==='invopen'&&c&&window.PKG_SALE_DOCS)return PKG_SALE_DOCS.openInvoice(c.id);
  if(a==='tosettle'&&c){const L=S.led(c);return openPartPay('ar',c.custId,L&&L.id);}
  if(a==='adjopen'&&D&&!c)return openAdj(null);
  if(a==='wht'&&D&&!c){if(!isCo(D))return;D.wht={rate:n(b.dataset.r),base:(D.wht&&D.wht.base)||'labor',auto:false};return repaint();}
  if(['adjtype','adjwhy','adjadd','adjdel'].includes(a)){if(adjAct(b,c,c?null:D))repaint();return;}   /* (the form itself lives in #mSaleAdj now) */
  if(a==='paycancel'&&c){if(await S.cancelPayment(c,b.dataset.id))repaint();return;}
 });
 /* ---------- done pop-up ---------- */
 function done(c,D){
  const bill=D.querySelector('[data-d="bill"]');if(bill)bill.classList.toggle('pkg-sf-hide',on());
  const host=D.querySelector('.pkg-sa-done-btns');
  if(host&&!host.querySelector('[data-sf]')){const mk=(k,t)=>{const x=document.createElement('button');x.type='button';x.className='btn pkg-sa-teal';x.dataset.sf=k;x.textContent=t;x.hidden=true;return x;};
   const first=host.firstElementChild;[mk('invnew','สร้างใบแจ้งหนี้'),mk('rcptnew','สร้างใบเสร็จรับเงิน'),mk('taxnew','ออกใบกำกับภาษี')].forEach(x=>host.insertBefore(x,first));
   D.addEventListener('click',e=>{const k=e.target.closest('[data-sf]')?.dataset.sf,cc=SC.list().find(x=>x.id===D.dataset.id),DX=window.PKG_SALE_DOCS;if(!k||!cc||!on()||!DX)return;
    if(k==='invnew'){closeModal('mSaleDone');return DX.makeInvoice(cc.id);}
    if(k==='taxnew'){closeModal('mSaleDone');return DX.openTaxFor(cc.id);}
    if(k==='rcptnew'){let last=null;const nr=S.noReceipt(cc);nr.forEach(p=>{const r=S.issueReceipt(cc,p.id);if(r)last=r;});if(!last)return;
     toast('สร้างใบเสร็จรับเงิน '+nr.map(p=>p.reNo).filter(Boolean).join(', ')+' แล้ว');closeModal('mSaleDone');repaint();DX.redraw();return DX.openReceipt(cc.id,last.id);}});}
  const set=(k,show)=>{const x=host&&host.querySelector('[data-sf="'+k+'"]');if(x)x.hidden=!show;};
  if(!on()){['invnew','rcptnew','taxnew'].forEach(k=>set(k,false));return;}
  const st=S.stat(c),DX=window.PKG_SALE_DOCS;
  $i('sdNo').textContent='ใบตัดสต็อก '+c.no+' · '+(LBL[st.k]||[''])[0]+' · '+money(st.total)+' บาท'+(st.rem>0.005&&st.k!=='wait'&&st.k!=='credit'?' · ค้าง '+money(st.rem)+' บาท':'');
  set('invnew',mayDoc()&&!S.invCan(c));set('rcptnew',mayDoc()&&S.noReceipt(c).length>0);set('taxnew',!!(DX&&DX.taxCan&&DX.taxCan(c)));
 }
 /* ---------- register 4.4: the state filter follows the flow ---------- */
 const OPT=[['','ทุกสถานะ'],['due','รอชำระ / ชำระบางส่วน'],['wait','รอชำระ'],['part','ชำระบางส่วน'],['paid','ชำระแล้ว'],['credit','เงินเชื่อ'],['cancel','ยกเลิกแล้ว'],['revised','มีฉบับแก้ไข']];
 let optOld=null;
 function syncFilter(){
  const sel=$i('scutState');if(!sel)return;const now=sel.dataset.sf==='1';
  if(on()===now)return;
  if(on()){optOld=sel.innerHTML;sel.innerHTML=OPT.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');sel.dataset.sf='1';sel.value='';}
  else{if(optOld!=null)sel.innerHTML=optOld;delete sel.dataset.sf;sel.value='';}
 }
 if(typeof window.pkgRenderCuts==='function'){const o=window.pkgRenderCuts;window.pkgRenderCuts=function(){document.documentElement.classList.toggle('pkg-sf-on',on());try{syncFilter();}catch(e){}return o.apply(this,arguments);};}
 /* open() = "ชำระเงิน" of the draft in the window · receive(saleId) = "รับชำระ" of a saved sale (sale-flow.js sends the
    "ชำระเงิน" buttons of 08 ลูกหนี้ / home here for a sale that is not on credit, and keeps such sales out of the settle window) */
 const stLed=x=>x&&x.d&&x.d.pkgSale?x.d:null;
 function settleExtra(St,sel,where){
  if(!on()||!St||St.mode!=='ar')return '';
  const leds=(sel||[]).filter(stLed);
  if(where==='share'){if(St.share===undefined)St.share=true;
   return `<div class="pkg-sf-stshare" id="spStShare"${leds.length>1&&leds.length===sel.length?'':' hidden'}><span>ใบเสร็จของการรับชำระครั้งนี้</span>
    <label><input type="radio" name="spStShare" value="1"${St.share!==false?' checked':''}> ใบเสร็จใบเดียวรวมทุกบิล</label><label><input type="radio" name="spStShare" value="0"${St.share===false?' checked':''}> แยกใบเสร็จตามบิล</label></div>`;}
  St.wht=St.wht||{};
  /* phase 9d: ticking a juristic customer's bill fills in the withholding its cut expects (the staff may change it or
     clear it to 0); un-ticking clears it. The figures of this draw were computed before — draw once more. */
  if(whtAuto(St,sel)){const X=window.PKG_SETTLE;setTimeout(()=>{if(X&&X.state()===St){X.reload();X.render();}},0);}
  const rows=leds.filter(x=>isCo(x.d)&&!(receiptTotals(x.d).whtAmt>0.005)).map(x=>{const exp=r2(receiptTotals(x.d).whtExp),w=St.wht[x.id],zero=exp>0&&w&&!(n(w.amt)>0);
   return `<tr><td class="mono" data-no-translate>${esc(x.no)}</td><td class="r">${money(x.raw)}</td><td class="r"><input type="number" min="0" step="0.01" inputmode="decimal" data-stwht="${esc(x.id)}" value="${w?esc(w.amt):''}" placeholder="${exp>0?money(exp):'0.00'}" aria-label="หัก ณ ที่จ่ายของ ${esc(x.no)}">${exp>0&&(!w||Math.abs(n(w.amt)-exp)>0.005)?`<button type="button" class="btn sm gh" data-stwhtfill="${esc(x.id)}" data-v="${exp}">ใช้ ${money(exp)}</button>`:''}</td></tr>`
    +(zero?`<tr class="pkg-sf-whtzero"><td colspan="3" class="hint">ไม่ได้ใส่ยอดหัก ณ ที่จ่ายของบิลนี้ — ถ้าลูกค้าโอนมาหลังหักภาษีแล้ว บิลจะค้างอีก ${money(exp)} บาท</td></tr>`:'');}).join('');
  const wsum=r2(leds.reduce((a,x)=>a+n(St.wht[x.id]&&St.wht[x.id].amt),0)),ysum=r2((sel||[]).reduce((a,x)=>a+n(x.out),0));
  return `<div class="pkg-sf-stwht" id="spStWht"${rows?'':' hidden'}><div class="pkg-st-sec">ลูกค้าหัก ณ ที่จ่าย (นิติบุคคล)</div>
   <table class="pkg-st-tbl"><thead><tr><th>ใบตัดสต็อก</th><th class="r">คงค้าง</th><th class="r">ยอดที่หักจริง (บาท)</th></tr></thead><tbody>${rows}</tbody></table>
   ${wsum>0?`<p class="pkg-sf-line pkg-sf-whtsum" data-whtsum="1">ลูกค้าหัก ณ ที่จ่าย รวม <b>฿${money(wsum)}</b> — ยอดที่ลูกค้าควรโอน <b>฿${money(ysum)}</b></p>`:''}
   <div class="pkg-sf-cert"><span>ได้รับหนังสือรับรอง (50 ทวิ) จากลูกค้าแล้วหรือยัง?</span><div class="pkg-sf-certopts"><button type="button" class="${St.whtGot?'on':''}" data-stgot="1" aria-pressed="${!!St.whtGot}">ได้รับแล้ว</button><button type="button" class="${St.whtGot?'':'on'}" data-stgot="0" aria-pressed="${!St.whtGot}">ยังไม่ได้รับ — ตามทีหลัง</button></div></div>
   <p class="hint">ยอดที่หักไม่ใช่เงินที่รับ — ระบบลดยอดคงค้างของบิลนั้นให้ · ใส่ยอดหักพร้อมกับเงินที่รับของบิลนั้นในครั้งเดียวกัน</p></div>`;
 }
 function whtAuto(St,sel){
  St.wht=St.wht||{};let ch=false;const ids=new Set((sel||[]).map(x=>x.id));
  Object.keys(St.wht).forEach(id=>{if(!ids.has(id)){delete St.wht[id];ch=true;}});
  (sel||[]).filter(stLed).forEach(x=>{if(St.wht[x.id]!==undefined)return;const t=receiptTotals(x.d);if(!isCo(x.d)||t.whtAmt>0.005)return;
   const exp=r2(t.whtExp);if(exp>0&&exp<x.raw-0.005){St.wht[x.id]={amt:exp,auto:true};ch=true;}});
  return ch;
 }
 /* what settle.js adds to the payment record it pushes onto a sale's ledger record */
 function settleFields(St,x,done){
  const o={},w=St.wht&&St.wht[x.id];
  if(St.share!==false&&done.length>1&&done.every(stLed))o.reShare=true;
  if(w&&n(w.amt)>0){const t=receiptTotals(x.d),e=x.d.whtExp||{};o.wht={rate:n(e.rate),base:e.base==='all'?'all':'labor',baseAmt:r2(e.base==='all'?t.base:Math.min(n(t.labor),t.base)),amt:r2(w.amt),got:!!St.whtGot,gotDate:St.whtGot?iso():'',img:false};}
  return o;
 }
 {const root=$i('pkgSt'),X=()=>window.PKG_SETTLE;
  const again=()=>{const St=X()&&X().state();if(!St||!on())return;['wht','share'].forEach(k=>{const el=$i(k==='wht'?'spStWht':'spStShare');if(el)el.outerHTML=settleExtra(St,X().selList(),k);});};
  const setW=(id,v)=>{const St=X().state(),b=X().selList().find(x=>x.id===id);if(!b)return;St.wht=St.wht||{};let a=Math.max(0,r2(v));
   if(a>b.raw-0.01){a=Math.max(0,r2(b.raw-0.01));toast('ยอดหัก ณ ที่จ่ายต้องน้อยกว่ายอดคงค้างของบิล — ใส่พร้อมกับเงินที่รับของบิลนั้น');}
   St.wht[id]={amt:a};X().reload();X().render();};   /* 0 is kept: "the customer did not withhold" (it is not filled in again) */
  if(root){
   const sumLine=()=>{try{const box=root.querySelector('.pkg-st-obox'),src=root.querySelector('[data-whtsum]'),old=root.querySelector('#spStWhtTop');
     if(!box||!on()||!src){if(old)old.remove();return;}
     if(old&&old.innerHTML===src.innerHTML)return;if(old)old.remove();const p=document.createElement('p');p.id='spStWhtTop';p.className='pkg-sf-line pkg-sf-whtsum';p.innerHTML=src.innerHTML;box.after(p);}catch(e){}};
   new MutationObserver(()=>sumLine()).observe(root,{childList:true,subtree:true});
   root.addEventListener('change',e=>{const t=e.target;if(!X()||!on())return;
    if(t.name==='spStShare'){X().state().share=t.value==='1';return;}
    if(t.dataset.stwht)return setW(t.dataset.stwht,t.value);
    setTimeout(again,0);});
   root.addEventListener('click',e=>{if(!X()||!on())return;const t=e.target;
    const f=t.closest('[data-stwhtfill]');if(f)return setW(f.dataset.stwhtfill,f.dataset.v);
    const g=t.closest('[data-stgot]');if(g){X().state().whtGot=g.dataset.stgot==='1';return again();}
    setTimeout(again,0);});}}
 /* rows the sale's own prints add in the new flow (stock-cut.js printSlip / printDoc) */
 function printExtra(c,kind){
  const t=SC.tot(c),g=n(t.adjGross),L=S.led(c),st=L?S.stat(c):null,ps=L?(L.payments||[]).filter(p=>!p.cancelled):[];
  const adjTxt=(g>0?'+':'−')+money(Math.abs(g));
  if(kind==='slipadj')return g?`<tr><td style="border:0">ปรับเพิ่ม / ลด</td><td style="border:0;text-align:right">${adjTxt}</td></tr>`:'';
  if(kind==='docadj')return g?`<tr><td colspan="5" style="text-align:right">ปรับเพิ่ม / ลด (รวม VAT)</td><td style="text-align:right">${adjTxt}</td></tr>`:'';
  if(!L)return '';
  const name=p=>(p.methods||[]).map(m=>PMT[m.k]||m.k).join(' + ')||PMT[p.method]||'รับชำระ';
  if(kind==='slippay')return ps.map(p=>`<tr><td style="border:0">${esc(name(p))} · ${thDate(p.date)}${p.reNo?'<br>'+esc(p.reNo):''}</td><td style="border:0;text-align:right">${money(p.amt)}</td></tr>`).join('')
   +(st.wht>0?`<tr><td style="border:0">ลูกค้าหัก ณ ที่จ่าย</td><td style="border:0;text-align:right">${money(st.wht)}</td></tr>`:'')
   +`<tr><td style="border:0"><b>${st.rem>0.005?'ค้างชำระ':'ชำระครบแล้ว'}</b></td><td style="border:0;text-align:right"><b>${st.rem>0.005?money(st.rem):''}</b></td></tr>`;
  if(kind==='docpay')return (LBL[st.k]||[''])[0]+(ps.length?' — '+ps.map(p=>esc(name(p))+' '+money(p.amt)+' ('+thDate(p.date)+(p.reNo?' · '+esc(p.reNo):'')+')').join(' · '):'')+(st.wht>0?' · ลูกค้าหัก ณ ที่จ่าย '+money(st.wht):'')+(st.rem>0.005?' · คงค้าง '+money(st.rem)+' บาท':'');
  return '';
 }
 window.PKG_SALE_PAY={printExtra,mount,lineExtra,chip,nos,done,saveWait,receive,open,openAdj,rowActs,adjCan,paintAdj,railSave,syncFilter,adjForm:ADJ,settleExtra,settleFields,startRevise,saveRevise,cancelRevise,revPreview,step:()=>RC,stepUpdate,putSlip,takeSlip,backToPay,toAdjust};
})();
