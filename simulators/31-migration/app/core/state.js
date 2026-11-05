'use strict';
// ════════════════════════════════════════════════════
//  СИМУЛЯТОР ФИС ГМУ — JavaScript Engine
// ════════════════════════════════════════════════════

// ── STATE ──────────────────────────────────────────
const STATE = {
  module: 'migration',
  role: 'inspector',
  score: 100,
  caseCount: 0,
  currentCaseId: null,
  selectedCaseType: null,
  decisionRejectOnly: false,
  sessionStart: Date.now(),
  sessionId: null,
  cadetInfo: null,          // { fio, platoon } — заполняется формой авторизации
  fingerprints: {},        // caseId => array of scanned fingers
  checks: {},              // caseId => {fns, ibd, fsb, minzdrav, sssp}
  decisions: {},           // caseId => 'approve'|'reject'
  instructorSettings: {},   // значения по умолчанию — scenarios/quests/generator_sliders.json (core/scenarios.js)
  cadets: [],
  auditLog: [],
  activeAlertCase: null,
  instructionStep: 0,
  checklist: [false, false, false, false, false],
};

// ── ЗАФИКСИРОВАННАЯ "ТЕКУЩАЯ ДАТА" СЦЕНАРИЯ ──────────
// Все даты въезда/паспортов в тестовых данных (DATA.foreignCitizens) привязаны
// к 2025 году. Раньше расчёты (правило 90/180, истечение срока паспорта)
// сравнивали их с реальной датой устройства (new Date()), из-за чего логика
// "плыла" и ломалась в зависимости от того, в каком году/месяце запущен
// симулятор. Теперь все бизнес-расчёты по датам иностранных граждан идут
// от фиксированной опорной даты сценария, не зависящей от реальных часов.
const SIM_TODAY = new Date(CONFIG.sim_today);

const CASES = [];
const AUDIT_LOG = [];
// EVENT_LOG — сквозной структурированный журнал действий курсанта.
// Каждая запись AUDIT_LOG (для отображения на экране "Аудит") дублируется
// сюда в машиночитаемом виде с дополнительными полями (категория,
// признак правильности действия, дельта баллов, тип дела/ловушки и т.д.),
// чтобы по завершении сессии сформировать полный JSON-отчёт для внешней
// платформы проверки (тепловые карты, таблицы, пакетная проверка).
const EVENT_LOG = [];
