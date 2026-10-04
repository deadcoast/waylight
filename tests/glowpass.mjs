/* glowpass.mjs — v3.15 LIGHT HAS A BODY (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). The sources fixed, not deleted: every lamp, flame, bloom and
   cairn-light a banded corona (a near-white core, two hue-warmed bands at stepped alpha, dither only as the stitch at a
   seam), the full checker kept for the unsolid alone (ghostBody); the station pillar dead and in its place a beacon shaft
   that belongs to the night (nothing by day; at night a narrow column brightest at the flame, three bands, dithering out at
   its top); lit bays casting window-spill pools on the yard after dark (the stock report, read from across a field); fires
   authored three-frame flames on their logs; the props in the hand (the mast, the salvage, the lumen blooms, the crates by
   the icon law, the drop, the cart, the paver, the cairn, the Kept in the courier's rows in a ghost palette). The law at
   source level, the day column measured empty, the night shaft present AND narrow, every prop sampled at its own paint
   against the same frame without it, the fire caught changing shape between looks. */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'node:url';
import { boot, PAGE } from './lib/harness.mjs';

const T = await boot();
const { ev, ok } = T;

/* ================= 1 · THE LAW AT SOURCE ================= */
{
  const html = readFileSync(fileURLToPath(PAGE), 'utf8');
  const sect = name => { const a = html.indexOf(`/* ================ ${name} ================ */`); const b = html.indexOf('/* ================ ', a + 10); return a < 0 ? '' : html.slice(a, b < 0 ? undefined : b); };
  const R = sect('17_render.js'), n = re => (R.match(re) || []).length;
  const fn = name => { const i = R.indexOf(`function ${name}(`); return i < 0 ? '' : R.slice(i, R.indexOf('\n  }\n', i)); };
  const corona = fn('coronaSprite'), shaft = fn('shaftSprite'), beams = fn('drawBeams'), ghost = fn('ghostSprite');
  const r = {
    renderer: R.length, arc: n(/\.arc\(/g), quad: n(/quadraticCurveTo/g), linear: n(/createLinearGradient/g), radial: n(/createRadialGradient/g), ellipse: n(/\.ellipse\(/g),
    /* the corona: a core that heats toward white, the band, a stitched seam, the outer band, a stitched hem — three hard alpha steps */
    coronaCore: /const core = coreColor \? rgbOf\(coreColor\)/.test(corona) && /\(255 - r\) \* 0\.8/.test(corona),
    coronaSteps: [...new Set((corona.match(/a = (?:stitch \? )?0\.\d+/g) || []).map(s => s.replace(/a = (stitch \? )?/, '')))],
    coronaStitch: (corona.match(/stitch/g) || []).length >= 3, glowsAreCoronas: /coronaSprite\(color, coreColor\)/.test(fn('glowShells')),
    lamps: n(/glowShells\(/g), ghostCalls: n(/ghostBody\(/g) - 1, checkerOnlyInGhost: /RBAY\[\(y \/ 3\) & 3\]\[\(x \/ 3\) & 3\] \/ 16 < cov/.test(ghost),
    /* the shaft: three bands brightest at the flame, three width steps, dithered hems, the top letting go; gated by the night */
    shaftBands: /k > 0\.62 \? 0\.46 : k > 0\.3 \? 0\.28 : 0\.14/.test(shaft), shaftWidths: /k > 0\.62 \? 2 : k > 0\.3 \? 3 : 4/.test(shaft), shaftFade: /const fade = ty < 7/.test(shaft),
    nightOnly: /if \(!nnA\) return;/.test(beams) && /nn >= 0\.62 \? 1 : nn >= 0\.18 \? 0\.5 : 0/.test(beams),
  };
  ok('THE LAW AT SOURCE: in the renderer not one .arc(, quadraticCurveTo, createLinearGradient or ellipse survives, and one radial gradient (the vignette — the camera, not the world); every glow the world calls is a corona — a core heating toward white, bands at three hard alpha steps, dither only as the stitch at a seam and the hem; full-coverage checker is kept for the unsolid alone (ghostBody: the wraiths, the frozen convoy, the haze of the Kept); the beacon shaft three bands brightest at the flame, three width steps with dithered hems, the top letting go, and gated to nothing by day',
    r.renderer > 100000 && r.arc === 0 && r.quad === 0 && r.linear === 0 && r.ellipse === 0 && r.radial === 1 && r.coronaCore && r.coronaSteps.length === 3 && r.coronaStitch && r.glowsAreCoronas && r.lamps > 20
    && r.ghostCalls === 3 && r.checkerOnlyInGhost && r.shaftBands && r.shaftWidths && r.shaftFade && r.nightOnly, JSON.stringify(r));
}

/* the instruments: a place staged at a time of day with the camera held where it is put and the Guide's mark kept off the
   frame; grabs and counts in WORLD units (a square of half-side r); the footprint of what changed between two grabs */
await ev(() => {
  window.__at = async (x, y, frac, camX, camY) => {
    WL.tp([x, y]); S.weather.state = 'clear'; S.speed = 0; S.braced = false; S.moveTo = null;
    const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * frac;
    for (const n of NPC.party()) { n.cx = S.px + 900; n.cy = S.py + 900; }
    /* the camera held a quarter unit off the whole: its slow drift toward the Walker never tips the world's rounding between two
       grabs, so two frames differ only where the world did */
    window.__cam = { x: Math.round(camX) + 0.25, y: Math.round(camY) + 0.25 };
    __clearAmb(camX, camY, 700); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = __cam.x; Render.cam.y = __cam.y; WL.timeScale = 0.001;
    await __wait(300); await __frames(4);
  };
  window.__look = (x, y) => { window.__cam = { x: Math.round(x) + 0.25, y: Math.round(y) + 0.25 }; };
  window.__guideTarget = Guide.target; Guide.target = () => null;   // the Guide's column and label are not the station's
  window.__shoot = async () => { if (window.__cam) { Render.cam.x = __cam.x; Render.cam.y = __cam.y; } await __wait(120); await __frames(3); };
  window.__px2 = () => Render.effZoom() / devicePixelRatio;   // CSS pixels per world unit
  window.__gw = (wx, wy, r) => __grab(wx, wy, r * __px2());
  window.__nw = (wx, wy, hex, tol, r) => __count(__gw(wx, wy, r), __hex(hex), tol);
  window.__foot = (cx0, cy0, r, a, b, yMin = -1e9, yMax = 1e9) => {
    const rad = r * __px2(), p = __toScr(cx0, cy0), dpr = devicePixelRatio, x0 = Math.max(0, Math.round((p.x - rad) * dpr)), y0 = Math.max(0, Math.round((p.y - rad) * dpr)), w = Math.round(rad * 2 * dpr), z = Render.effZoom();
    let n = 0, minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9; const rows = {};
    for (let i = 0; i < Math.min(a.length, b.length); i += 4) {
      const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); if (d <= 24) continue;
      const px = (i / 4) % w, py = Math.floor(i / 4 / w), wx = Render.cam.x + (x0 + px + 0.5 - innerWidth * dpr / 2) / z, wy = Render.cam.y + (y0 + py + 0.5 - innerHeight * dpr / 2) / z;
      if (wy < yMin || wy > yMax) continue;
      n++; minX = Math.min(minX, wx); maxX = Math.max(maxX, wx); minY = Math.min(minY, wy); maxY = Math.max(maxY, wy);
      const ky = Math.floor(wy); const rw = rows[ky] || (rows[ky] = [0, 0]); rw[0] += d; rw[1]++;
    }
    return { n, minX, maxX, minY, maxY, rows };
  };
});

/* ================= 2 · THE CORONA ON SCREEN ================= */
const corona = await ev(async () => {
  const H = DATA.stations.haven, gx = H.x + 560, gy = H.y + 300;
  await __at(gx - 150, gy + 60, 0.3, gx, gy - 14);
  const g = { name: 'Ada Vell', x: gx, y: gy, wraith: false }; S.graves = S.graves || [];
  const line = () => { const out = []; for (let k = 0; k <= 12; k++) out.push(__hex(__px(gx, gy - 14 - k))); return out; };
  await __shoot(); const without = line();
  S.graves.push(g); await __shoot(); const withIt = line();
  S.graves.splice(S.graves.indexOf(g), 1); await __shoot();
  /* above the cairn's crown: the corona alone over the ground — what it adds, texel by texel outward from its core */
  const addRGB = withIt.map((c, i) => c.map((v, j) => v - without[i][j])), add = addRGB.map(c => c[0] + c[1] + c[2]);
  const levels = [...new Set(add.filter(v => v > 6).map(v => Math.round(v / 12)))].length;
  let rises = 0; for (let i = 1; i < add.length; i++) if (add[i] > add[i - 1] + 12) rises++;
  /* the core heats toward white: what it adds is less saturated (blue nearer red) than what the band adds */
  const band = addRGB.find((c, i) => i > 0 && add[i] > 40 && add[i] < add[0] - 40), sat = c => c && c[0] > 0 ? +(c[2] / c[0]).toFixed(2) : null;
  return { add, core: addRGB[0], band, coreBlue: sat(addRGB[0]), bandBlue: sat(band), levels, rises, fades: add[add.length - 1] <= 6 && add[0] > add[6] };
});
ok('THE CORONA ON SCREEN: a cairn\'s lamp wears the corona law — measured outward from its core against the same frame without the cairn, the light it adds steps down in hard bands (three levels and more), the core heated toward white (what it adds carries more blue for its red than the band does), rising again at most at a stitched seam, and nothing past the hem',
  corona.levels >= 3 && corona.rises <= 2 && corona.fades && corona.coreBlue !== null && corona.bandBlue !== null && corona.coreBlue > corona.bandBlue + 0.1, JSON.stringify(corona));

/* ================= 3 · THE BEACON SHAFT: DAY AND NIGHT ================= */
const beam = await ev(async () => {
  const H = DATA.stations.haven, st = S.stations.haven, out = {};
  for (const [label, f] of [['day', 0.3], ['night', 0.8]]) {
    await __at(H.x + 300, H.y + 120, f, H.x, H.y - 150);
    await __shoot(); const a = __gw(H.x, H.y - 150, 86);
    const cut0 = st.cut; st.cut = S.time; await __shoot(); const b = __gw(H.x, H.y - 150, 86); st.cut = cut0; await __shoot();   // the one switch the shaft reads that nothing else in the frame does
    const fp = __foot(H.x, H.y - 150, 86, a, b);
    /* the flame end against the top: the light the shaft adds to each pixel it touches, and how wide it runs, over the lowest
       third of its rows against the highest */
    const ys = Object.keys(fp.rows).map(Number).sort((p, q) => p - q), third = Math.max(1, Math.floor(ys.length / 3));
    const per = arr => { let s2 = 0, c = 0; for (const y of arr) { s2 += fp.rows[y][0]; c += fp.rows[y][1]; } return c ? Math.round(s2 / c) : 0; };
    const wide = arr => arr.length ? Math.round(arr.reduce((s2, y) => s2 + fp.rows[y][1], 0) / arr.length) : 0;
    out[label] = { n: fp.n, width: fp.n ? +(fp.maxX - fp.minX).toFixed(1) : 0, height: fp.n ? +(fp.maxY - fp.minY).toFixed(1) : 0, top: fp.n ? Math.round(fp.minY - H.y) : null, bottom: fp.n ? Math.round(fp.maxY - H.y) : null, low: per(ys.slice(-third)), high: per(ys.slice(0, third)), lowWide: wide(ys.slice(-third)), highWide: wide(ys.slice(0, third)), night: Economy.dayPhase().nightness };
  }
  return out;
});
ok('THE SHAFT BELONGS TO THE NIGHT: at high day the column over Haven\'s beacon is measured empty — the frame with the station\'s shaft allowed and the same frame with it stopped are the same frame, pixel for pixel (there is nothing to see a beam in); at full night the shaft stands over the cage, present AND narrow — a column a hundred and more units tall rising from the cage, no wider than two dozen (the dead pillar was a full-body 28)',
  beam.day.night === 0 && beam.day.n === 0 && beam.night.night === 1 && beam.night.n > 2000 && beam.night.height >= 120 && beam.night.width <= 26 && beam.night.bottom >= -90 && beam.night.bottom <= -60, JSON.stringify(beam));
ok('THE SHAFT\'S BODY: brightest and narrowest at the flame — the light the shaft adds to each pixel it touches is greatest over its lowest third, by the cage (half again and more what it adds over its highest third), the column widening in its steps as it rises (fewer pixels a row low than high) and letting go into the dark at its top',
  beam.night.low > beam.night.high * 1.5 && beam.night.lowWide < beam.night.highWide, JSON.stringify(beam.night));

/* ================= 4 · THE WINDOW SPILL ================= */
const spill = await ev(async () => {
  const H = DATA.stations.haven, st = S.stations.haven, needs = DATA.stations.haven.needs, keep = { ...st.stock }, out = {};
  const stock = v => { for (const g of needs) st.stock[g] = v; return Render.stockDebug('haven'); };
  for (const [label, f] of [['night', 0.8], ['day', 0.3]]) {
    await __at(H.x + 300, H.y + 160, f, H.x, H.y + 10);
    const full = stock(80); await __shoot(); const a = __gw(H.x, H.y + 10, 44);
    const starved = stock(4); await __shoot(); const b = __gw(H.x, H.y + 10, 44);
    const fp = __foot(H.x, H.y + 10, 44, a, b, H.y + 14.5, H.y + 34), wf = __foot(H.x, H.y + 10, 44, a, b, H.y - 6, H.y + 6);   // the yard below the wall; the windows' own rows
    out[label] = { full, starved, pool: fp.n, left: fp.n ? Math.round(fp.minX - H.x) : null, right: fp.n ? Math.round(fp.maxX - H.x) : null, top: fp.n ? Math.round(fp.minY - H.y) : null, bottom: fp.n ? Math.round(fp.maxY - H.y) : null, windows: wf.n, wTop: wf.n ? Math.round(wf.minY - H.y) : null, wBottom: wf.n ? Math.round(wf.maxY - H.y) : null };
  }
  Object.assign(st.stock, keep); Render.stockDebug('haven');
  return out;
});
ok('THE WINDOW SPILL: after dark the burning bays cast banded pools on the yard under the longhouse — a full pantry (both bays burning, as Render.stockDebug reads it) against a starved one (both out, the door guttering) differs on the yard below the wall, left and right of the door; by day the same two pantries differ only up in the windows themselves, and the yard holds no light',
  spill.night.full.bays === 2 && spill.night.starved.bays === 0 && spill.night.starved.critical && spill.night.pool > 200 && spill.night.left <= -30 && spill.night.right >= 30
  && spill.day.pool === 0 && spill.day.windows > 100 && spill.night.windows > 100, JSON.stringify(spill));

/* ================= 5 · THE FIRE BETWEEN LOOKS ================= */
const fire = await ev(async () => {
  const cd = DATA.camps.find(c => c.id === 'pass') || DATA.camps[0], H = DATA.stations.haven;
  await __at(cd.x + 380, cd.y + 120, 0.3, cd.x, cd.y - 5);
  const B = Math.ceil(S.time) * 6 + 6;   // a whole second on: the frame is t6 % 3, the corona's beat t6 % 2
  const lookAt = async t6 => { S.time = t6 / 6 + 0.001; await __shoot(); return { flame: __gw(cd.x, cd.y - 6, 8), logs: __gw(cd.x, cd.y + 6, 2.4), idx: ((S.time * 6) | 0) % 3 }; };   // at this camera a texel of the fire is three units: the flame rows over the logs at the foot
  const L = [await lookAt(B), await lookAt(B + 1), await lookAt(B + 2), await lookAt(B + 6)];
  const againAt = __foot(cd.x, cd.y - 6, 8, L[0].flame, L[3].flame);
  /* the beacon's cage at Haven: the same three frames */
  await __at(H.x + 300, H.y + 120, 0.3, H.x, H.y - 60);
  const cage = async t6 => { S.time = t6 / 6 + 0.001; await __shoot(); return __gw(H.x, H.y - 79, 6); };
  const C2 = Math.ceil(S.time) * 6 + 6, C = [await cage(C2), await cage(C2 + 1), await cage(C2 + 2)];
  return { idx: L.map(l => l.idx), d01: __diff(L[0].flame, L[1].flame), d12: __diff(L[1].flame, L[2].flame), d02: __diff(L[0].flame, L[2].flame), again: __diff(L[0].flame, L[3].flame), againAt: againAt.n ? [Math.round(againAt.minX - cd.x), Math.round(againAt.maxX - cd.x), Math.round(againAt.minY - cd.y), Math.round(againAt.maxY - cd.y)] : null, logs: __diff(L[0].logs, L[1].logs) + __diff(L[1].logs, L[2].logs), cage01: __diff(C[0], C[1]), cage12: __diff(C[1], C[2]) };
});
ok('THE FIRE BETWEEN LOOKS: a camp\'s fire is an authored three-frame flame on its logs — three looks a sixth of a second apart catch three different shapes, the look a second on the first again, the logs never moving; the beacon\'s cage burns the same three frames',
  fire.d01 > 20 && fire.d12 > 20 && fire.d02 > 20 && fire.again === 0 && fire.logs === 0 && fire.cage01 > 0 && fire.cage12 > 0, JSON.stringify(fire));

/* ================= 6 · THE PROPS AT THEIR OWN PAINT ================= */
await ev(async () => { await __stage(); __look(Render.cam.x, Render.cam.y); await __shoot(); });
const props = await ev(async () => {
  const X = S.px + 110, Y = S.py + 10, out = {};
  const paint = (hexes, r = 22, tol = 6) => hexes.reduce((s, h) => s + __nw(X, Y - 4, h, tol, r), 0);
  const against = async (on, off, hexes, r = 22) => { on(); await __shoot(); const p1 = paint(hexes, r), g1 = __gw(X, Y - 4, r); off(); await __shoot(); const p0 = paint(hexes, r), g0 = __gw(X, Y - 4, r); return { paint: p1, bare: p0, diff: __diff(g1, g0) }; };
  const node = (type, extra = {}) => ({ id: U.uid(), type, x: X, y: Y, qty: 12, taken: false, ...extra });
  let n;
  n = node('metal'); out.metal = await against(() => S.nodes.push(n), () => S.nodes.splice(S.nodes.indexOf(n), 1), ['#9aa2ab', '#6e747c', '#8a5238']);
  n = node('ceramic'); out.ceramic = await against(() => S.nodes.push(n), () => S.nodes.splice(S.nodes.indexOf(n), 1), ['#9a8468', '#c2ab89']);
  n = node('lumen', { respawn: 0 }); S.nodes.push(n);
  const T3 = Math.ceil(S.time) * 3 + 3, tL = k => { S.time = (T3 + k) / 3 + 0.001; };   // the bloom's two frames: ((t * 3) | 0) % 2
  tL(0); await __shoot(); const f0 = __gw(X, Y - 6, 12), lp = paint(['#6fe3d2', '#d8fff5', '#2c8a7c'], 16, 8); tL(1); await __shoot(); const f1 = __gw(X, Y - 6, 12);
  S.nodes.splice(S.nodes.indexOf(n), 1); await __shoot();
  out.lumen = { paint: lp, frames: __diff(f0, f1), bare: paint(['#6fe3d2', '#d8fff5', '#2c8a7c'], 16, 8) };
  return out;
});
ok('THE SALVAGE AND THE BLOOMS AT THEIR OWN PAINT: a metal pile in its steels and its rust, a ceramic pile in its clays — each counted in its own colours on the canvas against the same frame without it — and a lumen bloom a crystal cluster in its greens that changes between its two frames',
  ['metal', 'ceramic'].every(k => props[k].paint > 300 && props[k].bare < props[k].paint / 10 && props[k].diff > 300) && props.lumen.paint > 100 && props.lumen.frames > 20 && props.lumen.bare === 0, JSON.stringify(props));

const crates = await ev(async () => {
  const X = S.px + 110, Y = S.py + 10, out = {};
  const paint = (hexes, r = 12, tol = 6) => hexes.reduce((s, h) => s + __nw(X, Y, h, tol, r), 0);
  const drop = item => ({ id: U.uid(), item, x: X, y: Y });
  const crate = async (item, band) => { const d = drop(item); S.drops.push(d); await __shoot(); const p1 = paint([band]), planks = paint(['#6b4a30', '#8a6a42']), g1 = __gw(X, Y, 12); S.drops.splice(S.drops.indexOf(d), 1); await __shoot(); return { band: p1, planks, bare: paint([band]) + paint(['#6b4a30', '#8a6a42']), diff: __diff(g1, __gw(X, Y, 12)) }; };
  const lostIt = State.makeItem('meds'); lostIt.lostTo = 'mill';
  out.lost = await crate(lostIt, '#ffd98f');
  out.core = await crate({ ...State.makeItem('meds'), cat: 'core' }, '#6fe3d2');
  out.mat = await crate({ ...State.makeItem('meds'), cat: 'mat' }, '#8a8f98');
  out.plain = await crate(State.makeItem('meds'), '#c9b98a');
  return out;
});
ok('THE CRATES BY THE ICON LAW: a crate on the ground is planked timber banded by what it is — gold for lost and signed cargo, the lumen\'s green for a core, grey for material, bone for the rest — each band counted in its own colour against the same frame without the crate',
  Object.values(crates).every(c => c.band > 20 && c.planks > 60 && c.bare === 0 && c.diff > 100), JSON.stringify(crates));

const road = await ev(async () => {
  const X = S.px + 110, Y = S.py + 10, out = {};
  const paint = (hexes, r = 22, tol = 6) => hexes.reduce((s, h) => s + __nw(X, Y - 4, h, tol, r), 0);
  const against = async (on, off, hexes, r = 22) => { on(); await __shoot(); const p1 = paint(hexes, r), g1 = __gw(X, Y - 4, r); off(); await __shoot(); const p0 = paint(hexes, r), g0 = __gw(X, Y - 4, r); return { paint: p1, bare: p0, diff: __diff(g1, g0) }; };
  const ev0 = S.event;
  out.drop = await against(() => { S.event = { id: U.uid(), type: 'supplyDrop', x: X, y: Y, t: 300, data: {} }; }, () => { S.event = ev0 || null; }, ['#d8dde2', '#b8bec6', '#ffc978']);
  out.cart = await against(() => { S.event = { id: U.uid(), type: 'peddler', x: X, y: Y, t: 300, data: { stock: NPC.peddlerStock() } }; }, () => { S.event = ev0 || null; }, ['#d8d2bd', '#b8b29d', '#7a6248']);
  const g = { name: 'Ada Vell', x: X, y: Y, wraith: false }; S.graves = S.graves || [];
  out.cairn = await against(() => S.graves.push(g), () => S.graves.splice(S.graves.indexOf(g), 1), ['#6b7076', '#8d979c'], 14);
  /* the Kept: the courier's rows in the ghost palette, where they fell — blue-led where grass was */
  const k = { name: 'Oren Hale', x: X, y: Y, wraith: true };
  const blue = () => { const d = __gw(X, Y - 18, 14); let c = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > d[i] + 40 && d[i + 2] > d[i + 1] + 25) c++; return c; };
  S.graves.push(k); await __shoot(); const kb = blue(), kg = __gw(X, Y - 18, 14); S.graves.splice(S.graves.indexOf(k), 1); await __shoot(); out.kept = { blue: kb, bare: blue(), diff: __diff(kg, __gw(X, Y - 18, 14)) };
  /* the paver, where the next segment of a road on the wire waits */
  const rd = DATA.roads.find(r2 => r2.needs.includes('haven'));
  const keepC = rd.needs.map(id => S.stations[id].connected), keepR = [...S.roads[rd.id]];
  rd.needs.forEach(id => { S.stations[id].connected = true; }); S.roads[rd.id] = S.roads[rd.id].map(() => false);
  const pp = World.paverPos(rd, 0); WL.tp([pp.x - 150, pp.y + 60]); __look(pp.x, pp.y); __clearAmb(pp.x, pp.y, 300); await __shoot(); await __shoot();
  const pave = () => ['#ffc978', '#5a626c', '#7a828c'].reduce((s, h) => s + __nw(pp.x, pp.y - 2, h, 6, 18), 0), pg = __gw(pp.x, pp.y - 2, 18);
  const pv = pave();
  S.roads[rd.id][0] = true; await __shoot(); out.paver = { paint: pv, bare: pave(), diff: __diff(pg, __gw(pp.x, pp.y - 2, 18)), road: rd.id };
  S.roads[rd.id] = keepR; rd.needs.forEach((id, i) => { S.stations[id].connected = keepC[i]; });
  __done();
  return out;
});
ok('THE ROADSIDE AND THE KEPT AT THEIR OWN PAINT: the supply drop (a planked crate, its chute fallen beside it, its gold band), the peddler\'s cart (canvas top, timber bed, the lantern on its pole), the cairn\'s cut stones, the road paver with its warning stripe waiting at the next segment, and the Kept standing where they fell as the courier in a ghost palette — each in its own colours against the same frame without it',
  ['drop', 'cart', 'cairn', 'paver'].every(k => road[k].paint > 200 && road[k].bare < road[k].paint / 5 && road[k].diff > 200) && road.kept.blue > 200 && road.kept.bare === 0 && road.kept.diff > 300, JSON.stringify(road));

/* ================= 7 · THE MAST ================= */
const mast = await ev(async () => {
  const H = DATA.stations.haven;
  await __at(H.x + 300, H.y + 120, 0.3, H.x, H.y - 50);
  const top = H.y - 74;   // the lattice's crown: the cage, then the timber down to the longhouse roof
  const cnt = (hexes, y, r) => hexes.reduce((s, h) => s + __nw(H.x, y, h, 5, r), 0);
  const lit = { timber: cnt(['#6b5a42'], top + 30, 12), flame: cnt(['#ffd98f', '#e0654a', '#fff2d0'], top - 6, 6), cage: cnt(['#20262e'], top + 4, 6) };
  const st = S.stations.haven, keep = st.litT; st.litT = 0; await __shoot();
  const dark = { timber: cnt(['#6b5a42'], top + 30, 12), cold: cnt(['#3a4048'], top + 30, 12), flame: cnt(['#ffd98f', '#e0654a', '#fff2d0'], top - 6, 6), cage: cnt(['#20262e'], top + 4, 6) };
  st.litT = keep; await __shoot(); __done();
  return { lit, dark };
});
ok('THE MAST: the station\'s waylight mast is an authored lattice at its own paint — warm timber rising behind the longhouse, the three-frame fire burning in its cage while the station is lit (the corona over the iron); dark, the same lattice goes cold grey, the cage\'s iron bare and no flame in it',
  mast.lit.timber > 100 && mast.lit.flame > 20 && mast.dark.timber === 0 && mast.dark.cold > 100 && mast.dark.flame === 0 && mast.dark.cage > mast.lit.cage, JSON.stringify(mast));

await ev(() => { Guide.target = __guideTarget; });
await T.finish('the glow pass');
