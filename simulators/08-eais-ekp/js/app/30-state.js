// ===== ЭТАП 2: СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====
// ================================================================
const APP = {
  user: null,
  currentModule: 'dashboard',
  currentCase: null,   // активное дело (latent)
  currentHitList: [],
  selectedCandidate: null,
  rlpositiveCallback: null,
  instrCollapsed: false,
  currentMission: null,
  missionsProgress: {},
  missionStep: 0,
  searchResult: null,
  activeSearchQuery: null,
  reportData: null,
  codingCanvas: null,
  codingCtx: null,
  codingTool: 'add',
  codingType: 'ending',
  codingZoom: 1,
  codingOffset: {x:0,y:0},
  codingDragging: false,
  codingLastPos: {x:0,y:0},
  selectedMinutiaId: null,
  score: { coding:0, filter:0, verification:0, procedure:0 },
  // === ЖУРНАЛ / ОТЧЁТ ===
  sessionStartTs: null,   // Date — момент LOGIN
  sessionId: null,         // уникальный ID сессии курсанта
  cadetId: null,            // детерминированный ID курсанта (ФИО+взвод)
  casesActivity: {},        // { S001: { opened: ts, coded: ts, searched: ts, decision: ..., isTrue: bool } }
  missionStartTs: null,
  missionStepEnteredTs: null,
  _persisted: false,        // писали в localStorage
};

// ================================================================
