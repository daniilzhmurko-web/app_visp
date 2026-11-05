/* ЛОГИКА приложения. Данные — в data/. */
function initDirectory() {
  const tree = document.getElementById('orgTree');
  orgCategories.forEach(cat => {
    const node = document.createElement('div');
    node.className = 'org-node';
    node.onclick = () => selectOrg(node, cat.key);
    node.innerHTML = `
      <div class="org-node-inner">
        <div>
          <div class="org-node-name">${cat.name}</div>
          <div class="org-node-count">${cat.count}</div>
        </div>
        <div class="org-node-badge">${svgIcon('chevron')}</div>
      </div>
    `;
    tree.appendChild(node);
  });
  selectOrg(null, 'root');
}

function createStaffCard(s) {
  const photoHtml = s.photo
    ? `<img src="${s.photo}" alt="${s.n}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="staff-photo-fallback">${svgIcon('person')}</div>`
    : svgIcon('person');
  return `
    <div class="staff-card" onclick="showToast('Профиль: ${s.n}')">
      <div class="staff-photo">${photoHtml}</div>
      <div class="staff-info">
        <div class="name">${s.n}</div>
        <div class="post">${s.p}</div>
        ${s.t !== '-' ? `<div class="contact">тел.: <b>${s.t}</b>${s.e ? ', e-mail: <a>'+s.e+'</a>' : ''}</div>` : (s.e ? `<div class="contact">e-mail: <a>${s.e}</a></div>` : '')}
        <div class="city">${s.c}</div>
      </div>
    </div>
  `;
}

function selectOrg(el, key) {
  document.querySelectorAll('.org-node').forEach(n => n.classList.remove('selected'));
  const root = document.getElementById('orgRoot');
  const title = document.getElementById('staffPanelTitle');
  const list = document.getElementById('staffList');
  if (key === 'root') {
    root.style.background = 'var(--blue-pale2)';
    title.textContent = 'МВД России';
    list.innerHTML = rootStaff.map(createStaffCard).join('');
    return;
  }
  root.style.background = 'var(--blue-pale)';
  if (el) el.classList.add('selected');
  const cat = orgCategories.find(c => c.key === key);
  title.textContent = cat.name;
  list.innerHTML = `<div style="padding:30px 0;text-align:center;color:var(--text-light);font-size:13px;">Список сотрудников подразделения «${cat.name}» (${cat.count}) доступен после авторизации в защищённом сегменте ИСОД МВД России.</div>`;
}

function searchStaff() {
  const q = document.getElementById('staffSearch').value.toLowerCase().trim();
  if (!q) return;
  document.querySelectorAll('.org-node').forEach(n => n.classList.remove('selected'));
  document.getElementById('staffPanelTitle').textContent = 'Результаты поиска: «' + q + '»';
  const found = rootStaff.filter(s => s.n.toLowerCase().includes(q) || s.p.toLowerCase().includes(q));
  const list = document.getElementById('staffList');
  list.innerHTML = found.length ? found.map(createStaffCard).join('') : '<div style="padding:30px 0;text-align:center;color:var(--text-light);">Ничего не найдено</div>';
  showToast('Найдено: ' + found.length);
}
