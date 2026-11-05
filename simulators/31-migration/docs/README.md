# ФИС ГМУ — учебный симулятор (структура проекта)
- `index.html` — оболочка (разметка экранов и загрузчик); `config.json` — версия, опорная дата сценария.
- `app/core` — состояние, данные, баллы, аудит, интерфейс, сессия, инструкции, токен курсанта.
- `app/panels` — очередь, миграционный учёт, патент, РВП/ВНЖ, картотека ИГ и нарушения, АРМ преподавателя, отчёты, решения.
- `app/ui` — `styles.css`, `icons.svg`, `logo.png`. `data/` — синтетические данные (JSON) и `manifest.json`.
- Запуск: `start.bat` / `start.sh` (http://localhost:8080) либо двойной щелчок по `index.html` (данные берутся из `dist/data_bundle/data.js`).
- После правки данных: `python tools/build_manifest.py && python tools/bundle_for_file.py`; проверка: `python tools/validate.py`.

## База на 600 человек, фото и отпечатки
- Люди: `python tools/generate_people.py` — IG-001…010 «сценарные» (с ловушками) + синтетика до 600 (миграционный учёт, ВНЖ, патент, РВП используют одну базу). Все данные вымышлены.
- Отпечатки (АДИС «Папилон»): `python tools/import_fingerprints.py <путь к assets/fingerprints>` — папки `DK-2021-xxxx` по 10 PNG. Имя папки становится ID отпечатков записи (поле `fp`); PNG конвертируются в WebP (до 256 px). Какой файл какой палец — по названию, номеру или алфавиту (скрипт печатает разбор первой папки; порядок задаётся `--order iso|alpha|список`; для папок с `01.png…10.png` откройте `data/fingerprints/_check.png` и убедитесь, что порядок пальцев верный, иначе запустите с `--order alpha`). Альтернатива для SOCOFing в исходном виде — `tools/import_socofing.py`. «Двойники» (ловушка `biometric_dup`) получают отпечатки чужой записи.
- Фото: сложите изображения из genphoto в папку (можно `male/` и `female/`) и выполните `python tools/import_photos.py <папка>`. Без файлов показывается силуэт.
- Приложение «Амина»: поле `amina` у каждой записи; логика и учебные правила — `app/core/amina.js`.

## Сценарии (`scenarios/`)
- `roster/cadets.json` — состав взвода в АРМ преподавателя; `traps/traps.json` — типы ловушек (ручной режим; `validate.py` проверяет, что ловушки в данных известны); `presets/presets.json` — тематические пресеты; `quests/generator_sliders.json` — ползунки генератора кейсов и значения по умолчанию. После правки JSON: `python tools/build_manifest.py && python tools/bundle_for_file.py`.
