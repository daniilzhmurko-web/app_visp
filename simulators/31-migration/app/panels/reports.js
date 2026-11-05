'use strict';
function exportReport() {
  toast('Ведомость успешно экспортирована (функция вывода на печать)', 'success');
}

// ── REPORTS ───────────────────────────────────────
function renderReports() {
  setContentTitle('Отчёты', 'Статистика и аналитические выборки');
  
  setContent(`
    <div class="form-row form-row-2" style="gap:16px">
      <div class="card">
        <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-bar-chart"/></svg> Статистика по типам дел</span></div>
        <div class="card-body">
          ${['Миграционный учёт','Патент','РВП','ВНЖ'].map((t,i)=>{
            const count = CASES.filter(c=>c.type===['migration_reg','patent','rvp','vnzh'][i]).length;
            const pct = Math.round(count/CASES.length*100);
            return `<div class="mb-2">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>${t}</span><span class="font-bold">${count} дел (${pct}%)</span></div>
              <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-clipboard"/></svg> Итоги сессии</span></div>
        <div class="card-body">
          <div class="score-display mb-2">
            <div class="score-num">${STATE.score}</div>
            <div style="flex:1">
              <div class="font-bold">Ваши баллы</div>
              <div class="text-sm text-muted">${calcGrade(STATE.score).label}</div>
            </div>
            <div class="score-grade ${calcGrade(STATE.score).cls}">${calcGrade(STATE.score).g}</div>
          </div>
          <div class="divider"></div>
          <div class="text-sm">Действий в журнале: <strong>${AUDIT_LOG.length}</strong></div>
          <div class="text-sm">Дел в очереди: <strong>${CASES.length}</strong></div>
          <div class="text-sm mt-1">Время сессии: <strong>${Math.round((Date.now()-STATE.sessionStart)/60000)} мин.</strong></div>
          <div class="divider"></div>
          <button class="btn btn-primary w-full" onclick="renderSessionReport()"><svg class="ic" aria-hidden="true"><use href="#i-bar-chart"/></svg> Полный отчёт</button>
        </div>
      </div>
    </div>
  `);
}

function renderSessionReport() {
  const gr = calcGrade(STATE.score);
  const elapsed = Math.round((Date.now()-STATE.sessionStart)/60000);
  const cadet = STATE.cadetInfo;
  
  document.getElementById('modal-report-body').innerHTML = `
    ${cadet ? `
    <div class="alert alert-info mb-2" style="display:flex;justify-content:space-between;align-items:center">
      <div><strong>${cadet.fio}</strong> · взвод ${cadet.platoon}</div>
      <div class="text-xs text-muted">ID сессии: ${STATE.sessionId||'—'}</div>
    </div>` : ''}
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:48px;margin-bottom:8px">${gr.g==='5'||gr.g==='4'?'<svg class="ic ic-ok" aria-hidden="true"><use href="#i-award"/></svg>':gr.g==='3'?'<svg class="ic ic-warn" aria-hidden="true"><use href="#i-award"/></svg>':'<svg class="ic ic-bad" aria-hidden="true"><use href="#i-x-circle"/></svg>'}</div>
      <div style="font-size:24px;font-weight:800">Итоговая оценка: <span class="score-grade ${gr.cls}">${gr.g}</span> — ${gr.label}</div>
      <div style="font-size:32px;font-weight:900;color:var(--primary);margin-top:8px">${STATE.score} баллов</div>
    </div>
    <div class="divider"></div>
    <div class="form-row form-row-3" style="gap:12px;margin-bottom:16px">
      <div class="card"><div class="card-body" style="text-align:center"><div style="font-size:22px;font-weight:800">${AUDIT_LOG.filter(l=>l.action==='УСПЕХ').length}</div><div class="text-xs text-muted">Правильных действий</div></div></div>
      <div class="card"><div class="card-body" style="text-align:center"><div style="font-size:22px;font-weight:800;color:var(--danger)">${AUDIT_LOG.filter(l=>l.action==='ШТРАФ').length}</div><div class="text-xs text-muted">Штрафных событий</div></div></div>
      <div class="card"><div class="card-body" style="text-align:center"><div style="font-size:22px;font-weight:800">${elapsed}</div><div class="text-xs text-muted">Минут работы</div></div></div>
    </div>
    <div class="section-title">Журнал последних действий</div>
    <div class="timeline" style="max-height:200px;overflow-y:auto">
      ${AUDIT_LOG.slice(-10).reverse().map(l=>`
        <div class="tl-item">
          <div class="tl-dot ${l.action==='ШТРАФ'?'danger':l.action==='УСПЕХ'?'success':''}"></div>
          <div class="tl-date">${fmtDateTime(l.time)}</div>
          <div class="tl-text ${l.action==='ШТРАФ'?'text-danger':''}">${l.action}: ${l.detail}</div>
        </div>
      `).join('')}
    </div>
    <div class="alert ${gr.g==='5'||gr.g==='4'?'alert-success':gr.g==='3'?'alert-warning':'alert-danger'} mt-2">
      ${gr.g==='5'?'Превосходный результат! Все скрытые нарушения выявлены.':
        gr.g==='4'?'Хороший результат. Допущены незначительные ошибки.':
        gr.g==='3'?'Удовлетворительно. Были пропущены сроки или некорректные данные.':
        'Неудовлетворительно. Допущены критические нарушения или пропущены лица в розыске.'}
    </div>
    <div class="text-xs text-muted mt-2">Полный структурированный журнал действий (${EVENT_LOG.length} событий) доступен для выгрузки в формате JSON для проверяющей платформы.</div>
  `;
  openModal('modal-report');
}

// ── ЭКСПОРТ ОТЧЁТА В JSON (для внешней платформы проверки) ──
// Формирует единый JSON-документ по сессии курсанта: кто проходил
// симулятор, с каким результатом, и полный структурированный журнал
// событий (EVENT_LOG). Формат одинаков для всех курсантов (schemaVersion),
// что позволяет проверяющей платформе обрабатывать пакетно файлы
// от 100+ курсантов, строить тепловые карты ошибок по категориям/типам
// дел/ловушек и сводные таблицы по взводам.
function buildSessionReportPayload() {
  const gr = calcGrade(STATE.score);
  const successCount = EVENT_LOG.filter(e=>e.correct===true).length;
  const errorCount = EVENT_LOG.filter(e=>e.correct===false).length;
  const criticalErrors = EVENT_LOG.filter(e=>e.scoreDelta<=-50);

  return {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    token: (window.IdentityToken && IdentityToken.getRawToken()) || null,
    renderSeq: (window.IdentityToken && IdentityToken.getSeal('a')) || null,
    uiInstance: (window.IdentityToken && IdentityToken.getBrowserTag()) || null,
    cadet: {
      fio: STATE.cadetInfo?.fio || null,
      platoon: STATE.cadetInfo?.platoon || null,
      role: STATE.role,
      roleLabel: {inspector:'Инспектор ОВМ',senior:'Ст. инспектор ОВМ',chief:'Начальник ОВМ',control:'Сотрудник ИК',instructor:'Преподаватель'}[STATE.role] || STATE.role,
      module: STATE.module,
      syncTag: STATE.cadetInfo?.syncTag || (window.IdentityToken && IdentityToken.getSeal('b')) || null
    },
    session: {
      sessionId: STATE.sessionId,
      startedAt: new Date(STATE.sessionStart).toISOString(),
      exportedFromScreenAt: new Date().toISOString(),
      durationMinutes: Math.round((Date.now()-STATE.sessionStart)/60000)
    },
    result: {
      score: STATE.score,
      maxScore: 150,
      grade: gr.g,
      gradeLabel: gr.label
    },
    stats: {
      casesTotal: CASES.length,
      casesProcessed: CASES.filter(c=>c.status==='approved'||c.status==='rejected'||c.status==='done').length,
      eventsTotal: EVENT_LOG.length,
      correctActions: successCount,
      errorActions: errorCount,
      criticalErrors: criticalErrors.length
    },
    cases: CASES.map(c=>({
      id: c.id,
      type: c.type,
      status: c.status,
      decision: c.decision,
      igId: c.ig,
      hostPartyId: c.hp,
      addressId: c.addr,
      source: c.source,
      fingerprintsDone: !!c.fingerprintsDone,
      checksDone: !!c.checksDone,
      checksResult: c.checksResult || null,
      daysOld: c.daysOld
    })),
    events: EVENT_LOG
  };
}

function downloadSessionReport() {
  if(!STATE.sessionId) { toast('Нет активной сессии для экспорта', 'warning'); return; }
  const payload = buildSessionReportPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const safeFio = (STATE.cadetInfo?.fio || 'cadet').replace(/[^a-zA-Zа-яА-ЯёЁ0-9]+/g, '_');
  const a = document.createElement('a');
  a.href = url;
  a.download = `fis-gmu-report_${safeFio}_${STATE.sessionId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  logAudit('ЭКСПОРТ', 'Выгрузка итогового отчёта в формате JSON', { category: 'SYSTEM' });
  toast('Отчёт выгружен в формате JSON', 'success');
}

// ── AUDIT ─────────────────────────────────────────
function renderAudit() {
  setContentTitle('Журнал аудита', 'Фиксация всех действий пользователя');
  
  const rows = AUDIT_LOG.slice().reverse().map(l=>`
    <tr>
      <td class="text-sm text-muted">${fmtDateTime(l.time)}</td>
      <td><span class="badge ${l.action==='ШТРАФ'?'badge-red':l.action==='УСПЕХ'?'badge-green':'badge-blue'}">${l.action}</span></td>
      <td>${l.detail}</td>
      <td class="text-sm text-muted">${l.caseId}</td>
    </tr>
  `).join('');
  
  setContent(`
    <div class="card">
      <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-lock"/></svg> Журнал аудита ФИС ГМУ</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Время</th><th>Событие</th><th>Описание</th><th>Дело</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `);
}
