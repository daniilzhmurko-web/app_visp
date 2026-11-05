/* ЛОГИКА приложения. Данные — в data/. */
// Привязка реальных данных портала ВИСП (ссылки, статусы работ/сбоев) к карточкам сервисов
serviceGroups.forEach(g => g.items.forEach(s => Object.assign(s, SVC_META[s.id] || {})));

const allServices = serviceGroups.flatMap(g => g.items.map(s => ({...s, group: g.title})));

function svcIconSrc(s) {
  const m = /([0-9a-f-]{36})\.png/.exec(s.iconFile || '');
  return (m && SVC_ICON_DATA[m[1]]) || '';
}

function svcAlerts(s, compact) {
  let h = '';
  if (s.change)   h += `<span class="svc-alert svc-alert--change" title="Технологические работы: ${s.change}"><img src="assets/img/img-62564ea2.png" alt=""></span>`;
  if (s.incident) h += `<span class="svc-alert svc-alert--incident" title="Технический сбой: ${s.incident}"><img src="assets/img/img-88401e64.png" alt=""></span>`;
  return h ? `<div class="svc-alerts${compact ? ' svc-alerts--compact' : ''}">${h}</div>` : '';
}

function svcCardTitle(s) {
  if (s.id === 47) return s.name.replace('Розыск-Магистраль»', 'Розыск-<br>Магистраль»');
  return s.name;
}
let servicesViewMode = 'types';
function setServicesView(mode, el) {
  servicesViewMode = mode;
  document.querySelectorAll('.seg-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  renderServices();
}
function renderServices() {
  const c = document.getElementById('servicesContainer');
  if (!c) return;

  if (servicesViewMode === 'list') {
    c.innerHTML = serviceGroups.map(g => `
      <div class="services-section-title">${g.title}</div>
      <div class="services-list">
        ${g.items.map(s => {
          const src = svcIconSrc(s);
          return `
          <div class="service-list-row" onclick="openServiceDetail(${s.id})">
            <div class="service-list-icon">
              ${src ? `<img src="${src}" alt="">` : svgIcon(SVC_ICON[s.id] || 'gear')}
            </div>
            <div class="service-list-text">
              <div class="service-card-name" style="-webkit-line-clamp:1;margin-bottom:2px;">${svcCardTitle(s)}</div>
              <div class="service-card-desc" style="-webkit-line-clamp:1;">${s.desc}</div>
            </div>
            ${svcAlerts(s, true)}
          </div>`;
        }).join('')}
      </div>
    `).join('');
  } else if (servicesViewMode === 'mine') {
    c.innerHTML = `<div style="padding:40px 0;text-align:center;color:var(--text-light);font-size:13px;">
      У вас пока нет сервисов, добавленных в «Мои сервисы».<br>
      Отметьте нужные сервисы во вкладке «По типам» или «Списком», чтобы они появились здесь.
    </div>`;
  } else {
    c.innerHTML = serviceGroups.map(g => `
      <div class="services-section-title">${g.title}</div>
      <div class="services-grid">
        ${g.items.map(s => {
          const src = svcIconSrc(s);
          return `
          <div class="service-card" onclick="openServiceDetail(${s.id})">
            ${svcAlerts(s)}
            <div class="service-card-name">${svcCardTitle(s)}</div>
            <div class="service-card-desc">${s.desc}</div>
            <div class="service-card-wm">
              ${src
                ? `<img src="${src}" alt="">`
                : `<div class="service-card-wm-fallback" style="display:flex;">${svgIcon(SVC_ICON[s.id] || 'gear')}</div>`}
            </div>
          </div>`;
        }).join('')}
      </div>
    `).join('');
  }

  populateAppealSelects();
}
function populateAppealSelects() {
  ['appealServiceSelect', 'appealServiceSelectPage'].forEach(id => {
    const sel = document.getElementById(id);
    if (sel) sel.innerHTML = `<option value="">Выберите сервис</option>` + allServices.map(s => `<option>${s.name}</option>`).join('');
  });
}
