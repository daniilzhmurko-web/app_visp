'use strict';
// ── DOSSIER ───────────────────────────────────────
const DOSSIER = {q:'', page:0, size:50};
function renderDossierList() {
  setContentTitle('Картотека ИГ', 'Электронные досье иностранных граждан (АС ЦБДУИГ)');
  setContent(`
    <div class="queue-filter-bar mb-2">
      <input class="queue-search" placeholder="Поиск по ФИО, паспорту, гражданству, ID..." value="${DOSSIER.q}" oninput="dossierSearch(this.value)">
    </div>
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Фото</th><th>ФИО</th><th>Гражданство</th><th>Дата рождения</th><th>Паспорт</th><th>Срок</th><th>Въезд</th><th>«Амина»</th><th>Действие</th></tr></thead>
      <tbody id="dossier-rows"></tbody></table></div></div>
    <div id="dossier-pager" class="flex items-center gap-2 mt-1"></div>`);
  drawDossierRows();
}
function dossierFiltered() {
  const q = DOSSIER.q.trim().toLowerCase();
  return !q ? FOREIGN_CITIZENS : FOREIGN_CITIZENS.filter(ig => `${ig.id} ${ig.name} ${ig.nameEn} ${ig.passport} ${ig.nationality}`.toLowerCase().includes(q));
}
function dossierSearch(v) { DOSSIER.q = v; DOSSIER.page = 0; drawDossierRows(); }
function dossierPage(d) { DOSSIER.page += d; drawDossierRows(); }
function drawDossierRows() {
  const all = dossierFiltered(), max = Math.max(0, Math.ceil(all.length / DOSSIER.size) - 1);
  DOSSIER.page = Math.min(Math.max(0, DOSSIER.page), max);
  const lv = {ok:'badge-green', warn:'badge-yellow', danger:'badge-red', na:'badge-gray'}, lt = {ok:'норма', warn:'внимание', danger:'нарушение', na:'—'};
  document.getElementById('dossier-rows').innerHTML = all.slice(DOSSIER.page*DOSSIER.size, (DOSSIER.page+1)*DOSSIER.size).map(ig => { const am = aminaCheck(ig).level; return `
    <tr onclick="openDossier('${ig.id}')">
      <td>${igPhoto(ig,true)}</td>
      <td><strong>${ig.name}</strong><br><span class="text-xs text-muted">${ig.nameEn}</span></td>
      <td>${ig.nationality}</td><td>${ig.dob}</td><td>${ig.passport}</td><td>${ig.passportExp}</td><td>${ig.entryDate}</td>
      <td><span class="badge ${lv[am]}">${lt[am]}</span></td>
      <td><button class="btn btn-outline btn-sm"><svg class="ic" aria-hidden="true"><use href="#i-folder-open"/></svg> Досье</button></td>
    </tr>`; }).join('') || '<tr><td colspan="9" class="text-muted" style="text-align:center;padding:24px">Ничего не найдено</td></tr>';
  document.getElementById('dossier-pager').innerHTML = `<button class="btn btn-outline btn-sm" onclick="dossierPage(-1)" ${DOSSIER.page===0?'disabled':''}>← Назад</button>
    <span class="text-xs text-muted">Записи ${all.length?DOSSIER.page*DOSSIER.size+1:0}–${Math.min(all.length,(DOSSIER.page+1)*DOSSIER.size)} из ${all.length}</span>
    <button class="btn btn-outline btn-sm" onclick="dossierPage(1)" ${DOSSIER.page>=max?'disabled':''}>Вперёд →</button>`;
}

function openDossier(igId) {
  const ig = FOREIGN_CITIZENS.find(x=>x.id===igId);
  if(!ig) return;
  
  const relCases = CASES.filter(c=>c.ig===igId);
  const caseRows = relCases.map(c=>`
    <tr>
      <td><span class="badge badge-blue">${c.id}</span></td>
      <td>${typeLabel(c.type)}</td>
      <td>${badgeForStatus(c.status)}</td>
      <td>${fmtDate(c.created)}</td>
    </tr>
  `).join('');
  
  const borderHistory = generateBorderHistory(ig);
  
  document.getElementById('modal-dossier-title').innerHTML = `<svg class="ic" aria-hidden="true"><use href="#i-folder-open"/></svg> Электронное досье: ${ig.name}`;
  document.getElementById('modal-dossier-body').innerHTML = `
    <div class="tabs-nav mb-2">
      <button class="tab-btn active" onclick="switchTab(event,'tab-main')">Основные данные</button>
      <button class="tab-btn" onclick="switchTab(event,'tab-docs')">Документы</button>
      <button class="tab-btn" onclick="switchTab(event,'tab-border')">История границ (ФСБ)</button>
      <button class="tab-btn" onclick="switchTab(event,'tab-statuses')">Статусы</button>
      <button class="tab-btn" onclick="switchTab(event,'tab-admin')">Адм. практика</button>
    </div>
    
    <div id="tab-main" class="tab-content active">
      <div class="dossier-top">
        <div class="dossier-photo">${igPhoto(ig)}</div>
        <div class="dossier-info">
          <div class="dossier-name">${ig.name}</div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:8px">${ig.nameEn}</div>
          <div class="dossier-meta">
            <span class="badge badge-blue">${ig.nationality}</span>
            <span class="badge badge-gray">${ig.sex==='М'?'Муж.':'Жен.'}</span>
            ${ig.trap?`<span class="badge badge-red"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> ${ig.trap.toUpperCase()}</span>`:''}
          </div>
        </div>
      </div>
      <div class="form-row form-row-2 mt-2">
        <div class="form-group"><label class="form-label">Дата рождения</label><input class="form-input" value="${ig.dob}" readonly></div>
        <div class="form-group"><label class="form-label">ИНН</label><input class="form-input" value="${ig.inn}" readonly></div>
        <div class="form-group"><label class="form-label">Цель въезда</label><input class="form-input" value="${ig.entryPurpose}" readonly></div>
        <div class="form-group"><label class="form-label">ID в системе</label><input class="form-input" value="${ig.id}" readonly></div>
      </div>
    </div>
    
    <div id="tab-docs" class="tab-content">
      <div class="form-row form-row-2">
        <div class="form-group"><label class="form-label">Серия/Номер паспорта</label><input class="form-input ${checkPassportExpiry(ig)?'error':''}" value="${ig.passport}" readonly></div>
        <div class="form-group"><label class="form-label">Срок действия</label><input class="form-input ${checkPassportExpiry(ig)?'error':''}" value="${ig.passportExp}" readonly>${checkPassportExpiry(ig)?'<div class="form-error">Истекает!</div>':''}</div>
        <div class="form-group"><label class="form-label">№ Миграционной карты</label><input class="form-input" value="${ig.mcard}" readonly></div>
        <div class="form-group"><label class="form-label">Дата въезда (ПС ФСБ)</label><input class="form-input" value="${ig.entryDate}" readonly></div>
      </div>
    </div>
    
    <div id="tab-border" class="tab-content">
      <div class="alert alert-info mb-2">История пересечений ГГ РФ из базы ПС ФСБ</div>
      <div class="timeline">${borderHistory}</div>
    </div>
    
    <div id="tab-statuses" class="tab-content">
      <div class="alert alert-info mb-2">Текущие разрешительные статусы</div>
      <div class="text-xs text-muted mb-1">Цифровой контроль: <strong>${aminaCheck(ig).title}</strong></div>
      ${relCases.length ? `
        <table><thead><tr><th>Дело</th><th>Тип</th><th>Статус</th><th>Дата</th></tr></thead>
        <tbody>${caseRows}</tbody></table>` : 
        '<div class="text-muted" style="padding:16px;text-align:center">Разрешительных статусов не выявлено</div>'}
    </div>
    
    <div id="tab-admin" class="tab-content">
      <div class="alert alert-info mb-2">Административная практика (штрафы, выдворения, запреты)</div>
      <div class="timeline">
        ${ig.trap === 'biometric_dup' ? `
          <div class="tl-item"><div class="tl-dot danger"></div><div class="tl-date">15.07.2023</div><div class="tl-text text-danger font-bold">Депортация из РФ. Запрет въезда на 5 лет.</div></div>
        ` : '<div class="text-muted" style="padding:12px">Административных взысканий не зафиксировано</div>'}
      </div>
    </div>
  `;
  openModal('modal-dossier');
}

function generateBorderHistory(ig) {
  const entries = [
    {date: ig.entryDate, dir:'Въезд', cp:'Шереметьево (ШРМ)', doc:ig.passport},
    {date:'2024-11-05', dir:'Выезд', cp:'Домодедово (ДМД)', doc:ig.passport},
    {date:'2024-09-12', dir:'Въезд', cp:'Шереметьево (ШРМ)', doc:ig.passport},
  ];
  return entries.map(e=>`
    <div class="tl-item">
      <div class="tl-dot ${e.dir==='Въезд'?'success':''}"></div>
      <div class="tl-date">${e.date}</div>
      <div class="tl-text">${e.dir} — КПП: ${e.cp} — Документ: ${e.doc}</div>
    </div>
  `).join('');
}

function openBorderHistory(igId) {
  openDossier(igId);
  setTimeout(()=>{
    document.querySelectorAll('.tab-btn')[2]?.click();
  }, 100);
}

// ── VIOLATIONS ────────────────────────────────────
function renderViolations() {
  setContentTitle('Нарушения миграционного законодательства', 'Иммиграционный контроль');
  
  const violations = [
    { ig:'IG-002', type:'Фиктивный чек НДФЛ', severity:'high', date:'2025-12-01', art:'ст.322.3 УК РФ', status:'Выявлено' },
    { ig:'IG-004', type:'Нахождение в розыске', severity:'critical', date:'2025-11-28', art:'ст.158 УК РФ', status:'Передано в ОВД' },
    { ig:'IG-006', type:'Смена личности (биометрия)', severity:'critical', date:'2025-12-05', art:'ст.327 УК РФ', status:'Расследование' },
    { ig:'IG-010', type:'Резиновая квартира', severity:'medium', date:'2025-11-15', art:'ст.322.2 УК РФ', status:'Рапорт в ОИК' },
    { ig:'IG-005', type:'Истекающий паспорт', severity:'low', date:'2025-12-10', art:'ст.18.8 КоАП', status:'Уведомлен' },
  ];
  
  const svMap = {critical:'badge-red', high:'badge-red', medium:'badge-yellow', low:'badge-green'};
  const svLabel = {critical:'Критическое', high:'Высокое', medium:'Среднее', low:'Низкое'};
  const rows = violations.map(v=>{
    const ig = getIG(v.ig);
    return `<tr>
      <td>${igPhoto(ig,true)} <strong>${ig?.name}</strong></td>
      <td>${v.type}</td>
      <td><span class="badge ${svMap[v.severity]}">${svLabel[v.severity]}</span></td>
      <td>${v.date}</td>
      <td class="text-sm">${v.art}</td>
      <td><span class="badge badge-blue">${v.status}</span></td>
    </tr>`;
  }).join('');
  
  setContent(`
    <div class="alert alert-danger mb-2">Выявленные нарушения требуют немедленной реакции. Критические нарушения автоматически фиксируются в журнале аудита.</div>
    <div class="card">
      <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Реестр нарушений</span></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ИГ</th><th>Тип нарушения</th><th>Степень</th><th>Дата</th><th>Статья</th><th>Статус</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `);
}
