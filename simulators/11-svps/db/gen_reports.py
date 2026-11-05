#!/usr/bin/env python3
"""Генератор истории месячных отчётов РОВД (db/reports.js).
python3 gen_reports.py reports.js [--seed 7]
Последний месяц (2024-01) совпадает с текущими показателями симулятора (DD). Данные вымышленные."""
import sys, json, random, argparse
ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('--seed', type=int, default=7)
a = ap.parse_args(); R = random.Random(a.seed)
DD = {  # текущие показатели января 2024 (как в simulator DD)
 'prikuban': dict(reg=127, sol=89, sus=12, ter=3, per=91, dam=2340000, rec=890000),
 'karasun':  dict(reg=98, sol=71, sus=8, ter=2, per=73, dam=1870000, rec=720000),
 'central':  dict(reg=143, sol=98, sus=15, ter=4, per=102, dam=3100000, rec=1200000),
 'western':  dict(reg=84, sol=62, sus=7, ter=1, per=64, dam=1540000, rec=580000),
 'kalinino': dict(reg=34, sol=28, sus=3, ter=0, per=30, dam=430000, rec=210000)}
periods = []
y, m = 2022, 8
while (y, m) <= (2024, 1):
    periods.append('%04d-%02d' % (y, m)); m += 1
    if m > 12: y, m = y + 1, 1
SEAS = {1: 1.0, 2: .93, 3: 1.0, 4: 1.02, 5: 1.05, 6: 1.08, 7: 1.1, 8: 1.07, 9: 1.0, 10: 1.03, 11: .97, 12: .95}
out = {'version': '2024.1', 'periods': periods, 'depts': {}}
for k, b in DD.items():
    rows = []
    for i, p in enumerate(periods):
        mo = int(p[5:]); last = (p == '2024-01')
        if last:
            rows.append(dict(b)); continue
        f = SEAS[mo] / SEAS[1] * R.uniform(.93, 1.07) * (0.97 + 0.03 * i / len(periods))
        reg = max(8, round(b['reg'] * f))
        rate = min(.9, max(.45, b['sol'] / b['reg'] + R.uniform(-.06, .05)))
        sol = round(reg * rate); sus = round(reg * b['sus'] / b['reg'] * R.uniform(.7, 1.3)); ter = round(reg * b['ter'] / b['reg'] * R.uniform(.5, 1.5))
        while sol + sus + ter > reg: sus = max(0, sus - 1)
        dam = round(b['dam'] * f * R.uniform(.9, 1.1), -3); rec = min(dam, round(b['rec'] * f * R.uniform(.85, 1.1), -3))
        rows.append(dict(reg=reg, sol=sol, sus=sus, ter=ter, per=min(sol * 10, round(sol * b['per'] / b['sol'] * R.uniform(.9, 1.1))), dam=dam, rec=rec))
    out['depts'][k] = rows
with open(a.out, 'w', encoding='utf-8') as f:
    f.write('// БД истории месячных отчётов РОВД (синтетическая). Период с %s по %s.\n' % (periods[0], periods[-1]))
    f.write('// Генерация: python3 gen_reports.py reports.js --seed %d\n' % a.seed)
    f.write('window.DB = window.DB || {};\nwindow.DB.reports = ' + json.dumps(out, ensure_ascii=False) + ';\n')
print('periods', len(periods), 'depts', len(out['depts']))
