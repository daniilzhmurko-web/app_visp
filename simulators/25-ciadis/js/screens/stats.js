'use strict';
/* =====================================================
   РЕНДЕР: СТАТИСТИКА
   ===================================================== */
function rStat() {
  const bars=[
    {l:'Янв',c:1850,g:920},{l:'Фев',c:2100,g:1050},{l:'Мар',c:1980,g:1120},
    {l:'Апр',c:2340,g:1280},{l:'Май',c:2100,g:1050}
  ];
  const mx=2500;
  return `
<div class="breadcrumb"><i class="fas fa-home"></i><span class="sep">/</span><span class="cur">Статистика</span></div>
<div class="sec-hdr">
  <div><div class="sec-title">Статистическая информация</div><div class="sec-sub">Количество дактилокарт в базе данных ЦИАДИС-МВД</div></div>
</div>
<div class="stats-grid">
  <div class="stat-card"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-bottom:7px">Уголовные</div>
    <div class="stat-v">156 422</div><div style="font-size:11px;color:var(--muted);margin-top:4px">63.1% от общей базы</div></div>
  <div class="stat-card" style="border-left-color:#1E8449"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-bottom:7px">Гражданские</div>
    <div class="stat-v" style="color:#1E8449">78 901</div><div style="font-size:11px;color:var(--muted);margin-top:4px">31.8% от общей базы</div></div>
  <div class="stat-card" style="border-left-color:#D35400"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-bottom:7px">Миграционные</div>
    <div class="stat-v" style="color:#D35400">12 508</div><div style="font-size:11px;color:var(--muted);margin-top:4px">5.1% от общей базы</div></div>
  <div class="stat-card" style="border-left-color:#7D3C98"><div style="font-size:10px;color:var(--muted);text-transform:uppercase;font-weight:700;margin-bottom:7px">Регионов подключено</div>
    <div class="stat-v" style="color:#7D3C98">87</div><div style="font-size:11px;color:var(--muted);margin-top:4px">100% регионов РФ</div></div>
</div>
<div class="card">
  <div class="card-hdr"><i class="fas fa-chart-bar" style="color:#003F8A"></i><span class="card-title">Динамика регистрации</span>
    <span style="margin-left:auto;font-size:11px;color:var(--muted)">2024, по месяцам</span></div>
  <div class="card-body">
    <div style="display:flex;gap:20px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:6px;font-size:11px"><div style="width:11px;height:11px;background:#003F8A;border-radius:2px"></div>Уголовные</div>
      <div style="display:flex;align-items:center;gap:6px;font-size:11px"><div style="width:11px;height:11px;background:#1E8449;border-radius:2px"></div>Гражданские</div>
    </div>
    <div class="bar-wrap">
      ${bars.map(b=>`
      <div class="bar-col">
        <div class="bar-val">${(b.c/1000).toFixed(1)}к</div>
        <div class="bar-fill" style="height:${b.c/mx*100}%;background:#003F8A"></div>
        <div class="bar-lbl">${b.l}</div>
      </div>
      <div class="bar-col">
        <div class="bar-val">${(b.g/1000).toFixed(1)}к</div>
        <div class="bar-fill" style="height:${b.g/mx*100}%;background:#1E8449"></div>
        <div class="bar-lbl"></div>
      </div>`).join('')}
    </div>
  </div>
</div>
<div class="card">
  <div class="card-hdr"><i class="fas fa-map" style="color:#003F8A"></i><span class="card-title">Топ-5 регионов</span></div>
  <div class="card-body">
    ${[['ГУ МВД по г. Москва',34219,'#003F8A'],['ГУ МВД по г. Санкт-Петербург',18450,'#1A56A0'],
       ['ГУ МВД по Московской области',15678,'#2D7DD2'],['ГУ МВД по Свердловской области',9341,'#1E8449'],
       ['ГУ МВД по Краснодарскому краю',8792,'#D35400']].map(([n,v,c])=>`
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>${n}</span><b>${v.toLocaleString('ru-RU')}</b></div>
      <div style="height:5px;background:#EEF3F9;border-radius:3px">
        <div style="height:100%;width:${v/34219*100}%;background:${c};border-radius:3px"></div>
      </div>
    </div>`).join('')}
  </div>
</div>`;
}
