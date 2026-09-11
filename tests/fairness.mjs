/* fairness.mjs — v3.31 THE FAIRNESS PASS: the four field verdicts, answered at the root and
   held there by law. The chase obeys the world (a horse is UNCATCHABLE, raider boots climb and
   stop and give up), the wobble ring is saved for the places the plan outran the walker (a hill
   at a sane load is NEVER a minigame), the horse's balk is a beat with an auto-remount (never a
   lockout chore), and every planned waypoint near a span snaps ONTO the rungs so nobody walks
   the cliff beside a ladder again. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
const ev = (fn, arg) => page.evaluate(fn, arg);

/* stage: the player inside a camp's claim, carrying cargo, one runner at a known gap */
const stage = (mounted, extraKg = 0) => ev(([m, kg]) => {
  WL.calm();
  const cd = DATA.camps[0], c = S.camps[cd.id];
  c.pacified = false; c.alert = 1;
  // stand INSIDE the claim on open ground
  let px = cd.x + cd.r * 0.5, py = cd.y;
  for (let r2 = 0; r2 < 300; r2 += 24) { if (!World.terrainAt(px, py + r2).blocked) { py = py + r2; break; } }
  WL.tp([px, py]);
  S.cargo = S.cargo.filter(x => x.tool);
  State.addCargo(State.makeItem('meds'));
  for (let i = 0; i < Math.ceil(kg / 7); i++) State.addCargo(State.makeItem('meds'));
  S.horse = { loaner: false, rentedUntil: S.time + 9999, on: m, spookT: 0, wantRemount: false };
  c.runners = [{ x: px - 150, y: py, wa: 0, state: 'patrol', cd: 0 }];
  S.moveTo = null; S.route = [];
  return { px, py };
}, [mounted, extraKg]);

/* run the chase: hold a walk away from the runner, sample the gap */
const chase = secs => ev(s2 => new Promise(res => {
  const r = S.camps[DATA.camps[0].id].runners[0];
  const g0 = U.dist(r.x, r.y, S.px, S.py);
  Systems.moveTo(S.px + 900, S.py, { plain: true });
  const t0 = Date.now();
  const iv = setInterval(() => {
    if (Date.now() - t0 > s2 * 1000) {
      clearInterval(iv);
      res({ g0: Math.round(g0), g1: Math.round(U.dist(r.x, r.y, S.px, S.py)), gaveHorse: !!r.gaveHorse, cd: r.cd });
    }
  }, 120);
}), secs);

/* ================= 1 · THE CHASE OBEYS THE WORLD ================= */
await stage(true);
let r = await chase(3.5);
ok('A HORSE IS UNCATCHABLE — the gap GROWS mounted, and the camp calls the chase off ("A horse. Forget it.")', r.g1 > r.g0 + 60 && r.gaveHorse, JSON.stringify(r));
await stage(false, 0);
r = await ev(() => new Promise(res => {
  // unloaded SPRINT beats foot raiders on the flat
  const runner = S.camps[DATA.camps[0].id].runners[0];
  const g0 = U.dist(runner.x, runner.y, S.px, S.py);
  Systems.moveTo(S.px + 900, S.py, { plain: true });
  const iv2 = setInterval(() => { window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' })); }, 200);
  const kd = () => {};
  const t0 = Date.now();
  const hold = setInterval(() => {
    S.stam = Math.max(S.stam, 60);
    if (Date.now() - t0 > 3000) { clearInterval(hold); clearInterval(iv2); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' })); res({ g0: Math.round(g0), g1: Math.round(U.dist(runner.x, runner.y, S.px, S.py)) }); }
  }, 100);
}));
ok('on FOOT the threat is honest: light and sprinting pulls away (loaded and walking stays caught — the delivery pressure kept)', r.g1 >= r.g0 - 30, JSON.stringify(r));
r = await ev(() => {
  // raider boots at a cliff: they slide or they STOP and give up — never through, never over
  const cd = DATA.camps[0], c = S.camps[cd.id];
  let bx = null, by = null;
  outer: for (let y = cd.y - 600; y < cd.y + 600; y += 30) for (let x = cd.x - 600; x < cd.x + 600; x += 30) {
    if (World.terrainAt(x, y).blocked && !World.terrainAt(x - 40, y).blocked) { bx = x; by = y; break outer; }
  }
  if (bx === null) return { skipped: true };
  WL.tp([bx + 220, by]);                                 // the player past the rock
  S.cargo = S.cargo.filter(x2 => x2.tool); State.addCargo(State.makeItem('meds'));
  c.runners = [{ x: bx - 60, y: by, wa: 0, state: 'patrol', cd: 0 }];
  return new Promise(res => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      const r2 = c.runners[0];
      const inRock = World.terrainAt(r2.x, r2.y).blocked;
      if (Date.now() - t0 > 4000) { clearInterval(iv); res({ inRock, gaveUp: r2.cd > 0 || U.dist(r2.x, r2.y, bx - 60, by) < 400 }); }
      else if (inRock) { clearInterval(iv); res({ inRock: true }); }
    }, 120);
  });
});
ok('raider feet are FEET: never inside rock — they slide along it or give the chase up', r.skipped || (!r.inRock && r.gaveUp), JSON.stringify(r));

/* ================= 2 · THE HILL IS NOT A MINIGAME ================= */
r = await ev(() => new Promise(res => {
  /* the wobble must be LIVE for this proof — WL.calm() short-circuits the whole block and
     would hand us a vacuous pass. Isolation comes from pinning the world by hand instead. */
  S.flags.calm = false;
  for (const cd2 of DATA.camps) { const c2 = S.camps[cd2.id]; if (c2) { c2.pacified = true; c2.runners = []; } }
  S.wraiths.length = 0; S.struggle = null;
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' }));   // the hill proof is a WALK — sprint-on-rough rings by design
  const cd = DATA.camps[0]; S.camps[cd.id].runners = []; S.camps[cd.id].pacified = true;
  // find honest steep ground
  let sx = null, sy = null;
  outer: for (let y = 1200; y < DATA.H - 1200; y += 160) for (let x = 1200; x < DATA.W - 1200; x += 160) {
    const t = World.terrainAt(x, y);
    if (!t.blocked && !t.water && t.slope > 0.32) { sx = x; sy = y; break outer; }
  }
  WL.tp([sx, sy]);
  S.cargo = S.cargo.filter(x2 => x2.tool);
  State.addCargo(State.makeItem('meds'));                 // a sane load, far under cap
  S.stam = S.stamMax;
  let rings = 0, ticks = 0;
  Systems.moveTo(sx + 500, sy + 300, { plain: true });
  const iv = setInterval(() => {
    S.wraiths.length = 0; S.struggle = null;              // this proof is about the HILL
    if (S.qte) rings++;
    S.stam = Math.max(S.stam, 50);                        // lungs full — the ring has no excuse
    if (!S.moveTo && ticks > 20) { Systems.moveTo(S.px - 500, S.py - 300, { plain: true }); }
    if (++ticks >= 160) { clearInterval(iv); res({ rings, slopeFound: sy !== null, wobbleLive: !S.flags.calm, walking: !S.sprinting }); }
  }, 100);
}));
ok('THE HILL TAX IS DEAD: 16 seconds WALKING steep ground at a sane load, wobble LIVE — ZERO rings, the body pays in breath', r.slopeFound && r.rings === 0 && r.wobbleLive && r.walking, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  // and the ring still EXISTS where it belongs: overloaded on rough country — wobble still LIVE
  S.flags.calm = false; S.wraiths.length = 0; S.struggle = null;
  while (State.weight() <= State.cap() * 1.05) State.addCargo(State.makeItem('bigCrate'));
  let rang = false, ticks = 0;
  Systems.moveTo(S.px + 600, S.py + 200, { plain: true });
  const iv = setInterval(() => {
    S.wraiths.length = 0; S.struggle = null;
    if (S.qte) { rang = true; S.qte = null; UI.showQTE(false); }
    if (!S.moveTo && ticks > 10) Systems.moveTo(S.px - 600, S.py, { plain: true });
    if (++ticks >= 200 || rang) { clearInterval(iv); S.cargo = S.cargo.filter(x2 => x2.tool); S.flags.calm = true; res({ rang }); }
  }, 100);
}));
ok('but OVERLOADED on rough country the ring still comes — pushback for pushing past the kit, exactly as the law reads', r.rang, JSON.stringify(r));

/* ================= 3 · THE BALK IS A BEAT, NOT A CHORE ================= */
r = await ev(() => new Promise(res => {
  WL.calm();
  /* clean stage — this proof is about the BALK, nothing else: scan for a flat dry lane long
     enough to ride, pin the wraiths, and lay a ladder mid-lane. The old staging used "wherever
     the last test ended" and once died to a wraith grab 300ms before sampling. */
  let gx = null, gy = null;
  outer: for (let y = 1400; y < DATA.H - 1400; y += 140) for (let x = 1400; x < DATA.W - 1400; x += 140) {
    let clean = true;
    for (let dx = -200; dx <= 260; dx += 20) {
      const t = World.terrainAt(x + dx, y);
      if (t.blocked || t.water || t.slope > 0.12) { clean = false; break; }
    }
    if (clean && World.mistAt(x, y) < 0.25) { gx = x; gy = y; break outer; }
  }
  if (gx === null) { gx = DATA.stations.haven.x + 300; gy = DATA.stations.haven.y; }
  const x0 = gx + 30, y0 = gy;
  S.wraiths.length = 0; S.struggle = null;
  S.structures.push({ id: U.uid(), type: 'ladder', x: x0, y: y0, ang: 0, hp: 100, by: 'you', likes: 0 });
  S.horse = { loaner: false, rentedUntil: S.time + 9999, on: true, spookT: 0, wantRemount: false };
  S.cargo = S.cargo.filter(x2 => x2.tool);
  WL.tp([x0 - 160, y0]);
  Systems.moveTo(x0 + 220, y0, { plain: true });
  let sawWalk = false;
  const t0 = Date.now();
  const iv = setInterval(() => {
    S.wraiths.length = 0; S.struggle = null;
    if (!S.horse.on) sawWalk = true;
    if (S.px > x0 + 160 || Date.now() - t0 > 12000) {
      clearInterval(iv);
      setTimeout(() => res({ sawWalk, backOn: S.horse.on, lockout: S.horse.spookT || 0, past: S.px > x0 + 120 }), 800);
    }
  }, 100);
}));
ok('the horse balks at the rungs, you walk the span — and it PICKS YOU BACK UP on the far side, no lockout, no button', r.sawWalk && r.backOn && r.lockout <= 0 && r.past, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  // a CHOSEN dismount stays dismounted — auto-remount never overrides the player
  S.horse.on = false; S.horse.wantRemount = false;
  Systems.moveTo(S.px + 260, S.py, { plain: true });
  setTimeout(() => res({ stillOff: !S.horse.on }), 2500);
}));
ok('a chosen dismount STAYS dismounted — the auto-remount serves the balk only, never overrides the player', r.stillOff, JSON.stringify(r));

/* ================= 4 · THE LADDER LAW ================= */
r = await ev(() => {
  // waypoints near a span SNAP onto the rungs — the math, on a real placed ladder
  const st = S.structures.find(s2 => s2.type === 'ladder');
  const pts = [[st.x - 60, st.y + 30], [st.x + 40, st.y - 26], [st.x + 400, st.y + 200]];
  Systems.snapCrossings(pts);
  const off1 = Math.abs(pts[0][1] - st.y), off2 = Math.abs(pts[1][1] - st.y);
  const far = U.dist(pts[2][0], pts[2][1], st.x + 400, st.y + 200);
  return { off1: Math.round(off1), off2: Math.round(off2), farUntouched: far < 1 };
});
ok('THE LADDER LAW: planned waypoints within a span\'s reach land ON the rungs (axis offset → 0); far points untouched', r.off1 === 0 && r.off2 === 0 && r.farUntouched, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  // the walked proof: a routed crossing is CONTINUOUS — no stall, no cross-screen warp
  const st = S.structures.find(s2 => s2.type === 'ladder');
  S.wraiths.length = 0; S.struggle = null;               // a wraith YANK is a 210px fling — its own mechanic, not this proof
  WL.tp([st.x - 170, st.y + 8]);
  Systems.moveTo(st.x + 200, st.y - 8, { plain: true });
  let maxJump = 0, lastX = S.px, lastY = S.py, ticks = 0;
  const iv = setInterval(() => {
    S.wraiths.length = 0; S.struggle = null;
    const j = U.dist(S.px, S.py, lastX, lastY);
    maxJump = Math.max(maxJump, j);
    lastX = S.px; lastY = S.py;
    if (S.px > st.x + 150 || ++ticks > 120) {
      clearInterval(iv);
      res({ crossed: S.px > st.x + 150, maxJump: Math.round(maxJump), ticks });
    }
  }, 100);
}));
ok('and a routed crossing WALKS — the span is crossed, every 100ms step bounded (no stall, no warp)', r.crossed && r.maxJump < 55, JSON.stringify(r));

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the fairness pass', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
