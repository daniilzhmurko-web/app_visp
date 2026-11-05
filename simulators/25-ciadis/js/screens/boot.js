'use strict';
/* =====================================================
   ЗАГРУЗОЧНАЯ ПОСЛЕДОВАТЕЛЬНОСТЬ
   ===================================================== */
const BOOT_MSG = [
  '[INIT]  Запуск ядра системы ЦИАДИС-МВД v2.9....',
  '[OK]    Загрузка модуля дактилоскопической идентификации',
  '[OK]    Подключение к центральной базе данных АДИС',
  '[OK]    Инициализация криптографической подсистемы КриптоПро',
  '[CHECK] Проверка целостности реестра дактилокарт... УСПЕШНО',
  '[OK]    Загрузка нормативных справочников МВД России',
  '[OK]    Активация системы разграничения прав доступа',
  '[OK]    Установка соединения с серверами регионов (87/87)',
  '[CHECK] Верификация цифровых подписей компонентов... ОК',
  '[OK]    Система готова. Запуск пользовательского интерфейса...'
];

async function runBoot() {
  logEvent('boot_started');
  const term = document.getElementById('boot-term');
  const fill = document.getElementById('boot-fill');
  for (let i = 0; i < BOOT_MSG.length; i++) {
    await delay(320 + Math.random()*250);
    const d = document.createElement('div');
    d.className = 'boot-line';
    d.textContent = BOOT_MSG[i];
    term.appendChild(d);
    term.scrollTop = 99999;
    fill.style.width = ((i+1)/BOOT_MSG.length*100)+'%';
  }
  await delay(700);
  // Скрыть boot, показать login
  const boot = document.getElementById('boot');
  boot.style.transition = 'opacity .5s';
  boot.style.opacity = '0';
  await delay(500);
  boot.style.display = 'none';
  const login = document.getElementById('login');
  login.style.display = 'flex';
  login.style.opacity = '0';
  login.style.transition = 'opacity .5s';
  await delay(50);
  login.style.opacity = '1';
  S.flags.boot = true;
  logEvent('boot_completed');
  checkQ();
}

function delay(ms){ return new Promise(r=>setTimeout(r,ms)); }
