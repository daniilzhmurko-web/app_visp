// ===== СКВОЗНОЕ ЖУРНАЛИРОВАНИЕ + ЛОКАЛЬНОЕ ХРАНИЛИЩЕ =====
// ================================================================
const STORAGE_KEY = 'seko_cadet_session_v1';

function _nowIso() { return new Date().toISOString(); }
function _nowTimeRu() { return new Date().toLocaleTimeString('ru-RU'); }
function _genId() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function _cadetIdHash(fullName, squad) {
  // детерминированный ID курсанта для платформы проверки (пакетная обработка 100+)
  const raw = (fullName || '').trim().toLowerCase() + '|' + (squad || '').trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < raw.length; i++) { h = ((h << 5) - h) + raw.charCodeAt(i); h |= 0; }
  return 'c' + Math.abs(h).toString(36);
}

/**
 * Сквозное журналирование действий курсанта.
 * @param {string} action — тип действия (LOGIN, MODULE_OPEN, MINUTIA_ADD, ...)
 * @param {string|object} detail — описание. Если объект — мерджится как meta.
 * @param {object} [extra] — доп. поля: caseId, missionId, score, ...
 */
function logAction(action, detail, extra) {
  const now = new Date();
  const entry = {
    id: _genId(),
    ts: now.toISOString(),
    tsDisplay: now.toLocaleString('ru-RU'),
    seq: DB.journal.reduce((mx, e) => Math.max(mx, e.seq || 0), 0) + 1,           // порядковый номер — важен для пакетной обработки
    action,
    detail: stripEmoji(typeof detail === 'object' ? JSON.stringify(detail) : String(detail ?? '')),
    user: APP.user?.username || '—',
    fullName: APP.user?.fullName || null,
    squad: APP.user?.squad || null,
    cadetId: APP.cadetId || null,
    sessionId: APP.sessionId || null,
    module: APP.currentModule || null,
    caseId: APP.currentCase?.id || extra?.caseId || null,
    missionId: APP.currentMission?.id || extra?.missionId || null,
    missionStep: APP.currentMission ? APP.missionStep : null,
    // Контекстные данные (для тепловых карт и таблиц в дашборде платформы)
    meta: (typeof detail === 'object' && detail !== null) ? { ...detail } : (extra || {}),
  };
  // Привязка к активному делу (для отслеживания полного цикла работы с делом)
  if (APP.currentCase) {
    const cid = APP.currentCase.id;
    if (!APP.casesActivity[cid]) APP.casesActivity[cid] = { id: cid, kusp: APP.currentCase.kusp };
    const a = APP.casesActivity[cid];
    if (action === 'CASE_OPEN') a.opened = now.toISOString();
    if (action === 'CODING_SAVE') a.coded = now.toISOString();
    if (action === 'SEARCH_COMPLETE') a.searched = now.toISOString();
    if (action === 'MATCH_CONFIRM' || action === 'MATCH_REJECT' || action === 'MATCH_UNDEFINED') {
      a.decision = action.replace('MATCH_', '').toLowerCase();
      a.isTrue = APP.currentCase.trueMatch === APP.selectedCandidate?.id;
    }
  }
  // Привязка к миссии
  if (APP.currentMission && action === 'MISSION_START') APP.missionStartTs = now.toISOString();
  if (APP.currentMission && action === 'MISSION_COMPLETE') {
    APP.missionsProgress[APP.currentMission.id] = APP.missionsProgress[APP.currentMission.id] || {};
    APP.missionsProgress[APP.currentMission.id].completedAt = now.toISOString();
  }
  DB.journal.push(entry);
  _persistSession();   // автосохранение
  _updateReportBadge();
  return entry;
}

function _updateReportBadge() {
  const el = document.getElementById('report-action-count');
  if (el) el.textContent = DB.journal.length;
}

function _persistSession() {
  try {
    // ФИКС: раньше разметка минуций (userMinutiae) не сохранялась вообще —
    // после перезагрузки страницы весь прогресс кодирования по всем делам
    // сбрасывался обратно на AI-версию, хотя журнал показывал CODING_SAVE.
    // Теперь сохраняем фактическое состояние каждого дела (статус + минуции).
    const latentsState = DB.latents
      .filter(l => l.status !== 'new' || l.custom || JSON.stringify(l.userMinutiae) !== JSON.stringify(l.aiMinutiae))
      .map(l => ({ id: l.id, status: l.status, userMinutiae: l.userMinutiae, aiMinutiae: l.aiMinutiae, custom: !!l.custom }));
    // ФИКС: дела, зарегистрированные курсантом через модуль «Регистрация следа»,
    // не хранились нигде за пределами DB.latents текущей сессии — сохраняем их
    // целиком, чтобы они пережили перезагрузку страницы.
    const customLatents = DB.latents.filter(l => l.custom);
    const payload = {
      user: APP.user,
      cadetId: APP.cadetId,
      sessionId: APP.sessionId,
      sessionStartTs: APP.sessionStartTs,
      journal: DB.journal,
      archive: DB.archive || [],
      casesActivity: APP.casesActivity,
      missionsProgress: APP.missionsProgress,
      // восстановимые поля:
      activeLatentId: APP.currentCase?.id || null,
      activeMissionId: APP.currentMission?.id || null,
      activeMissionStep: APP.missionStep,
      score: APP.score,
      latentsState,
      customLatents,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    APP._persisted = true;
  } catch (e) {
    console.warn('persist failed', e);
  }
}

function _restoreSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !data.user) return false;
    // Предъявлен токен другого курсанта — чужую сессию не восстанавливаем
    if (window.IdentityToken && IdentityToken.isPresent() && IdentityToken.getName() && data.user.fullName !== IdentityToken.getName()) return false;
    APP.user = data.user;
    APP.cadetId = data.cadetId || _cadetIdHash(data.user.fullName, data.user.squad);
    APP.sessionId = data.sessionId;
    APP.sessionStartTs = data.sessionStartTs;
    APP.casesActivity = data.casesActivity || {};
    APP.missionsProgress = data.missionsProgress || {};
    APP.score = data.score || APP.score;
    DB.journal = Array.isArray(data.journal) ? data.journal : [];
    DB.archive = Array.isArray(data.archive) ? data.archive : [];
    // ФИКС: сначала возвращаем в базу дела, зарегистрированные вручную (custom),
    // затем — накопленную разметку минуций по всем делам (включая встроенные).
    if (Array.isArray(data.customLatents)) {
      data.customLatents.forEach(cl => {
        if (!DB.latents.find(x => x.id === cl.id)) DB.latents.push(cl);
        if (!IDEAL_MINUTIAE[cl.id]) { const _c = cl.trueMatch && DB.tenprints.find(t => t.id === cl.trueMatch); IDEAL_MINUTIAE[cl.id] = generateIdealMinutiae(cl.id, _c ? Math.max(8, _c.fingers[cl.fingerIndex] || 20) : 20); }
        const _n = parseInt(String(cl.id).replace(/\D/g, ''), 10);
        if (_n > _customLatentSeq) _customLatentSeq = _n;
      });
    }
    if (Array.isArray(data.latentsState)) {
      data.latentsState.forEach(ls => {
        const l = DB.latents.find(x => x.id === ls.id);
        if (l) {
          l.status = ls.status || l.status;
          if (Array.isArray(ls.userMinutiae)) l.userMinutiae = ls.userMinutiae;
          if (Array.isArray(ls.aiMinutiae) && ls.aiMinutiae.length) l.aiMinutiae = ls.aiMinutiae;
        }
      });
    }
    if (data.activeLatentId) {
      const l = DB.latents.find(x => x.id === data.activeLatentId);
      if (l) APP.currentCase = l;
    }
    if (data.activeMissionId) {
      const m = MISSIONS.find(x => x.id === data.activeMissionId);
      if (m) { APP.currentMission = m; APP.missionStep = data.activeMissionStep || 0; }
    }
    return true;
  } catch (e) {
    console.warn('restore failed', e);
    return false;
  }
}

function _clearPersistedSession() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  APP._persisted = false;
}

// ================================================================
