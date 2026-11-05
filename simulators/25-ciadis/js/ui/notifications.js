'use strict';
/* =====================================================
   УВЕДОМЛЕНИЯ (колокольчик в шапке)
   Элемент: {id, kind:'req'|'warn'|'sys', title, text, to:'requests'|…, time, read}
   ===================================================== */
function initNotifs() {
  S.notifs = [
    { id:'n1', kind:'req',  title:'Запрос ЗАП-2024-0045 ожидает обработки', text:'Изменение ФИО в карте ДК-2023-1899', to:'requests', time:'10:15', read:false },
    { id:'n2', kind:'req',  title:'Запрос ЗАП-2024-0046 ожидает обработки', text:'Изменение региона в карте ДК-2024-0089', to:'requests', time:'11:30', read:false },
    { id:'n3', kind:'sys',  title:'Плановое обслуживание АДИС «Папилон»', text:'Сегодня с 23:00 до 23:30 возможна кратковременная недоступность', to:'system', time:'09:00', read:false }
  ];
  renderNotifBadge();
}
function addNotif(n) {
  S.notifs = S.notifs || [];
  S.notifs.unshift(Object.assign({ id:'n'+Date.now(), kind:'sys', time:getTime().slice(0,5), read:false }, n));
  renderNotifBadge();
  if (el('nf-drop') && el('nf-drop').classList.contains('on')) renderNotifList();
}
function renderNotifBadge() {
  const n = (S.notifs||[]).filter(x=>!x.read).length, b = el('nc');
  if (!b) return;
  b.textContent = n; b.classList.toggle('zero', n===0);
}
function renderNotifList() {
  const d = el('nf-drop'), list = S.notifs||[];
  const ic = { req:'fa-file-alt', warn:'fa-exclamation-triangle', sys:'fa-server' };
  d.innerHTML = `<div class="nf-hd"><span>Уведомления</span><a onclick="readAllNotifs(event)">Отметить все прочитанными</a></div>
    <div class="nf-list">` + (list.length ? list.map(x=>`
      <div class="nf-item${x.read?'':' unread'}" onclick="openNotif('${x.id}')">
        <div class="nf-ic ${x.kind==='req'?'':x.kind}"><i class="fas ${ic[x.kind]||'fa-bell'}"></i></div>
        <div><div class="nf-t">${x.title}</div><div class="nf-x">${x.text||''}</div><div class="nf-tm">${x.time||''}</div></div>
      </div>`).join('') : '<div class="nf-empty">Нет новых уведомлений</div>') + '</div>';
}
function toggleNotif(e) {
  if (e) e.stopPropagation();
  const d = el('nf-drop');
  if (d.classList.contains('on')) { d.classList.remove('on'); return; }
  const r = el('nf-btn').getBoundingClientRect();
  d.style.top = (r.bottom + 6) + 'px';
  d.style.right = Math.max(8, window.innerWidth - r.right - 40) + 'px';
  renderNotifList(); d.classList.add('on');
  logEvent('notifications_opened', { unread: (S.notifs||[]).filter(x=>!x.read).length });
}
function openNotif(id) {
  const n = (S.notifs||[]).find(x=>x.id===id); if (!n) return;
  n.read = true; renderNotifBadge();
  el('nf-drop').classList.remove('on');
  logEvent('notification_clicked', { id, to: n.to });
  if (n.to) go(n.to);
}
function readAllNotifs(e) {
  if (e) e.stopPropagation();
  (S.notifs||[]).forEach(x=>x.read = true); renderNotifBadge(); renderNotifList();
}
document.addEventListener('click', e => {
  const d = document.getElementById('nf-drop');
  if (d && d.classList.contains('on') && !d.contains(e.target)) d.classList.remove('on');
});
