'use strict';
/* =====================================================
   РЕНДЕР: ЖУРНАЛ ОПЕРАЦИЙ
   ===================================================== */
function rLog() {
  const typeMap={info:['#2D7DD2','ВХОД'],search:['#7D3C98','ПОИСК'],view:['#1E8449','ПРОСМОТР'],
    req:['#D35400','ЗАПРОС'],edit:['#D35400','ИЗМЕН.'],stat:['#16A085','СТАТ.'],
    audit:['#C0392B','АУДИТ'],confirm:['#1E8449','ПОДТВ.'],reject:['#C0392B','ОТКЛ.']};
  const all=[...FEED.map(f=>({time:f.t,user:f.u,action:f.a,role:f.r,type:f.tp})),
    ...S.logs.map(l=>({time:l.time,user:userName(),
      action:l.action,role:ROLES[S.role]?.name||'—',type:l.type}))].reverse();
  return `
<div class="breadcrumb"><i class="fas fa-home"></i><span class="sep">/</span><span class="cur">Журнал операций</span></div>
<div class="sec-hdr">
  <div><div class="sec-title">Журнал операций</div><div class="sec-sub">Аудит действий пользователей в системе ЦИАДИС-МВД</div></div>
  <button class="btn btn-out btn-sm"><i class="fas fa-download"></i> Экспорт</button>
</div>
<div class="card">
  <div class="card-hdr"><i class="fas fa-list-alt" style="color:#003F8A"></i>
    <span class="card-title">Записи аудита</span>
    <span style="margin-left:auto;font-size:11px;color:var(--muted)">${all.length} записей за сегодня</span>
  </div>
  <div>
    ${all.map(l=>{const [tc,tn]=typeMap[l.type]||['#8A9AB0','СОБЫТИЕ'];return`
    <div class="log-row">
      <span class="log-t">${l.time}</span>
      <span class="log-type" style="background:${tc}18;color:${tc}">${tn}</span>
      <span class="log-a"><span class="log-u">[${l.role}] ${l.user}</span> — ${l.action}</span>
    </div>`;}).join('')}
  </div>
</div>`;
}
