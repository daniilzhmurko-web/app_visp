// ===== УТИЛИТЫ UI =====
// ================================================================
function showScreen(id) { document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function showLoading(text,sub) { document.getElementById('loading-overlay').style.display='flex'; document.getElementById('loading-text').textContent=text||'Загрузка...'; document.getElementById('loading-sub').textContent=sub||''; }
function hideLoading() { document.getElementById('loading-overlay').style.display='none'; }
let clockInterval = null;
function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  clockInterval = setInterval(() => {
    const el = document.getElementById('clock-indicator');
    if (el) el.textContent = '⏰ ' + new Date().toLocaleTimeString('ru-RU');
  }, 1000);
}

function switchModule(name) {
  // Остановить мигание при уходе из модуля сравнения
  if (blinkInterval && APP.currentModule === 'comparison' && name !== 'comparison') {
    clearInterval(blinkInterval); blinkInterval = null;
    const bb = document.getElementById('blink-btn');
    if (bb) bb.textContent = '👁 Мигание';
  }
  APP.currentModule = name;
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  const nav = document.getElementById('nav-'+name);
  if (nav) nav.classList.add('active');
  const titles = { dashboard:'Рабочий стол', cases:'Управление делами', registration:'Регистрация следа', coding:'Лаборатория кодирования минуций', search:'Поиск АДИС «Папилон»', hitlist:'Список кандидатов (Hit List)', comparison:'Сравнение и верификация', report:'Генератор экспертной справки', missions:'Обучающие миссии', journal:'Журнал действий' };
  document.getElementById('module-title').textContent = titles[name]||name;
  const renders = { dashboard:renderDashboard, cases:renderCases, registration:renderRegistration, coding:renderCoding, search:renderSearch, hitlist:renderHitList, comparison:renderComparison, report:renderReport, missions:renderMissions, journal:renderJournal };
  if (renders[name]) renders[name]();
  else document.getElementById('content-area').innerHTML = `<div class="panel"><div class="panel-body"><p>Модуль "${name}" в разработке.</p></div></div>`;
  logAction('MODULE_OPEN', titles[name]||name);
}

// ================================================================
