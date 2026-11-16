#!/usr/bin/env node
'use strict';
/* Импорт реальных фотографий фиксации в тренажёр.

   Запуск:
     node tools/import-photos.js <папка_с_фото> [--plates plates.csv] [--source "URL или название"] [--license "CC BY 4.0"]
                                 [--article 12.9.2] [--cam CAM-077-001]

   Для каждого изображения (.jpg/.jpeg/.png/.webp):
     • госномер берётся из plates.csv (колонки: file;plate[;article;speed;limit;camId;lane;ocr;conf]),
       а если файла нет — из имени файла, когда оно похоже на номер (например, А123ВС77.jpg);
     • необязательный файл разметки YOLO рядом с фото (то же имя, .txt: «класс xc yc w h» в долях кадра) задаёт рамку номера;
       без него рамки в «фотоматериале» будут приблизительными;
     • создаются ВЫМЫШЛЕННЫЙ владелец и ТС в базе ФИС с этим номером, запись в базе фиксаций и копия фото в assets/photos/.
   Результат — data/photos.js (подключён в index.html) и assets/photos/ATTRIBUTION.txt (источники и лицензии).

   ВАЖНО: настоящий госномер, привязанный к вымышленному владельцу, — это недостоверные сведения о реальном человеке.
   Для учебных материалов заменяйте номера вымышленными (tools/replate.py) либо используйте фото с согласия владельцев. */
const fs = require('fs'), path = require('path');
const { RNG } = require('./lib/prng');
const P = require('./lib/ru-pools');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const dir = args.find(a => !a.startsWith('--') && fs.existsSync(a) && fs.statSync(a).isDirectory());
if (!dir) { console.error('Использование: node tools/import-photos.js <папка_с_фото> [--plates plates.csv] [--source ...] [--license ...]'); process.exit(1); }

const LAT2CYR = { A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', Y: 'У', X: 'Х' };
const normPlate = p => String(p || '').toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/g, '').replace(/[A-Z]/g, c => LAT2CYR[c] || c);
const PLATE_RE = /^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/;
const pad = (n, w = 2) => String(n).padStart(w, '0');

/* размеры изображения без внешних библиотек */
function imageSize(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };           // PNG
  if (buf[0] === 0xFF && buf[1] === 0xD8) {                                                                       // JPEG
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xFF) { i++; continue; }
      const m = buf[i + 1], len = buf.readUInt16BE(i + 2);
      if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      i += 2 + len;
    }
  }
  if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') {                           // WebP
    const t = buf.slice(12, 16).toString();
    if (t === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (t === 'VP8L') { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }; }
    if (t === 'VP8X') return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
  }
  return null;
}
function readCsv(file) {
  const map = {};
  if (!file || !fs.existsSync(file)) return map;
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const head = lines.shift().split(/[;,]/).map(s => s.trim());
  lines.forEach(l => { const c = l.split(/[;,]/); const r = {}; head.forEach((h, i) => r[h] = (c[i] || '').trim()); if (r.file) map[r.file] = r; });
  return map;
}
function readYolo(file) {
  if (!fs.existsSync(file)) return null;
  let best = null;
  fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach(l => {
    const t = l.trim().split(/\s+/).map(Number); if (t.length < 5 || t.some(isNaN)) return;
    const [, xc, yc, w, h] = t; if (!best || w * h > best.w * best.h) best = { xc, yc, w, h };
  });
  return best;
}

/* ───────── манифест (накапливается между запусками) ───────── */
const manifestPath = path.join(__dirname, 'photos-manifest.json');
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : { items: [] };
const csv = readCsv(opt('plates') || path.join(dir, 'plates.csv'));
const photosDir = path.join(root, 'assets', 'photos'); fs.mkdirSync(photosDir, { recursive: true });
const rng = new RNG(7000 + manifest.items.length);
const MSK = ['CAM-077-001', 'CAM-077-002', 'CAM-077-003', 'CAM-077-004', 'CAM-077-005', 'CAM-077-006', 'CAM-077-007', 'CAM-077-008', 'CAM-077-009', 'CAM-077-010'];
const SPEED_ART = P.KOAP.filter(k => k.speed);

const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
let added = 0, skipped = [];
for (const f of files) {
  if (manifest.items.some(it => it.src === f)) { continue; }
  const stem = f.replace(/\.[^.]+$/, '');
  const row = csv[f] || csv[stem] || {};
  let plate = normPlate(row.plate || stem);
  if (!PLATE_RE.test(plate)) { skipped.push(`${f}: не указан допустимый госномер (добавьте строку в plates.csv)`); continue; }
  const buf = fs.readFileSync(path.join(dir, f));
  const sz = imageSize(buf); if (!sz) { skipped.push(`${f}: не удалось определить размер изображения`); continue; }
  const n = manifest.items.length + 1;
  const ext = path.extname(f).toLowerCase().replace('jpeg', 'jpg');
  const dest = `PH-${pad(n, 5)}${ext}`;
  fs.copyFileSync(path.join(dir, f), path.join(photosDir, dest));
  const lab = readYolo(path.join(dir, stem + '.txt'));
  let geom = null;
  if (lab) {                                                   // рамка номера из YOLO → оценка рамки автомобиля по пропорциям
    const pl = [lab.xc - lab.w / 2, lab.yc - lab.h / 2, lab.w, lab.h];
    const cw = Math.min(1, lab.w * 3.46), ch = Math.min(1, lab.h * 12.9);
    const cy1 = Math.min(1, lab.yc + lab.h * 3.1), cy0 = Math.max(0, cy1 - ch);
    const clamp = b => b.map(v => Math.round(Math.max(0, v) * 10000) / 10000);
    geom = { car: clamp([Math.max(0, lab.xc - cw / 2), cy0, cw, cy1 - cy0]), plate: clamp(pl), lights: [], approx: true };
  }
  const art = (row.article && P.KOAP.find(k => k.code === row.article)) || P.KOAP.find(k => k.code === opt('article')) || rng.pick(SPEED_ART);
  const camId = row.camId || opt('cam') || rng.pick(MSK);
  const limit = Number(row.limit) || 60;
  const speed = art.speed ? (Number(row.speed) || limit + rng.int(art.over[0], Math.min(art.over[1], art.over[0] + 20))) : 0;
  manifest.items.push({ n, src: f, file: 'assets/photos/' + dest, plate, ocrPlate: normPlate(row.ocr || plate), ocrConf: Number(row.conf) || rng.int(78, 97),
    article: art.code, speed, limit: art.speed ? limit : 0, camId, lane: Number(row.lane) || rng.int(1, 3), aspect: Math.round(sz.w / sz.h * 10000) / 10000, geom,
    source: opt('source') || '', license: opt('license') || '' });
  added++;
}

/* ───────── генерация вымышленных владельцев и ТС ───────── */
const owners = [], vehicles = [], fixations = [];
const NOW = new Date(2026, 9, 27);
const fmt = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
manifest.items.forEach(it => {
  const r = new RNG(900000 + it.n * 97);
  const sex = r.chance(.6) ? 'M' : 'F';
  const fam = sex === 'M' ? r.pick(P.SURNAMES) : P.femSurname(r.pick(P.SURNAMES));
  const im = sex === 'M' ? r.pick(P.MALE)[0] : r.pick(P.FEMALE), ot = r.pick(P.MALE)[sex === 'M' ? 1 : 2];
  const region = (it.plate.match(/\d{2,3}$/) || ['77'])[0];
  const street = r.pick(P.MOSCOW_STREETS);
  const oid = 'OWN-P' + pad(it.n, 5), vid = 'VEH-P' + pad(it.n, 5);
  owners.push({ id: oid, kind: 'person', fam, im, ot, sex, born: fmt(new Date(NOW.getFullYear() - r.int(23, 65), r.int(0, 11), r.int(1, 28))), passport: `${r.int(40, 46)}${r.digits(2)} ${r.digits(6)}`,
    inn: String(region).slice(-2).padStart(2, '0') + r.digits(10), phone: `+7 (9${r.digits(2)}) ${r.digits(3)}-${r.digits(2)}-${r.digits(2)}`, addr: `г. Москва, ${street}, д. ${r.int(1, 120)}, кв. ${r.int(1, 240)}`, zip: String(r.int(101, 129)) + r.digits(3), region, scenario: false, fromPhoto: true });
  const m = r.pick(P.MODELS.filter(x => x[3] === 'B')), year = r.int(Math.max(m[4], 2010), m[5]);
  vehicles.push({ id: vid, plate: it.plate, region, vin: m[6] + r.digits(8).replace(/./g, c => 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'[(+c * 3 + 7) % 33]) + r.digits(6), make: m[0], model: m[1], body: m[2], category: 'B', year,
    color: r.pick(P.COLORS)[0], power: r.pick([90, 110, 122, 150, 190]), sts: `${String(region).slice(-2).padStart(2, '0')} ${r.int(10, 99)} ${r.digits(6)}`, pts: `${String(region).slice(-2).padStart(2, '0')} ${r.pick(P.PLATE_LETTERS)}${r.pick(P.PLATE_LETTERS)} ${r.digits(6)}`,
    regDate: fmt(new Date(year, r.int(0, 11), r.int(1, 28))), regStatus: 'registered', ownerId: oid,
    osago: { status: 'valid', policy: `ТТТ ${r.digits(10)}`, insurer: r.pick(P.INSURERS), until: fmt(new Date(2027, r.int(0, 8), r.int(1, 28))) }, techInspectionUntil: null, wanted: false, restricted: false, scenario: false, fromPhoto: true });
  fixations.push({ id: 'FIX-P' + pad(it.n, 5), file: it.file, real: true, vehicleId: vid, plate: it.plate, ocrPlate: it.ocrPlate, ocrConf: it.ocrConf, camId: it.camId, article: it.article,
    speed: it.speed, limit: it.limit, lane: it.lane, aspect: it.aspect, geom: it.geom, source: it.source, license: it.license, scene: { light: 'day', weather: 'clear', road: 'city', plateCond: 'clean', distance: 20, seed: 0 } });
});

const J = rows => rows.length ? '[\n' + rows.map(x => '      ' + JSON.stringify(x)).join(',\n') + '\n    ]' : '[]';
fs.writeFileSync(path.join(root, 'data', 'photos.js'),
`/* Пользовательские (реальные) фотографии фиксации — сгенерировано tools/import-photos.js. Не править вручную.
   Владельцы и ТС — ВЫМЫШЛЕННЫЕ; номера на фото должны быть вымышленными или использоваться с согласия владельцев. */
CAFAP_DB.register("photos", {
  "meta": ${JSON.stringify({ name: 'Пользовательские фото', description: 'Импортированные фотографии фиксации (дополняют ФИС и базу фиксаций)', generatedBy: 'tools/import-photos.js', seed: 0, synthetic: false, generatedAt: fmt(NOW) })},
  "tables": {
    "owners": ${J(owners)},
    "vehicles": ${J(vehicles)},
    "fixations": ${J(fixations)}
  }
});
`);
fs.writeFileSync(path.join(photosDir, 'ATTRIBUTION.txt'),
  'Источники и лицензии импортированных фотографий\n' + manifest.items.map(it => `${path.basename(it.file)}  ←  ${it.src}  |  источник: ${it.source || '—'}  |  лицензия: ${it.license || '—'}`).join('\n') + '\n');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
console.log(`Импортировано новых фото: ${added}; всего в базе: ${manifest.items.length}`);
skipped.forEach(s => console.log('  пропущено — ' + s));
