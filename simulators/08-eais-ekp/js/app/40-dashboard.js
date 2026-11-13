// ===== МОДУЛЬ: ДАШБОРД =====
// ================================================================
function renderDashboard() {
  const newCases = DB.latents.filter(l=>l.status==='new').length;
  const inWork = DB.latents.filter(l=>l.status==='coding'||l.status==='searching').length;
  const confirmed = DB.latents.filter(l=>l.status==='confirmed').length;
  const total = DB.latents.length;

  const now = new Date().toLocaleString('ru-RU');
  document.getElementById('content-area').innerHTML = `
  <div class="fade-in">
  <div class="grid-4 mb-24">
    <div class="stat-card blue"><div class="stat-icon">📋</div><div><div class="stat-value">${total}</div><div class="stat-label">Всего следов</div></div></div>
    <div class="stat-card amber"><div class="stat-icon">🆕</div><div><div class="stat-value">${newCases}</div><div class="stat-label">Новых (не обработано)</div></div></div>
    <div class="stat-card blue"><div class="stat-icon">⚙️</div><div><div class="stat-value">${inWork}</div><div class="stat-label">В работе</div></div></div>
    <div class="stat-card green"><div class="stat-icon">✅</div><div><div class="stat-value">${confirmed}</div><div class="stat-label">Идентифицировано</div></div></div>
  </div>

  <div class="grid-2 mb-24">
    <div class="panel">
      <div class="panel-header"><h3>📡 Статус систем ИСОД МВД</h3><span style="font-size:11px;color:var(--text-muted)">${now}</span></div>
      <div class="panel-body">
        <div class="system-status-grid">
          <div class="status-item"><span class="s-name">🟢 Региональная АДИС</span><span class="badge badge-done">Работает</span></div>
          <div class="status-item"><span class="s-name">🟢 Федеральный БД ИСОД</span><span class="badge badge-done">Работает</span></div>
          <div class="status-item"><span class="s-name">🟡 СЭД МВД</span><span class="badge badge-progress">Замедление</span></div>
          <div class="status-item"><span class="s-name">🟢 Сервис биометрии</span><span class="badge badge-done">Работает</span></div>
          <div class="status-item"><span class="s-name">🟢 СУДИС-М</span><span class="badge badge-done">Авторизован</span></div>
          <div class="status-item"><span class="s-name">🟢 АС КУСП</span><span class="badge badge-done">Работает</span></div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="panel-header"><h3>🔔 Уведомления системы</h3></div>
      <div class="panel-body">
        <div class="notification-list">
          ${buildDashboardNotifications()}
        </div>
      </div>
    </div>
  </div>

  <div class="panel">
    <div class="panel-header"><h3>📂 Активные задания</h3><button class="btn btn-primary btn-sm" onclick="switchModule('cases')">Все дела →</button></div>
    <div class="panel-body" style="padding:0">
      <table class="data-table">
        <thead><tr><th>ID следа</th><th>КУСП / УД</th><th>Место / РОВД</th><th>Тип преступления</th><th>Качество</th><th>Статус</th><th>Действие</th></tr></thead>
        <tbody>
        ${DB.latents.slice(0,5).map(l=>`
          <tr>
            <td><strong>${l.id}</strong></td>
            <td>${l.kusp}</td>
            <td style="font-size:12px">${l.place}</td>
            <td>${l.type}</td>
            <td><span class="badge badge-${l.quality==='high'?'high':l.quality==='medium'?'med':'low'}">${{high:'Высокое',medium:'Среднее',low:'Низкое'}[l.quality]}</span></td>
            <td>${statusBadge(l.status)}</td>
            <td><button class="btn btn-primary btn-sm" onclick="openCase('${l.id}')">Открыть</button></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
  </div>`;
}

function statusBadge(s) {
  const map = {
    new:'<span class="badge badge-new">Новый</span>',
    coding:'<span class="badge badge-progress">Разметка</span>',
    searching:'<span class="badge badge-progress">Поиск</span>',
    verified:'<span class="badge badge-progress">Верификация</span>',
    confirmed:'<span class="badge badge-done">Идентифицирован</span>',
    rejected:'<span class="badge badge-error">Не найден</span>',
    false_positive:'<span class="badge badge-error">⚠ Ложное срабатывание</span>',
    missed_match:'<span class="badge badge-error">⚠ Пропущен верный</span>',
    completed:'<span class="badge badge-done">Завершён</span>',
  };
  return map[s] || `<span class="badge badge-new">${s}</span>`;
}

// Динамические уведомления дашборда на основе реального состояния
function buildDashboardNotifications() {
  const notifs = [];
  const newest = DB.latents.filter(l => l.status === 'new').slice(0, 2);
  newest.forEach(l => {
    notifs.push({ type: 'info', icon: '📥', text: `Поступил новый след — КУСП ${l.kusp}`, time: l.date });
  });
  // Последние 2 подтверждённых
  const confirmed = DB.latents.filter(l => l.status === 'confirmed').slice(-2).reverse();
  confirmed.forEach(l => {
    notifs.push({ type: 'success', icon: '✅', text: `След ${l.id} (КУСП ${l.kusp}) — совпадение подтверждено`, time: l.date });
  });
  // Последние 2 требующих верификации
  const needVer = DB.latents.filter(l => l.status === 'searching' || l.status === 'verified').slice(0, 2);
  needVer.forEach(l => {
    notifs.push({ type: 'warn', icon: '⚠️', text: `След ${l.id} (КУСП ${l.kusp}) — требуется верификация`, time: l.date });
  });
  // Ложные срабатывания
  const fps = DB.latents.filter(l => l.status === 'false_positive').slice(0, 2);
  fps.forEach(l => {
    notifs.push({ type: 'err', icon: '🚨', text: `След ${l.id} (КУСП ${l.kusp}) — ложное срабатывание!`, time: l.date });
  });
  // Если ничего нет — служебные
  if (notifs.length === 0) {
    notifs.push({ type: 'info', icon: '📡', text: 'Федеральная БД обновлена — добавлено 1 247 дактилокарт', time: '15.06.2026' });
    notifs.push({ type: 'info', icon: '🔒', text: 'Сессия активна. Все действия протоколируются.', time: 'Сейчас' });
  }
  return notifs.map(n => `<div class="notification ${n.type}">${n.icon} <div><div>${n.text}</div><div class="notif-time">${n.time}</div></div></div>`).join('');
}

// ================================================================
