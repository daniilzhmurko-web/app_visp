/* ═══ Подключение баз и справочника к симулятору ═══
   Загружается ПОСЛЕ основного скрипта и переопределяет только то, что должно работать с данными.
   Если папка data/ отсутствует, симулятор продолжает работать на встроенных учебных данных. */
(function () {
  'use strict';
  var _initDB = initDB, _sendIDReq = sendIDReq, _instrReply = instrReply, _validateReg = validateReg,
      _validateLic = validateLic, _go = go, _renderServices = renderServices, _sendToFSSP = sendToFSSP,
      _buildSessionReport = buildSessionReport, _startSession = startSession;
  Object.assign(S, { reqLog: [], decisions: [], reqSeq: 0 });
  var fm = function (n) { return fmtMoney(n); };
  var isActiveIP = function (r) { return r.status !== 'Окончено (исполнено)'; };
  var svcFeedback = '';

  /* ═════ 1. Инициализация базовых наборов и индексов ═════ */
  function groupBy(arr, key) {
    var m = new Map();
    arr.forEach(function (x) { var k = x[key], a = m.get(k); if (!a) { a = []; m.set(k, a); } a.push(x); });
    return m;
  }
  function initDBFromData() {
    var F = FISDATA;
    Object.assign(DB, {
      vehicles: F.rows('vehicles'), licenses: F.rows('licenses'), violations: F.rows('violations'),
      wanted: F.rows('wanted'), exams: F.rows('exams'), special: F.rows('special'),
      specMoves: F.rows('specmoves').reverse(), specLost: [], vHistory: [], persons: F.rows('persons')
    });
    DB.special.forEach(function (s) { if (s.lost > 0) DB.specLost.push({ type: s.type, qty: s.lost, reason: 'Утрата/Порча', date: rdDate(.5) }); });
    DB.ext = {}; DB.extIdx = {};
    DB.idx = {
      persByPass: new Map(DB.persons.map(function (p) { return [p.passport, p]; })),
      persByFio: groupBy(DB.persons.map(function (p) { return { k: p.fio.toLowerCase(), p: p }; }), 'k'),
      vehByVin: new Map(), vehByPlate: new Map()
    };
    DB.vehicles.forEach(function (v) { if (!DB.idx.vehByVin.has(v.vin)) DB.idx.vehByVin.set(v.vin, v); DB.idx.vehByPlate.set(normPlate(v.plate), v); });
    var acts = [['Первичная регистрация', 'регистрация'], ['Смена владельца (купля-продажа)', 'регистрация'], ['Замена гос. знака', 'регистрация'], ['Постановка на учёт', 'регистрация']];
    for (var i = 0; i < 25; i++) {
      var v = DB.vehicles[ri(0, DB.vehicles.length - 1)], a = rnd(acts);
      DB.vHistory.push({ date: rdDate(2), time: pad2(ri(8, 18)) + ':' + pad2(ri(0, 59)), plate: v.plate, action: a[0], actionType: a[1], op: rnd(NAMES), result: 'Выполнено', details: '' });
    }
    DB.vHistory.sort(function (a, b) { return b.date.localeCompare(a.date); });
    S.reqLog = []; S.decisions = []; S.reqSeq = 0; svcFeedback = '';
    addScenarioTemplates();
  }
  window.initDB = function () {
    if (FISDATA.available()) {
      try { initDBFromData(); return; } catch (e) { console.error('Ошибка инициализации из data/, запасной режим:', e); }
    }
    _initDB();
  };

  /* Индексы баз ведомств строятся один раз после ленивой загрузки набора */
  var pendingFssp = [];
  function buildExtIndex(set) {
    if (DB.extIdx[set]) return;
    var rows = FISDATA.rows(set), x = {};
    DB.ext[set] = rows;
    if (set === 'fssp') {
      x.byPass = groupBy(rows, 'passport');
      x.byVin = groupBy(rows.filter(function (r) { return r.vin; }), 'vin');
    } else if (set === 'fns') x.byPass = new Map(rows.map(function (r) { return [r.passport, r]; }));
    else if (set === 'fts') x.byVin = groupBy(rows, 'vin');
    else if (set === 'interpol') x.byVin = new Map(rows.map(function (r) { return [r.vin, r]; }));
    else if (set === 'eaisto') { x.byPlate = groupBy(rows, 'plate'); x.byVin = groupBy(rows, 'vin'); }
    else if (set === 'rosavtodor') x.byPlate = groupBy(rows.filter(function (r) { return r.plate; }), 'plate');
    DB.extIdx[set] = x;
    if (set === 'fssp') pendingFssp.splice(0).forEach(addFsspRow);
  }
  function preloadExternal() {
    if (!FISDATA.available()) return;
    FISDATA.ensure(FISDATA.lazyNames()).then(function (r) {
      if (r.ok) FISDATA.lazyNames().forEach(buildExtIndex);
      renderSvcStatus();
    });
  }

  /* ═════ 2. Проверка паспорта по базе ГУВМ (регистрация ТС, выдача ВУ) ═════ */
  window.passportCheck = function (pass, fio) {
    if (!DB.persons || !DB.persons.length) return { ok: true, skip: true };
    var p = DB.idx.persByPass.get(normPass(pass));
    if (!p) return { ok: false, msg: 'паспорт ' + normPass(pass) + ' не найден в базе ГУВМ' };
    if (normName(p.fio) !== normName(fio)) return { ok: false, msg: 'ФИО не совпадает с данными ГУВМ по этому паспорту' };
    if (p.status !== 'valid') return { ok: false, msg: 'паспорт числится ' + (p.status === 'lost' ? 'утраченным' : 'недействительным') };
    return { ok: true };
  };
  function guvmGate(e, pass, fio) {
    if (e.length) return e;
    var c = passportCheck(pass, fio);
    if (!c.ok) {
      if (S.user.mode === 'exam') e.push('ГУВМ: ' + c.msg);
      else notify('w', 'ГУВМ: данные не подтверждены', c.msg + ' (проверьте в «Сервисы ГИБДД»)');
    }
    return e;
  }
  window.validateReg = function (f) { return guvmGate(_validateReg(f), f.pass, f.owner); };
  window.validateLic = function (f) { return guvmGate(_validateLic(f), f.pass, f.name); };

  /* ═════ 3. Ведомства: ответы по реальным данным ═════ */
  function resolveSubject(q) {
    q = q.trim();
    var compact = q.replace(/\s/g, ''), up = compact.toUpperCase(), np = normPlate(q);
    var s = { q: q, kind: '', person: null, veh: null, vin: '', plate: '', passport: '', ambiguous: null };
    if (/^\d{10}$/.test(compact)) {
      s.kind = 'passport'; s.passport = compact.slice(0, 4) + ' ' + compact.slice(4); s.person = DB.idx.persByPass.get(s.passport) || null;
    } else if (VIN_RE.test(up)) {
      s.kind = 'vin'; s.vin = up; s.veh = DB.idx.vehByVin.get(up) || null;
    } else if (PLATE_RE.test(np)) {
      s.kind = 'plate'; s.plate = np; s.veh = DB.idx.vehByPlate.get(np) || null; if (s.veh) s.vin = s.veh.vin;
    } else if (q.length >= 6) {
      s.kind = 'fio';
      var lq = q.toLowerCase().replace(/\s+/g, ' '), ex = DB.idx.persByFio.get(lq), list;
      list = ex ? ex.map(function (o) { return o.p; }) : DB.persons.filter(function (p) { return p.fio.toLowerCase().indexOf(lq) >= 0; }).slice(0, 12);
      if (list.length > 1) s.ambiguous = list; else s.person = list[0] || null;
    }
    if (s.veh && !s.person) s.person = DB.idx.persByPass.get(s.veh.passport) || null;
    if (s.veh) s.plate = s.veh.plate;
    if (s.person) s.passport = s.person.passport;
    return s;
  }
  var F2 = function (l, v) { return [l, v]; };
  var NONE = function (title, summary, fields) { return { level: 'none', title: title, summary: summary, fields: fields || [] }; };
  var needSubject = function (what) { return NONE('Предмет запроса не распознан', 'Укажите ' + what + ' в поле «Предмет запроса».'); };

  function repGuvm(s) {
    if (s.ambiguous) return NONE('Найдено несколько совпадений', 'Уточните запрос: укажите серию и номер паспорта (10 цифр).',
      s.ambiguous.map(function (p) { return F2(p.fio, 'дата рождения ' + fmtDate(p.birth) + ', ' + p.address.split(',')[0]); }));
    var p = s.person;
    if (!p) return s.kind ? NONE('Сведения не найдены', 'В базе паспортных данных запись по указанному предмету отсутствует.') : needSubject('серию и номер паспорта, ФИО, ГРЗ или VIN');
    var st = p.status === 'valid' ? 'Действителен' : p.status === 'lost' ? 'Утрачен' : 'Недействителен';
    return { level: p.status === 'valid' ? 'ok' : 'alert', title: p.status === 'valid' ? 'Паспорт действителен' : 'Паспорт не может быть принят',
      summary: p.status === 'valid' ? 'Оснований для отказа по паспорту нет.' : 'Документ числится ' + (p.status === 'lost' ? 'утраченным' : 'недействительным') + '. Принимать его нельзя.',
      fields: [F2('ФИО', p.fio), F2('Дата рождения', fmtDate(p.birth)), F2('Место рождения', p.birthPlace), F2('Паспорт РФ', p.passport), F2('Дата выдачи', fmtDate(p.issueDate)),
               F2('Кем выдан', p.issuedBy), F2('Код подразделения', p.code), F2('Адрес регистрации', p.address), F2('Статус документа', st + (p.note ? ' — ' + p.note : ''))] };
  }
  function repFssp(s) {
    if (s.ambiguous) return NONE('Найдено несколько совпадений', 'Уточните запрос: укажите серию и номер паспорта должника или VIN.', s.ambiguous.map(function (p) { return F2(p.fio, 'дата рождения ' + fmtDate(p.birth)); }));
    if (!s.passport && !s.vin) return s.kind ? NONE('Сведения не найдены', 'Должник по указанному предмету не установлен.') : needSubject('паспорт должника, ФИО, ГРЗ или VIN');
    var X = DB.extIdx.fssp, rows = (s.passport && X.byPass.get(s.passport)) || [], act = rows.filter(isActiveIP);
    var vinRows = (s.vin && X.byVin.get(s.vin)) || [], restrictVin = vinRows.filter(function (r) { return r.restrict && isActiveIP(r); });
    var restrictAll = act.filter(function (r) { return r.restrict; });
    var total = act.reduce(function (a, r) { return a + r.amount; }, 0), fields = [];
    if (s.person) fields.push(F2('Должник', s.person.fio + ', ' + fmtDate(s.person.birth)));
    fields.push(F2('Действующих производств', String(act.length)), F2('Общая сумма долга', fm(total)));
    if (s.vin) fields.push(F2('Запрет на регистрационные действия (VIN ' + s.vin + ')', restrictVin.length ? 'ДА — ИП ' + restrictVin[0].number + ', ' + restrictVin[0].osp : 'НЕТ'));
    else if (restrictAll.length) fields.push(F2('Запреты на регистрационные действия', restrictAll.map(function (r) { return r.plate; }).join(', ')));
    act.slice(0, 5).forEach(function (r) { fields.push(F2('ИП ' + r.number, r.kind + ', ' + fm(r.amount) + ', с ' + fmtDate(r.start) + ', ' + r.osp + (r.restrict ? ' — запрет рег. действий (' + r.plate + ')' : ''))); });
    if (act.length > 5) fields.push(F2('…', 'ещё производств: ' + (act.length - 5)));
    var restr = s.vin ? restrictVin.length > 0 : restrictAll.length > 0;
    if (restr) return { level: 'alert', title: 'Установлен запрет на регистрационные действия', summary: 'Регистрационные действия с ТС выполнять нельзя до снятия запрета судебным приставом.', fields: fields };
    if (act.length) return { level: 'warn', title: 'Есть исполнительные производства', summary: (s.vin ? 'Запрета на регистрационные действия в отношении этого ТС нет. ' : '') + 'Наличие долга само по себе не является основанием для отказа в регистрационных действиях.', fields: fields };
    return { level: 'ok', title: 'Исполнительных производств нет', summary: 'Ограничений нет.', fields: fields };
  }
  function repFns(s) {
    if (s.ambiguous) return NONE('Найдено несколько совпадений', 'Уточните запрос: укажите серию и номер паспорта.', s.ambiguous.map(function (p) { return F2(p.fio, 'дата рождения ' + fmtDate(p.birth)); }));
    if (!s.person) return s.kind ? NONE('Сведения не найдены', 'Налогоплательщик не установлен.') : needSubject('паспорт, ФИО, ГРЗ или VIN владельца');
    var r = DB.extIdx.fns.byPass.get(s.person.passport);
    if (!r) return NONE('Сведения не найдены', 'ИНН по указанным данным не найден.');
    var tot = r.debtTransport + r.debtProperty + r.debtIncome;
    return { level: tot > 0 ? 'warn' : 'ok', title: tot > 0 ? 'Есть налоговая задолженность' : 'Задолженности нет', summary: tot > 0 ? 'Сведения носят справочный характер: налоговая задолженность не является запретом на регистрационные действия.' : 'Задолженностей по налогам не выявлено.',
      fields: [F2('ФИО', r.fio), F2('ИНН', r.inn), F2('Статус', r.status), F2('Налоговый орган', r.inspection), F2('Транспортный налог (недоимка)', fm(r.debtTransport)), F2('Имущественные налоги', fm(r.debtProperty)), F2('НДФЛ', fm(r.debtIncome)), F2('Итого', fm(tot)), F2('Данные на', fmtDate(r.updated))] };
  }
  function ftsBad(r) { return r.status === 'Аннулирована' || !r.dutyPaid || !!(r.until && r.until < today()); }
  function repFts(s) {
    if (!s.vin) return needSubject('VIN или госномер ТС');
    var rows = DB.extIdx.fts.byVin.get(s.vin);
    if (!rows) return NONE('Сведения не найдены', 'Декларации на ТС с указанным VIN в базе таможни нет (ТС могло быть приобретено на внутреннем рынке).', [F2('VIN', s.vin)]);
    var r = rows.slice().sort(function (a, b) { return b.date.localeCompare(a.date); })[0];
    var temp = !!r.until, expired = temp && r.until < today();
    var fields = [F2('Декларация (ДТ)', r.dt), F2('Дата', fmtDate(r.date)), F2('Таможенный пост', r.post), F2('VIN', r.vin), F2('ТС', r.brand + ', ' + r.year + ' г.'), F2('Страна происхождения', r.country), F2('Таможенный режим', r.regime),
      F2('Декларант', r.declarant), F2('Пошлины и сборы', r.dutyPaid ? 'уплачены' : 'НЕ уплачены'), F2('Статус декларации', r.status)];
    if (temp) fields.push(F2('Срок временного ввоза', 'до ' + fmtDate(r.until) + (expired ? ' (ИСТЁК)' : '')));
    if (r.status === 'Аннулирована') return { level: 'alert', title: 'Декларация аннулирована', summary: 'Законность ввоза ТС не подтверждена. Регистрация невозможна.', fields: fields };
    if (!r.dutyPaid) return { level: 'alert', title: 'Таможенные платежи не уплачены', summary: 'ТС выпущено условно. Регистрация невозможна до уплаты платежей.', fields: fields };
    if (expired) return { level: 'alert', title: 'Срок временного ввоза истёк', summary: 'ТС подлежит вывозу или таможенному оформлению. Регистрация невозможна.', fields: fields };
    if (temp) return { level: 'warn', title: 'Временный ввоз', summary: 'Регистрация допускается только на срок временного ввоза.', fields: fields };
    return { level: 'ok', title: 'Таможенное оформление подтверждено', summary: 'Нарушений не выявлено.', fields: fields };
  }
  function repInterpol(s) {
    if (!s.vin) return needSubject('VIN или госномер ТС');
    var r = DB.extIdx.interpol.byVin.get(s.vin);
    if (!r) return { level: 'ok', title: 'В международном розыске не числится', summary: 'Совпадений по VIN в базе похищенных транспортных средств нет.', fields: [F2('VIN', s.vin)] };
    var f = [F2('Бюро', r.ncb), F2('VIN', r.vin), F2('ТС', r.brand + ' ' + r.model + ', ' + r.year + ' г.'), F2('Страна хищения', r.country), F2('Дата хищения', fmtDate(r.theftDate)), F2('Дело', r.case), F2('Основание', r.reason), F2('Статус', r.status)];
    if (r.status === 'Активный розыск') return { level: 'alert', title: 'ТС числится в международном розыске', summary: 'Регистрационные действия запрещены. ТС подлежит задержанию, уведомите дежурного.', fields: f };
    return { level: 'warn', title: 'Розыск прекращён', summary: 'Объект найден, розыск по делу прекращён. Препятствий по этой базе нет.', fields: f };
  }
  var latestCard = function (cards) { return cards.slice().sort(function (a, b) { return b.issued.localeCompare(a.issued); })[0]; };
  function repEaisto(s) {
    if (!s.plate && !s.vin) return needSubject('госномер или VIN ТС');
    var X = DB.extIdx.eaisto, cards = (s.plate && X.byPlate.get(s.plate)) || (s.vin && X.byVin.get(s.vin)) || [];
    if (!cards.length) {
      if (!s.veh) return NONE('Сведения не найдены', 'ТС не найдено в базе ГИБДД, карты ЕАИС ТО отсутствуют.');
      if (new Date().getFullYear() - s.veh.year < 4) return { level: 'ok', title: 'Техосмотр не требуется', summary: 'ТС младше 4 лет, диагностическая карта не требуется.', fields: [F2('ТС', s.veh.brand + ' ' + s.veh.model + ', ' + s.veh.year + ' г.')] };
      return { level: 'alert', title: 'Диагностическая карта не найдена', summary: 'На ТС старше 4 лет в ЕАИС ТО нет ни одной карты. Эксплуатация без диагностической карты — нарушение.', fields: [F2('ТС', s.veh.brand + ' ' + s.veh.model + ', ' + s.veh.year + ' г.'), F2('ГРЗ', s.veh.plate)] };
    }
    var c = latestCard(cards), valid = c.until >= today() && c.result === 'Допущено';
    var f = [F2('Карта №', c.card), F2('ГРЗ / VIN', c.plate + ' / ' + c.vin), F2('Дата проведения', fmtDate(c.issued)), F2('Действительна до', fmtDate(c.until) + (valid ? '' : ' (не действует)')), F2('Пункт ТО', c.station + ', аккредитация ' + c.accred), F2('Пробег', c.odometer.toLocaleString('ru-RU') + ' км'), F2('Результат', c.result), F2('Всего карт в истории', String(cards.length))];
    if (valid) return { level: 'ok', title: 'Диагностическая карта действительна', summary: 'Нарушений нет.', fields: f };
    return { level: 'alert', title: c.result === 'Допущено' ? 'Срок диагностической карты истёк' : 'ТС не допущено по результатам диагностики', summary: 'Действующей диагностической карты нет. Эксплуатация ТС — нарушение.', fields: f };
  }
  function repRsa(s) {
    if (!s.plate) return needSubject('госномер ТС (грузовой автомобиль или автобус)');
    var acts = DB.extIdx.rosavtodor.byPlate.get(s.plate) || [];
    if (!acts.length) return { level: 'ok', title: 'Актов весогабаритного контроля нет', summary: 'Нарушений не выявлено.', fields: [F2('ГРЗ', s.plate)] };
    var unpaid = acts.filter(function (a) { return a.fine > 0 && !a.paid; }), sum = unpaid.reduce(function (t, a) { return t + a.fine; }, 0);
    var f = [F2('ГРЗ', s.plate), F2('Актов всего', String(acts.length)), F2('Неоплаченных', String(unpaid.length)), F2('Сумма неоплаченных штрафов', fm(sum))];
    acts.slice().sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 4).forEach(function (a) { f.push(F2(a.act, fmtDate(a.date) + ', ' + a.post + ', превышение ' + a.excess + ' т, штраф ' + fm(a.fine) + (a.fine ? (a.paid ? ' — оплачен' : ' — НЕ оплачен') : ''))); });
    return unpaid.length ? { level: 'alert', title: 'Есть неоплаченные штрафы за превышение массы', summary: 'Выявлены неоплаченные постановления по актам весогабаритного контроля.', fields: f }
                         : { level: 'ok', title: 'Неоплаченных штрафов нет', summary: 'Нарушения оплачены, ограничений нет.', fields: f };
  }
  var AG = [
    { key: 'guvm', name: 'ГУВМ МВД России', match: 'ГУВМ', sets: [], set: '', lat: [450, 900], reply: repGuvm },
    { key: 'fssp', name: 'ФССП России', match: 'ФССП', sets: ['fssp'], set: 'fssp', lat: [600, 1200], reply: repFssp },
    { key: 'fns', name: 'ФНС России', match: 'ФНС', sets: ['fns'], set: 'fns', lat: [700, 1300], reply: repFns },
    { key: 'fts', name: 'ФТС России', match: 'ФТС', sets: ['fts'], set: 'fts', lat: [900, 1700], reply: repFts },
    { key: 'interpol', name: 'НЦБ Интерпол', match: 'НЦБ', sets: ['interpol'], set: 'interpol', lat: [900, 1800], reply: repInterpol },
    { key: 'eaisto', name: 'ЕАИС ТО', match: 'ЕАИС', sets: ['eaisto'], set: 'eaisto', lat: [500, 1000], reply: repEaisto },
    { key: 'rsa', name: 'Росавтодор', match: 'Росавтодор', sets: ['rosavtodor'], set: 'rosavtodor', lat: [600, 1200], reply: repRsa }
  ];
  var AGK = {}; AG.forEach(function (a) { AGK[a.key] = a; });

  /* ═════ 4. Ответ ведомства как документ + журнал запросов ═════ */
  var LVL = {
    ok: { cls: 'found', badge: 'b-green', label: 'Замечаний нет', alrt: 'ai-ok', ic: '✅' },
    warn: { cls: 'fraud', badge: 'b-orange', label: 'Есть замечания', alrt: 'ai-warn', ic: '⚠️' },
    alert: { cls: 'wanted', badge: 'b-red', label: 'Выявлены ограничения', alrt: 'ai-danger', ic: '🚨' },
    none: { cls: '', badge: 'b-gray', label: 'Сведения не найдены', alrt: 'ai-info', ic: '🔍' }
  };
  function replyHtml(ag, e) {
    var L = LVL[e.rep.level], rows = e.rep.fields.map(function (f) {
      return '<div style="color:var(--txt3);font-size:11px">' + esc(f[0]) + '</div><div style="font-weight:600;word-break:break-word">' + esc(f[1]) + '</div>';
    }).join('');
    return '<div class="rcard ' + L.cls + '"><div class="rhdr"><div style="font-family:var(--font);font-size:13px;font-weight:800">' + esc(ag.name) + '</div><span class="badge ' + L.badge + '">' + L.label + '</span></div>' +
      '<div style="font-size:10.5px;color:var(--txt3);margin:-3px 0 10px">Ответ на запрос № ' + esc(e.no) + ' от ' + esc(e.when) + ' · предмет запроса: ' + esc(e.query) + '</div>' +
      (rows ? '<div style="display:grid;grid-template-columns:minmax(120px,36%) 1fr;gap:5px 14px;font-size:12.5px;margin-bottom:10px">' + rows + '</div>' : '') +
      '<div class="alrt ' + L.alrt + '"><span>' + L.ic + '</span><div><div class="alrt-title">' + esc(e.rep.title) + '</div><div class="alrt-text">' + esc(e.rep.summary) + '</div></div></div></div>';
  }
  function reqNo() { var d = new Date(); S.reqSeq++; return 'ЗП-' + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + String(S.reqSeq).padStart(4, '0'); }
  window.openReq = function (no) {
    var e = S.reqLog.find(function (x) { return x.no === no; }); if (!e) return;
    gid('id-result').innerHTML = replyHtml(AGK[e.key], e);
    gid('id-result').scrollIntoView({ block: 'nearest' });
  };
  function renderSvcLog() {
    var tb = gid('svc-log'); if (!tb) return;
    var card = gid('svc-log-card'); if (card) card.style.display = '';
    tb.innerHTML = S.reqLog.slice().reverse().slice(0, 40).map(function (e) {
      var L = LVL[e.rep.level];
      return '<tr><td style="white-space:nowrap">' + esc(e.time) + '</td><td>' + esc(AGK[e.key].name) + '</td><td style="font-size:12px">' + esc(e.query) + '</td><td><span class="badge ' + L.badge + '">' + esc(e.rep.title) + '</span></td><td><button class="btn btn-s btn-sm" onclick="openReq(\'' + esc(e.no) + '\')">Открыть</button></td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--txt3);padding:16px">Запросов ещё не было</td></tr>';
  }
  function renderSvcStatus() {
    var c = gid('integ-status'); if (!c) return;
    c.innerHTML = AG.map(function (a) {
      var n = a.key === 'guvm' ? DB.persons.length : (FISDATA.info().sets[a.set] || {}).rows, ready = a.key === 'guvm' || FISDATA.isLoaded(a.set);
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border)"><span>' + esc(a.name) + '<span style="display:block;font-size:10.5px;color:var(--txt3)">записей в базе: ' + (n || 0).toLocaleString('ru-RU') + '</span></span>' +
        '<span class="badge ' + (ready ? 'b-green' : 'b-gray') + '">' + (ready ? 'Онлайн' : 'Подключение…') + '</span></div>';
    }).join('');
  }

  window.sendIDReq = function () {
    if (!DB.persons || !DB.persons.length) return _sendIDReq();
    var target = gid('id-target').value, query = gid('id-query').value.trim(), res = gid('id-result');
    if (!query) { notify('w', 'Введите предмет запроса', 'Паспорт, ГРЗ, VIN или ФИО'); return; }
    var ag = AG.filter(function (a) { return target.indexOf(a.match) >= 0; })[0];
    if (!ag) { notify('w', 'Выберите ведомство', ''); return; }
    var token = ++_idReqToken, t0 = Date.now();
    log('Запрос в ' + ag.name + ': ' + query, 'interdept');
    res.innerHTML = '<div style="display:flex;align-items:center;gap:9px;padding:11px;color:var(--txt2)"><div class="tdots"><div class="tdot"></div><div class="tdot"></div><div class="tdot"></div></div> Ожидание ответа от ' + esc(ag.name) + '…</div>';
    FISDATA.ensure(ag.sets).then(function (r) {
      if (!r.ok) { res.innerHTML = '<div class="alrt ai-danger"><span>🚨</span><div><div class="alrt-title">Сервис недоступен</div><div class="alrt-text">' + esc(r.reason || '') + '</div></div></div>'; return; }
      ag.sets.forEach(buildExtIndex);
      setTimeout(function () {
        var s = resolveSubject(query), rep = ag.reply(s), now = new Date(), hms = pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds());
        var e = { no: reqNo(), key: ag.key, query: query, when: fmtDate(today()) + ' ' + hms, time: hms, rep: rep, subject: { kind: s.kind, passport: s.passport, vin: s.vin, plate: s.plate } };
        S.reqLog.push(e);
        if (token === _idReqToken) res.innerHTML = replyHtml(ag, e);
        renderSvcLog();
        if (rep.level === 'alert') aMsg('sys', 'Критический результат — ' + ag.name + ': ' + rep.title + '. ' + rep.summary, 'sys');
        log('Ответ ' + ag.name + ': ' + rep.title, 'interdept_resp', { level: rep.level });
        reward('svc:' + ag.key, 40, true, 3);
        scenarioOnReply(ag, s, e);
        notify(rep.level === 'alert' ? 'd' : 'ok', 'Ответ получен', ag.name);
      }, Math.max(0, ri(ag.lat[0], ag.lat[1]) - (Date.now() - t0)));
    });
  };

  /* ═════ 5. Передача штрафа в ФССП отражается в базе ФССП ═════ */
  function addFsspRow(v) {
    var veh = DB.idx.vehByPlate.get(normPlate(v.plate)), p = veh && DB.idx.persByPass.get(veh.passport);
    if (!p) return;
    if (!DB.extIdx.fssp) { pendingFssp.push(v); return; }
    var row = { number: ri(10000, 999999) + '/' + String(new Date().getFullYear()).slice(2) + '/' + ri(10000, 99999) + '-ИП', passport: p.passport, fio: p.fio, birth: p.birth, kind: 'Штраф ГИБДД', amount: v.amount, start: today(),
                osp: 'ОСП №' + ri(1, 9) + ' по г. ' + p.address.split(',')[0], status: 'В производстве', decree: v.decree, vin: '', plate: '', restrict: false };
    DB.ext.fssp.push(row);
    var a = DB.extIdx.fssp.byPass.get(p.passport); if (!a) DB.extIdx.fssp.byPass.set(p.passport, [row]); else a.push(row);
  }
  window.sendToFSSP = function (decree) {
    var v = DB.violations.find(function (x) { return x.decree === decree; }), before = v && v.status;
    _sendToFSSP(decree);
    if (v && before === 'Просрочен' && v.status === 'В ФССП' && DB.idx) addFsspRow(v);
  };

  /* ═════ 6. Сценарные задания: запрос → ответ → решение ═════ */
  var OPT = {
    A: [['accept', 'Принять заявление'], ['refuse', 'Отказать: паспорт не подтверждён'], ['detain', 'Передать дежурному']],
    B: [['accept', 'Оформить переоформление'], ['refuse', 'Отказать: запрет на регистрационные действия'], ['detain', 'Передать дежурному']],
    C: [['accept', 'Зарегистрировать ТС'], ['refuse', 'Отказать в регистрации'], ['detain', 'Задержать ТС и передать дежурному']],
    D: [['none', 'Нарушений не выявлено'], ['viol', 'Составить протокол: нет действующей диагностической карты']],
    E: [['none', 'Нарушений не выявлено'], ['viol', 'Составить протокол: неоплаченные штрафы за превышение массы']],
    F: [['low', 'Низкий риск'], ['medium', 'Средний риск'], ['high', 'Высокий риск']]
  };
  var pickR = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var vehTxt = function (v) { return v.brand + ' ' + v.model + ', ' + v.year + ' г., ГРЗ ' + v.plate + ', VIN ' + v.vin; };
  var activeFssp = function (p) { return (DB.extIdx.fssp.byPass.get(p.passport) || []).filter(isActiveIP); };
  function personRisk(p) {
    var act = activeFssp(p), fn = DB.extIdx.fns.byPass.get(p.passport), tax = fn ? fn.debtTransport + fn.debtProperty + fn.debtIncome : 0;
    var restr = act.some(function (r) { return r.restrict; }), bad = p.status !== 'valid';
    return { bad: bad, restr: restr, debts: act.length, tax: tax, level: (bad || restr) ? 'high' : (act.length || tax > 0) ? 'medium' : 'low' };
  }
  var SC = {
    A: { need: [], build: function (variant) {
      var p = pickR(DB.persons.filter(function (x) { return variant === 'valid' ? x.status === 'valid' : x.status !== 'valid'; }));
      return { match: { passport: p.passport }, required: ['guvm'], options: OPT.A, correct: p.status === 'valid' ? 'accept' : 'refuse',
        text: 'Гражданин ' + p.fio + ' обратился с заявлением на получение водительского удостоверения и предъявил паспорт ' + p.passport + '. Проверьте паспорт в ГУВМ и примите решение по заявлению.',
        hint: 'Запрос в ГУВМ: предмет — серия и номер паспорта.',
        explain: p.status === 'valid' ? 'ГУВМ подтвердил действительность паспорта — заявление принимается.' : 'ГУВМ: паспорт ' + (p.status === 'lost' ? 'числится утраченным' : 'недействителен') + ' — документ принимать нельзя.' }; } },
    B: { need: ['fssp'], build: function (variant) {
      var X = DB.extIdx.fssp, v, r;
      if (variant === 'restrict') {
        r = pickR(DB.ext.fssp.filter(function (x) { return x.restrict && isActiveIP(x) && DB.idx.vehByVin.has(x.vin); })); v = DB.idx.vehByVin.get(r.vin);
      } else {
        var rv = new Set(DB.ext.fssp.filter(function (x) { return x.restrict && isActiveIP(x); }).map(function (x) { return x.vin; }));
        var cands = DB.vehicles.filter(function (x) { return x.status === 'Активен' && !x.anomaly && !rv.has(x.vin); });
        var debtors = cands.filter(function (x) { return (X.byPass.get(x.passport) || []).some(function (y) { return !y.restrict && isActiveIP(y); }); });
        v = pickR(Math.random() < .6 && debtors.length ? debtors : cands);
      }
      var own = DB.idx.persByPass.get(v.passport), debts = activeFssp(own).length;
      return { match: { vin: v.vin, plate: v.plate, passport: v.passport }, required: ['fssp'], options: OPT.B, correct: variant === 'restrict' ? 'refuse' : 'accept',
        text: 'Гражданин ' + v.owner + ' (паспорт ' + v.passport + ') подал документы на переоформление ТС в связи с продажей: ' + vehTxt(v) + '. Проверьте сведения ФССП и примите решение.',
        hint: 'Запрос в ФССП по VIN или паспорту. Важно: есть ли именно запрет на регистрационные действия.',
        explain: variant === 'restrict' ? 'ФССП: в отношении VIN действует запрет на регистрационные действия (ИП ' + r.number + ') — в переоформлении нужно отказать.'
          : debts ? 'У владельца есть исполнительные производства (' + debts + '), но запрета на регистрационные действия в отношении этого ТС нет — переоформление выполняется.' : 'Исполнительных производств нет — переоформление выполняется.' }; } },
    C: { need: ['interpol', 'fts'], build: function (variant) {
      var I = DB.extIdx.interpol.byVin, T = DB.extIdx.fts.byVin, list = [];
      DB.vehicles.forEach(function (v) {
        var t = T.get(v.vin), i = I.get(v.vin), iAct = i && i.status === 'Активный розыск';
        if (variant === 'interpol') { if (iAct && t) list.push(v); return; }
        if (!t || iAct) return;
        var bad = t.some(ftsBad);
        if (variant === 'customs' ? bad : (!bad && !t[0].until)) list.push(v);
      });
      var v = pickR(list), t = T.get(v.vin), i = I.get(v.vin), ex;
      if (variant === 'interpol') ex = 'НЦБ Интерпол: ТС числится в международном розыске (дело ' + i.case + ') — ТС задерживается, дежурный уведомляется.';
      else if (variant === 'customs') { var b = t.filter(ftsBad)[0]; ex = 'Интерпол: совпадений нет. ФТС: ' + (b.status === 'Аннулирована' ? 'декларация аннулирована' : !b.dutyPaid ? 'таможенные платежи не уплачены' : 'срок временного ввоза истёк') + ' — в регистрации нужно отказать.'; }
      else ex = 'Интерпол: совпадений нет. ФТС: ввоз оформлен, платежи уплачены — ТС регистрируется.';
      return { match: { vin: v.vin, plate: v.plate }, required: ['interpol', 'fts'], options: OPT.C, correct: variant === 'interpol' ? 'detain' : variant === 'customs' ? 'refuse' : 'accept',
        text: 'На регистрацию представлено ТС, ввезённое из-за рубежа: ' + vehTxt(v) + '. Владелец — ' + v.owner + '. Проверьте ТС в НЦБ Интерпол и ФТС и примите решение.',
        hint: 'Нужны оба запроса (Интерпол и ФТС) по VIN или госномеру. Розыск Интерпола приоритетнее таможенных замечаний.', explain: ex }; } },
    D: { need: ['eaisto'], build: function (variant) {
      var P = DB.extIdx.eaisto.byPlate, y = new Date().getFullYear(), t = today(), list = DB.vehicles.filter(function (v) {
        var c = P.get(v.plate);
        if (variant === 'none') return !c && y - v.year >= 4;
        if (!c) return false;
        var l = latestCard(c), ok = l.until >= t && l.result === 'Допущено';
        return variant === 'valid' ? ok : !ok;
      });
      var v = pickR(list), c = P.get(v.plate), l = c && latestCard(c);
      return { match: { plate: v.plate, vin: v.vin }, required: ['eaisto'], options: OPT.D, correct: variant === 'valid' ? 'none' : 'viol',
        text: 'Инспектор ДПС остановил ТС ' + v.brand + ' ' + v.model + ', ' + v.year + ' г., ГРЗ ' + v.plate + '. Водитель диагностическую карту не предъявил. Проверьте её в ЕАИС ТО и примите решение.',
        hint: 'Запрос в ЕАИС ТО по госномеру. Смотрите срок действия и результат диагностики.',
        explain: variant === 'valid' ? 'ЕАИС ТО: карта действительна до ' + fmtDate(l.until) + ' — нарушения нет.' : variant === 'none' ? 'ЕАИС ТО: на ТС старше 4 лет нет ни одной карты — составляется протокол.' : 'ЕАИС ТО: ' + (l.result === 'Допущено' ? 'срок последней карты истёк ' + fmtDate(l.until) : 'ТС не допущено по результатам диагностики') + ' — составляется протокол.' }; } },
    E: { need: ['rosavtodor'], build: function (variant) {
      var P = DB.extIdx.rosavtodor.byPlate, list = DB.vehicles.filter(function (v) {
        if (v.type !== 'Грузовой' && v.type !== 'Автобус') return false;
        var a = P.get(v.plate) || [], un = a.some(function (x) { return x.fine > 0 && !x.paid; });
        return variant === 'unpaid' ? un : !un;
      });
      var v = pickR(list), a = P.get(v.plate) || [], un = a.filter(function (x) { return x.fine > 0 && !x.paid; });
      return { match: { plate: v.plate, vin: v.vin }, required: ['rsa'], options: OPT.E, correct: variant === 'unpaid' ? 'viol' : 'none',
        text: 'Остановлен ' + v.type.toLowerCase() + ' автомобиль ' + v.brand + ' ' + v.model + ', ГРЗ ' + v.plate + ', владелец ' + v.owner + '. Проверьте в Росавтодоре акты весогабаритного контроля и примите решение.',
        hint: 'Запрос в Росавтодор по госномеру. Важны только неоплаченные штрафы.',
        explain: variant === 'unpaid' ? 'Росавтодор: неоплаченных актов — ' + un.length + ' на сумму ' + fm(un.reduce(function (t, x) { return t + x.fine; }, 0)) + ' — составляется протокол.' : 'Росавтодор: неоплаченных штрафов нет — нарушений не выявлено.' }; } },
    F: { need: ['fssp', 'fns'], build: function (variant) {
      var p = pickR(DB.persons.filter(function (x) { return personRisk(x).level === variant; })), rk = personRisk(p), parts = [];
      if (rk.bad) parts.push('паспорт ' + (p.status === 'lost' ? 'утрачен' : 'недействителен'));
      if (rk.restr) parts.push('есть запрет на регистрационные действия');
      if (rk.debts) parts.push('исполнительных производств: ' + rk.debts);
      if (rk.tax) parts.push('налоговая задолженность ' + fm(rk.tax));
      return { match: { passport: p.passport }, required: ['guvm', 'fssp', 'fns'], options: OPT.F, correct: variant,
        text: 'Проведите комплексную проверку гражданина ' + p.fio + ', паспорт ' + p.passport + ': запросите ГУВМ, ФССП и ФНС и оцените риск. Высокий — паспорт утрачен/недействителен или есть запрет на регистрационные действия; средний — есть задолженности (ФССП или ФНС) без запретов; низкий — замечаний нет.',
        hint: 'Три запроса по паспорту. Задолженность без запрета и без проблем с паспортом — это средний риск.',
        explain: 'Итог проверки: ' + (parts.length ? parts.join('; ') : 'замечаний нет') + '.' }; } }
  };
  var SC_TPL = [
    ['sc_a1', 'A', 'valid', '🪪', 'Проверка паспорта заявителя (ГУВМ)', 1, 110, ['Запрос в ГУВМ', 'Решение по заявлению']],
    ['sc_a2', 'A', 'bad', '🪪', 'Проверка паспорта заявителя (ГУВМ), случай 2', 1, 110, ['Запрос в ГУВМ', 'Решение по заявлению']],
    ['sc_b1', 'B', 'restrict', '🔐', 'Переоформление ТС: проверка ФССП', 2, 170, ['Запрос в ФССП', 'Решение по переоформлению']],
    ['sc_b2', 'B', 'clean', '🔐', 'Переоформление ТС: проверка ФССП, случай 2', 2, 170, ['Запрос в ФССП', 'Решение по переоформлению']],
    ['sc_c1', 'C', 'interpol', '🌍', 'Регистрация ввезённого ТС: Интерпол и ФТС', 3, 270, ['Запрос в НЦБ Интерпол', 'Запрос в ФТС', 'Решение по регистрации']],
    ['sc_c2', 'C', 'customs', '🌍', 'Регистрация ввезённого ТС: таможня', 3, 270, ['Запрос в НЦБ Интерпол', 'Запрос в ФТС', 'Решение по регистрации']],
    ['sc_c3', 'C', 'clean', '🌍', 'Регистрация ввезённого ТС: чистый случай', 3, 270, ['Запрос в НЦБ Интерпол', 'Запрос в ФТС', 'Решение по регистрации']],
    ['sc_d1', 'D', 'valid', '📋', 'Проверка диагностической карты (ЕАИС ТО)', 2, 140, ['Запрос в ЕАИС ТО', 'Решение по проверке']],
    ['sc_d2', 'D', 'expired', '📋', 'Проверка диагностической карты: просрочена', 2, 140, ['Запрос в ЕАИС ТО', 'Решение по проверке']],
    ['sc_d3', 'D', 'none', '📋', 'Проверка диагностической карты: карты нет', 2, 140, ['Запрос в ЕАИС ТО', 'Решение по проверке']],
    ['sc_e1', 'E', 'unpaid', '📦', 'Весогабаритный контроль (Росавтодор)', 2, 150, ['Запрос в Росавтодор', 'Решение по проверке']],
    ['sc_e2', 'E', 'clean', '📦', 'Весогабаритный контроль: без нарушений', 2, 150, ['Запрос в Росавтодор', 'Решение по проверке']],
    ['sc_f1', 'F', 'high', '🕵️', 'Комплексная проверка гражданина: случай 1', 3, 290, ['Запрос в ГУВМ', 'Запрос в ФССП', 'Запрос в ФНС', 'Оценка риска']],
    ['sc_f2', 'F', 'medium', '🕵️', 'Комплексная проверка гражданина: случай 2', 3, 290, ['Запрос в ГУВМ', 'Запрос в ФССП', 'Запрос в ФНС', 'Оценка риска']],
    ['sc_f3', 'F', 'low', '🕵️', 'Комплексная проверка гражданина: случай 3', 3, 290, ['Запрос в ГУВМ', 'Запрос в ФССП', 'Запрос в ФНС', 'Оценка риска']]
  ];
  function addScenarioTemplates() {
    SC_TPL.forEach(function (t) {
      if (QT.some(function (x) { return x.id === t[0]; })) return;
      QT.push({ id: t[0], t: 'services', icon: t[3], name: t[4], desc: 'Межведомственная проверка: исходные данные и решение — в разделе «Сервисы ГИБДД».', diff: t[5], pts: t[6], steps: t[7], panel: 'services',
                custom: true, scn: t[1], variant: t[2], hints: ['Раздел «Сервисы ГИБДД»: отправьте нужные запросы, прочитайте ответы и подтвердите решение.'] });
    });
  }
  function scnReady(q) { return SC[q.tpl.scn].need.every(function (n) { return FISDATA.isLoaded(n); }); }
  function initScenario(q) {
    var def = SC[q.tpl.scn];
    q.tpl = Object.assign({}, q.tpl);   // собственная копия шаблона для этого задания
    function build() {
      def.need.forEach(buildExtIndex);
      try { q.scn = def.build(q.tpl.variant); } catch (e) { console.error('Сценарий не построен', e); q.scn = null; return; }
      q.scn.done = {}; q.tpl.desc = q.scn.text;
      renderSvcTask(); try { renderDash(); renderQList(); } catch (e) {}
    }
    if (scnReady(q)) build(); else FISDATA.ensure(def.need).then(function (r) { if (r.ok) build(); });
  }
  var _getNew = QM.getNew.bind(QM);
  QM.getNew = function () { var q = _getNew(); if (q && q.tpl.custom) initScenario(q); return q; };

  function activeScn() { return QM.active.filter(function (x) { return x.tpl.custom; })[0] || null; }
  function matches(sc, s) {
    var m = sc.match;
    return !!((m.passport && s.passport === m.passport) || (m.vin && s.vin === m.vin) || (m.plate && s.plate && normPlate(s.plate) === normPlate(m.plate)));
  }
  function scenarioOnReply(ag, s, e) {
    QM.active.filter(function (x) { return x.tpl.custom && x.scn && x.scn.required.indexOf(ag.key) >= 0 && !x.scn.done[ag.key]; }).forEach(function (q) {
      if (!matches(q.scn, s)) { notify('info', 'Запрос не относится к заданию', 'Предмет запроса не совпадает с данными задания'); return; }
      q.scn.done[ag.key] = e.no;
      QM.completeStep(q.id, true);
    });
    renderSvcTask();
  }
  window.submitDecision = function () {
    var q = activeScn(); if (!q || !q.scn) return;
    var sc = q.scn, val = gid('svc-decision').value;
    if (!sc.required.every(function (k) { return sc.done[k]; })) { notify('w', 'Сначала выполните все запросы', 'Решение принимается по полученным ответам'); return; }
    if (!val) { notify('w', 'Выберите решение', ''); return; }
    var ok = val === sc.correct, label = (sc.options.filter(function (o) { return o[0] === val; })[0] || ['', val])[1], exam = S.user.mode === 'exam';
    S.decisions.push({ tid: q.tid, quest: q.tpl.name, choice: val, choiceLabel: label, correct: ok, answeredAt: new Date().toISOString(), requests: sc.required.map(function (k) { return sc.done[k]; }) });
    log('Решение по заданию «' + q.tpl.name + '»: ' + label + (ok ? ' (верно)' : ' (неверно)'), 'svc_decision', { ok: ok });
    if (ok) {
      svcFeedback = '<div class="alrt ai-ok" style="margin-bottom:12px"><span>✅</span><div><div class="alrt-title">Решение верное</div><div class="alrt-text">' + (exam ? 'Решение принято.' : esc(sc.explain)) + '</div></div></div>';
      QM.completeStep(q.id, true);
    } else {
      svcFeedback = '<div class="alrt ai-danger" style="margin-bottom:12px"><span>❌</span><div><div class="alrt-title">Решение неверное</div><div class="alrt-text">' + (exam ? 'Решение не соответствует данным полученных ответов.' : 'Перечитайте ответы ведомств. ' + esc(sc.explain)) + '</div></div></div>';
      QM.completeStep(q.id, false);
    }
    renderSvcTask();
  };
  function renderSvcTask() {
    var box = gid('svc-task'); if (!box) return;
    box.style.display = '';
    var q = activeScn(), fb = svcFeedback;
    if (!q) {
      box.innerHTML = fb + '<div class="ctitle">Текущее задание</div><div style="font-size:12.5px;color:var(--txt2)">Нет активного задания с межведомственной проверкой. Получите задание на главной панели — часть заданий выдаётся именно по этому разделу.</div>';
      return;
    }
    if (!q.scn) { box.innerHTML = '<div class="ctitle">' + esc(q.tpl.name) + '</div><div style="color:var(--txt2);font-size:12.5px">Подготовка задания: подключение баз ведомств…</div>'; return; }
    var sc = q.scn, all = sc.required.every(function (k) { return sc.done[k]; }), exam = S.user.mode === 'exam';
    var chk = sc.required.map(function (k) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12.5px"><span style="width:18px;text-align:center;font-weight:700;color:' + (sc.done[k] ? 'var(--green)' : 'var(--txt3)') + '">' + (sc.done[k] ? '✓' : '○') + '</span>' +
        '<span>Запрос в ' + esc(AGK[k].name) + '</span><span style="margin-left:auto;font-size:11px;color:var(--txt3)">' + (sc.done[k] ? 'ответ получен, ' + esc(sc.done[k]) : 'не выполнен') + '</span></div>';
    }).join('');
    var opts = '<option value="">— выберите решение —</option>' + sc.options.map(function (o) { return '<option value="' + o[0] + '">' + esc(o[1]) + '</option>'; }).join('');
    box.innerHTML = fb + '<div class="ctitle">' + esc(q.tpl.name) + '</div>' +
      '<div style="font-size:13px;line-height:1.6;margin:4px 0 10px">' + esc(sc.text) + '</div>' +
      (exam ? '' : '<div style="font-size:11.5px;color:var(--txt2);margin-bottom:10px">Подсказка: ' + esc(sc.hint) + '</div>') +
      '<div style="border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:6px 0;margin-bottom:10px">' + chk + '</div>' +
      '<div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap"><label class="flbl" style="margin:0">Решение</label>' +
      '<select class="finp" id="svc-decision" style="flex:1;min-width:240px"' + (all ? '' : ' disabled') + '>' + opts + '</select>' +
      '<button class="btn btn-p" onclick="submitDecision()"' + (all ? '' : ' disabled') + '>Подтвердить решение</button></div>' +
      (all ? '' : '<div style="font-size:11px;color:var(--txt3);margin-top:6px">Решение станет доступно после получения всех ответов.</div>');
  }
  /* задания по сервисам не продвигаются «любым» действием — только запросами и решением */
  window.advanceActiveQuest = function (correct) {
    if (correct === undefined) correct = true;
    S.acc.total++; if (correct) S.acc.correct++;
    var cand = QM.active.filter(function (q) { return !q.tpl.custom && (!q.tpl.panel || q.tpl.panel === 'dash' || q.tpl.panel === S.curPanel); });
    var q = (S.activeQ && cand.indexOf(S.activeQ) >= 0 && S.activeQ) || cand[0];
    if (q) QM.completeStep(q.id, correct);
  };

  window.renderServices = function () {
    _renderServices();
    if (FISDATA.available()) { renderSvcStatus(); renderSvcLog(); renderSvcTask(); }
  };

  /* ═════ 7. Отчёт: журнал запросов и решения (контрольная сумма пересчитывается) ═════ */
  window.buildSessionReport = function () {
    var r = _buildSessionReport();
    if (!FISDATA.available()) return r;
    delete r.integrity;
    r.interagency = {
      requests: S.reqLog.map(function (e) { return { no: e.no, agency: AGK[e.key].name, query: e.query, at: e.when, level: e.rep.level, result: e.rep.title, subject: e.subject }; }),
      decisions: S.decisions
    };
    r.integrity = { algo: 'cyrb53', value: cyrb53(JSON.stringify(r)), note: 'checksum of report body without this field' };
    return r;
  };

  /* ═════ 8. Старт сессии: фоновая загрузка баз ведомств ═════ */
  window.startSession = function () {
    _startSession();
    if (S.sessionStart && FISDATA.available()) setTimeout(preloadExternal, 1200);
  };

  /* ═════ 9. Справочник (docs/) и поиск для инструктора ═════ */
  var STOP = ['как', 'что', 'для', 'при', 'где', 'это', 'или', 'мне', 'мой', 'нужно', 'можно', 'надо', 'если', 'какой', 'какие', 'когда', 'чтобы', 'про'];
  var FISKB = {
    tok: function (s) { return String(s).toLowerCase().replace(/[^a-zа-яё0-9\s]/g, ' ').split(/\s+/).filter(function (w) { return w.length >= 2 && STOP.indexOf(w) < 0; }); },
    stem: function (w) { return w.length > 5 ? w.slice(0, 5) : w; },
    search: function (q, n) {
      var self = this, qs = this.tok(q).map(this.stem);
      if (!qs.length) return [];
      return FISDATA.docsList().map(function (d) {
        var t = self.tok(d.title).map(self.stem), g = self.tok(d.tags).map(self.stem), x = self.tok(d.text).map(self.stem), sc = 0;
        qs.forEach(function (w) { if (t.indexOf(w) >= 0) sc += 4; if (g.indexOf(w) >= 0) sc += 3; if (x.indexOf(w) >= 0) sc += 1; });
        return { doc: d, score: sc };
      }).filter(function (r) { return r.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, n || 5);
    }
  };
  window.FISKB = FISKB;
  window.instrReply = function (q) {
    var r = FISKB.search(q, 1)[0];
    if (r && r.score >= 4) {
      var txt = r.doc.text.replace(/\*\*/g, '').replace(/\n+/g, ' ');
      return r.doc.title + ': ' + (txt.length > 330 ? txt.slice(0, 330).replace(/\s\S*$/, '') + '…' : txt) + ' (полностью — в разделе «Справочник»)';
    }
    return _instrReply(q);
  };
  function mdLite(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'); }
  window.openDoc = function (id) {
    var d = FISDATA.docsList().find(function (x) { return x.id === id; });
    if (!d) return;
    gid('doc-view').innerHTML = '<div class="ctitle" style="margin-bottom:4px">' + esc(d.title) + '</div><div style="font-size:11px;color:var(--txt3);margin-bottom:12px">' + esc(d.group) + (d.tags ? ' · ' + esc(d.tags) : '') + '</div><div style="font-size:13px;line-height:1.65;color:var(--txt)">' + mdLite(d.text) + '</div>';
    document.querySelectorAll('#doc-list .doc-item').forEach(function (b) { b.style.background = b.dataset.id === id ? 'var(--blue-l)' : ''; });
    log('Справочник: ' + d.title, 'docs_open');
  };
  window.renderDocs = function () {
    var list = gid('doc-list'), view = gid('doc-view');
    if (!list) return;
    if (S.user.mode === 'exam') { list.innerHTML = ''; view.innerHTML = '<div class="empty"><div class="etxt">В режиме экзамена справочник недоступен.</div></div>'; return; }
    var docs = FISDATA.docsList();
    if (!docs.length) { list.innerHTML = ''; view.innerHTML = '<div class="empty"><div class="etxt">Справочник не подключён (нет файла docs/kb.js).</div></div>'; return; }
    var q = (gid('doc-q').value || '').trim(), html = '', grp = '';
    var items = q ? FISKB.search(q, 12).map(function (r) { return r.doc; }) : docs;
    items.forEach(function (d) {
      if (!q && d.group !== grp) { grp = d.group; html += '<div style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--txt3);margin:10px 0 4px">' + esc(grp) + '</div>'; }
      html += '<button class="doc-item" data-id="' + esc(d.id) + '" onclick="openDoc(\'' + esc(d.id) + '\')" style="display:block;width:100%;text-align:left;padding:7px 9px;border-radius:6px;font-size:12px;font-weight:600;color:var(--txt)">' + esc(d.title) + '</button>';
    });
    list.innerHTML = html || '<div style="color:var(--txt3);font-size:12px;padding:8px">Ничего не найдено</div>';
  };
  window.go = function (p) { _go(p); if (p === 'docs') renderDocs(); };

  /* ═════ 10. Индикатор загрузки на форме входа ═════ */
  function startDataLoad() {
    var st = gid('l-data'), btn = document.querySelector('.btnlogin');
    if (!st) return;
    if (!FISDATA.hasManifest()) { st.textContent = 'Автономный режим: папка data/ не подключена — используются встроенные учебные данные.'; return; }
    btn.disabled = true; btn.style.opacity = '.6';
    FISDATA.load(function (d, t) { st.textContent = 'Загрузка баз данных… ' + Math.round(d / t * 100) + '%'; }).then(function (r) {
      btn.disabled = false; btn.style.opacity = '';
      st.style.color = r.ok ? 'var(--green)' : 'var(--orange)';
      var ext = FISDATA.lazyNames().reduce(function (a, n) { return a + FISDATA.info().sets[n].rows; }, 0);
      st.textContent = r.ok ? '✅ Базы подключены: ' + r.rows.toLocaleString('ru-RU') + ' записей + базы ведомств (' + ext.toLocaleString('ru-RU') + ', подгружаются после входа)'
                            : '⚠️ Базы не загрузились (' + r.reason + ') — используются встроенные учебные данные.';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startDataLoad); else startDataLoad();
})();
