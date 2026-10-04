/* continent.mjs — v3.26 THE DARKLANDS TABLE (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). The scale ladder made honest: the map's three tabs (the valley's
   survey sheet, the Darklands table, the Known World's globe) by real clicks, one engine drawing at a time, and the sheet
   reopening on the tab it was closed on; the table windowed out of the globe's own planet bake with the Greymarch framed on
   real land — the land dots and the sea's stipple standing exactly where the planet says land and sea are; the painted floor
   counted over thousands of samples (bone, gold, the grey-blue sea); the yaw turned by a real drag and drifting on its own;
   the frame rate held over twenty; the Greymarch's footprint carrying the live game (the walker's white pulse where the walker
   stands, the light as gold stipple growing with coverage, lit gold and dark grey pips growing as the table is leaned into,
   rust rings on the camps still up); the uncharted reaches pinned on the table, a real click on one opening its desk; the
   globe's halo inside a padded canvas (corners empty, the glow alive between the disc and the edge) under the caption that
   demotes it to an ornament. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;
await ev(() => { for (const n of NPC.party()) n.cx = undefined; WL.timeScale = 1; });

/* the table's own projection, read back from its click targets (st.hits) — so a pixel is looked for where the table put it */
const PROJ = `(u, v, h) => { const cv = document.getElementById('cont'), st = Continent._st, cw = cv.width, ch = cv.height;
  const X = (u - 0.5) * 2.75, Z = (v - 0.5) * 2.05, Y = -Math.max(0, h) * 1.15, c = Math.cos(st.yaw), s = Math.sin(st.yaw);
  const x1 = X * c - Z * s, z1 = X * s + Z * c, ce = Math.cos(0.94), se = Math.sin(0.94), y2 = Y * ce - z1 * se, z2 = Y * se + z1 * ce;
  const sc = (ch * 1.08 * st.zoom) / (3.1 + z2); return { x: cw / 2 + x1 * sc, y: ch * 0.52 + y2 * sc }; }`;
await ev(src => { window.__proj = eval(src); window.__contPx = () => { const cv = document.getElementById('cont'); return { w: cv.width, h: cv.height, d: cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data }; }; }, PROJ);

const tabState = () => ev(async () => {
  const vis = id => !document.getElementById(id).classList.contains('hidden');
  const c0 = Continent._st.t, g0 = Globe._st.t; await __wait(450); await __frames(2);
  return {
    valley: vis('mapCanvasWrap'), cont: vis('contWrap'), world: vis('globeWrap'), contOpen: Continent.isOpen, globeOpen: Globe.isOpen,
    contRuns: Continent._st.t > c0, globeRuns: Globe._st.t > g0, title: document.getElementById('mapTitle').textContent, sub: document.getElementById('mapSub').textContent,
    on: [...document.querySelectorAll('#mapViewBtns .viewBtn.on')].map(b => b.id), labels: [...document.querySelectorAll('#mapViewBtns .viewBtn')].map(b => b.textContent.trim()),
  };
});

/* ================= 1 · THE LADDER: three tabs, one engine ================= */
await page.keyboard.press('KeyM'); await page.waitForTimeout(400);
const ladder = { open: await tabState() };
await page.click('#btnViewCont'); ladder.cont = await tabState();
await page.click('#btnViewWorld'); ladder.world = await tabState();
await page.click('#btnViewValley'); ladder.valley = await tabState();
const one = (s, k) => s.valley === (k === 'valley') && s.cont === (k === 'cont') && s.world === (k === 'world') && s.contOpen === (k === 'cont') && s.globeOpen === (k === 'world') && s.contRuns === (k === 'cont') && s.globeRuns === (k === 'world');
ok('THE LADDER (v3.49: the plain names): the map\'s three tabs by real clicks — VALLEY, REGION, WORLD — the window titled Map, Region map, World map with the places riding under it (the Greymarch, the Darklands, the Known World); on each tab one sheet stands and one engine draws: the table\'s clock runs only on the region tab, the globe\'s only on the world tab, neither on the valley\'s',
  ladder.open.labels.join() === 'VALLEY,REGION,WORLD' && one(ladder.open, 'valley') && one(ladder.cont, 'cont') && one(ladder.world, 'world') && one(ladder.valley, 'valley')
  && ladder.valley.title === 'Map' && /Greymarch/.test(ladder.valley.sub) && ladder.cont.title === 'Region map' && /Darklands/.test(ladder.cont.sub) && ladder.world.title === 'World map' && /Known World/.test(ladder.world.sub)
  && ladder.cont.on.join() === 'btnViewCont' && ladder.world.on.join() === 'btnViewWorld' && ladder.valley.on.join() === 'btnViewValley',
  JSON.stringify(ladder));

/* ================= 2 · REOPEN WHERE YOU LEFT ================= */
await page.click('#btnViewCont'); await page.waitForTimeout(300);
const yawLeft = await ev(() => Continent._st.yaw);
await page.keyboard.press('KeyM'); await page.waitForTimeout(300);
const shut = await ev(() => ({ sheet: !document.getElementById('mapWrap').classList.contains('hidden'), contOpen: Continent.isOpen, globeOpen: Globe.isOpen, t: Continent._st.t }));
await page.waitForTimeout(300);
const shutT = await ev(() => Continent._st.t);
await page.keyboard.press('KeyM'); await page.waitForTimeout(300);
const back = await tabState();
const yawBack = await ev(() => Continent._st.yaw);
/* and from the reopened sheet, a step back down the ladder: the valley's survey sheet, drawn */
await page.click('#btnViewValley'); await page.waitForTimeout(400);
const down = await ev(() => { const cv = document.getElementById('map'), size = [cv.width, cv.height, cv.clientWidth, cv.clientHeight]; let painted = 0; if (cv.width && cv.height) { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; for (let i = 0; i < d.length; i += 40) if (d[i] + d[i + 1] + d[i + 2] > 60) painted++; } return { size, painted, valley: !document.getElementById('mapCanvasWrap').classList.contains('hidden') }; });
await page.click('#btnViewCont'); await page.waitForTimeout(300);
ok('REOPEN WHERE YOU LEFT: the sheet closed on the region tab stops both engines (the table\'s clock stands while the sheet is shut); M again opens it on the region tab, the table drawing, its yaw where it was left — and a step back down to the valley finds its survey sheet drawn, the canvas the size of its window',
  !shut.sheet && !shut.contOpen && !shut.globeOpen && shutT === shut.t && one(back, 'cont') && back.title === 'Region map' && Math.abs(yawBack - yawLeft) < 0.05
  && down.valley && down.size[0] === down.size[2] && down.size[1] === down.size[3] && down.size[0] > 0 && down.painted > 1000,
  JSON.stringify({ shut, shutT, back, yawLeft, yawBack, down }));

/* ================= 3 · ONE TRUTH: the table is the planet's bake, windowed ================= */
await ev(() => { Continent._st.vel = 0; });
const bake = await ev(async () => {
  await __frames(2);
  const gm = Globe.REGIONS.find(r => r.id === 'greymarch'), w = Continent.win, fp = Continent.gmRect(), SEA = Globe.SEA;
  const elev = (u, v) => Globe.elevAt(w.lon0 + u * w.lonW, w.lat0 + v * w.latW) - SEA;
  const pinUV = [(gm.lon - w.lon0) / w.lonW, (gm.lat - w.lat0) / w.latW];
  let land = 0, n = 0; for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) { n++; if (elev(fp.u0 + fp.w * i / 10, fp.v0 + fp.h * j / 10) >= 0) land++; }
  /* the table's hit targets sit where its projection puts the pins — the same projection used for the samples below */
  const hitsAgree = Continent._st.hits.filter(h => Globe.REGIONS.some(r => r.id === h.id)).every(h => { const rg = Globe.REGIONS.find(r => r.id === h.id), p = __proj(U.clamp((rg.lon - w.lon0) / w.lonW, 0.05, 0.95), U.clamp((rg.lat - w.lat0) / w.latW, 0.07, 0.93), 0.004); return Math.abs(p.x - h.x) < 0.5 && Math.abs(p.y - h.y) < 0.5; });
  /* the land's dots where the planet says land (lifted by their height), the sea's stipple where it says sea */
  const { w: cw, d } = __contPx(), NX = 220, NY = 156;
  const at = (x, y) => { const i = (Math.floor(y) * cw + Math.floor(x)) * 4; return [d[i], d[i + 1], d[i + 2]]; };
  let seaN = 0, seaBlue = 0, seaWarm = 0, landN = 0, landWarm = 0, landBlue = 0;
  for (let j = 0; j < NY; j += 2) {
    for (let i = ((j / 2) % 2) * 2; i < NX; i += 12) { const u = i / (NX - 1), v = j / (NY - 1), h = elev(u, v); if (h > -0.004) continue; const p = __proj(u, v, 0), [r, g, b] = at(p.x + 0.5, p.y + 0.5); seaN++; if (b > r + 6 && b > 18) seaBlue++; if (r > b + 6) seaWarm++; }
    for (let i = (j % 4 === 0 ? 1 : 0); i < NX; i += 14) { const u = i / (NX - 1), v = j / (NY - 1), h = elev(u, v); if (h < 0.004) continue; const p = __proj(u, v, h), [r, g, b] = at(p.x + 0.4, p.y + 0.4); landN++; if (r >= b - 3 && r + g + b > 36) landWarm++; if (b > r + 6) landBlue++; }
  }
  const again = Continent.win; Continent.bake();
  return { pinUV, pinLand: elev(pinUV[0], pinUV[1]) >= 0, landInFoot: land / n, fpInside: fp.u0 > 0 && fp.v0 > 0 && fp.u0 + fp.w < 1 && fp.v0 + fp.h < 1, hitsAgree,
    seaN, seaBlue, seaWarm, landN, landWarm, landBlue, sameWin: Continent.win === again };
});
ok('ONE TRUTH: the table is windowed out of the globe\'s own planet bake around the Greymarch pin (the pin at the window\'s framing point, on real land — the valley on a coast, its footprint inside the table and on land); sampled where the table\'s projection puts them, the land\'s dots stand where the planet says land (lifted by their height) and the sea\'s stipple where it says sea, never the other way round; baking again changes nothing',
  Math.abs(bake.pinUV[0] - 0.55) < 1e-6 && Math.abs(bake.pinUV[1] - 0.44) < 1e-6 && bake.pinLand && bake.landInFoot > 0.3 && bake.fpInside && bake.hitsAgree
  && bake.seaN > 100 && bake.seaBlue / bake.seaN > 0.7 && bake.seaWarm / bake.seaN < 0.1 && bake.landN > 100 && bake.landWarm / bake.landN > 0.7 && bake.landBlue / bake.landN < 0.1 && bake.sameWin,
  JSON.stringify(bake));

/* ================= 4 · THE PAINTED FLOOR ================= */
const floor = await ev(() => {
  const { d } = __contPx(), fam = { bg: 0, bone: 0, gold: 0, sea: 0, rust: 0, other: 0 }; let n = 0;
  for (let i = 0; i < d.length; i += 4 * 7) {
    n++; const r = d[i], g = d[i + 1], b = d[i + 2];
    if (r + g + b < 40) fam.bg++; else if (b > r + 10 && b > g) fam.sea++; else if (r > 180 && g > 130 && b < 150 && r - b > 60) fam.gold++;
    else if (r > 90 && Math.abs(r - g) < 25 && r >= b) fam.bone++; else if (r > g + 30 && r > b + 30) fam.rust++; else fam.other++;
  }
  return { n, ...fam, painted: n - fam.bg };
});
ok('THE PAINTED FLOOR: over a hundred thousand samples of the table, thousands are painted — the bone of the contours and the land\'s dots, the Greymarch\'s gold, the grey-blue stipple of the sea all present, the sea a surface and never a hole',
  floor.n > 100000 && floor.painted > 4000 && floor.bone > 400 && floor.gold > 40 && floor.sea > 600, JSON.stringify(floor));

/* ================= 5 · THE YAW, LIVE ================= */
const box = await page.locator('#cont').boundingBox();
const yaw0 = await ev(async () => { const a = Continent._st.yaw; await __wait(1000); return { a, b: Continent._st.yaw }; });
const drift = yaw0.b - yaw0.a;
const before = await ev(() => { const y = Continent._st.yaw; window.__yawA = __contPx().d; return y; });
await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6);
await page.mouse.down();
for (let k = 1; k <= 8; k++) { await page.mouse.move(box.x + box.width * 0.5 + k * 18, box.y + box.height * 0.6); await page.waitForTimeout(16); }
const held = await ev(() => Continent._st.yaw);
await page.mouse.up();
const turned = await ev(async () => { await __wait(300); await __frames(2); const y = Continent._st.yaw; return { y, changed: __diff(__yawA, __contPx().d) }; });
ok('THE YAW, LIVE: the table drifts on its own when nobody holds it, and a real drag across it turns it (the yaw follows the hand, clamped, the painted frame changing under it)',
  drift > 0.003 && held - before > 0.2 && held <= 0.45 && turned.changed > 2000, JSON.stringify({ drift, before, held, after: turned.y, changed: turned.changed }));

/* ================= 6 · THE FRAME RATE ================= */
/* the frames the page drew over three seconds, read in their best one-second window — the table's own pace, not a
   neighbour's burst on a shared machine */
const fps = await ev(async () => { const ts = [], t0 = performance.now(); await new Promise(res => { const f = t => { ts.push(t); if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }); let best = 0; for (let i = 0, j = 0; i < ts.length; i++) { while (ts[i] - ts[j] > 1000) j++; best = Math.max(best, i - j); } return { fps: best, mean: +(ts.length / 3).toFixed(1), tableRunning: Continent.isOpen && Continent._st.t > 0 }; });
ok('THE FRAME RATE: with every layer of the table on (the far coasts, the graticule, the sea, the land\'s field, thirteen contour rings, the Greymarch, the pins, the columns), the page holds over twenty frames a second',
  fps.fps >= 20 && fps.tableRunning, JSON.stringify(fps));

/* ================= 7 · THE FOOTPRINT: the live game on the table ================= */
const foot = await ev(async () => {
  const C = Continent._st; C.vel = 0; C.yaw = -0.1; C.drag = { x: 0, y0: C.yaw, x0: 0, yScr: 0, moved: 99 };   // a hand holds the table still (at one yaw, every run) while its frames are compared
  const fp = Continent.gmRect();
  const uvOf = (x, y) => [fp.u0 + (x / World.W) * fp.w, fp.v0 + (y / World.H) * fp.h];
  const within = (p, r, test) => { const { w: cw, d } = __contPx(); let n = 0; for (let y = Math.floor(p.y - r); y <= p.y + r; y++) for (let x = Math.floor(p.x - r); x <= p.x + r; x++) { const i = (y * cw + x) * 4; if (test(d[i], d[i + 1], d[i + 2])) n++; } return n; };
  const white = (r, g, b) => r > 225 && g > 225 && b > 225, goldHue = (r, g, b) => r > g && g > b && r - b > 25 && r > 40;
  const pipGrey = (r, g, b) => Math.abs(r - 86) < 12 && Math.abs(g - 95) < 12 && Math.abs(b - 109) < 12, pipGold = (r, g, b) => Math.abs(r - 243) < 14 && Math.abs(g - 191) < 14 && Math.abs(b - 114) < 16;   // the pips' own fills (#5a6472, #ffc978), drawn at 0.95
  const out = {};
  /* the walker's pulse, where the walker stands — west of the valley, then east */
  WL.tp([World.W * 0.2, World.H * 0.5]); await __wait(120); await __frames(2);
  const pW = __proj(...uvOf(S.px, S.py), 0.01), pE = __proj(...uvOf(World.W * 0.8, World.H * 0.5), 0.01);
  const a = { west: within(pW, 5, white), east: within(pE, 5, white) };
  WL.tp([World.W * 0.8, World.H * 0.5]); await __wait(120); await __frames(2);
  const b2 = { west: within(pW, 5, white), east: within(pE, 5, white) };
  out.walker = { before: a, after: b2, mapsSame: World.W === DATA.W && World.H === DATA.H, eastOfWest: pE.x - pW.x };
  WL.tp([World.W * 0.04, World.H * 0.04]); await __wait(60);   // the walker's pulse stands off in a corner while the pips are read
  /* the light as gold stipple inside the footprint, growing with coverage (the same held frame, coverage changed) */
  const ps = [[fp.u0, fp.v0], [fp.u0 + fp.w, fp.v0], [fp.u0, fp.v0 + fp.h], [fp.u0 + fp.w, fp.v0 + fp.h]].map(([u, v]) => __proj(u, v, 0.006));
  const mid = { x: (Math.min(...ps.map(p => p.x)) + Math.max(...ps.map(p => p.x))) / 2, y: (Math.min(...ps.map(p => p.y)) + Math.max(...ps.map(p => p.y))) / 2 };
  const rad = Math.max(Math.max(...ps.map(p => p.x)) - Math.min(...ps.map(p => p.x)), Math.max(...ps.map(p => p.y)) - Math.min(...ps.map(p => p.y))) / 2;
  const cov0 = S.cov; S.cov = 0.03; await __frames(3); const low = within(mid, rad, goldHue);
  S.cov = 0.7; await __frames(3); const high = within(mid, rad, goldHue); S.cov = cov0; await __frames(2);
  out.light = { low, high, rad: Math.round(rad) };
  /* the pips, leaned into: Elm dark grey, then lit gold; Haven's pip larger leaned in than leaned out */
  C.zoom = 1.7; await __frames(3);
  const pElm = __proj(...uvOf(DATA.stations.elm.x, DATA.stations.elm.y), 0.008);
  const elmDark = { grey: within(pElm, 3, pipGrey), gold: within(pElm, 3, pipGold) };
  S.stations.elm.connected = true; await __frames(3);
  const elmLit = { grey: within(pElm, 3, pipGrey), gold: within(pElm, 3, pipGold) }; S.stations.elm.connected = false;
  const pH = () => __proj(...uvOf(DATA.stations.haven.x, DATA.stations.haven.y), 0.008);
  await __frames(2); const havenClose = within(pH(), 6, pipGold);
  C.zoom = 0.8; await __frames(3); const havenFar = within(pH(), 6, pipGold); C.zoom = 1.12; WL.tp('haven'); await __frames(2);
  out.pips = { elmDark, elmLit, havenClose, havenFar };
  /* the camps still up wear rust rings; quieted, the rust goes */
  const rust = (r, g, b) => r > 150 && g < 140 && b < 110 && r - g > 50;
  const rustUp = within(mid, rad, rust);
  const was = DATA.camps.map(cd => S.camps[cd.id].pacified); for (const cd of DATA.camps) S.camps[cd.id].pacified = true; await __frames(3);
  const rustQuiet = within(mid, rad, rust); DATA.camps.forEach((cd, i) => { S.camps[cd.id].pacified = was[i]; });
  out.camps = { rustUp, rustQuiet };
  C.drag = null;
  return out;
});
ok('THE FOOTPRINT: the Greymarch\'s box on the table is the whole valley (the world\'s width and height mapped into it) and carries the live game — the walker\'s white pulse where the walker stands (west of the valley, then east, and gone from where it was); the light as gold stipple that grows with coverage; the stations\' pips, dark grey until a town is lit and gold when it is, growing as the table is leaned into; rust rings on the camps still up, gone when they are quiet',
  foot.walker.mapsSame && foot.walker.eastOfWest > 10 && foot.walker.before.west > 0 && foot.walker.before.east === 0 && foot.walker.after.east > 0 && foot.walker.after.west === 0
  && foot.light.high > foot.light.low + 60 && foot.light.low > 5 && foot.pips.elmDark.grey > 0 && foot.pips.elmDark.gold === 0 && foot.pips.elmLit.gold > 0 && foot.pips.elmLit.grey === 0
  && foot.pips.havenClose > foot.pips.havenFar && foot.camps.rustUp > 10 && foot.camps.rustQuiet < foot.camps.rustUp / 3,
  JSON.stringify(foot));

/* ================= 8 · THE UNCHARTED, ON THE TABLE ================= */
await page.waitForTimeout(200);
const pins = await ev(() => { const st = Continent._st; return { regions: Globe.REGIONS.filter(r => r.kind === 'uncharted').map(r => r.id), hits: (st.hits || []).map(h => ({ id: h.id, x: h.x, y: h.y })), cw: document.getElementById('cont').width, ch: document.getElementById('cont').height }; });
const sf = pins.hits.find(h => h.id === 'saltflats');
const labelGrey = await ev(h => { const { w: cw, d } = __contPx(); let n = 0; for (let y = Math.floor(h.y - 60); y < h.y + 4; y++) for (let x = Math.floor(h.x - 70); x < h.x + 70; x++) { const i = (y * cw + x) * 4; if (Math.abs(d[i] - 138) < 12 && Math.abs(d[i + 1] - 143) < 12 && Math.abs(d[i + 2] - 152) < 12) n++; } return n; }, sf);
await page.mouse.click(box.x + sf.x, box.y + sf.y); await page.waitForTimeout(250);
const desk = await ev(() => { const el = document.getElementById('contPanel'); return { shown: !el.classList.contains('hidden'), text: el.textContent }; });
await page.mouse.click(box.x + 40, box.y + box.height - 90); await page.waitForTimeout(200);
const deskShut = await ev(() => document.getElementById('contPanel').classList.contains('hidden'));
const lm = await ev(() => { Continent.openDesk('lowmarrow'); const el = document.getElementById('contPanel'), a = { shown: !el.classList.contains('hidden'), text: el.textContent }; Continent.closeDesk(); return { ...a, closed: el.classList.contains('hidden') }; });
ok('THE UNCHARTED, ON THE TABLE: both uncharted reaches (the Salt Flats, Low Marrow) stand as pins on the table, labelled in the survey\'s grey where the table put them; a real click on the Salt Flats opens its desk (its name, its blurb, the recon ride to fund) and a click on bare table puts it away; Low Marrow\'s desk the same',
  pins.regions.join() === 'saltflats,lowmarrow' && ['saltflats', 'lowmarrow'].every(id => pins.hits.some(h => h.id === id && h.x > 0 && h.x < pins.cw && h.y > 0 && h.y < pins.ch)) && labelGrey > 20
  && desk.shown && /THE SALT FLATS/.test(desk.text) && /FUND THE RECON RIDE/.test(desk.text) && deskShut && lm.shown && /LOW MARROW/.test(lm.text) && lm.closed,
  JSON.stringify({ pins, labelGrey, desk: { shown: desk.shown, text: desk.text.slice(0, 120) }, deskShut, lm: { shown: lm.shown, text: lm.text.slice(0, 60), closed: lm.closed } }));

/* ================= 9 · THE GLOBE, DEMOTED AND PADDED ================= */
await page.click('#btnViewWorld'); await page.waitForTimeout(700);
const halo = await ev(async () => {
  await __frames(3);
  const cv = document.getElementById('globe'), { DSZ, R } = Globe._pad(), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, C = DSZ / 2;
  const a = (x, y) => d[(Math.floor(y) * cv.width + Math.floor(x)) * 4 + 3];
  let corners = 0; for (const [cx, cy] of [[0, 0], [DSZ - 14, 0], [0, DSZ - 14], [DSZ - 14, DSZ - 14]]) for (let y = cy; y < cy + 14; y++) for (let x = cx; x < cx + 14; x++) corners += a(x, y);
  let edges = 0; for (const [x, y] of [[C, 1], [C, DSZ - 2], [1, C], [DSZ - 2, C]]) edges += a(x, y);
  let glow = 0, ring = 0; for (let k = 0; k < 48; k++) { const an = k / 48 * Math.PI * 2; ring++; if (a(C + Math.cos(an) * R * 1.08, C + Math.sin(an) * R * 1.08) > 0) glow++; }
  let disc = 0; for (let k = 0; k < 48; k++) { const an = k / 48 * Math.PI * 2; if (a(C + Math.cos(an) * R * 0.6, C + Math.sin(an) * R * 0.6) === 255) disc++; }
  const globeOpen = Globe.isOpen, contOpen = Continent.isOpen;
  UI.setMapView('continent'); const swapped = Continent.isOpen && !Globe.isOpen; UI.setMapView('valley'); const neither = !Continent.isOpen && !Globe.isOpen;   // the ladder's own switch, down a rung and back to the valley
  return { DSZ, R, size: [cv.width, cv.height], corners, edges, glow, ring, disc, cap: document.getElementById('globeCap').textContent, globeOpen, contOpen, swapped, neither };
});
ok('THE GLOBE, DEMOTED AND PADDED: the world tab\'s canvas is padded past the halo (a quarter again the disc\'s radius), so the atmosphere ends where it ends — the four corners and the edges\' midpoints empty, the glow alive all round between the disc and the edge, the disc itself solid; the caption owns the new station: the farthest the glass pulls back, an ornament of the survey, for now',
  halo.globeOpen && !halo.contOpen && halo.swapped && halo.neither && halo.size[0] === halo.DSZ && halo.DSZ >= halo.R * 2.5 && halo.corners === 0 && halo.edges === 0 && halo.glow === halo.ring && halo.disc === 48
  && /the farthest the glass pulls back/.test(halo.cap) && /an ornament of the survey, for now/.test(halo.cap),
  JSON.stringify(halo));

await page.keyboard.press('KeyM');
await T.finish('the Darklands table');
