#!/usr/bin/env python3
"""Импорт отпечатков для АДИС «Папилон» из папок вида  <src>/DK-2021-3011/*.png  (по 10 PNG на человека).
Использование:  python tools/import_fingerprints.py C:\\ВИСП\\ЦИАДИС+\\ciadis-simulator\\assets\\fingerprints
Нужен Pillow (pip install pillow). Результат: data/fingerprints/<папка>/<палец>.webp + index.json; затем
пересобираются люди (поле fp = имя папки), манифест и bundle.
Какой файл какой палец — определяется так: 1) по словам в имени (left/right, thumb/index/middle/ring/little, лев/прав…);
2) по номеру в конце имени (1–10 или 0–9); 3) по алфавитному порядку. Порядок для п.2–3 задаётся --order
(по умолчанию как в ISO/NIST: правая рука — большой…мизинец, затем левая). Скрипт печатает, как разобрана первая папка."""
import os,re,sys,json,shutil,argparse,subprocess
from PIL import Image
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
ap=argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('--max',type=int,default=256,help='макс. сторона, px')
ap.add_argument('--order',default='iso',help='iso (по умолчанию), alpha или список через запятую'); a=ap.parse_args()
ORDERS={'iso':'r_thumb,r_index,r_middle,r_ring,r_little,l_thumb,l_index,l_middle,l_ring,l_little',      # ISO/NIST: правая рука, затем левая
        'alpha':'l_index,l_little,l_middle,l_ring,l_thumb,r_index,r_little,r_middle,r_ring,r_thumb'}      # как сортировались бы имена SOCOFing по алфавиту
ORDER=ORDERS.get(a.order,a.order).split(',')
FIN={'thumb':'thumb','большой':'thumb','index':'index','указат':'index','middle':'middle','средн':'middle','ring':'ring','безымян':'ring','little':'little','pinky':'little','мизин':'little'}
nat=lambda s:[int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)',s)]
def guess(name):
    n=name.lower(); h='l' if re.search(r'left|(^|[^a-z])l[_\-\s]|лев',n) else 'r' if re.search(r'right|(^|[^a-z])r[_\-\s]|прав',n) else None
    f=next((v for k,v in FIN.items() if k in n),None); return f'{h}_{f}' if h and f else None
def assign(files):
    g=[guess(os.path.splitext(f)[0]) for f in files]
    if None not in g and len(set(g))==10: return dict(zip(g,files)),'по названиям'
    num=[re.findall(r'\d+',os.path.splitext(f)[0]) for f in files]; nums=[int(x[-1]) if x else None for x in num]
    if None not in nums and len(set(nums))==10:
        o=sorted(range(10),key=lambda i:nums[i]); return {ORDER[k]:files[i] for k,i in enumerate(o)},'по номеру в имени'
    return dict(zip(ORDER,sorted(files,key=nat))),'по алфавиту'
dst=os.path.join(R,'data','fingerprints'); shutil.rmtree(dst,ignore_errors=True); os.makedirs(dst); ids=[]; methods={}; bad=[]
for d in sorted(os.listdir(a.src),key=nat):
    p=os.path.join(a.src,d)
    if not os.path.isdir(p): continue
    fl=[f for f in os.listdir(p) if f.lower().endswith('.png')]
    if len(fl)!=10: bad.append((d,len(fl))); continue
    m,how=assign(fl); methods[how]=methods.get(how,0)+1
    if not ids: print('Первая папка',d,'(',how,'):',{k:v for k,v in m.items()})
    os.makedirs(os.path.join(dst,d))
    for code,f in m.items():
        im=Image.open(os.path.join(p,f)).convert('L'); im.thumbnail((a.max,a.max),Image.LANCZOS); im.save(os.path.join(dst,d,code+'.webp'),'WEBP',quality=82)
    if not ids:   # контрольный лист: как скрипт разложил первую папку — откройте data/fingerprints/_check.png
        from PIL import ImageDraw
        sh=Image.new('L',(5*210,2*236),255); dr=ImageDraw.Draw(sh)
        for k,code in enumerate(ORDER):
            im=Image.open(os.path.join(dst,d,code+'.webp')); x,y=(k%5)*210+5,(k//5)*236+22; sh.paste(im,(x,y)); dr.text((x,y-16),f'{code}  <- {m[code]}',fill=0)
        sh.save(os.path.join(dst,'_check.png'))
    ids.append(d)
if not ids: sys.exit('Папки с 10 PNG не найдены в '+a.src)
json.dump([{'id':i} for i in ids],open(os.path.join(dst,'index.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('людей с отпечатками:',len(ids),'| способ:',methods,'| пропущено папок:',bad[:5],'…' if len(bad)>5 else '')
for s in ('generate_people.py','build_manifest.py','bundle_for_file.py'): subprocess.check_call([sys.executable,os.path.join(R,'tools',s)])
