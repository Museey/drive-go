/* Column order of the 07 parts register (user 2026-10-01: shops want their own order; ลำดับ stays first; this register
   only). The order is stored in DB.regCols.stockTbl.order = original column index at each position (always starting 0).
   The table is drawn by the original code in its own order; this module moves the cells of every header / body row into
   the stored order after each draw, and puts them back for the moment while index-based code runs (card columns, sort
   paint / bind), so widths, hidden columns, exports and the 11.1 editor all simply see the table as it is on screen. */
(()=>{
 const ID='stockTbl',tbl=document.getElementById(ID);if(!tbl||!window.PKG_REG_LAYOUT)return;
 const n=()=>tbl.tHead?tbl.tHead.rows[0].cells.length:0;
 const stored=()=>{const o=(DB.regCols||{})[ID]?.order;if(!Array.isArray(o)||o[0]!==0)return null;const k=n();
  if(o.length!==k||o.some(x=>typeof x!=='number')||new Set(o).size!==k||o.some(x=>x<0||x>=k))return null;return o;};
 const rows=()=>[...(tbl.tHead?tbl.tHead.rows:[]),...tbl.tBodies[0].rows,...(tbl.tFoot?tbl.tFoot.rows:[])];
 const back=tr=>{const key=tr.dataset.pkgOrd;if(!key)return;const o=key.split(',').map(Number),cur=[...tr.cells];
  if(cur.length===o.length){const orig=[];o.forEach((oi,pos)=>orig[oi]=cur[pos]);tr.append(...orig);}tr.dataset.pkgOrd='';};
 /* current order → original order, for every row */
 function unorder(){rows().forEach(back);}
 /* original order → stored order; rows that were in another order are put back first */
 function order(){if(!tbl.isConnected)return;const o=stored();if(!o){unorder();return;}const key=o.join(',');
  rows().forEach(tr=>{if(tr.dataset.pkgOrd===key)return;if(tr.dataset.pkgOrd)back(tr);const cur=[...tr.cells];
   if(cur.length!==o.length)return;tr.append(...o.map(i=>cur[i]));tr.dataset.pkgOrd=key;});}
 const around=(name,fn)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(id){if(id!==ID)return o.apply(this,arguments);unorder();try{return o.apply(this,arguments);}finally{order();}};};
 ['mkCards','paintSort','bindSort'].forEach(n=>around(n));   /* index-based code sees the original order */
 let t=0;new MutationObserver(()=>{clearTimeout(t);t=setTimeout(order,0);}).observe(tbl,{childList:true});   /* rows drawn without mkCards */
 if(tbl.tBodies[0])new MutationObserver(()=>{clearTimeout(t);t=setTimeout(order,0);}).observe(tbl.tBodies[0],{childList:true});
 /* called by 11.1 after a change: re-measure and redraw with the new order */
 function changed(){const L=PKG_REG_LAYOUT.colPx;if(L&&L[ID])delete L[ID];order();PKG_REG_LAYOUT.apply(ID);PKG_REG_LAYOUT.paintHidden();}
 window.PKG_REG_ORDER={id:ID,stored,order,unorder,changed};
 order();
})();
