'use strict';
// ── INIT ──────────────────────────────────────────
onAppReady( ()=>{
  // pre-select migration module
  selectModule('migration');
  selectRole('inspector', document.getElementById('rb-inspector'));
  
  // keyboard ESC to close modals
  document.addEventListener('keydown', e=>{
    if(e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m=>m.classList.add('hidden'));
    }
  });
});
