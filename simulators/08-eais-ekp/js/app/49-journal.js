// ===== МОДУЛЬ: ЖУРНАЛ =====
// ================================================================
function renderJournal() {
  // Базовая статистика
  const counts = {};
  DB.journal.forEach(e => { counts[e.action] = (counts[e.action] || 0) + 1; });
  const statsHtml = Object.keys(counts).length
    ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">${
        Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([a,c])=>
          `<span class="badge badge-new" style="font-size:11px">${a}: <strong>${c}</strong></span>`).join('')
      }</div>`
    : '';
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  <div class="panel">
    <div class="panel-header">
      <h3>📝 Журнал действий курсанта (${DB.journal.length} записей)</h3>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" onclick="clearJournal()">🗑 Очистить</button>
        <button class="btn btn-primary btn-sm" onclick="downloadReport()">📥 Скачать JSON-отчёт</button>
      </div>
    </div>
    <div class="panel-body" style="padding:0">
      <div style="padding:10px 14px;background:var(--bg-panel);border-bottom:1px solid var(--border-light);font-size:12px;display:flex;gap:16px;flex-wrap:wrap;align-items:center">
        <span><strong>Курсант:</strong> ${APP.user ? APP.user.fullName : '—'}</span>
        <span><strong>Взвод:</strong> ${APP.user?.squad || '—'}</span>
        <span><strong>ID сессии:</strong> <code style="font-size:10px">${APP.sessionId || '—'}</code></span>
        <span><strong>Начало:</strong> ${APP.sessionStartTs ? new Date(APP.sessionStartTs).toLocaleString('ru-RU') : '—'}</span>
      </div>
      ${statsHtml}
      <div class="log-list" style="max-height:60vh">
        ${DB.journal.length===0?'<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Журнал пуст. Начните работу с делами или миссиями — все действия будут фиксироваться автоматически.</div>':
        [...DB.journal].reverse().map(e=>`
          <div class="log-entry">
            <span class="log-time" title="${e.ts}">${e.tsDisplay.split(', ')[1] || e.tsDisplay}</span>
            <span class="log-action">${e.action}</span>
            <span class="log-detail">${e.detail}</span>
            ${e.caseId?`<span style="font-size:10px;color:var(--accent-blue)">📁 ${e.caseId}</span>`:''}
            ${e.missionId?`<span style="font-size:10px;color:var(--accent-amber)">🎯 М${e.missionId}</span>`:''}
          </div>`).join('')}
      </div>
    </div>
  </div>
  </div>`;
}

function clearJournal() {
  if (!confirm('Очистить журнал действий? Это действие нельзя отменить (рекомендуется сначала скачать отчёт).')) return;
  DB.archive = (DB.archive || []).concat(DB.journal);
  DB.journal = [];
  APP.casesActivity = {};
  _persistSession();
  renderJournal();
  _updateReportBadge();
  if (typeof showNotification === 'function') showNotification('Журнал очищен', 'warn');
}

// ================================================================
