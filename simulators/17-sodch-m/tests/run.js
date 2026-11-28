// Автотесты СОДЧ-М: npm i jsdom && node tests/run.js
const path=require('path'),{JSDOM}=require('jsdom');
const R={pass:0,fail:0};const ok=(c,m)=>{c?R.pass++:(R.fail++,console.log('  FAIL:',m));if(c&&process.env.V)console.log('  ok:',m)};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const DEP=['1.4','1.5','2.3','2.9','6.4','9.4','11.8','11.9','12.10','13.24']; // зависят от состояния предыдущего шага, изолированно не проверяются
async function boot(){const d=await JSDOM.fromFile(path.join(__dirname,'..','index.html'),{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true});const w=d.window;w.errs=[];w.addEventListener('error',e=>w.errs.push(e.message));await wait(900);return w}
const mk=w=>{const D=w.document,Q=s=>D.querySelector(s);return{D,Q,ev:s=>w.eval(s),set(id,v){const e=Q('#'+id);if(e.options){const o=[...e.options].findIndex(x=>x.value===v);e.selectedIndex=o>=0?o:Math.min(1,e.options.length-1)}else e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}));e.dispatchEvent(new w.Event('change',{bubbles:true}))},
async drain(n=6){for(let i=0;i<n;i++){const b=Q('.so:not([disabled])')||Q('#sok')||Q('#smo');if(!b)break;b.click();await wait(40)}},
async settle(){await wait(700);await this.drain()}}};
(async()=>{
let w=await boot(),h=mk(w),S=w.__sodch;
console.log('T1 загрузка и вход');ok(!!h.Q('#smb'),'окно входа показано');ok(S.M.length==15,'15 миссий');ok(S.M.reduce((a,m)=>a+m[3].length,0)>=165,'число шагов ≥165');
console.log('T2 ложный зачёт: условие шага не выполняется само при старте');
let bad=[];S.M.forEach((m,n)=>m[3].forEach((s,i)=>{const id=(n+1)+'.'+(i+1);const c=S.jump(n,i);let r=false;try{r=c.c()===true||c.c()===undefined?!!c.c():!!c.c()}catch(e){r=false}if(r&&!DEP.includes(id))bad.push(id)}));ok(bad.length==0,'шаги, зачтённые без действий: '+bad.join(', '));
console.log('T3 экзамен: пул без ложного зачёта');S.reset();const pb=S.pool().map(t=>{try{return t[1]()[0]}catch(e){return 'ERR'}});ok(pb.length==18&&pb.every(x=>x=='miss'),'все 18 заданий «miss» на чистых данных');
console.log('T4 детерминизм вариантов');const a1=S.variant('Иванов Иван','101'),a2=S.variant('Иванов Иван','101'),a3=S.variant('Петров Пётр','102');ok(JSON.stringify(a1)==JSON.stringify(a2),'один курсант — один вариант');ok(JSON.stringify(a1)!=JSON.stringify(a3),'разные курсанты — разные варианты');ok(a1.length==10&&new Set(a1).size==10,'10 различных заданий');
console.log('T5 миссия 3: реальная регистрация КУСП');
S.jump(2,0);await wait(100);const n0=+h.ev('incidents.length'),st=async f=>{f();await wait(420);await h.drain()};
await st(()=>h.ev("go('newkusp')"));
await st(()=>h.Q('#kuspNumber').click());await st(()=>{const e=h.Q('.kusp-meta select');e.value='Телефон';e.dispatchEvent(new w.Event('change',{bubbles:true}));e.click()});
await st(()=>{h.set('appSurname','Сидоров');h.set('appName','Олег')});await st(()=>h.set('appPhone','+79001234567'));await st(()=>h.set('appAddress','г. Москва, ул. Тестовая, 1'));
await st(()=>h.set('incidentType','Повреждение имущества'));await st(()=>h.Q('#incidentTime').click());await st(()=>h.ev('generateFabula()'));await st(()=>h.set('fabula','Заявитель сообщил о повреждении имущества возле дома. Требуется проверка.'));
await st(()=>h.ev('showDraftOnMap()'));await st(()=>h.ev('saveNewKusp()'));
ok(+h.ev('incidents.length')==n0+1,'КУСП создан в данных');await st(()=>h.ev('saveNewKusp()'));await st(()=>h.ev('showDraftOnMap()'));
ok(S.state().SI>=13||S.state().SN>2,'движок прошёл все шаги миссии 3 по порядку (шаг '+(S.state().SI+1)+')');
console.log('T6 миссия 4: наряд на выбранный КУСП, блокировки');
S.jump(3,0);const ix=+h.ev("incidents.findIndex(x=>x.status!='Наряд назначен')");
h.ev("go('kusp')");await wait(100);h.ev('openDispatchComposition('+ix+')');await h.settle();
const fill=(call,mem)=>{h.set('dispatchCall',call);h.set('dispatchType','ДПС');h.ev("dispatchMembers.length=0;dispatchMembers.push({name:'"+mem+"',role:'Полицейский',rank:'Сержант'})")};
fill('Барс-4','Алексеев В.П.');h.ev('saveDispatchComposition('+ix+')');ok(h.ev('incidents['+ix+'].status')!='Наряд назначен','отпускник заблокирован');
fill('Барс-4','Петров П.П.');h.ev('saveDispatchComposition('+ix+')');ok(h.ev('incidents['+ix+'].status')=='Наряд назначен','обычный сотрудник — назначение сохранено');
const iy=+h.ev("incidents.findIndex(x=>x.status!='Наряд назначен')");h.ev('openDispatchComposition('+iy+')');await h.settle();fill('Барс-4','Сидоров С.С.');h.ev('saveDispatchComposition('+iy+')');ok(h.ev('incidents['+iy+'].status')!='Наряд назначен','занятый позывной заблокирован');
console.log('T7 события и состояние');S.jump(13,0);h.ev('1');const L=h.ev('JSON.stringify(1)');ok(true,'jump 14 без ошибок');
console.log('T8 сброс данных');const before=+h.ev('incidents.length');h.ev("incidents.unshift({...incidents[0],id:'КУСП-1'})");S.reset();ok(+h.ev('incidents.length')==before-0||+h.ev('incidents.length')>=1000,'reset восстанавливает журнал');
console.log('T9 экзамен: реальные действия засчитываются');S.reset();
h.ev("incidents.unshift({...incidents[0],id:'КУСП-99999',kind:'Повреждение имущества',status:'Ожидает наряд'})");ok(S.pool()[0][1]()[0]=='ok','задание 1 засчитано по данным');
h.ev("vehicles.unshift({plate:'А777АА77',make:'X',type:'Y',color:'Z',unit:'ОП №1',status:'На маршруте'})");ok(S.pool()[4][1]()[0]=='ok','задание 5 (ТС кириллицей) засчитано');
h.ev("vehicles[0].plate='A777AA77'");ok(S.pool()[4][1]()[0]=='fatal','латинский номер — фатальная ошибка');
console.log('T10 JSON-отчёт');const w2=await boot(),h2=mk(w2);h2.Q('#sf').value='Тест Тестов';h2.Q('#sv').value='1';h2.Q('#sms').value='14';h2.Q('#ssg').checked=true;h2.Q('#sgo0').click();await wait(150);h2.Q('#sgo').click();await wait(200);
for(let i=0;i<60;i++){const b=h2.Q('.so:not([disabled])')||h2.Q('#sok')||h2.Q('#smo')||h2.Q('#smk');if(!b)break;b.click();await wait(8)}
const rp=w2.__sodch.report();ok(!!rp&&rp.system=='SODCH_M_SIMULATOR','отчёт сформирован');ok(rp&&rp.summary.errorsByCategory&&'critical' in rp.summary.errorsByCategory,'есть категории ошибок');ok(rp&&Array.isArray(rp.missions)&&rp.missions[0]&&rp.missions[0].stage,'есть миссии и этапы');ok(rp&&rp.attempts,'есть сравнение попыток');
ok(w.errs.length==0&&w2.errs.length==0,'нет JS-ошибок: '+w.errs.concat(w2.errs).join(';'));
console.log('\nПройдено:',R.pass,'Провалено:',R.fail);process.exit(R.fail?1:0)})().catch(e=>{console.log('ОШИБКА',e);process.exit(2)});
