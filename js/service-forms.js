/* ЛОГИКА приложения. Данные — в data/. */
function findRealSvc(svc){return SVC_REAL.find(r=>r.sid?r.sid===svc.id:(r.nm&&new RegExp(r.nm,'i').test(svc.name)))||null;}
function renderRealSvc(svc,r){
  const E=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  document.getElementById('svcTitle').textContent=r.t;
  const bn=document.getElementById('svcBreadcrumbName');bn.textContent=r.t.length>70?r.t.slice(0,70)+'…':r.t;
  const tabs=document.querySelectorAll('.svc-detail-tab');
  tabs.forEach(t=>{const k=(r.tk||['desc','qa','dev']).indexOf(t.dataset.t);const ok=k>=0&&k<r.tabs.length;t.style.display=ok?'':'none';if(ok)t.textContent=r.tabs[k];});
  if(r.tk&&r.tk.indexOf('desc')<0){}
  const nb=document.getElementById('svcNoticesBlock');
  if((r.al&&r.al.length)||(r.bl&&r.bl.length)){nb.style.display='';document.getElementById('svcNoticesList').innerHTML=(r.bl||[]).map(a=>'<div class="rv-n rv-b">'+a+'</div>').join('')+(r.al||[]).map(a=>'<div class="svc-notice svc-notice--change" style="display:flex;justify-content:space-between;align-items:center;gap:14px;"><div>'+a+'</div><img src="'+WARN_ICON+'" alt="" style="width:22px;height:22px;flex-shrink:0;"></div>').join('');document.getElementById('svcNoticesFooter').textContent='Приносим извинения за временные неудобства.';}else nb.style.display='none';
  let L='<div class="svc-block-title">Описание сервиса</div><div class="svc-desc-text rv-desc">'+r.d+'</div>';
  if(r.reg)L+='<label class="rv-lbl">Выберите свой регион из списка:</label><select class="rv-sel"><option>23 Краснодарский край</option><option>01 Республика Адыгея</option><option>16 Республика Татарстан</option><option>77 г. Москва</option><option>78 г. Санкт-Петербург</option><option>86 Ханты-Мансийский автономный округ - Югра</option></select>';
  if(r.wp)L+='<label class="rv-lbl">Выберите рабочее место:</label>'+r.wp.map((w,k)=>'<label class="rv-rd"><input type="radio" name="rvwp" '+(k?'':'checked')+'>'+w+'</label>').join('');
  if(r.sel)L+='<label class="rv-lbl">'+r.sel[0]+'</label><select class="rv-sel" onchange="document.querySelectorAll(\'.rv-main\').forEach(b=>b.style.opacity=1)"><option>'+r.sel[1]+'</option><option>01 Республика Адыгея</option><option>23 Краснодарский край</option><option>77 г. Москва</option></select><div style="height:16px"></div>';
  let _bt=(r.btn||[]).slice();if(!_bt.some(b=>/Воспользоваться сервисом"?$/.test(b)))_bt.unshift('Воспользоваться сервисом');
  _bt.forEach(b=>{const main=/Воспользоваться сервисом"?$/.test(b);const bh='<button class="rv-btn'+(main?' rv-main':'')+'" style="margin:0;flex:0 1 335px'+(main&&r.mainDis?';opacity:.55':'')+'" onclick="'+(main?'openCurrentSim()':"showToast(\'"+b.replace(/["\'«»]/g,'')+"\')")+'">'+b+'</button>';
    L+='<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">'+bh+(main?'<button class="btn-sm instr" style="padding:9px 18px;font-size:13px;" onclick="openCurrentInstruction()"><span class="icon" data-icon="doc"></span> Инструкция</button>':'')+'</div>';});
  L+=(r.post||'');
  if(r.tr)L+='<div class="rv-h" style="margin-top:40px"><div class="svc-block-title">Обучение по сервису</div></div><div style="text-align:right;margin:-8px 0 8px"><a class="rv-h" style="display:inline;font:italic 11.5px inherit;color:var(--blue);cursor:pointer" onclick="showToast(\'Обучение\')">Перейти к сервису »</a></div>'+r.tr.map(t=>'<div class="rv-card" onclick="showToast(\'Курс обучения\')">'+t+'<u>›</u></div>').join('');
  let R=r.nodocsx?'':'<div class="rv-h"><div class="svc-block-title">Документы</div><a onclick="showToast(\'Все документы\')" style="margin-bottom:14px">Все документы »</a></div>';
  (r.docs||[]).forEach((g,gi)=>{R+='<div class="rv-sub"><span style="color:var(--text-light)">'+(gi?'+':'—')+'</span>'+g[0]+'</div>'+g[1].map(d=>{const x={pdf:'pdf',xls:'xlsx',doc2:'docx',ppt:'pptx',mp4:'mp4'}[d[0]];return '<div class="doc-item" onclick="showToast(\'Открытие документа...\')"><div class="doc-badge" style="background:'+({pdf:'#d9534f',xlsx:'#3d9a5b',docx:'#2b79c0',pptx:'#e8832a',mp4:'#8e5bb5'}[x])+'">'+x+'</div><div><div class="doc-name">'+d[1]+'</div><div class="doc-date">Загружен '+d[2]+'</div></div></div>'}).join('');});
  if(r.extra)R+='<div class="svc-block-title" style="margin-top:24px">Запросы на обслуживание</div>'+r.extra.map(e=>'<div style="margin-bottom:4px"><a style="color:var(--blue);cursor:pointer;font-size:13px">'+e+'</a></div>').join('');
  if(r.forum)R+='<div class="svc-block-title" style="margin-top:24px">Форум по сервису</div><div class="rv-card" onclick="showToast(\'Форум\')">Обсуждение сервиса на форуме<u>›</u></div>';
  if(r.resp&&r.resp.length)R+='<div class="svc-block-title" style="margin-top:26px">Ответственные за развитие сервиса</div>'+r.resp.map(p=>{const w=p[0].split(' ');return '<div class="rv-p"><div class="rv-ph"><span class="icon" data-icon="person"></span></div><div><div style="font-size:13px"><b>'+w[0]+'</b> '+w.slice(1).join(' ')+'</div>'+(p[1]?'<div class="rv-pr">'+p[1]+'</div>':'')+'</div></div>'+((p[2]||p[3])?'<div class="rv-c">'+(p[2]?'<span><span class="icon" data-icon="phone" style="width:13px;height:13px;color:var(--blue)"></span>'+p[2]+'</span>':'')+(p[3]?'<span><span class="icon" data-icon="mail" style="width:13px;height:13px;color:var(--blue)"></span>'+p[3]+'</span>':'')+'</div>':'')}).join('');
  if(r.ts!==undefined)R+='<div class="support-block"><div class="svc-block-title" style="margin-top:22px">Техническая поддержка</div><div class="srow"><span class="icon" data-icon="phone"></span> 8 800 2000-462</div><div class="srow"><span class="icon" data-icon="phone"></span> 8 495 031-67-17</div></div>';
  document.getElementById('svc-tab-desc').innerHTML='<div class="svc-layout"><div>'+L+'</div><div>'+R+'</div></div>';
  document.getElementById('svc-tab-qa').innerHTML=renderDefaultQaHTML();fillDefaultQa();
  document.getElementById('svc-tab-dev').innerHTML=renderDefaultDevHTML();
  if(typeof applyIcons==='function')applyIcons();
}

function openServiceDetail(id) {
  const svc = allServices.find(s => s.id === id);
  if (!svc) return;
  currentSvcId = id;
  document.getElementById('svcTitle').textContent = svc.name;
  document.getElementById('svcBreadcrumbName').textContent = svc.name;

  const devTab = document.querySelector('.svc-detail-tab[data-t="dev"]');
  const noticesBlock = document.getElementById('svcNoticesBlock');

  document.querySelectorAll('.svc-detail-tab').forEach(t => t.style.display = '');
  const _real = findRealSvc(svc);
  if (_real) { renderRealSvc(svc, _real); } else if (id === 1) {
    if (devTab) devTab.style.display = '';
    noticesBlock.style.display = '';
    renderSvc1Notices();
    document.getElementById('svc-tab-desc').innerHTML = renderSvc1DescHTML();
    document.getElementById('svc-tab-qa').innerHTML = renderSvc1QaHTML();
    document.getElementById('svc-tab-dev').innerHTML = renderSvc1DevHTML();
  } else if (id === 49) {
    if (devTab) devTab.style.display = 'none';
    noticesBlock.style.display = 'none';
    document.getElementById('svc-tab-desc').innerHTML = renderSvc49DescHTML();
    document.getElementById('svc-tab-qa').innerHTML = renderDefaultQaHTML();
    fillDefaultQa();
    document.getElementById('svc-tab-dev').innerHTML = renderDefaultDevHTML();
  } else {
    if (devTab) devTab.style.display = '';
    noticesBlock.style.display = 'none';
    document.getElementById('svc-tab-desc').innerHTML = renderDefaultDescHTML();
    fillDefaultDesc(svc);
    document.getElementById('svc-tab-qa').innerHTML = renderDefaultQaHTML();
    fillDefaultQa();
    document.getElementById('svc-tab-dev').innerHTML = renderDefaultDevHTML();
  }

  applyIcons();   // иконки телефона/почты/персоны во всех шаблонах (СЭП, СУДИС, настройка АРМ и др.)
  switchSvcTab('desc');
  switchNav(document.querySelector('[data-section=services]'), 'svcdetail');
}

function goToServicesList() {
  switchNav(document.querySelector('[data-section=services]'), 'services');
}

function switchSvcTab(t) {
  document.querySelectorAll('.svc-detail-tab').forEach(el => el.classList.toggle('active', el.dataset.t === t));
  ['desc','qa','dev'].forEach(id => {
    const el = document.getElementById('svc-tab-' + id);
    if (el) el.style.display = id === t ? 'block' : 'none';
  });
}

function openCurrentSim() { if (currentSvcId) openSim(currentSvcId); }
function openCurrentInstruction() { if (currentSvcId) openInstruction(currentSvcId); }
