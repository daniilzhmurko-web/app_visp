#!/usr/bin/env node
'use strict';
/* Сборка учебных баз данных и снимков фиксации.
   Запуск:  node tools/build.js            — всё (data/*.js + assets/snapshots/*.svg)
            node tools/build.js --no-snap  — только базы данных
   Результат детерминирован (seed в db-builder.js), данные СИНТЕТИЧЕСКИЕ. */
const fs = require('fs'), path = require('path');
const { build } = require('./lib/db-builder');
const { renderSnapshot } = require('./lib/snapshot-renderer');

const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data'), snapDir = path.join(root, 'assets', 'snapshots');
fs.mkdirSync(dataDir, { recursive: true }); fs.mkdirSync(snapDir, { recursive: true });

const db = build();
const noSnap = process.argv.includes('--no-snap');
/* 1) рисуем снимки (получаем геометрию объектов для рамок), 2) пишем базы */
{
  const veh = new Map(db.fis_gibdd_m.tables.vehicles.map(v => [v.id, v]));
  const colors = {}; db.nsi.tables.colors.forEach(c => colors[c.name] = c.hex);
  let total = 0;
  for (const f of db.fixations.tables.fixations) {
    const r = renderSnapshot(f, veh.get(f.vehicleId), colors);
    f.geom = r.geom;
    if (!noSnap) { fs.writeFileSync(path.join(root, f.file), r.svg); total += r.svg.length; }
  }
  if (!noSnap) console.log(`assets/snapshots: ${db.fixations.tables.fixations.length} SVG, ${(total / 1024 / 1024).toFixed(1)} MB`);
}
const HEAD = (m) => `/* ${m.name} — учебная СИНТЕТИЧЕСКАЯ база данных. Все персоны, номера и документы вымышлены.\n   Сгенерировано: tools/build.js (seed=${m.seed}). Не редактируйте вручную — пересоберите командой node tools/build.js */\n`;

for (const [name, d] of Object.entries(db)) {
  let out = HEAD(d.meta) + `CAFAP_DB.register(${JSON.stringify(name)}, {\n  "meta": ${JSON.stringify(d.meta)},\n  "tables": {\n`;
  const tn = Object.keys(d.tables);
  tn.forEach((t, i) => {
    const rows = d.tables[t];
    out += `    ${JSON.stringify(t)}: [\n` + rows.map(r => '      ' + JSON.stringify(r)).join(',\n') + `\n    ]` + (i < tn.length - 1 ? ',\n' : '\n');
  });
  out += '  }\n});\n';
  fs.writeFileSync(path.join(dataDir, name + '.js'), out);
  console.log('data/' + name + '.js', (out.length / 1024).toFixed(0) + ' KB', tn.map(t => `${t}:${d.tables[t].length}`).join(' '));
}
