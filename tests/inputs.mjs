/* inputs.mjs — v3.28a THE WATCHDOG (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). The first suite that boots exactly what the artifact serves: the
   player's own page, no debug flag, no debug hooks. A new walker by real clicks, then the boots proven live — WASD on every
   axis and a click on the ground; the pause, the map, the skills, the blueprint and the tailor each opened and closed by
   their own keys, and a seeded fuzz across all of them, the walk live after; the watchdog's four repairs, each inside two
   seconds (a paused clock with no pause sheet, a station sheet with nobody home, a clock and letterbox stranded with no
   scene, a zip with no ride under it); a save carrying a structure type this build never heard of (v3.28c: the type
   ledger — it loads as unmapped works carrying its type, inert, and the world walks on); the sabotage — the sim made to
   throw, reported on screen and in the pause sheet's diagnosis while the walker keeps walking; and the stillness law
   (v3.30), measured on a SETTLED frame (v3.35's correction): under a bleed the ground holds still to the pixel. */
import { boot } from './lib/harness.mjs';

const T = await boot({ player: true });
const { page, ev, ok } = T;
await page.waitForFunction(() => { try { return !!S; } catch (e) { return false; } }, null, { timeout: 60000 });   // the valley baked and drifting behind the title

/* the faults a check provokes on purpose are the guard doing its work — counted as its evidence, never as page errors */
const expectFaults = async (re, fn) => { const n0 = T.errors.length; const r = await fn(); await page.waitForTimeout(300); let n = 0; for (let i = T.errors.length - 1; i >= n0; i--) if (re.test(T.errors[i])) { T.errors.splice(i, 1); n++; } return { r, faults: n }; };
/* a key held until the walker has covered thirty units (or two and a half seconds pass, on a machine however loaded) */
const walk = async (key) => {
  const a = await ev(() => ({ x: S.px, y: S.py })); await page.keyboard.down(key);
  const b = await ev(async a => { const t0 = performance.now(); while (performance.now() - t0 < 2500 && Math.hypot(S.px - a.x, S.py - a.y) < 30) await __wait(40); return { x: S.px, y: S.py, ms: Math.round(performance.now() - t0) }; }, a);
  await page.keyboard.up(key); await page.waitForTimeout(80);
  return { dx: Math.round(b.x - a.x), dy: Math.round(b.y - a.y), ms: b.ms };
};
const live = async () => { const e = await walk('KeyD'); return e.dx >= 25; };

/* ================= 1 · THE PLAYER'S PAGE ================= */
const title = await ev(() => ({ url: location.href, debug: new URLSearchParams(location.search).has('debug'), wl: typeof window.WL, title: !document.getElementById('titleScreen').classList.contains('hidden'), newBtn: !!document.getElementById('btnNew') }));
await T.newGame();
await T.instruments();
const inWorld = await ev(() => ({ hud: !document.getElementById('hud').classList.contains('hidden'), titleGone: document.getElementById('titleScreen').classList.contains('hidden'), gates: UI.gateReport(), name: S.pName, dead: !!S.dead }));
ok('THE PLAYER\'S PAGE: the suite boots waylight.html exactly as served — no debug flag, no debug hooks on the window — the valley drifting behind the title; a new walker enlisted by real clicks (New, Begin, the briefing, the form) stands in the world with the HUD up and no gate holding the boots',
  !title.debug && title.wl === 'undefined' && title.title && /waylight\.html$/.test(title.url) && inWorld.hud && inWorld.titleGone && inWorld.gates.length === 0 && !inWorld.dead && !!inWorld.name, JSON.stringify({ title, inWorld }));

/* ================= 2 · WASD ================= */
await ev(() => { S.px = DATA.stations.haven.x + 360; S.py = DATA.stations.haven.y + 240; S.moveTo = null; });
const axes = { D: await walk('KeyD'), S: await walk('KeyS'), A: await walk('KeyA'), W: await walk('KeyW') };
await page.keyboard.down('KeyE'); await page.waitForTimeout(80); const eDown = await ev(() => Render.eKeyState().held);
await page.keyboard.up('KeyE'); await page.waitForTimeout(80); const eUp = await ev(() => Render.eKeyState().held);
ok('WASD, LIVE: each key walks its own way on the player\'s page — D east, S south, A west, W north — the other axis untouched; and the hands\' key is heard too (E held, E let go)',
  axes.D.dx >= 25 && Math.abs(axes.D.dy) < 4 && axes.S.dy >= 25 && Math.abs(axes.S.dx) < 4 && axes.A.dx <= -25 && Math.abs(axes.A.dy) < 4 && axes.W.dy <= -25 && Math.abs(axes.W.dx) < 4 && eDown === true && eUp === false, JSON.stringify({ ...axes, eDown, eUp }));

/* ================= 3 · THE CLICK ================= */
const settle = () => ev(async () => { let prev = null, steady = 0; for (let i = 0; i < 400 && steady < 8; i++) { await __frames(1); const c = [Render.cam.x, Render.cam.y]; steady = prev && Math.abs(c[0] - prev[0]) < 0.01 && Math.abs(c[1] - prev[1]) < 0.01 ? steady + 1 : 0; prev = c; } return steady >= 8; });
await settle();   // the camera come to rest on the stopped walker, so the point under the cursor stays put
/* a patch of plain ground a few strides off — nothing there a click would mean instead (a node, a ruin, a cairn, a door) */
const aim = await ev(() => {
  const hot = (x, y) => DATA.stationOrder.some(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) < 220) || [...S.nodes, ...S.ruins, ...S.graves, ...S.drops, ...S.lost, ...S.snags, ...S.structures].some(o => U.dist(x, y, o.x, o.y) < 120);
  const off = [[160, 60], [-160, 60], [160, -80], [-160, -80], [0, 160], [0, -160], [220, 0], [-220, 0]].find(([dx, dy]) => !hot(S.px + dx, S.py + dy) && !World.terrainAt(S.px + dx, S.py + dy).blocked && !World.terrainAt(S.px + dx, S.py + dy).water) || [160, 60];
  const p = __toScr(S.px + off[0], S.py + off[1]); return { sx: p.x, sy: p.y, from: { x: S.px, y: S.py }, to: { x: S.px + off[0], y: S.py + off[1] } };
});
await page.mouse.click(aim.sx, aim.sy); await page.waitForTimeout(120);
const clicked = await ev(() => ({ to: S.moveTo ? { x: Math.round(S.moveTo.x), y: Math.round(S.moveTo.y), act: S.moveTo.act } : null }));
const arrived = await ev(async a => { const d0 = U.dist(a.from.x, a.from.y, a.to.x, a.to.y), t0 = performance.now(); while (performance.now() - t0 < 4000 && U.dist(S.px, S.py, a.to.x, a.to.y) > d0 - 40) await __wait(50); return { now: { x: Math.round(S.px), y: Math.round(S.py) }, closer: U.dist(S.px, S.py, a.to.x, a.to.y) < d0 - 40, ms: Math.round(performance.now() - t0) }; }, aim);
ok('THE CLICK, LIVE: a real click on plain ground a few strides from the walker sets the walk to the very point under the cursor, and the walker goes there',
  !!clicked.to && !clicked.to.act && Math.abs(clicked.to.x - Math.round(aim.to.x)) < 6 && Math.abs(clicked.to.y - Math.round(aim.to.y)) < 6 && arrived.closer, JSON.stringify({ aim, clicked, arrived }));

/* ================= 4 · THE PAUSE ================= */
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
const paused = await ev(async () => { const t0 = S.time; await __wait(500); return { sheet: !document.getElementById('pause').classList.contains('hidden'), frozen: S.time === t0, diag: document.getElementById('pauseDiag').textContent }; });
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
const resumed = await ev(async () => { const t0 = S.time; await __wait(400); return { sheet: !document.getElementById('pause').classList.contains('hidden'), runs: S.time > t0 }; });
const pauseLive = await live();
ok('THE PAUSE: Esc raises the pause sheet and the world\'s clock stands still, the sheet\'s diagnosis reading the boots free; Esc again and the clock runs, the boots walk',
  paused.sheet && paused.frozen && /free — the road answers/.test(paused.diag) && !resumed.sheet && resumed.runs && pauseLive, JSON.stringify({ paused, resumed, pauseLive }));

/* ================= 5 · THE MAP ================= */
await page.keyboard.press('KeyM'); await page.waitForTimeout(300);
const mapOpen = await ev(async () => { const t0 = S.time; await __wait(400); return { sheet: !document.getElementById('mapWrap').classList.contains('hidden'), flag: UI.mapOpen, runs: S.time > t0, pauseOpt: !!UI.opts.mapPause }; });
await page.keyboard.press('KeyM'); await page.waitForTimeout(250);
const mapShut = await ev(() => ({ sheet: !document.getElementById('mapWrap').classList.contains('hidden'), flag: UI.mapOpen }));
const mapLive = await live();
ok('THE MAP: M opens the survey sheet and the walk goes on beneath it (the map\'s pause is the player\'s option, off by default); M closes it, flag and sheet together, and the boots walk',
  mapOpen.sheet && mapOpen.flag && mapOpen.runs && !mapOpen.pauseOpt && !mapShut.sheet && !mapShut.flag && mapLive, JSON.stringify({ mapOpen, mapShut, mapLive }));

/* ================= 6 · THE SKILLS ================= */
await page.keyboard.press('KeyK'); await page.waitForTimeout(250);
const skills = await ev(async () => { const t0 = S.time; await __wait(400); return { sheet: !document.getElementById('skillsOv').classList.contains('hidden'), frozen: S.time === t0, modal: UI.anyModal() }; });
await page.keyboard.press('KeyK'); await page.waitForTimeout(200);
const skillsShut = await ev(() => document.getElementById('skillsOv').classList.contains('hidden'));
const skillsLive = await live();
ok('THE SKILLS: K opens the character sheet, a document that holds the world while it is read; K folds it and the boots walk',
  skills.sheet && skills.frozen && skills.modal && skillsShut && skillsLive, JSON.stringify({ skills, skillsShut, skillsLive }));

/* ================= 7 · THE BLUEPRINT ================= */
await ev(() => { State.addCargo(State.makeItem('ladderTool')); });
await page.keyboard.press('KeyB'); await page.waitForTimeout(200);
const bar = await ev(() => ({ shown: !document.getElementById('buildBar').classList.contains('hidden'), opts: [...document.querySelectorAll('#buildBar [data-b]')].map(b => b.dataset.b) }));
await page.keyboard.press('Digit1'); await page.waitForTimeout(200);
const hung = await ev(() => ({ place: S.place ? S.place.type : null, bar: !document.getElementById('buildBar').classList.contains('hidden') }));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
const putAway = await ev(() => ({ place: S.place, pause: !document.getElementById('pause').classList.contains('hidden'), gates: UI.gateReport() }));
const bpLive = await live();
ok('THE BLUEPRINT: B opens the build bar, its first key hangs the ladder\'s blueprint in hand (the bar folding), and Esc puts the blueprint away — not the pause sheet — leaving no gate; the boots walk',
  bar.shown && bar.opts[0] === 'ladder' && hung.place === 'ladder' && !hung.bar && putAway.place === null && !putAway.pause && putAway.gates.length === 0 && bpLive, JSON.stringify({ bar, hung, putAway, bpLive }));

/* ================= 8 · THE TAILOR ================= */
await ev(() => { S.px = DATA.stations.haven.x + 30; S.py = DATA.stations.haven.y + 50; S.moveTo = null; });
await page.waitForTimeout(400);
await page.keyboard.press('KeyT'); await page.waitForTimeout(250);
const tailor = await ev(async () => { const t0 = S.time; await __wait(400); return { sheet: !document.getElementById('tailorOv').classList.contains('hidden'), frozen: S.time === t0, modal: UI.anyModal() }; });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
const tailorEsc = await ev(() => ({ sheet: !document.getElementById('tailorOv').classList.contains('hidden'), pause: !document.getElementById('pause').classList.contains('hidden') }));
await page.keyboard.press('KeyT'); await page.waitForTimeout(200);
const torn = await ev(() => { UI.closeAllModals(); return document.getElementById('tailorOv').classList.contains('hidden'); });
await ev(() => { S.px = DATA.stations.haven.x + 360; S.py = DATA.stations.haven.y + 240; S.moveTo = null; });
const tailorLive = await live();
ok('THE TAILOR: at the terminal T opens the Appearance sheet, a modal like the rest (the world held, travel refused); Esc answers it like every other sheet (the tailor closed, no pause sheet in its place), and the whole-sheet teardown takes it too; the boots walk',
  tailor.sheet && tailor.frozen && tailor.modal && !tailorEsc.sheet && !tailorEsc.pause && torn && tailorLive, JSON.stringify({ tailor, tailorEsc, torn, tailorLive }));

/* ================= 9 · THE FUZZ ================= */
const KEYSET = ['Escape', 'KeyM', 'KeyK', 'KeyB', 'KeyT', 'Digit1', 'Space', 'KeyD'];
let seed = 20250928; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
const pressed = [];
for (let i = 0; i < 60; i++) { const k = KEYSET[Math.floor(rnd() * KEYSET.length)]; pressed.push(k); await page.keyboard.press(k); await page.waitForTimeout(40); }
for (let i = 0; i < 8; i++) { const open = await ev(() => UI.anyModal() || !!S.place || !document.getElementById('buildBar').classList.contains('hidden')); if (!open) break; await page.keyboard.press('Escape'); await page.waitForTimeout(120); const stillPlace = await ev(() => !!S.place); if (!stillPlace) { const bb = await ev(() => !document.getElementById('buildBar').classList.contains('hidden')); if (bb) await page.keyboard.press('KeyB'); } }
await page.waitForTimeout(200);
const fuzzed = await ev(() => ({ gates: UI.gateReport(), modal: UI.anyModal(), place: !!S.place, ts: S.timeScale }));
await ev(() => { S.px = DATA.stations.haven.x + 360; S.py = DATA.stations.haven.y + 240; S.moveTo = null; });
const fuzzLive = await live();
ok('THE FUZZ: sixty seeded presses across every sheet\'s key (Esc, M, K, B, T, the digit, the brace, the walk), then the sheets put away — no gate stranded, no modal left, the clock at speed, and the boots walk',
  fuzzed.gates.length === 0 && !fuzzed.modal && !fuzzed.place && fuzzed.ts === 1 && fuzzLive, JSON.stringify({ fuzzed, fuzzLive, pressed: pressed.join(' ') }));

/* ================= 10–13 · THE WATCHDOG'S FOUR REPAIRS ================= */
const within = (test) => ev(async src => { const f = eval(src); const t0 = performance.now(); while (performance.now() - t0 < 2000) { if (f()) return Math.round(performance.now() - t0); await __wait(50); } return -1; }, test.toString());
/* a paused clock with no pause sheet */
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await ev(() => { document.getElementById('pause').classList.add('hidden'); window.__t0 = S.time; });
const wd1 = await within(() => S.time > window.__t0 + 0.05);
const wd1Live = await live();
ok('THE WATCHDOG — A PAUSE WITH NO SHEET: the clock left paused with its sheet gone (the frozen-input report\'s own shape) is freed inside two seconds — the world\'s clock running, the boots walking',
  wd1 >= 0 && wd1 < 2000 && wd1Live, JSON.stringify({ ms: wd1, live: wd1Live }));
/* a station sheet with nobody home */
await ev(() => { S.px = DATA.stations.haven.x + 360; S.py = DATA.stations.haven.y + 240; document.getElementById('stationOv').classList.remove('hidden'); window.__cur = UI.curStation; });
const wd2 = await within(() => document.getElementById('stationOv').classList.contains('hidden'));
await settle();
const aim2 = await ev(() => { const p = __toScr(S.px + 140, S.py - 40); return { sx: p.x, sy: p.y, x: S.px + 140, y: S.py - 40 }; });
await page.mouse.click(aim2.sx, aim2.sy); await page.waitForTimeout(150);
const wd2Walk = await ev(a => !!S.moveTo && Math.abs(S.moveTo.x - a.x) < 6 && Math.abs(S.moveTo.y - a.y) < 6, aim2);
ok('THE WATCHDOG — A STATION SHEET WITH NOBODY HOME: a station sheet standing with no station behind it (which eats every click while it stands) is taken down inside two seconds, and the next click walks',
  wd2 >= 0 && wd2 < 2000 && wd2Walk, JSON.stringify({ ms: wd2, walk: wd2Walk }));
/* a clock and a letterbox stranded with no scene running */
await ev(() => { S.moveTo = null; S.timeScale = 0.2; UI.setLetterbox(true); });
const wd3 = await within(() => S.timeScale === 1 && !document.body.classList.contains('cine'));
ok('THE WATCHDOG — A STRANDED CLOCK AND LETTERBOX: the world\'s time scale left slowed and the letterbox left up with no scene running are both restored inside two seconds',
  wd3 >= 0 && wd3 < 2000, JSON.stringify({ ms: wd3 }));
/* a zip state with no ride under it — the stranded state faults the sim each frame until the repair; the guard catches and reports it */
const zip = await expectFaults(/WAYLIGHT fault\] the sim/, async () => {
  await ev(() => { S.state = 'zip'; S.zip = null; });
  return within(() => S.state === 'walk');
});
const wd4Live = await live();
ok('THE WATCHDOG — A ZIP WITH NO RIDE: the walker left in the zip state with no line under them (the sim faulting on it every frame, each caught and reported by the guard) is set back on foot inside two seconds, and the boots walk',
  zip.r >= 0 && zip.r < 2000 && wd4Live, JSON.stringify({ ms: zip.r, caughtFaults: zip.faults, live: wd4Live }));

/* ================= 14 · A TYPE THIS BUILD NEVER HEARD OF ================= */
/* out to the title through the pause sheet (the valley saved as it stands), a windmill written into the saved valley, and
   CONTINUE back into it */
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.click('#leaveBtn'); await page.waitForTimeout(600);
const legacy = await ev(() => {
  const key = Object.keys(localStorage).find(k => /^waylight_save_v1/.test(k) && !/_bak$/.test(k)), j = JSON.parse(localStorage.getItem(key));
  j.structures.push({ id: 900001, type: 'windmill', x: j.px + 120, y: j.py - 60, ang: 0, hp: 77, by: 'you', likes: 0 });
  localStorage.setItem(key, JSON.stringify(j));
  return { key, n: j.structures.length, title: !document.getElementById('titleScreen').classList.contains('hidden') };
});
const faults0 = T.errors.length;
await page.click('#btnContinue'); await page.waitForTimeout(1500);
const typed = await ev(async () => {
  const st = S.structures.find(s => s.id === 900001), hp0 = st ? st.hp : null, t0 = S.time;
  await __wait(1500);
  return { found: !!st, type: st && st.type, orig: st && st.origType, hp0, hp1: st && st.hp, works: st ? Systems.workInfo(st) : 'none', ran: S.time > t0 + 0.5, name: DATA.structures.unmapped.name };
});
const legacyLive = await live();
ok('A TYPE THIS BUILD NEVER HEARD OF (v3.28c: the type ledger, past the v3.28a decay and the v3.28b attic): a save carrying a windmill loads it as UNMAPPED works with its own type carried on it — inert, no decay, producing nothing — and the world steps on without a single fault, the boots walking',
  legacy.title && typed.found && typed.type === 'unmapped' && typed.orig === 'windmill' && typed.hp0 === 77 && typed.hp1 === 77 && typed.works === null && typed.ran && T.errors.length === faults0 && legacyLive, JSON.stringify({ legacy, typed, legacyLive }));

/* ================= 15 · THE SABOTAGE ================= */
const wrenches = () => T.errors.filter(e => /the saboteur's wrench/.test(e)).length;
const sab = await expectFaults(/the saboteur's wrench/, async () => {
  await ev(() => { S.heat = { haven: 5 }; window.__eco = Economy.update; Economy.update = () => { throw new Error('the saboteur\'s wrench'); }; S.px = DATA.stations.haven.x + 360; S.py = DATA.stations.haven.y + 240; S.moveTo = null; });
  await page.waitForTimeout(300);
  const toast = await ev(() => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).find(t => /caught a fault in the sim/.test(t) && /saboteur/.test(t)) || null);
  const walked = await walk('KeyD');
  const heatHeld = await ev(() => S.heat.haven);   // the step past the throw never ran: the heat did not cool
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  const diag = await ev(() => document.getElementById('pauseDiag').textContent);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  await ev(() => { Economy.update = window.__eco; });
  await page.waitForTimeout(300); const c1 = wrenches(); await page.waitForTimeout(700); const c2 = wrenches();
  const heatNow = await ev(() => (S.heat && S.heat.haven) || 0);
  return { toast, walked, diag, heatHeld, heatNow, stopped: c1 === c2, during: c1 };
});
const sabLive = await live();
ok('THE SABOTAGE: the sim made to throw every frame never dies silently — the fault is reported on screen ("Waylight caught a fault in the sim — the walk continues", with its own message) and listed in the pause sheet\'s diagnosis, the walker keeps walking through it, and with the wrench gone the sim runs whole again',
  !!sab.r.toast && /the walk continues/.test(sab.r.toast) && /the saboteur's wrench/.test(sab.r.toast) && sab.r.walked.dx >= 25 && /faults caught:.*the sim: the saboteur's wrench/.test(sab.r.diag) && sab.faults >= 1
  && sab.r.heatHeld === 5 && sab.r.heatNow < 5 && sab.r.stopped && sabLive,
  JSON.stringify({ ...sab.r, caughtFaults: sab.faults, sabLive }));

/* ================= 16 · THE STILLNESS LAW ================= */
const still = await ev(async () => {
  S.px = DATA.stations.haven.x + 420; S.py = DATA.stations.haven.y + 260; S.moveTo = null; S.health = 100; S.bleeding = true; S.heat = {};
  __clearAmb(S.px, S.py, 1200);   // a walker passing on the road is not staged into a sampled frame
  /* a SETTLED frame: the camera given time to come to rest on a stopped walker (v3.35's correction) */
  let prev = null, steady = 0;
  for (let i = 0; i < 400 && steady < 20; i++) { await __frames(1); const c = [Render.cam.x, Render.cam.y, Render.cam.z]; steady = prev && Math.abs(c[0] - prev[0]) < 0.001 && Math.abs(c[1] - prev[1]) < 0.001 && Math.abs(c[2] - prev[2]) < 1e-5 ? steady + 1 : 0; prev = c; }
  const hp0 = S.health, g = document.getElementById('game').getContext('2d');
  const patch = () => g.getImageData(Math.round(innerWidth / 2 - 420), Math.round(innerHeight / 2 + 60), 220, 160).data;   // open ground off the walker's shoulder, under no HUD
  const a = patch(); await __frames(4); const b = patch(); await __frames(10); const c = patch();
  /* and the HUD's hearts, drawn twice at one moment of the bleed, are the same hearts: no jitter left on them either */
  const hc = document.getElementById('hpHearts'), hg = hc.getContext('2d'), t0 = S.time;
  UI.drawHearts(); const h1 = hg.getImageData(0, 0, hc.width, hc.height).data; S.time = t0; UI.drawHearts(); const h2 = hg.getImageData(0, 0, hc.width, hc.height).data;
  let hearts = 0; for (let i = 0; i < h1.length; i++) if (h1[i] !== h2[i]) hearts++;
  const out = { settled: steady >= 20, bleeding: S.bleeding, hurt: +(hp0 - S.health).toFixed(3), d1: __diff(a, b), d2: __diff(a, c), hearts, heartsDrawn: h1.some((v, i) => i % 4 === 3 && v > 0), cam: [Render.cam.x - prev[0], Render.cam.y - prev[1]] };
  S.bleeding = false; S.health = 100;
  return out;
});
ok('THE STILLNESS LAW (v3.30; measured on a SETTLED frame, v3.35\'s correction): bleeding — damage landing every frame — the walker stopped and the camera come to rest, the ground holds still to the pixel across four frames and across fourteen: no shake — and the HUD\'s hearts, drawn twice at one moment, carry no jitter',
  still.settled && still.bleeding && still.hurt > 0 && still.d1 === 0 && still.d2 === 0 && still.heartsDrawn && still.hearts === 0, JSON.stringify(still));

await T.finish('the player\'s page');
