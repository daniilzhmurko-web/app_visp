#!/usr/bin/env python3
"""Раскладывает ваши фотографии по кандидатам: photos/<номер>.jpg (300×400, 3:4).
Исходники: папка с подпапками  male/  и  female/  (или одна папка — тогда пол не учитывается).
Фото должны быть синтетическими (ИИ-генерация) или иметь разрешение на такое использование.
Запуск:  python3 assign_photos.py /путь/к/исходным_фото [--seed 1]    (нужен Pillow)"""
import json, re, os, sys, random, glob
from PIL import Image, ImageOps
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TR = dict(zip('абвгдеёжзийклмнопрстуфхцчшщыэюя', ['a','b','v','g','d','e','e','zh','z','i','y','k','l','m','n','o','p','r','s','t','u','f','h','ts','ch','sh','sch','y','e','yu','ya']))
slug = lambda s: re.sub(r'[^a-z0-9-]+', '-', ''.join(TR.get(c, c) for c in s.lower()))
if len(sys.argv) < 2: sys.exit(__doc__)
src = sys.argv[1]; seed = int(sys.argv[sys.argv.index('--seed') + 1]) if '--seed' in sys.argv else 1
ext = ('*.jpg', '*.jpeg', '*.png', '*.webp')
def files(d): return sorted(f for e in ext for f in glob.glob(os.path.join(d, '**', e), recursive=True))
male, female = files(os.path.join(src, 'male')), files(os.path.join(src, 'female'))
pool = files(src) if not (male or female) else None
t = open(os.path.join(ROOT, 'db', 'candidates.js'), encoding='utf-8').read()
cands = json.loads(t[t.index('= [') + 2: t.rindex('];') + 1])
rnd = random.Random(seed); [rnd.shuffle(x) for x in (male, female) if x]; pool and rnd.shuffle(pool)
os.makedirs(os.path.join(ROOT, 'photos'), exist_ok=True); done = 0
for c in cands:
    fem = bool(re.search(r'(вна|чна|шна)$', c['fio'].split(' ')[-1]))
    lst = pool if pool else (female if fem else male)
    if not lst: print('нет фото для', c['id']); continue
    f = lst.pop() if len(lst) > 1 else lst[0]
    im = ImageOps.fit(Image.open(f).convert('RGB'), (300, 400), Image.LANCZOS, centering=(0.5, 0.35))
    im.save(os.path.join(ROOT, 'photos', slug(c['id']) + '.jpg'), quality=90); done += 1
print('готово:', done, 'из', len(cands))
