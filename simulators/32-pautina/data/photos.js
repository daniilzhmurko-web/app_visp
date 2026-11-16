/* Пользовательские (реальные) фотографии фиксации. Файл создаётся/обновляется командой
   node tools/import-photos.js <папка_с_фото>   (см. README, раздел «Реальные фотографии»).
   Пока фото не импортированы, база пустая — тренажёр использует только синтетические снимки. */
CAFAP_DB.register("photos", {
  "meta": {"name":"Пользовательские фото","description":"Импортированные фотографии фиксации (дополняют ФИС и базу фиксаций)","generatedBy":"tools/import-photos.js","seed":0,"synthetic":false,"generatedAt":"—"},
  "tables": { "owners": [], "vehicles": [], "fixations": [] }
});
