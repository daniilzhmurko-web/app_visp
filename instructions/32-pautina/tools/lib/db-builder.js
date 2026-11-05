'use strict';
/* Сборка учебных (СИНТЕТИЧЕСКИХ) баз данных. Все персоны, номера и документы вымышлены. */
const { RNG } = require('./prng');
const P = require('./ru-pools');

const NOW = new Date(2026, 9, 27, 12, 0, 0);          // «сегодня» в учебном мире: 27.10.2026
const pad = (n, w = 2) => String(n).padStart(w, '0');
const fmt = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
const fmtT = d => `${fmt(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
const addYears = (d, n) => { const x = new Date(d); x.setFullYear(x.getFullYear() + n); return x; };
const reg2 = code => String(code).slice(-2).padStart(2, '0');

/* ───────── Сценарные записи (гарантируют выполнение заданий тренажёра) ───────── */
const SEED_OWNERS = [   // прежние 8 владельцев учебного сценария — остаются без изменений
  { fam: 'Иванов', im: 'Иван', ot: 'Иванович', sex: 'M', born: '15.03.1985', passport: '4516 234512', inn: '771234567890', addr: 'г. Москва, ул. Тверская, д. 15, кв. 42', zip: '125009', reg: '77' },
  { fam: 'Петров', im: 'Пётр', ot: 'Петрович', sex: 'M', born: '22.07.1978', passport: '4510 891234', inn: '772345678901', addr: 'г. Москва, Ленинский пр., д. 8, кв. 105', zip: '119421', reg: '77' },
  { fam: 'Сидорова', im: 'Анна', ot: 'Николаевна', sex: 'F', born: '10.11.1990', passport: '4520 345678', inn: '773456789012', addr: 'г. Москва, ул. Профсоюзная, д. 22, кв. 7', zip: '117485', reg: '77' },
  { fam: 'Кузнецов', im: 'Дмитрий', ot: 'Александрович', sex: 'M', born: '05.05.1982', passport: '4515 112233', inn: '774567890123', addr: 'г. Москва, Кутузовский пр., д. 3, кв. 88', zip: '121248', reg: '77' },
  { fam: 'Новикова', im: 'Ольга', ot: 'Евгеньевна', sex: 'F', born: '18.09.1995', passport: '4525 556677', inn: '775678901234', addr: 'г. Москва, ул. Садовая, д. 17, кв. 23', zip: '107078', reg: '77' },
  { fam: 'Морозов', im: 'Сергей', ot: 'Кириллович', sex: 'M', born: '30.01.1975', passport: '4508 998877', inn: '776789012345', addr: 'г. Москва, Варшавское ш., д. 45, кв. 3', zip: '115230', reg: '77' },
  { fam: 'Волков', im: 'Юрий', ot: 'Викторович', sex: 'M', born: '14.06.1988', passport: '4518 334455', inn: '777890123456', addr: 'г. Москва, ул. Нагатинская, д. 9, кв. 61', zip: '115304', reg: '77' },
  { fam: 'Козлов', im: 'Михаил', ot: 'Игоревич', sex: 'M', born: '29.12.1970', passport: '4505 667788', inn: '778901234567', addr: 'г. Москва, Щёлковское ш., д. 12, кв. 2', zip: '105122', reg: '77' },
];
/* plate, make, model, body, color, year, vin, ownerIndex(в SEED_OWNERS) */
const SEED_VEHICLES = [
  ['А177МС77', 'Форд', 'Фокус', 'hatch', 'Серебристый', 2016, 'XWFFXXEEBFJ123456', 0],
  ['О917ММ177', 'Форд', 'Фокус', 'hatch', 'Серебристый', 2015, 'XWFFXXEEBFJ098765', 1],
  ['Н438ЕС123', 'Toyota', 'Corolla', 'sedan', 'Белый', 2020, 'SB1K53AE50E234567', 2],
  ['В234КЕ99', 'Лада', 'Веста', 'sedan', 'Чёрный', 2022, 'XTA21176XXXXXXXAB', 3],
  ['М568РО77', 'Hyundai', 'Solaris', 'sedan', 'Синий', 2019, 'Z94CT41DADR345678', 4],
  ['Т923УА50', 'Kia', 'Rio', 'sedan', 'Белый', 2021, 'XWEHC813BH5456789', 5],
  ['Е445ВВ78', 'Volkswagen', 'Polo', 'sedan', 'Серый', 2018, 'WVWZZZ6RZHY567890', 6],
];
/* прочие «сценарные» номера из прежних пулов (только допустимые буквы) — владельцы случайные */
const SEED_PLATES_EXTRA = ['К112ОС77', 'Р789НН99', 'С234ТТ77', 'Х567РК50', 'В456ХА77', 'Т234НМ99', 'К890ОС77', 'Е111ВВ77', 'М999АА50', 'С678КТ77', 'В123МС99',
  'А400НН77', 'Т567РО78', 'К345УА23', 'Р234КЕ16', 'С890ЕЕ63', 'М456ОС52', 'А001АА77', 'К002ВВ77', 'М003СС77', 'Е005ЕЕ77', 'А000АА77'];
/* розыск: прежние записи (номер Е012ЮЮ99 исправлен на допустимый Е012КК99) */
const SEED_WANTED = [
  ['РОЗ-77-2026-00142', 'А177МС77', 'Форд Фокус', 'Серебристый', 2016, 'XWFFXXEEBFJ123456', 'Угон', '12.05.2026', '77', 'wanted', 'МКАД 22-й км, 15.05.2026 11:24'],
  ['РОЗ-77-2026-00139', 'К567ЕЕ99', 'BMW X5', 'Чёрный', 2021, '5UXCR6C52M9D12345', 'Угон', '10.05.2026', '77', 'wanted', 'Ленинградский пр., 09.05.2026 22:41'],
  ['РОЗ-77-2026-00134', 'М890АА50', 'Toyota Camry', 'Белый', 2019, '4T1BF1FK8KU123456', 'Скрылся с места ДТП', '08.05.2026', '50', 'wanted', 'МКАД 55-й км, 08.05.2026 08:12'],
  ['РОЗ-77-2026-00128', 'Н234ВВ77', 'Mercedes C-класс', 'Серый', 2020, 'WDD2052351R234567', 'Нарушение особо тяжкое', '05.05.2026', '77', 'found', 'Кутузовский пр., 11.05.2026 — ОБНАРУЖЕН'],
  ['РОЗ-77-2026-00121', 'Т456ОО78', 'Лада Веста', 'Синий', 2022, 'XTA21176XX0234567', 'Угон', '01.05.2026', '78', 'wanted', 'Не обнаружен'],
  ['РОЗ-77-2026-00115', 'С789НН77', 'Hyundai Tucson', 'Красный', 2020, 'KM8J3CA46LU234567', 'Угон', '28.04.2026', '77', 'wanted', 'Варшавское ш., 29.04.2026 17:05'],
  ['РОЗ-77-2026-00109', 'Е012КК99', 'Volkswagen Tiguan', 'Белый', 2019, '1V2WR2CA4KC234567', 'Скрылся с места ДТП', '25.04.2026', '99', 'closed', 'Дело закрыто — ложная тревога'],
  ['РОЗ-77-2026-00102', 'О345МС77', 'Kia Sportage', 'Серый', 2021, 'XWEH381AML234567', 'Угон', '20.04.2026', '77', 'wanted', 'Рублёвское ш., 22.04.2026 09:30'],
];

/* ───────── Комплексы ФВФ ───────── */
const DIRS = ['в сторону центра', 'из центра', 'в сторону МКАД', 'в сторону области'];   // направление контроля (детерминированно по индексу)
const FVF_MSK = [
  // id, addr, district, status, type, model, modelFull, poverkaNo, lat, lon, v24, limit
  ['CAM-077-001', 'Тверская ул., 1', 'ЦАО', 'online', 'Стрела-СТ', 'ККДДАС-01СТ', 'ККДДАС-01СТ Стрела-СТ', '№0002987', 55.7570, 37.6135, 342, 60],
  ['CAM-077-002', 'Ленинградский пр., 15', 'САО', 'online', 'Кордон', 'СИМСК-1124', 'СИМСК-1124-15842', '№0003125', 55.7905, 37.5610, 287, 60],
  ['CAM-077-003', 'Рублёвское ш., 45', 'ЗАО', 'online', 'Стрела-СТ', 'ККДДАС-01СТ', 'ККДДАС-01СТ Стрела-СТ', '№0002989', 55.7600, 37.4300, 194, 60],
  ['CAM-077-004', 'МКАД 22-й км, в сторону центра', 'ЮЗАО', 'online', 'Автодория', 'АД-2М', 'Автодория АД-2М', '№0001876', 55.6600, 37.8050, 521, 90],
  ['CAM-077-005', 'Садовое кольцо, 14', 'ЦАО', 'online', 'Стрела-М', 'ККДДАС-02', 'ККДДАС-02 Стрела-М', '№0003210', 55.7435, 37.6300, 412, 60],
  ['CAM-077-006', 'Варшавское ш., 32', 'ЮАО', 'online', 'Кордон', 'СИМСК-1124', 'СИМСК-1124', '№0002991', 55.6900, 37.6200, 265, 60],
  ['CAM-077-007', 'Кутузовский пр., 7', 'ЗАО', 'online', 'Стрела-СТ', 'ККДДАС-01СТ', 'ККДДАС-01СТ Стрела-СТ', '№0003301', 55.7480, 37.5420, 388, 60],
  ['CAM-077-008', 'ТТК Северный, 4', 'СВАО', 'online', 'Автодория', 'АД-2М', 'Автодория АД-2М', '№0001902', 55.8000, 37.5900, 311, 80],
  ['CAM-077-009', 'Нагатинская наб.', 'ЮАО', 'online', 'Стрела-М', 'ККДДАС-02', 'ККДДАС-02 Стрела-М', '№0003344', 55.6800, 37.6900, 156, 60],
  ['CAM-077-010', 'Щёлковское ш., 90', 'ВАО', 'online', 'Кордон', 'СИМСК-1124', 'СИМСК-1124', '№0003012', 55.8100, 37.8000, 298, 60],
  ['CAM-077-011', 'Профсоюзная ул., 22', 'ЮЗАО', 'warning', 'Стрела-СТ', 'ККДДАС-01СТ', 'ККДДАС-01СТ Стрела-СТ', '№0003055', 55.6500, 37.5600, 88, 60],
  ['CAM-077-012', 'Мичуринский пр., 6', 'ЗАО', 'online', 'Стрела-М', 'ККДДАС-02', 'ККДДАС-02 Стрела-М', '№0003388', 55.6900, 37.5000, 201, 60],
  ['CAM-077-013', 'Волоколамское ш., 10', 'СЗАО', 'online', 'Кордон', 'СИМСК-1124', 'СИМСК-1124', '№0003120', 55.8300, 37.4000, 176, 60],
  ['CAM-077-014', 'Ярославское ш., 55', 'СВАО', 'online', 'Автодория', 'АД-2М', 'Автодория АД-2М', '№0001999', 55.8400, 37.7000, 334, 80],
  ['CAM-077-015', 'Ленинградское ш., 45', 'САО', 'offline', 'Стрела-СТ', 'ККДДАС-01СТ', 'ККДДАС-01СТ Стрела-СТ', '№0003071', 55.8800, 37.4500, 0, 60],
  ['CAM-077-016', 'Калужское ш., 33', 'ЮЗАО', 'offline', 'Кордон', 'СИМСК-1124', 'СИМСК-1124', '№0003150', 55.6200, 37.5200, 0, 60],
];

function build(seed = 20261027) {
  const rng = new RNG(seed);
  const used = { plates: new Set(), vins: new Set(), inns: new Set(), passports: new Set() };

  /* ───────── НСИ ───────── */
  const colorByName = {}; P.COLORS.forEach(c => colorByName[c[0]] = c[1]);
  const nsi = {
    regions: Object.entries(P.CITY_BY_REGION).map(([code, city]) => ({ code, name: city })),
    koap_articles: [
      { code: '12.9.1', name: 'Превышение скорости до 20 км/ч', fine: 0, speed: true, overMin: 1, overMax: 20, points: 0 },
      ...['12.9.2', '12.9.3', '12.9.4', '12.9.5', '12.12.1', '12.15.4', '12.16.1', '12.17.2', '12.18', '12.19.2'].map(code => {
        const k = P.KOAP.find(x => x.code === code);
        return { code: k.code, name: k.name, fine: k.fine, speed: k.speed, overMin: k.over ? k.over[0] : null, overMax: k.over ? k.over[1] : null, points: k.code === '12.15.4' ? 4 : 0 };
      }),
      { code: '20.25.1', name: 'Неуплата штрафа в срок', fine: '×2 (мин 1000)', speed: false, overMin: null, overMax: null, points: 0 },
    ],
    colors: P.COLORS.map(c => ({ name: c[0], hex: c[1] })),
    body_types: Object.entries(P.BODY_RU).map(([code, name]) => ({ code, name })),
    vehicle_models: P.MODELS.map(m => ({ make: m[0], model: m[1], body: m[2], category: m[3], yearFrom: m[4], yearTo: m[5], wmi: m[6] })),
    plate_letters: P.PLATE_LETTERS,
    fvf_types: [
      { type: 'Стрела-СТ', model: 'ККДДАС-01СТ', accuracy: '±1 км/ч', kind: 'скорость, РП, светофор' },
      { type: 'Стрела-М', model: 'ККДДАС-02', accuracy: '±1 км/ч', kind: 'скорость, пешеходы' },
      { type: 'Кордон', model: 'СИМСК-1124', accuracy: '±1 км/ч', kind: 'скорость, остановка' },
      { type: 'Автодория', model: 'АД-2М', accuracy: '±1 км/ч', kind: 'средняя скорость на участке' },
    ],
    payment_status: [
      { code: 'paid_full', name: 'Оплачено полностью' }, { code: 'paid_half', name: 'Оплачено со скидкой' },
      { code: 'unpaid', name: 'Не оплачено' }, { code: 'overdue', name: 'Просрочено' },
    ],
  };

  /* ───────── утилиты ───────── */
  const pickRegion = () => rng.weighted(P.PLATE_REGION_POOL);
  function uniquePlate(region) {
    for (;;) {
      const num = rng.int(1, 999);
      const plate = rng.pick(P.PLATE_LETTERS) + pad(num, 3) + rng.pick(P.PLATE_LETTERS) + rng.pick(P.PLATE_LETTERS) + region;
      if (!used.plates.has(plate)) { used.plates.add(plate); return plate; }
    }
  }
  const VIN_CH = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  function uniqueVin(wmi, year) {
    for (;;) {
      let v = wmi; for (let i = 0; i < 6; i++) v += rng.pick(VIN_CH);
      v += 'ABCDEFGHJKLMNPRSTVWXY123456789'[(year - 2010 + 30) % 30]; v += rng.pick('0123456789ABCDEFG'.split(''));
      v += rng.digits(6);
      if (!used.vins.has(v)) { used.vins.add(v); return v; }
    }
  }
  function mkAddr(region) {
    const city = P.CITY_BY_REGION[region] || 'Москва';
    const isMsk = city === 'Москва';
    const street = isMsk ? rng.pick(P.MOSCOW_STREETS) : rng.pick(P.GENERIC_STREETS);
    const cityStr = city.includes(',') ? city : 'г. ' + city;
    const zip = isMsk ? String(rng.int(101, 129)) + rng.digits(3) : String(rng.int(140, 692)) + rng.digits(3);
    return { addr: `${cityStr}, ${street}, д. ${rng.int(1, 120)}, кв. ${rng.int(1, 240)}`, zip };
  }
  function uniqueDigits(set, n, prefix = '') {
    for (;;) { const s = prefix + rng.digits(n - prefix.length); if (!set.has(s)) { set.add(s); return s; } }
  }

  /* ───────── ВЛАДЕЛЬЦЫ ───────── */
  const owners = [];
  let ownerSeq = 0;
  const ownerId = () => 'OWN-' + pad(++ownerSeq, 6);

  SEED_OWNERS.forEach(o => {
    used.inns.add(o.inn); used.passports.add(o.passport);
    owners.push({ id: ownerId(), kind: 'person', fam: o.fam, im: o.im, ot: o.ot, sex: o.sex, born: o.born, passport: o.passport, inn: o.inn,
      phone: '+7 (9' + rng.digits(2) + ') ' + rng.digits(3) + '-' + rng.digits(2) + '-' + rng.digits(2), addr: o.addr, zip: o.zip, region: o.reg, scenario: true });
  });
  const PERSONS = 2200, ORGS = 110;
  while (owners.filter(o => o.kind === 'person').length < PERSONS) {
    const sex = rng.chance(0.62) ? 'M' : 'F';
    const region = pickRegion();
    const a = mkAddr(region);
    let fam, im, ot;
    if (sex === 'M') { const n = rng.pick(P.MALE); const s = rng.pick(P.SURNAMES); fam = s; im = n[0]; ot = rng.pick(P.MALE)[1]; }
    else { fam = P.femSurname(rng.pick(P.SURNAMES)); im = rng.pick(P.FEMALE); ot = rng.pick(P.MALE)[2]; }
    const age = rng.weighted([[rng.int(21, 30), 22], [rng.int(31, 40), 30], [rng.int(41, 50), 24], [rng.int(51, 60), 16], [rng.int(61, 78), 8]]);
    const born = new Date(NOW.getFullYear() - age, rng.int(0, 11), rng.int(1, 28));
    const passport = uniqueDigits(used.passports, 10).replace(/^(\d{4})(\d{6})$/, '$1 $2');
    owners.push({ id: ownerId(), kind: 'person', fam, im, ot, sex, born: fmt(born), passport, inn: uniqueDigits(used.inns, 12, reg2(region)),
      phone: '+7 (9' + rng.digits(2) + ') ' + rng.digits(3) + '-' + rng.digits(2) + '-' + rng.digits(2), addr: a.addr, zip: a.zip, region, scenario: false });
  }
  for (let i = 0; i < ORGS; i++) {
    const region = rng.weighted([['77', 40], ['50', 20], ['78', 10], ['99', 10], ['177', 10], ['197', 10]]);
    const a = mkAddr(region);
    const pre = rng.pick(P.ORG_PREFIX);
    const name = pre === 'ИП' ? `ИП ${rng.pick(P.SURNAMES)} ${rng.pick(P.MALE)[0][0]}.${rng.pick(P.MALE)[0][0]}.` : `${pre} «${rng.pick(P.ORG_NAMES)}${rng.chance(0.3) ? '-' + rng.int(2, 99) : ''}»`;
    owners.push({ id: ownerId(), kind: 'org', fam: name, im: '', ot: '', sex: '', born: '', passport: '', inn: uniqueDigits(used.inns, 10, reg2(region)),
      phone: '+7 (495) ' + rng.digits(3) + '-' + rng.digits(2) + '-' + rng.digits(2), addr: a.addr, zip: a.zip, region, scenario: false });
  }
  const persons = owners.filter(o => o.kind === 'person'), orgs = owners.filter(o => o.kind === 'org');

  /* ───────── ВОДИТЕЛЬСКИЕ УДОСТОВЕРЕНИЯ ───────── */
  const licenses = [];
  persons.forEach((o, i) => {
    if (!o.scenario && rng.chance(0.07)) return;               // у ~7% удостоверения нет
    const age = NOW.getFullYear() - parseInt(o.born.slice(-4));
    const issued = new Date(NOW.getFullYear() - rng.int(1, Math.max(2, Math.min(age - 18, 20))), rng.int(0, 11), rng.int(1, 28));
    const expires = addYears(issued, 10);
    let status = rng.weighted([['valid', 91], ['expired', 4], ['deprived', 4], ['suspended', 1]]);
    if (o.scenario) status = 'valid';
    if (status === 'valid' && expires < NOW) status = 'expired';
    const cats = rng.weighted([[['B'], 70], [['B', 'B1'], 14], [['B', 'C'], 7], [['A', 'B'], 6], [['B', 'C', 'D'], 3]]);
    const lic = { id: 'DL-' + pad(licenses.length + 1, 6), ownerId: o.id, number: `${reg2(o.region)} ${pad(rng.int(10, 24), 2)} ${rng.digits(6)}`, categories: cats, issued: fmt(issued), expires: fmt(expires), status };
    if (status === 'deprived') { lic.depriveArticle = rng.pick(['12.8 ч.1', '12.8 ч.3', '12.26 ч.1', '12.15 ч.4']); lic.depriveUntil = fmt(addDays(NOW, rng.int(30, 700))); }
    licenses.push(lic);
  });

  /* ───────── ТРАНСПОРТНЫЕ СРЕДСТВА ───────── */
  const vehicles = [];
  let vehSeq = 0;
  const vehId = () => 'VEH-' + pad(++vehSeq, 6);
  const modelWeights = P.MODELS.map(m => [m, m[7]]);
  const regByOwner = o => o.region;

  function mkVehicle(o, spec = {}) {
    const m = spec.model || rng.weighted(modelWeights);
    const make = spec.make || m[0], model = spec.modelName || m[1], body = spec.body || m[2];
    const year = spec.year || rng.int(Math.max(m[4], 2008), m[5]);
    const colorName = spec.color || rng.weighted(P.COLORS.map(c => [c[0], c[2]]));
    const plateRegion = rng.chance(0.9) ? regByOwner(o) : pickRegion();
    const plate = spec.plate || uniquePlate(plateRegion);
    if (spec.plate) used.plates.add(plate);
    const region = (plate.match(/\d{2,3}$/) || [plateRegion])[0];
    const vin = spec.vin || uniqueVin(m[6], year);
    if (spec.vin) used.vins.add(vin);
    const regDate = new Date(year + (rng.chance(0.7) ? 0 : rng.int(0, 3)), rng.int(0, 11), rng.int(1, 28));
    if (regDate > NOW) regDate.setFullYear(NOW.getFullYear() - 1);
    const osagoStatus = rng.weighted([['valid', 84], ['expired', 11], ['none', 5]]);
    const v = {
      id: vehId(), plate, region, vin, make, model, body, category: m[3], year, color: colorName,
      power: spec.power || rng.pick([82, 90, 106, 110, 122, 136, 150, 170, 190, 249, 300]),
      sts: `${reg2(region)} ${pad(rng.int(10, 99), 2)} ${rng.digits(6)}`, pts: `${reg2(region)} ${rng.pick(P.PLATE_LETTERS)}${rng.pick(P.PLATE_LETTERS)} ${rng.digits(6)}`,
      regDate: fmt(regDate), regStatus: rng.weighted([['registered', 96], ['suspended', 2], ['removed', 2]]), ownerId: o.id,
      osago: osagoStatus === 'none' ? { status: 'none' } : { status: osagoStatus, policy: `ТТТ ${rng.digits(10)}`, insurer: rng.pick(P.INSURERS),
        until: fmt(osagoStatus === 'valid' ? addDays(NOW, rng.int(20, 360)) : addDays(NOW, -rng.int(5, 200))) },
      techInspectionUntil: (NOW.getFullYear() - year >= 4) ? fmt(addDays(NOW, rng.int(-120, 700))) : null,
      wanted: false, restricted: false, scenario: !!spec.scenario,
    };
    if (spec.regStatus) v.regStatus = spec.regStatus;
    if (spec.osagoValid) v.osago = { status: 'valid', policy: `ТТТ ${rng.digits(10)}`, insurer: rng.pick(P.INSURERS), until: fmt(addDays(NOW, rng.int(40, 300))) };
    vehicles.push(v);
    return v;
  }
  /* 1) сценарные ТС с заданными владельцами */
  SEED_VEHICLES.forEach(s => {
    const mm = P.MODELS.find(m => m[1] === s[2].replace('Фокус', 'Focus').replace('Веста', 'Vesta')) || P.MODELS[0];
    mkVehicle(owners[s[7]], { plate: s[0], make: s[1], modelName: s[2], body: s[3], color: s[4], year: s[5], vin: s[6], model: mm, scenario: true, regStatus: 'registered', osagoValid: true });
  });
  /* 2) ТС из розыска (прежний сценарий) */
  const wantedVehicleByPlate = {};
  SEED_WANTED.forEach(w => {
    const owner = rng.pick(persons.filter(p => !p.scenario));
    const modelWord = w[2].split(' ').slice(1).join(' ').replace('Веста', 'Vesta');
    const mkModel = P.MODELS.find(m => m[1] === modelWord) || rng.weighted(modelWeights);
    const existing = vehicles.find(v => v.plate === w[1]);
    if (existing) { wantedVehicleByPlate[w[1]] = existing; return; }
    const v = mkVehicle(owner, { plate: w[1], make: mkModel[0], modelName: mkModel[1], body: mkModel[2], color: w[3], year: w[4], vin: w[5], model: mkModel, scenario: true, osagoValid: true });
    wantedVehicleByPlate[w[1]] = v;
  });
  /* 3) прочие «сценарные» номера прежних пулов */
  SEED_PLATES_EXTRA.forEach(pl => { if (!vehicles.find(v => v.plate === pl)) mkVehicle(rng.pick(persons.filter(p => !p.scenario)), { plate: pl, scenario: true, osagoValid: true, regStatus: 'registered' }); });
  /* 4) основной массив: у каждого физлица ≥1 ТС, остальное — случайно (фургоны/грузовики → чаще организациям) */
  const personQueue = rng.shuffle(persons.filter(p => !vehicles.some(v => v.ownerId === p.id)));
  const TOTAL = 2800;
  while (vehicles.length < TOTAL) {
    const m = rng.weighted(modelWeights);
    const commercial = ['van', 'truck', 'bus', 'pickup'].includes(m[2]);
    let owner;
    if (commercial && rng.chance(0.8)) owner = rng.pick(orgs);
    else if (personQueue.length) owner = personQueue.pop();
    else owner = rng.chance(0.88) ? rng.pick(persons) : rng.pick(orgs);
    mkVehicle(owner, { model: m });
  }
  /* такси и каршеринг: часть белых/жёлтых машин у организаций — для разнообразия */
  const byPlate = new Map(vehicles.map(v => [v.plate, v]));
  const byOwner = new Map(); vehicles.forEach(v => { (byOwner.get(v.ownerId) || byOwner.set(v.ownerId, []).get(v.ownerId)).push(v); });

  /* ───────── РОЗЫСК ───────── */
  const wanted = SEED_WANTED.map(w => {
    const v = byPlate.get(w[1]); v.wanted = (w[9] === 'wanted');
    return { id: w[0], vehicleId: v.id, plate: w[1], brand: w[2], color: w[3], year: w[4], vin: w[5], reason: w[6], dateAdded: w[7], region: w[8], status: w[9], lastSeen: w[10] };
  });
  let wSeq = 98;
  const pool = rng.sample(vehicles.filter(v => !v.scenario), 16);
  pool.forEach(v => {
    const st = rng.weighted([['wanted', 60], ['found', 25], ['closed', 15]]);
    const d = addDays(NOW, -rng.int(2, 160));
    const cam = rng.pick(FVF_MSK.slice(0, 14));
    const reason = rng.pick(P.WANTED_REASONS);
    const seen = st === 'wanted' ? (rng.chance(0.4) ? 'Не обнаружен' : `${cam[1]}, ${fmtT(addDays(d, rng.int(0, 5)))}`) : st === 'found' ? `${cam[1]}, ${fmt(addDays(d, rng.int(1, 6)))} — ОБНАРУЖЕН` : 'Дело закрыто — ложная тревога';
    if (st === 'wanted') v.wanted = true;
    wanted.push({ id: `РОЗ-${reg2(v.region)}-2026-${pad(wSeq++, 5)}`, vehicleId: v.id, plate: v.plate, brand: `${v.make} ${v.model}`, color: v.color, year: v.year, vin: v.vin, reason, dateAdded: fmt(d), region: reg2(v.region), status: st, lastSeen: seen });
  });

  /* ───────── ОГРАНИЧЕНИЯ ───────── */
  const restrictions = [];
  vehicles.filter(v => !v.scenario && !v.wanted).forEach(v => {
    if (!rng.chance(0.045)) return;
    v.restricted = true;
    const authority = rng.pick(['ФССП России', 'ФССП России', 'Суд', 'ГИБДД', 'Таможенная служба']);
    const type = authority === 'Суд' ? 'Арест' : 'Запрет на регистрационные действия';
    const d = addDays(NOW, -rng.int(10, 600));
    restrictions.push({ id: 'ОГР-' + pad(restrictions.length + 1, 6), vehicleId: v.id, plate: v.plate, type, authority,
      basis: authority === 'ФССП России' ? `ИП ${rng.int(100000, 999999)}/${pad(rng.int(22, 26), 2)}/${reg2(v.region)}001-ИП` : `Определение №${rng.int(10, 9999)}/${rng.int(2023, 2026)}`,
      date: fmt(d), status: rng.chance(0.85) ? 'active' : 'lifted' });
  });

  /* ───────── КОМПЛЕКСЫ ФВФ ───────── */
  const fvf = FVF_MSK.map((c, ci) => ({ direction: DIRS[ci % 4], id: c[0], region: '77', district: c[2], addr: c[1], lat: c[8], lon: c[9], type: c[4], model: c[5], modelFull: c[6], poverkaNo: c[7],
    poverkaUntil: '15.12.2026', stc: '7736939186', status: c[3], violations24h: c[10], speedLimit: c[11], lanes: rng.pick([2, 3, 4]), installedAt: fmt(addDays(NOW, -rng.int(400, 2400))) }));
  const OTHER = [['78', 'Санкт-Петербург', 'Московский пр., 100', 59.8700, 30.3200], ['78', 'Санкт-Петербург', 'КАД, 40-й км', 59.9500, 30.7500], ['78', 'Санкт-Петербург', 'Невский пр., 70', 59.9340, 30.3330],
    ['50', 'Московская обл.', 'М-1 «Беларусь», 18-й км', 55.7000, 37.2000], ['50', 'Московская обл.', 'А-107 ММК, 33-й км', 55.9500, 37.6000], ['50', 'Московская обл.', 'Каширское ш., 22-й км', 55.5500, 37.7200],
    ['16', 'Казань', 'ул. Чистопольская, 20', 55.7900, 49.1700], ['16', 'Казань', 'пр. Победы, 130', 55.7500, 49.2000], ['63', 'Самара', 'Московское ш., 35', 53.2200, 50.2400],
    ['52', 'Нижний Новгород', 'пр. Гагарина, 80', 56.2700, 43.9500], ['66', 'Екатеринбург', 'ул. Малышева, 120', 56.8300, 60.6200], ['54', 'Новосибирск', 'Красный пр., 200', 55.0300, 82.9200],
    ['23', 'Краснодар', 'ул. Красная, 180', 45.0400, 38.9800], ['61', 'Ростов-на-Дону', 'пр. Ворошиловский, 85', 47.2400, 39.7100]];
  OTHER.forEach((o, i) => {
    const t = rng.pick(nsi.fvf_types);
    fvf.push({ direction: DIRS[i % 4], id: `CAM-0${o[0].padStart(2, '0')}-${pad(i + 1, 3)}`, region: o[0], district: o[1], addr: o[2], lat: o[3], lon: o[4], type: t.type, model: t.model, modelFull: `${t.model} ${t.type}`,
      poverkaNo: '№' + pad(rng.int(1500, 3999), 7), poverkaUntil: fmt(addDays(NOW, rng.int(30, 360))), stc: '7736939186', status: rng.weighted([['online', 90], ['warning', 7], ['offline', 3]]),
      violations24h: rng.int(40, 480), speedLimit: rng.pick([60, 60, 70, 80, 90]), lanes: rng.pick([2, 3, 4]), installedAt: fmt(addDays(NOW, -rng.int(200, 2000))) });
  });

  /* ───────── ГИС ГМП и ФССП ───────── */
  const charges = [];
  const ownerById = new Map(owners.map(o => [o.id, o]));
  const fineVehicles = vehicles.filter(v => ownerById.get(v.ownerId).kind === 'person');
  for (let i = 0; i < 3200; i++) {
    const v = rng.pick(fineVehicles), vt = rng.weighted(P.KOAP.map((k, j) => [k, [30, 20, 9, 5, 11, 7, 6, 5, 3, 4][j]]));
    const dd = addDays(NOW, -rng.int(1, 150));
    const ageDays = Math.round((NOW - dd) / 86400000);
    let status;
    if (ageDays > 70) status = rng.weighted([['paid_full', 45], ['paid_half', 8], ['unpaid', 4], ['overdue', 43]]);
    else if (ageDays > 20) status = rng.weighted([['paid_full', 40], ['paid_half', 12], ['unpaid', 40], ['overdue', 8]]);
    else status = rng.weighted([['paid_full', 20], ['paid_half', 30], ['unpaid', 50]]);
    const uin = '18810' + String(77) + rng.digits(13);
    const paidAt = status.startsWith('paid') ? fmt(addDays(dd, status === 'paid_half' ? rng.int(1, 19) : rng.int(5, 55))) : null;
    charges.push({ uin, decisionNo: `ПОСТ-77-2026-${pad(10000 + i, 5)}`, date: fmt(dd), ownerId: v.ownerId, vehicleId: v.id, plate: v.plate, article: vt.code, amount: vt.fine,
      amountDue: status === 'paid_half' ? Math.round(vt.fine / 2) : status === 'overdue' ? vt.fine * 2 : vt.fine, status, paidAt, payDeadline: fmt(addDays(dd, 60)) });
  }
  const fssp = [];
  charges.filter(c => c.status === 'overdue' && (NOW - new Date(c.date.split('.').reverse().join('-'))) / 86400000 > 70 && rng.chance(0.55)).slice(0, 260).forEach(c => {
    const st = rng.weighted([['Возбуждено', 30], ['Запрос в банки', 20], ['Арест счёта', 20], ['Арест имущества', 8], ['Взыскание', 12], ['Завершено', 10]]);
    fssp.push({ ipNo: `${rng.int(100000, 999999)}/26/77001-ИП`, ownerId: c.ownerId, plate: c.plate, uin: c.uin, debt: c.amountDue, stage: st, bailiff: rng.pick(P.BAILIFFS), started: fmt(addDays(NOW, -rng.int(5, 90))) });
  });

  /* ───────── БАЗА ФИКСАЦИЙ (снимки) ───────── */
  const fixations = [];
  const cams = fvf.filter(c => c.region === '77' && c.status !== 'offline');
  const fixVeh = [...vehicles.filter(v => v.scenario), ...rng.sample(fineVehicles.filter(v => !v.scenario), 400)];
  const ocrConfuse = { 'В': 'Е', 'Е': 'В', 'К': 'Х', 'Х': 'К', 'М': 'Н', 'Н': 'М', 'О': 'С', 'С': 'О', 'Р': 'В', 'Т': 'Н', 'А': 'Е', 'У': 'Х', '8': '3', '0': '8', '5': '6', '1': '7', '3': '8', '6': '5', '7': '1' };
  const TOTAL_FIX = 320;
  for (let i = 0; i < TOTAL_FIX; i++) {
    const v = i < fixVeh.length && i < 60 ? fixVeh[i] : rng.pick(fixVeh);
    const vt = rng.weighted(P.KOAP.map((k, j) => [k, [30, 20, 9, 5, 11, 7, 6, 5, 3, 4][j]]));
    const cam = rng.pick(cams);
    const light = rng.weighted([['day', 52], ['dusk', 14], ['night', 22], ['dawn', 12]]);
    const weather = rng.weighted([['clear', 52], ['overcast', 22], ['rain', 14], ['fog', 6], ['snow', 6]]);
    let plateCond = rng.weighted([['clean', 62], ['dirty', 16], ['snow', 4], ['faded', 8], ['angled', 10]]);
    if (plateCond === 'snow' && weather !== 'snow') plateCond = 'dirty';
    if (weather === 'snow' && plateCond === 'clean' && rng.chance(.3)) plateCond = 'snow';
    let conf = 99 - rng.int(0, 6);
    if (light === 'night') conf -= rng.int(2, 12);
    if (weather === 'rain' || weather === 'fog' || weather === 'snow') conf -= rng.int(4, 16);
    if (plateCond === 'dirty') conf -= rng.int(15, 35); if (plateCond === 'snow') conf -= rng.int(20, 40); if (plateCond === 'faded') conf -= rng.int(8, 22); if (plateCond === 'angled') conf -= rng.int(6, 18);
    conf = Math.max(31, Math.min(99, conf));
    let ocrPlate = v.plate;
    if (conf < 80 && rng.chance(0.82)) {      // OCR ошибается преимущественно при низкой уверенности
      const idx = []; const regionStart = v.plate.search(/\d{2,3}$/); for (let k = 0; k < regionStart; k++) if (ocrConfuse[v.plate[k]]) idx.push(k);
      if (idx.length) { const k = rng.pick(idx); ocrPlate = v.plate.slice(0, k) + ocrConfuse[v.plate[k]] + v.plate.slice(k + 1); }
    }
    const limit = cam.speedLimit;
    const speed = vt.speed ? limit + rng.int(vt.over[0], Math.min(vt.over[1], vt.over[0] + 25)) : 0;
    fixations.push({ id: 'FIX-' + pad(i + 1, 5), file: `assets/snapshots/FIX-${pad(i + 1, 5)}.svg`, vehicleId: v.id, plate: v.plate, ocrPlate, ocrConf: conf,
      camId: cam.id, article: vt.code, speed, limit: vt.speed ? limit : 0, lane: rng.int(1, Math.min(cam.lanes, 4)),
      scene: { light, weather, plateCond, road: rng.pick(['city', 'city', 'highway', 'tunnel', 'bridge']), distance: rng.int(14, 38), seed: rng.int(1, 1e9) } });
  }

  const meta = (name, desc) => ({ name, description: desc, generatedBy: 'tools/build.js', seed, synthetic: true, generatedAt: '27.10.2026' });
  return {
    nsi: { meta: meta('НСИ', 'Нормативно-справочная информация: регионы, статьи КоАП, марки/модели, цвета, типы комплексов ФВФ'), tables: nsi },
    fis_gibdd_m: { meta: meta('ФИС ГИБДД-М', 'Федеральная информационная система ГИБДД (учебная копия): владельцы, водительские удостоверения, транспортные средства, розыск, ограничения'),
      tables: { owners, licenses, vehicles, wanted, restrictions } },
    fvf_complexes: { meta: meta('Комплексы ФВФ', 'Реестр комплексов фото-видеофиксации (камер) с поверкой и статусом'), tables: { complexes: fvf } },
    gis_gmp: { meta: meta('ГИС ГМП', 'Начисления и платежи по штрафам (учебная копия)'), tables: { charges } },
    fssp: { meta: meta('ФССП', 'Исполнительные производства по неоплаченным штрафам (учебная копия)'), tables: { proceedings: fssp } },
    fixations: { meta: meta('База фиксаций', 'Каталог синтетических снимков фиксации нарушений с параметрами сцены и результатом OCR'), tables: { fixations } },
  };
}

module.exports = { build, NOW, fmt };
