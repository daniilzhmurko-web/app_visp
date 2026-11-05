/* Точка входа. Подключается последним: к этому моменту загружены data/*.js и js/*.js.
   Здесь — только запуск. Логика лицензирования выключена (см. license.js). */
(function () {
  if (window.License) window.License.init();   // пока ничего не делает (enabled:false)
})();
