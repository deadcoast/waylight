'use strict';
/* Waylight — camera & painterly canvas renderer */

const Render = (() => {
  const { stations, stationOrder, T, structures: SDEF } = DATA;
  const cv = U.el('game');
  const mainCx = cv.getContext('2d');
  let cx = mainCx;                       // all world drawing goes through cx; frame() points it at the low-res buffer
  const PIXK = 2.6;                      // the era look: the world renders at 1/2.6 resolution and lands chunky
  let worldC = null, worldCx = null;
  let vw = 0, vh = 0, dpr = 1;
  let cam = { x: 2100, y: 4990, z: 1 };
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

  const w2sx = x => (x - cam.x) * cam.z * dpr + cv.width / 2;
  const w2sy = y => (y - cam.y) * cam.z * dpr + cv.height / 2;
  function screenToWorld(clientX, clientY) { return { x: cam.x + (clientX - vw / 2) / cam.z, y: cam.y + (clientY - vh / 2) / cam.z }; }

  function shake(a) { if (fxOn && !reduced) { shakeAmp = Math.max(shakeAmp, a); shakeT = 0.35; } }
  function flare() { flareT = 1; }
  function buildFx(x, y) { fx.push({ type: 'ring', x, y, t: 0 }); }
  function likeBurst(n) {
    for (let i = 0; i < n; i++) likes.push({
      x: cv.width / 2 + (Math.random() - 0.5) * 120 * dpr,
      y: cv.height * 0.4 + (Math.random() - 0.5) * 60 * dpr,
      vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 90, t: 0, dur: 1.2 + Math.random() * 0.8,
    });
  }

  function frame(dt) {
    // camera
    let tx = S.px, ty = S.py, tz = 1.12;
    if (S.approach) tz = 0.97;
    if (S.sprinting) tz *= 0.96;
    if (S.state === 'zip') tz = 0.9;
    if (S.cine) {
      const stD = stations[S.cine.stId];
      tx = stD.x; ty = stD.y; tz = 0.72;
    }
    const lerpK = S.cine ? 1.6 : 3.2;
    cam.x += (tx - cam.x) * Math.min(1, lerpK * dt);
    cam.y += (ty - cam.y) * Math.min(1, lerpK * dt);
    cam.z += (tz - cam.z) * Math.min(1, 2 * dt);
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

    const z = cam.z * dpr;
    // the whole world pass draws into the low-res buffer; it lands on screen as fat pixels
    cx = worldCx;
    const zw = z / PIXK;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.fillStyle = '#0a0e14';
    cx.fillRect(0, 0, worldC.width, worldC.height);

    // world transform
    cx.setTransform(zw, 0, 0, zw, worldC.width / 2 - cam.x * zw + shx / PIXK, worldC.height / 2 - cam.y * zw + shy / PIXK);
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
      cx.drawImage(World.lightOv, sx, sy, sw, sh, sx * ts, sy * ts, sw * ts, sh * ts);
      if (nnQ === 1) { cx.globalAlpha = 0.55; cx.drawImage(World.lightOvN, sx, sy, sw, sh, sx * ts, sy * ts, sw * ts, sh * ts); cx.globalAlpha = 1; }
      else if (nnQ === 2) cx.drawImage(World.lightOvN, sx, sy, sw, sh, sx * ts, sy * ts, sw * ts, sh * ts);
    }
    mark('lightfield');
    // shore sparkle: foam texels blinking on shallow water in slow shifts — the SNES sea
    {
      const sparkT = Math.floor(S.time * 2.2);
      let cnt = 0;
      for (let gy3 = Math.floor(vy0 / 40) * 40; gy3 < vy1 && cnt < 900; gy3 += 40)
        for (let gx3 = Math.floor(vx0 / 40) * 40; gx3 < vx1; gx3 += 40, cnt++) {
          const hsh = U.hash2(gx3 * 0.025 + (sparkT % 7) * 11, gy3 * 0.025, 913);
          if (hsh < 0.88) continue;
          if (World.classAt(gx3, gy3) !== World.SHALLOW) continue;
          cx.fillStyle = hsh > 0.95 ? '#d8f0ea' : '#8fd2c8';
          cx.fillRect(Math.floor(gx3 / 5) * 5, Math.floor(gy3 / 5) * 5, 5, 5);
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
    drawBeams(dt); mark('beams');
    drawAboveMist(inView, dt); mark('abovemist');
    if (S.cine && S.cine.phase === 1) {
      const stD = stations[S.cine.stId], lt = S.stations[S.cine.stId].litT;
      const rr = (S.cine.r || 900) * U.easeOut(lt);
      cx.globalCompositeOperation = 'lighter';
      cx.strokeStyle = `rgba(255,214,150,${0.75 * (1 - lt * 0.6)})`;
      cx.lineWidth = 5 / cam.z;
      cx.beginPath(); cx.arc(stD.x, stD.y, rr, 0, 7); cx.stroke();
      cx.strokeStyle = `rgba(255,214,150,${0.3 * (1 - lt * 0.6)})`;
      cx.lineWidth = 22 / cam.z;
      cx.beginPath(); cx.arc(stD.x, stD.y, rr * 0.97, 0, 7); cx.stroke();
      cx.globalAlpha = Math.max(0, 1 - lt);
      glowShells(stD.x, stD.y, 380 * lt + 60, 'rgba(255,225,170,0.4)');
      cx.globalAlpha = 1;
      cx.globalCompositeOperation = 'source-over';
    }
    drawWraiths(inView, dt); mark('wraiths');
    drawTravel(dt); mark('travel');
    drawPlayer(dt); mark('player');
    drawRain(dt); mark('rain');
    drawFx(dt); mark('fx');

    // the world lands on screen: nearest-neighbour up, colour punched hot — the nineties were not subtle
    cx = mainCx;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.imageSmoothingEnabled = false;
    cx.drawImage(worldC, 0, 0, worldC.width, worldC.height, 0, 0, cv.width, cv.height);
    cx.imageSmoothingEnabled = true;
    drawSays(z, cv.width / 2 - cam.x * z + shx, cv.height / 2 - cam.y * z + shy);

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
    if (P) P.frames = (P.frames || 0) + 1;
  }

  /* ---------- stations & waylights ---------- */
  /* =============== authored pixel sprites ===============
     Drawn the way the era drew them: a small grid, a hard outline, a deliberate palette.
     Every humanoid shares one rig; coats recolour it. Blits snap to the texel grid so sprites step, not smear. */
  const RIG_IDLE = [
    '..OOOO...',
    '.OHHHHO..',
    '.OHHHHO..',
    '..OSSO...',
    '.OCCCCO..',
    'OCcCCcCO.',
    'OCCCCCCO.',
    'OCTTTCCO.',
    'OCCCCCCO.',
    '.OCcCcO..',
    '..OBBO...',
    '..OB.BO..',
    '..OB.BO..',
    '..OO.OO..'];
  const RIG_A = RIG_IDLE.slice(0, 10).concat([
    '..OBBO...',
    '.OB..BO..',
    '.OB...BO.',
    '.OO...OO.']);
  const RIG_B = RIG_IDLE.slice(0, 10).concat([
    '..OBBO...',
    '..OB.BO..',
    'OB...BO..',
    'OO...OO..']);
  const PAL_WALKER = { O: '#12161c', H: '#20262e', S: '#e0c298', C: '#3d5a74', c: '#2c4258', T: '#c9a05a', B: '#23282f' };
  const PAL_MATE = { O: '#12161c', H: '#262c22', S: '#d8b890', C: '#54683f', c: '#41522f', T: '#b8a06a', B: '#23282f' };
  const PAL_SCRAP = { O: '#150f0c', H: '#33241e', S: '#d8b890', C: '#8a4432', c: '#6b3426', T: '#5a4a3a', B: '#20242a' };
  const HUT = [
    '.rrrrrrrrrrrrrr.',
    'RRRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRR',
    'OGGGGOGGGGOGGGGO',
    'OGWWGOGGDGOGWWGO',
    'OGWWGOGGDGOGWWGO',
    'OGGGGOGGGGOGGGGO',
    'OOOOOOOOOOOOOOOO'];
  function blit(rows, wx, wy, tx, pal, flip) {
    const w = rows[0].length;
    const sx = Math.round(wx / tx) * tx, sy = Math.round(wy / tx) * tx;
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < w; i++) {
        const ch = row[flip ? w - 1 - i : i];
        if (ch === '.') continue;
        cx.fillStyle = pal[ch] || '#f0f';
        cx.fillRect(sx + i * tx, sy + j * tx, tx + 0.06, tx + 0.06);
      }
    }
  }
  /* a walker on their feet: rig frame by stride, flipped by facing; feet land on (x, y+5) */
  function blitWalker(x, y, pal, moving, phase, dir) {
    const tx = 1.7;
    const rows = moving ? (Math.sin(phase) > 0 ? RIG_A : RIG_B) : RIG_IDLE;
    blit(rows, x - 4.5 * tx, y + 5 - 14 * tx, tx, pal, Math.cos(dir) < 0);
  }

  /* every glow in the world is dithered, not gradiented — the era faked light with patterns.
     A pattern is solid dots at a Bayer coverage; shells of falling coverage make a halo. */
  const RBAY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const patCache = {};
  function ditherPat(color, cov, cell = 2.6) {
    const key = color + '|' + cov + '|' + cell;
    if (patCache[key]) return patCache[key];
    const c = document.createElement('canvas'); c.width = c.height = Math.ceil(cell * 4);
    const g = c.getContext('2d'); g.fillStyle = color;
    for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++)
      if (RBAY[y][x] / 16 < cov) g.fillRect(x * cell, y * cell, cell + 0.1, cell + 0.1);
    return patCache[key] = g.createPattern(c, 'repeat');   // patterns are context-free; one per look
  }
  function glowShells(x, y, R, color, coreColor) {
    // three shells: 75% core, 45% mid, 20% rim — additive solid dots, an era halo
    const shells = [[0.38, 0.75], [0.68, 0.45], [1.0, 0.2]];
    for (const [fr, cov] of shells) {
      cx.fillStyle = ditherPat(color, cov);
      cx.beginPath(); cx.arc(x, y, R * fr, 0, 7); cx.fill();
    }
    if (coreColor) { cx.fillStyle = coreColor; cx.beginPath(); cx.arc(x, y, Math.max(2.5, R * 0.14), 0, 7); cx.fill(); }
  }

  function drawStations(inView, dt) {
    for (const id of stationOrder) {
      const d = stations[id], st = S.stations[id];
      if (!inView(d.x, d.y, 700)) continue;
      const lit = st.connected && st.litT > 0;
      const t = S.time;
      // platform
      cx.fillStyle = '#20262e';
      cx.beginPath(); cx.ellipse(d.x, d.y + 8, 52, 22, 0, 0, 7); cx.fill();
      cx.fillStyle = '#2b323c';
      cx.beginPath(); cx.ellipse(d.x, d.y + 2, 50, 20, 0, 0, 7); cx.fill();
      // waylight tower rises BEHIND the longhouse roof
      const tx = d.x, tyb = d.y - 14, th = 64;
      cx.strokeStyle = '#0d1116'; cx.lineWidth = 7;
      cx.beginPath(); cx.moveTo(tx - 10, tyb); cx.lineTo(tx, tyb - th); cx.lineTo(tx + 10, tyb); cx.stroke();
      cx.strokeStyle = lit ? '#6b5a42' : '#3a4048'; cx.lineWidth = 4;
      cx.beginPath(); cx.moveTo(tx - 10, tyb); cx.lineTo(tx, tyb - th); cx.lineTo(tx + 10, tyb); cx.stroke();
      cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(tx - 7, tyb - th * 0.35); cx.lineTo(tx + 7, tyb - th * 0.35); cx.moveTo(tx - 4, tyb - th * 0.68); cx.lineTo(tx + 4, tyb - th * 0.68); cx.stroke();
      // the stone longhouse out front, windows burning when the station is on the wire
      const hutPal = {
        O: '#0d1116',
        r: lit ? '#a06a40' : '#5c4a3a', R: lit ? '#7a5138' : '#463a30',
        G: lit ? '#7d8288' : '#525860', W: lit ? '#ffd98f' : '#2b313b', D: '#3c2e22',
      };
      blit(HUT, d.x - 36.8, d.y - 22.8, 4.6, hutPal, false);
      // yard props: crates stacked port side, a rain barrel starboard — it's a depot, not a lawn
      const crate = lit ? '#8a6a42' : '#4c4234', crateHi = lit ? '#a8845a' : '#5a4e3c';
      blit(['OOOO', 'OCCO', 'OCCO', 'OOOO'], d.x - 47, d.y - 4, 2.8, { O: '#0d1116', C: crate }, false);
      blit(['OOOO', 'OcCO', 'OCcO', 'OOOO'], d.x - 44, d.y + 4, 2.8, { O: '#0d1116', C: crate, c: crateHi }, false);
      blit(['.OO.', 'OBBO', 'OBBO', '.OO.'], d.x + 41, d.y - 1, 2.8, { O: '#0d1116', B: lit ? '#556066' : '#3c444c' }, false);
      if (lit) {
        const pulse = 0.85 + Math.sin(t * 1.4 + d.x) * 0.15;
        cx.globalCompositeOperation = 'lighter';
        glowShells(tx, tyb - th, 90 * pulse * st.litT, 'rgba(255,196,120,0.30)');
        cx.fillStyle = `rgba(255,235,190,${0.9 * st.litT})`;
        cx.beginPath(); cx.arc(tx, tyb - th, 5.5, 0, 7); cx.fill();
        cx.globalCompositeOperation = 'source-over';
      } else {
        cx.fillStyle = 'rgba(255,180,90,0.35)';
        cx.beginPath(); cx.arc(tx, tyb - th, 2.5 + Math.sin(t * 3 + d.y) * 1, 0, 7); cx.fill();
      }
      // label (constant screen size)
      const fz = U.clamp(15 / cam.z, 13, 24);
      cx.font = `600 ${fz}px Fraunces, Georgia, serif`;
      cx.textAlign = 'center';
      cx.fillStyle = 'rgba(5,8,12,0.7)';
      cx.fillText(d.name, d.x + 1, d.y + 41 + fz - 15);
      cx.fillStyle = lit ? 'rgba(255,227,176,0.95)' : 'rgba(150,155,165,0.8)';
      cx.fillText(d.name, d.x, d.y + 40 + fz - 15);
      if (st.stars) {
        cx.font = `${U.clamp(10 / cam.z, 9, 16)}px Atkinson Hyperlegible, sans-serif`;
        cx.fillStyle = 'rgba(255,201,120,0.9)';
        cx.fillText('★'.repeat(st.stars), d.x, d.y + 42 + fz);
      }
    }
  }
  function drawBeams(dt) {
    cx.globalCompositeOperation = 'lighter';
    for (const id of stationOrder) {
      const st = S.stations[id];
      if (!st.connected || st.litT <= 0) continue;
      const d = stations[id];
      const bh = 240 * st.litT;
      // the pillar of light, dithered: a dense core column and two thinning sleeves — no gradient
      const steps = [[3.5, 0.85], [8, 0.45], [14, 0.18]];
      for (const [hw2, cov] of steps) {
        cx.fillStyle = ditherPat('rgba(255,214,150,0.5)', cov);
        cx.beginPath();
        cx.moveTo(d.x - hw2 * 0.4, d.y - 78);
        cx.lineTo(d.x - hw2, d.y - 78 - bh);
        cx.lineTo(d.x + hw2, d.y - 78 - bh);
        cx.lineTo(d.x + hw2 * 0.4, d.y - 78);
        cx.fill();
      }
    }
    cx.globalCompositeOperation = 'source-over';
  }

  /* ---------- structures ---------- */
  function drawStructures(inView, dt) {
    // zip lines first
    cx.strokeStyle = 'rgba(140,220,210,0.55)'; cx.lineWidth = 1.6;
    for (const [a, b] of S.zipLinks) {
      const pa = S.structures.find(s => s.id === a), pb = S.structures.find(s => s.id === b);
      if (!pa || !pb) continue;
      if (!inView(pa.x, pa.y, 900) && !inView(pb.x, pb.y, 900)) continue;
      cx.beginPath();
      const mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2 + 14;
      cx.moveTo(pa.x, pa.y - 34);
      cx.quadraticCurveTo(mx, my - 20, pb.x, pb.y - 34);
      cx.stroke();
    }
    for (const st of S.structures) {
      if (!inView(st.x, st.y, 200)) continue;
      const dmg = st.hp < 40;
      const col = st.echo ? '#6fe3d2' : '#d8cfae';
      const dark = st.echo ? '#2c5a54' : '#5a5342';
      cx.save();
      cx.translate(st.x, st.y);
      if (st.type === 'ladder' || st.type === 'bridge') {
        cx.rotate(st.ang);
        const hl = SDEF[st.type].span / 2;
        if (st.type === 'ladder') {
          cx.strokeStyle = dmg ? '#8a6a4a' : col; cx.lineWidth = 2.4;
          cx.beginPath(); cx.moveTo(-hl, -5); cx.lineTo(hl, -5); cx.moveTo(-hl, 5); cx.lineTo(hl, 5); cx.stroke();
          cx.lineWidth = 1.6;
          for (let x = -hl + 8; x < hl; x += 13) { cx.beginPath(); cx.moveTo(x, -5); cx.lineTo(x, 5); cx.stroke(); }
        } else {
          cx.fillStyle = dmg ? '#4a4438' : dark;
          cx.fillRect(-hl, -11, hl * 2, 22);
          cx.fillStyle = col;
          cx.fillRect(-hl, -11, hl * 2, 3); cx.fillRect(-hl, 8, hl * 2, 3);
          cx.fillStyle = '#3a3428';
          for (let x = -hl + 10; x < hl; x += 22) cx.fillRect(x, -8, 3, 16);
        }
      } else if (st.type === 'generator') {
        cx.fillStyle = dark; cx.fillRect(-9, -14, 18, 16);
        cx.fillStyle = col; cx.fillRect(-9, -17, 18, 4);
        const p = 0.6 + Math.sin(S.time * 4) * 0.4;
        cx.globalCompositeOperation = 'lighter';
        cx.fillStyle = `rgba(255,214,140,${0.5 * p})`;
        cx.beginPath(); cx.arc(0, -19, 4 + p * 2, 0, 7); cx.fill();
        cx.globalCompositeOperation = 'source-over';
        cx.strokeStyle = 'rgba(255,214,140,0.12)';
        cx.beginPath(); cx.arc(0, 0, SDEF.generator.aura, 0, 7); cx.stroke();
      } else if (st.type === 'shelter') {
        cx.fillStyle = dark;
        cx.beginPath(); cx.moveTo(-18, 4); cx.quadraticCurveTo(0, -26, 18, 4); cx.closePath(); cx.fill();
        cx.fillStyle = col;
        cx.beginPath(); cx.moveTo(-18, 4); cx.quadraticCurveTo(0, -26, 18, 4); cx.lineTo(14, 4); cx.quadraticCurveTo(0, -19, -14, 4); cx.closePath(); cx.fill();
        cx.fillStyle = '#151a20'; cx.beginPath(); cx.moveTo(-8, 4); cx.quadraticCurveTo(0, -10, 8, 4); cx.closePath(); cx.fill();
        cx.strokeStyle = 'rgba(216,207,174,0.12)';
        cx.beginPath(); cx.arc(0, 0, SDEF.shelter.aura, 0, 7); cx.stroke();
      } else if (st.type === 'watchtower') {
        cx.strokeStyle = dark; cx.lineWidth = 3;
        cx.beginPath(); cx.moveTo(-8, 2); cx.lineTo(-3, -34); cx.moveTo(8, 2); cx.lineTo(3, -34); cx.stroke();
        cx.fillStyle = col; cx.fillRect(-8, -40, 16, 8);
        const bl = (S.time * 2 % 2) < 1;
        cx.fillStyle = bl ? '#6fe3d2' : '#2c5a54';
        cx.beginPath(); cx.arc(0, -44, 2.5, 0, 7); cx.fill();
      } else if (st.type === 'zipline') {
        cx.strokeStyle = dark; cx.lineWidth = 4;
        cx.beginPath(); cx.moveTo(-7, 2); cx.lineTo(0, -34); cx.lineTo(7, 2); cx.stroke();
        cx.fillStyle = '#6fe3d2';
        cx.beginPath(); cx.arc(0, -34, 4, 0, 7); cx.fill();
      }
      cx.restore();
      if (st.echo && cam.z > 0.55) {
        cx.font = `${U.clamp(11 / cam.z, 10, 15)}px Atkinson Hyperlegible, sans-serif`;
        cx.textAlign = 'center';
        cx.fillStyle = 'rgba(111,227,210,0.85)';
        cx.fillText(`${st.by} · ◆${st.likes || 0}`, st.x, st.y - 44);
      }
      if (st.hp < 70 && cam.z > 0.6) {
        cx.fillStyle = st.hp < 40 ? 'rgba(217,107,79,0.9)' : 'rgba(233,226,208,0.5)';
        cx.font = '10px Atkinson Hyperlegible, sans-serif';
        cx.fillText(`${Math.round(st.hp)}%`, st.x, st.y + 18);
      }
    }
    // zip traveller
    if (S.state === 'zip' && S.zip) {
      cx.fillStyle = '#fff';
      cx.beginPath(); cx.arc(S.px, S.py - 30, 5, 0, 7); cx.fill();
      cx.strokeStyle = '#fff'; cx.lineWidth = 2;
      cx.beginPath(); cx.moveTo(S.px, S.py - 26); cx.lineTo(S.px, S.py - 12); cx.stroke();
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
          cx.fillStyle = '#33383f';
          cx.fillRect(p.x - 14, p.y - 8, 28, 16);
          cx.fillStyle = '#ffc978';
          cx.fillRect(p.x - 14, p.y - 12, 28, 4);
          cx.font = `${U.clamp(10 / cam.z, 9, 15)}px Atkinson Hyperlegible, sans-serif`;
          cx.textAlign = 'center';
          cx.fillStyle = 'rgba(255,201,120,0.85)';
          cx.fillText('PAVER', p.x, p.y + 24);
        }
        break;
      }
    }
  }
  function drawPickups(inView) {
    for (const d of S.drops) if (inView(d.x, d.y)) box(d.x, d.y, '#c9b98a');
    for (const l of S.lost) if (!l.taken && inView(l.x, l.y)) {
      box(l.x, l.y, '#ffc978');
      cx.globalCompositeOperation = 'lighter';
      cx.fillStyle = 'rgba(255,201,120,0.12)';
      cx.beginPath(); cx.arc(l.x, l.y, 14 + Math.sin(S.time * 2) * 3, 0, 7); cx.fill();
      cx.globalCompositeOperation = 'source-over';
    }
    for (const sn of S.snags) if (inView(sn.x, sn.y)) {
      cx.strokeStyle = '#d96b4f'; cx.lineWidth = 2;
      const t = S.time * 2;
      cx.save(); cx.translate(sn.x, sn.y); cx.rotate(Math.sin(t) * 0.1);
      box(0, 0, '#a98a6a');
      cx.beginPath(); cx.moveTo(-10, -16); cx.lineTo(10, -4); cx.moveTo(10, -16); cx.lineTo(-10, -4); cx.stroke();
      cx.restore();
    }
    for (const n of S.nodes) {
      if (n.taken || !inView(n.x, n.y)) continue;
      if (n.type === 'lumen') {
        const p = 0.5 + Math.sin(S.time * 2.4 + n.x) * 0.5;
        cx.globalCompositeOperation = 'lighter';
        glowShells(n.x, n.y, 20 + p * 8, 'rgba(140,240,225,0.55)');
        cx.globalCompositeOperation = 'source-over';
        cx.fillStyle = '#bff5ec';
        for (let i = 0; i < 3; i++) {
          const a = i * 2.1 + n.y;
          cx.save(); cx.translate(n.x + Math.cos(a) * 7, n.y + Math.sin(a) * 5); cx.rotate(a);
          cx.fillRect(-2, -5, 4, 10); cx.restore();
        }
      } else {
        const col = n.type === 'metal' ? '#7a766a' : '#9a8468';
        cx.fillStyle = col;
        cx.beginPath(); cx.moveTo(n.x - 12, n.y + 6); cx.lineTo(n.x, n.y - 9); cx.lineTo(n.x + 12, n.y + 6); cx.closePath(); cx.fill();
        cx.fillStyle = 'rgba(255,255,255,0.14)';
        cx.beginPath(); cx.moveTo(n.x - 5, n.y - 2); cx.lineTo(n.x, n.y - 9); cx.lineTo(n.x + 5, n.y - 2); cx.closePath(); cx.fill();
      }
    }
    function box(x, y, col) {
      cx.fillStyle = 'rgba(0,0,0,0.3)';
      cx.beginPath(); cx.ellipse(x, y + 6, 10, 4, 0, 0, 7); cx.fill();
      cx.fillStyle = col;
      cx.fillRect(x - 8, y - 10, 16, 14);
      cx.fillStyle = 'rgba(0,0,0,0.25)';
      cx.fillRect(x - 8, y - 3, 16, 2);
    }
  }

  /* ---------- camps ---------- */
  function drawCamps(inView, dt) {
    for (const cd of DATA.camps) {
      const cs = S.camps[cd.id];
      if (!inView(cd.x, cd.y, cd.r + 100)) continue;
      // tents
      for (let i = 0; i < 3; i++) {
        const a = i * 2.1, tx = cd.x + Math.cos(a) * 40, ty = cd.y + Math.sin(a) * 26;
        cx.fillStyle = cs.pacified ? '#4a4a42' : '#4a3a32';
        cx.beginPath(); cx.moveTo(tx - 14, ty + 6); cx.lineTo(tx, ty - 12); cx.lineTo(tx + 14, ty + 6); cx.closePath(); cx.fill();
        cx.fillStyle = cs.pacified ? 'rgba(255,201,120,0.5)' : 'rgba(217,107,79,0.6)';
        cx.beginPath(); cx.moveTo(tx - 5, ty + 6); cx.lineTo(tx, ty - 3); cx.lineTo(tx + 5, ty + 6); cx.closePath(); cx.fill();
      }
      // fire
      const f = 0.5 + Math.sin(S.time * 7 + cd.x) * 0.3;
      cx.globalCompositeOperation = 'lighter';
      glowShells(cd.x, cd.y, 22 * f + 10, cs.pacified ? 'rgba(255,214,140,0.55)' : 'rgba(255,140,80,0.5)', cs.pacified ? '#ffd98f' : '#ff9a5a');
      cx.globalCompositeOperation = 'source-over';
      // stash
      if (cs.stash.length) { cx.fillStyle = '#c9b98a'; cx.fillRect(cd.x + 24, cd.y - 8, 14, 12); cx.fillRect(cd.x + 30, cd.y - 16, 12, 10); }
      // runners
      if (!cs.pacified) for (const r of cs.runners) {
        cx.save(); cx.translate(r.x, r.y);
        cx.fillStyle = 'rgba(0,0,0,0.3)';
        cx.beginPath(); cx.ellipse(0, 6, 8, 3.5, 0, 0, 7); cx.fill();
        const chasing = r.cd <= 0 && U.dist(r.x, r.y, S.px, S.py) < cd.r;
        blitWalker(0, 0, PAL_SCRAP, chasing, S.time * 12 + r.wa, Math.atan2(S.py - r.y, S.px - r.x));
        // headlamp cone toward player when hunting
        const d = U.dist(r.x, r.y, S.px, S.py);
        if (d < cd.r + 60) {
          const a = Math.atan2(S.py - r.y, S.px - r.x);
          cx.globalCompositeOperation = 'lighter';
          cx.fillStyle = 'rgba(255,170,120,0.12)';
          cx.beginPath(); cx.moveTo(0, -12);
          cx.arc(0, -12, 60, a - 0.3, a + 0.3); cx.closePath(); cx.fill();
          cx.globalCompositeOperation = 'source-over';
        }
        cx.restore();
      } else {
        // neutral wanderers wave
        cx.fillStyle = '#8a8a7a';
        cx.fillRect(cd.x - 60, cd.y + 10, 6, 12);
        cx.beginPath(); cx.arc(cd.x - 57, cd.y + 6, 4, 0, 7); cx.fill();
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
      glowShells(w.x + sway * 0.4, w.y - 14, rad, bodyCol);
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
  function drawPlayer(dt) {
    if (S.state === 'zip') return;
    const x = S.px, y = S.py;
    const moving = S.speed > 5;
    if (moving) bobT += dt * (S.sprinting ? 13 : 9);
    const bob = moving ? Math.sin(bobT) * 1.6 : 0;
    const lean = S.qte ? Math.sin(S.time * 18) * 0.16 : S.braced ? 0 : moving ? Math.sin(bobT * 0.5) * 0.03 : 0;
    cx.save();
    cx.translate(x, y);
    cx.scale(1.22, 1.22);
    // shadow
    cx.fillStyle = 'rgba(0,0,0,0.35)';
    cx.beginPath(); cx.ellipse(0, 5, 9, 4, 0, 0, 7); cx.fill();
    const crouch = S.braced ? 2 : 0;
    // cargo stack (behind body, offset opposite facing)
    const stack = S.cargo.filter(c => c.cat !== 'tool').slice(0, 7);
    const tools = S.cargo.filter(c => c.cat === 'tool').length;
    const bx = -Math.cos(S.dir) * 5, by = -2;
    let sy = -9 - crouch + bob * 0.5;
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
      cx.fillStyle = '#12161c';
      cx.fillRect(6.4, -17.5 - i * 3.4 - crouch, 2.6, 12.8);
      cx.fillStyle = '#7a8a8f';
      cx.fillRect(6.8, -17 - i * 3.4 - crouch, 1.7, 11.9);
    }
    cx.restore();
    // sled
    if (S.gear.sled && S.gear.sledOn) {
      cx.fillStyle = '#4a5a5f';
      cx.beginPath(); cx.ellipse(-Math.cos(S.dir) * 22, 4 - Math.sin(S.dir) * 6, 12, 5, 0, 0, 7); cx.fill();
      cx.globalCompositeOperation = 'lighter';
      cx.fillStyle = 'rgba(111,227,210,0.25)';
      cx.beginPath(); cx.ellipse(-Math.cos(S.dir) * 22, 7 - Math.sin(S.dir) * 6, 10, 3, 0, 0, 7); cx.fill();
      cx.globalCompositeOperation = 'source-over';
    }
    // the Walker, drawn like it's 1996
    blitWalker(0, crouch, PAL_WALKER, moving, bobT, S.dir);
    if (World.lightAt(x, y) < 0.35) {   // the lantern in hand, out where it's needed
      const fl = Math.cos(S.dir) < 0 ? -1 : 1;
      cx.fillStyle = '#8a7a5a'; cx.fillRect(fl * 7, -10 + crouch, 1.6, 5);
      cx.fillStyle = '#ffd98f'; cx.fillRect(fl * 7 - 1, -5 + crouch, 3.4, 3.4);
    }
    // headlamp glow in dark
    if (World.lightAt(x, y) < 0.3) {
      const big = S.flags.effects.bigLantern ? 2.4 : 1;   // BIGLANTERN: exactly what it says
      cx.globalCompositeOperation = 'lighter';
      glowShells(0, -18, 46 * big, `rgba(255,230,180,${big > 1 ? 0.34 : 0.26})`);
      cx.globalCompositeOperation = 'source-over';
    }
    cx.restore();
    // brace indicator
    if (S.braced && moving) {
      cx.strokeStyle = 'rgba(233,226,208,0.4)';
      cx.lineWidth = 1.5;
      cx.beginPath(); cx.arc(x, y - 10, 16, 0, 7); cx.stroke();
    }
  }

  /* ---------- second wind: ruins, graves, events, companion ---------- */
  function drawWorldExtras(inView, dt) {
    // ruins
    for (const rn of S.ruins || []) {
      if (!inView(rn.x, rn.y, 100)) continue;
      const rg = U.rng(rn.seed);
      cx.save(); cx.translate(rn.x, rn.y);
      const a = rn.looted ? 0.55 : 1;
      cx.globalAlpha = a;
      if (rn.type === 'shrine') {
        cx.fillStyle = '#4a4f57';
        cx.fillRect(-14, -6, 6, 22); cx.fillRect(8, -6, 6, 22);
        cx.fillRect(-16, -12, 32, 7);
        if (!rn.looted) {
          cx.globalCompositeOperation = 'lighter';
          glowShells(0, 0, 26, 'rgba(140,240,225,0.3)');
          cx.globalCompositeOperation = 'source-over';
        }
      } else {
        cx.fillStyle = '#3d434c';
        for (let i = 0; i < 4; i++) {
          const wx = (rg() - 0.5) * 44, wy = (rg() - 0.5) * 30;
          cx.fillRect(wx - 8, wy - 4, 16 + rg() * 14, 6 + rg() * 5);
        }
        cx.fillStyle = '#31363e';
        cx.fillRect(-18, -2, 36, 8);
        if (rn.type === 'caravan') { cx.fillStyle = '#4a3d33'; cx.beginPath(); cx.arc(-10, 8, 6, 0, 7); cx.arc(12, 8, 6, 0, 7); cx.fill(); }
      }
      cx.globalAlpha = 1;
      cx.restore();
      if (cam.z > 0.7 && !rn.looted) {
        cx.font = `${U.clamp(10 / cam.z, 9, 13)}px Atkinson Hyperlegible, sans-serif`;
        cx.textAlign = 'center'; cx.fillStyle = 'rgba(233,226,208,0.55)';
        cx.fillText(CHAR.RUIN_TYPES[rn.type].name.toLowerCase(), rn.x, rn.y + 30);
      }
    }
    // cairns (non-wraith graves)
    for (const g of S.graves || []) {
      if (g.wraith || !inView(g.x, g.y, 80)) continue;
      cx.save(); cx.translate(g.x, g.y);
      cx.fillStyle = 'rgba(0,0,0,0.3)';
      cx.beginPath(); cx.ellipse(0, 6, 14, 5, 0, 0, 7); cx.fill();
      cx.fillStyle = '#6b7076';
      cx.beginPath(); cx.arc(-6, 2, 6, 0, 7); cx.arc(6, 2, 5, 0, 7); cx.arc(0, -4, 6, 0, 7); cx.arc(0, -11, 4, 0, 7); cx.fill();
      cx.fillStyle = '#8d979c';
      cx.beginPath(); cx.arc(-1, -4, 2.5, 0, 7); cx.fill();
      cx.globalCompositeOperation = 'lighter';
      glowShells(0, -12, 18, 'rgba(255,214,150,0.32)');
      cx.globalCompositeOperation = 'source-over';
      cx.restore();
      cx.font = `${U.clamp(11 / cam.z, 10, 15)}px Fraunces, Georgia, serif`;
      cx.textAlign = 'center'; cx.fillStyle = 'rgba(255,227,176,0.8)';
      cx.fillText(g.name, g.x, g.y + 24);
    }
    // events on the ground
    const ev = S.event;
    if (ev && inView(ev.x, ev.y, 120)) {
      if (ev.type === 'supplyDrop') {
        cx.fillStyle = '#8a5a3a'; cx.fillRect(ev.x - 12, ev.y - 12, 24, 20);
        cx.fillStyle = '#ffc978'; cx.fillRect(ev.x - 12, ev.y - 4, 24, 3);
        cx.strokeStyle = 'rgba(255,201,120,0.5)'; cx.lineWidth = 2;
        const p2 = 0.5 + Math.sin(S.time * 3) * 0.5;
        cx.beginPath(); cx.arc(ev.x, ev.y, 20 + p2 * 14, 0, 7); cx.stroke();
        cx.strokeStyle = 'rgba(200,200,210,0.35)';
        cx.beginPath(); cx.moveTo(ev.x, ev.y - 14); cx.quadraticCurveTo(ev.x + 6, ev.y - 40, ev.x - 4, ev.y - 70); cx.stroke();
      } else if (ev.type === 'peddler') {
        cx.save(); cx.translate(ev.x, ev.y);
        cx.fillStyle = '#3d3126'; cx.fillRect(-20, -14, 40, 20);
        cx.fillStyle = '#5a4a38'; cx.fillRect(-20, -20, 40, 7);
        cx.fillStyle = '#2a2f38'; cx.beginPath(); cx.arc(-12, 10, 7, 0, 7); cx.arc(12, 10, 7, 0, 7); cx.fill();
        const lp = 0.7 + Math.sin(S.time * 2.2) * 0.3;
        cx.globalCompositeOperation = 'lighter';
        glowShells(24, -18, 30 * lp, 'rgba(255,214,140,0.5)');
        cx.globalCompositeOperation = 'source-over';
        cx.fillStyle = '#ffe3b0'; cx.beginPath(); cx.arc(24, -18, 3, 0, 7); cx.fill();
        cx.restore();
        cx.font = `${U.clamp(11 / cam.z, 10, 15)}px Fraunces, serif`;
        cx.textAlign = 'center'; cx.fillStyle = 'rgba(255,227,176,0.9)';
        cx.fillText('the Peddler', ev.x, ev.y + 30);
      } else if (ev.type.startsWith('rescue') && ev.type !== 'rescueWraith') {
        drawNpcFigure(ev.x, ev.y, ev.data.npc, ev.type === 'rescueInjured' ? 'down' : 'sit');
        const p3 = 0.5 + Math.sin(S.time * 4) * 0.5;
        cx.fillStyle = `rgba(217,107,79,${0.5 + p3 * 0.5})`;
        cx.font = `700 ${16 / cam.z}px Fraunces, serif`; cx.textAlign = 'center';
        cx.fillText('!', ev.x, ev.y - 26);
      }
    }
  }
  function drawNpcFigure(x, y, npc, pose = 'stand', dir = 0) {
    const rg = U.rng(npc ? npc.seed : 7);
    const hood = U.pick(rg, CHAR.PORTRAIT.hoods), scarf = U.pick(rg, CHAR.PORTRAIT.scarves);
    cx.save(); cx.translate(x, y);
    cx.fillStyle = 'rgba(0,0,0,0.3)';
    cx.beginPath(); cx.ellipse(0, 4, 8, 3.5, 0, 0, 7); cx.fill();
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
      if (cam.z > 0.75) {
        cx.font = `${U.clamp(10 / cam.z, 9, 13)}px Atkinson Hyperlegible, sans-serif`;
        cx.textAlign = 'center'; cx.fillStyle = 'rgba(233,226,208,0.7)';
        cx.fillText(n.name.split(' ')[0], S.compPos.x, S.compPos.y + 16);
      }
    }
    // porters the Grey kept — standing at their graves
    for (const g of S.graves || []) {
      if (!g.wraith || !inView(g.x, g.y, 120)) continue;
      g.ph = (g.ph || 0) + dt * 0.5;
      const bob = Math.sin(g.ph) * 2;
      cx.globalCompositeOperation = 'lighter';
      glowShells(g.x, g.y - 16 + bob, 34, 'rgba(150,160,255,0.4)');
      cx.globalCompositeOperation = 'source-over';
      cx.fillStyle = 'rgba(90,100,150,0.85)';
      cx.fillRect(g.x - 5, g.y - 20 + bob, 10, 18);
      // the pack they still carry
      cx.fillStyle = 'rgba(70,78,120,0.85)';
      cx.fillRect(g.x - 8, g.y - 26 + bob, 6, 12);
      cx.fillStyle = 'rgba(200,208,255,0.9)';
      cx.beginPath(); cx.arc(g.x - 2, g.y - 24 + bob, 1.6, 0, 7); cx.arc(g.x + 3, g.y - 24 + bob, 1.6, 0, 7); cx.fill();
      cx.font = `${U.clamp(11 / cam.z, 10, 15)}px Fraunces, Georgia, serif`;
      cx.textAlign = 'center'; cx.fillStyle = 'rgba(180,188,255,0.85)';
      cx.fillText(g.name, g.x, g.y + 18);
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
    cx.strokeStyle = m.act ? 'rgba(255,201,120,0.95)' : 'rgba(233,226,208,0.9)'; cx.lineWidth = 2 / cam.z;
    cx.beginPath(); cx.arc(m.x, m.y, r, 0, 7); cx.stroke();
    cx.fillStyle = m.act ? 'rgba(255,201,120,0.9)' : 'rgba(233,226,208,0.85)';
    cx.beginPath(); cx.arc(m.x, m.y, 2.2 / cam.z, 0, 7); cx.fill();
    // the string of marks still to walk
    if (S.route && S.route.length) {
      cx.setLineDash([3 / cam.z, 10 / cam.z]);
      cx.strokeStyle = 'rgba(255,201,120,0.4)'; cx.lineWidth = 1.4 / cam.z;
      cx.beginPath(); cx.moveTo(m.x, m.y);
      for (const [rx, ry] of S.route) cx.lineTo(rx, ry);
      cx.stroke(); cx.setLineDash([]);
      let n = 1;
      for (const [rx, ry] of S.route) {
        cx.fillStyle = 'rgba(255,201,120,0.85)';
        cx.beginPath(); cx.arc(rx, ry, 4.5 / cam.z, 0, 7); cx.fill();
        cx.fillStyle = '#0a0e14'; cx.font = `700 ${8 / cam.z}px sans-serif`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText(String(++n), rx, ry + 0.5 / cam.z);
      }
      cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
    }
    cx.restore();
  }

  /* ---------- the Guide's marker: a beacon on the target, or an arrow at the screen edge ---------- */
  function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
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
      const r = (13 + pulse * 9) * dpr;
      cx.lineWidth = 2 * dpr;
      cx.strokeStyle = hexA(g.color, near ? 0.55 : 0.95);
      cx.beginPath(); cx.arc(sx, sy, r, 0, 7); cx.stroke();
      cx.strokeStyle = hexA(g.color, 0.3);
      cx.beginPath(); cx.arc(sx, sy, r * 1.9, 0, 7); cx.stroke();
      // beacon shaft
      const h = 140 * dpr;
      const grd = cx.createLinearGradient(sx, sy - h, sx, sy);
      grd.addColorStop(0, hexA(g.color, 0)); grd.addColorStop(1, hexA(g.color, 0.45 + pulse * 0.2));
      cx.fillStyle = grd;
      cx.fillRect(sx - 1.5 * dpr, sy - h, 3 * dpr, h);
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
        cx.strokeStyle = `rgba(255,214,150,${(1 - t) * 0.8})`;
        cx.lineWidth = 2.5;
        cx.beginPath(); cx.arc(f.x, f.y, t * 60, 0, 7); cx.stroke();
      } else if (f.type === 'burst') {
        const t = f.t / 0.45;
        if (t >= 1) { fx.splice(i, 1); continue; }
        cx.strokeStyle = `rgba(224,101,74,${(1 - t) * 0.9})`;
        cx.lineWidth = 3 / cam.z;
        cx.beginPath(); cx.arc(f.x, f.y, 6 + t * 34, 0, 7); cx.stroke();
      } else if (f.type === 'say') {
        f.tick = true;   // advanced here; drawn crisp after the pixel blit
        const t = f.t / 2.4;
        if (t >= 1) { fx.splice(i, 1); continue; }
      }
    }
  }
  /* spoken lines ride above the fat pixels — the voice stays sharp */
  function drawSays(z, ox, oy) {
    for (const f of fx) {
      if (f.type !== 'say') continue;
      const t = f.t / 2.4;
      const a = t < 0.12 ? t / 0.12 : 1 - Math.max(0, (t - 0.6) / 0.4);
      const sx = f.x * z + ox, sy = (f.y - t * 30) * z + oy;
      cx.font = `italic 600 ${13.5 * dpr}px Fraunces, Georgia, serif`;
      cx.textAlign = 'center';
      cx.fillStyle = `rgba(10,14,20,${a * 0.8})`;
      cx.fillText(f.text, sx + 1.5 * dpr, sy + 1.5 * dpr);
      cx.fillStyle = `rgba(${f.color || '255,224,170'},${a})`;
      cx.fillText(f.text, sx, sy);
      cx.textAlign = 'left';
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
  return { frame, shake, flare, buildFx, likeBurst, say, burst, announce, setFx, screenToWorld, get cam() { return cam; } };
})();
