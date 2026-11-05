;(function() {
/* ------ Stage 5 scope start ------ */
/* ================================================================
   ЭТАП 5 — КОД (namespace: s5_)
   ================================================================ */

/* ============================================================
   ДАННЫЕ
   ============================================================ */
const VTYPES=[
  {code:'12.9.2',name:'Превышение скорости 20-40',fine:500},
  {code:'12.9.3',name:'Превышение скорости 40-60',fine:1000},
  {code:'12.9.4',name:'Превышение скорости 60-80',fine:2000},
  {code:'12.9.5',name:'Превышение скорости >80',fine:5000},
  {code:'12.12.1',name:'Проезд на красный',fine:1000},
  {code:'12.17.2',name:'Выделенная полоса',fine:3000},
  {code:'12.19.2',name:'Нарушение стоянки',fine:1500},
  {code:'12.15.4',name:'Встречная полоса',fine:5000}
];
/* Комплексы ФВФ — база data/fvf_complexes.js */
const CAMERAS_ALL=CAFAP_DB.fvf.region('77').map(c=>({id:c.id,addr:c.addr,dist:c.district,st:c.status,viol:c.violations24h}));
/* Реестр розыска — таблица wanted базы ФИС ГИБДД-М (data/fis_gibdd_m.js) */
const WANTED_LIST=CAFAP_DB.fis.wantedRegistry();
const OPERATORS=[
  {name:'Иванов И.В.',role:'Оператор',processed:89,errors:2,avgTime:18,efficiency:97},
  {name:'Смирнова Т.А.',role:'Оператор',processed:76,errors:1,avgTime:21,efficiency:99},
  {name:'Козлов А.Р.',role:'Оператор',processed:102,errors:4,avgTime:16,efficiency:96},
  {name:'Новиков Д.С.',role:'Оператор',processed:65,errors:0,avgTime:24,efficiency:100},
  {name:'Фёдорова О.К.',role:'Оператор',processed:88,errors:3,avgTime:19,efficiency:97},
  {name:'Петров И.С.',role:'Инспектор',processed:187,errors:0,avgTime:8,efficiency:100},
  {name:'Захаров В.М.',role:'Инспектор',processed:142,errors:1,avgTime:10,efficiency:99},
];
const INCIDENTS=[
  {id:'ИНЦ-2026-0089',sev:'critical',title:'Камера CAM-077-015 OFFLINE',desc:'Камера на Ленинградском ш. не отвечает более 40 минут. Последний снимок в 14:28.',time:'14:28',status:'open',action:'Технический выезд запланирован'},
  {id:'ИНЦ-2026-0088',sev:'warning',title:'Задержка ответа ФССП API',desc:'Среднее время ответа ФССП API превышает 5 секунд. Возможны задержки передачи дел.',time:'13:55',status:'monitoring',action:'Ожидание восстановления'},
  {id:'ИНЦ-2026-0087',sev:'warning',title:'Очередь ЭЦП: 23 документа',desc:'Количество документов в очереди подписания превысило норматив (20).',time:'13:40',status:'open',action:'Направлен инспектор'},
  {id:'ИНЦ-2026-0086',sev:'info',title:'Плановое ТО камеры CAM-077-011',desc:'Камера на Профсоюзной ул. переведена в режим технического обслуживания.',time:'12:00',status:'planned',action:'Завершение ТО в 16:00'},
  {id:'ИНЦ-2026-0085',sev:'ok',title:'Восстановлена камера CAM-077-009',desc:'После кратковременного сбоя камера на Нагатинской наб. возобновила работу.',time:'11:30',status:'resolved',action:'Закрыт автоматически'},
];
const DUPLICATES=[
  {id:'ДУБ-2026-0031',plate:'А177МС77',camA:'CAM-077-001',timeA:'10:14:22',camB:'CAM-077-004',timeB:'10:14:45',dist:25,speed:57000,status:'suspicious'},
  {id:'ДУБ-2026-0029',plate:'М568РО77',camA:'CAM-077-002',timeA:'09:33:11',camB:'CAM-077-008',timeB:'09:33:28',dist:18,speed:38000,status:'suspicious'},
  {id:'ДУБ-2026-0027',plate:'О917ММ177',camA:'CAM-077-005',timeA:'08:45:00',camB:'CAM-077-007',timeB:'08:45:03',dist:12,speed:14400,status:'resolved'},
];

const S5T={instTab:'mission',instCollapsed:false,quest:SPA_STATE.quest[5],session:{startTime:new Date()}};
let liveInterval=null;

/* S5: load handled by SPA */

function s5_startLive(){
  liveInterval=setInterval(()=>{
    const vpm=(3.5+Math.random()*2).toFixed(1);
    const el=document.getElementById('sbVpm');if(el)el.textContent=vpm;
    const ocrQ=Math.floor(Math.random()*15)+2;
    const el2=document.getElementById('sbOcrQ');if(el2)el2.textContent=ocrQ;
  },4000);
}
function s5_setSection(sec,navEl){
  document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active'));
  if(navEl)navEl.classList.add('active');
  const mc=document.getElementById('mainContent5');
  const R={analytics:s5_renderAnalytics,reports:s5_renderReports,heatmap:s5_renderHeatmap,kpi:s5_renderKPI,monitor:s5_renderMonitor,infra:s5_renderInfra,cameras:s5_renderCamerasMap,incidents:s5_renderIncidents,wanted:s5_renderWanted,duplicates:s5_renderDuplicates};
  (R[sec]||s5_renderAnalytics)(mc);
}
function closeModal(id){document.getElementById(id).style.display='none';}
function rnd(arr){return arr[Math.floor(Math.random()*arr.length)];}
function rndInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}

/* ============================================================
   АНАЛИТИЧЕСКИЙ ЦЕНТР
   ============================================================ */
function s5_renderAnalytics(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-chart-bar" style="color:var(--primary);"></i>Аналитический центр ЦАФАП <span class="live-ind" style="margin-left:5px;">LIVE</span></h2>
      <div style="display:flex;gap:6px;">
        <select style="padding:5px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;"><option>Сегодня</option><option>Неделя</option><option>Месяц</option><option>Квартал</option></select>
        <select style="padding:5px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;"><option>Все районы</option><option>ЦАО</option><option>САО</option><option>ЗАО</option><option>ЮАО</option></select>
        <button class="btn btn-s btn-sm" onclick="s5_exportAnalytics()"><i class="fas fa-download"></i> Экспорт</button>
      </div>
    </div>

    <!-- KPI карты -->
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;">
      ${[
        {lbl:'Нарушений сегодня',val:'2 847',delta:'+12%',c:'primary',ico:'fa-camera'},
        {lbl:'Обработано OCR',val:'2 641',delta:'92.8%',c:'success',ico:'fa-brain'},
        {lbl:'Постановлений',val:'2 534',delta:'95.9%',c:'teal',ico:'fa-file-alt'},
        {lbl:'Оплачено штрафов',val:'1 892',delta:'74.7%',c:'success',ico:'fa-ruble-sign'},
        {lbl:'Сумма взысканий',val:'3.2 млн ₽',delta:'+8%',c:'primary',ico:'fa-landmark'},
        {lbl:'Передано в ФССП',val:'47',delta:'+3',c:'purple',ico:'fa-university'}
      ].map(s=>`<div style="background:#fff;border:1px solid var(--border);border-radius:9px;padding:11px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--${s.c});"></div>
        <div style="font-size:18px;font-weight:800;font-family:'Courier New',monospace;color:var(--${s.c});">${s.val}</div>
        <div style="font-size:10.5px;color:var(--text2);font-weight:600;margin-bottom:1px;">${s.lbl}</div>
        <div style="font-size:10px;color:var(--success);">${s.delta}</div>
        <div style="position:absolute;top:8px;right:8px;font-size:20px;opacity:.07;"><i class="fas ${s.ico}"></i></div>
      </div>`).join('')}
    </div>

    <!-- Основные графики -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;">
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-chart-line"></i>Динамика нарушений (по часам)</div>
          <span style="font-size:11px;color:var(--text2);">Среднее: 237/ч</span>
        </div>
        <div class="card-body" style="padding:8px;"><div class="chart-box" style="position:relative;height:209px;"><canvas id="hourlyChart"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-chart-pie"></i>Типы нарушений</div></div>
        <div class="card-body" style="padding:8px;"><div class="chart-box" style="position:relative;height:209px;"><canvas id="typeChart"></canvas></div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-map-marked-alt"></i>По районам Москвы</div></div>
        <div class="card-body" style="padding:8px;"><div class="chart-box" style="position:relative;height:247px;"><canvas id="districtChart"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-ruble-sign"></i>Взыскания (по статьям)</div></div>
        <div class="card-body" style="padding:8px;"><div class="chart-box" style="position:relative;height:247px;"><canvas id="fineChart"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-clock"></i>Время обработки (мин.)</div></div>
        <div class="card-body" style="padding:8px;"><div class="chart-box" style="position:relative;height:247px;"><canvas id="timeChart"></canvas></div></div>
      </div>
    </div>
  </div>`;
  s5_markQuest(0);
  setTimeout(()=>{
    // Почасовой
    safeChart(document.getElementById('hourlyChart'),{type:'line',data:{
      labels:Array.from({length:24},(_,i)=>`${i}:00`),
      datasets:[
        {label:'Нарушений',data:Array.from({length:24},(_,i)=>i<6?rndInt(20,60):i<9?rndInt(100,200):i<12?rndInt(180,280):i<14?rndInt(150,220):i<18?rndInt(200,320):i<21?rndInt(150,250):rndInt(60,120)),borderColor:'#1565C0',backgroundColor:'rgba(21,101,192,.08)',fill:true,tension:.4,borderWidth:2,pointRadius:2},
        {label:'Обработано',data:Array.from({length:24},(_,i)=>i<6?rndInt(18,55):i<9?rndInt(90,185):i<12?rndInt(170,265):i<14?rndInt(140,210):i<18?rndInt(190,310):i<21?rndInt(140,240):rndInt(55,110)),borderColor:'#2E7D32',backgroundColor:'rgba(46,125,50,.05)',fill:true,tension:.4,borderWidth:1.5,pointRadius:2}
      ]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{size:10}}}},scales:{y:{beginAtZero:true,ticks:{font:{size:10}}},x:{ticks:{font:{size:9},maxRotation:0,maxTicksLimit:12}}}}});
    // Типы
    safeChart(document.getElementById('typeChart'),{type:'doughnut',data:{
      labels:VTYPES.map(v=>'ст.'+v.code),
      datasets:[{data:VTYPES.map(()=>rndInt(50,400)),backgroundColor:['#1565C0','#2E7D32','#F57C00','#C62828','#6A1B9A','#00695C','#0097A7','#880E4F'],borderWidth:2}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{font:{size:9},boxWidth:10}}}}});
    // Районы
    const dists=['ЦАО','САО','ЗАО','ЮАО','СВАО','ЮЗАО','ВАО','СЗАО'];
    safeChart(document.getElementById('districtChart'),{type:'bar',data:{
      labels:dists,
      datasets:[{data:dists.map(()=>rndInt(150,600)),backgroundColor:dists.map((_,i)=>`hsl(${210+i*15},70%,50%)`),borderRadius:4}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{font:{size:9}}},x:{ticks:{font:{size:9}}}}}});
    // Штрафы
    safeChart(document.getElementById('fineChart'),{type:'bar',data:{
      labels:VTYPES.slice(0,6).map(v=>'ст.'+v.code),
      datasets:[{label:'Сумма (тыс. ₽)',data:VTYPES.slice(0,6).map(v=>Math.round(v.fine*rndInt(50,300)/1000)),backgroundColor:'rgba(46,125,50,.2)',borderColor:'#2E7D32',borderWidth:1.5}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{font:{size:9}}},x:{ticks:{font:{size:9}}}}}});
    // Время
    safeChart(document.getElementById('timeChart'),{type:'line',data:{
      labels:['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
      datasets:[{label:'Ср. время (мин)',data:[22,19,24,18,21,17,20],borderColor:'#F57C00',backgroundColor:'rgba(245,124,0,.08)',fill:true,tension:.4,borderWidth:2,pointRadius:3}]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}});
  },100);
}
function s5_exportAnalytics(){s5_markQuest(1);toast('Аналитический отчёт экспортирован в XLSX','success');}

/* ============================================================
   ОТЧЁТЫ
   ============================================================ */
function s5_renderReports(mc){
  const reports=[
    {id:'ОТЧ-2026-0512',name:'Ежедневный отчёт ЦАФАП',period:'27.05.2026',type:'Оперативный',status:'ready',size:'2.4 MB'},
    {id:'ОТЧ-2026-0511',name:'Отчёт по взысканиям',period:'01-27.05.2026',type:'Финансовый',status:'ready',size:'1.8 MB'},
    {id:'ОТЧ-2026-0510',name:'Эффективность операторов',period:'Май 2026',type:'KPI',status:'ready',size:'0.9 MB'},
    {id:'ОТЧ-2026-0509',name:'Статистика камер ФВФ',period:'Май 2026',type:'Технический',status:'ready',size:'3.1 MB'},
    {id:'ОТЧ-2026-0508',name:'Отчёт по апелляциям',period:'Май 2026',type:'Правовой',status:'ready',size:'0.5 MB'},
    {id:'ОТЧ-2026-0507',name:'Передача материалов в ФССП',period:'Май 2026',type:'Исполнение',status:'ready',size:'1.2 MB'},
    {id:'ОТЧ-2026-0506',name:'Сводный региональный отчёт',period:'Q1 2026',type:'Федеральный',status:'generating',size:'—'},
    {id:'ОТЧ-2026-0505',name:'Анализ нарушений по районам',period:'Апрель 2026',type:'Аналитический',status:'ready',size:'4.2 MB'},
    {id:'ОТЧ-2026-0504',name:'Отчёт по розыску ТС',period:'Апрель 2026',type:'Оперативный',status:'ready',size:'0.7 MB'},
    {id:'ОТЧ-2026-0503',name:'Возвращённые письма',period:'Апрель 2026',type:'Почтовый',status:'ready',size:'0.3 MB'},
    {id:'ОТЧ-2026-0502',name:'Нарушения по времени суток',period:'Q1 2026',type:'Аналитический',status:'ready',size:'2.0 MB'},
    {id:'ОТЧ-2026-0501',name:'Федеральный сводный отчёт МВД',period:'Q4 2025',type:'Федеральный',status:'archived',size:'8.7 MB'},
  ];
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-file-chart-line" style="color:var(--primary);"></i>Центр отчётности</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-p" onclick="s5_generateReport()"><i class="fas fa-plus"></i> Сформировать отчёт</button>
        <button class="btn btn-s btn-sm"><i class="fas fa-clock"></i> Расписание</button>
      </div>
    </div>
    <!-- Быстрые отчёты -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-bolt"></i>Быстрые отчёты</div></div>
      <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;">
        ${['Ежедневный','За неделю','За месяц','Квартальный','Годовой'].map(r=>`<button class="btn btn-s btn-sm" onclick="s5_quickReport('${r}')"><i class="fas fa-file-excel"></i> ${r}</button>`).join('')}
        <button class="btn btn-s btn-sm" onclick="s5_quickReport('KPI операторов')"><i class="fas fa-users"></i> KPI операторов</button>
        <button class="btn btn-s btn-sm" onclick="s5_quickReport('Для МВД федеральный')"><i class="fas fa-landmark"></i> Для МВД (федеральный)</button>
        <button class="btn btn-s btn-sm" onclick="s5_quickReport('По камерам ФВФ')"><i class="fas fa-video"></i> По камерам ФВФ</button>
      </div>
    </div>
    <!-- Реестр отчётов -->
    <div class="card" style="flex:1;">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-folder"></i>Реестр сформированных отчётов</div>
        <input type="text" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;width:180px;" placeholder="🔍 Поиск...">
      </div>
      <div style="overflow-y:auto;">
        <table class="data-table">
          <thead><tr><th>№</th><th>Наименование отчёта</th><th>Период</th><th>Тип</th><th>Размер</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>${reports.map(r=>{
            const sbMap={ready:'sb-done',generating:'sb-proc',archived:'sb-closed'};
            const lblMap={ready:'Готов',generating:'Формируется...',archived:'Архив'};
            return`<tr>
              <td class="mono" style="font-size:10px;color:var(--text3);">${r.id}</td>
              <td style="font-size:12px;font-weight:600;">${r.name}</td>
              <td style="font-size:11px;">${r.period}</td>
              <td><span class="sbadge sb-new" style="font-size:9px;">${r.type}</span></td>
              <td class="mono" style="font-size:11px;">${r.size}</td>
              <td><span class="sbadge ${sbMap[r.status]}" style="font-size:9px;">${lblMap[r.status]}</span></td>
              <td><div style="display:flex;gap:3px;">
                ${r.status==='ready'?`<button class="btn btn-p btn-sm" onclick="s5_downloadReport('${r.id}')"><i class="fas fa-download"></i></button>`:''}
                <button class="btn btn-s btn-sm" onclick="s5_viewReport('${r.id}')"><i class="fas fa-eye"></i></button>
              </div></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
  s5_markQuest(2);
}
function s5_quickReport(type){s5_markQuest(2);toast(`Отчёт «${type}» формируется...`,'info');setTimeout(()=>toast(`Отчёт «${type}» готов к скачиванию`,'success'),2000);}
function s5_generateReport(){toast('Мастер создания отчёта открыт','info');}
function s5_downloadReport(id){s5_markQuest(2);toast(`Отчёт ${id} скачан`,'success');}
function s5_viewReport(id){toast(`Просмотр отчёта ${id}...`,'info');}

/* ============================================================
   ТЕПЛОВАЯ КАРТА
   ============================================================ */
function s5_renderHeatmap(mc){
  const hours=Array.from({length:24},(_,i)=>i);
  const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const data=days.map(()=>hours.map(h=>{
    const base=h<6?5:h<9?40:h<12?80:h<14?70:h<18?90:h<21?60:20;
    return base+rndInt(-15,25);
  }));
  const maxVal=Math.max(...data.flat());
  function heatColor(val){
    const pct=val/maxVal;
    if(pct<0.2)return`rgba(21,101,192,${0.1+pct*0.5})`;
    if(pct<0.5)return`rgba(245,124,0,${0.3+pct*0.5})`;
    return`rgba(198,40,40,${0.4+pct*0.6})`;
  }
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-fire" style="color:var(--accent-red);"></i>Тепловая карта нарушений</h2>
      <div style="display:flex;gap:6px;align-items:center;">
        <select style="padding:5px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;"><option>Все типы нарушений</option>${VTYPES.map(v=>`<option>ст.${v.code}</option>`).join('')}</select>
        <button class="btn btn-s btn-sm" onclick="toast('Экспорт тепловой карты...','info')"><i class="fas fa-download"></i></button>
      </div>
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-th"></i>Нарушения по дням недели и часам (последние 4 недели)</div>
        <div style="display:flex;align-items:center;gap:8px;font-size:11px;">
          <span style="background:rgba(21,101,192,.15);padding:2px 6px;border-radius:3px;">мало</span>
          <span style="background:rgba(245,124,0,.4);padding:2px 6px;border-radius:3px;">средне</span>
          <span style="background:rgba(198,40,40,.7);color:#fff;padding:2px 6px;border-radius:3px;">много</span>
        </div>
      </div>
      <div class="card-body">
        <div style="display:flex;gap:6px;">
          <!-- Метки дней -->
          <div style="display:flex;flex-direction:column;gap:3px;padding-top:20px;">
            ${days.map(d=>`<div style="height:28px;display:flex;align-items:center;font-size:11px;font-weight:600;color:var(--text2);width:24px;">${d}</div>`).join('')}
          </div>
          <!-- Сетка -->
          <div style="flex:1;">
            <div style="display:flex;gap:3px;margin-bottom:3px;">
              ${hours.map(h=>`<div style="flex:1;text-align:center;font-size:9px;color:var(--text3);">${h}</div>`).join('')}
            </div>
            ${days.map((d,di)=>`<div style="display:flex;gap:3px;margin-bottom:3px;">
              ${hours.map(h=>{const v=data[di][h];return`<div class="hm-cell" style="background:${heatColor(v)};" title="${d} ${h}:00 — ${v} нарушений" onclick="toast('${d} ${h}:00 — ${v} нарушений','info')">${v>60?v:''}</div>`;}).join('')}
            </div>`).join('')}
          </div>
        </div>
        <div style="margin-top:12px;font-size:11px;color:var(--text2);">
          <strong>Выводы:</strong> Пик нарушений — будние дни с 17:00 до 20:00 (вечерний час пик). Минимум — ранние утренние часы (3:00-6:00). Субботы и воскресенья — пик в 12:00-14:00.
        </div>
      </div>
    </div>

    <!-- Топ камер -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-trophy"></i>ТОП-10 камер по количеству фиксаций</div></div>
      <div class="card-body">
        ${CAMERAS_ALL.filter(c=>c.st==='online').sort((a,b)=>b.viol-a.viol).slice(0,8).map((c,i)=>{
          const pct=Math.round(c.viol/521*100);
          return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
            <span style="font-size:11px;font-weight:700;color:var(--text2);width:18px;text-align:right;">${i+1}</span>
            <span class="mono" style="font-size:10.5px;color:var(--primary);width:100px;flex-shrink:0;">${c.id}</span>
            <span style="font-size:11px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.addr}</span>
            <div style="flex:1;"><div class="prog-bar" style="height:6px;"><div class="prog-fill" style="width:${pct}%;background:${i<3?'var(--accent-red)':i<6?'var(--accent)':'var(--primary)'};"></div></div></div>
            <span class="mono" style="font-size:11px;font-weight:700;width:40px;text-align:right;">${c.viol}</span>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
  s5_markQuest(3);
}

/* ============================================================
   KPI ОПЕРАТОРОВ
   ============================================================ */
function s5_renderKPI(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-users" style="color:var(--primary);"></i>KPI операторов и инспекторов</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-s btn-sm" onclick="s5_quickReport('KPI операторов')"><i class="fas fa-download"></i> Отчёт</button>
      </div>
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-chart-bar"></i>Производительность смены (27.05.2026)</div></div>
      <div class="card-body" style="padding:8px;"><div class="chart-box" style="position:relative;height:228px;"><canvas id="kpiChart"></canvas></div></div>
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-list"></i>Детальные показатели</div></div>
      <table class="data-table">
        <thead><tr><th>Оператор / Инспектор</th><th>Роль</th><th>Обработано</th><th>Ошибок</th><th>Ср. время (сек)</th><th>Эффективность</th><th>Рейтинг</th></tr></thead>
        <tbody>${OPERATORS.sort((a,b)=>b.efficiency-a.efficiency).map((op,i)=>{
          const stars='★'.repeat(Math.ceil(op.efficiency/20))+'☆'.repeat(5-Math.ceil(op.efficiency/20));
          const effColor=op.efficiency>=99?'var(--success)':op.efficiency>=96?'var(--primary)':'var(--accent)';
          return`<tr>
            <td style="font-size:12px;font-weight:600;">${i===0?'🏆 ':i===1?'🥈 ':i===2?'🥉 ':''} ${op.name}</td>
            <td><span class="sbadge ${op.role==='Инспектор'?'sb-proc':'sb-new'}" style="font-size:9px;">${op.role}</span></td>
            <td class="mono" style="font-size:12px;font-weight:700;color:var(--primary);">${op.processed}</td>
            <td class="mono" style="font-size:12px;font-weight:700;color:${op.errors===0?'var(--success)':'var(--accent-red)'};">${op.errors}</td>
            <td class="mono" style="font-size:11px;">${op.avgTime} сек</td>
            <td>
              <div style="display:flex;align-items:center;gap:6px;">
                <div class="prog-bar" style="width:80px;height:8px;"><div class="prog-fill" style="width:${op.efficiency}%;background:${effColor};"></div></div>
                <span style="font-size:11.5px;font-weight:700;color:${effColor};">${op.efficiency}%</span>
              </div>
            </td>
            <td style="font-size:14px;color:${effColor};">${stars}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>
  </div>`;
  s5_markQuest(4);
  setTimeout(()=>{
    safeChart(document.getElementById('kpiChart'),{type:'bar',data:{
      labels:OPERATORS.map(op=>op.name.split(' ')[0]),
      datasets:[
        {label:'Обработано',data:OPERATORS.map(op=>op.processed),backgroundColor:'rgba(21,101,192,.25)',borderColor:'#1565C0',borderWidth:1.5},
        {label:'Ошибки×10',data:OPERATORS.map(op=>op.errors*10),backgroundColor:'rgba(198,40,40,.2)',borderColor:'#C62828',borderWidth:1.5}
      ]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{size:10}}}},scales:{y:{beginAtZero:true,ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}});
  },100);
}

/* ============================================================
   МОНИТОРИНГ СИСТЕМЫ
   ============================================================ */
function s5_renderMonitor(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-desktop" style="color:var(--primary);"></i>Мониторинг системы в реальном времени <span class="live-ind" style="margin-left:5px;">LIVE</span></h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-s btn-sm" onclick="s5_refreshMetrics()"><i class="fas fa-sync"></i> Обновить</button>
        <button class="btn btn-d btn-sm" onclick="toast('Сигнал тревоги отправлен дежурному администратору','warning')"><i class="fas fa-bell"></i> Тревога</button>
      </div>
    </div>

    <!-- Метрики серверов -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      ${[
        {name:'OCR-Кластер 1',cpu:67,ram:78,disk:45,net:'1.2 Гб/с',status:'ok'},
        {name:'OCR-Кластер 2',cpu:54,ram:71,disk:45,net:'0.9 Гб/с',status:'ok'},
        {name:'БД PostgreSQL',cpu:23,ram:89,disk:67,net:'0.3 Гб/с',status:'warn'},
        {name:'ЭЦП-Сервер',cpu:12,ram:34,disk:22,net:'0.1 Гб/с',status:'ok'},
      ].map(s=>{
        const gaugeColor=val=>val>85?'var(--accent-red)':val>70?'var(--warning)':'var(--success)';
        const gaugeCls=val=>val>85?'metric-crit':val>70?'metric-warn':'metric-ok';
        function gauge(val,id){
          const r=28;const circ=2*Math.PI*r;const offset=circ*(1-val/100);
          return`<div class="metric-gauge"><svg width="70" height="70" viewBox="0 0 70 70"><circle class="gauge-bg" cx="35" cy="35" r="${r}"/><circle class="${gaugeCls(val)} gauge-fg" cx="35" cy="35" r="${r}" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"/></svg><div class="gauge-label" style="color:${gaugeColor(val)};">${val}%</div></div>`;
        }
        return`<div class="card">
          <div class="card-hdr" style="padding:7px 10px;">
            <div style="font-size:11.5px;font-weight:700;">${s.name}</div>
            <span class="sbadge ${s.status==='ok'?'sb-done':'sb-warn'}" style="font-size:9px;">${s.status==='ok'?'✓ OK':'⚠ Нагрузка'}</span>
          </div>
          <div class="card-body" style="padding:8px 10px;">
            <div style="display:flex;justify-content:space-around;margin-bottom:8px;">
              <div style="text-align:center;">${gauge(s.cpu)}<div style="font-size:9.5px;color:var(--text2);">CPU</div></div>
              <div style="text-align:center;">${gauge(s.ram)}<div style="font-size:9.5px;color:var(--text2);">RAM</div></div>
              <div style="text-align:center;">${gauge(s.disk)}<div style="font-size:9.5px;color:var(--text2);">Disk</div></div>
            </div>
            <div style="font-size:10.5px;display:flex;justify-content:space-between;">
              <span style="color:var(--text2);">Сеть:</span><span class="mono" style="font-weight:700;">${s.net}</span>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>

    <!-- Статус подсистем -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-heartbeat"></i>Состояние подсистем</div></div>
        <div class="card-body" style="padding:8px 12px;">
          ${[
            ['ФИС ГИБДД-М','ONLINE','ok','45 мс'],['РЭО ГИБДД','ONLINE','ok','128 мс'],
            ['Почта России API','ONLINE','ok','234 мс'],['ГИС ГМП (платежи)','ONLINE','ok','89 мс'],
            ['ФССП API','МЕДЛЕННО','warn','4 821 мс'],['Сервер ЭЦП','ONLINE','ok','12 мс'],
            ['OCR-кластер','ONLINE','ok','<1 мс'],['АИПС Автомобиль','ONLINE','ok','67 мс'],
            ['Центр мониторинга','ONLINE','ok','<1 мс'],['Резервный ЦОД','STANDBY','warn','—'],
          ].map(([name,status,cls,latency])=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border2);font-size:11.5px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="width:8px;height:8px;border-radius:50%;background:${cls==='ok'?'var(--success)':cls==='warn'?'var(--warning)':'var(--accent-red)'};${cls==='ok'?'animation:blink 3s infinite':''}"></div>
              <span>${name}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span class="mono" style="font-size:10px;color:var(--text3);">${latency}</span>
              <span style="font-weight:700;font-size:10px;color:${cls==='ok'?'var(--success)':cls==='warn'?'var(--accent)':'var(--accent-red)'};">${status}</span>
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-chart-area"></i>Трафик данных (Мб/с)</div></div>
        <div class="card-body" style="padding:8px;"><div class="chart-box" style="position:relative;height:266px;"><canvas id="trafficChart"></canvas></div></div>
      </div>
    </div>

    <!-- Системный лог -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-terminal"></i>Системный лог <span class="live-ind" style="margin-left:5px;">LIVE</span></div>
        <button class="btn btn-s btn-sm" onclick="clearLog()"><i class="fas fa-trash"></i> Очистить</button>
      </div>
      <div id="sysLog" style="background:#0D1117;border-radius:0 0 8px 8px;padding:10px 12px;font-family:'Courier New',monospace;font-size:10.5px;color:#7ee787;height:120px;overflow-y:auto;"></div>
    </div>
  </div>`;
  s5_markQuest(5);
  setTimeout(()=>{
    safeChart(document.getElementById('trafficChart'),{type:'line',data:{
      labels:Array.from({length:20},(_,i)=>`-${20-i}с`),
      datasets:[
        {label:'Входящий',data:Array.from({length:20},()=>rndInt(20,80)),borderColor:'#1565C0',fill:false,tension:.4,borderWidth:1.5,pointRadius:0},
        {label:'Исходящий',data:Array.from({length:20},()=>rndInt(10,40)),borderColor:'#2E7D32',fill:false,tension:.4,borderWidth:1.5,pointRadius:0}
      ]
    },options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{labels:{font:{size:10}}}},scales:{y:{beginAtZero:true,ticks:{font:{size:9}}},x:{ticks:{font:{size:9}}}}}});
    s5_startSysLog();
  },100);
}
function s5_startSysLog(){
  const log=document.getElementById('sysLog');if(!log)return;
  const msgs=[
    {c:'#7ee787',t:'[INFO]  OCR-кластер: обработано нарушение ДЕЛ-2026-10'},
    {c:'#79c0ff',t:'[DATA]  РЭО ГИБДД: ответ получен 45ms, владелец найден'},
    {c:'#7ee787',t:'[INFO]  Постановление ПОСТ-77-2026-104XX подписано ЭЦП'},
    {c:'#e3b341',t:'[WARN]  ФССП API: задержка 4.8s (норма <2s)'},
    {c:'#79c0ff',t:'[DATA]  ГИС ГМП: подтверждена оплата штрафа 1000 руб.'},
    {c:'#7ee787',t:'[INFO]  Письмо 14580527183 статус: Доставлено адресату'},
    {c:'#ff7b72',t:'[ERROR] Камера CAM-077-015: Connection timeout (40 min)'},
    {c:'#7ee787',t:'[INFO]  OCR confidence: А177МС77 = 98% — подтверждено авто'},
    {c:'#e3b341',t:'[WARN]  Очередь ЭЦП: 23 документа (норма <20)'},
    {c:'#7ee787',t:'[INFO]  Синхронизация РТМ Почта России: 31 письмо передано'},
  ];
  let i=0;
  const addLog=()=>{
    const m=msgs[i%msgs.length];
    const time=new Date().toLocaleTimeString('ru');
    const div=document.createElement('div');
    div.style.color=m.c;
    div.textContent=`${time} ${m.t}XX`;
    if(log.children.length>20)log.removeChild(log.firstChild);
    log.appendChild(div);log.scrollTop=log.scrollHeight;
    i++;
  };
  addLog();
  const int=setInterval(()=>{if(!document.getElementById('sysLog'))return clearInterval(int);addLog();},1500);
}
function clearLog(){const l=document.getElementById('sysLog');if(l)l.innerHTML='';}
function s5_refreshMetrics(){toast('Метрики обновлены','success');}

/* ============================================================
   ТОПОЛОГИЯ СЕТИ
   ============================================================ */
function s5_renderInfra(mc){
  const on=CAMERAS_ALL.filter(c=>c.st==='online'),wr=CAMERAS_ALL.filter(c=>c.st==='warning'),of=CAMERAS_ALL.filter(c=>c.st==='offline');
  const camNodes=[
    {id:'cam0',lbl:on.length+' комплексов',sub:'online',st:'ok',ico:'fa-video'},
    ...wr.map((c,i)=>({id:'camw'+i,lbl:c.id,sub:'предупреждение',st:'warn',ico:'fa-exclamation-triangle'})),
    ...of.map((c,i)=>({id:'camo'+i,lbl:c.id,sub:'offline',st:'off',ico:'fa-times-circle'}))
  ];
  const C={ok:'var(--success)',warn:'var(--accent)',off:'var(--accent-red)'};
  const subs=[
    {id:'sOcr',ico:'fa-brain',lbl:'OCR-движок',c:'#1565C0'},{id:'sDb',ico:'fa-database',lbl:'БД нарушений',c:'#2E7D32'},
    {id:'sEcp',ico:'fa-key',lbl:'Сервер ЭЦП',c:'#6A1B9A'},{id:'sMail',ico:'fa-envelope',lbl:'Почтовый шлюз',c:'#F57C00'}
  ];
  const ext=[
    {id:'eFis',ico:'fa-id-card',lbl:'ФИС ГИБДД-М',s:'ok'},{id:'eGmp',ico:'fa-landmark',lbl:'ГИС ГМП',s:'warn'},
    {id:'eFssp',ico:'fa-university',lbl:'ФССП АС',s:'ok'},{id:'ePost',ico:'fa-mail-bulk',lbl:'Почта России',s:'ok'}
  ];
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-network-wired" style="color:var(--primary);"></i>Топология инфраструктуры ЦАФАП</h2>
    <div class="card" style="flex:1;display:flex;flex-direction:column;">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-sitemap"></i>Схема информационного взаимодействия</div>
        <div style="display:flex;gap:12px;font-size:11px;align-items:center;">
          <span><span style="display:inline-block;width:22px;height:0;border-top:2px solid var(--success);vertical-align:middle;"></span> Online</span>
          <span><span style="display:inline-block;width:22px;height:0;border-top:2px dashed var(--accent);vertical-align:middle;"></span> Медленно</span>
          <span><span style="display:inline-block;width:22px;height:0;border-top:2px dashed var(--accent-red);vertical-align:middle;"></span> Offline</span>
        </div>
      </div>
      <div id="topoCanvas" style="position:relative;flex:1;min-height:460px;background:#F8FAFF;padding:22px 24px 26px;overflow:hidden;">
        <svg id="topoSvg" style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1;" xmlns="http://www.w3.org/2000/svg"></svg>
        <div style="position:relative;z-index:2;display:grid;grid-template-columns:minmax(150px,1fr) 130px minmax(170px,1fr) minmax(180px,1fr);column-gap:clamp(30px,6vw,90px);align-items:center;min-height:400px;">
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--text2);margin-bottom:8px;text-align:center;">КАМЕРЫ ФВФ</div>
            ${camNodes.map(c=>`<div data-n="${c.id}" style="background:#fff;border:2px solid ${C[c.st]};border-radius:6px;padding:6px 9px;margin-bottom:9px;font-size:10.5px;font-weight:600;color:${C[c.st]};text-align:center;cursor:pointer;" onclick="toast('${c.lbl}: статус сети — ${c.sub}','${c.st==='ok'?'success':c.st==='warn'?'info':'error'}')"><i class="fas ${c.ico}" style="font-size:11px;"></i> ${c.lbl}<div style="font-size:9px;font-weight:500;">${c.sub}</div></div>`).join('')}
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:74px;">
            <div data-n="core" onclick="toast('ЦОД ЦАФАП: OCR-кластер 2×16 ядер, 64GB RAM. Статус: ONLINE','success');s5_markQuest(6);" class="net-node" style="cursor:pointer;">
              <div style="width:96px;height:96px;background:linear-gradient(135deg,#1565C0,#0D47A1);border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;box-shadow:0 4px 20px rgba(21,101,192,.4);">
                <i class="fas fa-server" style="font-size:22px;margin-bottom:4px;"></i>
                <div style="font-size:9px;font-weight:700;text-align:center;">ЦОД ЦАФАП<br>Региональный</div>
                <div style="width:8px;height:8px;background:#4CAF50;border-radius:50%;margin-top:4px;animation:blink 2s infinite;"></div>
              </div>
              <div style="font-size:9.5px;text-align:center;margin-top:3px;font-weight:600;color:var(--primary);">OCR · БД · ЭЦП</div>
            </div>
            <div data-n="backup" style="text-align:center;cursor:pointer;" onclick="toast('Резервный ЦОД: режим STANDBY. Автопереключение при отказе основного.','info')">
              <div style="background:#fff;border:2px dashed var(--accent);border-radius:10px;padding:8px 14px;display:inline-block;">
                <i class="fas fa-hdd" style="color:var(--accent);font-size:16px;"></i>
                <div style="font-size:10px;font-weight:700;color:var(--accent);">Резервный ЦОД</div>
                <div style="font-size:9px;color:var(--text3);">STANDBY · Авто-failover</div>
              </div>
            </div>
          </div>
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--text2);margin-bottom:8px;text-align:center;">ПОДСИСТЕМЫ</div>
            ${subs.map(n=>`<div data-n="${n.id}" style="background:#fff;border:2px solid ${n.c};border-radius:8px;padding:8px 10px;margin-bottom:12px;display:flex;align-items:center;gap:8px;cursor:pointer;" onclick="toast('${n.lbl}: ONLINE','success')"><i class="fas ${n.ico}" style="color:${n.c};font-size:14px;"></i><div><div style="font-size:10.5px;font-weight:700;color:${n.c};">${n.lbl}</div><div style="font-size:9px;color:var(--success);">● ONLINE</div></div></div>`).join('')}
          </div>
          <div>
            <div style="font-size:10px;font-weight:700;color:var(--text2);margin-bottom:8px;text-align:center;">ВНЕШНИЕ АС</div>
            ${ext.map(n=>`<div data-n="${n.id}" style="background:#fff;border:1.5px solid ${n.s==='ok'?'var(--success)':'var(--accent)'};border-radius:7px;padding:7px 10px;margin-bottom:12px;display:flex;align-items:center;gap:7px;cursor:pointer;" onclick="toast('${n.lbl}: запрос отправлен','info')"><i class="fas ${n.ico}" style="font-size:13px;color:${n.s==='ok'?'var(--success)':'var(--accent)'};"></i><div style="font-size:10.5px;font-weight:600;">${n.lbl}<br><span style="color:${n.s==='ok'?'var(--success)':'var(--accent)'};font-size:9px;">${n.s==='ok'?'● ONLINE':'⚠ МЕДЛЕННО'}</span></div></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;
  /* Линии вычисляются по фактическому положению блоков и пересчитываются при изменении размеров */
  const redraw=()=>s5_drawTopo(camNodes);
  setTimeout(redraw,0);setTimeout(redraw,300);
  const cv=document.getElementById('topoCanvas');
  if(cv&&typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(()=>{if(!document.getElementById('topoCanvas')){ro.disconnect();return;}redraw();});ro.observe(cv);}
  s5_markQuest(6);
}
/* Рисует соединения между блоками схемы по их реальным координатам */
function s5_drawTopo(camNodes){
  const cv=document.getElementById('topoCanvas'),svg=document.getElementById('topoSvg');if(!cv||!svg)return;
  const cr=cv.getBoundingClientRect();if(!cr.width)return;
  const pt=(id,side)=>{
    const e=cv.querySelector('[data-n="'+id+'"]');if(!e)return null;
    const r=e.getBoundingClientRect();
    if(side==='r')return{x:r.right-cr.left,y:r.top+r.height/2-cr.top,h:1};
    if(side==='l')return{x:r.left-cr.left,y:r.top+r.height/2-cr.top,h:1};
    if(side==='b')return{x:r.left+r.width/2-cr.left,y:r.bottom-cr.top,h:0};
    return{x:r.left+r.width/2-cr.left,y:r.top-cr.top,h:0};
  };
  const COL={ok:'#2E7D32',warn:'#F9A825',off:'#C62828'};
  const links=[
    ...camNodes.map(c=>({a:c.id,as:'r',b:'core',bs:'l',st:c.st,w:2})),
    {a:'core',as:'r',b:'sOcr',bs:'l',st:'ok',w:2.5},{a:'core',as:'r',b:'sDb',bs:'l',st:'ok',w:2.5},
    {a:'core',as:'r',b:'sEcp',bs:'l',st:'ok',w:2.5},{a:'core',as:'r',b:'sMail',bs:'l',st:'ok',w:2.5},
    {a:'sDb',as:'r',b:'eFis',bs:'l',st:'ok',w:1.8},{a:'sDb',as:'r',b:'eGmp',bs:'l',st:'warn',w:1.8},
    {a:'sDb',as:'r',b:'eFssp',bs:'l',st:'ok',w:1.8},{a:'sMail',as:'r',b:'ePost',bs:'l',st:'ok',w:1.8},
    {a:'core',as:'b',b:'backup',bs:'t',st:'warn',w:1.8}
  ];
  let out='';
  links.forEach(k=>{
    const p=pt(k.a,k.as),q=pt(k.b,k.bs);if(!p||!q)return;
    let d;
    if(p.h&&q.h){const dx=Math.max(24,Math.abs(q.x-p.x)/2);d=`M${p.x.toFixed(1)} ${p.y.toFixed(1)} C${(p.x+dx).toFixed(1)} ${p.y.toFixed(1)} ${(q.x-dx).toFixed(1)} ${q.y.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;}
    else{const dy=Math.max(20,Math.abs(q.y-p.y)/2);d=`M${p.x.toFixed(1)} ${p.y.toFixed(1)} C${p.x.toFixed(1)} ${(p.y+dy).toFixed(1)} ${q.x.toFixed(1)} ${(q.y-dy).toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;}
    const dash=k.st==='ok'?'7 4':'4 5';
    out+=`<path d="${d}" fill="none" stroke="${COL[k.st]}" stroke-width="${k.w}" stroke-dasharray="${dash}" stroke-linecap="round" class="${k.st==='ok'?'topo-flow':''}"/>`
       +`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.2" fill="${COL[k.st]}"/><circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="3.2" fill="${COL[k.st]}"/>`;
  });
  svg.setAttribute('viewBox','0 0 '+cr.width.toFixed(0)+' '+cr.height.toFixed(0));
  svg.innerHTML=out;
}

/* ============================================================
   КАРТА КАМЕР
   ============================================================ */
let _camMap=null;
function s5_renderCamerasMap(mc){
  const online=CAMERAS_ALL.filter(c=>c.st==='online').length;
  const warn=CAMERAS_ALL.filter(c=>c.st==='warning').length;
  const off=CAMERAS_ALL.filter(c=>c.st==='offline').length;
  const stLbl={online:'ONLINE',warning:'ПРЕДУПРЕЖДЕНИЕ',offline:'OFFLINE'},stCls={online:'sb-done',warning:'sb-warn',offline:'sb-err'};
  mc.innerHTML=`
  <div style="flex:1;min-height:0;display:flex;flex-direction:column;padding:12px 14px;gap:10px;">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-map-marked-alt" style="color:var(--primary);"></i>Карта камер ФВФ</h2>
      <div style="display:flex;gap:12px;font-size:11px;align-items:center;">
        <span style="color:var(--success);"><i class="fas fa-circle" style="font-size:9px;"></i> Онлайн: ${online}</span>
        <span style="color:var(--accent);"><i class="fas fa-circle" style="font-size:9px;"></i> Предупреждение: ${warn}</span>
        <span style="color:var(--accent-red);"><i class="fas fa-circle" style="font-size:9px;"></i> Offline: ${off}</span>
      </div>
    </div>
    <div class="card" id="camMapCard" style="flex:1 1 46%;min-height:240px;display:flex;flex-direction:column;overflow:hidden;">
      <div class="card-hdr" style="flex-shrink:0;"><div class="card-title"><i class="fas fa-map"></i>Москва — расположение камер ФВФ (наложение: статус и нарушений за сутки)</div>
        <button class="btn btn-s btn-sm" onclick="s5_camMapFull()" title="На весь экран"><i class="fas fa-expand"></i></button>
      </div>
      <div id="camMap" style="flex:1;min-height:0;background:#E9EEF3;"></div>
    </div>
    <div class="card" style="flex:1 1 54%;min-height:150px;display:flex;flex-direction:column;overflow:hidden;">
      <div class="card-hdr" style="flex-shrink:0;"><div class="card-title"><i class="fas fa-list"></i>Реестр камер</div><span style="font-size:11px;color:var(--text3);">${CAMERAS_ALL.length} комплексов · нажмите строку, чтобы показать на карте</span></div>
      <div style="flex:1;min-height:0;overflow:auto;">
        <table class="data-table" style="font-size:11.5px;">
          <thead><tr>${['ID камеры','Адрес','Район','Тип','Нарушений сегодня','Статус','Действия'].map(h=>`<th style="position:sticky;top:0;background:#F6F9FD;z-index:2;">${h}</th>`).join('')}</tr></thead>
          <tbody>${CAMERAS_ALL.map(c=>{const d=CAFAP_DB.fvf.get(c.id)||{};return`<tr class="cam-row" data-id="${c.id}" style="cursor:pointer;" onclick="s5_camFocus('${c.id}')">
            <td class="mono" style="font-size:10.5px;color:var(--primary);padding:5px 10px;">${c.id}</td>
            <td style="padding:5px 10px;">${c.addr}</td>
            <td style="padding:5px 10px;"><span class="sbadge sb-new" style="font-size:9px;">${c.dist}</span></td>
            <td style="font-size:11px;padding:5px 10px;">${d.type||'—'}</td>
            <td class="mono" style="font-size:11.5px;font-weight:700;padding:5px 10px;color:${c.viol>300?'var(--accent-red)':c.viol>150?'var(--accent)':'var(--primary)'};">${c.viol}</td>
            <td style="padding:5px 10px;"><span class="sbadge ${stCls[c.st]}" style="font-size:9px;">${stLbl[c.st]}</span></td>
            <td style="padding:5px 10px;"><div style="display:flex;gap:3px;">
              <button class="btn btn-s btn-sm" onclick="event.stopPropagation();toast('${c.id}: диагностика запущена...','info')"><i class="fas fa-stethoscope"></i></button>
              ${c.st==='offline'?`<button class="btn btn-w btn-sm" onclick="event.stopPropagation();toast('Технический выезд инициирован для ${c.id}','warning')"><i class="fas fa-tools"></i></button>`:''}
            </div></td>
          </tr>`}).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
  setTimeout(s5_initCamMap,0);
  s5_markQuest(7);
}
const CAM_COL={online:'#2E9E45',warning:'#F59E0B',offline:'#E53935'};
function s5_camPopup(c){
  const d=CAFAP_DB.fvf.get(c.id)||{};
  const stLbl={online:'ONLINE',warning:'ПРЕДУПРЕЖДЕНИЕ',offline:'OFFLINE'};
  return `<div style="min-width:210px;font-size:12px;line-height:1.5;">
    <div style="font-weight:800;color:var(--primary);font-family:'Courier New',monospace;">${c.id}</div>
    <div><b>${c.addr}</b>, ${c.dist}</div>
    <div style="color:#555;">${d.modelFull||d.model||''} · ${d.direction||''}</div>
    <div style="margin:4px 0;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${CAM_COL[c.st]};margin-right:5px;"></span><b>${stLbl[c.st]}</b> · нарушений за сутки: <b>${c.viol}</b></div>
    <div style="color:#555;">Поверка ${d.poverkaNo||'—'} до ${d.poverkaUntil||'—'}</div>
    <div style="margin-top:6px;display:flex;gap:5px;">
      <button class="btn btn-s btn-sm" onclick="toast('${c.id}: диагностика запущена...','info')"><i class="fas fa-stethoscope"></i> Диагностика</button>
      ${c.st==='offline'?`<button class="btn btn-w btn-sm" onclick="toast('Технический выезд инициирован для ${c.id}','warning')"><i class="fas fa-tools"></i> Выезд</button>`:''}
    </div></div>`;
}
function s5_initCamMap(){
  const el=document.getElementById('camMap');if(!el)return;
  if(typeof L==='undefined'){el.innerHTML='<div style="padding:30px;text-align:center;color:#888;">Библиотека карты (vendor/leaflet) не загружена</div>';return;}
  if(_camMap){try{_camMap.remove();}catch(e){}_camMap=null;}
  const map=L.map(el,{preferCanvas:false,zoomSnap:.5,worldCopyJump:false}).setView(CAFAP_MAP.center,CAFAP_MAP.zoom);
  _camMap=map;
  let loaded=0,errors=0,fallback=false;
  const useFallback=()=>{if(fallback)return;fallback=true;s5_camMapFallback(map);};
  const tiles=L.tileLayer(CAFAP_MAP.tileUrl,{maxZoom:18,attribution:CAFAP_MAP.attribution}).addTo(map);
  tiles.on('tileload',()=>{loaded++;});
  tiles.on('tileerror',()=>{errors++;if(!loaded&&errors>=3)useFallback();});
  setTimeout(()=>{if(!loaded)useFallback();},4500);

  const items=CAMERAS_ALL.map(c=>({c,d:CAFAP_DB.fvf.get(c.id)})).filter(x=>x.d&&x.d.lat);
  const bubbles=L.layerGroup(),dots=L.layerGroup(),markers={};
  const maxV=Math.max(1,...items.map(x=>x.c.viol));
  items.forEach(({c,d})=>{
    const ll=[d.lat,d.lon];
    // пузырьковая диаграмма «нарушений за сутки»: площадь пропорциональна значению
    if(c.viol>0)L.circleMarker(ll,{radius:8+Math.sqrt(c.viol/maxV)*26,stroke:true,weight:1,color:'#1565C0',fillColor:'#1E88E5',fillOpacity:.22,interactive:false}).addTo(bubbles);
    const m=L.circleMarker(ll,{radius:c.st==='offline'?9:8,color:'#fff',weight:2.5,fillColor:CAM_COL[c.st],fillOpacity:1}).addTo(dots);
    m.bindPopup(s5_camPopup(c));
    m.bindTooltip(c.id.replace('CAM-077-','№')+' · '+c.viol,{direction:'top',offset:[0,-8]});
    m.on('click',()=>{const row=document.querySelector('.cam-row[data-id="'+c.id+'"]');document.querySelectorAll('.cam-row').forEach(r=>r.style.background='');if(row){row.style.background='#E3F2FD';row.scrollIntoView({block:'nearest'});}});
    markers[c.id]=m;
  });
  bubbles.addTo(map);dots.addTo(map);
  L.control.layers(null,{'Статус камер':dots,'Нарушений за сутки (пузыри)':bubbles},{collapsed:false,position:'topright'}).addTo(map);
  // легенда — внутри карты, всегда видна
  const leg=L.control({position:'bottomleft'});
  leg.onAdd=()=>{
    const d=L.DomUtil.create('div','leaflet-legend');
    const cnt=st=>CAMERAS_ALL.filter(c=>c.st===st).length;
    d.innerHTML=`<div style="font-weight:700;margin-bottom:4px;">Легенда</div>
      <div><span class="lg-dot" style="background:${CAM_COL.online}"></span>Онлайн (${cnt('online')})</div>
      <div><span class="lg-dot" style="background:${CAM_COL.warning}"></span>Предупреждение (${cnt('warning')})</div>
      <div><span class="lg-dot" style="background:${CAM_COL.offline}"></span>Offline (${cnt('offline')})</div>
      <div style="margin-top:5px;display:flex;align-items:center;gap:6px;"><span class="lg-bub"></span>Нарушений за сутки (чем больше круг, тем больше)</div>`;
    L.DomEvent.disableClickPropagation(d);return d;
  };
  leg.addTo(map);
  L.control.scale({imperial:false,position:'bottomleft'}).addTo(map);
  if(items.length)map.fitBounds(L.latLngBounds(items.map(x=>[x.d.lat,x.d.lon])).pad(.18));
  window._camMarkers=markers;
  setTimeout(()=>map.invalidateSize(),200);
  const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(()=>{if(!document.getElementById('camMap')){ro.disconnect();return;}map.invalidateSize();}):null;
  if(ro)ro.observe(el);
}
/* Офлайн-схема: если плитки карты недоступны (нет интернета), рисуем упрощённую схему колец и реки */
function s5_camMapFallback(map){
  map.getContainer().style.background='#E6ECF2';
  const ring=(lat,lon,rl,ro,n,wob)=>Array.from({length:n+1},(_,i)=>{const a=i/n*2*Math.PI,k=1+wob*Math.sin(a*3+1)+wob*.6*Math.cos(a*5);return[lat+rl*k*Math.sin(a),lon+ro*k*Math.cos(a)];});
  const g=L.layerGroup().addTo(map);
  L.polyline([[55.775,37.36],[55.765,37.43],[55.745,37.49],[55.738,37.545],[55.742,37.585],[55.733,37.615],[55.718,37.635],[55.70,37.655],[55.68,37.69],[55.655,37.72],[55.63,37.78]],{color:'#B7D3EE',weight:9,opacity:.9,interactive:false}).addTo(g);
  [['МКАД',55.74,37.60,.17,.235,.02,5,'#9FB2C8'],['ТТК',55.745,37.62,.058,.097,.03,4,'#B2C1D3'],['Садовое кольцо',55.7487,37.6218,.022,.038,.02,3,'#C0CCDA']].forEach(r=>{
    L.polyline(ring(r[1],r[2],r[3],r[4],72,r[5]),{color:r[7],weight:r[6],opacity:.95,interactive:false}).addTo(g);
    L.tooltip({permanent:true,direction:'center',className:'ring-label'}).setLatLng([r[1]+r[3]*1.0,r[2]]).setContent(r[0]).addTo(g);
  });
  L.circleMarker([55.7522,37.6156],{radius:5,color:'#6A7F99',fillColor:'#6A7F99',fillOpacity:1,interactive:false}).addTo(g);
  const info=L.control({position:'topleft'});
  info.onAdd=()=>{const d=L.DomUtil.create('div','leaflet-legend');d.style.maxWidth='230px';d.innerHTML='<b>Офлайн-схема</b><br>Плитки карты недоступны (нет интернета). Кольца и река — условная схема.';return d;};
  info.addTo(map);
}
function s5_camFocus(id){
  const m=window._camMarkers&&window._camMarkers[id];if(!m||!_camMap)return;
  _camMap.flyTo(m.getLatLng(),Math.max(_camMap.getZoom(),12),{duration:.6});
  setTimeout(()=>m.openPopup(),650);
  document.querySelectorAll('.cam-row').forEach(r=>r.style.background=r.dataset.id===id?'#E3F2FD':'');
  document.getElementById('camMap')&&document.getElementById('camMap').scrollIntoView({block:'nearest',behavior:'smooth'});
}
function s5_camMapFull(){
  const c=document.getElementById('camMapCard');if(!c)return;
  const on=c.classList.toggle('cam-full');
  setTimeout(()=>_camMap&&_camMap.invalidateSize(),120);
}

/* ============================================================
   ИНЦИДЕНТЫ
   ============================================================ */
function s5_renderIncidents(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-exclamation-triangle" style="color:var(--accent-red);"></i>Панель инцидентов</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-d btn-sm" onclick="s5_createIncident()"><i class="fas fa-plus"></i> Создать инцидент</button>
        <button class="btn btn-s btn-sm" onclick="toast('Все инциденты экспортированы','info')"><i class="fas fa-download"></i></button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
      ${[
        {lbl:'Критических',val:INCIDENTS.filter(i=>i.sev==='critical').length,c:'accent-red',ico:'fa-fire'},
        {lbl:'Предупреждений',val:INCIDENTS.filter(i=>i.sev==='warning').length,c:'accent',ico:'fa-exclamation-triangle'},
        {lbl:'Информационных',val:INCIDENTS.filter(i=>i.sev==='info').length,c:'primary',ico:'fa-info-circle'},
        {lbl:'Решено сегодня',val:INCIDENTS.filter(i=>i.status==='resolved').length,c:'success',ico:'fa-check-circle'}
      ].map(s=>`<div style="background:#fff;border:1px solid var(--border);border-radius:9px;padding:12px;position:relative;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--${s.c});border-radius:9px 9px 0 0;"></div>
        <div style="font-size:26px;font-weight:800;color:var(--${s.c});font-family:'Courier New',monospace;">${s.val}</div>
        <div style="font-size:11px;color:var(--text2);">${s.lbl}</div>
        <i class="fas ${s.ico}" style="position:absolute;top:10px;right:10px;font-size:22px;opacity:.08;"></i>
      </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-list"></i>Активные инциденты</div><span class="live-ind">LIVE</span></div>
      <div class="card-body" style="padding:8px 12px;">
        ${INCIDENTS.map(inc=>{
          const clsMap={critical:'inc-crit',warning:'inc-warn',info:'inc-info',ok:'inc-ok'};
          const icoMap={critical:'fa-times-circle',warning:'fa-exclamation-triangle',info:'fa-info-circle',ok:'fa-check-circle'};
          const colMap={critical:'var(--accent-red)',warning:'var(--accent)',info:'var(--primary)',ok:'var(--success)'};
          const stMap={open:'sb-err',monitoring:'sb-warn',planned:'sb-new',resolved:'sb-done'};
          const stLbl={open:'Открыт',monitoring:'Мониторинг',planned:'Запланирован',resolved:'Решён'};
          return`<div class="incident-item ${clsMap[inc.sev]}">
            <i class="fas ${icoMap[inc.sev]}" style="color:${colMap[inc.sev]};flex-shrink:0;font-size:16px;margin-top:1px;"></i>
            <div style="flex:1;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:2px;">
                <div style="font-size:12.5px;font-weight:700;">${inc.title}</div>
                <div style="display:flex;gap:6px;align-items:center;">
                  <span class="mono" style="font-size:10px;color:var(--text3);">${inc.time}</span>
                  <span class="sbadge ${stMap[inc.status]}" style="font-size:9px;">${stLbl[inc.status]}</span>
                </div>
              </div>
              <div style="font-size:11px;color:var(--text2);">${inc.desc}</div>
              <div style="font-size:10.5px;color:var(--text3);margin-top:2px;"><i class="fas fa-cogs" style="font-size:9px;"></i> ${inc.action}</div>
            </div>
            <button class="btn btn-s btn-sm" onclick="s5_showIncident('${inc.id}')"><i class="fas fa-external-link-alt"></i></button>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
  s5_markQuest(8);
}

function s5_showIncident(id){
  const inc=INCIDENTS.find(i=>i.id===id);if(!inc)return;
  const colMap={critical:'var(--accent-red)',warning:'var(--accent)',info:'var(--primary)',ok:'var(--success)'};
  document.getElementById('incidentContent').innerHTML=`
    <div style="background:${inc.sev==='critical'?'#FFEBEE':inc.sev==='warning'?'#FFF3E0':'#E3F2FD'};border-radius:8px;padding:12px;margin-bottom:14px;">
      <div style="font-size:13px;font-weight:700;color:${colMap[inc.sev]};margin-bottom:4px;">${inc.title}</div>
      <div style="font-size:11.5px;">${inc.desc}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      ${[['ID инцидента',inc.id],['Время обнаружения',inc.time],['Приоритет',inc.sev.toUpperCase()],['Статус',inc.status],['Предпринятые меры',inc.action]].map(([k,v])=>`
      <div><div style="font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;">${k}</div><div style="font-size:12px;font-weight:600;">${v}</div></div>`).join('')}
    </div>
    <div class="form-group"><label class="form-label">Комментарий аналитика</label>
      <textarea class="form-control" rows="2" style="resize:none;" placeholder="Введите комментарий..."></textarea>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-s" onclick="closeModal('incidentModal')">Закрыть</button>
      <button class="btn btn-g" onclick="closeModal('incidentModal');toast('Инцидент ${id} отмечен как решённый','success')"><i class="fas fa-check"></i> Закрыть инцидент</button>
    </div>`;
  document.getElementById('incidentModal').style.display='flex';
}
function s5_createIncident(){toast('Форма создания инцидента открыта','info');}

/* ============================================================
   РОЗЫСК ТС
   ============================================================ */
function s5_renderWanted(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-search" style="color:var(--accent-red);"></i>Реестр розыска транспортных средств</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-d" onclick="s5_addWanted()"><i class="fas fa-plus"></i> Добавить в розыск</button>
        <button class="btn btn-s btn-sm" onclick="s5_syncFederal()"><i class="fas fa-sync"></i> Синхр. с ФБД МВД</button>
      </div>
    </div>

    <!-- Статус -->
    <div class="wanted-card">
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
        ${[
          {lbl:'В розыске (регион)',val:WANTED_LIST.filter(w=>w.status==='wanted').length},
          {lbl:'Обнаружено',val:WANTED_LIST.filter(w=>w.status==='found').length},
          {lbl:'Закрыто (ложные)',val:WANTED_LIST.filter(w=>w.status==='closed').length},
          {lbl:'Всего в реестре',val:WANTED_LIST.length}
        ].map(s=>`<div style="text-align:center;"><div style="font-size:24px;font-weight:800;font-family:'Courier New',monospace;">${s.val}</div><div style="font-size:11px;opacity:.75;">${s.lbl}</div></div>`).join('')}
      </div>
    </div>

    <!-- Поиск -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-search"></i>Быстрый поиск по реестру розыска</div></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div class="form-group" style="margin-bottom:0;"><label class="form-label">Государственный номер</label><input type="text" class="form-control" id="wantedPlate" placeholder="А000АА77" oninput="this.value=this.value.toUpperCase()"></div>
          <div class="form-group" style="margin-bottom:0;"><label class="form-label">VIN-номер</label><input type="text" class="form-control" placeholder="XWFFXXEEBFJ..."></div>
          <div class="form-group" style="margin-bottom:0;"><label class="form-label">Марка / Модель</label><input type="text" class="form-control" placeholder="Форд Фокус..."></div>
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <button class="btn btn-p" onclick="s5_searchWanted()"><i class="fas fa-search"></i> Поиск в реестре</button>
          <button class="btn btn-s" onclick="toast('Запрос к ФБД МВД (федеральная база розыска)...','info')"><i class="fas fa-database"></i> Федеральный реестр</button>
          <button class="btn btn-s" onclick="toast('Запрос к Интерполу...','info')"><i class="fas fa-globe"></i> Интерпол</button>
        </div>
        <div id="wantedSearchResult" style="margin-top:10px;"></div>
      </div>
    </div>

    <!-- Реестр -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-list"></i>Реестр разыскиваемых ТС</div>
        <div style="display:flex;gap:6px;">
          <select style="padding:4px 8px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;" onchange="">
            <option>Все статусы</option><option>В розыске</option><option>Обнаружено</option><option>Закрыто</option>
          </select>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>№ Карточки</th><th>Г/Н ТС</th><th>Марка/Модель</th><th>Основание</th><th>Дата внесения</th><th>Последнее фиксирование</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>${WANTED_LIST.map((w,i)=>`<tr>
            <td class="mono" style="font-size:10.5px;color:var(--accent-red);">${w.id}</td>
            <td><span class="plate" style="font-size:10.5px;${w.status==='wanted'?'background:var(--accent-red);':''}">${w.plate}</span></td>
            <td style="font-size:11.5px;">${w.brand}, ${w.color} (${w.year})</td>
            <td><span class="sbadge ${w.reason==='Угон'?'sb-err':'sb-warn'}" style="font-size:9px;">${w.reason}</span></td>
            <td class="mono" style="font-size:10.5px;">${w.dateAdded}</td>
            <td style="font-size:10.5px;color:var(--text2);">${w.lastSeen}</td>
            <td><span class="sbadge ${w.status==='wanted'?'sb-wanted':w.status==='found'?'sb-found':'sb-closed'}" style="font-size:9px;">${w.status==='wanted'?'В розыске':w.status==='found'?'Обнаружен':'Закрыто'}</span></td>
            <td><div style="display:flex;gap:3px;">
              <button class="btn btn-p btn-sm" onclick="s5_showWanted(${i})"><i class="fas fa-eye"></i></button>
              ${w.status==='wanted'?`<button class="btn btn-g btn-sm" onclick="s5_markFound(${i})"><i class="fas fa-check"></i></button>`:''}
            </div></td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
  s5_markQuest(9);
}

function s5_searchWanted(){
  const plate=document.getElementById('wantedPlate')?.value||'';
  const res=document.getElementById('wantedSearchResult');if(!res)return;
  if(!plate){res.innerHTML='<div style="color:var(--accent-red);font-size:12px;">Введите госномер</div>';return;}
  const found=WANTED_LIST.find(w=>w.plate.includes(plate));
  if(found){
    res.innerHTML=`<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:7px;padding:12px;">
      <div style="font-size:12.5px;font-weight:700;color:var(--accent-red);margin-bottom:6px;"><i class="fas fa-exclamation-triangle"></i> ⚠️ АВТОМОБИЛЬ В РОЗЫСКЕ!</div>
      <div style="font-size:12px;"><span class="plate" style="background:var(--accent-red);">${found.plate}</span> — ${found.brand}, ${found.color} (${found.year})</div>
      <div style="font-size:11.5px;margin-top:4px;">Основание: <strong>${found.reason}</strong> · Карточка: ${found.id}</div>
      <div style="font-size:11px;color:var(--text2);">Последнее фиксирование: ${found.lastSeen}</div>
    </div>`;
    s5_markQuest(10);toast(`ТРЕВОГА: Автомобиль ${found.plate} находится в розыске!`,'error');
  } else {
    res.innerHTML=`<div style="background:#E8F5E9;border:1px solid #C8E6C9;border-radius:7px;padding:10px;font-size:12px;color:var(--success);"><i class="fas fa-check-circle"></i> Автомобиль ${plate} в реестре розыска не значится.</div>`;
  }
}

function s5_showWanted(i){
  const w=WANTED_LIST[i];if(!w)return;
  document.getElementById('wantedContent').innerHTML=`
    <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:8px;padding:12px;margin-bottom:14px;">
      <div style="font-size:13px;font-weight:700;color:var(--accent-red);">РАЗЫСКИВАЕТСЯ: <span class="plate" style="background:var(--accent-red);">${w.plate}</span></div>
      <div style="font-size:11.5px;margin-top:3px;">${w.brand}, ${w.color}, ${w.year} г.в. · VIN: ${w.vin}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      ${[['№ карточки розыска',w.id],['Государственный номер',w.plate],['Марка/модель',`${w.brand}, ${w.color}`],['Год выпуска',w.year],['VIN-номер',w.vin],['Основание розыска',w.reason],['Регион инициирования',`${w.region} — г. Москва`],['Дата внесения в реестр',w.dateAdded],['Последнее фиксирование',w.lastSeen]].map(([k,v])=>`
      <div style="padding:6px 0;border-bottom:1px solid var(--border2);"><div style="font-size:10px;font-weight:700;color:var(--text2);text-transform:uppercase;">${k}</div><div style="font-size:12.5px;font-weight:600;">${v}</div></div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-s" onclick="closeModal('wantedModal')">Закрыть</button>
      <button class="btn btn-g" onclick="closeModal('wantedModal');toast('ТС ${w.plate} отмечено как обнаруженное. Карточка закрыта.','success')"><i class="fas fa-check"></i> Отметить как обнаруженное</button>
    </div>`;
  document.getElementById('wantedModal').style.display='flex';
}
function s5_markFound(i){WANTED_LIST[i].status='found';s5_renderWanted(document.getElementById('mainContent5'));toast(`ТС ${WANTED_LIST[i].plate} отмечено как обнаруженное`,'success');}
function s5_addWanted(){toast('Форма добавления ТС в реестр розыска','info');}
function s5_syncFederal(){s5_markQuest(10);toast('Синхронизация с ФБД МВД завершена: 14 записей обновлено','success');}

/* ============================================================
   ПОДОЗРИТЕЛЬНЫЕ ДУБЛИ
   ============================================================ */
function s5_renderDuplicates(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-clone" style="color:var(--accent);"></i>Аналитика подозрительных дублей г/н</h2>
    <div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:9px;padding:14px;font-size:12px;">
      <div style="font-weight:700;color:var(--accent);margin-bottom:4px;"><i class="fas fa-info-circle"></i> Метод выявления двойников</div>
      Система фиксирует транспортные средства с одинаковым г/н в географически разнесённых точках в течение короткого времени — физически невозможный сценарий, свидетельствующий об использовании дубликата номерного знака. Применяется анализ АИПС «Автомобиль» и данных всех камер сети.
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-exclamation-triangle"></i>Подозрительные случаи — требуют проверки</div><span class="sbadge sb-warn">${DUPLICATES.length} записи</span></div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>ID случая</th><th>Г/Н (в дубле)</th><th>Камера А</th><th>Время А</th><th>Камера Б</th><th>Время Б</th><th>Расстояние</th><th>Скорость (нереальная)</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>${DUPLICATES.map((d,i)=>`<tr>
            <td class="mono" style="font-size:10.5px;color:var(--accent);">${d.id}</td>
            <td><span class="plate" style="background:var(--accent);">${d.plate}</span></td>
            <td class="mono" style="font-size:10.5px;">${d.camA}</td>
            <td class="mono" style="font-size:10.5px;">${d.timeA}</td>
            <td class="mono" style="font-size:10.5px;">${d.camB}</td>
            <td class="mono" style="font-size:10.5px;">${d.timeB}</td>
            <td style="font-size:11px;">${d.dist} км</td>
            <td style="font-size:11.5px;font-weight:700;color:${d.speed>50000?'var(--accent-red)':'var(--text2)'};">${(d.speed/1000).toFixed(0)} тыс. км/ч</td>
            <td><span class="sbadge ${d.status==='suspicious'?'sb-warn':'sb-done'}" style="font-size:9px;">${d.status==='suspicious'?'Подозрительно':'Решено'}</span></td>
            <td><div style="display:flex;gap:3px;">
              <button class="btn btn-w btn-sm" onclick="s5_investigateDuplicate(${i})"><i class="fas fa-search"></i> Проверить</button>
            </div></td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
  s5_markQuest(11);
}
function s5_investigateDuplicate(i){
  const d=DUPLICATES[i];
  toast(`${d.id}: материалы проверки переданы в ГИБДД. Г/Н ${d.plate} может быть двойником.`,'warning');
  s5_markQuest(11);
}

/* ============================================================
   QUEST SYSTEM
   ============================================================ */
const QSTEPS=[
  {n:1,title:'Аналитический центр',text:'Изучите панель <strong>Аналитического центра</strong>. Найдите пиковые часы нарушений на графике «Динамика по часам».'},
  {n:2,title:'Экспорт аналитики',text:'Нажмите кнопку <strong>«Экспорт»</strong> в правом верхнем углу аналитического центра.'},
  {n:3,title:'Работа с отчётами',text:'Откройте раздел <strong>«Отчёты»</strong>. Скачайте любой готовый отчёт, нажав кнопку <i class="fas fa-download"></i>.'},
  {n:4,title:'Тепловая карта',text:'Откройте <strong>«Тепловую карту»</strong>. Определите по карте самое «горячее» время суток для нарушений.'},
  {n:5,title:'KPI операторов',text:'Откройте раздел <strong>«KPI операторов»</strong>. Найдите оператора с наилучшей эффективностью.'},
  {n:6,title:'Мониторинг системы',text:'Откройте <strong>«Мониторинг системы»</strong>. Найдите подсистему со статусом «МЕДЛЕННО».'},
  {n:7,title:'Топология сети',text:'Откройте <strong>«Топологию сети»</strong> и нажмите на блок <strong>«ЦОД ЦАФАП»</strong> для просмотра характеристик.'},
  {n:8,title:'Карта камер',text:'Откройте <strong>«Карту камер»</strong>. Определите количество offline-камер и их адреса.'},
  {n:9,title:'Инциденты',text:'Откройте <strong>«Панель инцидентов»</strong>. Нажмите на критический инцидент (красный) для просмотра деталей.'},
  {n:10,title:'Поиск ТС в розыске',text:'Откройте <strong>«Реестр розыска ТС»</strong>. Введите госномер <strong>А177МС77</strong> в поле поиска.'},
  {n:11,title:'Синхронизация с ФБД',text:'Нажмите кнопку <strong>«Синхр. с ФБД МВД»</strong> для обновления данных из федеральной базы розыска.'},
  {n:12,title:'Переход к Этапу 6',text:'Отличная работа! Вы освоили аналитический модуль. Перейдите к <strong>Этапу 6: Администрирование</strong>.'}
];
const HINTS=[
  {t:'Аналитика в ЦАФАП',txt:'Аналитический модуль формирует отчётность для УГИБДД МВД, региональных органов исполнительной власти и федеральных сводных докладов.'},
  {t:'Тепловая карта',txt:'Позволяет выявить временные паттерны нарушений для оптимизации расстановки сотрудников ДПС и планирования мест установки новых камер.'},
  {t:'Мониторинг инфраструктуры',txt:'Непрерывный мониторинг всех компонентов системы: серверов OCR, БД, API внешних систем. SLA: доступность 99.95% в месяц.'},
  {t:'Реестр розыска ТС',txt:'Интегрирован с федеральной базой данных розыска МВД (ФБД). Каждое нарушение автоматически проверяется — не находится ли ТС в розыске.'}
];
const GLOSSARY=[
  {t:'KPI',d:'Key Performance Indicators — ключевые показатели эффективности'},
  {t:'SLA',d:'Service Level Agreement — соглашение об уровне обслуживания'},
  {t:'ФБД МВД',d:'Федеральная база данных МВД (розыск ТС)'},
  {t:'АИПС',d:'Автоматизированная информационно-поисковая система'},
  {t:'Тепловая карта',d:'Визуализация интенсивности нарушений по времени/местам'},
  {t:'Дубль г/н',d:'Ненастоящий номерной знак — копия чужого г/н (нарушение)'},
  {t:'Failover',d:'Автоматическое переключение на резервный сервер при сбое'},
  {t:'OCR-кластер',d:'Группа серверов для распознавания госномеров с камер'},
  {t:'Интерпол',d:'Международная полицейская организация — международный розыск'},
  {t:'ДПС',d:'Дорожно-патрульная служба ГИБДД'}
];

function s5_initQuest(){S5T.quest.done=[];S5T.quest.step=0;s5_updateQuestUI();s5_renderInstContent();}
function s5_markQuest(idx){if(!S5T.quest.done.includes(idx)){S5T.quest.done.push(idx);s5_updateQuestUI();logEvent('quest_step',{step:idx,title:QSTEPS[idx]?.title||'',total:QSTEPS.length});toast(`✅ Шаг ${idx+1}: ${QSTEPS[idx]?.title||''}!`,'success');}}
function s5_nextQuest(){if(S5T.quest.step<QSTEPS.length-1){s5_markQuest(S5T.quest.step);S5T.quest.step++;s5_updateQuestUI();}else{toast('🎓 Этап 5 пройден! Переходите к Этапу 6.','success');s5_markQuest(S5T.quest.step);}}
function s5_restartQuest(){S5T.quest.done=[];S5T.quest.step=0;s5_updateQuestUI();toast('Квест перезапущен','info');}
function s5_updateQuestUI(){
  const pct=Math.round((S5T.quest.done.length/S5T.quest.total)*100);
  const el=document.getElementById('questPct');if(el)el.textContent=pct+'%';
  const pf=document.getElementById('instProgFill');if(pf)pf.style.width=pct+'%';
  const pt=document.getElementById('instProgTxt');if(pt)pt.textContent=`${S5T.quest.done.length}/${S5T.quest.total} шагов`;
  s5_renderInstContent();
}
function s5_switchInstTab(el,tab){document.querySelectorAll('.inst-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');S5T.instTab=tab;s5_renderInstContent();}
function s5_renderInstContent(){
  const body=document.getElementById('instBody');if(!body)return;
  const tab=S5T.instTab||'mission';
  if(tab==='mission'){
    const cur=S5T.quest.step;
    body.innerHTML=`<div>
      <div style="font-size:11.5px;font-weight:700;color:var(--primary);margin-bottom:7px;">📋 ЭТАП 5: Аналитика, мониторинг, розыск ТС</div>
      <div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:4px;">
        ${QSTEPS.map((s,i)=>{const done=S5T.quest.done.includes(i);const active=cur===i;return`<div style="text-align:center;flex-shrink:0;width:60px;"><div class="qs-num ${done?'qn-done':active?'qn-active':'qn-pend'}" style="margin:0 auto 3px;">${done?'✓':s.n}</div><div style="font-size:9px;color:${done?'var(--success)':active?'var(--primary)':'var(--text3)'};line-height:1.2;">${s.title.split(' ').slice(0,2).join(' ')}</div></div>`;}).join('')}
      </div>
      ${cur<QSTEPS.length?`<div style="margin-top:7px;padding:8px 10px;background:var(--primary-xs);border-radius:6px;border-left:3px solid var(--primary);"><div style="font-size:10.5px;font-weight:700;color:var(--primary);margin-bottom:2px;">▶ Шаг ${cur+1}/${QSTEPS.length}: ${QSTEPS[cur]?.title}</div><div style="font-size:11px;">${QSTEPS[cur]?.text}</div></div>`:'<div style="padding:8px;background:#E8F5E9;border-radius:6px;font-size:11px;color:var(--success);font-weight:700;">🎓 Этап 5 завершён! Переходите к Этапу 6.</div>'}
    </div>`;
  } else if(tab==='hints'){
    body.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;">${HINTS.map(h=>`<div style="flex:1;min-width:180px;padding:8px;background:#F8FAFF;border-radius:6px;border:1px solid var(--border2);"><div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:3px;">💡 ${h.t}</div><div style="font-size:10.5px;color:var(--text2);line-height:1.4;">${h.txt}</div></div>`).join('')}</div>`;
  } else if(tab==='progress'){
    const pct=Math.round((S5T.quest.done.length/S5T.quest.total)*100);
    body.innerHTML=`<div style="display:flex;gap:14px;align-items:center;">
      <div style="text-align:center;padding:10px 18px;background:var(--primary-xs);border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:28px;font-weight:800;color:var(--primary);font-family:'Courier New',monospace;">${pct}%</div>
        <div style="font-size:10px;color:var(--text2);">Этап 5</div>
      </div>
      <div style="flex:1;"><div style="height:10px;background:var(--border);border-radius:5px;overflow:hidden;margin-bottom:7px;"><div style="height:100%;width:${pct}%;background:var(--primary);border-radius:5px;"></div></div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <span style="font-size:10px;background:#E8F5E9;color:var(--success);padding:2px 8px;border-radius:10px;">✓ ${S5T.quest.done.length}</span>
          <span style="font-size:10px;background:var(--primary-xs);color:var(--primary);padding:2px 8px;border-radius:10px;">▶ ${S5T.quest.total-S5T.quest.done.length}</span>
        </div>
      </div>
      <div style="font-size:10.5px;color:var(--text2);">
        <div>1-4. Этапы 1-4 ✅</div>
        <div style="font-weight:700;color:var(--primary);">5. Аналитика ← здесь</div>
        <div style="color:var(--text3);">6. Администрирование</div>
      </div>
    </div>`;
  } else if(tab==='glossary'){
    body.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:5px;">${GLOSSARY.map(g=>`<div style="padding:4px 9px;background:#F8FAFF;border-radius:4px;border:1px solid var(--border2);"><span style="font-size:11px;font-weight:700;color:var(--primary);">${g.t}</span><span style="font-size:10px;color:var(--text2);margin-left:4px;">— ${g.d}</span></div>`).join('')}</div>`;
  }
}
function s5_toggleInst(){
  S5T.instCollapsed=!S5T.instCollapsed;
  const c=document.getElementById('instContent'),ico=document.getElementById('instTogIco'),panel=document.getElementById('instPanel');
  if(S5T.instCollapsed){c.style.display='none';panel.style.height='42px';ico.className='fas fa-chevron-up';}
  else{c.style.display='';panel.style.height='var(--inst)';ico.className='fas fa-chevron-down';}
}
function toast(msg,type='info'){
  logEvent('notification',{message:msg,level:type});
  const box=document.getElementById('toastBox');
  const icons={info:'fa-info-circle',success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle'};
  const colors={info:'#1565C0',success:'#2E7D32',error:'#C62828',warning:'#F57C00'};
  const d=document.createElement('div');d.className=`toast ${type}`;
  d.innerHTML=`<i class="fas ${icons[type]||icons.info}" style="color:${colors[type]||colors.info};flex-shrink:0;font-size:14px;"></i><span>${msg}</span>`;
  box.appendChild(d);
  setTimeout(()=>{d.style.transition='opacity .3s';d.style.opacity='0';setTimeout(()=>d.remove(),300);},3800);
}


/* ------ Stage 5 exports ------ */
  window.s5_startLive = (typeof s5_startLive!=="undefined") ? s5_startLive : window.s5_startLive;
  window.s5_setSection = (typeof s5_setSection!=="undefined") ? s5_setSection : window.s5_setSection;
  window.s5_renderAnalytics = (typeof s5_renderAnalytics!=="undefined") ? s5_renderAnalytics : window.s5_renderAnalytics;
  window.s5_exportAnalytics = (typeof s5_exportAnalytics!=="undefined") ? s5_exportAnalytics : window.s5_exportAnalytics;
  window.s5_renderReports = (typeof s5_renderReports!=="undefined") ? s5_renderReports : window.s5_renderReports;
  window.s5_quickReport = (typeof s5_quickReport!=="undefined") ? s5_quickReport : window.s5_quickReport;
  window.s5_generateReport = (typeof s5_generateReport!=="undefined") ? s5_generateReport : window.s5_generateReport;
  window.s5_downloadReport = (typeof s5_downloadReport!=="undefined") ? s5_downloadReport : window.s5_downloadReport;
  window.s5_viewReport = (typeof s5_viewReport!=="undefined") ? s5_viewReport : window.s5_viewReport;
  window.s5_renderHeatmap = (typeof s5_renderHeatmap!=="undefined") ? s5_renderHeatmap : window.s5_renderHeatmap;
  window.s5_renderKPI = (typeof s5_renderKPI!=="undefined") ? s5_renderKPI : window.s5_renderKPI;
  window.s5_renderMonitor = (typeof s5_renderMonitor!=="undefined") ? s5_renderMonitor : window.s5_renderMonitor;
  window.s5_startSysLog = (typeof s5_startSysLog!=="undefined") ? s5_startSysLog : window.s5_startSysLog;
  window.s5_refreshMetrics = (typeof s5_refreshMetrics!=="undefined") ? s5_refreshMetrics : window.s5_refreshMetrics;
  window.s5_renderInfra = (typeof s5_renderInfra!=="undefined") ? s5_renderInfra : window.s5_renderInfra;
  window.s5_renderCamerasMap = (typeof s5_renderCamerasMap!=="undefined") ? s5_renderCamerasMap : window.s5_renderCamerasMap;
  window.s5_renderIncidents = (typeof s5_renderIncidents!=="undefined") ? s5_renderIncidents : window.s5_renderIncidents;
  window.s5_showIncident = (typeof s5_showIncident!=="undefined") ? s5_showIncident : window.s5_showIncident;
  window.s5_createIncident = (typeof s5_createIncident!=="undefined") ? s5_createIncident : window.s5_createIncident;
  window.s5_renderWanted = (typeof s5_renderWanted!=="undefined") ? s5_renderWanted : window.s5_renderWanted;
  window.s5_searchWanted = (typeof s5_searchWanted!=="undefined") ? s5_searchWanted : window.s5_searchWanted;
  window.s5_showWanted = (typeof s5_showWanted!=="undefined") ? s5_showWanted : window.s5_showWanted;
  window.s5_markFound = (typeof s5_markFound!=="undefined") ? s5_markFound : window.s5_markFound;
  window.s5_addWanted = (typeof s5_addWanted!=="undefined") ? s5_addWanted : window.s5_addWanted;
  window.s5_syncFederal = (typeof s5_syncFederal!=="undefined") ? s5_syncFederal : window.s5_syncFederal;
  window.s5_renderDuplicates = (typeof s5_renderDuplicates!=="undefined") ? s5_renderDuplicates : window.s5_renderDuplicates;
  window.s5_investigateDuplicate = (typeof s5_investigateDuplicate!=="undefined") ? s5_investigateDuplicate : window.s5_investigateDuplicate;
  window.s5_initQuest = (typeof s5_initQuest!=="undefined") ? s5_initQuest : window.s5_initQuest;
  window.s5_markQuest = (typeof s5_markQuest!=="undefined") ? s5_markQuest : window.s5_markQuest;
  window.s5_nextQuest = (typeof s5_nextQuest!=="undefined") ? s5_nextQuest : window.s5_nextQuest;
  window.s5_restartQuest = (typeof s5_restartQuest!=="undefined") ? s5_restartQuest : window.s5_restartQuest;
  window.s5_updateQuestUI = (typeof s5_updateQuestUI!=="undefined") ? s5_updateQuestUI : window.s5_updateQuestUI;
  window.s5_switchInstTab = (typeof s5_switchInstTab!=="undefined") ? s5_switchInstTab : window.s5_switchInstTab;
  window.s5_renderInstContent = (typeof s5_renderInstContent!=="undefined") ? s5_renderInstContent : window.s5_renderInstContent;
  window.s5_toggleInst = (typeof s5_toggleInst!=="undefined") ? s5_toggleInst : window.s5_toggleInst;
  if(typeof S5T!=="undefined") window.S5T = S5T;
  window.clearLog=clearLog; window.s5_camFocus=s5_camFocus; window.s5_camMapFull=s5_camMapFull;
  window.s5_badges=function(){return {cameras:CAMERAS_ALL.filter(c=>c.st!=='online').length,wanted:WANTED_LIST.length};};
})(); /* end Stage 5 IIFE */
/* initStage5 */
function initStage5(){if(typeof s5_setSection==="function")s5_setSection("analytics",null);}
