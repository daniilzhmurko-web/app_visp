'use strict';
// ── DASHBOARD ─────────────────────────────────────
function renderDashboard() {
  setContentTitle('Дашборд', 'Обзор рабочего места');
  document.getElementById('nav-dashboard')?.classList.add('active');
  
  const newCases = CASES.filter(c=>c.status==='new').length;
  const pendingCases = CASES.filter(c=>c.status==='pending').length;
  const totalDone = CASES.filter(c=>c.status==='done'||c.status==='approved'||c.status==='rejected').length;
  const gr = calcGrade(STATE.score);
  
  const recentCases = CASES.slice(0,5).map(c=>{
    const ig = getIG(c.ig);
    return `<tr onclick="openCaseDetail('${c.id}')" class="${rowColor(c.daysOld)}">
      <td><span class="badge badge-blue text-xs">${c.id}</span></td>
      <td>${ig?.name||'—'}</td>
      <td>${typeLabel(c.type)}</td>
      <td>${badgeForStatus(c.status)}</td>
      <td class="text-sm text-muted">${fmtDate(c.created)}</td>
    </tr>`;
  }).join('');

  const notifications = [];
  CASES.filter(c=>c.daysOld>=3).forEach(c=>{
    const ig = getIG(c.ig);
    notifications.push(`<div class="alert alert-danger"><span class="alert-title">Просрочено!</span> ${c.id} (${ig?.name}) превысило срок обработки (${c.daysOld} дн.)</div>`);
  });
  CASES.filter(c=>c.daysOld===2).forEach(c=>{
    const ig = getIG(c.ig);
    notifications.push(`<div class="alert alert-warning"><span class="alert-title">Внимание!</span> ${c.id} (${ig?.name}) — срок истекает сегодня.</div>`);
  });

  setContent(`
    <div class="form-row form-row-3 mb-2" style="gap:14px">
      <div class="card">
        <div class="card-body" style="text-align:center">
          <div style="font-size:32px;font-weight:800;color:var(--danger)">${newCases}</div>
          <div class="text-sm text-muted">Новые дела</div>
        </div>
      </div>
      <div class="card">
        <div class="card-body" style="text-align:center">
          <div style="font-size:32px;font-weight:800;color:var(--warning)">${pendingCases}</div>
          <div class="text-sm text-muted">В обработке</div>
        </div>
      </div>
      <div class="card">
        <div class="card-body" style="text-align:center">
          <div style="font-size:32px;font-weight:800;color:var(--success)">${totalDone}</div>
          <div class="text-sm text-muted">Завершено</div>
        </div>
      </div>
    </div>

    <div class="form-row form-row-2" style="gap:16px">
      <div class="card">
        <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-inbox"/></svg> Последние дела</span></div>
        <div class="card-body" style="padding:0">
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>ИГ</th><th>Тип</th><th>Статус</th><th>Дата</th></tr></thead>
              <tbody>${recentCases}</tbody>
            </table>
          </div>
        </div>
      </div>
      <div>
        <div class="card mb-2">
          <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-award"/></svg> Ваши показатели</span></div>
          <div class="card-body">
            <div class="score-display">
              <div class="score-num">${STATE.score}</div>
              <div style="flex:1">
                <div class="progress-bar"><div class="progress-fill ${STATE.score>=90?'success':STATE.score>=70?'':' warning danger'}" style="width:${Math.min(STATE.score/1.5,100)}%"></div></div>
                <div class="text-xs text-muted mt-1">из 150 баллов</div>
              </div>
              <div class="score-grade ${gr.cls}">${gr.g}</div>
            </div>
            <div class="divider"></div>
            <div class="text-sm"><strong>Оценка:</strong> ${gr.label}</div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-bell"/></svg> Системные уведомления</span></div>
          <div class="card-body" style="max-height:160px;overflow-y:auto">
            ${notifications.length ? notifications.join('') : '<div class="alert alert-success">Нарушений не обнаружено</div>'}
          </div>
        </div>
      </div>
    </div>
  `);
}

// ── QUEUE ─────────────────────────────────────────
function renderQueue() {
  setContentTitle('Очередь дел', 'Входящие заявления от ЕПГУ, МФЦ и личного приёма');
  // Сбрасываем состояние фильтров при каждом перестроении таблицы —
  // старые значения относились к DOM, который сейчас будет пересоздан.
  QUEUE_FILTER.text = '';
  QUEUE_FILTER.type = '';
  const rows = CASES.map(c=>{
    const ig = getIG(c.ig);
    const hp = getHP(c.hp);
    return `<tr onclick="openCaseDetail('${c.id}')" class="${rowColor(c.daysOld)}">
      <td><span class="badge badge-blue">${c.id}</span></td>
      <td>${fmtDate(c.created)}</td>
      <td><strong>${ig?.name||'—'}</strong><br><span class="text-xs text-muted">${ig?.nationality||'—'}</span></td>
      <td>${typeLabel(c.type)}</td>
      <td class="text-sm">${hp?.name||'—'}</td>
      <td>${c.source}</td>
      <td>${badgeForStatus(c.status)}</td>
      <td><button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openCaseDetail('${c.id}')">Открыть</button></td>
    </tr>`;
  }).join('');

  setContent(`
    <div class="queue-filter-bar">
      <input class="queue-search" placeholder="Поиск по ФИО, паспорту, гражданству..." oninput="filterQueue(this.value)">
      <select class="form-select" style="width:160px" onchange="filterQueueType(this.value)">
        <option value="">Все типы</option>
        <option value="migration_reg">Миграционный учёт</option>
        <option value="patent">Патент</option>
        <option value="rvp">РВП</option>
        <option value="vnzh">ВНЖ</option>
      </select>
      <div style="display:flex;gap:6px;align-items:center;font-size:12px">
        <span style="background:#e8f5ed;color:var(--success);padding:3px 8px;border-radius:4px;font-weight:700"><i class="dot dot-g"></i>Новые</span>
        <span style="background:#fef9ec;color:var(--warning);padding:3px 8px;border-radius:4px;font-weight:700"><i class="dot dot-y"></i>Срок истекает</span>
        <span style="background:#fdf0ee;color:var(--danger);padding:3px 8px;border-radius:4px;font-weight:700"><i class="dot dot-r"></i>Просрочено</span>
      </div>
    </div>
    <div class="card">
      <div class="table-wrap">
        <table id="queue-table">
          <thead>
            <tr>
              <th>ID дела</th>
              <th>Дата подачи</th>
              <th>Иностранный гражданин</th>
              <th>Тип услуги</th>
              <th>Принимающая сторона</th>
              <th>Источник</th>
              <th>Статус</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody id="queue-tbody">${rows}</tbody>
        </table>
      </div>
    </div>
  `);
}

// Текстовый поиск и фильтр по типу раньше независимо перезаписывали
// display каждой строки, из-за чего последний применённый фильтр стирал
// эффект первого (нельзя было одновременно искать текст и фильтровать по
// типу). Теперь оба условия хранятся вместе и применяются совместно.
const QUEUE_FILTER = { text: '', type: '' };

function filterQueue(q) {
  QUEUE_FILTER.text = (q||'').toLowerCase();
  applyQueueFilter();
}
function filterQueueType(t) {
  QUEUE_FILTER.type = t || '';
  applyQueueFilter();
}
function applyQueueFilter() {
  const rows = document.querySelectorAll('#queue-tbody tr');
  rows.forEach((r,i)=>{
    const matchesText = !QUEUE_FILTER.text || r.textContent.toLowerCase().includes(QUEUE_FILTER.text);
    const matchesType = !QUEUE_FILTER.type || CASES[i]?.type === QUEUE_FILTER.type;
    r.style.display = (matchesText && matchesType) ? '' : 'none';
  });
}

// ── CASE DETAIL ────────────────────────────────────
function openCaseDetail(caseId) {
  const c = getCase(caseId);
  if(!c) return;
  STATE.currentCaseId = caseId;
  logAudit('ОТКРЫТИЕ ДЕЛА', `Дело ${caseId}, тип: ${typeLabel(c.type)}`, { category: 'CASE', caseId, extra: { caseType: c.type, igId: c.ig } });
  
  if(c.type === 'migration_reg') renderMigrationCase(c);
  else if(c.type === 'patent') renderPatentCase(c);
  else renderRvpCase(c);
}
