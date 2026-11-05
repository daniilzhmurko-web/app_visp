/* КСЕНОН-2 · DNA Ecosystem Engine (JavaScript)
   Порт Python-движка dna_engine.py: нормализация частот, RMP (NRC II), генерация индивидов, семей, смесей,
   частичных профилей, эталонные наборы, проверка целостности, импорт популяций из CSV.
   Данные читает из KX2.ECO (data/ecosystem/*.js). Без внешних зависимостей. Все данные учебные. */
(function (root) {
  'use strict';
  var SEX = 'AMEL';
  var DEFAULTS = { default_min_frequency: 0.00241, use_5_2N_rule: true, sample_size_N: 1036, theta_correction: 0.01, kinship_mutation_rate: 0.002, random_seed: 20261022 };
  var ORDER = ['nist_1036', 'fbi_2015', 'uk_dna17', 'russian_15', 'user_pops'];
  var cache = {}, aliasMap = null;

  function eco() { return (root.KX2 && root.KX2.ECO) || null; }
  function ls(k) { try { return JSON.parse(root.localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function lsSet(k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function num(a) { var s = String(a); return /^\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null; }
  function cmp(a, b) { var x = num(a), y = num(b); if (x !== null && y !== null) return x - y; if (x !== null) return -1; if (y !== null) return 1; return String(a) < String(b) ? -1 : 1; }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function pickOf(r, a) { return a[Math.floor(r() * a.length)]; }

  var K = { available: function () { var e = eco(); return !!(e && e.loci && e.kits && e.populations); }, rng: rng, cmpAllele: cmp, SEX: SEX };

  /* ---------- конфигурация (можно менять в «Параметры расчёта») ---------- */
  K.defaults = DEFAULTS;
  K.config = function () { var e = eco(); return Object.assign({}, DEFAULTS, (e && e.config) || {}, ls('kx2_ecocfg') || {}); };
  K.setConfig = function (patch) { var o = Object.assign(ls('kx2_ecocfg') || {}, patch); lsSet('kx2_ecocfg', o); cache = {}; };
  K.resetConfig = function () { try { root.localStorage.removeItem('kx2_ecocfg'); } catch (e) {} cache = {}; };

  /* ---------- локусы и наборы ---------- */
  K.loci = function () { return (eco() || {}).loci || {}; };
  K.kits = function () { return (eco() || {}).kits || {}; };
  K.canon = function (l) {
    if (!aliasMap) {
      aliasMap = {};
      var L = K.loci();
      Object.keys(L).forEach(function (n) {
        aliasMap[key(n)] = n;
        (L[n].aliases || []).forEach(function (a) { aliasMap[key(a)] = n; });
      });
    }
    return aliasMap[key(l)] || l;
  };
  function key(s) { return String(s).toLowerCase().replace(/[ _]/g, ''); }
  K.kitLoci = function (kit, autosomalOnly) {
    var L = K.loci(), out = (K.kits()[kit] || []).map(K.canon);
    return autosomalOnly ? out.filter(function (l) { return L[l] && L[l].type === 'autosomal'; }) : out;
  };

  /* ---------- популяции ---------- */
  function userPops() { return ls('kx2_userpops') || {}; }
  K.dataset = function (id) {
    var base = ((eco() || {}).populations || {})[id], usr = userPops()[id];
    if (!base && !usr) return null;
    var meta = Object.assign({}, (base && base.meta) || { label: id === 'user_pops' ? 'Пользовательские (импорт CSV)' : id });
    var pops = Object.assign({}, (base && base.populations) || {}), labels = Object.assign({}, meta.population_labels || {}), nmap = Object.assign({}, meta.sample_size_by_population || {});
    Object.keys(usr || {}).forEach(function (p) { pops[p] = usr[p].loci; labels[p] = usr[p].label || p; nmap[p] = usr[p].N; });
    meta.population_labels = labels; meta.sample_size_by_population = nmap;
    if (Object.keys(pops).length) delete meta.status;
    return { id: id, meta: meta, populations: pops };
  };
  K.datasetIds = function () {
    var ids = Object.keys((eco() || {}).populations || {});
    Object.keys(userPops()).forEach(function (i) { if (ids.indexOf(i) < 0) ids.push(i); });
    return ids.sort(function (a, b) { var x = ORDER.indexOf(a), y = ORDER.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); });
  };
  K.ready = function (id) { var d = K.dataset(id); return !!d && d.meta.status !== 'pending' && Object.keys(d.populations).length > 0; };
  K.populations = function (id) {
    var d = K.dataset(id); if (!d || d.meta.status === 'pending') return [];
    return Object.keys(d.populations).sort(function (a, b) { var x = /Caucasian|White/.test(a) ? 0 : 1, y = /Caucasian|White/.test(b) ? 0 : 1; return x - y; });
  };
  K.datasetLabel = function (id) { var d = K.dataset(id); return d ? (d.meta.label || id) : id; };
  K.popLabel = function (id, pop) { var d = K.dataset(id); return (d && d.meta.population_labels && d.meta.population_labels[pop]) || pop; };
  K.popN = function (id, pop) { var d = K.dataset(id); return (d && d.meta.sample_size_by_population && d.meta.sample_size_by_population[pop]) || K.config().sample_size_N; };
  K.minFreq = function (id, pop) { var c = K.config(); return c.use_5_2N_rule ? 5 / (2 * K.popN(id, pop)) : c.default_min_frequency; };

  K.floorNormalize = function (freqs, pmin) {
    var p = {}, tot = 0, a;
    for (a in freqs) if (freqs[a] > 0) { p[a] = +freqs[a]; tot += +freqs[a]; }
    for (a in p) p[a] /= tot;
    var floored = {}, nf = 0, keys = Object.keys(p);
    for (;;) {
      var free = keys.filter(function (x) { return !floored[x]; });
      if (!free.length || nf * pmin >= 1) { var u = {}; keys.forEach(function (x) { u[x] = 1 / keys.length; }); return u; }
      var sum = 0; free.forEach(function (x) { sum += p[x]; });
      var scale = (1 - nf * pmin) / sum, added = free.filter(function (x) { return p[x] * scale < pmin; });
      if (!added.length) { var out = {}; keys.forEach(function (x) { out[x] = floored[x] ? pmin : p[x] * scale; }); return out; }
      added.forEach(function (x) { floored[x] = 1; nf++; });
    }
  };
  K.normalize = function (id, pop) {
    var c = K.config(), ck = [id, pop, c.use_5_2N_rule, c.default_min_frequency, c.sample_size_N].join('|');
    if (cache[ck]) return cache[ck];
    var d = K.dataset(id); if (!d || !d.populations[pop]) throw new Error('Нет популяции ' + id + '/' + pop);
    var pmin = K.minFreq(id, pop), loci = {};
    Object.keys(d.populations[pop]).forEach(function (l) {
      var fl = K.floorNormalize(d.populations[pop][l], pmin), o = {};
      Object.keys(fl).sort(cmp).forEach(function (a) { o[a] = fl[a]; });
      loci[K.canon(l)] = o;
    });
    return (cache[ck] = { dataset: id, population: pop, N: K.popN(id, pop), min_freq: pmin, loci: loci });
  };

  /* ---------- вероятности ---------- */
  K.alleleFreq = function (l, a, norm) { var f = norm.loci[K.canon(l)]; return f && f[String(a)] !== undefined ? f[String(a)] : norm.min_freq; };
  K.genotypeFreq = function (l, a, b, norm, theta) {
    var th = theta === undefined ? K.config().theta_correction : theta, pa = K.alleleFreq(l, a, norm), pb = K.alleleFreq(l, b, norm);
    return String(a) === String(b) ? pa * pa + pa * (1 - pa) * th : 2 * pa * pb;
  };
  K.rmp = function (profile, norm, theta) {
    var L = K.loci(), r = 1, used = 0, missing = [];
    Object.keys(profile).forEach(function (l0) {
      var l = K.canon(l0), al = profile[l0];
      if (!L[l] || L[l].type !== 'autosomal' || !al || !al.length) return;
      if (!norm.loci[l]) { missing.push(l); return; }
      r *= K.genotypeFreq(l, al[0], al.length > 1 ? al[1] : al[0], norm, theta); used++;
    });
    return { rmp: used ? r : null, used: used, missing: missing };
  };
  K.log10 = function (x) { return Math.log(x) / Math.LN10; };

  /* ---------- генерация ---------- */
  function usable(kit, norm) { return K.kitLoci(kit, true).filter(function (l) { return norm.loci[l]; }); }
  function sampler(norm, l) {
    norm._cdf = norm._cdf || {};
    if (!norm._cdf[l]) { var al = Object.keys(norm.loci[l]), acc = 0, cum = al.map(function (a) { acc += norm.loci[l][a]; return acc; }); norm._cdf[l] = { al: al, cum: cum }; }
    return norm._cdf[l];
  }
  K.sampleAllele = function (norm, l, r) {
    var s = sampler(norm, l), x = r() * s.cum[s.cum.length - 1], lo = 0, hi = s.cum.length - 1;
    while (lo < hi) { var m = (lo + hi) >> 1; if (s.cum[m] >= x) hi = m; else lo = m + 1; }
    return s.al[lo];
  };
  K.generateIndividual = function (kit, norm, r, sex) {
    sex = sex || (r() < 0.5 ? 'M' : 'F');
    var g = {};
    usable(kit, norm).forEach(function (l) { g[l] = [K.sampleAllele(norm, l, r), K.sampleAllele(norm, l, r)].sort(cmp); });
    if (K.kitLoci(kit).indexOf(SEX) >= 0) g[SEX] = sex === 'M' ? ['X', 'Y'] : ['X', 'X'];
    return { sex: sex, genotypes: g };
  };
  K.mutate = function (a, r) { var x = num(a); if (x === null) return a; var v = Math.round(Math.max(1, x + (r() < 0.5 ? -1 : 1)) * 10) / 10; return String(v); };
  K.generateFamily = function (kit, norm, r, nChildren, mu) {
    mu = mu === undefined ? K.config().kinship_mutation_rate : mu;
    var fa = K.generateIndividual(kit, norm, r, 'M'), mo = K.generateIndividual(kit, norm, r, 'F'), kids = [], muts = 0, hasSex = K.kitLoci(kit).indexOf(SEX) >= 0;
    function tr(par, l) { var a = pickOf(r, par[l]); if (r() < mu) { muts++; return K.mutate(a, r); } return a; }
    for (var i = 0; i < nChildren; i++) {
      var sex = r() < 0.5 ? 'M' : 'F', g = {};
      usable(kit, norm).forEach(function (l) { g[l] = [tr(fa.genotypes, l), tr(mo.genotypes, l)].sort(cmp); });
      if (hasSex) g[SEX] = sex === 'M' ? ['X', 'Y'] : ['X', 'X'];
      kids.push({ sex: sex, genotypes: g });
    }
    return { father: fa, mother: mo, children: kids, mutations: muts };
  };
  K.generateMixture = function (contribs, ratios, r, dropout) {
    var tot = ratios.reduce(function (a, b) { return a + b; }, 0), shares = ratios.map(function (x) { return x / tot; }), observed = {}, truth = {}, dropped = 0, drops = [];
    Object.keys(contribs[0].genotypes).filter(function (l) { return l !== SEX; }).forEach(function (l) {
      var union = {};
      contribs.forEach(function (c, i) { c.genotypes[l].forEach(function (a) { union[a] = union[a] || []; if (union[a].indexOf(i) < 0) union[a].push(i); }); });
      truth[l] = Object.keys(union).sort(cmp); var keep = [];
      truth[l].forEach(function (a) {
        var sh = union[a].reduce(function (s, i) { return s + shares[i]; }, 0), p = dropout === false ? 0 : 0.5 * Math.exp(-12 * sh);
        if (r() < p) { dropped++; drops.push(l + ' ' + a); } else keep.push(a);
      });
      observed[l] = keep.sort(cmp);
    });
    return { observed: observed, truth: truth, dropped: dropped, drops: drops, shares: shares };
  };
  K.makePartial = function (g, k, r) {
    var loci = Object.keys(g).filter(function (l) { return l !== SEX; }), miss = {};
    while (Object.keys(miss).length < Math.min(k, loci.length)) miss[pickOf(r, loci)] = 1;
    var out = {}; Object.keys(g).forEach(function (l) { if (!miss[l]) out[l] = g[l]; });
    return { genotypes: out, missing: Object.keys(miss).sort() };
  };
  K.ibs = function (ga, gb) {
    var tot = 0, zero = 0, n = 0;
    Object.keys(ga).forEach(function (l) {
      if (l === SEX || !gb[l]) return;
      var a = ga[l], b = gb[l].slice(), sh = 0;
      a.forEach(function (x) { var i = b.indexOf(x); if (i >= 0) { sh++; b.splice(i, 1); } });
      tot += sh; zero += sh === 0 ? 1 : 0; n++;
    });
    return { mean: n ? tot / n : 0, zero: zero, loci: n };
  };
  /* проверка наследования: по локусам, где у ребёнка нет аллеля отца/матери */
  K.mendelCheck = function (fam) {
    var res = [];
    fam.children.forEach(function (c, i) {
      var bad = [];
      Object.keys(c.genotypes).forEach(function (l) {
        if (l === SEX) return;
        var f = fam.father.genotypes[l], m = fam.mother.genotypes[l], g = c.genotypes[l];
        var okF = g.some(function (a) { return f.indexOf(a) >= 0; }), okM = g.some(function (a) { return m.indexOf(a) >= 0; });
        // допустимо: один аллель от отца, другой от матери (двудольное сопоставление)
        var ok = (f.indexOf(g[0]) >= 0 && m.indexOf(g[1]) >= 0) || (f.indexOf(g[1]) >= 0 && m.indexOf(g[0]) >= 0);
        if (!ok) bad.push({ locus: l, child: g.join('/'), father: f.join('/'), mother: m.join('/'), fatherOk: okF, motherOk: okM });
      });
      res.push({ child: i + 1, violations: bad });
    });
    return res;
  };

  /* ---------- сравнение для эталонных наборов ---------- */
  K.comparePair = function (A, B, opt) {
    var common = 0, mism = [];
    Object.keys(A).forEach(function (l) {
      if (l === SEX || !B[l]) return; common++;
      if (A[l].join('/') !== B[l].join('/')) mism.push(l);
    });
    var tol = opt.tolerance || 0;
    return { match: common >= (opt.minCommon || 1) && mism.length <= tol, common: common, mismatches: mism };
  };
  K.compareMixture = function (mixObs, ref, opt) {
    var tested = 0, miss = [];
    Object.keys(ref).forEach(function (l) {
      if (l === SEX || !mixObs[l]) return; tested++;
      if (!ref[l].every(function (a) { return mixObs[l].indexOf(a) >= 0; })) miss.push(l);
    });
    return { match: tested >= (opt.minCommon || 1) && miss.length <= (opt.tolerance || 0), common: tested, mismatches: miss };
  };
  K.buildBenchmarks = function (o) {
    o = o || {};
    var n = o.n || 150, ds = o.dataset || 'nist_1036', pop = o.population || 'US_Caucasian', kit = o.kit || 'CODIS_20', r = rng(o.seed === undefined ? K.config().random_seed : o.seed), norm = K.normalize(ds, pop);
    function nonMatch(a) {
      var kind = pickOf(r, ['unrelated', 'unrelated', 'sibling', 'parent_child']);
      if (kind === 'unrelated') return { kind: kind, p: K.generateIndividual(kit, norm, r) };
      var partner = K.generateIndividual(kit, norm, r), g = {};
      usable(kit, norm).forEach(function (l) { g[l] = [pickOf(r, a.genotypes[l]), pickOf(r, partner.genotypes[l])].sort(cmp); });
      return { kind: kind, p: { sex: 'M', genotypes: g } };
    }
    var full = [], part = [], mix = [];
    ['match', 'nonmatch'].forEach(function (label) {
      for (var i = 0; i < n; i++) {
        var a = K.generateIndividual(kit, norm, r), b = a, sub = 'same_person';
        if (label === 'nonmatch') { var nm = nonMatch(a); b = nm.p; sub = nm.kind; }
        var id = (label === 'match' ? 'M' : 'N') + String(i + 1).padStart(3, '0');
        full.push({ id: 'F_' + id, label: label, subtype: sub, A: a.genotypes, B: b.genotypes });
        var pb = K.makePartial(b.genotypes, 4 + Math.floor(r() * 7), r);
        part.push({ id: 'P_' + id, label: label, subtype: sub, A: a.genotypes, B: pb.genotypes, missing: pb.missing });
      }
    });
    ['match', 'nonmatch'].forEach(function (label) {
      for (var i = 0; i < n; i++) {
        var nc = pickOf(r, [2, 2, 3]), ratio = pickOf(r, nc === 2 ? [[1, 1], [3, 1], [9, 1]] : [[1, 1, 1], [4, 2, 1]]), cs = [];
        for (var k = 0; k < nc; k++) cs.push(K.generateIndividual(kit, norm, r));
        var m = K.generateMixture(cs, ratio, r), ref = label === 'match' ? cs[Math.floor(r() * nc)] : K.generateIndividual(kit, norm, r);
        mix.push({ id: 'X_' + (label === 'match' ? 'M' : 'N') + String(i + 1).padStart(3, '0'), label: label, subtype: label === 'match' ? 'contributor' : 'non_contributor', ratio: ratio.join(':'), mixture: m.observed, truth: m.truth, dropped: m.dropped, drops: m.drops, reference: ref.genotypes, contributors: cs.map(function (c) { return c.genotypes; }) });
      }
    });
    return { meta: { dataset: ds, population: pop, kit: kit, seed: o.seed === undefined ? K.config().random_seed : o.seed, synthetic: true }, full: full, partial: part, mixtures: mix };
  };

  /* ---------- проверка целостности ---------- */
  K.validate = function () {
    var out = [], L = K.loci(), kits = K.kits(), stat = { loci: Object.keys(L).length, kits: Object.keys(kits).length, populations: 0, loci_checked: 0 };
    if (!K.available()) return { problems: ['Данные экосистемы не загружены (data/ecosystem/*.js)'], stat: stat };
    Object.keys(kits).forEach(function (k) { kits[k].forEach(function (l) { if (!L[K.canon(l)]) out.push('Набор ' + k + ': неизвестный локус ' + l); }); });
    K.datasetIds().forEach(function (id) {
      K.populations(id).forEach(function (p) {
        stat.populations++;
        var n = K.normalize(id, p);
        Object.keys(n.loci).forEach(function (l) {
          stat.loci_checked++;
          var s = 0, mn = 1; Object.keys(n.loci[l]).forEach(function (a) { s += n.loci[l][a]; mn = Math.min(mn, n.loci[l][a]); });
          if (Math.abs(s - 1) > 1e-9) out.push(id + '/' + p + '/' + l + ': сумма частот ' + s);
          if (mn < n.min_freq - 1e-12) out.push(id + '/' + p + '/' + l + ': аллель ниже p_min');
          if (!L[l]) out.push(id + '/' + p + ': локус ' + l + ' отсутствует в справочнике');
        });
      });
    });
    return { problems: out, stat: stat };
  };

  /* ---------- импорт популяции из CSV ---------- */
  K.parsePopulationCSV = function (text) {
    var errs = [], lines = String(text).replace(/^\ufeff/, '').replace(/\r/g, '').split('\n').filter(function (x) { return x.trim(); });
    if (lines.length < 2) return { ok: false, errors: ['Файл пуст'] };
    var sep = lines[0].indexOf(';') >= 0 && lines[0].indexOf(',') < 0 ? ';' : lines[0].indexOf('\t') >= 0 ? '\t' : ',';
    var head = lines[0].split(sep).map(function (h) { return h.trim().toLowerCase(); }), il = head.indexOf('locus'), ia = head.indexOf('allele'), ifq = head.indexOf('frequency'), ic = head.indexOf('count');
    if (il < 0 || ia < 0 || (ifq < 0 && ic < 0)) return { ok: false, errors: ['Нужны колонки locus, allele и frequency (или count)'] };
    var by = {}, useCount = ifq < 0;
    lines.slice(1).forEach(function (ln, i) {
      var c = ln.split(sep), l = K.canon((c[il] || '').trim()), a = (c[ia] || '').trim().replace(',', '.'), cell = String(c[useCount ? ic : ifq] || '').trim();
      if (cell === '') return; /* пустое значение шаблона — строка пропускается */
      var v = parseFloat(cell.replace(',', '.'));
      if (!K.loci()[l]) { errs.push('Строка ' + (i + 2) + ': неизвестный локус «' + (c[il] || '') + '»'); return; }
      if (!a || isNaN(v) || v < 0) { errs.push('Строка ' + (i + 2) + ': неверное значение'); return; }
      (by[l] = by[l] || {})[a] = (by[l][a] || 0) + v;
    });
    var loci = {}, nAl = 0;
    Object.keys(by).forEach(function (l) {
      var s = 0; Object.keys(by[l]).forEach(function (a) { s += by[l][a]; });
      if (!useCount && Math.abs(s - 1) > 0.01) errs.push(l + ': сумма частот ' + s.toFixed(4) + ' (допуск ±0.01)');
      loci[l] = {}; Object.keys(by[l]).forEach(function (a) { loci[l][a] = by[l][a] / s; nAl++; });
    });
    if (!Object.keys(loci).length && !errs.length) errs.push('Нет заполненных значений: заполните колонку ' + (useCount ? 'count' : 'frequency'));
    return { ok: !errs.length && !!Object.keys(loci).length, errors: errs, loci: loci, locusCount: Object.keys(loci).length, alleleCount: nAl };
  };
  K.addUserPopulation = function (dsId, name, loci, N, label) {
    var u = userPops(); u[dsId] = u[dsId] || {}; u[dsId][name] = { N: N, label: label || name, loci: loci }; lsSet('kx2_userpops', u); cache = {};
  };
  K.removeUserPopulation = function (dsId, name) { var u = userPops(); if (u[dsId]) { delete u[dsId][name]; if (!Object.keys(u[dsId]).length) delete u[dsId]; lsSet('kx2_userpops', u); cache = {}; } };
  K.userPopulations = userPops;

  /* строки таблицы частот популяции: исходные и нормализованные значения (для CSV) */
  K.populationRows = function (id, pop) {
    var d = K.dataset(id), raw = d.populations[pop], n = K.normalize(id, pop), rows = [];
    Object.keys(n.loci).forEach(function (l) {
      var rr = {}; Object.keys(raw).forEach(function (k) { if (K.canon(k) === l) rr = raw[k]; });
      Object.keys(n.loci[l]).sort(cmp).forEach(function (a) {
        rows.push({ dataset: id, population: pop, population_label: K.popLabel(id, pop), locus: l, allele: a, frequency_raw: rr[a] === undefined ? '' : rr[a], frequency_normalized: n.loci[l][a] });
      });
    });
    return rows;
  };
  /* шаблон для импорта: локусы набора × аллели, встречающиеся в загруженных наборах; значения пустые */
  K.templateRows = function (kit) {
    var loci = K.kitLoci(kit || 'RUS_PP16_15', true), al = {}, rows = [];
    K.datasetIds().forEach(function (id) {
      if (!K.ready(id)) return;
      var d = K.dataset(id);
      K.populations(id).forEach(function (p) {
        Object.keys(d.populations[p]).forEach(function (l0) {
          var l = K.canon(l0); if (loci.indexOf(l) < 0) return;
          al[l] = al[l] || {}; Object.keys(d.populations[p][l0]).forEach(function (a) { al[l][a] = 1; });
        });
      });
    });
    loci.forEach(function (l) { Object.keys(al[l] || {}).sort(cmp).forEach(function (a) { rows.push({ locus: l, allele: a, frequency: '' }); }); });
    return rows;
  };

  /* ---------- CSV ---------- */
  K.toCSV = function (rows, cols) {
    function q(v) { v = v === undefined || v === null ? '' : String(v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    return '\ufeff' + [cols.join(',')].concat(rows.map(function (r) { return cols.map(function (c) { return q(r[c]); }).join(','); })).join('\n');
  };

  root.KXE = K;
})(typeof window !== 'undefined' ? window : globalThis);
