#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Загрузка реальных тайлов карты Москвы в assets/map/ — чтобы карта камер работала
БЕЗ ИНТЕРНЕТА (провайдеры тайлов OSM часто блокируют массовые запросы, как это было
у заказчика: «Access blocked» вместо плитки).

Запуск:  python3 tools/fetch-map-tiles.py
Тайлы берутся с публичного зеркала OpenStreetMap, сохраняются как JPEG (в 1.5–2 раза
меньше PNG) и складываются в assets/map/<z>/<x>/<y>.jpg.
Рядом пишется assets/map/tiles.js — список загруженных тайлов (его читает
js/core/maptiles.js, когда слой Leaflet строит URL локальной плитки).
"""
import io, json, os, sys, time, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'map')
# вся Москва + окрестности; z13 — только вокруг камер
AREA = dict(min_lat=55.35, max_lat=56.05, min_lon=37.20, max_lon=38.05)
CAM = dict(min_lat=55.58, max_lat=55.92, min_lon=37.36, max_lon=37.85)
SOURCES = ['https://tile.openstreetmap.de/{z}/{x}/{y}.png',
           'https://tile.openstreetmap.org/{z}/{x}/{y}.png']
UA = 'CAFAP-trainer/1.0 (educational simulator)'


def lat2tile(lat, z):
    import math
    return int((1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * 2 ** z)


def lon2tile(lon, z):
    return int((lon + 180) / 360 * 2 ** z)


def tiles_for(z, box):
    x0, x1 = lon2tile(box['min_lon'], z), lon2tile(box['max_lon'], z)
    y0, y1 = lat2tile(box['max_lat'], z), lat2tile(box['min_lat'], z)
    return [(z, x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]


def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=25) as r:
                return r.read()
        except Exception:
            time.sleep(0.6)
    return None


def main():
    jobs = []
    for z in range(9, 13):
        jobs += tiles_for(z, AREA)
    jobs += tiles_for(13, CAM)
    seen, uniq = set(), []
    for t in jobs:
        if t not in seen:
            seen.add(t); uniq.append(t)
    print('тайлов к загрузке:', len(uniq))
    manifest, ok, fail, total = {}, 0, 0, 0
    for z, x, y in uniq:
        d = os.path.join(OUT, str(z), str(x))
        f = os.path.join(d, '%d.jpg' % y)
        if os.path.exists(f) and os.path.getsize(f) > 0:
            ok += 1; total += os.path.getsize(f)
        else:
            raw = None
            for tpl in SOURCES:
                raw = fetch(tpl.format(z=z, x=x, y=y))
                if raw: break
            if not raw:
                fail += 1; print('  ! не скачан', z, x, y); continue
            try:
                im = Image.open(io.BytesIO(raw)).convert('RGB')
                os.makedirs(d, exist_ok=True)
                im.save(f, 'JPEG', quality=82, optimize=True)
            except Exception as e:
                fail += 1; print('  ! ошибка', z, x, y, e); continue
            ok += 1; total += os.path.getsize(f)
        manifest.setdefault(str(z), []).append('%d:%d' % (x, y))
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'tiles.js'), 'w', encoding='utf-8') as fh:
        fh.write('/* Локальная подложка карты: перечень загруженных тайлов (assets/map/<z>/<x>/<y>.jpg).\n'
                 '   Создаётся tools/fetch-map-tiles.py. Формат: "z" → список "x:y". */\n')
        fh.write('window.CAFAP_MAP_TILES=' + json.dumps(manifest, sort_keys=True, separators=(',', ':')) + ';\n')
    print('готово: %d тайлов, %d ошибок, %.1f МБ → assets/map/' % (ok, fail, total / 1048576))


if __name__ == '__main__':
    main()
