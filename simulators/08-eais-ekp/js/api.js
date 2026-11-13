/* Серверная синхронизация: при работе через server.py сессия курсанта и журнал дублируются в SQLite */
(function () {
  if (window.PAPILON_MODE !== 'server') return;
  let timer = null;
  function push() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return;
      fetch('api/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payload: JSON.parse(raw) }) }).catch(() => {});
    } catch (e) { /* ignore */ }
  }
  const orig = window._persistSession;
  window._persistSession = function () { orig.apply(this, arguments); clearTimeout(timer); timer = setTimeout(push, 1500); };
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') push(); });  // без keepalive: тело сессии может превышать 64 КБ
})();
