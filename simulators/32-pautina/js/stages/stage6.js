;(function() {
/* ------ Stage 6 scope start ------ */
/* ================================================================
   ЭТАП 6 — КОД (namespace: s6_)
   ================================================================ */

/* ============================================================
   ДАННЫЕ
   ============================================================ */
const USERS_DB=[
  {id:'USR-001',login:'ivanov_op',name:'Иванов Иван Васильевич',role:'operator',region:'77',status:'active',lastLogin:'27.05.2026 08:14',processed:89,ecp:false},
  {id:'USR-002',login:'smirnova_op',name:'Смирнова Татьяна Алексеевна',role:'operator',region:'77',status:'active',lastLogin:'27.05.2026 08:01',processed:76,ecp:false},
  {id:'USR-003',login:'kozlov_op',name:'Козлов Алексей Романович',role:'operator',region:'77',status:'active',lastLogin:'27.05.2026 07:58',processed:102,ecp:false},
  {id:'USR-004',login:'petrov_ins',name:'Петров Игорь Сергеевич',role:'inspector',region:'77',status:'active',lastLogin:'27.05.2026 08:05',processed:187,ecp:true},
  {id:'USR-005',login:'zakharov_ins',name:'Захаров Виктор Михайлович',role:'inspector',region:'77',status:'active',lastLogin:'27.05.2026 08:11',processed:142,ecp:true},
  {id:'USR-006',login:'smirnov_post',name:'Смирнов Андрей Викторович',role:'postal',region:'77',status:'active',lastLogin:'27.05.2026 08:20',processed:164,ecp:false},
  {id:'USR-007',login:'alekseev_ana',name:'Алексеев Михаил Владимирович',role:'analyst',region:'77',status:'active',lastLogin:'27.05.2026 08:30',processed:0,ecp:false},
  {id:'USR-008',login:'admin_reg77',name:'Администратов Федор Алексеевич',role:'reg_admin',region:'77',status:'active',lastLogin:'27.05.2026 07:45',processed:0,ecp:true},
  {id:'USR-009',login:'novikov_op',name:'Новиков Денис Сергеевич',role:'operator',region:'77',status:'active',lastLogin:'27.05.2026 08:02',processed:65,ecp:false},
  {id:'USR-010',login:'fedorova_op',name:'Фёдорова Ольга Константиновна',role:'operator',region:'77',status:'active',lastLogin:'26.05.2026 20:01',processed:88,ecp:false},
  {id:'USR-011',login:'morozov_op50',name:'Морозов Степан Николаевич',role:'operator',region:'50',status:'active',lastLogin:'27.05.2026 09:12',processed:71,ecp:false},
  {id:'USR-012',login:'volkov_ins50',name:'Волков Роман Юрьевич',role:'inspector',region:'50',status:'inactive',lastLogin:'25.05.2026 17:30',processed:134,ecp:true},
];
const ROLES_DEF={
  operator:{name:'Оператор ЦАФАП',color:'var(--primary)',badge:'sb-new',desc:'Предварительная обработка нарушений без доступа к персональным данным'},
  inspector:{name:'Инспектор ЦАФАП',color:'var(--accent)',badge:'sb-proc',desc:'Полный доступ к материалам, подписание ЭЦП, работа с персданными'},
  senior:{name:'Старший инспектор',color:'#E65100',badge:'sb-proc',desc:'Контроль операторов, управление очередью, расширенные права'},
  postal:{name:'Специалист почты',color:'var(--teal)',badge:'sb-done',desc:'Управление почтовой отправкой и контроль доставки'},
  reg_admin:{name:'Региональный администратор',color:'var(--accent-red)',badge:'sb-err',desc:'Управление пользователями и справочниками региона'},
  fed_admin:{name:'Федеральный администратор',color:'var(--purple)'||'#6A1B9A',badge:'sb-purple',desc:'Полный доступ к системе на федеральном уровне'},
  analyst:{name:'Аналитик',color:'var(--success)',badge:'sb-done',desc:'Только чтение, формирование отчётов и аналитика'}
};
const REGIONS_DB=[
  {code:'77',name:'г. Москва',cameras:248,operators:18,cases:2847,status:'online'},
  {code:'50',name:'Московская область',cameras:186,operators:12,cases:1923,status:'online'},
  {code:'78',name:'г. Санкт-Петербург',cameras:201,operators:15,cases:2214,status:'online'},
  {code:'23',name:'Краснодарский край',cameras:134,operators:9,cases:1456,status:'online'},
  {code:'16',name:'Республика Татарстан',cameras:98,operators:7,cases:987,status:'online'},
  {code:'63',name:'Самарская область',cameras:76,operators:6,cases:743,status:'online'},
  {code:'52',name:'Нижегородская область',cameras:89,operators:7,cases:834,status:'warning'},
  {code:'05',name:'Республика Дагестан',cameras:67,operators:5,cases:612,status:'online'},
];
const AUDIT_ENTRIES=Array.from({length:50},(_,i)=>{
  const users=['ivanov_op','petrov_ins','smirnov_post','alekseev_ana','admin_reg77','SYSTEM','kozlov_op','zakharov_ins'];
  const actions=['Просмотр дела','Подписание ЭЦП','Отправка письма','Корректировка OCR','Запрос в РЭО ГИБДД','Авторизация','Выход из системы','Создание пользователя','Изм. настроек','Экспорт отчёта','Передача в ФССП','Изм. НСИ','Резервное копирование','Блокировка пользователя'];
  const objects=['ДЕЛ-2026-'+String(10000+i).padStart(5,'0'),'ПОСТ-77-2026-'+String(10000+i).padStart(5,'0'),'USR-00'+((i%12)+1),'Регион 77','ОТЧ-2026-'+String(500+i).padStart(4,'0'),'Система'];
  const results=['success','success','success','success','success','warning','denied'];
  const t=new Date();t.setMinutes(t.getMinutes()-i*8);
  return{
    time:t.toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    date:t.toLocaleDateString('ru'),
    user:users[i%users.length],
    action:actions[i%actions.length],
    object:objects[i%objects.length],
    ip:`192.168.1.${(i%50)+100}`,
    result:results[i%results.length]
  };
});
/* Справочник статей КоАП — база НСИ (data/nsi.js, таблица koap_articles) */
const NSI_ARTICLES=CAFAP_DB.nsi.table('koap_articles').map(a=>({code:a.code,name:a.name,fine:a.fine,points:a.points||0}));

// QUIZ QUESTIONS
const QUIZ_QUESTIONS=[
  {q:'Какова максимальная уверенность OCR для автоматического подтверждения госномера?',opts:['70%','80%','85%','95%'],correct:2,exp:'Уровень ≥85% считается достаточным для автоподтверждения. Ниже 85% — требуется проверка оператора.'},
  {q:'В течение скольких суток со дня вынесения постановления можно оплатить штраф со скидкой?',opts:['10 суток','20 суток','30 суток','60 суток'],correct:['10','20','30','60'].indexOf(String(CAFAP_DISCOUNT.days)),exp:'Льготный период — '+CAFAP_DISCOUNT.days+' суток со дня вынесения постановления (скидка '+CAFAP_DISCOUNT.pct+'%).'},
  {q:'Через сколько суток неоплаченный штраф передаётся в ФССП?',opts:['30 суток','60 суток','70 суток','90 суток'],correct:2,exp:'60 суток (срок оплаты) + 10 суток (срок обжалования) = 70 суток до передачи в ФССП.'},
  {q:'Что означает статус ЭЦП «ГОСТ Р 34.10-2012»?',opts:['Это серийный номер сертификата','Алгоритм формирования цифровой подписи','Срок действия сертификата','Наименование удостоверяющего центра'],correct:1,exp:'ГОСТ Р 34.10-2012 — российский стандарт алгоритма электронной цифровой подписи.'},
  {q:'Какая статья КоАП регулирует неуплату административного штрафа?',opts:['Ст. 12.9','Ст. 20.25','Ст. 32.2','Ст. 30.1'],correct:1,exp:'Ст. 20.25 КоАП РФ — уклонение от исполнения административного наказания (неуплата).'},
  {q:'Что такое УИН в системе ЦАФАП?',opts:['Уникальный идентификатор нарушения','Уникальный идентификатор начисления для оплаты','Унифицированный индекс нарушителя','Уровень исполнения нормативов'],correct:1,exp:'УИН — Уникальный идентификатор начисления, используется для оплаты штрафа в банке или на Госуслугах.'},
  {q:'Какой стандарт используется для почтовой партионной отправки в Почту России?',opts:['РТМ 0003.05-10','ГОСТ 34.601','ISO 27001','ФСТЭК №21'],correct:0,exp:'РТМ 0003.05-10 — стандарт протокола партионной почты для взаимодействия с Почтой России.'},
  {q:'Оператор ЦАФАП (без роли Инспектора) имеет доступ к персональным данным нарушителя?',opts:['Да, полный доступ','Да, только ФИО','Нет, только после подтверждения инспектором','Нет никогда'],correct:2,exp:'Оператор выполняет предварительную обработку без персданных. Доступ к персданным — только у Инспектора ЦАФАП.'},
  {q:'Что такое ФИС ГИБДД-М?',opts:['Федеральная инспекция собственников ГИБДД','Федеральная информационная система ГИБДД','Федеральная интеграционная схема','Форматно-информационная система'],correct:1,exp:'ФИС ГИБДД-М — Федеральная информационная система ГИБДД, единая база данных транспортных средств и владельцев.'},
  {q:'Через сколько дней постановление вступает в законную силу при невручении письма (возврат)?',opts:['С момента отправки','С момента возврата','Через 30 дней','После повторной отправки'],correct:1,exp:'Согласно ст. 29.6.1 КоАП РФ, при возврате письма с постановлением оно считается врученным с момента возврата.'},
  {q:'Какая информация содержится в хеш-сумме SHA-256 постановления?',opts:['Данные нарушителя в зашифрованном виде','Криптографический «отпечаток» документа для проверки целостности','Номер сертификата ЭЦП','Дата и время подписания'],correct:1,exp:'SHA-256 — алгоритм хеширования, создающий уникальный «отпечаток» файла. При любом изменении хеш изменится.'},
  {q:'Что означает статус «Ожидает ЭЦП» для постановления?',opts:['Постановление отправлено нарушителю','Постановление составлено, но не подписано инспектором','Инспектор подписал, ждёт отправки','Штраф оплачен'],correct:1,exp:'«Ожидает ЭЦП» — документ составлен оператором и передан инспектору, но ещё не подписан электронной цифровой подписью.'},
];

const S6T={instTab:'mission',instCollapsed:false,quest:SPA_STATE.quest[6],session:{startTime:new Date()},
  quiz:{current:0,score:0,answers:[],finished:false},editUser:null
};

/* S6: load handled by SPA */

function s6_setSection(sec,navEl){
  document.querySelectorAll('.nav-item').forEach(e=>e.classList.remove('active'));
  if(navEl)navEl.classList.add('active');
  const mc=document.getElementById('mainContent6');
  const R={users:s6_renderUsers,roles:s6_renderRoles,regions:s6_renderRegions,nsi:s6_renderNSI,audit:s6_renderAudit,settings:s6_renderSettings,backup:s6_renderBackup,integration:s6_renderIntegration,quiz:s6_renderQuiz,cert:s6_renderCert};
  (R[sec]||s6_renderUsers)(mc);
}
function closeModal(id){document.getElementById(id).style.display='none';}
function rnd(arr){return arr[Math.floor(Math.random()*arr.length)];}

/* ============================================================
   УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
   ============================================================ */
function s6_renderUsers(mc){
  const roleLbl={operator:'Оператор',inspector:'Инспектор',senior:'Ст. инспектор',postal:'Спец. почты',reg_admin:'Рег. Адм.',fed_admin:'Фед. Адм.',analyst:'Аналитик'};
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-users-cog" style="color:var(--primary);"></i>Управление пользователями</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-p" onclick="s6_openUserModal(null)"><i class="fas fa-user-plus"></i> Создать пользователя</button>
        <button class="btn btn-s btn-sm" onclick="toast('Импорт пользователей из AD...','info')"><i class="fas fa-file-import"></i> Импорт из AD</button>
        <button class="btn btn-s btn-sm" onclick="toast('Экспорт реестра пользователей','info')"><i class="fas fa-download"></i></button>
      </div>
    </div>
    <!-- Фильтры -->
    <div class="card">
      <div class="card-body" style="padding:10px 13px;display:flex;gap:10px;align-items:center;">
        <input type="text" style="padding:6px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:11.5px;flex:1;" placeholder="🔍 Поиск по ФИО, логину...">
        <select style="padding:6px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;"><option>Все роли</option>${Object.entries(roleLbl).map(([k,v])=>`<option>${v}</option>`).join('')}</select>
        <select style="padding:6px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;"><option>Все регионы</option><option>77 — Москва</option><option>50 — Моск. обл.</option></select>
        <select style="padding:6px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;"><option>Все статусы</option><option>Активные</option><option>Заблокированные</option></select>
      </div>
    </div>
    <!-- Таблица -->
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-list"></i>Реестр пользователей — Регион 77 + Федеральные</div>
        <span class="sbadge sb-new" style="font-size:10px;">${USERS_DB.length} пользователей</span>
      </div>
      <div style="overflow-y:auto;flex:1;">
        <table class="data-table">
          <thead><tr><th><input type="checkbox" style="cursor:pointer;"></th><th>ID</th><th>ФИО / Логин</th><th>Роль</th><th>Регион</th><th>ЭЦП</th><th>Статус</th><th>Последний вход</th><th>Обработано</th><th>Действия</th></tr></thead>
          <tbody>${USERS_DB.map((u,i)=>{
            const rb={operator:'sb-new',inspector:'sb-proc',senior:'sb-proc',postal:'sb-done',reg_admin:'sb-err',fed_admin:'sb-purple',analyst:'sb-done'}[u.role]||'sb-new';
            return`<tr>
              <td><input type="checkbox" style="cursor:pointer;"></td>
              <td class="mono" style="font-size:10px;color:var(--text3);">${u.id}</td>
              <td><div style="font-size:12px;font-weight:600;">${u.name}</div><div class="mono" style="font-size:10px;color:var(--text3);">${u.login}</div></td>
              <td><span class="sbadge ${rb}" style="font-size:9px;">${roleLbl[u.role]||u.role}</span></td>
              <td style="font-size:11px;">${u.region} — ${u.region==='77'?'Москва':u.region==='50'?'Моск.обл.':'—'}</td>
              <td style="text-align:center;">${u.ecp?'<i class="fas fa-certificate" style="color:var(--success);font-size:14px;" title="ЭЦП активна"></i>':'<i class="fas fa-times" style="color:var(--text3);" title="Нет ЭЦП"></i>'}</td>
              <td><span class="sbadge ${u.status==='active'?'sb-done':'sb-arch'}" style="font-size:9px;">${u.status==='active'?'Активен':'Заблокирован'}</span></td>
              <td class="mono" style="font-size:10px;color:var(--text2);">${u.lastLogin}</td>
              <td class="mono" style="font-size:11.5px;font-weight:700;color:var(--primary);">${u.processed||'—'}</td>
              <td><div style="display:flex;gap:3px;">
                <button class="btn btn-p btn-sm" onclick="s6_openUserModal(${i})" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button class="btn btn-s btn-sm" onclick="s6_toggleBlock(${i})" title="${u.status==='active'?'Заблокировать':'Разблокировать'}"><i class="fas ${u.status==='active'?'fa-lock':'fa-lock-open'}"></i></button>
                <button class="btn btn-d btn-sm" onclick="s6_deleteUser(${i})" title="Удалить"><i class="fas fa-trash"></i></button>
              </div></td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 9px;background:#FAFCFF;border-top:1px solid var(--border2);font-size:11px;color:var(--text2);">
        <div>Всего: <strong>${USERS_DB.length}</strong> · Активных: <strong style="color:var(--success);">${USERS_DB.filter(u=>u.status==='active').length}</strong> · С ЭЦП: <strong style="color:var(--primary);">${USERS_DB.filter(u=>u.ecp).length}</strong></div>
        <button class="btn btn-d btn-sm" onclick="toast('Выбранные пользователи заблокированы','warning')"><i class="fas fa-lock"></i> Заблокировать выбранных</button>
      </div>
    </div>
  </div>`;
  s6_markQuest(0);
}

function s6_openUserModal(idx){
  const u=idx!==null?USERS_DB[idx]:{id:'',login:'',name:'',role:'operator',region:'77',status:'active',ecp:false};
  const isNew=idx===null;
  document.getElementById('userModalContent').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
      <div class="form-group" style="margin-bottom:0;"><label class="form-label">ФИО</label><input type="text" class="form-control" id="uName" value="${u.name}" placeholder="Иванов Иван Иванович"></div>
      <div class="form-group" style="margin-bottom:0;"><label class="form-label">Логин</label><input type="text" class="form-control" id="uLogin" value="${u.login}" placeholder="ivanov_op" class="mono"></div>
      ${isNew?`<div class="form-group" style="margin-bottom:0;"><label class="form-label">Пароль</label><input type="password" class="form-control" id="uPass" placeholder="Минимум 8 символов"></div>
      <div class="form-group" style="margin-bottom:0;"><label class="form-label">Подтвердить пароль</label><input type="password" class="form-control" id="uPass2" placeholder="Повторите пароль"></div>`:''}
      <div class="form-group" style="margin-bottom:0;"><label class="form-label">Роль</label>
        <select class="form-select" id="uRole">
          ${Object.entries({operator:'Оператор ЦАФАП',inspector:'Инспектор ЦАФАП',senior:'Старший инспектор',postal:'Специалист почты',analyst:'Аналитик',reg_admin:'Региональный администратор'}).map(([k,v])=>`<option value="${k}" ${u.role===k?'selected':''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;"><label class="form-label">Регион</label>
        <select class="form-select" id="uRegion">
          ${REGIONS_DB.map(r=>`<option value="${r.code}" ${u.region===r.code?'selected':''}>${r.code} — ${r.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="display:flex;gap:14px;margin-bottom:14px;">
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12.5px;">
        <input type="checkbox" id="uECP" ${u.ecp?'checked':''} style="width:16px;height:16px;cursor:pointer;">
        Выдать сертификат ЭЦП
      </label>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12.5px;">
        <input type="checkbox" id="uSend" style="width:16px;height:16px;cursor:pointer;" checked>
        Отправить уведомление на email
      </label>
    </div>
    ${isNew?'':`<div style="background:#F8FAFF;border-radius:7px;padding:10px 12px;font-size:11.5px;margin-bottom:12px;">
      <div style="font-weight:700;margin-bottom:5px;color:var(--text2);">Последняя активность:</div>
      <div>Последний вход: <strong>${u.lastLogin}</strong></div>
      <div>Обработано постановлений: <strong>${u.processed||0}</strong></div>
      <div>Статус аккаунта: <span class="sbadge ${u.status==='active'?'sb-done':'sb-arch'}" style="font-size:9px;">${u.status==='active'?'Активен':'Заблокирован'}</span></div>
    </div>`}
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-s" onclick="closeModal('userModal')">Отмена</button>
      <button class="btn btn-p" onclick="s6_saveUser(${idx})"><i class="fas fa-save"></i> ${isNew?'Создать пользователя':'Сохранить изменения'}</button>
    </div>`;
  document.getElementById('userModal').style.display='flex';
}
function s6_saveUser(idx){
  const name=document.getElementById('uName')?.value;
  if(!name){toast('Введите ФИО пользователя','error');return;}
  closeModal('userModal');
  if(idx===null){toast(`Пользователь ${name} создан. Уведомление отправлено.`,'success');}
  else{toast(`Данные пользователя обновлены`,'success');}
  s6_markQuest(1);
}
function s6_toggleBlock(i){
  USERS_DB[i].status=USERS_DB[i].status==='active'?'inactive':'active';
  toast(`Пользователь ${USERS_DB[i].login} ${USERS_DB[i].status==='active'?'разблокирован':'заблокирован'}`,'warning');
  s6_renderUsers(document.getElementById('mainContent6'));
}
function s6_deleteUser(i){
  if(confirm(`Удалить пользователя ${USERS_DB[i].name}?`)){
    const name=USERS_DB[i].name;USERS_DB.splice(i,1);
    toast(`Пользователь ${name} удалён. Аудит: запись добавлена.`,'warning');
    s6_renderUsers(document.getElementById('mainContent6'));
  }
}

/* ============================================================
   МАТРИЦА ПРАВ ДОСТУПА
   ============================================================ */
function s6_renderRoles(mc){
  const roles=['Оператор','Инспектор','Ст. инспектор','Рег. Адм.','Фед. Адм.','Аналитик'];
  const perms=[
    {name:'OCR-верификация',vals:[1,1,1,1,1,0]},
    {name:'Просмотр персданных',vals:[0,1,1,1,1,0]},
    {name:'Подписание ЭЦП',vals:[0,1,1,0,1,0]},
    {name:'Управление пользователями',vals:[0,0,0,1,1,0]},
    {name:'НСИ — редактирование',vals:[0,0,0,1,1,0]},
    {name:'Передача в ФССП',vals:[0,1,1,1,1,0]},
    {name:'Просмотр аналитики',vals:[0,0,1,1,1,1]},
    {name:'Экспорт данных',vals:[0,0,1,1,1,1]},
    {name:'Системные настройки',vals:[0,0,0,1,1,0]},
    {name:'Резервное копирование',vals:[0,0,0,0,1,0]},
    {name:'Просмотр журнала аудита',vals:[0,0,1,1,1,1]},
    {name:'Управление регионами',vals:[0,0,0,1,1,0]},
  ];
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-shield-alt" style="color:var(--primary);"></i>Матрица ролей и прав доступа</h2>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-th"></i>Матрица доступа по функциям системы</div>
        <div style="font-size:11px;color:var(--text2);display:flex;gap:10px;">
          <span><span style="display:inline-block;width:14px;height:14px;background:#E8F5E9;border-radius:2px;vertical-align:middle;margin-right:3px;"></span>Разрешено</span>
          <span><span style="display:inline-block;width:14px;height:14px;background:#FFEBEE;border-radius:2px;vertical-align:middle;margin-right:3px;"></span>Запрещено</span>
        </div>
      </div>
      <div style="overflow-x:auto;padding:12px;">
        <table style="width:100%;border-collapse:separate;border-spacing:4px;">
          <thead>
            <tr>
              <th style="text-align:left;font-size:11px;font-weight:700;color:var(--text2);padding:6px 0;min-width:200px;">Функция системы</th>
              ${roles.map(r=>`<th style="text-align:center;font-size:11px;font-weight:700;color:var(--text2);padding:6px;min-width:80px;">${r}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${perms.map(p=>`<tr>
              <td style="font-size:12px;padding:4px 0;color:var(--text);">${p.name}</td>
              ${p.vals.map((v,ci)=>`<td style="text-align:center;">
                <div class="access-cell ${v?'ac-yes':'ac-no'}" onclick="s6_togglePerm(this)" title="${v?'Разрешено — нажмите для изменения':'Запрещено — нажмите для изменения'}">
                  <i class="fas ${v?'fa-check':'fa-times'}" style="font-size:12px;"></i>
                </div>
              </td>`).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <!-- Описание ролей -->
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-info-circle"></i>Описание ролей пользователей</div></div>
      <div class="card-body" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:12px;">
        ${Object.entries({operator:'Оператор — предварительная обработка нарушений. НЕ имеет доступа к персданным. Верифицирует OCR, создаёт черновики дел.',inspector:'Инспектор — полный доступ к материалам дел, персданным, подписание ЭЦП. Несёт юридическую ответственность за постановления.',postal:'Специалист почты — управление очередью отправки, контроль доставки, возвращённые письма.',analyst:'Аналитик — только чтение всей системы, формирование отчётов, мониторинг. Не может изменять данные.',reg_admin:'Региональный администратор — управление пользователями, справочниками и настройками региона.',fed_admin:'Федеральный администратор — полный доступ, управление всеми регионами, системными настройками.'}).map(([role,desc])=>`
        <div style="background:var(--primary-xs);border:1px solid var(--border2);border-radius:7px;padding:10px;">
          <div style="font-size:11.5px;font-weight:700;color:var(--primary);margin-bottom:5px;">${{operator:'Оператор ЦАФАП',inspector:'Инспектор',postal:'Специалист почты',analyst:'Аналитик',reg_admin:'Рег. Администратор',fed_admin:'Фед. Администратор'}[role]}</div>
          <div style="font-size:11px;color:var(--text2);line-height:1.4;">${desc}</div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
  s6_markQuest(2);
}
function s6_togglePerm(el){
  const isYes=el.classList.contains('ac-yes');
  el.classList.toggle('ac-yes',!isYes);el.classList.toggle('ac-no',isYes);
  el.innerHTML=`<i class="fas ${isYes?'fa-times':'fa-check'}" style="font-size:12px;"></i>`;
  toast('Право доступа изменено. Изменения будут применены после сохранения.','warning');
  s6_markQuest(2);
}

/* ============================================================
   УПРАВЛЕНИЕ РЕГИОНАМИ
   ============================================================ */
function s6_renderRegions(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-map" style="color:var(--primary);"></i>Управление регионами</h2>
      <button class="btn btn-p btn-sm" onclick="toast('Добавление нового региона...','info')"><i class="fas fa-plus"></i> Добавить регион</button>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:11px;">
      ${REGIONS_DB.map(r=>`<div style="background:#fff;border:1px solid ${r.status==='online'?'var(--border)':'var(--accent)'};border-radius:10px;padding:13px;position:relative;overflow:hidden;cursor:pointer;transition:box-shadow .2s;" onclick="s6_openRegion('${r.code}')" onmouseover="this.style.boxShadow='0 4px 16px rgba(21,101,192,.1)'" onmouseout="this.style.boxShadow=''">
        <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${r.status==='online'?'var(--primary)':'var(--accent)'};"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="font-size:20px;font-weight:800;color:var(--primary);font-family:'Courier New',monospace;">${r.code}</div>
          <span class="sbadge ${r.status==='online'?'sb-done':'sb-warn'}" style="font-size:9px;">${r.status==='online'?'ONLINE':'WARN'}</span>
        </div>
        <div style="font-size:12px;font-weight:700;margin-bottom:6px;">${r.name}</div>
        <div style="font-size:10.5px;color:var(--text2);margin-bottom:2px;"><i class="fas fa-video" style="font-size:9px;"></i> Камер: <strong>${r.cameras}</strong></div>
        <div style="font-size:10.5px;color:var(--text2);margin-bottom:2px;"><i class="fas fa-users" style="font-size:9px;"></i> Операторов: <strong>${r.operators}</strong></div>
        <div style="font-size:10.5px;color:var(--text2);"><i class="fas fa-file-alt" style="font-size:9px;"></i> Дел сегодня: <strong style="color:var(--primary);">${r.cases.toLocaleString('ru')}</strong></div>
      </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-chart-bar"></i>Сравнение регионов по производительности</div></div>
      <div class="card-body" style="padding:8px;"><div class="chart-box" style="position:relative;height:190px;"><canvas id="regChart"></canvas></div></div>
    </div>
  </div>`;
  s6_markQuest(3);
  setTimeout(()=>{
    safeChart(document.getElementById('regChart'),{type:'bar',data:{
      labels:REGIONS_DB.map(r=>r.code+' '+r.name.split(' ')[0]),
      datasets:[
        {label:'Дел сегодня',data:REGIONS_DB.map(r=>r.cases),backgroundColor:'rgba(21,101,192,.2)',borderColor:'#1565C0',borderWidth:1.5},
        {label:'Камер',data:REGIONS_DB.map(r=>r.cameras),backgroundColor:'rgba(46,125,50,.2)',borderColor:'#2E7D32',borderWidth:1.5}
      ]
    },options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{font:{size:10}}}},scales:{y:{beginAtZero:true,ticks:{font:{size:9}}},x:{ticks:{font:{size:9}}}}}});
  },100);
}
function s6_openRegion(code){
  const r=REGIONS_DB.find(x=>x.code===code);if(!r)return;
  toast(`Регион ${code} — ${r.name}: Открытие настроек...`,'info');
}

/* ============================================================
   НСИ
   ============================================================ */
function s6_renderNSI(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-book" style="color:var(--primary);"></i>НСИ — Нормативно-справочная информация</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-s btn-sm" onclick="s6_syncNSI()"><i class="fas fa-sync"></i> Синхр. с МВД</button>
        <button class="btn btn-p btn-sm" onclick="toast('Добавление новой статьи КоАП...','info')"><i class="fas fa-plus"></i> Добавить</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-gavel"></i>Статьи КоАП РФ</div><span class="sbadge sb-new" style="font-size:9.5px;">${NSI_ARTICLES.length} статей</span></div>
        <div>
          ${NSI_ARTICLES.map((a,i)=>`<div class="nsi-row">
            <div>
              <div style="font-weight:700;color:var(--primary);" class="mono">ст. ${a.code}</div>
              <div style="font-size:11px;color:var(--text2);">${a.name}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px;font-weight:700;color:var(--success);" class="mono">${a.fine.toLocaleString('ru')} ₽</div>
              ${a.points?`<div style="font-size:10px;color:var(--accent-red);">–${a.points} баллов</div>`:''}
            </div>
            <div style="display:flex;gap:3px;margin-left:8px;">
              <button class="btn btn-s btn-sm" onclick="s6_editNSI('${a.code}')"><i class="fas fa-edit"></i></button>
            </div>
          </div>`).join('')}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="card">
          <div class="card-hdr"><div class="card-title"><i class="fas fa-video"></i>Каталог комплексов ФВФ</div></div>
          <div>
            ${[['ККДДАС-01СТ Стрела-СТ','Скорость до 250 км/ч','Скорость, перекрёсток'],['СИМСК-1124','Скорость до 300 км/ч','Скорость, полоса'],['Автодория АД-2М','Средняя скорость','Средняя скорость'],['ККДДАС-02 Стрела-М','Скорость до 200 км/ч','Скорость, стоп-линия']].map(([name,speed,types])=>`
            <div class="nsi-row">
              <div><div style="font-weight:600;font-size:12px;">${name}</div><div style="font-size:10.5px;color:var(--text2);">${speed} · ${types}</div></div>
              <button class="btn btn-s btn-sm" onclick="toast('Редактирование: ${name}','info')"><i class="fas fa-edit"></i></button>
            </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <div class="card-hdr"><div class="card-title"><i class="fas fa-map-marker-alt"></i>Регионы РФ (коды)</div></div>
          <div>
            ${REGIONS_DB.map(r=>`<div class="nsi-row" style="padding:5px 10px;">
              <div><span class="mono" style="font-weight:700;color:var(--primary);">${r.code}</span> — ${r.name}</div>
              <span class="sbadge ${r.status==='online'?'sb-done':'sb-warn'}" style="font-size:9px;">${r.status==='online'?'OK':'WARN'}</span>
            </div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  </div>`;
  s6_markQuest(4);
}
function s6_editNSI(code){toast(`Редактирование ст. ${code} КоАП РФ (изменения фиксируются в аудите)`,'warning');}
function s6_syncNSI(){s6_markQuest(4);toast('Синхронизация НСИ с центральным реестром МВД России выполнена','success');}

/* ============================================================
   ЖУРНАЛ АУДИТА
   ============================================================ */
function s6_renderAudit(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;padding:14px;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-history" style="color:var(--primary);"></i>Полный журнал аудита <span class="live-ind" style="margin-left:5px;">LIVE</span></h2>
      <div style="display:flex;gap:6px;">
        <input type="text" style="padding:5px 10px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;width:160px;" placeholder="🔍 Поиск...">
        <input type="date" style="padding:5px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;" value="2026-05-27">
        <select style="padding:5px 9px;border:1.5px solid var(--border);border-radius:6px;font-size:11px;"><option>Все события</option><option>Успешно</option><option>Предупреждения</option><option>Отказы</option></select>
        <button class="btn btn-s btn-sm" onclick="exportAudit()"><i class="fas fa-download"></i> Экспорт</button>
      </div>
    </div>
    <div class="card" style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
      <div class="card-hdr">
        <div class="card-title"><i class="fas fa-shield-alt"></i>Защищённый неизменяемый журнал · Последние 1247 записей</div>
        <span class="sbadge sb-done" style="font-size:10px;"><i class="fas fa-lock" style="font-size:9px;"></i> Целостность ✓</span>
      </div>
      <div style="overflow-y:auto;flex:1;">
        <table class="data-table">
          <thead><tr><th>Время</th><th>Дата</th><th>Пользователь</th><th>Действие</th><th>Объект</th><th>IP-адрес</th><th>Результат</th><th>Хеш</th></tr></thead>
          <tbody>${AUDIT_ENTRIES.map(e=>{
            const rb={success:'sb-done',warning:'sb-warn',denied:'sb-err'}[e.result]||'sb-done';
            const rl={success:'✓ Успешно',warning:'⚠ Предупрежд.',denied:'✕ Отказано'}[e.result]||'OK';
            return`<tr>
              <td class="mono" style="font-size:10.5px;">${e.time}</td>
              <td class="mono" style="font-size:10px;color:var(--text3);">${e.date}</td>
              <td style="font-size:12px;font-weight:600;">${e.user}</td>
              <td style="font-size:11.5px;">${e.action}</td>
              <td class="mono" style="font-size:10.5px;color:var(--primary);">${e.object}</td>
              <td class="mono" style="font-size:10.5px;">${e.ip}</td>
              <td><span class="sbadge ${rb}" style="font-size:9px;">${rl}</span></td>
              <td class="mono" style="font-size:9px;color:var(--text3);">${Math.random().toString(36).substring(2,10).toUpperCase()}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
      <div style="padding:7px 9px;background:#FAFCFF;border-top:1px solid var(--border2);font-size:11px;color:var(--text2);display:flex;justify-content:space-between;">
        <div>Всего записей: <strong>1 247</strong> · Предупреждений: <strong style="color:var(--accent);">23</strong> · Отказов доступа: <strong style="color:var(--accent-red);">7</strong></div>
        <div class="mono" style="font-size:10px;">Хеш цепочки: A3F8B2D1...C7E9F1</div>
      </div>
    </div>
  </div>`;
  s6_markQuest(5);
}
function exportAudit(){s6_markQuest(5);toast('Журнал аудита экспортирован в защищённый PDF','success');}

/* ============================================================
   СИСТЕМНЫЕ НАСТРОЙКИ
   ============================================================ */
function s6_renderSettings(mc){
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-cog" style="color:var(--primary);"></i>Параметры системы</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-s btn-sm" onclick="resetSettings()"><i class="fas fa-undo"></i> Сбросить</button>
        <button class="btn btn-g" onclick="saveSettings()"><i class="fas fa-save"></i> Сохранить настройки</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-brain"></i>Параметры OCR</div></div>
        <div class="card-body">
          <div class="form-group"><label class="form-label">Порог автоподтверждения OCR (%)</label>
            <input type="range" min="70" max="99" value="85" style="width:100%;" id="ocrThresh" oninput="document.getElementById('ocrVal').textContent=this.value+'%'">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text2);margin-top:3px;"><span>70%</span><span id="ocrVal" style="font-weight:700;color:var(--primary);">85%</span><span>99%</span></div>
          </div>
          <div class="form-group"><label class="form-label">Максимальное время верификации (сек)</label><input type="number" class="form-control" value="30" min="10" max="120"></div>
          <div class="form-group"><label class="form-label">Повторная попытка OCR при ошибке</label>
            <select class="form-select"><option>3 раза</option><option>5 раз</option><option>10 раз</option></select>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-ruble-sign"></i>Параметры штрафов</div></div>
        <div class="card-body">
          <div class="form-group"><label class="form-label">Срок льготной оплаты 50% (суток)</label><input type="number" class="form-control" value="20" min="1" max="30"></div>
          <div class="form-group"><label class="form-label">Общий срок оплаты штрафа (суток)</label><input type="number" class="form-control" value="60" min="30" max="90"></div>
          <div class="form-group"><label class="form-label">Срок до передачи в ФССП (суток от срока)</label><input type="number" class="form-control" value="10" min="5" max="30"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-envelope"></i>Параметры почты</div></div>
        <div class="card-body">
          <div class="form-group"><label class="form-label">Вид почтового отправления</label>
            <select class="form-select"><option>Заказное с уведомлением</option><option>Ценное с описью</option></select>
          </div>
          <div class="form-group"><label class="form-label">Срок хранения в ОПС (суток)</label><input type="number" class="form-control" value="30" min="15" max="60"></div>
          <div class="form-group"><label class="form-label">Автоотправка партии (время)</label><input type="time" class="form-control" value="08:00"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-hdr"><div class="card-title"><i class="fas fa-bell"></i>Уведомления</div></div>
        <div class="card-body">
          ${[['Уведомлять о offline-камерах','checked'],['Уведомлять о переполнении очереди ЭЦП','checked'],['Уведомлять о задержках внешних API','checked'],['Уведомлять об истечении сертификатов ЭЦП','checked'],['Email-уведомления руководству',''],['SMS-уведомления при критических инцидентах','checked']].map(([lbl,chk])=>`
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:5px 0;font-size:12px;border-bottom:1px solid var(--border2);">
            <input type="checkbox" ${chk} style="width:16px;height:16px;cursor:pointer;"> ${lbl}
          </label>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
  s6_markQuest(6);
}
function saveSettings(){s6_markQuest(6);toast('Настройки системы сохранены. Требуется перезапуск сервисов.','success');}
function resetSettings(){toast('Настройки сброшены до значений по умолчанию','warning');}

/* ============================================================
   РЕЗЕРВНОЕ КОПИРОВАНИЕ
   ============================================================ */
function s6_renderBackup(mc){
  const backups=[
    {id:'BCK-20260527-030000',date:'27.05.2026 03:00',type:'Полное','size':'47.3 GB',status:'ok',duration:'4 мин 12 сек'},
    {id:'BCK-20260526-030000',date:'26.05.2026 03:00',type:'Полное',size:'46.8 GB',status:'ok',duration:'4 мин 08 сек'},
    {id:'BCK-20260527-120000',date:'27.05.2026 12:00',type:'Инкрементное',size:'2.1 GB',status:'ok',duration:'34 сек'},
    {id:'BCK-20260527-060000',date:'27.05.2026 06:00',type:'Инкрементное',size:'1.8 GB',status:'ok',duration:'28 сек'},
    {id:'BCK-20260525-030000',date:'25.05.2026 03:00',type:'Полное',size:'46.2 GB',status:'ok',duration:'3 мин 58 сек'},
    {id:'BCK-20260524-030000',date:'24.05.2026 03:00',type:'Полное',size:'45.9 GB',status:'warn',duration:'7 мин 21 сек'},
  ];
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-database" style="color:var(--primary);"></i>Резервное копирование</h2>
      <div style="display:flex;gap:6px;">
        <button class="btn btn-p" onclick="s6_startBackup()"><i class="fas fa-play"></i> Запустить резервное копирование</button>
        <button class="btn btn-s btn-sm" onclick="toast('Настройки расписания бэкапов','info')"><i class="fas fa-clock"></i> Расписание</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      ${[
        {lbl:'Последний успешный бэкап',val:'Сегодня 03:00',ico:'fa-check-circle',c:'success'},
        {lbl:'Объём базы данных',val:'47.3 GB',ico:'fa-database',c:'primary'},
        {lbl:'Место хранения',val:'Резервный ЦОД (Тверь)',ico:'fa-server',c:'teal'}
      ].map(s=>`<div style="background:#fff;border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px;">
        <div style="width:44px;height:44px;border-radius:50%;background:var(--primary-xs);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fas ${s.ico}" style="font-size:18px;color:var(--${s.c});"></i>
        </div>
        <div><div style="font-size:16px;font-weight:800;color:var(--${s.c});">${s.val}</div><div style="font-size:11px;color:var(--text2);">${s.lbl}</div></div>
      </div>`).join('')}
    </div>
    <div class="card">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-history"></i>История резервных копий</div></div>
      <table class="data-table">
        <thead><tr><th>ID бэкапа</th><th>Дата/Время</th><th>Тип</th><th>Размер</th><th>Длительность</th><th>Статус</th><th>Действия</th></tr></thead>
        <tbody>${backups.map(b=>`<tr>
          <td class="mono" style="font-size:10.5px;color:var(--primary);">${b.id}</td>
          <td class="mono" style="font-size:10.5px;">${b.date}</td>
          <td><span class="sbadge ${b.type==='Полное'?'sb-new':'sb-proc'}" style="font-size:9px;">${b.type}</span></td>
          <td class="mono" style="font-size:11.5px;font-weight:700;">${b.size}</td>
          <td class="mono" style="font-size:11px;">${b.duration}</td>
          <td><span class="sbadge ${b.status==='ok'?'sb-done':'sb-warn'}" style="font-size:9px;">${b.status==='ok'?'✓ Успешно':'⚠ Предупреждение'}</span></td>
          <td><div style="display:flex;gap:3px;">
            <button class="btn btn-s btn-sm" onclick="toast('Проверка целостности бэкапа...','info')"><i class="fas fa-shield-alt"></i></button>
            <button class="btn btn-s btn-sm" onclick="s6_restoreBackup('${b.id}')"><i class="fas fa-undo"></i></button>
          </div></td>
        </tr>`).join('')}</tbody>
      </table>
    </div>
    <div id="backupProgress"></div>
  </div>`;
  s6_markQuest(7);
}
function s6_startBackup(){
  const p=document.getElementById('backupProgress');if(!p)return;
  p.innerHTML=`<div class="card"><div class="card-body"><div style="font-size:12.5px;font-weight:700;margin-bottom:8px;"><i class="fas fa-circle-notch fa-spin" style="color:var(--primary);"></i> Резервное копирование запущено...</div>
    <div style="height:12px;background:var(--border);border-radius:6px;overflow:hidden;"><div id="bkBar" style="height:100%;background:var(--primary);border-radius:6px;width:0%;transition:width .5s;"></div></div>
    <div id="bkStatus" class="mono" style="font-size:11px;color:var(--text2);margin-top:6px;">Подготовка данных...</div>
  </div></div>`;
  const msgs=['Подготовка данных...','Архивация базы нарушений...','Архивация постановлений...','Архивация журнала аудита...','Передача в резервный ЦОД...','Верификация целостности...','Завершение...'];
  let i=0;
  const int=setInterval(()=>{
    const pct=Math.round(i/msgs.length*100);
    const bar=document.getElementById('bkBar');const st=document.getElementById('bkStatus');
    if(bar)bar.style.width=pct+'%';
    if(st&&msgs[i])st.textContent=msgs[i];
    i++;
    if(i>=msgs.length){clearInterval(int);if(bar)bar.style.width='100%';if(st)st.innerHTML='<span style="color:var(--success);font-weight:700;">✓ Резервное копирование завершено успешно</span>';s6_markQuest(7);toast('Резервная копия создана и проверена','success');}
  },600);
}
function s6_restoreBackup(id){if(confirm(`Восстановить из резервной копии ${id}? Текущие данные будут перезаписаны!`)){toast(`Восстановление из ${id}... Это может занять несколько минут.`,'warning');}}

/* ============================================================
   ИНТЕГРАЦИИ
   ============================================================ */
function s6_renderIntegration(mc){
  const integrations=[
    {name:'ФИС ГИБДД-М',status:'ok',type:'СМЭВ 3.x',url:'fisgidd-m.gibdd.ru',lastSync:'27.05.2026 14:45',icon:'fa-id-card',delay:'45 мс'},
    {name:'РЭО ГИБДД',status:'ok',type:'СМЭВ 3.x',url:'reo.gibdd.ru',lastSync:'27.05.2026 14:43',icon:'fa-car',delay:'128 мс'},
    {name:'ГИС ГМП (платежи)',status:'ok',type:'REST API',url:'gis-gmp.roskazna.ru',lastSync:'27.05.2026 14:47',icon:'fa-landmark',delay:'89 мс'},
    {name:'Почта России',status:'ok',type:'RTM 0003.05-10',url:'pochta.ru/api',lastSync:'27.05.2026 12:00',icon:'fa-envelope',delay:'234 мс'},
    {name:'ФССП АС',status:'warn',type:'REST API',url:'fssprus.ru/api',lastSync:'27.05.2026 13:55',icon:'fa-university',delay:'4 821 мс'},
    {name:'АИПС «Автомобиль»',status:'ok',type:'СМЭВ 2.x',url:'aips.mvd.ru',lastSync:'27.05.2026 14:40',icon:'fa-search',delay:'67 мс'},
    {name:'КриптоПро УЦ (ЭЦП)',status:'ok',type:'PKI',url:'ca.cryptopro.ru',lastSync:'27.05.2026 08:00',icon:'fa-key',delay:'12 мс'},
    {name:'Госуслуги.ру',status:'ok',type:'СМЭВ 3.x',url:'gosuslugi.ru/api',lastSync:'27.05.2026 14:44',icon:'fa-globe',delay:'156 мс'},
  ];
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-plug" style="color:var(--primary);"></i>Внешние интеграции и API-шлюзы</h2>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:11px;">
      ${integrations.map(ig=>`<div class="card" style="border-left:4px solid ${ig.status==='ok'?'var(--success)':'var(--accent)'};cursor:pointer;" onclick="s6_testIntegration('${ig.name}')">
        <div class="card-body" style="padding:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;background:${ig.status==='ok'?'var(--primary-xs)':'#FFF3E0'};border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <i class="fas ${ig.icon}" style="font-size:16px;color:${ig.status==='ok'?'var(--primary)':'var(--accent)'};"></i>
              </div>
              <div><div style="font-size:13px;font-weight:700;">${ig.name}</div><div style="font-size:10.5px;color:var(--text3);" class="mono">${ig.url}</div></div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="width:9px;height:9px;border-radius:50%;background:${ig.status==='ok'?'var(--success)':'var(--accent)'};${ig.status==='ok'?'animation:blink 3s infinite':''}"></div>
              <span style="font-size:11px;font-weight:700;color:${ig.status==='ok'?'var(--success)':'var(--accent)'};">${ig.status==='ok'?'ONLINE':'МЕДЛЕННО'}</span>
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--text2);">
            <span>Протокол: <strong>${ig.type}</strong></span>
            <span>Задержка: <strong style="color:${parseInt(ig.delay)>1000?'var(--accent-red)':parseInt(ig.delay)>200?'var(--accent)':'var(--success)'};" class="mono">${ig.delay}</strong></span>
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:3px;">Синхронизация: ${ig.lastSync}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
  s6_markQuest(8);
}
function s6_testIntegration(name){toast(`Тест соединения: ${name}... Ответ получен.`,'success');}

/* ============================================================
   ТЕСТ ЗНАНИЙ
   ============================================================ */
function s6_renderQuiz(mc){
  if(S6T.quiz.finished){s6_renderQuizResults(mc);return;}
  const q=QUIZ_QUESTIONS[S6T.quiz.current];
  const progress=Math.round((S6T.quiz.current/QUIZ_QUESTIONS.length)*100);
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <h2 style="font-size:15px;font-weight:700;display:flex;align-items:center;gap:7px;"><i class="fas fa-question-circle" style="color:var(--primary);"></i>Тест знаний системы ЦАФАП</h2>
      <button class="btn btn-d btn-sm" onclick="if(confirm('Сбросить тест?')){S6T.quiz={current:0,score:0,answers:[],finished:false};s6_renderQuiz(document.getElementById('mainContent6'))}"><i class="fas fa-redo"></i> Начать заново</button>
    </div>
    <!-- Прогресс -->
    <div class="card">
      <div class="card-body" style="padding:10px 13px;">
        <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:5px;">
          <span>Вопрос <strong>${S6T.quiz.current+1}</strong> из <strong>${QUIZ_QUESTIONS.length}</strong></span>
          <span>Правильных: <strong style="color:var(--success);">${S6T.quiz.score}</strong> | Ошибок: <strong style="color:var(--accent-red);">${S6T.quiz.current-S6T.quiz.score}</strong></span>
        </div>
        <div class="prog-bar" style="height:10px;"><div class="prog-fill" style="width:${progress}%;"></div></div>
      </div>
    </div>
    <!-- Вопрос -->
    <div class="card" style="flex:1;">
      <div class="card-body" style="padding:24px;">
        <div style="font-size:15px;font-weight:700;margin-bottom:20px;line-height:1.4;color:var(--text);">${q.q}</div>
        <div id="quizOptions">
          ${q.opts.map((opt,i)=>`<div class="quiz-option" id="qopt-${i}" onclick="s6_selectAnswer(${i})">
            <div class="quiz-opt-num">${String.fromCharCode(65+i)}</div>
            <div>${opt}</div>
          </div>`).join('')}
        </div>
        <div id="quizExplanation" style="display:none;background:var(--primary-xs);border:1px solid var(--primary-lighter);border-radius:8px;padding:12px;margin-top:14px;font-size:12px;color:var(--text2);"></div>
        <div style="display:flex;justify-content:flex-end;margin-top:16px;">
          <button class="btn btn-p btn-lg" id="nextBtn" onclick="s6_nextQuestion()" style="display:none;"><i class="fas fa-arrow-right"></i> Следующий вопрос</button>
        </div>
      </div>
    </div>
  </div>`;
}

function s6_selectAnswer(idx){
  const q=QUIZ_QUESTIONS[S6T.quiz.current];
  if(S6T.quiz.answers.length>S6T.quiz.current)return;
  S6T.quiz.answers.push(idx);
  const isCorrect=idx===q.correct;
  if(isCorrect)S6T.quiz.score++;
  // Подсветка
  document.querySelectorAll('[id^="qopt-"]').forEach(el=>el.style.pointerEvents='none');
  const selected=document.getElementById(`qopt-${idx}`);
  const correct=document.getElementById(`qopt-${q.correct}`);
  if(selected)selected.classList.add(isCorrect?'correct':'wrong');
  if(!isCorrect&&correct)correct.classList.add('correct');
  // Объяснение
  const exp=document.getElementById('quizExplanation');
  if(exp){exp.style.display='block';exp.innerHTML=`<strong>${isCorrect?'✅ Верно!':'❌ Неверно.'}</strong> ${q.exp}`;}
  // Кнопка далее
  const btn=document.getElementById('nextBtn');
  if(btn){btn.style.display='inline-flex';btn.textContent=S6T.quiz.current<QUIZ_QUESTIONS.length-1?'→ Следующий вопрос':'🎯 Завершить тест';btn.onclick=S6T.quiz.current<QUIZ_QUESTIONS.length-1?s6_nextQuestion:s6_finishQuiz;}
  if(isCorrect)toast(`✅ Правильно! +1 балл`,'success');
  else toast(`❌ Неверно. Правильный ответ: ${q.opts[q.correct]}`,'error');
}

function s6_nextQuestion(){
  S6T.quiz.current++;
  if(S6T.quiz.current>=QUIZ_QUESTIONS.length){s6_finishQuiz();}
  else{s6_renderQuiz(document.getElementById('mainContent6'));}
}

function s6_finishQuiz(){
  S6T.quiz.finished=true;
  s6_markQuest(9);
  s6_renderQuizResults(document.getElementById('mainContent6'));
}

function s6_renderQuizResults(mc){
  const score=S6T.quiz.score;const total=QUIZ_QUESTIONS.length;
  const pct=Math.round(score/total*100);
  const grade=pct>=90?'Отлично':pct>=75?'Хорошо':pct>=60?'Удовлетворительно':'Требует повторного изучения';
  const gradeColor=pct>=90?'var(--success)':pct>=75?'var(--primary)':pct>=60?'var(--accent)':'var(--accent-red)';
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;">
    <div class="cert-container cert-reveal" style="width:600px;text-align:center;">
      <div style="position:relative;z-index:1;">
        <div style="font-size:50px;margin-bottom:12px;">🎓</div>
        <div style="font-size:24px;font-weight:800;margin-bottom:6px;">Результаты тестирования</div>
        <div style="font-size:14px;opacity:.8;margin-bottom:20px;">Сервис ЦАФАП · Тест профессиональных знаний</div>
        <div style="font-size:72px;font-weight:800;font-family:'Courier New',monospace;margin-bottom:8px;color:${pct>=75?'#A5D6A7':'#FFAB91'};">${pct}%</div>
        <div style="font-size:22px;font-weight:700;margin-bottom:16px;color:${pct>=75?'#A5D6A7':'#FFAB91'};">${grade}</div>
        <div style="font-size:14px;opacity:.85;">Правильных ответов: <strong>${score} из ${total}</strong></div>
        <div style="display:flex;justify-content:center;gap:8px;margin-top:16px;flex-wrap:wrap;">
          <div class="cert-badge">⏱ Пройдено: ${total} вопросов</div>
          <div class="cert-badge">✅ Верно: ${score}</div>
          <div class="cert-badge">❌ Ошибок: ${total-score}</div>
        </div>
        <div style="margin-top:20px;display:flex;gap:10px;justify-content:center;">
          <button class="btn btn-s" style="background:rgba(255,255,255,.15);color:#fff;border-color:rgba(255,255,255,.3);" onclick="S6T.quiz={current:0,score:0,answers:[],finished:false};s6_renderQuiz(document.getElementById('mainContent6'))"><i class="fas fa-redo"></i> Пройти снова</button>
          <button class="btn btn-p" style="background:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.5);font-weight:800;" onclick="s6_setSection('cert',document.getElementById('nav-cert'))"><i class="fas fa-certificate"></i> Получить сертификат</button>
        </div>
      </div>
    </div>
    <!-- Разбор ошибок -->
    <div class="card" style="width:600px;">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-list-check"></i>Разбор ответов</div></div>
      <div class="card-body" style="padding:10px 14px;">
        ${QUIZ_QUESTIONS.map((q,i)=>{
          const ans=S6T.quiz.answers[i];const isOk=ans===q.correct;
          return`<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border2);">
            <span style="font-size:16px;">${isOk?'✅':'❌'}</span>
            <div style="flex:1;font-size:11.5px;"><div style="font-weight:600;">${q.q}</div><div style="color:${isOk?'var(--success)':'var(--accent-red)'};">Ваш ответ: ${q.opts[ans]||'—'}</div>${!isOk?`<div style="color:var(--success);">Правильно: ${q.opts[q.correct]}</div>`:''}</div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

/* ============================================================
   СЕРТИФИКАЦИЯ (ФИНАЛЬНЫЙ ЭКРАН)
   ============================================================ */
function s6_renderCert(mc){
  const quizPct=S6T.quiz.finished?Math.round(S6T.quiz.score/QUIZ_QUESTIONS.length*100):0;
  const _qp=n=>Math.round(SPA_STATE.quest[n].done.length/12*100);
  const stages=[
    {num:1,name:'Авторизация и дашборд',pct:_qp(1),icon:'fa-tachometer-alt'},
    {num:2,name:'OCR-верификация и обработка',pct:_qp(2),icon:'fa-camera'},
    {num:3,name:'Постановления и ЭЦП',pct:_qp(3),icon:'fa-signature'},
    {num:4,name:'Почта, оплата, ФССП',pct:_qp(4),icon:'fa-envelope'},
    {num:5,name:'Аналитика и мониторинг',pct:_qp(5),icon:'fa-chart-bar'},
    {num:6,name:'Администрирование',pct:quizPct,icon:'fa-cog'},
  ];
  const totalPct=Math.round(stages.reduce((a,s)=>a+s.pct,0)/stages.length);
  const canCert=S6T.quiz.finished&&quizPct>=60;
  const now=new Date();
  const certNum=`ЦАФАП-${now.getFullYear()}-${String(Math.floor(Math.random()*9000)+1000)}`;
  const validUntil=new Date(now);validUntil.setFullYear(validUntil.getFullYear()+1);
  mc.innerHTML=`
  <div style="flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:14px;align-items:center;">

    <!-- Сводка прогресса -->
    <div class="card" style="width:700px;">
      <div class="card-hdr"><div class="card-title"><i class="fas fa-graduation-cap"></i>Сводка обучения — все 6 этапов</div></div>
      <div class="card-body">
        ${stages.map(s=>`<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
          <div style="width:32px;height:32px;border-radius:50%;background:${s.pct>=80?'var(--success)':s.pct>=60?'var(--primary)':'var(--accent)'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;"><i class="fas ${s.icon}"></i></div>
          <div style="flex:1;"><div style="font-size:12.5px;font-weight:600;">Этап ${s.num}: ${s.name}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
              <div class="prog-bar" style="flex:1;height:8px;"><div class="prog-fill" style="width:${s.pct}%;background:${s.pct>=80?'var(--success)':s.pct>=60?'var(--primary)':'var(--accent)'};"></div></div>
              <span style="font-size:11.5px;font-weight:700;width:36px;text-align:right;color:${s.pct>=80?'var(--success)':s.pct>=60?'var(--primary)':'var(--accent)'};">${s.pct}%</span>
            </div>
          </div>
          <span style="font-size:18px;">${s.pct>=80?'✅':s.pct>=60?'🟡':'🔴'}</span>
        </div>`).join('')}
        <div style="border-top:2px solid var(--primary);margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:14px;font-weight:700;">Итоговый результат:</div>
          <div style="font-size:22px;font-weight:800;color:${totalPct>=80?'var(--success)':totalPct>=60?'var(--primary)':'var(--accent-red)'};">${totalPct}%</div>
        </div>
      </div>
    </div>

    ${canCert?`
    <!-- СЕРТИФИКАТ -->
    <div class="cert-container cert-reveal" style="width:700px;" id="certDoc">
      <div style="position:relative;z-index:1;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
          <div class="cert-seal">🛡</div>
          <div style="text-align:center;">
            <div style="font-size:11px;opacity:.65;letter-spacing:1px;text-transform:uppercase;">Министерство внутренних дел Российской Федерации</div>
            <div style="font-size:11px;opacity:.65;letter-spacing:.5px;">ГИБДД · ЦАФАП ОДД</div>
          </div>
          <div class="cert-seal">⚖</div>
        </div>
        <div style="text-align:center;margin-bottom:20px;">
          <div style="font-size:13px;opacity:.7;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Сертификат об успешном прохождении</div>
          <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px;margin-bottom:6px;">Учебного тренажёра ЦАФАП</div>
          <div style="font-size:13px;opacity:.75;">Сервис для автоматизации деятельности Центров автоматизированной фиксации<br>административных правонарушений в области дорожного движения</div>
        </div>
        <div style="text-align:center;border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:14px;margin-bottom:18px;">
          <div style="font-size:12px;opacity:.7;margin-bottom:4px;">Настоящий сертификат подтверждает, что</div>
          <div style="font-size:22px;font-weight:800;margin-bottom:4px;">${(SPA_STATE.cadet&&SPA_STATE.cadet.fio)||'Оператор ЦАФАП'}</div>
          <div style="font-size:12px;opacity:.7;">успешно прошёл(а) полный курс обучения на тренажёре ЦАФАП,<br>освоив все 6 этапов административного производства по нарушениям ПДД</div>
        </div>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
          ${stages.map(s=>`<div class="cert-badge star-pop" style="animation-delay:${s.num*0.1}s;"><i class="fas ${s.icon}" style="font-size:11px;"></i> Этап ${s.num}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:11px;opacity:.8;border-top:1px solid rgba(255,255,255,.2);padding-top:14px;">
          <div><div style="opacity:.6;">Итоговый балл:</div><div style="font-size:18px;font-weight:800;">${totalPct}% · ${totalPct>=90?'Отлично':totalPct>=75?'Хорошо':'Зачёт'}</div></div>
          <div style="text-align:center;"><div style="opacity:.6;">Номер сертификата:</div><div class="mono" style="font-weight:700;">${certNum}</div></div>
          <div style="text-align:right;"><div style="opacity:.6;">Действителен до:</div><div style="font-weight:700;">${validUntil.toLocaleDateString('ru')}</div></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:14px;align-items:flex-end;">
          <div style="font-size:10px;opacity:.6;">Дата выдачи: ${now.toLocaleDateString('ru')}</div>
          <div style="text-align:right;font-size:10px;opacity:.6;">Верификация: cafap.mvd.ru/cert/${certNum}</div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:10px;">
      <button class="btn btn-p btn-lg" onclick="s6_downloadCert()"><i class="fas fa-download"></i> Скачать сертификат (PDF)</button>
      <button class="btn btn-s" onclick="switchStage(1)"><i class="fas fa-home"></i> На главный дашборд</button>
      <button class="btn btn-s" onclick="toast('Сертификат отправлен на email','success')"><i class="fas fa-envelope"></i> Отправить на email</button>
    </div>`
    :`<div class="card" style="width:700px;">
      <div class="card-body" style="text-align:center;padding:30px;">
        <div style="font-size:48px;margin-bottom:12px;">📚</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Для получения сертификата пройдите тест</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:16px;">Минимальный проходной балл — 60%. Текущий результат тестирования: <strong>${quizPct}%</strong></div>
        <button class="btn btn-p btn-lg" onclick="s6_setSection('quiz',document.getElementById('nav-quiz'))"><i class="fas fa-question-circle"></i> Пройти тест знаний</button>
      </div>
    </div>`}
  </div>`;
}

function s6_downloadCert(){
  if(document.getElementById('certDoc')){toast('Откроется диалог печати: выберите «Сохранить как PDF»','success');setTimeout(()=>window.print(),300);}else{toast('Сертификат ещё недоступен: пройдите тест','error');return;}
  s6_markQuest(10);s6_markQuest(11);
}

/* ============================================================
   QUEST SYSTEM
   ============================================================ */
const QSTEPS=[
  {n:1,title:'Управление пользователями',text:'В разделе <strong>«Управление пользователями»</strong> изучите реестр. Нажмите кнопку <i class="fas fa-edit"></i> для редактирования любого пользователя.'},
  {n:2,title:'Создание пользователя',text:'Нажмите <strong>«Создать пользователя»</strong>, заполните форму и нажмите «Создать». Назначьте роль и регион.'},
  {n:3,title:'Матрица прав доступа',text:'Откройте <strong>«Роли и права доступа»</strong>. Изучите матрицу. Попробуйте изменить право доступа (нажав на ячейку).'},
  {n:4,title:'Управление регионами',text:'Откройте <strong>«Управление регионами»</strong>. Нажмите на карточку любого региона для просмотра настроек.'},
  {n:5,title:'Работа с НСИ',text:'Откройте раздел <strong>«НСИ — Справочники»</strong>. Нажмите <strong>«Синхр. с МВД»</strong> для обновления данных.'},
  {n:6,title:'Журнал аудита',text:'Откройте <strong>«Полный журнал аудита»</strong>. Найдите записи с результатом «Отказано» (denied).'},
  {n:7,title:'Системные настройки',text:'Откройте <strong>«Параметры системы»</strong>. Измените порог OCR и нажмите <strong>«Сохранить настройки»</strong>.'},
  {n:8,title:'Резервное копирование',text:'Откройте <strong>«Резервное копирование»</strong> и нажмите <strong>«Запустить резервное копирование»</strong>.'},
  {n:9,title:'Интеграции',text:'Откройте <strong>«Интеграции»</strong>. Нажмите на любую карточку для тестирования соединения.'},
  {n:10,title:'Тест знаний',text:'Откройте <strong>«Тест знаний»</strong> и ответьте на все вопросы. Для сертификации нужно набрать ≥60%.'},
  {n:11,title:'Получение сертификата',text:'После прохождения теста откройте раздел <strong>«Сертификация»</strong> и скачайте сертификат.'},
  {n:12,title:'Обучение завершено! 🎓',text:'Поздравляем! Вы прошли все 6 этапов обучения на тренажёре ЦАФАП. Нажмите «На главный дашборд» для просмотра итоговой статистики.'}
];
const HINTS=[
  {t:'Принцип наименьших привилегий',txt:'Каждый пользователь должен иметь только те права, которые необходимы для выполнения его служебных обязанностей. Оператор не должен видеть персданные.'},
  {t:'Неизменяемость аудита',txt:'Журнал аудита защищён от изменений с помощью хеш-цепочки. Любое изменение записи приведёт к нарушению цепочки и будет обнаружено.'},
  {t:'Резервное копирование (3-2-1)',txt:'Правило 3-2-1: 3 копии данных, 2 разных носителя, 1 копия в другом географическом месте. В ЦАФАП: основной ЦОД + резервный ЦОД в Твери.'},
  {t:'НСИ и версионирование',txt:'Любое изменение НСИ (статей КоАП, размеров штрафов) фиксируется с указанием даты, времени и пользователя. Все постановления обрабатываются по правилам, действовавшим на момент нарушения.'}
];
const GLOSSARY=[
  {t:'НСИ',d:'Нормативно-справочная информация — классификаторы и справочники'},
  {t:'СУБД',d:'Система управления базами данных'},
  {t:'AD',d:'Active Directory — корпоративная служба каталогов'},
  {t:'PKI',d:'Public Key Infrastructure — инфраструктура открытых ключей (ЭЦП)'},
  {t:'СМЭВ',d:'Система межведомственного электронного взаимодействия'},
  {t:'SLA',d:'Service Level Agreement — соглашение об уровне сервиса'},
  {t:'ФСТЭК',d:'Федеральная служба по техническому и экспортному контролю'},
  {t:'КриптоПро',d:'Российское СКЗИ — средство криптографической защиты информации'},
  {t:'ФЗ-149',d:'Федеральный закон «Об информации, информационных технологиях»'},
  {t:'ФЗ-152',d:'Федеральный закон «О персональных данных»'}
];

function s6_initQuest(){S6T.quest.done=[];S6T.quest.step=0;s6_updateQuestUI();s6_renderInstContent();}
function s6_markQuest(idx){if(!S6T.quest.done.includes(idx)){S6T.quest.done.push(idx);s6_updateQuestUI();logEvent('quest_step',{step:idx,title:QSTEPS[idx]?.title||'',total:QSTEPS.length});toast(`✅ Шаг ${idx+1}: ${QSTEPS[idx]?.title||''}!`,'success');}}
function s6_nextQuest(){if(S6T.quest.step<QSTEPS.length-1){s6_markQuest(S6T.quest.step);S6T.quest.step++;s6_updateQuestUI();}else{s6_markQuest(S6T.quest.step);toast('🏆 Поздравляем! Весь курс ЦАФАП пройден! Получите сертификат!','success');s6_setSection('cert',document.getElementById('nav-cert'));}}
function s6_restartQuest(){S6T.quest.done=[];S6T.quest.step=0;s6_updateQuestUI();toast('Квест перезапущен','info');}
function s6_updateQuestUI(){
  const pct=Math.round((S6T.quest.done.length/S6T.quest.total)*100);
  const el=document.getElementById('questPct');if(el)el.textContent=pct+'%';
  const pf=document.getElementById('instProgFill');if(pf)pf.style.width=pct+'%';
  const pt=document.getElementById('instProgTxt');if(pt)pt.textContent=`${S6T.quest.done.length}/${S6T.quest.total} шагов`;
  s6_renderInstContent();
}
function s6_switchInstTab(el,tab){document.querySelectorAll('.inst-tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');S6T.instTab=tab;s6_renderInstContent();}
function s6_renderInstContent(){
  const body=document.getElementById('instBody');if(!body)return;
  const tab=S6T.instTab||'mission';
  if(tab==='mission'){
    const cur=S6T.quest.step;
    body.innerHTML=`<div>
      <div style="font-size:11.5px;font-weight:700;color:var(--primary);margin-bottom:7px;">📋 ЭТАП 6 (ФИНАЛЬНЫЙ): Администрирование, тест знаний и сертификация</div>
      <div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:4px;">
        ${QSTEPS.map((s,i)=>{const done=S6T.quest.done.includes(i);const active=cur===i;return`<div style="text-align:center;flex-shrink:0;width:60px;"><div class="qs-num ${done?'qn-done':active?'qn-active':'qn-pend'}" style="margin:0 auto 3px;">${done?'✓':s.n}</div><div style="font-size:9px;color:${done?'var(--success)':active?'var(--primary)':'var(--text3)'};line-height:1.2;">${s.title.split(' ').slice(0,2).join(' ')}</div></div>`;}).join('')}
      </div>
      ${cur<QSTEPS.length?`<div style="margin-top:7px;padding:8px 10px;background:var(--primary-xs);border-radius:6px;border-left:3px solid var(--primary);"><div style="font-size:10.5px;font-weight:700;color:var(--primary);margin-bottom:2px;">▶ Шаг ${cur+1}/${QSTEPS.length}: ${QSTEPS[cur]?.title}</div><div style="font-size:11px;">${QSTEPS[cur]?.text}</div></div>`
      :`<div style="padding:10px;background:linear-gradient(135deg,#E8F5E9,#F0FFF4);border-radius:8px;font-size:12px;border:2px solid var(--success);">🏆 <strong>Курс ЦАФАП завершён!</strong> Все этапы пройдены. Откройте раздел «Сертификация» для получения сертификата оператора ЦАФАП.</div>`}
    </div>`;
  } else if(tab==='hints'){
    body.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;">${HINTS.map(h=>`<div style="flex:1;min-width:180px;padding:8px;background:#F8FAFF;border-radius:6px;border:1px solid var(--border2);"><div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:3px;">💡 ${h.t}</div><div style="font-size:10.5px;color:var(--text2);line-height:1.4;">${h.txt}</div></div>`).join('')}</div>`;
  } else if(tab==='progress'){
    const pct=Math.round((S6T.quest.done.length/S6T.quest.total)*100);
    const allStages=[{n:1,done:true},{n:2,done:true},{n:3,done:true},{n:4,done:true},{n:5,done:true},{n:6,done:pct>=80}];
    body.innerHTML=`<div style="display:flex;gap:14px;align-items:center;">
      <div style="text-align:center;padding:10px 14px;background:var(--primary-xs);border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:26px;font-weight:800;color:var(--primary);font-family:'Courier New',monospace;">${pct}%</div>
        <div style="font-size:10px;color:var(--text2);">Этап 6</div>
      </div>
      <div style="flex:1;"><div class="prog-bar" style="height:10px;margin-bottom:7px;"><div class="prog-fill" style="width:${pct}%;"></div></div>
        <div style="display:flex;gap:7px;flex-wrap:wrap;">
          <span style="font-size:10px;background:#E8F5E9;color:var(--success);padding:2px 8px;border-radius:10px;">✓ ${S6T.quest.done.length}</span>
          <span style="font-size:10px;background:var(--primary-xs);color:var(--primary);padding:2px 8px;border-radius:10px;">▶ ${S6T.quest.total-S6T.quest.done.length}</span>
        </div>
      </div>
      <div style="font-size:10.5px;">${allStages.map(s=>`<div style="color:${s.done?'var(--success)':'var(--text3)'};">${s.done?'✅':'⬜'} Этап ${s.n}</div>`).join('')}</div>
    </div>`;
  } else if(tab==='glossary'){
    body.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:5px;">${GLOSSARY.map(g=>`<div style="padding:4px 9px;background:#F8FAFF;border-radius:4px;border:1px solid var(--border2);"><span style="font-size:11px;font-weight:700;color:var(--primary);">${g.t}</span><span style="font-size:10px;color:var(--text2);margin-left:4px;">— ${g.d}</span></div>`).join('')}</div>`;
  }
}
function s6_toggleInst(){
  S6T.instCollapsed=!S6T.instCollapsed;
  const c=document.getElementById('instContent'),ico=document.getElementById('instTogIco'),panel=document.getElementById('instPanel');
  if(S6T.instCollapsed){c.style.display='none';panel.style.height='42px';ico.className='fas fa-chevron-up';}
  else{c.style.display='';panel.style.height='var(--inst)';ico.className='fas fa-chevron-down';}
}
function toast(msg,type='info'){
  logEvent('notification',{message:msg,level:type});
  const box=document.getElementById('toastBox');
  const icons={info:'fa-info-circle',success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle'};
  const colors={info:'#1565C0',success:'#2E7D32',error:'#C62828',warning:'#F57C00'};
  const d=document.createElement('div');d.className=`toast ${type}`;
  d.innerHTML=`<i class="fas ${icons[type]||icons.info}" style="color:${colors[type]||colors.info};flex-shrink:0;font-size:14px;"></i><span>${msg}</span>`;
  box.appendChild(d);
  setTimeout(()=>{d.style.transition='opacity .3s';d.style.opacity='0';setTimeout(()=>d.remove(),300);},4000);
}
// Fix for const used before let issue
const ROLES_DEF_COLORS={'operator':'var(--primary)','inspector':'var(--accent)','postal':'var(--teal)','analyst':'var(--success)','reg_admin':'var(--accent-red)','fed_admin':'var(--purple)'};


/* ------ Stage 6 exports ------ */
  window.s6_setSection = (typeof s6_setSection!=="undefined") ? s6_setSection : window.s6_setSection;
  window.s6_renderUsers = (typeof s6_renderUsers!=="undefined") ? s6_renderUsers : window.s6_renderUsers;
  window.s6_openUserModal = (typeof s6_openUserModal!=="undefined") ? s6_openUserModal : window.s6_openUserModal;
  window.s6_saveUser = (typeof s6_saveUser!=="undefined") ? s6_saveUser : window.s6_saveUser;
  window.s6_toggleBlock = (typeof s6_toggleBlock!=="undefined") ? s6_toggleBlock : window.s6_toggleBlock;
  window.s6_deleteUser = (typeof s6_deleteUser!=="undefined") ? s6_deleteUser : window.s6_deleteUser;
  window.s6_renderRoles = (typeof s6_renderRoles!=="undefined") ? s6_renderRoles : window.s6_renderRoles;
  window.s6_togglePerm = (typeof s6_togglePerm!=="undefined") ? s6_togglePerm : window.s6_togglePerm;
  window.s6_renderRegions = (typeof s6_renderRegions!=="undefined") ? s6_renderRegions : window.s6_renderRegions;
  window.s6_openRegion = (typeof s6_openRegion!=="undefined") ? s6_openRegion : window.s6_openRegion;
  window.s6_renderNSI = (typeof s6_renderNSI!=="undefined") ? s6_renderNSI : window.s6_renderNSI;
  window.s6_editNSI = (typeof s6_editNSI!=="undefined") ? s6_editNSI : window.s6_editNSI;
  window.s6_syncNSI = (typeof s6_syncNSI!=="undefined") ? s6_syncNSI : window.s6_syncNSI;
  window.s6_renderAudit = (typeof s6_renderAudit!=="undefined") ? s6_renderAudit : window.s6_renderAudit;
  window.s6_renderSettings = (typeof s6_renderSettings!=="undefined") ? s6_renderSettings : window.s6_renderSettings;
  window.s6_renderBackup = (typeof s6_renderBackup!=="undefined") ? s6_renderBackup : window.s6_renderBackup;
  window.s6_startBackup = (typeof s6_startBackup!=="undefined") ? s6_startBackup : window.s6_startBackup;
  window.s6_restoreBackup = (typeof s6_restoreBackup!=="undefined") ? s6_restoreBackup : window.s6_restoreBackup;
  window.s6_renderIntegration = (typeof s6_renderIntegration!=="undefined") ? s6_renderIntegration : window.s6_renderIntegration;
  window.s6_testIntegration = (typeof s6_testIntegration!=="undefined") ? s6_testIntegration : window.s6_testIntegration;
  window.s6_renderQuiz = (typeof s6_renderQuiz!=="undefined") ? s6_renderQuiz : window.s6_renderQuiz;
  window.s6_selectAnswer = (typeof s6_selectAnswer!=="undefined") ? s6_selectAnswer : window.s6_selectAnswer;
  window.s6_nextQuestion = (typeof s6_nextQuestion!=="undefined") ? s6_nextQuestion : window.s6_nextQuestion;
  window.s6_finishQuiz = (typeof s6_finishQuiz!=="undefined") ? s6_finishQuiz : window.s6_finishQuiz;
  window.s6_renderQuizResults = (typeof s6_renderQuizResults!=="undefined") ? s6_renderQuizResults : window.s6_renderQuizResults;
  window.s6_renderCert = (typeof s6_renderCert!=="undefined") ? s6_renderCert : window.s6_renderCert;
  window.s6_downloadCert = (typeof s6_downloadCert!=="undefined") ? s6_downloadCert : window.s6_downloadCert;
  window.s6_initQuest = (typeof s6_initQuest!=="undefined") ? s6_initQuest : window.s6_initQuest;
  window.s6_markQuest = (typeof s6_markQuest!=="undefined") ? s6_markQuest : window.s6_markQuest;
  window.s6_nextQuest = (typeof s6_nextQuest!=="undefined") ? s6_nextQuest : window.s6_nextQuest;
  window.s6_restartQuest = (typeof s6_restartQuest!=="undefined") ? s6_restartQuest : window.s6_restartQuest;
  window.s6_updateQuestUI = (typeof s6_updateQuestUI!=="undefined") ? s6_updateQuestUI : window.s6_updateQuestUI;
  window.s6_switchInstTab = (typeof s6_switchInstTab!=="undefined") ? s6_switchInstTab : window.s6_switchInstTab;
  window.s6_renderInstContent = (typeof s6_renderInstContent!=="undefined") ? s6_renderInstContent : window.s6_renderInstContent;
  window.s6_toggleInst = (typeof s6_toggleInst!=="undefined") ? s6_toggleInst : window.s6_toggleInst;
  if(typeof S6T!=="undefined") window.S6T = S6T;
  window.exportAudit=exportAudit; window.saveSettings=saveSettings; window.resetSettings=resetSettings;
  window.s6_badges=function(){return {users:USERS_DB.length};};
})(); /* end Stage 6 IIFE */
/* initStage6 */
function initStage6(){if(typeof s6_setSection==="function")s6_setSection("users",null);}
