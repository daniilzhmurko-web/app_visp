#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Собирает docs/kb/*.md и docs/regulations/*.md в docs/kb.js (подключается тегом <script>, работает без сервера).
Формат .md: первая строка «# Заголовок», вторая «tags: слово, слово», далее текст."""
import glob, json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
docs = []
for group, label in (('kb', 'Инструкции'), ('regulations', 'Нормативные выдержки')):
    for f in sorted(glob.glob(os.path.join(ROOT, 'docs', group, '*.md'))):
        lines = open(f, encoding='utf-8').read().split('\n')
        title = lines[0].lstrip('# ').strip()
        tags = lines[1].split(':', 1)[1].strip() if lines[1].startswith('tags:') else ''
        docs.append({'id': os.path.basename(f)[:-3], 'group': label, 'title': title, 'tags': tags, 'text': '\n'.join(lines[2:]).strip()})
open(os.path.join(ROOT, 'docs', 'kb.js'), 'w', encoding='utf-8').write('FISDATA.docs(' + json.dumps(docs, ensure_ascii=False, indent=1) + ');\n')
print('docs/kb.js:', len(docs), 'документов')
