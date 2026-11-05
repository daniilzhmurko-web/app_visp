'use strict';
// ── SCORE ─────────────────────────────────────────
// Третий параметр meta — необязательный объект с дополнительным контекстом
// для журнала событий, например { category:'DECISION', extra:{ caseType, trapType } }.
function addScore(delta, reason, meta = {}) {
  STATE.score += delta;
  if(STATE.score < 0) STATE.score = 0;
  const scoreEl = document.getElementById('score-display');
  if(scoreEl) scoreEl.textContent = STATE.score;
  const type = delta > 0 ? 'success' : (delta < 0 ? 'danger' : 'info');
  const sign = delta > 0 ? '+' : '';
  toast(`${sign}${delta} балл(ов): ${reason}`, type);
  logAudit(delta > 0 ? 'УСПЕХ' : (delta < 0 ? 'ШТРАФ' : 'ИНФО'), `${sign}${delta}: ${reason}`, {
    category: 'SCORE',
    scoreDelta: delta,
    correct: delta > 0 ? true : (delta < 0 ? false : null),
    ...meta
  });
}

function calcGrade(score) {
  if(score >= 120) return {g:'5',label:'Отлично',cls:'a5'};
  if(score >= 90) return {g:'4',label:'Хорошо',cls:'a4'};
  if(score >= 70) return {g:'3',label:'Удовл.',cls:'a3'};
  return {g:'2',label:'Неудовл.',cls:'a2'};
}
