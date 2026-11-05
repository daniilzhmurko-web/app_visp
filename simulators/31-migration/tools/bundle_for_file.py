#!/usr/bin/env python3
"""Упаковывает config, manifest, data/*.json и иконки в dist/data_bundle/data.js —
index.html тогда открывается двойным щелчком (file://) без локального сервера."""
import json,os
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'); rd=lambda p:open(os.path.join(R,p),encoding='utf-8').read()
cfg=json.loads(rd('config.json')); man=json.loads(rd(cfg['manifest']))
B={'config.json':cfg,cfg['manifest']:man,'app/ui/icons.svg':rd('app/ui/icons.svg')}
for v in man['sets'].values(): B[v['file']]=json.loads(rd(v['file']))
os.makedirs(os.path.join(R,'dist','data_bundle'),exist_ok=True)
open(os.path.join(R,'dist','data_bundle','data.js'),'w',encoding='utf-8').write('window.__BUNDLE='+json.dumps(B,ensure_ascii=False)+';\n')
print('bundle:',len(B),'файлов')
