// ===== МОДУЛЬ: ПОИСК АДИС =====
// ================================================================
const SEARCH_TYPE_LABELS = { 'latent-card':'След → Карта', 'card-card':'Карта → Карта', 'latent-latent':'След → След' };
const DB_LABELS = { regional:'🏙️ Региональная (Краснодарский край)', federal:'🇷🇺 Федеральная (ФБД ИСОД МВД России)', civil:'👤 Гражданская (дактилоскопический учёт)' };
function searchTypeLabel(t) { return SEARCH_TYPE_LABELS[t] || t || '—'; }
function dbLabel(d) { return DB_LABELS[d] || d || '—'; }

function renderSearch() {
  const latent = APP.currentCase;
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  ${latent?`<div class="alert alert-info mb-16">🔍 Активный след: <strong>${latent.id}</strong> — КУСП ${latent.kusp} · ${latent.type} · ${latent.place}</div>`:'<div class="alert alert-warn mb-16">⚠️ Дело не выбрано. Откройте дело перед поиском.</div>'}
  <div class="grid-2" style="gap:20px">
    <div class="panel">
      <div class="panel-header"><h3>⚙️ Параметры поискового запроса</h3></div>
      <div class="panel-body">
        <div class="form-group">
          <label class="form-label">Тип поиска</label>
          <select class="form-control" id="search-type">
            <option value="latent-card">След → Карта (след с места — по известным лицам)</option>
            <option value="card-card">Карта → Карта (дактилокарта — по известным лицам)</option>
            <option value="latent-latent">След → След (между следами с мест преступлений)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">База данных для поиска</label>
          <select class="form-control" id="search-db">
            <option value="regional">🏙️ Региональная (Краснодарский край)</option>
            <option value="federal">🇷🇺 Федеральная (ФБД ИСОД МВД России)</option>
            <option value="civil">👤 Гражданская (дактилоскопический учёт)</option>
          </select>
        </div>
        <div class="filter-section">
          <div class="filter-title">🔧 Фильтры (необязательно — применяйте осторожно)</div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Пол</label>
              <select class="form-control" id="f-gender"><option value="">Любой</option><option value="М">Мужской</option><option value="Ж">Женский</option></select>
            </div>
            <div class="form-group"><label class="form-label">Возраст от</label>
              <input class="form-control" id="f-age-from" type="number" placeholder="напр. 18">
            </div>
            <div class="form-group"><label class="form-label">Возраст до</label>
              <input class="form-control" id="f-age-to" type="number" placeholder="напр. 60">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Регион</label>
              <input class="form-control" id="f-region" placeholder="напр. Краснодар">
            </div>
            <div class="form-group"><label class="form-label">Точная дата рождения</label>
              <input class="form-control" id="f-dob" placeholder="ГГГГ-ММ-ДД" title="Внимание: жёсткий фильтр может исключить нужного кандидата!">
            </div>
          </div>
          <div class="alert alert-warn" style="font-size:12px;margin-top:8px">⚠️ Жёсткие фильтры могут исключить нужного кандидата из выборки! Данные в БД могут содержать опечатки.</div>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%" onclick="runSearch()" ${!latent?'disabled':''}>🚀 Запустить поиск АДИС</button>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><h3>📋 История запросов</h3></div>
      <div class="panel-body" style="padding:0">
        ${DB.searchQueries.length===0?'<div style="padding:20px;font-size:13px;color:var(--text-muted);text-align:center">Запросов ещё нет</div>':
        `<table class="data-table"><thead><tr><th>Запрос</th><th>Тип</th><th>База</th><th>Статус</th><th>Кандидаты</th></tr></thead><tbody>
        ${DB.searchQueries.slice(-8).reverse().map(q=>`<tr><td>${q.latentId}</td><td style="font-size:11px">${searchTypeLabel(q.searchType)}</td><td style="font-size:11px">${dbLabel(q.db)}</td><td>${statusBadge(q.status)}</td><td>${q.candidates?.length||0}</td></tr>`).join('')}
        </tbody></table>`}
      </div>
    </div>
  </div>
  </div>`;
}

function runSearch() {
  const latent = APP.currentCase;
  if (!latent) return;
  const filterParams = {
    gender: document.getElementById('f-gender').value,
    ageFrom: document.getElementById('f-age-from').value,
    ageTo: document.getElementById('f-age-to').value,
    region: document.getElementById('f-region').value,
    dobExact: document.getElementById('f-dob').value,
  };
  const searchType = document.getElementById('search-type').value;
  const db = document.getElementById('search-db').value;

  // Проверяем опасные фильтры
  let filterWarn = '';
  if (filterParams.dobExact) filterWarn = '⚠️ Жёсткий фильтр по дате рождения! В БД могут быть ошибки — кандидат может быть исключён.';
  if (filterParams.region && filterParams.region.length > 15) filterWarn = '⚠️ Слишком специфичный фильтр региона.';

  logAction('SEARCH_START', `${latent.id} · Тип: ${searchTypeLabel(searchType)} · БД: ${dbLabel(db)} · Фильтры: ${JSON.stringify(filterParams)}`);
  APP.score.filter = Object.values(filterParams).every(v=>!v) ? 100 : filterParams.dobExact ? 30 : 75;

  showLoading('Выполняется поиск АДИС «Папилон»...', 'Алгоритмическое сравнение минуций по всей базе данных');
  setTimeout(() => {
    const hitList = buildHitList(latent.id, filterParams, latent.userMinutiae, searchType, db);
    const query = { id:`Q${Date.now()}`, latentId:latent.id, searchType, db, filters:filterParams, status:'completed', candidates:hitList, timestamp:new Date().toLocaleString('ru-RU') };
    DB.searchQueries.push(query);
    APP.currentHitList = hitList;
    APP.activeSearchQuery = query;
    latent.status = 'searching';
    // Сохраним ссылку в casesActivity
    if (APP.casesActivity[latent.id]) APP.casesActivity[latent.id].hitList = hitList;
    hideLoading();
    logAction('SEARCH_COMPLETE', `${latent.id} — найдено кандидатов: ${hitList.length}${latent.trueMatch && !DB.tenprints.find(t => t.id === latent.trueMatch) ? ' (trueMatch отсутствует в базе — следа в БД нет)' : ''}`);
    if (filterWarn) addMentorMsg(filterWarn, 'warn');
    if (latent.trueMatch && !DB.tenprints.find(t => t.id === latent.trueMatch)) {
      addMentorMsg(`ℹ️ Истинный кандидат следа ${latent.id} не зарегистрирован в выбранной базе данных. Рекомендуется эскалация или статус «Неопределённо».`, 'warn');
    }
    addMentorMsg(`Поиск завершён. Найдено ${hitList.length} кандидатов. Перейдите в «Список кандидатов» для анализа. Внимательно проверьте ВСЕ позиции!`, 'success');
    switchModule('hitlist');
  }, 2200);
}

// ================================================================
