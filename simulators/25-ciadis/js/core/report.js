'use strict';
/* =====================================================
   ОТЧЁТ О СЕССИИ (JSON) — для внешней платформы проверки
   ===================================================== */
function generateReport() {
  const totalMaxXp = QUEST.reduce((s,q)=>s+q.xp,0);
  const completed = S.mode==='exam' ? !!(S.exam && S.exam.finished) : S.done.length >= QUEST.length;
  const finishedAt = S.timeline.finishedAt || nowISO();
  const startRef = S.timeline.loginAt || S.timeline.bootStartedAt;
  const durationSeconds = Math.round((new Date(finishedAt) - new Date(startRef))/1000);

  const steps = QUEST.map(q=>{
    const st = S.stepTimes[q.id] || {};
    const dur = (st.startedAt && st.completedAt)
      ? Math.round((new Date(st.completedAt)-new Date(st.startedAt))/1000)
      : null;
    return {
      id: q.id,
      title: q.title,
      xp_available: q.xp,
      completed: S.done.includes(q.id),
      started_at: st.startedAt || null,
      completed_at: st.completedAt || null,
      duration_seconds: dur,
      hints_used: st.hints || 0
    };
  });

  const roleSwitches = S.events.filter(e=>e.type==='role_switch').length;
  const validationErrors = S.events.filter(e=>e.type==='validation_error').length;

  return {
    report_version: '1.1',
    mode: S.mode,
    simulator: { name: 'ЦИАДИС-МВД', edition: 'Учебный тренажёр', version: '2.4.1' },
    token: (window.IdentityToken && IdentityToken.getRawToken()) || null,
    render_seq: (window.IdentityToken && IdentityToken.getSeal('a')) || null,
    ui_instance: (window.IdentityToken && IdentityToken.getBrowserTag()) || null,
    cadet: {
      fio: S.cadet.fio || null,
      platoon: S.cadet.platoon || null,
      session_id: S.cadet.sessionId,
      sync_tag: S.cadet.syncTag || (window.IdentityToken && IdentityToken.getSeal('b')) || null
    },
    timeline: {
      boot_started_at: S.timeline.bootStartedAt,
      login_at: S.timeline.loginAt,
      finished_at: S.timeline.finishedAt,
      report_generated_at: nowISO(),
      duration_seconds: durationSeconds
    },
    summary: {
      completed,
      steps_completed: S.done.length,
      steps_total: QUEST.length,
      total_xp: S.xp,
      max_xp: totalMaxXp,
      rank: getRank(S.xp).name,
      hints_used_total: S.hints,
      role_switches: roleSwitches,
      validation_errors: validationErrors,
      final_role: S.role
    },
    exam: (S.mode==='exam' && S.exam) ? examReport() : null,
    steps,
    events: S.events,
    clickstream: S.clicks
  };
}

function downloadReport() {
  const data = generateReport();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const fioSlug = (S.cadet.fio || 'kursant').trim().replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g,'_');
  const platoonSlug = (S.cadet.platoon || 'vzvod').trim().replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g,'_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `ciadis_report_${platoonSlug}_${fioSlug}_${dateStamp()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  logEvent('report_downloaded', { completed: S.done.length>=QUEST.length });
  toast('Отчёт сформирован','JSON-файл сохранён на устройство','success');
}
