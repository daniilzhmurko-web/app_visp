#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Импорт отпечатков SOCOFing (папка Real) в учебный проект ЦИАДИС-МВД.

Что делает:
  1. Читает файлы вида  12__M_Left_index_finger.BMP  (человек, пол, рука, палец).
  2. Конвертирует BMP -> PNG и кладёт в  assets/fingerprints/DK-ГГГГ-NNNN/01.png … 10.png
     (порядок: правая рука — большой, указательный, средний, безымянный, мизинец;
      затем левая рука в таком же порядке).
  3. Создаёт карточки с ВЫМЫШЛЕННЫМИ ФИО, датами, регионами, паспортами и записывает data/cards.js.
     Исходные 7 карточек проекта сохраняются (ID и ФИО не меняются — на них завязаны варианты экзамена);
     им подставляются отпечатки из набора. Фамилии из экзаменационных вариантов в генераторе не используются,
     чтобы цель задания всегда находилась однозначно.

Запуск (Windows, из корня проекта):
    pip install pillow
    python tools\\import_socofing.py --src "C:\\Users\\User\\Downloads\\Real"

Параметры:
    --count N     сколько карточек создать всего (по умолчанию: все люди из набора, обычно 600)
    --scale K     во сколько раз увеличить изображение (по умолчанию 2: 96x103 -> 192x206)
    --seed N      зерно генератора (одинаковое зерно = одинаковая база)
    --dry-run     только проверить файлы и показать статистику, ничего не записывая

Повторный запуск безопасен: базовые 7 карточек читаются из data/cards.base.js
(создаётся при первом запуске), остальное пересоздаётся заново.

Набор SOCOFing: Shehu Y.I. et al., «Sokoto Coventry Fingerprint Dataset», лицензия CC BY-NC 4.0
(только некоммерческое использование, обязательно указание источника). Проверьте условия на странице набора.
"""
import argparse, os, re, random, shutil, sys
from collections import defaultdict

try:
    from PIL import Image
except ImportError:
    sys.exit('Нужна библиотека Pillow:  pip install pillow')

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

FNAME = re.compile(r'^(\d+)__([MF])_(Left|Right)_(thumb|index|middle|ring|little)_finger\.bmp$', re.I)
FINGERS = ['thumb', 'index', 'middle', 'ring', 'little']
SLOT = {('right', f): i for i, f in enumerate(FINGERS)}
SLOT.update({('left', f): 5 + i for i, f in enumerate(FINGERS)})

# ---------- словари для вымышленных данных ----------
# Фамилии из экзаменационных вариантов (Петров, Сидоров, Кузнецов, Новиков) намеренно исключены.
SUR_M = ['Иванов','Смирнов','Попов','Соколов','Лебедев','Козлов','Морозов','Волков','Соловьёв','Васильев',
 'Зайцев','Павлов','Семёнов','Голубев','Виноградов','Богданов','Воробьёв','Фёдоров','Михайлов','Беляев',
 'Тарасов','Белов','Комаров','Орлов','Киселёв','Макаров','Андреев','Ковалёв','Ильин','Гусев','Титов',
 'Кузьмин','Кудрявцев','Баранов','Куликов','Алексеев','Степанов','Яковлев','Сорокин','Сергеев','Романов',
 'Захаров','Борисов','Королёв','Герасимов','Пономарёв','Григорьев','Лазарев','Медведев','Ершов','Никитин',
 'Соболев','Рябов','Поляков','Цветков','Данилов','Жуков','Фролов','Журавлёв','Николаев','Крылов','Максимов',
 'Сидельников','Осипов','Белоусов','Федотов','Дорофеев','Егоров','Матвеев','Бобров','Дмитриев','Калинин',
 'Анисимов','Петухов','Антонов','Тимофеев','Никифоров','Веселов','Филиппов','Марков','Большаков','Суханов']
SUR_F = [x + 'а' if not x.endswith(('ый','ой')) else x for x in SUR_M]
NAME_M = ['Александр','Алексей','Андрей','Антон','Артём','Борис','Вадим','Валерий','Василий','Виктор','Виталий',
 'Владимир','Владислав','Геннадий','Георгий','Григорий','Даниил','Денис','Дмитрий','Евгений','Егор','Иван',
 'Игорь','Илья','Кирилл','Константин','Леонид','Максим','Михаил','Никита','Николай','Олег','Павел','Роман',
 'Руслан','Сергей','Станислав','Тимур','Фёдор','Юрий','Ярослав']
NAME_F = ['Александра','Алина','Анастасия','Анна','Валентина','Вера','Виктория','Галина','Дарья','Евгения','Екатерина',
 'Елена','Елизавета','Инна','Ирина','Карина','Кристина','Ксения','Лариса','Людмила','Маргарита','Марина',
 'Мария','Надежда','Наталья','Нина','Олеся','Ольга','Полина','Светлана','София','Татьяна','Юлия']
def patr(father, fem):
    """Отчество по имени отца."""
    special = {'Павел': 'Павлович', 'Михаил': 'Михайлович', 'Лев': 'Львович', 'Илья': 'Ильич', 'Никита': 'Никитич', 'Фёдор': 'Фёдорович'}
    if father in special:
        p = special[father]
        if fem:
            p = {'Ильич': 'Ильинична', 'Никитич': 'Никитична'}.get(p, p[:-2] + 'на' if p.endswith('ич') and False else p.replace('ович', 'овна').replace('ьич', 'ьична'))
        return p
    if father.endswith('ий'):
        mid = 'иевич' if father in ('Дмитрий', 'Георгий') else 'ьевич'
        stem = father[:-2] + mid
    elif father.endswith(('й', 'ь')):
        stem = father[:-1] + 'евич'
    else:
        stem = father + 'ович'
    return stem[:-2] + 'на' if fem else stem

REGIONS = [  # (регион, подразделение)
 ('Москва','ГУ МВД по г. Москва'),('Московская область','УМВД по Московской области'),
 ('Санкт-Петербург','ГУ МВД по г. Санкт-Петербург'),('Краснодарский край','УМВД по Краснодарскому краю'),
 ('Ростовская область','ГУ МВД по Ростовской области'),('Свердловская область','ГУ МВД по Свердловской области'),
 ('Республика Татарстан','МВД по Республике Татарстан'),('Новосибирская область','ГУ МВД по Новосибирской области'),
 ('Нижегородская область','ГУ МВД по Нижегородской области'),('Самарская область','ГУ МВД по Самарской области'),
 ('Челябинская область','ГУ МВД по Челябинской области'),('Воронежская область','ГУ МВД по Воронежской области'),
 ('Красноярский край','ГУ МВД по Красноярскому краю'),('Пермский край','ГУ МВД по Пермскому краю'),
 ('Тульская область','УМВД по Тульской области'),('Волгоградская область','ГУ МВД по Волгоградской области'),
 ('Республика Башкортостан','МВД по Республике Башкортостан'),('Омская область','УМВД по Омской области')]
ARTS = ['ст. 158 ч. 2 УК РФ','ст. 159 ч. 1 УК РФ','ст. 161 ч. 1 УК РФ','ст. 162 ч. 1 УК РФ','ст. 228 ч. 1 УК РФ',
 'ст. 264 ч. 1 УК РФ','ст. 116 ч. 1 УК РФ','ст. 119 ч. 1 УК РФ','ст. 213 ч. 1 УК РФ','ст. 327 ч. 1 УК РФ']
OPS = ['Смирнов А.В.','Козлов П.Н.','Иванова О.Г.','Попова Е.С.','Волков Д.И.','Громова Е.В.','Лебедев А.П.']
TYPES = [('criminal','Уголовная',['Идентификация','Регистрация','Проверка'],0.45),
         ('civil','Гражданская',['Регистрация','Проверка'],0.35),
         ('migration','Миграционная',['Проверка','Регистрация'],0.20)]

def jsq(s): return "'" + s.replace('\\', '\\\\').replace("'", "\\'") + "'"

def scan(src):
    people = defaultdict(dict)
    bad = 0
    for fn in os.listdir(src):
        m = FNAME.match(fn)
        if not m: 
            if fn.lower().endswith('.bmp'): bad += 1
            continue
        pid, g, hand, fin = int(m.group(1)), m.group(2).upper(), m.group(3).lower(), m.group(4).lower()
        people[pid].setdefault('g', g)
        people[pid][SLOT[(hand, fin)]] = os.path.join(src, fn)
    full = {p: d for p, d in people.items() if all(i in d for i in range(10))}
    return full, len(people) - len(full), bad

def convert(path, dst, scale):
    im = Image.open(path).convert('L')
    if scale and scale > 1:
        im = im.resize((im.width * scale, im.height * scale), Image.LANCZOS)
    im.save(dst, 'PNG', optimize=True)

def gen_fio(rnd, g, used):
    for _ in range(50):
        if g == 'M':
            fio = f"{rnd.choice(SUR_M)} {rnd.choice(NAME_M)} {patr(rnd.choice(NAME_M), False)}"
        else:
            fio = f"{rnd.choice(SUR_F)} {rnd.choice(NAME_F)} {patr(rnd.choice(NAME_M), True)}"
        if fio not in used: used.add(fio); return fio
    return fio

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--src', required=True, help='папка Real из SOCOFing')
    ap.add_argument('--count', type=int, default=0, help='всего карточек (0 = все люди из набора)')
    ap.add_argument('--scale', type=int, default=2)
    ap.add_argument('--seed', type=int, default=2024)
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()

    if not os.path.isdir(a.src): sys.exit('Папка не найдена: ' + a.src)
    people, incomplete, bad = scan(a.src)
    print(f'Найдено людей с полным набором из 10 пальцев: {len(people)}  (неполных: {incomplete}, нераспознанных BMP: {bad})')
    if not people: sys.exit('Подходящих файлов не найдено. Нужны имена вида 1__M_Left_index_finger.BMP')

    data_dir = os.path.join(ROOT, 'data'); cards_js = os.path.join(data_dir, 'cards.js'); base_js = os.path.join(data_dir, 'cards.base.js')
    if not os.path.exists(base_js): shutil.copyfile(cards_js, base_js)
    base_txt = open(base_js, encoding='utf-8').read()
    body = base_txt[base_txt.index('const CARDS = [') + len('const CARDS = ['): base_txt.rindex('];')]
    base_entries = re.findall(r'\{\s*id:.*?\}(?=\s*,\s*\{|\s*$)', body, re.S)
    base_ids = [re.search(r"id:'([^']+)'", e).group(1) for e in base_entries]
    base_fio = [re.search(r"fio:'([^']+)'", e).group(1) for e in base_entries]
    print(f'Базовых карточек проекта: {len(base_entries)}')

    rnd = random.Random(a.seed)
    pool = {'M': sorted(p for p, d in people.items() if d['g'] == 'M'), 'F': sorted(p for p, d in people.items() if d['g'] == 'F')}
    for k in pool: rnd.shuffle(pool[k])
    total = a.count or len(people)
    total = min(max(total, len(base_entries)), len(people))
    if a.dry_run:
        print(f'[dry-run] будет создано карточек: {total}, PNG: {total*10}'); return

    assign = []   # (card_id, subject_id)
    for cid, fio in zip(base_ids, base_fio):
        g = 'F' if fio.split()[0].endswith(('а', 'я')) else 'M'
        if not pool[g]: g = 'M' if g == 'F' else 'F'
        assign.append((cid, pool[g].pop()))
    rest = pool['M'] + pool['F']; rnd.shuffle(rest)
    used_ids, used_fio = set(base_ids), set(base_fio)
    new_entries, serial = [], 3000
    for pid in rest[: total - len(base_entries)]:
        g = people[pid]['g']
        fio = gen_fio(rnd, g, used_fio)
        while True:
            serial += rnd.randint(1, 5)
            year = rnd.choice([2021, 2022, 2023, 2024, 2024, 2025])
            cid = f'ДК-{year}-{serial:04d}'
            if cid not in used_ids: used_ids.add(cid); break
        r = rnd.random(); acc = 0
        for t, tl, purposes, w in TYPES:
            acc += w
            if r <= acc: break
        region, dept = rnd.choice(REGIONS)
        dob = f'{rnd.randint(1,28):02d}.{rnd.randint(1,12):02d}.{rnd.randint(1955,2004)}'
        reg = f'{rnd.randint(1,28):02d}.{rnd.randint(1,12):02d}.{year}'
        pas = f'{rnd.randint(10,79)} {rnd.randint(10,24)} {rnd.randint(0,999999):06d}'
        status = 'pending' if rnd.random() < 0.08 else 'active'
        art = rnd.choice(ARTS) if t == 'criminal' else '—'
        new_entries.append(
          f"  {{ id:{jsq(cid)}, type:{jsq(t)}, tl:{jsq(tl)}, purpose:{jsq(rnd.choice(purposes))},\n"
          f"    fio:{jsq(fio)}, dob:{jsq(dob)}, region:{jsq(region)},\n"
          f"    reg:{jsq(reg)}, status:{jsq(status)}, fp:10, art:{jsq(art)},\n"
          f"    dept:{jsq(dept)}, pass:{jsq(pas)}, op:{jsq(rnd.choice(OPS))} }}")
        assign.append((cid, pid))

    out_root = os.path.join(ROOT, 'assets', 'fingerprints')
    os.makedirs(out_root, exist_ok=True)
    for n, (cid, pid) in enumerate(assign, 1):
        d = os.path.join(out_root, cid.replace('ДК', 'DK')); os.makedirs(d, exist_ok=True)
        for old in os.listdir(d):
            if old.lower().endswith('.svg'): os.remove(os.path.join(d, old))    # убрать учебные заглушки
        for slot in range(10):
            convert(people[pid][slot], os.path.join(d, f'{slot+1:02d}.png'), a.scale)
        if n % 50 == 0 or n == len(assign): print(f'  обработано карточек: {n}/{len(assign)}', end='\r')
    print()

    head = ("'use strict';\n/* База дактилокарт: %d записей. ФИО, даты, паспорта — вымышленные. "
            "Отпечатки: SOCOFing (CC BY-NC 4.0), assets/fingerprints/<ID>/NN.png.\n   Файл создан tools/import_socofing.py; базовые карточки — в data/cards.base.js */\n" % len(assign))
    text = head + 'const CARDS = [' + body.rstrip().rstrip(',') + ',\n' + ',\n'.join(new_entries) + '\n];\n'
    open(cards_js, 'w', encoding='utf-8').write(text)
    print(f'Готово: карточек {len(assign)}, изображений {len(assign)*10}. Откройте index.html.')

if __name__ == '__main__':
    main()
