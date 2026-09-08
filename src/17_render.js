'use strict';
/* Waylight — camera & painterly canvas renderer */

const Render = (() => {
  const { stations, stationOrder, T, structures: SDEF } = DATA;
  const cv = U.el('game');
  const mainCx = cv.getContext('2d');
  let cx = mainCx;                       // all world drawing goes through cx; frame() points it at the low-res buffer
  const PIXK = 3;                        // the era look — and an INTEGER, so every buffer pixel lands as an exact
                                         // 3×3 block on screen. A fractional upscale (the old 2.6) made columns
                                         // alternately 2 and 3 pixels wide: the phasing line-distortions in play.
                                         // Terrain texels also lock to whole buffer pixels below (quantized zoom),
                                         // and the world scrolls in whole pixels. No beat frequencies remain.
  let worldC = null, worldCx = null;
  let vw = 0, vh = 0, dpr = 1;
  let cam = { x: 2100, y: 4990, z: 1 };
  let zoomOverride = null;   // debug/evidence: pin the camera
  let titleDrift = false, driftT = 0;   // the title screen tours the valley — YOUR valley, paths and all
  let shakeT = 0, shakeAmp = 0, flareT = 0;
  const fx = [];        // {type,x,y,t,...}
  const likes = [];     // floating like particles (screen space)
  const rains = [];
  const wisps = [];
  let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let fxOn = true;
  let grain = null, vign = null, grainPat = null;

  function resize() {
    dpr = Math.min(1.5, devicePixelRatio || 1);
    vw = innerWidth; vh = innerHeight;
    cv.width = vw * dpr; cv.height = vh * dpr;
    worldC = document.createElement('canvas');
    worldC.width = Math.ceil(cv.width / PIXK); worldC.height = Math.ceil(cv.height / PIXK);
    worldCx = worldC.getContext('2d');
    vign = document.createElement('canvas');
    vign.width = vw; vign.height = vh;
    const g = vign.getContext('2d');
    const rad = g.createRadialGradient(vw / 2, vh / 2, Math.min(vw, vh) * 0.42, vw / 2, vh / 2, Math.max(vw, vh) * 0.75);
    rad.addColorStop(0, 'rgba(5,7,11,0)'); rad.addColorStop(1, 'rgba(5,7,11,0.55)');
    g.fillStyle = rad; g.fillRect(0, 0, vw, vh);
    buildPost();
  }
  // post frames: vignette with a different grain offset baked into each — one blit per frame
  const post = [];
  function buildPost() {
    if (!grain) return;
    post.length = 0;
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
      const g = c.getContext('2d');
      g.drawImage(vign, 0, 0, c.width, c.height);
      const pat = g.createPattern(grain, 'repeat');
      g.save(); g.globalAlpha = 0.55; g.translate((i * 53) % 160, (i * 97) % 160);
      g.fillStyle = pat; g.fillRect(-160, -160, c.width + 160, c.height + 160);
      g.restore();
      post.push(c);
    }
  }
  addEventListener('resize', resize); resize();

  (() => {
    grain = document.createElement('canvas'); grain.width = 160; grain.height = 160;
    const g = grain.getContext('2d'), im = g.createImageData(160, 160);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = 120 + Math.random() * 90 | 0;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 14;
    }
    g.putImageData(im, 0, 0);
    buildPost();
    for (let i = 0; i < 46; i++) wisps.push({ x: Math.random() * DATA.W, y: Math.random() * DATA.H, r: 100 + Math.random() * 190, ph: Math.random() * 9 });
  })();

  let effZ = 0;                          // the one true zoom this frame (quantized) — every space conversion uses it
  const w2sx = x => (x - cam.x) * (effZ || cam.z * dpr) + cv.width / 2;
  const w2sy = y => (y - cam.y) * (effZ || cam.z * dpr) + cv.height / 2;
  function screenToWorld(clientX, clientY) { const z2 = (effZ || cam.z * dpr) / dpr; return { x: cam.x + (clientX - vw / 2) / z2, y: cam.y + (clientY - vh / 2) / z2 }; }

  function shake(a) { if (fxOn && !reduced) { shakeAmp = Math.max(shakeAmp, a); shakeT = 0.35; } }
  function flare() { flareT = 1; }
  function buildFx(x, y) { fx.push({ type: 'ring', x, y, t: 0 }); }
  function hopCrate(x0, y0, x1, y1, cat) { fx.push({ type: 'hop', x0, y0, x1, y1, cat, t: 0 }); }
  function likeBurst(n) {
    for (let i = 0; i < n; i++) likes.push({
      x: cv.width / 2 + (Math.random() - 0.5) * 120 * dpr,
      y: cv.height * 0.4 + (Math.random() - 0.5) * 60 * dpr,
      vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 90, t: 0, dur: 1.2 + Math.random() * 0.8,
    });
  }

  /* ---------- local light: holes in the night ----------
     A light source at night erases the darkness over the ground it reaches — full in its heart,
     then two hems of ordered dither on the terrain texel grid, indexed in world space so the
     pattern sits still while the light moves. destination-out against the night layer only:
     no additive discs, no painted gold. The ground carries the light. */
  let nightC = null, nightCx = null, lastWtx = 0, lastWty = 0, curZw = 0.4;
  function punchLight(g, x, y, r, k = 1) {
    // THE LAW HOLDS HERE TOO: no partial alpha — a texel of night is either gone or intact,
    // and the falloff is carried entirely by Bayer coverage. k scales a weaker lamp's coverage.
    const T2 = World.TS;
    const ctx2 = Math.round(x / T2), cty2 = Math.round(y / T2);   // centre texel index
    const rT = Math.max(2, Math.round(r / T2));                   // radius in texels
    const hCore = rT * 0.58, hMid = rT * 0.8;
    g.fillStyle = '#fff';
    const covHeart = k >= 1 ? 1.01 : 0.7 * k + 0.2, covMid = 0.5 * k, covOut = 0.22 * k;
    for (let dy2 = -rT; dy2 <= rT; dy2++) {
      const yy = (cty2 + dy2) * T2;
      const wOut = Math.floor(Math.sqrt(Math.max(0, rT * rT - dy2 * dy2)));
      const wCore = Math.abs(dy2) <= hCore ? Math.floor(Math.sqrt(Math.max(0, hCore * hCore - dy2 * dy2))) : -1;
      const wMid = Math.abs(dy2) <= hMid ? Math.floor(Math.sqrt(Math.max(0, hMid * hMid - dy2 * dy2))) : -1;
      if (wCore >= 0 && covHeart > 1) g.fillRect((ctx2 - wCore) * T2, yy, (wCore * 2 + 1) * T2, T2);   // the heart: one solid span
      for (let dx2 = (covHeart > 1 ? wCore + 1 : 0); dx2 <= wOut; dx2++) {                              // the hems: dithered texels
        const cov = (dx2 <= wCore) ? covHeart : dx2 <= wMid ? covMid : covOut;
        for (const sg of [1, -1]) {
          const gx2 = ctx2 + sg * dx2, gy2 = cty2 + dy2;
          if (RBAY[gy2 & 3][gx2 & 3] / 16 < cov) g.fillRect(gx2 * T2, yy, T2, T2);
          if (dx2 === 0) break;
        }
      }
    }
  }
  function collectNightLights(inView) {
    const out = [];
    if (!S) return out;
    // the walker's lantern — the half of the game he plays in the dark
    if (S.state !== 'zip' && !S.dead && World.lightAt(S.px, S.py) < 0.42)
      out.push({ x: S.px, y: S.py - 6, r: S.flags.effects.bigLantern ? 150 : 92 });
    { const n = (typeof NPC !== 'undefined') && NPC.companion(); if (n && World.lightAt(n.x, n.y) < 0.42 && inView(n.x, n.y, 80)) out.push({ x: n.x, y: n.y, r: 55 }); }
    for (const st of S.structures) {
      if (st.hp <= 0) continue;
      if (st.type === 'generator' && inView(st.x, st.y, 160)) out.push({ x: st.x, y: st.y, r: 120 });
      else if (st.type === 'watchtower' && inView(st.x, st.y, 100)) out.push({ x: st.x, y: st.y - 30, r: 48, a: 0.72 });
    }
    for (const cd of DATA.camps) { const cs = S.camps[cd.id]; if (inView(cd.x, cd.y, 120)) out.push({ x: cd.x, y: cd.y, r: cs.pacified ? 80 : 62 }); }
    if (S.event && S.event.type === 'peddler' && inView(S.event.x, S.event.y, 100)) out.push({ x: S.event.x + 20, y: S.event.y - 10, r: 62 });
    for (const n of S.nodes) { if (!n.taken && n.type === 'lumen' && inView(n.x, n.y, 70)) { out.push({ x: n.x, y: n.y, r: 34, a: 0.65 }); if (out.length > 13) break; } }
    return out.slice(0, 14);
  }
  function frame(dt) {
    // camera
    let tx = S.px, ty = S.py, tz = zoomOverride || 1.12;
    if (titleDrift) {
      driftT += dt;
      const ids = DATA.stationOrder, seg = 14;
      const k = Math.floor(driftT / seg) % ids.length;
      const A = DATA.stations[ids[k]], B = DATA.stations[ids[(k + 1) % ids.length]];
      const f = U.smooth((driftT % seg) / seg);
      tx = A.x + (B.x - A.x) * f; ty = A.y + (B.y - A.y) * f; tz = 0.8;
      cam.x += (tx - cam.x) * Math.min(1, 1.6 * dt);
      cam.y += (ty - cam.y) * Math.min(1, 1.6 * dt);
      cam.z += (tz - cam.z) * Math.min(1, 2 * dt);
    } else {
      if (!zoomOverride) {
        if (S.approach) tz = 0.97;
        if (S.sprinting) tz *= 0.96;
        if (S.state === 'zip') tz = 1.0;
      }
      if (S.cine) {
        const stD = stations[S.cine.stId];
        tx = stD.x; ty = stD.y; tz = 0.72;
      }
      const lerpK = S.cine ? 1.6 : 3.2;
      cam.x += (tx - cam.x) * Math.min(1, lerpK * dt);
      cam.y += (ty - cam.y) * Math.min(1, lerpK * dt);
      cam.z += (tz - cam.z) * Math.min(1, 2 * dt);
    }
    // keep the view inside the world
    {
      const hw = cv.width / (2 * cam.z * dpr), hh = cv.height / (2 * cam.z * dpr);
      cam.x = U.clamp(cam.x, Math.min(hw, DATA.W / 2), Math.max(DATA.W - hw, DATA.W / 2));
      cam.y = U.clamp(cam.y, Math.min(hh, DATA.H / 2), Math.max(DATA.H - hh, DATA.H / 2));
    }
    if (shakeT > 0) { shakeT -= dt; }
    const shx = shakeT > 0 ? (Math.random() - 0.5) * shakeAmp * dpr : 0;
    const shy = shakeT > 0 ? (Math.random() - 0.5) * shakeAmp * dpr : 0;
    if (shakeT <= 0) shakeAmp = 0;

    // quantized zoom: a terrain texel is always a WHOLE number of buffer pixels, so texel
    // widths never alternate; the transform is snapped so the world scrolls in whole pixels
    const zw = Math.max(1, Math.round(World.TS * cam.z * dpr / PIXK)) / World.TS;
    const z = zw * PIXK;
    effZ = z; curZw = zw;
    // the whole world pass draws into the low-res buffer; it lands on screen as fat pixels
    cx = worldCx;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.fillStyle = '#0a0e14';
    cx.fillRect(0, 0, worldC.width, worldC.height);

    // world transform — translation snapped to integer buffer pixels
    const wtx = Math.round(worldC.width / 2 - cam.x * zw + shx / PIXK);
    const wty = Math.round(worldC.height / 2 - cam.y * zw + shy / PIXK);
    lastWtx = wtx; lastWty = wty;
    cx.setTransform(zw, 0, 0, zw, wtx, wty);
    const viewW = cv.width / z, viewH = cv.height / z;
    const vx0 = cam.x - viewW / 2 - 60, vy0 = cam.y - viewH / 2 - 60, vx1 = cam.x + viewW / 2 + 60, vy1 = cam.y + viewH / 2 + 60;
    const inView = (x, y, m = 40) => x > vx0 - m && x < vx1 + m && y > vy0 - m && y < vy1 + m;

    // terrain + roads (source canvases are 1/TS scale) — nearest neighbour: every texel keeps its edge
    cx.imageSmoothingEnabled = false;
    const ts = World.TS;
    const sx = Math.max(0, vx0 / ts), sy = Math.max(0, vy0 / ts);
    const sw = Math.min(World.tc.width - sx, (vx1 - vx0) / ts), sh = Math.min(World.tc.height - sy, (vy1 - vy0) / ts);
    if (sw > 0 && sh > 0) cx.drawImage(World.tc, sx, sy, sw, sh, sx * ts, sy * ts, sw * ts, sh * ts);

    const P = window.__prof, pt = P ? performance.now() : 0; let pl = pt;
    const mark = k => { if (P) { const n = performance.now(); P[k] = (P[k] || 0) + n - pl; pl = n; } };
    mark('terrain');
    // the light field lands directly on the ground, under everything built and walking:
    // solid palette-remapped texels — cold steps in the quiet, warm steps on the wire, a dithered
    // golden coastline at the wraith line. Night = the same land two palette steps deeper, drawn
    // in hard stages, the way a cartridge swapped its colours.
    const nnQ = (() => { const nn = Economy.dayPhase().nightness; return nn < 0.18 ? 0 : nn < 0.62 ? 1 : 2; })();
    if (sw > 0 && sh > 0) {
      /* LIGHT BEHAVES. The wire's warmth is paint on the ground and lands directly. Everything
         dark — the quiet's grey dim, and the night — is a LAYER, drawn into its own buffer, and
         every local light (lantern, generator, fire, lumen bloom) ERASES banded holes in it on
         the terrain's texel grid: a solid heart, two dithered hems. What shows through a hole is
         the ground's own colours. Nothing gold is painted over the world; the yellow disc is dead. */
      cx.drawImage(World.lightWarm, sx, sy, sw, sh, sx * ts, sy * ts, sw * ts, sh * ts);
      if (!nightC || nightC.width !== worldC.width || nightC.height !== worldC.height) {
        nightC = document.createElement('canvas'); nightC.width = worldC.width; nightC.height = worldC.height;
        nightCx = nightC.getContext('2d');
      }
      nightCx.setTransform(1, 0, 0, 1, 0, 0);
      nightCx.clearRect(0, 0, nightC.width, nightC.height);
      nightCx.setTransform(zw, 0, 0, zw, worldC.width / 2 - cam.x * zw + shx / PIXK, worldC.height / 2 - cam.y * zw + shy / PIXK);
      nightCx.imageSmoothingEnabled = false;
      nightCx.drawImage(World.lightDim, sx, sy, sw, sh, sx * ts, sy * ts, sw * ts, sh * ts);
      if (nnQ > 0) {
        nightCx.globalAlpha = nnQ === 1 ? 0.55 : 1;
        nightCx.drawImage(World.lightOvN, sx, sy, sw, sh, sx * ts, sy * ts, sw * ts, sh * ts);
        nightCx.globalAlpha = 1;
      }
      nightCx.globalCompositeOperation = 'destination-out';
      for (const L2 of collectNightLights(inView)) punchLight(nightCx, L2.x, L2.y, L2.r, L2.a);
      nightCx.globalCompositeOperation = 'source-over';
      cx.save();
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.drawImage(nightC, 0, 0);
      cx.restore();
    }
    mark('lightfield');
    // cloud shadows: two slow dither-shade blobs drifting over the day — the valley breathes
    if (nnQ === 0 && fxOn) {
      for (const cl2 of clouds) {
        cl2.x += cl2.vx * dt; cl2.y += cl2.vy * dt;
        if (cl2.x - cl2.rx > DATA.W) cl2.x = -cl2.rx;
        if (cl2.y - cl2.ry > DATA.H) cl2.y = -cl2.ry;
        if (!inView(cl2.x, cl2.y, cl2.rx + 200)) continue;
        cx.drawImage(cloudSprite(), cl2.x - cl2.rx, cl2.y - cl2.ry, cl2.rx * 2, cl2.ry * 2);
      }
    }
    // shore sparkle + the coastline breathing: foam blinks on shallow water, gold blinks on the wraith line
    {
      const sparkT = Math.floor(S.time * 2.2);
      let cnt = 0;
      for (let gy3 = Math.floor(vy0 / 40) * 40; gy3 < vy1 && cnt < 900; gy3 += 40)
        for (let gx3 = Math.floor(vx0 / 40) * 40; gx3 < vx1; gx3 += 40, cnt++) {
          const hsh = U.hash2(gx3 * 0.025 + (sparkT % 7) * 11, gy3 * 0.025, 913);
          if (hsh < 0.86) continue;
          if (World.classAt(gx3, gy3) === World.SHALLOW) {
            cx.fillStyle = hsh > 0.95 ? '#d8f0ea' : '#8fd2c8';
            cx.fillRect(Math.floor(gx3 / 5) * 5, Math.floor(gy3 / 5) * 5, 5, 5);
          } else if (Math.abs(World.lightAt(gx3, gy3) - 0.30) < 0.022) {
            cx.fillStyle = '#ffe8b0';
            cx.fillRect(Math.floor(gx3 / 5) * 5, Math.floor(gy3 / 5) * 5, 5, 5);
          }
        }
    }
    // footprints: the walk leaves marks; the marks let go
    for (let i = prints.length - 1; i >= 0; i--) {
      const p2 = prints[i];
      p2.t += dt;
      if (p2.t > p2.life) { prints.splice(i, 1); continue; }
      if (p2.kind === 'splash') {
        cx.fillStyle = '#cfeae2';
        const sp2 = 2.4 * (1 - p2.t / p2.life) + 1;
        cx.fillRect(p2.x - sp2 / 2, p2.y - sp2 / 2, sp2, sp2);
      } else {
        cx.fillStyle = p2.kind === 'snow' ? '#8fa2b2' : p2.kind === 'scree' ? '#6b6248' : '#2e3c2a';
        const sz = p2.t < p2.life * 0.6 ? 2.4 : 1.6;
        cx.fillRect(p2.x - sz / 2, p2.y - sz / 2, sz, sz + 0.8);
      }
    }
    mark('sparkle');
    drawPavers(inView); mark('pavers');
    drawPickups(inView); mark('pickups');
    drawWorldExtras(inView, dt); mark('extras');
    drawStructures(inView, dt); mark('structures');
    drawCamps(inView, dt); mark('camps');
    drawStations(inView, dt); mark('stations');

    mark('overlays');
    drawWisps(dt, inView); mark('wisps');
    // creatures of the mist and the porter ride above it
    drawWire(inView, dt); mark('wire');
    drawBeams(dt); mark('beams');
    drawAboveMist(inView, dt); mark('abovemist');
    if (S.cine && S.cine.phase === 1) {
      // the light takes the land as a coastline on the march — a ring of dots, the doctrine's circle
      const stD = stations[S.cine.stId], lt = S.stations[S.cine.stId].litT;
      const rr = (S.cine.r || 900) * U.easeOut(lt);
      cx.globalCompositeOperation = 'lighter';
      dotRing(stD.x, stD.y, rr, `rgba(255,214,150,${0.9 * (1 - lt * 0.6)})`, 8);
      dotRing(stD.x, stD.y, rr * 0.94, `rgba(255,214,150,${0.4 * (1 - lt * 0.6)})`, 14);
      cx.globalAlpha = Math.max(0, 1 - lt);
      glowShells(stD.x, stD.y, 380 * lt + 60, 'rgba(255,225,170,0.4)');
      cx.globalAlpha = 1;
      cx.globalCompositeOperation = 'source-over';
    }
    drawWraiths(inView, dt); mark('wraiths');
    drawTravel(dt); mark('travel');
    drawPlayer(dt); mark('player');
    drawSaysWorld(); mark('says');
    drawRain(dt); mark('rain');
    drawFx(dt); mark('fx');

    // the world lands on screen: nearest-neighbour up, colour punched hot — the nineties were not subtle
    cx = mainCx;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(worldC, 0, 0, worldC.width, worldC.height, 0, 0, worldC.width * PIXK, worldC.height * PIXK);   // exact 3× — every buffer pixel a clean block
    cx.imageSmoothingEnabled = true;
    drawLabels(z, wtx * PIXK, wty * PIXK);
    drawEKey(z, wtx * PIXK, wty * PIXK, dt);

    // screen space (night lives in the world buffer now, as a palette field — no veil here)
    cx.setTransform(1, 0, 0, 1, 0, 0);
    drawGuide(dt); mark('guide');
    if (flareT > 0) {
      flareT -= dt * 1.4;
      cx.fillStyle = `rgba(255,240,210,${U.clamp(flareT, 0, 1) * 0.7})`;
      cx.fillRect(0, 0, cv.width, cv.height);
    }
    drawLikes(dt); mark('likes');
    if (fxOn) {
      if (post.length && !reduced) cx.drawImage(post[(Math.random() * post.length) | 0], 0, 0);
      else cx.drawImage(vign, 0, 0, cv.width, cv.height);
      mark('post');
    }
    drawCrt(dt); mark('crt');
    if (P) P.frames = (P.frames || 0) + 1;
  }

  /* ---------- stations & waylights ---------- */
  /* =============== authored pixel sprites ===============
     Drawn the way the era drew them: a small grid, a hard outline, a deliberate palette.
     Every humanoid shares one rig; coats recolour it. Blits snap to the texel grid so sprites step, not smear. */
  /* THE WALKER, redrawn by hand — a hooded porter with the pack on their back, one eye set
     in the hood, a real stride. 12×18 authored texels. Every figure bakes once per palette and
     lands on WHOLE buffer pixels: the old rig drew 1.7-unit texels that fell BETWEEN pixels and
     antialiased into soup — the "blurry mess". Hand-drawn is the only legible aesthetic; now the
     people are hand-drawn too. */
  const RIGF = {
    idle: [
      '.....OOO....', '....OHHHO...', '...OHHHHHO..', '...OHSSeO...', '...OHSSSO...', '....OSSO....',
      '..OOCCCCO...', '.OTTOCCCCO..', 'OTTTOCCCCSO.', 'OTTTOCcCCSO.', 'OTTTOCcCCO..', 'OtttOCcCCO..',
      '.OOOOcCCcO..', '....OCCCO...', '....OBOBO...', '....OBOBO...', '....ObObO...', '............',
    ],
    A: [
      '.....OOO....', '....OHHHO...', '...OHHHHHO..', '...OHSSeO...', '...OHSSSO...', '....OSSO....',
      '..OOCCCCO...', '.OTTOCCCCSO.', 'OTTTOCCCCSO.', 'OTTTOCcCCO..', 'OTTTOCcCCO..', 'OtttOCcCCSO.',
      '.OOOOcCCcO..', '....OCCCO...', '...OBBOBBO..', '..OBBO..BBO.', '..ObO...ObO.', '............',
    ],
    B: [
      '.....OOO....', '....OHHHO...', '...OHHHHHO..', '...OHSSeO...', '...OHSSSO...', '....OSSO....',
      '..OOCCCCO...', '.OTTOCCCCO..', 'OTTTOCCCCSO.', 'OTTTOCcCCSO.', 'OTTTOCcCCO..', 'OtttOCcCCO..',
      '.OOOOcCCcO..', '....OCCCO...', '...OBBOBBO..', '.OBB..OBBO..', '.ObO...ObO..', '............',
    ],
  };
  const PAL_WALKER = { O: '#12161c', H: '#2c4258', S: '#e0c298', e: '#2a2118', C: '#3d5a74', c: '#2c4258', T: '#c9a05a', t: '#a5824a', B: '#23282f', b: '#171b21' };
  const PAL_MATE = { O: '#12161c', H: '#41522f', S: '#d8b890', e: '#2a2118', C: '#54683f', c: '#41522f', T: '#b8a06a', t: '#94804f', B: '#23282f', b: '#171b21' };
  const PAL_SCRAP = { O: '#150f0c', H: '#33241e', S: '#d8b890', e: '#241a12', C: '#8a4432', c: '#6b3426', T: '#5a4a3a', t: '#453a2e', B: '#20242a', b: '#15181e' };
  const rigCache = new Map();
  function rigSprite(pal, frame, flip) {
    const key = frame + (flip ? 'f|' : '|') + pal.C + pal.c + pal.T + pal.H + (pal.t || '');
    let c = rigCache.get(key);
    if (c) return c;
    c = document.createElement('canvas'); c.width = 12; c.height = 18;
    const g = c.getContext('2d');
    RIGF[frame].forEach((row, y) => {
      for (let i = 0; i < 12; i++) {
        const ch = row[flip ? 11 - i : i];
        if (ch === '.') continue;
        g.fillStyle = pal[ch] || pal.C; g.fillRect(i, y, 1, 1);
      }
    });
    rigCache.set(key, c);
    return c;
  }
  const TENT = [
    '.....OO.....',
    '....OrrO....',
    '...OrRRrO...',
    '..OrRDDRrO..',
    '.OrRRDDRRrO.',
    'OrRRRDDRRRrO',
    'OOOOOOOOOOOO'];
  const HUT = [
    '.rrrrrrrrrrrrrr.',
    'RRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRR',
    'OGGGGOGGGGOGGGGO',
    'OGWWGOGGDGOGVVGO',
    'OGWWGOGGDGOGVVGO',
    'OGGGGOGGGGOGGGGO',
    'OOOOOOOOOOOOOOOO'];
  /* the waylight mast — a timber lattice, cut square, with a stone footing and an iron cage.
     Replaces the stroked A-frame: towers are BUILT, and built things are rows. */
  const TOWER_ROWS = [
    '..OKKKO..',
    '..OK.KO..',
    '..OKKKO..',
    '...OTO...',
    '..OTTTO..',
    '..OT.TO..',
    '..OT.TO..',
    '..OTTTO..',
    '.OT.T.TO.',
    '.OT...TO.',
    '.OTTTTTO.',
    '.OT...TO.',
    'OT..T..TO',
    'OT.....TO',
    'OTTTTTTTO',
    'OT.....TO',
    'OT.....TO',
    'OSS...SSO',
    'OSS...SSO',
    'OOO...OOO',
  ];
  /* fire is 2–3 authored frames (saint11) — never a pulsing rect */
  const FIRE_F = [[
    '...w...',
    '..wY...',
    '..YYw..',
    '.YRYY..',
    '.RYRRw.',
    '.RRYRR.',
    'LlLLlLL',
    '.LLlLL.',
  ], [
    '...w...',
    '...Yw..',
    '..wYY..',
    '..YYRY.',
    '.YRRYR.',
    '.RYRRR.',
    'LlLLlLL',
    '.LLlLL.',
  ], [
    '.......',
    '..w....',
    '..YYw..',
    '.YYRY..',
    '.RYYRw.',
    '.RRYRR.',
    'LlLLlLL',
    '.LLlLL.',
  ]];
  const FIRE_PAL = { w: '#fff2d0', Y: '#ffd98f', R: '#e0654a', L: '#4a3320', l: '#6b4a30' };
  /* every glyph blit bakes once and lands on whole buffer pixels — crisp by construction */
  const blitCache = new Map();
  function glyphSprite(rows, pal, flip) {
    const key = rows[0] + rows.length + '|' + Object.values(pal).join('') + (flip ? 'f' : '');
    let c = blitCache.get(key);
    if (c) return c;
    const w = rows[0].length;
    c = document.createElement('canvas'); c.width = w; c.height = rows.length;
    const g = c.getContext('2d');
    rows.forEach((row, j) => {
      for (let i = 0; i < w; i++) {
        const ch = row[flip ? w - 1 - i : i];
        if (ch === '.') continue;
        g.fillStyle = pal[ch] || '#f0f'; g.fillRect(i, j, 1, 1);
      }
    });
    blitCache.set(key, c);
    return c;
  }
  function blit(rows, wx, wy, tx, pal, flip) {
    const sp = glyphSprite(rows, pal, !!flip);
    const k = Math.max(1, Math.round(tx * curZw));            // texel = whole buffer pixels
    const m = cx.getTransform();
    if (Math.abs(m.b) > 0.001) { cx.drawImage(sp, wx, wy, sp.width * tx, sp.height * tx); return; }   // rotated pose: transform-space fallback
    const bx = Math.round(wx * m.a + m.e), by = Math.round(wy * m.d + m.f);
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(sp, bx, by, sp.width * k, sp.height * k);
    cx.restore();
  }
  /* a walker on their feet: rig frame by stride, flipped by facing; feet land on (x, y+5).
     The figure scales with the world in whole-pixel steps, so it stays crisp at every zoom
     and its pack, tower and lantern stay attached to the same texels. */
  function rigK() { return Math.max(1, Math.round(curZw * 2.5)); }        // buffer px per rig texel
  function rigT() { return rigK() / curZw; }                              // world units per rig texel
  function blitRigSprite(sp, x, y) {
    const k2 = rigK();
    const m = cx.getTransform();
    if (Math.abs(m.b) > 0.001) { const tw = k2 / curZw; cx.drawImage(sp, x - 6 * tw, y + 5 - 18 * tw, 12 * tw, 18 * tw); return; }
    const bx = Math.round(x * m.a + m.e) - 6 * k2, by = Math.round((y + 5) * m.d + m.f) - 18 * k2;
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(sp, bx, by, 12 * k2, 18 * k2);
    cx.restore();
  }
  function blitWalker(x, y, pal, moving, phase, dir) {
    const frame = moving ? (Math.sin(phase) > 0 ? 'A' : 'B') : 'idle';
    blitRigSprite(rigSprite(pal, frame, Math.cos(dir) < 0), x, y);
  }
  /* rim light — the source writes itself on the sprite (Octopath's trick, one texel wide):
     every solid texel whose neighbour toward the light is empty takes a warm edge */
  const rimCache = {};
  function rimSprite(frame, flip, side) {
    const key = frame + (flip ? 'F' : '') + side;
    let c = rimCache[key];
    if (c) return c;
    const rows = RIGF[frame];
    c = document.createElement('canvas'); c.width = 12; c.height = 18;
    const g = c.getContext('2d'); g.fillStyle = '#ffd98f';
    const at = (xx, yy) => (yy < 0 || yy >= rows.length || xx < 0 || xx >= 12) ? '.' : rows[yy][flip ? 11 - xx : xx];
    for (let y = 0; y < rows.length; y++) for (let x = 0; x < 12; x++) {
      if (at(x, y) === '.') continue;
      if (at(x + side, y) === '.') g.fillRect(x, y, 1, 1);
    }
    return rimCache[key] = c;
  }
  function drawRim(x, y, moving, phase, dir, side) {
    const frame = moving ? (Math.sin(phase) > 0 ? 'A' : 'B') : 'idle';
    cx.globalAlpha = 0.55;
    blitRigSprite(rimSprite(frame, Math.cos(dir) < 0, side), x, y);
    cx.globalAlpha = 1;
  }
  const PAL_GHOST = { O: '#232848', H: '#3a4270', S: '#c9d0ff', e: '#e6ecff', C: '#6e78b4', c: '#5a64a0', T: '#8a94d0', t: '#7a84c0', B: '#3a4270', b: '#2a3050' };

  /* =============== light has a body — the corona law (v3.15) ===============
     A glow is a RAMP walked outward (Slynyrd: hue warms as it brightens, saturation peaks
     mid-ramp), banded HARD (saint11: emissive core + a few concentric steps), with dither as a
     seam material only — one texel of Bayer stitch where band meets band, never the body.
     Full-coverage checker is reserved for the one thing it is for: the unsolid (ghostBody).
     The darkness FIELD stays coverage-only; what shines above it carries stepped alpha —
     three hard steps of it, which is the era's transparency. */
  const RBAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  /* nothing round touches the ground: shadows are two stacked slabs, platforms are stepped stone */
  function pixShadow(x, y, w) {
    cx.fillStyle = 'rgba(0,0,0,0.30)';
    cx.fillRect(x - w / 2, y - 1.5, w, 3);
    cx.fillRect(x - w * 0.32, y + 1.5, w * 0.64, 2);
  }
  const rgbOf = c => { const m = String(c).match(/(\d+)[, ]+(\d+)[, ]+(\d+)/); if (m) return [+m[1], +m[2], +m[3]]; const n = parseInt(String(c).slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const coronaCache = {};
  function coronaSprite(color, coreColor) {
    const key = color + '|' + (coreColor || '');
    let c = coronaCache[key];
    if (c) return c;
    const [r, g2, b2] = rgbOf(color);
    // the core hue-shifts toward white heat; the outer band is the same ink gone thin
    const core = coreColor ? rgbOf(coreColor)
      : [Math.min(255, r + (255 - r) * 0.8 | 0), Math.min(255, g2 + (255 - g2) * 0.72 | 0), Math.min(255, b2 + (255 - b2) * 0.5 | 0)];
    const T2 = 16, TX = 3, N = T2 * TX;
    c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d');
    for (let ty = 0; ty < T2; ty++) for (let txx = 0; txx < T2; txx++) {
      const d = Math.hypot(txx + 0.5 - T2 / 2, ty + 0.5 - T2 / 2);
      let col = null, a = 0;
      const stitch = RBAY[ty & 3][txx & 3] / 16 < 0.5;
      if (d < 2.1) { col = core; a = 0.55; }
      else if (d < 4.3) { col = [r, g2, b2]; a = 0.38; }
      else if (d < 5.3) { col = [r, g2, b2]; a = stitch ? 0.38 : 0.2; }        // seam: mid stitches into outer
      else if (d < 6.9) { col = [r, g2, b2]; a = 0.2; }
      else if (d < 7.9) { if (!stitch) continue; col = [r, g2, b2]; a = 0.2; } // hem: the outer band lets go
      if (!col) continue;
      g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
      g.fillRect(txx * TX, ty * TX, TX, TX);
    }
    return coronaCache[key] = c;
  }
  function glowShells(x, y, R, color, coreColor) {   // the name every lamp already calls
    cx.drawImage(coronaSprite(color, coreColor), x - R, y - R, R * 2, R * 2);
  }
  const ghostCache = {};
  function ghostSprite(color) {
    let c = ghostCache[color];
    if (c) return c;
    const N = 96;
    c = document.createElement('canvas'); c.width = c.height = N;
    const g = c.getContext('2d'); g.fillStyle = color;
    for (let y = 0; y < N; y += 3) for (let x = 0; x < N; x += 3) {
      const d = Math.hypot(x + 1.5 - N / 2, y + 1.5 - N / 2) / (N / 2);
      const cov = d < 0.38 ? 0.75 : d < 0.68 ? 0.45 : d < 1 ? 0.2 : 0;
      if (cov && RBAY[(y / 3) & 3][(x / 3) & 3] / 16 < cov) g.fillRect(x, y, 3, 3);
    }
    return ghostCache[color] = c;
  }
  function ghostBody(x, y, R, color) { cx.drawImage(ghostSprite(color), x - R, y - R, R * 2, R * 2); }
  /* the beacon shaft — a column of light, not a pillar of checker: three vertical alpha bands,
     brightest at the flame, a solid heart with one-texel dithered hems, and it belongs to the night */
  let _shaftC = null;
  function shaftSprite() {
    if (_shaftC) return _shaftC;
    const TW2 = 12, TH2 = 56, TX = 2;
    const c = document.createElement('canvas'); c.width = TW2 * TX; c.height = TH2 * TX;
    const g = c.getContext('2d');
    for (let ty = 0; ty < TH2; ty++) {
      const k = 1 - ty / TH2;                       // 1 at the bottom — the flame end
      const a = k > 0.62 ? 0.46 : k > 0.3 ? 0.28 : 0.14;
      const hw = k > 0.62 ? 2 : k > 0.3 ? 3 : 4;    // three width steps, no cone
      for (let txx = 0; txx < TW2; txx++) {
        const dx2 = Math.abs(txx + 0.5 - TW2 / 2);
        if (dx2 > hw + 1) continue;
        const hem = dx2 > hw - 0.5;
        const fade = ty < 7;                        // the top lets go into the dark
        if ((hem || fade) && RBAY[ty & 3][txx & 3] / 16 >= (fade ? 0.3 : 0.5)) continue;
        g.fillStyle = `rgba(255,214,150,${a})`;
        g.fillRect(txx * TX, ty * TX, TX, TX);
      }
    }
    return _shaftC = c;
  }
  let _cloudC = null;
  function cloudSprite() {
    if (_cloudC) return _cloudC;
    const W2 = 160, H2 = 96, c = document.createElement('canvas'); c.width = W2; c.height = H2;
    const g = c.getContext('2d'); g.fillStyle = '#0e1522';
    for (let y = 0; y < H2; y += 2) for (let x = 0; x < W2; x += 2) {
      const ex = (x - W2 / 2) / (W2 / 2), ey = (y - H2 / 2) / (H2 / 2);
      if (ex * ex + ey * ey < 1 && RBAY[(y / 2) & 3][(x / 2) & 3] / 16 < 0.25) g.fillRect(x, y, 2, 2);
    }
    return _cloudC = c;
  }

  /* =============== the world speaks in pixels ===============
     Every piece of text painted INTO the world uses this authored 3×5 bitmap face — barks, names,
     labels, route marks. The DOM HUD keeps its clean type; the valley itself is all texels.
     Each glyph is five octal digits, one row each, three bits a row. */
  const PF = {
    A: '25755', B: '65656', C: '34443', D: '65556', E: '74647', F: '74644', G: '34553', H: '55755',
    I: '72227', J: '11152', K: '56465', L: '44447', M: '57555', N: '65555', O: '25552', P: '65644',
    Q: '25521', R: '65665', S: '34216', T: '72222', U: '55557', V: '55552', W: '55575', X: '55255',
    Y: '55222', Z: '71247',
    0: '35556', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34652', 7: '71122',
    8: '25252', 9: '25316',
    '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', '+': '02720',
    "'": '22000', '·': '00200', ':': '02020', '/': '11244', '%': '51245', '◆': '27772', '★': '27772',
    ' ': '00000',
  };
  function ptextW(str, tx) { return str.length * 4 * tx - tx; }
  function ptext(str, x, y, tx, color, align = 'center', shadow = true) {
    str = String(str).toUpperCase().replace(/["“”]/g, "'").replace(/[—–]/g, '-');
    const w = ptextW(str, tx);
    let sx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    sx = Math.round(sx / tx) * tx; const sy = Math.round(y / tx) * tx;
    for (let pass = shadow ? 0 : 1; pass < 2; pass++) {
      cx.fillStyle = pass === 0 ? '#0c1016' : color;
      const ox2 = pass === 0 ? tx : 0, oy2 = pass === 0 ? tx : 0;
      for (let i = 0; i < str.length; i++) {
        const g = PF[str[i]] || PF['·'];
        for (let r = 0; r < 5; r++) {
          const d = +g[r];
          if (!d) continue;
          for (let c = 0; c < 3; c++) if (d & (4 >> c))
            cx.fillRect(sx + (i * 4 + c) * tx + ox2, sy + r * tx + oy2, tx + 0.05, tx + 0.05);
        }
      }
    }
    return w;
  }
  function ptextLines(str, x, y, tx, color, maxChars = 24) {
    const words = String(str).split(' '); const lines = ['']; let li = 0;
    for (const wd of words) {
      if (lines[li].length && lines[li].length + wd.length + 1 > maxChars) { lines.push(''); li++; }
      lines[li] += (lines[li] ? ' ' : '') + wd;
    }
    lines.forEach((ln, i2) => ptext(ln, x, y + i2 * 7 * tx, tx, color));
    return lines.length;
  }
  /* labels never scale with the camera and never land between pixels: world draws queue them,
     and after the blit they render in SCREEN space at integer texels — the cartridge way */
  const labelQ = [];
  function plabel(str, wx, wy, k, color, opts = {}) { labelQ.push({ str, wx, wy, k, color, dy: opts.dy || 0, alpha: opts.alpha, wrap: opts.wrap, shadow: opts.shadow !== false }); }
  function drawLabels(z, ox, oy) {
    for (const L of labelQ) {
      const t = Math.max(2, Math.round(L.k * dpr));
      const sx = Math.round((L.wx * z + ox) / t) * t;
      const sy = Math.round((L.wy * z + oy + (L.dy || 0) * dpr) / t) * t;
      if (L.alpha !== undefined) cx.globalAlpha = L.alpha;
      if (L.wrap) ptextLines(L.str, sx, sy, t, L.color, L.wrap);
      else ptext(L.str, sx, sy, t, L.color, 'center', L.shadow);
      cx.globalAlpha = 1;
    }
    labelQ.length = 0;
  }

  /* ---------- the [E] keycap — the third button, the one that presses down ----------
     a pixel keycap stands beside the walker whenever E would do something, a small arrow
     stepping down at it. When the real E goes down, the drawn key goes down with it —
     face onto base, glyph gone hot. Screen space, integer texels, same law as the labels. */
  let eHeld = false, eBob = 0;
  function noteE(down) { eHeld = !!down; }
  function eKeyShown() {
    return !!(S && S.state === 'walk' && !S.dead && !S.cine && !S.qte && !S.struggle &&
      !UI.anyModal() && UI.prompts && UI.prompts.some(p => p.key === 'E'));
  }
  function drawEKey(z, ox, oy, dt) {
    if (!eKeyShown()) { eBob = 0; return; }
    eBob += dt;
    const t = Math.max(2, Math.round(2 * dpr));
    const sx = Math.round((S.px * z + ox) / t) * t + 9 * t;
    const sy = Math.round((S.py * z + oy) / t) * t - 30 * t;
    const px2 = (x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(sx + x * t, sy + y * t, w * t, h * t); };
    const down = eHeld;
    // the arrow on top, stepping down at the key (two texels of travel)
    const ab = down ? 2 : [0, 1, 2, 1][((eBob * 5) | 0) % 4];
    const AW = [[2, 7], [3, 5], [4, 3], [5, 1]];
    const ac = down ? '#ffd98f' : '#f2ead4';
    for (let r = 0; r < 4; r++) px2(AW[r][0], ab - 7 + r, AW[r][1], 1, '#0c0a06');   // drop pass
    for (let r = 0; r < 4; r++) px2(AW[r][0], ab - 8 + r, AW[r][1], 1, ac);
    // base slab — the socket the key presses into
    if (!down) { px2(0, 8, 11, 2, '#05070b'); px2(1, 10, 9, 1, 'rgba(0,0,0,0.45)'); }
    else px2(1, 10, 9, 1, 'rgba(0,0,0,0.45)');
    // face plate
    const fy = down ? 2 : 0;
    px2(0, fy, 11, 8, '#10151c');                                   // rim
    px2(1, fy + 1, 9, 6, down ? '#2e363f' : '#39434c');             // face
    px2(1, fy + 1, 9, 1, down ? '#39434c' : '#4a5560');             // top light
    px2(1, fy + 6, 9, 1, '#262d36');                                // bottom shade
    // the E, 3×5, centred
    const gc = down ? '#ffd98f' : '#f2ead4';
    px2(4, fy + 2, 3, 1, gc); px2(4, fy + 3, 1, 1, gc); px2(4, fy + 4, 3, 1, gc); px2(4, fy + 5, 1, 1, gc); px2(4, fy + 6, 3, 1, gc);
  }

  /* ---------- the SET title — the big white voice, kept for pivotal moments only ----------
     A full 5×7 display alphabet, authored like the wordmark. White at ten-plus texels with a
     mains flicker, a tear of a roll-in, and scanlines: the valley's old CRT clearing its throat.
     Only four doors knock here: a station joining the wire, a field promotion, the first
     greyfall, the first time the Kept find you. Headings never touch this face. */
  const D7 = (() => {
    const raw = {
      A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|####.|#...#|#...#|#...#|####.',
      C: '.####|#....|#....|#....|#....|#....|.####', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
      E: '#####|#....|####.|#....|#....|#....|#####', F: '#####|#....|####.|#....|#....|#....|#....',
      G: '.####|#....|#....|#.###|#...#|#...#|.###.', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
      I: '#####|..#..|..#..|..#..|..#..|..#..|#####', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
      K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
      M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
      O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
      Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
      S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
      U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|.#.#.|.#.#.|..#..',
      W: '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#', X: '#...#|.#.#.|..#..|..#..|..#..|.#.#.|#...#',
      Y: '#...#|.#.#.|..#..|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
      0: '.###.|#..##|#.#.#|##..#|#...#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|#####',
      2: '.###.|#...#|....#|..##.|.#...|#....|#####', 3: '####.|....#|...#.|..##.|....#|#...#|.###.',
      4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
      6: '.###.|#....|####.|#...#|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
      8: '.###.|#...#|.###.|#...#|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|....#|.###.',
      '-': '.....|.....|.....|.###.|.....|.....|.....', '—': '.....|.....|.....|#####|.....|.....|.....',
      '·': '.....|.....|.....|..#..|.....|.....|.....', '.': '.....|.....|.....|.....|.....|.....|..#..',
      ',': '.....|.....|.....|.....|.....|..#..|.#...', '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
      "'": '..#..|..#..|.....|.....|.....|.....|.....', ':': '.....|..#..|.....|.....|.....|..#..|.....',
      '%': '##..#|##..#|...#.|..#..|.#...|#..##|#..##', '?': '.###.|#...#|....#|..##.|..#..|.....|..#..',
    };
    const out = {};
    for (const k in raw) out[k] = raw[k].split('|');
    return out;
  })();
  let crtCv = null, crtNow = null, crtT = 0;
  const crtQ = [];
  function crtTitle(big, small, opts = {}) {
    crtQ.push({ big: String(big).toUpperCase(), small: String(small || '').toUpperCase(), hold: opts.hold || 3.4, low: !!opts.low });
    if (crtQ.length > 3) crtQ.shift();
  }
  function ensureCrt() {
    if (crtCv) return;
    crtCv = document.createElement('canvas');
    crtCv.id = 'crtCv';
    crtCv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:54;pointer-events:none';
    const st = document.getElementById('stage');
    if (st) st.appendChild(crtCv);
  }
  function drawD7(g, str, x0, y0, t, color, rowMax = 7) {
    g.fillStyle = color;
    let x = x0;
    for (const ch of str) {
      const gl = D7[ch];
      if (gl) for (let r = 0; r < rowMax; r++) { const row = gl[r]; for (let c = 0; c < 5; c++) if (row[c] === '#') g.fillRect(x + c * t, y0 + r * t, t, t); }
      x += 6 * t;
    }
  }
  function d7w(str, t) { return (str.length * 6 - 1) * t; }
  function drawCrt(dt) {
    if (!crtNow) {
      if (!crtQ.length) { if (crtCv && crtCv._on) { crtCv.getContext('2d').clearRect(0, 0, crtCv.width, crtCv.height); crtCv._on = false; } return; }
      crtNow = crtQ.shift(); crtT = 0;
    }
    ensureCrt();
    crtT += dt;
    const o = crtNow;
    if (crtT >= o.hold) { crtNow = null; return; }
    if (crtCv.width !== cv.width || crtCv.height !== cv.height) { crtCv.width = cv.width; crtCv.height = cv.height; }
    const g = crtCv.getContext('2d');
    g.clearRect(0, 0, crtCv.width, crtCv.height);
    g.imageSmoothingEnabled = false;
    crtCv._on = true;
    // envelope · flicker · the early dip of a tube finding its voltage
    const a = Math.min(1, crtT / 0.2) * Math.min(1, (o.hold - crtT) / 0.55);
    const fl = 0.93 + 0.07 * (((crtT * 8.5) | 0) % 2);
    const dip = crtT > 0.09 && crtT < 0.13 ? 0.5 : 1;
    const t = Math.max(3, Math.min(Math.floor(cv.width * 0.82 / (Math.max(6, o.big.length) * 6)), Math.round(12 * dpr)));
    const roll = Math.min(1, crtT / 0.13);
    const jit = (((crtT * 60) | 0) % 53 === 0) ? t : 0;
    const w = d7w(o.big, t);
    const x0 = Math.round((cv.width - w) / 2 / t) * t + jit;
    const y0 = Math.round(cv.height * (o.low ? 0.66 : 0.3) / t) * t;
    // the dark band the tube burns through — legible over any noon
    g.globalAlpha = a * 0.55;
    g.fillStyle = '#05070b';
    g.fillRect(0, y0 - 4 * t, cv.width, 11 * t + (o.small ? 4 * t : 0));
    g.globalAlpha = a * fl * dip;
    const rows = Math.max(1, Math.round(7 * roll));
    drawD7(g, o.big, x0 + Math.max(2, t >> 2), y0 + Math.max(2, t >> 2), t, 'rgba(0,0,0,0.7)', rows);
    drawD7(g, o.big, x0, y0, t, '#ffffff', rows);
    if (o.small) {
      const t2 = Math.max(2, Math.round(t / 4));
      drawD7(g, o.small, Math.round((cv.width - d7w(o.small, t2)) / 2 / t2) * t2, y0 + 9 * t, t2, '#d8d2bd', 7);
    }
    // scanlines — one device pixel every third row, only across the band
    g.globalAlpha = a * 0.5;
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (let yy = y0 - 4 * t; yy < y0 + 11 * t + (o.small ? 4 * t : 0); yy += 3) g.fillRect(0, yy, cv.width, 1);
    g.globalAlpha = 1;
  }

  const stockCache = {};
  function stockRead(id) {
    const c = stockCache[id];
    if (c && S.time - c.t < 0.8) return c;
    let sum = 0, n = 0, critical = false;
    const st = S.stations[id];
    if (st && st.stock) for (const g of DATA.stations[id].needs) {
      const v = st.stock[g]; if (v === undefined) continue;
      sum += v; n++; if (v < 15) critical = true;
    }
    const avg = n ? sum / n : 60;
    return stockCache[id] = { t: S.time, bays: avg > 52 ? 2 : avg > 20 ? 1 : 0, critical };
  }
  function drawStations(inView, dt) {
    for (const id of stationOrder) {
      const d = stations[id], st = S.stations[id];
      if (!inView(d.x, d.y, 700)) continue;
      const lit = st.connected && st.litT > 0;
      const t = S.time;
      // platform: a stepped stone slab, cut the way the era cut it
      const slab = [[34, -18], [46, -13], [52, -6], [52, 2], [46, 9], [36, 15]];
      cx.fillStyle = '#20262e';
      for (const [hw3, yy] of slab) cx.fillRect(d.x - hw3 - 2, d.y + yy + 4, hw3 * 2 + 4, 7);
      cx.fillStyle = '#2b323c';
      for (const [hw3, yy] of slab) cx.fillRect(d.x - hw3, d.y + yy, hw3 * 2, 7);
      cx.fillStyle = '#343c48';
      cx.fillRect(d.x - 46, d.y - 13, 92, 4);
      // waylight mast rises BEHIND the longhouse roof — an authored lattice, not two strokes
      const tx = d.x, tyb = d.y - 14, th = 58;
      blit(TOWER_ROWS, tx - 13.5, tyb - th - 2, 3, {
        O: '#0d1116', K: '#20262e',
        T: lit ? '#6b5a42' : '#3a4048', S: '#3a3428',
      }, false);
      // the stone longhouse out front, windows burning when the station is on the wire
      // the windows are the stock report: full pantry, both bays burn; short, one goes dark;
      // starved, both are out and the doorway gutters. Read from across a field, not a panel.
      const sr = lit ? stockRead(id) : null;
      const hutPal = {
        O: '#0d1116',
        r: lit ? '#a06a40' : '#5c4a3a', R: lit ? '#7a5138' : '#463a30',
        G: lit ? '#7d8288' : '#525860',
        W: lit && sr && sr.bays >= 1 ? '#ffd98f' : '#2b313b',
        V: lit && sr && sr.bays >= 2 ? '#ffd98f' : '#2b313b',
        D: sr && sr.critical && ((S.time * 3) | 0) % 2 ? '#c9924e' : '#3c2e22',
      };
      blit(HUT, d.x - 36.8, d.y - 22.8, 4.6, hutPal, false);
      // yard props: crates stacked port side, a rain barrel starboard — it's a depot, not a lawn
      const crate = lit ? '#8a6a42' : '#4c4234', crateHi = lit ? '#a8845a' : '#5a4e3c';
      blit(['OOOO', 'OCCO', 'OCCO', 'OOOO'], d.x - 47, d.y - 4, 2.8, { O: '#0d1116', C: crate }, false);
      blit(['OOOO', 'OcCO', 'OCcO', 'OOOO'], d.x - 44, d.y + 4, 2.8, { O: '#0d1116', C: crate, c: crateHi }, false);
      blit(['.OO.', 'OBBO', 'OBBO', '.OO.'], d.x + 41, d.y - 1, 2.8, { O: '#0d1116', B: lit ? '#556066' : '#3c444c' }, false);
      if (lit) {
        // the beacon fire — authored frames in the cage, with its corona; the FIELD carries the light
        cx.globalCompositeOperation = 'lighter';
        glowShells(tx, tyb - th - 8, 20 * st.litT, 'rgba(255,196,120,1)');
        cx.globalCompositeOperation = 'source-over';
        cx.globalAlpha = st.litT;
        blit(FIRE_F[((t * 6) | 0) % 3].slice(0, 6), tx - 7, tyb - th - 13, 2, FIRE_PAL, false);
        cx.globalAlpha = 1;
        // window spill: the light that gets OUT — banded pools under burning bays, night only
        const nsp = Economy.dayPhase().nightness;
        if (nsp >= 0.18) {
          const spA = nsp >= 0.62 ? 1 : 0.5;
          cx.globalCompositeOperation = 'lighter';
          const pool = (wx, ww) => {
            for (let ry = 0; ry < 4; ry++) {
              cx.fillStyle = `rgba(255,214,150,${(ry < 2 ? 0.16 : 0.08) * spA})`;
              const w2 = ww + ry * 6;
              for (let sxp = 0; sxp < w2; sxp += 3) {
                const hem = sxp === 0 || sxp >= w2 - 3;
                if (hem && RBAY[ry & 3][(sxp / 3) & 3] / 16 >= 0.5) continue;
                cx.fillRect(Math.round((wx - w2 / 2 + sxp) / 3) * 3, d.y + 15 + ry * 3, 3, 3);
              }
            }
          };
          if (sr && sr.bays >= 1) pool(d.x - 23, 15);
          if (sr && sr.bays >= 2) pool(d.x + 23, 15);
          pool(d.x, 9);   // the doorway's slot of light
          cx.globalCompositeOperation = 'source-over';
        }
      } else {
        // a dark station keeps one ember in the cage
        const fb = (t * 3 + d.y) % 2 < 1;
        cx.fillStyle = 'rgba(255,180,90,0.4)';
        cx.fillRect(tx - 2, tyb - th - 8, 4, 4);
        if (fb) { cx.fillStyle = 'rgba(255,180,90,0.25)'; cx.fillRect(tx - 1, tyb - th - 10, 2, 2); }
      }
      // label, in the world's own face — queued, drawn crisp in screen space
      plabel(d.name, d.x, d.y + 30, 4, lit ? '#ffe3b0' : '#969ba5');
      if (st.stars) plabel('◆'.repeat(st.stars), d.x, d.y + 30, 3, '#ffc978', { dy: 24 });
    }
  }
  /* LEDGERLIGHT: the wire drawn as caravans of light — three gold texels and a tail, walking
     the road between stations if one is paved, the crow-line if not. The economy, visible. */
  const wireRoutes = {};
  function wireRoute(a, b) {
    let builtN = 0;
    for (const r of DATA.roads) if (r.needs.includes(a) && r.needs.includes(b)) { const bl = S.roads[r.id]; if (bl) builtN += bl.filter(x => x).length; }
    const key = a + '>' + b + '|' + builtN;
    if (wireRoutes[key]) return wireRoutes[key];
    let pts = null;
    for (const r of DATA.roads) if (r.needs.includes(a) && r.needs.includes(b)) {
      const built = S.roads[r.id];
      if (built && built.some(x => x)) { pts = r.needs[0] === a ? r.pts : [...r.pts].reverse(); break; }
    }
    if (!pts) { const A = stations[a], B = stations[b]; pts = [[A.x, A.y], [B.x, B.y]]; }
    return wireRoutes[key] = { pts, len: U.polyLen(pts.map(([x, y]) => ({ x, y }))) };
  }
  function drawWire(inView, dt) {
    const P2 = Economy.pulses;
    if (!P2.length) return;
    cx.globalCompositeOperation = 'lighter';
    for (let i = P2.length - 1; i >= 0; i--) {
      const p = P2[i];
      const rt = wireRoute(p.a, p.b);
      const dur = rt.len / 300;
      p.t += dt;
      if (p.t >= dur) { P2.splice(i, 1); continue; }
      const poly = rt.pts.map(([x, y]) => ({ x, y }));
      for (let k = 0; k < 4; k++) {
        const d2 = Math.max(0, p.t * 300 - k * 13);
        const pos = U.polyAt(poly, d2);
        if (!inView(pos.x, pos.y, 40)) continue;
        cx.fillStyle = k === 0 ? '#ffe8b0' : k === 1 ? '#ffd070' : 'rgba(255,190,110,0.55)';
        const sz2 = k === 0 ? 7 : k === 1 ? 6 : 4;
        cx.fillRect(Math.round(pos.x / 4) * 4 - sz2 / 2, Math.round(pos.y / 4) * 4 - sz2 / 2, sz2, sz2);
      }
    }
    cx.globalCompositeOperation = 'source-over';
  }
  function drawBeams(dt) {
    // the shaft belongs to the night: at noon there is nothing to see a beam IN.
    const nn = Economy.dayPhase().nightness;
    const nnA = nn >= 0.62 ? 1 : nn >= 0.18 ? 0.5 : 0;
    if (!nnA) return;
    cx.globalCompositeOperation = 'lighter';
    for (const id of stationOrder) {
      const st = S.stations[id];
      if (!st.connected || st.litT <= 0) continue;
      const d = stations[id];
      const bh = 150 * st.litT;
      const sway = Math.round(Math.sin(S.time * 0.8 + d.x)) * 3;          // one texel of lean, as a body
      const fl2 = ((S.time * 7) | 0) % 2 ? 1 : 0.86;                       // mains flicker, two steps
      cx.globalAlpha = nnA * fl2 * st.litT;
      cx.imageSmoothingEnabled = false;
      cx.drawImage(shaftSprite(), d.x - 12 + sway, d.y - 74 - bh, 24, bh);
      cx.globalAlpha = 1;
    }
    cx.globalCompositeOperation = 'source-over';
  }

  /* ---------- structures ---------- */
  /* ---------- THE BUILDS — the player's own architecture, authored like the stations' ----------
     A ring of dots is the era's circle; a lattice of texels is the era's tower. Every structure is
     a baked sprite in the timber palette (echo builds remap to lumen); damage bites texels out of it.
     Auras stop being stroked circles: the ground shows them as a baked ring of ordered dots. */
  const STRUCT_ROWS = {
    generator: [
      '.....OGGO.....',
      '......OO......',
      '...OTTTTTTO...',
      '...OTdDDDTO...',
      '...OTDLLDTO...',
      '...OTDDDDTO...',
      '...OTTTTTTO...',
      '..ORRRRRRRRO..',
      '.ORRrrrrrrRRO.',
      '.OOOOOOOOOOOO.',
    ],
    shelter: [
      '.........OO.........',
      '........OTTO........',
      '.......OTDDTO.......',
      '......OTDDDDTO......',
      '.....OTDDDDDDTO.....',
      '....OTDDDDDDDDTO....',
      '...OTDDDOKKODDDTO...',
      '..OTDDDDOKKODDDDTO..',
      '.OTDDDDDOKKODDDDDTO.',
      '.OSSSSSSOKKOSSSSSSO.',
      '..OOOOOOOOOOOOOOOO..',
    ],
    watchtower: [
      '.....OLLO.....',
      '..OTTTTTTTTO..',
      '..OT.T..T.TO..',
      '..OTTTTTTTTO..',
      '...OD....DO...',
      '...ODO..ODO...',
      '...ODDOODDO...',
      '...ODODDODO...',
      '..OD.ODDO.DO..',
      '..ODO.DD.ODO..',
      '..ODDO..ODDO..',
      '.OD.ODDDDO.DO.',
      '.ODO..DD..ODO.',
      'OSSO..DD..OSSO',
      'OOOO..OO..OOOO',
    ],
    zipline: [
      '....OLLO....',
      '...OTTTTO...',
      '....ODDO....',
      '....ODDO....',
      '....ODDO....',
      '....ODDO....',
      '....ODDO....',
      '...ODDDDO...',
      '..OSSSSSSO..',
      '..OOOOOOOO..',
    ],
  };
  const structCache = new Map();
  function structSprite(type, echo, dmg) {
    const key = type + (echo ? 'E' : '') + (dmg ? 'D' : '');
    let c = structCache.get(key);
    if (c) return c;
    const P = echo
      ? { O: '#0e1f1c', T: '#8fe8da', d: '#bff5ec', D: '#2c5a54', S: '#1d3f3a', K: '#0c1a17', G: '#8fe8da', L: '#bff5ec', R: '#2c5a54', r: '#1d3f3a' }
      : { O: '#17130b', T: '#d8cfae', d: '#e8e0c2', D: '#5a5342', S: '#3a3428', K: '#151a20', G: '#ffd98f', L: '#6fe3d2', R: '#6b7076', r: '#4a4f57' };
    const rows = STRUCT_ROWS[type];
    c = document.createElement('canvas'); c.width = rows[0].length; c.height = rows.length;
    const g = c.getContext('2d');
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const ch = row[x]; if (ch === '.') continue; g.fillStyle = P[ch] || '#f0f'; g.fillRect(x, y, 1, 1); } });
    if (dmg) {                                        // the years bite texels out of a failing build
      const rg = U.rng(type.length * 977);
      for (let i = 0; i < 7; i++) g.clearRect((rg() * c.width) | 0, 1 + ((rg() * (c.height - 3)) | 0), 1 + (rg() * 2 | 0), 1);
    }
    structCache.set(key, c);
    return c;
  }
  const auraCache = {};
  function auraRingSprite(r, color) {
    const key = (r | 0) + color;
    let c = auraCache[key];
    if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = r * 2 + 12;
    const g = c.getContext('2d');
    g.fillStyle = color;
    const n = (r * 6.2832 / 11) | 0;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832;
      if ((i & 3) === 3) continue;                    // a gap every fourth dot — a stitched hem, not a wall
      g.fillRect(Math.round((r + 6 + Math.cos(a) * r) / 3) * 3, Math.round((r + 6 + Math.sin(a) * r) / 3) * 3, 3, 3);
    }
    return auraCache[key] = c;
  }
  /* four corner brackets — the doctrine's reticle, for anything held or aimed at */
  function drawBrackets(bx, by, r, color, arm = 6, th = 2) {
    cx.fillStyle = color;
    cx.fillRect(bx - r, by - r, arm, th); cx.fillRect(bx - r, by - r, th, arm);            // TL
    cx.fillRect(bx + r - arm, by - r, arm, th); cx.fillRect(bx + r - th, by - r, th, arm); // TR
    cx.fillRect(bx - r, by + r - th, arm, th); cx.fillRect(bx - r, by + r - arm, th, arm); // BL
    cx.fillRect(bx + r - arm, by + r - th, arm, th); cx.fillRect(bx + r - th, by + r - arm, th, arm); // BR
  }
  /* a ring of solid dots on the texel grid — the doctrine's circle, for anything that pulses */
  function dotRing(x, y, r, color, step = 9) {
    const n = Math.max(8, (r * 6.2832 / step) | 0);
    cx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832 + r * 0.06;
      cx.fillRect(Math.round((x + Math.cos(a) * r) / 3) * 3, Math.round((y + Math.sin(a) * r) / 3) * 3, 3, 3);
    }
  }
  function drawStructures(inView, dt) {
    // zip lines first
    cx.strokeStyle = 'rgba(140,220,210,0.55)'; cx.lineWidth = 1.6;
    for (const [a, b] of S.zipLinks) {
      const pa = S.structures.find(s => s.id === a), pb = S.structures.find(s => s.id === b);
      if (!pa || !pb) continue;
      if (!inView(pa.x, pa.y, 900) && !inView(pb.x, pb.y, 900)) continue;
      cx.beginPath();                                                     // the wire sags in straight runs, like wire does
      const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2 + 14;
      cx.moveTo(pa.x, pa.y - 34);
      cx.lineTo((pa.x + mx) / 2, (pa.y - 34 + my - 20) / 2 + 3);
      cx.lineTo(mx, my - 20);
      cx.lineTo((pb.x + mx) / 2, (pb.y - 34 + my - 20) / 2 + 3);
      cx.lineTo(pb.x, pb.y - 34);
      cx.stroke();
    }
    for (const st of S.structures) {
      if (!inView(st.x, st.y, Math.max(200, (SDEF[st.type].aura || 0) + 40))) continue;
      const dmg = st.hp < 40;
      const col = st.echo ? '#6fe3d2' : '#d8cfae';
      const dark = st.echo ? '#2c5a54' : '#5a5342';
      const sx2 = Math.round(st.x), sy2 = Math.round(st.y);
      // the ground knows the reach — but only speaks when you are in it: a faint stitched
      // hem of dots at the aura's edge, fading in as the walker crosses into the build's care
      if (st.type === 'generator' || st.type === 'shelter') {
        const rr = SDEF[st.type].aura;
        const pd = U.dist(S.px, S.py, st.x, st.y);
        const k = U.clamp(1 - Math.abs(pd - rr * 0.7) / (rr * 0.7), 0, 1);   // strongest standing inside
        if (k > 0.04) {
          const ring = auraRingSprite(rr, st.type === 'generator' ? 'rgba(255,214,140,0.5)' : 'rgba(216,207,174,0.45)');
          cx.globalAlpha = 0.16 * k;
          cx.drawImage(ring, sx2 - rr - 6, sy2 - rr - 6);
          cx.globalAlpha = 1;
        }
      }
      cx.save();
      cx.translate(sx2, sy2);
      if (st.type === 'ladder' || st.type === 'bridge') {
        cx.rotate(st.ang);
        const hl = SDEF[st.type].span / 2;
        if (st.type === 'ladder') {
          cx.fillStyle = dmg ? '#8a6a4a' : col;
          cx.fillRect(-hl, -7, hl * 2, 3); cx.fillRect(-hl, 4, hl * 2, 3);       // rails
          cx.fillStyle = dmg ? '#6a5138' : dark;
          for (let x = -hl + 6; x < hl - 3; x += 11) cx.fillRect(x, -5, 4, 10);  // rungs
          if (dmg) { cx.clearRect(-hl + 14, -7, 6, 3); cx.clearRect(hl - 22, 4, 7, 3); }
        } else {
          cx.fillStyle = '#3a3428';
          cx.fillRect(-hl, -11, hl * 2, 22);                                      // the dark under-bed
          for (let x = -hl + 2, i = 0; x < hl - 5; x += 8, i++) {                 // decking, plank by plank — mid timber, walked dull
            cx.fillStyle = i % 2 ? (dmg ? '#6b624c' : '#a89d7d') : (dmg ? '#786e55' : '#b8ad8c');
            if (!(dmg && i % 5 === 2)) cx.fillRect(x, -9, 6, 18);                 // a missing plank when it hurts
          }
          cx.fillStyle = col; cx.fillRect(-hl, -12, hl * 2, 3); cx.fillRect(-hl, 9, hl * 2, 3);   // rope rails
          cx.fillStyle = dmg ? '#4a4438' : dark;
          cx.fillRect(-hl - 2, -13, 4, 26); cx.fillRect(hl - 2, -13, 4, 26);       // end posts
        }
      } else {
        const sp = structSprite(st.type, !!st.echo, dmg);
        const sc = 3;                                                              // 3 world units per texel — station-grade chunk
        pixShadow(0, sp.height * sc / 2 - 4, sp.width * sc * 0.7);
        cx.imageSmoothingEnabled = false;
        cx.drawImage(sp, -Math.round(sp.width * sc / 2), -Math.round(sp.height * sc * 0.72), sp.width * sc, sp.height * sc);
        // the living texel on top: lamp, beacon, wheel — pulsing as pixels, never as arcs
        const topY = -Math.round(sp.height * sc * 0.72);
        if (st.type === 'generator') {
          const p = 0.6 + Math.sin(S.time * 4) * 0.4;
          cx.globalCompositeOperation = 'lighter';
          glowShells(0, topY + 2, 15 + p * 6, st.echo ? 'rgba(140,240,225,0.35)' : 'rgba(255,214,140,0.35)');
          cx.globalCompositeOperation = 'source-over';
          cx.fillStyle = p > 0.8 ? '#fff2d0' : '#ffd98f';
          cx.fillRect(-3, topY, 6, 6);
        } else if (st.type === 'watchtower') {
          const bl = (S.time * 2 % 2) < 1;
          cx.fillStyle = bl ? '#6fe3d2' : '#2c5a54';
          cx.fillRect(-3, topY, 6, 6);
          if (bl) { cx.globalCompositeOperation = 'lighter'; glowShells(0, topY + 3, 14, 'rgba(140,240,225,0.35)'); cx.globalCompositeOperation = 'source-over'; }
        } else if (st.type === 'zipline') {
          cx.fillStyle = '#bff5ec'; cx.fillRect(-3, topY, 6, 5);
        }
      }
      cx.restore();
      if (st.echo && cam.z > 0.55) plabel(`${st.by} · ◆${st.likes || 0}`, st.x, st.y - 50, 3, '#6fe3d2');
      if (st.hp < 70 && cam.z > 0.6) plabel(`${Math.round(st.hp)}%`, st.x, st.y + 16, 3, st.hp < 40 ? '#ff8a5f' : '#b8b29d');
    }
    // zip traveller — an authored rider on the wire, boots trailing
    if (S.state === 'zip' && S.zip) {
      blit(RIDER_ROWS, S.px - 8.75, S.py - 34, 2.5, RIDER_PAL, S.zip.x1 < S.zip.x0);
    }
  }
  const RIDER_ROWS = [
    'OTTTTTO',
    '..OSO..',
    '.OSSSO.',
    '.OCCCO.',
    'OCCcCCO',
    '.OCCCO.',
    '..OBO..',
    '.OB.BO.',
    '.Ob.bO.',
  ];
  const RIDER_PAL = { O: '#12161c', T: '#d8cfae', S: '#e0c298', C: '#3d5a74', c: '#2c4258', B: '#23282f', b: '#171b21' };

  /* ---------- pavers & pickups ---------- */
  function drawPavers(inView) {
    for (const r of DATA.roads) {
      if (!r.needs.every(id => S.stations[id].connected)) continue;
      for (let si = 0; si < r.segs; si++) {
        if (S.roads[r.id][si]) continue;
        const p = World.paverPos(r, si);
        if (inView(p.x, p.y)) {
          pixShadow(p.x, p.y + 10, 34);
          blit(PAVER_ROWS, p.x - 18.75, p.y - 10, 2.5, PAVER_PAL, false);
          plabel('PAVER', p.x, p.y + 20, 3, '#ffc978');
        }
        break;
      }
    }
  }
  /* ---------- authored ground props (v3.15) — the patchwork rects retired ---------- */
  const SALV_METAL = [
    '....OO..O.....',
    '...OcCOOCO.O..',
    '..OCcCCcCOOCO.',
    '.OCCrCcCCCcCO.',
    'OcCCCcCCrCCCcO',
    'OCcCCCcCCCcCCO',
    '.OOOOOOOOOOOO.',
  ];
  const SALV_PAL_M = { O: '#12161c', C: '#6e747c', c: '#9aa2ab', r: '#8a5238' };
  const SALV_CERAM = [
    '.....O.OO....',
    '...OOSOsSO...',
    '..OSsSSOSSO..',
    '.OSSOSsSSsSO.',
    'OsSSSSOSSSSsO',
    '.OOOOOOOOOOO.',
  ];
  const SALV_PAL_C = { O: '#17130b', S: '#9a8468', s: '#c2ab89' };
  const LUMEN_F = [[
    '.....M.....',
    '..W..MM....',
    '..M.WMM.M..',
    '.LM.MML.ML.',
    '.LMMMLM.ML.',
    '.OLMLOMLLO.',
    '..OLO.OLO..',
  ], [
    '.....W.....',
    '..M..WM....',
    '..W.MWM.W..',
    '.LW.WML.WL.',
    '.LMWMLW.ML.',
    '.OLMLOMLLO.',
    '..OLO.OLO..',
  ]];
  const LUMEN_PAL = { O: '#0e1f1c', L: '#2c8a7c', M: '#6fe3d2', W: '#d8fff5' };
  const CRATE_W = [
    '.OOOOOO.',
    'OppppppO',
    'OPPkPPPO',
    'OBBBBBBO',
    'OPkPPPkO',
    'OppppppO',
    '.OOOOOO.',
  ];
  const cratePals = {};
  const cratePal = band => cratePals[band] || (cratePals[band] = { O: '#17130b', P: '#6b4a30', p: '#8a6a42', k: '#4a3320', B: band });
  const bandFor = item => !item ? '#c9b98a' : (item.lostTo || item.orderId) ? '#ffd98f' : item.cat === 'core' ? '#6fe3d2' : item.cat === 'mat' ? '#8a8f98' : '#c9b98a';
  const PAVER_ROWS = [
    '.OOOOOOOOOOOOO.',
    'OGKGKGKGKGKGKGO',
    'OSSSSSSSSSSSSSO',
    'OSsSSHHHHSSSsSO',
    'OSSSSHhHHSSSSSO',
    'OOKKOOOOOOOKKOO',
    '.OKkKO...OKkKO.',
    '..OOO.....OOO..',
  ];
  const PAVER_PAL = { O: '#12161c', G: '#ffc978', K: '#20262e', k: '#3a434e', S: '#5a626c', s: '#7a828c', H: '#33383f', h: '#4a525c' };
  const CAIRN_ROWS = [
    '...OO....',
    '..OssO...',
    '..OSSO...',
    '.OSSsSO..',
    '.OSSSSO..',
    'OsSOSSsO.',
    'OSSOSSSOO',
    'OOOOOOOOO',
  ];
  const CAIRN_PAL = { O: '#12161c', S: '#6b7076', s: '#8d979c' };
  const SUPPLY_ROWS = [
    '..OOOOOO..OWWO..',
    '.OppppppOOWwWWO.',
    '.OPPGPPPOWwWWWO.',
    '.OGGGGGGOOWWOO..',
    '.OPPGPPPO..OO...',
    '.OppppppO.......',
    '..OOOOOO........',
  ];
  const SUPPLY_PAL = { O: '#17130b', P: '#6b4a30', p: '#8a6a42', G: '#ffc978', W: '#b8bec6', w: '#d8dde2' };
  const CART_ROWS = [
    '......OOOOOOOO......',
    '..OOOOWwwwwwwWOOOO..',
    '..OWwwWWWWWWWWwwWO..',
    '..OOOOOOOOOOOOOOOOL.',
    '..OPpppppppppppPO.W.',
    '..OPPPPPPPPPPPPPO.L.',
    '..OOKKOOOOOOKKOOO.L.',
    '...OKkKO..OKkKO...L.',
    '...OKKKO..OKKKO.....',
    '....OOO....OOO......',
  ];
  const CART_PAL = { O: '#17130b', W: '#d8d2bd', w: '#b8b29d', P: '#5a4a38', p: '#7a6248', K: '#2a2f38', k: '#4a5560', L: '#8a6534' };
  function worldCrate(x, y, band) {
    pixShadow(x, y + 9, 20);
    blit(CRATE_W, x - 10, y - 9, 2.5, cratePal(band), false);
  }
  function drawPickups(inView) {
    const tL = ((S.time * 3) | 0) % 2;
    for (const d of S.drops) if (inView(d.x, d.y)) worldCrate(d.x, d.y, bandFor(d.item));
    for (const l of S.lost) if (!l.taken && inView(l.x, l.y)) {
      worldCrate(l.x, l.y, '#ffd98f');
      cx.globalCompositeOperation = 'lighter';
      glowShells(l.x, l.y - 2, 13 + tL * 2, 'rgba(255,201,120,1)');
      cx.globalCompositeOperation = 'source-over';
    }
    for (const sn of S.snags) if (inView(sn.x, sn.y)) {
      // the wraith's knot: a rope cross in stepped texels, the crate swinging one texel under it
      cx.fillStyle = '#d96b4f';
      for (let i = 0; i < 7; i++) {
        cx.fillRect(Math.round((sn.x - 10 + i * 3) / 3) * 3, Math.round((sn.y - 20 + i * 2) / 3) * 3, 3, 3);
        cx.fillRect(Math.round((sn.x + 8 - i * 3) / 3) * 3, Math.round((sn.y - 20 + i * 2) / 3) * 3, 3, 3);
      }
      worldCrate(sn.x + (tL ? 2 : -2), sn.y, '#c9975a');
    }
    for (const n of S.nodes) {
      if (n.taken || !inView(n.x, n.y)) continue;
      if (n.type === 'lumen') {
        cx.globalCompositeOperation = 'lighter';
        glowShells(n.x, n.y - 3, 12 + tL * 2, 'rgba(140,240,225,1)');
        cx.globalCompositeOperation = 'source-over';
        blit(LUMEN_F[tL], n.x - 13.75, n.y - 12, 2.5, LUMEN_PAL, false);
      } else if (n.type === 'metal') {
        pixShadow(n.x, n.y + 8, 30);
        blit(SALV_METAL, n.x - 17.5, n.y - 10, 2.5, SALV_PAL_M, false);
      } else {
        pixShadow(n.x, n.y + 7, 28);
        blit(SALV_CERAM, n.x - 16.25, n.y - 8, 2.5, SALV_PAL_C, false);
      }
    }
  }

  /* ---------- camps ---------- */
  function drawCamps(inView, dt) {
    for (const cd of DATA.camps) {
      const cs = S.camps[cd.id];
      if (!inView(cd.x, cd.y, cd.r + 100)) continue;
      // tents: an authored hide-tent glyph, door lit by the fire
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1, tx = cd.x + Math.cos(a) * 40, ty = cd.y + Math.sin(a) * 26;
        const tpal = { O: '#12100c', R: cs.pacified ? '#4c4c44' : '#513e34', r: cs.pacified ? '#5c5c52' : '#634c3e', D: cs.pacified ? '#c9a05a' : '#c96a48' };
        blit(TENT, tx - 15, ty - 12, 2.5, tpal, i === 1);
      }
      // the camp fire — authored frames on their logs, wearing a corona
      cx.globalCompositeOperation = 'lighter';
      glowShells(cd.x, cd.y - 5, 15 + (((S.time * 6) | 0) % 2) * 2, cs.pacified ? 'rgba(255,214,140,1)' : 'rgba(255,150,90,1)');
      cx.globalCompositeOperation = 'source-over';
      blit(FIRE_F[((S.time * 6) | 0) % 3], cd.x - 8.75, cd.y - 15, 2.5, FIRE_PAL, false);
      // stash
      if (cs.stash.length) { cx.fillStyle = '#c9b98a'; cx.fillRect(cd.x + 24, cd.y - 8, 14, 12); cx.fillRect(cd.x + 30, cd.y - 16, 12, 10); }
      // runners
      if (!cs.pacified) for (const r of cs.runners) {
        cx.save(); cx.translate(r.x, r.y);
        pixShadow(0, 6, 15);
        const chasing = r.cd <= 0 && U.dist(r.x, r.y, S.px, S.py) < cd.r;
        blitWalker(0, 0, PAL_SCRAP, chasing, S.time * 12 + r.wa, Math.atan2(S.py - r.y, S.px - r.x));
        // headlamp cone toward player when hunting — a fan of solid dots on the grid
        const d = U.dist(r.x, r.y, S.px, S.py);
        if (d < cd.r + 60) {
          const a = Math.atan2(S.py - r.y, S.px - r.x);
          cx.globalCompositeOperation = 'lighter';
          for (let dd = 14; dd < 58; dd += 9) {
            // banded falloff along the throw, dither only on the fan's rim — a cone of light, not a checker
            cx.fillStyle = `rgba(255,170,120,${dd < 30 ? 0.3 : dd < 46 ? 0.18 : 0.1})`;
            const spread = 0.28, k = Math.max(1, (dd * spread / 8) | 0);
            for (let s = -k; s <= k; s++) {
              if (Math.abs(s) === k && RBAY[(dd / 9 | 0) & 3][(s + 4) & 3] / 16 >= 0.5) continue;
              const aa = a + (s / k) * spread;
              cx.fillRect(Math.round(Math.cos(aa) * dd / 3) * 3, Math.round((-12 + Math.sin(aa) * dd) / 3) * 3, 3, 3);
            }
          }
          cx.globalCompositeOperation = 'source-over';
        }
        cx.restore();
      } else {
        // neutral wanderers wave
        cx.fillStyle = '#8a8a7a';
        cx.fillRect(cd.x - 60, cd.y + 10, 6, 12);
        cx.fillRect(cd.x - 59, cd.y + 3, 5, 5);
      }
    }
  }

  /* ---------- wraiths ---------- */
  function drawWraiths(inView, dt) {
    for (const w of S.wraiths) {
      if (!inView(w.x, w.y, 120)) continue;
      const hunt = w.state === 'hunt';
      const burn = w.state === 'burn';
      const alpha = burn ? Math.max(0, 1 - (w.burnT || 0)) : 1;
      /* the one unsolid thing in the valley, rendered in the era's own language for unsolid things:
         its body IS ordered dither — a cloud of solid spectral texels thinning outward, breathing
         as the world's fixed dither grid slides under it. Ghosts were checkerboards in 1996. */
      cx.globalCompositeOperation = 'lighter';
      cx.globalAlpha = alpha;
      const rad = hunt ? 30 : 25;
      const bodyCol = hunt ? 'rgba(150,160,255,0.60)' : 'rgba(120,132,178,0.55)';
      const sway = Math.sin(S.time * 1.7 + w.ph) * 3;
      ghostBody(w.x + sway * 0.4, w.y - 14, rad, bodyCol);
      // tendrils: chains of solid squares walking down the old curve
      cx.fillStyle = hunt ? '#96a0e0' : '#7e88b4';
      for (let i = 0; i < 4; i++) {
        const a = w.ph + i * 1.7 + S.time * 0.8;
        const cxm = w.x + Math.cos(a) * 16, cym = w.y + 6;
        const ex = w.x + Math.cos(a) * 26, ey = w.y + 18 + Math.sin(a * 2) * 5;
        for (let tq = 0.15; tq <= 1; tq += 0.17) {
          const it = 1 - tq;
          const px2 = it * it * w.x + 2 * it * tq * cxm + tq * tq * ex;
          const py2 = it * it * (w.y - 10) + 2 * it * tq * cym + tq * tq * ey;
          const s2 = 2.6 - tq * 1.2;
          cx.fillRect(px2 - s2 / 2, py2 - s2 / 2, s2, s2);
        }
      }
      // eyes: two hard pixels — the only certain thing about it
      if (!burn) {
        cx.fillStyle = '#e6ecff';
        cx.fillRect(w.x - 6, w.y - 19, 2.4, 2.4); cx.fillRect(w.x + 3.6, w.y - 19, 2.4, 2.4);
      }
      cx.globalAlpha = 1;
      cx.globalCompositeOperation = 'source-over';
      // alert meter
      if (!hunt && !burn && w.alert > 0.1) {
        cx.fillStyle = 'rgba(255,255,255,0.25)';
        cx.fillRect(w.x - 12, w.y - 40, 24, 3);
        cx.fillStyle = 'rgba(200,210,255,0.9)';
        cx.fillRect(w.x - 12, w.y - 40, 24 * Math.min(1, w.alert), 3);
      }
    }
  }

  /* ---------- player ---------- */
  let bobT = 0;
  const COATS = [
    { C: '#4a5560', c: '#39434c', T: '#8a8062', t: '#6b6349', H: '#3a4048' },   // Greenhand · Mudfoot: drab wool
    { C: '#3d5a74', c: '#2c4258', T: '#c9a05a', t: '#a5824a', H: '#2c4258' },   // Sworn · Pathbinder: the blue coat
    { C: '#3d5a74', c: '#8a6a34', T: '#ffc978', t: '#c9a05a', H: '#2c4258' },   // Lifeline · Lamplord: gold-trimmed
    { C: '#2a3038', c: '#a07830', T: '#ffd98f', t: '#c9a860', H: '#1d2228' },   // Legend: dark coat, gold lining
  ];
  function coatFor() {
    let tier = 0;
    for (let i = 0; i < DATA.titles.length; i++) if ((S.level || 0) >= DATA.titles[i][0]) tier = i;
    return { ...PAL_WALKER, ...COATS[Math.min(3, tier >> 1)] };
  }
  const prints = [];   // footprints and splashes, stamped by the feet, drawn on the ground pass
  const clouds = [
    { x: 2000, y: 3000, rx: 620, ry: 340, a: 0.4, vx: 10, vy: 2.5 },
    { x: 6200, y: 8200, rx: 460, ry: 260, a: -0.3, vx: 8, vy: 3.5 },
  ];
  let lastPrint = { x: 0, y: 0, side: 1 };
  function stampPrints() {
    if (Math.hypot(S.px - lastPrint.x, S.py - lastPrint.y) < 7) return;
    lastPrint.side = -lastPrint.side;
    const c = World.classAt(S.px, S.py);
    const perp = S.dir + Math.PI / 2;
    const px2 = S.px + Math.cos(perp) * 2.2 * lastPrint.side, py2 = S.py + 4 + Math.sin(perp) * 2.2 * lastPrint.side;
    if (c === World.SHALLOW) {
      for (let k = 0; k < 3; k++) prints.push({ kind: 'splash', x: S.px + (Math.random() - 0.5) * 8, y: S.py + 3 + (Math.random() - 0.5) * 6, t: 0, life: 0.5 });
    } else if (c === World.SNOW) prints.push({ kind: 'snow', x: px2, y: py2, t: 0, life: 9 });
    else if (c === World.SCREE || c === World.ROCK) prints.push({ kind: 'scree', x: px2, y: py2, t: 0, life: 2.5 });
    else if (c === World.MEADOW || c === World.MARSH) prints.push({ kind: 'grass', x: px2, y: py2, t: 0, life: 5 });
    else { lastPrint.x = S.px; lastPrint.y = S.py; return; }
    lastPrint.x = S.px; lastPrint.y = S.py;
    if (prints.length > 90) prints.splice(0, prints.length - 90);
  }
  function drawPlayer(dt) {
    if (S.state === 'zip') return;
    const x = S.px, y = S.py;
    const moving = S.speed > 5;
    if (moving) { bobT += dt * (S.sprinting ? 13 : 9); stampPrints(); }
    const bob = moving ? Math.sin(bobT) * 1.6 : 0;
    const lean = S.qte ? Math.sin(S.time * 18) * 0.16 : S.braced ? 0 : moving ? Math.sin(bobT * 0.5) * 0.03 : 0;
    cx.save();
    cx.translate(x, y);
    cx.scale(1.22, 1.22);
    pixShadow(0, 5, 17);
    const crouch = S.braced ? 2 : 0;
    // cargo stack (behind body, offset opposite facing)
    // during a hand-over the ledger has already settled but the hands are still moving:
    // crates not yet hopped keep riding the pack, and leave it one by one
    const stack = (S.handover ? [...S.handover.looks, ...S.cargo.filter(c => c.cat !== 'tool')] : S.cargo.filter(c => c.cat !== 'tool')).slice(0, 7);
    const tools = S.cargo.filter(c => c.cat === 'tool').length;
    const tw2 = rigT();
    const bx = -Math.cos(S.dir) * 1.5 * tw2, by = -2;
    let sy = -10.5 * tw2 - crouch + bob * 0.5;   // the tower sits on the pack: sprite texel 7.5 above the feet
    cx.save();
    cx.translate(bx, by);
    cx.rotate(lean * 2.2 + (S.qte ? Math.sin(S.time * 22) * 0.1 : 0));
    const colors = { goods: '#b3a06a', core: '#ffc978', mat: '#8a8676', lost: '#c9975a' };
    for (let i = 0; i < stack.length; i++) {
      const c = stack[i];
      const hgt2 = c.kg > 12 ? 6.8 : 5.1;   // crates on the pixel grid, big or small
      sy -= hgt2;
      cx.fillStyle = '#12161c';
      cx.fillRect(-6, sy - 0.85, 12, hgt2 + 0.85);
      cx.fillStyle = c.cat === 'core' ? '#ffc978' : c.lostTo ? '#c9975a' : colors[c.cat] || '#b3a06a';
      cx.fillRect(-5.1, sy, 10.2, hgt2 - 1.7);
      cx.fillStyle = 'rgba(18,22,28,0.75)';   // lash strap down the middle
      cx.fillRect(-0.9, sy, 1.8, hgt2 - 1.7);
      if (c.cat === 'core') {
        cx.globalCompositeOperation = 'lighter';
        cx.fillStyle = 'rgba(255,214,140,0.4)';
        cx.fillRect(-3.4, sy + 0.9, 6.8, 1.7);
        cx.globalCompositeOperation = 'source-over';
      }
    }
    for (let i = 0; i < Math.min(3, tools); i++) {
      const twT = rigT();
      cx.fillStyle = '#12161c';
      cx.fillRect(3.6 * twT, (-10.5 - i * 1.4) * twT - crouch, twT, 5.6 * twT);
      cx.fillStyle = '#7a8a8f';
      cx.fillRect(3.8 * twT, (-10.3 - i * 1.4) * twT - crouch, 0.7 * twT, 5.2 * twT);
    }
    cx.restore();
    // sled
    if (S.gear.sled && S.gear.sledOn) {
      const sx2 = -Math.cos(S.dir) * 22, sy2 = 4 - Math.sin(S.dir) * 6;
      cx.fillStyle = '#12161c'; cx.fillRect(sx2 - 12, sy2 - 4, 24, 9);
      cx.fillStyle = '#4a5a5f'; cx.fillRect(sx2 - 10.5, sy2 - 2.5, 21, 6);
      cx.fillStyle = '#6fe3d2'; cx.fillRect(sx2 - 10.5, sy2 + 2, 21, 1.5);
    }
    // the Walker, drawn like it's 1996 — and dressed by rank: the Order writes itself on the coat
    blitWalker(0, crouch, coatFor(), moving, bobT, S.dir);
    // rim light: at night the lantern writes one warm texel down the coat's lantern side
    if (World.lightAt(x, y) < 0.35 && Economy.dayPhase().nightness >= 0.18) {
      const flr = Math.cos(S.dir) < 0 ? -1 : 1;
      drawRim(0, crouch, moving, bobT, S.dir, flr);
    }
    if (World.lightAt(x, y) < 0.35) {   // the lantern in hand, out where it's needed
      const fl = Math.cos(S.dir) < 0 ? -1 : 1, twL = rigT();
      cx.fillStyle = '#8a7a5a'; cx.fillRect(fl * 4 * twL, -6.5 * twL + crouch, 0.8 * twL, 2.4 * twL);
      cx.fillStyle = '#ffd98f'; cx.fillRect(fl * 4 * twL - 0.6 * twL, -4 * twL + crouch, 1.8 * twL, 1.8 * twL);
    }
    // headlamp glow in dark
    if (World.lightAt(x, y) < 0.3) {
      const big = S.flags.effects.bigLantern ? 2.4 : 1;   // BIGLANTERN: exactly what it says
      cx.globalCompositeOperation = 'lighter';
      glowShells(0, -6 * rigT(), big > 1 ? 22 : 13, `rgba(255,230,180,${big > 1 ? 0.4 : 0.34})`);   // the lamp glints; the GROUND lights (see punchLight)
      cx.globalCompositeOperation = 'source-over';
    }
    cx.restore();
    // brace indicator — four corner brackets holding the walker steady
    if (S.braced && moving) drawBrackets(Math.round(x), Math.round(y - 10), 16, 'rgba(233,226,208,0.5)');
  }

  /* ---------- second wind: ruins, graves, events, companion ---------- */
  /* the stone-wall generator — one variant, in world greys: courses of cut stone,
     a light edge per block, dark mortar, and a crown the years have bitten off.
     baked once per ruin seed, drawn on the texel grid. no curve survives here either. */
  const ruinTexCache = new Map();
  function ruinWallTex(seed) {
    let c = ruinTexCache.get(seed);
    if (c) return c;
    const rg = U.rng(seed + 7);
    c = document.createElement('canvas'); c.width = 52; c.height = 30;
    const g = c.getContext('2d');
    const TON = ['#474e58', '#3d434c', '#343a42'];
    let y = 30;
    const courses = [];
    while (y > 6) { const h = 5 + ((rg() * 2) | 0); courses.push([y - h, h]); y -= h + 1; }
    courses.forEach(([cy, ch], ci) => {
      let x = -((rg() * 6) | 0);
      const crown = ci === courses.length - 1;
      while (x < 52) {
        const w = 7 + ((rg() * 7) | 0);
        if (!(crown && rg() < 0.38)) {                     // the bitten crown: stones simply gone
          const x0 = Math.max(0, x), ww = Math.min(w, 52 - x0);
          g.fillStyle = TON[(rg() * TON.length) | 0]; g.fillRect(x0, cy, ww, ch);
          g.fillStyle = '#565e69'; g.fillRect(x0, cy, ww, 1);
          g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x0, cy + ch - 1, ww, 1);
        }
        x += w + 1;
      }
      g.fillStyle = '#22262c'; g.fillRect(0, cy + ch, 52, 1);
    });
    ruinTexCache.set(seed, c);
    return c;
  }
  function drawWorldExtras(inView, dt) {
    // ruins
    for (const rn of S.ruins || []) {
      if (!inView(rn.x, rn.y, 100)) continue;
      cx.save(); cx.translate(Math.round(rn.x), Math.round(rn.y));
      const a = rn.looted ? 0.55 : 1;
      cx.globalAlpha = a;
      if (rn.type === 'shrine') {
        cx.fillStyle = '#4a4f57';
        cx.fillRect(-14, -6, 6, 22); cx.fillRect(8, -6, 6, 22);
        cx.fillRect(-16, -12, 32, 7);
        cx.fillStyle = '#565e69'; cx.fillRect(-16, -12, 32, 1); cx.fillRect(-14, -6, 6, 1); cx.fillRect(8, -6, 6, 1);
        if (!rn.looted) {
          cx.globalCompositeOperation = 'lighter';
          glowShells(0, 0, 16, 'rgba(140,240,225,0.3)');
          cx.globalCompositeOperation = 'source-over';
        }
      } else {
        pixShadow(0, 13, 46);
        cx.drawImage(ruinWallTex(rn.seed), -26, -17);
        // what fell, lies where it fell
        cx.fillStyle = '#3d434c'; cx.fillRect(-33, 8, 5, 4); cx.fillRect(28, 3, 6, 4);
        cx.fillStyle = '#343a42'; cx.fillRect(30, 10, 4, 3); cx.fillRect(-30, 13, 3, 2);
        if (rn.type === 'caravan') {
          cx.fillStyle = '#4a3d33'; cx.fillRect(-14, 4, 7, 7); cx.fillRect(9, 4, 7, 7);
          cx.fillStyle = '#241708'; cx.fillRect(-12, 6, 3, 3); cx.fillRect(11, 6, 3, 3);
        }
      }
      cx.globalAlpha = 1;
      cx.restore();
      if (cam.z > 0.7 && !rn.looted) plabel(CHAR.RUIN_TYPES[rn.type].name, rn.x, rn.y + 26, 3, '#8d887a');
    }
    // cairns (non-wraith graves) — an authored stack of cut stones, a lamp's worth of memory on top
    for (const g of S.graves || []) {
      if (g.wraith || !inView(g.x, g.y, 80)) continue;
      pixShadow(g.x, g.y + 7, 26);
      blit(CAIRN_ROWS, g.x - 11.25, g.y - 13, 2.5, CAIRN_PAL, false);
      cx.globalCompositeOperation = 'lighter';
      glowShells(g.x, g.y - 14, 10, 'rgba(255,214,150,1)');
      cx.globalCompositeOperation = 'source-over';
      plabel(g.name, g.x, g.y + 20, 3, '#d8c9a0');
    }
    // events on the ground
    const ev = S.event;
    if (ev && inView(ev.x, ev.y, 120)) {
      if (ev.type === 'supplyDrop') {
        pixShadow(ev.x, ev.y + 10, 40);
        blit(SUPPLY_ROWS, ev.x - 24, ev.y - 10, 3, SUPPLY_PAL, false);
        cx.fillStyle = '#8d939c';   // the cord, slack in stepped texels
        for (let i = 0; i < 4; i++) cx.fillRect(Math.round((ev.x + 9 + (i % 2) * 3) / 3) * 3, ev.y - 10 - i * 5, 3, 5);
        const p2 = 0.5 + Math.sin(S.time * 3) * 0.5;
        dotRing(ev.x, ev.y + 2, 22 + p2 * 12, 'rgba(255,201,120,0.6)');
      } else if (ev.type === 'peddler') {
        pixShadow(ev.x, ev.y + 11, 46);
        blit(CART_ROWS, ev.x - 25, ev.y - 15, 2.5, CART_PAL, false);
        cx.globalCompositeOperation = 'lighter';
        glowShells(ev.x + 21, ev.y - 3, 11 + (((S.time * 2) | 0) % 2) * 2, 'rgba(255,214,140,1)');
        cx.globalCompositeOperation = 'source-over';
        plabel('THE PEDDLER', ev.x, ev.y + 26, 3, '#ffe3b0');
      } else if (ev.type.startsWith('rescue') && ev.type !== 'rescueWraith') {
        drawNpcFigure(ev.x, ev.y, ev.data.npc, ev.type === 'rescueInjured' ? 'down' : 'sit');
        const p3 = 0.5 + Math.sin(S.time * 4) * 0.5;
        cx.fillStyle = `rgba(217,107,79,${0.5 + p3 * 0.5})`;
        cx.font = `700 ${16 / cam.z}px Fraunces, serif`; cx.textAlign = 'center';
        plabel('!', ev.x, ev.y - 32, 5, '#ffd98f');
      }
    }
  }
  function drawNpcFigure(x, y, npc, pose = 'stand', dir = 0) {
    const rg = U.rng(npc ? npc.seed : 7);
    const hood = U.pick(rg, CHAR.PORTRAIT.hoods), scarf = U.pick(rg, CHAR.PORTRAIT.scarves);
    cx.save(); cx.translate(x, y);
    pixShadow(0, 4, 15);
    if (pose === 'down') cx.rotate(1.35);
    else if (pose === 'sit') cx.translate(0, 3);
    const pal = { ...PAL_MATE, C: hood, T: scarf };
    blitWalker(0, 0, pal, pose === 'walk', S.time * 9 + (npc ? npc.seed % 7 : 0), dir);
    cx.restore();
  }
  let compPrev = null;
  function drawAboveMist(inView, dt) {
    // companion walks with you, above the mist like you
    const n = NPC.companion();
    if (n && S.compPos) {
      const mvd = compPrev ? Math.abs(S.compPos.x - compPrev.x) + Math.abs(S.compPos.y - compPrev.y) : 0;
      if (compPrev && mvd > 0.4) compPrev.dir = Math.atan2(S.compPos.y - compPrev.y, S.compPos.x - compPrev.x);
      drawNpcFigure(S.compPos.x, S.compPos.y, n, mvd > 0.4 ? 'walk' : 'stand', compPrev ? (compPrev.dir || 0) : 0);
      compPrev = { x: S.compPos.x, y: S.compPos.y, dir: compPrev ? compPrev.dir : 0 };
      if (cam.z > 0.75) plabel(n.name.split(' ')[0], S.compPos.x, S.compPos.y + 13, 3, '#b8b29d');
    }
    // porters the Grey kept — the rig itself in a ghost palette, standing where they fell:
    // they were walkers, so they are drawn as walkers, wearing the checker only as a haze
    for (const g of S.graves || []) {
      if (!g.wraith || !inView(g.x, g.y, 120)) continue;
      g.ph = (g.ph || 0) + dt * 0.5;
      const bob = Math.sin(g.ph) * 2;
      cx.globalCompositeOperation = 'lighter';
      ghostBody(g.x, g.y - 16 + bob, 22, 'rgba(150,160,255,0.4)');
      cx.globalCompositeOperation = 'source-over';
      cx.globalAlpha = 0.85;
      blitWalker(g.x, g.y - 5 + bob, PAL_GHOST, false, 0, 1);
      cx.globalAlpha = 1;
      plabel(g.name, g.x, g.y + 16, 3, '#b4bcff');
    }
  }

  /* ---------- mouse travel: the route underfoot and the spot you clicked ---------- */
  function drawTravel(dt) {
    const m = S.moveTo;
    if (!m || m.steer) return;
    const pulse = (Math.sin(S.time * 5) + 1) / 2;
    cx.save();
    if (m.path) {
      cx.setLineDash([4 / cam.z, 9 / cam.z]);
      cx.lineDashOffset = -S.time * 40;
      cx.strokeStyle = 'rgba(233,226,208,0.45)'; cx.lineWidth = 1.6 / cam.z;
      cx.beginPath(); cx.moveTo(S.px, S.py);
      for (let j = m.i; j < m.path.length; j++) cx.lineTo(m.path[j][0], m.path[j][1]);
      cx.stroke();
      cx.setLineDash([]);
    } else {
      cx.setLineDash([4 / cam.z, 9 / cam.z]); cx.lineDashOffset = -S.time * 40;
      cx.strokeStyle = 'rgba(233,226,208,0.45)'; cx.lineWidth = 1.6 / cam.z;
      cx.beginPath(); cx.moveTo(S.px, S.py); cx.lineTo(m.x, m.y); cx.stroke();
      cx.setLineDash([]);
    }
    const r = (7 + pulse * 4) / cam.z;
    drawBrackets(Math.round(m.x), Math.round(m.y), Math.round(r) + 3, m.act ? 'rgba(255,201,120,0.95)' : 'rgba(233,226,208,0.9)', Math.max(4, 5 / cam.z), Math.max(2, 2 / cam.z));
    cx.fillStyle = m.act ? 'rgba(255,201,120,0.9)' : 'rgba(233,226,208,0.85)';
    { const cs = Math.max(2, Math.round(4 / cam.z)); cx.fillRect(Math.round(m.x - cs / 2), Math.round(m.y - cs / 2), cs, cs); }
    // the string of marks still to walk
    if (S.route && S.route.length) {
      cx.setLineDash([3 / cam.z, 10 / cam.z]);
      cx.strokeStyle = 'rgba(255,201,120,0.4)'; cx.lineWidth = 1.4 / cam.z;
      cx.beginPath(); cx.moveTo(m.x, m.y);
      for (const [rx, ry] of S.route) cx.lineTo(rx, ry);
      cx.stroke(); cx.setLineDash([]);
      let n = 1;
      for (const [rx, ry] of S.route) {
        const ps = Math.max(6, Math.round(9 / cam.z));
        cx.fillStyle = '#17130b'; cx.fillRect(Math.round(rx - ps / 2) - 1, Math.round(ry - ps / 2) - 1, ps + 2, ps + 2);
        cx.fillStyle = 'rgba(255,201,120,0.95)'; cx.fillRect(Math.round(rx - ps / 2), Math.round(ry - ps / 2), ps, ps);
        plabel(String(++n), rx, ry - 3.5, 3, '#0a0e14', { dy: -4, shadow: false });
      }
      cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
    }
    cx.restore();
  }

  /* ---------- the Guide's marker: a beacon on the target, or an arrow at the screen edge ---------- */
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
  const guideBeams = {};
  function guideBeam(color) {
    let c = guideBeams[color]; if (c) return c;
    const W2 = 24, H2 = 192;
    c = document.createElement('canvas'); c.width = W2; c.height = H2;
    const g = c.getContext('2d'); g.fillStyle = hexA(color, 0.7);
    for (let y = 0; y < H2; y += 2) for (let x = 0; x < W2; x += 2) {
      const dx2 = Math.abs(x + 1 - W2 / 2) / (W2 / 2);
      const k = (y / H2) * (dx2 < 0.2 ? 1 : dx2 < 0.55 ? 0.6 : 0.25);      // brightest at the foot
      const cov = k > 0.5 ? 0.8 : k > 0.28 ? 0.45 : k > 0.1 ? 0.18 : 0;
      if (cov && RBAY[(y / 2) & 3][(x / 2) & 3] / 16 < cov) g.fillRect(x, y, 2, 2);
    }
    return guideBeams[color] = c;
  }
  function drawGuide(dt) {
    if (!S || S.cine || S.dead) return;
    const g = Guide.target();
    if (!g) return;
    const pulse = (Math.sin(S.time * 3.2) + 1) / 2;
    const sx = w2sx(g.x), sy = w2sy(g.y);
    const m = 60 * dpr;
    const onScreen = sx > m && sx < cv.width - m && sy > 150 * dpr && sy < cv.height - m;
    cx.save();
    cx.setTransform(1, 0, 0, 1, 0, 0);
    if (onScreen) {
      const near = U.dist(S.px, S.py, g.x, g.y) < 120;
      const r = Math.round((13 + pulse * 9) * dpr);
      drawBrackets(Math.round(sx), Math.round(sy), r, hexA(g.color, near ? 0.55 : 0.95), Math.round(7 * dpr), Math.round(2 * dpr));
      drawBrackets(Math.round(sx), Math.round(sy), Math.round(r * 1.9), hexA(g.color, 0.3), Math.round(5 * dpr), Math.round(2 * dpr));
      // beacon shaft — a dithered column in the mark's own ink, brightest at the ground
      const h = 140 * dpr;
      const bm = guideBeam(g.color);
      cx.globalAlpha = 0.5 + pulse * 0.2;
      cx.imageSmoothingEnabled = false;
      cx.drawImage(bm, Math.round(sx - 6 * dpr), Math.round(sy - h), Math.round(12 * dpr), Math.round(h));
      cx.globalAlpha = 1;
      // label
      cx.font = `700 ${12 * dpr}px Atkinson Hyperlegible, system-ui, sans-serif`;
      cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
      const txt = `${g.label} · ${U.fmtDist(g.dist)}`;
      const tw = cx.measureText(txt).width;
      cx.fillStyle = 'rgba(8,12,18,0.72)';
      cx.fillRect(sx - tw / 2 - 7 * dpr, sy - h - 18 * dpr, tw + 14 * dpr, 18 * dpr);
      cx.fillStyle = g.color;
      cx.fillText(txt, sx, sy - h - 5 * dpr);
    } else {
      const cxs = cv.width / 2, cys = cv.height / 2;
      const a = Math.atan2(sy - cys, sx - cxs);
      const inset = 78 * dpr, hw = cv.width / 2 - inset, hh = cv.height / 2 - inset - 60 * dpr;
      const k = Math.min(hw / Math.max(1e-6, Math.abs(Math.cos(a))), hh / Math.max(1e-6, Math.abs(Math.sin(a))));
      const ex = cxs + Math.cos(a) * k, ey = cys + Math.sin(a) * k;
      cx.translate(ex, ey); cx.rotate(a);
      cx.fillStyle = hexA(g.color, 0.8 + pulse * 0.2);
      cx.beginPath(); cx.moveTo(20 * dpr, 0); cx.lineTo(-10 * dpr, -13 * dpr); cx.lineTo(-3 * dpr, 0); cx.lineTo(-10 * dpr, 13 * dpr); cx.closePath(); cx.fill();
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.font = `700 ${12 * dpr}px Atkinson Hyperlegible, system-ui, sans-serif`;
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      const txt = `${g.label} · ${U.fmtDist(g.dist)}`;
      const tw = cx.measureText(txt).width;
      const lx = ex - Math.cos(a) * 46 * dpr, ly = ey - Math.sin(a) * 46 * dpr;
      cx.fillStyle = 'rgba(8,12,18,0.72)';
      cx.fillRect(lx - tw / 2 - 7 * dpr, ly - 10 * dpr, tw + 14 * dpr, 20 * dpr);
      cx.fillStyle = g.color;
      cx.fillText(txt, lx, ly);
    }
    cx.restore();
  }

  /* ---------- weather fx ---------- */
  function drawRain(dt) {
    const r = Systems.rainAt(cam.x, cam.y);
    if (r <= 0 && !rains.length) return;
    const want = reduced || !fxOn ? 0 : Math.round(r * 130);
    while (rains.length < want) rains.push({ x: cam.x + (Math.random() - 0.5) * (cv.width / cam.z / dpr), y: cam.y + (Math.random() - 0.5) * (cv.height / cam.z / dpr), l: 10 + Math.random() * 14, v: 700 + Math.random() * 300 });
    if (rains.length > want) rains.length = want;
    // greyfall rain: solid falling dashes, the way a cartridge rained
    cx.fillStyle = '#7e93a6';
    for (const p of rains) {
      p.y += p.v * dt; p.x += p.v * 0.12 * dt;
      const vh2 = cv.height / (cam.z * dpr);
      if (p.y > cam.y + vh2 / 2 + 30) { p.y = cam.y - vh2 / 2 - 20; p.x = cam.x + (Math.random() - 0.5) * (cv.width / (cam.z * dpr)); }
      cx.fillRect(p.x - 0.7, p.y - p.l * 0.6, 1.4, p.l * 0.6);
    }
  }
  let wispSprite = null;
  function drawWisps(dt, inView) {
    if (!fxOn) return;
    if (!wispSprite) {
      // mist wisps are dither clouds too — coverage falls off in rings, cells stay square
      wispSprite = document.createElement('canvas'); wispSprite.width = wispSprite.height = 128;
      const g2 = wispSprite.getContext('2d');
      const wid = g2.createImageData(128, 128);
      for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
        const d2 = Math.hypot(x - 64, y - 64) / 64;
        const cov = d2 < 0.35 ? 0.55 : d2 < 0.7 ? 0.3 : d2 < 1 ? 0.12 : 0;
        if (RBAY[(y >> 2) & 3][(x >> 2) & 3] / 16 < cov) {
          const i = (y * 128 + x) * 4;
          wid.data[i] = 150; wid.data[i + 1] = 158; wid.data[i + 2] = 180; wid.data[i + 3] = 255;
        }
      }
      g2.putImageData(wid, 0, 0);
    }
    cx.globalCompositeOperation = 'lighter';
    let drawn = 0;
    for (const w of wisps) {
      w.ph += dt * 0.1;
      w.x += Math.cos(w.ph) * 8 * dt; w.y += Math.sin(w.ph * 0.7) * 5 * dt;
      if (!inView(w.x, w.y, 260)) {
        if (Math.random() < 0.02) {
          w.x = cam.x + (Math.random() - 0.5) * (cv.width / (cam.z * dpr)) * 1.3;
          w.y = cam.y + (Math.random() - 0.5) * (cv.height / (cam.z * dpr)) * 1.3;
        }
        continue;
      }
      if (drawn >= 16) continue;
      const m = World.mistAt(w.x, w.y);
      if (m < 0.22) continue;
      drawn++;
      cx.globalAlpha = 0.16 * m;
      cx.drawImage(wispSprite, w.x - w.r, w.y - w.r, w.r * 2, w.r * 2);
    }
    cx.globalAlpha = 1;
    cx.globalCompositeOperation = 'source-over';
  }
  function drawFx(dt) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.t += dt;
      if (f.type === 'ring') {
        const t = f.t / 0.8;
        if (t >= 1) { fx.splice(i, 1); continue; }
        dotRing(f.x, f.y, t * 60, `rgba(255,214,150,${(1 - t) * 0.9})`);
      } else if (f.type === 'burst') {
        const t = f.t / 0.45;
        if (t >= 1) { fx.splice(i, 1); continue; }
        dotRing(f.x, f.y, 6 + t * 34, `rgba(224,101,74,${(1 - t) * 0.95})`, 7);
      } else if (f.type === 'hop') {
        // a crate leaves the pack: one arc, one thud, and it sits by the door a moment
        const T3 = 0.34, t = Math.min(1, f.t / T3);
        if (f.t >= T3 && !f.dust) { f.dust = true; fx.push({ type: 'ring', x: f.x1, y: f.y1 + 3, t: 0.62 }); }
        if (f.t > 2.2) { fx.splice(i, 1); continue; }
        const x = Math.round(f.x0 + (f.x1 - f.x0) * t);
        const y = Math.round(f.y0 + (f.y1 - f.y0) * t - Math.sin(t * Math.PI) * 18);
        const col = f.cat === 'core' ? '#ffc978' : f.cat === 'lost' ? '#c9975a' : f.cat === 'mat' ? '#8a8676' : '#b3a06a';
        if (f.t > 1.7) cx.globalAlpha = Math.max(0, 1 - (f.t - 1.7) / 0.5);
        cx.fillStyle = '#12161c'; cx.fillRect(x - 5, y - 4, 10, 8);
        cx.fillStyle = col; cx.fillRect(x - 4, y - 3, 8, 6);
        cx.fillStyle = 'rgba(18,22,28,0.75)'; cx.fillRect(x - 1, y - 3, 2, 6);
        cx.globalAlpha = 1;
      } else if (f.type === 'say') {
        f.tick = true;   // advanced here; drawn crisp after the pixel blit
        const t = f.t / 2.4;
        if (t >= 1) { fx.splice(i, 1); continue; }
      }
    }
  }
  /* spoken lines ride above the fat pixels — the voice stays sharp */
  function drawSaysWorld() {
    // spoken lines hang in the world, set in the world's own 3×5 face, fading in hard steps
    for (const f of fx) {
      if (f.type !== 'say') continue;
      const t = f.t / 2.4;
      const a = t < 0.12 ? 1 : Math.ceil(Math.max(0.01, 1 - Math.max(0, (t - 0.55) / 0.45)) * 3) / 3;
      const col = f.color ? `rgb(${f.color})` : '#ffe0aa';
      plabel(f.text, f.x, f.y - t * 26, 3, col, { alpha: a, wrap: 26 });
    }
  }
  /* a line spoken in the world — hangs over someone's head, then lets go */
  function say(x, y, text, color) { fx.push({ type: 'say', x, y: y - 34, text, color, t: 0 }); while (fx.filter(f => f.type === 'say').length > 3) fx.splice(fx.findIndex(f => f.type === 'say'), 1); }
  function burst(x, y) { fx.push({ type: 'burst', x, y, t: 0 }); }
  function drawLikes(dt) {
    for (let i = likes.length - 1; i >= 0; i--) {
      const p = likes[i];
      p.t += dt;
      if (p.t >= p.dur) { likes.splice(i, 1); continue; }
      p.x += p.vx * dt * dpr; p.y += p.vy * dt * dpr; p.vy += 30 * dt;
      const a = 1 - p.t / p.dur;
      cx.fillStyle = `rgba(255,214,150,${a})`;
      cx.font = `${(10 + a * 6) * dpr}px serif`;
      cx.textAlign = 'center';
      cx.fillText('◆', p.x, p.y);
    }
  }

  /* the Dispatch slams a line across the screen — NBA Jam booth, Order stationery */
  function announce(text) {
    const el = document.getElementById('announce');
    if (!el) return;
    el.classList.remove('slam'); void el.offsetWidth;
    el.textContent = text;
    el.classList.add('slam');
  }
  function setFx(on) { fxOn = on; }
  return { frame, shake, flare, buildFx, hopCrate, likeBurst, say, burst, announce, setFx, screenToWorld, get cam() { return cam; }, stockDebug: id => { delete stockCache[id]; return stockRead(id); }, coatPal: () => coatFor(), setZoom(v) { zoomOverride = v || null; if (v) cam.z = v; }, setTitleDrift(on) { titleDrift = !!on; if (on) driftT = Math.random() * 60; }, noteE, eKeyState: () => ({ shown: eKeyShown(), held: eHeld }), effZoom: () => effZ || cam.z * dpr, crtTitle, crtActive: () => !!crtNow || crtQ.length > 0, crtText: () => { const o = crtNow || crtQ[0]; return o ? { big: o.big, small: o.small } : null; }, structDebug: t => { const s = structSprite(t, false, false); return { w: s.width, h: s.height }; },
    darkAt: (wx, wy) => {   // how much darkness layer covers this world point, 0..1 — the punch's own ledger
      if (!nightC) return -1;
      const z2 = (effZ || cam.z * dpr) / PIXK;
      const bx = Math.round(lastWtx + wx * z2), by = Math.round(lastWty + wy * z2);
      if (bx < 0 || by < 0 || bx >= nightC.width || by >= nightC.height) return -1;
      return nightCx.getImageData(bx, by, 1, 1).data[3] / 255;
    } };
})();
