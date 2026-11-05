// Цифровой контроль: приложение «Амина» (ГКУ «Информационный город»).
// Правила — по открытым источникам об эксперименте в Москве и Московской области (с 01.09.2025); для учебных целей.
const AMINA_COUNTRIES = ['Узбекистан','Таджикистан','Киргизия','Армения','Казахстан','Грузия','Азербайджан','Молдова','Украина'];
const AMINA_STATE = {active:'Активна', not_installed:'Не установлена', removed:'Удалена с устройства', no_geo:'Нет геолокации'};
function aminaRequired(ig) { return !!ig && AMINA_COUNTRIES.includes(ig.nationality) && ig.entryPurpose === 'Работа'; }
function aminaCheck(ig) {
  const a = ig?.amina || {};
  if (!aminaRequired(ig)) return {level:'na', title:'Установка не требуется', text:'Гражданство или цель въезда не подпадают под режим учёта через приложение.'};
  if (a.state === 'not_installed' || a.state === 'removed') return {level:'danger', title:'Приложение «Амина» '+(a.state==='removed'?'удалено':'не установлено'),
    text:'Учёт по адресу в этом режиме возможен только через приложение. Основание для отказа или приостановки; ИГ направляется на установку.'};
  if (a.state === 'no_geo' && a.gap_wd >= 6) return {level:'danger', title:`Геолокация не поступает ${a.gap_wd} раб. дн.`,
    text:'Уведомление уже направлялось (3 раб. дня). Повторное отсутствие данных — снятие с учёта по адресу ММЦ, возможно включение в реестр контролируемых лиц.'};
  if (a.state === 'no_geo' && a.gap_wd >= 3) return {level:'warn', title:`Геолокация не поступает ${a.gap_wd} раб. дн.`,
    text:'Направьте уведомление: подтвердить адрес проживания или сообщить о его смене в течение 3 раб. дней.'};
  if (a.geo_match === false) return {level:'warn', title:'Геопозиция не совпадает с заявленным адресом', text:'Типичная ситуация «фиктивной» регистрации: ИГ фактически проживает не по заявленному адресу.'};
  if (a.work_match === false) return {level:'warn', title:'Место работы по геотреку ≠ принимающая сторона', text:'По перемещениям ИГ работает не у заявленного работодателя. Проверьте основание пребывания и разрешительные документы.'};
  return {level:'ok', title:'Мониторинг в норме', text:''};
}
function aminaCard(ig) {
  const a = ig?.amina || {}, am = aminaCheck(ig), req = aminaRequired(ig);
  const cls = v => v==='ok'?'success':v==='bad'?'error':'';
  const row = (l, v, k) => `<div class="form-group"><label class="form-label">${l}</label><input class="form-input ${cls(k)}" value="${v}" readonly></div>`;
  const ok = (c, y, n) => c === false ? [n,'bad'] : [y,'ok'];
  const [g1,g1k] = ok(a.geo_match,'Совпадает','Не совпадает'), [w1,w1k] = ok(a.work_match,'Подтверждено','Расхождение');
  return `<div class="section-title">Цифровой контроль (приложение «Амина»)</div>
  <div class="card"><div class="card-body">
    <div class="form-row form-row-2">
      ${row('Подлежит установке', req?'Да':'Нет', req?'':'')}
      ${row('Статус приложения', req?(AMINA_STATE[a.state]||'—'):'—', req?(a.state==='active'?'ok':'bad'):'')}
      ${row('Установлено при въезде (ПП)', req?(a.at_border?'Да':'Нет'):'—', req?(a.at_border?'ok':'bad'):'')}
      ${row('Активация', req?(a.installed||'—'):'—','')}
      ${row('Последняя геопозиция', req?`${a.last_geo||'—'}${a.gap_wd?` (${a.gap_wd} раб. дн. без данных)`:''}`:'—', req?(a.gap_wd>=3?'bad':'ok'):'')}
      ${row('Геопозиция ↔ заявленный адрес', req?g1:'—', req?g1k:'')}
      ${row('Место работы по геотреку ↔ принимающая сторона', req?w1:'—', req?w1k:'')}
    </div>
    ${am.level==='danger'||am.level==='warn' ? `<div class="alert alert-${am.level==='danger'?'danger':'warning'} mt-1"><strong>${am.title}.</strong> ${am.text}</div>` : ''}
  </div></div>`;
}
