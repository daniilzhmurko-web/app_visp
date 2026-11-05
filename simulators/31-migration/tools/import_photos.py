#!/usr/bin/env python3
"""Импорт синтетических фото (genphoto и т.п.) в data/photos/IG-xxx.jpg.
Использование:  python tools/import_photos.py <папка>   (внутри можно подпапки male/ и female/ — тогда пол учитывается)
Нужен Pillow. Фото кадрируются до 240×300. Если фото меньше, чем людей, остальные остаются с силуэтом."""
import os,sys,json,random,subprocess
from PIL import Image,ImageOps
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'); src=sys.argv[1] if len(sys.argv)>1 else sys.exit(__doc__)
ext=('.jpg','.jpeg','.png','.webp'); rnd=random.Random(1)
def files(d): return sorted(os.path.join(d,f) for f in os.listdir(d) if f.lower().endswith(ext)) if os.path.isdir(d) else []
pool={'М':files(os.path.join(src,'male')),'Ж':files(os.path.join(src,'female'))}; flat=files(src)
if not (pool['М'] or pool['Ж']): pool={'М':flat[:],'Ж':flat[:]}; shared=True
else: shared=False
for v in pool.values(): rnd.shuffle(v)
people=json.load(open(os.path.join(R,'data','persons','foreign_citizens.json'),encoding='utf-8')); os.makedirs(os.path.join(R,'data','photos'),exist_ok=True); idx=[]; used=set()
for p in people:
    cand=[f for f in pool[p['sex']] if f not in used]
    if not cand: continue
    f=cand[0]; used.add(f)
    ImageOps.fit(Image.open(f).convert('RGB'),(240,300),Image.LANCZOS).save(os.path.join(R,'data','photos',p['id']+'.jpg'),'JPEG',quality=85); idx.append({'id':p['id'],'file':p['id']+'.jpg'})
json.dump(idx,open(os.path.join(R,'data','photos','index.json'),'w'),ensure_ascii=False,indent=1)
print('фото:',len(idx),'из',len(people),'(пол не учитывался)' if shared else '')
for s in ('build_manifest.py','bundle_for_file.py'): subprocess.check_call([sys.executable,os.path.join(R,'tools',s)])
