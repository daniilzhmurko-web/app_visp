/* Загрузчик: получает справочные данные (API/SQLite или data/*.json), затем подключает модули приложения по порядку */
(async function () {
  const fail = (m) => { document.body.insertAdjacentHTML('afterbegin', '<div style="position:fixed;inset:0;z-index:9999;background:#0f2a52;color:#fff;display:flex;align-items:center;justify-content:center;padding:32px;font:16px/1.5 system-ui,sans-serif;text-align:center"><div style="max-width:560px"><h2 style="margin:0 0 12px">АДИС «Папилон»</h2><p>' + m + '</p></div></div>'); };
  // Источники данных: 1) API/SQLite (если сайт запущен через server.py), 2) встроенная база data/data.js (работает и при открытии файла двойным кликом)
  let data = null, mode = 'static';
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    try { const r = await fetch('api/ref', { cache: 'no-store' }); if (r.ok) { data = await r.json(); mode = 'server'; } } catch (e) { /* нет сервера — используем встроенные данные */ }
  }
  if (!data && window.PAPILON_EMBEDDED) data = window.PAPILON_EMBEDDED;
  if (!data) { fail('Не удалось загрузить базу данных: отсутствует файл <b>data/data.js</b>. Пересоберите его командой <code>python3 tools/build_data_js.py</code>.'); return; }
  window.PAPILON_DATA = data; window.PAPILON_MODE = mode;
  const files = ["js/icons.js", "js/app/00-identity.js", "js/app/10-data.js", "js/app/20-engine.js", "js/app/30-state.js", "js/app/31-journal-storage.js", "js/app/32-auth.js", "js/app/33-ui-utils.js", "js/app/40-dashboard.js", "js/app/41-cases.js", "js/app/42-registration.js", "js/app/43-coding.js", "js/app/44-search.js", "js/app/45-hitlist.js", "js/app/46-comparison.js", "js/app/47-rlpositive.js", "js/app/48-report.js", "js/app/49-journal.js", "js/app/50-missions.js", "js/app/51-mentor.js", "js/app/52-notifications.js", "js/app/53-init.js", "js/app/54-export.js", "js/app/55-fingerprint-render.js", "js/api.js"];
  for (const f of files) {
    await new Promise((res, rej) => { const s = document.createElement('script'); s.src = f; s.async = false; s.onload = res; s.onerror = () => rej(new Error(f)); document.body.appendChild(s); })
      .catch(e => { fail('Ошибка загрузки модуля ' + e.message); throw e; });
  }
  document.dispatchEvent(new Event('DOMContentLoaded'));   // запуск инициализации приложения (модули подключены после штатного события)
})();
