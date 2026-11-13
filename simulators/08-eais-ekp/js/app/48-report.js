// ===== МОДУЛЬ: ОТЧЁТ =====
// ================================================================
function renderReport() {
  const latent = APP.currentCase;
  const rd = (APP.reportData && latent && APP.reportData.latent?.id === latent.id) ? APP.reportData : null;
  const cand = rd ? rd.candidate : APP.selectedCandidate;
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
    <button class="btn btn-primary" onclick="generateReport()">📄 Сформировать справку</button>
    <button class="btn btn-outline" onclick="printReport()">🖨️ Печать (защищённый PDF)</button>
    <button class="btn btn-warning" onclick="downloadReport()" style="margin-left:auto">📊 Скачать JSON-отчёт</button>
  </div>
  <div class="report-preview" id="report-content">
    <div class="report-header">
      <h2>МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ РОССИИ<br>ГУ МВД России по Краснодарскому краю<br>Экспертно-криминалистический центр</h2>
      <p style="margin-top:8px">ЭКСПЕРТНАЯ СПРАВКА ПО РЕЗУЛЬТАТАМ ДАКТИЛОСКОПИЧЕСКОЙ ЭКСПЕРТИЗЫ</p>
      <p>Дата: ${new Date().toLocaleDateString('ru-RU')} &nbsp;|&nbsp; Время: ${new Date().toLocaleTimeString('ru-RU')}</p>
    </div>
    <div class="report-section">
      <h4>1. Реквизиты экспертизы</h4>
      <div class="report-row"><span class="r-label">Номер КУСП / Уголовное дело:</span><span>${latent?.kusp||'—'}</span></div>
      <div class="report-row"><span class="r-label">ID следа:</span><span>${latent?.id||'—'}</span></div>
      <div class="report-row"><span class="r-label">Место обнаружения:</span><span>${latent?.place||'—'}</span></div>
      <div class="report-row"><span class="r-label">Дата обнаружения:</span><span>${latent?.date||'—'}</span></div>
      <div class="report-row"><span class="r-label">Тип преступления:</span><span>${latent?.type||'—'}</span></div>
      <div class="report-row"><span class="r-label">Качество следа:</span><span>${(latent && {high:'Высокое',medium:'Среднее',low:'Низкое'}[latent.quality])||'—'}</span></div>
    </div>
    <div class="report-section">
      <h4>2. Параметры поиска АДИС «Папилон»</h4>
      <div class="report-row"><span class="r-label">Тип поиска:</span><span>${searchTypeLabel(APP.activeSearchQuery?.searchType)||'След → Карта'}</span></div>
      <div class="report-row"><span class="r-label">База данных:</span><span>${dbLabel(APP.activeSearchQuery?.db)||'Региональная'}</span></div>
      <div class="report-row"><span class="r-label">Кандидатов в Hit List:</span><span>${APP.currentHitList?.length||0}</span></div>
    </div>
    <div class="report-section">
      <h4>3. Идентифицированный кандидат</h4>
      <div class="report-row"><span class="r-label">ФИО:</span><span>${cand?.name||'Не установлен'}</span></div>
      <div class="report-row"><span class="r-label">ID дактилокарты:</span><span>${cand?.id||'—'}</span></div>
      <div class="report-row"><span class="r-label">Дата рождения:</span><span>${cand?.dobDisplay||'—'}</span></div>
      <div class="report-row"><span class="r-label">Регион регистрации:</span><span>${cand?.region||'—'}</span></div>
      <div class="report-row"><span class="r-label">Криминальная история:</span><span>${cand?.crimHist||'—'}</span></div>
    </div>
    <div class="report-section">
      <h4>4. Результаты верификации (RL_POSITIVE)</h4>
      <div class="report-row"><span class="r-label">Совпадающих признаков:</span><span>${rd?.count||'—'}</span></div>
      <div class="report-row"><span class="r-label">Уровень достоверности:</span><span>${(rd && {high:'Высокая',medium:'Средняя',low:'Низкая'}[rd.confidence])||'—'}</span></div>
      <div class="report-row"><span class="r-label">Обоснование эксперта:</span><span style="font-style:italic">${rd?.reason||'Не заполнено'}</span></div>
    </div>
    <div class="report-section">
      <h4>5. Заключение</h4>
      <p style="font-size:13px;line-height:1.8">${cand&&rd?`На основании проведённого дактилоскопического исследования след пальца руки, изъятый по КУСП ${latent?.kusp||'—'} с места происшествия по адресу: ${latent?.place||'—'}, принадлежит гражданину <strong>${cand.name}</strong> (д.р. ${cand.dobDisplay}). Совпадение установлено по ${rd.count} идентификационным признакам папиллярного узора с достоверностью: ${rd.confidence==='high'?'высокая':rd.confidence==='medium'?'средняя':'низкая'}.`:'<em>Заключение будет сформировано после подтверждения совпадения.</em>'}</p>
    </div>
    <div class="report-signature">
      <div>Эксперт: ${APP.user?.displayName||'—'} &nbsp;|&nbsp; Подразделение: ${APP.user?.dept||'—'}</div>
      <div>Дата и время формирования справки: ${new Date().toLocaleString('ru-RU')}</div>
      <div style="margin-top:8px;font-family:monospace;font-size:10px;color:var(--text-muted)">ЭП: [защищённая цифровая подпись СУДИС-М] · Документ зарегистрирован в СЭД МВД</div>
    </div>
  </div>
  </div>`;
}

function generateReport() { logAction('REPORT_GENERATE', `Справка по делу ${APP.currentCase?.kusp || '—'}`); showNotification('Справка сформирована и направлена в СЭД МВД', 'success'); }
function _cleanReportHtml(el) {
  const c = el.cloneNode(true);
  c.querySelectorAll('svg.ic').forEach(n => n.remove());
  return stripEmoji(c.innerHTML);
}
function printReport() {
  const el=document.getElementById('report-content');
  const w=window.open('','_blank');
  if(!w){showNotification('Разрешите всплывающие окна для печати','warn');return;}
  w.document.write(`<html><head><title>Экспертная справка СЭКО</title><style>body{font-family:Segoe UI,sans-serif;padding:32px;max-width:700px;margin:0 auto}h2{font-size:16px}h4{font-size:13px;border-bottom:1px solid #ccc;padding-bottom:4px;margin:16px 0 8px}.r-label{font-weight:600;display:inline-block;min-width:200px}</style></head><body>${_cleanReportHtml(el)}</body></html>`);
  w.document.close(); w.focus(); w.print();
  logAction('REPORT_PRINT',`Печать справки — пользователь: ${APP.user?.displayName}`);
}

// ================================================================
