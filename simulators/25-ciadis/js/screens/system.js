'use strict';
/* =====================================================
   РЕНДЕР: СОСТОЯНИЕ СИСТЕМЫ
   ===================================================== */
function rSystem() {
  return `
<div class="sec-title" style="margin-bottom:18px">Состояние системы</div>
<div class="stats-grid">
  <div class="stat-card"><div class="stat-v" style="color:#1E8449;font-size:16px">● ONLINE</div><div class="stat-l">Центральный сервер</div></div>
  <div class="stat-card"><div class="stat-v">98.7%</div><div class="stat-l">Доступность системы</div></div>
  <div class="stat-card"><div class="stat-v">42ms</div><div class="stat-l">Задержка БД</div></div>
  <div class="stat-card"><div class="stat-v">87/87</div><div class="stat-l">Регионов онлайн</div></div>
</div>`;
}
