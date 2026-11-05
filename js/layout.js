/* ЛОГИКА приложения. Данные — в data/. */
// ─── ВЫРАВНИВАНИЕ ПАНЕЛИ НАВИГАЦИИ ПО ГРАНИЦАМ ШАПКИ ───
// X1 = правая граница блока [1] шапки (header-left, конец «портал»)
// X2 = левая внешняя граница блока [3] шапки (header-right), минус зазор 16px,
//      дополнительно растянуто вправо ещё на 0.5 см
function alignNavToHeader() {
  const headerLeft = document.querySelector('.header-left');
  const headerRight = document.querySelector('.header-right');
  const navEl = document.querySelector('nav');
  const inner = document.getElementById('navInner');
  if (!headerLeft || !headerRight || !navEl || !inner) return;

  const hlRect = headerLeft.getBoundingClientRect();
  const hrRect = headerRight.getBoundingClientRect();
  const navRect = navEl.getBoundingClientRect();
  const EXTRA_RIGHT_STRETCH = 0.5 * 37.7952755906; // 0.5 см в px

  const marginLeft = Math.max(0, hlRect.right - navRect.left);
  const marginRight = Math.max(0, navRect.right - (hrRect.left - 16) - EXTRA_RIGHT_STRETCH);

  inner.style.marginLeft = marginLeft + 'px';
  inner.style.marginRight = marginRight + 'px';
}
window.addEventListener('resize', alignNavToHeader);

window.onload = () => {
  applyIcons();
  initDirectory();
  renderQA();
  renderServices();
  renderCal();
  applyIcons();
  alignNavToHeader();
};
