/* Льготная оплата штрафа (ст. 32.2 КоАП). Единая настройка для всего симулятора.
   Исходная редакция курса: {pct:50,days:20}. По данным ряда изданий с 01.01.2025 для большинства
   нарушений ПДД: {pct:25,days:30} — сверьте с действующей редакцией КоАП и при необходимости переключите. */
/* Подложка карты камер (Leaflet). Нужен интернет; без него автоматически включается схема. Условия использования плиток OSM:
   https://operations.osmfoundation.org/policies/tiles/ — для интенсивной нагрузки подставьте своего провайдера. */
const CAFAP_MAP={tileUrl:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',center:[55.7522,37.6156],zoom:10};

const CAFAP_DISCOUNT={pct:50,days:20};
/* ============================================================
   ЦАФАП SPA — UNIFIED JAVASCRIPT
   ============================================================ */

const SPA_STAGE_NAMES={"1": "Дашборд", "2": "Нарушения/OCR", "3": "Постановления", "4": "Почта/ФССП", "5": "Аналитика", "6": "Администрирование"};
const SPA_DESCS={"1": "Авторизация и главный дашборд", "2": "OCR-верификация и обработка нарушений", "3": "Постановления, ЭЦП, апелляции", "4": "Почта, оплата, ФССП", "5": "Аналитика, мониторинг, розыск", "6": "Администрирование, аудит, сертификация"};
const SPA_QSTEPS={
  1:[
    {title:'Авторизация в системе',text:'Выберите роль <strong>«Оператор ЦАФАП»</strong> и регион, нажмите «Войти в систему».'},
    {title:'Изучение дашборда',text:'Ознакомьтесь с 5 ключевыми показателями и нажмите «Далее».'},
    {title:'Проверка камер',text:'Откройте <strong>«Камеры ФВФ»</strong> в боковом меню.'},
    {title:'Журнал аудита',text:'Найдите запись со статусом «Отказано».'},
    {title:'Очередь нарушений',text:'Нажмите кнопку 👁 на любом деле.'},
    {title:'Поиск дела',text:'Нажмите «Поиск дела» и введите данные.'},
    {title:'Запрос ФИС',text:'Нажмите «Запрос ФИС ГИБДД-М» в быстрых действиях.'},
    {title:'Уведомления',text:'Изучите 3 активных уведомления в правой панели.'},
    {title:'Статус подсистем',text:'Найдите подсистему со статусом «ЗАДЕРЖКА».'},
    {title:'Лента активности',text:'Изучите ленту событий справа.'},
    {title:'Фильтрация',text:'Примените фильтр «Превышение скорости» в таблице.'},
    {title:'Этап 2',text:'Перейдите к <strong>Этапу 2</strong> через кнопку в шапке.'},
  ],
  2:[
    {title:'Выбор нарушения',text:'Нажмите на первое нарушение в очереди OCR.'},
    {title:'Подтверждение г/н',text:'Проверьте номер и нажмите <strong>«Подтвердить номер»</strong>.'},
    {title:'Отклонение',text:'Нажмите <strong>«Отклонить»</strong> для некачественного материала.'},
    {title:'Поиск владельца',text:'Нажмите <strong>«Найти владельца в РЭО ГИБДД»</strong>.'},
    {title:'ЛВОК',text:'Откройте форму <strong>ЛВОК</strong> и проверьте персданные.'},
    {title:'Создание дела',text:'Нажмите <strong>«Создать административное дело»</strong>.'},
    {title:'Форма дела',text:'Проверьте статью КоАП и адрес доставки.'},
    {title:'Доказательства',text:'Откройте раздел <strong>«Доказательства»</strong>.'},
    {title:'Передача',text:'Нажмите <strong>«Передать инспектору»</strong>.'},
    {title:'Очередь',text:'Откройте полную очередь и используйте фильтры.'},
    {title:'Ошибка OCR',text:'Найдите дело со статусом «Ошибка OCR».'},
    {title:'Этап 3',text:'Перейдите к <strong>Этапу 3: Постановления</strong>.'},
  ],
  3:[
    {title:'Очередь ЭЦП',text:'Выберите первое постановление из очереди.'},
    {title:'Отклонение',text:'Нажмите «Отклонить» для возврата оператору.'},
    {title:'Подписание',text:'Нажмите <strong>«Подписать ЭЦП»</strong> и наблюдайте анимацию.'},
    {title:'Массовое',text:'Нажмите <strong>«Все»</strong> для массового подписания.'},
    {title:'Печать',text:'Нажмите «Печать» постановления.'},
    {title:'Реестр',text:'Откройте раздел <strong>«Постановления»</strong>.'},
    {title:'Практика',text:'Откройте <strong>«Административная практика»</strong>.'},
    {title:'Апелляция',text:'Нажмите «Рассмотреть» на любой апелляции.'},
    {title:'Решение',text:'Вынесите решение по апелляции.'},
    {title:'Архив',text:'Откройте «Архив» и верифицируйте подпись.'},
    {title:'Просмотр',text:'Нажмите 👁 на любом постановлении.'},
    {title:'Этап 4',text:'Перейдите к <strong>Этапу 4</strong>.'},
  ],
  4:[
    {title:'Просмотр письма',text:'Нажмите 👁 для просмотра любого письма.'},
    {title:'Реквизиты',text:'Изучите барштрих-код, трек-номер и адрес.'},
    {title:'Отправка одного',text:'Нажмите «Отправить» для одного письма.'},
    {title:'Партионная',text:'Нажмите <strong>«Отправить партию»</strong>.'},
    {title:'РТМ реестр',text:'Нажмите <strong>«Реестр РТМ»</strong>.'},
    {title:'Печать',text:'Запустите печать всей очереди.'},
    {title:'Отслеживание',text:'Введите трек-номер и отследите письмо.'},
    {title:'Возвращённые',text:'Обработайте возвращённые письма.'},
    {title:'ГИС ГМП',text:'Нажмите <strong>«Синхр. ГИС ГМП»</strong>.'},
    {title:'Ст.20.25',text:'Создайте протокол по ст.20.25 КоАП.'},
    {title:'ФССП',text:'Передайте дела в ФССП.'},
    {title:'Этап 5',text:'Перейдите к <strong>Этапу 5: Аналитика</strong>.'},
  ],
  5:[
    {title:'Аналитика',text:'Изучите графики в Аналитическом центре.'},
    {title:'Экспорт',text:'Нажмите <strong>«Экспорт»</strong> аналитики.'},
    {title:'Отчёты',text:'Скачайте любой готовый отчёт.'},
    {title:'Тепловая карта',text:'Определите пик нарушений.'},
    {title:'KPI',text:'Найдите оператора с наилучшим KPI.'},
    {title:'Мониторинг',text:'Найдите подсистему со статусом «МЕДЛЕННО».'},
    {title:'Топология',text:'Нажмите на блок «ЦОД ЦАФАП».'},
    {title:'Карта камер',text:'Найдите offline-камеры на карте.'},
    {title:'Инциденты',text:'Нажмите на критический инцидент.'},
    {title:'Розыск',text:'Найдите А177МС77 в реестре розыска.'},
    {title:'ФБД МВД',text:'Нажмите «Синхр. с ФБД МВД».'},
    {title:'Этап 6',text:'Перейдите к <strong>Этапу 6: Администрирование</strong>.'},
  ],
  6:[
    {title:'Пользователи',text:'Нажмите ✏ для редактирования пользователя.'},
    {title:'Создание',text:'Нажмите «Создать пользователя».'},
    {title:'Права',text:'Измените право в матрице ролей.'},
    {title:'Регионы',text:'Нажмите на карточку региона.'},
    {title:'НСИ',text:'Нажмите «Синхр. с МВД».'},
    {title:'Аудит',text:'Найдите записи с результатом «Отказано».'},
    {title:'Настройки',text:'Измените порог OCR и сохраните.'},
    {title:'Бэкап',text:'Запустите резервное копирование.'},
    {title:'Интеграции',text:'Протестируйте любое соединение.'},
    {title:'Тест',text:'Ответьте на все вопросы теста.'},
    {title:'Сертификат',text:'Скачайте именной сертификат.'},
    {title:'Финал! 🏆',text:'Поздравляем! Курс ЦАФАП завершён!'},
  ],
};
const SPA_HINTS={
  1:[
    {t:'Что такое ЦАФАП?',txt:'Центр автоматизированной фиксации — подразделение ГИБДД МВД России, обрабатывающее данные с дорожных камер ФВФ.'},
    {t:'Жизненный цикл',txt:'Камера → OCR → Верификация → Постановление → ЭЦП → Почта → Оплата → ФССП → Архив.'},
    {t:'Роли',txt:'Оператор — без персданных. Инспектор — полный доступ. Администратор — управление.'},
    {t:'КоАП',txt:'12.9 — скорость. 12.12 — красный. 12.17 — выделенная полоса. 20.25 — неуплата.'},
  ],
  2:[
    {t:'OCR уверенность',txt:'≥85% — авто. 65-84% — ручная проверка. <65% — высокий риск ошибки.'},
    {t:'ЛВОК',txt:'Локальная ведомственная объектная карта — форма корректировки персональных данных.'},
    {t:'РЭО ГИБДД',txt:'Регистрационно-экзаменационный отдел — база владельцев ТС.'},
    {t:'Доказательства',txt:'Фото + видео + радар + сертификат ФВФ = полная доказательная база.'},
  ],
  3:[
    {t:'ЭЦП в ЦАФАП',txt:'После подписания документ юридически значим и неизменяем.'},
    {t:'ГОСТ Р 34.10-2012',txt:'Российский стандарт алгоритма электронной цифровой подписи.'},
    {t:'Апелляции',txt:'Подаётся в 10 суток. Рассматривается 10 суток. Удовлетворение = прекращение дела.'},
    {t:'SHA-256',txt:'Криптографический отпечаток документа для проверки целостности.'},
  ],
  4:[
    {t:'РТМ 0003.05-10',txt:'Стандарт партионной почты России для взаимодействия с Почтой России.'},
    {t:'Срок оплаты',txt:'60 суток. Первые '+CAFAP_DISCOUNT.days+' суток — скидка '+CAFAP_DISCOUNT.pct+'%. После 60 суток — ст.20.25 КоАП.'},
    {t:'ГИС ГМП',txt:'Государственная информационная система о платежах — автоматически фиксирует оплаты.'},
    {t:'ФССП',txt:'Передача через 70 суток (60+10) при неуплате. Ст.32.2 КоАП РФ.'},
  ],
  5:[
    {t:'Аналитика',txt:'Формирует отчётность для УГИБДД МВД и федеральных докладов.'},
    {t:'Тепловая карта',txt:'Паттерны нарушений для оптимизации расстановки ДПС и мест установки камер.'},
    {t:'Мониторинг',txt:'SLA: доступность 99.95% в месяц. Failover — автоматически.'},
    {t:'Розыск ТС',txt:'Интегрирован с ФБД МВД. Каждое нарушение проверяется на розыск.'},
  ],
  6:[
    {t:'Принцип привилегий',txt:'Каждый пользователь имеет только необходимые права.'},
    {t:'Аудит',txt:'Журнал аудита защищён хеш-цепочкой. Изменение записи будет обнаружено.'},
    {t:'Правило 3-2-1',txt:'3 копии, 2 носителя, 1 копия в другом месте.'},
    {t:'НСИ',txt:'Любое изменение НСИ версионируется с датой, временем и пользователем.'},
  ],
};
const SPA_GLOSSARY=[{t:'ЦАФАП',d:'Центр автоматизированной фиксации АПН'},{t:'OCR',d:'Авторасп. госномеров'},{t:'ЭЦП',d:'Электронная цифровая подпись'},{t:'ФИС ГИБДД-М',d:'Федеральная ИС ГИБДД'},{t:'РЭО ГИБДД',d:'Регистрационно-экзаменационный отдел'},{t:'ЛВОК',d:'Локальная вед. объектная карта'},{t:'ФССП',d:'Федеральная служба судебных приставов'},{t:'КоАП',d:'Кодекс об адм. правонарушениях'},{t:'ГИС ГМП',d:'ГИС о государственных платежах'},{t:'РТМ 0003.05-10',d:'Стандарт партионной почты'},{t:'УИН',d:'Уникальный идентификатор начисления'},{t:'НСИ',d:'Нормативно-справочная информация'},{t:'СМЭВ',d:'Система межвед. электронного взаимодействия'},{t:'SHA-256',d:'Алгоритм хеширования'},];
const STAGE_SIDEBAR_HTML={
  1:`<div class="sb-section"><div class="sb-title">Рабочий стол</div>
<div class="nav-item active" id="nav-dashboard" onclick="s1_setSection(\'dashboard\',this)"><span class="nav-ico"><i class="fas fa-tachometer-alt"></i></span>Дашборд</div>
<div class="nav-item" id="nav-queue" onclick="s1_setSection(\'queue\',this)"><span class="nav-ico"><i class="fas fa-inbox"></i></span>Очередь нарушений<span class="nav-badge nb-red">24</span></div>
<div class="nav-item" id="nav-cameras" onclick="s1_setSection(\'cameras\',this)"><span class="nav-ico"><i class="fas fa-video"></i></span>Камеры ФВФ<span class="nav-badge nb-orange">2</span></div>
<div class="nav-item" id="nav-audit" onclick="s1_setSection(\'audit\',this)"><span class="nav-ico"><i class="fas fa-history"></i></span>Журнал аудита</div>
</div><div class="sb-section"><div class="sb-title">Следующие этапы</div>
<div class="nav-item" onclick="switchStage(2)"><span class="nav-ico"><i class="fas fa-arrow-right"></i></span>Этап 2: Нарушения</div>
<div class="nav-item" onclick="switchStage(3)"><span class="nav-ico"><i class="fas fa-arrow-right"></i></span>Этап 3: Постановления</div>
<div class="nav-item" onclick="switchStage(4)"><span class="nav-ico"><i class="fas fa-arrow-right"></i></span>Этап 4: Почта/ФССП</div>
<div class="nav-item" onclick="switchStage(5)"><span class="nav-ico"><i class="fas fa-arrow-right"></i></span>Этап 5: Аналитика</div>
<div class="nav-item" onclick="switchStage(6)"><span class="nav-ico"><i class="fas fa-arrow-right"></i></span>Этап 6: Администр.</div>
</div>`,
  2:`<div class="sb-section"><div class="sb-title">Этап 2: Обработка</div>
<div class="nav-item active" id="nav-ocr" onclick="s2_setSection(\'ocr\',this)"><span class="nav-ico"><i class="fas fa-camera"></i></span>OCR-верификация<span class="nav-badge nb-orange">7</span></div>
<div class="nav-item" id="nav-queue" onclick="s2_setSection(\'queue\',this)"><span class="nav-ico"><i class="fas fa-inbox"></i></span>Очередь<span class="nav-badge nb-red">24</span></div>
<div class="nav-item" id="nav-owner" onclick="s2_setSection(\'owner\',this)"><span class="nav-ico"><i class="fas fa-user-search"></i></span>Поиск владельца</div>
<div class="nav-item" id="nav-case" onclick="s2_setSection(\'case\',this)"><span class="nav-ico"><i class="fas fa-folder-open"></i></span>Формирование дела</div>
<div class="nav-item" id="nav-evidence" onclick="s2_setSection(\'evidence\',this)"><span class="nav-ico"><i class="fas fa-images"></i></span>Доказательства</div>
</div><div class="sb-section"><div class="sb-title">Навигация</div>
<div class="nav-item" onclick="switchStage(1)"><span class="nav-ico"><i class="fas fa-arrow-left"></i></span>← Этап 1</div>
<div class="nav-item" onclick="switchStage(3)"><span class="nav-ico"><i class="fas fa-arrow-right"></i></span>Этап 3 →</div>
</div>`,
  3:`<div class="sb-section"><div class="sb-title">Этап 3: Постановления</div>
<div class="nav-item active" id="nav-sign" onclick="s3_setSection(\'sign\',this)"><span class="nav-ico"><i class="fas fa-signature"></i></span>Подписание ЭЦП<span class="nav-badge nb-red">23</span></div>
<div class="nav-item" id="nav-decisions" onclick="s3_setSection(\'decisions\',this)"><span class="nav-ico"><i class="fas fa-file-alt"></i></span>Постановления<span class="nav-badge nb-blue">187</span></div>
<div class="nav-item" id="nav-admin" onclick="s3_setSection(\'admin\',this)"><span class="nav-ico"><i class="fas fa-gavel"></i></span>Адм. практика</div>
<div class="nav-item" id="nav-appeals" onclick="s3_setSection(\'appeals\',this)"><span class="nav-ico"><i class="fas fa-balance-scale"></i></span>Апелляции<span class="nav-badge nb-orange">4</span></div>
<div class="nav-item" id="nav-archive" onclick="s3_setSection(\'archive\',this)"><span class="nav-ico"><i class="fas fa-archive"></i></span>Архив</div>
</div><div class="sb-section"><div class="sb-title">Навигация</div>
<div class="nav-item" onclick="switchStage(2)"><span class="nav-ico"><i class="fas fa-arrow-left"></i></span>← Этап 2</div>
<div class="nav-item" onclick="switchStage(4)"><span class="nav-ico"><i class="fas fa-arrow-right"></i></span>Этап 4 →</div>
</div>`,
  4:`<div class="sb-section"><div class="sb-title">Этап 4: Исполнение</div>
<div class="nav-item active" id="nav-mail" onclick="s4_setSection(\'mail\',this)"><span class="nav-ico"><i class="fas fa-envelope-open-text"></i></span>Почтовая отправка<span class="nav-badge nb-blue">31</span></div>
<div class="nav-item" id="nav-print" onclick="s4_setSection(\'print\',this)"><span class="nav-ico"><i class="fas fa-print"></i></span>Очередь печати<span class="nav-badge nb-orange">12</span></div>
<div class="nav-item" id="nav-track" onclick="s4_setSection(\'track\',this)"><span class="nav-ico"><i class="fas fa-map-marker-alt"></i></span>Отслеживание</div>
<div class="nav-item" id="nav-returned" onclick="s4_setSection(\'returned\',this)"><span class="nav-ico"><i class="fas fa-undo-alt"></i></span>Возвращённые<span class="nav-badge nb-orange">5</span></div>
<div class="nav-item" id="nav-pay" onclick="s4_setSection(\'pay\',this)"><span class="nav-ico"><i class="fas fa-ruble-sign"></i></span>Контроль оплаты<span class="nav-badge nb-red">63</span></div>
<div class="nav-item" id="nav-art2025" onclick="s4_setSection(\'art2025\',this)"><span class="nav-ico"><i class="fas fa-exclamation-triangle"></i></span>Ст. 20.25 КоАП<span class="nav-badge nb-red">8</span></div>
<div class="nav-item" id="nav-treasury" onclick="s4_setSection(\'treasury\',this)"><span class="nav-ico"><i class="fas fa-landmark"></i></span>ГИС ГМП</div>
<div class="nav-item" id="nav-fssp" onclick="s4_setSection(\'fssp\',this)"><span class="nav-ico"><i class="fas fa-university"></i></span>ФССП<span class="nav-badge nb-purple">3</span></div>
<div class="nav-item" id="nav-enforce" onclick="s4_setSection(\'enforce\',this)"><span class="nav-ico"><i class="fas fa-gavel"></i></span>Исп. производство</div>
</div><div class="sb-section"><div class="sb-title">Навигация</div>
<div class="nav-item" onclick="switchStage(3)"><span class="nav-ico"><i class="fas fa-arrow-left"></i></span>← Этап 3</div>
<div class="nav-item" onclick="switchStage(5)"><span class="nav-ico"><i class="fas fa-arrow-right"></i></span>Этап 5 →</div>
</div>`,
  5:`<div class="sb-section"><div class="sb-title">Этап 5: Аналитика</div>
<div class="nav-item active" id="nav-analytics" onclick="s5_setSection(\'analytics\',this)"><span class="nav-ico"><i class="fas fa-chart-bar"></i></span>Аналитика</div>
<div class="nav-item" id="nav-reports" onclick="s5_setSection(\'reports\',this)"><span class="nav-ico"><i class="fas fa-file-chart-line"></i></span>Отчёты</div>
<div class="nav-item" id="nav-heatmap" onclick="s5_setSection(\'heatmap\',this)"><span class="nav-ico"><i class="fas fa-fire"></i></span>Тепловая карта</div>
<div class="nav-item" id="nav-kpi" onclick="s5_setSection(\'kpi\',this)"><span class="nav-ico"><i class="fas fa-tachometer-alt"></i></span>KPI операторов</div>
<div class="nav-item" id="nav-monitor" onclick="s5_setSection(\'monitor\',this)"><span class="nav-ico"><i class="fas fa-desktop"></i></span>Мониторинг</div>
<div class="nav-item" id="nav-infra" onclick="s5_setSection(\'infra\',this)"><span class="nav-ico"><i class="fas fa-network-wired"></i></span>Топология сети</div>
<div class="nav-item" id="nav-cameras" onclick="s5_setSection(\'cameras\',this)"><span class="nav-ico"><i class="fas fa-video"></i></span>Карта камер<span class="nav-badge nb-red">2</span></div>
<div class="nav-item" id="nav-incidents" onclick="s5_setSection(\'incidents\',this)"><span class="nav-ico"><i class="fas fa-exclamation-triangle"></i></span>Инциденты</div>
<div class="nav-item" id="nav-wanted" onclick="s5_setSection(\'wanted\',this)"><span class="nav-ico"><i class="fas fa-search"></i></span>Розыск ТС<span class="nav-badge nb-red">14</span></div>
<div class="nav-item" id="nav-duplicates" onclick="s5_setSection(\'duplicates\',this)"><span class="nav-ico"><i class="fas fa-clone"></i></span>Дубли г/н</div>
</div><div class="sb-section"><div class="sb-title">Навигация</div>
<div class="nav-item" onclick="switchStage(4)"><span class="nav-ico"><i class="fas fa-arrow-left"></i></span>← Этап 4</div>
<div class="nav-item" onclick="switchStage(6)"><span class="nav-ico"><i class="fas fa-arrow-right"></i></span>Этап 6 →</div>
</div>`,
  6:`<div class="sb-section"><div class="sb-title">Этап 6: Администрирование</div>
<div class="nav-item active" id="nav-users" onclick="s6_setSection(\'users\',this)"><span class="nav-ico"><i class="fas fa-users-cog"></i></span>Пользователи<span class="nav-badge nb-blue">38</span></div>
<div class="nav-item" id="nav-roles" onclick="s6_setSection(\'roles\',this)"><span class="nav-ico"><i class="fas fa-shield-alt"></i></span>Роли и права</div>
<div class="nav-item" id="nav-regions" onclick="s6_setSection(\'regions\',this)"><span class="nav-ico"><i class="fas fa-map"></i></span>Регионы</div>
<div class="nav-item" id="nav-nsi" onclick="s6_setSection(\'nsi\',this)"><span class="nav-ico"><i class="fas fa-book"></i></span>НСИ</div>
<div class="nav-item" id="nav-audit" onclick="s6_setSection(\'audit\',this)"><span class="nav-ico"><i class="fas fa-history"></i></span>Журнал аудита</div>
<div class="nav-item" id="nav-settings" onclick="s6_setSection(\'settings\',this)"><span class="nav-ico"><i class="fas fa-cog"></i></span>Настройки</div>
<div class="nav-item" id="nav-backup" onclick="s6_setSection(\'backup\',this)"><span class="nav-ico"><i class="fas fa-database"></i></span>Резервное копирование</div>
<div class="nav-item" id="nav-integration" onclick="s6_setSection(\'integration\',this)"><span class="nav-ico"><i class="fas fa-plug"></i></span>Интеграции</div>
<div class="nav-item" id="nav-quiz" onclick="s6_setSection(\'quiz\',this)"><span class="nav-ico"><i class="fas fa-question-circle"></i></span>Тест знаний<span class="nav-badge nb-green">!</span></div>
<div class="nav-item" id="nav-cert" onclick="s6_setSection(\'cert\',this)"><span class="nav-ico"><i class="fas fa-certificate"></i></span>Сертификация<span class="nav-badge nb-green">★</span></div>
</div><div class="sb-section"><div class="sb-title">Навигация</div>
<div class="nav-item" onclick="switchStage(5)"><span class="nav-ico"><i class="fas fa-arrow-left"></i></span>← Этап 5</div>
<div class="nav-item" onclick="switchStage(1)"><span class="nav-ico"><i class="fas fa-home"></i></span>↩ Дашборд</div>
</div>`,
};

/* ---- SPA STATE ---- */
const SPA_STATE={
  currentStage:1,
  cadet:{fio:'',platoon:''},
  session:{role:'operator',login:'ivanov_op',regionName:'77 — г. Москва',startTime:new Date()},
  instTab:'mission',instCollapsed:false,
  quest:{1:{done:[],step:0,total:12},2:{done:[],step:0,total:12},3:{done:[],step:0,total:12},
         4:{done:[],step:0,total:12},5:{done:[],step:0,total:12},6:{done:[],step:0,total:12}}
};

/* ============================================================
   ЖУРНАЛИРОВАНИЕ ДЕЙСТВИЙ КУРСАНТА (ACTION LOG)
   Собирает сквозной журнал событий по всему тренажёру для
   последующей выгрузки в JSON и разбора на платформе проверки.
   ============================================================ */
const LOG_SESSION_ID='sess_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
const ACTION_LOG=[];
const STAGE_TIME_MS={1:0,2:0,3:0,4:0,5:0,6:0};
let _simStartedAt=null;
let _stageTimerMark=null;

function logEvent(type,detail){
  try{
    ACTION_LOG.push({
      seq:ACTION_LOG.length+1,
      ts:new Date().toISOString(),
      stage:SPA_STATE.currentStage,
      type:type,
      detail:detail||{}
    });
  }catch(e){/* журналирование не должно ломать симулятор */}
}

/* Переносит накопленное время в STAGE_TIME_MS перед сменой этапа
   и перезапускает отсчёт для нового текущего этапа. */
function _flushStageTime(){
  const now=Date.now();
  if(_stageTimerMark!=null){
    const n=SPA_STATE.currentStage;
    STAGE_TIME_MS[n]=(STAGE_TIME_MS[n]||0)+(now-_stageTimerMark);
  }
  _stageTimerMark=now;
}

/* Глобальный перехватчик кликов: логирует взаимодействие курсанта
   с любым элементом интерфейса на любом этапе, без необходимости
   дорабатывать каждый обработчик по отдельности. */
document.addEventListener('click',function(e){
  const el=e.target.closest('[onclick]');
  if(el){
    const raw=el.getAttribute('onclick')||'';
    const m=raw.match(/^\s*([a-zA-Z0-9_]+)\(/);
    logEvent('ui_click',{
      fn:m?m[1]:null,
      text:(el.textContent||'').trim().slice(0,60),
      tag:el.tagName
    });
  }
},true);

/* Сборка и скачивание итогового отчёта в формате JSON для
   платформы проверки курсантских работ. */
function downloadReport(){
  _flushStageTime();
  const cadet=SPA_STATE.cadet||{fio:'',platoon:''};
  if(!cadet.fio||!cadet.platoon){
    spa_toast('Отчёт недоступен: не указаны ФИО и взвод курсанта. Авторизуйтесь заново.','error');
    return;
  }
  const startedAt=_simStartedAt||SPA_STATE.session.startTime||new Date();
  const endedAt=new Date();
  const durationSeconds=Math.round((endedAt-new Date(startedAt))/1000);

  // Прогресс по квестам восстанавливается из уже накопленного журнала —
  // не требует доступа к приватным переменным каждого этапа.
  const questProgress={};
  for(let n=1;n<=6;n++) questProgress[n]={completedSteps:[],totalSteps:null};
  ACTION_LOG.filter(e=>e.type==='quest_step').forEach(e=>{
    const n=e.stage;
    if(!questProgress[n])questProgress[n]={completedSteps:[],totalSteps:null};
    if(!questProgress[n].completedSteps.includes(e.detail.step)){
      questProgress[n].completedSteps.push(e.detail.step);
    }
    if(e.detail.total)questProgress[n].totalSteps=e.detail.total;
  });
  for(const n in questProgress){
    questProgress[n].completedSteps.sort((a,b)=>a-b);
    questProgress[n].completedCount=questProgress[n].completedSteps.length;
  }

  const notifications=ACTION_LOG.filter(e=>e.type==='notification');
  const summary={
    totalEvents:ACTION_LOG.length,
    totalClicks:ACTION_LOG.filter(e=>e.type==='ui_click').length,
    totalStageSwitches:ACTION_LOG.filter(e=>e.type==='stage_switch').length,
    totalQuestSteps:ACTION_LOG.filter(e=>e.type==='quest_step').length,
    notifications:{
      total:notifications.length,
      success:notifications.filter(e=>e.detail.level==='success').length,
      error:notifications.filter(e=>e.detail.level==='error').length,
      warning:notifications.filter(e=>e.detail.level==='warning').length,
      info:notifications.filter(e=>e.detail.level==='info').length
    },
    stagesVisited:[...new Set(ACTION_LOG.map(e=>e.stage))].sort((a,b)=>a-b)
  };

  const _IT=window.IdentityToken;
  const report={
    reportVersion:'1.0',
    system:'CAFAP_SIMULATOR',
    generatedAt:endedAt.toISOString(),
    token:(_IT&&_IT.getRawToken())||null,
    renderSeq:(_IT&&_IT.getSeal('a'))||null,
    uiInstance:(_IT&&_IT.getBrowserTag())||null,
    cadet:{fio:cadet.fio,platoon:cadet.platoon,loginAt:new Date(startedAt).toISOString(),syncTag:(_IT&&_IT.getSeal('b'))||null},
    meta:{
      sessionId:LOG_SESSION_ID,
      simulator:'ЦАФАП — Симулятор оператора/инспектора',
      cadet:{fio:cadet.fio,platoon:cadet.platoon,syncTag:(_IT&&_IT.getSeal('b'))||null},
      operatorProfile:{
        role:SPA_STATE.session.roleName||SPA_STATE.session.role,
        login:SPA_STATE.session.login,
        region:SPA_STATE.session.regionName||SPA_STATE.session.region
      },
      startTime:new Date(startedAt).toISOString(),
      endTime:endedAt.toISOString(),
      durationSeconds:durationSeconds
    },
    stageTimeSeconds:{
      1:Math.round((STAGE_TIME_MS[1]||0)/1000),
      2:Math.round((STAGE_TIME_MS[2]||0)/1000),
      3:Math.round((STAGE_TIME_MS[3]||0)/1000),
      4:Math.round((STAGE_TIME_MS[4]||0)/1000),
      5:Math.round((STAGE_TIME_MS[5]||0)/1000),
      6:Math.round((STAGE_TIME_MS[6]||0)/1000)
    },
    questProgress:questProgress,
    summary:summary,
    events:ACTION_LOG
  };

  const blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const fname='cafap_report_'+(cadet.platoon||'vzvod')+'_'+(cadet.fio||'cadet').replace(/\s+/g,'_')+'_'+LOG_SESSION_ID+'.json';
  a.href=url;a.download=fname;
  document.body.appendChild(a);a.click();
  setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},250);
  logEvent('report_generated',{filename:fname});
  spa_toast('Отчёт сформирован и скачан: '+fname,'success');
}

/* ---- SCREEN HELPER ---- */
function showScreen(id){
  ['loginScreen','initScreen','spaApp'].forEach(s=>{
    const el=document.getElementById(s);
    if(!el)return;
    if(s===id){el.style.display='';el.classList.remove('hidden');}
    else{el.style.display='none';el.classList.add('hidden');}
  });
}
/* Safe element setter helper */
function setEl(id, prop, val) {
  const el = document.getElementById(id);
  if (el) el[prop] = val;
}


/* ---- AUTH ---- */
const REGIONS_MAP={'77':'77 — г. Москва','50':'50 — Московская обл.','78':'78 — г. Санкт-Петербург',
  '23':'23 — Краснодарский край','16':'16 — Татарстан','63':'63 — Самарская обл.'};
const ROLE_NAMES_MAP={operator:'Оператор ЦАФАП',inspector:'Инспектор ЦАФАП',senior:'Старший инспектор',
  reg_admin:'Рег. Администратор',fed_admin:'Фед. Администратор',analyst:'Аналитик',postal:'Специалист почты'};
function onRoleChange(){
  const r=document.getElementById('roleSelect')?.value||'';
  const hints={operator:'🔵 Оператор: OCR без персданных',inspector:'🟡 Инспектор: полный доступ+ЭЦП',
    analyst:'🟢 Аналитик: только чтение',reg_admin:'🔴 Рег. Администратор',fed_admin:'🔴 Фед. Администратор'};
  const h=document.getElementById('loginHint');if(h)h.textContent=hints[r]||'';
}
function doLogin(){
  const cadetFio=(window.IdentityToken&&IdentityToken.getName())||(document.getElementById('cadetFio')?.value.trim().replace(/\s+/g,' ')||'');
  const cadetPlatoon=document.getElementById('cadetPlatoon')?.value.trim()||'';
  const role=document.getElementById('roleSelect')?.value||'operator';
  const reg=document.getElementById('regSelect')?.value||'77';
  if(!cadetFio||!cadetPlatoon){spa_toast('Укажите ФИО и номер взвода курсанта','error');return;}
  /* Отдельные логин и пароль не нужны: курсант идентифицируется по ФИО и номеру взвода (или токену) */
  const login='cadet_'+cadetPlatoon.replace(/[^0-9A-Za-zА-Яа-я]/g,'');
  SPA_STATE.cadet={fio:cadetFio,platoon:cadetPlatoon};
  SPA_STATE.session={role,roleName:ROLE_NAMES_MAP[role]||'Оператор',
    region:reg,regionName:REGIONS_MAP[reg]||reg,login,startTime:new Date()};
  _simStartedAt=SPA_STATE.session.startTime;
  try{localStorage.setItem('cafap_s',JSON.stringify({session:SPA_STATE.session,cadet:SPA_STATE.cadet}));}catch(e){}
  logEvent('login',{cadet:SPA_STATE.cadet,operator:{role,login,region:reg},tokenUsed:!!(window.IdentityToken&&IdentityToken.isPresent()),tokenExpired:!!(window.IdentityToken&&IdentityToken.isExpired())});
  showScreen('initScreen');
  runInit();
}
function runInit(){
  const bar=document.getElementById('initBar');
  const status=document.getElementById('initStatus');
  const steps=[{p:15,m:'Проверка сертификата ЭЦП...'},{p:32,m:'Подключение к ФИС ГИБДД-М...'},
    {p:52,m:'Загрузка очереди нарушений...'},{p:68,m:'Синхронизация НСИ...'},
    {p:84,m:'Запуск мониторинга камер...'},{p:97,m:'Загрузка профиля доступа...'}];
  let i=0;
  function next(){
    if(i>=steps.length){
      if(bar)bar.style.width='100%';
      if(status)status.textContent='✓ Готово. Добро пожаловать!';
      setTimeout(()=>{showScreen('spaApp');initSPAApp();},700);return;
    }
    if(bar)bar.style.width=steps[i].p+'%';
    if(status)status.textContent=steps[i].m;
    i++;setTimeout(next,450+Math.random()*300);
  }
  setTimeout(next,200);
}
function initSPAApp(){
  const se=SPA_STATE.session;
  const fp=(SPA_STATE.cadet.fio||'').trim().split(/\s+/);
  const uname=(fp[0]||'Курсант')+(fp[1]?' '+fp[1][0]+'.':'')+(fp[2]?fp[2][0]+'.':'');
  const el=document.getElementById('hdrName');if(el)el.textContent=uname;
  const av=document.getElementById('hdrAvatar');if(av)av.textContent=((fp[0]||'К')[0]+(fp[1]||'У')[0]).toUpperCase();
  const rg=document.getElementById('hdrRegion');if(rg)rg.textContent=se.regionName||se.region;
  if(!_simStartedAt)_simStartedAt=se.startTime||new Date();
  _stageTimerMark=Date.now();
  startSpaTimer();
  switchStage(1);
  setTimeout(()=>spa_toast('Добро пожаловать, '+uname+'! ЦАФАП SPA загружен.','success'),700);
}
function doLogout(){
  if(confirm('Завершить сессию оператора? Не забудьте предварительно скачать отчёт по кнопке «Отчёт», если ещё не сделали этого.')){
    logEvent('logout',{});
    try{localStorage.removeItem('cafap_s');}catch(e){}
    window.location.reload();return; /* полный сброс состояния: журнал, квесты, данные этапов */
    document.querySelectorAll('[id^="mainContent"]').forEach(el=>{el.innerHTML='';el._initialized=false;});
    showScreen('loginScreen');
  }
}
function refreshBadges(){
  const f=window['s'+SPA_STATE.currentStage+'_badges'];if(typeof f!=='function')return;
  let c;try{c=f();}catch(e){return;}
  Object.keys(c).forEach(k=>{const el=document.querySelector('#unifiedSidebar #nav-'+k+' .nav-badge');if(el)el.textContent=c[k];});
}
function startSpaTimer(){
  if(window._badgeTimer)clearInterval(window._badgeTimer);
  window._badgeTimer=setInterval(refreshBadges,1000);
  const el=document.getElementById('shiftClock');
  if(window._spaTimer)clearInterval(window._spaTimer);
  window._spaTimer=setInterval(()=>{
    const d=Math.floor((new Date()-SPA_STATE.session.startTime)/1000);
    if(el)el.textContent=[Math.floor(d/3600),Math.floor((d%3600)/60),d%60].map(x=>String(x).padStart(2,'0')).join(':');
  },1000);
}

/* ---- STAGE SWITCHING ---- */
const ROLE_PER_STAGE={1:'Оператор',2:'Оператор',3:'Инспектор',4:'Спец. почты',5:'Аналитик',6:'Фед. Адм.'};
const CHIP_PER_STAGE={1:'role-op',2:'role-op',3:'role-ins',4:'role-op',5:'role-ana',6:'role-adm'};
function switchStage(n){
  const prev=SPA_STATE.currentStage;
  _flushStageTime();
  SPA_STATE.currentStage=n;
  document.querySelectorAll('.stage-sec').forEach(s=>s.classList.remove('active'));
  const sec=document.getElementById('stage-'+n);if(sec)sec.classList.add('active');
  document.querySelectorAll('.stage-tab').forEach(t=>t.classList.remove('active'));
  const tab=document.getElementById('stab-'+n);if(tab)tab.classList.add('active');
  // sidebar
  const sb=document.getElementById('unifiedSidebar');
  if(sb)sb.innerHTML=STAGE_SIDEBAR_HTML[n]||'';
  // role chip
  const rc=document.getElementById('hdrRole');
  if(rc){rc.textContent=ROLE_PER_STAGE[n]||'Оператор';rc.className='role-chip '+(CHIP_PER_STAGE[n]||'role-op');}
  // instructions
  const lbl=document.getElementById('instStageLabel');if(lbl)lbl.textContent=`Этап ${n} из 6`;
  const dsc=document.getElementById('instStageDesc');if(dsc)dsc.textContent=SPA_DESCS[n]||'';
  const sht=document.getElementById('instStageShort');if(sht)sht.textContent=`Этап ${n}:`;
  updateSpaQuestUI();renderSpaInstContent();
  // init content
  const mc=document.getElementById('mainContent'+n);
  if(mc&&!mc._initialized){mc._initialized=true;initStageContent(n,mc);}
  if(prev!==n)logEvent('stage_switch',{from:prev,to:n});
}

/* Patch getElementById so stages find their own mainContent */
const _origGBI=document.getElementById.bind(document);
document.getElementById=function(id){
  if(id==='mainContent'){
    const n=SPA_STATE.currentStage;
    return _origGBI('mainContent'+n)||_origGBI(id);
  }
  return _origGBI(id);
};

/* Intercept href navigation to stage files */
document.addEventListener('click',function(e){
  const a=e.target.closest('a[href]');
  if(a){
    const href=a.getAttribute('href')||'';
    const m=href.match(/cafap_stage(\d)\.html/);
    if(m){e.preventDefault();switchStage(parseInt(m[1]));}
  }
},true);

/* Intercept window.location.href assignments (from JS code) */
const _locDesc=Object.getOwnPropertyDescriptor(window,'location');
try{
  let _locHrefSetter=null;
  Object.defineProperty(window,'location',{
    get:()=>window._realLocation||_locDesc.get.call(window),
    set:(v)=>{
      const m=String(v).match(/cafap_stage(\d)\.html/);
      if(m){switchStage(parseInt(m[1]));return;}
      _locDesc.set?_locDesc.set.call(window,v):window.location.assign(v);
    },configurable:true
  });
}catch(e){}

function initStageContent(n,mc){
  const fns={
    1:()=>{if(typeof s1_setSection==='function')s1_setSection('dashboard',null);},
    2:()=>{if(typeof s2_setSection==='function')s2_setSection('ocr',null);},
    3:()=>{if(typeof s3_setSection==='function')s3_setSection('sign',null);},
    4:()=>{if(typeof s4_setSection==='function')s4_setSection('mail',null);},
    5:()=>{if(typeof s5_setSection==='function')s5_setSection('analytics',null);},
    6:()=>{if(typeof s6_setSection==='function')s6_setSection('users',null);}
  };
  try{if(fns[n])fns[n]();}catch(err){console.warn('Stage '+n+' init:',err);}
}

/* ---- TOAST ---- */
function spa_toast(msg,type='info'){
  logEvent('notification',{message:msg,level:type});
  const box=document.getElementById('toastBox');if(!box)return;
  const icons={info:'fa-info-circle',success:'fa-check-circle',error:'fa-times-circle',warning:'fa-exclamation-triangle'};
  const colors={info:'#1565C0',success:'#2E7D32',error:'#C62828',warning:'#F57C00'};
  const d=document.createElement('div');
  d.style.cssText='background:#fff;border:1px solid var(--border);border-radius:8px;padding:9px 13px;font-size:11.5px;box-shadow:0 4px 16px rgba(0,0,0,.1);display:flex;align-items:flex-start;gap:9px;max-width:300px;animation:toastIn .3s ease;';
  d.style.borderLeft=`3px solid ${colors[type]||colors.info}`;
  d.innerHTML=`<i class="fas ${icons[type]||icons.info}" style="color:${colors[type]||colors.info};flex-shrink:0;font-size:14px;margin-top:1px;"></i><span>${msg}</span>`;
  box.appendChild(d);
  setTimeout(()=>{d.style.transition='opacity .3s';d.style.opacity='0';setTimeout(()=>d.remove(),300);},3800);
}
function toast(msg,type='info'){spa_toast(msg,type);}
function closeModal(id){const el=document.getElementById(id);if(el)el.style.display='none';}

/* ---- QUEST ---- */
function spa_markQuest(idx){
  const n=SPA_STATE.currentStage;
  const _sf=window['s'+n+'_markQuest'];
  if(typeof _sf==='function'){_sf(idx);return;}
  const q=SPA_STATE.quest[n];
  if(!q.done.includes(idx)){
    q.done.push(idx);
    const steps=SPA_QSTEPS[n]||[];
    updateSpaQuestUI();
    spa_toast(`✅ Шаг ${idx+1}: ${steps[idx]?.title||''}!`,'success');
  }
}
function markQuest(idx){spa_markQuest(idx);}
function spa_nextQuest(){
  const n=SPA_STATE.currentStage;const q=SPA_STATE.quest[n];
  const _nf=window['s'+n+'_nextQuest'];
  if(typeof _nf==='function'){_nf();updateSpaQuestUI();return;}
  const steps=SPA_QSTEPS[n]||[];
  if(q.step<steps.length-1){spa_markQuest(q.step);q.step++;updateSpaQuestUI();}
  else{spa_toast('🎓 Этап '+n+' пройден! Переходите к следующему.','success');spa_markQuest(q.step);}
}
function spa_restartQuest(){
  const n=SPA_STATE.currentStage;
  const _rf=window['s'+n+'_restartQuest'];
  if(typeof _rf==='function'){_rf();updateSpaQuestUI();return;}
  SPA_STATE.quest[n].done.length=0;SPA_STATE.quest[n].step=0;
  updateSpaQuestUI();renderSpaInstContent();
  spa_toast('Квест этапа '+n+' перезапущен','info');
}
function updateSpaQuestUI(){
  const n=SPA_STATE.currentStage;const q=SPA_STATE.quest[n];
  const steps=SPA_QSTEPS[n]||[];
  const pct=Math.round((q.done.length/Math.max(steps.length,1))*100);
  const el=document.getElementById('questPct');if(el)el.textContent=pct+'%';
  const pf=document.getElementById('instProgFill');if(pf)pf.style.width=pct+'%';
  const pt=document.getElementById('instProgTxt');if(pt)pt.textContent=`${q.done.length}/${steps.length} шагов`;
  renderSpaInstContent();
}
function spa_switchInstTab(el,tab){
  document.querySelectorAll('.inst-tab').forEach(t=>{t.style.background='#fff';t.style.color='var(--text2)';});
  el.style.background='var(--primary-lighter)';el.style.color='var(--primary)';
  SPA_STATE.instTab=tab;renderSpaInstContent();
}
function renderSpaInstContent(){
  const body=document.getElementById('instBody');if(!body)return;
  const tab=SPA_STATE.instTab||'mission';
  const n=SPA_STATE.currentStage;const q=SPA_STATE.quest[n];
  const steps=SPA_QSTEPS[n]||[];const cur=q.step||0;
  if(tab==='mission'){
    body.innerHTML=`<div>
      <div style="font-size:11.5px;font-weight:700;color:var(--primary);margin-bottom:7px;">📋 ЭТАП ${n}: ${SPA_DESCS[n]}</div>
      <div style="display:flex;gap:5px;overflow-x:auto;padding-bottom:4px;">
        ${steps.map((s,i)=>{const done=q.done.includes(i);const active=cur===i;
          return`<div style="text-align:center;flex-shrink:0;width:58px;">
            <div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;margin:0 auto 3px;${done?'background:var(--success);color:#fff;':active?'background:var(--primary);color:#fff;':'background:var(--primary-lighter);color:var(--primary);'}">${done?'✓':s.n||i+1}</div>
            <div style="font-size:9px;color:${done?'var(--success)':active?'var(--primary)':'var(--text3)'};line-height:1.2;">${(s.title||'').split(' ').slice(0,2).join(' ')}</div>
          </div>`;}).join('')}
      </div>
      ${cur<steps.length?`<div style="margin-top:7px;padding:8px 10px;background:var(--primary-xs);border-radius:6px;border-left:3px solid var(--primary);">
        <div style="font-size:10.5px;font-weight:700;color:var(--primary);margin-bottom:2px;">▶ Шаг ${cur+1}/${steps.length}: ${steps[cur]?.title||''}</div>
        <div style="font-size:11px;">${steps[cur]?.text||''}</div>
      </div>`:'<div style="padding:8px;background:#E8F5E9;border-radius:6px;font-size:11px;color:var(--success);font-weight:700;">🎓 Все задания Этапа '+n+' выполнены!</div>'}
    </div>`;
  }else if(tab==='hints'){
    const hints=SPA_HINTS[n]||[];
    body.innerHTML=`<div style="display:flex;gap:8px;flex-wrap:wrap;">${hints.map(h=>`<div style="flex:1;min-width:180px;padding:8px;background:#F8FAFF;border-radius:6px;border:1px solid var(--border2);"><div style="font-size:11px;font-weight:700;color:var(--primary);margin-bottom:3px;">💡 ${h.t}</div><div style="font-size:10.5px;color:var(--text2);line-height:1.4;">${h.txt}</div></div>`).join('')}</div>`;
  }else if(tab==='progress'){
    let rows='';
    for(let i=1;i<=6;i++){
      const qi=SPA_STATE.quest[i];const si=SPA_QSTEPS[i]||[];
      const pi=Math.round((qi.done.length/Math.max(si.length,1))*100);
      rows+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
        <span style="font-size:11px;width:56px;color:${i===n?'var(--primary)':'var(--text2)'};">${i===n?'▶ ':''} Эт.${i}</span>
        <div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${pi}%;background:${pi===100?'var(--success)':'var(--primary)'};border-radius:4px;"></div></div>
        <span style="font-size:10.5px;font-weight:700;width:36px;text-align:right;color:${pi===100?'var(--success)':'var(--primary)'};">${pi}%</span>
        <span>${pi===100?'✅':'⬜'}</span>
      </div>`;
    }
    const allD=Object.values(SPA_STATE.quest).reduce((a,q)=>a+q.done.length,0);
    const allT=Object.values(SPA_QSTEPS).reduce((a,s)=>a+s.length,0);
    body.innerHTML=`<div><div style="font-size:12px;font-weight:700;margin-bottom:8px;">Общий прогресс: <span style="color:var(--primary);">${Math.round((allD/allT)*100)}%</span> (${allD}/${allT} шагов)</div>${rows}</div>`;
  }else if(tab==='glossary'){
    body.innerHTML=`<div style="display:flex;flex-wrap:wrap;gap:5px;">${SPA_GLOSSARY.map(g=>`<div style="padding:4px 9px;background:#F8FAFF;border-radius:4px;border:1px solid var(--border2);"><span style="font-size:11px;font-weight:700;color:var(--primary);">${g.t}</span><span style="font-size:10px;color:var(--text2);margin-left:4px;">— ${g.d}</span></div>`).join('')}</div>`;
  }
}
function toggleInst(){
  SPA_STATE.instCollapsed=!SPA_STATE.instCollapsed;
  const c=document.getElementById('instContent');
  const ico=document.getElementById('instTogIco');
  const panel=document.getElementById('instPanel');
  if(!panel)return;
  if(SPA_STATE.instCollapsed){
    if(c)c.style.display='none';
    panel.classList.add('inst-collapsed');
    panel.classList.remove('inst-expanded');
    if(ico)ico.className='fas fa-chevron-up';
  }else{
    if(c)c.style.display='';
    panel.classList.add('inst-expanded');
    panel.classList.remove('inst-collapsed');
    if(ico)ico.className='fas fa-chevron-down';
  }
}

/* ---- STARTUP ---- */
/* Stage 1 load handler: handled by SPA core */


/* Безопасное создание графика Chart.js: пропускает, если холст уже удалён из DOM (быстрое переключение разделов),
   и уничтожает прежний график на этом же холсте. */
function safeChart(el,cfg){
  try{
    if(!el||!el.isConnected||typeof Chart==='undefined')return null;
    const old=Chart.getChart(el);if(old)old.destroy();
    return new Chart(el,cfg);
  }catch(e){console.warn('Chart:',e&&e.message);return null;}
}
window.safeChart=safeChart;
