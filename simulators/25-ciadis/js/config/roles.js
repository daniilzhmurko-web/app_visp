'use strict';
/* Роли пользователей */
const ROLES = {
  external:    { name:'Сторонний пользователь',           cls:'rb-external',   ic:'fa-user',          ini:'СП', disp:'Иванов И.И.',   color:'#2D7DD2' },
  operator:    { name:'Оператор ЦИАДИС-МВД ГИАЦ/ИЦ',     cls:'rb-operator',   ic:'fa-user-tie',      ini:'ОГ', disp:'Смирнов А.В.', color:'#1E8449' },
  territorial: { name:'Оператор территориальной станции', cls:'rb-territorial',ic:'fa-map-marker-alt',ini:'ОТ', disp:'Козлов П.Н.',   color:'#16A085' },
  foiv:        { name:'Оператор ФОИВ',                    cls:'rb-foiv',       ic:'fa-building',      ini:'ФО', disp:'Попова Е.С.',   color:'#D35400' },
  sysadmin:    { name:'Системный администратор',          cls:'rb-sysadmin',   ic:'fa-server',        ini:'СА', disp:'Волков Д.А.',   color:'#7D3C98' },
  security:    { name:'Администратор безопасности',       cls:'rb-security',   ic:'fa-shield-alt',    ini:'АБ', disp:'Морозов К.С.',  color:'#C0392B' }
};
