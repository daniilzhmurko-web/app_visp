'use strict';
/* =====================================================
   РЕНДЕР: СПРАВКА
   ===================================================== */
const RESPONSIBLES = [
  { fio:'Громова Елена Викторовна', post:'Начальник отдела сопровождения ЦИАДИС-МВД',
    unit:'Учебный центр (вымышленные данные)', phone:'8 (000) 000-00-01', email:'e.gromova@example.org' },
  { fio:'Лебедев Андрей Павлович', post:'Старший специалист технической поддержки',
    unit:'Учебный центр (вымышленные данные)', phone:'8 (000) 000-00-02', email:'a.lebedev@example.org' }
];
const IC_PHONE=`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>`, IC_MAIL=`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/></svg>`, IC_USER=`<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>`;

function rResponsibles() {
  return `<div class="svc-h">Ответственные за развитие сервиса</div>` +
    RESPONSIBLES.map(p=>`
    <div class="svc-person">
      <div class="svc-photo">${IC_USER}</div>
      <div class="svc-info">
        <div class="svc-fio">${p.fio}</div>
        <div class="svc-post">${p.post}<br>${p.unit}</div>
        <div class="svc-contacts">
          <span class="svc-c"><span class="ic-box">${IC_PHONE}</span>${p.phone}</span>
          <a class="svc-c" href="mailto:${p.email}"><span class="ic-box">${IC_MAIL}</span>${p.email}</a>
        </div>
      </div>
    </div>`).join('');
}

function rHelp() {
  return `
<div class="sec-title" style="margin-bottom:18px">Справка</div>
<div class="card"><div class="card-body">
  <div class="svc-h" style="margin-top:0">Описание сервиса</div>
  <p style="font-size:13px;color:var(--text2);line-height:1.75">
    <b>ЦИАДИС-МВД</b> — Централизованная интегрированная автоматизированная дактилоскопическая информационная система МВД России.<br><br>
    Система обеспечивает автоматизацию процессов деятельности органов внутренних дел по формированию, ведению и использованию дактилоскопической информации.<br><br>
    <b>Нормативная база:</b> Приказ МВД России от 21.12.2011 № Пр-3849, Регламент доступа сотрудников МВД России к сервису ЦИАДИС-МВД.
  </p>
  ${rResponsibles()}
</div></div>`;
}
