// ===== МОДУЛЬ: СРАВНЕНИЕ И ВЕРИФИКАЦИЯ =====
// ================================================================
let compCanvas1, compCanvas2, compCtx1, compCtx2;
let overlayOpacity = 0;
function renderComparison() {
  if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; }
  const latent = APP.currentCase;
  const candidate = APP.selectedCandidate;
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  <div class="grid-2 mb-16" style="gap:12px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="font-size:13px;font-weight:700">Инструменты:</span>
      <button class="btn btn-outline btn-sm" onclick="syncZoom(1.3)">🔍+</button>
      <button class="btn btn-outline btn-sm" onclick="syncZoom(0.75)">🔍−</button>
      <button class="btn btn-outline btn-sm" onclick="syncZoom(1)">⟳</button>
      <label style="font-size:12px;font-weight:600">Наложение: <input type="range" id="overlay-range" min="0" max="100" value="0" oninput="setOverlay(this.value)" style="width:80px"></label>
      <button class="btn btn-outline btn-sm" id="blink-btn" onclick="startBlink()">👁 Мигание</button>
    </div>
    <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;flex-wrap:wrap">
      ${APP.currentHitList.length?`<select class="form-control" style="width:200px" id="candidate-select" onchange="changeCandidateFromList()">
        <option value="">— Выбрать кандидата —</option>
        ${APP.currentHitList.map((c,i)=>`<option value="${c.candidateId}" ${c.candidateId===candidate?.id?'selected':''}>Поз.${i+1}: ${c.name} (${c.score})</option>`).join('')}
      </select>`:''}
    </div>
  </div>
  <div class="comparison-layout">
    <div class="compare-panel">
      <div class="compare-panel-header">
        <h4>🔍 СЛЕД С МЕСТА ПРЕСТУПЛЕНИЯ</h4>
        <span style="font-size:11px;color:var(--text-muted)">${latent?latent.id+' · '+latent.kusp:'Нет'}</span>
      </div>
      <div class="compare-canvas-area" id="compare-area-1">
        <canvas id="comp-canvas-1" width="420" height="380"></canvas>
      </div>
      <div style="padding:8px 12px;background:var(--bg-panel);font-size:12px;border-top:1px solid var(--border)">
        Минуций: <strong>${latent?.userMinutiae?.length||0}</strong> &nbsp;|&nbsp; Качество: <strong>${{high:'Высокое',medium:'Среднее',low:'Низкое'}[latent?.quality]||'—'}</strong> &nbsp;|&nbsp; Тип: <strong>${latent?.type||'—'}</strong>
      </div>
    </div>
    <div class="compare-panel">
      <div class="compare-panel-header">
        <h4>👤 КАНДИДАТ ИЗ БАЗЫ ДАННЫХ</h4>
        <span style="font-size:11px;color:var(--text-muted)">${candidate?candidate.id+' · '+candidate.name:'Не выбран'}</span>
      </div>
      <div class="compare-canvas-area" id="compare-area-2">
        <canvas id="comp-canvas-2" width="420" height="380"></canvas>
      </div>
      <div style="padding:8px 12px;background:var(--bg-panel);font-size:12px;border-top:1px solid var(--border)">
        ФИО: <strong>${candidate?.name||'—'}</strong> &nbsp;|&nbsp; Д.р.: <strong>${candidate?.dobDisplay||'—'}</strong> &nbsp;|&nbsp; Тип узора: <strong>${candidate?.pattern||'—'}</strong>
      </div>
    </div>
  </div>
  <div style="margin-top:12px;padding:14px 16px;background:#fff;border:1.5px solid var(--border);border-radius:var(--radius-lg);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
    <span style="font-size:14px;font-weight:700">Решение эксперта:</span>
    <button class="btn btn-success" onclick="makeDecision('confirmed')">✅ СОВПАДЕНИЕ ПОДТВЕРЖДЕНО</button>
    <button class="btn btn-danger" onclick="makeDecision('rejected')">❌ ОТКЛОНИТЬ</button>
    <button class="btn btn-warning" onclick="makeDecision('undefined')">❓ НЕОПРЕДЕЛЁННО</button>
    ${candidate?`<div style="margin-left:auto;font-size:13px;color:var(--text-muted)">Кандидат: <strong>${candidate.name}</strong> · ID: ${candidate.id}</div>`:''}
  </div>
  </div>`;

  setTimeout(()=>{
    compCanvas1 = document.getElementById('comp-canvas-1');
    compCanvas2 = document.getElementById('comp-canvas-2');
    if(compCanvas1) compCtx1 = compCanvas1.getContext('2d');
    if(compCanvas2) compCtx2 = compCanvas2.getContext('2d');
    drawCompareCanvas(compCtx1, latent, 'latent');
    drawCompareCanvas(compCtx2, candidate, 'candidate');
  },50);
}

let compZoom = 1;
let compOffset = {x:0, y:0};
function syncZoom(f) {
  if (f === 1) { compZoom = 1; compOffset = {x:0, y:0}; }
  else compZoom = Math.max(0.3, Math.min(4, compZoom * f));
  [compCtx1, compCtx2].forEach((ctx, i) => {
    if (!ctx) return;
    drawCompareCanvas(ctx, i === 0 ? APP.currentCase : APP.selectedCandidate, i === 0 ? 'latent' : 'candidate', compZoom, compOffset);
  });
  logAction('COMPARE_ZOOM', `Зум сравнения: ${compZoom.toFixed(2)}x${f===1?' (сброс)':''}`);
}
function setOverlay(v) {
  overlayOpacity = v / 100;
  if (compCtx2 && APP.selectedCandidate) drawCompareCanvas(compCtx2, APP.selectedCandidate, 'candidate', compZoom, compOffset);
  // Не логируем каждое движение ползунка — только раз в 500мс
  if (!setOverlay._t || Date.now() - setOverlay._t > 500) {
    logAction('COMPARE_OVERLAY', `Прозрачность наложения: ${overlayOpacity.toFixed(2)}`);
    setOverlay._t = Date.now();
  }
}
let blinkInterval=null;
function startBlink() {
  if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; document.getElementById('blink-btn').textContent = '👁 Мигание'; logAction('COMPARE_BLINK_STOP', 'Мигание остановлено'); return; }
  document.getElementById('blink-btn').textContent = '⏹ Стоп';
  let show = true;
  blinkInterval = setInterval(() => {
    show = !show;
    if (compCtx2) {
      if (show) drawCompareCanvas(compCtx2, APP.selectedCandidate, 'candidate', compZoom, compOffset);
      else { compCtx2.clearRect(0, 0, 420, 380); compCtx2.fillStyle = '#f8fafc'; compCtx2.fillRect(0, 0, 420, 380); }
    }
  }, 600);
  logAction('COMPARE_BLINK_START', 'Запущено мигание при сравнении');
}
function changeCandidateFromList() {
  const id = document.getElementById('candidate-select').value;
  if (!id) return;
  APP.selectedCandidate = resolveCandidate(id);
  logAction('CANDIDATE_CHANGE', `Сменён кандидат в сравнении: ${id}`);
  renderComparison();
}

function drawCompareCanvas(ctx, data, type, zoom=1, offset={x:0,y:0}) {
  if (!ctx) return;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.scale(zoom, zoom);

  if (!data) {
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#94a3b8'; ctx.font = '14px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText('Данные не выбраны', W / 2, H / 2);
    ctx.restore(); return;
  }

  const cx = W / 2, cy = H / 2;
  const aspect = 300 / 360;
  // Увеличен размер и отцентрирован (0.9 вместо 0.8)
  const h = Math.min(H * 0.9, W / aspect * 0.9);
  const w = h * aspect;
  const x = cx - w / 2;
  const y = cy - h / 2;

  const fpIndex = type === 'latent'
    // След берёт изображение своего trueMatch — иначе визуальное сравнение ломается
    ? latentImageIdx(APP.currentCase)
    : (data.isLatent ? latentImageIdx(data.latent) : getFingerprintIndex(data.id || 'D001'));

  const quality = type === 'latent' ? (APP.currentCase?.quality || 'medium') : (data.isLatent ? data.latent.quality : 'high');
  const isFragment = type === 'latent' ? APP.currentCase?.fragment : (data.isLatent ? data.latent.fragment : false);

  drawRealFingerprint(ctx, fpIndex, x, y, w, h, quality, isFragment);

  // ЧЁРНЫЙ ПРЯМОУГОЛЬНИК УБРАН по требованию
  // ctx.strokeStyle = '#2a2a2a';
  // ctx.lineWidth = 2.2;
  // ctx.strokeRect(x, y, w, h);

  // Минуции поверх всего
  const minutiae = type === 'latent'
    ? (APP.currentCase?.userMinutiae || [])
    : candidateMinutiae(data);

  minutiae.forEach(m => {
    const typeColors = { ending: '#2563eb', bifurcation: '#16a34a', island: '#d97706' };
    const col = typeColors[m.type] || '#2563eb';
    const mx = x + (m.x / 400) * w;
    const my = y + (m.y / 400) * h;

    if (mx < x + 5 || mx > x + w - 5 || my < y + 5 || my > y + h - 5) return;

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(mx, my, 4.5, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = col; ctx.lineWidth = 1.8;
    ctx.beginPath();
    const rad = m.angle * Math.PI / 180;
    ctx.moveTo(mx, my); ctx.lineTo(mx + Math.cos(rad) * 11, my + Math.sin(rad) * 11);
    ctx.stroke();
  });

  // Линии совпадений при наложении
  if (overlayOpacity > 0.1 && type === 'candidate' && APP.currentCase) {
    const latMinutiae = APP.currentCase.userMinutiae || [];
    ctx.strokeStyle = `rgba(220,38,38,${overlayOpacity})`;
    ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
    latMinutiae.slice(0, 40).forEach(lm => {
      let best = null, bd = 25;
      minutiae.forEach(cm => { if (cm.type !== lm.type) return; const d = Math.hypot(cm.x - lm.x, cm.y - lm.y); if (d < bd) { bd = d; best = cm; } });
      if (best) {
        ctx.beginPath();
        ctx.moveTo(x + (lm.x / 400) * w, y + (lm.y / 400) * h);
        ctx.lineTo(x + (best.x / 400) * w, y + (best.y / 400) * h);
        ctx.stroke();
      }
    });
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function generateCandidateMinutiae(candidate) {
  const fp = getFingerprintIndex(candidate.id);
  const pool = fpPool(fp);
  if (pool.length) {
    const count = (candidate.fingers && candidate.fingers[0]) || 20;
    return pickMinutiae(pool, count, hashString(candidate.id)).map((p, i) => ({ x: p.x, y: p.y, type: p.type, angle: p.angle, source: 'candidate', id: i }));
  }
  return _generateCandidateMinutiaeRaw(candidate).map(m => Object.assign({}, m, snapToPrint(fp, m.x, m.y)));
}
function _generateCandidateMinutiaeRaw(candidate) {
  const seed = hashString(candidate.id); // уникальный сид для каждого кандидата
  const count = candidate.fingers[0] || 18;
  return Array.from({length: count}, (_, i) => {
    const angle = (seed * (i + 1) * 137.5) % 360;
    const r = Math.sqrt(((seed * (i + 3) * 31) % 1000) / 1000) * 180;
    const cx = 200, cy = 200;
    return {
      x: Math.round(cx + r * Math.cos(angle * Math.PI / 180)),
      y: Math.round(cy + r * Math.sin(angle * Math.PI / 180)),
      type: ['ending', 'bifurcation', 'island'][(seed * (i + 5)) % 3],
      angle: Math.round(angle)
    };
  });
}

function makeDecision(decision) {
  if (!APP.selectedCandidate) { addMentorMsg('Выберите кандидата для принятия решения.','warn'); return; }
  if (decision==='confirmed') {
    showRLPositive(() => {
      finalizeDecision('confirmed');
    });
  } else {
    finalizeDecision(decision);
  }
}

function finalizeDecision(decision) {
  if (!APP.currentCase || !APP.selectedCandidate) return;
  const candidateId = APP.selectedCandidate.id;
  // Обновляем в hit list
  if (APP.currentHitList) {
    const cand = APP.currentHitList.find(c => c.candidateId === candidateId);
    if (cand) cand.verificationStatus = decision;
  }
  const isTrue = APP.selectedCandidate.isLatent
    ? (!!APP.currentCase.trueMatch && APP.selectedCandidate.latent.trueMatch === APP.currentCase.trueMatch)
    : APP.currentCase.trueMatch === candidateId;
  let nextModule = 'hitlist';
  if (decision === 'confirmed') {
    // Ложное подтверждение → статус «ложное срабатывание», не «идентифицирован»
    if (isTrue) {
      APP.currentCase.status = APP.selectedCandidate.isLatent ? 'verified' : 'confirmed';
      logAction('MATCH_CONFIRM', `${APP.currentCase.id} → ${candidateId} (${APP.selectedCandidate.name}). Верно: true`);
      addMentorMsg('✅ Совпадение верное! Теперь сформируйте экспертную справку.', 'success');
      APP.score.verification = 100;
      nextModule = APP.selectedCandidate.isLatent ? 'hitlist' : 'report';   // идём в отчёт, в hitlist не возвращаемся
    } else {
      APP.currentCase.status = 'false_positive';
      logAction('MATCH_CONFIRM', `${APP.currentCase.id} → ${candidateId} (${APP.selectedCandidate.name}). Верно: FALSE (ложное срабатывание)`);
      addMentorMsg('⚠️ Внимание! Вы подтвердили НЕВЕРНОЕ совпадение. Это процессуальная ошибка — ложное срабатывание!', 'error');
      APP.score.verification = 0;
    }
  } else if (decision === 'rejected') {
    if (isTrue) {
      // Отклонили верного — статус «пропущен истинный»
      APP.currentCase.status = 'missed_match';
      addMentorMsg('⚠️ Вы отклонили ВЕРНОГО кандидата! Возможно, нужно проверить разметку минуций или просмотреть больше кандидатов.', 'error');
      APP.score.verification = 20;
    } else {
      // Верно отклонили неверного — статус «не найден» только если других решений не было
      if (!['confirmed','false_positive','verified'].includes(APP.currentCase.status)) APP.currentCase.status = 'rejected';
      addMentorMsg('Кандидат отклонён. Продолжите проверку Hit List.', 'info');
    }
    logAction('MATCH_REJECT', `${APP.currentCase.id} → ${candidateId}. Верно: ${!isTrue}`);
  } else {
    APP.currentCase.status = 'verified';
    logAction('MATCH_UNDEFINED', `${APP.currentCase.id} → ${candidateId}`);
    addMentorMsg('Статус «Неопределённо» зафиксирован. Требуется дополнительная экспертиза или более качественный след.', 'info');
  }
  const _noTrue = !APP.currentCase.trueMatch || !DB.tenprints.find(x => x.id === APP.currentCase.trueMatch);
  if (decision === 'rejected' && !isTrue && _noTrue) APP.score.verification = 100;
  else if (decision === 'undefined') APP.score.verification = Math.max(APP.score.verification || 0, _noTrue ? 70 : 50);
  // score.procedure выставляется в confirmRLPositive (для confirmed) или здесь для rejected/undefined
  if (decision !== 'confirmed') APP.score.procedure = Math.max(APP.score.procedure || 0, 80);
  switchModule(nextModule);
}

// ================================================================
