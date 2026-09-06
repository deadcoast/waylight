'use strict';
/* Waylight — world: heightfield, rivers, classification, terrain paint, light/mist, pathfinding */

const World = (() => {
  const { W, H, features, rivers, stations, T } = DATA;
  const SEED = 20260830;

  // grids
  const HS = 12, CS = 6, LS = 24, TS = 5;            // world units per cell / px
  const HW = Math.ceil(W / HS) + 1, HH = Math.ceil(H / HS) + 1;
  const CW = Math.ceil(W / CS), CH = Math.ceil(H / CS);
  const LW = Math.ceil(W / LS), LH = Math.ceil(H / LS);
  const TW = Math.ceil(W / TS), TH = Math.ceil(H / TS);

  const hgt = new Float32Array(HW * HH);
  const rivD = new Float32Array(HW * HH).fill(9999);
  const rivI = new Uint8Array(HW * HH).fill(255);
  const cls = new Uint8Array(CW * CH);
  const lightG = new Float32Array(LW * LH);

  // classes
  const MEADOW = 0, FOREST = 1, SCREE = 2, ROCK = 3, SNOW = 4, MARSH = 5, SHALLOW = 6, DEEP = 7, CLIFF = 8, PAD = 9;
  const CP = [ // speedMul, drain/s, wobble base rate (/s), name
    [1.00, 0.0, 0.020, 'meadow'],
    [0.88, 0.5, 0.055, 'forest'],
    [0.78, 1.2, 0.170, 'scree'],
    [0.85, 0.8, 0.100, 'rock'],
    [0.72, 1.6, 0.120, 'snowfield'],
    [0.62, 1.8, 0.100, 'marsh'],
    [0.55, 9.0, 0.230, 'shallows'],
    [0.00, 0.0, 0.000, 'deep water'],
    [0.00, 0.0, 0.000, 'cliff'],
    [1.00, 0.0, 0.005, 'station yard'],
  ];

  /* ---------- analytic height ---------- */
  function heightFn(x, y) {
    let h = 0.30;
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      const dx = (x - f.x) / f.rx, dy = (y - f.y) / f.ry;
      const d2 = dx * dx + dy * dy;
      if (d2 < 9) h += f.h * Math.exp(-d2 * 1.6);
    }
    h += (U.fbm(x / 1040, y / 1040, SEED, 3) - 0.5) * 0.30;
    h += (U.fbm(x / 184, y / 184, SEED + 5, 2) - 0.5) * 0.075;
    return h;
  }

  const hIdx = (cx, cy) => cy * HW + cx;
  function hgtAt(x, y) {
    const gx = U.clamp(x / HS, 0, HW - 1.001), gy = U.clamp(y / HS, 0, HH - 1.001);
    const x0 = gx | 0, y0 = gy | 0, fx = gx - x0, fy = gy - y0;
    const a = hgt[hIdx(x0, y0)], b = hgt[hIdx(x0 + 1, y0)], c = hgt[hIdx(x0, y0 + 1)], d = hgt[hIdx(x0 + 1, y0 + 1)];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  function riverAt(x, y) {
    const gx = U.clamp(x / HS, 0, HW - 1.001), gy = U.clamp(y / HS, 0, HH - 1.001);
    const x0 = gx | 0, y0 = gy | 0, fx = gx - x0, fy = gy - y0;
    const a = rivD[hIdx(x0, y0)], b2 = rivD[hIdx(x0 + 1, y0)], c = rivD[hIdx(x0, y0 + 1)], d2 = rivD[hIdx(x0 + 1, y0 + 1)];
    const dist = a + (b2 - a) * fx + (c - a) * fy + (a - b2 - c + d2) * fx * fy;
    return { dist, idx: rivI[hIdx(Math.round(gx), Math.round(gy))] };
  }
  function slopeAt(x, y) {
    const e = 10;
    const sx = (hgtAt(x + e, y) - hgtAt(x - e, y)) / (2 * e) * 840; // meters per unit
    const sy = (hgtAt(x, y + e) - hgtAt(x, y - e)) / (2 * e) * 840;
    return { sx, sy, mag: Math.hypot(sx, sy) };
  }

  /* ---------- station pads: guaranteed calm footing ---------- */
  const pads = Object.values(stations).map(d => ({ x: d.x, y: d.y }));
  function onPad(x, y) {
    for (let i = 0; i < pads.length; i++) {
      const dx = x - pads[i].x, dy = y - pads[i].y;
      if (dx * dx + dy * dy < 130 * 130) return true;
    }
    return false;
  }

  /* ---------- classification ---------- */
  // riverbanks: the carve makes them steep, but a bank is a bank — you can always walk down to the water
  const BANK = 2.6;
  function nearRiver(rd, ri) { return ri !== 255 && rd < rivers[ri].w * BANK; }
  function classify(x, y, h, rd, ri, slope) {
    if (onPad(x, y)) return PAD;
    if (ri !== 255) {
      const rw = rivers[ri].w;
      if (rd < rw * (rivers[ri].deep ? 0.66 : 0.9)) return rivers[ri].deep ? DEEP : SHALLOW;
      if (rd < rw * 1.15) return SHALLOW;
      if (rd < rw * 1.8 && h < 0.34) return MARSH;
      if (rd < rw * BANK) return slope > 0.42 ? SCREE : (h < 0.34 ? MARSH : MEADOW);
    }
    if (slope > 0.62) return CLIFF;
    if (h > 0.865) return SNOW;
    if (h > 0.73) return ROCK;
    const n = U.fbm(x / 380, y / 380, SEED + 11, 2);
    if (h > 0.5 && n > 0.63) return SCREE;
    if (slope > 0.48) return SCREE;
    const f = U.fbm(x / 520, y / 520, SEED + 23, 2);
    if (h < 0.52 && f > 0.585) return FOREST;
    return MEADOW;
  }
  function classAt(x, y) {
    const cx = U.clamp((x / CS) | 0, 0, CW - 1), cy = U.clamp((y / CS) | 0, 0, CH - 1);
    return cls[cy * CW + cx];
  }

  /* ---------- terrain query for movement ---------- */
  function terrainAt(x, y) {
    if (x < 12 || y < 12 || x > W - 12 || y > H - 12) return { cls: CLIFF, p: CP[CLIFF], blocked: true, water: false, slope: 0 };
    if (onPad(x, y)) return { cls: PAD, p: CP[PAD], blocked: false, water: false, slope: 0, sx: 0, sy: 0 };
    const c = classAt(x, y);
    const s = slopeAt(x, y);
    // what you see is what stops you: only painted cliffs and deep water block (no invisible sub-cell walls)
    const blocked = c === CLIFF || c === DEEP;
    return { cls: c, p: CP[c], blocked, water: c === SHALLOW || c === DEEP, slope: s.mag, sx: s.sx, sy: s.sy };
  }

  /* ---------- light & mist ---------- */
  let sources = []; // {x,y,r}
  function setSources(list) { sources = list; rebuildLight(); }
  function lightAt(x, y) {
    let L = 0;
    for (let i = 0; i < sources.length; i++) {
      const s = sources[i];
      const d = U.dist(x, y, s.x, s.y);
      if (d < s.r) { const v = 1 - d / s.r; L = Math.max(L, U.smooth(U.clamp(v * 1.35, 0, 1))); }
    }
    return L;
  }
  function mistBase(x, y) {
    let m = 0.10 + 0.95 * Math.pow(1 - y / H, 1.15);
    m += (U.fbm(x / 1400, y / 1400, SEED + 31, 2) - 0.5) * 0.16;
    return U.clamp(m, 0, 1);
  }
  function mistAt(x, y) { return U.clamp(mistBase(x, y) * (1 - lightAt(x, y) * 1.2), 0, 1); }

  const veilC = document.createElement('canvas'); veilC.width = LW; veilC.height = LH;
  const glowC = document.createElement('canvas'); glowC.width = LW; glowC.height = LH;
  const mistC = document.createElement('canvas'); mistC.width = LW; mistC.height = LH;
  const overlayC = document.createElement('canvas'); overlayC.width = LW; overlayC.height = LH; // veil+glow+mist precomposited
  function rebuildLight() {
    const vx = veilC.getContext('2d'), gx = glowC.getContext('2d'), mx = mistC.getContext('2d'), ox = overlayC.getContext('2d');
    const vd = vx.createImageData(LW, LH), gd = gx.createImageData(LW, LH), md = mx.createImageData(LW, LH), od = ox.createImageData(LW, LH);
    for (let cy = 0; cy < LH; cy++) for (let cx = 0; cx < LW; cx++) {
      const x = cx * LS + LS / 2, y = cy * LS + LS / 2;
      const L = lightAt(x, y);
      lightG[cy * LW + cx] = L;
      const m = U.clamp(mistBase(x, y) * (1 - L * 1.2), 0, 1);
      const i = (cy * LW + cx) * 4;
      /* the founding rule of the game, enforced here: lit land and grey land must not read as the same world.
         unlit — a cold blue-dark veil and the mist body. lit — the veil burns off entirely and a warm wash
         lifts the ground toward gold. between them, a bright rim where the light ends: the boundary wraiths burn at. */
      const veilA = U.clamp((1 - Math.pow(L, 0.6)) * 0.62 + m * 0.10, 0, 0.80);
      vd.data[i] = 8; vd.data[i + 1] = 11; vd.data[i + 2] = 22;
      vd.data[i + 3] = Math.round(veilA * 255);
      const mb = mistBase(x, y);
      const warmA = U.clamp(Math.pow(L, 0.85) * 0.28 * U.clamp(0.5 + mb * 0.7, 0, 1), 0, 0.28);
      const rimA = Math.pow(Math.max(0, 1 - Math.abs(L - 0.30) / 0.10), 2) * 0.20;
      // glowC is the punch-through layer: at night the render screens it over the dark, so the network reads as lit ground, not lamps
      gd.data[i] = 255; gd.data[i + 1] = 200; gd.data[i + 2] = 125;
      gd.data[i + 3] = Math.round(Math.pow(L, 0.9) * 255);
      // mist body
      const mv = U.clamp(m, 0, 1);
      md.data[i] = 138; md.data[i + 1] = 146; md.data[i + 2] = 168;
      md.data[i + 3] = Math.round(Math.pow(mv, 1.25) * 0.82 * 255);
      // precomposite: veil -> warm wash -> rim -> mist (straight-alpha source-over)
      let r = 0, g = 0, bb = 0, a = 0;
      const over = (cr, cg, cb, ca) => { const na = ca + a * (1 - ca); if (na > 0) { r = (cr * ca + r * a * (1 - ca)) / na; g = (cg * ca + g * a * (1 - ca)) / na; bb = (cb * ca + bb * a * (1 - ca)) / na; } a = na; };
      over(8, 11, 22, veilA);
      over(255, 208, 140, warmA);
      over(255, 236, 178, rimA);
      over(138, 146, 168, md.data[i + 3] / 255);
      od.data[i] = r; od.data[i + 1] = g; od.data[i + 2] = bb; od.data[i + 3] = Math.round(a * 255);
    }
    vx.putImageData(vd, 0, 0); gx.putImageData(gd, 0, 0); mx.putImageData(md, 0, 0); ox.putImageData(od, 0, 0);
    repaintLightTexels();
  }

  /* =============== the law of the world layer: no alpha. light is palette; transparency is dither. ===============
     The light field lands on the ground as SOLID texels in Bayer proportion — a cold checker thickening
     where the quiet holds, gold dust scattered where the wire feeds, and a dithered golden COASTLINE at
     the exact light level a wraith cannot cross: the network's edge drawn as a shore. Night is a second,
     darker field baked the same way — the world snaps through palette steps at dusk like a cartridge
     swapping CLUTs, instead of drowning under a translucent veil. */
  const lightOv = document.createElement('canvas'); lightOv.width = TW; lightOv.height = TH;    // day field
  const lightOvN = document.createElement('canvas'); lightOvN.width = TW; lightOvN.height = TH; // night field
  const BAY4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const mistG = new Float32Array(LW * LH);
  let prevLightG = null, terrainReady = false;
  const gridAt = (arr, wx, wy) => {   // bilinear over the LS grid
    const gx2 = U.clamp(wx / LS - 0.5, 0, LW - 1.001), gy2 = U.clamp(wy / LS - 0.5, 0, LH - 1.001);
    const x0 = gx2 | 0, y0 = gy2 | 0, fx = gx2 - x0, fy = gy2 - y0;
    const i0 = y0 * LW + x0;
    return (arr[i0] * (1 - fx) + arr[i0 + 1] * fx) * (1 - fy) + (arr[i0 + LW] * (1 - fx) + arr[i0 + LW + 1] * fx) * fy;
  };
  function paintLightRegion(tx0, ty0, tx1, ty1) {
    if (!terrainReady) return;
    tx0 = Math.max(0, tx0 | 0); ty0 = Math.max(0, ty0 | 0);
    tx1 = Math.min(TW, Math.ceil(tx1)); ty1 = Math.min(TH, Math.ceil(ty1));
    const w = tx1 - tx0, h = ty1 - ty0;
    if (w <= 0 || h <= 0) return;
    const dxD = lightOv.getContext('2d'), dxN = lightOvN.getContext('2d');
    const td = tc.getContext('2d').getImageData(tx0, ty0, w, h).data;   // the ground itself — light recolours it
    const idD = dxD.createImageData(w, h), idN = dxN.createImageData(w, h);
    const dD = idD.data, dN = idN.data;
    const F = 255;
    for (let py = 0; py < h; py++) {
      const wy = (ty0 + py) * TS + TS / 2;
      for (let px = 0; px < w; px++) {
        const wx = (tx0 + px) * TS + TS / 2;
        const L = gridAt(lightG, wx, wy);
        const m = gridAt(mistG, wx, wy);
        const bay = BAY4[(ty0 + py) & 3][(tx0 + px) & 3] / 16;
        const i = (py * w + px) * 4;
        const tr = td[i], tg = td[i + 1], tb = td[i + 2];
        // the coastline: the wraith-burn threshold drawn as a dithered golden shore, day and night
        if (Math.abs(L - 0.30) < 0.020 && bay < 0.42) {
          dD[i] = dN[i] = 255; dD[i + 1] = dN[i + 1] = 232; dD[i + 2] = dN[i + 2] = 170; dD[i + 3] = dN[i + 3] = 255;
          continue;
        }
        // Bayer jitters the light value, not the colour: bands stay solid, their EDGES dither.
        const Lq = L + (bay - 0.47) * 0.07 - (m > 0.62 + (bay - 0.5) * 0.2 ? 0.05 : 0);
        let r = 0, g = 0, b2 = 0, a = 0, rN, gN, bN, aN = 255;
        if (Lq < 0.10) { r = tr * 0.30; g = tg * 0.34; b2 = tb * 0.34 + 14; a = 255; }
        else if (Lq < 0.30) { r = tr * 0.52; g = tg * 0.55; b2 = tb * 0.55 + 10; a = 255; }
        else if (Lq < 0.47) { a = 0; }                                            // bare ground: the neutral shelf
        else if (Lq < 0.78) { r = tr * 1.13 + 10; g = tg * 1.07 + 5; b2 = tb * 0.94; a = 255; }
        else { r = tr * 1.24 + 20; g = tg * 1.13 + 9; b2 = tb * 0.88; a = 255; }
        // night: the same land two palette steps deeper and bluer — lit ground keeps its day face
        if (Lq < 0.10) { rN = tr * 0.13; gN = tg * 0.16; bN = tb * 0.26 + 18; }
        else if (Lq < 0.30) { rN = tr * 0.26; gN = tg * 0.30; bN = tb * 0.44 + 16; }
        else if (Lq < 0.47) { rN = tr * 0.44; gN = tg * 0.47; bN = tb * 0.66 + 13; }
        else if (Lq < 0.78) { rN = tr * 1.06 + 6; gN = tg * 1.01 + 3; bN = tb * 0.92; }
        else { rN = tr * 1.24 + 20; gN = tg * 1.13 + 9; bN = tb * 0.88; }
        dD[i] = Math.min(F, r); dD[i + 1] = Math.min(F, g); dD[i + 2] = Math.min(F, b2); dD[i + 3] = a;
        dN[i] = Math.min(F, rN); dN[i + 1] = Math.min(F, gN); dN[i + 2] = Math.min(F, bN); dN[i + 3] = aN;
      }
    }
    dxD.putImageData(idD, tx0, ty0); dxN.putImageData(idN, tx0, ty0);
  }
  let pend = null, lastPaintT = -9, flushTimer = null;
  function flushPend() {
    if (!pend) return;
    const p = pend; pend = null; lastPaintT = performance.now() / 1000;
    paintLightRegion(p.x0 * LS / TS, p.y0 * LS / TS, p.x1 * LS / TS, p.y1 * LS / TS);
  }
  function repaintLightTexels() {
    if (!terrainReady) return;   // nothing to recolour until the ground exists
    // mist grid rides along; find what actually changed and repaint only that ground
    for (let cy = 0; cy < LH; cy++) for (let cx = 0; cx < LW; cx++)
      mistG[cy * LW + cx] = mistBase(cx * LS + LS / 2, cy * LS + LS / 2);
    let x0 = LW, y0 = LH, x1 = -1, y1 = -1;
    if (!prevLightG) { x0 = 0; y0 = 0; x1 = LW; y1 = LH; prevLightG = new Float32Array(lightG); }
    else {
      for (let cy = 0; cy < LH; cy++) for (let cx = 0; cx < LW; cx++) {
        const i = cy * LW + cx;
        if (Math.abs(lightG[i] - prevLightG[i]) > 0.004) {
          if (cx < x0) x0 = cx; if (cx > x1) x1 = cx;
          if (cy < y0) y0 = cy; if (cy > y1) y1 = cy;
          prevLightG[i] = lightG[i];
        }
      }
      if (x1 < 0) return;
      x0 -= 1; y0 -= 1; x1 += 2; y1 += 2;
    }
    // batch bursts (the connect cinematic re-lights every 0.12 s): merge dirt, flush at most ~4×/s
    pend = pend ? { x0: Math.min(pend.x0, x0), y0: Math.min(pend.y0, y0), x1: Math.max(pend.x1, x1), y1: Math.max(pend.y1, y1) } : { x0, y0, x1, y1 };
    const now = performance.now() / 1000;
    if (now - lastPaintT < 0.22) {
      if (!flushTimer) flushTimer = setTimeout(() => { flushTimer = null; flushPend(); }, 240);
      return;
    }
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    flushPend();
  }
  function coverage() {
    let lit = 0, land = 0;
    for (let cy = 0; cy < LH; cy++) for (let cx = 0; cx < LW; cx++) {
      const c = classAt(cx * LS + LS / 2, cy * LS + LS / 2);
      if (c === DEEP) continue;
      land++;
      if (lightG[cy * LW + cx] > T.coreLight) lit++;
    }
    return lit / Math.max(1, land);
  }

  /* ---------- canvases ---------- */
  const tc = document.createElement('canvas'); tc.width = TW; tc.height = TH;   // terrain
  const rc = document.createElement('canvas'); rc.width = TW; rc.height = TH;   // roads overlay
  const thumb = document.createElement('canvas'); thumb.width = 525; thumb.height = 700;

  // palette ramps [r,g,b]
  /* authored four-tone ramps — every pixel on the ground is one of these, chosen with ordered dither.
     This is the era's actual technique: a small deliberate palette and Bayer dithering, no soft blends. */
  const COL = {
    [MEADOW]: [[50, 72, 42], [70, 94, 50], [92, 116, 56], [114, 136, 64]],
    [FOREST]: [[26, 46, 34], [38, 62, 40], [52, 78, 46], [68, 94, 52]],
    [SCREE]: [[94, 86, 62], [118, 108, 76], [140, 128, 90], [162, 148, 104]],
    [ROCK]: [[90, 98, 106], [112, 120, 128], [136, 144, 150], [160, 168, 173]],
    [SNOW]: [[170, 186, 198], [196, 210, 218], [220, 230, 236], [242, 248, 250]],
    [MARSH]: [[42, 60, 40], [54, 74, 46], [68, 88, 52], [82, 100, 58]],
    [SHALLOW]: [[36, 106, 112], [50, 128, 132], [64, 146, 146], [80, 162, 158]],
    [DEEP]: [[12, 42, 64], [18, 56, 82], [24, 70, 98], [32, 84, 114]],
    [CLIFF]: [[38, 42, 50], [52, 56, 64], [66, 71, 79], [82, 87, 95]],
    [PAD]: [[86, 78, 62], [106, 96, 76], [126, 114, 90], [146, 132, 104]],
  };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];   // 4×4 ordered dither, /16

  /* ---------- bake ---------- */
  async function bake(onProgress) {
    const tick = (p, label) => new Promise(res => { onProgress && onProgress(p, label); setTimeout(res, 0); });

    // 1. heights
    for (let cy = 0; cy < HH; cy++) {
      for (let cx = 0; cx < HW; cx++) hgt[hIdx(cx, cy)] = heightFn(cx * HS, cy * HS);
      if (cy % 90 === 0) await tick(cy / HH * 0.25, 'raising the mountains');
    }

    // 2. river distance stamping
    for (let ri = 0; ri < rivers.length; ri++) {
      const rv = rivers[ri], L = U.polyLen(rv.pts), stampR = 240;
      for (let d = 0; d <= L; d += 8) {
        const p = U.polyAt(rv.pts, d);
        const cx0 = Math.max(0, ((p.x - stampR) / HS) | 0), cx1 = Math.min(HW - 1, ((p.x + stampR) / HS) | 0);
        const cy0 = Math.max(0, ((p.y - stampR) / HS) | 0), cy1 = Math.min(HH - 1, ((p.y + stampR) / HS) | 0);
        for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) {
          const dd = U.dist(cx * HS, cy * HS, p.x, p.y);
          const i = hIdx(cx, cy);
          if (dd < rivD[i]) { rivD[i] = dd; rivI[i] = ri; }
        }
      }
      // carve heights toward riverbed
      await tick(0.25 + ri * 0.04, 'cutting the rivers');
    }
    for (let i = 0; i < hgt.length; i++) {
      if (rivI[i] !== 255) {
        const rv = rivers[rivI[i]], t = U.clamp(1 - rivD[i] / (rv.w * 2.2), 0, 1);
        hgt[i] -= U.smooth(t) * (rv.deep ? 0.09 : 0.045);   // creeks are shallow cuts, rivers are gorges
      }
    }
    await tick(0.4, 'settling the banks');

    // 3. classification
    for (let cy = 0; cy < CH; cy++) {
      for (let cx = 0; cx < CW; cx++) {
        const x = cx * CS + CS / 2, y = cy * CS + CS / 2;
        const r = riverAt(x, y), s = slopeAt(x, y);
        cls[cy * CW + cx] = classify(x, y, hgtAt(x, y), r.dist, r.idx, s.mag);
      }
      if (cy % 140 === 0) await tick(0.4 + cy / CH * 0.2, 'naming the ground');
    }

    // 4. paint terrain
    const ctx = tc.getContext('2d');
    const rowsPer = 160;
    for (let y0 = 0; y0 < TH; y0 += rowsPer) {
      const rows = Math.min(rowsPer, TH - y0);
      const img = ctx.createImageData(TW, rows);
      const d = img.data;
      for (let py = 0; py < rows; py++) {
        const wy = (y0 + py) * TS + TS / 2;
        for (let px = 0; px < TW; px++) {
          const wx = px * TS + TS / 2;
          const c = classAt(wx, wy);
          const h = hgtAt(wx, wy);
          const ramp = COL[c];
          let t = U.clamp((h - 0.2) / 0.7, 0, 1);
          if (c === DEEP || c === SHALLOW) { const r = riverAt(wx, wy); t = U.clamp(r.dist / (rivers[r.idx] ? rivers[r.idx].w : 40), 0, 1); }
          // hillshade folds into the tone index instead of multiplying the colour — banded light, like it was drawn
          const e = 6;
          const gx2 = hgtAt(wx + e, wy) - hgtAt(wx - e, wy);
          const gy2 = hgtAt(wx, wy + e) - hgtAt(wx, wy - e);
          const sh = U.clamp(1 + (-gx2 - gy2) * 24, 0.62, c === SNOW ? 1.12 : 1.35);
          let f = t * 2.1 + (sh - 1) * 3.4;
          // ground tone drifts in patches you can see inside one screen, not one continent
          if (c === MEADOW || c === MARSH) f += (U.fbm(wx / 340, wy / 340, SEED + 41, 2) - 0.5) * 2.6;
          // ordered dither picks the tone: hard pixels, authored transitions.
          // land dithers in 2×2 blocks — chunky and deliberate; water keeps fine bands
          const bayD = (c === DEEP || c === SHALLOW)
            ? BAYER[(y0 + py) & 3][px & 3]
            : BAYER[((y0 + py) >> 1) & 3][(px >> 1) & 3];
          let idx = Math.floor(f + bayD / 16);
          // authored texture on top of the ramp
          if (c === MEADOW || c === MARSH) {
            // grass tufts: a fixed 4-texel glyph stamped in scattered 4×4 cells, the LTTP way
            const hh = U.hash2(px >> 2, (y0 + py) >> 2, 71);
            if (hh > (c === MARSH ? 0.70 : 0.79)) {
              const lx = px & 3, ly = (y0 + py) & 3;
              if ((lx === 1 && (ly === 1 || ly === 2)) || (lx === 2 && (ly === 1 || ly === 2))) idx -= 1;
            }
          }
          if (c === FOREST) {
            // canopy clumps: 2×2 bright crowns scattered on the dark floor
            const n = U.hash2(px >> 2, (y0 + py) >> 2, 99);
            if (n > 0.60) { const lx = px & 3, ly = (y0 + py) & 3; if (lx > 0 && lx < 3 && ly > 0 && ly < 3) idx += 1; }
            else if (n < 0.08) idx -= 1;
          }
          if (c === SCREE || c === ROCK) { const n = U.hash2(px, y0 + py, 137); if (n > 0.86) idx += 1; else if (n < 0.1) idx -= 1; }
          if (c === CLIFF && ((px + ((y0 + py) >> 1)) % 7) < 2) idx -= 1;
          if (c !== DEEP && c !== SHALLOW && (h * 22) % 1 < 0.055) idx -= 1;   // contour steps
          idx = U.clamp(idx, 0, 3);
          const col = ramp[idx];
          const i = (py * TW + px) * 4;
          d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, y0);
      await tick(0.6 + (y0 / TH) * 0.38, 'painting the valley');
    }

    // water edge shimmer base: subtle lighter line along shallow/deep boundary — cheap pass
    onProgress && onProgress(0.99, 'first light');
    terrainReady = true;
    repaintLightTexels();   // the light field reads the finished ground — first full paint happens here
    rebuildThumb();
    await tick(1, 'done');
  }

  function rebuildThumb() {
    const c = thumb.getContext('2d');
    c.drawImage(tc, 0, 0, thumb.width, thumb.height);
    c.drawImage(rc, 0, 0, thumb.width, thumb.height);
  }

  /* ---------- roads painting ---------- */
  function roadSegPts(road, si) {
    const L = U.polyLen(road.pts), a = (si / road.segs) * L, b = ((si + 1) / road.segs) * L;
    const pts = [];
    for (let d = a; d <= b + 0.1; d += 14) pts.push(U.polyAt(road.pts, Math.min(d, L)));
    return pts;
  }
  function paintRoadSegment(road, si) {
    const pts = roadSegPts(road, si);
    for (const c of [rc.getContext('2d'), tc.getContext('2d')]) {
      c.lineCap = 'round'; c.lineJoin = 'round';
      const draw = (w, style) => {
        c.strokeStyle = style; c.lineWidth = w / TS;
        c.beginPath();
        pts.forEach((p, i) => { const x = p.x / TS, y = p.y / TS; i ? c.lineTo(x, y) : c.moveTo(x, y); });
        c.stroke();
      };
      draw(30, 'rgba(20,24,28,0.9)');
      draw(24, '#3c424a');
      draw(2.2, 'rgba(255,214,150,0.5)');
    }
    // the light field holds a recoloured copy of this ground — refresh it where the road landed
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const p of pts) { bx0 = Math.min(bx0, p.x); by0 = Math.min(by0, p.y); bx1 = Math.max(bx1, p.x); by1 = Math.max(by1, p.y); }
    paintLightRegion(bx0 / TS - 5, by0 / TS - 5, bx1 / TS + 5, by1 / TS + 5);
    rebuildThumb();
  }
  // roads are permanent: re-stamp built segments into the terrain canvas after a load
  function repaintRoads(roadsState) {
    for (const road of DATA.roads) {
      const built = roadsState[road.id];
      if (!built) continue;
      for (let si = 0; si < road.segs; si++) if (built[si]) paintRoadSegment(road, si);
    }
  }
  function paverPos(road, si) {
    const L = U.polyLen(road.pts);
    return U.polyAt(road.pts, ((si + 0.5) / road.segs) * L);
  }

  /* ---------- A* pathfinding (coarse) ---------- */
  const PS = 40, PW = Math.ceil(W / PS), PH = Math.ceil(H / PS);
  let pcost = null, pdeep = null;
  function buildPathGrid() {
    pcost = new Float32Array(PW * PH); pdeep = new Uint8Array(PW * PH);
    const q = PS / 4;
    for (let cy = 0; cy < PH; cy++) for (let cx = 0; cx < PW; cx++) {
      const x = cx * PS + PS / 2, y = cy * PS + PS / 2;
      const t = terrainAt(x, y);
      let blocked = t.blocked, deep = t.cls === DEEP;
      for (const [ox, oy] of [[-q, -q], [q, -q], [-q, q], [q, q]]) { const t2 = classAt(x + ox, y + oy); if (t2 === CLIFF) blocked = true; if (t2 === DEEP) deep = true; }
      if (deep) { pcost[cy * PW + cx] = 6.5; pdeep[cy * PW + cx] = 1; }   // "you will find a way across" (par estimates)
      else pcost[cy * PW + cx] = blocked ? -1 : 1 / Math.max(0.3, t.p[0]);
    }
  }
  const pathCell = (x, y) => U.clamp((y / PS) | 0, 0, PH - 1) * PW + U.clamp((x / PS) | 0, 0, PW - 1);
  /* opts.walk: a route feet can actually take — deep water and cliffs only where a crossing (opts.cross: Set of cells) spans them */
  function pathTime(x1, y1, x2, y2, wantPath = false, opts = null) {
    if (!pcost) buildPathGrid();
    const walk = !!(opts && opts.walk), cross = opts && opts.cross, avoid = (opts && opts.avoid && opts.avoid.length) ? opts.avoid : null;   // avoid: circles {x,y,r,mul} that cost more to walk through
    const block = opts && opts.block && opts.block.size ? opts.block : null;   // block: cells feet have found impassable, whatever the grid thought
    const parent = wantPath ? new Int32Array(PW * PH).fill(-1) : null;
    const sx = U.clamp((x1 / PS) | 0, 0, PW - 1), sy = U.clamp((y1 / PS) | 0, 0, PH - 1);
    const tx = U.clamp((x2 / PS) | 0, 0, PW - 1), ty = U.clamp((y2 / PS) | 0, 0, PH - 1);
    const open = [], g = new Float32Array(PW * PH).fill(Infinity), closed = new Uint8Array(PW * PH);
    const h = (cx, cy) => Math.hypot(cx - tx, cy - ty);
    const push = (i, f) => { open.push([f, i]); let k = open.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (open[p][0] <= open[k][0]) break; [open[p], open[k]] = [open[k], open[p]]; k = p; } };
    const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let k = 0; for (;;) { let l = k * 2 + 1, r = l + 1, m = k; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === k) break; [open[m], open[k]] = [open[k], open[m]]; k = m; } } return top; };
    const si = sy * PW + sx; g[si] = 0; push(si, h(sx, sy));
    const N = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    let found = -1, iter = 0;
    while (open.length && iter++ < 140000) {
      const [, i] = pop();
      if (closed[i]) continue; closed[i] = 1;
      if (i === ty * PW + tx) { found = i; break; }
      const cx = i % PW, cy = (i / PW) | 0;
      for (const [dx, dy, wmul] of N) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= PW || ny >= PH) continue;
        const ni = ny * PW + nx;
        if (closed[ni]) continue;
        let cc = pcost[ni];
        if (walk) { if (cross && cross.has(ni)) cc = 1; else if (cc < 0 || pdeep[ni]) cc = -1; }
        if (block && block.has(ni)) cc = -1;
        if (cc < 0) continue;
        if (avoid) { const wx = nx * PS + PS / 2, wy = ny * PS + PS / 2; for (const a of avoid) if (U.dist(wx, wy, a.x, a.y) < a.r) { cc *= a.mul; break; } }
        const ng = g[i] + wmul * cc;
        if (ng < g[ni]) { g[ni] = ng; if (parent) parent[ni] = i; push(ni, ng + h(nx, ny)); }
      }
    }
    let cost;
    if (found >= 0) cost = g[found];
    else cost = U.dist(x1, y1, x2, y2) / PS * 1.6; // fallback straight-ish
    const seconds = (cost * PS) / T.walk;
    let path = null;
    if (wantPath && found >= 0) {
      path = [];
      for (let i = found; i >= 0; i = parent[i]) { path.push([(i % PW) * PS + PS / 2, ((i / PW) | 0) * PS + PS / 2]); if (i === si) break; }
      path.reverse();
    }
    return { seconds, dist: cost * PS, found: found >= 0, path };
  }

  return {
    W, H, MEADOW, FOREST, SCREE, ROCK, SNOW, MARSH, SHALLOW, DEEP, CLIFF, CP,
    bake, hgtAt, slopeAt, classAt, terrainAt, riverAt,
    setSources, lightAt, mistAt, mistBase, rebuildLight, coverage, lightG, LW, LH, LS,
    tc, rc, thumb, TS, veilC, glowC, mistC, overlayC, lightOv, lightOvN, rebuildThumb, repaintRoads,
    paintRoadSegment, paverPos, roadSegPts, pathTime, buildPathGrid, pathCell, PS,
  };
})();
