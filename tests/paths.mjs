/* paths.mjs — v3.7 THE GROUND REMEMBERS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). Desire paths: every six metres of grass walked leaves a print in the wear
   grid, the tread spreading lighter to its neighbours, grass and marsh only; the grid clamps; six real passes on the keys wear
   a trail the eye can see, footprints stamped dark behind the feet; the bare path lands in the terrain canvas itself (young
   paths broken, old paths solid) and in the light field's copy of that ground; worn-bare ground walks 7% faster, measured on
   the same lane before and after; the first path worn to bare earth teaches itself, once — the toast, and the Walker looks
   down and says so; the paths ride the save, the code and the load, and a new valley grows its grass back; and a spoken line
   lands on the composited canvas as gold texels of the world's own 3×5 face. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const t0 = Date.now();

/* the lanes: open, lit meadow east and south of Haven — every sampled point meadow, none of them crossing another */
await ev(() => {
  const H = DATA.stations.haven, WW = Math.ceil(World.W / 10);
  window.__P = {
    H, WW,
    cell: (x, y) => Math.floor(y / 10) * WW + Math.floor(x / 10),
    cellXY: i => ({ x: (i % WW) * 10 + 5, y: Math.floor(i / WW) * 10 + 5 }),
    /* the four texels of a wear cell in the terrain canvas (a cell is 2×2 texels) */
    texels: (canvas, i) => { const tx0 = Math.round((i % WW) * 10 / World.TS), ty0 = Math.round(Math.floor(i / WW) * 10 / World.TS); return canvas.getContext('2d').getImageData(tx0, ty0, 2, 2).data; },
    laneA: { x0: H.x + 540, x1: H.x + 840, y: H.y + 270 },   // the keys' lane
    laneB: { x0: H.x + 300, x1: H.x + 420, y: H.y + 330 },   // the bare lane, on lit ground
    laneC: { x0: H.x + 560, x1: H.x + 800, y: H.y + 210 },   // the race
    probe: { x: H.x + 700, y: H.y + 450 },                   // the counting cell
  };
  const lanes = ['laneA', 'laneB', 'laneC'].map(k => __P[k]);
  window.__P.allMeadow = lanes.every(L => { for (let x = L.x0 - 10; x <= L.x1 + 10; x += 5) if (World.classAt(x, L.y) !== World.MEADOW) return false; return true; }) && World.classAt(__P.probe.x, __P.probe.y) === World.MEADOW;
  window.__P.fresh = lanes.every(L => { for (let x = L.x0; x <= L.x1; x += 5) if (World.wearAt(x, L.y) || World.wearAt(x, L.y - 10) || World.wearAt(x, L.y + 10)) return false; return true; });
});

/* ================= 1 · WEAR ACCUMULATES ================= */
let r = await ev(() => {
  const p = __P.probe, i = __P.cell(p.x, p.y), before = World.wearAt(p.x, p.y);
  const a = World.addWear(p.x, p.y, 3), b = World.addWear(p.x, p.y, 3);
  const nb = [[10, 0], [-10, 0], [0, 10], [0, -10]].map(([dx, dy]) => World.wearAt(p.x + dx, p.y + dy));
  const diag = World.wearAt(p.x + 10, p.y + 10);
  /* grass and marsh only: rock, scree, snow and water keep no print */
  const other = [];
  for (let y = 600; y < World.H - 600 && other.length < 4; y += 170) for (let x = 600; x < World.W - 600 && other.length < 4; x += 170) {
    const c = World.classAt(x, y);
    if ((c === World.ROCK || c === World.SCREE || c === World.SNOW || c === World.SHALLOW) && !other.some(o => o.c === c)) other.push({ c, got: World.addWear(x, y, 3), kept: World.wearAt(x, y) });
  }
  let marsh = null;
  for (let y = 600; y < World.H - 600 && !marsh; y += 90) for (let x = 600; x < World.W - 600 && !marsh; x += 90) if (World.classAt(x, y) === World.MARSH && !World.wearAt(x, y)) marsh = { got: World.addWear(x, y, 3) };
  return { allMeadow: __P.allMeadow, fresh: __P.fresh, i, before, a, b, nb, diag, other, marsh };
});
ok('WEAR ACCUMULATES: a print on meadow adds to the wear grid (0 → 3 → 6), the tread spreads a lighter print to the four cells beside it and never to the diagonal; a marsh keeps prints too; rock, scree, snowfield and shallows keep none',
  r.allMeadow && r.fresh && r.before === 0 && r.a === 3 && r.b === 6 && r.nb.every(v => v >= 1 && v < r.b) && r.diag === 0 && r.other.length >= 3 && r.other.every(o => o.got === 0 && o.kept === 0) && r.marsh && r.marsh.got === 3,
  JSON.stringify(r));

/* ================= 2 · WEAR CLAMPS ================= */
r = await ev(() => {
  const p = __P.probe, seen = [];
  for (let k = 0; k < 120; k++) { const w = World.addWear(p.x, p.y, 3); if (k % 20 === 19) seen.push(w); }
  const big = World.addWear(p.x, p.y, 200);
  return { seen, big, at: World.wearAt(p.x, p.y), bare: World.W_BARE, trample: World.W_TRAMPLE };
});
ok('WEAR CLAMPS: a hundred and twenty prints and a heavy one on the same cell climb to 255 and stop there — the grid holds a byte, the stages (trampled at 24, bare at 64) sit well under it',
  r.at === 255 && r.big === 255 && r.seen[r.seen.length - 1] === 255 && r.seen.every((v, k) => k === 0 || v >= r.seen[k - 1]) && r.trample === 24 && r.bare === 64, JSON.stringify(r));

/* ================= 3 · SIX REAL PASSES ================= */
/* the keys only: D walks the lane east, A walks it back — six passes, no debug hook moves the Walker */
await ev(async () => {
  const L = __P.laneA; WL.tp([L.x0 - 12, L.y]); S.weather.state = 'clear'; S.speed = 0; S.braced = false; S.moveTo = null; S.route = [];
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
  for (const n of NPC.party()) { n.cx = S.px + 900; n.cy = S.py + 900; }
  __clearAmb(S.px, S.py, 900); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py; WL.timeScale = 1;
  const g = World.tc.getContext('2d'), t0 = Math.round((L.x0 - 20) / World.TS), ty = Math.round((L.y - 15) / World.TS);
  window.__laneA0 = g.getImageData(t0, ty, Math.round((L.x1 - L.x0 + 40) / World.TS), Math.round(30 / World.TS)).data;
  window.__printSeen = { max: 0, before: 0 };
  /* the same frame before a step is taken: the lane's middle and the grass above it, composited (the trail is measured
     against it — the meadow's own yellow-greens counted in both) */
  Render.cam.x = (L.x0 + L.x1) / 2; Render.cam.y = L.y; await __wait(120); await __frames(3);
  const trCol = [88, 98, 54]; window.__lane0 = { on: __near((L.x0 + L.x1) / 2, L.y, trCol, 18, 30), off: __near((L.x0 + L.x1) / 2, L.y - 60, trCol, 18, 30) };
  Render.cam.x = S.px; Render.cam.y = S.py;
  await __frames(3);
});
const printsBefore = await ev(() => { const L = __P.laneA; return __near(L.x0 + 60, L.y + 4, [46, 60, 42], 12, 22); });
const passes = [];
for (let k = 0; k < 6; k++) {
  const east = k % 2 === 0, key = east ? 'KeyD' : 'KeyA';
  await page.keyboard.down(key);
  const t1 = Date.now();
  let sawPrint = 0;
  for (let s = 0; s < 120; s++) {
    await page.waitForTimeout(100);
    const st = await ev(east => { const L = __P.laneA, done = east ? S.px >= L.x1 : S.px <= L.x0; let pr = 0; if (Math.abs(S.px - (L.x0 + L.x1) / 2) < 60) pr = __near(S.px + (east ? -26 : 26), L.y + 4, [46, 60, 42], 12, 16); return { done, pr, x: Math.round(S.px) }; }, east);
    sawPrint = Math.max(sawPrint, st.pr);
    if (st.done) break;
  }
  await page.keyboard.up(key);
  await page.waitForTimeout(150);
  passes.push({ key, ms: Date.now() - t1, prints: sawPrint });
}
r = await ev(async () => {
  const L = __P.laneA; World.flushWear(1); await __frames(2);
  let cells = 0, trampled = 0, maxW = 0;
  for (let x = L.x0 + 10; x <= L.x1 - 10; x += 10) { cells++; const w = World.wearAt(x, L.y); if (w >= World.W_TRAMPLE) trampled++; maxW = Math.max(maxW, w); }
  const g = World.tc.getContext('2d'), t0 = Math.round((L.x0 - 20) / World.TS), ty = Math.round((L.y - 15) / World.TS);
  const now = g.getImageData(t0, ty, Math.round((L.x1 - L.x0 + 40) / World.TS), Math.round(30 / World.TS)).data;
  let painted = 0; for (let i = 0; i < now.length; i += 4) if (now[i] !== __laneA0[i] || now[i + 1] !== __laneA0[i + 1] || now[i + 2] !== __laneA0[i + 2]) painted++;
  /* the trail on screen: the lane's middle, composited, against the grass either side */
  Render.cam.x = (L.x0 + L.x1) / 2; Render.cam.y = L.y; await __wait(120); await __frames(3);
  const trCol = [88, 98, 54], onLane = __near((L.x0 + L.x1) / 2, L.y, trCol, 18, 30), offLane = __near((L.x0 + L.x1) / 2, L.y - 60, trCol, 18, 30);
  return { cells, trampled, maxW, painted, onLane, offLane, before: __lane0, grew: onLane - __lane0.on, besideGrew: offLane - __lane0.off };
});
ok('SIX REAL PASSES: the keys alone walk the Walker six times along a fresh meadow lane (D out, A back) — footprints stamp dark behind the feet as they go, the lane\'s cells wear past trampled, the terrain canvas under the lane is repainted, and the composited frame shows the yellowed trail where the grass beside it has none (v3.52: each measured against the same frame before a step was taken — the meadow\'s own yellow-greens had been counted as trail beside it)',
  passes.length === 6 && passes.every(p => p.prints > 0) && printsBefore === 0 && r.trampled >= r.cells * 0.8 && r.painted > 40 && r.grew > 300 && r.grew > Math.abs(r.besideGrew) * 6 + 60,
  JSON.stringify({ passes, printsBefore, ...r }));

/* ================= 4 · THE BARE PATH IN THE TERRAIN CANVAS ================= */
r = await ev(() => {
  const L = __P.laneB, cells = [];
  for (let x = L.x0; x <= L.x1; x += 10) cells.push(__P.cell(x, L.y));
  window.__laneB = cells;
  window.__tcB0 = cells.map(i => [...__P.texels(World.tc, i)]);
  window.__ovB0 = cells.map(i => [...__P.texels(World.lightOv, i)]);
  /* the Walker's prints, as the step lays them: three a print, every six units, until the middle of the lane is old ground */
  for (let pass = 0; pass < 40; pass++) for (let x = L.x0; x <= L.x1; x += 6) World.addWear(x, L.y, 3);
  World.flushWear(1);
  /* and one young bare cell of its own, just past the line: trampled first (the flush paints it), then just worn bare */
  const y2 = L.y + 60, x2 = L.x0 + 40; window.__young = __P.cell(x2, y2);
  const grass0 = [...__P.texels(World.tc, __young)];
  let w = 0; while (w < 58) w = World.addWear(x2, y2, 3);
  World.flushWear(1);
  while (w < World.W_BARE) w = World.addWear(x2, y2, 3);
  World.flushWear(1);
  const bare = [[124, 111, 79], [105, 94, 66]], trm = [[88, 98, 54], [76, 86, 48]];
  const is = (d, k, set) => set.some(c => d[k] === c[0] && d[k + 1] === c[1] && d[k + 2] === c[2]);
  const old = cells.filter(i => World.wearAt(__P.cellXY(i).x, __P.cellXY(i).y) >= 112);
  const oldSolid = old.every(i => { const d = __P.texels(World.tc, i); return [0, 4, 8, 12].every(k => is(d, k, bare)); });
  const yd = __P.texels(World.tc, __young), youngBare = [0, 4, 8, 12].filter(k => is(yd, k, bare)).length, youngTrm = [0, 4, 8, 12].filter(k => is(yd, k, trm)).length;
  const youngGrass = [0, 4, 8, 12].filter(k => yd[k] === grass0[k] && yd[k + 1] === grass0[k + 1] && yd[k + 2] === grass0[k + 2]).length;
  const changed = cells.filter((i, n) => { const d = __P.texels(World.tc, i); return [0, 4, 8, 12].some(k => d[k] !== __tcB0[n][k] || d[k + 1] !== __tcB0[n][k + 1]); }).length;
  return { cells: cells.length, old: old.length, oldSolid, youngW: World.wearAt(x2, y2), youngBare, youngTrm, youngGrass, changed };
});
ok('THE BARE PATH IN THE TERRAIN CANVAS: forty passes of prints wear the lane to packed earth in the terrain canvas itself — every texel of an old cell is the bare ramp\'s own two earths, solid; a cell just worn bare is broken, the earth dithered in over the trampled grass it was a moment before',
  r.old >= r.cells - 2 && r.oldSolid && r.changed === r.cells && r.youngW >= 64 && r.youngW < 80 && r.youngBare >= 1 && r.youngBare <= 3 && r.youngTrm >= 1 && r.youngBare + r.youngTrm + r.youngGrass === 4, JSON.stringify(r));

/* ================= 5 · THE LIGHT FIELD'S COPY ================= */
r = await ev(() => {
  const lead = d => { let rr = 0, gg = 0, n = 0; for (let k = 0; k < d.length; k += 4) if (d[k + 3] === 255) { rr += d[k]; gg += d[k + 1]; n++; } return { r: n ? rr / n : 0, g: n ? gg / n : 0, n }; };
  const before = __ovB0.map(d => lead(d)), after = __laneB.map(i => lead(__P.texels(World.lightOv, i)));
  const L = __P.laneB, lit = World.lightAt((L.x0 + L.x1) / 2, L.y);
  const grassLed = before.filter(b => b.n === 4 && b.g > b.r).length, earthLed = after.filter(a => a.n === 4 && a.r > a.g).length;
  const warm = __laneB.map(i => __P.texels(World.lightWarm, i)).filter(d => d[3] === 255 && d[0] > d[1]).length;
  return { cells: __laneB.length, lit: +lit.toFixed(2), grassLed, earthLed, warm, sample: { before: before[5], after: after[5] } };
});
ok('THE LIGHT FIELD\'S COPY: on lit ground the light field holds its own palette-remapped copy of the ground, and the path lands in it too — the copy under the lane read green-led grass before the wear and reads red-led packed earth after it, in the day field and in the warm paint the frame lays over lit land',
  r.lit > 0.6 && r.grassLed >= r.cells - 1 && r.earthLed >= r.cells - 2 && r.warm >= r.cells - 2, JSON.stringify(r));

/* ================= 6 · THE WORN LANE OUTRUNS FRESH MEADOW ================= */
/* the same lane, the same direction, the same clock (sixtieths through the sim): fresh, then worn bare */
const race = () => ev(() => {
  const L = __P.laneC; S.px = L.x0; S.py = L.y; S.speed = 0; S.stam = S.stamMax; S.moveTo = null; S.route = [];
  let steps = 0, spd = [];
  while (S.px < L.x1 && steps < 5000) { Systems.update(1 / 60, { right: true }); steps++; if (Math.abs(S.px - (L.x0 + L.x1) / 2) < 3) spd.push(S.speed); }
  return { secs: +(steps / 60).toFixed(3), mid: spd.length ? +spd[0].toFixed(2) : 0, y: Math.round(S.py), onLane: Math.abs(S.py - L.y) < 1 };
});
await ev(() => { WL.timeScale = 0.001; S.flags.pathWorn = true; });   // the lesson is walked in 7, on the keys
const fresh = await race();
const laneCWear = await ev(() => { const L = __P.laneC; let mx = 0; for (let x = L.x0; x <= L.x1; x += 10) mx = Math.max(mx, World.wearAt(x, L.y)); return { max: mx, underBare: mx < World.W_BARE }; });
await ev(() => { const L = __P.laneC; for (let pass = 0; pass < 40; pass++) for (let x = L.x0 - 12; x <= L.x1 + 12; x += 6) World.addWear(x, L.y, 3); World.flushWear(1); });
const worn = await race();
const ratio = fresh.secs / worn.secs, spdRatio = worn.mid / fresh.mid;
ok('THE WORN LANE OUTRUNS FRESH MEADOW: walked through the sim at a fixed clock, the same lane in the same direction takes the Walker measurably less time worn bare than it did as fresh grass — packed earth walks 7% faster (the speed at the lane\'s middle ×1.07 exactly), and one fresh pass alone does not wear it that far',
  fresh.onLane && worn.onLane && ratio > 1.05 && ratio < 1.09 && Math.abs(spdRatio - 1.07) < 0.002 && laneCWear.underBare,
  JSON.stringify({ fresh, worn, ratio: +ratio.toFixed(4), spdRatio: +spdRatio.toFixed(4), laneCWear }));

/* ================= 7 · THE FIRST BARE PATH TEACHES ITSELF ================= */
/* on the keys: the Walker walks onto the old ground of the bare lane — the cell under the feet goes past bare, and the lesson
   lands once: the toast, and the Walker looks down and says so */
await ev(async () => {
  const L = __P.laneB; S.flags.pathWorn = false; S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.barkAt = -999;
  /* a fresh cell a step short of bare at the lane's east end, so the step itself crosses the line */
  WL.tp([L.x1 + 40, L.y + 120]); S.speed = 0; S.moveTo = null; Render.clearFx(); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 20;
  for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove();
  for (let x = S.px; x <= S.px + 80; x += 10) { let w = World.wearAt(x, S.py); while (w < World.W_BARE - 4) w = World.addWear(x, S.py, 3) || 999; }
  WL.timeScale = 1; await __frames(2);
});
await page.keyboard.down('KeyD');
let lesson = null;
for (let s = 0; s < 40 && !lesson; s++) {
  await page.waitForTimeout(100);
  lesson = await ev(() => S.flags.pathWorn ? { toast: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).find(t => /The ground remembers your route/.test(t)) || null, barks: S.flags.barks.firstpath || 0 } : null);
}
await page.keyboard.up('KeyD');
r = await ev(async () => {
  await __wait(60); await __frames(3);
  /* the Walker's own line, over their head, in their own voice (bone) on the composited canvas */
  const boneOver = __near(S.px, S.py - 50, [233, 226, 208], 20, 60);
  const pool = DATA.barks.firstpath;
  /* once: another stretch of bare ground teaches nothing */
  const n0 = document.querySelectorAll('#toasts .toast').length;
  WL.timeScale = 0.001;
  for (let k = 0; k < 20; k++) World.addWear(S.px + 30, S.py, 3);
  S.px += 30; Systems.update(1 / 30, { right: true }); Systems.update(1 / 30, { right: true });
  const again = [...document.querySelectorAll('#toasts .toast')].filter(t => /The ground remembers your route/.test(t.textContent)).length;
  return { boneOver, pool: pool.length, hasNobody: pool.some(l => /A road nobody paid for\. Mine\./.test(l)), again, n0 };
});
ok('THE FIRST BARE PATH TEACHES ITSELF: walked on the keys, the first step that wears a cell to bare earth raises the lesson once — "The ground remembers your route — worn paths walk a little faster." — and the Walker looks down and says a line of their own over their head ("A road nobody paid for. Mine." among them; the Walker\'s voice is bone, as every line of theirs); more bare ground teaches it no second time',
  !!lesson && !!lesson.toast && lesson.barks === 1 && r.boneOver > 20 && r.hasNobody && r.again <= 1, JSON.stringify({ lesson, ...r }));

/* ================= 8 · THE PATHS RIDE THE SAVE ================= */
r = await ev(async () => {
  const cells = __laneB, pack0 = World.packWear();
  const wear0 = cells.map(i => World.wearAt(__P.cellXY(i).x, __P.cellXY(i).y));
  const tc0 = cells.map(i => [...__P.texels(World.tc, i)].join());
  const saved = State.save(), plate = State.slotInfo(State.slot());
  const code = await State.exportCode(), dec = await State.decodeCode(code);
  const codeCarries = Array.isArray(dec.json.wearSave) && dec.json.wearSave.length === pack0.length && dec.json.wearSave.every((v, k) => v === pack0[k]);
  /* a new valley grows its grass back */
  World.clearWear();
  const cleared = cells.every(i => World.wearAt(__P.cellXY(i).x, __P.cellXY(i).y) === 0);
  const grassBack = cells.every((i, n) => [...__P.texels(World.tc, i)].join() === __tcB0[n].join());
  /* and the load wears it in again, paint and all */
  const loaded = State.load();
  const wear1 = cells.map(i => World.wearAt(__P.cellXY(i).x, __P.cellXY(i).y));
  const tc1 = cells.map(i => [...__P.texels(World.tc, i)].join());
  const laneA = __P.laneA; let aKept = 0; for (let x = laneA.x0 + 10; x <= laneA.x1 - 10; x += 10) if (World.wearAt(x, laneA.y) >= World.W_TRAMPLE) aKept++;
  return { saved, plate: { empty: plate.empty, name: plate.name, bytes: plate.bytes }, code: code.slice(0, 4), codeCarries, packed: pack0.length / 2, cleared, grassBack, loaded, sameWear: wear1.every((w, k) => w === wear0[k]), samePaint: tc1.every((p, k) => p === tc0[k]), aKept };
});
ok('THE PATHS RIDE THE SAVE: the worn cells pack into the save (the slot\'s plate reads the valley), into its code (the code, unsealed, carries every cell byte for byte); a new valley grows its grass back texel for texel; and the load wears the paths in again — the same wear, the same earth in the terrain canvas, the keys\' lane still trampled',
  r.saved && !r.plate.empty && r.code === 'WL1:' && r.codeCarries && r.packed > 30 && r.cleared && r.grassBack && r.loaded && r.sameWear && r.samePaint && r.aKept >= 20, JSON.stringify(r));

/* ================= 9 · A SPOKEN LINE IN THE WORLD'S FACE ================= */
r = await ev(async () => {
  await __stage(); Render.clearFx(); await __wait(60); await __frames(3);
  const gold = [255, 217, 143], at = { x: S.px, y: S.py - 44 };
  const without = __near(at.x, at.y, gold, 16, 70);
  Render.say(S.px, S.py - 12, 'Walk far.', '255,217,143');   // the town's send-off, in the valley's gold
  await __wait(80); await __frames(3);
  const withIt = __near(at.x, at.y, gold, 16, 70);
  /* the face's texels are whole: every gold run on a row of the line is a multiple of the texel */
  const p = __toScr(at.x, at.y), cv = document.getElementById('game'), g = cv.getContext('2d'), dpr = devicePixelRatio;
  const d = g.getImageData(Math.round((p.x - 70) * dpr), Math.round((p.y - 70) * dpr), Math.round(140 * dpr), Math.round(140 * dpr));
  const W = d.width, runs = [];
  for (let y = 0; y < d.height; y++) { let run = 0; for (let x = 0; x <= W; x++) { const k = (y * W + x) * 4, on = x < W && Math.abs(d.data[k] - gold[0]) < 16 && Math.abs(d.data[k + 1] - gold[1]) < 16 && Math.abs(d.data[k + 2] - gold[2]) < 16; if (on) run++; else { if (run) runs.push(run); run = 0; } } }
  const tx = Math.max(2, Math.round(3 * dpr)), whole = runs.length ? runs.filter(n => n % tx === 0).length / runs.length : 0;
  Render.clearFx(); __done();
  return { without, withIt, runs: runs.length, whole: +whole.toFixed(2), tx };
});
ok('A SPOKEN LINE IN THE WORLD\'S FACE: a gold line spoken over the Walker lands on the composited canvas as gold texels of the world\'s own 3×5 face — none in the same frame without it, and the gold runs on its rows whole texels wide on the screen grid',
  r.without === 0 && r.withIt > 60 && r.runs > 10 && r.whole >= 0.9, JSON.stringify(r));

console.log(`paths: ${((Date.now() - t0) / 1000).toFixed(1)} s after boot`);
await T.finish('the paths');
