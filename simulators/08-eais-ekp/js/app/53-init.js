// ===== ИНИЦИАЛИЗАЦИЯ =====
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Enter key — фокус / логин
  const squadEl = document.getElementById('login-squad');
  const fnEl = document.getElementById('login-fullname');
  if (fnEl) fnEl.addEventListener('keydown', e => { if (e.key === 'Enter' && squadEl) squadEl.focus(); });
  if (squadEl) squadEl.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  // На кнопку Enter НЕ вешаем — иначе двойной вызов (keydown + нативный click)
  const mentorInput = document.getElementById('mentor-input');
  if (mentorInput) mentorInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMentorMsg(); });
  _updateReportBadge();
  // Попытка восстановить предыдущую сессию из localStorage
  const restored = _restoreSession();
  if (restored && APP.user) {
    // Обновим UI
    const nameEl = document.getElementById('sidebar-name');
    const roleEl = document.getElementById('sidebar-role');
    const avEl = document.getElementById('sidebar-avatar');
    if (nameEl) nameEl.textContent = APP.user.fullName;
    if (roleEl) roleEl.textContent = `${APP.user.squad} взвод • ${APP.user.groupLabel || ''}`;
    if (avEl) avEl.textContent = (APP.user.fullName[0] || 'К').toUpperCase();
    showScreen('screen-main');
    document.getElementById('mentor-toggle-btn').style.display = 'flex';
    preloadAllFingerprints();
    DB.latents.forEach(l => { if (l.aiMinutiae.length === 0) l.aiMinutiae = generateAIMinutiae(l.id); if (l.userMinutiae.length === 0) l.userMinutiae = [...l.aiMinutiae.map(m=>({...m}))]; });
    switchModule(APP.currentModule || 'dashboard');
    startClock();
    _updateReportBadge();
    addMentorMsg(`Сессия восстановлена. Вы вошли как ${APP.user.fullName} (${APP.user.squad} взвод). В журнале ${DB.journal.length} действий с прошлого захода.`, 'info');
    logAction('SESSION_RESTORED', `Восстановлена сессия ${APP.sessionId}`);
  }
});

// ================================================================
