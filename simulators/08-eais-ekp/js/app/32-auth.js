// ===== ЭТАП 2: АВТОРИЗАЦИЯ КУРСАНТА =====
// ================================================================
// USERS (старый массив с admin/Admin2026) удалён — в курсантском режиме авторизация
// выполняется по связке ФИО + № взвода (см. doLogin).

const GROUP_LABELS = { eks:'Экспертно-криминалистическая', sled:'Следственная', oper:'Оперативная', uch:'Учебная (демо)' };

function doLogin() {
  const tokenName = window.IdentityToken && IdentityToken.getName();
  const tokenGroup = window.IdentityToken && IdentityToken.getGroup();
  const hasToken = !!(window.IdentityToken && IdentityToken.isPresent());
  const fullName = (tokenName || document.getElementById('login-fullname').value || '').trim();
  const squad = (tokenGroup || document.getElementById('login-squad').value || '').trim();
  const group = document.getElementById('login-group').value;
  const statusEl = document.getElementById('login-status');

  // === ВАЛИДАЦИЯ ФИО + ВЗВОД ===
  if (fullName.length < 5) { statusEl.textContent = '⚠️ Введите полное ФИО (минимум 5 символов)'; statusEl.style.color = 'var(--accent-red)'; return; }
  if (!/^[а-яА-ЯёЁa-zA-Z\s\.\-]+$/.test(fullName)) { statusEl.textContent = '⚠️ ФИО должно содержать только буквы, пробелы, точки и дефисы'; statusEl.style.color = 'var(--accent-red)'; return; }
  if (!/^\d{1,4}[а-яА-Яa-zA-Z]?$/.test(squad)) { statusEl.textContent = '⚠️ Номер взвода: число (1–9999), опционально литера'; statusEl.style.color = 'var(--accent-red)'; return; }
  statusEl.textContent = '';

  if (hasToken && IdentityToken.isExpired()) { statusEl.textContent = '⚠️ Срок действия токена истёк. Обратитесь к наставнику.'; statusEl.style.color = 'var(--accent-red)'; return; }
  // Создаём пользователя-курсанта
  const user = {
    username: fullName.replace(/\s+/g, '_').toLowerCase(),
    fullName: fullName,
    squad: squad,
    group: group,
    groupLabel: GROUP_LABELS[group] || group,
    displayName: fullName,            // ФИО = displayName
    role: 'cadet',                    // курсант
    dept: `${GROUP_LABELS[group] || ''} · ${squad} взвод`,
    deptCode: 'cadet',
    loginAt: _nowIso(),
  };
  APP.user = user;
  APP.cadetId = _cadetIdHash(fullName, squad);
  APP.sessionId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  APP.sessionStartTs = _nowIso();
  APP.casesActivity = {};
  APP.missionsProgress = {};
  APP.score = { coding: 0, filter: 0, verification: 0, procedure: 0 };
  DB.journal = [];   // чистый журнал для новой сессии

  showLoading('Выполняется аутентификация курсанта...', 'Инициализация сессии и журнала действий');
  setTimeout(() => {
    hideLoading();
    logAction('LOGIN', `Курсант "${fullName}" (${squad} взвод) вошёл в симулятор. ID: ${APP.cadetId}. Токен: ${hasToken ? 'предъявлен' : 'не предъявлен'}`);
    // Обновим sidebar
    const nameEl = document.getElementById('sidebar-name');
    const roleEl = document.getElementById('sidebar-role');
    const avEl = document.getElementById('sidebar-avatar');
    if (nameEl) nameEl.textContent = user.fullName;
    if (roleEl) roleEl.textContent = `${squad} взвод • ${user.groupLabel}`;
    if (avEl) avEl.textContent = (user.fullName[0] || 'К').toUpperCase();
    // Покажем основной экран
    showScreen('screen-main');
    document.getElementById('mentor-toggle-btn').style.display = 'flex';
    // Предзагружаем отпечатки и AI-разметку
    preloadAllFingerprints();
    DB.latents.forEach(l => { if (l.aiMinutiae.length === 0) l.aiMinutiae = generateAIMinutiae(l.id); if (l.userMinutiae.length === 0) l.userMinutiae = [...l.aiMinutiae.map(m=>({...m}))]; });
    switchModule('dashboard');
    startClock();
    _updateReportBadge();
    addMentorMsg(`Здравствуйте, ${user.fullName}! Вы вошли как курсант ${squad} взвода. Все ваши действия будут записаны в отчёт. Перейдите на вкладку «🎓 Миссии» для начала обучения.`, 'info');
  }, 1200);
}

function doLogout() {
  // Зафиксировать LOGOUT
  if (APP.user) {
    logAction('LOGOUT', `Курсант "${APP.user.fullName}" (${APP.user.squad} взвод) завершил сессию`);
  }
  // Остановить таймеры ДО обнуления user
  if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
  if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; document.getElementById('blink-btn')?.replaceChildren(); }
  // Предложить скачать отчёт пока APP.user ещё жив
  if (DB.journal.length > 0 && confirm('Сессия завершена. Скачать JSON-отчёт о действиях?')) {
    downloadReport();
  }
  _clearPersistedSession();
  // Только теперь обнуляем
  APP.user = null;
  APP.cadetId = null;
  APP.sessionId = null;
  APP.sessionStartTs = null;
  document.getElementById('instruction-panel').style.display = 'none';
  document.getElementById('mentor-panel').classList.add('hidden');
  document.getElementById('mentor-toggle-btn').style.display = 'none';
  showScreen('screen-login');
  document.getElementById('login-fullname').value = '';
  document.getElementById('login-squad').value = '';
  document.getElementById('login-status').textContent = '';
  _updateReportBadge();
}

function roleLabel(r) {
  return { expert: 'Эксперт', admin: 'Администратор', operator: 'Оператор', user: 'Пользователь', cadet: 'Курсант' }[r] || r;
}

// ================================================================
