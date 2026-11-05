// Сценарные данные из scenarios/*/*.json: состав взвода, ловушки, пресеты, параметры генератора.
'use strict';
const SCENARIOS = { cadets: __DATA.cadets, traps: __DATA.traps, presets: __DATA.presets, sliders: __DATA.generatorSliders };
const icon = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const fmtSlider = (sl, v) => `${sl.prefix||''}${v}${sl.suffix||''}`;
SCENARIOS.sliders.forEach(sl => { STATE.instructorSettings[sl.key] = sl.default; });
function sliderRowHTML(sl) {
  const v = STATE.instructorSettings[sl.key];
  return `<div class="slider-row"><div class="slider-label"><span>${icon(sl.icon)} ${sl.label}</span><span id="sl-${sl.key}-val">${fmtSlider(sl, v)}</span></div>
    <input type="range" min="${sl.min}" max="${sl.max}" value="${v}" oninput="updateSlider('${sl.key}',this.value)"><div class="form-hint">${sl.hint}</div></div>`;
}
