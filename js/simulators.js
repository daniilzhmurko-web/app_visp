/* ЛОГИКА приложения. Данные — в data/. */
// Симулятор/инструкция открываются отдельной страницей: simulators/<NN-слаг>/index.html и instructions/<NN-слаг>/index.html.
// Подключённые папки регистрирует tools/scan_simulators.py в data/sim-files.js (работает и по file://, и с сервера).
// Проверка существования файла без fetch (fetch не работает по file://): грузим его как <script>.
// Файл есть -> сработает onload (HTML как JS даст SyntaxError, мы его гасим); файла нет -> onerror.
function probeFile(url, cb) {
  var s = document.createElement('script'), done = false;
  function sup(e) { if (e.filename && e.filename.indexOf(url) >= 0) e.preventDefault(); }
  function fin(ok) {
    if (done) return; done = true;
    setTimeout(function () { window.removeEventListener('error', sup, true); }, 300);
    if (s.parentNode) s.parentNode.removeChild(s);
    cb(ok);
  }
  window.addEventListener('error', sup, true);
  s.onload = function () { fin(true); };
  s.onerror = function () { fin(false); };
  s.src = url;
  document.head.appendChild(s);
}

function showPlaceholder(id, kind, label, path) {
  var sim = SIMS[id];
  document.getElementById('ph-ico').innerHTML = ICONS[kind === 'instr' ? 'doc' : sim.icon] || ICONS.gear;
  document.getElementById('ph-ttl').textContent = sim.title + ' — ' + label + ' НЕ ПОДКЛЮЧЕН' + (kind === 'instr' ? 'А' : '');
  document.getElementById('ph-code').textContent = path;
  document.getElementById('ph-overlay').classList.add('on');
}

// 1) если id есть в реестре data/sim-files.js — открываем сразу;
// 2) иначе сами ищем файл по соглашению <папка>/<NN-слаг>/index.html (запускать scan_simulators.py не обязательно);
// 3) не нашли — заглушка с точным путём.
function openSimFile(id, map, kind, label) {
  var sim = SIMS[id];
  if (!sim) return;
  var dirs = (kind === 'instr' ? window.INSTR_DIRS : window.SIM_DIRS) || {};
  var path = (kind === 'instr' ? 'instructions/' : 'simulators/') + (dirs[id] || id) + '/index.html';
  var file = (map || {})[id];
  if (file) { window.location.href = file; return; }
  // запасные имена на случай, если Windows скрыла расширение и файл сохранён как index.htm / index.html.html
  var base = path.replace(/index\.html$/, '');
  var tries = [path, base + 'index.htm', base + 'index.html.html'];
  (function next(i) {
    if (i >= tries.length) { showPlaceholder(id, kind, label, path); return; }
    probeFile(tries[i], function (ok) {
      if (ok) window.location.href = tries[i]; else next(i + 1);
    });
  })(0);
}

function openSim(id) { openSimFile(id, window.SIM_FILES, 'sim', 'СИМУЛЯТОР'); }

function openInstruction(id) { openSimFile(id, window.INSTR_FILES, 'instr', 'ИНСТРУКЦИЯ'); }


function closePh() { document.getElementById('ph-overlay').classList.remove('on'); }
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closePh();
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
});
