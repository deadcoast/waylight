/* standing.mjs — v3.40 THE STANDING GROUND (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). What it proves: THE LETTERS — the post's own tree marks the round
   (a runner marked for letters fills the town's bag at twice the pace, struck it does not; a parcels round packs the town's
   own every second shift, three at most, idle with the mark struck; the board posts the run and a delivered parcel is the
   Order's service); THE WEDGE ON THE COMPASS — the backs on a rear rail under the strip (dim in the slot, bright out of it on
   their own side, a back ahead on the marks' row; the card put away leaves them); THE SQUARE RISES — a garrison is
   restless when the town hates it under two shields or fewer, rolls once a night and rises (the mail, the relation, the
   stone, the lesson), REINFORCE to four; THE STORM, SEEN — with the walker in the ring the knives walk for the fire (the
   shields' knock and its cadence, the party's intercept, the shove or the cut, the rifle), held in the open or lost at the
   fire; THE SOCIETY'S WAR — once the cold door is open the northernmost camp standing is counted (its stash gone north, its
   ring ×0.7, the stencil and the plate), and the next one south after it; the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const drain = async () => { await ev(() => { WL.timeScale = 1; }); await T.drain(); await ev(() => { WL.timeScale = 0.001; }); };   // the screen's titles run on the clock
await ev(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources();
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  window.__titles = []; const ct = Render.crtTitle; Render.crtTitle = (a, b) => { __titles.push(a + ' — ' + b); return ct(a, b); };
  window.__die = (v, fn) => { const r0 = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = r0; } };
  window.__at = f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; };
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const TR = MUSTER.TREES.post, P = DATA.items.parcel, T2 = DATA.T;
  const tree = TR.name === 'THE LETTERS' && TR.root === 'post' && TR.def.post === true && MUSTER.POST.tree === 'post' && Object.keys(MUSTER.TREES).length === 4;
  const parcel = P.kg === 4 && P.fragile && P.service && Ledger.classify('parcel') === Ledger.classify('letters') && T2.bagRunner >= T2.bagFill && T2.parcelEvery === 2 && T2.parcelCap === 3 && !!CHAR.JOBS.runner && !!CHAR.JOBS.parcels;
  const R = REP.DOCTRINE.storm.rise, rise = R.likesAt === 5 && R.thinAt === 2 && R.chance === 0.3 && R.at === 0.7 && R.reinforceCost.metal === 40 && R.reinforceCost.provisions === 10 && R.garrisonMax === 4;
  const K = REP.WATCHPOST.storm.seen, seen = K.dur === 26 && K.knifeSpeed === 92 && K.fireR === 26 && K.takeAfter === 3.5 && K.shieldCd === 4.5 && K.shieldReach === 80 && K.knockBack === 130 && K.downFor === 7 && K.shoveDmg === 5;
  const E = REP.EVENTS.bunkerSweep, sweep = E.actor === 'diefenbunker' && E.victim === 'raiders' && E.kind === 'strike' && E.night && E.needs === 'campForTheSociety' && E.cd === 900 && E.chance === 0.4 && E.sweptDur === 480 && E.claimMul === 0.7 && REP.RELATIONS.base['diefenbunker|raiders'] !== undefined && Object.keys(REP.EVENTS).length >= 8;
  const lessons = ['firstLetters', 'firstSquare', 'firstStormSeen'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]), lessonsN = Object.keys(DATA.tutorials).length;
  return { tree, parcel, rise, seen, sweep, lessons, lessonsN };
});
ok('THE REGISTRIES: THE LETTERS is the fourth tree on the one policy store (root post, seeded on); parcels are the third kind of post (4 kg, fragile, a service good filed under the post with the letters), the runner\'s pen and the parcels round\'s every-second-shift, three to a run; the square\'s rising row (five likes, two shields, 0.3 once a night at 0.7, REINFORCE at 40 metal and 10 provisions up to four); the storm seen (26 s, the knives at 92 for the fire, 3.5 s at it takes the post, the shields every 4.5 s ÷ shields within 80 — back 130, down 7 — the cut for five); the Society\'s war the eighth row on the v3.34 law (night, 0.4 every fifteen minutes, counted eight minutes, the ring ×0.7) on a pair the ledger held; three lessons (v3.49: the manual at 93 pages)',
  Object.values(r).every(v => v === true || v >= 93) && r.lessonsN >= 93, JSON.stringify(r));

/* ================= 2 · THE LETTERS ================= */
r = await ev(() => {
  const H = 'haven', st = S.stations[H];
  /* a runner on Haven's post: the bag at twice the pace only while the round is marked for letters */
  const n = NPC.gen({ at: H }); S.npcs.push(n); NPC.assignPost(n, H, 'runner');
  const fill = () => { st.bag = 10; Economy.update(5); return st.bag - 10; };
  const marked = fill();
  NPC.setTreeMark(n, 'post', 'letters', false, true);
  const struck = fill(), allowsNow = NPC.allows(n, 'post', 'letters');
  NPC.setTreeMark(n, 'post', 'letters', true, true);
  const back = fill();
  n.state = 'pool'; n.job = null;
  /* a parcels round at the Mill: a parcel packed every second shift, three at most */
  const M = 'mill', sm = S.stations[M]; sm.parcels = [];
  const p = NPC.gen({ at: M }); S.npcs.push(p); NPC.assignPost(p, M, 'parcels');
  const shift = () => { p.shiftT = 0.001; NPC.update(0.01); return Economy.parcelsOf(M).length; };
  const s1 = shift(), s2 = shift(), note = NPC.svc(p).last, lesson = !!S.flags.tut.firstLetters;
  const counts = [s1, s2]; for (let i = 0; i < 6; i++) counts.push(shift());
  const shelf = Economy.parcelsOf(M).slice();
  const addressed = shelf.every(pc => pc.to !== M && S.stations[pc.to].connected && DATA.parcelKinds.some(k => k.id === pc.kind && k.name === pc.name));
  /* struck, the round packs nothing */
  sm.parcels = shelf.slice(0, 1); NPC.setTreeMark(p, 'post', 'parcel', false, true);
  const pk0 = NPC.svc(p).packing; shift(); shift();
  const idle = Economy.parcelsOf(M).length === 1 && NPC.svc(p).packing === pk0;
  NPC.setTreeMark(p, 'post', 'parcel', true, true); sm.parcels = shelf;
  /* the orders pane shows the tree with its kinds */
  MusterUI.open(p.id); const pane = document.getElementById('musterOv').textContent;
  const paneTree = /THE LETTERS/.test(pane); MusterUI.close();
  window.__pc = { p: p.id };
  return { marked: +marked.toFixed(3), struck: +struck.toFixed(3), back: +back.toFixed(3), allowsNow, counts, note, lesson, shelf: shelf.map(x => x.to + ':' + x.kind), addressed, idle, paneTree };
});
const lt1 = r;
r = await ev(() => {
  const M = 'mill', shelf = Economy.parcelsOf(M), doors = [...new Set(shelf.map(pc => pc.to))];
  const runs = (Economy.ordersFor(M) || []).filter(o => o.item === 'parcel' && !o.errand);
  /* v3.41: the parcels addressed — one run per door the shelf names, carrying what is addressed there */
  const posted = runs.length === doors.length && runs.every(o => o.id === `pc_${M}_${o.to}` && o.service && o.likesMul === 0 && o.n === shelf.filter(pc => pc.to === o.to).length && o.tier === Economy.mailTier(M, o.to));
  const o = runs[0]; if (!o) return { posted };
  WL.tp(M); Systems.acceptOrder(o, false);
  const accepted = !!S.orders.active.find(x => x.id === o.id) && Economy.parcelsOf(M).every(pc => pc.to !== o.to) && !(Economy.ordersFor(M) || []).some(x => x.id === o.id);
  const carried = S.cargo.filter(c => c.parcel && c.parcel.to === o.to).length === o.n;
  const likes0 = S.likes, sl0 = S.stations[o.to].likesTo, appr0 = S.stations[o.to].appr || 0;
  WL.tp(o.to); WL.instantPar();
  const res = Systems.handleDelivery(o.to).results.find(x => x.order && x.order.id === o.id);
  const service = !!res && res.service && res.likes === 0 && S.likes === likes0 && S.stations[o.to].likesTo === sl0 && (S.stations[o.to].appr || 0) > appr0 && res.tier === o.tier && !res.needMood;
  return { doors, posted, accepted, carried, service, grade: res && res.grade };
});
ok('THE LETTERS: a runner on the post marked for letters fills the town\'s bag at twice the pace (and more), struck the pen slows to the town\'s own, marked again it runs; a parcels round packs nothing on its first shift and a parcel on its second — the round\'s last word on the plate is the packing, the lesson — and never more than three on the shelf; struck, the round packs nothing; the orders pane carries THE LETTERS; the board posts the run (v3.41: the parcels addressed — one run per door the shelf names, each carrying what is addressed there, at the post\'s tier); accepted, what went on the pack leaves the shelf and is not reposted; delivered it is the Order\'s service — no fee, no likes, thanked by the tier, no need line',
  lt1.marked >= 2 * lt1.struck && lt1.struck > 0 && lt1.back === lt1.marked && lt1.allowsNow === false && lt1.counts[0] === 0 && lt1.counts[1] === 1 && Math.max(...lt1.counts) === 3 && lt1.counts[lt1.counts.length - 1] === 3 && /^packed .+ for .+ — \d waits? for a run$/.test(lt1.note) && lt1.lesson && lt1.addressed && lt1.idle && lt1.paneTree && r.posted && r.accepted && r.carried && r.service,
  JSON.stringify(lt1) + ' ' + JSON.stringify(r));

/* ================= 3 · THE WEDGE ON THE COMPASS ================= */
r = await ev(async () => {
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  WL.tp([DATA.stations.haven.x + 600, DATA.stations.haven.y - 300]); S.dir = 0;   // facing east: behind is west, your left is north
  const a = NPC.gen({ at: 'haven' }), b = NPC.gen({ at: 'haven' }); S.npcs.push(a, b); NPC.hire(a, 'companion'); NPC.hire(b, 'companion');
  const slots = MUSTER.STATIONS.wedge, put = (n, i) => { const [bk, sd] = slots[i]; n.cx = S.px + bk; n.cy = S.py + sd; };   // facing east, the slot is (back, side) from you
  put(a, 0); put(b, 1);
  const read = () => { for (let i = 0; i < 90; i++) UI.tick(); const wpx = document.getElementById('compass').clientWidth; return { wpx, pips: [...document.querySelectorAll('#compassInner .cBack')].map(el => ({ id: el.dataset.npc, x: parseFloat(el.style.left), off: el.classList.contains('off'), fore: el.classList.contains('fore'), name: el.textContent, op: getComputedStyle(el).opacity })) }; };
  const inSlot = read();
  const mid = inSlot.pips.length === 2 && inSlot.pips.every(p => !p.off && !p.fore && Math.abs(p.x - inSlot.wpx / 2) < inSlot.wpx * 0.25 && +p.op < 1) && inSlot.pips.some(p => p.name === a.name.split(' ')[0]);
  /* one falls out to your left — bright, on its own side of the rail */
  b.cx = S.px - 70; b.cy = S.py - 150;
  const out = read(), pb = out.pips.find(p => p.id === String(b.id)), pa = out.pips.find(p => p.id === String(a.id));
  const bright = !!pb && pb.off && +pb.op === 1 && pb.x < out.wpx / 2 && !pa.off;
  /* one ahead of you rides the marks' row */
  b.cx = S.px + 160; b.cy = S.py + 20;
  const ahead = read(), pf = ahead.pips.find(p => p.id === String(b.id));
  const fore = !!pf && pf.fore;
  /* the party card put away: the pips stay */
  UI2.toggleWedge(false); const hidden = !UI2.wedgeShown(); const card = read();
  const stay = hidden && card.pips.length === 2 && document.getElementById('compChip').classList.contains('hidden');
  UI2.toggleWedge(true);
  /* dismissed, the pips go */
  NPC.dismiss(a); NPC.dismiss(b); const gone = read().pips.length === 0;
  return { mid, bright, fore, stay, gone, inSlot: inSlot.pips.map(p => [Math.round(p.x), p.op]), out: pb && [Math.round(pb.x), pb.off, pb.op], wpx: inSlot.wpx };
});
ok('THE WEDGE ON THE COMPASS: two backs in their wedge slots ride the rear rail under the strip inside its visible middle (straight behind is the centre), dim, each with a first name; one fallen more than a stride out of the wedge to your left goes BRIGHT, left of the centre (a glass over your shoulder); a back ahead of you rides the marks\' row; the party card put away (v3.49: the Party card) leaves the pips on the strip; the party dismissed, the pips go',
  r.mid && r.bright && r.fore && r.stay && r.gone, JSON.stringify(r));

/* ================= 4 · THE SQUARE RISES ================= */
r = await ev(() => {
  const M = 'mill', st = S.stations[M];
  S.rep.held[M] = { t0: S.time, from: M, tithe: 0, shields: 2, riseDay: -1 };
  st.likesTo = 15;
  const calm = !Republic.squareRestless(M);
  RepublicUI.open(); window.__bankR = { metal: S.banked.metal, provisions: S.banked.provisions };
  return { calm };
});
const sq0 = r;
await page.click('#repBody [data-reinforce="mill"]'); await page.waitForTimeout(200);
r = await ev(() => ({ three: Republic.held().mill.shields === 3 && S.banked.metal === __bankR.metal - 40 && S.banked.provisions === __bankR.provisions - 10 && /3\/4<\/b> shields under the pennant/.test(document.getElementById('repBody').innerHTML) }));
const sq1 = r;
/* the world draws as many shields as the square stands: the fourth at the yard's far flank */
await drain();
const drawn = await ev(async () => {
  const d = DATA.stations.mill; __at(0.3);
  WL.tp([d.x + 190, d.y + 190]); S.weather.state = 'clear'; __clearAmb(d.x, d.y, 360); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = d.x; Render.cam.y = d.y + 10;
  await __wait(250); await __frames(3);
  const a = __grab(d.x + 96, d.y + 22 - 30, 60); S.rep.held.mill.shields = 4; await __wait(120); await __frames(3);
  const b = __grab(d.x + 96, d.y + 22 - 30, 60); S.rep.held.mill.shields = 3; __done(); WL.timeScale = 0.001;
  return __diff(a, b);
});
await ev(() => { RepublicUI.open(); });
await page.click('#repBody [data-reinforce="mill"]'); await page.waitForTimeout(200);
r = await ev(() => {
  const M = 'mill', h = Republic.held()[M], st = S.stations[M], btn = document.querySelector('#repBody [data-reinforce="mill"]'), m0 = S.banked.metal;
  const four = h.shields === 4 && btn.disabled && /4\/4<\/b> shields under the pennant/.test(document.getElementById('repBody').innerHTML);
  const refused = Republic.reinforce(M) === false && h.shields === 4 && S.banked.metal === m0;
  /* under more than two the square will not rise, however it hates */
  st.likesTo = 3; const strong = !Republic.squareRestless(M);
  h.shields = 2; const restless = Republic.squareRestless(M);
  RepublicUI.render(); const warn = /THE SQUARE IS RESTLESS/.test(document.getElementById('repBody').textContent);
  RepublicUI.close();
  /* the night's roll: missed, and the square stands that night whatever the die says after */
  __at(0.75); const day = Math.floor(S.time / DATA.T.dayLen);
  __die(0.9, () => Republic.tick(0.5));
  const missed = Republic.isHeld(M) && h.riseDay === day;
  __die(0.01, () => Republic.tick(0.5));
  const once = Republic.isHeld(M);
  /* the next night it is made: the square rises */
  S.time += DATA.T.dayLen; S.mails.length = 0; __titles.length = 0;
  const fr0 = Republic.rel('farkeep', 'rebels'), leg0 = S.legacy.length;
  __die(0.01, () => Republic.tick(0.5));
  const rose = !Republic.isHeld(M) && Republic.isUnlit(M) && !st.connected && Republic.rel('farkeep', 'rebels') === fr0 - 1 && S.mails.some(m => m.subj === 'The Mill: the square rose' && /under 2 shields/.test(m.body)) && !!S.flags.tut.firstSquare && __titles.some(t => /^THE SQUARE ROSE — THE MILL THREW THE GARRISON OUT$/i.test(t))
    && S.legacy.length === leg0 + 1 && S.legacy[S.legacy.length - 1].fate === 'fell when the square rose at The Mill' && S.legacy[S.legacy.length - 1].cls === 'Farkeeper Shield';
  /* a loved thin garrison stands; the verb by hand */
  const G = 'green'; S.rep.held[G] = { t0: S.time, from: G, tithe: 0, shields: 2, riseDay: -1 }; S.stations[G].likesTo = 30;
  S.time += DATA.T.dayLen; __die(0.01, () => Republic.tick(0.5));
  const loved = Republic.isHeld(G) && !Republic.squareRestless(G);
  const byHand = Republic.squareRises(G) === true && !Republic.isHeld(G) && Republic.isUnlit(G);
  /* the valley tidied: the two towns lit again */
  for (const id of [M, G]) { delete S.rep.unlit[id]; S.stations[id].connected = true; S.stations[id].litT = 1; }
  State.refreshSources(); __at(0.3);
  return { four, refused, strong, restless, warn, missed, once, rose, loved, byHand };
});
ok('THE SQUARE RISES: a garrisoned town at fifteen likes is not restless; a real click on REINFORCE THE GARRISON puts a third shield in the square (40 metal, 10 provisions; the sheet 3/4) — and the world draws as many as the square stands (the fourth at the yard\'s flank, pixel-sampled against the same frame at three); a fourth, and the button goes dark at the most, the verb by hand refused; at three likes under more than two it will not rise — under two it is RESTLESS (the sheet warns THE SQUARE IS RESTLESS); the night\'s roll missed, the square stands the rest of that night whatever the die says (once a night); the next night it RISES: the garrison thrown out, the lamp the Unlit\'s by choice, Farkeep and the Unlit a step colder, a Farkeeper stone (fell when the square rose), THE SQUARE ROSE, the mail, the lesson; a loved thin garrison stands; the verb by hand rises it',
  sq0.calm && sq1.three && drawn > 60 && r.four && r.refused && r.strong && r.restless && r.warn && r.missed && r.once && r.rose && r.loved && r.byHand, JSON.stringify(sq0) + ' ' + JSON.stringify(sq1) + ' fourth=' + drawn + ' ' + JSON.stringify(r));

/* ================= 5 · THE STORM, SEEN ================= */
await drain();
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge;
  c.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 2, stormDay: -1 }; c.pacified = true; c.runners = []; c.storm = null; c.lost = null;
  S.rep.reprisal = { t: 400, dur: 420, camp: 'ridge' };
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  S.cargo = S.cargo.filter(x => x.cat === 'tool'); S.health = 100;
  WL.tp([cd.x + 110, cd.y + 70]);
  __at(0.75); __titles.length = 0; document.getElementById('toasts').innerHTML = '';
  __die(0.01, () => Republic.tick(0.5));
  const s2 = c.storm; if (!s2) return { started: false };
  const edge = s2.knives.length === 3 && s2.knives.every(k => Math.abs(U.dist(k.x, k.y, cd.x, cd.y) - cd.r * 0.95) < 2) && s2.dur === 26;
  const title = __titles.some(t => t === 'THE STORM — Ridge Camp — the knives come for the fire'), lesson = !!S.flags.tut.firstStormSeen;
  const toast = /THE KNIVES COME FOR RIDGE CAMP/.test(document.getElementById('toasts').textContent);
  RepublicUI.open(); const sheet = /THE KNIVES ARE AT THE FIRE — \d+s to hold; you stand the post/.test(document.getElementById('repBody').textContent); RepublicUI.close();
  /* v3.41: the camps send their own by trade — the v3.40 knives are staged here as three plain knives */
  for (const k of s2.knives) { k.cls = 'knife'; k.cd = 0; k.downs = 0; k.atFire = 0; }
  /* the walk: for the FIRE at 92 a second, not for you */
  const k0 = s2.knives[0], x0 = k0.x, y0 = k0.y, d0 = U.dist(x0, y0, cd.x, cd.y), dw0 = U.dist(x0, y0, S.px, S.py);
  s2.shieldT = 99; Republic.tick(0.1);
  const step = U.dist(x0, y0, k0.x, k0.y), towardFire = d0 - U.dist(k0.x, k0.y, cd.x, cd.y);
  const walk = Math.abs(step - 9.2) < 0.05 && Math.abs(towardFire - 9.2) < 0.05;
  const rifleEye = Republic.stormKnives().length === 3;
  return { started: true, edge, title, lesson, toast, sheet, walk, step: +step.toFixed(2), rifleEye };
});
const sn1 = r;
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge, s2 = c.storm, K = REP.WATCHPOST.storm.seen;
  /* the shields' knock: the nearest knife at the fire's edge, back 130 and down 7 — in turn, every 4.5 s ÷ shields */
  s2.knives.forEach((k, i) => { const a = i * 2.1; k.x = cd.x + Math.cos(a) * (60 + i * 6); k.y = cd.y + Math.sin(a) * (60 + i * 6); k.cd = 0; k.atFire = 0; });
  const near = s2.knives[0], nd0 = U.dist(near.x, near.y, cd.x, cd.y);
  s2.shieldT = 0.001; Republic.tick(0.01);
  const knock = near.cd === K.downFor && Math.abs(U.dist(near.x, near.y, cd.x, cd.y) - (nd0 + K.knockBack)) < 1 && near.downs === 1 && near.felledBy === 'shield' && Math.abs(s2.shieldT - K.shieldCd / 2) < 0.02;
  let t = 0, next = null; const downs = () => s2.knives.reduce((a, k) => a + k.downs, 0);
  for (let i = 0; i < 40 && next === null; i++) { Republic.tick(0.1); t += 0.1; if (downs() > 1) next = +t.toFixed(2); }
  const cadence = next !== null && Math.abs(next - K.shieldCd / 2) <= 0.15;
  c.taken.shields = 3; s2.shieldT = 0.001; Republic.tick(0.01); const three = Math.abs(s2.shieldT - K.shieldCd / 3) < 0.02; c.taken.shields = 2;
  /* the party meets what comes inside its reach — the same intercept every runner meets */
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); NPC.hire(n, 'companion'); n.hungry = false; n.shoveCd = 0;
  n.cx = S.px + 10; n.cy = S.py + 10;
  const kI = s2.knives[1]; kI.cd = 0; kI.x = n.cx + 100; kI.y = n.cy; kI.atFire = 0; s2.shieldT = 99;
  const met0 = NPC.svc(n).met || 0;
  Republic.tick(0.02);
  const intercept = kI.cd > 0 && kI.felledBy === 'back' && kI.downs >= 1 && U.dist(kI.x, kI.y, n.cx, n.cy) > 250 && (NPC.svc(n).met || 0) === met0 + 1;
  /* a knife at your pack: shoved by a free hand (the back out of reach of him), or it CUTS for five */
  n.shoveCd = 0; n.cx = S.px - 400; n.cy = S.py; const kS = s2.knives[2]; kS.cd = 0; kS.x = S.px + 10; kS.y = S.py; kS.atFire = 0;
  Republic.tick(0.02);
  const shove = Math.abs(kS.cd - K.downFor * 0.8) < 0.05 && kS.felledBy === 'walker' && n.shoveCd > 0;
  kS.cd = 0; kS.x = S.px + 10; kS.y = S.py; S.health = 100;
  Republic.tick(0.02);
  const cut = S.health === 100 - K.shoveDmg && Math.abs(kS.cd - 3) < 0.05;
  /* the rifle counts every knife on its feet */
  for (const k of s2.knives) k.cd = 5; const kR = s2.knives[1]; kR.cd = 0; kR.x = S.px + 200; kR.y = S.py;
  S.gear.rifle = true; S.gear.ammo338 = 3; S.rifleCd = 0;
  Systems.rifleFire();
  const rifle = kR.cd > 20 && kR.felledBy === 'walker' && S.gear.ammo338 === 2 && !!Exile.rifleDef() && Exile.rifleDef() === FACT.RIFLES[S.gear.rifleTier || 'c14'];
  window.__sn = { n: n.id };
  return { knock, next, cadence, three, intercept, shove, cut, rifle };
});
const sn2 = r;
/* seen: a knocked knife lies DOWN where it fell, the storm's clock over the fire */
const snSeen = await ev(async () => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), s2 = S.camps.ridge.storm, k = s2.knives[0];
  k.cd = 6; k.x = cd.x + 40; k.y = cd.y + 30; __clearAmb(cd.x, cd.y, 400); Render.clearFx(); Render.setFx(false); Render.setZoom(2); Render.cam.x = cd.x; Render.cam.y = cd.y; await __wait(200); await __frames(3);
  const labels = Render.labelBoxes().map(b => b.str);
  Render.setZoom(null); Render.setFx(true);
  return { down: labels.includes('DOWN'), clock: labels.some(s => /^THE STORM — \d+s TO HOLD$/.test(s)) };
});
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge, s2 = c.storm;
  /* held in the open: the storm spends itself — the mail counting the knocks */
  for (const k of s2.knives) { k.atFire = 0; k.cd = 5; }
  const knocks = s2.knives.reduce((a, k) => a + k.downs, 0);
  S.mails.length = 0; __titles.length = 0; s2.t = s2.dur - 0.005;
  Republic.tick(0.01);
  const held = !c.storm && !!c.taken && S.mails.some(m => m.subj === 'Ridge Camp: the post HELD — you stood it' && new RegExp(`knocked down ${knocks} time`).test(m.body)) && __titles.some(t => /^THE POST HELD — Ridge Camp — the storm spent itself/.test(t));
  /* lost at the fire: another night, a knife that stands at the fire long enough takes the post while you watch */
  const n = S.npcs.find(x => x.id === __sn.n); if (n) { n.state = 'pool'; n.at = 'haven'; }
  Republic.stormPost(cd);
  const s3 = c.storm; if (!s3) return { held, knocks, lost: false };
  for (const k of s3.knives) { k.cls = 'knife'; k.cd = 9; }
  const kf = s3.knives[0]; kf.cd = 0; kf.x = cd.x + 10; kf.y = cd.y; kf.atFire = 3.4; s3.shieldT = 99;
  S.mails.length = 0;
  Republic.tick(0.2);
  const lost = !c.taken && !c.storm && !!c.lost && S.mails.some(m => m.subj === 'Ridge Camp: the watchpost FELL' && /while you stood the post/.test(m.body) && /stood at the fire long enough/.test(m.body));
  WL.tp('haven'); __at(0.3); S.health = 100;
  return { held, knocks, lost };
});
ok('THE STORM, SEEN: the season\'s night with the walker in the ring is not rolled — the storm starts on the ground: three knives stand up at the ring\'s edge (the title THE STORM, the lesson, the toast, the sheet\'s THE KNIVES ARE AT THE FIRE); they WALK for the fire at 92 a second, not for you (v3.41: the camps\' own by trade — the knives staged as plain knives); the shields knock the nearest at the fire\'s edge back 130 and down 7, in turn on a cadence of 4.5 s ÷ shields (the next knock at 2.25 s with two, 1.5 s with three); the party\'s intercept meets a knife inside its reach; a knife at your pack is shoved by a free hand, or CUTS for five with none; the rifle counts every knife on its feet (the C-series in hand); a knocked knife LIES where it fell (DOWN on the ground, the storm\'s clock over the fire); spent at its span, the post is HELD in the open with the mail counting the knocks; on another night a knife that stands at the fire long enough takes the post while you watch — LOST, the mail says you stood it',
  sn1.started && sn1.edge && sn1.title && sn1.lesson && sn1.toast && sn1.sheet && sn1.walk && sn1.rifleEye && sn2.knock && sn2.cadence && sn2.three && sn2.intercept && sn2.shove && sn2.cut && sn2.rifle && snSeen.down && snSeen.clock && r.held && r.lost,
  JSON.stringify(sn1) + ' ' + JSON.stringify(sn2) + ' seen=' + JSON.stringify(snSeen) + ' ' + JSON.stringify(r));

/* ================= 6 · THE SOCIETY'S WAR ================= */
r = await ev(() => {
  const E = REP.EVENTS.bunkerSweep;
  for (const cd of DATA.camps) { const c = S.camps[cd.id]; c.taken = null; c.pacified = false; c.swept = 0; c.sold = 0; c.stash = [State.makeItem('metal')]; }
  const fire = () => { for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999; S.rep.evCd.bunkerSweep = 0; __at(0.75); __die(0.01, () => Republic.tick(0.5)); };
  S.exile = S.exile || {}; const door0 = S.exile.door; S.exile.door = 'sealed';
  fire();
  const shut = DATA.camps.every(cd => !S.camps[cd.id].swept);
  S.exile.door = 'opened';
  const north = DATA.camps.slice().sort((a, b) => a.y - b.y);
  const rb0 = Republic.rel('diefenbunker', 'raiders'); S.mails.length = 0; document.getElementById('toasts').innerHTML = '';
  fire();
  const A = north[0], cA = S.camps[A.id];
  const counted = !!cA.swept && !cA.stash.length && Republic.sweptMul(A) === E.claimMul && Republic.rel('diefenbunker', 'raiders') === rb0 - 1 && S.mails.some(m => m.subj === 'The Society swept a camp' && m.body.includes(A.name)) && /The Society swept/.test(document.getElementById('toasts').textContent)
    && DATA.camps.filter(cd => S.camps[cd.id].swept).length === 1 && S.camps[north[1].id].stash.length === 1;
  RepublicUI.open(); const plate = new RegExp(`${A.name}.*COUNTED BY THE SOCIETY · \\d+s`).test(document.getElementById('repBody').textContent); RepublicUI.close();
  fire();
  const B = north[1], south = !!S.camps[B.id].swept && !S.camps[B.id].stash.length && !S.camps[north[2].id].swept && Republic.sweptMul(B) === E.claimMul && Republic.sweptMul(north[2]) === 1;
  __at(0.3);
  return { shut, north: north.map(c => c.id), counted, plate, south, door0: door0 || null };
});
const so1 = r;
const stencil = await ev(async () => {
  const A = DATA.camps.slice().sort((a, b) => a.y - b.y)[0];
  WL.tp([A.x + 160, A.y + 120]); __clearAmb(A.x, A.y, 400); Render.clearFx(); Render.setFx(false); Render.setZoom(2); Render.cam.x = A.x + 50; Render.cam.y = A.y - 30; await __wait(200); await __frames(3);
  const pt = [A.x + 52 + 8, A.y - 30 + 10], a = __grab(pt[0], pt[1], 30), label = Render.labelBoxes().some(b => b.str === 'COUNTED — THE SOCIETY');
  const c = S.camps[A.id], sw = c.swept; c.swept = 0; await __wait(120); await __frames(3); const b = __grab(pt[0], pt[1], 30); c.swept = sw;
  __done(); WL.timeScale = 0.001; WL.tp('haven');
  return { label, stencil: __diff(a, b) };
});
ok('THE SOCIETY\'S WAR: with the cold door shut the Society sweeps nothing; opened, by night it comes down out of the north and COUNTS the northernmost camp that stands — its salvage gone into the cold, its ring ×0.7 for the count, the Society and the raiders a step colder, the mail, the toast; the camp further south keeps its stash; the sheet\'s plate COUNTED BY THE SOCIETY with the count\'s clock; the stencil with the raised tongue on its post and COUNTED — THE SOCIETY on the ground (pixel-sampled against the same frame uncounted); the next night the counted camp is skipped and the next one south is counted',
  so1.shut && so1.counted && so1.plate && so1.south && stencil.label && stencil.stencil > 20, JSON.stringify(so1) + ' ' + JSON.stringify(stencil));

/* ================= 7 · THE SAVE ================= */
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge;
  S.stations.mill.parcels = [{ to: 'elm', kind: 'coat', name: 'a mended coat' }, { to: 'green', kind: 'seed', name: 'a twist of seed' }];
  S.rep.held.green = { t0: S.time, from: 'green', tithe: 30, shields: 3, riseDay: -1 };
  const swA = S.camps.ash.swept;
  c.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 2, stormDay: -1 }; c.pacified = true; c.swept = 0;
  WL.tp([cd.x + 100, cd.y + 60]); Republic.stormPost(cd);
  const midStorm = !!c.storm;
  State.save(); State.load();
  const parcels = Economy.parcelsOf('mill').length === 2 && Economy.parcelsOf('mill')[0].to === 'elm' && Economy.parcelsOf('mill')[1].kind === 'seed';
  const garrison = Republic.isHeld('green') && Republic.held().green.shields === 3;
  const count = S.camps.ash.swept === swA && Republic.sweptMul(DATA.camps.find(x => x.id === 'ash')) === REP.EVENTS.bunkerSweep.claimMul;
  const dropped = midStorm && !S.camps.ridge.storm && !!S.camps.ridge.taken;
  WL.tp('haven');
  return { parcels, garrison, count, dropped };
});
ok('THE SAVE: a town\'s packed parcels (addressed and of their kinds), a garrison\'s shields and the Society\'s count survive a save and load; a storm in progress is dropped like every fight — the post still held, the night not resumed',
  r.parcels && r.garrison && r.count && r.dropped, JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
await T.finish('the standing ground');
