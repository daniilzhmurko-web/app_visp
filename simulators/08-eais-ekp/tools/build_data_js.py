#!/usr/bin/env python3
"""Собирает data/data.js из data/*.json — встроенная копия базы для запуска без сервера (file://).
Запускать после любого изменения data/*.json:  python3 tools/build_data_js.py"""
import json, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load = lambda n: json.load(open(os.path.join(root, 'data', n + '.json'), encoding='utf-8'))
d = {'tenprints': load('tenprints'), 'latents': load('latents'), 'missions': load('missions'), 'mentor': load('mentor'), 'fpMasks': load('fp_masks'), 'fpMinutiae': load('fp_minutiae')}
with open(os.path.join(root, 'data', 'data.js'), 'w', encoding='utf-8') as f:
    f.write('/* Автогенерация: tools/build_data_js.py. Встроенная база для работы без веб-сервера. */\nwindow.PAPILON_EMBEDDED = ' + json.dumps(d, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('data/data.js:', os.path.getsize(os.path.join(root, 'data', 'data.js')), 'байт')
