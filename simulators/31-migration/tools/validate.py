#!/usr/bin/env python3
"""Проверка данных: манифест актуален (sha256), id уникальны, JS-файлы из index.html существуют."""
import hashlib,json,os,re,sys
R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'); err=[]
man=json.load(open(os.path.join(R,'data','manifest.json'),encoding='utf-8'))
for k,v in man['sets'].items():
    b=open(os.path.join(R,v['file']),'rb').read()
    if hashlib.sha256(b).hexdigest()!=v['sha256']: err.append(f'{k}: хэш не совпадает — запустите build_manifest.py')
    ids=[x['id'] for x in json.loads(b)]
    if len(ids)!=len(set(ids)): err.append(f'{k}: дублируются id')
tr={x['id'] for x in json.load(open(os.path.join(R,'scenarios','traps','traps.json'),encoding='utf-8'))}
for x in json.load(open(os.path.join(R,'data','persons','foreign_citizens.json'),encoding='utf-8')):
    if x.get('trap') and x['trap'] not in tr: err.append(f"{x['id']}: неизвестная ловушка {x['trap']}")
for f in re.findall(r"'((?:core|panels)/[a-z]+|main|core/[a-z]+)'",open(os.path.join(R,'index.html'),encoding='utf-8').read().split('const JS=')[1].split(';')[0]):
    if not os.path.exists(os.path.join(R,'app',f+'.js')): err.append('нет файла app/'+f+'.js')
print('\n'.join(err) or 'OK'); sys.exit(1 if err else 0)
