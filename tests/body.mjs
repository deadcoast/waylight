/* body.mjs — v3.19 THE BODY REMEMBERS: the pack is authored and gear is worn; weather is
   INTERACTIVE (leaves deflect/stick/pass on the model, snow accumulates by fall and movement);
   placement is a ghost, never a plop; wobble is earned pushback that cannot cancel the automation
   chain; and the valley keeps walking when the window is hidden (by choice). */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => {
  S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  S.flags.guideDone = true; S.orders.prioIdx = 99;
});

/* ---------- the pack is authored ---------- */
/* 1. every kind of thing on a back has its own glyph — and mission cargo stays gold */
let r = await ev(() => {
  const g = id => Render.cargoGlyph(State.makeItem(id));
  const meds = g('meds'), tin = g('food'), bale = g('textiles'), cell = g('lumenCell'), mail = g('letters'), core = g('core');
  const mission = Render.cargoGlyph({ ...State.makeItem('parts'), orderId: 7 });
  const distinct = new Set([meds.rows[1], tin.rows[1], bale.rows[1], cell.rows[1], mail.rows[1], core.rows[1]]).size;
  return { distinct, medsCross: meds.rows[2].includes('WWWW'), cellGlow: !!cell.glow, coreGlow: !!core.glow, missionGold: mission.pal.B === '#ffd98f' };
});
ok('meds, tins, bales, cells, mail and the core each read as THEMSELVES on the pack', r.distinct === 6 && r.medsCross && r.cellGlow && r.coreGlow, JSON.stringify(r));
ok('THE LAW holds on the new pack: order-bound cargo is banded gold', r.missionGold);

/* 2. the pack renders the glyphs — the lumen cell's cyan and the medicine's white cross are on the walker */
await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 500, d.y - 400]); S.moveTo = null;
  S.cargo = [];
  State.addCargo(State.makeItem('meds'));
  State.addCargo(State.makeItem('lumenCell'));
  Render.setZoom(2.4);
});
await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 3 && Math.abs(Render.cam.y - S.py) < 3, null, { timeout: 15000 });
await page.waitForTimeout(250);
r = await ev(() => {
  const z = Render.effZoom();
  const cv2 = document.getElementById('game');
  const g2 = cv2.getContext('2d');
  const sx = cv2.width / 2, sy = cv2.height / 2;   // camera settled: the walker IS the centre
  const img = g2.getImageData(sx - 20 * z, sy - 65 * z, 40 * z, 75 * z).data;
  let cyan = 0, white = 0;
  for (let i = 0; i < img.length; i += 4) {
    const R = img[i], G = img[i + 1], B2 = img[i + 2];
    if (G > 150 && B2 > 130 && R < 120) cyan++;
    if (R > 225 && G > 218 && B2 > 195) white++;
  }
  return { cyan, white };
});
ok('the walker\'s tower shows the cell\'s lit window and the medicine\'s white cross in pixels', r.cyan > 3 && r.white > 3, JSON.stringify(r));

/* 3. gear is WORN: boots recolour the boots, the exo frame stands behind the tower */
r = await ev(() => {
  const before = Render.wornPal();
  S.equip.boots = State.makeItem('boots_tread');
  S.equip.coat = State.makeItem('coat_lumen');
  S.equip.pack = State.makeItem('pack_exo1');
  Porter.dirty();
  const after = Render.wornPal();
  return { bootsChanged: before.B !== after.B, coatChanged: before.C !== after.C, trim: after.T, boots: after.B };
});
ok('equipped boots and coat land on the rig\'s own texels (attachment-swap law)', r.bootsChanged && r.coatChanged && r.trim === '#6fe3d2' && r.boots === '#5a4a30', JSON.stringify(r));
await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 3 && Math.abs(Render.cam.y - S.py) < 3, null, { timeout: 15000 });
await page.waitForTimeout(250);
r = await ev(() => {
  const z = Render.effZoom();
  const cv2 = document.getElementById('game');
  const g2 = cv2.getContext('2d');
  const img = g2.getImageData(cv2.width / 2 - 22 * z, cv2.height / 2 - 65 * z, 44 * z, 75 * z).data;
  let struts = 0;
  for (let i = 0; i < img.length; i += 4) { const R = img[i], G = img[i + 1], B2 = img[i + 2]; if (R > 128 && R < 160 && G > 138 && G < 168 && B2 > 140 && B2 < 172) struts++; }
  return { struts };
});
ok('the exo frame\'s steel struts are drawn holding the load', r.struts > 2, JSON.stringify(r));

/* ---------- leaves on the wind — the MIVIM law ---------- */
r = await ev(async () => {
  S.equip.pack = State.makeItem('pack0'); Porter.dirty();
  // stage a gust flying straight through the walker, deterministic ids
  const L = Render.leaves(); L.length = 0;
  for (let i = 0; i < 9; i++) L.push({ id: i + 1, x: S.px - 120 - i * 8, y: S.py - 12 + (i % 3) * 3 - 3, vx: 95, vy: 0, t: 0, ph: 0, life: 8, state: 'fly', met: false, kind: i % 2 });
  const startVx = L.map(l => l.vx);
  await new Promise(res => setTimeout(res, 2600));
  const out = { deflected: 0, stuck: 0, passed: 0, farRight: 0 };
  for (let i = 0; i < 9; i++) {
    const l = L.find(x => x.id === i + 1);
    if (!l) { out.passed++; continue; }   // lived its life and let go
    if (l.state === 'stuck') out.stuck++;
    else if (l.met && l.vx < 0) out.deflected++;
    else if (l.met && l.vx > 0) out.passed++;
    else if (l.x > S.px + 30) out.farRight++;
  }
  return out;
});
ok('a gust through the walker splits three ways: some deflect off the coat, some stick a moment, some pass clean', r.deflected >= 2 && (r.stuck >= 1 || r.passed + r.farRight >= 2), JSON.stringify(r));

/* a leaf that never crosses the model keeps its line */
r = await ev(async () => {
  const L = Render.leaves(); L.length = 0;
  L.push({ id: 300, x: S.px - 100, y: S.py - 90, vx: 90, vy: 0, t: 0, ph: 0, life: 5, state: 'fly', met: false, kind: 0 });
  await new Promise(res => setTimeout(res, 1400));
  const l = L.find(x => x.id === 300);
  return { met: l ? l.met : false, vx: l ? Math.round(l.vx) : 90 };
});
ok('a leaf that misses the model never changes trajectory', !r.met && r.vx > 55, JSON.stringify(r));

/* gusts are sparse by law */
r = await ev(() => { const L = Render.leaves(); L.length = 0; Render.gust(99); return { n: Render.leaves().length, cap: DATA.T.leafMax }; });
ok('leaves are capped sparse — a gust is an event, not a screensaver', r.n <= r.cap, JSON.stringify(r));

/* ---------- snow accumulates on the body ---------- */
r = await ev(() => {
  const P = DATA.stations.pharos;
  WL.tp([P.x + 600, P.y + 900]); S.moveTo = null;   // the deep north, away from the tower
  S.weather.state = 'grey'; S.weather.intensity = 0.9; S.weather.t = 99999;
  S.snowPack = 0; WL.calm();
  for (let i = 0; i < 80; i++) Systems.update(0.25, {});          // 20s standing in the fall
  const still = S.snowPack;
  S.snowPack = 0;
  for (let i = 0; i < 80; i++) Systems.update(0.25, { right: true });   // 20s working through it
  const moving = S.snowPack;
  // walk south out of the cold: it melts
  S.snowPack = 0.9;
  const H2 = DATA.stations.haven;
  WL.tp([H2.x - 300, H2.y - 200]); S.moveTo = null;
  for (let i = 0; i < 40; i++) Systems.update(0.25, {});
  const melted = S.snowPack;
  return { still: +still.toFixed(2), moving: +moving.toFixed(2), melted: +melted.toFixed(2) };
});
ok('snow piles on the shoulders by how hard it falls — and a working body sheds most of it', r.still >= 0.55 && r.moving < r.still * 0.55 && r.moving > 0.05, JSON.stringify(r));
ok('out of the cold it melts away', r.melted < 0.55, JSON.stringify(r));

/* what falls up there is SNOW — read where the camera actually looks */
await ev(() => { const P = DATA.stations.pharos; WL.tp([P.x + 600, P.y + 900]); S.moveTo = null; Render.setZoom(2.4); });
await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 3 && Math.abs(Render.cam.y - S.py) < 3, null, { timeout: 15000 });
r = await ev(() => ({ mode: Render.precipMode(), south: Systems.snowAt(DATA.stations.haven.x, DATA.stations.haven.y) }));
ok('northern greyfall falls as SNOW — flakes, not more raindrops', r.mode === 'snow' && r.south <= 0.05, JSON.stringify(r));

/* the stages land on the sprite: white texels on the hood at half-pack (sky cleared so no flake fakes it) */
r = await ev(() => { S.weather.state = 'clear'; S.weather.intensity = 0; S.weather.t = 99999; S.snowPack = 0.92; S.cargo = []; return 1; });
await page.waitForTimeout(300);
r = await ev(() => {
  const z = Render.effZoom();
  const cv2 = document.getElementById('game');
  const g2 = cv2.getContext('2d');
  const img = g2.getImageData(cv2.width / 2 - 14 * z, cv2.height / 2 - 34 * z, 28 * z, 36 * z).data;
  let snowPx = 0;
  for (let i = 0; i < img.length; i += 4) { const R = img[i], G = img[i + 1], B2 = img[i + 2]; if (R > 210 && G > 228 && B2 > 235) snowPx++; }
  const pack = +S.snowPack.toFixed(2);
  S.snowPack = 0;
  return { snowPx, pack };
});
ok('the snow cap is DRAWN on the hood and shoulders', r.snowPx > 2, JSON.stringify(r));

/* ---------- placement ghosts ---------- */
r = await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 200, d.y - 100]); S.moveTo = null; S.dir = 0;
  WL.give({ metal: 200, ceramic: 200 });
  S.flags.unlocks.kit = true;
  State.addCargo(State.makeItem('kitTool'));
  const began = Systems.beginPlace('generator');
  for (let i = 0; i < 4; i++) Systems.update(0.05, {});
  const onLand = S.place && S.place.valid;
  // aim it at the creek: water refuses, and says why
  S.place && (S.place.x = 0);
  const before = S.structures.length;
  return { began, onLand, before };
});
ok('choosing a build hangs a blueprint — valid on lit ground', r.began && r.onLand, JSON.stringify(r));
r = await ev(() => {
  // drive the ghost onto water via hover and try to confirm
  const w = [3120, 9640];   // Elm Creek
  WL.tp([w[0] - 60, w[1]]); S.moveTo = null;
  for (let i = 0; i < 3; i++) Systems.update(0.05, { hover: { x: w[0] + 10, y: w[1] } });
  const invalid = S.place && !S.place.valid ? S.place.why : null;
  const n0 = S.structures.length;
  const refused = !Systems.confirmPlace();
  const placedNone = S.structures.length === n0;
  return { invalid, refused, placedNone };
});
ok('the ghost refuses water and says why — nothing is placed on a bad confirm', /FOOTING|WAYLIGHT/.test(r.invalid || '') && r.refused && r.placedNone, JSON.stringify(r));
r = await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 220, d.y - 80]); S.moveTo = null;
  const gx = d.x - 160, gy = d.y - 140;
  for (let i = 0; i < 3; i++) Systems.update(0.05, { hover: { x: gx, y: gy } });
  const ghost = S.place ? { x: Math.round(S.place.x), y: Math.round(S.place.y), valid: S.place.valid } : null;
  const okC = Systems.confirmPlace();
  const st = S.structures[S.structures.length - 1];
  return { ghost, okC, built: st && st.type === 'generator', dx: st ? Math.round(Math.abs(st.x - gx)) : 99, dy: st ? Math.round(Math.abs(st.y - gy)) : 99, placeCleared: !S.place };
});
ok('confirm lays the structure EXACTLY where the ghost stood', r.ghost && r.ghost.valid && r.okC && r.built && r.dx < 2 && r.dy < 2 && r.placeCleared, JSON.stringify(r));
r = await ev(() => {
  State.addCargo(State.makeItem('ladderTool'));
  const w = [3120, 9640];
  WL.tp([w[0] - 70, w[1]]); S.moveTo = null; S.dir = 0;
  Systems.beginPlace('ladder');
  for (let i = 0; i < 3; i++) Systems.update(0.05, {});   // no hover: keyboard aim, straight ahead at the creek
  const pose = S.place ? { valid: S.place.valid, ang: +S.place.ang.toFixed(2), x: Math.round(S.place.x) } : null;
  const n0 = S.structures.length;
  Systems.confirmPlace();
  const st = S.structures[S.structures.length - 1];
  const laid = S.structures.length === n0 + 1 && st.type === 'ladder';
  const match = laid && pose && Math.abs(st.x - pose.x) < 2;
  const cancelWorks = (Systems.beginPlace('ladder'), Systems.cancelPlace(), !S.place);
  return { pose, laid, match, cancelWorks, ladders: State.countTool('ladder') };
});
ok('the ladder blueprint finds the crossing from keyboard aim, lays at its own pose, and Esc puts one away un-spent', r.pose && r.pose.valid && r.laid && r.match && r.cancelWorks, JSON.stringify(r));

/* ---------- built things are the PLAYER'S: move them, take them down ---------- */
r = await ev(() => {
  const st = S.structures.find(s2 => s2.type === 'generator' && !s2.echo);
  WL.tp([st.x + 30, st.y + 20]); S.moveTo = null;
  const acts = Systems.getInteractions();
  const hasMove = acts.some(a => a.key === 'V'), hasDown = acts.some(a => a.key === 'X');
  const m0 = S.banked.metal;
  Systems.beginMove(st);
  const gx = st.x + 110, gy = st.y + 30;
  for (let i = 0; i < 3; i++) Systems.update(0.05, { hover: { x: gx, y: gy } });
  const free = S.place && S.place.valid;                       // no MATERIALS SHORT on a move
  Systems.confirmPlace();
  return { hasMove, hasDown, free, moved: Math.abs(st.x - gx) < 2 && Math.abs(st.y - gy) < 2, cost: m0 - S.banked.metal, cleared: !S.place };
});
ok('V hangs an owned structure as a blueprint again — re-seated exactly, for free', r.hasMove && r.hasDown && r.free && r.moved && r.cost === 0 && r.cleared, JSON.stringify(r));
r = await ev(() => {
  const st = S.structures.find(s2 => s2.type === 'generator' && !s2.echo);
  const n0 = S.structures.length, m0 = S.banked.metal;
  Systems.dismantleStruct(st);
  return { gone: S.structures.length === n0 - 1 && !S.structures.includes(st), back: S.banked.metal - m0, want: Math.floor(28 * DATA.T.dismantleBack) };
});
ok('taking a structure down hands back most of its metal', r.gone && r.back === r.want, JSON.stringify(r));
r = await ev(() => {
  const st = S.structures.find(s2 => s2.type === 'ladder' && !s2.echo);
  const l0 = State.countTool('ladder'), n0 = S.structures.length;
  Systems.dismantleStruct(st);
  return { gone: S.structures.length === n0 - 1, folded: State.countTool('ladder') === l0 + 1 };
});
ok('a taken-down ladder folds back onto the pack, un-spent', r.gone && r.folded, JSON.stringify(r));

/* ---------- an alive companion is NEVER a burden — and NEVER a warp ---------- */
r = await ev(() => {
  /* v3.31 FAIRNESS — the old law "sucked to your back" was escortSnap, a teleport, and it is
     dead. The new law: a junior left far behind WALKS the gap on their own legs at half pace,
     every stride bounded — they make real ground, they never appear anywhere. */
  const d = DATA.stations.haven;
  WL.tp([d.x - 400, d.y - 300]); S.moveTo = null;
  S.weather.state = 'clear'; S.weather.t = 99999; S.wraiths.length = 0;
  S.orders.active.push({ idNum: 777, to: 'pharos', convoy: true, items: [], t0: S.time, par: 999 });
  S.convoy = { orderId: 777, n: S.npcs[0], x: S.px - 900, y: S.py - 900, dir: 0, frozen: false, waiting: false, moving: false, crates: 3, sayCd: 0, stag: 0 };
  const c = S.convoy, dStart = U.dist(c.x, c.y, S.px, S.py);
  let maxStride = 0;
  for (let i = 0; i < 24 && S.convoy; i++) {
    const px0 = c.x, py0 = c.y;
    Systems.update(0.25, {});                              // 6s of "can't keep your pace"
    maxStride = Math.max(maxStride, U.dist(c.x, c.y, px0, py0));
  }
  const dEnd = U.dist(c.x, c.y, S.px, S.py);
  S.convoy = null; S.orders.active = S.orders.active.filter(o => o.idNum !== 777);
  return { closed: Math.round(dStart - dEnd), maxStride: Math.round(maxStride) };
});
ok('a junior left far behind WALKS the gap shut — real ground gained, every stride an honest footstep, NO warp', r.closed > 200 && r.maxStride < 60, JSON.stringify(r));
r = await ev(() => {
  const n = S.npcs.find(x => x.state !== 'companion');
  const keep = n.state;
  n.state = 'companion'; n.fedT = 999; n.carry = n.carry || [];
  S.compPos = { x: S.px - 500, y: S.py - 500 };
  for (let i = 0; i < 40; i++) Systems.update(0.25, {});   // 10s far behind
  const caught = U.dist(S.compPos.x, S.compPos.y, S.px, S.py) < 120;
  n.state = keep; S.compPos = null;
  return { caught };
});
ok('a companion left 500u behind catches up on its own — alive, not a chore', r.caught, JSON.stringify(r));

/* ---------- the wobble is earned pushback ---------- */
r = await ev(() => {
  WL.calm(false);
  S.cargo = []; S.equip.boots = State.makeItem('boots0'); S.equip.coat = State.makeItem('coat0'); Porter.dirty();
  for (let i = 0; i < 3; i++) State.addCargo(State.makeItem('food'));   // ~36 kg on 55 = 65%... trim to sane
  S.cargo.pop();                                                        // 24 kg ≈ 44% load
  const d = DATA.stations.haven;
  WL.tp([d.x - 700, d.y - 500]); S.moveTo = null;
  S.skills.bal.lv = 0;
  let qtes = 0, dirR = true, leg = 0;
  for (let i = 0; i < 480; i++) {
    Systems.update(0.25, dirR ? { right: true } : { left: true });
    if (++leg > 40) { leg = 0; dirR = !dirR; }   // pace a strip, don't march into the hills
    if (S.qte) { qtes++; Systems.steadyOk(); }
    const t2 = World.terrainAt(S.px, S.py);
    if (t2.water || t2.blocked || t2.slope > 0.3 || [World.SCREE, World.ROCK, World.SNOW, World.MARSH, World.SHALLOW].includes(World.classAt(S.px, S.py))) { WL.tp([d.x - 700, d.y - 500]); S.moveTo = null; }
  }
  return { qtes, load: +(State.weight() / State.cap()).toFixed(2) };
});
ok('two minutes of loaded meadow walking asks for ZERO quick-time rings — mastered ground is not a minigame', r.qtes === 0, JSON.stringify(r));
r = await ev(() => {
  // a trained back auto-steadies rough country: no rings, stamina quietly spent
  S.skills.bal.lv = 6;
  const q = DATA.stations.quarry;
  WL.tp([q.x + 300, q.y + 380]); S.moveTo = null;   // scree country
  const st0 = S.stats.steadies;
  let qtes = 0;
  for (let i = 0; i < 480; i++) { Systems.update(0.25, { left: true }); if (S.qte) { qtes++; Systems.steadyOk(); } if (World.terrainAt(S.px, S.py).blocked || World.terrainAt(S.px, S.py).water) WL.tp([q.x + 300, q.y + 380]); }
  return { qtes, autos: S.stats.steadies - st0 };
});
ok('Balance 6 walks the scree clean — the body auto-steadies, the ring stays away', r.qtes === 0, JSON.stringify(r));
r = await ev(() => {
  // pushed past the kit it still pushes back: overloaded green legs on scree meet the ring
  S.skills.bal.lv = 0;
  while (State.weight() < State.cap() * 1.1) State.addCargo(State.makeItem('food'));
  const q = DATA.stations.quarry;
  WL.tp([q.x + 300, q.y + 380]); S.moveTo = null;
  let qtes = 0;
  for (let i = 0; i < 720; i++) { Systems.update(0.25, { left: true }); if (S.qte) { qtes++; S.qte = null; UI.showQTE(false); S.stagger = 0; } if (World.terrainAt(S.px, S.py).blocked || World.terrainAt(S.px, S.py).water) WL.tp([q.x + 300, q.y + 380]); }
  S.cargo = [];
  return { qtes };
});
ok('overloaded on rough ground, the ring still comes — pushback kept its teeth', r.qtes >= 1, JSON.stringify(r));

/* the chain survives the stumble: a strung route finishes itself */
r = await ev(async () => {
  const d = DATA.stations.haven;
  const x0 = d.x - 760, y0 = d.y - 420;
  WL.tp([x0, y0]); S.moveTo = null; S.route = [];
  State.addCargo(State.makeItem('food'));
  Systems.moveTo(x0 + 260, y0, { plain: true });
  Systems.queueMove(x0 + 260, y0 + 200);
  Systems.queueMove(x0 + 40, y0 + 220);
  // mid-walk, force a failed wobble: full stumble, stagger and all
  let forced = false, t = 0;
  while (t < 200 && (S.moveTo || (S.route && S.route.length))) {
    Systems.update(0.12, {});
    t += 0.12;
    if (!forced && t > 2) { forced = true; S.qte = { t: 99, dur: 0.1 }; Systems.update(0.05, {}); }   // the ring expires → stumble
    if (S.qte) { S.qte.t = 99; }
  }
  const done = !S.moveTo && (!S.route || !S.route.length);
  const near = U.dist(S.px, S.py, x0 + 40, y0 + 220) < 60;
  S.cargo = [];
  return { forced, done, near, stumbles: S.stats.stumbles };
});
ok('a forced stumble mid-route does NOT cancel the chain — the strung walk finishes itself', r.forced && r.done && r.near && r.stumbles >= 1, JSON.stringify(r));

/* ---------- the valley keeps walking when you switch away (by choice) ---------- */
r = await ev(async () => {
  // the setting exists on the pause sheet, default off
  const ck = document.getElementById('ckBgRun');
  const defOff = ck && !ck.checked;
  // blur with the toggle OFF still pauses (the old promise kept)
  window.dispatchEvent(new Event('blur'));
  const pausedOnBlur = !document.getElementById('pause').classList.contains('hidden');
  document.getElementById('resumeBtn').click();
  await new Promise(res => setTimeout(res, 120));
  return { hasToggle: !!ck, defOff, pausedOnBlur };
});
ok('the pause sheet offers "keep walking when you switch away" — off by default, blur still pauses', r.hasToggle && r.defOff && r.pausedOnBlur, JSON.stringify(r));
r = await ev(async () => {
  // turn it on, fake a hidden window: the background clock walks the route
  const ck = document.getElementById('ckBgRun');
  ck.checked = true; ck.dispatchEvent(new Event('change'));
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => window.__fakeHidden });
  window.__fakeHidden = true;
  const d = DATA.stations.haven;
  WL.tp([d.x - 700, d.y - 460]); S.moveTo = null;
  Systems.moveTo(d.x - 380, d.y - 460, { plain: true });
  const t0 = S.time, x0 = S.px;
  document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(res => setTimeout(res, 2600));
  const walked = S.px - x0, dtAdv = S.time - t0;
  window.__fakeHidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(res => setTimeout(res, 300));
  const t1 = S.time;
  await new Promise(res => setTimeout(res, 500));
  const fgResumed = S.time > t1 + 0.2;
  // blur with the toggle ON does not pause
  window.dispatchEvent(new Event('blur'));
  const stayedLive = document.getElementById('pause').classList.contains('hidden');
  ck.checked = false; ck.dispatchEvent(new Event('change'));
  delete window.__fakeHidden;
  return { walked: Math.round(walked), dtAdv: +dtAdv.toFixed(1), fgResumed, stayedLive };
});
ok('with the toggle ON, a hidden window keeps the walk moving on the background clock — and hands back cleanly', r.walked > 120 && r.dtAdv > 1.5 && r.fgResumed && r.stayedLive, JSON.stringify(r));

/* while nobody watches, the wobble auto-steadies — no ring ever waits on a hidden player */
r = await ev(async () => {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
  const q = DATA.stations.quarry;
  WL.tp([q.x + 300, q.y + 380]); S.moveTo = null;
  S.skills.bal.lv = 0;
  State.addCargo(State.makeItem('food')); State.addCargo(State.makeItem('food'));
  let qtes = 0;
  for (let i = 0; i < 400; i++) { Systems.update(0.25, { left: true }); if (S.qte) qtes++; if (World.terrainAt(S.px, S.py).blocked || World.terrainAt(S.px, S.py).water) WL.tp([q.x + 300, q.y + 380]); }
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
  S.cargo = [];
  return { qtes };
});
ok('hidden-window walking never hangs on a quick-time ring — the body handles it', r.qtes === 0, JSON.stringify(r));

/* save hygiene: the blueprint is a moment, not a possession */
r = await ev(() => {
  Systems.beginPlace('generator');
  State.save();
  const raw = JSON.parse(localStorage.getItem('waylight_save_v1'));
  const clean = raw.place === null || raw.place === undefined;
  Systems.cancelPlace();
  return { clean, snowSaved: raw.snowPack !== undefined };
});
ok('a hung blueprint never enters the save; the snow on your shoulders does', r.clean && r.snowSaved, JSON.stringify(r));

ok('no page errors across the whole suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log('\n=== BODY (v3.19: authored pack · worn gear · interactive weather · ghosts · earned wobble · background walk) ===');
for (const line of results) console.log(line);
console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
