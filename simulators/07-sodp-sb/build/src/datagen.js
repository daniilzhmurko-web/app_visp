/* ============================================================
 * SODP_GEN — детерминированный генератор СИНТЕТИЧЕСКИХ данных для СОДП СБ.
 * Один и тот же код: (1) встроен в index.html как резервный источник данных,
 * (2) используется скриптом сборки для выгрузки db/*.js и docs/**.
 * Реальных персональных данных нет: ФИО, номера, события и документы вымышлены.
 * ============================================================ */
(function (root) {
  'use strict';
  const TR = {а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ы:'y',э:'e',ю:'yu',я:'ya',ь:'',ъ:''};
  const slug = id => String(id).toLowerCase().split('').map(c => TR[c] !== undefined ? TR[c] : c).join('').replace(/[^a-z0-9-]+/g, '-');
  const mkRng = seed => { let s = seed | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const util = rnd => ({
    pick: a => a[Math.floor(rnd() * a.length)],
    wpick: pairs => { let r = rnd() * pairs.reduce((x, p) => x + p[1], 0); for (const [v, w] of pairs) { if ((r -= w) < 0) return v; } return pairs[0][0]; },
    int: (a, b) => a + Math.floor(rnd() * (b - a + 1))
  });
  const shiftDate = (isoD, n) => { const d = new Date(isoD + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); const wd = d.getUTCDay(); if (wd === 6) d.setUTCDate(d.getUTCDate() + 2); if (wd === 0) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
  const addDays = (isoD, n) => { const d = new Date(isoD + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const span = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
  const series = (year, from, to, n) => Array.from({ length: n }, (_, i) => ({ year, no: i + 1, date: shiftDate(from, Math.round(i * span(from, to) / Math.max(1, n - 1))) }));
  const pad = (n, w) => String(n).padStart(w, '0');

  const SN = [['Абрамов','Абрамова'],['Беляев','Беляева'],['Васильев','Васильева'],['Воробьёв','Воробьёва'],['Гаврилов','Гаврилова'],['Голубев','Голубева'],['Данилов','Данилова'],['Дорофеев','Дорофеева'],['Егоров','Егорова'],['Елисеев','Елисеева'],['Жуков','Жукова'],['Захаров','Захарова'],['Ильин','Ильина'],['Исаев','Исаева'],['Калинин','Калинина'],['Киселёв','Киселёва'],['Колесников','Колесникова'],['Крылов','Крылова'],['Лазарев','Лазарева'],['Лебедев','Лебедева'],['Макаров','Макарова'],['Мельников','Мельникова'],['Назаров','Назарова'],['Никитин','Никитина'],['Орлов','Орлова'],['Осипов','Осипова'],['Павлов','Павлова'],['Пономарёв','Пономарёва'],['Рогов','Рогова'],['Савельев','Савельева'],['Сергеев','Сергеева'],['Тарасов','Тарасова'],['Устинов','Устинова'],['Фролов','Фролова'],['Хомяков','Хомякова'],['Цветков','Цветкова'],['Чернов','Чернова'],['Шестаков','Шестакова'],['Щербаков','Щербакова'],['Яковлев','Яковлева']];
  const FN_M = ['Александр','Андрей','Артём','Виктор','Владимир','Дмитрий','Евгений','Игорь','Максим','Михаил','Николай','Олег','Павел','Роман','Сергей','Юрий'];
  const PT_M = ['Александрович','Андреевич','Викторович','Владимирович','Дмитриевич','Евгеньевич','Игоревич','Михайлович','Николаевич','Олегович','Павлович','Сергеевич'];
  const FN_F = ['Анна','Екатерина','Елена','Ирина','Мария','Наталья','Ольга','Светлана','Татьяна','Юлия'];
  const PT_F = ['Александровна','Андреевна','Викторовна','Владимировна','Дмитриевна','Игоревна','Михайловна','Николаевна','Олеговна','Сергеевна'];
  const INI = 'АВГДЕИКЛМНОПРСТ'.split('');
  const DEPTS = ['Прикубанский РОВД','Карасунский РОВД','Центральный РОВД','Западный РОВД','пос. Калинино'];
  const POS = ['участковый уполномоченный','оперуполномоченный','инспектор ДПС','следователь','дознаватель','ст. лейтенант полиции','сержант полиции','лейтенант полиции','капитан полиции'];
  const CASE_CATS = [
    ['Превышение должностных полномочий', 22, 'Проверка по факту возможного превышения должностных полномочий при проведении мероприятий на территории подразделения.'],
    ['Получение взятки', 16, 'Проверка информации о получении денежного вознаграждения за совершение действий в интересах третьих лиц.'],
    ['Фальсификация материалов', 12, 'Проверка достоверности процессуальных документов, составленных сотрудником.'],
    ['Служебный проступок', 26, 'Служебная проверка по факту нарушения служебной дисциплины.'],
    ['Разглашение служебной тайны', 8, 'Проверка по факту возможной передачи служебной информации посторонним лицам.'],
    ['Утрата служебного удостоверения', 8, 'Служебная проверка по факту утраты служебного удостоверения.'],
    ['Нарушение правил хранения оружия', 8, 'Служебная проверка по факту нарушения порядка хранения и учёта табельного оружия.']
  ];
  const TASK_TITLES = ['Запросить характеристику на сотрудника','Провести опрос свидетеля','Запросить справку из подразделения','Подготовить проект заключения','Изучить материалы проверки','Запросить служебную переписку','Провести беседу с сотрудником','Подготовить запрос в информационный центр','Согласовать план проверки','Приобщить документы к материалам дела','Получить объяснение сотрудника','Проверить табель учёта рабочего времени'];
  const SEC_TPL = [
    ['Неудачная авторизация', 'Система СОДП СБ', 22], ['Попытка доступа', 'Дело', 26], ['Массовая выгрузка данных', 'Реестр дел', 12],
    ['Редактирование задним числом', 'Дело', 10], ['Вход в нерабочее время', 'Система СОДП СБ', 18], ['Подбор пароля', 'Система СОДП СБ', 6], ['Использование чужой сессии', 'Система СОДП СБ', 6]
  ];
  const ATT = ['Копия заявления','Скриншот переписки','Аудиозапись разговора','Видеозапись','Почтовые квитанции','Копия протокола'];
  const TOPICS = [
    ['Превышение полномочий участковым','ДП','ОСБ','Гражданин сообщает о неправомерных действиях участкового уполномоченного при проверке по месту жительства.'],
    ['Грубое обращение при составлении протокола','ДП','ОСБ','Жалоба на грубость и нарушение служебной этики при составлении административного материала.'],
    ['Бездействие при рассмотрении заявления','ДП','ОСБ','Заявитель указывает на непринятие процессуального решения по заявлению в установленный срок.'],
    ['Нарушение сроков рассмотрения обращения','ДП','ОСБ','Ответ на ранее поданное обращение не получен по истечении 30 дней.'],
    ['Необоснованное задержание','ДП','ОСБ','Заявитель считает задержание необоснованным и просит проверить законность действий сотрудников.'],
    ['Отказ в приёме заявления о преступлении','ДП','ОСБ','Дежурная часть отказала в регистрации заявления без оформления процессуального решения.'],
    ['Требование взятки сотрудником ДПС','КОР','ГУСБ','Заявитель сообщает о требовании денежного вознаграждения за непривлечение к ответственности.'],
    ['Вымогательство при оформлении ДТП','КОР','ГУСБ','Сообщается о требовании денег за оформление документов по дорожно-транспортному происшествию.'],
    ['Предложение «решить вопрос» за вознаграждение','КОР','ГУСБ','Заявитель сообщает о намёках на необходимость передачи денежных средств за положительное решение.'],
    ['Использование служебного положения в личных целях','КОР','ГУСБ','Указывается на использование служебного транспорта и должностных возможностей в личных интересах.'],
    ['Разглашение персональных данных заявителя','ИБ','ОСБ','Заявитель сообщает, что сведения из его заявления стали известны посторонним лицам.'],
    ['Несанкционированный доступ к служебным базам','ИБ','ОСБ','Поступил сигнал о возможном использовании служебных учётных данных не по назначению.'],
    ['Утрата материалов проверки','ИБ','ОСБ','Заявитель сообщает об утрате приложенных к материалу документов.'],
    ['Нарушение порядка личного досмотра','ДП','ОСБ','Жалоба на проведение досмотра без понятых и без составления протокола.'],
    ['Нарушение порядка изъятия имущества','ДП','ОСБ','Заявитель указывает, что изъятие вещей не было надлежащим образом оформлено.'],
    ['Несоблюдение служебной этики','ДП','ОСБ','Жалоба на некорректное поведение сотрудника при общении с гражданами.'],
    ['Оперативное сопровождение без достаточных оснований','ОРМ','ГУСБ','Заявитель считает, что в отношении него проводятся мероприятия без законных оснований.'],
    ['Отказ в предоставлении информации о ходе проверки','ДП','ОСБ','Сотрудник отказал заявителю в информировании о результатах рассмотрения обращения.'],
    ['Некорректные действия при задержании','ДП','ОСБ','Сообщается о неоправданном применении физической силы при задержании.'],
    ['Подозрение на фальсификацию объяснений','ДП','ОСБ','Заявитель утверждает, что подписанные им объяснения были изменены после подписания.']
  ];
  const CAND_POS = ['Участковый уполномоченный','Следователь','Инспектор ДПС','Инспектор по делам несовершеннолетних','Оперуполномоченный','Дознаватель'];

  /* ---------------- обращения граждан: 1008 записей ---------------- */
  function genComplaints(DB, todayISO) {
    const rnd = mkRng(20241130), { pick, wpick } = util(rnd);
    const ini = () => pick(INI) + '.' + pick(INI) + '.';
    const items = []
      .concat(series(2022, '2022-09-05', '2022-12-26', 142))
      .concat(series(2023, '2023-01-09', '2023-12-26', 405))
      .concat(series(2024, '2024-01-09', '2024-11-08', 437))
      .concat([439,440,441,442,443,444].map((no,i)=>({year:2024,no,date:['2024-11-13','2024-11-14','2024-11-15','2024-11-18','2024-11-19','2024-11-19'][i]})))
      .concat([446,447,448,449,450].map((no,i)=>({year:2024,no,date:['2024-11-21','2024-11-22','2024-11-25','2024-11-26','2024-11-27'][i]})))
      .concat([452,453,454,455,456,457,458,459,460].map((no,i)=>({year:2024,no,date:i<3?'2024-11-28':'2024-11-29'})));
    const gen = items.map(it => {
      const [subject, cls, jur0, desc] = pick(TOPICS);
      const kind = wpick([['p',78],['a',12],['l',5],['pr',5]]);
      const sn = pick(SN); const fem = rnd() < 0.5;
      let source, channel;
      if (kind === 'p') { source = `Заявитель ${fem ? sn[1] : sn[0]} ${ini()}`; channel = wpick([['Личный приём',22],['Горячая линия МВД',20],['Официальный сайт МВД',25],['Письменное обращение',23],['Электронная почта',10]]); }
      else if (kind === 'a') { source = 'Анонимный'; channel = wpick([['Горячая линия МВД',60],['Официальный сайт МВД',40]]); }
      else if (kind === 'l') { source = `Адвокат ${sn[0]} ${ini()}`; channel = wpick([['Письменное обращение',70],['Электронная почта',30]]); }
      else { source = 'Прокуратура (переадресация)'; channel = 'Письменное обращение'; }
      const age = span(it.date, todayISO);
      const status = age <= 2 ? wpick([['registered',70],['in-progress',30]]) : age <= 14 ? wpick([['registered',10],['in-progress',60],['closed',30]]) : age <= 60 ? wpick([['in-progress',25],['closed',75]]) : wpick([['in-progress',3],['closed',97]]);
      const accused = rnd() < 0.78 ? `${pick(SN)[0]} ${ini()}` : 'Не установлен';
      const nAtt = wpick([[0,35],[1,45],[2,20]]); const attachments = [];
      while (attachments.length < nAtt) { const a = pick(ATT); if (!attachments.includes(a)) attachments.push(a); }
      return { id: `ОГ-${it.year}-${pad(it.no,4)}`, date: it.date, source, channel, subject, dept: pick(DEPTS), officer: accused, status,
        priority: cls === 'КОР' ? 'high' : wpick([['medium',60],['low',25],['high',15]]),
        jurisdiction: rnd() < 0.03 ? 'Иное подразделение' : jur0, classification: cls, description: desc, attachments };
    });
    // Пары-дубликаты (для учебных миссий): тот же заявитель и предмет в течение 2 недель
    for (let k = 0; k < 12; k++) {
      const base = gen[20 + k * 60]; const dup = gen[20 + k * 60 + 1 + (k % 3)];
      if (!base || !dup || base.id === dup.id) continue;
      dup.source = base.source; dup.subject = base.subject; dup.dept = base.dept; dup.classification = base.classification; dup.description = base.description; dup.channel = base.channel;
      dup.dupOf = base.id;
    }
    for (let k = 0; k < 8; k++) { const g = gen[40 + k * 95]; if (g) { g.jurisdiction = 'Иное подразделение'; g.status = 'in-progress'; } }
    gen.filter(g => g.dupOf).forEach(g => { g.status = 'in-progress'; });
    DB.complaints = DB.complaints.concat(gen).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }

  /* ---------------- дела ---------------- */
  function genCases(DB, todayISO) {
    const rnd = mkRng(777001), { pick, wpick, int } = util(rnd);
    const officers = DB.users.map(u => { const p = u.name.split(' '); return `${p[0]} ${p[1][0]}.${p[2][0]}.`; });
    const anchors = [[260,'2024-10-01'],[271,'2024-10-10'],[285,'2024-10-20'],[298,'2024-11-01'],[301,'2024-11-08'],[312,'2024-11-15'],[348,'2024-11-28'],[351,'2024-11-30']];
    const have = new Set(DB.cases.map(c => c.id)); const gap = [];
    for (let no = 261; no <= 350; no++) {
      if (have.has(`ГУСБ-2024-${pad(no,4)}`)) continue;
      let a = anchors[0], b = anchors[1];
      for (let i = 0; i < anchors.length - 1; i++) { if (no >= anchors[i][0] && no <= anchors[i+1][0]) { a = anchors[i]; b = anchors[i+1]; break; } }
      gap.push({ year: 2024, no, date: shiftDate(a[1], Math.round((no - a[0]) / (b[0] - a[0]) * span(a[1], b[1]))) });
    }
    const items = series(2023, '2023-01-09', '2023-12-27', 180).concat(series(2024, '2024-01-09', '2024-09-30', 259)).concat(gap);
    const gen = items.map(it => {
      const cat = wpick(CASE_CATS.map(c => [c, c[1]]));
      const sn = pick(SN); const ini = pick(INI) + '.' + pick(INI) + '.';
      const age = span(it.date, todayISO);
      const status = age > 120 ? wpick([['archived',55],['closed',45]]) : age > 60 ? wpick([['closed',60],['archived',15],['in-progress',15],['approval',10]])
        : age > 20 ? wpick([['in-progress',40],['review',20],['approval',10],['closed',30]]) : wpick([['registered',20],['draft',5],['in-progress',50],['review',25]]);
      return { id: `ГУСБ-${it.year}-${pad(it.no,4)}`, date: it.date, subject: `${sn[0]} ${ini}, ${pick(POS)}`, category: cat[0], officer: pick(officers),
        deadline: addDays(it.date, int(30, 60)), status, priority: wpick([['medium',55],['low',25],['high',20]]), dept: pick(DEPTS), description: cat[2] };
    });
    DB.cases = DB.cases.concat(gen).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }

  /* ---------------- кандидаты ---------------- */
  function genCandidates(DB, todayISO) {
    const rnd = mkRng(555002), { pick, wpick, int } = util(rnd);
    const officers = DB.users.map(u => { const p = u.name.split(' '); return `${p[0]} ${p[1][0]}.${p[2][0]}.`; });
    const taken = new Set(DB.candidates.map(c => c.id));
    const items = series(2022, '2022-02-07', '2022-12-26', 61).concat(series(2023, '2023-01-09', '2023-12-26', 150)).concat(series(2024, '2024-01-09', '2024-10-28', 87)).filter(it => !taken.has(`КАН-${it.year}-${pad(it.no,4)}`));
    const gen = items.map(it => {
      const fem = rnd() < 0.2; const sn = pick(SN);
      const fio = fem ? `${sn[1]} ${pick(FN_F)} ${pick(PT_F)}` : `${sn[0]} ${pick(FN_M)} ${pick(PT_M)}`;
      const age = span(it.date, todayISO);
      const status = age > 60 ? wpick([['recommended',68],['not-recommended',20],['approval',2],['review',2],['recommended',8]]) : age > 25 ? wpick([['recommended',40],['not-recommended',14],['review',26],['approval',12],['pending',8]]) : wpick([['pending',40],['review',40],['approval',12],['recommended',8]]);
      const checks = { criminal:false, property:false, relatives:false, social:false, medical:false };
      let recommendation = null, notes = 'Запрос принят. Проверка не начата.', flag = null;
      const done = status === 'recommended' || status === 'not-recommended';
      if (done) { Object.keys(checks).forEach(k => checks[k] = true); }
      else if (status === 'approval') { Object.keys(checks).forEach(k => checks[k] = true); }
      else if (status === 'review') { checks.criminal = true; checks.property = rnd() < 0.6; checks.relatives = rnd() < 0.3; }
      if (status === 'recommended') { recommendation = wpick([['Рекомендован',88],['Рекомендован с условиями',12]]); notes = recommendation === 'Рекомендован' ? 'Проверка завершена. Компрометирующих материалов не выявлено.' : 'Проверка завершена. Рекомендован при условии прохождения дополнительного собеседования.'; }
      if (status === 'not-recommended') { recommendation = fem ? 'Не рекомендована' : 'Не рекомендован'; notes = pick(['Выявлены непогашенные долговые обязательства.','Выявлены сведения о ранее привлечении к ответственности, не указанные в анкете.','Родственник является фигурантом уголовного дела.','Не пройдена психофизиологическая диагностика.']); }
      if (status === 'approval') { recommendation = 'Рекомендован'; notes = 'Заключение подготовлено и направлено на утверждение.'; }
      if ((status === 'pending' && rnd() < 0.35) || (status === 'review' && rnd() < 0.1)) { flag = 'relative_conflict'; notes = 'В ходе первичного опроса кандидат указал близкого родственника, который проходит по служебной проверке. Требуется оценка конфликта интересов.'; }
      return { id: `КАН-${it.year}-${pad(it.no,4)}`, fio, dob: `${int(1982, 2003)}-${pad(int(1,12),2)}-${pad(int(1,28),2)}`, position: pick(CAND_POS), dept: pick(DEPTS), status, requestDate: it.date,
        officer: pick(officers), checks, recommendation, notes, ...(flag ? { flag } : {}) };
    });
    gen.filter(c => c.status === 'pending' && !c.flag).slice(0, 6).forEach(c => { c.flag = 'relative_conflict'; c.notes = 'В ходе первичного опроса кандидат указал близкого родственника, который проходит по служебной проверке. Требуется оценка конфликта интересов.'; });
    DB.candidates = DB.candidates.concat(gen).sort((a, b) => b.requestDate.localeCompare(a.requestDate) || b.id.localeCompare(a.id));
  }

  /* ---------------- задания ---------------- */
  function genTasks(DB, todayISO) {
    const rnd = mkRng(333003), { pick, wpick, int } = util(rnd);
    const officers = DB.users.map(u => { const p = u.name.split(' '); return `${p[0]} ${p[1][0]}.${p[2][0]}.`; });
    const byYear = y => DB.cases.filter(c => c.id.startsWith('ГУСБ-' + y + '-') && c.subject);
    const mk = (year, n, from, to) => series(year, from, to, n).map(it => {
      const pool = byYear(year); const cs = rnd() < 0.9 ? pick(pool) : null;
      const deadline = addDays(cs ? cs.date : it.date, int(7, 40));
      const past = deadline < todayISO;
      let status;
      if (cs && (cs.status === 'closed' || cs.status === 'archived')) status = 'completed';
      else if (past) status = 'completed';
      else status = wpick([['new',15],['assigned',30],['in-progress',40],['awaiting',15]]);
      return { id: `ЗД-${it.year}-${pad(it.no,3)}`, title: pick(TASK_TITLES) + (cs ? ` по делу ${cs.id}` : ''), case: cs ? cs.id : null, officer: pick(officers), deadline, status, priority: wpick([['medium',55],['low',25],['high',20]]) };
    });
    let gen = mk(2023, 90, '2023-01-16', '2023-12-20').concat(mk(2024, 88, '2024-01-16', '2024-11-20'));
    // Гарантированно несколько просроченных заданий (для миссий по контролю сроков)
    const cand = gen.filter(t => t.id.startsWith('ЗД-2024-') && t.status !== 'completed' && t.deadline >= todayISO);
    cand.slice(0, 6).forEach((t, i) => { t.status = 'overdue'; t.deadline = addDays(todayISO, -(3 + i * 4)); t.priority = i % 2 ? 'high' : 'medium'; });
    if (cand.length < 6) { gen.filter(t => t.id.startsWith('ЗД-2024-')).slice(-(6 - cand.length)).forEach((t, i) => { t.status = 'overdue'; t.deadline = addDays(todayISO, -(2 + i * 3)); }); }
    DB.tasks = DB.tasks.concat(gen);
  }

  /* ---------------- события ИБ ---------------- */
  function genSecurity(DB, todayISO) {
    const rnd = mkRng(999004), { pick, wpick, int } = util(rnd);
    const users = DB.users.map(u => u.id);
    const mk = (year, n, from, to) => series(year, from, to, n).map(it => {
      const tpl = wpick(SEC_TPL.map(t => [t, t[2]]));
      const action = tpl[0], isAuth = ['Неудачная авторизация','Подбор пароля','Вход в нерабочее время'].includes(action);
      const user = (action === 'Неудачная авторизация' || action === 'Подбор пароля') && rnd() < 0.6 ? 'unknown' : pick(users);
      const cs = pick(DB.cases);
      const object = tpl[1] === 'Дело' ? `Дело ${cs.id}` : tpl[1] === 'Реестр дел' ? `Реестр дел ${it.year}` : tpl[1];
      const severity = action === 'Подбор пароля' || action === 'Использование чужой сессии' ? 'critical' : action === 'Попытка доступа' || action === 'Редактирование задним числом' ? wpick([['high',60],['medium',40]]) : wpick([['medium',75],['high',15],['critical',10]]);
      const n = int(3, 9); const rows = int(20, 400);
      const details = { 'Неудачная авторизация': `Зафиксировано ${n} неудачных попыток входа подряд.`, 'Попытка доступа': 'Пользователь не имеет права доступа к указанному объекту.', 'Массовая выгрузка данных': `Выгружено ${rows} записей без служебного поручения.`, 'Редактирование задним числом': 'Попытка изменить дату документа на более раннюю.', 'Вход в нерабочее время': 'Вход выполнен в нерабочее время с неслужебного рабочего места.', 'Подбор пароля': `Обнаружен перебор паролей (${n * 7} попыток за 5 минут).`, 'Использование чужой сессии': 'Обнаружена одновременная активность одной учётной записи с двух адресов.' }[action];
      return { id: `ИБ-${it.year}-${pad(it.no,4)}`, time: `${it.date} ${pad(int(7,22),2)}:${pad(int(0,59),2)}`, user, action, object, result: severity === 'critical' ? 'Заблокирован' : action === 'Попытка доступа' || action === 'Редактирование задним числом' ? 'Запрещён' : 'Зафиксирован', severity, ip: `${pick(['192.168.1','10.0.0'])}.${int(2,250)}`, details };
    });
    const gen = mk(2022, 100, '2022-02-01', '2022-12-23').concat(mk(2023, 185, '2023-01-09', '2023-12-27')).concat(mk(2024, 11, '2024-02-05', '2024-11-12'));
    DB.securityEvents = DB.securityEvents.concat(gen).sort((a, b) => b.time.localeCompare(a.time));
  }

  /* ---------------- индекс документов ---------------- */
  const CASE_KINDS = [['zayavlenie','Заявление / обращение'],['obyasn','Объяснение сотрудника'],['protokol','Протокол опроса'],['zapros','Запрос в подразделение'],['otvet','Ответ на запрос'],['spravka','Справка по результатам проверки']];
  function genDocuments(DB, todayISO) {
    const rnd = mkRng(424242), { pick, int } = util(rnd);
    const docs = []; let seq = 0;
    const add = (owner, rec, kind, title, minDate, author) => {
      seq++; const slugId = slug(rec.id); const idx = docs.filter(d => d.ownerId === rec.id).length + 1;
      let date = addDays(minDate, int(0, 12)); if (date > todayISO) date = todayISO;
      docs.push({ id: `DOC-${pad(seq,6)}`, owner, ownerId: rec.id, kind, title, date, author, path: `docs/${owner === 'case' ? 'cases' : owner === 'complaint' ? 'complaints' : 'candidates'}/${slugId}/${pad(idx,2)}-${kind}.html` });
    };
    DB.cases.forEach(cs => {
      add('case', cs, 'prikaz', 'Приказ о проведении проверки', cs.date, 'Канцелярия');
      add('case', cs, 'rapport', 'Рапорт о выявленных обстоятельствах', cs.date, cs.officer);
      const extra = int(0, 3); const pool = CASE_KINDS.slice();
      for (let i = 0; i < extra; i++) { const k = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; add('case', cs, k[0], k[1], cs.date, cs.officer); }
      if (['review','approval','closed','archived'].includes(cs.status)) add('case', cs, 'zaklyuchenie', 'Заключение по материалам проверки', cs.date, cs.officer);
    });
    DB.complaints.forEach(cp => {
      add('complaint', cp, 'obrashenie', 'Текст обращения', cp.date, 'Канцелярия');
      (cp.attachments || []).filter(a => !/Аудио|Видео/.test(a)).forEach(a => add('complaint', cp, 'prilozhenie', 'Приложение: ' + a, cp.date, 'Заявитель'));
      if (cp.status === 'closed') add('complaint', cp, 'otvet_zayavitelyu', 'Ответ заявителю', cp.date, 'Канцелярия');
    });
    DB.candidates.forEach(cn => {
      add('candidate', cn, 'anketa', 'Анкета кандидата', cn.requestDate, cn.officer);
      if (cn.checks.criminal) add('candidate', cn, 'spravka_ic', 'Справка ИЦ о наличии (отсутствии) судимости', cn.requestDate, 'ИЦ ГУ МВД');
      if (cn.checks.property) add('candidate', cn, 'spravka_dohod', 'Справка о доходах и имуществе', cn.requestDate, cn.officer);
      if (cn.checks.relatives) add('candidate', cn, 'rodstvenniki', 'Сведения о близких родственниках', cn.requestDate, cn.officer);
      if (cn.checks.medical) add('candidate', cn, 'vvk', 'Заключение военно-врачебной комиссии', cn.requestDate, 'ВВК');
      if (cn.recommendation) add('candidate', cn, 'zaklyuchenie_kand', 'Заключение по результатам проверки', cn.requestDate, cn.officer);
    });
    DB.documents = docs;
  }

  /* ---------------- рендер документа (HTML) ---------------- */
  const DOC_CSS = 'body{font:14px/1.6 "Times New Roman",Georgia,serif;color:#111;max-width:720px;margin:28px auto;padding:0 28px;background:#fff}.hd{text-align:center;border-bottom:2px solid #0F1C3A;padding-bottom:8px;margin-bottom:18px}.hd b{display:block;font-size:13px;letter-spacing:.06em;color:#0F1C3A}.hd span{font-size:11px;color:#555}h1{font-size:18px;text-align:center;margin:18px 0 4px}.reg{text-align:center;color:#555;font-size:12px;margin-bottom:18px}p{margin:0 0 10px;text-align:justify;text-indent:1.5em}.sign{margin-top:28px;display:flex;justify-content:space-between;font-size:13px}.foot{margin-top:34px;border-top:1px solid #ccc;padding-top:6px;font:11px Arial,sans-serif;color:#888}.resolution{border:1px solid #111;border-radius:4px;padding:8px 14px;margin:26px 0 12px 40px;max-width:540px;font:13px/1.5 Arial,Helvetica,sans-serif}.ukep{display:flex;align-items:center;gap:16px;border:1px solid #111;border-radius:4px;padding:10px 18px 10px 14px;width:max-content;max-width:100%;margin:6px 0 4px;font:11px/1.45 Arial,Helvetica,sans-serif;color:#111}.ukep img{width:74px;height:auto;flex-shrink:0}.ukep-t{font-size:12.5px;font-weight:700;letter-spacing:.01em;margin-bottom:3px}.ukep-o{font-weight:700;font-size:11.5px}.photo{float:right;width:96px;height:128px;object-fit:cover;border:1px solid #bbb;margin:0 0 10px 18px}';
  const ru = d => d ? d.split('-').reverse().join('.') : '—';
  const SIL = "data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 96 128%27><rect width=%2796%27 height=%27128%27 fill=%27%23E3E8F2%27/><circle cx=%2748%27 cy=%2748%27 r=%2720%27 fill=%27%238FA0C0%27/><path d=%27M12 128c2-30 20-42 36-42s34 12 36 42z%27 fill=%27%238FA0C0%27/></svg>";
  function bodyFor(doc, rec) {
    const R = rec || {};
    const who = R.subject || R.fio || R.source || '—';
    const T = {
      prikaz: [`В соответствии с положениями ведомственных нормативных актов назначить проверку по материалу № ${doc.ownerId} (${R.category || 'служебная проверка'}).`, `Проведение проверки поручить: ${R.officer || '—'}. Срок проведения — до ${ru(R.deadline)}.`, 'Контроль за исполнением приказа оставляю за собой.'],
      rapport: [`Докладываю, что в ходе работы выявлены обстоятельства, требующие проверки в отношении: ${who}.`, `${R.description || 'Описание обстоятельств приведено в материалах дела.'}`, 'Прошу разрешить проведение служебной проверки и истребовать необходимые документы.'],
      zayavlenie: ['Настоящим сообщаю об обстоятельствах, послуживших основанием для проверки, и прошу рассмотреть материал в установленном порядке.', `${R.description || ''}`],
      obyasn: [`Я, ${who}, по существу заданных вопросов сообщаю следующее.`, 'Обстоятельства, изложенные в рапорте, мне известны. Свои действия считаю соответствующими служебным обязанностям. Дополнительные документы готов представить по запросу.'],
      protokol: ['Опрос проведён в служебном кабинете в присутствии двух должностных лиц. Права и обязанности опрашиваемому разъяснены.', 'Опрашиваемый пояснил, что обстоятельства, изложенные в материале, ему известны частично; подтвердил свою подпись под ранее данными объяснениями.'],
      zapros: [`Прошу в срок до ${ru(addDays(doc.date, 10))} представить справку и заверенные копии документов, необходимых для проверки по материалу № ${doc.ownerId}.`, 'Ответ направить в адрес подразделения собственной безопасности.'],
      otvet: ['На Ваш запрос сообщаем, что запрошенные сведения подготовлены и приложены к настоящему ответу.', 'Документы заверены в установленном порядке.'],
      spravka: [`По результатам проведённых мероприятий по материалу № ${doc.ownerId} установлено следующее.`, 'Доводы, изложенные в обращении, частично подтверждены представленными документами и объяснениями. Дополнительные сведения приобщены к материалам.'],
      zaklyuchenie: [`По результатам проверки по материалу № ${doc.ownerId} (${R.category || ''}) установлено, что выявленные обстоятельства подтверждены документами и объяснениями.`, 'С учётом изложенного предлагается принять решение в соответствии с установленным порядком и довести результаты до руководства.'],
      obrashenie: [`Обращение поступило по каналу «${R.channel || '—'}» от: ${R.source || '—'}.`, `Предмет обращения: ${R.subject || '—'}.`, `${R.description || ''}`],
      prilozhenie: [`Приложение к обращению № ${doc.ownerId}.`, 'Копия представлена заявителем. Подлинность документа подлежит проверке.'],
      otvet_zayavitelyu: [`Уважаемый заявитель! Ваше обращение № ${doc.ownerId} рассмотрено.`, 'По результатам рассмотрения проведена проверка, о результатах сообщено в установленном порядке. Разъяснено право обжалования.'],
      anketa: [`Кандидат: ${R.fio || '—'}, дата рождения: ${ru(R.dob)}.`, `Претендует на должность: ${R.position || '—'} (${R.dept || '—'}).`, 'Анкета заполнена кандидатом собственноручно; согласие на проверку получено.'],
      spravka_ic: ['Информационный центр сообщает: сведения о наличии судимости, а также о привлечении к уголовной ответственности на момент запроса в отношении кандидата не установлены.'],
      spravka_dohod: ['Представлены сведения о доходах, расходах и имуществе кандидата и членов его семьи за последний отчётный период. Существенных расхождений не выявлено.'],
      rodstvenniki: ['Установлен круг близких родственников кандидата. Сведения проверены по учётам подразделения.', R.flag === 'relative_conflict' ? 'ВНИМАНИЕ: один из родственников проходит по служебной проверке — требуется оценка конфликта интересов.' : 'Обстоятельств, указывающих на конфликт интересов, не выявлено.'],
      vvk: ['Военно-врачебная комиссия признала кандидата годным к службе в указанной должности.'],
      zaklyuchenie_kand: [`По результатам проверки кандидата ${R.fio || '—'} принято решение: ${R.recommendation || 'заключение формируется'}.`, `${R.notes || ''}`]
    };
    return (T[doc.kind] || ['Содержание документа приведено в материалах дела.']).filter(Boolean);
  }

  /* ---------------- подписи: УКЭП и резолюции ---------------- */
  const ROSTER = [
    { short: 'Иванов О.П.', full: 'Иванов Олег Петрович', rank: 'Майор полиции', pos: 'оперуполномоченный' },
    { short: 'Соколова В.Н.', full: 'Соколова Вера Николаевна', rank: 'Подполковник полиции', pos: 'старший оперуполномоченный' },
    { short: 'Петров А.В.', full: 'Петров Алексей Васильевич', rank: 'Капитан полиции', pos: 'оперуполномоченный' },
    { short: 'Ковалёв Д.М.', full: 'Ковалёв Дмитрий Михайлович', rank: 'Полковник полиции', pos: 'начальник отдела' },
    { short: 'Зайцева О.Л.', full: 'Зайцева Ольга Леонидовна', rank: 'Майор полиции', pos: 'аналитик' },
    { short: 'Морозов С.Г.', full: 'Морозов Сергей Геннадьевич', rank: 'Подполковник полиции', pos: 'офицер ИБ' }
  ];
  const BOSS = ROSTER[3];
  const OTHERS = {
    'Канцелярия': { full: 'Лебедева Анна Сергеевна', pos: 'начальник канцелярии' },
    'ИЦ ГУ МВД': { full: 'Жуков Павел Андреевич', pos: 'начальник информационного центра' },
    'ВВК': { full: 'Савельев Андрей Игоревич', pos: 'председатель военно-врачебной комиссии' }
  };
  const hexOf = (str, n) => { let out = ''; for (let k = 0; out.length < n; k++) { let h = 2166136261 ^ (k * 977); for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } out += (h >>> 0).toString(16).toUpperCase().padStart(8, '0'); } return out.slice(0, n); };
  const initFirst = full => { const p = full.split(' '); return `${p[1][0]}.${p[2][0]}. ${p[0]}`; };
  const NO_SIGN = ['prilozhenie', 'obyasn'];
  function resolutionFor(doc, rec) {
    const st = (rec && rec.status) || '';
    const T = {
      rapport: 'Принять в исполнение. Служебную проверку провести в установленный срок, о результатах доложить.',
      zayavlenie: 'Принять к рассмотрению. Исполнителю доложить о результатах в установленный срок.',
      obrashenie: 'Зарегистрировать. Рассмотреть в установленный срок, о результатах уведомить заявителя.',
      zapros: 'Согласовано. Направить в установленном порядке.',
      otvet_zayavitelyu: 'Ответ согласован. Направить заявителю.',
      anketa: 'Принять к проверке. Проверку провести в установленный срок.',
      zaklyuchenie: ['approval', 'closed', 'archived'].includes(st) ? 'Заключение утверждаю. Решение довести до исполнителей.' : null,
      zaklyuchenie_kand: ['approval', 'recommended', 'not-recommended'].includes(st) ? 'С заключением согласен. Утверждаю.' : null
    };
    return T[doc.kind] || null;
  }
  function signerFor(doc, hasRes) {
    if (NO_SIGN.includes(doc.kind)) return null;
    if (hasRes || doc.kind === 'prikaz') return { full: BOSS.full, pos: BOSS.pos };
    const r = ROSTER.find(x => x.short === doc.author); if (r) return { full: r.full, pos: r.pos };
    return OTHERS[doc.author] || { full: BOSS.full, pos: BOSS.pos };
  }
  function signBlocks(doc, rec, emblem) {
    const res = resolutionFor(doc, rec), sg = signerFor(doc, !!res);
    if (!res && !sg) return '';
    const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
    let out = '';
    if (res) out += `<div class="resolution"><b>Резолюция:</b> ${esc(res)}<br>${esc(BOSS.pos.charAt(0).toUpperCase() + BOSS.pos.slice(1))} ${esc(initFirst(BOSS.full))}</div>`;
    if (sg) {
      const from = addDays(doc.date, -45), to = addDays(doc.date, 455);
      out += `<div class="ukep"><img src="${esc(emblem)}" alt=""><div><div class="ukep-t">ДОКУМЕНТ ПОДПИСАН<br>ЭЛЕКТРОННОЙ ПОДПИСЬЮ</div><div>Сертификат<br>${hexOf(doc.id + sg.full, 32)}</div><div class="ukep-o">Владелец ${esc(sg.full)}</div><div>Действителен с ${ru(from)} по ${ru(to)}</div></div></div>`;
    }
    return out;
  }

  function renderDoc(doc, rec, opts) {
    opts = opts || {};
    const css = opts.inlineCss ? `<style>${DOC_CSS}</style>` : '<link rel="stylesheet" href="../../_assets/doc.css">';
    const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
    return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${esc(doc.title)} — ${esc(doc.ownerId)}</title>${css}</head><body>
<div class="hd"><b>МВД РОССИИ · ПОДРАЗДЕЛЕНИЕ СОБСТВЕННОЙ БЕЗОПАСНОСТИ</b><span>СОДП СБ · учебный документ</span></div>
${doc.kind === 'anketa' ? `<img class="photo" src="${esc((opts.photoBase || '../../../photos/') + slug(doc.ownerId) + '.jpg')}" alt="" onerror="this.onerror=null;this.src='${SIL}'">` : ''}<h1>${esc(doc.title)}</h1><div class="reg">№ ${esc(doc.id)} · материал ${esc(doc.ownerId)} · от ${ru(doc.date)}</div>
${bodyFor(doc, rec).map(p => `<p>${esc(p)}</p>`).join('\n')}
<div class="sign"><span>${esc(doc.author)}</span><span>${ru(doc.date)}</span></div>
${signBlocks(doc, rec, opts.emblemUrl || '../../_assets/emblem.png')}
<div class="foot">Учебный тренажёр СОДП СБ. Все данные и документ вымышлены; совпадения случайны.</div></body></html>`;
  }


  /* ---------------- внешние учёты (синтетика): ИЦ, ФНС, Росреестр, ЗАГС, ФССП ---------------- */
  function genRegistries(DB, todayISO) {
    const rnd = mkRng(135791), { pick, wpick, int } = util(rnd);
    const reg = { ic: [], fns: [], egrn: [], zags: [], fssp: [] };
    const iso = (y, m, d) => `${y}-${pad(m,2)}-${pad(d,2)}`;
    const rdate = (y1, y2) => iso(int(y1, y2), int(1, 12), int(1, 28));
    const caseSubj = DB.cases.filter(c => ['registered','in-progress','review','approval'].includes(c.status) && c.subject);
    DB.candidates.forEach(cn => {
      const bad = cn.status === 'not-recommended';
      // ИЦ / ИБД-Ф
      if ((bad && /привлечен/.test(cn.notes || '')) || rnd() < 0.06) reg.ic.push({ cand: cn.id, kind: 'Административное правонарушение', article: pick(['ст. 12.9 КоАП РФ','ст. 20.1 КоАП РФ','ст. 19.3 КоАП РФ']), date: rdate(2015, 2022), result: 'Штраф оплачен' });
      if (rnd() < 0.015) reg.ic.push({ cand: cn.id, kind: 'Судимость', article: pick(['ст. 158 УК РФ','ст. 119 УК РФ']), date: rdate(2008, 2014), result: 'Погашена' });
      // ФНС: доходы за три года
      const base = int(480, 1500) * 1000, employer = pick(['ООО «Югторг»','АО «Кубаньагро»','ИП Беляев','ГБУЗ «Городская поликлиника»','ООО «Краснодарстрой»']);
      [2021, 2022, 2023].forEach((y, i) => reg.fns.push({ cand: cn.id, year: y, income: Math.round(base * (1 + i * 0.07 + (rnd() - 0.5) * 0.1) / 1000) * 1000, employer }));
      // Росреестр
      const n = wpick([[0,35],[1,40],[2,20],[3,5]]);
      for (let i = 0; i < n; i++) reg.egrn.push({ cand: cn.id, object: pick(['Квартира','Земельный участок','Гараж','Жилой дом']), area: int(18, 120), share: pick(['1/1','1/2','1/3']), date: rdate(2005, 2023), address: 'г. Краснодар' });
      // ЗАГС: семейное положение и родственники
      const marital = pick(['женат / замужем','не состоит в браке','разведён / разведена']);
      const sn = pick(SN);
      const rel = [['отец', `${sn[0]} ${pick(FN_M)} ${pick(PT_M)}`], ['мать', `${sn[1]} ${pick(FN_F)} ${pick(PT_F)}`]];
      if (rnd() < 0.5) rel.push([pick(['брат','сестра']), `${sn[0]} ${pick(FN_M)} ${pick(PT_M)}`]);
      rel.forEach((r, i) => reg.zags.push({ cand: cn.id, degree: r[0], fio: r[1], marital: i === 0 ? marital : undefined, note: '' }));
      if (cn.flag === 'relative_conflict' && caseSubj.length) {
        const cs = pick(caseSubj);
        reg.zags.push({ cand: cn.id, degree: pick(['брат','двоюродный брат','тесть','дядя']), fio: cs.subject.split(',')[0], caseId: cs.id, note: 'Является фигурантом служебной проверки ' + cs.id });
      }
      // ФССП
      if (bad && /долгов/.test(cn.notes || '')) { for (let i = 0; i < int(1, 2); i++) reg.fssp.push({ cand: cn.id, number: `${int(10000,99999)}/${pick(['22','23','24'])}/23049-ИП`, amount: int(18, 90) * 10000, status: 'Не погашено', subject: pick(['Кредитная задолженность','Задолженность по налогам','Алименты']) }); }
      else if (rnd() < 0.07) reg.fssp.push({ cand: cn.id, number: `${int(10000,99999)}/22/23049-ИП`, amount: int(3, 25) * 1000, status: 'Погашено', subject: 'Штраф ГИБДД' });
    });
    DB.registries = reg;
  }

  function extend(DB, opts) {
    const todayISO = (opts && opts.todayISO) || '2024-11-30';
    genComplaints(DB, todayISO); genCases(DB, todayISO); genCandidates(DB, todayISO); genTasks(DB, todayISO); genSecurity(DB, todayISO); genDocuments(DB, todayISO); genRegistries(DB, todayISO);
    return DB;
  }
  root.SODP_GEN = { extend, genRegistries, renderDoc, slug, DOC_CSS, addDays };
})(typeof window !== 'undefined' ? window : globalThis);
