/* Набор строгих линейных иконок (замена эмодзи). Все иконки — монохромные SVG, наследуют цвет текста. */
(function () {
  const P = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 13.8c2.2.8 3.5 3 3.5 6.2"/>',
    alert: '<path d="M12 3.5 2.5 20h19L12 3.5z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".7" fill="currentColor"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    checkc: '<circle cx="12" cy="12" r="9"/><path d="M7.5 12.5l3 3 6-6.5"/>',
    xc: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l5 5"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.5 12h7M8.5 16h5"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>',
    cap: '<path d="M2 9.5 12 5l10 4.5-10 4.5L2 9.5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
    scale: '<path d="M12 4v16M8 20h8M5 7h14"/><path d="M5 7l-3 7a3.2 3.2 0 0 0 6 0L5 7zM19 7l-3 7a3.2 3.2 0 0 0 6 0l-3-7z"/>',
    file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
    eye: '<path d="M2 12s3.7-6.5 10-6.5S22 12 22 12s-3.7 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
    cpu: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>',
    sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    signal: '<path d="M4.5 19.5a10.5 10.5 0 0 1 0-15M19.5 4.5a10.5 10.5 0 0 1 0 15M8 16a6 6 0 0 1 0-8M16 8a6 6 0 0 1 0 8"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
    download: '<path d="M12 4v11M7.5 11 12 15.5 16.5 11M4 20h16"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    save: '<path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    trash: '<path d="M4 7h16M10 3.5h4M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
    building: '<path d="M5 21V4h9v17M14 9h5v12M2.5 21h19M8 8h3M8 12h3M8 16h3"/>',
    landmark: '<path d="M3 9.5 12 4l9 5.5M5.5 9.5V18M9.8 9.5V18M14.2 9.5V18M18.5 9.5V18M3 21h18M4 18h16"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 1 1 3.6 2.4c-.7.4-1.1.9-1.1 1.8"/><circle cx="12" cy="17" r=".7" fill="currentColor"/>',
    scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"/>',
    home: '<path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
    arrowl: '<path d="M20 12H5M11 6l-6 6 6 6"/>',
    chevr: '<path d="M9 5l7 7-7 7"/>',
    chevl: '<path d="M15 5l-7 7 7 7"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20.5h4"/>',
    siren: '<path d="M7.5 3h9L21 7.5v9L16.5 21h-9L3 16.5v-9L7.5 3z"/><path d="M12 8v5"/><circle cx="12" cy="16" r=".7" fill="currentColor"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5.5-5 4 3.5 3-2.5 4 4"/>',
    finger: '<path d="M12 4.5c-4 0-7 3-7 7M12 8c-2.2 0-4 1.8-4 4v2c0 2-.8 3.6-2 5M12 8c2.2 0 4 1.8 4 4 0 4-1.2 6.5-3 8.2M12 12v3c0 2.2-.6 4-1.7 5.5M19 11.5c0-4-3-7-7-7M15.5 17.5c.4-1.2.5-2.5.5-3.7"/>',
    diamond: '<path d="M12 3l8 9-8 9-8-9 8-9z"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    play: '<path d="M7 4.5v15l12-7.5-12-7.5z"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    printer: '<path d="M7 9V3.5h10V9M7 17H4.5v-7h15v7H17M7 14h10v6.5H7z"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v4M9.5 20.5h5M9.5 18h5"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4"/>',
    book: '<path d="M4.5 4.5h6a2 2 0 0 1 2 2V20a2 2 0 0 0-2-2h-6zM19.5 4.5h-6a2 2 0 0 0-2 2V20a2 2 0 0 1 2-2h6z"/>',
    db: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    dot: '<circle cx="12" cy="12" r="5" fill="currentColor" stroke="none"/>'
  };
  const M = {
    '👤': ['user'], '👥': ['users'], '⚠️': ['alert', 'warn'], '⚠': ['alert', 'warn'], '✅': ['checkc', 'ok'], '✓': ['check'], '✔️': ['check', 'ok'], '✔': ['check', 'ok'],
    '❌': ['xc', 'err'], '✕': ['x'], '🔍': ['search'], '📋': ['clipboard'], '📊': ['chart'], '🟢': ['dot', 'c-green'], '🟡': ['dot', 'c-amber'], '🔵': ['dot', 'c-blue'],
    '🟠': ['dot', 'c-orange'], '🔶': ['diamond', 'c-orange'], '🌑': ['dot', 'c-dark'], '📁': ['folder'], '📂': ['folder'], '🎓': ['cap'], '🎯': ['target'], '⚖️': ['scale'], '⚖': ['scale'],
    '📝': ['file'], '📄': ['file'], '👁': ['eye'], '➕': ['plus'], '⏰': ['clock'], '⏹': ['stop'], '🤖': ['cpu'], '⚙️': ['sliders'], '⚙': ['sliders'], '🔧': ['sliders'],
    '📡': ['signal'], '📥': ['download'], '🔒': ['lock'], '💾': ['save'], '🗑': ['trash'], '☀️': ['sun'], '☀': ['sun'], '🏙️': ['building'], '🏙': ['building'],
    '🏛️': ['landmark'], '🏛': ['landmark'], '❓': ['help'], '🔬': ['scan'], '🏠': ['home'], '⬅️': ['arrowl'], '⬅': ['arrowl'], '🔔': ['bell'], '🚨': ['siren', 'err'],
    '🖼️': ['image'], '🖼': ['image'], '🖐️': ['finger'], '🖐': ['finger'], '✋': ['finger'], '📍': ['pin'], '🚀': ['play'], '💡': ['bulb'], '🖨️': ['printer'], '🖨': ['printer'],
    '🏆': ['trophy'], '🗄️': ['db'], '🗄': ['db'], '👍': ['checkc', 'ok'], '🔄': ['refresh'], '📚': ['book'], '▶': ['chevr'], '◀': ['chevl']
  };
  const keys = Object.keys(M).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const KNOWN = new RegExp('(' + keys.join('|') + ')\\uFE0F?', 'g');
  const LEFT = /[\p{Extended_Pictographic}\uFE0F\u200D]/gu;
  const svg = (n, c) => `<svg class="ic${c ? ' ic-' + c : ''}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, OPTION: 1, SELECT: 1, SVG: 1 };
  const has = t => { KNOWN.lastIndex = 0; LEFT.lastIndex = 0; const r = KNOWN.test(t) || LEFT.test(t); KNOWN.lastIndex = 0; LEFT.lastIndex = 0; return r; };

  window.stripEmoji = s => String(s == null ? '' : s).replace(KNOWN, '').replace(LEFT, '').replace(/ {2,}/g, ' ');

  function skinText(node) {
    const t = node.nodeValue;
    if (!t || !has(t) || !node.parentNode) return;
    const html = t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
      .replace(KNOWN, (m, g) => { const d = M[g]; return d ? svg(d[0], d[1]) : ''; })
      .replace(LEFT, '');
    const tpl = document.createElement('template'); tpl.innerHTML = html;
    node.parentNode.replaceChild(tpl.content, node);
  }
  function skin(root) {
    if (!root) return;
    if (root.nodeType === 3) { if (root.parentNode && !SKIP[root.parentNode.nodeName.toUpperCase()]) skinText(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName.toUpperCase()]) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => SKIP[n.parentNode.nodeName.toUpperCase()] ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(skinText);
    root.querySelectorAll('option,[title],[placeholder]').forEach(el => {
      if (el.nodeName === 'OPTION') { if (has(el.textContent)) el.textContent = stripEmoji(el.textContent); }
      ['title', 'placeholder'].forEach(a => { if (el.hasAttribute(a) && has(el.getAttribute(a))) el.setAttribute(a, stripEmoji(el.getAttribute(a)).trim()); });
    });
  }
  window.PapilonIcons = { skin };
  function start() {
    skin(document.body);
    new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'characterData') skin(m.target);
        else m.addedNodes.forEach(n => skin(n));
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
