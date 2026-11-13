// ===== МОДУЛЬ: КОДИРОВАНИЕ МИНУЦИЙ =====
// ================================================================
let cCanvas, cCtx, fpImage = null;
function renderCoding() {
  const latent = APP.currentCase;
  const latentInfo = latent ? `
    <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--text-muted);margin-bottom:12px">
      <span>📁 <strong>${latent.id}</strong></span>
      <span>КУСП: <strong>${latent.kusp}</strong></span>
      <span>Тип: <strong>${latent.type}</strong></span>
      <span>Качество: <span class="badge badge-${latent.quality==='high'?'high':latent.quality==='medium'?'med':'low'}">${{high:'Высокое',medium:'Среднее',low:'Низкое'}[latent.quality]}</span></span>
      ${latent.fragment?'<span class="badge badge-error">Фрагментарный</span>':''}
    </div>` : '<div class="alert alert-warn mb-16">⚠️ Дело не выбрано. Перейдите в «Управление делами» и откройте след.</div>';

  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  ${latentInfo}
  <div class="coding-layout">
    <div class="canvas-wrapper">
      <div class="canvas-toolbar">
        <span style="font-size:12px;font-weight:700;color:var(--text-muted)">Инструмент:</span>
        <button class="tool-btn active" id="tool-add" onclick="setTool('add')">➕ Добавить</button>
        <button class="tool-btn" id="tool-delete" onclick="setTool('delete')">🗑 Удалить</button>
        <button class="tool-btn" id="tool-move" onclick="setTool('move')">✋ Перемещение</button>
        <span style="font-size:12px;font-weight:700;color:var(--text-muted);margin-left:8px">Тип:</span>
        <button class="tool-btn active" id="type-ending" onclick="setMinType('ending')">
          <svg width="14" height="14" viewBox="0 0 14 14" style="margin-right:4px;vertical-align:middle"><circle cx="7" cy="7" r="5" fill="#2563eb"/><line x1="7" y1="7" x2="12" y2="7" stroke="#2563eb" stroke-width="1.5"/></svg>
          Окончание
        </button>
        <button class="tool-btn" id="type-bifurcation" onclick="setMinType('bifurcation')">
          <svg width="14" height="14" viewBox="0 0 14 14" style="margin-right:4px;vertical-align:middle">
            <line x1="7" y1="2" x2="7" y2="7" stroke="#16a34a" stroke-width="2"/>
            <line x1="7" y1="7" x2="3" y2="12" stroke="#16a34a" stroke-width="2"/>
            <line x1="7" y1="7" x2="11" y2="12" stroke="#16a34a" stroke-width="2"/>
            <circle cx="7" cy="7" r="2.5" fill="#16a34a"/>
          </svg>
          Разветвление
        </button>
        <button class="tool-btn" id="type-island" onclick="setMinType('island')">
          <svg width="14" height="14" viewBox="0 0 14 14" style="margin-right:4px;vertical-align:middle">
            <rect x="3" y="5" width="8" height="4" rx="2" fill="#d97706"/>
            <line x1="7" y1="5" x2="7" y2="3" stroke="#d97706" stroke-width="1.5"/>
            <line x1="7" y1="9" x2="7" y2="11" stroke="#d97706" stroke-width="1.5"/>
          </svg>
          Островок
        </button>
        <div style="flex:1"></div>
        <button class="tool-btn" onclick="zoomCanvas(1.2)">🔍+</button>
        <button class="tool-btn" onclick="zoomCanvas(0.8)">🔍−</button>
        <button class="tool-btn" onclick="resetView()">⟳ Сброс</button>
        <button class="tool-btn" onclick="adjustContrast(1.2)">☀️</button>
        <button class="tool-btn" onclick="adjustContrast(0.8)">🌑</button>
      </div>
      <div class="canvas-container" id="canvas-container">
        <canvas id="fingerprintCanvas" width="580" height="440"></canvas>
        <div class="minutia-tooltip" id="minutia-tooltip"></div>
      </div>
      <div class="canvas-info">
        <span>
          <svg width="10" height="10" viewBox="0 0 14 14" style="vertical-align:middle;margin-right:3px"><circle cx="7" cy="7" r="5" fill="#2563eb"/><line x1="7" y1="7" x2="12" y2="7" stroke="#2563eb" stroke-width="1.5"/></svg> Окончание &nbsp;|&nbsp;
          <svg width="10" height="10" viewBox="0 0 14 14" style="vertical-align:middle;margin-right:3px"><line x1="7" y1="2" x2="7" y2="7" stroke="#16a34a" stroke-width="2"/><line x1="7" y1="7" x2="3" y2="12" stroke="#16a34a" stroke-width="2"/><line x1="7" y1="7" x2="11" y2="12" stroke="#16a34a" stroke-width="2"/><circle cx="7" cy="7" r="2.5" fill="#16a34a"/></svg> Разветвление &nbsp;|&nbsp;
          <svg width="10" height="10" viewBox="0 0 14 14" style="vertical-align:middle;margin-right:3px"><rect x="3" y="5" width="8" height="4" rx="2" fill="#d97706"/><line x1="7" y1="5" x2="7" y2="3" stroke="#d97706" stroke-width="1.5"/><line x1="7" y1="9" x2="7" y2="11" stroke="#d97706" stroke-width="1.5"/></svg> Островок
        </span>
        <span>🟠 Источник: ИИ &nbsp;|&nbsp; 🔶 Источник: Эксперт</span>
        <span id="canvas-coords">X: — Y: —</span>
      </div>
    </div>
    <div class="coding-panel">
      <div class="panel">
        <div class="panel-header" style="padding:12px 14px"><h3 style="font-size:13px">📊 Качество разметки</h3></div>
        <div class="panel-body" style="padding:12px">
          <div class="coding-quality" id="coding-quality-display">
            <div class="quality-bar-wrap"><span class="quality-label">Точность</span><div class="quality-bar"><div class="quality-fill" id="qf-precision" style="width:0%;background:var(--accent-blue)"></div></div><span id="qv-precision" style="font-size:11px;width:28px;text-align:right">0%</span></div>
            <div class="quality-bar-wrap"><span class="quality-label">Полнота</span><div class="quality-bar"><div class="quality-fill" id="qf-recall" style="width:0%;background:var(--accent-green)"></div></div><span id="qv-recall" style="font-size:11px;width:28px;text-align:right">0%</span></div>
            <div class="quality-bar-wrap"><span class="quality-label">Ложные</span><div class="quality-bar"><div class="quality-fill" id="qf-false" style="width:0%;background:var(--accent-red)"></div></div><span id="qv-false" style="font-size:11px;width:28px;text-align:right">0</span></div>
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--text-muted)" id="coding-tip">Начните добавлять и корректировать минуции</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header" style="padding:10px 14px">
          <h3 style="font-size:13px">📍 Список минуций (<span id="minutia-count">0</span>)</h3>
          <div style="display:flex;gap:4px">
            <button class="btn btn-outline btn-sm" onclick="resetToAI()">↺ ИИ</button>
            <button class="btn btn-danger btn-sm" onclick="clearAllMinutiae()">✕ Очистить</button>
          </div>
        </div>
        <div class="minutia-list" id="minutia-list"></div>
      </div>
      <div class="panel" style="padding:12px">
        <button class="btn btn-success" style="width:100%" onclick="saveCoding()">💾 Сохранить разметку</button>
        <button class="btn btn-primary" style="width:100%;margin-top:8px" onclick="goToSearch()">🔍 Перейти к поиску →</button>
      </div>
    </div>
  </div>
  </div>`;

  // Инициализируем canvas
  setTimeout(() => initCodingCanvas(), 50);
}

function initCodingCanvas() {
  cCanvas = document.getElementById('fingerprintCanvas');
  if (!cCanvas) return;
  scheduleMission7Failure();
  cCtx = cCanvas.getContext('2d');
  APP.codingZoom = 1; APP.codingOffset = {x:0,y:0};
  // Защита от утечки обработчиков при повторном ререндере: помечаем canvas
  if (!cCanvas._sekoInit) {
    cCanvas._sekoInit = true;
    cCanvas.addEventListener('click', onCanvasClick);
    cCanvas.addEventListener('mousemove', onCanvasMouseMove);
    cCanvas.addEventListener('mousedown', e => { if(APP.codingTool==='move'){APP.codingDragging=true; APP.codingLastPos={x:e.clientX,y:e.clientY};} });
    cCanvas.addEventListener('mouseup', ()=>APP.codingDragging=false);
    cCanvas.addEventListener('mouseleave', ()=>APP.codingDragging=false);
    cCanvas.addEventListener('wheel', e => { e.preventDefault(); zoomCanvas(e.deltaY<0?1.1:0.9); }, {passive:false});
  }
  drawCanvas();
  renderMinutiaList();
  updateCodingQuality();
}

let contrastLevel = 1.3; // Увеличена базовая чёткость
function adjustContrast(f) {
  contrastLevel = Math.max(0.3, Math.min(3, contrastLevel * f));
  drawCanvas();
  // Логируем только финальное значение (throttling: раз в 800мс)
  if (!adjustContrast._t || Date.now() - adjustContrast._t > 800) {
    logAction('CODING_CONTRAST', `Контраст: ${contrastLevel.toFixed(2)}`);
    adjustContrast._t = Date.now();
  }
}
function zoomCanvas(f) {
  APP.codingZoom = Math.max(0.3, Math.min(5, APP.codingZoom * f));
  drawCanvas();
  if (!zoomCanvas._t || Date.now() - zoomCanvas._t > 800) {
    logAction('CODING_ZOOM', `Зум: ${APP.codingZoom.toFixed(2)}x`);
    zoomCanvas._t = Date.now();
  }
}
function resetView() {
  APP.codingZoom = 1; APP.codingOffset = {x:0, y:0}; contrastLevel = 1.3; drawCanvas();
  logAction('CODING_RESET_VIEW', 'Сброс вида отпечатка');
}
function setTool(t) {
  APP.codingTool=t;
  document.querySelectorAll('.canvas-toolbar .tool-btn').forEach(b=>b.id&&b.id.startsWith('tool-')&&b.classList.remove('active'));
  const el=document.getElementById('tool-'+t); if(el)el.classList.add('active');
  logAction('CODING_TOOL', `Инструмент: ${t}`);
}
function setMinType(t) {
  APP.codingType=t;
  document.querySelectorAll('.canvas-toolbar .tool-btn').forEach(b=>b.id&&b.id.startsWith('type-')&&b.classList.remove('active'));
  const el=document.getElementById('type-'+t); if(el)el.classList.add('active');
  logAction('CODING_TYPE', `Тип минуции: ${t}`);
}

function getCanvasPos(e) {
  const rect = cCanvas.getBoundingClientRect();
  // Сначала получаем позицию в пикселях canvas с учётом зума и смещения
  const canvasX = (e.clientX - rect.left) / APP.codingZoom - APP.codingOffset.x;
  const canvasY = (e.clientY - rect.top) / APP.codingZoom - APP.codingOffset.y;
  const W = cCanvas.width, H = cCanvas.height;
  // Конвертируем в логические координаты 0..400 (система координат минуций)
  const fpDisp = APP._fpDisplay || { x: W/2 - 100, y: H/2 - 120, w: 200, h: 240 };
  const logicalX = Math.round((canvasX - fpDisp.x) / fpDisp.w * 400);
  const logicalY = Math.round((canvasY - fpDisp.y) / fpDisp.h * 400);
  return {x: logicalX, y: logicalY, canvasX: Math.round(canvasX), canvasY: Math.round(canvasY)};
}

function onCanvasClick(e) {
  if (!APP.currentCase) return;
  const pos = getCanvasPos(e);
  const minutiae = APP.currentCase.userMinutiae;

  if (APP.codingTool === 'add') {
    // Проверяем, что клик внутри области отпечатка
    if (pos.x < 0 || pos.x > 400 || pos.y < 0 || pos.y > 400) {
      // Клик вне отпечатка — игнорируем или показываем предупреждение
      return;
    }
    if (!pointInPrint(latentFpIdx(APP.currentCase.id), pos.x, pos.y)) {
      showNotification('Точка вне папиллярного узора: минуции отмечаются только на отпечатке', 'warn');
      return;
    }
    minutiae.push({ x:pos.x, y:pos.y, type:APP.codingType, angle:Math.round(Math.random()*360), source:'expert', id: Date.now()+Math.random() });
    logAction('MINUTIA_ADD', `Тип: ${APP.codingType}, X:${pos.x} Y:${pos.y}`);
  } else if (APP.codingTool === 'delete') {
    // Радиус удаления в логических координатах (0..400) — ~20px на canvas
    const deleteRadius = 25;
    const idx = minutiae.findIndex(m => Math.sqrt((m.x-pos.x)**2+(m.y-pos.y)**2) < deleteRadius);
    if (idx>=0) { logAction('MINUTIA_DELETE', `X:${minutiae[idx].x} Y:${minutiae[idx].y}`); minutiae.splice(idx,1); }
  } else if (APP.codingTool === 'move') { /* handled by drag */ }

  drawCanvas(); renderMinutiaList(); updateCodingQuality();
}

function onCanvasMouseMove(e) {
  if (APP.codingDragging && APP.codingTool==='move') {
    APP.codingOffset.x += (e.clientX - APP.codingLastPos.x)/APP.codingZoom;
    APP.codingOffset.y += (e.clientY - APP.codingLastPos.y)/APP.codingZoom;
    APP.codingLastPos = {x:e.clientX, y:e.clientY};
    drawCanvas(); return;
  }
  const pos = getCanvasPos(e);
  document.getElementById('canvas-coords').textContent = `X: ${pos.x} Y: ${pos.y}`;
  // Tooltip
  const minutiae = APP.currentCase?.userMinutiae || [];
  const near = minutiae.find(m => Math.sqrt((m.x-pos.x)**2+(m.y-pos.y)**2)<14);
  const tt = document.getElementById('minutia-tooltip');
  if (near) {
    const typeNames = {ending:'Окончание',bifurcation:'Разветвление',island:'Островок'};
    tt.style.display='block';
    tt.style.left=(e.offsetX+12)+'px'; tt.style.top=(e.offsetY-30)+'px';
    tt.textContent=`${typeNames[near.type]||near.type} · ${near.source==='ai'?'ИИ':'Эксперт'} · ${near.angle}°`;
  } else { tt.style.display='none'; }
}

function drawCanvas() {
  if (!cCtx) return;
  const W = cCanvas.width, H = cCanvas.height;
  cCtx.save();
  cCtx.clearRect(0,0,W,H);
  // Увеличенная чёткость: повышенный контраст + резкость
  cCtx.filter = `contrast(${contrastLevel * 1.4}) brightness(${0.85 + contrastLevel * 0.15}) saturate(1.2)`;
  cCtx.scale(APP.codingZoom, APP.codingZoom);
  cCtx.translate(APP.codingOffset.x, APP.codingOffset.y);

  cCtx.fillStyle = '#f8f9fa';
  cCtx.fillRect(-200,-200,W+400,H+400);

  const latent = APP.currentCase;
  if (latent) {
    // След берёт изображение своего trueMatch — иначе визуальное сравнение сломано
    const fpIndex = latentImageIdx(latent);
    const cx = W / 2, cy = H / 2;
    const aspect = 300 / 360;
    // Увеличен размер отпечатка для лучшего центрирования (0.92 вместо 0.85)
    const imgH = Math.min(H * 0.92, W / aspect * 0.92);
    const imgW = imgH * aspect;
    const imgX = cx - imgW / 2;
    const imgY = cy - imgH / 2;

    drawRealFingerprint(cCtx, fpIndex, imgX, imgY, imgW, imgH, latent.quality, latent.fragment);

    // ЧЁРНЫЙ ПРЯМОУГОЛЬНИК УБРАН по требованию
    // cCtx.strokeStyle = '#2a2a2a';
    // cCtx.lineWidth = 2;
    // cCtx.strokeRect(imgX, imgY, imgW, imgH);

    APP._fpDisplay = { x: imgX, y: imgY, w: imgW, h: imgH };
  }

  const minutiae = APP.currentCase?.userMinutiae || [];
  const fpDisp = APP._fpDisplay || { x: W/2 - 100, y: H/2 - 120, w: 200, h: 240 };

  minutiae.forEach(m => {
    const isSelected = String(m.id) === String(APP.selectedMinutiaId);
    const color = m.source==='ai' ? '#f59e0b' : '#16a34a';
    const typeColors = {ending:'#2563eb', bifurcation:'#16a34a', island:'#d97706'};

    const mx = fpDisp.x + (m.x / 400) * fpDisp.w;
    const my = fpDisp.y + (m.y / 400) * fpDisp.h;

    if (mx < fpDisp.x + 5 || mx > fpDisp.x + fpDisp.w - 5 || 
        my < fpDisp.y + 5 || my > fpDisp.y + fpDisp.h - 5) return;

    cCtx.save();
    cCtx.translate(mx, my);

    cCtx.strokeStyle = color;
    cCtx.lineWidth = isSelected ? 2.5 : 1.5;
    cCtx.beginPath();
    const rad = m.angle * Math.PI / 180;
    cCtx.moveTo(0,0);
    cCtx.lineTo(Math.cos(rad)*12, Math.sin(rad)*12);
    cCtx.stroke();

    cCtx.fillStyle = typeColors[m.type]||'#888';
    cCtx.beginPath();
    if (m.type==='ending') {
      cCtx.arc(0,0,5,0,Math.PI*2);
    } else if (m.type==='bifurcation') {
      cCtx.moveTo(0,-6); cCtx.lineTo(5,5); cCtx.lineTo(-5,5); cCtx.closePath();
    } else {
      cCtx.rect(-5,-3,10,6);
    }
    cCtx.fill();
    if (isSelected) { cCtx.strokeStyle='#dc2626'; cCtx.lineWidth=2; cCtx.stroke(); }
    cCtx.restore();
  });

  cCtx.filter='none';
  cCtx.restore();
}

function drawFingerprintPattern(ctx, W, H) {
  const latent = APP.currentCase;
  if (!latent) return;

  const fpIndex = getFingerprintIndex(latent.id);

  const cx = W / 2, cy = H / 2;
  const aspect = 300 / 360; // Новое соотношение сторон
  const h = Math.min(H * 0.85, W / aspect * 0.85);
  const w = h * aspect;
  const x = cx - w / 2;
  const y = cy - h / 2;

  drawRealFingerprint(ctx, fpIndex, x, y, w, h, latent.quality, latent.fragment);

  // ЧЁРНЫЙ ПРЯМОУГОЛЬНИК УБРАН по требованию
  // ctx.strokeStyle = '#2a2a2a';
  // ctx.lineWidth = 2;
  // ctx.strokeRect(x, y, w, h);
}

function renderMinutiaList() {
  const el = document.getElementById('minutia-list');
  if (!el) return;
  const minutiae = APP.currentCase?.userMinutiae||[];
  document.getElementById('minutia-count').textContent = minutiae.length;
  const typeNames={ending:'Оконч.',bifurcation:'Разветв.',island:'Остр.'};
  const typeColors={ending:'dot-ending',bifurcation:'dot-bifurcation',island:'dot-island'};
  el.innerHTML = minutiae.length===0?'<div style="padding:12px;font-size:12px;color:var(--text-muted);text-align:center">Нет минуций</div>':
    minutiae.map((m,i)=>`
    <div class="minutia-item ${m.source==='ai'?'ai-source':'expert-source'} ${String(m.id)===String(APP.selectedMinutiaId)?'selected':''}" onclick="selectMinutia('${m.id}')">
      <div class="minutia-dot ${typeColors[m.type]||'dot-ending'}"></div>
      <span style="font-size:11px;flex:1">${i+1}. ${typeNames[m.type]||m.type}</span>
      <span style="font-size:10px;color:var(--text-muted)">X:${m.x} Y:${m.y}</span>
      <span style="font-size:10px;padding:1px 5px;border-radius:8px;background:${m.source==='ai'?'#fef3c7':'#dcfce7'};color:${m.source==='ai'?'#92400e':'#15803d'}">${m.source==='ai'?'ИИ':'Э'}</span>
    </div>`).join('');
}

function selectMinutia(id) { APP.selectedMinutiaId = id; renderMinutiaList(); drawCanvas(); }

function updateCodingQuality() {
  const latent = APP.currentCase;
  if (!latent) return;
  const ideal = IDEAL_MINUTIAE[latent.id] || [];
  const user = latent.userMinutiae || [];
  if (ideal.length === 0) return;
  // Считаем сопоставления
  let matched = 0;
  ideal.forEach(im => {
    if (user.find(um => {
      const dx = um.x - im.x, dy = um.y - im.y;
      return Math.sqrt(dx*dx + dy*dy) < 22 && um.type === im.type;
    })) matched++;
  });
  const false_pos = user.filter(um => !ideal.find(im => {
    const dx = um.x - im.x, dy = um.y - im.y;
    return Math.sqrt(dx*dx + dy*dy) < 22;
  })).length;
  // === ПРАВИЛЬНЫЕ ФОРМУЛЫ ===
  // Полнота (Recall) = matched / ideal — доля истинных минуций, которые мы нашли
  // Точность (Precision) = matched / user — доля размеченных точек, которые верны
  const recall = ideal.length > 0 ? Math.round(matched / ideal.length * 100) : 0;
  const precision = user.length > 0 ? Math.round(matched / Math.max(user.length, 1) * 100) : 0;
  const fp = false_pos;
  document.getElementById('qf-recall').style.width = recall + '%';
  document.getElementById('qv-recall').textContent = recall + '%';
  document.getElementById('qf-precision').style.width = precision + '%';
  document.getElementById('qv-precision').textContent = precision + '%';
  document.getElementById('qf-false').style.width = Math.min(100, fp * 8) + '%';
  document.getElementById('qv-false').textContent = fp;
  const tip = document.getElementById('coding-tip');
  if (recall >= 80 && precision >= 70) { tip.textContent = '✅ Отличная разметка!'; tip.style.color = 'var(--accent-green)'; }
  else if (recall >= 60) { tip.textContent = '⚠️ Удовлетворительно. Проверьте ложные точки.'; tip.style.color = 'var(--accent-amber)'; }
  else { tip.textContent = '❌ Качество низкое. Удалите ложные и добавьте пропущенные минуции.'; tip.style.color = 'var(--accent-red)'; }
  // Итоговая оценка = среднее между recall и precision
  APP.score.coding = Math.round((recall + precision) / 2);
}

function resetToAI() { if(!APP.currentCase)return; if(!confirm('Сбросить разметку к варианту ИИ?'))return; APP.currentCase.userMinutiae=[...APP.currentCase.aiMinutiae.map(m=>({...m}))]; drawCanvas(); renderMinutiaList(); updateCodingQuality(); logAction('CODING_RESET','Сброс к AI-разметке'); }
function clearAllMinutiae() { if(!APP.currentCase)return; if(!confirm('Очистить все минуции?'))return; APP.currentCase.userMinutiae=[]; drawCanvas(); renderMinutiaList(); updateCodingQuality(); logAction('CODING_CLEAR','Все минуции удалены'); }
function saveCoding() {
  if(!APP.currentCase)return;
  APP.currentCase.status='coding';
  logAction('CODING_SAVE',`Сохранено ${APP.currentCase.userMinutiae.length} минуций для ${APP.currentCase.id}`);
  addMentorMsg('Разметка сохранена! Теперь перейдите в «Поиск АДИС» для запуска идентификации.','success');
  showNotification('Разметка сохранена','success');
}
function goToSearch() { if(!APP.currentCase){addMentorMsg('Сначала выберите дело и сохраните разметку.','warn');return;} switchModule('search'); }

// ================================================================
