// ===== УВЕДОМЛЕНИЯ =====
// ================================================================
function showNotification(text, type='info') {
  const div=document.createElement('div');
  div.style.cssText='position:fixed;top:20px;right:20px;padding:12px 18px;border-radius:8px;font-size:13px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,0.15);z-index:300;transition:all 0.3s;';
  const colors={success:'background:#dcfce7;color:#15803d;border:1px solid #bbf7d0',info:'background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe',warn:'background:#fef3c7;color:#92400e;border:1px solid #fde68a',error:'background:#fee2e2;color:#991b1b;border:1px solid #fecaca'};
  div.style.cssText+=colors[type]||colors.info;
  div.textContent=text;
  document.body.appendChild(div);
  setTimeout(()=>{div.style.opacity='0';setTimeout(()=>div.remove(),400);},3000);
}

// ================================================================
