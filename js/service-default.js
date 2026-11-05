/* ЛОГИКА приложения. Данные — в data/. */
// ─── Шаблоны по умолчанию (для всех сервисов, кроме id 1 и 49) ───
function renderDefaultDescHTML() {
  return `
    <div class="svc-layout">
      <div>
        <div class="svc-block-title">Описание сервиса</div>
        <div class="svc-desc-text" id="svcDescText"></div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-primary" id="svcUseBtn" onclick="openCurrentSim()">Воспользоваться сервисом</button>
          <button class="btn-sm instr" style="padding:9px 18px;font-size:13px;" onclick="openCurrentInstruction()"><span class="icon" data-icon="doc"></span> Инструкция</button>
        </div>
      </div>
      <div>
        <div class="svc-block-title">Документы</div>
        <div id="svcDocs"></div>
      </div>
    </div>
  `;
}
function renderDefaultQaHTML() {
  return `
    <div class="svc-block-title">Вопросы и ответы</div>
    <div id="svcQaList"></div>
    <div class="not-found-box">
      <b>Не нашли ответ на свой вопрос?</b>
      Сотрудники круглосуточной службы поддержки готовы помочь вам.
      <div style="margin-top:10px;"><button class="btn-secondary" onclick="openNewAppealPage()">Задать вопрос в ЕЦЭ</button></div>
    </div>
  `;
}
function renderDefaultDevHTML() {
  return `
    <div class="svc-block-title">Ответственные за развитие сервиса</div>
    <div class="responsible-card">
      <div class="responsible-photo"><span class="icon" data-icon="person"></span></div>
      <div>
        <div style="font-weight:700;">Лазарев Тимур Олегович</div>
        <div style="color:var(--text-light);">ЦВЦ МВД России, заместитель начальника отдела — начальник 1 отделения 5 отдела</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;">
          <span style="display:flex;align-items:center;gap:6px;"><span class="icon" data-icon="phone" style="width:13px;height:13px;color:var(--blue);"></span>8 (495) 031-02-45</span>
          <span style="display:flex;align-items:center;gap:6px;"><span class="icon" data-icon="mail" style="width:13px;height:13px;color:var(--blue);"></span>tlazarev9@mvd.ru</span>
        </div>
      </div>
    </div>
    <div class="support-block">
      <div class="svc-block-title" style="margin-top:22px;">Техническая поддержка</div>
      <div class="srow"><span class="icon" data-icon="phone"></span> 8 800 2000-462</div>
      <div class="srow"><span class="icon" data-icon="phone"></span> 8 495 031-67-17</div>
    </div>
  `;
}
function fillDefaultDesc(svc) {
  document.getElementById('svcDescText').innerHTML =
    `Сервис <b>«${svc.name}»</b> — ${svc.desc.charAt(0).toLowerCase() + svc.desc.slice(1)}. ` +
    `Сервис входит в состав «${svc.group}» Единой системы информационно-аналитического обеспечения деятельности МВД России (ИСОД МВД России) ` +
    `и доступен пользователям в соответствии с Регламентом доступа к ИСОД МВД России.` +
    (svc.change ? `<div class="svc-notice svc-notice--change" style="display:flex;justify-content:space-between;align-items:center;gap:14px;"><div><b>Технологические работы:</b> ${svc.change}</div><img src="assets/img/img-62564ea2.png" alt="" style="width:22px;height:22px;flex-shrink:0;"></div>` : '') +
    (svc.incident ? `<div class="svc-notice svc-notice--incident" style="display:flex;justify-content:space-between;align-items:center;gap:14px;"><div><b>Технический сбой:</b> ${svc.incident}</div><img src="assets/img/img-88401e64.png" alt="" style="width:22px;height:22px;flex-shrink:0;"></div>` : '') +
    (svc.url ? `<div class="svc-link-row"><a class="svc-ext-link" href="${svc.url}" target="_blank" rel="noopener">Открыть страницу сервиса на ВИСП →</a></div>` : '');

  document.getElementById('svcDocs').innerHTML = svcDocsSample.map(d => `
    <div class="doc-item" onclick="showToast('Открытие документа...')">
      <div class="doc-badge" style="background:${DOC_BADGE_COLOR[d.ext] || '#8a96a3'}">${d.ext}</div>
      <div><div class="doc-name">${d.name}</div><div class="doc-date">Загружен ${d.date}</div></div>
    </div>
  `).join('');
}
function fillDefaultQa() {
  document.getElementById('svcQaList').innerHTML = svcQaSample.map(q => `
    <div class="qa-simple-item">
      <div class="qa-simple-q" onclick="this.parentElement.classList.toggle('open')"><span>${q}</span><span class="icon">${ICONS.chevron}</span></div>
      <div class="qa-simple-a">Для получения подробной информации по данному вопросу обратитесь в Единый центр эксплуатации ИСОД МВД России (8 800 2000-462) либо оформите обращение через форму на портале ВИСП.</div>
    </div>
  `).join('');
}

function renderSvc49Docs() {
  return SVC49_DOCS.map(d => `
    <div class="doc-item" onclick="showToast('Открытие документа...')">
      <div class="doc-badge" style="background:${DOC_BADGE_COLOR[d.ext] || '#8a96a3'}">${d.ext}</div>
      <div><div class="doc-name">${d.name}</div><div class="doc-date">Загружен ${d.date}</div></div>
    </div>
  `).join('');
}

function renderSvc49DescHTML() {
  return `
    <div class="svc-layout">
      <div>
        <div class="svc-block-title">Описание сервиса</div>
        <div class="svc-desc-text">
          Для корректной работы сервисов ИСОД МВД России рабочее место пользователя должно быть оснащено всем необходимым оборудованием и соответствующим образом настроено.<br><br>
          Минимальные требования к настройке и оснащению АРМ пользователя ИСОД МВД России подробно описаны в инструкции по настройке типового рабочего места. Основная настройка АРМ пользователя ИСОД МВД России осуществляется с использованием общего инсталляционного пакета.
        </div>
        <button class="btn-primary" style="white-space:normal;text-align:center;line-height:1.35;padding:14px 22px;max-width:360px;" onclick="showToast('Открытие хранилища файлов ЕЦЭ ИСОД МВД России...')">Хранилище файлов ЕЦЭ ИСОД МВД России сервиса «TPM Astra Linux»</button>
      </div>
      <div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <div class="svc-block-title">Документы</div>
          <a class="svc-ext-link" style="border:none;padding:0;font-size:12.5px;" onclick="showToast('Все документы')">Все документы »</a>
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:var(--title-navy);margin:-6px 0 10px;">
          <span style="color:var(--text-light);">—</span> Основные документы
        </div>
        <div style="border-top:1px solid var(--border);margin-bottom:4px;"></div>
        <div id="svcDocs">${renderSvc49Docs()}</div>
      </div>
    </div>

    <div class="section-title-block" style="margin-top:32px;"><div class="section-title">Измерение скорости соединения</div><div class="section-title-line"></div></div>
    <div style="display:flex;max-width:420px;">
      <div id="speedBox" style="flex:1;border:1px solid var(--border);border-right:none;border-radius:4px 0 0 4px;padding:13px 16px;font-size:13px;font-weight:700;color:var(--text);background:#fff;">Начать измерение</div>
      <button class="btn-primary" style="border-radius:0 4px 4px 0;width:48px;flex-shrink:0;padding:0;font-size:16px;" onclick="runSpeedTest(this)">→</button>
    </div>

    <div class="section-title-block" style="margin-top:28px;"><div class="section-title">Техническая поддержка</div><div class="section-title-line"></div></div>
    <div class="support-block">
      <div class="srow"><span class="icon" data-icon="phone"></span> 8 800 2000-462</div>
      <div class="srow"><span class="icon" data-icon="phone"></span> 8 495 031-67-17</div>
    </div>
  `;
}

function runSpeedTest(btn) {
  const box = document.getElementById('speedBox');
  if (!box || btn.disabled) return;
  btn.disabled = true;
  box.textContent = 'Идёт измерение...';
  setTimeout(() => {
    const speed = (Math.random() * 70 + 30).toFixed(1);
    box.textContent = 'Скорость соединения: ' + speed + ' Мбит/с';
    btn.disabled = false;
  }, 1400);
}
