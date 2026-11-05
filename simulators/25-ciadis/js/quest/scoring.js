'use strict';
/* Звания в режиме обучения */
const RANKS = [
  {min:0,  name:'Стажёр'},
  {min:80, name:'Специалист'},
  {min:140,name:'Старший специалист'},
  {min:190,name:'Эксперт ЦИАДИС-МВД'}
];
function getRank(xp){
  return RANKS.filter(r=>xp>=r.min).pop();
}

// Часы
setInterval(()=>{const c=el('tb-clock');if(c)c.textContent=getDate()+' '+getTime();},1000);

// Закрытие дропдауна по клику вне
document.addEventListener('click',e=>{
  const drop=el('rs-drop');
  const btn=el('role-btn');
  if(drop&&!drop.contains(e.target)&&!btn?.contains(e.target))
    drop.classList.remove('on');
});

// Сквозной перехват кликов — сырые данные для тепловых карт на платформе проверки
document.addEventListener('click', e=>{
  const t = e.target.closest('[id]') || e.target;
  S.clicks.push({
    t: nowISO(),
    elapsedMs: Date.now() - T0,
    x: e.clientX, y: e.clientY,
    vw: window.innerWidth, vh: window.innerHeight,
    view: S.view,
    step: (S.step < QUEST.length ? QUEST[S.step].id : null),
    tag: e.target.tagName,
    id: t && t.id ? t.id : null,
    label: (e.target.textContent||'').trim().slice(0,40)
  });
}, true);

// Табы (декоративно)
document.addEventListener('click',e=>{
  if(e.target.classList.contains('tab')&&!e.target.classList.contains('on')){
    const wrap=e.target.closest('.tabs');
    if(wrap){ wrap.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
      e.target.classList.add('on'); }
  }
});
