'use strict';
/* =====================================================
   КВЕСТ-ДВИЖОК
   ===================================================== */
function ensureStepStart(q){
  if(!S.stepTimes[q.id]){
    S.stepTimes[q.id]={ startedAt: nowISO(), completedAt: null, hints: 0 };
    logEvent('step_started', { step:q.id, title:q.title });
  }
}

function checkQ() {
  if(S.mode==='exam'){ examCheck(); return; }   // экзамен: свободный порядок, свой движок (exam.js)
  if(S.step>=QUEST.length) return;
  if(S.advancing) return;   // шаг уже завершён и ожидает отложенного перехода — не обрабатываем повторно
  const q=QUEST[S.step];
  ensureStepStart(q);
  if(q.ok()){
    S.advancing=true;
    S.xp+=q.xp;
    S.done.push(q.id);
    const st=S.stepTimes[q.id];
    st.completedAt=nowISO();
    const durationMs=new Date(st.completedAt)-new Date(st.startedAt);
    logEvent('step_completed', { step:q.id, title:q.title, xp:q.xp, durationMs, hintsUsed:st.hints });
    el('q-status').className='qst qst-ok';
    el('q-status').innerHTML='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg> Выполнено';
    el('qxp').textContent=S.xp;
    toast('Шаг выполнен! +'+q.xp+' XP','Переход к следующему шагу...','success');
    setTimeout(()=>{
      S.step++;
      S.hIdx=0;
      S.advancing=false;
      el('q-hint').style.display='none';
      if(S.step>=QUEST.length){ showMC(); return; }
      ensureStepStart(QUEST[S.step]);
      updQ();
      glow();
      checkQ(); // ловим условия, которые уже стали истинными, пока шёл переход к этому шагу
    },1400);
  }
  updQProgress();
  updQUI();
}

function updQUI() {
  if(S.mode==='exam'){ examRenderPanel(); return; }
  if(S.step>=QUEST.length) return;
  const q=QUEST[S.step];
  el('q-stitle').textContent=`Шаг ${q.id}: ${q.title}`;
  el('q-desc').textContent=q.desc;
  el('q-obj').textContent=q.obj;
  el('qstep').textContent=`${q.id}/14`;
  el('qxp').textContent=S.xp;
  if(!q.ok()){
    el('q-status').className='qst qst-wait';
    el('q-status').innerHTML='<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg> Ожидание действия';
  }
  // обновить подсказку на логин-экране
  const lqt=el('lq-text');
  if(lqt) lqt.textContent=q.obj;
}

function updQ(){ updQUI(); updQProgress(); }

function updQProgress() {
  if(S.mode==='exam') return;
  const pct=S.step/QUEST.length*100;
  el('qpfill').style.width=pct+'%';
}

function showHint() {
  if(S.mode==='exam') return;                   // в экзамене подсказки отключены
  if(S.step>=QUEST.length) return;
  const q=QUEST[S.step];
  const h=q.hints;
  const hbox=el('q-hint');
  hbox.style.display='block';
  hbox.innerHTML=`<i class="fas fa-lightbulb"></i> <b>Подсказка ${S.hIdx+1}/${h.length}:</b> ${h[S.hIdx]}`;
  ensureStepStart(q);
  S.stepTimes[q.id].hints++;
  logEvent('hint_used', { step:q.id, hintIndex:S.hIdx });
  S.hIdx=(S.hIdx+1)%h.length;
  S.hints++;
}

function toggleQP() {
  const body=el('qbody');
  const chev=el('q-chevron');
  S.qOpen=!S.qOpen;
  body.style.display=S.qOpen?'flex':'none';
  chev.className=S.qOpen?'fas fa-chevron-up':'fas fa-chevron-down';
  chev.style.color='#58A6FF';
}

/* Подсветка квест-цели */
function glow() {
  document.querySelectorAll('.qglow').forEach(e=>e.classList.remove('qglow'));
  if(S.mode==='exam') return;                   // в экзамене подсвечивать цели нельзя
  const targets={
    1:['#l-btn','#l-role'],
    2:['#n-search'],
    3:['#s-type'],
    4:['#s-sur','#s-btn'],
    5:[''],
    6:['#cv-btn'],
    7:['#er-btn'],
    9:['#role-btn'],
    10:['#n-requests'],
    12:['#n-statistics'],
    13:['#n-log'],
  };
  const t=targets[S.step]||[];
  t.forEach(sel=>{const e=sel&&document.querySelector(sel);if(e)e.classList.add('qglow');});
}
