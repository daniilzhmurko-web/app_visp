#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор СИНТЕТИЧЕСКОЙ базы для симулятора ФИС ГИБДД-М.

  python tools/generate_data.py                  # стандартный объём (~10 тыс. ТС, 20 тыс. постановлений)
  python tools/generate_data.py --scale 3        # втрое больше
  python tools/generate_data.py --seed 7         # другой набор (при том же seed результат одинаковый)

Все данные вымышлены. Реальные персональные данные использовать нельзя (ФЗ-152).
Результат — .js-пакеты в data/js/ + data/manifest.js + docs/kb.js; их подключает index.html
обычными <script>, поэтому симулятор открывается двойным кликом, без сервера.
"""
import argparse, json, os, random, re, sys
from datetime import date, timedelta

ap = argparse.ArgumentParser()
ap.add_argument('--seed', type=int, default=20261014)
ap.add_argument('--scale', type=float, default=1.0)
ap.add_argument('--shard', type=int, default=4000, help='строк в одном файле-шарде')
args = ap.parse_args()
R = random.Random(args.seed)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
TODAY = date.today()
S = args.scale
N_VEH, N_LIC, N_VIOL = int(10000 * S), int(8000 * S), int(20000 * S)

ri = R.randint
def pick(a): return a[R.randrange(len(a))]
def wpick(pairs):
    tot = sum(w for _, w in pairs); x = R.random() * tot
    for v, w in pairs:
        x -= w
        if x <= 0: return v
    return pairs[-1][0]
def iso(d): return d.isoformat()
def rdate(a, b):  # случайная дата в [a, b]
    return a + timedelta(days=R.randint(0, max(0, (b - a).days)))
def norm_name(s): return re.sub(r'\s+', ' ', s.strip()).lower()

# ───────────────────────── справочники ─────────────────────────
SUR_M = ('Иванов Петров Сидоров Смирнов Кузнецов Попов Васильев Соколов Михайлов Новиков Фёдоров Морозов Волков Алексеев Лебедев Семёнов Егоров Павлов Козлов Степанов Николаев Орлов Андреев Макаров Никитин Захаров Зайцев Соловьёв Борисов Яковлев Григорьев Романов Воробьёв Сергеев Кузьмин Фролов Александров Дмитриев Королёв Гусев Киселёв Ильин Максимов Поляков Сорокин Виноградов Ковалёв Белов Медведев Антонов Тарасов Жуков Баранов Филиппов Комаров Давыдов Беляев Герасимов Богданов Осипов Сидоренко Мельников Щербаков Блинов Колесников Карпов Афанасьев Власов Маслов Исаков Тихонов Аксёнов Гаврилов Родионов Котов Горбунов Кудрявцев Быков Зуев Третьяков Савельев Панов Рыбаков Суворов Абрамов Воронов Мухин Архипов Трофимов Мартынов Емельянов Горшков Чернов Овчинников Селезнёв Панфилов Копылов Михеев Галкин Назаров Лобанов Лукин Беляков Потапов Некрасов Хохлов Жданов Наумов Шубин Крылов Гончаров Уваров Ширяев Бирюков Шестаков Игнатов Булатов Тимофеев Громов Лазарев Муравьёв Рогов Голубев Ершов Лаптев Бондаренко Шевченко Ткаченко Мироненко Руденко Захарченко').split()
FN_M = 'Александр Алексей Андрей Антон Артём Борис Вадим Валерий Василий Виктор Виталий Владимир Владислав Геннадий Георгий Григорий Даниил Денис Дмитрий Евгений Егор Иван Игорь Илья Кирилл Константин Леонид Максим Михаил Николай Олег Павел Пётр Роман Руслан Сергей Станислав Степан Тимофей Фёдор Юрий Ярослав'.split()
FN_F = 'Александра Алёна Алина Анастасия Анна Валентина Валерия Вера Виктория Галина Дарья Евгения Екатерина Елена Елизавета Инна Ирина Карина Кристина Ксения Лариса Любовь Людмила Margarita Мария Марина Надежда Наталья Нина Оксана Ольга Полина Светлана София Татьяна Ульяна Юлия Яна'.replace('Margarita', 'Маргарита').split()
PAT = [('Александрович', 'Александровна'), ('Алексеевич', 'Алексеевна'), ('Андреевич', 'Андреевна'), ('Антонович', 'Антоновна'), ('Борисович', 'Борисовна'), ('Васильевич', 'Васильевна'), ('Викторович', 'Викторовна'), ('Владимирович', 'Владимировна'), ('Георгиевич', 'Георгиевна'), ('Григорьевич', 'Григорьевна'), ('Денисович', 'Денисовна'), ('Дмитриевич', 'Дмитриевна'), ('Евгеньевич', 'Евгеньевна'), ('Иванович', 'Ивановна'), ('Игоревич', 'Игоревна'), ('Ильич', 'Ильинична'), ('Леонидович', 'Леонидовна'), ('Максимович', 'Максимовна'), ('Михайлович', 'Михайловна'), ('Николаевич', 'Николаевна'), ('Олегович', 'Олеговна'), ('Павлович', 'Павловна'), ('Петрович', 'Петровна'), ('Романович', 'Романовна'), ('Сергеевич', 'Сергеевна'), ('Степанович', 'Степановна'), ('Фёдорович', 'Фёдоровна'), ('Юрьевич', 'Юрьевна')]
def fem(s):
    if s.endswith('ский'): return s[:-4] + 'ская'
    if s.endswith('ой'): return s[:-2] + 'ая'
    if s.endswith(('ов', 'ев', 'ёв', 'ин', 'ын')): return s + 'а'
    if s.endswith('ий'): return s[:-2] + 'ая'
    return s  # Бондаренко, Шевченко и т.п. не склоняются
def make_fio(male=None):
    male = R.random() < .5 if male is None else male
    if male: return f'{pick(SUR_M)} {pick(FN_M)} {pick(PAT)[0]}', 'M'
    return f'{fem(pick(SUR_M))} {pick(FN_F)} {pick(PAT)[1]}', 'F'

REGIONS = [('77', 14), ('99', 4), ('177', 3), ('97', 3), ('78', 8), ('98', 2), ('50', 9), ('90', 3), ('150', 2), ('47', 4), ('66', 4), ('96', 2), ('74', 3), ('174', 1), ('23', 5), ('93', 2), ('16', 4), ('116', 1), ('63', 3), ('52', 3), ('54', 3), ('55', 2), ('59', 2), ('61', 3), ('64', 2), ('34', 2), ('36', 2), ('24', 2), ('38', 2), ('72', 2)]
CITIES = {'77': 'Москва', '99': 'Москва', '177': 'Москва', '97': 'Москва', '78': 'Санкт-Петербург', '98': 'Санкт-Петербург', '50': 'Московская обл.', '90': 'Московская обл.', '150': 'Московская обл.', '47': 'Ленинградская обл.', '66': 'Екатеринбург', '96': 'Екатеринбург', '74': 'Челябинск', '174': 'Челябинск', '23': 'Краснодар', '93': 'Краснодар', '16': 'Казань', '116': 'Казань', '63': 'Самара', '52': 'Нижний Новгород', '54': 'Новосибирск', '55': 'Омск', '59': 'Пермь', '61': 'Ростов-на-Дону', '64': 'Саратов', '34': 'Волгоград', '36': 'Воронеж', '24': 'Красноярск', '38': 'Иркутск', '72': 'Тюмень'}
STREETS = 'Ленина Мира Гагарина Советская Центральная Победы Садовая Школьная Молодёжная Лесная Набережная Новая Заводская Октябрьская Кирова Комсомольская Пушкина Первомайская Строителей Железнодорожная Юбилейная Зелёная Парковая Береговая Солнечная Космонавтов Чехова Горького Маяковского'.split()
HWY = ['МКАД {} км', 'трасса М-4 {} км', 'трасса М-7 {} км', 'КАД {} км', 'ЕКАД {} км', 'трасса М-5 {} км', 'А-107 {} км']
BRANDS = {
 'LADA': (['Granta', 'Vesta', 'Niva Legend', 'Largus', 'XRAY'], 28), 'KIA': (['Rio', 'Sportage', 'Ceed', 'Optima', 'Sorento'], 9),
 'Hyundai': (['Solaris', 'Creta', 'Tucson', 'Elantra', 'Santa Fe'], 8), 'Toyota': (['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Highlander'], 8),
 'Volkswagen': (['Polo', 'Tiguan', 'Passat', 'Golf', 'Jetta'], 6), 'BMW': (['3 Series', '5 Series', 'X5', 'X3', '1 Series'], 4),
 'Ford': (['Focus', 'Mondeo', 'Kuga', 'Fiesta', 'Transit'], 4), 'Renault': (['Logan', 'Duster', 'Sandero', 'Kaptur', 'Arkana'], 6),
 'Nissan': (['Qashqai', 'X-Trail', 'Almera', 'Juke', 'Teana'], 5), 'Mazda': (['3', '6', 'CX-5', 'CX-7', '2'], 3),
 'Mercedes-Benz': (['C-Class', 'E-Class', 'GLC', 'Sprinter', 'A-Class'], 3), 'Skoda': (['Octavia', 'Rapid', 'Kodiaq', 'Superb', 'Fabia'], 4),
 'ГАЗ': (['ГАЗель Next', 'Соболь', 'ГАЗель Бизнес'], 3), 'УАЗ': (['Patriot', 'Hunter', 'Буханка'], 2),
 'Chery': (['Tiggo 7', 'Tiggo 4', 'Arrizo 6'], 3), 'Haval': (['Jolion', 'F7', 'H6', 'Dargo'], 3), 'Geely': (['Coolray', 'Atlas', 'Monjaro'], 2),
}
COLORS = ['Белый', 'Чёрный', 'Серый', 'Серебристый', 'Синий', 'Красный', 'Зелёный', 'Бежевый']
PLATE_L = 'АВЕКМНОРСТУХ'
VINC = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
FINES = [('12.9 ч.2', 'Превышение скорости на 20–40 км/ч', 750, 40), ('12.9 ч.3', 'Превышение скорости на 40–60 км/ч', 1500, 15), ('12.9 ч.4', 'Превышение скорости на 60–80 км/ч', 3000, 5), ('12.9 ч.5', 'Превышение скорости более 80 км/ч', 7500, 2), ('12.12 ч.1', 'Проезд на запрещающий сигнал', 1000, 8), ('12.15 ч.4', 'Выезд на встречную полосу', 5000, 3), ('12.8 ч.1', 'Управление в состоянии опьянения', 30000, 1.5), ('12.26 ч.1', 'Отказ от медосвидетельствования', 30000, 0.7), ('12.37 ч.1', 'Управление ТС водителем, не вписанным в полис ОСАГО', 500, 12), ('12.37 ч.2', 'Управление ТС без полиса ОСАГО', 800, 10)]
NO_DISC = lambda code: code.startswith(('12.8', '12.24', '12.26'))
DISC_DAYS, DISC_RATE = 30, 0.25
STATIONS = ['ПТО «Автотест»', 'ТО-Центр', 'Диагностика+', 'Техосмотр24', 'АвтоКонтроль', 'ПТО «Север»']

def gen_plate(used):
    while True:
        p = f'{pick(PLATE_L)}{ri(100,999)}{pick(PLATE_L)}{pick(PLATE_L)}{wpick(REGIONS)}'
        if p not in used: used.add(p); return p
def gen_vin(used):
    while True:
        v = ''.join(R.choice(VINC) for _ in range(17))
        if v not in used: used.add(v); return v
def gen_pass(used):
    while True:
        p = f'{ri(10,99)}{ri(10,99)} {ri(100000,999999)}'
        if p not in used: used.add(p); return p

# ───────────────────────── граждане (= база ГУВМ: паспортные данные) ─────────────────────────
N_PERSONS = int(10000 * S)
GUVM_REGION = {'Москва': 'г. Москве', 'Санкт-Петербург': 'г. Санкт-Петербургу и Ленинградской обл.', 'Московская обл.': 'Московской области', 'Ленинградская обл.': 'г. Санкт-Петербургу и Ленинградской обл.', 'Екатеринбург': 'Свердловской области', 'Челябинск': 'Челябинской области', 'Краснодар': 'Краснодарскому краю', 'Казань': 'Республике Татарстан', 'Самара': 'Самарской области', 'Нижний Новгород': 'Нижегородской области', 'Новосибирск': 'Новосибирской области', 'Омск': 'Омской области', 'Пермь': 'Пермскому краю', 'Ростов-на-Дону': 'Ростовской области', 'Саратов': 'Саратовской области', 'Волгоград': 'Волгоградской области', 'Воронеж': 'Воронежской области', 'Красноярск': 'Красноярскому краю', 'Иркутск': 'Иркутской области', 'Тюмень': 'Тюменской области'}
INVALID_NOTES = ['Недействителен: замена в связи с изменением ФИО', 'Недействителен: выдан новый документ', 'Недействителен: признан недействительным (ошибка в бланке)']
used_pass = set(); persons = []
FIXTURE_PERSONS = [('Смирнов Артём Игоревич', '9911 223344', '1995-05-05'), ('Белова Дарья Олеговна', '9912 334455', '1998-03-12'), ('Громов Лев Павлович', '9913 445566', '1992-11-23')]
def add_person(fio, passport, birth, status='valid'):
    reg = wpick(REGIONS); city = CITIES[reg]; bd = date.fromisoformat(birth)
    age = (TODAY - bd).days // 365
    miles = [m for m in (14, 20, 45) if m <= age]
    mile = miles[-1] if miles else 14
    issue = min(TODAY - timedelta(days=ri(0, 30)), bd + timedelta(days=int(365.25 * mile) + ri(0, 180)))
    note = ''
    if status == 'lost': note = 'Заявлено об утрате ' + iso(TODAY - timedelta(days=ri(2, 600)))
    elif status == 'invalid': note = pick(INVALID_NOTES)
    persons.append({'passport': passport, 'fio': fio, 'birth': birth, 'birthPlace': 'г. ' + pick(list(CITIES.values())),
        'address': f'{city}, ул. {pick(STREETS)}, д. {ri(1,120)}, кв. {ri(1,300)}',
        'phone': f'+7 9{ri(10,99)} {ri(100,999)}-{ri(10,99)}-{ri(10,99)}', 'status': status, 'note': note,
        'issueDate': iso(issue), 'issuedBy': 'ГУ МВД России по ' + GUVM_REGION.get(city, city), 'code': f'{ri(100,999)}-{ri(100,999)}'})
for fio, ps, b in FIXTURE_PERSONS:
    used_pass.add(ps); add_person(fio, ps, b)
while len(persons) < N_PERSONS:
    fio, _ = make_fio()
    b = rdate(date(1950, 1, 1), TODAY - timedelta(days=365 * 18 + 30))
    st = wpick([('valid', 96), ('lost', 2.5), ('invalid', 1.5)])
    add_person(fio, gen_pass(used_pass), iso(b), st)
adults = [p for p in persons if p['birth'] <= iso(TODAY - timedelta(days=366 * 21)) and p['status'] == 'valid']
R.shuffle(adults)
fixture_keys = {p[1] for p in FIXTURE_PERSONS}

# ───────────────────────── ТС ─────────────────────────
used_plate, used_vin = set(), set(); vehicles = []
brand_pairs = [(b, w) for b, (_, w) in BRANDS.items()]
owner_pool = [p for p in adults if p['passport'] not in fixture_keys]
def make_vehicle(owner, plate=None, vin=None):
    br = wpick(brand_pairs); model = pick(BRANDS[br][0])
    reg = rdate(TODAY - timedelta(days=365 * 12), TODAY - timedelta(days=3))
    year = max(1995, min(reg.year, reg.year - wpick([(0, 20), (1, 25), (2, 20), (3, 12), (5, 12), (8, 8), (12, 3)])))
    return {'plate': plate or gen_plate(used_plate), 'vin': vin or gen_vin(used_vin), 'brand': br, 'model': model, 'year': year,
            'color': pick(COLORS), 'type': wpick([('Легковой', 84), ('Грузовой', 11), ('Мотоцикл', 3), ('Автобус', 2)]),
            'owner': owner['fio'], 'passport': owner['passport'], 'sts': f'{ri(10,99)}{pick("АВЕКМНОРСТУХ")}{pick("АВЕКМНОРСТУХ")} {ri(100000,999999)}',
            'regDate': iso(reg), 'status': 'Активен', 'anomaly': ''}
# фиксированные ТС под учебные сценарии (подсказки заданий ссылаются на эти номера)
FIX_WANTED = [('К777АВ77', 'X4X3B1A14H1234567', 'Угон', 1, '2025-11-15'), ('Х001РО77', 'WVWZZZ1KZBM123456', 'Утрата регистрационных документов', 1, '2026-01-22'),
              ('М555НА50', 'JTKJF5C7XB3048912', 'Участие в ДТП, скрылся', 1, '2026-03-10'), ('А123ВЕ66', 'VF1BB2C036789012X', 'Угон', 0, '2025-08-05'),
              ('Е777КМ78', 'XW8ZZZ61ZMG567890', 'Не сдан гос. знак', 1, '2026-02-14')]
for plate, vin, *_ in FIX_WANTED:
    used_plate.add(plate); used_vin.add(vin)
    vehicles.append(make_vehicle(pick(owner_pool), plate, vin))
while len(vehicles) < N_VEH:
    # у части граждан по несколько ТС
    vehicles.append(make_vehicle(pick(owner_pool[:max(50, int(len(owner_pool) * .7))]) if R.random() < .85 else pick(owner_pool)))
R.shuffle(vehicles)
vehicles.sort(key=lambda v: v['regDate'])
for i, v in enumerate(vehicles, 1): v['id'] = i
by_plate = {v['plate']: v for v in vehicles}

# розыск
wanted = []
for plate, vin, reason, act, d in FIX_WANTED:
    wanted.append({'plate': plate, 'vin': vin, 'reason': reason, 'date': d, 'active': act, 'clearDate': '' if act else '2026-02-01'})
    if act: by_plate[plate]['status'] = 'В розыске'
free = [v for v in vehicles if v['plate'] not in {w['plate'] for w in wanted}]
R.shuffle(free)
REASONS = [('Угон', 62), ('Утрата регистрационных документов', 15), ('Участие в ДТП, скрылся', 10), ('Не сдан гос. знак', 13)]
n_act, n_inact = int(200 * S), int(45 * S)
for v in free[:n_act]:
    wanted.append({'plate': v['plate'], 'vin': v['vin'], 'reason': wpick(REASONS), 'date': iso(rdate(TODAY - timedelta(days=420), TODAY - timedelta(days=2))), 'active': 1, 'clearDate': ''})
    v['status'] = 'В розыске'
for v in free[n_act:n_act + n_inact]:
    d = rdate(TODAY - timedelta(days=700), TODAY - timedelta(days=60))
    wanted.append({'plate': v['plate'], 'vin': v['vin'], 'reason': wpick(REASONS), 'date': iso(d), 'active': 0, 'clearDate': iso(d + timedelta(days=ri(3, 40)))})
wanted.sort(key=lambda w: w['date'])

# дубли VIN (учебные аномалии): более поздняя запись копирует VIN более ранней
wset = {w['plate'] for w in wanted}
cands = [v for v in vehicles if v['plate'] not in wset]
dups = 0
for k in range(int(14 * S)):
    a = cands[R.randrange(len(cands) // 2)]; b = cands[len(cands) // 2 + R.randrange(len(cands) // 2)]
    if a['vin'] != b['vin'] and not b['anomaly']:
        b['vin'] = a['vin']; b['anomaly'] = 'dup_vin'; dups += 1

# ───────────────────────── ВУ ─────────────────────────
holders = [p for p in persons if p['passport'] not in fixture_keys and p['status'] != 'invalid' and p['birth'] <= iso(TODAY - timedelta(days=366 * 19))]
R.shuffle(holders)
licenses = []; used_lic = set(); lic_by_pass = {}
CATS = [('B', 66), ('B,C', 12), ('A,B', 11), ('B,C,E', 4), ('B,D', 3), ('M,B', 2), ('A', 2)]
for p in holders[:N_LIC]:
    bd = date.fromisoformat(p['birth']); lo = max(bd + timedelta(days=366 * 18 + 10), TODAY - timedelta(days=366 * 14))
    issue = rdate(lo, TODAY - timedelta(days=1)); exp = issue + timedelta(days=3650)
    st, rd, re_ = 'Действителен', 0, ''
    if R.random() < .06:
        rd = pick([180, 365, 548, 730, 120, 540]); re_ = iso(TODAY + timedelta(days=ri(5, max(6, rd - 1)))); st = 'Лишён'
    elif exp < TODAY: st = 'Просрочен'
    while True:
        num = f'{wpick(REGIONS)[:2]} {ri(1,99):02d} {ri(100000,999999)}'
        if num not in used_lic: used_lic.add(num); break
    lic = {'number': num, 'owner': p['fio'], 'passport': p['passport'], 'birthDate': p['birth'], 'cats': wpick(CATS), 'issueDate': iso(issue), 'expDate': iso(exp), 'status': st, 'revokeDays': rd, 'revokeEnd': re_}
    licenses.append(lic); lic_by_pass[p['passport']] = lic
licenses.sort(key=lambda l: l['issueDate'])
for i, l in enumerate(licenses, 1): l['id'] = i

# экзамены
exams = []
def add_exam(p, cat, d, th, p1, p2):
    exams.append({'name': p['fio'], 'key': norm_name(p['fio']), 'cat': cat, 'date': iso(d), 'th': th, 'p1': p1, 'p2': p2, 'allPass': int(th == p1 == p2 == 'pass')})
cand = [p for p in persons if p['passport'] not in lic_by_pass and p['passport'] not in fixture_keys and p['birth'] <= iso(TODAY - timedelta(days=366 * 19)) and p['status'] == 'valid']
R.shuffle(cand)
for fio, ps, _ in FIXTURE_PERSONS:       # готовые кандидаты на выдачу ВУ
    pp = next(x for x in persons if x['passport'] == ps)
    add_exam(pp, 'A' if fio.startswith('Громов') else 'B', TODAY - timedelta(days=ri(2, 5)), 'pass', 'pass', 'pass')
for p in cand[:int(140 * S)]:
    add_exam(p, 'B', TODAY - timedelta(days=ri(1, 45)), 'pass', 'pass', 'pass')
for p in cand[int(140 * S):int(140 * S) + int(1100 * S)]:       # неудачные попытки
    th = wpick([('fail', 55), ('pass', 45)]); p1 = 'pass' if th == 'pass' and R.random() < .6 else ('fail' if th == 'pass' else '')
    p2 = 'fail' if p1 == 'pass' else ''
    add_exam(p, 'B', TODAY - timedelta(days=ri(0, 120)), th, p1, p2)
exams.sort(key=lambda e: e['date'])

# ───────────────────────── штрафы ─────────────────────────
fine_pairs = [(f, f[3]) for f in FINES]
violations = []; used_dec = set()
veh_pool = [v for v in vehicles if v['status'] != 'В розыске'] or vehicles
for _ in range(N_VIOL):
    v = pick(veh_pool); f = wpick(fine_pairs); code, name, amt, _w = f
    vd = rdate(TODAY - timedelta(days=540), TODAY)
    deadline = vd + timedelta(days=60); age = (TODAY - vd).days
    while True:
        dec = f'18810{ri(10000000,99999999)}'
        if dec not in used_dec: used_dec.add(dec); break
    paid_p = .55 if age < 20 else .8
    paid = R.random() < paid_p; pay_date = ''; paid_amt = 0
    if paid:
        disc = (not NO_DISC(code)) and R.random() < .4
        pay_date = iso(vd + timedelta(days=ri(1, DISC_DAYS) if disc else ri(1, min(60, max(1, age)))))
        if disc and (date.fromisoformat(pay_date) - vd).days > DISC_DAYS: disc = False
        paid_amt = round(amt * (1 - DISC_RATE), 2) if disc else amt
        if date.fromisoformat(pay_date) > TODAY: pay_date = iso(TODAY)
    if paid: status = 'Оплачен'
    elif deadline >= TODAY: status = 'Новый'
    else: status = 'В ФССП' if R.random() < .85 else 'Просрочен'
    place = pick([f'ул. {pick(STREETS)} {ri(1,150)}', f'пр. {pick(STREETS)} {ri(1,90)}', pick(HWY).format(ri(1, 400))])
    violations.append({'decree': dec, 'person': v['owner'], 'plate': v['plate'], 'article': code, 'artName': name, 'amount': amt, 'paid': int(paid), 'paidAmt': paid_amt, 'vDate': iso(vd), 'deadline': iso(deadline), 'status': status, 'place': place, 'payDate': pay_date})
violations.sort(key=lambda x: x['vDate'])
for i, x in enumerate(violations, 1): x['id'] = i

# ───────────────────────── спецпродукция ─────────────────────────
special = [{'type': 'Бланки ВУ', 'total': 5000, 'used': 3200, 'lost': 3}, {'type': 'Гос. регистрационные знаки', 'total': 10000, 'used': 6500, 'lost': 8},
           {'type': 'Бланки СТС', 'total': 8000, 'used': 5100, 'lost': 2}, {'type': 'Бланки ПТС', 'total': 4000, 'used': 2800, 'lost': 1}, {'type': 'Технические талоны', 'total': 3000, 'used': 1800, 'lost': 0}]
specmoves = []
for _ in range(int(220 * S)):
    specmoves.append({'date': iso(rdate(TODAY - timedelta(days=200), TODAY)), 'type': pick(['Бланки ВУ', 'Гос. регистрационные знаки', 'Бланки СТС', 'Бланки ПТС']),
        'action': wpick([('Выдача', 50), ('Получение', 20), ('Передача', 20), ('Списание', 10)]), 'qty': ri(1, 60), 'cp': pick(['ФКУ ГЦ ТООБДД', 'МРЭО №1', 'МРЭО №3', 'РЭО ГИБДД', 'МРЭО №5']), 'op': make_fio()[0].rsplit(' ', 1)[0]})
specmoves.sort(key=lambda m: m['date'])

# ───────────────────────── внешние базы: по 10 000 записей на ведомство ─────────────────────────
N_EXT = int(10000 * S)
pers_by_pass = {p['passport']: p for p in persons}
DOMESTIC = {'LADA', 'ГАЗ', 'УАЗ'}
def city_of(reg): return CITIES[reg]
def rand_reg(): return wpick(REGIONS)

# ── ФССП: исполнительные производства ──
fssp = []; used_ip = set()
def ip_num():
    while True:
        n = f'{ri(10000,999999)}/{ri(21,26)}/{ri(10000,99999)}-ИП'
        if n not in used_ip: used_ip.add(n); return n
def osp(): return f'ОСП №{ri(1,9)} по г. {city_of(rand_reg())}'
def fssp_row(p, kind, amount, start, status='В производстве', decree='', vin='', plate='', restrict=0):
    return {'number': ip_num(), 'passport': p['passport'], 'fio': p['fio'], 'birth': p['birth'], 'kind': kind, 'amount': amount, 'start': iso(start), 'osp': osp(), 'status': status, 'decree': decree, 'vin': vin, 'plate': plate, 'restrict': restrict}
for x in violations:                           # штрафы ГИБДД, переданные приставам, — те же постановления, что в базе нарушений
    if x['status'] == 'В ФССП':
        v = by_plate[x['plate']]; p = pers_by_pass[v['passport']]
        st = min(TODAY, date.fromisoformat(x['deadline']) + timedelta(days=ri(3, 30)))
        fssp.append(fssp_row(p, 'Штраф ГИБДД', x['amount'], st, decree=x['decree']))
restr_pool = [v for v in vehicles if v['plate'] not in wset and not v['anomaly']]
R.shuffle(restr_pool)
for v in restr_pool[:int(380 * S)]:            # запреты на регистрационные действия (привязаны к VIN)
    p = pers_by_pass[v['passport']]
    fssp.append(fssp_row(p, pick(['Кредитная задолженность', 'Алименты', 'Налоги и сборы', 'Иная задолженность']), ri(30, 900) * 1000, rdate(TODAY - timedelta(days=400), TODAY - timedelta(days=5)), vin=v['vin'], plate=v['plate'], restrict=1))
KINDS = [('Алименты', 25), ('Кредитная задолженность', 30), ('Налоги и сборы', 20), ('Коммунальные платежи', 15), ('Иная задолженность', 10)]
while len(fssp) < N_EXT:
    p = pick(persons); k = wpick(KINDS)
    fssp.append(fssp_row(p, k, ri(3, 600) * 100, rdate(TODAY - timedelta(days=900), TODAY - timedelta(days=2)), status=wpick([('В производстве', 86), ('Приостановлено', 5), ('Окончено (исполнено)', 9)])))
fssp = fssp[:N_EXT]; fssp.sort(key=lambda r: r['start'])

# ── ФНС: налогоплательщики (по одной записи на гражданина) ──
fns = []; used_inn = set(); veh_cnt = {}
for v in vehicles: veh_cnt[v['passport']] = veh_cnt.get(v['passport'], 0) + 1
for p in persons:
    while True:
        inn = f'{ri(10,99)}{ri(10,99)}{ri(10**5,10**6-1)}{ri(10,99)}'
        if inn not in used_inn: used_inn.add(inn); break
    dt_ = ri(5, 90) * 100 if (veh_cnt.get(p['passport']) and R.random() < .12) else 0
    dp = ri(2, 60) * 100 if R.random() < .04 else 0
    di = ri(5, 300) * 100 if R.random() < .02 else 0
    fns.append({'inn': inn, 'passport': p['passport'], 'fio': p['fio'], 'birth': p['birth'], 'status': wpick([('Физическое лицо', 85), ('Самозанятый', 8), ('Индивидуальный предприниматель', 7)]),
                'inspection': f'ИФНС России №{ri(1,46)} по г. {city_of(rand_reg())}', 'debtTransport': dt_, 'debtProperty': dp, 'debtIncome': di, 'updated': iso(TODAY - timedelta(days=ri(0, 30)))})

# ── ФТС: таможенные декларации ──
fts = []; COUNTRIES = ['Япония', 'Германия', 'Республика Корея', 'Китай', 'США', 'Беларусь', 'Казахстан', 'Армения', 'ОАЭ', 'Грузия']
POSTS = ['Шереметьевская таможня', 'Домодедовская таможня', 'Балтийская таможня', 'Брянская таможня', 'Новороссийская таможня', 'Приморская таможня', 'Уральская таможня', 'Сибирская таможня']
DECL = lambda: pick(['ООО «АвтоИмпорт»', 'ООО «Трансавто»', 'ИП Сидоров А.В.', 'ООО «Мотор-Трейд»', 'ООО «Север-Авто»']) if R.random() < .6 else make_fio()[0]
def fts_row(vin, brand, year, own_date):
    temp = R.random() < .25
    d = own_date or rdate(TODAY - timedelta(days=1500), TODAY - timedelta(days=10))
    st = wpick([('Выпущена', 93), ('Условный выпуск', 3), ('Аннулирована', 4)])
    return {'dt': f'{ri(10000000,10999999)}/{d.strftime("%d%m%y")}/{ri(1000000,9999999)}', 'vin': vin, 'brand': brand, 'year': year, 'country': pick(COUNTRIES),
            'regime': 'ИМ 53 — временный ввоз' if temp else 'ИМ 40 — выпуск для внутреннего потребления', 'declarant': DECL(), 'post': pick(POSTS), 'date': iso(d),
            'dutyPaid': 0 if (st == 'Условный выпуск' or (not temp and R.random() < .02)) else 1, 'until': iso(TODAY + timedelta(days=ri(-420, 520))) if temp else '', 'status': st}
foreign_veh = [v for v in vehicles if v['brand'] not in DOMESTIC and v['plate'] not in wset]
R.shuffle(foreign_veh)
for v in (foreign_veh[:min(int(N_EXT * .42), len(foreign_veh) - int(80 * S))] + foreign_veh[-int(80 * S):]):
    fts.append(fts_row(v['vin'], v['brand'], v['year'], date.fromisoformat(v['regDate']) - timedelta(days=ri(20, 120))))
while len(fts) < N_EXT:
    fts.append(fts_row(gen_vin(used_vin), pick(['Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 'Hyundai', 'Kia', 'Lexus', 'Mazda', 'Nissan']), ri(2008, 2025), None))
R.shuffle(fts); fts.sort(key=lambda r: r['date'])

# ── НЦБ Интерпол: база похищенных транспортных средств ──
interpol = []; NCB = ['NCB Берлин', 'NCB Рим', 'NCB Париж', 'NCB Варшава', 'NCB Вашингтон', 'NCB Токио', 'NCB Анкара', 'NCB Мадрид', 'NCB Лондон']
REASON_I = ['Хищение транспортного средства', 'Незаконное присвоение (аренда, лизинг)', 'Подделка идентификационного номера', 'Хищение с последующим вывозом за границу']
def int_row(vin, brand, model, year, status):
    return {'ncb': pick(NCB), 'vin': vin, 'plate': f'{pick("ABCDEFGHKLMNPRSTUVXZ")}{pick("ABCDEFGHKLMNPRSTUVXZ")}-{ri(100,999)}-{pick("ABCDEFGHKLMNPRSTUVXZ")}{pick("ABCDEFGHKLMNPRSTUVXZ")}',
            'brand': brand, 'model': model, 'year': year, 'country': pick(['Германия', 'Италия', 'Франция', 'Польша', 'США', 'Япония', 'Турция', 'Испания', 'Великобритания']),
            'theftDate': iso(rdate(TODAY - timedelta(days=2200), TODAY - timedelta(days=30))), 'status': status, 'case': f'NCB-{ri(2019,2026)}-{ri(10000,99999)}', 'reason': pick(REASON_I)}
hits = [v for v in foreign_veh if v['plate'] not in wset][-int(80 * S):]
for k, v in enumerate(hits):
    interpol.append(int_row(v['vin'], v['brand'], v['model'], v['year'], 'Активный розыск' if k % 5 else 'Найдено, розыск прекращён'))
while len(interpol) < N_EXT:
    b = pick(['Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Renault', 'Peugeot', 'Fiat', 'Ford', 'Opel', 'Skoda'])
    interpol.append(int_row(gen_vin(used_vin), b, pick(['Model A', 'Sedan', 'SUV', 'Wagon', 'Coupe']), ri(2005, 2025), 'Активный розыск' if R.random() < .88 else 'Найдено, розыск прекращён'))
R.shuffle(interpol); interpol.sort(key=lambda r: r['theftDate'])

# ── ЕАИС ТО: диагностические карты ──
eaisto = []; STATIONS2 = ['ПТО «Автотест»', 'ТО-Центр', 'Диагностика+', 'Техосмотр24', 'АвтоКонтроль', 'ПТО «Север»', 'ТехЭксперт', 'ПТО «Магистраль»']
def card(v, issued):
    age = TODAY.year - int(v['year']); ok = R.random() < .94
    until = issued + timedelta(days=730 if age <= 10 else 365)
    return {'card': str(ri(10**14, 10**15 - 1)), 'plate': v['plate'], 'vin': v['vin'], 'issued': iso(issued), 'until': iso(until if ok else issued),
            'station': pick(STATIONS2), 'accred': f'RA.RU.{ri(100000,999999)}', 'odometer': ri(5, 420) * 1000, 'result': 'Допущено' if ok else 'Не допущено'}
elig = [v for v in vehicles if TODAY.year - int(v['year']) >= 4]
no_card = set(v['plate'] for v in R.sample(elig, int(len(elig) * .06)))
for v in elig:
    if v['plate'] in no_card: continue
    last = rdate(TODAY - timedelta(days=820), TODAY - timedelta(days=1))
    eaisto.append(card(v, last))
    if R.random() < .35: eaisto.append(card(v, last - timedelta(days=ri(365, 740))))
while len(eaisto) < N_EXT:
    v = pick(elig)
    if v['plate'] in no_card: continue
    eaisto.append(card(v, rdate(TODAY - timedelta(days=2200), TODAY - timedelta(days=830))))
if len(eaisto) > N_EXT:
    eaisto.sort(key=lambda c: c['issued']); eaisto = eaisto[len(eaisto) - N_EXT:]
R.shuffle(eaisto); eaisto.sort(key=lambda r: r['issued'])

# ── Росавтодор: акты весогабаритного контроля ──
rosavtodor = []; PVK = ['ПВК «Кубинка»', 'ПВК «Ногинск»', 'ПВК «Тосно»', 'ПВК «Воронеж»', 'ПВК «Самара»', 'ПВК «Казань»', 'ПВК «Новосибирск»', 'ПВК «Краснодар»']
def foreign_plate(): return f'{pick(PLATE_L)}{ri(100,999)}{pick(PLATE_L)}{pick(PLATE_L)}{wpick(REGIONS)}'
def act(plate, vin, owner):
    allowed = pick([18, 25, 36, 40, 44]); excess = round(R.random() * (allowed * .35), 1)
    fine = 0 if excess < .5 else (7000 if excess < 2 else 12000 if excess < 5 else 25000 if excess < 10 else 40000)
    paid = int(R.random() < .6)
    return {'act': f'СВК-{ri(2023,2026)}-{ri(100000,999999)}', 'plate': plate, 'vin': vin, 'date': iso(rdate(TODAY - timedelta(days=700), TODAY)), 'post': pick(PVK), 'axles': ri(2, 6),
            'weightActual': round(allowed + excess, 1), 'weightAllowed': allowed, 'excess': excess, 'fine': fine, 'paid': paid if fine else 1, 'owner': owner}
trucks = [v for v in vehicles if v['type'] in ('Грузовой', 'Автобус')]
for v in trucks:
    if R.random() < .6:
        for _ in range(ri(1, 4)): rosavtodor.append(act(v['plate'], v['vin'], v['owner']))
while len(rosavtodor) < N_EXT:
    rosavtodor.append(act(foreign_plate(), '', make_fio()[0]))
rosavtodor = rosavtodor[:N_EXT]; R.shuffle(rosavtodor); rosavtodor.sort(key=lambda r: r['date'])

# ───────────────────────── запись пакетов ─────────────────────────
OUT = os.path.join(ROOT, 'data', 'js'); os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith('.js'): os.remove(os.path.join(OUT, f))
manifest = {'generated': iso(TODAY), 'seed': args.seed, 'scale': S, 'sets': {}}
def write_set(name, rows, cols, types=None, lazy=False):
    shards = [rows[i:i + args.shard] for i in range(0, len(rows), args.shard)] or [[]]
    for n, sh in enumerate(shards):
        data = [[(1 if r[c] is True else r[c]) for c in cols] for r in sh]
        with open(os.path.join(OUT, f'{name}.{n:03d}.js'), 'w', encoding='utf-8') as fh:
            fh.write('FISDATA.add(' + json.dumps(name) + ',' + str(n) + ',' + json.dumps(cols, ensure_ascii=False) + ',' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ');\n')
    manifest['sets'][name] = {'rows': len(rows), 'shards': len(shards), 'types': types or {}, 'lazy': lazy}
    return len(rows)
write_set('persons', persons, ['passport', 'fio', 'birth', 'birthPlace', 'address', 'phone', 'status', 'note', 'issueDate', 'issuedBy', 'code'], {'issueDate': 'date'})
write_set('vehicles', vehicles, ['id', 'plate', 'vin', 'brand', 'model', 'year', 'color', 'type', 'owner', 'passport', 'sts', 'regDate', 'status', 'anomaly'], {'id': 'int', 'year': 'int', 'regDate': 'date', 'anomaly': 'nullstr'})
write_set('licenses', licenses, ['id', 'number', 'owner', 'passport', 'birthDate', 'cats', 'issueDate', 'expDate', 'status', 'revokeDays', 'revokeEnd'], {'id': 'int', 'cats': 'list', 'issueDate': 'date', 'expDate': 'date', 'revokeEnd': 'date', 'revokeDays': 'int'})
write_set('exams', exams, ['name', 'key', 'cat', 'date', 'th', 'p1', 'p2', 'allPass'], {'date': 'date', 'allPass': 'bool'})
write_set('violations', violations, ['id', 'decree', 'person', 'plate', 'article', 'artName', 'amount', 'paid', 'paidAmt', 'vDate', 'deadline', 'status', 'place', 'payDate'], {'id': 'int', 'amount': 'int', 'paid': 'bool', 'paidAmt': 'num', 'vDate': 'date', 'deadline': 'date', 'payDate': 'date'})
write_set('wanted', wanted, ['plate', 'vin', 'reason', 'date', 'active', 'clearDate'], {'active': 'bool', 'date': 'date', 'clearDate': 'date'})
write_set('special', special, ['type', 'total', 'used', 'lost'], {'total': 'int', 'used': 'int', 'lost': 'int'})
write_set('specmoves', specmoves, ['date', 'type', 'action', 'qty', 'cp', 'op'], {'date': 'date', 'qty': 'int'})
write_set('fssp', fssp, ['number', 'passport', 'fio', 'birth', 'kind', 'amount', 'start', 'osp', 'status', 'decree', 'vin', 'plate', 'restrict'], {'amount': 'int', 'start': 'date', 'restrict': 'bool'}, True)
write_set('fns', fns, ['inn', 'passport', 'fio', 'birth', 'status', 'inspection', 'debtTransport', 'debtProperty', 'debtIncome', 'updated'], {'debtTransport': 'int', 'debtProperty': 'int', 'debtIncome': 'int', 'updated': 'date'}, True)
write_set('fts', fts, ['dt', 'vin', 'brand', 'year', 'country', 'regime', 'declarant', 'post', 'date', 'dutyPaid', 'until', 'status'], {'year': 'int', 'date': 'date', 'dutyPaid': 'bool', 'until': 'date'}, True)
write_set('interpol', interpol, ['ncb', 'vin', 'plate', 'brand', 'model', 'year', 'country', 'theftDate', 'status', 'case', 'reason'], {'year': 'int', 'theftDate': 'date'}, True)
write_set('eaisto', eaisto, ['card', 'plate', 'vin', 'issued', 'until', 'station', 'accred', 'odometer', 'result'], {'issued': 'date', 'until': 'date', 'odometer': 'int'}, True)
write_set('rosavtodor', rosavtodor, ['act', 'plate', 'vin', 'date', 'post', 'axles', 'weightActual', 'weightAllowed', 'excess', 'fine', 'paid', 'owner'], {'date': 'date', 'axles': 'int', 'weightActual': 'num', 'weightAllowed': 'num', 'excess': 'num', 'fine': 'int', 'paid': 'bool'}, True)
with open(os.path.join(ROOT, 'data', 'manifest.js'), 'w', encoding='utf-8') as fh:
    fh.write('FISDATA.manifest(' + json.dumps(manifest, ensure_ascii=False, indent=1) + ');\n')

total = sum(m['rows'] for m in manifest['sets'].values())
size = sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT))
print(f'Готово: {total} записей в {sum(m["shards"] for m in manifest["sets"].values())} файлах, {size/1048576:.1f} МБ')
for k, m in manifest['sets'].items(): print(f'  {k:11s} {m["rows"]:>6}  ({m["shards"]} шт.)')
print(f'  дублей VIN: {dups}, в розыске активных: {sum(w["active"] for w in wanted)}, просроченных штрафов: {sum(1 for v in violations if v["status"]=="Просрочен")}, в ФССП: {sum(1 for v in violations if v["status"]=="В ФССП")}')
