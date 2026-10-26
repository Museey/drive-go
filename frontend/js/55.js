/* TEST COPY ONLY — sample data on request (user 2026-10-11: "ช่วยสร้างคลังมาเพิ่มหน่อย … เพิ่มมาสัก 2 คลัง").
   The test database lives in each browser, so data added from one browser is not in another. Opening the copy with
   ?addTestBranches=1 adds two sample branches (BN คลังบางนา, RS คลังรังสิต) in THIS browser, once, through the same
   record shape and audit line the 11.4 page writes. Does nothing without that parameter. Not part of the product. */
(()=>{
 if(!/[?&]addTestBranches=1\b/.test(location.search)||typeof applyPerms!=='function')return;
 let done=false;
 const SAMPLE=[['BN','คลังบางนา','02-111-2233','88 ถ.บางนา-ตราด แขวงบางนาใต้ เขตบางนา กรุงเทพมหานคร 10260'],['RS','คลังรังสิต','02-555-7788','199 ถ.พหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง ปทุมธานี 12120']];
 const run=()=>{if(done||typeof DB!=='object'||!DB||!Array.isArray(DB.branches)||!DB.branches.length)return;
  if(!document.documentElement.classList.contains('pkg-open'))return;done=true;
  const added=[];SAMPLE.forEach(([code,name,tel,addr])=>{if(DB.branches.some(b=>b.code===code))return;
   DB.branches.push({id:uid(),code,main:false,name,keeper:'',tel,addr,active:true,bill:true});try{logAudit('emp',{no:code},'save','เพิ่มสาขา '+code+' · '+name+' (ข้อมูลตัวอย่าง)');}catch(e){}added.push(code+' · '+name);});
  try{const u=new URL(location.href);u.searchParams.delete('addTestBranches');history.replaceState(null,'',u.toString());}catch(e){}
  if(added.length){Promise.resolve(save()).then(()=>{try{PKG_BRANCH.paint();}catch(e){}toast('เพิ่มคลังตัวอย่างแล้ว: '+added.join(' , ')+' — เลือกได้ที่ช่อง "สาขา" ด้านบน');});}
  else toast('มีคลังตัวอย่าง BN และ RS อยู่แล้ว');};
 const ap=applyPerms;applyPerms=window.applyPerms=function(){const r=ap.apply(this,arguments);setTimeout(run,300);return r;};
 [1500,4000,8000].forEach(t=>setTimeout(run,t));
})();

/* TEST COPY ONLY — fresh trial data (owner 12 Oct: the present data was changed many times and contradicts itself;
   "สร้างข้อมูลทดลองในการใช้ระบบไว้"). The database lives in each browser, so this is something the owner triggers:
     ?package=biz&freshTrial=1    plain-Thai dialog, asks TWICE → keeps a full copy of the current database in this browser,
                                  keeps master data and settings, removes every document and movement, resets the running
                                  numbers, switches the new sale flow ON, and builds a small coherent set THROUGH THE
                                  PROGRAM'S OWN FUNCTIONS (goods received → quotes → stock cuts → receipts / invoices →
                                  billing note → debtor settlement), then lists what was made and reloads.
     ?package=biz&restoreTrial=1  asks once, puts the kept copy back.
   Nothing here runs without one of the two parameters. window.PKG_TRIAL is for the tests (test-fresh-trial.cjs). */
(()=>{
 if(typeof applyPerms!=='function'||!window.PKG_SALE||!window.PKG_STOCK_CUT)return;
 const S=window.PKG_SALE,SC=window.PKG_STOCK_CUT,KEEP=()=>KEY+'.trialkeep',$i=id=>document.getElementById(id);
 const sleep=ms=>new Promise(r=>setTimeout(r,ms)),r2=v=>Math.round(n(v)*100)/100;
 const day=k=>{const x=new Date();x.setDate(x.getDate()-k);return iso(x);};
 const DOCS=['purchases','quotes','receipts','moves','crm','expenses','claims','invoices','issues','stockCounts','billings','stockCuts','custClaims','transfers','audit'];
 const MASTER=['stock','cust','vendors','emp','branches','assets','capital','coa','hr','warns'];
 const counts=()=>Object.fromEntries(DOCS.concat(MASTER).map(k=>[k,Array.isArray(DB[k])?DB[k].length:0]));
 async function keep(){const json=JSON.stringify(DB);await STORE.set(KEEP(),json);return json.length;}
 async function hasKeep(){try{return !!(await STORE.get(KEEP()));}catch(e){return false;}}
 /* (3) every document and movement goes; master data and settings stay */
 function wipe(){
  DOCS.forEach(k=>{if(Array.isArray(DB[k]))DB[k]=[];});
  DB.seq={};DB.fifo={v:(DB.fifo&&DB.fifo.v)||1,lots:[],allocs:[]};DB.paySlips={};DB.whtDocs={};delete DB.pkgSaleFlow;DB.pkgCutsV=2;
  (DB.stock||[]).forEach(s=>{s.qty=0;s.lastMove='';Object.values(s.bq||{}).forEach(q=>{if(q){q.qty=0;if('lastMove' in q)q.lastMove='';}});});
  try{if(window.pkgFifo&&pkgFifo.reindex)pkgFifo.reindex();}catch(e){}
 }
 /* ---- small builders on the program's own functions ---- */
 const stockOf=id=>DB.stock.find(s=>s.id===id);
 const priceOf=s=>n(s.pb)||n(s.pa)||n(s.pc)||Math.max(50,Math.round(n(s.cost)*1.4))||100;
 const part=(s,qty,price)=>({type:'part',stockId:s.id,code:s.code,oem:s.oem||'',name:s.name,qty:qty||1,price:price==null?priceOf(s):price,warr:''});
 const labor=(name,price)=>({type:'labor',code:'',name,qty:1,price,stockId:''});
 const cutById=id=>SC.list().find(c=>c.id===id);
 /* a document made "k days ago": the program always stamps today, so the day is set right after — the cut, its stock
    movements, its FIFO draws and its ledger record together */
 function redateCut(c,date){
  const old=c.date,L=S.led(c);c.date=date;if(c.credit&&c.credit.days){const x=new Date(date+'T00:00:00');x.setDate(x.getDate()+n(c.credit.days));c.credit.due=iso(x);}
  const refs=new Set([c.moveRef,c.no,c.baseNo].filter(Boolean));
  (DB.moves||[]).forEach(m=>{if(refs.has(m.refNo))m.date=date;});((DB.fifo&&DB.fifo.allocs)||[]).forEach(a=>{if(refs.has(a.refNo))a.date=date;});
  if(L){(L.payments||[]).forEach(p=>{if(p.date===old)p.date=date;});if(L.paidDate===old)L.paidDate=date;if(L.inv&&L.inv.date===old){L.inv.date=date;if(L.inv.apv)L.inv.apv.date=date;}S.sync(c);S.touch(c);}
  return c;
 }
 async function sale(o){
  const doc=await S.saveSale({custId:o.cust||'',vehIdx:o.vehIdx==null?-1:o.vehIdx,channel:'retail',items:o.items,disc:n(o.disc),vat:o.vat==null?7:o.vat,wht:o.wht||undefined},o.mode||'wait',o.pay||null,o.credit?{credit:o.credit}:{});
  if(!doc)throw new Error('ตัดสต็อกไม่สำเร็จ: '+(o.tag||''));
  if(o.ago)redateCut(doc,day(o.ago));
  return cutById(doc.id);
 }
 async function goodsIn(brId,ago,lines){
  const B=window.PKG_BRANCH,back=B&&B.ctx()!==brId?B.ctx():null;if(back)B.switchTo(brId,{force:true});
  try{
   newGR(true);Object.assign(G,{vendorId:(DB.vendors[0]||{}).id||'',inv:'INV-OPEN-'+(((B&&B.get(brId))||{}).code||'MA'),term:'cash',paid:true,payDate:iso(),note:'สต๊อกตั้งต้นของข้อมูลทดลอง',items:lines,vat:0});
   fillGRForm();if($i('grVendor'))$i('grVendor').value=G.vendorId;if(typeof renderGRItems==='function')renderGRItems();
   await approveDoc('gr');const rec=DB.purchases.find(x=>x.id===G.id);if(!rec||!rec.posted)throw new Error('รับสินค้าเข้าไม่สำเร็จ');
   const date=day(ago);rec.date=rec.invDate=date;rec.payDate=date;rec.paid=true;if(rec.apv)rec.apv.date=date;
   (DB.moves||[]).forEach(m=>{if(m.refNo===rec.no)m.date=date;});DB.fifo.lots.forEach(l=>{if(l.refNo===rec.no)l.date=date;});
   try{closeModal('mGREdit');}catch(e){}
   return rec;
  }finally{if(back)B.switchTo(back,{force:true});}
 }
 function quote(o){
  Q=blankQuote();Object.assign(Q,{custId:o.cust,vehIdx:o.vehIdx||0,items:o.items,probs:[o.prob||'','',''],tech:o.tech||'',techName:o.tech?empName(o.tech,''):''});
  fillQuoteForm();saveQuote();const rec=DB.quotes.find(x=>x.id===Q.id);if(!rec||!rec.no)throw new Error('บันทึกใบเสนอราคาไม่สำเร็จ');return rec;
 }
 async function settleAll(cust,cuts){                       /* the debtor settlement window, exactly as a person would: tick, "เงินสดเต็มจำนวน", save */
  window.PKG_SALE_DOCS.settleFor(cust,cuts.map(c=>S.led(c).id),{share:true});for(let i=0;i<4;i++)await sleep(25);   /* (several short waits: the window draws once more after it filled in the withholding) */
  const root=$i('pkgSt'),full=root&&root.querySelector('[data-act="full"][data-k="cash"]');if(!full)throw new Error('เปิดหน้าตัดชำระไม่สำเร็จ');
  full.click();await sleep(30);root.querySelector('[data-act="save"]').click();await sleep(30);
  const go=document.querySelector('#pkgStCfm [data-cfm="go"]');if(go)go.click();await sleep(60);
  try{closeModal('mPartPay');}catch(e){}
 }
 async function taxFor(c){
  if(!window.PKG_SALE_DOCS.openTaxFor(c.id))return false;await sleep(30);const b=$i('txSaveBottom');if(b)b.click();await sleep(60);try{closeModal('mTaxDoc');}catch(e){}return !!S.taxOf(c);
 }
 function expense(o){
  openExp();$i('xDesc').value=o.desc;$i('xBase').value=o.base;$i('xDate').value=o.date;$i('xPayee').value=o.payee;$i('xTax').value=o.tax;$i('xVat').value=o.vat;$i('xWht').value=o.wht;$i('xPaid').value='1';
  if(o.cat&&[...$i('xCat').options].some(x=>x.value===o.cat))$i('xCat').value=o.cat;saveExp();return DB.expenses[DB.expenses.length-1];
 }
 const trialCust=(type,company,name,tel,tax)=>{let c=DB.cust.find(x=>(x.company||'')===company&&x.name===name);if(c)return c;
  c={id:uid(),type,company:type==='company'?company:'',name,tel,tel2:'',tax:tax||'',branch:type==='company'?'สำนักงานใหญ่':'',tier:'B',stars:3,addr:{no:'99',village:'',moo:'',soi:'',road:'สุขุมวิท',sub:'บางนา',dist:'บางนา',prov:'กรุงเทพมหานคร',zip:'10260'},vehicles:[]};
  try{stampRec(c,null);}catch(e){}DB.cust.push(c);return c;};
 /* (5) the small coherent set */
 async function build(){
  const out={};const B=window.PKG_BRANCH,main=B?B.ctx():'main';
  /* customers: the ones on file where they fit, a handful of ordinary trial names only when there are not enough */
  const cos=DB.cust.filter(c=>c.type==='company'&&String(c.tax||'').trim()),pes=DB.cust.filter(c=>c.type!=='company');
  const CO=[['บริษัท สยามขนส่งรุ่งเรือง จำกัด','คุณวิไล ฝ่ายจัดซื้อ','02-555-0101','0105561000011'],['บริษัท บางนาโลจิสติกส์ จำกัด','คุณสมศักดิ์ ฝ่ายบัญชี','02-555-0102','0105561000029'],['บริษัท ไทยรุ่งการช่าง จำกัด','คุณอรทัย','02-555-0103','0105561000037'],['หจก. ศรีนครินทร์ยานยนต์','คุณประเสริฐ','02-555-0104','0103561000045'],['บริษัท พระรามเก้าการค้า จำกัด','คุณนภา','02-555-0105','0105561000053']];
  const PE=[['คุณสมชาย ใจดี','081-555-0201'],['คุณสุดา พรหมมา','081-555-0202'],['คุณวีระ ทองดี','081-555-0203']];
  while(cos.length<5){const t=CO[cos.length];cos.push(trialCust('company',t[0],t[1],t[2],t[3]));}
  while(pes.length<3){const t=PE[pes.length];pes.push(trialCust('person','',t[0],t[1],''));}
  const [coE,coF,coA,coB,coC]=cos,[peB,peC,peD]=pes;
  let car=DB.cust.find(c=>(c.vehicles||[]).length)||peB;if(!(car.vehicles||[]).length)car.vehicles=[{brand:'Toyota (โตโยต้า)',model:'Hilux Revo 2.4',color:'ขาว',plateL:'1กข',plateN:'1234',plateProv:'กรุงเทพมหานคร',mile:'85000',engine:'',vin:'',year:'2563'}];
  /* opening stock: one goods-received document per branch (paid), a few lots with dates — one expired, one near expiry */
  const prods=DB.stock.filter(s=>s.code&&s.name).slice(0,25);if(prods.length<8)throw new Error('ต้องมีสินค้าในระบบอย่างน้อย 8 รายการ');
  const E=window.PKG_EXPIRY,tracked=prods.filter(s=>E&&E.tracked&&E.tracked(s)).slice(0,3),expNote=[];
  const far=(()=>{const x=new Date();x.setMonth(x.getMonth()+14);return iso(x);})(),near=(()=>{const x=new Date();x.setDate(x.getDate()+20);return iso(x);})();
  const lineOf=(s,qty,x)=>Object.assign({stockId:s.id,code:s.code,oem:s.oem||'',name:s.name,cat:s.cat||'อื่น ๆ',qty,cost:n(s.cost)||Math.round(priceOf(s)*0.6)},x||{});
  const EXP={};if(tracked[0])EXP[tracked[0].id]=day(15);if(tracked[1])EXP[tracked[1].id]=near;if(tracked[2])EXP[tracked[2].id]=far;
  const grMain=await goodsIn(main,12,prods.map(s=>lineOf(s,20,EXP[s.id]?{exp:EXP[s.id]}:(E&&E.tracked&&E.tracked(s)?{exp:far}:null))));
  out.gr=[grMain.no];
  const others=B?B.list().filter(b=>b.id!==main&&b.active!==false):[];
  for(const b of others){const g=await goodsIn(b.id,12,prods.slice(3,9).map(s=>lineOf(s,10,E&&E.tracked&&E.tracked(s)?{exp:far}:null)));out.gr.push(g.no);}
  if(tracked.length)expNote.push('ล็อตมีวันหมดอายุ '+tracked.length+' รายการ (หมดอายุแล้ว 1 · ใกล้หมด '+(tracked[1]?1:0)+')');
  const free=prods.filter(s=>!EXP[s.id]);let pi=0;const next=()=>free[(pi++)%free.length];
  /* quotes: 1 draft · 1 waiting for approval · 2 approved and not yet cut (one counter, one repair job with labour and a car) */
  const tech=(DB.emp.find(e=>e.active!==false)||{}).id||'';
  try{laborWarnBypass=true;}catch(err){}                       /* the "no labour line" question of a parts-only quote is answered already */
  const q1=quote({cust:peB.id,items:[part(next(),1)]});
  const q2=quote({cust:coB.id,items:[part(next(),2)]});await sendApv('quote');
  const q3=quote({cust:peC.id,items:[part(next(),1),part(next(),1)]});await approveDoc('quote');
  const q4=quote({cust:car.id,vehIdx:0,prob:'เช็คระยะ เปลี่ยนถ่ายของเหลว',tech,items:[part(next(),1),part(next(),1),labor('ค่าแรงเช็คระยะ',1200)]});await approveDoc('quote');
  try{laborWarnBypass=false;}catch(err){}
  try{closeModal('mQuoteEdit');}catch(e){}
  out.quotes={draft:q1.no,pending:q2.no,approved:[q3.no,q4.no]};
  /* stock cuts over the last 10 days — every step of the straight line */
  const gross=its=>r2(its.reduce((a,it)=>a+n(it.qty)*n(it.price),0)*1.07);
  /* a) walk-in, cash, paid, receipt issued */
  let its=[part(next(),1),part(next(),2)];const a=await sale({tag:'a',items:its,mode:'pay',pay:{methods:[{k:'cash',amt:gross(its),given:Math.ceil(gross(its)/100)*100,change:r2(Math.ceil(gross(its)/100)*100-gross(its))}]},ago:10});
  S.issueReceipt(a,S.led(a).payments[0].id);
  /* b) named person, transfer, receipt NOT yet issued */
  its=[part(next(),1)];const bank=((DB.shop&&DB.shop.banks)||[]).map(x=>typeof bankLabel==='function'?bankLabel(x):x.name)[0]||'ธนาคารกสิกรไทย';
  const b=await sale({tag:'b',cust:peB.id,items:its,mode:'pay',pay:{methods:[{k:'trans',amt:gross(its)}],transLines:[{bank,amt:gross(its),when:'10:15',ref:'TR-0001'}]},ago:9});
  /* c) named person, รอชำระ, no invoice */
  const c=await sale({tag:'c',cust:peC.id,items:[part(next(),1),part(next(),1)],ago:3});
  /* d) named person, รอชำระ, invoice saved and รออนุมัติ */
  const d=await sale({tag:'d',cust:peD.id,items:[part(next(),2)],ago:2});S.createInvoice(d);
  /* e) company on cash terms, รอชำระ 8 days, invoice approved (the home card warns) */
  const e=await sale({tag:'e',cust:coE.id,items:[part(next(),1),part(next(),1)],ago:8});S.createInvoice(e);S.approveInvoice(e);S.led(e).inv.date=S.led(e).inv.apv.date=day(8);
  /* f) company, part-paid with 3% withholding on labour, certificate not yet received, receipt issued */
  its=[part(next(),1),labor('ค่าแรงเปลี่ยนอะไหล่',2000)];const f=await sale({tag:'f',cust:coF.id,items:its,wht:{rate:3,base:'labor',auto:true},ago:6});
  S.addPayment(f,{date:day(5),methods:[{k:'trans',amt:1500}],transLines:[{bank,amt:1500,when:'14:20',ref:'TR-0002'}],wht:{rate:3,base:'labor',baseAmt:2000,amt:60,got:false}},{issue:true});
  /* g) credit company A: two cuts with approved invoices, one billing note over both, nothing received */
  const g1=await sale({tag:'g1',cust:coA.id,items:[part(next(),2)],mode:'credit',credit:{days:30},ago:7}),g2=await sale({tag:'g2',cust:coA.id,items:[part(next(),1),labor('ค่าแรงซ่อมบำรุง',1500)],wht:{rate:3,base:'labor',auto:true},mode:'credit',credit:{days:30},ago:5});   /* labour → the debtor page pre-fills 3% of it */
  [g1,g2].forEach(x=>{S.createInvoice(x);S.approveInvoice(x);});
  BN=blankBilling();Object.assign(BN,{custId:coA.id,receiptIds:[S.led(g1).id,S.led(g2).id],due:day(-25),note:'วางบิลประจำงวด'});fillBillingForm();saveBilling();await approveDoc('billing');try{closeModal('mBillingEdit');}catch(e){}
  const bill=DB.billings[DB.billings.length-1];
  /* h) credit company B: one repair-style cut (parts + labour 3,000 → expected withholding 3% of the labour), no invoice yet */
  const h=await sale({tag:'h',cust:coB.id,items:[part(next(),1),labor('ค่าแรงซ่อมเครื่องยนต์',3000)],wht:{rate:3,base:'labor',auto:true},mode:'credit',credit:{days:30},ago:4});
  /* i) credit company C: two cuts (one with labour → withholding expected), settled at the debtor page with ONE combined receipt */
  const i1=await sale({tag:'i1',cust:coC.id,items:[part(next(),1),labor('ค่าแรงตรวจเช็ค',1000)],wht:{rate:3,base:'labor',auto:true},mode:'credit',credit:{days:30},ago:9}),i2=await sale({tag:'i2',cust:coC.id,items:[part(next(),1)],mode:'credit',credit:{days:30},ago:8});
  await settleAll(coC.id,[i1,i2]);
  /* j) one cancelled cut · one counter cut with an adjustment (ปัดเศษ −0.35) · one revision (-R1) of a counter cut */
  const j1=await sale({tag:'j1',cust:peC.id,items:[part(next(),1)],ago:6});await SC.cancelCut(j1.id);
  const j2=await sale({tag:'j2',items:[part(next(),1,priceOf(free[0])+0.33)],ago:1});S.adjust(j2,{type:'down',amt:0.35,reason:'ปัดเศษ'});
  const j3=await sale({tag:'j3',cust:peD.id,items:[part(next(),2)],ago:4});const src=cutById(j3.id);
  const j3r=await S.revise(src,{items:[Object.assign({},src.items[0],{qty:1})],disc:0,vat:n(src.vat)});
  /* one cut on another branch, when there is one */
  let other=null;if(others.length){const ob=others[0];B.switchTo(ob.id,{force:true});try{other=await sale({tag:'bn',cust:peB.id,items:[part(prods[3],1)],mode:'pay',pay:{methods:[{k:'cash',amt:gross([part(prods[3],1)])}]},ago:2});}finally{B.switchTo(main,{force:true});}}
  /* tax invoices issued by hand for some company cuts (not all) */
  const taxed=[];for(const x of [e,g1,i1]){if(await taxFor(x))taxed.push(S.taxOf(x).no);}
  /* two expenses with withholding (4.4 · เราหักผู้ขาย) */
  const x1=expense({desc:'ค่าทำบัญชีรายเดือน',base:3500,vat:0,wht:3,payee:'สำนักงานบัญชีเลิศพัฒนา',tax:'0105551234567',date:day(5)}),x2=expense({desc:'ค่าเช่าอาคารประจำเดือน',base:25000,vat:0,wht:5,payee:'คุณสุนทร เจ้าของอาคาร',tax:'3101200456789',date:day(3)});
  try{closeModal('mSaleDone');closeModal('mSale');}catch(err){}
  out.cuts={a:a.no,b:b.no,c:c.no,d:d.no,e:e.no,f:f.no,g:[g1.no,g2.no],h:h.no,i:[i1.no,i2.no],cancelled:j1.no,adjusted:j2.no,revised:j3r&&j3r.no,other:other&&other.no};
  out.bill=bill&&bill.no;out.tax=taxed;out.exp=[x1&&x1.no,x2&&x2.no];out.expNote=expNote;
  out.n={gr:out.gr.length,quotes:DB.quotes.length,cuts:SC.list().length,invoices:DB.receipts.filter(r=>r.pkgSale&&S.invAll(r).length).length,receipts:new Set(DB.receipts.flatMap(r=>(r.payments||[]).map(p=>p.reNo).filter(Boolean))).size,bills:DB.billings.length,tax:taxed.length,exp:DB.expenses.length,products:prods.length};
  return out;
 }
 const summaryHtml=o=>`<div class="pkg-imp-l"><b>1 · สต๊อกตั้งต้น</b><div class="hint">ใบรับสินค้า ${o.n.gr} ใบ · สินค้า ${o.n.products} รายการ${o.expNote.length?' · '+esc(o.expNote.join(' · ')):''}</div></div>
  <div class="pkg-imp-l"><b>2 · ใบเสนอราคา ${o.n.quotes} ใบ</b><div class="hint">ร่าง 1 · รออนุมัติ 1 · อนุมัติแล้วยังไม่ตัดสต็อก 2 (ขายหน้าร้าน 1 · งานซ่อมมีค่าแรง 1) — ลองกดตัดสต็อกเองได้</div></div>
  <div class="pkg-imp-l"><b>3 · ใบตัดสต็อก ${o.n.cuts} ใบ (ย้อนหลัง 10 วัน)</b><div class="hint">เงินสดชำระแล้ว · โอนแล้วยังไม่ออกใบเสร็จ · รอชำระ · รอชำระ + ใบแจ้งหนี้รออนุมัติ · บริษัทค้าง 8 วัน · ชำระบางส่วน + หัก ณ ที่จ่าย · เงินเชื่อ 5 ใบ · ยกเลิก 1 · ปรับยอด 1 · ฉบับแก้ไข 1${o.cuts.other?' · สาขาอื่น 1':''}</div></div>
  <div class="pkg-imp-l"><b>4 · ใบเสร็จรับเงิน ${o.n.receipts} เลขที่ · ใบแจ้งหนี้ ${o.n.invoices} ใบ · ใบกำกับภาษี ${o.n.tax} ใบ</b><div class="hint">มีใบเสร็จรวม 1 ใบ (2 บิล) · ใบแจ้งหนี้รออนุมัติ 1 ใบ</div></div>
  <div class="pkg-imp-l"><b>5 · ใบวางบิล ${o.n.bills} ใบ</b><div class="hint">${esc(o.bill||'')} — 2 บิล ยังไม่ได้รับเงิน</div></div>
  <div class="pkg-imp-l"><b>6 · ลูกหนี้</b><div class="hint">เงินเชื่อค้างชำระ 3 ใบ (2 ใบอยู่ในใบวางบิล · 2 ใบมีค่าแรง ระบบใส่ยอดหัก ณ ที่จ่ายให้เมื่อติ๊กที่หน้าตัดชำระ) · ตัดชำระครบแล้ว 2 ใบ · ค่าใช้จ่ายที่หัก ณ ที่จ่าย ${o.n.exp} รายการ (4.4 เราหักผู้ขาย)</div></div>`;
 /* muted while the set is built: no pop-ups, no toasts, one save at the end */
 async function quiet(fn){
  const k={askP:window.askP,askPromptP:window.askPromptP,askConfirm:window.askConfirm,toast:window.toast,saveFx:window.saveFx,save:window.save,printDocs:window.printDocs};
  askP=window.askP=async()=>true;askPromptP=window.askPromptP=async()=>'ข้อมูลทดลอง';askConfirm=window.askConfirm=o=>{if(o&&typeof o.onYes==='function')o.onYes();};toast=window.toast=()=>{};saveFx=window.saveFx=()=>{};save=window.save=async()=>{};printDocs=window.printDocs=()=>{};
  try{return await fn();}finally{askP=window.askP=k.askP;askPromptP=window.askPromptP=k.askPromptP;askConfirm=window.askConfirm=k.askConfirm;toast=window.toast=k.toast;saveFx=window.saveFx=k.saveFx;save=window.save=k.save;printDocs=window.printDocs=k.printDocs;}
 }
 async function fresh(o){
  o=o||{};
  if(curEmp())return {error:'ต้องเข้าใช้งานในฐานะเจ้าของกิจการ (ไม่ใช่บัญชีพนักงาน) จึงจะสร้างข้อมูลทดลองได้'};
  if((DB.stock||[]).filter(s=>s.code&&s.name).length<8)return {error:'ต้องมีสินค้าในระบบอย่างน้อย 8 รายการก่อน'};
  const before=counts();await keep();
  let out;try{
   out=await quiet(async()=>{wipe();S.apply(S.plan());return await build();});
  }catch(err){                                              /* anything wrong: put the kept copy back, change nothing */
   await restore({silent:true});return {error:'สร้างข้อมูลทดลองไม่สำเร็จ — คืนข้อมูลเดิมให้แล้ว ('+(err&&err.message||err)+')'};
  }
  out.before=before;out.verify=S.verify();await save();return out;
 }
 async function restore(o){
  const v=await STORE.get(KEEP());if(!v)return false;const data=JSON.parse(v);
  Object.keys(DB).forEach(k=>{delete DB[k];});Object.assign(DB,data);
  try{if(window.pkgFifo&&pkgFifo.reindex)pkgFifo.reindex();}catch(e){}
  await save();return true;
 }
 const clean=()=>{try{const u=new URL(location.href);u.searchParams.delete('freshTrial');u.searchParams.delete('restoreTrial');history.replaceState(null,'',u.toString());}catch(e){}};
 const TEXT='จะเกิดอะไรขึ้นบ้าง\n\n1. เก็บสำเนาข้อมูลทั้งหมดของตอนนี้ไว้ในเบราว์เซอร์นี้ก่อน (เรียกคืนได้ด้วยลิงก์ ?restoreTrial=1)\n2. เก็บข้อมูลหลักและการตั้งค่าไว้ทั้งหมด — ร้าน สาขา พนักงานและสิทธิ์ ลูกค้า ผู้ขาย สินค้า ราคา รูปแบบเลขที่เอกสาร ความกว้างคอลัมน์\n3. ลบเอกสารและรายการเคลื่อนไหวทั้งหมด — ใบเสนอราคา ใบตัดสต็อก ใบเสร็จ ใบแจ้งหนี้ ใบกำกับภาษี ใบวางบิล การรับชำระ เคลม โอนสินค้า ตรวจนับ ใบรับสินค้า ค่าใช้จ่าย นัดติดตามลูกค้า ประวัติเอกสาร — สต๊อกกลับเป็น 0 และเลขที่เอกสารเริ่มนับ 1 ใหม่\n4. เปิดใช้ระบบขายแบบใหม่\n5. สร้างข้อมูลทดลองชุดเล็กให้ครบทุกขั้นตอน (รับสินค้า → ใบเสนอราคา → ตัดสต็อก → ใบเสร็จ / ใบแจ้งหนี้ → ใบวางบิล → ลูกหนี้)';
 async function runFresh(){
  clean();
  if(!await askP({title:'สร้างข้อมูลทดลองชุดใหม่',text:TEXT,yes:'ดำเนินการต่อ',no:'ยกเลิก'}))return;
  if(!await askP({title:'ยืนยันอีกครั้ง',text:'เอกสารและรายการเคลื่อนไหวทั้งหมดในเบราว์เซอร์นี้จะถูกลบและแทนด้วยข้อมูลทดลอง\n(สำเนาของตอนนี้ถูกเก็บไว้ เรียกคืนได้ด้วยลิงก์ ?restoreTrial=1)\n\nยืนยันสร้างข้อมูลทดลองชุดใหม่?',yes:'ยืนยัน สร้างข้อมูลทดลอง',no:'ยกเลิก'}))return;
  toast('กำลังสร้างข้อมูลทดลอง — รอสักครู่');await sleep(50);
  const o=await fresh();
  if(o.error){await askP({title:'ยังสร้างข้อมูลทดลองไม่ได้',text:o.error,yes:'ตกลง',no:'ปิด'});return;}
  await askP({title:'สร้างข้อมูลทดลองเรียบร้อย',msg:summaryHtml(o)+'<div class="pkg-imp-q">กดตกลงเพื่อโหลดหน้าใหม่</div>',yes:'ตกลง',no:'ปิด'});
  location.reload();
 }
 async function runRestore(){
  clean();
  if(!await hasKeep()){await askP({title:'เรียกคืนข้อมูลก่อนสร้างชุดทดลอง',text:'ไม่พบสำเนาที่เก็บไว้ในเบราว์เซอร์นี้',yes:'ตกลง',no:'ปิด'});return;}
  if(!await askP({title:'เรียกคืนข้อมูลก่อนสร้างชุดทดลอง',text:'ข้อมูลทั้งหมดในเบราว์เซอร์นี้จะถูกแทนด้วยสำเนาที่เก็บไว้ก่อนสร้างข้อมูลทดลอง\n\nยืนยันเรียกคืน?',yes:'เรียกคืนข้อมูลเดิม',no:'ยกเลิก'}))return;
  await restore();await askP({title:'เรียกคืนเรียบร้อย',text:'กดตกลงเพื่อโหลดหน้าใหม่',yes:'ตกลง',no:'ปิด'});location.reload();
 }
 window.PKG_TRIAL={fresh,restore,keep,hasKeep,wipe,build,counts,summaryHtml,DOCS,MASTER,TEXT};
 const want=/[?&]freshTrial=1\b/.test(location.search)?runFresh:/[?&]restoreTrial=1\b/.test(location.search)?runRestore:null;
 if(!want)return;
 let done=false;const go=()=>{if(done||typeof DB!=='object'||!DB||!document.documentElement.classList.contains('pkg-open'))return;done=true;want();};
 const ap=applyPerms;applyPerms=window.applyPerms=function(){const r=ap.apply(this,arguments);setTimeout(go,400);return r;};
 [1500,4000,8000].forEach(t=>setTimeout(go,t));
})();

/* TEST COPY ONLY — shop name on request (owner 2026-10-12: "เปลี่ยนชื่อเป็น Drivego Service"). The shop record lives in each
   browser's database, so the name is set by opening the copy once with ?shopName=<name> in THAT browser: it writes
   DB.shop.name (and DB.shop.company when that still holds the old name), saves, and reloads without the parameter.
   The same change can be made by hand in 10 ตั้งค่าองค์กร. Does nothing without the parameter. */
(()=>{
 let want='';try{want=(new URL(location.href).searchParams.get('shopName')||'').trim().slice(0,80);}catch(e){}
 if(!want||typeof applyPerms!=='function')return;
 let done=false;
 const run=()=>{if(done||typeof DB!=='object'||!DB||!DB.shop)return;
  if(!document.documentElement.classList.contains('pkg-open'))return;done=true;
  const old=DB.shop.name||'';let url=location.href;try{const u=new URL(location.href);u.searchParams.delete('shopName');url=u.toString();}catch(e){}
  if(old===want){try{history.replaceState(null,'',url);}catch(e){}return;}
  if(DB.shop.company===old||!DB.shop.company)DB.shop.company=want;DB.shop.name=want;
  try{logAudit('emp',{no:'shop'},'save','เปลี่ยนชื่อร้าน '+old+' → '+want);}catch(e){}
  Promise.resolve(save()).then(()=>{location.replace(url);});};
 const ap=applyPerms;applyPerms=window.applyPerms=function(){const r=ap.apply(this,arguments);setTimeout(run,300);return r;};
 [1500,4000,8000].forEach(t=>setTimeout(run,t));
})();

/* TEST COPY ONLY — "ready to try" file (owner 2026-10-12: "ทำไฟล์ให้เป็นข้อมูลที่สามารถทดลองเลยได้ … โดยไม่ต้องพิมพ์ข้อมูลต่อท้าย").
   build-copy.py also writes DRIVEGO_TRIAL_v23.html = the same test copy plus one line that sets window.PKG_AUTO_TRIAL
   (and adds ?package=biz when it is missing). ONLY in that file: the first time it is opened in a browser whose data has
   not been prepared yet, the trial set of ?freshTrial=1 is built by itself (no questions — a tester's browser holds
   nothing but the built-in demo data; a copy is still kept, ?restoreTrial=1 brings it back), the shop name is set, the
   list of what was made is shown once, and the page reloads. Later openings do nothing. The normal test copy
   (DRIVEGO_PACKAGE_TEST_v23.html) never has the flag, so nothing here runs in it. */
(()=>{
 const A=window.PKG_AUTO_TRIAL;if(!A||typeof applyPerms!=='function'||!window.PKG_TRIAL||!window.PKG_SALE)return;
 /* one mark per package (each package keeps its own database in the browser); the first trial file (Biz only, 12 Oct) used
    the plain key — still honoured for Biz so a tester's Biz data is never rebuilt */
 const PLAN=window.PKG_PLAN||'biz',KEY='pkgAutoTrialDone:'+PLAN;
 const mark=()=>{try{localStorage.setItem(KEY,'1');}catch(e){}};
 const marked=()=>{try{return localStorage.getItem(KEY)==='1'||(PLAN==='biz'&&localStorage.getItem('pkgAutoTrialDone')==='1');}catch(e){return false;}};
 let done=false;
 async function run(){
  if(done||typeof DB!=='object'||!DB||!document.documentElement.classList.contains('pkg-open'))return;done=true;
  if(marked())return;
  if(PKG_SALE.on()){mark();return;}                    /* this browser already runs the new flow — leave its data alone */
  if(typeof curEmp==='function'&&curEmp())return;      /* an employee account: the helper is for the owner account only */
  const veil=document.createElement('div');veil.id='pkgAutoTrialVeil';
  veil.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(18,26,36,.72);display:grid;place-items:center;color:#fff;font:600 20px/1.5 Sarabun,system-ui,sans-serif;text-align:center;padding:24px';
  veil.textContent='กำลังเตรียมข้อมูลทดลอง — รอสักครู่';document.body.append(veil);
  await new Promise(r=>setTimeout(r,60));
  let o;try{o=await PKG_TRIAL.fresh();}catch(e){o={error:String(e&&e.message||e)};}
  if(o&&o.error){veil.remove();try{toast('ยังเตรียมข้อมูลทดลองไม่ได้: '+o.error);}catch(e){}return;}
  if(A.shop&&DB.shop){const old=DB.shop.name||'';if(DB.shop.company===old||!DB.shop.company)DB.shop.company=A.shop;DB.shop.name=A.shop;try{await save();}catch(e){}}
  mark();veil.remove();
  try{await askP({title:'ข้อมูลทดลองพร้อมใช้งาน',msg:PKG_TRIAL.summaryHtml(o)+'<div class="pkg-imp-q">กดตกลงเพื่อเริ่มใช้งาน</div>',yes:'ตกลง',no:'ปิด'});}catch(e){}
  location.reload();
 }
 const ap=applyPerms;applyPerms=window.applyPerms=function(){const r=ap.apply(this,arguments);setTimeout(run,600);return r;};
 [2000,5000,9000].forEach(t=>setTimeout(run,t));
})();
