/* ЛИЦЕНЗИРОВАНИЕ — ЗАГОТОВКА (ПОКА ОТКЛЮЧЕНО)
   Сейчас enabled:false: приложение запускается без проверки. Включим позже.
   Задуманная схема: license/license.dat = { payload (base64 JSON), signature (base64) }, подпись RSA-PSS/SHA-256,
   закрытый ключ хранится только у разработчика (generator/private_key.pem), открытый вшивается сюда (PUBLIC_KEY_PEM).
   Проверка — WebCrypto (crypto.subtle.verify). Под file:// fetch к файлу недоступен, поэтому .dat выбирается
   через <input type="file"> и кладётся в localStorage; с локального сервера можно читать через fetch. */
(function () {
  var CONFIG = {
    enabled: false,                       // <-- ПОКА НЕ АКТИВНО
    licensePath: '../license/license.dat',
    storageKey: 'my-simulator.license',
    publicKeyPem: ''                      // сюда вставить содержимое generator/public_key.pem
  };

  var License = {
    config: CONFIG,
    init: function () {
      if (!CONFIG.enabled) return Promise.resolve({ ok: true, mode: 'disabled' });
      // TODO (позже): 1) получить license.dat  2) проверить подпись  3) проверить срок/машину  4) показать экран активации
      return Promise.resolve({ ok: false, mode: 'not-implemented' });
    },
    verify: function (/* licenseObj */) { /* TODO */ return Promise.resolve(false); },
    isFeatureAllowed: function (/* name */) { return true; }   // пока всё разрешено
  };
  window.License = License;
})();
