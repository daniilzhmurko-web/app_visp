(function () {
  function b64ToUtf8(b64) { try { return decodeURIComponent(escape(atob(b64))); } catch (e) { return null; } }
  function parseToken(str) {
    if (!str) return null;
    const parts = String(str).trim().split('.');
    if (parts.length < 2) return null;
    const json = b64ToUtf8(parts[0]);
    if (!json) return null;
    try { return { raw: str.trim(), payload: JSON.parse(json) }; } catch (e) { return null; }
  }

  function cyrb53(str, seed) {
    seed = seed || 0;
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  const STORAGE_KEY = 'identity_token_v1';
  let current = null;

  function persist(raw) { try { sessionStorage.setItem(STORAGE_KEY, raw || ''); } catch (e) {} }
  function loadPersisted() { try { return sessionStorage.getItem(STORAGE_KEY); } catch (e) { return null; } }

  let initialRaw = null;
  try { initialRaw = new URLSearchParams(location.search).get('token'); } catch (e) {}
  if (!initialRaw) initialRaw = loadPersisted();
  if (initialRaw) {
    const parsed = parseToken(initialRaw);
    if (parsed) { current = parsed; persist(initialRaw); }
  }

  window.IdentityToken = {
    isPresent: () => !!current,
    getName: () => (current && current.payload && current.payload.fio) || null,
    getGroup: () => (current && current.payload && current.payload.grp) || null,
    getTask: () => (current && current.payload && current.payload.task) || null,
    getMode: () => (current && current.payload && current.payload.mode) || null,
    getVariant: () => (current && current.payload && current.payload.variant) || null,
    getExpiry: () => (current && current.payload && current.payload.exp) || null,
    isExpired: () => !!(current && current.payload && current.payload.exp && Date.now() > current.payload.exp),
    getRawToken: () => (current && current.raw) || null,
    getPayload: () => (current && current.payload) || null,
    getSeal: (tag) => current ? cyrb53(current.raw + '::' + tag) : null,
    getBrowserTag: () => {
      try {
        let v = localStorage.getItem('ui_instance_v1');
        if (!v) { v = 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); localStorage.setItem('ui_instance_v1', v); }
        return v;
      } catch (e) { return null; }
    },
    setToken(str) {
      const trimmed = (str || '').trim();
      if (!trimmed) { current = null; persist(''); return { ok: true, empty: true }; }
      const parsed = parseToken(trimmed);
      if (!parsed) return { ok: false };
      current = parsed; persist(trimmed);
      return { ok: true };
    }
  };
})();

/* ── Интеграция именно с этим тренажёром (ЦИАДИС-МВД) ── */
function refreshIdentityTokenUI() {
  const fioInput = document.getElementById('l-fio');
  const tokenErr = document.getElementById('l-token-err');
  const tokenOk = document.getElementById('l-token-ok');
  if (!fioInput || !tokenErr || !tokenOk) return;
  if (IdentityToken.isPresent()) {
    fioInput.value = IdentityToken.getName() || '';
    fioInput.readOnly = true;
    fioInput.style.background = 'var(--blue-bg)';
    fioInput.title = 'ФИО получено из токена и недоступно для редактирования';
    tokenErr.style.display = 'none';
    tokenOk.style.display = 'block';
    if (IdentityToken.isExpired()) {
      tokenOk.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3L2 20h20L12 3z"/><path d="M12 10v5M12 17.5v.5"/></svg> Токен подтверждён, но срок его действия истёк — сообщите преподавателю.';
      tokenOk.style.color = 'var(--orange)';
    } else {
      tokenOk.innerHTML = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg> ФИО подтверждено токеном — поле ниже заполнено автоматически.';
      tokenOk.style.color = 'var(--green)';
    }
  } else {
    fioInput.readOnly = false;
    fioInput.style.background = '';
    fioInput.title = '';
    tokenOk.style.display = 'none';
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('l-token');
  if (!tokenInput) return;
  if (IdentityToken.isPresent()) tokenInput.value = IdentityToken.getRawToken();
  tokenInput.addEventListener('input', () => {
    const res = IdentityToken.setToken(tokenInput.value);
    const tokenErr = document.getElementById('l-token-err');
    const tokenOk = document.getElementById('l-token-ok');
    const fioInput = document.getElementById('l-fio');
    if (!res.ok) {
      if (tokenErr) tokenErr.style.display = 'block';
      if (tokenOk) tokenOk.style.display = 'none';
      if (fioInput) { fioInput.readOnly = false; fioInput.style.background = ''; }
      return;
    }
    refreshIdentityTokenUI();
  });
  refreshIdentityTokenUI();
});
