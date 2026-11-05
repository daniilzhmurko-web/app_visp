'use strict';
/* =====================================================
   АВТОРИЗАЦИЯ
   ===================================================== */
function doLogin() {
  const tokenName = window.IdentityToken && IdentityToken.getName();
  const fio = tokenName || document.getElementById('l-fio').value.trim();
  const platoon = document.getElementById('l-platoon').value.trim();
  if(!fio || !platoon){
    toast('Не заполнены данные', 'Укажите ФИО и номер взвода курсанта перед входом','err');
    if(!fio) document.getElementById('l-fio').focus();
    else document.getElementById('l-platoon').focus();
    return;
  }
  const tokenMode = window.IdentityToken && IdentityToken.getMode && IdentityToken.getMode();
  S.mode = (tokenMode==='exam' || tokenMode==='training') ? tokenMode : (el('l-mode') ? el('l-mode').value : 'training');
  if(S.exam && !S.exam.finished) S.mode = 'exam';          // начатый экзамен нельзя сменить на обучение
  const role = S.mode==='exam' ? 'external' : document.getElementById('l-role').value;
  S.cadet.fio = fio;
  S.cadet.platoon = platoon;
  S.cadet.syncTag = (window.IdentityToken && IdentityToken.getSeal('b')) || null;
  S.role = role;
  S.flags.logged = true;
  S.timeline.loginAt = S.timeline.loginAt || nowISO();
  if(S.mode==='exam') examStart(platoon);
  logEvent('login', { fio, platoon, role, mode: S.mode });
  const login = document.getElementById('login');
  login.style.opacity = '0';
  setTimeout(()=>{
    login.style.display = 'none';
    const ws = document.getElementById('ws');
    ws.style.display = 'flex';
    ws.style.flexDirection = 'column';
    updRole();
    go('dash');
    addLog('Вход в систему', 'info');
    toast('Вход выполнен', 'Добро пожаловать в ЦИАДИС-МВД, '+fio+'!','success');
    // Init pending requests
    S.reqs = [
      { id:'ЗАП-2024-0045', cid:'ДК-2023-1899', fio:'Сидорова М.А.',
        ct:'fio', ctl:'Изменение ФИО',
        ov:'Сидорова Мария Александровна', nv:'Сидорова Мария Дмитриевна',
        reason:'Изменение фамилии по свидетельству о браке IV-МЮ №876543',
        status:'pending', created:'2024-05-10 10:15',
        user:'Иванов И.И.', urole:'Сторонний пользователь' },
      { id:'ЗАП-2024-0046', cid:'ДК-2024-0089', fio:'Кузнецов И.П.',
        ct:'region', ctl:'Изменение региона',
        ov:'Краснодарский край', nv:'Ростовская область',
        reason:'Смена места регистрации, документы от 05.05.2024',
        status:'pending', created:'2024-05-10 11:30',
        user:'Козлов П.Н.', urole:'Оператор тер. станции' }
    ];
    initNotifs();
    checkQ();
  }, 420);
}

function doLogout() {
  if(!confirm('Выйти из системы?')) return;
  addLog('Выход из системы', 'info');
  logEvent('logout');
  document.getElementById('ws').style.display = 'none';
  const l = document.getElementById('login');
  l.style.display = 'flex';
  l.style.opacity = '1';
  S.role = null; S.flags.logged = false;
}

function updRole() {
  const r = ROLES[S.role];
  if(!r) return;
  el('rb-top').textContent = r.name.split(' ')[0];
  el('rb-top').className = 'rbadge ' + r.cls;
  el('rn-top').textContent = r.name;
  el('uav').textContent = userInitials();
  el('un-top').textContent = userName(); el('un-top').title = userName();
  // Admin items
  const isAdm = ['sysadmin','security'].includes(S.role);
  document.querySelectorAll('.adm-only').forEach(e => e.style.display = isAdm?'':'none');
  buildRS();
}

function buildRS() {
  const drop = el('rs-drop');
  drop.innerHTML = '<div style="padding:7px 13px;font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--border);margin-bottom:5px">Переключение роли</div>';
  Object.entries(ROLES).forEach(([k,r])=>{
    const d = document.createElement('div');
    d.className = 'rs-opt'+(k===S.role?' cur':'');
    d.innerHTML = `<div class="rs-icon" style="background:${r.color}"><i class="fas ${r.ic}"></i></div><div><div class="rs-name">${r.name}</div><div class="rs-desc">${r.disp}</div></div>${k===S.role?'<i class="fas fa-check" style="margin-left:auto;color:#003F8A;font-size:12px"></i>':''}`;
    d.onclick = ()=>switchRole(k);
    drop.appendChild(d);
  });
}

function toggleRS() { el('rs-drop').classList.toggle('on'); }

function switchRole(r) {
  if(r===S.role){ el('rs-drop').classList.remove('on'); return; }
  const prev = ROLES[S.role]?.name||'—';
  S.role = r;
  if(r==='operator') S.flags.roleSw = true;
  updRole();
  el('rs-drop').classList.remove('on');
  addLog(`Смена роли: ${prev} → ${ROLES[r].name}`, 'info');
  logEvent('role_switch', { from: prev, to: ROLES[r].name });
  toast('Роль изменена','Вы работаете как: '+ROLES[r].name,'info');
  checkQ();
  go(S.view);
}
