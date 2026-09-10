'use strict';
/* Waylight v3.24 — THE WORLD OF WAYLIGHT. The whole game so far is ONE REGION of it.
   The globe is the absurd-realism gag played completely straight: while the valley is authored
   texels and Bayer dither, the world map is a per-pixel shaded PLANET — hypsometric tints,
   an ocean with a specular sun, drifting cloud decks, a blue rim of atmosphere, city lights on
   the night side. Laughably more advanced than the game it lives in. That contrast is the joke,
   and the craft. (Doctrine note: no canvas gradient API anywhere — every pixel is computed.)

   Fixed in place, rotatable by hand — a desk globe. The valley is a pin on one coast.
   The other regions are pins the RECON system will someday open (Frostpunk-1 outpost law):
   the data shape below is the futureproofing — {id, name, lon, lat, open, blurb}. */

const Globe = (() => {
  const EW = 768, EH = 384;                    // equirect bake resolution
  const SEA = 0.52;                            // 29% land — the Earth-like joke, committed to
  const TILT = -0.24;                          // the desk-globe lean
  let elevM = null, colM = null, cloudM = null, nightM = null;   // baked maps
  let baked = false;

  /* THE KNOWN WORLD — the lore's real places, never invented ones. WAYLIGHT is a CITY, the
     capital of the Republic of Connection; the world is not named after it. The land under the
     player's boots is THE GREYMARCH — the borderland march of the Grey (colloquially, the
     valley). Across the water: the Dawnlands, where Waylight burns — the first dawning of the
     last light, the source every waylight is lit from — flanked by THE FARLANDS, the Farkeepers'
     mountains. kind: 'open' (walked) · 'home' (known — the long road home) · uncharted (recon). */
  const REGIONS = [
    { id: 'greymarch', name: 'THE GREYMARCH', lon: 0.62, lat: 0.52, open: true, kind: 'open', blurb: 'The dark march the Order is lighting. Everything you have ever walked.' },
    { id: 'waylight', name: 'WAYLIGHT', sub: 'THE FIRST LIGHT · SEAT OF THE REPUBLIC', lon: 3.8, lat: -0.28, open: false, kind: 'home', blurb: 'The capital. The first dawning of the last light — every waylight in the world is lit from here.' },
    { id: 'farlands', name: 'THE FARLANDS', sub: 'FARKEEP · THE REPUBLIC OF CONNECTION', lon: 4.35, lat: -0.62, open: false, kind: 'home', blurb: 'The Farkeepers\' mountains. The Republic\'s muscle was raised on this stone.' },   // negative lat = the top of the disc
    { id: 'saltflats', name: 'THE SALT FLATS', lon: 0.3, lat: 0.34, open: false, kind: 'uncharted', blurb: 'A sea that forgot itself. Recon will open it.' },     // v3.26: the uncharted reaches live ON the darklands continent — the recon system's own ground
    { id: 'lowmarrow', name: 'LOW MARROW', lon: 0.98, lat: 0.72, open: false, kind: 'uncharted', blurb: 'Older roads than ours. Recon will open it.' },
  ];

  /* ---------- 3D value noise on the unit sphere (fixed seed — the same planet, forever) ---------- */
  function hash3(x, y, z) {   // murmur-style finalizer — flat over [0,1), no lattice bias
    let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x9e3779b9);
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const l = (a, b, t) => a + (b - a) * t;
    return l(
      l(l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
      l(l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
  }
  function fbm(x, y, z, oct, lac, gain) {
    let a = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) { a += vnoise(x * f, y * f, z * f) * amp; norm += amp; amp *= gain; f *= lac; }
    return a / norm;
  }

  /* ---------- the bake: one pass, cached for the session ---------- */
  function bake() {
    if (baked) return;
    elevM = new Float32Array(EW * EH);
    colM = new Uint32Array(EW * EH);
    cloudM = new Float32Array(EW * EH);
    nightM = new Uint8Array(EW * EH);
    for (let y = 0; y < EH; y++) {
      const lat = (y / EH - 0.5) * Math.PI;
      const cl = Math.cos(lat), sl = Math.sin(lat);
      for (let x = 0; x < EW; x++) {
        const lon = (x / EW) * Math.PI * 2;
        const px3 = cl * Math.cos(lon), py3 = sl, pz3 = cl * Math.sin(lon);
        // continents: low-frequency body + ridged detail; poles pushed cold
        let h = fbm(px3 * 1.6 + 9.2, py3 * 1.6 + 4.7, pz3 * 1.6 + 1.3, 6, 2.05, 0.52);
        h += (fbm(px3 * 5 + 30, py3 * 5 + 30, pz3 * 5 + 30, 4, 2.2, 0.5) - 0.5) * 0.22;
        const i = y * EW + x;
        elevM[i] = h;
        const alat = Math.abs(sl);
        let r, g, b;
        if (h < SEA) {                                          // the ocean, deep to shelf
          const d = (SEA - h) / SEA;
          r = 12 + (1 - d) * 30; g = 34 + (1 - d) * 62; b = 66 + (1 - d) * 88;
        } else {
          const t = (h - SEA) / (1 - SEA);                      // hypsometric land
          if (t < 0.08) { r = 168; g = 156; b = 116; }          // shore sand
          else if (t < 0.35) { r = 62 + t * 90; g = 96 + t * 60; b = 44 + t * 30; }   // lowland green
          else if (t < 0.62) { r = 118 + t * 60; g = 100 + t * 40; b = 62 + t * 30; } // highland ochre
          else { const s = (t - 0.62) / 0.38; r = 140 + s * 100; g = 132 + s * 105; b = 120 + s * 115; }  // rock to snow
          if (alat > 0.72) { const s = Math.min(1, (alat - 0.72) / 0.2); r += (238 - r) * s; g += (242 - g) * s; b += (246 - b) * s; }  // ice caps
          // night side: settlements glitter along coasts and lowlands — a world FULL of people we cannot reach yet
          const nl = fbm(px3 * 11 + 77, py3 * 11 + 77, pz3 * 11 + 77, 3, 2.3, 0.5);
          if (t < 0.3 && nl > 0.62 && alat < 0.65) nightM[i] = Math.min(255, ((nl - 0.62) / 0.1) * 255) | 0;
        }
        if (h >= SEA - 0.012 && h < SEA && alat > 0.8) { r = 226; g = 232; b = 238; }   // sea ice fringe
        colM[i] = (255 << 24) | (b << 16) | (g << 8) | r;
        // the cloud deck — its own weather, its own drift
        const c = fbm(px3 * 3.1 + 200, py3 * 3.1 + 200, pz3 * 3.1 + 200, 5, 2.15, 0.5);
        cloudM[i] = U.clamp((c - 0.52) * 3.2, 0, 1);
      }
    }
    // snap every region pin to real land (the valley to a COAST — we are a delivery people)
    for (const rg of REGIONS) {
      let bx = ((rg.lon / (Math.PI * 2)) * EW) | 0, by = (((rg.lat / Math.PI) + 0.5) * EH) | 0, found = false;
      for (let rad = 0; rad < 90 && !found; rad += 2) {
        for (let a = 0; a < 14 && !found; a++) {
          const x = (bx + Math.round(Math.cos(a / 14 * 7) * rad) + EW) % EW, y = U.clamp(by + Math.round(Math.sin(a / 14 * 7) * rad), 1, EH - 2);
          const land = elevM[y * EW + x] >= SEA;
          const coast = land && (elevM[y * EW + ((x + 6) % EW)] < SEA || elevM[y * EW + ((x - 6 + EW) % EW)] < SEA || elevM[(y + 4) * EW + x] < SEA || elevM[(y - 4) * EW + x] < SEA);
          if ((rg.id === 'greymarch' || rg.id === 'waylight') ? coast : land) { rg.lon = (x / EW) * Math.PI * 2; rg.lat = (y / EH - 0.5) * Math.PI; found = true; }   // marches and port capitals keep a coast
        }
      }
    }
    baked = true;
  }

  /* ---------- the projection: static per-pixel tables, so spinning is CHEAP ----------
     v3.26: the canvas carries PADDING past the halo — the atmosphere ends where IT ends, never
     where the asset does. (The square-clipped glow is on the record; it does not ship twice.) */
  const PADF = 0.26;                          // canvas half-size = r * (1 + PADF); halo reaches 1.2r
  let R = 0, DSZ = 0, PXN = 0, tblLat = null, tblLon = null, tblDiff = null, tblSpec = null, tblRim = null, tblIdx = null, halo = null;
  const LX = -0.52, LY = -0.34, LZ = 0.78;   // the sun, fixed in the room
  function buildTables(r) {
    if (R === r) return;
    R = r; const D = DSZ = Math.ceil(r * (1 + PADF)) * 2;
    const C = D / 2;
    tblIdx = new Int32Array(D * D); tblLat = new Int32Array(D * D); tblLon = new Float32Array(D * D);
    tblDiff = new Float32Array(D * D); tblSpec = new Float32Array(D * D); tblRim = new Float32Array(D * D);
    halo = new Float32Array(D * D);
    const ct = Math.cos(TILT), st = Math.sin(TILT);
    PXN = 0;
    for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
      const nx = (x - C + 0.5) / r, ny = (y - C + 0.5) / r, d2 = nx * nx + ny * ny;
      const o = y * D + x;
      if (d2 > 1) { tblIdx[o] = -1; const dd = Math.sqrt(d2); halo[o] = dd < 1.2 ? (1 - (dd - 1) / 0.2) : 0; continue; }
      const nz = Math.sqrt(1 - d2);
      // un-tilt the view ray onto the planet's axis
      const py3 = ny * ct - nz * st, pz3 = ny * st + nz * ct, px3 = nx;
      tblIdx[o] = PXN++;
      tblLat[o] = U.clamp((((Math.asin(U.clamp(py3, -1, 1)) / Math.PI) + 0.5) * EH) | 0, 0, EH - 1) * EW;
      tblLon[o] = ((Math.atan2(pz3, px3) / (Math.PI * 2)) + 1) * EW;
      const diff = Math.max(0, nx * LX + ny * LY + nz * LZ);
      tblDiff[o] = Math.pow(diff, 0.85);
      const rx = 2 * diff * nx - LX, ry = 2 * diff * ny - LY, rz = 2 * diff * nz - LZ;   // reflect(L, N)·V
      tblSpec[o] = Math.pow(Math.max(0, rz), 60) * (diff > 0 ? 1 : 0);
      tblRim[o] = Math.pow(1 - nz, 2.6);
    }
  }

  /* ---------- state ---------- */
  const st = { open: false, rot: 2.2, vel: 0, drag: null, t: 0, raf: 0, last: 0 };

  function render(cv2) {
    const D = DSZ, g = cv2.getContext('2d');
    const img = g.createImageData(D, D), px = new Uint32Array(img.data.buffer);
    const rotPx = ((st.rot / (Math.PI * 2)) * EW);
    const cloudPx = ((st.rot * 0.72 + st.t * 0.012) / (Math.PI * 2)) * EW;
    for (let o = 0; o < D * D; o++) {
      if (tblIdx[o] < 0) {
        if (halo[o] > 0) { const a = (halo[o] * halo[o] * 120) | 0; px[o] = (a << 24) | (0xd0 << 16) | (0x96 << 8) | 0x58; }
        continue;
      }
      const row = tblLat[o];
      let lx = (tblLon[o] + rotPx) % EW; if (lx < 0) lx += EW;
      const xi = lx | 0, xf = lx - xi, xi2 = (xi + 1) % EW;
      const i1 = row + xi, i2 = row + xi2;
      const h = elevM[i1] + (elevM[i2] - elevM[i1]) * xf;
      const c32 = colM[i1];
      let r = c32 & 255, g2 = (c32 >> 8) & 255, b = (c32 >> 16) & 255;
      let cx2 = (tblLon[o] + cloudPx) % EW; if (cx2 < 0) cx2 += EW;
      const cl = cloudM[row + (cx2 | 0)];
      const cs = cloudM[row + (((cx2 | 0) + 10) % EW)];              // the deck's shadow, thrown west
      const diff = tblDiff[o];
      let lum = 0.06 + diff * 0.97;
      lum *= (1 - cs * 0.22);                                        // cloud shadow on the ground
      r *= lum; g2 *= lum; b *= lum;
      if (h < SEA) { const sp = tblSpec[o] * 165; r += sp; g2 += sp * 0.96; b += sp * 0.82; }   // the sun on the sea
      if (cl > 0.02) { const ca = cl * 0.9 * (0.1 + diff * 0.95); r += (250 - r) * ca; g2 += (250 - g2) * ca; b += (252 - b) * ca; }
      if (diff < 0.1 && h >= SEA) { const nl = nightM[i1] * (1 - diff / 0.1); r += nl * 0.5; g2 += nl * 0.32; b += nl * 0.1; }  // the cities of the night side
      const rim = tblRim[o] * (0.12 + diff * 0.8);
      r += (88 - r) * rim; g2 += (150 - g2) * rim; b += (208 - b) * rim;   // breathable blue
      px[o] = (255 << 24) | ((U.clamp(b, 0, 255) | 0) << 16) | ((U.clamp(g2, 0, 255) | 0) << 8) | (U.clamp(r, 0, 255) | 0);
    }
    g.putImageData(img, 0, 0);
  }

  /* a region pin projected to disc coords, or null when it faces away */
  function pinPos(rg, r) {
    const cl = Math.cos(rg.lat), y0 = Math.sin(rg.lat);
    const lon = rg.lon - st.rot - Math.PI;      // inverse of the render's lon mapping
    const x0 = cl * Math.cos(-lon), z0 = cl * Math.sin(-lon);
    const ct = Math.cos(TILT), stt = Math.sin(TILT);
    const y1 = y0 * ct + z0 * stt, z1 = -y0 * stt + z0 * ct;    // tilt back into view space
    if (z1 < 0.06) return null;
    return { x: x0 * r, y: y1 * r, z: z1 };
  }

  /* ---------- the frame loop while the sheet is open ---------- */
  function frame(ts) {
    if (!st.open) return;
    const dt = Math.min(0.1, (ts - st.last) / 1000 || 0.016); st.last = ts; st.t += dt;
    if (!st.drag) { st.rot += st.vel * dt + 0.022 * dt; st.vel *= Math.pow(0.12, dt); }
    const cv2 = document.getElementById('globe');
    const ov = document.getElementById('globeOv');
    if (cv2 && ov) {
      render(cv2);
      drawOverlay(ov);
    }
    st.raf = requestAnimationFrame(frame);
  }

  /* the overlay: game-UI chunk on top of the smooth planet — the contrast, kept on purpose */
  function drawOverlay(ov) {
    const g = ov.getContext('2d'), W2 = ov.width, H2 = ov.height;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W2, H2);
    const cx2 = W2 / 2, cy2 = H2 / 2, r = R;   // the disc radius is R; the canvas is padded past it
    const counts = Systems.deliverableCounts ? Systems.deliverableCounts() : {};
    let aboard = 0; for (const k in counts) aboard += counts[k];
    for (const rg of REGIONS) {
      const p = pinPos(rg, r * 0.98);
      if (!p) continue;
      const sx = Math.round(cx2 + p.x), sy = Math.round(cy2 + p.y);
      const a = U.clamp((p.z - 0.06) * 2.2, 0, 1);
      g.globalAlpha = a;
      if (rg.open) {
        const pu = (Math.sin(st.t * 3) + 1) / 2;
        g.fillStyle = '#12161c'; g.fillRect(sx - 4, sy - 4, 8, 8);
        g.fillStyle = '#ffc978'; g.fillRect(sx - 3, sy - 3, 6, 6);
        g.fillStyle = '#fff2d0'; g.fillRect(sx - 1, sy - 3 - ((pu * 3) | 0), 2, 2);
        g.font = '700 13px Fraunces, Georgia, serif'; g.textAlign = 'center';
        g.fillStyle = '#0a0e14'; g.fillText(rg.name + ' — YOU ARE HERE', sx + 1, sy - 13);
        g.fillStyle = '#ffe3b0'; g.fillText(rg.name + ' — YOU ARE HERE', sx, sy - 14);
        if (aboard > 0) {   // the regional cargo tally — every crate on backs bound for THIS region
          const bw = 58;
          g.fillStyle = '#12161c'; g.fillRect(sx - bw / 2, sy + 8, bw, 16);
          g.fillStyle = '#1d2430'; g.fillRect(sx - bw / 2 + 1, sy + 9, bw - 2, 14);
          const ic = UI.earnIconImg && UI.earnIconImg('mat');
          if (ic) { g.imageSmoothingEnabled = false; g.drawImage(ic, sx - bw / 2 + 4, sy + 11, 10, 10); g.imageSmoothingEnabled = true; }
          g.font = '700 11px Atkinson Hyperlegible, sans-serif'; g.textAlign = 'left';
          g.fillStyle = '#ffd98f'; g.fillText(`${aboard} aboard`, sx - bw / 2 + 17, sy + 19);
        }
      } else if (rg.kind === 'home') {
        // the Republic's lands — KNOWN, loved, far. Waylight's own light reads from orbit:
        // stepped warm shells (the doctrine holds even in space)
        if (rg.id === 'waylight') {
          const br = 0.75 + 0.25 * ((Math.sin(st.t * 1.6) + 1) / 2);
          for (let i = 3; i >= 1; i--) {
            g.globalAlpha = a * 0.10 * br * (4 - i);
            g.fillStyle = '#ffd98f';
            g.beginPath(); g.arc(sx, sy, 4 + i * 5, 0, 7); g.fill();
          }
          g.globalAlpha = a;
        }
        g.fillStyle = '#12161c'; g.fillRect(sx - 4, sy - 4, 8, 8);
        g.fillStyle = rg.id === 'waylight' ? '#ffd98f' : '#b8a06a'; g.fillRect(sx - 3, sy - 3, 6, 6);
        g.fillStyle = '#12161c'; g.fillRect(sx - 1, sy - 1, 2, 2);
        g.font = '700 12px Fraunces, Georgia, serif'; g.textAlign = 'center';
        g.fillStyle = 'rgba(10,14,20,0.85)'; g.fillText(rg.name, sx + 1, sy - 11);
        g.fillStyle = '#ffe3b0'; g.fillText(rg.name, sx, sy - 12);
        if (rg.sub) {
          g.font = '700 8px Atkinson Hyperlegible, sans-serif';
          g.fillStyle = 'rgba(10,14,20,0.8)'; g.fillText(rg.sub, sx + 1, sy + 15);
          g.fillStyle = '#c9b98a'; g.fillText(rg.sub, sx, sy + 14);
        }
      } else {
        g.fillStyle = '#12161c'; g.fillRect(sx - 3, sy - 3, 6, 6);
        g.fillStyle = '#5a6472'; g.fillRect(sx - 2, sy - 2, 4, 4);
        g.font = '600 11px Fraunces, Georgia, serif'; g.textAlign = 'center';
        g.fillStyle = 'rgba(10,14,20,0.8)'; g.fillText(rg.name, sx + 1, sy - 9);
        g.fillStyle = '#8a8f98'; g.fillText(rg.name, sx, sy - 10);
        g.font = '10px Atkinson Hyperlegible, sans-serif';
        g.fillStyle = 'rgba(138,143,152,0.75)'; g.fillText('UNCHARTED', sx, sy + 14);
      }
      g.globalAlpha = 1;
    }
  }

  /* ---------- open/close + input ---------- */
  function open() {
    bake();
    const wrapC = document.getElementById('globeWrap');
    const cv2 = document.getElementById('globe'), ov = document.getElementById('globeOv');
    if (!wrapC || !cv2) return;
    const box = Math.min(wrapC.clientWidth, wrapC.clientHeight) - 24;
    const r = U.clamp(Math.floor(box / 2 / (1 + PADF)), 120, 250);   // the PADDED canvas fits the box — the halo never meets an edge
    buildTables(r);
    cv2.width = DSZ; cv2.height = DSZ;
    ov.width = DSZ; ov.height = DSZ;
    st.open = true; st.last = 0;
    if (!open._wired) {
      open._wired = true;
      ov.addEventListener('mousedown', e => { st.drag = { x: e.clientX, r0: st.rot }; st.vel = 0; });
      window.addEventListener('mousemove', e => { if (st.drag) { const d = (e.clientX - st.drag.x) / R * 1.1; st.rot = st.drag.r0 - d; st.vel = 0; st._lx = st._lt ? (e.clientX - st._lpx) / Math.max(0.001, (performance.now() - st._lt) / 1000) : 0; st._lpx = e.clientX; st._lt = performance.now(); } });
      window.addEventListener('mouseup', () => { if (st.drag) { st.vel = -(st._lx || 0) / R * 1.1; st.drag = null; st._lt = 0; } });
    }
    cancelAnimationFrame(st.raf);
    st.raf = requestAnimationFrame(frame);
  }
  function close() { st.open = false; cancelAnimationFrame(st.raf); }

  /* v3.26 — the continent samples the SAME bake: one truth about the world */
  function elevAt(lon, lat) {
    if (!baked) bake();
    let x = ((lon / (Math.PI * 2)) * EW) % EW; if (x < 0) x += EW;
    const y = U.clamp(((lat / Math.PI) + 0.5) * EH, 0, EH - 1.001);
    const xi = x | 0, yi = y | 0, xf = x - xi, yf = y - yi, xi2 = (xi + 1) % EW, yi2 = Math.min(EH - 1, yi + 1);
    const a = elevM[yi * EW + xi] + (elevM[yi * EW + xi2] - elevM[yi * EW + xi]) * xf;
    const b = elevM[yi2 * EW + xi] + (elevM[yi2 * EW + xi2] - elevM[yi2 * EW + xi]) * xf;
    return a + (b - a) * yf;
  }

  return { open, close, REGIONS, get isOpen() { return st.open; }, _st: st, bake, elevAt, get SEA() { return SEA; }, _pad: () => ({ DSZ, R }) };
})();
