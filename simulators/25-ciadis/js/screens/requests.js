'use strict';
/* =====================================================
   РЕНДЕР: ЗАПРОСЫ НА АКТУАЛИЗАЦИЮ
   ===================================================== */
function rRequests() {
  const canProc=['operator','sysadmin'].includes(S.role);
  return `
<div class="breadcrumb"><i class="fas fa-home"></i><span class="sep">/</span><span class="cur">Запросы на актуализацию</span></div>
<div class="sec-hdr">
  <div><div class="sec-title">Запросы на актуализацию</div><div class="sec-sub">Обработка запросов на изменение данных</div></div>
</div>
<div class="card">
  <div class="card-hdr"><i class="fas fa-inbox" style="color:#D35400"></i>
    <span class="card-title">Входящие запросы</span>
    <span style="margin-left:auto;font-size:11px;color:var(--muted)">${S.reqs.length} записей</span>
  </div>
  <div style="overflow-x:auto"><table class="dtbl">
    <thead><tr><th>Номер</th><th>Дактилокарта</th><th>ФИО</th><th>Тип изменения</th><th>Создан</th><th>Инициатор</th><th>Статус</th><th>Действия</th></tr></thead>
    <tbody id="req-tbody">
      ${S.reqs.map(r=>`<tr>
        <td><code style="font-size:11px;color:#003F8A">${r.id}</code></td>
        <td><code style="font-size:11px">${r.cid}</code></td>
        <td>${r.fio}</td><td>${r.ctl}</td>
        <td style="font-size:11px;color:var(--muted)">${r.created}</td>
        <td style="font-size:11px">${r.user}</td>
        <td><span class="badge ${r.status==='pending'?'b-pending':r.status==='confirmed'?'b-confirmed':'b-rejected'}">${r.status==='pending'?'Ожидает':r.status==='confirmed'?'Подтверждён':'Отклонён'}</span></td>
        <td>
          ${r.status==='pending'&&canProc
            ?`<button class="btn btn-blue btn-sm" onclick="openConfirm('${r.id}')"><i class="fas fa-eye"></i> Рассмотреть</button>`
            :`<button class="btn btn-out btn-sm" disabled>Обработан</button>`}
        </td>
      </tr>`).join('')}
    </tbody>
  </table></div>
</div>`;
}
