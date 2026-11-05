/* База отпечатков для симуляторов (ЦИАДИС и др.). Сами изображения — в assets/fingerprints/.
   Формат записи:
   { id:'fp-0001', person:'p-001', finger:'R-index', pattern:'петля', file:'assets/fingerprints/p-001/R-index.png' }
   Пальцы: R-thumb R-index R-middle R-ring R-little, L-... (как в дактокарте). Подключайте в странице симулятора:
   <script src="../data/fingerprints.js"></script>  */
window.FINGERPRINTS = [];
window.FP_PERSONS = [];   // { id:'p-001', fio:'...', birth:'...', card:'...' }
