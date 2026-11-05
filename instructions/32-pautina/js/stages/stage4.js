;(function() {
/* ------ Stage 4 scope start ------ */
/* ================================================================
   ЭТАП 4 — КОД (namespace: s4_)
   ================================================================ */

/* ============================================================
   ДАННЫЕ
   ============================================================ */
const VTYPES=[
  {code:'12.9.2',name:'Превышение скорости на 20–40 км/ч',fine:500},
  {code:'12.9.3',name:'Превышение скорости на 40–60 км/ч',fine:1000},
  {code:'12.9.4',name:'Превышение скорости на 60–80 км/ч',fine:2000},
  {code:'12.9.5',name:'Превышение скорости >80 км/ч',fine:5000},
  {code:'12.12.1',name:'Проезд на запрещающий сигнал',fine:1000},
  {code:'12.17.2',name:'Движение по выделенной полосе',fine:3000},
  {code:'12.19.2',name:'Нарушение правил стоянки',fine:1500},
  {code:'12.15.4',name:'Выезд на полосу встречного движения',fine:5000},
];
/* Владельцы и госномера — база ФИС ГИБДД-М (data/fis_gibdd_m.js). Элементы с одним индексом относятся к одному ТС. */
const FIS_POOL=CAFAP_DB.fis.violationPool(120,2);
const OWNERS=FIS_POOL.map(r=>({fam:r.owner.fam,im:r.owner.im,ot:r.owner.ot,born:r.owner.born,addr:r.owner.addr,zip:r.owner.zip}));
const PLATES=FIS_POOL.map(r=>r.vehicle.plate);
const POST_STATUSES=['sent','sent','sent','delivered','delivered','delivered','in_transit','in_transit','returned','returned'];
const PAY_STATUSES=['paid_half','paid_half','paid_full','paid_full','paid_full','unpaid','unpaid','unpaid','unpaid','overdue'];

function rnd(arr){return arr[Math.floor(Math.random()*arr.length)];}
function rndInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
function genTrack(){return '145'+Array.from({length:9},()=>Math.floor(Math.random()*10)).join('')+'0';}
function genPostDecNum(){return `ПОСТ-77-2026-${String(rndInt(10000,19999)).padStart(5,'0')}`;}
function genUIN(){return '18810'+Array.from({length:15},()=>Math.floor(Math.random()*10)).join('');}

/* Почтовые отправления, оплаты и дела для ФССП строятся на записях баз:
   ГИС ГМП (data/gis_gmp.js — начисления: УИН, постановление, сумма, статус оплаты) и ФССП (data/fssp.js — исполнительные производства). */
const _GMP=CAFAP_DB.gmp.charges(), _OWN=CAFAP_DB.fis.ownerById(), _PROC=CAFAP_DB.fssp.proceedings();
const _DB_NOW=Date.UTC(2026,9,27);                 // «сегодня» в учебной базе
const _inFssp=new Set(_PROC.map(p=>p.uin));
function _age(c){const q=c.date.split('.');return Math.round((_DB_NOW-Date.UTC(+q[2],+q[1]-1,+q[0]))/86400000);}
function _shuf(a){const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}
function mailFromCharge(c,i){
  const o=_OWN.get(c.ownerId),art=CAFAP_DB.nsi.article(c.article)||{code:c.article,name:c.article};
  const age=_age(c);
  const sentDate=new Date();sentDate.setDate(sentDate.getDate()-age);
  return{
    id:`ПОЧ-77-2026-${String(1000+i).padStart(5,'0')}`,decId:c.decisionNo,plate:c.plate,
    owner:{fam:o.fam,im:o.im,ot:o.ot,born:o.born,addr:o.addr,zip:o.zip},
    vt:{code:art.code,name:art.name,fine:c.amount},
    sentDate:sentDate.toLocaleDateString('ru'),trackNum:genTrack(),
    status:age<=2?'pending':rnd(POST_STATUSES),payStatus:c.status,
    fine:c.amount,uin:c.uin,payDaysLeft:60-age,sentDaysAgo:age,halfPaidWindow:Math.max(CAFAP_DISCOUNT.days-age,0)
  };
}
const MAIL_DATA=(function(){
  const recent=_shuf(_GMP.filter(c=>_age(c)<=45)).slice(0,100);                                   // недавние постановления — почтовая очередь
  const toFssp=_shuf(_GMP.filter(c=>c.status==='overdue'&&_age(c)>90&&!_inFssp.has(c.uin))).slice(0,14);   // просрочены >90 сут. и ещё не переданы в ФССП
  return recent.concat(toFssp).map((c,i)=>mailFromCharge(c,i));
})();
/* гарантируем сценарные данные: >=3 письма «к отправке» */
(function(){
  const need=3-MAIL_DATA.filter(m=>m.status==='pending').length;
  MAIL_DATA.filter(m=>m.status!=='pending'&&m.payDaysLeft>=0).slice(0,Math.max(0,need)).forEach(m=>{m.status='pending';m.sentDaysAgo=0;m.sentDate=new Date().toLocaleDateString('ru');m.payStatus='unpaid';m.payDaysLeft=60;m.halfPaidWindow=CAFAP_DISCOUNT.days;});
})();
/* письма «к отправке» показываем первыми, чтобы они были видны в первых 20 строках списка */
MAIL_DATA.sort((x,y)=>(y.status==='pending')-(x.status==='pending'));
const OVERDUE_DATA=MAIL_DATA.filter(m=>m.payStatus==='overdue'||m.payDaysLeft<0).slice(0,20);
const FSSP_QUEUE=MAIL_DATA.filter(m=>m.payDaysLeft<-30).slice(0,8);

const S4T={instTab:'mission',instCollapsed:false,quest:{step:0,done:[],total:12},
  session:{role:'postal',login:'smirnov_av',startTime:new Date()},
  printBatch:[],mailBatch:[]
};

/* S4: load handled by SPA */

function s4_setSection(sec,navEl){
  document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active'));
  if(navEl)navEl.classList.add('active');
  const mc=document.getElementById('mainContent4');
  const R={mail:s4_renderMail,print:s4_renderPrint,track:s4_renderTracking,returned:s4_renderReturned,pay:s4_renderPayment,art2025:s4_renderArt2025,treasury:s4_renderTreasury,fssp:s4_renderFSSP,enforce:s4_renderEnforce};
  (R[sec]||s4_renderMail)(mc);
}
function closeModal(id){document.getElementById(id).style.display='none';}

/* ============================================================
   ПОЧТОВАЯ ОТПРАВКА
   ============================================================ */
function s4_renderMail(mc){
  const pending=MAIL_DATA.filter(m=>m.status==='pending');
  const sent=MAIL_DATA.filter(m=>m.status!=='pending');
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <!-- Статистика -->
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;">
      ${[
        {lbl:'Готово к отправке',val:pending.length,c:'sc-orange',ico:'fa-envelope'},
        {lbl:'Отправлено',val:sent.filter(m=>m.status==='sent').length,c:'sc-blue',ico:'fa-paper-plane'},
        {lbl:'В пути',val:sent.filter(m=>m.status==='in_transit').length,c:'sc-purple',ico:'fa-truck'},
        {lbl:'Доставлено',val:sent.filter(m=>m.status==='delivered').length,c:'sc-green',ico:'fa-check-circle'},
        {lbl:'Возвращено',val:sent.filter(m=>m.status==='returned').length,c:'sc-red',ico:'fa-undo'}
      ].map(s=>`<div style="background:#fff;border:1px solid var(--border);border-radius:9px;padding:12px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${s.c==='sc-orange'?'var(--accent)':s.c==='sc-blue'?'var(--primary)':s.c==='sc-purple'?'var(--purple)':s.c==='sc-green'?'var(--success)':'var(--accent-red)'};"></div>
        <div style="font-size:24px;font-weight:800;font-family:'Courier New',monospace;">${s.val}</div>
        <div style="font-size:11px;color:var(--text2);font-weight:600;">${s.lbl}</div>
        <div style="position:absolute;top:10px;right:10px;font-size:22px;opacity:.08;"><i class="fas ${s.ico}"></i></div>
      </div>`).join('')}
    </div>

    <!-- Панель управления -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-cogs"></i>Управление почтовой отправкой</div>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-post" onclick="s4_sendBatch()" id="btnSendBatch"><i class="fas fa-paper-plane"></i> Отправить партию (${pending.length})</button>
          <button class="btn btn-s btn-sm" onclick="s4_exportRegistry()"><i class="fas fa-file-excel"></i> Реестр РТМ</button>
          <button class="btn btn-s btn-sm" onclick="s4_setSection('print',document.getElementById('nav-print'))"><i class="fas fa-print"></i> Очередь печати</button>
        </div>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;align-items:start;">
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;">Параметры отправки</div>
            <div class="form-group" style="margin-bottom:8px;"><label class="form-label">Вид отправления</label>
              <select class="form-select" style="font-size:12px;"><option selected>Заказное с уведомлением</option><option>Простое</option><option>Ценное</option></select>
            </div>
            <div class="form-group" style="margin-bottom:0;"><label class="form-label">Категория отправки</label>
              <select class="form-select" style="font-size:12px;"><option>Письмо первого класса</option><option selected>Заказное письмо</option></select>
            </div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;">Реестр ПАО «Почта России»</div>
            <div style="background:#FFF3E0;border:1px solid #FFE0B2;border-radius:7px;padding:10px;font-size:11px;">
              <div style="font-weight:700;color:var(--accent);margin-bottom:4px;"><i class="fas fa-clipboard-list"></i> Партионный протокол РТМ 0003.05-10</div>
              <div style="color:var(--text2);">Писем в партии: <strong>${pending.length}</strong></div>
              <div style="color:var(--text2);">Итого к оплате: <strong>${(pending.length*85).toLocaleString('ru')} ₽</strong></div>
              <div style="color:var(--text2);">Договор: <strong class="mono">ДОГ-2026-МВД-0042</strong></div>
            </div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;">Прогресс отправки сегодня</div>
            <div style="margin-bottom:6px;"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;"><span>Отправлено:</span><span style="font-weight:700;color:var(--primary);" id="sentProg">${sent.filter(m=>m.status==='sent').length} / ${MAIL_DATA.length}</span></div>
            <div class="prog-bar"><div class="prog-fill" style="width:${Math.round(sent.filter(m=>m.status==='sent').length/MAIL_DATA.length*100)}%;"></div></div></div>
            <div style="font-size:10.5px;color:var(--text3);">Следующая партия: 15:00 · ${pending.length} писем</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица почтовой очереди -->
    <div class="card" style="flex:1;">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-inbox"></i>Реестр почтовых отправлений <span class="live-ind" style="margin-left:5px;">LIVE</span></div>
        <div style="display:flex;gap:6px;">
          <input type="text" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;width:160px;" placeholder="🔍 Трек-номер или г/н...">
          <select style="padding:5px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;" onchange="s4_filterMail(this.value)">
            <option value="">Все статусы</option>
            <option value="pending">Готово к отправке</option>
            <option value="sent">Отправлено</option>
            <option value="delivered">Доставлено</option>
            <option value="returned">Возвращено</option>
          </select>
        </div>
      </div>
      <div style="overflow-y:auto;max-height:340px;">
        <table class="data-table">
          <thead><tr>
            <th><input type="checkbox" onchange="s4_selectAll(this)" style="cursor:pointer;"></th>
            <th>Постановление</th><th>Получатель</th><th>Г/Н</th>
            <th>Штраф</th><th>Трек-номер</th><th>Дата отпр.</th>
            <th>Статус доставки</th><th>Оплата</th><th>Действия</th>
          </tr></thead>
          <tbody id="mailTableBody">
            ${MAIL_DATA.slice(0,20).map((m,i)=>mailRow(m,i)).join('')}
          </tbody>
        </table>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 9px;background:#FAFCFF;border-top:1px solid var(--border2);font-size:11px;color:var(--text2);">
        <div>Всего: <strong>${MAIL_DATA.length}</strong> · Ожидают отправки: <strong style="color:var(--accent);">${pending.length}</strong></div>
        <div style="display:flex;gap:3px;">${[1,2,3,'…',6].map((p,i)=>`<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;border-radius:4px;font-size:11px;${i===0?'background:var(--primary);color:#fff;':'background:#fff;border:1px solid var(--border);cursor:pointer;'}">${p}</div>`).join('')}</div>
      </div>
    </div>
  </div>`;
  s4_markQuest(0);
}

function mailRow(m,i){
  const stMap={pending:'sb-wait',sent:'sb-sent',in_transit:'sb-proc',delivered:'sb-delivered',returned:'sb-returned'};
  const stLbl={pending:'К отправке',sent:'Отправлено',in_transit:'В пути',delivered:'Доставлено',returned:'Возвращено'};
  const pyMap={paid_half:'sb-proc',paid_full:'sb-paid',unpaid:'sb-new',overdue:'sb-overdue'};
  const pyLbl={paid_half:'Оплачено '+CAFAP_DISCOUNT.pct+'%',paid_full:'Оплачено',unpaid:'Не оплачено',overdue:'Просрочено'};
  return`<tr>
    <td><input type="checkbox" style="cursor:pointer;"></td>
    <td class="mono" style="font-size:10.5px;color:var(--primary);">${m.decId}</td>
    <td style="font-size:11.5px;"><div style="font-weight:600;">${m.owner.fam} ${m.owner.im?m.owner.im[0]+'.':''}${m.owner.ot?m.owner.ot[0]+'.':''}</div><div style="font-size:9.5px;color:var(--text3);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.owner.addr}</div></td>
    <td><span class="plate" style="font-size:10px;">${m.plate}</span></td>
    <td class="mono" style="font-size:11px;font-weight:700;color:var(--success);">${m.fine.toLocaleString('ru')} ₽</td>
    <td class="mono" style="font-size:10px;color:var(--text2);">${m.status!=='pending'?m.trackNum:'—'}</td>
    <td class="mono" style="font-size:10.5px;">${m.status!=='pending'?m.sentDate:'—'}</td>
    <td><span class="sbadge ${stMap[m.status]||'sb-wait'}" style="font-size:9px;">${stLbl[m.status]||m.status}</span></td>
    <td><span class="sbadge ${pyMap[m.payStatus]||'sb-new'}" style="font-size:9px;">${pyLbl[m.payStatus]||m.payStatus}</span></td>
    <td><div style="display:flex;gap:3px;">
      <button class="btn btn-p btn-sm" onclick="s4_showLetter(${i})" title="Просмотр"><i class="fas fa-eye"></i></button>
      ${m.status==='pending'?`<button class="btn btn-post btn-sm" onclick="s4_sendSingle(${i})" title="Отправить"><i class="fas fa-paper-plane"></i></button>`:''}
      ${m.status==='returned'?`<button class="btn btn-w btn-sm" onclick="s4_resend(${i})" title="Повтор"><i class="fas fa-redo"></i></button>`:''}
    </div></td>
  </tr>`;
}

function s4_showLetter(idx){
  const m=MAIL_DATA[idx];if(!m)return;
  const barcodeHTML=Array.from({length:30},()=>`<div class="barcode-bar" style="height:${rndInt(15,30)}px;width:${rndInt(1,3)}px;background:#333;"></div><div style="width:${rndInt(1,3)}px;"></div>`).join('');
  document.getElementById('letterContent').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
      <div class="letter-preview" style="border:2px solid #333;">
        <div class="letter-stamp">ЗАКАЗНОЕ</div>
        <div style="font-size:8.5px;color:var(--text2);margin-bottom:6px;">Данные средства<br>Наименование: ${m.vt.name.substring(0,30)}<br>Идентификатор: ${m.decId}<br>СТС: 7736939186</div>
        <div style="font-size:8.5px;font-weight:700;color:var(--post);margin-bottom:4px;">ПОЧТА РОССИИ</div>
        <div style="display:flex;align-items:flex-end;gap:1px;height:28px;margin-bottom:4px;">${barcodeHTML}</div>
        <div class="mono" style="font-size:8px;text-align:center;margin-bottom:6px;">${m.trackNum}</div>
        <div style="font-size:8.5px;"><strong>Кому:</strong> ${m.owner.fam} ${m.owner.im||''} ${m.owner.ot||''}<br><strong>Куда:</strong> ${m.owner.zip}, ${m.owner.addr}</div>
        <div style="border-top:1px solid #ddd;margin-top:8px;padding-top:6px;font-size:8px;color:var(--text3);">
          Данные ФИС ГИБДД МВД России<br>
          Идентификация г/н: <span class="mono" style="font-size:8px;font-weight:700;">${m.plate}</span>
        </div>
      </div>
      <div class="letter-preview">
        <div style="text-align:center;margin-bottom:8px;">
          <div style="font-size:9px;font-weight:700;">Фотоматериалы, полученные с применением работающего в автоматическом режиме средства:</div>
        </div>
        <div style="background:#222;height:70px;border-radius:4px;display:flex;align-items:center;justify-content:center;margin-bottom:6px;">
          <svg width="200" height="65" viewBox="0 0 200 65"><rect width="200" height="65" fill="#2a2a35"/><rect x="0" y="30" width="200" height="35" fill="#3a3a45"/>
          <rect x="50" y="30" width="100" height="35" fill="#555" rx="2"/>
          <rect x="68" y="38" width="24" height="6" fill="#fff" rx="1"/><text x="80" y="44" text-anchor="middle" font-family="Courier New" font-size="5" font-weight="bold" fill="#111">${m.plate}</text>
          <rect x="65" y="35" width="30" height="12" fill="none" stroke="#0f0" stroke-width="1.5"/></svg>
        </div>
        <div style="font-size:8px;"><strong>Идентификация г/н:</strong><br><span style="font-size:11px;font-weight:800;">${m.plate}</span></div>
        <div style="font-size:8px;margin-top:4px;color:var(--text2);">Статья КоАП: ${m.vt.code} · Штраф: ${m.fine.toLocaleString('ru')} руб.</div>
        <div style="font-size:8px;color:var(--text2);">УИН: <span class="mono">${m.uin}</span></div>
        <div style="font-size:7.5px;color:var(--text3);margin-top:6px;">Внимание! Перед уплатой штрафа убедитесь, что оператор, проверивший информацию об уплате штрафа в ГИС ГМП, подтвердил оплату.</div>
      </div>
    </div>
    <div style="background:var(--primary-xs);border-radius:8px;padding:12px;font-size:11.5px;">
      <div style="font-weight:700;color:var(--primary);margin-bottom:6px;"><i class="fas fa-info-circle"></i> Реквизиты отправления</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <div><span style="color:var(--text2);">Трек-номер:</span><div class="mono" style="font-size:10.5px;font-weight:700;">${m.trackNum}</div></div>
        <div><span style="color:var(--text2);">Статус:</span><div><span class="sbadge ${m.status==='pending'?'sb-wait':m.status==='delivered'?'sb-delivered':'sb-sent'}" style="font-size:9.5px;">${m.status==='pending'?'К отправке':m.status==='delivered'?'Доставлено':'Отправлено'}</span></div></div>
        <div><span style="color:var(--text2);">Срок доставки:</span><div style="font-weight:600;">14 рабочих дней</div></div>
      </div>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
      <button class="btn btn-s" onclick="closeModal('letterModal')">Закрыть</button>
      <button class="btn btn-s" onclick="toast('Печать конверта...','info')"><i class="fas fa-print"></i> Печать конверта</button>
      ${m.status==='pending'?`<button class="btn btn-post" onclick="s4_sendSingle(${idx});closeModal('letterModal')"><i class="fas fa-paper-plane"></i> Отправить</button>`:''}
    </div>`;
  document.getElementById('letterModal').style.display='flex';
  s4_markQuest(1);
}

function s4_sendSingle(idx){
  const m=MAIL_DATA[idx];if(!m||m.status!=='pending')return;
  m.status='sent';m.sentDate=new Date().toLocaleDateString('ru');
  toast(`Письмо ${m.decId} отправлено · Трек: ${m.trackNum}`,'success');
  s4_markQuest(2);
  s4_renderMail(document.getElementById('mainContent4'));
}

function s4_sendBatch(){
  const pending=MAIL_DATA.filter(m=>m.status==='pending');
  if(!pending.length){toast('Нет писем для отправки','warning');return;}
  const btn=document.getElementById('btnSendBatch');
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Отправка...';}
  let i=0;
  const int=setInterval(()=>{
    if(i<pending.length){pending[i].status='sent';pending[i].sentDate=new Date().toLocaleDateString('ru');i++;}
    else{
      clearInterval(int);
      s4_markQuest(3);
      toast(`Партия отправлена: ${pending.length} писем · Реестр РТМ сформирован`,'success');
      {const _e=document.getElementById('sbSent');if(_e)_e.textContent=(parseInt(_e.textContent)||0)+(pending.length);}
      s4_renderMail(document.getElementById('mainContent4'));
    }
  },50);
}

function s4_exportRegistry(){
  s4_markQuest(4);
  toast('Реестр РТМ 0003.05-10 сформирован и передан в Почту России','success');
}

function s4_resend(idx){
  const m=MAIL_DATA[idx];if(!m)return;
  m.status='pending';toast(`Письмо ${m.decId} добавлено в очередь повторной отправки`,'info');
  s4_renderMail(document.getElementById('mainContent4'));
}

function s4_selectAll(cb){
  document.querySelectorAll('#mailTableBody input[type=checkbox]').forEach(el=>el.checked=cb.checked);
  if(cb.checked)toast(`Выбрано ${document.querySelectorAll('#mailTableBody input[type=checkbox]').length} писем`,'info');
}

function s4_filterMail(status){
  const filtered=status?MAIL_DATA.filter(m=>m.status===status):MAIL_DATA;
  const tbody=document.getElementById('mailTableBody');
  if(tbody)tbody.innerHTML=filtered.slice(0,20).map((m,i)=>mailRow(m,i)).join('');
  toast(`Фильтр: ${status||'все'} · Найдено: ${filtered.length} записей`,'info');
}

/* ============================================================
   ОЧЕРЕДЬ ПЕЧАТИ
   ============================================================ */
function s4_renderPrint(mc){
  const items=MAIL_DATA.filter(m=>m.status==='pending').slice(0,12);
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-print" style="color:var(--primary);"></i>Очередь печати постановлений</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-p btn-lg" onclick="s4_startPrintAll()" id="btnPrintAll"><i class="fas fa-print"></i> Печатать все (${items.length})</button>
        <button class="btn btn-s btn-sm" onclick="toast('Настройки принтера открыты','info')"><i class="fas fa-cog"></i> Принтер</button>
      </div>
    </div>

    <!-- Принтер -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-print"></i>Принтер: HP LaserJet Enterprise M607</div>
        <div style="display:flex;gap:8px;font-size:11px;align-items:center;">
          <span style="color:var(--success);"><i class="fas fa-circle" style="font-size:8px;"></i> Онлайн</span>
          <span style="color:var(--text2);">Бумага: <strong>2840 л.</strong></span>
          <span style="color:var(--text2);">Тонер: <strong style="color:var(--success);">84%</strong></span>
        </div>
      </div>
      <div class="card-body">
        <div style="position:relative;background:#F5F5F5;border-radius:8px;height:80px;overflow:hidden;margin-bottom:10px;border:1px solid var(--border);">
          <div id="printVisual" style="display:flex;align-items:center;justify-content:center;height:100%;font-size:13px;color:var(--text3);">
            <i class="fas fa-print" style="font-size:28px;opacity:.3;"></i>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;font-size:11px;">
          <div style="text-align:center;padding:8px;background:var(--primary-xs);border-radius:6px;">
            <div style="font-size:20px;font-weight:800;color:var(--primary);" id="printCount">0</div>
            <div style="color:var(--text2);">Напечатано</div>
          </div>
          <div style="text-align:center;padding:8px;background:#FFF3E0;border-radius:6px;">
            <div style="font-size:20px;font-weight:800;color:var(--accent);" id="printQueue">${items.length}</div>
            <div style="color:var(--text2);">В очереди</div>
          </div>
          <div style="text-align:center;padding:8px;background:#E8F5E9;border-radius:6px;">
            <div style="font-size:20px;font-weight:800;color:var(--success);">2</div>
            <div style="color:var(--text2);">Стр/сек</div>
          </div>
          <div style="text-align:center;padding:8px;background:#F3E5F5;border-radius:6px;">
            <div style="font-size:20px;font-weight:800;color:var(--purple);" id="printETA">${Math.ceil(items.length*0.5)} мин</div>
            <div style="color:var(--text2);">Расч. время</div>
          </div>
        </div>
        <div class="prog-bar" style="margin-top:10px;height:10px;"><div class="prog-fill" id="printBar" style="width:0%;background:var(--primary);"></div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-list"></i>Задания на печать</div></div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>№</th><th>Постановление</th><th>Получатель</th><th>Г/Н</th><th>Штраф</th><th>Страниц</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>${items.map((m,i)=>`<tr id="prow-${i}">
            <td style="font-size:11px;" class="mono">${i+1}</td>
            <td class="mono" style="font-size:10.5px;color:var(--primary);">${m.decId}</td>
            <td style="font-size:11.5px;">${m.owner.fam} ${m.owner.im?m.owner.im[0]+'.':''}${m.owner.ot?m.owner.ot[0]+'.':''}</td>
            <td><span class="plate" style="font-size:10px;">${m.plate}</span></td>
            <td class="mono" style="font-size:11px;font-weight:700;color:var(--success);">${m.fine.toLocaleString('ru')} ₽</td>
            <td style="font-size:11px;">2</td>
            <td><span class="sbadge sb-wait" id="pst-${i}" style="font-size:9px;">Ожидает</span></td>
            <td><button class="btn btn-p btn-sm" onclick="s4_printSingle(${i})"><i class="fas fa-print"></i></button></td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
  window._printItems=items;
}

function s4_startPrintAll(){
  const items=window._printItems||[];if(!items.length)return;
  const btn=document.getElementById('btnPrintAll');
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-circle-notch fa-spin"></i> Печать...';}
  const pv=document.getElementById('printVisual');
  if(pv){pv.innerHTML=`<div style="position:relative;width:100%;height:100%;overflow:hidden;"><div class="print-head"></div><div style="display:flex;align-items:center;justify-content:center;height:100%;"><i class="fas fa-file-alt" style="font-size:32px;color:var(--primary);opacity:.6;"></i></div></div>`;}
  let printed=0;
  const total=items.length;
  const interval=setInterval(()=>{
    if(printed<total){
      const el=document.getElementById(`pst-${printed}`);
      if(el){el.className='sbadge sb-done';el.innerHTML='<i class="fas fa-check" style="font-size:9px;"></i> Напечатано';}
      printed++;
      const bar=document.getElementById('printBar');
      const cnt=document.getElementById('printCount');
      const que=document.getElementById('printQueue');
      if(bar)bar.style.width=Math.round(printed/total*100)+'%';
      if(cnt)cnt.textContent=printed;
      if(que)que.textContent=total-printed;
    } else {
      clearInterval(interval);
      if(pv){pv.innerHTML=`<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:6px;"><i class="fas fa-check-circle" style="font-size:28px;color:var(--success);"></i><div style="font-size:12px;color:var(--success);font-weight:700;">Печать завершена</div></div>`;}
      if(btn){btn.disabled=false;btn.innerHTML=`<i class="fas fa-check"></i> Напечатано ${total} документов`;}
      s4_markQuest(5);
      toast(`Печать завершена: ${total} постановлений`,'success');
    }
  },120);
}

function s4_printSingle(i){
  const el=document.getElementById(`pst-${i}`);
  if(el){el.className='sbadge sb-done';el.innerHTML='✓ Напечатано';}
  toast(`Задание ${i+1} напечатано`,'success');
}

/* ============================================================
   ОТСЛЕЖИВАНИЕ ДОСТАВКИ
   ============================================================ */
function s4_renderTracking(mc){
  const inTransit=MAIL_DATA.filter(m=>m.status==='in_transit'||m.status==='sent').slice(0,15);
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-map-marker-alt" style="color:var(--primary);"></i>Отслеживание доставки писем</h2>
      <div style="display:flex;gap:6px;">
        <input type="text" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:11.5px;width:220px;" placeholder="🔍 Введите трек-номер..." id="trackInput">
        <button class="btn btn-p btn-sm" onclick="s4_trackLetter()"><i class="fas fa-search"></i> Отследить</button>
      </div>
    </div>
    <div id="trackResult"></div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-truck"></i>Письма в пути <span class="live-ind" style="margin-left:5px;">LIVE</span></div>
        <span class="sbadge sb-proc">${inTransit.length} отправлений</span>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Постановление</th><th>Трек-номер</th><th>Получатель</th><th>Дата отправки</th><th>Текущий статус</th><th>Прогноз доставки</th><th>Действия</th></tr></thead>
          <tbody>${inTransit.map(m=>{
            const stages=['Принято в ОПС','Обрабатывается','Передано перевозчику','В пути','Прибыло в место вручения','Вручено адресату'];
            const stageIdx=m.sentDaysAgo>10?5:m.sentDaysAgo>7?4:m.sentDaysAgo>4?3:m.sentDaysAgo>2?2:1;
            const dlDate=new Date();dlDate.setDate(dlDate.getDate()+(14-m.sentDaysAgo));
            return`<tr>
              <td class="mono" style="font-size:10.5px;color:var(--primary);">${m.decId}</td>
              <td class="mono" style="font-size:10.5px;">${m.trackNum}</td>
              <td style="font-size:11.5px;">${m.owner.fam} ${m.owner.im?m.owner.im[0]+'.':''}${m.owner.ot?m.owner.ot[0]+'.':''}<br><span style="font-size:9.5px;color:var(--text3);">${m.owner.zip}</span></td>
              <td class="mono" style="font-size:10.5px;">${m.sentDate}</td>
              <td>
                <div style="font-size:10.5px;font-weight:600;">${stages[stageIdx]}</div>
                <div style="display:flex;gap:2px;margin-top:3px;">
                  ${stages.map((_,si)=>`<div style="flex:1;height:4px;border-radius:2px;background:${si<=stageIdx?'var(--primary)':'var(--border2)'}"></div>`).join('')}
                </div>
              </td>
              <td class="mono" style="font-size:10.5px;">${dlDate.toLocaleDateString('ru')}</td>
              <td><button class="btn btn-s btn-sm" onclick="trackNum('${m.trackNum}')"><i class="fas fa-external-link-alt"></i> Почта РФ</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
  s4_markQuest(6);
}

function s4_trackLetter(){
  const val=document.getElementById('trackInput')?.value||'';
  if(!val){toast('Введите трек-номер','error');return;}
  const m=MAIL_DATA.find(x=>x.trackNum.includes(val.replace(/\s/g,'')));
  const res=document.getElementById('trackResult');
  if(!res)return;
  if(m){
    const stages=['Принято в ОПС','Обрабатывается','Передано перевозчику','В пути','Прибыло в ОПС назначения','Вручено'];
    const si=m.sentDaysAgo>10?5:m.sentDaysAgo>7?4:m.sentDaysAgo>4?3:m.sentDaysAgo>2?2:1;
    res.innerHTML=`<div class="card"><div class="card-body">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
        <span class="sbadge sb-sent" style="font-size:11px;"><i class="fas fa-truck"></i> Отслеживание активно</span>
        <span class="mono" style="font-size:11px;">${m.trackNum}</span>
        <span style="font-size:11px;">→ ${m.owner.fam} · ${m.owner.zip}, ${m.owner.addr.substring(0,40)}...</span>
      </div>
      <div style="display:flex;gap:0;margin-bottom:10px;">
        ${stages.map((s,i)=>`<div style="flex:1;text-align:center;">
          <div style="width:26px;height:26px;border-radius:50%;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;${i<=si?'background:var(--primary);color:#fff;':'background:var(--border2);color:var(--text3);'}">${i<=si?'✓':i+1}</div>
          <div style="font-size:9px;color:${i<=si?'var(--primary)':'var(--text3)'};">${s}</div>
          ${i<stages.length-1?`<div style="position:absolute;"></div>`:''}
        </div>`).join('')}
      </div>
    </div></div>`;
  } else {
    res.innerHTML=`<div style="background:#FFEBEE;border-radius:8px;padding:12px;font-size:12px;color:var(--accent-red);"><i class="fas fa-times-circle"></i> Трек-номер не найден. Проверьте правильность ввода.</div>`;
  }
}

function trackNum(num){toast(`Почта России: отслеживание ${num} открыто в новой вкладке`,'info');}

/* ============================================================
   ВОЗВРАЩЁННЫЕ ПИСЬМА
   ============================================================ */
function s4_renderReturned(mc){
  const returned=MAIL_DATA.filter(m=>m.status==='returned').slice(0,10);
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-undo-alt" style="color:var(--accent-red);"></i>Возвращённые письма</h2>
    <div style="background:#FFEBEE;border:1px solid #FFCDD2;border-radius:9px;padding:14px;font-size:12px;">
      <div style="font-weight:700;color:var(--accent-red);margin-bottom:4px;"><i class="fas fa-exclamation-triangle"></i> Внимание: возвращённые отправления</div>
      Согласно ст. 29.6.1 КоАП РФ, если письмо с постановлением возвращено в связи с истечением срока хранения, постановление считается вступившим в законную силу с момента возвращения. Срок оплаты отсчитывается от этой даты.
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-undo"></i>Список возвращённых</div>
        <button class="btn btn-p btn-sm" onclick="s4_processAllReturned()"><i class="fas fa-check-double"></i> Обработать все</button>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>Постановление</th><th>Получатель</th><th>Г/Н</th><th>Штраф</th><th>Причина возврата</th><th>Дата возврата</th><th>Действия</th></tr></thead>
          <tbody>${returned.map(m=>{
            const reasons=['Истёк срок хранения','Адресат не найден','Отказ от получения','Неправильный адрес','Адресат выбыл'];
            return`<tr>
              <td class="mono" style="font-size:10.5px;color:var(--primary);">${m.decId}</td>
              <td style="font-size:11.5px;">${m.owner.fam} ${m.owner.im?m.owner.im[0]+'.':''}${m.owner.ot?m.owner.ot[0]+'.':''}<br><span style="font-size:9.5px;color:var(--text3);">${m.owner.addr.substring(0,40)}...</span></td>
              <td><span class="plate" style="font-size:10px;">${m.plate}</span></td>
              <td class="mono" style="font-size:11px;font-weight:700;color:var(--success);">${m.fine.toLocaleString('ru')} ₽</td>
              <td><span class="sbadge sb-returned" style="font-size:9px;">${rnd(reasons)}</span></td>
              <td class="mono" style="font-size:10.5px;">${m.sentDate}</td>
              <td><div style="display:flex;gap:3px;">
                <button class="btn btn-w btn-sm" onclick="s4_resendReturned('${m.decId}')"><i class="fas fa-redo"></i> Переотправить</button>
                <button class="btn btn-s btn-sm" onclick="s4_markLegalForce('${m.decId}')"><i class="fas fa-gavel"></i> Вст. в силу</button>
              </div></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
  s4_markQuest(7);
}
function s4_resendReturned(id){toast(`${id}: повторная отправка инициирована. Проверьте актуальный адрес в РЭО.`,'info');}
function s4_markLegalForce(id){toast(`${id}: постановление вступило в законную силу с даты возврата. Начат отсчёт 60 суток.`,'success');}
function s4_processAllReturned(){s4_markQuest(7);toast('Все возвращённые письма обработаны, постановления вступили в силу','success');}

/* ============================================================
   КОНТРОЛЬ ОПЛАТЫ
   ============================================================ */
function s4_renderPayment(mc){
  const unpaid=MAIL_DATA.filter(m=>m.payStatus==='unpaid'||m.payStatus==='overdue');
  const overdue=MAIL_DATA.filter(m=>m.payStatus==='overdue');
  const halfPaid=MAIL_DATA.filter(m=>m.payStatus==='paid_half');
  const paid=MAIL_DATA.filter(m=>m.payStatus==='paid_full');
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-ruble-sign" style="color:var(--primary);"></i>Контроль оплаты штрафов <span class="live-ind" style="margin-left:5px;">LIVE</span></h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-p btn-sm" onclick="s4_syncGISGMP()"><i class="fas fa-sync"></i> Синхр. ГИС ГМП</button>
        <button class="btn btn-s btn-sm" onclick="s4_exportUnpaid()"><i class="fas fa-download"></i> Экспорт неоплаченных</button>
      </div>
    </div>

    <!-- Итоговые карты -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:11px;">
      ${[
        {lbl:'Оплачено полностью',val:paid.length,sum:paid.reduce((a,m)=>a+m.fine,0),c:'success',ico:'fa-check-circle'},
        {lbl:'Оплачено '+CAFAP_DISCOUNT.pct+'% (до '+CAFAP_DISCOUNT.days+' дн.)',val:halfPaid.length,sum:halfPaid.reduce((a,m)=>a+m.fine*(1-CAFAP_DISCOUNT.pct/100),0),c:'accent',ico:'fa-percentage'},
        {lbl:'Не оплачено (в сроке)',val:unpaid.length-overdue.length,sum:(unpaid.length-overdue.length)*800,c:'primary',ico:'fa-clock'},
        {lbl:'Просрочено',val:overdue.length,sum:overdue.reduce((a,m)=>a+m.fine,0),c:'accent-red',ico:'fa-exclamation-circle'}
      ].map(s=>`<div style="background:#fff;border:1px solid var(--border);border-radius:10px;padding:13px;position:relative;overflow:hidden;">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:var(--${s.c});"></div>
        <div style="font-size:22px;font-weight:800;font-family:'Courier New',monospace;color:var(--${s.c});">${s.val}</div>
        <div style="font-size:11px;color:var(--text2);font-weight:600;margin-bottom:2px;">${s.lbl}</div>
        <div style="font-size:10.5px;color:var(--text3);">${s.sum.toLocaleString('ru')} ₽</div>
        <div style="position:absolute;top:10px;right:10px;font-size:22px;opacity:.07;"><i class="fas ${s.ico}"></i></div>
      </div>`).join('')}
    </div>

    <!-- Таблица контроля -->
    <div class="card" style="flex:1;">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-list"></i>Детальный контроль оплаты</div>
        <div style="display:flex;gap:6px;">
          <select style="padding:5px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;" onchange="">
            <option>Все статусы</option><option>Просрочено</option><option>Не оплачено</option><option>Оплачено</option>
          </select>
          <button class="btn btn-d btn-sm" onclick="s4_generateAll2025()"><i class="fas fa-exclamation-triangle"></i> 20.25 по всем просрочен.</button>
        </div>
      </div>
      <div style="overflow-y:auto;max-height:360px;">
        <table class="data-table">
          <thead><tr><th>Постановление</th><th>Нарушитель</th><th>Г/Н</th><th>Штраф</th><th>Срок (осталось)</th><th>Льготный ${CAFAP_DISCOUNT.pct}%</th><th>Статус оплаты</th><th>Действия</th></tr></thead>
          <tbody>${MAIL_DATA.slice(0,25).map(m=>{
            const daysLeft=m.payDaysLeft;
            const timerClass=daysLeft>30?'pt-safe':daysLeft>10?'pt-warn':daysLeft>0?'pt-danger':'pt-overdue';
            const pyMap={paid_half:'sb-proc',paid_full:'sb-paid',unpaid:'sb-new',overdue:'sb-overdue'};
            const pyLbl={paid_half:'Оплачено '+CAFAP_DISCOUNT.pct+'%',paid_full:'Оплачено',unpaid:'Не оплачено',overdue:'ПРОСРОЧЕНО'};
            return`<tr>
              <td class="mono" style="font-size:10.5px;color:var(--primary);">${m.decId}</td>
              <td style="font-size:11px;">${m.owner.fam} ${m.owner.im?m.owner.im[0]+'.':''}${m.owner.ot?m.owner.ot[0]+'.':''}</td>
              <td><span class="plate" style="font-size:10px;">${m.plate}</span></td>
              <td class="mono" style="font-size:11px;font-weight:700;color:var(--success);">${m.fine.toLocaleString('ru')} ₽</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px;">
                  <div class="payment-timer ${timerClass}">${daysLeft>0?daysLeft+'д':'ПР'}</div>
                  <div style="font-size:10px;color:${daysLeft<0?'var(--accent-red)':daysLeft<10?'var(--accent)':'var(--text2)'};">
                    ${daysLeft>0?`осталось ${daysLeft} дн.`:`просрочено ${Math.abs(daysLeft)} дн.`}
                  </div>
                </div>
              </td>
              <td style="font-size:10.5px;">${m.halfPaidWindow>0?`${m.halfPaidWindow} дн. (${Math.round(m.fine*(1-CAFAP_DISCOUNT.pct/100)).toLocaleString('ru')} ₽)`:'—'}</td>
              <td><span class="sbadge ${pyMap[m.payStatus]||'sb-new'}" style="font-size:9px;">${pyLbl[m.payStatus]||m.payStatus}</span></td>
              <td><div style="display:flex;gap:3px;">
                <button class="btn btn-g btn-sm" onclick="s4_markPaid('${m.decId}','${m.fine}')"><i class="fas fa-check"></i></button>
                ${daysLeft<0?`<button class="btn btn-d btn-sm" onclick="s4_generate2025('${m.decId}','${m.fine}')"><i class="fas fa-exclamation-triangle"></i></button>`:''}
              </div></td>
            </tr>`;
          }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  s4_markQuest(8);
}

function s4_syncGISGMP(){
  toast('Запрос к ГИС ГМП... Получение данных об оплатах...','info');
  setTimeout(()=>{
    const newPaid=Math.floor(Math.random()*15)+5;
    MAIL_DATA.filter(m=>m.payStatus==='unpaid').slice(0,newPaid).forEach(m=>m.payStatus='paid_full');
    toast(`ГИС ГМП: загружено ${_GMP.length.toLocaleString('ru')} начислений, обнаружено ${newPaid} новых оплат штрафов`,'success');
    {const _e=document.getElementById('sbPaid');if(_e)_e.textContent=(parseInt(_e.textContent)||0)+(newPaid);}
    s4_markQuest(9);
  },1800);
}
function s4_exportUnpaid(){toast('Список неоплаченных экспортирован для передачи в ФССП','info');}
function s4_markPaid(id,fine){toast(`${id}: штраф ${parseInt(fine).toLocaleString('ru')} ₽ отмечен как оплаченный в ГИС ГМП`,'success');}
function s4_generate2025(id,fine){s4_showArt2025Modal(id,parseInt(fine));}
function s4_generateAll2025(){toast(`Сформировано ${OVERDUE_DATA.length} протоколов по ст.20.25 КоАП`,'warning');s4_markQuest(10);}

/* ============================================================
   СТ. 20.25 КоАП
   ============================================================ */
function s4_renderArt2025(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-exclamation-triangle" style="color:var(--accent-red);"></i>Модуль ст. 20.25 КоАП РФ — Неуплата штрафа</h2>
      <button class="btn btn-d" onclick="s4_generateAll2025()"><i class="fas fa-layer-group"></i> Сформировать все протоколы (${OVERDUE_DATA.length})</button>
    </div>

    <!-- Информация -->
    <div class="article2025-card">
      <div style="font-size:13px;font-weight:800;margin-bottom:6px;"><i class="fas fa-book-open"></i> Статья 20.25 КоАП РФ — Уклонение от исполнения административного наказания</div>
      <div style="font-size:11.5px;opacity:.9;margin-bottom:8px;">Неуплата административного штрафа в срок, предусмотренный КоАП РФ (60 суток), влечёт:</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;font-size:11px;">
        <div style="background:rgba(255,255,255,.12);border-radius:6px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:800;">× 2</div><div>Штраф в двойном размере (не менее 1000 руб.)</div></div>
        <div style="background:rgba(255,255,255,.12);border-radius:6px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:800;">до 15 суток</div><div>Административный арест</div></div>
        <div style="background:rgba(255,255,255,.12);border-radius:6px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:800;">до 50 часов</div><div>Обязательные работы</div></div>
      </div>
    </div>

    <!-- Таблица просроченных -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-list"></i>Просроченные штрафы — требуют протокола ст.20.25</div>
        <span class="sbadge sb-overdue">${OVERDUE_DATA.length} нарушителей</span>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th><input type="checkbox" style="cursor:pointer;" onchange="selectAll2025(this)"></th><th>Постановление</th><th>Нарушитель</th><th>Г/Н</th><th>Исходный штраф</th><th>Просрочено (дн.)</th><th>Новый штраф ×2</th><th>Статус 20.25</th><th>Действия</th></tr></thead>
          <tbody id="art2025Body">
            ${OVERDUE_DATA.map((m,i)=>{
              const overdueDays=Math.abs(Math.min(m.payDaysLeft,0));
              const newFine=Math.max(m.fine*2,1000);
              return`<tr id="row2025-${i}">
                <td><input type="checkbox" style="cursor:pointer;" class="cb2025"></td>
                <td class="mono" style="font-size:10.5px;color:var(--primary);">${m.decId}</td>
                <td style="font-size:11.5px;">${m.owner.fam} ${m.owner.im?m.owner.im[0]+'.':''}${m.owner.ot?m.owner.ot[0]+'.':''}<br><span style="font-size:9.5px;color:var(--text3);">${m.owner.born||''}</span></td>
                <td><span class="plate" style="font-size:10px;">${m.plate}</span></td>
                <td class="mono" style="font-size:11px;font-weight:700;color:var(--text2);">${m.fine.toLocaleString('ru')} ₽</td>
                <td><span style="background:#FFEBEE;color:var(--accent-red);border:1px solid #FFCDD2;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;">${overdueDays} дн.</span></td>
                <td class="mono" style="font-size:12px;font-weight:800;color:var(--accent-red);">${newFine.toLocaleString('ru')} ₽</td>
                <td><span class="sbadge sb-2025" id="st2025-${i}" style="font-size:9px;">Требует протокола</span></td>
                <td><div style="display:flex;gap:3px;">
                  <button class="btn btn-d btn-sm" onclick="s4_showArt2025Modal('${m.decId}',${m.fine})"><i class="fas fa-file-alt"></i> Протокол</button>
                  <button class="btn btn-s btn-sm" onclick="s4_scheduleHearing(${i})"><i class="fas fa-calendar"></i> Слушание</button>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
  s4_markQuest(10);
}

function selectAll2025(cb){document.querySelectorAll('.cb2025').forEach(el=>el.checked=cb.checked);}

function s4_showArt2025Modal(decId,fine){
  const newFine=Math.max(fine*2,1000);
  const hearingDate=new Date();hearingDate.setDate(hearingDate.getDate()+10);
  document.getElementById('art2025Content').innerHTML=`
    <div style="background:#FCE4EC;border:1px solid #F48FB1;border-radius:8px;padding:12px;margin-bottom:14px;font-size:11.5px;">
      <div style="font-weight:700;color:#880E4F;margin-bottom:4px;"><i class="fas fa-exclamation-triangle"></i> Основание: Неуплата штрафа по постановлению ${decId}</div>
      <div>Срок уплаты штрафа истёк. В соответствии со ст. 20.25 КоАП РФ возбуждается дело об административном правонарушении.</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
      <div>
        <div class="form-group"><label class="form-label">Постановление (основание)</label><input type="text" class="form-control mono" value="${decId}" readonly style="background:#F8FAFF;font-size:12px;"></div>
        <div class="form-group"><label class="form-label">Исходный штраф</label><input type="text" class="form-control mono" value="${fine.toLocaleString('ru')} руб." readonly style="background:#F8FAFF;"></div>
        <div class="form-group"><label class="form-label">Новый штраф по ст.20.25 (×2)</label><input type="text" class="form-control mono" value="${newFine.toLocaleString('ru')} руб." readonly style="background:#FFF3E0;font-weight:700;font-size:14px;color:var(--accent-red);border-color:var(--accent-red);"></div>
      </div>
      <div>
        <div class="form-group"><label class="form-label">Дата составления протокола</label><input type="text" class="form-control" value="${new Date().toLocaleDateString('ru')}"></div>
        <div class="form-group"><label class="form-label">Дата назначенного слушания</label><input type="text" class="form-control" value="${hearingDate.toLocaleDateString('ru')}"></div>
        <div class="form-group"><label class="form-label">Должностное лицо</label>
          <select class="form-select"><option>Инспектор Петров И.С.</option><option>Ст.инспектор Козлов А.Р.</option></select>
        </div>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Обстоятельства дела</label>
      <textarea class="form-control" rows="2" style="resize:none;">${decId} — нарушитель не уплатил административный штраф в установленный срок (60 суток). Уведомление было вручено/считается врученным.</textarea>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
      <button class="btn btn-s" onclick="closeModal('art2025Modal')">Отмена</button>
      <button class="btn btn-s" onclick="toast('Протокол сохранён как черновик','info')"><i class="fas fa-save"></i> Черновик</button>
      <button class="btn btn-d" onclick="s4_submitArt2025('${decId}','${newFine}')"><i class="fas fa-file-signature"></i> Подписать протокол ЭЦП</button>
    </div>`;
  document.getElementById('art2025Modal').style.display='flex';
}
function s4_submitArt2025(decId,fine){
  closeModal('art2025Modal');
  s4_markQuest(11);
  toast(`Протокол ст.20.25 по ${decId} подписан. Штраф ${parseInt(fine).toLocaleString('ru')} ₽. Назначено слушание.`,'warning');
}
function s4_scheduleHearing(i){
  const el=document.getElementById(`st2025-${i}`);
  if(el){el.className='sbadge sb-proc';el.textContent='Слушание назначено';}
  toast('Слушание по ст.20.25 назначено. Уведомление отправлено нарушителю.','info');
}

/* ============================================================
   КАЗНАЧЕЙСТВО / ГИС ГМП
   ============================================================ */
function s4_renderTreasury(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-landmark" style="color:var(--primary);"></i>Казначейство России · ГИС ГМП</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-plug"></i>Статус подключения ГИС ГМП</div><span class="sbadge sb-done">✓ ONLINE</span></div>
        <div class="card-body">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
            <div style="width:14px;height:14px;background:var(--success);border-radius:50%;animation:blink 2s infinite;"></div>
            <div style="font-size:13px;font-weight:700;color:var(--success);">Соединение установлено</div>
          </div>
          ${[['Хост ГИС ГМП','gis-gmp.roskazna.ru','ok'],['Протокол','СМЭВ 3.x','ok'],['Последняя синхронизация','сегодня 14:45','ok'],['Статус сертификата','Действует до 31.12.2026','ok'],['Задержка ответа','128 мс','ok']].map(([k,v,s])=>`
          <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border2);font-size:11.5px;">
            <span style="color:var(--text2);">${k}</span>
            <span style="font-weight:600;font-family:'Courier New',monospace;font-size:10.5px;color:${s==='ok'?'var(--success)':'var(--accent-red)'};">${v}</span>
          </div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-chart-bar"></i>Статистика платежей сегодня</div></div>
        <div class="card-body"><div class="chart-box" style="position:relative;height:247px;"><canvas id="payChart"></canvas></div></div>
      </div>
    </div>

    <!-- Последние платежи -->
    <div class="card">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-stream"></i>Последние подтверждённые платежи <span class="live-ind" style="margin-left:5px;">LIVE</span></div>
        <button class="btn btn-p btn-sm" onclick="s4_syncGISGMP()"><i class="fas fa-sync"></i> Синхронизировать</button>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>УИН</th><th>Постановление</th><th>Нарушитель</th><th>Сумма</th><th>Способ оплаты</th><th>Дата/Время</th><th>Статус</th></tr></thead>
          <tbody>${MAIL_DATA.filter(m=>m.payStatus==='paid_full').slice(0,12).map(m=>{
            const methods=['Gosuslugi.ru','Сбербанк Онлайн','Тинькофф','Наличными','Почта России','QR-код'];
            const payDate=new Date();payDate.setDate(payDate.getDate()-rndInt(1,30));
            return`<tr>
              <td class="mono" style="font-size:9.5px;color:var(--text3);">${m.uin.substring(0,15)}...</td>
              <td class="mono" style="font-size:10.5px;color:var(--primary);">${m.decId}</td>
              <td style="font-size:11px;">${m.owner.fam} ${m.owner.im?m.owner.im[0]+'.':''}${m.owner.ot?m.owner.ot[0]+'.':''}</td>
              <td class="mono" style="font-size:11.5px;font-weight:700;color:var(--success);">${m.fine.toLocaleString('ru')} ₽</td>
              <td style="font-size:10.5px;">${rnd(methods)}</td>
              <td class="mono" style="font-size:10.5px;">${payDate.toLocaleDateString('ru')}</td>
              <td><span class="sbadge sb-paid" style="font-size:9px;">✓ Подтверждено</span></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
  setTimeout(()=>{
    const ctx=document.getElementById('payChart');
    if(!ctx)return;
    safeChart(ctx,{type:'bar',data:{
      labels:['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00'],
      datasets:[
        {label:'Оплачено',data:[12,18,24,31,28,35,22,19],backgroundColor:'rgba(46,125,50,.2)',borderColor:'#2E7D32',borderWidth:1.5},
        {label:'Неоплачено',data:[5,7,9,12,8,15,11,8],backgroundColor:'rgba(197,44,40,.1)',borderColor:'#C62828',borderWidth:1.5}
      ]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{size:10}}}},scales:{y:{beginAtZero:true,ticks:{font:{size:10}}},x:{ticks:{font:{size:10}}}}}});
  },100);
}

/* ============================================================
   ФССП
   ============================================================ */
function s4_renderFSSP(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-university" style="color:var(--purple);"></i>Передача материалов в ФССП</h2>
      <button class="btn btn-p btn-lg" onclick="s4_transferAllFSSP()"><i class="fas fa-paper-plane"></i> Передать в ФССП (${FSSP_QUEUE.length})</button>
    </div>

    <!-- Статус ФССП -->
    <div class="fssp-card">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;">
        ${[{lbl:'К передаче',val:FSSP_QUEUE.length},{lbl:'В производстве (ФССП АС)',val:_PROC.filter(p=>p.stage!=='Завершено').length},{lbl:'Завершено',val:_PROC.filter(p=>p.stage==='Завершено').length},{lbl:'Сумма долга в работе (₽)',val:_PROC.filter(p=>p.stage!=='Завершено').reduce((a,p)=>a+p.debt,0).toLocaleString('ru')}].map(s=>`
        <div style="text-align:center;"><div style="font-size:22px;font-weight:800;font-family:'Courier New',monospace;">${s.val}</div><div style="font-size:11px;opacity:.7;">${s.lbl}</div></div>`).join('')}
      </div>
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.15);font-size:11px;opacity:.8;">
        <i class="fas fa-info-circle"></i> Основание передачи: истечение 60 суток со вступления постановления в законную силу + 10 суток на обжалование. Форма: исполнительный лист ФССП.
      </div>
    </div>

    <!-- Очередь ФССП -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-list"></i>Очередь передачи в ФССП</div></div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th><input type="checkbox" style="cursor:pointer;" onchange="s4_selFSSP(this)"></th><th>Постановление</th><th>Нарушитель</th><th>Г/Н</th><th>Долг (₽)</th><th>Просрочено</th><th>Основание</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>${FSSP_QUEUE.map((m,i)=>{
            const debt=m.fine+Math.max(m.fine*2,1000);
            const overdueDays=Math.abs(Math.min(m.payDaysLeft,0));
            return`<tr id="frow-${i}">
              <td><input type="checkbox" style="cursor:pointer;" class="cbfssp"></td>
              <td class="mono" style="font-size:10.5px;color:var(--primary);">${m.decId}</td>
              <td style="font-size:11px;">${m.owner.fam} ${m.owner.im?m.owner.im[0]+'.':''}${m.owner.ot?m.owner.ot[0]+'.':''}<br><span style="font-size:9.5px;color:var(--text3);">${m.owner.addr.substring(0,35)}...</span></td>
              <td><span class="plate" style="font-size:10px;">${m.plate}</span></td>
              <td class="mono" style="font-size:12px;font-weight:800;color:var(--accent-red);">${debt.toLocaleString('ru')} ₽</td>
              <td><span style="background:#FFEBEE;color:#B71C1C;border:1px solid #FFCDD2;border-radius:4px;padding:2px 7px;font-size:11px;font-weight:700;">${overdueDays} дн.</span></td>
              <td style="font-size:10.5px;">Ст.20.25 КоАП</td>
              <td><span class="sbadge sb-fssp" id="fst-${i}" style="font-size:9px;">К передаче</span></td>
              <td><div style="display:flex;gap:3px;">
                <button class="btn btn-purple btn-sm" style="background:var(--purple);color:#fff;" onclick="s4_showFSSPModal(${i})"><i class="fas fa-university"></i> Передать</button>
                <button class="btn btn-s btn-sm" onclick="toast('Исполнительный лист сформирован','info')"><i class="fas fa-file"></i></button>
              </div></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
    <!-- Производства в ФССП АС (база data/fssp.js) -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-gavel"></i>Исполнительные производства в ФССП АС</div><span style="font-size:11px;color:var(--text3);">последние 10 из ${_PROC.length}</span></div>
      <div style="overflow-x:auto;"><table class="data-table"><thead><tr><th>№ ИП</th><th>Должник</th><th>Г/Н</th><th>Долг (₽)</th><th>Стадия</th><th>Пристав</th><th>Возбуждено</th></tr></thead>
        <tbody>${_PROC.slice(0,10).map(p=>{const o=_OWN.get(p.ownerId);return`<tr><td class="mono" style="font-size:10.5px;color:var(--primary);">${p.ipNo}</td><td style="font-size:11px;">${o?o.fam+' '+o.im[0]+'.'+(o.ot?o.ot[0]+'.':''):'—'}</td><td><span class="plate" style="font-size:10px;">${p.plate}</span></td><td class="mono" style="font-weight:700;">${p.debt.toLocaleString('ru')}</td><td><span class="sbadge sb-fssp" style="font-size:9px;">${p.stage}</span></td><td style="font-size:11px;">${p.bailiff}</td><td style="font-size:11px;">${p.started}</td></tr>`}).join('')}</tbody></table></div>
    </div>
  </div>`;
  s4_markQuest(11);
}

function s4_selFSSP(cb){document.querySelectorAll('.cbfssp').forEach(el=>el.checked=cb.checked);}

function s4_showFSSPModal(i){
  const m=FSSP_QUEUE[i];if(!m)return;
  const debt=m.fine+Math.max(m.fine*2,1000);
  document.getElementById('fsspContent').innerHTML=`
    <div style="background:#EDE7F6;border:1px solid #CE93D8;border-radius:8px;padding:12px;margin-bottom:14px;font-size:11.5px;">
      <div style="font-weight:700;color:#4527A0;margin-bottom:3px;"><i class="fas fa-university"></i> Передача дела в Федеральную службу судебных приставов</div>
      Основание: ст. 20.25 КоАП РФ + задолженность по постановлению ${m.decId}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Должник</div>
        <div style="font-size:11.5px;margin-bottom:3px;"><span style="color:var(--text2);">ФИО:</span> <strong>${m.owner.fam} ${m.owner.im||''} ${m.owner.ot||''}</strong></div>
        <div style="font-size:11.5px;margin-bottom:3px;"><span style="color:var(--text2);">Адрес:</span> ${m.owner.addr}</div>
        <div style="font-size:11.5px;margin-bottom:3px;"><span style="color:var(--text2);">Г/Н ТС:</span> <span class="plate" style="font-size:10px;">${m.plate}</span></div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px;">Взыскание</div>
        <div style="background:#F3E5F5;border-radius:7px;padding:10px;text-align:center;">
          <div style="font-size:11px;color:var(--text2);">Сумма к взысканию</div>
          <div style="font-size:22px;font-weight:800;color:var(--purple);font-family:'Courier New',monospace;">${debt.toLocaleString('ru')} ₽</div>
          <div style="font-size:10px;color:var(--text3);">Штраф ${m.fine.toLocaleString('ru')} + ст.20.25: ${Math.max(m.fine*2,1000).toLocaleString('ru')}</div>
        </div>
      </div>
    </div>
    <div class="form-group"><label class="form-label">Орган ФССП-получатель</label>
      <select class="form-select"><option>РОСП по Северному АО г. Москвы</option><option>РОСП по ЦАО г. Москвы</option><option>РОСП по ЮАО г. Москвы</option></select>
    </div>
    <div class="form-group"><label class="form-label">Примечания для пристава</label>
      <textarea class="form-control" rows="2" style="resize:none;" placeholder="Дополнительная информация..."></textarea>
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
      <button class="btn btn-s" onclick="closeModal('fsspModal')">Отмена</button>
      <button class="btn btn-s" onclick="toast('Исполнительный лист ФССП сформирован','info')"><i class="fas fa-file"></i> Сформировать ИЛ</button>
      <button class="btn btn-g" onclick="s4_confirmFSSP(${i})"><i class="fas fa-paper-plane"></i> Подписать ЭЦП и передать</button>
    </div>`;
  document.getElementById('fsspModal').style.display='flex';
}

function s4_confirmFSSP(i){
  closeModal('fsspModal');
  const el=document.getElementById(`fst-${i}`);
  if(el){el.className='sbadge sb-fssp';el.innerHTML='✓ Передано в ФССП';el.style.background='#EDE7F6';el.style.color='#4527A0';}
  s4_markQuest(11);
  {const _e=document.getElementById('sbFssp');if(_e)_e.textContent=(parseInt(_e.textContent)||0)+(1);}
  toast(`Дело передано в ФССП. Исполнительное производство возбуждено.`,'success');
}

function s4_transferAllFSSP(){
  FSSP_QUEUE.forEach((_,i)=>{
    const el=document.getElementById(`fst-${i}`);
    if(el){el.className='sbadge sb-fssp';el.innerHTML='✓ ФССП';}
  });
  s4_markQuest(11);
  toast(`${FSSP_QUEUE.length} дел передано в ФССП · ЭЦП применена`,'success');
  {const _e=document.getElementById('sbFssp');if(_e)_e.textContent=(parseInt(_e.textContent)||0)+(FSSP_QUEUE.length);}
}

/* ============================================================
   ИСПОЛНИТЕЛЬНОЕ ПРОИЗВОДСТВО
   ============================================================ */
function s4_renderEnforce(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-gavel" style="color:var(--purple);"></i>Исполнительное производство ФССП</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      ${[
        {lbl:'Всего в производстве',val:47,sub:'активных дел',c:'purple'},
        {lbl:'Взыскано в этом месяце',val:'184 500 ₽',sub:'по 23 делам',c:'success'},
        {lbl:'Среднее время взыскания',val:'34 дня',sub:'от передачи',c:'primary'}
      ].map(s=>`<div style="background:#fff;border:1px solid var(--border);border-radius:10px;padding:14px;">
        <div style="font-size:20px;font-weight:800;color:var(--${s.c});font-family:'Courier New',monospace;">${s.val}</div>
        <div style="font-size:12px;color:var(--text2);font-weight:600;">${s.lbl}</div>
        <div style="font-size:10.5px;color:var(--text3);margin-top:2px;">${s.sub}</div>
      </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-list"></i>Активные исполнительные производства</div></div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr><th>№ ИП</th><th>Должник</th><th>Г/Н</th><th>Долг</th><th>Пристав</th><th>Возбуждено</th><th>Стадия</th><th>Действия</th></tr></thead>
          <tbody>${Array.from({length:12},(_,i)=>{
            const owner=OWNERS[i%OWNERS.length];const plate=PLATES[i%PLATES.length];
            const debt=rndInt(1000,15000);
            const stages=['Возбуждено','Запрос в банки','Арест счёта','Арест имущества','Взыскание','Завершено'];
            const stage=stages[rndInt(0,stages.length-1)];
            const bailiffs=['Иванова Е.К.','Петров Д.С.','Сидорова О.Н.','Кузьмин А.В.'];
            const issueDate=new Date();issueDate.setDate(issueDate.getDate()-rndInt(5,90));
            return`<tr>
              <td class="mono" style="font-size:10.5px;color:var(--purple);">ИП-77-2026-${String(5000+i).padStart(5,'0')}</td>
              <td style="font-size:11px;">${owner.fam} ${owner.im?owner.im[0]+'.':''}${owner.ot?owner.ot[0]+'.':''}</td>
              <td><span class="plate" style="font-size:10px;">${plate}</span></td>
              <td class="mono" style="font-size:11.5px;font-weight:700;color:var(--accent-red);">${debt.toLocaleString('ru')} ₽</td>
              <td style="font-size:11px;">${rnd(bailiffs)}</td>
              <td class="mono" style="font-size:10.5px;">${issueDate.toLocaleDateString('ru')}</td>
              <td><span class="sbadge sb-fssp" style="font-size:9px;">${stage}</span></td>
              <td><button class="btn btn-s btn-sm" onclick="toast('Статус ИП обновлён','info')"><i class="fas fa-sync"></i></button></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   QUEST SYSTEM
   ============================================================ */
const QSTEPS=[
  {n:1,title:'Почтовая очередь',text:'Откройте раздел <strong>«Почтовая отправка»</strong>. Изучите статусы писем и нажмите кнопку «Просмотр» любого письма.'},
  {n:2,title:'Просмотр письма',text:'В предварительном просмотре убедитесь в наличии: <strong>штрих-кода, трек-номера, реквизитов постановления, адреса доставки</strong>.'},
  {n:3,title:'Отправка одного письма',text:'Нажмите кнопку <strong>«Отправить»</strong> в модальном окне предварительного просмотра или в строке таблицы.'},
  {n:4,title:'Отправка партии',text:'Нажмите <strong>«Отправить партию»</strong> для массовой отправки всех готовых писем в Почту России.'},
  {n:5,title:'Экспорт реестра РТМ',text:'Нажмите <strong>«Реестр РТМ»</strong> для формирования и экспорта партионного протокола РТМ 0003.05-10.'},
  {n:6,title:'Очередь печати',text:'Откройте <strong>«Очередь печати»</strong> и запустите <strong>«Печатать все»</strong>. Наблюдайте за анимацией принтера.'},
  {n:7,title:'Отслеживание доставки',text:'Откройте <strong>«Отслеживание доставки»</strong>. Введите любой трек-номер из таблицы и отследите письмо.'},
  {n:8,title:'Возвращённые письма',text:'Откройте <strong>«Возвращённые письма»</strong>. Изучите причины возврата и нажмите «Обработать все».'},
  {n:9,title:'Контроль оплаты',text:'Откройте <strong>«Контроль оплаты»</strong>. Найдите просроченные штрафы (красный таймер) и нажмите <strong>«Синхр. ГИС ГМП»</strong>.'},
  {n:10,title:'Протокол ст.20.25',text:'В разделе <strong>«Ст. 20.25 КоАП»</strong> нажмите кнопку <strong>«Протокол»</strong> для просроченного штрафа и подпишите протокол ЭЦП.'},
  {n:11,title:'Передача в ФССП',text:'Откройте <strong>«Передача в ФССП»</strong>. Выберите дела и нажмите <strong>«Передать в ФССП»</strong>.'},
  {n:12,title:'Переход к Этапу 5',text:'Вы освоили исполнительный модуль ЦАФАП! Перейдите к <strong>Этапу 5: Аналитика и мониторинг</strong>.'}
];
const HINTS=[
  {t:'Реестр РТМ 0003.05-10',txt:'Стандарт партионной почты Почты России. Содержит реестр всех заказных писем партии, используется для автоматического формирования накладных.'},
  {t:'Срок уплаты штрафа',txt:'60 суток со дня вступления постановления в силу. Скидка '+CAFAP_DISCOUNT.pct+'% — при оплате в течение '+CAFAP_DISCOUNT.days+' суток со дня вынесения постановления. После 60 суток — ст.20.25 КоАП (двойной штраф).'},
  {t:'ГИС ГМП',txt:'Государственная информационная система о государственных и муниципальных платежах. Автоматически регистрирует все оплаты штрафов через банки и сервисы.'},
  {t:'Передача в ФССП',txt:'Осуществляется через 70 суток (60+10) после вступления постановления в силу при неуплате. Основание: ст.32.2 КоАП РФ.'}
];
const GLOSSARY=[
  {t:'РТМ 0003.05-10',d:'Стандарт партионной почты России'},
  {t:'ГИС ГМП',d:'Государственная информационная система о платежах'},
  {t:'ФССП',d:'Федеральная служба судебных приставов'},
  {t:'ИП',d:'Исполнительное производство'},
  {t:'ИЛ',d:'Исполнительный лист ФССП'},
  {t:'СМЭВ',d:'Система межведомственного электронного взаимодействия'},
  {t:'Ст.20.25 КоАП',d:'Неуплата административного штрафа в срок'},
  {t:'Ст.32.2 КоАП',d:'Исполнение постановления о наложении штрафа'},
  {t:'УИН',d:'Уникальный идентификатор начисления для оплаты'},
  {t:'Казначейство',d:'Федеральное казначейство — получатель средств от штрафов'}
];

const Q4ST=SPA_STATE.quest[4];
function s4_initQuest(){Q4ST.done=[];Q4ST.step=0;s4_updateQuestUI();s4_renderInstContent();}
function s4_markQuest(idx){if(!Q4ST.done.includes(idx)){Q4ST.done.push(idx);s4_updateQuestUI();logEvent('quest_step',{step:idx,title:QSTEPS[idx]?.title||'',total:QSTEPS.length});toast(`✅ Шаг ${idx+1}: ${QSTEPS[idx]?.title||''}!`,'success');}}
function s4_nextQuest(){if(Q4ST.step<QSTEPS.length-1){s4_markQuest(Q4ST.step);Q4ST.step++;s4_updateQuestUI();}else{toast('🎓 Этап 4 пройден! Переходите к Этапу 5.','success');s4_markQuest(Q4ST.step);}}
function s4_restartQuest(){Q4ST.done=[];Q4ST.step=0;s4_updateQuestUI();toast('Квест перезапущен','info');}
function s4_updateQuestUI(){
  const pct=Math.round((Q4ST.done.length/Q4ST.total)*100);
  const el=document.getElementById('questPct');if(el)el.textContent=pct+'%';
  const pf=document.getElementById('instProgFill');if(pf)pf.style.width=pct+'%';
  const pt=document.getElementById('instProgTxt');if(pt)pt.textContent=`${Q4ST.done.length}/${Q4ST.total} шагов`;
  s4_renderInstContent();
}
function s4_switchInstTab(el,tab){document.querySelectorAll('.inst-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');S4T.instTab=tab;s4_renderInstContent();}
function s4_renderInstContent(){
  const body=document.getElementById('instBody');if(!body)return;
  const tab=S4T.instTab||'mission';
  if(tab==='mission'){
    const cur=Q4ST.step;
    body.innerHTML=`<div>
      <div style="font-size:11.5px;font-weight:700;color:var(--primary);margin-bottom:7px;">📋 ЭТАП 4: Почта, оплата, ст.20.25 КоАП, ФССП</div>
      <div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:4px;">
        ${QSTEPS.map((s,i)=>{const done=Q4ST.done.includes(i);const active=cur===i;return`<div style="text-align:center;flex-shrink:0;width:62px;"><div class="qs-num ${done?'qn-done':active?'qn-active':'qn-pend'}" style="margin:0 auto 3px;">${done?'✓':s.n}</div><div style="font-size:9px;color:${done?'var(--success)':active?'var(--primary)':'var(--text3)'};line-height:1.2;">${s.title.split(' ').slice(0,2).join(' ')}</div></div>`;}).join('')}
      </div>
      ${cur<QSTEPS.length?`<div style="margin-top:7px;padding:8px 10px;background:var(--primary-xs);border-radius:6px;border-left:3px solid var(--primary);"><div style="font-size:10.5px;font-weight:700;color:var(--primary);margin-bottom:2px;">▶ Шаг ${cur+1}/${QSTEPS.length}: ${QSTEPS[cur]?.title}</div><div style="font-size:11px;">${QSTEPS[cur]?.text}</div></div>`:'<div style="padding:8px;background:#E8F5E9;border-radius:6px;font-size:11px;color:var(--success);font-weight:700;">🎓 Этап 4 завершён! Переходите к Этапу 5.</div>'}
    </div>`;
  } else if(tab==='hints'){
    body.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;">${HINTS.map(h=>`<div style="flex:1;min-width:180px;padding:8px;background:#F8FAFF;border-radius:6px;border:1px solid var(--border2);"><div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:3px;">💡 ${h.t}</div><div style="font-size:10.5px;color:var(--text2);line-height:1.4;">${h.txt}</div></div>`).join('')}</div>`;
  } else if(tab==='progress'){
    const pct=Math.round((Q4ST.done.length/Q4ST.total)*100);
    body.innerHTML=`<div style="display:flex;gap:14px;align-items:center;">
      <div style="text-align:center;padding:10px 18px;background:var(--primary-xs);border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:28px;font-weight:800;color:var(--primary);font-family:'Courier New',monospace;">${pct}%</div>
        <div style="font-size:10px;color:var(--text2);">Этап 4</div>
      </div>
      <div style="flex:1;"><div class="prog-bar" style="height:10px;margin-bottom:7px;"><div class="prog-fill" style="width:${pct}%;"></div></div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <span style="font-size:10px;background:#E8F5E9;color:var(--success);padding:2px 8px;border-radius:10px;">✓ ${Q4ST.done.length}</span>
          <span style="font-size:10px;background:var(--primary-xs);color:var(--primary);padding:2px 8px;border-radius:10px;">▶ ${Q4ST.total-Q4ST.done.length}</span>
        </div>
      </div>
      <div style="font-size:10.5px;color:var(--text2);">
        <div>1–3. Этапы 1-3 ✅</div>
        <div style="font-weight:700;color:var(--primary);">4. Почта/ФССП ← здесь</div>
        <div style="color:var(--text3);">5. Аналитика</div><div style="color:var(--text3);">6. Администрирование</div>
      </div>
    </div>`;
  } else if(tab==='glossary'){
    body.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:5px;">${GLOSSARY.map(g=>`<div style="padding:4px 9px;background:#F8FAFF;border-radius:4px;border:1px solid var(--border2);"><span style="font-size:11px;font-weight:700;color:var(--primary);">${g.t}</span><span style="font-size:10px;color:var(--text2);margin-left:4px;">— ${g.d}</span></div>`).join('')}</div>`;
  }
}
function s4_toggleInst(){
  S4T.instCollapsed=!S4T.instCollapsed;
  const c=document.getElementById('instContent'),ico=document.getElementById('instTogIco'),panel=document.getElementById('instPanel');
  if(S4T.instCollapsed){c.style.display='none';panel.style.height='42px';ico.className='fas fa-chevron-up';}
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


/* ------ Stage 4 exports ------ */
  window.s4_setSection = (typeof s4_setSection!=="undefined") ? s4_setSection : window.s4_setSection;
  window.s4_renderMail = (typeof s4_renderMail!=="undefined") ? s4_renderMail : window.s4_renderMail;
  window.s4_showLetter = (typeof s4_showLetter!=="undefined") ? s4_showLetter : window.s4_showLetter;
  window.s4_sendSingle = (typeof s4_sendSingle!=="undefined") ? s4_sendSingle : window.s4_sendSingle;
  window.s4_sendBatch = (typeof s4_sendBatch!=="undefined") ? s4_sendBatch : window.s4_sendBatch;
  window.s4_exportRegistry = (typeof s4_exportRegistry!=="undefined") ? s4_exportRegistry : window.s4_exportRegistry;
  window.s4_resend = (typeof s4_resend!=="undefined") ? s4_resend : window.s4_resend;
  window.s4_selectAll = (typeof s4_selectAll!=="undefined") ? s4_selectAll : window.s4_selectAll;
  window.s4_filterMail = (typeof s4_filterMail!=="undefined") ? s4_filterMail : window.s4_filterMail;
  window.s4_renderPrint = (typeof s4_renderPrint!=="undefined") ? s4_renderPrint : window.s4_renderPrint;
  window.s4_startPrintAll = (typeof s4_startPrintAll!=="undefined") ? s4_startPrintAll : window.s4_startPrintAll;
  window.s4_printSingle = (typeof s4_printSingle!=="undefined") ? s4_printSingle : window.s4_printSingle;
  window.s4_renderTracking = (typeof s4_renderTracking!=="undefined") ? s4_renderTracking : window.s4_renderTracking;
  window.s4_trackLetter = (typeof s4_trackLetter!=="undefined") ? s4_trackLetter : window.s4_trackLetter;
  window.s4_renderReturned = (typeof s4_renderReturned!=="undefined") ? s4_renderReturned : window.s4_renderReturned;
  window.s4_resendReturned = (typeof s4_resendReturned!=="undefined") ? s4_resendReturned : window.s4_resendReturned;
  window.s4_markLegalForce = (typeof s4_markLegalForce!=="undefined") ? s4_markLegalForce : window.s4_markLegalForce;
  window.s4_processAllReturned = (typeof s4_processAllReturned!=="undefined") ? s4_processAllReturned : window.s4_processAllReturned;
  window.s4_renderPayment = (typeof s4_renderPayment!=="undefined") ? s4_renderPayment : window.s4_renderPayment;
  window.s4_syncGISGMP = (typeof s4_syncGISGMP!=="undefined") ? s4_syncGISGMP : window.s4_syncGISGMP;
  window.s4_exportUnpaid = (typeof s4_exportUnpaid!=="undefined") ? s4_exportUnpaid : window.s4_exportUnpaid;
  window.s4_markPaid = (typeof s4_markPaid!=="undefined") ? s4_markPaid : window.s4_markPaid;
  window.s4_generate2025 = (typeof s4_generate2025!=="undefined") ? s4_generate2025 : window.s4_generate2025;
  window.s4_generateAll2025 = (typeof s4_generateAll2025!=="undefined") ? s4_generateAll2025 : window.s4_generateAll2025;
  window.s4_renderArt2025 = (typeof s4_renderArt2025!=="undefined") ? s4_renderArt2025 : window.s4_renderArt2025;
  window.s4_showArt2025Modal = (typeof s4_showArt2025Modal!=="undefined") ? s4_showArt2025Modal : window.s4_showArt2025Modal;
  window.s4_submitArt2025 = (typeof s4_submitArt2025!=="undefined") ? s4_submitArt2025 : window.s4_submitArt2025;
  window.s4_scheduleHearing = (typeof s4_scheduleHearing!=="undefined") ? s4_scheduleHearing : window.s4_scheduleHearing;
  window.s4_renderTreasury = (typeof s4_renderTreasury!=="undefined") ? s4_renderTreasury : window.s4_renderTreasury;
  window.s4_renderFSSP = (typeof s4_renderFSSP!=="undefined") ? s4_renderFSSP : window.s4_renderFSSP;
  window.s4_selFSSP = (typeof s4_selFSSP!=="undefined") ? s4_selFSSP : window.s4_selFSSP;
  window.s4_showFSSPModal = (typeof s4_showFSSPModal!=="undefined") ? s4_showFSSPModal : window.s4_showFSSPModal;
  window.s4_confirmFSSP = (typeof s4_confirmFSSP!=="undefined") ? s4_confirmFSSP : window.s4_confirmFSSP;
  window.s4_transferAllFSSP = (typeof s4_transferAllFSSP!=="undefined") ? s4_transferAllFSSP : window.s4_transferAllFSSP;
  window.s4_renderEnforce = (typeof s4_renderEnforce!=="undefined") ? s4_renderEnforce : window.s4_renderEnforce;
  window.s4_initQuest = (typeof s4_initQuest!=="undefined") ? s4_initQuest : window.s4_initQuest;
  window.s4_markQuest = (typeof s4_markQuest!=="undefined") ? s4_markQuest : window.s4_markQuest;
  window.s4_nextQuest = (typeof s4_nextQuest!=="undefined") ? s4_nextQuest : window.s4_nextQuest;
  window.s4_restartQuest = (typeof s4_restartQuest!=="undefined") ? s4_restartQuest : window.s4_restartQuest;
  window.s4_updateQuestUI = (typeof s4_updateQuestUI!=="undefined") ? s4_updateQuestUI : window.s4_updateQuestUI;
  window.s4_switchInstTab = (typeof s4_switchInstTab!=="undefined") ? s4_switchInstTab : window.s4_switchInstTab;
  window.s4_renderInstContent = (typeof s4_renderInstContent!=="undefined") ? s4_renderInstContent : window.s4_renderInstContent;
  window.s4_toggleInst = (typeof s4_toggleInst!=="undefined") ? s4_toggleInst : window.s4_toggleInst;
  if(typeof S4T!=="undefined") window.S4T = S4T;
  if(typeof Q4ST!=="undefined") window.Q4ST = Q4ST;
  window.selectAll2025=selectAll2025; window.trackNum=trackNum;
  window.s4_badges=function(){return {mail:MAIL_DATA.filter(m=>m.status==='pending').length,print:Math.min(12,MAIL_DATA.filter(m=>m.status==='pending').length),returned:MAIL_DATA.filter(m=>m.status==='returned').length,pay:MAIL_DATA.filter(m=>m.payStatus==='unpaid'||m.payStatus==='overdue').length,art2025:OVERDUE_DATA.length,fssp:FSSP_QUEUE.length};};
})(); /* end Stage 4 IIFE */
/* initStage4 */
function initStage4(){if(typeof s4_setSection==="function")s4_setSection("mail",null);}
