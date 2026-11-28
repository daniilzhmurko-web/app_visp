'use strict';
/* Процедурный генератор СИНТЕТИЧЕСКИХ снимков фиксации (вид СПЕРЕДИ сверху, как у камер ЦАФАП:
   камера стоит над проезжей частью и фиксирует встречный поток, поэтому в кадре — передняя
   часть автомобиля: капот, лобовое стекло, фары, решётка радиатора, бампер с номерным знаком).
   Это не фотографии: сцена рисуется вектором по параметрам (кузов, цвет, освещение, погода, состояние номера).
   Для замены на реальные изображения достаточно положить файл и указать его в поле `file` записи фиксации. */
const { RNG } = require('./prng');

const W = 1280, H = 720;
const f1 = n => Math.round(n * 10) / 10;

function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(hex, k) { // k>0 светлее, k<0 темнее
  const [r, g, b] = hexToRgb(hex);
  return k >= 0 ? rgbToHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k) : rgbToHex(r * (1 + k), g * (1 + k), b * (1 + k));
}
function mix(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }

/* Геометрия передней части кузова. Доли высоты от земли:
   face  — низ кузова (клиренс), hood — передняя кромка капота (верх передней плоскости),
   cowl  — основание лобового стекла, glassTop — верх лобового стекла (низ крыши),
   beltW — ширина кузова по плечам, roofW — ширина крыши, lampW — ширина фары (доля полуширины). */
const BODY = {
  sedan:   { w: 1.00, H: 472, roofW: .70, beltW: .965, glassTop: .945, gTopW: .58, gBotW: .84, cowl: .660, hood: .420, face: .190, lampW: .27, grilleW: .56, kind: 'car' },
  hatch:   { w: 0.98, H: 486, roofW: .78, beltW: .960, glassTop: .965, gTopW: .68, gBotW: .88, cowl: .620, hood: .400, face: .200, lampW: .23, grilleW: .58, kind: 'car', wiper: true },
  wagon:   { w: 1.00, H: 500, roofW: .86, beltW: .975, glassTop: .975, gTopW: .80, gBotW: .92, cowl: .600, hood: .380, face: .200, lampW: .19, grilleW: .62, kind: 'car', wiper: true, rails: true },
  suv:     { w: 1.06, H: 572, roofW: .88, beltW: 1.000, glassTop: .965, gTopW: .80, gBotW: .93, cowl: .590, hood: .410, face: .250, lampW: .21, grilleW: .64, kind: 'car', wiper: true, rails: true, skid: true },
  minivan: { w: 1.02, H: 600, roofW: .92, beltW: 1.000, glassTop: .965, gTopW: .84, gBotW: .95, cowl: .560, hood: .390, face: .210, lampW: .17, grilleW: .68, kind: 'car', wiper: true },
  pickup:  { w: 1.06, H: 590, roofW: .74, beltW: 1.000, glassTop: .975, gTopW: .52, gBotW: .60, cowl: .620, hood: .390, face: .240, lampW: .17, grilleW: .44, kind: 'car' },
  van:     { w: 1.02, H: 720, roofW: .96, beltW: 1.000, glassTop: .955, gTopW: .74, gBotW: .84, cowl: .480, hood: .480, face: .200, lampW: .11, grilleW: .32, kind: 'box', wiper: true },
  truck:   { w: 1.14, H: 900, roofW: 1.000, beltW: 1.000, glassTop: .980, gTopW: .74, gBotW: .88, cowl: .520, hood: .520, face: .170, lampW: .10, grilleW: .76, kind: 'box' },
  bus:     { w: 1.18, H: 800, roofW: 1.000, beltW: 1.000, glassTop: .965, gTopW: .84, gBotW: .92, cowl: .470, hood: .470, face: .170, lampW: .09, grilleW: .80, kind: 'box', big: true },
};

/* Вертикальная разметка передней плоскости (доли высоты от земли) */
function frontGeom(B) {
  const fh = B.hood - B.face;                       // высота передней плоскости
  const lampH = fh * .36, grilleH = fh * .22;
  const lampTop = B.hood, lampBot = B.hood - lampH, grilleBot = lampBot - grilleH;
  const plateC = (grilleBot + B.face) / 2;          // центр номерного знака
  return { fh, lampH, grilleH, lampTop, lampBot, grilleBot, plateC };
}

/* ───────── номерной знак РФ ───────── */
function plateSVG(plate, cond, night, rng) {
  const m = plate.match(/^(.)(\d{3})(..)(\d{2,3})$/);
  const L1 = m ? m[1] : plate[0], D = m ? m[2] : plate.slice(1, 4), L2 = m ? m[3] : plate.slice(4, 6), R = m ? m[4] : plate.slice(6);
  const pw = 172, ph = 37;                       // 520×112 мм → 4.64:1
  const ink = cond === 'faded' ? '#4b4b4b' : '#0a0a0a';
  const bg = cond === 'faded' ? '#e6e3d2' : night ? '#ffffff' : '#f6f6f2';
  const font = "font-family=\"'Arial Narrow','Liberation Sans Narrow','DejaVu Sans Condensed',Arial,sans-serif\" font-weight=\"700\"";
  let s = `<g>`;
  s += `<rect x="${-pw / 2 - 1.5}" y="${-ph / 2 - 1.5}" width="${pw + 3}" height="${ph + 3}" rx="3.5" fill="#1b1b1b"/>`;
  s += `<rect x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${ph}" rx="2.6" fill="${bg}"/>`;
  s += `<rect x="${-pw / 2 + 2}" y="${-ph / 2 + 2}" width="${pw - 4}" height="${ph - 4}" rx="1.6" fill="none" stroke="${ink}" stroke-width="0.9"/>`;
  const x0 = -pw / 2 + 6, cy = 8.6;
  s += `<text x="${x0}" y="${cy}" font-size="25" ${font} fill="${ink}" textLength="14.5" lengthAdjust="spacingAndGlyphs">${L1}</text>`;
  s += `<text x="${x0 + 17}" y="${cy}" font-size="25" ${font} fill="${ink}" textLength="46" lengthAdjust="spacingAndGlyphs">${D}</text>`;
  s += `<text x="${x0 + 66}" y="${cy}" font-size="25" ${font} fill="${ink}" textLength="31" lengthAdjust="spacingAndGlyphs">${L2}</text>`;
  s += `<line x1="${x0 + 102}" y1="${-ph / 2 + 3}" x2="${x0 + 102}" y2="${ph / 2 - 3}" stroke="${ink}" stroke-width="0.9"/>`;
  const rw = R.length === 3 ? 28 : 20;
  s += `<text x="${x0 + 106}" y="${-0.6}" font-size="18" ${font} fill="${ink}" textLength="${rw}" lengthAdjust="spacingAndGlyphs">${R}</text>`;
  s += `<text x="${x0 + 106}" y="${ph / 2 - 5.2}" font-size="7" ${font} fill="${ink}" textLength="12" lengthAdjust="spacingAndGlyphs">RUS</text>`;
  s += `<rect x="${x0 + 120}" y="${ph / 2 - 11.6}" width="7" height="2.1" fill="#fff"/><rect x="${x0 + 120}" y="${ph / 2 - 9.5}" width="7" height="2.1" fill="#1c57a5"/><rect x="${x0 + 120}" y="${ph / 2 - 7.4}" width="7" height="2.1" fill="#d52b1e"/>`;
  if (cond === 'dirty') {
    for (let i = 0; i < 9; i++) {
      s += `<ellipse cx="${f1(rng.float(-pw / 2 + 6, pw / 2 - 6))}" cy="${f1(rng.float(-ph / 2 + 4, ph / 2 - 2))}" rx="${f1(rng.float(5, 16))}" ry="${f1(rng.float(3, 9))}" fill="#4a3a28" opacity="${f1(rng.float(.28, .62))}"/>`;
    }
    s += `<rect x="${-pw / 2}" y="${ph / 2 - 11}" width="${pw}" height="11" fill="#3a2d1e" opacity=".34"/>`;
  } else if (cond === 'snow') {
    for (let i = 0; i < 7; i++) {
      s += `<ellipse cx="${f1(rng.float(-pw / 2 + 8, pw / 2 - 20))}" cy="${f1(rng.float(-ph / 2 + 5, ph / 2 - 3))}" rx="${f1(rng.float(7, 18))}" ry="${f1(rng.float(5, 11))}" fill="#f4f7fb" opacity="${f1(rng.float(.75, .97))}"/>`;
    }
  } else if (cond === 'faded') {
    s += `<rect x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${ph}" rx="2.6" fill="#d8cfa0" opacity=".28"/>`;
  }
  // блик на пластике
  s += `<rect x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${f1(ph * .38)}" rx="2.6" fill="#fff" opacity="${night ? .0 : .12}"/>`;
  return s + `</g>`;
}

/* ───────── автомобиль (вид СПЕРЕДИ) ─────────
   Камера ЦАФАП фиксирует встречный поток: в кадре — передняя часть автомобиля
   (капот, лобовое стекло, фары, решётка радиатора, бампер с номером).
   Локальные координаты: x — вправо, y — вверх отрицательные, 0 — земля. */
function carSVG(o) {
  const B = BODY[o.body] || BODY.sedan;
  const cw = 600 * B.w, h = B.H;
  const col = o.color, dark = shade(col, -.42), light = shade(col, .38), mid = shade(col, -.12);
  const night = o.light === 'night';
  const Y = f => f1(-h * f);                         // доля высоты → y
  const hw = cw / 2;
  const rW = hw * B.roofW, bW = hw * B.beltW;
  const roofY = Y(1), gTop = Y(B.glassTop), cowlY = Y(B.cowl), hoodY = Y(B.hood), faceY = Y(B.face);
  const box = B.kind === 'box';
  const cowlW = bW * (box ? .985 : .90);
  const G = frontGeom(B);
  const fh = Y(G.lampBot) - Y(G.lampTop);            // высота полосы фар (в px)
  let s = '';
  // тень на асфальте
  s += `<ellipse cx="0" cy="6" rx="${f1(hw * 1.12)}" ry="26" fill="#000" opacity="${night ? .45 : .38}" filter="url(#fBlur6)"/>`;
  // колёса
  const tw = cw * .165;
  [-1, 1].forEach(sg => {
    s += `<rect x="${f1(sg * hw * .80 - tw / 2)}" y="${f1(faceY - 22)}" width="${f1(tw)}" height="${f1(-faceY + 22)}" rx="14" fill="#0d0d0d"/>`;
    s += `<rect x="${f1(sg * hw * .80 - tw / 2 + 6)}" y="${f1(faceY - 16)}" width="${f1(tw - 12)}" height="10" rx="5" fill="#242424" opacity=".7"/>`;
  });
  // основной корпус — силуэт передней части
  const base = `M ${f1(-bW)} ${f1(faceY)} L ${f1(-bW)} ${f1(hoodY + 26)} Q ${f1(-bW)} ${f1(hoodY)} ${f1(-bW + 16)} ${f1(hoodY)} L ${f1(-cowlW + 12)} ${f1(cowlY)} Q ${f1(-rW - 8)} ${f1(roofY + 26)} ${f1(-rW + 24)} ${f1(roofY)} L ${f1(rW - 24)} ${f1(roofY)} Q ${f1(rW + 8)} ${f1(roofY + 26)} ${f1(cowlW - 12)} ${f1(cowlY)} L ${f1(bW - 16)} ${f1(hoodY)} Q ${f1(bW)} ${f1(hoodY)} ${f1(bW)} ${f1(hoodY + 26)} L ${f1(bW)} ${f1(faceY)} Z`;
  s += `<path d="${base}" fill="${col}"/>`;
  s += `<path d="${base}" fill="url(#gBodyV)"/>`;
  s += `<path d="${base}" fill="url(#gBodyH)"/>`;
  // лобовое стекло
  const gtw = hw * B.gTopW, gbw = hw * B.gBotW;
  const gBotY = f1(cowlY - 8);
  const glass = `M ${f1(-gbw)} ${gBotY} L ${f1(-gtw)} ${f1(gTop)} L ${f1(gtw)} ${f1(gTop)} L ${f1(gbw)} ${gBotY} Z`;
  s += `<path d="${glass}" fill="#0c1218" stroke="${dark}" stroke-width="7" stroke-linejoin="round"/>`;
  s += `<path d="${glass}" fill="url(#gGlass)"/>`;
  s += `<path d="M ${f1(-gtw * .72)} ${f1(gTop + 8)} L ${f1(-gtw * .16)} ${f1(gTop + 8)} L ${f1(gbw * .34)} ${f1(cowlY - 14)} L ${f1(gbw * .80)} ${f1(cowlY - 14)} Z" fill="#fff" opacity="${night ? .06 : .17}"/>`;
  if (box) s += `<line x1="0" y1="${f1(gTop + 8)}" x2="0" y2="${gBotY - 4}" stroke="${mid}" stroke-width="6"/>`;
  // дворники у основания лобового стекла
  if (B.wiper) s += `<path d="M ${f1(-gbw * .34)} ${f1(cowlY - 4)} L ${f1(gbw * .14)} ${f1(cowlY - 42)}" stroke="#05080b" stroke-width="3.4" stroke-linecap="round" opacity=".8"/>`;
  // коврик у основания лобового стекла (отделяет стекло от капота)
  s += `<path d="M ${f1(-gbw - 4)} ${f1(cowlY - 2)} L ${f1(gbw + 4)} ${f1(cowlY - 2)} L ${f1(cowlW - 12)} ${f1(cowlY + 16)} L ${f1(-cowlW + 12)} ${f1(cowlY + 16)} Z" fill="#14161a" opacity=".55"/>`;
  // капот
  if (!box) {
    const hood = `M ${f1(-cowlW + 12)} ${f1(cowlY + 12)} L ${f1(-bW + 16)} ${f1(hoodY)} L ${f1(bW - 16)} ${f1(hoodY)} L ${f1(cowlW - 12)} ${f1(cowlY + 12)} Z`;
    s += `<path d="${hood}" fill="${light}" opacity=".85"/>`;
    s += `<path d="${hood}" fill="url(#gHood)"/>`;
    // блик на капоте (свет сверху)
    s += `<path d="M ${f1(-cowlW * .72)} ${f1(cowlY + 16)} L ${f1(-bW * .55)} ${f1(hoodY + 8)} L ${f1(-bW * .12)} ${f1(hoodY + 8)} L ${f1(-cowlW * .18)} ${f1(cowlY + 16)} Z" fill="#fff" opacity="${night ? .07 : .26}"/>`;
    // шов капота вдоль крыла
    s += `<line x1="${f1(-bW + 18)}" y1="${f1(hoodY + 4)}" x2="${f1(-cowlW + 16)}" y2="${f1(cowlY + 14)}" stroke="${dark}" stroke-width="2.2" opacity=".5"/>`;
    s += `<line x1="${f1(bW - 18)}" y1="${f1(hoodY + 4)}" x2="${f1(cowlW - 16)}" y2="${f1(cowlY + 14)}" stroke="${dark}" stroke-width="2.2" opacity=".5"/>`;
    // кромка капота над решёткой
    s += `<rect x="${f1(-bW * .96)}" y="${f1(hoodY - 2)}" width="${f1(bW * 1.92)}" height="5" rx="2" fill="#000" opacity=".28"/>`;
  }
  // боковые зеркала
  [-1, 1].forEach(sg => {
    const mx = sg * (bW - 4), my = cowlY + 4;
    s += `<path d="M ${f1(mx)} ${f1(my - 10)} L ${f1(mx + sg * 26)} ${f1(my - 14)} L ${f1(mx + sg * 26)} ${f1(my + 10)} L ${f1(mx)} ${f1(my + 12)} Z" fill="${shade(col, -.25)}"/>`;
    s += `<rect x="${f1(mx + sg * 8)}" y="${f1(my - 10)}" width="18" height="16" rx="6" fill="#0b0e12" opacity=".85"/>`;
  });
  // рейлинги на крыше
  if (B.rails) [-1, 1].forEach(sg => { s += `<rect x="${f1(sg * rW * .90 - 6)}" y="${f1(roofY - 10)}" width="12" height="12" rx="4" fill="#15171a"/>`; });
  // ── передняя плоскость: фары, решётка, бампер
  const lampTop = Y(G.lampTop), lampBot = Y(G.lampBot), grilleTop = lampBot, grilleBot = Y(G.grilleBot);
  const lw = hw * B.lampW * 2;
  [-1, 1].forEach(sg => {
    const xo = sg * bW * .985, xi = sg * (bW * .985 - lw);
    const p = `M ${f1(xo)} ${f1(lampTop + 3)} L ${f1(xi)} ${f1(lampTop + 9)} L ${f1(xi)} ${f1(lampBot - 7)} L ${f1(xo)} ${f1(lampBot - 1)} Z`;
    s += `<path d="${p}" fill="#0e1014" stroke="#05070a" stroke-width="2.5" stroke-linejoin="round"/>`;
    const q = `M ${f1(xo - sg * 4)} ${f1(lampTop + 8)} L ${f1(xi + sg * 4)} ${f1(lampTop + 13)} L ${f1(xi + sg * 4)} ${f1(lampBot - 11)} L ${f1(xo - sg * 4)} ${f1(lampBot - 6)} Z`;
    s += `<path d="${q}" fill="url(#gLamp)" opacity="${night ? 1 : .93}" stroke-linejoin="round"/>`;
    s += `<rect x="${f1(Math.min(xo, xi) + lw * (sg < 0 ? .04 : .70))}" y="${f1(lampTop + 11)}" width="${f1(lw * .25)}" height="${f1(fh * .22)}" rx="2" fill="#e69a1a" opacity=".92"/>`;
    if (night) s += `<ellipse cx="${f1((xo + xi) / 2)}" cy="${f1((lampTop + lampBot) / 2)}" rx="${f1(lw * .95)}" ry="${f1(fh * .42)}" fill="url(#gGlowW)" opacity=".85"/>`;
  });
  // решётка радиатора
  const gi = hw * B.grilleW;
  s += `<path d="M ${f1(-gi)} ${f1(grilleTop + 2)} L ${f1(gi)} ${f1(grilleTop + 2)} L ${f1(gi * .95)} ${f1(grilleBot - 2)} L ${f1(-gi * .95)} ${f1(grilleBot - 2)} Z" fill="#0b0d11" stroke="#05070a" stroke-width="2"/>`;
  for (let i = 1; i < 4; i++) {
    const yy = grilleTop + (grilleBot - grilleTop) * i / 4, k = 1 - i * .035;
    s += `<line x1="${f1(-gi * k)}" y1="${f1(yy)}" x2="${f1(gi * k)}" y2="${f1(yy)}" stroke="#454b55" stroke-width="2.4" opacity=".75"/>`;
  }
  s += `<ellipse cx="0" cy="${f1((grilleTop + grilleBot) / 2)}" rx="${f1(gi * .13)}" ry="${f1(fh * .07)}" fill="#9aa3ae" opacity=".5"/>`;
  // бампер
  const bumpTop = grilleBot, bumpBot = faceY;
  const bumpPath = `M ${f1(-bW * 1.01)} ${f1(bumpBot)} L ${f1(-bW * 1.01)} ${f1(bumpTop + 9)} Q ${f1(-bW * 1.01)} ${f1(bumpTop - 3)} ${f1(-bW * .92)} ${f1(bumpTop - 3)} L ${f1(bW * .92)} ${f1(bumpTop - 3)} Q ${f1(bW * 1.01)} ${f1(bumpTop - 3)} ${f1(bW * 1.01)} ${f1(bumpTop + 9)} L ${f1(bW * 1.01)} ${f1(bumpBot)} Z`;
  s += `<path d="${bumpPath}" fill="${col}"/>`;
  s += `<path d="${bumpPath}" fill="url(#gBodyV)"/>`;
  const lowH = (bumpBot - bumpTop) * .30;
  s += `<rect x="${f1(-bW * .94)}" y="${f1(bumpBot - lowH)}" width="${f1(bW * 1.88)}" height="${f1(lowH)}" rx="5" fill="#15171b" opacity=".9"/>`;
  if (B.skid) s += `<rect x="${f1(-bW * .52)}" y="${f1(bumpBot - lowH * 1.5)}" width="${f1(bW * 1.04)}" height="${f1(lowH * .7)}" rx="6" fill="#8a8d92" opacity=".65"/>`;
  // номерной знак на бампере
  const pc = Y(G.plateC);
  const pk = o.plateCond === 'angled' ? ` skewX(-6) rotate(-1.5)` : '';
  const pw = cw * .287, ph = pw * .215;
  s += `<g transform="translate(0 ${f1(pc)})${pk} scale(${f1(pw / 172)})">${plateSVG(o.plate, o.plateCond, night, o.rng)}</g>`;
  s += `<rect x="${f1(-pw * .38)}" y="${f1(pc - ph * .78)}" width="${f1(pw * .76)}" height="${f1(ph * .16)}" rx="3" fill="#0e0e10" opacity=".45"/>`;
  // блики кузова (глянец)
  s += `<path d="M ${f1(-bW * .9)} ${f1(cowlY + 16)} Q 0 ${f1(cowlY - 6)} ${f1(bW * .9)} ${f1(cowlY + 16)} L ${f1(bW * .93)} ${f1(cowlY + 34)} Q 0 ${f1(cowlY + 10)} ${f1(-bW * .93)} ${f1(cowlY + 34)} Z" fill="#fff" opacity="${night ? .05 : .15}"/>`;
  return s;
}

/* упрощённая машинка на дальнем плане (встречный поток — видны фары) */
function farCarSVG(x, y, sc, color, body) {
  const B = BODY[body] || BODY.sedan;
  const cw = 600 * B.w * sc, h = B.H * sc;
  const col = color, dark = shade(color, -.45);
  return `<g transform="translate(${f1(x)} ${f1(y)})"><ellipse cx="0" cy="3" rx="${f1(cw * .56)}" ry="${f1(10 * sc + 2)}" fill="#000" opacity=".33"/>` +
    `<rect x="${f1(-cw * .5)}" y="${f1(-h * .56)}" width="${f1(cw)}" height="${f1(h * .40)}" rx="${f1(8 * sc * 3)}" fill="${col}"/>` +
    `<path d="M ${f1(-cw * .4)} ${f1(-h * .56)} L ${f1(-cw * .3)} ${f1(-h * .95)} L ${f1(cw * .3)} ${f1(-h * .95)} L ${f1(cw * .4)} ${f1(-h * .56)} Z" fill="${shade(col, -.08)}"/>` +
    `<path d="M ${f1(-cw * .32)} ${f1(-h * .6)} L ${f1(-cw * .26)} ${f1(-h * .9)} L ${f1(cw * .26)} ${f1(-h * .9)} L ${f1(cw * .32)} ${f1(-h * .6)} Z" fill="#0f1620"/>` +
    `<rect x="${f1(-cw * .48)}" y="${f1(-h * .50)}" width="${f1(cw * .17)}" height="${f1(h * .1)}" fill="#f2f0e2" opacity=".95"/><rect x="${f1(cw * .31)}" y="${f1(-h * .50)}" width="${f1(cw * .17)}" height="${f1(h * .1)}" fill="#f2f0e2" opacity=".95"/>` +
    `<rect x="${f1(-cw * .46)}" y="${f1(-h * .2)}" width="${f1(cw * .92)}" height="${f1(h * .06)}" fill="${dark}"/><rect x="${f1(-cw * .1)}" y="${f1(-h * .36)}" width="${f1(cw * .2)}" height="${f1(h * .07)}" fill="#e9e9e4"/>` +
    `<rect x="${f1(-cw * .44)}" y="${f1(-h * .16)}" width="${f1(cw * .12)}" height="${f1(h * .16)}" fill="#0d0d0d"/><rect x="${f1(cw * .32)}" y="${f1(-h * .16)}" width="${f1(cw * .12)}" height="${f1(h * .16)}" fill="#0d0d0d"/></g>`;
}

/* ───────── окружение ───────── */
function skyColors(light, weather) {
  const t = { day: ['#5d9be6', '#bcd9f5'], dawn: ['#e7a07c', '#fbe0b0'], dusk: ['#37406e', '#e98d52'], night: ['#05070d', '#1a2238'] }[light];
  if (weather === 'overcast') return light === 'night' ? ['#0a0d14', '#1d2331'] : [mix(t[0], '#9aa1ac', .72), mix(t[1], '#c9ced6', .7)];
  if (weather === 'rain') return light === 'night' ? ['#06080e', '#161c2a'] : [mix(t[0], '#6d7480', .78), mix(t[1], '#aab0b9', .72)];
  if (weather === 'fog') return [mix(t[0], '#c9cdd2', .8), mix(t[1], '#dfe2e5', .85)];
  if (weather === 'snow') return light === 'night' ? ['#0d1119', '#2a3345'] : [mix(t[0], '#b3b9c2', .75), mix(t[1], '#e1e4e8', .8)];
  return t;
}

function backdrop(o, rng, VPx, VPy, roadHalfAtBottom) {
  const night = o.light === 'night', dusk = o.light === 'dusk' || o.light === 'dawn';
  const tint = night ? .86 : dusk ? .35 : 0;
  const dk = c => night ? mix(c, '#05070b', .85) : dusk ? mix(c, '#2a2438', .38) : c;
  let s = '';
  const horizon = VPy + 4;
  const bld = [];
  if (o.road === 'tunnel') {
    s += `<rect x="0" y="0" width="${W}" height="${H}" fill="#171a1f"/>`;
    // стены и свод в перспективе
    s += `<polygon points="0,0 ${W},0 ${VPx + 120},${VPy - 70} ${VPx - 120},${VPy - 70}" fill="#23272e"/>`;
    s += `<polygon points="0,0 ${VPx - 120},${VPy - 70} ${VPx - 120},${VPy + 60} 0,${H}" fill="#1c2026"/>`;
    s += `<polygon points="${W},0 ${VPx + 120},${VPy - 70} ${VPx + 120},${VPy + 60} ${W},${H}" fill="#1c2026"/>`;
    for (let i = 0; i < 9; i++) { // светильники на потолке
      const u = 0.75 + i * 0.62, t = 1 / u, y = VPy - 70 + (0 - (VPy - 70)) * t;
      const half = 120 + (VPx - 120) * t * .55;
      s += `<rect x="${f1(VPx - half * .35)}" y="${f1(y)}" width="${f1(half * .7)}" height="${f1(Math.max(3, 14 * t))}" fill="#ffe9b0" opacity="${f1(.55 + .1 * (i % 2))}"/>`;
    }
    s += `<ellipse cx="${VPx}" cy="${VPy}" rx="110" ry="85" fill="#cfe8ff" opacity="${night ? .55 : .95}"/>`;
    s += `<ellipse cx="${VPx}" cy="${VPy}" rx="170" ry="120" fill="url(#gGlow)" opacity=".5"/>`;
    return s;
  }
  // небо
  s += `<rect x="0" y="0" width="${W}" height="${horizon + 30}" fill="url(#gSky)"/>`;
  if (o.light === 'night') for (let i = 0; i < 40; i++) s += `<circle cx="${rng.int(0, W)}" cy="${rng.int(0, Math.max(10, VPy - 30))}" r="${f1(rng.float(.5, 1.3))}" fill="#fff" opacity="${f1(rng.float(.3, .8))}"/>`;
  if (o.light === 'day' && o.weather === 'clear') s += `<circle cx="${rng.int(160, 1120)}" cy="${rng.int(18, 60)}" r="46" fill="#fffbe6" opacity=".9"/><circle cx="${rng.int(160, 1120)}" cy="${rng.int(18, 60)}" r="2" fill="#fff" opacity="0"/>`;
  if (o.weather === 'clear' || o.weather === 'overcast') for (let i = 0; i < 5; i++) { const cx = rng.int(0, W), cy = rng.int(10, Math.max(20, VPy - 20)); s += `<ellipse cx="${cx}" cy="${cy}" rx="${rng.int(70, 190)}" ry="${rng.int(10, 26)}" fill="#fff" opacity="${o.light === 'night' ? .05 : o.weather === 'overcast' ? .25 : .45}" filter="url(#fBlur6)"/>`; }
  // дальний план: здания / лес
  const baseY = horizon + 6;
  if (o.road === 'highway') {
    for (let i = 0; i < 26; i++) {
      const x = rng.int(-40, W + 40), r = rng.int(30, 70);
      s += `<ellipse cx="${x}" cy="${baseY - 10}" rx="${r}" ry="${rng.int(22, 46)}" fill="${dk(['#2f5a35', '#3a6a3a', '#27502f', '#46733f'][rng.int(0, 3)])}"/>`;
    }
  } else {
    for (let side = -1; side <= 1; side += 2) {
      let x = side < 0 ? 0 : W;
      for (let i = 0; i < 12; i++) {
        const w = rng.int(60, 150), hh = rng.int(70, 230);
        const xx = side < 0 ? x : x - w;
        const tone = ['#9aa3ad', '#b8b1a6', '#8f98a6', '#a9a39a', '#b9c0c8', '#7e8794'][rng.int(0, 5)];
        const c = dk(tone);
        s += `<rect x="${f1(xx)}" y="${f1(baseY - hh)}" width="${w}" height="${hh}" fill="${c}"/>`;
        if (night || dusk) for (let wy = baseY - hh + 8; wy < baseY - 10; wy += 16) for (let wx = xx + 6; wx < xx + w - 8; wx += 14) if (rng.chance(night ? .45 : .22)) s += `<rect x="${f1(wx)}" y="${f1(wy)}" width="7" height="9" fill="#ffd98a" opacity=".85"/>`;
        else if (!night && rng.chance(.5)) s += `<rect x="${f1(wx)}" y="${f1(wy)}" width="7" height="9" fill="${shade(c, -.22)}" opacity=".7"/>`;
        x += (side < 0 ? 1 : -1) * (w - rng.int(0, 20));
        if ((side < 0 && x > VPx - 80) || (side > 0 && x < VPx + 80)) break;
      }
    }
    for (let i = 0; i < 16; i++) { // деревья
      const x = rng.int(0, W);
      if (Math.abs(x - VPx) < 100) continue;
      s += `<ellipse cx="${x}" cy="${baseY - 10}" rx="${rng.int(20, 38)}" ry="${rng.int(22, 38)}" fill="${dk(['#3f6b3a', '#4a7840', '#35603a', '#6b7a3a'][rng.int(0, 3)])}" opacity=".95"/>`;
    }
  }
  s += `<rect x="0" y="${baseY - 8}" width="${W}" height="${H}" fill="${dk(o.road === 'highway' ? '#4e7a45' : '#7d8088')}"/>`;
  return s;
}

function roadScene(o, rng, g) {
  const { VPx, VPy, yc, tC, laneWb, L, roadCx } = g;
  const night = o.light === 'night';
  const asphalt = night ? '#14161a' : o.weather === 'snow' ? '#7e8187' : o.weather === 'rain' ? '#2c2f35' : '#43474e';
  const edge = o.weather === 'snow' ? '#e9edf2' : '#bdc2c8';
  const xb = j => roadCx + (j - L / 2) * laneWb;                 // x на нижней границе кадра для разделителя j
  const xat = (xB, y) => VPx + (xB - VPx) * (y - VPy) / (H - VPy);
  let s = '';
  const left = xb(0) - laneWb * .55, right = xb(L) + laneWb * .55;
  if (o.road === 'tunnel') {
    s += `<polygon points="${f1(VPx - 90)},${VPy + 40} ${f1(VPx + 90)},${VPy + 40} ${f1(xat(right, H))},${H} ${f1(xat(left, H))},${H}" fill="${asphalt}"/>`;
    s += `<polygon points="${f1(VPx - 90)},${VPy + 40} ${f1(VPx + 90)},${VPy + 40} ${W},${H} 0,${H}" fill="${asphalt}"/>`;
  } else {
    s += `<polygon points="${VPx},${VPy + 4} ${W + 400},${H} -400,${H}" fill="${asphalt}"/>`;
    // тротуары / обочина
    const shL = night ? '#2a2c31' : '#8a8d93', shR = shL;
    s += `<polygon points="${VPx},${VPy + 4} ${f1(xb(0) - laneWb * .62)},${H} -400,${H}" fill="${o.road === 'highway' ? (night ? '#1a2a1a' : '#4f7a45') : shL}"/>`;
    s += `<polygon points="${VPx},${VPy + 4} ${f1(xb(L) + laneWb * .62)},${H} ${W + 400},${H}" fill="${o.road === 'highway' ? (night ? '#1a2a1a' : '#4f7a45') : shR}"/>`;
    // бордюр
    s += `<line x1="${VPx}" y1="${VPy + 4}" x2="${f1(xb(0) - laneWb * .62)}" y2="${H}" stroke="${night ? '#303238' : '#c3c6cb'}" stroke-width="5"/><line x1="${VPx}" y1="${VPy + 4}" x2="${f1(xb(L) + laneWb * .62)}" y2="${H}" stroke="${night ? '#303238' : '#c3c6cb'}" stroke-width="5"/>`;
  }
  // боковые линии
  s += `<polygon points="${f1(xat(xb(0) - 8, VPy + 6))},${VPy + 6} ${f1(xat(xb(0) + 8, VPy + 6))},${VPy + 6} ${f1(xb(0) + 10)},${H} ${f1(xb(0) - 10)},${H}" fill="${edge}" opacity="${night ? .55 : .85}"/>`;
  s += `<polygon points="${f1(xat(xb(L) - 8, VPy + 6))},${VPy + 6} ${f1(xat(xb(L) + 8, VPy + 6))},${VPy + 6} ${f1(xb(L) + 10)},${H} ${f1(xb(L) - 10)},${H}" fill="${edge}" opacity="${night ? .55 : .85}"/>`;
  // пунктир (в перспективе)
  for (let j = 1; j < L; j++) {
    for (let n = 0; n < 16; n++) {
      const u0 = 0.72 + n * 0.5, u1 = u0 + 0.25;
      const y0 = VPy + (H - VPy) / u0, y1 = VPy + (H - VPy) / u1;
      if (y0 > H + 20) continue;
      const wd = 7;
      s += `<polygon points="${f1(xat(xb(j) - wd, y1))},${f1(y1)} ${f1(xat(xb(j) + wd, y1))},${f1(y1)} ${f1(xat(xb(j) + wd, y0) + 0)},${f1(y0)} ${f1(xat(xb(j) - wd, y0))},${f1(y0)}" fill="#f2f2ee" opacity="${night ? .6 : .88}"/>`;
    }
  }
  // стрелки / текстура асфальта
  s += `<rect x="0" y="${VPy}" width="${W}" height="${H - VPy}" fill="url(#gRoadFade)"/>`;
  if (o.weather === 'rain') s += `<rect x="0" y="${VPy + 40}" width="${W}" height="${H - VPy - 40}" fill="url(#gWet)" opacity="${night ? .85 : .5}"/>`;
  // опоры освещения / ограждения
  if (o.road === 'highway' || o.road === 'bridge') {
    for (const side of [0, L]) {
      for (let n = 0; n < 10; n++) {
        const u = 0.8 + n * 0.46, y = VPy + (H - VPy) / u, x = xat(xb(side) + (side === 0 ? -laneWb * .75 : laneWb * .75), y);
        const ph = 120 / u;
        if (x < -80 || x > W + 80 || y - ph > H) continue;   // за кадром
        s += `<rect x="${f1(x - 2.5 / u)}" y="${f1(y - ph)}" width="${f1(Math.max(1.2, 5 / u))}" height="${f1(ph)}" fill="${night ? '#20232a' : '#9aa0a8'}"/>`;
        s += `<rect x="${f1(x - 22 / u * (side === 0 ? -1 : 1) - (side === 0 ? 0 : 0))}" y="${f1(y - ph - 2 / u)}" width="${f1(22 / u)}" height="${f1(Math.max(1.4, 4 / u))}" fill="${night ? '#ffe9a8' : '#c9ced4'}" opacity="${night ? .95 : .8}"/>`;
        if (night) s += `<ellipse cx="${f1(x)}" cy="${f1(y - ph)}" rx="${f1(42 / u)}" ry="${f1(26 / u)}" fill="url(#gGlow)" opacity=".5"/>`;
      }
    }
    // отбойник
    s += `<line x1="${VPx}" y1="${VPy + 6}" x2="${f1(xb(0) - laneWb * .75)}" y2="${H}" stroke="${night ? '#3b3f46' : '#aeb3ba'}" stroke-width="7"/><line x1="${VPx}" y1="${VPy + 6}" x2="${f1(xb(L) + laneWb * .75)}" y2="${H}" stroke="${night ? '#3b3f46' : '#aeb3ba'}" stroke-width="7"/>`;
  } else if (o.road === 'city') {
    for (const side of [0, L]) {
      for (let n = 0; n < 8; n++) {
        const u = 0.9 + n * 0.5, y = VPy + (H - VPy) / u, x = xat(xb(side) + (side === 0 ? -laneWb * .7 : laneWb * .7), y);
        const ph = 150 / u;
        if (x < -80 || x > W + 80 || y - ph > H) continue;   // за кадром
        s += `<rect x="${f1(x - 2 / u)}" y="${f1(y - ph)}" width="${f1(Math.max(1.2, 4 / u))}" height="${f1(ph)}" fill="${night ? '#1d2027' : '#6c727b'}"/>`;
        if (night) s += `<ellipse cx="${f1(x)}" cy="${f1(y - ph)}" rx="${f1(30 / u)}" ry="${f1(20 / u)}" fill="url(#gGlow)" opacity=".5"/>`;
      }
    }
  }
  return s;
}

function weatherFX(o, rng) {
  let s = '';
  if (o.weather === 'rain') {
    for (let i = 0; i < 170; i++) {
      const x = rng.int(0, W), y = rng.int(0, H), l = rng.int(24, 60);
      s += `<line x1="${x}" y1="${y}" x2="${x - 5}" y2="${y + l}" stroke="#dfe8f5" stroke-width="${f1(rng.float(.6, 1.4))}" opacity="${f1(rng.float(.12, .3))}"/>`;
    }
  } else if (o.weather === 'snow') {
    for (let i = 0; i < 160; i++) s += `<circle cx="${rng.int(0, W)}" cy="${rng.int(0, H)}" r="${f1(rng.float(1, 3.6))}" fill="#fff" opacity="${f1(rng.float(.4, .9))}"/>`;
  } else if (o.weather === 'fog') {
    s += `<rect width="${W}" height="${H}" fill="url(#gFog)"/>`;
  }
  return s;
}

/* ───────── сборка снимка ───────── */
function renderSnapshot(fix, veh, colorHexByName) {
  const sc = fix.scene;
  const rng = new RNG(sc.seed);
  const body = veh.body in BODY ? veh.body : 'sedan';
  const B = BODY[body];
  const colorHex = colorHexByName[veh.color] || '#9aa0a8';
  const o = { light: sc.light, weather: sc.weather, road: sc.road, plateCond: sc.plateCond, body, color: colorHex, plate: fix.plate, rng, braking: rng.chance(.28) };
  const night = o.light === 'night';

  // геометрия
  const dist = sc.distance;                                  // 14..38 условных метров
  let s = 0.62 + 0.38 * (38 - dist) / 24;
  const VPx = 640 + rng.int(-60, 60), VPy = rng.int(110, 160);
  const L = Math.max(2, Math.min(4, Math.max(fix.lane, 2)) + (rng.chance(.4) ? 1 : 0));
  const lane = Math.min(fix.lane, L) - 1;
  let yc = 560 + 118 * s;
  const Wc = 600 * B.w * s;
  const hMax = yc - 34;
  if (B.H * s > hMax) s = hMax / B.H, yc = 560 + 118 * s;
  const Wc2 = 600 * B.w * s;
  const laneWpx = Wc2 * 1.95;                                 // ширина полосы на глубине авто
  const tC = (yc - VPy) / (H - VPy);
  const laneWb = laneWpx / tC;
  /* машина всегда в кадре: сначала выбираем её положение по горизонтали (слегка зависит от номера полосы),
     затем вычисляем, где проходит ось дороги */
  const xcar = Math.max(300, Math.min(980, 640 + (lane - (L - 1) / 2) * 110 + rng.int(-70, 70)));
  const xbCenter = VPx + (xcar - VPx) / tC;                    // x центра полосы на нижней границе кадра
  const roadCx = xbCenter - (lane + .5 - L / 2) * laneWb;
  const g = { VPx, VPy, yc, tC, laneWb, L, roadCx };

  // палитры
  const [skyT, skyB] = skyColors(o.light, o.weather);
  const bright = night ? .34 : o.light === 'dusk' ? .72 : o.light === 'dawn' ? .85 : o.weather === 'overcast' || o.weather === 'rain' ? .86 : 1;
  const haze = o.weather === 'fog' ? .6 : 0;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice">`;
  svg += `<defs>
<linearGradient id="gSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyT}"/><stop offset="1" stop-color="${skyB}"/></linearGradient>
<linearGradient id="gBodyV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".30"/><stop offset=".45" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>
<linearGradient id="gBodyH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".82" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
<linearGradient id="gGlass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fb3d4" stop-opacity="${night ? .08 : .34}"/><stop offset=".5" stop-color="#1a2735" stop-opacity=".55"/><stop offset="1" stop-color="#0b1119" stop-opacity=".75"/></linearGradient>
<radialGradient id="gGlow"><stop offset="0" stop-color="#ff4a3a" stop-opacity=".95"/><stop offset=".45" stop-color="#ff3a2a" stop-opacity=".35"/><stop offset="1" stop-color="#ff2a1a" stop-opacity="0"/></radialGradient>
<radialGradient id="gGlowW"><stop offset="0" stop-color="#fff6d8" stop-opacity=".95"/><stop offset=".5" stop-color="#ffe9b0" stop-opacity=".35"/><stop offset="1" stop-color="#ffe4a0" stop-opacity="0"/></radialGradient>
<linearGradient id="gLamp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf2"/><stop offset=".45" stop-color="#f4f0dc"/><stop offset="1" stop-color="#d9d3b8"/></linearGradient>
<linearGradient id="gHood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".45" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
<linearGradient id="gRoadFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyB}" stop-opacity="${f1(.55 + haze * .4)}"/><stop offset=".25" stop-color="${skyB}" stop-opacity="${f1(.12 + haze * .3)}"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="gWet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd8e6" stop-opacity=".0"/><stop offset=".5" stop-color="#cfd8e6" stop-opacity=".22"/><stop offset="1" stop-color="#cfd8e6" stop-opacity=".05"/></linearGradient>
<linearGradient id="gFog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7dadd" stop-opacity=".75"/><stop offset=".6" stop-color="#d7dadd" stop-opacity=".42"/><stop offset="1" stop-color="#d7dadd" stop-opacity=".18"/></linearGradient>
<radialGradient id="gVig" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${night ? .62 : .42}"/></radialGradient>
<filter id="fBlur6"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="fBlur2" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><feGaussianBlur stdDeviation="${o.weather === 'fog' ? 3 : 1.6}"/></filter>
<filter id="fSoft" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><feGaussianBlur stdDeviation="0.55"/></filter>
<filter id="fNoise" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${sc.seed % 997}"/><feColorMatrix type="matrix" values="0 0 0 0 0.5 0 0 0 0 0.5 0 0 0 0 0.5 1.6 0 0 0 -0.62"/></filter>
</defs>`;

  // сцена
  svg += `<g filter="url(#fSoft)"><g filter="url(#fBlur2)">${backdrop(o, rng, VPx, VPy, laneWb)}</g>`;
  svg += roadScene(o, rng, g);
  // попутный транспорт на дальнем плане
  const farCols = ['#b9bdc4', '#e4e5e8', '#20222a', '#7b808a', '#a31f24', '#1f3f7a'];
  for (let i = 0; i < rng.int(1, 3); i++) {
    const fl = rng.int(0, L - 1);
    if (fl === lane && rng.chance(.7)) continue;
    const fs = rng.float(.1, .2), fy = VPy + (H - VPy) * ((fs * 0.9 + .1) * .34);
    const fx = VPx + (roadCx + (fl + .5 - L / 2) * laneWb - VPx) * ((fy - VPy) / (H - VPy));
    svg += farCarSVG(fx, fy, fs * (fy - VPy) / 160, rng.pick(farCols), rng.pick(['sedan', 'hatch', 'suv']));
  }
  // главный автомобиль
  svg += `<g transform="translate(${f1(xcar)} ${f1(yc)}) scale(${f1(s)})">${carSVG(o)}</g>`;
  svg += `</g>`;

  // освещение сцены
  if (o.light === 'night') svg += `<rect width="${W}" height="${H}" fill="#0a1020" opacity=".42"/>`;
  else if (o.light === 'dusk') svg += `<rect width="${W}" height="${H}" fill="#ff8f4a" opacity=".12"/>`;
  else if (o.light === 'dawn') svg += `<rect width="${W}" height="${H}" fill="#ffc58a" opacity=".10"/>`;
  svg += weatherFX(o, rng);
  // ИК-подсветка: номер на ночных кадрах «выбит» бликом
  if (o.light === 'night') {
    const pcl = -B.H * frontGeom(B).plateC;   // y номера в локальных координатах
    svg += `<ellipse cx="${f1(xcar)}" cy="${f1(yc + pcl * s)}" rx="${f1(120 * s)}" ry="${f1(34 * s)}" fill="#fffbe8" opacity=".16" filter="url(#fBlur6)"/>`;
  }
  if (o.light === 'day' && o.weather === 'clear' && rng.chance(.4)) svg += `<ellipse cx="${rng.int(200, 1100)}" cy="${rng.int(10, 70)}" rx="260" ry="120" fill="#fff4cc" opacity=".12" filter="url(#fBlur6)"/>`;
  // оптика камеры
  svg += `<rect width="${W}" height="${H}" fill="url(#gVig)"/>`;
  svg += `<rect width="${W}" height="${H}" filter="url(#fNoise)" opacity="${night ? .55 : o.weather === 'fog' ? .22 : .32}"/>`;
  if (bright < 1) svg += `<rect width="${W}" height="${H}" fill="#000" opacity="${f1((1 - bright) * .35)}"/>`;
  svg += `</svg>`;
  /* геометрия объектов (доли кадра) — для рамок детектора и увеличенных кадров в «фотоматериале» */
  const hwL = 600 * B.w / 2, bWL = hwL * B.beltW, lwL = hwL * B.lampW * 2;
  const GG = frontGeom(B);
  const tTopL = -B.H * GG.lampTop, tBotL = -B.H * GG.lampBot;      // полоса фар
  const pcL = -B.H * GG.plateC;                                    // номер
  const plateW = 600 * B.w * .287, plateH = plateW * .215;
  const r4 = v => Math.round(v * 10000) / 10000;
  const box = (x0, y0, x1, y1) => [r4(Math.max(0, x0) / W), r4(Math.max(0, y0) / H), r4((Math.min(W, x1) - Math.max(0, x0)) / W), r4((Math.min(H, y1) - Math.max(0, y0)) / H)];
  const geom = {
    car: box(xcar - Wc2 / 2, yc - B.H * s, xcar + Wc2 / 2, yc),
    plate: box(xcar - plateW / 2 * s, yc + (pcL - plateH / 2) * s, xcar + plateW / 2 * s, yc + (pcL + plateH / 2) * s),
    lights: [box(xcar - (bWL - 2) * s, yc + tTopL * s, xcar - (bWL - 2 - lwL) * s, yc + tBotL * s), box(xcar + (bWL - 2 - lwL) * s, yc + tTopL * s, xcar + (bWL - 2) * s, yc + tBotL * s)],
  };
  return { svg, geom };
}

module.exports = { renderSnapshot, BODY, shade };
