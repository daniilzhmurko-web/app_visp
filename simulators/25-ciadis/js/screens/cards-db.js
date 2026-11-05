'use strict';
/* =====================================================
   РЕНДЕР: БАЗА ДАКТИЛОКАРТ
   ===================================================== */
function setCardsFilter(t) {
  S.cardsFilter = t;
  logEvent('cards_filter', { type: t });
  el('content').innerHTML = rCards();
}

function rCards() {
  const flt = S.cardsFilter || 'all';
  const list = flt==='all' ? CARDS : CARDS.filter(c=>c.type===flt);
  const tabs = [['all','Все типы'],['criminal','Уголовные'],['civil','Гражданские'],['migration','Миграционные']];
  return `
<div class="breadcrumb"><i class="fas fa-home"></i><span class="sep">/</span><span class="cur">База дактилокарт</span></div>
<div class="sec-hdr">
  <div><div class="sec-title">База дактилокарт</div><div class="sec-sub">Всего в системе: 247 831 записей · показано в учебной выборке: ${list.length}</div></div>
  <button class="btn btn-out btn-sm"><i class="fas fa-download"></i> Экспорт</button>
</div>
<div class="tabs">
  ${tabs.map(([k,n])=>`<div class="tab${flt===k?' on':''}" onclick="setCardsFilter('${k}')">${n}${k!=='all'?' <span style="opacity:.6">('+CARDS.filter(c=>c.type===k).length+')</span>':''}</div>`).join('')}
</div>
<div class="card">
  <div style="overflow-x:auto"><table class="dtbl">
    <thead><tr><th>ID</th><th>ФИО</th><th>Тип</th><th>Регион</th><th>Дата</th><th>Статус</th><th>Действия</th></tr></thead>
    <tbody>
      ${list.length?list.map(c=>`<tr>
        <td><code style="font-size:11px;color:#003F8A">${c.id}</code></td>
        <td><b>${c.fio}</b></td>
        <td><span class="badge b-${c.type}">${c.tl}</span></td>
        <td>${c.region}</td><td>${c.reg}</td>
        <td><span class="badge ${c.status==='active'?'b-active':'b-pending'}">${c.status==='active'?'Актуальна':'На проверке'}</span></td>
        <td><button class="btn btn-out btn-sm" onclick="S.card=CARDS.find(x=>x.id==='${c.id}');go('search');"><i class="fas fa-eye"></i></button></td>
      </tr>`).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:22px">Нет записей этого типа</td></tr>'}
    </tbody>
  </table></div>
</div>`;
}
