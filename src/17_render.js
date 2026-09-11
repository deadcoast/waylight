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
    /* v3.32 — a registry room owns the whole frame: the world waits at the door */
    if (S.room && typeof REP !== 'undefined' && REP.INTERIORS[S.room.id]) { drawRoom(dt); return; }
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
    drawStations(inView, dt); mark('stations');
    drawRepublic(inView, dt); mark('republic');   // v3.32: shrines, larders, the column, the far shape — over the doors they answer

    mark('overlays');
    drawWisps(dt, inView); mark('wisps');
    // creatures of the mist and the porter ride above it
    drawWire(inView, dt); mark('wire');
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
    cx.drawImage(worldC, 0, 0, worldC.width, worldC.height, 0, 0, worldC.width * PIXK, worldC.height * PIXK);   // exact 3× — every buffer pixel a clean block
    cx.imageSmoothingEnabled = true;
    drawLabels(z, wtx * PIXK, wty * PIXK);
    drawEKey(z, wtx * PIXK, wty * PIXK, dt);

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
    /* v3.23, from the audited research: the BREATH. Same silhouette to the texel — only the coat's
       shade clusters drift (shading migration reads as volume; the ribs rise without a contour move) */
    idle2: [
      '.....OOO....', '....OHHHO...', '...OHHHHHO..', '...OHSSeO...', '...OHSSSO...', '....OSSO....',
      '..OOCCCCO...', '.OTTOCCcCO..', 'OTTTOCCCCSO.', 'OTTTOCCcCSO.', 'OTTTOCCcCO..', 'OtttOCCcCO..',
      '.OOOOCcCcO..', '....OcCCO...', '....OBOBO...', '....OBOBO...', '....ObObO...', '............',
    ],
  };
  const PAL_WALKER = { O: '#12161c', H: '#2c4258', S: '#e0c298', e: '#2a2118', C: '#3d5a74', c: '#2c4258', T: '#c9a05a', t: '#a5824a', B: '#23282f', b: '#171b21' };
  const PAL_MATE = { O: '#12161c', H: '#41522f', S: '#d8b890', e: '#2a2118', C: '#54683f', c: '#41522f', T: '#b8a06a', t: '#94804f', B: '#23282f', b: '#171b21' };
  const PAL_SCRAP = { O: '#150f0c', H: '#33241e', S: '#d8b890', e: '#241a12', C: '#8a4432', c: '#6b3426', T: '#5a4a3a', t: '#453a2e', B: '#20242a', b: '#15181e' };
  const rigCache = new Map();
  function rigSprite(pal, frame, flip) {
    const key = frame + (flip ? 'f|' : '|') + pal.C + pal.c + pal.T + pal.H + (pal.t || '') + (pal.B || '') + (pal.b || '') + (pal.S || '');
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
  /* v3.35 — the last two sub-texel rows of the sandbox retired: the Hollow Fires' larder (the wrong
     fire with its green heart, the rack, what hangs drawn SMALL and unclear — mercy in texels) and
     the Reapers' hooded figure (the file's own glyph, 8×18, the slit its only light) */
  const LARDER_PAL = { O: '#12161c', R: '#c25038', r: '#8a3a2a', G: '#8fb08a', g: '#5a7a58', W: '#4a3320', w: '#2e1c0c', S: '#8d979c', k: '#23282f' };
  const LARDER = [[
    '.......G........', '......OGO..WW...', '.....ORGRO.WW...', '....ORrRrRO.WWWW', '....ORRGRRO.SWS.', '.....ORrRO..SWS.', '...OOORRROOOWWWW', '..OkkkkkkkkO.W..', '.OkkkkkkkkkkO.W.', 'OOOOOOOOOOOOOOOO',
  ], [
    '......G.........', '.....OGO...WW...', '.....ORGO..WW...', '....ORrRRO..WWWW', '....ORRGRRO.SWS.', '....ORrRrRO.SWS.', '...OOORRROOOWWWW', '..OkkkkkkkkO.W..', '.OkkkkkkkkkkO.W.', 'OOOOOOOOOOOOOOOO',
  ], [
    '........G.......', '......OGGO.WW...', '.....ORGRO.WW...', '.....ORrRO..WWWW', '....ORRGRRO.SWS.', '....ORrRrRO.SWS.', '...OOORRROOOWWWW', '..OkkkkkkkkO.W..', '.OkkkkkkkkkkO.W.', 'OOOOOOOOOOOOOOOO',
  ]];
  const REAPER_PAL = { O: '#12151f', H: '#232840', h: '#2a3048', L: '#9aa4ff', k: '#1a1e2c' };
  const REAPER = [
    '...OO...', '..OHHO..', '.OHHHHO.', '.OHLLHO.', '.OHHHHO.', '.OhHHhO.', 'OhhHHhhO', 'OhhhhhhO', 'OhhhhhhO', 'OhhhhhhO', '.OhhhhO.', '.OhhhhO.', '.OhhhhO.', '.OhhhhO.', '.OhhhhO.', '.OkkkkO.', '..OOOO..', '........',
  ];
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
    // the idle breathes on an UNEVEN cadence (hold 2.0s, breath 0.4s) — weight lives in timing
    const frame = moving ? (Math.sin(phase) > 0 ? 'A' : 'B') : ((S && S.time % 2.4) > 2.0 ? 'idle2' : 'idle');
    blitRigSprite(rigSprite(pal, frame, Math.cos(dir) < 0), x, y);
  }
  /* =============== v3.33 THE ASSET PASS — the registry draws ===============
     blitKit: a Farkeeper class from SPRITES.KIT, 14×22 in the walker's own placement law (feet at
     y+5, whole-pixel texels). drawMount: EVERY saddle in the game — the stable's generated-and-
     quantized breeds by name, the authored HORSE_F standing as the fallback row. Returns the
     seat offset (local units) so a rider composes onto the back. Texel math is EXACT: a texel is
     k buffer px, and k / m.a local units under whatever transform the caller stands in. */
  function blitKit(x, y, cls, moving, phase, dir) {
    const K = SPRITES.KIT[cls] || (SPRITES.FIGURES || {})[cls]; if (!K) return false;   // v3.34: the figure rows share the kit's blit
    const frame = moving ? (Math.sin(phase) > 0 ? 'A' : 'B') : 'idle';
    const sp = glyphSprite(K[frame], SPRITES.FK_PAL, Math.cos(dir) < 0);
    const k2 = rigK(), m = cx.getTransform();
    if (Math.abs(m.b) > 0.001) { const tw = k2 / curZw; cx.drawImage(sp, x - 7 * tw, y + 5 - 22 * tw, 14 * tw, 22 * tw); return true; }
    const bx = Math.round(x * m.a + m.e) - 7 * k2, by = Math.round((y + 5) * m.d + m.f) - 22 * k2;
    cx.save(); cx.setTransform(1, 0, 0, 1, 0, 0); cx.imageSmoothingEnabled = false;
    cx.drawImage(sp, bx, by, 14 * k2, 22 * k2);
    cx.restore();
    return true;
  }
  /* a Farkeeper rider at the gallop: the mountain's own Fjord under a hooded ward — militia, rescue */
  const FK_RIDER_PAL = { ...PAL_MATE, C: '#3a4048', c: '#2a3038', T: '#8d979c', t: '#6e747c' };
  function drawRider(x, y, moving, tSec, flip) {
    const seat = drawMount(x, y + 5, 'fjord', moving, tSec, flip);
    if (!seat) return;                                   // the authored fallback carried its own rider
    cx.save(); cx.translate(seat.rx, seat.ry);
    blitWalker(0, 0, FK_RIDER_PAL, false, 0, flip ? Math.PI : 0);
    cx.restore();
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
      for (const lx of [-104, 104]) {
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
      plabel(r.name.split(' ')[0], sl.x, sl.y + h * tx * 0.5 + 8, 2, dr.pal.s);
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
  /* =============== v3.32 — the interior room: a registry row drawn whole ===============
     The room draws into the world buffer at the game's own fat-pixel discipline: concrete
     ribs, cold strip light, furniture by KIND (a future room reuses every glyph), the walker
     small and real on the slab floor. */
  function drawRoom(dt) {
    const R = REP.INTERIORS[S.room.id], rm = S.room;
    const ST = REP.ROOM_STYLES[R.style] || REP.ROOM_STYLES.concrete;   // v3.34: one renderer, a material per row
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
          blitRigSprite(glyphSprite(SPRITES.TENDER, SPRITES.TENDER_PAL, false), s2.x + 18, s2.y - 5);
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
        if (typeof SPRITES === 'undefined' || !blitKit(p.x, p.y, 'shield', true, S.time * 9 + i * 1.7, dir)) shieldFigure(p.x, p.y, Math.sin(S.time * 8 + i * 1.7) * 1, Math.cos(dir) < 0);
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
      cx.globalAlpha = 0.35; px(f.x - 6, f.y - 1, 12, 2, '#12151f'); cx.globalAlpha = 1;
      blit(REAPER, f.x - 10, f.y - 46, 2.5, REAPER_PAL, Math.cos(Math.atan2(ev.vy, ev.vx)) < 0);   // v3.35: the file's own glyph, facing its way
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
  /* a Farkeeper shield, standing or marching — the column's figure and the watchpost's, one glyph */
  function shieldFigure(x, y, step, flip) {
    /* drawn at the WALKER'S scale (a head taller — the mountain people are large, not giants):
       iron jaw under a grey helm, the coat, THE SHIELD on the road-side arm, boots that step */
    const px = (x2, y2, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x2), Math.round(y2), Math.round(w), Math.round(h)); };
    const shx = flip ? x + 4 : x - 8;
    px(x - 3, y - 14 + step, 7, 11, '#5a6a7a');                      // the coat
    px(x - 3, y - 14 + step, 7, 1, '#6e7a82');
    px(x - 1, y - 9 + step, 3, 1, '#23282f');                        // the belt
    px(x - 2, y - 18 + step, 5, 4, '#c9b098');                       // the jaw of iron
    px(x - 3, y - 20 + step, 7, 3, '#8d979c'); px(x - 3, y - 20 + step, 7, 1, '#b8c2c8');   // the helm
    px(shx, y - 15 + step, 4, 12, '#8d979c');                        // THE SHIELD
    px(shx, y - 15 + step, 4, 1, '#b8c2c8'); px(shx + 1, y - 10 + step, 2, 2, '#23282f');   // rim + the cold iron boss
    px(x - 2, y - 3, 2, 3, '#23282f'); px(x + 1, y - 3 + step, 2, 3, '#23282f');            // the boots
  }
  function drawGiant(inView) {
    if (typeof Republic === 'undefined' || !S.rep) return;
    const gA = Republic.giant().act;
    if (!gA || !inView(gA.x, gA.y, 520)) return;
    /* the mist passes ran in SCREEN space and left the transform there — restore the WORLD
       transform the frame saved, so these world coords land on the ground, not off-buffer */
    cx.setTransform(curZw, 0, 0, curZw, lastWtx, lastWty);
    const px = (x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    {
      /* the grey stands BEHIND it — a bright ghost-sheet the silhouette cuts out of. Built with
         'lighter' so it ADDS hard to whatever ground it lies on: the dark shape reads against it
         on blue deep-mist, dusk brown, or pale night alike. Two dithered hems so it is MIST,
         not a painted box. */
      cx.globalCompositeOperation = 'lighter';
      cx.globalAlpha = 1;
      px(gA.x - 72, gA.y - 160, 144, 170, '#9aa6b2');
      cx.globalAlpha = 0.6;
      px(gA.x - 96, gA.y - 182, 192, 200, '#7a8692');
      cx.globalAlpha = 0.3;
      px(gA.x - 124, gA.y - 204, 248, 242, '#5a6570');
      cx.globalCompositeOperation = 'source-over';
      /* the shape itself: near-black, OPAQUE — a hole punched in the ghost-light */
      cx.globalAlpha = 1;
      px(gA.x - 26, gA.y - 74, 14, 78, '#090b0e');         // leg columns
      px(gA.x + 12, gA.y - 74, 14, 78, '#090b0e');
      px(gA.x - 24, gA.y - 68, 10, 22, '#0d1015');         // knee housings
      px(gA.x + 14, gA.y - 66, 10, 20, '#0d1015');
      px(gA.x - 38, gA.y - 128, 76, 60, '#090b0e');        // the hull over the mist
      px(gA.x - 38, gA.y - 130, 76, 3, '#8a94a0');         // the backlit rim — dusk finds an edge
      px(gA.x - 48, gA.y - 118, 12, 32, '#090b0e');        // shoulder blocks
      px(gA.x + 36, gA.y - 116, 12, 30, '#090b0e');
      px(gA.x - 48, gA.y - 120, 12, 2, '#6e7883');
      px(gA.x + 36, gA.y - 118, 12, 2, '#6e7883');
      px(gA.x - 12, gA.y - 150, 26, 24, '#090b0e');        // the head-shape, small against the hull and wrong for it
      px(gA.x - 12, gA.y - 152, 26, 3, '#8a94a0');
      /* the one running light — a machine's red eye in the grey, pulsing slow. Reads on ANYTHING. */
      const bl = (Math.sin(S.time * 1.3) + 1) / 2;
      cx.globalCompositeOperation = 'lighter';
      glowShells(gA.x, gA.y - 140, 10 + bl * 4, `rgba(224,80,60,${0.5 + bl * 0.4})`);
      cx.globalCompositeOperation = 'source-over';
      px(gA.x - 2, gA.y - 142, 4, 4, bl > 0.5 ? '#ff8a6a' : '#c25038');   // the eye
    }
  }

  function drawCamps(inView, dt) {
    for (const cd of DATA.camps) {
      const cs = S.camps[cd.id];
      if (!inView(cd.x, cd.y, cd.r + 100)) continue;
      // tents: an authored hide-tent glyph, door lit by the fire
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1, tx = cd.x + Math.cos(a) * 40, ty = cd.y + Math.sin(a) * 26;
        /* v3.34: a HELD camp pitches Farkeep grey — the mountain's canvas, not the raiders' hide */
        const tpal = cs.taken ? { O: '#12161c', R: '#6e7a82', r: '#8d979c', D: '#ffd98f' }
          : { O: '#12100c', R: cs.pacified ? '#4c4c44' : '#513e34', r: cs.pacified ? '#5c5c52' : '#634c3e', D: cs.pacified ? '#c9a05a' : '#c96a48' };
        blit(TENT, tx - 15, ty - 12, 2.5, tpal, i === 1);
      }
      // the camp fire — authored frames on their logs, wearing a corona
      cx.globalCompositeOperation = 'lighter';
      glowShells(cd.x, cd.y - 5, 15 + (((S.time * 6) | 0) % 2) * 2, cs.pacified ? 'rgba(255,214,140,1)' : 'rgba(255,150,90,1)');
      cx.globalCompositeOperation = 'source-over';
      blit(FIRE_F[((S.time * 6) | 0) % 3], cd.x - 8.75, cd.y - 15, 2.5, FIRE_PAL, false);
      // stash
      if (cs.stash.length && !cs.taken) { cx.fillStyle = '#c9b98a'; cx.fillRect(cd.x + 24, cd.y - 8, 14, 12); cx.fillRect(cd.x + 30, cd.y - 16, 12, 10); }   // a watchpost piles its salvage in crates instead
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
      } else if (cs.taken) {
        /* v3.34 — THE WATCHPOST: shields stand the fire in shifts under Farkeep's grey pennant,
           and the ring's salvage piles by the post. The taking is SEEN holding. */
        const W = REP.WATCHPOST;
        for (let i = 0; i < W.shields; i++) {
          const sx = cd.x + (i ? 66 : -66), sy = cd.y + 34;   // flanking the fire, outside the tent ring — both shields face the road
          pixShadow(sx, sy + 3, 12);
          /* standing, not marching: the idle row, the second guard flipped */
          if (typeof SPRITES === 'undefined' || !blitKit(sx, sy, 'shield', false, 0, i ? Math.PI : 0)) shieldFigure(sx, sy, 0, !!i);
        }
        blit(PENNANT, cd.x + 4, cd.y - 66, 2.5, PENNANT_PAL, ((S.time * 2) | 0) % 2 === 1);   // the grey pennant over the fire, turning in the wind
        if (cs.stash.length) blit(CRATES, cd.x + 26, cd.y + 6, 2.5, CRATES_PAL, false);     // the salvage pile, iron-grey
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
  /* a standalone rig portrait for chargen, the tailor and the equip sheet */
  function rigPreviewURL(look, scale = 8, frame = 'idle') {
    const pal = { ...PAL_WALKER, ...(look || {}) };
    const sp = rigSprite(pal, frame, false);
    const c = document.createElement('canvas'); c.width = 12 * scale; c.height = 18 * scale;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.drawImage(sp, 0, 0, c.width, c.height);
    return c.toDataURL();
  }
  /* v3.36 — a walker's OWN figure for the muster roll: the same palette law drawNpcFigure walks
     (hood and scarf from the seed; Farkeep grey for the mountain; the kit's registry row for a
     drawn class), rendered to a data URL at a whole-texel scale — no stand-in portraits */
  function npcRigURL(npc, scale = 4) {
    const c = document.createElement('canvas'), g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const kitCls = npc && npc.fk && typeof SPRITES !== 'undefined' && SPRITES.KIT[npc.fkCls || 'pugugly'] ? (npc.fkCls || 'pugugly') : null;
    if (kitCls) {
      const sp = glyphSprite(SPRITES.KIT[kitCls].idle, SPRITES.FK_PAL, false);
      c.width = 14 * scale; c.height = 22 * scale;
      g.imageSmoothingEnabled = false; g.drawImage(sp, 0, 0, c.width, c.height);
      return c.toDataURL();
    }
    const rg = U.rng(npc ? npc.seed : 7);
    const hood = U.pick(rg, CHAR.PORTRAIT.hoods), scarf = U.pick(rg, CHAR.PORTRAIT.scarves);
    const pal = npc && npc.fk ? { ...PAL_MATE, C: '#3a4048', c: '#2a3038', T: '#8d979c', t: '#6e747c', F: '#d8c9b8' } : { ...PAL_MATE, C: hood, T: scarf };
    const sp = rigSprite(pal, 'idle', false);
    c.width = 12 * scale; c.height = 18 * scale;
    g.imageSmoothingEnabled = false; g.drawImage(sp, 0, 0, c.width, c.height);
    return c.toDataURL();
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
    core: { rows: ['OOOOOOOO', 'OGGGGGGO', 'OGWWWWGO', 'OGGGGGGO', 'OOOOOOOO'] },
    ingot: { rows: ['.OOOO...', 'OmTTTO..', 'OOOOOOO.', 'OTTTmTO.', 'OOOOOOO.'] },
    slab: { rows: ['OOOOOOO.', 'OCcCCCO.', 'OOOOOOO.', 'OcCCCcO.', 'OOOOOOO.'] },
  };
  const CG_BASE = { O: '#12161c', P: '#6b4a30', p: '#8a6a42', W: '#f2ead4', T: '#8a8f98', t: '#6e747c', l: '#d8dde2', L: '#8a6534', X: '#9a8468', x: '#c2ab89', K: '#b3a06a', k: '#8a7a4e', D: '#5a626c', d: '#7a828c', M: '#2c8a7c', G: '#ffc978', m: '#9aa2ab', C: '#9a8468', c: '#c2ab89', B: '#b3a06a' };
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
  function stampRows(rows, x0, y0, t, pal) {
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.') continue;
        cx.fillStyle = pal[ch] || '#f0f';
        cx.fillRect(x0 + i * t, y0 + j * t, t + 0.05, t + 0.05);
      }
    }
  }
  /* the EQUIPPED frame holds the tower — wide rails, the courier's strap, the exo's live struts */
  function drawPackFrame(towerH, crouch, bob, tw) {
    const eq = S.equip && S.equip.pack ? S.equip.pack.defId : 'pack0';
    if (eq === 'pack0' || eq === 'pack_sled') return;
    const base = -10.5 * tw - crouch + bob * 0.5 + 1;
    const H2 = Math.max(7, towerH + 1.5);
    const top = base - H2;
    if (eq === 'pack_wide') {
      cx.fillStyle = '#12161c'; cx.fillRect(-8.2, top - 0.8, 2.6, H2 + 1.6); cx.fillRect(5.6, top - 0.8, 2.6, H2 + 1.6);
      cx.fillStyle = '#3a3428'; cx.fillRect(-7.6, top, 1.6, H2); cx.fillRect(6.2, top, 1.6, H2);
      cx.fillStyle = '#4a4432'; cx.fillRect(-7.6, base - 1.4, 15.4, 1.6);
    } else if (eq === 'pack_rig') {
      cx.fillStyle = '#12161c'; cx.fillRect(-7.4, top - 0.6, 2, H2 + 1.2); cx.fillRect(5.4, top - 0.6, 2, H2 + 1.2);
      cx.fillStyle = '#4a5560'; cx.fillRect(-6.9, top, 1.2, H2); cx.fillRect(5.9, top, 1.2, H2);
      cx.fillStyle = '#c9a05a'; cx.fillRect(-6.9, top + H2 * 0.42, 14, 1.2);
    } else if (eq === 'pack_exo1' || eq === 'pack_exo2') {
      const th = eq === 'pack_exo2' ? 2.4 : 1.7;
      cx.fillStyle = '#12161c'; cx.fillRect(-8.6, top - 1, th + 1.2, H2 + 2); cx.fillRect(7 - 0.6, top - 1, th + 1.2, H2 + 2);
      cx.fillStyle = '#8d979c'; cx.fillRect(-8, top, th, H2); cx.fillRect(7, top, th, H2);
      cx.fillStyle = '#6fe3d2'; cx.fillRect(-8, base - 2.6, th, 2.2); cx.fillRect(7, base - 2.6, th, 2.2);
      if (eq === 'pack_exo2') { cx.fillStyle = '#6fe3d2'; cx.fillRect(-8, top + 0.4, th, 1.8); cx.fillRect(7, top + 0.4, th, 1.8); }
    }
  }
  /* the snow the body collected — hood first, then the shoulders, then the cap in full */
  function drawSnowCap(x, y, flip, amt) {
    const tw = rigT();
    const px2 = (c, r, col) => { const cc = flip ? 11 - c : c; cx.fillStyle = col; cx.fillRect(x + (cc - 6) * tw, y + 5 + (r - 18) * tw, tw, tw + 0.05); };
    const SN = '#e8f2f8', sn = '#c2d4e0';
    px2(5, 0, SN); px2(6, 0, SN); px2(7, 0, sn);
    if (amt >= 0.55) { px2(4, 1, sn); px2(6, -1, SN); px2(2, 6, SN); px2(3, 6, sn); px2(8, 6, SN); }
    if (amt >= 0.85) { px2(5, -1, SN); px2(7, -1, sn); px2(4, 0, SN); px2(8, 1, sn); px2(9, 6, sn); px2(2, 5, sn); }
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

  /* v3.23 THE MYTH: the handoff kid with the letter held HIGH, the envelope's flight, and the
     children who run the fences to keep the myth in sight */
  function drawMythWorld(dt) {
    const h = S.handoff;
    if (h) {
      const kx = Math.round(h.kidX), ky = Math.round(h.kidY);
      cx.save(); cx.translate(kx, ky); cx.scale(0.72, 0.72);
      drawNpcFigure(0, 0, { seed: h.seed }, U.dist(h.kidX, h.kidY, h.kidTX, h.kidTY) > 6 ? 'walk' : 'stand', Math.cos(Math.atan2(S.py - h.kidY, S.px - h.kidX)) < 0 ? Math.PI : 0);
      cx.restore();
      // the raised arm and the LETTER, held into the sky
      if (!h.passed) {
        cx.fillStyle = '#d8b890'; cx.fillRect(kx + 3, ky - 22, 2, 8);
        cx.fillStyle = '#12161c'; cx.fillRect(kx + 1, ky - 27, 8, 6);
        cx.fillStyle = '#f2ead4'; cx.fillRect(kx + 2, ky - 26, 6, 4);
        cx.fillStyle = '#ffd98f'; cx.fillRect(kx + 2, ky - 24, 6, 1);
      }
      // the pass: the envelope arcs to the rider's hand
      if (h.envT >= 0 && h.envT < 0.45) {
        const k = h.envT / 0.45;
        const ex = h.kidX + (S.px - h.kidX) * k, ey2 = (h.kidY - 24) + (S.py - 16 - (h.kidY - 24)) * k - Math.sin(k * Math.PI) * 14;
        cx.fillStyle = '#12161c'; cx.fillRect(Math.round(ex) - 4, Math.round(ey2) - 3, 8, 6);
        cx.fillStyle = '#f2ead4'; cx.fillRect(Math.round(ex) - 3, Math.round(ey2) - 2, 6, 4);
        cx.fillStyle = '#ffd98f'; cx.fillRect(Math.round(ex) - 3, Math.round(ey2), 6, 1);
      }
      if (cam.z > 1.4 && !h.passed) plabel('THE LETTER — HELD HIGH', kx, ky + 16, 3, '#ffd98f');
    }
    if (S.kids) for (const k of S.kids) {
      cx.save(); cx.translate(Math.round(k.x), Math.round(k.y)); cx.scale(0.68, 0.68);
      drawNpcFigure(0, 0, { seed: k.seed }, 'walk', Math.cos(S.dir) < 0 ? Math.PI : 0);
      cx.restore();
    }
  }
  /* v3.24 THE RIDE — the actors of the firing-squad parody: the kneeling courier, the reaper
     line (tall cloaks, pale eyes — the mist's own uniform), the held rider who BOLTS, and the
     watch ridge full of Haven's people with the kid pressed to the front. */
  function drawRideWorld(dt) {
    const R = S.ride;
    if (!R) return;
    for (const w of R.watchers) {
      cx.save(); cx.translate(Math.round(w.x), Math.round(w.y));
      if (w.kid) cx.scale(0.72, 0.72);
      drawNpcFigure(0, 0, { seed: w.seed }, 'stand', Math.cos(Math.atan2(R.gy - w.y, R.gx - w.x)) < 0 ? Math.PI : 0);
      cx.restore();
    }
    // the reapers work by one cold lamp — the only light out here, and it isn't warm
    cx.globalCompositeOperation = 'lighter';
    glowShells(R.gx, R.gy - 4, 66, 'rgba(140,152,255,0.20)');
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = '#12161c'; cx.fillRect(Math.round(R.gx) + 14, Math.round(R.gy) - 22, 2, 24);   // the lamp staff
    cx.fillStyle = '#9aa4ff'; cx.fillRect(Math.round(R.gx) + 13, Math.round(R.gy) - 25, 4, 4);    // its pale head
    // the captive: on his knees before the guns
    cx.save(); cx.translate(Math.round(R.captive.x), Math.round(R.captive.y) + 4); cx.scale(1, 0.78);
    drawNpcFigure(0, 0, { seed: R.captive.seed }, 'stand', 0);
    cx.restore();
    for (const r of R.reapers) {
      const fl = (R.captive.x - r.x) < 0 ? -1 : 1;
      const rx = Math.round(r.x), ry = Math.round(r.y);
      pixShadow(rx, ry + 5, 14);
      cx.fillStyle = '#0b0d12';
      cx.fillRect(rx - 4, ry - 16, 8, 21);            // the cloak
      cx.fillRect(rx - 5, ry - 12, 10, 9);            // the shoulders
      cx.fillStyle = '#151a24';
      cx.fillRect(rx + (fl < 0 ? -4 : 2), ry - 15, 2, 18);   // one cold edge of light
      cx.fillStyle = '#9aa4ff';
      cx.fillRect(rx + fl - 2, ry - 13, 2, 1);        // the eyes
      cx.fillRect(rx + fl + 1, ry - 13, 2, 1);
      if (R.aim) { cx.fillStyle = '#232a36'; cx.fillRect(fl < 0 ? rx - 12 : rx + 3, ry - 11, 9, 2); }   // rifles level
    }
    const rd = R.rider;
    cx.save(); cx.translate(Math.round(rd.x), Math.round(rd.y));
    pixShadow(0, 8, 30);
    drawMount(0, 5, (S.horse && S.horse.breed) || 'mustang', rd.bolted, S.time, Math.cos(rd.boltAng) < 0, { bare: true });   // the horse that bolts is YOURS
    cx.restore();
    if (rd.bolted && rd.gone < 8 && Math.random() < dt * 10) fx.push({ type: 'burst', x: rd.x - Math.cos(rd.boltAng) * 20, y: rd.y + 8, t: 0.28 });
  }
  /* v3.25 THE CLOAKED TORCH — the Lamplighter on the ridge: a dark cloak cut like the Reapers'
     silhouette (the mist dresses everyone the same) but carrying a HOODED LANTERN, one gold slit
     where the light escapes. Beside them, when the scene calls it: the raised-tongue stranger —
     olive coveralls, a glass glint, cleaner than anything the march has seen in years. */
  function drawLampWorld(dt) {
    const L = S.lamp;
    if (!L) return;
    const fx2 = Math.round(L.fig.x), fy2 = Math.round(L.fig.y);
    pixShadow(fx2, fy2 + 5, 15);
    cx.fillStyle = '#12161c';
    cx.fillRect(fx2 - 4, fy2 - 17, 8, 22);            // the cloak, tall
    cx.fillRect(fx2 - 6, fy2 - 12, 12, 8);            // the shoulders, wide with the rifle slung
    cx.fillStyle = '#1a2029';
    cx.fillRect(fx2 - 3, fy2 - 16, 3, 19);            // a warmer edge than a Reaper ever gets
    cx.fillStyle = '#23282f';
    cx.fillRect(fx2 - 8, fy2 - 14, 3, 2); cx.fillRect(fx2 + 5, fy2 - 10, 4, 2);   // the Timberwolf across the back
    // the hooded lantern — one slit of gold, held low
    cx.fillStyle = '#12161c'; cx.fillRect(fx2 + 5, fy2 - 4, 5, 6);
    cx.fillStyle = '#ffd98f'; cx.fillRect(fx2 + 6, fy2 - 1, 3, 1);
    cx.globalCompositeOperation = 'lighter';
    glowShells(fx2 + 7, fy2 + 1, 18, 'rgba(255,217,143,0.12)');
    cx.globalCompositeOperation = 'source-over';
    cx.fillStyle = '#2a3038';
    cx.fillRect(fx2 - 5, fy2 - 12, 1, 8); cx.fillRect(fx2 + 4, fy2 - 12, 1, 8);   // rim light off the slit — the cloak stays a shape
    if (cam.z > 1.6) plabel('THE LAMPLIGHTER', fx2, fy2 + 16, 3, '#c9b98a');
    if (L.env && L.env.show) {
      const ex = Math.round(L.env.x), ey = Math.round(L.env.y);
      pixShadow(ex, ey + 4, 12);
      cx.fillStyle = '#12161c'; cx.fillRect(ex - 3, ey - 13, 7, 18);
      cx.fillStyle = '#5a6e52'; cx.fillRect(ex - 2, ey - 12, 5, 16);   // olive coveralls, bunker-clean
      cx.fillStyle = '#8fb08a'; cx.fillRect(ex - 2, ey - 8, 5, 2);     // the sash of an assigned career
      cx.fillStyle = '#d8c9b8'; cx.fillRect(ex - 2, ey - 15, 5, 4);    // a face that has never seen weather
      cx.fillStyle = '#fff2c8'; cx.fillRect(ex - 1, ey - 14, 2, 1);    // the glass glint
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
  function drawPlayer(dt) {
    if (S.state === 'zip') return;
    if (S.inside) return;   // the room holds them — the lit doorway speaks for the walker
    const x = S.px, y = S.py;
    const moving = S.speed > 5;
    if (moving) { bobT += dt * (S.sprinting ? 13 : 9); stampPrints(); }
    const bob = moving ? Math.sin(bobT) * 1.6 : 0;
    const lean = S.qte ? Math.sin(S.time * 18) * 0.16 : S.braced ? 0 : moving ? Math.sin(bobT * 0.5) * 0.03 : 0;
    cx.save();
    cx.translate(x, y);
    cx.scale(1.22, 1.22);
    const mounted = Systems.horseOn && Systems.horseOn();
    pixShadow(0, mounted ? 8 : 5, mounted ? 30 : 17);
    if (mounted) {
      /* v3.33: the breed you rented is the horse you ride — the stable's own sprite by name */
      const seat = drawMount(0, 5, S.horse && S.horse.breed, moving, S.time, Math.cos(S.dir) < 0, { bare: true });
      cx.translate(seat.rx, seat.ry);   // the rider and the pack ride the saddle
    }
    const crouch = S.braced ? 2 : 0;
    // THE PACK READS (v3.19): every load is AUTHORED — crates banded by their good, the medicine
    // crossed, tins ribbed, bales soft, sacks tied, drums stamped, cells lit, the mail in its
    // satchel, and every small thing rolled into one duffel at the base. The frame the walker
    // EQUIPPED is drawn holding the tower. During a hand-over, crates not yet hopped keep riding.
    const isSmall = c => c.kg < 3 && c.cat !== 'mat' && c.cat !== 'core' && c.cat !== 'goods' && !c.lostTo;
    const carried = S.handover ? [...S.handover.looks, ...S.cargo.filter(c => c.cat !== 'tool')] : S.cargo.filter(c => c.cat !== 'tool');
    const stack = carried.filter(c => !isSmall(c)).slice(0, 6);
    const smalls = carried.some(isSmall);
    const tools = S.cargo.filter(c => c.cat === 'tool').length;
    const tw2 = 1.2;   // glyph-space texel: the tower rides the BACK (hip to shoulder), not the head
    const bx = -Math.cos(S.dir) * 2.6, by = -2;
    cx.save();
    cx.translate(bx, by);
    cx.rotate(lean * 2.2 + (S.qte ? Math.sin(S.time * 22) * 0.1 : 0));
    const entries = stack.map(c => ({ g: cargoGlyphFor(c), t: c.kg > 12 ? 1.7 : 1.4 }));
    const towerH = entries.reduce((a, e) => a + e.g.rows.length * e.t - 0.2, 0) + (smalls ? 5.8 : 0);
    drawPackFrame(towerH + 11.4, crouch, bob, tw2);   // the frame runs hip to tower top
    let sy = -24 - crouch + bob * 0.5;                // cargo is lashed from the SHOULDERS up — the tower reads over the head
    if (smalls) { sy -= 5.8; stampRows(DUFFEL.rows, -6.3, sy, 1.4, DUFFEL.pal); }
    for (const e of entries) {
      const h = e.g.rows.length * e.t;
      sy -= h - 0.2;
      const w = e.g.rows[0].length * e.t;
      stampRows(e.g.rows, -w / 2, sy, e.t, e.g.pal);
      if (e.g.glow) {
        cx.globalCompositeOperation = 'lighter';
        cx.fillStyle = e.g.glow;
        cx.fillRect(-w / 2 + e.t, sy + e.t, w - 2 * e.t, e.t);
        cx.globalCompositeOperation = 'source-over';
      }
      sy -= 0.4;
    }
    // the north rides the pack too — a snow cap on the top crate
    if ((S.snowPack || 0) >= 0.55 && entries.length) { cx.fillStyle = '#dce8f0'; cx.fillRect(-5.5, sy - 1.4, 11, 1.6); }
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
    // the Walker, drawn like it's 1996 — dressed by rank, and by what they EQUIPPED (v3.19)
    blitWalker(0, crouch, wornPal(), moving, bobT, S.dir);
    // the north sits on their shoulders — snow the body collected, stage by stage
    if ((S.snowPack || 0) >= 0.25) drawSnowCap(0, crouch, Math.cos(S.dir) < 0, S.snowPack);
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
    const fk = npc && npc.fk;   // v3.22: a Farkeeper stands a head taller and a hand wider — NOT a giant
    pixShadow(0, 4, fk ? 19 : 15);
    if (pose === 'down') cx.rotate(1.35);
    else if (pose === 'sit') cx.translate(0, 3);
    /* v3.33: the height is DRAWN — each Farkeeper class is its own 14×22 silhouette from the
       registry; the scaled walker stands only for a class the kit has not drawn */
    const kitCls = fk && typeof SPRITES !== 'undefined' && SPRITES.KIT[npc.fkCls || 'pugugly'] ? (npc.fkCls || 'pugugly') : null;
    if (kitCls) blitKit(0, 0, kitCls, pose === 'walk', S.time * 9 + (npc.seed % 7), dir);
    else {
      if (fk) cx.scale(1.16, 1.22);
      const pal = fk ? { ...PAL_MATE, C: '#3a4048', c: '#2a3038', T: '#8d979c', t: '#6e747c', F: '#d8c9b8' } : { ...PAL_MATE, C: hood, T: scarf };
      blitWalker(0, 0, pal, pose === 'walk', S.time * 9 + (npc ? npc.seed % 7 : 0), dir);
    }
    cx.restore();
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
  function drawAboveMist(inView, dt) {
    // v3.24: the PARTY walks with you, above the mist like you — a wedge of backs, some in saddles
    for (const n of NPC.party()) {
      if (n.cx === undefined) continue;
      const mvd = n._px !== undefined ? Math.abs(n.cx - n._px) + Math.abs(n.cy - n._py) : 0;
      if (mvd > 0.4) n._dir = Math.atan2(n.cy - n._py, n.cx - n._px);
      const dir = n._dir || 0;
      if (n.horse) {   // their own saddle: the breed their home town stables, the figure riding it
        cx.save(); cx.translate(Math.round(n.cx), Math.round(n.cy));
        pixShadow(0, 8, 28);
        const breed = n.breed || (n.at && FACT.STABLES[n.at]) || 'mustang';
        const seat = drawMount(0, 5, breed, mvd > 0.6, S.time + (n.seed % 7) * 0.13, Math.cos(dir) < 0, { bare: true });
        cx.translate(seat.rx, seat.ry); cx.scale(0.92, 0.92);
        drawNpcFigure(0, 0, n, 'stand', dir);
        cx.restore();
      } else {
        drawNpcFigure(n.cx, n.cy, n, mvd > 0.4 ? 'walk' : 'stand', dir);
      }
      n._px = n.cx; n._py = n.cy;
      if (cam.z > 0.75) plabel(n.name.split(' ')[0], n.cx, n.cy + 13, 3, '#b8b29d');
    }
    // ambient waylighters on runs of their own — packs on, going somewhere that is not about you
    for (const w of (NPC.ambient ? NPC.ambient() : [])) {
      if (w.x === undefined || !inView(w.x, w.y, 80)) continue;
      // their little tower rides their back, opposite their facing
      const bx2 = -Math.cos(w.ang || 0) * 4;
      for (let i = 0; i < w.crates; i++) {
        cx.fillStyle = '#12161c'; cx.fillRect(Math.round(w.x + bx2) - 5, Math.round(w.y) - 26 - i * 5, 10, 5);
        cx.fillStyle = i % 2 ? '#b3a06a' : '#8a8676'; cx.fillRect(Math.round(w.x + bx2) - 4, Math.round(w.y) - 25 - i * 5, 8, 3);
      }
      drawNpcFigure(w.x, w.y, w.n, 'walk', w.ang || 0);
      if (cam.z > 0.8) plabel(w.n.name.split(' ')[0], w.x, w.y + 13, 3, '#a9a493');
    }
    // THE SHAPES OF WORK: the convoy walker — cargo that talks, drawn where it stands
    const cv = S.convoy;
    if (cv && inView(cv.x, cv.y, 90)) {
      const bx3 = -Math.cos(cv.dir || 0) * 4;
      for (let i = 0; i < cv.crates; i++) {
        cx.fillStyle = '#12161c'; cx.fillRect(Math.round(cv.x + bx3) - 5, Math.round(cv.y) - 26 - i * 5, 10, 5);
        cx.fillStyle = '#e3c476'; cx.fillRect(Math.round(cv.x + bx3) - 4, Math.round(cv.y) - 25 - i * 5, 8, 3);
      }
      if (cv.frozen) { cx.globalCompositeOperation = 'lighter'; ghostBody(cv.x, cv.y - 14, 18, 'rgba(150,160,255,0.30)'); cx.globalCompositeOperation = 'source-over'; }
      drawNpcFigure(cv.x, cv.y, cv.n, cv.moving && !cv.frozen && !cv.waiting ? 'walk' : 'stand', cv.dir || 0);
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
      } else if (caravan) {
        // the donkey: a patient grey back under rope-lashed freight (the drawn fallback)
        const flip = Math.cos(fn2.fdir || 0) < 0, dxm = flip ? -1 : 1;
        cx.fillStyle = '#12161c'; cx.fillRect(fx2 - 14, fy2 - 13, 28, 10);                       // body outline
        cx.fillStyle = '#8a8578'; cx.fillRect(fx2 - 13, fy2 - 12, 26, 8);                        // hide
        cx.fillStyle = '#6e6a5e'; cx.fillRect(fx2 - 13, fy2 - 6, 26, 2);                         // belly shade
        cx.fillStyle = '#12161c'; cx.fillRect(fx2 + dxm * 13, fy2 - 17, dxm * 7, 8);             // head
        cx.fillStyle = '#8a8578'; cx.fillRect(fx2 + dxm * 14, fy2 - 16, dxm * 5, 6);
        cx.fillStyle = '#12161c'; cx.fillRect(fx2 + dxm * 15, fy2 - 20, 2, 4); cx.fillRect(fx2 + dxm * 18, fy2 - 20, 2, 4);   // ears
        const step = fn2.fmoving ? Math.round(Math.sin(S.time * 9)) : 0;
        cx.fillStyle = '#12161c';
        cx.fillRect(fx2 - 11, fy2 - 4 + step, 3, 7); cx.fillRect(fx2 - 4, fy2 - 4 - step, 3, 7);
        cx.fillRect(fx2 + 2, fy2 - 4 + step, 3, 7); cx.fillRect(fx2 + 9, fy2 - 4 - step, 3, 7);  // legs
        for (let i = 0; i < 3; i++) { cx.fillStyle = '#12161c'; cx.fillRect(fx2 - 7 + i * 5, fy2 - 20, 6, 7); cx.fillStyle = i === 1 ? '#b3a06a' : '#9a8468'; cx.fillRect(fx2 - 6 + i * 5, fy2 - 19, 4, 5); }
        cx.fillStyle = '#c9a05a'; cx.fillRect(fx2 - 13, fy2 - 14, 26, 1.4);                      // the lash rope
        drawNpcFigure(fn2.fx - dxm * 22, fn2.fy, fn2, fn2.fmoving ? 'walk' : 'stand', fn2.fdir || 0);
      } else {
        if (fn2.job === 'hauler') for (let i = 0; i < 2; i++) { cx.fillStyle = '#12161c'; cx.fillRect(fx2 - 5, fy2 - 26 - i * 5, 10, 5); cx.fillStyle = '#9a8468'; cx.fillRect(fx2 - 4, fy2 - 25 - i * 5, 8, 3); }
        drawNpcFigure(fn2.fx, fn2.fy, fn2, fn2.fmoving ? 'walk' : 'stand', fn2.fdir || 0);
        if (fn2.job === 'forrester') {
          // the axe, swinging while the work is on
          const sw = !fn2.fmoving && fn2.fwork > 0 ? Math.sin(S.time * 7) * 0.9 : 0.5;
          cx.save(); cx.translate(fx2 + 6, fy2 - 14); cx.rotate(sw);
          cx.fillStyle = '#6b4a30'; cx.fillRect(-1, -8, 2, 9);
          cx.fillStyle = '#9aa2ab'; cx.fillRect(-3, -10, 6, 3);
          cx.restore();
        }
        if (fn2.job === 'mason' && !fn2.fmoving) { cx.fillStyle = '#8a8578'; cx.fillRect(fx2 - 8, fy2 - 3, 4, 3); cx.fillRect(fx2 + 5, fy2 - 2, 3, 2); }
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
  function tracer(x, y, x2, y2) { fx.push({ type: 'tracer', x, y, x2, y2, t: 0 }); }
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
  function announce(text) {
    const el = document.getElementById('announce');
    if (!el) return;
    el.classList.remove('slam'); void el.offsetWidth;
    el.textContent = text;
    el.classList.add('slam');
  }
  function setFx(on) { fxOn = on; }
  return { frame, flare, buildFx, hopCrate, likeBurst, say, burst, tracer, puff, announce, setFx, screenToWorld, get cam() { return cam; }, stockDebug: id => { delete stockCache[id]; return stockRead(id); }, coatPal: () => coatFor(), wornPal, setZoom(v) { zoomOverride = v || null; if (v) cam.z = v; }, setTitleDrift(on) { titleDrift = !!on; if (on) driftT = Math.random() * 60; }, noteE, eKeyState: () => ({ shown: eKeyShown(), held: eHeld }), effZoom: () => effZ || cam.z * dpr, crtTitle, crtActive: () => !!crtNow || crtQ.length > 0, crtText: () => { const o = crtNow || crtQ[0]; return o ? { big: o.big, small: o.small } : null; }, structDebug: t => { const s = structSprite(t, false, false); return { w: s.width, h: s.height }; },
    leaves: () => leavesA, gust: n => spawnGust(n), precipMode, cargoGlyph: c => cargoGlyphFor(c), rigPreviewURL, npcRigURL,
    darkAt: (wx, wy) => {   // how much darkness layer covers this world point, 0..1 — the punch's own ledger
      if (!nightC) return -1;
      const z2 = (effZ || cam.z * dpr) / PIXK;
      const bx = Math.round(lastWtx + wx * z2), by = Math.round(lastWty + wy * z2);
      if (bx < 0 || by < 0 || bx >= nightC.width || by >= nightC.height) return -1;
      return nightCx.getImageData(bx, by, 1, 1).data[3] / 255;
    } };
})();
