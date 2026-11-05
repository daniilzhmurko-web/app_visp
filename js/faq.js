/* ЛОГИКА приложения. Данные — в data/. */
function renderQA() {
  const grid = document.getElementById('qaGrid');
  if (!grid) return;
  grid.innerHTML = qaCategories.map(cat => `
    <div class="qa-category">
      <div class="qa-cat-header">
        <div class="qa-cat-icon">${cat.img && QA_ICON_DATA[cat.img] ? `<img src="${QA_ICON_DATA[cat.img]}" alt="">` : svgIcon(cat.icon)}</div>
        <div class="qa-cat-name">${cat.name}</div>
      </div>
      ${cat.items.slice(0,5).map(q => `<div class="qa-item" onclick="openQA('${q.replace(/'/g,"\\'")}')">${q.length > 46 ? q.slice(0,44)+'…' : q}</div>`).join('')}
      <div class="qa-more" onclick="showToast('Загрузка всех вопросов...')">Все вопросы »</div>
    </div>
  `).join('');
}
