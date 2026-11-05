'use strict';
function fmtDate(d) { if(!d) return '—'; if(typeof d==='string') return d; return d.toLocaleDateString('ru-RU'); }
function fmtDateTime(d) { if(!d) return '—'; return d.toLocaleString('ru-RU'); }
function typeLabel(t) {
  return {migration_reg:'Миграционный учёт',patent:'Патент',rvp:'РВП',vnzh:'ВНЖ'}[t]||t;
}
function rowColor(daysOld) {
  if(daysOld===0) return 'row-green';
  if(daysOld<=2) return 'row-yellow';
  return 'row-red';
}
function badgeForStatus(s) {
  const m = {new:'badge-green',pending:'badge-yellow',waiting:'badge-blue',done:'badge-gray',approved:'badge-green',rejected:'badge-red'};
  const l = {new:'Новое',pending:'В обработке',waiting:'Ожидание',done:'Закрыто',approved:'Одобрено',rejected:'Отказано'};
  return `<span class="badge ${m[s]||'badge-gray'}">${l[s]||s}</span>`;
}

// ── TOAST ─────────────────────────────────────────
function toast(msg, type='info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = {success:'<svg class="ic" aria-hidden="true"><use href="#i-check-circle"/></svg>',danger:'<svg class="ic" aria-hidden="true"><use href="#i-x-circle"/></svg>',warning:'<svg class="ic" aria-hidden="true"><use href="#i-alert-triangle"/></svg>',info:'<svg class="ic" aria-hidden="true"><use href="#i-info"/></svg>'};
  t.innerHTML = `<span>${icons[type]||icons.info}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(30px)'; t.style.transition='all 0.3s'; setTimeout(()=>t.remove(),300); }, 3200);
}

// ── CLOCK ─────────────────────────────────────────
function startClock() {
  setInterval(()=>{
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    const el = document.getElementById('topbar-clock');
    if(el) el.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

// ── NAVIGATION ────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.getElementById('nav-'+name.replace('-module','').replace('-list','').replace('instructor','instructor'));
  if(nav) nav.classList.add('active');
  
  const screens = {
    'dashboard': renderDashboard,
    'queue': renderQueue,
    'migration-module': renderMigrationModule,
    'patent-module': renderPatentModule,
    'rvp-module': renderRvpModule,
    'dossier-list': renderDossierList,
    'violations': renderViolations,
    'instructor': renderInstructor,
    'reports': renderReports,
    'audit': renderAudit,
  };

  const fn = screens[name];
  if(fn) fn();
  if(STATE.sessionId) {
    logAudit('НАВИГАЦИЯ', `Переход на экран: ${name}`, { category: 'NAV' });
  }
}

function setContentTitle(title, sub) {
  document.getElementById('content-title').textContent = title;
  document.getElementById('content-subtitle').textContent = sub || '';
}

function setContent(html) {
  document.getElementById('content-body').innerHTML = html;
}

// ── QUEUE BADGE ───────────────────────────────────
function updateQueueBadge() {
  const newCount = CASES.filter(c=>c.status==='new').length;
  const el = document.getElementById('queue-badge');
  if(el) el.textContent = newCount;
}

function toggleInstructions() {
  const panel = document.getElementById('instruction-panel');
  const btn = document.getElementById('instr-toggle');
  panel.classList.toggle('collapsed');
  btn.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
  btn.title = panel.classList.contains('collapsed') ? 'Развернуть инструкции' : 'Свернуть инструкции';
}

// ── MODAL HELPERS ─────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay=>{
  overlay.addEventListener('click', function(e){
    if(e.target === this) this.classList.add('hidden');
  });
});

// ── TAB SWITCHING ─────────────────────────────────
function switchTab(event, tabId) {
  const container = event.target.closest('.card-body, .modal-body, #content-body');
  if(!container) return;
  container.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  container.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById(tabId)?.classList.add('active');
}
