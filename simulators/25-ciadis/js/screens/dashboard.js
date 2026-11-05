'use strict';
/* =====================================================
   РЕНДЕР: ГЛАВНАЯ ПАНЕЛЬ
   ===================================================== */
function rDash() {
  const pend = S.reqs.filter(r=>r.status==='pending').length;
  return `
<div class="breadcrumb"><i class="fas fa-home"></i><span class="sep">/</span><span class="cur">Главная панель</span></div>
<div class="sec-hdr">
  <div><div class="sec-title">Главная панель</div><div class="sec-sub">Обзор системы ЦИАДИС-МВД · ${getDate()}</div></div>
  <div style="font-size:11px;color:var(--muted)">Последнее обновление: ${getTime()}</div>
</div>
<div class="stats-grid">
  <div class="stat-card">
    <div style="font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-bottom:7px">Всего дактилокарт</div>
    <div class="stat-v">247 831</div>
    <div class="stat-d"><i class="fas fa-arrow-up"></i> +1 234 за месяц</div>
  </div>
  <div class="stat-card" style="border-left-color:#C0392B">
    <div style="font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-bottom:7px">Уголовные</div>
    <div class="stat-v" style="color:#C0392B">156 422</div>
    <div class="stat-d" style="color:#C0392B"><i class="fas fa-arrow-up"></i> +423 за месяц</div>
  </div>
  <div class="stat-card" style="border-left-color:#1E8449">
    <div style="font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-bottom:7px">Гражданские</div>
    <div class="stat-v" style="color:#1E8449">78 901</div>
    <div class="stat-d"><i class="fas fa-arrow-up"></i> +789 за месяц</div>
  </div>
  <div class="stat-card" style="border-left-color:#D35400">
    <div style="font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-bottom:7px">Запросов на актуализацию</div>
    <div class="stat-v" style="color:#D35400">${pend+2}</div>
    <div class="stat-d" style="color:#D35400"><i class="fas fa-clock"></i> ${pend} ожидают обработки</div>
  </div>
</div>
<div class="dash-grid">
  <div class="card">
    <div class="card-hdr"><i class="fas fa-history" style="color:#003F8A"></i><span class="card-title">Последние операции</span></div>
    <div style="max-height:280px;overflow-y:auto">
      ${FEED.map(f=>`<div class="act-item" style="padding:10px 18px">
        <div class="act-dot" style="background:${{info:'#003F8A',search:'#2D7DD2',view:'#1E8449',req:'#D35400',edit:'#7D3C98',stat:'#16A085',audit:'#C0392B'}[f.tp]||'#8A9AB0'}"></div>
        <div><div style="font-size:12px"><b>${f.u}</b> — ${f.a}</div>
        <div style="font-size:10px;color:var(--muted);margin-top:2px">${f.t} · ${f.r}</div></div>
      </div>`).join('')}
    </div>
  </div>
  <div style="display:flex;flex-direction:column;gap:16px">
    <div class="card">
      <div class="card-hdr"><i class="fas fa-server" style="color:#003F8A"></i><span class="card-title">Статус системы</span></div>
      <div class="card-body">
        ${[['ЦБД АДИС','В СЕТИ'],['Сервисы регионов','87/87'],['АДИС «Папилон»','АКТИВНА'],['Криптозащита','ОК']].map(([n,v])=>`
        <div class="sys-row"><span>${n}</span><span class="online"><i class="fas fa-circle" style="font-size:7px"></i> ${v}</span></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-hdr"><i class="fas fa-user" style="color:#003F8A"></i><span class="card-title">Сессия</span></div>
      <div class="card-body">
        <div style="font-size:13px;margin-bottom:7px"><b>${userName()}</b></div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:3px">Роль: ${ROLES[S.role]?.name||'—'}</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:3px">Сессия: #${randInt(10000,99999)}</div>
        <div style="font-size:11px;color:var(--muted)">Время входа: ${getTime()}</div>
      </div>
    </div>
  </div>
</div>`;
}
