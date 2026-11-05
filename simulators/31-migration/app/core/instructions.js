'use strict';
// ── INSTRUCTIONS ──────────────────────────────────
function updateInstructions(context, step) {
  const instructions = {
    migration: { title:'Модуль: Миграционный учёт', steps:[
      {text:'Выберите уведомление из списка или создайте новое (кнопка «＋ Новое уведомление»).', checks:['Выбрано уведомление из очереди']},
    ]},
    migration_case: { title:'Обработка уведомления', steps:[
      {text:'Шаг 1: Проверьте сведения об ИГ — паспорт, дата въезда, миграционная карта, цифровой профиль («Амина»).', checks:['Паспорт проверен','Дата въезда верифицирована (ФСБ)']},
      {text:'Шаг 2: Проверьте адрес на признаки «резиновой квартиры» (ФИАС).', checks:['Адрес проверен по ФИАС','Нагрузка адреса в норме']},
      {text:'Шаг 3: Проверьте принимающую сторону через ФНС СМЭВ.', checks:['ФНС СМЭВ — статус принимающей стороны']},
      {text:'Шаг 4: Выполните межведомственные проверки.', checks:['Запущены проверки СМЭВ']},
      {text:'Шаг 5: Проверьте сроки. Правило 90/180. Срок паспорта.', checks:['Сроки проверены']},
      {text:'Шаг 6: Примите решение и выдайте отрывную часть бланка.', checks:['Решение принято','Уведомление сформировано']},
    ]},
    patent: { title:'Модуль: Патент', steps:[
      {text:'Откройте заявление на патент из очереди.', checks:['Заявление открыто']},
    ]},
    patent_case: { title:'Оформление патента', steps:[
      {text:'Шаг 1: Проверьте весь пакет документов — медсправка, сертификат ЯЗ, полис ДМС.', checks:['Документы проверены']},
      {text:'Шаг 2: Обязательно выполните дактилоскопическую регистрацию (АДИС Папилон).', checks:['Дактилокарта сформирована']},
      {text:'Шаг 3: Проверьте первый авансовый платёж НДФЛ через ФНС.', checks:['НДФЛ-чек верифицирован']},
      {text:'Шаг 4: Запустите проверки безопасности (ИБД-Р/ФСБ).', checks:['Проверки безопасности пройдены']},
      {text:'Шаг 5: Сформируйте бланк патента с QR-кодом.', checks:['Патент выдан']},
    ]},
    rvp: { title:'Модуль: РВП / ВНЖ', steps:[
      {text:'Откройте заявление на РВП или ВНЖ из очереди.', checks:['Заявление открыто']},
    ]},
    rvp_case: { title:'Рассмотрение РВП/ВНЖ', steps:[
      {text:'Шаг 1: Проверьте основания подачи. Для ВНЖ — подтверждающие документы.', checks:['Основания проверены']},
      {text:'Шаг 2: Выполните дактилоскопию — обязательно по ФЗ.', checks:['Дактилоскопия выполнена']},
      {text:'Шаг 3: Запустите веерный запрос (ИБД-Ф/Р, ФСБ, Минздрав, ФССП, ФНС).', checks:['Веерный запрос выполнен']},
      {text:'Шаг 4: Проанализируйте все алерты. Для ВНЖ: проверьте достаточность дохода.', checks:['Алерты проанализированы']},
      {text:'Шаг 5: Сформируйте проект решения — выберите статью ФЗ-115.', checks:['Решение подготовлено']},
      {text:'Шаг 6: Направьте на УКЭП начальника подразделения.', checks:['Дело направлено на подпись']},
    ]},
  };
  
  const instr = instructions[context];
  if(!instr) return;
  const stepInfo = instr.steps[Math.min(step, instr.steps.length-1)] || instr.steps[0];
  const el = document.getElementById('instr-body');
  if(!el) return;
  
  const total = instr.steps.length;
  
  el.innerHTML = `
    <div class="instr-step-title">
      <span class="instr-step-num">${step+1}</span> ${instr.title}
    </div>
    <div class="progress-bar mb-2"><div class="progress-fill" style="width:${(step+1)/total*100}%"></div></div>
    <div class="text-xs text-muted mb-2">Шаг ${step+1} из ${total}</div>
    <p style="font-size:12.5px;line-height:1.7;margin-bottom:10px">${stepInfo.text}</p>
    <ul class="instr-checklist">
      ${stepInfo.checks.map(c=>`<li class="pending"><span class="ci"><svg class="ic" aria-hidden="true"><use href="#i-square"/></svg></span>${c}</li>`).join('')}
    </ul>
    <div class="instr-hint"><svg class="ic" aria-hidden="true"><use href="#i-info"/></svg> Любое нарушение регламента фиксируется в журнале аудита и влияет на оценку.</div>
    <div class="instr-nav-btns">
      ${step > 0 ? `<button class="btn btn-ghost btn-sm" onclick="updateInstructions('${context}',${step-1})">← Пред</button>` : ''}
      ${step < total-1 ? `<button class="btn btn-primary btn-sm" onclick="updateInstructions('${context}',${step+1})">След →</button>` : ''}
    </div>
  `;
}

function updateChecklist(index, done) {
  STATE.checklist[index] = done;
  const el = document.getElementById('instr-body');
  if(!el) return;
  const items = el.querySelectorAll('.instr-checklist li');
  if(items[0]) {
    items[0].className = done ? 'done' : 'pending';
    items[0].querySelector('.ci').innerHTML = done ? '<svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg>' : '<svg class="ic" aria-hidden="true"><use href="#i-square"/></svg>';
  }
}
