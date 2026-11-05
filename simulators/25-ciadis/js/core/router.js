'use strict';
/* =====================================================
   НАВИГАЦИЯ
   ===================================================== */
function go(sec) {
  document.querySelectorAll('.sb-item').forEach(e=>e.classList.remove('active'));
  const ni = el('n-'+sec);
  if(ni) ni.classList.add('active');
  S.view = sec;
  logEvent('navigate', { to: sec });
  // флаги навигации
  if(sec==='search')     { S.flags.searchNav=true; checkQ(); }
  if(sec==='requests')   { S.flags.reqsNav=true;   checkQ(); }
  if(sec==='statistics') { S.flags.statNav=true;   checkQ(); }
  if(sec==='log')        { S.flags.logNav=true;    checkQ(); }
  // рендер
  const C = el('content');
  switch(sec){
    case 'dash':       C.innerHTML=rDash();       break;
    case 'search':     C.innerHTML=rSearch();     setTimeout(bindSearch,0); break;
    case 'cards':      C.innerHTML=rCards();      break;
    case 'requests':   C.innerHTML=rRequests();   break;
    case 'statistics': C.innerHTML=rStat();       break;
    case 'log':        C.innerHTML=rLog();        break;
    case 'users':      C.innerHTML=rUsers();      break;
    case 'system':     C.innerHTML=rSystem();     break;
    case 'help':       C.innerHTML=rHelp();       break;
    default:           C.innerHTML='<div style="padding:24px;color:var(--muted)">Раздел не найден</div>';
  }
  setTimeout(glow,80);
}
