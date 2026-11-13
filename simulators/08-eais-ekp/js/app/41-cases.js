// ===== МОДУЛЬ: УПРАВЛЕНИЕ ДЕЛАМИ =====
// ================================================================
function renderCases() {
  const filterSel = document.getElementById('filter-status-cases');
  const filterVal = filterSel ? filterSel.value : '';
  // Показываем сохранённое значение фильтра после перерисовки
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  <div class="panel mb-24">
    <div class="panel-header"><h3>📁 Все следственные дела — КУСП / УД</h3>
      <div style="display:flex;gap:8px">
        <select class="form-control" style="width:180px" id="filter-status-cases" onchange="renderCases()">
          <option value="">Все статусы</option>
          <option value="new">Новые</option>
          <option value="coding">В разметке</option>
          <option value="searching">В поиске</option>
          <option value="confirmed">Идентифицированы</option>
          <option value="rejected">Не найдены</option>
          <option value="false_positive">Ложные срабатывания</option>
        </select>
      </div>
    </div>
    <div class="panel-body" style="padding:0">
      <table class="data-table">
        <thead><tr><th>#</th><th>ID</th><th>КУСП/УД</th><th>Дата</th><th>Место происшествия</th><th>Состав</th><th>Качество следа</th><th>Статус</th><th>Действие</th></tr></thead>
        <tbody>
        ${(filterVal ? DB.latents.filter(l => l.status === filterVal) : DB.latents).map((l,i)=>`
          <tr>
            <td style="color:var(--text-muted);font-size:12px">${i+1}</td>
            <td><strong>${l.id}</strong></td>
            <td style="font-family:monospace;font-size:12px">${l.kusp}</td>
            <td style="font-size:12px;white-space:nowrap">${l.date}</td>
            <td style="font-size:12px">${l.place}</td>
            <td><span class="badge badge-${l.type.includes('Убийство')?'error':'new'}">${l.type}</span></td>
            <td><span class="badge badge-${l.quality==='high'?'high':l.quality==='medium'?'med':'low'}">${{high:'Высокое',medium:'Среднее',low:'Низкое'}[l.quality]}${l.fragment?' · Фрагмент':''}</span></td>
            <td>${statusBadge(l.status)}</td>
            <td><button class="btn btn-primary btn-sm" onclick="openCase('${l.id}')">▶ Открыть</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  </div>`;
  // Восстановим значение фильтра после перерисовки
  const newSel = document.getElementById('filter-status-cases');
  if (newSel && filterVal) newSel.value = filterVal;
}

function openCase(latentId) {
  const newCase = DB.latents.find(l => l.id === latentId);
  if (!newCase) return;
  // Привязка hit list к активному делу — при смене дела сбрасываем, чтобы UI не показывал чужие результаты
  if (APP.currentCase && APP.currentCase.id !== latentId) {
    APP.currentHitList = [];
    APP.selectedCandidate = null;
    APP.activeSearchQuery = null;
    APP.reportData = null;
  }
  APP.currentCase = newCase;
  logAction('CASE_OPEN', `Открыто дело ${latentId} (КУСП ${APP.currentCase.kusp})`);
  addMentorMsg(`Дело ${latentId} открыто. Следующий шаг — перейти в модуль кодирования минуций и проверить авторазметку ИИ.`, 'info');
  switchModule('coding');
}

// ================================================================
