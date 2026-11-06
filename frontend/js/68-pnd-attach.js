/* DriveGo new system (owner's request of 2026-11-06 — the return and its attachment, the payee's branch left blank, the
   buttons on the tax report): ภ.ง.ด.3 / ภ.ง.ด.53 of a month on the Revenue Department's forms, printed from
   08 บัญชี → รายงานภาษี, "พิมพ์ ภ.ง.ด.3 + ใบแนบ" / "พิมพ์ ภ.ง.ด.53 + ใบแนบ" (shown when the month has that form).
   · The return (ใบหน้าแบบ, A4 portrait, laid out as the form ภ.ง.ด.3 of มี.ค. 2560): the payer's tax id and branch, name
     and address; the month ticked and its year; "ใบแนบ … ที่แนบมาพร้อมนี้" ticked with how many ราย (ลำดับที่) and แผ่น;
     the summary 1. income paid and 2. tax withheld (3. เงินเพิ่ม and 4. left blank: they depend on the day it is filed);
     นำส่งภาษีตาม (1) มาตรา 3 เตรส ticked (the 50 ทวิ's item 5, 52.js); ยื่นปกติ / ยื่นเพิ่มเติม, the signature and the
     dates left blank, written by hand.
   · The attachment (ใบแนบ, A4 landscape, the form of มี.ค. 2560): 6 ลำดับที่ a sheet, numbered on from sheet to sheet;
     one ลำดับที่ per payment, in the order and with the numbers of the tax report and the 50 ทวิ (52.js
     PKG_WHT_OUT.month: by the day paid, then the document number); its first line: the day paid, the income type
     (as the 50 ทวิ prints it), the rate, the amount paid, the tax, เงื่อนไข 1 (หัก ณ ที่จ่าย); the payee's tax id in
     boxes, สาขาที่ blank (owner's answer), the name (ภ.ง.ด.3: ชื่อ / ชื่อสกุล split at the last space) and the address
     (the vendor's from the register, else blank lines); each sheet's totals; แผ่นที่ … ในจำนวน … แผ่น.
   · The payer's สาขาที่: สำนักงานใหญ่ = 00000, else the 5 digits in DB.shop.branch, else blank.
   The PDF is named ภ.ง.ด.3_<yyyy-mm> (data-pdf-name, 63-pdf-name.js). To be checked by the shop's accountant. */
(function(){
 const WO=window.PKG_WHT_OUT;
 if(!WO||typeof renderTax!=='function'||typeof printDocs!=='function')return;
 const $i=id=>document.getElementById(id);
 const PER=6;
 const MONTHS=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
 const FORM={
  '3':{title:['แบบยื่นรายการภาษีเงินได้หัก ณ ที่จ่าย','ตามมาตรา 59 แห่งประมวลรัษฎากร',
    'สำหรับการหักภาษี ณ ที่จ่ายตามมาตรา 3 เตรส และมาตรา 50 (3) (4) (5)',
    'กรณีการจ่ายเงินได้พึงประเมินตามมาตรา 40 (5) (6) (7) (8) และเสียภาษีตามมาตรา 48 ทวิ แห่งประมวลรัษฎากร'],
   law:['(1) มาตรา 3 เตรส','(2) มาตรา 48 ทวิ','(3) มาตรา 50 (3) (4) (5)'],
   income:'❶ ประเภทเงินได้<div class="pnd-i">(ถ้ามากกว่าหนึ่งประเภทให้กรอกเรียงลงไป)</div>',
   paid:'จำนวนเงินที่จ่ายแต่ละประเภท เฉพาะคนหนึ่งๆ ในครั้งนี้',tax:'รวมเงินภาษีที่หักและนำส่งในครั้งนี้<div>จำนวนเงิน</div>',
   seqNote:'(ให้กรอกลำดับที่ต่อเนื่องกันไปทุกแผ่นตามเงินได้แต่ละประเภท)',
   note1:'ให้ระบุว่าจ่ายเป็นค่าอะไร เช่น ค่าเช่าอาคาร ค่าสอบบัญชี ค่าทนายความ ค่าวิชาชีพของแพทย์ ค่าก่อสร้าง รางวัล ส่วนลดหรือประโยชน์ใดๆ เนื่องจากการส่งเสริมการขาย รางวัลในการประกวด การแข่งขัน การชิงโชค ค่าจ้างแสดงภาพยนตร์ ร้องเพลงดนตรี ค่าจ้างทำของ ค่าจ้างโฆษณา ค่าขนส่งสินค้า ฯลฯ',
   note2:['เงื่อนไขการหักภาษีให้กรอกดังนี้','หัก ณ ที่จ่าย กรอก 1','ออกให้ตลอดไป กรอก 2','ออกให้ครั้งเดียว กรอก 3']},
  '53':{title:['แบบยื่นรายการภาษีเงินได้หัก ณ ที่จ่าย','ตามมาตรา 3 เตรส และมาตรา 69 ทวิ','และการเสียภาษีตามมาตรา 65 จัตวา แห่งประมวลรัษฎากร'],
   law:['(1) มาตรา 3 เตรส','(2) มาตรา 65 จัตวา','(3) มาตรา 69 ทวิ'],
   income:'❶ ประเภทเงินได้พึงประเมินที่จ่าย',paid:'จำนวนเงินที่จ่ายในครั้งนี้',tax:'จำนวนเงินภาษีที่หักและนำส่งในครั้งนี้',
   seqNote:'(ให้กรอกลำดับที่ต่อเนื่องกันไปทุกแผ่น)',
   note1:'ให้ระบุว่าจ่ายเป็นค่าอะไร เช่น ค่านายหน้า ค่าแห่งกู๊ดวิลล์ ดอกเบี้ยเงินฝาก ดอกเบี้ยตั๋วเงิน เงินปันผล เงินส่วนแบ่งกำไร ค่าเช่าอาคาร ค่าสอบบัญชี ค่าออกแบบ ค่าก่อสร้างโรงเรียน ค่าซื้อเครื่องพิมพ์ดีด ค่าซื้อพืชผลทางการเกษตร (ยางพารา มันสำปะหลัง ปอ ข้าว ฯลฯ) ค่าจ้างทำของ ค่าจ้างโฆษณา รางวัล ส่วนลดหรือประโยชน์ใดๆ เนื่องจากการส่งเสริมการขาย รางวัลในการประกวด การแข่งขัน การชิงโชค ค่าขนส่งสินค้า ค่าเบี้ยประกันวินาศภัย',
   note2:['เงื่อนไขการหักภาษี ณ ที่จ่ายให้กรอกดังนี้','หัก ณ ที่จ่าย กรอก 1','ออกภาษีให้ กรอก 2']}};

 /* ---------- print styles: at the end of the page, after every stylesheet (Chromium takes the A4 portrait @page of
    02.css over the named landscape page otherwise) ---------- */
 const css=document.createElement('style');css.id='pndStyle';
 css.textContent=`@page pndland{size:A4 landscape;margin:6mm}
.sheetpage.pnd{font-size:10px;line-height:1.3}
.sheetpage.pnd-a{width:297mm}
@media print{.sheetpage.pnd-a{page:pndland;width:auto;padding:3mm 5mm}.sheetpage.pnd-r{padding:6mm 8mm}}
.pnd .bx{display:inline-flex;border:1px solid #000;vertical-align:middle;background:#fff}
.pnd .bx i{font-style:normal;width:4.3mm;height:4.8mm;line-height:4.8mm;text-align:center;font-size:11px;font-weight:600;font-family:'Sarabun',sans-serif}
.pnd .bx i+i{border-left:1px dotted #777}
.pnd .bd{margin:0 1px}
.pnd .tk{display:inline-block;width:3.6mm;height:3.6mm;border:1px solid #000;text-align:center;line-height:3.4mm;font-size:11px;vertical-align:-0.5mm;margin-right:1.2mm}
.pnd .dl{display:inline-block;border-bottom:1px dotted #000;min-width:12mm;padding:0 1mm;min-height:3.8mm;vertical-align:bottom}
.pnd .pnd-i{font-style:italic;font-weight:400;font-size:8.6px}
.pnd table.pnd-t{width:100%;border-collapse:collapse;margin-top:1.5mm;table-layout:fixed}
.pnd table.pnd-t th,.pnd table.pnd-t td{border:1px solid #333;padding:.6mm 1mm;font-size:9.4px;vertical-align:middle}
.pnd table.pnd-t th{background:#fff;font-weight:600;text-align:center;line-height:1.2}
.pnd table.pnd-t td{height:7mm}
.pnd table.pnd-t td.c{text-align:center}
.pnd table.pnd-t td.n{text-align:right;font-family:'Sarabun',sans-serif;white-space:nowrap}
.pnd table.pnd-t td.who{vertical-align:top;font-size:9.4px;line-height:1.55}
.pnd table.pnd-t tr.ln td:not([rowspan]){border-top:1px dotted #999}
.pnd table.pnd-t tr.blk td{border-top:1.4px solid #000}
.pnd table.pnd-t tr.tot td{border-top:1.4px solid #000;font-weight:600;height:6mm}
.pnd .who .dl.in{display:inline;min-width:0;padding:0}
.pnd .pnd-top{display:flex;align-items:flex-end;gap:3mm;flex-wrap:wrap}
.pnd .pnd-big{font-size:21px;font-weight:700;letter-spacing:.4px;margin-right:2mm}
.pnd .pnd-foot{display:flex;border:1px solid #333;border-top:0}
.pnd .pnd-foot>div{padding:1.2mm 2mm}
.pnd .pnd-foot .l{flex:1.45;border-right:1px solid #333;font-size:9px;line-height:1.4}
.pnd .pnd-foot .r{flex:1;display:flex;align-items:center;gap:4mm;font-size:10px;line-height:2}
.pnd .seal{flex:none;width:17mm;height:17mm;border:1px solid #333;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;font-size:8px;line-height:1.25}
.pnd .sq{display:inline-block;width:2.2mm;height:2.2mm;background:#000;margin:0 1.5mm 0 3mm;vertical-align:0}
.pnd-r .pnd-hd{display:flex;align-items:center;gap:4mm;border:1px solid #333;border-radius:2mm;padding:2mm 3mm}
.pnd-r .pnd-hd .t{flex:1;text-align:center;line-height:1.45}
.pnd-r .pnd-hd .t b{font-size:14px}
.pnd-r .pnd-name{border:2px solid #000;border-radius:2mm;font-size:26px;font-weight:700;padding:1mm 4mm;flex:none}
.pnd-r .pnd-box{border:1px solid #333;padding:2mm 3mm;margin-top:2.5mm;line-height:2}
.pnd-r .pnd-two{display:flex;gap:0}
.pnd-r .pnd-two>.pnd-box:first-child{flex:1.05;border-right:0}
.pnd-r .pnd-two>.pnd-box:last-child{flex:1}
.pnd-r .pnd-two>.pnd-box{min-width:0}
.pnd-r .mo{display:grid;grid-template-columns:repeat(4,auto);justify-content:space-between;gap:.5mm 1mm;font-size:9px;line-height:1.9;white-space:nowrap}
.pnd-r table.pnd-s{width:100%;border-collapse:collapse;margin-top:2mm}
.pnd-r table.pnd-s td,.pnd-r table.pnd-s th{border:1px solid #333;padding:1mm 2mm;font-size:10.5px}
.pnd-r table.pnd-s td.n{text-align:right;width:42mm;font-family:'Sarabun',sans-serif}
.pnd-r .pnd-sign{text-align:center;line-height:2.3;margin-top:3mm;position:relative}
.pnd-r .pnd-sign .seal{position:absolute;right:12mm;top:9mm}`;
 document.body.appendChild(css);

 /* ---------- pieces ---------- */
 const digits=s=>String(s||'').replace(/\D/g,'');
 function boxes(d,groups){let k=0;return groups.map(g=>'<span class="bx">'+Array.from({length:g},()=>'<i>'+(d[k++]||'')+'</i>').join('')+'</span>').join('<span class="bd">-</span>');}
 const tin=t=>{const d=digits(t);return boxes(d.length===13?d:'',[1,4,5,2,1]);};
 const branchBoxes=b=>boxes(b||'',[5]);
 const tick=on=>'<span class="tk">'+(on?'✓':'')+'</span>';
 const line=(v,w)=>'<span class="dl"'+(w?' style="min-width:'+w+'mm"':'')+'>'+(v?esc(v):'')+'</span>';
 /* an address runs on after "ที่อยู่" and wraps as text; a blank one is a dotted line */
 const addrLn=(v,w)=>v?'<span class="dl in">'+esc(v)+'</span>':line('',w);
 function payerBranch(){const b=String((DB.shop||{}).branch||'').trim();if(!b)return '';if(/สำนักงานใหญ่/.test(b))return '00000';
  const m=b.match(/\d{1,5}/);return m?m[0].padStart(5,'0'):'';}
 const payerName=()=>typeof orgName==='function'?orgName():((DB.shop||{}).name||'');
 const payerAddr=()=>{const a=(DB.shop||{}).addr;return a?(typeof a==='string'?a.trim():addrLine(a)):'';};
 const addrText=a=>!a?'':typeof a==='string'?a.trim():(addrLine(a)==='-'?'':addrLine(a));
 /* ภ.ง.ด.3: ชื่อ / ชื่อสกุล — split at the last space as typed */
 function split(name){const s=String(name||'').trim().replace(/\s+/g,' '),i=s.lastIndexOf(' ');return i>0?[s.slice(0,i),s.slice(i+1)]:[s,''];}
 const sheetsOf=rows=>Math.max(1,Math.ceil(rows.length/PER));
 const sum=(rows,k)=>rows.reduce((a,v)=>a+n(v[k]),0);

 /* ---------- the attachment: one sheet of six ---------- */
 function attachSheet(form,rows,no,of){
  const F=FORM[form],p3=form==='3';
  const cols=p3?[11,104,21,42,11,30,28,12]:[11,82,25,21,38,11,30,28,12];
  const head=p3
   ?`<tr><th rowspan="2">ลำดับที่</th><th rowspan="2" style="text-align:left;padding:0">
      <div style="display:flex;border-bottom:1px solid #333"><div style="flex:1;padding:.6mm 1mm">เลขประจำตัวผู้เสียภาษีอากร <span class="pnd-i">(ของผู้มีเงินได้)</span></div><div style="width:24mm;border-left:1px solid #333;padding:.6mm 1mm;text-align:center">สาขาที่</div></div>
      <div style="padding:.6mm 1mm;border-bottom:1px solid #333;text-align:center">ชื่อผู้มีเงินได้ <span class="pnd-i">(ให้ระบุให้ชัดเจนว่าเป็น นาย นาง นางสาว หรือยศ)</span></div>
      <div style="padding:.6mm 1mm;text-align:center">ที่อยู่ของผู้มีเงินได้ <span class="pnd-i">(ให้ระบุเลขที่ ตรอก/ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</span></div></th>
     <th colspan="4">รายละเอียดเกี่ยวกับการจ่ายเงิน</th><th>รวมเงินภาษีที่หักและนำส่งในครั้งนี้</th><th rowspan="2">❷ เงื่อนไข</th></tr>
     <tr><th>วัน เดือน ปี ที่จ่าย</th><th>${F.income}</th><th>อัตราภาษีร้อยละ</th><th>${F.paid}</th><th>จำนวนเงิน</th></tr>`
   :`<tr><th rowspan="2">ลำดับที่</th><th>เลขประจำตัวผู้เสียภาษีอากร <span class="pnd-i">(ของผู้มีเงินได้)</span></th><th rowspan="2">สาขาที่</th>
      <th colspan="4">รายละเอียดเกี่ยวกับการจ่ายเงิน</th><th rowspan="2">${F.tax}</th><th rowspan="2">❷ เงื่อนไข</th></tr>
     <tr><th>ชื่อและที่อยู่ของผู้มีเงินได้<div class="pnd-i">(ให้ระบุให้ชัดเจนว่าเป็น บริษัทจำกัด ห้างหุ้นส่วนจำกัด หรือห้างหุ้นส่วนสามัญนิติบุคคล และให้ระบุเลขที่ ตรอก/ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด)</div></th>
      <th>วัน เดือน ปี ที่จ่าย</th><th>${F.income}</th><th>อัตราภาษีร้อยละ</th><th>${F.paid}</th></tr>`;
  const blocks=Array.from({length:PER},(_,i)=>{
   const v=rows[i]||null,P=v?WO.party(v):{tax:'',addr:null},addr=v?addrText(P.addr):'';
   const who=p3
    ?(()=>{const [a,b]=split(v&&v.payee);return `<div style="display:flex;justify-content:space-between;align-items:center">${tin(P.tax)}<span style="margin-right:2mm">${branchBoxes('')}</span></div>
      <div>ชื่อ ${line(a,40)} ชื่อสกุล ${line(b,40)}</div><div>ที่อยู่ ${addrLn(addr,88)}</div>`;})()
    :`<div>${tin(P.tax)}</div><div>ชื่อ ${line(v&&v.payee,74)}</div><div>ที่อยู่ ${addrLn(addr,71)}</div>`;
   const first=v?`<td class="c">${thDate(v.date)}</td><td>${esc(WO.income(v))}</td><td class="c">${v.rate}</td><td class="n">${money(v.base)}</td><td class="n">${money(v.amt)}</td><td class="c">1</td>`
    :'<td></td><td></td><td></td><td></td><td></td><td></td>';
   return `<tr class="blk"><td class="c" rowspan="3">${v?v.seq:''}</td><td class="who" rowspan="3">${who}</td>${p3?'':`<td class="c" rowspan="3" style="vertical-align:top">${branchBoxes('')}</td>`}${first}</tr>`
    +'<tr class="ln"><td></td><td></td><td></td><td></td><td></td><td></td></tr>'.repeat(2);}).join('');
  return `<div class="sheetpage pnd pnd-a"><div class="pnd-top"><span class="pnd-big">ใบแนบ ภ.ง.ด.${form}</span>
    <b>เลขประจำตัวผู้เสียภาษีอากร</b> <span class="pnd-i">(ของผู้มีหน้าที่หักภาษี ณ ที่จ่าย)</span> ${tin((DB.shop||{}).tax)}
    <b style="margin-left:3mm">สาขาที่</b> ${branchBoxes(payerBranch())}
    <span style="margin-left:auto">แผ่นที่ ${line(String(no),10)} ในจำนวน ${line(String(of),10)} แผ่น</span></div>
   <table class="pnd-t"><colgroup>${cols.map(w=>'<col style="width:'+w+'mm">').join('')}</colgroup><thead>${head}</thead><tbody>${blocks}
    <tr class="tot"><td colspan="${p3?5:6}" style="text-align:right">รวมยอดเงินได้และภาษีที่นำส่ง <span class="pnd-i">(นำไปรวมกับใบแนบ ภ.ง.ด.${form} แผ่นอื่น (ถ้ามี))</span></td>
     <td class="n">${money(sum(rows,'base'))}</td><td class="n">${money(sum(rows,'amt'))}</td><td></td></tr></tbody></table>
   <div class="pnd-foot"><div class="l"><i>${F.seqNote}</i><br><b><u>หมายเหตุ</u></b> ❶ ${F.note1}<br>❷ ${F.note2[0]}${F.note2.slice(1).map(t=>'<span class="sq"></span>'+t).join('')}</div>
    <div class="r"><div class="seal">ประทับตรา<br>นิติบุคคล<br>(ถ้ามี)</div><div>ลงชื่อ ${line('',62)} ผู้จ่ายเงิน<br>( ${line('',60)} )<br>ตำแหน่ง ${line('',64)}<br>ยื่นวันที่ ${line('',9)} เดือน ${line('',26)} พ.ศ. ${line('',14)}</div></div></div></div>`;
 }

 /* ---------- the return ---------- */
 function returnSheet(form,mo,rows){
  const F=FORM[form],m=+mo.slice(5,7),year=+mo.slice(0,4)+543,zip=(payerAddr().match(/(\d{5})\s*$/)||[])[1]||'';
  const month=i=>`<span>${tick(i+1===m)}(${i+1}) ${MONTHS[i]}</span>`;
  const order=[0,3,6,9,1,4,7,10,2,5,8,11];
  return `<div class="sheetpage pnd pnd-r" data-pdf-name="ภ.ง.ด.${form}|${mo}">
   <div class="pnd-hd"><div class="t">${F.title.map((t,i)=>i?t:'<b>'+t+'</b>').join('<br>')}</div><div class="pnd-name">ภ.ง.ด.${form}</div></div>
   <div class="pnd-two"><div class="pnd-box"><b>เลขประจำตัวผู้เสียภาษีอากร</b> <span class="pnd-i">(ของผู้มีหน้าที่หักภาษี ณ ที่จ่าย)</span><br>${tin((DB.shop||{}).tax)}
     <br><b>ชื่อผู้มีหน้าที่หักภาษี ณ ที่จ่าย (หน่วยงาน) :</b> &nbsp; สาขาที่ ${branchBoxes(payerBranch())}
     <br>${line(payerName(),88)}<br><b>ที่อยู่ :</b> ${line(payerAddr(),84)}<br>รหัสไปรษณีย์ ${boxes(zip,[5])}</div>
    <div class="pnd-box"><b>เดือนที่จ่ายเงินได้พึงประเมิน</b><br><span class="pnd-i">(ให้ทำเครื่องหมาย “✓” ลงใน “☐” หน้าชื่อเดือน)</span> พ.ศ. ${line(String(year),18)}
     <div class="mo">${order.map(month).join('')}</div></div></div>
   <div class="pnd-box">${tick(false)}(1) ยื่นปกติ &nbsp; &nbsp; &nbsp; ${tick(false)}(2) ยื่นเพิ่มเติมครั้งที่ ${line('',12)}
    <br>นำส่งภาษีตาม &nbsp; ${F.law.map((t,i)=>tick(i===0)+t).join(' &nbsp; &nbsp; ')}</div>
   <div class="pnd-box" style="display:flex;gap:4mm"><div style="flex:.8">มีรายละเอียดการหักเป็นรายผู้มีเงินได้ ปรากฏตาม<br><span class="pnd-i">(ให้แสดงรายละเอียดในใบแนบ ภ.ง.ด.${form} หรือในสื่อบันทึกในระบบคอมพิวเตอร์อย่างใดอย่างหนึ่งเท่านั้น)</span></div>
    <div style="flex:1.9">${tick(true)}<b>ใบแนบ ภ.ง.ด.${form}</b> ที่แนบมาพร้อมนี้ : จำนวน ${line(String(rows.length),10)} ราย &nbsp; จำนวน ${line(String(sheetsOf(rows)),10)} แผ่น
     <br>หรือ<br>${tick(false)}<b>สื่อบันทึกในระบบคอมพิวเตอร์</b> ที่แนบมาพร้อมนี้ : จำนวน ${line('',10)} ราย &nbsp; จำนวน ${line('',10)} แผ่น
     <div class="pnd-i" style="line-height:1.5">(ตามหนังสือแสดงความประสงค์ฯ ทะเบียนรับเลขที่ ${line('',40)}<br>หรือตามหนังสือข้อตกลงการใช้งานฯ เลขอ้างอิงการลงทะเบียน ${line('',30)})</div></div></div>
   <table class="pnd-s"><tr><th style="text-align:center">สรุปรายการภาษีที่นำส่ง</th><th style="text-align:center">จำนวนเงิน</th></tr>
    <tr><td>1. รวมยอดเงินได้ทั้งสิ้น</td><td class="n">${money(sum(rows,'base'))}</td></tr>
    <tr><td>2. รวมยอดภาษีที่นำส่งทั้งสิ้น</td><td class="n">${money(sum(rows,'amt'))}</td></tr>
    <tr><td>3. เงินเพิ่ม (ถ้ามี)</td><td class="n"></td></tr>
    <tr><td>4. รวมยอดภาษีที่นำส่งทั้งสิ้น และเงินเพิ่ม (2. + 3.)</td><td class="n"></td></tr></table>
   <div class="pnd-sign">ข้าพเจ้าขอรับรองว่า รายการที่แจ้งไว้ข้างต้นนี้ เป็นรายการที่ถูกต้องและครบถ้วนทุกประการ
    <br>ลงชื่อ ${line('',70)} ผู้จ่ายเงิน<br>( ${line('',68)} )<br>ตำแหน่ง ${line('',72)}<br>ยื่นวันที่ ${line('',10)} เดือน ${line('',30)} พ.ศ. ${line('',16)}
    <div class="seal">ประทับตรา<br>นิติบุคคล<br>(ถ้ามี)</div></div></div>`;
 }

 function sheets(form,mo){
  const rows=WO.month(mo).filter(v=>v.form===form);if(!rows.length)return '';
  const of=sheetsOf(rows);
  /* a line break after each cell and block: what is printed reads as words when copied */
  return (returnSheet(form,mo,rows)+Array.from({length:of},(_,i)=>attachSheet(form,rows.slice(i*PER,i*PER+PER),i+1,of)).join('')).replace(/<\/(td|th|div|tr)>/g,'</$1>\n');
 }
 function print(form){
  const html=sheets(form,acctM());if(!html)return toast('เดือนนี้ไม่มีรายการ ภ.ง.ด.'+form);
  printDocs(html);
 }
 window.PKG_PND={sheets,print};

 /* ---------- the buttons on the tax report's withholding panel ---------- */
 const tbl=$i('whtOutTbl'),head=tbl&&tbl.closest('.panel')&&tbl.closest('.panel').querySelector('header');
 if(!head)return;
 const bar=document.createElement('span');bar.id='pndPrintBar';bar.style.cssText='display:inline-flex;gap:6px;margin-left:auto;flex-wrap:wrap';
 head.appendChild(bar);
 bar.addEventListener('click',e=>{const b=e.target.closest('[data-pnd]');if(b)print(b.dataset.pnd);});
 function paint(){const rows=WO.month(acctM());
  bar.innerHTML=['3','53'].filter(f=>rows.some(v=>v.form===f)).map(f=>`<button type="button" class="btn gh sm" data-pnd="${f}">พิมพ์ ภ.ง.ด.${f} + ใบแนบ</button>`).join('');}
 const rt0=renderTax;renderTax=function(){const out=rt0.apply(this,arguments);paint();return out;};
})();
