'use strict';
/* =====================================================
   ЭКРАН: МИССИЯ ВЫПОЛНЕНА
   ===================================================== */
function showMC() {
  S.timeline.finishedAt=nowISO();
  const rank=getRank(S.xp);
  logEvent('quest_completed', { xp:S.xp, rank:rank.name, steps:S.done.length, hints:S.hints });
  el('f-xp').textContent=S.xp;
  el('f-steps').textContent=S.done.length;
  el('f-hints').textContent=S.hints;
  el('f-rank').textContent=rank.name;
  el('mscreen').style.display='flex';
}
