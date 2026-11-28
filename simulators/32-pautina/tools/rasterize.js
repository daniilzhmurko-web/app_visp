#!/usr/bin/env node
'use strict';
/* ═══════════════════════════════════════════════════════════════════════
   ГЕНЕРАТОР РАСТРОВЫХ КОПИЙ СНИМКОВ: SVG → JPG / PNG.

   Зачем: синтетические снимки фиксации нарисованы вектором (SVG). Часто
   удобнее иметь обычные картинки — их можно показать в любом редакторе,
   распечатать, отправить в мессенджер, загрузить в презентацию. Этот
   инструмент конвертирует снимки в растровый формат ОДИН К ОДНОМУ
   (те же имена файлов), после чего тренажёр сам начнёт показывать JPG/PNG
   вместо SVG — менять базу и код не нужно.

   Использование:
     node tools/rasterize.js                     # все снимки assets/snapshots → JPG
     node tools/rasterize.js --format png        # …в PNG
     node tools/rasterize.js --scale 2           # 2560×1440 вместо 1280×720
     node tools/rasterize.js --quality 88        # качество JPEG (по умолчанию 85)
     node tools/rasterize.js --only-missing      # не перегенерировать существующие
     node tools/rasterize.js --force             # перегенерировать всё
     node tools/rasterize.js --from ./my_svgs --out ./my_png   # произвольные SVG

   Требования: Node.js 18+. Для точного рендера (фильтры, шрифты с
   кириллицей) используется headless Chromium из пакета playwright:
       npm i playwright && npx playwright install chromium
   Если playwright не установлен, инструмент попробует rsvg-convert /
   inkscape / ImageMagick (качество может отличаться).

   После конвертации пересоберите базу, чтобы пути в базе фиксаций
   указали на растровые копии:
       node tools/build.js
   (или просто перезапустите сборку — растровые копии подхватываются автоматически)
   ═══════════════════════════════════════════════════════════════════════ */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, execSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const DEFAULT_IN = path.join(root, 'assets', 'snapshots');
const DEFAULT_OUT = path.join(root, 'assets', 'snapshots');

/* ───────── разбор аргументов ───────── */
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  if (i < 0) return def;
  const v = process.argv[i + 1];
  return (v === undefined || v.startsWith('--')) ? true : v;
}
const has = name => process.argv.includes('--' + name);

const OPTS = {
  from: String(arg('from', DEFAULT_IN)),
  out: String(arg('out', DEFAULT_OUT)),
  format: String(arg('format', 'jpg')).toLowerCase(),
  scale: Math.max(1, Number(arg('scale', 1)) || 1),
  quality: Math.min(100, Math.max(40, Number(arg('quality', 85)) || 85)),
  onlyMissing: has('only-missing'),
  force: has('force'),
  width: Number(arg('width', 1280)) || 1280,
};

if (!['jpg', 'jpeg', 'png', 'webp'].includes(OPTS.format)) {
  console.error('Неизвестный формат: ' + OPTS.format + ' (допустимо: jpg, png, webp)');
  process.exit(1);
}
if (OPTS.format === 'jpeg') OPTS.format = 'jpg';

/* ───────── поиск движка рендеринга ───────── */
function requireFirst(paths) {
  for (const p of paths) {
    try { return require(p); } catch (e) { /* ищем дальше */ }
  }
  return null;
}
function findPlaywright() {
  const tries = ['playwright', 'playwright-core'];
  const roots = [];
  if (process.env.NODE_PATH) roots.push(...process.env.NODE_PATH.split(path.delimiter));
  try { roots.push(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch (e) { /* npm не найден */ }
  roots.push('/usr/local/lib/node_modules', '/usr/lib/node_modules');
  const extra = [];
  for (const r of roots) for (const t of ['playwright', 'playwright-core']) extra.push(path.join(r, t));
  const mod = requireFirst(tries.concat(extra));
  return mod && mod.chromium ? mod : null;
}
function have(bin) {
  try { execSync('command -v ' + bin, { stdio: 'ignore' }); return true; } catch (e) { return false; }
}

const PW = findPlaywright();
const RSVG = have('rsvg-convert') ? 'rsvg-convert' : null;
const INK = have('inkscape') ? 'inkscape' : null;
const IM = have('convert') ? 'convert' : null;

if (!PW && !RSVG && !INK && !IM) {
  console.error('Не найден ни один движок рендеринга SVG.');
  console.error('Установите один из вариантов:');
  console.error('  npm i playwright && npx playwright install chromium   (рекомендуется)');
  console.error('  sudo apt install librsvg2-bin        # rsvg-convert');
  console.error('  sudo apt install inkscape             # inkscape');
  process.exit(1);
}

/* Ищем установленный Chromium: полный браузер или headless-shell.
   Playwright сам ищет только свой headless-shell, поэтому ищем оба варианта
   в кэше браузеров (часто он лежит в /root, а HOME у процесса другой). */
function findChromiumExec() {
  const cands = [];
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) cands.push(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH);
  if (process.env.CHROME_PATH) cands.push(process.env.CHROME_PATH);
  const roots = [];
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) roots.push(process.env.PLAYWRIGHT_BROWSERS_PATH);
  roots.push(path.join(os.homedir() || '', '.cache', 'ms-playwright'));
  roots.push('/root/.cache/ms-playwright');
  roots.push('/usr/lib/playwright');
  roots.push('/opt/playwright');
  for (const r of roots) {
    if (!fs.existsSync(r)) continue;
    let dirs = [];
    try { dirs = fs.readdirSync(r); } catch (e) { continue; }
    for (const d of dirs) {
      if (!/chromium/i.test(d)) continue;
      const base = path.join(r, d);
      cands.push(path.join(base, 'chrome-linux', 'chrome'));
      cands.push(path.join(base, 'chrome-linux64', 'chrome'));
      cands.push(path.join(base, 'chrome-headless-shell-linux64', 'chrome-headless-shell'));
      cands.push(path.join(base, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'));
    }
  }
  for (const c of cands) { if (c && fs.existsSync(c)) return c; }
  return null;
}
const CHROME_EXEC = PW ? findChromiumExec() : null;

/* ───────── рендеринг ───────── */
let browser = null;
async function openBrowser() {
  if (browser) return browser;
  const args = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--force-color-profile=srgb'];
  const opts = { args };
  if (CHROME_EXEC) opts.executablePath = CHROME_EXEC;
  browser = await PW.chromium.launch(opts);
  return browser;
}
async function closeBrowser() { if (browser) { await browser.close(); browser = null; } }

async function renderChromium(svgText, outFile) {
  const b = await openBrowser();
  const page = await b.newPage({
    viewport: { width: OPTS.width, height: Math.round(OPTS.width * 720 / 1280) },
    deviceScaleFactor: OPTS.scale,
  });
  const html = '<!doctype html><html><head><meta charset="utf-8">' +
    '<style>html,body{margin:0;padding:0;background:#000;overflow:hidden}svg{display:block}</style>' +
    '</head><body>' + svgText + '</body></html>';
  await page.setContent(html, { waitUntil: 'load' });
  const vp = page.viewportSize();
  await page.screenshot({
    path: outFile,
    type: OPTS.format === 'jpg' ? 'jpeg' : OPTS.format,
    quality: OPTS.format === 'jpg' ? OPTS.quality : undefined,
    clip: { x: 0, y: 0, width: vp.width, height: vp.height },
  });
  await page.close();
}

function renderExternal(svgFile, outFile) {
  if (RSVG) {
    const a = RSVG === 'rsvg-convert'
      ? ['-w', String(OPTS.width * OPTS.scale), '-h', String(Math.round(OPTS.width * 720 / 1280) * OPTS.scale), '-o', outFile, svgFile]
      : ['-f', OPTS.format, '-w', String(OPTS.width * OPTS.scale), '-o', outFile, svgFile];
    execFileSync(RSVG, a, { stdio: 'ignore' });
    return;
  }
  if (INK) {
    execFileSync(INK, ['--export-type=' + (OPTS.format === 'jpg' ? 'png' : OPTS.format),
      '--export-filename=' + outFile, '--export-width=' + (OPTS.width * OPTS.scale), svgFile], { stdio: 'ignore' });
    if (OPTS.format === 'jpg') execFileSync(IM, [outFile, '-quality', String(OPTS.quality), outFile], { stdio: 'ignore' });
    return;
  }
  execFileSync(IM, ['-background', 'none', '-density', '96', svgFile, '-resize', String(OPTS.width * OPTS.scale) + 'x',
    '-quality', String(OPTS.quality), outFile], { stdio: 'ignore' });
}

/* ───────── основной проход ───────── */
(async function main() {
  const inDir = path.resolve(OPTS.from);
  const outDir = path.resolve(OPTS.out);
  if (!fs.existsSync(inDir)) { console.error('Нет папки: ' + inDir); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });

  const files = fs.readdirSync(inDir).filter(f => /\.svg$/i.test(f)).sort();
  if (!files.length) { console.error('В папке ' + inDir + ' нет SVG-файлов'); process.exit(1); }

  const engine = PW ? 'Chromium (playwright)' : RSVG ? 'rsvg-convert' : INK ? 'Inkscape' : 'ImageMagick';  console.log('Движок: ' + engine + ' · формат: ' + OPTS.format + ' · ' + (OPTS.width * OPTS.scale) + '×' + Math.round(OPTS.width * 720 / 1280) * OPTS.scale);

  let done = 0, skipped = 0, failed = 0, bytes = 0;
  for (let i = 0; i < files.length; i++) {
    const name = files[i];
    const stem = name.replace(/\.svg$/i, '');
    const outFile = path.join(outDir, stem + '.' + OPTS.format);
    if (OPTS.onlyMissing && fs.existsSync(outFile)) { skipped++; continue; }
    try {
      const svgFile = path.join(inDir, name);
      if (PW) await renderChromium(fs.readFileSync(svgFile, 'utf8'), outFile);
      else renderExternal(svgFile, outFile);
      bytes += fs.statSync(outFile).size;
      done++;
    } catch (e) {
      failed++;
      console.error('  ! ' + name + ': ' + (e && e.message ? e.message.split('\n')[0] : e));
    }
    if ((i + 1) % 25 === 0 || i === files.length - 1) {
      process.stdout.write(`\r  ${i + 1}/${files.length} — готово ${done}, пропущено ${skipped}, ошибок ${failed}   `);
    }
  }
  await closeBrowser();
  console.log(`\nГотово: ${done} файлов${skipped ? `, пропущено ${skipped}` : ''}${failed ? `, с ошибкой ${failed}` : ''} · ${(bytes / 1024 / 1024).toFixed(1)} МБ`);
  console.log('Папка: ' + outDir);
  console.log('Чтобы тренажёр начал показывать эти картинки вместо SVG — пересоберите базу:  node tools/build.js');
})().catch(e => { console.error(e); process.exit(1); });
