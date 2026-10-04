/* moved.mjs — v3.51 THE ECOSYSTEM PASS: every system reads back into the delivery. THE SURPLUS ON THE BOARD (what the bank
   holds past its reserve is packed as freight where it was made, for the town shortest of it — the bank pays the crates, the
   town pays the walk); WHAT IT MOVED (the Delivery complete slip says what the walk changed besides the pay — the shelf, the
   book, the word on the wire, the light, a road's next stretch, a camp, the bank's surplus); THE STANDINGS IN THE PAY (a
   town pays by its book and by whoever holds its door — on the card, in the grade, in the crates it asks for); THE CAMPS ON
   THE ROUTES (knives whose stone stands beside yours let you through and walk their salvage in; a given ring's fire is a stop
   the Guide takes a hurt Walker to); THE BUS MAP (every window says what it does for your deliveries); the save. */
import { boot } from './lib/harness.mjs';
const T = await boot();
const { page, ev, ok } = T;
await ev(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true);
  S.banked.metal = 40; S.banked.ceramic = 20; S.banked.wood = 20; S.banked.provisions = 20; S.banked.lumen = 5;
  window.__closeAll = () => { for (let i = 0; i < 6 && !document.getElementById('results').classList.contains('hidden'); i++) UI.showNextResult(); document.getElementById('results').classList.add('hidden'); if (UI.curStation) UI.closeStation(); };
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const inPal = (rows, pal, w, h) => rows.length === h && rows.every(rw => rw.length === w) && [...new Set(rows.join('').replace(/\./g, ''))].every(ch => pal[ch]);
  const NEW = ['mv_stock', 'mv_wire', 'mv_road', 'mv_camp', 'mv_word', 'surplus', 'camproute', 'standing'];
  const marks = NEW.every(k => inPal(SPRITES.MARKS[k], SPRITES.MARK_PAL, 7, 7)) && new Set(Object.values(SPRITES.MARKS).map(m => m.join(''))).size === Object.keys(SPRITES.MARKS).length;
  const salvage = inPal(SPRITES.SALVAGE, SPRITES.MARK_PAL, 6, 6);
  const TS = DATA.T.surplus, TD = DATA.T.standing, TR = DATA.T.routes;
  const rows = Object.keys(TS.makes).every(m => TS.floor[m] > 0 && TS.pack[m] > 0 && DATA.goodsInfo[TS.makes[m]]) && TS.max >= 1 && TS.likesMul >= 1
    && TD.min < 1 && TD.max > 1 && TD.kept > TD.heard && TD.broken > TD.kept && TD.extraAt >= 1 && TD.stance > 0
    && TR.every > 0 && TR.stock > 0 && TR.speed > 0 && TR.hurt > 0 && TR.cold > 0 && TR.detour > 1 && TR.goods.every(g => DATA.goodsInfo[g]) && TR.likes >= 0 && DATA.T.mailFarSecs === 60;
  const L = ['firstMoved', 'firstSurplus', 'firstStanding', 'firstCampRoute'], lessons = L.every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]);
  const papers = PAPERS.length === 21 && PAPERS.every(p => p.loop && p.loop.length > 40 && SPRITES.MARKS[p.mark]) && ['results', 'transfer', 'ruin', 'trader', 'tailor', 'build', 'desk', 'roll', 'death'].every(id => PAPERS.some(p => p.id === id));
  const lines = ['pass', 'leave', 'door'].every(k => DATA.routeLines[k].length >= 3);
  return { marks, salvage, rows, lessons, lessonsN: Object.keys(DATA.tutorials).length, papers, lines };
});
ok('THE REGISTRIES: eight new 7×7 marks in the marks\' palette, every mark in the registry distinct (what moved — the shelf, the light, a road, a camp, the word; the bank\'s surplus; a camp on your routes; the standing); the knives\' salvage (6×6) on the same palette; the tuning rows (the reserve, the pack and the good each material makes, the crates a card, the surplus\'s pay; the book\'s weights, its bounds and the crate it earns, a stance\'s step; the salvage walk\'s day, shelf, pace and thanks, the stop\'s hurt, cold and detour) and the long post\'s minute; four lessons with their titles (ninety-seven pages); twenty windows in the index (v3.52: twenty-one, the Paused sheet listed), each saying what it does for your deliveries under a mark; the knives\' words on the routes',
  Object.entries(r).every(([k, v]) => k === 'lessonsN' ? v === 97 : v === true), JSON.stringify(r));

/* ================= 2 · THE SURPLUS ON THE BOARD ================= */
r = await ev(async () => {
  const TS = DATA.T.surplus;
  S.stations.relay.stock.parts = 20; S.stations.relay.mood.parts = 'wanting';
  S.banked.metal = TS.floor.metal - 5; S.eco.madeAt = { metal: 'mill' };
  const none = Economy.surplusOf('metal') === 0 && !Systems.boardFor('mill').some(b => b.def.surplus);   // below the reserve, nothing
  S.banked.metal = TS.floor.metal + 51;   // five crates' worth past it
  const where = Economy.madeAt('metal') === 'mill', onMill = Systems.boardFor('mill').map(b => b.def).find(d => d.surplus === 'metal');
  const notHaven = !Systems.boardFor('haven').some(b => b.def.surplus === 'metal');   // posted where it was made, not on every board
  const card = !!onMill && onMill.to === 'relay' && onMill.item === 'parts' && onMill.n === TS.max && onMill.bank.metal === TS.max * TS.pack.metal && Economy.surplusOf('metal') === 5;
  /* the works bank it where they stand: a sawcamp's wood is the nearest lit board's */
  State.bank('wood', 1, Economy.bankedFrom('wood', DATA.stations.elm.x + 200, DATA.stations.elm.y + 100)); const worksAt = S.eco.madeAt.wood === 'elm';
  WL.tp('mill'); UI.openStation('mill'); await __wait(250);
  const cards = [...document.querySelectorAll('#stationBody .orderCard.surplusCard')], el = cards[0];
  const seen = cards.length === 1 && /SURPLUS FREIGHT/.test(el.querySelector('.wbTag').textContent) && !!el.querySelector(`img[src="${UI.markURL('surplus')}"]`) && /from the bank/.test(el.textContent);
  const idx = Systems.boardFor('mill').findIndex(b => b.def.surplus === 'metal');
  return { none, where, notHaven, card, worksAt, seen, idx, bank0: S.banked.metal };
});
const sp0 = r;
await page.click(`#stationOv [data-accept="${sp0.idx}"]`); await page.waitForTimeout(500);
r = await ev(() => {
  const TS = DATA.T.surplus, o = S.orders.active.find(x => x.surplus === 'metal');
  const paid = S.banked.metal === TS.floor.metal + 51 - TS.max * TS.pack.metal && !!o && o.to === 'relay' && S.cargo.filter(c => c.defId === 'parts' && c.orderId === o.idNum).length === TS.max;
  const once = !Systems.boardFor('mill').some(b => b.def.surplus === 'metal');   // one run of a material on the road at a time
  const lesson = !!S.flags.tut.firstSurplus;
  __closeAll();
  return { paid, once, lesson, to: o && o.to };
});
ok('THE SURPLUS ON THE BOARD: below the reserve the bank posts nothing; past it, the board where the metal was last banked (the Mill — not every board, not Haven\'s) posts SURPLUS FREIGHT: parts, three crates (the card\'s most, of the five crates\' worth past the reserve), for the town shortest of them (Relay Hill) — the tag, its mark, the bank\'s share on the card; a works banks what it makes at the nearest lit board; a real click on Accept: the bank pays thirty metal and the three crates ride the pack, bound for Relay Hill; one run of it at a time; the lesson',
  Object.values(sp0).every(v => v === true || typeof v === 'number') && Object.entries(r).every(([k, v]) => k === 'to' ? v === 'relay' : v === true), JSON.stringify(sp0) + ' ' + JSON.stringify(r));

/* ================= 3 · WHAT IT MOVED — THE SLIP ================= */
r = await ev(async () => {
  const before = S.stations.relay.stock.parts;
  WL.tp('relay'); for (const o of S.orders.active) o.t0 = S.time;
  UI.openStation('relay'); await __wait(200); WL.skipHandover(); await __wait(400); await __frames(2);
  const el = document.getElementById('movedRows'), rows = [...el.querySelectorAll('.mvRow')];
  const shown = !el.classList.contains('hidden') && /WHAT IT MOVED/.test(el.querySelector('.mvHead').textContent);
  const kinds = rows.map(x => x.dataset.mv);
  const stock = rows.find(x => x.dataset.mv === 'mv_stock'), bar = stock && stock.querySelector('.mvBar'), i = bar && bar.querySelector('i'), em = bar && bar.querySelector('em');
  const after = S.stations.relay.stock.parts;
  const barOk = !!bar && Math.abs(parseInt(i.style.width) - Math.round(before * 0.6)) <= 1 && Math.abs(parseInt(em.style.left) - Math.round(before * 0.6)) <= 1 && Math.abs(parseInt(i.style.width) + parseInt(em.style.width) - Math.round(after * 0.6)) <= 1;
  const shelfWords = !!stock && /Relay Hill's machine parts/.test(stock.textContent) && /short → /.test(stock.textContent);
  const bank = rows.find(x => x.dataset.mv === 'surplus'), bankWords = !!bank && /30 metal went out as machine parts/.test(bank.textContent);
  const marksOk = rows.every(x => x.querySelector('img').getAttribute('src') === UI.markURL(x.dataset.mv) && x.querySelector('img').width === 14);
  const lesson = !!S.flags.tut.firstMoved;
  /* the mark's texels on the slip, read off the image at two screen pixels a texel */
  const img = stock.querySelector('img'), c = document.createElement('canvas'); c.width = 28; c.height = 28; c.getContext('2d').drawImage(img, 0, 0);
  const d = c.getContext('2d').getImageData(0, 0, 28, 28).data, M = SPRITES.MARKS.mv_stock; let hit = 0, n = 0;
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) { if (M[y][x] === '.') continue; n++; const k = ((y * 4 + 2) * 28 + x * 4 + 2) * 4, w = __hex(SPRITES.MARK_PAL[M[y][x]]); if (Math.abs(d[k] - w[0]) + Math.abs(d[k + 1] - w[1]) + Math.abs(d[k + 2] - w[2]) < 9) hit++; }
  __closeAll();
  return { shown, kinds, barOk, shelfWords, bankWords, marksOk, lesson, markTexels: +(hit / n).toFixed(2) };
});
ok('WHAT IT MOVED — THE SLIP: the freight handed over at Relay Hill, the Delivery complete slip ends with WHAT IT MOVED: Relay Hill\'s machine parts, short → more (the shelf\'s bar: what it held in bone, what you added in gold, to the pixel), and the bank\'s surplus — thirty metal went out as machine parts; every line under the mark of what moved, two screen pixels a texel (the mark\'s every texel its own colour); the lesson',
  r.shown && r.kinds.includes('mv_stock') && r.kinds.includes('surplus') && r.barOk && r.shelfWords && r.bankWords && r.marksOk && r.lesson && r.markTexels === 1, JSON.stringify(r));

/* ================= 4 · WHAT IT MOVED — THE BOOK, THE WORD, THE ROAD, THE CAMP ================= */
r = await ev(async () => {
  /* a parcel for Elm, grieved on the road and promised: kept at the door */
  const def = { id: 'pc_haven_elm', from: 'haven', to: 'elm', item: 'parcel', n: 1, parcels: [{ to: 'elm', kind: 'coat', name: 'a mended coat' }], likesMul: 0, service: true, tier: 1, express: false, premium: false, mood: null, urgency: 8.5 };
  WL.tp('haven'); const o = Systems.acceptOrder(def, false), crate = S.cargo.find(c => c.orderId === o.idNum);
  const g = Economy.grieve(crate, 'ground'), promised = Economy.giveWord(g.id, 'promise') !== false;
  WL.tp('elm'); WL.instantPar(); const res = Systems.handleDelivery('elm'), slip = res.results.find(x => x.order && x.order.to === 'elm');
  const mv = (slip && slip.moved) || [], book = mv.find(m => m.mark === 'standing'), word = mv.find(m => m.mark === 'mv_word');
  const bookOk = !!book && /your word kept 1 time here/.test(book.text) && book.before === 1 && book.after === Economy.standing('elm').mul && book.after > 1;
  const walks = Economy.wireWords().filter(w => w.from === 'elm' && w.kind === 'kept').map(w => DATA.stations[w.to].name);
  const wordOk = !!word && walks.length > 0 && walks.every(n => word.text.includes(n));
  /* a road's next stretch: the Quarry's donation toward the Terrace Road */
  S.banked.metal = 10; S.banked.ceramic = 5; S.roads.r_quarry = [false, false, false]; S.stations.quarry.stock.meds = 20;   // the Quarry short of what the Greenhouse makes, so its board posts to it
  const def2 = Systems.boardFor('green').map(b => b.def).find(d => d.to === 'quarry' && d.item && !d.service && !d.surplus);
  let road = null;
  if (def2) { WL.tp('green'); Systems.acceptOrder(def2, false); WL.tp('quarry'); WL.instantPar(); const res2 = Systems.handleDelivery('quarry'), s2 = res2.results.find(x => x.order && x.order.to === 'quarry'); road = s2 && s2.moved.find(m => m.mark === 'mv_road'); }
  const cost = Systems.paverCost(DATA.roads.find(x => x.id === 'r_quarry'));
  const roadOk = !!road && /^Terrace Road — stretch 1 of 3/.test(road.head) && road.text.includes(`/${cost.metal} metal`) && road.text.includes(`${Math.floor(S.banked.metal)}/${cost.metal}`);
  /* a camp the light reached while the delivery was made: the diff names it */
  const a = Economy.snap('green'), b2 = Economy.snap('green'); a.camps.pass = false; b2.camps.pass = true;
  const camp = Economy.movedLines(a, b2, { item: null }, 'green', { mul: 1, mood: null }).find(m => m.mark === 'mv_camp');
  const campOk = !!camp && camp.head === 'Pass Camp' && /its knives stand down/.test(camp.text);
  /* nothing moved, nothing said: a snapshot against itself */
  const quiet = Economy.movedLines(a, a, { item: null }, 'green', { mul: 1, mood: null }).length === 0;
  return { promised, bookOk, wordOk, walks, roadOk, road: road && road.head + ' · ' + road.text, campOk, quiet };
});
ok('WHAT IT MOVED — THE BOOK, THE WORD, THE ROAD, THE CAMP: a parcel promised and kept at Elm Farm\'s door — the slip says the book (your word kept once there, and what Elm pays now) and the word on the wire (kept here, walking to the towns it names); a delivery to the Quarry — its donation moves the Terrace Road\'s next stretch (stretch 1 of 3, metal and ceramic against the paver\'s cost, the bank\'s own count); a camp the light reached during a delivery is named, its knives stood down; a delivery that moved nothing says nothing',
  r.promised && r.bookOk && r.wordOk && r.roadOk && r.campOk && r.quiet, JSON.stringify(r));

/* ================= 5 · THE STANDINGS IN THE PAY ================= */
r = await ev(async () => {
  const TD = DATA.T.standing;
  for (const id of ['relay', 'elm', 'mill', 'quarry', 'green']) { const b = Economy.book(id); b.kept = 0; b.broken = 0; b.heardKept = 0; b.heardBroken = 0; }
  const book = Economy.book('relay');
  const fresh = Economy.standing('relay').mul === 1 && Economy.standing('relay').crates === 0;
  S.stations.relay.stock.parts = 20; S.stations.relay.stock.food = 20;
  const cardAt = () => Systems.boardFor('mill').map(b => b.def).find(d => d.to === 'relay' && d.item === 'parts' && !d.surplus);
  const c0 = cardAt(), pay0 = c0 && UI2 && null;
  book.kept = 3; book.heardKept = 2;
  const sd = Economy.standing('relay'), mul = Math.round((1 + TD.kept * 3 + TD.heard * 2) * 100) / 100;
  const c1 = cardAt(), more = !!c0 && !!c1 && c1.n === c0.n + 1 && sd.crates === 1;
  /* the grade uses the same number: one synthetic order graded with and without the book */
  const o = { t0: S.time, par: 100, items: [], likesMul: 1, to: 'relay', from: 'mill', premium: false, express: false, deadline: null };
  const withBook = Systems.gradeOrder ? null : null;
  const g1 = Systems.boardFor ? (() => { const L1 = Economy.standing('relay').mul; return L1; })() : 0;
  /* broken dominating: a crate fewer and less pay */
  book.kept = 0; book.heardKept = 0; book.broken = 2;
  const bad = Economy.standing('relay'), fewer = bad.mul === Math.round((1 - TD.broken * 2) * 100) / 100 && bad.crates === -1 && (cardAt() ? cardAt().n === Math.max(1, c0.n - 1) : false);
  book.broken = 0;
  /* whoever holds the door: the rebels courting a square under your hard line; the knives' door under the Road's Own truce */
  S.rep.courted = { id: 'mill', t0: S.time }; S.rep.stance = S.rep.stance || {}; const was = S.rep.stance.rebels;
  S.rep.stance.rebels = 'HOSTILE'; const hard = Economy.standing('mill'); S.rep.stance.rebels = 'WARY'; const heard = Economy.standing('mill');
  S.rep.stance.rebels = was; S.rep.courted = null;
  const rebels = hard.fid === 'rebels' && hard.mul === Math.round((1 - TD.stance) * 100) / 100 && heard.mul === 1;
  return { fresh, mul: sd.mul, want: mul, more, fewer, bad: bad.mul, rebels, g1 };
});
const st5 = r;
/* on the board: the line, the card's multiplier, the pay on the card equal to the grade's */
r = await ev(async () => {
  const book = Economy.book('relay'); book.kept = 3; book.heardKept = 2;
  S.stations.relay.stock.parts = 20;
  WL.tp('relay'); UI.openStation('relay'); await __wait(250);
  const line = document.querySelector('#stationBody .standLine'), lineOk = !!line && /THE STANDING/.test(line.textContent) && /pays ×1\.24/.test(line.textContent) && /your word kept here 3/.test(line.textContent) && !!line.querySelector(`img[src="${UI.markURL('standing')}"]`);
  __closeAll();
  WL.tp('mill'); UI.openStation('mill'); await __wait(250);
  const card = [...document.querySelectorAll('#stationBody .orderCard')].find(c => /Machine parts[^→]*→ Relay Hill/.test(c.querySelector('h4').textContent) && !c.classList.contains('surplusCard'));
  const meta = card && [...card.querySelectorAll('.meta')].find(m => /pays ~/.test(m.textContent)), multOk = !!meta && /×1\.24/.test(meta.textContent) && !!meta.querySelector(`img[src="${UI.markURL('standing')}"]`);
  const lesson = !!S.flags.tut.firstStanding;
  __closeAll();
  /* the grade: a delivery to Relay with the book, against the same without it */
  const def = Systems.boardFor('mill').map(b => b.def).find(d => d.to === 'relay' && d.item === 'parts' && !d.surplus);
  WL.tp('mill'); const o = Systems.acceptOrder(def, false); WL.instantPar();
  const gWith = Systems.gradeOrder ? null : null;
  WL.tp('relay'); const res = Systems.handleDelivery('relay'), s = res.results.find(x => x.order && x.order.to === 'relay' && !x.order.surplus);
  const graded = !!s && !!s.standing && s.standing.mul === 1.24;
  UI.queueResults(res.results, null); const rows = document.getElementById('scoreRows').textContent, slipRow = /Relay Hill's standing/.test(rows) && /×1\.24/.test(rows);
  __closeAll();
  return { lineOk, multOk, lesson, graded, slipRow };
});
ok('THE STANDINGS IN THE PAY: a fresh book pays ×1 and asks nothing more; Relay Hill\'s book — your word kept three times at its door and heard kept twice down the wire — pays ×1.24 and asks a crate more on what is sent there; broken twice, it pays ×0.80 and asks a crate fewer; whoever holds the door counts, from where that faction started (the Unlit courting the Mill under your hard line: ×0.90; heard out: ×1); the board says it (THE STANDING, its mark, the book in words, pays ×1.24), the card to that door carries the same ×1.24, the delivery is graded by it and the slip names it; the lesson',
  st5.fresh && st5.mul === st5.want && st5.more && st5.fewer && st5.rebels && Object.values(r).every(Boolean), JSON.stringify(st5) + ' ' + JSON.stringify(r));

/* ================= 6 · THE CAMPS ON THE ROUTES — THE KNIVES LET YOU THROUGH ================= */
r = await ev(async () => {
  const ridge = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge;
  c.pacified = false; c.taken = null; c.given = null; c.wired = null; c.stoneGiven = 0;
  S.cargo.push(State.makeItem('food'));
  const zonedBefore = Systems.walkOpts(true).avoid.some(z => z.x === ridge.x && z.y === ridge.y);
  c.stoneGiven = S.time;
  const onRoutes = Republic.onRoutes(ridge) === 'stone' && Republic.routeCamps().some(x => x.id === 'ridge');
  const zonedAfter = Systems.walkOpts(true).avoid.some(z => z.x === ridge.x && z.y === ridge.y);
  /* a loaded Walker in the ring: the knives look, and let them walk */
  c.runners = []; Systems.update(0.02, {}); const n = c.runners.length;
  WL.tp([ridge.x + 120, ridge.y + 60]); S.speed = 0; for (const x of Render.clearFx ? [0] : []) void x; Render.clearFx();
  for (const r2 of c.runners) { r2.x = S.px + 60; r2.y = S.py + 20; r2.cd = 0; }
  const t0 = S.time, hp0 = S.health, cargo0 = S.cargo.length; let struck = false;
  for (let k = 0; k < 90; k++) { Systems.update(1 / 30, {}); if (S.struggle || S.cargo.length < cargo0 || S.health < hp0 - 0.01) struck = true; }
  const said = !!c.stoneSaid && !!S.flags.tut.firstCampRoute;
  S.cargo = S.cargo.filter(x => x.defId !== 'food' || x.orderId);
  WL.tp('haven');
  return { zonedBefore, onRoutes, zonedAfter, n, struck, said };
});
ok('THE CAMPS ON THE ROUTES — THE KNIVES LET YOU THROUGH: loaded, Ridge Camp\'s ring is ground the planner walks round; the day the knives set their stone beside yours it is on your routes — the planner walks through it, and a loaded Walker standing among its knives is looked at and let be (no cut, no knock, no crate lost), the knives saying so; the lesson',
  r.zonedBefore && r.onRoutes && !r.zonedAfter && r.n > 0 && !r.struck && r.said, JSON.stringify(r));

/* ================= 7 · THE CAMPS ON THE ROUTES — THE SALVAGE WALKED IN ================= */
r = await ev(async () => {
  const ridge = DATA.camps.find(c => c.id === 'ridge'), TR = DATA.T.routes;
  S.stations.elm.stock.tools = 30; S.stations.relay.stock.parts = 90;
  S.salvageRuns = []; S.salvageLast = {};
  Republic.tick(0.1); const waits = Republic.salvageRuns().length === 0 && S.salvageLast.ridge !== undefined;   // the stone set, the first walk waits its day
  S.salvageLast.ridge = S.time - TR.every * DATA.T.dayLen - 1; Republic.tick(0.1);
  const run = Republic.salvageRuns()[0], out = !!run && run.to === 'elm' && run.good === 'tools';
  /* seen: the knife with the salvage lashed on his back, against the same frame without him */
  run.x = ridge.x + 300; run.y = ridge.y + 400; run.dir = Math.PI / 2;
  await __stage(0, 0); WL.tp([run.x + 70, run.y + 30]); Render.cam.x = run.x; Render.cam.y = run.y - 20; await __wait(200); await __frames(3);
  const a = __grab(run.x, run.y - 30, 60), lbl = Render.labelBoxes().some(q => /THE KNIVES' SALVAGE — FOR ELM FARM/.test(q.str));
  const keep = Republic.salvageRuns().slice(); S.salvageRuns = []; await __frames(3); await __wait(80); await __frames(2); const b = __grab(run.x, run.y - 30, 60); S.salvageRuns = keep;
  const seen = __diff(a, b);
  /* the salvage glyph itself: its steel on the knife's back */
  const steel = __count(a, __hex(SPRITES.MARK_PAL.W), 8) - __count(b, __hex(SPRITES.MARK_PAL.W), 8);
  __done();
  /* he walks it in: the shelf fills, the town thanks you, the mail and the lesson; then he walks home */
  const tools0 = S.stations.elm.stock.tools, likes0 = S.stations.elm.likesTo; S.mails.length = 0;
  for (let k = 0; k < 4000 && !Republic.salvageRuns()[0].back; k++) Republic.tick(0.25);
  const arrived = Republic.salvageRuns()[0] && Republic.salvageRuns()[0].back;
  const shelf = Math.round(S.stations.elm.stock.tools - tools0) === TR.stock && Math.round(S.stations.elm.likesTo - likes0) === TR.likes && S.mails.some(m => /Ridge Camp's salvage at Elm Farm/.test(m.subj)) && S.salvageLog.ridge === 1;
  for (let k = 0; k < 4000 && Republic.salvageRuns().length; k++) Republic.tick(0.25);
  const home = Republic.salvageRuns().length === 0;
  return { waits, out, seen, steel, lbl, arrived, shelf, home };
});
const sv7 = r;
/* on the sheet and the roll */
r = await ev(async () => {
  const ridge = DATA.camps.find(c => c.id === 'ridge'), elm = DATA.stations.elm;
  WL.tp([ridge.x + 200, ridge.y + 1400]);
  UI.toggleMap(true); UI.drawMap(); await __wait(100);
  const cv = document.getElementById('map'), g = cv.getContext('2d'), r0 = cv.getBoundingClientRect(), sc = cv.width / r0.width;
  const read = () => { const p = UI.mapPoint((ridge.x + elm.x) / 2, (ridge.y + elm.y) / 2), x = Math.round((p.x - r0.left) * sc), y = Math.round((p.y - r0.top) * sc); return g.getImageData(x - 12, y - 12, 24, 24).data; };
  const on = read(); const st = S.camps.ridge.stoneGiven; S.camps.ridge.stoneGiven = 0; UI.drawMap(); const off = read(); S.camps.ridge.stoneGiven = st; UI.drawMap();
  const route = __diff(on, off);
  const html = UI.campRollHTML ? UI.campRollHTML(ridge) : '';
  const roll = /on your routes/.test(html) && /let you through/.test(html) && html.includes(UI.markURL('camproute'));
  UI.toggleMap(false);
  return { route, roll };
});
ok('THE CAMPS ON THE ROUTES — THE SALVAGE WALKED IN: the stone set, the knives\' first walk waits its day; then a knife leaves the fire with the salvage lashed on his back for the nearest lit town short of what they salvage (Elm Farm\'s tools) — seen on the ground against the same frame without him (the scrap\'s steel on his back), his words under his feet; at the door the shelf fills by its measure and the town is warmer toward you (the mail, the count kept), and he walks home; the sheet draws the way from their fire to that door with the route\'s mark, and the camp\'s roll says it is on your routes',
  sv7.waits && sv7.out && sv7.seen > 400 && sv7.steel > 20 && sv7.lbl && sv7.arrived && sv7.shelf && sv7.home && r.route > 20 && r.roll, JSON.stringify(sv7) + ' ' + JSON.stringify(r));

/* ================= 8 · A STOP ON THE WAY ================= */
r = await ev(async () => {
  const pass = DATA.camps.find(c => c.id === 'pass');
  Republic.giveRing(pass); S.camps.pass.given.left = true;
  S.orders.active.length = 0; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  const def = Systems.boardFor('haven').map(b => b.def).find(d => d.to === 'green' && d.item && !d.service);
  const d2 = def || { id: 'mk_food_green', from: 'haven', to: 'green', item: 'food', n: 1, likesMul: 1, express: false, premium: false, mood: 'wanting', urgency: 1 };
  WL.tp('haven'); Systems.acceptOrder(d2, false); S.px += 30;
  S.health = 100; S.warmth = 90; Guide.tick(0.2); const well = Guide.current() && Guide.current().id;
  S.health = 40; Guide.tick(0.2); const cur = Guide.current(), hurt = !!cur && cur.id === 'reststop' && /Pass Camp's fire/.test(cur.head) && cur.target && Math.abs(cur.target.x - pass.x) < 2;
  S.health = 90; S.warmth = 20; Guide.tick(0.2); const cold = Guide.current() && Guide.current().id === 'reststop' && /^Cold/.test(Guide.current().head);
  /* at the fire it mends and warms; the plan walks on */
  WL.tp([pass.x + 10, pass.y + 10]); S.health = 40; Guide.tick(0.2); const atFire = Guide.current() && Guide.current().id !== 'reststop';
  const rest = !!Republic.restFire(S.px, S.py);
  S.health = 100; S.warmth = 90; S.orders.active.length = 0; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  /* a camp on the wire is a door on the way: Ash Camp's, between the Foundry and the Pharos */
  const ash = DATA.camps.find(c => c.id === 'ash'), ca = S.camps.ash, P = DATA.campPosts.ash;
  ca.wired = { t: S.time, id: P.id, kit: 'chief' }; ca.pacified = true; ca.runners = [];
  State.save(); State.load();   // the valley's doors synced: the camp's post is a station
  for (const id of ['foundry', 'pharos', P.id]) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  const d3 = { id: 'mk_coolant_pharos', from: 'foundry', to: 'pharos', item: 'coolant', n: 1, likesMul: 1, express: false, premium: false, mood: 'wanting', urgency: 1 };
  WL.tp('foundry'); Systems.acceptOrder(d3, false); S.px -= 40; S.health = 40; Guide.tick(0.2);
  const cd3 = Guide.current(), door = !!cd3 && cd3.id === 'reststop' && /Ash Camp's door/.test(cd3.head) && Math.abs(cd3.target.x - DATA.stations[P.id].x) < 2;
  S.health = 100; S.orders.active.length = 0; S.cargo = S.cargo.filter(c => c.cat === 'tool'); WL.tp('haven');
  return { well, hurt, cold, atFire, rest, door };
});
ok('A STOP ON THE WAY: a given ring\'s fire lies near the walk from Haven to the Greenhouse — well, the Guide carries you to the door; hurt, it stops you at Pass Camp\'s fire on the way (the arrow on the fire); cold, the same; at the fire, where the given ring warms and mends, it lets you walk on; a camp on the wire is a door on the way the same (Ash Camp\'s, between the Foundry and the Pharos)',
  r.well !== 'reststop' && r.hurt && r.cold && r.atFire && r.rest && r.door, JSON.stringify(r));

/* ================= 9 · THE BUS MAP ================= */
r = await ev(async () => {
  if (ManualUI.open) ManualUI.open('papers'); await __wait(200);
  const rows = [...document.querySelectorAll('.fmPaper')];
  const each = rows.length === PAPERS.length && rows.every((el, i) => { const p = PAPERS[i]; return el.dataset.paper === p.id && el.querySelector('.fmName').textContent.trim() === p.name && el.querySelector('.fmLoop').textContent.includes(p.loop.slice(0, 30)) && /FOR YOUR DELIVERIES/.test(el.querySelector('.fmLoop').textContent) && el.querySelector('.fmMark').getAttribute('src') === UI.markURL(p.mark) && el.querySelector('.fmMark').width === 14; });
  const fm = document.getElementById('helpOv'); if (fm) fm.classList.add('hidden'); if (ManualUI.close) ManualUI.close();
  return { n: rows.length, each };
});
ok('THE BUS MAP: the manual\'s Windows tab lists every window — twenty (v3.52: twenty-one, the Paused sheet listed), the slip, the transfer, the ruin, the trader, the appearance, the build menu, Farkeep\'s desk and a camp\'s roll among them — and under each, in plain words, FOR YOUR DELIVERIES: what it does for them, beside the mark of what it moves (two screen pixels a texel)',
  r.n === 21 && r.each, JSON.stringify(r));

/* ================= 10 · THE SAVE ================= */
r = await ev(() => {
  S.eco.madeAt = { metal: 'mill', wood: 'elm' }; S.salvageLog = { ridge: 2 }; S.salvageLast = { ridge: S.time - 5 };
  S.salvageRuns = [{ camp: 'ridge', to: 'elm', good: 'tools', x: 100, y: 200, back: false, moving: true, dir: 0, wa: 0 }];
  const b = Economy.book('relay'); b.kept = 3; b.heardKept = 2;
  State.save(); State.load();
  const ridge = DATA.camps.find(c => c.id === 'ridge');
  return { made: Economy.madeAt('metal') === 'mill' && S.eco.madeAt.wood === 'elm', log: S.salvageLog.ridge === 2, run: Republic.salvageRuns().length === 1 && Republic.salvageRuns()[0].to === 'elm', stone: Republic.onRoutes(ridge) === 'stone', standing: Economy.standing('relay').mul === 1.24, ghost: !('roadFund' in S) && !('awayStamp' in S) };
});
ok('THE SAVE: where the bank\'s materials were made, the knives\' salvage walks (the count, the day, a walk in progress), a camp on your routes and a town\'s standing survive a save and load — and the fields no one read (roadFund, awayStamp, a town\'s wireT) no longer ride every save',
  Object.values(r).every(Boolean), JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
await T.finish('what it moved');
