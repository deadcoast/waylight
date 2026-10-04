/* ahead.mjs — v3.48 THE WORD GONE AHEAD: the word gone ahead (a door that answered you, its errand kept, writes ahead down
   the wire to the nearest town you have never reached — warmer, on every board, greeted by the letter, the first delivery
   paying its worth); the camp on the wire (a road kept three times, the chief asks; the relay kit from any lit board raised
   at his fire makes the camp a lit door — the chief keeps it, its board, its light, its ring open for good); the watch's
   siege (three nights watched running, the chief walks out to the line under a white rag — a truce, no fight); the stones
   set again (a kicked cairn's score paid and walked: a second red thread, and the knives leave it); the kin's day (every
   seventh day at dusk the kin at a keepsake's stone — the town sends a hand for your next leg, home at the next lit door);
   the save. */
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
  window.__bright = (wx, wy, rad) => { const d = __grab(wx, wy, rad); let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 225 && d[i + 1] > 190 && d[i + 2] > 110) n++; return n; };
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  for (const id of ['elm', 'mill', 'green', 'quarry', 'relay']) S.stations[id].connected = true;
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;   // the Walker's weather lines are spent
  for (let i = 0; i < 6; i++) S.npcs.push(NPC.gen({ at: 'haven' }));
});
const drain = async () => { for (let i = 0; i < 150; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };
const unscene = async () => { await ev(() => { S.mcine = null; S.handoff = null; S.cineSeq = false; UI.setLetterbox(false); }); await page.waitForTimeout(900); };
const skipCine = async () => { for (let i = 0; i < 30; i++) { const c = await ev(() => !!S.cine); if (!c) break; await ev(() => WL.skipCine()); await page.waitForTimeout(250); } };
const at = f => ev(f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; }, f);
const unfreeze = () => ev(() => { WL.timeScale = 1; Render.setZoom(null); });

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const inPal = (rows, pal, w, h) => rows.length === h && rows.every(rw => rw.length === w) && [...new Set(rows.join('').replace(/\./g, ''))].every(ch => pal[ch]);
  const NEW = ['ahead', 'asks', 'wired', 'tired', 'talk', 'twice', 'kinday', 'sent'];
  const marks = NEW.every(k => inPal(SPRITES.MARKS[k], SPRITES.MARK_PAL, 7, 7)) && new Set(Object.values(SPRITES.MARKS).map(m => m.join(''))).size === Object.keys(SPRITES.MARKS).length;
  const letter = inPal(SPRITES.WORDNOTE.ahead, SPRITES.WORD_PAL, 7, 5) && SPRITES.WORDNOTE.ahead.join('').includes('A') && new Set(Object.values(SPRITES.WORDNOTE).map(m => m.join(''))).size === Object.keys(SPRITES.WORDNOTE).length;   // v3.49 adds the letter passed on's two and three pips
  const mast = inPal(SPRITES.RELAY_MAST.lit, SPRITES.RELAY_PAL, 9, 24) && inPal(SPRITES.RELAY_MAST.dark, SPRITES.RELAY_PAL, 9, 24) && SPRITES.RELAY_MAST.lit.join('').includes('F') && !SPRITES.RELAY_MAST.dark.join('').includes('F') && SPRITES.RELAY_MAST.lit.join('').includes('R');
  const board = inPal(SPRITES.CAMP_BOARD, SPRITES.RELAY_PAL, 12, 10);
  const kg = Render.cargoGlyph({ defId: 'relayKit', kg: 16, cat: 'gift' }), kgAll = kg ? kg.rows.join('') : '';   // the kit rides the pack's tower as its own glyph
  const kit = !!kg && kg.rows.length === 6 && kg.rows.every(r2 => r2.length === 8) && kgAll.replace(/\./g, '').split('').every(ch => kg.pal[ch]) && kgAll.includes('F') && kgAll.includes('Y') && kgAll !== Render.cargoGlyph({ defId: 'fireGift', kg: 6, cat: 'gift' }).rows.join('');
  const stick = inPal(SPRITES.RAG_STICK, SPRITES.TRUCE_KEPT_PAL, 5, 16);
  const twice = inPal(SPRITES.SETTLESTONE_TWICE, SPRITES.SETTLE_PAL, 8, 9) && (SPRITES.SETTLESTONE_TWICE.join('').match(/R/g) || []).length > (SPRITES.SETTLESTONE.join('').match(/R/g) || []).length;
  const candles = SPRITES.KIN_CANDLES.length === 2 && SPRITES.KIN_CANDLES.every(f => inPal(f, SPRITES.KINDAY_PAL, 3, 5)) && SPRITES.KIN_CANDLES[0].join('') !== SPRITES.KIN_CANDLES[1].join('');
  const CO = SPRITES.COURIER, onGrid = cells => cells.every(([c, r2]) => c >= 0 && c < 32 && r2 >= 0 && r2 < 32);   // v3.50: on the courier's own grid, every facing and frame
  const ribbon = ['S', 'E', 'N'].every(fc => Object.values(CO.sash[fc]).every(cells => onGrid(cells) && cells.every(([, , ch]) => SPRITES.HELPER_PAL[ch]))) && CO.sash.S.idle.length >= 8 && CO.sash.E.idle.length >= 2;
  const g = Render.cargoGlyph({ defId: 'relayKit', cat: 'gift' }), glyph = inPal(g.rows, g.pal, 8, 6);
  const T2 = DATA.T, rows = T2.ahead.appr > 0 && T2.ahead.firstLikes > 0 && T2.post.asks === 3 && T2.post.kg > 0 && T2.post.baseR > 0 && T2.post.at.length === 2 && T2.siege.nights === 3 && T2.siege.truceDays > 0 && T2.kinDay.every === 7 && T2.kinDay.from < T2.kinDay.to && T2.kinDay.leg > 0;
  const voices = DATA.stationOrder.every(id => DATA.keeperGrief[id].ahead && /\{who\}/.test(DATA.keeperGrief[id].ahead) && /\{town\}/.test(DATA.keeperGrief[id].ahead));
  const gk = Object.keys(DATA.keeperGrief.haven).sort().join(',');
  const posts = ['pass', 'ash'].every(k => { const P = DATA.campPosts[k]; return P && P.id && Object.keys(P.grief).sort().join(',') === gk && ['hello', 'critical', 'wanting', 'steady', 'thriving', 'relit'].every(v => P.voice[v]) && P.stars.length === 6 && P.needs.length && P.makes.length && P.chiefs.chief && P.chiefs.chief2; }) && !DATA.campPosts.ridge;
  const lines = DATA.postLines.ask.length >= 2 && DATA.postLines.wired.length >= 2 && DATA.siegeLines.chief.length >= 2 && DATA.siegeLines.line.length >= 2 && DATA.twiceLines.set.length >= 2 && DATA.twiceLines.left.length >= 2 && ['kin', 'join', 'leave'].every(k => DATA.kinDayLines[k].length >= 2);
  const item = !!DATA.items.relayKit && DATA.items.relayKit.cat === 'gift' && Ledger.classify('relayKit') === 'gifts' && Ledger.coverage().length === 0;
  const lessons = ['firstAhead', 'firstCampAsks', 'firstOnWire', 'firstSiege', 'firstTwice', 'firstKinDay'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]), lessonsN = Object.keys(DATA.tutorials).length;
  const causes = Object.keys(MUSTER.MOOD.causes).length;
  return { marks, letter, mast, board, kit, stick, twice, candles, ribbon, glyph, rows, voices, posts, lines, item, lessons, lessonsN, causes };
});
ok('THE REGISTRIES: eight new marks (the word gone ahead, the camp asks, on the wire, the camp tired, the talk at the line, set twice, the kin\'s day, the town\'s hand) 7×7 in the marks\' palette and every mark distinct; the letter gone ahead in the waylight\'s teal; the relay mast lit and dark (its lamp, the camp\'s red rag); the knives\' board; the relay kit as its own glyph on the pack\'s tower; the white rag on its stick; the cairn set twice (a second red thread); the kin\'s day candles in two frames; the town\'s ribbon on the rig; the rows; eight keepers\' lines for a letter that came first; the two camps that keep a chief, their doors\' rows whole (a chief\'s voice, every word a keeper has, five stars) and none for a chiefless camp; the voices; the kit filed as a gift; six lessons (the manual at 93 pages with v3.49\'s); no new mood cause (31 with v3.49\'s two)',
  r.marks && r.letter && r.mast && r.board && r.kit && r.stick && r.twice && r.candles && r.ribbon && r.glyph && r.rows && r.voices && r.posts && r.lines && r.item && r.lessons && r.lessonsN >= 93 && r.causes === 31, JSON.stringify(r));

/* ================= 2 · THE WORD GONE AHEAD ================= */
r = await ev(() => {
  const A = DATA.T.word.answer, AH = DATA.T.ahead;
  S.wireWords = [];
  for (const id of ['foundry', 'pharos']) { S.stations[id].connected = false; S.stations[id].met = false; S.stations[id].ahead = null; }
  const offBoard = []; for (const id of DATA.stationOrder) { if (id === 'foundry') continue; for (const o of (Economy.ordersFor(id) || [])) if (o.to === 'foundry') offBoard.push(id + ':' + o.id); }   // its own board's salvage runs out and back — not another door's
  const unreachedBoards = offBoard.length === 0; window.__offBoard = offBoard;
  const land = (to, kind, n) => { for (let i = 0; i < n; i++) S.wireWords.push({ id: 'aw' + to + kind + i, from: 'haven', to, kind, name: 'a test word', t0: S.time - 1, eta: S.time - 0.01 }); Economy.update(0.01); };
  land('quarry', 'kept', A.kept);
  const o = (Economy.ordersFor('quarry') || []).find(x => x.errand === 'quarry' && x.answered);
  if (!o) return { errand: false };
  S.stations.quarry.met = true; WL.tp('quarry'); Systems.acceptOrder(o, false);
  const act = S.orders.active.find(x => x.errand === 'quarry'); WL.tp(act.to); WL.instantPar(); Systems.handleDelivery(act.to);
  const w = S.wireWords.find(x => x.kind === 'ahead');
  const wrote = !!w && w.from === 'quarry' && (w.to === 'foundry' || w.to === 'pharos') && !!Economy.book('quarry').wroteAhead && S.mails.some(m => /a letter ahead/.test(m.subj));
  window.__ah = w ? { to: w.to, id: w.id } : null;
  if (w) w.eta = S.time + 1e6;   // held on the wire while the frames look at it; landed by hand below
  return { errand: true, unreachedBoards, offBoard: offBoard.slice(0, 4), wrote, to: w ? w.to : null, near: w ? DATA.stationOrder.filter(id => !S.stations[id].met && !S.stations[id].connected).sort((a, b2) => U.dist(DATA.stations.quarry.x, DATA.stations.quarry.y, DATA.stations[a].x, DATA.stations[a].y) - U.dist(DATA.stations.quarry.x, DATA.stations.quarry.y, DATA.stations[b2].x, DATA.stations[b2].y))[0] === w.to : false };
});
const ah1 = JSON.stringify(r), ahOk1 = r.errand && r.unreachedBoards && r.wrote && r.near;
/* the letter on the world, in the waylight's teal: sampled at its point on the wire */
await drain(); await at(0.3);
const ahSeen = await ev(async () => {
  const w = S.wireWords.find(x => x.kind === 'ahead'); if (!w) return 0;
  w.t0 = S.time - 3; const p = Economy.wireWordAt(w);
  WL.tp([p.x + 90, p.y + 70]); Render.clearFx(); Render.setZoom(3); Render.cam.x = p.x; Render.cam.y = p.y - 16; __clearAmb(Render.cam.x, Render.cam.y, 260); WL.timeScale = 0.001;
  await new Promise(res => setTimeout(res, 420));
  const n = __near(p.x, p.y - 17, __hex('#57c8b4'), 26, 16);
  WL.timeScale = 1; Render.setZoom(null);
  return n;
});
r = await ev(() => {
  const AH = DATA.T.ahead, w = S.wireWords.find(x => x.kind === 'ahead'), to = w.to, st = S.stations[to], appr0 = st.appr || 0, likes0 = st.likesTo;
  w.eta = S.time - 0.01; Economy.update(0.01);
  const landed = !!st.ahead && st.ahead.from === 'quarry' && st.ahead.who === DATA.keepers.quarry.name && Math.round(st.appr - appr0) === AH.appr && st.likesTo === Math.min(100, likes0 + AH.likes) && !!S.flags.tut.firstAhead && Economy.book(to).log[0].kind === 'ahead';
  const onBoards = DATA.stationOrder.some(id => id !== to && (Economy.ordersFor(id) || []).some(o => o.to === to));
  /* the first time the board opens, the keeper greets you by the letter; the plate says who wrote */
  WL.tp(to); UI.openStation(to);
  const greet = document.getElementById('keeperLine').textContent.includes(DATA.keeperGrief[to].ahead.replace(/\{who\}/g, DATA.keepers.quarry.name).replace(/\{town\}/g, 'Quarry').slice(0, 26));
  const chip = /WRITTEN AHEAD — Sela Marsh, Quarry/.test(document.getElementById('bookLine').textContent);
  document.getElementById('stationClose').click();
  return { to, landed, onBoards, greet, chip };
});
const ah2 = JSON.stringify(r), ahOk2 = r.landed && r.onBoards && r.greet && r.chip;
/* the first delivery through its door pays the letter's worth; the second does not */
r = await ev(() => {
  const to = __ah.to, AH = DATA.T.ahead;
  const pick = () => { for (const id of DATA.stationOrder) { if (!S.stations[id].connected || id === to) continue; const o = (Economy.ordersFor(id) || []).find(x => x.to === to && !x.errand && !x.circuit && !x.convoy && !x.salvage); if (o) { WL.tp(id); return o; } } return null; };
  let o = pick(); if (!o) return { order: false };
  Systems.acceptOrder(o, false); WL.tp(to); WL.instantPar();
  const l0 = S.likes, res = Systems.handleDelivery(to), g = res.results.find(x => x.ahead);
  const paid = !!g && g.ahead.likes === AH.firstLikes && !!S.stations[to].ahead.paid;
  UI.queueResults(res.results, null); const slip = /WRITTEN AHEAD/.test(document.getElementById('scoreRows').textContent); document.getElementById('results').classList.add('hidden');
  o = pick(); let once = true;
  if (o) { Systems.acceptOrder(o, false); WL.tp(to); WL.instantPar(); const res2 = Systems.handleDelivery(to); once = !res2.results.some(x => x.ahead); }
  UI.openStation(to); const chipGone = !/WRITTEN AHEAD/.test(document.getElementById('bookLine').textContent); UI.gotoTab('ledger'); const ledger = /A LETTER AHEAD/.test(document.getElementById('stationBody').textContent); document.getElementById('stationClose').click();
  WL.tp('quarry'); UI.openStation('quarry'); UI.gotoTab('ledger'); const ledger2 = /WROTE AHEAD FOR YOU/.test(document.getElementById('stationBody').textContent); document.getElementById('stationClose').click();
  /* a door writes ahead once */
  const again = Economy.writeAhead('quarry') === null && S.wireWords.filter(x => x.kind === 'ahead').length === 0;
  return { order: true, paid, slip, once, chipGone, ledger, ledger2, again };
});
const ah3 = JSON.stringify(r), ahOk3 = r.order && r.paid && r.slip && r.once && r.chipGone && r.ledger && r.ledger2 && r.again;
ok('THE WORD GONE AHEAD: a town you never reached is on no board; a door that answered you on the wire\'s word, its errand walked through in time, writes ahead down the wire to the nearest one (the mail, the book) — the letter walks the wire in the waylight\'s teal (pixel-sampled on the world); landing, that town is warmer (appreciation and likes, the lesson, its book), it is on every board, and the first time its board opens the keeper greets you by the letter and the plate says who wrote; the first delivery through its door pays the letter\'s worth (the slip says WRITTEN AHEAD), the second does not; both books keep it; a door writes ahead once',
  ahOk1 && ahSeen > 6 && ahOk2 && ahOk3, ah1 + ' teal=' + ahSeen + ' ' + ah2 + ' ' + ah3);

/* ================= 3 · THE CAMP ASKS ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  for (const id of ['foundry', 'pharos']) { S.stations[id].connected = true; S.stations[id].met = true; }
  c.taken = null; c.pacified = false; c.truce = 0; c.runners = []; c.grudge = null; c.asks = 0;
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven'); S.cov = 0.6; NPC.assignRoute(n, 'foundry', 'pharos');
  c.pact = { t: S.time, kept: 2 }; Republic.tick(0.02);
  const before = !c.asks && !Republic.relayCamps().some(cd => cd.id === 'ash');
  const took = Republic.takeRoadGift('ash');
  WL.tp([ash.x - 30, ash.y + 60]);
  const gi = Systems.getInteractions().find(i => i.key === 'G' && /the road's gift/.test(i.label)); if (gi) gi.fn();
  const asked = !!gi && c.pact.kept === 3 && !!c.asks && S.mails.some(m => /Ash Camp asks for the wire/.test(m.subj)) && !!S.flags.tut.firstCampAsks && Republic.relayCamps().some(cd => cd.id === 'ash');
  const askOnce = Republic.campAsks(ash) === false && S.mails.filter(m => /Ash Camp asks for the wire/.test(m.subj)).length === 1;   // he asks once
  const roll = /asks for the wire/.test(UI.campRollHTML(ash, true)) && askOnce;
  WL.tp('haven'); S.stations.haven.met = true; UI.openStation('haven');
  const card = /THE RELAY KIT/.test(document.getElementById('stationBody').textContent) && !!document.querySelector('#stationBody [data-relaykit="ash"]');
  window.__bank0 = { metal: S.banked.metal, ceramic: S.banked.ceramic, lumen: S.banked.lumen };
  return { before, took, asked, roll, card };
});
const ca1 = JSON.stringify(r), caOk1 = r.before && r.took && r.asked && r.roll && r.card;
if (r.card) { await page.click('#stationBody [data-relaykit="ash"]'); await page.waitForTimeout(400); }
r = await ev(() => {
  const TP = DATA.T.post, k = Republic.kitFor('ash'), b0 = __bank0;
  const paid = !!k && k.defId === 'relayKit' && k.kg === TP.kg && S.banked.metal === b0.metal - TP.kit.metal && S.banked.ceramic === b0.ceramic - TP.kit.ceramic && S.banked.lumen === b0.lumen - TP.kit.lumen;
  const onPack = /on your pack — raise it at the fire/.test(document.getElementById('stationBody').textContent);
  document.getElementById('stationClose').click();
  const once = !Republic.takeRelayKit('ash');
  Guide.tick(0.3); const gs = Guide.current(), guide = !!gs && gs.id === 'relaykit';
  UI.tick(); const compass = [...document.querySelectorAll('#compassInner .cMark')].some(m => /the wire · Ash/.test(m.title) || (m.classList.contains('guide') && /^Raise|^Ash/.test(m.title)));
  return { paid, onPack, once, guide, compass };
});
const ca2 = JSON.stringify(r), caOk2 = r.paid && r.onPack && r.once && r.guide && r.compass;
/* the kit rides the pack: its lamp head up at the back corner (sampled against the same frame without it) */
await drain(); await at(0.3);
const kitSeen = await ev(async () => {
  const look = async () => { WL.tp([DATA.stations.haven.x + 260, DATA.stations.haven.y + 200]); S.dir = 0; Render.faceWalker('E'); Systems.update(0.02, {}); __clearAmb(S.px, S.py, 160); Render.clearFx(); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 40; WL.timeScale = 0.001; await new Promise(res => setTimeout(res, 380)); await __frames(3); const w = Render.walkerDrawn(), c = Render.walkerAt(9, (w.towerTop + 10) / 2); const d = __grab(c.x, c.y, 40); WL.timeScale = 1; return d; };
  const withKit = await look(), k = Republic.kitFor('ash'); S.cargo.splice(S.cargo.indexOf(k), 1);
  const without = await look(); S.cargo.push(k); Render.setZoom(null);
  return { withKit: __diff(withKit, without), without: 0 };
});
ok('THE CAMP ASKS: the third time the road\'s gift is walked to Ash Camp\'s fire the chief asks for the wire, once (the mail, the lesson, the roll); every lit board offers THE RELAY KIT — a real click takes it: the bank pays, the pack carries it (the kit\'s lamp head up at the pack\'s back corner, pixel-sampled against the same frame without it); taken once; the guide and the compass walk it to the fire',
  caOk1 && caOk2 && kitSeen.withKit > kitSeen.without + 4, ca1 + ' ' + ca2 + ' ' + JSON.stringify(kitSeen));

/* ================= 4 · THE CAMP ON THE WIRE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, dark = { x: ash.x - 400, y: ash.y - 300 };
  window.__dark = dark; const light0 = World.lightAt(dark.x, dark.y);
  WL.tp([ash.x - 30, ash.y + 60]);
  const it = Systems.getInteractions().find(i => i.key === 'G' && /Raise <b>the relay<\/b>/.test(i.label));
  if (!it) return { inter: false };
  it.fn();
  const scene = !!S.cine && S.cine.stId === 'ashfire';
  const row = !!DATA.stations.ashfire && DATA.stationOrder.includes('ashfire') && DATA.stations.ashfire.post === true && DATA.stations.ashfire.camp === 'ash' && DATA.keepers.ashfire.name === DATA.campPosts.ash.chiefs[c.wired.kit] && DATA.keeperGrief.ashfire === DATA.campPosts.ash.grief;
  const wired = !!c.wired && c.wired.id === 'ashfire' && c.pacified && !c.runners.length && !Republic.kitFor('ash') && S.mails.some(m => /Ash Camp is on the wire/.test(m.subj)) && !!S.flags.tut.firstOnWire;
  /* the door stands where the post's row puts it (T.post.at from the fire); the camp names its post; a relay is raised once */
  const pr = State.postRow('ash'), placed = !!pr && DATA.stations.ashfire.x === pr.x && DATA.stations.ashfire.y === pr.y && pr.x === ash.x + DATA.T.post.at[0] && State.postRow('ridge') === null;
  const named = Republic.postOf(ash) === 'ashfire' && Republic.postOf(DATA.camps.find(x => x.id === 'pass')) === null;
  const once = Republic.raiseRelay(ash) === false;
  /* the word at his fire on its last day: a camp on the wire sends no pact runner — it trades through its own door */
  const pact0 = c.pact, gr0 = S.giftRunner; c.pact = { t: S.time - (DATA.T.parley.pactDays - 1) * DATA.T.dayLen - 1, kept: 3 }; S.giftRunner = null; Republic.tick(0.02);
  const noRunner = !S.giftRunner; c.pact = pact0; S.giftRunner = gr0;
  return { inter: true, scene, row, wired, light0, placed, named, once, noRunner };
});
const ow1 = JSON.stringify(r), owOk1 = r.inter && r.scene && r.row && r.wired && r.light0 === 0 && r.placed && r.named && r.once && r.noRunner;
await skipCine();
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), st = S.stations.ashfire, d = DATA.stations.ashfire;
  const lit = st.connected && st.litT === 1 && World.lightAt(__dark.x, __dark.y) > 0;
  const boardFrom = (Economy.ordersFor('ashfire') || []).length > 0, boardTo = DATA.stationOrder.some(id => id !== 'ashfire' && (Economy.ordersFor(id) || []).some(o => o.to === 'ashfire'));
  WL.tp('ashfire'); UI.openStation('ashfire');
  const hello = document.getElementById('keeperLine').textContent.includes(DATA.campPosts.ash.voice.hello.slice(0, 30));
  const fimg = document.querySelector('#keeperLine img.keeperFace'), face = !!fimg && fimg.getAttribute('src') === Render.chiefFaceURL(S.camps.ash.wired.kit, 3);
  const name = document.getElementById('stationName').textContent === 'Ash Camp';
  document.getElementById('stationClose').click();
  const s0 = st.stock.food; for (let i = 0; i < 20; i++) Economy.update(0.5); const drains = st.stock.food !== s0 && Economy.needsOf('ashfire').length === 3 && !!Economy.stationMood('ashfire');   // it eats, and the wire feeds it
  /* a delivery through the knives' door: the knives share their salvage */
  let o = null; for (const id of DATA.stationOrder) { if (!S.stations[id].connected || id === 'ashfire' || o) continue; o = (Economy.ordersFor(id) || []).find(x => x.to === 'ashfire' && !x.errand && !x.circuit && !x.convoy && !x.salvage) || null; if (o) WL.tp(id); }
  let salvage = false;
  if (o) { Systems.acceptOrder(o, false); WL.tp('ashfire'); WL.instantPar(); const res = Systems.handleDelivery('ashfire'); salvage = res.results.some(x => x.donate && x.donate.metal >= 3); }
  /* the ring: no knife cuts a loaded Walker in it; the rags stay up for good; no gift wanted, no rag on the pack */
  WL.tp([ash.x + 220, ash.y + 120]); S.cargo.push(State.makeItem('metal')); S.bleeding = false; const hp0 = S.health;
  for (let i = 0; i < 40; i++) Systems.update(0.1, {});
  const calm = !S.camps.ash.runners.length && S.health >= hp0 - 0.01 && !S.struggle;
  const tr = Republic.truceRoadFor('foundry', 'pharos'), roads = !!tr && tr.id === 'ash' && Republic.truceRoads().some(x => x.cd.id === 'ash' && !x.watch);
  const noGift = !Republic.roadCamps().some(cd => cd.id === 'ash'), noRag = !Republic.onAnyRoad();
  const noRise = true;
  UI.toggleMap(true); UI.toggleMap(false);
  return { lit, boardFrom, boardTo, hello, face, name, drains, order: !!o, salvage, calm, roads, noGift, noRag };
});
const ow2 = JSON.stringify(r), owOk2 = r.lit && r.boardFrom && r.boardTo && r.hello && r.face && r.name && r.drains && r.order && r.salvage && r.calm && r.roads && r.noGift && r.noRag;
/* seen: the relay's lamp lit on its mast, the knives' board by the door, the knives at home by their fire */
await drain(); await at(0.3);
const owSeen = await ev(async () => {
  const ash = DATA.camps.find(c => c.id === 'ash'), d = DATA.stations.ashfire, m = { x: d.x + 42, y: d.y - 10 };
  WL.tp([d.x + 60, d.y + 90]); S.dir = Math.PI; Systems.update(0.02, {}); __clearAmb(d.x, d.y, 220); Render.clearFx(); Render.setZoom(3); Render.cam.x = d.x + 10; Render.cam.y = d.y - 20; WL.timeScale = 0.001;
  await new Promise(res => setTimeout(res, 420));
  const lamp = __bright(m.x - 1, m.y - 52, 8), board = __near(d.x, d.y - 12, __hex('#6b4a30'), 24, 12), papers = __near(d.x, d.y - 14, __hex('#e8e0c8'), 24, 12);
  Render.cam.x = ash.x; Render.cam.y = ash.y; await new Promise(res => setTimeout(res, 300));
  const knives = __near(ash.x + 24, ash.y - 40, __hex('#8a4432'), 30, 14) + __near(ash.x - 48, ash.y - 12, __hex('#8a4432'), 30, 14);
  WL.timeScale = 1; Render.setZoom(null);
  return { lamp, board, papers, knives };
});
ok('THE CAMP ON THE WIRE: G at the chief\'s fire raises the relay, once — the connection scene lights it: Ash Camp is a lit door in the registry (its own row at the post\'s place by the fire, the camp naming its post, the chief who was at the fire named its keeper, his words for every grievance), on the wire, its light where no other door\'s reached; its board posts what the knives spare and every door posts to it; the first board is the chief\'s hello with his own face; its market drains like any town\'s; a delivery through its door pays the knives\' salvage; the camp stands down for good (no runner, no pact runner on the word\'s last day, no cut on a loaded Walker in the ring), its rags stay up (the truce road open), no gift is wanted and no rag rides the pack; seen: the lamp lit on its mast, the board with its notices, the knives at home by their fire (all pixel-sampled)',
  owOk1 && owOk2 && owSeen.lamp > 3 && owSeen.board > 6 && owSeen.papers > 3 && owSeen.knives > 6, ow1 + ' ' + ow2 + ' ' + JSON.stringify(owSeen));

/* ================= 5 · THE WATCH'S SIEGE ================= */
r = await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, DL = DATA.T.dayLen;
  c.taken = null; c.pacified = false; c.truce = 0; c.pact = null; c.grudge = null; c.siegeTruce = null; c.watchRun = null; c.runners = [];
  S.cargo = S.cargo.filter(x => x.cat === 'tool');
  for (const n of S.npcs.filter(x => x.state === 'companion')) { n.state = 'pool'; n.at = 'haven'; }
  const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven').slice(0, 3); for (const n of pool) NPC.hire(n, 'companion');
  WL.tp([pass.x + 100, pass.y + 1150]); for (const n of NPC.party()) { n.cx = S.px + 20; n.cy = S.py + 20; }
  UI.toggleMap(true); UI.ringWalk('pass'); UI.toggleMap(false);
  const m = S.moveTo; WL.tp([m.x + 4, m.y + 4]); S.stagger = 0; S.struggle = null; Systems.update(0.05, {}); for (let i = 0; i < 40; i++) Systems.update(0.1, {});
  c.watchRun = { n: DATA.T.siege.nights - 1, last: Math.floor(S.time / DL) - 1 };   // two nights already, the last the night before this one
  UI.lineOrders(); const btn = /night 3 of 3/.test(document.getElementById('keeperSay').textContent);
  const made = Systems.lineOrder('watch') && Systems.watches().some(w => w.camp === 'pass');
  document.getElementById('keeperSay').classList.add('hidden');
  const roll = /2 nights running — at 3 the camp tires/.test(UI.campRollHTML(pass, true));
  return { made, btn, roll };
});
const sg1 = JSON.stringify(r), sgOk1 = r.made && r.btn && r.roll;
await at(0.72);
await ev(() => { for (let i = 0; i < 4; i++) Systems.update(0.1, {}); });
await at(1.08);
r = await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, w = Systems.watches().find(x => x.camp === 'pass');
  Systems.update(0.05, {});
  const sg = w && w.siege;
  const out = !!sg && sg.phase === 'out' && sg.chief && sg.kit === Republic.chiefKit(pass) && c.watchRun.n === DATA.T.siege.nights && !w.home;
  window.__sg = { camp: 'pass' };
  return { out, n: c.watchRun && c.watchRun.n, phase: sg && sg.phase };
});
const sg2 = JSON.stringify(r), sgOk2 = r.out;
/* seen: the chief walking out, the white rag on its stick (sampled against the same frame with the scene hidden) */
await drain();
const sgSeen = await ev(async () => {
  const w = Systems.watches().find(x => x.camp === 'pass'), sg = w.siege;
  sg.x = sg.x0 + (sg.tx - sg.x0) * 0.5; sg.y = sg.y0 + (sg.ty - sg.y0) * 0.5;
  WL.tp([sg.x + 120, sg.y + 90]); S.dir = Math.PI; __clearAmb(sg.x, sg.y, 200); Render.clearFx(); Render.setZoom(2.6); Render.cam.x = sg.x; Render.cam.y = sg.y - 20; WL.timeScale = 0.001;
  await new Promise(res => setTimeout(res, 380));
  const a = __grab(sg.x, sg.y - 30, 30), x0 = sg.x; sg.x += 6000; await new Promise(res => setTimeout(res, 250)); await __frames(3); const b2 = __grab(x0, sg.y - 30, 30); sg.x = x0;   // the scene carried off-frame, never ended
  WL.timeScale = 1; Render.setZoom(null);
  return __diff(a, b2);
});
r = await ev(() => {
  const pass = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, w = Systems.watches().find(x => x.camp === 'pass'), sg = w.siege;
  for (let i = 0; i < 800 && sg.phase === 'out'; i++) Systems.update(0.1, {});
  const talk = sg.phase === 'talk' && U.dist(sg.x, sg.y, sg.tx, sg.ty) < 4;
  for (let i = 0; i < 200 && sg.phase === 'talk'; i++) Systems.update(0.1, {});
  const truce = !!c.siegeTruce && Republic.truceAt(pass) && !c.watchRun && S.mails.some(m => /a truce at the line/.test(m.subj)) && !!S.flags.tut.firstSiege && sg.phase === 'back' && !w.home;
  const roll = /a truce at the line/.test(UI.campRollHTML(pass, true));
  const opens = !Republic.campUp || true;
  for (let i = 0; i < 800 && !sg.done; i++) Systems.update(0.1, {});
  for (let i = 0; i < 40 && !w.home; i++) Systems.update(0.1, {});
  const home = sg.done && !!w.home;
  /* a night missed starts the count again; a fire with no chief sends its eldest */
  const ridge = DATA.camps.find(x => x.id === 'ridge'), rc = S.camps.ridge, DL = DATA.T.dayLen, night = Math.floor(S.time / DL);
  rc.taken = null; rc.pacified = false; rc.truce = 0; rc.siegeTruce = null;
  rc.watchRun = { n: 2, last: night - 3 }; const w1 = { darkT: night * DL + 0.6 * DL, x: ridge.x, y: ridge.y + ridge.r - 24, fx: 0, fy: -1 }; Systems.siegeCount(w1, ridge);
  const reset = rc.watchRun.n === 1 && !w1.siege;
  rc.watchRun = { n: 2, last: night - 1 }; const w2 = { ...w1 }; Systems.siegeCount(w2, ridge);
  const eldest = !!w2.siege && !w2.siege.chief && w2.siege.kit === FACT.CAMP_CLASSES.bowman.kit;
  rc.watchRun = null;
  return { talk, truce, roll, home, reset, eldest };
});
const sg3 = JSON.stringify(r), sgOk3 = r.talk && r.truce && r.roll && r.home && r.reset && r.eldest;
ok('THE WATCH\'S SIEGE: two nights already watched running, the line\'s plate says this is the night that tires them and the roll counts the nights; the watch left by the WATCH order holds the third night — at its dawn the night is counted and the chief walks out from his fire toward the line (the line stays till it is done): the white rag on its stick (pixel-sampled against the same frame without the scene); he reaches the line and talks — a truce stands (the mail, the lesson, the roll), the count is spent; he walks back, then the watch walks home; a night missed starts the count again; a fire with no chief sends its eldest (the bowman)',
  sgOk1 && sgOk2 && sgSeen > 30 && sgOk3, sg1 + ' ' + sg2 + ' seen=' + sgSeen + ' ' + sg3);

/* ================= 6 · THE STONES SET AGAIN ================= */
r = await ev(() => { try {
  const ridge = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge;
  c.taken = null; c.pacified = false; c.truce = 0; c.pact = null; c.siegeTruce = null; c.runners = [];
  for (const w of Systems.watches().slice()) { for (const n of Systems.watchers(w)) { n.state = 'companion'; n.watchId = null; } Systems.watches().splice(0, 1); }
  for (const n of S.npcs.filter(x => x.state === 'waiting')) n.state = 'companion';
  const n = NPC.party()[0]; if (!n) return { party: false };
  const first = n.name.split(' ')[0];
  Republic.settleStones().length = 0;
  Republic.settleStones().push({ x: ridge.x + 40, y: ridge.y + ridge.r + 60, name: first, npc: n.id, camp: 'ridge', t: S.time - 400, how: 'taken', calm: true, down: S.time - 200, kick: { t: 9, x0: ridge.x, y0: ridge.y, done: S.time - 200 } });
  n.settled = [{ camp: 'ridge', t: S.time - 400, how: 'taken', kicked: S.time - 200 }];
  Republic.scores().ridge = { t: S.time - 100, npc: n.id, name: n.name, why: 'stones', paid: 'stood down', paidT: S.time };
  const d = ridge.r + 100; WL.tp([ridge.x, ridge.y + d]); n.cx = S.px + 20; n.cy = S.py + 20;
  Republic.tick(0.02);
  const started = !!S.settle && S.settle.twice === true;
  let said = false; for (let i = 0; i < 80 && S.settle; i++) { NPC.update(0.1); Republic.tick(0.1); if (S.settle && S.settle.said) said = true; }
  const st2 = Republic.settleStones().find(x => x.camp === 'ridge' && x.npc === n.id);
  const set = !!st2 && st2.twice === true && !Republic.settleStones().some(x => x.camp === 'ridge' && x.down) && S.mails.some(m => /settled twice/.test(m.subj)) && !!S.flags.tut.firstTwice && n.settled.slice(-1)[0].twice === true;
  MusterUI.open(n.id); const plate = /SETTLED AT RIDGE CAMP — TWICE/.test(document.getElementById('musterOv').textContent) && /SETTLED AT RIDGE CAMP — KICKED OVER/.test(document.getElementById('musterOv').textContent); MusterUI.close();
  const roll = /set twice/.test(UI.campRollHTML(ridge, true));
  window.__tw = { x: st2 ? st2.x : 0, y: st2 ? st2.y : 0, n: n.id };
  /* the camp is up — and the knives leave it: never kicked; a runner who comes near steps round it and says so */
  const up = !c.pacified && !c.taken && !Republic.truceAt(ridge) && !Republic.pactAt(ridge);
  for (let i = 0; i < 60; i++) Republic.tick(0.25);
  const left = !!st2 && !st2.down && !st2.kick;
  const k = { x: st2.x + 10, y: st2.y - 6, cd: 0, cls: 'knife', wa: 0, state: 'patrol' }; c.runners = [k]; WL.tp([st2.x + 200, st2.y + 140]);
  Republic.tick(0.02);
  const round = U.dist(k.x, k.y, st2.x, st2.y) >= 43.9 && !!st2.leftSaid;
  c.runners = [];
  return { party: true, started, said, set, plate, roll, up, left, round };
} catch (e) { return { err: String(e.stack).slice(0, 600) }; } });
if (r.err) console.log('SECTION6 ERR', r.err);
const tw1 = JSON.stringify(r), twOk1 = r.party && r.started && r.said && r.set && r.plate && r.roll && r.up && r.left && r.round;
await drain(); await at(0.3);
const twSeen = await ev(async () => {
  const st2 = Republic.settleStones().find(x => x.camp === 'ridge' && x.twice);
  WL.tp([st2.x + 50, st2.y + 30]); S.dir = Math.PI; for (const n of NPC.party()) { n.cx = st2.x + 110; n.cy = st2.y + 70; } __clearAmb(st2.x, st2.y, 200); S.camps.ridge.runners = []; Render.clearFx(); Render.setZoom(3); Render.cam.x = st2.x; Render.cam.y = st2.y - 8; WL.timeScale = 0.001;
  await new Promise(res => setTimeout(res, 420));
  /* sampled against the same frame with the cairn carried off (the weather's tint is in both): red where a thread is, the stones where they stand */
  const zones = [[st2.x, st2.y + 1, 7], [st2.x, st2.y - 5, 7], [st2.x, st2.y - 4, 14]], A = zones.map(z => __grab(...z));
  const x0 = st2.x; st2.x += 6000; await new Promise(res => setTimeout(res, 250)); await __frames(3); const B = zones.map(z => __grab(...z)); st2.x = x0;
  const red = (a, b2) => { let n = 0; for (let i = 0; i < Math.min(a.length, b2.length); i += 4) if (Math.abs(a[i] - b2[i]) + Math.abs(a[i + 1] - b2[i + 1]) + Math.abs(a[i + 2] - b2[i + 2]) > 60 && a[i] > a[i + 1] + 40 && a[i] > a[i + 2] + 40) n++; return n; };
  WL.timeScale = 1; Render.setZoom(null);
  return { lower: red(A[0], B[0]), upper: red(A[1], B[1]), stone: __diff(A[2], B[2]) };
});
ok('THE STONES SET AGAIN: a cairn kicked over at Ridge Camp and its score paid, walked to the ring: the one who fell steps out, says it for the second time, and sets the stones again — the kicked ones gone, the new cairn set twice (the mail, the lesson); the plate carries both — KICKED OVER, and TWICE — and the roll says so; the camp comes back up and the knives leave it: never kicked, and a runner who comes near steps round it and says so; seen: the two red threads and the stones (pixel-sampled)',
  twOk1 && twSeen.lower > 2 && twSeen.upper > 2 && twSeen.stone > 8, tw1 + ' ' + JSON.stringify(twSeen));

/* ================= 7 · THE KIN'S DAY ================= */
r = await ev(() => {
  const DL = DATA.T.dayLen, KD = DATA.T.kinDay;
  if (typeof Memorial !== 'undefined') Memorial.revealGround('town');
  S.legacy.push({ name: 'Halvard Penrose', cls: 'The town\'s own', fate: 'fell when the square rose at The Mill', likes: 0, km: '0.0', deliveries: 3, cheated: false, seed: 4242, fact: 'town', kit: 'townshield', town: 'mill', home: true, keepsake: 'whistle', keepsakeT: S.time - DL * (KD.every - 1) - 1, kinName: 'Wenna Penrose' });
  Memorial.raise('town');
  const r0 = S.legacy[S.legacy.length - 1];
  const notYet = !Republic.kinDayToday(r0);
  r0.keepsakeT -= DL;   // seven days now
  const today = Republic.kinDayToday(r0);
  S.time = Math.floor(S.time / DL) * DL + DL * 0.3; Republic.tick(0.02);
  const told = S.mails.some(m => /Wenna Penrose: Halvard's day/.test(m.subj)) && r0.kinDayTold === Math.floor(S.time / DL);
  UI.tick(); const compass = [...document.querySelectorAll('#compassInner .cMark')].some(m => /the kin's day · Halvard/.test(m.title));
  const notDusk = !Republic.kinDayNow(r0);
  window.__kd = { i: S.legacy.length - 1 };
  Memorial.open('town'); const card = [...document.querySelectorAll('#memBody .memCard')].some(e => /Halvard/.test(e.textContent) && /its day today/.test(e.textContent)); Memorial.close();
  return { notYet, today, told, compass, notDusk, card };
});
const kd1 = JSON.stringify(r), kdOk1 = r.notYet && r.today && r.told && r.compass && r.notDusk && r.card;
await at(0.56);
/* seen at dusk: the candles lit at the stone's foot and the kin by it, facing it */
const kdSeen = await ev(async () => {
  const r0 = S.legacy[__kd.i], sl = Republic.kinDaySlot(r0), ms = Memorial.site('town');
  WL.tp([sl.x + 260, sl.y + 220]); S.dir = Math.PI; __clearAmb(sl.x, sl.y, 200); Render.clearFx(); Render.setZoom(3); Render.cam.x = sl.x + 20; Render.cam.y = sl.y; WL.timeScale = 0.001;
  await new Promise(res => setTimeout(res, 420));
  const cw = 3 * 7 / 2 + 7, now = Republic.kinDayNow(r0), candles = __bright(sl.x - cw, sl.y + 14, 9) + __bright(sl.x + cw, sl.y + 14, 9), a = __grab(ms.x, sl.y + 16, 22);
  r0.keepsakeT += DATA.T.dayLen; await new Promise(res => setTimeout(res, 250)); await __frames(3); const b2 = __grab(ms.x, sl.y + 16, 22); r0.keepsakeT -= DATA.T.dayLen;   // a whole day later: six days, not its day
  WL.timeScale = 1; Render.setZoom(null);
  return { now, candles, kin: __diff(a, b2) };
});
r = await ev(() => {
  const r0 = S.legacy[__kd.i], sl = Republic.kinDaySlot(r0), KD = DATA.T.kinDay, mill = S.stations.mill;
  while (NPC.hired().length < NPC.partyCap()) { const p2 = S.npcs.find(n => n.state === 'pool'); if (!p2) break; NPC.hire(p2, 'companion'); }
  const full = NPC.hired().length === NPC.partyCap(), likes0 = mill.likesTo;
  WL.tp([sl.x + 20, sl.y + 60]); Republic.tick(0.02);
  const n = S.npcs.find(x => x.lent);
  const heard = r0.kinDayHeard === Math.floor(S.time / DATA.T.dayLen) && mill.likesTo === Math.min(100, likes0 + KD.likes);
  const sent = !!n && n.state === 'companion' && n.lent.town === 'mill' && n.feeWaived && NPC.party().length === NPC.partyCap() + 1 && S.mails.some(m => /The Mill sends a hand/.test(m.subj)) && !!S.flags.tut.firstKinDay;
  const roll = NPC.everyone().some(e => e.n === n && /sent by The Mill/.test(e.place));
  const noHire = (() => { const p2 = S.npcs.find(x => x.state === 'pool'); return !p2 || !NPC.hire(p2, 'companion'); })();
  Republic.tick(0.02); const once = S.npcs.filter(x => x.lent).length === 1 && Republic.sendHelper(r0, sl) === null && S.npcs.filter(x => x.lent).length === 1;   // one hand on the road at a time
  window.__kd.n = n ? n.id : null;
  return { full, heard, sent, roll, noHire, once };
});
const kd2 = JSON.stringify(r), kdOk2 = r.full && r.heard && r.sent && r.roll && r.noHire && r.once;
/* the ribbon on the lent hand's chest (sampled against the same frame with the loan lifted) */
const ribbon = await ev(async () => {
  const n = S.npcs.find(x => x.id === __kd.n); if (!n) return 0;
  WL.tp([n.cx + 90, n.cy + 70]); n.cx = S.px - 90; n.cy = S.py - 70; n._dir = Math.PI / 2; n._px = n.cx; n._py = n.cy; const fx = n.cx, fy = n.cy;   // v3.50: toward the eye, the ribbon shoulder to hip
  __clearAmb(fx, fy, 160); Render.clearFx(); Render.setZoom(3); Render.cam.x = fx; Render.cam.y = fy - 22; WL.timeScale = 0.001;
  await new Promise(res => setTimeout(res, 380));
  const a = __grab(n.cx, n.cy - 22, 30); const L = n.lent; n.lent = null; await new Promise(res => setTimeout(res, 250)); await __frames(3); const b2 = __grab(n.cx, n.cy - 22, 30); n.lent = L;
  WL.timeScale = 1; Render.setZoom(null);
  return __diff(a, b2);
});
r = await ev(() => {
  const n = S.npcs.find(x => x.id === __kd.n), KD = DATA.T.kinDay;
  n.carry = [State.makeItem('metal')];
  WL.tp('haven'); Republic.tick(0.02);
  const early = n.state === 'companion';   // not before the leg is walked
  n.lent.t -= KD.leg + 1; Republic.tick(0.02);
  const turned = n.state === 'lentHome' && !!n.walkHome && !n.carry.length && S.stations.haven.storage.some(c => c.defId === 'metal');
  const roll = NPC.everyone().some(e => e.n === n && /walking home to The Mill/.test(e.place));
  for (let i = 0; i < 4000 && n.state === 'lentHome'; i++) Republic.tick(0.25);
  const home = n.state === 'pool' && n.at === 'mill' && !n.lent && !n.feeWaived;
  return { early, turned, roll, home };
});
ok('THE KIN\'S DAY: a keepsake set on a stone six days ago has no day; at seven it is the kin\'s day — the mail that morning, the compass marks the stone, the memorial card says it is its day; not before dusk; at dusk the candles burn at the stone\'s foot and the kin stands by it (pixel-sampled against the same frame on a day that is not its day); the Walker come by hears the kin, the town is warmer, and — the wedge full — the Mill sends a hand anyway (lent, no fee, past the full wedge, on the roll as sent by the Mill; the mail, the lesson); a hire is still refused at a full wedge; one hand at a time; the town\'s ribbon on the hand\'s chest (pixel-sampled against the same frame with the loan lifted); not at a door before the leg is walked — then at the next lit door the hand racks what they carried and turns back, walking home to the Mill\'s own hire board',
  kdOk1 && kdSeen.now && kdSeen.candles > 3 && kdSeen.kin > 30 && kdOk2 && ribbon > 4 && r.early && r.turned && r.roll && r.home, kd1 + ' ' + JSON.stringify(kdSeen) + ' ' + kd2 + ' ribbon=' + ribbon + ' ' + JSON.stringify(r));

/* ================= 8 · THE SAVE ================= */
r = await ev(() => {
  const kitNow = S.camps.ash.wired && S.camps.ash.wired.kit;
  State.save();
  const ok0 = State.load();
  const post = ok0 && DATA.stationOrder.includes('ashfire') && !!DATA.stations.ashfire && S.stations.ashfire.connected && !!S.camps.ash.wired && S.camps.ash.wired.kit === kitNow && DATA.keepers.ashfire.name === DATA.campPosts.ash.chiefs[kitNow];
  const ahead = !!S.stations.foundry.ahead && !!S.stations.foundry.ahead.paid;
  const siege = !!S.camps.pass.siegeTruce && Republic.truceAt(DATA.camps.find(c => c.id === 'pass'));
  const twice = Republic.settleStones().some(x => x.camp === 'ridge' && x.twice);
  const kin = S.legacy.some(x => x.kinName === 'Wenna Penrose' && x.kinDayHeard !== undefined);
  S.camps.pass.watchRun = { n: 2, last: 7 }; State.save(); State.load(); const run = !!S.camps.pass.watchRun && S.camps.pass.watchRun.n === 2;
  UI.toggleMap(true); UI.toggleMap(false);
  State.newGame();
  const fresh = !DATA.stationOrder.includes('ashfire') && !DATA.stations.ashfire && !DATA.keepers.ashfire && DATA.stationOrder.length === 8 && !S.stations.ashfire;
  State.load();
  const back = DATA.stationOrder.includes('ashfire');
  return { post, ahead, siege, twice, kin, run, fresh, back };
});
ok('THE SAVE: a camp on the wire (its door, its keeper, its light), a letter that got there first and was paid, a truce at the line, the nights running, a cairn set twice and a stone\'s kin\'s day survive a save and load; a new valley has no camp on the wire, and loading the old one puts it back',
  r.post && r.ahead && r.siege && r.twice && r.kin && r.run && r.fresh && r.back, JSON.stringify(r));
ok('no page errors across the word gone ahead', errors.length === 0, errors.slice(0, 3).join(' | '));

console.log(results.join('\n'));
console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks passed`);
await b.close();

