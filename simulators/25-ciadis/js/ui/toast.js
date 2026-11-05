'use strict';
/* =====================================================
   TOASTS
   ===================================================== */
function toast(title,msg,type='success') {
  const icons={success:'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>',err:'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>',warn:'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3L2 20h20L12 3z"/><path d="M12 10v5M12 17.5v.5"/></svg>',info:'<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>'};
  const tc=document.getElementById('toasts');
  const d=document.createElement('div');
  d.className='toast '+(type==='err'?'err':type==='warn'?'warn':type==='info'?'info':'');
  d.innerHTML=`<span class="t-icon">${icons[type]||icons.info}</span><div><div class="t-title">${title}</div><div class="t-msg">${msg}</div></div>`;
  tc.appendChild(d);
  setTimeout(()=>{d.style.transition='opacity .3s';d.style.opacity='0';setTimeout(()=>d.remove(),300);},3200);
}
