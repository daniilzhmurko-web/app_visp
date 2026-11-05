'use strict';
// ── CHECKS MODAL ──────────────────────────────────
function openChecks(caseId) {
  const c = getCase(caseId);
  if(!c) return;
  const ig = getIG(c.ig);
  
  document.getElementById('modal-checks-body').innerHTML = `
    <div class="alert alert-info mb-2">СМЭВ — Система межведомственного электронного взаимодействия. Запросы инициируются автоматически при нажатии кнопки.</div>
    <div id="checks-content-${caseId}">
      ${renderCheckConsole(c)}
    </div>
    <div class="divider"></div>
    <button class="btn btn-primary w-full" onclick="runAllChecks('${caseId}');closeModal('modal-checks');setTimeout(()=>openChecks('${caseId}'),3200)"><svg class="ic" aria-hidden="true"><use href="#i-play"/></svg> Запустить веерный запрос</button>
  `;
  openModal('modal-checks');
}

// ── DECISION MODAL ────────────────────────────────
// rejectOnly=true — используется для дел (напр. патент), где через это общее
// модальное окно допустим только отказ; кнопка "Одобрить" в этом случае
// скрывается, чтобы курсант не мог обойти профильный порядок оформления
// (дактилоскопию, проверки) через чужую форму решения.
function openDecisionModal(caseId, rejectOnly = false) {
  const c = getCase(caseId);
  const ig = getIG(c?.ig);
  STATE.currentCaseId = caseId;
  STATE.decisionRejectOnly = !!rejectOnly;

  document.getElementById('modal-decision-body').innerHTML = `
    <div class="alert alert-info mb-2">Дело <strong>${caseId}</strong> | ИГ: <strong>${ig?.name}</strong></div>
    ${rejectOnly ? '<div class="alert alert-warning">По данному делу через эту форму возможен только отказ в выдаче.</div>' : ''}
    <div class="form-group">
      <label class="form-label">Обоснование решения</label>
      <textarea class="form-textarea" id="decision-text" placeholder="Укажите основание принятого решения (статья, норма права, выявленные нарушения)..."></textarea>
    </div>
    ${c?.type === 'migration_reg' && getAddr(c.addr)?.residents > 10 ? 
      '<div class="alert alert-warning"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Адрес с признаками «резиновой квартиры». Рекомендуется направить рапорт в ОИК даже при одобрении.</div>' : ''}
  `;
  const approveBtn = document.getElementById('btn-decision-approve');
  if(approveBtn) approveBtn.style.display = rejectOnly ? 'none' : '';
  openModal('modal-decision');
}

function makeDecision(decision) {
  const caseId = STATE.currentCaseId;
  const c = getCase(caseId);
  if(!c) { closeModal('modal-decision'); return; }

  if(decision === 'approve' && STATE.decisionRejectOnly) {
    toast('По этому делу через данную форму доступен только отказ.', 'danger');
    return;
  }
  if(decision === 'approve' && c.type !== 'migration_reg') {
    toast('Для данного типа дела одобрение оформляется в профильном разделе, а не через эту форму.', 'danger');
    closeModal('modal-decision');
    return;
  }

  const ig = getIG(c.ig);
  const addr = getAddr(c.addr);
  const hp = getHP(c.hp);
  const text = document.getElementById('decision-text')?.value;
  const meta = { category: 'DECISION', extra: { caseType: c.type, trapType: ig?.trap || null, decision } };

  // Validation checks
  if(decision === 'approve') {
    // Check for errors that should have caused rejection
    if(hp?.status === 'liquidated') {
      addScore(-50, 'Одобрено при ликвидированной принимающей организации', meta);
      toast('Ошибка! Принимающая сторона ликвидирована — должен быть отказ!', 'danger');
    } else if(ig?.trap === 'wanted' && c.checksDone) {
      addScore(-100, 'Критически! Одобрен документ лицу в розыске!', meta);
      toast('КРИТИЧЕСКАЯ ОШИБКА! Лицо числится в розыске!', 'danger');
    } else if(aminaCheck(ig).level === 'danger') {
      addScore(-40, 'Одобрено при нарушении режима мониторинга («Амина»)', meta);
      toast('Ошибка! Приложение «Амина» не установлено / геолокация не поступает.', 'danger');
    } else if(checkPassportExpiry(ig) && c.type === 'migration_reg') {
      addScore(-50, 'Одобрена регистрация при истекающем паспорте', meta);
      toast('Паспорт истекает раньше срока регистрации!', 'warning');
    } else {
      addScore(30, `Одобрено дело ${caseId}`, meta);
      if(addr?.residents > 10) {
        toast('Принято (корректно). Не забудьте направить рапорт в ОИК!', 'warning');
        addScore(-10, 'Не направлен рапорт в ОИК по адресу с признаками "резиновой квартиры"', meta);
      } else {
        toast('Решение принято. Регистрация выполнена.', 'success');
      }
      printRegistrationSlip(c, ig, addr);
    }
    c.status = 'approved';
  } else {
    // Rejection
    if(hp?.status === 'liquidated' || ig?.trap === 'wanted' || checkPassportExpiry(ig) || aminaCheck(ig).level === 'danger') {
      addScore(20, `Корректный отказ по делу ${caseId}`, meta);
      toast('Правильное решение об отказе принято.', 'success');
    } else {
      addScore(-20, 'Необоснованный отказ при отсутствии нарушений', meta);
      toast('Отказ без обоснованных нарушений?', 'warning');
    }
    c.status = 'rejected';
  }
  
  c.decision = decision;
  logAudit('РЕШЕНИЕ', `${decision==='approve'?'ОДОБРЕНО':'ОТКАЗАНО'} — дело ${caseId}: ${text||'без основания'}`, { category: 'DECISION', caseId, extra: { caseType: c.type } });
  updateQueueBadge();
  closeModal('modal-decision');
  updateChecklist(3, true);
}

function printRegistrationSlip(c, ig, addr) {
  const today = new Date();
  const expDate = new Date(); expDate.setMonth(expDate.getMonth()+3);
  const regNum = `МВД-${today.getFullYear()}-${c.id.replace('ДЕЛО-','')}`;
  
  document.getElementById('modal-dossier-title').innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-clipboard"/></svg> Отрывная часть бланка уведомления о прибытии';
  document.getElementById('modal-dossier-body').innerHTML = `
    <div class="ticket">
      <div class="ticket-title">ОТРЫВНАЯ ЧАСТЬ БЛАНКА УВЕДОМЛЕНИЯ О ПРИБЫТИИ<br>ИГ В МЕСТО ПРЕБЫВАНИЯ<br>МВД России</div>
      Рег. номер ГС МИР: ${regNum}<br>
      Дата регистрации: ${fmtDate(today)}<br>
      ────────────────────────────<br>
      ФИО: ${ig?.name}<br>
      Гражданство: ${ig?.nationality}<br>
      Паспорт: ${ig?.passport}<br>
      Дата въезда: ${ig?.entryDate}<br>
      ────────────────────────────<br>
      Адрес пребывания:<br>
      ${addr?.full||'—'}<br>
      ────────────────────────────<br>
      Срок пребывания: по ${fmtDate(expDate)}<br>
      ────────────────────────────<br>
      ████████████████ ← штрих-код<br>
      <small>██ █ ██ ████ █ ██ █████ ██</small><br>
      ────────────────────────────<br>
      Инспектор ОВМ: _______________<br>
      МП: ○                    ${fmtDate(today)}<br>
    </div>
    <div class="alert alert-success mt-2"><svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg> Регистрация в ГИС ГМУ выполнена. Данные внесены в систему.</div>
  `;
  openModal('modal-dossier');
}

// ── SEND ACTIONS ──────────────────────────────────
function sendReportOIK(caseId) {
  addScore(50, 'Направлен рапорт в ОИК по факту возможной фиктивной регистрации', { category: 'ACTION', caseId });
  toast('Рапорт направлен в Отдел иммиграционного контроля (ст.322.3 УК РФ)', 'success');
  logAudit('РАПОРТ ОИК', `Дело ${caseId}: фиктивная регистрация по массовому адресу`, { category: 'ACTION', caseId });
  updateChecklist(3, true);
}

function sendAdminProtocol(caseId) {
  addScore(20, 'Составлен протокол КоАП за нарушение сроков подачи', { category: 'ACTION', caseId });
  toast('Протокол по КоАП направлен на составление', 'success');
  logAudit('ПРОТОКОЛ КоАП', `Дело ${caseId}: ст.18.8 / ч.4 ст.18.9 КоАП`, { category: 'ACTION', caseId });
}

// ── NEW CASE ──────────────────────────────────────
function openNewCase() {
  STATE.selectedCaseType = null;
  document.getElementById('btn-create-case').disabled = true;
  document.querySelectorAll('#modal-new-case .card').forEach(c=>{
    c.style.border = '2px solid transparent';
  });
  openModal('modal-new-case');
}

function selectCaseType(type, el) {
  STATE.selectedCaseType = type;
  document.querySelectorAll('#modal-new-case .card').forEach(c=>c.style.border='2px solid transparent');
  el.style.border = '2px solid var(--primary)';
  document.getElementById('btn-create-case').disabled = false;
}

function createNewCase() {
  if(!STATE.selectedCaseType) return;
  const types = {migration_reg: 'migration_reg', patent: 'patent', rvp: 'rvp', vnzh: 'vnzh'};
  const ig = FOREIGN_CITIZENS[Math.floor(Math.random()*FOREIGN_CITIZENS.length)];
  const hp = HOST_PARTIES[Math.floor(Math.random()*HOST_PARTIES.length)];
  const addr = ADDRESSES[Math.floor(Math.random()*ADDRESSES.length)];
  const newCase = {
    id: `ДЕЛО-${1020 + CASES.length}`,
    type: STATE.selectedCaseType,
    ig: ig.id, hp: hp.id, addr: addr.id,
    status: 'new', source: 'Личный приём',
    created: new Date(), daysOld: 0,
    step: 0, decision: null,
    fingerprintsDone: false, checksDone: false, checksResult: null,
  };
  CASES.push(newCase);
  updateQueueBadge();
  closeModal('modal-new-case');
  toast(`${newCase.id} создано (${typeLabel(STATE.selectedCaseType)})`, 'success');
  logAudit('СОЗДАНИЕ ДЕЛА', `${newCase.id}: ${typeLabel(STATE.selectedCaseType)}`, { category: 'CASE', caseId: newCase.id, extra: { caseType: newCase.type, igId: ig.id } });
  openCaseDetail(newCase.id);
}
