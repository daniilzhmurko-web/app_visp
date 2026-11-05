'use strict';
/* =====================================================
   РЕНДЕР: УПРАВЛЕНИЕ ДОСТУПОМ
   ===================================================== */
function rUsers() {
  if(!['sysadmin','security'].includes(S.role))
    return `<div class="empty"><i class="fas fa-lock"></i><div>Недостаточно прав доступа</div></div>`;
  return `
<div class="sec-title" style="margin-bottom:18px">Управление доступом</div>
<div class="card">
  <div class="card-hdr"><span class="card-title">Пользователи системы</span>
    <button class="btn btn-blue btn-sm" style="margin-left:auto"><i class="fas fa-plus"></i> Добавить</button></div>
  <div style="overflow-x:auto"><table class="dtbl">
    <thead><tr><th>ФИО</th><th>Роль</th><th>Подразделение</th><th>Дата создания</th><th>Статус</th></tr></thead>
    <tbody>
      ${Object.values(ROLES).map(r=>`<tr>
        <td><b>${r.disp}</b></td>
        <td><span class="badge b-confirmed">${r.name}</span></td>
        <td>МВД России</td><td>01.01.2024</td>
        <td><span class="badge b-active">Активен</span></td>
      </tr>`).join('')}
    </tbody>
  </table></div>
</div>`;
}
