/* ЛОГИКА приложения. Данные — в data/. */
// ─── НАВИГАЦИЯ ───
function switchNav(el, section) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  else { const found = document.querySelector('[data-section="' + section + '"]'); if (found) found.classList.add('active'); }
  showSection(section);
  window.scrollTo({top:0, behavior:'instant'});
}
function goHome() {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  showSection('home');
  window.scrollTo({top:0, behavior:'instant'});
}
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('section-' + id);
  if (sec) sec.classList.add('active');
}
function switchTab(el, tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['tab-news','tab-events','tab-nti'].forEach(id => {
    const el2 = document.getElementById(id);
    if (el2) el2.style.display = id === tabId ? 'block' : 'none';
  });
}
function showProfileTab(el, tabId) {
  document.querySelectorAll('.profile-menu-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  if (tabId === 'tab-ece' || tabId === 'tab-notif') {
    document.getElementById('eceMenuWrap').classList.add('open');
  }
  ['tab-profile','tab-calendar','tab-ece','tab-notif','tab-vacations'].forEach(id => {
    const t = document.getElementById(id);
    if (t) t.style.display = id === tabId ? 'block' : 'none';
  });
}
function toggleEceMenu(el) {
  const wrap = el.closest('.profile-menu-item-wrap');
  const wasOpen = wrap.classList.contains('open');
  document.querySelectorAll('.profile-menu-item').forEach(i => i.classList.remove('active'));
  if (wasOpen) {
    wrap.classList.remove('open');
  } else {
    wrap.classList.add('open');
    el.classList.add('active');
    showProfileTab(el, 'tab-ece');
  }
}
function doSearch() { const q = document.getElementById('globalSearch').value; if (q) showToast('Поиск: «' + q + '»'); }
function toggleGlobalSearch(e) {
  const box = document.getElementById('navSearchBtn');
  const input = document.getElementById('globalSearch');
  const wasOpen = box.classList.contains('open');
  if (!wasOpen) {
    box.classList.add('open');
    setTimeout(() => input.focus(), 50);
  } else if (input.value) {
    doSearch();
  } else {
    box.classList.remove('open');
  }
}
document.addEventListener('click', function(e) {
  const box = document.getElementById('navSearchBtn');
  if (box && box.classList.contains('open') && !box.contains(e.target)) {
    box.classList.remove('open');
  }
});
