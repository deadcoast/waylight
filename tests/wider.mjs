/* wider.mjs — v3.24 THE WIDER WORLD & THE PRODUCTION (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the
   v3.48 source was lost; its figures sampled on the courier's grid). The Cine engine: a shot list played (the sequence owns
   the camera, the letterbox and the world's clock), a CUT's hard reposition and drift, a HOLD freezing the world under its
   stamp, any key skipping to the end. THE RIDE: its actors on the ground (the kneeling courier, the Reapers' pale eyes by
   their one cold lamp, the rider, the watch ridge and the kid) against the same frame without them; the bolt toward the
   light; the gunfire displaced (the camera veering up and away while three shots are heard); the aftermath, once ever. THE
   GLOBE: the regions' shape; a per-pixel planet with no gradient call; the drag, the spin and the inertia; the one count of
   the load, on the globe's pin and as the map's crate badge. THE PARTY OF FOUR: the cap, the wedge, the roomiest back, the
   three quarters, the mending refused, the walker falling last, the next porter owing the dead one's debt nothing. THE
   RESCUE RIDE: fired by the best-loved yard, resolved (stood up, the road burned clear, the party rallied, the letter), one
   ride a debt. THE TOWN LAW inside and outside the walls. The rain: its own dial, persisted, muting the weather and not the
   doorbells; the water in three layers on one bus. */
import { readFileSync } from 'fs';
import { boot, PAGE } from './lib/harness.mjs';

const T = await boot({ start: false });
const { page, ev, ok, drain } = T;

/* the audio graph watched from before the first gesture builds it: every connection, every level set */
await ev(() => {
  window.__audio = { edges: [], targets: new Map(), osc: 0, buf: 0 };
  const oc = AudioNode.prototype.connect; AudioNode.prototype.connect = function (dst, ...r) { __audio.edges.push([this, dst]); return oc.call(this, dst, ...r); };
  const st = AudioParam.prototype.setTargetAtTime; AudioParam.prototype.setTargetAtTime = function (v, t, c) { __audio.targets.set(this, v); return st.call(this, v, t, c); };
  const co = BaseAudioContext.prototype.createOscillator; BaseAudioContext.prototype.createOscillator = function () { __audio.osc++; return co.call(this); };
  const cb = BaseAudioContext.prototype.createBufferSource; BaseAudioContext.prototype.createBufferSource = function () { __audio.buf++; return cb.call(this); };
});
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
await ev(() => {
  S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true; S.flags.lamp = true;   // the exiles came long ago: the fall lane is spent
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  for (const id of ['elm', 'mill']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true);
  window.__rec = (obj, key) => { const calls = [], f = obj[key]; obj[key] = (...a) => { calls.push(a); return f.apply(obj, a); }; return { calls, off: () => { obj[key] = f; } }; };
  window.__run = secs => { for (let t = 0; t < secs - 1e-9; t += 0.05) Cine.tick(0.05); };
});

/* ================= 1–4 · THE CINE ENGINE ================= */
const engine = await ev(async () => {
  WL.timeScale = 0.001; WL.tp('haven'); S.px += 300; await __frames(2);
  const A = { x: S.px + 260, y: S.py - 120 }, B = { x: S.px - 200, y: S.py + 90 }, say = __rec(Render, 'say'); let ended = 0;
  const played = Cine.play([
    { move: 'cut', at: A, zoom: 1.3, dur: 1.0, say: { line: 'The first shot.', col: '198,206,186' } },
    { move: 'push', at: B, zoom: 1.4, zoomTo: 2.2, dur: 1.0 },
    { move: 'hold', at: B, zoom: 1.6, dur: 1.0, fx: { stamp: 'THE TEST HOLDS.' } },
  ], { ts: 0.4, onEnd: () => { ended++; } });
  await __frames(3);
  const play = { played, seq: !!S.cineSeq, active: Cine.active(), lb: document.body.classList.contains('cine'), ts: S.timeScale, cam: [Math.round(Render.cam.x - A.x), Math.round(Render.cam.y - A.y)], z: +Render.cam.z.toFixed(3), said: say.calls.some(c => c[2] === 'The first shot.'), again: Cine.play([{ move: 'cut', dur: 1 }]) };
  /* the cut's drift, from the engine's own camera: 2% a second, for life */
  const z0 = Cine.cam(0).z, z1 = Cine.cam(0.5).z, drift = z1 / z0;
  __run(1.02);   // into the push: it opens on its own subject and pushes in
  const pushA = Cine.cam(0); __run(0.5); const pushB = Cine.cam(0);
  const push = { ts: S.timeScale, onB: Math.hypot(pushA.x - B.x, pushA.y - B.y) < 1, zA: +pushA.z.toFixed(3), zB: +pushB.z.toFixed(3) };
  __run(0.52);   // the hold
  await __frames(3);
  const hold = { ts: S.timeScale, stamp: Cine.fx() && Cine.fx().stamp, st: S.time };
  await __wait(200); await __frames(2); const held = S.time === hold.st;
  const c = { x: innerWidth / 2, y: innerHeight * 0.72 }, g = document.getElementById('game').getContext('2d');   // the stamp is slammed across the lower third
  const grab = () => g.getImageData(c.x - 400, c.y - 90, 800, 180).data;
  const withStamp = grab(); const fx = Cine.fx(); const keep = fx.stamp; fx.stamp = null; await __frames(3); const without = grab(); fx.stamp = keep;
  hold.held = held; hold.stampPixels = __diff(withStamp, without);
  __run(1.1);
  const end = { seq: !!S.cineSeq, ts: S.timeScale, lb: document.body.classList.contains('cine'), ended };
  say.off();
  return { play, drift: +drift.toFixed(4), push, hold, end };
});
ok('THE ENGINE PLAYS: a scene is a shot list — Cine.play takes the sequence, the letterbox comes up, the world drops to the scene\'s clock (0.4), the first shot\'s line is spoken, the camera is the engine\'s outright; while one plays no other can start',
  engine.play.played && engine.play.seq && engine.play.active && engine.play.lb && engine.play.ts === 0.4 && engine.play.said && engine.play.again === false, JSON.stringify(engine.play));
ok('THE CUT: a CUT puts the camera on its subject at once (a hard reposition, not a pan) at the shot\'s own zoom, and drifts it 2% a second for the shot\'s life; the PUSH after it opens on its own subject and pushes in (the Postman\'s slow zoom, 1.4 toward 2.2)',
  Math.abs(engine.play.cam[0]) <= 1 && Math.abs(engine.play.cam[1]) <= 1 && Math.abs(engine.play.z - 1.3) < 0.02 && Math.abs(engine.drift - 1.01) < 0.0005 && engine.push.onB && engine.push.zA < 1.42 && engine.push.zB > engine.push.zA + 0.25, JSON.stringify({ cam: engine.play.cam, z: engine.play.z, drift: engine.drift, push: engine.push }));
ok('THE HOLD AND ITS STAMP: a HOLD freezes the world outright (the time scale at zero, the world\'s clock standing still) and slams its stamp on the frame — measured against the same frame without it — then the sequence ends on its own: the clock at speed, the letterbox down, the end called once',
  engine.hold.ts === 0 && engine.hold.stamp === 'THE TEST HOLDS.' && engine.hold.held && engine.hold.stampPixels > 400 && !engine.end.seq && engine.end.ts === 1 && !engine.end.lb && engine.end.ended === 1, JSON.stringify({ hold: engine.hold, end: engine.end }));
await ev(() => { window.__skipEnd = 0; Cine.play([{ move: 'cut', at: { x: S.px, y: S.py }, zoom: 1.5, dur: 5 }, { move: 'hold', dur: 5, fx: { stamp: 'NEVER SEEN.' } }], { ts: 0.25, onEnd: () => { window.__skipEnd++; } }); });
await page.waitForTimeout(200);
const before = await ev(() => ({ seq: !!S.cineSeq, ts: S.timeScale }));
await page.keyboard.press('Space'); await page.waitForTimeout(150);
const skip = await ev(() => ({ seq: !!S.cineSeq, active: Cine.active(), ts: S.timeScale, lb: document.body.classList.contains('cine'), ended: window.__skipEnd }));
ok('ANY KEY SKIPS: a ten-second scene a fifth of a second in — one press and it is over: the sequence gone, the clock and the letterbox restored, its end run once',
  before.seq && before.ts === 0.25 && !skip.seq && !skip.active && skip.ts === 1 && !skip.lb && skip.ended === 1, JSON.stringify({ before, skip }));

/* ================= 5–8 · THE RIDE ================= */
const ride = await ev(async () => {
  WL.timeScale = 0.001; S.level = 4;
  let spot = null; for (let y = 600; y < 4200 && !spot; y += 60) for (let x = 900; x < DATA.W - 900 && !spot; x += 60) if (World.mistAt(x, y) > 0.66 && World.mistAt(x + 250, y) > 0.5 && !World.terrainAt(x, y).blocked && DATA.stationOrder.every(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) > 1100)) spot = { x, y };
  WL.tp([spot.x, spot.y]); S.dir = 0; S.speed = 40; if (S.time < 250) S.time = 250;
  const mails0 = new Set(S.mails), likes0 = S.likes, say = __rec(Render, 'say'), shots = __rec(Snd.sfx, 'gunshots');
  /* not yet a legend: nothing */
  S.level = 1; Myth.tick(0.05); const stranger = !S.ride;
  S.level = 4; S.speed = 40; Myth.tick(0.05);
  const R = S.ride; if (!R) return { spot, began: false };
  await __wait(150); await __frames(3);
  const gx = R.gx, gy = R.gy;
  /* the cold lamp's head on its staff, beside the captive: its cold light as the night-dimmed frame shows it (blue well over red
     and green), read in the same two frames — the Reapers' own pale eyes stand well outside this square */
  const lampAt = () => { const d = __grab(gx + 16, gy - 21, 20); let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 110 && d[i + 2] > d[i] + 30 && d[i + 2] > d[i + 1] + 20) n++; return n; };
  const on = __grab(gx + 20, gy, 160), lampOn = lampAt(); const keepR = S.ride; S.ride = null; await __frames(3); await __wait(60); await __frames(2); const off = __grab(gx + 20, gy, 160), lampOff = lampAt(); S.ride = keepR;
  await __frames(3);
  const eyes = __count(on, __hex('#9aa4ff'), 10), eyesOff = __count(off, __hex('#9aa4ff'), 10);
  const actors = { reapers: R.reapers.length, watchers: R.watchers.length, kid: R.watchers.filter(w => w.kid).length, captive: !!R.captive, changed: __diff(on, off), eyes, eyesOff, lampOn, lampOff, first: say.calls.map(c => c[2])[0] };
  /* the bolt: the third shot's word, the rider away toward the nearest lit town */
  const near = DATA.stationOrder.filter(id => S.stations[id].connected).sort((a, b) => U.dist(gx, gy, DATA.stations[a].x, DATA.stations[a].y) - U.dist(gx, gy, DATA.stations[b].x, DATA.stations[b].y))[0];
  const r0 = { x: R.rider.x, y: R.rider.y };
  __run(2.3 + 2.3 + 0.05);
  const bolt = { bolted: R.rider.bolted, aim: R.aim, said: say.calls.map(c => c[2]).filter(t => /DAD|RIDE, WAYLIGHTER/.test(t)) };
  __run(2.2 + 2.4 - 0.05 + 0.05);
  const toTown = Math.atan2(DATA.stations[near].y - gy, DATA.stations[near].x - gx), moved = Math.atan2(R.rider.y - r0.y, R.rider.x - r0.x);
  bolt.gone = Math.round(U.dist(R.rider.x, R.rider.y, r0.x, r0.y)); bolt.heading = +Math.abs(Math.atan2(Math.sin(moved - toTown), Math.cos(moved - toTown))).toFixed(3); bolt.toward = near;
  /* the veer: the shots heard 1.1 s in, while the camera is up and away from the ground */
  const v0 = Cine.cam(0); const osc0 = __audio.osc, buf0 = __audio.buf;
  __run(1.15);
  const v1 = Cine.cam(0), fx = Cine.fx();
  const gun = { shots: shots.calls.length, osc: __audio.osc - osc0, buf: __audio.buf - buf0, flickers: fx ? fx.flickers.length : 0, up: Math.round(gy - v1.y), zoomOut: +(v0.z - v1.z).toFixed(2), onGroundAtStart: Math.round(Math.hypot(v0.x - gx, v0.y - gy)) };
  __run(1.6);
  const stamp = Cine.fx() ? Cine.fx().stamp : null;
  __run(1.8);
  const letter = S.mails.filter(m => !mails0.has(m)).find(m => m.subj === 'Recon, in from the grey');
  const after = { ride: S.ride, seq: !!S.cineSeq, likes: S.likes - likes0, letter: letter ? letter.body : null, seen: !!S.flags.rideSeen, stamp };
  /* once, ever: the same deep push again */
  S.speed = 40; Myth.tick(0.05); after.again = !!S.ride || !!S.cineSeq;
  say.off(); shots.off(); S.level = 1; WL.timeScale = 1;
  return { spot, stranger, actors, bolt, gun, after };
});
ok('THE RIDE\'S ACTORS: on the first deep-grey push after the legend starts (a stranger still, nothing) the firing-squad parody opens on its WIDE cut — the captive Waylighter kneeling, four Reaper cloaks with pale eyes by one cold staff-lamp (its cold light on the frame at the lamp\'s head, none there without the scene), a second rider held at the edge, the watch ridge of five with a kid pressed to the front — drawn on the ground against the same frame without them; "Reapers. They took two of ours at the crossing."',
  ride.stranger && ride.actors.reapers === 4 && ride.actors.watchers === 5 && ride.actors.kid === 1 && ride.actors.captive && ride.actors.changed > 2000 && ride.actors.eyes > ride.actors.eyesOff + 4 && ride.actors.lampOn >= 20 && ride.actors.lampOff === 0 && ride.actors.first === 'Reapers. They took two of ours at the crossing.',
  JSON.stringify({ spot: ride.spot, actors: ride.actors }));
ok('THE BOLT: "THAT\'S MY DAD!" from the ridge, then "RIDE, WAYLIGHTER! RIIIIIIIDE!!" — the rifles level and the held rider BOLTS toward the light: away hundreds of units, headed for the nearest lit town',
  ride.bolt.bolted && ride.bolt.aim && ride.bolt.said.includes('THAT\'S MY DAD!') && ride.bolt.said.includes('RIDE, WAYLIGHTER! RIIIIIIIDE!!') && ride.bolt.gone > 400 && ride.bolt.heading < 0.05, JSON.stringify(ride.bolt));
ok('THE GUNFIRE, DISPLACED: the camera does the merciful thing — it veers up and away from the ground (pulled back as it climbs) — and the three shots are HEARD: one distant triple of cracks (three booms, three chest thumps, the hills answering) and three muzzle flickers in the sky',
  ride.gun.shots === 1 && ride.gun.osc === 3 && ride.gun.buf === 9 && ride.gun.flickers === 3 && ride.gun.up > 80 && ride.gun.zoomOut > 0.3 && ride.gun.onGroundAtStart < 5, JSON.stringify(ride.gun));
ok('THE AFTERMATH, ONCE EVER: HOLD — "THE MAIL GOT OUT." — then the recon letter (the kid has not stopped saying RIDE), four likes, the scene let go; the same deep push again brings nothing, ever',
  ride.after.stamp === 'THE MAIL GOT OUT.' && ride.after.ride === null && !ride.after.seq && ride.after.likes === 4 && /He has not stopped saying RIDE/.test(ride.after.letter || '') && ride.after.seen && !ride.after.again, JSON.stringify(ride.after));

/* ================= 9–13 · THE GLOBE ================= */
const shape = await ev(() => ({ regions: Globe.REGIONS.map(r => ({ id: r.id, keys: ['id', 'name', 'lon', 'lat', 'open', 'blurb'].every(k => k in r), kind: r.kind, open: r.open })), reaches: Object.keys(Frontier.REACHES) }));
ok('THE REGIONS: the globe\'s pins are data — every region {id, name, lon, lat, open, blurb} — the Greymarch the one open, the uncharted reaches the very ground the recon system rides out to (v3.25: the lore\'s places — Waylight and the Farlands known, two reaches uncharted)',
  shape.regions.every(r => r.keys) && shape.regions.filter(r => r.open).map(r => r.id).join() === 'greymarch' && shape.regions.filter(r => r.kind === 'uncharted').every(r => shape.reaches.includes(r.id)) && shape.regions.length === 5, JSON.stringify(shape));

await ev(() => { window.__grad = 0; for (const k of ['createLinearGradient', 'createRadialGradient', 'createConicGradient']) { const f = CanvasRenderingContext2D.prototype[k]; if (f) CanvasRenderingContext2D.prototype[k] = function (...a) { __grad++; return f.apply(this, a); }; } WL.timeScale = 1; });
await page.keyboard.press('KeyM'); await page.waitForTimeout(300);
await page.click('#btnViewWorld'); await page.waitForTimeout(800);
const planet = await ev(async () => {
  const g0 = __grad, t0 = Globe._st.t; await __wait(700); await __frames(2);
  const cv = document.getElementById('globe'), { DSZ, R } = Globe._pad(), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, C = DSZ / 2;
  const cols = new Set(); let sea = 0, land = 0, bright = 0, dark = 0, n = 0;
  for (let y = 0; y < DSZ; y += 2) for (let x = 0; x < DSZ; x += 2) {
    if ((x - C) ** 2 + (y - C) ** 2 > (R * 0.95) ** 2) continue; const i = (y * DSZ + x) * 4, r = d[i], gg = d[i + 1], b = d[i + 2]; n++;
    cols.add(r << 16 | gg << 8 | b); if (b > r + 15 && b > gg) sea++; else if (gg >= b && r > 30) land++; if (r + gg + b > 600) bright++; if (r + gg + b < 60) dark++;
  }
  return { gradCalls: __grad - g0, frames: Globe._st.t > t0, n, colours: cols.size, sea, land, bright, dark };
});
const src = readFileSync(new URL(PAGE.split('?')[0]), 'utf8');
const builds = { radial: (src.match(/createRadialGradient\(/g) || []).length, linear: (src.match(/createLinearGradient\(/g) || []).length };
ok('THE PLANET RENDERS: the world tab draws a per-pixel shaded planet — thousands of distinct shades across the disc, sea and land both, sunlit highs and a night side — and not one canvas gradient call while it spins (the build itself holding exactly one radial gradient, the screen\'s vignette, and no linear one)',
  planet.frames && planet.gradCalls === 0 && planet.colours > 2000 && planet.sea > 500 && planet.land > 300 && planet.dark > 100 && builds.radial === 1 && builds.linear === 0, JSON.stringify({ planet, builds }));

const box = await page.locator('#globeOv').boundingBox();
const spin0 = await ev(async () => { Globe._st.vel = 0; const a = Globe._st.rot; await __wait(1000); return { a, b: Globe._st.rot }; });
const rotA = await ev(() => Globe._st.rot);
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
for (let k = 1; k <= 6; k++) { await page.mouse.move(box.x + box.width / 2 + k * 30, box.y + box.height / 2); await page.waitForTimeout(16); }
const rotHeld = await ev(() => ({ rot: Globe._st.rot, R: Globe._pad().R }));
await page.mouse.up();
const inertia = await ev(async () => { const v = Globe._st.vel; await __wait(600); return { v, v2: Globe._st.vel, rot: Globe._st.rot }; });
ok('THE ROTATION: the planet spins on its own when nobody holds it, a real drag turns it by the hand (180 px across the disc) and a fast release leaves it coasting, the inertia bleeding away',
  spin0.b - spin0.a > 0.006 && Math.abs((rotA - rotHeld.rot) - 180 / rotHeld.R * 1.1) < 0.05 && Math.abs(inertia.v) > 0.05 && Math.abs(inertia.v2) < Math.abs(inertia.v),
  JSON.stringify({ spin: spin0, rotA, rotHeld, inertia }));

const counts = await ev(async () => {
  WL.tp('haven'); S.orders.active = []; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  const none = Systems.deliverableCounts();
  const o = Economy.ordersFor('haven').find(x => x.to === 'mill' && x.item !== 'letters' && !x.errand); Systems.acceptOrder(o, false);
  const lost = State.makeItem('meds'); lost.lostTo = 'elm'; State.addCargo(lost);
  const counts = Systems.deliverableCounts(), held = S.cargo.filter(c => c.orderId).length;
  /* the globe's pin carries the tally: the pin turned to face the glass, the tally box read with and without the load */
  const ov = document.getElementById('globeOv'), tally = () => __count(ov.getContext('2d').getImageData(0, 0, ov.width, ov.height).data, __hex('#1d2430'), 2);
  let best = -1, rot = 0; for (let k = 0; k < 24; k++) { Globe._st.rot = k / 24 * Math.PI * 2; Globe._st.vel = 0; await __frames(2); const n = tally(); if (n > best) { best = n; rot = Globe._st.rot; } }
  Globe._st.rot = rot; await __frames(2); const withLoad = tally();
  const keep = S.cargo.slice(); S.cargo = S.cargo.filter(c => !c.orderId && !c.lostTo); await __frames(3); const withoutLoad = tally(); S.cargo = keep;
  return { none, counts, held, withLoad, withoutLoad };
});
ok('THE ONE COUNT: Systems.deliverableCounts() is the one truth about the load — the mission crates held per destination door (the Mill) plus the lost finds riding home (Elm) — and the globe\'s Greymarch pin carries the regional tally box while anything is aboard, and none when nothing is',
  Object.keys(counts.none).length === 0 && counts.counts.mill === counts.held && counts.held >= 1 && counts.counts.elm === 1 && Object.keys(counts.counts).length === 2 && counts.withLoad > 100 && counts.withoutLoad === 0, JSON.stringify(counts));

await page.click('#btnViewValley'); await page.waitForTimeout(300);
await page.keyboard.press('KeyM'); await page.waitForTimeout(200); await page.keyboard.press('KeyM'); await page.waitForTimeout(400);   // the sheet reopened on the valley, centred on the walker at Haven
const badge = await ev(async () => {
  const cv = document.getElementById('map'), g = cv.getContext('2d'), r = cv.getBoundingClientRect(), dpr = devicePixelRatio;
  const near = id => { UI.drawMap(); const p = UI.mapPoint(DATA.stations[id].x, DATA.stations[id].y), x = (p.x - r.left) * dpr, y = (p.y - r.top) * dpr; const d = g.getImageData(Math.round(x - 10), Math.round(y - 70), 140, 90).data; return __count(d, __hex('#241d12'), 3); };
  const mill = near('mill'), elm = near('elm'), haven = near('haven');
  /* what one draw of the map lays in its badges: the earn feed's own crate image (its authored 9×9), and the ×N beside it */
  const crate = UI.earnIconImg('mat'); await crate.decode().catch(() => {});
  const P = CanvasRenderingContext2D.prototype, di0 = P.drawImage, ft0 = P.fillText, laid = { icons: 0, texts: [] };
  P.drawImage = function (im, ...a) { if (this === g && im === crate) laid.icons++; return di0.call(this, im, ...a); };
  P.fillText = function (t, ...a) { if (this === g && /^×/.test(String(t))) laid.texts.push(String(t)); return ft0.call(this, t, ...a); };
  try { UI.drawMap(); } finally { P.drawImage = di0; P.fillText = ft0; }
  const keep = S.cargo.slice(); S.cargo = S.cargo.filter(c => !c.orderId && !c.lostTo); const millNone = near('mill'); S.cargo = keep;
  return { mill, elm, haven, millNone, laid, icon: [crate.naturalWidth, crate.naturalHeight], counts: Systems.deliverableCounts() };
});
await page.keyboard.press('KeyM'); await page.waitForTimeout(200);
ok('THE MAP BADGE: the classic map wears a crate badge (the earn feed\'s own crate, ×N — the very 9×9 image the earn feed draws, and beside it the count of crates bound for that door) beside every town the load is bound for — the Mill for its crates, Elm for the find riding home — none at Haven, and none at the Mill once the load is off the back',
  badge.mill > 100 && badge.elm > 100 && badge.haven === 0 && badge.millNone === 0 && badge.icon.join() === '9,9' && badge.laid.icons === 2
  && badge.laid.texts.slice().sort().join() === [`×${badge.counts.mill}`, `×${badge.counts.elm}`].sort().join(), JSON.stringify(badge));

/* ================= 14–19 · THE PARTY OF FOUR ================= */
const party = await ev(async () => {
  WL.tp('haven'); WL.timeScale = 0.001; S.orders.active = []; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  Object.assign(S.banked, { metal: 500, ceramic: 300 });
  S.npcs.forEach(n => { if (n.state === 'companion') n.state = 'pool'; });
  const hands = [0, 1, 2, 3].map(() => { const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); return n; });
  const toast = __rec(UI, 'toast');
  const hired = hands.map(n => NPC.hire(n, 'companion'));
  const full = toast.calls.map(c => String(c[0])).find(t => /The party is full/.test(t)) || null; toast.off();
  window.__hands = hands;
  return { cap: NPC.partyCap(), hired, full: full && full.replace(/<[^>]+>/g, ''), party: NPC.party().length };
});
ok('THE CAP: up to three companions walk with the walker — the party of four — and a fourth hire is refused ("The party is full — 3 walk with you already")',
  party.cap === 3 && party.hired.join() === 'true,true,true,false' && party.party === 3 && /The party is full — 3 walk with you already/.test(party.full || ''), JSON.stringify(party));
const wedge = await ev(async () => {
  S.dir = 0; S.speed = 0;
  for (let i = 0; i < 120; i++) NPC.update(0.1);
  const pt = NPC.party(), slots = [[-42, 0], [-58, 30], [-58, -30]];
  const pos = pt.map(n => [Math.round(n.cx - S.px), Math.round(n.cy - S.py)]);
  const onSlot = pt.map((n, i) => Math.hypot(n.cx - (S.px + slots[i][0]), n.cy - (S.py + slots[i][1])));
  const shown = UI2.wedgeShown(); UI2.toggleWedge(false); const hidden = document.getElementById('compChip').classList.contains('hidden'); UI2.toggleWedge(true); const back = !document.getElementById('compChip').classList.contains('hidden');
  return { pos, onSlot: onSlot.map(v => Math.round(v)), shown, hidden, back, stateShown: UI2.wedgeShown() };
});
ok('THE WEDGE: the three walk a staggered wedge behind the walker, each on their own slot (42 back; 58 back and 30 to either side), never on one another; the party card shows the wedge and folds away and back on its own toggle',
  wedge.onSlot.every(v => v <= 14) && new Set(wedge.pos.map(p => p.join())).size === 3 && wedge.pos.every(p => p[0] < -30) && wedge.hidden && wedge.back && wedge.stateShown, JSON.stringify(wedge));
const back = await ev(() => {
  const pt = NPC.party(), loads = [20, 4, 12];
  pt.forEach((n, i) => { n.carry = []; const it = State.makeItem('food'); it.kg = loads[i]; n.carry.push(it); });
  const free = pt.map(n => Math.round(NPC.capOf(n) - n.carry.reduce((a, c) => a + c.kg, 0)));
  const item = State.makeItem('textiles'); State.addCargo(item);
  const gave = NPC.give(item), who = pt.findIndex(n => n.carry.some(c => c.id === item.id));
  const roomiest = free.indexOf(Math.max(...free));
  const took = NPC.take(item.id), home = S.cargo.some(c => c.id === item.id);
  pt.forEach(n => { n.carry = []; });
  return { free, gave, who, roomiest, took, home };
});
ok('THE ROOMIEST BACK: a crate handed to the party goes on whichever back has the most room left, and taking it back searches all three',
  back.gave && back.who === back.roomiest && back.took && back.home, JSON.stringify(back));
const quarters = await ev(() => {
  WL.tp('haven'); S.px += 900; S.flags.rescueCdT = S.time + 99999;   // no yard rides for this measure
  const out = [];
  for (let k = 0; k < 3; k++) { const fell = NPC.party().slice(-1)[0]; Porter.damage(999, 'bleed'); out.push({ dead: !!S.dead, hp: S.health, party: NPC.party().length, fell: fell.state, recoverT: fell.recoverT, at: fell.at }); }
  return { out, cleared: !S.dead };
});
ok('THE THREE QUARTERS: the party is the health pool — three blows that would each drop the walker are taken by the companions in turn, the newest first (each down, carried to the nearest lit town to mend for nine minutes), and after each the walker stands back up at 32',
  quarters.out.map(o => o.party).join() === '2,1,0' && quarters.out.every(o => !o.dead && o.hp === 32 && o.fell === 'recover' && o.recoverT === 540 && o.at === 'haven') && quarters.cleared, JSON.stringify(quarters));
const mend = await ev(() => {
  const n = __hands[2], toast = __rec(UI, 'toast');
  const refused = NPC.hire(n, 'companion'), line = toast.calls.map(c => String(c[0]).replace(/<[^>]+>/g, '')).find(t => /still mending/.test(t)) || null; toast.off();
  const mails0 = new Set(S.mails); n.recoverT = 0.5; NPC.update(1); const woke = n.state, mail = S.mails.filter(m => !mails0.has(m)).find(m => /is back on their feet/.test(m.subj));
  const bank0 = { ...S.banked }; const rehired = NPC.hire(n, 'companion'), free = bank0.metal === S.banked.metal && bank0.ceramic === S.banked.ceramic;
  n.state = 'recover'; n.recoverT = 400; n.koFromParty = true;   // back down to mend: the measure below falls with an empty party
  return { refused, line, woke, mail: mail ? mail.body : null, rehired, free };
});
ok('THE MENDING REFUSED, THEN THE DEBT PAID: a companion still mending cannot be hired ("still mending — 9:00 before they can walk" or what is left of it); on waking they are back in the pool, re-hirable fee-free — "you already paid it in blood"',
  mend.refused === false && /still mending/.test(mend.line || '') && mend.woke === 'pool' && /No fee — you already paid it in blood/.test(mend.mail || '') && mend.rehired && mend.free, JSON.stringify(mend));
const last = await ev(() => {
  for (const id of DATA.stationOrder) S.stations[id].appr = 0;
  const party = NPC.party().length; Porter.damage(999, 'bleed');
  const graves = S.graves.length, roll = S.legacy.length; Porter.die('bleed');   // a death is committed once
  return { party, dead: !!S.dead, cert: !document.getElementById('deathOv').classList.contains('hidden'), name: document.getElementById('deathName').textContent, debt: __hands.filter(n => n.state === 'recover').map(n => n.koFromParty), once: S.graves.length === graves && S.legacy.length === roll };
});
ok('THE WALKER FALLS LAST: with the three quarters spent and no yard to ride, the fourth blow is the walker\'s own — permadeath, committed once, the certificate on screen — and the mending companions\' blood-debt dies with the porter',
  last.party === 0 && last.dead && last.cert && / fell\.$/.test(last.name) && last.debt.length >= 1 && last.debt.every(v => v === false) && last.once, JSON.stringify(last));

/* ================= 20 · THE NEXT PORTER ================= */
const deadName = await ev(() => S.pName);
await page.click('#deathContinue'); await page.waitForTimeout(400);
await page.click('#cgBegin'); await page.waitForTimeout(800);
const next = await ev(() => ({ name: S.pName, dead: !!S.dead, hp: S.health, atHaven: U.dist(S.px, S.py, DATA.stations.haven.x, DATA.stations.haven.y) < 200, lit: DATA.stationOrder.filter(id => S.stations[id].connected), grave: S.graves.length, legacy: S.legacy.slice(-1)[0].name, mending: S.npcs.filter(n => n.state === 'recover').map(n => n.koFromParty) }));
const rallied = await ev(() => { const n = NPC.rallyParty(); return { n, party: NPC.party().length }; });
ok('THE NEXT PORTER: the certificate gives way to enlistment and a new walker takes the coat at Haven, whole — the valley exactly as it was (its lights, the cairn where the last one fell, the roll of the dead) — and the mending who took the last one\'s blows owe this stranger nothing: a rescue would rally none of them',
  !next.dead && next.name !== deadName && next.hp === 100 && next.atHaven && next.lit.join() === 'haven,elm,mill' && next.grave >= 1 && next.legacy === deadName && next.mending.every(v => v === false) && rallied.n === 0 && rallied.party === 0,
  JSON.stringify({ deadName, next, rallied }));

/* ================= 21–23 · THE RESCUE RIDE ================= */
await ev(() => { S.flags.guideDone = true; S.flags.lamp = true; S.flags.torchSeen = S.flags.torchNamed = true; WL.calm(); });
const rescue = await ev(() => {
  /* the road the riders will burn clear: open ground a thousand out from the Pass Camp's fire — its ground in their reach, its
     claim not on the Walker — and far from every town */
  const cdP = DATA.camps.find(c => c.id === 'pass'), csP = S.camps.pass;
  let spot = null;
  for (let k = 0; k < 72 && !spot; k++) { const a = k / 72 * Math.PI * 2, x = cdP.x + Math.cos(a) * 1050, y = cdP.y + Math.sin(a) * 1050, t = World.terrainAt(x, y); if (!t.blocked && !t.water && DATA.stationOrder.every(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) > 500)) spot = [x, y]; }
  WL.timeScale = 0.001; WL.tp(spot); S.flags.rescueCdT = 0;
  S.stations.haven.appr = 120; S.stations.elm.appr = 45; const lvl = Economy.apprLevel('haven');
  /* one of this walker's own down first: a companion hired, and the blow that takes them */
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.feeWaived = true; NPC.hire(n, 'companion'); Porter.damage(999, 'bleed');
  const mending = n.state;
  /* the grey on the road: two wraiths close by, a camp's knives out — two of the Pass Camp's, up and ready to run */
  S.wraiths.push({ id: U.uid(), x: S.px + 300, y: S.py, alert: 0, state: 'drift', cd: 0, ph: 0 }, { id: U.uid(), x: S.px - 500, y: S.py + 100, alert: 0, state: 'hunt', cd: 0, ph: 1 });
  csP.pacified = false; csP.runners = [0, 1].map(i => ({ x: cdP.x + (S.px - cdP.x) * 0.35 + i * 40, y: cdP.y + (S.py - cdP.y) * 0.35, wa: i, state: 'patrol', cd: 0, cls: 'knife' }));
  const knives0 = csP.runners.map(r => r.cd), fire = Math.round(U.dist(cdP.x, cdP.y, S.px, S.py));
  const mails0 = new Set(S.mails), say = __rec(Render, 'say'), appr0 = S.stations.haven.appr, likes0 = S.likes, burningBefore = S.wraiths.filter(w => w.state === 'burn').length;
  /* the scene the ride plays, as it is handed to the engine: its shots, what each looks at, and the flare */
  const play0 = Cine.play; let shots = null;
  Cine.play = (sh, o) => { shots = sh.map(s => ({ move: s.move, at: typeof s.at === 'function' ? 'follows' : s.at ? [Math.round(s.at.x), Math.round(s.at.y)] : null, flash: !!(s.fx && s.fx['flash@'] !== undefined) })); return play0(sh, o); };
  const mr = Math.random; Math.random = () => 0; let fired;
  try { Porter.damage(999, 'bleed'); fired = { dead: !!S.dead, hp: S.health, rescue: !!S.rescue, seq: !!S.cineSeq, line: say.calls.map(c => c[2]).find(t => /RIDERS!/.test(t)) || null, odds: +(DATA.T.rescueBase + DATA.T.rescuePer * lvl).toFixed(2), cd: Math.round(S.flags.rescueCdT - S.time),
    shots, at: [Math.round(S.px), Math.round(S.py)], riders: S.rescue ? S.rescue.riders.length : 0 }; }
  finally { Math.random = mr; Cine.play = play0; }
  __run(1.75 + 2.35);
  const letter = S.mails.filter(m => !mails0.has(m)).find(m => m.subj === 'The ride from Haven');
  const resolved = { rescue: S.rescue, seq: !!S.cineSeq, burningBefore, burned: S.wraiths.filter(w => w.state === 'burn').length, rallied: n.state, party: NPC.party().length, appr: S.stations.haven.appr - appr0, likes: S.likes - likes0, letter: letter ? letter.body : null,
    fire, knives0, knives: csP.runners.map(r => ({ state: r.state, cd: +r.cd.toFixed(2) })) };
  say.off();
  /* one ride a debt: inside the cooldown the grey keeps what it catches */
  NPC.party().forEach(m => { m.state = 'pool'; });
  const mr2 = Math.random; Math.random = () => 0; let inside;
  try { Porter.damage(999, 'bleed'); inside = { dead: !!S.dead, rescue: !!S.rescue }; } finally { Math.random = mr2; }
  return { lvl, mending, fired, resolved, inside };
});
ok('THE RESCUE RIDE FIRES: the last quarter spent, the best-loved yard gets its one chance — Haven (HONOURED, odds 0.25 + 0.18 a level) rides: the walker stood up at 30 before a frame is drawn, and a two-shot scene: "RIDERS! Riders out of HAVEN—" on the CUT to the fallen walker, then the DOLLY that follows the three riders in, the flare\'s flash on it',
  rescue.mending === 'recover' && rescue.fired.odds === +(0.25 + 0.18 * rescue.lvl).toFixed(2) && !rescue.fired.dead && rescue.fired.hp === 30 && rescue.fired.rescue && rescue.fired.seq && rescue.fired.line === 'RIDERS! Riders out of HAVEN—' && rescue.fired.cd === 1500
  && !!rescue.fired.shots && rescue.fired.shots.length === 2 && rescue.fired.shots[0].move === 'cut' && JSON.stringify(rescue.fired.shots[0].at) === JSON.stringify(rescue.fired.at) && rescue.fired.shots[1].move === 'dolly' && rescue.fired.shots[1].at === 'follows' && rescue.fired.shots[1].flash && rescue.fired.riders === 3,
  JSON.stringify({ lvl: rescue.lvl, fired: rescue.fired }));
ok('THE RESCUE RESOLVES: the wraiths near the road burned off it, the camp\'s knives cooled (two of the Pass Camp\'s, its fire a thousand off, up and ready before the ride and on their round for fourteen seconds after it), the mending companion rallied back to the saddle, Haven proud (+1 regard, 3 likes) and its letter — "Don\'t thank us. Deliver."',
  rescue.resolved.rescue === null && !rescue.resolved.seq && rescue.resolved.burningBefore === 0 && rescue.resolved.burned === 2 && rescue.resolved.rallied === 'companion' && rescue.resolved.party === 1 && rescue.resolved.appr === 1 && rescue.resolved.likes === 3 && /Don't thank us\. Deliver\./.test(rescue.resolved.letter || '')
  && rescue.resolved.fire < 1400 && rescue.resolved.knives0.length === 2 && rescue.resolved.knives0.every(v => v === 0) && rescue.resolved.knives.length === 2 && rescue.resolved.knives.every(k => k.state === 'patrol' && k.cd >= 13.5),
  JSON.stringify(rescue.resolved));
ok('ONE RIDE A DEBT: inside the ride\'s cooldown (1500 s) the grey keeps what it catches — the next lethal blow with the pool spent is death, no riders',
  rescue.inside.dead && !rescue.inside.rescue, JSON.stringify(rescue.inside));

/* the next walker again, for the law of the towns and the rain */
await page.click('#deathContinue'); await page.waitForTimeout(400);
await page.click('#cgBegin'); await page.waitForTimeout(800);

/* ================= 24–25 · THE TOWN LAW ================= */
const law = await ev(() => {
  WL.timeScale = 0.001; S.flags.guideDone = true; WL.calm();
  const toast = __rec(UI, 'toast'), run = secs => { for (let t = 0; t < secs; t += 0.5) Porter.update(0.5); };
  /* inside: hunger at nothing, the cold in the coat — in Haven's yard */
  WL.tp('haven'); S.health = 80; S.food = 0; S.warmth = 5; S.foodZeroT = 0; S.flags.mercyT = {}; S.bleeding = false;
  Porter.update(0.5);
  const meal = { food: Math.round(S.food), line: toast.calls.map(c => String(c[0]).replace(/<[^>]+>/g, '')).find(t => /Not in MY yard, walker\. Eat\./.test(t)) || null };
  S.food = 0; S.warmth = 5; const hp0 = S.health; run(60); const inside = { hp: +(S.health - hp0).toFixed(2), food: Math.round(S.food), again: toast.calls.filter(c => /Not in MY yard/.test(String(c[0]))).length };
  /* outside the walls, the same hunger and cold */
  WL.tp('haven'); S.px += 1400; S.health = 80; S.food = 0; S.warmth = 5; S.foodZeroT = 0; const hp1 = S.health; run(90);
  const outside = { hp: +(S.health - hp1).toFixed(2), food: Math.round(S.food) };
  toast.off(); S.health = 100; S.food = 90; S.warmth = 90; WL.tp('haven'); WL.timeScale = 1;
  return { meal, inside, outside, r: DATA.T.townSafeR };
});
ok('THE TOWN LAW, INSIDE: no one starves or freezes inside walls — a starving walker in Haven\'s yard gets the mercy meal at once ("Not in MY yard, walker. Eat." — food to 24, once per town per five minutes), and a minute more of hunger and cold inside the walls takes nothing from the body',
  law.meal.food === 24 && !!law.meal.line && law.inside.hp >= 0 && law.inside.again === 1 && law.r === 300, JSON.stringify(law));
ok('THE TOWN LAW, OUTSIDE: the wild keeps its teeth — the same hunger and cold outside the walls drain the body (half a minute of an empty belly, then the starving)',
  law.outside.hp < -5 && law.outside.food === 0, JSON.stringify(law.outside));

/* ================= 26–27 · THE RAIN ================= */
const graph = await ev(() => {
  const E = __audio.edges, isG = n => n instanceof GainNode;
  const masterE = E.find(([a, b]) => b instanceof AudioDestinationNode && isG(a)); const master = masterE && masterE[0];
  const bus = E.filter(([a, b]) => b === master && isG(a)).map(e => e[0]).find(g => E.filter(([a, b]) => b === g && isG(a)).length === 3);
  const layers = bus ? E.filter(([a, b]) => b === bus && isG(a)).map(e => e[0]) : [];
  const desc = layers.map(g => { const f = (E.find(([a, b]) => b === g && a instanceof BiquadFilterNode) || [])[0]; const s = f && (E.find(([a, b]) => b === f && a instanceof AudioBufferSourceNode) || [])[0]; const lfo = E.find(([a, b]) => b === g.gain); const osc = lfo && (E.find(([a, b]) => b === lfo[0] && a instanceof OscillatorNode) || [])[0]; return { g, type: f && f.type, freq: f && f.frequency.value, loop: !!(s && s.loop), gust: osc ? +osc.frequency.value.toFixed(2) : null }; });
  const wash = desc.find(d => d.type === 'lowpass' && d.freq === 900), patter = desc.find(d => d.type === 'bandpass'), rumble = desc.find(d => d.type === 'lowpass' && d.freq === 190);
  const read = () => ({ wash: +(__audio.targets.get(wash.g.gain) || 0).toFixed(5), patter: +(__audio.targets.get(patter.g.gain) || 0).toFixed(5), rumble: +(__audio.targets.get(rumble.g.gain) || 0).toFixed(5) });
  Snd.setRainVol(0.55);
  Snd.setAmbient({ windLvl: 0.05, rainLvl: 0.3, droneLvl: 0 }); const drizzle = read();
  Snd.setAmbient({ windLvl: 0.05, rainLvl: 1.0, droneLvl: 0 }); const pour = read();
  window.__rainRead = read; window.__rainMaster = master;
  return { layers: desc.map(d => ({ type: d.type, freq: d.freq, loop: d.loop, gust: d.gust })), found: !!(wash && patter && rumble), drizzle, pour, washGrow: +(pour.wash / drizzle.wash).toFixed(2), rumbleGrow: +(pour.rumble / drizzle.rumble).toFixed(2) };
});
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
await page.focus('#rainSlider'); await page.keyboard.press('Home'); await page.waitForTimeout(150);
const dial = await ev(() => {
  const r = { slider: +document.getElementById('rainSlider').value, rainVol: Snd.rainVol, opt: UI.opts.rainVol, rain: __rainRead(), on: Snd.on, master: __rainMaster.gain.value };
  const o0 = __audio.osc; Snd.sfx.accept(); r.bell = __audio.osc - o0;   // the doorbell still rings
  return r;
});
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
const kept = await ev(() => ({ slider: +document.getElementById('rainSlider').value, rainVol: Snd.rainVol, opt: UI.opts.rainVol }));
ok('THE RAIN\'S DIAL: the pause sheet\'s rain slider, turned down by a real key, sets the rain\'s own volume to nothing — every layer of the water silenced — while the sound stays on, the master untouched and the doorbells still ringing; the dial is an option kept, back at zero after a reload',
  dial.slider === 0 && dial.rainVol === 0 && dial.opt === 0 && dial.rain.wash === 0 && dial.rain.patter === 0 && dial.rain.rumble === 0 && dial.on === true && dial.master > 0 && dial.bell === 3 && kept.slider === 0 && kept.rainVol === 0 && kept.opt === 0,
  JSON.stringify({ dial, kept }));
ok('THE WATER IN THREE LAYERS: the rain is three layers on one bus into the master — a lowpassed wash (900 Hz), a band-passed patter (3400 Hz) breathing on a gust LFO (0.31 Hz), a storm rumble (190 Hz) — each a looped water noise, fed the raw rain with the loudness law in Snd: from a drizzle to a downpour the wash rises with the rain, and the rumble only really arrives when it pours',
  graph.found && graph.layers.length === 3 && graph.layers.every(l => l.loop) && graph.layers.some(l => l.type === 'bandpass' && l.freq === 3400 && l.gust === 0.31)
  && Math.abs(graph.washGrow - 3.33) < 0.05 && Math.abs(graph.rumbleGrow - 11.11) < 0.1 && graph.pour.rumble > 0 && graph.drizzle.wash > 0, JSON.stringify(graph));

await T.finish('the wider world');
