/* Track the current editor state without treating search text as document changes. */
(()=>{
 const baselines=new WeakMap();
 const snapshot=q=>{const clean=cleanQuote(q);return JSON.stringify(['date','jobIn','custId','vehIdx','mile','probs','finds','tier','items','disc','vat','byPos','byName','apPos','apName','tech','techName'].map(k=>clean[k]));};
 const fill=window.fillQuoteForm;
 window.fillQuoteForm=function(){const result=fill.apply(this,arguments);if(Q)baselines.set(Q,snapshot(Q));return result;};
 window.pkgQuoteMarkSaved=()=>{if(Q)baselines.set(Q,snapshot(Q));};
 window.pkgQuoteDirty=()=>{
  if(!Q||Q.cancelled)return false;
  if(!Q.no&&(qItemsClean(Q).length||Q.custId||(Q.probs||[]).some(v=>String(v||'').trim())||
    (Q.finds||[]).some(v=>v&&(v.t||v.fix||v.part||v.new))))return true;
  return baselines.has(Q)&&baselines.get(Q)!==snapshot(Q);
 };
})();
