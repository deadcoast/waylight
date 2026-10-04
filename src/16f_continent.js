'use strict';
/* Waylight v3.26 — THE DARKLANDS: the continental briefing table. The middle scale the ladder was
   missing — between the Greymarch survey sheet and the ornamental globe sits the ACTUAL developed
   strategic map: the continent the Order is working, presented at the briefing-table ANGLE (a
   tilted plane receding to a horizon, contour-line terrain, a graticule, leader-line labels, side
   data columns fed by the REAL ledger) — the manner of the reference screens, never their
   aesthetic. This table is LEDGERLIGHT: bone contours on the void, gold for the lit and ours,
   grey-blue for the dark, rust for trouble, bracket labels in the register's own voice. No smooth
   gradients anywhere — depth is stepped alpha, light is stippled dots.

   One truth: the terrain is sampled from the SAME planet bake the globe renders (Globe.elevAt),
   windowed around the Greymarch pin. The uncharted region pins live here — this table is the
   recon system's future home. */

const Continent = (() => {
  const NX = 220, NY = 156;                 // heightfield samples across the window
  const LEVELS = 13;                         // contour rings above the sea
  let baked = false;
  let H = null, win = null, seaMask = null;
  let contours = [];                         // [{k, pts:[[x0,y0,x1,y1],...]}] in uv space
  let coastSegs = [], seaDots = [], farCoast = [], landDots = [];
  let maxH = 0;

  /* ---------- the bake: window the planet, cut the contours ---------- */
  function bake() {
    if (baked) return;
    Globe.bake();
    const gm = Globe.REGIONS.find(r => r.id === 'greymarch');
    // the Greymarch sits low-right of center, the way a briefing frames its subject area
    win = { lonW: 0.96, latW: 0.7, lon0: gm.lon - 0.96 * 0.55, lat0: gm.lat - 0.7 * 0.44 };
    H = new Float32Array(NX * NY);
    seaMask = new Uint8Array(NX * NY);
    const SEA = Globe.SEA;
    maxH = 0;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const lon = win.lon0 + (i / (NX - 1)) * win.lonW;
      const lat = win.lat0 + (j / (NY - 1)) * win.latW;
      const h = Globe.elevAt(lon, lat) - SEA;
      H[j * NX + i] = h;
      seaMask[j * NX + i] = h < 0 ? 1 : 0;
      if (h > maxH) maxH = h;
    }
    // contours: the coast (h = 0) cut thick, then LEVELS rings climbing to the peaks
    coastSegs = cut(0.0005);
    contours = [];
    for (let k = 1; k <= LEVELS; k++) contours.push({ k, pts: cut((k / (LEVELS + 0.5)) * maxH) });
    // the sea reads as a surface, not a hole: sparse ordered stipple
    seaDots = [];
    for (let j = 0; j < NY; j += 2) for (let i = ((j / 2) % 2) * 2; i < NX; i += 4)
      if (seaMask[j * NX + i]) seaDots.push(i / (NX - 1), j / (NY - 1));
    // the LAND is a dotted density field, the reference grammar in the register's ink:
    // every mark a sample, brighter with height — the terrain reads FULL, never empty
    landDots = [];
    for (let j = 0; j < NY; j += 2) for (let i = (j % 4 === 0 ? 1 : 0); i < NX; i += 2) {
      const h = H[j * NX + i];
      if (h > 0) landDots.push(i / (NX - 1), j / (NY - 1), h / maxH);
    }
    // the world past the table: far coasts as dim marks, so the map continues instead of ending
    farCoast = [];
    const FN = 150, FM = 104, fw = win.lonW * 2.6, fh = win.latW * 2.6;
    const flon0 = win.lon0 - (fw - win.lonW) / 2, flat0 = win.lat0 - (fh - win.latW) / 2;
    for (let j = 1; j < FM - 1; j++) for (let i = 1; i < FN - 1; i++) {
      const lon = flon0 + (i / (FN - 1)) * fw, lat = flat0 + (j / (FM - 1)) * fh;
      const u = (lon - win.lon0) / win.lonW, v = (lat - win.lat0) / win.latW;
      if (u > -0.04 && u < 1.04 && v > -0.04 && v < 1.04) continue;   // the table itself covers this
      const h0 = Globe.elevAt(lon, lat) - SEA;
      if (h0 < 0) continue;
      const hr = Globe.elevAt(flon0 + ((i + 1) / (FN - 1)) * fw, lat) - SEA;
      const hd = Globe.elevAt(lon, flat0 + ((j + 1) / (FM - 1)) * fh) - SEA;
      if (hr < 0 || hd < 0) farCoast.push(u, v);
    }
    baked = true;
  }
  /* marching squares over H at one level — emits uv segments */
  function cut(lvl) {
    const segs = [];
    const val = (i, j) => H[j * NX + i] - lvl;
    const lerp = (a, b) => a / (a - b);
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) {
      const a = val(i, j), b = val(i + 1, j), c = val(i + 1, j + 1), d = val(i, j + 1);
      let m = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
      if (m === 0 || m === 15) continue;
      const u0 = i / (NX - 1), v0 = j / (NY - 1), du = 1 / (NX - 1), dv = 1 / (NY - 1);
      const T = [u0 + du * lerp(a, b), v0], R = [u0 + du, v0 + dv * lerp(b, c)],
        B = [u0 + du * lerp(d, c), v0 + dv], L = [u0, v0 + dv * lerp(a, d)];
      const put = (p, q) => segs.push(p[0], p[1], q[0], q[1]);
      switch (m) {
        case 1: case 14: put(L, B); break;
        case 2: case 13: put(B, R); break;
        case 3: case 12: put(L, R); break;
        case 4: case 11: put(T, R); break;
        case 5: put(T, L); put(B, R); break;
        case 6: case 9: put(T, B); break;
        case 7: case 8: put(T, L); break;
        case 10: put(T, R); put(L, B); break;
      }
    }
    return segs;
  }

  /* ---------- the table's camera: yaw by hand, pitch fixed like a table, depth honest ---------- */
  const st = { open: false, yaw: -0.16, vel: 0, zoom: 1.12, drag: null, t: 0, raf: 0, last: 0 };
  const EL = 0.94;            // the look-down angle — the briefing lean
  const W3D = 2.75, D3D = 2.05, RELIEF = 1.15, CAMD = 3.1;
  let cw = 0, ch = 0;
  function project(u, v, h) {
    const X = (u - 0.5) * W3D, Z = (v - 0.5) * D3D, Y = -Math.max(0, h) * RELIEF;
    const cy2 = Math.cos(st.yaw), sy2 = Math.sin(st.yaw);
    const x1 = X * cy2 - Z * sy2, z1 = X * sy2 + Z * cy2;
    const ce = Math.cos(EL), se = Math.sin(EL);
    const y2 = Y * ce - z1 * se, z2 = Y * se + z1 * ce;
    const s = (ch * 1.08 * st.zoom) / (CAMD + z2);
    return { x: cw / 2 + x1 * s, y: ch * 0.52 + y2 * s, d: U.clamp((z2 + D3D / 2) / D3D, 0, 1), s };
  }
  const fade = d => 1 - d * 0.62;            // far edge dims — stepped later by alpha buckets

  /* the Greymarch's footprint on the continent (uv rect) — the sheet's whole world is this box */
  function gmRect() {
    const gm = Globe.REGIONS.find(r => r.id === 'greymarch');
    const cu = (gm.lon - win.lon0) / win.lonW, cv2 = (gm.lat - win.lat0) / win.latW;
    const w = 0.056, h = 0.088;              // tall like the valley itself
    return { u0: cu - w / 2, v0: cv2 - h / 2, w, h, cu, cv: cv2 };
  }
  const gmUV = (wx, wy) => { const fp = gmRect(); return [fp.u0 + (wx / DATA.W) * fp.w, fp.v0 + (wy / DATA.H) * fp.h]; };

  /* ---------- the frame ---------- */
  function render(cv2) {
    const g = cv2.getContext('2d');
    cw = cv2.width; ch = cv2.height;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#05070b'; g.fillRect(0, 0, cw, ch);
    const seg = (x0, y0, x1, y1, col, a, lw) => {
      g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = lw;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    };
    // 1 · the world beyond the table — dim far coasts, the map that keeps going
    g.fillStyle = '#3a4a66';
    for (let n = 0; n < farCoast.length; n += 2) {
      const p = project(farCoast[n], farCoast[n + 1], 0);
      g.globalAlpha = 0.26 * fade(p.d);
      g.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    // 2 · the graticule: the table's own weave, receding
    for (let i = 0; i <= 12; i++) {
      const u = i / 12;
      let prev = project(u, 0, 0);
      for (let j = 1; j <= 8; j++) { const p = project(u, j / 8, 0); seg(prev.x, prev.y, p.x, p.y, '#7a7666', (i === 0 || i === 12 ? 0.24 : 0.12) * fade((prev.d + p.d) / 2), 1); prev = p; }
    }
    for (let j = 0; j <= 8; j++) {
      const v = j / 8;
      let prev = project(0, v, 0);
      for (let i = 1; i <= 12; i++) { const p = project(i / 12, v, 0); seg(prev.x, prev.y, p.x, p.y, '#7a7666', (j === 0 || j === 8 ? 0.24 : 0.12) * fade((prev.d + p.d) / 2), 1); prev = p; }
    }
    // corner ticks — the plate's chunk, not a neon frame
    g.globalAlpha = 0.85; g.fillStyle = '#8a6534';
    for (const [u, v] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const p = project(u, v, 0);
      g.fillRect(p.x - 3, p.y - 1, 7, 2); g.fillRect(p.x - 1, p.y - 3, 2, 7);
    }
    // 3 · the sea, stippled — a surface, never a hole
    g.fillStyle = '#2e3c52';
    for (let n = 0; n < seaDots.length; n += 2) {
      const p = project(seaDots[n], seaDots[n + 1], 0);
      g.globalAlpha = 0.6 * fade(p.d);
      g.fillRect(p.x, p.y, 1.7, 1.7);
    }
    // 3b · the land's dotted field — height carried in brightness AND in the lift itself
    for (let n = 0; n < landDots.length; n += 3) {
      const hn = landDots[n + 2];
      const p = project(landDots[n], landDots[n + 1], hn * maxH);
      g.globalAlpha = (0.1 + hn * 0.5) * fade(p.d);
      g.fillStyle = hn > 0.72 ? '#d8d2bd' : '#8a8676';
      g.fillRect(p.x, p.y, 1.5, 1.5);
    }
    // 4 · the land: coast bright, contours climbing brighter with height (relief carried in Y)
    for (let n = 0; n < coastSegs.length; n += 4) {
      const p = project(coastSegs[n], coastSegs[n + 1], 0), q = project(coastSegs[n + 2], coastSegs[n + 3], 0);
      seg(p.x, p.y, q.x, q.y, '#d8d2bd', 0.62 * fade((p.d + q.d) / 2), 1.4);
    }
    for (const c of contours) {
      const lvl = (c.k / (LEVELS + 0.5)) * maxH;
      const a = 0.17 + (c.k / LEVELS) * 0.33;
      for (let n = 0; n < c.pts.length; n += 4) {
        const p = project(c.pts[n], c.pts[n + 1], lvl), q = project(c.pts[n + 2], c.pts[n + 3], lvl);
        seg(p.x, p.y, q.x, q.y, '#b8b29d', a * fade((p.d + q.d) / 2), 1);
      }
    }
    g.globalAlpha = 1;
    drawGreymarch(g);
    drawRegionMarkers(g);
    drawColumns(g);
  }

  /* the Greymarch on the table: the ONLY warm thing on the continent — because it is */
  function drawGreymarch(g) {
    const fp = gmRect();
    // the footprint frame, dashed gold
    g.strokeStyle = '#ffc978'; g.globalAlpha = 0.85; g.lineWidth = 1.2; g.setLineDash([4, 4]);
    let prev = null;
    const ring = [[fp.u0, fp.v0], [fp.u0 + fp.w, fp.v0], [fp.u0 + fp.w, fp.v0 + fp.h], [fp.u0, fp.v0 + fp.h], [fp.u0, fp.v0]];
    g.beginPath();
    for (const [u, v] of ring) { const p = project(u, v, 0.004); if (prev) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); prev = p; }
    g.stroke(); g.setLineDash([]);
    // LIGHT AS STIPPLE: the live coverage, dotted gold — the lamp doctrine at continental scale
    const cov = (typeof S !== 'undefined' && S && S.cov) || 0;
    const dots = Math.round(26 + cov * 300);
    g.fillStyle = '#ffd98f';
    const rg = U.rng(9);
    for (let n = 0; n < dots; n++) {
      const u = fp.u0 + rg() * fp.w, v = fp.v0 + rg() * fp.h;
      const p = project(u, v, 0.006);
      g.globalAlpha = (0.4 + rg() * 0.5) * fade(p.d);
      g.fillRect(p.x, p.y, 2, 2);
    }
    if (typeof S === 'undefined' || !S) { g.globalAlpha = 1; return; }
    // stations: lit gold, met grey; camps rust rings; the walker a white pulse
    for (const id of DATA.stationOrder) {
      const d = DATA.stations[id], stn = S.stations[id];
      const [u, v] = gmUV(d.x, d.y), p = project(u, v, 0.008);
      const k = U.clamp(p.s * 0.006, 1.6, 5);   // the pips grow as the table is leaned into
      g.globalAlpha = 0.95;
      g.fillStyle = '#12161c'; g.fillRect(p.x - k, p.y - k, k * 2, k * 2);
      g.fillStyle = stn.connected ? '#ffc978' : '#5a6472'; g.fillRect(p.x - k + 1, p.y - k + 1, k * 2 - 2, k * 2 - 2);
    }
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id];
      if (!c || c.pacified) continue;
      const [u, v] = gmUV(cd.x, cd.y), p = project(u, v, 0.008);
      g.globalAlpha = 0.8; g.strokeStyle = '#d96b4f'; g.lineWidth = 1;
      g.beginPath(); g.arc(p.x, p.y, U.clamp(p.s * 0.008, 3, 8), 0, 7); g.stroke();
    }
    const [pu, pv] = gmUV(S.px, S.py), pp = project(pu, pv, 0.01);
    const pulse = (Math.sin(st.t * 4) + 1) / 2;
    const pk = U.clamp(pp.s * 0.005, 1.5, 4);
    g.globalAlpha = 1; g.fillStyle = '#ffffff'; g.fillRect(pp.x - pk, pp.y - pk, pk * 2, pk * 2);
    g.globalAlpha = 0.5 - pulse * 0.3; g.strokeStyle = '#ffffff';
    g.beginPath(); g.arc(pp.x, pp.y, pk * 2.5 + pulse * 4, 0, 7); g.stroke();
    g.globalAlpha = 1;
  }

  /* leader-line labels — the reference grammar, in the register's voice */
  function label(g, u, v, name, sub, col, lift) {
    const p = project(u, v, 0.004);
    const ly = p.y - lift;
    g.globalAlpha = 0.7; g.strokeStyle = col; g.lineWidth = 1;
    g.beginPath(); g.moveTo(p.x, p.y - 4); g.lineTo(p.x, ly + 12); g.stroke();
    g.fillStyle = col; g.fillRect(p.x - 2, p.y - 2, 4, 4);
    g.globalAlpha = 1;
    g.font = '700 12px ui-monospace, Menlo, monospace'; g.textAlign = 'center';
    g.fillStyle = 'rgba(5,7,11,0.85)'; g.fillText(name, p.x + 1, ly + 1);
    g.fillStyle = col; g.fillText(name, p.x, ly);
    if (sub) {
      g.font = '9px ui-monospace, Menlo, monospace';
      g.fillStyle = 'rgba(5,7,11,0.8)'; g.fillText(sub, p.x + 1, ly + 12);
      g.fillStyle = '#7a7666'; g.fillText(sub, p.x, ly + 11);
    }
  }
  function drawRegionMarkers(g) {
    const fp = gmRect();
    const cov = (typeof S !== 'undefined' && S && S.cov) || 0;
    label(g, fp.cu, fp.v0, '[ THE GREYMARCH ]', `YOU ARE HERE · LIGHT ${Math.round(cov * 100)}%`, '#ffd98f', 46);
    /* v3.28 — the uncharted pins are MISSIONS now: each carries its frontier phase, a click
       target, and (riding) the rider's own dot crossing the table toward it */
    st.hits = [];
    const live = typeof S !== 'undefined' && S && typeof Frontier !== 'undefined';
    for (const rg of Globe.REGIONS) {
      if (rg.kind !== 'uncharted') continue;
      /* a reach past the table's margin is CLAMPED to the edge, never dropped — the pin marks
         the direction the rider goes; recon is what pulls the far marches onto the paper */
      const u = U.clamp((rg.lon - win.lon0) / win.lonW, 0.05, 0.95);
      const v = U.clamp((rg.lat - win.lat0) / win.latW, 0.07, 0.93);
      const ph = live ? Frontier.phase(rg.id) : 'unknown';
      if (ph === 'unknown') label(g, u, v, `[ ${rg.name} ]`, 'UNCHARTED · CLICK TO FUND RECON', '#8a8f98', 34);
      else if (ph === 'riding') {
        const fr = Frontier.info(rg.id);
        label(g, u, v, `[ ${rg.name} ]`, `RIDER OUT · ${fr.rider ? fr.rider.split(' ')[0].toUpperCase() : 'MOUNTED'} · ${Math.round(Frontier.progress(rg.id) * 100)}%${fr.hazarded ? ' · GONE QUIET' : ''}`, fr.hazarded ? '#d96b4f' : '#b8b29d', 34);
        // the rider on the table: a white dot walking the straight survey line out of the Greymarch
        const t = Frontier.progress(rg.id);
        const ru = fp.cu + (u - fp.cu) * t, rv = fp.cv + (v - fp.cv) * t;
        const rp = project(ru, rv, 0.008);
        const blink = (Math.sin(st.t * 6) + 1) / 2;
        g.globalAlpha = 0.55 + blink * 0.45; g.fillStyle = '#ffffff';
        g.fillRect(rp.x - 2, rp.y - 2, 4, 4);
        g.globalAlpha = 0.3; g.strokeStyle = '#8a8f98'; g.setLineDash([2, 5]); g.lineWidth = 1;
        const p0 = project(fp.cu, fp.cv, 0.006), p1 = project(u, v, 0.006);
        g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke(); g.setLineDash([]);
        g.globalAlpha = 1;
      }
      else if (ph === 'charted') label(g, u, v, `[ ${rg.name} ]`, 'CHARTED · CLICK TO FOUND AN OUTPOST', '#ffd98f', 34);
      else if (ph === 'building') label(g, u, v, `[ ${rg.name} ]`, `FOUNDING · ${Math.round(Frontier.progress(rg.id) * 100)}% · THE CARAVAN IS ON THE ROAD`, '#ffd98f', 34);
      else if (ph === 'outpost') {
        const fr = Frontier.info(rg.id);
        const cyc = Math.round(((fr.cyc || 0) / DATA.T.outpostCycle) * 100);
        label(g, u, v, `[ ${fr.reach.outpost} ]`, `OUTPOST · HAULS ${fr.hauls || 0} · NEXT ${cyc}%${fr.guard ? ' · ESCORTED' : ''}`, '#ffd98f', 34);
        // the outpost pip: a lit gold square out on the dark table — OURS
        const p = project(u, v, 0.008);
        const k = U.clamp(p.s * 0.005, 2, 5);
        g.globalAlpha = 0.95; g.fillStyle = '#12161c'; g.fillRect(p.x - k - 1, p.y - k - 1, k * 2 + 2, k * 2 + 2);
        g.fillStyle = '#ffc978'; g.fillRect(p.x - k, p.y - k, k * 2, k * 2);
        // the caravan: a dot walking home along the survey line as the cycle closes
        if ((fr.cyc || 0) > DATA.T.outpostCycle * 0.8) {
          const t = ((fr.cyc || 0) - DATA.T.outpostCycle * 0.8) / (DATA.T.outpostCycle * 0.2);
          const cu2 = u + (fp.cu - u) * t, cv3 = v + (fp.cv - v) * t;
          const cp = project(cu2, cv3, 0.007);
          g.fillStyle = fr.guard ? '#8d979c' : '#d8d2bd'; g.globalAlpha = 0.9;
          g.fillRect(cp.x - 1.5, cp.y - 1.5, 3, 3);
        }
        g.globalAlpha = 1;
      }
      const hp2 = project(u, v, 0.004);
      st.hits.push({ id: rg.id, x: hp2.x, y: hp2.y, r: 40 });
    }
    /* v3.30 THE EXILE ROADS — Shutterlight and the Cold Door: pins no rider charts. They appear
       when the exiles decide you have seen enough, at the table's far north-west — the direction
       the charcoal line walks off the paper. */
    if (live && typeof Exile !== 'undefined') {
      const exPins = [
        { id: 'shutterlight', u: 0.07, v: 0.10 },
        { id: 'colddoor', u: 0.26, v: 0.06 },
      ];
      for (const p of exPins) {
        if (!Exile.visible(p.id)) continue;
        const ph = Exile.phase();
        if (p.id === 'shutterlight') {
          if (ph === 'marked') label(g, p.u, p.v, '[ A MARK NOBODY MADE ]', 'A HOODED LANTERN, CHARCOALED · CLICK TO FOLLOW', '#c9b98a', 34);
          else if (ph === 'following') label(g, p.u, p.v, '[ THE GUIDE\'S LINE ]', 'A ROAD NO SURVEY WILL HOLD', '#c9b98a', 34);
          else {
            label(g, p.u, p.v, '[ SHUTTERLIGHT ]', `THE EXILES' CITY · GUILD ${Exile.rank()} · CLICK TO TRADE`, '#c9b98a', 34);
            const pp = project(p.u, p.v, 0.008);
            const k = U.clamp(pp.s * 0.005, 2, 5);
            g.globalAlpha = 0.95; g.fillStyle = '#12161c'; g.fillRect(pp.x - k - 1, pp.y - k - 1, k * 2 + 2, k * 2 + 2);
            g.fillStyle = '#c9b98a'; g.fillRect(pp.x - k, pp.y - k, k * 2, k * 2);
            g.fillStyle = '#1a2029'; g.fillRect(pp.x - 1, pp.y - k, 2, k);   // the shutter, half down
            g.globalAlpha = 1;
          }
        } else {
          label(g, p.u, p.v, '[ THE COLD DOOR ]', (S.exile && S.exile.door === 'opened') ? 'OPEN · THE SOCIETY ANSWERS' : 'A KNOCK IS ANSWERED NOW · CLICK', '#8fb08a', 30);
        }
        const hp3 = project(p.u, p.v, 0.004);
        st.hits.push({ id: p.id, x: hp3.x, y: hp3.y, r: 40 });
      }
    }
    /* v3.32 THE REPUBLIC IN FORCE — the mountain road at the table's far EAST edge, and past it
       Farkeep itself once the pass is cut. The direction the Farlands lie. */
    if (live && typeof Republic !== 'undefined') {
      const M = REP.MOUNTAIN, mt = Republic.mountain();
      const mp = M.pin;
      if (mt.phase === 'unknown') label(g, mp.u, mp.v, '[ THE MOUNTAIN PASS ]', 'THE ROAD THEIR GRANDFATHERS WALKED DOWN · CLICK TO FUND', '#8d979c', 34);
      else if (mt.phase === 'cutting') label(g, mp.u, mp.v, '[ THE ROAD-GANGS ]', `CUTTING THE PASS · ${Math.round(mt.t / M.dur * 100)}%`, '#8d979c', 34);
      else label(g, mp.u, mp.v, '[ THE MOUNTAIN ROAD ]', 'CUT AND HELD · FARKEEP ANSWERS THE WIRE', '#ffd98f', 34);
      const hpM = project(mp.u, mp.v, 0.004);
      st.hits.push({ id: 'mountain', x: hpM.x, y: hpM.y, r: 40 });
      if (mt.phase === 'open') {
        const fp = M.farkeepPin;
        label(g, fp.u, fp.v, '[ FARKEEP ]', 'THE REPUBLIC\'S MUSCLE · THE KIT HIRES · CLICK', '#ffd98f', 52);
        const pp2 = project(fp.u, fp.v, 0.01);
        const k2 = U.clamp(pp2.s * 0.005, 2, 5);
        g.globalAlpha = 0.95; g.fillStyle = '#12161c'; g.fillRect(pp2.x - k2 - 1, pp2.y - k2 - 1, k2 * 2 + 2, k2 * 2 + 2);
        g.fillStyle = '#8d979c'; g.fillRect(pp2.x - k2, pp2.y - k2, k2 * 2, k2 * 2);
        g.fillStyle = '#ffd98f'; g.fillRect(pp2.x - 1, pp2.y - k2 - 3, 2, 3);   // the lit pass over the teeth
        g.globalAlpha = 1;
        const hpF = project(fp.u, fp.v, 0.004);
        st.hits.push({ id: 'farkeepdesk', x: hpF.x, y: hpF.y, r: 40 });
      }
    }
  }

  /* the side columns: the depth is DATA — every line real, from the ledger, bracketed */
  function colText(g, x, y, rows) {
    g.textAlign = 'left';
    for (const [k, vTxt, col] of rows) {
      if (k) { g.font = '700 10px ui-monospace, Menlo, monospace'; g.fillStyle = '#7a7666'; g.fillText(k, x, y); y += 13; }
      if (vTxt !== undefined) { g.font = '700 13px ui-monospace, Menlo, monospace'; g.fillStyle = col || '#f2ead4'; g.fillText(vTxt, x, y); y += 19; }
    }
    return y;
  }
  function drawColumns(g) {
    if (typeof S === 'undefined' || !S) return;
    let lit = 0; for (const id of DATA.stationOrder) if (S.stations[id].connected) lit++;
    let paved = 0, tot = 0; for (const r of DATA.roads) { tot += r.segs; paved += S.roads[r.id].filter(b => b).length; }
    let quiet = 0; for (const cd of DATA.camps) if (S.camps[cd.id] && S.camps[cd.id].pacified) quiet++;
    const party = NPC.party().length;
    const tier = FACT.RENEGADE_TIERS[Systems.renegadeTier()][1];
    g.globalAlpha = 1;
    let y = 30;
    g.font = '700 10px ui-monospace, Menlo, monospace'; g.fillStyle = '#8a6534';
    g.textAlign = 'left'; g.fillText('[ CONTINENTAL SURVEY ]', 22, y); y += 18;
    y = colText(g, 22, y, [
      ['REGION', 'THE GREYMARCH', '#ffd98f'],
      ['WAYLIGHT COVERAGE', `${Math.round((S.cov || 0) * 100)}%`, '#57f0d8'],
      ['STATIONS LIT', `${lit} / ${DATA.stationOrder.length}`],
      ['ROADS PAVED', `${paved} / ${tot}`],
      ['PARTY', `${1 + party} / 4`],
    ]);
    y += 8;
    g.font = '700 10px ui-monospace, Menlo, monospace'; g.fillStyle = '#8a6534';
    g.fillText('[ CONDITIONS ]', 22, y); y += 18;
    colText(g, 22, y, [
      ['WEATHER', (S.weather.state || 'clear').toUpperCase(), S.weather.state === 'grey' ? '#9aa4ff' : '#b8b29d'],
      ['THE WALK', S.moveTo ? 'UNDER WAY' : 'HOLDING', '#b8b29d'],
    ]);
    // right column
    const xr = cw - 190;
    let yr = 30;
    g.font = '700 10px ui-monospace, Menlo, monospace'; g.fillStyle = '#8a6534';
    g.fillText('[ THE LEDGER ]', xr, yr); yr += 18;
    yr = colText(g, xr, yr, [
      ['TRUST', `◆ ${Math.round(S.likes)}`, '#ffd98f'],
      ['KARMA', tier.toUpperCase(), S.renegade >= 8 ? '#d9736b' : '#b8b29d'],
      ['DELIVERIES', `${(S.stats && S.stats.delivered) || 0}`],
      ['CAMPS QUIET', `${quiet} / ${DATA.camps.length}`, quiet ? '#8fe06f' : '#b8b29d'],
    ]);
    /* v3.28 — the frontier ledger: the table's own business, from the one truth */
    if (typeof Frontier !== 'undefined') {
      const fc = Frontier.counts();
      yr += 8;
      g.font = '700 10px ui-monospace, Menlo, monospace'; g.fillStyle = '#8a6534';
      g.fillText('[ THE FRONTIER ]', xr, yr); yr += 18;
      colText(g, xr, yr, [
        ['RIDERS OUT', `${fc.riding}`, fc.riding ? '#f2ead4' : '#7a7666'],
        ['REACHES CHARTED', `${fc.charted} / ${Object.keys(Frontier.REACHES).length}`, fc.charted ? '#ffd98f' : '#7a7666'],
        ['OUTPOSTS', `${fc.outposts}`, fc.outposts ? '#ffd98f' : '#7a7666'],
        ['HAULS LANDED', `${fc.hauls}`, fc.hauls ? '#8fe06f' : '#7a7666'],
        ['CARAVANS RAIDED', `${fc.raids}`, fc.raids ? '#d9736b' : '#7a7666'],
      ]);
    }
    // the instruments: a scale bar and the register stamp — a working table, not a picture
    const sy0 = ch - 44;
    g.globalAlpha = 0.8; g.strokeStyle = '#7a7666'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(24, sy0); g.lineTo(114, sy0); g.stroke();
    g.beginPath(); g.moveTo(24, sy0 - 4); g.lineTo(24, sy0 + 4); g.moveTo(69, sy0 - 3); g.lineTo(69, sy0 + 3); g.moveTo(114, sy0 - 4); g.lineTo(114, sy0 + 4); g.stroke();
    g.font = '700 9px ui-monospace, Menlo, monospace'; g.fillStyle = '#7a7666'; g.textAlign = 'left';
    g.fillText('[ 100 LEAGUES ]', 24, sy0 - 8);
    g.textAlign = 'right';
    g.fillText('SURVEY REF C-' + (('' + ((S.time | 0) % 900 + 100))), cw - 22, ch - 40);
    g.fillText('THE ORDER OF WAYLIGHTERS · CONTINENTAL DESK', cw - 22, ch - 28);
    g.textAlign = 'left';
  }

  /* ---------- the frontier desk (v3.28): a pin's own sheet, standing on the table ---------- */
  let deskId = null, deskT = 0;
  const deskEl = () => document.getElementById('contPanel');
  function renderDesk() {
    const el = deskEl();
    if (!el || !deskId || typeof S === 'undefined' || !S || typeof Frontier === 'undefined') return;
    /* v3.30 — the exile pins carry their own desk; the frontier reaches keep theirs.
       v3.32 — the mountain and Farkeep carry the Republic's. */
    if (deskId === 'mountain' || deskId === 'farkeepdesk') {
      if (typeof RepublicUI !== 'undefined') { RepublicUI.renderDesk(el, deskId); wireDesk(el); }
      return;
    }
    if (!Frontier.REACHES[deskId]) {
      if (typeof Exile !== 'undefined') { Exile.renderDesk(el, deskId); wireDesk(el); }
      return;
    }
    const fr = Frontier.info(deskId), reach = fr.reach, T = DATA.T;
    const cost = c => Object.entries(c).map(([k, v]) => `${v} ${k}`).join(' · ');
    const bankRow = `<div class="fdBank">BANKED · ${['metal', 'wood', 'ceramic', 'provisions', 'lumen'].map(k => `${k} <b>${Math.floor(S.banked[k] || 0)}</b>`).join(' · ')}</div>`;
    let body = '';
    if (fr.phase === 'unknown') {
      const rg = Globe.REGIONS.find(r => r.id === deskId);
      body = `<div class="fdLine">${rg ? rg.blurb : ''}</div>
        <div class="fdLine dim">A Farkeeper rider goes out from a stable town; recon runs itself and the map fills in behind them. The ride wants <b>${cost(T.reconHire)}</b> banked.</div>
        ${bankRow}
        <button class="fdBtn" data-act="recon">FUND THE RECON RIDE — ${cost(T.reconHire)}</button>`;
    } else if (fr.phase === 'riding') {
      body = `<div class="fdLine"><b>${fr.rider}</b> is out past the table's edge — survey <b>${Math.round(Frontier.progress(deskId) * 100)}%</b>.</div>
        <div class="fdLine dim">${fr.hazarded ? 'They went QUIET at the midpoint — riding around something, not under it. The survey runs late, not lost.' : 'Recon runs itself. The mountain does not send riders it expects to lose.'}</div>`;
    } else if (fr.phase === 'charted') {
      body = `<div class="fdLine">CHARTED. The table will take an outpost here: <b>${reach.outpost}</b> — it hauls <b>${reach.yieldLine}</b> every cycle, into the same bank the ecosystem revolves through.</div>
        <div class="fdLine dim">The founding caravan wants <b>${cost(T.outpostCost)}</b> banked.</div>
        ${bankRow}
        <button class="fdBtn" data-act="outpost">FOUND ${reach.outpost} — ${cost(T.outpostCost)}</button>`;
    } else if (fr.phase === 'building') {
      body = `<div class="fdLine">The founding caravan is on the road — <b>${Math.round(Frontier.progress(deskId) * 100)}%</b>. ${reach.outpost} goes up where the rider staked it.</div>`;
    } else {
      const cyc = Math.round(((fr.cyc || 0) / T.outpostCycle) * 100);
      body = `<div class="fdLine"><b>${reach.outpost}</b> stands. Hauls landed <b>${fr.hauls || 0}</b> · caravans raided <b>${fr.raids || 0}</b> · next haul <b>${cyc}%</b>.</div>
        <div class="fdLine dim">Per cycle: <b>${reach.yieldLine}</b>. ${fr.guard ? 'The mountain walks beside every haul — the escort eats ' + T.contractCost + ' provisions a cycle.' : 'The caravans walk the dark roads ALONE — raiders roll their dice on every haul.'}</div>
        <button class="fdBtn ${fr.guard ? 'on' : ''}" data-act="guard">${fr.guard ? 'ESCORT CONTRACT · ON — let it lapse' : `FUND THE FARKEEPER ESCORT — ${T.contractCost} provisions / cycle`}</button>`;
    }
    const html = `<div class="fdHead"><span>[ ${fr.phase === 'outpost' ? reach.outpost : reach.name} ]</span><button class="fdX" data-act="close">✕</button></div>${body}`;
    if (el._html !== html) { el._html = html; el.innerHTML = html; }   // v3.51: the half-second refresh rewrites only what changed
    wireDesk(el);
  }
  function wireDesk(el) {
    if (el._wired) return;
    el._wired = true;
    /* v3.51: a press is its button's, whatever the refresh did to the element under it — the act is taken at the press and
       worked at the release on the same act (a press held across a rewrite funds its contract); a keyboard's click works at once */
    const actOf = t => { const a = t && t.closest ? t.closest('[data-act]') : null; return a ? a.getAttribute('data-act') : null; };
    el.addEventListener('mousedown', e => { el._press = actOf(e.target); });
    el.addEventListener('mouseup', e => { const act = actOf(e.target), p = el._press; el._press = null; if (act && act === p) work(act); });
    el.addEventListener('click', e => { if (e.detail === 0) { const act = actOf(e.target); if (act) work(act); } });
    function work(act) {
      if (act === 'close') { closeDesk(); return; }
      if (act === 'recon') Frontier.fundRecon(deskId);
      else if (act === 'outpost') Frontier.fundOutpost(deskId);
      else if (act === 'guard') Frontier.toggleGuard(deskId);
      else if (act.startsWith('rep_') && typeof RepublicUI !== 'undefined') RepublicUI.deskAct(act, deskId);   // v3.32: the Republic's verbs
      else if (typeof Exile !== 'undefined') Exile.deskAct(act, deskId);   // v3.30: the exile desk's own verbs
      renderDesk();
    }
  }
  function openDesk(id) { deskId = id; deskT = 0; renderDesk(); const el = deskEl(); if (el) el.classList.remove('hidden'); Snd.sfx.ui && Snd.sfx.ui(); }
  function closeDesk() { deskId = null; const el = deskEl(); if (el) el.classList.add('hidden'); }

  /* ---------- open/close + input ---------- */
  function frame(ts) {
    if (!st.open) return;
    const dt = Math.min(0.1, (ts - st.last) / 1000 || 0.016); st.last = ts; st.t += dt;
    if (!st.drag) { st.yaw += st.vel * dt + 0.008 * dt; st.vel *= Math.pow(0.1, dt); st.yaw = U.clamp(st.yaw, -0.45, 0.45); }
    const cv2 = document.getElementById('cont');
    if (cv2) render(cv2);
    if (deskId) { deskT += dt; if (deskT >= 0.5) { deskT = 0; renderDesk(); } }   // the desk keeps its numbers honest
    st.raf = requestAnimationFrame(frame);
  }
  function open() {
    bake();
    const wrap = document.getElementById('contWrap');
    const cv2 = document.getElementById('cont');
    if (!wrap || !cv2) return;
    cv2.width = wrap.clientWidth; cv2.height = wrap.clientHeight;
    st.open = true; st.last = 0;
    if (!open._wired) {
      open._wired = true;
      cv2.addEventListener('mousedown', e => { st.drag = { x: e.clientX, y0: st.yaw, x0: e.clientX, yScr: e.clientY, moved: 0 }; st.vel = 0; });
      window.addEventListener('mousemove', e => {
        if (!st.drag) return;
        st.drag.moved = Math.max(st.drag.moved || 0, Math.abs(e.clientX - st.drag.x0) + Math.abs(e.clientY - st.drag.yScr));
        st.yaw = U.clamp(st.drag.y0 + (e.clientX - st.drag.x) * 0.0022, -0.45, 0.45);
        st._lx = st._lt ? (e.clientX - st._lpx) / Math.max(0.001, (performance.now() - st._lt) / 1000) : 0;
        st._lpx = e.clientX; st._lt = performance.now();
      });
      window.addEventListener('mouseup', e => {
        if (!st.drag) return;
        const wasClick = (st.drag.moved || 0) < 7;
        st.vel = wasClick ? 0 : (st._lx || 0) * 0.0022; st.drag = null; st._lt = 0;
        /* v3.28 — a CLICK on the table (not a drag) reads the pins: the frontier desk opens */
        if (wasClick && st.open) {
          const rect = cv2.getBoundingClientRect();
          const mx = e.clientX - rect.left, my = e.clientY - rect.top;
          let hitId = null;
          for (const h of st.hits || []) if (U.dist(mx, my, h.x, h.y) < h.r || U.dist(mx, my, h.x, h.y - 34) < h.r) hitId = h.id;
          if (hitId) openDesk(hitId); else closeDesk();
        }
      });
      cv2.addEventListener('wheel', e => { e.preventDefault(); st.zoom = U.clamp(st.zoom * (e.deltaY > 0 ? 0.94 : 1.06), 0.8, 1.7); }, { passive: false });
    }
    cancelAnimationFrame(st.raf);
    st.raf = requestAnimationFrame(frame);
  }
  function close() { st.open = false; cancelAnimationFrame(st.raf); closeDesk(); }

  return { open, close, bake, get isOpen() { return st.open; }, _st: st, gmRect, get win() { return win; }, openDesk, closeDesk };
})();


