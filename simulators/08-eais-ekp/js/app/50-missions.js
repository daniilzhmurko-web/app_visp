// ===== ЭТАП 6: МИССИИ =====
// ================================================================
const MISSIONS = PAPILON_DATA.missions;

function renderMissions() {
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  <div class="alert alert-info mb-16">🎓 Пройдите миссии последовательно. Каждая миссия разблокируется после завершения предыдущей. Итоговый балл учитывается в системе оценки.</div>
  <div class="grid-3">
  ${MISSIONS.map(m=>{
    const prog = APP.missionsProgress[m.id];
    const prevDone = m.id===1 || APP.missionsProgress[m.id-1]?.done;
    const locked = !prevDone;
    const done = prog?.done;
    return `
    <div class="mission-card ${locked?'locked':''} ${done?'completed':''}" onclick="${locked?'showLockedMsg()':''}" >
      <div class="mission-num">МИССИЯ ${m.id}</div>
      <div class="mission-title">${done?'✅ ':''} ${m.title}</div>
      <div class="mission-desc">${m.desc}</div>
      <div class="mission-meta">
        <span class="mission-diff diff-${m.difficulty}">${{easy:'Начальный',medium:'Средний',hard:'Сложный'}[m.difficulty]}</span>
        <span style="font-size:11px;color:var(--text-muted)">${m.steps.length} шагов</span>
        ${done?`<span class="mission-score">Оценка: ${prog.score}</span>`:''}
      </div>
      ${locked?`<button class="mission-btn locked-btn" disabled>🔒 Заблокировано</button>`:
        done?`<button class="mission-btn" style="background:var(--accent-green)" onclick="startMission(${m.id})">▶ Пройти снова</button>`:
        `<button class="mission-btn" onclick="startMission(${m.id})">▶ Начать</button>`}
    </div>`;
  }).join('')}
  </div>
  </div>`;
}

function showLockedMsg() { addMentorMsg('Эта миссия заблокирована. Завершите предыдущую для разблокировки.','warn'); }

let _mission7FailureTimer = null;
function startMission(id) {
  const mission = MISSIONS.find(m => m.id === id);
  if (!mission) return;
  // ФИКС: если курсант перезапускает миссию 7 (или уходит на другую миссию)
  // до истечения 8 секунд, старый отложенный «сбой» всё равно срабатывал
  // и портил минуции уже нового захода/дела. Отменяем предыдущий таймер.
  if (_mission7FailureTimer) { clearTimeout(_mission7FailureTimer); _mission7FailureTimer = null; }
  // Очистить события именно этой миссии в журнале (иначе рестарт засчитает старые записи)
  if (DB.journal && DB.journal.length) {
    DB.archive = (DB.archive || []).concat(DB.journal.filter(e => e.missionId === mission.id));
    DB.journal = DB.journal.filter(e => e.missionId !== mission.id);
  }
  // Сбрасываем hit list / выбор кандидата / отчёт — иначе они от предыдущего дела
  APP.currentHitList = [];
  APP.selectedCandidate = null;
  APP.reportData = null;
  APP._rlpErrors = 0;
  // Сохраняем накопленные баллы прошлых миссий, обнуляем текущие
  if (!APP.missionScores) APP.missionScores = {};
  APP.score = { coding: 0, filter: 0, verification: 0, procedure: 0 };
  APP.currentMission = mission;
  APP.missionStep = 0;
  APP.missionStartTs = _nowIso();
  APP.missionStepEnteredTs = _nowIso();
  APP.missionsProgress[mission.id] = APP.missionsProgress[mission.id] || { startedAt: _nowIso(), attempts: 0 };
  APP.missionsProgress[mission.id].attempts = (APP.missionsProgress[mission.id].attempts || 0) + 1;
  // Устанавливаем активный след
  const latent = DB.latents.find(l => l.id === mission.latentId);
  if (latent) {
    APP.currentCase = latent;
    latent.userMinutiae = [...latent.aiMinutiae.map(m => ({...m}))];
    latent.status = 'new';
  }
  // Сбросить hit list под этот case (если был от другого)
  if (APP.casesActivity[mission.latentId]) {
    APP.casesActivity[mission.latentId].hitList = [];
    APP.casesActivity[mission.latentId].decision = null;
    APP.casesActivity[mission.latentId].isTrue = null;
  }
  logAction('MISSION_START', `Миссия ${id}: «${mission.title}» (сложность: ${mission.difficulty}, попытка ${APP.missionsProgress[mission.id].attempts})`);
  addMentorMsg(`🎯 Миссия ${id} начата: «${mission.title}». ${mission.steps[0]}`, 'info');
  APP._m7Scheduled = null;   // сбой миссии 7 запускается при входе в модуль разметки (scheduleMission7Failure)
  showInstructionPanel(mission);
  switchModule('cases');
}

function scheduleMission7Failure() {
  const mission = APP.currentMission;
  if (!mission || mission.id !== 7) return;
  const attempt = APP.missionsProgress[7]?.attempts;
  if (APP._m7Scheduled === attempt) return;
  APP._m7Scheduled = attempt;
  if (_mission7FailureTimer) clearTimeout(_mission7FailureTimer);
  _mission7FailureTimer = setTimeout(() => {
    _mission7FailureTimer = null;
    if (APP.currentMission?.id === 7 && APP.missionsProgress[7]?.attempts === attempt && APP.currentCase?.id === 'S007') {
      const lost = Math.floor(APP.currentCase.userMinutiae.length * 0.4);
      APP.currentCase.userMinutiae = APP.currentCase.userMinutiae.slice(lost);
      if (APP.currentModule === 'coding') { drawCanvas(); renderMinutiaList(); updateCodingQuality(); }
      addMentorMsg('⚠️⚠️ ВНИМАНИЕ! Произошёл технический сбой системы АДИС. Часть разметки (40%) потеряна. Восстановите её, используя функцию «↺ ИИ» или разметив заново.', 'error');
      logAction('SYSTEM_FAILURE', `Симулирован сбой: потеряно ${lost} минуций следа ${APP.currentCase.id}`);
      showNotification('⚠️ Технический сбой! Часть данных потеряна', 'error');
    }
  }, 8000);
}

function showInstructionPanel(mission) {
  const panel = document.getElementById('instruction-panel');
  panel.style.display = 'flex';
  document.getElementById('instr-mission-name').textContent = `Миссия ${mission.id}: ${mission.title}`;
  renderInstrSteps();
  updateInstrContent();
  updateInstrProgress();
}

function renderInstrSteps() {
  const mission = APP.currentMission;
  if (!mission) return;
  const el = document.getElementById('instr-steps-list');
  el.innerHTML = mission.steps.map((s,i)=>`
    <div class="instr-step ${i===APP.missionStep?'current':i<APP.missionStep?'done':''}" onclick="jumpToStep(${i})">
      <div class="step-num">${i<APP.missionStep?'✓':i+1}</div>
      <span style="font-size:11px">${s}</span>
    </div>`).join('');
}

function updateInstrContent() {
  const mission = APP.currentMission;
  if (!mission) return;
  const step = mission.steps[APP.missionStep]||'Миссия завершена';
  document.getElementById('instr-current-text').textContent = step;
  document.getElementById('instr-hint').textContent = mission.hints[APP.missionStep%mission.hints.length]||'';
  document.getElementById('instr-finish-btn').style.display = APP.missionStep >= mission.steps.length-1 ? 'inline-flex':'none';
  document.getElementById('instr-next-btn').style.display = APP.missionStep < mission.steps.length-1 ? 'inline-flex':'none';
}

function updateInstrProgress() {
  const mission = APP.currentMission;
  if (!mission) return;
  const pct = Math.round(APP.missionStep/mission.steps.length*100);
  document.getElementById('instr-progress-fill').style.width = pct+'%';
  document.getElementById('instr-progress-text').textContent = `${APP.missionStep} / ${mission.steps.length}`;
}

function _missionSearchedWith(mission, needle) {
  return DB.journal.some(e => e.missionId === mission.id && e.action === 'SEARCH_START' && String(e.detail).includes(needle));
}
function instrNext() {
  if (!APP.currentMission) return;
  // Перед переходом к следующему шагу проверим, что предыдущий реально выполнен
  const cur = APP.missionStep;
  const mission = APP.currentMission;
  const curStepText = (mission.steps[cur] || '').toLowerCase();
  if (curStepText.includes('сохраните') || curStepText.includes('разметьте') || curStepText.includes('сохранить')) {
    const saved = DB.journal.some(e => e.missionId === mission.id && e.action === 'CODING_SAVE');
    if (!saved) { addMentorMsg('⚠️ Сначала сохраните разметку, прежде чем переходить дальше.', 'warn'); return; }
  }
  if (curStepText.includes('поиск') || curStepText.includes('запустите')) {
    const searched = DB.journal.some(e => e.missionId === mission.id && e.action === 'SEARCH_COMPLETE');
    if (!searched) { addMentorMsg('⚠️ Сначала запустите поиск АДИС, прежде чем переходить дальше.', 'warn'); return; }
  }
  if (curStepText.includes('подтвердите') || curStepText.includes('верифицир')) {
    const decided = DB.journal.some(e => e.missionId === mission.id && (e.action === 'MATCH_CONFIRM' || e.action === 'MATCH_REJECT' || e.action === 'MATCH_UNDEFINED'));
    if (!decided) { addMentorMsg('⚠️ Сначала примите решение по кандидату (подтвердить/отклонить).', 'warn'); return; }
  }
  const _need = [['региональной','Региональная','региональной базе'],['федеральной','Федеральная','федеральной базе'],['«след → след»','След → След','тип «След → След»']];
  for (const [k, needle, label] of _need) {
    if (curStepText.includes(k) && !_missionSearchedWith(mission, needle)) { addMentorMsg(`⚠️ Сначала выполните поиск: ${label}.`, 'warn'); return; }
  }
  APP.missionStep = Math.min(APP.missionStep + 1, mission.steps.length - 1);
  APP.missionStepEnteredTs = _nowIso();
  logAction('MISSION_STEP', `Переход к шагу ${APP.missionStep + 1}/${mission.steps.length}: ${mission.steps[APP.missionStep]}`);
  renderInstrSteps(); updateInstrContent(); updateInstrProgress();
}
function instrPrev() { if(!APP.currentMission) return; APP.missionStep=Math.max(APP.missionStep-1,0); renderInstrSteps(); updateInstrContent(); updateInstrProgress(); }
function jumpToStep(i) {
  if (i > APP.missionStep) {
    // нельзя прыгнуть вперёд через обязательные шаги
    addMentorMsg('⚠️ Шаги нужно проходить последовательно. Нажмите «Далее».', 'warn');
    return;
  }
  APP.missionStep = i;
  renderInstrSteps(); updateInstrContent(); updateInstrProgress();
}
function toggleInstrPanel() { APP.instrCollapsed=!APP.instrCollapsed; document.getElementById('instruction-panel').classList.toggle('collapsed',APP.instrCollapsed); document.getElementById('instr-toggle-icon').textContent=APP.instrCollapsed?'▼':'▲'; }

function instrFinish() {
  const mission = APP.currentMission;
  if (!mission) return;
  // === ВАЛИДАЦИЯ РЕАЛЬНОГО ВЫПОЛНЕНИЯ ШАГОВ ===
  const missionActions = DB.journal.filter(e => e.missionId === mission.id);
  const hasCoding = missionActions.some(e => e.action === 'CODING_SAVE');
  const hasSearch = missionActions.some(e => e.action === 'SEARCH_COMPLETE');
  const hasDecision = missionActions.some(e => e.action === 'MATCH_CONFIRM' || e.action === 'MATCH_REJECT' || e.action === 'MATCH_UNDEFINED');
  if (!hasCoding) {
    addMentorMsg('⚠️ Миссия не может быть завершена без разметки минуций (шаг «Сохраните разметку»).', 'error');
    return;
  }
  if (!hasSearch) {
    addMentorMsg('⚠️ Миссия не может быть завершена без выполнения поиска АДИС.', 'error');
    return;
  }
  if (!hasDecision) {
    addMentorMsg('⚠️ Примите решение по кандидату (подтвердить / отклонить / неопределённо) перед завершением миссии.', 'error');
    return;
  }
  // ФИКС: миссия 6 по сценарию требует обработать ТРИ дела (S006, S007, S008),
  // но проверка выше засчитывала завершение по одному любому действию в
  // журнале миссии — можно было закрыть миссию, реально отработав только
  // одно из трёх дел. Проверяем каждое дело по отдельности через caseId.
  if (mission.id === 6) {
    const requiredCases = ['S006', 'S007', 'S008'];
    const incomplete = requiredCases.filter(cid => {
      const acts = missionActions.filter(e => e.caseId === cid);
      const coded = acts.some(e => e.action === 'CODING_SAVE');
      const searched = acts.some(e => e.action === 'SEARCH_COMPLETE');
      const decided = acts.some(e => e.action === 'MATCH_CONFIRM' || e.action === 'MATCH_REJECT' || e.action === 'MATCH_UNDEFINED');
      return !(coded && searched && decided);
    });
    if (incomplete.length) {
      addMentorMsg(`⚠️ Миссия требует обработать ВСЕ три дела (S006, S007, S008): разметка → поиск → решение по каждому. Не завершены: ${incomplete.join(', ')}.`, 'error');
      return;
    }
  }
  if (mission.id === 8 && !(_missionSearchedWith(mission, 'Региональная') && _missionSearchedWith(mission, 'Федеральная'))) {
    addMentorMsg('⚠️ Миссия 8 требует поиска и по региональной, и по федеральной базе.', 'error'); return;
  }
  if (mission.id === 9 && !_missionSearchedWith(mission, 'След → След')) {
    addMentorMsg('⚠️ Миссия 9 требует поиска типа «След → След».', 'error'); return;
  }
  const totalScore = Math.round((APP.score.coding + APP.score.filter + APP.score.verification + APP.score.procedure) / 4);
  APP.missionsProgress[mission.id] = APP.missionsProgress[mission.id] || {};
  APP.missionsProgress[mission.id].done = totalScore >= 60;
  APP.missionsProgress[mission.id].score = totalScore;
  APP.missionsProgress[mission.id].startedAt = APP.missionStartTs;
  APP.missionsProgress[mission.id].completedAt = _nowIso();
  // Сохраняем итоговый балл миссии для агрегации в отчёте
  if (!APP.missionScores) APP.missionScores = {};
  APP.missionScores[mission.id] = totalScore;
  logAction('MISSION_COMPLETE', `Миссия ${mission.id} «${mission.title}» завершена. Оценка: ${totalScore}`);
  document.getElementById('instruction-panel').style.display = 'none';
  showMissionResult(mission, totalScore);
}

function showMissionResult(mission, score) {
  const grade = score>=90?{label:'Отлично',cls:'excellent',emoji:'🏆'}:score>=75?{label:'Хорошо',cls:'good',emoji:'👍'}:score>=60?{label:'Удовлетворительно',cls:'satisf',emoji:'✔️'}:{label:'Неудовлетворительно',cls:'bad',emoji:'❌'};
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  <div class="result-card">
    <div style="font-size:48px">${grade.emoji}</div>
    <div class="result-score ${grade.cls}">${score}</div>
    <div class="result-grade">${grade.label}</div>
    <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px">Миссия ${mission.id}: «${mission.title}»</p>
    <div class="result-breakdown">
      <div class="result-row"><span>🎯 Качество разметки минуций</span><span><strong>${APP.score.coding}%</strong></span></div>
      <div class="result-row"><span>🔧 Стратегия фильтрации</span><span><strong>${APP.score.filter}%</strong></span></div>
      <div class="result-row"><span>⚖️ Точность верификации</span><span><strong>${APP.score.verification}%</strong></span></div>
      <div class="result-row"><span>📋 Соблюдение процедуры (RL+)</span><span><strong>${APP.score.procedure}%</strong></span></div>
    </div>
    ${score<75?'<div class="alert alert-warn">Рекомендуется повторить миссию для улучшения результата.</div>':''}
    <div style="display:flex;gap:10px;justify-content:center;margin-top:16px">
      <button class="btn btn-primary" onclick="startMission(${mission.id})">🔄 Повторить</button>
      <button class="btn btn-success" onclick="switchModule('missions')">📚 К миссиям</button>
    </div>
  </div>
  </div>`;
  addMentorMsg(`Миссия завершена! Итоговый балл: ${score}/100. ${grade.label}. ${score < 60 ? 'Для разблокировки следующей миссии нужно набрать не менее 60 баллов — повторите миссию.' : (mission.id < MISSIONS.length?'Следующая миссия разблокирована!':'Вы прошли весь курс! Поздравляем!')}`, score>=75?'success':'warn');
}

// ================================================================
