'use strict';
/* Детерминированный генератор псевдослучайных чисел (mulberry32).
   Одинаковый seed => одинаковые базы данных и снимки при каждой пересборке. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class RNG {
  constructor(seed) { this.r = mulberry32(seed); }
  next() { return this.r(); }
  int(a, b) { return a + Math.floor(this.r() * (b - a + 1)); }
  float(a, b) { return a + this.r() * (b - a); }
  chance(p) { return this.r() < p; }
  pick(arr) { return arr[Math.floor(this.r() * arr.length)]; }
  /* weighted([[value, weight], ...]) */
  weighted(pairs) {
    let total = 0; for (const p of pairs) total += p[1];
    let x = this.r() * total;
    for (const p of pairs) { x -= p[1]; if (x < 0) return p[0]; }
    return pairs[pairs.length - 1][0];
  }
  digits(n) { let s = ''; for (let i = 0; i < n; i++) s += this.int(0, 9); return s; }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(this.r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  sample(arr, n) { return this.shuffle(arr).slice(0, n); }
}

module.exports = { RNG, mulberry32 };
