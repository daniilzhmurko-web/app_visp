// ===== RLPOSITIVE ДИАЛОГ =====
// ================================================================
function showRLPositive(callback) {
  APP.rlpositiveCallback = callback;
  document.getElementById('rlpositive-dialog').classList.remove('hidden');
  document.getElementById('rlp-error').textContent = '';
}
function cancelRLPositive() { document.getElementById('rlpositive-dialog').classList.add('hidden'); APP.rlpositiveCallback=null; }
function confirmRLPositive() {
  const count = parseInt(document.getElementById('rlp-count').value);
  const confidence = document.getElementById('rlp-confidence').value;
  const reason = esc(document.getElementById('rlp-reason').value.trim());
  const errEl = document.getElementById('rlp-error');
  if (!Number.isFinite(count) || count < 8 || count > 30) {
    errEl.textContent = (Number.isFinite(count) && count > 30) ? '❌ Укажите число признаков от 8 до 30.' : '❌ Минимальное количество совпадающих признаков — 8 по методике МВД.';
    APP._rlpErrors = (APP._rlpErrors || 0) + 1;
    logAction('RL_POSITIVE_INVALID', `Слишком мало признаков: ${count}`);
    return;
  }
  if (!confidence) { errEl.textContent = '❌ Укажите уровень достоверности.'; return; }
  if (reason.length < 15) {
    errEl.textContent = '❌ Обоснование слишком краткое. Опишите ключевые признаки.';
    APP._rlpErrors = (APP._rlpErrors || 0) + 1;
    logAction('RL_POSITIVE_INVALID', `Краткое обоснование: ${reason.length} символов`);
    return;
  }
  document.getElementById('rlpositive-dialog').classList.add('hidden');
  logAction('RL_POSITIVE', `Признаков: ${count}, Достоверность: ${confidence}, Обоснование: ${reason.slice(0, 50)}...`);
  APP.score.procedure = Math.max(40, 100 - 15 * (APP._rlpErrors || 0));
  APP.reportData = { count, confidence, reason, candidate: APP.selectedCandidate, latent: APP.currentCase, ts: new Date().toLocaleString('ru-RU') };
  if (APP.rlpositiveCallback) { APP.rlpositiveCallback(); APP.rlpositiveCallback = null; }
}

// ================================================================
