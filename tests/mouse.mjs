/* mouse.mjs — v3.0 ONE HAND FOR TRAVEL (v3.51 rebuild, mine: the v3.48 source was lost and its record names only its
   subjects, so each check is my reading of one, tested as the game has it now; its figures sampled on the courier's grid).
   The mouse-only run: after boot not one key reaches the page. A new Walker's first delivery by the mouse alone — Haven's
   terminal tapped (walk there and use it), the ★ order and the sheets answered by clicks, taps on the ground across Elm
   Creek's shallows, Elm Farm's terminal tapped to hand the crates over, the slip turned by a click. Then every M1 verb of the
   record, each staged between checks and each proven by a real press of the mouse: a route around a cliff (footing only);
   the refusal at the River Silt in its own words; a ladder laid by the mouse alone and the same tap walked over its rungs;
   Pass Camp skirted while loaded and walked straight through with nothing but tools on the back; walk there and use it —
   a ruin, a crate, a cairn, a paver, a pylon, an event; M1 held to steer; M1 and M2 held to sprint; M1 on the valley map
   to travel there; the honest stall (the ground ahead marked, the route re-planned three times, then "The ground stops you
   here"); and the ear on the page that heard no key. */
import { boot } from './lib/harness.mjs';

const T = await boot({ calm: false });
const { page, ev, ok } = T;

/* the ear on the page: every key event that reaches it after boot (there must be none), every press of the mouse */
await ev(() => {
  window.__keys = []; window.__btn = { left: 0, right: 0, wheel: 0 };
  for (const t of ['keydown', 'keyup']) addEventListener(t, e => __keys.push(`${t}:${e.code}`), true);
  addEventListener('mousedown', e => { if (e.button === 0) __btn.left++; if (e.button === 2) __btn.right++; }, true);
  addEventListener('wheel', () => { __btn.wheel++; }, true);
  /* every walk the game sets, as it sets it (read each frame — a short walk can be over before a check looks) */
  window.__walks = []; let last = null;
  const watch = () => { const m = typeof S !== 'undefined' && S ? S.moveTo : null; if (m && m !== last && !m.steer) __walks.push({ x: Math.round(m.x), y: Math.round(m.y), act: !!m.act, label: m.label || null, path: m.path ? m.path.length : null }); last = m; requestAnimationFrame(watch); };
  requestAnimationFrame(watch);
  /* a wait on the valley's own clock: a loaded machine draws fewer frames, and the clock is what the walk answers to */
  window.__gwait = async s => { const g0 = S.time, t0 = performance.now(); while (S.time - g0 < s && performance.now() - t0 < s * 8000) await __frames(1); };
});
/* the camera come to rest — its place and its zoom (the play camera eases its zoom near a town) — so the point under the
   cursor stays put */
const settle = () => ev(async () => { let prev = null, steady = 0; for (let i = 0; i < 400 && steady < 8; i++) { await __frames(1); const c = [Render.cam.x, Render.cam.y, Render.cam.z, Render.effZoom()]; steady = prev && Math.abs(c[0] - prev[0]) < 0.05 && Math.abs(c[1] - prev[1]) < 0.05 && Math.abs(c[2] - prev[2]) < 1e-4 && c[3] === prev[3] ? steady + 1 : 0; prev = c; } return steady >= 8; });
const at = (x, y) => ev(([x, y]) => { const p = __toScr(x, y); const el = document.elementFromPoint(p.x, p.y); return { x: Math.round(p.x), y: Math.round(p.y), on: !!el && el.id === 'game', el: el ? el.id || el.className : null }; }, [x, y]);
/* a point of the world clear to press: the canvas under it, not a toast passing over it (a toast fades; wait it out) */
const clearAt = async (x, y) => { let p = null; for (let i = 0; i < 60; i++) { p = await at(x, y); if (p.on) return p; await page.waitForTimeout(250); } return p; };
/* a tap: the camera at rest, the point clear, a real click — and the walk it set, read as the game set it */
const tap = async (x, y) => {
  await settle(); await clearAt(x, y); await settle();
  const p = await at(x, y); if (!p.on) return { ...p, walk: null };
  const n0 = await ev(() => __walks.length);
  await page.mouse.click(p.x, p.y);
  const walk = await ev(async n0 => { for (let i = 0; i < 12 && __walks.length <= n0; i++) await __frames(1); return __walks[n0] || null; }, n0);
  return { ...p, walk };
};
const until = (fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms, polling: 50 }).then(() => true, () => false);
const toasts = () => ev(() => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent));
/* a staged position: the Walker whole and on foot, set down, the camera on them */
const stage = (x, y) => ev(async ([x, y]) => {
  S.health = 100; S.bleeding = false; S.warmth = 100; S.food = 100; S.stam = S.stamMax; S.state = 'walk'; S.moveTo = null; S.route = []; S.qte = null; S.struggle = null;
  S.px = x; S.py = y; Render.cam.x = x; Render.cam.y = y;
  await __frames(3);
}, [x, y]);
const H = await ev(() => ({ x: DATA.stations.haven.x, y: DATA.stations.haven.y, ex: DATA.stations.elm.x, ey: DATA.stations.elm.y }));

/* ================= 1 · THE TERMINAL BY A TAP ================= */
const g1 = await ev(() => ({ head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent }));
const t1 = await tap(H.x, H.y);
const m1 = t1.walk;
const open1 = await until(() => !document.getElementById('stationOv').classList.contains('hidden'), null, 8000);
const at1 = await ev(() => ({ station: UI.curStation, dist: Math.round(Math.hypot(S.px - DATA.stations.haven.x, S.py - DATA.stations.haven.y)) }));
await page.click('.orderCard.prio [data-accept]'); await page.waitForTimeout(500);
const took1 = await ev(() => ({ tray: [...document.querySelectorAll('#orderTray .trayCard')].map(t => t.textContent.replace(/\s+/g, ' ').trim()), cargo: S.cargo.map(c => c.name) }));
await page.click('#stationClose'); await page.waitForTimeout(250);
const shut1 = await ev(() => document.getElementById('stationOv').classList.contains('hidden'));
ok('ONE HAND — THE TERMINAL BY A TAP: a new Walker at Haven, the Guide saying "E — or click the terminal", taps Haven\'s terminal — the walk is set to the terminal as a thing to use (its name on the walk), the feet walk there and the terminal opens; a click on the gold card\'s Accept takes the ★ order (the tray card for Elm Farm, the medicine and a letter on the pack) and a click on Leave closes it',
  /click the terminal/.test(g1.sub) && t1.on && !!m1 && m1.act && m1.label === 'Haven' && open1 && at1.station === 'haven' && took1.tray.some(t => /Elm Farm/.test(t)) && took1.cargo.includes('Medicine') && took1.cargo.includes('Letters') && shut1,
  JSON.stringify({ g1, t1, m1, at1, took1, shut1 }));

/* ================= 2 · THE WAY BY TAPS ================= */
const W2 = { taps: [], waded: false, rings: 0 };
for (let i = 0; i < 30; i++) {
  const s = await ev(e => ({ px: S.px, py: S.py, d: Math.hypot(e.ex - S.px, e.ey - S.py), qte: !!S.qte }), H);
  if (s.d < 330) break;
  if (s.qte) { await page.mouse.click(720, 430); W2.rings++; continue; }   // a click on the ring steadies it, one-handed
  const b = Math.atan2(H.ey - s.py, H.ex - s.px);
  let aim = null;
  await settle();
  for (const r of [420, 340, 260, 180]) {
    const x = s.px + Math.cos(b) * r, y = s.py + Math.sin(b) * r;
    /* plain ground: nothing there a tap would mean instead (a ruin, a pile, a cairn, a crate), and footing */
    const hot = await ev(([x, y]) => [...S.ruins.filter(r2 => !r2.looted), ...S.nodes.filter(n => !n.taken), ...S.graves, ...S.drops].some(o => U.dist(x, y, o.x, o.y) < 90) || World.terrainAt(x, y).blocked, [x, y]);
    if (hot) continue;
    const p = await at(x, y); if (p.on) { aim = { x, y, p }; break; }
  }
  if (!aim) { await page.waitForTimeout(300); continue; }
  const n0 = await ev(() => __walks.length);
  await page.mouse.click(aim.p.x, aim.p.y);
  const m = await ev(async n0 => { for (let i = 0; i < 12 && __walks.length <= n0; i++) await __frames(1); return __walks[n0] || null; }, n0);
  W2.taps.push({ to: [Math.round(aim.x), Math.round(aim.y)], set: m && [m.x, m.y], act: !!(m && m.act) });
  const r = await ev(async () => { let wet = false, rings = 0; const t0 = performance.now(); while (S.moveTo && performance.now() - t0 < 15000) { if (World.terrainAt(S.px, S.py).water && !Systems.crossingAt(S.px, S.py)) wet = true; if (S.qte) { rings++; break; } await __frames(2); } return { wet, rings }; });
  if (r.wet) W2.waded = true;
  if (r.rings) { await page.mouse.click(720, 430); W2.rings++; }
}
W2.end = await ev(e => Math.round(Math.hypot(e.ex - S.px, e.ey - S.py)), H);
ok('ONE HAND — THE WAY BY TAPS: taps on the ground carry the Walker toward Elm Farm — each sets the walk to the very point under the cursor (plain ground, nothing snapped to a thing), and Elm Creek\'s shallows are waded on foot on the way',
  W2.taps.length >= 2 && W2.taps.every(t => t.set && Math.abs(t.set[0] - t.to[0]) < 6 && Math.abs(t.set[1] - t.to[1]) < 6 && !t.act) && W2.waded && W2.end < 330,
  JSON.stringify(W2));

/* ================= 3 · THE HAND-OVER BY A TAP ================= */
const t3 = await tap(H.ex, H.ey);
const m3 = t3.walk;
const slip3 = await until(() => !document.getElementById('results').classList.contains('hidden'), null, 20000);
const s3 = await ev(() => ({ title: document.querySelector('#results h2').textContent.trim(), route: document.getElementById('resultRoute').textContent }));
let turns = 0;
for (let i = 0; i < 8; i++) { const r = await ev(() => !document.getElementById('results').classList.contains('hidden')); if (!r) break; await page.click('#resultsClose'); turns++; await page.waitForTimeout(300); }
const b3 = await ev(() => ({ station: UI.curStation, open: !document.getElementById('stationOv').classList.contains('hidden'), card: (document.querySelector('.orderCard.prio h4') || {}).textContent, prioIdx: S.orders.prioIdx }));
if (b3.open) { await page.click('.orderCard.prio [data-accept]'); await page.waitForTimeout(500); await page.click('#stationClose'); await page.waitForTimeout(250); }
const p3 = await ev(() => ({ cargo: S.cargo.map(c => c.name), ladders: S.cargo.filter(c => c.tool === 'ladder').length, sheet: !document.getElementById('stationOv').classList.contains('hidden') }));
ok('ONE HAND — THE HAND-OVER BY A TAP: a tap on Elm Farm\'s terminal walks the Walker there and uses it — the crates handed over and the slip up (Delivery complete · Haven → Elm Farm · PRIORITY), turned by a click on Carry on, the board after it; a click takes The crossing (two ladders on the pack) and a click on Leave closes the board: the first delivery made, the second taken, without a key',
  t3.on && !!m3 && m3.act && m3.label === 'Elm Farm' && slip3 && s3.title === 'Delivery complete' && /Haven → Elm Farm · PRIORITY/.test(s3.route) && turns >= 1 && b3.open && b3.station === 'elm' && b3.prioIdx === 1 && p3.ladders === 2 && !p3.sheet,
  JSON.stringify({ t3, m3, s3, turns, b3, p3 }));

/* from here: the first-sight scenes spent, the valley's events held, the morning (staging, between checks) */
await ev(() => {
  S.flags.guideDone = true; S.flags.calm = true; S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true; for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  S.event = null; S.eventCd = 1e9;
  const DL = DATA.T.dayLen; S.time = Math.ceil(S.time / DL) * DL + DL * 0.22;
});

/* ================= 4 · THE ROUTE AROUND ================= */
const A4 = [[4367, 10685], [4067, 10485]];
await stage(...A4[0]);
const rock4 = await ev(([a, b]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); let n = 0; for (let i = 0; i <= L; i += 6) if (World.terrainAt(a[0] + (b[0] - a[0]) * i / L, a[1] + (b[1] - a[1]) * i / L).blocked) n++; return n; }, A4);
const t4 = await tap(...A4[1]);
const m4 = await ev(() => S.moveTo && S.moveTo.path ? { n: S.moveTo.path.length, footing: S.moveTo.path.every(p => !World.terrainAt(p[0], p[1]).blocked) } : null);
const w4 = await ev(async ([a, b]) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]); let off = 0, rock = 0; const t0 = performance.now(); while (S.moveTo && performance.now() - t0 < 25000) { off = Math.max(off, Math.abs((b[0] - a[0]) * (a[1] - S.py) - (a[0] - S.px) * (b[1] - a[1])) / L); if (World.terrainAt(S.px, S.py).blocked) rock++; await __frames(1); } return { off: Math.round(off), rock, end: Math.round(Math.hypot(S.px - b[0], S.py - b[1])) }; }, A4);
ok('THE ROUTE AROUND: a tap across a cliff — the straight line from the Walker runs into rock — is walked along a planned route every waypoint of which is footing: the Walker turns well aside of the straight line, never sets foot on rock, and arrives at the point tapped',
  rock4 > 0 && t4.on && !!m4 && m4.n >= 3 && m4.footing && w4.rock === 0 && w4.off > 60 && w4.end <= 20, JSON.stringify({ rockOnTheLine: rock4, t4, m4, w4 }));

/* ================= 5 · THE REFUSAL ================= */
/* the wheel, one notch out: the far bank in view */
await page.mouse.move(700, 520); await page.mouse.wheel(0, 120); await ev(() => __frames(4));
const z5 = await ev(() => Render.zoomStepOf());
await stage(3000, 8040);
const t5 = await tap(3160, 7760);
await page.waitForTimeout(300);
const r5 = await ev(() => ({ walk: !!S.moveTo, moved: Math.round(Math.hypot(S.px - 3000, S.py - 8040)) }));
const tt5 = (await toasts()).filter(t => /No way through/.test(t));
ok('THE REFUSAL: a tap across the River Silt — deep water from one side of the valley to the other, nothing laid over it — is refused in so many words, "No way through on foot — a ladder or bridge would change that": the walk never set, the Walker unmoved',
  z5 === -1 && t5.on && !r5.walk && r5.moved === 0 && tt5.some(t => t === 'No way through on foot — a ladder or bridge would change that'), JSON.stringify({ zoomStep: z5, t5, r5, said: tt5 }));

/* ================= 6 · A LADDER, AND THE ROUTE OVER IT ================= */
await settle();
const rail6 = await ev(() => [...document.querySelectorAll('#prompts [data-pi]')].map(p => ({ i: p.dataset.pi, t: p.textContent.trim() })));
const bp = rail6.find(r => /^B/.test(r.t));
if (bp) { await page.click(`#prompts [data-pi="${bp.i}"]`); await page.waitForTimeout(250); }
const bar6 = await ev(() => ({ shown: !document.getElementById('buildBar').classList.contains('hidden'), opts: [...document.querySelectorAll('#buildBar [data-b]')].map(b => b.dataset.b) }));
if (bar6.opts.includes('ladder')) { await page.click('#buildBar [data-b="ladder"]'); await page.waitForTimeout(200); }
const aim6 = await clearAt(3000, 7800);
await page.mouse.move(aim6.x, aim6.y); await ev(() => __frames(4));
const ghost6 = await ev(() => S.place ? { type: S.place.type, valid: S.place.valid, why: S.place.why } : null);
const lad0 = await ev(() => ({ laid: S.structures.filter(s => s.type === 'ladder').length, packed: S.cargo.filter(c => c.tool === 'ladder').length }));
const aim6b = await clearAt(3000, 7800);
await page.mouse.click(aim6b.x, aim6b.y); await ev(() => __frames(3));
const lad1 = await ev(() => ({ laid: S.structures.filter(s => s.type === 'ladder').length, packed: S.cargo.filter(c => c.tool === 'ladder').length, hanging: !!S.place }));
const t6 = await tap(3160, 7760);
const m6 = t6.walk;
const plan6 = await ev(() => { const lad = S.structures.filter(s => s.type === 'ladder').slice(-1)[0], p = S.moveTo && S.moveTo.path; if (!p || !lad) return null; const c = Math.cos(lad.ang), s2 = Math.sin(lad.ang); return { n: p.length, onSpan: p.filter(q => { const dx = q[0] - lad.x, dy = q[1] - lad.y; return Math.abs(dx * c + dy * s2) < 95 && Math.abs(-dx * s2 + dy * c) < 1; }).length, straightDeep: (() => { let n = 0; for (let i = 0; i <= 1; i += 0.01) if (World.terrainAt(3000 + 160 * i, 8040 - 280 * i).cls === World.DEEP) n++; return n; })() }; });
const w6 = await ev(async () => { let rungs = 0, deep = 0; const t0 = performance.now(); while (S.moveTo && performance.now() - t0 < 25000) { const on = !!Systems.crossingAt(S.px, S.py); if (on) rungs++; else if (World.terrainAt(S.px, S.py).blocked) deep++; await __frames(1); } return { rungs, deep, x: Math.round(S.px), y: Math.round(S.py), arrived: Math.round(Math.hypot(S.px - 3160, S.py - 7760)) }; });
ok('CROSSINGS USED: a ladder laid by the mouse alone — the rail\'s B plate clicked, the bar\'s ladder clicked, the ghost aimed at the Silt with the cursor and set with a click (one fewer packed) — and the same tap across the river is now walked: the route planned onto the rungs (the straight line runs through deep water beside them), the Walker crossing on the ladder and never in the deep water, to the point tapped on the far bank (a ladder did change that)',
  !!bp && bar6.shown && bar6.opts.includes('ladder') && !!ghost6 && ghost6.type === 'ladder' && ghost6.valid && lad1.laid === lad0.laid + 1 && lad1.packed === lad0.packed - 1 && !lad1.hanging && t6.on && !!m6 && !!plan6 && plan6.straightDeep > 0 && plan6.onSpan >= 1 && w6.rungs > 0 && w6.deep === 0 && w6.y < 7810 && w6.arrived <= 20,
  JSON.stringify({ rail: bp && bp.t, bar6, ghost6, lad0, lad1, t6, m6, plan6, w6 }));

/* ================= 7 · CAMPS SKIRTED WHILE LOADED ================= */
const C7 = await ev(() => { const c = DATA.camps.find(x => x.id === 'pass'); return { x: c.x, y: c.y, R: c.r + 110 }; });
let W7 = null;
for (const [A, B] of [[[4442, 9420], [3736, 9256]], [[4415, 9425], [3714, 9239]], [[3736, 9256], [4442, 9420]]]) {
  await stage(...A); await settle();
  const p = await clearAt(...B);
  if (!p.on) continue;
  const loaded = await ev(() => S.cargo.filter(c => c.cat !== 'tool').map(c => c.name));
  const segMin = await ev(([A, B, C]) => { const dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy; let t = ((C.x - A[0]) * dx + (C.y - A[1]) * dy) / L2; t = Math.max(0, Math.min(1, t)); return Math.round(Math.hypot(A[0] + dx * t - C.x, A[1] + dy * t - C.y)); }, [A, B, C7]);
  const t7 = await tap(...B);
  const plan = await ev(C => S.moveTo && S.moveTo.path ? { n: S.moveTo.path.length, nearest: Math.round(Math.min(...S.moveTo.path.slice(0, -1).map(q => Math.hypot(q[0] - C.x, q[1] - C.y)))) } : null, C7);
  const walk = await ev(async C => { let near = 1e9; const t0 = performance.now(); while (S.moveTo && performance.now() - t0 < 30000) { near = Math.min(near, Math.hypot(S.px - C.x, S.py - C.y)); await __frames(1); } return { nearest: Math.round(near), arrived: !S.moveTo }; }, C7);
  /* the same tap with nothing on the back but tools */
  await stage(...A);
  await ev(() => { window.__kept = S.cargo.filter(c => c.cat !== 'tool'); S.cargo = S.cargo.filter(c => c.cat === 'tool'); });
  const t7b = await tap(...B);
  const plan2 = t7b.walk;
  const walk2 = await ev(async ([A, B]) => { const L = Math.hypot(B[0] - A[0], B[1] - A[1]); let off = 0; const t0 = performance.now(), g0 = S.time; while (S.moveTo && performance.now() - t0 < 12000 && S.time - g0 < 3) { off = Math.max(off, Math.abs((B[0] - A[0]) * (A[1] - S.py) - (A[0] - S.px) * (B[1] - A[1])) / L); await __frames(1); } return { off: Math.round(off), walked: Math.round(Math.hypot(S.px - A[0], S.py - A[1])) }; }, [A, B]);
  await ev(() => { S.moveTo = null; for (const c of __kept) S.cargo.push(c); });
  W7 = { A, B, loaded, segMin, t7, plan, walk, t7b, plan2, walk2 };
  break;
}
ok('CAMPS SKIRTED WHILE LOADED: a tap past Pass Camp with crates on the back, the straight line cutting into the camp\'s ground (its claim and the margin round it), is planned and walked on a route that keeps out — every waypoint and every step outside that ground — and arrives; the same tap with nothing but tools on the back is walked on the straight line',
  !!W7 && W7.loaded.length > 0 && W7.segMin < C7.R && W7.t7.on && !!W7.plan && W7.plan.nearest >= C7.R && W7.walk.nearest >= C7.R - 10 && W7.walk.arrived && W7.t7b.on && !!W7.plan2 && W7.plan2.path === null && W7.walk2.off < 8 && W7.walk2.walked > 100,
  JSON.stringify({ camp: C7, ...W7 }));
await page.mouse.move(700, 520); await page.mouse.wheel(0, -120); await ev(() => __frames(4));

/* ================= 8–13 · WALK THERE AND USE IT ================= */
/* a ruin */
const R8 = await ev(() => { const Hv = DATA.stations.haven, r = S.ruins.filter(x => !x.looted && x.type === 'cottage').sort((a, b) => U.dist(a.x, a.y, Hv.x, Hv.y) - U.dist(b.x, b.y, Hv.x, Hv.y))[0]; return { x: r.x, y: r.y, sal: S.skills.sal.total }; });
await stage(R8.x - 200, R8.y + 40);
const t8 = await tap(R8.x, R8.y); const m8 = t8.walk;
const open8 = await until(() => !document.getElementById('lootOv').classList.contains('hidden'), null, 10000);
const l8 = await ev(r => ({ title: document.getElementById('lootTitle').textContent, rows: [...document.querySelectorAll('#lootBody .rowline h4')].map(h => h.textContent.trim()), salvage: S.skills.sal.total - r.sal, dist: Math.round(Math.hypot(S.px - r.x, S.py - r.y)) }), R8);
await page.click('#lootTake'); await page.waitForTimeout(200);
ok('TAP TO USE — A RUIN: a tap on the collapsed cottage sets the walk to the ruin by name, the feet walk there and search it — the ruin\'s panel open on what the valley kept, Salvage learned from the verb',
  t8.on && !!m8 && m8.act && m8.label === 'Collapsed cottage' && open8 && l8.title === 'Collapsed cottage' && l8.salvage > 0 && l8.dist < 60, JSON.stringify({ t8, m8, l8 }));
/* a crate on the ground */
const C9 = await ev(() => { const Hv = DATA.stations.haven, x = Hv.x + 520, y = Hv.y + 260, it = State.makeItem('ration'); S.drops.push({ id: U.uid(), item: it, x, y }); return { x, y, id: it.id, name: it.name }; });
await stage(C9.x - 190, C9.y - 20);
const t9 = await tap(C9.x, C9.y); const m9 = t9.walk;
const got9 = await until(id => S.cargo.some(c => c.id === id), C9.id, 10000);
const r9 = await ev(id => ({ onGround: S.drops.some(d => d.item.id === id), onPack: S.cargo.some(c => c.id === id) }), C9.id);
ok('TAP TO USE — A CRATE: a tap on a crate lying on the ground (staged) sets the walk to it by name, the feet walk there and pick it up — on the pack, off the ground',
  t9.on && !!m9 && m9.act && m9.label === C9.name && got9 && r9.onPack && !r9.onGround, JSON.stringify({ C9, t9, m9, r9 }));
/* a cairn */
const G10 = await ev(() => { const Hv = DATA.stations.haven, x = Hv.x + 560, y = Hv.y + 180, it = State.makeItem('bandage'); const g = { id: U.uid(), x, y, name: 'Orla Ferris', cls: 'courier', seed: 7, items: [it], flares: 0, journal: { name: 'Orla Ferris', xp: { foot: 100 } }, wraith: false, respected: false, ph: 0 }; S.graves.push(g); return { x, y, id: g.id, item: it.id, foot: S.skills.foot.total }; });
await stage(G10.x - 200, G10.y + 30);
const t10 = await tap(G10.x, G10.y); const m10 = t10.walk;
const got10 = await until(id => !S.graves.some(g => g.id === id), G10.id, 10000);
const r10 = await ev(g => ({ pack: S.cargo.some(c => c.id === g.item), foot: +(S.skills.foot.total - g.foot).toFixed(1), said: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).filter(t => /Orla Ferris/.test(t)) }), G10);
ok('TAP TO USE — A CAIRN: a tap on a fallen walker\'s cairn (staged) sets the walk to it ("Orla Ferris\'s cairn"), the feet walk there and recover it — their pack shouldered, their journal read (seventy of every hundred of their Footwork carried into yours), the cairn gone',
  t10.on && !!m10 && m10.act && m10.label === 'Orla Ferris\'s cairn' && got10 && r10.pack && r10.foot >= 70 && r10.said.some(t => /journal/.test(t)) && r10.said.some(t => /shouldered again/.test(t)), JSON.stringify({ t10, m10, r10 }));
/* a paver */
const P11 = await ev(() => { S.stations.elm.connected = true; S.banked.metal = Math.max(S.banked.metal, 200); S.banked.ceramic = Math.max(S.banked.ceramic, 120); const road = DATA.roads.find(r => r.id === 'r_elm'), p = World.paverPos(road, 0); const carried = k => S.cargo.filter(c => c.cat === 'mat' && c.mat === k).reduce((a, c) => a + c.qty, 0); return { x: p.x, y: p.y, have: { metal: S.banked.metal + carried('metal'), ceramic: S.banked.ceramic + carried('ceramic') }, carried: { metal: carried('metal'), ceramic: carried('ceramic') }, cost: road.cost, before: S.roads.r_elm.slice() }; });
await stage(P11.x + 60, P11.y + 190);
const t11 = await tap(P11.x, P11.y); const m11 = t11.walk;
const got11 = await until(() => S.roads.r_elm[0] === true, null, 10000);
const r11 = await ev(h => { const carried = k => S.cargo.filter(c => c.cat === 'mat' && c.mat === k).reduce((a, c) => a + c.qty, 0); return { road: S.roads.r_elm.slice(), paid: { metal: h.metal - S.banked.metal - carried('metal'), ceramic: h.ceramic - S.banked.ceramic - carried('ceramic') }, carriedNow: carried('metal') + carried('ceramic') }; }, P11.have);
ok('TAP TO USE — A PAVER: with Elm Farm on the wire (staged), a tap on the Elm Road\'s paver sets the walk to it ("the paver"), the feet walk there and fund the road\'s first stretch at its price (the metal and ceramic carried banked first, the bank paying)',
  t11.on && !!m11 && m11.act && m11.label === 'the paver' && got11 && P11.before[0] === false && r11.road[0] === true && r11.paid.metal === P11.cost.metal && r11.paid.ceramic === P11.cost.ceramic && r11.carriedNow === 0, JSON.stringify({ P11, t11, m11, r11 }));
/* a pylon */
const Z12 = await ev(() => { const Hv = DATA.stations.haven, x = Hv.x + 640, y = Hv.y + 420; const a = { id: U.uid(), type: 'zipline', x, y, ang: 0, hp: 100, by: 'you', likes: 0 }, b = { id: U.uid(), type: 'zipline', x: x + 520, y: y - 60, ang: 0, hp: 100, by: 'you', likes: 0 }; S.structures.push(a, b); S.zipLinks.push([a.id, b.id]); return { x, y, bx: b.x, by: b.y }; });
await stage(Z12.x - 200, Z12.y - 30);
const t12 = await tap(Z12.x, Z12.y); const m12 = t12.walk;
const zip12 = await until(() => S.state === 'zip', null, 10000);
const land12 = await until(z => S.state === 'walk' && Math.hypot(S.px - z.bx, S.py - z.by) < 30, Z12, 15000);
ok('TAP TO USE — A PYLON: a tap on a zipline pylon (two staged, linked) sets the walk to it ("zipline"), the feet walk there and ride the line — off the ground, and down at the pylon it links to',
  t12.on && !!m12 && m12.act && m12.label === 'zipline' && zip12 && land12, JSON.stringify({ t12, m12, zip12, land12 }));
/* an event */
const E13 = await ev(() => { const Hv = DATA.stations.haven, x = Hv.x + 380, y = Hv.y + 560; S.event = { id: U.uid(), type: 'supplyDrop', x, y, t: 240, data: {} }; return { x, y, n: S.cargo.length, sal: S.skills.sal.total }; });
await stage(E13.x - 200, E13.y - 40);
const t13 = await tap(E13.x, E13.y); const m13 = t13.walk;
const got13 = await until(() => !S.event, null, 10000);
const r13 = await ev(e => ({ more: S.cargo.length - e.n, salvage: S.skills.sal.total - e.sal, said: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).filter(t => /^Salvaged/.test(t)) }), E13);
ok('TAP TO USE — AN EVENT: a tap on a supply drop (staged) sets the walk to it ("the event"), the feet walk there and crack it open — its salvage on the pack, Salvage learned, the event done',
  t13.on && !!m13 && m13.act && m13.label === 'the event' && got13 && r13.more > 0 && r13.salvage > 0 && r13.said.length > 0, JSON.stringify({ t13, m13, r13 }));

/* ================= 14 · HOLD M1: STEER ================= */
/* open meadow on the road west of the town: footing all round, nothing there a tap would mean instead */
const F = await ev(() => { const x = 3700, y = 9865; let open = true; for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) for (const r of [0, 80, 160, 240]) { const t = World.terrainAt(x + Math.cos(a) * r, y + Math.sin(a) * r); if (t.blocked || t.water) open = false; } return { x, y, open }; });
await stage(F.x, F.y); await settle();
await page.mouse.move(720 - 260, 430);
await page.mouse.down();
const s14a = await ev(async () => { await __gwait(0.7); return { steer: !!(S.moveTo && S.moveTo.steer), dir: +S.dir.toFixed(2), px: S.px, py: S.py }; });
await page.mouse.move(720, 430 + 230, { steps: 4 });
const s14b = await ev(async a => { await __gwait(0.7); return { steer: !!(S.moveTo && S.moveTo.steer), dir: +S.dir.toFixed(2), dx: Math.round(S.px - a.px), dy: Math.round(S.py - a.py) }; }, s14a);
await page.mouse.up();
const s14c = await ev(async () => { await __frames(2); const m = S.moveTo ? { steer: !!S.moveTo.steer, x: Math.round(S.moveTo.x), y: Math.round(S.moveTo.y) } : null; const t0 = performance.now(); while (S.moveTo && performance.now() - t0 < 6000) await __wait(50); await __wait(100); return { m, at: [Math.round(S.px), Math.round(S.py)], stopped: !S.moveTo && S.speed === 0 }; });
const west = Math.abs(Math.atan2(Math.sin(s14a.dir - Math.PI), Math.cos(s14a.dir - Math.PI))), south = Math.abs(s14b.dir - Math.PI / 2);
ok('HOLD M1 — STEER: M1 held, the Walker walks at the cursor (the walk a steer, heading west where the cursor is); the cursor drawn down and the heading turns south with it; let go, the feet finish at the last place pointed at and stop',
  F.open && s14a.steer && west < 0.2 && s14b.steer && south < 0.2 && s14b.dy > 30 && !!s14c.m && !s14c.m.steer && s14c.stopped && Math.hypot(s14c.at[0] - s14c.m.x, s14c.at[1] - s14c.m.y) < 20,
  JSON.stringify({ F, s14a: { steer: s14a.steer, dir: s14a.dir }, s14b, s14c }));

/* ================= 15 · HOLD M1 + M2: SPRINT ================= */
/* the pace across Haven's yard — the one ground with no fall in it, so a pace is a pace (a town's fire refills the lungs as
   fast as a sprint spends them, so the cost is read out on the road); the pack at a sane load (staged: the salvage of the
   checks above set down) */
const Y15 = await ev(() => { S.cargo = S.cargo.filter(c => c.cat === 'tool' || c.orderId); const Hv = DATA.stations.haven; return { x: Hv.x - 118, y: Hv.y + 10, load: +(State.weight() / State.cap()).toFixed(2) }; });
await stage(Y15.x, Y15.y); await settle();
await page.mouse.move(720 + 320, 430);
await page.mouse.down();
const s15a = await ev(async () => { await __wait(300); return { speed: +S.speed.toFixed(1), sprint: S.sprinting, yard: World.terrainAt(S.px, S.py).p[3] === 'station yard' }; });
await page.mouse.down({ button: 'right' });
const s15b = await ev(async () => { await __wait(300); return { speed: +S.speed.toFixed(1), sprint: S.sprinting, yard: World.terrainAt(S.px, S.py).p[3] === 'station yard' }; });
await page.mouse.up({ button: 'right' });
const s15c = await ev(async () => { await __wait(200); return { speed: +S.speed.toFixed(1), sprint: S.sprinting, yard: World.terrainAt(S.px, S.py).p[3] === 'station yard' }; });
await page.mouse.up();
await ev(async () => { const t0 = performance.now(); while (S.moveTo && performance.now() - t0 < 6000) await __wait(50); S.moveTo = null; });
/* the cost, on the road west of the town */
await stage(3700, 9865); await settle();
await page.mouse.move(720 - 320, 430);
await page.mouse.down(); await page.mouse.down({ button: 'right' });
const s15d = await ev(async () => { await __gwait(0.15); const s0 = S.stam; await __gwait(0.6); return { sprint: S.sprinting, stam: +(S.stam - s0).toFixed(2) }; });
await page.mouse.up({ button: 'right' });
const s15e = await ev(async () => { await __gwait(0.15); const s0 = S.stam, sp = S.sprinting; await __gwait(0.5); return { sprint: sp, stam: +(S.stam - s0).toFixed(2) }; });
await page.mouse.up();
await ev(async () => { const t0 = performance.now(); while (S.moveTo && performance.now() - t0 < 6000) await __wait(50); S.moveTo = null; });
ok('HOLD M1 + M2 — SPRINT: across Haven\'s yard M1 held walks at the walking pace; M2 pressed with it sprints — the pace half again (×1.55); M2 let go and the walk takes back its pace to the unit. On the road the sprint is paid for in stamina, and the walk after it is not',
  Y15.load <= 0.9 && s15a.yard && s15b.yard && s15c.yard && !s15a.sprint && s15b.sprint && Math.abs(s15b.speed / s15a.speed - 1.55) < 0.03 && !s15c.sprint && Math.abs(s15c.speed - s15a.speed) < 0.5
  && s15d.sprint && s15d.stam < -2 && !s15e.sprint && s15e.stam > s15d.stam, JSON.stringify({ Y15, s15a, s15b, s15c, road: { s15d, s15e } }));

/* ================= 16 · M1 ON THE VALLEY MAP ================= */
await stage(F.x, F.y); await settle();
/* v3.52 THE PAPERS ROW: the sheet opens by a click on the row's MAP button and folds away by a click on its CLOSE, the
   Walker where they stood; then it opens again by the same click for the travel */
const mb16 = await ev(() => { const b = document.querySelector('#papersRow [data-paper="map"]').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; });
await page.mouse.click(mb16.x, mb16.y); await page.waitForTimeout(400);
const op16 = await ev(() => !document.getElementById('mapWrap').classList.contains('hidden'));
const cb16 = await ev(() => { const b = document.getElementById('btnMapClose').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, px: S.px, py: S.py }; });
await page.mouse.click(cb16.x, cb16.y); await page.waitForTimeout(300);
const cl16 = await ev(c => ({ closed: document.getElementById('mapWrap').classList.contains('hidden'), still: Math.hypot(S.px - c.px, S.py - c.py) < 2, walk: !!S.moveTo }), cb16);
await page.mouse.click(mb16.x, mb16.y); await page.waitForTimeout(400);
const from16 = await ev(() => ({ x: S.px, y: S.py }));
const tg16 = await ev(() => { let best = null; for (let a = 0; a < Math.PI * 2 && !best; a += Math.PI / 16) { const x = S.px + Math.cos(a) * 1000, y = S.py + Math.sin(a) * 1000, t = World.terrainAt(x, y); if (!t.blocked && !t.water && ![...S.ruins, ...S.nodes, ...S.graves, ...S.drops].some(o => U.dist(o.x, o.y, x, y) < 160) && !DATA.stationOrder.some(id => U.dist(DATA.stations[id].x, DATA.stations[id].y, x, y) < 300)) best = { x, y }; } const p = UI.mapPoint(best.x, best.y); return { x: best.x, y: best.y, sx: p.x, sy: p.y, under: (document.elementFromPoint(p.x, p.y) || {}).id }; });
await page.mouse.click(tg16.sx, tg16.sy); await page.waitForTimeout(250);
const r16 = await ev(t => ({ sheet: !document.getElementById('mapWrap').classList.contains('hidden'), walk: S.moveTo ? { x: Math.round(S.moveTo.x), y: Math.round(S.moveTo.y), act: !!S.moveTo.act } : null, said: [...document.querySelectorAll('#toasts .toast')].map(x => x.textContent).filter(x => /^Walking/.test(x)).slice(-1)[0] || null }), tg16);
const w16 = await ev(async t => { const d0 = Math.hypot(S.px - t.x, S.py - t.y); await __gwait(1.5); return { closer: Math.round(d0 - Math.hypot(S.px - t.x, S.py - t.y)) }; }, tg16);
await ev(() => { S.moveTo = null; });
const perMapPx = await ev(() => 1 / (UI.mapPoint(1000, 0).x - UI.mapPoint(0, 0).x) * 1000);
/* the words say how far the walk is: the distance to the point set, in the survey's own measure (m, or km past a thousand) */
const said16 = (() => { const k = /^Walking — ([\d.]+) (k?m)$/.exec(r16.said || ''); return k ? +k[1] * (k[2] === 'km' ? 1000 : 1) : null; })();
const far16 = r16.walk ? Math.hypot(r16.walk.x - from16.x, r16.walk.y - from16.y) : 0;
ok('M1 ON THE VALLEY MAP — TRAVEL THERE: a click on the survey sheet a kilometre off folds the sheet and sets the walk to the point under the click, says how far ("Walking — 1.0 km"), and the Walker goes; the sheet itself opened by a click on the papers row\'s MAP button and folded away by a click on its CLOSE with the Walker where they stood (v3.52: the papers row — no key in it)',
  op16 && cl16.closed && cl16.still && !cl16.walk && tg16.under === 'map' && !r16.sheet && !!r16.walk && !r16.walk.act && Math.hypot(r16.walk.x - tg16.x, r16.walk.y - tg16.y) < Math.max(12, perMapPx) && said16 !== null && Math.abs(said16 - far16) <= (said16 >= 1000 ? 50 : 3) && far16 > 950 && w16.closer > 60,
  JSON.stringify({ opened: op16, closed: cl16, tg16, r16, far: Math.round(far16), w16, unitsPerMapPx: +perMapPx.toFixed(1) }));

/* ================= 17 · THE HONEST STALL ================= */
await stage(4434, 10198);
const wedge = await ev(() => { let rock = true; for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) for (const r of [0, 4, 8, 12]) if (!World.terrainAt(4434 + Math.cos(a) * r, 10198 + Math.sin(a) * r).blocked) rock = false; return rock; });
const t17 = await tap(4614, 10198);
const m17 = t17.walk;
const w17 = await ev(async () => { let rep = 0; const log = []; const t0 = performance.now(), g0 = S.time, x0 = S.px, y0 = S.py; while (performance.now() - t0 < 20000) { if (S.moveTo) { if ((S.moveTo.repaths || 0) > rep) { rep = S.moveTo.repaths; log.push({ rep, marked: S.moveTo.block ? S.moveTo.block.size : 0, t: +(S.time - g0).toFixed(2), path: S.moveTo.path ? S.moveTo.path.length : null }); } } else break; await __frames(1); } return { rep, log, moved: Math.round(Math.hypot(S.px - x0, S.py - y0)), secs: +(S.time - g0).toFixed(1), walk: !!S.moveTo }; });
const tt17 = (await toasts()).filter(t => /ground stops/.test(t));
ok('THE HONEST STALL: the Walker wedged into the rock at a cliff\'s foot (staged), a tap on open ground beyond is taken and planned; the feet do not advance, so the ground ahead is marked impassable and the route re-planned — three times, the marked ground growing — before an honest "The ground stops you here": the walk dropped, not left pressing into the rock',
  wedge && t17.on && !!m17 && m17.path > 0 && w17.rep === 3 && w17.log.length === 3 && w17.log.every((l, i) => l.marked > 0 && (i === 0 || l.marked >= w17.log[i - 1].marked)) && !w17.walk && w17.moved === 0 && tt17.includes('The ground stops you here'),
  JSON.stringify({ wedge, t17, m17, w17, said: tt17 }));

/* ================= 18 · ONE HAND ================= */
const ear = await ev(() => ({ keys: __keys.slice(), btn: { ...__btn } }));
ok('ONE HAND, THE WHOLE RUN: not one key event reached the page after boot — the first delivery and every verb above answered the mouse alone (its presses counted: M1, M2 and the wheel)',
  ear.keys.length === 0 && ear.btn.left > 20 && ear.btn.right >= 1 && ear.btn.wheel >= 2, JSON.stringify(ear));

await T.finish('the mouse-only run');
