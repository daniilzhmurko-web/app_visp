;(function() {
/* ------ Stage 3 scope start ------ */
/* ================================================================
   ЭТАП 3 — КОД (namespace: s3_)
   ================================================================ */

/* ============================================================
   ДАННЫЕ
   ============================================================ */
const VTYPES=[
  {code:'12.9.2',name:'Превышение скорости на 20–40 км/ч',fine:500,speed:true,limit:60},
  {code:'12.9.3',name:'Превышение скорости на 40–60 км/ч',fine:1000,speed:true,limit:60},
  {code:'12.9.4',name:'Превышение скорости на 60–80 км/ч',fine:2000,speed:true,limit:60},
  {code:'12.9.5',name:'Превышение скорости более чем на 80 км/ч',fine:5000,speed:true,limit:60},
  {code:'12.12.1',name:'Проезд на запрещающий сигнал светофора',fine:1000,speed:false},
  {code:'12.16.1',name:'Нарушение требований дорожных знаков',fine:500,speed:false},
  {code:'12.17.2',name:'Движение по выделенной полосе для ОТ',fine:3000,speed:false},
  {code:'12.19.2',name:'Нарушение правил остановки и стоянки',fine:1500,speed:false},
  {code:'12.15.4',name:'Выезд на полосу встречного движения',fine:5000,speed:false},
  {code:'12.18',name:'Непредоставление преимущества пешеходу',fine:1500,speed:false}
];
const CAMERAS=['Тверская ул., 1','Ленинградский пр., 15','Рублёвское ш., 45','МКАД 22-й км','Садовое кольцо, 14','Варшавское ш., 32','Кутузовский пр., 7','ТТК Северный, 4'];
/* Госномера, владельцы и ТС — база ФИС ГИБДД-М (data/fis_gibdd_m.js). Элементы с одним индексом относятся к одному ТС. */
const FIS_POOL=CAFAP_DB.fis.violationPool(220,2);
const PLATES=FIS_POOL.map(r=>r.vehicle.plate);
const OWNERS=FIS_POOL.map(r=>({fam:r.owner.fam,im:r.owner.im,ot:r.owner.ot,born:r.owner.born,addr:r.owner.addr,zip:r.owner.zip}));
const VEHICLES=FIS_POOL.map(r=>`${r.vehicle.make} ${r.vehicle.model}, ${r.vehicle.color}`);
const APPEAL_BASES=['Транспортное средство находилось во владении другого лица','Ошибка идентификации государственного регистрационного знака','Нарушение не совершалось — ошибка технического средства','Транспортное средство было угнано','Нарушение ПДД в условиях крайней необходимости'];

// Генератор постановлений
function genDecisions(n){
  const now=new Date();
  const signStatuses=['pending','pending','pending','pending','signed','signed','signed','signed','signed'];
  return Array.from({length:n},(_,i)=>{
    const vt=VTYPES[Math.floor(Math.random()*VTYPES.length)];
    const k=Math.floor(Math.random()*FIS_POOL.length);
    const owner=OWNERS[k];
    const plate=PLATES[k];
    const cam=CAMERAS[Math.floor(Math.random()*CAMERAS.length)];
    const vehicle=VEHICLES[k];
    const mAgo=Math.floor(Math.random()*1440);
    const t=new Date(now-mAgo*60000);
    const status=signStatuses[Math.floor(Math.random()*signStatuses.length)];
    const speed=vt.speed?(vt.limit+Math.floor(Math.random()*80)):0;
    const payDl=new Date(t);payDl.setDate(payDl.getDate()+60);
    return{
      id:`ПОСТ-77-2026-${String(10000+i).padStart(5,'0')}`,
      caseId:`ДЕЛ-2026-${String(20000+i).padStart(5,'0')}`,
      date:t.toLocaleDateString('ru'),time:t.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}),
      cam,plate,vehicle,owner,vtype:vt,status,speed,
      payDeadline:payDl.toLocaleDateString('ru'),
      hash:genHash(),signDate:status==='signed'?new Date(t.getTime()+300000).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}):null,
      uin:genUIN(),ts:t
    };
  }).sort((a,b)=>{
    const order={pending:0,signed:1};return (order[a.status]||1)-(order[b.status]||1)||(b.ts-a.ts);
  });
}
function genHash(){return Array.from({length:64},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('');}
function genUIN(){return '18810'+(Array.from({length:15},()=>Math.floor(Math.random()*10)).join(''));}

const APPEALS_DATA=[
  {id:'АПЛ-77-2026-00041',decId:'ПОСТ-77-2026-10012',date:'24.05.2026',basis:0,status:'new',owner:OWNERS[0],plate:PLATES[0],vtype:VTYPES[0]},
  {id:'АПЛ-77-2026-00039',decId:'ПОСТ-77-2026-10008',date:'23.05.2026',basis:1,status:'review',owner:OWNERS[2],plate:PLATES[2],vtype:VTYPES[4]},
  {id:'АПЛ-77-2026-00035',decId:'ПОСТ-77-2026-09991',date:'21.05.2026',basis:2,status:'denied',owner:OWNERS[4],plate:PLATES[4],vtype:VTYPES[1]},
  {id:'АПЛ-77-2026-00031',decId:'ПОСТ-77-2026-09975',date:'18.05.2026',basis:4,status:'accepted',owner:OWNERS[6],plate:PLATES[6],vtype:VTYPES[5]},
];

const S3T={
  decisions:[],
  selectedDec:null,
  quest:{step:0,done:[],total:12},
  instTab:'mission',instCollapsed:false,
  session:{role:'inspector',login:'petrov_ins',startTime:new Date()}
};

/* ============================================================
   INIT
   ============================================================ */
/* S3: load handled by SPA */

function s3_setSection(sec,navEl){
  document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active'));
  if(navEl)navEl.classList.add('active');
  // Lazy-init decisions data
  if(!S3T.decisions.length && typeof genDecisions==='function'){
    S3T.decisions=genDecisions(187);
  }
  const mc=document.getElementById('mainContent3');
  const renders={sign:s3_renderSign,decisions:s3_renderDecisions,admin:s3_renderAdminPractice,appeals:s3_renderAppeals,archive:s3_renderArchive};
  (renders[sec]||s3_renderSign)(mc);
}
function closeModal(id){document.getElementById(id).style.display='none';}

/* ============================================================
   ПОДПИСАНИЕ ЭЦП (главный экран)
   ============================================================ */
function s3_renderSign(mc){
  const pending=S3T.decisions.filter(d=>d.status==='pending');
  const signed=S3T.decisions.filter(d=>d.status==='signed');
  mc.innerHTML=`
  <div style="display:flex;height:100%;overflow:hidden;">
    <!-- Очередь ЭЦП -->
    <div style="width:330px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;">
      <div style="padding:9px 12px;background:#FAFCFF;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:12.5px;font-weight:700;"><i class="fas fa-signature" style="color:var(--primary);"></i> Очередь ЭЦП <span class="live-ind" style="margin-left:4px;">LIVE</span></div>
        <div style="display:flex;gap:5px;">
          <span class="sbadge sb-err">${pending.length} ожидают</span>
          <button class="btn btn-g btn-sm" onclick="s3_signAll()"><i class="fas fa-check-double"></i> Все</button>
        </div>
      </div>
      <div style="flex:1;overflow-y:auto;" id="signQueue">
        ${pending.slice(0,20).map((d,i)=>`
        <div onclick="s3_selectDecision(${i})" id="sdq-${i}" style="padding:9px 12px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background .15s;" onmouseover="this.style.background='var(--primary-xs)'" onmouseout="if(!this.classList.contains('sel'))this.style.background='';">
          <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
            <span class="mono" style="font-size:10.5px;color:var(--primary);font-weight:700;">${d.id}</span>
            <span class="sbadge sb-wait" style="font-size:9px;"><i class="fas fa-clock" style="font-size:8px;"></i> Ожидает</span>
          </div>
          <div style="font-size:11px;"><span class="plate" style="font-size:10px;">${d.plate}</span> <span style="color:var(--text2);margin-left:4px;">${d.owner.fam} ${d.owner.im[0]}.${d.owner.ot[0]}.</span></div>
          <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:10px;color:var(--text3);">
            <span>ст.${d.vtype.code} · ${d.vtype.fine.toLocaleString('ru')} ₽</span>
            <span class="mono">${d.date}</span>
          </div>
        </div>`).join('')}
      </div>
      <!-- Уже подписано -->
      <div style="padding:9px 12px;background:#F8FAFF;border-top:1px solid var(--border2);">
        <div style="font-size:11px;font-weight:700;color:var(--success);margin-bottom:6px;"><i class="fas fa-check-double"></i> Подписано сегодня: ${signed.length}</div>
        <div class="prog-bar" style="height:6px;"><div class="prog-fill" style="width:${Math.round(signed.length/(signed.length+pending.length)*100)}%;background:var(--success);"></div></div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">${Math.round(signed.length/(signed.length+pending.length)*100)}% нормы дня</div>
      </div>
    </div>

    <!-- Рабочая область -->
    <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;" id="signCenter">
      <div style="text-align:center;padding:50px 20px;color:var(--text3);">
        <i class="fas fa-signature" style="font-size:52px;margin-bottom:14px;opacity:.25;"></i>
        <div style="font-size:14px;font-weight:600;">Выберите постановление из очереди для подписания</div>
        <div style="font-size:12px;margin-top:6px;">Или нажмите «Все» для массового подписания</div>
        <button class="btn btn-p" style="margin-top:16px;" onclick="s3_selectDecision(0)"><i class="fas fa-play"></i> Начать с первого</button>
      </div>
    </div>

    <!-- Сертификат -->
    <div style="width:240px;flex-shrink:0;border-left:1px solid var(--border);overflow-y:auto;padding:12px;">
      <div class="ecp-cert-card" style="margin-bottom:10px;">
        <div style="font-size:10px;opacity:.6;margin-bottom:6px;letter-spacing:.5px;">СЕРТИФИКАТ ЭЦП</div>
        <div style="font-size:13px;font-weight:800;margin-bottom:8px;">Петров И.С.</div>
        <div class="ecp-field"><span class="ecp-label">Серийный №</span><span class="ecp-val">77AF-2024-0831</span></div>
        <div class="ecp-field"><span class="ecp-label">Алгоритм</span><span class="ecp-val">ГОСТ Р 34.10</span></div>
        <div class="ecp-field"><span class="ecp-label">Издатель</span><span class="ecp-val">МВД России</span></div>
        <div class="ecp-field"><span class="ecp-label">Действует до</span><span class="ecp-val">31.08.2026</span></div>
        <div class="ecp-field"><span class="ecp-label">Статус</span><span style="font-weight:700;color:#A5D6A7;font-size:10.5px;">✓ АКТИВЕН</span></div>
      </div>
      <div style="font-size:10.5px;color:var(--text2);margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Последние подписания</div>
      ${signed.slice(0,6).map(d=>`
      <div style="padding:6px 0;border-bottom:1px solid var(--border2);font-size:10.5px;">
        <div class="mono" style="color:var(--primary);font-size:10px;">${d.id}</div>
        <div style="color:var(--text2);">${d.owner.fam} · ${d.vtype.fine.toLocaleString('ru')} ₽</div>
        <div style="color:var(--success);font-size:10px;"><i class="fas fa-check" style="font-size:9px;"></i> ${d.signDate||'—'}</div>
      </div>`).join('')}
    </div>
  </div>`;
  window._signList=pending;
}

function s3_selectDecision(idx){
  const d=window._signList?window._signList[idx]:null;
  if(!d)return;
  S3T.selectedDec=d;
  document.querySelectorAll('[id^="sdq-"]').forEach(el=>{el.classList.remove('sel');el.style.background='';});
  const qItem=document.getElementById(`sdq-${idx}`);
  if(qItem){qItem.classList.add('sel');qItem.style.background='var(--primary-lighter)';}
  s3_renderSignCenter(d);
  s3_markQuest(0);
}

function s3_renderSignCenter(d){
  const center=document.getElementById('signCenter');
  const isAlreadySigned=d.status==='signed';
  center.innerHTML=`
    <!-- Шаги -->
    <div style="display:flex;align-items:center;gap:0;margin-bottom:4px;">
      ${[{n:1,lbl:'Проверка дела',done:true},{n:2,lbl:'Просмотр постановления',done:true},{n:3,lbl:'Подписание ЭЦП',done:isAlreadySigned},{n:4,lbl:'Блокировка документа',done:isAlreadySigned},{n:5,lbl:'Отправка в печать',done:false}].map((s,i,arr)=>`
      <div style="text-align:center;">
        <div style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin:0 auto 2px;${s.done?'background:var(--success);color:#fff;':(i===2&&!isAlreadySigned?'background:var(--primary);color:#fff;animation:pulsB 1.5s infinite;':'background:var(--border2);color:var(--text3);')}">${s.done?'✓':s.n}</div>
        <div style="font-size:9px;color:var(--text2);width:60px;">${s.lbl}</div>
      </div>${i<arr.length-1?`<div style="flex:1;height:2px;background:${s.done?'var(--success)':'var(--border)'};margin:0 3px;margin-bottom:14px;"></div>`:''}`).join('')}
    </div>

    <!-- Постановление -->
    <div class="card" style="position:relative;">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-file-contract"></i>Постановление ${d.id}</div>
        <div style="display:flex;gap:5px;">
          ${isAlreadySigned?`<span class="sbadge sb-signed"><i class="fas fa-signature" style="font-size:9px;"></i> ЭЦП подписано</span>`:`<span class="sbadge sb-wait"><i class="fas fa-clock" style="font-size:9px;"></i> Ожидает подписи</span>`}
          <button class="btn btn-s btn-sm" onclick="s3_showDecModal(S3T.selectedDec)"><i class="fas fa-expand"></i> Полный просмотр</button>
        </div>
      </div>
      <div style="position:relative;">
        ${s3_renderPostanovlenie(d, isAlreadySigned)}
        ${isAlreadySigned?'<div class="locked-overlay"></div>':''}
      </div>
    </div>

    <!-- БЛОК ПОДПИСАНИЯ -->
    ${isAlreadySigned ? s3_renderSignedBlock(d) : s3_renderSignBlock(d)}`;
}

function s3_renderPostanovlenie(d, signed){
  return`<div class="postanovlenie" style="max-height:280px;overflow-y:auto;position:relative;">
    ${signed?`<div class="post-signed-stamp stamp-anim">ЭЦП ПОДПИСАНО</div>`:''}
    <div class="post-header">
      <div style="font-size:11px;color:var(--text2);margin-bottom:4px;">ЦАФАП ОДД ГИБДД ГУ МВД России по г. Москве</div>
      <div class="post-title">ПОСТАНОВЛЕНИЕ</div>
      <div class="post-subtitle">по делу об административном правонарушении</div>
      <div class="post-num">${d.id} · Дело: ${d.caseId}</div>
    </div>
    <div style="font-size:10px;margin-bottom:10px;font-family:'Segoe UI',sans-serif;color:var(--text2);">${d.date} г. Москва</div>
    <div class="post-body" style="font-size:10.5px;">
      <p>Инспектор ЦАФАП ОДД ГИБДД ГУ МВД России по г. Москве, рассмотрев материалы дела об административном правонарушении, зафиксированном в автоматическом режиме специальным техническим средством по адресу: <strong>${d.cam}</strong>,</p>
      <div class="post-highlight">${d.date} в ${d.time} транспортное средство <strong>${d.vehicle}</strong>, государственный регистрационный знак <strong>${d.plate}</strong>${d.vtype.speed?`, двигалось со скоростью <strong>${d.speed} км/ч</strong> при установленном ограничении <strong>${d.vtype.limit} км/ч</strong>, превышение составило <strong>${d.speed-d.vtype.limit} км/ч</strong>`:''}, чем допустило нарушение Правил дорожного движения.</div>
      <p>Данное деяние содержит признаки административного правонарушения, предусмотренного <strong>ч. 1 ст. ${d.vtype.code} Кодекса Российской Федерации об административных правонарушениях</strong>.</p>
      <p>Лицо, в отношении которого вынесено настоящее постановление: <strong>${d.owner.fam} ${d.owner.im} ${d.owner.ot}</strong>, дата рождения ${d.owner.born}.</p>
      <p>Адрес для направления постановления: ${d.owner.addr}.</p>
    </div>
    <div class="post-fine-box">
      <div style="font-size:11px;color:var(--text2);margin-bottom:3px;">НАЗНАЧИТЬ административный штраф в размере</div>
      <div class="post-fine-amount">${d.vtype.fine.toLocaleString('ru')} рублей</div>
      <div style="font-size:10px;color:var(--text3);margin-top:3px;">УИН: <span class="mono">${d.uin}</span></div>
    </div>
    <div style="font-size:10px;color:var(--text2);">Срок уплаты штрафа: <strong>${d.payDeadline}</strong> (60 суток). Штраф может быть уплачен со скидкой ${CAFAP_DISCOUNT.pct}% в течение первых ${CAFAP_DISCOUNT.days} суток со дня вынесения постановления.</div>
    <div class="post-footer" style="font-size:10px;">
      <div><div style="font-weight:700;">Инспектор ЦАФАП:</div><div style="color:var(--text2);">Петров И.С.</div>${signed?`<div style="color:var(--success);font-weight:700;">ЭЦП: ${d.hash.substring(0,16)}...</div>`:''}</div>
      <div style="text-align:right;"><div style="font-weight:700;">Дата подписания:</div><div class="mono">${signed?d.date+' '+d.signDate:'—'}</div></div>
    </div>
    <div style="position:absolute;bottom:10px;right:10px;opacity:.08;font-size:55px;color:var(--primary);">⚖</div>
  </div>`;
}

function s3_renderSignBlock(d){
  return`<div class="card">
    <div class="card-hdr"><div class="card-title"><i class="fas fa-key"></i>Подписание электронной цифровой подписью</div></div>
    <div class="card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start;">
        <div>
          <div style="font-size:11.5px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Сертификат для подписания:</div>
          <div class="ecp-cert-card" style="margin-bottom:10px;">
            <div style="font-size:10px;opacity:.6;margin-bottom:4px;">Выбранный сертификат</div>
            <div style="font-size:12px;font-weight:700;margin-bottom:6px;">Петров И.С. — Инспектор ЦАФАП</div>
            <div class="ecp-field"><span class="ecp-label">Серийный №</span><span class="ecp-val">77AF-2024-0831</span></div>
            <div class="ecp-field"><span class="ecp-label">Алгоритм</span><span class="ecp-val">ГОСТ Р 34.10-2012</span></div>
            <div class="ecp-field"><span class="ecp-label">Действует до</span><span class="ecp-val">31.08.2026</span></div>
          </div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:6px;">Хеш-сумма документа (SHA-256):</div>
          <div class="mono" style="font-size:9.5px;background:#F8FAFF;border:1px solid var(--border2);border-radius:6px;padding:6px 8px;word-break:break-all;color:var(--text2);">${d.hash}</div>
        </div>
        <div>
          <div style="font-size:11.5px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Контрольная проверка перед подписанием:</div>
          ${['Данные нарушителя проверены','Государственный номер верифицирован','Статья КоАП определена корректно','Сумма штрафа рассчитана верно','Адрес доставки актуален','Хеш-сумма документа совпадает'].map((item,i)=>`
          <div style="display:flex;align-items:center;gap:7px;padding:4px 0;font-size:11.5px;">
            <i class="fas fa-check-circle" style="color:var(--success);font-size:13px;flex-shrink:0;"></i>
            <span>${item}</span>
          </div>`).join('')}
          <div style="margin-top:12px;display:flex;gap:8px;">
            <button class="btn btn-g btn-lg signing-glow" onclick="s3_doSign()" id="signBtn"><i class="fas fa-signature"></i> Подписать ЭЦП</button>
            <button class="btn btn-d btn-sm" onclick="s3_rejectDecision()"><i class="fas fa-times"></i> Отклонить</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function s3_renderSignedBlock(d){
  return`<div class="card">
    <div class="card-hdr"><div class="card-title"><i class="fas fa-check-circle"></i>Документ подписан ЭЦП</div><span class="sbadge sb-signed">✓ Подписано</span></div>
    <div class="card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div>
          <div style="font-size:11px;color:var(--text2);margin-bottom:5px;">Электронная подпись документа:</div>
          <div class="mono" style="font-size:9.5px;background:#E8F5E9;border:1px solid #C8E6C9;border-radius:6px;padding:6px 8px;word-break:break-all;color:var(--success);">${d.hash}</div>
          <div style="margin-top:8px;font-size:11px;"><i class="fas fa-lock" style="color:var(--success);"></i> <strong>Документ заблокирован</strong> — изменения невозможны</div>
        </div>
        <div>
          <div style="font-size:11.5px;font-weight:700;color:var(--success);margin-bottom:8px;"><i class="fas fa-check-double"></i> Подписание завершено</div>
          <div style="font-size:11px;margin-bottom:5px;">Дата и время: <strong class="mono">${d.date} ${d.signDate}</strong></div>
          <div style="font-size:11px;margin-bottom:10px;">Подписал: <strong>Петров Игорь Сергеевич</strong></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn btn-p btn-sm" onclick="switchStage(4)"><i class="fas fa-envelope"></i> Отправить в Почту</button>
            <button class="btn btn-s btn-sm" onclick="s3_printDecision()"><i class="fas fa-print"></i> Печать</button>
            <button class="btn btn-s btn-sm" onclick="s3_showDecModal(S3T.selectedDec)"><i class="fas fa-eye"></i> Просмотр</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

/* ACTIONS */
function s3_doSign(){
  if(!S3T.selectedDec)return;
  const btn=document.getElementById('signBtn');
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Подписание...';}
  // Показываем модалку с анимацией
  s3_showSignModal(S3T.selectedDec);
}

function s3_showSignModal(d){
  document.getElementById('signModalContent').innerHTML=`
    <div style="text-align:center;">
      <div style="font-size:13px;font-weight:600;margin-bottom:14px;">Применение электронной цифровой подписи</div>
      <div style="background:#1A237E;border-radius:10px;padding:20px;color:#fff;position:relative;overflow:hidden;margin-bottom:14px;">
        <div class="sign-scan-line"></div>
        <div style="font-size:11px;opacity:.6;margin-bottom:4px;">ЦАФАП ОДД ГИБДД ГУ МВД России</div>
        <div style="font-size:15px;font-weight:700;margin-bottom:10px;">Постановление ${d.id}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;text-align:left;font-size:10.5px;">
          <div><span style="opacity:.6;">Нарушитель:</span><div style="font-weight:700;">${d.owner.fam} ${d.owner.im[0]}.${d.owner.ot[0]}.</div></div>
          <div><span style="opacity:.6;">Г/Н ТС:</span><div style="font-weight:700;font-family:monospace;">${d.plate}</div></div>
          <div><span style="opacity:.6;">Штраф:</span><div style="font-weight:700;color:#A5D6A7;">${d.vtype.fine.toLocaleString('ru')} ₽</div></div>
          <div><span style="opacity:.6;">Статья КоАП:</span><div style="font-weight:700;">${d.vtype.code}</div></div>
        </div>
      </div>
      <div id="signProgress">
        <div class="prog-bar" style="height:10px;margin-bottom:10px;"><div class="prog-fill" id="signBar" style="width:0%;background:var(--success);transition:width .5s;"></div></div>
        <div id="signLog" class="mono" style="font-size:11px;color:var(--text2);">Инициализация криптопровайдера КриптоПро...</div>
      </div>
      <div id="signResult"></div>
    </div>`;
  document.getElementById('signModal').style.display='flex';
  s3_runSignSequence(d);
}

function s3_runSignSequence(d){
  const logs=[
    {pct:20,msg:'Загрузка сертификата 77AF-2024-0831...'},
    {pct:40,msg:'Вычисление хеш-суммы документа (ГОСТ Р 34.11-2012)...'},
    {pct:60,msg:'Формирование цифровой подписи (ГОСТ Р 34.10-2012)...'},
    {pct:80,msg:'Встраивание подписи в документ...'},
    {pct:95,msg:'Блокировка документа от изменений...'},
    {pct:100,msg:'Запись в реестр подписанных документов...'}
  ];
  let i=0;
  function next(){
    if(i>=logs.length){
      // Подписание завершено
      d.status='signed';d.signDate=new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
      document.getElementById('signBar').style.width='100%';
      document.getElementById('signLog').textContent='✓ Подписание завершено успешно';
      document.getElementById('signResult').innerHTML=`
        <div style="margin-top:14px;background:#E8F5E9;border:1px solid #C8E6C9;border-radius:8px;padding:14px;text-align:left;">
          <div style="font-size:13px;font-weight:700;color:var(--success);margin-bottom:8px;"><i class="fas fa-check-circle"></i> ЭЦП применена успешно</div>
          <div style="font-size:10.5px;margin-bottom:4px;">Хеш подписи: <span class="mono hash-reveal" style="font-size:9.5px;color:var(--text2);">${d.hash.substring(0,32)}...</span></div>
          <div style="font-size:10.5px;margin-bottom:4px;">Метка времени: <span class="mono">${new Date().toLocaleString('ru')}</span></div>
          <div style="font-size:10.5px;">Сертификат: <span class="mono">77AF-2024-0831</span> (Петров И.С.)</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
          <button class="btn btn-s" onclick="closeModal('signModal');s3_renderSign(document.getElementById('mainContent3'))">Закрыть</button>
          <button class="btn btn-p" onclick="closeModal('signModal');switchStage(4)"><i class="fas fa-envelope"></i> Перейти к отправке</button>
        </div>`;
      // Обновляем счётчики
      const sq=document.getElementById('signedToday');if(sq)sq.textContent=parseInt(sq.textContent)+1;
      const sc=document.getElementById('signQueue');if(sc)sc.textContent=Math.max(parseInt(sc.textContent)-1,0);
      const nb=document.getElementById('nbSign');if(nb)nb.textContent=Math.max(parseInt(nb.textContent)-1,0);
      s3_markQuest(2);
      toast(`Постановление ${d.id} подписано ЭЦП!`,'success');
      return;
    }
    const step=logs[i];
    document.getElementById('signBar').style.width=step.pct+'%';
    document.getElementById('signLog').textContent=step.msg;
    i++;setTimeout(next,500+Math.random()*300);
  }
  setTimeout(next,300);
}

function s3_signAll(){
  const pending=S3T.decisions.filter(d=>d.status==='pending').length;
  if(!confirm(`Массовое подписание: ${pending} постановлений. Применить ЭЦП ко всем?`))return;
  let signed=0;
  S3T.decisions.forEach(d=>{if(d.status==='pending'){d.status='signed';d.signDate=new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});signed++;}});
  s3_markQuest(3);
  toast(`Массовое подписание: ${signed} постановлений подписаны ЭЦП`,'success');
  s3_renderSign(document.getElementById('mainContent3'));
}

function s3_rejectDecision(){
  if(!S3T.selectedDec)return;
  if(confirm('Отклонить постановление? Дело будет возвращено оператору для проверки.')){
    S3T.selectedDec.status='rejected';
    s3_markQuest(1);
    toast(`Постановление ${S3T.selectedDec.id} отклонено, возвращено оператору`,'warning');
    s3_renderSign(document.getElementById('mainContent3'));
  }
}

function s3_printDecision(){
  s3_markQuest(4);
  toast('Документ отправлен на принтер. Формирование PDF-версии...','info');
  setTimeout(()=>toast('PDF сформирован и отправлен на печать','success'),1500);
}

/* ============================================================
   СПИСОК ПОСТАНОВЛЕНИЙ
   ============================================================ */
function s3_renderDecisions(mc){
  const rows=S3T.decisions.slice(0,25);
  mc.innerHTML=`
  <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:14px;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-file-alt" style="color:var(--primary);"></i>Реестр постановлений <span class="live-ind" style="margin-left:4px;">LIVE</span></h2>
      <div style="display:flex;gap:6px;">
        <input type="text" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:11.5px;width:180px;" placeholder="🔍 Поиск...">
        <select style="padding:5px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;">
          <option>Все статусы</option><option>Ожидает ЭЦП</option><option>Подписано</option><option>Отправлено</option><option>Оплачено</option>
        </select>
        <button class="btn btn-s btn-sm" onclick="toast('Экспорт реестра...','info')"><i class="fas fa-download"></i> Экспорт</button>
      </div>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
      <div style="overflow-y:auto;flex:1;">
        <table class="data-table">
          <thead><tr><th>№ Постановления</th><th>Дата</th><th>Нарушитель</th><th>Г/Н ТС</th><th>Статья КоАП</th><th>Штраф</th><th>УИН</th><th>Срок оплаты</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            ${rows.map(d=>{
              const sbMap={pending:'sb-wait',signed:'sb-signed',rejected:'sb-err',paid:'sb-done',sent:'sb-proc'};
              const lblMap={pending:'Ожидает ЭЦП',signed:'Подписано',rejected:'Отклонено',paid:'Оплачено',sent:'Отправлено'};
              const sb=sbMap[d.status]||'sb-wait';const lbl=lblMap[d.status]||d.status;
              return`<tr>
                <td class="mono" style="font-size:10.5px;color:var(--primary);">${d.id}</td>
                <td class="mono" style="font-size:10.5px;">${d.date}<br><span style="color:var(--text3);">${d.time}</span></td>
                <td style="font-size:11.5px;"><div style="font-weight:600;">${d.owner.fam} ${d.owner.im[0]}.${d.owner.ot[0]}.</div><div style="font-size:10px;color:var(--text3);">${d.owner.born}</div></td>
                <td><span class="plate" style="font-size:10px;">${d.plate}</span></td>
                <td style="font-size:10.5px;"><div class="mono" style="color:var(--primary);font-weight:700;">${d.vtype.code}</div><div style="color:var(--text3);font-size:9.5px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${d.vtype.name}">${d.vtype.name}</div></td>
                <td class="mono" style="font-size:11.5px;font-weight:700;color:var(--success);">${d.vtype.fine.toLocaleString('ru')} ₽</td>
                <td class="mono" style="font-size:9.5px;color:var(--text3);">${d.uin.substring(0,12)}...</td>
                <td class="mono" style="font-size:10.5px;">${d.payDeadline}</td>
                <td><span class="sbadge ${sb}" style="font-size:9px;">${lbl}</span></td>
                <td><div style="display:flex;gap:3px;">
                  <button class="btn btn-p btn-sm" onclick="s3_showDecModal(S3T.decisions[${S3T.decisions.indexOf(d)}])" title="Просмотр"><i class="fas fa-eye"></i></button>
                  ${d.status==='pending'?`<button class="btn btn-g btn-sm" onclick="s3_showSignModal(S3T.decisions[${S3T.decisions.indexOf(d)}])" title="Подписать"><i class="fas fa-signature"></i></button>`:''}
                  <button class="btn btn-s btn-sm" onclick="toast('Печать постановления...','info')" title="Печать"><i class="fas fa-print"></i></button>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 9px;background:#FAFCFF;border-top:1px solid var(--border2);font-size:11px;color:var(--text2);">
        <div>Всего: <strong>${S3T.decisions.length}</strong> · Ожидают ЭЦП: <strong style="color:var(--accent-red);">${S3T.decisions.filter(d=>d.status==='pending').length}</strong> · Подписано: <strong style="color:var(--success);">${S3T.decisions.filter(d=>d.status==='signed').length}</strong></div>
        <div style="display:flex;gap:3px;">${[1,2,3,'...',9].map((p,i)=>`<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;${i===0?'background:var(--primary);color:#fff;':'background:#fff;border:1px solid var(--border);cursor:pointer;'}font-size:11px;">${p}</div>`).join('')}</div>
      </div>
    </div>
  </div>`;
  s3_markQuest(5);
}

/* ============================================================
   АДМИНИСТРАТИВНАЯ ПРАКТИКА
   ============================================================ */
function s3_renderAdminPractice(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-gavel" style="color:var(--primary);"></i>Административная практика</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:11px;">
      ${[
        {lbl:'Всего дел',val:S3T.decisions.length,sub:'за сегодня',color:'blue',ico:'fa-folder'},
        {lbl:'Вынесено постановлений',val:S3T.decisions.filter(d=>d.status==='signed').length,sub:'подписаны ЭЦП',color:'green',ico:'fa-file-contract'},
        {lbl:'В производстве',val:S3T.decisions.filter(d=>d.status==='pending').length,sub:'ожидают подписи',color:'orange',ico:'fa-hourglass-half'},
        {lbl:'Апелляций',val:APPEALS_DATA.length,sub:'на рассмотрении',color:'purple',ico:'fa-balance-scale'}
      ].map(s=>`<div style="background:#fff;border:1px solid var(--border);border-radius:10px;padding:13px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--${s.color==='blue'?'primary':s.color==='green'?'success':s.color==='orange'?'accent':'purple'});"></div>
        <div style="font-size:24px;font-weight:800;font-family:'Courier New',monospace;">${s.val}</div>
        <div style="font-size:11.5px;color:var(--text2);font-weight:600;">${s.lbl}</div>
        <div style="font-size:10px;color:var(--text3);margin-top:2px;">${s.sub}</div>
        <div style="position:absolute;top:10px;right:10px;font-size:22px;opacity:.08;"><i class="fas ${s.ico}"></i></div>
      </div>`).join('')}
    </div>

    <!-- Статистика по статьям -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-chart-pie"></i>Распределение по статьям КоАП</div></div>
        <div class="card-body" style="padding:8px;height:180px;position:relative;"><canvas id="vtypeChart" style="width:100%;height:180px;"></canvas></div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-clock"></i>Хронология обработки (сегодня)</div></div>
        <div class="card-body" style="padding:8px;height:180px;position:relative;"><canvas id="timelineChart" style="width:100%;height:180px;"></canvas></div>
      </div>
    </div>

    <!-- Таймлайн дела -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-history"></i>Хронология типового дела</div>
        <span class="sbadge sb-done">Полный цикл: 4 часа 23 мин.</span>
      </div>
      <div class="card-body">
        <div class="timeline">
          ${[
            {dot:'done',title:'Фиксация нарушения',sub:'Камера CAM-077-001 · ст.12.9.3 · скорость 97 км/ч',time:'08:14:22'},
            {dot:'done',title:'OCR-распознавание',sub:'Г/Н А177МС77 · уверенность 94% · авторасп.',time:'08:14:23'},
            {dot:'done',title:'Верификация оператором',sub:'Оператор: ivanov_op · номер подтверждён · 18 сек.',time:'08:26:11'},
            {dot:'done',title:'Запрос в РЭО ГИБДД',sub:'Найден владелец: Иванов И.В. · АИПС «Автомобиль»',time:'08:26:13'},
            {dot:'done',title:'Формирование дела',sub:'ДЕЛ-2026-10247 · Оператор: ivanov_op',time:'08:27:05'},
            {dot:'done',title:'Передача инспектору',sub:'Инспектор: petrov_ins · получено в очередь ЭЦП',time:'08:27:06'},
            {dot:'active',title:'Подписание ЭЦП',sub:'ПОСТ-77-2026-10247 · Инспектор: Петров И.С.',time:'08:31:44'},
            {dot:'pend',title:'Печать и отправка Почтой России',sub:'Заказное письмо · уведомление о вручении',time:'—'},
            {dot:'pend',title:'Доставка нарушителю',sub:'Ожидание вручения · трек-номер',time:'—'},
            {dot:'pend',title:'Контроль оплаты',sub:'Срок: 60 суток · ГИС ГМП мониторинг',time:'—'}
          ].map(item=>`<div class="tl-item">
            <div class="tl-dot ${item.dot}"></div>
            <div class="tl-content">
              <div class="tl-title">${item.title}</div>
              <div class="tl-sub">${item.sub}</div>
              <div class="tl-time">${item.time}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
  s3_markQuest(6);
  setTimeout(()=>{
    // Диаграмма по статьям
    const vtCtx=document.getElementById('vtypeChart');
    if(vtCtx){
      const counts=VTYPES.slice(0,6).map(vt=>S3T.decisions.filter(d=>d.vtype.code===vt.code).length);
      if(window._vtypeChart){try{window._vtypeChart.destroy();}catch(e){}}
      const vtWrap=vtCtx.parentElement;if(vtWrap){vtWrap.style.height='180px';vtCtx.style.height='180px';}
      window._vtypeChart=safeChart(vtCtx,{type:'doughnut',data:{
        labels:VTYPES.slice(0,6).map(v=>'ст.'+v.code),
        datasets:[{data:counts,backgroundColor:['#1565C0','#2E7D32','#F57C00','#C62828','#6A1B9A','#00695C'],borderWidth:2}]
      },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:10}}}}}});
    }
    // Таймлайн
    const tlCtx=document.getElementById('timelineChart');
    if(tlCtx){
      const hours=Array.from({length:12},(_,i)=>i+8);
      if(window._tlChart){try{window._tlChart.destroy();}catch(e){}}
      const tlWrap=tlCtx.parentElement;if(tlWrap){tlWrap.style.height='180px';tlCtx.style.height='180px';}
      window._tlChart=safeChart(tlCtx,{type:'bar',data:{
        labels:hours.map(h=>h+':00'),
        datasets:[{label:'Подписано',data:hours.map(()=>Math.floor(Math.random()*25)+5),backgroundColor:'rgba(21,101,192,.2)',borderColor:'#1565C0',borderWidth:1.5}]
      },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}});
    }
  },100);
}

/* ============================================================
   АПЕЛЛЯЦИИ
   ============================================================ */
function s3_renderAppeals(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-balance-scale" style="color:var(--primary);"></i>Обработка апелляций и жалоб</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-s btn-sm" onclick="toast('Новая апелляция: форма приёма открыта','info')"><i class="fas fa-plus"></i> Принять жалобу</button>
        <button class="btn btn-s btn-sm" onclick="toast('Реестр апелляций экспортирован','info')"><i class="fas fa-download"></i> Экспорт</button>
      </div>
    </div>

    <!-- Статусы апелляций -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      ${[
        {lbl:'Новые жалобы',val:1,color:'accent-red',ico:'fa-envelope-open'},
        {lbl:'На рассмотрении',val:1,color:'accent',ico:'fa-search'},
        {lbl:'Отклонено',val:1,color:'text3',ico:'fa-times-circle'},
        {lbl:'Удовлетворено',val:1,color:'success',ico:'fa-check-circle'}
      ].map(s=>`<div style="background:#fff;border:1px solid var(--border);border-radius:8px;padding:11px;text-align:center;">
        <div style="font-size:24px;font-weight:800;color:var(--${s.color});font-family:'Courier New',monospace;">${s.val}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:3px;">${s.lbl}</div>
        <i class="fas ${s.ico}" style="font-size:20px;color:var(--${s.color});opacity:.3;margin-top:5px;"></i>
      </div>`).join('')}
    </div>

    <!-- Список апелляций -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-list"></i>Реестр апелляций</div></div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>№ Апелляции</th><th>№ Постановления</th><th>Дата подачи</th><th>Нарушитель</th><th>Г/Н ТС</th><th>Основание</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            ${APPEALS_DATA.map(a=>{
              const sbMap={new:'sb-new',review:'sb-proc',denied:'sb-err',accepted:'sb-done'};
              const lblMap={new:'Новая',review:'Рассматривается',denied:'Отклонена',accepted:'Удовлетворена'};
              return`<tr>
                <td class="mono" style="font-size:10.5px;color:var(--primary);">${a.id}</td>
                <td class="mono" style="font-size:10px;color:var(--text2);">${a.decId}</td>
                <td class="mono" style="font-size:10.5px;">${a.date}</td>
                <td style="font-size:11.5px;font-weight:600;">${a.owner.fam} ${a.owner.im[0]}.${a.owner.ot[0]}.</td>
                <td><span class="plate" style="font-size:10px;">${a.plate}</span></td>
                <td style="font-size:10.5px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${APPEAL_BASES[a.basis]}">${APPEAL_BASES[a.basis]}</td>
                <td><span class="sbadge ${sbMap[a.status]}" style="font-size:9px;">${lblMap[a.status]}</span></td>
                <td><div style="display:flex;gap:3px;">
                  <button class="btn btn-p btn-sm" onclick="s3_showAppealModal(${APPEALS_DATA.indexOf(a)})"><i class="fas fa-gavel"></i> Рассмотреть</button>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Процедура рассмотрения -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-info-circle"></i>Порядок рассмотрения апелляций</div></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;text-align:center;">
          ${['Получение жалобы','Проверка сроков (10 суток)','Изучение материалов дела','Вынесение решения','Уведомление заявителя'].map((s,i)=>`
          <div style="padding:10px 6px;background:var(--primary-xs);border-radius:7px;border:1px solid var(--primary-lighter);">
            <div style="width:26px;height:26px;border-radius:50%;background:var(--primary);color:#fff;font-size:12px;font-weight:700;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;">${i+1}</div>
            <div style="font-size:11px;color:var(--text2);">${s}</div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
  s3_markQuest(7);
}

function s3_showAppealModal(idx){
  const a=APPEALS_DATA[idx];if(!a)return;
  document.getElementById('appealModalContent').innerHTML=`
    <div class="appeal-status-bar" style="margin-bottom:16px;">
      ${['Принята','Проверка','Рассмотрение','Решение','Уведомление'].map((s,i)=>`<div class="asb-item ${i===1?'active':i===0?'done':'pend'}">${s}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Апелляция</div>
        <div style="font-size:11.5px;margin-bottom:4px;"><span style="color:var(--text2);">Номер:</span> <strong class="mono">${a.id}</strong></div>
        <div style="font-size:11.5px;margin-bottom:4px;"><span style="color:var(--text2);">Постановление:</span> <strong class="mono">${a.decId}</strong></div>
        <div style="font-size:11.5px;margin-bottom:4px;"><span style="color:var(--text2);">Дата подачи:</span> <strong>${a.date}</strong></div>
        <div style="font-size:11.5px;margin-bottom:4px;"><span style="color:var(--text2);">Нарушитель:</span> <strong>${a.owner.fam} ${a.owner.im} ${a.owner.ot}</strong></div>
        <div style="font-size:11.5px;margin-bottom:4px;"><span style="color:var(--text2);">Г/Н ТС:</span> <span class="plate" style="font-size:10px;">${a.plate}</span></div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Основание жалобы</div>
        <div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:7px;padding:10px;font-size:11.5px;color:var(--text);">${APPEAL_BASES[a.basis]}</div>
        <div style="margin-top:8px;font-size:11px;color:var(--text2);">Нарушение: ст.${a.vtype.code} КоАП РФ · <strong style="color:var(--success);">${a.vtype.fine.toLocaleString('ru')} ₽</strong></div>
        <div style="font-size:11px;color:var(--text2);margin-top:4px;">Срок рассмотрения: <strong>10 суток</strong> с даты подачи</div>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Решение по апелляции</label>
      <select class="form-select" id="appealDecision">
        <option value="">— Выберите решение —</option>
        <option value="deny">Отклонить жалобу — постановление оставить в силе</option>
        <option value="accept">Удовлетворить жалобу — прекратить производство</option>
        <option value="reassign">Передать ответственность другому лицу</option>
        <option value="reduce">Снизить размер штрафа (при наличии оснований)</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">Обоснование решения</label>
      <textarea class="form-control" rows="3" placeholder="Укажите обоснование принятого решения..."></textarea>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
      <button class="btn btn-s" onclick="closeModal('appealModal')">Отмена</button>
      <button class="btn btn-w" onclick="closeModal('appealModal');toast('Апелляция перенаправлена руководителю для решения','warning')"><i class="fas fa-forward"></i> Эскалация</button>
      <button class="btn btn-p" onclick="s3_submitAppealDecision()"><i class="fas fa-gavel"></i> Вынести решение</button>
    </div>`;
  document.getElementById('appealModal').style.display='flex';
}

function s3_submitAppealDecision(){
  const dec=document.getElementById('appealDecision')?.value;
  if(!dec){toast('Выберите решение по апелляции','error');return;}
  closeModal('appealModal');
  s3_markQuest(8);
  if(dec==='accept') toast('Апелляция удовлетворена. Постановление отменено. Уведомление отправлено заявителю.','success');
  else if(dec==='deny') toast('Апелляция отклонена. Постановление оставлено в силе. Уведомление отправлено.','info');
  else toast('Решение по апелляции вынесено. Документы сформированы.','success');
}

/* ============================================================
   АРХИВ
   ============================================================ */
function s3_renderArchive(mc){
  const archived=S3T.decisions.filter(d=>d.status==='signed').slice(0,15);
  mc.innerHTML=`
  <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:14px;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-archive" style="color:var(--primary);"></i>Архив подписанных постановлений</h2>
      <div style="display:flex;gap:6px;">
        <input type="text" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:11.5px;width:200px;" placeholder="🔍 Поиск по архиву...">
        <input type="date" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;" value="2026-05-27">
        <button class="btn btn-s btn-sm" onclick="toast('Экспорт архива за период...','info')"><i class="fas fa-download"></i> Экспорт</button>
      </div>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
      <div style="overflow-y:auto;flex:1;">
        <table class="data-table">
          <thead><tr><th>№ Постановления</th><th>Дата подписания</th><th>Нарушитель</th><th>Г/Н</th><th>Статья</th><th>Штраф</th><th>Хеш ЭЦП</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            ${archived.map(d=>`<tr>
              <td class="mono" style="font-size:10.5px;color:var(--primary);">${d.id}</td>
              <td class="mono" style="font-size:10.5px;">${d.date} ${d.signDate||'—'}</td>
              <td style="font-size:11.5px;font-weight:600;">${d.owner.fam} ${d.owner.im[0]}.${d.owner.ot[0]}.</td>
              <td><span class="plate" style="font-size:10px;">${d.plate}</span></td>
              <td class="mono" style="font-size:10.5px;color:var(--primary);font-weight:700;">ст.${d.vtype.code}</td>
              <td class="mono" style="font-size:11px;font-weight:700;color:var(--success);">${d.vtype.fine.toLocaleString('ru')} ₽</td>
              <td class="mono" style="font-size:9px;color:var(--text3);max-width:100px;overflow:hidden;text-overflow:ellipsis;" title="${d.hash}">${d.hash.substring(0,12)}...</td>
              <td><span class="sbadge sb-signed" style="font-size:9px;"><i class="fas fa-lock" style="font-size:8px;"></i> Подписано</span></td>
              <td><div style="display:flex;gap:3px;">
                <button class="btn btn-p btn-sm" onclick="s3_showDecModal(S3T.decisions[${S3T.decisions.indexOf(d)}])"><i class="fas fa-eye"></i></button>
                <button class="btn btn-s btn-sm" onclick="toast('Верификация подписи: OK ✓','success')"><i class="fas fa-shield-alt"></i></button>
              </div></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  s3_markQuest(9);
}

/* ============================================================
   ПОЛНЫЙ ПРОСМОТР ПОСТАНОВЛЕНИЯ
   ============================================================ */
function s3_showDecModal(d){
  if(!d)return;
  document.getElementById('decModalContent').innerHTML=`
    <div style="position:relative;">
      ${s3_renderPostanovlenie(d, d.status==='signed')}
    </div>
    <div style="margin-top:12px;background:var(--primary-xs);border-radius:8px;padding:12px;font-size:11.5px;">
      <div style="font-weight:700;color:var(--primary);margin-bottom:6px;"><i class="fas fa-info-circle"></i> Технические реквизиты</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
        <div><span style="color:var(--text2);">УИН:</span> <span class="mono" style="font-size:10.5px;">${d.uin}</span></div>
        <div><span style="color:var(--text2);">Дело №:</span> <span class="mono" style="font-size:10.5px;">${d.caseId}</span></div>
        <div><span style="color:var(--text2);">Камера ФВФ:</span> <span>${d.cam}</span></div>
        <div><span style="color:var(--text2);">Срок оплаты:</span> <span style="font-weight:700;">${d.payDeadline}</span></div>
        ${d.status==='signed'?`<div style="grid-column:1/-1;"><span style="color:var(--text2);">Хеш ЭЦП:</span> <span class="mono" style="font-size:9.5px;word-break:break-all;color:var(--success);">${d.hash}</span></div>`:''}
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
      <button class="btn btn-s" onclick="closeModal('decModal')">Закрыть</button>
      <button class="btn btn-s" onclick="toast('Печать постановления...','info')"><i class="fas fa-print"></i> Печать</button>
      ${d.status==='pending'?`<button class="btn btn-g" onclick="closeModal('decModal');s3_showSignModal(S3T.decisions.find(x=>x.id==='${d.id}'))"><i class="fas fa-signature"></i> Подписать ЭЦП</button>`:''}
      ${d.status==='signed'?`<button class="btn btn-p" onclick="closeModal('decModal');switchStage(4)"><i class="fas fa-envelope"></i> Отправить</button>`:''}
    </div>`;
  document.getElementById('decModal').style.display='flex';
}

/* ============================================================
   QUEST SYSTEM
   ============================================================ */
const QSTEPS=[
  {n:1,title:'Открытие очереди ЭЦП',text:'В разделе <strong>«Подписание ЭЦП»</strong> выберите первое постановление из очереди для просмотра.'},
  {n:2,title:'Отклонение постановления',text:'Нажмите кнопку <strong>«Отклонить»</strong> для возврата некорректного постановления оператору.'},
  {n:3,title:'Подписание одного постановления',text:'Выберите постановление и нажмите кнопку <strong>«Подписать ЭЦП»</strong>. Наблюдайте анимацию подписания.'},
  {n:4,title:'Массовое подписание',text:'Нажмите кнопку <strong>«Все»</strong> для массового подписания ЭЦП всех постановлений в очереди.'},
  {n:5,title:'Изучение печать постановления',text:'Нажмите кнопку <strong>«Печать»</strong> для формирования бумажной копии постановления.'},
  {n:6,title:'Просмотр реестра постановлений',text:'Откройте раздел <strong>«Постановления»</strong> в боковом меню. Изучите реестр всех документов.'},
  {n:7,title:'Административная практика',text:'Откройте <strong>«Административная практика»</strong>. Изучите хронологию типового дела и статистику.'},
  {n:8,title:'Рассмотрение апелляции',text:'В разделе <strong>«Апелляции»</strong> нажмите «Рассмотреть» и вынесите решение по жалобе.'},
  {n:9,title:'Удовлетворение апелляции',text:'Выберите решение <strong>«Удовлетворить жалобу — прекратить производство»</strong> и вынесите его.'},
  {n:10,title:'Просмотр архива',text:'Откройте раздел <strong>«Архив постановлений»</strong>. Верифицируйте подпись одного документа.'},
  {n:11,title:'Полный просмотр постановления',text:'Нажмите кнопку 👁 для просмотра любого постановления. Убедитесь в наличии всех реквизитов.'},
  {n:12,title:'Переход к Этапу 4',text:'Нажмите <strong>«Этап 4: Почта/ФССП»</strong> для перехода к модулю почтовой отправки и взыскания.'}
];
const HINTS=[
  {t:'ЭЦП в ЦАФАП',txt:'Постановление подписывается ЭЦП инспектора ЦАФАП. После подписания документ становится юридически значимым и не может быть изменён.'},
  {t:'Алгоритм подписания',txt:'Используется ГОСТ Р 34.10-2012 (подпись) и ГОСТ Р 34.11-2012 (хеш). Сертификаты выдаются МВД России через КриптоПро УЦ.'},
  {t:'Апелляции (ст.30.1 КоАП)',txt:'Жалоба подаётся в течение 10 суток с момента вручения постановления. Рассматривается в течение 10 суток. При удовлетворении — производство прекращается.'},
  {t:'Неизменяемость данных',txt:'После подписания ЭЦП изменение данных постановления невозможно. Все корректировки — через новое постановление с указанием причин.'}
];
const GLOSSARY=[
  {t:'ЭЦП',d:'Электронная цифровая подпись — криптографическая защита документа'},
  {t:'ГОСТ Р 34.10',d:'Российский стандарт алгоритма цифровой подписи'},
  {t:'КриптоПро',d:'Российское СКЗИ для работы с ЭЦП'},
  {t:'УИН',d:'Уникальный идентификатор начисления — для оплаты штрафа'},
  {t:'ГИС ГМП',d:'Государственная информационная система о платежах'},
  {t:'АПН',d:'Административное правонарушение'},
  {t:'АИПС',d:'Автоматизированная информационно-поисковая система'},
  {t:'Ст.30.1 КоАП',d:'Право на обжалование постановления'},
  {t:'Ст.20.25',d:'Неуплата административного штрафа в срок'},
  {t:'Хеш SHA-256',d:'Криптографический отпечаток документа для проверки целостности'}
];
const ST_Q=SPA_STATE.quest[3];
function s3_initQuest(){ST_Q.done=[];ST_Q.step=0;s3_updateQuestUI();s3_renderInstContent();}
function s3_markQuest(idx){if(!ST_Q.done.includes(idx)){ST_Q.done.push(idx);s3_updateQuestUI();logEvent('quest_step',{step:idx,title:QSTEPS[idx]?.title||'',total:QSTEPS.length});toast(`✅ Шаг ${idx+1}: ${QSTEPS[idx]?.title||''}!`,'success');}}
function s3_nextQuest(){if(ST_Q.step<QSTEPS.length-1){s3_markQuest(ST_Q.step);ST_Q.step++;s3_updateQuestUI();}else{toast('🎓 Этап 3 пройден! Переходите к Этапу 4.','success');s3_markQuest(ST_Q.step);}}
function s3_restartQuest(){ST_Q.done=[];ST_Q.step=0;s3_updateQuestUI();toast('Квест перезапущен','info');}
function s3_updateQuestUI(){
  const pct=Math.round((ST_Q.done.length/ST_Q.total)*100);
  const el=document.getElementById('questPct');if(el)el.textContent=pct+'%';
  const pf=document.getElementById('instProgFill');if(pf)pf.style.width=pct+'%';
  const pt=document.getElementById('instProgTxt');if(pt)pt.textContent=`${ST_Q.done.length}/${ST_Q.total} шагов`;
  s3_renderInstContent();
}
function s3_switchInstTab(el,tab){document.querySelectorAll('.inst-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');S3T.instTab=tab;s3_renderInstContent();}
function s3_renderInstContent(){
  const body=document.getElementById('instBody');if(!body)return;
  const tab=S3T.instTab||'mission';
  if(tab==='mission'){
    const cur=ST_Q.step;
    body.innerHTML=`<div style="flex:1;">
      <div style="font-size:11.5px;font-weight:700;color:var(--primary);margin-bottom:7px;">📋 ЭТАП 3: Постановления, ЭЦП и апелляции</div>
      <div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:4px;">
        ${QSTEPS.map((s,i)=>{const done=ST_Q.done.includes(i);const active=cur===i;return`<div style="text-align:center;flex-shrink:0;width:62px;"><div class="qs-num ${done?'qn-done':active?'qn-active':'qn-pend'}" style="margin:0 auto 3px;">${done?'✓':s.n}</div><div style="font-size:9px;color:${done?'var(--success)':active?'var(--primary)':'var(--text3)'};line-height:1.2;">${s.title.split(' ').slice(0,2).join(' ')}</div></div>`;}).join('')}
      </div>
      ${cur<QSTEPS.length?`<div style="margin-top:7px;padding:8px 10px;background:var(--primary-xs);border-radius:6px;border-left:3px solid var(--primary);"><div style="font-size:10.5px;font-weight:700;color:var(--primary);margin-bottom:2px;">▶ Шаг ${cur+1}/${QSTEPS.length}: ${QSTEPS[cur]?.title}</div><div style="font-size:11px;">${QSTEPS[cur]?.text}</div></div>`:'<div style="padding:8px;background:#E8F5E9;border-radius:6px;font-size:11px;color:var(--success);font-weight:700;">🎓 Все задания Этапа 3 выполнены! Переходите к Этапу 4.</div>'}
    </div>`;
  } else if(tab==='hints'){
    body.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;">${HINTS.map(h=>`<div style="flex:1;min-width:180px;padding:8px;background:#F8FAFF;border-radius:6px;border:1px solid var(--border2);"><div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:3px;">💡 ${h.t}</div><div style="font-size:10.5px;color:var(--text2);line-height:1.4;">${h.txt}</div></div>`).join('')}</div>`;
  } else if(tab==='progress'){
    const pct=Math.round((ST_Q.done.length/ST_Q.total)*100);
    body.innerHTML=`<div style="display:flex;gap:14px;align-items:center;">
      <div style="text-align:center;padding:10px 18px;background:var(--primary-xs);border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:28px;font-weight:800;color:var(--primary);font-family:'Courier New',monospace;">${pct}%</div>
        <div style="font-size:10px;color:var(--text2);">Этап 3</div>
      </div>
      <div style="flex:1;">
        <div class="prog-bar" style="height:10px;margin-bottom:7px;"><div class="prog-fill" style="width:${pct}%;"></div></div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <span style="font-size:10px;background:#E8F5E9;color:var(--success);padding:2px 8px;border-radius:10px;">✓ Выполнено: ${ST_Q.done.length}</span>
          <span style="font-size:10px;background:var(--primary-xs);color:var(--primary);padding:2px 8px;border-radius:10px;">▶ Осталось: ${ST_Q.total-ST_Q.done.length}</span>
        </div>
      </div>
      <div style="font-size:10.5px;color:var(--text2);">
        <div>1. Дашборд ✅</div><div>2. Нарушения ✅</div>
        <div style="font-weight:700;color:var(--primary);">3. Постановления ← здесь</div>
        <div style="color:var(--text3);">4. Почта/ФССП</div><div style="color:var(--text3);">5–6. ...</div>
      </div>
    </div>`;
  } else if(tab==='glossary'){
    body.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:5px;">${GLOSSARY.map(g=>`<div style="padding:4px 9px;background:#F8FAFF;border-radius:4px;border:1px solid var(--border2);"><span style="font-size:11px;font-weight:700;color:var(--primary);">${g.t}</span><span style="font-size:10px;color:var(--text2);margin-left:4px;">— ${g.d}</span></div>`).join('')}</div>`;
  }
}
function s3_toggleInst(){
  S3T.instCollapsed=!S3T.instCollapsed;
  const c=document.getElementById('instContent'),ico=document.getElementById('instTogIco'),panel=document.getElementById('instPanel');
  if(S3T.instCollapsed){c.style.display='none';panel.style.height='42px';ico.className='fas fa-chevron-up';}
  else{c.style.display='';panel.style.height='var(--inst)';ico.className='fas fa-chevron-down';}
}
function toast(msg,type='info'){
  logEvent('notification',{message:msg,level:type});
  const box=document.getElementById('toastBox');
  const icons={info:'fa-info-circle',success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle'};
  const colors={info:'#1565C0',success:'#2E7D32',error:'#C62828',warning:'#F57C00'};
  const d=document.createElement('div');
  d.className=`toast ${type}`;
  d.innerHTML=`<i class="fas ${icons[type]||icons.info}" style="color:${colors[type]||colors.info};flex-shrink:0;font-size:14px;"></i><span>${msg}</span>`;
  box.appendChild(d);
  setTimeout(()=>{d.style.transition='opacity .3s';d.style.opacity='0';setTimeout(()=>d.remove(),300);},3800);
}


/* ------ Stage 3 exports ------ */
  window.s3_setSection = (typeof s3_setSection!=="undefined") ? s3_setSection : window.s3_setSection;
  window.s3_renderSign = (typeof s3_renderSign!=="undefined") ? s3_renderSign : window.s3_renderSign;
  window.s3_selectDecision = (typeof s3_selectDecision!=="undefined") ? s3_selectDecision : window.s3_selectDecision;
  window.s3_renderSignCenter = (typeof s3_renderSignCenter!=="undefined") ? s3_renderSignCenter : window.s3_renderSignCenter;
  window.s3_renderPostanovlenie = (typeof s3_renderPostanovlenie!=="undefined") ? s3_renderPostanovlenie : window.s3_renderPostanovlenie;
  window.s3_renderSignBlock = (typeof s3_renderSignBlock!=="undefined") ? s3_renderSignBlock : window.s3_renderSignBlock;
  window.s3_renderSignedBlock = (typeof s3_renderSignedBlock!=="undefined") ? s3_renderSignedBlock : window.s3_renderSignedBlock;
  window.s3_doSign = (typeof s3_doSign!=="undefined") ? s3_doSign : window.s3_doSign;
  window.s3_showSignModal = (typeof s3_showSignModal!=="undefined") ? s3_showSignModal : window.s3_showSignModal;
  window.s3_runSignSequence = (typeof s3_runSignSequence!=="undefined") ? s3_runSignSequence : window.s3_runSignSequence;
  window.s3_signAll = (typeof s3_signAll!=="undefined") ? s3_signAll : window.s3_signAll;
  window.s3_rejectDecision = (typeof s3_rejectDecision!=="undefined") ? s3_rejectDecision : window.s3_rejectDecision;
  window.s3_printDecision = (typeof s3_printDecision!=="undefined") ? s3_printDecision : window.s3_printDecision;
  window.s3_renderDecisions = (typeof s3_renderDecisions!=="undefined") ? s3_renderDecisions : window.s3_renderDecisions;
  window.s3_renderAdminPractice = (typeof s3_renderAdminPractice!=="undefined") ? s3_renderAdminPractice : window.s3_renderAdminPractice;
  window.s3_renderAppeals = (typeof s3_renderAppeals!=="undefined") ? s3_renderAppeals : window.s3_renderAppeals;
  window.s3_showAppealModal = (typeof s3_showAppealModal!=="undefined") ? s3_showAppealModal : window.s3_showAppealModal;
  window.s3_submitAppealDecision = (typeof s3_submitAppealDecision!=="undefined") ? s3_submitAppealDecision : window.s3_submitAppealDecision;
  window.s3_renderArchive = (typeof s3_renderArchive!=="undefined") ? s3_renderArchive : window.s3_renderArchive;
  window.s3_showDecModal = (typeof s3_showDecModal!=="undefined") ? s3_showDecModal : window.s3_showDecModal;
  window.s3_initQuest = (typeof s3_initQuest!=="undefined") ? s3_initQuest : window.s3_initQuest;
  window.s3_markQuest = (typeof s3_markQuest!=="undefined") ? s3_markQuest : window.s3_markQuest;
  window.s3_nextQuest = (typeof s3_nextQuest!=="undefined") ? s3_nextQuest : window.s3_nextQuest;
  window.s3_restartQuest = (typeof s3_restartQuest!=="undefined") ? s3_restartQuest : window.s3_restartQuest;
  window.s3_updateQuestUI = (typeof s3_updateQuestUI!=="undefined") ? s3_updateQuestUI : window.s3_updateQuestUI;
  window.s3_switchInstTab = (typeof s3_switchInstTab!=="undefined") ? s3_switchInstTab : window.s3_switchInstTab;
  window.s3_renderInstContent = (typeof s3_renderInstContent!=="undefined") ? s3_renderInstContent : window.s3_renderInstContent;
  window.s3_toggleInst = (typeof s3_toggleInst!=="undefined") ? s3_toggleInst : window.s3_toggleInst;
  if(typeof S3T!=="undefined") window.S3T = S3T;
  window.s3_badges=function(){return {sign:S3T.decisions.filter(d=>d.status==='pending').length,decisions:S3T.decisions.length,appeals:APPEALS_DATA.length};};
})(); /* end Stage 3 IIFE */
/* initStage3 */
function initStage3(){if(typeof s3_setSection==="function")s3_setSection("sign",null);}
