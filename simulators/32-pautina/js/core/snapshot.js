/* ═══════════════════════════════════════════════════════════════════════
   CAFAP_SNAP — единый слой доступа к снимкам фиксации (SVG или JPG/PNG).

   В базе фиксаций снимок хранится путём к файлу (по умолчанию — SVG-сцена
   из assets/snapshots). Рядом с ним может лежать РАСТРОВАЯ копия с тем же
   именем: FIX-00001.jpg / .jpeg / .png / .webp. Такая копия получается
   либо конвертацией SVG (node tools/rasterize.js), либо из реального фото.

   Правило выбора: если растровая копия есть — показывается она, иначе —
   файл из базы. Связь с базой фиксаций (номер, OCR, геометрия, рамки
   детектора) при этом не меняется: подменяется только картинка.

   Проверка наличия выполняется цепочкой <img onerror> — без запросов к
   серверу и без чтения каталога, поэтому работает и при открытии сайта
   двойным щелчком (file://).
   ═══════════════════════════════════════════════════════════════════════ */
window.CAFAP_SNAP = (function () {
  'use strict';

  /* Расширения, которые считаются «растровой копией» снимка (в порядке приоритета).
     Проверка идёт цепочкой <img onerror>: несуществующие варианты дают 404 в консоли —
     поэтому список короткий (jpg/jpeg/png), а после пересборки базы он не используется вовсе. */
  const RASTER = ['jpg', 'jpeg', 'png'];

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* Базовое имя файла без расширения: assets/snapshots/FIX-00001.svg → assets/snapshots/FIX-00001 */
  function stem(file) {
    const s = String(file || '');
    const i = s.lastIndexOf('.');
    return i > s.lastIndexOf('/') ? s.slice(0, i) : s;
  }
  /* Расширение в нижнем регистре */
  function ext(file) {
    const s = String(file || '');
    const i = s.lastIndexOf('.');
    return i > s.lastIndexOf('/') ? s.slice(i + 1).toLowerCase() : '';
  }
  /* Имя файла без пути */
  function baseName(file) {
    const s = String(file || '');
    return s.slice(s.lastIndexOf('/') + 1);
  }

  /* Цепочка кандидатов: сначала растровые копии, затем сам файл из базы.
     Для уже растрового пути (assets/photos/…jpg) цепочка состоит из одного элемента. */
  function candidates(file) {
    const f = String(file || '');
    if (!f) return [];
    if (ext(f) !== 'svg') return [f];
    const st = stem(f);
    return RASTER.map(e => st + '.' + e).concat([f]);
  }

  /* Первый кандидат (то, что пробуем грузить сразу) */
  function src(file) { return candidates(file)[0] || ''; }

  /* Атрибуты тега <img> с цепочкой откатов: если картинки нет — берём следующую */
  function imgAttrs(file, alt) {
    const c = candidates(file);
    if (!c.length) return 'src=""';
    return 'src="' + esc(c[0]) + '" data-cands="' + esc(c.join('|')) + '" data-ci="0"' +
      ' onload="window.CAFAP_SNAP&&CAFAP_SNAP.loaded(this)"' +
      ' onerror="window.CAFAP_SNAP&&CAFAP_SNAP.fallback(this)"' +
      (alt != null ? ' alt="' + esc(alt) + '"' : '');
  }

  /* Кандидат загрузился — запоминаем рабочий */
  function loaded(img) { if (img) img.dataset.ok = '1'; }

  /* Ошибка загрузки: переходим к следующему кандидату; если кончились — показываем заглушку */
  function fallback(img) {
    if (!img) return false;
    const list = String(img.dataset.cands || '').split('|').filter(Boolean);
    let i = Number(img.dataset.ci || 0);
    while (i < list.length) {
      i++;
      if (i >= list.length) break;
      img.dataset.ci = String(i);
      img.src = list[i];
      return true;
    }
    img.dataset.ci = String(i);
    img.style.display = 'none';
    const next = img.nextElementSibling;                 /* заглушка «Снимок недоступен» */
    if (next && next.hasAttribute && next.hasAttribute('data-snap-fallback')) next.style.display = 'flex';
    return false;
  }

  /* Рабочий (загрузившийся) путь для элемента — пригодится для скачивания */
  function workingSrc(img) {
    if (!img) return '';
    const list = String(img.dataset.cands || '').split('|').filter(Boolean);
    const i = Number(img.dataset.ci || 0);
    return list[i] || img.getAttribute('src') || '';
  }

  /* Имя файла для сохранения: FIX-00001.jpg */
  function downloadName(file, suffix) {
    const b = baseName(file);
    const i = b.lastIndexOf('.');
    const stemName = i > 0 ? b.slice(0, i) : b;
    const e = ext(file) || 'png';
    return stemName + (suffix ? '_' + suffix : '') + '.' + e;
  }

  return {
    RASTER, candidates, src, imgAttrs, fallback, loaded, workingSrc,
    stem, ext, baseName, downloadName, esc
  };
})();
