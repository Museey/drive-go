/* DriveGo new system (owner's request of 2026-11-06 — the return and its attachment, the payee's branch left blank, the
   buttons on the tax report): ภ.ง.ด.3 / ภ.ง.ด.53 of a month on the Revenue Department's forms, printed from
   08 บัญชี → รายงานภาษี, "พิมพ์ ภ.ง.ด.3 + ใบแนบ" / "พิมพ์ ภ.ง.ด.53 + ใบแนบ" (shown when the month has that form).
   · The return (ใบหน้าแบบ, A4 portrait, laid out as the form ภ.ง.ด.3 of มี.ค. 2560): the payer's tax id and branch, name
     and address; the month ticked and its year; "ใบแนบ … ที่แนบมาพร้อมนี้" ticked with how many ราย (ลำดับที่) and แผ่น;
     the summary 1. income paid and 2. tax withheld (3. เงินเพิ่ม and 4. left blank: they depend on the day it is filed);
     นำส่งภาษีตาม (1) มาตรา 3 เตรส ticked (the 50 ทวิ's item 5, 52.js); ยื่นปกติ / ยื่นเพิ่มเติม, the signature and the
     dates left blank, written by hand.
   · The attachment (ใบแนบ, A4 landscape, the form of มี.ค. 2560): 6 ลำดับที่ a sheet, numbered on from sheet to sheet;
     one ลำดับที่ per payee in the month (accountant B, round 3 Q5, owner 2026-11-11), with the numbers of the tax report and
     the 50 ทวิ (52.js PKG_WHT_OUT.month: payees in the order of their first payment); a line per payment (a block grows past
     its three lines when a payee was paid more often; a sheet holds 18 lines): the day paid, the income type
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
.pnd-r .pnd-hd{display:flex;align-items:center;gap:4mm}
.pnd-r .pnd-hd .t{flex:1;text-align:center;line-height:1.45;border:1px solid #333;border-radius:3mm;padding:2mm 3mm}
.pnd-r .pnd-hd .t b{font-size:13.5px}
.pnd-r .pnd-name{border:2px solid #000;border-radius:3mm;font-size:28px;font-weight:700;padding:2mm 5mm;flex:none}
.pnd-r .pnd-grid{display:flex;border:1px solid #333;margin-top:2.5mm}
.pnd-r .pnd-grid .cl{flex:1.25;padding:2mm 3mm;border-right:1px solid #333;line-height:2}
.pnd-r .pnd-grid .cr{flex:1;display:flex;flex-direction:column;min-width:0}
.pnd-r .g3 .cr{padding:2mm 3mm;line-height:2;flex:1.15}
.pnd-r .g3 .cl{flex:1.1}
.pnd-r .g3 .mo{font-size:8.4px;gap:.5mm .6mm}
.pnd-r .g3 .mo .tk{margin-right:.8mm}
.pnd-r .sp{display:flex;justify-content:space-between;gap:3mm}
.pnd-r .ms{border-top:1px solid #333;margin:1.5mm -3mm -2mm;padding:1.5mm 3mm 2mm}
.pnd-r .fl{border-top:1px solid #333;margin:1.5mm -3mm 0;padding:2mm 3mm 0}
.pnd-r .g53 .fl{margin:0;padding:2.5mm 3mm;text-align:center}
.pnd-r .g53 .hd{text-align:center;font-weight:700;border-bottom:1px solid #333;padding:1mm}
.pnd-r .g53 .lw{padding:2mm 3mm;line-height:2.2;border-bottom:1px solid #333}
.pnd-r .g53 .lw>div,.pnd-r .fl{white-space:nowrap}
.pnd-r .tcl{flex:1;display:flex;align-items:flex-end;justify-content:center;color:#888;font-size:8.6px;padding:2mm;min-height:12mm}
.pnd-r .pnd-law3{border:1px solid #333;border-top:0;padding:2mm 3mm}
.pnd-r .mo{display:grid;grid-template-columns:repeat(4,auto);justify-content:space-between;gap:.5mm 1mm;font-size:9px;line-height:1.9;white-space:nowrap}
.pnd-r .pnd-att{display:flex;gap:4mm;margin-top:3mm;line-height:1.9}
.pnd-r .pnd-att .l{flex:.85;padding-top:4mm}
.pnd-r .pnd-att .r{flex:1.6}
.pnd-r .pnd-att .q{display:flex;justify-content:space-between;gap:2mm}
.pnd-r table.pnd-s{width:82%;border-collapse:separate;border-spacing:0 1.2mm;margin:3mm auto 0}
.pnd-r table.pnd-s th{background:#e8e8e8;border-radius:2mm;padding:1mm 2mm;font-size:10.5px;text-align:center}
.pnd-r table.pnd-s td{padding:.5mm 2mm;font-size:10.5px}
.pnd-r table.pnd-s td:first-child{border-bottom:1px dotted #777}
.pnd-r table.pnd-s .n{width:40mm;text-align:right}
.pnd-r .am{display:inline-flex;border:1px solid #333;width:38mm;height:5.6mm;font-family:'Sarabun',sans-serif;font-size:11px}
.pnd-r .am b{flex:1;text-align:right;padding:0 1.5mm;font-weight:600;line-height:5.6mm}
.pnd-r .am .dp{display:inline-block;width:0;overflow:hidden}
.pnd-r .am i{width:7mm;border-left:1px solid #333;text-align:center;font-style:normal;font-weight:600;line-height:5.6mm}
.pnd-r .pnd-sign{text-align:center;margin-top:4mm;padding-top:3mm;border-top:1px solid #333;position:relative;line-height:2.2}
.pnd-r .pnd-sign .who{margin-top:2mm}
.pnd-r .pnd-sign .seal{position:absolute;right:16mm;top:14mm}
.pnd-r .pnd-rd{margin-top:3mm;padding-top:3mm;border-top:1px solid #333;font-size:9.5px;font-weight:600}`;
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
 const LINES=PER*3;
 /* the payees (ลำดับที่) of the month's payments, each with its payments; then sheets of up to 18 lines */
 function groups(rows){const g=[];rows.forEach(v=>{let x=g.find(z=>z.seq===v.seq);if(!x)g.push(x={seq:v.seq,rows:[]});x.rows.push(v);});return g;}
 const height=G=>Math.max(3,G.rows.length);
 function pack(gs){const out=[];let cur=[],used=0;
  gs.forEach(G=>{if(cur.length&&used+height(G)>LINES){out.push(cur);cur=[];used=0;}cur.push(G);used+=height(G);});
  out.push(cur);return out;}
 const sum=(rows,k)=>rows.reduce((a,v)=>a+n(v[k]),0);

 /* ---------- the attachment: one sheet of six ---------- */
 function attachSheet(form,gs,no,of){
  const rows=gs.flatMap(G=>G.rows);
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
  const pay=v=>`<td class="c">${thDate(v.date)}</td><td>${esc(WO.income(v))}</td><td class="c">${v.rate}</td><td class="n">${money(v.base)}</td><td class="n">${money(v.amt)}</td><td class="c">1</td>`;
  const EMPTY='<td></td><td></td><td></td><td></td><td></td><td></td>';
  const block=G=>{
   const v=G&&G.rows[0]||null,P=v?WO.party(v):{tax:'',addr:null},addr=v?addrText(P.addr):'',h=G?height(G):3;
   const who=p3
    ?(()=>{const [a,b]=split(v&&v.payee);return `<div style="display:flex;justify-content:space-between;align-items:center">${tin(P.tax)}<span style="margin-right:2mm">${branchBoxes('')}</span></div>
      <div>ชื่อ ${line(a,40)} ชื่อสกุล ${line(b,40)}</div><div>ที่อยู่ ${addrLn(addr,88)}</div>`;})()
    :`<div>${tin(P.tax)}</div><div>ชื่อ ${line(v&&v.payee,74)}</div><div>ที่อยู่ ${addrLn(addr,71)}</div>`;
   const lines=Array.from({length:h},(_,j)=>G&&G.rows[j]?pay(G.rows[j]):EMPTY);
   return `<tr class="blk"><td class="c" rowspan="${h}">${v?v.seq:''}</td><td class="who" rowspan="${h}">${who}</td>${p3?'':`<td class="c" rowspan="${h}" style="vertical-align:top">${branchBoxes('')}</td>`}${lines[0]}</tr>`
    +lines.slice(1).map(l=>'<tr class="ln">'+l+'</tr>').join('');};
  const used=gs.reduce((a,G)=>a+height(G),0);
  const blocks=gs.map(block).join('')+Array.from({length:Math.floor((LINES-used)/3)},()=>block(null)).join('')
   +('<tr class="ln">'+EMPTY+'</tr>').repeat(Math.max(0,LINES-used)%3);
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

 /* ---------- the return (ใบหน้าแบบ): laid out as the Revenue Department's own forms (docs/reference/rd-pnd3-cover.pdf,
    rd-pnd53-cover.pdf, sent by accountant B with round 3 Q6; owner 2026-11-11, frontend/CHANGES.md 153) ---------- */
 /* the payer's address in the form's own fields: the shop's address is one line of text, so its parts are found by their
    words (ถ. ซ. ม. ต./แขวง อ./เขต จ.); what is left over means it cannot be split, and the whole line is printed instead */
 function addrParts(a){
  const o={bld:'',room:'',floor:'',village:'',no:'',moo:'',soi:'',yaek:'',road:'',sub:'',dist:'',prov:'',zip:'',rest:''};
  if(a&&typeof a==='object')return Object.assign(o,{village:a.village||'',no:a.no||'',moo:a.moo||'',soi:a.soi||'',road:a.road||'',sub:a.sub||'',dist:a.dist||'',prov:a.prov||'',zip:a.zip||''});
  let t=String(a||'').trim().replace(/\s+/g,' ');
  const take=(re,k)=>{const m=t.match(re);if(!m)return;o[k]=m[1].trim();t=(t.slice(0,m.index)+' '+t.slice(m.index+m[0].length)).replace(/\s+/g,' ').trim();};
  take(/(\d{5})\s*$/,'zip');
  take(/(?:จ\.|จังหวัด)\s*(\S+)/,'prov');
  if(!o.prov){const m=t.match(/กรุงเทพมหานคร|กรุงเทพฯ/);if(m){o.prov='กรุงเทพมหานคร';t=t.replace(m[0],' ').replace(/\s+/g,' ').trim();}}
  take(/(?:อ\.|อำเภอ|เขต)\s*(\S+)/,'dist');
  take(/(?:ต\.|ตำบล|แขวง)\s*(\S+)/,'sub');
  take(/(?:ถ\.|ถนน)\s*(\S+(?: \d+(?=\s|$))?)/,'road');
  take(/(?:ซ\.|ซอย|ตรอก)\s*(\S+)/,'soi');
  take(/(?:ม\.|หมู่ที่|หมู่)\s*(\d+)/,'moo');
  take(/^(\d[\d\/-]*)/,'no');
  o.rest=t;return o;
 }
 /* an amount in the form's box: baht | satang */
 const amt=v=>{if(v===''||v==null)return '<span class="am"><b></b><i></i></span>';const [b,st]=money(v).split('.');return `<span class="am"><b>${b}</b><span class="dp">.</span><i>${st||'00'}</i></span>`;};
 function returnSheet(form,mo,rows,payees,of){
  const F=FORM[form],p3=form==='3',m=+mo.slice(5,7),year=+mo.slice(0,4)+543;
  const A=addrParts((DB.shop||{}).addr),split=!A.rest;
  const f=(label,v,w)=>label+' '+line(split?v:'',w);
  const month=i=>`<span>${tick(i+1===m)}(${i+1}) ${MONTHS[i]}</span>`;
  const order=[0,3,6,9,1,4,7,10,2,5,8,11];
  const months=`<div class="lb"><b>เดือน</b>ที่จ่ายเงินได้พึงประเมิน <span class="pnd-i">(ให้ทำเครื่องหมาย “✓” ลงใน “☐” หน้าชื่อเดือน)</span> พ.ศ. ${line(String(year),16)}</div>
    <div class="mo">${order.map(month).join('')}</div>`;
  const payer=`<div><b>เลขประจำตัวผู้เสียภาษีอากร</b> ${tin((DB.shop||{}).tax)}<br><span class="pnd-i">(ของผู้มีหน้าที่หักภาษี ณ ที่จ่าย)</span></div>
    <div class="sp"><b>ชื่อผู้มีหน้าที่หักภาษี ณ ที่จ่าย <i>(หน่วยงาน)</i> :</b><span>สาขาที่ ${branchBoxes(payerBranch())}</span></div>
    <div>${line(payerName(),118)}</div>
    <div><b>ที่อยู่ :</b> ${split?f('อาคาร',A.bld,20)+' '+f('ห้องเลขที่',A.room,8)+' '+f('ชั้นที่',A.floor,6)+' '+f('หมู่บ้าน',A.village,22):line(payerAddr(),100)}</div>
    <div>${f('เลขที่',A.no,24)} ${f('หมู่ที่',A.moo,7)} ${f('ตรอก/ซอย',A.soi,24)} ${f('แยก',A.yaek,14)}</div>
    <div>${f('ถนน',A.road,40)} ${f('ตำบล/แขวง',A.sub,40)}</div>
    <div>${f('อำเภอ/เขต',A.dist,40)} ${f('จังหวัด',A.prov,40)}</div>
    <div>รหัสไปรษณีย์ ${boxes(split?A.zip:((payerAddr().match(/(\d{5})\s*$/)||[])[1]||''),[5])} ${line('',62)}</div>`;
  const filing=`${tick(false)}${p3?'(1) ':''}ยื่น<b>ปกติ</b> &nbsp; &nbsp; &nbsp; ${tick(false)}${p3?'(2) ':''}ยื่น<b>เพิ่มเติม</b>ครั้งที่ <span class="bx"><i style="width:9mm"></i></span>`;
  const tcl='<div class="tcl">สำหรับบันทึกข้อมูลจากระบบ TCL</div>';
  const top=p3
   ?`<div class="pnd-grid g3"><div class="cl">${payer}<div class="fl">${filing}</div></div><div class="cr">${months}${tcl}</div></div>
     <div class="pnd-law3">นำส่งภาษีตาม ${F.law.map((t,i)=>tick(i===0)+t.replace(/มาตรา (\S+)/,'มาตรา <b>$1</b>')).join(' &nbsp; &nbsp; &nbsp; ')}</div>`
   :`<div class="pnd-grid g53"><div class="cl">${payer}<div class="ms">${months}</div></div>
     <div class="cr"><div class="hd">นำส่งภาษีตาม</div><div class="lw">${F.law.map((t,i)=>'<div>'+tick(i===0)+t.replace(/มาตรา (\S+ ?\S*)$/,'มาตรา <b>$1</b>')+' แห่งประมวลรัษฎากร</div>').join('')}</div>
      <div class="fl">${filing}</div>${tcl}</div></div>`;
  return `<div class="sheetpage pnd pnd-r" data-pdf-name="ภ.ง.ด.${form}|${mo}">
   <div class="pnd-hd"><div class="t">${F.title.map((t,i)=>i?(p3&&i===1?'<b>'+t+'</b>':t):'<b>'+t+'</b>').join('<br>')}</div><div class="pnd-name">ภ.ง.ด.${form}</div></div>
   ${top}
   <div class="pnd-att"><div class="l">มีรายละเอียดการหักเป็นรายผู้มีเงินได้ ปรากฏตาม<br><span class="pnd-i">(ให้แสดงรายละเอียดใน<b>ใบแนบ ภ.ง.ด.${form}</b> หรือใน<b>สื่อบันทึกในระบบคอมพิวเตอร์</b>อย่างใดอย่างหนึ่งเท่านั้น)</span></div>
    <div class="r"><div class="q"><span>${tick(true)}<b>ใบแนบ ภ.ง.ด.${form}</b> ที่แนบมาพร้อมนี้ :</span> <span>จำนวน ${line(String(payees),16)} ราย<br> จำนวน ${line(String(of),16)} แผ่น</span></div>
     <div><b>หรือ</b></div>
     <div class="q"><span>${tick(false)}<b>สื่อบันทึกในระบบคอมพิวเตอร์</b> ที่แนบมาพร้อมนี้ :</span> <span>จำนวน ${line('',16)} ราย<br> จำนวน ${line('',16)} แผ่น</span></div>
     <div class="pnd-i" style="line-height:1.6">(ตามหนังสือแสดงความประสงค์ฯ ทะเบียนรับเลขที่ ${line('',44)}<br>หรือตามหนังสือข้อตกลงการใช้งานฯ เลขอ้างอิงการลงทะเบียน ${line('',30)})</div></div></div>
   <table class="pnd-s"><tr><th>สรุปรายการภาษีที่นำส่ง</th><th class="n">จำนวนเงิน</th></tr>
    <tr><td><b>1. รวม</b>ยอดเงินได้ทั้งสิ้น</td><td class="n">${amt(sum(rows,'base'))}</td></tr>
    <tr><td><b>2. รวม</b>ยอดภาษีที่นำส่งทั้งสิ้น</td><td class="n">${amt(sum(rows,'amt'))}</td></tr>
    <tr><td>3. เงินเพิ่ม <i>(ถ้ามี)</i></td><td class="n">${amt('')}</td></tr>
    <tr><td><b>4. รวม</b>ยอดภาษีที่นำส่งทั้งสิ้น และเงินเพิ่ม (<b>2. + 3.</b>)</td><td class="n">${amt('')}</td></tr></table>
   <div class="pnd-sign">ข้าพเจ้าขอรับรองว่า รายการที่แจ้งไว้ข้างต้นนี้ เป็นรายการที่ถูกต้องและครบถ้วนทุกประการ
    <div class="who">ลงชื่อ ${line('',70)} ผู้จ่ายเงิน<br>( ${line('',68)} )<br>ตำแหน่ง ${line('',72)}<br>ยื่นวันที่ ${line('',10)} เดือน ${line('',30)} พ.ศ. ${line('',16)}</div>
    <div class="seal">ประทับตรา<br>นิติบุคคล<br>(ถ้ามี)</div></div>
   <div class="pnd-rd"><i>สอบถามข้อมูลเพิ่มเติมได้ที่ศูนย์สารนิเทศสรรพากร RD Intelligence Center โทร. 1161</i></div></div>`;
 }

 function sheets(form,mo){
  const rows=WO.month(mo).filter(v=>v.form===form);if(!rows.length)return '';
  const gs=groups(rows),pages=pack(gs),of=pages.length;
  /* a line break after each cell and block: what is printed reads as words when copied */
  return (returnSheet(form,mo,rows,gs.length,of)+pages.map((p,i)=>attachSheet(form,p,i+1,of)).join('')).replace(/<\/(td|th|div|tr)>/g,'</$1>\n');
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
