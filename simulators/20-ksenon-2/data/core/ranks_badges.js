/* КСЕНОН-2 · Ранги по XP и значки достижений
   Файл подключается тегом <script> из ksenon2_simulator.html (без сервера, работает при открытии с диска).
   Правьте значения, сохраняйте кодировку UTF-8. Не меняйте имена KX2.* */
window.KX2 = window.KX2 || {};

KX2.RANKS = [{n:'Стажёр',ic:'fa-id-badge',mn:0,mx:499},{n:'Оператор III',ic:'fa-angle-up',mn:500,mx:999},{n:'Оператор II',ic:'fa-angles-up',mn:1000,mx:1999},{n:'Оператор I',ic:'fa-shield-halved',mn:2000,mx:2999},{n:'Эксперт III',ic:'fa-microscope',mn:3000,mx:3999},{n:'Эксперт II',ic:'fa-user-shield',mn:4000,mx:5499},{n:'Старший эксперт',ic:'fa-star',mn:5500,mx:7999},{n:'Федеральный эксперт',ic:'fa-award',mn:8000,mx:Infinity}];

KX2.BADGES_DEF = [
  {id:'b01',ic:'fa-flag',nm:'Первый шаг',desc:'Выполните первое задание',c:s=>s.done>=1},
  {id:'b02',ic:'fa-clipboard-list',nm:'Регистратор',desc:'3 регистрации биоматериала',c:s=>s.entries>=3},
  {id:'b03',ic:'fa-barcode',nm:'Штрихкодист',desc:'5 штрихкодов присвоено',c:s=>s.barcodes>=5},
  {id:'b04',ic:'fa-dna',nm:'STR-специалист',desc:'STR-данные заполнены 3 раза',c:s=>s.strDone>=3},
  {id:'b05',ic:'fa-stopwatch',nm:'Быстрый оператор',desc:'Задание менее чем за 2 мин.',c:s=>s.fastM>=1},
  {id:'b06',ic:'fa-magnifying-glass',nm:'Детектив дублей',desc:'Обнаружен дублирующий УИН',c:s=>s.dups>=1},
  {id:'b07',ic:'fa-arrows-rotate',nm:'Синхронизатор',desc:'2 синхронизации выполнено',c:s=>s.syncs>=2},
  {id:'b08',ic:'fa-bullseye',nm:'Точность',desc:'5 заданий без ошибок',c:s=>s.perfect>=5},
  {id:'b09',ic:'fa-chart-line',nm:'Аналитик ДНК',desc:'3 сравнения профилей',c:s=>s.cmps>=3},
  {id:'b10',ic:'fa-star',nm:'500 XP',desc:'Набрать 500 очков опыта',c:s=>s.xp>=500},
  {id:'b11',ic:'fa-medal',nm:'1000 XP',desc:'Набрать 1000 очков опыта',c:s=>s.xp>=1000},
  {id:'b12',ic:'fa-link',nm:'Серийный след',desc:'Установлен серийный след',c:s=>s.serial>=1},
  {id:'b13',ic:'fa-shield-halved',nm:'ИБ-специалист',desc:'Найден инцидент безопасности',c:s=>s.secInc>=1},
  {id:'b14',ic:'fa-database',nm:'Хранитель данных',desc:'Резервное копирование выполнено',c:s=>s.backups>=1},
  {id:'b15',ic:'fa-certificate',nm:'Сертификат КСЕНОН-2',desc:'Завершить все задания своей роли',c:s=>S.mc.length>0&&s.done>=S.mc.length},
];
