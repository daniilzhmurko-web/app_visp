'use strict';
// ── WELCOME ────────────────────────────────────────
let _selectedModule = 'migration';
let _selectedRole = 'inspector';

function selectModule(m) {
  _selectedModule = m;
  document.querySelectorAll('.module-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('mc-'+m)?.classList.add('selected');
  if(m==='instructor') selectRole('instructor', document.getElementById('rb-instructor'));
}

function selectRole(r, el) {
  _selectedRole = r;
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('selected'));
  if(el) el.classList.add('selected');
}

function startSimulator() {
  // ── Авторизация: ФИО и номер взвода обязательны для входа ──
  const fioInput = document.getElementById('input-cadet-fio');
  const platoonInput = document.getElementById('input-cadet-platoon');
  const tokenName = window.IdentityToken && IdentityToken.getName();
  const fio = tokenName || fioInput?.value.trim() || '';
  const platoon = platoonInput?.value.trim() || '';

  if(!fio || !platoon) {
    toast('Укажите ФИО и номер взвода перед входом в систему', 'warning');
    (!fio ? fioInput : platoonInput)?.focus();
    return;
  }

  STATE.cadetInfo = { fio, platoon, syncTag: (window.IdentityToken && IdentityToken.getSeal('b')) || null };
  STATE.sessionId = `SIM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  STATE.sessionStart = Date.now();

  STATE.module = _selectedModule;
  STATE.role = _selectedRole;
  const roleNames = {inspector:'Инспектор ОВМ',senior:'Ст. инспектор ОВМ',chief:'Начальник ОВМ',control:'Сотрудник ИК',instructor:'Преподаватель'};
  const roleIcons = {inspector:'<svg class="ic" aria-hidden="true"><use href="#i-officer"/></svg>',senior:'<svg class="ic" aria-hidden="true"><use href="#i-chevrons-up"/></svg>',chief:'<svg class="ic" aria-hidden="true"><use href="#i-star"/></svg>',control:'<svg class="ic" aria-hidden="true"><use href="#i-search"/></svg>',instructor:'<svg class="ic" aria-hidden="true"><use href="#i-grad-cap"/></svg>'};
  document.getElementById('topbar-role-name').textContent = roleNames[STATE.role];
  document.getElementById('topbar-role-icon').innerHTML = roleIcons[STATE.role];
  const cadetNameEl = document.getElementById('topbar-cadet-name');
  if(cadetNameEl) cadetNameEl.textContent = `${fio} · взвод ${platoon}`;

  document.getElementById('screen-welcome').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  generateQueueCases();
  generateCadets();
  startClock();
  logAudit('ВХОД', `${fio}, взвод ${platoon}. Роль: ${roleNames[STATE.role]}, Модуль: ${STATE.module}`, {
    category: 'AUTH',
    extra: { fio, platoon, role: STATE.role, module: STATE.module, sessionId: STATE.sessionId }
  });
  toast(`Добро пожаловать, ${fio}! Вы вошли как ${roleNames[STATE.role]}`, 'info');

  if(STATE.module === 'instructor') {
    showScreen('instructor');
  } else {
    showScreen('dashboard');
  }
}
