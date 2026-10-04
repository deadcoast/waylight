/* lamps.mjs — v3.13 LIGHT BEHAVES (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was lost;
   its figures sampled on the courier's grid). Everything dark is a layer — the night, and the quiet's grey dim (the day
   field split: its warm bands paint on the ground, its dim bands join the darkness) — and every local light erases banded
   holes in it on the terrain's own texel grid: a solid heart, two hems of ordered dither, nothing else, indexed in world
   space so the pattern sits still while the light moves. What shows through a hole is the ground's own colours; no painted
   gold on the ground; no partial alpha (a texel of night is gone or intact). Measured on an unlit meadow, class-matched,
   through the darkness layer's own alpha (Render.darkAt) and the composited canvas: the pool's brightness against the same
   meadow 260 u away, the falloff through the hems, a generator's pool at its camp and every other lamp's own, the lantern
   clearing the grey dim by day, and station-lit ground where there is nothing to punch. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok } = T;

/* the instruments of the dark: a texel's state read through the layer's own alpha at its interior (the camera close — a
   terrain texel five buffer pixels a side — and the samples two pixels in from its edges, where no seam reaches), the bands
   of a hole around a light, the Walker's figure on the grid (left out of every ground sample), the meadow staged */
await ev(() => {
  const TS = World.TS;
  window.__MEAD = [5900, 8400];   // an unlit meadow (lightAt 0), meadow for 330 u every way, far from every station and camp
  window.__tex = (tx, ty) => {   // 0: the texel of night is gone; 1: intact; 0.5: neither
    const v = [[1.5, 1.5], [2.5, 1.5], [1.5, 2.5], [2.5, 2.5]].map(([ox, oy]) => Render.darkAt(tx * TS + ox, ty * TS + oy));
    return v.every(a => a >= 0 && a < 0.02) ? 0 : v.every(a => a > 0.98) ? 1 : 0.5;
  };
  /* the bands of a hole punched at (x, y) with reach r: the heart (solid), the mid hem, the outer hem, the night beyond */
  window.__bands = (x, y, r, reach) => {
    const cx = Math.round(x / TS), cy = Math.round(y / TS), rT = Math.max(2, Math.round(r / TS)), hC = rT * 0.58, hM = rT * 0.8, R = reach || rT + 4;
    const B = { heart: [], mid: [], out: [], beyond: [] }, states = {};
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const d = Math.hypot(dx, dy), s = __tex(cx + dx, cy + dy);
      states[(cx + dx) + ',' + (cy + dy)] = s;
      const band = d <= hC - 0.6 ? 'heart' : (d > hC + 0.6 && d <= hM - 0.6) ? 'mid' : (d > hM + 0.6 && d <= rT - 0.6) ? 'out' : (d > rT + 1.5 && d <= R) ? 'beyond' : null;
      if (band) B[band].push(s);
    }
    const mean = a => a.length ? +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(3) : null;
    return { heart: mean(B.heart), mid: mean(B.mid), out: mean(B.out), beyond: mean(B.beyond), n: [B.heart.length, B.mid.length, B.out.length, B.beyond.length], halves: Object.values(states).filter(s => s === 0.5).length, states };
  };
  window.__figure = () => {   // the Walker's 32×32 grid on the ground, and the lamp's glass
    const a = Render.walkerAt(0, 0), b = Render.walkerAt(31, 31), t = Math.abs(Render.walkerAt(1, 0).x - a.x), w = Render.walkerDrawn(), g = Render.walkerAt(w.hand[0] + 0.5, w.hand[1] + 3.5);
    const x0 = Math.min(a.x, b.x) - t, x1 = Math.max(a.x, b.x) + t, y0 = a.y - t, y1 = b.y + 3 * t;
    return (wx, wy) => (wx >= x0 && wx <= x1 && wy >= y0 && wy <= y1) || Math.hypot(wx - g.x, wy - g.y) < 26;
  };
  window.__night = async (at, frac, zoom = 3) => {
    WL.tp(at); S.weather.state = 'clear'; S.speed = 0; S.braced = false; S.moveTo = null;
    const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * frac;
    for (const n of NPC.party()) { n.cx = S.px + 900; n.cy = S.py + 900; }
    __clearAmb(S.px, S.py, 700); Render.clearFx(); Render.setFx(false); Render.setZoom(zoom); Render.cam.x = S.px; Render.cam.y = S.py; WL.timeScale = 0.001;
    await __wait(300); await __frames(4);
  };
  window.__lum = h => { const [a, b, c] = __hex(h); return 0.299 * a + 0.587 * b + 0.114 * c; };
  window.__canvasHex = (cv, wx, wy) => { const d = cv.getContext('2d').getImageData(Math.floor(wx / TS), Math.floor(wy / TS), 1, 1).data; return { hex: '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''), a: d[3] }; };
});

/* ================= 1 · THE SPLIT ================= */
let r = await ev(() => {
  World.rebuildLight();   // the field repaints from the sources; nothing about the split may depend on when it last did
  const TS = World.TS, H0 = DATA.stations.haven, TW = Math.ceil(World.W / TS), TH = Math.ceil(World.H / TS);
  const dims = [World.lightOv, World.lightOvN, World.lightWarm, World.lightDim].every(c => c.width === TW && c.height === TH);
  /* a strip from Haven's yard out into the quiet: 1600 u east, 300 u tall */
  const tx0 = Math.floor(H0.x / TS), ty0 = Math.floor((H0.y - 150) / TS), w = Math.floor(1600 / TS), h = Math.floor(300 / TS);
  const get = c => c.getContext('2d').getImageData(tx0, ty0, w, h).data;
  const D = get(World.lightOv), N = get(World.lightOvN), Wm = get(World.lightWarm), M = get(World.lightDim);
  let painted = 0, both = 0, neither = 0, warm = 0, dim = 0, warmInQuiet = 0, dimOnWire = 0, nightHoles = 0, shore = 0;
  for (let i = 0; i < D.length; i += 4) {
    const p = i / 4, wx = (tx0 + (p % w)) * TS + TS / 2, wy = (ty0 + Math.floor(p / w)) * TS + TS / 2, L = World.lightAt(wx, wy);
    if (N[i + 3] !== 255) nightHoles++;
    const isW = Wm[i + 3] === 255, isM = M[i + 3] === 255;
    if (D[i + 3] === 255) { painted++; if (isW && isM) both++; if (!isW && !isM) neither++; } else if (isW || isM) neither++;
    if (isW) { warm++; if (L < 0.22) warmInQuiet++; if (Wm[i] === 255 && Wm[i + 1] === 232 && Wm[i + 2] === 170) shore++; }   // the golden shore at the wraith line lives with the warmth
    if (isM) { dim++; if (L > 0.42) dimOnWire++; }
  }
  return { dims, TW, TH, painted, both, neither, warm, dim, shore, warmInQuiet, dimOnWire, nightHoles, texels: D.length / 4 };
});
ok('THE SPLIT: the day field is split by nature — every texel it paints is either WARMTH (paint laid straight on the ground, never punched) or the quiet\'s DIM (a darkness layer a lamp can burn through), never both and never neither; the warmth lies on the wire\'s lit ground and its golden shore, the dim only in the quiet; the night field is a whole layer, opaque over the valley; every field one texel per five units of the world (World.W × World.H), repainted by World.rebuildLight',
  r.dims && r.painted > 1000 && r.both === 0 && r.neither === 0 && r.warm > 500 && r.dim > 500 && r.shore > 0 && r.warmInQuiet === 0 && r.dimOnWire === 0 && r.nightHoles === 0, JSON.stringify(r));

/* ================= 2 · THE POOL, MEASURED ================= */
await ev(() => __night(__MEAD, 0.8, 2));   // the camera wide enough to hold the pool and the meadow 260 u east of it
const pool = await ev(() => {
  const TS = World.TS, cxT = Math.round(S.px / TS), cyT = Math.round((S.py - 6) / TS), fig = __figure();
  let L1 = 0, L2 = 0, n = 0, own = 0, nightOwn = 0, R = 0, G = 0, B = 0, cls = 0;
  for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) {
    if (Math.hypot(dx, dy) > 9.4) continue;   // the heart (0.58 of the lamp's reach)
    const wx = (cxT + dx) * TS + TS / 2, wy = (cyT + dy) * TS + TS / 2; if (fig(wx, wy)) continue;
    const a = __px(wx, wy), b = __px(wx + 260, wy); n++;
    L1 += __lum(a); L2 += __lum(b);
    const [ra, ga, ba] = __hex(a); R += ra; G += ga; B += ba;
    if (a === __canvasHex(World.tc, wx, wy).hex) own++;
    if (b === __canvasHex(World.lightOvN, wx + 260, wy).hex) nightOwn++;
    if (World.classAt(wx, wy) === World.MEADOW && World.classAt(wx + 260, wy) === World.MEADOW) cls++;
  }
  /* painted gold on the ground: a warm, bright pixel anywhere in the lamp's reach outside the figure and the glass's bloom */
  let gold = 0, groundPx = 0;
  for (let y = -92; y <= 92; y += 1.5) for (let x = -92; x <= 92; x += 1.5) {
    const wx = S.px + x, wy = S.py - 6 + y; if (Math.hypot(x, y) > 92 || fig(wx, wy)) continue;
    groundPx++; const [a, b, c] = __hex(__px(wx, wy)); if (a > 185 && b > 135 && c < 150 && a - c > 70) gold++;
  }
  const w = Render.walkerDrawn(), g = Render.walkerAt(w.hand[0] + 0.5, w.hand[1] + 3.5);
  let bloom = 0; const gg = __grab(g.x, g.y, 10); for (let i = 0; i < gg.length; i += 4) if (gg[i] > 200 && gg[i + 1] > 170) bloom++;
  return { lightAt: World.lightAt(S.px, S.py), n, ratio: +(L1 / L2).toFixed(2), lumIn: +(L1 / n).toFixed(1), lumOut: +(L2 / n).toFixed(1), own, nightOwn, cls, meanRGB: [R / n | 0, G / n | 0, B / n | 0], gold, groundPx, bloom };
});
ok(`THE POOL, MEASURED: at full night on an unlit meadow the ground inside the lantern's heart is ×${pool.ratio} the brightness of the same meadow 260 u away (class-matched: meadow at both ends of every pair — the v3.13 record measured ×7.3 on its meadow; the old gold discs raised it ×0.96), sampled on the composited canvas with the Walker and the lamp's own bloom left out`,
  pool.lightAt === 0 && pool.n > 50 && pool.cls === pool.n && pool.ratio >= 4, JSON.stringify(pool));

ok('THROUGH THE HOLE, THE GROUND ITSELF: in the lantern\'s heart the canvas shows the terrain\'s own texel colours (green-led meadow) and past the pool the night field\'s own; not one painted-gold pixel on the ground — the lamp keeps a bloom a few texels wide at its glass and nothing more',
  pool.own / pool.n >= 0.95 && pool.nightOwn / pool.n >= 0.95 && pool.meanRGB[1] > pool.meanRGB[0] && pool.meanRGB[1] > pool.meanRGB[2] && pool.gold === 0 && pool.bloom > 0, JSON.stringify(pool));

/* ================= 3 · THE HEMS, AND THE LAW ================= */
await ev(() => __night(__MEAD, 0.8, 3));   // close: a terrain texel five buffer pixels a side
const hems = await ev(() => { const b = __bands(S.px, S.py - 6, 92); delete b.states; return b; });
ok(`THE HEMS: the lantern's hole steps through its bands on the terrain's texels — the heart gone (${hems.heart}), the mid hem half gone in ordered dither (${hems.mid}), the outer hem mostly intact (${hems.out}), the night beyond whole (${hems.beyond}) — the falloff carried entirely by how many texels are gone (the v3.13 record: 0.05 → 0.60 → 1.00), and no texel half-dark`,
  hems.heart <= 0.05 && hems.mid >= 0.35 && hems.mid <= 0.65 && hems.out >= 0.65 && hems.out <= 0.9 && hems.beyond >= 0.99 && hems.heart < hems.mid && hems.mid < hems.out && hems.out < hems.beyond && hems.halves === 0, JSON.stringify(hems));

const law = await ev(async () => {
  /* the layer's own alpha, every half unit across the pool: a texel of night is gone or intact */
  const out = {};
  for (const [label, cam] of [['staged', null], ['a camera between whole pixels', [0.37, 0.61]]]) {
    if (cam) { Render.cam.x = S.px + cam[0]; Render.cam.y = S.py + cam[1]; await __wait(200); await __frames(3); }
    let part = 0, n = 0; const seen = {};
    for (let y = -60; y <= 60; y += 0.5) for (let x = -60; x <= 60; x += 0.5) { const a = Render.darkAt(S.px + x, S.py - 6 + y); if (a < 0) continue; n++; if (a > 0.02 && a < 0.98) { part++; const k = a.toFixed(2); seen[k] = (seen[k] || 0) + 1; } }
    /* on screen: a column of pixels down the heart, below the Walker — the ground's texels are flat colour, so a row that
       darkens inside one texel is night left partly over it */
    const p = __toScr(S.px + 25, S.py + 4), g = document.getElementById('game').getContext('2d'), col = g.getImageData(Math.round(p.x), Math.round(p.y) - 22, 1, 44).data, lums = [];
    for (let i = 0; i < col.length; i += 4) lums.push(Math.round(0.3 * col[i] + 0.59 * col[i + 1] + 0.11 * col[i + 2]));
    out[label] = { part, n, values: Object.fromEntries(Object.entries(seen).sort((a, b) => b[1] - a[1]).slice(0, 6)), column: lums.join(',') };
  }
  Render.cam.x = S.px; Render.cam.y = S.py; await __wait(150); await __frames(3);
  return out;
});
ok('NO PARTIAL ALPHA: the law holds in the dark too — across the lantern\'s pool every sample of the darkness layer is either gone (0) or intact (1), at the staged camera and at a camera between whole pixels; the ground in the heart lies flat per texel on screen, no row of night left half over it',
  Object.values(law).every(q => q.n > 10000 && q.part === 0), JSON.stringify(law));

/* ================= 4 · THE GRID IS THE WORLD'S ================= */
const grid = await ev(async () => {
  const TS = World.TS, rT = Math.round(92 / TS), hC = rT * 0.58, hM = rT * 0.8;
  const band = d => d <= hC - 0.6 ? 'h' : (d > hC + 0.6 && d <= hM - 0.6) ? 'm' : (d > hM + 0.6 && d <= rT - 0.6) ? 'o' : d > rT + 1.5 ? 'b' : null;
  const cx0 = Math.round(S.px / TS), cy0 = Math.round((S.py - 6) / TS), before = __bands(S.px, S.py - 6, 92).states, out = {};
  for (const [label, dx, dy] of [['a texel east', 1, 0], ['four texels south-west', -4, 4]]) {
    S.px += dx * TS; S.py += dy * TS; Render.cam.x = S.px; Render.cam.y = S.py; await __wait(200); await __frames(3);
    const after = __bands(S.px, S.py - 6, 92).states;
    let same = 0, diff = 0, moved = 0;
    for (const k of Object.keys(before)) {
      if (!(k in after)) continue;
      const [x, y] = k.split(',').map(Number), b0 = band(Math.hypot(x - cx0, y - cy0)), b1 = band(Math.hypot(x - (cx0 + dx), y - (cy0 + dy)));
      if (!b0 || !b1) continue;
      if (b0 !== b1) { if (before[k] !== after[k]) moved++; continue; }
      if (before[k] === after[k]) same++; else diff++;
    }
    out[label] = { same, diff, moved };
    S.px -= dx * TS; S.py -= dy * TS;
  }
  Render.cam.x = S.px; Render.cam.y = S.py; await __wait(150); await __frames(3);
  return out;
});
ok('THE TEXEL GRID IS THE WORLD\'S: the hems are dithered on the terrain\'s own texels, indexed in world space — walk the lamp a texel east, or four south-west, and every texel that stays in the same band keeps exactly its state (the pattern sits still while the light moves); only texels that change band change',
  Object.values(grid).every(q => q.same > 300 && q.diff === 0) && Object.values(grid).some(q => q.moved > 0), JSON.stringify(grid));

/* ================= 5 · EVERY LAMP ITS OWN HOLE ================= */
const lamps = await ev(async () => {
  const out = {}, X = S.px + 420, Y = S.py + 20;   // far past the Walker's own pool; the camera goes to the lamp, its whole hole in view
  const look = async (x, y) => { Render.cam.x = x; Render.cam.y = y; await __wait(200); await __frames(3); };
  const hole = (x, y, r) => { const b = __bands(x, y, r, Math.round(r / World.TS) + 3); return { heart: b.heart, mid: b.mid, beyond: b.beyond, halves: b.halves }; };
  /* a generator raised on the meadow: the same banded pool, wider (120) */
  const gen = { id: U.uid(), type: 'generator', x: X, y: Y, ang: 0, hp: 100, by: 'you', likes: 0 };
  S.structures.push(gen); await look(X, Y); out.generator = hole(X, Y, 120);
  S.structures.splice(S.structures.indexOf(gen), 1); await look(X, Y); out.generatorGone = hole(X, Y, 120);
  /* a watchtower: its lamp high on the platform, a weaker lamp's coverage (0.72) */
  const tw = { id: U.uid(), type: 'watchtower', x: X, y: Y, ang: 0, hp: 100, by: 'you', likes: 0 };
  S.structures.push(tw); await look(X, Y - 30); out.watchtower = hole(X, Y - 30, 48);
  S.structures.splice(S.structures.indexOf(tw), 1); await look(X, Y - 30); out.watchtowerGone = hole(X, Y - 30, 48);
  /* the peddler's cart, its lantern on the pole */
  const ev0 = S.event; S.event = { id: U.uid(), type: 'peddler', x: X, y: Y, t: 300, data: { stock: NPC.peddlerStock() } }; await look(X + 20, Y - 10); out.peddler = { ...hole(X + 20, Y - 10, 62), stock: S.event.data.stock.length };
  S.event = ev0 || null; await look(X + 20, Y - 10); out.peddlerGone = hole(X + 20, Y - 10, 62);
  /* a lumen bloom in the grass: a weak lamp (0.65) — its heart only partly gone */
  const node = { id: U.uid(), type: 'lumen', x: X, y: Y, qty: 4, taken: false, respawn: 0 };
  S.nodes.push(node); await look(X, Y); out.lumen = hole(X, Y, 34);
  node.taken = true; await look(X, Y); out.lumenGone = hole(X, Y, 34); S.nodes.splice(S.nodes.indexOf(node), 1);
  /* the hand at your shoulder carries a small lamp */
  const n = NPC.gen({ at: 'haven' }); n.state = 'companion'; S.npcs.push(n); n.cx = X; n.cy = Y; n._px = X; n._py = Y; await look(X, Y);
  const first = NPC.party()[0] === n, at = [n.cx, n.cy]; out.companion = { ...hole(at[0], at[1] - 6, 55), first };
  S.npcs.splice(S.npcs.indexOf(n), 1); await look(X, Y); out.companionGone = hole(at[0], at[1] - 6, 55);
  /* a camp's fire, where it stands in the dark */
  const cd = DATA.camps.find(c => World.lightAt(c.x, c.y) === 0);
  WL.tp([cd.x + 400, cd.y + 60]); __clearAmb(cd.x, cd.y, 500); await look(cd.x, cd.y);
  out.camp = { id: cd.id, ...hole(cd.x, cd.y, S.camps[cd.id].pacified ? 80 : 62) };
  WL.tp(__MEAD); await look(S.px, S.py);
  return out;
});
ok('EVERY LAMP ITS OWN HOLE: a generator raised on the meadow carves the lantern\'s banded pool at its own foot, wider (its heart gone, its hem half gone in dither, the night whole past it) and the night closes over it when it is taken down; a watchtower\'s lamp and a lumen bloom (weaker lamps: their hearts only partly gone), the peddler\'s cart (its stock from the peddler\'s own shelf), the hand at your shoulder and a camp\'s fire each erase their own hole — without them the night is whole',
  lamps.generator.heart === 0 && lamps.generator.mid > 0.3 && lamps.generator.mid < 0.7 && lamps.generator.beyond === 1 && lamps.generatorGone.heart === 1
  && lamps.watchtower.heart > 0.1 && lamps.watchtower.heart < 0.6 && lamps.watchtowerGone.heart === 1 && lamps.peddler.heart === 0 && lamps.peddler.stock > 0 && lamps.peddlerGone.heart === 1
  && lamps.lumen.heart > 0.1 && lamps.lumen.heart < 0.6 && lamps.lumenGone.heart === 1 && lamps.companion.first && lamps.companion.heart === 0 && lamps.companionGone.heart === 1 && lamps.camp.heart === 0 && lamps.camp.beyond === 1
  && Object.values(lamps).every(q => !q.halves),
  JSON.stringify(lamps));

/* ================= 6 · BY DAY, THE GREY DIM ================= */
const day = await ev(async () => {
  await __night(__MEAD, 0.3, 3);
  const b = __bands(S.px, S.py - 6, 92);
  await __night(__MEAD, 0.3, 2);
  const TS = World.TS, cxT = Math.round(S.px / TS), cyT = Math.round((S.py - 6) / TS), fig = __figure();
  let own = 0, dimOwn = 0, n = 0;
  for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) {
    if (Math.hypot(dx, dy) > 9.4) continue;
    const wx = (cxT + dx) * TS + TS / 2, wy = (cyT + dy) * TS + TS / 2; if (fig(wx, wy)) continue;
    n++; if (__px(wx, wy) === __canvasHex(World.tc, wx, wy).hex) own++;
    const dm = __canvasHex(World.lightDim, wx + 260, wy); if (dm.a === 255 && __px(wx + 260, wy) === dm.hex) dimOwn++;
  }
  return { night: Economy.dayPhase().nightness, heart: b.heart, mid: b.mid, beyond: b.beyond, own, dimOwn, n, lightAt: World.lightAt(S.px, S.py) };
});
ok('BY DAY THE LANTERN CLEARS THE GREY DIM: in the quiet at high day the dim lies over the meadow as darkness (whole 260 u away, drawn in the dim\'s own colour), and the ground the Walker holds is cleared of it — the heart gone, the hem dithered, the terrain\'s own colours under the lamp',
  day.night === 0 && day.lightAt === 0 && day.heart === 0 && day.mid > 0.3 && day.mid < 0.7 && day.beyond === 1 && day.n > 50 && day.own / day.n >= 0.95 && day.dimOwn / day.n >= 0.95, JSON.stringify(day));

/* ================= 7 · STATION-LIT GROUND ================= */
const lit = await ev(async () => {
  const H0 = DATA.stations.haven, spot = [H0.x + 260, H0.y + 150], out = {};
  for (const [label, f] of [['day', 0.3], ['night', 0.8]]) {
    await __night(spot, f, 3);
    const b = __bands(S.px, S.py - 6, 92), foot = [S.px + 20, S.py + 8], nf = __canvasHex(World.lightOvN, foot[0], foot[1]), tc = __canvasHex(World.tc, foot[0], foot[1]);
    out[label] = { lightAt: +World.lightAt(S.px, S.py).toFixed(2), heart: b.heart, beyond: b.beyond, canvas: __px(foot[0], foot[1]), nightField: nf.hex, ground: tc.hex, litFace: __lum(nf.hex) >= __lum(tc.hex) };
  }
  __done(); return out;
});
ok('ON STATION-LIT GROUND THERE IS NOTHING TO PUNCH: in Haven\'s light by day no dim lies anywhere round the Walker, and at night the night field lies whole over the lit ground wearing its lit day face (the canvas under the Walker is the night field\'s own colour, no darker than the ground) — the lantern burns no hole where the station already lights the land',
  lit.day.lightAt > 0.6 && lit.day.heart === 0 && lit.day.beyond === 0 && lit.night.heart === 1 && lit.night.beyond === 1 && lit.night.canvas === lit.night.nightField && lit.night.litFace, JSON.stringify(lit));

await T.finish('the lamps');
