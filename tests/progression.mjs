/* progression.mjs — v3.17 THE ROAD HAS MORE THAN ONE SPEED (v3.51 rebuild, mine: re-authored from its record in DESIGN.md —
   the v3.48 source was lost; its figures sampled on the courier's grid). Attainable, alive, and taught in a line: the reset
   honest behind its own confirm (v3.49's plain names: Reset the Valley is Reset world, New Waylighter is New character),
   the price of things re-laddered, the post horse — the loaner granted with Light for the Mill, a ride measured against a
   walk, its own legs, its balk at water, its bolt, its retirement and the day's rent at a lit terminal — the valley not just
   you (ambient walkers on runs of their own, a companion's hands and the road as a classroom), the wants visible from the
   bottom rung (locked rows that refuse to print), the send-off that makes a run a moment, and New character keeping the
   valley through a real reload while the confirmed reset burns it. */
import { boot } from './lib/harness.mjs';

const T = await boot({ start: false });
const { ev, ok, page } = T;
const calm = () => ev(() => {
  S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
});
const listen = () => ev(() => {   // every toast the page raises and every line said in the world, as they come
  window.__toasts = []; window.__says = [];
  new MutationObserver(ms => { for (const m of ms) for (const n2 of m.addedNodes) if (n2.textContent) __toasts.push(n2.textContent); }).observe(document.getElementById('toasts'), { childList: true });
  const say0 = Render.say; Render.say = (x, y, text, ...rest) => { __says.push(text); return say0(x, y, text, ...rest); };
});

/* ================= 1 · THE CONFIRM ================= */
const conf = {};
await page.click('#btnReset'); await page.waitForTimeout(250);
conf.open = await ev(() => { const o = document.getElementById('resetOv'); return !o.classList.contains('hidden') ? o.textContent.replace(/\s+/g, ' ').trim() : null; });
await page.click('#resetNo'); await page.waitForTimeout(200);
conf.closed = await ev(() => document.getElementById('resetOv').classList.contains('hidden'));
conf.buttons = await ev(() => [document.getElementById('btnNew').textContent.trim(), document.getElementById('btnReset').textContent.trim()]);
const COPY = [
  'Reset world?', 'this burns the WORLD, not the walker',
  'This erases everything: every station\'s light and stars, every road, structure and cairn, all appreciation, the mail, the Roll of the Order. The valley starts over as if no Waylighter ever walked it.',
  'This is not the New character button. New character retires your current walker and hands the coat to a fresh one — the valley, its network, roads and reputation all kept. Use this only to unmake the world. There is no undo.',
  'Cancel', 'Reset world',
];
ok('THE CONFIRM\'S EXACT COPY (v3.49: the plain names — Reset the Valley is Reset world, New Waylighter is New character): a real click on the title\'s Reset world opens a confirm that spells out what burns — every station\'s light and stars, every road, structure and cairn, all appreciation, the mail, the Roll — and says in so many words that it is NOT the New character button, which keeps the valley; Cancel closes it with nothing burnt',
  !!conf.open && COPY.every(c => conf.open.includes(c)) && conf.closed && conf.buttons.join('|') === 'New character|Reset world', JSON.stringify({ missing: COPY.filter(c => !(conf.open || '').includes(c)), closed: conf.closed, buttons: conf.buttons }));

/* a valley to walk: enlisted, the first-sight scenes spent */
await T.newGame(); await calm(); await T.instruments(); await listen();

/* ================= 2 · THE PRICE OF THINGS ================= */
let r = await ev(() => {
  const hands = [0, 1, 2, 3, 4, 5].map(() => NPC.gen({ at: 'haven' }));
  const fees = hands.map(n => { const sum = Object.values(n.skills).reduce((a, v) => a + v, 0); return { sum, metal: n.fee.metal, ceramic: n.fee.ceramic, law: n.fee.metal === 16 + sum * 3 && n.fee.ceramic === 8 + sum * 2 }; });
  S.flags.unlocks.kit = true; S.flags.unlocks.flare = true;
  const board = Object.fromEntries(Systems.fabList('haven').filter(f => ['ladder', 'kit', 'flare'].includes(f.id)).map(f => [f.id, f.cost]));
  const data = Object.fromEntries(DATA.fabItems.map(f => [f.id, f.cost]));
  return { fees, board, data, same: JSON.stringify(board) === JSON.stringify(data) };
});
ok('THE PRICE OF HANDS AND TOOLS: a hire\'s fee is 16 metal and 3 more a skill point (8 ceramic and 2) — the old fee halved; at the terminal a ladder is 8 metal, a build kit 16 metal (and 8 ceramic), a flare 6 lumen — the Fabricate board and the data rows (DATA.fabItems) agree to the unit',
  r.fees.every(f => f.law) && r.board.ladder.metal === 8 && r.board.kit.metal === 16 && r.board.kit.ceramic === 8 && r.board.flare.lumen === 6 && r.same, JSON.stringify(r));

r = await ev(() => {
  const SD = DATA.structures, c = k => SD[k].cost;
  const roads = Object.fromEntries(DATA.roads.map(r2 => [r2.id, r2.cost]));
  return { gen: c('generator'), bridge: c('bridge'), shelter: c('shelter'), tower: c('watchtower'), zip: c('zipline'), field: c('fieldladder'), roads };
});
ok('THE PRICE OF BUILDING: a generator 28 metal, a bridge 48, a shelter 26 ceramic, a watchtower 18, a zipline pylon 30 metal and 8 lumen, a field ladder 8; every road cut about a third — the Elm Road 48 metal and 28 ceramic',
  r.gen.metal === 28 && r.bridge.metal === 48 && r.shelter.ceramic === 26 && r.tower.metal === 18 && r.zip.metal === 30 && r.zip.lumen === 8 && r.field.metal === 8 && r.roads.r_elm.metal === 48 && r.roads.r_elm.ceramic === 28
  && Object.values(r.roads).every(x => x.metal <= 90), JSON.stringify(r));

r = await ev(() => {
  const exo = CHAR.FAB_GEAR.find(g => g.id === 'pack_exo1');
  const piles = S.nodes.filter(n => n.type === 'metal').map(n => n.qty);
  /* what the Quarry gives when a run lands there: 6 metal and 5 more a star */
  const out = {};
  for (const stars of [0, 2]) {
    S.stations.quarry.connected = true; S.stations.quarry.met = true; S.stations.quarry.stars = stars;
    const def = { id: 'q_test', from: 'haven', to: 'quarry', item: 'food', n: 1, likesMul: 1, express: false, premium: false, mood: null };
    Systems.acceptOrder(def, false); WL.tp('quarry'); WL.instantPar();
    const res = Systems.handleDelivery('quarry').results.find(x => x.order && x.order.id === 'q_test');
    out[stars] = res ? res.donate.metal : null;
  }
  S.stations.quarry.stars = 0; S.stations.quarry.connected = false; S.stations.quarry.met = false; WL.tp('haven');
  return { exo: exo && exo.cost, exoAt: exo && exo.at, piles: [Math.min(...piles), Math.max(...piles), piles.length], quarry: out };
});
ok('THE PRICE OF GEAR, AND WHAT THE VALLEY GIVES: Exo Frame I is 70 metal at the Foundry — gear cut 35-40% top to bottom; a run landed at the Quarry gives 6 metal and 5 more a star; every scrap pile in the valley holds 12 to 20',
  r.exo.metal === 70 && r.exoAt === 'foundry' && r.quarry[0] === 6 && r.quarry[2] === 16 && r.piles[0] >= 12 && r.piles[1] <= 20 && r.piles[2] > 5, JSON.stringify(r));

/* ================= 3 · THE POST HORSE ================= */
/* the taught line has come to Light for the Mill: the ★ card on Haven's board, taken with a real click */
await ev(() => {
  S.orders.prioIdx = DATA.priority.findIndex(p => p.id === 'p4'); S.orders.prioAccepted = false; S.horse = null; S.flags.unlocks.horse = false;
  for (const o of [...S.orders.active]) Systems.abandonOrder(o.idNum);
  S.cargo = S.cargo.filter(c => c.cat === 'tool');
  WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('orders');
});
await page.waitForTimeout(250);
const cardBtn = await ev(() => { const c = [...document.querySelectorAll('#stationBody .orderCard')].find(el => /Light for the Mill/.test(el.textContent)); const b = c && c.querySelector('[data-accept]'); if (b) b.id = '__p4accept'; return b ? b.textContent.trim() : null; });
if (cardBtn) await page.click('#__p4accept');
await page.waitForTimeout(400);
r = await ev(() => {
  const h = S.horse, el = document.getElementById('stationClose'); if (el && !document.getElementById('stationOv').classList.contains('hidden')) el.click();
  return { horse: h ? { loaner: h.loaner, on: h.on } : null, unlocked: !!S.flags.unlocks.horse, avail: Systems.horseAvail(), on: Systems.horseOn(), active: S.orders.active.some(o => o.id === 'p4'), saddle: __toasts.some(t => /Mara swings you into the saddle/.test(t)) };
});
ok('THE LOANER: accepting Light for the Mill (the gold card\'s Accept, a real click) puts the Walker in the saddle of Mara\'s loaner — mounted at once, the horse unlocked, Mara\'s words in the toast',
  cardBtn === 'Accept' && r.horse && r.horse.loaner && r.horse.on && r.unlocked && r.avail && r.on && r.active && r.saddle, JSON.stringify({ cardBtn, ...r }));

/* the ride, measured: the same stretch of meadow walked and ridden under a held key (D, walk east) — a stretch where no step
   climbs (flat, or down the slope, where the walk and the ride meet the same ground law) — timed on the game's own clock */
await ev(() => {
  window.__stretch = [3760, 7000];
  /* v3.51: each crossing read between the two frames it fell between (the line's own moment on the game's clock, not the
     frame after it — a loaded machine's long frames had put a whole frame's error into a 0.9-second leg) */
  window.__cross = (x1, x2) => new Promise(res => { const o = {}; const t0 = performance.now(); let px0 = S.px, tt0 = S.time; const at = x => tt0 + (S.time - tt0) * Math.min(1, Math.max(0, (x - px0) / Math.max(1e-6, S.px - px0))); const f = () => { if (o.t1 === undefined && S.px >= x1) o.t1 = at(x1); if (o.t2 === undefined && S.px >= x2) { o.t2 = at(x2); return res(o); } px0 = S.px; tt0 = S.time; if (performance.now() - t0 > 9000) return res(o); requestAnimationFrame(f); }; requestAnimationFrame(f); });
  window.__party = NPC.party().map(n => ({ n, st: n.state })); for (const p of __party) p.n.state = 'pool';   // a back walking with you sets the party's pace: the Walker and the horse alone
});
const leg = async mounted => {
  await ev(m => { WL.tp(__stretch); S.horse.on = m; S.horse.spookT = 0; S.stam = S.stamMax; S.speed = 0; S.moveTo = null; S.qte = null; WL.timeScale = 1; }, mounted);
  await page.waitForTimeout(150);
  const watch = ev(() => __cross(__stretch[0] + 20, __stretch[0] + 170));
  await page.keyboard.down('KeyD');
  const o = await watch;
  await page.keyboard.up('KeyD');
  return ev(o => ({ secs: o.t2 !== undefined && o.t1 !== undefined ? +(o.t2 - o.t1).toFixed(3) : null, mounted: Systems.horseOn() }), o);
};
const walkLeg = await leg(false), rideLeg = await leg(true);
await ev(() => { for (const p of __party) p.n.state = p.st; S.moveTo = null; });
const ride = { walk: walkLeg, ride: rideLeg, ratio: walkLeg.secs && rideLeg.secs ? +(walkLeg.secs / rideLeg.secs).toFixed(2) : null, horseMul: await ev(() => DATA.T.horseMul) };
ok(`THE RIDE, MEASURED: the same hundred and fifty units of meadow walked and ridden under a held key, timed on the game's clock — the post horse carries the Walker ×${ride.ratio} the walking pace (the v3.17 record measured ×1.78; the horse is ×${ride.horseMul} the legs it replaces)`,
  ride.walk.secs > 0 && ride.ride.secs > 0 && !ride.walk.mounted && ride.ride.mounted && ride.ratio >= 1.7 && ride.ratio <= 1.85, JSON.stringify(ride));

r = await ev(async () => {
  /* rough ground, overloaded: walking it costs breath and rings the steadying ring; ridden, neither */
  let scree = null;
  for (let y = 3000; y < 10800 && !scree; y += 20) for (let x = 400; x < 8000 && !scree; x += 20) {
    let okr = true; for (let d = 0; d <= 120 && okr; d += 10) { const t = World.terrainAt(x + d, y); if (t.cls !== World.SCREE || t.blocked) okr = false; }
    if (okr && World.mistAt(x, y) < 0.5) scree = [x, y];
  }
  S.flags.calm = false;
  const heavy = []; for (let i = 0; i < 6; i++) { const it = State.makeItem('coreHeavy'); heavy.push(it); State.addCargo(it); }
  const mr = Math.random, out = {};
  for (const mounted of [false, true]) {
    WL.tp(scree); S.horse.on = mounted; S.horse.spookT = 0; S.stam = S.stamMax; S.qte = null; S.moveTo = null; WL.timeScale = 1;
    Math.random = () => 0.001;   // every roll the ground makes comes up: what can ring, rings
    Systems.moveTo(S.px + 120, S.py);
    const st0 = S.stam, t0 = S.time; let ring = false; const w0 = performance.now();
    while (performance.now() - w0 < 700) { await __frames(1); if (S.qte) { ring = true; break; } }
    Math.random = mr;
    out[mounted ? 'ride' : 'walk'] = { stam: +(S.stam - st0).toFixed(2), secs: +(S.time - t0).toFixed(2), ring, mounted: Systems.horseOn(), load: +(State.weight() / State.cap()).toFixed(2) };
    S.qte = null; UI.showQTE && UI.showQTE(false); S.moveTo = null;
  }
  for (const it of heavy) State.removeCargo(it.id);
  S.flags.calm = true;
  return { scree, ...out };
});
ok('THE HORSE\'S OWN LEGS: on rough scree, overloaded, the walking Walker spends their own breath and the ground rings the steadying ring; ridden the same ground, the horse spends its own legs — not a point of stamina — and carries the wobble: no ring at all',
  !!r.scree && r.walk.load > 1 && r.walk.stam < 0 && r.walk.ring && r.ride.mounted && r.ride.stam >= 0 && !r.ride.ring, JSON.stringify(r));

r = await ev(async () => {
  /* shallow water beside dry ground: the horse balks, the Walker leads it through, and it picks them back up */
  let wet = null;
  for (let y = 8000; y < 10600 && !wet; y += 20) for (let x = 2000; x < 7600 && !wet; x += 20) {
    if (World.classAt(x, y) !== World.SHALLOW) continue;
    for (const [dx, dy] of [[-40, 0], [40, 0], [0, -40], [0, 40]]) if (World.classAt(x + dx, y + dy) === World.MEADOW && !World.terrainAt(x + dx, y + dy).blocked) { wet = { x, y, dry: [x + dx, y + dy] }; break; }
  }
  S.horse.on = true; S.horse.spookT = 0; WL.tp(wet.dry); S.moveTo = null; WL.timeScale = 1; await __wait(200);
  const before = Systems.horseOn();
  WL.tp([wet.x, wet.y]); await __wait(250);
  const inWater = { on: Systems.horseOn(), want: !!S.horse.wantRemount, balk: __toasts.some(t => /The horse balks at the (water|crossing)/.test(t)) };
  WL.tp(wet.dry); await __wait(250);
  const out = { on: Systems.horseOn() };
  return { wet, before, inWater, out };
});
ok('THE BALK (v3.31: the balk is a beat — the horse picks you back up): ridden into the water the horse balks — the Walker is afoot, leading it (the toast says so), and back on dry ground it picks them up again',
  r.before && !r.inWater.on && r.inWater.want && r.inWater.balk && r.out.on, JSON.stringify(r));

r = await ev(async () => {
  /* a wraith's grab in the grey spooks the horse: it bolts, and circles back when the trouble is done */
  const cd = DATA.camps.find(c => World.mistBase(c.x, c.y) > 0.5) || DATA.camps[2];
  WL.tp([cd.x + cd.r + 150, cd.y]); S.horse.on = true; S.horse.spookT = 0; S.struggle = null; S.state = 'walk'; S.wraiths.length = 0;
  S.wraiths.push({ id: U.uid(), x: S.px + 18, y: S.py, alert: 1, state: 'hunt', cd: 0, ph: 0 });
  const mounted = Systems.horseOn(); WL.timeScale = 1;
  let spooked = null; const t0 = performance.now();
  while (performance.now() - t0 < 2000) { await __frames(1); if (S.horse.spookT > 0) { spooked = { spookT: +S.horse.spookT.toFixed(1), on: Systems.horseOn(), avail: Systems.horseAvail(), prompt: Systems.getInteractions().some(i => i.key === 'R') }; break; } }
  S.struggle = null; S.qte = null; S.wraiths.length = 0; UI.showStruggle && UI.showStruggle(false);
  WL.tp('haven'); S.horse.spookT = 0.05; await __wait(300);
  const back = { spookT: S.horse.spookT, prompt: (Systems.getInteractions().find(i => i.key === 'R') || {}).label || null, told: __toasts.some(t => /trots back to you/.test(t)) };
  /* and the record's own spook: a scrapper's hit landed on a Walker standing in the saddle inside his camp's claim (v3.31: a
     horse ridden at speed is not chased at all) — the order's crates set aside while it is staged, a crate of textiles the mark,
     no back at the Walker's side to meet him; everything as it was after */
  const live = DATA.camps.find(c => !S.camps[c.id].pacified && S.camps[c.id].runners && S.camps[c.id].runners.length);
  let scrap = null;
  if (live) {
    const c = S.camps[live.id], keep = { cargo: S.cargo.slice(), drops: S.drops.length, hp: S.health, bruised: S.bruisedT, party: NPC.party().map(n => [n, n.state]) };
    for (const [n] of keep.party) n.state = 'pool';
    S.cargo = S.cargo.filter(x => x.cat === 'tool'); State.addCargo(State.makeItem('textiles'));
    let spot = null;
    for (let rr = live.r * 0.3; rr <= live.r * 0.7 && !spot; rr += 20) for (let a = 0; a < 6.283 && !spot; a += 0.4) { const x = live.x + Math.cos(a) * rr, y = live.y + Math.sin(a) * rr, t1 = World.terrainAt(x, y), t2 = World.terrainAt(x + 24, y); if (!t1.blocked && !t1.water && !t2.blocked && !t2.water) spot = [x, y]; }
    WL.tp(spot); S.horse.on = true; S.horse.spookT = 0; S.speed = 0; S.moveTo = null; S.state = 'walk'; S.struggle = null; S.wraiths.length = 0; S.hitBy = null;
    for (const rr of c.runners) { rr.cd = 99; rr.carry = null; }
    const rn = c.runners[0], at0 = [rn.x, rn.y], cls0 = rn.cls; rn.cls = 'knife'; rn.cd = 0; rn.x = S.px + 22; rn.y = S.py;
    const mountedS = Systems.horseOn(), n0 = __toasts.filter(t => /The horse bolts/.test(t)).length;
    WL.timeScale = 0.001;
    for (let k = 0; k < 30 && !(S.horse.spookT > 0); k++) Systems.update(1 / 60, {});
    await __wait(80);
    scrap = { camp: live.id, mounted: mountedS, hit: !!(S.hitBy && S.hitBy.camp === live.id), spookT: +(S.horse.spookT || 0).toFixed(1), on: Systems.horseOn(), bolts: __toasts.filter(t => /The horse bolts/.test(t)).length - n0 };
    S.cargo = keep.cargo; S.drops.splice(keep.drops); S.health = keep.hp; S.bruisedT = keep.bruised; S.bleeding = false; S.stagger = 0;
    rn.x = at0[0]; rn.y = at0[1]; rn.cls = cls0; for (const rr of c.runners) rr.cd = 0;
    for (const [n, st] of keep.party) n.state = st;
    S.horse.spookT = 0; S.horse.on = false; UI.refreshCargo(); WL.tp('haven'); WL.timeScale = 1;
  }
  return { mounted, spooked, bolted: __toasts.some(t => /The horse <b>bolts<\/b>|The horse bolts/.test(t)), back, scrap };
});
ok('THE BOLT: a wraith\'s grab spooks the horse — it bolts (no horse to ride, no R to mount it while it is gone), and when the trouble is done it trots back and waits to be mounted; and scrappers spook it the same way — a knife\'s blow landed on a Walker standing in the saddle inside his camp\'s claim bolts the horse (v3.31: one ridden at speed is not chased at all)',
  r.mounted && r.spooked && r.spooked.spookT > 5 && !r.spooked.on && !r.spooked.prompt && r.bolted && r.back.told && /Mount the post horse/.test(r.back.prompt || '')
  && !!r.scrap && r.scrap.mounted && r.scrap.hit && r.scrap.spookT > 5 && !r.scrap.on && r.scrap.bolts >= 1, JSON.stringify(r));

r = await ev(async () => {
  /* the Mill delivered: the loaner trots home, and from then on a day's ride rents */
  S.horse.on = true;
  const o = S.orders.active.find(x => x.id === 'p4'); if (!o) return { none: true };
  WL.tp('mill'); WL.instantPar();
  const res = Systems.handleDelivery('mill').results.find(x => x.order === o);
  await __wait(60);   // the toast lands in the page's own time
  return { delivered: !!res, loaner: S.horse.loaner, on: S.horse.on, avail: Systems.horseAvail(), told: __toasts.some(t => /trots home to Haven, job done/.test(t) && /4 provisions/.test(t)) };
});
ok('THE LOANER RETIRES: the Mill delivered, the post horse trots home to Haven, job done — the Walker afoot, no horse to hand, and the toast names the rent from now on (4 provisions at any lit terminal)',
  r.delivered && r.loaner === false && r.on === false && r.avail === false && r.told, JSON.stringify(r));
await T.skipCine(); await calm();

/* the rent: at a lit terminal, a real press of R */
await ev(() => { WL.tp('haven'); S.banked.provisions = 10; S.moveTo = null; WL.timeScale = 1; });
await page.waitForTimeout(400);
const rentPrompt = await ev(() => (Systems.getInteractions().find(i => i.key === 'R') || {}).label || null);
await page.keyboard.press('KeyR');
await page.waitForTimeout(300);
r = await ev(async () => {
  const h = S.horse, rent = { prov: S.banked.provisions, loaner: h.loaner, on: h.on, until: Math.round(h.rentedUntil - S.time), breed: h.breed, avail: Systems.horseAvail() };
  S.time = h.rentedUntil + 1; await __wait(300);
  return { rent, after: { on: h.on, avail: Systems.horseAvail(), told: __toasts.some(t => /The rent is walked out/.test(t)) }, rentT: DATA.T.horseRentT };
});
ok('THE RENT: at a lit terminal R offers the post horse — a day\'s ride for 4 provisions; pressed (a real key), the provisions go and the Walker is in the saddle of the town\'s stable breed until the rent walks out, when the horse turns for home',
  /a day's ride \(<b>4 provisions<\/b>\)/.test(rentPrompt || '') && r.rent.prov === 6 && r.rent.loaner === false && r.rent.on && r.rent.until === r.rentT && !!r.rent.breed && r.rent.avail && r.after.on === false && r.after.avail === false && r.after.told,
  JSON.stringify({ rentPrompt, ...r }));

/* ================= 4 · THE VALLEY IS NOT JUST YOU ================= */
r = await ev(async () => {
  /* Haven and Elm on the wire, the Elm Road laid: the Order's walkers on runs of their own, along the road */
  for (const id of DATA.stationOrder) if (id !== 'haven' && id !== 'elm') S.stations[id].connected = false;
  S.stations.elm.connected = true; S.stations.elm.met = true; S.roads.r_elm = S.roads.r_elm.map(() => true);
  const A = NPC.ambient(); A.length = 0;
  WL.tp([DATA.stations.haven.x + 300, DATA.stations.haven.y + 700]); WL.timeScale = 20;
  const t0 = performance.now(); while (A.length < 1 && performance.now() - t0 < 6000) await __frames(2);
  WL.timeScale = 1;
  const w = A[0]; if (!w) return { none: true };
  const d0 = w.d, x0 = w.x, y0 = w.y; await __wait(1000); const d1 = w.d;
  const road = DATA.roads.find(r2 => r2.id === 'r_elm'), onRoad = JSON.stringify(w.pts) === JSON.stringify(road.pts) || JSON.stringify(w.pts) === JSON.stringify([...road.pts].reverse());
  return { n: A.length, name: w.n && w.n.name, crates: w.crates, d0: Math.round(d0), d1: Math.round(d1), moved: Math.round(U.dist(x0, y0, w.x, w.y)), onRoad, sp: Math.round(w.sp) };
});
ok('THE ORDER\'S OTHER WALKERS: ambient waylighters — generated, named, packs stacked on their backs — are always on runs of their own, advancing along their route at their own pace (measured over a second), and with a paved road between the towns they walk the road',
  !r.none && !!r.name && r.crates >= 1 && r.d1 > r.d0 + 40 && r.moved > 40 && r.onRoad, JSON.stringify(r));

r = await ev(async () => {
  /* a hired back: a crate dropped at their feet is picked up and stowed — "Got it." */
  const M = [5600, 8400]; WL.tp(M); S.moveTo = null; S.speed = 0;
  const n = NPC.gen({ at: 'haven', cls: 'courier' }); n.feeWaived = true; S.npcs.push(n); NPC.hire(n, 'companion');
  n.cx = S.px + 30; n.cy = S.py + 20; n.carry = []; n.pickCd = 0; n.skills.haul = 0;
  ordersOf = NPC.ordersOf(n); if (ordersOf) ordersOf.voice = 'talk';
  const it = State.makeItem('food'), dr = { id: U.uid(), item: it, x: n.cx + 12, y: n.cy }; S.drops.push(dr);
  WL.timeScale = 1; const t0 = performance.now(); while (performance.now() - t0 < 2500 && !n.carry.includes(it)) await __frames(2);
  window.__comp = n.id;
  return { picked: n.carry.includes(it), onGround: S.drops.includes(dr), said: __says.includes('Got it.'), companion: n.state };
});
ok('THE HANDS: a companion is not a bag — a crate dropped near their feet they pick up and stow on their own back, and say so ("Got it.")',
  r.picked && !r.onGround && r.said && r.companion === 'companion', JSON.stringify(r));

r = await ev(async () => {
  /* the road is a slower mailroom: every stretch walked together trains the back's Balance, and their Hauling while they carry */
  const n = S.npcs.find(x => x.id === __comp);
  n.trainXp = {}; n.fieldD = 0;
  const bal0 = 0, haul0 = 0;
  WL.timeScale = 1; S.moveTo = null; Systems.moveTo(S.px + 1200, S.py);
  const x0 = S.px, t0 = performance.now(); while (performance.now() - t0 < 12000 && (n.trainXp.bal || 0) <= bal0) await __frames(3);
  const walked = Math.round(S.px - x0);
  Systems.moveTo(S.px, S.py); S.moveTo = null;
  return { walked, bal: n.trainXp.bal || 0, haul: n.trainXp.haul || 0, carrying: n.carry.length };
});
ok('THE ROAD TEACHES: a companion walking with you trains as the mailroom does, slower — every eight hundred units walked together brings their Balance on, and their Hauling while they carry',
  r.walked >= 700 && r.bal > 0 && r.haul > 0 && r.carrying > 0, JSON.stringify(r));

/* ================= 5 · THE WANTS, VISIBLE ================= */
r = await ev(async () => {
  const st = S.stations.foundry; st.connected = true; st.met = true; st.stars = 0;
  S.banked.metal = 300; S.banked.ceramic = 200; S.banked.lumen = 60;
  const row = Systems.fabList('foundry').find(f => f.id === 'pack_exo1');
  WL.tp('foundry'); UI.openStation('foundry'); UI.gotoTab('fab');
  const plate = [...document.querySelectorAll('#stationBody .orderCard, #stationBody .rowline')].map(el => el.textContent.replace(/\s+/g, ' ')).find(t => /Exo frame I\b/i.test(t) && /LOCKED/.test(t)) || null;
  const bank0 = { ...S.banked }, cargo0 = S.cargo.length;
  const refused = Systems.fabricate(row); await __wait(60);
  const kept = S.banked.metal === bank0.metal && S.cargo.length === cargo0, told = __toasts.some(t => /Not yet — that takes ★ Foundry/.test(t));
  st.stars = 1; const row2 = Systems.fabList('foundry').find(f => f.id === 'pack_exo1');
  const printed = Systems.fabricate(row2), paid = bank0.metal - S.banked.metal, got = S.cargo.some(c => c.defId === 'pack_exo1');
  document.getElementById('stationClose').click();
  st.stars = 0; st.connected = false; st.met = false;
  return { locked: row.locked, plate, refused, kept, told, unlockedRow: !row2.locked, printed, paid, got };
});
ok('THE LOCKED ROW: the Fabricate board lists tomorrow\'s gear before it can be made — EXO FRAME I, LOCKED · ★ Foundry on its plate — and the locked row refuses to print (nothing paid, nothing made, "Not yet — that takes ★ Foundry"); the star earned, the same row prints for its 70 metal',
  r.locked === '★ Foundry' && !!r.plate && r.refused === false && r.kept && r.told && r.unlockedRow && r.printed === true && r.paid === 70 && r.got, JSON.stringify(r));

r = await ev(async () => {
  /* leaving the yard with a fresh load: a spoken line and THE RUN plate, once */
  WL.tp('haven'); S.moveTo = null; WL.timeScale = 1;
  S.stations.elm.connected = true; S.stations.elm.met = true; S.stations.elm.stock.meds = 5;
  for (const o of [...S.orders.active]) Systems.abandonOrder(o.idNum);
  S.cargo = S.cargo.filter(c => c.cat === 'tool');
  await __wait(300);
  const def = Economy.ordersFor('haven').find(o => o.to === 'elm' && !o.service) || Economy.ordersFor('haven').find(o => !o.service);
  Systems.acceptOrder(def, false);
  const plates = () => __toasts.filter(t => /THE RUN/.test(t)).length, s0 = __says.length, p0 = plates();
  const out = async () => { const H = DATA.stations.haven; Systems.moveTo(H.x + 420, H.y + 260); const t0 = performance.now(); while (performance.now() - t0 < 5000 && Systems.nearStation(170)) await __frames(3); await __wait(400); };
  const back = async () => { WL.tp('haven'); S.moveTo = null; await __wait(400); };
  await out(); const first = { plates: plates() - p0, said: __says.slice(s0), plate: __toasts.filter(t => /THE RUN/.test(t)).pop() || null };
  await back(); const s1 = __says.length; await out(); const second = { plates: plates() - p0 - first.plates, said: __says.slice(s1).filter(t => ['Walk far.', 'Bring the light back.', 'The valley watches, Walker.'].includes(t)) };
  Systems.moveTo(S.px, S.py); S.moveTo = null;
  return { first, second, to: DATA.stations[def.to].name };
});
ok('THE SEND-OFF: stepping out of Haven\'s yard with a fresh load is a moment — a spoken line and THE RUN plate (crates · kg · for whom) — and it fires once: back into the yard and out again, nothing',
  r.first.plates === 1 && r.first.said.some(t => ['Walk far.', 'Bring the light back.', 'The valley watches, Walker.'].includes(t)) && /THE RUN\s*\d+ crates? · [\d.]+ kg — for/.test(r.first.plate || '') && r.first.plate.includes(r.to) && r.second.plates === 0 && r.second.said.length === 0, JSON.stringify(r));

/* ================= 6 · THE VALLEY KEPT, THE VALLEY BURNT ================= */
const kept = await ev(() => {
  /* a valley worth keeping: Elm and the Mill on the wire, a road laid, a town that knows the Walker, a crate on the back */
  S.stations.elm.connected = true; S.stations.mill.connected = true; S.stations.mill.met = true; S.roads.r_elm = S.roads.r_elm.map(() => true); S.stations.mill.appr = 77;
  for (const o of [...S.orders.active]) Systems.abandonOrder(o.idNum);
  const crate = State.makeItem('textiles'); crate.name = 'Oskar\'s bolt of wool'; State.addCargo(crate);
  window.__keep = { name: S.pName, crate: crate.id };
  State.save();
  return { name: S.pName, lit: DATA.stationOrder.filter(id => S.stations[id].connected), road: S.roads.r_elm.every(Boolean), appr: S.stations.mill.appr, legacy: (S.legacy || []).length, slot: State.slotInfo(State.slot()), crate: crate.id };
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.waitForTimeout(300);
const title = await ev(() => ({ cont: !document.getElementById('btnContinue').classList.contains('hidden'), slot: State.slotInfo(State.slot()) }));
await page.click('#btnNew'); await page.waitForTimeout(500);
const cg = await ev(() => !document.getElementById('chargen').classList.contains('hidden'));
await page.click('#cgBegin'); await page.waitForTimeout(1200);
await T.skipCine();
await T.instruments(); await calm();
r = await ev(async () => {
  const lit = DATA.stationOrder.filter(id => S.stations[id].connected), me = S.legacy[S.legacy.length - 1];
  const code = await State.exportCode(), dec = await State.decodeCode(code);
  return { newName: S.pName, lit, road: S.roads.r_elm.every(Boolean), appr: S.stations.mill.appr, legacy: S.legacy.length, retired: me ? { name: me.name, fate: me.fate } : null,
    lockers: S.stations.haven.storage.some(c => c.name === 'Oskar\'s bolt of wool'), back: S.cargo.some(c => c.name === 'Oskar\'s bolt of wool'), slot: State.slotInfo(State.slot()),
    code: code && code.slice(0, 4), codeLit: Object.values(dec.json.stations).filter(x => x.connected).length, told: [...document.querySelectorAll('#toasts .toast')].some(t => /takes the coat/.test(t.textContent)) };
});
ok('NEW CHARACTER KEEPS THE VALLEY, THROUGH A REAL RELOAD: with a save on the page, the title\'s New character (a real click, a real reload before it) retires the Walker to the Roll ("hung up the coat"), racks their cargo in Haven\'s lockers and opens the new character over the SAME valley — its lit towns, its road, what the Mill thinks of the Order, all kept (the slot\'s plate and its save code say the same)',
  kept && title.cont && cg && r.newName !== kept.name && JSON.stringify(r.lit) === JSON.stringify(kept.lit) && r.road && r.appr === 77 && r.legacy === kept.legacy + 1 && r.retired && r.retired.name === kept.name && r.retired.fate === 'hung up the coat'
  && r.lockers && !r.back && r.slot.lit === kept.lit.length && r.slot.legacy === kept.legacy + 1 && /^WL[01]:/.test(r.code) && r.codeLit === kept.lit.length && r.told,
  JSON.stringify({ kept, title: title.cont, cg, r }));

await ev(() => State.save());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.waitForTimeout(300);
const pre = await ev(() => ({ slot: State.slotInfo(State.slot()), roll: document.getElementById('rollBody').textContent }));
await page.click('#btnReset'); await page.waitForTimeout(250);
await Promise.all([page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => null), page.click('#resetYes')]);
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.waitForTimeout(300);
const burnt = await ev(() => ({ save: State.hasSave(), slot: State.slotInfo(State.slot()), cont: !document.getElementById('btnContinue').classList.contains('hidden'), roll: document.getElementById('rollBody').textContent }));
await T.newGame(); await calm();
const fresh = await ev(() => ({ lit: DATA.stationOrder.filter(id => S.stations[id].connected), road: (S.roads.r_elm || []).some(Boolean), appr: S.stations.mill.appr || 0, legacy: (S.legacy || []).length }));
ok('THE RESET BURNS: the title\'s Reset world, confirmed (a real click), unmakes the world — the page reloads with no save on the slot and no Continue, the Walkers retired are off the Roll, and a new game walks into a valley no Waylighter ever walked: Haven alone lit, no road, no town that knows the Order',
  !pre.slot.empty && pre.slot.legacy >= 1 && !burnt.save && burnt.slot.empty && !burnt.cont && !burnt.roll.includes(kept.name) && fresh.lit.join() === 'haven' && !fresh.road && fresh.appr === 0 && fresh.legacy === 0,
  JSON.stringify({ pre: pre.slot, burnt, fresh }));

await T.finish('the road\'s speeds');
