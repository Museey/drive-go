/* 07 parts register: the picture cell like the reference ERP (user 2026-10-01) — a framed thumbnail 104×78, a framed
   "ไม่มีรูป" placeholder when there is none, both open the upload window (stock.img right, as the original's thumbnail);
   rows grow to fit. The register's own picture column is used; nothing is added to the data. */
(()=>{
 const t=document.getElementById('stockTbl');if(!t||typeof openImgModal!=='function')return;
 t.addEventListener('click',e=>{const ph=e.target.closest('.thumb-none');if(!ph)return;const tr=ph.closest('tr'),id=tr&&tr.dataset.pkgKey;
  if(!id||!DB.stock.some(s=>s.id===id))return;openImgModal(id);});
 const paint=()=>t.querySelectorAll('.thumb-none:not([data-ph])').forEach(ph=>{ph.dataset.ph='1';ph.setAttribute('role','button');ph.title='คลิกเพื่ออัปโหลดรูป';ph.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-8 8"/></svg><span>ไม่มีรูป</span>';});
 new MutationObserver(paint).observe(t,{childList:true,subtree:true});paint();
})();
