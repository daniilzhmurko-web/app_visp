#!/usr/bin/env python3
"""Собирает data/manifest.json по всем data/*/*.json (имя набора = camelCase от имени файла)."""
import glob,hashlib,json,os
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'); sets={}
for f in sorted(glob.glob(os.path.join(R,'data','*','*.json'))+glob.glob(os.path.join(R,'scenarios','*','*.json'))):
    b=open(f,'rb').read(); d=os.path.basename(os.path.dirname(f)); n=os.path.basename(f)[:-5]; p=n.split('_'); k=d if n=='index' else p[0]+''.join(x.title() for x in p[1:])
    sets[k]={'file':os.path.relpath(f,R).replace(os.sep,'/'),'count':len(json.loads(b)),'sha256':hashlib.sha256(b).hexdigest()}
json.dump({'version':'1.0.0','synthetic':True,'sets':sets},open(os.path.join(R,'data','manifest.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print({k:v['count'] for k,v in sets.items()})
