/* DriveGo new system (task 3.9, decision R14 and the owner's answers of 2026-10-26): what each person may see, on the
   screens. The server sends nobody the values they may not see (server/lib/visibility.ts) and keeps the whole-data
   copies (backup points) for the shop's owner — Franchise HQ or the branch head:
   · the whole shop's backup file (ส่งออกไฟล์สำรอง) and restoring a backup point are the owner's;
   · other employees' pay and personal data: the payroll's own checks are in 60-payroll.js. */
(function(){
 if(typeof exportData!=='function'||typeof restoreBackup!=='function')return;
 /* the owner here: no employee signed in, and in a franchise HQ or the branch head (not a staff account) */
 const ownerHere=()=>{if(curEmp())return false;const a=typeof frAcc==='function'?frAcc():null;return !a||a.role==='HQ'||a.role==='HB';};
 const ex0=window.exportData;window.exportData=function(){if(!ownerHere())return toast('ส่งออกไฟล์สำรองทั้งร้านได้เฉพาะเจ้าของร้าน');return ex0.apply(this,arguments);};
 const rb0=window.restoreBackup;window.restoreBackup=function(){if(!ownerHere())return toast('กู้คืนจากจุดสำรองได้เฉพาะเจ้าของร้าน');return rb0.apply(this,arguments);};
 window.PKG_RIGHTS={ownerHere};
})();
