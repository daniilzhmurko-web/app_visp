/* ЛОГИКА приложения. Данные — в data/. */
// ─── КАЛЕНДАРЬ (СЕНТЯБРЬ 2026) ───
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const eventDays = [18, 21];
function renderCal() {
  const monthLabel = document.getElementById('calMonthLabel');
  const grid = document.getElementById('calGrid');
  if (!monthLabel || !grid) return;
  monthLabel.textContent = monthNames[calMonth] + ' ' + calYear;
  grid.innerHTML = '';
  ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].forEach(d => { const el = document.createElement('div'); el.className = 'cal-day-name'; el.textContent = d; grid.appendChild(el); });
  let startDow = new Date(calYear, calMonth, 1).getDay(); startDow = startDow === 0 ? 6 : startDow - 1;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays = new Date(calYear, calMonth, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) { const el = document.createElement('div'); el.className = 'cal-day other-month'; el.textContent = prevDays - i; grid.appendChild(el); }
  const today = new Date();
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div'); el.className = 'cal-day';
    if (d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()) el.classList.add('today');
    el.textContent = d; el.onclick = () => showToast('День ' + d + ' ' + monthNames[calMonth]); grid.appendChild(el);
  }
  const total = startDow + daysInMonth; const rest = 7 - (total % 7);
  if (rest < 7) { for (let d = 1; d <= rest; d++) { const el = document.createElement('div'); el.className = 'cal-day other-month'; el.textContent = d; grid.appendChild(el); } }
}
function changeMonth(dir) { calMonth += dir; if (calMonth > 11) { calMonth = 0; calYear++; } if (calMonth < 0) { calMonth = 11; calYear--; } renderCal(); }
