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
      // dark veil where unlit
      vd.data[i] = 7; vd.data[i + 1] = 10; vd.data[i + 2] = 16;
      vd.data[i + 3] = Math.round(U.clamp((1 - Math.pow(L, 0.65)) * 0.55 + m * 0.12, 0, 0.78) * 255);
      // warm glow where lit — strongest where the land is naturally dark/misty, never on snowfields
      const mb = mistBase(x, y);
      gd.data[i] = 255; gd.data[i + 1] = 196; gd.data[i + 2] = 120;
      gd.data[i + 3] = Math.round(U.clamp(L * 0.14 * U.clamp(0.35 + mb, 0, 1), 0, 0.14) * 255);
      // mist body
      const mv = U.clamp(m, 0, 1);
      md.data[i] = 138; md.data[i + 1] = 146; md.data[i + 2] = 168;
      md.data[i + 3] = Math.round(Math.pow(mv, 1.25) * 0.82 * 255);
      // precomposite: veil -> warm -> mist (straight-alpha source-over)
      let r = 0, g = 0, bb = 0, a = 0;
      const over = (cr, cg, cb, ca) => { const na = ca + a * (1 - ca); if (na > 0) { r = (cr * ca + r * a * (1 - ca)) / na; g = (cg * ca + g * a * (1 - ca)) / na; bb = (cb * ca + bb * a * (1 - ca)) / na; } a = na; };
      over(7, 10, 16, vd.data[i + 3] / 255);
      over(255, 196, 120, gd.data[i + 3] / 255 * 0.3);
      over(138, 146, 168, md.data[i + 3] / 255);
      od.data[i] = r; od.data[i + 1] = g; od.data[i + 2] = bb; od.data[i + 3] = Math.round(a * 255);
    }
    vx.putImageData(vd, 0, 0); gx.putImageData(gd, 0, 0); mx.putImageData(md, 0, 0); ox.putImageData(od, 0, 0);
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
  const COL = {
    [MEADOW]: [[46, 60, 48], [66, 78, 55]],
    [FOREST]: [[30, 44, 37], [42, 57, 44]],
    [SCREE]: [[84, 88, 74], [104, 106, 90]],
    [ROCK]: [[104, 112, 116], [130, 139, 142]],
    [SNOW]: [[188, 199, 205], [219, 229, 231]],
    [MARSH]: [[40, 55, 47], [52, 66, 54]],
    [SHALLOW]: [[36, 78, 88], [50, 96, 104]],
    [DEEP]: [[16, 35, 46], [24, 52, 63]],
    [CLIFF]: [[46, 51, 57], [63, 69, 75]],
    [PAD]: [[62, 60, 53], [90, 86, 75]],
  };

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
          let r = U.lerp(ramp[0][0], ramp[1][0], t), g = U.lerp(ramp[0][1], ramp[1][1], t), b = U.lerp(ramp[0][2], ramp[1][2], t);
          // hillshade from NW
          const e = 6;
          const gx2 = hgtAt(wx + e, wy) - hgtAt(wx - e, wy);
          const gy2 = hgtAt(wx, wy + e) - hgtAt(wx, wy - e);
          let sh = 1 + (-gx2 - gy2) * 24;
          sh = U.clamp(sh, 0.62, c === SNOW ? 1.12 : 1.35);
          r *= sh; g *= sh; b *= sh;
          if (c === MEADOW || c === MARSH) {
            const v = U.fbm(wx / 1800, wy / 1800, SEED + 41, 2) - 0.5;
            r += v * 16; g += v * 22; b += v * 8;
          }
          if (c === CLIFF) {
            const band2 = ((px + ((y0 + py) >> 1)) % 7);
            if (band2 < 2) { r *= 0.74; g *= 0.74; b *= 0.76; }
          }
          // contour lines
          if (c !== DEEP && c !== SHALLOW) {
            const band = (h * 22) % 1;
            if (band < 0.06) { r *= 0.86; g *= 0.86; b *= 0.86; }
          }
          // forest stipple
          if (c === FOREST) {
            const n = U.hash2(px >> 1, (y0 + py) >> 1, 99);
            if (n > 0.72) { r *= 0.78; g *= 0.82; b *= 0.78; }
            else if (n < 0.1) { r *= 1.16; g *= 1.18; b *= 1.1; }
          }
          if (c === SCREE || c === ROCK) {
            const n = U.hash2(px, y0 + py, 137);
            if (n > 0.85) { r *= 1.14; g *= 1.14; b *= 1.12; } else if (n < 0.12) { r *= 0.85; g *= 0.85; b *= 0.87; }
          }
          // dither
          const dth = (U.hash2(px, y0 + py, 7) - 0.5) * 9;
          const i = (py * TW + px) * 4;
          d[i] = U.clamp(r + dth, 0, 255); d[i + 1] = U.clamp(g + dth, 0, 255); d[i + 2] = U.clamp(b + dth, 0, 255); d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, y0);
      await tick(0.6 + (y0 / TH) * 0.38, 'painting the valley');
    }

    // water edge shimmer base: subtle lighter line along shallow/deep boundary — cheap pass
    onProgress && onProgress(0.99, 'first light');
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
    tc, rc, thumb, TS, veilC, glowC, mistC, overlayC, rebuildThumb, repaintRoads,
    paintRoadSegment, paverPos, roadSegPts, pathTime, buildPathGrid, pathCell, PS,
  };
})();
