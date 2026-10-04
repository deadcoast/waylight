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
  /* v3.49 THE WHEEL — the camera zooms in whole texel steps (the quantized zoom never lands between pixels): each notch moves
     one level from the base, from half the base out to twice it in */
  let zoomStep = 0;
  /* v3.49 (corrected) — a level is the size of the buffer's pixel block, not a stretch of the world: at every level a sprite
     texel is ONE buffer pixel and a ground texel TWO (ZW0), so the Walker, the houses and the ground keep their proportion,
     and the block (pixk) grows or shrinks a whole screen pixel a notch. A stretch of the world had drawn the sprites at the
     one buffer pixel they cannot go under while the ground halved beneath them — giants on a small valley at the far level. */
  const ZW0 = 1 / 2.5;                                          // buffer px per world unit: one per sprite texel (2.5 wu)
  let pixk = PIXK;                                              // this frame's block
  const baseP = () => Math.max(2, Math.round(1.12 * dpr / ZW0));   // the play camera's level: 3 at one device pixel a pixel
  const zoomRange = () => { const P0 = baseP(); return { min: 2 - P0, max: P0 }; };   // from a block of 2 up to twice the base
  function nudgeZoom(d) { const R = zoomRange(); zoomStep = Math.max(R.min, Math.min(R.max, zoomStep + d)); return zoomStep; }
  const zoomMul = () => (baseP() + zoomStep) / baseP();
  const bufs = {};                                              // a world buffer per block size, sized to the canvas
  function bufFor(P) {
    let b = bufs[P];
    if (!b || b.w !== cv.width || b.h !== cv.height) { const c = document.createElement('canvas'); c.width = Math.ceil(cv.width / P); c.height = Math.ceil(cv.height / P); b = bufs[P] = { c, cx: c.getContext('2d'), w: cv.width, h: cv.height }; }
    return b;
  }
  let titleDrift = false, driftT = 0;   // the title screen tours the valley — YOUR valley, paths and all
  let flareT = 0;
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
    { const b = bufFor(PIXK); worldC = b.c; worldCx = b.cx; pixk = PIXK; }
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
    /* the hand at your shoulder carries a small lamp — v3.46: read from where the back stands (it read n.x, never set on a
       back, so it never lit); the one walking out to settle a score carries theirs too */
    if (typeof NPC !== 'undefined' && NPC.party) NPC.party().forEach((n, i) => { if ((i === 0 || (S.settle && S.settle.npc === n.id)) && n.cx !== undefined && World.lightAt(n.cx, n.cy) < 0.42 && inView(n.cx, n.cy, 80)) out.push({ x: n.cx, y: n.cy - 6, r: 55 }); });
    for (const st of S.structures) {
      if (st.hp <= 0) continue;
      if (st.type === 'generator' && inView(st.x, st.y, 160)) out.push({ x: st.x, y: st.y, r: 120 });
      else if (st.type === 'watchtower' && inView(st.x, st.y, 100)) out.push({ x: st.x, y: st.y - 30, r: 48, a: 0.72 });
    }
    for (const cd of DATA.camps) { const cs = S.camps[cd.id]; if (inView(cd.x, cd.y, 120)) out.push({ x: cd.x, y: cd.y, r: cs.pacified ? 80 : 62 }); }
    /* v3.45 — a lantern kept lit at a stone, and a lit lantern lying on the ground or carried, punch their own holes */
    if (typeof Memorial !== 'undefined' && S.legacy && S.legacy.some(r => r.lit)) for (const f of Memorial.grounds()) { const s3 = Memorial.site(f); if (!s3 || !inView(s3.x, s3.y, 260)) continue; for (const r of Memorial.rows(f)) if (r.lit && r.raised) { const sl = Memorial.slotFor(r.ord, f); out.push({ x: sl.x + 16, y: sl.y + 10, r: 34, a: 0.85 }); } }
    for (const d of S.drops) if (d.item && d.item.defId === 'kinLantern' && d.item.lit && inView(d.x, d.y, 80)) out.push({ x: d.x, y: d.y - 4, r: 30, a: 0.85 });
    if (S.cargo && S.cargo.some(c => c.defId === 'kinLantern' && c.lit)) out.push({ x: S.px - Math.cos(S.dir) * 9, y: S.py - 8, r: 34, a: 0.9 });   // the flame carried
    /* v3.47 — the watch at dark: its fire behind the line, and a lamp in every hand */
    if (typeof Systems !== 'undefined' && Systems.watches) for (const w of Systems.watches()) { if (!w.dark || w.home || !inView(w.x, w.y, 200)) continue; const fp = Systems.watchFire(w); out.push({ x: fp.x, y: fp.y - 4, r: DATA.T.watch.fireR }); for (const n of Systems.watchers(w)) if (n.cx !== undefined && !n.walkHome) out.push({ x: n.cx, y: n.cy - 6, r: 40, a: 0.8 }); }
    /* v3.48 — a camp on the wire: its relay lamp; the kin's day: two candles at the stone */
    for (const id of DATA.stationOrder) { const d = DATA.stations[id], st = S.stations[id]; if (!d.post || !st || !st.connected || st.cut || !inView(d.x, d.y, 160)) continue; const m = postMast(d); out.push({ x: m.x, y: m.y - 50, r: 70, a: 0.9 }); }   // v3.49: a cut mast throws no light
    for (const cd of DATA.camps) { const c3 = S.camps[cd.id]; if (c3 && c3.given && inView(cd.x, cd.y, 160)) out.push({ x: cd.x, y: cd.y - 6, r: DATA.T.given.lightR, a: 0.9 }); }   // v3.49: a given ring's fire, a rest stop's light
    if (typeof Republic !== 'undefined' && Republic.kinDayRows && typeof Memorial !== 'undefined') for (const r of Republic.kinDayRows()) { if (!Republic.kinDayNow(r)) continue; const sl = Republic.kinDaySlot(r); if (sl && inView(sl.x, sl.y, 80)) out.push({ x: sl.x, y: sl.y + 8, r: 36, a: 0.85 }); }
    /* v3.44 — the kin's lanterns, held low in the square and at the field stones */
    if (typeof Republic !== 'undefined' && S.rep && Republic.kinAt) for (const id of DATA.stationOrder) { const k = Republic.kinAt(id); if (!k) continue; const d = DATA.stations[id]; if (!inView(d.x, d.y, 160)) continue; k.spots.slice(0, 2).forEach(sp => out.push({ x: d.x + (sp % 2 ? 58 - 14 : -58 + 14), y: d.y + 90, r: 30, a: 0.8 })); }
    if (S.event && S.event.type === 'peddler' && inView(S.event.x, S.event.y, 100)) out.push({ x: S.event.x + 20, y: S.event.y - 10, r: 62 });
    for (const n of S.nodes) { if (!n.taken && n.type === 'lumen' && inView(n.x, n.y, 70)) { out.push({ x: n.x, y: n.y, r: 34, a: 0.65 }); if (out.length > 13) break; } }
    return out.slice(0, 14);
  }
  function frame(dt) {
    flushAnnounce();   // v3.52: a banner that waited for a paper to close
    /* v3.32 — a registry room owns the whole frame: the world waits at the door */
    if (S.room && typeof REP !== 'undefined' && REP.INTERIORS[S.room.id]) { drawRoom(dt); return; }
    // camera
    let tx = S.px, ty = S.py, tz = zoomOverride || 1.12;
    if (titleDrift) {
      driftT = Math.max(0, driftT + dt);
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
        tz *= zoomMul();   // v3.49: the wheel's level
      }
      if (S.cine) {
        const stD = stations[S.cine.stId];
        tx = stD.x; ty = stD.y; tz = 0.72;
      }
      // v3.23: the micro-cine is ONE slow zoom; the handoff is three CUTS and a super zoom
      if (S.mcine) { tx = S.mcine.x; ty = S.mcine.y; tz = 1.12 + Math.min(1, S.mcine.t / S.mcine.dur) * 0.55; }
      let cut = false;
      if (S.handoff) {
        const h = S.handoff;
        if (h.phase === 0) { tx = (S.px + h.kidX) / 2; ty = (S.py + h.kidY) / 2 - 8; tz = 0.95; }
        else if (h.phase === 1) { tx = h.kidX; ty = h.kidY - 8; tz = 2.1; }
        else { tx = (h.kidTX + S.px) / 2; ty = (h.kidTY + S.py) / 2 - 6; tz = 4.4; }   // THE SUPER ZOOM
        if (h._camPhase !== h.phase) { h._camPhase = h.phase; cam.x = tx; cam.y = ty; cam.z = tz; cut = true; }
      }
      // v3.24: the Cine engine owns the camera outright when a sequence runs — it integrates its
      // own motion (push/dolly/veer/drift), so the frame adopts it wholesale, no second lerp
      if (Cine.active()) {
        const cc = Cine.cam(dt);
        if (cc) { cam.x = cc.x; cam.y = cc.y; cam.z = cc.z; cut = true; }
      }
      const lerpK = S.cine ? 1.6 : S.mcine ? 1.0 : S.handoff ? 0.7 : 3.2;
      if (!cut) {
        cam.x += (tx - cam.x) * Math.min(1, lerpK * dt);
        cam.y += (ty - cam.y) * Math.min(1, lerpK * dt);
        cam.z += (tz - cam.z) * Math.min(1, (S.mcine ? 0.9 : 2) * dt);
      }
    }
    // keep the view inside the world
    {
      const hw = cv.width / (2 * cam.z * dpr), hh = cv.height / (2 * cam.z * dpr);
      cam.x = U.clamp(cam.x, Math.min(hw, DATA.W / 2), Math.max(DATA.W - hw, DATA.W / 2));
      cam.y = U.clamp(cam.y, Math.min(hh, DATA.H / 2), Math.max(DATA.H - hh, DATA.H / 2));
    }
    /* v3.30 — screen shake REMOVED by directive: a per-frame random camera jolt reads as the
       game malfunctioning, not as impact. Impact speaks through sound, stagger, and bursts. */
    const shx = 0, shy = 0;

    // quantized zoom: a terrain texel is always a WHOLE number of buffer pixels, so texel
    // widths never alternate; the transform is snapped so the world scrolls in whole pixels
    const played = !zoomOverride && !S.cine && !S.mcine && !S.handoff && !(typeof Cine !== 'undefined' && Cine.active());
    pixk = played ? Math.max(2, Math.round(cam.z * dpr / ZW0)) : PIXK;   // the play camera: the block from the zoom, the ground and sprites whole and in step
    { const b = bufFor(pixk); worldC = b.c; worldCx = b.cx; }
    const zw = played ? ZW0 : Math.max(1, Math.round(World.TS * cam.z * dpr / PIXK)) / World.TS;
    const z = zw * pixk;
    effZ = z; curZw = zw;
    // the whole world pass draws into the low-res buffer; it lands on screen as fat pixels
    cx = worldCx;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.fillStyle = '#0a0e14';
    cx.fillRect(0, 0, worldC.width, worldC.height);

    // world transform — translation snapped to integer buffer pixels
    const wtx = Math.round(worldC.width / 2 - cam.x * zw + shx / pixk);
    const wty = Math.round(worldC.height / 2 - cam.y * zw + shy / pixk);
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
      nightCx.setTransform(zw, 0, 0, zw, lastWtx, lastWty);   // v3.51: the ground's own whole-pixel origin — the night laid a fraction off it, every texel's edge half dark (partial alpha the law forbids)
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
          } else if (Math.abs(World.lightAt(gx3, gy3) - 0.30) < 0.010) {
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
    drawMemorial(inView); mark('memorial');   // v3.29: the ground that keeps the Order's own
    drawCamps(inView, dt); mark('camps');
    drawCarried(inView, dt); mark('carried');   // v3.46: the truce road's rags, the settled stones, the chief's runner
    drawStations(inView, dt); mark('stations');
    drawRepublic(inView, dt); mark('republic');   // v3.32: shrines, larders, the column, the far shape — over the doors they answer

    mark('overlays');
    drawWisps(dt, inView); mark('wisps');
    // creatures of the mist and the porter ride above it
    drawWire(inView, dt); mark('wire');
    drawWireWords(inView); mark('wirewords');   // v3.46: a word walking the wire
    drawBeams(dt); mark('beams');
    drawAboveMist(inView, dt); mark('abovemist');
    drawGiant(inView); mark('giant');   // v3.32: the far shape stands OVER the mist — drawn late, its world transform restored
    drawMilitia(inView, dt); mark('militia');
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
    drawLeaves(dt, inView); mark('leaves');
    drawPlaceGhost(); mark('ghost');
    drawMythWorld(dt); drawRideWorld(dt); drawRescueWorld(dt); drawLampWorld(dt); mark('myth');
    drawSaysWorld(); mark('says');
    drawRain(dt); mark('rain');
    drawFx(dt); mark('fx');

    // the world lands on screen: nearest-neighbour up, colour punched hot — the nineties were not subtle
    cx = mainCx;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(worldC, 0, 0, worldC.width, worldC.height, 0, 0, worldC.width * pixk, worldC.height * pixk);   // an exact whole-number block — every buffer pixel a clean square
    cx.imageSmoothingEnabled = true;
    drawLabels(z, wtx * pixk, wty * pixk);
    drawEKey(z, wtx * pixk, wty * pixk, dt);

    // screen space (night lives in the world buffer now, as a palette field — no veil here)
    cx.setTransform(1, 0, 0, 1, 0, 0);
    drawHandoffFx(dt);
    drawCineFx(dt);
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
  /* v3.50 THE COURIER SET — the Walker, redrawn at 32×32 by hand: a hooded courier under a pack with the bedroll lashed on
     top, a scarf, a long coat, straps and a chest strap, boots. Three facings (east, and west as its mirror; south toward the
     eye; north away, the pack the whole figure), a breath, four steps on the uneven cadence, the brace, the ride. The rows
     live in the registry (SPRITES.COURIER); the Walker, the hands, the Order's walkers and the ghosts walk on these rows in
     their own colours (v3.51: the raiders, the town's own and the riders on their own figures — SPRITES.FIG). A texel is still one sprite
     texel (rigK), so the courier stands on the same grid as everything else in the valley. */
  const PAL_WALKER = { O: '#12161c', H: '#2c4258', S: '#e0c298', e: '#2a2118', C: '#3d5a74', c: '#2c4258', T: '#c9a05a', t: '#a5824a', B: '#23282f', b: '#171b21' };
  const PAL_MATE = { O: '#12161c', H: '#41522f', S: '#d8b890', e: '#2a2118', C: '#54683f', c: '#41522f', T: '#b8a06a', t: '#94804f', B: '#23282f', b: '#171b21' };
  /* the courier's full palette from the worn letters (O H S e C c T t B b): the shades and lights the rows ask for are
     derived, never stored — so a coat cut at the tailor, a hood, a trim, boots, a ghost's blue all recolour every texel */
  const lightHex = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v + (255 - v) * k))); return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0'); };
  const darkHex = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0'); };
  const mixHex = (h1, h2, k) => { const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16), f = s => Math.round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k); return '#' + ((f(16) << 16) | (f(8) << 8) | f(0)).toString(16).padStart(6, '0'); };
  const courierPalCache = new Map();
  function courierPal(pal) {
    const key = [pal.O, pal.H, pal.S, pal.e, pal.C, pal.c, pal.T, pal.t, pal.B, pal.b].join('');
    let d = courierPalCache.get(key); if (d) return d;
    const t = pal.t || darkHex(pal.T, 0.8), A = mixHex(pal.T, '#8c7c60', 0.5), a = darkHex(A, 0.8);   // the pack's canvas: the trim, muted
    d = { O: pal.O, H: pal.H, h: darkHex(pal.H, 0.72), I: lightHex(pal.H, 0.2), S: pal.S, s: darkHex(pal.S, 0.8), e: pal.e,
      C: pal.C, D: darkHex(pal.C, 0.72), L: lightHex(pal.C, 0.18), c: pal.c || darkHex(pal.C, 0.72),
      T: pal.T, t, A, a, u: darkHex(a, 0.72), Y: lightHex(pal.T, 0.4), B: pal.B, b: pal.b || darkHex(pal.B, 0.7), P: lightHex(pal.B, 0.14), p: lightHex(pal.B, 0.05) };
    courierPalCache.set(key, d); return d;
  }
  const courierCache = new Map();
  function courierSprite(pal, fc, frame, flip) {
    const CO = SPRITES.COURIER, set = CO.frames[fc] || CO.frames.E, rows = set[frame] || set.idle, d = courierPal(pal);
    const key = fc + frame + (flip ? 'f' : '') + '|' + Object.values(d).join('');
    let c = courierCache.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = 32; c.height = 32;
    const g = c.getContext('2d');
    for (let y = 0; y < 32; y++) { const row = rows[y]; for (let i = 0; i < 32; i++) { const ch = row[flip ? 31 - i : i]; if (ch === '.') continue; g.fillStyle = d[ch] || '#f0f'; g.fillRect(i, y, 1, 1); } }
    courierCache.set(key, c); return c;
  }
  /* which way a figure shows: a side view within sixty degrees of level (the stride and the pack read best there), else
     toward the eye walking down the screen, or away walking up it */
  function facingOf(dir) { const c = Math.cos(dir); if (Math.abs(c) >= 0.5) return c < 0 ? 'W' : 'E'; return Math.sin(dir) > 0 ? 'S' : 'N'; }
  const STEPS = ['walk1', 'walk2', 'walk3', 'walk4'];
  function stepOf(phase, cad0) {   // a stride is 2π of phase: the two contacts held longer than the two passings (the uneven cadence); a figure may bring its own (the running kid holds the float)
    const cad = cad0 || SPRITES.CADENCE, tot = cad[0] + cad[1] + cad[2] + cad[3];
    let t = ((((phase / (Math.PI * 2)) % 1) + 1) % 1) * tot, i = 0;
    while (i < 3 && t >= cad[i]) { t -= cad[i]; i++; }
    return STEPS[i];
  }
  const TENT = [
    '.....OO.....',
    '....OrrO....',
    '...OrRRrO...',
    '..OrRDDRrO..',
    '.OrRRDDRRrO.',
    'OrRRRDDRRRrO',
    'OOOOOOOOOOOO'];
  /* v3.34 — a hearth's fire: the camp fire's grammar, twice as wide, three frames */
  const HEARTH_F = [[
    '.....w...w....', '....wY..wY....', '...wYYw.YYw...', '..YYRYYYRYY...', '..RYRRYRRYRw..', '.RRYRRRYRRYR..', '.RRRRRYRRRRR..', 'LlLLlLLLlLLlLL', '.LLlLLLlLLlLL.',
  ], [
    '...w.....w....', '...Yw...wY....', '..wYYw..YYw...', '..YYRYY.RYYw..', '.wRYRRYYRRYR..', '.RRYRRRYRRYRR.', '.RRRRRYRRRRRR.', 'LlLLlLLLlLLlLL', '.LLlLLLlLLlLL.',
  ], [
    '......w..w....', '.....wY.wY....', '....YYw.YYw...', '...YRYYYRYY...', '..RYRRYRRYRw..', '..RRYRRRYRRYR.', '.RRRRRYRRRRRR.', 'LlLLlLLLlLLlLL', '.LLlLLLlLLlLL.',
  ]];
  /* v3.34 — the Flame Keepers' bowl on its plinth, three states as three glyphs (pixel polish on
     the touched source: the v3.32 bowl was sub-texel rects; the registry-shaped glyph reads at a glance) */
  const SHRINE_PAL = { O: '#12161c', B: '#6e7a82', b: '#5a6470', r: '#8d979c', p: '#5a6470', P: '#3a4048', F: '#ffb54f', Y: '#ffb54f', y: '#ffd98f', w: '#fff2d0', c: '#c25038', k: '#2a1a10' };
  const SHRINE = {
    cold: [
      '..........', '..........', '..........', '..........',
      '.OOOOOOOO.', 'OBBBBkkBBO', '.ObbbbbbO.', '...OppO...', '...OppO...', '..OppppO..', '.OPPPPPPO.', 'OOOOOOOOOO'],
    fed: [
      '.....w....', '....OyyO..', '...OYyyYO.', '...OYYYYO.',
      '.OOOFFFFO.', 'OBBBBBBBBO', '.ObbbbbbO.', '...OppO...', '...OppO...', '..OppppO..', '.OPPPPPPO.', 'OOOOOOOOOO'],
    doused: [
      '..........', '..........', '..........', '..........',
      '......OO..', '.....OrBO.', '....OrbbBO', '.c.OppOBBO', 'k..OppOcOO', 'kcOppppOck', 'kOPPPPPPOk', 'OOOOOOOOOO'],
  };
  /* v3.35 — the Hollow Fires' larder (the wrong fire with its green heart, the rack, what hangs drawn SMALL and unclear —
     mercy in texels). The Reapers' hooded figure lives in the registry now (SPRITES.FIG.reaper, v3.51: three facings, the
     hem's sway, the aim) */
  const LARDER_PAL = { O: '#12161c', R: '#c25038', r: '#8a3a2a', G: '#8fb08a', g: '#5a7a58', W: '#4a3320', w: '#2e1c0c', S: '#8d979c', k: '#23282f' };
  const LARDER = [[
    '.......G........', '......OGO..WW...', '.....ORGRO.WW...', '....ORrRrRO.WWWW', '....ORRGRRO.SWS.', '.....ORrRO..SWS.', '...OOORRROOOWWWW', '..OkkkkkkkkO.W..', '.OkkkkkkkkkkO.W.', 'OOOOOOOOOOOOOOOO',
  ], [
    '......G.........', '.....OGO...WW...', '.....ORGO..WW...', '....ORrRRO..WWWW', '....ORRGRRO.SWS.', '....ORrRrRO.SWS.', '...OOORRROOOWWWW', '..OkkkkkkkkO.W..', '.OkkkkkkkkkkO.W.', 'OOOOOOOOOOOOOOOO',
  ], [
    '........G.......', '......OGGO.WW...', '.....ORGRO.WW...', '.....ORrRO..WWWW', '....ORRGRRO.SWS.', '....ORrRrRO.SWS.', '...OOORRROOOWWWW', '..OkkkkkkkkO.W..', '.OkkkkkkkkkkO.W.', 'OOOOOOOOOOOOOOOO',
  ]];
  /* v3.34 — the Unlit's shutter on its pole: flown whole beside a rebel door, HALF beside a courted one */
  const SHUTTER_PAL = { O: '#12161c', e: '#e0a05e', s: '#642a2a', d: '#1a1206', Y: '#4a3320' };
  const SHUTTER = {
    flown: ['OOOOOOO.', 'OeeeeeO.', 'OsssssO.', 'OsdddsO.', 'OsssssO.', 'OOOOOOO.', '...Y....', '...Y....', '...Y....', '...Y....', '...Y....', '...Y....', '...Y....', '...Y....'],
    half:  ['...Y....', '...Y....', '...Y....', '...Y....', '...Y....', '...Y....', '..OOOOO.', '..OeeeO.', '..OsdsO.', '..OOOOO.', '...Y....', '...Y....', '...Y....', '...Y....'],
  };
  /* v3.34 — the Reapers' stake: a hood on a pole where a harvested runner stood */
  const STAKE_PAL = { O: '#12161c', h: '#232840', L: '#9aa4ff', Y: '#2a3048' };
  const STAKE = ['.OOOO.', 'OhhhhO', 'OhhhhO', 'OhLLhO', '.OhhO.', '..YY..', '..YY..', '..YY..', '..YY..', '..YY..', '..YY..', '..YY..'];
  /* v3.34 — the watchpost's own glyphs: Farkeep's grey pennant on its pole, the salvage crates */
  const PENNANT = [
    'YWGGGGG.',
    'YGGGGGGG',
    'YGggggG.',
    'YGGGGG..',
    'YGGGG...',
    'Y.......', 'Y.......', 'Y.......', 'Y.......', 'Y.......', 'Y.......', 'Y.......', 'Y.......', 'Y.......'];
  const PENNANT_PAL = { Y: '#4a3320', G: '#8d979c', g: '#5a6a7a', W: '#b8c2c8' };
  /* v3.40 — the Society's stencil: concrete-grey slab on a post, the raised tongue in the bunker's leaf-green */
  const STENCIL = [
    'CCCCCCCC',
    'CcccccCC',
    'CcGGGGcC',
    'CccGGccC',
    'CccGGccC',
    'CcccccCC',
    'CCCCCCCC',
    '...YY...', '...YY...', '...YY...', '...YY...', '...YY...'];
  const STENCIL_PAL = { C: '#3a4048', c: '#6e747c', G: '#8fb08a', Y: '#4a3320', L: '#8a6534', D: '#ffd98f' };
  /* v3.41 — the stencil of a count BOUGHT: the tongue over the Order's lamp (L the housing, D the flame) */
  const STENCIL_SOLD = [
    'CCCCCCCC',
    'CcccccCC',
    'CcGGGGcC',
    'CccGGccC',
    'CcccccCC',
    'CccLLccC',
    'CcLDDLcC',
    'CccLLccC',
    'CCCCCCCC',
    '...YY...', '...YY...', '...YY...', '...YY...', '...YY...'];
  /* v3.39 — the pennant FALLEN: the pole across the ground, the grey cloth flat at its end */
  const FALLEN = [
    '..............GGg',
    'YYYYYYYYYYYYYYGGGg',
    '..............GgGG',
    '...............GG.'];
  const CRATES = [
    '..OOOOOO..',
    '..OGGGGO..',
    '..OGwGGO..',
    'OOOGGGGOOO',
    'OGGGGOGGGO',
    'OGwGGOGwGO',
    'OGGGGOGGGO',
    'OOOOOOOOOO'];
  const CRATES_PAL = { O: '#12161c', G: '#6e747c', w: '#b8c2c8' };
  /* v3.37 — a presser's MARK: the Order's own small gold flag on a pole, one per clicked point */
  const MARK = [
    'OY......',
    'OYOOOOO.',
    'OYGgGGO.',
    'OYGGgGGO',
    'OYGGGGO.',
    'OYOOOO..',
    'OY......', 'OY......', 'OY......', 'OY......', 'OY......', 'OY......'];
  const MARK_PAL = { O: '#12161c', Y: '#4a3320', G: '#c9a05a', g: '#ffd98f' };
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
    /* v3.33: the key hashes EVERY row — frames of one figure share a top row, and a first-row key
       collided them into one cached frame (a latent bug the walk cycles would have exposed) */
    const key = rows.join('') + '|' + Object.values(pal).join('') + (flip ? 'f' : '');
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
  /* a walker on their feet: the courier's frame by stride and facing; feet land on (x, y+5). The figure scales with the
     world in whole-pixel steps, so it stays crisp at every zoom and what it carries stays on the same texels. */
  function rigK() { return Math.max(1, Math.round(curZw * 2.5)); }        // buffer px per sprite texel
  function rigT() { return rigK() / curZw; }                              // world units per sprite texel
  function blitCourier(sp, x, y) {
    const k2 = rigK(), m = cx.getTransform();
    if (Math.abs(m.b) > 0.001) { const tw = k2 / curZw; cx.drawImage(sp, x - 16 * tw, y + 5 - 32 * tw, 32 * tw, 32 * tw); return; }
    const bx = Math.round(x * m.a + m.e) - 16 * k2, by = Math.round((y + 5) * m.d + m.f) - 32 * k2;
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(sp, bx, by, 32 * k2, 32 * k2);
    cx.restore();
  }
  function blitFigure(sp, w, h, x, y, ax) {   // any standing figure's rows on the one law: its grid's bottom edge on y+5, its foot column on x, whole texels
    const a = ax === undefined ? (w >> 1) : ax, k2 = rigK(), m = cx.getTransform();
    if (Math.abs(m.b) > 0.001) { const tw = k2 / curZw; cx.drawImage(sp, x - a * tw, y + 5 - h * tw, w * tw, h * tw); return; }
    const bx = Math.round(x * m.a + m.e) - a * k2, by = Math.round((y + 5) * m.d + m.f) - h * k2;
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = false; cx.drawImage(sp, bx, by, w * k2, h * k2); cx.restore();
  }
  /* opt: { fc } a facing to hold (a figure standing still keeps the way it last walked), { frame } a frame to show (the
     brace, the ride). Returns what was drawn, so what the figure carries lands on the same frame. The idle breathes on an
     UNEVEN cadence (hold 2.0 s, breath 0.4 s) — weight lives in timing. */
  function walkerFrame(moving, phase, dir, opt) {   // the frame blitWalker will draw, known before it draws (what rides behind the courier goes first)
    const fc0 = (opt && opt.fc) || facingOf(dir), flip = fc0 === 'W', fc = flip ? 'E' : fc0;
    let frame = (opt && opt.frame) || (moving ? stepOf(phase) : ((S && S.time % 2.4) > 2.0 ? 'idle2' : 'idle'));
    if (!SPRITES.COURIER.frames[fc][frame]) frame = 'idle';
    return { fc, flip, frame };
  }
  function blitWalker(x, y, pal, moving, phase, dir, opt) {
    const d = walkerFrame(moving, phase, dir, opt);
    blitCourier(courierSprite(pal, d.fc, d.frame, d.flip), x, y);
    return d;
  }
  /* v3.40 — a walker DOWN: the courier's side view turned a quarter, lying where it fell, head the way it was facing. A
     quarter turn keeps every texel a texel (each source pixel lands on one k×k block). Under a rotated context it stands. */
  function blitWalkerDown(x, y, pal, dir) {
    const flip = Math.cos(dir) < 0;
    blitSpriteDown(courierSprite(pal, 'E', 'idle', flip), 32, 32, x, y, flip);
  }
  function blitSpriteDown(sp, w, h, x, y, flip) {
    const k2 = rigK(), m = cx.getTransform();
    if (Math.abs(m.b) > 0.001) { const tw = k2 / curZw; cx.drawImage(sp, x - (w / 2) * tw, y + 5 - h * tw, w * tw, h * tw); return; }
    const bx = Math.round(x * m.a + m.e), by = Math.round((y + 5) * m.d + m.f);
    cx.save(); cx.setTransform(1, 0, 0, 1, bx + (flip ? h / 2 : -h / 2) * k2, by - 4 * k2);
    cx.rotate(flip ? -Math.PI / 2 : Math.PI / 2);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(sp, -(w / 2) * k2, -h * k2, w * k2, h * k2);
    cx.restore();
  }
  /* =============== v3.51 THE CAST — one engine for every figure that is not the courier ===============
     SPRITES.FIG holds the people (the camps' own, the town's own, the wanderer), the Farkeepers, the set pieces' figures
     and the kid, each drawn by hand on its own grid in three facings with the breath and four steps. The facing and the
     step come from the direction and the stride's phase exactly as the courier's do (facingOf, stepOf — a figure with its
     own cadence, the running kid, walks on it); standing, it breathes on the courier's uneven cadence; its grid's bottom
     edge stands on y+5 and its foot column on x, so a Farkeeper a head taller stands on the same ground. Its colours are
     its own: derive builds the shades from the worn letters with the courier's own derivation, so a seeded kid or a
     ghost recolours it through opt.pal. What was drawn is returned, so what a figure holds lands on the same frame. */
  const figCache = new Map();
  function figPal(F, over) {
    const p = over ? { ...F.pal, ...over } : F.pal;
    return F.derive ? { ...p, ...courierPal(p) } : p;
  }
  function figSprite(name, fc, frame, flip, over) {
    const F = SPRITES.FIG[name], rows = F.frames[fc][frame] || F.frames[fc].idle, pal = figPal(F, over);
    const key = name + fc + frame + (flip ? 'f' : '') + (over ? '|' + Object.values(pal).join('') : '');
    let c = figCache.get(key); if (c) return c;
    c = document.createElement('canvas'); c.width = F.w; c.height = F.h;
    const g = c.getContext('2d');
    for (let y = 0; y < F.h; y++) { const row = rows[y]; for (let i = 0; i < F.w; i++) { const ch = row[flip ? F.w - 1 - i : i]; if (ch === '.') continue; g.fillStyle = pal[ch] || '#f0f'; g.fillRect(i, y, 1, 1); } }
    figCache.set(key, c); return c;
  }
  /* the frame for this moment: opt.frame when the part asks one (the ride, the aim, the wave, the letter held high), a
     step while it moves, the breath while it stands; opt.fc holds a facing */
  function figDrawn(name, moving, phase, dir, opt = {}) {
    const F = SPRITES.FIG[name]; if (!F) return null;
    const fc0 = opt.fc || facingOf(dir), want = fc0 === 'W' ? 'E' : fc0, fc = F.frames[want] ? want : F.frames.S ? 'S' : 'E';
    let frame = opt.frame || (moving ? stepOf(phase, F.cadence) : ((S && S.time % 2.4) > 2.0 ? 'idle2' : 'idle'));
    if (!F.frames[fc][frame]) frame = 'idle';
    return { name, F, fc, flip: fc0 === 'W' && fc === 'E', frame, dy: (F.dy && F.dy[fc] && F.dy[fc][frame]) || 0 };
  }
  function blitFig(x, y, name, moving, phase, dir, opt = {}) {
    const d = figDrawn(name, moving, phase, dir, opt); if (!d) return null;
    blitFigure(figSprite(name, d.fc, d.frame, d.flip, opt.pal), d.F.w, d.F.h, x, y, d.flip ? d.F.w - d.F.ax : d.F.ax);
    return d;
  }
  /* a figure DOWN: its side view turned a quarter where it fell — every texel stays a texel (the courier's law) */
  function blitFigDown(x, y, name, dir, over) {
    const F = SPRITES.FIG[name]; if (!F) return false;
    const flip = Math.cos(dir) < 0;
    blitSpriteDown(figSprite(name, F.frames.E ? 'E' : 'S', 'idle', flip, over), F.w, F.h, x, y, flip);
    return true;
  }
  /* a point on a drawn figure's own grid (texel column c, row r, fractions allowed) in the current frame of reference:
     where what it holds lands, whatever its scale, mirrored with it */
  function figAt(d, x, y, c, r) {
    const F = d.F, k2 = rigK(), m = cx.getTransform(), ax = d.flip ? F.w - F.ax : F.ax, cc = d.flip ? F.w - 1 - c : c;
    if (Math.abs(m.b) > 0.001) { const tw = k2 / curZw; return { x: x + (cc - ax) * tw, y: y + 5 + (r - F.h) * tw }; }
    const bx = Math.round(x * m.a + m.e) - ax * k2, by = Math.round((y + 5) * m.d + m.f) - F.h * k2;
    return { x: (bx + cc * k2 - m.e) / m.a, y: (by + r * k2 - m.f) / m.d };
  }
  /* cells on a drawn figure's grid (texels [c, r, colour]), stamped with its snap and mirrored with it */
  function figStamp(d, x, y, cells, op) {
    const F = d.F, k2 = rigK(), m = cx.getTransform(), ax = d.flip ? F.w - F.ax : F.ax;
    if (Math.abs(m.b) > 0.001) return;
    const bx = Math.round(x * m.a + m.e) - ax * k2, by = Math.round((y + 5) * m.d + m.f) - F.h * k2;
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); if (op) cx.globalCompositeOperation = op;
    for (const [c, r, col] of cells) { cx.fillStyle = col; cx.fillRect(bx + (d.flip ? F.w - 1 - c : c) * k2, by + r * k2, k2, k2); }
    cx.restore();
  }
  /* a rider on a mount: the rider's seat texel (the courier's [16, 27], a figure's own seat) lands on the saddle's seat
     texel, whichever way they face — the origin to stand the rider's frame on */
  const COURIER_SEAT = [16, 27];
  function seatOrigin(seat, w, h, ax, seatTx, flip) {
    return { x: seat.rx - ((flip ? w - 1 - seatTx[0] : seatTx[0]) - (flip ? w - ax : ax)) * seat.tw, y: seat.ry - 3 * seat.tw + (h - seatTx[1]) * seat.tw };
  }
  /* a Farkeeper rider on the mountain's own Fjord, hooded — the militia and the rescue: the recon rider's own ride frame */
  function drawRider(x, y, moving, tSec, flip) {
    const seat = drawMount(x, y + 5, 'fjord', moving, tSec, flip);
    if (!seat) return;                                   // the authored fallback carried its own rider
    const F = SPRITES.FIG.recon_rider, o = seatOrigin(seat, F.w, F.h, F.ax, F.seat, flip);
    blitFig(o.x, o.y, 'recon_rider', false, 0, flip ? Math.PI : 0, { fc: flip ? 'W' : 'E', frame: 'ride' });
  }
  function drawMount(x, y, breed, moving, tSec, flip, opts = {}) {
    const H = (typeof SPRITES !== 'undefined') && SPRITES.HORSES[breed];
    const m = cx.getTransform();
    if (!H) {   // the authored fallback: rider baked in unless the caller composes their own (bare)
      const hf = moving ? ((tSec * 11) | 0) % 2 : 0;
      blit(opts.bare ? horseMRows()[hf] : HORSE_F[hf], x - 27.5, y - 31, 2.5, opts.bare ? HORSE_M_PAL : HORSE_PAL, flip);
      return opts.bare ? { rx: x, ry: y - 17, tw: 1 / Math.max(0.0001, Math.abs(m.a)), fallback: true } : null;
    }
    const tx = 2.5;
    const k = Math.max(1, Math.round(tx * curZw)), tw = k / Math.max(0.0001, Math.abs(m.a));   // one texel, in the caller's local units
    let rows = H.frames.idle;
    if (moving && H.frames.walk.length) {
      const cad = SPRITES.CADENCE, total = cad.reduce((a, b) => a + b, 0);
      let t = ((tSec % total) + total) % total, i = 0;
      while (i < cad.length - 1 && t >= cad[i]) { t -= cad[i]; i++; }
      rows = H.frames.walk[i % H.frames.walk.length];
    }
    const gx = flip ? (H.w - 1 - H.ground.x) : H.ground.x;
    blit(rows, x - gx * tw, y - H.ground.y * tw, tx, H.pal, flip);
    /* the rider's origin: a walker draws its feet at origin+5, so the origin sits so the feet hang
       three texels below the back line — straddling, not standing on the saddle */
    return { rx: x + (H.seat.x - H.ground.x) * (flip ? -1 : 1) * tw, ry: y - (H.ground.y - H.seat.y) * tw + 3 * tw - 5, tw };
  }
  /* rim light — the source writes itself on the sprite (Octopath's trick, one texel wide). v3.50: the courier's outline
     is closed (the outline law), so the lamp's side keeps its dark edge and the warm light lies on the first coloured
     texel inside it, on every run of the silhouette (the front leg and the back) — painted on the outline itself, the
     rim read as a staff held down the coat's front. The cells are in screen order (mirrored with the figure). */
  function rimCells(fc, frame, flip, side) {
    const rows = SPRITES.COURIER.frames[fc][frame] || SPRITES.COURIER.frames[fc].idle;
    const at = (xx, yy) => (yy < 0 || yy >= 32 || xx < 0 || xx >= 32) ? '.' : rows[yy][flip ? 31 - xx : xx];
    const out = [];
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const k = at(x, y);
      if (k === '.' || k === 'O') continue;
      const a = at(x + side, y), b = at(x + 2 * side, y), d = at(x + 3 * side, y);
      if (a === '.' || (a === 'O' && (b === '.' || (b === 'O' && d === '.')))) out.push([x, y]);
    }
    return out;
  }
  const rimCache = {};
  function rimSprite(fc, frame, flip, side) {
    const key = fc + frame + (flip ? 'F' : '') + side;
    let c = rimCache[key];
    if (c) return c;
    c = document.createElement('canvas'); c.width = 32; c.height = 32;
    const g = c.getContext('2d'); g.fillStyle = '#ffd98f';
    for (const [x, y] of rimCells(fc, frame, flip, side)) g.fillRect(x, y, 1, 1);
    return rimCache[key] = c;
  }
  function drawRim(x, y, drawn, side) {
    cx.globalAlpha = 0.55;
    blitCourier(rimSprite(drawn.fc, drawn.frame, drawn.flip, side), x, y);
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
  function pixShadow(x, y, w) {   // v3.51: on the texel grid — two slabs a whole texel tall and whole texels wide (their edges fell between the pixels)
    const m = cx.getTransform();
    cx.fillStyle = 'rgba(0,0,0,0.30)';
    if (Math.abs(m.b) > 0.001) { cx.fillRect(x - w / 2, y - 1.5, w, 3); cx.fillRect(x - w * 0.32, y + 1.5, w * 0.64, 2); return; }
    const k2 = rigK(), tw = Math.max(1, Math.round(w * m.a / k2)), t2 = Math.max(1, Math.round(tw * 0.64));
    const bx = Math.round(x * m.a + m.e), by = Math.round((y - 1.5) * m.d + m.f);
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.fillRect(bx - ((tw * k2) >> 1), by, tw * k2, k2);
    cx.fillRect(bx - ((t2 * k2) >> 1), by + k2, t2 * k2, k2);
    cx.restore();
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
      const k = (ty + 1) / TH2;                     // 1 at the bottom — the flame end (v3.51: it ran 1 at the TOP — the shaft stood on its head, widest and dimmest at the cage)
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
    I: '72227', J: '11152', K: '56465', L: '44447', N: '65555', O: '25552', P: '65644',
    Q: '25521', R: '65665', S: '34216', T: '72222', U: '55557', V: '55552', X: '55255',   /* M and W: the wide face below */
    Y: '55222', Z: '71247',
    0: '35556', 1: '26227', 2: '61247', 3: '61216', 4: '55711', 5: '74616', 6: '34652', 7: '71122',
    8: '25252', 9: '25316',
    '.': '00002', ',': '00024', '!': '22202', '?': '61202', '-': '00700', '+': '02720',
    "'": '22000', '·': '00200', ':': '02020', '/': '11244', '%': '51245', '◆': '27772', '★': '27772',
    ' ': '00000',
  };
  /* v3.48 — M and W are five texels wide: three wide, each read as an H ("SETTLED THICE", "HOHE"). The wide glyphs carry
     their own rows and advance six; every other glyph keeps the 3×5 cell and advances four. */
  const PFW = { M: ['10001', '11011', '10101', '10001', '10001'], W: ['10001', '10001', '10101', '11011', '10001'] };
  const pnorm = str => String(str).toUpperCase().replace(/["“”]/g, "'").replace(/[—–]/g, '-');
  const padv = ch => PFW[ch] ? 6 : 4;
  function ptextW(str, tx) { const s2 = pnorm(str); let n = 0; for (let i = 0; i < s2.length; i++) n += padv(s2[i]); return n * tx - tx; }
  function ptext(str, x, y, tx, color, align = 'center', shadow = true) {
    str = pnorm(str);
    const w = ptextW(str, tx);
    let sx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    sx = Math.round(sx / tx) * tx; const sy = Math.round(y / tx) * tx;
    for (let pass = shadow ? 0 : 1; pass < 2; pass++) {
      cx.fillStyle = pass === 0 ? '#0c1016' : color;
      let col = 0;
      for (let i = 0; i < str.length; i++) {
        const ch = str[i], wide = PFW[ch];
        /* v3.49 — the dark pass is a whole outline and the shadow under it: each lit texel stamps a 4×4 block from one texel up
           and left — the words read on the golden shore, on snow, on any ground */
        const put = pass === 0 ? (x2, y2) => cx.fillRect(x2 - tx, y2 - tx, tx * 4 + 0.05, tx * 4 + 0.05) : (x2, y2) => cx.fillRect(x2, y2, tx + 0.05, tx + 0.05);
        if (wide) {
          for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (wide[r][c] === '1') put(sx + (col + c) * tx, sy + r * tx);
        } else {
          const g = PF[ch] || PF['·'];
          for (let r = 0; r < 5; r++) {
            const d = +g[r];
            if (!d) continue;
            for (let c = 0; c < 3; c++) if (d & (4 >> c)) put(sx + (col + c) * tx, sy + r * tx);
          }
        }
        col += padv(ch);
      }
    }
    return w;
  }
  function ptextLines(str, x, y, tx, color, maxChars = 24, up = false) {
    const words = String(str).split(' '); const lines = ['']; let li = 0;
    for (const wd of words) {
      if (lines[li].length && lines[li].length + wd.length + 1 > maxChars) { lines.push(''); li++; }
      lines[li] += (lines[li] ? ' ' : '') + wd;
    }
    const y0 = up ? y - (lines.length - 1) * 7 * tx : y;   // v3.46: a spoken line climbs — the last row sits where a one-row line would
    lines.forEach((ln, i2) => ptext(ln, x, y0 + i2 * 7 * tx, tx, color));
    return lines.length;
  }
  /* labels never scale with the camera and never land between pixels: world draws queue them,
     and after the blit they render in SCREEN space at integer texels — the cartridge way */
  const labelQ = [];
  function plabel(str, wx, wy, k, color, opts = {}) { const L = { str, wx, wy, k, color, dy: opts.dy || 0, alpha: opts.alpha, wrap: opts.wrap, shadow: opts.shadow !== false }; if (opts.first) labelQ.unshift(L); else labelQ.push(L); }   // v3.46: a standing order's words hold their place first
  function drawLabels(z, ox, oy) {
    /* v3.45 — a label never lands on a label: one that would is stepped down a row (up to three) — a line of names at
       the ring's edge reads as names, not one long word. Earlier labels hold their place. */
    const taken = [];
    for (const L of labelQ) {
      const t = Math.max(2, Math.round(L.k * dpr));
      const sx = Math.round((L.wx * z + ox) / t) * t;
      let sy = Math.round((L.wy * z + oy + (L.dy || 0) * dpr) / t) * t;
      if (!L.wrap) {
        const w = ptextW(String(L.str), t), h = 6 * t, x0 = sx - w / 2 - t, x1 = sx + w / 2 + t;
        for (let k2 = 0; k2 < 3 && taken.some(r => x0 < r[2] && x1 > r[0] && sy < r[3] && sy + h > r[1]); k2++) sy += h + t;
        taken.push([x0, sy, x1, sy + h, String(L.str)]);
      }
      if (L.alpha !== undefined) cx.globalAlpha = L.alpha;
      if (L.wrap) ptextLines(L.str, sx, sy, t, L.color, L.wrap, true);
      else ptext(L.str, sx, sy, t, L.color, 'center', L.shadow);
      cx.globalAlpha = 1;
    }
    labelQ.length = 0;
    lastLabels = taken;
  }
  let lastLabels = [];

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
  /* v3.48 THE CAMP ON THE WIRE — the door is the knives' board beside their fire, the relay mast lashed behind it with the
     lamp in its cage: lit once the wire reaches it (the corona, the camp's light), dark in the moment before. The camp itself
     (tents, fire, the chief keeping the door, the knives at home) is drawCamps' — this is the door and the mast. */
  const postMast = d => ({ x: d.x + DATA.T.post.mast[0], y: d.y + DATA.T.post.mast[1] });   // v3.49: the one offset the splice is made at
  function drawPost(d, st) {
    if (typeof SPRITES === 'undefined') return;
    const cd = DATA.camps.find(c => c.id === d.camp), wd = cd && S.camps[cd.id] && S.camps[cd.id].wired;
    const cut = !!(st.cut || (wd && wd.cut)), sp = wd && wd.splicing, lit = st.connected && st.litT > 0.02 && !cut, m = postMast(d);
    pixShadow(m.x, m.y + 2, 16);
    /* v3.49 THE WIRE CUT — the legs stand, the pole snapped in splinters, the top in the dirt beside it; the live end sparks
       now and then; the board boarded up with the camp's red rag at the cross */
    if (cut) blit(SPRITES.RELAY_MAST_CUT, m.x - 11.25, m.y - 58, 2.5, SPRITES.RELAY_PAL, false);
    else blit(lit ? SPRITES.RELAY_MAST.lit : SPRITES.RELAY_MAST.dark, m.x - 11.25, m.y - 58, 2.5, SPRITES.RELAY_PAL, false);
    if (lit) { cx.globalCompositeOperation = 'lighter'; glowShells(m.x, m.y - 53, 12 * st.litT + (((S.time * 5) | 0) % 2), 'rgba(255,214,140,0.9)'); cx.globalCompositeOperation = 'source-over'; }
    if (cut) {
      const stump = { x: m.x - 1.25, y: m.y - 40 };   // the splintered top of the pole, where the wire hangs from
      cx.fillStyle = '#5a626c'; for (let k = 0; k < 4; k++) cx.fillRect(Math.round((stump.x + 2.5 + k * 2.5) / 2.5) * 2.5, Math.round((stump.y + 2.5 + k * 3.75) / 2.5) * 2.5, 2.5, 2.5);   // the wire, hanging
      const ph = sp ? ((S.time * 12) | 0) % 3 : (S.time % 3.2 < 0.45 ? ((S.time * 10) | 0) % 3 : -1);   // the live end sparks now and then; the splice sparks throughout
      if (ph >= 0) { const sx = sp ? stump.x - 6.25 : stump.x + 5, sy = sp ? stump.y - 6.25 : stump.y + 7.5; cx.globalCompositeOperation = 'lighter'; glowShells(sx + 6.25, sy + 6.25, 9, 'rgba(255,214,140,0.8)'); cx.globalCompositeOperation = 'source-over'; blit(SPRITES.SPARK_F[ph], sx, sy, 2.5, SPRITES.SPARK_PAL, false); }
    }
    pixShadow(d.x, d.y + 2, 18);
    blit(cut ? SPRITES.CAMP_BOARD_SHUT : SPRITES.CAMP_BOARD, d.x - 15, d.y - 25, 2.5, SPRITES.RELAY_PAL, false);
    plabel(d.name, d.x, d.y + 30, 4, lit ? '#ffe3b0' : '#969ba5');
    if (st.stars) plabel('◆'.repeat(st.stars), d.x, d.y + 30, 3, '#ffc978', { dy: 24 });
    if (cut && cam.z > 0.7 && U.dist(S.px, S.py, d.x, d.y) < 520) plabel(sp ? 'SPLICING THE WIRE' : 'THE WIRE CUT — THE BOARD SHUT', m.x, m.y + 18, 3, sp ? '#ffd98f' : '#e0654a', { first: true });
    /* the raider in the storm: in from his camp's side, the cut (sparks at the pole), and gone at a run */
    const sc = wd && wd.cutting;
    if (sc && typeof Republic !== 'undefined') {
      const C = DATA.T.cut, stand = { x: m.x + 14, y: m.y + 4 };
      const f = sc.t < C.walk ? sc.t / C.walk : sc.t < C.walk + C.cut ? 1 : Math.max(0, 1 - (sc.t - C.walk - C.cut) / C.back);
      const kx = sc.x0 + (stand.x - sc.x0) * f, ky = sc.y0 + (stand.y - sc.y0) * f, mv = sc.t < C.walk || sc.t >= C.walk + C.cut;
      const dir = sc.t < C.walk + C.cut ? Math.atan2(stand.y - sc.y0, stand.x - sc.x0) : Math.atan2(sc.y0 - stand.y, sc.x0 - stand.x);
      pixShadow(kx, ky + 6, 13);
      blitFig(kx, ky, 'knife', mv, S.time * 14, dir);
      if (sc.t >= C.walk && sc.t < C.walk + C.cut) { const ph2 = ((S.time * 12) | 0) % 3; cx.globalCompositeOperation = 'lighter'; glowShells(m.x, m.y - 38, 10, 'rgba(255,214,140,0.9)'); cx.globalCompositeOperation = 'source-over'; blit(SPRITES.SPARK_F[ph2], m.x - 6.25, m.y - 44, 2.5, SPRITES.SPARK_PAL, false); }
      if (cam.z > 0.7 && U.dist(S.px, S.py, m.x, m.y) < 620) plabel('A RAIDER AT THE MAST', kx, ky + 16, 3, '#e0654a', { first: true });
    }
  }
  function drawStations(inView, dt) {
    for (const id of stationOrder) {
      const d = stations[id], st = S.stations[id];
      if (!inView(d.x, d.y, 700)) continue;
      if (d.post) { drawPost(d, st); continue; }   // v3.48: a camp on the wire — the knives' board and the relay mast, not a longhouse
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
    return wireRoutes[key] = { pts, len: U.polyLen(pts) };   // v3.46: the util walks [x, y] pairs — as objects the length came back NaN and no caravan ever drew
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
      for (let k = 0; k < 4; k++) {
        const d2 = Math.max(0, p.t * 300 - k * 13);
        const pos = U.polyAt(rt.pts, d2);
        if (!inView(pos.x, pos.y, 40)) continue;
        cx.fillStyle = k === 0 ? '#ffe8b0' : k === 1 ? '#ffd070' : 'rgba(255,190,110,0.55)';
        const sz2 = k === 0 ? 7 : k === 1 ? 6 : 4;
        cx.fillRect(Math.round(pos.x / 4) * 4 - sz2 / 2, Math.round(pos.y / 4) * 4 - sz2 / 2, sz2, sz2);
      }
    }
    cx.globalCompositeOperation = 'source-over';
  }
  /* v3.46 THE WORD ON THE WIRE — the letter walks the wire's own route between the lit towns, a tail of its seal's
     colour behind it: gold for a word kept, rust for a word broken. Whole texels, the note on the world's grid. */
  function drawWireWords(inView) {
    const L = Economy.wireWords ? Economy.wireWords() : []; if (!L.length || typeof SPRITES === 'undefined') return;
    for (const w of L) {
      const p = Economy.wireWordAt(w), kept = w.kind === 'kept', ahead = w.kind === 'ahead';   // v3.48: a keeper's word gone ahead, in the waylight's teal
      if (!inView(p.x, p.y, 60)) continue;
      cx.globalCompositeOperation = 'lighter';
      for (let k = 1; k <= 3; k++) {
        const q = U.polyAt(p.pts, Math.max(0, p.d - k * 11));
        cx.fillStyle = ahead ? `rgba(87,200,180,${0.55 - k * 0.13})` : kept ? `rgba(255,208,112,${0.5 - k * 0.12})` : `rgba(201,85,58,${0.55 - k * 0.13})`;
        const sz = 7.5 - k * 1.5; cx.fillRect(Math.round(q.x / 2.5) * 2.5 - sz / 2, Math.round((q.y - 16) / 2.5) * 2.5 - sz / 2, sz, sz);
      }
      glowShells(p.x, p.y - 16, 12, ahead ? 'rgba(120,220,200,0.5)' : kept ? 'rgba(255,217,143,0.5)' : 'rgba(224,101,74,0.45)');
      cx.globalCompositeOperation = 'source-over';
      const bob = ((S.time * 4) | 0) % 2 ? 2.5 : 0;
      blit(SPRITES.WORDNOTE[ahead ? ((w.chain || 1) >= 3 ? 'ahead3' : (w.chain || 1) === 2 ? 'ahead2' : 'ahead') : kept ? 'kept' : 'broken'], p.x - 8.75, p.y - 22 - bob, 2.5, SPRITES.WORD_PAL, false);   // v3.49: a letter passed on wears its place in the chain
    }
  }
  /* v3.46 THE WORD CARRIED on the ground — where a charter road crosses an open ring the white rags stand; the stones
     left where scores were settled; the chief's runner with the gift on his back, going to the lit door */
  function drawCarried(inView, dt) {
    if (typeof SPRITES === 'undefined' || typeof Republic === 'undefined') return;
    if (Republic.truceRoads) for (const tr of Republic.truceRoads()) {
      if (tr.watch) continue;   // v3.47: a ring your watch keeps carries no rags — the line is its mark
      const cT = S.camps[tr.cd.id] || {}, keptNew = !!(cT.roadKept && S.time - cT.roadKept < DATA.T.dayLen);   // v3.47: the road kept — a gold cord knotted new on every pole, a day
      for (const c2 of tr.cross) {
        if (!inView(c2.x, c2.y, 60)) continue;
        pixShadow(c2.x, c2.y + 14, 8); blit(keptNew ? SPRITES.TRUCESTAKE_KEPT : SPRITES.TRUCESTAKE, c2.x - 8.75, c2.y - 18, 2.5, SPRITES.TRUCE_KEPT_PAL, false);
        if (cam.z > 0.7 && U.dist(S.px, S.py, c2.x, c2.y) < 520) plabel(keptNew ? 'THE ROAD KEPT' : 'THE TRUCE ROAD', c2.x, c2.y + 22, 2, keptNew ? '#ffd98f' : '#e8e0c8');
      }
    }
    /* v3.47 THE RAGS DOWN — a knife walks out to each pole, pulls the rag and walks back; the poles stand bare a day with the rags in the dirt */
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id], rd = c && c.ragsDown; if (!rd || S.time - rd.t > DATA.T.road.bareDays * DATA.T.dayLen) continue;
      const st3 = S.time - rd.t;
      rd.pts.forEach((p2, i) => {
        if (!inView(p2.x, p2.y, 90)) return;
        const pulled = st3 >= 3.0;
        pixShadow(p2.x, p2.y + 14, 8); blit(pulled ? SPRITES.TRUCESTAKE_BARE : SPRITES.TRUCESTAKE, p2.x - 8.75, p2.y - 18, 2.5, SPRITES.TRUCE_KEPT_PAL, false);
        if (pulled) { pixShadow(p2.x + 12, p2.y + 16, 9); blit(SPRITES.RAG_DOWN, p2.x + 2, p2.y + 9, 2.5, SPRITES.TRUCE_KEPT_PAL, false); }
        if (st3 < 5.8) {   // the knife: out to the pole, the pull, back to the fire
          const ux = cd.x - p2.x, uy = cd.y - p2.y, ul = Math.max(1, Math.hypot(ux, uy)), fx = p2.x + ux / ul * 70, fy2 = p2.y + uy / ul * 70, sx2 = p2.x + ux / ul * 12 - 10, sy2 = p2.y + uy / ul * 12 + 10;
          const k = st3 < 2.4 ? st3 / 2.4 : st3 < 3.4 ? 1 : 1 - (st3 - 3.4) / 2.4, kx = fx + (sx2 - fx) * k, ky = fy2 + (sy2 - fy2) * k, mv = st3 < 2.4 || st3 >= 3.4;
          const dir = st3 < 3.4 ? Math.atan2(sy2 - fy2, sx2 - fx) : Math.atan2(fy2 - sy2, fx - sx2), CK = typeof FACT !== 'undefined' && FACT.CAMP_CLASSES.knife;
          pixShadow(kx, ky + 6, 13);
          blitFig(kx, ky, (CK && CK.kit) || 'knife', mv, S.time * 12 + i, dir);
        }
        if (i === 0 && cam.z > 0.7 && U.dist(S.px, S.py, p2.x, p2.y) < 520) plabel(rd.broke ? 'THE RAGS DOWN — YOUR WORD BROKE' : 'THE RAGS DOWN — A NEW MAN AT THE FIRE', p2.x, p2.y + 22, 2, '#c9553a');
      });
    }
    if (Republic.settleStones) for (const st2 of Republic.settleStones()) {
      if (!inView(st2.x, st2.y, 200)) continue;
      if (st2.down) { pixShadow(st2.x, st2.y + 6, 16); blit(SPRITES.SETTLESTONE_DOWN, st2.x - 12.5, st2.y - 4, 2.5, SPRITES.SETTLE_PAL, false); }   // v3.47: kicked over
      else if (st2.twice) { pixShadow(st2.x, st2.y + 8, 14); blit(SPRITES.SETTLESTONE_TWICE, st2.x - 10, st2.y - 15, 2.5, SPRITES.SETTLE_PAL, false);   // v3.48: set again — a stone higher, a second red thread
        const ks = st2.kstone;   // v3.49 THE KNIVES' STONE — the camp's own, set beside it with a black thread
        if (ks) {
          const KS = DATA.T.kstone, spot = { x: st2.x + 24, y: st2.y + 2 };
          if (ks.set) { pixShadow(spot.x, spot.y + 6, 11); blit(SPRITES.SETTLESTONE_KNIVES, spot.x - 8.75, spot.y - 12.5, 2.5, SPRITES.SETTLE_PAL, false); }
          const back = ks.set ? (S.time - ks.set) / KS.back : 0;
          if (!ks.set || back < 1) {
            const stand = { x: spot.x + 16, y: spot.y + 2 }, f = ks.set ? 1 - back : Math.min(1, ks.t / KS.walk), kx = ks.x0 + (stand.x - ks.x0) * f, ky = ks.y0 + (stand.y - ks.y0) * f;
            const mv = ks.set ? true : ks.t < KS.walk, dir = ks.set ? Math.atan2(ks.y0 - stand.y, ks.x0 - stand.x) : Math.atan2(stand.y - ks.y0, stand.x - ks.x0), flip = Math.cos(dir) < 0;
            pixShadow(kx, ky + 6, 13); blitFig(kx, ky, 'knife', mv, S.time * 12, dir);
            if (!ks.set) blit(SPRITES.CARRY_STONE, flip ? kx - 12.5 : kx + 2.5, ky - 22, 2.5, SPRITES.SETTLE_PAL, false);   // the stone held in front
          }
          if (ks.set && cam.z > 0.7 && U.dist(S.px, S.py, st2.x, st2.y) < 420) plabel('THE KNIVES\' STONE', spot.x + 6, spot.y + 30, 2, '#b8c2c8');
        }
      }
      else { pixShadow(st2.x, st2.y + 8, 14); blit(SPRITES.SETTLESTONE, st2.x - 10, st2.y - 10, 2.5, SPRITES.SETTLE_PAL, false); }
      if (cam.z > 0.7 && U.dist(S.px, S.py, st2.x, st2.y) < 420) plabel(`${st2.name.toUpperCase()} — ${st2.down ? 'KICKED OVER' : st2.twice ? 'SETTLED TWICE' : 'SETTLED'}`, st2.x, st2.y + 16, 2, st2.down ? '#c9553a' : st2.twice ? '#ffd98f' : '#d8d2bd');
      /* v3.47 — the knife the camp sends to kick them: out from the ring's edge, the kick, back */
      const kk = st2.kick, St = DATA.T.stone;
      if (kk && (!st2.down || S.time - st2.down < 2.8)) {
        const back = st2.down ? Math.min(1, (S.time - st2.down) / 2.8) : 0, walkF = st2.down ? 1 : Math.min(1, kk.t / St.walk);
        const f = st2.down ? 1 - back : walkF, sx2 = st2.x + 14, sy2 = st2.y + 2, kx = kk.x0 + (sx2 - kk.x0) * f, ky = kk.y0 + (sy2 - kk.y0) * f, mv = st2.down ? true : kk.t < St.walk;
        const dir = st2.down ? Math.atan2(kk.y0 - sy2, kk.x0 - sx2) : Math.atan2(sy2 - kk.y0, sx2 - kk.x0), CK = typeof FACT !== 'undefined' && FACT.CAMP_CLASSES.knife;
        pixShadow(kx, ky + 6, 13);
        blitFig(kx, ky, (CK && CK.kit) || 'knife', mv, S.time * 12, dir);
      }
    }
    const g = S.giftRunner;
    if (g && inView(g.x, g.y, 60)) {
      cx.save(); cx.translate(g.x, g.y);
      pixShadow(0, 6, 15);
      /* v3.51: the runner is the knife — the bundle lashed on his back (the registry's anchor: behind him from the side and
         toward the eye, over his back walking away) */
      const CO = SPRITES.COURIER, d = figDrawn('knife', g.moving, S.time * 12 + g.wa, g.dir), A = d.F.at[d.fc];
      const cells = glyphCells(CO.glyphs.gift, CO.glyphPal, A.gift[0], A.gift[1] + d.dy, false);
      if (A.giftBack) figStamp(d, 0, 0, cells);
      blitFig(0, 0, 'knife', g.moving, S.time * 12 + g.wa, g.dir);
      if (!A.giftBack) figStamp(d, 0, 0, cells);
      cx.restore();
      if (cam.z > 0.7) plabel(g.back ? 'THE RUNNER — TURNED BACK' : 'A RUNNER FROM THE FIRE — A GIFT', g.x, g.y + 16, 2, '#e8e0c8');
    }
    /* v3.51 THE CAMPS ON THE ROUTES — a knife from a camp whose stone stands beside yours, the salvage lashed on his back (the
       bundle's anchor: behind him from the side and toward the eye, over his back walking away), walking it to the town short
       of it; empty-handed walking home */
    if (typeof Republic !== 'undefined' && Republic.salvageRuns) for (const r of Republic.salvageRuns()) {
      if (!inView(r.x, r.y, 60)) continue;
      cx.save(); cx.translate(r.x, r.y);
      pixShadow(0, 6, 15);
      const d = figDrawn('knife', r.moving, S.time * 12 + r.wa, r.dir), A = d.F.at && d.F.at[d.fc];
      const cells = !r.back && A ? glyphCells(SPRITES.SALVAGE, SPRITES.MARK_PAL, A.bundle[0], A.bundle[1] + d.dy, false) : [];
      if (A && A.bundleBack) figStamp(d, 0, 0, cells);
      blitFig(0, 0, 'knife', r.moving, S.time * 12 + r.wa, r.dir);
      if (A && !A.bundleBack) figStamp(d, 0, 0, cells);
      cx.restore();
      const dest = stations[r.to];
      if (cam.z > 0.7 && dest) plabel(r.back ? 'THE KNIFE — WALKING HOME' : `THE KNIVES' SALVAGE — FOR ${dest.name.toUpperCase()}`, r.x, r.y + 16, 2, '#d8d2bd');
    }
  }
  function drawBeams(dt) {
    // the shaft belongs to the night: at noon there is nothing to see a beam IN.
    const nn = Economy.dayPhase().nightness;
    const nnA = nn >= 0.62 ? 1 : nn >= 0.18 ? 0.5 : 0;
    if (!nnA) return;
    cx.globalCompositeOperation = 'lighter';
    for (const id of stationOrder) {
      const st = S.stations[id];
      if (!st.connected || st.litT <= 0 || st.cut) continue;   // v3.49: the cut post's lamp is dark
      const d = stations[id];
      const bh = (d.post ? 96 : 150) * st.litT;   // v3.48: a camp's relay throws a shorter shaft, from its own lamp
      const sway = Math.round(Math.sin(S.time * 0.8 + d.x)) * 3;          // one texel of lean, as a body
      const fl2 = ((S.time * 7) | 0) % 2 ? 1 : 0.86;                       // mains flicker, two steps
      cx.globalAlpha = nnA * fl2 * st.litT;
      cx.imageSmoothingEnabled = false;
      if (d.post) { const m = postMast(d); cx.drawImage(shaftSprite(), m.x - 8 + sway, m.y - 58 - bh, 16, bh); }
      else cx.drawImage(shaftSprite(), d.x - 12 + sway, d.y - 74 - bh, 24, bh);
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
    pobox: [
      '..OOOOOOOO..',
      '.OTTTTTTTTO.',
      '.OTdKKKKdTO.',
      '.OTKGGGGKTO.',
      '.OTdKKKKdTO.',
      '.OTTTTTTTTO.',
      '..OOODDOOO..',
      '.....ODO....',
      '.....ODO....',
      '....OSSO....',
    ],
    /* v3.27 THE ECOSYSTEM — the production works, authored like everything else:
       the still is copper and one pale slit; the sawcamp a rack of planks and a blade;
       the oven a squat kiln with a hot mouth. */
    lumenstill: [
      '.....OOO.....',
      '....OdLdO....',
      '....ORRRO....',
      '...ORRrRRO...',
      '..ORRrLrRRO..',
      '..ORrLLLrRO..',
      '..ORRrLrRRO..',
      '..OORRrRROO..',
      '...ODRRRDO...',
      '..ODDOOODDO..',
      '.OSSSSSSSSSO.',
      '.OOOOOOOOOOO.',
    ],
    sawcamp: [
      '.O.........O.',
      'OTO.......OTO',
      'OTTOOOOOOOTTO',
      'OTdTTTTTTTdTO',
      'OOOOOOOOOOOOO',
      '..OTTTTTTTO..',
      '..ODDDDDDDO..',
      '.OTTTTTTTTTO.',
      '.ODDDDDDDDDO.',
      'OSSOOOOOOOSSO',
      'OSSO.....OSSO',
      'OOOO.....OOOO',
    ],
    clayoven: [
      '....OOOOO....',
      '...ODDDDDO...',
      '..ODTTTTTDO..',
      '.ODTTdddTTDO.',
      '.ODTdKKKdTDO.',
      '.ODTKGGGKTDO.',
      '.ODTdKGKdTDO.',
      '.ODTTKKKTTDO.',
      '.OODDDDDDDOO.',
      '.OSSSSSSSSSO.',
      '.OOOOOOOOOOO.',
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
    /* v3.28c — a build from a NEWER register: a rope-lashed tarp over a shape this build can't
       name. Inert, honest, and it steps back into itself when a build that knows it loads in. */
    unmapped: [
      '....OOOO....',
      '..OODDDDOO..',
      '.ODSSRSSSDO.',
      'ODSSSRSSSSDO',
      'ODSRRRRRRSDO',
      'ODSSSRSSSSDO',
      '.ODSSRSSSDO.',
      '.ODDDDDDDO..',
      '..OOODDOO...',
      '....OddO....',
    ],
  };
  const structCache = new Map();
  function structSprite(type, echo, dmg, hide) {
    const key = type + (echo ? 'E' : '') + (dmg ? 'D' : '') + (hide ? 'H' : '');
    let c = structCache.get(key);
    if (c) return c;
    const P = echo
      ? { O: '#0e1f1c', T: '#8fe8da', d: '#bff5ec', D: '#2c5a54', S: '#1d3f3a', K: '#0c1a17', G: '#8fe8da', L: '#bff5ec', R: '#2c5a54', r: '#1d3f3a' }
      : hide   // v3.49: a given ring's shelter and box — the camp's own hide on the builds' grammar
      ? { O: '#12100c', T: '#634c3e', d: '#7a5e4a', D: '#3a2c22', S: '#2a2018', K: '#151a20', G: '#ffd98f', L: '#c9a05a', R: '#513e34', r: '#3a2c22' }
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
        const rr = Systems.auraOf ? Systems.auraOf(st) : SDEF[st.type].aura;
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
        const sp = structSprite(st.type, !!st.echo, dmg, !!st.given);
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
      // v3.21: rank on the build — gold pips for every tier RAISED
      if ((st.tier || 1) >= 2) {
        for (let i = 0; i < st.tier - 1; i++) { cx.fillStyle = '#17130b'; cx.fillRect(-9 + i * 7 - 1, 9, 6, 5); cx.fillStyle = '#ffd98f'; cx.fillRect(-9 + i * 7, 10, 4, 3); }
      }
      // the room, occupied: a lit doorway while the walker rests inside
      if (S.inside === st.id) {
        const pk = 0.7 + Math.sin(S.time * 3) * 0.3;
        cx.fillStyle = '#ffd98f'; cx.globalAlpha = 0.5 + pk * 0.3;
        cx.fillRect(-3, -8, 8, 12);
        cx.globalAlpha = 1;
      }
      cx.restore();
      if (S.inside === st.id && cam.z > 0.55) plabel((st.tier || 1) >= 3 ? 'INSIDE — THE BED IS WARM' : 'INSIDE', st.x, st.y + 24, 3, '#ffd98f');
      if (st.type === 'pobox' && (st.box || []).length && cam.z > 0.6) plabel(`${st.box.length} BOXED`, st.x, st.y - 34, 3, '#c9b98a');
      if (st.echo && cam.z > 0.55) plabel(`${st.by} · ◆${st.likes || 0}`, st.x, st.y - 50, 3, '#6fe3d2');
      if (st.hp < 70 && cam.z > 0.6) plabel(`${Math.round(st.hp)}%`, st.x, st.y + 16, 3, st.hp < 40 ? '#ff8a5f' : '#b8b29d');
    }
    // zip traveller — v3.50: the courier on the wire, facing the eye, both hands closed on the trolley's bar, boots hanging;
    // the bar rides where the wire does (the old rider's bar line)
    if (S.state === 'zip' && S.zip) {
      const CO = SPRITES.COURIER, ox = S.px, oy = S.py - 39 + 26 * rigT();
      rigStamp(ox, oy, glyphCells(CO.glyphs.trolley, CO.glyphPal, 8, 3, false));
      blitWalker(ox, oy, wornPal(), false, 0, Math.PI / 2, { fc: 'S', frame: 'zip' });
    }
  }

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
  const bandFor = item => !item ? '#c9b98a' : (item.lostTo || item.orderId || item.convoy) ? '#ffd98f' : item.cat === 'core' ? '#6fe3d2' : item.cat === 'mat' ? '#8a8f98' : '#c9b98a';
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
  /* v3.29 THE MEMORIAL — the stelae, one shape set × four faction palettes (Memorial.DESIGNS).
     The stone grows with the walker it keeps, the Darkest Dungeon headstone law: small walk,
     small stone; a long walk earns the grand stele. Letters: E dark etch band, L/l the light. */
  const MEM_SMALL = [
    '..OOO..',
    '.OSSsO.',
    '.OSSSO.',
    '.OEEEO.',
    '.OSSSO.',
    '.OSsSO.',
    '.OSSSO.',
    'OOsSSOO',
    'ODDDDDO',
  ];
  const MEM_MID = [
    '...OOO...',
    '..OSSsO..',
    '.OSSSSSO.',
    '.OSEEESO.',
    '.OSEEESO.',
    '.OSSSSSO.',
    '.OSSsSSO.',
    '.OSSSSSO.',
    '.OsSSSsO.',
    'OOSSSSSOO',
    'ODDDDDDDO',
  ];
  const MEM_GRAND = [
    '....OOOO....',
    '...OSSSsO...',
    '..OSSSSSSO..',
    '.OSSEEESSO..',
    '.OSEEEEESSO.',
    '.OSEEEEESSO.',
    '.OSSEEESSSO.',
    '.OSSSSSSSSO.',
    '.OSSsSSSsSO.',
    '.OSSSSSSSSO.',
    '.OsSSSSSSsO.',
    '.OSSSSSSSSO.',
    'OOSSSSSSSSOO',
    'ODDDDDDDDDDO',
  ];
  const MEM_PLINTH = [
    '..OOOOOOOO..',
    '.OSSSSSSSsO.',
    'OSEEEEEEEESO',
    'OSSSSSSSSSSO',
    'ODDDDDDDDDDO',
  ];
  const MEM_LANTERN = [
    '.OOO.',
    'OSLSO',
    'OSlSO',
    'OSLSO',
    '.ODO.',
    '.ODO.',
    '.ODO.',
    'OODOO',
  ];
  /* the hall's back wall, one segment tiled — stage 3, the roll grown long */
  const MEM_WALL = [
    'OOOOOOOOOOOOOO',
    'OSSSSsSSSSsSSO',
    'OSEESOSEESOSSO',
    'OSEESOSEESOsSO',
    'OSSSSOSSSSOSSO',
    'OsSSSsSSSSsSSO',
    'ODDDDDDDDDDDDO',
  ];
  /* faction accents, drawn over the stone's crown: flame · hood · ring · leaf */
  function memAccent(d, x, y, tx) {
    cx.fillStyle = d.pal.L;
    if (d.accent === 'flame') { cx.fillRect(x, y - tx * 2, tx, tx * 2); cx.fillStyle = d.pal.l; cx.fillRect(x, y - tx, tx, tx); }
    else if (d.accent === 'hood') { cx.fillStyle = d.pal.D; cx.fillRect(x - tx, y - tx * 2, tx * 3, tx); cx.fillStyle = d.pal.L; cx.fillRect(x, y - tx, tx, tx); }
    else if (d.accent === 'ring') { cx.fillStyle = d.pal.A; cx.fillRect(x - tx, y - tx, tx * 3, tx); cx.fillRect(x - tx, y - tx * 2, tx, tx); cx.fillRect(x + tx, y - tx * 2, tx, tx); }
    else if (d.accent === 'leaf') { cx.fillStyle = d.pal.A; cx.fillRect(x, y - tx * 2, tx, tx * 2); cx.fillRect(x - tx, y - tx, tx, tx); cx.fillRect(x + tx, y - tx, tx, tx); }
    else if (d.accent === 'shield') {   // v3.43: a round wooden shield — the rim in oak, the face in bone, the boss in steel
      cx.fillStyle = d.pal.A; cx.fillRect(x - tx, y - tx * 3, tx * 3, tx); cx.fillRect(x - tx * 2, y - tx * 2, tx, tx * 2); cx.fillRect(x + tx * 2, y - tx * 2, tx, tx * 2); cx.fillRect(x - tx, y, tx * 3, tx);
      cx.fillStyle = d.pal.S; cx.fillRect(x - tx, y - tx * 2, tx * 3, tx * 2);
      cx.fillStyle = '#b8c2c8'; cx.fillRect(x, y - tx * 2 + tx / 2, tx, tx);
    }
  }
  function drawMemorial(inView) {
    if (typeof Memorial === 'undefined' || !S || !(S.legacy || []).length) return;
    for (const f of Memorial.grounds()) drawGround(inView, f);   // v3.30: every revealed ground, its own doctrine
  }
  function drawGround(inView, fact) {
    const s2 = Memorial.site(fact);
    if (!s2 || !inView(s2.x, s2.y, 240)) return;
    const stg = Memorial.stage(fact);
    const d = Memorial.design(fact);
    const PAL = { ...d.pal };
    // stage 2+: the paved apron — ordered set stones up the center path, readable in daylight
    if (stg >= 2) {
      cx.fillStyle = PAL.D;
      for (let gy = 0; gy < 6; gy++) for (const gx of [-12, 0, 12])
        cx.fillRect(s2.x + gx + ((gy % 2) * 6 - 3), s2.y + 30 - gy * 14, 7, 5);
    }
    // stage 3: the hall wall behind the rows — one contiguous run, sized to the ground it crowns
    if (stg >= 3) {
      pixShadow(s2.x, s2.y - 120, 230);
      for (let seg = -2; seg <= 2; seg++) blit(MEM_WALL, s2.x - 21 + seg * 42, s2.y - 158, 3, PAL, false);
      cx.globalCompositeOperation = 'lighter';
      glowShells(s2.x, s2.y - 146, 14, 'rgba(255,217,143,0.9)');
      cx.globalCompositeOperation = 'source-over';
    }
    // the plinth and its ground line — stage 0's whole truth: kept ground, waiting
    pixShadow(s2.x, s2.y + 52, 56);
    blit(MEM_PLINTH, s2.x - 24, s2.y + 36, 4, PAL, false);
    plabel(d.ground, s2.x, s2.y + 62, 3, PAL.S);
    // the lantern posts flank the path from stage 1; their light is the ground's own
    if (stg >= 1) {
      for (const lx of [-134, 134]) {   // v3.45: stood clear of the outer files' names (the second stone's name ran into the post)
        pixShadow(s2.x + lx, s2.y + 34, 22);
        blit(MEM_LANTERN, s2.x + lx - 10, s2.y + 2, 4, PAL, false);
        cx.globalCompositeOperation = 'lighter';
        glowShells(s2.x + lx, s2.y + 8, 16, fact === 'waylight' ? 'rgba(255,217,143,1)' : 'rgba(201,185,138,0.85)');
        cx.globalCompositeOperation = 'source-over';
      }
    }
    // the stones themselves — tiered, named, accented; unraised slots wait as cut blocks on skids
    for (const r of Memorial.rows(fact)) {
      const sl = Memorial.slotFor(r.ord, fact);
      if (!inView(sl.x, sl.y, 80)) continue;
      const dr = Memorial.design(r.fact);
      if (!r.raised) {
        pixShadow(sl.x, sl.y + 8, 26);
        cx.fillStyle = dr.pal.D; cx.fillRect(sl.x - 12, sl.y - 2, 24, 9);
        cx.fillStyle = dr.pal.S; cx.fillRect(sl.x - 10, sl.y, 20, 5);
        cx.fillStyle = dr.pal.E; cx.fillRect(sl.x - 12, sl.y + 7, 24, 2);
        continue;
      }
      const rows2 = r.tier === 'grand' ? MEM_GRAND : r.tier === 'mid' ? MEM_MID : MEM_SMALL;
      const w = rows2[0].length, h = rows2.length, tx = r.tier === 'grand' ? 3.5 : 3;
      pixShadow(sl.x, sl.y + h * tx * 0.5 + 3, w * tx + 8);
      blit(rows2, sl.x - (w * tx) / 2, sl.y - h * tx * 0.55, tx, dr.pal, false);
      memAccent(dr, sl.x - 1, sl.y - h * tx * 0.55, 3);
      /* v3.44 — the scars carried to the stone: a notch cut into the face for each, up to three, in the scar's own red */
      if (r.scars) { cx.fillStyle = '#6a2a22'; const n = Math.min(3, r.scars), pitch = r.tier === 'small' ? tx : tx * 2, y0 = sl.y - h * tx * 0.55 + (h - 4) * tx, x0 = sl.x - ((n - 1) * pitch) / 2 - tx / 2; for (let i = 0; i < n; i++) cx.fillRect(x0 + i * pitch, y0, tx, tx); }
      /* v3.45 — the kin's errand answered: the fallen's shield leans at the foot of the stone; their lantern burns beside it */
      if (r.home) { pixShadow(sl.x - 9, sl.y + h * tx * 0.5 + 2, 9); blit(SPRITES.MARKS.home, sl.x - 18, sl.y + h * tx * 0.5 - 16, 2, SPRITES.MARK_PAL, false); }
      if (r.lit) kinLanternAt(sl.x + 16, sl.y + h * tx * 0.5 - 2, true);
      else if (r.cold && !(typeof Republic !== 'undefined' && Republic.lanternOff && Republic.lanternOff(r.name))) kinLanternAt(sl.x + 16, sl.y + h * tx * 0.5 - 2, false);   // v3.46: gone out at dark — the stone asks for its flame
      /* v3.48 THE KIN'S DAY — from dusk into the night on its day, two candles at the stone's foot (their flames glowing), the
         kin standing on the centre path at its row, facing it, and the day named on the ground */
      const kinDay = r.fact === 'town' && r.keepsake && typeof Republic !== 'undefined' && Republic.kinDayNow && S.legacy[r.i] && Republic.kinDayNow(S.legacy[r.i]);
      if (kinDay && typeof SPRITES !== 'undefined') {
        const fy = sl.y + h * tx * 0.5 + 3, cf = ((S.time * 4) | 0) % 2, cw = (w * tx) / 2 + 7;   // at the stone's two sides, clear of what lies at its foot
        blit(SPRITES.KIN_CANDLES[cf], sl.x - cw - 3.75, fy - 14, 2.5, SPRITES.KINDAY_PAL, false); blit(SPRITES.KIN_CANDLES[1 - cf], sl.x + cw - 3.75, fy - 14, 2.5, SPRITES.KINDAY_PAL, false);
        cx.globalCompositeOperation = 'lighter'; glowShells(sl.x - cw, fy - 12, 6 + cf, 'rgba(255,217,143,0.85)'); glowShells(sl.x + cw, fy - 12, 6 + (1 - cf), 'rgba(255,217,143,0.85)'); cx.globalCompositeOperation = 'source-over';
      }
      /* v3.47 — THE KEEPSAKE SET DOWN: the thing the kin gave back lies at the foot of the fallen's stone, between the shield and the lantern */
      if (r.keepsake && typeof SPRITES !== 'undefined' && SPRITES.KEEPSAKE_SET[r.keepsake]) { const K5 = SPRITES.KEEPSAKE_SET[r.keepsake], fy = sl.y + h * tx * 0.5 + 3; pixShadow(sl.x + 3, fy, 9); blit(K5, sl.x + 3 - K5[0].length, fy - K5.length * 2, 2, SPRITES.TOKEN_PAL, false); }
      /* v3.44 — the kin at the stones: while the days run, one stands at the newest of the town's own */
      if (kinDay && typeof SPRITES !== 'undefined') {
        pixShadow(s2.x, sl.y + 30, 12); blitFig(s2.x, sl.y + 26, 'kin', false, 0, sl.x < s2.x ? Math.PI : 0);
        if (cam.z > 0.7) plabel(`${Republic.kinNameOf(S.legacy[r.i]).split(' ')[0].toUpperCase()} — ${r.name.split(' ')[0].toUpperCase()}'S DAY`, s2.x, sl.y + 44, 2, '#ffd98f', { first: true });
      } else if (r.fact === 'town' && r.town && r.raised && typeof Republic !== 'undefined' && Republic.kinWaits && Republic.kinWaits(r.town) && typeof SPRITES !== 'undefined' && (() => { const last = Memorial.rows(fact).filter(x => x.fact === 'town' && x.town === r.town && x.raised).slice(-1)[0]; return last && last.i === r.i; })()) {   // v3.45: the kin waits at the stones while an errand is open
        pixShadow(s2.x, sl.y + 30, 12); blitFig(s2.x, sl.y + 26, 'kin', false, 0, sl.x < s2.x ? Math.PI : 0);   // on the centre path at the stone's row, turned to face it
      }
      plabel(r.name.split(' ')[0], sl.x, sl.y + h * tx * 0.5 + 8 + (r.ord % 2 ? 11 : 0), 2, dr.pal.s);   // v3.43: neighbours' names staggered — two long first names side by side stay legible
      if (r.tier === 'grand') {
        cx.globalCompositeOperation = 'lighter';
        glowShells(sl.x, sl.y - h * tx * 0.55, 10, 'rgba(255,217,143,0.85)');
        cx.globalCompositeOperation = 'source-over';
      }
    }
  }
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
  /* v3.45 — the fallen's lantern standing: dark, or lit with a banded glow that breathes on the texel grid */
  function kinLanternAt(x, y, lit) {
    pixShadow(x, y + 9, 12);
    blit(lit ? SPRITES.KINLANTERN : SPRITES.KINLANTERN_DARK, x - 6.25, y - 11, 2.5, SPRITES.KPAL, false);
    if (lit) { cx.globalCompositeOperation = 'lighter'; glowShells(x, y - 4, 11 + (((S.time * 3) | 0) % 2), 'rgba(255,214,140,0.9)'); cx.globalCompositeOperation = 'source-over'; }
  }
  /* v3.44 — a parcel on the ground is a PARCEL, not a crate: the pack's own glyph (paper, string; torn, or sworn in rust) at the world crate's scale */
  function worldParcel(x, y, item) {
    const g = cargoGlyphFor(item);
    pixShadow(x, y + 9, 20);
    blit(g.rows, x - 10, y - 6, 2.5, g.pal, false);
  }
  function drawPickups(inView) {
    const tL = ((S.time * 3) | 0) % 2;
    for (const d of S.drops) if (inView(d.x, d.y)) {
      if (d.item && d.item.defId === 'kinShield') { pixShadow(d.x, d.y + 7, 22); blit(SPRITES.KINSHIELD_DOWN, d.x - 11.25, d.y - 3, 2.5, SPRITES.KPAL, false); }   // v3.45: the fallen's shield where it fell
      else if (d.item && d.item.defId === 'kinLantern') kinLanternAt(d.x, d.y, d.item.lit);
      else if (d.item && d.item.parcel) worldParcel(d.x, d.y, d.item); else worldCrate(d.x, d.y, bandFor(d.item));
    }
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
  /* =============== v3.32 — the interior room: a registry row drawn whole ===============
     The room draws into the world buffer at the game's own fat-pixel discipline: concrete
     ribs, cold strip light, furniture by KIND (a future room reuses every glyph), the walker
     small and real on the slab floor. */
  function drawRoom(dt) {
    const R = REP.INTERIORS[S.room.id], rm = S.room;
    const ST = REP.ROOM_STYLES[R.style] || REP.ROOM_STYLES.concrete;   // v3.34: one renderer, a material per row
    { const b = bufFor(PIXK); worldC = b.c; worldCx = b.cx; pixk = PIXK; }   // v3.49: a room stands at the base block, whatever the wheel says outside
    cx = worldCx;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.fillStyle = '#05070b';
    cx.fillRect(0, 0, worldC.width, worldC.height);
    /* THE FIT LAW: the room stands whole in the buffer (rows are ≤ 400×190), the ceiling band above it */
    const ox = Math.round((worldC.width - R.w) / 2), oy = Math.round((worldC.height - R.h) / 2) + 6;
    cx.setTransform(1, 0, 0, 1, ox, oy);
    const px = (x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    /* the floor, dithered in the room's material */
    px(0, 0, R.w, R.h, ST.floor);
    cx.fillStyle = ST.dot;
    for (let y = 0; y < R.h; y += 4) for (let x = (y % 8) ? 0 : 4; x < R.w; x += 8) cx.fillRect(x, y, 1, 1);
    cx.strokeStyle = ST.grid; cx.lineWidth = 1;
    const pitch = R.style === 'timber' ? 26 : 52;   // planks run narrower than slabs
    for (let x = 0; x <= R.w; x += pitch) { cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x, R.h); cx.stroke(); }
    for (let y = 0; y <= R.h; y += 52) { cx.beginPath(); cx.moveTo(0, y); cx.lineTo(R.w, y); cx.stroke(); }
    /* walls: ribs on every side, tall at the top */
    px(0, -26, R.w, 26, ST.wall); px(0, -26, R.w, 3, ST.wallHi);
    for (let x = 10; x < R.w; x += 40) px(x, -26, 6, 26, ST.rib);
    px(-10, -26, 10, R.h + 36, ST.side); px(R.w, -26, 10, R.h + 36, ST.side);
    px(0, R.h, R.w, 10, ST.side);
    /* the light down the ceiling line — cold strip, or the warm run of a hall's lamps */
    px(30, -21, R.w - 60, 2, ST.strip);
    cx.globalAlpha = 0.12; px(20, -19, R.w - 40, 44, ST.strip); cx.globalAlpha = 1;
    /* the door, bottom center — the way out is always drawn */
    px(R.entry.x - 16, R.h - 8, 32, 8, '#3a4048');
    px(R.entry.x - 12, R.h - 6, 24, 6, ST.door);
    px(R.entry.x - 12, R.h - 6, 24, 1, '#8d979c');
    /* furniture by KIND */
    for (const f of R.furniture) {
      /* every kind reads its own width — a row may size its furniture as it likes */
      if (f.kind === 'lockers') {
        px(f.x, f.y, f.w, f.h, '#2a3038');
        for (let x = f.x + 2; x < f.x + f.w - 8; x += 12) { px(x, f.y + 2, 10, f.h - 4, '#323a44'); px(x + 3, f.y + f.h / 2, 4, 2, '#8d979c'); }
        px(f.x, f.y, f.w, 2, '#3e4650');
      } else if (f.kind === 'brasswall') {
        px(f.x, f.y, f.w, f.h, '#23282f');
        for (let gy = 0; gy * 8 + 10 < f.h; gy++) for (let gx = 0; gx * 10 + 12 < f.w; gx++) px(f.x + 4 + gx * 10, f.y + 4 + gy * 8, 8, 5, gy % 2 === gx % 2 ? '#8a6534' : '#a5854a');
        px(f.x, f.y, f.w, 2, '#c9b98a');
      } else if (f.kind === 'logdesk') {
        px(f.x, f.y, f.w, f.h, '#3a3320'); px(f.x, f.y, f.w, 3, '#4a4330');
        px(f.x + 8, f.y - 4, 22, 6, '#f2ead4'); px(f.x + 10, f.y - 3, 18, 1, '#8d979c');   // the open record
        px(f.x + f.w - 16, f.y - 6, 3, 8, '#8fb08a');                                       // the cold lamp
      } else if (f.kind === 'armory') {
        px(f.x, f.y, f.w, f.h, '#20262e');
        cx.strokeStyle = '#5a6470'; cx.lineWidth = 1;
        for (let x = f.x + 3; x < f.x + f.w; x += 6) { cx.beginPath(); cx.moveTo(x, f.y); cx.lineTo(x, f.y + f.h); cx.stroke(); }   // the cage
        for (let x = f.x + 8; x < f.x + f.w - 26; x += 14) px(x, f.y + 5, 2, f.h - 10, '#4a3320');   // racked bolts
        px(f.x + f.w - 22, f.y + f.h - 9, 16, 7, '#4a4330'); px(f.x + f.w - 20, f.y + f.h - 7, 8, 2, '#c25038');   // the C20 crate, stencilled
      }
      /* v3.34 — the long hall */
      else if (f.kind === 'shieldwall') {
        px(f.x, f.y, f.w, f.h, '#2e343a'); px(f.x, f.y, f.w, 2, '#4a525a');
        const fallen = (S.legacy || []).filter(g => g.fact === 'farkeep').length, sh = f.h - 8;
        for (let i = 0; i * 24 + 20 < f.w; i++) {
          const sx = f.x + 6 + i * 24, hung = i < fallen;   // a hung shield for every stone at the Standing Teeth
          px(sx, f.y + 4, 14, sh, hung ? '#5a6a7a' : '#8d979c'); px(sx, f.y + 4, 14, 2, hung ? '#8d979c' : '#b8c2c8');
          px(sx + 5, f.y + 4 + (sh >> 1) - 2, 4, 4, hung ? '#23282f' : '#4a565e');   // the boss: an iron ring, cold by doctrine
          if (hung) px(sx + 2, f.y + sh + 1, 10, 1, '#12161c');
        }
      } else if (f.kind === 'hearth') {
        px(f.x, f.y, f.w, f.h, '#3a4048'); px(f.x + 5, f.y + 6, f.w - 10, f.h - 10, '#12161c');   // the stone mouth
        const cxm = f.x + f.w / 2;
        blit(HEARTH_F[((S.time * 6) | 0) % 3], cxm - 7, f.y + f.h - 14, 2.5, FIRE_PAL, false);   // the hearth's fire, on its logs
        cx.globalAlpha = 0.16; px(f.x - 16, f.y - 8, f.w + 32, f.h + 32, '#ffb54f'); cx.globalAlpha = 1;
      } else if (f.kind === 'yard') {
        px(f.x, f.y, f.w, f.h, '#33383d');
        for (let x = f.x + 6; x < f.x + f.w - 4; x += 20) px(x, f.y + 5, 3, f.h - 10, '#4a3320');   // the rack posts
        px(f.x + 5, f.y + 5, f.w - 10, 2, '#4a3320');
        const u = f.w / 100, hh = f.h - 16;
        px(f.x + 14 * u, f.y + 9, 2, hh - 2, '#a88a5c'); px(f.x + 12 * u, f.y + 9, 6, 1, '#d1b48a');       // a strung bow
        px(f.x + 40 * u, f.y + 8, 3, hh + 2, '#b8c2c8'); px(f.x + 40 * u - 4, f.y + 10, 11, 2, '#8d979c');  // the claymore, human-sized
        px(f.x + 62 * u, f.y + 10, 10, 4, '#23282f'); px(f.x + 62 * u - 2, f.y + 14, 4, hh - 8, '#4a3320'); // a breech, racked
        px(f.x + 82 * u, f.y + 11, 10, hh - 4, '#5a6a7a'); px(f.x + 82 * u, f.y + 11, 10, 2, '#8d979c');  // the practice shield, dented
      } else if (f.kind === 'longtable') {
        px(f.x, f.y, f.w, f.h, '#4a3320'); px(f.x, f.y, f.w, 3, '#6b5030');
        for (let x = f.x + 12; x < f.x + f.w - 22; x += 30) { px(x, f.y + 6, 9, 5, '#8d979c'); px(x + 14, f.y + 5, 5, 7, '#c9b98a'); }   // bowls and bread
        px(f.x + 4, f.y + f.h, 4, 5, '#2e1c0c'); px(f.x + f.w - 8, f.y + f.h, 4, 5, '#2e1c0c');
      }
      /* v3.34 — the guild room */
      else if (f.kind === 'board') {
        px(f.x, f.y, f.w, f.h, '#2e1c0c'); px(f.x + 2, f.y + 2, f.w - 4, f.h - 4, '#4a3418');
        for (let i = 0; i * 24 + 26 < f.w; i++) { const x = f.x + 6 + i * 24; px(x, f.y + 5, 18, 10 + (i % 2) * 6, '#c9b98a'); px(x + 3, f.y + 8, 12, 1, '#1a1206'); px(x + 3, f.y + 11, 8, 1, '#1a1206'); }
        px(f.x + 6, f.y + f.h - 6, 18, 4, '#1a1206');   // the charcoal at the foot of the board
      } else if (f.kind === 'counter') {
        px(f.x, f.y, f.w, f.h, '#3a2e1c'); px(f.x, f.y, f.w, 3, '#6b5030');
        px(f.x + 8, f.y - 6, 22, 8, '#4a3320'); px(f.x + 12, f.y - 4, 4, 4, '#b8c2c8'); px(f.x + 20, f.y - 4, 4, 4, '#b8c2c8');   // a crate of counted rounds
        px(f.x + f.w - 26, f.y - 8, 14, 10, '#8d979c'); px(f.x + f.w - 22, f.y - 6, 6, 6, '#23282f');   // the scale
      } else if (f.kind === 'lanternshrine') {
        const lx = f.x + (f.w >> 1) - 9;
        px(f.x, f.y, f.w, f.h, '#2e2414'); px(lx, f.y - 16, 18, 18, '#1a2029');   // plinth + the hooded lantern
        px(lx + 4, f.y - 12, 10, 10, '#12161c'); px(lx + 6, f.y - 9, 6, 4, '#c9b98a');   // the slit of light under the hood
        px(f.x + 5, f.y + 5, 10, 2, '#1a1206'); px(f.x + 7, f.y + 9, 6, 2, '#1a1206');     // the mark cut under the lip
        cx.globalAlpha = 0.14; px(lx - 10, f.y - 22, 38, 32, '#c9b98a'); cx.globalAlpha = 1;
      } else if (f.kind === 'cots') {
        px(f.x, f.y, f.w, f.h, '#2e1c0c');
        for (let x = f.x + 3; x + 22 < f.x + f.w; x += 25) { px(x, f.y + 3, 20, f.h - 6, '#4a4f57'); px(x + 2, f.y + 5, 7, 5, '#c9b98a'); }
      }
    }
    /* hotspot floor plates — a quiet square where the room will answer */
    for (const h of R.hotspots) { cx.globalAlpha = 0.25; px(h.x - 8, h.y - 4, 16, 8, '#8fb08a'); cx.globalAlpha = 1; }
    /* the walker — the rig itself, in the coat they wear (v3.34: no stand-in figure down here either) */
    cx.globalAlpha = 0.35; px(rm.x - 6, rm.y - 1, 12, 3, '#05070b'); cx.globalAlpha = 1;
    blitWalker(rm.x, rm.y - 5, wornPal(), S.moving, S.time * 12, S.dir);
    /* the room announces itself, register-voiced */
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.fillStyle = ST.title; cx.font = '800 8px ui-monospace, Menlo, monospace';
    cx.textAlign = 'center';
    cx.fillText(R.name, worldC.width / 2, oy - 5);   // on the ceiling band, inside the buffer at every viewport
    cx.textAlign = 'left';
    /* land it on screen */
    cx = mainCx;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(worldC, 0, 0, worldC.width, worldC.height, 0, 0, worldC.width * PIXK, worldC.height * PIXK);
    cx.imageSmoothingEnabled = true;
    cx.drawImage(vign, 0, 0, cv.width, cv.height);
  }

  /* =============== v3.32 THE REPUBLIC IN FORCE: the sandbox on the ground ===============
     One draw for every presence row + the marching column + the far shape. Registry-shaped:
     a glyph per PRESENCES.kind, positions from the engine, nothing bespoke per faction. */
  function drawRepublic(inView, dt) {
    if (typeof Republic === 'undefined' || !S.rep) return;
    const px = (x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    /* flame shrines — a stone bowl on a plinth; FED, it stands a tall clean flame */
    for (const s2 of Republic.sites('flameshrine')) {
      if (!inView(s2.x, s2.y)) continue;
      const fed = s2.fedUntil > S.time;
      const doused = !fed && s2.doused && S.time - s2.doused < REP.EVENTS.shrineRaid.dousedDur;
      /* the bowl on its plinth: one glyph per state — fed (the flame stands), cold (scraped char),
         doused (v3.34: the Raiders' night work — kicked over, coals scattered, the ground scorched) */
      if (doused) { cx.globalAlpha = 0.5; px(s2.x - 18, s2.y - 4, 40, 8, '#0d1015'); cx.globalAlpha = 1; }
      blit(SHRINE[fed ? 'fed' : doused ? 'doused' : 'cold'], s2.x - 13, s2.y - 30, 2.5, SHRINE_PAL, fed && ((S.time * 6) | 0) % 2 === 1);
      if (fed) {
        glowShells(s2.x, s2.y - 18, 26, 'rgba(255,181,79,0.8)');
        /* v3.33: the promise at ALLY kept — a tender stands the fed bowl, torch up */
        if (typeof SPRITES !== 'undefined' && Republic.stance('flamekeepers') === 'ALLY') {
          pixShadow(s2.x + 18, s2.y + 4, 14);
          const d = blitFig(s2.x + 18, s2.y - 5, 'tender', false, 0, Math.PI), lt = d.F.light[d.fc] && d.F.light[d.fc][d.frame];   // v3.51: the tender's own figure, turned to the bowl, torch up
          if (lt) { const q = figAt(d, s2.x + 18, s2.y - 5, lt[0] + 0.5, lt[1] + 0.5); cx.globalCompositeOperation = 'lighter'; glowShells(q.x, q.y, 7 + (((S.time * 5) | 0) % 2), 'rgba(255,181,79,0.85)'); cx.globalCompositeOperation = 'source-over'; }
        }
      }
    }
    /* v3.34 — a camp the Reapers harvested posts a hooded stake where the runner stood */
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id];
      if (!c || !c.culled || S.time - c.culled >= DATA.T.dayLen || !inView(cd.x, cd.y, 160)) continue;
      cx.globalAlpha = 0.35; px(cd.x - 78, cd.y + 38, 16, 3, '#12151f'); cx.globalAlpha = 1;
      blit(STAKE, cd.x - 78, cd.y + 8, 2.5, STAKE_PAL, false);
    }
    /* hollow fires — the fire that smells wrong: green-cast flame, a rack not discussed (v3.35: a texel glyph) */
    for (const s2 of Republic.sites('hollowfire')) {
      if (!inView(s2.x, s2.y)) continue;
      blit(LARDER[((S.time * 5) | 0) % 3], s2.x - 18, s2.y - 24, 2.5, LARDER_PAL, false);
      glowShells(s2.x - 4, s2.y - 10, 20, 'rgba(194,80,56,0.55)');
    }
    /* the marching column — shields on the road, SEEN doing the doctrine's work */
    const q = Republic.quell();
    if (q) {
      for (let i = 0; i < q.col; i++) {
        const p = Republic.columnPos(Math.min(1, q.t / q.dur), i * 44);
        if (!p || !inView(p.x, p.y)) continue;
        const ahead = Republic.columnPos(Math.min(1, q.t / q.dur), Math.max(0, i * 44 - 12)) || p;
        const dir = Math.atan2(ahead.y - p.y, ahead.x - p.x);
        pixShadow(p.x, p.y + 4, 12);
        blitFig(p.x, p.y, 'shield', true, S.time * 9 + i * 1.7, dir);
      }
    }
    /* v3.34 — a courted town flies the Unlit's shutter at HALF: hung low enough to be denied */
    const ct = Republic.courted();
    if (ct && stations[ct.id] && inView(stations[ct.id].x, stations[ct.id].y)) {
      const d = stations[ct.id];
      blit(SHUTTER.half, d.x + 40, d.y + 4, 2.5, SHUTTER_PAL, false);
    }
    /* the reaper procession — a hooded file, harvesting nothing it isn't handed */
    const ev = Republic.procession();
    if (ev) for (const f of ev.file) {
      if (!inView(f.x, f.y)) continue;
      pixShadow(f.x, f.y - 2, 12);
      blitFig(f.x, f.y - 6, 'reaper', true, S.time * 5 + (f.x % 7), Math.atan2(ev.vy, ev.vx));   // v3.51: the Reaper's own figure walking the file's way, the hem swaying   // v3.50: its feet where they were, a third taller   // v3.35: the file's own glyph, facing its way
    }
    /* the Unlit's own banner — the doused lamp raised on purpose beside a rebel door (v3.34: a texel glyph) */
    for (const id of Republic.unlitList()) {
      const d = stations[id];
      if (!inView(d.x, d.y)) continue;
      blit(SHUTTER.flown, d.x + 40, d.y + 4, 2.5, SHUTTER_PAL, false);
    }
    /* the far shape — COLOSSAL: it is drawn at the size that makes the hills look wrong,
       because that is the entire point of seeing it. The additive ghost-sheet lets it read on
       any backdrop, so it lives here in the world pass with the rest of the sandbox. */
    /* the far shape draws in drawGiant, LATE — after the mist, which would otherwise bury it */
  }
  /* the grey the far shape stands in — the mist it cuts its silhouette out of: three rounded veils, each a hard step of
     alpha (the era's transparency), the outer two letting go in ordered dither so it is MIST, not a painted box — a pale
     grey laid over whatever ground is there, so the near-black shape reads on blue deep-mist, dusk brown or pale night
     alike. Baked once on the texel grid (v3.51: it was three rectangles added in world units — a white box by day, edges
     between the pixels, no hems) */
  let _giantSheet = null;
  const GIANT_SHEET = { w: 97, h: 121, ax: 48, below: 28, veils: [   // texels from the giant's foot point: centre y, radii, colour, alpha, hem (a fraction of the radius)
    { cy: -36, rx: 26, ry: 38, c: [170, 180, 191], a: 0.55, hem: 0 },
    { cy: -34, rx: 36, ry: 49, c: [142, 153, 165], a: 0.34, hem: 0.2 },
    { cy: -32, rx: 48, ry: 60, c: [118, 129, 140], a: 0.18, hem: 0.24 }] };
  function giantSheet() {
    if (_giantSheet) return _giantSheet;
    const G = GIANT_SHEET, c = document.createElement('canvas'); c.width = G.w; c.height = G.h;
    const g = c.getContext('2d'), img = g.createImageData(G.w, G.h);
    for (let j = 0; j < G.h; j++) for (let i = 0; i < G.w; i++) {
      const x = i - G.ax, y = j - (G.h - 1 - G.below);
      for (const V of G.veils) {   // the innermost veil that holds this texel
        const d = Math.hypot(x / V.rx, (y - V.cy) / V.ry);
        if (d > 1) continue;
        if (V.hem && d > 1 - V.hem && RBAY[j & 3][i & 3] / 16 >= (1 - d) / V.hem) continue;   // the hem lets go in steps
        const o = (j * G.w + i) * 4;
        img.data[o] = V.c[0]; img.data[o + 1] = V.c[1]; img.data[o + 2] = V.c[2]; img.data[o + 3] = Math.round(V.a * 255);
        break;
      }
    }
    g.putImageData(img, 0, 0);
    return _giantSheet = c;
  }
  function drawGiant(inView) {
    if (typeof Republic === 'undefined' || !S.rep) return;
    const gA = Republic.giant().act;
    if (!gA || !inView(gA.x, gA.y, 520)) return;
    /* the mist passes ran in SCREEN space and left the transform there — restore the WORLD
       transform the frame saved, so these world coords land on the ground, not off-buffer */
    cx.setTransform(curZw, 0, 0, curZw, lastWtx, lastWty);
    const G = GIANT_SHEET;
    blitFigure(giantSheet(), G.w, G.h, gA.x, gA.y + G.below * rigT(), G.ax);
    /* the shape itself (v3.51: the registry's own rows — legs, knee housings, the hull over the mist, the shoulder blocks,
       the small head wrong for the hull, dusk finding its top edges): near-black, OPAQUE — a hole punched in the ghost-light */
    const d = blitFig(gA.x, gA.y, 'giant', false, 0, 0, { fc: 'S', frame: 'idle' }), eye = d.F.eye;
    /* the one running light — a machine's red eye in the grey, pulsing slow. Reads on ANYTHING. */
    const bl = (Math.sin(S.time * 1.3) + 1) / 2, q = figAt(d, gA.x, gA.y, eye[0] + 0.5, eye[1] + 0.5);
    cx.globalCompositeOperation = 'lighter';
    glowShells(q.x, q.y, 10 + bl * 4, `rgba(224,80,60,${0.5 + bl * 0.4})`);
    cx.globalCompositeOperation = 'source-over';
    figStamp(d, gA.x, gA.y, [[eye[0], eye[1], bl > 0.5 ? '#ff8a6a' : '#c25038']]);   // the eye
  }

  function drawCamps(inView, dt) {
    for (const cd of DATA.camps) {
      const cs = S.camps[cd.id];
      if (!inView(cd.x, cd.y, cd.r + 100)) continue;
      // tents: an authored hide-tent glyph, door lit by the fire
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1, tx = cd.x + Math.cos(a) * 40, ty = cd.y + Math.sin(a) * 26;
        if (cs.given) { if (typeof SPRITES !== 'undefined') blit(SPRITES.PEGS, tx - 15, ty - 2, 2.5, SPRITES.HIDE_PAL, false); continue; }   // v3.49: the fighters took the hides — the pegs are left in the ground
        /* v3.34: a HELD camp pitches Farkeep grey — the mountain's canvas, not the raiders' hide */
        const tpal = cs.taken ? { O: '#12161c', R: '#6e7a82', r: '#8d979c', D: '#ffd98f' }
          : { O: '#12100c', R: cs.pacified && !cs.wired ? '#4c4c44' : '#513e34', r: cs.pacified && !cs.wired ? '#5c5c52' : '#634c3e', D: cs.pacified ? '#c9a05a' : '#c96a48' };   // v3.48: a camp on the wire keeps its hide; its doors burn warm
        blit(TENT, tx - 15, ty - 12, 2.5, tpal, i === 1);
      }
      // the camp fire — authored frames on their logs, wearing a corona
      cx.globalCompositeOperation = 'lighter';
      glowShells(cd.x, cd.y - 5, 15 + (((S.time * 6) | 0) % 2) * 2, cs.pacified ? 'rgba(255,214,140,1)' : 'rgba(255,150,90,1)');
      cx.globalCompositeOperation = 'source-over';
      blit(FIRE_F[((S.time * 6) | 0) % 3], cd.x - 8.75, cd.y - 15, 2.5, FIRE_PAL, false);
      if (cs.given && typeof SPRITES !== 'undefined') {   // v3.49 THE RING GIVEN — the fire a rest stop's hearth: stones round it, the sign on its post
        blit(SPRITES.HEARTH_STONES, cd.x - 13.75, cd.y - 2.5, 2.5, SPRITES.SETTLE_PAL, false);
        pixShadow(cd.x - 44 + 8.75, cd.y + 2, 7); blit(SPRITES.RESTSIGN, cd.x - 44, cd.y - 28, 2.5, SPRITES.REST_PAL, false);
        if (cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 520) plabel(`${cd.name.toUpperCase()} — GIVEN · A REST STOP`, cd.x, cd.y + 62, 3, '#ffd98f');   // under the box, not across it
      }
      // stash
      if (cs.stash.length && !cs.taken) { cx.fillStyle = '#c9b98a'; cx.fillRect(cd.x + 24, cd.y - 8, 14, 12); cx.fillRect(cd.x + 30, cd.y - 16, 12, 10); }   // a watchpost piles its salvage in crates instead
      /* v3.41 — the camp's CHIEF keeps the fire: the camp's own, standing by the flames of a live camp */
      if (!cs.pacified && !cs.taken && !cs.storm && (cd.roll || []).includes('chief') && typeof SPRITES !== 'undefined') {
        const rt = typeof Republic !== 'undefined' && Republic.chiefReturn ? Republic.chiefReturn(cd) : null;
        /* the stake stands in ONE place beside the fire through the whole of it — rag on it while the chief is
           gone, rag down when the new one takes it, bare a day after — so the eye never sees a pole move */
        const SX = cd.x - 70, SY = cd.y - 6;
        if (rt) {
          /* v3.43 — the new chief walks in from the ring's edge and takes the rag down: a scene, seen */
          pixShadow(SX + 9, SY + 33, 7);
          blit(rt.t < 6 ? SPRITES.RAGSTAKE : SPRITES.BARESTAKE, SX, SY, 2.5, SPRITES.RAGSTAKE_PAL, false);
          if (rt.x !== undefined) { pixShadow(rt.x, rt.y + 6, 13); blitFig(rt.x, rt.y, Republic.chiefKit ? Republic.chiefKit(cd, true) : 'chief', rt.t < 6, S.time * 12 + rt.wa, Math.atan2(rt.ty - rt.y0, rt.tx - rt.x0)); }   // v3.44: a different man walks in
          if (cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 420) plabel(rt.t < 6 ? 'A CHIEF COMES UP' : 'THE RAG COMES DOWN', cd.x - 30, cd.y + 34, 2, '#c9553a');
        } else if (typeof Republic !== 'undefined' && Republic.chiefGone && Republic.chiefGone(cd)) {
          /* v3.42 — the chief who did not get up: the red rag on a stake where he stood */
          pixShadow(SX + 9, SY + 33, 7);
          blit(SPRITES.RAGSTAKE, SX, SY, 2.5, SPRITES.RAGSTAKE_PAL, false);
          if (cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 420) plabel('THE CHIEF — GONE', cd.x - 30, cd.y + 34, 2, '#8a8578');
        } else {
          if (typeof Republic !== 'undefined' && Republic.stakeBare && Republic.stakeBare(cd)) { pixShadow(SX + 9, SY + 33, 7); blit(SPRITES.BARESTAKE, SX, SY, 2.5, SPRITES.RAGSTAKE_PAL, false); }   // the pole stands a day beside the fire
          pixShadow(cd.x - 30, cd.y + 24, 13);
          blitFig(cd.x - 30, cd.y + 18, Republic.chiefKit ? Republic.chiefKit(cd) : 'chief', false, 0, Math.PI);   // v3.44: the man the camp has now
          const grudge = Republic.grudgeOf && Republic.grudgeOf(cd);
          if (cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 420) plabel(grudge ? 'THE CHIEF — A GRUDGE' : 'THE CHIEF', cd.x - 30, cd.y + 34, 2, grudge ? '#e0654a' : '#c9553a');
        }
      }
      // runners — v3.41: in their own kit, by trade
      if (!cs.pacified) for (const r of cs.runners) {
        cx.save(); cx.translate(r.x, r.y);
        pixShadow(0, 6, 15);
        const chasing = r.watch ? !!r.moving : r.cd <= 0 && U.dist(r.x, r.y, S.px, S.py) < cd.r;   // v3.45: at a stand they walk in, then stand and look
        const CK = typeof FACT !== 'undefined' && FACT.CAMP_CLASSES[r.cls];
        // headlamp cone toward player when hunting — a fan of solid dots on the grid. v3.46: a knife the line turned back
        // looks at nobody; a fan thrown up-screen (away from the eye) lies BEHIND the body, so it never washes the figure
        const d = U.dist(r.x, r.y, S.px, S.py), turned = r.turnedT && S.time - r.turnedT < 1.8, aC = Math.atan2(S.py - r.y, S.px - r.x);
        const cone = () => {
          cx.globalCompositeOperation = 'lighter';
          for (let dd = 14; dd < 58; dd += 9) {
            // banded falloff along the throw, dither only on the fan's rim — a cone of light, not a checker
            cx.fillStyle = `rgba(255,170,120,${dd < 30 ? 0.3 : dd < 46 ? 0.18 : 0.1})`;
            const spread = 0.28, k = Math.max(1, (dd * spread / 8) | 0);
            for (let s = -k; s <= k; s++) {
              if (Math.abs(s) === k && RBAY[(dd / 9 | 0) & 3][(s + 4) & 3] / 16 >= 0.5) continue;
              const aa = aC + (s / k) * spread;
              cx.fillRect(Math.round(Math.cos(aa) * dd / 3) * 3, Math.round((-12 + Math.sin(aa) * dd) / 3) * 3, 3, 3);
            }
          }
          cx.globalCompositeOperation = 'source-over';
        };
        const coneOn = d < cd.r + 60 && !turned, coneBack = Math.sin(aC) < -0.35;
        if (coneOn && coneBack) cone();
        blitFig(0, 0, (CK && CK.kit) || 'knife', chasing, S.time * 12 + r.wa, aC);   // v3.51: the plain runner is the knife, hood and blade, no courier's pack
        if (coneOn && !coneBack) cone();
        /* v3.46 — a knife the held line turned back carries the U of the way back over his hood a moment — clear of the hood */
        if (turned && typeof SPRITES !== 'undefined') blit(SPRITES.MARKS.turned, -8.75, -56 - (((S.time * 4) | 0) % 2) * 2.5, 2.5, SPRITES.MARK_PAL, false);
        cx.restore();
      } else if (cs.taken) {
        /* v3.34 — THE WATCHPOST: shields stand the fire in shifts under Farkeep's grey pennant,
           and the ring's salvage piles by the post. The taking is SEEN holding.
           v3.39: as many shields as the post STANDS — the third and fourth at the pennant's foot */
        const W = REP.WATCHPOST, nSh = cs.taken.shields || W.shields;
        const spots = [[-66, 34], [66, 34], [-26, -20], [30, -22]];
        for (let i = 0; i < Math.min(nSh, spots.length); i++) {
          const sx = cd.x + spots[i][0], sy = cd.y + spots[i][1];   // flanking the fire, outside the tent ring — the shields face the road
          pixShadow(sx, sy + 3, 12);
          /* standing, not marching: the idle row, every other guard flipped */
          blitFig(sx, sy, 'shield', false, 0, i % 2 ? Math.PI : 0);
        }
        blit(PENNANT, cd.x + 4, cd.y - 66, 2.5, PENNANT_PAL, ((S.time * 2) | 0) % 2 === 1);   // the grey pennant over the fire, turning in the wind
        if (cs.stash.length) blit(CRATES, cd.x + 26, cd.y + 6, 2.5, CRATES_PAL, false);     // the salvage pile, iron-grey
      } else if (cs.wired) {
        /* v3.48 THE CAMP ON THE WIRE — the knives at home round their own fire, facing it (their kits, standing easy), and the
           chief at the knives' board by the door: he keeps it now */
        if (typeof SPRITES !== 'undefined') {
          const home = (cd.roll || []).filter(k => k !== 'chief'), spots = [[26, -30, Math.PI], [-52, 0, 0]];   // two at the fire, clear of the tents and the door
          home.slice(0, spots.length).forEach((cls, i) => {
            const [ox, oy, dir] = spots[i], CK = typeof FACT !== 'undefined' && FACT.CAMP_CLASSES[cls];
            pixShadow(cd.x + ox, cd.y + oy + 6, 13);
            blitFig(cd.x + ox, cd.y + oy, (CK && CK.kit) || 'knife', false, 0, dir);
          });
          const d = DATA.stations[cs.wired.id];
          if (d) {
            const kx = d.x - 34, ky = d.y + 4;   // beside the board, not over it
            pixShadow(kx, ky + 6, 13); blitFig(kx, ky, cs.wired.kit || 'chief', false, 0, 0);
            if (cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 420) plabel('THE CHIEF — KEEPS THE DOOR', kx, ky + 16, 2, '#ffc978');
          }
        }
      } else if (cs.given) {
        /* v3.49 — the fighters leaving for the hills, their hides rolled on their backs, the far side of the ring from your line */
        const g = cs.given, k = S.time - g.t, seen = [];
        if (!g.left && typeof SPRITES !== 'undefined') g.figs.forEach((f, i) => {
          const walkT = Math.max(0, k - 1.2 - i * 0.5), d2 = walkT * DATA.T.siege.speed * 1.1, fx = cd.x + f.ox + g.dir.x * d2, fy = cd.y + 10 + f.oy + g.dir.y * d2;
          if (!inView(fx, fy, 40) || d2 > DATA.T.given.leave * DATA.T.siege.speed) return;
          seen.push([fx, fy]);
          const dir = Math.atan2(g.dir.y, g.dir.x), CK = typeof FACT !== 'undefined' && FACT.CAMP_CLASSES[f.cls];
          pixShadow(fx, fy + 6, 13);
          const kit = (CK && CK.kit) || 'knife', d = figDrawn(kit, walkT > 0, S.time * 12 + i, dir), A = d.F.at && d.F.at[d.fc];   // v3.51: the rolled hide lashed on the back, by the facing
          const hide = A ? glyphCells(SPRITES.BUNDLE, SPRITES.HIDE_PAL, A.bundle[0], A.bundle[1] + d.dy, false) : [];
          if (A && A.bundleBack) figStamp(d, fx, fy, hide);
          blitFig(fx, fy, kit, walkT > 0, S.time * 12 + i, dir);
          if (A && !A.bundleBack) figStamp(d, fx, fy, hide);
        });
        if (!g.left && seen.length && k < DATA.T.given.leave && cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 620)   // the words ride under the group's feet, never across a face
          plabel('THEY LEAVE FOR THE HILLS', seen.reduce((a, p) => a + p[0], 0) / seen.length, Math.max(...seen.map(p => p[1])) + 24, 3, '#c9553a', { first: true });
      } else {
        // neutral wanderers wave — v3.51: the valley's wanderer, hat and staff, raising a hand as you come near (it was two grey rectangles)
        const near = U.dist(S.px, S.py, cd.x - 57, cd.y + 17) < 260;
        pixShadow(cd.x - 57, cd.y + 21, 13);
        blitFig(cd.x - 57, cd.y + 17, 'wanderer', false, 0, Math.PI / 2, { fc: 'S', frame: near && ((S.time * 1.6) | 0) % 2 ? 'wave' : undefined });
      }
      /* v3.40 — THE STORM, SEEN: the knives walk for the fire, each in their own kit; a knocked knife lies where it fell
         (v3.51: its own side view turned a quarter — every texel a texel) */
      if (cs.storm && cs.taken) {
        for (const k of cs.storm.knives) {
          if (!inView(k.x, k.y, 40)) continue;
          const down = k.cd > 0, dir = cs.storm.broke ? Math.atan2(k.y - cd.y, k.x - cd.x) : Math.atan2(cd.y - k.y, cd.x - k.x);
          const CK = typeof FACT !== 'undefined' && FACT.CAMP_CLASSES[k.cls], kit = CK && CK.kit && typeof SPRITES !== 'undefined' ? CK.kit : null;
          pixShadow(k.x, k.y + 6, down ? 26 : 15);
          if (down) { blitFigDown(k.x, k.y, kit || 'knife', dir); plabel(k.cls === 'chief' ? 'THE CHIEF — DOWN' : 'DOWN', k.x, k.y + 16, 2, k.cls === 'chief' ? '#ffd98f' : '#8a8578'); }
          else blitFig(k.x, k.y, kit || 'knife', true, S.time * 12 + k.wa, dir);
          if (!down && CK && k.cls !== 'knife' && cam.z > 0.7 && U.dist(S.px, S.py, k.x, k.y) < 420) plabel(CK.name.toUpperCase(), k.x, k.y + 16, 2, k.cls === 'chief' ? '#c9553a' : '#8a8578');
        }
        if (cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 620) plabel(`THE STORM — ${Math.max(0, Math.round(cs.storm.dur - cs.storm.t))}s TO HOLD`, cd.x, cd.y - 84, 3, '#e0654a');
      }
      /* v3.40 — the Society's stencil: a raised tongue on a post, where they counted the camp */
      if (cs.sold) {   // v3.41: the count bought — the stencil stays, with the Order's lamp under the tongue
        blit(STENCIL_SOLD, cd.x + 60, cd.y - 36, 2.5, STENCIL_PAL, false);
        if (cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 520) plabel('COUNTED — SOLD TO THE ORDER', cd.x + 70, cd.y - 52, 3, '#8fb08a');
      } else if (cs.swept && S.time - cs.swept < REP.EVENTS.bunkerSweep.sweptDur) {
        blit(STENCIL, cd.x + 52, cd.y - 30, 2.5, STENCIL_PAL, false);
        if (cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 520) plabel('COUNTED — THE SOCIETY', cd.x + 60, cd.y - 36, 3, '#8fb08a');
      }
      /* v3.39 — a post that FELL: the grey pennant lies in the ring for a while, the pole across it */
      if (cs.lost && S.time - cs.lost.t < REP.WATCHPOST.storm.fallenDur && !cs.taken) {
        blit(FALLEN, cd.x - 40, cd.y + 44, 2.5, PENNANT_PAL, false);
        if (cam.z > 0.7 && U.dist(S.px, S.py, cd.x, cd.y) < 520) plabel('THE POST FELL', cd.x - 20, cd.y + 62, 3, '#8d979c');
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
    let tier = 0; const lv = typeof S !== 'undefined' && S ? (S.level || 0) : 0;   // v3.45: the passage reads a slot's face before any walker stands
    for (let i = 0; i < DATA.titles.length; i++) if (lv >= DATA.titles[i][0]) tier = i;
    return { ...PAL_WALKER, ...COATS[Math.min(3, tier >> 1)] };
  }
  /* v3.19 — GEAR IS WORN, not listed: the coat you equipped recolours the coat texels, the boots
     recolour the boots. Rank dresses the default coat; a bought coat wins over rank (attachment-swap
     law from the pixel-systems research: same rig, new cluster palette). */
  const COAT_WEAR = {
    coat_wax: { C: '#5a5a34', c: '#46462a', T: '#c9a05a', t: '#a5824a' },
    coat_high: { C: '#6e4a4a', c: '#573a3a', T: '#d8cfae', t: '#b8b09a' },
    coat_lumen: { C: '#2a3038', c: '#20262e', T: '#6fe3d2', t: '#57c0b2' },
  };
  const BOOT_WEAR = {
    boots0: { B: '#23282f', b: '#171b21' },
    boots_tread: { B: '#5a4a30', b: '#42361f' },
    boots_cleat: { B: '#4a5560', b: '#33404d' },
    boots_grey: { B: '#3a4258', b: '#2a3048' },
  };
  function wornPal() {
    const pal = coatFor();
    if (S.look) Object.assign(pal, S.look);   // v3.23: the coat THEY cut — identity under the gear
    const eq = S.equip || {};
    if (eq.coat && COAT_WEAR[eq.coat.defId]) Object.assign(pal, COAT_WEAR[eq.coat.defId]);
    if (eq.boots && BOOT_WEAR[eq.boots.defId]) Object.assign(pal, BOOT_WEAR[eq.boots.defId]);
    return pal;
  }
  /* a standalone courier portrait for chargen, the tailor and the equip sheet: the figure cropped from its 32×32 frame
     (toward the eye, head to boots, 16×24 texels — the old portrait's own 2:3), at a whole-texel scale */
  const COURIER_CROP = { S: [8, 7, 16, 24], E: [3, 7, 20, 24], N: [6, 7, 20, 24] };
  function courierCrop(pal, fc, frame, scale, bg) {
    const [x0, y0, w, h] = COURIER_CROP[fc], sp = courierSprite(pal, fc, frame, false), c = document.createElement('canvas');
    c.width = w * scale; c.height = h * scale;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); }
    g.drawImage(sp, x0, y0, w, h, 0, 0, c.width, c.height);
    return c;
  }
  function rigPreviewURL(look, scale = 8, frame = 'idle') {
    return courierCrop({ ...PAL_WALKER, ...(look || {}) }, 'S', frame, scale).toDataURL();
  }
  /* v3.36 — a walker's OWN figure for the muster roll: the same palette law drawNpcFigure walks
     (hood and scarf from the seed; Farkeep grey for the mountain; the kit's registry row for a
     drawn class), rendered to a data URL at a whole-texel scale — no stand-in portraits */
  /* v3.43 — the keeper's FACE: the registry's 16×16 bust in its own colours, at a whole-texel scale */
  const faceCache = new Map();
  function faceURL(stId, scale = 4) {
    /* v3.48 — a camp on the wire: its keeper is the chief who was at the fire when the relay went up */
    if (stations[stId] && stations[stId].post) { const c = S.camps[stations[stId].camp]; return chiefFaceURL((c && c.wired && c.wired.kit) || 'chief', scale); }
    const key = stId + '|' + scale; if (faceCache.has(key)) return faceCache.get(key);
    const F = typeof SPRITES !== 'undefined' && SPRITES.FACES && SPRITES.FACES[stId]; if (!F) return '';
    const sp = glyphSprite(F.rows, F.pal, false), c = document.createElement('canvas'); c.width = 16 * scale; c.height = 16 * scale;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#10161f'; g.fillRect(0, 0, c.width, c.height); g.drawImage(sp, 0, 0, c.width, c.height);
    const url = c.toDataURL(); faceCache.set(key, url); return url;
  }
  /* v3.44 — the Walker's own face: the keepers' 16×16 grammar in the Walker's colours — the hood and skin they
     cut at the tailor, the coat and its trim from the worn palette — so the bust answering a keeper is the person
     in the coat. Cached by the look. */
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + ((f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).padStart(6, '0'); };
  function walkerFacePal(look) {
    const base = typeof SPRITES !== 'undefined' ? SPRITES.WALKER_FACE_PAL : {}, w = look ? { ...coatFor(), ...look } : (typeof S !== 'undefined' && S ? wornPal() : coatFor()), pal = { ...base };
    if (w.H) { pal.K = w.H; pal.k = shade(w.H, 0.72); pal.I = lightHex(w.H, 0.2); }   // v3.51: the hood's light rim, as the courier's
    if (w.S) { pal.S = w.S; pal.s = shade(w.S, 0.82); }
    if (w.C) pal.C = w.C; if (w.c) pal.c = w.c; if (w.T) { pal.R = w.T; pal.r = w.t || darkHex(w.T, 0.8); }   // the scarf and its shade
    return pal;
  }
  function walkerFaceURL(scale = 4, look) {   // look: a stone's own coat (the row keeps it), else the living walker's
    if (typeof SPRITES === 'undefined' || !SPRITES.WALKER_FACE) return '';
    const pal = walkerFacePal(look), key = 'walker|' + scale + '|' + Object.values(pal).join(''); if (faceCache.has(key)) return faceCache.get(key);
    const sp = glyphSprite(SPRITES.WALKER_FACE, pal, false), c = document.createElement('canvas'); c.width = 16 * scale; c.height = 16 * scale;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#10161f'; g.fillRect(0, 0, c.width, c.height); g.drawImage(sp, 0, 0, c.width, c.height);
    const url = c.toDataURL(); faceCache.set(key, url); return url;
  }
  /* v3.45 — THE HANDS' FACES: a hand's bust from their seed and their trade (the registry composes the layers);
     a mountain hire wears the helm, the town's own the flat cap. Cached by seed, trade and scale. */
  const tradeOf = n => !n ? 'courier' : n.fk ? 'farkeep' : (n.kit === 'townshield' || n.own) ? 'town' : (SPRITES.HANDS.trades[n.cls] ? n.cls : 'courier');
  function handFaceURL(n, scale = 2) {
    if (typeof SPRITES === 'undefined' || !SPRITES.handFace || !n) return '';
    const trade = tradeOf(n), seed = (n.seed | 0) >>> 0, key = 'hand|' + seed + '|' + trade + '|' + scale; if (faceCache.has(key)) return faceCache.get(key);
    const f = SPRITES.handFace(seed, trade), sp = glyphSprite(f.rows, f.pal, false), c = document.createElement('canvas'); c.width = 16 * scale; c.height = 16 * scale;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#10161f'; g.fillRect(0, 0, c.width, c.height); g.drawImage(sp, 0, 0, c.width, c.height);
    const url = c.toDataURL(); faceCache.set(key, url); return url;
  }
  function chiefFaceURL(kit, scale = 4) {
    if (typeof SPRITES === 'undefined' || !SPRITES.CHIEF_FACES) return '';
    const F = SPRITES.CHIEF_FACES[kit] || SPRITES.CHIEF_FACES.chief, key = 'chief|' + kit + '|' + scale; if (faceCache.has(key)) return faceCache.get(key);
    const sp = glyphSprite(F.rows, F.pal, false), c = document.createElement('canvas'); c.width = 16 * scale; c.height = 16 * scale;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#10161f'; g.fillRect(0, 0, c.width, c.height); g.drawImage(sp, 0, 0, c.width, c.height);
    const url = c.toDataURL(); faceCache.set(key, url); return url;
  }
  /* v3.44 — the manual's plates for the wound: the Walker's rig with the bolt in, the scar, the dressing —
     composed from the registry's own rows at whole texels, never drawn twice */
  function rigOverlayURL(kind, scale = 3) {   // v3.50: on the courier's side view, at the anchors the game stamps them
    if (typeof SPRITES === 'undefined') return '';
    const key = 'rig|' + kind + '|' + scale; if (faceCache.has(key)) return faceCache.get(key);
    const c = courierCrop(wornPal(), 'E', 'idle', scale, '#10161f'), g = c.getContext('2d'), [x0, y0] = COURIER_CROP.E, A = SPRITES.COURIER.at.E;
    const cells = kind === 'bolt' ? glyphCells(SPRITES.ARROW_IN, SPRITES.ARROW_PAL, A.bolt[0], A.bolt[1], false)
      : glyphCells(kind === 'dressed' ? SPRITES.DRESSING : SPRITES.SCAR, SPRITES.SCAR_PAL, A.scar[0], A.scar[1], false);
    for (const [cc, r, col] of cells) { g.fillStyle = col; g.fillRect((cc - x0) * scale, (r - y0) * scale, scale, scale); }
    const url = c.toDataURL(); faceCache.set(key, url); return url;
  }
  /* v3.51 — a figure on paper: its own frame toward the eye, cropped to what it draws (crown to boots, hand to hand) at a
     whole-texel scale — the town's own, a Farkeeper hire, the camps' own; a courier hand keeps the courier's 16×24 crop */
  const figBoxCache = {};
  function figBox(name) {
    let b = figBoxCache[name]; if (b) return b;
    const rows = SPRITES.FIG[name].frames.S.idle;
    let x0 = 99, y0 = 99, x1 = -1, y1 = -1;
    rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } });
    return figBoxCache[name] = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }
  const figOf = npc => npc && npc.kit && SPRITES.FIG[npc.kit] ? npc.kit : npc && npc.fk ? (SPRITES.FIG[npc.fkCls] ? npc.fkCls : 'pugugly') : null;
  function npcRigSize(npc, scale = 4) {
    const k = figOf(npc); if (!k) return [16 * scale, 24 * scale];
    const b = figBox(k); return [b.w * scale, b.h * scale];
  }
  function npcRigURL(npc, scale = 4) {
    const k = figOf(npc);
    if (k) {
      const b = figBox(k), sp = figSprite(k, 'S', 'idle', false), c = document.createElement('canvas'), g = c.getContext('2d');
      c.width = b.w * scale; c.height = b.h * scale; g.imageSmoothingEnabled = false;
      g.drawImage(sp, b.x, b.y, b.w, b.h, 0, 0, c.width, c.height);
      return c.toDataURL();
    }
    return courierCrop(handPal(npc), 'S', 'idle', scale).toDataURL();   // v3.50: the courier toward the eye, 16×24
  }
  /* a hand's colours: the mate's coat under their own hood and scarf, from their seed (v3.51: the scarf's shade derived
     from the scarf, not left at the mate's tan) */
  function handPal(npc) {
    const rg = U.rng(npc ? npc.seed : 7);
    const hood = U.pick(rg, CHAR.PORTRAIT.hoods), scarf = U.pick(rg, CHAR.PORTRAIT.scarves);
    return { ...PAL_MATE, C: hood, T: scarf, t: darkHex(scarf, 0.8) };
  }
  /* =============== v3.19 THE BODY REMEMBERS — the pack is authored =============== */
  const CG = {
    crate: { rows: ['OOOOOOOO', 'OPpPPpPO', 'OBBBBBBO', 'OPpPPpPO', 'OOOOOOOO'] },
    med: { rows: ['OOOOOOOO', 'OPPWWPPO', 'OPWWWWPO', 'OPPWWPPO', 'OOOOOOOO'] },
    tin: { rows: ['OOOOOOOO', 'OttttttO', 'OTlTTlTO', 'OttttttO', 'OOOOOOOO'] },
    bale: { rows: ['.OOOOOO.', 'OXXXXXXO', 'OxXXXXxO', 'OXXXXXXO', '.OOOOOO.'] },
    sack: { rows: ['..OOO...', '.OKKKO..', 'OKKkKKO.', 'OKkKKKO.', '.OOOOO..'] },
    drum: { rows: ['.OOOOOO.', 'ODDDDDDO', 'OBBBBBBO', 'ODdDDdDO', '.OOOOOO.'] },
    cell: { rows: ['OOOOOOOO', 'OMMMMMMO', 'OMWWWWMO', 'OOOOOOOO'] },
    mail: { rows: ['.OOOOOO.', 'OLLWWLLO', 'OLLLLLLO', '.OOOOOO.'] },
    parcel: { rows: ['.OOOOOO.', 'OXXlXXXO', 'OllllllO', 'OXXlXXWO', '.OOOOOO.'] },   // v3.41: brown paper, the string crossed, a tag at the corner
    parcelTorn: { rows: ['.OOOOOO.', 'OXXlXX.O', 'Oll.XXXO', 'OX.XlXWO', '.OOOOOO.'] },   // v3.42: the string snapped, a corner torn — the town's grievance
    parcelSworn: { rows: ['.OOOOOO.', 'OXRrRXXO', 'OXXRXXXO', 'OXXRXXWO', '.OOOOOO.'] },   // v3.44: the SWORN string — your word rides the crate in rust: a knot on top, the string down the paper
    parcelSealed: { rows: ['.OOOOOO.', 'OWwWWwWO', 'OWWRrWWO', 'OWWrRWWO', '.OOOOOO.'] },   // v3.45: the keeper's own sealed letter — the errand
    kinShield: { rows: ['.OOOOOO.', 'OYYyyYYO', 'OYydDyYO', 'OYYyyYYO', '.OOOOOO.'] },     // v3.45: the fallen's round shield, carried home
    kinLantern: { rows: ['..OOOO..', '.OFffFO.', '.OfFFfO.', '.OFffFO.', '..OYYO..'] },     // v3.45: the fallen's lantern, lit at a waylight
    kinLanternDark: { rows: ['..OOOO..', '.ODddDO.', '.OdDDdO.', '.ODddDO.', '..OYYO..'] },
    fireGift: { rows: ['..OOOO..', '.OxPxxO.', 'OxxPxxxO', 'OPPpPPPO', 'OXxPxxXO', '.OOOOOO.'] },
    relayKit: { rows: ['.OTO....', 'OTFTO...', '.OPO.OO.', '.OPOOYYO', 'OOPOYyYO', 'OPPOOYYO'] },   // v3.48: the relay kit — the lamp head on its poles, the wire coiled   // v3.47: the gift for a camp's fire — cloth tied with twine, the knot where it crosses: the road's price
    wireCoil: { rows: ['..OOOO..', '.OYyYyO.', 'OYyYyYyO', 'OyYyYyYO', '.OYyYyO.', '..OOOOF.'] },   // v3.49: the splice coil — copper wound round, its end loose
    core: { rows: ['OOOOOOOO', 'OGGGGGGO', 'OGWWWWGO', 'OGGGGGGO', 'OOOOOOOO'] },
    ingot: { rows: ['.OOOO...', 'OmTTTO..', 'OOOOOOO.', 'OTTTmTO.', 'OOOOOOO.'] },
    slab: { rows: ['OOOOOOO.', 'OCcCCCO.', 'OOOOOOO.', 'OcCCCcO.', 'OOOOOOO.'] },
  };
  const CG_BASE = { O: '#12161c', P: '#6b4a30', p: '#8a6a42', W: '#f2ead4', T: '#8a8f98', t: '#6e747c', l: '#d8dde2', L: '#8a6534', X: '#9a8468', x: '#c2ab89', K: '#b3a06a', k: '#8a7a4e', D: '#5a626c', d: '#7a828c', M: '#2c8a7c', G: '#ffc978', m: '#9aa2ab', C: '#9a8468', c: '#c2ab89', B: '#b3a06a', R: '#c9553a', r: '#8a3a2c', w: '#c9c3a8', Y: '#a08050', y: '#6e5a42', F: '#ffd98f', f: '#e0a05e' };
  const DUFFEL = { rows: ['.OOOOOOO.', 'OGGgGGgGO', 'OgGGGGGGO', '.OOOOOOO.'], pal: { O: '#12161c', G: '#5a5342', g: '#6b6349' } };
  function cargoGlyphFor(c) {
    if (c.cat === 'contra') {
      // the quiet work rides in outlaw green — it is NOT the Order's cargo and never reads gold
      const pal = { ...CG_BASE, X: '#4a6e3a', x: '#5f8a4a', O: '#101408' };
      const rows = CG.bale.rows.slice();
      rows[rows.length - 2] = rows[rows.length - 2].replace(/[^.]/g, 'X');
      return { rows, pal, glow: null };
    }
    const gold = !!(c.lostTo || c.orderId);
    const pal = { ...CG_BASE };
    let key = 'crate', glow = null;
    if (c.cat === 'core') { key = 'core'; glow = 'rgba(255,214,140,0.45)'; }
    else if (c.cat === 'mat') key = c.mat === 'ceramic' ? 'slab' : c.mat === 'lumen' ? 'cell' : 'ingot';
    else if (c.defId === 'letters' || c.defId === 'dispatch') key = 'mail';
    else if (c.defId === 'parcel') key = c.sealed ? 'parcelSealed' : c.sworn ? 'parcelSworn' : c.grieved ? 'parcelTorn' : 'parcel';   // v3.44: the sworn string outranks the tear; v3.45: the keeper's seal outranks both
    else if (c.defId === 'kinShield') key = 'kinShield';
    else if (c.defId === 'kinLantern') { key = c.lit ? 'kinLantern' : 'kinLanternDark'; if (c.lit) glow = 'rgba(255,214,140,0.5)'; }
    else if (c.defId === 'fireGift') key = 'fireGift';   // v3.47: the road's gift rides the tower
    else if (c.defId === 'relayKit') key = 'relayKit';   // v3.48: the relay kit
    else if (c.defId === 'wireCoil') key = 'wireCoil';   // v3.49: the splice coil
    else if (c.defId === 'meds') key = 'med';
    else if (c.defId === 'food' || c.defId === 'warmmeal') key = 'tin';
    else if (c.defId === 'textiles') key = 'bale';
    else if (c.defId === 'seeds' || c.defId === 'seedlings') key = 'sack';
    else if (c.defId === 'filters' || c.defId === 'coolant') { key = 'drum'; pal.B = c.defId === 'coolant' ? '#4a8ad0' : '#7aa2a0'; }
    else if (c.defId === 'lumenCell') { key = 'cell'; glow = 'rgba(140,240,225,0.4)'; }
    if (c.cat === 'mat' && c.mat === 'lumen') glow = 'rgba(140,240,225,0.35)';
    let rows = CG[key].rows;
    if (gold && key !== 'core') {
      pal.B = '#ffd98f'; pal.O = '#241708';
      if (key === 'mail') pal.W = '#ffd98f';
      else { rows = rows.slice(); const bi = rows.length - 2; rows[bi] = rows[bi].replace(/[^.]/g, 'B'); }   // THE LAW: every bound crate wears the band
    }
    return { rows, pal, glow };
  }
  /* the EQUIPPED frame holds the tower — wide rails, the rig's gold strap, the exo's live struts. v3.50: texels on the
     courier's grid, up the facing's rail columns from the pack's foot to over the tower's top */
  const RAILS = { pack_wide: ['#3a3428', '#4a4432'], pack_rig: ['#4a5560', '#c9a05a'], pack_exo1: ['#8d979c', '#6fe3d2'], pack_exo2: ['#8d979c', '#6fe3d2'] };
  function railCells(A, dy, towerTop) {
    const eq = S.equip && S.equip.pack ? S.equip.pack.defId : 'pack0', R = RAILS[eq];
    if (!R) return [];
    const foot = A.railFoot + dy, top = Math.min(towerTop - 1, foot - 9), cells = [];
    for (const rc of A.rails) {
      const cols = eq === 'pack_wide' ? [rc, rc + (rc < 16 ? -1 : 1)] : [rc];
      for (let r = top; r <= foot; r++) for (const c of cols) cells.push([c, r, r === top ? '#12161c' : R[0]]);
      if (eq === 'pack_exo1' || eq === 'pack_exo2') { cells.push([rc, foot, R[1]], [rc, foot - 1, R[1]]); if (eq === 'pack_exo2') cells.push([rc, top + 1, R[1]], [rc, top + 2, R[1]]); }
    }
    if (eq === 'pack_rig') { const mid = Math.round((top + foot) / 2), [c0, c1] = A.rails.length > 1 ? A.rails : [A.rails[0], A.rails[0]]; for (let c = c0; c <= c1; c++) cells.push([c, mid, R[1]]); }
    if (eq === 'pack_wide' && A.rails.length > 1) for (let c = A.rails[0]; c <= A.rails[1]; c++) cells.push([c, foot, R[1]]);
    return cells;
  }
  /* v3.43 — texels stamped ON the rig share the rig's snap: the same buffer origin blitCourier rounds to, so a scar, a
     dressing, a bolt, a lantern or snow lands on whole buffer pixels WITH the coat — never a half-texel off it, never
     anti-aliased into the colours beneath. cells: [column, row, colour] on the courier's 32×32 grid (a row may run above
     it — the tower of cargo stands over the frame). Under a rotated context (the survey) it draws in world units. */
  function rigAt(x, y, c, r) {
    const k2 = rigK(), m = cx.getTransform();
    if (Math.abs(m.b) > 0.001) { const tw = k2 / curZw; return { x: x + (c - 16) * tw, y: y + 5 + (r - 32) * tw }; }
    const bx = Math.round(x * m.a + m.e) - 16 * k2, by = Math.round((y + 5) * m.d + m.f) - 32 * k2;
    return { x: (bx + c * k2 - m.e) / m.a, y: (by + r * k2 - m.f) / m.d };
  }
  function rigStamp(x, y, cells, op) {
    const k2 = rigK(), m = cx.getTransform();
    if (op) cx.globalCompositeOperation = op;
    if (Math.abs(m.b) > 0.001) { const tw = k2 / curZw; for (const [c, r, col] of cells) { cx.fillStyle = col; cx.fillRect(x + (c - 16) * tw, y + 5 + (r - 32) * tw, tw, tw + 0.05); } if (op) cx.globalCompositeOperation = 'source-over'; return; }
    const bx = Math.round(x * m.a + m.e) - 16 * k2, by = Math.round((y + 5) * m.d + m.f) - 32 * k2;
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0);
    for (const [c, r, col] of cells) { cx.fillStyle = col; cx.fillRect(bx + c * k2, by + r * k2, k2, k2); }
    cx.restore();
    if (op) cx.globalCompositeOperation = 'source-over';
  }
  /* a registry glyph as cells on the courier's grid, its top-left at (c0, r0); mirrored in place when flip */
  function glyphCells(rows, pal, c0, r0, flip) {
    const cells = [], w = rows[0].length;
    rows.forEach((row, j) => { for (let i = 0; i < w; i++) { const ch = row[flip ? w - 1 - i : i]; if (ch === '.') continue; cells.push([c0 + i, r0 + j, pal[ch] || '#f0f']); } });
    return cells;
  }
  const mirrorCells = (cells, flip) => flip ? cells.map(([c, r, col]) => [31 - c, r, col]) : cells;
  /* v3.42/43 — the bolt in the back shoulder, fletching out, until it is pulled; then the scar it left, and the dressing
     wound over it. v3.50: at the facing's own anchors (the bolt is in the back shoulder: from the eye's side, only its
     fletching shows over the shoulder, and a scar on the back does not show at all) */
  function boltCells(drawn, dy) {
    const A = SPRITES.COURIER.at[drawn.fc];
    return mirrorCells(glyphCells(SPRITES.ARROW_IN, SPRITES.ARROW_PAL, A.bolt[0], A.bolt[1] + dy, A.boltFlip), drawn.flip);
  }
  function scarCells(drawn, dy, dressed) {
    const A = SPRITES.COURIER.at[drawn.fc]; if (!A.scar) return [];
    return mirrorCells(glyphCells(dressed ? SPRITES.DRESSING : SPRITES.SCAR, SPRITES.SCAR_PAL, A.scar[0], A.scar[1] + dy, false), drawn.flip);
  }
  /* the snow the body collected — the hood first, then the shoulders and the pack's top, then a cap in full: laid on the
     top texel of every column of the frame drawn (it sits on the silhouette, whatever the step) */
  const snowCache = new Map();
  function snowCells(drawn, amt) {
    const stage = amt >= 0.85 ? 3 : amt >= 0.55 ? 2 : 1, key = drawn.fc + drawn.frame + stage;
    let cells = snowCache.get(key);
    if (!cells) {
      const rows = SPRITES.COURIER.frames[drawn.fc][drawn.frame], SN = '#e8f2f8', sn = '#c2d4e0';
      cells = [];
      for (let c = 0; c < 32; c++) {
        let r = 0; while (r < 32 && rows[r][c] === '.') r++;
        if (r >= 32) continue;
        const below = rows[Math.min(31, r + 1)][c], hood = 'HIh'.includes(below), top = 'PpTtYLCu'.includes(below);
        if (hood || (stage >= 2 && top)) { cells.push([c, r, (c % 3) ? SN : sn]); if (stage >= 3 && r > 0) cells.push([c, r - 1, (c % 2) ? SN : sn]); }
      }
      snowCache.set(key, cells);
    }
    return mirrorCells(cells, drawn.flip);
  }

  /* =============== v3.19: leaves on the wind — the MIVIM law of alive ===============
     A gust puts leaves in MOTION. A leaf whose path crosses the walker either deflects off the
     coat, sticks to it a moment and drops, or passes clean behind — it never hit. A leaf that
     misses never changes its line. Sparse by law: a gust is an event, not a screensaver. */
  const leavesA = [];
  let gustT = 7, leafId = 1;
  const LEAF_COLS = [['#8a9a4a', '#6e7e3a'], ['#b0a04e', '#94824a']];
  function spawnGust(n) {
    const count = n || 4 + (Math.random() * 4 | 0);
    const a = Math.random() * Math.PI * 2;
    const sx0 = S.px + Math.cos(a) * 190, sy0 = S.py + Math.sin(a) * 190;
    const dir = a + Math.PI + (Math.random() - 0.5) * 0.5;
    for (let i = 0; i < count && leavesA.length < T.leafMax; i++) {
      leavesA.push({
        id: leafId++, x: sx0 + (Math.random() - 0.5) * 80, y: sy0 + (Math.random() - 0.5) * 60 - 8,
        vx: Math.cos(dir) * (55 + Math.random() * 40), vy: Math.sin(dir) * (55 + Math.random() * 40) * 0.4 - 5,
        t: Math.random() * 2, ph: Math.random() * 7, life: 4 + Math.random() * 3, state: 'fly', met: false, kind: (Math.random() * 2) | 0,
      });
    }
    return count;
  }
  function updateLeaves(dt) {
    if (!S) return;
    gustT -= dt;
    if (gustT <= 0) {
      gustT = 9 + Math.random() * 13;
      const c = World.classAt(S.px, S.py);
      if ((c === World.MEADOW || c === World.FOREST) && leavesA.length < T.leafMax && Systems.snowAt(S.px, S.py) < 0.05) spawnGust();
    }
    for (let i = leavesA.length - 1; i >= 0; i--) {
      const L = leavesA[i];
      L.t += dt;
      if (L.state === 'stuck') {
        L.stickT -= dt;
        L.x = S.px + L.ox; L.y = S.py + L.oy;   // riding the coat
        if (L.stickT <= 0) { L.state = 'ground'; L.gt = 0; L.y = S.py + 2; }
        continue;
      }
      if (L.state === 'ground') { L.gt = (L.gt || 0) + dt; if (L.gt > 2.4) leavesA.splice(i, 1); continue; }
      L.vy += 2.2 * dt;
      L.vx *= (1 - 0.07 * dt);
      L.x += L.vx * dt;
      L.y += L.vy * dt + Math.sin(L.t * 6 + L.ph) * 7 * dt;
      L.life -= dt;
      if (L.life <= 0) { L.state = 'ground'; L.gt = 0; continue; }
      // the model is IN the weather: crossing the walker, a leaf deflects, sticks, or passes behind
      if (!L.met && Math.abs(L.x - S.px) < 8 && L.y > S.py - 24 && L.y < S.py + 4) {
        L.met = true;
        const roll = L.id % 3;
        if (roll === 0) { L.vx = -L.vx * 0.6 + (S.speed > 8 ? Math.cos(S.dir) * 26 : 0); L.vy = -16 - Math.random() * 8; }
        else if (roll === 1) { L.state = 'stuck'; L.ox = U.clamp(L.x - S.px, -6, 6); L.oy = U.clamp(L.y - S.py, -22, -2); L.stickT = 0.6 + (L.id % 5) * 0.15; }
        /* roll 2: passes — it was never on their line */
      }
    }
  }
  function drawLeaves(dt, inView) {
    updateLeaves(dt);
    for (const L of leavesA) {
      if (!inView(L.x, L.y, 40)) continue;
      const cols = LEAF_COLS[L.kind];
      const a = L.state === 'ground' ? Math.max(0, 1 - (L.gt || 0) / 2.4) : 1;
      cx.globalAlpha = a;
      const fx2 = Math.round(L.x / 2) * 2, fy2 = Math.round(L.y / 2) * 2;
      const tumble = L.state === 'fly' ? ((L.t * 7) | 0) % 2 : 0;
      cx.fillStyle = cols[0];
      cx.fillRect(fx2, fy2, 2, 2);
      cx.fillStyle = cols[1];
      if (tumble) cx.fillRect(fx2 + 2, fy2 - 2, 2, 2); else cx.fillRect(fx2 - 2, fy2 + 1, 2, 2);
      cx.globalAlpha = 1;
    }
  }

  /* =============== v3.19: the placement ghost — nothing plops down blind ===============
     The chosen build hangs as a half-there blueprint at the aim, green when the ground will take
     it, rust when it won't — and says WHY. Auras preview their reach. Click or E commits. */
  function drawPlaceGhost() {
    const p = S && S.place;
    if (!p) return;
    const okTint = p.valid ? 'rgba(159,224,111,0.9)' : 'rgba(255,106,61,0.9)';
    const pulse = 0.42 + (Math.sin(S.time * 5) + 1) * 0.07;
    const def = SDEF[p.type === 'fieldladder' ? 'ladder' : p.type];
    if (p.type === 'ladder' || p.type === 'fieldladder' || p.type === 'bridge') {
      cx.save();
      cx.translate(Math.round(p.x), Math.round(p.y));
      cx.rotate(p.ang);
      cx.globalAlpha = pulse;
      const hl = def.span / 2;
      if (p.type === 'bridge') {
        cx.fillStyle = p.valid ? '#b8ad8c' : '#8a4432';
        cx.fillRect(-hl, -9, hl * 2, 18);
        cx.fillStyle = p.valid ? '#d8cfae' : '#c96a48';
        cx.fillRect(-hl, -12, hl * 2, 3); cx.fillRect(-hl, 9, hl * 2, 3);
      } else {
        cx.fillStyle = p.valid ? '#d8cfae' : '#c96a48';
        cx.fillRect(-hl, -7, hl * 2, 3); cx.fillRect(-hl, 4, hl * 2, 3);
        cx.fillStyle = p.valid ? '#a89d7d' : '#8a4432';
        for (let x = -hl + 6; x < hl - 3; x += 11) cx.fillRect(x, -5, 4, 10);
      }
      cx.globalAlpha = 1;
      cx.restore();
    } else {
      if (p.valid && def.aura) {
        const ring = auraRingSprite(def.aura, 'rgba(255,214,140,0.5)');
        cx.globalAlpha = 0.13;
        cx.drawImage(ring, Math.round(p.x) - def.aura - 6, Math.round(p.y) - def.aura - 6);
        cx.globalAlpha = 1;
      }
      const sp = structSprite(p.type, false, false), sc = 3;
      cx.globalAlpha = pulse;
      cx.imageSmoothingEnabled = false;
      cx.drawImage(sp, Math.round(p.x - sp.width * sc / 2), Math.round(p.y - sp.height * sc * 0.72), sp.width * sc, sp.height * sc);
      cx.globalAlpha = 1;
    }
    drawBrackets(Math.round(p.x), Math.round(p.y - 8), 28, okTint, 7, 2);
    plabel(p.valid ? def.name + ' — HERE' : (p.why || 'NOT HERE'), p.x, p.y + 26, 3, p.valid ? '#9fd98a' : '#ff8a5f');
  }

  /* v3.23 THE MYTH: the handoff kid with the letter held HIGH, the envelope's flight, and the children who run the fences
     to keep the myth in sight. v3.51: a kid is drawn as a kid — the valley's own small figure (the kid's rows, coloured by
     seed like a hand) — never a courier shrunk to 0.7 between the pixels; the letter held high is the kid's own hold frame,
     and the letter that flies is the same glyph, on the texel grid */
  const holdFc = dir => { const f = facingOf(dir); return f === 'N' ? (Math.cos(dir) < 0 ? 'W' : 'E') : f; };   // the hold is drawn from the side and toward the eye
  function drawMythWorld(dt) {
    const h = S.handoff;
    if (h) {
      const kx = Math.round(h.kidX), ky = Math.round(h.kidY), moving = U.dist(h.kidX, h.kidY, h.kidTX, h.kidTY) > 6, face = Math.atan2(S.py - h.kidY, S.px - h.kidX);
      const holding = !h.passed && !moving;
      cx.save(); cx.translate(kx, ky);
      pixShadow(0, 4, 11);
      blitFig(0, 0, 'kid', moving, S.time * 14, face, { pal: handPal({ seed: h.seed }), frame: holding ? 'hold' : undefined, fc: holding ? holdFc(face) : undefined });
      cx.restore();
      // the pass: the envelope arcs to the rider's hand
      if (h.envT >= 0 && h.envT < 0.45) {
        const k = h.envT / 0.45, E = SPRITES.GLYPHS.envelope;
        const ex = h.kidX + (S.px - h.kidX) * k, ey2 = (h.kidY - 30) + (S.py - 22 - (h.kidY - 30)) * k - Math.sin(k * Math.PI) * 14;
        blit(E.rows, ex - E.rows[0].length * 1.25, ey2 - E.rows.length * 1.25, 2.5, E.pal, false);
      }
      if (cam.z > 1.4 && !h.passed) plabel('THE LETTER — HELD HIGH', kx, ky + 16, 3, '#ffd98f');
    }
    if (S.kids) for (const k of S.kids) {
      cx.save(); cx.translate(Math.round(k.x), Math.round(k.y));
      pixShadow(0, 4, 11);
      blitFig(0, 0, 'kid', true, S.time * 16 + (k.seed % 5), S.dir, { pal: handPal({ seed: k.seed }) });   // they run: the kid's own cadence holds the float
      cx.restore();
    }
  }
  /* v3.24 THE RIDE — the actors of the firing-squad parody: the kneeling courier, the reaper line (tall cloaks, pale eyes —
     the mist's own uniform), the held rider who BOLTS, and the watch ridge full of Haven's people with the kid pressed to
     the front. v3.51: every one of them a registry row — the Reapers their own figure (the aim brought level from the
     cloak), the captive the courier's kneel, the kid the kid, the cold lamp a glyph on its staff, and the rider who bolts
     astride the horse (v3.50's horse ran riderless) */
  function drawRideWorld(dt) {
    const R = S.ride;
    if (!R) return;
    for (const w of R.watchers) {
      const face = Math.atan2(R.gy - w.y, R.gx - w.x);
      if (w.kid) { cx.save(); cx.translate(Math.round(w.x), Math.round(w.y)); pixShadow(0, 4, 11); blitFig(0, 0, 'kid', false, 0, face, { pal: handPal({ seed: w.seed }), fc: Math.cos(face) < 0 ? 'W' : 'E' }); cx.restore(); }
      else drawNpcFigure(Math.round(w.x), Math.round(w.y), { seed: w.seed }, 'stand', face, {});
    }
    // the reapers work by one cold lamp — the only light out here, and it isn't warm
    cx.globalCompositeOperation = 'lighter';
    glowShells(R.gx + 16, R.gy - 26, 66, 'rgba(140,152,255,0.20)');
    cx.globalCompositeOperation = 'source-over';
    { const G = SPRITES.GLYPHS.coldlamp; pixShadow(R.gx + 16, R.gy + 3, 6); blit(G.rows, R.gx + 16 - 6.25, R.gy + 5 - G.rows.length * 2.5, 2.5, G.pal, false); }
    // the captive: on his knees before the guns, facing them
    const rc = R.reapers[(R.reapers.length / 2) | 0], toGuns = Math.atan2(rc.y - R.captive.y, rc.x - R.captive.x);
    drawNpcFigure(Math.round(R.captive.x), Math.round(R.captive.y), { seed: R.captive.seed }, 'stand', toGuns, { frame: 'kneel' });
    for (const r of R.reapers) {
      const face = Math.atan2(R.captive.y - r.y, R.captive.x - r.x), side = Math.cos(face) < 0 ? 'W' : 'E';
      pixShadow(r.x, r.y + 5, 14);
      blitFig(r.x, r.y, 'reaper', false, 0, face, { fc: side, frame: R.aim ? 'aim' : undefined });   // the firing line reads in profile: the rifles level
    }
    const rd = R.rider, flip = Math.cos(rd.boltAng) < 0;
    cx.save(); cx.translate(Math.round(rd.x), Math.round(rd.y));
    pixShadow(0, 8, 30);
    const seat = drawMount(0, 5, (S.horse && S.horse.breed) || 'mustang', rd.bolted, S.time, flip, { bare: true });   // the horse that bolts is YOURS
    const o = seatOrigin(seat, 32, 32, 16, COURIER_SEAT, flip);
    blitWalker(o.x, o.y, handPal({ seed: rd.seed }), false, 0, rd.boltAng, { fc: flip ? 'W' : 'E', frame: 'ride' });   // and a rider in the saddle: the second courier, bolting
    cx.restore();
    if (rd.bolted && rd.gone < 8 && Math.random() < dt * 10) fx.push({ type: 'burst', x: rd.x - Math.cos(rd.boltAng) * 20, y: rd.y + 8, t: 0.28 });
  }
  /* v3.25 THE CLOAKED TORCH — the Lamplighter on the ridge: a dark cloak cut like the Reapers' silhouette (the mist dresses
     everyone the same) but carrying a HOODED LANTERN, one gold slit where the light escapes. Beside them, when the scene
     calls it: the raised-tongue stranger — olive coveralls, a glass glint, cleaner than anything the march has seen in
     years. v3.51: both their own registry rows (v3.50 drew them as rectangles in world units); the lantern's glow sits on
     the slit's own texel */
  function drawLampWorld(dt) {
    const L = S.lamp;
    if (!L) return;
    const fx2 = Math.round(L.fig.x), fy2 = Math.round(L.fig.y), face = Math.atan2(S.py - fy2, S.px - fx2);
    pixShadow(fx2, fy2 + 5, 15);
    const d = figDrawn('lamplighter', false, 0, face), F = d.F, lt = F.light && F.light[d.fc] && F.light[d.fc][d.frame];
    if (lt) { const p = figAt(d, fx2, fy2, lt[0] + 0.5, lt[1] + 0.5); cx.globalCompositeOperation = 'lighter'; glowShells(p.x, p.y + 2, 18, 'rgba(255,217,143,0.12)'); cx.globalCompositeOperation = 'source-over'; }
    blitFig(fx2, fy2, 'lamplighter', false, 0, face);
    if (cam.z > 1.6) plabel('THE LAMPLIGHTER', fx2, fy2 + 16, 3, '#c9b98a');
    if (L.env && L.env.show) {
      const ex = Math.round(L.env.x), ey = Math.round(L.env.y);
      pixShadow(ex, ey + 4, 12);
      blitFig(ex, ey, 'stranger', false, 0, Math.atan2(S.py - ey, S.px - ex));
      if (cam.z > 1.6) plabel('THE STRANGER', ex, ey + 14, 3, '#8fb08a');
    }
  }
  /* v3.24 THE RESCUE — the yard emptied for you: banner riders at the gallop, lamps up */
  function drawRescueWorld(dt) {
    const rs = S.rescue;
    if (!rs) return;
    rs.riders.forEach((r, i) => {
      const flip = (S.px - r.x) < 0;
      pixShadow(r.x, r.y + 9, 34);
      drawRider(r.x, r.y, !r.in, S.time + i * 0.2, flip);
      if (!r.in && Math.random() < dt * 9) fx.push({ type: 'burst', x: r.x - (flip ? -20 : 20), y: r.y + 8, t: 0.28 });
    });
    plabel('THE RIDERS', rs.riders[0].x, rs.riders[0].y - 42, 3, '#ffc978');
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
  let walkerFc = 'S', lastWalker = null;   // v3.50: the way the Walker last walked — a Walker who stops keeps facing it; and the frame last drawn
  function drawPlayer(dt) {
    if (S.state === 'zip') return;
    if (S.inside) return;   // the room holds them — the lit doorway speaks for the walker
    const x = S.px, y = S.py;
    const moving = S.speed > 5;
    if (moving) { bobT += dt * (S.sprinting ? 13 : 9); stampPrints(); walkerFc = facingOf(S.dir); }
    const lean = S.qte ? Math.sin(S.time * 18) * 0.16 : S.braced ? 0 : moving ? Math.sin(bobT * 0.5) * 0.03 : 0;
    cx.save();
    cx.translate(x, y);
    cx.scale(1.22, 1.22);
    const mounted = Systems.horseOn && Systems.horseOn();
    pixShadow(0, mounted ? 8 : 5, mounted ? 30 : 17);
    if (mounted) {
      /* v3.33: the breed you rented is the horse you ride — the stable's own sprite by name */
      const seat = drawMount(0, 5, S.horse && S.horse.breed, moving, S.time, Math.cos(S.dir) < 0, { bare: true });
      const o = seatOrigin(seat, 32, 32, 16, COURIER_SEAT, Math.cos(S.dir) < 0); cx.translate(o.x, o.y);   // the rider and the pack ride the saddle: the courier's seat texel on the saddle's, whichever way they face (v3.51)
    }
    /* v3.50 THE COURIER SET — the frame: astride, braced (knees bent, a hand on the strap), a step, or the breath */
    const CO = SPRITES.COURIER, fc0 = mounted ? (Math.cos(S.dir) < 0 ? 'W' : 'E') : walkerFc;
    const frame = mounted ? 'ride' : S.braced && !moving ? 'brace' : moving ? stepOf(bobT) : ((S.time % 2.4) > 2.0 ? 'idle2' : 'idle');
    const drawn = { fc: fc0 === 'W' ? 'E' : fc0, flip: fc0 === 'W', frame };
    const A = CO.at[drawn.fc], dy = CO.dy[drawn.fc][frame] || 0, hand = CO.hand[drawn.fc][frame] || CO.hand[drawn.fc].idle;
    const at1 = (c, r) => rigAt(0, 0, drawn.flip ? 31 - c : c, r);   // a point on the grid, mirrored with the figure
    lastWalker = { fc: fc0, frame, dy, hand: hand.slice(), tiers: 0, towerTop: 0, x, y };
    const M = cells => mirrorCells(cells, drawn.flip);
    /* v3.45 THE LAMP LAW — a lamp lights what is round it, never its holder's own texels: the corona of every lamp the
       Walker carries is laid BEHIND the pack and the coat, centred on the lamp itself; over the sprite only the glass
       glints, and the rim light writes the lit side of the coat */
    const lampDark = World.lightAt(x, y) < 0.3;
    const handGlass = at1(hand[0] + 0.5, hand[1] + 3.5);
    const kinLamp = S.cargo.find(c => c.defId === 'kinLantern'), kinGlass = A.kin ? at1(A.kin[0] + 1.5, A.kin[1] + dy + 3) : handGlass;
    if (lampDark || (kinLamp && kinLamp.lit)) {
      cx.globalCompositeOperation = 'lighter';
      if (lampDark) { const big = S.flags.effects.bigLantern ? 2.4 : 1; glowShells(handGlass.x, handGlass.y, big > 1 ? 22 : 13, `rgba(255,230,180,${big > 1 ? 0.4 : 0.34})`); }
      if (kinLamp && kinLamp.lit) glowShells(kinGlass.x, kinGlass.y, 8 + (((S.time * 3) | 0) % 2), 'rgba(255,214,140,0.9)');
      cx.globalCompositeOperation = 'source-over';
    }
    // THE PACK READS (v3.19): every load is AUTHORED — crates banded by their good, the medicine crossed, tins ribbed,
    // bales soft, sacks tied, drums stamped, cells lit, the mail in its satchel, and every small thing rolled into one
    // duffel at the base. During a hand-over, crates not yet hopped keep riding. v3.50: the tower stands on the bedroll
    // on the courier's own texel grid (one texel of a crate is one texel of the coat), and it sways in whole texels.
    const isSmall = c => c.kg < 3 && c.cat !== 'mat' && c.cat !== 'core' && c.cat !== 'goods' && !c.lostTo;
    const hung = c => c.keepsake || c.defId === 'kinLantern' || c.gift;   // v3.46: a keepsake and the kin's lantern hang on their own strings — never in the tower, never in the duffel (v3.47: the road's gift is lashed on the pack itself)
    const carried = (S.handover ? [...S.handover.looks, ...S.cargo.filter(c => c.cat !== 'tool')] : S.cargo.filter(c => c.cat !== 'tool')).filter(c => !hung(c));
    const stack = carried.filter(c => !isSmall(c)).slice(0, 6);
    const smalls = carried.some(isSmall);
    const tools = S.cargo.filter(c => c.cat === 'tool').length;
    const giftOn = S.cargo.some(c => c.gift);
    const tc = A.tower[0], base = Math.min(A.tower[1] + dy, giftOn ? A.gift[1] + dy - 1 : 99);
    const tiers = [];
    let r = base + 1;
    if (smalls) { r -= DUFFEL.rows.length; tiers.push({ cells: glyphCells(DUFFEL.rows, DUFFEL.pal, tc - (DUFFEL.rows[0].length >> 1), r, false), h: base - r }); }
    for (const c of stack) {
      const g = cargoGlyphFor(c), w = g.rows[0].length;
      r -= g.rows.length;
      tiers.push({ cells: glyphCells(g.rows, g.pal, tc - (w >> 1), r, false), h: base - r, glow: g.glow ? { c0: tc - (w >> 1) + 1, c1: tc - (w >> 1) + w - 2, r: r + 1, col: g.glow } : null });
    }
    const towerTop = r;
    lastWalker.tiers = tiers.length; lastWalker.towerTop = towerTop;
    const ang = lean * 2.2 + (S.qte ? Math.sin(S.time * 22) * 0.1 : 0);
    const drawTower = () => {
      for (const t of tiers) {
        const sh = Math.round(ang * t.h);   // the sway, in whole texels, more the higher the crate
        rigStamp(0, 0, M(t.cells).map(([c, rr, col]) => [c + sh, rr, col]));
        if (t.glow) { const gl = []; for (let c = t.glow.c0; c <= t.glow.c1; c++) gl.push([c, t.glow.r, t.glow.col]); rigStamp(0, 0, M(gl).map(([c, rr, col]) => [c + sh, rr, col]), 'lighter'); }
      }
      if ((S.snowPack || 0) >= 0.55 && stack.length) {   // the north rides the pack too — a snow cap on the top crate
        const top = tiers[tiers.length - 1], sh = Math.round(ang * top.h), cols = top.cells.filter(([, rr]) => rr === towerTop).map(([c]) => c);
        rigStamp(0, 0, M(cols.map(c => [c, towerTop, '#dce8f0'])).map(([c, rr, col]) => [c + sh, rr, col]));
      }
    };
    const rails = railCells(A, dy, towerTop);
    const toolCells = []; for (let i = 0; i < Math.min(3, tools); i++) toolCells.push(...glyphCells(CO.glyphs.tool, CO.glyphPal, A.tools[0] + i, A.tools[1] + dy - (i % 2), false));
    const giftCells = giftOn ? glyphCells(CO.glyphs.gift, CO.glyphPal, A.gift[0], A.gift[1] + dy, false) : [];
    const onRoad = typeof Republic !== 'undefined' && Republic.onAnyRoad && Republic.onAnyRoad();   // v3.47 THE ROAD KEPT: the white rag at the pack's top corner
    const ragCells = onRoad ? glyphCells(CO.glyphs.rag, SPRITES.TRUCE_KEPT_PAL, A.rag[0], A.rag[1] + dy, A.ragFlip) : [];
    const kinCells = kinLamp && A.kin ? glyphCells(SPRITES.KINLANTERN_SMALL, kinLamp.lit ? SPRITES.KPAL : { ...SPRITES.KPAL, F: SPRITES.KPAL.G, f: SPRITES.KPAL.g }, A.kin[0], A.kin[1] + dy, false) : [];
    const boltC = S.arrow ? boltCells(drawn, dy) : [];
    const layer = back => {   // what the facing puts behind the courier, or in front of it
      if (A.railBack === back) rigStamp(0, 0, M(rails));
      if (A.towerBack === back) drawTower();
      if (A.toolsBack === back) rigStamp(0, 0, M(toolCells));
      if (A.giftBack === back) rigStamp(0, 0, M(giftCells));
      if (A.ragBack === back) rigStamp(0, 0, M(ragCells));
      if (A.kinBack === back) rigStamp(0, 0, M(kinCells));
      if (A.boltBack === back) rigStamp(0, 0, boltC);
    };
    layer(true);
    // the sled trails behind on its lumen runner, its curled front toward the walker (v3.51: the registry's glyph on the texel grid)
    if (S.gear.sled && S.gear.sledOn) {
      const G = SPRITES.GLYPHS.sled, sx2 = -Math.cos(S.dir) * 22, sy2 = 4 - Math.sin(S.dir) * 6;
      blit(G.rows, sx2 - G.rows[0].length * 1.25, sy2 - G.rows.length * 1.25, 2.5, G.pal, Math.cos(S.dir) < 0);
    }
    // the Walker, drawn like it's 1996 — dressed by rank, and by what they EQUIPPED (v3.19); v3.50 the courier set
    blitWalker(0, 0, wornPal(), moving, bobT, S.dir, { fc: fc0, frame });
    layer(false);
    /* v3.43 — the scar the bolt left, and the dressing wound over it (on the back shoulder: not from the eye's side) */
    if (!S.arrow && S.scar) rigStamp(0, 0, scarCells(drawn, dy, S.scar.dressed > 0));
    /* v3.46 — THE KIN'S THANKS: every keepsake hangs under the pack on its string (two at most) */
    { const ks = S.cargo.filter(c => c.keepsake).slice(0, 2);
      if (ks.length && A.keep) {
        const cells = [];
        ks.forEach((c, i) => { const K3 = SPRITES.KEEPSAKES[c.keepsake.thing]; if (K3) cells.push(...glyphCells(K3.token, SPRITES.TOKEN_PAL, A.keep[i][0], A.keep[i][1] + dy, false)); });
        rigStamp(0, 0, M(cells));
      }
    }
    // the north sits on their shoulders — snow the body collected, stage by stage
    if ((S.snowPack || 0) >= 0.25) rigStamp(0, 0, snowCells(drawn, S.snowPack));
    // rim light: at night the lantern writes one warm texel down the coat's lantern side — the side of the hand that holds it
    if (World.lightAt(x, y) < 0.35 && Economy.dayPhase().nightness >= 0.18) drawRim(0, 0, drawn, (drawn.flip ? 31 - hand[0] : hand[0]) < 16 ? -1 : 1);
    if (World.lightAt(x, y) < 0.35) rigStamp(0, 0, M(glyphCells(CO.glyphs.lantern, CO.glyphPal, hand[0] - 1, hand[1] + 1, false)));   // the lantern in hand, out where it's needed
    // the lamp in hand glints on its own glass (its corona already lies behind — the lamp law); the GROUND lights (see punchLight)
    if (lampDark || (kinLamp && kinLamp.lit && kinCells.length)) {
      cx.globalCompositeOperation = 'lighter';
      if (lampDark) glowShells(handGlass.x, handGlass.y, S.flags.effects.bigLantern ? 6 : 4, 'rgba(255,230,180,0.6)');   // BIGLANTERN: exactly what it says
      if (kinLamp && kinLamp.lit && kinCells.length) glowShells(kinGlass.x, kinGlass.y, 3, 'rgba(255,214,140,0.8)');
      cx.globalCompositeOperation = 'source-over';
    }
    cx.restore();
    // brace indicator — four corner brackets holding the walker steady
    if (S.braced && moving) drawBrackets(Math.round(x), Math.round(y - 22), 22, 'rgba(233,226,208,0.5)');
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
        drawNpcFigure(ev.x, ev.y, ev.data.npc, ev.type === 'rescueInjured' ? 'down' : 'sit', Math.atan2(S.py - ev.y, S.px - ev.x));   // v3.51: sat on the ground (the courier's sit), or down on their side, turned to the one coming
        const p3 = 0.5 + Math.sin(S.time * 4) * 0.5;
        cx.fillStyle = `rgba(217,107,79,${0.5 + p3 * 0.5})`;
        cx.font = `700 ${16 / cam.z}px Fraunces, serif`; cx.textAlign = 'center';
        plabel('!', ev.x, ev.y - 32, 5, '#ffd98f');
      }
    }
  }
  /* a hand, a townsperson, a kid, a Farkeeper hire. Poses: stand, walk, ride (the rider's own ride frame — the caller seats
     it with seatOrigin), sit (v3.51: the courier's own sit frame, toward the eye unless they face the side), down (the side
     view turned a quarter — every texel a texel; v3.50 rotated the frame 1.35 rad between the pixels). opt.fig draws a
     figure the npc does not name (the kid); opt.phase its stride; opt.frame a frame its part asks (the letter held high). */
  function drawNpcFigure(x, y, npc, pose = 'stand', dir = 0, opt = {}) {
    cx.save(); cx.translate(x, y);
    const fig = opt.fig || figOf(npc), F = fig ? SPRITES.FIG[fig] : null, pal = !F || F.seed ? handPal(npc) : undefined;   // a courier hand and a kid by seed; every other figure in its own colours
    if (!opt.noShadow) pixShadow(0, 4, F && F.h > 32 ? 19 : 15);
    const phase = opt.phase !== undefined ? opt.phase : S.time * 9 + (npc ? npc.seed % 7 : 0);
    const side = Math.cos(dir) < 0 ? 'W' : 'E';
    let drawn;
    if (pose === 'down') { if (F) blitFigDown(0, 0, fig, dir, pal); else blitWalkerDown(0, 0, pal, dir); cx.restore(); return null; }
    if (F) drawn = blitFig(0, 0, fig, pose === 'walk', phase, dir, { pal, frame: opt.frame || (pose === 'ride' ? 'ride' : undefined), fc: pose === 'ride' ? side : undefined });
    else {
      const low = Math.abs(Math.cos(dir)) >= 0.5 ? side : 'S';   // the low poses are drawn from the side and toward the eye
      const o = opt.frame ? { fc: low, frame: opt.frame } : pose === 'ride' ? { fc: side, frame: 'ride' } : pose === 'sit' ? { fc: low, frame: 'sit' } : undefined;
      /* v3.51 — a courier hand's own load rides their bedroll the Walker's way: crates stacked on the tower's anchor, behind
         the courier or over them by the facing (v3.50 stacked rectangles in world units beside the figure) */
      const d0 = walkerFrame(pose === 'walk', phase, dir, o), At = SPRITES.COURIER.at[d0.fc], tower = opt.tower ? mirrorCells(npcTowerCells(d0, opt.tower), d0.flip) : null;
      if (tower && At.towerBack) rigStamp(0, 0, tower);
      drawn = blitWalker(0, 0, pal, pose === 'walk', phase, dir, o);
      if (tower && !At.towerBack) rigStamp(0, 0, tower);
      /* v3.48 THE KIN'S DAY — a hand the town lent for a leg wears the town's ribbon, shoulder to hip, over the coat and
         under the arm; v3.49 — a hand who stayed keeps it, a white pin through it at the chest */
      if (npc && (npc.lent || npc.stays)) {
        const CO = SPRITES.COURIER, cells = [...(CO.sash[drawn.fc][drawn.frame] || []), ...(npc.stays ? (CO.pin[drawn.fc][drawn.frame] || []) : [])];
        rigStamp(0, 0, mirrorCells(cells.map(([c, r, ch]) => [c, r, SPRITES.HELPER_PAL[ch]]), drawn.flip));
      }
    }
    cx.restore();
    return drawn;
  }
  /* crates on a courier's tower anchor: n of the pack's own crate glyph, banded by the caller's colours */
  function npcTowerCells(d, tw) {
    const CO = SPRITES.COURIER, A = CO.at[d.fc], dy = CO.dy[d.fc][d.frame] || 0, g = CG.crate.rows, w = g[0].length, cells = [];
    let r = A.tower[1] + dy + 1;
    for (let i = 0; i < tw.n; i++) { r -= g.length; cells.push(...glyphCells(g, { ...CG_BASE, B: tw.bands[i % tw.bands.length] }, A.tower[0] - (w >> 1), r, false)); }
    return cells;
  }
  /* ---------- the militia — the town's answer, at the gallop ----------
     An authored horse and rider, two stride frames, a banner in the town's gold. They arrive,
     they clear the road, they leave. The fallen ride home across a saddle. */
  const HORSE_F = [[
    '..............OOO.....',
    '.....G.......OBbHO....',
    '.....G..OO...OBBO.....',
    '.....G.ORRO..OBBO.....',
    '.....GORRRROOBBBO.....',
    '.OO..OSRRSOBBBBO......',
    'OMMOOBBBBBBBBBBO......',
    'OMMBBBBBBBBBBBBO......',
    '.OMOBBBBBBBBBBO.......',
    '..O.OBBOOOOBBO........',
    '...OBBO...OBBO........',
    '..OBBO.....OBBO.......',
    '.OBO.........OBO......',
    '.OO...........OO......',
  ], [
    '..............OOO.....',
    '.....G.......OBbHO....',
    '.....G..OO...OBBO.....',
    '.....G.ORRO..OBBO.....',
    '.....GORRRROOBBBO.....',
    '.OO..OSRRSOBBBBO......',
    'OMMOOBBBBBBBBBBO......',
    'OMMBBBBBBBBBBBBO......',
    '.OMOBBBBBBBBBBO.......',
    '..O.OBBOOOOBBO........',
    '....OBBO..OBBO........',
    '....OBO....OBO........',
    '.....OBO..OBO.........',
    '.....OO....OO.........',
  ]];
  const HORSE_PAL = { O: '#12161c', B: '#5c4232', b: '#46352a', M: '#241708', S: '#8a6534', R: '#3d5a74', H: '#2c4258', G: '#ffc978' };
  /* the same horse, saddled but riderless — the walker rig mounts it */
  const HORSE_M_PAL = { O: '#12161c', B: '#5c4232', b: '#46352a', M: '#241708', S: '#8a6534' };
  let _horseM = null;
  function horseMRows() {
    if (_horseM) return _horseM;
    const TOP = [
      '..............OOO.....',
      '.............OBbbO....',
      '.............OBBO.....',
      '.......OO....OBBO.....',
      '......OSSOOOOBBBO.....',
    ];
    _horseM = HORSE_F.map(fr => TOP.concat(fr.slice(5).map((r, i2) => i2 === 0 ? r.replace('SRRS', 'SSSS') : r)));
    return _horseM;
  }
  const FALLEN_ROWS = [
    '.OOOOOOO..',
    'ORRRRRRHO.',
    '.OOOOOOO..',
  ];
  function drawMilitia(inView, dt) {
    const sc = Systems.militiaScene && Systems.militiaScene();
    if (!sc) return;
    sc.riders.forEach((r, i) => {
      if (sc.fell && i === 1) {
        if (r.fellAt && sc.phase !== 'in') {   // carried home across a saddle — what stays is the mark
          blit(FALLEN_ROWS, r.fellAt.x - 12.5, r.fellAt.y - 4, 2.5, { O: '#12161c', R: '#3d5a74', H: '#2c4258' }, false);
        }
        if (sc.phase === 'out') return;
        if (r.fellAt) return;
      }
      if (!inView(r.x, r.y, 120)) return;
      const moving = sc.phase !== 'work';
      const flip = sc.phase === 'out' ? Math.cos(sc.exitA) > 0 : (S.px - r.x) < 0;
      pixShadow(r.x, r.y + 9, 34);
      drawRider(r.x, r.y, moving, S.time + r.ph * 0.01, flip);
      if (moving && Math.random() < dt * 9) fx.push({ type: 'burst', x: r.x - (flip ? -20 : 20), y: r.y + 8, t: 0.28 });   // hoof dust joins mid-ring
    });
    if (sc.phase === 'work') plabel('THE MILITIA', sc.riders[0].x, sc.riders[0].y - 42, 3, '#ffc978');
  }
  /* v3.46 — THE LINE HOLDS: a rope from hand to hand along the backs, sagging between them, laid texel by texel on the
     world's grid (rope brown over a one-texel shadow) — only between backs standing their slots */
  function drawLineRope(h, fx, fy) {
    const px2 = -fy, py2 = fx, gap = DATA.T.ring.gap, slots = [-1, 1, -2, 2];
    const pts = NPC.party().map((n, pi) => ({ n, s: slots[pi % 4] })).filter(o => o.n.cx !== undefined && U.dist(o.n.cx, o.n.cy, h.x + px2 * o.s * gap, h.y + py2 * o.s * gap) < 14).sort((a, b) => a.s - b.s);
    const T2 = 2.5;
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i].n, b = pts[i + 1].n, ax = a.cx, ay = a.cy - 10, bx = b.cx, by = b.cy - 10, L = Math.hypot(bx - ax, by - ay), steps = Math.max(2, Math.round(L / T2));
      for (let k = 0; k <= steps; k++) {
        const t = k / steps, sag = 7 * 4 * t * (1 - t), x = Math.round((ax + (bx - ax) * t) / T2) * T2, y = Math.round((ay + (by - ay) * t + sag) / T2) * T2;
        cx.fillStyle = '#3a2e22'; cx.fillRect(x, y + T2, T2, T2);
        cx.fillStyle = k % 4 === 0 ? '#a08050' : '#8a6a42'; cx.fillRect(x, y, T2, T2);
      }
    }
  }
  /* v3.47 — a rope from back to back along a line, laid texel by texel (the watch's; the held line lays its own below) */
  function drawRopeAlong(list) {
    const T2 = 2.5;
    for (let i = 0; i + 1 < list.length; i++) {
      const a = list[i], b = list[i + 1], ax = a.cx, ay = a.cy - 10, bx = b.cx, by = b.cy - 10, L = Math.hypot(bx - ax, by - ay), steps = Math.max(2, Math.round(L / T2));
      if (L > 120) continue;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps, sag = 7 * 4 * t * (1 - t), x = Math.round((ax + (bx - ax) * t) / T2) * T2, y = Math.round((ay + (by - ay) * t + sag) / T2) * T2;
        cx.fillStyle = '#3a2e22'; cx.fillRect(x, y + T2, T2, T2);
        cx.fillStyle = k % 4 === 0 ? '#a08050' : '#8a6a42'; cx.fillRect(x, y, T2, T2);
      }
    }
  }
  function drawAboveMist(inView, dt) {
    // v3.24: the PARTY walks with you, above the mist like you — a wedge of backs, some in saddles
    for (const n of NPC.party()) {
      if (n.cx === undefined) continue;
      const mvd = n._px !== undefined ? Math.abs(n.cx - n._px) + Math.abs(n.cy - n._py) : 0;
      if (mvd > 0.4) n._dir = Math.atan2(n.cy - n._py, n.cx - n._px);
      const dir = n.pauseT > 0 && n.pauseDir !== undefined ? n.pauseDir   // v3.47: stopped a beat at a cairn, facing it
        : (S.ringHold || (S.settle && S.settle.npc === n.id)) && n.holdDir !== undefined && mvd <= 0.4 ? n.holdDir : (n._dir || 0);   // v3.45: the line at the ring faces the camp (v3.46: so does the one settling a score)
      if (n.horse) {   // their own saddle: the breed their home town stables, the figure riding it
        cx.save(); cx.translate(Math.round(n.cx), Math.round(n.cy));
        pixShadow(0, 8, 28);
        const breed = n.breed || (n.at && FACT.STABLES[n.at]) || 'mustang';
        const seat = drawMount(0, 5, breed, mvd > 0.6, S.time + (n.seed % 7) * 0.13, Math.cos(dir) < 0, { bare: true });
        const fig = figOf(n), F = fig && SPRITES.FIG[fig], o = F && F.seat ? seatOrigin(seat, F.w, F.h, F.ax, F.seat, Math.cos(dir) < 0) : seatOrigin(seat, 32, 32, 16, COURIER_SEAT, Math.cos(dir) < 0);
        drawNpcFigure(o.x, o.y, n, 'ride', dir, { noShadow: true });   // v3.51: astride — the rider's own seat texel on the saddle's (a Farkeeper rides on the mountain's own ride frame)
        cx.restore();
      } else {
        drawNpcFigure(n.cx, n.cy, n, mvd > 0.4 ? 'walk' : 'stand', dir);
      }
      n._px = n.cx; n._py = n.cy;
      if (cam.z > 0.75) plabel(n.name.split(' ')[0], n.cx, n.cy + 13, 3, '#b8b29d');
    }
    /* v3.45 — the line at the ring, named on the ground: the pin planted where it holds, the camp it faces
       (v3.46: HOLD strings a rope from hand to hand along the backs; COME carries no pin — the line walks with you) */
    if (S.ringHold && typeof SPRITES !== 'undefined') {
      const h = S.ringHold, cdR = DATA.camps.find(c => c.id === h.camp);
      if (cdR && inView(h.x, h.y, 160)) {
        const ux = cdR.x - h.x, uy = cdR.y - h.y, ul = Math.max(1, Math.hypot(ux, uy)), bx = h.x - ux / ul * 26, by = h.y - uy / ul * 26;
        if (h.order === 'hold') drawLineRope(h, ux / ul, uy / ul);
        if (h.order !== 'come') { pixShadow(bx, by + 14, 8); blit(SPRITES.RINGPIN, bx - 8.75, by - 14, 2.5, SPRITES.RAGSTAKE_PAL, false); }
        const lab = h.order === 'hold' ? 'THE LINE HOLDS — YOU GO IN ALONE' : h.order === 'come' ? 'THE LINE COMES IN' : `THE LINE HOLDS AT ${cdR.name.toUpperCase()}'S RING`;
        if (cam.z > 0.7 && (h.order === 'hold' || U.dist(S.px, S.py, h.x, h.y) < 320)) plabel(lab, h.order === 'come' ? h.x : bx, h.order === 'come' ? h.y + 30 : by + 24, 2, h.order === 'come' ? '#ffd98f' : '#e0654a', { first: true });
      }
    }
    /* v3.47 THE WATCH — the line at a ring's edge through the night: the fire laid behind them (lit at dark), the rope hand to
       hand, a lamp in every hand from dark; at dawn they walk home, and wait at the door to fall in */
    if (typeof Systems !== 'undefined' && Systems.watches && typeof SPRITES !== 'undefined') for (const w of Systems.watches()) {
      const ns = Systems.watchers(w), dark = w.dark && !w.home;
      if (!w.home && inView(w.x, w.y, 220)) {
        const fp = Systems.watchFire(w);
        pixShadow(fp.x, fp.y + 4, 14);
        if (dark) { cx.globalCompositeOperation = 'lighter'; glowShells(fp.x, fp.y - 6, 16 + (((S.time * 6) | 0) % 2) * 2, 'rgba(255,190,110,0.95)'); cx.globalCompositeOperation = 'source-over'; }
        const WF = SPRITES.WATCHFIRE[((S.time * 6) | 0) % 2];
        blit(dark ? WF : WF.slice(6), fp.x - 11.25, fp.y - 16 + (dark ? 0 : 15), 2.5, SPRITES.WATCHFIRE_PAL, false);   // by day the fire lies laid: its stones and logs
        drawRopeAlong(ns.filter(n => !n.walkHome && n.cx !== undefined).map(n => ({ n, s: [-1, 1, -2, 2][n.watchSlot % 4] })).sort((a, b) => a.s - b.s).map(o => o.n));
        const cdW = DATA.camps.find(c => c.id === w.camp);
        if (cam.z > 0.7) plabel(dark ? 'THE WATCH — THE CAMP STAYS IN' : `THE WATCH — ${cdW ? cdW.name.toUpperCase() + "'S RING" : 'THE RING'} TILL MORNING`, fp.x, fp.y + 14, 2, dark ? '#ffd98f' : '#e0654a', { first: true });
      }
      /* v3.48 THE WATCH'S SIEGE — the chief (or the eldest knife) walks out to the line under a white rag on a stick, held
         at the cloak's edge and trailing; talks; walks back to his fire */
      const sg = w.siege;
      if (sg && !sg.done && inView(sg.x, sg.y, 90)) {
        const dir = sg.phase === 'back' ? Math.atan2(sg.y0 - sg.ty, sg.x0 - sg.tx) : Math.atan2(sg.ty - sg.y0, sg.tx - sg.x0), flip = Math.cos(dir) < 0;
        pixShadow(sg.x, sg.y + 6, 13);
        blitFig(sg.x, sg.y, sg.kit || 'knife', sg.phase !== 'talk', S.time * 10, dir);
        blit(SPRITES.RAG_STICK, flip ? sg.x + 12.5 : sg.x - 22.5, sg.y - 62, 2.5, SPRITES.TRUCE_KEPT_PAL, !flip);   // the stick from his fist, the rag flying over his head
        if (cam.z > 0.7) plabel(sg.phase === 'talk' ? 'A TRUCE AT THE LINE' : sg.phase === 'out' ? `THE ${sg.chief ? 'CHIEF' : 'ELDEST KNIFE'} COMES OUT — A WHITE RAG` : 'A TRUCE — HE WALKS BACK', sg.x, sg.y + 16, 3, '#e8e0c8', { first: true });   // the moment's words, a size up
      }
      for (const n of ns) {
        if (n.cx === undefined || !inView(n.cx, n.cy, 60)) continue;
        const walking = !!n.walkHome, dir = walking ? (n._dir || 0) : Math.atan2(w.fy, w.fx);
        const drawn = drawNpcFigure(n.cx, n.cy, n, walking ? 'walk' : 'stand', dir);
        if (dark && !walking && drawn) {   // a lamp in the hand toward the camp, on the courier's own texels, its glass glinting
          const CO = SPRITES.COURIER, hd = CO.hand[drawn.fc][drawn.frame] || CO.hand[drawn.fc].idle;
          cx.save(); cx.translate(n.cx, n.cy);
          rigStamp(0, 0, mirrorCells(glyphCells(CO.glyphs.lantern, CO.glyphPal, hd[0] - 1, hd[1] + 1, false), drawn.flip));
          const g2 = rigAt(0, 0, (drawn.flip ? 31 - hd[0] : hd[0]) + 0.5, hd[1] + 3.5); cx.globalCompositeOperation = 'lighter'; glowShells(g2.x, g2.y, 6, 'rgba(255,214,140,0.8)'); cx.globalCompositeOperation = 'source-over';
          cx.restore();
        }
        if (cam.z > 0.75) plabel(n.name.split(' ')[0], n.cx, n.cy + 13, 3, '#b8b29d');
      }
    }
    /* v3.48 — a lent hand walking home to their town, the ribbon still on */
    for (const n of S.npcs) { if (n.state !== 'lentHome' || n.cx === undefined || !inView(n.cx, n.cy, 60)) continue; drawNpcFigure(n.cx, n.cy, n, 'walk', n._dir || 0); if (cam.z > 0.75) plabel(n.name.split(' ')[0], n.cx, n.cy + 13, 3, '#b8b29d'); }
    { const byDoor = {};
      for (const n of S.npcs) { if (n.state !== 'waiting' || n.cx === undefined || !inView(n.cx, n.cy, 60)) continue; drawNpcFigure(n.cx, n.cy, n, 'stand', Math.PI / 2); if (cam.z > 0.75) plabel(n.name.split(' ')[0], n.cx, n.cy + 13, 3, '#b8b29d'); (byDoor[n.waitAt] = byDoor[n.waitAt] || []).push(n); }
      if (cam.z > 0.7) for (const list of Object.values(byDoor)) { const mx = list.reduce((a, n) => a + n.cx, 0) / list.length, my = Math.max(...list.map(n => n.cy)); plabel('HOME FROM THE WATCH', mx, my + 30, 2, '#ffd98f', { first: true }); }
    }
    // ambient waylighters on runs of their own — packs on, going somewhere that is not about you
    for (const w of (NPC.ambient ? NPC.ambient() : [])) {
      if (w.x === undefined || !inView(w.x, w.y, 80)) continue;
      // their little tower rides their bedroll, stacked the Walker's way (v3.51)
      const paused = w.pauseT > 0 && w.pauseDir !== undefined;   // v3.47: stopped a beat at a cairn
      drawNpcFigure(w.x, w.y, w.n, paused ? 'stand' : 'walk', paused ? w.pauseDir : (w.ang || 0), { tower: { n: w.crates, bands: ['#8a8676', '#b3a06a'] } });
      if (cam.z > 0.8) plabel(w.n.name.split(' ')[0], w.x, w.y + 13, 3, '#a9a493');
    }
    // THE SHAPES OF WORK: the convoy walker — cargo that talks, drawn where it stands
    const cv = S.convoy;
    if (cv && inView(cv.x, cv.y, 90)) {
      if (cv.frozen) { cx.globalCompositeOperation = 'lighter'; ghostBody(cv.x, cv.y - 14, 18, 'rgba(150,160,255,0.30)'); cx.globalCompositeOperation = 'source-over'; }
      drawNpcFigure(cv.x, cv.y, cv.n, cv.moving && !cv.frozen && !cv.waiting ? 'walk' : 'stand', cv.dir || 0, { tower: { n: cv.crates, bands: ['#ffd98f'] } });   // bound freight wears the gold band (the law of the pack)
      if (cam.z > 0.7) plabel((cv.frozen ? 'FROZEN — ' : cv.waiting ? 'WAITING — ' : 'CONVOY — ') + cv.n.name.split(' ')[0], cv.x, cv.y + 13, 3, cv.frozen || cv.waiting ? '#e0654a' : '#ffd98f');
    }
    // v3.20 THE WORKING WORLD: field crews, visibly at it — the valley works whether you watch or not
    /* v3.37 THE MARKS: a presser's chain stands on the ground as flags, numbered in order from the
       town, and the line they walk is dotted between them while a presser is near enough to be seen */
    for (const fn2 of NPC.fieldAll ? NPC.fieldAll() : []) {
      if (fn2.job !== 'presser' || !fn2.route || !NPC.marksOf) continue;
      const marks = NPC.marksOf(fn2);
      if (!marks.length) continue;
      const near = fn2.fx !== undefined && U.dist(S.px, S.py, fn2.fx, fn2.fy) < 900;
      if (near && fn2.fpath && fn2.fpath.pts && cam.z > 0.45) {
        cx.fillStyle = 'rgba(201,160,90,0.85)';
        const pts = fn2.fpath.pts;   // three world units — a texel at the world zoom, never a sub-texel speck
        for (let k = 0; k + 1 < pts.length; k++) {
          const [x1, y1] = pts[k], [x2, y2] = pts[k + 1];
          const L = Math.hypot(x2 - x1, y2 - y1);
          for (let d2 = 0; d2 < L; d2 += 18) { const t2 = d2 / L, x = x1 + (x2 - x1) * t2, y = y1 + (y2 - y1) * t2; if (inView(x, y, 8)) cx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }
        }
      }
      marks.forEach((m, i) => {
        if (!inView(m.x, m.y, 40)) return;
        pixShadow(m.x, m.y + 2, 8);
        blit(MARK, m.x - 4, m.y - 30, 2.5, MARK_PAL, ((S.time * 2 + i) | 0) % 2 === 1);
        if (cam.z > 0.7 && U.dist(S.px, S.py, m.x, m.y) < 520) plabel(`MARK ${i + 1}`, m.x, m.y + 10, 3, '#c9a05a');
      });
    }
    for (const fn2 of NPC.fieldAll ? NPC.fieldAll() : []) {
      if (fn2.fx === undefined || !inView(fn2.fx, fn2.fy, 90)) continue;
      const caravan = fn2.job === 'hauler' && (fn2.skills.haul || 0) >= T.haulLvCaravan;
      const fx2 = Math.round(fn2.fx), fy2 = Math.round(fn2.fy);
      if (caravan && typeof SPRITES !== 'undefined' && SPRITES.HORSES.donkey) {
        /* v3.33: the pack donkey from the stable — crates lashed on, drawn by the one mount path */
        const flip = Math.cos(fn2.fdir || 0) < 0;
        pixShadow(fx2, fy2 + 6, 22);
        drawMount(fx2, fy2 + 5, 'donkey', !!fn2.fmoving, S.time + (fn2.seed % 5) * 0.11, flip, { bare: true });
      } else {
        if (fn2.job === 'mason' && !fn2.fmoving) { const G = SPRITES.GLYPHS.stones; blit(G.rows, fx2 + 5, fy2 + 5 - G.rows.length * 2.5, 2.5, G.pal, false); }   // v3.51: the mason's cut stones by the feet, on the texel grid
        const d = drawNpcFigure(fn2.fx, fn2.fy, fn2, fn2.fmoving ? 'walk' : 'stand', fn2.fdir || 0, fn2.job === 'hauler' ? { tower: { n: 2, bands: ['#9a8468'] } } : {});
        if (fn2.job === 'forrester' && d) {
          /* the axe in the right hand (v3.51: the registry's three swing frames on the courier's grid, the grip on the hand's
             texel — v3.50 turned a rectangle between the pixels): raised, over and the bite while the work is on; carried over,
             walking */
          const ph = ((S.time * 1.9) % 1), G = SPRITES.GLYPHS[!fn2.fmoving && fn2.fwork > 0 ? (ph < 0.5 ? 'axe_up' : ph < 0.65 ? 'axe_mid' : 'axe_down') : 'axe_mid'];
          const hd = SPRITES.COURIER.hand[d.fc][d.frame] || SPRITES.COURIER.hand[d.fc].idle;
          rigStamp(fn2.fx, fn2.fy, mirrorCells(glyphCells(G.rows, G.pal, hd[0] - G.grip[0], hd[1] - G.grip[1], false), d.flip));
        }
      }
      if (cam.z > 0.7 && U.dist(S.px, S.py, fn2.fx, fn2.fy) < 520) {
        const tag = caravan ? 'DONKEY CARAVAN' : (CHAR.FIELD_JOBS[fn2.job] ? CHAR.FIELD_JOBS[fn2.job].name.toUpperCase() : 'FIELD');
        plabel(`${tag} — ${fn2.name.split(' ')[0]}${fn2.hungry ? ' · UNPAID' : ''}`, fn2.fx, fn2.fy + 13, 3, fn2.hungry ? '#e0654a' : '#9fd98a');
      }
    }
    // the wreck: a dead caravan where the grey is thickest, standing while a salvage run holds it
    for (const o of S.orders.active) {
      if (!o.salvage || !o.site || !inView(o.site.x, o.site.y, 90)) continue;
      blit(CART_ROWS, o.site.x - 25, o.site.y - 10, 2.5, CART_PAL, true);
      cx.fillStyle = '#3a3f36';
      cx.fillRect(Math.round(o.site.x) - 34, Math.round(o.site.y) + 8, 22, 3);
      cx.fillRect(Math.round(o.site.x) + 10, Math.round(o.site.y) + 12, 16, 3);
      if (!o.looted) { worldCrate(o.site.x - 26, o.site.y + 6, '#ffd98f'); worldCrate(o.site.x + 22, o.site.y + 10, '#ffd98f'); }
      if (cam.z > 0.6 && U.dist(S.px, S.py, o.site.x, o.site.y) < 460) plabel(o.looted ? 'THE WRECK — EMPTIED' : 'THE WRECK', o.site.x, o.site.y + 22, 3, '#c9b98a');
    }
    // townsfolk in lit yards — a station is people, not a building
    for (const id of stationOrder) {
      const d = stations[id], st = S.stations[id];
      if (!st.connected || st.litT <= 0 || !inView(d.x, d.y, 240)) continue;
      if (d.post) continue;   // v3.48: a camp on the wire — its people are the knives at their own fire (drawCamps)
      /* v3.39 — a GARRISONED town: Farkeep's shields stand the square and the grey pennant flies over the door */
      if (typeof Republic !== 'undefined' && S.rep && Republic.isHeld(id)) {
        const h = Republic.held()[id], n2 = (h && h.shields) || REP.DOCTRINE.storm.garrison;   // v3.40: as many as the square stands
        const gs = [[-76, 54], [76, 54], [-96, 22], [96, 22]];
        for (let i = 0; i < Math.min(n2, gs.length); i++) {
          const sx = d.x + gs[i][0], sy = d.y + gs[i][1];   // flanking the yard, clear of the door and the townsfolk's walk
          pixShadow(sx, sy + 3, 12);
          blitFig(sx, sy, 'shield', false, 0, i % 2 ? Math.PI : 0);
        }
        /* v3.41 — the town's OWN beside the mountain's grey: a round shield and a fork, in the town's colours */
        const own = Republic.standingOwn(id), os = [[-58, 86], [58, 86]];   // v3.42: those whose HOURS cover this hour
        for (let i = 0; i < Math.min(own, os.length); i++) {
          const sx = d.x + os[i][0], sy = d.y + os[i][1];
          pixShadow(sx, sy + 3, 12);
          blitFig(sx, sy, 'townshield', false, 0, i % 2 ? Math.PI : 0);
        }
        blit(PENNANT, d.x + 30, d.y - 78, 2.5, PENNANT_PAL, ((S.time * 2) | 0) % 2 === 1);
        if (cam.z > 0.7 && U.dist(S.px, S.py, d.x, d.y) < 520) {
          plabel('GARRISONED — THE REPUBLIC', d.x, d.y + 100, 3, '#8d979c');   // v3.51: under the feet of those standing the square (a label steps down past another)
          if (own) plabel(`${own} OF THE TOWN'S OWN`, d.x, d.y + 100, 3, '#c9b98a');
        }
      }
      const noticing = S.mythSay && S.mythSay.stId === id;   // v3.23: the yard STOPS for the myth
      for (let i = 0; i < 2; i++) {
        const sd = (id.charCodeAt(0) * 977 + i * 5309) >>> 0;
        const ph = S.time * (0.12 + i * 0.07) + sd % 7;
        const fx2 = d.x + Math.cos(ph) * (46 + i * 18);
        const fy2 = d.y + 30 + Math.sin(ph * 0.7) * 14;
        if (noticing) drawNpcFigure(fx2, fy2, { seed: sd }, 'stand', Math.cos(Math.atan2(S.py - fy2, S.px - fx2)) < 0 ? Math.PI : 0);
        else drawNpcFigure(fx2, fy2, { seed: sd }, Math.abs(Math.sin(ph)) > 0.45 ? 'walk' : 'stand', Math.cos(ph) < 0 ? Math.PI : 0);
      }
      // v3.22: a yard the quiet work supplied — loungers on the steps, embers and a lazy ribbon of smoke
      if ((st.smokeT || 0) > 0) {
        for (let i = 0; i < 2; i++) {
          const sd = (id.charCodeAt(1) * 811 + i * 431) >>> 0;
          const lx = d.x + 62 + i * 26, ly = d.y + 52 + (sd % 8);
          drawNpcFigure(lx, ly, { seed: sd }, 'stand', i ? Math.PI : 0);
          const emb = (S.time * 2 + i) % 2 < 1;
          cx.fillStyle = emb ? '#ffb54f' : '#8a4a2a'; cx.fillRect(Math.round(lx) + (i ? -8 : 7), Math.round(ly) - 10, 2, 2);
          cx.globalAlpha = 0.35;
          cx.fillStyle = '#b8b29d';
          const dr = (S.time * 7 + i * 9) % 14;
          cx.fillRect(Math.round(lx) + (i ? -8 : 7), Math.round(ly) - 12 - dr, 2, 2);
          cx.globalAlpha = 1;
        }
      }
      // v3.21: ten walkers armed — YOUR tools on their belts, walking the town's edge with lamps
      if ((st.armed || 0) >= T.armedSafe) {
        for (let i = 0; i < 2; i++) {
          const sd = (id.charCodeAt(0) * 1409 + i * 733) >>> 0;
          const ph = S.time * 0.09 + i * Math.PI + sd % 5;
          const fx2 = d.x + Math.cos(ph) * 195, fy2 = d.y + 24 + Math.sin(ph) * 120;
          drawNpcFigure(fx2, fy2, { seed: sd }, 'walk', Math.cos(ph + Math.PI / 2) < 0 ? Math.PI : 0);
          cx.fillStyle = '#ffd98f'; cx.fillRect(Math.round(fx2) + 7, Math.round(fy2) - 12, 3, 3);   // the lamp they carry
          cx.globalCompositeOperation = 'lighter';
          glowShells(fx2 + 8, fy2 - 11, 10, 'rgba(255,214,140,0.3)');
          cx.globalCompositeOperation = 'source-over';
        }
        if (cam.z > 0.75 && U.dist(S.px, S.py, d.x, d.y) < 520) plabel('ARMED WATCH — YOUR TOOLS', d.x, d.y - 74, 3, '#9fd98a');
      }
    }
    /* v3.44 — THE KIN: where the town's own fell, their kin keep the place a day — a grey shawl, a lantern held low —
       lit yard or dark: a square that rose is the Unlit's, and the kin stand in it all the same. v3.51: drawn after the
       yard's people and the garrison — they stand nearest the eye, and the mountain's shields (a head taller now) had
       stood over them */
    if (typeof Republic !== 'undefined' && S.rep && Republic.kinAt && typeof SPRITES !== 'undefined') for (const id of stationOrder) {
      const kin = Republic.kinAt(id); if (!kin) continue;
      const d = stations[id]; if (!inView(d.x, d.y, 240)) continue;
      const os2 = [[-58, 86], [58, 86]], night = Economy.dayPhase().nightness > 0.1;
      kin.spots.slice(0, 2).forEach((sp, i) => {
        const o = os2[sp % 2], sx = d.x + o[0] + (i && sp === kin.spots[0] ? 26 : 0), sy = d.y + o[1], flip = !!(sp % 2);
        pixShadow(sx, sy + 3, 12);
        blitFig(sx, sy, 'kin', false, 0, flip ? Math.PI : 0);
        if (night) { cx.globalCompositeOperation = 'lighter'; glowShells(sx + (flip ? -14 : 14), sy + 4, 7, 'rgba(255,217,143,0.85)'); cx.globalCompositeOperation = 'source-over'; }
      });
      if (cam.z > 0.7 && U.dist(S.px, S.py, d.x, d.y) < 520) plabel('THE KIN KEEP THE PLACE', d.x, d.y + 100, 2, '#8d979c');   // under their feet, below the square's own words
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
  /* v3.24 THE CINE KIT — the handoff's screen effects, formalized so every scene rents the same
     tools (the user's law: methods, not one-offs). Speed lines, the flash, the slammed stamp, the
     stepped-band vignette — absurdly over-produced against the low-bit world. That contrast IS
     the joke, and the craft. Doctrine holds throughout: stepped bands, never a gradient. */
  function fxSpeedLines(alpha, ph) {
    if (alpha <= 0) return;
    const w = cv.width, ht = cv.height, cxp = w / 2, cyp = ht / 2;
    cx.save();
    cx.globalAlpha = alpha;
    cx.strokeStyle = '#f2ead4';
    cx.lineWidth = 2;
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + ph;
      const r0 = 170 + ((i * 37) % 90), r1 = r0 + 130 + ((i * 53) % 160);
      cx.beginPath();
      cx.moveTo(cxp + Math.cos(a) * r0, cyp + Math.sin(a) * r0);
      cx.lineTo(cxp + Math.cos(a) * r1, cyp + Math.sin(a) * r1);
      cx.stroke();
    }
    cx.restore();
  }
  function fxFlash(k, max = 0.85, col = '255,246,220') {
    if (k <= 0) return;
    cx.fillStyle = `rgba(${col},${U.clamp(k, 0, 1) * max})`;
    cx.fillRect(0, 0, cv.width, cv.height);
  }
  function fxStamp(text) {
    const w = cv.width, ht = cv.height;
    cx.save();
    cx.translate(w / 2, ht * 0.72);
    cx.rotate(-0.06);
    cx.font = `800 ${Math.round(ht * 0.055)}px ${getComputedStyle(document.body).getPropertyValue('--disp') || 'sans-serif'}`;
    cx.textAlign = 'center';
    cx.fillStyle = 'rgba(0,0,0,0.55)'; cx.fillText(text, 4, 4);
    cx.fillStyle = '#ffd98f'; cx.fillText(text, 0, 0);
    cx.restore();
  }
  function fxBands() {
    const w = cv.width, ht = cv.height;
    for (let i = 0; i < 3; i++) {
      const inset = i * Math.round(ht * 0.055);
      cx.fillStyle = `rgba(5,7,11,${0.16 - i * 0.04})`;
      cx.fillRect(0, inset, w, Math.round(ht * 0.055));
      cx.fillRect(0, ht - inset - Math.round(ht * 0.055), w, Math.round(ht * 0.055));
      cx.fillRect(inset, 0, Math.round(w * 0.04), ht);
      cx.fillRect(w - inset - Math.round(w * 0.04), 0, Math.round(w * 0.04), ht);
    }
  }
  function drawHandoffFx(dt) {
    const h = S.handoff;
    if (!h) return;
    if (h.phase === 2 && !h.passed) fxSpeedLines(0.28 * U.clamp((h.t - 1.8) / 0.7, 0, 1), h.t * 0.6);
    if (h.flash > 0) fxFlash(h.flash / 0.14);
    if (h.passed && h.frozeT > 0) { fxStamp('THE LETTER RIDES.'); fxBands(); }
  }
  /* the Cine engine's screen pass: whatever the running shot asked for */
  let cineFxPh = 0;
  function drawCineFx(dt) {
    const f = Cine.fx();
    if (!f) { cineFxPh = 0; return; }
    cineFxPh += dt;
    if (f.lines > 0) fxSpeedLines(0.26 * f.lines, cineFxPh * 0.6);
    for (const fl of f.flickers) {
      if (fl.t < 0 || fl.t > 0.09) continue;
      fxFlash(1, 0.13, '255,236,190');               // gun light over the ridge — the sky answers
      const sx = w2sx(fl.x), sy = w2sy(fl.y);
      if (sx > 0 && sx < cv.width && sy > 0 && sy < cv.height) {
        cx.fillStyle = '#fff2c8';
        cx.fillRect(sx - 5, sy - 1, 10, 2); cx.fillRect(sx - 1, sy - 5, 2, 10);   // the muzzle cross
      }
    }
    if (f.flash > 0) fxFlash(f.flash / 0.14);
    if (f.stamp) { fxStamp(f.stamp); fxBands(); }
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

  /* ---------- weather fx ----------
     v3.19: precipitation has MODES, not amounts — the north's greyfall arrives as SNOW: sparser,
     slower, swaying flakes (never "more raindrops"). The south keeps its solid cartridge dashes. */
  function precipMode() { return Systems.snowAt && Systems.snowAt(cam.x, cam.y) > 0.05 ? 'snow' : 'rain'; }
  function drawRain(dt) {
    const mode = precipMode();
    const r = mode === 'snow' ? Systems.snowAt(cam.x, cam.y) : Systems.rainAt(cam.x, cam.y);
    if (r <= 0 && !rains.length) return;
    const want = reduced || !fxOn ? 0 : Math.round(r * (mode === 'snow' ? 55 : 130));
    while (rains.length < want) rains.push({ x: cam.x + (Math.random() - 0.5) * (cv.width / cam.z / dpr), y: cam.y + (Math.random() - 0.5) * (cv.height / cam.z / dpr), l: 10 + Math.random() * 14, v: 700 + Math.random() * 300, sv: 55 + Math.random() * 50, ph: Math.random() * 7 });
    if (rains.length > want) rains.length = want;
    const vh2 = cv.height / (cam.z * dpr);
    if (mode === 'snow') {
      cx.fillStyle = '#dce8f0';
      for (const p of rains) {
        p.ph += dt;
        p.y += (p.sv || 70) * dt;
        p.x += Math.sin(p.ph * 1.6) * 16 * dt;
        if (p.y > cam.y + vh2 / 2 + 30) { p.y = cam.y - vh2 / 2 - 20; p.x = cam.x + (Math.random() - 0.5) * (cv.width / (cam.z * dpr)); }
        const fx3 = Math.round(p.x / 2) * 2, fy3 = Math.round(p.y / 2) * 2;
        cx.fillRect(fx3, fy3, 2, 2);
      }
      return;
    }
    // greyfall rain: solid falling dashes, the way a cartridge rained
    cx.fillStyle = '#7e93a6';
    for (const p of rains) {
      p.y += p.v * dt; p.x += p.v * 0.12 * dt;
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
      } else if (f.type === 'tracer') {
        // v3.25 the Timberwolf's line — one hard streak, gone in a blink, a hot point at the end
        const t = f.t / 0.22;
        if (t >= 1) { fx.splice(i, 1); continue; }
        cx.save();
        cx.globalAlpha = (1 - t) * 0.9;
        cx.strokeStyle = '#fff2c8'; cx.lineWidth = 1.6;
        cx.beginPath(); cx.moveTo(f.x, f.y); cx.lineTo(f.x2, f.y2); cx.stroke();
        cx.fillStyle = '#ffd98f'; cx.fillRect(Math.round(f.x2) - 2, Math.round(f.y2) - 2, 4, 4);
        cx.restore();
      } else if (f.type === 'arrow') {
        /* v3.42 THE BOLT in flight: texels laid along its line — grid-true at any angle (each texel is
           a k×k block on the buffer grid), a shadow on the ground under it, a hand's-width of arc */
        const T3 = 0.28, t = Math.min(1, f.t / T3);
        if (f.t >= T3 + 0.06) { fx.splice(i, 1); continue; }
        const tw = rigT(), dx = f.x2 - f.x, dy = f.y2 - f.y, L = Math.max(1, Math.hypot(dx, dy)), ux = dx / L, uy = dy / L;
        const tipX = f.x + dx * t, tipY = f.y + dy * t - Math.sin(t * Math.PI) * 9;
        pixShadow(tipX - ux * 3 * tw, tipY + 14, 10);
        const snap = v => Math.round(v / tw) * tw;
        const PAL = typeof SPRITES !== 'undefined' ? SPRITES.ARROW_PAL : { R: '#c9553a', r: '#8a3a2c', Y: '#8a6534', W: '#b8c2c8' };
        const cols = ['W', 'Y', 'Y', 'Y', 'Y', 'R', 'r'];   // the head, the shaft, the fletching
        for (let k = 0; k < cols.length; k++) {
          const px2 = snap(tipX - ux * k * tw), py2 = snap(tipY - uy * k * tw);
          cx.fillStyle = PAL[cols[k]]; cx.fillRect(px2, py2, tw, tw);
          if (k >= 5) { cx.fillRect(px2 - uy * tw, py2 + ux * tw, tw, tw); }   // the fletching stands off the shaft
        }
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
      const wp = f.who ? posOf(f.who) : null, bx = wp && Number.isFinite(wp.x) ? wp.x + f.dx : f.x, by = wp && Number.isFinite(wp.y) ? wp.y + f.dy : f.y;   // v3.47: a runner's line rides with him — a knife walking on does not leave his words hanging in the air behind
      plabel(f.text, bx, by - t * 26, 3, col, { alpha: a, wrap: 26 });
    }
  }
  /* a line spoken in the world — hangs over someone's head, then lets go */
  const posOf = w => ({ x: w.cx !== undefined ? w.cx : w.x, y: w.cy !== undefined ? w.cy : w.y });   // v3.48: a hand walks on cx/cy, a runner on x/y
  function say(x, y, text, color, who) { const wp = who ? posOf(who) : null; fx.push({ type: 'say', x, y: y - 34, text, color, t: 0, who: who || null, dx: wp ? x - wp.x : 0, dy: wp ? y - 34 - wp.y : 0 }); while (fx.filter(f => f.type === 'say').length > 3) fx.splice(fx.findIndex(f => f.type === 'say'), 1); }
  function burst(x, y) { fx.push({ type: 'burst', x, y, t: 0 }); }
  function tracer(x, y, x2, y2) { fx.push({ type: 'tracer', x, y, x2, y2, t: 0 }); }
  function arrow(x, y, x2, y2) { fx.push({ type: 'arrow', x, y, x2, y2, t: 0 }); }   // v3.42: a bowman's bolt
  function puff(x, y) { fx.push({ type: 'ring', x, y, t: 0.45 }); }   // v3.27: a work paying — small, warm, brief
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
  /* v3.52: a banner never lands across a paper — the slip, a terminal, a sheet: it waits for the world to be in view again
     (the slip's own rows already say what the walk earned), then lands, one at a time */
  const announceQ = [];
  let announceAt = 0;
  function announce(text) {
    const el = document.getElementById('announce');
    if (!el) return;
    if ((typeof UI !== 'undefined' && UI.anyModal && UI.anyModal()) || announceQ.length) {
      if (performance.now() >= announceAt) el.textContent = text;   // the banner's words are set now (unless one is still landing); only its landing waits
      if (!announceQ.includes(text)) announceQ.push(text);
      return;
    }
    slamAnnounce(el, text);
  }
  function slamAnnounce(el, text) {
    el.classList.remove('slam'); void el.offsetWidth;
    el.textContent = text;
    el.classList.add('slam');
    announceAt = performance.now() + 2200;
  }
  function flushAnnounce() {
    if (!announceQ.length || performance.now() < announceAt || (typeof UI !== 'undefined' && UI.anyModal && UI.anyModal())) return;
    const el = document.getElementById('announce');
    if (el) slamAnnounce(el, announceQ.shift());
  }
  function setFx(on) { fxOn = on; }
  return { frame, flare, buildFx, hopCrate, likeBurst, say, burst, tracer, arrow, puff, faceURL, walkerFaceURL, rigOverlayURL, handFaceURL, chiefFaceURL, clearFx: () => { fx.length = 0; likes.length = 0; }, labelBoxes: () => lastLabels.map(r => ({ x0: r[0], y0: r[1], x1: r[2], y1: r[3], str: r[4] })), announce, setFx, screenToWorld, get cam() { return cam; }, stockDebug: id => { delete stockCache[id]; return stockRead(id); }, coatPal: () => coatFor(), wornPal, walkerDrawn: () => lastWalker, faceWalker(fc) { walkerFc = fc; }, courierPal,
    walkerAt(c, r) { const w = lastWalker; if (!w) return null; const T2 = rigT(), cc = w.fc === 'W' ? 31 - c : c; return { x: w.x + (cc - 16 + 0.5) * T2, y: w.y + 5 * 1.22 + (r - 32 + 0.5) * T2 }; }, /* v3.50: the world point under a texel of the Walker's frame (the suites sample what is lashed on) */ setZoom(v) { zoomOverride = v || null; if (v) cam.z = v; }, nudgeZoom, zoomStepOf: () => zoomStep, setZoomStep(v) { zoomStep = 0; nudgeZoom(v | 0); }, zoomLevel: () => effZ, zoomRange, texelLaw: () => ({ zw: curZw, P: pixk, rigK: rigK(), blitK: Math.max(1, Math.round(2.5 * curZw)), z: effZ }), setTitleDrift(on) { titleDrift = !!on; if (on) driftT = Math.random() * 60; }, noteE, eKeyState: () => ({ shown: eKeyShown(), held: eHeld }), effZoom: () => effZ || cam.z * dpr, crtTitle, crtActive: () => !!crtNow || crtQ.length > 0, crtText: () => { const o = crtNow || crtQ[0]; return o ? { big: o.big, small: o.small } : null; }, structDebug: t => { const s = structSprite(t, false, false); return { w: s.width, h: s.height }; },
    leaves: () => leavesA, gust: n => spawnGust(n), precipMode, cargoGlyph: c => cargoGlyphFor(c), rigPreviewURL, npcRigURL, npcRigSize, rimCells,
    darkAt: (wx, wy) => {   // how much darkness layer covers this world point, 0..1 — the punch's own ledger
      if (!nightC) return -1;
      const z2 = (effZ || cam.z * dpr) / pixk;
      const bx = Math.round(lastWtx + wx * z2), by = Math.round(lastWty + wy * z2);
      if (bx < 0 || by < 0 || bx >= nightC.width || by >= nightC.height) return -1;
      return nightCx.getImageData(bx, by, 1, 1).data[3] / 255;
    } };
})();


