;(function() {
/* ------ Stage 2 scope start ------ */
/* ================================================================
   ЭТАП 2 — КОД (namespace: s2_)
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
/* Данные берутся из баз: data/fvf_complexes.js (комплексы), data/fixations.js (снимки и результат OCR),
   data/fis_gibdd_m.js (ТС и владельцы). См. js/db/db.js */
const CAMERAS=CAFAP_DB.fvf.region('77').map(c=>({id:c.id,addr:c.addr,model:c.modelFull,idPoverkiNum:c.poverkaNo,idSTC:c.stc,limit:c.speedLimit,lat:c.lat,lon:c.lon,poverkaUntil:c.poverkaUntil,status:c.status}));

// Генерация очереди из базы фиксаций: снимок, госномер, результат OCR и скорость берутся из записи фиксации
function genViolations(n){
  const now=new Date();
  return CAFAP_DB.fixations.sample(n).map((smp,i)=>{
    const f=smp.fix, c=smp.cam||{};
    const vt=VTYPES.find(x=>x.code===f.article)||VTYPES[0];
    const cam={id:c.id,addr:c.addr,direction:c.direction,district:c.district,model:c.modelFull,idPoverkiNum:c.poverkaNo,idSTC:c.stc,limit:c.speedLimit,lat:c.lat,lon:c.lon,poverkaUntil:c.poverkaUntil};
    const minAgo=Math.floor(Math.random()*480);
    const t=new Date(now-minAgo*60000);
    const statuses=['new','new','new','processing','done','error'];
    const status=f.ocrPlate!==f.plate?(Math.random()<.5?'error':'new'):statuses[Math.floor(Math.random()*statuses.length)];
    return{
      id:`ДЕЛ-2026-${String(10000+i).padStart(5,'0')}`,
      caseNum:`КС-77-2026-${String(i+1).padStart(6,'0')}`,
      time:t.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
      date:t.toLocaleDateString('ru'),
      cam,plate:f.plate,ocrPlate:f.ocrPlate,ocrConf:f.ocrConf,ocrCorrect:f.ocrPlate===f.plate,
      vtype:vt,status,measSpeed:f.speed,limit:f.limit||vt.limit||0,ts:t,lane:f.lane,
      image:f.file,fixId:f.id,scene:f.scene,vehicleId:f.vehicleId,geom:f.geom||null,aspect:f.aspect||1280/720,real:!!f.real
    };
  }).sort((a,b)=>b.ts-a.ts);
}

/* Снимок фиксации из базы (assets/snapshots) + служебная плашка поверх изображения */
function s2_photoHTML(v,h,id,live){
  const lim=v.vtype.speed?` · ${v.measSpeed} км/ч (лим. ${v.limit||v.vtype.limit})`:'';
  const confCol=v.ocrConf>=85?'#4CAF50':v.ocrConf>=65?'#FF9800':'#f44336';
  return `<div class="ocr-photo snap-wrap" ${id?`id="${id}"`:''} style="height:${h}px;position:relative;overflow:hidden;background:#0b0e14;cursor:zoom-in;transition:height .25s;" onclick="s2_zoomPhoto(this,${h})" title="Нажмите, чтобы увеличить снимок">
    <img class="snap-img" src="${v.image}" alt="Снимок фиксации ${v.fixId||''}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div style="display:none;position:absolute;inset:0;align-items:center;justify-content:center;color:#9aa;font-size:12px;">Снимок недоступен: ${v.image||'—'}</div>
    <div style="position:absolute;left:0;right:0;bottom:0;padding:14px 10px 6px;background:linear-gradient(transparent,rgba(0,0,0,.82));font-family:'Courier New',monospace;font-size:10px;line-height:1.5;pointer-events:none;">
      <div style="color:#00FF41;">${v.id} · ${v.cam.id} · ${v.date} ${v.time}</div>
      <div style="color:#fff;">${v.cam.addr} · Полоса ${v.lane} · ст.КоАП ${v.vtype.code}${lim}</div>
    </div>
    ${live?`<button class="btn btn-s btn-sm" style="position:absolute;top:6px;left:6px;z-index:3;font-size:11px;" onclick="event.stopPropagation();s2_openPhotoMaterial()"><i class="fas fa-images"></i> Фотоматериал (4 кадра)</button>`:''}
    ${live?`<div style="position:absolute;top:0;right:0;background:rgba(0,0,0,.65);padding:4px 10px;text-align:center;font-family:'Courier New',monospace;pointer-events:none;"><div style="font-size:8px;color:#aaa;">OCR CONF</div><div style="font-size:12px;font-weight:700;color:${confCol};">${v.ocrConf}%</div></div><div class="scan-line" id="scanLine"></div>`:''}
  </div>`;
}
/* ============================================================
   ФОТОМАТЕРИАЛ ФИКСАЦИИ — 4 кадра и текстовый блок (как в материалах реальных комплексов):
   кадр 1 — обзорный, кадр 2 — следующий (+0,6 с), фото ТС, увеличенный номер; рамки детектора зелёные.
   ============================================================ */
function s2_msOf(v){let h=0;const k=(v.id||'')+(v.fixId||'');for(let i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))>>>0;return h%1000;}
function s2_fmtTs(v,addMs){
  const base=(v.ts instanceof Date)?v.ts:new Date();
  const total=s2_msOf(v)+addMs;
  const d=new Date(base.getTime()+Math.floor(total/1000)*1000);
  const p=(n,w=2)=>String(n).padStart(w,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(total%1000,3)}`;
}
/* Панель-«окно» с кадрированием изображения вокруг (cx,cy) шириной rw (доли кадра); boxes — рамки в долях кадра */
function s2_panel(v,cx,cy,rw,A,boxes,opt){
  opt=opt||{};
  const ASP=v.aspect||(1280/720);
  let rh=rw*ASP/A;
  if(rh>1){rh=1;rw=rh*A/ASP;}
  if(rw>1){rw=1;rh=rw*ASP/A;}
  cx=Math.min(Math.max(cx,rw/2),1-rw/2);cy=Math.min(Math.max(cy,rh/2),1-rh/2);
  const px=rw<1?(cx-rw/2)/(1-rw)*100:0, py=rh<1?(cy-rh/2)/(1-rh)*100:0;
  const bx=(boxes||[]).map(b=>{
    const l=(b[0]-(cx-rw/2))/rw*100,t=(b[1]-(cy-rh/2))/rh*100,w=b[2]/rw*100,h=b[3]/rh*100;
    if(l>100||t>100||l+w<0||t+h<0)return '';
    return `<div style="position:absolute;left:${l.toFixed(2)}%;top:${t.toFixed(2)}%;width:${w.toFixed(2)}%;height:${h.toFixed(2)}%;border:2px solid #00e676;box-sizing:border-box;"></div>`;
  }).join('');
  let extra='';
  if(opt.line&&boxes&&boxes[0]){const b=boxes[0];const ex=((b[0]+b[2]/2)-(cx-rw/2))/rw*100,ey=((b[1]+b[3]/2)-(cy-rh/2))/rh*100;
    extra=`<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;"><line x1="${Math.max(2,ex-34).toFixed(1)}" y1="${Math.max(2,ey-48).toFixed(1)}" x2="${Math.min(98,ex+10).toFixed(1)}" y2="${Math.min(98,ey+30).toFixed(1)}" stroke="#00e676" stroke-width="1.2" vector-effect="non-scaling-stroke"/></svg>`;}
  return `<div style="position:relative;overflow:hidden;background:#000;aspect-ratio:${A};">
    <div class="ms-img" style="position:absolute;inset:0;background-image:url('${v.image}');background-repeat:no-repeat;background-size:${(100/rw).toFixed(2)}% auto;background-position:${px.toFixed(2)}% ${py.toFixed(2)}%;"></div>${extra}${bx}</div>`;
}
function s2_photoMaterialHTML(v){
  const g=v.geom||{car:[.25,.25,.5,.62],plate:[.43,.64,.14,.06],lights:[]};
  const car=g.car,pl=g.plate,cxC=car[0]+car[2]/2,cyC=car[1]+car[3]/2;
  const A=1.35;
  const frame1=s2_panel(v,cxC,cyC-.04,.80,A,[car,pl,...g.lights],{line:true});
  const frame2=s2_panel(v,cxC,cyC+.02,.56,A,[car,pl,...g.lights]);
  const vehicle=s2_panel(v,cxC,cyC+.03,Math.min(1,car[2]*1.28),A,[...g.lights,pl]);
  const plate=`<div style="background:#000;aspect-ratio:${A};display:flex;align-items:center;"><div style="width:100%;">${s2_panel(v,pl[0]+pl[2]/2,pl[1]+pl[3]/2,Math.min(1,pl[2]*1.5),4.0,[])}</div></div>`;
  const cap=t=>`<div class="ms-cap">${t}</div>`;
  const vt=v.vtype, cam=v.cam;
  const viol=vt.speed?`${vt.code} ${vt.name}. Скорость ${v.measSpeed} км/ч при ограничении ${v.limit||vt.limit} км/ч`:`${vt.code} ${vt.name}`;
  return `<div class="ms ms-ir" id="msRoot">
    <div class="ms-grid">
      <div>${frame1}${cap('Дата/Время: '+s2_fmtTs(v,0))}</div>
      <div>${frame2}${cap('Дата/Время: '+s2_fmtTs(v,601))}</div>
      <div>${vehicle}${cap('Фото ТС · полоса '+v.lane)}</div>
      <div>${plate}${cap('Госномер (OCR): '+v.ocrPlate+' · уверенность '+v.ocrConf+'%')}</div>
    </div>
    <div class="ms-txt">
      <div>${viol}</div>
      <div>Комплекс: ${cam.model||'—'}${cam.idPoverkiNum?' · поверка '+cam.idPoverkiNum+' до '+(cam.poverkaUntil||'—'):''}</div>
      <div>Дата/Время: ${s2_fmtTs(v,601)}.</div>
      <div>Адрес установки: ${cam.addr}${cam.district?', '+cam.district:''}</div>
      <div class="ms-two"><div>Направление: ${cam.direction||'—'}.</div><div>Координаты: ${(cam.lat||0).toFixed(6)}, ${(cam.lon||0).toFixed(6)}</div></div>
    </div>
    <div class="ms-tools"><label><input type="checkbox" checked onchange="document.getElementById('msRoot').classList.toggle('ms-ir',this.checked)"> ИК-режим (чёрно-белый, как у комплекса)</label>${v.real?'':'<span>Синтетический снимок: сцена нарисована по параметрам записи фиксации '+v.fixId+'</span>'}</div>
  </div>`;
}
function s2_openPhotoMaterial(){
  const v=S2T.current;if(!v)return;
  let m=document.getElementById('msModal');
  if(!m){m=document.createElement('div');m.id='msModal';m.className='modal-bg';m.onclick=function(e){if(e.target===m)closeModal('msModal');};document.body.appendChild(m);}
  m.innerHTML=`<div class="modal-box" style="width:900px;max-width:96vw;">
    <div class="modal-hdr"><div class="modal-title"><i class="fas fa-images" style="color:var(--primary);"></i> Фотоматериал фиксации · ${v.id}</div><button class="btn btn-s btn-sm" onclick="closeModal('msModal')"><i class="fas fa-times"></i></button></div>
    ${s2_photoMaterialHTML(v)}</div>`;
  m.style.display='flex';
  logEvent('photo_material',{caseId:v.id,fixId:v.fixId});
}
function s2_zoomPhoto(el,h){
  const z=el.dataset.z==='1';
  el.style.height=(z?h:Math.round(h*2.2))+'px';el.dataset.z=z?'0':'1';el.style.cursor=z?'zoom-in':'zoom-out';
}

/* ============================================================
   СОСТОЯНИЕ
   ============================================================ */
const S2T={
  violations:[],
  current:null,
  owner:null,
  vehicle:null,
  plateCorrected:false,
  plateConfirmed:false,
  ownerFound:false,
  caseCreated:false,
  caseSubmitted:false,
  caseDraft:{},
  session:{role:'operator',login:'ivanov_op',startTime:new Date()},
  quest:SPA_STATE.quest[2],
  instTab:'mission',
  instCollapsed:false,
  scanActive:false
};

/* ============================================================
   INIT
   ============================================================ */
/* S2: load handled by SPA */

/* ============================================================
   SECTIONS
   ============================================================ */
function s2_setSection(sec,navEl){
  if(!S2T.violations.length)S2T.violations=genViolations(247);
  document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active'));
  if(navEl)navEl.classList.add('active');
  const mc=document.getElementById('mainContent2');
  if(sec==='ocr')s2_renderOCR(mc);
  else if(sec==='queue')s2_renderQueue(mc);
  else if(sec==='owner')s2_renderOwnerSearch(mc);
  else if(sec==='case')s2_renderCaseForm(mc);
  else if(sec==='evidence')s2_renderEvidence(mc);
}

/* ============================================================
   OCR VERIFICATION PANEL
   ============================================================ */
function s2_renderOCR(mc){
  const newViolations=S2T.violations.filter(v=>v.status==='new'||v.status==='error').slice(0,8);
  mc.innerHTML=`
  <div style="display:flex;height:100%;overflow:hidden;">
    <!-- ЛЕВАЯ КОЛОНКА: очередь OCR -->
    <div style="width:300px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;">
      <div style="padding:10px 12px;background:#FAFCFF;border-bottom:1px solid var(--border2);display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:12.5px;font-weight:700;display:flex;align-items:center;gap:6px;"><i class="fas fa-inbox" style="color:var(--primary);"></i>Очередь OCR <span class="live-ind" style="margin-left:4px;">LIVE</span></div>
        <span class="sbadge sb-new" style="font-size:9.5px;">${newViolations.length} ожидают</span>
      </div>
      <div style="flex:1;overflow-y:auto;" id="ocrQueue">
        ${newViolations.map((v,i)=>`
        <div class="ocr-queue-item" id="oqi-${i}" onclick="s2_selectViolation(${i})" style="padding:9px 12px;border-bottom:1px solid var(--border2);cursor:pointer;transition:background .15s;" onmouseover="this.style.background='var(--primary-xs)'" onmouseout="if(!this.classList.contains('sel'))this.style.background='';">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
            <span class="mono" style="font-size:10.5px;color:var(--primary);font-weight:700;">${v.id}</span>
            <span class="sbadge ${v.status==='error'?'sb-err':'sb-new'}" style="font-size:9px;">${v.status==='error'?'Ошибка OCR':'Новое'}</span>
          </div>
          <div style="font-size:11px;color:var(--text2);">${v.cam.addr}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
            <span class="plate" style="font-size:10px;">${v.ocrPlate}</span>
            <span style="font-size:10px;color:${v.ocrConf>=85?'var(--success)':v.ocrConf>=65?'var(--accent)':'var(--accent-red)'};">
              <i class="fas fa-brain" style="font-size:9px;"></i> ${v.ocrConf}%
            </span>
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">${v.time} · ст.${v.vtype.code}</div>
        </div>`).join('')}
      </div>
    </div>

    <!-- ЦЕНТРАЛЬНАЯ ПАНЕЛЬ: OCR Верификация -->
    <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;" id="ocrCenter">
      <div style="text-align:center;padding:40px 20px;color:var(--text3);">
        <i class="fas fa-camera" style="font-size:48px;margin-bottom:12px;opacity:.3;"></i>
        <div style="font-size:14px;font-weight:600;">Выберите нарушение из очереди для начала OCR-верификации</div>
        <div style="font-size:12px;margin-top:8px;">Нажмите на любую запись в левой панели</div>
        <button class="btn btn-p" style="margin-top:14px;" onclick="s2_selectViolation(0)"><i class="fas fa-play"></i> Начать с первого</button>
      </div>
    </div>

    <!-- ПРАВАЯ КОЛОНКА: метаданные и история -->
    <div style="width:250px;flex-shrink:0;border-left:1px solid var(--border);overflow-y:auto;">
      <div style="padding:9px 12px;background:#FAFCFF;border-bottom:1px solid var(--border2);font-size:12px;font-weight:700;"><i class="fas fa-info-circle" style="color:var(--primary);"></i> Метаданные комплекса</div>
      <div style="padding:10px 12px;" id="ocrMeta">
        <div style="font-size:11px;color:var(--text3);text-align:center;margin-top:20px;">Выберите нарушение для отображения метаданных</div>
      </div>
    </div>
  </div>`;
  // Сохраняем список для s2_selectViolation
  window._ocrList=newViolations;
}

function s2_selectViolation(idx){
  const v=window._ocrList[idx];
  if(!v)return;
  S2T.current=v;
  // Обновляем контекст в sidebar
  setEl('ctxCase','textContent',v.id);
  setEl('ctxPlate','innerHTML',`<span class="plate" style="font-size:10px;">${v.plate}</span>`);
  setEl('ctxVtype','textContent',`ст.${v.vtype.code}`);
  // Подсветка выбранного
  document.querySelectorAll('.ocr-queue-item').forEach(el=>el.classList.remove('sel'));
  const qItem=document.getElementById(`oqi-${idx}`);
  if(qItem){qItem.classList.add('sel');qItem.style.background='var(--primary-lighter)';}
  // Рендер центральной панели
  s2_renderOCRCenter(v);
  s2_renderOCRMeta(v);
  s2_markQuest(0);
}

function s2_renderOCRCenter(v){
  const confClass=v.ocrConf>=85?'conf-high':v.ocrConf>=65?'conf-med':'conf-low';
  const confColor=v.ocrConf>=85?'var(--success)':v.ocrConf>=65?'var(--accent)':'var(--accent-red)';
  const center=document.getElementById('ocrCenter');
  center.innerHTML=`
    <!-- Шаги процесса -->
    <div class="step-bar">
      <div style="text-align:center;flex-shrink:0;">
        <div class="step-circle step-done">✓</div>
        <div class="step-label">Получение</div>
      </div>
      <div class="step-line done"></div>
      <div style="text-align:center;flex-shrink:0;">
        <div class="step-circle step-active" id="stepOCR">2</div>
        <div class="step-label">OCR-проверка</div>
      </div>
      <div class="step-line" id="lineOwner"></div>
      <div style="text-align:center;flex-shrink:0;">
        <div class="step-circle step-pend" id="stepOwner">3</div>
        <div class="step-label">Поиск владельца</div>
      </div>
      <div class="step-line" id="lineDeal"></div>
      <div style="text-align:center;flex-shrink:0;">
        <div class="step-circle step-pend" id="stepDeal">4</div>
        <div class="step-label">Создание дела</div>
      </div>
      <div class="step-line" id="lineSign"></div>
      <div style="text-align:center;flex-shrink:0;">
        <div class="step-circle step-pend" id="stepSign">5</div>
        <div class="step-label">Инспектор/ЭЦП</div>
      </div>
    </div>

    <!-- Фото с камеры -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-camera"></i>Фотоматериал с камеры ФВФ</div>
        <div style="display:flex;gap:6px;">
          <span class="sbadge sb-new">${v.cam.model}</span>
          <span class="sbadge sb-done mono" style="font-size:9px;">${v.date} ${v.time}</span>
        </div>
      </div>
      <div class="card-body" style="padding:0;">
        ${s2_photoHTML(v,200,'ocrPhoto',true)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 12px;background:#F8FAFF;border-top:1px solid var(--border2);">
          <div style="font-size:11px;color:var(--text2);">Координаты: <span class="mono" style="font-size:10.5px;">${(v.cam.lat||55.7558).toFixed(4)}, ${(v.cam.lon||37.6176).toFixed(4)}</span></div>
          <div style="font-size:11px;color:var(--text2);">Комплекс: <span style="font-weight:600;">${v.cam.model}</span></div>
          <div style="font-size:11px;color:var(--text2);">Поверка: <span style="font-weight:600;">${v.cam.idPoverkiNum}</span> до ${v.cam.poverkaUntil||'15.12.2026'}</div>
          <div style="font-size:11px;color:var(--text2);">СТС: <span class="mono" style="font-size:10.5px;">${v.cam.idSTC}</span></div>
        </div>
      </div>
    </div>

    <!-- OCR РЕЗУЛЬТАТ И ВЕРИФИКАЦИЯ -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-brain"></i>OCR-результат и верификация оператором</div>
        <div style="font-size:11px;color:var(--text2);">Погрешность измерения: ±1.0 км/ч</div>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <!-- Левая часть: OCR данные -->
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Распознано системой OCR:</div>
            <div style="font-size:28px;font-weight:800;letter-spacing:4px;font-family:'Courier New',monospace;text-align:center;padding:10px;background:#1a1a2e;color:#00FF41;border-radius:8px;margin-bottom:8px;">${v.ocrPlate}</div>
            <div style="margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;">
                <span>Уверенность OCR:</span>
                <span style="font-weight:700;color:${confColor};">${v.ocrConf}%</span>
              </div>
              <div class="ocr-confidence"><div class="${confClass}" style="width:${v.ocrConf}%;"></div></div>
            </div>
            ${!v.ocrCorrect?`<div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:6px;padding:7px 10px;font-size:11px;color:var(--accent-red);margin-bottom:8px;">
              <i class="fas fa-exclamation-triangle"></i> <strong>Низкая уверенность!</strong> Требуется ручная проверка номерного знака.
            </div>`:''}
            ${v.vtype.speed?`<div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:6px;padding:7px 10px;font-size:11px;color:var(--accent);">
              <div style="font-weight:700;">📏 Измеренная скорость: ${v.measSpeed} км/ч</div>
              <div>Ограничение: ${v.limit||v.vtype.limit} км/ч · Превышение: ${v.measSpeed-(v.limit||v.vtype.limit)} км/ч</div>
            </div>`:''}
          </div>
          <!-- Правая часть: корректировка -->
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">Верификация оператора:</div>
            <div class="form-group">
              <label class="form-label">Государственный регистрационный знак</label>
              <input type="text" class="plate-input" id="plateInput" value="${v.ocrPlate}" oninput="onPlateInput(this)" maxlength="12" placeholder="А000АА77">
            </div>
            <div style="font-size:10.5px;color:var(--text3);margin-bottom:10px;">Введите номер латиницей или кириллицей. Система автоматически конвертирует.</div>
            <div style="display:flex;gap:6px;margin-bottom:10px;">
              <button class="btn btn-g btn-sm" onclick="s2_confirmPlate()"><i class="fas fa-check"></i> Подтвердить номер</button>
              <button class="btn btn-d btn-sm" onclick="s2_rejectViolation()"><i class="fas fa-times"></i> Отклонить</button>
              <button class="btn btn-s btn-sm" onclick="s2_requestRepeat()"><i class="fas fa-redo"></i> Повтор фото</button>
            </div>
            <div id="plateResult"></div>
            <!-- Тип нарушения -->
            <div class="form-group" style="margin-top:8px;">
              <label class="form-label">Статья КоАП (автоопределено)</label>
              <select class="form-select" id="vtypeSelect" style="font-size:12px;">
                ${VTYPES.map(vt=>`<option value="${vt.code}" ${vt.code===v.vtype.code?'selected':''}>${vt.code} — ${vt.name} (${vt.fine.toLocaleString('ru')} ₽)</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- КНОПКИ ДЕЙСТВИЙ -->
    <div class="card">
      <div class="card-body" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-g btn-lg" id="btnFindOwner" onclick="s2_goFindOwner()" disabled style="opacity:.5;">
          <i class="fas fa-user-search"></i> Найти владельца ТС в РЭО ГИБДД
        </button>
        <button class="btn btn-s" onclick="s2_setSection('queue',document.getElementById('nav-queue'))"><i class="fas fa-arrow-left"></i> К очереди</button>
        <div style="margin-left:auto;font-size:11px;color:var(--text2);" id="ocrActionHint">
          ⬅ Сначала подтвердите госномер для продолжения
        </div>
      </div>
    </div>`;
  // Остановить линию сканирования через 3 сек
  setTimeout(()=>{const sl=document.getElementById('scanLine');if(sl)sl.style.display='none';},3000);
}

function s2_renderOCRMeta(v){
  const meta=document.getElementById('ocrMeta');if(!meta)return;
  meta.innerHTML=`
    <div style="font-size:10.5px;margin-bottom:10px;">
      <div class="owner-field"><span class="owner-label">ID комплекса</span><span class="owner-val mono">${v.cam.id}</span></div>
      <div class="owner-field"><span class="owner-label">Модель</span><span class="owner-val">${v.cam.model}</span></div>
      <div class="owner-field"><span class="owner-label">Поверка</span><span class="owner-val">${v.cam.idPoverkiNum}</span></div>
      <div class="owner-field"><span class="owner-label">Свидет. о поверке</span><span class="owner-val">до 15.12.2026</span></div>
      <div class="owner-field"><span class="owner-label">Погрешность</span><span class="owner-val mono">±1.0 км/ч</span></div>
      <div class="owner-field"><span class="owner-label">СТС</span><span class="owner-val mono">${v.cam.idSTC}</span></div>
    </div>
    <div style="font-size:10px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Данные нарушения</div>
    <div style="font-size:10.5px;">
      <div class="owner-field"><span class="owner-label">Дата/Время</span><span class="owner-val mono">${v.date} ${v.time}</span></div>
      <div class="owner-field"><span class="owner-label">Адрес</span><span class="owner-val">${v.cam.addr}</span></div>
      <div class="owner-field"><span class="owner-label">Полоса</span><span class="owner-val">${v.lane}</span></div>
      <div class="owner-field"><span class="owner-label">Статья</span><span class="owner-val">ст.${v.vtype.code} КоАП</span></div>
      ${v.vtype.speed?`<div class="owner-field"><span class="owner-label">Скорость</span><span class="owner-val" style="color:var(--accent-red);">${v.measSpeed} км/ч</span></div>`:''}
      <div class="owner-field"><span class="owner-label">Штраф</span><span class="owner-val" style="color:var(--success);">${v.vtype.fine.toLocaleString('ru')} ₽</span></div>
      <div class="owner-field"><span class="owner-label">OCR уверенность</span><span class="owner-val" style="color:${v.ocrConf>=85?'var(--success)':v.ocrConf>=65?'var(--accent)':'var(--accent-red)'};">${v.ocrConf}%</span></div>
    </div>
    <div style="margin-top:12px;padding:8px;background:#E8F5E9;border-radius:6px;font-size:10.5px;color:var(--success);">
      <i class="fas fa-shield-alt"></i> <strong>Доказательная база:</strong><br>
      • Фото нарушения<br>
      • Видеозапись<br>
      • Данные радара<br>
      • Сертификат ФВФ
    </div>`;
}

/* ============================================================
   OCR ACTIONS
   ============================================================ */
function onPlateInput(el){
  const _lm={A:'А',B:'В',E:'Е',K:'К',M:'М',H:'Н',O:'О',P:'Р',C:'С',T:'Т',Y:'У',X:'Х'};
  el.value=el.value.toUpperCase().replace(/[A-Z]/g,c=>_lm[c]||c).replace(/[^А-ЯЁ0-9]/g,'');
  el.classList.remove('ocr-ok','ocr-bad');
}

function s2_confirmPlate(){
  const inp=document.getElementById('plateInput');
  if(!inp||!S2T.current)return;
  const plate=inp.value.trim();
  if(plate.length<6){toast('Введите корректный госномер (минимум 6 символов)','error');return;}
  S2T.plateCorrected=plate!==S2T.current.ocrPlate;
  S2T.plateConfirmed=true;
  S2T.current.plate=plate;
  setEl('ctxPlate','innerHTML',`<span class="plate corrected" style="font-size:10px;">${plate}</span>`);
  inp.classList.add('ocr-ok');
  const res=document.getElementById('plateResult');
  if(res){
    res.innerHTML=`<div style="background:#E8F5E9;border:1px solid #C8E6C9;border-radius:6px;padding:7px 10px;font-size:11.5px;color:var(--success);">
      <i class="fas fa-check-circle"></i> <strong>Номер подтверждён${S2T.plateCorrected?' (скорректирован оператором)':''}</strong>
      ${S2T.plateCorrected?`<div style="margin-top:3px;font-size:10.5px;">OCR: <span class="mono">${S2T.current.ocrPlate}</span> → Оператор: <span class="mono">${plate}</span></div>`:''}
    </div>`;
  }
  // Активируем кнопку
  const btn=document.getElementById('btnFindOwner');
  if(btn){btn.disabled=false;btn.style.opacity='1';}
  const hint=document.getElementById('ocrActionHint');
  if(hint)hint.innerHTML='✅ Номер подтверждён. Теперь найдите владельца ТС.';
  // Прогресс
  s2_updateStageProgress(1);
  s2_markQuest(1);
  toast(`Госномер ${plate} подтверждён оператором`,'success');
}

function s2_rejectViolation(){
  if(!S2T.current)return;
  if(confirm(`Отклонить материал ${S2T.current.id}? Причину укажите в журнале.`)){
    toast(`Материал ${S2T.current.id} отклонён. Записано в журнал аудита.`,'warning');
    S2T.current.status='rejected';
    s2_markQuest(2);
  }
}
function s2_requestRepeat(){
  toast('Запрос на повторную фотофиксацию отправлен на комплекс','info');
  setTimeout(()=>toast('Ответ от комплекса: новый снимок получен','success'),2000);
}

function s2_goFindOwner(){
  if(!S2T.plateConfirmed){toast('Сначала подтвердите госномер','warning');return;}
  s2_markQuest(3);
  s2_setSection('owner',document.getElementById('nav-owner'));
}

/* ============================================================
   QUEUE SECTION
   ============================================================ */
function s2_renderQueue(mc){
  const rows=S2T.violations.slice(0,20);
  mc.innerHTML=`
  <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:14px;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-inbox" style="color:var(--primary);"></i>Полная очередь нарушений <span class="live-ind" style="margin-left:4px;">LIVE</span></h2>
      <div style="display:flex;gap:6px;">
        <input type="text" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:11.5px;width:180px;" placeholder="🔍 Поиск по г/н или ID...">
        <select style="padding:5px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;" onchange="s2_filterQ(this.value)">
          <option>Все статусы</option><option value="new">Новые</option><option value="processing">Обработка</option><option value="done">Готово</option><option value="error">Ошибка</option>
        </select>
        <button class="btn btn-p btn-sm" onclick="s2_setSection('ocr',document.getElementById('nav-ocr'))"><i class="fas fa-camera"></i> OCR-верификация</button>
      </div>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
      <div style="overflow-y:auto;flex:1;">
        <table class="data-table">
          <thead><tr><th>№ Дела</th><th>Дата/Время</th><th>Камера</th><th>Г/Н (OCR)</th><th>Нарушение</th><th>Скорость</th><th>Штраф</th><th>OCR %</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            ${rows.map(v=>{
              const conf=v.ocrConf;
              const confColor=conf>=85?'var(--success)':conf>=65?'var(--accent)':'var(--accent-red)';
              const sb={new:'sb-new',processing:'sb-proc',done:'sb-done',error:'sb-err'}[v.status]||'sb-new';
              const sbl={new:'Новое',processing:'Обработка',done:'Готово',error:'Ошибка OCR'}[v.status]||'Новое';
              return`<tr>
                <td class="mono" style="font-size:10.5px;color:var(--primary);">${v.id}</td>
                <td class="mono" style="font-size:10.5px;">${v.date}<br>${v.time}</td>
                <td style="font-size:10.5px;">${v.cam.id}<div style="font-size:9.5px;color:var(--text3);">${v.cam.addr}</div></td>
                <td><span class="plate" style="font-size:10.5px;">${v.ocrPlate}</span>${v.ocrPlate!==v.plate?`<div style="font-size:9px;color:var(--accent-red);">≠ реальный</div>`:''}</td>
                <td style="font-size:10.5px;"><div class="mono" style="color:var(--primary);font-weight:700;">ст.${v.vtype.code}</div><div style="color:var(--text3);font-size:9.5px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.vtype.name}</div></td>
                <td style="font-size:10.5px;">${v.vtype.speed?`<span style="color:var(--accent-red);font-weight:700;" class="mono">${v.measSpeed} км/ч</span>`:'—'}</td>
                <td style="font-size:11px;font-weight:700;color:var(--success);" class="mono">${v.vtype.fine.toLocaleString('ru')} ₽</td>
                <td><span style="font-size:11px;font-weight:700;color:${confColor};" class="mono">${conf}%</span></td>
                <td><span class="sbadge ${sb}" style="font-size:9px;">${sbl}</span></td>
                <td><div style="display:flex;gap:3px;">
                  <button class="btn btn-p btn-sm" onclick="s2_quickOpenOCR('${v.id}')" title="Верификация"><i class="fas fa-camera"></i></button>
                  <button class="btn btn-s btn-sm" onclick="toast('Просмотр: ${v.id}','info')" title="Просмотр"><i class="fas fa-eye"></i></button>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 9px;background:#FAFCFF;border-top:1px solid var(--border2);font-size:11px;color:var(--text2);">
        <div>Всего: <strong>${S2T.violations.length}</strong> нарушений · Новых: <strong>${S2T.violations.filter(v=>v.status==='new').length}</strong></div>
        <div style="display:flex;gap:3px;">
          <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:var(--primary);color:#fff;font-size:11px;">1</div>
          <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:#F0F4FA;border:1px solid var(--border);cursor:pointer;font-size:11px;">2</div>
          <div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;background:#F0F4FA;border:1px solid var(--border);cursor:pointer;font-size:11px;">3</div>
        </div>
      </div>
    </div>
  </div>`;
}
function s2_filterQ(status){toast(`Фильтр: ${status||'Все'}. Найдено: ${S2T.violations.filter(v=>!status||v.status===status).length} записей`,'info');}
function s2_quickOpenOCR(id){
  const v=S2T.violations.find(x=>x.id===id);
  if(v){
    window._ocrList=S2T.violations.filter(x=>x.status==='new'||x.status==='error');
    const idx=window._ocrList.findIndex(x=>x.id===id);
    s2_setSection('ocr',document.getElementById('nav-ocr'));
    setTimeout(()=>s2_selectViolation(idx>=0?idx:0),100);
  }
}

/* ============================================================
   OWNER SEARCH SECTION
   ============================================================ */
function s2_renderOwnerSearch(mc){
  const plate=S2T.current?.plate||'';
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-user-search" style="color:var(--primary);"></i>Поиск владельца ТС в базах данных</h2>
    </div>

    <!-- ФОРМА ПОИСКА -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-database"></i>Запрос к ФИС ГИБДД-М / РЭО</div></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div>
            <div class="form-group">
              <label class="form-label">Государственный номер ТС</label>
              <input type="text" class="form-control plate-input" id="searchPlate" value="${plate}" style="font-size:18px;letter-spacing:3px;text-align:center;" placeholder="А000АА77">
            </div>
          </div>
          <div>
            <div class="form-group">
              <label class="form-label">Источник данных</label>
              <select class="form-select">
                <option selected>РЭО ГИБДД (первичный)</option>
                <option>ФИС ГИБДД-М (федеральный)</option>
                <option>АИПС «Автомобиль»</option>
                <option>Росреестр ТС</option>
              </select>
            </div>
          </div>
          <div>
            <div class="form-group">
              <label class="form-label">Дополнительно</label>
              <select class="form-select">
                <option>Проверить ограничения</option>
                <option>Проверить розыск</option>
                <option>История нарушений</option>
              </select>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button class="btn btn-p" onclick="s2_doOwnerSearch()"><i class="fas fa-search"></i> Найти владельца</button>
          <button class="btn btn-s" onclick="s2_searchByVIN()"><i class="fas fa-barcode"></i> По VIN</button>
          <button class="btn btn-s" onclick="s2_searchByChassis()"><i class="fas fa-cogs"></i> По кузову/двигателю</button>
        </div>
      </div>
    </div>

    <!-- РЕЗУЛЬТАТ ПОИСКА -->
    <div id="ownerResult"></div>

    <!-- ИСТОРИЯ НАРУШЕНИЙ -->
    <div id="violHistory"></div>
  </div>`;
  // Если уже есть результат
  if(S2T.ownerFound&&S2T.owner) s2_displayOwnerResult(S2T.owner,S2T.vehicle);
}

function s2_doOwnerSearch(){
  const plate=document.getElementById('searchPlate').value.trim().toUpperCase();
  if(!plate){toast('Введите госномер ТС','error');return;}
  const res=document.getElementById('ownerResult');
  res.innerHTML=`<div class="card"><div class="card-body" style="text-align:center;padding:24px;">
    <i class="fas fa-circle-notch fa-spin" style="font-size:32px;color:var(--primary);margin-bottom:10px;"></i>
    <div style="font-size:13px;font-weight:600;">Запрос к РЭО ГИБДД...</div>
    <div style="font-size:11px;color:var(--text3);margin-top:4px;" id="searchLog">Подключение к ФИС ГИБДД-М...</div>
  </div></div>`;
  const logs=['Подключение к ФИС ГИБДД-М...','Запрос к РЭО региона 77...','Поиск по базе ТС...','Получение данных владельца...','Проверка ограничений...','Формирование ответа...'];
  let i=0;
  const int=setInterval(()=>{
    const logEl=document.getElementById('searchLog');
    if(logEl&&i<logs.length)logEl.textContent=logs[i++];
  },300);
  setTimeout(()=>{
    clearInterval(int);
    // Запрос к базе ФИС ГИБДД-М (data/fis_gibdd_m.js)
    const card=CAFAP_DB.fis.lookup(plate);
    if(!card||!card.owner){
      S2T.ownerFound=false;S2T.fisCard=null;
      res.innerHTML=`<div class="card"><div class="card-body" style="text-align:center;padding:22px;">
        <i class="fas fa-search-minus" style="font-size:30px;color:var(--accent-red);margin-bottom:8px;"></i>
        <div style="font-size:13px;font-weight:700;">ТС с госномером <span class="plate" style="font-size:11px;">${plate}</span> в ФИС ГИБДД-М не найдено</div>
        <div style="font-size:11px;color:var(--text3);margin-top:6px;">Проверьте написание номера (буквы кириллицей, регион) и повторите запрос. Возможно, номер распознан неверно — вернитесь к OCR-верификации.</div>
      </div></div>`;
      toast('ТС не найдено в ФИС ГИБДД-М — проверьте госномер','error');
      return;
    }
    const owner=CAFAP_DB.fis.simOwner(card.owner), vehicle=CAFAP_DB.fis.simVehicle(card.vehicle);
    S2T.fisCard=card;
    S2T.owner=owner;S2T.vehicle=vehicle;S2T.ownerFound=true;
    S2T.current&&(S2T.current.ownerData={owner,vehicle});
    setEl('ctxOwner','textContent',CAFAP_DB.fis.shortName(card.owner));
    s2_displayOwnerResult(owner,vehicle);
    s2_updateStageProgress(2);
    s2_markQuest(4);
    toast(`Владелец найден: ${owner.fam} ${owner.im} ${owner.ot}`,'success');
  },2000);
}

function s2_displayOwnerResult(owner,vehicle){
  const res=document.getElementById('ownerResult');
  const fc=S2T.fisCard||null;
  const plate=S2T.current?.plate||document.getElementById('searchPlate')?.value||'';
  if(!res)return; /* пользователь уже ушёл из раздела */
  res.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <!-- ВЛАДЕЛЕЦ -->
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-user-circle"></i>Данные владельца ТС</div><span class="sbadge sb-done">✓ Найден в РЭО</span></div>
        <div class="card-body">
          <div class="owner-card">
            <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:10px;">${owner.fam} ${owner.im} ${owner.ot}</div>
            <div class="owner-field"><span class="owner-label">Дата рождения</span><span class="owner-val">${owner.born}</span></div>
            <div class="owner-field"><span class="owner-label">Паспорт</span><span class="owner-val mono">${owner.pass}</span></div>
            <div class="owner-field"><span class="owner-label">Адрес регистрации</span><span class="owner-val">${owner.addr}</span></div>
            <div class="owner-field"><span class="owner-label">Регион</span><span class="owner-val">${owner.reg}</span></div>
            <div class="owner-field"><span class="owner-label">ИНН</span><span class="owner-val mono">${owner.inn}</span></div>
          </div>
          <div style="margin-top:10px;display:flex;gap:6px;">
            <button class="btn btn-s btn-sm" onclick="s2_openLVOK()"><i class="fas fa-edit"></i> ЛВОК — редактировать</button>
            <button class="btn btn-s btn-sm" onclick="toast('Проверка ограничений для данного лица...','info')"><i class="fas fa-search"></i> Проверить ограничения</button>
          </div>
        </div>
      </div>
      <!-- ТРАНСПОРТНОЕ СРЕДСТВО -->
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-car"></i>Данные транспортного средства</div></div>
        <div class="card-body">
          <div class="owner-card">
            <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:10px;">${vehicle.brand} ${vehicle.model}, ${vehicle.color}</div>
            <div class="owner-field"><span class="owner-label">Госномер</span><span class="owner-val"><span class="plate" style="font-size:11px;">${plate}</span></span></div>
            <div class="owner-field"><span class="owner-label">Год выпуска</span><span class="owner-val">${vehicle.year}</span></div>
            <div class="owner-field"><span class="owner-label">VIN</span><span class="owner-val mono" style="font-size:11px;">${vehicle.vin}</span></div>
            <div class="owner-field"><span class="owner-label">Марка/Модель</span><span class="owner-val">${vehicle.brand} ${vehicle.model}</span></div>
            <div class="owner-field"><span class="owner-label">Цвет</span><span class="owner-val">${vehicle.color}</span></div>
            <div class="owner-field"><span class="owner-label">В розыске</span><span class="owner-val" style="color:${fc&&fc.wanted?'var(--accent-red)':'var(--success)'};font-weight:${fc&&fc.wanted?800:600};">${fc&&fc.wanted?'ДА ⚠ '+fc.wanted.reason+' ('+fc.wanted.id+')':'НЕТ ✓'}</span></div>
            <div class="owner-field"><span class="owner-label">Ограничения</span><span class="owner-val" style="color:${fc&&fc.restrictions.length?'var(--accent-red)':'var(--success)'};">${fc&&fc.restrictions.length?fc.restrictions.map(r=>r.type+' ('+r.authority+')').join('; '):'НЕТ ✓'}</span></div>
            <div class="owner-field"><span class="owner-label">ОСАГО</span><span class="owner-val" style="color:${fc&&fc.vehicle.osago.status==='valid'?'var(--success)':'var(--accent-red)'};">${fc?({valid:'действует до '+fc.vehicle.osago.until,expired:'истёк '+fc.vehicle.osago.until,none:'отсутствует'})[fc.vehicle.osago.status]:'—'}</span></div>
            <div class="owner-field"><span class="owner-label">Водительское уд.</span><span class="owner-val">${fc&&fc.license?fc.license.number+' ('+({valid:'действует',expired:'истёк срок',deprived:'лишён права',suspended:'приостановлено'})[fc.license.status]+')':(fc&&fc.owner.kind==='org'?'— (юр. лицо)':'не найдено')}</span></div>
          </div>
          <div style="margin-top:10px;">
            <button class="btn btn-p btn-sm" onclick="s2_goCreateCase()"><i class="fas fa-folder-plus"></i> Создать административное дело</button>
          </div>
        </div>
      </div>
    </div>`;
  // История нарушений
  const hist=document.getElementById('violHistory');
  if(hist){
    const prevViolations=S2T.violations.filter(v=>v.plate===plate).slice(0,5);
    hist.innerHTML=`<div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-history"></i>История нарушений — ${plate}</div><span style="font-size:11px;color:var(--text2);">ТС: ${vehicle.brand} ${vehicle.model}</span></div>
      <div class="card-body" style="padding:8px;">
        ${prevViolations.length?`<table class="data-table" style="font-size:10.5px;"><thead><tr><th>№ Дела</th><th>Дата</th><th>Нарушение</th><th>Штраф</th><th>Статус</th></tr></thead>
        <tbody>${prevViolations.map(pv=>`<tr><td class="mono">${pv.id}</td><td class="mono">${pv.date}</td><td>ст.${pv.vtype.code}</td><td class="mono" style="color:var(--success);">${pv.vtype.fine.toLocaleString('ru')} ₽</td><td><span class="sbadge ${{new:'sb-new',done:'sb-done',error:'sb-err',processing:'sb-proc'}[pv.status]||'sb-new'}" style="font-size:9px;">${pv.status}</span></td></tr>`).join('')}</tbody></table>`
        :`<div style="text-align:center;color:var(--text3);font-size:12px;padding:12px;">Предыдущих нарушений не найдено</div>`}
      </div>
    </div>`;
  }
}

function s2_searchByVIN(){toast('Поиск по VIN-номеру... Введите VIN для запроса к АИПС','info');}
function s2_searchByChassis(){toast('Поиск по номеру кузова/двигателя...','info');}

function s2_openLVOK(){
  if(!S2T.owner)return;
  const o=S2T.owner;
  document.getElementById('lvokContent').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div class="form-group"><label class="form-label">Фамилия</label><input type="text" class="form-control" value="${o.fam}"></div>
      <div class="form-group"><label class="form-label">Имя</label><input type="text" class="form-control" value="${o.im}"></div>
      <div class="form-group"><label class="form-label">Отчество</label><input type="text" class="form-control" value="${o.ot}"></div>
      <div class="form-group"><label class="form-label">Дата рождения</label><input type="text" class="form-control" value="${o.born}" placeholder="ДД.ММ.ГГГГ"></div>
      <div class="form-group"><label class="form-label">Серия/номер паспорта</label><input type="text" class="form-control" value="${o.pass}" class="mono"></div>
      <div class="form-group"><label class="form-label">ИНН</label><input type="text" class="form-control" value="${o.inn}" class="mono"></div>
    </div>
    <div class="form-group"><label class="form-label">Адрес регистрации</label><input type="text" class="form-control" value="${o.addr}"></div>
    <div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:7px;padding:10px;font-size:11px;color:var(--accent);margin:12px 0;">
      <i class="fas fa-exclamation-triangle"></i> <strong>Внимание!</strong> Изменение персональных данных фиксируется в журнале аудита и требует обоснования. Оператор несёт персональную ответственность за корректность данных.
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-s" onclick="closeModal('lvokModal')">Отмена</button>
      <button class="btn btn-p" onclick="s2_saveLVOK()"><i class="fas fa-save"></i> Сохранить изменения</button>
    </div>`;
  document.getElementById('lvokModal').style.display='flex';
}
function s2_saveLVOK(){closeModal('lvokModal');s2_markQuest(5);toast('Данные ЛВОК сохранены. Изменения зафиксированы в аудите.','success');}

/* ============================================================
   CASE CREATION SECTION
   ============================================================ */
function s2_goCreateCase(){
  s2_markQuest(6);
  s2_setSection('case',document.getElementById('nav-case'));
}

function s2_renderCaseForm(mc){
  if(!S2T.ownerFound||!S2T.current){
    mc.innerHTML=`<div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:40px;">
      <i class="fas fa-exclamation-circle" style="font-size:48px;color:var(--accent);"></i>
      <div style="font-size:15px;font-weight:700;color:var(--text);">Нет данных для формирования дела</div>
      <div style="font-size:12px;color:var(--text2);text-align:center;">Сначала выполните OCR-верификацию нарушения и найдите владельца ТС.</div>
      <button class="btn btn-p" onclick="s2_setSection('ocr',document.getElementById('nav-ocr'))"><i class="fas fa-camera"></i> К OCR-верификации</button>
    </div>`;
    return;
  }
  const v=S2T.current;const o=S2T.owner;const veh=S2T.vehicle;
  const caseNum=`КС-77-2026-${String(Math.floor(Math.random()*900000)+100000)}`;
  const decNum=`ПОСТ-77-2026-${String(Math.floor(Math.random()*90000)+10000)}`;
  S2T.caseDraft={caseNum,decNum,plate:v.plate,owner:o,vehicle:veh,vtype:v.vtype,date:v.date,time:v.time,cam:v.cam,speed:v.measSpeed};
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:grid;grid-template-columns:1fr 360px;gap:13px;">
    <!-- ФОРМА -->
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-folder-plus" style="color:var(--primary);"></i>Формирование административного дела</h2>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-s btn-sm" onclick="s2_saveDraft()"><i class="fas fa-save"></i> Черновик</button>
          <button class="btn btn-g btn-lg" onclick="s2_submitCase()"><i class="fas fa-paper-plane"></i> Передать инспектору</button>
        </div>
      </div>

      <!-- Реквизиты дела -->
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-file-alt"></i>Реквизиты дела</div><span class="sbadge sb-wait">Черновик</span></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label class="form-label">Номер дела</label><input type="text" class="form-control mono" value="${caseNum}" readonly style="background:#F8FAFF;"></div>
            <div class="form-group"><label class="form-label">Номер постановления (присв. после ЭЦП)</label><input type="text" class="form-control mono" value="${decNum}" readonly style="background:#F8FAFF;color:var(--text3);"></div>
            <div class="form-group"><label class="form-label">Дата нарушения</label><input type="text" class="form-control" value="${v.date}" readonly style="background:#F8FAFF;"></div>
            <div class="form-group"><label class="form-label">Время нарушения</label><input type="text" class="form-control mono" value="${v.time}" readonly style="background:#F8FAFF;"></div>
            <div class="form-group"><label class="form-label">Место нарушения</label><input type="text" class="form-control" value="${v.cam.addr}" id="caseAddr"></div>
            <div class="form-group"><label class="form-label">Камера ФВФ</label><input type="text" class="form-control mono" value="${v.cam.id} (${v.cam.model})" readonly style="background:#F8FAFF;"></div>
          </div>
        </div>
      </div>

      <!-- Данные нарушителя -->
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-user"></i>Данные нарушителя</div><span class="sbadge sb-done">✓ РЭО ГИБДД</span></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label class="form-label">Фамилия</label><input type="text" class="form-control" value="${o.fam}" id="cFam"></div>
            <div class="form-group"><label class="form-label">Имя</label><input type="text" class="form-control" value="${o.im}" id="cIm"></div>
            <div class="form-group"><label class="form-label">Отчество</label><input type="text" class="form-control" value="${o.ot}" id="cOt"></div>
            <div class="form-group"><label class="form-label">Дата рождения</label><input type="text" class="form-control" value="${o.born}" id="cBorn"></div>
            <div class="form-group" style="grid-column:1/-1"><label class="form-label">Адрес для уведомления (почтовый)</label><input type="text" class="form-control" value="${o.addr}" id="cAddr"></div>
          </div>
        </div>
      </div>

      <!-- Данные ТС и нарушения -->
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-car"></i>Транспортное средство и нарушение</div></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label class="form-label">Государственный номер ТС</label><input type="text" class="plate-input" value="${v.plate}" readonly style="font-size:18px;background:#F8FAFF;border-color:var(--success);"></div>
            <div class="form-group"><label class="form-label">Марка / Модель</label><input type="text" class="form-control" value="${veh.brand} ${veh.model}, ${veh.color}" readonly style="background:#F8FAFF;"></div>
            <div class="form-group" style="grid-column:1/-1"><label class="form-label">Статья КоАП РФ</label>
              <select class="form-select" id="codeSelect" onchange="s2_updateFine(this.value)">
                ${VTYPES.map(vt=>`<option value="${vt.code}|${vt.fine}" ${vt.code===v.vtype.code?'selected':''}>${vt.code} КоАП РФ — ${vt.name}</option>`).join('')}
              </select>
            </div>
            ${v.vtype.speed?`
            <div class="form-group"><label class="form-label">Измеренная скорость</label><input type="text" class="form-control mono" value="${v.measSpeed} км/ч" readonly style="background:#FFF3E0;color:var(--accent-red);font-weight:700;"></div>
            <div class="form-group"><label class="form-label">Разрешённая скорость</label><input type="text" class="form-control mono" value="${v.limit||v.vtype.limit} км/ч" readonly style="background:#F8FAFF;"></div>
            `:''}
            <div class="form-group"><label class="form-label">Размер штрафа (₽)</label><input type="text" class="form-control mono" id="fineAmount" value="${v.vtype.fine.toLocaleString('ru')}" style="font-size:15px;font-weight:800;color:var(--success);"></div>
            <div class="form-group"><label class="form-label">Срок уплаты (60 дней)</label><input type="text" class="form-control" value="${getPayDeadline()}" readonly style="background:#F8FAFF;"></div>
          </div>
          <div class="form-group" style="margin-top:8px;"><label class="form-label">Примечания оператора</label><textarea class="form-control" rows="2" placeholder="Введите примечания (необязательно)..." style="resize:none;"></textarea></div>
        </div>
      </div>
    </div>

    <!-- ПРЕВЬЮ ПОСТАНОВЛЕНИЯ -->
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-file-contract"></i>Предпросмотр постановления</div></div>
        <div style="padding:14px;font-size:10.5px;font-family:'Times New Roman',serif;line-height:1.5;" id="decPreview">
          <div style="text-align:center;margin-bottom:10px;">
            <div style="font-size:12px;font-weight:700;">ПОСТАНОВЛЕНИЕ</div>
            <div>по делу об административном правонарушении</div>
            <div style="font-size:10px;color:var(--text2);">${decNum}</div>
          </div>
          <div style="margin-bottom:8px;">${v.date} г. Москва</div>
          <div style="margin-bottom:8px;">ЦАФАП ОДД ГИБДД ГУ МВД России по г. Москве, рассмотрев материалы дела об административном правонарушении, зафиксированном в автоматическом режиме специальным техническим средством <strong>${v.cam.model}</strong> (<strong>${v.cam.id}</strong>), установил:</div>
          <div style="margin-bottom:8px;background:#FFF9C4;padding:6px;border-radius:4px;">${v.date} в ${v.time} по адресу: <strong>${v.cam.addr}</strong> транспортное средство <strong>${veh.brand} ${veh.model}</strong>, г.р.з. <strong>${v.plate}</strong>${v.vtype.speed?`, двигалось со скоростью <strong>${v.measSpeed} км/ч</strong> при ограничении <strong>${v.vtype.limit} км/ч</strong>`:''}.</div>
          <div style="margin-bottom:8px;">Данное деяние содержит признаки административного правонарушения, предусмотренного <strong>ст. ${v.vtype.code} КоАП РФ</strong>.</div>
          <div style="margin-bottom:8px;font-weight:700;">Лицо, привлекаемое к ответственности: ${o.fam} ${o.im} ${o.ot}, ${o.born} г.р.</div>
          <div style="text-align:center;border:1px solid var(--border);border-radius:4px;padding:8px;margin-top:10px;">
            <div>НАЗНАЧИТЬ административный штраф в размере</div>
            <div style="font-size:18px;font-weight:800;color:var(--success);">${v.vtype.fine.toLocaleString('ru')} рублей</div>
          </div>
          <div style="margin-top:10px;font-size:9.5px;color:var(--text3);">Настоящее постановление может быть обжаловано в течение 10 суток с момента вручения. Штраф подлежит уплате в течение 60 суток.</div>
        </div>
      </div>
      <!-- Чеклист -->
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-clipboard-check"></i>Чеклист проверки</div></div>
        <div class="card-body" style="padding:8px 12px;">
          ${['OCR-верификация г/н выполнена','Владелец найден в РЭО','Данные ЛВОК проверены','Статья КоАП выбрана','Адрес для отправки указан','Примечания добавлены'].map((item,i)=>`
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:11.5px;">
            <i class="fas ${i<4?'fa-check-circle':'fa-circle'}" style="color:${i<4?'var(--success)':'var(--border)'};font-size:14px;flex-shrink:0;"></i>
            <span style="color:${i<4?'var(--text)':'var(--text3)'};">${item}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
  s2_markQuest(6);
  setEl('nbCase','textContent','1');
}

function s2_updateFine(val){
  const parts=val.split('|');
  if(parts[1]){const el=document.getElementById('fineAmount');if(el)el.value=parseInt(parts[1]).toLocaleString('ru');}
}
function getPayDeadline(){
  const d=new Date();d.setDate(d.getDate()+60);
  return d.toLocaleDateString('ru',{day:'2-digit',month:'2-digit',year:'numeric'});
}
function s2_saveDraft(){toast('Черновик дела сохранён','success');s2_updateStageProgress(3);}
function s2_submitCase(){
  if(!S2T.ownerFound){toast('Сначала найдите владельца ТС','error');return;}
  S2T.caseCreated=true;
  s2_updateStageProgress(4);
  s2_markQuest(8);
  // Показываем модалку с финальным постановлением
  s2_showCaseModal();
  toast('Дело передано инспектору для подписания ЭЦП!','success');
  // Обновляем статусы в sidebar
  document.getElementById('sc1Status').textContent='✅ OCR верификация';
  document.getElementById('sc2Status').textContent='✅ Поиск владельца';
  document.getElementById('sc3Status').textContent='✅ Создание дела';
  document.getElementById('sc4Status').textContent='🟡 Передача инспектору';
}
function s2_showCaseModal(){
  if(!S2T.caseDraft||!S2T.owner)return;
  const d=S2T.caseDraft;const o=S2T.owner;const v=S2T.current;
  document.getElementById('caseModalContent').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div class="case-section">
        <div class="case-section-title"><i class="fas fa-file-alt"></i>Реквизиты</div>
        <div class="case-field"><span class="cf-lbl">Номер дела</span><span class="cf-val mono">${d.caseNum}</span></div>
        <div class="case-field"><span class="cf-lbl">Дата</span><span class="cf-val">${v.date} ${v.time}</span></div>
        <div class="case-field"><span class="cf-lbl">Место</span><span class="cf-val">${v.cam.addr}</span></div>
        <div class="case-field"><span class="cf-lbl">Г/Н ТС</span><span class="cf-val"><span class="plate" style="font-size:10px;">${v.plate}</span></span></div>
      </div>
      <div class="case-section">
        <div class="case-section-title"><i class="fas fa-user"></i>Нарушитель</div>
        <div class="case-field"><span class="cf-lbl">ФИО</span><span class="cf-val">${o.fam} ${o.im} ${o.ot}</span></div>
        <div class="case-field"><span class="cf-lbl">Дата рожд.</span><span class="cf-val">${o.born}</span></div>
        <div class="case-field"><span class="cf-lbl">Адрес</span><span class="cf-val">${o.addr}</span></div>
      </div>
      <div class="case-section" style="grid-column:1/-1">
        <div class="case-section-title"><i class="fas fa-gavel"></i>Нарушение и штраф</div>
        <div class="case-field"><span class="cf-lbl">Статья КоАП</span><span class="cf-val">ст. ${v.vtype.code} — ${v.vtype.name}</span></div>
        ${v.vtype.speed?`<div class="case-field"><span class="cf-lbl">Скорость</span><span class="cf-val" style="color:var(--accent-red);">${v.measSpeed} км/ч (лим. ${v.limit||v.vtype.limit} км/ч)</span></div>`:''}
        <div class="case-field"><span class="cf-lbl">Штраф</span><span class="cf-val" style="color:var(--success);font-size:16px;">${v.vtype.fine.toLocaleString('ru')} ₽</span></div>
        <div class="case-field"><span class="cf-lbl">Срок оплаты</span><span class="cf-val">${getPayDeadline()} (60 суток)</span></div>
      </div>
    </div>
    <div style="background:#E3F2FD;border:1px solid var(--primary-lighter);border-radius:8px;padding:12px;margin-top:10px;">
      <div style="font-size:12px;font-weight:700;color:var(--primary);margin-bottom:6px;"><i class="fas fa-signature"></i> Следующий шаг: подписание ЭЦП инспектором</div>
      <div style="font-size:11px;color:var(--text2);">Дело передано инспектору ${v.cam.addr}. После подписания ЭЦП постановление будет направлено в Почту России для доставки нарушителю.</div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
      <button class="btn btn-s" onclick="closeModal('caseModal')">Закрыть</button>
      <button class="btn btn-p" onclick="closeModal('caseModal');switchStage(3)"><i class="fas fa-arrow-right"></i> Этап 3: Постановление и ЭЦП</button>
    </div>`;
  document.getElementById('caseModal').style.display='flex';
}

/* ============================================================
   EVIDENCE SECTION
   ============================================================ */
function s2_renderEvidence(mc){
  const v=S2T.current;
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-images" style="color:var(--primary);"></i>Доказательная база — ${v?v.id:'Нарушение не выбрано'}</h2>
    ${!v?`<div class="card"><div class="card-body" style="text-align:center;padding:30px;color:var(--text3);">Выберите нарушение для просмотра доказательств</div></div>`:
    `<div style="display:grid;grid-template-columns:1fr 280px;gap:12px;">
      <!-- Главное фото -->
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-camera"></i>Фотоматериал (кадр ${1}/4)</div>
          <div style="display:flex;gap:4px;">
            <button class="btn btn-s btn-sm" onclick="toast('Скачать доказательство...','info')"><i class="fas fa-download"></i></button>
            <button class="btn btn-s btn-sm" onclick="toast('Печать доказательств...','info')"><i class="fas fa-print"></i></button>
          </div>
        </div>
        ${s2_photoMaterialHTML(v)}
        </div>
      </div>

      <!-- МЕТАДАННЫЕ -->
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div class="card">
          <div class="card-hdr"><div class="card-title"><i class="fas fa-fingerprint"></i>Цепочка доказательств</div></div>
          <div class="card-body" style="padding:8px 12px;font-size:11px;">
            <div style="margin-bottom:8px;">
              <div style="font-weight:700;color:var(--success);margin-bottom:4px;">✓ Целостность доказательств подтверждена</div>
              <div class="mono" style="font-size:9.5px;color:var(--text3);word-break:break-all;">SHA-256: a3f8b2d...c7e9f1</div>
            </div>
            <div style="border-top:1px solid var(--border2);padding-top:8px;">
              ${[
                {icon:'fa-camera',color:'blue',txt:'Фиксация камерой ФВФ',time:v.time},
                {icon:'fa-brain',color:'orange',txt:'OCR-распознавание',time:v.time},
                {icon:'fa-user',color:'blue',txt:'Верификация оператором',time:'сейчас'},
                {icon:'fa-search',color:'green',txt:'Запрос в РЭО ГИБДД',time:S2T.ownerFound?'выполнен':'ожидается'},
                {icon:'fa-file-alt',color:S2T.caseCreated?'green':'orange',txt:'Формирование дела',time:S2T.caseCreated?'выполнено':'ожидается'},
                {icon:'fa-signature',color:'orange',txt:'Подписание ЭЦП',time:'ожидается'}
              ].map(item=>`<div style="display:flex;gap:7px;align-items:flex-start;padding:4px 0;border-bottom:1px dashed var(--border2);">
                <div style="width:22px;height:22px;border-radius:50%;background:${item.color==='blue'?'#E3F2FD':item.color==='green'?'#E8F5E9':item.color==='orange'?'#FFF3E0':'#F3E5F5'};display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;">
                  <i class="fas ${item.icon}" style="color:${item.color==='blue'?'#1565C0':item.color==='green'?'#2E7D32':item.color==='orange'?'#E65100':'#6A1B9A'};"></i>
                </div>
                <div><div style="font-size:10.5px;">${item.txt}</div><div style="font-size:9.5px;color:var(--text3);">${item.time}</div></div>
              </div>`).join('')}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><div class="card-title"><i class="fas fa-hashtag"></i>Хеш-суммы файлов</div></div>
          <div class="card-body" style="padding:8px 12px;font-size:10px;">
            ${[1,2,3,4].map(n=>`<div style="margin-bottom:5px;padding-bottom:5px;border-bottom:1px solid var(--border2);">
              <div style="font-weight:600;">Кадр ${n}.jpg</div>
              <div class="mono" style="color:var(--text3);font-size:9.5px;word-break:break-all;">MD5: ${Array.from({length:32},()=>'0123456789abcdef'[Math.floor(Math.random()*16)]).join('')}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`}`;
  s2_markQuest(7);
}

/* ============================================================
   HELPERS
   ============================================================ */
function closeModal(id){document.getElementById(id).style.display='none';}
function goBack(){switchStage(1);}
function s2_updateStageProgress(step){
  /* Прежняя версия вставляла в #mainContent2 (горизонтальный flex-контейнер) полосу «Прогресс этапа», которая
     превращалась в пустую высокую колонку слева. Прогресс этапа уже показывают степпер над снимком и нижняя
     панель заданий, поэтому здесь ничего не создаётся. */
}

/* ============================================================
   QUEST SYSTEM
   ============================================================ */
const QSTEPS=[
  {n:1,title:'Выбор нарушения для верификации',text:'В панели <strong>OCR-верификации</strong> нажмите на первое нарушение в очереди (или кнопку «Начать с первого»).'},
  {n:2,title:'Подтверждение госномера',text:'Проверьте распознанный номерной знак. При необходимости <strong>скорректируйте</strong> его и нажмите <strong>«Подтвердить номер»</strong>.'},
  {n:3,title:'Отклонение некачественного материала',text:'Если фото нечёткое или данные явно неверны — нажмите <strong>«Отклонить»</strong> для возврата материала на переснятие.'},
  {n:4,title:'Поиск владельца ТС',text:'После подтверждения г/н нажмите <strong>«Найти владельца ТС в РЭО ГИБДД»</strong>. Система выполнит запрос к базе данных.'},
  {n:5,title:'Проверка данных владельца',text:'Ознакомьтесь с данными найденного владельца. Откройте форму <strong>ЛВОК</strong> для проверки и при необходимости — корректировки.'},
  {n:6,title:'Создание административного дела',text:'Нажмите кнопку <strong>«Создать административное дело»</strong> в карточке результатов поиска.'},
  {n:7,title:'Заполнение формы дела',text:'Проверьте автозаполненные поля формы. Убедитесь, что статья КоАП выбрана корректно, адрес доставки актуален.'},
  {n:8,title:'Просмотр доказательств',text:'Откройте раздел <strong>«Доказательства»</strong> в боковом меню. Проверьте цепочку доказательств и хеш-суммы файлов.'},
  {n:9,title:'Передача дела инспектору',text:'Нажмите кнопку <strong>«Передать инспектору»</strong> для передачи дела на подписание ЭЦП.'},
  {n:10,title:'Просмотр очереди нарушений',text:'Откройте раздел <strong>«Очередь нарушений»</strong>. Используйте фильтры по статусу для поиска нужных дел.'},
  {n:11,title:'Обработка дела с ошибкой OCR',text:'В очереди найдите дело со статусом <strong>«Ошибка OCR»</strong>. Откройте его и вручную введите госномер.'},
  {n:12,title:'Переход к Этапу 3',text:'Вы освоили обработку нарушений! Перейдите к <strong>Этапу 3: Постановления и ЭЦП</strong>.'}
];
const HINTS=[
  {t:'OCR-верификация',txt:'Оператор тратит не более 20 секунд на верификацию одного нарушения. Главная задача — проверить правильность распознавания госномера.'},
  {t:'Уровень уверенности OCR',txt:'≥85% — автоподтверждение возможно. 65-84% — требуется проверка. <65% — высокий риск ошибки, обязательная ручная проверка.'},
  {t:'Поиск владельца (РЭО)',txt:'Два официальных канала онлайн-доступа к федеральным базам. Для регионов с локальными базами используется файловый импорт.'},
  {t:'ЛВОК',txt:'Локальная ведомственная объектная карта — форма корректировки персональных данных. Изменения фиксируются в журнале аудита.'}
];
const GLOSSARY=[
  {t:'OCR',d:'Optical Character Recognition — авторасп. госномеров'},
  {t:'ФИС ГИБДД-М',d:'Федеральная информационная система ГИБДД'},
  {t:'РЭО',d:'Регистрационно-экзаменационный отдел ГИБДД'},
  {t:'ЛВОК',d:'Локальная ведомственная объектная карта'},
  {t:'АПН',d:'Административное правонарушение'},
  {t:'ВИН/VIN',d:'Vehicle Identification Number — уникальный идентиф. ТС'},
  {t:'ФВФ',d:'Фото-видеофиксация — дорожные камеры'},
  {t:'АИПС',d:'Автоматизированная информационно-поисковая система'},
  {t:'Поверка СИ',d:'Поверка средства измерения — подтверждение точности камеры'},
  {t:'СТС',d:'Свидетельство о регистрации транспортного средства'}
];

function s2_initQuest(){S2T.quest.done=[];S2T.quest.step=0;s2_updateQuestUI();s2_renderInstContent();}
function s2_markQuest(idx){
  if(!S2T.quest.done.includes(idx)){
    S2T.quest.done.push(idx);
    QSTEPS[idx]&&(QSTEPS[idx].done=true);
    s2_updateQuestUI();
    logEvent('quest_step',{step:idx,title:QSTEPS[idx]?.title||'',total:QSTEPS.length});
    toast(`✅ Шаг ${idx+1}: ${QSTEPS[idx]?.title||''}!`,'success');
  }
}
function s2_nextQuest(){
  if(S2T.quest.step<QSTEPS.length-1){s2_markQuest(S2T.quest.step);S2T.quest.step++;s2_updateQuestUI();}
  else{toast('🎓 Этап 2 пройден! Переходите к Этапу 3.','success');s2_markQuest(S2T.quest.step);}
}
function s2_restartQuest(){S2T.quest.done=[];S2T.quest.step=0;QSTEPS.forEach(s=>s.done=false);s2_updateQuestUI();toast('Квест перезапущен','info');}
function s2_updateQuestUI(){
  const pct=Math.round((S2T.quest.done.length/S2T.quest.total)*100);
  const el=document.getElementById('questPct');if(el)el.textContent=pct+'%';
  const pf=document.getElementById('instProgFill');if(pf)pf.style.width=pct+'%';
  const pt=document.getElementById('instProgTxt');if(pt)pt.textContent=`${S2T.quest.done.length}/${S2T.quest.total} шагов`;
  s2_renderInstContent();
}
function s2_switchInstTab(el,tab){
  document.querySelectorAll('.inst-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');S2T.instTab=tab;s2_renderInstContent();
}
function s2_renderInstContent(){
  const body=document.getElementById('instBody');if(!body)return;
  const tab=S2T.instTab;
  if(tab==='mission'){
    const cur=S2T.quest.step;
    body.innerHTML=`<div style="display:flex;gap:10px;align-items:flex-start;">
      <div style="flex:1;">
        <div style="font-size:11.5px;font-weight:700;color:var(--primary);margin-bottom:8px;">📋 ЭТАП 2: OCR-верификация, поиск владельца, создание административного дела</div>
        <div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:4px;">
          ${QSTEPS.map((s,i)=>{const done=S2T.quest.done.includes(i);const active=cur===i;return`<div style="text-align:center;flex-shrink:0;width:62px;">
            <div class="qs-num ${done?'qn-done':active?'qn-active':'qn-pend'}" style="margin:0 auto 3px;">${done?'✓':s.n}</div>
            <div style="font-size:9px;color:${done?'var(--success)':active?'var(--primary)':'var(--text3)'};line-height:1.2;">${s.title.split(' ').slice(0,2).join(' ')}</div>
          </div>`;}).join('')}
        </div>
        ${cur<QSTEPS.length?`<div style="margin-top:8px;padding:8px 10px;background:var(--primary-xs);border-radius:6px;border-left:3px solid var(--primary);">
          <div style="font-size:10.5px;font-weight:700;color:var(--primary);margin-bottom:2px;">▶ Шаг ${cur+1}/${QSTEPS.length}: ${QSTEPS[cur]?.title}</div>
          <div style="font-size:11px;">${QSTEPS[cur]?.text}</div>
        </div>`:'<div style="padding:8px;background:#E8F5E9;border-radius:6px;font-size:11px;color:var(--success);font-weight:700;">🎓 Все задания Этапа 2 выполнены! Перейдите к Этапу 3.</div>'}
      </div>
    </div>`;
  } else if(tab==='hints'){
    body.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;">${HINTS.map(h=>`<div style="flex:1;min-width:180px;padding:8px;background:#F8FAFF;border-radius:6px;border:1px solid var(--border2);"><div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:3px;">💡 ${h.t}</div><div style="font-size:10.5px;color:var(--text2);line-height:1.4;">${h.txt}</div></div>`).join('')}</div>`;
  } else if(tab==='progress'){
    const pct=Math.round((S2T.quest.done.length/S2T.quest.total)*100);
    body.innerHTML=`<div style="display:flex;gap:14px;align-items:center;">
      <div style="text-align:center;padding:10px 18px;background:var(--primary-xs);border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:28px;font-weight:800;color:var(--primary);font-family:'Courier New',monospace;">${pct}%</div>
        <div style="font-size:10px;color:var(--text2);">Этап 2</div>
      </div>
      <div style="flex:1;">
        <div class="prog-bar" style="height:10px;margin-bottom:7px;"><div class="prog-fill" style="width:${pct}%;"></div></div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <span style="font-size:10px;background:#E8F5E9;color:var(--success);padding:2px 8px;border-radius:10px;">✓ Выполнено: ${S2T.quest.done.length}</span>
          <span style="font-size:10px;background:var(--primary-xs);color:var(--primary);padding:2px 8px;border-radius:10px;">▶ Осталось: ${S2T.quest.total-S2T.quest.done.length}</span>
        </div>
      </div>
      <div style="font-size:10.5px;color:var(--text2);">
        <div style="font-weight:700;margin-bottom:4px;">Этапы:</div>
        <div>1. Дашборд ✅</div><div style="font-weight:700;color:var(--primary);">2. Нарушения ← вы здесь</div>
        <div style="color:var(--text3);">3. Постановления</div><div style="color:var(--text3);">4–6. ...</div>
      </div>
    </div>`;
  } else if(tab==='glossary'){
    body.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:5px;">${GLOSSARY.map(g=>`<div style="padding:4px 9px;background:#F8FAFF;border-radius:4px;border:1px solid var(--border2);"><span style="font-size:11px;font-weight:700;color:var(--primary);">${g.t}</span><span style="font-size:10px;color:var(--text2);margin-left:4px;">— ${g.d}</span></div>`).join('')}</div>`;
  }
}
function s2_toggleInst(){
  S2T.instCollapsed=!S2T.instCollapsed;
  const c=document.getElementById('instContent'),ico=document.getElementById('instTogIco'),panel=document.getElementById('instPanel');
  if(S2T.instCollapsed){c.style.display='none';panel.style.height='42px';ico.className='fas fa-chevron-up';}
  else{c.style.display='';panel.style.height='var(--inst)';ico.className='fas fa-chevron-down';}
}

/* ============================================================
   TOAST
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


/* ------ Stage 2 exports ------ */
  window.s2_setSection = (typeof s2_setSection!=="undefined") ? s2_setSection : window.s2_setSection;
  window.s2_renderOCR = (typeof s2_renderOCR!=="undefined") ? s2_renderOCR : window.s2_renderOCR;
  window.s2_selectViolation = (typeof s2_selectViolation!=="undefined") ? s2_selectViolation : window.s2_selectViolation;
  window.s2_renderOCRCenter = (typeof s2_renderOCRCenter!=="undefined") ? s2_renderOCRCenter : window.s2_renderOCRCenter;
  window.s2_renderOCRMeta = (typeof s2_renderOCRMeta!=="undefined") ? s2_renderOCRMeta : window.s2_renderOCRMeta;
  window.s2_confirmPlate = (typeof s2_confirmPlate!=="undefined") ? s2_confirmPlate : window.s2_confirmPlate;
  window.s2_rejectViolation = (typeof s2_rejectViolation!=="undefined") ? s2_rejectViolation : window.s2_rejectViolation;
  window.s2_requestRepeat = (typeof s2_requestRepeat!=="undefined") ? s2_requestRepeat : window.s2_requestRepeat;
  window.s2_goFindOwner = (typeof s2_goFindOwner!=="undefined") ? s2_goFindOwner : window.s2_goFindOwner;
  window.s2_renderQueue = (typeof s2_renderQueue!=="undefined") ? s2_renderQueue : window.s2_renderQueue;
  window.s2_filterQ = (typeof s2_filterQ!=="undefined") ? s2_filterQ : window.s2_filterQ;
  window.s2_quickOpenOCR = (typeof s2_quickOpenOCR!=="undefined") ? s2_quickOpenOCR : window.s2_quickOpenOCR;
  window.s2_renderOwnerSearch = (typeof s2_renderOwnerSearch!=="undefined") ? s2_renderOwnerSearch : window.s2_renderOwnerSearch;
  window.s2_doOwnerSearch = (typeof s2_doOwnerSearch!=="undefined") ? s2_doOwnerSearch : window.s2_doOwnerSearch;
  window.s2_displayOwnerResult = (typeof s2_displayOwnerResult!=="undefined") ? s2_displayOwnerResult : window.s2_displayOwnerResult;
  window.s2_searchByVIN = (typeof s2_searchByVIN!=="undefined") ? s2_searchByVIN : window.s2_searchByVIN;
  window.s2_searchByChassis = (typeof s2_searchByChassis!=="undefined") ? s2_searchByChassis : window.s2_searchByChassis;
  window.s2_openLVOK = (typeof s2_openLVOK!=="undefined") ? s2_openLVOK : window.s2_openLVOK;
  window.s2_saveLVOK = (typeof s2_saveLVOK!=="undefined") ? s2_saveLVOK : window.s2_saveLVOK;
  window.s2_goCreateCase = (typeof s2_goCreateCase!=="undefined") ? s2_goCreateCase : window.s2_goCreateCase;
  window.s2_renderCaseForm = (typeof s2_renderCaseForm!=="undefined") ? s2_renderCaseForm : window.s2_renderCaseForm;
  window.s2_updateFine = (typeof s2_updateFine!=="undefined") ? s2_updateFine : window.s2_updateFine;
  window.s2_saveDraft = (typeof s2_saveDraft!=="undefined") ? s2_saveDraft : window.s2_saveDraft;
  window.s2_submitCase = (typeof s2_submitCase!=="undefined") ? s2_submitCase : window.s2_submitCase;
  window.s2_showCaseModal = (typeof s2_showCaseModal!=="undefined") ? s2_showCaseModal : window.s2_showCaseModal;
  window.s2_renderEvidence = (typeof s2_renderEvidence!=="undefined") ? s2_renderEvidence : window.s2_renderEvidence;
  window.s2_updateStageProgress = (typeof s2_updateStageProgress!=="undefined") ? s2_updateStageProgress : window.s2_updateStageProgress;
  window.s2_initQuest = (typeof s2_initQuest!=="undefined") ? s2_initQuest : window.s2_initQuest;
  window.s2_markQuest = (typeof s2_markQuest!=="undefined") ? s2_markQuest : window.s2_markQuest;
  window.s2_nextQuest = (typeof s2_nextQuest!=="undefined") ? s2_nextQuest : window.s2_nextQuest;
  window.s2_restartQuest = (typeof s2_restartQuest!=="undefined") ? s2_restartQuest : window.s2_restartQuest;
  window.s2_updateQuestUI = (typeof s2_updateQuestUI!=="undefined") ? s2_updateQuestUI : window.s2_updateQuestUI;
  window.s2_switchInstTab = (typeof s2_switchInstTab!=="undefined") ? s2_switchInstTab : window.s2_switchInstTab;
  window.s2_renderInstContent = (typeof s2_renderInstContent!=="undefined") ? s2_renderInstContent : window.s2_renderInstContent;
  window.s2_toggleInst = (typeof s2_toggleInst!=="undefined") ? s2_toggleInst : window.s2_toggleInst;
  if(typeof S2T!=="undefined") window.S2T = S2T;
  window.onPlateInput=onPlateInput; window.s2_zoomPhoto=s2_zoomPhoto; window.s2_openPhotoMaterial=s2_openPhotoMaterial;
  window.s2_badges=function(){return {ocr:S2T.violations.filter(v=>v.status==='new'||v.status==='error').length,queue:S2T.violations.length};};
})(); /* end Stage 2 IIFE */
/* initStage2 */
function initStage2(){if(typeof s2_setSection==="function")s2_setSection("ocr",null);}
