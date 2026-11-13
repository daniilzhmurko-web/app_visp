// БАЗА ДАННЫХ ОТПЕЧАТКОВ ПАЛЬЦЕВ v5
// 60 реальных отпечатков: 300×360 WebP, AI-апскейл (LANCZOS + Unsharp Mask)
// ============================================================================
const FP_IMAGES = Array.from({ length: 60 }, (_, i) => 'assets/fingerprints/fp_' + String(i).padStart(2, '0') + '.webp');

let _fpImageCache = {};

function getFingerprintImage(fpIndex, callback) {
  if (_fpImageCache[fpIndex]) {
    callback(_fpImageCache[fpIndex]);
    return;
  }
  const img = new Image();
  img.onload = () => {
    _fpImageCache[fpIndex] = img;
    callback(img);
  };
  img.src = FP_IMAGES[fpIndex];
}

const _fpPending = {};
function _ensureFp(i) {
  if (_fpPending[i]) return; _fpPending[i] = true;
  const img = new Image();
  img.onload = () => {
    _fpImageCache[i] = img;
    if (APP.currentModule === 'coding') drawCanvas();
    else if (APP.currentModule === 'comparison' && compCtx1 && compCtx2) {
      drawCompareCanvas(compCtx1, APP.currentCase, 'latent', compZoom, compOffset);
      drawCompareCanvas(compCtx2, APP.selectedCandidate, 'candidate', compZoom, compOffset);
    }
  };
  img.src = FP_IMAGES[i];
}
function drawRealFingerprint(ctx, fpIndex, x, y, w, h, quality, isFragment) {
  const flip = fpIndex >= 60, baseIdx = fpIndex % 60;
  const img = _fpImageCache[baseIdx];
  let _s = (baseIdx * 9301 + 49297) % 233280;
  const _rnd = () => { _s = (_s * 9301 + 49297) % 233280; return _s / 233280; };
  if (!img) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#999';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Загрузка...', x + w/2, y + h/2);
    _ensureFp(baseIdx);
    return;
  }

  ctx.save();
  if (flip) { ctx.translate(x + w / 2, 0); ctx.scale(-1, 1); ctx.translate(-(x + w / 2), 0); }
  ctx.drawImage(img, x, y, w, h);

  // УВЕЛИЧЕНИЕ ЧЁТКОСТИ: эффект sharpen через тень
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0.5;
  ctx.shadowOffsetY = 0.5;
  ctx.drawImage(img, x, y, w, h);
  ctx.shadowOffsetX = -0.5;
  ctx.shadowOffsetY = -0.5;
  ctx.shadowColor = 'rgba(255,255,255,0.15)';
  ctx.drawImage(img, x, y, w, h);
  ctx.shadowColor = 'transparent';

  if (quality === 'medium') {
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) {
      const px = x + _rnd() * w;
      const py = y + _rnd() * h;
      const pr = 10 + _rnd() * 20;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (quality === 'low') {
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 10; i++) {
      const px = x + _rnd() * w;
      const py = y + _rnd() * h;
      const pr = 15 + _rnd() * 25;
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + h * 0.3);
    ctx.lineTo(x + w * 0.7, y + h * 0.8);
    ctx.stroke();
  }

  if (isFragment) {
    const grad = ctx.createRadialGradient(x + w * 0.3, y + h * 0.7, 20, x + w * 0.3, y + h * 0.7, w * 0.9);
    grad.addColorStop(0, 'rgba(240,240,240,0)');
    grad.addColorStop(0.5, 'rgba(240,240,240,0.6)');
    grad.addColorStop(1, 'rgba(240,240,240,0.95)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();
}

function preloadAllFingerprints() {
  FP_IMAGES.forEach((b64, idx) => {
    const img = new Image();
    img.onload = () => { _fpImageCache[idx] = img; };
    img.src = b64;
  });
}
