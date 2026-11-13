// ===== МОДУЛЬ: РЕГИСТРАЦИЯ СЛЕДА =====
// ================================================================
function renderRegistration() {
  const caseId = APP.currentCase;
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in grid-2" style="gap:20px">
    <div class="panel">
      <div class="panel-header"><h3>📋 Регистрация нового следа</h3></div>
      <div class="panel-body">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Номер КУСП / УД</label><input class="form-control" id="reg-kusp" placeholder="XXXXX/2026" value="${caseId?caseId.kusp:''}"></div>
          <div class="form-group"><label class="form-label">Дата обнаружения</label><input class="form-control" type="date" id="reg-date" value="${new Date().toISOString().slice(0,10)}"></div>
        </div>
        <div class="form-group"><label class="form-label">Место обнаружения</label><input class="form-control" id="reg-place" placeholder="г. Краснодар, ул. ..." value="${caseId?caseId.place:''}"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Тип преступления</label>
            <select class="form-control" id="reg-type">
              <option>Кража</option><option>Грабёж</option><option>Разбой</option><option>Убийство</option><option>Угон автотранспорта</option><option>Мошенничество</option><option>Серийная кража</option><option>Хулиганство</option><option>Наркотики</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Качество следа</label>
            <select class="form-control" id="reg-quality">
              <option value="high">Высокое (чёткий, полный)</option>
              <option value="medium" selected>Среднее</option>
              <option value="low">Низкое (нечёткий, фрагмент)</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Примечание / Фабула</label>
          <textarea class="form-control" rows="3" id="reg-notes" placeholder="Краткое описание обстоятельств обнаружения..."></textarea>
        </div>
        <div class="alert alert-info">ℹ️ После сохранения следу будет присвоен уникальный ID. Система автоматически инициирует AI-разметку минуций.</div>
        <button class="btn btn-success" onclick="saveRegistration()">💾 Зарегистрировать след</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><h3>🖼️ Изображение следа</h3></div>
      <div class="panel-body" style="display:flex;flex-direction:column;align-items:center;gap:16px">
        <div style="width:260px;height:260px;background:var(--bg-panel);border:2px dashed var(--border);border-radius:var(--radius-lg);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;cursor:pointer">
          <span style="font-size:48px">🖐️</span>
          <span style="font-size:13px;color:var(--text-muted)">Нажмите для загрузки<br>или перетащите файл</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
            <button class="btn btn-outline btn-sm" onclick="simulateUpload()">📁 Выбрать файл</button>
            <button class="btn btn-primary btn-sm" onclick="openFpLibrary()">🗄️ Из базы отпечатков</button>
          </div>
        </div>
        <div id="upload-status" style="font-size:12px;color:var(--text-muted)">Файл не выбран</div>
        <div id="reg-source" style="width:100%"></div>
        <div class="alert alert-warn" style="font-size:12px">⚠️ Поддерживаемые форматы: JPEG, TIFF, PNG. Разрешение не менее 500 dpi. Размер не более 25 МБ.</div>
      </div>
    </div>
  </div>`;
  renderRegSource();
}

// ===== Загрузка изображения следа из внутренней базы отпечатков =====
const FINGER_NAMES = ['Правая рука — большой', 'Правая рука — указательный', 'Правая рука — средний', 'Правая рука — безымянный', 'Правая рука — мизинец',
                      'Левая рука — большой', 'Левая рука — указательный', 'Левая рука — средний', 'Левая рука — безымянный', 'Левая рука — мизинец'];
function _fpImgTag(cardId, cls) {
  const idx = getFingerprintIndex(cardId);
  return `<img class="${cls || ''}${idx >= 60 ? ' fp-mirror' : ''}" src="${FP_IMAGES[idx % 60]}" alt="${esc(cardId)}" loading="lazy">`;
}
function openFpLibrary() {
  closeFpLibrary();
  const ov = document.createElement('div'); ov.id = 'fp-library'; ov.className = 'fplib-overlay';
  ov.innerHTML = `<div class="fplib" role="dialog" aria-label="База отпечатков">
    <div class="fplib-head"><h3>🗄️ Внутренняя база отпечатков</h3><button class="btn btn-outline btn-sm" onclick="closeFpLibrary()">✕ Закрыть</button></div>
    <div class="fplib-tools"><input class="form-control" id="fplib-q" placeholder="Поиск: ID, ФИО, тип узора (петлевой / дуговой / завитковый)" oninput="renderFpLibrary()"></div>
    <div class="fplib-grid" id="fplib-grid"></div></div>`;
  ov.addEventListener('click', e => { if (e.target === ov) closeFpLibrary(); });
  document.body.appendChild(ov); renderFpLibrary(); document.getElementById('fplib-q').focus();
}
function closeFpLibrary() { const o = document.getElementById('fp-library'); if (o) o.remove(); }
function renderFpLibrary() {
  const q = (document.getElementById('fplib-q')?.value || '').trim().toLowerCase();
  const list = DB.tenprints.filter(t => !q || (t.id + ' ' + t.name + ' ' + t.pattern + ' ' + t.region).toLowerCase().includes(q));
  const sel = APP.regSource?.cardId;
  document.getElementById('fplib-grid').innerHTML = list.length ? list.map(t => `
    <button class="fplib-tile${t.id === sel ? ' selected' : ''}" onclick="selectFpSource('${t.id}')">
      ${_fpImgTag(t.id, 'fplib-img')}
      <span class="fplib-id">${t.id}</span><span class="fplib-name">${esc(t.name)}</span><span class="fplib-meta">${esc(t.pattern)} · ${esc(t.region)}</span>
    </button>`).join('') : '<div class="fplib-empty">Ничего не найдено</div>';
}
function selectFpSource(cardId) {
  APP.regSource = { cardId, fingerIndex: APP.regSource?.fingerIndex || 0 };
  closeFpLibrary(); renderRegSource();
  const t = DB.tenprints.find(x => x.id === cardId);
  logAction('FILE_UPLOAD', `Изображение следа выбрано из внутренней базы: карта ${cardId}`);
  const st = document.getElementById('upload-status');
  if (st) st.innerHTML = `<span style="color:var(--accent-green)">✅ Изображение загружено из базы: ${esc(cardId)} (${esc(t.name)})</span>`;
}
function setRegFinger(v) { if (APP.regSource) { APP.regSource.fingerIndex = parseInt(v, 10) || 0; renderRegSource(); } }
function clearRegSource() { APP.regSource = null; renderRegSource(); const st = document.getElementById('upload-status'); if (st) st.textContent = 'Файл не выбран'; }
function renderRegSource() {
  const el = document.getElementById('reg-source'); if (!el) return;
  const s = APP.regSource;
  if (!s) { el.innerHTML = ''; return; }
  const t = DB.tenprints.find(x => x.id === s.cardId); if (!t) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="reg-source-card">
    <div class="reg-source-img">${_fpImgTag(t.id, '')}</div>
    <div class="reg-source-info">
      <div><b>${t.id}</b> · ${esc(t.name)}</div>
      <div class="muted">${esc(t.pattern)} узор · ${esc(t.region)} · ${esc(t.dobDisplay)}</div>
      <label class="form-label" style="margin-top:8px">Палец</label>
      <select class="form-control" onchange="setRegFinger(this.value)">${FINGER_NAMES.map((n, i) => `<option value="${i}"${i === s.fingerIndex ? ' selected' : ''}>${n}</option>`).join('')}</select>
      <div class="muted" style="margin-top:8px">След будет принадлежать этому лицу: в базе появится истинный кандидат.</div>
      <button class="btn btn-outline btn-sm" style="margin-top:8px" onclick="clearRegSource()">✕ Убрать</button>
    </div></div>`;
}

let uploadSimulated = false;
function simulateUpload() { uploadSimulated = true; document.getElementById('upload-status').innerHTML = '<span style="color:var(--accent-green)">✅ Файл загружен: след_S_новый.tif (1.2 МБ)</span>'; logAction('FILE_UPLOAD', 'Загружен файл изображения следа'); }
let _customLatentSeq = 0;
function saveRegistration() {
  const kusp = esc(document.getElementById('reg-kusp').value.trim());
  if (!kusp) { alert('Введите номер КУСП/УД'); return; }
  const date = document.getElementById('reg-date').value;
  const dateDisplay = date ? date.split('-').reverse().join('.') : '—';
  const place = esc(document.getElementById('reg-place').value.trim()) || 'Не указано';
  const type = document.getElementById('reg-type').value;
  const quality = document.getElementById('reg-quality').value;
  const src = APP.regSource ? { ...APP.regSource } : null;
  showLoading('Регистрация следа...', 'Инициализация AI-разметки АДИС');
  setTimeout(() => {
    // ФИКС: раньше регистрация ничего не создавала — просто показывала
    // уведомление и переключала модуль, а APP.currentCase не менялся.
    // Теперь дело реально добавляется в DB.latents и становится активным.
    _customLatentSeq++;
    const id = 'SN' + String(_customLatentSeq).padStart(3, '0');
    // У самостоятельно зарегистрированных следов нет заранее известного
    // «истинного» кандидата в учебной базе — это открытый случай, как и
    // в сценарии миссии 6 (след без совпадения в БД).
    const newLatent = {
      id, kusp, date: dateDisplay, place, type, quality,
      fragment: quality === 'low',
      trueMatch: src ? src.cardId : null, fingerIndex: src ? src.fingerIndex : 0,
      status: 'new', userMinutiae: [], aiMinutiae: [],
      custom: true,
    };
    if (src) newLatent.fpIndex = getFingerprintIndex(src.cardId);   // изображение следа — из внутренней базы
    // ВАЖНО: generateAIMinutiae() сначала ищет дело в DB.latents
    // (DB.latents.find(l => l.id === latentId)) — поэтому push должен
    // произойти РАНЬШЕ вызова generateAIMinutiae, иначе она вернёт [].
    // Также ей нужна эталонная разметка IDEAL_MINUTIAE[id], которая при
    // старте страницы рассчитывается только для встроенных дел — для
    // новых дел, созданных курсантом, генерируем её здесь заранее.
    DB.latents.push(newLatent);
    const srcCard = src && DB.tenprints.find(t => t.id === src.cardId);
    IDEAL_MINUTIAE[id] = generateIdealMinutiae(id, srcCard ? Math.max(8, srcCard.fingers[src.fingerIndex] || 20) : 20);
    newLatent.aiMinutiae = generateAIMinutiae(id);
    newLatent.userMinutiae = newLatent.aiMinutiae.map(m => ({...m}));
    APP.regSource = null;
    APP.currentCase = newLatent;
    APP.currentHitList = [];
    APP.selectedCandidate = null;
    hideLoading();
    logAction('LATENT_REGISTER', `Зарегистрирован новый след ${id}, КУСП ${kusp}`);
    addMentorMsg(`След ${id} успешно зарегистрирован. Перейдите в модуль «Кодирование» для проверки разметки ИИ.`, 'success');
    switchModule('coding');
  }, 1000);
}

// ================================================================
