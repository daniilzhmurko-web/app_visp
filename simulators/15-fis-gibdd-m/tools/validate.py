#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Проверка целостности пакетов data/js: уникальность ключей, ссылки между базами, форматы, объём."""
import json, os, re, sys, glob, collections
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sets = collections.defaultdict(list)
for f in sorted(glob.glob(os.path.join(ROOT, 'data', 'js', '*.js'))):
    t = open(f, encoding='utf-8').read().strip()
    m = re.match(r'FISDATA\.add\((.*)\);$', t, re.S)
    name, shard, cols, rows = json.loads('[' + m.group(1) + ']')
    for r in rows: sets[name].append(dict(zip(cols, r)))
mf = json.loads(re.search(r'FISDATA\.manifest\((.*)\);', open(os.path.join(ROOT, 'data', 'manifest.js'), encoding='utf-8').read(), re.S).group(1))
errs = []
def chk(cond, msg):
    if not cond: errs.append(msg)
PLATE = re.compile(r'^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$'); VIN = re.compile(r'^[A-HJ-NPR-Z0-9]{17}$')
P, V, L, VI, W = sets['persons'], sets['vehicles'], sets['licenses'], sets['violations'], sets['wanted']
FS, FN, FT, IP, EA, RA = (sets[k] for k in ('fssp', 'fns', 'fts', 'interpol', 'eaisto', 'rosavtodor'))
for k in sets: chk(len(sets[k]) == mf['sets'][k]['rows'], f'{k}: число строк не совпадает с manifest')
pp = {p['passport']: p for p in P}
chk(len(pp) == len(P), 'паспорта граждан не уникальны')
chk(all(p['issuedBy'] and p['code'] and p['issueDate'] >= p['birth'] for p in P), 'ГУВМ: неполные паспортные данные')
chk(len({v['plate'] for v in V}) == len(V), 'госномера ТС не уникальны')
chk(all(PLATE.match(v['plate']) for v in V), 'есть некорректные госномера')
chk(all(VIN.match(v['vin']) for v in V), 'есть некорректные VIN')
chk(all(v['passport'] in pp and pp[v['passport']]['fio'] == v['owner'] for v in V), 'владелец ТС не найден среди граждан')
vin_cnt = collections.Counter(v['vin'] for v in V)
chk(all(vin_cnt[v['vin']] > 1 for v in V if v['anomaly']), 'аномалия dup_vin без пары')
chk(len({l['number'] for l in L}) == len(L), 'номера ВУ не уникальны')
chk(all(l['passport'] in pp and pp[l['passport']]['fio'] == l['owner'] for l in L), 'владелец ВУ не найден среди граждан')
chk(len({l['passport'] for l in L}) == len(L), 'у одного гражданина несколько ВУ')
chk(all(int(l['issueDate'][:4]) - int(l['birthDate'][:4]) >= 18 for l in L), 'ВУ выдано до 18 лет')
chk(all(l['revokeEnd'] for l in L if l['status'] == 'Лишён'), 'у лишённых нет даты окончания')
plates = {v['plate'] for v in V}; vins = {v['vin'] for v in V}
chk(all(x['plate'] in plates for x in VI), 'штраф на несуществующий ГРЗ')
chk(len({x['decree'] for x in VI}) == len(VI), 'номера постановлений не уникальны')
chk(all(x['paid'] == (x['status'] == 'Оплачен') for x in VI), 'флаг paid не соответствует статусу')
chk(all(x['paidAmt'] >= x['amount'] * 0.75 - 0.01 for x in VI if x['paid']), 'оплата меньше 75% суммы')
chk(all(x['plate'] in plates for x in W), 'розыск ссылается на несуществующий ГРЗ')
act = {w['plate'] for w in W if w['active']}
chk(all((v['status'] == 'В розыске') == (v['plate'] in act) for v in V), 'статус «В розыске» не совпадает с базой розыска')
for fx in ('К777АВ77', 'Х001РО77', 'М555НА50', 'Е777КМ78', 'А123ВЕ66'): chk(fx in plates, f'нет фикстуры {fx}')
chk(any(e['name'] == 'Смирнов Артём Игоревич' and e['allPass'] for e in sets['exams']), 'нет кандидата Смирнова')
# ── внешние базы ──
S = mf['scale']; N = int(10000 * S)
for k, rows in (('persons (ГУВМ)', P), ('fssp', FS), ('fns', FN), ('fts', FT), ('interpol', IP), ('eaisto', EA), ('rosavtodor', RA)):
    chk(len(rows) == N, f'{k}: ожидалось {N} записей, получено {len(rows)}')
chk(all(r['passport'] in pp for r in FS), 'ФССП: должник не найден в ГУВМ')
chk(len({r['number'] for r in FS}) == len(FS), 'ФССП: номера ИП не уникальны')
chk(all(r['vin'] in vins for r in FS if r['restrict']), 'ФССП: запрет на несуществующий VIN')
decs = {r['decree'] for r in FS if r['decree']}
chk(decs == {x['decree'] for x in VI if x['status'] == 'В ФССП'}, 'ФССП: штрафы ГИБДД не совпадают с постановлениями «В ФССП»')
chk(len({r['passport'] for r in FN}) == len(FN) == len(P), 'ФНС: должна быть одна запись на гражданина')
chk(len({r['inn'] for r in FN}) == len(FN), 'ФНС: ИНН не уникальны')
chk(all(VIN.match(r['vin']) for r in FT + IP), 'ФТС/Интерпол: некорректные VIN')
chk(sum(1 for r in IP if r['vin'] in vins and r['status'] == 'Активный розыск') >= 10, 'Интерпол: мало совпадений с ТС базы')
chk(sum(1 for r in FT if r['vin'] in vins) >= 1000, 'ФТС: мало ТС из базы')
chk(all(r['plate'] in plates for r in EA if r['vin'] in vins), 'ЕАИС ТО: карта на несуществующий ГРЗ')
chk(len({r['card'] for r in EA}) == len(EA), 'ЕАИС ТО: номера карт не уникальны')
chk(sum(1 for r in RA if r['plate'] in plates) >= 500, 'Росавтодор: мало актов по ТС из базы')
print('Проверено наборов:', len(sets), '| записей:', sum(len(v) for v in sets.values()))
for k in ('persons', 'fssp', 'fns', 'fts', 'interpol', 'eaisto', 'rosavtodor'): print(f'  {k:11s} {len(sets[k]):>6}')
if errs:
    print('ОШИБКИ:'); [print(' -', e) for e in errs]; sys.exit(1)
print('Целостность: OK')
