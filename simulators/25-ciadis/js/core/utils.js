'use strict';
/* =====================================================
   УТИЛИТЫ
   ===================================================== */
function el(id){ return document.getElementById(id); }
function getTime(){ return new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); }
function getDate(){ return new Date().toLocaleDateString('ru-RU'); }
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function addLog(action,type='info'){ S.logs.push({time:getTime(),action,type}); }

/* Отображаемое имя пользователя: ФИО курсанта, введённое при входе (иначе — имя роли) */
function userName() { return (S.cadet && S.cadet.fio) || (ROLES[S.role] && ROLES[S.role].disp) || '—'; }
function userInitials() {
  const w = userName().split(/\s+/).filter(Boolean);
  return (((w[0]||'?').charAt(0)) + ((w[1]||'').charAt(0))).toUpperCase();
}
