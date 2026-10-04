'use strict';
/* Waylight — utilities: seeded RNG, value noise, math helpers */

const U = (() => {
  // Mulberry32 seeded RNG
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash2(x, y, seed) {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) >>> 0; h = Math.imul(h, 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // Value noise with smooth interpolation
  function noise2(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
    const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, seed, oct = 3, lac = 2.1, gain = 0.5) {
    let amp = 1, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += amp * noise2(x * freq, y * freq, seed + i * 77);
      norm += amp; amp *= gain; freq *= lac;
    }
    return sum / norm;
  }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - (1 - t) * (1 - t);
  const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  // distance from point to segment
  function segDist(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = clamp(t, 0, 1);
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }
  // sample a polyline at parameter t in [0,1] of its total length
  function polyLen(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    return L;
  }
  function polyAt(pts, d) {
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const seg = dist(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      if (acc + seg >= d) {
        const t = (d - acc) / seg;
        return {
          x: lerp(pts[i - 1][0], pts[i][0], t), y: lerp(pts[i - 1][1], pts[i][1], t),
          ang: Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])
        };
      }
      acc += seg;
    }
    const n = pts.length - 1;
    return { x: pts[n][0], y: pts[n][1], ang: Math.atan2(pts[n][1] - pts[n - 1][1], pts[n][0] - pts[n - 1][0]) };
  }
  function fmtKg(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function fmtTime(s) {
    s = Math.max(0, Math.round(s));
    const m = Math.floor(s / 60), r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }
  function fmtDist(u) { // world units -> meters feel (1u = 1m)
    return u >= 1000 ? (u / 1000).toFixed(1) + ' km' : Math.round(u) + ' m';
  }
  function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }
  let _uid = 1;
  const uid = () => (_uid++);
  const setUidFloor = v => { _uid = Math.max(_uid, v); };
  const el = id => document.getElementById(id);
  function html(parent, markup) { parent.insertAdjacentHTML('beforeend', markup); return parent.lastElementChild; }
  return { rng, hash2, fbm, clamp, lerp, smooth, easeOut, easeInOut, dist, segDist, polyLen, polyAt, fmtKg, fmtTime, fmtDist, pick, uid, setUidFloor, el, html };
})();


