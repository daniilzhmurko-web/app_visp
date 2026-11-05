'use strict';
/* =====================================================
   ЭТАП 1 — STATE MACHINE (машина состояния)
   ===================================================== */
const T0 = Date.now(); // точка отсчёта для расчёта elapsedMs в журнале событий

const S = {
  mode: 'training',  // 'training' | 'exam' (см. js/config/modes.js)
  exam: null,        // состояние экзамена (js/quest/exam.js)
  cardsFilter: 'all',
  notifs: [],
  step: 0,          // текущий шаг квеста (индекс)
  advancing: false, // true — шаг только что выполнен, идёт отложенный переход к следующему
  done: [],         // выполненные шаги
  role: null,       // текущая роль
  view: 'dash',     // текущий раздел
  card: null,       // выбранная дактилокарта
  reqId: null,      // ID текущего запроса (последний открытый/созданный)
  lastConfirmedReqId: null, // ID последней подтверждённой заявки
  xp: 0,
  hints: 0,
  qOpen: true,
  hIdx: 0,
  reqs: [],         // список запросов на актуализацию
  logs: [],         // лог текущей сессии (для экрана "Журнал операций")
  results: [],      // результаты поиска
  // --- Идентификация курсанта и сквозное журналирование ---
  cadet: {
    fio: '',
    platoon: '',
    sessionId: genSessionId()
  },
  timeline: {
    bootStartedAt: nowISO(),
    loginAt: null,
    finishedAt: null
  },
  stepTimes: {},    // { [questId]: { startedAt, completedAt, hints } }
  events: [],       // полный структурированный журнал действий (для JSON-отчёта)
  clicks: [],        // сырой поток кликов (для тепловых карт на платформе проверки)
  flags: {
    boot: false,
    logged: false,
    searchNav: false,
    typeSet: false,
    searched: false,
    cardSel: false,
    cardView: false,
    modalOpen: false,
    reqSent: false,
    roleSw: false,
    reqsNav: false,
    reqConf: false,
    ownReqId: null,        // id заявки, созданной самим курсантом
    ownReqConfirmed: false,// подтверждена именно СВОЯ заявка (а не любая из очереди)
    statNav: false,
    logNav: false
  }
};
