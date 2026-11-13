// ============================================================================
// МОДУЛЬ ИДЕНТИФИКАЦИОННОГО ТОКЕНА (window.IdentityToken)
// Каноническая версия — используется во всех симуляторах МВД / checker'е
// ============================================================================
window.IdentityToken = (function () {
  function b64ToUtf8(str) {
    try {
      const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) { return null; }
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

  let rawToken = null;
  let payload = null;

  function parseToken(str) {
    if (!str) return null;
    const t = str.trim();
    if (!t) return null;
    const parts = t.split('.');
    if (parts.length < 2) return null;
    const json = b64ToUtf8(parts[0]);
    if (!json) return null;
    try {
      const p = JSON.parse(json);
      if (!p || !p.fio) return null;
      return p;
    } catch (e) { return null; }
  }

  function setToken(str) {
    const p = parseToken(str);
    if (!p) { rawToken = null; payload = null; return false; }
    rawToken = str.trim();
    payload = p;
    try { sessionStorage.setItem('identity_token_v1', rawToken); } catch (e) {}
    return true;
  }

  function getBrowserTag() {
    try {
      let tag = localStorage.getItem('ui_instance_v1');
      if (!tag) {
        tag = 'ui_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        localStorage.setItem('ui_instance_v1', tag);
      }
      return tag;
    } catch (e) { return null; }
  }

  // Инициализация: URL ?token= -> sessionStorage
  (function init() {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken && setToken(urlToken)) return;
    } catch (e) {}
    try {
      const saved = sessionStorage.getItem('identity_token_v1');
      if (saved) setToken(saved);
    } catch (e) {}
  })();

  return {
    isPresent: function () { return !!payload; },
    getName: function () { return payload ? payload.fio || null : null; },
    getGroup: function () { return payload ? payload.grp || null : null; },
    getTask: function () { return payload ? payload.task || null : null; },
    getExpiry: function () { return payload ? payload.exp || null : null; },
    isExpired: function () {
      if (!payload || !payload.exp) return false;
      return (Date.now() / 1000) > payload.exp;
    },
    getRawToken: function () { return rawToken; },
    getPayload: function () { return payload; },
    getSeal: function (tag) { return rawToken ? cyrb53(rawToken + '::' + tag) : null; },
    getBrowserTag: getBrowserTag,
    setToken: setToken,
  };
})();

function refreshIdentityTokenUI() {
  const fioEl = document.getElementById('login-fullname');
  const squadEl = document.getElementById('login-squad');
  const errEl = document.getElementById('login-token-err');
  const okEl = document.getElementById('login-token-ok');
  if (!errEl || !okEl) return;
  errEl.textContent = '';
  okEl.textContent = '';
  if (!window.IdentityToken || !IdentityToken.isPresent()) {
    if (fioEl) fioEl.readOnly = false;
    if (squadEl) squadEl.readOnly = false;
    return;
  }
  if (IdentityToken.isExpired()) {
    errEl.textContent = '⚠️ Срок действия токена истёк. Обратитесь к наставнику.';
    return;
  }
  const name = IdentityToken.getName();
  const group = IdentityToken.getGroup();
  if (fioEl && name) { fioEl.value = name; fioEl.readOnly = true; }
  if (squadEl && group) { squadEl.value = group; squadEl.readOnly = true; }
  okEl.textContent = '✅ Токен принят: ' + (name || '') + (group ? (' · взвод ' + group) : '');
}

document.addEventListener('DOMContentLoaded', function () {
  refreshIdentityTokenUI();
  const tokenEl = document.getElementById('login-token');
  if (tokenEl) {
    if (window.IdentityToken && IdentityToken.getRawToken()) {
      tokenEl.value = IdentityToken.getRawToken();
    }
    tokenEl.addEventListener('input', function () {
      if (window.IdentityToken) IdentityToken.setToken(tokenEl.value);
      refreshIdentityTokenUI();
    });
  }
});
