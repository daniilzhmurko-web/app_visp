# ЦИАДИС-МВД — учебный тренажёр

## Запуск
Откройте `index.html` двойным щелчком в браузере (Chrome / Edge / Firefox). Интернет и сервер не нужны:
Font Awesome лежит в `assets/vendor`, данные подключаются как обычные `<script>`.

## Структура
```
index.html                 каркас страницы и порядок подключения файлов
css/
  base.css                 переменные, тема, типографика
  layout.css               шапка, сайдбар, сетка
  components.css           карточки, таблицы, формы, кнопки
  modals.css  toast.css
  quest-panel.css          нижняя панель инструкций / экзамена
  mission.css              итоговый экран
  icons.css  mvd-theme.css  деловые SVG-иконки, синяя шапка в стиле МВД
  exam.css                 оформление режима экзамена
  screens/boot.css login.css
js/
  main.js                  точка входа
  config/                  modes.js (режимы), roles.js, constants.js
  core/                    state.js, router.js, logger.js, report.js, utils.js
  auth/identity-token.js   токен преподавателя
  quest/                   steps.js (14 шагов обучения), engine.js, scoring.js, exam.js, mission.js
  ui/toast.js
  screens/                 boot, login, dashboard, search, cards-db, requests, stats, journal, users, system, help, request-modals
data/
  cards.js                 база дактилокарт (синтетические данные)
  feed.js                  лента операций
  exam-variants.js         варианты экзаменационных заданий
assets/
  img/                     логотип
  fingerprints/<ID>/NN.svg учебные синтетические отпечатки (10 на карту)
  vendor/fontawesome/      иконки (офлайн)
tools/gen_prints.py        генератор синтетических SVG-отпечатков
tools/import_socofing.py   импорт реальных отпечатков SOCOFing (BMP -> PNG) и генерация базы карточек
```
Порядок подключения скриптов в `index.html` важен (данные и конфиги — до логики).

## Режим экзамена
Выбирается на экране входа («Режим работы») либо задаётся токеном (`mode: "exam"`, `variant: 1..N` в payload —
в этом случае курсант не может его изменить). Правила: подсказок и подсветки нет, пункты выполняются в любом порядке,
лимит времени 20 минут, лимит ошибок 5 (−5 баллов за каждую), оценка по порогам 85 / 70 / 50.
Вариант выбирается вручную, токеном или автоматически по номеру взвода. Все параметры — в `js/config/modes.js`,
задания — в `data/exam-variants.js`. Результат (баллы, оценка, ошибки, пункты, время) попадает в JSON-отчёт
(поле `exam`, `report_version` 1.1).

## Как добавить
- **Вариант задания** — новый объект в `data/exam-variants.js` (карта, фамилия, тип изменения, новое значение, текст).
- **Дактилокарту** — запись в `data/cards.js`, затем `python tools/gen_prints.py assets/fingerprints ДК-XXXX-XXXX`
  (или положите свои синтетические изображения `01.svg … 10.svg` в `assets/fingerprints/DK-XXXX-XXXX/`).
- **Контрольный пункт экзамена** — запись в `MODES.exam.items` и условие в `examCheck()` (`js/quest/exam.js`).

Важно: данные в `data/` — это `.js`, а не `.json`, потому что браузер блокирует `fetch` локальных файлов при запуске
двойным щелчком. При размещении на веб-сервере можно перейти на JSON.
Не размещайте в проекте реальные отпечатки и персональные данные.

## Импорт отпечатков SOCOFing
```
pip install pillow
python tools\\import_socofing.py --src "C:\\Users\\User\\Downloads\\Real"
```
Скрипт разбирает имена файлов вида `12__M_Left_index_finger.BMP`, конвертирует их в PNG (по умолчанию увеличение в 2 раза),
раскладывает по `assets/fingerprints/DK-ГГГГ-NNNN/01.png … 10.png` и пересоздаёт `data/cards.js`:
7 исходных карточек сохраняются (на них завязаны варианты экзамена), остальные создаются с вымышленными ФИО,
датами, регионами и паспортами. Параметры: `--count N` (сколько карточек), `--scale K`, `--seed N`, `--dry-run`.
Порядок слотов в карточке: П1–П5 правая рука (большой … мизинец), Л1–Л5 левая рука.
Источник: SOCOFing (Shehu et al.), лицензия CC BY-NC 4.0 — только некоммерческое использование, обязательно указание источника.
