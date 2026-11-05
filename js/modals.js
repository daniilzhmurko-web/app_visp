/* ЛОГИКА приложения. Данные — в data/. */
// ─── МОДАЛЬНЫЕ ОКНА ───
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function openNewsModal(title, body) { alert(title + "\n\n" + body); }
function openQA(q) { alert(q + "\n\nДля получения подробного ответа обратитесь в Единый центр эксплуатации ИСОД МВД России."); }
function showEditModal() { openModal('editModal'); }
function showNewAppealModal() { openModal('appealModal'); }
function openNewAppealPage() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  showSection('appeal-new');
  populateAppealSelects();
  window.scrollTo({top:0, behavior:'instant'});
}
function submitAppealPage() {
  const code = 'SD' + Math.floor(Math.random()*900000+100000);
  const tbody = document.getElementById('appealsTable');
  const row = `<tr style="border-bottom:1px solid var(--border);">
    <td style="padding:8px;"><span style="color:var(--blue-light);cursor:pointer">${code}</span><br>Новое обращение</td>
    <td style="padding:8px;">ВИСП</td>
    <td style="padding:8px;">${new Date().toLocaleDateString('ru-RU')}</td>
    <td style="padding:8px;"><span style="color:var(--orange)">● В обработке</span></td>
   </tr>`;
  tbody.insertAdjacentHTML('afterbegin', row);
  switchNav(null,'profile');
  showProfileTab(document.querySelector('#eceMenuWrap .profile-menu-item-head'),'tab-ece');
  showToast('Обращение ' + code + ' отправлено ✓');
}
function showNewVacationModal() { openModal('vacModal'); }

function submitAppeal() {
  const code = 'SD' + Math.floor(Math.random()*900000+100000);
  const tbody = document.getElementById('appealsTable');
  const row = `<tr style="border-bottom:1px solid var(--border);">
    <td style="padding:8px;"><span style="color:var(--blue-light);cursor:pointer">${code}</span><br>Новое обращение</td>
    <td style="padding:8px;">ВИСП</td>
    <td style="padding:8px;">${new Date().toLocaleDateString('ru-RU')}</td>
    <td style="padding:8px;"><span style="color:var(--orange)">● В обработке</span></td>
   </tr>`;
  tbody.insertAdjacentHTML('afterbegin', row);
  closeModal('appealModal');
  showToast('Обращение ' + code + ' отправлено ✓');
}
function calcDays() {
  const s = document.getElementById('vacStart').value;
  const e = document.getElementById('vacEnd').value;
  if (s && e) {
    const days = Math.max(0, Math.round((new Date(e) - new Date(s)) / 86400000));
    document.getElementById('vacDaysLabel').textContent = 'Итого дней: ' + days;
  }
}
function saveVacation() {
  const s = document.getElementById('vacStart').value;
  const e = document.getElementById('vacEnd').value;
  if (!s || !e) { showToast('Заполните даты'); return; }
  const days = Math.max(0, Math.round((new Date(e) - new Date(s)) / 86400000));
  const fmt = d => new Date(d).toLocaleDateString('ru-RU');
  const tbody = document.querySelector('#vacTable tbody');
  tbody.insertAdjacentHTML('afterbegin', `<tr style="border-bottom:1px solid var(--border);">
    <td style="padding:8px;">${fmt(s)}</td><td style="padding:8px;">${fmt(e)}</td><td style="padding:8px;">${days}</td>
    <td style="padding:8px;text-align:center;"><button class="btn-sm outline" onclick="showToast('Редактирование...')">Изм.</button> <button class="btn-sm outline" style="color:var(--red);border-color:var(--red);" onclick="this.closest('tr').remove();showToast('Удалено')">Удал.</button></td>
   </tr>`);
  closeModal('vacModal');
  showToast('Отпуск добавлен ✓');
}
