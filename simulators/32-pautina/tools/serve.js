#!/usr/bin/env node
'use strict';
/* ═══════════════════════════════════════════════════════════════════════
   Локальный сервер тренажёра (без зависимостей).

   Сайт работает и просто по двойному щелчку (file://), но в этом режиме
   браузер запрещает выгружать картинку в PNG (файл считается «чужим»
   источником). Чтобы работали кнопки «Скачать кадр PNG» и печать
   фотоматериала, откройте тренажёр через локальный сервер:

       node tools/serve.js            → http://localhost:8080
       node tools/serve.js 9000       → другой порт

   Ничего из интернета не скачивается, наружу ничего не отдаётся.
   ═══════════════════════════════════════════════════════════════════════ */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = path.resolve(__dirname, '..');
const port = Number(process.argv[2]) || Number(process.env.PORT) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
  '.zip': 'application/zip',
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(url.parse(req.url).pathname);
  if (p === '/') p = '/index.html';
  const file = path.join(root, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 — ' + p); }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(port, () => {
  console.log('Учебный тренажёр ЦАФАП: http://localhost:' + port);
  console.log('Остановить — Ctrl+C');
});
