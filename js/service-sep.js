/* ЛОГИКА приложения. Данные — в data/. */
const SVC1_NOTICES_FOOTER = "Приносим извинения за временные неудобства.";

// ─── Общий сайдбар сервиса «СЭП» (Документы / Ответственные / Техподдержка) — показывается на всех вкладках ───
function renderSvc1Sidebar() {
  return `
    <div style="display:flex;justify-content:space-between;align-items:baseline;">
      <div class="svc-block-title">Документы</div>
      <a class="svc-ext-link" style="border:none;padding:0;font-size:12.5px;" onclick="showToast('Все документы')">Все документы »</a>
    </div>
    <div style="display:flex;align-items:center;gap:8px;font-weight:700;font-size:13px;color:var(--title-navy);margin:-6px 0 10px;">
      <span style="color:var(--text-light);">—</span> Основные документы
    </div>
    <div style="border-top:1px solid var(--border);margin-bottom:4px;"></div>
    <div>
      ${SVC1_DOCS.map(d => `
        <div class="doc-item" onclick="showToast('Открытие документа...')">
          <div class="doc-badge" style="background:${DOC_BADGE_COLOR[d.ext] || '#8a96a3'}">${d.ext}</div>
          <div><div class="doc-name">${d.name}</div><div class="doc-date">Загружен ${d.date}</div></div>
        </div>
      `).join('')}
    </div>
    <div class="svc-block-title" style="margin-top:26px;">Ответственные за развитие сервиса</div>
    <div class="responsible-card">
      <div class="responsible-photo"><span class="icon" data-icon="person"></span></div>
      <div>
        <div style="font-size:calc(12px + 1pt);"><span style="font-weight:700;">Фролов</span> <span style="font-weight:400;">Станислав Андреевич</span></div>
        <div style="color:var(--text-light);">${SVC1_RESPONSIBLE.role}</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;">
          <span style="display:flex;align-items:center;gap:6px;color:var(--text);"><span class="icon" data-icon="phone" style="width:13px;height:13px;color:var(--blue);"></span>${SVC1_RESPONSIBLE.phone}</span>
          <span style="display:flex;align-items:center;gap:6px;color:var(--text);"><span class="icon" data-icon="mail" style="width:13px;height:13px;color:var(--blue);"></span>${SVC1_RESPONSIBLE.email}</span>
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

function renderSvc1DescHTML() {
  return `
    <div class="svc-layout">
      <div>
        <div class="svc-block-title">Описание сервиса</div>
        <div class="svc-desc-text">
          Прикладной сервис функций электронной почты - один из сервисов ИСОД МВД России, обеспечивающий обмен электронными сообщениями между сотрудниками центрального аппарата МВД России, территориальных органов МВД России, а также иных организаций и подразделений, созданных для выполнения задач и осуществления полномочий, возложенных на органы внутренних дел.<br><br>
          Внедрение СЭП призвано обеспечить повышение оперативности и качества работы по координации и внутреннему взаимодействию между сотрудниками ведомства, снижение трудозатрат и сокращение издержек на выполнение функций обмена информацией, содействие при создании условий для перехода от традиционного бумажного документооборота к взаимодействию в электронном виде.
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn-primary" id="svcUseBtn" onclick="openCurrentSim()">Воспользоваться сервисом</button>
          <button class="btn-sm instr" style="padding:9px 18px;font-size:13px;" onclick="openCurrentInstruction()"><span class="icon" data-icon="doc"></span> Инструкция</button>
        </div>

        <div class="section-title-block" style="margin-top:30px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <div class="section-title">Обучение по сервису</div>
            <a class="svc-ext-link" style="border:none;padding:0;font-size:12.5px;" onclick="showToast('Переход к сервису обучения...')">Перейти к сервису »</a>
          </div>
          <div class="section-title-line"></div>
        </div>
        <div style="display:flex;max-width:420px;">
          <div style="flex:1;border:1px solid var(--border);border-right:none;border-radius:4px 0 0 4px;padding:13px 16px;font-size:13px;font-weight:700;color:var(--text);background:#fff;">Курс по обучению</div>
          <button class="btn-primary" style="border-radius:0 4px 4px 0;width:48px;flex-shrink:0;padding:0;font-size:16px;" onclick="showToast('Открытие курса обучения...')">→</button>
        </div>
      </div>
      <div>${renderSvc1Sidebar()}</div>
    </div>
  `;
}

function renderSvc1QaHTML() {
  return `
    <div class="svc-layout">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <div class="svc-block-title">Вопросы и ответы</div>
          <a class="svc-ext-link" style="border:none;padding:0;font-size:12.5px;" onclick="showToast('Все вопросы')">Все вопросы »</a>
        </div>
        <div>
          ${SVC1_QA.map(q => `
            <div class="qa-simple-item">
              <div class="qa-simple-q" onclick="this.parentElement.classList.toggle('open')"><span>${q}</span><span class="icon">${ICONS.chevron}</span></div>
              <div class="qa-simple-a">Для получения подробной информации по данному вопросу обратитесь в Единый центр эксплуатации ИСОД МВД России (8 800 2000-462) либо оформите обращение через форму на портале ВИСП.</div>
            </div>
          `).join('')}
        </div>
        <div class="not-found-box">
          <b>Не нашли ответ на свой вопрос?</b>
          Сотрудники круглосуточной службы поддержки готовы помочь вам.
          <div style="margin-top:10px;"><button class="btn-secondary" onclick="openNewAppealPage()">Задать вопрос в ЕЦЭ</button></div>
        </div>
      </div>
      <div>${renderSvc1Sidebar()}</div>
    </div>
  `;
}

function toggleVer(el) { el.parentElement.classList.toggle('open'); }

function renderSvc1DevHTML() {
  return `
    <div class="svc-layout">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <div class="svc-block-title">Описание версий сервиса</div>
          <a class="svc-ext-link" style="border:none;padding:0;font-size:12.5px;" onclick="showToast('Архив версий')">Архив »</a>
        </div>
        <div>
          ${SVC1_VERSIONS.map(v => `
            <div class="ver-item">
              <div class="ver-row" onclick="toggleVer(this)">
                <div class="ver-name">${v.name}</div>
                <div class="ver-right">
                  <div class="ver-badge">${v.badge}</div>
                  <span class="icon ver-toggle">${ICONS.chevron}</span>
                </div>
              </div>
              <div class="ver-detail">Подробное описание изменений версии будет доступно после публикации релиза.</div>
            </div>
          `).join('')}
        </div>
      </div>
      <div>${renderSvc1Sidebar()}</div>
    </div>
  `;
}

function renderSvc1Notices() {
  document.getElementById('svcNoticesList').innerHTML = SVC1_NOTICES.map(n => `
    <div class="svc-notice svc-notice--change" style="display:flex;justify-content:space-between;align-items:center;gap:14px;">
      <div>${n}</div>
      <img src="assets/img/img-62564ea2.png" alt="" style="width:22px;height:22px;flex-shrink:0;">
    </div>
  `).join('');
  document.getElementById('svcNoticesFooter').textContent = SVC1_NOTICES_FOOTER;
}
