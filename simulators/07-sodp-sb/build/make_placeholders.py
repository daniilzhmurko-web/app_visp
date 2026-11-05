#!/usr/bin/env python3
"""Создаёт photos/<номер>.jpg — нейтральные силуэты 300×400 для всех кандидатов из db/candidates.js.
Замените файлы настоящими (синтетическими) фотографиями с теми же именами — симулятор подхватит их сам.
Запуск:  python3 make_placeholders.py   (нужен Pillow: pip install pillow)"""
import json, re, os, sys
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TR = dict(zip('абвгдеёжзийклмнопрстуфхцчшщыэюя', ['a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','ts','ch','sh','sch','y','e','yu','ya']))
slug = lambda s: re.sub(r'[^a-z0-9-]+', '-', ''.join(TR.get(c, c) for c in s.lower()))
def load(name):
    t = open(os.path.join(ROOT, 'db', name), encoding='utf-8').read()
    return json.loads(t[t.index('= [') + 2: t.rindex('];') + 1])
cands = load('candidates.js')
os.makedirs(os.path.join(ROOT, 'photos'), exist_ok=True)
W, H = 300, 400
for i, c in enumerate(cands):
    fem = bool(re.search(r'(вна|чна|шна)$', c['fio'].split(' ')[-1]))
    tone = 226 - (i * 7) % 18
    img = Image.new('RGB', (W, H), (tone - 4, tone, tone + 12))
    d = ImageDraw.Draw(img)
    for y in range(H):  # мягкий вертикальный градиент
        k = y / H; d.line([(0, y), (W, y)], fill=(int(tone - 4 - 14 * k), int(tone - 14 * k), int(tone + 12 - 10 * k)))
    body = (143 - (i * 5) % 20, 160 - (i * 3) % 20, 192 - (i * 4) % 20)
    if fem: d.ellipse([84, 78, 216, 262], fill=(110, 128, 166))  # причёска
    d.ellipse([86, 86, 214, 214], fill=body)                      # голова
    d.pieslice([30, 270, 270, 560], 180, 360, fill=body)           # плечи
    img.save(os.path.join(ROOT, 'photos', slug(c['id']) + '.jpg'), quality=88)
print('photos:', len(cands))
