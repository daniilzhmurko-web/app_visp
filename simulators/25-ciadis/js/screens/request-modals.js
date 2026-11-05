'use strict';
/* =====================================================
   МОДАЛЬНЫЕ ОКНА
   ===================================================== */
function openEdit(cid) {
  const c=CARDS.find(x=>x.id===cid);
  if(!c) return;
  el('m-cid').value=c.id;
  el('m-oval').value=c.fio;
  el('m-nval').value='';
  el('m-reason').value='';
  el('m-ctype').value='';
  el('m-edit').classList.add('on');
  S.flags.modalOpen=true;
  logEvent('edit_form_opened', { cid });
  checkQ();
}

function submitEdit() {
  const ct=el('m-ctype').value;
  const nv=el('m-nval').value.trim();
  const rs=el('m-reason').value.trim();
  const cid=el('m-cid').value;
  const c=CARDS.find(x=>x.id===cid);
  if(!ct){toast('Ошибка','Выберите тип изменения','err');logEvent('validation_error',{form:'edit',field:'ctype'});return;}
  if(!nv){toast('Ошибка','Укажите новое значение','err');logEvent('validation_error',{form:'edit',field:'nval'});return;}
  if(!rs){toast('Ошибка','Укажите основание','err');logEvent('validation_error',{form:'edit',field:'reason'});return;}
  const rid='ЗАП-2024-00'+(randInt(47,99));
  S.reqs.unshift({
    id:rid,cid:cid,fio:c?.fio||'—',ct:ct,ctl:CTYPES[ct]||ct,
    ov:el('m-oval').value,nv:nv,reason:rs,status:'pending',
    created:getDate()+' '+getTime(),
    user:userName(),urole:ROLES[S.role]?.name||'—'
  });
  S.reqId=rid;
  S.flags.reqSent=true;
  S.flags.ownReqId=rid;
  addNotif({ kind:'req', title:'Создан запрос '+rid, text:'Изменение карты '+cid+' — ожидает обработки', to:'requests' });
  if(S.mode==='exam') examOnRequestCreated(rid,cid,ct,nv);
  closeM('m-edit');
  addLog(`Создан запрос ${rid} на редактирование ${cid}`,'req');
  logEvent('edit_request_submitted', { rid, cid, changeType:ct, newValue:nv });
  toast('Запрос создан','Номер: '+rid,'success');
  const badge=el('req-badge');
  if(badge) badge.textContent=S.reqs.filter(r=>r.status==='pending').length;
  checkQ();
}

function openConfirm(rid) {
  const r=S.reqs.find(x=>x.id===rid);
  if(!r) return;
  S.reqId=rid;
  el('m-confirm-body').innerHTML=`
<div style="background:#F8FAFC;border-radius:9px;padding:14px">
  ${dkf('Запрос №',`<code>${r.id}</code>`)}
  ${dkf('Дактилокарта',`<code>${r.cid}</code> — ${r.fio}`)}
  ${dkf('Тип изменения',r.ctl)}
  ${dkf('Текущее значение',`<span style="background:#FFF3CD;padding:2px 6px;border-radius:4px">${r.ov}</span>`)}
  ${dkf('Новое значение',`<span style="background:#D4EDDA;padding:2px 6px;border-radius:4px">${r.nv}</span>`)}
  ${dkf('Основание',r.reason)}
  ${dkf('Инициатор',`${r.user} (${r.urole})`)}
</div>`;
  el('m-confirm').classList.add('on');
  logEvent('request_review_opened', { rid });
}

function confirmReq() {
  const r=S.reqs.find(x=>x.id===S.reqId);
  if(r){
    r.status='confirmed';
    const c=CARDS.find(x=>x.id===r.cid);
    if(c){
      // Применяем изменение в карточке в зависимости от типа поля.
      // 'status' и 'other' не мапятся напрямую на служебные поля/enum карточки,
      // поэтому для них фиксируется только статус заявки (требует ручной обработки).
      if(r.ct==='fio')    c.fio=r.nv;
      else if(r.ct==='dob')    c.dob=r.nv;
      else if(r.ct==='region') c.region=r.nv;
    }
    if(r.id===S.flags.ownReqId) S.flags.ownReqConfirmed=true;
    if(S.mode==='exam') examOnRequestConfirmed(r);
  }
  S.flags.reqConf=true;
  S.lastConfirmedReqId=S.reqId;
  closeM('m-confirm');
  addLog(`Запрос ${S.reqId} подтверждён`,'confirm');
  logEvent('request_confirmed', { rid: S.reqId, changeType: r?.ct });
  toast('Запрос подтверждён','Данные обновлены в базе ЦИАДИС-МВД','success');
  const badge=el('req-badge');
  if(badge) badge.textContent=Math.max(0,S.reqs.filter(r=>r.status==='pending').length);
  checkQ();
  go('requests');
}

function rejectReq() {
  const r=S.reqs.find(x=>x.id===S.reqId);
  if(r) r.status='rejected';
  closeM('m-confirm');
  addLog(`Запрос ${S.reqId} отклонён`,'reject');
  logEvent('request_rejected', { rid: S.reqId });
  toast('Запрос отклонён','Данные остались без изменений','warn');
  const badge=el('req-badge');
  if(badge) badge.textContent=Math.max(0,S.reqs.filter(x=>x.status==='pending').length);
  go('requests');
}

function closeM(id){ el(id).classList.remove('on'); }


/* Текущее значение зависит от выбранного типа изменения */
function syncOldValue(){
  const c=CARDS.find(x=>x.id===el('m-cid').value); const t=el('m-ctype').value;
  if(!c) return;
  el('m-oval').value = t==='fio'?c.fio : t==='dob'?c.dob : t==='region'?c.region
    : t==='status'?(c.status==='active'?'Актуальна':'На проверке') : '—';
}
