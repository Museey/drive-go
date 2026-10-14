// Deliberate breakages used only by `npm run selfcheck` to prove each referee
// notices a change of its own kind. Never set SABOTAGE in a normal run.
export const SABOTAGE = {
  // Referee 1 (state): the action stops writing its audit-log entry.
  'skip-audit': () => addEventListener('load', () => { window.logAudit = function () {}; }),
  // Referee 2 (screenshot): the payment panel title turns red.
  'recolor-title': () => addEventListener('load', () => {
    const s = document.createElement('style');
    s.textContent = '.pkg-pay-head b { color: #d00 !important; }';
    document.head.append(s);
  }),
  // Referee 3 (flow): a message shown to the user is worded differently.
  'reword-message': () => addEventListener('load', () => {
    const t = document.getElementById('toast');
    new MutationObserver(() => {
      if (t.textContent.startsWith('รับชำระ ')) t.textContent = t.textContent.replace('รับชำระ ', 'ได้รับเงิน ');
    }).observe(t, { childList: true });
  }),
};
