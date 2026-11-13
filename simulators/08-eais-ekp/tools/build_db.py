#!/usr/bin/env python3
"""Создаёт db/papilon.sqlite из JSON-файлов каталога data/. Запуск: python3 tools/build_db.py"""
import json, os, sqlite3, sys

def build(root):
    data = os.path.join(root, 'data'); dbp = os.path.join(root, 'db', 'papilon.sqlite')
    os.makedirs(os.path.dirname(dbp), exist_ok=True)
    if os.path.exists(dbp): os.remove(dbp)
    load = lambda n: json.load(open(os.path.join(data, n + '.json'), encoding='utf-8'))
    con = sqlite3.connect(dbp)
    con.executescript(open(os.path.join(root, 'db', 'schema.sql'), encoding='utf-8').read())
    for t in load('tenprints'):
        con.execute('INSERT INTO tenprints VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', (
            t['id'], t['name'], t['dob'], t['dobDisplay'], t['gender'], t['region'], json.dumps(t['crimes'], ensure_ascii=False),
            t.get('photo'), json.dumps(t['fingers']), t.get('pattern'), 1 if t.get('arrested') else 0, t.get('crimHist')))
    for l in load('latents'):
        con.execute('INSERT INTO latents VALUES (?,?,?,?,?,?,?,?,?,?)', (
            l['id'], l['kusp'], l['date'], l['place'], l['type'], l['quality'], 1 if l.get('fragment') else 0,
            l.get('trueMatch'), l['fingerIndex'], l.get('status', 'new')))
    for m in load('missions'):
        con.execute('INSERT INTO missions VALUES (?,?)', (m['id'], json.dumps(m, ensure_ascii=False)))
    for i, (k, v) in enumerate(load('mentor').items()):
        con.execute('INSERT INTO mentor_responses VALUES (?,?,?)', (k, v, i))
    con.execute('INSERT INTO fp_masks VALUES (1,?)', (json.dumps(load('fp_masks')),))
    con.execute('INSERT INTO fp_minutiae VALUES (1,?)', (json.dumps(load('fp_minutiae')),))
    con.commit(); con.close()
    return dbp

if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print('База создана:', build(root))
