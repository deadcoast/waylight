/* economy.mjs — v3.0 THE NEEDS ECONOMY IN MOTION (v3.51 rebuild, mine: the v3.48 source was lost and its record names only its
   subjects, so each check is my reading of one, tested as the game has it now; its figures sampled on the courier's grid). The
   rules that make a delivery worth something, run on the valley's own clock (Economy.update, the game's own step): the
   opening shelves true to the fiction and what every town needs and makes; stock as moods at 15/35/65, and the moods setting
   the boards (a card appears, grows, turns express and vanishes as a shelf drains and fills) and the pay (×2.2/×1.5/×1.0);
   a crate adds 28, people eat 0.035 a second each (the unlit at half); the wire's 0.06 a second from every lit maker, the
   roads' and the chartered porters' multipliers on it; a starving town dimming, losing a star after four minutes of it,
   going quiet with none left, and relit by a core from any lit terminal; the chain's rising bonus and its cap; the letters
   read aloud and the slow mailbag; the crises that wait for three lights; the eight-minute day and its night; the three skill
   verbs; and saves from before the economy — v1 and v2 — walking into this build with their world intact. Where a v3.0
   number was retuned later, the current one is tested and the change named. */
import { boot } from './lib/harness.mjs';
const T = await boot();
const { page, ev, ok } = T;
const t0 = Date.now();
const until = async (fn, arg, ms = 20000, step = 120) => { const end = Date.now() + ms; for (;;) { const v = await ev(fn, arg); if (v) return v; if (Date.now() > end) return null; await page.waitForTimeout(step); } };
const closeSlips = async () => { for (let i = 0; i < 8 && await ev(() => !document.getElementById('results').classList.contains('hidden')); i++) { await page.click('#resultsClose'); await page.waitForTimeout(160); } if (await ev(() => !!UI.curStation)) { await page.click('#stationClose'); await page.waitForTimeout(160); } };

/* ================= 1 · THE OPENING — read before anything is staged ================= */
let r = await ev(() => {
  const st = S.stations, D = DATA.stations, round = (id, g) => Math.round(st[id].stock[g]);
  const opening = { elmMeds: round('elm', 'meds'), havenFood: round('haven', 'food'), millFood: round('mill', 'food'), greenSeeds: round('green', 'seeds') };
  const moods = { elmMeds: Economy.needMood('elm', 'meds'), havenFood: Economy.needMood('haven', 'food'), millFood: Economy.needMood('mill', 'food'), greenSeeds: Economy.needMood('green', 'seeds') };
  const makes = Object.fromEntries(DATA.stationOrder.map(id => [id, D[id].makes.join(',')]));
  const pharos = D.pharos.needs.join(',');
  const shape = DATA.stationOrder.every(id => D[id].pop > 0 && [3, 4].includes(D[id].needs.length) && D[id].needs.every(g => st[id].stock[g] >= 0 && st[id].stock[g] <= 100 && DATA.goodsInfo[g]));
  return { opening, moods, makes, pharos, shape };
});
ok('THE OPENING IS TRUE: a new valley opens as the fiction says — Elm Farm out of medicine (8, critical), Haven eating its reserves (31), the Mill hungry (18), the Greenhouse nearly out of seed (20); every town has people and three or four needs on a 0–100 shelf, and makes what the record says: Haven tools and textiles, Elm food, seed and seedlings, the Greenhouse filters, seedlings and medicine, the Mill parts and tools, the Quarry tools, Relay Hill lumen cells (and relay optics), the Foundry coolant and parts — and the Pharos makes nothing and needs everything (food, medicine, lumen cells, coolant)',
  JSON.stringify(r.opening) === '{"elmMeds":8,"havenFood":31,"millFood":18,"greenSeeds":20}' && r.moods.elmMeds === 'critical' && r.moods.havenFood === 'wanting' && r.moods.millFood === 'wanting' && r.moods.greenSeeds === 'wanting' && r.shape
  && JSON.stringify(r.makes) === '{"haven":"tools,textiles","elm":"food,seeds,seedlings","mill":"parts,tools","green":"filters,seedlings,meds","quarry":"tools","relay":"lumenCell,relayParts","foundry":"coolant,parts","pharos":""}' && r.pharos === 'food,meds,lumenCell,coolant', JSON.stringify(r));

await ev(() => {
  window.__closeAll = () => { for (let i = 0; i < 8 && !document.getElementById('results').classList.contains('hidden'); i++) UI.showNextResult(); document.getElementById('results').classList.add('hidden'); if (UI.curStation) UI.closeStation(); };
  window.__body = () => { S.health = 100; S.bleeding = false; S.warmth = 100; S.food = 100; S.state = 'walk'; S.stam = S.stamMax; S.speed = 0; Systems.cancelMove(); };
  window.__toasts = []; { const t = UI.toast; UI.toast = function (m) { __toasts.push(String(m).replace(/<[^>]+>/g, '')); return t.apply(this, arguments); }; }
  window.__ho = []; window.__cineLog = [];
  const watch = () => {
    try {
      const h = S && S.handover;
      if (h && !h.__seen) { h.__seen = true; __ho.push({ st: h.stId, connect: h.connect, n: h.results.length }); }
      if (S && S.cine) __cineLog.push({ ph: S.cine.phase, st: S.cine.stId, box: document.body.classList.contains('cine') });
    } catch (e) { /* a frame without a valley */ }
    requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);
  /* a delivery staged at the door: a card's def accepted where it was posted, the crates walked in (the walk itself is loop.mjs's) */
  window.__deliver = (def, fromId, toId) => { WL.tp(fromId); const o = Systems.acceptOrder(def, false); WL.tp(toId); WL.instantPar(); const res = Systems.handleDelivery(toId); return { o, res, g: res.results.find(x => x.order === o) }; };
  /* the director and the weather held so nothing random walks into a check; high day; the first walk's taught line spent */
  S.orders.prioIdx = 3; S.orders.prioAccepted = false;
  S.eventCd = 1e9; S.weather = { state: 'clear', t: 1e9, intensity: 0 };
  S.time = DATA.T.dayLen * 0.3;
  S.pTraits = []; Porter.dirty();   // the enlistment's random traits set aside: no quirk of the body moves a figure
  WL.timeScale = 0.001;
});

/* ================= 2 · NEEDS AND MOODS ================= */
r = await ev(() => {
  const st = S.stations.mill, keep = { ...st.stock };
  const at = v => { st.stock.food = v; return Economy.needMood('mill', 'food'); };
  const bands = [0, 14.99, 15, 34.99, 35, 64.99, 65, 100].map(v => [v, at(v)]);
  st.stock.food = 10; st.stock.textiles = 50; st.stock.meds = 80; const worst = Economy.stationMood('mill');
  Object.assign(st.stock, keep);
  return { bands, worst, mul: DATA.T.needMul };
});
ok('THE MOODS: a need\'s stock sets its mood — under 15 critical, under 35 wanting, under 65 steady, thriving above (exactly at the edges: 14.99 critical, 15 wanting, 34.99 wanting, 35 steady, 64.99 steady, 65 thriving); a town\'s own mood is its worst need\'s (the keeper speaks by it); and a mood is a price: ×2.2 out, ×1.5 short, ×1.0 steady',
  JSON.stringify(r.bands) === '[[0,"critical"],[14.99,"critical"],[15,"wanting"],[34.99,"wanting"],[35,"steady"],[64.99,"steady"],[65,"thriving"],[100,"thriving"]]' && r.worst === 'critical' && r.mul.critical === 2.2 && r.mul.wanting === 1.5 && r.mul.steady === 1, JSON.stringify(r));

r = await ev(() => {
  /* the Mill met on the road, dark: its textiles draining at the unlit's half rate from 70, Haven's board read at every step */
  const st = S.stations; st.mill.met = true; st.mill.stock.textiles = 70; st.mill.mood.textiles = 'thriving'; st.mill.stock.food = 100; st.mill.stock.meds = 100; st.mill.mood.food = st.mill.mood.meds = 'thriving';
  __toasts.length = 0;
  const card = () => { const b = Systems.boardFor('haven').filter(x => !x.prio), i = b.findIndex(x => x.def.item === 'textiles' && x.def.to === 'mill'); return i < 0 ? null : { n: b[i].def.n, mood: b[i].def.mood, express: b[i].def.express, first: i === 0 }; };
  const seen = []; let last = '';
  for (let i = 0; i < 2000 && st.mill.stock.textiles > 12; i++) { Economy.update(2); const c = card(), k = JSON.stringify(c); if (k !== last) { seen.push({ at: +st.mill.stock.textiles.toFixed(2), card: c }); last = k; } }
  const short = __toasts.find(t => /^The Mill is running short of textiles$/.test(t)) || null, out = __toasts.find(t => /^The Mill is out of textiles — deliveries pay ×2\.2 there$/.test(t)) || null;
  const mail = S.mails.some(m => m.subj === 'The Mill: textiles gone');
  /* two crates walked in: +56, thriving — and the card is gone */
  const def = Systems.boardFor('haven').map(b => b.def).find(d => d.item === 'textiles' && d.to === 'mill');
  const d = __deliver(def, 'haven', 'mill'); __closeAll();
  const after = { stock: +st.mill.stock.textiles.toFixed(2), card: card() };
  return { seen, short, out, mail, after, n: def && def.n };
});
{
  const s = r.seen, near = (v, e) => v < e && v > e - 0.1;
  ok('THE MOODS SET THE BOARD, IN MOTION: the Mill\'s textiles draining through the bands, Haven\'s board read at every step of the clock — nothing while it thrives; a card of one crate the moment it drops under 65 (steady); two under 35 (wanting — "The Mill is running short of textiles"); under 15 two crates marked express, first on the board ("The Mill is out of textiles — deliveries pay ×2.2 there", and the mail says it is gone); and two crates walked in lift it to thriving, and the card is gone',
    s.length === 4 && s[0].card === null && near(s[1].at, 65) && s[1].card.n === 1 && s[1].card.mood === 'steady' && near(s[2].at, 35) && s[2].card.n === 2 && s[2].card.mood === 'wanting' && !s[2].card.express && near(s[3].at, 15) && s[3].card.n === 2 && s[3].card.mood === 'critical' && s[3].card.express && s[3].card.first && !!r.short && !!r.out && r.mail && r.after.stock >= 65 && r.after.card === null, JSON.stringify(r));
}

r = await ev(() => {
  /* the same crate — textiles ×1 from Haven — delivered into the same door at each mood, graded the same */
  const st = S.stations.mill, def = { id: 'mk_textiles_mill', from: 'haven', to: 'mill', item: 'textiles', n: 1, likesMul: 1, express: false, premium: false, mood: null, urgency: 1 };
  const out = {};
  for (const [mood, v] of [['critical', 10], ['wanting', 25], ['steady', 50], ['thriving', 80]]) {
    st.stock.textiles = v; S.trip.lastT = -1e9;
    const d = __deliver(def, 'haven', 'mill');
    UI.queueResults(d.res.results, null);
    const row = [...document.querySelectorAll('#scoreRows .rowline')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).find(x => /^The Mill (was out of this|was running short|needed this|had plenty already)/.test(x)) || null;
    __closeAll();
    out[mood] = { likes: d.g.likes, mul: d.g.needMul, grade: d.g.grade, row };
  }
  return out;
});
{
  const b = r.steady.likes, q = k => +(r[k].likes / b).toFixed(3);
  ok('THE MOODS SET THE PAY: the same crate walked into the same door at the same grade pays by the shelf it lands on — ×2.2 where they were out, ×1.5 short, ×1.0 steady, and the slip says which ("The Mill was out of this ×2.2" / "was running short ×1.5" / "needed this ×1"); thriving is never posted (the record\'s "nothing"), and a crate that arrives after the shelf filled pays ×0.6 ("had plenty already")',
    ['critical', 'wanting', 'steady', 'thriving'].every(k => r[k].grade === r.steady.grade) && Math.abs(q('critical') - 2.2) < 0.03 && Math.abs(q('wanting') - 1.5) < 0.03 && Math.abs(q('thriving') - 0.6) < 0.03 && r.critical.mul === 2.2 && r.wanting.mul === 1.5 && r.steady.mul === 1 && r.thriving.mul === 0.6
    && /was out of this\s*×2\.2$/.test(r.critical.row || '') && /was running short\s*×1\.5$/.test(r.wanting.row || '') && /needed this\s*×1$/.test(r.steady.row || '') && /had plenty already\s*×0\.6$/.test(r.thriving.row || ''), JSON.stringify({ ...r, ratios: { critical: q('critical'), wanting: q('wanting'), thriving: q('thriving') } }));
}

/* ================= 3 · STOCK FILLS AND DRAINS ================= */
r = await ev(() => {
  const st = S.stations, T2 = DATA.T;
  /* fills: the game's own hand at the counter — a crate is 28 on the shelf, two 56, and the shelf stops at 100 */
  st.quarry.stock.textiles = 20; const one = Economy.onDeliver('quarry', 'textiles', 1);
  st.quarry.stock.textiles = 20; const two = Economy.onDeliver('quarry', 'textiles', 2);
  st.quarry.stock.textiles = 90; const cap = Economy.onDeliver('quarry', 'textiles', 1);
  /* drains: a minute of the valley with nothing on the wire — Haven lit, the Mill and the Pharos dark */
  st.haven.stock.food = 60; st.mill.stock.textiles = 60; st.pharos.stock.coolant = 60;
  for (let i = 0; i < 60; i++) Economy.update(1);
  const d = { haven: +(60 - st.haven.stock.food).toFixed(3), mill: +(60 - st.mill.stock.textiles).toFixed(3), pharos: +(60 - st.pharos.stock.coolant).toFixed(3) };
  const want = { haven: +(T2.stockDrain * 1.0 * 60).toFixed(3), mill: +(T2.stockDrain * 0.9 * 0.5 * 60).toFixed(3), pharos: +(T2.stockDrain * 1.2 * 0.5 * 60).toFixed(3) };
  return { perCrate: T2.stockPerCrate, one: [one.before, one.after], two: [two.before, two.after], cap: [cap.before, cap.after], moods: [one.mood, two.mood], d, want, lit: DATA.stationOrder.filter(id => st[id].connected) };
});
ok('STOCK FILLS AND DRAINS: a crate adds 28 to the shelf (20 → 48), two add 56 (20 → 76), and the shelf stops at 100 (90 → 100); and people eat — 0.035 a second times the town\'s people: a minute costs lit Haven (a whole town, 1.0) 2.1, while a town off the wire rations at half — the Mill (0.9 of a town) 0.945, the Pharos (1.2) 1.26',
  r.perCrate === 28 && JSON.stringify(r.one) === '[20,48]' && JSON.stringify(r.two) === '[20,76]' && JSON.stringify(r.cap) === '[90,100]' && JSON.stringify(r.lit) === '["haven"]' && Math.abs(r.d.haven - r.want.haven) < 1e-6 && Math.abs(r.d.mill - r.want.mill) < 1e-6 && Math.abs(r.d.pharos - r.want.pharos) < 1e-6 && r.want.haven === 2.1 && r.want.mill === 0.945 && r.want.pharos === 1.26, JSON.stringify(r));

/* ================= 4 · THE WIRE, AND WHAT WIDENS IT ================= */
r = await ev(() => {
  const st = S.stations;
  Object.assign(st.elm, { connected: true, met: true, litT: 1 }); State.refreshSources(true);
  st.haven.stock.food = 30; st.elm.stock.tools = 30; st.elm.stock.meds = 50; st.elm.stock.filters = 50; __toasts.length = 0; st.haven.wireTold = false; S.wireLog.haven = 0;
  for (let i = 0; i < 100; i++) Economy.update(1);
  const d = { food: +(st.haven.stock.food - 30).toFixed(3), tools: +(st.elm.stock.tools - 30).toFixed(3) };
  for (let i = 0; i < 3600; i++) Economy.update(1);   // an hour of the valley
  const told = __toasts.filter(t => /^Haven is being fed by the wire now/.test(t));
  return { d, told, full: [+st.haven.stock.food.toFixed(2), +st.elm.stock.tools.toFixed(2)], flow: DATA.T.wireFlow };
});
ok('THE WIRE FLOWS: Elm Farm on the wire beside Haven, what each makes flows to the other on its own — 0.06 a second from every lit maker of a need, more than its people eat (Haven\'s rations +0.025 a second net, Elm\'s hand tools +0.032), the first feeding said once ("Haven is being fed by the wire now — Elm Farm send what they can on their own"); so a connected pair sustains itself — an hour on, both shelves stand full',
  r.flow === 0.06 && Math.abs(r.d.food - 2.5) < 1e-6 && Math.abs(r.d.tools - 3.2) < 1e-6 && r.told.length === 1 && r.told[0] === 'Haven is being fed by the wire now — Elm Farm send what they can on their own' && r.full[0] === 100 && r.full[1] === 100, JSON.stringify(r));

r = await ev(() => {
  /* the Mill lit too: its textiles come only from Haven, down the Saddle Road — the flow measured off the shelf, road stretch by stretch */
  const st = S.stations; Object.assign(st.mill, { connected: true, met: true, litT: 1 }); State.refreshSources(true);
  const drain = DATA.T.stockDrain * DATA.stations.mill.pop;
  const measure = () => { st.mill.stock.textiles = 20; for (let i = 0; i < 100; i++) Economy.update(1); return +(((st.mill.stock.textiles - 20) / 100 + drain) / DATA.T.wireFlow).toFixed(4); };
  const out = {};
  for (const segs of [0, 1, 2, 3]) { S.roads.r_mill = [0, 1, 2].map(i => i < segs); out[segs] = { measured: measure(), flowMul: +Economy.flowMul('haven', 'mill').toFixed(4) }; }
  return out;
});
ok('ROADS MULTIPLY THE WIRE: the Saddle Road between Haven and the Mill carries the wire\'s flow ×1 unpaved, then by the share paved toward the record\'s ×1.6 for a partial road (one stretch of three ×1.2, two ×1.4), and ×2.2 complete — measured off the Mill\'s own shelf (its textiles come only from Haven), and the game\'s own multiplier says the same',
  [[0, 1], [1, 1.2], [2, 1.4], [3, 2.2]].every(([k, m]) => Math.abs(r[k].measured - m) < 1e-3 && Math.abs(r[k].flowMul - m) < 1e-9), JSON.stringify(r));

r = await ev(() => {
  const st = S.stations, drain = DATA.T.stockDrain * DATA.stations.mill.pop;
  const measure = () => { st.mill.stock.textiles = 20; for (let i = 0; i < 100; i++) Economy.update(1); return +(((st.mill.stock.textiles - 20) / 100 + drain) / DATA.T.wireFlow).toFixed(4); };
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.state = 'route'; n.feeWaived = true; n.route = { a: 'haven', b: 'mill', t: 120, runs: 0 };
  S.roads.r_mill = [false, false, false]; const bare = measure();
  S.roads.r_mill = [true, true, true]; const road = measure();
  n.hungry = true; const hungry = measure(); n.hungry = false;
  S.npcs.splice(S.npcs.indexOf(n), 1); S.roads.r_mill = [false, false, false];
  return { bare, road, hungry };
});
ok('PORTERS MULTIPLY THE WIRE: a route porter chartered on the Haven ⇄ Mill run adds ×1 to the wire between them — ×2 on the bare road, ×3.2 on the complete one — and a porter gone hungry adds nothing (×2.2, the road alone)',
  Math.abs(r.bare - 2) < 1e-3 && Math.abs(r.road - 3.2) < 1e-3 && Math.abs(r.hungry - 2.2) < 1e-3, JSON.stringify(r));

/* ================= 5 · DIMMING, STAR LOSS, GOING QUIET, RELIGHTING ================= */
r = await ev(() => {
  const st = S.stations, E = DATA.stations.elm, P = [E.x - 0.8 * E.baseR, E.y];
  st.mill.stock.meds = 80; st.mill.critT = 0;   // the Mill kept fed through what follows: this is Elm Farm's trouble alone
  st.elm.stars = 0; st.elm.likesTo = 0; st.elm.stock.meds = 8; st.elm.stock.filters = 50; st.elm.stock.tools = 80; st.elm.critT = 0; st.green.met = false;
  Economy.update(1); State.refreshSources(true);
  const rationed = { dimmed: !!st.elm.dimmed, L: +World.lightAt(P[0], P[1]).toFixed(3), cov: +S.cov.toFixed(4) };
  st.green.met = true; __toasts.length = 0;
  Economy.update(1);
  const dim = { dimmed: !!st.elm.dimmed, L: +World.lightAt(P[0], P[1]).toFixed(3), cov: +S.cov.toFixed(4) };
  return { rationed, dim };
});
ok('DIMMING: a lit town critical on a need that a town the Walker knows could supply dims — Elm Farm out of medicine once the Greenhouse is met: its light\'s reach shrinks by a quarter (ground eight-tenths of its reach out, lit before, falls dark; the valley\'s coverage drops); out of a good nobody the Walker knows makes, the same shortage is rationed, not held against them — no dimming',
  !r.rationed.dimmed && r.rationed.L > 0.1 && r.dim.dimmed && r.dim.L === 0 && r.dim.cov < r.rationed.cov, JSON.stringify(r));

r = await ev(() => {
  const st = S.stations.elm; st.stars = 2; st.likesTo = 400; st.critT = 0; State.refreshSources(true);
  const cov2 = S.cov; __toasts.length = 0;
  for (let i = 0; i < 239; i++) Economy.update(1);
  const held = st.stars;
  for (let i = 0; i < 3; i++) Economy.update(1);
  return { held, stars: st.stars, likesTo: st.likesTo, toast: __toasts.find(t => /^Elm Farm lost a star — people are leaving$/.test(t)) || null, mail: S.mails.slice(0, 6).some(m => m.subj === 'Elm Farm shrinks'), cov: [+cov2.toFixed(4), +S.cov.toFixed(4)], neglect: st.stock.meds < 15 && !S.stations.green.connected };
});
ok('STAR LOSS: four minutes of that neglect — critical on medicine a known town makes, and no lit maker closing it — cost Elm Farm a star: at 239 seconds it still holds two, past 240 one ("Elm Farm lost a star — people are leaving", the mail: Elm Farm shrinks), its likes set back under the second star\'s threshold, its light a star\'s reach shorter',
  r.neglect && r.held === 2 && r.stars === 1 && r.likesTo <= 259 && !!r.toast && r.mail && r.cov[1] < r.cov[0], JSON.stringify(r));

r = await ev(() => {
  const st = S.stations, E = st.elm; __toasts.length = 0;
  st.haven.stars = 0; st.haven.stock.food = 5; st.haven.critT = 0;
  for (let i = 0; i < 242; i++) Economy.update(1);
  const zero = E.stars;
  for (let i = 0; i < 242; i++) Economy.update(1);
  const quiet = { connected: E.connected, litT: E.litT, flag: !!(S.quiet && S.quiet.elm), toast: __toasts.find(t => /^Elm Farm has gone quiet\. The waylight is out\. A beacon core from any lit terminal will bring them back\.$/.test(t)) || null, mail: S.mails.slice(0, 6).some(m => m.subj === 'Elm Farm went quiet') };
  for (let i = 0; i < 600; i++) Economy.update(1);   // Haven starving too, with no star to lose — for ten minutes
  return { zero, quiet, haven: { connected: st.haven.connected, stars: st.haven.stars, food: +st.haven.stock.food.toFixed(1) } };
});
ok('GOING QUIET: with no star left, four minutes more and Elm Farm goes quiet — off the wire, its light out ("Elm Farm has gone quiet. The waylight is out. A beacon core from any lit terminal will bring them back.", and the mail); Haven, the last light of the south, starving with no star to lose, never does',
  r.zero === 0 && !r.quiet.connected && r.quiet.litT === 0 && r.quiet.flag && !!r.quiet.toast && r.quiet.mail && r.haven.connected, JSON.stringify(r));

/* the relight: every lit terminal posts it; Haven's by a real click, carried, handed over at Elm's door by a real E */
r = await ev(() => {
  const rl = id => Systems.boardFor(id).map(b => b.def).find(d => d.relight === 'elm');
  const h = rl('haven'), m = rl('mill');
  S.stations.haven.stock.food = 60; S.stations.haven.critT = 0; S.stations.elm.stock.meds = 60; S.stations.green.met = false;
  WL.tp('haven'); __body();
  return { haven: h && { id: h.id, item: h.item, likesMul: h.likesMul, title: h.title }, mill: !!m };
});
const posted = r;
await page.keyboard.press('KeyE'); await page.waitForTimeout(400);
r = await ev(() => {
  const b = Systems.boardFor('haven'), i = b.findIndex(x => x.def.relight === 'elm');
  const card = [...document.querySelectorAll('#stationBody .orderCard')].find(c => /Beacon core → Elm Farm/.test(c.querySelector('h4').textContent));
  return { i, card: card ? card.textContent.replace(/\s+/g, ' ').slice(0, 200) : null, tag: card ? card.querySelector('.wbTag').textContent : null, prio: !!(card && card.classList.contains('prio')) };
});
const relCard = r;
await page.click(`#stationOv [data-accept="${relCard.i}"]`); await page.waitForTimeout(450);
await page.click('#stationClose'); await page.waitForTimeout(250);
await ev(() => { WL.tp('elm'); __body(); WL.instantPar(); __cineLog.length = 0; });
await page.keyboard.press('KeyE');
await until(() => __ho.some(h => h.st === 'elm' && h.connect === 'elm'), null, 8000);
await ev(() => { WL.timeScale = 3; });
await until(() => !S.cine && S.stations.elm.connected && __cineLog.some(x => x.st === 'elm'), null, 20000);
await ev(() => { WL.timeScale = 0.001; });
await closeSlips();
await ev(() => { WL.tp('elm'); __body(); });
await page.keyboard.press('KeyE'); await page.waitForTimeout(400);
r = await ev(() => {
  const E = S.stations.elm, line = document.getElementById('keeperLine').textContent;
  const out = { connected: E.connected, litT: E.litT, quiet: !!(S.quiet && S.quiet.elm), relitAt: E.relitAt !== undefined, cine: [...new Set(__cineLog.filter(x => x.st === 'elm').map(x => x.ph))], relitLine: line.includes(DATA.keepers.elm.voice.relit) };
  __closeAll();
  return out;
});
ok('RELIGHTING: a quiet town is posted at every lit terminal — Relight Elm Farm on Haven\'s board and the Mill\'s, the gold PRIORITY DISPATCH card, a beacon core, paying double ("The waylight is out. A core from here brings Elm Farm back onto the wire."); taken by a real click, carried, handed over by a real E at Elm Farm\'s door, it puts the farm back on the wire through the connection scene, the quiet lifted, and Wren greets the Walker as the one who lit the farm back up',
  !!posted.haven && posted.haven.id === 'rl_elm' && posted.haven.item === 'core' && posted.haven.likesMul === 2 && posted.haven.title === 'Relight Elm Farm' && posted.mill && relCard.i >= 0 && relCard.tag === 'PRIORITY DISPATCH' && relCard.prio && /The waylight is out\. A core from here brings Elm Farm back onto the wire\./.test(relCard.card || '')
  && r.connected && r.litT === 1 && !r.quiet && r.relitAt && r.cine.includes(1) && r.cine.includes(3) && r.relitLine, JSON.stringify({ posted, relCard, r }));

/* ================= 6 · CHAIN BONUSES ================= */
r = await ev(() => {
  const def = to => ({ id: 'mk_x_' + to, from: 'haven', to, item: to === 'elm' ? 'tools' : 'textiles', n: 1, likesMul: 1, express: false, premium: false, mood: null, urgency: 1 });
  S.trip.lastT = -1e9; const out = []; document.getElementById('announce').textContent = '';
  const stops = ['elm', 'mill', 'elm', 'mill', 'elm', 'mill', 'elm'];
  for (const to of stops) { S.stations.elm.stock.tools = 50; S.stations.mill.stock.textiles = 50; const d = __deliver(def(to), 'haven', to); out.push({ chain: d.g.chain, n: d.g.chainN, call: document.getElementById('announce').textContent }); S.time += 20; }
  S.time += 241; S.stations.elm.stock.tools = 50;
  const d = __deliver(def('elm'), 'haven', 'elm'); const fresh = { chain: d.g.chain, n: d.g.chainN };
  __closeAll();
  return { out, fresh, bonus: DATA.T.chainBonus };
});
ok('CHAIN BONUSES: crates landed on one trip — each stop within four minutes of the last — pay a rising bonus, +15% a further stop: ×1, ×1.15, ×1.30, ×1.45, capped at ×1.6 from the fifth on; the Dispatch booth calls each (DOUBLE DROP. THE WIRE NOTICES. → THREE STOPS — THE WIRE SINGS! → … SIX?!); a stop past the four minutes starts a new trip at ×1',
  r.bonus === 0.15 && JSON.stringify(r.out.map(x => +x.chain.toFixed(2))) === '[1,1.15,1.3,1.45,1.6,1.6,1.6]' && JSON.stringify(r.out.map(x => x.n)) === '[1,2,3,4,5,6,7]' && r.out[0].call === '' && r.out[1].call === 'DOUBLE DROP. THE WIRE NOTICES.' && r.out[2].call === 'THREE STOPS — THE WIRE SINGS!' && r.out[3].call === 'FOUR STOPS. WHO RAISED YOU?' && r.out[4].call === 'FIVE STOPS — THEY WILL SING ABOUT THIS ONE.' && r.out[5].call === 'SIX?! LEAVE SOME GLORY FOR THE REST OF THE ORDER.' && r.fresh.chain === 1 && r.fresh.n === 1, JSON.stringify(r));

/* ================= 7 · LETTERS ================= */
r = await ev(() => {
  const st = S.stations; st.haven.bag = 70; st.green.met = false; st.quarry.met = true;   // the Quarry met on the road, dark
  const runs = () => Systems.boardFor('haven').map(b => b.def).filter(d => d.item === 'letters').map(d => ({ to: d.to, tier: d.tier, n: d.n, service: d.service }));
  const r0 = runs(); WL.tp('haven'); __body();
  return { r0, known: DATA.stationOrder.filter(id => st[id].connected || st[id].met), dark: DATA.stationOrder.filter(id => st[id].met && !st[id].connected) };
});
const mail0 = r;
await page.keyboard.press('KeyE'); await page.waitForTimeout(400);
{
  const idx = await ev(() => Systems.boardFor('haven').findIndex(b => b.def.item === 'letters' && b.def.to === 'elm'));
  await page.click(`#stationOv [data-accept="${idx}"]`); await page.waitForTimeout(450);
}
r = await ev(() => {
  const o = S.orders.active.find(x => x.item === 'letters' && x.to === 'elm'), bags = o.items.map(id => S.cargo.find(c => c.id === id));
  const letters = () => Systems.boardFor('haven').map(b => b.def).filter(d => d.item === 'letters');
  const next = letters().map(d => d.to);
  /* the Mill's run taken too, and the town writes another bagful: the next door out is the dark one */
  const m = letters().find(d => d.to === 'mill'); if (m) Systems.acceptOrder(m, false);
  S.stations.haven.bag = DATA.T.bagCost; const third = letters().map(d => ({ to: d.to, tier: d.tier }));
  return { kg: bags.reduce((a, c) => a + c.kg, 0), n: bags.length, next, third };
});
const mail1 = r;
await page.click('#stationClose'); await page.waitForTimeout(250);
await ev(() => { WL.tp('elm'); __body(); WL.instantPar(); window.__likes0 = S.likes; });
await page.keyboard.press('KeyE');
await until(() => __ho.some(h => h.st === 'elm' && !h.connect), null, 8000);
await ev(() => { WL.timeScale = 1; });
await until(() => !document.getElementById('results').classList.contains('hidden'), null, 8000, 100);
await ev(() => { WL.timeScale = 0.001; });
r = await ev(() => {
  const rows = [...document.querySelectorAll('#scoreRows .rowline')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
  const read = rows.find(x => /^Read aloud at the terminal:/.test(x)) || '', line = (read.match(/“(.*)”/) || [])[1] || null;
  const mail = S.mails.find(m => m.subj === 'A letter arrives at Elm Farm');
  S.stations.quarry.met = false;
  return { route: document.getElementById('resultRoute').textContent, fee: rows.find(x => /^Fee taken/.test(x)) || null, line, inBook: DATA.letterLines.includes(line), lines: DATA.letterLines.length, mail: !!mail && mail.body === line, likes: S.likes - __likes0 };
});
ok('LETTERS GO EVERYWHERE PEOPLE ARE, READ ALOUD (v3.16: the letters became the post — the record\'s "half pay" is the Order\'s service now, no fee): the bag posts its runs door by door, nearest first, to every door the Walker knows and never a stranger\'s — Elm Farm (taken by a real click: two letters riding light, 4 kg), then the Mill, then, with the next bagful, the Quarry, met on the road but dark; handed over at Elm Farm the slip reads one of the valley\'s twenty-four lines aloud — and files it in the mail — for no fee',
  mail0.r0.length === 1 && mail0.r0[0].to === 'elm' && mail0.r0.every(x => mail0.known.includes(x.to) && x.service) && mail1.n === 2 && mail1.kg === 4 && JSON.stringify(mail1.next) === '["mill"]' && mail1.third.length === 1 && mail1.third[0].to === 'quarry' && mail0.dark.includes('quarry')
  && /^Haven → Elm Farm · LOCAL POST · SERVICE OF THE ORDER$/.test(r.route) && /NONE — Waylighters carry the mail/.test(r.fee || '') && r.inBook && r.lines === 24 && r.mail && r.likes === 0, JSON.stringify({ mail0, mail1, r }));
await closeSlips();

r = await ev(() => {
  /* a bag run carried off; the town writes the next one at its own pen's pace */
  const st = S.stations.haven; S.orders.active = S.orders.active.filter(o => o.item !== 'letters'); S.cargo = S.cargo.filter(c => c.defId !== 'letters');
  st.bag = DATA.T.bagCost;
  const def = Systems.boardFor('haven').map(b => b.def).find(d => d.item === 'letters');
  WL.tp('haven'); Systems.acceptOrder(def, false);
  const left = +st.bag.toFixed(2), posted = () => Systems.boardFor('haven').some(b => b.def.item === 'letters');
  const none = !posted(); let secs = 0;
  while (!posted() && secs < 1200) { Economy.update(1); secs++; }
  return { cost: DATA.T.bagCost, fill: DATA.T.bagFill, left, none, secs, minutes: +(secs / 60).toFixed(2) };
});
ok('THE MAILBAG REFILLS SLOWLY: a run carried off empties a bagful from the town\'s bag (35 → 0) and no run is posted after it; the town writes the next at its own pen\'s pace (0.11 a second) — the next run posts only 5.3 game-minutes later, inside the record\'s five-to-eight: letters are proof, not income',
  r.cost === 35 && r.left === 0 && r.none && r.minutes >= 5 && r.minutes <= 8, JSON.stringify(r));

/* ================= 8 · CRISES ================= */
r = await ev(() => {
  /* the director's own dice, rolled until they land where they may: with two lights no crisis ever comes; with three one does */
  const calls = []; const pc = Systems.postCrisis; Systems.postCrisis = function (from, to) { const res = pc.apply(this, arguments); calls.push({ from, to, res }); return res; };
  const st = S.stations; S.orders.active = []; S.cargo = S.cargo.filter(c => !c.orderId); UI.closeAllModals();
  const best = { haven: 'food', elm: 'tools', mill: 'textiles' };
  const stock = () => { for (const id of ['haven', 'elm', 'mill']) for (const g of DATA.stations[id].needs) st[id].stock[g] = g === best[id] ? 90 : 60; };
  const roll = () => { S.event = null; S.eventCd = 0; S.flags.firstEvent = true; NPC.update(0.001); S.event = null; S.wraiths = []; S.stormT = 0; S.surgeT = 0; S.weather = { state: 'clear', t: 1e9, intensity: 0 }; };
  st.mill.connected = false; State.refreshSources(true); stock();
  const lit2 = DATA.stationOrder.filter(id => st[id].connected).length;
  for (let i = 0; i < 150; i++) roll();
  const two = calls.length;
  st.mill.connected = true; State.refreshSources(true); stock(); __toasts.length = 0;
  let tries = 0; while (!calls.length && tries < 400) { roll(); tries++; }
  S.eventCd = 1e9; Systems.postCrisis = pc;
  const c = calls[0], need = c ? best[c.to] : null;
  window.__crisis = c ? { to: c.to, need } : null;
  return { lit2, two, lit3: DATA.stationOrder.filter(id => st[id].connected).length, tries, call: c || null, need, left: c ? +st[c.to].stock[need].toFixed(2) : null, others: c ? DATA.stations[c.to].needs.filter(g => g !== need).map(g => +st[c.to].stock[g].toFixed(1)) : null, toast: __toasts.find(t => /^Crisis at /.test(t)) || null };
});
{
  const nm = r.call ? await ev(c => DATA.stations[c.to].name + '|' + DATA.goodsInfo[c.need].name.toLowerCase(), { to: r.call.to, need: r.need }) : '|';
  const [town, good] = nm.split('|');
  ok('CRISES WAIT FOR THREE LIGHTS: the director\'s own dice rolled a hundred and fifty times with two stations lit bring no crisis; with three lit one comes — something broke: a lit town\'s best-stocked need emptied in one stroke (to 4), its other shelves untouched, and the valley told ("Crisis at … — their … is gone. Whoever carries it there first is owed.")',
    r.lit2 === 2 && r.two === 0 && r.lit3 === 3 && !!r.call && r.call.res === true && r.left <= 4 && r.others.every(v => v >= 59) && r.toast === `Crisis at ${town} — their ${good} is gone. Whoever carries it there first is owed.`, JSON.stringify(r));
}
r = await ev(() => {
  const c = __crisis; if (!c) return null;
  const makers = DATA.stationOrder.filter(id => S.stations[id].connected && DATA.stations[id].makes.includes(c.need) && id !== c.to);
  const cards = makers.map(id => { const b = Systems.boardFor(id).filter(x => !x.prio), i = b.findIndex(x => x.def.item === c.need && x.def.to === c.to); return i < 0 ? { id, i } : { id, i, n: b[i].def.n, mood: b[i].def.mood, express: b[i].def.express }; });
  const from = makers[0]; WL.tp(from); UI.openStation(from);
  const card = [...document.querySelectorAll('#stationBody .orderCard')].find(x => new RegExp(`→ ${DATA.stations[c.to].name}$`).test(x.querySelector('h4').textContent) && x.textContent.includes(DATA.goodsInfo[c.need].name));
  const txt = card ? card.textContent.replace(/\s+/g, ' ') : '';
  __closeAll();
  return { c, makers, cards, mult: /×2\.2/.test(txt), out: /they are out/.test(txt), express: /express/.test(txt) };
});
ok('THE CRISIS ON THE BOARD: the emptied need is posted at once at every lit board that makes it — two crates for that door, critical and express, first on the board under the ★, the card saying "they are out" and paying ×2.2: whoever carries it there first is owed',
  !!r && r.makers.length >= 1 && r.cards.every(x => x.i === 0 && x.n >= 2 && x.mood === 'critical' && x.express) && r.mult && r.out && r.express, JSON.stringify(r));

/* ================= 9 · NIGHT ================= */
r = await ev(async () => {
  const DL = DATA.T.dayLen, at = f => { S.time = Math.floor(S.time / DL) * DL + DL * f; return Economy.dayPhase(); };
  const ph = [0.03, 0.3, 0.55, 0.59, 0.61, 0.95].map(f => { const p = at(f); return [f, p.label, p.night]; });
  const row = document.getElementById('dayRow'), hud = async re => { WL.timeScale = 1; for (let i = 0; i < 60 && !re.test(row.textContent); i++) await __wait(100); await __wait(250); WL.timeScale = 0.001; };   // the HUD reads the clock five times a game-second
  at(0.7); await hud(/^night/);
  const night = { text: row.textContent, cls: row.classList.contains('night'), day: Math.floor(S.time / DL) + 1 };
  at(0.3); await hud(/^day/);
  const day = { text: row.textContent, cls: row.classList.contains('night') };
  return { DL, ph, night, day };
});
ok('THE DAY AND ITS NIGHT: a day is eight minutes (480 s) and the last 40% of it is night — dawn at the turn, day, dusk from 52%, night past 60% (59% still dusk, 61% night) — and the HUD says so: "night · day N" in the night\'s own colour after dark, "day · day N" after',
  r.DL === 480 && JSON.stringify(r.ph) === '[[0.03,"dawn",false],[0.3,"day",false],[0.55,"dusk",false],[0.59,"dusk",false],[0.61,"night",true],[0.95,"night",true]]' && r.night.text === `night · day ${r.night.day}` && r.night.cls && /^day · day \d+$/.test(r.day.text) && !r.day.cls, JSON.stringify(r));

r = await ev(async () => {
  /* one spot in the open grey (mist ~0.6, out of any light): the same ground by day and by night */
  const spot = [4300, 4400], DL = DATA.T.dayLen, at = f => { S.time = Math.floor(S.time / DL) * DL + DL * f; };
  const rnd = Math.random; Math.random = U.rng(4242);   // the grey's spawning dice, held
  if (S.rep) S.rep.evtCd = 1e9;   // no procession walks into the look
  const look = f => { at(f); WL.tp(spot); __body(); S.wraiths = []; S.warmth = 60; const w0 = S.warmth; for (let i = 0; i < 60; i++) Systems.update(1 / 12, {}); return { wraiths: S.wraiths.length, warmth: +(S.warmth - w0).toFixed(2), night: Economy.dayPhase().night }; };
  const day = look(0.3), night = look(0.75);
  Math.random = rnd; S.wraiths = []; at(0.3); WL.tp('haven'); __body();
  return { mist: +World.mistAt(spot[0], spot[1]).toFixed(3), L: World.lightAt(spot[0], spot[1]), wraithMist: DATA.T.wraithMist, day, night };
});
ok('NIGHT HAS TEETH: on the same grey ground (mist 0.6, under the wraiths\' 0.68) five seconds of day wake nothing and the Walker\'s coat holds the warmth; five seconds of night wake the kept in the thinner mist (the grey comes closer after dark) and the cold bites through the same coat',
  r.L === 0 && r.mist > 0.54 && r.mist < r.wraithMist && !r.day.night && r.night.night && r.day.wraiths === 0 && r.night.wraiths >= 1 && r.day.warmth >= 0 && r.night.warmth < -1, JSON.stringify(r));

/* ================= 10 · SKILL VERBS ================= */
r = await ev(() => {
  /* the Haven side of Elm Creek, at the water's edge facing across; no ladder on the back, a crate of scrap metal on it */
  S.cargo = S.cargo.filter(c => c.tool !== 'ladder'); S.banked.metal = 30;
  const scrap = State.makeItem('metal'); S.cargo.push(scrap); UI.refreshCargo();
  S.skills.rig.lv = 1; const lv1 = Systems.buildOptions().map(o => o.type);
  S.skills.rig.lv = 2; const lv2 = Systems.buildOptions().map(o => o.type);
  const A = [4000, 9880], B = [2700, 9420]; let edge = null, far = null;
  for (let i = 0; i <= 400; i++) { const x = A[0] + (B[0] - A[0]) * i / 400, y = A[1] + (B[1] - A[1]) * i / 400; if (World.terrainAt(x, y).water) { if (!edge) edge = [x, y, i]; far = [x, y]; } }
  const k = edge[2] - 14, sx = A[0] + (B[0] - A[0]) * k / 400, sy = A[1] + (B[1] - A[1]) * k / 400;
  WL.tp([sx, sy]); __body(); S.dir = Math.atan2(B[1] - A[1], B[0] - A[0]);
  Render.setZoom(1.12); Render.cam.x = S.px; Render.cam.y = S.py;   // the play zoom, the camera on the Walker, for the mouse to aim by
  window.__creek = { edge, far, stand: [sx, sy] };
  return { lv1, lv2, structs: S.structures.filter(s => s.type === 'ladder').length, metal: [scrap.qty, S.banked.metal] };
});
const rig0 = r;
await page.keyboard.press('KeyB'); await page.waitForTimeout(250);
const bar = await ev(() => ({ open: !document.getElementById('buildBar').classList.contains('hidden'), text: document.getElementById('buildBar').textContent.replace(/\s+/g, ' ').slice(0, 160) }));
await page.keyboard.press('Digit1'); await page.waitForTimeout(300);
/* aim at the far bank with the mouse, and lay it with E */
{
  const p = await ev(() => __toScr(__creek.far[0], __creek.far[1]));
  await page.mouse.move(p.x, p.y); await page.waitForTimeout(250);
  await ev(async () => { WL.timeScale = 1; await __wait(300); WL.timeScale = 0.001; });
}
const ghost = await ev(() => S.place ? { type: S.place.type, valid: S.place.valid, why: S.place.why } : null);
await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
r = await ev(() => {
  const L = S.structures.filter(s => s.type === 'ladder'), lad = L[L.length - 1];
  const mid = lad ? World.terrainAt(lad.x, lad.y).water : false;
  const scrap = S.cargo.find(c => c.mat === 'metal');
  Render.setZoom(null);
  return { n: L.length, mid, scrapLeft: scrap ? scrap.qty : 0, bank: S.banked.metal, place: !!S.place, tools: S.cargo.filter(c => c.tool === 'ladder').length };
});
ok('RIGGING 2 — THE FIELD LADDER (v3.19: laid through its blueprint, nothing plopped down blind): with no ladder on the back, Rigging 1 has none to lay; Rigging 2 offers the field ladder on the build bar (B, then 1 hangs its blueprint), aimed across Elm Creek by the mouse and laid by E — eight scrap from the crate on the back first (10 → 2), the bank untouched — a ladder standing over the water',
  !rig0.lv1.includes('fieldladder') && rig0.lv2[0] === 'fieldladder' && bar.open && !!ghost && ghost.type === 'fieldladder' && ghost.valid && r.n === rig0.structs + 1 && r.mid && r.scrapLeft === 2 && r.bank === 30 && !r.place && r.tools === 0, JSON.stringify({ rig0, bar, ghost, r }));

r = await ev(() => {
  /* out on open ground: no fire, no generator or shelter, no terminal, no camp's fire within reach */
  WL.tp([4700, 10500]); __body(); S.banked.provisions = 20;
  const near = !!Systems.nearStation(150);
  S.skills.hearth.lv = 1; const lv1 = Systems.getInteractions().filter(i => i.key === 'C').map(i => i.label);
  S.skills.hearth.lv = 2; const lv2 = Systems.getInteractions().filter(i => i.key === 'C').map(i => i.label);
  window.__meals0 = S.cargo.filter(c => c.defId === 'warmmeal').length;
  return { near, lv1, lv2 };
});
const hearth0 = r;
await page.keyboard.press('KeyC'); await page.waitForTimeout(250);
r = await ev(() => ({ meals: S.cargo.filter(c => c.defId === 'warmmeal').length - __meals0, prov: S.banked.provisions }));
ok('HEARTHCRAFT 2 — A WARM MEAL ANYWHERE: out on open ground, far from any fire or terminal, Hearthcraft 1 cooks nothing; Hearthcraft 2 puts "Cook a warm meal — 8 provisions" on the rail and a real C cooks it — a warm meal on the pack, eight provisions from the bank',
  !hearth0.near && hearth0.lv1.length === 0 && hearth0.lv2.length === 1 && /Cook a warm meal — 8 provisions/.test(hearth0.lv2[0]) && r.meals === 1 && r.prov === 12, JSON.stringify({ hearth0, r }));

r = await ev(async () => {
  /* a scrap pile in reach, the Walker three hundred off it on open ground — where nothing else the compass carries (the Guide's
     door, a ruin, another pile, a bowl or a wrong fire) stands within fifteen degrees of its bearing, so no mark crowds it off the strip */
  const H = DATA.stations.haven, bear = (s, p) => Math.atan2(p.y - s[1], p.x - s[0]), apart = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const others = s => [{ x: H.x, y: H.y }, ...(S.ruins || []).filter(rn => !rn.looted && U.dist(rn.x, rn.y, s[0], s[1]) < 760), ...S.nodes.filter(n => !n.taken && U.dist(n.x, n.y, s[0], s[1]) < 580),
    ...(typeof Republic !== 'undefined' && S.rep ? [...Republic.sites('flameshrine'), ...Republic.sites('hollowfire')] : []).filter(p => U.dist(p.x, p.y, s[0], s[1]) < 1200)];
  let node = null, spot = null;
  for (const n of S.nodes.filter(n2 => !n2.taken && n2.type !== 'lumen').sort((a, b) => U.dist(a.x, a.y, H.x, H.y) - U.dist(b.x, b.y, H.x, H.y))) {
    for (let a = 0; a < Math.PI * 2 && !spot; a += Math.PI / 12) {
      const s = [n.x + Math.cos(a) * 300, n.y + Math.sin(a) * 300], t = World.terrainAt(s[0], s[1]);
      if (t.water || t.blocked || DATA.stationOrder.some(id => U.dist(s[0], s[1], DATA.stations[id].x, DATA.stations[id].y) < 300)) continue;
      const b = bear(s, n); if (others(s).every(p => p === n || apart(bear(s, p), b) > 0.26)) { node = n; spot = s; }
    }
    if (spot) break;
  }
  WL.tp(spot); __body(); S.dir = Math.atan2(node.y - spot[1], node.x - spot[0]);
  const pings = async () => { WL.timeScale = 1; await __wait(250); await __frames(3); WL.timeScale = 0.001; return [...document.querySelectorAll('#compass .cMark')].map(m => m.getAttribute('title') || '').filter(t => /^(scrap|lumen) /.test(t)); };
  const cls = S.pClass;
  S.skills.sal.lv = 1; const lv1 = await pings();
  S.skills.sal.lv = 2; const lv2 = await pings();
  S.skills.sal.lv = 0; S.pClass = 'scavenger'; const scav = await pings(); S.pClass = cls;
  return { cls, node: [node.type, Math.round(U.dist(spot[0], spot[1], node.x, node.y))], lv1, lv2, scav };
});
ok('SALVAGE 2 — THE PINGS: a scrap pile three hundred units off is not on the compass for Salvage 1; at Salvage 2 it pings there ("scrap …"), and a Scavenger\'s eye pings it with no Salvage at all',
  r.cls !== 'scavenger' && r.lv1.length === 0 && r.lv2.some(t => /^scrap 3\d\d m$/.test(t)) && r.scav.some(t => /^scrap 3\d\d m$/.test(t)), JSON.stringify(r));

/* ================= 11 · SAVE MIGRATION ================= */
r = await ev(() => {
  /* the valley as it stands, saved; then cut back to the shapes saves had before the economy: v1 (the flat world — no Walker's
     body, no stock) and v2 (the character layer — still no stock). Each goes in a slot of its own. */
  S.cargo = S.cargo.filter(c => !c.orderId); S.orders.active = []; S.level = Math.max(S.level, 7);
  State.save();
  const cur = JSON.parse(localStorage.getItem('waylight_save_v1'));
  const world = { stations: Object.fromEntries(DATA.stationOrder.map(id => [id, { connected: cur.stations[id].connected, litT: cur.stations[id].litT, likesTo: cur.stations[id].likesTo, stars: cur.stations[id].stars, storage: [] }])), roads: cur.roads, structures: cur.structures.filter(s => !s.echo).map(s => ({ id: s.id, type: s.type, x: s.x, y: s.y, ang: s.ang, hp: s.hp, by: s.by, likes: s.likes || 0 })), likes: cur.likes, level: cur.level, banked: { metal: cur.banked.metal, ceramic: cur.banked.ceramic, lumen: cur.banked.lumen } };
  const base = { seed: cur.seed, time: cur.time, playtime: cur.playtime || 0, savedAt: Date.now(), px: cur.px, py: cur.py, vx: 0, vy: 0, dir: 0, speed: 0, stam: 100, stamMax: 100, capBase: 60, state: 'walk', cargo: [], ...JSON.parse(JSON.stringify(world)), zipLinks: [], zipSel: 0, orders: { avail: {}, active: [], done: {}, prioIdx: cur.orders.prioIdx, prioAccepted: false }, weather: { state: 'clear', t: 200, intensity: 0 }, wraiths: [], flareCd: 0,
    camps: Object.fromEntries(DATA.camps.map(c => [c.id, { pacified: !!cur.camps[c.id].pacified, alert: 0, stash: [], runners: [] }])), nodes: cur.nodes, lost: cur.lost, snags: [], drops: [], mails: [], echoSpawned: {}, likedEchoes: {}, flags: { tut: {}, unlocks: { ...cur.flags.unlocks }, effects: {}, finale: false, sessionEcho: 0 }, stats: { delivered: 40, distance: 52000, built: 3, likesEarned: cur.likes, stumbles: 0, steadies: 0, escapes: 0, paved: 3 }, cov: cur.cov };
  const v1 = { v: 1, ...base, gear: { flares: 2, frame1: true, tarp: true }, cargo: [{ id: 90001, defId: 'food', name: 'Rations', kg: 12, cond: 100, fragile: false, cat: 'goods', orderId: null }] };
  const v2 = { v: 2, ...JSON.parse(JSON.stringify(base)), gear: { flares: 1 }, pName: 'Ada Vell', pClass: 'rigger', pTraits: [], pSeed: 777, pLine: 'walked it twice', skills: cur.skills, health: 80, food: 70, warmth: 90, bleeding: false, bruisedT: 0, foodZeroT: 0, buffs: {}, manuals: {}, equip: cur.equip, journal: { name: 'Ada Vell', xp: {} }, pStats: { deliveries: 12, km: 9000, likes: 300, bornAt: Date.now() }, dead: false, graves: [], npcs: [], ruins: cur.ruins, legacy: [], echoRoster: [], compPos: { x: cur.px, y: cur.py }, event: null, eventCd: 60, surgeT: 0, stormT: 0, poolT: 10, horse: { loaner: false, rentedUntil: 0, on: false, spookT: 0 } };
  v2.banked.provisions = 20; v2.skills.rig.lv = 3;
  localStorage.setItem('waylight_save_v1_s2', JSON.stringify(v1));
  localStorage.setItem('waylight_save_v1_s3', JSON.stringify(v2));
  window.__world = world;
  return { v1keys: Object.keys(v1).length, stock: 'stock' in v1.stations.haven || 'stock' in v2.stations.haven, lit: DATA.stationOrder.filter(id => world.stations[id].connected) };
});
const saves = r;
/* to the title; the second valley's plate, and CONTINUE — the briefing and the new Walker's form, by real clicks */
await ev(() => { WL.timeScale = 1; WL.leaveWorld(); });
await page.waitForTimeout(500);
await page.click('#slotRow [data-slot="2"]'); await page.waitForTimeout(500);
await page.click('#btnContinue'); await page.waitForTimeout(500);
const brief1 = await ev(() => !document.getElementById('briefOv').classList.contains('hidden'));
await page.click('#briefGo'); await page.waitForTimeout(400);
const cg1 = await ev(() => !document.getElementById('chargen').classList.contains('hidden'));
await page.click('#cgBegin'); await page.waitForTimeout(900);
r = await ev(() => {
  const W = __world, st = S.stations;
  const same = { stations: DATA.stationOrder.every(id => st[id].connected === W.stations[id].connected && st[id].stars === W.stations[id].stars && st[id].likesTo === W.stations[id].likesTo), roads: JSON.stringify(S.roads) === JSON.stringify(W.roads), structures: JSON.stringify(S.structures.filter(s => !s.echo).map(s => s.type + '@' + Math.round(s.x))) === JSON.stringify(W.structures.map(s => s.type + '@' + Math.round(s.x))), bank: ['metal', 'ceramic', 'lumen'].every(k => S.banked[k] === W.banked[k]), likes: S.likes === W.likes && S.level === W.level };
  const stocked = DATA.stationOrder.every(id => DATA.stations[id].needs.every(g => typeof st[id].stock[g] === 'number' && st[id].stock[g] >= 0 && st[id].stock[g] <= 100 && st[id].mood[g]));
  const bonus = Math.min(5, Math.floor(W.level / 2));
  return { v: S.v, playing: WL.playing && document.getElementById('titleScreen').classList.contains('hidden') && !document.getElementById('hud').classList.contains('hidden'), same, stocked, opening: Math.round(st.elm.stock.meds), founder: S.mails.some(m => m.subj === 'The valley changed while you walked'), roads: __toasts.some(t => /takes up the Founder's roads\. \d seasons of walking live in your legs already\./.test(t)), end: S.skills.end.lv, haul: S.skills.haul.lv, bonus, cls: S.pClass, pack: S.equip.pack.defId, coat: S.equip.coat.defId, cargo: S.cargo.map(c => c.defId), prov: S.banked.provisions, chargen: !!S.flags.needsChargen };
});
ok('A V1 SAVE MIGRATES (v3.35: continued from its own valley\'s plate on the title): a save from before the character layer and the economy (v1 — the flat world, no Walker\'s body, no stock) continued by real clicks walks through the briefing and the new Walker\'s form into the same valley — every station\'s wire, stars and likes, the roads, the structures, the bank, the trust and level exactly as saved; the old porter\'s frame and tarp come forward as the Exo frame and the waxed coat, the crate on the back with them; the Founder\'s seasons live on in Endurance and Hauling; and every town\'s shelves are stocked for the economy the save never had',
  brief1 && cg1 && r.v === 3 && r.playing && Object.values(r.same).every(Boolean) && r.stocked && r.opening === 8 && r.founder && r.roads && r.bonus === 3 && r.end >= r.bonus && r.haul >= r.bonus && r.pack === 'pack_exo1' && r.coat === 'coat_wax' && r.cargo.includes('food') && r.prov === 12 && !r.chargen, JSON.stringify({ brief1, cg1, ...r }));

await ev(() => { WL.leaveWorld(); });
await page.waitForTimeout(500);
await page.click('#slotRow [data-slot="3"]'); await page.waitForTimeout(500);
await page.click('#btnContinue'); await page.waitForTimeout(900);
r = await ev(() => {
  const W = __world, st = S.stations;
  const same = { stations: DATA.stationOrder.every(id => st[id].connected === W.stations[id].connected && st[id].stars === W.stations[id].stars && st[id].likesTo === W.stations[id].likesTo), roads: JSON.stringify(S.roads) === JSON.stringify(W.roads), structures: S.structures.filter(s => !s.echo).length === W.structures.length, bank: ['metal', 'ceramic', 'lumen'].every(k => S.banked[k] === W.banked[k]) && S.banked.provisions === 20, likes: S.likes === W.likes };
  const stocked = DATA.stationOrder.every(id => DATA.stations[id].needs.every(g => typeof st[id].stock[g] === 'number' && st[id].mood[g]));
  return { v: S.v, playing: WL.playing && document.getElementById('titleScreen').classList.contains('hidden'), same, stocked, walker: [S.pName, S.pClass, S.skills.rig.lv, Math.round(S.health)], welcome: __toasts.some(t => /Welcome back, Ada Vell\./.test(t)), board: Systems.boardFor('haven').filter(b => !b.prio && !b.def.service).length, bak: !!localStorage.getItem('waylight_save_v1_s3_bak') };
});
ok('A V2 SAVE MIGRATES (v3.35: from its own valley\'s plate): a save from the character layer, before the economy (v2 — the Walker\'s body and skills, no stock) continues straight into the same valley — Ada Vell, the Rigger, her Rigging 3 and her wounds as saved ("Welcome back"), the stations, roads, structures, bank and trust intact — the shelves stocked where the save had none, so the boards post from the first look; and the save as it stood is kept whole in the backup slot before a byte was read',
  r.v === 3 && r.playing && Object.values(r.same).every(Boolean) && r.stocked && JSON.stringify(r.walker) === '["Ada Vell","rigger",3,80]' && r.welcome && r.board > 0 && r.bak, JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
console.log(`economy: ${((Date.now() - t0) / 1000).toFixed(1)} s after boot`);
await T.finish('the needs economy');
