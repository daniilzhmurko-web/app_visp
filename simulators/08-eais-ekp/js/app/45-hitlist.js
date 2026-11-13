// ===== МОДУЛЬ: HIT LIST =====
// ================================================================
function renderHitList() {
  const hl = APP.currentHitList;
  // Проверяем, что hit list соответствует активному делу
  const isOrphan = APP.activeSearchQuery && APP.currentCase && APP.activeSearchQuery.latentId !== APP.currentCase.id;
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  ${APP.currentCase?`<div class="alert alert-info mb-16">📋 Результаты поиска по следу <strong>${APP.currentCase.id}</strong> (КУСП ${APP.currentCase.kusp} · ${APP.currentCase.type})</div>`:''}
  ${isOrphan ? `<div class="alert alert-warn mb-16">⚠️ Hit List от другого дела (${APP.activeSearchQuery.latentId}). Откройте нужное дело и выполните поиск заново.</div>` : ''}
  ${hl.length===0?'<div class="alert alert-warn">⚠️ Список пуст. Сначала выполните поиск.</div>':''}
  ${hl.length>0?`
  <div class="panel">
    <div class="panel-header">
      <h3>👥 Список кандидатов (${hl.length} позиций)</h3>
      <div style="display:flex;gap:8px;align-items:center">
        <span style="font-size:12px;color:var(--text-muted)">💡 Наибольший Score ≠ верный кандидат. Проверьте весь список!</span>
        <button class="btn btn-outline btn-sm" onclick="switchModule('comparison')">⚖️ Сравнение →</button>
      </div>
    </div>
    <div class="panel-body" style="padding:0">
      <table class="data-table hitlist-table">
        <thead><tr><th>#</th><th>ФИО кандидата</th><th>Дата рожд.</th><th>Пол</th><th>Регион</th><th>Score</th><th>Криминальная история</th><th>Статус</th><th>Действие</th></tr></thead>
        <tbody>
        ${hl.map((c,i)=>{
          const scoreClass = c.score>=80?'high':c.score>=55?'med':'low';
          const verBadge = {pending:'<span class="badge badge-new">Не проверен</span>',confirmed:'<span class="badge badge-done">✅ Подтверждён</span>',rejected:'<span class="badge badge-error">❌ Отклонён</span>',undefined:'<span class="badge badge-undef">❓ Неопр.</span>'}[c.verificationStatus]||'';
          return `<tr class="rank-${i+1} ${c.verificationStatus==='confirmed'?'true-match':''}" style="cursor:pointer" onclick="selectCandidate('${c.candidateId}')">
            <td style="font-weight:800;color:${i===0?'var(--accent-green)':i<3?'var(--accent-blue)':'var(--text-muted)'}">${i+1}</td>
            <td><strong>${c.name}</strong></td>
            <td style="font-size:12px">${c.dob}</td>
            <td style="font-size:12px">${c.gender}</td>
            <td style="font-size:12px">${c.region}</td>
            <td>
              <div class="score-bar">
                <div style="width:50px;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                  <div class="score-fill ${scoreClass}" style="width:${c.score}%"></div>
                </div>
                <span style="font-size:12px;font-weight:700;color:${scoreClass==='high'?'var(--accent-green)':scoreClass==='med'?'var(--accent-amber)':'var(--accent-red)'}">${c.score}</span>
              </div>
            </td>
            <td style="font-size:11px;color:var(--text-muted)">${c.crimHist}</td>
            <td>${verBadge}</td>
            <td><button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openComparison('${c.candidateId}')">⚖️ Сравнить</button></td>
          </tr>`;
        }).join('')}
        </tbody>
      </table>
    </div>
  </div>`:''}
  </div>`;
}

function resolveCandidate(id) {
  const c = DB.tenprints.find(x => x.id === id);
  if (c) return c;
  const l = DB.latents.find(x => x.id === id);
  if (!l) return undefined;
  return { id: l.id, name: `След ${l.id} (${l.type})`, dobDisplay: l.date, region: l.place, crimHist: l.kusp, gender: '—', pattern: '—', fingers: [], isLatent: true, latent: l };
}
function candidateMinutiae(c) {
  if (c.isLatent) return c.latent.userMinutiae || [];
  const cs = APP.currentCase;
  if (cs && cs.trueMatch === c.id && IDEAL_MINUTIAE[cs.id]) return IDEAL_MINUTIAE[cs.id];
  return generateCandidateMinutiae(c);
}
function selectCandidate(id) {
  APP.selectedCandidate = resolveCandidate(id);
  logAction('CANDIDATE_VIEW', `Просмотр кандидата ${id} (${APP.selectedCandidate?.name || '?'})`);
}
function openComparison(candidateId) {
  APP.selectedCandidate = resolveCandidate(candidateId);
  logAction('COMPARISON_OPEN', `Сравнение: след ${APP.currentCase?.id} vs кандидат ${candidateId}`);
  switchModule('comparison');
}

// ================================================================
