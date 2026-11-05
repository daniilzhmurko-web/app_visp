#!/usr/bin/env python3
"""Импорт SOCOFing (Kaggle: ruizgara/socofing, CC BY 4.0) в АДИС «Папилон».
Использование:  python tools/import_socofing.py <путь>/SOCOFing/Real
Нужен Pillow (pip install pillow). Результат: data/fingerprints/FP-001/…/FP-600/*.webp + index.json,
затем автоматически пересобираются люди, манифест и bundle.  Соответствие пальцев (кодов в интерфейсе):
ПБ=большой, П1=указательный, П2=средний, П3=безымянный, П4=мизинец (Л* — левая рука)."""
import os,re,sys,json,subprocess
from PIL import Image
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'); src=sys.argv[1] if len(sys.argv)>1 else sys.exit(__doc__)
rx=re.compile(r'^(\d+)__([MF])_(Left|Right)_(thumb|index|middle|ring|little)_finger\.bmp$',re.I); subj={}
for f in sorted(os.listdir(src)):
    m=rx.match(f)
    if not m: continue
    n,sex,hand,fin=int(m[1]),m[2].upper(),m[3].lower(),m[4].lower(); sid=f'FP-{n:03d}'
    d=os.path.join(R,'data','fingerprints',sid); os.makedirs(d,exist_ok=True)
    Image.open(os.path.join(src,f)).convert('L').save(os.path.join(d,f'{hand[0]}_{fin}.webp'),'WEBP',quality=80)
    subj.setdefault(sid,{'id':sid,'sex':sex})
if not subj: sys.exit('Файлы вида 1__M_Left_index_finger.BMP не найдены в '+src)
json.dump(sorted(subj.values(),key=lambda x:x['id']),open(os.path.join(R,'data','fingerprints','index.json'),'w'),ensure_ascii=False,indent=1)
open(os.path.join(R,'data','fingerprints','LICENSE.txt'),'w',encoding='utf-8').write('SOCOFing — Sokoto Coventry Fingerprint Dataset (Shehu Y.I. et al., 2018). Лицензия CC BY 4.0: https://creativecommons.org/licenses/by/4.0/\n')
print('субъектов:',len(subj))
for s in ('generate_people.py','build_manifest.py','bundle_for_file.py'): subprocess.check_call([sys.executable,os.path.join(R,'tools',s)])
