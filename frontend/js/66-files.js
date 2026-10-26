/* DriveGo new system (task 3.11, decision R19-ค and the owner's answers 11.1–11.6): attachments are kept by the
   server apart from the shop's data; the data keeps a link (window.storage uploads every file before it saves,
   server/client/files.ts). On the screens:
   · menu 10 says how much of the shop's (franchise: the branch's) 2 GB the files use (11.2);
   · once the space is used up, a product picture or a knowledge-library file is refused when it is picked
     (payment slips and 50 ทวิ pictures are accounting evidence and always accepted, 11.2);
   · a knowledge-library file over 5 MB (a clip over 15 MB) is refused with a message to make it smaller, where the
     legacy app kept only its name (11.4).
   The shop logo stays inside the data and is not touched here. */
(function(){
 const S=window.storage,F=S&&S.files;
 if(!F||typeof KEY==='undefined')return;
 const MB=1048576;
 const MSG={
  full:'พื้นที่ไฟล์ของร้านเต็มแล้ว (2 GB) — แนบรูปสินค้า ไฟล์คลังความรู้ และคลิปไม่ได้ ลบไฟล์ที่ไม่ใช้แล้วก่อน',
  file:'ไฟล์ใหญ่เกิน 5 MB — กรุณาลดขนาดไฟล์ก่อนแนบ',
  clip:'คลิปใหญ่เกิน 15 MB — กรุณาลดขนาดคลิปก่อนแนบ'};
 const full=()=>F.space.known&&F.space.used>=F.space.quota;
 const gb=n=>(n/1024/MB).toFixed(n%(1024*MB)?2:0);

 /* menu 10: the space used, under the size of the data */
 if(typeof renderStoreBox==='function'){const o=window.renderStoreBox;
  window.renderStoreBox=async function(){const r=await o.apply(this,arguments);
   try{const el=document.getElementById('storeInfo');const s=await F.usage(KEY);
    if(el&&s.known&&!el.querySelector('.pkg-file-space'))el.insertAdjacentHTML('beforeend',`<span class="pkg-file-space"><br>ใช้พื้นที่ไฟล์ <b>${(s.used/MB).toFixed(2)} MB</b> จาก ${gb(s.quota)} GB</span>`);}catch(e){}
   return r;};}

 /* what a picked file is for: a product picture, a knowledge-library file, or something else (evidence, the logo, an import) */
 const useOf=el=>el&&el.closest&&(el.closest('#mImg')||el.id==='imgFile')?'picture':el&&el.id==='lnFile'?'knowledge':'';
 const refuse=(e,input,msg)=>{e.stopImmediatePropagation();e.preventDefault();if(input)input.value='';if(typeof toast==='function')toast(msg);};

 /* the space is looked up when a picture or knowledge file is about to be chosen, so the answer is there when it is picked */
 document.addEventListener('click',e=>{const t=e.target;if(t&&t.type==='file'&&useOf(t))F.usage(KEY).catch(()=>{});},true);
 document.addEventListener('change',e=>{
  const input=e.target;if(!input||input.type!=='file'||!input.files||!input.files[0])return;
  const use=useOf(input);if(!use)return;
  if(full())return refuse(e,input,MSG.full);
  if(use==='knowledge'){const f=input.files[0],clip=/^video\//.test(f.type);
   if(f.size>(clip?15:5)*MB){
    try{pxPendFile=null;}catch(_){}
    const info=document.getElementById('lnFileInfo');
    if(info)info.textContent='⚠ '+f.name+' ('+(f.size/MB).toFixed(1)+' MB) '+(clip?MSG.clip:MSG.file);
    refuse(e,input,clip?MSG.clip:MSG.file);}}
 },true);
 /* a picture dragged onto the product picture window */
 document.addEventListener('drop',e=>{if(useOf(e.target)==='picture'&&full())refuse(e,null,MSG.full);},true);
})();
