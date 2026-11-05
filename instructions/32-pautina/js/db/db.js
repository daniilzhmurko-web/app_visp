/* ═══════════════════════════════════════════════════════════════════════
   CAFAP_DB — слой доступа к учебным базам данных (файлы data/*.js).
   Базы СИНТЕТИЧЕСКИЕ: все персоны, номера и документы вымышлены.
   Файлы данных вызывают CAFAP_DB.register(имя, {meta, tables}); сайт работает
   без сервера (в том числе при открытии index.html двойным щелчком, file://).
   ═══════════════════════════════════════════════════════════════════════ */
/* Доля реальных фото в очереди этапа 2, если они импортированы (0…1) */
var CAFAP_REAL_SHARE = 0.5;

var CAFAP_DB = (function () {
  'use strict';
  const dbs = {};
  const cache = {};          // индексы, строятся лениво
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = rnd(i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };

  /* Латиница, похожая на кириллицу в номерах → кириллица; пробелы и знаки убираются */
  const LAT2CYR = { A: 'А', B: 'В', E: 'Е', K: 'К', M: 'М', H: 'Н', O: 'О', P: 'Р', C: 'С', T: 'Т', Y: 'У', X: 'Х' };
  function normPlate(p) {
    return String(p || '').toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/g, '').replace(/[A-Z]/g, c => LAT2CYR[c] || c);
  }
  const normText = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();

  /* Пользовательские (реальные) фото: база «photos» (data/photos.js, создаётся tools/import-photos.js)
     дополняет таблицы ФИС и фиксаций. Базовые данные не изменяются. */
  const EXTRA = { fis_gibdd_m: ['owners', 'vehicles'], fixations: ['fixations'] };
  function table(db, t) {
    const d = dbs[db]; if (!d) throw new Error('База не загружена: ' + db);
    const rows = d.tables[t]; if (!rows) throw new Error('Нет таблицы ' + db + '.' + t);
    const ph = dbs.photos;
    if (ph && EXTRA[db] && EXTRA[db].indexOf(t) >= 0 && ph.tables[t] && ph.tables[t].length) {
      const key = 'merged:' + db + '.' + t;
      return cache[key] || (cache[key] = rows.concat(ph.tables[t]));
    }
    return rows;
  }
  function idx(key, build) { return cache[key] || (cache[key] = build()); }

  /* ───────── ФИС ГИБДД-М ───────── */
  const fis = {
    table: t => table('fis_gibdd_m', t),
    get ready() { return !!dbs.fis_gibdd_m; },
    normPlate,
    vehByPlate() { return idx('vehByPlate', () => new Map(this.table('vehicles').map(v => [v.plate, v]))); },
    vehByVin() { return idx('vehByVin', () => new Map(this.table('vehicles').map(v => [v.vin, v]))); },
    ownerById() { return idx('ownerById', () => new Map(this.table('owners').map(o => [o.id, o]))); },
    licByOwner() { return idx('licByOwner', () => new Map(this.table('licenses').map(l => [l.ownerId, l]))); },
    wantedByVeh() { return idx('wantedByVeh', () => { const m = new Map(); this.table('wanted').forEach(w => m.set(w.vehicleId, w)); return m; }); },
    restrByVeh() { return idx('restrByVeh', () => { const m = new Map(); this.table('restrictions').forEach(r => { (m.get(r.vehicleId) || m.set(r.vehicleId, []).get(r.vehicleId)).push(r); }); return m; }); },
    vehByOwner() { return idx('vehByOwner', () => { const m = new Map(); this.table('vehicles').forEach(v => { (m.get(v.ownerId) || m.set(v.ownerId, []).get(v.ownerId)).push(v); }); return m; }); },

    /* Полная карточка по номеру: {vehicle, owner, license, wanted, restrictions, ownerVehicles} или null */
    lookup(plate) {
      const v = this.vehByPlate().get(normPlate(plate)); if (!v) return null;
      return this.card(v);
    },
    card(v) {
      const owner = this.ownerById().get(v.ownerId) || null;
      const wanted = this.wantedByVeh().get(v.id) || null;
      return {
        vehicle: v, owner,
        license: owner ? (this.licByOwner().get(owner.id) || null) : null,
        wanted: wanted && wanted.status === 'wanted' ? wanted : null,
        wantedHistory: wanted,
        restrictions: (this.restrByVeh().get(v.id) || []).filter(r => r.status === 'active'),
        ownerVehicles: owner ? (this.vehByOwner().get(owner.id) || []) : [],
      };
    },
    /* Поиск для запроса «ФИС ГИБДД-М»: по номеру, VIN, ФИО, паспорту, ИНН. Возвращает массив карточек (до 25). */
    search(q) {
      q = q || {};
      const out = [];
      const add = v => { if (v && !out.some(c => c.vehicle.id === v.id) && out.length < 25) out.push(this.card(v)); };
      if (q.plate) { const p = normPlate(q.plate); const v = this.vehByPlate().get(p); if (v) add(v); else if (p.length >= 3) this.table('vehicles').some(x => { if (x.plate.startsWith(p) || x.plate.includes(p)) add(x); return out.length >= 25; }); }
      if (q.vin) { const vin = String(q.vin).toUpperCase().replace(/\s/g, ''); const v = this.vehByVin().get(vin); if (v) add(v); else if (vin.length >= 6) this.table('vehicles').some(x => { if (x.vin.includes(vin)) add(x); return out.length >= 25; }); }
      const text = normText(q.fio);
      if (text.length >= 3) {
        this.table('owners').some(o => {
          if (normText(`${o.fam} ${o.im} ${o.ot}`).includes(text)) (this.vehByOwner().get(o.id) || []).forEach(add);
          return out.length >= 25;
        });
      }
      if (q.passport) { const p = String(q.passport).replace(/\D/g, ''); if (p.length >= 4) this.table('owners').some(o => { if (o.passport.replace(/\D/g, '').includes(p)) (this.vehByOwner().get(o.id) || []).forEach(add); return out.length >= 25; }); }
      if (q.inn) { const p = String(q.inn).replace(/\D/g, ''); if (p.length >= 6) this.table('owners').some(o => { if (o.inn.includes(p)) (this.vehByOwner().get(o.id) || []).forEach(add); return out.length >= 25; }); }
      return out;
    },
    /* "Фамилия И.О." */
    shortName(o) { return o ? (o.kind === 'org' ? o.fam : `${o.fam} ${o.im[0]}.${o.ot ? o.ot[0] + '.' : ''}`) : '—'; },
    fullName(o) { return o ? (o.kind === 'org' ? o.fam : `${o.fam} ${o.im} ${o.ot}`) : '—'; },
    vehicleLabel(v) { return `${v.make} ${v.model}`; },

    /* Адаптеры под формат данных, который используют этапы тренажёра */
    simOwner(o) { return { fam: o.fam, im: o.im, ot: o.ot, born: o.born, pass: o.passport, inn: o.inn, addr: o.addr, zip: o.zip, reg: o.region, id: o.id }; },
    simVehicle(v) { return { brand: v.make, model: v.model, color: v.color, year: v.year, vin: v.vin, body: v.body, plate: v.plate, id: v.id }; },

    /* Пул ТС (только физлица) для генераторов этапов; сценарные номера гарантированно присутствуют */
    personVehicles() { return idx('personVehicles', () => this.table('vehicles').filter(v => { const o = this.ownerById().get(v.ownerId); return o && o.kind === 'person'; })); },
    scenarioVehicles() { return this.personVehicles().filter(v => v.scenario); },
    /* n записей {vehicle, owner}: каждый сценарный номер встречается >=3 раз, остальное — случайные (частично повторяющиеся нарушители) */
    violationPool(n, perScenario) {
      perScenario = perScenario == null ? 3 : perScenario;
      const out = [];
      this.scenarioVehicles().forEach(v => { for (let i = 0; i < perScenario && out.length < n; i++) out.push(v); });
      const all = this.personVehicles();
      const frequent = all.slice(0, 260);
      while (out.length < n) out.push(Math.random() < .5 ? pick(frequent) : pick(all));
      return shuffle(out).map(v => ({ vehicle: v, owner: this.ownerById().get(v.ownerId) }));
    },
    /* Розыск в формате этапа 5 */
    wantedRegistry() { return this.table('wanted').map(w => Object.assign({}, w)); },
    stats() {
      return {
        vehicles: this.table('vehicles').length, owners: this.table('owners').length, licenses: this.table('licenses').length,
        wanted: this.table('wanted').filter(w => w.status === 'wanted').length, restrictions: this.table('restrictions').filter(r => r.status === 'active').length,
      };
    },
  };

  /* ───────── Комплексы ФВФ ───────── */
  const fvf = {
    all() { return table('fvf_complexes', 'complexes'); },
    get(id) { return idx('fvfById', () => new Map(this.all().map(c => [c.id, c]))).get(id); },
    region(code) { return this.all().filter(c => c.region === String(code)); },
  };

  /* ───────── База фиксаций (снимки) ───────── */
  const fixations = {
    all() { return table('fixations', 'fixations'); },
    get(id) { return idx('fixById', () => new Map(this.all().map(f => [f.id, f]))).get(id); },
    /* n случайных записей (с повторами, если n больше размера базы), с присоединённым ТС и комплексом */
    sample(n) {
      const all = this.all();
      const real = all.filter(f => f.real), synth = all.filter(f => !f.real);
      const take = (src, k) => { let pool = shuffle(src), out = []; while (out.length < k && src.length) { out = out.concat(pool.slice(0, k - out.length)); if (out.length < k) pool = shuffle(src); } return out; };
      /* если импортированы реальные фото — их доля в очереди задаётся CAFAP_REAL_SHARE (по умолчанию 50%) */
      const nReal = real.length ? Math.round(n * (typeof CAFAP_REAL_SHARE === 'number' ? CAFAP_REAL_SHARE : .5)) : 0;
      const chosen = shuffle(take(real, nReal).concat(take(synth, n - nReal)));
      return chosen.map(f => ({ fix: f, vehicle: fis.vehByPlate().get(f.plate), cam: fvf.get(f.camId) }));
    },
  };

  /* ───────── ГИС ГМП / ФССП ───────── */
  const gmp = {
    charges() { return table('gis_gmp', 'charges'); },
    byPlate(p) { p = normPlate(p); return this.charges().filter(c => c.plate === p); },
    byUin(u) { return this.charges().find(c => c.uin === u) || null; },
  };
  const fssp = {
    proceedings() { return table('fssp', 'proceedings'); },
    byPlate(p) { p = normPlate(p); return this.proceedings().filter(x => x.plate === p); },
  };
  const nsi = {
    table: t => table('nsi', t),
    colorHex(name) { const c = table('nsi', 'colors').find(x => x.name === name); return c ? c.hex : '#9aa0a8'; },
    article(code) { return table('nsi', 'koap_articles').find(a => a.code === code) || null; },
  };

  return {
    register(name, data) { dbs[name] = data; Object.keys(cache).forEach(k => delete cache[k]); },
    has(name) { return !!dbs[name]; },
    names() { return Object.keys(dbs); },
    meta(name) { return dbs[name] ? dbs[name].meta : null; },
    tables(name) { return dbs[name] ? Object.keys(dbs[name].tables) : []; },
    rows(name, t) { return table(name, t); },
    normPlate, normText, fis, fvf, fixations, gmp, fssp, nsi,
  };
})();
if (typeof window !== 'undefined') window.CAFAP_DB = CAFAP_DB;
