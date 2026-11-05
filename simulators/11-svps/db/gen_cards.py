#!/usr/bin/env python3
"""Генератор синтетической БД карточек формы №1 для симулятора СВПС.

Запуск:  python3 gen_cards.py ../svps_simulator_with_token.html cards.js [--seed 1] [--size 360] [--errors 14]
Справочник статей (ART) читается из HTML симулятора, поэтому категории тяжести всегда совпадают с ним.
Все данные вымышленные.
"""
import re, sys, json, random, argparse, datetime

ap = argparse.ArgumentParser()
ap.add_argument('html'); ap.add_argument('out')
ap.add_argument('--seed', type=int, default=1)
ap.add_argument('--size', type=int, default=360)
ap.add_argument('--errors', type=int, default=14)
a = ap.parse_args()
R = random.Random(a.seed)

src = open(a.html, encoding='utf-8').read()
ART = [dict(c=m[0], p=m[1], n=m[2], cat=m[3], t=m[4]) for m in re.findall(
    r"\{c:'([^']*)',p:'([^']*)',n:'([^']*)',cat:'([^']*)',t:'([^']*)',no:'[^']*'\}", src)]
assert len(ART) > 30, 'не удалось прочитать справочник статей'

DEPTS = {'prikuban': ('prikubansky', 127), 'karasun': ('karasunsky', 98), 'central': ('centralny', 143),
         'western': ('western', 84), 'kalinino': ('kalinino', 34)}
ART_W = {'158': 14, '159': 8, '161': 5, '228': 6, '228.1': 3, '116': 5, '115': 3, '112': 3, '111': 2,
         '105': 1, '131': 1, '162': 2, '264': 3, '272': 2, '159.6': 3}
PLACES = {
    'Преступления против жизни': ['house', 'street'],
    'Преступления против здоровья': ['pub', 'street', 'house'],
    'Против пол. неприкосновенности': ['house', 'street'],
    'Кражи': ['house', 'trade', 'transport', 'street'],
    'Мошенничество': ['other', 'trade', 'house'],
    'Грабежи': ['street', 'trade'], 'Разбои': ['street', 'trade', 'house'],
    'Иные имущественные': ['street', 'transport', 'house', 'trade'],
    'Против общественного порядка': ['pub', 'street'],
    'Наркотики': ['street', 'house'],
    'Против безопасности движения': ['transport'],
    'Против порядка управления': ['street', 'pub'],
    'Иные': ['other'],
}
IT = 'IT-преступления (ст.159.6, 272-274.2)'
ECO = 'Экономические (ст.159.1-160, 174, 195-196)'
PLACES[IT] = ['trade', 'enterprise', 'house', 'other']
PLACES[ECO] = ['enterprise', 'trade']
STATUS = ['registered'] * 55 + ['solved'] * 35 + ['suspended'] * 6 + ['terminated'] * 4
STREETS = ['Красная', 'Северная', 'Тополиная', 'Садовая', 'Ставропольская', 'Рашпилевская', 'Гагарина', 'Мира',
           'Шоссейная', 'Дзержинского', 'Октябрьская', 'Коммунаров', 'Захарова', 'Кубанская', 'Воронежская',
           'Новороссийская', 'Постовая', 'Крымская', 'Лесная', 'Парковая', 'Центральная', 'Советская',
           'Тургенева', 'Длинная', 'Фадеева', 'Героев-разведчиков', 'Московская', 'Береговая', 'Школьная',
           'Строителей', 'Селезнёва', 'Уральская', 'Солнечная', 'Полевая', 'Западная', 'Железнодорожная']
SURN = ['Кравченко', 'Мартиросян', 'Петренко', 'Сухов', 'Лебедева', 'Варченко', 'Николаев', 'Харченко', 'Гусева',
        'Симонов', 'Власова', 'Рябов', 'Жукова', 'Савченко', 'Горбатенко', 'Соколов', 'Бондаренко', 'Ткаченко',
        'Назаров', 'Федорова', 'Лысенко', 'Мироненко', 'Дорофеев', 'Артемьева', 'Коваль', 'Шевченко', 'Зайцев',
        'Орлова', 'Панченко', 'Тимофеев', 'Борисова', 'Игнатьев', 'Руденко', 'Кузьмина', 'Степанов', 'Гончарова']
INI = 'АВДЕИКЛМНОПРСТ'

def pick_art():
    ws = [ART_W.get(x['c'], 2) for x in ART]
    return R.choices(ART, ws)[0]

def day(d): return (datetime.date(2024, 1, 1) + datetime.timedelta(days=d - 1)).isoformat()

def addr(lt, art):
    st = R.choice(STREETS); n = R.randint(1, 250)
    base = ('пр. ' if R.random() < .12 else 'ул. ') + st + ', ' + str(n)
    if lt == 'house': return base + ', кв.' + str(R.randint(1, 140))
    return base + {'trade': ' (магазин)', 'transport': ' (проезжая часть)' if art['c'] == '264' else ' (парковка)',
                   'enterprise': ' (офис)', 'pub': ' (кафе)'}.get(lt, '')

def card(error=False):
    art = pick_art(); dp = R.choices(list(DEPTS), [v[1] for v in DEPTS.values()])[0]
    di = DEPTS[dp][0] if R.random() < .85 else DEPTS[R.choice(list(DEPTS))][0]
    lt = R.choice(PLACES.get(art['t'], ['other']))
    # ст.158: проникновение в жилище — ч.3 (п. «а»), поэтому ч.2 не относим к жилищу, а ч.3 чаще относим
    if art['c'] == '158' and art['p'] == '2' and lt == 'house': lt = R.choice(['trade', 'transport', 'street'])
    if art['c'] == '158' and art['p'] == '3' and R.random() < .7: lt = 'house'
    rd = R.randint(2, 15)
    cd = rd + R.randint(1, 6) if error else rd - R.randint(0, 5)
    return {'dp': dp, 'ac': art['c'], 'ap': art['p'], 'ad': 'ст.' + art['c'] + (' ч.' + art['p'] if art['p'] else ''),
            'ct': art['t'], 'cg': art['cat'], 'di': di, 'rd': day(rd), 'cd': day(cd) if cd >= 1 else '2023-12-' + str(31 + cd),
            'lt': lt, 'addr': addr(lt, art), 'st': R.choice(STATUS),
            'iv': R.choice(SURN) + ' ' + R.choice(INI) + '.' + R.choice(INI) + '.',
            'nt': 'ОШИБКА: дата совершения позже регистрации' if error else '', 'de': error}

pool = [card() for _ in range(a.size)]
errs = [card(True) for _ in range(a.errors)]
for e in errs: e['st'] = 'registered'
js = ["// БД карточек формы №1 (синтетическая, все данные вымышленные).",
      "// Генерация: python3 gen_cards.py ../svps_simulator_with_token.html cards.js --seed %d --size %d --errors %d" % (a.seed, a.size, a.errors),
      "// Параметры выборки при запуске симулятора можно менять здесь: sampleSize, minPerDept.",
      "window.DB = window.DB || {};", "window.DB.cards = {",
      "  version: '2024.1', sampleSize: 40, minPerDept: 3,",
      "  // обычные карточки: дата совершения <= даты регистрации",
      "  pool: ["]
js += ['    ' + json.dumps(c, ensure_ascii=False) + ',' for c in pool]
js += ["  ],", "  // карточки с ошибкой даты (в выборку попадает ровно одна — для задания 02)", "  errorPool: ["]
js += ['    ' + json.dumps(c, ensure_ascii=False) + ',' for c in errs]
js += ["  ]", "};", ""]
open(a.out, 'w', encoding='utf-8').write('\n'.join(js))
print('pool', len(pool), 'errors', len(errs))
