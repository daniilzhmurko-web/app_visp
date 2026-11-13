// ===== ГЕНЕРАЦИЯ И ВЫГРУЗКА JSON-ОТЧЁТА =====
// ================================================================
/**
 * Формирует отчёт о сессии курсанта. Структура оптимизирована под платформу проверки:
 *  - пакетная обработка 100+ курсантов
 *  - heatmap-агрегаты (по часам, по типам действий, по делам)
 *  - таблицы (миссии, дела, действия, ошибки)
 *  - машинно-читаемая схема (ISO-время, стабильные ключи)
 */
function buildReport() {
  const now = new Date();
  const sessionEndTs = now.toISOString();
  const startTs = APP.sessionStartTs || (DB.journal[0]?.ts) || sessionEndTs;
  const startDate = new Date(startTs);
  const durationSec = Math.max(0, Math.round((now - startDate) / 1000));

  // Сводка по действиям — для дашборда/тепловых карт
  const actionTypeCounts = {};
  const moduleCounts = {};
  const hourlyHistogram = {};     // 0..23 — для heatmap активности по часам
  let truePositives = 0, falsePositives = 0, falseNegatives = 0, trueNegatives = 0;

  DB.journal.forEach(e => {
    actionTypeCounts[e.action] = (actionTypeCounts[e.action] || 0) + 1;
    if (e.module) moduleCounts[e.module] = (moduleCounts[e.module] || 0) + 1;
    const hr = new Date(e.ts).getHours();
    hourlyHistogram[hr] = (hourlyHistogram[hr] || 0) + 1;
  });

  // Подсчёт по делам: верно/неверно подтверждено/отклонено
  Object.values(APP.casesActivity).forEach(c => {
    if (!c.decision) return;
    if (c.decision === 'confirmed') {
      if (c.isTrue) truePositives++; else falsePositives++;
    } else if (c.decision === 'rejected') {
      if (c.isTrue) falseNegatives++; else trueNegatives++;
    }
  });

  // Сводка по миссиям
  const missions = Object.entries(APP.missionsProgress).map(([id, p]) => {
    const m = MISSIONS.find(x => x.id === Number(id));
    return {
      id: Number(id),
      title: m?.title || null,
      difficulty: m?.difficulty || null,
      steps: m?.steps?.length || 0,
      done: !!p.done,
      score: p.score ?? null,
      startedAt: p.startedAt || null,
      completedAt: p.completedAt || null,
    };
  }).sort((a, b) => a.id - b.id);

  const completedMissions = missions.filter(m => m.done);
  const avgMissionScore = completedMissions.length
    ? Math.round(completedMissions.reduce((s, m) => s + (m.score || 0), 0) / completedMissions.length)
    : null;

  // Сводка по делам — для таблицы на дашборде
  const cases = Object.values(APP.casesActivity).map(c => ({
    id: c.id,
    kusp: c.kusp,
    opened: c.opened || null,
    coded: c.coded || null,
    searched: c.searched || null,
    decision: c.decision || null,
    isTrue: typeof c.isTrue === 'boolean' ? c.isTrue : null,
    // ФИКС: раньше решение «Неопределённо» (decision === 'undefined') молча
    // попадало в ветку «rejected» и помечалось как FN/TN наравне с реальным
    // отклонением кандидата, искажая статистику точности в отчёте.
    correctness: c.decision == null ? null
      : c.decision === 'confirmed' ? (c.isTrue ? 'TP' : 'FP')
      : c.decision === 'rejected' ? (c.isTrue ? 'FN' : 'TN')
      : 'IN' /* неопределённо — не относится к TP/FP/FN/TN */,
  }));

  return {
    reportSchemaVersion: '1.0',
    reportId: 'rpt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    generatedAt: sessionEndTs,
    simulator: {
      name: 'СЭКО/АДИС «Папилон» — Учебный симулятор МВД России',
      version: '1.0',
    },
    // === Идентификационный токен и скрытые метки — для проверки в universal_checker ===
    token: (window.IdentityToken && IdentityToken.getRawToken()) || null,
    uiInstance: (window.IdentityToken && IdentityToken.getBrowserTag()) || null,
    renderSeq: (window.IdentityToken && IdentityToken.getSeal('a')) || null,
    cadet: APP.user ? {
      cadetId: APP.cadetId,
      fullName: APP.user.fullName,
      squad: APP.user.squad,
      group: APP.user.group,
      groupLabel: APP.user.groupLabel,
      role: APP.user.role,
      loginAt: APP.user.loginAt,
      syncTag: (window.IdentityToken && IdentityToken.getSeal('b')) || null,
    } : null,
    session: {
      sessionId: APP.sessionId,
      startedAt: startTs,
      endedAt: sessionEndTs,
      durationSeconds: durationSec,
      durationHuman: `${Math.floor(durationSec / 60)} мин ${durationSec % 60} сек`,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    },
    finalScore: { ...APP.score },
    summary: {
      totalActions: DB.journal.length,
      actionTypeCounts,
      moduleCounts,
      hourlyHistogram,                         // для тепловой карты по часам
      cases: { total: cases.length, withDecision: cases.filter(c => c.decision).length, tp: truePositives, fp: falsePositives, fn: falseNegatives, tn: trueNegatives },
      missions: {
        completed: completedMissions.length,
        started: missions.length,
        averageScore: avgMissionScore,
      },
    },
    missions,
    cases,
    archivedActions: DB.archive || [],
    actions: DB.journal,                       // полный сквозной лог
  };
}

function downloadReport() {
  if (!APP.user && DB.journal.length === 0) {
    alert('Сначала войдите в систему и выполните хотя бы одно действие.');
    return;
  }
  const report = buildReport();
  // Безопасное имя файла: транслит + дата
  const safeName = (APP.user?.fullName || 'cadet')
    .replace(/[^а-яА-ЯёЁa-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const squadPart = APP.user?.squad ? '_vzvod_' + APP.user.squad : '';
  const fname = `seko_report_${safeName}${squadPart}_${new Date().toISOString().slice(0, 10)}.json`;

  // Blob + download
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  if (typeof logAction === 'function') logAction('REPORT_DOWNLOAD', `Скачан отчёт: ${fname} (${report.actions.length} действий)`);
  if (typeof showNotification === 'function') showNotification(`✅ Отчёт сохранён: ${fname}`, 'success');
  return report;
}
// ============================================================================
