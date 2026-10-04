/* passed.mjs — v3.49 THE WORD PASSED ON: the letters passed on (a town reached on a letter, a word kept at its door, writes
   ahead in its turn — the chain on the wire and on the map, and the town at the end of three letters opens with its
   keeper's errand posted); the wire cut (on a storm night a camp still up sends a raider to a wired camp's mast — the door
   dark, its board shut — until the splice coil from any lit board is spliced there); the ring given (a camp that came out to
   the line twice gives its ring up: its fighters leave for the hills, the fire a rest stop — shelter, box, fire); the
   knives' stone (a cairn set twice and left standing a week gets the camp's own stone with a black thread); the hand who
   stays (a town's hand who walked three of a stone's days stays on for good, the ribbon kept, no fee); the corrections (the
   wheel zooms, the windows say what they are, the storage tab); the web closing (no camp left up, no raider); the save. */
import { chromium } from 'playwright';
import { distUrl, browserOptions } from './lib/runtime.mjs';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch(browserOptions);
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto(process.env.WL_URL || distUrl('test.html?debug'), { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9; });   // the first-sight scenes are spent: no letterbox takes a frame
const ev = (fn, arg) => page.evaluate(fn, arg);
await ev(() => {
  window.__toScr = (wx, wy) => { const z2 = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (wx - Render.cam.x) * z2, y: innerHeight / 2 + (wy - Render.cam.y) * z2 }; };
  window.__near = (wx, wy, col, tol, rad) => { const p = __toScr(wx, wy), cv = document.getElementById('game'), g = cv.getContext('2d'), dpr = devicePixelRatio; const x0 = Math.max(0, Math.round((p.x - rad) * dpr)), y0 = Math.max(0, Math.round((p.y - rad) * dpr)), w = Math.round(rad * 2 * dpr), h = Math.round(rad * 2 * dpr); const d = g.getImageData(x0, y0, w, h).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - col[0]) < tol && Math.abs(d[i + 1] - col[1]) < tol && Math.abs(d[i + 2] - col[2]) < tol) n++; return n; };
  window.__hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  window.__frames = n => new Promise(res => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });   // the B frame is a frame the game drew after the change, however loaded the machine
  window.__clearAmb = (x, y, rad) => { for (const w of NPC.ambient()) if (w.x !== undefined && U.dist(w.x, w.y, x, y) < rad) { w.d = w.end || w.len; w.x = undefined; } };   // a walker passing on the road is not staged into a sampled frame
  window.__grab = (wx, wy, rad) => { const p = __toScr(wx, wy), cv = document.getElementById('game'), g = cv.getContext('2d'), dpr = devicePixelRatio; return g.getImageData(Math.max(0, Math.round((p.x - rad) * dpr)), Math.max(0, Math.round((p.y - rad) * dpr)), Math.round(rad * 2 * dpr), Math.round(rad * 2 * dpr)).data; };
  window.__diff = (a, b2) => { let n = 0; for (let i = 0; i < Math.min(a.length, b2.length); i += 4) if (Math.abs(a[i] - b2[i]) + Math.abs(a[i + 1] - b2[i + 1]) + Math.abs(a[i + 2] - b2[i + 2]) > 60) n++; return n; };
  window.__count = (d, col, tol) => { let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - col[0]) < tol && Math.abs(d[i + 1] - col[1]) < tol && Math.abs(d[i + 2] - col[2]) < tol) n++; return n; };
  window.__wait = ms => new Promise(res => setTimeout(res, ms));
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  for (const id of ['elm', 'mill', 'green', 'quarry']) { S.stations[id].connected = true; S.stations[id].met = true; }
  for (const id of ['relay', 'foundry', 'pharos']) { S.stations[id].connected = false; S.stations[id].met = false; S.stations[id].ahead = null; }
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;   // the Walker's weather lines are spent
  for (let i = 0; i < 6; i++) S.npcs.push(NPC.gen({ at: 'haven' }));
});
const drain = async () => { for (let i = 0; i < 150; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };
const skipCine = async () => { for (let i = 0; i < 30; i++) { const c = await ev(() => !!S.cine); if (!c) break; await ev(() => WL.skipCine()); await page.waitForTimeout(250); } };
const at = f => ev(f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; }, f);

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const inPal = (rows, pal, w, h) => rows.length === h && rows.every(rw => rw.length === w) && [...new Set(rows.join('').replace(/\./g, ''))].every(ch => pal[ch]);
  const NEW = ['passed', 'third', 'cut', 'coil', 'given', 'kstone', 'stays'];
  const marks = NEW.every(k => inPal(SPRITES.MARKS[k], SPRITES.MARK_PAL, 7, 7)) && new Set(Object.values(SPRITES.MARKS).map(m => m.join(''))).size === Object.keys(SPRITES.MARKS).length;
  const W = SPRITES.WORDNOTE, pips = k => (W[k][5].match(/A/g) || []).length;
  const notes = inPal(W.ahead2, SPRITES.WORD_PAL, 7, 6) && inPal(W.ahead3, SPRITES.WORD_PAL, 7, 6) && W.ahead2.slice(0, 5).join('') === W.ahead.join('') && W.ahead3.slice(0, 5).join('') === W.ahead.join('') && pips('ahead2') === 2 && pips('ahead3') === 3 && new Set(Object.values(W).map(m => m.join(''))).size === Object.keys(W).length;
  const L = SPRITES.RELAY_MAST.lit, C = SPRITES.RELAY_MAST_CUT;
  const mast = inPal(C, SPRITES.RELAY_PAL, 17, 24) && C.slice(8).every((row, i) => row.slice(0, 9) === L[i + 8]) && C.slice(0, 8).every((row, i) => row.slice(0, 9) !== L[i]) && !C.join('').includes('F') && C.join('').includes('R');   // the legs stand exactly where the lit mast's do; above them it is broken; no lamp burns; the rag lies in the dirt
  const SB = SPRITES.CAMP_BOARD_SHUT, board = inPal(SB, SPRITES.RELAY_PAL, 12, 10) && SB.join('') !== SPRITES.CAMP_BOARD.join('') && SB.slice(7).join('') === SPRITES.CAMP_BOARD.slice(7).join('') && (SB.join('').match(/[Rr]/g) || []).length > (SPRITES.CAMP_BOARD.join('').match(/[Rr]/g) || []).length;   // the same legs, boarded, the rag knotted at the cross
  const sparks = SPRITES.SPARK_F.length === 3 && SPRITES.SPARK_F.every(f => inPal(f, SPRITES.SPARK_PAL, 5, 5)) && new Set(SPRITES.SPARK_F.map(f => f.join(''))).size === 3;
  const rest = inPal(SPRITES.RESTSIGN, SPRITES.REST_PAL, 7, 12) && SPRITES.RESTSIGN.join('').includes('F') && inPal(SPRITES.PEGS, SPRITES.HIDE_PAL, 12, 5) && inPal(SPRITES.HEARTH_STONES, SPRITES.SETTLE_PAL, 11, 3) && inPal(SPRITES.BUNDLE, SPRITES.HIDE_PAL, 5, 6);
  const KS = SPRITES.SETTLESTONE_KNIVES, kst = inPal(KS, SPRITES.SETTLE_PAL, 7, 7) && KS.join('').includes('B') && !/[Rr]/.test(KS.join('')) && inPal(SPRITES.CARRY_STONE, SPRITES.SETTLE_PAL, 4, 3);   // a black thread, never the red
  const CO = SPRITES.COURIER, onGrid = cells => cells.every(([c, r2]) => c >= 0 && c < 32 && r2 >= 0 && r2 < 32);   // v3.50: on the courier's own 32×32 grid, every facing and frame
  const pin = Object.keys(CO.pin).every(fc => Object.keys(CO.pin[fc]).every(fr => { const P = CO.pin[fc][fr], R2 = CO.sash[fc][fr]; return onGrid(P) && onGrid(R2) && P.every(([c, r2, ch]) => SPRITES.HELPER_PAL[ch] && R2.some(([c2, r3]) => c2 === c && r3 === r2)); })) && CO.pin.S.idle.length === 2 && CO.pin.E.idle.length >= 1;   // the pin goes through the ribbon, on the ribbon's own cells
  const g = Render.cargoGlyph({ defId: 'wireCoil', kg: 6, cat: 'gift' }), coil = !!g && inPal(g.rows, g.pal, 8, 6) && g.rows.join('') !== Render.cargoGlyph({ defId: 'relayKit', kg: 16, cat: 'gift' }).rows.join('');
  const ic = h => (h.match(/src="([^"]+)"/) || [])[1], icon = /^data:image\/png/.test(ic(UI.iconTag({ defId: 'wireCoil', cat: 'gift', splice: 'ash' })) || '') && ic(UI.iconTag({ defId: 'wireCoil', cat: 'gift', splice: 'ash' })) !== ic(UI.iconTag({ defId: 'relayKit', cat: 'gift', relay: 'ash' }));
  const item = !!DATA.items.wireCoil && DATA.items.wireCoil.cat === 'gift' && DATA.items.wireCoil.kg === DATA.T.cut.kg && Ledger.classify('wireCoil') === 'gifts' && Ledger.coverage().length === 0;
  const T2 = DATA.T, rows = T2.passed.errandAt === 3 && T2.cut.chance > 0 && T2.cut.chance < 1 && T2.cut.graceDays >= 2 && T2.cut.relight > 0 && T2.cut.pay > 0 && T2.cut.reach > 0 && T2.given.lines === 2 && T2.given.leave > 0 && T2.given.fireR > 0 && T2.kstone.days === 7 && T2.kstone.moodDays > 0 && T2.stays.legs === 3 && T2.post.mast.length === 2;
  const voices = DATA.stationOrder.every(id => /\{who\}/.test(DATA.keeperGrief[id].third || '') && /\{town\}/.test(DATA.keeperGrief[id].third)) && ['pass', 'ash'].every(k => DATA.campPosts[k].grief.third);
  const lines = ['raider', 'chief', 'splice'].every(k => DATA.cutLines[k].length >= 2) && ['chief', 'leave'].every(k => DATA.givenLines[k].length >= 2) && DATA.kstoneLines.set.length >= 2 && DATA.staysLines.ask.length >= 2 && DATA.staysLines.ask.every(l => /\{first\}/.test(l));
  const lessons = ['firstPassed', 'firstThird', 'firstWireCut', 'firstSplice', 'firstGiven', 'firstKnivesStone', 'firstStays'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]), lessonsN = Object.keys(DATA.tutorials).length;
  const causes = ['kstone', 'stays'].every(k => MUSTER.MOOD.causes[k] && MUSTER.MOOD.causes[k].v > 0 && MUSTER.MOOD.causes[k].line), causesN = Object.keys(MUSTER.MOOD.causes).length;
  return { marks, notes, mast, board, sparks, rest, kst, pin, coil, icon, item, rows, voices, lines, lessons, lessonsN, causes, causesN };
});
ok('THE REGISTRIES: seven new marks (the letter passed on, the end of three letters, the wire cut, the splice coil, the ring given, the knives\' stone, the hand who stays) 7×7 in the marks\' palette and every mark distinct; the letter passed on wears two teal pips and the third three, over the same letter; the cut mast (its legs exactly where the lit mast\'s stand, broken above them, no lamp, the rag in the dirt); the board boarded up on the same legs with the rag at the cross; three spark frames; the rest stop\'s sign with its lamp, the pegs, the hearth stones, the rolled hide; the knives\' stone with a black thread and never a red one, and the stone as it is carried; the pin through the ribbon on the ribbon\'s own cells; the coil its own glyph on the pack and its own icon on paper; the coil filed as a gift; the rows; every keeper\'s line for the end of three letters, and the camps\' doors\' too; the voices; seven lessons (93 pages); two mood causes (31)',
  r.marks && r.notes && r.mast && r.board && r.sparks && r.rest && r.kst && r.pin && r.coil && r.icon && r.item && r.rows && r.voices && r.lines && r.lessons && r.lessonsN >= 93 && r.causes && r.causesN === 31, JSON.stringify(r));

/* ================= 2 · THE LETTERS PASSED ON ================= */
const grievanceAt = (to, from) => ev(({ to, from }) => {
  S.stations[from].parcels = [{ to, kind: 'coat', name: 'a mended coat' }];
  S.orders.active = S.orders.active.filter(o => o.errand); for (const c2 of [...S.cargo]) if (c2.cat !== 'tool' && !c2.sealed) State.removeCargo(c2.id);
  const run = Economy.ordersFor(from).find(o => o.item === 'parcel' && o.to === to && !o.errand); if (!run) return null;
  Systems.acceptOrder(run, false);
  const it = S.cargo.find(c2 => c2.parcel && !c2.sealed && c2.parcel.to === to);
  State.removeCargo(it.id); S.drops.push({ id: U.uid(), item: it, x: DATA.stations[from].x + 200, y: DATA.stations[from].y }); Economy.grieve(it, 'ground');
  return it.parcel.id;
}, { to, from });
const keepWord = gid => ev(gid => {
  Economy.giveWord(gid, 'promise');
  const dr = S.drops.find(d => d.item && d.item.parcel && String(d.item.parcel.id) === String(gid)); State.addCargo(dr.item); S.drops.splice(S.drops.indexOf(dr), 1);
  const to = dr.item.parcel.to; WL.tp(to); WL.instantPar();
  const res = Systems.handleDelivery(to).results.find(x => x.order && x.order.item === 'parcel');
  document.getElementById('keeperSay').classList.add('hidden');
  return !!res;
}, gid);
r = await ev(() => {
  S.wireWords = [];
  const unreached = ['relay', 'foundry', 'pharos'].every(id => !S.stations[id].connected && !S.stations[id].met && !S.stations[id].ahead);
  const A = Economy.writeAhead('quarry');   // the first letter — the word gone ahead (v3.48)
  const w = S.wireWords.find(x => x.kind === 'ahead' && x.to === A);
  const first = !!w && w.chain === 1 && !S.mails.some(m => /the letter passed on/.test(m.subj));
  if (w) { w.eta = S.time - 0.01; Economy.update(0.01); }
  const landed = !!A && !!S.stations[A].ahead && S.stations[A].ahead.chain === 1 && !Economy.passedAt(A);
  /* reached, and no word kept at its door yet: the letter waits */
  S.stations[A].connected = true; S.stations[A].met = true;
  const waits = !S.wireWords.some(x => x.kind === 'ahead' && x.from === A) && !Economy.book(A).wroteAhead;
  window.__ch = { A };
  return { unreached, A, first, landed, waits };
});
const ch1 = JSON.stringify(r), chOk1 = r.unreached && !!r.A && r.first && r.landed && r.waits;
const gA = await grievanceAt(r.A, 'haven'); const keptA = await keepWord(gA);
r = await ev(() => {
  const A = __ch.A, w = S.wireWords.find(x => x.kind === 'ahead' && x.from === A), b0 = Economy.book(A), nm = DATA.stations[A].name;
  const passed = !!w && w.chain === 2 && b0.kept === 1 && !!b0.wroteAhead && S.mails.some(m => m.subj === `${nm}: the letter passed on` && /the second letter in the chain/.test(m.body)) && !!S.flags.tut.firstPassed && b0.log.some(e => e.kind === 'wroteAhead');
  window.__ch.B = w ? w.to : null;
  const once = Economy.passOn(A) === null && S.wireWords.filter(x => x.kind === 'ahead' && x.from === A).length === 1;   // a door passes it on once
  const nearest = !!w && ['relay', 'foundry', 'pharos'].filter(id => id !== A).sort((a, b2) => U.dist(DATA.stations[A].x, DATA.stations[A].y, DATA.stations[a].x, DATA.stations[a].y) - U.dist(DATA.stations[A].x, DATA.stations[A].y, DATA.stations[b2].x, DATA.stations[b2].y))[0] === w.to;
  if (w) w.eta = S.time + 1e6;   // held on the wire while the frames look at it
  return { passed, B: w && w.to, once, nearest };
});
const ch2 = JSON.stringify(r), chOk2 = keptA && r.passed && !!r.B && r.once && r.nearest;
/* the letter passed on walks the wire with its place in the chain under it: two teal pips (the same frame with the letter as a first) */
await drain(); await at(0.3);
const pipSeen = await ev(async () => {
  const w = S.wireWords.find(x => x.kind === 'ahead' && x.from === __ch.A); if (!w) return { two: 0, one: 0 };
  w.t0 = S.time - 3; const p = Economy.wireWordAt(w);
  WL.tp([p.x + 90, p.y + 70]); Render.clearFx(); Render.setZoom(3); Render.cam.x = p.x; Render.cam.y = p.y - 16; __clearAmb(p.x, p.y, 260); WL.timeScale = 0.001;
  await __wait(420); await __frames(3);
  const teal = __hex('#57c8b4'), two = __near(p.x, p.y - 12, teal, 26, 34);
  w.chain = 1; await __wait(200); await __frames(3); const one = __near(p.x, p.y - 12, teal, 26, 34); w.chain = 2;
  WL.timeScale = 1; Render.setZoom(null);
  return { two, one };
});
r = await ev(() => {
  const A = __ch.A, B = __ch.B, w = S.wireWords.find(x => x.kind === 'ahead' && x.to === B); w.eta = S.time - 0.01; Economy.update(0.01);
  const st = S.stations[B], who = DATA.keepers[A].name;
  const landed = !!st.ahead && st.ahead.chain === 2 && st.ahead.from === A && st.ahead.who === who && !Economy.passedAt(B);
  WL.tp(B); UI.openStation(B);
  const greet = document.getElementById('keeperLine').textContent.includes(DATA.keeperGrief[B].ahead.replace(/\{who\}/g, who).replace(/\{town\}/g, DATA.stations[A].name).slice(0, 26));
  const bl = document.getElementById('bookLine'), chip = /WRITTEN AHEAD — LETTER 2 OF A CHAIN/.test(bl.textContent) && [...bl.querySelectorAll('img.mkImg')].some(im => im.getAttribute('src') === UI.markURL('passed'));
  document.getElementById('stationClose').click();
  S.stations[B].connected = true; S.stations[B].met = true;
  return { landed, greet, chip };
});
const ch3 = JSON.stringify(r), chOk3 = r.landed && r.greet && r.chip;
const gB = await grievanceAt(await ev(() => __ch.B), 'haven'); const keptB = await keepWord(gB);
r = await ev(() => {
  const B = __ch.B, w = S.wireWords.find(x => x.kind === 'ahead' && x.from === B), nmB = DATA.stations[B].name;
  const third = !!w && w.chain === 3 && S.mails.some(m => m.subj === `${nmB}: the letter passed on` && /the third letter in the chain/.test(m.body) && /their own errand will be on the board/.test(m.body));
  if (!w) return { third };
  window.__ch.C = w.to;
  w.eta = S.time - 0.01; Economy.update(0.01);
  const C = w.to, st = S.stations[C], b0 = Economy.book(C);
  const landed = !!st.ahead && st.ahead.chain === 3 && st.ahead.from === B && !!b0.passed && Economy.passedAt(C) && !!S.flags.tut.firstThird && !st.connected;
  const eo = (Economy.ordersFor(C) || []).find(o => o.errand === C);
  const posted = !!eo && eo.passed === true && !eo.answered && eo.parcels[0].kind === 'sealed' && S.stations[eo.to].connected;
  WL.tp(C); UI.openStation(C); UI.gotoTab('orders');
  const whoB = DATA.keepers[B].name;
  const greet = document.getElementById('keeperLine').textContent.includes(DATA.keeperGrief[C].third.replace(/\{who\}/g, whoB).replace(/\{town\}/g, nmB).slice(0, 26));
  const bl = document.getElementById('bookLine'), chip = /AN ERRAND AT THE END OF THREE LETTERS/.test(bl.textContent) && [...bl.querySelectorAll('img.mkImg')].some(im => im.getAttribute('src') === UI.markURL('third'));
  const card = [...document.querySelectorAll('#stationBody .orderCard.errand')].some(el => /THE KEEPER'S ERRAND · AT THE END OF THREE LETTERS/.test(el.textContent) && new RegExp(`has read three letters about you down the wire, the last from ${S.stations[C].ahead.who}`).test(el.textContent) && !/watched you keep your word twice/.test(el.textContent) && el.querySelector('[data-accept]') && el.querySelector('[data-accept]').textContent.trim() === 'Accept');   // the card says why a keeper who never met you posts it
  window.__ch.far = eo ? eo.to : null;
  return { third, C, landed, posted, greet, chip, card };
});
const ch4 = JSON.stringify(r), chOk4 = keptB && r.third && r.landed && r.posted && r.greet && r.chip && r.card;
if (r.card) { await page.click('#stationBody .orderCard.errand [data-accept]'); await page.waitForTimeout(350); }
r = await ev(() => {
  const C = __ch.C, B = __ch.B, b0 = Economy.book(C), o = S.orders.active.find(x => x.errand === C);
  const accepted = !!o && o.passed === true && !!S.cargo.find(c2 => c2.sealed) && !!b0.passedSpent && !Economy.passedAt(C);
  const plate = document.getElementById('keeperSay'), said = DATA.keeperGrief[C].third.replace(/\{who\}/g, DATA.keepers[B].name).replace(/\{town\}/g, DATA.stations[B].name);
  const ask = !plate.classList.contains('hidden') && plate.textContent.toLowerCase().includes(said.slice(0, 24).toLowerCase());
  const noSecond = !(Economy.ordersFor(C) || []).some(x => x.errand === C);
  if (document.getElementById('stationClose')) document.getElementById('stationClose').click(); plate.classList.add('hidden');
  /* walked through at the far door: kept — and the chain ends where every door in the valley has heard of you */
  WL.tp(o.to); WL.instantPar();
  const res = Systems.handleDelivery(o.to).results.find(x => x.order && x.order.errand);
  const kept = !!res && !!res.errand && res.errand.kept && b0.errands === 1;
  const ends = !!b0.wroteAhead && !S.wireWords.some(x => x.kind === 'ahead') && S.mails.some(m => new RegExp(`${DATA.stations[C].name}: .* would write ahead`).test(m.subj));
  UI.closeAllModals();
  return { accepted, ask, noSecond, kept, ends };
});
const ch5 = JSON.stringify(r), chOk5 = r.accepted && r.ask && r.noSecond && r.kept && r.ends;
/* the chain on the map: every letter that landed, writer to reader, a teal line with its place in the chain at its middle
   (the same sheet with the letters taken off) */
await ev(() => { WL.tp([5200, 4600]); UI.toggleMap(true); }); await page.waitForTimeout(350);
const chainMap = await ev(() => {
  const c = document.getElementById('map'), g = c.getContext('2d'), r0 = c.getBoundingClientRect(), dpr = devicePixelRatio;
  const count = (x, y) => { const m = UI.mapPoint(x, y), d = g.getImageData(Math.round((m.x - r0.left - 14) * dpr), Math.round((m.y - r0.top - 14) * dpr), Math.round(28 * dpr), Math.round(28 * dpr)).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - 0x57) < 26 && Math.abs(d[i + 1] - 0xc8) < 26 && Math.abs(d[i + 2] - 0xb4) < 26) n++; return n; };
  const ids = [__ch.A, __ch.B, __ch.C], links = [['quarry', __ch.A], [__ch.A, __ch.B], [__ch.B, __ch.C]].map(([a, b2]) => ({ x: (DATA.stations[a].x + DATA.stations[b2].x) / 2, y: (DATA.stations[a].y + DATA.stations[b2].y) / 2 }));
  UI.drawMap(); const on = links.map(p => count(p.x, p.y));
  const saved = ids.map(id => S.stations[id].ahead); for (const id of ids) S.stations[id].ahead = null;
  UI.drawMap(); const off = links.map(p => count(p.x, p.y));
  ids.forEach((id, i) => { S.stations[id].ahead = saved[i]; }); UI.drawMap();
  UI.toggleMap(false);
  return { on, off };
});
ok('THE LETTERS PASSED ON: a letter lands at a door you never reached; reached, it waits for your word — kept there (a grievance promised and walked through in time), the keeper passes it on down the wire to the nearest door you have never reached, the second in the chain (the mail, the lesson, the book), once; it walks the wire with two teal pips under it (pixel-sampled against the same letter as a first); landing, that keeper greets you by the one who wrote and the chip says LETTER 2 OF A CHAIN with its mark; a word kept there passes on the third — and the door at the end of three letters opens with its keeper\'s errand already posted (the lesson; its keeper greets you by the one who wrote last; the chip; the card AT THE END OF THREE LETTERS); a real click accepts it: the seal on the pack, the keeper asks it to your face, the chain\'s word spent, no second errand; walked through, it is kept — and with every door in the valley heard of you, the chain ends; the map draws every landed letter writer to reader in teal with its place in the chain (pixel-sampled against the same sheet without them)',
  chOk1 && chOk2 && pipSeen.two > pipSeen.one + 30 && chOk3 && chOk4 && chOk5 && chainMap.on.every((n, i) => n > chainMap.off[i] + 12), ch1 + ' ' + ch2 + ' pips=' + JSON.stringify(pipSeen) + ' ' + ch3 + ' ' + ch4 + ' ' + ch5 + ' map=' + JSON.stringify(chainMap));

/* ================= 3 · THE WIRE CUT ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  c.taken = null; c.pacified = false; c.truce = 0; c.runners = []; c.grudge = null; c.asks = S.time;
  const took = Republic.takeRelayKit('ash');
  WL.tp([ash.x - 30, ash.y + 60]);
  const it = Systems.getInteractions().find(i => i.key === 'G' && /Raise <b>the relay<\/b>/.test(i.label)); if (it) it.fn();
  window.__dark = { x: ash.x - 400, y: ash.y - 300 };
  return { took, raised: !!it && !!c.wired };
});
const cu0 = JSON.stringify(r);
await skipCine();
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, wd = c.wired, DL = DATA.T.dayLen, CU = DATA.T.cut;
  const raiders = Republic.raiderCamps().map(x => x.id).sort().join(',');
  const lit0 = World.lightAt(__dark.x, __dark.y) > 0 && S.stations.ashfire.connected;
  const night = f => { S.time = Math.floor(S.time / DL) * DL + DL * f; };
  const mr = Math.random; Math.random = () => 0;   // every roll a raider's
  S.weather = { state: 'clear', t: 9999, intensity: 0 }; night(0.75); Republic.tick(0.02); const clearNight = !wd.cutting && !wd.cut;
  S.weather = { state: 'grey', t: 9999, intensity: 0.8 }; night(0.3); Republic.tick(0.02); const stormDay = !wd.cutting;
  night(0.75); Republic.tick(0.02); const grace = !wd.cutting && wd.stormNight === Math.floor(S.time / DL);   // a storm night, but the relay went up today
  wd.t = S.time - DL * (CU.graceDays + 0.5); Republic.tick(0.02); const onceANight = !wd.cutting;   // the night was rolled already
  wd.stormNight = null; Republic.tick(0.02);   // the next storm night
  Math.random = mr;
  const near = DATA.camps.filter(x => Republic.raiderCamps().includes(x)).sort((a, b2) => U.dist(a.x, a.y, ash.x, ash.y) - U.dist(b2.x, b2.y, ash.x, ash.y))[0];
  const walks = !!wd.cutting && wd.cutting.from === near.id && !wd.cut;
  window.__from = near.id;
  return { raiders, lit0, clearNight, stormDay, grace, onceANight, walks, from: near.id };
});
const cu1 = JSON.stringify(r), cuOk1 = r.raiders === 'pass,ridge' && r.lit0 && r.clearNight && r.stormDay && r.grace && r.onceANight && r.walks;
/* seen: the raider walking in on the mast (the same frame without him), his words on the ground */
await drain(); await at(0.3);
const raiderSeen = await ev(async () => {
  const ash = DATA.camps.find(c => c.id === 'ash'), wd = S.camps.ash.wired, m = Republic.mastOf(ash), C = DATA.T.cut, sc = wd.cutting;
  S.weather = { state: 'clear', t: 9999, intensity: 0 };
  sc.t = C.walk * 0.6;
  const f = sc.t / C.walk, stand = { x: m.x + 14, y: m.y + 4 }, kx = sc.x0 + (stand.x - sc.x0) * f, ky = sc.y0 + (stand.y - sc.y0) * f;
  WL.tp([m.x - 150, m.y + 130]); S.dir = 0; __clearAmb(m.x, m.y, 320); Render.clearFx(); Render.setZoom(2.6); Render.cam.x = (kx + m.x) / 2; Render.cam.y = (ky + m.y) / 2 - 10; WL.timeScale = 0.001;
  await __wait(420); await __frames(3);
  const a = __grab(kx, ky - 14, 18), lbl = Render.labelBoxes().some(bx => bx.str === 'A RAIDER AT THE MAST');
  wd.cutting = null; await __wait(200); await __frames(3); const b2 = __grab(kx, ky - 14, 18); wd.cutting = sc;
  WL.timeScale = 1; Render.setZoom(null);
  return { raider: __diff(a, b2), lbl };
});
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), wd = S.camps.ash.wired, st = S.stations.ashfire, from = DATA.camps.find(x => x.id === __from);
  const w0 = S.wireLog.ashfire || 0;
  for (let i = 0; i < 80 && !wd.cut; i++) Republic.tick(0.25);
  const cut = !!wd.cut && wd.cut.by === __from && st.cut > 0 && !!st.cutSaid && S.mails.some(m => m.subj === 'Ash Camp: the wire cut' && m.body.includes(from.name)) && !!S.flags.tut.firstWireCut && Republic.cutAt(ash) && Republic.cutPosts().some(x => x.id === 'ash');
  const dark = World.lightAt(__dark.x, __dark.y) === 0;
  const shut = (Economy.ordersFor('ashfire') || []).length === 0 && !DATA.stationOrder.some(id => id !== 'ashfire' && (Economy.ordersFor(id) || []).some(o => o.to === 'ashfire')) && Systems.deliverablesAt('ashfire').length === 0;
  for (let i = 0; i < 20; i++) Economy.update(0.5);
  const noWire = (S.wireLog.ashfire || 0) === w0;   // the wire carries nothing to it
  for (let i = 0; i < 40 && wd.cutting; i++) Republic.tick(0.25);
  const ran = !wd.cutting;
  WL.tp('ashfire'); UI.openStation('ashfire');
  const tabs = document.getElementById('stationTabs').textContent.trim() === 'Board shut';
  const plate = document.querySelector('#stationBody .shutPlate'), shutPlate = !!plate && !!plate.querySelector('img') && /THE WIRE IS CUT — THE BOARD IS SHUT/.test(plate.textContent) && plate.textContent.includes(from.name) && /THE SPLICE COIL/.test(plate.textContent);
  const chief = document.getElementById('keeperLine').textContent.includes(st.cutSaid.line.slice(0, 20));
  document.getElementById('stationClose').click();
  const roll = /raiders/.test(UI.campRollHTML(from, true));   // the camp that cut it says it can
  WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('orders');
  const card = document.querySelector('#stationBody .orderCard.spliceCoil'), btn = card && card.querySelector('[data-splicecoil="ash"]');
  const cardOk = !!btn && btn.textContent.trim() === 'Accept' && /THE SPLICE COIL/.test(card.textContent) && card.textContent.includes(from.name) && card.textContent.includes(`+${DATA.T.cut.pay}`);
  return { cut, dark, shut, noWire, ran, tabs, shutPlate, chief, roll, cardOk };
});
const cu2 = JSON.stringify(r), cuOk2 = r.cut && r.dark && r.shut && r.noWire && r.ran && r.tabs && r.shutPlate && r.chief && r.roll && r.cardOk;
if (r.cardOk) { await page.click('#stationBody [data-splicecoil="ash"]'); await page.waitForTimeout(400); }
r = await ev(() => {
  const it = Republic.coilFor('ash');
  const took = !!it && it.defId === 'wireCoil' && it.kg === DATA.T.cut.kg && it.splice === 'ash';
  const onPack = /on your pack — splice it at the mast/.test(document.getElementById('stationBody').textContent);
  document.getElementById('stationClose').click();
  const once = Republic.takeCoil('ash') === false && S.cargo.filter(c2 => c2.splice === 'ash').length === 1;
  Guide.tick(0.3); const gs = Guide.current(), guide = !!gs && gs.id === 'splice';
  UI.tick(); const compass = [...document.querySelectorAll('#compassInner .cMark')].some(m => /the splice · Ash/.test(m.title) || (m.classList.contains('guide') && /^Splice|^Ash/.test(m.title)));
  return { took, onPack, once, guide, compass };
});
const cu3 = JSON.stringify(r), cuOk3 = r.took && r.onPack && r.once && r.guide && r.compass;
/* the coil rides the pack (the same frame without it) */
await drain(); await at(0.3);
const coilSeen = await ev(async () => {
  const look = async () => { WL.tp([DATA.stations.haven.x + 260, DATA.stations.haven.y + 200]); S.dir = 0; Render.faceWalker('E'); Systems.update(0.02, {}); __clearAmb(S.px, S.py, 160); Render.clearFx(); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 40; WL.timeScale = 0.001; await __wait(380); await __frames(3); const w = Render.walkerDrawn(), c = Render.walkerAt(9, (w.towerTop + 10) / 2); const d = __grab(c.x, c.y, 40); WL.timeScale = 1; return d; };   // v3.50: where the tower stands on the bedroll
  for (const n of NPC.party()) { n.cx = S.px + 400; n.cy = S.py + 400; }
  const withCoil = await look(), k = Republic.coilFor('ash'); S.cargo.splice(S.cargo.indexOf(k), 1);
  const without = await look(); S.cargo.push(k); Render.setZoom(null);
  return __diff(withCoil, without);
});
/* the cut post, seen: the mast broken above legs that stand where the whole mast's stood, the board boarded up with the rag,
   the live end sparking now and then, the words on the ground; against the same dark frame with the mast standing and the
   board as it was (the grey takes the unlit ground in both, so only the post differs) */
const postSeen = await ev(async () => {
  const ash = DATA.camps.find(c => c.id === 'ash'), wd = S.camps.ash.wired, st = S.stations.ashfire, d = DATA.stations.ashfire, m = Republic.mastOf(ash);
  const k0 = Republic.coilFor('ash'); if (k0) S.cargo.splice(S.cargo.indexOf(k0), 1);   // the coil off the pack for these frames: the guide's beacon would stand on the mast in one and not the other
  WL.tp([d.x + 70, d.y + 110]); S.dir = Math.PI; Systems.update(0.02, {}); Guide.tick(0.3); __clearAmb(d.x, d.y, 260); for (const n of NPC.party()) { n.cx = d.x + 400; n.cy = d.y + 400; }
  Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = (d.x + m.x) / 2; Render.cam.y = d.y - 24; WL.timeScale = 0.001;   // the drifting wisps off: they cross the ground between frames
  S.time = Math.floor(S.time / 3.2) * 3.2 + 0.2;   // a moment the live end sparks
  await __wait(420); await __frames(3);
  const Z = { legs: [m.x, m.y - 6, 8], top: [m.x, m.y - 50, 8], board: [d.x, d.y - 14, 12], spark: [m.x + 10, m.y - 27, 8] };
  const grabAll = () => Object.fromEntries(Object.entries(Z).map(([k, z]) => [k, __grab(...z)]));
  const A = grabAll(), lbl = Render.labelBoxes().some(bx => bx.str === 'THE WIRE CUT — THE BOARD SHUT');
  S.time += 1.3; await __wait(200); await __frames(3); const Q = grabAll();   // the live end between sparks
  const red = px => { let n = 0; for (let i = 0; i < px.length; i += 4) if (px[i] > px[i + 1] + 40 && px[i] > px[i + 2] + 40) n++; return n; }, rag = red(Q.board);
  const cut0 = wd.cut, sc0 = st.cut, con0 = st.connected; wd.cut = null; st.cut = 0; st.connected = false; await __wait(200); await __frames(3);
  const B = grabAll(), ragLit = red(B.board);
  wd.cut = cut0; st.cut = sc0; st.connected = con0;
  WL.timeScale = 1; Render.setZoom(null); Render.setFx(true); if (k0) S.cargo.push(k0);
  return { legs: __diff(Q.legs, B.legs), top: __diff(Q.top, B.top), board: __diff(Q.board, B.board), rag, ragLit, spark: __diff(A.spark, Q.spark), lbl };
});
ok('THE WIRE CUT: raiders come only from the camps still up; a clear night brings none, a storm by day none, a storm night inside the grace after the relay went up none — one roll a night — and past the grace, on a storm night, a raider walks in from the nearest camp still up (seen walking in against the same frame without him, his words on the ground); he cuts the mast and runs: the post is dark (its light gone), its board shut and no board posts to it, nothing handed over, the wire carries nothing to it (the mail naming his camp, the lesson); its terminal is one tab — Board shut — with the boarded board and what to carry, the chief says it at the door; the roll of the camp that cut it says it raids; every lit board carries THE SPLICE COIL with a plain Accept — a real click puts it on the pack, once, the guide and the compass walk it to the mast, and it rides the pack (against the same frame without it); seen: the mast broken above legs that stand exactly where the lit mast\'s stood, no lamp, the board boarded up with the rag, the live end sparking between quiet moments, the words on the ground (all pixel-sampled against the same dark frame with the mast standing)',
  cuOk1 && raiderSeen.raider > 30 && raiderSeen.lbl && cuOk2 && cuOk3 && coilSeen > 6 && postSeen.legs < 8 && postSeen.top > 20 && postSeen.board > 20 && postSeen.rag > postSeen.ragLit + 6 && postSeen.spark > 6 && postSeen.lbl,
  cu0 + ' ' + cu1 + ' raider=' + JSON.stringify(raiderSeen) + ' ' + cu2 + ' ' + cu3 + ' coil=' + coilSeen + ' post=' + JSON.stringify(postSeen));

/* ================= 4 · THE SPLICE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), m = Republic.mastOf(ash), wd = S.camps.ash.wired, st = S.stations.ashfire;
  WL.tp([m.x + 420, m.y + 320]); const far = !Systems.getInteractions().some(i => /Splice/.test(i.label));
  WL.tp([m.x + 60, m.y + 40]);
  const gi = Systems.getInteractions().find(i => i.key === 'G' && /Splice <b>the wire<\/b>/.test(i.label)); if (!gi) return { g: false, far };
  window.__sp = { likes0: S.likes, lt0: st.likesTo };
  gi.fn();
  const splicing = !!wd.splicing && !Republic.coilFor('ash') && !!wd.cut;
  return { g: true, far, splicing };
});
const sp1 = JSON.stringify(r), spOk1 = r.g && r.far && r.splicing;
/* seen: the splice sparking at the broken top, the words on the ground (the same frame cut but not being spliced) */
const spliceSeen = await ev(async () => {
  const ash = DATA.camps.find(c => c.id === 'ash'), wd = S.camps.ash.wired, m = Republic.mastOf(ash);
  Render.clearFx(); Render.setZoom(3); Render.cam.x = m.x; Render.cam.y = m.y - 30; WL.timeScale = 0.001;
  S.time = Math.floor(S.time / 3.2) * 3.2 + 1.5;   // the live end quiet: only the splice sparks
  await __wait(400); await __frames(3);
  const a = __grab(m.x - 4, m.y - 43, 10), lbl = Render.labelBoxes().some(bx => bx.str === 'SPLICING THE WIRE');
  const sp = wd.splicing; wd.splicing = null; await __wait(200); await __frames(3); const b2 = __grab(m.x - 4, m.y - 43, 10); wd.splicing = sp;
  WL.timeScale = 1; Render.setZoom(null);
  return { spark: __diff(a, b2), lbl };
});
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), wd = S.camps.ash.wired, st = S.stations.ashfire, CU = DATA.T.cut, DL = DATA.T.dayLen;
  for (let i = 0; i < 40 && wd.splicing; i++) Republic.tick(0.25);
  const lit = !wd.cut && !wd.splicing && wd.spliced > 0 && !st.cut && !st.cutSaid && World.lightAt(__dark.x, __dark.y) > 0 && !Republic.cutAt(ash);
  const paid = S.likes >= __sp.likes0 + CU.pay && st.likesTo === Math.min(100, __sp.lt0 + CU.likes) && S.mails.some(m => m.subj === 'Ash Camp: the wire spliced') && !!S.flags.tut.firstSplice;
  const open = (Economy.ordersFor('ashfire') || []).length > 0 && DATA.stationOrder.some(id => id !== 'ashfire' && (Economy.ordersFor(id) || []).some(o => o.to === 'ashfire'));
  const w0 = S.wireLog.ashfire || 0; for (const g of DATA.stations.ashfire.needs) st.stock[g] = 20; for (let i = 0; i < 20; i++) Economy.update(0.5); const fed = (S.wireLog.ashfire || 0) > w0;
  const noCard = !Republic.cutPosts().length;
  /* a storm night inside the splice's grace: the raider stays home */
  const mr = Math.random; Math.random = () => 0; S.weather = { state: 'grey', t: 9999, intensity: 0.8 }; S.time = Math.floor(S.time / DL) * DL + DL * 0.8; wd.stormNight = null; Republic.tick(0.02); Math.random = mr;
  const grace = !wd.cutting && !wd.cut;
  S.weather = { state: 'clear', t: 9999, intensity: 0 };
  return { lit, paid, open, fed, noCard, grace };
});
ok('THE SPLICE: G at the mast, in reach and not from across the field — the coil comes off the pack and the splice sparks at the broken top (against the same frame cut but not being spliced), the words on the ground; the lamp lights again: the post lit (its light back), the board open and posted to, the wire feeding it again, the splice paid like a delivery (likes, the post warmer; the mail, the lesson), no coil card left on any board; a storm night inside the splice\'s grace brings no raider',
  spOk1 && spliceSeen.spark > 6 && spliceSeen.lbl && r.lit && r.paid && r.open && r.fed && r.noCard && r.grace, sp1 + ' seen=' + JSON.stringify(spliceSeen) + ' ' + JSON.stringify(r));

/* ================= 5 · THE RING GIVEN ================= */
r = await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, DL = DATA.T.dayLen;
  c.taken = null; c.pacified = false; c.truce = 0; c.pact = null; c.grudge = null; c.siegeTruce = null; c.watchRun = null; c.runners = []; c.lines = 1;   // came out to the line once before
  S.cargo = S.cargo.filter(x => x.cat === 'tool');
  for (const n of S.npcs.filter(x => x.state === 'companion')) { n.state = 'pool'; n.at = 'haven'; }
  const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven').slice(0, 3); for (const n of pool) NPC.hire(n, 'companion');
  const roll1 = /came out to your line/.test(UI.campRollHTML(pass, true)) && /the next time the camp gives its ring up/.test(UI.campRollHTML(pass, true));
  WL.tp([pass.x + 100, pass.y + 1150]); for (const n of NPC.party()) { n.cx = S.px + 20; n.cy = S.py + 20; }
  UI.toggleMap(true); UI.ringWalk('pass'); UI.toggleMap(false);
  const m = S.moveTo; WL.tp([m.x + 4, m.y + 4]); S.stagger = 0; S.struggle = null; Systems.update(0.05, {}); for (let i = 0; i < 40; i++) Systems.update(0.1, {});
  c.watchRun = { n: DATA.T.siege.nights - 1, last: Math.floor(S.time / DL) - 1 };
  const made = Systems.lineOrder('watch') && Systems.watches().some(w => w.camp === 'pass');
  document.getElementById('keeperSay').classList.add('hidden');
  return { roll1, made, party: NPC.party().length };
});
const gv1 = JSON.stringify(r), gvOk1 = r.roll1 && r.made;
await at(0.72);
await ev(() => { for (let i = 0; i < 4; i++) Systems.update(0.1, {}); });
await at(1.08);
r = await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, w = Systems.watches().find(x => x.camp === 'pass');
  Systems.update(0.05, {});
  const sg = w && w.siege; if (!sg || sg.phase !== 'out') return { out: false, phase: sg && sg.phase };
  const likes0 = S.likes;
  for (let i = 0; i < 800 && sg.phase === 'out'; i++) Systems.update(0.1, {});
  for (let i = 0; i < 200 && sg.phase === 'talk'; i++) Systems.update(0.1, {});
  const given = !!c.given && sg.given === true && c.pacified && !c.siegeTruce && !c.watchRun && c.lines === 2 && S.mails.some(m => m.subj === 'Pass Camp gives up its ring') && !!S.flags.tut.firstGiven && S.likes >= likes0 + DATA.T.given.likes;
  const structs = S.structures.filter(x => x.given === 'pass').map(x => x.type).sort().join(',') === 'pobox,shelter';
  const noRaider = !Republic.raiderCamps().some(x => x.id === 'pass');
  for (let i = 0; i < 400 && !sg.done; i++) Systems.update(0.1, {});
  for (let i = 0; i < 60 && !w.home; i++) Systems.update(0.1, {});
  const home = sg.done && !!w.home;
  return { out: true, given, structs, noRaider, home };
});
const gv2 = JSON.stringify(r), gvOk2 = r.out && r.given && r.structs && r.noRaider && r.home;
/* seen: the fighters leaving for the hills, hides rolled on their backs (the same frame once they are gone), the words */
await drain(); await at(0.3);
const leaveSeen = await ev(async () => {
  const pass = DATA.camps.find(c => c.id === 'pass'), g = S.camps.pass.given;
  S.weather = { state: 'clear', t: 9999, intensity: 0 };
  g.t = S.time - 3; g.left = false; g.said = true;
  const f0 = g.figs[0], d2 = (3 - 1.2) * DATA.T.siege.speed * 1.1, fx = pass.x + f0.ox + g.dir.x * d2, fy = pass.y + 10 + f0.oy + g.dir.y * d2;
  WL.tp([pass.x - 120, pass.y + 170]); S.dir = 0; __clearAmb(pass.x, pass.y, 420); for (const n of NPC.party()) { n.cx = pass.x - 500; n.cy = pass.y + 500; }
  Render.clearFx(); Render.setZoom(2.6); Render.cam.x = fx; Render.cam.y = fy - 20; WL.timeScale = 0.001;
  await __wait(420); await __frames(3);
  const a = __grab(fx, fy - 16, 18), lbl = Render.labelBoxes().some(bx => bx.str === 'THEY LEAVE FOR THE HILLS');
  g.left = true; await __wait(200); await __frames(3); const b2 = __grab(fx, fy - 16, 18); g.left = false;
  WL.timeScale = 1; Render.setZoom(null);
  return { figs: __diff(a, b2), lbl };
});
/* seen: the rest stop — the pegs where the tents stood, the stones round the fire, the sign with its lamp (the same frame of
   the camp not given), the words on the ground */
const restSeen = await ev(async () => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, g = c.given; g.left = true;
  WL.tp([pass.x + 90, pass.y + 160]); S.dir = Math.PI; __clearAmb(pass.x, pass.y, 420);
  S.weather = { state: 'clear', t: 9999, intensity: 0 };   // v3.52: the lamp read by its own colour wants clear skies (under the grey's rain its light reads paler — the check had failed whenever it rained at Pass Camp)
  Render.clearFx(); Render.setZoom(3); Render.cam.x = pass.x - 10; Render.cam.y = pass.y - 6; WL.timeScale = 0.001;
  await __wait(420); await __frames(3);
  const Z = [[pass.x - 35.25, pass.y - 16, 10], [pass.x, pass.y + 1.5, 8], [pass.x - 20, pass.y + 26.5, 10]];
  const A = Z.map(z => __grab(...z)), lamp = __count(A[0], __hex('#ffd98f'), 30), lbl = Render.labelBoxes().some(bx => bx.str === 'PASS CAMP — GIVEN · A REST STOP');
  c.given = null; await __wait(200); await __frames(3); const B = Z.map(z => __grab(...z)), lampB = __count(B[0], __hex('#ffd98f'), 30); c.given = g;
  WL.timeScale = 1; Render.setZoom(null);
  return { sign: __diff(A[0], B[0]), hearth: __diff(A[1], B[1]), pegs: __diff(A[2], B[2]), lamp, lampB, lbl };
});
r = await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, sh = S.structures.find(x => x.given === 'pass' && x.type === 'shelter'), box = S.structures.find(x => x.given === 'pass' && x.type === 'pobox');
  const left = c.given.left;
  /* the fire: the Walker rests there — mends and warms as at a door */
  const restAt = (x, y) => { WL.tp([x, y]); S.health = 50; S.food = 80; S.bleeding = false; S.warmth = 40; S.speed = 0; for (let i = 0; i < 5; i++) Porter.update(1); return { h: S.health, w: S.warmth }; };
  const fire = !!Republic.restFire(pass.x + 10, pass.y + 20) && Republic.givenAt(pass) && !Republic.restFire(pass.x + 700, pass.y + 500);
  const atFire = restAt(pass.x + 10, pass.y + 20), away = restAt(pass.x + 700, pass.y + 500);
  const mends = atFire.h >= 52.5 && away.h < 51;
  /* the hide shelter keeps the rain off; the box keeps cargo */
  WL.tp([sh.x, sh.y + 20]); const shelter = !!Systems.inAura('shelter');
  WL.tp([box.x + 10, box.y + 10]); S.cargo.push(State.makeItem('metal'));
  const stash = Systems.getInteractions().find(i => i.key === 'E' && /Stash your load in the <b>box<\/b>/.test(i.label)); if (stash) stash.fn();
  const boxed = !!stash && (box.box || []).some(x => x.defId === 'metal');
  /* kept by the valley: no decay (a shelter of yours beside it wears in the same storm) */
  const ctl = { id: U.uid(), type: 'shelter', x: pass.x + 900, y: pass.y + 500, ang: 0, hp: 100, by: 'you', likes: 0 }; S.structures.push(ctl);
  sh.hp = 100; box.hp = 100; S.stormT = 30; for (let i = 0; i < 30; i++) Systems.update(0.5, {}); S.stormT = 0;
  const kept = sh.hp === 100 && box.hp === 100 && ctl.hp < 100; S.structures.splice(S.structures.indexOf(ctl), 1);
  /* open ground: nobody runs at a loaded Walker in the ring */
  WL.tp([pass.x + 200, pass.y + 120]); S.bleeding = false; const hp0 = S.health; for (let i = 0; i < 30; i++) Systems.update(0.1, {});
  const calm = !c.runners.length && S.health >= hp0 - 0.01 && !S.struggle;
  const R = UI.campRollHTML(pass, true), roll = /GIVEN · A REST STOP/.test(R) && /the hide shelter/.test(R) && /1 kept in it/.test(R) && !/raiders/.test(R);
  return { left, fire, mends, atFire, away, shelter, boxed, kept, calm, roll };
});
const gv3 = JSON.stringify(r), gvOk3 = r.left && r.fire && r.mends && r.shelter && r.boxed && r.kept && r.calm && r.roll;
/* the sheet: the ring a warm dotted line, the rest stop's mark at the fire, its words (the same sheet with the ring not given) */
await ev(() => { UI.toggleMap(true); }); await page.waitForTimeout(300);
const givenMap = await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, cv = document.getElementById('map'), g = cv.getContext('2d'), r0 = cv.getBoundingClientRect(), dpr = devicePixelRatio;
  const grab = () => { const m = UI.mapPoint(pass.x, pass.y); return g.getImageData(Math.round((m.x - r0.left - 40) * dpr), Math.round((m.y - r0.top - 30) * dpr), Math.round(80 * dpr), Math.round(60 * dpr)).data; };
  UI.drawMap(); const a = grab(); const g0 = c.given; c.given = null; UI.drawMap(); const b2 = grab(); c.given = g0; UI.drawMap();
  UI.toggleMap(false);
  let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b2[i]) + Math.abs(a[i + 1] - b2[i + 1]) + Math.abs(a[i + 2] - b2[i + 2]) > 60) n++; return n;
});
ok('THE RING GIVEN: a camp that came out to your line once says the next time it gives its ring up; the watch\'s third night, the chief walks out again — and this time gives the ring up (the mail, the lesson, likes): no truce needed, the count spent, its hide shelter and its box left standing by the fire, no raider from it again; he walks back and the watch walks home; seen: the fighters leaving for the hills with their hides rolled on their backs (against the same frame once they are gone) and the words; the rest stop: the pegs where the tents stood, the stones round the fire, the sign with its lamp (against the same frame of the camp not given) and its words; at the fire the Walker mends as at a door, and not out on the road; the hide keeps the rain off; the box keeps cargo; the valley keeps them (no decay, where a shelter of yours wears in the same storm); open ground — no runner, no cut; the roll is a rest stop\'s plate; the sheet marks it (pixel-sampled)',
  gvOk1 && gvOk2 && leaveSeen.figs > 30 && leaveSeen.lbl && restSeen.sign > 20 && restSeen.hearth > 8 && restSeen.pegs > 20 && restSeen.lamp > restSeen.lampB + 4 && restSeen.lbl && gvOk3 && givenMap > 40,
  gv1 + ' ' + gv2 + ' leave=' + JSON.stringify(leaveSeen) + ' rest=' + JSON.stringify(restSeen) + ' ' + gv3 + ' map=' + givenMap);

/* ================= 6 · THE KNIVES' STONE ================= */
r = await ev(() => { try {
  const ridge = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge, DL = DATA.T.dayLen, KS = DATA.T.kstone;
  c.taken = null; c.pacified = false; c.truce = 0; c.pact = null; c.siegeTruce = null; c.runners = []; c.given = null; c.stoneGiven = 0;
  for (const w of Systems.watches().slice()) { for (const n of Systems.watchers(w)) { n.state = 'companion'; n.watchId = null; } Systems.watches().splice(0, 1); }
  for (const n of S.npcs.filter(x => x.state === 'waiting')) n.state = 'companion';
  const n = NPC.party()[0]; if (!n) return { party: false };
  const first = n.name.split(' ')[0];
  Republic.settleStones().length = 0;
  const st2 = { x: ridge.x + 40, y: ridge.y + ridge.r + 60, name: first, npc: n.id, camp: 'ridge', t: S.time - DL * (KS.days - 1), how: 'taken', calm: true, twice: true };
  Republic.settleStones().push(st2); n.settled = [{ camp: 'ridge', t: st2.t, how: 'taken', twice: true }];
  Republic.tick(0.02);
  const notYet = !st2.kstone;   // six days standing: nothing
  st2.t -= DL + 1; n.settled[0].t = st2.t;   // a week
  Republic.tick(0.02);
  const walks = !!st2.kstone && !st2.kstone.set && !c.stoneGiven;
  const up = !c.pacified && !c.taken && Republic.raiderCamps().some(x => x.id === 'ridge');
  window.__ks = { n: n.id };
  return { party: true, notYet, walks, up };
} catch (e) { return { err: String(e.stack).slice(0, 500) }; } });
const ks1 = JSON.stringify(r), ksOk1 = r.party && r.notYet && r.walks && r.up;
/* seen: a knife walking out with a stone of the camp's own held in front (the same frame with him far off) */
await drain(); await at(0.3);
const carrySeen = await ev(async () => {
  const st2 = Republic.settleStones().find(x => x.camp === 'ridge'), ks = st2.kstone, KS = DATA.T.kstone;
  ks.t = KS.walk * 0.5;
  const spot = { x: st2.x + 24, y: st2.y + 2 }, stand = { x: spot.x + 16, y: spot.y + 2 }, kx = ks.x0 + (stand.x - ks.x0) * 0.5, ky = ks.y0 + (stand.y - ks.y0) * 0.5;
  WL.tp([st2.x + 130, st2.y + 120]); S.dir = Math.PI; __clearAmb(kx, ky, 300); for (const n of NPC.party()) { n.cx = st2.x + 400; n.cy = st2.y + 400; } S.camps.ridge.runners = [];
  Render.clearFx(); Render.setZoom(3); Render.cam.x = kx; Render.cam.y = ky - 14; WL.timeScale = 0.001;
  await __wait(420); await __frames(3);
  const a = __grab(kx, ky - 18, 16);
  st2.kstone = { ...ks, x0: ks.x0 + 6000 }; await __wait(200); await __frames(3); const b2 = __grab(kx, ky - 18, 16); st2.kstone = ks;
  WL.timeScale = 1; Render.setZoom(null);
  return __diff(a, b2);
});
r = await ev(() => {
  const ridge = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge, st2 = Republic.settleStones().find(x => x.camp === 'ridge'), n = S.npcs.find(x => x.id === __ks.n);
  for (let i = 0; i < 60 && !(st2.kstone && st2.kstone.set); i++) Republic.tick(0.25);
  const set = !!st2.kstone.set && c.stoneGiven > 0 && !!n.kstone && n.kstone.camp === 'ridge' && S.mails.some(m => m.subj === 'Ridge Camp: the knives\' stone') && !!S.flags.tut.firstKnivesStone;
  const mood = NPC.mood(n).causes.some(x => x.id === 'kstone');
  MusterUI.open(n.id); const plate = /SETTLED AT RIDGE CAMP — TWICE · THE KNIVES SET A STONE BESIDE IT/.test(document.getElementById('musterOv').textContent); MusterUI.close();
  const R = UI.campRollHTML(ridge, true), roll = /the knives' stone/.test(R) && !/raiders/.test(R);
  const up = !c.pacified && !c.taken, noRaider = !Republic.raiderCamps().some(x => x.id === 'ridge');
  const mails0 = S.mails.filter(m => /the knives' stone/.test(m.subj)).length; for (let i = 0; i < 20; i++) Republic.tick(0.25);
  const once = S.mails.filter(m => /the knives' stone/.test(m.subj)).length === mails0;
  return { set, mood, plate, roll, up, noRaider, once };
});
const ks2 = JSON.stringify(r), ksOk2 = r.set && r.mood && r.plate && r.roll && r.up && r.noRaider && r.once;
/* seen: the camp's stone beside the cairn, its black thread (the same frame without it), the words on the ground */
const kstoneSeen = await ev(async () => {
  const st2 = Republic.settleStones().find(x => x.camp === 'ridge'), spot = { x: st2.x + 24, y: st2.y + 2 };
  st2.kstone.set = S.time - 10;   // the knife long back at the fire
  WL.tp([st2.x + 60, st2.y + 50]); S.dir = Math.PI; __clearAmb(st2.x, st2.y, 300); S.camps.ridge.runners = [];
  Render.clearFx(); Render.setZoom(3); Render.cam.x = spot.x - 6; Render.cam.y = spot.y - 6; WL.timeScale = 0.001;
  await __wait(420); await __frames(3);
  /* the stone's inner rows, down its middle (the outline rows left out): the black thread is the darkest band across a pale stone */
  const cv = document.getElementById('game'), g = cv.getContext('2d'), p0 = __toScr(spot.x, spot.y - 9), p1 = __toScr(spot.x, spot.y + 1.5), dpr = devicePixelRatio, half = Math.round(4 * Render.effZoom() / dpr);
  const rowsL = []; for (let y = Math.round(p0.y); y < Math.round(p1.y); y++) { const d = g.getImageData(Math.round((p0.x - half) * dpr), Math.round(y * dpr), Math.round(half * 2 * dpr), 1).data; let s2 = 0; for (let i = 0; i < d.length; i += 4) s2 += d[i] + d[i + 1] + d[i + 2]; rowsL.push(s2 / (d.length / 4) / 3); }
  const thread = Math.min(...rowsL), stone = Math.max(...rowsL);
  const a = __grab(spot.x, spot.y - 4, 10), lbl = Render.labelBoxes().some(bx => bx.str === 'THE KNIVES\' STONE');
  const ks = st2.kstone; st2.kstone = { t: 0, x0: st2.x + 6000, y0: st2.y }; await __wait(200); await __frames(3);
  const b2 = __grab(spot.x, spot.y - 4, 10); st2.kstone = ks;
  WL.timeScale = 1; Render.setZoom(null);
  return { stone: __diff(a, b2), thread: Math.round(thread), stoneLum: Math.round(stone), lbl };
});
await ev(() => { UI.toggleMap(true); }); await page.waitForTimeout(300);
const ksMap = await ev(() => {
  const st2 = Republic.settleStones().find(x => x.camp === 'ridge'), cv = document.getElementById('map'), g = cv.getContext('2d'), r0 = cv.getBoundingClientRect(), dpr = devicePixelRatio;
  const grab = () => { const m = UI.mapPoint(st2.x, st2.y); return g.getImageData(Math.round((m.x - r0.left) * dpr), Math.round((m.y - r0.top - 14) * dpr), Math.round(28 * dpr), Math.round(20 * dpr)).data; };
  UI.drawMap(); const a = grab(); const ks = st2.kstone; st2.kstone = null; UI.drawMap(); const b2 = grab(); st2.kstone = ks; UI.drawMap(); UI.toggleMap(false);
  let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b2[i]) + Math.abs(a[i + 1] - b2[i + 1]) + Math.abs(a[i + 2] - b2[i + 2]) > 60) n++; return n;
});
ok('THE KNIVES\' STONE: a cairn set twice at Ridge Camp and standing six days has nothing; at a week a knife walks out from the camp\'s side of the ring carrying a stone of their own (seen against the same frame with him far off) and sets it beside the cairn — the camp\'s stone with a black thread (seen against the same frame without it: the stone, its black thread, the words on the ground; the sheet marks it beside the cairn); the one who set the cairn is lifted (the mood), the plate says the knives set a stone beside it, the roll says so (the mail, the lesson), once; the camp stays up — and sends no raider against your wire again',
  ksOk1 && carrySeen > 30 && ksOk2 && kstoneSeen.stone > 20 && kstoneSeen.thread < kstoneSeen.stoneLum * 0.6 && kstoneSeen.lbl && ksMap > 8, ks1 + ' carry=' + carrySeen + ' ' + ks2 + ' seen=' + JSON.stringify(kstoneSeen) + ' map=' + ksMap);

/* ================= 7 · THE HAND WHO STAYS ================= */
r = await ev(() => {
  const DL = DATA.T.dayLen, KD = DATA.T.kinDay;
  if (typeof Memorial !== 'undefined') Memorial.revealGround('town');
  S.legacy.push({ name: 'Halvard Penrose', cls: 'The town\'s own', fate: 'fell when the square rose at The Mill', likes: 0, km: '0.0', deliveries: 3, cheated: false, seed: 4242, fact: 'town', kit: 'townshield', town: 'mill', home: true, keepsake: 'whistle', keepsakeT: S.time - DL * KD.every - 1, kinName: 'Wenna Penrose' });
  Memorial.raise('town');
  window.__kd = { i: S.legacy.length - 1 };
  /* two backs in the wedge: room for one more */
  for (const n of NPC.hired().slice(2)) { n.state = 'pool'; n.at = 'haven'; }
  return { today: Republic.kinDayToday(S.legacy[__kd.i]), hired: NPC.hired().length };
});
const st0 = JSON.stringify(r);
await at(0.56);   // dusk: the kin at the stone
r = await ev(() => {
  const r0 = S.legacy[__kd.i], sl = Republic.kinDaySlot(r0), KD = DATA.T.kinDay, ids = [], legs = [];
  for (let leg = 1; leg <= 3; leg++) {
    if (leg > 1) r0.kinDayHeard = null;   // seven days on: the next kin's day
    WL.tp([sl.x + 20, sl.y + 60]); Republic.tick(0.02);
    const n = S.npcs.find(x => x.lent && x.state === 'companion'); if (!n) return { fail: leg, ids };
    ids.push(n.id);
    n.lent.t -= KD.leg + 1; WL.tp('haven'); Republic.tick(0.02);
    legs.push({ legs: n.kinLegs, state: n.state });
    for (let i = 0; i < 4000 && n.state === 'lentHome'; i++) Republic.tick(0.25);
    if (leg < 3 && !(n.state === 'pool' && n.at === 'mill')) return { fail: 'home' + leg, ids, legs };
  }
  const n = S.npcs.find(x => x.id === ids[2]);
  const same = new Set(ids).size === 1;   // the town sends the same hand
  const stays = !!n.stays && n.stays.town === 'mill' && n.stays.for === 'Halvard Penrose' && n.kinLegs === 3 && !n.lent && n.state === 'companion' && n.feeWaived && NPC.hireCost(n) === null && NPC.hired().includes(n);
  const told = S.mails.some(m => m.subj === `${n.name} stays on`) && !!S.flags.tut.firstStays;
  const roll = NPC.everyone().some(e => e.n === n && /walks for Halvard's day, stayed on/.test(e.place));
  const mood = NPC.mood(n).causes.some(x => x.id === 'stays');
  MusterUI.open(n.id); const plate = /STAYED ON — HALVARD'S DAY/.test(document.getElementById('musterOv').textContent) && /The Mill's hand/.test(document.getElementById('musterOv').textContent); MusterUI.close();
  /* the next kin's day, the Mill sends someone new: the hand who stayed is yours now */
  r0.kinDayHeard = null; WL.tp([sl.x + 20, sl.y + 60]); Republic.tick(0.02); const nx = S.npcs.find(x => x.lent && x.state === 'companion');
  const fresh = !!nx && nx.id !== n.id && !n.lent;
  if (nx) { nx.state = 'pool'; nx.at = 'mill'; nx.lent = null; nx.feeWaived = false; }
  window.__kd.n = n.id;
  return { ids, legs, same, stays, told, roll, mood, plate, fresh };
});
const hs1 = JSON.stringify(r), hsOk1 = r.same && r.legs && r.legs[0].legs === 1 && r.legs[0].state === 'lentHome' && r.legs[1].legs === 2 && r.stays && r.told && r.roll && r.mood && r.plate && r.fresh;
/* the full wedge: a hand who asks to stay waits at the door's fire and joins for no fee the moment there is room */
r = await ev(() => {
  const n2 = NPC.gen({ at: 'green' }); S.npcs.push(n2); n2.state = 'companion'; n2.feeWaived = true; n2.lent = { town: 'green', t: S.time, for: 'Halvard Penrose' }; n2.kinLegs = 3;
  while (NPC.hired().length < NPC.partyCap()) { const p2 = S.npcs.find(x => x.state === 'pool' && !x.stays && !x.lent && x.at === 'haven'); if (!p2) break; NPC.hire(p2, 'companion'); }
  const full = NPC.hired().length === NPC.partyCap();
  WL.tp('haven'); Republic.stayOn(n2, 'haven');
  const waits = n2.state === 'pool' && n2.at === 'haven' && !!n2.stays && !n2.lent && /waiting at Haven/.test(document.getElementById('toasts').textContent);
  const other = NPC.hired().find(x => x.id !== __kd.n); other.state = 'pool'; other.at = 'haven';
  const bank0 = JSON.stringify(S.banked), joined = NPC.hire(n2, 'companion') && n2.state === 'companion' && JSON.stringify(S.banked) === bank0;
  return { full, waits, joined };
});
const hs2 = JSON.stringify(r), hsOk2 = r.full && r.waits && r.joined;
/* the pin through the ribbon (the same frame with the ribbon and no pin) */
await drain(); await at(0.3);
const pinSeen = await ev(async () => {
  const n = S.npcs.find(x => x.id === __kd.n);
  WL.tp([DATA.stations.haven.x + 300, DATA.stations.haven.y + 220]); n.cx = S.px - 90; n.cy = S.py - 70; n._dir = Math.PI / 2; n._px = n.cx; n._py = n.cy;   // v3.50: toward the eye, the pin at the chest
  for (const o of NPC.party()) if (o !== n) { o.cx = S.px + 400; o.cy = S.py + 400; }
  __clearAmb(n.cx, n.cy, 200); Render.clearFx(); Render.setZoom(3); Render.cam.x = n.cx; Render.cam.y = n.cy - 14; WL.timeScale = 0.001;
  await __wait(400); await __frames(3);
  const a = __grab(n.cx, n.cy - 24, 24), white = __count(a, __hex('#fff2d0'), 24);
  const s0 = n.stays; n.stays = null; n.lent = { town: 'mill', t: S.time, for: 'x' }; await __wait(200); await __frames(3);
  const b2 = __grab(n.cx, n.cy - 24, 24), whiteB = __count(b2, __hex('#fff2d0'), 24); n.stays = s0; n.lent = null;
  WL.timeScale = 1; Render.setZoom(null);
  return { pin: __diff(a, b2), white, whiteB };
});
ok('THE HAND WHO STAYS: on a stone\'s day the Mill sends its hand; the leg walked, they turn back for home — and the next kin\'s day the town sends the same hand, and the next; at the door where the third leg ends they ask to stay on (the mail, the lesson): for good, the ribbon kept, no fee, a place in the wedge; the plate says STAYED ON — HALVARD\'S DAY and the Mill\'s hand, the roll says whose day they walk for, the mood carries it; the next kin\'s day the Mill sends someone new; with the wedge full a hand who asks waits at that door\'s fire and joins the moment there is room, for no fee; seen: the white pin through the ribbon (against the same frame with the ribbon and no pin)',
  hsOk1 && hsOk2 && pinSeen.pin > 3 && pinSeen.white > pinSeen.whiteB, st0 + ' ' + hs1 + ' ' + hs2 + ' pin=' + JSON.stringify(pinSeen));

/* ================= 8 · THE CORRECTIONS ================= */
/* the wheel: up zooms the camera in, down out, a whole level a notch; not while a window is open; remembered */
await ev(() => { UI.closeAllModals(); Render.setZoom(null); Render.setZoomStep(0); UI.opts.zoomStep = 0; UI.saveOpts(); WL.tp('haven'); WL.timeScale = 1; });
await page.waitForTimeout(1800);
await page.mouse.move(720, 430);
const z0 = await ev(() => ({ step: Render.zoomStepOf(), z: Render.zoomLevel() }));
await page.mouse.wheel(0, -120); await page.waitForTimeout(250);
const zNote = await ev(() => ({ on: document.getElementById('zoomNote').classList.contains('on'), txt: document.getElementById('zoomNote').textContent }));
await page.waitForTimeout(1800);
const z1 = await ev(() => ({ step: Render.zoomStepOf(), z: Render.zoomLevel(), opt: UI.opts.zoomStep, stored: (JSON.parse(localStorage.getItem('waylight.opts') || '{}') || {}).zoomStep }));
await page.mouse.wheel(0, 120); await page.waitForTimeout(150); await page.mouse.wheel(0, 120); await page.waitForTimeout(1800);
const z2 = await ev(() => ({ step: Render.zoomStepOf(), z: Render.zoomLevel() }));
for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -120); await page.waitForTimeout(60); }
const z3 = await ev(() => Render.zoomStepOf()), zMax = await ev(() => Render.zoomRange().max);
await page.mouse.wheel(0, 30); await page.waitForTimeout(100);
const zSmall = await ev(() => Render.zoomStepOf());   // a trackpad's nudge is not a notch
await ev(() => UI.toggleMap(true)); await page.waitForTimeout(250);
await page.mouse.wheel(0, 120); await page.mouse.wheel(0, 120); await page.waitForTimeout(250);
const zModal = await ev(() => { const s = Render.zoomStepOf(); UI.toggleMap(false); return s; });
/* at every level the Walker and the ground keep their proportion: a sprite texel one buffer pixel, a ground texel two, the
   block a whole number of screen pixels (a stretched world had drawn the sprites at the pixel they cannot go under while the
   ground halved beneath them) */
const zLaw = [];
for (let st = await ev(() => Render.zoomRange().min); st <= await ev(() => Render.zoomRange().max); st++) {
  await ev(st => Render.setZoomStep(st), st); await page.waitForTimeout(1600);
  zLaw.push(await ev(() => { const L = Render.texelLaw(); return { P: L.P, zw: +L.zw.toFixed(3), rig: L.rigK, blit: L.blitK, z: +L.z.toFixed(3) }; }));
}
const lawOk = zLaw.length >= 4 && zLaw.every(L => Math.abs(L.rig / L.zw - 2.5) < 1e-9 && Math.abs(L.blit / L.zw - 2.5) < 1e-9 && Number.isInteger(L.P) && Math.abs(L.z - L.zw * L.P) < 1e-9) && zLaw.every((L, i) => !i || L.z > zLaw[i - 1].z);
await ev(() => { Render.setZoomStep(1); UI.opts.zoomStep = 1; UI.saveOpts(); });
ok('THE WHEEL: wheel up zooms the camera in a whole level (the level note says so), wheel down out — at every level a sprite texel is one buffer pixel and a ground texel two, the block a whole number of screen pixels, so the Walker and the ground keep their proportion; the level is remembered for this viewer; it stops at the nearest and farthest levels; a trackpad\'s nudge is not a notch; with a window open the wheel is the window\'s',
  z1.step === 1 && z1.z > z0.z && zNote.on && /ZOOM \+1/.test(zNote.txt) && z1.opt === 1 && z1.stored === 1 && z2.step === -1 && z2.z < z0.z && z3 === zMax && zSmall === zMax && zModal === zMax && lawOk, JSON.stringify({ z0, zNote, z1, z2, z3, zSmall, zModal, zLaw }));
/* the windows say what they are */
r = await ev(() => {
  WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('orders');
  const tabs = [...document.querySelectorAll('#stationTabs .tab')].map(t => t.textContent.trim()).join('|');
  const acc = [...document.querySelectorAll('#stationBody .orderCard [data-accept]')], accept = acc.length > 0 && acc.every(bn => bn.textContent.trim() === 'Accept');
  document.getElementById('stationClose').click();
  const cryptic = /MUSTER ROLL|LEDGER|CARRY IT|WAYBILL|BANNER SHEET|FIELD MANUAL|THE SURVEY|DOSSIER|MANIFEST|PASSAGE|SHOULDER THE PACK|ROLL A STRANGER/i;
  const titles = [...document.querySelectorAll('.overlay h2, #mapTitle, #titleMenu button')].map(h => h.textContent.trim());
  const buttons = [...document.querySelectorAll('button')].map(bn => bn.textContent.trim()).filter(Boolean);
  const badT = titles.filter(t => cryptic.test(t)), badB = buttons.filter(t => cryptic.test(t));
  const papers = PAPERS.map(p => p.name).join('|');
  const keys = ['map', 'cargo', 'skills', 'manual', 'muster', 'build'].map(k => KEYS.ACTIONS[k].name).join('|');
  const rail = ['railLedgersBtn', 'railRepublicBtn', 'railMusterBtn', 'railManualBtn'].map(id => document.getElementById(id).textContent.trim()).join('|');
  const heads = ['Map', 'Cargo Rules', 'Factions', 'Crew', 'Manual', 'Delivery complete'].every(t => titles.includes(t));
  const menu = ['New character', 'Manual', 'Reset world'].every(t => [...document.querySelectorAll('#titleMenu button')].some(bn => bn.textContent.trim() === t));
  return { tabs, accept, badT, badB: badB.slice(0, 6), papers, keys, rail, heads, menu };
});
ok('THE WINDOWS SAY WHAT THEY ARE: the terminal\'s tabs are Orders · Mail · Fabricate · Hire · Donate · Storage · Records; every card\'s button is Accept; no window title, tab or button anywhere is a made-up name (no muster roll, ledger, carry it, waybill, banner sheet, field manual, survey, dossier, manifest); the index of windows, the keys and the map\'s rail name them plainly (Map, Cargo Rules, Factions, Crew, Manual — v3.51: and the windows the bus map added to the index, each by the name on its title bar; v3.52: and the Paused sheet); the title menu says New character, Manual, Reset world',
  r.tabs === 'Orders|Mail|Fabricate|Hire|Donate|Storage|Records' && r.accept && !r.badT.length && !r.badB.length && r.papers === 'MAP|REGION MAP|WORLD MAP|CARGO & EQUIPMENT|SKILLS|CARGO RULES|FACTIONS|CREW|STATION TERMINAL|DELIVERY COMPLETE|TRANSFER CARGO|RUIN|TRADER|APPEARANCE|BUILD MENU|FARKEEP\'S DESK|A CAMP\'S ROLL|MEMORIAL|DEATH CERTIFICATE|MANUAL|PAUSED' && r.keys === 'Map|Cargo & equipment|Skills|Manual|Crew|Build menu' && r.rail === 'CARGO RULES|FACTIONS|CREW|MANUAL' && r.heads && r.menu, JSON.stringify(r));
/* the storage tab: icons, groups in colour, mission items first and out of the bulk moves, the filter, the load */
r = await ev(() => {
  const st = S.stations.haven; WL.tp('haven');
  S.cargo = S.cargo.filter(c => c.cat === 'tool'); st.storage.length = 0;
  const mi = State.makeItem('meds', 'o_store'); mi.name = 'Medicine (for Elm Farm)';
  S.cargo.push(mi, State.makeItem('metal'), State.makeItem('ration'));
  const mi2 = State.makeItem('parts', 'o_store2'); mi2.name = 'Machine parts (for The Mill)';
  st.storage.push(State.makeItem('wood'), State.makeItem('parts'), State.makeItem('bigCrate'), mi2);
  UI.openStation('haven'); UI.gotoTab('storage');
  const body = document.getElementById('stationBody');
  const chips = [...body.querySelectorAll('.stChip')].map(x => x.textContent.replace(/\s+/g, ' ').trim());
  const heads = [...body.querySelectorAll('.stCol .stHead b')].map(x => x.textContent);
  const rows = [...body.querySelectorAll('.stRow')];
  const icons = rows.length === S.cargo.length + st.storage.length && rows.every(rw => { const im = rw.querySelector('img.stIcon'); return !!im && /^data:image\/png/.test(im.getAttribute('src')); });
  const cols = body.querySelectorAll('.stCol'), firstG = cols[0].querySelector('.stGroup'), firstG2 = cols[1].querySelector('.stGroup');
  const missionFirst = !!firstG && firstG.classList.contains('mission') && !!firstG2 && firstG2.classList.contains('mission') && cols[0].querySelector('.stRow .stName').classList.contains('missionTx');
  const icon = n2 => { const rw = rows.find(x => x.querySelector('.stName').textContent === n2); return rw && rw.querySelector('img').getAttribute('src'); };
  const goldIcon = icon('Machine parts (for The Mill)') !== icon('Machine parts');   // a mission item's icon reads gold
  const colOf = cls => getComputedStyle(body.querySelector(`.stGroup.${cls}`)).color, colours = new Set(['mission', 'mat', 'goods'].map(colOf)).size === 3;
  const conds = rows.filter(rw => rw.querySelector('.stCond')).length > 0 && !rows.find(x => x.querySelector('.stName').textContent === 'Scrap metal').querySelector('.stCond');
  const over = (() => { const rw = rows.find(x => x.querySelector('.stName').textContent === 'Bulk crate'); const bn = rw && rw.querySelector('[data-take]'); return !!bn && (State.weight() + 34 > State.cap() ? bn.disabled : !bn.disabled); })();
  const tools = S.cargo.filter(c => c.cat === 'tool').length, want = ['All ' + (7 + tools), 'Mission 2', 'Materials 2', 'Goods 2', ...(tools ? ['Tools ' + tools] : []), 'Food & use 1'].join('|');
  return { chips, want, heads, icons, missionFirst, goldIcon, colours, conds, over };
});
const sto1 = JSON.stringify(r), stoOk1 = r.chips.join('|') === r.want && r.heads.join('|') === 'On your back|Lockers here' && r.icons && r.missionFirst && r.goldIcon && r.colours && r.conds && r.over;
await page.click('#stationBody .stChip.mat'); await page.waitForTimeout(150);
const filt = await ev(() => { const body = document.getElementById('stationBody'); const names = [...body.querySelectorAll('.stRow .stName')].map(x => x.textContent).sort().join('|'); return { names, on: body.querySelector('.stChip.mat').classList.contains('on') }; });
await page.click('#stationBody .stChip.all'); await page.waitForTimeout(150);
await page.click('#stationBody [data-stbulk="store"]'); await page.waitForTimeout(150);
const stored = await ev(() => ({ back: S.cargo.filter(c => c.cat !== 'tool').map(c => c.name).join('|'), lockers: S.stations.haven.storage.length }));
await page.click('#stationBody [data-stbulk="take"]'); await page.waitForTimeout(150);
const taken = await ev(() => ({ w: State.weight(), cap: State.cap(), mission: S.cargo.some(c => c.orderId === 'o_store2'), left: S.stations.haven.storage.map(c => c.name) }));
await ev(() => { S.cargo = S.cargo.filter(c => c.cat === 'tool'); S.stations.haven.storage.length = 0; document.getElementById('stationClose').click(); });
ok('THE STORAGE TAB: one filter row counting both sides by kind (All, Mission, Materials, Goods, Food & use …); two columns — on your back, the lockers here — every item with its icon, grouped under coloured heads, the mission group first in each column and its names in gold, a mission item\'s icon gold where the same crate\'s is not; a condition bar where condition matters; a crate over your load cannot be taken; a real click on a chip filters both columns to that kind; Store all leaves the mission crate (and the tools) on your back; Take all takes the mission crate first and stops at your load',
  stoOk1 && filt.names === 'Cut timber|Scrap metal' && filt.on && stored.back === 'Medicine (for Elm Farm)' && stored.lockers === 6 && taken.mission && taken.w <= taken.cap, sto1 + ' ' + JSON.stringify({ filt, stored, taken }));
/* the words on the ground read on any ground: every lit texel of a label wears a dark outline, above it as well as below */
await drain(); await at(0.3);
const outline = await ev(async () => {
  const d = DATA.stations.haven; WL.tp([d.x + 60, d.y + 90]); Render.clearFx(); Render.setZoom(2.4); Render.cam.x = d.x; Render.cam.y = d.y; WL.timeScale = 0.001;
  await __wait(400); await __frames(3);
  const cv = document.getElementById('game'), g = cv.getContext('2d'), bx = Render.labelBoxes().filter(x => String(x.str).length >= 4 && x.y0 > 20);
  let dark = 0, lit = 0, n = 0;
  for (const x of bx.slice(0, 4)) {
    const t = (x.y1 - x.y0) / 6, w = Math.round(x.x1 - x.x0 - 2 * t), x0 = Math.round(x.x0 + t);
    const above = g.getImageData(x0, Math.round(x.y0 - t / 2), w, 1).data, row = g.getImageData(x0, Math.round(x.y0 + t / 2), w, 1).data;
    for (let i = 0; i < above.length; i += 4) { if (row[i] > 150 || row[i + 1] > 150 || row[i + 2] > 150) { lit++; if (above[i] < 40 && above[i + 1] < 40 && above[i + 2] < 44) dark++; } }
    n++;
  }
  WL.timeScale = 1; Render.setZoom(null);
  return { labels: n, lit, dark };
});
ok('THE WORDS ON THE GROUND: over every lit texel on a label\'s top row the texel above it is dark — the outline runs round the letters, not only under them, so the words read on the golden shore and on snow (pixel-sampled on the labels drawn at a door)',
  outline.labels > 0 && outline.lit > 10 && outline.dark >= outline.lit * 0.9, JSON.stringify(outline));

/* ================= 9 · THE WEB CLOSES ================= */
r = await ev(() => {
  const DL = DATA.T.dayLen, ash = DATA.camps.find(c => c.id === 'ash'), wd = S.camps.ash.wired;
  const none = Republic.raiderCamps().length === 0;   // Ash on the wire, Pass given, Ridge's stone set beside yours
  const mr = Math.random; Math.random = () => 0;
  S.weather = { state: 'grey', t: 9999, intensity: 0.8 }; S.time = Math.floor(S.time / DL) * DL + DL * 0.8; wd.spliced = S.time - DL * 9; wd.stormNight = null; Republic.tick(0.02);
  Math.random = mr; S.weather = { state: 'clear', t: 9999, intensity: 0 };
  const safe = !wd.cutting && !wd.cut;
  const rolls = DATA.camps.every(cd => !/<b>raiders<\/b>/.test(UI.campRollHTML(cd, true)));
  return { none, safe, rolls };
});
ok('THE WEB CLOSES: with every camp on the wire, given, or set its stone beside yours, no camp is left up to raid — a storm night past every grace, every roll a raider\'s, and the wire stands; no roll says raiders',
  r.none && r.safe && r.rolls, JSON.stringify(r));

/* ================= 10 · THE SAVE ================= */
r = await ev(() => {
  const ch = __ch;
  State.save(); const ok0 = State.load();
  const chain = ok0 && S.stations[ch.C].ahead && S.stations[ch.C].ahead.chain === 3 && S.stations[ch.B].ahead.chain === 2 && !!Economy.book(ch.C).passed && !!Economy.book(ch.C).passedSpent && !!Economy.book(ch.B).wroteAhead;
  const wire = !!S.camps.ash.wired && typeof S.camps.ash.wired.spliced === 'number' && !S.camps.ash.wired.cut;
  const given = !!S.camps.pass.given && S.camps.pass.lines === 2 && S.structures.filter(x => x.given === 'pass').length === 2 && !!Republic.restFire(DATA.camps.find(c => c.id === 'pass').x, DATA.camps.find(c => c.id === 'pass').y);
  const kstone = !!S.camps.ridge.stoneGiven && Republic.settleStones().some(x => x.camp === 'ridge' && x.kstone && x.kstone.set);
  const stays = S.npcs.some(n => n.stays && n.stays.for === 'Halvard Penrose' && n.kinLegs === 3 && n.feeWaived);
  const raiders = Republic.raiderCamps().length === 0;
  /* a cut door stays dark across a save */
  const ash = DATA.camps.find(c => c.id === 'ash'); S.camps.ash.wired.cut = { t: S.time, by: 'ridge' }; S.stations.ashfire.cut = S.time; State.refreshSources();
  State.save(); State.load();
  const cutKept = Republic.cutAt(ash) && S.stations.ashfire.cut > 0 && Economy.ordersFor('ashfire').length === 0 && World.lightAt(__dark.x, __dark.y) === 0;
  S.camps.ash.wired.cut = null; S.stations.ashfire.cut = 0; State.refreshSources();
  return { chain, wire, given, kstone, stays, raiders, cutKept };
});
ok('THE SAVE: the chain of letters (who wrote, the third\'s errand spent), the wire spliced, the ring given (its count, the shelter and the box, the fire), the knives\' stone, the hand who stayed — all survive a save and load; a cut door stays dark across one',
  r.chain && r.wire && r.given && r.kstone && r.stays && r.raiders && r.cutKept, JSON.stringify(r));
ok('no page errors across the word passed on', errors.length === 0, errors.slice(0, 3).join(' | '));
/* the wheel's level, remembered: a fresh page opens at it */
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
const zBoot = await ev(() => Render.zoomStepOf());
ok('the wheel\'s level is remembered: a fresh page opens at the level you left', zBoot === 1, 'step=' + zBoot);

console.log(results.join('\n'));
console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks passed`);
await b.close();
