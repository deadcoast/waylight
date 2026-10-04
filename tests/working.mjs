/* working.mjs — v3.20 THE WORKING WORLD (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). Traffic writes the land, crews work it, every coin is seen: a
   completed delivery and a charter's run are FEET — the valley's own line between the two towns wears in, trampled then
   bare, whoever walked it; a bare trail takes P underfoot — scrap plates, cobbles, a wood way, each its own paint and its
   own pace, tiers that only climb, finished ground that never repaints as dirt, and the boardwalk flat over marsh; green
   grass refuses. From a terminal the pooled hands go OUT, three a town: the presser walks the line and wears it, the mason
   cobbles it and drains the ceramic to the last slab, the forrester fells the near wood into meadow and timber, the hauler
   walks freight onto the far end's worst shelf and becomes the donkey caravan at Hauling 5 — each drawn where it works,
   its job on a label; called in with a click. A companion trained to Hauling 2 sweeps what the Walker sees, reach growing
   by the level. Every currency lands as a seen chip that merges, counts up and fades. The paving and the felling ride the
   save through a real reload. v3.49's plain names: the crew is sent out from the terminal's Mail tab. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
await T.at(0.3);

/* the valley at work: Elm, the Mill and the Quarry on the wire; the stores banked; the director and the fire's pool at rest */
await ev(() => {
  for (const id of ['elm', 'mill', 'quarry']) { const st = S.stations[id]; st.connected = true; st.met = true; st.litT = 1; }
  State.refreshSources(true);
  S.banked.provisions = 400; S.banked.metal = 200; S.banked.ceramic = 60; S.banked.wood = 20;
  S.eventCd = 1e9; S.poolT = 1e9; S.weather.state = 'clear';
  const L = Ledger.led(); L.auto.onArrival = false; L.auto.autoDeliver = false; L.auto.grabLetters = false;   // arrival is the test's to stage
  WL.timeScale = 0.0001;
  window.__toasts = []; new MutationObserver(ms => { for (const m of ms) for (const n2 of m.addedNodes) if (n2.textContent) __toasts.push(n2.textContent); }).observe(document.getElementById('toasts'), { childList: true });
  window.__says = []; const say0 = Render.say; Render.say = (x, y, text, ...rest) => { __says.push(text); return say0(x, y, text, ...rest); };
  window.__labels = () => Render.labelBoxes().map(b => b.str);
  window.__line = (a, b) => { const A = DATA.stations[a], B = DATA.stations[b]; return World.pathTime(A.x, A.y, B.x, B.y, true, Systems.walkOpts(true)).path; };
  window.__wearable = (x, y) => { const c = World.classAt(x, y); return c === World.MEADOW || c === World.MARSH; };
  /* the paint itself: the 2×2 texels of the wear cell under a world point, read off the terrain canvas */
  window.__cell = (x, y) => { const cx = (x / 10) | 0, cy = (y / 10) | 0, tx = Math.round(cx * 10 / World.TS), ty = Math.round(cy * 10 / World.TS); const d = World.tc.getContext('2d').getImageData(tx, ty, 2, 2).data; const o = []; for (let k = 0; k < 4; k++) o.push([d[k * 4], d[k * 4 + 1], d[k * 4 + 2]]); return o; };
  window.__texel = (x, y) => { const d = World.tc.getContext('2d').getImageData((x / World.TS) | 0, (y / World.TS) | 0, 1, 1).data; return [d[0], d[1], d[2]]; };
  window.__RAMP = { tr: [[88, 98, 54], [76, 86, 48]], ba: [[124, 111, 79], [105, 94, 66]], p1: [[70, 78, 86], [54, 62, 70], [98, 108, 116]], p2: [[152, 148, 136], [118, 114, 104], [176, 172, 156]], p3: [[128, 96, 58], [104, 76, 44], [150, 116, 70]], stump: [[94, 66, 40]] };
  window.__in = (cols, ramp) => cols.filter(c => __RAMP[ramp].some(q => q[0] === c[0] && q[1] === c[1] && q[2] === c[2])).length;
  window.__tab = (st, tab) => { WL.tp(st); UI.openStation(st); UI.gotoTab(tab); return document.getElementById('stationBody').textContent.replace(/\s+/g, ' '); };
  window.__close = () => { const c = document.getElementById('stationClose'); if (c && !document.getElementById('stationOv').classList.contains('hidden')) c.click(); };
  window.__hand = (name, at) => { const n = NPC.gen({ at, cls: 'courier' }); n.name = name; n.feeWaived = true; S.npcs.push(n); return n.id; };
  window.__npc = id => S.npcs.find(n => n.id === id);
  window.__run = (secs, step = 0.1, until) => { let t = 0; for (; t < secs; t += step) { NPC.update(step); if (until && until()) break; } return +t.toFixed(2); };
  window.__polyDist = (pts, x, y) => { let b = 1e9; for (let i = 0; i + 1 < pts.length; i++) b = Math.min(b, U.segDist(x, y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return b; };
  /* every wear cell within r of a polyline, by its centre */
  window.__cellsAlong = (pts, r) => { const m = new Map(); for (let i = 0; i + 1 < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], k = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 5)); for (let j = 0; j <= k; j++) { const x = x1 + (x2 - x1) * j / k, y = y1 + (y2 - y1) * j / k; for (let dy = -r; dy <= r; dy += 5) for (let dx = -r; dx <= r; dx += 5) { if (dx * dx + dy * dy > r * r) continue; const cx = ((x + dx) / 10) | 0, cy = ((y + dy) / 10) | 0; m.set(cx + ',' + cy, [cx * 10 + 5, cy * 10 + 5]); } } } return [...m.values()]; };
  /* a camera pinned on a world point, close, the day high, the effects off: the same frame, taken again */
  window.__view = async (x, y, walker) => { if (walker) WL.tp(walker); S.weather.state = 'clear'; S.speed = 0; __clearAmb(x, y, 500); Render.clearFx(); Render.setFx(false); Render.setZoom(3); WL.timeScale = 0.0001; Render.cam.x = Math.round(x) + 0.25; Render.cam.y = Math.round(y) + 0.25; await __wait(150); await __frames(3); };
  window.__shot = async (x, y, rad) => { Render.cam.x = Math.round(x) + 0.25; Render.cam.y = Math.round(y) + 0.25; await __frames(3); return __grab(x, y, rad); };
  window.__diffT = (a, b2, thr) => { let n = 0; for (let i = 0; i < Math.min(a.length, b2.length); i += 4) if (Math.abs(a[i] - b2[i]) + Math.abs(a[i + 1] - b2[i + 1]) + Math.abs(a[i + 2] - b2[i + 2]) > thr) n++; return n; };
  window.__rail = () => { UI.updatePrompts(Systems.getInteractions()); return document.getElementById('prompts').textContent.replace(/\s+/g, ' '); };
});

/* ================= 1 · THE DELIVERY LINE ================= */
let r = await ev(async () => {
  const pts = __line('haven', 'elm'), W = pts.filter(([x, y]) => __wearable(x, y)), P = W[Math.floor(W.length / 2)];
  const w0 = W.map(([x, y]) => World.wearAt(x, y));
  await __view(P[0], P[1]); const g0 = await __shot(P[0], P[1], 24); const c0 = __cell(P[0], P[1]);
  const o = Economy.ordersFor('haven').find(q => q.to === 'elm' && !q.prio && q.item !== 'letters');
  Systems.acceptOrder(o, false);
  const d0 = S.stats.delivered;
  WL.tp('elm');   // the Walker never set foot on the line
  const res = Systems.handleDelivery('elm');
  const w1 = W.map(([x, y]) => World.wearAt(x, y));
  for (let k = 0; k < 11; k++) Systems.stampTraffic('haven', 'elm');   // the traffic of twelve runs
  World.flushWear(1);
  const w12 = W.map(([x, y]) => World.wearAt(x, y)), c12 = __cell(P[0], P[1]);
  for (let k = 0; k < 20; k++) Systems.stampTraffic('haven', 'elm');   // and of thirty-two
  World.flushWear(1);
  const w32 = W.map(([x, y]) => World.wearAt(x, y)), c32 = __cell(P[0], P[1]);
  const g1 = await __shot(P[0], P[1], 24);
  /* the stages hold: time passes and the grass does not come back */
  World.flushWear(5);
  const held = W.every(([x, y], i) => World.wearAt(x, y) === w32[i]);
  const nb = [P[0] + 10, P[1]];   // the tread spreads to the neighbour cells
  window.__P = P; window.__elmLine = W;
  return { n: W.length, item: o.item, delivered: S.stats.delivered - d0, results: res.results.length, active: S.orders.active.length,
    first: [Math.min(...w1.map((v, i) => v - w0[i])), Math.max(...w1.map((v, i) => v - w0[i]))], traffic: S.traffic['elm:haven'],
    at12: [Math.min(...w12), Math.max(...w12)], at32: [Math.min(...w32), Math.max(...w32)], held, spread: World.wearAt(nb[0], nb[1]),
    grass0: __in(c0, 'tr') + __in(c0, 'ba'), trampled12: __in(c12, 'tr'), bare32: __in(c32, 'ba'), screen: __diffT(g0, g1, 40), W: World.W_TRAMPLE + '/' + World.W_BARE };
});
ok('THE DELIVERY LINE WEARS IN: one delivery Haven → Elm Farm, completed with the Walker set down at the gate (never a step on the road), presses every wearable cell of the valley\'s own walked line between the towns by exactly the traffic\'s tread (2); twelve runs\' traffic tramples it (24 — the yellowed grass painted in), thirty-two wear it BARE (64 — packed earth in the paint and on the screen against the same frame before), the tread spreads to the cells beside it, and the stages stay put',
  r.delivered === 1 && r.results === 1 && r.active === 0 && r.first[0] === 2 && r.first[1] === 2 && r.traffic === 32 && r.at12[0] >= 24 && r.at12[1] < 64 && r.at32[0] >= 64 && r.held && r.spread >= 32
  && r.grass0 === 0 && r.trampled12 >= 1 && r.bare32 >= 2 && r.screen > 20, JSON.stringify(r));

/* ================= 2 · THE CHARTER LINE ================= */
const rook = await ev(() => { const id = __hand('Rook Runner', 'haven'); __tab('haven', 'way'); return { id, slots: NPC.routeSlots(), cov: +S.cov.toFixed(3) }; });
await page.click(`[data-hirer="${rook.id}"]`);
await page.click(`[data-route="${rook.id}:mill"]`);
r = await ev(id => {
  __close();
  const n = __npc(id), pts = __line('haven', 'mill'), W = pts.filter(([x, y]) => __wearable(x, y));
  const w0 = W.map(([x, y]) => World.wearAt(x, y)), tr0 = (S.traffic || {})['haven:mill'] || 0;
  const t = __run(200, 0.25, () => n.route && n.route.runs >= 1);
  const d = W.map(([x, y], i) => World.wearAt(x, y) - w0[i]);
  return { state: n.state, route: n.route && [n.route.a, n.route.b], runs: n.route && n.route.runs, t, n: W.length, dmin: Math.min(...d), dmax: Math.max(...d), traffic: S.traffic['haven:mill'] - tr0 };
}, rook.id);
ok('THE CHARTER LINE WEARS IN: a runner chartered Haven ⇄ Mill from the terminal\'s Hire tab (real clicks) makes the run on the charter\'s own clock, and that run is FEET — every wearable cell of the valley\'s walked line between Haven and the Mill takes the same tread a delivery leaves, with nobody walking it but the runner',
  rook.slots >= 1 && r.state === 'route' && r.route[0] === 'haven' && r.route[1] === 'mill' && r.runs === 1 && r.dmin === 2 && r.dmax === 2 && r.traffic === 1 && r.n >= 20, JSON.stringify({ rook, r }));
await ev(() => __tab('haven', 'way'));
await page.click(`[data-unroute="${rook.id}"]`);
await ev(() => __close());

/* ================= 3 · GREEN GRASS REFUSES ================= */
r = await ev(async () => {
  const H = DATA.stations.haven;
  /* untrodden meadow near Haven: nothing within the paving reach has ever been walked */
  let spot = null;
  for (let a = 0; a < 64 && !spot; a++) for (const d of [320, 420, 520]) {
    const x = Math.round(H.x + Math.cos(a / 64 * 6.283) * d), y = Math.round(H.y + Math.sin(a / 64 * 6.283) * d);
    if (World.classAt(x, y) !== World.MEADOW) continue;
    let clean = true; for (let dy = -80; dy <= 80 && clean; dy += 10) for (let dx = -80; dx <= 80 && clean; dx += 10) if (World.wearAt(x + dx, y + dy) || World.paveAt(x + dx, y + dy)) clean = false;
    if (clean) { spot = [x, y]; break; }
  }
  WL.tp(spot); S.px = spot[0]; S.py = spot[1];
  window.__green = spot;
  const P = __P, tram = [P[0] + 10, P[1]];   // the trampled cell beside a bare one on the Elm line
  return { spot, rail: __rail(), metal: S.banked.metal, tram, tramWear: World.wearAt(tram[0], tram[1]) };
});
await page.keyboard.press('KeyP'); await page.waitForTimeout(120);
const g2 = await ev(() => ({ pave: World.paveAt(__green[0], __green[1]), metal: S.banked.metal }));
const tram = await ev(async t => { WL.tp(t); S.px = t[0]; S.py = t[1]; return { rail: __rail(), metal: S.banked.metal, underfoot: World.wearAt(t[0], t[1]) }; }, r.tram);
await page.keyboard.press('KeyP'); await page.waitForTimeout(120);
const g3 = await ev(async t => { const m0 = S.banked.metal, t0 = __toasts.length; const said = Systems.layPaveHere(); await __wait(60); return { pave: World.paveAt(t[0], t[1]), paveP: World.paveAt(__P[0], __P[1]), metal: S.banked.metal, said, spent: m0 - S.banked.metal, why: __toasts.slice(t0).join(' | ') }; }, r.tram);
ok('GREEN GRASS REFUSES PLATES: on meadow no foot ever wore the rail offers no P and a real P lays nothing and spends nothing; on grass only trampled (the cell beside a bare one, 32 of 64) the same — the ground UNDERFOOT must be bare — and the paving law itself says why: "Paving wants a BARE trail underfoot — walk a line until the grass gives up"',
  r.spot && !/Lay /.test(r.rail) && g2.pave === 0 && g2.metal === r.metal && tram.underfoot >= 24 && tram.underfoot < 64 && !/Lay /.test(tram.rail) && g3.pave === 0 && g3.paveP === 0 && g3.metal === r.metal && g3.said === false && g3.spent === 0
  && /Paving wants a BARE trail underfoot — walk a line until the grass gives up/.test(g3.why), JSON.stringify({ r, g2, tram, g3 }));

/* ================= 4 · THE BARE TRAIL TAKES THEM ================= */
r = await ev(async () => {
  const W = __elmLine, i = Math.floor(W.length / 3), Q = W[i], Q2 = W[i + 1];
  window.__Q = Q; window.__Q2 = Q2;
  await __view(Q2[0], Q2[1], Q); S.px = Q[0]; S.py = Q[1];
  const g0 = await __shot(Q2[0], Q2[1], 20);
  return { Q, Q2, wear: [World.wearAt(Q[0], Q[1]), World.wearAt(Q2[0], Q2[1])], rail: __rail(), metal: S.banked.metal, paved: S.stats.paved || 0, g0: Array.from(g0) };
});
const tk0 = await ev(() => __toasts.length);
await page.keyboard.press('KeyP'); await page.waitForTimeout(150);
let r2 = await ev(async a => {
  const g1 = await __shot(__Q2[0], __Q2[1], 20);
  return { pave: [World.paveAt(__Q[0], __Q[1]), World.paveAt(__Q2[0], __Q2[1])], metal: S.banked.metal, paved: S.stats.paved, cQ: __in(__cell(__Q[0], __Q[1]), 'p1'), cQ2: __in(__cell(__Q2[0], __Q2[1]), 'p1'),
    screen: __diffT(a.g0, g1, 40), toast: __toasts.slice(a.tk0).join(' | '), rail: __rail() };
}, { g0: r.g0, tk0 });
delete r.g0;
ok('A BARE TRAIL TAKES THEM: standing on the Elm line where the traffic wore it bare, the rail offers "P Lay scrap plates on the trail — 3 metal"; a real P lays the riveted steel over the bare ground within reach — this cell and the next bare one on the line — for exactly 3 metal, in its own seamed paint (every texel of the cell from the steel ramp) and on the screen against the same frame before',
  r.wear[0] >= 64 && r.wear[1] >= 64 && /P Lay scrap plates on the trail — 3 metal/.test(r.rail) && r2.pave[0] === 1 && r2.pave[1] === 1 && r2.metal === r.metal - 3 && r2.paved === r.paved + 1
  && r2.cQ === 4 && r2.cQ2 === 4 && r2.screen > 20 && /You lay scrap plates along the trail — the way firms underfoot/.test(r2.toast) && /Lay cobbles on the trail — 3 ceramic/.test(r2.rail), JSON.stringify({ r, r2 }));

/* ================= 5 · THE TIERS ONLY CLIMB ================= */
r = await ev(() => ({ ceramic: S.banked.ceramic, wood: S.banked.wood, metal: S.banked.metal }));
await page.keyboard.press('KeyP'); await page.waitForTimeout(120);
const t2 = await ev(() => ({ pave: World.paveAt(__Q[0], __Q[1]), ceramic: S.banked.ceramic, paint: __in(__cell(__Q[0], __Q[1]), 'p2'), rail: __rail() }));
await page.keyboard.press('KeyP'); await page.waitForTimeout(120);
const t3 = await ev(() => ({ pave: World.paveAt(__Q[0], __Q[1]), wood: S.banked.wood, paint: __in(__cell(__Q[0], __Q[1]), 'p3'), rail: __rail() }));
await page.keyboard.press('KeyP'); await page.waitForTimeout(120);
r2 = await ev(() => {
  const Q = __Q, w0 = World.wearAt(Q[0], Q[1]);
  const lower = [World.layPave(Q[0], Q[1], 80, 1), World.layPave(Q[0], Q[1], 80, 2), World.layPave(Q[0], Q[1], 80, 3)];
  const worn = World.addWear(Q[0], Q[1], 90); World.addWear(Q[0] + 10, Q[1], 90); World.flushWear(1);
  return { pave: World.paveAt(Q[0], Q[1]), bank: { ceramic: S.banked.ceramic, wood: S.banked.wood, metal: S.banked.metal }, lower, worn, wear: World.wearAt(Q[0], Q[1]) - w0, paint: __in(__cell(Q[0], Q[1]), 'p3') };
});
ok('THE TIERS ONLY CLIMB: P again lays cobbles for 3 ceramic (the bright-set stones in the paint), P again a wood way for 3 timber (the warm plank rows); at the top the rail offers no P and a real P spends nothing; no lesser or equal tier lays over it, feet can no longer wear it, and laid ground never repaints as dirt',
  t2.pave === 2 && t2.ceramic === r.ceramic - 3 && t2.paint === 4 && /Lay a wood way on the trail — 3 wood/.test(t2.rail) && t3.pave === 3 && t3.wood === r.wood - 3 && t3.paint === 4 && !/Lay /.test(t3.rail)
  && r2.pave === 3 && r2.bank.ceramic === t2.ceramic && r2.bank.wood === t3.wood && r2.bank.metal === r.metal && r2.lower.every(v => v === 0) && r2.worn === 0 && r2.wear === 0 && r2.paint === 4, JSON.stringify({ r, t2, t3, r2 }));

/* ================= 6 · THE WAY WALKS FASTER ================= */
await ev(() => {
  /* a held key, frame by frame: the Walker's own speed off the game clock, on the stretch it is set down at */
  window.__paceGo = (x0, y0) => { WL.tp([x0, y0]); S.px = x0; S.py = y0; S.dir = 0; S.stam = S.stamMax; S.speed = 0; S.moveTo = null; S.route = []; S.weather.state = 'clear';
    window.__rec = []; window.__recOn = true; const f = () => { if (!__recOn) return; __rec.push([S.px, S.py, S.time]); requestAnimationFrame(f); }; requestAnimationFrame(f); WL.timeScale = 0.5; };
  window.__paceEnd = (x0, len) => { __recOn = false; WL.timeScale = 0.0001; const v = []; for (let i = 1; i < __rec.length; i++) { const [xa, ya, ta] = __rec[i - 1], [xb, yb, tb] = __rec[i]; if (tb - ta > 1e-4 && xa >= x0 + 2 && xb <= x0 + len && Math.abs(yb - ya) < 1e-6 && xb > xa) v.push((xb - xa) / (tb - ta)); } v.sort((a, b) => a - b); return { n: v.length, v: v.length ? +v[v.length >> 1].toFixed(3) : 0, spread: v.length ? +(v[v.length - 1] - v[0]).toFixed(3) : 0 }; };
  window.__noWraith = true; const f = () => { if (window.__noWraith) { S.wraiths.length = 0; requestAnimationFrame(f); } }; requestAnimationFrame(f);
});
const pace = async (x0, y0, len) => {
  await ev(([x, y]) => __paceGo(x, y), [x0, y0]);
  await page.keyboard.down('KeyD');
  for (let i = 0; i < 60; i++) { await page.waitForTimeout(60); if (await ev(([x, l]) => S.px > x + l + 4, [x0, len])) break; }
  await page.keyboard.up('KeyD');
  return ev(([x, l]) => __paceEnd(x, l), [x0, len]);
};
/* a flat run of meadow beside Elm Farm (no slope over 0.06 anywhere on it), and a run of marsh that falls away eastward */
const M = await ev(() => {
  const x0 = 2380, y0 = 9180, cells = []; for (let x = x0 - 20; x <= x0 + 110; x += 10) for (const dy of [-10, 0, 10]) cells.push([x, y0 + dy]);
  let flat = true, clean = true; for (let d = 0; d <= 84; d += 3) { const t = World.terrainAt(x0 + d, y0); if (t.cls !== World.MEADOW || t.slope > 0.06) flat = false; }
  for (const [x, y] of cells) if (World.wearAt(x, y) || World.paveAt(x, y)) clean = false;
  window.__mcells = cells;
  const mx = 5520, my = 7400, mcells = []; for (let x = mx - 20; x <= mx + 110; x += 10) for (const dy of [-10, 0, 10]) mcells.push([x, my + dy]);
  let marsh = true, notUp = true; for (let d = 0; d <= 84; d += 3) { const t = World.terrainAt(mx + d, my); if (t.cls !== World.MARSH) marsh = false; if (t.slope > 0.06 && t.sx > 0) notUp = false; }
  window.__marsh = mcells;
  return { x0, y0, flat, clean, mx, my, marsh, notUp };
});
const sp = {};
sp.grass = await pace(M.x0, M.y0, 80);
await ev(() => { for (const [x, y] of __mcells) World.addWear(x, y, 70); World.flushWear(1); });
sp.bare = await pace(M.x0, M.y0, 80);
for (const tier of [1, 2, 3]) {
  await ev(t => { for (const [x, y] of __mcells) World.layPave(x, y, 8, t); }, tier);
  sp['t' + tier] = await pace(M.x0, M.y0, 80);
}
sp.marsh = await pace(M.mx, M.my, 80);
await ev(() => { for (const [x, y] of __marsh) World.addWear(x, y, 70); for (const [x, y] of __marsh) World.layPave(x, y, 8, 3); World.flushWear(1); });
sp.board = await pace(M.mx, M.my, 80);
await ev(() => { window.__noWraith = false; });
{
  const g = sp.grass.v, k = x => +(x / g).toFixed(3);
  const ratios = { bare: k(sp.bare.v), plates: k(sp.t1.v), cobbles: k(sp.t2.v), wood: k(sp.t3.v), board: k(sp.board.v), marsh: k(sp.marsh.v) };
  const near = (a, b) => Math.abs(a - b) <= 0.006;
  ok('THE WAY WALKS FASTER: a held D across the same flat meadow beside Elm Farm, measured off the game clock frame by frame — green grass, bare earth ×1.07, scrap plates ×1.12, cobbles ×1.18, a wood way ×1.24 — and the boardwalk law: a wood way laid over marsh walks flat at the wood way\'s own pace, where the raw marsh drags at ×0.62',
    M.flat && M.clean && M.marsh && M.notUp && Object.entries(sp).every(([k, s]) => s.n >= 5 && (k === 'marsh' || s.spread < 0.5)) && near(ratios.bare, 1.07) && near(ratios.plates, 1.12) && near(ratios.cobbles, 1.18) && near(ratios.wood, 1.24)
    && near(ratios.board, 1.24) && ratios.marsh < 0.8, JSON.stringify({ M, sp, ratios }));
}

/* ================= 7 · THE PRESSER ================= */
const ids = await ev(() => ({ pell: __hand('Pell Marker', 'haven'), mags: __hand('Mags Cobble', 'haven'), tor: __hand('Tor Axe', 'haven'), quill: __hand('Quill Fourth', 'haven'), hob: __hand('Hob Carter', 'mill'), wren: __hand('Wren Sweep', 'haven') }));
await ev(() => __tab('haven', 'post'));
await page.click(`[data-fieldjob="${ids.pell}:presser"]`);
await page.click(`[data-fieldset="${ids.pell}:presser:mill"]`);
r = await ev(async id => {
  const tab = document.getElementById('stationBody').textContent.replace(/\s+/g, ' '); __close();
  const n = __npc(id); NPC.update(0.01);
  const pts = n.fpath.pts, line = __line('haven', 'mill'), H0 = DATA.stations.haven, same = pts.length === line.length && pts[0][0] === H0.x && pts[0][1] === H0.y && pts.slice(1).every((p, i) => p[0] === line[i + 1][0] && p[1] === line[i + 1][1]);
  const cells = __cellsAlong(pts, 0).filter(([x, y]) => __wearable(x, y));
  const w0 = cells.map(([x, y]) => World.wearAt(x, y));
  let off = 0, far = 0, steps = 0; const H = DATA.stations.haven;
  for (let t = 0; t < 300; t++) { __run(1, 0.1); if (t >= 3) off = Math.max(off, __polyDist(pts, n.fx, n.fy)); far = Math.max(far, U.dist(n.fx, n.fy, H.x, H.y)); steps++; }
  World.flushWear(1);
  const w1 = cells.map(([x, y]) => World.wearAt(x, y)), gained = w1.filter((v, i) => v > w0[i]).length;
  const tram = cells.filter(([x, y]) => __in(__cell(x, y), 'tr') + __in(__cell(x, y), 'ba') > 0).length;
  /* drawn where it works, its job on a label: the frame with the presser, against the same frame with them off the land */
  const fx = n.fx, fy = n.fy;
  await __view(fx, fy, [fx + 160, fy + 60]);
  const lab = __labels().filter(l => /PATH PRESSER/.test(l));
  const a = await __shot(fx, fy, 30); n.state = 'pool'; const b2 = await __shot(fx, fy, 30); n.state = 'field';
  return { toldTab: /The field crew — 1 \/ 3 out working/.test(tab), state: n.state, job: n.job, route: [n.route.a, n.route.b], same, off: +off.toFixed(2), far: Math.round(far), cells: cells.length, gained, meanGain: +(w1.reduce((s, v, i) => s + v - w0[i], 0) / cells.length).toFixed(1), tram, lab, drawn: __diffT(a, b2, 60), toast: __toasts.some(t => /Pell Marker takes the field as a Path presser — Haven to /.test(t)) };
}, ids.pell);
ok('THE PRESSER WALKS AND WEARS (v3.49: the plain names — the crew goes out from the Mail tab): sent out from Haven\'s Mail tab (real clicks — Path presser, → the Mill) the presser walks the valley\'s own line to the Mill and back, never more than a stride off it, and the ground agrees under their feet — nearly every wearable cell of the line pressed, the yellowed trail showing in the paint — drawn where they work with PATH PRESSER on a label',
  r.toldTab && r.state === 'field' && r.job === 'presser' && r.route[0] === 'haven' && r.route[1] === 'mill' && r.same && r.off < 12 && r.far > 1500 && r.gained >= r.cells * 0.9 && r.meanGain >= 12 && r.tram >= r.cells * 0.3
  && r.lab.some(l => /^PATH PRESSER — Pell/.test(l)) && r.drawn > 30 && r.toast, JSON.stringify(r));

/* ================= 8 · THE MASON ================= */
await ev(() => __tab('haven', 'post'));
await page.click(`[data-fieldjob="${ids.mags}:mason"]`);
await page.click(`[data-fieldset="${ids.mags}:mason:elm"]`);
r = await ev(async id => {
  __close();
  const n = __npc(id); S.banked.ceramic = 5;
  NPC.update(0.01);
  const cells = __cellsAlong(n.fpath.pts, 40);
  const cob = () => cells.filter(([x, y]) => World.paveAt(x, y) === 2).length;
  /* every stretch the mason lays, counted where the cobble goes down: each lay of the cobble tier that set at least one cell */
  const lay0 = World.layPave, stretches = []; let phase = 1;
  World.layPave = function (...a) { const k = lay0.apply(this, a); if (a[3] === 2 && k > 0) stretches.push({ phase, cells: k }); return k; };
  let c0, t0, t, c1, stall, pos0, c1b, t2, c2;
  try {
    c0 = cob(); t0 = __toasts.length;
    t = __run(240, 0.1, () => S.banked.ceramic <= 0 && n.fstall);
    await __wait(60);
    c1 = cob(); stall = { ceramic: S.banked.ceramic, fstall: !!n.fstall, toast: __toasts.slice(t0).some(x => /Mags Cobble is out of ceramic for cobbles — bank slabs and the laying resumes/.test(x)) };
    phase = 2; pos0 = [n.fx, n.fy]; __run(20, 0.1); c1b = cob();
    phase = 3; S.banked.ceramic = 3; t2 = __run(240, 0.1, () => S.banked.ceramic <= 0 && n.fstall);
    c2 = cob();
  } finally { World.layPave = lay0; }
  const per = p => stretches.filter(s => s.phase === p).length;
  const one = cells.find(([x, y]) => World.paveAt(x, y) === 2);
  const paint = one ? __in(__cell(one[0], one[1]), 'p2') : 0;
  await __view(n.fx, n.fy, [n.fx + 150, n.fy + 60]);
  const lab = __labels().filter(l => /MASON/.test(l));
  return { c0, c1, c1b, c2, t, t2, stall, laid: n.flaid, stretches: [per(1), per(2), per(3)], cells: stretches.map(s => s.cells), paint, lab, still: U.dist(pos0[0], pos0[1], n.fx, n.fy) > 0, left: S.banked.ceramic };
}, ids.mags);
ok('THE MASON COBBLES AND DRAINS THE CERAMIC: sent out Haven → Elm Farm (real clicks), the mason lays cobble on the bare line a stretch at a time, a slab from the bank per stretch — five slabs, five stretches (each stretch counted where its cobble went down), the bank to zero — then says so ("out of ceramic for cobbles — bank slabs and the laying resumes") and lays no more; three slabs banked, the laying resumes and drains them too, three stretches for three slabs; the cobbles in their own paint, the mason labelled where they work',
  r.c0 === 0 && r.c1 > r.c0 && r.stall.ceramic === 0 && r.stall.fstall && r.stall.toast && r.c1b === r.c1 && r.c2 > r.c1 && r.left === 0 && r.laid === r.c2 && r.paint === 4 && r.lab.some(l => /^MASON — Mags/.test(l))
  && r.stretches[0] === 5 && r.stretches[1] === 0 && r.stretches[2] === 3 && r.cells.reduce((a, v) => a + v, 0) === r.laid, JSON.stringify(r));

/* ================= 9 · THE FORRESTER ================= */
const tree = await ev(async () => {
  const H = DATA.stations.haven, tg = World.nearestForest(H.x, H.y, DATA.T.fellRadius);
  await __view(tg.x, tg.y, [tg.x + 150, tg.y + 60]);
  const g0 = await __shot(tg.x, tg.y, 12);
  window.__tree = tg; window.__treeG0 = g0;
  return { x: tg.x, y: tg.y, cls: World.classAt(tg.x, tg.y), FOREST: World.FOREST, MEADOW: World.MEADOW, texel: __texel(tg.x, tg.y), dist: Math.round(U.dist(H.x, H.y, tg.x, tg.y)) };
});
await ev(() => __tab('haven', 'post'));
await page.click(`[data-fieldjob="${ids.tor}:forrester"]`);
r = await ev(async id => {
  __close();
  const n = __npc(id), wood0 = S.banked.wood, fell0 = World.packFell().length, t0 = __toasts.length;
  const t = __run(60, 0.1, () => (n.svc && n.svc.felled || 0) >= 3);
  const tg = __tree;
  const g1 = await __shot(tg.x, tg.y, 12);
  const chips = [...document.querySelectorAll('#earnFeed .earnChip.mat')].map(c => c.textContent);
  await __view(n.fx, n.fy, [n.fx + 150, n.fy + 60]);
  const lab = __labels().filter(l => /FORRESTER/.test(l));
  return { state: n.state, job: n.job, t, felled: n.svc && n.svc.felled, wood: S.banked.wood - wood0, fells: World.packFell().length - fell0, cls: World.classAt(tg.x, tg.y), walkable: !World.terrainAt(tg.x, tg.y).blocked,
    texel: __texel(tg.x, tg.y), screen: __diffT(__treeG0, g1, 30), chips, lab, toast: __toasts.slice(t0).some(x => /Tor Axe takes the field as a Forrester around Haven/.test(x)) || __toasts.some(x => /Tor Axe takes the field as a Forrester/.test(x)) };
}, ids.tor);
ok('THE FORRESTER TURNS FOREST TO MEADOW: sent out at Haven (a real click — the axe needs no far end), the forrester walks to the nearest standing wood, works it and FELLS it — the forest cell becomes meadow in the class grid itself, a stump texel painted where the tree stood (and on the screen against the same frame before) — two planks of timber banked a tree, each landing as a seen chip, the axe-hand labelled where they work',
  r.state === 'field' && r.job === 'forrester' && tree.cls === tree.FOREST && r.felled === 3 && r.fells === 3 && r.wood === 6 && r.cls === tree.MEADOW && r.walkable && JSON.stringify(r.texel) === JSON.stringify([94, 66, 40]) && r.screen > 0
  && r.chips.some(c => /wood/i.test(c)) && r.lab.some(l => /^FORRESTER — Tor/.test(l)) && r.toast, JSON.stringify({ tree, r }));

/* ================= 10 · THE HAULER ================= */
await ev(() => __tab('mill', 'post'));
await page.click(`[data-fieldjob="${ids.hob}:hauler"]`);
await page.click(`[data-fieldset="${ids.hob}:hauler:haven"]`);
r = await ev(async id => {
  __close();
  const n = __npc(id), hv = S.stations.haven.stock;
  hv.food = 50; hv.meds = 12; hv.lumenCell = 60;   // Haven's shelves: medicine is the worst
  const s0 = { ...hv }, a0 = S.stations.haven.appr || 0, pick = NPC.freightFor(n, 'haven', 'mill')[0];
  NPC.update(0.01); const pts = n.fpath.pts;
  let off = 0, on = false; const steps = [];
  const t = __run(160, 0.1, () => { const dd = __polyDist(pts, n.fx, n.fy); if (on) off = Math.max(off, dd); else if (dd < 12) on = true; return (n.fruns || 0) >= 1; });
  for (let k = 0; k < 10; k++) { const x = n.fx, y = n.fy; NPC.update(0.1); steps.push(U.dist(x, y, n.fx, n.fy) / 0.1); }
  steps.sort((a, b) => a - b);
  const s1 = { ...hv };
  await __view(n.fx, n.fy, [n.fx + 150, n.fy + 60]);
  const lab = __labels().filter(l => /HAULER|CARAVAN/.test(l));
  return { t, runs: n.fruns, pick, s0, s1, appr: (S.stations.haven.appr || 0) - a0, off: +off.toFixed(1), pace: +steps[5].toFixed(2), expect: +(NPC.speedOf(n) * 0.6 * (NPC.moodFx(n).workMul || 1)).toFixed(2), lab, tab: null };
}, ids.hob);
ok('THE HAULER STOCKS THE FAR SHELF: sent out from the Mill\'s Mail tab to Haven (real clicks), the hauler walks the freight on foot along the valley\'s line at a hauler\'s steady pace and walks it onto the far end\'s WORST shelf — Haven\'s medicine, 12 → 24, exactly the twelve a back carries, every other shelf untouched — and Haven\'s regard rises for it; a hauler on the land under their label',
  r.runs === 1 && r.pick === 'meds' && r.s1.meds === r.s0.meds + 12 && r.s1.food === r.s0.food && r.s1.lumenCell === r.s0.lumenCell && r.appr === 2 && r.off < 12 && Math.abs(r.pace - r.expect) < 0.05 && r.lab.some(l => /^HAULER — Hob/.test(l)), JSON.stringify(r));

/* ================= 11 · THE DONKEY CARAVAN ================= */
r = await ev(async id => {
  const n = __npc(id);
  n.skills.haul = 4; n.trainXp = n.trainXp || {}; n.trainXp.haul = NPC.npcTrainNeed(4) - 1;
  /* the frame before: a hauler on foot, stood on the line */
  const x = n.fx, y = n.fy;
  await __view(x, y, [x + 150, y + 60]); const a = await __shot(x, y, 40); const labA = __labels().filter(l => /HAULER|CARAVAN/.test(l));
  const prov0 = S.banked.provisions, t0 = __toasts.length; n.shiftT = 0.05; for (const q of NPC.fieldAll()) if (q !== n) q.shiftT = Math.max(q.shiftT, 5); NPC.update(0.1); n.fx = x; n.fy = y;   // the shift is paid, the back grows (held in place for the eye)
  const prov = prov0 - S.banked.provisions;
  await __wait(60);
  const lv = n.skills.haul, grew = __toasts.slice(t0).some(s => /Hob Carter grew into the hauler's work — Hauling 5/.test(s));
  const b2 = await __shot(x, y, 40); const labB = __labels().filter(l => /HAULER|CARAVAN/.test(l));
  const tab = __tab('mill', 'post'); __close();
  /* the next arrival lands thirty */
  const hv = S.stations.haven.stock, ml = S.stations.mill.stock;
  hv.food = 50; hv.meds = 10; hv.lumenCell = 60; ml.food = 50; ml.textiles = 10; ml.meds = 60;
  const h0 = { ...hv }, m0 = { ...ml }, r0 = n.fruns;
  const steps = []; for (let k = 0; k < 10; k++) { const x2 = n.fx, y2 = n.fy; NPC.update(0.1); steps.push(U.dist(x2, y2, n.fx, n.fy) / 0.1); } steps.sort((p, q) => p - q);
  const t = __run(200, 0.1, () => n.fruns > r0);
  const dh = Object.keys(hv).reduce((s, k) => s + hv[k] - h0[k], 0), dm = Object.keys(ml).reduce((s, k) => s + ml[k] - m0[k], 0);
  return { lv, grew, prov, card: /Hob Carter — Donkey caravan/.test(tab), labA, labB, drawn: __diffT(a, b2, 60), t, arrived: n.fruns - r0, dh: +dh.toFixed(2), dm: +dm.toFixed(2), textiles: ml.textiles, pace: +steps[5].toFixed(2), expect: +(NPC.speedOf(n) * 0.5 * (NPC.moodFx(n).workMul || 1)).toFixed(2) };
}, ids.hob);
ok('THE CARAVAN IS EARNED AT HAULING 5: a paid shift grows the hauler\'s back to Hauling 5 ("grew into the hauler\'s work") and the hauler BECOMES the donkey caravan — the terminal card says Donkey caravan, the land draws the patient grey donkey where the figure walked (against the same frame before) under DONKEY CARAVAN, it walks at the donkey\'s slower pace, and its next arrival walks THIRTY crates onto the worst shelf',
  r.lv === 5 && r.grew && r.prov === 1 && r.card && r.labA.some(l => /^HAULER — Hob/.test(l)) && r.labB.some(l => /^DONKEY CARAVAN — Hob/.test(l)) && r.drawn > 200 && r.arrived === 1 && ((r.dm === 30 && r.textiles === 40) || r.dh === 30)
  && Math.abs(r.pace - r.expect) < 0.05, JSON.stringify(r));

/* ================= 12 · THE THREE-HAND CAP ================= */
let cap = await ev(() => { const tab = __tab('haven', 'post'); return { out: NPC.fieldStaff('haven').length, told: /The field crew — 3 \/ 3 out working/.test(tab) }; });
const tq = await ev(() => __toasts.length);
await page.click(`[data-fieldjob="${ids.quill}:hauler"]`);
await page.click(`[data-fieldset="${ids.quill}:hauler:elm"]`);
r = await ev(async a => { await __wait(60); const q = __npc(a.id); return { state: q.state, out: NPC.fieldStaff('haven').length, toast: __toasts.slice(a.tq).join(' | ') }; }, { id: ids.quill, tq });
ok('THE THREE-HAND CAP: with the presser, the mason and the forrester out of Haven the Mail tab reads 3 / 3 out working, and a fourth sent out (real clicks) is refused in the town\'s words — "Haven can feed three field hands, no more" — and stays by the fire',
  cap.out === 3 && cap.told && r.state === 'pool' && r.out === 3 && /Haven can feed three field hands, no more/.test(r.toast), JSON.stringify({ cap, r }));

/* ================= 13 · THE RECALL ================= */
const rc0 = await ev(() => __toasts.length);
await page.click(`[data-fieldrecall="${ids.pell}"]`);
r = await ev(async a => {
  await __wait(60);
  const n = __npc(a.id), tab = document.getElementById('stationBody').textContent.replace(/\s+/g, ' ');
  const f0 = [n.fx, n.fy];
  __run(10, 0.1);
  return { state: n.state, at: n.at, job: n.job, drawnList: NPC.fieldAll().some(q => q.id === n.id), told: /The field crew — 2 \/ 3 out working/.test(tab), toast: __toasts.slice(a.rc0).some(t => /Pell Marker comes in from the field/.test(t)), moved: U.dist(f0[0], f0[1], n.fx, n.fy) };
}, { id: ids.pell, rc0 });
await page.click(`[data-fieldjob="${ids.quill}:hauler"]`);
await page.click(`[data-fieldset="${ids.quill}:hauler:elm"]`);
r2 = await ev(id => { const q = __npc(id), tab = document.getElementById('stationBody').textContent.replace(/\s+/g, ' '); __close(); return { state: q.state, job: q.job, told: /The field crew — 3 \/ 3 out working/.test(tab) }; }, ids.quill);
ok('THE RECALL: "call them in" (a real click) brings the presser in from the field — back by Haven\'s fire, off the land and its work (no longer drawn out there, not a step more walked), the tab 2 / 3 — and the freed hand is a real one: the fourth goes out as a hauler at once, 3 / 3',
  r.state === 'pool' && r.at === 'haven' && r.job === null && !r.drawnList && r.told && r.toast && r.moved === 0 && r2.state === 'field' && r2.job === 'hauler' && r2.told, JSON.stringify({ r, r2 }));

/* ================= 14 · THE LOOTER ================= */
await ev(() => __tab('haven', 'way'));
await page.click(`[data-hirec="${ids.wren}"]`);
r = await ev(async id => {
  __close();
  const n = __npc(id), spot = __green;
  WL.tp(spot); S.px = spot[0]; S.py = spot[1]; S.dir = 0; S.speed = 0; n.cx = S.px - 42; n.cy = S.py;
  const O = NPC.ordersOf(n), stFx = MUSTER.STATION_FX[O.station].reachMul, mood = NPC.moodFx(n).reachMul || 1;
  const reach = lv => (lv >= 2 ? DATA.T.looterBase + (lv - 2) * DATA.T.looterPer : 0) * stFx * mood;
  const slot = () => [S.px - 42, S.py];
  const drop = d => { const it = State.makeItem('metal'); S.drops.push({ id: U.uid(), item: it, x: S.px, y: S.py - d }); return it.id; };
  const has = iid => S.drops.some(q => q.item.id === iid), carries = iid => n.carry.some(c => c.id === iid);
  const watch = (secs, iid) => { let dev = 0, t = 0; for (; t < secs; t += 0.05) { NPC.update(0.05); dev = Math.max(dev, U.dist(n.cx, n.cy, ...slot())); if (!has(iid)) break; } return { dev: +dev.toFixed(1), t: +t.toFixed(2) }; };
  __run(3, 0.05);
  const out = { allows: NPC.allows(n, 'loot', 'metal'), reach: [reach(1), reach(2), reach(3)], station: O.station };
  n.skills.haul = 1; const A = drop(Math.round(reach(2) - 25));
  out.lv1 = { ...watch(6, A), still: has(A) };
  const s0 = __says.length;
  n.skills.haul = 2; out.lv2 = { ...watch(10, A), taken: !has(A), carried: carries(A), got: __says.slice(s0).includes('Got it.') };
  __run(5, 0.05); out.back2 = +U.dist(n.cx, n.cy, ...slot()).toFixed(1);
  const B = drop(Math.round((reach(2) + reach(3)) / 2));
  out.far2 = { ...watch(6, B), still: has(B) };
  n.skills.haul = 3; out.lv3 = { ...watch(10, B), taken: !has(B), carried: carries(B) };
  __run(5, 0.05); out.back3 = +U.dist(n.cx, n.cy, ...slot()).toFixed(1);
  return out;
}, ids.wren);
ok('THE LOOTER HABIT IS EARNED: a companion at Hauling 1 leaves a crate in plain sight where it lies and keeps the wedge; trained to Hauling 2 the same back walks out, sweeps it up ("Got it."), stows it and falls back in line; a crate past that reach stays put until Hauling 3 — reach grows with every level (170, then +45)',
  r.allows && r.reach[0] === 0 && r.lv1.still && r.lv1.dev < 8 && r.lv2.taken && r.lv2.carried && r.lv2.got && r.lv2.dev > 100 && r.back2 < 8 && r.far2.still && r.far2.dev < 8 && r.lv3.taken && r.lv3.carried && r.back3 < 8, JSON.stringify(r));

/* ================= 15 · THE EARN FEED ================= */
r = await ev(async () => {
  const feed = document.getElementById('earnFeed'); feed.innerHTML = '';
  await __wait(3400);   // any chip still live has faded and gone
  feed.innerHTML = '';
  const icon = async el => { const im = el.querySelector('img'); const c = document.createElement('canvas'); c.width = 9; c.height = 9; const g = c.getContext('2d'); const I = new Image(); I.src = im.src; await I.decode(); g.drawImage(I, 0, 0); const d = g.getImageData(0, 0, 9, 9).data, s = new Set(); for (let i = 0; i < d.length; i += 4) if (d[i + 3]) s.add('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('')); return [...s]; };
  State.grantLikes(4);
  const trust = feed.querySelector('.earnChip.trust'), born = getComputedStyle(trust).animationName, seen0 = [];
  { const t1 = performance.now(); while (performance.now() - t1 < 520) { seen0.push(+trust.querySelector('.num').textContent.slice(1)); await __frames(1); } }
  const v1 = trust.querySelector('.num').textContent;
  const seen = []; State.grantLikes(6);
  const bump = trust.classList.contains('bump'), bumpAnim = getComputedStyle(trust).animationName;
  const t0 = performance.now(); while (performance.now() - t0 < 600) { seen.push(+trust.querySelector('.num').textContent.slice(1)); await __frames(1); }
  const trustIcon = await icon(trust), count = feed.querySelectorAll('.earnChip.trust').length;
  const fr = feed.getBoundingClientRect(), so = document.getElementById('social').getBoundingClientRect();
  await __wait(2400); const out1 = trust.classList.contains('out'); await __wait(700); const gone = !trust.isConnected;
  Economy.addAppr('elm', 3); Economy.addAppr('mill', 2); Economy.addAppr('elm', 1);
  State.bank('metal', 5); State.bank('metal', 2); State.bank('wood', 2);
  await __wait(700);
  const chips = [...feed.querySelectorAll('.earnChip')].map(c => ({ kind: c.className.replace('earnChip', '').replace(/bump|out/g, '').trim(), num: c.querySelector('.num').textContent, lbl: c.querySelector('.lbl') ? c.querySelector('.lbl').textContent : '' }));
  const appr = feed.querySelector('.earnChip.appr'), mat = feed.querySelector('.earnChip.mat');
  return { names: [DATA.stations.elm.name, DATA.stations.mill.name], seen0: [...new Set(seen0)], v1, born, bump, bumpAnim, seen: [...new Set(seen)], count, trustIcon, apprIcon: await icon(appr), matIcon: await icon(mat), feedRight: Math.round(fr.right), socialRight: Math.round(so.right), rowTop: Math.round(document.getElementById('papersRow').getBoundingClientRect().top), rowBottom: Math.round(document.getElementById('papersRow').getBoundingClientRect().bottom), feedTop: Math.round(fr.top), socialBottom: Math.round(so.bottom), out1, gone, chips, total: feed.children.length };
});
{
  const has = (arr, hex) => arr.includes(hex);
  const ch = (kind, lbl) => r.chips.find(c => c.kind === kind && c.lbl === lbl);
  ok('THE EARN FEED: every currency lands as a SEEN chip beside the trust readout — trust as the Order\'s cut-gold diamond, appreciation as the hearth-heart carrying the town\'s name (one chip per town), materials as the banded crate by material; each chip arrives animated and counts up to its sum; a second burst MERGES into the live chip and counts on (+4 → +10, the numbers rolling, the chip bumping), and after its beat the chip fades and goes',
    r.v1 === '+4' && r.seen0.some(v => v > 0 && v < 4) && /^earn(In|Bump)$/.test(r.born) && r.bump && r.bumpAnim === 'earnBump' && r.seen[r.seen.length - 1] === 10 && r.seen.some(v => v > 4 && v < 10) && r.count === 1
    && has(r.trustIcon, '#ffd98f') && has(r.trustIcon, '#ffb54f') && has(r.trustIcon, '#c98a30') && has(r.apprIcon, '#d9736b') && has(r.matIcon, '#9a8468') && has(r.matIcon, '#b3a06a')
    && Math.abs(r.feedRight - r.socialRight) <= 2 && r.feedTop >= r.rowBottom - 2 && r.feedTop - r.rowBottom < 60 && r.rowTop >= r.socialBottom && r.out1 && r.gone
    && ch('appr', r.names[0]) && ch('appr', r.names[0]).num === '+4' && ch('appr', r.names[1]) && ch('appr', r.names[1]).num === '+2' && ch('mat', 'metal') && ch('mat', 'metal').num === '+7' && ch('mat', 'wood') && ch('mat', 'wood').num === '+2' && r.total === 4,
    JSON.stringify(r));
}

/* ================= 16 · 17 · THE LAND RIDES THE SAVE ================= */
const keep = await ev(() => {
  const cob = __cellsAlong(__line('haven', 'elm'), 40).filter(([x, y]) => World.paveAt(x, y) === 2).slice(0, 12);
  const fells = World.packFell().slice(), CWc = Math.ceil(World.W / 6);
  const fellPts = fells.map(i => [(i % CWc) * 6 + 3, Math.floor(i / CWc) * 6 + 3]);
  window.__fellTex = i => { const g = World.tc.getContext('2d'), d = g.getImageData(Math.round((i % CWc) * 6 / World.TS), Math.round(Math.floor(i / CWc) * 6 / World.TS), 1, 1).data; return [d[0], d[1], d[2]]; };
  const out = { Q: __Q, Q2: __Q2, tiers: [World.paveAt(__Q[0], __Q[1]), World.paveAt(__Q2[0], __Q2[1])], cob, cobPaint: cob.map(([x, y]) => __in(__cell(x, y), 'p2')), meadow: __mcells.slice(0, 6).map(([x, y]) => [x, y, World.paveAt(x, y)]),
    bare: __elmLine.filter(([x, y]) => !World.paveAt(x, y)).slice(0, 8).map(([x, y]) => [x, y, World.wearAt(x, y)]), fells, fellPts, fellTex: fells.map(i => __fellTex(i)), wood: S.banked.wood, cls: fellPts.map(([x, y]) => World.classAt(x, y)) };
  State.save();
  return out;
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.waitForTimeout(300);
const cont = await ev(() => !document.getElementById('btnContinue').classList.contains('hidden'));
await page.click('#btnContinue'); await page.waitForTimeout(1500);
await T.skipCine();
await T.instruments();
await ev(() => { WL.timeScale = 0.0001; window.__cell = (x, y) => { const cx = (x / 10) | 0, cy = (y / 10) | 0, tx = Math.round(cx * 10 / World.TS), ty = Math.round(cy * 10 / World.TS); const d = World.tc.getContext('2d').getImageData(tx, ty, 2, 2).data; const o = []; for (let k = 0; k < 4; k++) o.push([d[k * 4], d[k * 4 + 1], d[k * 4 + 2]]); return o; };
  window.__texel = (x, y) => { const d = World.tc.getContext('2d').getImageData((x / World.TS) | 0, (y / World.TS) | 0, 1, 1).data; return [d[0], d[1], d[2]]; };
  window.__RAMP = { p2: [[152, 148, 136], [118, 114, 104], [176, 172, 156]], p3: [[128, 96, 58], [104, 76, 44], [150, 116, 70]] };
  window.__in = (cols, ramp) => cols.filter(c => __RAMP[ramp].some(q => q[0] === c[0] && q[1] === c[1] && q[2] === c[2])).length; });
r = await ev(k => ({
  playing: typeof S !== 'undefined' && !!S.pName && document.getElementById('titleScreen').classList.contains('hidden'),
  tiers: [World.paveAt(k.Q[0], k.Q[1]), World.paveAt(k.Q2[0], k.Q2[1])], qPaint: __in(__cell(k.Q[0], k.Q[1]), 'p3'),
  cob: k.cob.map(([x, y]) => World.paveAt(x, y)), cobPaint: k.cob.map(([x, y]) => __in(__cell(x, y), 'p2')), meadow: k.meadow.map(([x, y]) => World.paveAt(x, y)),
  bare: k.bare.map(([x, y]) => World.wearAt(x, y)),
}), keep);
ok('THE PAVING RIDES THE SAVE: through a real reload and the title\'s Continue (a real click), every laid tier is where it was — the wood way over the plates and cobbles on the Elm line, the mason\'s cobbles, the planking beside Elm Farm — painted in its own ramp again, and the bare line the traffic wore stays bare',
  cont && r.playing && JSON.stringify(r.tiers) === JSON.stringify(keep.tiers) && r.qPaint === 4 && keep.cob.length >= 3 && r.cob.every(v => v === 2) && r.cobPaint.every(v => v === 4) && keep.cobPaint.every(v => v === 4)
  && JSON.stringify(r.meadow) === JSON.stringify(keep.meadow.map(m => m[2])) && r.bare.every((v, i) => v === keep.bare[i][2]) && keep.bare.every(b => b[2] >= 64), JSON.stringify({ keep: { tiers: keep.tiers, cob: keep.cob.length, meadow: keep.meadow }, r }));
r = await ev(k => ({ cls: k.fellPts.map(([x, y]) => World.classAt(x, y)), tex: k.fells.map(i => { const CWc = Math.ceil(World.W / 6), d = World.tc.getContext('2d').getImageData(Math.round((i % CWc) * 6 / World.TS), Math.round(Math.floor(i / CWc) * 6 / World.TS), 1, 1).data; return [d[0], d[1], d[2]]; }), fells: World.packFell().length, kept: k.fells.every(i => World.packFell().includes(i)), fw: DATA.T.fellWood, wood: S.banked.wood, walk: k.fellPts.every(([x, y]) => !World.terrainAt(x, y).blocked) }), keep);   // the forrester works on after the Continue: a tree felled since is its own
ok('THE FELLING RIDES THE SAVE: the same reload keeps the forrester\'s clearing — every felled cell is still meadow in the class grid (walkable ground), its stump still painted where the tree stood, and the timber still in the bank (with a tree felled since the Continue, its own timber on top)',
  keep.fellPts.length >= 3 && r.kept && r.fells >= keep.fellPts.length && r.cls.every(c => c === 0) && keep.cls.every(c => c === 0) && r.tex.every((t, i) => JSON.stringify(t) === JSON.stringify(keep.fellTex[i])) && keep.fellTex.every(t => JSON.stringify(t) === '[94,66,40]') && r.wood === keep.wood + (r.fells - keep.fellPts.length) * r.fw && r.walk,
  JSON.stringify({ keep: { n: keep.fellPts.length, wood: keep.wood, tex: keep.fellTex.slice(0, 3) }, r }));

await ev(() => __done());
await T.finish('the working world');
