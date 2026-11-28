/* Локальная подложка карты.
   В архив сайта вложены реальные тайлы Москвы (assets/map/<z>/<x>/<y>.jpg, 395 шт.) —
   они подгружаются с диска и работают БЕЗ ИНТЕРНЕТА. Это важно: публичные провайдеры
   тайлов (особенно tile.openstreetmap.org) блокируют массовые запросы и отдают картинку
   «Access blocked» вместо плитки. Если локального тайла нет (область за пределами
   архива), слой обращается к онлайн-зеркалу OpenStreetMap.
   Для загрузки/обновления архива: python3 tools/fetch-map-tiles.py */
(function () {
  'use strict';
  var MANIFEST = window.CAFAP_MAP_TILES || {};
  var SET = {};
  Object.keys(MANIFEST).forEach(function (z) {
    var s = new Set();
    (MANIFEST[z] || []).forEach(function (p) { s.add(p); });
    SET[z] = s;
  });
  /* Есть ли тайл в локальном архиве */
  window.CAFAP_MAP_HAS = function (z, x, y) { return !!(SET[z] && SET[z].has(x + ':' + y)); };
  /* Сколько тайлов в архиве */
  window.CAFAP_MAP_TILES_COUNT = Object.keys(SET).reduce((a, z) => a + SET[z].size, 0);

  /* Провайдеры подложки. Первый — локальный архив (реальная карта, офлайн). */
  window.CAFAP_TILE_PROVIDERS = [
    { id: 'local', name: 'Карта (из архива)', url: null, attr: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' },
    { id: 'osmde', name: 'OpenStreetMap (онлайн)', url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png', attr: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' },
    { id: 'esri', name: 'Esri Street Map (онлайн)', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', attr: 'Esri, HERE, Garmin, INCREMENT P, USGS' },
    { id: 'osm', name: 'OpenStreetMap (онлайн)', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors' },
    { id: 'scheme', name: 'Схема (без карты)', url: null, attr: '' },
  ];

  /* Слой Leaflet: локальный тайл, если он есть в архиве, иначе онлайн-зеркало OSM */
  window.CAFAP_LocalTiles = function (opts) {
    var o = Object.assign({ minZoom: 9, maxZoom: 13, tileSize: 256, keepBuffer: 2, provider: 'local', updateWhenIdle: false }, opts || {});
    var layer = L.tileLayer('assets/map/{z}/{x}/{y}.jpg', o);
    layer.getTileUrl = function (coords) {
      var z = coords.z, x = coords.x, y = coords.y;
      if (o.provider === 'local' && window.CAFAP_MAP_HAS(z, x, y)) return 'assets/map/' + z + '/' + x + '/' + y + '.jpg';
      var p = window.CAFAP_TILE_PROVIDERS.find(function (v) { return v.id === (o.provider === 'local' ? 'osmde' : o.provider); });
      if (p && p.url) return p.url.replace('{z}', z).replace('{x}', x).replace('{y}', y);
      /* пустая плитка (схема) */
      return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    };
    return layer;
  };
})();
