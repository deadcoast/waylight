/* answered.mjs — v3.47 THE WORD ANSWERED (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). What it proves: the word answered (a door that never saw you keep a
   word hears it kept three times down the wire and posts its errand on the wire's word; a door that hears it broken twice
   shuts by hearsay until it sees you do right at its own door); the keepsake set down (the thing at the fallen's stone, once);
   the road kept (the road's gift by a real click and walked to the chief — the gold knot; run out ungifted, a new man and the
   rags down; the white rag on its switch on the truce road, and the knives letting the loaded Walker by); the stone's keeping
   (the backs' pause at a cairn, the kick when the camp is up again, the score again); the line's watch (a third order: the
   line left at the ring's edge for the night with its fire, the camp kept in, home at dawn, called in early); the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const drain = async () => { await ev(() => { WL.timeScale = 1; }); await T.drain(); await ev(() => { WL.timeScale = 0.001; }); };
await ev(() => {
  for (const id of DATA.stationOrder) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources();
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  for (let i = 0; i < 6; i++) S.npcs.push(NPC.gen({ at: 'haven' }));
  window.__says = []; const sy = Render.say; Render.say = (x, y, str, col, who) => { __says.push({ str: String(str), col }); return sy(x, y, str, col, who); };
  window.__die = (v, fn) => { const r0 = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = r0; } };
  window.__at = f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; };
  window.__look = async (x, y, zoom = 3, dx = 150, dy = 120) => { WL.tp([x + dx, y + dy]); S.weather.state = 'clear'; __clearAmb(x, y, 360); Render.clearFx(); Render.setFx(false); Render.setZoom(zoom); Render.cam.x = x; Render.cam.y = y; WL.timeScale = 0.001; await __wait(300); await __frames(3); };
  window.__hideSay = () => document.getElementById('keeperSay').classList.add('hidden');
  window.__newCol = (a, b, cols, tol) => { let n = 0; for (let i = 0; i < Math.min(a.length, b.length); i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60 && cols.some(c => Math.abs(a[i] - c[0]) < tol && Math.abs(a[i + 1] - c[1]) < tol && Math.abs(a[i + 2] - c[2]) < tol)) n++; return n; };   // pixels of these colours that the thing put there
  window.__blank = rows => rows.map(rw => rw.replace(/./g, '.'));   // the same glyph, every texel empty: the same frame without the thing
  window.__crew = k => { for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; } const pool = S.npcs.filter(x => x.state === 'pool' && x.at === 'haven' && !x.lent).slice(0, k); for (const x of pool) { NPC.hire(x, 'companion'); x.hungry = false; x.shoveCd = 0; } return pool; };
  /* words heard down the wire, landing now at a door (from Haven's book) */
  window.__land = (to, kind, n) => { for (let i = 0; i < n; i++) S.wireWords.push({ id: 'aw' + U.uid(), from: 'haven', to, kind, name: 'a test word', t0: S.time - 1, eta: S.time - 0.01 }); Economy.update(0.01); };
  window.__mk = (el, k) => [...el.querySelectorAll('img')].some(i => i.getAttribute('src') === UI.markURL(k));
  window.__sheet = () => { UI.toggleMap(true); const txt = [], ctx = document.getElementById('map').getContext('2d'), ft = ctx.fillText; ctx.fillText = function (s2, ...rest) { txt.push(String(s2)); return ft.call(this, s2, ...rest); }; UI.drawMap(); ctx.fillText = ft; UI.toggleMap(false); return txt; };
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const inPal = (rows, pal, w, h) => rows.length === h && rows.every(rw => rw.length === w) && [...new Set(rows.join('').replace(/\./g, ''))].every(ch => pal[ch]);
  const SEVEN = ['answered', 'hearsay', 'setdown', 'roadkept', 'ragsdown', 'kicked', 'watch'];
  const marks = SEVEN.every(k => inPal(SPRITES.MARKS[k], SPRITES.MARK_PAL, 7, 7)) && new Set(SEVEN.map(k => SPRITES.MARKS[k].join(''))).size === 7;
  const KS = SPRITES.KEEPSAKE_SET, things = Object.keys(SPRITES.KEEPSAKES);
  const setDown = things.length === 6 && things.every(k => KS[k] && KS[k].every(rw => rw.length === KS[k][0].length) && [...new Set(KS[k].join('').replace(/\./g, ''))].every(ch => SPRITES.TOKEN_PAL[ch]) && KS[k].join('').replace(/\./g, '').length > SPRITES.KEEPSAKES[k].token.join('').replace(/\./g, '').length) && new Set(things.map(k => KS[k].join(''))).size === 6;   // drawn as they lie, larger than the token that hung under the pack
  const TP = SPRITES.TRUCE_KEPT_PAL, K1 = SPRITES.TRUCESTAKE_KEPT.join(''), B1 = SPRITES.TRUCESTAKE_BARE.join('');
  const stakes = inPal(SPRITES.TRUCESTAKE_KEPT, TP, 7, 13) && /F/.test(K1) && inPal(SPRITES.TRUCESTAKE_BARE, TP, 7, 13) && !/K/.test(B1) && /k/.test(B1) && inPal(SPRITES.RAG_DOWN, TP, 8, 4) && /K/.test(SPRITES.RAG_DOWN.join(''));   // the gold knot; the pole stripped to a scrap on the nail; the rag in the dirt
  const down = inPal(SPRITES.SETTLESTONE_DOWN, SPRITES.SETTLE_PAL, 10, 5) && /R/.test(SPRITES.SETTLESTONE_DOWN.join(''));
  const WF = SPRITES.WATCHFIRE, fire = WF.length === 2 && WF.every(f => inPal(f, SPRITES.WATCHFIRE_PAL, 9, 8)) && WF[0].join('') !== WF[1].join('') && WF[0].slice(6).join('') === WF[1].slice(6).join('');   // two flames over one laid fire (its stones and logs)
  const CO = SPRITES.COURIER, rag = CO.glyphs.rag;   // v3.50: the rag on its switch rides the courier's own grid, its anchor set by facing (RAG_CELLS retired)
  const ragOk = rag.length === 9 && rag.every(rw => rw.length === 4) && [...new Set(rag.join('').replace(/\./g, ''))].every(ch => TP[ch]) && /K/.test(rag.join('')) && ['E', 'S', 'N'].every(fc => { const a = CO.at[fc].rag; return Array.isArray(a) && a[0] >= 0 && a[0] + 4 <= 32 && a[1] >= 0 && a[1] + 9 <= 32; });
  const red = h => { const [r0, g0, b0] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); return r0 > g0 + 60 && r0 > b0 + 60; };
  const tg = Render.cargoGlyph({ defId: 'fireGift', kg: 6, cat: 'gift' }), tgCh = tg.rows.join('').replace(/\./g, '').split(''), pgCh = CO.glyphs.gift.join('').replace(/\./g, '').split('');
  const gift = tg.rows.length === 6 && tg.rows.every(rw => rw.length === 8) && tgCh.every(ch => tg.pal[ch]) && !tgCh.some(ch => red(tg.pal[ch])) && pgCh.every(ch => CO.glyphPal[ch]) && !pgCh.some(ch => red(CO.glyphPal[ch]));   // THE GIFT'S CORD: twine, never a red cross — on the tower and on the pack
  const T2 = DATA.T, rows = T2.word.answer.kept === 3 && T2.word.answer.broken === 2 && T2.kin.setLikes === 3 && T2.kin.setAppr === 4 && T2.kin.setR === 60 && T2.road.gift.provisions === 30 && T2.road.gift.metal === 20 && T2.road.kg === 6 && T2.road.reach === 150 && T2.road.roadW === 70 && T2.road.bareDays === 1 && T2.stone.passR === 70 && T2.stone.pauseT === 1.6 && T2.stone.passCd === 240 && T2.stone.moodDays === 1 && T2.stone.walk === 5 && T2.stone.kick === 1.2 && T2.watch.speed === 84 && T2.watch.fallInR === 260 && T2.watch.fireR === 76 && T2.watch.moodDays === 1;
  const item = !!DATA.items.fireGift && DATA.items.fireGift.kg === 6 && DATA.items.fireGift.cat === 'gift';
  const voices = DATA.stationOrder.every(id => ['answered', 'hearsay', 'seen'].every(k => typeof DATA.keeperGrief[id][k] === 'string') && /\{town\}/.test(DATA.keeperGrief[id].answered)) && things.every(k => /\{first\}/.test(DATA.keepsakeSetLines[k] || '')) && ['own', 'others', 'kicked', 'kicker'].every(k => DATA.stoneLines[k].length >= 2) && ['kept', 'down', 'walk', 'gift'].every(k => DATA.roadLines[k].length >= 2) && ['order', 'dark', 'dawn', 'inside', 'home'].every(k => DATA.watchLines[k].length >= 2);
  const causes = MUSTER.MOOD.causes.cairn.v > 0 && MUSTER.MOOD.causes.watched.v > 0, causesN = Object.keys(MUSTER.MOOD.causes).length;
  const lessons = ['firstAnswered', 'firstHearsay', 'firstKeepsakeSet', 'firstRoadKept', 'firstRagsDown', 'firstStonesKicked', 'firstWatch'].filter(k => DATA.tutorials[k] && DATA.tutorialTitles[k]).length, lessonsN = Object.keys(DATA.tutorials).length;
  return { marks, setDown, stakes, down, fire, ragOk, gift, rows, item, voices, causes, causesN, lessons, lessonsN };
});
ok('THE REGISTRIES: seven 7×7 marks (the word answered, shut by hearsay, set down, the road kept, the rags down, kicked over, the watch); the six keepsakes as they lie at a stone on the token\'s palette, larger than the token; the truce stake kept (a gold knot) and stripped (a scrap left on the nail), the rag in the dirt; the settled stones kicked over (the red thread loose); the watch fire in two frames over one laid fire; the white rag on its switch (v3.50: on the courier\'s own grid, its anchor in every facing — the old rig\'s cells retired) and the road\'s gift in cloth and twine on the tower and on the pack, no red cord; the rows (the answer at three and two, the setting, the road, the stones, the watch); the gift a 6 kg item; every keeper\'s answered, hearsay and seen, the six set lines, the stones\', the road\'s and the watch\'s lines; the cairn and the watch in the mood (v3.49: 31 causes); the seven lessons (v3.49: the manual at 93 pages)',
  Object.entries(r).every(([k, v]) => k === 'causesN' ? v === 31 : k === 'lessonsN' ? v >= 93 : k === 'lessons' ? v === 7 : v === true), JSON.stringify(r));

/* ================= 2 · THE WORD ANSWERED ================= */
r = await ev(() => {
  const X = 'relay', A = DATA.T.word.answer, V = DATA.keeperGrief[X], b = Economy.book(X); S.wireWords = []; S.mails.length = 0;
  __land(X, 'kept', A.kept - 1); const notYet = !b.answered && !Economy.answeredAt(X);
  __land(X, 'kept', 1);
  const o = (Economy.ordersFor(X) || []).find(x => x.errand === X && x.answered);
  const posted = !!b.answered && !!o && Economy.answeredAt(X) && b.kept === 0 && S.mails.some(m => m.subj === 'Relay Hill: the word answered') && !!S.flags.tut.firstAnswered && b.log[0].kind === 'answered';
  if (!o) return { notYet, posted };
  const line = V.answered.replace(/\{town\}/g, DATA.stations[o.to].name);
  WL.tp(X); UI.openStation(X);
  const plate = document.getElementById('keeperLine').textContent.includes(line.slice(0, 40));
  const bl = document.getElementById('bookLine'), header = bl.textContent.includes('AN ERRAND ON THE WIRE\'S WORD') && __mk(bl, 'answered') && !/YOUR WORD/.test(bl.textContent);   // a door that only heard you keeps no counts of its own
  UI.gotoTab('orders'); const card = [...document.querySelectorAll('#stationBody .orderCard')].some(e => e.textContent.includes('THE KEEPER\'S ERRAND · ON THE WIRE\'S WORD'));
  UI.gotoTab('ledger'); const book = document.getElementById('stationBody').textContent.includes('THE WORD ANSWERED — AN ERRAND ON THE WIRE\'S WORD');
  document.getElementById('stationClose').click();
  /* accepted: the wire's credit spent, and the keeper says so to your face */
  __hideSay(); Systems.acceptOrder(o, false);
  const act = S.orders.active.find(x => x.errand === X && x.answered), ks = document.getElementById('keeperSay');
  const spent = !!act && !!b.answeredSpent && !(b.wireCredit > 0) && !Economy.answeredAt(X) && !ks.classList.contains('hidden') && ks.textContent.includes(line.slice(0, 40));
  __hideSay();
  if (!act) return { notYet, posted, plate, header, card, book, spent };
  /* kept at the far door: the door has seen you itself, and the wire posts no more for it */
  WL.tp(act.to); WL.instantPar(); const res = Systems.handleDelivery(act.to), er = res.results.find(x => x.errand);
  const kept = !!er && er.errand.kept === true && b.kept === 1 && b.errands === 1;
  __land(X, 'kept', A.kept); Economy.answer(X);
  const noMore = !(Economy.ordersFor(X) || []).some(x => x.errand === X && x.answered) && !Economy.answeredAt(X) && b.log[0].kind !== 'answered';
  return { notYet, posted, plate, header, card, book, spent, kept, noMore };
});
const wa1 = r;
r = await ev(() => {
  const Y = 'quarry', A = DATA.T.word.answer, V = DATA.keeperGrief[Y], b = Economy.book(Y); S.mails.length = 0;
  __land(Y, 'broken', A.broken - 1); const openStill = !b.shut;
  __land(Y, 'broken', 1);
  const shut = !!b.shut && b.shutBy === 'wire' && S.mails.some(m => m.subj === 'Quarry: shut by what it heard') && !!S.flags.tut.firstHearsay && b.log[0].kind === 'hearsay';
  WL.tp(Y); UI.openStation(Y);
  const bl = document.getElementById('bookLine'), chip = bl.textContent.includes('PROMISES SHUT — BY HEARSAY') && __mk(bl, 'hearsay');
  UI.gotoTab('ledger'); const tx = document.getElementById('stationBody').textContent, ledger = tx.includes('PROMISES SHUT — BY HEARSAY') && tx.includes('SHUT BY HEARSAY');
  document.getElementById('stationClose').click();
  /* a promise asked there is refused, in the keeper's words */
  const g = Economy.grieve({ parcel: { id: 'hq' + U.uid(), to: Y, from: 'haven', kind: 'coat', name: 'a mended coat' } }, 'ground'); __hideSay();
  const refusedW = Economy.giveWord(g.id, 'promise') === false && g.word !== 'promise', ks = document.getElementById('keeperSay');
  const refused = refusedW && !ks.classList.contains('hidden') && ks.textContent.includes(V.hearsay.slice(0, 28)) && !ks.querySelector('[data-word^="promise:"]');
  __hideSay();
  /* a late delivery leaves it shut; one walked through in good time opens it — SEEN AT THE DOOR */
  const pick = () => { for (const g of DATA.stations[Y].needs) S.stations[Y].stock[g] = Math.min(S.stations[Y].stock[g], 20);   // v3.51: Quarry short again — the first delivery filled its shelf, and a board posts only for a shelf that is short
    for (const id of DATA.stationOrder) { if (id === Y || !S.stations[id].connected) continue; const o2 = (Economy.ordersFor(id) || []).find(x => x.to === Y && !x.errand && !x.circuit && !x.convoy && !x.salvage && x.item !== 'parcel'); if (o2) { WL.tp(id); return o2; } } return null; };
  let o2 = pick(); if (!o2) return { openStill, shut, chip, ledger, refused, order: false };
  Systems.acceptOrder(o2, false); const a2 = S.orders.active.find(x => x.to === Y && !x.errand);
  a2.deadline = S.time - 1; WL.tp(Y); const resL = Systems.handleDelivery(Y), gL = resL.results.find(x => x.order && x.order.to === Y);
  const late = !!gL && gL.grade === 'C' && !gL.seen && !!b.shut && b.shutBy === 'wire';
  o2 = pick(); if (!o2) return { openStill, shut, chip, ledger, refused, late, order2: false };
  Systems.acceptOrder(o2, false); WL.tp(Y); WL.instantPar(); const resG = Systems.handleDelivery(Y), gG = resG.results.find(x => x.order && x.order.to === Y);
  const opened = !!gG && gG.grade !== 'C' && typeof gG.seen === 'string' && gG.seen.startsWith(V.seen.slice(0, 20)) && !b.shut && b.log[0].kind === 'seen';
  UI.queueResults(resG.results, null); const rows = document.getElementById('scoreRows').textContent, slip = rows.includes('SEEN AT THE DOOR') && rows.includes(V.seen.slice(0, 24)); document.getElementById('results').classList.add('hidden');
  WL.tp('haven');
  return { openStill, shut, chip, ledger, refused, late, gradeLate: gL && gL.grade, opened, gradeGood: gG && gG.grade, slip };
});
ok('THE WORD ANSWERED: a door that never saw you keep a word counts it kept down the wire — two is not enough; at the third it answers: the keeper\'s errand posts on the wire\'s word (the mail, the lesson, the book); the plate says it in the keeper\'s own voice, the header reads AN ERRAND ON THE WIRE\'S WORD with its mark and no counts of its own, the board\'s card is tagged THE KEEPER\'S ERRAND · ON THE WIRE\'S WORD and Records carry it; accepted, the wire\'s credit is spent and the keeper says so to your face; kept at the far door, the door has seen you itself and the wire posts no more for it. A door that hears your word broken twice shuts BY HEARSAY (the mail, the lesson, the book): the plate\'s chip PROMISES SHUT — BY HEARSAY with its own mark and Records the same; a promise asked there is refused in the keeper\'s words; a late delivery leaves it shut; one walked through in good time opens it — SEEN AT THE DOOR on the slip, in the keeper\'s words',
  Object.values(wa1).every(Boolean) && Object.entries(r).every(([k, v]) => k === 'gradeLate' || k === 'gradeGood' ? true : v === true), JSON.stringify(wa1) + ' ' + JSON.stringify(r));

/* ================= 3 · THE KEEPSAKE SET DOWN ================= */
r = await ev(() => {
  const G = 'green', st = S.stations[G];
  S.rep.held[G] = { t0: S.time, from: G, tithe: 0, shields: 2, riseDay: -1 }; st.likesTo = 45;
  const a = Republic.recruitOwn(G); NPC.setOrder(a, 'hours', 'full'); const fallen = a.name;
  S.kinErrands = []; __at(0.75); __die(0.2, () => Republic.squareRises(G));
  delete S.rep.unlit[G]; st.connected = true; st.litT = 1; State.refreshSources(); __at(0.3);
  const e = S.kinErrands.find(x => x.kind === 'shield'); if (!e) return { errand: false };
  const d = S.drops.find(x => x.item && x.item.kin === e.id); State.addCargo(d.item); S.drops.splice(S.drops.indexOf(d), 1);
  const ms = Memorial.site('town'); Memorial.raise('town'); WL.tp([ms.x, ms.y + 40]);
  const gI = Systems.getInteractions().find(i => i.key === 'G' && /shield/.test(i.label)); if (gI) gI.fn();
  const ks = S.cargo.find(c => c.keepsake); if (!ks) return { errand: true, keepsake: false };
  const first = fallen.split(' ')[0], thing = ks.keepsake.thing, K2 = SPRITES.KEEPSAKES[thing], rw = Republic.keepsakeRow(ks), sl = rw && Memorial.slotFor(rw.ord, 'town');
  if (!sl) return { errand: true, keepsake: true, row: false };
  /* while it rides, the compass marks the fallen's stone */
  WL.tp([ms.x + 700, ms.y + 500]); for (let i = 0; i < 40; i++) UI.tick();
  const compass = [...document.querySelectorAll('#compassInner .cMark')].some(m => m.title.startsWith(`set it down · ${first}`));
  /* at the stone, G sets it down */
  WL.tp([sl.x, sl.y + 40]); const l0 = st.likesTo, ap0 = st.appr || 0; S.mails.length = 0;
  const gS = Systems.getInteractions().find(i => i.key === 'G' && /where it belongs/.test(i.label)); if (gS) gS.fn();
  const leg = S.legacy.find(x => x.fact === 'town' && x.name === fallen);
  const set = !!gS && gS.label.includes(`${first}'s ${K2.name}`) && gS.label.includes(`at ${first}'s stone`) && !S.cargo.includes(ks) && !!leg && leg.keepsake === thing && st.likesTo === Math.min(100, l0 + DATA.T.kin.setLikes) && Math.round((st.appr || 0) - ap0) === DATA.T.kin.setAppr;
  const setLine = DATA.keepsakeSetLines[thing].replace(/\{first\}/g, first);
  const letter = S.mails.some(m => m.subj === `${ks.keepsake.kin}: ${first}'s ${K2.name}` && m.body.includes(setLine.slice(0, 40)) && m.body.includes('I won\'t write again.')) && !!S.flags.tut.firstKeepsakeSet;
  /* a stone takes its keepsake once */
  const once = Republic.keepsakeRow({ id: 'ks2', keepsake: { ...ks.keepsake } }) === null;
  Memorial.revealGround('town'); Memorial.open('town');
  const card = [...document.querySelectorAll('#memBody .memCard')].some(el => el.textContent.includes(first) && el.textContent.includes(`the ${K2.name} at the stone — you set it down`)); Memorial.close();
  window.__ksd = { fallen, thing };
  return { errand: true, keepsake: true, thing, compass, set, letter, once, card };
});
const ks1 = r;
await drain();
const ksSeen = await ev(async () => {
  if (!window.__ksd) return { none: true };
  const leg = S.legacy.find(x => x.fact === 'town' && x.name === __ksd.fallen), rw = Memorial.rows('town').find(x => x.name === __ksd.fallen), sl = Memorial.slotFor(rw.ord, 'town');
  /* the thing lies at the stone's foot: centred on x+3, its foot 3 below the stone's (9 rows at 3, 11 at 3, 14 at 3.5), two a texel */
  const K5 = SPRITES.KEEPSAKE_SET[leg.keepsake], fy = sl.y + { small: 9 * 3, mid: 11 * 3, grand: 14 * 3.5 }[rw.tier] * 0.5 + 3, cx0 = sl.x + 3, cy0 = fy - K5.length;
  __at(0.3); await __look(cx0, cy0, 3, 150, 120);
  const A = __grab(cx0, cy0, 22); const k0 = leg.keepsake; leg.keepsake = null; await __wait(150); await __frames(3); const B = __grab(cx0, cy0, 22); leg.keepsake = k0;
  const cols = [...new Set(K5.join('').replace(/[.O]/g, ''))].map(ch => __hex(SPRITES.TOKEN_PAL[ch]));
  __done(); WL.timeScale = 0.001;
  return { tier: rw.tier, own: __newCol(A, B, cols, 14), diff: __diff(A, B) };
});
ok('THE KEEPSAKE SET DOWN: while the keepsake rides, the compass marks the fallen\'s stone (set it down · the name); at the stone G sets it down — it leaves the pack, the stone\'s row wears it, the town is three likes and four of appreciation warmer, and the kin write one last time in their own line for that thing (the mail, the lesson); the thing lies at the foot of the stone, drawn as it lies (its own colours pixel-sampled against the same frame without it); the memorial card says it — you set it down; a stone takes its keepsake once',
  Object.entries(ks1).every(([k, v]) => k === 'thing' || v === true) && ksSeen.own > 20 && ksSeen.diff > 30, JSON.stringify(ks1) + ' seen=' + JSON.stringify(ksSeen));

/* ================= 4 · THE ROAD KEPT ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  for (const cd of DATA.camps) { const x = S.camps[cd.id]; x.taken = null; x.pacified = false; x.truce = 0; x.pact = null; x.grudge = null; x.ragsDown = null; x.roadKept = 0; x.roadOpen = null; x.runners = []; }
  S.giftRunner = null; S.moveTo = null; S.cargo = S.cargo.filter(x => x.cat === 'tool');
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && !x.lent); NPC.assignRoute(n, 'foundry', 'pharos');
  const closed = !Republic.roadCamps().some(cd => cd.id === 'ash');
  c.pact = { t: S.time, kept: 0 }; Republic.tick(0.02);   // your word at his fire, a charter road through his ring
  const tr = Republic.truceRoads().find(x => x.cd.id === 'ash');
  const offered = !!tr && tr.cross.length === 2 && Republic.roadCamps().some(cd => cd.id === 'ash') && !Republic.giftFor('ash') && !!c.roadOpen && c.roadOpen.pts.length === 2;
  if (!tr || tr.cross.length < 2) return { closed, offered };
  const [c0, c1] = tr.cross, on = { x: c0.x + (c1.x - c0.x) * 0.2, y: c0.y + (c1.y - c0.y) * 0.2 }, L = Math.max(1, U.dist(c0.x, c0.y, c1.x, c1.y)), nx = -(c1.y - c0.y) / L, ny = (c1.x - c0.x) / L;
  const sg = U.dist(on.x + nx * 200, on.y + ny * 200, ash.x, ash.y) < U.dist(on.x - nx * 200, on.y - ny * 200, ash.x, ash.y) ? 1 : -1, off = { x: on.x + nx * 200 * sg, y: on.y + ny * 200 * sg };
  WL.tp([on.x, on.y]); const onRoad = Republic.onAnyRoad() && Republic.onRoad(ash);
  WL.tp([off.x, off.y]); const offRoad = !Republic.onAnyRoad() && U.dist(off.x, off.y, ash.x, ash.y) < ash.r * 0.9;
  /* on the road, loaded, the knives let the Walker by and say so; off it, in the same ring, they come */
  const load = p => { WL.tp([p.x, p.y]); S.cargo = S.cargo.filter(x => x.cat === 'tool'); S.cargo.push(State.makeItem('metal')); S.state = 'walk'; S.health = 100; S.bleeding = false; S.stagger = 0; S.struggle = null; S.moveTo = null; };
  load(on); __says.length = 0; c.roadSaid = 0;
  const k1 = { x: on.x + 110, y: on.y + 10, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }; c.runners = [k1];
  __die(0.5, () => { for (let i = 0; i < 16; i++) Systems.update(0.05, {}); });
  const letBy = S.health === 100 && S.cargo.some(x => x.defId === 'metal') && __says.some(s => DATA.roadLines.walk.includes(s.str));
  load(off); const k2 = { x: off.x + 110, y: off.y + 10, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }; c.runners = [k2]; const d0 = U.dist(k2.x, k2.y, S.px, S.py);
  __die(0.5, () => { for (let i = 0; i < 30; i++) Systems.update(0.05, {}); });   // up the ring's slope he comes slower, but he comes
  const comes = U.dist(k2.x, k2.y, S.px, S.py) < d0 - 50 || S.health < 100 || !S.cargo.some(x => x.defId === 'metal');
  c.runners = []; S.health = 100; S.bleeding = false; S.cargo = S.cargo.filter(x => x.cat === 'tool'); S.drops = S.drops.filter(d => !(d.item && d.item.defId === 'metal'));
  /* every lit board offers THE ROAD'S GIFT */
  WL.tp('foundry'); UI.openStation('foundry'); UI.gotoTab('orders');
  const btn = document.querySelector('#stationBody [data-roadgift="ash"]'), cardEl = btn && btn.closest('.orderCard'), card = !!cardEl && cardEl.textContent.includes('THE ROAD\'S GIFT') && cardEl.textContent.includes('For Ash Camp\'s fire') && __mk(cardEl, 'roadkept');
  window.__rd = { on, off, c0, c1, n: n.id, b0: { metal: S.banked.metal, provisions: S.banked.provisions } };
  return { closed, offered, onRoad, offRoad, letBy, comes, card, fireD: Math.round(U.dist(on.x, on.y, ash.x - 30, ash.y + 18)) };
});
const rk1 = r;
if (rk1.card) { await page.click('#stationBody [data-roadgift="ash"]'); await page.waitForTimeout(450); }
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, R = DATA.T.road, it = Republic.giftFor('ash');
  const taken = !!it && it.defId === 'fireGift' && it.name === 'The road\'s gift — for Ash Camp\'s fire' && S.banked.metal === __rd.b0.metal - R.gift.metal && S.banked.provisions === __rd.b0.provisions - R.gift.provisions && !!S.flags.tut.firstRoadKept;
  const onPack = document.getElementById('stationBody').textContent.includes('on your pack — walk it to the fire');
  document.getElementById('stationClose').click();
  return { taken, onPack };
});
const rk2a = r;
await page.waitForTimeout(300);   // the terminal closed, the compass back on the HUD
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, it = Republic.giftFor('ash');
  /* the guide and the compass follow it: the guide's step to his fire, its mark on the strip (it stands in the gift's own mark's place) */
  WL.tp([ash.x + 900, ash.y + 900]); for (let i = 0; i < 40; i++) UI.tick();
  const gt = Guide.target(), cur = Guide.current(), marks = [...document.querySelectorAll('#compassInner .cMark')];
  const guided = !!gt && gt.id === 'roadgift' && Math.abs(gt.x - (ash.x - 30)) < 1 && Math.abs(gt.y - (ash.y + 18)) < 1 && !!cur && cur.head === 'Walk the road\'s gift to Ash Camp\'s fire';
  const compass = guided && (marks.some(m => m.classList.contains('guide') && m.title.startsWith('Ash ')) || marks.some(m => m.title.startsWith('the road\'s gift · Ash')));
  window.__dbgC = { t: marks.map(m => m.title), gt, head: cur && cur.head };
  if (!it) return { compass };
  /* carrying it, the whole ring: off the road the knives let the Walker walk it in */
  WL.tp([__rd.off.x, __rd.off.y]); S.cargo.push(State.makeItem('metal')); S.state = 'walk'; S.health = 100; S.moveTo = null; c.roadSaid = 0; __says.length = 0;
  const k3 = { x: __rd.off.x + 110, y: __rd.off.y + 10, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }; c.runners = [k3];
  __die(0.5, () => { for (let i = 0; i < 16; i++) Systems.update(0.05, {}); });
  const whole = S.health === 100 && S.cargo.some(x => x.defId === 'metal') && S.cargo.includes(it) && __says.some(s => DATA.roadLines.gift.includes(s.str));
  c.runners = []; S.cargo = S.cargo.filter(x => x.cat === 'tool' || x === it);
  /* given at his fire: he keeps the road */
  WL.tp([ash.x - 30, ash.y + 18 + 90]); __says.length = 0; S.mails.length = 0;
  const gI = Systems.getInteractions().find(i => i.key === 'G' && /the road's gift/.test(i.label)); if (gI) gI.fn();
  const kept = !!gI && !Republic.giftFor('ash') && !!c.pact && c.pact.kept === 1 && Math.abs(c.pact.t - S.time) < 1 && c.roadKept > 0 && Republic.pactAt(ash) && __says.some(s => DATA.roadLines.kept.includes(s.str)) && S.mails.some(m => m.subj === 'Ash Camp: the road kept') && UI.campRollHTML(ash, false).includes('the road\'s gift walked to his fire 1 time — the word renewed');
  Republic.tick(0.02);
  const sheet = __sheet().some(s2 => s2 === `THE ROAD KEPT — ${S.npcs.find(x => x.id === __rd.n).name.split(' ')[0].toUpperCase()}'S RUN`);
  return { compass, whole, kept, sheet };
});
const rk2 = { ...rk2a, ...r };
await drain();
const rkSeen = await ev(async () => {
  const P = __rd, CO = SPRITES.COURIER, R0 = CO.glyphs.rag, pale = [__hex('#e8e0c8'), __hex('#b8b09a')];
  S.cargo = S.cargo.filter(x => x.cat === 'tool'); __at(0.3); S.speed = 0; S.moveTo = null; S.camps.ash.runners = [];
  /* the rag flies from its switch at the pack's back corner — facing east, at the courier's own anchor (its cloth three texels
     by five, mirrored on the switch): pale cloth counted where it flies, against the same frame with the rag's glyph blanked */
  const AE = CO.at.E, rc = AE.rag[0] + (AE.ragFlip ? 1 : 2), rr = AE.rag[1] + 3;
  const ragAt = async p => {
    await __look(p.x, p.y - 50, 3, 0, 50); S.dir = 0; Render.faceWalker('E'); await __wait(150); await __frames(3);
    const q = Render.walkerAt(rc, rr), a = __grab(q.x, q.y, 16), road = Republic.onAnyRoad(), fc = Render.walkerDrawn().fc;
    CO.glyphs.rag = __blank(R0); await __wait(120); await __frames(3); const b = __grab(q.x, q.y, 16); CO.glyphs.rag = R0;
    return { road, fc, at: [Math.round(q.x - p.x), Math.round(q.y - p.y)], cloth: __newCol(a, b, pale, 16), diff: __diff(a, b) };
  };
  const on = await ragAt(P.on), off = await ragAt(P.off);
  /* the gold knot new on the pole at the crossing, against the same frame with the plain stake */
  const c0 = P.c0; await __look(c0.x, c0.y - 6, 3, 160, 140);
  const ga = __grab(c0.x, c0.y - 4, 16), label = Render.labelBoxes().some(b => b.str === 'THE ROAD KEPT');
  const rk = S.camps.ash.roadKept; S.camps.ash.roadKept = 0; await __wait(120); await __frames(3); const gb = __grab(c0.x, c0.y - 4, 16), plain = Render.labelBoxes().some(b => b.str === 'THE TRUCE ROAD'); S.camps.ash.roadKept = rk;
  __done(); WL.timeScale = 0.001;
  return { on, off, knot: { gold: __newCol(ga, gb, [__hex('#ffd98f')], 20), diff: __diff(ga, gb), label, plain } };
});
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, P2 = DATA.T.parley, DL = DATA.T.dayLen;
  /* the word run out with no gift walked to the fire: the knives put up their own man, and he pulls the rags down */
  const kit0 = Republic.chiefKit(ash), gen0 = c.chiefGen || 0; c.roadKept = 0; S.mails.length = 0; __says.length = 0;
  c.pact.t = S.time - P2.pactDays * DL - 1; Republic.tick(0.02);
  const rd = c.ragsDown;
  const down = !!rd && !rd.broke && rd.pts.length === 2 && (c.chiefGen || 0) === gen0 + 1 && Republic.chiefKit(ash) !== kit0 && !!c.newChief && __says.some(s => DATA.roadLines.down.includes(s.str)) && S.mails.some(m => m.subj === 'Ash Camp: the rags came down') && !!S.flags.tut.firstRagsDown && UI.campRollHTML(ash, false).includes('the word ran out ungifted — a new man at the fire; the road is shut');
  const shut = !Republic.truceRoadFor('foundry', 'pharos') && !Republic.truceRoads().some(x => x.cd.id === 'ash') && !Republic.roadCamps().some(cd => cd.id === 'ash');
  return { down, shut, kit: [kit0, Republic.chiefKit(ash)] };
});
const rk3 = r;
await drain();
const rgSeen = await ev(async () => {
  const ash = DATA.camps.find(x => x.id === 'ash'), c = S.camps.ash, rd = c.ragsDown; if (!rd) return { none: true };
  const p2 = rd.pts[0]; __at(0.3); c.runners = [];
  /* after: the pole bare, the rag in the dirt beside it (RAG_DOWN at +2..+22, +9..+19) — against the same frame with no rags down */
  rd.t = S.time - 6.5; await __look(p2.x + 6, p2.y - 6, 3, 150, 130);
  const A = __grab(p2.x + 8, p2.y + 6, 36), label = Render.labelBoxes().some(b => b.str === 'THE RAGS DOWN — A NEW MAN AT THE FIRE');
  c.ragsDown = null; await __wait(120); await __frames(3); const B = __grab(p2.x + 8, p2.y + 6, 36); c.ragsDown = rd;
  /* mid-pull: the knife stands at the pole (his head and shoulders, above the pole's top) — against the same frame after he went back */
  const ux = ash.x - p2.x, uy = ash.y - p2.y, ul = Math.max(1, Math.hypot(ux, uy)), kx = p2.x + ux / ul * 12 - 10, ky = p2.y + uy / ul * 12 + 10;
  rd.t = S.time - 2.9; await __wait(120); await __frames(3); const K1 = __grab(kx, ky - 55, 24);
  rd.t = S.time - 6.5; await __wait(120); await __frames(3); const K0 = __grab(kx, ky - 55, 24);
  /* a word broken: the rags come down under the same chief (the column sent at his fire leaves the word broken) */
  c.ragsDown = null; c.pact = { t: S.time, kept: 0 }; Republic.tick(0.02); const gen0 = c.chiefGen || 0; __says.length = 0;
  c.pact = null; S.fireWordBroken = S.time; Republic.tick(0.02);
  const rb = c.ragsDown, broke = !!rb && rb.broke && (c.chiefGen || 0) === gen0 && __says.some(s => s.str === 'Your word broke. So do the rags.') && UI.campRollHTML(ash, false).includes('your word broke — the road through the ring is shut');
  let brokeLabel = false; if (rb) { rb.t = S.time - 6.5; await __wait(150); await __frames(3); brokeLabel = Render.labelBoxes().some(b => b.str === 'THE RAGS DOWN — YOUR WORD BROKE'); }
  S.fireWordBroken = 0;
  __done(); WL.timeScale = 0.001;
  return { cloth: __newCol(A, B, [__hex('#e8e0c8'), __hex('#b8b09a')], 16), pole: __newCol(A, B, [__hex('#4a3320'), __hex('#33241e')], 14), diff: __diff(A, B), label, pull: __diff(K1, K0), broke, brokeLabel };
});
ok('THE ROAD KEPT: while a camp holds your word across a charter road, every lit board offers THE ROAD\'S GIFT with its mark — a real click takes it from the bank onto the pack (the lesson; the guide\'s step to his fire and its mark on the compass); on the truce road inside the ring the white rag flies from its switch at the pack\'s corner (pale cloth counted where the rag flies, on the road clear of the chief\'s fire, against the same frame without it — and none off the road) and the knives let the loaded Walker by and say so; off the road they come — carrying the gift, the whole ring is open and they say that too; given at his fire, the chief keeps the road: the word renewed and counted, his line, the mail, the roll, THE ROAD KEPT on the sheet, and the poles wear a gold knot new with THE ROAD KEPT on the ground (pixel-sampled against the same frame with the plain stake); run out ungifted, a new man comes up at the fire with his own face — his knife is seen at the pole mid-pull, then the poles stand bare and the rags lie in the dirt with THE RAGS DOWN — A NEW MAN AT THE FIRE (pixel-sampled against the same frame without them), the road shut (the mail, the lesson, the roll); a word broken brings them down under the same chief — YOUR WORD BROKE',
  Object.entries(rk1).every(([k, v]) => k === 'fireD' ? v > 150 : v === true) && Object.values(rk2).every(Boolean) && rkSeen.on.road && rkSeen.on.cloth > 20 && !rkSeen.off.road && rkSeen.off.cloth === 0 && rkSeen.knot.gold > 10 && rkSeen.knot.label && rkSeen.knot.plain && rk3.down && rk3.shut && rgSeen.cloth > 20 && rgSeen.pole > 10 && rgSeen.label && rgSeen.pull > 40 && rgSeen.broke && rgSeen.brokeLabel,
  JSON.stringify(rk1) + ' ' + JSON.stringify(rk2) + (rk2.compass ? '' : ' compass=' + JSON.stringify(await ev(() => window.__dbgC))) + ' seen=' + JSON.stringify(rkSeen) + ' ' + JSON.stringify(rk3) + ' down=' + JSON.stringify(rgSeen));

/* ================= 5 · THE STONE'S KEEPING ================= */
r = await ev(() => {
  const ridge = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge;
  for (const cd of DATA.camps) S.camps[cd.id].runners = [];
  S.settle = null; S.ringHold = null; S.giftRunner = null; S.cargo = S.cargo.filter(x => x.cat === 'tool');
  const [n, m] = __crew(2); n.cx = m.cx = S.px; n.cy = m.cy = S.py;
  S.scores = { ridge: { t: S.time - 50, npc: n.id, name: n.name, why: 'felled' } };
  c.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 2, stormDay: -1 }; c.pacified = true;
  Republic.scorePaid(ridge, 'taken');
  WL.tp([ridge.x, ridge.y + ridge.r + 120]); n.cx = S.px + 20; n.cy = S.py + 20; m.cx = S.px - 20; m.cy = S.py + 20;
  Republic.tick(0.02);
  for (let i = 0; i < 120 && S.settle; i++) { NPC.update(0.1); Republic.tick(0.1); }
  const st2 = Republic.settleStones().find(x => x.camp === 'ridge' && x.npc === n.id && !x.down);
  if (!st2) return { settled: false };
  /* the pause: the one who set it and another back, passing */
  const first = n.name.split(' ')[0]; __says.length = 0;
  for (const x of [n, m]) { x.pauseT = 0; x.stonePass = {}; }
  n.cx = st2.x + 40; n.cy = st2.y + 20; m.cx = st2.x - 40; m.cy = st2.y + 25; WL.tp([st2.x, st2.y + 60]);
  NPC.update(0.05);
  const own = DATA.stoneLines.own.map(l => l.replace(/\{camp\}/g, ridge.name)), others = DATA.stoneLines.others.map(l => l.replace(/\{name\}/g, first));
  const faces = x => Math.abs(x.pauseDir - Math.atan2(st2.y - x.cy, st2.x - x.cx)) < 0.05;
  const pause = n.pauseT > 0 && m.pauseT > 0 && faces(n) && faces(m) && __says.some(s => own.includes(s.str)) && __says.some(s => others.includes(s.str));
  const mood = NPC.mood(n).causes.some(x => x.id === 'cairn') && /stopped at their stones by Ridge Camp/.test(NPC.svc(n).last);
  /* the Order's walkers on the road stop at it too */
  const amb = NPC.ambient(), w = { n: NPC.gen({}), pts: [[st2.x - 300, st2.y + 30], [st2.x + 300, st2.y + 30]], len: 600, d: 290, sp: 90, said: true, crates: 1 };
  amb.push(w); __says.length = 0; NPC.update(0.05);
  const walkers = w.pauseT > 0 && !!w.stones && __says.some(s => others.includes(s.str));
  if (amb.includes(w)) amb.splice(amb.indexOf(w), 1);
  /* the camp up again: a knife walks out from the ring's edge and kicks it over */
  const calm = st2.calm === true;
  c.taken = null; c.pacified = false; c.truce = 0; c.pact = null; c.grudge = null; c.siegeTruce = null; S.mails.length = 0; __says.length = 0;
  let walkT = null; for (let i = 0; i < 90 && !st2.down; i++) { Republic.tick(0.1); if (st2.kick && walkT === null && st2.kick.t > 0) walkT = i; }
  const kicked = !!st2.down && !!st2.kick && __says.some(s => DATA.stoneLines.kicker.includes(s.str)) && !!S.flags.tut.firstStonesKicked;
  const sc = Republic.scores().ridge, again = !!sc && sc.why === 'stones' && sc.npc === n.id && S.mails.some(m2 => m2.subj === 'Your score with Ridge Camp, again');
  MusterUI.open(n.id); const pt = document.getElementById('musterBody').textContent.toUpperCase(); MusterUI.close();
  const plate = pt.includes('KICKED OVER AT RIDGE CAMP — YOUR SCORE') && pt.includes('SETTLED AT RIDGE CAMP — KICKED OVER');
  const rollH = UI.campRollHTML(ridge, false), roll = rollH.includes('kicked over') && rollH.includes(`${first}'s stones lie in the dirt at the ring`);
  window.__sk = { i: Republic.settleStones().indexOf(st2) };
  return { settled: true, pause, mood, walkers, calm, kicked, again, plate, roll };
});
const sk1 = r;
await drain();
const skSeen = await ev(async () => {
  const st2 = Republic.settleStones()[__sk.i]; if (!st2 || !st2.down) return { none: true };
  st2.down = S.time - 3; __at(0.3); for (const x of NPC.party()) { x.cx = st2.x + 180; x.cy = st2.y + 120; } S.camps.ridge.runners = [];   // the knife gone back to his fire
  await __look(st2.x, st2.y, 3, 70, 50);
  const A = __grab(st2.x, st2.y + 2, 24), label = Render.labelBoxes().some(b => b.str === `${st2.name.toUpperCase()} — KICKED OVER`);
  const x0 = st2.x; st2.x += 6000; await __wait(120); await __frames(3); const B = __grab(x0, st2.y + 2, 24); st2.x = x0;
  __done(); WL.timeScale = 0.001;
  return { stones: __newCol(A, B, [__hex('#b8c2c8'), __hex('#6e747c')], 14), thread: __newCol(A, B, [__hex('#c9553a'), __hex('#8a3a2c')], 14), diff: __diff(A, B), label };
});
ok('THE STONE\'S KEEPING: a back passing a standing cairn stops a beat and faces it — the one who set it says their own line, another back says theirs, and the stones seen standing sit in the setter\'s mood and on their plate; the Order\'s walkers on the road stop at it too; the camp up again, a knife walks out from the ring\'s edge and kicks it over with his line, and the stones lie in the dirt with KICKED OVER on the ground (the stones and the loose red thread pixel-sampled against the same frame with them carried off); the one who set them has a score again (the mail, the lesson; their plate\'s KICKED OVER AT RIDGE CAMP — YOUR SCORE and SETTLED AT RIDGE CAMP — KICKED OVER; the roll)',
  Object.values(sk1).every(Boolean) && skSeen.stones > 20 && skSeen.thread > 4 && skSeen.label, JSON.stringify(sk1) + ' seen=' + JSON.stringify(skSeen));

/* ================= 6 · THE LINE'S WATCH ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  for (const cd of DATA.camps) { const x = S.camps[cd.id]; x.runners = []; x.truce = 0; x.pact = null; x.ragsDown = null; x.roadKept = 0; x.grudge = null; x.siegeTruce = null; x.watchRun = null; }
  c.taken = null; c.pacified = false; S.settle = null; S.ringHold = null; S.watches = []; S.cargo = S.cargo.filter(x => x.cat === 'tool');
  __crew(3);
  WL.tp([ash.x + 200, ash.y + 1600]); UI.toggleMap(true); UI.ringWalk('ash'); UI.toggleMap(false);
  const mv = S.moveTo; WL.tp([mv.x + 3, mv.y + 3]); for (const x of NPC.party()) { x.cx = S.px + 20; x.cy = S.py + 20; }
  Systems.update(0.05, {}); for (let i = 0; i < 60; i++) Systems.update(0.1, {});
  const q = Systems.getInteractions().find(i => i.key === 'Q'); if (q) q.fn();
  const el = document.getElementById('keeperSay');
  const plate = !!S.ringHold && !!q && !el.classList.contains('hidden') && el.classList.contains('line') && ['hold', 'come', 'watch'].every(k => !!el.querySelector(`[data-line="${k}"]`) && __mk(el.querySelector(`[data-line="${k}"]`), k));
  __says.length = 0; S.mails.length = 0;
  return { held: !!S.ringHold, plate };
});
const wt1 = r;
if (wt1.plate) { await page.click('#keeperSay [data-line="watch"]'); await page.waitForTimeout(250); }
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, w = Systems.watchAt(ash); if (!w) return { made: false };
  const ns = Systems.watchers(w);
  const made = ns.length === 3 && ns.every(n => n.state === 'watch' && n.watchId === w.id) && NPC.party().length === 0 && !S.ringHold && Math.abs(U.dist(w.x, w.y, ash.x, ash.y) - (ash.r - 24)) < 2 && S.mails.some(m => m.subj === 'The watch at Ash Camp\'s ring') && !!S.flags.tut.firstWatch && __says.some(s => DATA.watchLines.order.includes(s.str));
  /* the Walker gone, the line keeps its slots; the roll and the compass name it */
  WL.tp([w.x + 900, w.y + 700]); for (let i = 0; i < 60; i++) Systems.update(0.1, {});
  const slots = ns.every(n => { const sl = Systems.watchSlot(w, n.watchSlot); return U.dist(n.cx, n.cy, sl.x, sl.y) < 3; });
  const rollH = UI.campRollHTML(ash, false), roll = rollH.includes('the watch') && ns.every(n => rollH.includes(n.name.split(' ')[0]));
  for (let i = 0; i < 40; i++) UI.tick(); const compass = [...document.querySelectorAll('#compassInner .cMark')].some(e => e.title.startsWith('THE WATCH · ASH'));
  /* before dark it turns a knife at the edge, the way HOLD does */
  const n0 = ns[0], k = { x: n0.cx + 30, y: n0.cy - 20, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }; c.runners = [k];
  const dIn = Math.max(1, U.dist(w.x, w.y, ash.x, ash.y)); WL.tp([w.x + (ash.x - w.x) / dIn * 200, w.y + (ash.y - w.y) / dIn * 200]); S.cargo.push(State.makeItem('metal')); S.state = 'walk'; S.health = 100; S.moveTo = null;
  const met0 = NPC.svc(n0).met || 0; __says.length = 0; Systems.update(0.02, {});
  const turned = !!k.turnedT && k.cd >= 13 && (NPC.svc(n0).met || 0) >= met0 + 1 && /turned a knife at the line/.test(NPC.svc(n0).last) && __says.some(s => ['Not past us.', 'Back to your fire.', 'This is our edge.'].includes(s.str));
  c.runners = []; S.cargo = S.cargo.filter(x => x.cat === 'tool'); S.health = 100;
  window.__wt = { id: w.id };
  return { made, slots, roll, compass, turned };
});
const wt2 = r;
await drain();
const laid = await ev(async () => {
  const w = Systems.watches().find(x => x.id === __wt.id); if (!w) return { none: true };
  const fp = Systems.watchFire(w), WF0 = SPRITES.WATCHFIRE; __at(0.3); S.camps.ash.runners = [];
  await __look(fp.x, fp.y - 4, 3, 150, 120);
  const A = __grab(fp.x, fp.y + 1.5, 14), label = Render.labelBoxes().some(b => b.str === 'THE WATCH — ASH CAMP\'S RING TILL MORNING');
  SPRITES.WATCHFIRE = WF0.map(__blank); await __wait(120); await __frames(3); const B = __grab(fp.x, fp.y + 1.5, 14); SPRITES.WATCHFIRE = WF0;
  __done(); WL.timeScale = 0.001;
  return { dark: w.dark, wood: __newCol(A, B, ['#4a3320', '#6b4a30', '#8a8f98', '#5a626c'].map(__hex), 14), flame: __newCol(A, B, ['#ffd98f', '#e0654a', '#fff2d0'].map(__hex), 30), diff: __diff(A, B), label };
});
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, w = Systems.watches().find(x => x.id === __wt.id);
  __at(0.72); __says.length = 0; Systems.update(0.05, {});
  const dark = w.dark === true && Systems.watchDark(ash) && __says.some(s => DATA.watchLines.dark.includes(s.str));
  /* the camp stays in: its knives keep close round their own fire; a knife near a loaded Walker in the ring stays in, and says so */
  c.runners = [0, 1, 2].map(i => ({ x: ash.x + Math.cos(i * 2) * ash.r * 0.6, y: ash.y + Math.sin(i * 2) * ash.r * 0.6, wa: i * 2, state: 'patrol', cd: 0, cls: 'knife' }));
  const dIn = Math.max(1, U.dist(w.x, w.y, ash.x, ash.y)); WL.tp([w.x + (ash.x - w.x) / dIn * 160, w.y + (ash.y - w.y) / dIn * 160]);
  S.cargo.push(State.makeItem('metal')); S.state = 'walk'; S.health = 100; S.moveTo = null; c.insideSaid = 0; __says.length = 0;
  for (let i = 0; i < 80; i++) Systems.update(0.1, {});
  const close = c.runners.length === 3 && c.runners.every(k => U.dist(k.x, k.y, ash.x, ash.y) < ash.r * 0.25);
  const stayIn = S.health === 100 && S.cargo.some(x => x.defId === 'metal') && __says.some(s => DATA.watchLines.inside.includes(s.str));
  /* the charter run crosses the ring as at a truce: THROUGH THE WATCHED RING on the sheet, no rags */
  const tr = Republic.truceRoads().find(x => x.cd.id === 'ash');
  const through = Republic.truceRoadFor('foundry', 'pharos') === ash && Republic.crossable(ash) && !!tr && tr.watch === true && UI.campRollHTML(ash, false).includes('crosses the ring while the watch holds it');
  const sheet = !!tr && __sheet().some(s2 => s2 === `THROUGH THE WATCHED RING — ${tr.npc.name.split(' ')[0].toUpperCase()}'S RUN`);
  /* a grudge's storm from that fire stays in */
  const ridge = DATA.camps.find(x => x.id === 'ridge'), rc = S.camps.ridge; rc.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 2, stormDay: -1 }; rc.pacified = true; rc.storm = null; S.mails.length = 0;
  const stayed = Republic.stormPost(ridge, null, ash) === false && !rc.storm && S.mails.some(m => m.subj === 'Ash Camp: the storm stayed in');
  rc.taken = null; rc.pacified = false; c.runners = []; S.cargo = S.cargo.filter(x => x.cat === 'tool');
  return { dark, close, stayIn, through, sheet, stayed };
});
const wt3 = r;
await drain();
const lit = await ev(async () => {
  const w = Systems.watches().find(x => x.id === __wt.id); if (!w) return { none: true };
  const fp = Systems.watchFire(w), WF0 = SPRITES.WATCHFIRE; __at(0.8); S.camps.ash.runners = [];
  await __look(fp.x, fp.y - 8, 3, 150, 120);
  const A = __grab(fp.x, fp.y - 8, 16), label = Render.labelBoxes().some(b => b.str === 'THE WATCH — THE CAMP STAYS IN');
  SPRITES.WATCHFIRE = WF0.map(__blank); await __wait(120); await __frames(3); const B = __grab(fp.x, fp.y - 8, 16); SPRITES.WATCHFIRE = WF0;
  let warm = 0; for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 60 && A[i] > 200 && A[i + 1] > 90) warm++;
  __done(); WL.timeScale = 0.001;
  return { dark: w.dark, flame: __newCol(A, B, ['#ffd98f', '#e0654a', '#fff2d0'].map(__hex), 40), warm, diff: __diff(A, B), label };
});
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), w = Systems.watches().find(x => x.id === __wt.id), ns = Systems.watchers(w);
  /* dawn: home to the nearest lit door */
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 1.08; __says.length = 0; S.mails.length = 0;
  Systems.update(0.05, {});
  const near = DATA.stationOrder.filter(id => S.stations[id].connected).sort((a, b) => U.dist(w.x, w.y, DATA.stations[a].x, DATA.stations[a].y) - U.dist(w.x, w.y, DATA.stations[b].x, DATA.stations[b].y))[0];
  const to = w.home && w.home.to, dawn = !!w.home && to === near && ns.every(n => !!n.walkHome) && __says.some(s => DATA.watchLines.dawn.includes(s.str)) && S.mails.some(m => m.subj === 'The watch comes home');
  for (let i = 0; i < 700 && ns.some(n => n.state === 'watch'); i++) Systems.update(0.1, {});
  const waiting = ns.every(n => n.state === 'waiting' && n.waitAt === to) && ns.every(n => NPC.mood(n).causes.some(x => x.id === 'watched'));
  for (let i = 0; i < 40; i++) UI.tick(); const compass = !!to && [...document.querySelectorAll('#compassInner .cMark')].some(e => e.title.startsWith(`the watch, home · ${DATA.stations[to].name.split(' ')[0]}`));
  window.__wh = { to, ids: ns.map(n => n.id) };
  return { dawn, waiting, compass, to };
});
const wt4 = r;
await drain();
const homeSeen = await ev(async () => {
  const ns = S.npcs.filter(n => __wh.ids.includes(n.id) && n.state === 'waiting'); if (!ns.length) return { none: true };
  const mx = ns.reduce((a, n) => a + n.cx, 0) / ns.length, my = Math.max(...ns.map(n => n.cy)); __at(0.3);
  await __look(mx, my + 10, 3, 0, 420);   // the Walker stands off, past the door's reach
  const label = Render.labelBoxes().some(b => b.str === 'HOME FROM THE WATCH');
  __done(); WL.timeScale = 0.001;
  return { label, waiting: ns.every(n => n.state === 'waiting') };
});
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), ns = S.npcs.filter(n => __wh.ids.includes(n.id));
  /* the Walker comes by the door: they fall in */
  __says.length = 0; WL.tp(__wh.to); Systems.update(0.05, {});
  const fell = ns.length === 3 && ns.every(n => n.state === 'companion') && __says.some(s => DATA.watchLines.home.includes(s.str));
  /* a watch called in early with Q at the line falls in at once */
  S.ringHold = null; WL.tp([ash.x + 200, ash.y + 1600]); UI.toggleMap(true); UI.ringWalk('ash'); UI.toggleMap(false);
  const mv = S.moveTo; WL.tp([mv.x + 3, mv.y + 3]); for (const x of NPC.party()) { x.cx = S.px + 20; x.cy = S.py + 20; }
  Systems.update(0.05, {}); for (let i = 0; i < 60; i++) Systems.update(0.1, {});
  const made2 = !!S.ringHold && Systems.lineOrder('watch'), w2 = Systems.watchAt(ash);
  if (!w2) return { fell, made2, early: false };
  WL.tp([w2.x + 30, w2.y + 30]); __says.length = 0;
  const q = Systems.getInteractions().find(i => i.key === 'Q' && /call it in/.test(i.label)); if (q) q.fn();
  const early = made2 && !!q && !Systems.watchAt(ash) && NPC.party().length === 3 && NPC.party().every(n => n.state === 'companion' && !n.watchId) && __says.some(s => s.str === 'With you, then.');
  __hideSay(); WL.tp('haven');
  return { fell, early };
});
ok('THE LINE\'S WATCH: at a held line the plate offers HOLD, COME or WATCH, each with its mark; a real click on WATCH leaves the line at the ring\'s very edge for the night — the wedge empties (the mail, the lesson, their words), the backs keep their slots with the Walker gone, the roll and the compass name it (THE WATCH · ASH), and before dark it turns a knife at the edge the way HOLD does; by day the fire lies laid behind the line (its stones and logs pixel-sampled against the same frame without it); at dark it burns (its flame pixel-sampled the same way) and from dark the camp stays in — its knives circle close at their own fire, a knife near a loaded Walker in the ring stays in and says so, the charter run crosses the ring as at a truce (THROUGH THE WATCHED RING on the sheet, no rags, the roll) and a grudge\'s storm from that fire stays in; at dawn the line walks home to the nearest lit door and waits there (the mail, the compass, HOME FROM THE WATCH under them, the watch in their mood) and falls in when the Walker comes by; a watch called in early with Q falls in at once',
  wt1.held && wt1.plate && Object.values(wt2).every(Boolean) && !laid.dark && laid.wood > 20 && laid.flame === 0 && laid.label && Object.values(wt3).every(Boolean) && lit.dark && (lit.flame > 20 || lit.warm > 20) && lit.label && wt4.dawn && wt4.waiting && wt4.compass && homeSeen.label && r.fell && r.early,
  JSON.stringify(wt1) + ' ' + JSON.stringify(wt2) + ' laid=' + JSON.stringify(laid) + ' ' + JSON.stringify(wt3) + ' lit=' + JSON.stringify(lit) + ' ' + JSON.stringify(wt4) + ' home=' + JSON.stringify(homeSeen) + ' ' + JSON.stringify(r));

/* ================= 7 · THE SAVE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), pass = DATA.camps.find(c => c.id === 'pass');
  __land('mill', 'broken', DATA.T.word.answer.broken);   // a second door shut by hearsay
  /* the road kept at Ash, the rags down at Pass under its new man, a watch left standing at Ash's ring */
  S.camps.ash.pact = { t: S.time, kept: 2 }; S.camps.ash.roadKept = S.time;
  const pc = S.camps.pass; pc.ragsDown = { t: S.time, pts: [{ x: Math.round(pass.x + pass.r), y: pass.y }, { x: Math.round(pass.x - pass.r), y: pass.y }], broke: false }; pc.chiefGen = (pc.chiefGen || 0) + 1; pc.newChief = S.time; const gen = pc.chiefGen;
  S.ringHold = { camp: 'ash', x: ash.x, y: ash.y + ash.r + 40, t: S.time }; const made = Systems.lineOrder('watch'), w = Systems.watchAt(ash), wid = w && w.id;
  State.save(); State.load();
  const bR = Economy.book('relay'), bQ = Economy.book('quarry'), bM = Economy.book('mill');
  const word = !!bR.answered && !!bR.answeredSpent && bR.log.some(e => e.kind === 'answered') && bM.shut && bM.shutBy === 'wire' && bQ.log.some(e => e.kind === 'hearsay') && bQ.log.some(e => e.kind === 'seen') && !bQ.shut;
  const keepsake = S.legacy.find(x => x.fact === 'town' && x.name === __ksd.fallen).keepsake === __ksd.thing;
  const road = !!S.camps.ash.pact && S.camps.ash.pact.kept === 2 && S.camps.ash.roadKept > 0 && !!S.camps.pass.ragsDown && S.camps.pass.ragsDown.pts.length === 2 && S.camps.pass.chiefGen === gen && S.camps.pass.newChief > 0;
  const stones = Republic.settleStones().some(x => x.camp === 'ridge' && x.down);
  const w2 = (S.watches || []).find(x => x.id === wid), watch = made && !!w2 && !w2.home && Systems.watchers(w2).length === 3;
  for (const n of S.npcs.filter(x => x.state === 'watch')) { n.state = 'companion'; n.watchId = null; } S.watches = []; S.camps.pass.ragsDown = null;
  return { word, keepsake, road, stones, watch };
});
ok('THE SAVE: a door answered on the wire\'s word, doors shut by hearsay and opened by what they saw, the keepsake at its stone, the road kept and the rags down under a new man, the stones kicked over, and a watch standing at a ring with its backs survive a save and load',
  Object.values(r).every(Boolean), JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
await T.finish('the word answered');
