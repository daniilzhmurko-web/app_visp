'use strict';
// ── PATENT MODULE ─────────────────────────────────
function renderPatentModule() {
  setContentTitle('Модуль: Оформление патента', 'Трудовая деятельность ИГ на территории РФ');
  updateInstructions('patent', 0);
  
  const patCases = CASES.filter(c=>c.type==='patent');
  const rows = patCases.map(c=>{
    const ig = getIG(c.ig);
    return `<tr onclick="renderPatentCase(getCase('${c.id}'))" class="${rowColor(c.daysOld)}">
      <td><span class="badge badge-blue">${c.id}</span></td>
      <td><strong>${ig?.name}</strong></td>
      <td>${ig?.nationality}</td>
      <td>${badgeForStatus(c.status)}</td>
      <td>${c.fingerprintsDone ? '<span class="badge badge-green">✓</span>' : '<span class="badge badge-red">Нет</span>'}</td>
    </tr>`;
  }).join('');
  
  setContent(`
    <div class="alert alert-info mb-2">Приказ МВД №695/2020. Патент выдаётся на 1–12 месяцев. <strong>Обязательно:</strong> дактилоскопия, проверка первого НДФЛ-чека, медицинские документы, сертификат о знании русского языка.</div>
    <div class="card">
      <div class="card-header" style="justify-content:space-between">
        <span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-id-card"/></svg> Заявления на патент</span>
        <button class="btn btn-primary btn-sm" onclick="openNewCase()">＋ Новое заявление</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>ИГ</th><th>Гражданство</th><th>Статус</th><th>Дактилоскопия</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `);
}

function renderPatentCase(c) {
  if(!c) return;
  STATE.currentCaseId = c.id;
  const ig = getIG(c.ig);
  setContentTitle(`${c.id} — Оформление патента`, `${ig?.name}`);
  updateInstructions('patent_case', 0);
  
  // Simulate payment data
  const payments = generatePayments(ig, c);
  const payRows = payments.map((p,i)=>`
    <tr class="${p.status==='fake'?'row-red':p.status==='late'?'row-yellow':''}">
      <td>${p.month}</td>
      <td>${p.receipt}</td>
      <td>${p.inn}</td>
      <td>${p.amount} руб.</td>
      <td>${p.period}</td>
      <td><span class="badge ${p.status==='ok'?'badge-green':p.status==='late'?'badge-yellow':'badge-red'}">${p.status==='ok'?'✓ Подтверждён':p.status==='late'?'<svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Просрочен':'<svg class="ic" aria-hidden="true"><use href="#i-x-circle"/></svg> Не подтверждён'}</span></td>
    </tr>
  `).join('');

  const fingersHtml = renderFingerprintWidget(c.id);

  setContent(`
    <div class="steps mb-3">
      ${['Пакет документов','Дактилоскопия','ИНН / ФНС','Проверка чека','Выдача патента'].map((s,i)=>`
        <div class="step ${i<(c.step||0)?'done':i===(c.step||0)?'active':''}">
          <div class="step-dot">${i<(c.step||0)?'✓':(i+1)}</div>
          <div class="step-label">${s}</div>
        </div>
      `).join('')}
    </div>

    <div class="form-row form-row-2" style="gap:16px">
      <div>
        <div class="section-title">Документы заявителя</div>
        <div class="card mb-2">
          <div class="card-body">
            <div class="dossier-top">
              <div class="dossier-photo">${igPhoto(ig)}</div>
              <div class="dossier-info">
                <div class="dossier-name">${ig?.name}</div>
                <div class="dossier-meta">
                  <span class="badge badge-blue">${ig?.nationality}</span>
                  <span class="badge badge-gray">Паспорт: ${ig?.passport}</span>
                </div>
              </div>
            </div>
            <div class="divider"></div>
            <div class="section-title" style="margin-bottom:8px">Обязательный пакет документов</div>
            <div id="doc-checklist">
              ${renderDocChecklist(c)}
            </div>
          </div>
        </div>

        <div class="section-title">Финансовый контроль (НДФЛ)</div>
        <div class="card">
          <div class="card-header">
            <span class="card-title"><svg class="ic" aria-hidden="true"><use href="#i-banknote"/></svg> Авансовые платежи из ФНС</span>
          </div>
          <div class="table-wrap">
            <table class="check-table">
              <thead><tr><th>Месяц</th><th>Квитанция</th><th>ИНН</th><th>Сумма</th><th>Период</th><th>Статус</th></tr></thead>
              <tbody>${payRows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div class="section-title">Биометрическая регистрация (АДИС «Папилон»)</div>
        ${fingersHtml}

        <div class="divider"></div>
        <div class="section-title">Генерация патента</div>
        <div class="card">
          <div class="card-body">
            <button class="btn btn-outline w-full mb-1" onclick="openChecks('${c.id}')"><svg class="ic" aria-hidden="true"><use href="#i-search"/></svg> Проверки безопасности (ИБД-Р/ФСБ)</button>
            ${c.checksDone ? '<div class="alert alert-success mt-1"><svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg> Проверки пройдены</div>' : '<div class="alert alert-warning mt-1"><svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg> Проверки не выполнены</div>'}
            <div class="divider"></div>
            <button class="btn btn-success w-full" id="btn-issue-patent" ${c.fingerprintsDone && c.checksDone ? '' : 'disabled'} onclick="issuePatent('${c.id}')">
              <svg class="ic" aria-hidden="true"><use href="#i-id-card"/></svg> Выдать патент (генерация бланка)
            </button>
            ${!c.fingerprintsDone ? '<div class="form-hint text-danger">Сначала выполните дактилоскопическую регистрацию</div>' : ''}
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn btn-ghost" onclick="showScreen('patent-module')">← Назад</button>
      <button class="btn btn-danger" onclick="openDecisionModal('${c.id}', true)"><svg class="ic" aria-hidden="true"><use href="#i-x-circle"/></svg> Отказать в выдаче</button>
    </div>
  `);
}

function generatePayments(ig, c) {
  const months = ['Январь','Февраль','Март','Апрель','Май','Июнь'];
  const amount = 5200 + Math.floor(Math.random()*800);
  return months.slice(0,4).map((m,i)=>{
    let status = 'ok';
    if(ig?.trap === 'fake_check' && i===2) status = 'fake';
    if(ig?.trap === 'late_payment' && i===3) status = 'late';
    return {
      month: m,
      receipt: `ЧЕК-${100000+i}`,
      inn: ig?.inn||'—',
      amount,
      period: `01.0${i+1} – 28.0${i+1}`,
      status
    };
  });
}

function renderDocChecklist(c) {
  const ig = getIG(c.ig);
  const docs = [
    {label:'Заявление (заполнено)', ok: true},
    {label:'Паспорт (скан)', ok: !checkPassportExpiry(ig)},
    {label:'Полис ДМС', ok: true},
    {label:'Медицинская справка (Минздрав)', ok: ig?.trap !== 'fake_medical'},
    {label:'Сертификат о знании русского языка', ok: true},
    {label:'Квитанция первого НДФЛ-платежа', ok: ig?.trap !== 'fake_check'},
    {label:'Фотография 3×4', ok: true},
  ];
  return docs.map(d=>`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-size:16px">${d.ok?'<svg class="ic ic-ok" aria-hidden="true"><use href="#i-check-circle"/></svg>':'<svg class="ic ic-bad" aria-hidden="true"><use href="#i-x-circle"/></svg>'}</span>
      <span style="font-size:13px;${d.ok?'':'color:var(--danger);font-weight:600'}">${d.label}</span>
      ${!d.ok?'<span class="badge badge-red">Нарушение</span>':''}
    </div>
  `).join('');
}

function renderFingerprintWidget(caseId) {
  const fingers = [
    ['Правая рука','П1','П2','П3','П4','ПБ'],
    ['Левая рука', 'Л1','Л2','Л3','Л4','ЛБ'],
  ];
  const c = getCase(caseId);
  const fp = STATE.fingerprints[caseId] || {};
  const ig = getIG(c?.ig);
  
  let html = `<div class="bio-widget">
    <div class="bio-title"><svg class="ic" aria-hidden="true"><use href="#i-fingerprint"/></svg> АДИС «Папилон» — Дактилоскопическая карта</div>`;
  
  fingers.forEach(([hand, ...codes])=>{
    html += `<div class="text-xs font-bold text-muted mb-1">${hand}</div><div class="finger-grid mb-2">`;
    codes.forEach(code=>{
      const state = fp[code]||'empty';
      html += `<div class="finger-box">
        <div class="finger-img ${state==='good'?'scanned-good':state==='bad'?'scanned-bad':''}" onclick="scanFinger('${caseId}','${code}',this)">
          ${state==='empty'?'<svg class="ic ic-muted" aria-hidden="true"><use href="#i-fingerprint"/></svg>':state==='good'?(fpImg(ig,code)||'<svg class="ic" aria-hidden="true"><use href="#i-fingerprint"/></svg>'):'<svg class="ic" aria-hidden="true"><use href="#i-x-circle"/></svg>'}
        </div>
        <div class="quality-dot ${state==='good'?'good':state==='bad'?'bad':'empty'}"></div>
        <div class="finger-label">${code}</div>
      </div>`;
    });
    html += `</div>`;
  });
  
  const doneCount = Object.values(fp).filter(v=>v==='good').length;
  html += `
    <div class="flex items-center gap-2 mt-1">
      <div class="progress-bar" style="flex:1"><div class="progress-fill ${doneCount===10?'success':''}" style="width:${doneCount*10}%"></div></div>
      <span class="text-xs font-bold text-muted">${doneCount}/10</span>
    </div>
    <div class="text-xs text-muted mt-1">${fpDiag(ig)}</div>
    ${c?.fingerprintsDone ? '<div class="alert alert-success mt-1" style="font-size:12px"><svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg> Дактилокарта сформирована. № АДИС: ADIS-'+caseId+'-001</div>' : '<div class="alert alert-warning mt-1" style="font-size:12px">Нажмите на каждый палец для сканирования</div>'}
    <button class="btn btn-primary btn-sm w-full mt-2" onclick="scanAllFingers('${caseId}')"><svg class="ic" aria-hidden="true"><use href="#i-play"/></svg> Запустить полное сканирование</button>
  </div>`;
  return html;
}

function scanFinger(caseId, code, el) {
  if(!STATE.fingerprints[caseId]) STATE.fingerprints[caseId] = {};
  el.classList.add('scanning');
  setTimeout(()=>{
    el.classList.remove('scanning');
    const c = getCase(caseId);
    const ig = getIG(c?.ig);
    // Biometric trap
    if(ig?.trap === 'biometric_dup' && code === 'П1') {
      STATE.fingerprints[caseId][code] = 'bad';
      el.className = 'finger-img scanned-bad';
      el.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-x-circle"/></svg>';
      showCriticalAlert('biometric_dup', c);
    } else {
      STATE.fingerprints[caseId][code] = 'good';
      el.className = 'finger-img scanned-good';
      el.innerHTML = fpImg(ig,code) || '<svg class="ic" aria-hidden="true"><use href="#i-fingerprint"/></svg>';
    }
    const doneCount = Object.values(STATE.fingerprints[caseId]).filter(v=>v==='good').length;
    if(doneCount >= 10) {
      checkFingerprintsComplete(caseId);
    }
    // update progress
    const pw = document.querySelector('.progress-fill');
    if(pw) pw.style.width = doneCount*10+'%';
  }, 600);
}

function scanAllFingers(caseId) {
  const codes = ['П1','П2','П3','П4','ПБ','Л1','Л2','Л3','Л4','ЛБ'];
  const c = getCase(caseId);
  const ig = getIG(c?.ig);
  if(!STATE.fingerprints[caseId]) STATE.fingerprints[caseId] = {};
  
  codes.forEach((code,i)=>{
    setTimeout(()=>{
      if(ig?.trap === 'biometric_dup' && i === 0) {
        STATE.fingerprints[caseId][code] = 'bad';
        setTimeout(()=> showCriticalAlert('biometric_dup', c), 600);
      } else {
        STATE.fingerprints[caseId][code] = 'good';
      }
    }, i * 200);
  });
  
  setTimeout(()=>{
    checkFingerprintsComplete(caseId);
  }, codes.length * 200 + 500);
}

function checkFingerprintsComplete(caseId) {
  const c = getCase(caseId);
  if(!c) return;
  const fp = STATE.fingerprints[caseId] || {};
  const allGood = Object.values(fp).filter(v=>v==='good').length >= 10;
  if(allGood) {
    c.fingerprintsDone = true;
    addScore(10, 'Успешная дактилоскопическая регистрация', { category: 'BIOMETRICS', caseId });
    toast('Дактилокарта сформирована! Системный номер АДИС присвоен.', 'success');
    // re-render to show patent button
    setTimeout(()=> renderPatentCase(c), 300);
  }
}

function issuePatent(caseId) {
  const c = getCase(caseId);
  const ig = getIG(c?.ig);
  if(!c || !c.fingerprintsDone) { toast('Сначала выполните дактилоскопию!', 'danger'); return; }
  if(!c.checksDone) { toast('Сначала выполните проверки безопасности!', 'danger'); return; }
  
  // Check fake check trap
  const payments = generatePayments(ig, c);
  const hasFake = payments.some(p=>p.status==='fake');
  const hasLate = payments.some(p=>p.status==='late');
  const patentMeta = { category: 'DECISION', caseId, extra: { caseType: c.type, trapType: ig?.trap || null, hasFake, hasLate } };
  
  if(hasFake) {
    addScore(-50, 'Выдача патента при наличии неподтверждённого чека НДФЛ', patentMeta);
    toast('Критическая ошибка! Чек НДФЛ не подтверждён ФНС!', 'danger');
  } else if(hasLate) {
    addScore(-50, 'Выдача патента при просроченном платеже — патент автоматически аннулирован', patentMeta);
    toast('Патент аннулирован — просрочена оплата!', 'danger');
  } else {
    showPatentDocument(c, ig);
    addScore(30, 'Корректная выдача патента', patentMeta);
  }
}

function showPatentDocument(c, ig) {
  const today = new Date();
  const expDate = new Date(); expDate.setMonth(expDate.getMonth()+12);
  const qr = `QR:IG=${ig?.id};PAT=PAT-${c.id};DATE=${today.toISOString().split('T')[0]}`;
  
  document.getElementById('modal-dossier-title').innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-id-card"/></svg> Патент иностранного гражданина';
  document.getElementById('modal-dossier-body').innerHTML = `
    <div style="display:flex;gap:20px;flex-wrap:wrap">
      <div style="flex:1;min-width:280px">
        <div class="ticket">
          <div class="ticket-title">ПАТЕНТ НА РАБОТУ<br>МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ РФ</div>
          ФИО: ${ig?.name}<br>
          Дата рождения: ${ig?.dob}<br>
          Гражданство: ${ig?.nationality}<br>
          Паспорт: ${ig?.passport}<br>
          ИНН: ${ig?.inn}<br>
          ────────────────────────────<br>
          Серия/Номер: МВД ${c.id.replace('ДЕЛО-','')}<br>
          Дата выдачи: ${fmtDate(today)}<br>
          Действителен по: ${fmtDate(expDate)}<br>
          Субъект РФ: г. Москва<br>
          Вид деятельности: Физические лица<br>
          ────────────────────────────<br>
          СМЭВ ФНС: ✓ Подтверждено<br>
          АДИС-ПАПИЛОН: ✓ Зарегистрирован<br>
          ────────────────────────────<br>
          <small>Регистратор: Инспектор ОВМ</small>
        </div>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <div style="width:100px;height:100px;border:2px solid var(--border);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;word-break:break-all;padding:4px;font-family:var(--mono);color:var(--text3);margin:0 auto">${qr.split('').slice(0,80).join('')}...</div>
        <div style="font-size:11px;color:var(--text3);margin-top:6px">QR-код патента</div>
        <div style="margin-top:16px;font-size:28px"><svg class="ic" aria-hidden="true"><use href="#i-id-card"/></svg></div>
        <div class="badge badge-green mt-1">ВЫДАН</div>
      </div>
    </div>
    <div class="alert alert-success mt-2">Патент успешно выдан и зарегистрирован в ГИС ГМУ. Номер АДИС: ADIS-${c.id}-001</div>
  `;
  openModal('modal-dossier');
  c.status = 'approved';
  c.decision = 'approve';
}
