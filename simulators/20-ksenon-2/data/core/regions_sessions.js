/* КСЕНОН-2 · Регионы (карта), сессии, пограничные случаи, данные прогноза
   Файл подключается тегом <script> из ksenon2_simulator.html (без сервера, работает при открытии с диска).
   Правьте значения, сохраняйте кодировку UTF-8. Не меняйте имена KX2.* */
window.KX2 = window.KX2 || {};

KX2.REGIONS_GEO = [
  {id:'MSK',nm:'Москва',lat:55.7558,lng:37.6173,pop:12500000,profiles:45,solved:18,serial:5},
  {id:'SPB',nm:'Санкт-Петербург',lat:59.9343,lng:30.3351,pop:5300000,profiles:38,solved:14,serial:3},
  {id:'EKB',nm:'Екатеринбург',lat:56.8356,lng:60.6122,pop:1500000,profiles:29,solved:11,serial:2},
  {id:'NSK',nm:'Новосибирск',lat:54.9885,lng:82.9207,pop:1600000,profiles:22,solved:8,serial:4},
  {id:'KZN',nm:'Казань',lat:55.7887,lng:49.1221,pop:1200000,profiles:18,solved:6,serial:2},
  {id:'RST',nm:'Ростов-на-Дону',lat:47.2357,lng:39.7015,pop:1100000,profiles:15,solved:7,serial:1},
  {id:'NNV',nm:'Нижний Новгород',lat:56.2965,lng:43.9361,pop:1200000,profiles:12,solved:4,serial:1},
  {id:'VRN',nm:'Воронеж',lat:51.6720,lng:39.1843,pop:1000000,profiles:10,solved:3,serial:0},
  {id:'UFA',nm:'Уфа',lat:54.7388,lng:55.9721,pop:1100000,profiles:8,solved:2,serial:1},
  {id:'PRM',nm:'Пермь',lat:58.0105,lng:56.2502,pop:1000000,profiles:7,solved:2,serial:0},
  {id:'SRT',nm:'Саратов',lat:51.5347,lng:46.0246,pop:840000,profiles:6,solved:2,serial:0},
  {id:'KRD',nm:'Краснодар',lat:45.0355,lng:38.9753,pop:900000,profiles:9,solved:3,serial:1},
];

KX2.SESSIONS = [
  {id:'SES-001',usr:'ivanov_as',ip:'10.88.12.45',geo:'Москва, ЭКЦ МВД',start:'28.01 09:15:23',last:'28.01 11:42:17',dur:'2ч 27мин',actions:47,status:'active',ua:'Chrome 120 / Win11',risk:'low'},
  {id:'SES-002',usr:'petrova_lv',ip:'10.92.8.17',geo:'Екатеринбург, ГУ МВД',start:'28.01 08:30:01',last:'28.01 10:15:44',dur:'1ч 45мин',actions:31,status:'active',ua:'Firefox 121 / Win10',risk:'low'},
  {id:'SES-003',usr:'kozlov_va',ip:'10.71.3.201',geo:'Ростов-на-Дону, ГУ МВД',start:'28.01 10:00:00',last:'28.01 11:38:55',dur:'1ч 39мин',actions:24,status:'active',ua:'Chrome 120 / Win11',risk:'low'},
  {id:'SES-004',usr:'sidorov_rp',ip:'185.220.101.42',geo:'Внешняя сеть (TOR?)',start:'28.01 09:35:00',last:'28.01 09:36:12',dur:'1мин 12сек',actions:3,status:'blocked',ua:'Unknown',risk:'critical'},
  {id:'SES-005',usr:'unknown',ip:'194.165.16.11',geo:'Иностранный IP (DE)',start:'28.01 10:22:45',last:'28.01 10:22:45',dur:'<1сек',actions:1,status:'blocked',ua:'Python/requests 2.28',risk:'critical'},
  {id:'SES-006',usr:'sorokina_ni',ip:'10.93.22.78',geo:'Санкт-Петербург, ГУ МВД',start:'28.01 09:50:00',last:'28.01 11:30:00',dur:'1ч 40мин',actions:19,status:'active',ua:'Edge 120 / Win11',risk:'low'},
  {id:'SES-007',usr:'admin_sys',ip:'127.0.0.1',geo:'Локальный сервер ЭКЦ',start:'28.01 02:00:00',last:'28.01 02:18:33',dur:'18мин 33сек',actions:8,status:'ended',ua:'Системный процесс',risk:'low'},
  {id:'SES-008',usr:'unknown_api',ip:'91.108.4.183',geo:'Иностранный IP (NL)',start:'28.01 11:12:30',last:'28.01 11:12:31',dur:'<1сек',actions:1,status:'blocked',ua:'curl/7.88.1',risk:'critical'},
];

KX2.EDGE_CASES = [
  {id:'EC-001',t:'Деградированный профиль',sev:'warn',desc:'Профиль ДНК-2024-005 содержит только 7/13 локусов. Биоматериал старше 14 суток.',action:'Снизить порог поиска до 5/13. Заключение с оговорками.',profile:'ДНК-2024-005',mission:'M28'},
  {id:'EC-002',t:'Дублирующий УИН',sev:'crit',desc:'Два профиля (ДНК-2024-001 и ДНК-2024-007) имеют идентичный штрихкод 460100001234.',action:'Устранить дубликат, переприсвоить УИН.',profile:'ДНК-2024-007',mission:'M04'},
  {id:'EC-003',t:'Подозрительная сессия TOR',sev:'crit',desc:'IP 185.220.101.42 — выходной узел TOR-сети. Попытка входа как sidorov_rp.',action:'Заблокировать аккаунт. Уведомить ИБ-отдел.',profile:null,mission:'M20'},
  {id:'EC-004',t:'API-запрос без авторизации',sev:'crit',desc:'Автоматический запрос от Python/requests к защищённому эндпоинту /api/profiles.',action:'Заблокировать IP. Зафиксировать инцидент.',profile:null,mission:'M19'},
  {id:'EC-005',t:'Узел офлайн с накопленной очередью',sev:'warn',desc:'Екатеринбург недоступен >2 часов, в очереди 7 необработанных запросов.',action:'Переключить запросы на резервный узел Перми.',profile:null,mission:'M22'},
  {id:'EC-006',t:'Смешанный биоматериал',sev:'warn',desc:'Профиль ДНК-2024-006: обнаружены аллели трёх вариантов в локусе vWA — возможная контаминация.',action:'Повторный забор и типирование. Отметить флагом.',profile:'ДНК-2024-006',mission:'M12'},
  {id:'EC-007',t:'Межделовая серийная связь',sev:'warn',desc:'ДНК-2024-001 (УД-2024-0047) и ДНК-2024-004 (УД-2024-0089) — 9/13 совпадающих локусов в разных делах.',action:'Установить серийный след. Уведомить следователей обоих дел.',profile:'ДНК-2024-004',mission:'M27'},
  {id:'EC-008',t:'Иностранный IP в журнале',sev:'crit',desc:'IP 91.108.4.183 (Нидерланды) совершил curl-запрос к /api/v2/search без токена.',action:'Блокировать на уровне МСЭ. Доложить БСТМ МВД.',profile:null,mission:'M29'},
];

KX2.FORECAST_DATA = {
  months: ['Фев','Мар','Апр','Май','Июн','Июл'],
  reg_pred: [81,88,79,95,102,89],
  found_pred: [25,28,22,31,33,27],
  serial_pred: [7,8,6,9,11,8],
  confidence: [0.88,0.82,0.79,0.73,0.68,0.62],
};
