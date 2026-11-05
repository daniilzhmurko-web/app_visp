/* ЛОГИКА приложения. Данные — в data/. */
// ─── TOAST ───
let toastTimer;
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.position = 'fixed';
    t.style.bottom = '30px';
    t.style.left = '50%';
    t.style.transform = 'translateX(-50%)';
    t.style.backgroundColor = '#142e52';
    t.style.color = '#fff';
    t.style.padding = '10px 20px';
    t.style.borderRadius = '40px';
    t.style.fontSize = '13px';
    t.style.zIndex = '9999';
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.2s, transform 0.2s';
    t.style.pointerEvents = 'none';
    t.style.whiteSpace = 'nowrap';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(80px)'; }, 2800);
}
