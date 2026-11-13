// ===== НАСТАВНИК =====
// ================================================================
const MENTOR_RESPONSES = PAPILON_DATA.mentor;

function toggleMentor() { const p=document.getElementById('mentor-panel'); p.classList.toggle('hidden'); }
function addMentorMsg(text, type='info') {
  const body = document.getElementById('mentor-body');
  if (!body) return;
  const div = document.createElement('div');
  div.className = `mentor-msg ${type}`;
  div.textContent = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  // Логируем значимые сообщения наставника (warn/error/success)
  if (type === 'error' || type === 'warn' || type === 'success') {
    try { logAction('MENTOR_MSG', text, { type }); } catch (e) { /* журнал может быть ещё не инициализирован */ }
  }
}
function sendMentorMsg() {
  const input=document.getElementById('mentor-input');
  const q=input.value.trim().toLowerCase();
  if(!q)return;
  addMentorMsg('Вы: '+input.value,'');
  input.value='';
  let found=false;
  for(const [key,resp] of Object.entries(MENTOR_RESPONSES)){
    if(q.includes(key)){addMentorMsg(resp,'info');found=true;break;}
  }
  if(!found) addMentorMsg('Хороший вопрос! Обратитесь к текущему шагу миссии или изучите модуль, с которым работаете. Подсказки доступны в нижней панели инструктора.','info');
}

// ================================================================
