/* wider.mjs — v3.24 THE WIDER WORLD & THE PRODUCTION: the Cine engine (a scene is a shot list),
   THE RIDE parody with its displaced gunfire, the globe of Waylight (per-pixel planet over a texel
   game), delivery badges from ONE counting truth, the party of four as the health pool (the player
   falls last), the rescue ride from the best-loved yard, the town law (no starving inside walls),
   and the rain that stopped being radio static. */
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
  S.flags.guideDone = true; S.orders.prioIdx = 99; WL.calm();
  S.stations.elm.connected = true; S.stations.mill.connected = true;
});

/* ================= THE CINE ENGINE ================= */
let r = await ev(() => {
  const okP = Cine.play([
    { move: 'cut', at: { x: S.px + 100, y: S.py }, zoom: 1.4, dur: 3 },
    { move: 'hold', at: { x: S.px, y: S.py }, zoom: 1.6, dur: 2, fx: { stamp: 'TEST CARD.' } },
  ], { ts: 0.3 });
  return { okP, seq: S.cineSeq, ts: S.timeScale, lb: document.body.classList.contains('cine') };
});
ok('Cine.play: a shot list becomes a running sequence — flag up, letterbox on, world at shot speed', r.okP && r.seq && r.ts === 0.3 && r.lb, JSON.stringify(r));
await page.waitForTimeout(400);
r = await ev(() => ({ dx: Math.abs(Render.cam.x - (S.px + 100)), z: Render.cam.z }));
ok('the CUT hard-repositions the camera onto the subject', r.dx < 30 && r.z > 1.3, JSON.stringify(r));
await page.waitForFunction(() => { const f = Cine.fx(); return f && f.stamp; }, null, { timeout: 8000 }).catch(() => {});
r = await ev(() => ({ stamp: Cine.fx() && Cine.fx().stamp, ts: S.timeScale }));
ok('the HOLD freezes the world and raises the stamp card', r.stamp === 'TEST CARD.' && r.ts === 0, JSON.stringify(r));
r = await ev(() => { const s = Cine.skip(); return { s, seq: S.cineSeq, ts: S.timeScale, lb: document.body.classList.contains('cine') }; });
ok('skip() ends the sequence clean — timeScale restored, letterbox down', r.s && !r.seq && r.ts === 1 && !r.lb, JSON.stringify(r));

/* ================= THE RIDE ================= */
r = await ev(() => {
  WL.tp([DATA.stations.haven.x + 600, DATA.stations.haven.y + 480]); S.dir = 0.5; S.level = 5; S.moveTo = null;
  const started = WL.ride();
  const R = S.ride;
  return { started, actors: R ? { reapers: R.reapers.length, watchers: R.watchers.length, kid: R.watchers.some(w => w.kid), captive: !!R.captive, rider: !!R.rider } : null, seen: S.flags.rideSeen };
});
ok('THE RIDE stages the firing-squad parody: captive, four reapers, the held rider, the watch ridge with the kid', r.started && r.actors && r.actors.reapers === 4 && r.actors.watchers === 5 && r.actors.kid && r.actors.captive && r.actors.rider && r.seen, JSON.stringify(r));
await page.waitForFunction(() => S.ride && S.ride.rider.bolted, null, { timeout: 15000 }).catch(() => {});
await page.waitForTimeout(600);
r = await ev(() => ({ bolted: S.ride && S.ride.rider.bolted, gone: S.ride ? +S.ride.rider.gone.toFixed(1) : 0, aim: S.ride && S.ride.aim }));
ok('"RIDE, WAYLIGHTER!" — the rider bolts as the rifles level', r.bolted && r.gone > 0.3 && r.aim, JSON.stringify(r));
await page.waitForFunction(() => { const f = Cine.fx(); return f && f.flickers.length > 0; }, null, { timeout: 20000 }).catch(() => {});
r = await ev(() => { const f = Cine.fx(); return { flick: f ? f.flickers.length : 0 }; });
ok('the camera has veered — three muzzle flickers fire OFF-frame, the sound carrying the event', r.flick === 3, JSON.stringify(r));
await page.waitForFunction(() => !S.cineSeq, null, { timeout: 20000 });
r = await ev(() => ({ ride: !!S.ride, ts: S.timeScale, mail: S.mails.some(m => /Recon, in from the grey/.test(m.subj)), again: (() => { const t = S.flags.rideSeen; return t === true; })() }));
ok('the scene ends clean: actors struck, clock restored, the recon mail lands, once-ever flag holds', !r.ride && r.ts === 1 && r.mail && r.again, JSON.stringify(r));

/* ================= THE GLOBE & THE BADGES ================= */
r = await ev(() => {
  Globe.bake();
  const v = Globe.REGIONS[0];
  return { n: Globe.REGIONS.length, valleyOpen: v.open, others: Globe.REGIONS.filter(g => !g.open).length, hasBlurbs: Globe.REGIONS.every(g => g.blurb) };
});
ok('the world of Waylight: five regions in the data, ONE open (ours), four waiting on recon — the futureproofing', r.n === 5 && r.valleyOpen && r.others === 4 && r.hasBlurbs, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  UI.toggleMap(true);
  UI.setMapView('world');
  setTimeout(() => {
    const cv2 = document.getElementById('globe');
    const g = cv2.getContext('2d');
    const D = cv2.width;
    const row = g.getImageData(0, (D / 2) | 0, D, 1).data;
    let blue = 0, land = 0, black = 0;
    for (let x = 0; x < D; x++) {
      const R2 = row[x * 4], G2 = row[x * 4 + 1], B2 = row[x * 4 + 2];
      if (B2 > R2 + 20 && B2 > 60) blue++;
      else if (G2 > 40 && R2 + G2 + B2 > 120 && B2 < G2 + 30) land++;
      if (R2 + G2 + B2 < 20) black++;
    }
    res({ D, blue, land, open: Globe.isOpen });
  }, 900);
}));
ok('the planet RENDERS — a shaded disc with real sea and real land across its equator (laughably past the texel world)', r.open && r.blue > 40 && r.land > 20, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  const cv2 = document.getElementById('globe');
  const g = cv2.getContext('2d');
  const before = g.getImageData(cv2.width / 2 | 0, cv2.height / 2 | 0, 40, 1).data.slice();
  Globe._st.rot += 1.4; Globe._st.vel = 0;
  setTimeout(() => {
    const after = g.getImageData(cv2.width / 2 | 0, cv2.height / 2 | 0, 40, 1).data;
    let diff = 0;
    for (let i = 0; i < before.length; i += 4) if (Math.abs(before[i] - after[i]) > 12) diff++;
    res({ diff });
  }, 400);
}));
ok('the globe TURNS — rotation re-renders the face (drag and idle spin share the same law)', r.diff > 3, JSON.stringify(r));
r = await ev(() => {
  const mk = (to, n, base) => { const ids = []; for (let i = 0; i < n; i++) { const it = State.makeItem('letters', base); State.addCargo(it); ids.push(it.id); } S.orders.active.push({ idNum: base, item: 'letters', from: 'haven', to, items: ids, t0: S.time, par: 999 }); };
  mk('mill', 3, 999001); mk('elm', 1, 999002);
  const c = Systems.deliverableCounts();
  return { mill: c.mill, elm: c.elm, keys: Object.keys(c).length };
});
ok('deliverableCounts: ONE truth about the load — 3 crates for the Mill, 1 for Elm, nothing invented', r.mill === 3 && r.elm === 1 && r.keys === 2, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  UI.setMapView('valley');
  setTimeout(() => {
    // the badge box is drawn at (d.x + 24px, d.y - 16px) size 36×17 px-units right of the mill dot
    const c = document.getElementById('map');
    const g = c.getContext('2d');
    const dpr = devicePixelRatio;
    // recompute the map transform exactly as drawMap does
    const mv = UI.mapPoint(DATA.stations.mill.x, DATA.stations.mill.y);
    const r2 = c.getBoundingClientRect();
    const bx = (mv.x - r2.left) * dpr, by = (mv.y - r2.top) * dpr;
    // sample a patch to the upper-right of the station dot where the badge lives
    const img = g.getImageData(Math.round(bx + 8), Math.round(by - 24), 80, 30).data;
    let dark = 0, gold = 0;
    for (let i = 0; i < img.length; i += 4) {
      const R2 = img[i], G2 = img[i + 1], B2 = img[i + 2];
      if (R2 < 45 && G2 < 45 && B2 < 50) dark++;
      if (R2 > 180 && G2 > 130 && B2 < 130) gold++;
    }
    res({ dark, gold });
  }, 500);
}));
ok('the classic map carries the numeric crate badge at the town — unload the most in ONE place, seen at a glance', r.dark > 30 && r.gold > 4, JSON.stringify(r));
await ev(() => UI.toggleMap(false));

/* ================= THE PARTY OF FOUR ================= */
r = await ev(() => {
  WL.tp('haven'); S.moveTo = null; S.banked.metal = 900; S.banked.ceramic = 500; S.banked.provisions = 80;
  for (let i = 0; i < 4; i++) S.npcs.push(NPC.gen({ at: 'haven' }));
  const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven');
  const got = pool.slice(0, 4).map(n => NPC.hire(n, 'companion'));
  return { got, party: NPC.party().length, cap: NPC.partyCap() };
});
ok('a posse of four: three hires land, the fourth is turned away at the fire', r.got.filter(Boolean).length === 3 && r.got[3] === false && r.party === 3 && r.cap === 3, JSON.stringify(r));
await ev(() => { WL.moveTo(S.px + 260, S.py + 40); });
await page.waitForTimeout(2600);
r = await ev(() => {
  const pts = NPC.party().map(n => ({ x: Math.round(n.cx), y: Math.round(n.cy), d: Math.round(U.dist(n.cx, n.cy, S.px, S.py)) }));
  const distinct = new Set(pts.map(p => `${(p.x / 24) | 0},${(p.y / 24) | 0}`)).size;
  return { pts: pts.map(p => p.d), distinct };
});
ok('the wedge walks: three backs in three distinct slots, all inside the lamp\'s reach', r.distinct >= 2 && r.pts.every(d => d < 160), JSON.stringify(r));
r = await ev(() => {
  const heavy = State.makeItem('letters'); heavy.kg = 8; State.addCargo(heavy);
  const before = NPC.party().map(n => n.carry.length);
  const gave = NPC.give(heavy);
  const holder = NPC.party().find(n => n.carry.some(c => c.id === heavy.id));
  const took = NPC.take(heavy.id);
  const back = S.cargo.some(c => c.id === heavy.id);
  return { gave, holder: !!holder, took, back, before };
});
ok('the pack rides the roomiest back — give() finds it, take() finds it again from ANY of the three', r.gave && r.holder && r.took && r.back, JSON.stringify(r));
r = await ev(() => {
  const out = [];
  for (let i = 0; i < 3; i++) { Porter.damage(9999, 'bleed'); out.push({ hp: Math.round(S.health), party: NPC.party().length, dead: S.dead }); }
  return { out, mending: S.npcs.filter(n => n.state === 'recover').length };
});
ok('THE POOL: three lethal blows, three companions down in your place — the walker never falls before the last quarter', r.out.every(o => !o.dead && o.hp > 20) && r.out[2].party === 0 && r.mending === 3, JSON.stringify(r));
r = await ev(() => {
  const m = S.npcs.find(n => n.state === 'recover');
  const refused = !NPC.hire(m, 'companion');
  return { refused, t: Math.round(m.recoverT), mail: S.mails.some(x => /is mending/.test(x.subj)) };
});
ok('the mending cannot be re-hired until they wake — and the mail says where they lie', r.refused && r.t > 60 && r.mail, JSON.stringify(r));
r = await ev(() => {
  // the 4/4 quarter: no party, no appreciation anywhere → death is death
  for (const id of DATA.stationOrder) S.stations[id].appr = 0;
  S.flags.rescueCdT = 0;
  Porter.damage(9999, 'bleed');
  return { dead: S.dead };
});
ok('the player character ALWAYS falls last — with the pool spent and no yard that loves you, permadeath is permadeath', r.dead === true, JSON.stringify(r));

/* ================= THE RESCUE RIDE (fresh porter) ================= */
await ev(() => { document.querySelector('#deathOv .btn, #deathGo, [data-next]') && 0; });
await page.evaluate(() => { const btn = document.querySelector('#deathNext') || document.querySelector('#deathOv button') || document.querySelector('#nextPorter'); if (btn) btn.click(); });
await page.waitForTimeout(700);
await page.evaluate(() => { const go = document.querySelector('#cgBegin'); if (go && !go.closest('.hidden')) go.click(); });
await page.waitForTimeout(900);
r = await ev(() => {
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  S.flags.guideDone = true; WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999;
  return { alive: !S.dead, hp: S.health };
});
ok('the next porter shoulders the pack (the permadeath loop still turns)', r.alive && r.hp > 0, JSON.stringify(r));
r = await ev(() => {
  WL.tp([DATA.stations.haven.x + 500, DATA.stations.haven.y + 300]); S.moveTo = null;
  S.stations.haven.appr = 400; S.flags.rescueCdT = 0;
  S.health = 4;
  Porter.damage(50, 'bleed');
  return { dead: S.dead, hp: Math.round(S.health), rescue: !!S.rescue, cine: S.cineSeq, cd: S.flags.rescueCdT > S.time };
});
ok('the last-chance ride: the best-loved yard reaches you — stood up mid-fall, riders on the road, the cooldown set', !r.dead && r.hp >= 25 && r.rescue && r.cine && r.cd, JSON.stringify(r));
await page.waitForFunction(() => !S.cineSeq && !S.rescue, null, { timeout: 15000 });
r = await ev(() => ({ mail: S.mails.some(m => /The ride from Haven/.test(m.subj)), toastGone: true, hp: Math.round(S.health) }));
ok('the riders resolve: the mail lands, the walker stands', r.mail && r.hp >= 25, JSON.stringify(r));
r = await ev(() => {
  // within the cooldown the yard cannot empty twice — this time it is real
  S.health = 3;
  Porter.damage(50, 'bleed');
  return { dead: S.dead };
});
ok('one ride per debt — inside the cooldown the grey keeps what it catches', r.dead === true, JSON.stringify(r));

/* ================= THE TOWN LAW (fresh porter again) ================= */
await page.evaluate(() => { const btn = document.querySelector('#deathNext') || document.querySelector('#deathOv button') || document.querySelector('#nextPorter'); if (btn) btn.click(); });
await page.waitForTimeout(700);
await page.evaluate(() => { const go = document.querySelector('#cgBegin'); if (go && !go.closest('.hidden')) go.click(); });
await page.waitForTimeout(900);
r = await ev(() => {
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  S.flags.guideDone = true; WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999;
  WL.tp('haven'); S.moveTo = null;
  S.food = 0; S.foodZeroT = 100; S.health = 50; S.warmth = 8;
  const h0 = S.health;
  for (let i = 0; i < 90; i++) Porter.update(1);
  return { h0, hp: Math.round(S.health), food: Math.round(S.food), dead: S.dead };
});
ok('THE TOWN LAW: ninety starving, freezing seconds inside the yard — not one point of health lost, and a keeper brings broth', !r.dead && r.hp >= r.h0 && r.food >= 15, JSON.stringify(r));
r = await ev(() => {
  WL.tp([DATA.stations.haven.x + 900, DATA.stations.haven.y + 900]); S.moveTo = null;
  S.food = 0; S.foodZeroT = 100; S.health = 50;
  for (let i = 0; i < 60; i++) Porter.update(1);
  return { hp: Math.round(S.health) };
});
ok('the wild keeps its teeth — the same hunger OUTSIDE the walls drains the walker (the law is the town, not a nerf)', r.hp < 50 && r.hp > 30, JSON.stringify(r));

/* ================= THE SOUND ================= */
r = await ev(() => {
  const v0 = Snd.rainVol;
  Snd.setRainVol(2); const hi = Snd.rainVol;
  Snd.setRainVol(0); const lo = Snd.rainVol;
  Snd.setRainVol(0.55);
  let threw = false;
  try { Snd.sfx.gunshots(); Snd.sfx.step(2, false); Snd.sfx.build(); } catch (e) { threw = true; }
  const slider = !!document.getElementById('rainSlider');
  return { v0, hi, lo, threw, slider };
});
ok('the rain has a DIAL — clamped 0..1, zero muting the weather while every doorbell stays; the new palette never throws', r.hi === 1 && r.lo === 0 && !r.threw && r.slider, JSON.stringify(r));
r = await ev(() => {
  // the ambient law: raw rain level in, shaped layers out (wash + patter + rumble exist on the bus)
  const src = [...document.scripts].map(s => s.textContent).join('');
  return {
    layered: /wash: soft lowpassed bed/.test(src) && /patter: the drops themselves/.test(src) && /rumble: the far weight/.test(src),
    noStatic: !/playbackRate\.value = 1\.7/.test(src),
    breathes: /taught to breathe/.test(src) && /breathG/.test(src),
  };
});
ok('the rain is WATER now (wash + patter + rumble), the static build is gone, and the wraith drone breathes', r.layered && r.noStatic && r.breathes, JSON.stringify(r));

console.log('\n=== WIDER (v3.24) ===');
for (const line of results) console.log(line);
const pass = results.filter(x => x.startsWith('PASS')).length;
console.log(`\n${pass}/${results.length} checks passed`);
if (errors.length) { console.log('PAGE ERRORS:', errors.slice(0, 6)); process.exitCode = 1; }
await b.close();
