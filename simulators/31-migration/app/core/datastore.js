'use strict';
// Данные приходят из data/*.json (загружает index.html до старта скриптов).
const FOREIGN_CITIZENS = __DATA.foreignCitizens;
const ADDRESSES = __DATA.addresses;
const HOST_PARTIES = __DATA.hostParties;
const PHOTOS = Object.fromEntries((__DATA.photos||[]).map(p=>[p.id,p.file]));      // data/photos/index.json
const FP_SETS = new Set((__DATA.fingerprints||[]).map(f=>f.id));                      // data/fingerprints/index.json (SOCOFing)
const FP_FILE = {'ПБ':'r_thumb','П1':'r_index','П2':'r_middle','П3':'r_ring','П4':'r_little','ЛБ':'l_thumb','Л1':'l_index','Л2':'l_middle','Л3':'l_ring','Л4':'l_little'};
// Фото: если файла нет — деловой силуэт.
function igPhoto(ig, sm) {
  if (ig && PHOTOS[ig.id]) return `<img class="${sm?'ig-thumb':'ig-img'}" src="data/photos/${PHOTOS[ig.id]}" alt="" loading="lazy">`;
  return `<svg class="ic${sm?' ig-thumb-ph':''}" aria-hidden="true"><use href="#i-user"/></svg>`;
}
// Дактилоскопический оттиск пальца. Если у ИГ нет своей карты (fp) — подбирается детерминированно из загруженной базы.
const FP_LIST = (__DATA.fingerprints || []).map(f => f.id);
const FP_ICON = '<svg class="ic" aria-hidden="true"><use href="#i-fingerprint"/></svg>';
function fpOf(ig) {
  if (!ig || !FP_LIST.length) return null;
  if (FP_SETS.has(ig.fp)) return ig.fp;
  return FP_LIST[(parseInt(String(ig.id).replace(/\D/g, '')) || 0) % FP_LIST.length];
}
function fpImg(ig, code) {
  const id = fpOf(ig);
  return (id && FP_FILE[code]) ? `<img class="fp-img" src="data/fingerprints/${id}/${FP_FILE[code]}.webp" alt="" onerror="this.outerHTML=FP_ICON">` : null;
}
function fpDiag(ig) {
  if (!FP_LIST.length) return 'База отпечатков не загружена: выполните tools/import_fingerprints.py и обновите страницу (Ctrl+F5).';
  return `База отпечатков: ${FP_LIST.length} карт · карта ИГ: ${fpOf(ig)}${FP_SETS.has(ig?.fp) ? '' : ' (подобрана автоматически)'}`;
}

// Pre-generate queue cases
// «Проблемный» ИГ: ловушка в данных либо нарушение режима приложения «Амина».
function isProblemIG(ig) { return !!ig.trap || ['danger','warn'].includes(aminaCheck(ig).level); }
function pickQueuePerson(pool, used, type, wantProblem) {
  const ok = x => !used.has(x.id) && (type !== 'patent' || x.entryPurpose === 'Работа');
  const ig = pool.find(x => ok(x) && isProblemIG(x) === wantProblem) || pool.find(ok) || pool.find(x => !used.has(x.id));
  used.add(ig.id); return ig;
}
function generateQueueCases() {
  const types = ['migration_reg','patent','rvp','vnzh'];
  const sources = ['ЕПГУ (Госуслуги)','МФЦ','Личный приём','МФЦ','ЕПГУ (Госуслуги)'];
  const statuses = ['new','pending','waiting','new','new','pending','new'];
  const pool = FOREIGN_CITIZENS.slice().sort(() => Math.random() - .5), used = new Set();
  for (let i = 0; i < 12; i++) {
    const type = types[i % types.length];
    // ИГ — случайно из всей базы (600): в очереди уникальные люди, каждый третий кейс «проблемный»
    const ig = pickQueuePerson(pool, used, type, i % 3 === 1);
    const hp = HOST_PARTIES[i % HOST_PARTIES.length];
    const addr = ADDRESSES[i % ADDRESSES.length];
    const daysAgo = [0,1,2,0,0,3,1,0,2,0,1,4][i];
    const d = new Date(); d.setDate(d.getDate() - daysAgo);
    CASES.push({
      id: `ДЕЛО-${1000+i}`,
      type,
      ig: ig.id,
      hp: hp.id,
      addr: addr.id,
      status: statuses[i % statuses.length],
      source: sources[i % sources.length],
      created: d,
      daysOld: daysAgo,
      step: 0,
      decision: null,
      fingerprintsDone: false,
      checksDone: false,
      checksResult: null,
    });
  }
  updateQueueBadge();
}

// ── HELPERS ────────────────────────────────────────
function getIG(id) { return FOREIGN_CITIZENS.find(x=>x.id===id); }
function getHP(id) { return HOST_PARTIES.find(x=>x.id===id); }
function getAddr(id) { return ADDRESSES.find(x=>x.id===id); }
function getCase(id) { return CASES.find(x=>x.id===id); }
