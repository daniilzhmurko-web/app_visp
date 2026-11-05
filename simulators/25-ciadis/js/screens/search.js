'use strict';
/* =====================================================
   РЕНДЕР: ПОИСК ДАКТИЛОКАРТ
   ===================================================== */
function rSearch() {
  return `
<div class="breadcrumb"><i class="fas fa-home"></i><span class="sep">/</span><i class="fas fa-search"></i><span class="sep">/</span><span class="cur">Поиск дактилокарт</span></div>
<div class="sec-hdr">
  <div><div class="sec-title">Поиск дактилокарт</div><div class="sec-sub">Выборка текстовых данных по значениям полей</div></div>
</div>
<div class="card">
  <div class="card-hdr"><i class="fas fa-filter" style="color:#003F8A"></i><span class="card-title">Параметры поиска</span></div>
  <div class="card-body">
    <div class="form-grid">
      <div class="fg2"><label class="fl2">Фамилия</label><input class="fi2" id="s-sur" placeholder="Введите фамилию..."></div>
      <div class="fg2"><label class="fl2">Имя</label><input class="fi2" id="s-nm" placeholder="Введите имя..."></div>
      <div class="fg2"><label class="fl2">Отчество</label><input class="fi2" id="s-pat" placeholder="Введите отчество..."></div>
      <div class="fg2"><label class="fl2">Тип дактилокарты</label>
        <select class="fs2" id="s-type">
          <option value="">— Все типы —</option>
          <option value="criminal">Уголовная</option>
          <option value="civil">Гражданская</option>
          <option value="migration">Миграционная</option>
        </select>
      </div>
      <div class="fg2"><label class="fl2">Регион</label>
        <select class="fs2" id="s-reg">
          <option value="">— Все регионы —</option>
          <option>Московская область</option><option>Москва</option>
          <option>Санкт-Петербург</option><option>Краснодарский край</option>
          <option>Свердловская область</option><option>Новосибирская область</option>
          <option>Ростовская область</option>
        </select>
      </div>
      <div class="fg2"><label class="fl2">Назначение</label>
        <select class="fs2" id="s-pur">
          <option value="">— Все —</option>
          <option>Идентификация</option><option>Регистрация</option><option>Проверка</option>
        </select>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:6px">
      <button class="btn btn-blue" id="s-btn" onclick="execSearch()"><i class="fas fa-search"></i> Найти</button>
      <button class="btn btn-out" onclick="resetSearch()"><i class="fas fa-undo"></i> Сбросить</button>
    </div>
  </div>
</div>
<div id="s-res"></div>
<div id="s-detail"></div>`;
}

function bindSearch() {
  const t = el('s-type');
  if(t) t.addEventListener('change', function(){
    if(this.value==='criminal'){ S.flags.typeSet=true; checkQ(); glow(); }
  });
}

function execSearch() {
  const sur = (el('s-sur')?.value||'').trim().toLowerCase();
  const typ = el('s-type')?.value||'';
  if(sur==='петров'||sur==='петровы'||sur.startsWith('петров')){ S.flags.searched=true; checkQ(); }
  addLog(`Поиск: ФИО="${sur||'*'}", тип="${typ||'все'}"`, 'search');
  logEvent('search', { surname: sur, type: typ });
  if(S.mode==='exam') examOnSearch(sur);
  const res = el('s-res');
  res.innerHTML = `<div class="card"><div class="card-body" style="text-align:center;padding:30px">
    <div class="spinner" style="margin:0 auto"></div>
    <div style="margin-top:11px;color:var(--muted);font-size:12px">Выполняется поиск в базе данных ЦИАДИС-МВД...</div>
  </div></div>`;
  setTimeout(()=>{
    let filtered = CARDS.filter(c=>{
      let ok=true;
      if(sur) ok=ok&&c.fio.toLowerCase().includes(sur);
      if(typ) ok=ok&&c.type===typ;
      const reg=el('s-reg')?.value||'';
      if(reg) ok=ok&&c.region===reg;
      const pur=el('s-pur')?.value||'';
      if(pur) ok=ok&&c.purpose===pur;
      return ok;
    });
    S.results=filtered;
    res.innerHTML=rResults(filtered);
  },1100);
}

function rResults(cards) {
  if(!cards.length) return `<div class="card"><div class="card-body">
    <div class="empty"><i class="fas fa-search"></i>
    <div style="font-size:15px;font-weight:600;margin-bottom:7px">Ничего не найдено</div>
    <div>Измените параметры поиска и попробуйте снова</div></div>
  </div></div>`;
  return `<div class="card">
    <div class="card-hdr"><i class="fas fa-table" style="color:#003F8A"></i>
      <span class="card-title">Результаты поиска</span>
      <span style="margin-left:auto;font-size:11px;color:var(--muted)">Найдено: ${cards.length} записей</span>
    </div>
    <div style="overflow-x:auto">
      <table class="dtbl">
        <thead><tr><th>Идентификатор</th><th>ФИО</th><th>Тип</th><th>Назначение</th><th>Регион</th><th>Дата рег.</th><th>Статус</th></tr></thead>
        <tbody>
          ${cards.map(c=>`<tr onclick="selCard('${c.id}')">
            <td><code style="font-size:11px;color:#003F8A">${c.id}</code></td>
            <td><b>${c.fio}</b></td>
            <td><span class="badge b-${c.type}">${c.tl}</span></td>
            <td>${c.purpose}</td><td>${c.region}</td><td>${c.reg}</td>
            <td><span class="badge ${c.status==='active'?'b-active':'b-pending'}">${c.status==='active'?'Актуальна':'На проверке'}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function resetSearch() {
  ['s-sur','s-nm','s-pat'].forEach(id=>{const e=el(id);if(e)e.value='';});
  ['s-type','s-reg','s-pur'].forEach(id=>{const e=el(id);if(e)e.value='';});
  el('s-res').innerHTML=''; el('s-detail').innerHTML='';
}

function selCard(id) {
  const c=CARDS.find(x=>x.id===id);
  if(!c) return;
  S.card=c;
  if(id==='ДК-2024-0147'){ S.flags.cardSel=true; checkQ(); }
  addLog(`Просмотр дактилокарты ${id} (${c.fio})`,'view');
  logEvent('card_selected', { id, fio: c.fio });
  if(S.mode==='exam') examOnCardSelected(id);
  const det=el('s-detail');
  det.innerHTML=rCardDetail(c);
  setTimeout(()=>det.scrollIntoView({behavior:'smooth',block:'start'}),80);
  // подсветить строку
  document.querySelectorAll('.dtbl tbody tr').forEach(tr=>{
    tr.classList.toggle('sel', tr.cells[0]?.textContent?.trim()===id);
  });
}

function rCardDetail(c) {
  const fp=['П1','П2','П3','П4','П5','Л1','Л2','Л3','Л4','Л5'];
  const fpName=['правый большой','правый указательный','правый средний','правый безымянный','правый мизинец','левый большой','левый указательный','левый средний','левый безымянный','левый мизинец'];
  return `<div class="card" style="margin-top:18px;border-top:3px solid #003F8A">
    <div class="card-hdr">
      <i class="fas fa-fingerprint" style="color:#003F8A;font-size:17px"></i>
      <span class="card-title">Дактилокарта ${c.id}</span>
      <span style="margin-left:auto;display:flex;gap:8px">
        <button class="btn btn-out btn-sm" id="cv-btn" onclick="confirmView()"><i class="fas fa-eye"></i> Подтвердить просмотр</button>
        <button class="btn btn-orange btn-sm" id="er-btn" onclick="openEdit('${c.id}')"><i class="fas fa-file-alt"></i> Создать запрос на редактирование</button>
      </span>
    </div>
    <div class="card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px">
        <div>
          ${dkf('Идентификатор',`<code>${c.id}</code>`)}
          ${dkf('ФИО',`<b>${c.fio}</b>`)}
          ${dkf('Дата рождения',c.dob)}
          ${dkf('Тип',`<span class="badge b-${c.type}">${c.tl}</span>`)}
          ${dkf('Назначение',c.purpose)}
          ${dkf('Серия/номер паспорта',c.pass)}
        </div>
        <div>
          ${dkf('Регион',c.region)}
          ${dkf('Подразделение',c.dept)}
          ${dkf('Дата регистрации',c.reg)}
          ${dkf('Основание/статья',c.art)}
          ${dkf('Оператор',c.op)}
          ${dkf('Статус',`<span class="badge ${c.status==='active'?'b-active':'b-pending'}">${c.status==='active'?'Актуальна':'На проверке'}</span>`)}
        </div>
      </div>
      <div style="margin-top:18px">
        <div class="dkf-lbl" style="margin-bottom:10px">Отпечатки пальцев (${c.fp}/10)</div>
        <div class="fp-grid">${fp.map((f,i)=>`<div title="${fpName[i]}" class="fp-slot${i<c.fp?' ok img':''}"${i<c.fp?` style="background-image:url('assets/fingerprints/${c.id.replace('ДК','DK')}/${String(i+1).padStart(2,'0')}.png')"`:''}><span style="font-size:9px;z-index:1;position:relative">${f}</span></div>`).join('')}</div>
      </div>
    </div>
  </div>`;
}

function dkf(lbl,val) {
  return `<div class="dkf-row"><div class="dkf-lbl">${lbl}</div><div class="dkf-val">${val}</div></div>`;
}

function confirmView() {
  S.flags.cardView=true;
  if(S.mode==='exam') examOnViewConfirmed(S.card?.id);
  addLog(`Просмотр карты ${S.card?.id} подтверждён`,'view');
  logEvent('card_view_confirmed', { id: S.card?.id });
  checkQ();
  toast('Просмотр подтверждён','Действие зафиксировано в журнале','success');
  const b=el('cv-btn');
  if(b){b.innerHTML='<i class="fas fa-check-circle"></i> Просмотрено';
    b.style.cssText='background:#1E8449;color:#fff;border:none;pointer-events:none';}
}
