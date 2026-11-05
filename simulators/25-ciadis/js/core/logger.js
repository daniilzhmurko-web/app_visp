'use strict';
/* =====================================================
   СКВОЗНОЕ ЖУРНАЛИРОВАНИЕ (для JSON-отчёта курсанта)
   ===================================================== */
function nowISO(){ return new Date().toISOString(); }

function genSessionId(){
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,10);
}

// Единая точка регистрации структурированного события в журнале
function logEvent(type, data={}){
  S.events.push(Object.assign({
    seq: S.events.length + 1,
    t: nowISO(),
    elapsedMs: Date.now() - T0,
    type,
    view: S.view,
    role: S.role
  }, data));
}

function dateStamp(){
  const d = new Date();
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
