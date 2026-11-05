#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Заменяет логотип в index.html (экран входа и шапка) на ваш PNG с прозрачным фоном.
Логотип белый/светлый — он показывается на тёмно-синем фоне.
  python tools/set_logo.py путь/к/логотипу.png [путь/к/favicon.png] [index.html]
Пустые поля по краям обрезаются автоматически, ширина приводится к 800 px."""
import base64, io, os, re, sys
from PIL import Image
if len(sys.argv) < 2: sys.exit(__doc__)
png = sys.argv[1]
fav = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2].lower().endswith('.png') else None
target = next((a for a in sys.argv[2:] if a.lower().endswith('.html')), os.path.join(os.path.dirname(__file__), '..', 'index.html'))
im = Image.open(png).convert('RGBA')
bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox() or (0, 0, *im.size)
im = im.crop((max(0, bb[0] - 8), max(0, bb[1] - 8), min(im.width, bb[2] + 8), min(im.height, bb[3] + 8)))
im = im.resize((800, round(im.height * 800 / im.width)), Image.LANCZOS)
buf = io.BytesIO(); im.save(buf, 'PNG', optimize=True)
h = open(target, encoding='utf-8').read()
h = re.sub(r'--logo-url:url\("data:image/png;base64,[^"]*"\)', lambda m: '--logo-url:url("data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode() + '")', h, count=1)
h = re.sub(r'aspect-ratio:800 / \d+', f'aspect-ratio:800 / {im.height}', h)
if fav:
    f = Image.open(fav).convert('RGBA').resize((64, 64), Image.LANCZOS); fb = io.BytesIO(); f.save(fb, 'PNG', optimize=True)
    h = re.sub(r'(<link rel="icon" type="image/png" href="data:image/png;base64,)[^"]*"', lambda m: m.group(1) + base64.b64encode(fb.getvalue()).decode() + '"', h, count=1)
open(target, 'w', encoding='utf-8').write(h)
print('Логотип заменён в', os.path.abspath(target))
