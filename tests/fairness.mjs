/* fairness.mjs — v3.31 THE FAIRNESS PASS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). Ten checks that measure the WORLD, not the code's opinion of it: the world's
   own step (Systems.update) run frame by frame from staged positions, the dice held where a check needs them. The chase obeys
   the world — a knife sprints 118 on the flat (never the old 152), taxed by the same ground the walker's own step reads, breaks at
   the 720 leash and gives up stalled against rock; mounted, the gap opens from 150 to past 600 in 3.5s and the runner calls it
   ("A horse. Forget it."); on foot, light and sprinting pulls away while loaded and walking is honestly caught. The hill is not a
   minigame — with the wobble LIVE (the calm flag cleared, every roll forced to fire) sixteen seconds on 0.32+ slope at a sane
   load ring ZERO times, while overload, sprinting rough ground and empty lungs still ring. The balk is a beat — water puts the
   rider down and the horse picks them back up on the far side, no button, no lockout, one line once; a chosen dismount stays
   dismounted. The ladder law — waypoints projected ONTO a real placed ladder's rungs, exactly, and a routed crossing sampled
   every 100ms crosses with every step bounded; and every warp killed — the convoy junior closes 200+ px on their own legs and
   a companion left far behind runs the gap, every stride bounded. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;

await ev(() => {
  WL.timeScale = 1e-9;   // the live clock held; the world is stepped here, frame by frame
  window.__in = (o = {}) => ({ up: false, down: false, left: false, right: false, shift: false, space: false, ml: false, mr: false, mouse: null, ...o });
  window.__open = (x, y) => { const t = World.terrainAt(x, y); return !t.blocked && !t.water; };
  window.__segOk = (x0, y0, x1, y1, ok2) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 8)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (!ok2(World.terrainAt(x, y), x, y)) return false; } return true; };
  window.__flat = t => !t.blocked && !t.water && t.cls === World.MEADOW && t.slope < 0.06;
  window.__rnd = (v, fn) => { const R = Math.random; Math.random = typeof v === 'function' ? v : () => v; try { return fn(); } finally { Math.random = R; } };
  /* a clean pack: the tools stay, the rest goes; then what the check wants on the back */
  window.__pack = (kg) => { for (const c of [...S.cargo]) if (c.cat !== 'tool') State.removeCargo(c.id); let w = 0; while (w + 0.8 <= kg) { State.addCargo(State.makeItem('ration')); w += 0.8; } };
  window.__camp = id => DATA.camps.find(c => c.id === id);
  /* the stage for a chase: the walker inside a camp's claim, one runner of the camp's own at a chosen spot, the rest of its
     knives off the board */
  window.__chase = (cid, wx, wy, rx, ry) => {
    const c = S.camps[cid]; c.pacified = false; S.state = 'walk'; S.qte = null; S.struggle = null; S.stagger = 0; S.moveTo = null; S.route = [];
    S.px = wx; S.py = wy; S.speed = 0;
    const run = { x: rx, y: ry, wa: 0, state: 'patrol', cd: 0, cls: 'knife' };
    for (const cd of DATA.camps) if (cd.id !== cid) S.camps[cd.id].runners = S.camps[cd.id].runners.filter(q => U.dist(q.x, q.y, wx, wy) > 1500);
    c.runners = [run];
    return run;
  };
  window.__said = [];
  const say0 = Render.say; Render.say = function (x, y, text, ...rest) { __said.push(String(text)); return say0.call(this, x, y, text, ...rest); };
  S.flags.calm = true; S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 };
  for (const n of NPC.party()) n.state = 'pool';
  S.weather = { state: 'clear', t: 99999, intensity: 0 }; S.eventCd = 99999;   // no weather turns and no road events mid-measure
  /* the keys that walk a direction: the eight a keyboard can press */
  window.__keys = (ux, uy) => ({ right: ux > 0.3, left: ux < -0.3, down: uy > 0.3, up: uy < -0.3 });
});

/* the ground for the chase: (A) a runner's lane of flat meadow pointing at a walker inside a camp's claim; (B) near a camp's
   heart, an open road running out through its claim for the walker to ride or run down, open ground behind for the knife */
const site = await ev(() => {
  const t0 = performance.now();
  window.__segOk = (x0, y0, x1, y1, ok2, step = 16) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; if (!ok2(World.terrainAt(x, y), x, y)) return false; } return true; };
  const dry = t => !t.blocked && !t.water;
  let A = null, B = null;
  for (const cd of DATA.camps) {
    for (let r = 0; r < cd.r * 0.8 && !A; r += 50) for (let a = 0; a < 6.28 && !A; a += 0.3) {
      const wx = cd.x + Math.cos(a) * r, wy = cd.y + Math.sin(a) * r;
      if (!dry(World.terrainAt(wx, wy))) continue;
      for (const d of [250, 350, 450, 550, 650]) for (let b = 0; b < 6.28 && !A; b += Math.PI / 8) {
        const ux = Math.cos(b), uy = Math.sin(b), rx = wx - ux * d, ry = wy - uy * d;   // the runner's lane may start outside the claim: the claim is the walker's
        if (!__flat(World.terrainAt(rx, ry))) continue;
        if (__segOk(rx, ry, rx + ux * 130, ry + uy * 130, __flat, 10)) A = { cid: cd.id, wx, wy, ux, uy, rx, ry, d, claim: cd.r };
      }
    }
    if (A) break;
  }
  /* (B) a long road of flat meadow — the same ground under the walker and the knife, so the race is the legs' alone */
  /* the valley is hills: a race road is open meadow that never runs DOWNHILL for the walker (downhill the walker's own step
     quickens and the knife's does not — the one ground where a loaded walk would outrun him is left out, honestly) */
  const road = (ux, uy) => t => !t.blocked && !t.water && t.cls === World.MEADOW && t.slope < 0.3 && (ux * (t.sx || 0) + uy * (t.sy || 0)) >= -0.02;
  for (let i = 0; i < 60000 && !B; i++) {
    const wx = 400 + ((i * 7919) % (World.W - 800)), wy = 400 + ((i * 104729) % (World.H - 800));   // a fixed sweep of the whole valley, the same every run
    const t = World.terrainAt(wx, wy);
    if (t.cls !== World.MEADOW || t.slope >= 0.3) continue;
    for (let b = 0; b < 8 && !B; b++) {
      const ux = Math.round(Math.cos(b * Math.PI / 4) * 1e6) / 1e6, uy = Math.round(Math.sin(b * Math.PI / 4) * 1e6) / 1e6, ok2 = road(ux, uy);
      if (!ok2(t) || !ok2(World.terrainAt(wx + ux * 560, wy + uy * 560)) || !ok2(World.terrainAt(wx - ux * 260, wy - uy * 260))) continue;
      if (__segOk(wx - ux * 260, wy - uy * 260, wx + ux * 560, wy + uy * 560, ok2, 12) && DATA.stationOrder.every(id => U.dist(wx, wy, DATA.stations[id].x, DATA.stations[id].y) > 500)) B = { cid: 'pass', wx, wy, ux, uy, tries: i };
    }
  }
  return A && B ? { ...A, road: B, ms: Math.round(performance.now() - t0) } : { A, B, ms: Math.round(performance.now() - t0) };
});

/* ================= 1 · THE SPRINT ================= */
let r = await ev(s => {
  __pack(3);
  const run = __chase(s.cid, s.wx, s.wy, s.rx, s.ry);
  const x0 = run.x, y0 = run.y, horn = Systems.towerOver(run.x, run.y);   // no watchtower's horn over the lane to slow him
  for (let i = 0; i < 10; i++) Systems.update(0.1, __in());
  const moved = Math.hypot(run.x - x0, run.y - y0), toward = ((run.x - x0) * s.ux + (run.y - y0) * s.uy);
  return { moved: +moved.toFixed(2), toward: +toward.toFixed(2), tuning: DATA.T.scrapSpeed, cd: run.cd, horn: horn || null, walkerStill: Math.hypot(S.px - s.wx, S.py - s.wy) < 0.01 };
}, site);
ok('THE SPRINT: a knife chasing across flat meadow covers 118 px in one second of the world\'s own step, straight at the walker — a pair of boots, not the old flat 152 tuned to catch',
  !!site && !!site.road && r.horn === null && Math.abs(r.moved - 118) < 0.6 && Math.abs(r.toward - r.moved) < 0.6 && r.tuning === 118, JSON.stringify({ site: site && { lane: site.cid, laneFrom: site.d, road: site.road && { x: Math.round(site.road.wx), y: Math.round(site.road.wy) } }, ...r }));

/* ================= 2 · THE SAME GROUND'S TAX ================= */
r = await ev(s => {
  const cd = __camp(s.cid), out = [];
  const want = [['steep meadow', t => t.cls === World.MEADOW && t.slope > 0.3], ['scree', t => t.cls === World.SCREE], ['forest', t => t.cls === World.FOREST], ['marsh', t => t.cls === World.MARSH], ['rock', t => t.cls === World.ROCK], ['snowfield', t => t.cls === World.SNOW]];
  for (const [name, test] of want) {
    let found = null;
    for (let rr = 60; rr < 1400 && !found; rr += 24) for (let a = 0; a < 6.28 && !found; a += 0.21) {
      const x = s.wx + Math.cos(a) * rr, y = s.wy + Math.sin(a) * rr, t = World.terrainAt(x, y);
      if (t.blocked || t.water || !test(t) || rr > 700) continue;
      const d = Math.hypot(s.wx - x, s.wy - y), nx = x + (s.wx - x) / d * 118 * 0.05, ny = y + (s.wy - y) / d * 118 * 0.05;
      if (World.terrainAt(nx, ny).blocked) continue;
      found = { x, y, t };
    }
    if (!found) continue;
    const run = __chase(s.cid, s.wx, s.wy, found.x, found.y);
    Systems.update(0.05, __in());
    const spd = Math.hypot(run.x - found.x, run.y - found.y) / 0.05;
    const expect = 118 * (found.t.p[0] || 1) * (found.t.slope > 0.06 ? 1 / (1 + found.t.slope * 1.7) : 1);
    out.push({ name, p0: found.t.p[0], slope: +found.t.slope.toFixed(3), spd: +spd.toFixed(2), expect: +expect.toFixed(2) });
  }
  /* the walker's own step reads the same ground multiplier: a stride on flat scree against a stride on flat meadow */
  __pack(3); S.flags.calm = true;
  const stride = (x, y) => { S.px = x; S.py = y; S.qte = null; S.stagger = 0; S.stam = S.stamMax; Systems.update(0.05, __in({ right: true })); return Math.hypot(S.px - x, S.py - y); };
  let scree = null;
  for (let i = 0; i < 40000 && !scree; i++) { const x = 400 + ((i * 7919) % (World.W - 800)), y = 400 + ((i * 104729) % (World.H - 800)), t = World.terrainAt(x, y); if (t.cls !== World.SCREE || t.slope >= 0.06) continue; const t2 = World.terrainAt(x + 8, y); if (t2.cls === World.SCREE && !t2.blocked) scree = { x, y }; }   // a fixed sweep: the same flat scree every run
  const walker = scree ? { meadow: +stride(s.rx, s.ry).toFixed(3), scree: +stride(scree.x, scree.y).toFixed(3) } : null;
  S.px = s.wx; S.py = s.wy;
  return { out, walker, ratio: walker ? +(walker.scree / walker.meadow).toFixed(3) : null };
}, site);
ok('THE SAME GROUND\'S TAX: the chase is taxed by the ground the runner stands on, the same terrain multipliers every walker\'s step reads — on steep meadow, scree, forest, marsh, rock or snow the knife runs exactly 118 × the ground\'s own pace × the slope\'s toll (1/(1 + 1.7·slope)), and the walker\'s own stride on flat scree is the same 0.78 of their stride on meadow',
  r.out.length >= 3 && r.out.every(o => Math.abs(o.spd - o.expect) < 0.5 && o.spd < 118) && r.out.some(o => o.name === 'steep meadow') && r.walker && Math.abs(r.ratio - 0.78) < 0.01, JSON.stringify(r));

/* ================= 3 · THE LEASH AND THE STALL ================= */
r = await ev(s => {
  __pack(3);
  const out = {};
  for (const d of [700, 730]) {
    const run = __chase(s.cid, s.wx, s.wy, s.wx - s.ux * d, s.wy - s.uy * d), x0 = run.x;
    const open = __open(run.x, run.y);
    Systems.update(0.1, __in());
    out[d] = { open, moved: +Math.hypot(run.x - x0, run.y - (s.wy - s.uy * d)).toFixed(2), cd: +run.cd.toFixed(2) };
  }
  /* a knife against rock: every way toward the walker blocked — straight, and sliding either way */
  let stall = null;
  for (const cd of DATA.camps) {
    for (let gx = cd.x - cd.r; gx < cd.x + cd.r && !stall; gx += 16) for (let gy = cd.y - cd.r; gy < cd.y + cd.r && !stall; gy += 16) {
      if (!__open(gx, gy) || U.dist(gx, gy, cd.x, cd.y) > cd.r) continue;
      const tg = World.terrainAt(gx, gy), step = 118 * (tg.p[0] || 1) * (tg.slope > 0.06 ? 1 / (1 + tg.slope * 1.7) : 1) * 0.1;   // the knife's own stride on this ground
      for (let a = 0; a < 6.28 && !stall; a += 0.2) {
        const vx = Math.cos(a) * step, vy = Math.sin(a) * step;
        if (!World.terrainAt(gx + vx, gy + vy).blocked || !World.terrainAt(gx + vx, gy).blocked || !World.terrainAt(gx, gy + vy).blocked) continue;
        const wx = gx + Math.cos(a) * 320, wy = gy + Math.sin(a) * 320;
        if (!__open(wx, wy) || U.dist(wx, wy, cd.x, cd.y) > cd.r * 0.9) continue;
        stall = { cid: cd.id, gx, gy, wx, wy };
      }
    }
    if (stall) break;
  }
  if (stall) {
    const run = __chase(stall.cid, stall.wx, stall.wy, stall.gx, stall.gy);
    const t = [], moved = [];
    for (let i = 0; i < 25; i++) { Systems.update(0.1, __in()); t.push(+run.cd.toFixed(1)); moved.push(Math.hypot(run.x - stall.gx, run.y - stall.gy)); }
    const gaveUp = t.findIndex(v => v > 14);
    out.stall = { stalledMoved: +Math.max(...moved.slice(0, gaveUp)).toFixed(2), cdAt19: t[18], cdAt21: t[21], gaveUp, inClaim: U.dist(stall.wx, stall.wy, __camp(stall.cid).x, __camp(stall.cid).y) < __camp(stall.cid).r };
  }
  S.px = s.wx; S.py = s.wy;
  return out;
}, site);
ok('THE LEASH AND THE STALL: the chase has a leash at 720 — a knife 700 px off still runs, one 730 px off breaks off (turned back for 12s) without a step; and a knife wedged against rock (every way toward the walker blocked, straight or sliding) stands stalled — not a pixel gained — and gives up after two seconds of it (turned back 15s) — feet, not ghosts',
  r[700].open && r[700].moved > 1 && r[700].cd <= 0 && r[730].moved === 0 && r[730].cd >= 11.8 && !!r.stall && r.stall.inClaim && r.stall.stalledMoved === 0 && r.stall.cdAt19 <= 0 && r.stall.gaveUp >= 19 && r.stall.gaveUp <= 21, JSON.stringify(r));

/* ================= 4 · THE MOUNTED LAW ================= */
r = await ev(s => {
  __pack(3); __said.length = 0;
  S.horse = { loaner: true, rentedUntil: 0, on: true, spookT: 0, breed: 'mustang', wantRemount: false };
  const R = s.road, cd = __camp(R.cid), home = [cd.x, cd.y]; cd.x = R.wx; cd.y = R.wy;   // the knife's camp staged on the open meadow road
  const run = __chase(R.cid, R.wx, R.wy, R.wx - R.ux * 150, R.wy - R.uy * 150);
  const rx0 = run.x, ry0 = run.y, gap0 = Math.round(U.dist(run.x, run.y, S.px, S.py));
  const dir = __keys(R.ux, R.uy);   /* ride straight down the open road the search found */
  let grew = true, engaged = 0, last = U.dist(run.x, run.y, S.px, S.py);
  for (let i = 0; i < 35; i++) { Systems.update(0.1, __in(dir)); const g = U.dist(run.x, run.y, S.px, S.py); if (g < last) grew = false; last = g; if (run.cd <= 0) engaged++; }
  const gap = Math.round(U.dist(run.x, run.y, S.px, S.py)), chased = Math.round((run.x - rx0) * R.ux + (run.y - ry0) * R.uy);   // how far the knife came on down the road after the walker
  const line = __said.find(t => ['A horse. Forget it.', 'Not on foot we don\'t.', 'Let him ride.'].includes(t)) || '';
  const out = { gap0, gap, grew, engaged, line, cd: +run.cd.toFixed(1), on: S.horse.on, speed: Math.round(S.speed) };
  S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 }; cd.x = home[0]; cd.y = home[1];
  return out;
}, site);
ok('THE MOUNTED LAW: a runner who sees the gap growing under hooves calls it — on a road of open meadow (the knife\'s camp staged on it), mounted, the walker opens the gap from 150 px to past 550 in 3.5s of the world\'s step, the knife says so ("A horse. Forget it.", or his fellows\' "Not on foot we don\'t." / "Let him ride.") and stops burning your attention (turned back from the first step and never engaged again, the gap wider at every step)',
  r.gap0 === 150 && r.gap >= 550 && r.grew && r.engaged === 0 && !!r.line && r.cd > 5 && r.on, JSON.stringify(r));

/* ================= 5 · ON FOOT, HONEST ================= */
r = await ev(s => {
  const out = {};
  const R = s.road, dirOf = () => __keys(R.ux, R.uy), cd = __camp(R.cid), home = [cd.x, cd.y]; cd.x = R.wx; cd.y = R.wy;   // the same staged road
  for (const [k, kg, sprint] of [['lightSprinting', 3, true], ['loadedWalking', 46, false]]) {
    __pack(kg); S.stam = S.stamMax;
    const run = __chase(R.cid, R.wx, R.wy, R.wx - R.ux * 250, R.wy - R.uy * 250);
    const g0 = U.dist(run.x, run.y, S.px, S.py);
    for (let i = 0; i < 35; i++) { Systems.update(0.1, __in({ ...dirOf(), shift: sprint })); if (S.struggle) break; }
    out[k] = { load: +(State.weight() / State.cap()).toFixed(2), gap0: Math.round(g0), gap: Math.round(U.dist(run.x, run.y, S.px, S.py)), speed: Math.round(S.speed), sprinting: !!S.sprinting, caught: !!S.struggle };
    S.struggle = null; S.stagger = 0;
  }
  __pack(3); S.px = s.wx; S.py = s.wy; cd.x = home[0]; cd.y = home[1];
  return out;
}, site);
ok('ON FOOT, HONEST: on the same road of open meadow that never runs downhill for the walker (the knife\'s camp staged on it), from the same 250 px, a light walker sprinting pulls away from a knife in 3.5s (the gap grows), and a loaded walker walking is honestly caught up with (the gap closes) — the knife runs at a pair of boots\' pace, no relative-speed cheat either way',
  r.lightSprinting.sprinting && r.lightSprinting.gap > r.lightSprinting.gap0 + 60 && r.loadedWalking.load > 0.8 && !r.loadedWalking.sprinting && (r.loadedWalking.caught || r.loadedWalking.gap < r.loadedWalking.gap0 - 30), JSON.stringify(r));

/* ================= 6 · THE HILL, NO RING ================= */
const hill = await ev(() => {
  const H = DATA.stations.haven, K = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]];
  for (let rr = 200; rr < 5000; rr += 40) for (let a = 0; a < 6.28; a += 0.13) {
    const x = H.x + Math.cos(a) * rr, y = H.y + Math.sin(a) * rr, t = World.terrainAt(x, y);
    if (t.blocked || t.water || t.slope < 0.34 || World.mistAt(x, y) >= 0.3 || DATA.camps.some(c => U.dist(x, y, c.x, c.y) < c.r + 300)) continue;
    /* the key nearest the contour: across the slope, not up and down it */
    const g = Math.hypot(t.sx || 0, t.sy || 0) || 1, [ux, uy] = K.slice().sort((p, q) => Math.abs(p[0] * t.sx + p[1] * t.sy) - Math.abs(q[0] * t.sx + q[1] * t.sy))[0];
    if (__segOk(x - ux * 90, y - uy * 90, x + ux * 90, y + uy * 90, t2 => !t2.blocked && !t2.water && t2.slope >= 0.32, 6)) {
      const climb = World.hgtAt(x + t.sx / g * 40, y + t.sy / g * 40) - World.hgtAt(x - t.sx / g * 40, y - t.sy / g * 40);   // the hill is real ground: height rises up its gradient
      return { x, y, ux, uy, slope: +t.slope.toFixed(3), cls: t.cls, across: +(Math.abs(ux * t.sx + uy * t.sy) / g).toFixed(2), climb: +climb.toFixed(4) };
    }
  }
  return null;
});
r = await ev(h => {
  __pack(30); S.flags.calm = false;   // the wobble LIVE — the calm debug flag cleared
  S.px = h.x; S.py = h.y; S.qte = null; S.stagger = 0;
  const keys = [__keys(h.ux, h.uy), __keys(-h.ux, -h.uy)];
  let rings = 0, steep = 0, steps = 0, minSlope = 9;
  const st0 = S.stats.steadies;
  __rnd(0, () => {   // every step's wobble roll forced to fire
    for (let i = 0; i < 160; i++) {
      S.stam = S.stamMax;   // lungs kept full: the reason being tested is the hill, and only the hill
      const t = World.terrainAt(S.px, S.py); if (t.slope >= 0.32) steep++; minSlope = Math.min(minSlope, t.slope);
      Systems.update(0.1, __in(keys[Math.floor(i / 5) % 2]));   // along the slope and back, half a second each way
      if (S.qte) { rings++; S.qte = null; UI.showQTE(false); }
      steps++;
    }
  });
  S.flags.calm = true;
  return { steps, seconds: steps * 0.1, steep, minSlope: +minSlope.toFixed(3), rings, steadied: S.stats.steadies - st0, load: +(State.weight() / State.cap()).toFixed(2) };
}, hill);
ok('THE HILL, NO RING: with the wobble LIVE (the calm debug flag cleared) and every one of its rolls forced to fire, sixteen seconds walking a 0.32+ slope at a sane load ring ZERO times — the body steadies itself on every roll (paid in breath, not in a minigame), so this green is not vacuous',
  !!hill && hill.climb > 0 && r.seconds === 16 && r.steep === 160 && r.rings === 0 && r.steadied >= 100 && r.load <= 1, JSON.stringify({ hill, ...r }));

/* ================= 7 · THE HILL'S REASONS ================= */
r = await ev(h => {
  S.flags.calm = false;
  const bal0 = S.skills.bal.lv; S.skills.bal.lv = 1;   // an untrained body: no mastered ground steadies it
  const key = __keys(h.ux, h.uy);
  const ringsWhen = (setup, extra = {}) => {
    S.px = h.x; S.py = h.y; S.qte = null; S.stagger = 0; setup();
    let rang = false;
    __rnd(0, () => { for (let i = 0; i < 10 && !rang; i++) { Systems.update(0.1, __in({ ...key, ...extra })); if (S.qte) rang = true; } });
    S.qte = null; UI.showQTE(false); S.stam = S.stamMax;
    return rang;
  };
  const load = () => +(State.weight() / State.cap()).toFixed(2), loads = {};
  /* the grey-fear: a wraith hunting the walker 420 off, across the slope — the world's own fear, read by the step (no grab: it
     never reaches them in the second the trial runs) */
  let fearOn = null;
  const hunt = () => { S.wraiths.length = 0; S.wraiths.push({ id: U.uid(), x: h.x - h.uy * 420, y: h.y + h.ux * 420, alert: 1, state: 'hunt', cd: 99, ph: 0 }); fearOn = Porter.fearActive(); };
  const out = {
    overload: ringsWhen(() => { __pack(62); S.stam = S.stamMax; loads.overload = load(); }),
    sprintRough: ringsWhen(() => { __pack(30); S.stam = S.stamMax; }, { shift: true }),
    fear: ringsWhen(() => { __pack(30); S.stam = S.stamMax; loads.fear = load(); hunt(); }),
    emptyLungs: ringsWhen(() => { S.wraiths.length = 0; __pack(30); S.stam = 10; }),
    saneAgain: ringsWhen(() => { S.wraiths.length = 0; __pack(30); S.stam = S.stamMax; loads.sane = load(); }),
  };
  S.wraiths.length = 0;
  S.flags.calm = true; __pack(3); S.skills.bal.lv = bal0;
  return { ...out, fearOn, loads };
}, hill);
ok('THE HILL\'S REASONS: the ring still comes when there is a REASON on the same ground — overloaded past 1.0 (the load read over 1), sprinting rough country, the grey-fear (a wraith hunting the walker 420 off, at a sane load), empty lungs — and a sane load (the load read under 1) walking the same slope right after still does not ring',
  r.overload && r.sprintRough && r.fear && r.fearOn === true && r.emptyLungs && !r.saneAgain && r.loads.overload > 1 && r.loads.fear <= 1 && r.loads.sane <= 1, JSON.stringify(r));

/* ================= 8 · THE BALK ================= */
const ford = await ev(() => {
  const H = DATA.stations.haven;
  for (let rr = 100; rr < 6000; rr += 30) for (let a = 0; a < 6.28; a += 0.11) {
    const x = H.x + Math.cos(a) * rr, y = H.y + Math.sin(a) * rr, t = World.terrainAt(x, y);
    if (!t.water || t.blocked) continue;
    for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      /* a wadeable ford: dry, then shallows, then dry — nothing blocked, the far bank within reach */
      let a0 = null, b0 = null;
      for (let d = 8; d < 120; d += 4) if (!World.terrainAt(x - ux * d, y - uy * d).water) { a0 = d; break; }
      for (let d = 8; d < 120; d += 4) if (!World.terrainAt(x + ux * d, y + uy * d).water) { b0 = d; break; }
      if (a0 === null || b0 === null) continue;
      const A = [x - ux * (a0 + 60), y - uy * (a0 + 60)], B = [x + ux * (b0 + 90), y + uy * (b0 + 90)];
      if (!__segOk(A[0], A[1], B[0], B[1], t2 => !t2.blocked)) continue;
      if (!__segOk(A[0], A[1], x - ux * a0, y - uy * a0, t2 => !t2.water) || !__segOk(x + ux * b0, y + uy * b0, B[0], B[1], t2 => !t2.water)) continue;
      if (DATA.camps.some(c => U.dist(x, y, c.x, c.y) < c.r + 200)) continue;
      return { A, B, ux, uy, width: a0 + b0 };
    }
  }
  return null;
});
r = await ev(f => {
  __pack(3); S.flags.calm = true; S.flags.tut.balkTold = false;
  S.horse = { loaner: true, rentedUntil: 0, on: true, spookT: 0, breed: 'mustang', wantRemount: false };
  const key = f.ux > 0 ? { right: true } : f.ux < 0 ? { left: true } : f.uy > 0 ? { down: true } : { up: true };
  const back = f.ux > 0 ? { left: true } : f.ux < 0 ? { right: true } : f.uy > 0 ? { up: true } : { down: true };
  const toasts = () => [...document.querySelectorAll('#toasts .toast')].filter(t => /The horse balks at the/.test(t.textContent)).length;
  for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove();
  S.px = f.A[0]; S.py = f.A[1];
  const log = [];
  let dismounted = -1, remounted = -1, avail = true;
  for (let i = 0; i < 120; i++) {
    Systems.update(0.05, __in(key)); if (!Systems.horseAvail()) avail = false;
    const wet = World.terrainAt(S.px, S.py).water;
    log.push(S.horse.on ? 'H' : 'w');
    if (!S.horse.on && dismounted < 0) dismounted = i;
    if (dismounted >= 0 && S.horse.on && remounted < 0) remounted = i;
    if (U.dist(S.px, S.py, f.B[0], f.B[1]) < 12) break;
  }
  const first = { dismounted, remounted, avail, spook: S.horse.spookT || 0, on: S.horse.on, lines: toasts(), past: U.dist(S.px, S.py, f.A[0], f.A[1]) > f.width + 60 };
  /* back across: the balk again, and silence this time */
  for (let i = 0; i < 160; i++) { Systems.update(0.05, __in(back)); if (U.dist(S.px, S.py, f.A[0], f.A[1]) < 12) break; }
  const second = { on: S.horse.on, lines: toasts() };
  return { first, second, trail: log.join('') };
}, ford);
await page.keyboard.press('KeyR'); await page.waitForTimeout(150);
const chosen = await ev(f => {
  const out = { off: !S.horse.on, wants: !!S.horse.wantRemount };
  const away = f.ux > 0 ? { left: true } : f.ux < 0 ? { right: true } : f.uy > 0 ? { up: true } : { down: true };
  for (let i = 0; i < 30; i++) Systems.update(0.05, __in(away));
  out.stillOff = !S.horse.on;
  S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 };
  /* the rungs: a REAL ladder placed over a real gap (a wall, not a wadeable creek), the walker mounted on a route across it —
     the horse balks at the crossing as at the water (its own line, the first time) and picks the walker back up past the far
     end; the ladder taken up again after, so the ladder law below finds the same gap as it stood */
  out.rungs = (() => {
    const H = DATA.stations.haven, hl = DATA.structures.ladder.span / 2;
    let lad = null, near = null, far = null;
    for (let rr = 150; rr < 6000 && !lad; rr += 40) for (let a = 0; a < 6.28 && !lad; a += 0.09) {
      const x = H.x + Math.cos(a) * rr, y = H.y + Math.sin(a) * rr;
      if (!World.terrainAt(x, y).blocked) continue;
      for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (lad) break;
        let bank = null;
        for (let d = 12; d < 90; d += 6) { const t2 = World.terrainAt(x - ux * d, y - uy * d); if (!t2.blocked && !t2.water) { bank = [x - ux * (d + 20), y - uy * (d + 20)]; break; } }
        if (!bank || !__open(bank[0], bank[1]) || DATA.camps.some(c => U.dist(bank[0], bank[1], c.x, c.y) < c.r + 200)) continue;
        S.px = bank[0]; S.py = bank[1]; S.dir = Math.atan2(uy, ux);
        if (!State.countTool('ladder')) State.addCargo(State.makeItem('ladderTool'));
        const n0 = S.structures.length, okB = Systems.tryBuild('ladder'), st = okB && S.structures[S.structures.length - 1];
        if (!st || S.structures.length !== n0 + 1) continue;
        const c = Math.cos(st.ang), s2 = Math.sin(st.ang), A = [st.x - c * (hl + 40), st.y - s2 * (hl + 40)], B = [st.x + c * (hl + 40), st.y + s2 * (hl + 40)];
        if (st.flat || !__open(A[0], A[1]) || !__open(B[0], B[1])) { S.structures.pop(); continue; }
        lad = st; near = A; far = B;
      }
    }
    if (!lad) return null;
    const c = Math.cos(lad.ang), s2 = Math.sin(lad.ang), along = () => (S.px - lad.x) * c + (S.py - lad.y) * s2;
    S.flags.tut.balkTold = false; for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove();
    S.horse = { loaner: true, rentedUntil: 0, on: true, spookT: 0, breed: 'mustang', wantRemount: false };
    S.px = near[0]; S.py = near[1]; S.moveTo = null; S.route = [];
    const routed = Systems.moveTo(far[0], far[1]);
    let off = null, on = null, avail = true;
    for (let i = 0; i < 400 && S.moveTo; i++) {
      Systems.update(0.1, __in()); if (!Systems.horseAvail()) avail = false;
      if (!S.horse.on && !off) off = { i, rungs: !!Systems.crossingAt(S.px, S.py), wet: !!World.terrainAt(S.px, S.py).water, along: Math.round(along()) };
      if (off && S.horse.on && !on) on = { i, rungs: !!Systems.crossingAt(S.px, S.py), along: Math.round(along()) };
    }
    const lines = [...document.querySelectorAll('#toasts .toast')].filter(t => /The horse balks at the crossing/.test(t.textContent)).length;
    const res = { hl, routed, off, on, lines, end: { on: S.horse.on, spook: S.horse.spookT || 0, arrived: !S.moveTo }, avail };
    S.structures.splice(S.structures.indexOf(lad), 1); S.flags.tut.balkTold = true; S.moveTo = null; S.route = [];
    return res;
  })();
  S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 };
  return out;
}, ford);
const rg = chosen.rungs;
ok('THE BALK: water and the rungs still put the rider down — the horse has an opinion — but it WANTS back on: led across the ford, it picks the walker back up on the far bank with no button and no spook lockout, one quiet line the first time and silence the next; ridden on a route over a real ladder spanning a real gap, it balks on the rungs (dry, the crossing\'s own line once) and picks the walker back up past the ladder\'s far end with no button and no lockout; a CHOSEN dismount (a real R) stays dismounted however far you walk',
  !!ford && r.first.dismounted > 0 && r.first.remounted > r.first.dismounted && r.first.avail && r.first.on && r.first.spook === 0 && r.first.lines === 1 && r.first.past && r.second.on && r.second.lines === 1 && chosen.off && !chosen.wants && chosen.stillOff
  && !!rg && rg.routed && !!rg.off && rg.off.rungs && !rg.off.wet && !!rg.on && rg.on.i > rg.off.i && !rg.on.rungs && rg.on.along >= rg.hl - 2 && rg.lines === 1 && rg.end.on && rg.end.spook === 0 && rg.end.arrived && rg.avail,
  JSON.stringify({ ford: ford && { width: ford.width }, first: r.first, second: r.second, trail: r.trail, chosen }));

/* ================= 9 · THE LADDER LAW ================= */
r = await ev(() => {
  __pack(3); S.flags.calm = true;
  const H = DATA.stations.haven, SP = DATA.structures.ladder.span, hl = SP / 2;
  let lad = null, from = null;
  for (let rr = 150; rr < 6000 && !lad; rr += 40) for (let a = 0; a < 6.28 && !lad; a += 0.09) {
    const x = H.x + Math.cos(a) * rr, y = H.y + Math.sin(a) * rr, t = World.terrainAt(x, y);
    if (!t.blocked) continue;   // deep water or a cliff: a real gap
    for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (lad) break;
      let bank = null;
      for (let d = 12; d < 90; d += 6) { const t2 = World.terrainAt(x - ux * d, y - uy * d); if (!t2.blocked && !t2.water) { bank = [x - ux * (d + 20), y - uy * (d + 20)]; break; } }
      if (!bank || !__open(bank[0], bank[1]) || DATA.camps.some(c => U.dist(bank[0], bank[1], c.x, c.y) < c.r + 200)) continue;
      S.px = bank[0]; S.py = bank[1]; S.dir = Math.atan2(uy, ux);
      if (!State.countTool('ladder')) State.addCargo(State.makeItem('ladderTool'));
      const n0 = S.structures.length, okB = Systems.tryBuild('ladder');
      const st = okB && S.structures[S.structures.length - 1];
      if (!st || S.structures.length !== n0 + 1) continue;
      if (st.flat) { S.structures.pop(); continue; }   // a wadeable creek is not the law's test: the gap must be a wall
      /* the far bank: past the span's end, on dry ground, and no way round it within the pathfinder's reach but the rungs */
      /* a tap from BESIDE the near end to beside the far end: the straight line runs over the gap, so the walk must be routed */
      const c = Math.cos(st.ang), s2 = Math.sin(st.ang), nx = -s2, ny = c;
      const far = [st.x + c * (hl + 30) + nx * 40, st.y + s2 * (hl + 30) + ny * 40], near = [st.x - c * (hl + 30) + nx * 40, st.y - s2 * (hl + 30) + ny * 40];
      if (!__open(far[0], far[1]) || !__open(near[0], near[1]) || __segOk(near[0], near[1], far[0], far[1], t2 => !t2.blocked)) { S.structures.pop(); continue; }
      lad = st; from = near; lad.far = far;
    }
  }
  if (!lad) return null;
  /* the snap math, on the real placed ladder */
  const c = Math.cos(lad.ang), s2 = Math.sin(lad.ang);
  const p = [lad.x + c * 30 - s2 * 26, lad.y + s2 * 30 + c * 26], q = [lad.x + c * (hl + 20) + s2 * 10, lad.y + s2 * (hl + 20) - c * 10];
  const [sp, sq] = Systems.snapCrossings([[...p], [...q]]);
  const on = pt => { const dx = pt[0] - lad.x, dy = pt[1] - lad.y; return { lx: dx * c + dy * s2, ly: -dx * s2 + dy * c }; };
  const snap = { p: on(sp), q: on(sq) };
  /* the routed crossing: a tap on the far bank, walked at the world's step, sampled every 100 ms */
  S.px = from[0]; S.py = from[1]; S.moveTo = null; S.route = [];
  const routed = Systems.moveTo(lad.far[0], lad.far[1]);
  const pathOn = (S.moveTo && S.moveTo.path || []).filter(w => { const o = on(w); return Math.abs(o.lx) < hl && Math.abs(o.ly) < 1e-6; }).length;
  const pos = [[S.px, S.py]];
  for (let i = 0; i < 400 && S.moveTo; i++) { Systems.update(0.1, __in()); pos.push([S.px, S.py]); }
  let maxStep = 0, maxRung = 0, onRungs = 0;
  for (let i = 1; i < pos.length; i++) {
    const st2 = Math.hypot(pos[i][0] - pos[i - 1][0], pos[i][1] - pos[i - 1][1]); maxStep = Math.max(maxStep, st2);
    const o = on(pos[i]); if (Math.abs(o.lx) < hl - 10 && Math.abs(o.ly) < 14) { onRungs++; maxRung = Math.max(maxRung, st2); }
  }
  const end = on(pos[pos.length - 1]), start = on(pos[0]);
  return { flat: lad.flat, span: SP, snap: { p: { lx: +snap.p.lx.toFixed(6), ly: +snap.p.ly.toFixed(9) }, q: { lx: +snap.q.lx.toFixed(6), ly: +snap.q.ly.toFixed(9) } }, routed, pathOn, samples: pos.length, onRungs, maxStep: +maxStep.toFixed(2), maxRung: +maxRung.toFixed(2), crossed: Math.sign(start.lx) !== Math.sign(end.lx) && Math.abs(end.lx) > hl, arrived: !S.moveTo };
});
ok('THE LADDER LAW: on a REAL placed ladder over a real gap, snapCrossings projects a planned waypoint within the span\'s reach exactly ONTO the rungs (on the ladder\'s axis to the nanometre, clamped inside its ends), the walker\'s own route is planned through those snapped waypoints, and the routed crossing, sampled every 100 ms of the world\'s step, crosses — every step bounded by the walker\'s own pace, no step on the rungs over nine pixels, no warp anywhere',
  !!r && r.flat === false && Math.abs(r.snap.p.ly) < 1e-6 && Math.abs(r.snap.p.lx - 30) < 1e-6 && Math.abs(r.snap.q.ly) < 1e-6 && Math.abs(r.snap.q.lx - (r.span / 2 - 8)) < 1e-6 && r.routed && r.pathOn >= 1 && r.crossed && r.arrived && r.onRungs >= 10 && r.maxRung <= 9 && r.maxStep <= 11.5, JSON.stringify(r));

/* ================= 10 · EVERY WARP KILLED ================= */
r = await ev(() => {
  __pack(3); S.flags.calm = true;
  const H = DATA.stations.haven, out = {};
  /* the convoy junior, taken by the real contract path, left calling 280 px behind on open ground */
  S.stations.elm.connected = true; S.stations.elm.met = true;
  const def = { id: 'cv_haven_elm', from: 'haven', to: 'elm', convoy: true, item: null, n: 0, likesMul: 1.2, express: false, premium: false, mood: null, urgency: 0.8 };
  Systems.acceptOrder(def, false);
  const c = S.convoy;
  if (c) {
    let spot = null;
    for (let a = 0; a < 6.28 && !spot; a += 0.2) { const x = c.x + Math.cos(a) * 280, y = c.y + Math.sin(a) * 280; if (__segOk(c.x, c.y, x, y, t => !t.blocked && !t.water)) spot = [x, y]; }
    S.px = spot[0]; S.py = spot[1];
    const d0 = U.dist(c.x, c.y, S.px, S.py);
    let maxStride = 0, last = [c.x, c.y], halfPace = null;
    for (let i = 0; i < 360; i++) {
      Systems.update(1 / 30, __in());
      const st2 = Math.hypot(c.x - last[0], c.y - last[1]); maxStride = Math.max(maxStride, st2);
      if (i === 5) halfPace = { waiting: c.waiting, perSec: +(st2 * 30).toFixed(1) };
      last = [c.x, c.y];
    }
    out.junior = { d0: Math.round(d0), d1: Math.round(U.dist(c.x, c.y, S.px, S.py)), closed: Math.round(d0 - U.dist(c.x, c.y, S.px, S.py)), maxStride: +maxStride.toFixed(2), halfPace, speed: NPC.speedOf(c.n) };
    const o = S.orders.active.find(x => x.convoy); if (o) Systems.abandonOrder(o.idNum);
  }
  /* a companion left far behind: no catch-up teleport at 300 px for 7s — a visible run on their own legs */
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.feeWaived = true; NPC.hire(n, 'companion');
  let spot = null;
  for (let a = 0; a < 6.28 && !spot; a += 0.2) { const x = H.x + 200 + Math.cos(a) * 600, y = H.y + 200 + Math.sin(a) * 600; if (__segOk(H.x + 200, H.y + 200, x, y, t => !t.blocked && !t.water)) spot = [x, y]; }
  S.px = H.x + 200; S.py = H.y + 200; n.cx = spot[0]; n.cy = spot[1];
  const e0 = U.dist(n.cx, n.cy, S.px, S.py);
  let maxStride = 0, last = [n.cx, n.cy], at7 = null;
  for (let i = 0; i < 300; i++) {
    Systems.update(1 / 30, __in());
    const st2 = Math.hypot(n.cx - last[0], n.cy - last[1]); maxStride = Math.max(maxStride, st2); last = [n.cx, n.cy];
    if (i === 210) at7 = Math.round(U.dist(n.cx, n.cy, S.px, S.py));
  }
  out.companion = { d0: Math.round(e0), at7, d1: Math.round(U.dist(n.cx, n.cy, S.px, S.py)), maxStride: +maxStride.toFixed(2) };
  n.state = 'pool';
  return out;
});
ok('EVERY WARP KILLED: the convoy junior (taken on the real contract path), left calling past the lag and trudging at half pace, closes 200+ px on their own legs with every stride bounded under 60 — nobody "appears at your back"; and a companion left 600 px behind runs the gap shut in seconds, stride by visible stride, no catch-up teleport at the old 7s mark',
  !!r.junior && r.junior.closed >= 200 && r.junior.maxStride < 60 && r.junior.halfPace && r.junior.halfPace.waiting && r.junior.halfPace.perSec < r.junior.speed * 0.6 && r.companion.d0 >= 590 && r.companion.d1 < 90 && r.companion.maxStride < 60, JSON.stringify(r));

await ev(() => { WL.timeScale = 1; S.flags.calm = true; });
await T.finish('the fairness pass');
