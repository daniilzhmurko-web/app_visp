;(function() {
/* ------ Stage 1 scope start ------ */
/* ================================================================
   ЭТАП 1 — КОД (namespace: s1_)
   ================================================================ */

/* ============================================================
   ГЛОБАЛЬНОЕ СОСТОЯНИЕ
   ============================================================ */
/* S aliased to SPA_STATE for stage compatibility */
const S = SPA_STATE;
S.stats = S.stats || {total:247,queue:24,processed:189,unpaid:63,camsOnline:246,camsTotal:248};
S.ui = S.ui || {view:"dashboard",instTab:"mission",instCollapsed:false};
/* Stage 1 quest is SPA_STATE.quest[1] */
// SQ = local alias for stage-1 quest slot
var SQ = SPA_STATE.quest[1]; SQ.total = SQ.total || 12;

/* ============================================================
   ЭТАЛОННЫЕ ДАННЫЕ — 200+ записей генерируются процедурно
   ============================================================ */
const ROLES={
  operator:{name:'Оператор ЦАФАП',chip:'role-op',chipTxt:'Оператор'},
  inspector:{name:'Инспектор ЦАФАП',chip:'role-ins',chipTxt:'Инспектор'},
  senior:{name:'Старший инспектор',chip:'role-ins',chipTxt:'Ст. инспектор'},
  reg_admin:{name:'Рег. администратор',chip:'role-adm',chipTxt:'Рег. Адмін'},
  fed_admin:{name:'Фед. администратор',chip:'role-adm',chipTxt:'Фед. Адмін'},
  analyst:{name:'Аналитик',chip:'role-ana',chipTxt:'Аналитик'},
  postal:{name:'Специалист почты',chip:'role-op',chipTxt:'Почта'}
};
const REGIONS={
  '77':'77 — г. Москва','50':'50 — Московская обл.','78':'78 — г. Санкт-Петербург',
  '23':'23 — Краснодарский край','16':'16 — Татарстан','63':'63 — Самарская обл.',
  '52':'52 — Нижегородская обл.','05':'05 — Дагестан'
};
const VTYPES=[
  {code:'12.9.2',name:'Превышение скорости на 20–40 км/ч',fine:500,speed:true},
  {code:'12.9.3',name:'Превышение скорости на 40–60 км/ч',fine:1000,speed:true},
  {code:'12.9.4',name:'Превышение скорости на 60–80 км/ч',fine:2000,speed:true},
  {code:'12.9.5',name:'Превышение скорости более чем на 80 км/ч',fine:5000,speed:true},
  {code:'12.12.1',name:'Проезд на запрещающий сигнал светофора',fine:1000,speed:false},
  {code:'12.16.1',name:'Нарушение требований дорожных знаков',fine:500,speed:false},
  {code:'12.17.2',name:'Движение по выделенной полосе для ОТ',fine:3000,speed:false},
  {code:'12.19.2',name:'Нарушение правил остановки/стоянки',fine:1500,speed:false},
  {code:'12.15.4',name:'Выезд на полосу встречного движения',fine:5000,speed:false},
  {code:'12.18',name:'Непредоставление преимущества пешеходу',fine:1500,speed:false},
  {code:'12.29.1',name:'Нарушение ПДД пешеходом',fine:500,speed:false},
  {code:'12.8.1',name:'Управление ТС в состоянии опьянения',fine:30000,speed:false}
];
/* Комплексы ФВФ — база data/fvf_complexes.js */
const CAMERAS=CAFAP_DB.fvf.region('77').map(c=>({id:c.id,addr:c.addr,st:c.status,type:c.type,model:c.model}));
/* Госномера и владельцы — база ФИС ГИБДД-М (data/fis_gibdd_m.js). Сценарные номера (А177МС77, О917ММ177 и др.) есть всегда. */
const FIS_POOL=CAFAP_DB.fis.violationPool(247,3);
const PLATES=Array.from(new Set(FIS_POOL.map(r=>r.vehicle.plate)));
const OWNERS=Array.from(new Set(FIS_POOL.map(r=>CAFAP_DB.fis.shortName(r.owner))));
const STATUSES=['new','new','new','new','processing','processing','done','done','done','error'];
const FEED_MSGS=[
  {ico:'fa-camera',t:'blue',txt:'Новое нарушение: <b>{P}</b>, {A}'},
  {ico:'fa-check',t:'green',txt:'OCR подтверждено оператором: <b>{P}</b>'},
  {ico:'fa-ruble-sign',t:'green',txt:'Штраф оплачен: <b>{P}</b>, {F} руб.'},
  {ico:'fa-envelope',t:'blue',txt:'Отправлено заказное письмо: <b>{P}</b>'},
  {ico:'fa-exclamation',t:'orange',txt:'Просрочка 20.25: <b>{P}</b>'},
  {ico:'fa-user',t:'blue',txt:'Найден владелец ТС <b>{P}</b> в РЭО'},
  {ico:'fa-gavel',t:'purple',txt:'Дело передано в ФССП: <b>{P}</b>'},
  {ico:'fa-times',t:'red',txt:'OCR-ошибка: госномер не распознан'}
];

// Генератор нарушений (процедурный)
function genViolations(count){
  const now=new Date();
  return Array.from({length:count},(_,i)=>{
    const vt=VTYPES[Math.floor(Math.random()*VTYPES.length)];
    const cam=CAMERAS[Math.floor(Math.random()*CAMERAS.length)];
    const rec=FIS_POOL[i%FIS_POOL.length];
    const plate=rec.vehicle.plate;
    const owner=CAFAP_DB.fis.shortName(rec.owner);
    const status=STATUSES[Math.floor(Math.random()*STATUSES.length)];
    const mAgo=Math.floor(Math.random()*480);
    const t=new Date(now-mAgo*60000);
    const baseSpeed=60+Math.floor(Math.random()*80);
    return{
      id:`ДЕЛ-2026-${String(10000+i).padStart(5,'0')}`,
      time:t.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
      cam:cam.id,addr:cam.addr,plate,owner,vtype:vt,status,
      speed:vt.speed?baseSpeed+'км/ч':'—',
      limit:vt.speed?'60км/ч':'—',
      ts:t
    };
  }).sort((a,b)=>b.ts-a.ts);
}

let allViolations=[];

/* ============================================================
   AUTH FUNCTIONS
   ============================================================ */
function selTab(el,type){
  document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  if(type==='sud') toast('СУДИР — Система единой идентификации. Для тренажёра используйте «Внутренняя»','info');
}
window.selTab = selTab;

function onRoleChange(){
  const r=document.getElementById('roleSelect').value;
  const hints={
    operator:'🔵 Оператор: OCR-верификация, без персональных данных',
    inspector:'🟡 Инспектор: полный доступ, подпись постановлений',
    senior:'🟠 Старший инспектор: контроль операторов',
    reg_admin:'🔴 Региональный администратор: управление регионом',
    fed_admin:'🔴 Фед. администратор: полный доступ к системе',
    analyst:'🟢 Аналитик: только чтение, отчёты и аналитика',
    postal:'📮 Почта: формирование и контроль отправлений'
  };
  document.getElementById('loginHint').textContent=hints[r]||'';
}
window.onRoleChange = onRoleChange;

/* duplicate function removed */

function errLogin(msg){
  const h=document.getElementById('loginHint');
  h.style.color='var(--accent-red)';h.textContent='⚠ '+msg;
  setTimeout(()=>{h.style.color='';h.textContent='';onRoleChange();},3000);
}

/* INIT SEQUENCE */

/* ============================================================
   MAIN APP INIT
   ============================================================ */

/* ============================================================
   ANIMATIONS
   ============================================================ */
function animCount(id,target,sub,subId){
  const el=document.getElementById(id);if(!el)return;
  let cur=0;const inc=Math.ceil(target/30);
  const t=setInterval(()=>{
    cur=Math.min(cur+inc,target);
    el.textContent=cur.toLocaleString('ru');
    if(cur>=target){
      clearInterval(t);
      if(sub&&subId){const s=document.getElementById(subId);if(s)s.textContent=sub;}
    }
  },35);
}

/* ============================================================
   VIOLATION TABLE
   ============================================================ */
const SB_MAP={
  new:{cls:'sb-new',lbl:'Новое',ico:'fa-star'},
  processing:{cls:'sb-proc',lbl:'Обработка',ico:'fa-spinner fa-spin'},
  done:{cls:'sb-done',lbl:'Готово',ico:'fa-check'},
  error:{cls:'sb-err',lbl:'Ошибка OCR',ico:'fa-times'},
  pending:{cls:'sb-pend',lbl:'Ожидает',ico:'fa-clock'}
};
function s1_renderViolTable(rows){
  const tb=document.getElementById('violBody');if(!tb)return;
  tb.innerHTML=rows.map(v=>{
    const sb=SB_MAP[v.status]||SB_MAP.new;
    const speedCol=v.vtype.speed?`<span style="color:var(--accent-red);font-weight:700;" class="mono">${v.speed}</span>`:'<span style="color:var(--text3);">—</span>';
    return`<tr>
      <td class="mono" style="font-size:10.5px;color:var(--primary);">${v.id}</td>
      <td class="mono" style="font-size:10.5px;">${v.time}</td>
      <td style="font-size:10.5px;"><div style="font-weight:600;">${v.cam}</div><div style="color:var(--text3);font-size:10px;">${v.addr}</div></td>
      <td><span class="plate">${v.plate}</span></td>
      <td><span class="vtype-chip">ст.${v.vtype.code}</span><div style="font-size:10px;color:var(--text3);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v.vtype.name}">${v.vtype.name}</div></td>
      <td class="mono" style="font-size:10.5px;">${v.vtype.code}</td>
      <td>${speedCol}</td>
      <td style="font-size:11px;font-weight:700;color:var(--success);" class="mono">${v.vtype.fine.toLocaleString('ru')} ₽</td>
      <td><span class="sbadge ${sb.cls}"><i class="fas ${sb.ico}" style="font-size:9px;"></i> ${sb.lbl}</span></td>
      <td>
        <div style="display:flex;gap:3px;">
          <button class="btn btn-p btn-sm" onclick="s1_openCase('${v.id}')" title="Просмотр"><i class="fas fa-eye"></i></button>
          <button class="btn btn-s btn-sm" onclick="s1_goToStage2()" title="Обработать"><i class="fas fa-edit"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function s1_filterTable(){
  const ft=document.getElementById('filterType').value;
  const fs=document.getElementById('filterStatus').value;
  let rows=allViolations;
  if(ft) rows=rows.filter(v=>v.vtype.code.startsWith(ft));
  if(fs) rows=rows.filter(v=>v.status===fs);
  s1_renderViolTable(rows.slice(0,10));
  document.getElementById('totalCount').textContent=rows.length;
}

function s1_openCase(id){
  s1_markQuest(4);
  toast(`Дело ${id}: подробный просмотр и обработка — Этап 2`,'info');
}

/* ============================================================
   ACTIVITY FEED
   ============================================================ */
let feedItems=[
  {ico:'fa-camera',t:'blue',txt:'Новое нарушение: <b>А177МС77</b>, Тверская ул.',time:'14:32:15'},
  {ico:'fa-check',t:'green',txt:'Постановление <b>ПОСТ-2026-00234</b> подписано ЭЦП',time:'14:31:08'},
  {ico:'fa-envelope',t:'blue',txt:'Отправлено заказное письмо <b>14580527183</b>',time:'14:30:44'},
  {ico:'fa-times',t:'red',txt:'Камера <b>CAM-077-015</b> потеряла связь',time:'14:28:20'},
  {ico:'fa-ruble-sign',t:'green',txt:'Штраф оплачен: <b>В234КЕ99</b> — 1 000 руб.',time:'14:27:55'},
  {ico:'fa-user',t:'blue',txt:'Найден владелец ТС <b>М568РО77</b> в РЭО',time:'14:26:33'},
  {ico:'fa-exclamation',t:'orange',txt:'Нарушение ст.20.25: <b>Т923УА50</b> просрочено',time:'14:25:11'},
  {ico:'fa-gavel',t:'purple',txt:'Дело передано в ФССП: <b>Е445ВВ78</b>',time:'14:24:00'}
];
function s1_renderFeed(){
  const fb=document.getElementById('feedBody');if(!fb)return;
  fb.innerHTML=feedItems.slice(0,8).map(it=>`
    <div class="feed-item">
      <div class="feed-ico fi-${it.t}"><i class="fas ${it.ico}"></i></div>
      <div><div class="feed-text">${it.txt}</div><div class="feed-time">${it.time}</div></div>
    </div>`).join('');
}

/* ============================================================
   TIMER & LIVE
   ============================================================ */
function s1_startLive(){
  setInterval(()=>{
    // Новое нарушение
    S.stats.total+=Math.floor(Math.random()*3)+1;
    S.stats.queue=Math.max(S.stats.queue+Math.floor(Math.random()*5)-2,0);
    const _st=document.getElementById('stTotal');if(_st)_st.textContent=S.stats.total.toLocaleString('ru');
    const _sq=document.getElementById('stQueue');if(_sq)_sq.textContent=S.stats.queue;
    const _nb=document.getElementById('nbQueue');if(_nb)_nb.textContent=S.stats.queue;
    // Добавляем в ленту
    const plate=rPlate();
    const addr=rAddr();
    const tmpl=FEED_MSGS[Math.floor(Math.random()*FEED_MSGS.length)];
    feedItems.unshift({
      ico:tmpl.ico,t:tmpl.t,
      txt:tmpl.txt.replace('{P}',plate).replace('{A}',addr).replace('{F}',[500,1000,2000][Math.floor(Math.random()*3)]),
      time:curTime()
    });
    feedItems=feedItems.slice(0,8);
    s1_renderFeed();
  },12000+Math.random()*8000);
  // Обновляем таблицу каждые 45 сек
  setInterval(()=>{
    allViolations=genViolations(247);
    s1_renderViolTable(allViolations.slice(0,10));
  },45000);
}

function rPlate(){
  const L='АВЕКМНОРСТУХ';
  const l=()=>L[Math.floor(Math.random()*L.length)];
  const n=()=>Math.floor(Math.random()*10);
  return `${l()}${n()}${n()}${n()}${l()}${l()}77`;
}
function rAddr(){
  const a=['Тверская ул.','Садовое кольцо','Кутузовский пр.','МКАД','Варшавское ш.','ТТК'];
  return a[Math.floor(Math.random()*a.length)];
}
function curTime(){return new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit',second:'2-digit'});}

/* ============================================================
   VIEWS
   ============================================================ */
function setView(v,navEl){
  SPA_STATE.view=v;
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));
  if(navEl)navEl.classList.add('active');
  if(v==='dashboard')s1_renderDash();
  else if(v==='cameras')s1_renderCameras();
  else if(v==='audit')s1_renderAudit();
  else if(v==='queue')s1_renderQueue();
  else if(v==='search')s1_openSearchModal();
}

function s1_renderDash(){
  // Восстанавливаем стандартный вид центральной панели
  if(!document.getElementById('colCenter')){
    // Просто выходим — layout должен быть построен s1_setSection
    // Не вызываем s1_setSection чтобы избежать рекурсии
    return;
  }
  const cc=document.getElementById('colCenter');
  cc.innerHTML=`
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card sc-blue"><div class="stat-ico"><i class="fas fa-camera"></i></div><div class="stat-val" id="stTotal">${S.stats.total.toLocaleString('ru')}</div><div class="stat-lbl">Нарушений сегодня</div><div class="stat-sub">+ 12 за последний час</div></div>
      <div class="stat-card sc-orange"><div class="stat-ico"><i class="fas fa-inbox"></i></div><div class="stat-val" id="stQueue">${S.stats.queue}</div><div class="stat-lbl">В очереди</div><div class="stat-sub">ожидают обработки</div></div>
      <div class="stat-card sc-green"><div class="stat-ico"><i class="fas fa-check-circle"></i></div><div class="stat-val" id="stProc">${S.stats.processed}</div><div class="stat-lbl">Обработано</div><div class="stat-sub">76% эффективность</div></div>
      <div class="stat-card sc-red"><div class="stat-ico"><i class="fas fa-ruble-sign"></i></div><div class="stat-val" id="stUnpaid">${S.stats.unpaid}</div><div class="stat-lbl">Неоплаченных</div><div class="stat-sub">просрочено штрафов</div></div>
      <div class="stat-card sc-purple"><div class="stat-ico"><i class="fas fa-video"></i></div><div class="stat-val" id="stCams">${S.stats.camsOnline}</div><div class="stat-lbl">Камер онлайн</div><div class="stat-sub">из ${S.stats.camsTotal} активных</div></div>
    </div>
    <div class="card" id="violCard">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-inbox"></i>Входящая очередь нарушений<span class="live-ind" style="margin-left:6px;">LIVE</span></div>
        <div style="display:flex;gap:6px;align-items:center;">
          <select class="form-select" style="width:145px;padding:4px 8px;font-size:11px;" id="filterType" onchange="s1_filterTable()"><option value="">Все типы</option><option value="12.9">Превышение скорости</option><option value="12.12">Проезд на красный</option><option value="12.17">Выделенная полоса</option></select>
          <select class="form-select" style="width:115px;padding:4px 8px;font-size:11px;" id="filterStatus" onchange="s1_filterTable()"><option value="">Все статусы</option><option value="new">Новые</option><option value="processing">В обработке</option><option value="done">Готовы</option></select>
          <button class="btn btn-p btn-sm" onclick="s1_goToStage2()"><i class="fas fa-play"></i> Обработать</button>
        </div>
      </div>
      <div style="overflow-x:auto;"><table class="data-table">
        <thead><tr><th>№ Дела</th><th>Время</th><th>Камера / Адрес</th><th>Г/Н</th><th>Тип нарушения</th><th>Ст. КоАП</th><th>Скорость</th><th>Штраф</th><th>Статус</th><th>Действия</th></tr></thead>
        <tbody id="violBody"></tbody>
      </table></div>
      <div class="pagination"><div>Показано 1–10 из <span id="totalCount">${allViolations.length}</span> записей</div>
        <div class="pg-btns"><div class="pg-btn"><i class="fas fa-chevron-left" style="font-size:9px;"></i></div><div class="pg-btn active">1</div><div class="pg-btn">2</div><div class="pg-btn">3</div><div class="pg-btn"><i class="fas fa-chevron-right" style="font-size:9px;"></i></div></div>
      </div>
    </div>
    <div class="card"><div class="card-hdr"><div class="card-title"><i class="fas fa-bolt"></i>Быстрые действия</div></div>
      <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-p btn-sm" onclick="s1_goToStage2()"><i class="fas fa-camera"></i> OCR-верификация</button>
        <button class="btn btn-s btn-sm" onclick="s1_openSearchModal()"><i class="fas fa-search"></i> Поиск дела</button>
        <button class="btn btn-s btn-sm" onclick="toast('Этап 3: Формирование постановлений','info')"><i class="fas fa-file-alt"></i> Новое постановление</button>
        <button class="btn btn-s btn-sm" onclick="s1_queryFIS()"><i class="fas fa-database"></i> Запрос ФИС ГИБДД-М</button>
        <button class="btn btn-s btn-sm" onclick="s1_setSection('cameras',null)"><i class="fas fa-video"></i> Статус камер</button>
        <button class="btn btn-s btn-sm" onclick="s1_setSection('audit',null)"><i class="fas fa-history"></i> Журнал аудита</button>
      </div>
    </div>`;
  s1_renderViolTable(allViolations.slice(0,10));
  const nd=document.getElementById('nav-dash');if(nd)nd.classList.add('active');
}

function s1_renderCameras(){
  if(!document.getElementById('colCenter')){return;}
  s1_markQuest(2);
  const cc=document.getElementById('colCenter');
  cc.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-video" style="color:var(--primary);"></i>Сеть камер ФВФ — регион 77</h2>
      <button class="btn btn-s btn-sm" onclick="s1_renderDash()"><i class="fas fa-arrow-left"></i> Назад</button>
    </div>
    <div class="card">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-satellite-dish"></i>Статус камер фото-видеофиксации</div>
        <div style="display:flex;gap:12px;font-size:11px;">
          <span style="color:var(--success);"><i class="fas fa-circle" style="font-size:8px;"></i> Онлайн: ${CAMERAS.filter(c=>c.st==='online').length}</span>
          <span style="color:var(--accent);"><i class="fas fa-circle" style="font-size:8px;"></i> Предупреждение: ${CAMERAS.filter(c=>c.st==='warning').length}</span>
          <span style="color:var(--accent-red);"><i class="fas fa-circle" style="font-size:8px;"></i> Offline: ${CAMERAS.filter(c=>c.st==='offline').length}</span>
        </div>
      </div>
      <div class="card-body">
        <div class="cam-grid" style="grid-template-columns:repeat(2,1fr);">
          ${CAMERAS.map(c=>`
            <div class="cam-cell" onclick="s1_camDetail('${c.id}')">
              <div class="cam-led ${c.st==='online'?'led-on':c.st==='warning'?'led-warn':'led-off'}"></div>
              <div style="flex:1;min-width:0;">
                <div style="font-weight:700;font-size:11px;">${c.id}</div>
                <div style="font-size:10px;color:var(--text2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.addr}</div>
                <div style="font-size:10px;color:var(--text3);">${c.type} · ${c.model}</div>
              </div>
              <span style="font-size:9px;padding:2px 6px;border-radius:3px;font-weight:700;flex-shrink:0;
                background:${c.st==='online'?'#E8F5E9':c.st==='warning'?'#FFF3E0':'#FFEBEE'};
                color:${c.st==='online'?'var(--success)':c.st==='warning'?'var(--accent)':'var(--accent-red)'};">
                ${c.st==='online'?'OK':c.st==='warning'?'WARN':'FAIL'}
              </span>
            </div>`).join('')}
        </div>
      </div>
    </div>
    <div class="card" style="flex-shrink:0;">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-chart-bar"></i>Нарушений по камерам (последние 2 часа)</div></div>
      <div class="card-body" style="padding:8px;height:160px;position:relative;">
        <canvas id="camChart" style="display:block;width:100%;height:160px;"></canvas>
      </div>
    </div>`;
  setTimeout(()=>{
    const ctx=document.getElementById('camChart');
    if(!ctx)return;
    {const _ex=Chart.getChart(ctx);if(_ex){try{_ex.destroy();}catch(e){}}}
    // Ensure container has explicit pixel height before Chart.js measures
    const chartWrap=ctx.parentElement;
    if(chartWrap){chartWrap.style.height='160px';ctx.style.height='160px';}
    window._camChart=safeChart(ctx,{type:'bar',data:{
      labels:CAMERAS.slice(0,10).map(c=>c.id.replace('CAM-077-','К')),
      datasets:[{label:'Нарушений',data:CAMERAS.slice(0,10).map(()=>Math.floor(Math.random()*50)+5),backgroundColor:'rgba(21,101,192,.15)',borderColor:'#1565C0',borderWidth:1.5}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}});
    setTimeout(()=>{if(window._camChart)window._camChart.resize();},80);
  },350);
}

function s1_camDetail(id){
  const c=CAMERAS.find(x=>x.id===id);if(!c)return;
  const t=c.st==='online'?'success':c.st==='warning'?'warning':'error';
  toast(`${c.id} · ${c.addr} · ${c.type} · ${c.st==='online'?'ONLINE':c.st==='warning'?'ПРЕДУПРЕЖДЕНИЕ':'OFFLINE'}`,t);
}

function s1_renderAudit(){
  // Ensure layout is built
  if(!document.getElementById('colCenter')){return;}
  s1_markQuest(3);
  const entries=[
    {time:'14:32:15',user:'ivanov_op',act:'Просмотр дела',obj:'ДЕЛ-2026-10247',ip:'192.168.1.105',res:'ok'},
    {time:'14:31:08',user:'petrov_ins',act:'Подписание ЭЦП',obj:'ПОСТ-2026-00234',ip:'192.168.1.110',res:'ok'},
    {time:'14:30:44',user:'smirnov_op',act:'Отправка письма',obj:'ПОСТ-2026-00233',ip:'192.168.1.106',res:'ok'},
    {time:'14:29:20',user:'admin_reg77',act:'Изм. настроек',obj:'Регион 77',ip:'192.168.1.200',res:'ok'},
    {time:'14:28:11',user:'ivanov_op',act:'Корректировка OCR',obj:'ДЕЛ-2026-10246',ip:'192.168.1.105',res:'ok'},
    {time:'14:27:55',user:'SYSTEM',act:'Авто-уведомление',obj:'Платёж ГИС ГМП',ip:'10.0.0.1',res:'ok'},
    {time:'14:26:33',user:'petrov_ins',act:'Запрос в РЭО ГИБДД',obj:'М568РО77',ip:'192.168.1.110',res:'ok'},
    {time:'14:25:11',user:'SYSTEM',act:'Просрочка штрафа',obj:'ПОСТ-2026-00198',ip:'10.0.0.1',res:'warn'},
    {time:'14:24:00',user:'petrov_ins',act:'Передача в ФССП',obj:'ПОСТ-2026-00176',ip:'192.168.1.110',res:'ok'},
    {time:'14:23:44',user:'ivanov_op',act:'Попытка доступа',obj:'Персональные данные',ip:'192.168.1.105',res:'deny'}
  ];
  const cc=document.getElementById('colCenter');
  if(!cc)return;
  cc.innerHTML=`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-history" style="color:var(--primary);"></i>Журнал аудита действий</h2>
      <button class="btn btn-s btn-sm" onclick="s1_renderDash()"><i class="fas fa-arrow-left"></i> Назад</button>
    </div>
    <div class="card">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-shield-alt"></i>Аудит — защищённая неизменяемая запись</div>
        <div style="display:flex;gap:6px;">
          <input type="text" class="form-control" placeholder="Поиск..." style="width:160px;padding:4px 9px;font-size:11px;">
          <button class="btn btn-s btn-sm"><i class="fas fa-filter"></i> Фильтр</button>
          <button class="btn btn-s btn-sm" onclick="toast('Экспорт журнала в XLSX...','info')"><i class="fas fa-download"></i> Экспорт</button>
        </div>
      </div>
      <div style="overflow-x:auto;"><table class="data-table">
        <thead><tr><th>Время</th><th>Пользователь</th><th>Действие</th><th>Объект</th><th>IP-адрес</th><th>Результат</th></tr></thead>
        <tbody>${entries.map(e=>`<tr>
          <td class="mono" style="font-size:10.5px;">${e.time}</td>
          <td style="font-size:11.5px;font-weight:600;">${e.user}</td>
          <td style="font-size:11px;">${e.act}</td>
          <td class="mono" style="font-size:10.5px;color:var(--primary);">${e.obj}</td>
          <td class="mono" style="font-size:10.5px;">${e.ip}</td>
          <td><span class="sbadge ${e.res==='ok'?'sb-done':e.res==='warn'?'sb-proc':'sb-err'}">
            ${e.res==='ok'?'✓ Успешно':e.res==='warn'?'⚠ Предупреждение':'✕ Отказано'}</span></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}

function s1_renderQueue(){
  s1_markQuest(4);
  s1_renderDash();
  (function(){const _gnav_queue=document.getElementById('nav-queue');if(_gnav_queue)_gnav_queue.classList.add('active');})();
  toast(`Очередь нарушений: ${S.stats.queue} ожидают обработки`,'info');
}

/* ============================================================
   MODALS & SEARCH
   ============================================================ */
function s1_openSearchModal(){
  document.getElementById('searchModal').style.display='flex';
  document.getElementById('srchResult').innerHTML='';
}
function closeModal(id){document.getElementById(id).style.display='none';}

function s1_doSearch(){
  const c=document.getElementById('srchCase').value;
  const p=document.getElementById('srchPlate').value;
  const n=document.getElementById('srchName').value;
  if(!c&&!p&&!n){document.getElementById('srchResult').innerHTML='<div style="color:var(--accent-red);font-size:12px;">Введите параметры поиска</div>';return;}
  const v=allViolations.find(x=>(c&&x.id===c)||(p&&CAFAP_DB.normPlate(x.plate)===CAFAP_DB.normPlate(p))||(n&&x.owner.toLowerCase().includes(n.toLowerCase())));
  if(v){
    document.getElementById('srchResult').innerHTML=`<div style="background:var(--primary-xs);border:1px solid var(--border2);border-radius:8px;padding:12px;font-size:12px;">
      <div style="font-weight:700;color:var(--primary);margin-bottom:6px;">✓ Найдено: ${v.id}</div>
      <div>Г/Н: <span class="plate" style="font-size:10px;">${v.plate}</span>&nbsp;&nbsp;Владелец: <b>${v.owner}</b></div>
      <div style="margin-top:4px;">Нарушение: ${v.vtype.name}</div>
      <div>Время: ${v.time}&nbsp;&nbsp;Камера: ${v.cam}</div>
      <div>Штраф: <b style="color:var(--success);">${v.vtype.fine.toLocaleString('ru')} ₽</b>&nbsp;&nbsp;Статус: ${v.status}</div>
      <button class="btn btn-p btn-sm" style="margin-top:8px;" onclick="closeModal('searchModal');s1_goToStage2()">Открыть для обработки →</button>
    </div>`;
    s1_markQuest(5);
  } else {
    document.getElementById('srchResult').innerHTML=`<div style="color:var(--accent-red);font-size:12px;">⚠ Записей не найдено по заданным критериям</div>`;
  }
}

/* ============================================================
   ЗАПРОС К ФИС ГИБДД-М (поиск по учебной базе data/fis_gibdd_m.js)
   ============================================================ */
function s1_fisFlags(c){
  const f=[];
  if(c.wanted)f.push('<span class="sbadge sb-error" style="font-size:9px;">РОЗЫСК</span>');
  if(c.restrictions.length)f.push('<span class="sbadge sb-processing" style="font-size:9px;">ОГРАНИЧЕНИЯ</span>');
  if(c.vehicle.osago.status!=='valid')f.push('<span class="sbadge sb-processing" style="font-size:9px;">ОСАГО '+(c.vehicle.osago.status==='none'?'НЕТ':'ИСТЁК')+'</span>');
  if(c.license&&(c.license.status==='deprived'||c.license.status==='suspended'))f.push('<span class="sbadge sb-error" style="font-size:9px;">ЛИШЁН ВУ</span>');
  if(c.vehicle.regStatus!=='registered')f.push('<span class="sbadge sb-processing" style="font-size:9px;">'+({suspended:'РЕГ. ПРИОСТАНОВЛЕНА',removed:'СНЯТО С УЧЁТА'})[c.vehicle.regStatus]+'</span>');
  return f.length?f.join(' '):'<span style="color:var(--success);font-size:11px;">нет замечаний ✓</span>';
}
function s1_queryFIS(){
  let m=document.getElementById('fisModal');
  if(!m){
    m=document.createElement('div');m.id='fisModal';m.className='modal-bg';
    m.onclick=function(e){if(e.target===m)closeModal('fisModal');};
    const st=CAFAP_DB.fis.stats();
    m.innerHTML=`<div class="modal-box" style="width:880px;max-width:95vw;">
      <div class="modal-hdr"><div class="modal-title"><i class="fas fa-database" style="color:var(--primary);"></i> Запрос в ФИС ГИБДД-М
        <span class="sbadge sb-new" style="font-size:10px;">учебная база: ${st.vehicles.toLocaleString('ru')} ТС · ${st.owners.toLocaleString('ru')} владельцев</span></div>
        <button class="btn btn-s btn-sm" onclick="closeModal('fisModal')"><i class="fas fa-times"></i></button></div>
      <div style="display:grid;grid-template-columns:1.1fr 1.5fr 1.5fr auto;gap:8px;align-items:end;">
        <div class="form-group" style="margin:0;"><label class="form-label">Госномер</label><input id="fisPlate" class="form-control mono" placeholder="А177МС77" autocomplete="off" onkeydown="if(event.key==='Enter')s1_fisSearch()"></div>
        <div class="form-group" style="margin:0;"><label class="form-label">VIN</label><input id="fisVin" class="form-control mono" placeholder="XWFFXXEEBFJ123456" autocomplete="off" onkeydown="if(event.key==='Enter')s1_fisSearch()"></div>
        <div class="form-group" style="margin:0;"><label class="form-label">ФИО владельца</label><input id="fisFio" class="form-control" placeholder="Иванов Иван" autocomplete="off" onkeydown="if(event.key==='Enter')s1_fisSearch()"></div>
        <button class="btn btn-p" onclick="s1_fisSearch()"><i class="fas fa-search"></i> Найти</button>
      </div>
      <div style="font-size:11px;color:var(--text3);margin:8px 0 10px;">Попробуйте: <a href="#" onclick="event.preventDefault();s1_fisExample('А177МС77')">А177МС77</a> (в розыске) ·
        <a href="#" onclick="event.preventDefault();s1_fisExample('О917ММ177')">О917ММ177</a> · <a href="#" onclick="event.preventDefault();s1_fisExample('К567ЕЕ99')">К567ЕЕ99</a> · или часть номера, например «М5». Данные синтетические.</div>
      <div id="fisResults"><div style="text-align:center;color:var(--text3);font-size:12px;padding:18px;">Введите госномер, VIN или ФИО владельца и нажмите «Найти»</div></div>
      <div id="fisDetail"></div>
    </div>`;
    document.body.appendChild(m);
  }
  m.style.display='flex';
  setTimeout(()=>{const e=document.getElementById('fisPlate');e&&e.focus();},60);
  s1_markQuest(6);
  logEvent('fis_query',{action:'open'});
}
function s1_fisExample(p){document.getElementById('fisPlate').value=p;document.getElementById('fisVin').value='';document.getElementById('fisFio').value='';s1_fisSearch();}
function s1_fisSearch(){
  const q={plate:document.getElementById('fisPlate').value.trim(),vin:document.getElementById('fisVin').value.trim(),fio:document.getElementById('fisFio').value.trim()};
  const box=document.getElementById('fisResults');
  if(!q.plate&&!q.vin&&!q.fio){toast('Введите госномер, VIN или ФИО владельца','error');return;}
  document.getElementById('fisDetail').innerHTML='';
  box.innerHTML='<div style="text-align:center;padding:22px;"><i class="fas fa-circle-notch fa-spin" style="font-size:24px;color:var(--primary);"></i><div style="font-size:12px;margin-top:8px;">Запрос к ФИС ГИБДД-М...</div></div>';
  setTimeout(()=>{
    const res=CAFAP_DB.fis.search(q);
    logEvent('fis_query',{action:'search',plate:q.plate||null,vin:q.vin||null,fio:q.fio||null,found:res.length});
    if(!res.length){box.innerHTML='<div style="text-align:center;padding:22px;"><i class="fas fa-search-minus" style="font-size:26px;color:var(--text3);"></i><div style="font-size:13px;font-weight:600;margin-top:6px;">Записей не найдено</div><div style="font-size:11px;color:var(--text3);">Проверьте написание (буквы номера — кириллицей)</div></div>';return;}
    box.innerHTML=`<div style="font-size:11px;color:var(--text2);margin-bottom:6px;">Найдено: <b>${res.length}</b>${res.length>=25?' (показаны первые 25)':''}. Нажмите на строку для карточки.</div>
      <div style="max-height:230px;overflow-y:auto;border:1px solid var(--border2);border-radius:7px;"><table class="data-table" style="font-size:11px;"><thead><tr><th>Госномер</th><th>ТС</th><th>Владелец</th><th>Признаки</th></tr></thead><tbody>
      ${res.map(c=>`<tr style="cursor:pointer;" onclick="s1_fisDetail('${c.vehicle.id}')"><td><span class="plate" style="font-size:11px;">${c.vehicle.plate}</span></td><td>${c.vehicle.make} ${c.vehicle.model}, ${c.vehicle.color}, ${c.vehicle.year}</td><td>${CAFAP_DB.fis.shortName(c.owner)}</td><td>${s1_fisFlags(c)}</td></tr>`).join('')}
      </tbody></table></div>`;
    if(res.length===1)s1_fisDetail(res[0].vehicle.id);
  },600);
}
function s1_fisDetail(vid){
  const v=CAFAP_DB.fis.table('vehicles').find(x=>x.id===vid); if(!v)return;
  const c=CAFAP_DB.fis.card(v), o=c.owner, L=c.license, ov=v.osago;
  const row=(k,val,col)=>`<div class="owner-field"><span class="owner-label">${k}</span><span class="owner-val" style="${col?'color:'+col+';':''}">${val}</span></div>`;
  const licSt={valid:'действует',expired:'истёк срок',deprived:'лишён права управления',suspended:'приостановлено'};
  document.getElementById('fisDetail').innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px;">
    <div class="card"><div class="card-hdr"><div class="card-title"><i class="fas fa-car"></i>Транспортное средство</div></div><div class="card-body" style="padding:8px 12px;"><div class="owner-card">
      <div style="font-size:13px;font-weight:800;margin-bottom:6px;"><span class="plate" style="font-size:11px;">${v.plate}</span> ${v.make} ${v.model}</div>
      ${row('VIN','<span class="mono" style="font-size:10.5px;">'+v.vin+'</span>')}${row('Год / цвет',v.year+' / '+v.color)}${row('СТС / ПТС','<span class="mono" style="font-size:10.5px;">'+v.sts+' / '+v.pts+'</span>')}
      ${row('Регистрация',v.regDate+' · '+({registered:'на учёте',suspended:'приостановлена',removed:'снято с учёта'})[v.regStatus],v.regStatus==='registered'?'':'var(--accent-red)')}
      ${row('ОСАГО',ov.status==='none'?'отсутствует':(ov.insurer+', '+ov.policy+' · '+(ov.status==='valid'?'до ':'истёк ')+ov.until),ov.status==='valid'?'var(--success)':'var(--accent-red)')}
      ${row('Техосмотр',v.techInspectionUntil?'до '+v.techInspectionUntil:'не требуется')}
      ${row('В розыске',c.wanted?('ДА — '+c.wanted.reason+' ('+c.wanted.id+')'):'нет',c.wanted?'var(--accent-red)':'var(--success)')}
      ${row('Ограничения',c.restrictions.length?c.restrictions.map(r=>r.type+' — '+r.authority+', '+r.basis).join('<br>'):'нет',c.restrictions.length?'var(--accent-red)':'var(--success)')}
    </div></div></div>
    <div class="card"><div class="card-hdr"><div class="card-title"><i class="fas fa-user"></i>Владелец</div></div><div class="card-body" style="padding:8px 12px;"><div class="owner-card">
      <div style="font-size:13px;font-weight:800;margin-bottom:6px;">${CAFAP_DB.fis.fullName(o)}</div>
      ${o.kind==='person'?row('Дата рождения',o.born)+row('Паспорт','<span class="mono">'+o.passport+'</span>'):row('Тип','юридическое лицо / ИП')}${row('ИНН','<span class="mono">'+o.inn+'</span>')}${row('Адрес',o.addr+', '+o.zip)}${row('Телефон',o.phone)}
      ${o.kind==='person'?row('Водит. удостоверение',L?(L.number+' · кат. '+L.categories.join(',')+' · до '+L.expires+' · '+licSt[L.status]+(L.depriveUntil?' (до '+L.depriveUntil+', ст.'+L.depriveArticle+')':'')):'не найдено',L&&L.status==='valid'?'var(--success)':'var(--accent-red)'):''}
      ${row('Другие ТС владельца',c.ownerVehicles.filter(x=>x.id!==v.id).map(x=>x.plate).slice(0,6).join(', ')||'—')}
    </div></div></div></div>`;
  logEvent('fis_query',{action:'card',plate:v.plate});
}
/* ============================================================
   NAVIGATION HELPERS
   ============================================================ */
function s1_goToStage2(){
  toast('Переход к Этапу 2: Обработка нарушений и OCR-верификация...','info');
  setTimeout(()=>{switchStage(2);},1200);
}
function s1_navStage2(sec){toast(`Этап 2 — ${sec}: открывается...`,'info');setTimeout(()=>{switchStage(2);},1000);}

/* ============================================================
   LOGOUT
   ============================================================ */
function doLogout(){
  if(confirm('Завершить сессию оператора?')){
    localStorage.removeItem('cafap_s');
    showScreen('loginScreen');
    S.session={};
  }
}

/* ============================================================
   SCREENS
   ============================================================ */

/* ============================================================
   TOAST SYSTEM
   ============================================================ */
function toast(msg,type='info'){
  logEvent('notification',{message:msg,level:type});
  const box=document.getElementById('toastBox');
  const icons={info:'fa-info-circle',success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle'};
  const colors={info:'#1565C0',success:'#2E7D32',error:'#C62828',warning:'#F57C00'};
  const d=document.createElement('div');
  d.className=`toast ${type}`;
  d.innerHTML=`<i class="fas ${icons[type]||icons.info}" style="color:${colors[type]||colors.info};flex-shrink:0;font-size:14px;"></i><span>${msg}</span>`;
  box.appendChild(d);
  setTimeout(()=>{d.style.transition='opacity .3s';d.style.opacity='0';setTimeout(()=>d.remove(),300);},3500);
}

/* ============================================================
   QUEST SYSTEM (Cisco Packet Tracer style)
   ============================================================ */
const QSTEPS=[
  {n:1,title:'Авторизация в системе',text:'Выберите роль <strong>«Оператор ЦАФАП»</strong>, укажите <strong>регион 77 — г. Москва</strong> и нажмите <strong>«Войти в систему»</strong>.',hint:'Оператор — базовая роль. Не имеет доступа к персональным данным до подтверждения инспектором.',done:true},
  {n:2,title:'Изучение статистики дашборда',text:'Ознакомьтесь с <strong>панелью пяти ключевых показателей</strong> (нарушений, очередь, обработано, неоплаченных, камер онлайн) и нажмите «Далее».',hint:'Эти показатели обновляются в реальном времени. Очередь — нарушения, ожидающие OCR-верификации оператором.',done:false},
  {n:3,title:'Проверка статуса камер ФВФ',text:'Откройте раздел <strong>«Камеры ФВФ»</strong> в левом меню. Найдите и запомните адреса offline-камер.',hint:'ФВФ = Фото-Видео-Фиксация. Две камеры offline — CAM-077-015 (Ленинградское ш.) и CAM-077-016 (Калужское ш.).',done:false},
  {n:4,title:'Просмотр журнала аудита',text:'Откройте <strong>«Журнал аудита»</strong> в боковом меню. Найдите запись с результатом «Отказано» (denied).',hint:'Аудит — неизменяемый журнал всех действий операторов. Запись с отказом: ivanov_op пытался получить доступ к персональным данным.',done:false},
  {n:5,title:'Работа с очередью нарушений',text:'В таблице <strong>«Входящая очередь»</strong> нажмите кнопку 👁 (просмотр) на любом деле со статусом «Новое».',hint:'Статус «Новое» означает, что нарушение поступило с камеры, но ещё не прошло OCR-верификацию оператором.',done:false},
  {n:6,title:'Использование поиска',text:'Нажмите <strong>«Поиск дела»</strong> и найдите дело по государственному номеру <strong>О917ММ177</strong>.',hint:'Поиск работает по номеру дела, г/н ТС и ФИО владельца. Найденное дело можно сразу открыть для обработки.',done:false},
  {n:7,title:'Запрос к ФИС ГИБДД-М',text:'Нажмите кнопку <strong>«Запрос ФИС ГИБДД-М»</strong> в разделе быстрых действий.',hint:'ФИС ГИБДД-М — Федеральная информационная система ГИБДД. Используется для поиска данных о владельцах ТС.',done:false},
  {n:8,title:'Изучение системных уведомлений',text:'Ознакомьтесь с <strong>тремя активными уведомлениями</strong> в правой панели. Какое из них критическое?',hint:'Критическое уведомление (красная метка): Камера CAM-077-015 OFFLINE. Требует немедленного реагирования.',done:false},
  {n:9,title:'Проверка статуса подсистем',text:'Найдите в правой панели подсистему со статусом <strong>«ЗАДЕРЖКА»</strong> и запомните её название.',hint:'ФССП API работает медленно. Это может задержать автоматическую передачу просроченных штрафов.',done:false},
  {n:10,title:'Анализ ленты активности',text:'Изучите <strong>ленту активности</strong> в правой панели. Найдите два типа событий: «Оплата штрафа» и «Передача в ФССП».',hint:'Лента обновляется в реальном времени. Отражает ключевые события: новые нарушения, оплаты, передачи, ошибки.',done:false},
  {n:11,title:'Фильтрация нарушений',text:'В таблице нарушений примените фильтр <strong>«Превышение скорости»</strong> и посчитайте количество таких дел.',hint:'Ст. 12.9 КоАП — превышение скорости. Самый распространённый тип нарушений, фиксируемых камерами.',done:false},
  {n:12,title:'Переход к Этапу 2',text:'Вы готовы к обработке нарушений! Нажмите <strong>«Этап 2: Нарушения»</strong> в верхней навигации или кнопку «OCR-верификация».',hint:'В Этапе 2 вы научитесь: подтверждать госномера, искать владельцев ТС, создавать административные дела.',done:false}
];

const HINTS_DATA=[
  {t:'Что такое ЦАФАП?',txt:'Центр автоматизированной фиксации административных правонарушений — подразделение ГИБДД МВД России, обрабатывающее данные с дорожных камер ФВФ.'},
  {t:'Роли пользователей',txt:'Оператор: OCR без персданных. Инспектор: полный доступ, подпись ЭЦП. Администратор: управление системой. Аналитик: только чтение, отчёты.'},
  {t:'Жизненный цикл нарушения',txt:'Камера → OCR → Верификация → Поиск владельца → Постановление → ЭЦП → Печать → Почта → Оплата / Эскалация → ФССП → Архив.'},
  {t:'Статьи КоАП',txt:'12.9 — превышение скорости. 12.12 — проезд на красный. 12.17 — выделенная полоса. 12.15.4 — встречка. 20.25 — неуплата штрафа (двойной размер).'}
];

const GLOSSARY=[
  {t:'ЦАФАП',d:'Центр автоматизированной фиксации административных правонарушений'},
  {t:'OCR',d:'Optical Character Recognition — автоматическое распознавание госномеров камерой'},
  {t:'ЭЦП',d:'Электронная цифровая подпись должностного лица, заверяющая постановление'},
  {t:'ФИС ГИБДД-М',d:'Федеральная информационная система ГИБДД — единая база данных'},
  {t:'РЭО ГИБДД',d:'Регистрационно-экзаменационный отдел — база владельцев ТС'},
  {t:'ФВФ',d:'Фото-видеофиксация — дорожные камеры автоматического режима работы'},
  {t:'ФССП',d:'Федеральная служба судебных приставов — принудительное взыскание'},
  {t:'КоАП',d:'Кодекс Российской Федерации об административных правонарушениях'},
  {t:'АПН',d:'Административное правонарушение — нарушение ПДД, зафиксированное камерой'},
  {t:'НСИ',d:'Нормативно-справочная информация — справочники и классификаторы системы'},
  {t:'ГИС ГМП',d:'Государственная информационная система о государственных платежах'},
  {t:'ЛОВД',d:'Линейный отдел внутренних дел на транспорте'}
];

function s1_initQuest(){
  SQ.done=[0];SQ.step=1;
  if(!window._s1q0){window._s1q0=true;logEvent('quest_step',{step:0,title:QSTEPS[0]?.title||'',total:QSTEPS.length});}
  s1_updateQuestUI();
  s1_renderInstContent();
}
function s1_markQuest(idx){
  if(!SQ.done.includes(idx)){
    SQ.done.push(idx);
    if(QSTEPS[idx])QSTEPS[idx].done=true;
    s1_updateQuestUI();
    logEvent('quest_step',{step:idx,title:QSTEPS[idx]?.title||'',total:QSTEPS.length});
    toast(`✅ Задание ${idx+1} выполнено: ${QSTEPS[idx]?.title||''}!`,'success');
  }
}
function s1_nextQuest(){
  if(SQ.step<QSTEPS.length-1){
    s1_markQuest(SQ.step);
    SQ.step++;
    s1_updateQuestUI();
  } else {
    toast('🎓 Этап 1 пройден! Переходите к Этапу 2 — Обработка нарушений.','success');
    s1_markQuest(SQ.step);
  }
}
function s1_restartQuest(){
  SQ.done=[];SQ.step=0;
  QSTEPS.forEach(s=>s.done=false);
  s1_initQuest();
  toast('Квест перезапущен','info');
}
function s1_updateQuestUI(){
  const pct=Math.round((SQ.done.length/SQ.total)*100);
  const el=document.getElementById('questPct');if(el)el.textContent=pct+'%';
  const pf=document.getElementById('instProgFill');if(pf)pf.style.width=pct+'%';
  const pt=document.getElementById('instProgTxt');if(pt)pt.textContent=`${SQ.done.length}/${SQ.total} шагов`;
  s1_renderInstContent();
}
function s1_switchInstTab(el,tab){
  document.querySelectorAll('.inst-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');SPA_STATE.instTab=tab;s1_renderInstContent();
}
function s1_renderInstContent(){
  const body=document.getElementById('instBody');if(!body)return;
  const tab=SPA_STATE.instTab;
  if(tab==='mission'){
    const cur=SQ.step;
    body.innerHTML=`
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="flex:1;">
          <div style="font-size:11.5px;font-weight:700;color:var(--primary);margin-bottom:8px;">📋 ЭТАП 1: Авторизация и знакомство с дашбордом ЦАФАП</div>
          <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;">
            ${QSTEPS.map((s,i)=>{
              const done=SQ.done.includes(i);const active=cur===i;
              return`<div style="text-align:center;flex-shrink:0;width:64px;">
                <div class="qs-num ${done?'qn-done':active?'qn-active':'qn-pend'}" style="margin:0 auto 4px;">${done?'✓':s.n}</div>
                <div style="font-size:9px;color:${done?'var(--success)':active?'var(--primary)':'var(--text3)'};line-height:1.2;">${s.title.split(' ').slice(0,3).join(' ')}</div>
              </div>`;
            }).join('')}
          </div>
          ${cur<QSTEPS.length?`<div style="margin-top:8px;padding:8px 10px;background:var(--primary-xs);border-radius:6px;border-left:3px solid var(--primary);">
            <div style="font-size:10.5px;font-weight:700;color:var(--primary);margin-bottom:3px;">▶ Текущее задание (шаг ${cur+1}/${QSTEPS.length}):</div>
            <div style="font-size:11px;color:var(--text);">${QSTEPS[cur]?.text||'Все задания выполнены!'}</div>
          </div>`:'<div style="padding:8px;background:#E8F5E9;border-radius:6px;font-size:11px;color:var(--success);font-weight:700;">🎓 Все задания Этапа 1 выполнены! Переходите к Этапу 2.</div>'}
        </div>
      </div>`;
  } else if(tab==='hints'){
    body.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${HINTS_DATA.map(h=>`<div style="flex:1;min-width:180px;padding:8px;background:#F8FAFF;border-radius:6px;border:1px solid var(--border2);">
        <div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:3px;">💡 ${h.t}</div>
        <div style="font-size:10.5px;color:var(--text2);line-height:1.4;">${h.txt}</div>
      </div>`).join('')}
    </div>`;
  } else if(tab==='progress'){
    const pct=Math.round((SQ.done.length/SQ.total)*100);
    body.innerHTML=`<div style="display:flex;gap:14px;align-items:center;">
      <div style="text-align:center;padding:10px 18px;background:var(--primary-xs);border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:28px;font-weight:800;color:var(--primary);font-family:'Courier New',monospace;">${pct}%</div>
        <div style="font-size:10px;color:var(--text2);">Этап 1</div>
      </div>
      <div style="flex:1;">
        <div style="font-size:11px;color:var(--text2);margin-bottom:5px;">Прогресс Этапа 1 (${QSTEPS.length} заданий):</div>
        <div class="prog-bar" style="height:10px;margin-bottom:7px;"><div class="prog-fill" style="width:${pct}%;"></div></div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <span style="font-size:10px;background:#E8F5E9;color:var(--success);padding:2px 8px;border-radius:10px;">✓ Выполнено: ${SQ.done.length}</span>
          <span style="font-size:10px;background:var(--primary-xs);color:var(--primary);padding:2px 8px;border-radius:10px;">▶ Осталось: ${SQ.total-SQ.done.length}</span>
          <span style="font-size:10px;background:#FFF3E0;color:var(--accent);padding:2px 8px;border-radius:10px;">Этап 1 из 6</span>
        </div>
      </div>
      <div style="font-size:10.5px;color:var(--text2);max-width:150px;">
        <div style="font-weight:700;margin-bottom:4px;">Этапы обучения:</div>
        <div>1. Дашборд ← вы здесь</div><div>2. Нарушения / OCR</div>
        <div style="color:var(--text3);">3. Постановления</div>
        <div style="color:var(--text3);">4. Почта / ФССП</div>
        <div style="color:var(--text3);">5. Аналитика</div>
        <div style="color:var(--text3);">6. Администрирование</div>
      </div>
    </div>`;
  } else if(tab==='glossary'){
    body.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:5px;">
      ${GLOSSARY.map(g=>`<div style="padding:4px 9px;background:#F8FAFF;border-radius:4px;border:1px solid var(--border2);">
        <span style="font-size:11px;font-weight:700;color:var(--primary);">${g.t}</span>
        <span style="font-size:10px;color:var(--text2);margin-left:4px;">— ${g.d}</span>
      </div>`).join('')}
    </div>`;
  }
}

function s1_toggleInst(){
  SPA_STATE.instCollapsed=!SPA_STATE.instCollapsed;
  const c=document.getElementById('instContent');
  const ico=document.getElementById('instTogIco');
  const panel=document.getElementById('instPanel');
  if(SPA_STATE.instCollapsed){c.style.display='none';panel.style.height='42px';ico.className='fas fa-chevron-up';}
  else{c.style.display='';panel.style.height='var(--inst)';ico.className='fas fa-chevron-down';}
}

/* ============================================================
   STARTUP
   ============================================================ */
window.addEventListener('load',()=>{
  // Восстанавливаем сессию из localStorage (хранилище может быть недоступно — тогда просто показываем вход)
  const _rm=()=>{try{localStorage.removeItem('cafap_s');}catch(e){}};
  let saved=null;try{saved=localStorage.getItem('cafap_s');}catch(e){}
  // Токен имеет приоритет: сессия другого курсанта не восстанавливается
  if(saved&&window.IdentityToken&&IdentityToken.isPresent()){
    try{const _p=JSON.parse(saved);const _sf=(_p&&_p.cadet&&_p.cadet.fio)||'';if(_sf!==IdentityToken.getName()){saved=null;_rm();}}catch(e){saved=null;_rm();}
  }
  if(saved){
    try{
      const parsed=JSON.parse(saved);
      // Поддержка старого формата (просто session) и нового ({session,cadet})
      if(parsed&&parsed.session){
        SPA_STATE.session=parsed.session;
        SPA_STATE.cadet=parsed.cadet||{fio:'',platoon:''};
      }else{
        SPA_STATE.session=parsed;
      }
      SPA_STATE.session.startTime=new Date(SPA_STATE.session.startTime||Date.now());
      if(!SPA_STATE.cadet||!SPA_STATE.cadet.fio||!SPA_STATE.cadet.platoon){
        // Без данных курсанта отчёт сформировать нельзя — просим войти заново
        _rm();
        showScreen('loginScreen');
        document.getElementById('roleSelect').value='operator';
        document.getElementById('regSelect').value='77';
        onRoleChange();
        return;
      }
      _simStartedAt=SPA_STATE.session.startTime;
      showScreen('spaApp');
      initSPAApp();
      return;
    }catch(e){_rm();}
  }
  // Предзаполняем форму
  showScreen('loginScreen');
  document.getElementById('roleSelect').value='operator';
  document.getElementById('regSelect').value='77';
  onRoleChange();
});



function s1_setSection(view, navEl) {
  const mc = document.getElementById('mainContent1');
  if (!mc) return;
  
  // Build layout skeleton once
  if (!mc._layoutBuilt) {
    mc._layoutBuilt = true;
    mc.style.cssText = 'flex:1;display:flex;overflow:hidden;width:100%;height:100%;';
    mc.innerHTML = `
      <div class="content-area" style="flex:1;overflow-y:auto;padding:14px;display:flex;gap:13px;">
        <div class="col-center" id="colCenter" style="flex:1;display:flex;flex-direction:column;gap:13px;min-width:0;"></div>
        <div class="col-right" style="width:275px;flex-shrink:0;display:flex;flex-direction:column;gap:13px;">
          <div class="card">
            <div class="card-hdr"><div class="card-title"><i class="fas fa-bell"></i>Уведомления</div><span style="font-size:11px;color:var(--primary);cursor:pointer;">Все →</span></div>
            <div class="card-body" style="padding:8px 12px;">
              <div class="alert-item ai-crit"><i class="fas fa-times-circle" style="color:var(--accent-red);flex-shrink:0;"></i><div><div class="ai-title">Камера САМ-077-015 OFFLINE</div><div style="font-size:10.5px;color:var(--text2);">Ленинградское ш., 45 — нет связи 14 мин.</div></div></div>
              <div class="alert-item ai-warn"><i class="fas fa-exclamation-triangle" style="color:var(--accent);flex-shrink:0;"></i><div><div class="ai-title">Очередь ЭЦП переполнена</div><div style="font-size:10.5px;color:var(--text2);">Требуется проверка подписей</div></div></div>
              <div class="alert-item ai-info"><i class="fas fa-info-circle" style="color:var(--primary);flex-shrink:0;"></i><div><div class="ai-title">Обновление НСИ завершено</div><div style="font-size:10.5px;color:var(--text2);">Справочники синхронизированы</div></div></div>
            </div>
          </div>
          <div class="card">
            <div class="card-hdr"><div class="card-title"><i class="fas fa-server"></i>Статус подсистем</div></div>
            <div class="card-body" style="padding:8px 12px;">
              ${[['ФИС ГИБДД-М','online'],['РЭО ГИБДД','online'],['Почта России API','online'],['ГИС ГМП (платежи)','online'],['ФССП API','warn']].map(([name,st])=>`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid var(--border2);font-size:11.5px;">
                <span>${name}</span>
                <span class="sbadge ${st==='online'?'sb-done':st==='warn'?'sb-proc':'sb-err'}" style="font-size:9.5px;">${st==='online'?'● ONLINE':st==='warn'?'● ЗАДЕРЖКА':'● OFFLINE'}</span>
              </div>`).join('')}
            </div>
          </div>
          <div class="card" style="flex:1;min-height:0;">
            <div class="card-hdr"><div class="card-title"><i class="fas fa-stream"></i>Лента активности<span class="live-ind" style="margin-left:6px;">LIVE</span></div></div>
            <div class="card-body" style="padding:6px 10px;overflow-y:auto;max-height:300px;" id="feedBody"></div>
          </div>
        </div>
      </div>`;
    // Init data
    if (!allViolations.length) allViolations = genViolations(247);
    s1_renderFeed();
    s1_startLive();
    s1_initQuest();
  }
  
  // Update nav active state
  document.querySelectorAll('#mainContent1 .nav-item').forEach(n => n.classList.remove('active'));
  if (navEl) navEl.classList.add('active');
  
  // Route to view
  const views = {
    dashboard: () => { s1_renderDash(); s1_markQuest(1); },
    queue: s1_renderQueue,
    cameras: s1_renderCameras,
    audit: s1_renderAudit,
  };
  if (views[view]) views[view]();
  else s1_renderDash();
}
window.s1_setSection = s1_setSection;

/* ------ Stage 1 exports ------ */
  window.s1_renderViolTable = (typeof s1_renderViolTable!=="undefined") ? s1_renderViolTable : window.s1_renderViolTable;
  window.s1_filterTable = (typeof s1_filterTable!=="undefined") ? s1_filterTable : window.s1_filterTable;
  window.s1_openCase = (typeof s1_openCase!=="undefined") ? s1_openCase : window.s1_openCase;
  window.s1_renderFeed = (typeof s1_renderFeed!=="undefined") ? s1_renderFeed : window.s1_renderFeed;
  window.s1_startLive = (typeof s1_startLive!=="undefined") ? s1_startLive : window.s1_startLive;
  window.s1_renderDash = (typeof s1_renderDash!=="undefined") ? s1_renderDash : window.s1_renderDash;
  window.s1_renderCameras = (typeof s1_renderCameras!=="undefined") ? s1_renderCameras : window.s1_renderCameras;
  window.s1_camDetail = (typeof s1_camDetail!=="undefined") ? s1_camDetail : window.s1_camDetail;
  window.s1_renderAudit = (typeof s1_renderAudit!=="undefined") ? s1_renderAudit : window.s1_renderAudit;
  window.s1_renderQueue = (typeof s1_renderQueue!=="undefined") ? s1_renderQueue : window.s1_renderQueue;
  window.s1_openSearchModal = (typeof s1_openSearchModal!=="undefined") ? s1_openSearchModal : window.s1_openSearchModal;
  window.s1_doSearch = (typeof s1_doSearch!=="undefined") ? s1_doSearch : window.s1_doSearch;
  window.s1_queryFIS = (typeof s1_queryFIS!=="undefined") ? s1_queryFIS : window.s1_queryFIS;
  window.s1_fisSearch=s1_fisSearch; window.s1_fisDetail=s1_fisDetail; window.s1_fisExample=s1_fisExample;
  window.s1_goToStage2 = (typeof s1_goToStage2!=="undefined") ? s1_goToStage2 : window.s1_goToStage2;
  window.s1_navStage2 = (typeof s1_navStage2!=="undefined") ? s1_navStage2 : window.s1_navStage2;
  window.s1_navStage3 = (typeof s1_navStage3!=="undefined") ? s1_navStage3 : window.s1_navStage3;
  window.s1_navStage4 = (typeof s1_navStage4!=="undefined") ? s1_navStage4 : window.s1_navStage4;
  window.s1_navStage5 = (typeof s1_navStage5!=="undefined") ? s1_navStage5 : window.s1_navStage5;
  window.s1_navStage6 = (typeof s1_navStage6!=="undefined") ? s1_navStage6 : window.s1_navStage6;
  window.s1_initQuest = (typeof s1_initQuest!=="undefined") ? s1_initQuest : window.s1_initQuest;
  window.s1_markQuest = (typeof s1_markQuest!=="undefined") ? s1_markQuest : window.s1_markQuest;
  window.s1_nextQuest = (typeof s1_nextQuest!=="undefined") ? s1_nextQuest : window.s1_nextQuest;
  window.s1_restartQuest = (typeof s1_restartQuest!=="undefined") ? s1_restartQuest : window.s1_restartQuest;
  window.s1_updateQuestUI = (typeof s1_updateQuestUI!=="undefined") ? s1_updateQuestUI : window.s1_updateQuestUI;
  window.s1_switchInstTab = (typeof s1_switchInstTab!=="undefined") ? s1_switchInstTab : window.s1_switchInstTab;
  window.s1_renderInstContent = (typeof s1_renderInstContent!=="undefined") ? s1_renderInstContent : window.s1_renderInstContent;
  window.s1_toggleInst = (typeof s1_toggleInst!=="undefined") ? s1_toggleInst : window.s1_toggleInst;
})(); /* end Stage 1 IIFE */
/* initStage1 */
function initStage1(){if(typeof s1_setSection==="function")s1_setSection("dashboard",null);}
