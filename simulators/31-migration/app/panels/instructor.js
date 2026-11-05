'use strict';
// ── INSTRUCTOR PANEL ──────────────────────────────
function generateCadets() {
  const names = SCENARIOS.cadets.map(c => c.name);
  const icons = names.map(() => icon('officer'));
  STATE.cadets = names.map((n,i)=>({
    name: n,
    icon: icons[i],
    done: Math.floor(Math.random()*12)+3,
    total: 15,
    errors: {low: Math.floor(Math.random()*3), med: Math.floor(Math.random()*2), crit: Math.floor(Math.random()*2)},
    score: 70 + Math.floor(Math.random()*60),
    lastAction: new Date(Date.now() - Math.random()*600000),
    online: Math.random() > 0.2,
    currentCase: `ДЕЛО-${1000+Math.floor(Math.random()*12)}`
  }));
}

function renderInstructor() {
  setContentTitle('АРМ Преподавателя', 'Конструктор кейсов · Мониторинг курсантов · Аналитика');
  document.getElementById('nav-instructor')?.classList.add('active');
  
  const cadetRows = STATE.cadets.map(c=>{
    const gr = calcGrade(c.score);
    return `<div class="cadet-row">
      <div class="cadet-avatar">${c.icon}</div>
      <div class="cadet-info">
        <div class="cadet-name">${c.name}</div>
        <div class="cadet-stat">Дел: ${c.done}/${c.total} | Ош: ${c.errors.low}/${c.errors.med}/${c.errors.crit} | ${c.currentCase}</div>
        <div class="progress-bar mt-1" style="height:4px"><div class="progress-fill ${gr.cls==='a5'||gr.cls==='a4'?'success':gr.cls==='a3'?'warning':'danger'}" style="width:${c.done/c.total*100}%"></div></div>
      </div>
      <div>
        <div class="cadet-score" style="color:${gr.cls==='a2'?'var(--danger)':gr.cls==='a3'?'var(--warning)':'var(--success)'}">${c.score}</div>
        <div class="text-xs text-muted text-center">${gr.label}</div>
      </div>
      ${c.online ? '<div class="live-dot" title="Онлайн"></div>' : '<div style="width:8px;height:8px;border-radius:50%;background:var(--border)"  title="Оффлайн"></div>'}
      <button class="btn btn-ghost btn-sm" onclick="injectCase('${c.name}')">Подкинуть кейс</button>
    </div>`;
  }).join('');
  
  const s = STATE.instructorSettings;
  
  setContent(`
    <div class="tabs-nav mb-3">
      <button class="tab-btn active" onclick="switchTab(event,'instr-tab-monitor')"><svg class="ic" aria-hidden="true"><use href="#i-monitor"/></svg> Мониторинг взвода</button>
      <button class="tab-btn" onclick="switchTab(event,'instr-tab-gen')"><svg class="ic" aria-hidden="true"><use href="#i-sliders"/></svg> Генератор кейсов</button>
      <button class="tab-btn" onclick="switchTab(event,'instr-tab-presets')"><svg class="ic" aria-hidden="true"><use href="#i-layers"/></svg> Пресеты</button>
      <button class="tab-btn" onclick="switchTab(event,'instr-tab-report')"><svg class="ic" aria-hidden="true"><use href="#i-bar-chart"/></svg> Итоговый отчёт</button>
    </div>
    
    <div id="instr-tab-monitor" class="tab-content active">
      <div class="card mb-2">
        <div class="card-header" style="justify-content:space-between">
          <span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-users"/></svg> Live-дашборд взвода</span>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="live-dot"></div>
            <span class="text-sm text-muted">Онлайн: ${STATE.cadets.filter(c=>c.online).length}/${STATE.cadets.length}</span>
            <button class="btn btn-danger btn-sm" onclick="endSession()"><svg class="ic" aria-hidden="true"><use href="#i-stop"/></svg> Завершить сессию</button>
          </div>
        </div>
        <div id="cadet-list">${cadetRows}</div>
      </div>
    </div>
    
    <div id="instr-tab-gen" class="tab-content">
      <div class="card">
        <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-sliders"/></svg> Стохастический генератор (Вариант А)</span></div>
        <div class="card-body">
          ${SCENARIOS.sliders.map(sliderRowHTML).join('')}
          <div class="divider"></div>
          <button class="btn btn-primary" onclick="applySettings()"><svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg> Применить настройки к сессии</button>
        </div>
      </div>
    </div>
    
    <div id="instr-tab-presets" class="tab-content">
      <div class="section-title">Тематические пресеты (Вариант Б)</div>
      <div class="form-row form-row-2" style="gap:12px">
        ${SCENARIOS.presets.map(p=>`
          <div class="card">
            <div class="card-body">
              <div class="big-ic" style="font-size:28px">${icon(p.icon)}</div>
              <div class="font-bold">${p.name}</div>
              <div class="text-sm text-muted mt-1 mb-2">${p.desc}</div>
              <button class="btn btn-primary btn-sm" onclick="activatePreset('${p.id}')"><svg class="ic" aria-hidden="true"><use href="#i-play"/></svg> Запустить пресет</button>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div class="section-title mt-3">Мануальный режим (Вариант В)</div>
      <div class="card">
        <div class="card-body">
          <div class="form-row form-row-2">
            <div class="form-group">
              <label class="form-label">Выбрать курсанта</label>
              <select class="form-select" id="manual-cadet">
                ${STATE.cadets.map(c=>`<option>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Тип ловушки</label>
              <select class="form-select" id="manual-trap">
                ${SCENARIOS.traps.map(x=>`<option value="${x.id}">${x.name}</option>`).join('')}
              </select>
            </div>
          </div>
          <button class="btn btn-danger" onclick="injectManualTrap()"><svg class="ic" aria-hidden="true"><use href="#i-target"/></svg> Подкинуть ловушку курсанту</button>
        </div>
      </div>
    </div>
    
    <div id="instr-tab-report" class="tab-content">
      <div class="card mb-2">
        <div class="card-header" style="justify-content:space-between">
          <span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-bar-chart"/></svg> Сводная ведомость взвода</span>
          <button class="btn btn-primary btn-sm" onclick="exportReport()"><svg class="ic" aria-hidden="true"><use href="#i-download"/></svg> Экспорт</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>ФИО курсанта</th><th>Обработано дел</th><th>Ошибки (Н/В/К)</th><th>Итоговый балл</th><th>Оценка</th><th>Детали</th></tr></thead>
            <tbody>
              ${STATE.cadets.map(c=>{
                const gr = calcGrade(c.score);
                return `<tr>
                  <td>${c.icon} ${c.name}</td>
                  <td>${c.done} / ${c.total}</td>
                  <td>${c.errors.low} / ${c.errors.med} / ${c.errors.crit}</td>
                  <td class="font-bold">${c.score}</td>
                  <td><span class="badge ${gr.cls==='a5'||gr.cls==='a4'?'badge-green':gr.cls==='a3'?'badge-yellow':'badge-red'}">${gr.g} — ${gr.label}</span></td>
                  <td><button class="btn btn-ghost btn-sm" onclick="showCadetDetail('${c.name}')">Подробно</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-trending-up"/></svg> Аналитика ошибок взвода</span></div>
        <div class="card-body">
          <div class="alert alert-warning"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> 65% взвода не справились с проверкой правила 90/180</div>
          <div class="alert alert-success"><svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg> 80% взвода успешно выявляют фальшивые медицинские справки</div>
          <div class="alert alert-info"><svg class="ic" aria-hidden="true"><use href="#i-info"/></svg> Рекомендация: повторить тему «Финансовый контроль патентов (НДФЛ)» на следующей лекции</div>
        </div>
      </div>
    </div>
  `);
}

function updateSlider(key, val) {
  STATE.instructorSettings[key] = parseInt(val);
  const el = document.getElementById(`sl-${key}-val`);
  if(el) el.textContent = fmtSlider(SCENARIOS.sliders.find(x => x.key === key), val);
}

function applySettings() {
  toast('Настройки применены к сессии!', 'success');
  logAudit('НАСТРОЙКИ', `Генератор: ${JSON.stringify(STATE.instructorSettings)}`);
}

function activatePreset(id) {
  const p = SCENARIOS.presets.find(x => x.id === id);
  toast(`Пресет «${p?.short || id}» активирован!`, 'success');
  logAudit('ПРЕСЕТ', `Активирован: ${id}`);
}

function injectCase(cadetName) {
  toast(`Кейс подброшен курсанту ${cadetName}`, 'info');
}

function injectManualTrap() {
  const cadet = document.getElementById('manual-cadet')?.value;
  const trap = document.getElementById('manual-trap')?.value;
  const tr = SCENARIOS.traps.find(x => x.id === trap);
  toast(`Ловушка «${tr?.short || trap}» подброшена курсанту ${cadet}!`, 'warning');
  logAudit('МАНУАЛЬНЫЙ КЕЙС', `Курсант: ${cadet}, Ловушка: ${trap}`);
}

function endSession() {
  renderSessionReport();
}

function showCadetDetail(name) {
  const c = STATE.cadets.find(x=>x.name===name);
  if(!c) return;
  const gr = calcGrade(c.score);
  document.getElementById('modal-dossier-title').innerHTML = `<svg class="ic" aria-hidden="true"><use href="#i-user"/></svg> Профиль: ${c.name}`;
  document.getElementById('modal-dossier-body').innerHTML = `
    <div class="dossier-top">
      <div class="dossier-photo" style="font-size:28px">${c.icon}</div>
      <div class="dossier-info">
        <div class="dossier-name">${c.name}</div>
        <div class="score-display mt-1">
          <div class="score-num">${c.score}</div>
          <div class="score-grade ${gr.cls}">${gr.g}</div>
          <span class="badge ${gr.cls==='a5'||gr.cls==='a4'?'badge-green':gr.cls==='a3'?'badge-yellow':'badge-red'}">${gr.label}</span>
        </div>
      </div>
    </div>
    <div class="divider"></div>
    <div class="timeline">
      <div class="tl-item"><div class="tl-dot success"></div><div class="tl-date">09:00</div><div class="tl-text">Начало сессии</div></div>
      <div class="tl-item"><div class="tl-dot success"></div><div class="tl-date">09:12</div><div class="tl-text text-success">Дело #3421 — успешно выявил адрес с признаками «резиновой квартиры» (+50 баллов)</div></div>
      ${c.errors.crit > 0 ? `<div class="tl-item"><div class="tl-dot danger"></div><div class="tl-date">09:35</div><div class="tl-text text-danger">Критическая ошибка! Одобрен ВНЖ при активном алерте ИБД-Р — лицо в розыске проигнорировано (-100 баллов)</div></div>` : ''}
      ${c.errors.med > 0 ? `<div class="tl-item"><div class="tl-dot danger"></div><div class="tl-date">09:48</div><div class="tl-text text-warning">Пропущен просроченный НДФЛ-чек (-50 баллов)</div></div>` : ''}
      <div class="tl-item"><div class="tl-dot"></div><div class="tl-date">10:30</div><div class="tl-text">Завершение сессии</div></div>
    </div>
    <div class="divider"></div>
    <div class="form-row form-row-3" style="gap:8px">
      <div class="card"><div class="card-body" style="text-align:center"><div style="font-size:22px;font-weight:800;color:var(--danger)">${c.errors.crit}</div><div class="text-xs text-muted">Критических</div></div></div>
      <div class="card"><div class="card-body" style="text-align:center"><div style="font-size:22px;font-weight:800;color:var(--warning)">${c.errors.med}</div><div class="text-xs text-muted">Высоких</div></div></div>
      <div class="card"><div class="card-body" style="text-align:center"><div style="font-size:22px;font-weight:800;color:var(--success)">${c.errors.low}</div><div class="text-xs text-muted">Низких</div></div></div>
    </div>
  `;
  openModal('modal-dossier');
}
