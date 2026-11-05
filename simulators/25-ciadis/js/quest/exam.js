'use strict';
/* =====================================================
   РЕЖИМ ЭКЗАМЕНА
   - задание выдаётся по варианту (токен / выбор / номер взвода);
   - пункты выполняются в любом порядке, подсказок нет;
   - ограничение по времени и по числу ошибок;
   - итоговый балл и оценка, результат попадает в JSON-отчёт.
   ===================================================== */
const _EX = () => MODES.exam;

/* ---------- Экран входа: выбор режима ---------- */
function initLoginModeUI() {
  const sel = el('l-variant');
  if (sel) {
    sel.innerHTML = '<option value="auto">Автоматически (по номеру взвода)</option>' +
      EXAM_VARIANTS.map(v => `<option value="${v.id}">Вариант ${v.id} — ${v.title}</option>`).join('');
  }
  const tok = el('l-token');
  if (tok) tok.addEventListener('input', () => setTimeout(syncTokenMode, 60));
}

function syncTokenMode() {
  const m = window.IdentityToken && IdentityToken.getMode && IdentityToken.getMode();
  const sel = el('l-mode');
  if (!sel) return;
  if (m === 'exam' || m === 'training') { sel.value = m; sel.disabled = true; setMode(m); }
  else { sel.disabled = false; }
  const v = window.IdentityToken && IdentityToken.getVariant && IdentityToken.getVariant();
  const vs = el('l-variant');
  if (vs && v) { vs.value = String(v); vs.disabled = true; } else if (vs) { vs.disabled = false; }
}

function setMode(m) {
  if (S.exam && !S.exam.finished) m = 'exam';           // начатый экзамен нельзя «выключить»
  S.mode = (m === 'exam') ? 'exam' : 'training';
  const isExam = S.mode === 'exam';
  const vb = el('l-variant-box'); if (vb) vb.style.display = isExam ? 'block' : 'none';
  const note = el('l-mode-note');
  if (note) note.textContent = isExam
    ? 'Экзамен: подсказок нет, действует лимит времени и ошибок. Роль — «Сторонний пользователь».'
    : 'Обучение: пошаговые инструкции и подсказки.';
  const rs = el('l-role');
  if (rs) { if (isExam) { rs.value = 'external'; rs.disabled = true; } else { rs.disabled = false; } }
  const sel = el('l-mode'); if (sel && sel.value !== S.mode) sel.value = S.mode;
  updQ();
}

/* ---------- Старт ---------- */
function examStart(platoon) {
  if (S.exam) return;                                   // повторный вход не перезапускает экзамен
  const tokV = window.IdentityToken && IdentityToken.getVariant && IdentityToken.getVariant();
  const pick = tokV || (el('l-variant') && el('l-variant').value) || 'auto';
  let idx;
  if (pick !== 'auto') idx = EXAM_VARIANTS.findIndex(v => String(v.id) === String(pick));
  else idx = (parseInt(String(platoon).replace(/\D/g, ''), 10) || 0) % EXAM_VARIANTS.length;
  if (idx < 0) idx = 0;
  const v = EXAM_VARIANTS[idx];
  const limitSec = v.timeLimitSec || _EX().timeLimitSec;
  S.exam = {
    variant: v, startedAt: Date.now(), limitSec,
    deadline: Date.now() + limitSec * 1000,
    items: {}, rt: {}, errors: 0, errorLog: [], errKeys: {},
    finished: false, finishReason: null, score: null, grade: null, timer: null
  };
  _EX().items.forEach(i => S.exam.items[i.id] = { done: false, at: null });

  // Перестройка панели под экзамен
  const qp = el('qpanel'); qp.classList.add('exam');
  qp.querySelector('.qp-title').textContent = 'Экзамен — ЦИАДИС-МВД';
  const stat = el('qstep').parentElement; stat.firstChild.textContent = 'Осталось ';
  qp.querySelector('.qp-xp').innerHTML = `Ошибки: <span id="qxp">0</span>/${_EX().errorsLimit}`;
  const ctrl = qp.querySelector('.qp-ctrl');
  if (!el('q-fin')) {
    const b = document.createElement('button');
    b.id = 'q-fin'; b.className = 'qbtn qbtn-fin';
    b.innerHTML = '<i class="fas fa-flag-checkered"></i> Завершить экзамен';
    b.onclick = examFinishConfirm; ctrl.insertBefore(b, ctrl.querySelector('.qbtn-tog'));
  }
  S.exam.timer = setInterval(examTick, 1000);
  logEvent('exam_started', { variant: v.id, title: v.title, limitSec });
  examRenderPanel();
}

/* ---------- Таймер и панель ---------- */
function fmtMMSS(sec) {
  sec = Math.max(0, sec); const p = n => String(n).padStart(2, '0');
  return p(Math.floor(sec / 60)) + ':' + p(sec % 60);
}
function examTick() {
  if (!S.exam || S.exam.finished) return;
  const left = Math.round((S.exam.deadline - Date.now()) / 1000);
  if (left <= 0) { examFinish('timeout'); return; }
  const q = el('qstep'); if (q) { q.textContent = fmtMMSS(left); q.classList.toggle('low', left <= 60); }
}
function examDoneCount() { return Object.values(S.exam.items).filter(i => i.done).length; }

function examRenderPanel() {
  if (!S.exam) {                                        // экзамен выбран, но вход ещё не выполнен
    el('q-stitle').textContent = 'Режим экзамена';
    el('q-desc').textContent = 'Подсказки отключены, действует ограничение по времени и числу ошибок.';
    el('q-obj').textContent = 'Заполните данные курсанта и нажмите «Войти в систему» — после входа будет выдано задание.';
    el('qstep').textContent = '—';
    return;
  }
  const v = S.exam.variant, total = _EX().items.length, done = examDoneCount();
  el('q-stitle').textContent = `Вариант ${v.id}: ${v.title}`;
  el('q-obj').textContent = v.task;
  el('qxp').textContent = S.exam.errors;
  el('qpfill').style.width = (done / total * 100) + '%';
  const st = el('q-status');
  st.className = 'qst ' + (done === total ? 'qst-ok' : 'qst-wait');
  st.textContent = `Выполнено пунктов: ${done} из ${total}`;
  examTick();
}

/* ---------- Проверка пунктов (вызывается из checkQ) ---------- */
function examCheck() {
  if (!S.exam || S.exam.finished) return;
  const rt = S.exam.rt;
  const cond = {
    search: !!rt.searched, openCard: !!rt.opened, viewConfirm: !!rt.viewed,
    request: !!rt.reqRid, confirmOwn: !!rt.confirmed,
    stat: !!S.flags.statNav, journal: !!S.flags.logNav
  };
  let changed = false;
  for (const id in cond) {
    const it = S.exam.items[id];
    if (cond[id] && it && !it.done) { it.done = true; it.at = nowISO(); changed = true; logEvent('exam_item_done', { id }); }
  }
  examRenderPanel();
  if (changed && examDoneCount() === _EX().items.length) setTimeout(() => examFinish('completed'), 900);
}

/* ---------- Хуки действий курсанта ---------- */
function examOnSearch(sur) {
  if (!S.exam || S.exam.finished) return;
  if (sur && sur.startsWith(S.exam.variant.surname.toLowerCase())) S.exam.rt.searched = true;
  examCheck();
}
function examOnCardSelected(id) {
  if (!S.exam || S.exam.finished) return;
  if (id === S.exam.variant.cardId) S.exam.rt.opened = true;
  else examError('wrong_card', 'Открыта не та дактилокарта: ' + id, id);
  examCheck();
}
function examOnViewConfirmed(id) {
  if (!S.exam || S.exam.finished) return;
  if (id === S.exam.variant.cardId) S.exam.rt.viewed = true;
  else examError('wrong_view', 'Подтверждён просмотр не той карты: ' + id, id);
  examCheck();
}
function examOnRequestCreated(rid, cid, ct, nv) {
  if (!S.exam || S.exam.finished) return;
  const v = S.exam.variant;
  const same = cid === v.cardId && ct === v.ctype && String(nv).trim().toLowerCase() === v.newValue.toLowerCase();
  if (same) S.exam.rt.reqRid = rid;
  else examError('wrong_request', 'Запрос не соответствует заданию (карта, тип или новое значение)', rid);
  examCheck();
}
function examOnRequestConfirmed(r) {
  if (!S.exam || S.exam.finished) return;
  if (r.id === S.exam.rt.reqRid) S.exam.rt.confirmed = true;
  else examError('foreign_request', 'Подтверждён запрос, не относящийся к заданию: ' + r.id, r.id);
  examCheck();
}

function examError(code, msg, key) {
  const k = code + ':' + key;
  if (S.exam.errKeys[k]) return;                        // одинаковая ошибка считается один раз
  S.exam.errKeys[k] = true;
  S.exam.errors++;
  S.exam.errorLog.push({ code, message: msg, at: nowISO() });
  logEvent('exam_error', { code, message: msg });
  toast('Ошибка выполнения', msg, 'warn');
  examRenderPanel();
  if (S.exam.errors >= _EX().errorsLimit) setTimeout(() => examFinish('errors'), 600);
}

/* ---------- Завершение ---------- */
function examFinishConfirm() {
  if (!S.exam || S.exam.finished) return;
  if (confirm('Завершить экзамен? Невыполненные пункты не будут засчитаны.')) examFinish('manual');
}

function examCalc(reason) {
  const base = _EX().items.reduce((s, i) => s + (S.exam.items[i.id].done ? i.weight : 0), 0);
  const score = Math.max(0, base - S.exam.errors * _EX().errorPenalty);
  let grade = _EX().grades.find(g => score >= g.min).name;
  if (reason === 'errors') grade = _EX().grades[_EX().grades.length - 1].name;
  return { base, score, grade };
}

function examFinish(reason) {
  if (!S.exam || S.exam.finished) return;
  S.exam.finished = true; S.exam.finishReason = reason;
  clearInterval(S.exam.timer);
  const r = examCalc(reason);
  S.exam.score = r.score; S.exam.grade = r.grade;
  S.timeline.finishedAt = nowISO();
  logEvent('exam_finished', { reason, score: r.score, grade: r.grade, errors: S.exam.errors, done: examDoneCount() });

  const titles = { completed: 'Экзамен завершён', timeout: 'Время вышло',
                   errors: 'Превышен лимит ошибок', manual: 'Экзамен завершён досрочно' };
  const m = el('mscreen');
  m.querySelector('.mc-title').textContent = titles[reason] || 'Экзамен завершён';
  m.querySelector('.mc-card > p').textContent = `Вариант ${S.exam.variant.id}: ${S.exam.variant.title}`;
  const lbl = m.querySelectorAll('.mc-sl'); lbl[0].textContent = 'Баллов'; lbl[1].textContent = 'Пунктов'; lbl[2].textContent = 'Ошибок';
  el('f-xp').textContent = r.score;
  el('f-steps').textContent = examDoneCount() + '/' + _EX().items.length;
  el('f-hints').textContent = S.exam.errors;
  m.querySelector('.mc-rank-box > div').textContent = 'ОЦЕНКА';
  el('f-rank').textContent = r.grade;
  const again = m.querySelector('.btn-out'); if (again) again.style.display = 'none';   // пересдача только по решению преподавателя
  m.style.display = 'flex';
}

function examReport() {
  const e = S.exam, r = examCalc(e.finishReason);
  return {
    variant: e.variant.id, title: e.variant.title,
    time_limit_seconds: e.limitSec,
    time_used_seconds: Math.round(((e.finished ? new Date(S.timeline.finishedAt).getTime() : Date.now()) - e.startedAt) / 1000),
    finished: e.finished, finish_reason: e.finishReason,
    base_score: r.base, error_penalty: e.errors * _EX().errorPenalty,
    score: e.finished ? e.score : r.score, max_score: 100,
    grade: e.finished ? e.grade : r.grade,
    errors: e.errors, errors_limit: _EX().errorsLimit, error_log: e.errorLog,
    items: _EX().items.map(i => ({ id: i.id, label: i.label, weight: i.weight, done: e.items[i.id].done, at: e.items[i.id].at }))
  };
}
