'use strict';
// ── MIGRATION REGISTRATION MODULE ─────────────────
function renderMigrationModule() {
  setContentTitle('Модуль: Миграционный учёт', 'Постановка на учёт по месту пребывания — ППО «Территория» / ГС МИР');
  updateInstructions('migration', 0);
  
  const migCases = CASES.filter(c=>c.type==='migration_reg');
  const rows = migCases.map(c=>{
    const ig = getIG(c.ig);
    const addr = getAddr(c.addr);
    return `<tr onclick="renderMigrationCase(getCase('${c.id}'))" class="${rowColor(c.daysOld)}">
      <td><span class="badge badge-blue">${c.id}</span></td>
      <td><strong>${ig?.name}</strong></td>
      <td>${ig?.nationality}</td>
      <td class="text-sm">${addr?.full}</td>
      <td>${badgeForStatus(c.status)}</td>
      <td>${c.daysOld > 0 ? `<span class="badge ${c.daysOld>=3?'badge-red':'badge-yellow'}">${c.daysOld} дн.</span>` : '<span class="badge badge-green">Сегодня</span>'}</td>
    </tr>`;
  }).join('');

  setContent(`
    <div class="alert alert-info mb-2"><strong>ГС МИР / ППО «Территория»</strong> — модуль первичной постановки на миграционный учёт. Регламент: приём — 10 мин, внесение в ГИС — 3 рабочих дня.</div>
    <div class="card mb-2">
      <div class="card-header" style="justify-content:space-between">
        <span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-inbox"/></svg> Уведомления о прибытии</span>
        <button class="btn btn-primary btn-sm" onclick="openNewMigrationCase()">＋ Новое уведомление</button>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>ИГ</th><th>Гражданство</th><th>Адрес</th><th>Статус</th><th>Срок</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `);
}

function renderMigrationCase(c) {
  if(!c) return;
  STATE.currentCaseId = c.id;
  const ig = getIG(c.ig);
  const hp = getHP(c.hp);
  const addr = getAddr(c.addr);
  setContentTitle(`${c.id} — Миграционный учёт`, `${ig?.name} | ${ig?.nationality}`);
  updateInstructions('migration_case', c.step||0);
  
  // Check traps
  const trapWarning = checkTraps(ig, c, addr, hp);
  
  setContent(`
    <div class="steps mb-3">
      ${['Приём','Проверка','Адрес','Принимающая','Сроки','Регистрация'].map((s,i)=>`
        <div class="step ${i<(c.step||0)?'done':i===(c.step||0)?'active':''}">
          <div class="step-dot">${i<(c.step||0)?'✓':(i+1)}</div>
          <div class="step-label">${s}</div>
        </div>
      `).join('')}
    </div>

    ${trapWarning}
    
    <div class="form-row form-row-2" style="gap:16px">
      <div>
        <div class="section-title">Сведения об иностранном гражданине</div>
        <div class="card mb-2">
          <div class="card-body">
            <div class="dossier-top">
              <div class="dossier-photo">${igPhoto(ig)}</div>
              <div class="dossier-info">
                <div class="dossier-name">${ig?.name}</div>
                <div style="font-size:12px;color:var(--text3)">${ig?.nameEn}</div>
                <div class="dossier-meta">
                  <span class="badge badge-blue">${ig?.nationality}</span>
                  <span class="badge ${ig?.sex==='М'?'badge-blue':'badge-green'}">${ig?.sex==='М'?'Мужской':'Женский'}</span>
                </div>
              </div>
            </div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Дата рождения</label>
                <input class="form-input success" value="${ig?.dob}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Гражданство</label>
                <input class="form-input success" value="${ig?.nationality}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Паспорт</label>
                <input class="form-input ${checkPassportExpiry(ig)?'error':'success'}" value="${ig?.passport}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Срок действия паспорта</label>
                <input class="form-input ${checkPassportExpiry(ig)?'error':'success'}" value="${ig?.passportExp}" readonly>
                ${checkPassportExpiry(ig) ? '<div class="form-error"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Паспорт истекает до конца срока учёта!</div>' : ''}
              </div>
              <div class="form-group">
                <label class="form-label">№ Миграционной карты</label>
                <input class="form-input" value="${ig?.mcard}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Дата въезда (ПС ФСБ)</label>
                <input class="form-input success" value="${ig?.entryDate}" readonly>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Цель въезда</label>
              <input class="form-input" value="${ig?.entryPurpose}" readonly>
            </div>
          </div>
        </div>
        
        <div class="section-title">Адрес места пребывания (ФИАС)</div>
        <div class="card">
          <div class="card-body">
            <div class="form-group">
              <label class="form-label">Адрес (из справочника ФИАС) <span class="required">*</span></label>
              <input class="form-input ${addr?.residents>10?'error':''}" value="${addr?.full}" readonly>
              ${addr?.residents>10 ? `<div class="form-error"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> По данному адресу уже зарегистрировано <strong>${addr.residents}</strong> граждан — признаки «резиновой квартиры»!</div>` : `<div class="form-hint">Зарегистрировано: ${addr?.residents} чел. ✓</div>`}
            </div>
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Заявленный срок пребывания (по)</label>
                <input class="form-input" id="stay-until" type="date" value="${getDefaultStayUntil()}" onchange="checkStayPeriod(this.value, '${ig?.entryDate}', '${ig?.passportExp}')">
              </div>
              <div class="form-group">
                <label class="form-label">Правило 90/180</label>
                <input class="form-input ${check90180(ig)?'error':'success'}" value="${check90180(ig)?'НАРУШЕНИЕ 90/180!':'✓ В норме'}" readonly>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <div class="section-title">Принимающая сторона</div>
        <div class="card mb-2">
          <div class="card-body">
            <div class="form-row form-row-2">
              <div class="form-group">
                <label class="form-label">Тип</label>
                <input class="form-input" value="${hp?.type==='legal'?'Юридическое лицо':'Физическое лицо'}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Наименование / ФИО</label>
                <input class="form-input ${hp?.status==='liquidated'?'error':'success'}" value="${hp?.name}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">ИНН</label>
                <input class="form-input" value="${hp?.inn}" readonly>
              </div>
              <div class="form-group">
                <label class="form-label">Статус (ФНС СМЭВ)</label>
                <input class="form-input ${hp?.status==='liquidated'?'error':'success'}" value="${hp?.status==='liquidated'?'ЛИКВИДИРОВАНА':'✓ Действующая'}" readonly>
              </div>
            </div>
            ${hp?.status==='liquidated' ? '<div class="alert alert-danger"><strong>Ошибка СМЭВ ФНС:</strong> Организация ликвидирована. Основание для отказа.</div>' : ''}
          </div>
        </div>

        ${aminaCard(ig)}
        <div class="section-title">Проверки и действия</div>
        <div class="card">
          <div class="card-body">
            <button class="btn btn-outline w-full mb-1" onclick="openChecks('${c.id}')"><svg class="ic" aria-hidden="true"><use href="#i-search"/></svg> Запустить межведомственные проверки</button>
            ${c.checksDone ? `<div class="alert alert-success"><svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg> Проверки завершены — ${c.checksResult||'нарушений не выявлено'}</div>` : '<div class="alert alert-warning"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Проверки ещё не выполнены</div>'}
            <div class="divider"></div>
            <button class="btn btn-outline w-full mb-1" onclick="openDossier('${ig?.id}')"><svg class="ic" aria-hidden="true"><use href="#i-folder-open"/></svg> Открыть электронное досье</button>
            <button class="btn btn-outline w-full mb-1" onclick="openBorderHistory('${ig?.id}')"><svg class="ic" aria-hidden="true"><use href="#i-passport"/></svg> История пересечений ФСБ</button>
            ${addr?.residents>10 ? `<button class="btn btn-danger w-full mb-1" onclick="sendReportOIK('${c.id}')"><svg class="ic" aria-hidden="true"><use href="#i-send"/></svg> Направить рапорт в ОИК</button>` : ''}
            ${c.daysOld>=1 ? `<button class="btn btn-danger w-full mb-1" onclick="sendAdminProtocol('${c.id}')"><svg class="ic" aria-hidden="true"><use href="#i-scale"/></svg> Протокол КоАП (опоздание)</button>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap">
      <button class="btn btn-ghost" onclick="showScreen('queue')">← Назад</button>
      ${hp?.status==='liquidated' ? 
        `<button class="btn btn-danger" onclick="openDecisionModal('${c.id}')"><svg class="ic" aria-hidden="true"><use href="#i-x-circle"/></svg> Отказать (ликвид. орг-я)</button>` :
        check90180(ig) ?
        `<button class="btn btn-danger" onclick="openDecisionModal('${c.id}')"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Отказать (нарушение 90/180)</button>` :
        `<button class="btn btn-success" onclick="openDecisionModal('${c.id}')"><svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg> Зарегистрировать / Принять решение</button>`
      }
    </div>
  `);
}

function checkPassportExpiry(ig) {
  if(!ig?.passportExp) return false;
  const exp = new Date(ig.passportExp);
  const stayUntil = new Date(SIM_TODAY); stayUntil.setMonth(stayUntil.getMonth()+3);
  return exp < stayUntil;
}

// Правило 90/180: нарушение фиксируется по факту превышения срока пребывания
// (>90 дней с даты въезда), а не по наличию у гражданина произвольной другой
// "ловушки" (fake_check/wanted/fsb_ban и т.п.) — раньше условие ig.trap!==null
// приводило к тому, что предупреждение о 90/180 показывалось для любых
// нарушителей вообще, включая тех, чья "ловушка" не связана со сроком
// пребывания.
function check90180(ig) {
  if(!ig?.entryDate) return false;
  const entry = new Date(ig.entryDate);
  const days = Math.floor((SIM_TODAY - entry) / 86400000);
  return days > 90;
}

// Определяет индекс текущего этапа дела РВП/ВНЖ для индикатора прогресса.
// Раньше использовался массив ['new','pending','pending','waiting','done']
// с задвоенным значением 'pending' — реальных статусов в системе только
// new/pending/waiting/approved/rejected, поэтому indexOf всегда попадал
// на этап 1 и этап "Подготовка решения" никогда не подсвечивался.
// Теперь этап определяется по фактическому прогрессу по делу.
function rvpStageIndex(c) {
  if(!c) return 0;
  if(c.status === 'approved' || c.status === 'rejected' || c.status === 'done') return 4;
  if(c.status === 'waiting') return 3;
  if(c.checksDone) return 2; // проверки пройдены — дело готовится к решению
  if(c.status === 'pending') return 1;
  return 0; // new
}

function checkStayPeriod(stayUntil, entryDate, passportExp) {
  const stay = new Date(stayUntil);
  const passport = new Date(passportExp);
  if(stay > passport) {
    toast('Срок действия паспорта меньше заявленного срока пребывания!', 'warning');
    addScore(-5, 'Указан срок пребывания больше срока действия паспорта');
  }
}

function getDefaultStayUntil() {
  const d = new Date(SIM_TODAY); d.setMonth(d.getMonth()+3);
  return d.toISOString().split('T')[0];
}

function checkTraps(ig, c, addr, hp) {
  const traps = [];
  const am = aminaCheck(ig);
  if (am.level === 'danger' || am.level === 'warn') traps.push(`<div class="alert alert-${am.level==='danger'?'danger':'warning'}"><span class="alert-title">Приложение «Амина»: ${am.title}</span> ${am.text}</div>`);
  
  if(ig?.trap === 'rubber_apt' || addr?.residents > 10) {
    traps.push(`<div class="alert alert-warning"><span class="alert-title"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Массовый адрес!</span> По адресу <strong>${addr?.full}</strong> зарегистрировано ${addr?.residents} иностранных граждан. Требуется рапорт в ОИК.</div>`);
  }
  if(ig?.trap === 'wanted') {
    traps.push(`<div class="alert alert-danger"><span class="alert-title"><svg class="ic" aria-hidden="true"><use href="#i-alert"/></svg> АЛЕРТ ИБД-Р!</span> Заявитель возможно числится в федеральном розыске. Немедленно проверьте через консоль проверок.</div>`);
  }
  if(ig?.trap === 'expired_passport') {
    traps.push(`<div class="alert alert-danger"><span class="alert-title"><svg class="ic" aria-hidden="true"><use href="#i-x-circle"/></svg> Истекающий паспорт!</span> Срок действия документа: <strong>${ig.passportExp}</strong>. Меньше срока заявленного пребывания.</div>`);
  }
  if(hp?.status === 'liquidated') {
    traps.push(`<div class="alert alert-danger"><span class="alert-title"><svg class="ic" aria-hidden="true"><use href="#i-x-circle"/></svg> Ликвидированная организация!</span> ООО «Вектор» ликвидировано. Основание для отказа — предоставление недостоверных сведений.</div>`);
  }
  if(c.daysOld > 7) {
    traps.push(`<div class="alert alert-danger"><span class="alert-title"><svg class="ic" aria-hidden="true"><use href="#i-scale"/></svg> Нарушение сроков подачи!</span> Уведомление подано с нарушением 7-дневного срока. Требуется составление протокола КоАП.</div>`);
  }
  return traps.join('');
}

function openNewMigrationCase() {
  openNewCase();
}
