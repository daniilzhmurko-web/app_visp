'use strict';
// ── RVP/VNZh MODULE ───────────────────────────────
function renderRvpModule() {
  setContentTitle('Модуль: РВП и ВНЖ', 'Оформление разрешительных статусов — расширенный контур безопасности');
  updateInstructions('rvp', 0);
  
  const statusCases = CASES.filter(c=>c.type==='rvp'||c.type==='vnzh');
  const rows = statusCases.map(c=>{
    const ig = getIG(c.ig);
    const deadline = c.type==='rvp' ? 60 : 120;
    return `<tr onclick="renderRvpCase(getCase('${c.id}'))" class="${rowColor(c.daysOld)}">
      <td><span class="badge badge-blue">${c.id}</span></td>
      <td><strong>${ig?.name}</strong></td>
      <td>${ig?.nationality}</td>
      <td><span class="badge ${c.type==='rvp'?'badge-yellow':'badge-blue'}">${c.type.toUpperCase()}</span></td>
      <td>${badgeForStatus(c.status)}</td>
      <td>${c.checksDone ? '<span class="badge badge-green">✓</span>' : '<span class="badge badge-red">Нет</span>'}</td>
    </tr>`;
  }).join('');
  
  setContent(`
    <div class="alert alert-info mb-2"><strong>Приказы МВД №407/2020 (РВП) и №417/2020 (ВНЖ).</strong> Срок рассмотрения РВП — до 60 сут., ВНЖ — до 4 мес. Обязательны: биометрия, полный веерный запрос (ИБД-Ф/Р, ФСБ, Минздрав, ФССП), подпись УКЭП начальника.</div>
    <div class="card">
      <div class="card-header" style="justify-content:space-between">
        <span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-file-text"/></svg> Заявления на РВП / ВНЖ</span>
        <button class="btn btn-primary btn-sm" onclick="openNewCase()">＋ Новое заявление</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>ИГ</th><th>Гражданство</th><th>Тип</th><th>Статус</th><th>Проверки</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `);
}

function renderRvpCase(c) {
  if(!c) return;
  STATE.currentCaseId = c.id;
  const ig = getIG(c.ig);
  const isVnzh = c.type === 'vnzh';
  setContentTitle(`${c.id} — ${isVnzh?'ВНЖ':'РВП'}`, `${ig?.name} | ${ig?.nationality}`);
  updateInstructions('rvp_case', c.step||0);
  
  const stages = ['Зарегистрировано','На проверке','Подготовка решения','На подписи','Одобрено/Отказано'];
  const curStage = rvpStageIndex(c);
  
  const fingersHtml = renderFingerprintWidget(c.id);
  
  setContent(`
    <div class="stage-indicator mb-3">
      ${stages.map((s,i)=>`
        <div class="stage-item">
          <div class="stage-box ${i<curStage?'done':i===curStage?'active':''}">${s}</div>
          ${i<stages.length-1?'<div class="stage-arrow">→</div>':''}
        </div>
      `).join('')}
    </div>

    <div class="form-row form-row-2" style="gap:16px">
      <div>
        <div class="section-title">Электронное учётное дело</div>
        <div class="card mb-2">
          <div class="card-header"><span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-folder"/></svg> Досье заявителя</span></div>
          <div class="card-body">
            <div class="dossier-top">
              <div class="dossier-photo">${igPhoto(ig)}</div>
              <div class="dossier-info">
                <div class="dossier-name">${ig?.name}</div>
                <div style="font-size:12px;color:var(--text3)">${ig?.nameEn}</div>
                <div class="dossier-meta">
                  <span class="badge badge-blue">${ig?.nationality}</span>
                  <span class="badge ${isVnzh?'badge-blue':'badge-yellow'}">${isVnzh?'ВНЖ':'РВП'}</span>
                </div>
              </div>
            </div>
            <div class="divider"></div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Дата рождения</label>
                <input class="form-input" value="${ig?.dob}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Паспорт</label>
                <input class="form-input ${checkPassportExpiry(ig)?'error':'success'}" value="${ig?.passport}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Дата въезда</label>
                <input class="form-input" value="${ig?.entryDate}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">ИНН</label>
                <input class="form-input" value="${ig?.inn||'Не присвоен'}" readonly>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Основание подачи <span class="required">*</span></label>
              <select class="form-select" id="rvp-basis">
                ${isVnzh ? `
                  <option>Наличие РВП</option>
                  <option>Носитель русского языка (НРЯ)</option>
                  <option>ВКС (Высококвалиф. специалист)</option>
                  <option>Гражданин Беларуси / Казахстана</option>
                ` : `
                  <option>В пределах квоты</option>
                  <option>Брак с гражданином РФ</option>
                  <option>Рождён на территории РСФСР</option>
                  <option>Участник Гос. программы переселения</option>
                `}
              </select>
            </div>
            ${isVnzh ? `
            <div class="form-group">
              <label class="form-label">Доход (справка 2-НДФЛ)</label>
              <input class="form-input" id="income-val" type="number" value="${ig?.trap==='low_income'?8000:45000}" oninput="checkIncome(this.value)">
              <div class="form-hint">Прожиточный минимум Москвы × 12 = 216 000 руб./год</div>
            </div>` : ''}
          </div>
        </div>

        <div class="section-title">Биометрия (АДИС «Папилон»)</div>
        ${fingersHtml}
      </div>

      <div>
        <div class="section-title">Консоль межведомственных проверок</div>
        <div class="card mb-2">
          <div class="card-body">
            <div id="check-console-${c.id}">
              ${renderCheckConsole(c)}
            </div>
            <button class="btn btn-primary w-full mt-2" onclick="runAllChecks('${c.id}')"><svg class="ic" aria-hidden="true"><use href="#i-play"/></svg> Запустить веерный запрос (СМЭВ)</button>
          </div>
        </div>

        <div class="section-title">Формирование решения</div>
        <div class="card">
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Проект решения</label>
              <select class="form-select" id="decision-draft-${c.id}">
                <option value="">— Выберите —</option>
                <option value="approve">Выдать разрешение</option>
                <option value="reject_doc">Отказать — недостаточность документов</option>
                <option value="reject_criminal">Отказать — ст. 7/9 ФЗ-115 (криминал)</option>
                <option value="reject_medical">Отказать — медицинские основания (п.10 ст.7)</option>
                <option value="reject_security">Отказать — решение ФСБ (п.1 ст.9)</option>
                <option value="reject_bio">Отказать — подложные документы (п.4 ст.7)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Основание (номер документа / статья)</label>
              <input class="form-input" id="decision-reason-${c.id}" placeholder="Напр.: Сообщение ФСБ №ХХ-2025 / пп.1 п.1 ст.9 ФЗ-115">
            </div>
            <button class="btn btn-primary w-full" onclick="submitRvpDecision('${c.id}')">
              <svg class="ic" aria-hidden="true"><use href="#i-send"/></svg> Направить на подпись начальнику (УКЭП)
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="divider"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="showScreen('rvp-module')">← Назад</button>
      <button class="btn btn-outline" onclick="openDossier('${ig?.id}')"><svg class="ic" aria-hidden="true"><use href="#i-folder-open"/></svg> Досье ИГ</button>
    </div>
  `);
}

function checkIncome(val) {
  const min = 216000;
  if(parseFloat(val)*12 < min) {
    toast('Доход ниже прожиточного минимума × 12 мес.!', 'warning');
  }
}

function renderCheckConsole(c) {
  const checks = STATE.checks[c.id];
  if(!checks) {
    return `<table class="check-table" style="width:100%;font-size:12px">
      <thead><tr><th>Ведомство</th><th>Тип проверки</th><th>Статус</th></tr></thead>
      <tbody>
        ${[['ИБД-Р МВД','Розыск / судимости'],['ИБД-Ф МВД','Криминальный учёт'],['ФСБ России','Нежелательность / запрет въезда'],['Минздрав','Медицинские основания'],['ФССП','Долги / производства'],['ФНС','Налоговый учёт / ИНН']].map(([d,t])=>`
          <tr><td>${d}</td><td>${t}</td><td><span class="badge badge-gray">Ожидание</span></td></tr>
        `).join('')}
      </tbody>
    </table>`;
  }
  return renderCheckResults(checks, c);
}

function renderCheckResults(checks, c) {
  const rows = Object.entries(checks).map(([dept, result])=>{
    const st = result.status;
    const badge = st==='clear'?'badge-green':st==='alert'?'badge-red':'badge-yellow';
    const label = st==='clear'?'✓ Очищено':st==='alert'?'<svg class="ic" aria-hidden="true"><use href="#i-alert"/></svg> Алерт!':'<svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Предупреждение';
    return `<tr>
      <td>${dept}</td>
      <td>${result.type}</td>
      <td>${fmtDateTime(result.date)}</td>
      <td><span class="badge ${badge}">${label}</span></td>
      <td>${st!=='clear'?`<button class="btn btn-ghost btn-sm" onclick="showCheckLog('${dept}','${c.id}')">Лог</button>`:''}</td>
    </tr>`;
  }).join('');
  
  return `<table class="check-table" style="width:100%;font-size:12px">
    <thead><tr><th>Ведомство</th><th>Тип</th><th>Дата</th><th>Статус</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function runAllChecks(caseId) {
  const c = getCase(caseId);
  const ig = getIG(c?.ig);
  if(!c) return;
  
  toast('Отправка запросов в СМЭВ...', 'info');
  logAudit('ПРОВЕРКИ', `Запущен веерный запрос по делу ${caseId}`, { category: 'CHECK', caseId });
  addScore(5, 'Выполнен веерный запрос межведомственных проверок');
  
  // Simulate async checks
  const depts = {
    'ИБД-Р МВД': {type:'Розыск', delay:800},
    'ИБД-Ф МВД': {type:'Криминал', delay:1200},
    'ФСБ России': {type:'Нежелательность / запрет', delay:1600},
    'Минздрав': {type:'Медицина', delay:2000},
    'ФССП': {type:'Долги', delay:2400},
    'ФНС': {type:'Налоги / ИНН', delay:2800},
  };
  
  if(!STATE.checks[caseId]) STATE.checks[caseId] = {};
  
  // Set all to loading
  const consoleEl = document.getElementById(`check-console-${caseId}`);
  if(consoleEl) {
    consoleEl.innerHTML = `<div class="flex items-center gap-2"><div class="spinner"></div> <span class="text-sm">Отправка запросов в СМЭВ...</span></div>`;
  }
  
  let completed = 0;
  const total = Object.keys(depts).length;
  
  Object.entries(depts).forEach(([dept, info])=>{
    setTimeout(()=>{
      let status = 'clear';
      let detail = '';
      
      // Apply traps
      if(ig?.trap === 'wanted' && dept === 'ИБД-Р МВД') {
        status = 'alert';
        detail = `Совпадение 95%: ${ig.name} = Лицо в федеральном розыске (кража, ст.158 УК РФ)`;
        showCriticalAlert('wanted', c);
      }
      if(ig?.trap === 'fsb_ban' && dept === 'ФСБ России') {
        status = 'alert';
        detail = 'Код ответа: 2.1 — Решение о нежелательности пребывания. Гриф: ДСП. Доступен только номер документа: ФСБ-2025-0047';
        showCriticalAlert('fsb_ban', c);
      }
      if(ig?.trap === 'fake_medical' && dept === 'Минздрав') {
        status = 'alert';
        detail = `Бланк №44521: выдан другому лицу. Заявитель состоит на учёте в наркологическом диспансере.`;
      }
      
      STATE.checks[caseId][dept] = { type: info.type, status, detail, date: new Date() };
      completed++;
      
      if(completed === total) {
        c.checksDone = true;
        const hasAlerts = Object.values(STATE.checks[caseId]).some(r=>r.status==='alert');
        c.checksResult = hasAlerts ? 'Выявлены совпадения!' : 'нарушений не выявлено';
        
        const consoleEl2 = document.getElementById(`check-console-${caseId}`);
        if(consoleEl2) consoleEl2.innerHTML = renderCheckResults(STATE.checks[caseId], c);
        
        if(!hasAlerts) {
          toast('Все проверки пройдены. Нарушений не выявлено.', 'success');
        } else {
          toast('Обнаружены совпадения в базах данных!', 'danger');
        }
        
        // Update patent button if exists
        const patBtn = document.getElementById('btn-issue-patent');
        if(patBtn && c.fingerprintsDone) patBtn.removeAttribute('disabled');
      }
    }, info.delay);
  });
}

function showCheckLog(dept, caseId) {
  const c = getCase(caseId);
  const check = STATE.checks[caseId]?.[dept];
  if(!check) return;
  
  document.getElementById('modal-dossier-title').innerHTML = `<svg class="ic" aria-hidden="true"><use href="#i-search"/></svg> Расширенный лог: ${dept}`;
  document.getElementById('modal-dossier-body').innerHTML = `
    <div class="alert alert-danger mb-2"><strong>Статус:</strong> Выявлены совпадения!</div>
    <div class="form-group">
      <label class="form-label">Ведомство</label>
      <input class="form-input" value="${dept}" readonly>
    </div>
    <div class="form-group">
      <label class="form-label">Тип проверки</label>
      <input class="form-input" value="${check.type}" readonly>
    </div>
    <div class="form-group">
      <label class="form-label">Дата ответа</label>
      <input class="form-input" value="${fmtDateTime(check.date)}" readonly>
    </div>
    <div class="form-group">
      <label class="form-label">Детали совпадения</label>
      <textarea class="form-textarea" readonly>${check.detail||'Совпадение выявлено. Запросите расширенный доступ.'}</textarea>
    </div>
    <div class="alert alert-warning"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Данное совпадение является основанием для немедленных действий согласно внутренней инструкции.</div>
  `;
  openModal('modal-dossier');
}

function submitRvpDecision(caseId) {
  const c = getCase(caseId);
  const ig = getIG(c?.ig);
  const draft = document.getElementById(`decision-draft-${caseId}`)?.value;
  const reason = document.getElementById(`decision-reason-${caseId}`)?.value;
  
  if(!draft) { toast('Выберите проект решения!', 'warning'); return; }
  if(!c.checksDone) { addScore(-15, 'Попытка принять решение без межведомственных проверок', { category:'DECISION', extra:{ caseType:c.type } }); toast('Нельзя принять решение без выполнения проверок!', 'danger'); return; }
  // Дактилоскопия обязательна именно для ОДОБРЕНИЯ РВП/ВНЖ — отказ без неё
  // не является нарушением (снимать биометрию у отказника не требуется),
  // поэтому штраф применяется только к варианту draft === 'approve'.
  if(draft === 'approve' && !c.fingerprintsDone) {
    addScore(-100, 'Одобрение РВП/ВНЖ без дактилоскопической регистрации — критическое нарушение', { category:'DECISION', extra:{ caseType:c.type, reason:'no_fingerprints' } });
    toast('КРИТИЧЕСКАЯ ОШИБКА! Нельзя одобрить без дактилоскопии!', 'danger');
    return;
  }
  
  const hasAlerts = Object.values(STATE.checks[caseId]||{}).some(r=>r.status==='alert');
  const decisionMeta = { category:'DECISION', extra:{ caseType:c.type, trapType: ig?.trap || null, draft } };
  
  if(draft === 'approve' && hasAlerts) {
    addScore(-100, 'Одобрение документа при наличии критических алертов безопасности!', decisionMeta);
    toast('КРИТИЧЕСКАЯ ОШИБКА! Нельзя одобрить при наличии алертов!', 'danger');
    return;
  }
  
  if(draft !== 'approve' && !hasAlerts) {
    addScore(-20, 'Необоснованный отказ при чистых проверках', decisionMeta);
    toast('Все проверки чистые — отказ не обоснован!', 'warning');
  }
  
  if(draft === 'approve') {
    c.status = 'approved'; c.decision = 'approve';
    addScore(50, `Корректное одобрение ${c.type.toUpperCase()}`, decisionMeta);
    toast('Дело направлено на УКЭП начальника!', 'success');
  } else {
    c.status = 'rejected'; c.decision = 'reject';
    const correctChoice = {
      'wanted':'reject_criminal', 'fsb_ban':'reject_security',
      'fake_medical':'reject_medical', 'biometric_dup':'reject_bio'
    }[ig?.trap];
    const rejectMeta = { ...decisionMeta, extra:{ ...decisionMeta.extra, correctChoice: correctChoice || null } };
    if(correctChoice && draft === correctChoice) {
      addScore(50, 'Правильно выбрана статья для отказа', rejectMeta);
    } else if(correctChoice && draft !== correctChoice) {
      addScore(-20, 'Отказ по неверному основанию — выбрана не та статья', rejectMeta);
    } else {
      addScore(30, `Корректный отказ ${c.type.toUpperCase()}`, rejectMeta);
    }
    toast('Решение об отказе направлено на УКЭП начальника', 'info');
  }
  
  logAudit('РЕШЕНИЕ', `Дело ${caseId}: ${draft}, основание: ${reason||'—'}`, { category:'DECISION', caseId, extra:{ caseType:c.type } });
  updateQueueBadge();
}

// ── CRITICAL ALERTS ───────────────────────────────
function showCriticalAlert(type, c) {
  STATE.activeAlertCase = c;
  const messages = {
    wanted: {
      title:'<svg class="ic" aria-hidden="true"><use href="#i-alert"/></svg> ОБНАРУЖЕНО СОВПАДЕНИЕ В ИБД-Р!',
      body:`<p>При проверке заявителя <strong>${getIG(c?.ig)?.name}</strong> по базе ИБД-Р МВД выявлено совпадение на 95% с лицом, находящимся в <strong>федеральном розыске</strong>.</p>
      <div class="alert alert-danger mt-2"><strong>ФИО в розыске:</strong> совпадение по ФИО и дате рождения<br><strong>Статья:</strong> ст. 158 УК РФ (кража)<br><strong>Инициатор розыска:</strong> ГУ МВД России</div>
      <div class="alert alert-warning mt-2">Правильное действие: <strong>заблокировать</strong> выдачу документов и <strong>уведомить дежурную часть</strong>.</div>`,
      correctAction: 'block_suspect'
    },
    biometric_dup: {
      title:'<svg class="ic" aria-hidden="true"><use href="#i-alert"/></svg> БИОМЕТРИЧЕСКИЙ АЛЕРТ — АДИС «ПАПИЛОН»!',
      body:`<p>При сканировании обнаружено совпадение отпечатков!</p>
      <div class="alert alert-danger mt-2">100% совпадение отпечатков с гражданином <strong>Гасановым М.Р.</strong>, которому ранее было запрещено пересечение границы РФ.</div>
      <div class="alert alert-warning mt-2">Правильное действие: <strong>приостановить рассмотрение</strong> и <strong>передать материалы в дознание</strong> (ст.327 УК РФ).</div>`,
      correctAction: 'block_bio'
    },
    fsb_ban: {
      title:'<svg class="ic" aria-hidden="true"><use href="#i-alert"/></svg> ОТВЕТ ФСБ РОСИИ — НЕЖЕЛАТЕЛЬНОСТЬ ПРЕБЫВАНИЯ',
      body:`<p>По запросу ФСБ России получен ответ.</p>
      <div class="alert alert-danger mt-2">Код ответа: 2.1 — Решение о нежелательности пребывания в РФ. Документ засекречен (ДСП).</div>
      <div class="alert alert-warning mt-2">Правильное действие: отказать в выдаче ВНЖ согласно <strong>пп.1 п.1 ст.9 ФЗ-115</strong>. В поле основания указать номер сообщения ФСБ.</div>`,
      correctAction: 'reject_security'
    }
  };
  
  const msg = messages[type];
  if(!msg) return;
  
  document.getElementById('modal-alert-body').innerHTML = `<h3 style="color:var(--danger);margin-bottom:12px">${msg.title}</h3>${msg.body}`;
  STATE.activeAlertCase.alertType = type;
  openModal('modal-alert');
}

function handleAlertAction() {
  const c = STATE.activeAlertCase;
  if(!c) { closeModal('modal-alert'); return; }
  
  const type = c.alertType;
  const alertMeta = { category: 'ALERT', caseId: c.id, extra: { alertType: type, chosenAction: 'handled' } };
  if(type === 'wanted') {
    addScore(100, 'Выявлено лицо в розыске — немедленная блокировка', alertMeta);
    toast('Правильное действие! Дежурная часть уведомлена.', 'success');
    c.status = 'rejected';
  } else if(type === 'biometric_dup') {
    addScore(100, 'Биометрический капкан — смена личности обнаружена', alertMeta);
    toast('Материалы переданы в дознание (ст.327 УК РФ)', 'success');
    c.status = 'rejected';
  } else if(type === 'fsb_ban') {
    addScore(50, 'Корректный отказ по решению ФСБ', alertMeta);
    toast('Решение об отказе подготовлено по пп.1 п.1 ст.9 ФЗ-115', 'success');
    c.status = 'rejected';
  }
  
  logAudit('АЛЕРТ ОБРАБОТАН', `Тип: ${type}, Дело: ${c.id}`, { category: 'ALERT', caseId: c.id, extra: { alertType: type } });
  closeModal('modal-alert');
}

function ignoreAlert() {
  const c = STATE.activeAlertCase;
  addScore(-100, 'Проигнорирован критический алерт системы безопасности', { category: 'ALERT', caseId: c?.id, extra: { alertType: c?.alertType, chosenAction: 'ignored' } });
  toast('КРИТИЧЕСКАЯ ОШИБКА! Алерт проигнорирован — экзамен заблокирован!', 'danger');
  closeModal('modal-alert');
}
