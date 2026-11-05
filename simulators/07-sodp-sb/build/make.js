/* Сборка СОДП СБ: index.html, db/*.js, docs/**, missions/missions.js
 * Запуск:  cd build && npm i jsdom && node make.js
 * Исходники: build/src/index.src.html, src/datagen.js (генератор), src/missions.src.js (миссии 7–27). */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const rd = f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const wr = (rel, txt) => { const f = path.join(ROOT, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, txt); };

const gen = rd('datagen.js'), mis = rd('missions.src.js');
let html = rd('index.src.html')
  .replace('/*@@DATAGEN@@*/', () => gen)
  .replace('/*@@MISSIONS@@*/', () => mis.replace('__MISSION_TARGET__', 'SODP_MISSION_DEFS_BUILTIN'));
wr('index.html', html);
wr('missions/missions.js', mis.replace('__MISSION_TARGET__', 'SODP_MISSION_DEFS'));

// --- выгрузка базы из встроенного генератора ---
const { JSDOM } = require('jsdom');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/' });
setTimeout(() => {
  const w = dom.window;
  const dump = expr => JSON.parse(w.eval(`JSON.stringify(${expr})`));
  const sets = { cases: dump('DB.cases'), candidates: dump('DB.candidates'), complaints: dump('DB.complaints'), tasks: dump('DB.tasks'), security_events: dump('DB.securityEvents'), documents: dump('DB.documents') };
  const key = { security_events: 'securityEvents' };
  for (const [name, arr] of Object.entries(sets)) {
    const body = '/* СОДП СБ · синтетические данные (' + arr.length + ' записей). Файл можно править или заменять. */\nwindow.SODP_DB = window.SODP_DB || {};\nSODP_DB.' + (key[name] || name) + ' = [\n' + arr.map(r => JSON.stringify(r)).join(',\n') + '\n];\n';
    wr(`db/${name}.js`, body);
    console.log('db/' + name + '.js', arr.length);
  }
  for (const k of ['ic','fns','egrn','zags','fssp']) {
    const arr = dump('DB.registries.' + k);
    wr(`db/reg_${k}.js`, '/* СОДП СБ · синтетические данные учёта «' + k + '» (' + arr.length + ' записей). */\nwindow.SODP_DB = window.SODP_DB || {};\nSODP_DB.reg_' + k + ' = [\n' + arr.map(r => JSON.stringify(r)).join(',\n') + '\n];\n');
    console.log('db/reg_' + k + '.js', arr.length);
  }
  // --- документы ---
  global.window = undefined; require('./src/datagen.js'); const G = globalThis.SODP_GEN;
  const idx = { case: new Map(sets.cases.map(r => [r.id, r])), complaint: new Map(sets.complaints.map(r => [r.id, r])), candidate: new Map(sets.candidates.map(r => [r.id, r])) };
  sets.documents.forEach(d => wr(d.path, G.renderDoc(d, idx[d.owner].get(d.ownerId), {})));
  const emb = html.match(/\.emblem \{[^}]*?url\(data:image\/png;base64,([A-Za-z0-9+/=]+)\)/);
  if (emb) wr('docs/_assets/emblem.png', Buffer.from(emb[1], 'base64'));
  wr('docs/_assets/doc.css', G.DOC_CSS + '\n');
  wr('docs/_assets/available.js', '/* Сообщает симулятору, что папка docs/ доступна: документы открываются как файлы. */\nwindow.SODP_FILES = true;\n');
  console.log('docs:', sets.documents.length, 'файлов');
  process.exit(0);
}, 600);
