'use strict';
// ── AUDIT LOG / EVENT LOG ─────────────────────────
// meta: { category, caseId, scoreDelta, correct, extra }
// category — машиночитаемый код группы события: AUTH | NAV | CASE | SCORE |
//   DECISION | CHECK | BIOMETRICS | ALERT | ACTION | SYSTEM
// correct  — true/false/null: признак правильности действия курсанта,
//   нужен для тепловых карт ошибок на платформе проверки.
function logAudit(action, detail, meta = {}) {
  const now = new Date();
  const caseId = meta.caseId ?? STATE.currentCaseId ?? null;
  const c = caseId ? getCase(caseId) : null;

  AUDIT_LOG.push({
    time: now,
    action,
    detail,
    caseId: caseId || '—',
    role: STATE.role
  });

  EVENT_LOG.push({
    seq: EVENT_LOG.length + 1,
    ts: now.toISOString(),
    category: meta.category || 'SYSTEM',
    action,
    detail,
    caseId: caseId || null,
    caseType: c ? c.type : (meta.caseType || null),
    igId: c ? c.ig : (meta.igId || null),
    role: STATE.role,
    scoreDelta: meta.scoreDelta ?? 0,
    scoreAfter: STATE.score,
    correct: meta.correct ?? null,
    meta: meta.extra || {}
  });
}
