/* carried.mjs — v3.46 THE WORD CARRIED (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). What it proves: a word written in a town's book walks the wire to the
   two nearest lit towns (the letter seen on the world and on the sheet; landing, kept warms and broken cools; the keeper
   says it; the header carries your word's weight and what the town heard); the kin's thanks (a keepsake named for the
   fallen hangs under the pack — a like on every delivery there, the slip, the plate, the card); the stone's flame (a lantern
   set lit goes out at the next dark and the kin ask again: taken, lit, set back — twice, then the kin keep it); the truce as
   a road (a camp at truce opens its ring to charter runs — quicker, the rags at the crossings, the sheet's dashed road); the
   chief's runner (the pact's last day, a bundle for the bank, turned back if the word breaks); the score settled at the
   ring (the stones with a red thread); the line's orders (HOLD — the rope, a knife turned back; COME — abreast); the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const drain = async () => { await ev(() => { WL.timeScale = 1; }); await T.drain(); await ev(() => { WL.timeScale = 0.001; }); };
await ev(() => {
  for (const id of DATA.stationOrder) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources();
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  for (let i = 0; i < 5; i++) S.npcs.push(NPC.gen({ at: 'haven' }));
  window.__says = []; const sy = Render.say; Render.say = (x, y, str, col, who) => { __says.push({ str: String(str), col }); return sy(x, y, str, col, who); };
  window.__die = (v, fn) => { const r0 = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = r0; } };
  window.__at = f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; };
  window.__look = async (x, y, zoom = 3, dx = 150, dy = 120) => { WL.tp([x + dx, y + dy]); S.weather.state = 'clear'; __clearAmb(x, y, 360); Render.clearFx(); Render.setFx(false); Render.setZoom(zoom); Render.cam.x = x; Render.cam.y = y; WL.timeScale = 0.001; await __wait(300); await __frames(3); };
  window.__hideSay = () => document.getElementById('keeperSay').classList.add('hidden');
  window.__newCol = (a, b, cols, tol) => { let n = 0; for (let i = 0; i < Math.min(a.length, b.length); i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60 && cols.some(c => Math.abs(a[i] - c[0]) < tol && Math.abs(a[i + 1] - c[1]) < tol && Math.abs(a[i + 2] - c[2]) < tol)) n++; return n; };   // pixels of these colours that the thing put there
  window.__crew = k => { for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; } const pool = S.npcs.filter(x => x.state === 'pool' && x.at === 'haven' && !x.lent).slice(0, k); for (const x of pool) { NPC.hire(x, 'companion'); x.hungry = false; x.shoveCd = 0; } return pool; };
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const inPal = (rows, pal, w, h) => rows.length === h && rows.every(rw => rw.length === w) && [...new Set(rows.join('').replace(/\./g, ''))].every(ch => pal[ch]);
  const FOURTEEN = ['heard', 'keepsake', 'relight', 'truce', 'settled', 'hold', 'come', 'turned', 'ks_whetstone', 'ks_button', 'ks_bird', 'ks_whistle', 'ks_flower', 'ks_ring'];
  const marks = FOURTEEN.every(k => inPal(SPRITES.MARKS[k], SPRITES.MARK_PAL, 7, 7)) && new Set(FOURTEEN.map(k => SPRITES.MARKS[k].join(''))).size === 14;
  const W = SPRITES.WORDNOTE, letter = inPal(W.kept, SPRITES.WORD_PAL, 7, 5) && inPal(W.broken, SPRITES.WORD_PAL, 7, 5) && /F/.test(W.kept.join('')) && /R/.test(W.broken.join('')) && W.kept.join('') !== W.broken.join('');   // a gold seal kept, a rust seal broken
  const stake = inPal(SPRITES.TRUCESTAKE, SPRITES.TRUCE_PAL, 7, 13) && /K/.test(SPRITES.TRUCESTAKE.join(''));
  const stones = inPal(SPRITES.SETTLESTONE, SPRITES.SETTLE_PAL, 8, 7) && /R/.test(SPRITES.SETTLESTONE.join(''));
  const A = SPRITES.FIG.knife.at, bundle = ['E', 'S', 'N'].every(fc => A[fc] && Array.isArray(A[fc].gift)) && !!SPRITES.COURIER.glyphs.gift;   // v3.51: the runner's bundle lashed at the knife figure's own anchors
  const K = SPRITES.KEEPSAKES, ids = ['whetstone', 'button', 'bird', 'whistle', 'flower', 'ring'];
  const keepsakes = Object.keys(K).join() === ids.join() && ids.every(k => SPRITES.MARKS[K[k].mark] && inPal(K[k].token, SPRITES.TOKEN_PAL, 2, 3)) && new Set(ids.map(k => K[k].token.join(''))).size === 6;
  const T2 = DATA.T, rows = T2.word.wire.near === 2 && T2.word.wire.likes === 1 && T2.word.wire.appr === 2 && T2.word.wire.speed === 260 && T2.kin.keepsakeLikes === 1 && T2.kin.relights === 2 && T2.kin.relightLikes === 2 && T2.parley.roadMul === 0.7 && T2.parley.runnerSpeed === 72 && T2.parley.giftBack.metal === 30 && T2.parley.giftBack.provisions === 24 && T2.score.settleR === 180 && T2.score.walkDays === 3 && T2.score.settledDays === 1 && T2.score.spot === 110 && T2.ring.holdLong === 300 && T2.ring.turnR === 70 && T2.ring.turnCd === 14 && T2.ring.comeR === 110;
  const voices = DATA.stationOrder.every(id => DATA.keeperGrief[id].heardKept && DATA.keeperGrief[id].heardBroken && /\{town\}/.test(DATA.keeperGrief[id].heardKept)) && ids.every(k => DATA.keepsakeLines[k]) && ['taken', 'stood down', 'chief'].every(k => (DATA.settleLines[k] || []).length >= 2);
  const causesN = Object.keys(MUSTER.MOOD.causes).length, settledCause = MUSTER.MOOD.causes.settled.v === 2;
  const lessons = ['firstWireWord', 'firstKeepsake', 'firstRelight', 'firstTruceRoad', 'firstGiftRunner', 'firstSettled', 'firstLineOrders'].filter(k => DATA.tutorials[k] && DATA.tutorialTitles[k]).length, lessonsN = Object.keys(DATA.tutorials).length;
  return { marks, letter, stake, stones, bundle, keepsakes, rows, voices, causesN, settledCause, lessons, lessonsN };
});
ok('THE REGISTRIES: fourteen 7×7 marks (heard, the keepsake, the relight, the truce, settled, hold, come, the U of the way back, six keepsakes\' own); the letter on the wire (7×5) with a gold seal kept and a rust seal broken; the truce stake with its white rag; the settled stones, a cairn with a red thread; the runner\'s bundle lashed on the figure\'s own grid (v3.51: at the knife\'s anchors, every facing); six keepsakes, each a mark and a 2×3 token; the rows (the wire, the kin\'s thanks and flame, the road, the runner\'s gift, the settling, the line\'s orders); every keeper\'s heard lines, the keepsakes\' and the settling\'s; the settled mood (v3.49: 31 causes); the seven lessons (v3.49: the manual at 93 pages)',
  Object.entries(r).every(([k, v]) => k === 'causesN' ? v === 31 : k === 'lessonsN' ? v >= 93 : k === 'lessons' ? v === 7 : v === true), JSON.stringify(r));

/* ================= 2 · THE WORD ON THE WIRE ================= */
r = await ev(() => {
  const M = 'mill', W = DATA.T.word.wire; S.wireWords = [];
  Economy.book(M).kept = (Economy.book(M).kept || 0) + 1;   // the word kept at the Mill's door that sends it (the kept path writes the book, then the wire)
  const near =DATA.stationOrder.filter(id => id !== M && S.stations[id].connected).sort((a, b) => U.dist(DATA.stations[M].x, DATA.stations[M].y, DATA.stations[a].x, DATA.stations[a].y) - U.dist(DATA.stations[M].x, DATA.stations[M].y, DATA.stations[b].x, DATA.stations[b].y)).slice(0, 2);
  Economy.wireWord(M, 'kept', 'a mended coat');
  const ws = S.wireWords.filter(w => w.from === M && w.kind === 'kept');
  const walks = ws.length === 2 && ws.map(w => w.to).sort().join() === near.slice().sort().join() && ws.every(w => { const rt = Economy.wireRoute(M, w.to); return rt.len > 0 && Math.abs((w.eta - w.t0) - rt.len / W.speed) < 1; });
  window.__ww = { to: ws[0] && ws[0].to, id: ws[0] && ws[0].id };
  return { near, walks, eta: ws.map(w => +(w.eta - w.t0).toFixed(1)) };
});
const ww1 = r;
await drain();
const wwSeen = await ev(async () => {
  const w = S.wireWords.find(x => x.id === __ww.id); __at(0.3); w.t0 = S.time - (w.eta - w.t0) / 2; w.eta = S.time + 1e6;   // halfway along its route, held there
  const p = Economy.wireWordAt(w); await __look(p.x, p.y - 18, 3, 120, 90);
  const gold = __hex('#ffd98f'), a = __grab(p.x, p.y - 17, 16), on = __count(a, gold, 30);
  const keep = S.wireWords; S.wireWords = []; await __wait(120); await __frames(3); const b = __grab(p.x, p.y - 17, 16), off = __count(b, gold, 30); S.wireWords = keep;
  /* on the survey sheet: the letter on its route (its paper and its gold seal, against the same sheet without it) */
  UI.toggleMap(true); UI.drawMap();
  const c = document.getElementById('map'), g = c.getContext('2d'), r0 = c.getBoundingClientRect(), sc = c.width / r0.width, m = UI.mapPoint(p.x, p.y);
  const box = () => g.getImageData(Math.round((m.x - r0.left) * sc) - 16, Math.round((m.y - r0.top) * sc) - 16, 32, 32).data;
  const sA = box(); S.wireWords = []; UI.drawMap(); const sB = box(); S.wireWords = keep; UI.drawMap(); UI.toggleMap(false);
  const sheet = { paper: __newCol(sA, sB, [__hex('#e8e0c8'), __hex('#c9c3a8')], 14), seal: __newCol(sA, sB, [gold], 14), diff: __diff(sA, sB) };
  __done(); WL.timeScale = 0.001;
  return { f: +p.f.toFixed(2), on, off, diff: __diff(a, b), sheet };
});
r = await ev(() => {
  const to = __ww.to, st = S.stations[to], W = DATA.T.word.wire;
  const l0 = st.likesTo = 40, a0 = st.appr || 0;
  for (const w of S.wireWords) w.eta = S.time - 0.01;
  Economy.update(0.01);
  const landed = !S.wireWords.length && st.likesTo === l0 + W.likes && (st.appr || 0) === a0 + W.appr && Economy.book(to).log.some(e => e.kind === 'heardKept');
  WL.tp(to); UI.openStation(to);
  const door = document.getElementById('keeperLine').textContent.includes(DATA.keeperGrief[to].heardKept.replace(/\{town\}/g, 'The Mill').slice(0, 20));
  const ww2 = Economy.wordWeight(), bl = document.getElementById('bookLine').textContent.replace(/\s+/g, ' '), header = bl.includes(`ON THE WIRE ${ww2.kept} kept · ${ww2.broken} broken`) && ww2.kept >= 1 && bl.includes('heard: your word kept at The Mill');
  document.getElementById('stationClose').click();
  /* a broken word cools where it lands */
  Economy.wireWord('mill', 'broken', 'the keeper\'s sealed letter'); const wb = S.wireWords.find(w => w.kind === 'broken'), tb = S.stations[wb.to], lb = tb.likesTo = 40;
  for (const w of S.wireWords) w.eta = S.time - 0.01; Economy.update(0.01);
  const cooler = tb.likesTo === lb - W.likes && Economy.book(wb.to).log.some(e => e.kind === 'heardBroken');
  return { landed, door, header, weight: ww2, cooler };
});
ok('THE WORD ON THE WIRE: a word kept in a town\'s book walks the wire to the two nearest lit towns on the wire\'s own route at its pace; it is seen — the letter with its gold seal on the world (pixel-sampled against the same frame without it) and on the survey sheet on its route; landing, the town is a like and two of appreciation warmer and its book logs what it heard; the keeper says it at the door; the terminal header carries your word on the wire and what the town heard last; a broken word lands a like cooler',
  ww1.walks && wwSeen.on > wwSeen.off + 6 && wwSeen.diff > 20 && wwSeen.sheet.paper > 8 && wwSeen.sheet.seal > 0 && r.landed && r.door && r.header && r.cooler, JSON.stringify(ww1) + ' seen=' + JSON.stringify(wwSeen) + ' ' + JSON.stringify(r));

/* ================= 3 · THE KIN'S THANKS ================= */
r = await ev(() => {
  const G = 'green', st = S.stations[G];
  S.rep.held[G] = { t0: S.time, from: G, tithe: 0, shields: 2, riseDay: -1 }; st.likesTo = 45;
  const a = Republic.recruitOwn(G); NPC.setOrder(a, 'hours', 'full'); const fallen = a.name;
  S.kinErrands = []; __at(0.75); __die(0.2, () => Republic.squareRises(G));
  delete S.rep.unlit[G]; st.connected = true; st.litT = 1; State.refreshSources(); __at(0.3);
  const e = S.kinErrands.find(x => x.kind === 'shield'), d = S.drops.find(x => x.item && x.item.kin === e.id);
  State.addCargo(d.item); S.drops.splice(S.drops.indexOf(d), 1);
  const ms = Memorial.site('town'); Memorial.raise('town'); WL.tp([ms.x, ms.y + 40]); S.mails.length = 0;
  const gI = Systems.getInteractions().find(i => i.key === 'G' && /shield/.test(i.label)); if (gI) gI.fn();
  const ks = S.cargo.find(c => c.keepsake), thing = Republic.keepsakeOf(fallen);
  const given = !!ks && ks.keepsake.thing === thing && ks.name === `${fallen.split(' ')[0]}'s ${SPRITES.KEEPSAKES[thing].name}` && Republic.keepsakeOf(fallen) === thing && S.mails.some(m => new RegExp(`something of ${fallen.split(' ')[0]}'s`).test(m.subj)) && !!S.flags.tut.firstKeepsake;
  window.__ks = { id: ks && ks.id, town: G };
  return { given, thing };
});
const kt1 = r;
await drain();
const token = await ev(async () => {
  const ks = S.cargo.find(c => c.id === __ks.id); S.cargo = S.cargo.filter(c => c.cat === 'tool' || c === ks); Render.faceWalker('E');
  const H = DATA.stations.haven; await __look(H.x + 520, H.y + 230, 3, 0, 30); WL.tp([H.x + 520, H.y + 260]); Render.cam.x = S.px; Render.cam.y = S.py - 30; await __wait(200); await __frames(3);
  const c = Render.walkerAt(10, 26), a = __grab(c.x, c.y, 40);
  S.cargo = S.cargo.filter(x => x !== ks); await __wait(120); await __frames(3); const b = __grab(c.x, c.y, 40); S.cargo.push(ks);
  __done(); WL.timeScale = 0.001;
  return __diff(a, b);
});
r = await ev(() => {
  const G = __ks.town, st = S.stations[G];
  /* every delivery into that town with it is a like warmer — the slip says so; the town's plate carries it */
  S.stations.haven.parcels = [{ to: G, kind: 'seed', name: 'a twist of seed' }]; WL.tp('haven');
  const o = (Economy.ordersFor('haven') || []).find(x => x.item === 'parcel' && x.to === G); Systems.acceptOrder(o, false);
  const l0 = st.likesTo = 40; WL.tp(G); WL.instantPar();
  const res = Systems.handleDelivery(G).results.find(x => x.order && x.order.id === o.id);
  const like = !!res && res.keepsake && st.likesTo === l0 + DATA.T.kin.keepsakeLikes;
  UI.queueResults([res], null); const slip = /THE KIN'S THANKS/.test(document.getElementById('scoreRows').textContent); document.getElementById('results').classList.add('hidden');
  UI.openStation(G); const plate = !!document.querySelector('#keeperLine .keepsakeRow') && /under your pack/.test(document.querySelector('#keeperLine .keepsakeRow').textContent); document.getElementById('stationClose').click();
  /* the card carries what the Walker carried to the stone (the row the coat hung up writes) */
  const ks = S.cargo.find(c => c.keepsake);
  S.legacy.push({ name: 'Test Walker', cls: 'Courier', fate: 'hung up the coat', likes: 0, km: '0.0', deliveries: 1, cheated: false, seed: 5, fact: 'waylight', scars: 0, look: null, keepsakes: S.cargo.filter(c => c.keepsake).map(c => ({ name: c.name, thing: c.keepsake.thing })) });
  Memorial.revealGround('waylight'); Memorial.open('waylight');
  const card = [...document.querySelectorAll('#memBody .memCard')].some(e => e.textContent.includes('Test Walker') && e.textContent.includes(ks.name)); Memorial.close();
  S.legacy.pop();
  /* the dossier never stores it: the store marked on the whole tree, the town's pass run at its door — a crate of metal goes
     into the lockers and the keepsake stays on the pack (the ledger, the pack, the lockers and the toasts put back after) */
  const led0 = JSON.stringify(Ledger.led()), tut0 = S.flags.tut.firstDossier, toasts0 = document.getElementById('toasts').innerHTML, pack0 = S.cargo.slice(), lock0 = st.storage.slice();
  const met = State.makeItem('metal'); S.cargo.push(met);
  Object.assign(Ledger.led().dossier, { contracts: false, deliver: false, store: true, donate: false, scrap: false, pickup: false });
  Ledger.setMark('cargo', 'store', true); S.flags.tut.firstDossier = true;
  const pass = Ledger.runDossier(G);
  const dossier = !!ks && Ledger.effective(ks.defId, 'store') && S.cargo.includes(ks) && !st.storage.includes(ks) && st.storage.includes(met) && !S.cargo.includes(met) && pass.stored >= 1;
  S.ledger = JSON.parse(led0); S.flags.tut.firstDossier = tut0; document.getElementById('toasts').innerHTML = toasts0;
  S.cargo.length = 0; S.cargo.push(...pack0); st.storage.length = 0; st.storage.push(...lock0); UI.refreshCargo();
  return { like, slip, plate, card, dossier };
});
ok('THE KIN\'S THANKS: the shield carried home, the kin give the Walker something of the fallen\'s — the same thing for the same name every time, named for them (the mail in the kin\'s own line, the lesson); it hangs under the pack on its string (pixel-sampled against the same frame without it); every delivery into that town with it is a like warmer and the slip says THE KIN\'S THANKS; the town\'s plate carries it; the dossier never stores it (the store marked on the whole tree and the town\'s pass run at its door: a crate of metal goes into the lockers, the keepsake stays on the pack); the memorial card carries what the Walker carried to the stone',
  kt1.given && token > 4 && r.dossier === true && Object.values(r).every(Boolean), JSON.stringify(kt1) + ' token=' + token + ' ' + JSON.stringify(r));

/* ================= 4 · THE STONE'S FLAME ================= */
r = await ev(() => {
  const G = 'green', K = DATA.T.kin, DL = DATA.T.dayLen;
  const row = S.legacy.find(x => x.fact === 'town' && x.town === G && !x.lit); if (!row) return { row: false };
  const ms = Memorial.site('town'); Memorial.raise('town'); Memorial.raise('town');
  row.lit = true; row.litT = S.time - DL; row.relit = 0; row.kin = 'Wenna Test';
  /* it burns the night it was set and goes out at the next dark: the kin ask again */
  __at(0.75); S.mails.length = 0; Republic.tick(0.02);
  const e = S.kinErrands.find(x => x.kind === 'relight' && x.fallen === row.name && x.state === 'open');
  const out = !row.lit && !!row.cold && !!e && S.mails.some(m => /lantern is out/.test(m.subj)) && !!S.flags.tut.firstRelight;
  WL.tp([ms.x + 600, ms.y + 400]); for (let i = 0; i < 40; i++) UI.tick();
  const compass = [...document.querySelectorAll('#compassInner .cMark')].some(m => /the stone's flame/.test(m.title));
  window.__sf = { name: row.name, e: e && e.id };
  return { row: true, out, compass };
});
const sf1 = r;
await drain();
const coldSeen = await ev(async () => {
  const row = S.legacy.find(x => x.name === __sf.name), rw = Memorial.rows('town').find(x => x.name === __sf.name), sl = Memorial.slotFor(rw.ord, 'town');
  /* the lantern stands at the stone's foot, right of it: centred on (x+16, the foot) — the foot by the stone's tier (9 rows at 3, 11 at 3, 14 at 3.5) */
  const foot = { small: 9 * 3, mid: 11 * 3, grand: 14 * 3.5 }[rw.tier] * 0.5 - 2, lx = sl.x + 16, ly = sl.y + foot; __at(0.3);
  await __look(lx, ly, 3, 150, 120);
  const frames = []; for (const lit of [false, true]) {
    row.lit = lit; row.cold = lit ? 0 : S.time; await __wait(150); await __frames(3);
    const d = __grab(lx, ly, 12); let bright = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 225 && d[i + 1] > 190 && d[i + 2] > 110) bright++;
    frames.push({ bright, flame: __count(d, __hex('#ffd98f'), 20) + __count(d, __hex('#e0a05e'), 20), cage: __count(d, __hex('#4a4f57'), 12) + __count(d, __hex('#6e747c'), 12), d });
  }
  row.lit = false; row.cold = S.time;
  __done(); WL.timeScale = 0.001;
  const diff = __diff(frames[0].d, frames[1].d); for (const f of frames) delete f.d;
  return { tier: rw.tier, cold: frames[0], lit: frames[1], diff };
});
r = await ev(() => {
  const K = DATA.T.kin, row = S.legacy.find(x => x.name === __sf.name), e = S.kinErrands.find(x => x.id === __sf.e), st = S.stations[row.town];
  const ms = Memorial.site('town'); WL.tp([ms.x, ms.y + 40]);
  /* taken (G), lit at a lit waylight (L), set back (G): lit, the town warmer */
  const take = Systems.getInteractions().find(i => i.key === 'G' && /from the stone/.test(i.label)); if (take) take.fn();
  const onPack = S.cargo.find(c => c.kin === e.id); WL.tp('haven'); const L = Systems.getInteractions().find(i => i.key === 'L'); if (L) L.fn();
  WL.tp([ms.x, ms.y + 40]); const l0 = st.likesTo = 40; const back = Systems.getInteractions().find(i => i.key === 'G' && /lit/.test(i.label)); if (back) back.fn();
  const relit1 = !!take && !!onPack && !!L && !!back && row.lit && row.relit === 1 && !row.kept && st.likesTo === l0 + K.relightLikes;
  /* twice — then the kin keep it */
  Republic.kinTakeLantern({ kind: 'relight', state: 'closed' });
  const e2 = { id: 'kinR2', town: row.town, fallen: row.name, kin: row.kin, kind: 'relight', t: S.time, state: 'open' }; S.kinErrands.push(e2); row.lit = false; row.cold = S.time;
  const took2 = Republic.kinTakeLantern(e2); const lt = S.cargo.find(c => c.kin === 'kinR2'); lt.lit = true; lt.litT = S.time;
  const back2 = Systems.getInteractions().find(i => i.key === 'G' && /lit/.test(i.label)); if (back2) back2.fn();
  const kept = took2 && row.relit === 2 && row.kept === true;
  /* left its days, the kin light it themselves */
  const row2 = S.legacy.find(x => x.fact === 'town' && x.name !== row.name) || row;
  const e3 = { id: 'kinR3', town: row2.town, fallen: row2.name, kin: 'Ansel Test', kind: 'relight', t: S.time - K.errandDays * DATA.T.dayLen - 1, state: 'open' }; S.kinErrands.push(e3);
  row2.lit = false; row2.kept = false; row2.relit = 0; S.mails.length = 0; Republic.tick(0.02);
  const themselves = e3.state === 'gone' && row2.lit === true && S.mails.some(m => /carried the lantern to the waylight myself/.test(m.body));
  WL.tp('haven');
  return { relit1, kept, themselves };
});
ok('THE STONE\'S FLAME: a lantern set lit at a stone burns through the night it was set and goes out at the next dark — the kin ask again (the mail, the lesson, the stone\'s flame on the compass); the cold lantern stands at the stone — dark, no flame (pixel-sampled against the same stone\'s lantern lit); taken from it (G), given a flame at a lit waylight (L), set back (G), it burns and the town is warmer; twice, and the kin keep it themselves; left its days, the kin carry it to the waylight themselves',
  sf1.row && sf1.out && sf1.compass && coldSeen.cold.bright === 0 && coldSeen.cold.flame === 0 && coldSeen.cold.cage > 20 && coldSeen.lit.bright > 10 && coldSeen.diff > 20 && r.relit1 && r.kept && r.themselves, JSON.stringify(sf1) + ' seen=' + JSON.stringify(coldSeen) + ' ' + JSON.stringify(r));

/* ================= 5 · THE TRUCE AS A ROAD ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  for (const cd of DATA.camps) { const x = S.camps[cd.id]; x.taken = null; x.pacified = false; x.truce = 0; x.pact = null; x.grudge = null; x.truceRuns = 0; x.ragsDown = null; x.roadKept = 0; }
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && !x.lent); S.cov = 0.6; NPC.assignRoute(n, 'foundry', 'pharos');
  const closed = !Republic.truceRoadFor('foundry', 'pharos') && !Republic.truceRoads().length && !Republic.crossable(ash) && Republic.roadsThrough(ash).length === 1;
  c.truce = S.time;
  const tr = Republic.truceRoads().find(x => x.cd.id === 'ash');
  const open = Republic.truceRoadFor('foundry', 'pharos') === ash && Republic.crossable(ash) && !!tr && tr.cross.length === 2 && tr.cross.every(p => Math.abs(U.dist(p.x, p.y, ash.x, ash.y) - ash.r) < 1);
  const rc = Republic.ringCross(DATA.stations.foundry.x, DATA.stations.foundry.y + 40, DATA.stations.pharos.x, DATA.stations.pharos.y + 40, ash);
  const cross = !!rc && rc.length === 2 && rc[0].t < rc[1].t;
  UI.campRollHTML(ash, false); const roll = /truce road|THE TRUCE ROAD|crosses the ring/i.test(UI.campRollHTML(ash, false));
  window.__tr = { x: tr && tr.cross[0].x, y: tr && tr.cross[0].y, npc: n.id };
  return { closed, open, cross, roll };
});
const tr1 = r;
await drain();
const rags = await ev(async () => {
  const p = __tr; __at(0.3); S.camps.ash.runners = [];
  await __look(p.x, p.y - 6, 3, 160, 140);
  /* the stake stands on the crossing, 7×13 at 2.5: the rag on rows 1–4 (about ten units up), the pole down to the ground */
  const A1 = __grab(p.x, p.y - 10.5, 16), A2 = __grab(p.x, p.y, 30), label = Render.labelBoxes().some(b => b.str === 'THE TRUCE ROAD');
  const t0 = S.camps.ash.truce; S.camps.ash.truce = 0; await __wait(150); await __frames(3); const B1 = __grab(p.x, p.y - 10.5, 16), B2 = __grab(p.x, p.y, 30); S.camps.ash.truce = t0;
  const a = __newCol(A1, B1, [__hex('#e8e0c8'), __hex('#b8b09a')], 16), b = __newCol(A2, B2, [__hex('#4a3320'), __hex('#33241e')], 14), stake = __diff(A2, B2);
  /* the survey sheet draws the road dashed across the ring with its name */
  UI.toggleMap(true); UI.drawMap(); const n = S.npcs.find(x => x.id === p.npc);
  const txt = []; const ctx = document.getElementById('map').getContext('2d'), ft = ctx.fillText; ctx.fillText = function (s2, ...rest) { txt.push(String(s2)); return ft.call(this, s2, ...rest); }; UI.drawMap(); ctx.fillText = ft;
  UI.toggleMap(false);
  __done(); WL.timeScale = 0.001;
  return { rag: a, pole: b, stake, label, sheet: txt.some(s2 => new RegExp(`THE TRUCE ROAD — ${n.name.split(' ')[0].toUpperCase()}'S RUN`).test(s2)) };
});
ok('THE TRUCE AS A ROAD: a charter run whose line crosses a hostile ring is no truce road (the ring counted as a road through it, closed); at truce the ring opens to it — the crossing points where the line meets the ring; the camp\'s roll names it; seen: the white rags on their stakes at the crossing with THE TRUCE ROAD on the ground (pixel-sampled against the same frame hostile); the survey sheet draws it across the ring with THE TRUCE ROAD — <RUNNER>\'S RUN',
  tr1.closed && tr1.open && tr1.cross && tr1.roll && rags.rag > 20 && rags.pole > 10 && rags.stake > 60 && rags.label && rags.sheet, JSON.stringify(tr1) + ' ' + JSON.stringify(rags));

/* ================= 6 · THE CHIEF'S RUNNER ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, P = DATA.T.parley;
  c.truce = 0; c.pact = { t: S.time - (P.pactDays - 1) * DATA.T.dayLen - 1 }; S.giftRunner = null;
  Republic.tick(0.02);
  const g = S.giftRunner, to = DATA.stationOrder.filter(id => S.stations[id].connected).sort((a, b) => U.dist(ash.x, ash.y, DATA.stations[a].x, DATA.stations[a].y) - U.dist(ash.x, ash.y, DATA.stations[b].x, DATA.stations[b].y))[0];
  const sent = !!g && g.to === to && !g.back && !!c.pact.giftSent;
  WL.tp([ash.x + 600, ash.y + 700]); for (let i = 0; i < 40; i++) UI.tick();
  const compass = [...document.querySelectorAll('#compassInner .cMark')].some(m => /a runner — a gift/.test(m.title));
  window.__gr = { x: g && g.x, y: g && g.y };
  return { sent, to, compass };
});
const gr1 = r;
await drain();
const bundle = await ev(async () => {
  const g = S.giftRunner; g.x = __gr.x + 160; g.y = __gr.y + 160; g.dir = 0; g.moving = false; __at(0.3); S.camps.ash.runners = [];
  await __look(g.x, g.y - 20, 3, 140, 110);
  /* facing east the bundle rides behind him at the knife's anchor [8,17] on his 32×32 grid at 2.5 — cols 8–14, rows 17–21:
     x −20…−2.5, y −32.5…−20 from his foot; behind his back, so its trailing columns show */
  const A = __grab(g.x - 11, g.y - 26, 22), label = Render.labelBoxes().some(b => b.str === 'A RUNNER FROM THE FIRE — A GIFT');
  /* the same frame, the same knife, the bundle's glyph blanked */
  const CO = SPRITES.COURIER, G0 = CO.glyphs.gift; CO.glyphs.gift = G0.map(rw => rw.replace(/./g, '.')); await __wait(120); await __frames(3); const B = __grab(g.x - 11, g.y - 26, 22); CO.glyphs.gift = G0;
  const x0 = g.x; g.x += 6000; await __wait(120); await __frames(3); const C = __grab(x0 - 11, g.y - 26, 22); g.x = x0;
  __done(); WL.timeScale = 0.001;
  return { cloth: __newCol(A, B, [__hex('#e8e0c8'), __hex('#b8b09a')], 12), twine: __newCol(A, B, [__hex('#a08050')], 12), bundle: __diff(A, B), him: __diff(A, C), label };
});
r = await ev(() => {
  const g = S.giftRunner, P = DATA.T.parley, dest = DATA.stations[g.to], b0 = { metal: S.banked.metal, provisions: S.banked.provisions };
  g.x = dest.x + 10; g.y = dest.y + 46; S.mails.length = 0; Republic.tick(0.1);
  const gift = !S.giftRunner && S.banked.metal === b0.metal + P.giftBack.metal && S.banked.provisions === b0.provisions + P.giftBack.provisions && S.mails.some(m => /'s runner at /.test(m.subj)) && !!S.flags.tut.firstGiftRunner;
  /* the word broken while he walks: he turns back, and nothing comes */
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash; c.pact = { t: S.time - (P.pactDays - 1) * DATA.T.dayLen - 1 }; S.giftRunner = null; Republic.tick(0.02);
  const g2 = S.giftRunner; c.pact = null; const b1 = S.banked.metal; Republic.tick(0.1);
  const turned = !!g2 && g2.back && __says.some(s => s.str === 'The word\'s broken. Back to the fire.');
  g2.x = ash.x + 5; g2.y = ash.y; Republic.tick(0.1);
  const nothing = !S.giftRunner && S.banked.metal === b1;
  return { gift, turned, nothing };
});
ok('THE CHIEF\'S RUNNER: on the pact\'s last day a runner leaves the fire for the nearest lit door; the compass marks him; he carries a bundle on his back (v3.51: lashed at the knife\'s own anchors — its cloth and twine pixel-sampled against the same knife in the same frame without it) with A RUNNER FROM THE FIRE — A GIFT on the ground; arriving, the bank takes the gift (metal and provisions, the mail, the lesson); if the word breaks while he walks he turns back and nothing comes',
  gr1.sent && gr1.compass && bundle.cloth > 20 && bundle.twine > 10 && bundle.him > bundle.bundle && bundle.label && Object.values(r).every(Boolean), JSON.stringify(gr1) + ' ' + JSON.stringify(bundle) + ' ' + JSON.stringify(r));

/* ================= 7 · THE SCORE SETTLED ================= */
r = await ev(() => {
  const ridge = DATA.camps.find(c => c.id === 'ridge');
  for (const cd of DATA.camps) { const x = S.camps[cd.id]; x.taken = null; x.pacified = false; x.pact = null; x.truce = 0; x.runners = []; }
  S.giftRunner = null; Republic.settleStones().length = 0; S.settle = null;
  const [n] = __crew(1); n.cx = S.px; n.cy = S.py;
  S.scores = { ridge: { t: S.time - 50, npc: n.id, name: n.name, why: 'felled' } };
  S.camps.ridge.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 2, stormDay: -1 }; S.camps.ridge.pacified = true;
  Republic.scorePaid(ridge, 'taken');
  MusterUI.open(n.id); const plate = /RIDGE CAMP IS PAID — WALK/.test(document.getElementById('musterBody').textContent.toUpperCase()); MusterUI.close();
  /* walked to the ring's edge with them in the party, the one who fell steps out, says it, sets the stones */
  WL.tp([ridge.x, ridge.y + ridge.r + 120]); n.cx = S.px + 20; n.cy = S.py + 20; __says.length = 0;
  Republic.tick(0.02);
  const started = !!S.settle && S.settle.npc === n.id;
  for (let i = 0; i < 120 && S.settle; i++) { NPC.update(0.1); Republic.tick(0.1); }
  const st2 = Republic.settleStones().find(x => x.camp === 'ridge' && x.npc === n.id);
  const said = __says.some(s => (DATA.settleLines.taken || []).includes(s.str.replace('Ridge Camp', '{camp}')) || /Ridge Camp/.test(s.str) || /Square/.test(s.str));
  const settled = !S.settle && !!st2 && !Republic.scores().ridge && (n.settled || []).some(x => x.camp === 'ridge') && S.mails.some(m => m.subj === 'The score with Ridge Camp, settled') && !!S.flags.tut.firstSettled && NPC.mood(n).causes.some(c => c.id === 'settled');
  MusterUI.open(n.id); const plate2 = /SETTLED AT RIDGE CAMP/.test(document.getElementById('musterBody').textContent.toUpperCase()); MusterUI.close();
  const roll = /settled|stones/i.test(UI.campRollHTML(ridge, false));
  /* paid and never walked in three days: let go */
  const n2 = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && !x.lent); S.scores.pass = { t: S.time, npc: n2.id, name: n2.name, why: 'felled', paid: 'taken', paidT: S.time - DATA.T.score.walkDays * DATA.T.dayLen - 1 }; S.mails.length = 0; Republic.tick(0.02);
  const letGo = !S.scores.pass && S.mails.some(m => m.subj === 'The score with Pass Camp, let go');
  window.__st = { x: st2 && st2.x, y: st2 && st2.y };
  return { plate, started, said, settled, plate2, roll, letGo };
});
const sc1 = r;
await drain();
const stonesSeen = await ev(async () => {
  const st2 = Republic.settleStones().find(x => x.camp === 'ridge'); if (!st2) return { none: true };
  __at(0.3); for (const x of NPC.party()) { x.cx = st2.x + 140; x.cy = st2.y + 90; } S.camps.ridge.runners = [];
  await __look(st2.x, st2.y - 6, 3, 60, 40);
  const zones = [[st2.x, st2.y - 5, 8], [st2.x, st2.y - 4, 14]], A = zones.map(z => __grab(...z)), label = Render.labelBoxes().some(b => /— SETTLED$/.test(b.str));
  const x0 = st2.x; st2.x += 6000; await __wait(150); await __frames(3); const B = zones.map(z => __grab(...z)); st2.x = x0;
  const red = (a, b) => { let n = 0; for (let i = 0; i < Math.min(a.length, b.length); i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60 && a[i] > a[i + 1] + 40 && a[i] > a[i + 2] + 40) n++; return n; };
  __done(); WL.timeScale = 0.001;
  return { thread: red(A[0], B[0]), stones: __diff(A[1], B[1]), label };
});
ok('THE SCORE SETTLED: the take pays the score, not yet settled — the plate says RIDGE CAMP IS PAID — WALK <NAME> THERE; at the ring\'s edge with them in the party the one who fell steps out toward the camp, says it in their own words and sets a stone down — settled (the mail, the lesson, the plate\'s SETTLED AT RIDGE CAMP, a score settled in the mood, the roll); seen: the stones with their red thread and their name on the ground (pixel-sampled against the same frame with the cairn carried off); a score paid and never walked in three days is let go',
  Object.values(sc1).every(Boolean) && stonesSeen.thread > 2 && stonesSeen.stones > 8 && stonesSeen.label, JSON.stringify(sc1) + ' seen=' + JSON.stringify(stonesSeen));

/* ================= 8 · THE LINE'S ORDERS ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash');
  for (const cd of DATA.camps) { const x = S.camps[cd.id]; x.taken = null; x.pacified = false; x.runners = []; x.truce = 0; x.pact = null; }
  S.settle = null; S.scores = {};   // the ridge's stones stay where they were set (the save carries them)
  const crew = __crew(3); S.cargo = S.cargo.filter(x => x.cat === 'tool'); S.ringHold = null;
  WL.tp([ash.x + 200, ash.y + 1600]); UI.toggleMap(true); UI.ringWalk('ash'); UI.toggleMap(false);
  const m = S.moveTo; WL.tp([m.x + 3, m.y + 3]); for (const x of NPC.party()) { x.cx = S.px + 20; x.cy = S.py + 20; }
  Systems.update(0.05, {}); for (let i = 0; i < 60; i++) Systems.update(0.1, {});
  const q = Systems.getInteractions().find(i => i.key === 'Q'); if (q) q.fn();
  const el = document.getElementById('keeperSay');
  const plate = !!q && !el.classList.contains('hidden') && el.classList.contains('line') && el.querySelectorAll('img.lineFace').length === 3 && !!el.querySelector('[data-line="hold"]') && !!el.querySelector('[data-line="come"]');
  return { held: !!S.ringHold, plate };
});
const lo1 = r;
if (lo1.plate) { await page.click('#keeperSay [data-line="hold"]'); await page.waitForTimeout(250); }
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), h = S.ringHold;
  const hold = !!h && h.order === 'hold' && Math.abs(U.dist(h.x, h.y, ash.x, ash.y) - (ash.r - 24)) < 2 && !!S.flags.tut.firstLineOrders;
  for (let i = 0; i < 60; i++) Systems.update(0.1, {});
  for (let i = 0; i < 40; i++) UI.tick(); const compass = [...document.querySelectorAll('#compassInner .cMark')].some(e => /^THE LINE HOLDS · ASH/.test(e.title));
  return { hold, compass };
});
const lo2 = r;
await drain();
const rope = await ev(async () => {
  const h = S.ringHold, ash = DATA.camps.find(c => c.id === 'ash'); __at(0.3); S.camps.ash.runners = [];
  for (let i = 0; i < 40; i++) Systems.update(0.1, {});
  const pt = NPC.party(), mid = { x: pt.reduce((a, n) => a + n.cx, 0) / pt.length, y: pt.reduce((a, n) => a + n.cy, 0) / pt.length - 10 };
  await __look(mid.x, mid.y, 3, 0, -200);
  const ropeCol = __hex('#8a6a42'), on = __near(mid.x, mid.y, ropeCol, 10, 60), label = Render.labelBoxes().some(b => b.str === 'THE LINE HOLDS — YOU GO IN ALONE');
  h.order = null; await __wait(120); await __frames(3); const off = __near(mid.x, mid.y, ropeCol, 10, 60); h.order = 'hold';
  /* a knife that comes out after you near the line is turned back to his fire: the U of the way back over his hood */
  const n0 = pt[0], k = { x: n0.cx + 40, y: n0.cy, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }; S.camps.ash.runners = [k];
  const dIn = Math.max(1, U.dist(h.x, h.y, ash.x, ash.y)); WL.tp([h.x + (ash.x - h.x) / dIn * 220, h.y + (ash.y - h.y) / dIn * 220]); S.cargo.push(State.makeItem('metal')); S.state = 'walk';
  const met0 = NPC.svc(n0).met || 0; __says.length = 0;
  Systems.update(0.02, {});
  const turned = !!k.turnedT && k.cd >= 13 && (NPC.svc(n0).met || 0) >= met0 + 1 && /turned a knife at the line/.test(NPC.svc(n0).last) && __says.some(s => ['Not past us.', 'Back to your fire.', 'This is our edge.'].includes(s.str)) && __says.some(s => ['Hah— fine.', 'Not worth it.', 'Back. BACK.'].includes(s.str));
  Render.cam.x = k.x; Render.cam.y = k.y - 30; await __wait(120); await __frames(3);
  const uCol = __hex(SPRITES.MARK_PAL[[...SPRITES.MARKS.turned.join('')].find(ch => ch !== '.' && ch !== 'O')]);
  const uOn = __near(k.x, k.y - 45, uCol, 12, 30); const tT = k.turnedT; k.turnedT = 0; await __wait(120); await __frames(3); const uOff = __near(k.x, k.y - 45, uCol, 12, 30); k.turnedT = tT;
  S.camps.ash.runners = []; S.cargo = S.cargo.filter(x => x.cat === 'tool');
  __done(); WL.timeScale = 0.001;
  return { on, off, label, turned, uOn, uOff };
});
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), h = S.ringHold;
  /* walk back out past them and they fall in */
  WL.tp([h.x + 10, h.y + 10]); h.wentIn = true; Systems.update(0.05, {}); const fallIn = !S.ringHold;
  /* COME: a real click on the line's plate — the line forms on the Walker and walks in abreast */
  const m = { x: h.x, y: h.y }; S.ringHold = { camp: 'ash', x: m.x, y: m.y, t: S.time }; for (const x of NPC.party()) { x.cx = m.x + 10; x.cy = m.y + 10; }
  window.__edge = m;   // where the line stood: the way out of the ring runs back through it
  UI.lineOrders();
  return { fallIn, plate: !!document.querySelector('#keeperSay [data-line="come"]') };
});
const lo3 = r;
if (lo3.plate) { await page.click('#keeperSay [data-line="come"]'); await page.waitForTimeout(250); }
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), h = S.ringHold;
  const come = !!h && h.order === 'come';
  for (let i = 0; i < 40; i++) UI.tick(); const compass = [...document.querySelectorAll('#compassInner .cMark')].some(e => /^THE LINE COMES · ASH/.test(e.title));
  /* a knife will not close on it and gives ground */
  const dIn = Math.max(1, U.dist(h.x, h.y, ash.x, ash.y)); WL.tp([h.x + (ash.x - h.x) / dIn * 200, h.y + (ash.y - h.y) / dIn * 200]); S.cargo.push(State.makeItem('metal')); S.state = 'walk'; S.health = 100;
  const k = { x: S.px + 70, y: S.py, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }; S.camps.ash.runners = [k]; const d0 = U.dist(k.x, k.y, S.px, S.py);
  for (let i = 0; i < 5; i++) Systems.update(0.1, {});
  const gives = U.dist(k.x, k.y, S.px, S.py) > d0 && S.health === 100;
  /* in past the ring's edge with it, then out past the edge again: it breaks back into the wedge */
  S.camps.ash.runners = []; const e0 = __edge, eL = Math.max(1, U.dist(e0.x, e0.y, ash.x, ash.y)), ux = (e0.x - ash.x) / eL, uy = (e0.y - ash.y) / eL;
  WL.tp([ash.x + ux * (ash.r - 80), ash.y + uy * (ash.r - 80)]); Systems.update(0.05, {}); const inside = !!S.ringHold && !!S.ringHold.cameIn;
  WL.tp([ash.x + ux * (ash.r + 150), ash.y + uy * (ash.r + 150)]); Systems.update(0.05, {});
  const breaks = inside && !S.ringHold;
  S.cargo = S.cargo.filter(x => x.cat === 'tool'); __hideSay(); WL.tp('haven');
  return { come, compass, gives, breaks };
});
ok('THE LINE\'S ORDERS: at a held line the rail prints Q and the line\'s plate carries every back\'s face and two orders; a real click on HOLD steps the line up to the ring\'s very edge (the lesson; THE LINE HOLDS · ASH on the compass) with a rope strung hand to hand along the backs (pixel-sampled against the same frame without the order) and THE LINE HOLDS — YOU GO IN ALONE on the ground; a knife that comes out after you near the line is turned back to his fire — the backs\' words and his, the back credited on their plate, the U of the way back over his hood (pixel-sampled against the same frame without it); walked back out past them they fall in; a real click on COME forms the line on the Walker (THE LINE COMES · ASH): a knife will not close on it and gives ground, and out past the ring\'s edge the line breaks back into the wedge',
  lo1.held && lo1.plate && lo2.hold && lo2.compass && rope.on > rope.off + 6 && rope.label && rope.turned && rope.uOn > rope.uOff + 4 && lo3.fallIn && lo3.plate && Object.values(r).every(Boolean),
  JSON.stringify(lo1) + ' ' + JSON.stringify(lo2) + ' ' + JSON.stringify(rope) + ' ' + JSON.stringify(lo3) + ' ' + JSON.stringify(r));

/* ================= 9 · THE SAVE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash');
  Economy.wireWord('green', 'kept', 'a folded blanket'); const nW = S.wireWords.length;
  S.camps.ash.truce = S.time; S.camps.ash.truceRuns = 3; S.giftRunner = { camp: 'ash', to: 'foundry', x: ash.x, y: ash.y, wa: 0, back: false, moving: false, dir: 0 };
  const nStones = Republic.settleStones().length;
  State.save(); State.load();
  const wire = (S.wireWords || []).length === nW;
  const truce = Republic.truceAt(ash) && S.camps.ash.truceRuns === 3;
  const stones = Republic.settleStones().length === nStones && nStones >= 1;
  const keepsake = S.legacy.some(x => x.fact === 'town' && x.lit) && (S.kinErrands || []).length > 0;
  S.giftRunner = null; S.wireWords = [];
  return { wire, truce, stones, keepsake };
});
ok('THE SAVE: the words on the wire, a truce and the runs it carried, the settled stones and the stones\' flames with the kin\'s errands survive a save and load',
  Object.values(r).every(Boolean), JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
await T.finish('the word carried');
