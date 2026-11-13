// ===== ЭТАП 1: ДВИЖОК МИНУЦИЙ И AFIS =====
// ================================================================

// Универсальный детерминированный хеш строки → целое число
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

function hashString(s) {
  let h = 2166136261 >>> 0; // FNV-1a seed
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

// Генерируем идеальные минуции для каждого следа (хеш от ID → уникальная разметка)
// ===== ОТПЕЧАТКИ: ИНДЕКСЫ ИЗОБРАЖЕНИЙ И КОНТУРЫ (маски по реальным отпечаткам) =====
// Каждому изображению соответствует маска 40x48 клеток: 1 — папиллярный узор, 0 — фон/края.
const FP_MASKS = PAPILON_DATA.fpMasks;
const FP_MINUTIAE = PAPILON_DATA.fpMinutiae || [];   // реальные минуции, извлечённые из изображений (tools/extract_minutiae.py)
function getFingerprintIndex(id) {
  const mm = /^D(\d{3})$/.exec(id);
  if (mm) { const n = parseInt(mm[1], 10); if (n >= 1 && n <= 66) return (n - 1) % 60 + (n > 60 ? 60 : 0); }
  let hash = 0;
  for (let i = 0; i < id.length; i++) { hash = ((hash << 5) - hash) + id.charCodeAt(i); hash = hash & hash; }
  return Math.abs(hash) % 60;
}
const _printCellCache = {};
function printCells(fpIdx) {
  if (_printCellCache[fpIdx]) return _printCellCache[fpIdx];
  const W = FP_MASKS.w, H = FP_MASKS.h, rows = FP_MASKS.masks[fpIdx % 60], flip = fpIdx >= 60, cells = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (rows[r][c] !== '1') continue;
    const cc = flip ? W - 1 - c : c;
    cells.push({ x: (cc + 0.5) * 400 / W, y: (r + 0.5) * 400 / H });
  }
  return (_printCellCache[fpIdx] = cells);
}
function pointInPrint(fpIdx, x, y) {
  if (x < 0 || y < 0 || x >= 400 || y >= 400) return false;
  const W = FP_MASKS.w, H = FP_MASKS.h;
  let c = Math.floor(x / 400 * W); const r = Math.floor(y / 400 * H);
  if (fpIdx >= 60) c = W - 1 - c;
  return FP_MASKS.masks[fpIdx % 60][r][c] === '1';
}
function snapToPrint(fpIdx, x, y) {
  if (pointInPrint(fpIdx, x, y)) return { x: Math.round(x), y: Math.round(y) };
  let best = null, bd = Infinity;
  printCells(fpIdx).forEach(p => { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = p; } });
  return best ? { x: Math.round(best.x), y: Math.round(best.y) } : { x: 200, y: 200 };
}
// Минуции изображения; для зеркальных копий (индексы 60+) координаты отражаются по горизонтали
function fpPool(fpIdx) {
  const base = FP_MINUTIAE[fpIdx % 60] || [];
  if (fpIdx < 60) return base;
  return base.map(m => ({ x: 400 - m.x, y: m.y, type: m.type, angle: (180 - m.angle + 360) % 360 }));
}
function latentImageIdx(l) {
  if (!l) return 0;
  return (l.fpIndex != null) ? l.fpIndex : getFingerprintIndex(l.trueMatch || l.id);
}
function latentFpIdx(latentId) {
  const l = DB.latents.find(x => x.id === latentId);
  return l ? latentImageIdx(l) : getFingerprintIndex(latentId);
}
function _seededShuffle(arr, seed) {
  const a = arr.slice(); let st = (seed >>> 0) || 1;
  const rnd = () => { st = (Math.imul(st, 1664525) + 1013904223) >>> 0; return st / 4294967296; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function pickMinutiae(pool, count, seed) {
  const sh = _seededShuffle(pool, seed); let out = [];
  for (const gap of [26, 18, 0]) {     // сначала разнесённые точки, при нехватке — плотнее
    out = [];
    for (const p of sh) { if (out.length >= count) break; if (gap && out.some(q => Math.hypot(p.x - q.x, p.y - q.y) < gap)) continue; out.push(p); }
    if (out.length >= count) break;
  }
  return out;
}

function generateIdealMinutiae(latentId, count) {
  // Эталон — реальные минуции (окончания/разветвления/островки) с гребней изображения следа
  const pool = fpPool(latentFpIdx(latentId));
  if (!pool.length) return _generateIdealRandom(latentId, count);
  return pickMinutiae(pool, count, hashString(latentId)).map((p, i) => ({ x: p.x, y: p.y, type: p.type, angle: p.angle, source: 'ideal', id: i }));
}
function _generateIdealRandom(latentId, count) {
  // Запасной вариант без данных об изображении: случайные точки внутри контура отпечатка (детерминированно по id следа)
  const cells = printCells(latentFpIdx(latentId));
  let st = (hashString(latentId) >>> 0) || 1;
  const rnd = () => { st = (Math.imul(st, 1664525) + 1013904223) >>> 0; return st / 4294967296; };
  const types = ['ending', 'bifurcation', 'island'];
  const out = [];
  for (let tries = 0; out.length < count && tries < count * 60; tries++) {
    const c = cells[Math.floor(rnd() * cells.length)];
    const x = Math.round(c.x + (rnd() - 0.5) * 8), y = Math.round(c.y + (rnd() - 0.5) * 8);
    const minGap = tries < count * 30 ? 28 : 20;
    if (!pointInPrint(latentFpIdx(latentId), x, y)) continue;
    if (out.some(m => Math.hypot(m.x - x, m.y - y) < minGap)) continue;
    out.push({ x, y, type: types[Math.floor(rnd() * 3)], angle: Math.round(rnd() * 360), source: 'ideal', id: out.length });
  }
  return out;
}

// Задаём идеальные минуции
const IDEAL_MINUTIAE = {};
DB.latents.forEach(l => {
  const match = DB.tenprints.find(t => t.id === l.trueMatch);
  const base = match ? match.fingers[l.fingerIndex] : 20;
  IDEAL_MINUTIAE[l.id] = generateIdealMinutiae(l.id, base);
});

// Генерация AI-разметки с ошибками согласно качеству
function generateAIMinutiae(latentId) {
  const latent = DB.latents.find(l => l.id === latentId);
  if (!latent) return [];
  const ideal = IDEAL_MINUTIAE[latentId];
  const quality = latent.quality;
  const errorRates = { high: 0.08, medium: 0.20, low: 0.42 };
  const errorRate = errorRates[quality] || 0.25;
  const result = [];

  // Полуоси эллипса в координатах canvas (те же, что в generateIdealMinutiae)
  const ECX = 200, ECY = 200, ERX = 180, ERY = 190; // Синхронизировано с generateIdealMinutiae

  // Вспомогательная функция: точка строго внутри эллипса?
  function insideEllipse(px, py) {
    return ((px - ECX) / ERX) ** 2 + ((py - ECY) / ERY) ** 2 <= 0.90;
  }

  // Вспомогательная функция: зажать точку внутрь эллипса
  function clampToEllipse(px, py) {
    const dx = px - ECX, dy = py - ECY;
    const dist = Math.sqrt((dx / ERX) ** 2 + (dy / ERY) ** 2);
    if (dist <= 1.0) return { x: px, y: py };
    return {
      x: Math.round(ECX + (dx / dist) * 0.98),
      y: Math.round(ECY + (dy / dist) * 0.98),
    };
  }

  ideal.forEach((m, i) => {
    if (Math.random() < errorRate * 0.6) return;  // пропуск
    const jitter = quality === 'high' ? 4 : quality === 'medium' ? 8 : 12;
    const nx = m.x + Math.round((Math.random() - 0.5) * jitter * 2);
    const ny = m.y + Math.round((Math.random() - 0.5) * jitter * 2);
    const clamped = snapToPrint(latentFpIdx(latentId), nx, ny);
    const types = ['ending', 'bifurcation', 'island'];
    let type = m.type;
    if (Math.random() < errorRate * 0.4) type = types[Math.floor(Math.random() * 3)];
    result.push({ x: clamped.x, y: clamped.y, type, angle: m.angle + Math.round((Math.random() - 0.5) * 20), source: 'ai', id: Date.now() + i + Math.random() });
  });

  // Ложные минуции — тоже только внутри эллипса
  const falseCount = quality === 'high' ? 1 : quality === 'medium' ? 3 : 5;
  for (let f = 0; f < falseCount; f++) {
    let fx, fy, tries = 0;
    do {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.88;
      fx = Math.round(ECX + r * ERX * Math.cos(a));
      fy = Math.round(ECY + r * ERY * Math.sin(a));
      tries++;
    } while (!insideEllipse(fx, fy) && tries < 20);
    ({ x: fx, y: fy } = snapToPrint(latentFpIdx(latentId), fx, fy));
    const types = ['ending', 'bifurcation', 'island'];
    result.push({ x: fx, y: fy, type: types[Math.floor(Math.random() * 3)], angle: Math.round(Math.random() * 360), source: 'ai', id: Date.now() + f + Math.random() * 9999 });
  }
  return result;
}

// AFIS Score: сравнение минуций курсанта с минуциями кандидата из БД
function calcAFISScore(userMinutiae, candidateMinutiae, latentId) {
  if (!userMinutiae || !candidateMinutiae || userMinutiae.length === 0) return 0;
  const ideal = IDEAL_MINUTIAE[latentId] || [];
  
  // 1. Точность разметки курсанта относительно идеала
  let codingPrecision = 0;
  if (ideal.length > 0) {
    let matched = 0;
    ideal.forEach(im => {
      const close = userMinutiae.find(um => {
        const dx = um.x - im.x, dy = um.y - im.y;
        return Math.sqrt(dx*dx+dy*dy) < 22 && um.type === im.type;
      });
      if (close) matched++;
    });
    // Штраф за ложные точки
    const falsePositives = userMinutiae.filter(um => {
      return !ideal.find(im => {
        const dx = um.x - im.x, dy = um.y - im.y;
        return Math.sqrt(dx*dx+dy*dy) < 22;
      });
    }).length;
    codingPrecision = Math.max(0, matched / ideal.length - (falsePositives * 0.06));
  } else {
    codingPrecision = 0.5;
  }

  // 2. Сходство с кандидатом (симулируем на основе precision)
  const baseScore = candidateMinutiae.baseScore || 60;
  const score = Math.round(baseScore * codingPrecision + Math.random() * 5 - 2);
  return Math.max(1, Math.min(100, score));
}

// Формирование Hit List для данного следа
function buildHitList(latentId, filterParams, userMinutiae, searchType, db) {
  const latent = DB.latents.find(l => l.id === latentId);
  if (!latent) return [];
  const trueMatchId = latent.trueMatch;
  // Если trueMatch указывает на несуществующего кандидата — след «без совпадения»
  const noMatch = !trueMatchId || !DB.tenprints.find(t => t.id === trueMatchId);

  // === Поиск «след → след»: возвращаем другие следы, у которых тот же trueMatch ===
  if (searchType === 'latent-latent') {
    const sameAuthor = DB.latents.filter(l => l.id !== latentId && l.trueMatch && l.trueMatch === trueMatchId);
    // Добавим пару случайных других следов для контекста
    const others = DB.latents.filter(l => l.id !== latentId && l.trueMatch !== trueMatchId).slice(0, 3);
    const combined = [...sameAuthor, ...others];
    return combined.map((l, i) => ({
      candidateId: l.id,
      name: `След ${l.id} (${l.type})`,
      dob: l.date,
      gender: '—',
      region: l.place,
      crimHist: l.kusp,
      score: sameAuthor.includes(l) ? 88 - i * 3 : 35 + Math.round(Math.random() * 20),
      isTrue: sameAuthor.includes(l),
      isLatent: true,
      verificationStatus: 'pending'
    })).sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, position: i + 1 }));
  }

  // === Фильтрация кандидатов по БД ===
  let pool = [...DB.tenprints];
  // Ограничение по базе (миссия 8)
  if (db === 'regional') {
    pool = pool.filter(t => t.region === 'Краснодар' || t.region === 'Краснодарский край' || t.region === 'Сочи' || t.region === 'Новороссийск' || t.region === 'Армавир');
  } else if (db === 'civil') {
    pool = pool.filter(t => !t.arrested && (t.crimHist === 'Нет судимостей' || t.crimHist === 'Нет судимостей (гражданская)'));
  }
  // federal — все
  if (filterParams.gender && filterParams.gender !== '') {
    pool = pool.filter(t => t.gender === filterParams.gender);
  }
  if (filterParams.ageFrom) {
    const fy = 2026 - parseInt(filterParams.ageFrom);
    pool = pool.filter(t => parseInt(t.dob.slice(0,4)) <= fy);
  }
  if (filterParams.ageTo) {
    const ty = 2026 - parseInt(filterParams.ageTo);
    pool = pool.filter(t => parseInt(t.dob.slice(0,4)) >= ty);
  }
  if (filterParams.region && filterParams.region !== '') {
    pool = pool.filter(t => t.region.toLowerCase().includes(filterParams.region.toLowerCase()));
  }
  if (filterParams.dobExact && filterParams.dobExact !== '') {
    pool = pool.filter(t => t.dob === filterParams.dobExact);
  }

  // Если нет истинного совпадения (миссия 6) — пул остаётся, но истинного в нём нет
  if (noMatch) {
    return pool.map((t, i) => ({
      candidateId: t.id,
      name: t.name,
      dob: t.dobDisplay,
      gender: t.gender,
      region: t.region,
      crimHist: t.crimHist,
      score: 25 + Math.round(Math.random() * 50),
      isTrue: false,
      verificationStatus: 'pending',
      position: i + 1,
    })).sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, position: i + 1 }));
  }

  // Обычный поиск с учётом миссий
  const results = pool.map(t => {
    const isTrue = t.id === trueMatchId;
    let baseScore;
    if (isTrue) {
      // Миссия 4: истинный кандидат искусственно занижен (на ~5-й позиции)
      // Миссия 5: след низкого качества — даже истинный получит средний score
      // Миссия 2: высокое качество — истинный должен быть №1
      if (latentId === 'S004') baseScore = 55;        // миссия 4: истинный НЕ на 1-й позиции
      else if (latentId === 'S005') baseScore = 65;   // миссия 5: низкое качество
      else if (latentId === 'S009') baseScore = 72;   // миссия 9: убийство
      else baseScore = 95;
    } else {
      baseScore = 30 + Math.round(Math.random() * 45);
      // Чтобы истинный был НЕ первым в миссии 4 — подкрутим случайных
      if (latentId === 'S004') baseScore = 60 + Math.round(Math.random() * 30);  // 60-90 — обгонят истинного (55)
    }
    // ФИКС: раньше calcAFISScore() вызывался для КАЖДОГО кандидата, но его
    // результат использовался только для истинного — для остальных он
    // молча отбрасывался и заменялся формулой на baseScore. Оставляем
    // расчёт по минуциям только там, где он реально влияет на результат.
    let finalScore;
    if (isTrue) {
      const candidateMinutiae = { baseScore };
      const score = calcAFISScore(userMinutiae, candidateMinutiae, latentId);
      finalScore = Math.min(score, baseScore);
    } else {
      finalScore = Math.round(baseScore * 0.55 + Math.random() * 18);
    }
    return {
      candidateId: t.id,
      name: t.name,
      dob: t.dobDisplay,
      gender: t.gender,
      region: t.region,
      crimHist: t.crimHist,
      score: Math.max(1, Math.min(100, finalScore)),
      isTrue,
      verificationStatus: 'pending',
    };
  });

  results.sort((a, b) => b.score - a.score);
  results.forEach((r, i) => r.position = i + 1);
  return results;
}

// ================================================================
