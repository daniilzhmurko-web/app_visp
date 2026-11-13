-- Схема базы данных учебного симулятора АДИС «Папилон»
PRAGMA journal_mode = WAL;

-- ===== Справочные данные =====
CREATE TABLE IF NOT EXISTS tenprints (          -- дактилокарты (известные лица)
  id TEXT PRIMARY KEY, name TEXT NOT NULL, dob TEXT NOT NULL, dob_display TEXT NOT NULL,
  gender TEXT NOT NULL, region TEXT NOT NULL, crimes TEXT NOT NULL,     -- JSON-массив
  photo TEXT, fingers TEXT NOT NULL,                                     -- JSON-массив (10 значений)
  pattern TEXT, arrested INTEGER NOT NULL DEFAULT 0, crim_hist TEXT
);
CREATE TABLE IF NOT EXISTS latents (            -- следы с мест происшествий
  id TEXT PRIMARY KEY, kusp TEXT NOT NULL, date TEXT NOT NULL, place TEXT NOT NULL, type TEXT NOT NULL,
  quality TEXT NOT NULL CHECK (quality IN ('high','medium','low')), fragment INTEGER NOT NULL DEFAULT 0,
  true_match TEXT, finger_index INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new'
);
CREATE TABLE IF NOT EXISTS missions (id INTEGER PRIMARY KEY, body TEXT NOT NULL);          -- JSON миссии
CREATE TABLE IF NOT EXISTS mentor_responses (keyword TEXT PRIMARY KEY, answer TEXT NOT NULL, ord INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS fp_masks (id INTEGER PRIMARY KEY CHECK (id = 1), body TEXT NOT NULL);  -- контуры отпечатков
CREATE TABLE IF NOT EXISTS fp_minutiae (id INTEGER PRIMARY KEY CHECK (id = 1), body TEXT NOT NULL);  -- реальные минуции изображений

-- ===== Данные курсантов =====
CREATE TABLE IF NOT EXISTS cadets (
  cadet_key TEXT PRIMARY KEY, full_name TEXT, squad TEXT, first_seen TEXT, last_seen TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  cadet_key TEXT PRIMARY KEY REFERENCES cadets(cadet_key), payload TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS journal (
  cadet_key TEXT NOT NULL REFERENCES cadets(cadet_key), seq INTEGER, ts TEXT, action TEXT, detail TEXT,
  case_id TEXT, mission_id INTEGER, module TEXT, archived INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_journal_cadet ON journal(cadet_key, seq);
CREATE TABLE IF NOT EXISTS mission_results (
  cadet_key TEXT NOT NULL REFERENCES cadets(cadet_key), mission_id INTEGER NOT NULL,
  score INTEGER, done INTEGER NOT NULL DEFAULT 0, attempts INTEGER, completed_at TEXT,
  PRIMARY KEY (cadet_key, mission_id)
);
