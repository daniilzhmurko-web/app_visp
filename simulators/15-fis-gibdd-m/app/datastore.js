/* ═══ FISDATA — хранилище баз для работы БЕЗ сервера (двойной клик по index.html) ═══
   Пакеты данных — обычные .js-файлы (data/js/*.js), которые подключаются тегом <script>.
   Это работает по протоколу file://, где fetch() и чтение локальных JSON запрещены.
   Данные ТОЛЬКО ДЛЯ ЧТЕНИЯ: каждая сессия получает свежие копии строк, изменения живут в памяти сессии. */
(function () {
  'use strict';
  var state = { manifest: null, shards: {}, docs: [], loaded: false, failed: false, done: {}, pending: {} };
  var CONV = {
    int:  function (v) { return v === null || v === '' ? null : +v; },
    num:  function (v) { return v === null || v === '' ? null : +v; },
    bool: function (v) { return !!v; },
    list: function (v) { return v ? String(v).split(',') : []; },
    nullstr: function (v) { return v ? v : null; }
  };
  function shiftDate(s, n) {
    if (!s) return null;
    var p = s.split('-').map(Number);
    return new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)).toISOString().slice(0, 10);
  }
  function pad3(n) { return ('000' + n).slice(-3); }

  /* Подключает пакеты указанных наборов обычными <script> (работает по file://) */
  function loadSets(names, onProgress) {
    return new Promise(function (resolve) {
      var urls = [];
      names.forEach(function (set) {
        for (var i = 0; i < state.manifest.sets[set].shards; i++) urls.push('data/js/' + set + '.' + pad3(i) + '.js');
      });
      var total = urls.length, done = 0, next = 0, active = 0, failed = null, finished = false;
      if (!total) return resolve({ ok: true, shards: 0 });
      function finish() {
        if (finished) return; finished = true;
        if (failed) return resolve({ ok: false, reason: 'не найден файл ' + failed });
        for (var k = 0; k < names.length; k++) {
          if ((state.shards[names[k]] || []).length !== state.manifest.sets[names[k]].shards) return resolve({ ok: false, reason: 'неполный набор ' + names[k] });
        }
        names.forEach(function (n) { state.done[n] = true; });
        resolve({ ok: true, shards: total });
      }
      function pump() {
        while (active < 4 && next < urls.length && !failed) {
          (function (u) {
            active++;
            var sc = document.createElement('script');
            sc.src = u; sc.async = true;
            sc.onload = sc.onerror = function (ev) {
              if (ev && ev.type === 'error') failed = failed || u;
              active--; done++;
              if (onProgress) onProgress(done, total);
              if (sc.parentNode) sc.parentNode.removeChild(sc);
              if (done === total || (failed && active === 0)) finish(); else pump();
            };
            document.head.appendChild(sc);
          })(urls[next++]);
        }
      }
      pump();
    });
  }

  var FISDATA = {
    manifest: function (m) { state.manifest = m; },
    add: function (set, shard, cols, rows) { (state.shards[set] = state.shards[set] || []).push({ shard: shard, cols: cols, rows: rows }); },
    docs: function (arr) { state.docs = arr || []; },
    docsList: function () { return state.docs; },
    hasManifest: function () { return !!state.manifest; },
    available: function () { return state.loaded && !state.failed && !!state.manifest; },
    info: function () { return state.manifest; },
    /* Все даты в пакетах сдвигаются так, будто база сформирована «сегодня»:
       просрочки, сроки ВУ и платежей остаются актуальными, сколько бы времени ни прошло. */
    shiftDays: function () {
      if (!state.manifest) return 0;
      var g = state.manifest.generated.split('-').map(Number), t = new Date();
      return Math.round((Date.UTC(t.getFullYear(), t.getMonth(), t.getDate()) - Date.UTC(g[0], g[1] - 1, g[2])) / 864e5);
    },
    /* Базовые наборы (не lazy) загружаются при открытии страницы; базы ведомств — по требованию (ensure) */
    load: function (onProgress) {
      var names = Object.keys(state.manifest ? state.manifest.sets : {}).filter(function (n) { return !state.manifest.sets[n].lazy; });
      if (!state.manifest) return Promise.resolve({ ok: false, reason: 'нет manifest.js' });
      return loadSets(names, onProgress).then(function (r) {
        if (!r.ok) { state.failed = true; return r; }
        state.loaded = true;
        var rows = 0; names.forEach(function (n) { rows += state.manifest.sets[n].rows; });
        return { ok: true, rows: rows, shards: r.shards };
      });
    },
    lazyNames: function () { return Object.keys(state.manifest ? state.manifest.sets : {}).filter(function (n) { return state.manifest.sets[n].lazy; }); },
    isLoaded: function (n) { return !!state.done[n]; },
    ensure: function (names) {
      if (!state.manifest) return Promise.resolve({ ok: false, reason: 'нет manifest.js' });
      names = (names || []).filter(function (n) { return state.manifest.sets[n]; });
      return Promise.all(names.map(function (n) {
        if (state.done[n]) return Promise.resolve({ ok: true });
        if (!state.pending[n]) state.pending[n] = loadSets([n]);
        return state.pending[n];
      })).then(function (rs) { var bad = rs.filter(function (r) { return !r.ok; })[0]; return bad || { ok: true }; });
    },
    /* Возвращает НОВЫЙ массив объектов набора (каждая сессия работает со своей копией) */
    rows: function (set) {
      var m = state.manifest && state.manifest.sets[set];
      if (!m) return [];
      var shards = (state.shards[set] || []).slice().sort(function (a, b) { return a.shard - b.shard; });
      var sh = this.shiftDays(), types = m.types || {}, out = [];
      shards.forEach(function (s) {
        var cols = s.cols, n = cols.length, conv = cols.map(function (c) {
          var t = types[c];
          if (t === 'date') return function (v) { return v ? (sh ? shiftDate(v, sh) : v) : null; };
          return CONV[t] || null;
        });
        for (var r = 0; r < s.rows.length; r++) {
          var row = s.rows[r], o = {};
          for (var i = 0; i < n; i++) { var v = row[i]; o[cols[i]] = conv[i] ? conv[i](v) : v; }
          out.push(o);
        }
      });
      return out;
    }
  };
  window.FISDATA = FISDATA;
})();
