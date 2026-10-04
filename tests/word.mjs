/* word.mjs — v3.44 THE WORD AT THE DOOR (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). What it proves: the Walker has a face on the keepers' alphabet, bound to
   the coat they cut; a keeper's grievance is answered — a PROMISE (the plate, the rail, the sworn string on the parcel
   wherever it lies, the guide walking your word first, the town waiting, kept over the making-right, a like warmer, the
   keeper's kept line) or BROKEN (remembered at six likes, your word read back to you, YOUR WORD, BROKEN), or an APOLOGY from
   the board (five appreciation now, the likes kept when its days run); the kin keep the place of the town's own who fell (a
   day in the square, the lanterns in the night, the slower clock, the stones in the mood, the sheet); the new chief's
   grudge (your hand, the new man, his first storm your nearest post the next night, the say, the sheet, paid or cooled);
   the scar carried to the stone (the record, the manual's plates, the card, the notches); the road to the ring from the
   pinned roll; the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const drain = async () => { await ev(() => { WL.timeScale = 1; }); await T.drain(); await ev(() => { WL.timeScale = 0.001; }); };
await ev(() => {
  for (const id of DATA.stationOrder) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources();
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  window.__says = []; const sy = Render.say; Render.say = (x, y, str, col, who) => { __says.push({ str: String(str), col }); return sy(x, y, str, col, who); };
  window.__titles = []; const ct = Render.crtTitle; Render.crtTitle = (a, b) => { __titles.push(a + ' — ' + b); return ct(a, b); };
  window.__die = (v, fn) => { const r0 = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = r0; } };
  window.__at = f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; };
  /* a parcel of the town's own, knocked off the pack by a knife on the road (the grievance's own door) */
  window.__knock = to => {
    S.stations.haven.parcels = [{ to, kind: 'coat', name: 'a mended coat' }];
    S.orders.active = S.orders.active.filter(o => o.item !== 'parcel'); S.cargo = S.cargo.filter(x => x.cat === 'tool');
    WL.tp('haven'); const o = (Economy.ordersFor('haven') || []).find(x => x.item === 'parcel' && x.to === to && !x.errand); Systems.acceptOrder(o, false);
    const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash; c.pacified = false; c.taken = null;
    for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
    WL.tp([ash.x + 200, ash.y + 300]); S.state = 'walk'; S.stagger = 0; S.health = 100;
    c.runners = [{ x: S.px + 10, y: S.py, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }];
    __die(0.5, () => Systems.update(0.02, {})); c.runners = [];
    const dr = S.drops.find(d => d.item && d.item.parcel && d.item.parcel.to === to);
    return { g: Economy.grievancesFor(to).find(x => dr && x.id === dr.item.parcel.id), dr, o: S.orders.active.find(x => x.item === 'parcel' && x.to === to) };
  };
  window.__arrive = id => { document.getElementById('keeperSay').classList.add('hidden'); WL.tp([DATA.stations.haven.x + 520, DATA.stations.haven.y - 700]); Systems.update(0.02, {}); __says.length = 0; WL.tp(id); Systems.update(0.02, {}); return !document.getElementById('keeperSay').classList.contains('hidden'); };
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(async () => {
  const inPal = (rows, pal, w, h) => rows.length === h && rows.every(rw => rw.length === w) && [...new Set(rows.join('').replace(/\./g, ''))].every(ch => pal[ch]);
  const face = inPal(SPRITES.WALKER_FACE, SPRITES.WALKER_FACE_PAL, 16, 16) && /^data:image\/png/.test(Render.walkerFaceURL(3)) && Render.walkerFaceURL(3, { ...(S.look || {}), C: '#6e4a4a' }) !== Render.walkerFaceURL(3, { ...(S.look || {}), C: '#3a5a7a' }) && Render.walkerFaceURL(3) === Render.walkerFaceURL(3);
  const SIX = ['promise', 'sorry', 'stone', 'grudge', 'scar', 'road'], marks = SIX.every(k => inPal(SPRITES.MARKS[k], SPRITES.MARK_PAL, 7, 7)) && new Set(SIX.map(k => SPRITES.MARKS[k].join(''))).size === 6;
  const F = SPRITES.FIG, kin = !!F.kin && ['E', 'S', 'N'].every(fc => F.kin.frames[fc] && F.kin.frames[fc].idle.length === F.kin.h) && F.kin.frames.S.idle.join('') !== F.townshield.frames.S.idle.join('');   // v3.51: the kin on the cast's own grid
  const chief2 = !!F.chief2 && ['E', 'S', 'N'].every(fc => F.chief2.frames[fc].idle.join('') !== F.chief.frames[fc].idle.join(''));
  const pin = inPal(SPRITES.RINGPIN, SPRITES.RAGSTAKE_PAL, 7, 11);
  const plain = Render.cargoGlyph({ defId: 'parcel', kg: 4, cat: 'goods' }), sworn = Render.cargoGlyph({ defId: 'parcel', kg: 4, cat: 'goods', sworn: true }), torn = Render.cargoGlyph({ defId: 'parcel', kg: 4, cat: 'goods', grieved: true });
  const swornOk = sworn.rows.join('') !== plain.rows.join('') && sworn.rows.join('') !== torn.rows.join('') && /R/.test(sworn.rows.join('')) && inPal(sworn.rows, sworn.pal, sworn.rows[0].length, sworn.rows.length);
  const size = src => new Promise(res => { const im = new Image(); im.onload = () => res(im.naturalWidth + 'x' + im.naturalHeight); im.onerror = () => res('0'); im.src = src; });
  const plates = ['bolt', 'scar', 'dressed'].map(k => Render.rigOverlayURL(k, 3)), platesOk = new Set(plates).size === 3 && (await Promise.all(plates.map(size))).every(s2 => s2 === '60x72');
  const W = DATA.T.word, rows = W.promiseDays === 2 && W.kept === 2 && W.keptLikes === 1 && W.brokenMemory === 6 && W.sorryCost === 5;
  const K = REP.DOCTRINE.storm.rise.kin, G = REP.WATCHPOST.storm.seen.grudge, doctrine = K.days === 1 && K.slowPerStone === 120 && K.maxStones === 3 && G.days === 3 && G.sayR === 260;
  const lines = DATA.stationOrder.flatMap(id => ['promise', 'sorry', 'broken', 'kept'].map(k => DATA.keeperGrief[id][k])), voices = lines.length === 32 && lines.every(l => typeof l === 'string' && l.length > 12) && new Set(lines).size === 32;
  const causesN = Object.keys(MUSTER.MOOD.causes).length, stoneCauses = MUSTER.MOOD.causes.stone.v === -1 && MUSTER.MOOD.causes.stones.v === -3;
  const lessons = ['firstWord', 'firstKin', 'firstGrudge', 'firstScarStone', 'firstRingWalk'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]), lessonsN = Object.keys(DATA.tutorials).length;
  return { face, marks, kin, chief2, pin, swornOk, platesOk, rows, doctrine, voices, stoneCauses, causesN, lessons, lessonsN };
});
ok('THE REGISTRIES: the Walker\'s 16×16 bust on the keepers\' alphabet, served and bound at draw time to the look they cut (another coat, another bust); six 7×7 marks (the knotted string, the open hand, the stone, the grudge, the scar, the road); the kin and the new chief drawn by hand (v3.51: on the cast\'s own grid — the kin its own figure, the new chief a different man from the first from every side); the ring pin (7×11); the sworn parcel\'s rust knot, its own glyph; three rig plates of the bolt, the scar and the dressing; the word\'s row, the kin\'s and the grudge\'s doctrine; thirty-two keeper lines (four a keeper in their own voice); the stones in the mood (v3.49: 31 causes); five lessons (v3.49: the manual at 93 pages)',
  Object.entries(r).every(([k, v]) => k === 'causesN' ? v === 31 : k === 'lessonsN' ? v >= 93 : v === true), JSON.stringify(r));

/* ================= 2 · THE PROMISE KEPT ================= */
r = await ev(() => {
  const Gn = 'green', k = __knock(Gn); if (!k.g) return { knocked: false };
  window.__pk = { gid: k.g.id, item: k.dr.item.id };
  const shown = __arrive(Gn);
  const el = document.getElementById('keeperSay');
  const plate = shown && el.classList.contains('open') && !!el.querySelector('[data-word^="promise:"]') && !!el.querySelector('[data-word^="sorry:"]') && !!el.querySelector('img.ksWalker') && el.querySelector('img.ksWalker').getAttribute('src') === Render.walkerFaceURL(3);
  const rail = Systems.getInteractions().some(i => i.key === 'P' && /Give your word/.test(i.label)) && Systems.getInteractions().some(i => i.key === 'X' && /Apologize/.test(i.label));
  return { knocked: true, shown, plate, rail };
});
const pk1 = r;
if (pk1.plate) { await page.click('#keeperSay [data-word^="promise:"]'); await page.waitForTimeout(250); }
r = await ev(() => {
  const Gn = 'green', W = DATA.T.word, g = Economy.grievancesFor(Gn).find(x => x.id === __pk.gid);
  const given = !!g && g.word === 'promise' && __says.some(s => s.str === 'You have my word. It comes through.') && !!S.flags.tut.firstWord;
  const dr = S.drops.find(d => d.item.id === __pk.item);
  const string = !!dr && dr.item.sworn === true && Render.cargoGlyph(dr.item).rows.slice(0, 3).join('') === Render.cargoGlyph({ defId: 'parcel', kg: 4, cat: 'goods', sworn: true }).rows.slice(0, 3).join('');
  const ic = h => (h.match(/src="([^"]+)"/) || [])[1], paper = ic(UI.iconTag({ defId: 'parcel', cat: 'goods', sworn: true, grieved: true })) !== ic(UI.iconTag({ defId: 'parcel', cat: 'goods', grieved: true }));
  WL.tp([DATA.stations.green.x + 400, DATA.stations.green.y + 300]); Guide.tick(0.3); const gs = Guide.current(), guide = !!gs && /^YOUR WORD — /.test(gs.head);
  WL.tp(Gn); UI.openStation(Gn);
  const board = [...document.querySelectorAll('#stationBody .grievances .needRow.grv')].some(e => /YOUR WORD/.test(e.textContent) && /h of your word left/.test(e.textContent));
  const greet = document.getElementById('keeperLine').textContent.includes(Economy.keeperWordLine(Gn, 'promise', g).slice(0, 24));
  document.getElementById('stationClose').click();
  /* the town waits the word's days instead of remembering */
  g.t = S.time - DATA.T.grievance.fadeDays * DATA.T.dayLen - 10; for (let i = 0; i < 12; i++) Economy.update(0.5);
  const waits = !g.remembered && Economy.grievancesFor(Gn).includes(g);
  /* kept inside the word: carried through on the run */
  const it = dr.item; S.drops.splice(S.drops.indexOf(dr), 1); State.addCargo(it);
  const ap0 = S.stations[Gn].appr || 0, lk0 = S.stations[Gn].likesTo; WL.tp(Gn); WL.instantPar(); __says.length = 0;
  const res = Systems.handleDelivery(Gn).results.find(x => x.order && x.order.item === 'parcel');
  const keptLine = Economy.keeperWordLine(Gn, 'kept', g);
  const kept = !!res && /Your word, kept\.$/.test(res.made[0]) && (S.stations[Gn].appr || 0) === ap0 + DATA.T.grievance.made + W.kept + res.appr && S.stations[Gn].likesTo === lk0 + W.keptLikes && Economy.book(Gn).kept === 1;
  const face = !document.getElementById('keeperSay').classList.contains('hidden') && document.getElementById('keeperSay').classList.contains('made') && document.getElementById('keeperSay').textContent.includes(keptLine.slice(0, 24)) && S.stations[Gn].madeSaid.line === keptLine;
  document.getElementById('keeperSay').classList.add('hidden');
  return { given, string, paper, guide, board, greet, waits, kept, face };
});
ok('THE PROMISE KEPT: at the door the keeper\'s plate offers the answer beside the Walker\'s own face — PROMISE and APOLOGY — and the rail prints P and X; a real click on PROMISE gives your word (said aloud in the Walker\'s voice, the lesson); the parcel on the road wears the SWORN string (its own glyph on the ground, its own icon on paper); the guide walks your word first (YOUR WORD — …); the board\'s grievance row says YOUR WORD with the hours left and the terminal\'s greeting answers it; past the grievance\'s own days the town waits instead of remembering; carried through inside the word it is KEPT — the making-right and two more, a like warmer, the book, and the keeper says your word was kept, to your face, in gold',
  pk1.knocked && pk1.shown && pk1.plate && pk1.rail && Object.values(r).every(Boolean), JSON.stringify(pk1) + ' ' + JSON.stringify(r));

/* ================= 3 · THE WORD BROKEN ================= */
r = await ev(() => {
  const Q = 'quarry', W = DATA.T.word, k = __knock(Q); if (!k.g) return { knocked: false };
  const g = k.g; __arrive(Q);
  const rail = Systems.getInteractions().find(i => i.key === 'P'); if (rail) rail.fn();
  const promised = g.word === 'promise';
  document.getElementById('keeperSay').classList.add('hidden');
  /* the span run out: BROKEN — the town remembers at six likes for good */
  const lk0 = S.stations[Q].likesTo = 40; S.mails.length = 0;
  g.wordT = S.time - W.promiseDays * DATA.T.dayLen - 1; for (let i = 0; i < 12; i++) Economy.update(0.5);
  const broken = g.word === 'broken' && g.remembered && S.stations[Q].likesTo === lk0 - W.brokenMemory && S.mails.some(m => m.subj === 'Quarry: your word, broken') && S.stations[Q].wordSaid.kind === 'broken';
  const readBack = Economy.keeperWordLine(Q, 'broken', g);
  UI.openStation(Q);
  const terminal = document.getElementById('keeperLine').textContent.includes(readBack.slice(0, 24)) && !!document.querySelector('#keeperLine .keeperWords.grief');
  const board = [...document.querySelectorAll('#stationBody .grievances .needRow.grv')].some(e => /YOUR WORD, BROKEN/.test(e.textContent));
  document.getElementById('stationClose').click();
  /* at the door the keeper reads it back: a memory cannot be answered — no words offered */
  S.stations[Q].faceSaid = null; const door = __arrive(Q), el = document.getElementById('keeperSay');
  const atDoor = door && !el.classList.contains('open') && !el.querySelector('[data-word]') && !Systems.getInteractions().some(i => i.key === 'P' && /Give your word/.test(i.label));
  el.classList.add('hidden');
  S.orders.active = S.orders.active.filter(o => o.item !== 'parcel'); S.cargo = S.cargo.filter(x => x.cat === 'tool');
  return { knocked: true, promised, broken, terminal, board, atDoor };
});
ok('THE WORD BROKEN: a promise given at the door on the rail\'s P and left to run its two days is BROKEN — the town remembers at six likes for good (the mail), the keeper reads your word back to you at the terminal in their own voice, the board says YOUR WORD, BROKEN; and at the door a memory cannot be answered — the plate offers nothing, the rail no P',
  Object.values(r).every(Boolean), JSON.stringify(r));

/* ================= 4 · THE APOLOGY FROM THE BOARD ================= */
r = await ev(() => {
  const M = 'mill', k = __knock(M); if (!k.g) return { knocked: false };
  window.__ap = { gid: k.g.id, appr: S.stations[M].appr || 0, likes: S.stations[M].likesTo };
  WL.tp(M); UI.openStation(M);
  return { knocked: true, btn: !!document.querySelector(`#stationBody [data-word="sorry:${k.g.id}"]`) };
});
const ap1 = r;
if (ap1.btn) { await page.click(`#stationBody [data-word="sorry:${await ev(() => __ap.gid)}"]`); await page.waitForTimeout(300); }
r = await ev(() => {
  const M = 'mill', W = DATA.T.word, g = Economy.grievancesFor(M).find(x => x.id === __ap.gid);
  const said = !!g && g.word === 'sorry' && (S.stations[M].appr || 0) === __ap.appr - W.sorryCost && Economy.book(M).sorry === 1 && __says.some(s => s.str === 'That one is mine. I am sorry.');
  const room = document.getElementById('keeperLine') && document.getElementById('keeperLine').textContent.includes(Economy.keeperWordLine(M, 'sorry', g).slice(0, 24));   // the room's greeting answers without reopening
  const row = [...document.querySelectorAll('#stationBody .grievances .needRow.grv')].some(e => /you said sorry — it goes quietly when its days run/.test(e.textContent));
  document.getElementById('stationClose').click(); document.getElementById('keeperSay').classList.add('hidden');
  /* its days run: the town lets it go quietly — the likes kept */
  g.t = S.time - DATA.T.grievance.fadeDays * DATA.T.dayLen - 1; S.mails.length = 0;
  for (let i = 0; i < 12; i++) Economy.update(0.5);
  const quietly = !Economy.grievancesFor(M).length && S.stations[M].likesTo === __ap.likes && S.mails.some(m => m.subj === 'The Mill lets it go');
  S.orders.active = S.orders.active.filter(o => o.item !== 'parcel'); S.cargo = S.cargo.filter(x => x.cat === 'tool');
  return { said, room, row, quietly };
});
ok('THE APOLOGY FROM THE BOARD: a real click on the board\'s APOLOGY pays five appreciation now (the book writes it; the Walker says it aloud); the room\'s greeting answers it without reopening and the row says it goes quietly when its days run; when they run the town lets it go — the likes kept, the mail',
  ap1.knocked && ap1.btn && Object.values(r).every(Boolean), JSON.stringify(ap1) + ' ' + JSON.stringify(r));

/* ================= 5 · THE KIN IN THE SQUARE ================= */
r = await ev(() => {
  const M = 'mill', st = S.stations[M], K = REP.DOCTRINE.storm.rise.kin;
  S.rep.held[M] = { t0: S.time, from: M, tithe: 0, shields: 2, riseDay: -1 }; st.likesTo = 45;
  const a = Republic.recruitOwn(M), b = Republic.recruitOwn(M); NPC.setOrder(a, 'hours', 'full'); NPC.setOrder(b, 'hours', 'full');
  const names = [a.name, b.name], stones0 = Republic.stonesOf(M);
  __at(0.75); S.mails.length = 0;
  __die(0.2, () => Republic.squareRises(M));
  const kin = Republic.kinAt(M), named = !!kin && kin.names.length === 2 && names.every(n => kin.names.includes(n)) && kin.spots.length === 2 && !!S.flags.tut.firstKin;
  /* a town that has buried its own recruits slower: two minutes on the clock for every stone, up to three */
  const stones = Republic.stonesOf(M), slower = stones === stones0 + 2 && Republic.recruitEvery(M) === REP.DOCTRINE.storm.rise.recruitEvery + Math.min(K.maxStones, stones) * K.slowPerStone;
  const capped = (() => { const extra = []; for (let i = 0; i < 3; i++) { const row = { name: 'Stone ' + i, fact: 'town', town: M, fate: 'x', likes: 0, km: '0.0', deliveries: 0, seed: i }; S.legacy.push(row); extra.push(row); } const v = Republic.recruitEvery(M); for (const row of extra) S.legacy.splice(S.legacy.indexOf(row), 1); return v === REP.DOCTRINE.storm.rise.recruitEvery + K.maxStones * K.slowPerStone; })();
  /* the sheet says so, released — and held again */
  RepublicUI.open(); const rel = /2 of its own at THE FIELD STONES — their kin keep the place in the square; garrisoned again, it would stand its own 4 minutes slower/.test(document.getElementById('repBody').textContent); RepublicUI.close();
  delete S.rep.unlit[M]; st.connected = true; st.litT = 1; State.refreshSources();
  S.rep.held[M] = { t0: S.time, from: M, tithe: 0, shields: 2, riseDay: -1 }; st.likesTo = 45;
  RepublicUI.open(); const held = /2 of its own at THE FIELD STONES — their kin keep the place in the square/.test(document.getElementById('repBody').textContent) && /one walks in every 8 minutes \(slower by the 2 stones at the field's edge\)/.test(document.getElementById('repBody').textContent); RepublicUI.close();
  /* the town's own in the square feel the stones: more than one, the heavier */
  const c = Republic.recruitOwn(M), mood = NPC.mood(c).causes.map(x => x.id).includes('stones') && !NPC.mood(c).causes.map(x => x.id).includes('stone');
  S.npcs.splice(S.npcs.indexOf(c), 1); Republic.held()[M].own = 0;
  window.__kin = { M };
  return { named, stones, slower, capped, rel, held, mood };
});
const kn1 = r;
/* seen at night in the square: the kin where the shields stood, their lanterns punching their own holes in the dark (against the same frame without them) */
await drain();
const kinSeen = await ev(async () => {
  const d = DATA.stations.mill, st = S.stations.mill; __at(0.8);
  WL.tp([d.x + 200, d.y + 220]); S.weather.state = 'clear'; __clearAmb(d.x, d.y, 360); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = d.x; Render.cam.y = d.y + 70;
  await __wait(300); await __frames(4);
  const L = [[d.x - 58 + 14, d.y + 90], [d.x + 58 - 14, d.y + 90]];
  const A = [__grab(d.x - 58, d.y + 70, 40), __grab(d.x + 58, d.y + 70, 40)], darkA = L.map(p => Render.darkAt(p[0], p[1])), label = Render.labelBoxes().some(b => b.str === 'THE KIN KEEP THE PLACE');
  const k = st.kin; st.kin = null; await __wait(150); await __frames(4);
  const B = [__grab(d.x - 58, d.y + 70, 40), __grab(d.x + 58, d.y + 70, 40)], darkB = L.map(p => Render.darkAt(p[0], p[1])); st.kin = k;
  /* a day on, the kin go home */
  const kinDay = S.time; S.time += DATA.T.dayLen + 1; const home = !Republic.kinAt('mill'); S.time = kinDay;
  __done(); WL.timeScale = 0.001; __at(0.3);
  return { figures: A.map((a, i) => __diff(a, B[i])), darkA: darkA.map(v => +v.toFixed(2)), darkB: darkB.map(v => +v.toFixed(2)), label, home };
});
ok('THE KIN IN THE SQUARE: a square that rises takes two of the town\'s own standing round the clock, and their kin keep the place — two named (the lesson); a town that has buried its own recruits slower, two minutes on the clock for every stone up to three; the banner sheet says so, released (it would stand its own four minutes slower) and held again (one every eight minutes, slower by the two stones); a new recruit in the square feels the stones (more than one, the heavier cause); home in a day',
  kn1.named && kn1.slower && kn1.capped && kn1.rel && kn1.held && kn1.mood && kinSeen.home, JSON.stringify(kn1) + ' home=' + kinSeen.home);
ok('THE KIN, SEEN: at night in the risen square (the Unlit\'s, dark) the kin stand where the shields stood, grey shawls and lanterns held low — pixel-sampled on the game canvas against the same frame without them — with THE KIN KEEP THE PLACE under their feet, and their lanterns punch their own holes in the night (the darkness layer thinner at each lantern than in the same frame without them)',
  kinSeen.figures.every(n => n > 30) && kinSeen.label && kinSeen.darkA.every((v, i) => v >= 0 && v < kinSeen.darkB[i] - 0.1), JSON.stringify(kinSeen));

/* ================= 7 · THE NEW CHIEF'S GRUDGE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, ridge = DATA.camps.find(x => x.id === 'ridge'), cr = S.camps.ridge, span = REP.WATCHPOST.storm.seen.mourn * DATA.T.dayLen, G = REP.WATCHPOST.storm.seen.grudge;
  for (const cd of DATA.camps) { const x = S.camps[cd.id]; x.taken = null; x.pacified = false; x.storm = null; x.grudge = null; x.chiefLost = 0; x.chiefReturn = null; }
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  /* your hand: at Ash's own post the chief comes out and your shove puts him down — the storm breaks */
  c.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 2, stormDay: -1 }; c.pacified = true; c.chiefGen = 0;
  WL.tp([ash.x + 60, ash.y + 40]); Republic.stormPost(ash);
  const s2 = c.storm, chief = s2.knives.find(k => k.cls === 'chief');
  for (const k of s2.knives) if (k !== chief) k.cd = 30;
  const b = NPC.gen({ at: 'haven' }); S.npcs.push(b); NPC.hire(b, 'companion'); b.hungry = false; b.shoveCd = 0; b.cx = S.px - 500; b.cy = S.py;
  chief.x = S.px + 8; chief.y = S.py; s2.shieldT = 99; Republic.tick(0.02);
  const broke = s2.broke && s2.brokeBy === 'walker';
  s2.t = s2.dur; Republic.tick(0.02);
  const hand = c.chiefFelledBy === 'walker' && !!c.chiefLost;
  b.state = 'pool'; b.at = 'haven'; c.taken = null; c.pacified = false; WL.tp('haven');
  /* the return: the new man, with the grudge (the mail, the lesson) */
  __at(0.3); c.chiefLost = S.time - span - 1; Republic.tick(0.05); for (let i = 0; i < 80 && c.chiefReturn; i++) Republic.tick(0.1);
  const newMan = !!c.grudge && Republic.chiefKit(ash) === 'chief2' && c.chiefGen === 1 && S.mails.some(m => m.subj === 'Ash Camp: a new chief — and a grudge') && !!S.flags.tut.firstGrudge && !!Republic.grudgeOf(ash);
  /* no post of yours: no target, no storm */
  const noTarget = Republic.grudgeTarget(ash) === null;
  /* the say at the fire, inside his reach */
  __says.length = 0; WL.tp([ash.x - 120, ash.y + 100]); Republic.tick(0.02);
  const say = __says.some(s => /^You put him down\./.test(s.str)) && c.grudge.said;
  WL.tp('haven');
  /* your nearest post: Ridge held — his first storm, but not tonight: the next night at the storm's hour */
  cr.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 4, stormDay: -1 }; cr.pacified = true; cr.runners = [];
  const target = Republic.grudgeTarget(ash) === ridge;
  RepublicUI.open(); const sheet = /THE CHIEF HOLDS A GRUDGE — you put his brother down; Ridge Camp is his first storm, the next night/.test(document.getElementById('repBody').textContent); RepublicUI.close();
  const roll = /Ridge Camp/.test(UI.campRollHTML(ash, false)) && /GRUDGE/i.test(UI.campRollHTML(ash, false));
  __at(0.8); Republic.tick(0.02); const notTonight = !cr.storm;
  window.__gr = { day: Math.floor(S.time / DATA.T.dayLen) };
  return { broke, hand, newMan, noTarget, say, target, sheet, roll, notTonight };
});
const gr1 = r;
/* the grudge on the survey sheet: its mark with a rust halo under the fire, and its line */
const grSheet = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash');
  WL.tp([ash.x - 200, ash.y + 900]);
  UI.toggleMap(true); UI.drawMap();
  const c = document.getElementById('map'), g = c.getContext('2d'), r0 = c.getBoundingClientRect(), sc = c.width / r0.width, p = UI.mapPoint(ash.x, ash.y);
  const want = ['chief', 'bowman', 'ram', 'knife', 'grudge'], mk = 3, gap = 4, wAll = want.length * (7 * mk + gap) - gap, gx = (p.x - r0.left) * sc - wAll / 2 + 4 * (7 * mk + gap), gy = (p.y - r0.top) * sc + 14;
  const rows = SPRITES.MARKS.grudge; let n = 0, hit = 0;
  for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) { const ch = rows[j][i]; if (ch === '.') continue; n++; const d = g.getImageData(Math.floor(gx + (i + 0.5) * mk), Math.floor(gy + (j + 0.5) * mk), 1, 1).data, w = __hex(SPRITES.MARK_PAL[ch]); if (Math.abs(d[0] - w[0]) + Math.abs(d[1] - w[1]) + Math.abs(d[2] - w[2]) < 12) hit++; }
  UI.toggleMap(false); WL.tp('haven');
  return { grudgeMark: +(hit / n).toFixed(2) };
});
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, cr = S.camps.ridge, ridge = DATA.camps.find(x => x.id === 'ridge');
  /* the next night: the storm from his camp, with him in front, on your post — stood at the post, it is seen: THE GRUDGE */
  S.time += DATA.T.dayLen; __titles.length = 0; S.mails.length = 0;
  WL.tp([ridge.x + 80, ridge.y + 60]); Republic.tick(0.02);
  const st = cr.storm, storm = !!st && st.from === 'ash' && st.knives[0].cls === 'chief' && st.knives.map(k => k.cls).join() === 'chief,bowman,ram' && __titles.some(t => /^THE GRUDGE — Ash Camp comes for Ridge Camp/.test(t)) && S.mails.some(m => m.subj === 'Ridge Camp: the grudge comes');
  /* held: the grudge paid — he does not carry it twice */
  if (st) { for (const k of st.knives) { k.cd = 30; k.atFire = 0; } st.knives[0].cd = 0; st.knives[0].x = ridge.x + 700; st.knives[0].y = ridge.y; st.shieldT = 99; st.t = st.dur; }   // his knives down, the chief standing out on the ring
  Republic.tick(0.02);
  const paid = !c.grudge && !!cr.taken && S.mails.some(m => m.subj === 'Ash Camp: the grudge paid');
  /* another grudge, never paid: three days and it cools */
  c.grudge = { t: S.time - REP.WATCHPOST.storm.seen.grudge.days * DATA.T.dayLen - 1, said: true, fired: Math.floor(S.time / DATA.T.dayLen) }; cr.taken = null; cr.pacified = false;
  S.mails.length = 0; Republic.tick(0.02);
  const cooled = !c.grudge && S.mails.some(m => m.subj === 'Ash Camp: the grudge cools');
  WL.tp('haven'); __at(0.3);
  return { storm, paid, cooled };
});
ok('THE NEW CHIEF\'S GRUDGE: the storm remembers whose hand put the chief down — your own shove breaks it (the walker\'s); the return brings a different man (the new chief\'s kit, the generation) with a grudge (the mail, the lesson); with no post of yours there is no target; he says it at his fire when you come near (You put him down. …); your nearest post held, it is his first storm — the banner sheet and the roll name it, the survey sheet wears the grudge mark (read off the sheet texel for texel) — not the night he came back but the next, at the storm\'s hour: his camp\'s knives on your post with him in front, THE GRUDGE; held, the grudge is paid and he does not carry it twice; unpaid three days, it cools',
  Object.values(gr1).every(Boolean) && grSheet.grudgeMark >= 0.95 && Object.values(r).every(Boolean), JSON.stringify(gr1) + ' sheet=' + JSON.stringify(grSheet) + ' ' + JSON.stringify(r));

/* ================= 9 · THE ROAD TO THE RING (taken before the stone: the Walker must be standing) ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash');
  for (const cd of DATA.camps) { const x = S.camps[cd.id]; x.taken = null; x.pacified = false; x.chiefLost = 0; x.grudge = null; }
  S.moveTo = null; S.route = []; WL.tp([ash.x - 400, ash.y + 1400]);
  UI.toggleMap(true); UI.drawMap();
  const m = UI.mapPoint(ash.x, ash.y);
  return { x: m.x, y: m.y + 24 };
});
const mk2 = r;
await page.mouse.move(mk2.x, mk2.y); await page.waitForTimeout(120);
await page.mouse.click(mk2.x, mk2.y); await page.waitForTimeout(200);
const roadRow = await ev(() => { const el = document.querySelector('#mapTip.pinned [data-road="ash"]'); return el ? el.textContent : null; });
if (roadRow) { await page.click('#mapTip.pinned [data-road="ash"]'); await page.waitForTimeout(250); }
const ring1 = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), m = S.moveTo;
  const planned = !!m && m.ring === 'ash' && Math.abs(U.dist(m.x, m.y, ash.x, ash.y) - (ash.r + 130)) < 40;
  const letGo = document.getElementById('mapTip').style.display === 'none' && !document.getElementById('mapWrap').classList.contains('hidden');
  /* the ring pin on the sheet, where the numbered circle would be, and the camp named under it */
  UI.drawMap();
  const c = document.getElementById('map'), g = c.getContext('2d'), r0 = c.getBoundingClientRect(), sc = c.width / r0.width, p = UI.mapPoint(m.x, m.y), mk = 2.5;
  const rows = SPRITES.RINGPIN, x0 = (p.x - r0.left) * sc - 3.5 * mk, y0 = (p.y - r0.top) * sc - 10 * mk; let n = 0, hit = 0;
  for (let j = 0; j < rows.length; j++) for (let i = 0; i < 7; i++) { const ch = rows[j][i]; if (ch === '.') continue; n++; const d = g.getImageData(Math.floor(x0 + (i + 0.5) * mk), Math.floor(y0 + (j + 0.5) * mk), 1, 1).data, w = __hex(SPRITES.RAGSTAKE_PAL[ch]); if (Math.abs(d[0] - w[0]) + Math.abs(d[1] - w[1]) + Math.abs(d[2] - w[2]) < 16) hit++; }
  const lesson = !!S.flags.tut.firstRingWalk;
  UI.toggleMap(false); S.moveTo = null;
  /* by the engine's own door */
  UI.toggleMap(true); const door = UI.ringWalk('ridge') && S.moveTo && S.moveTo.ring === 'ridge'; UI.toggleMap(false); S.moveTo = null;
  return { planned, letGo, pin: +(hit / n).toFixed(2), lesson, door };
});

/* ================= 8 · THE SCAR CARRIED TO THE STONE ================= */
r = await ev(() => {
  /* the record: two scars closed on the walk, one still open — and the Walker falls */
  S.pStats = S.pStats || {}; S.pStats.scars = [{ t: S.time - 900, by: 'medic', dressed: 3, dressedBy: 'medic', late: false }, { t: S.time - 400, by: 'self', dressed: 0, dressedBy: null, late: true }];
  S.scar = { t0: S.time, dressed: 1, dressT: 0, by: 'town', lastBy: 'town' };
  const look = S.look ? { ...S.look } : null, name = S.pName, leg0 = S.legacy.length;
  WL.tp([DATA.stations.haven.x + 520, DATA.stations.haven.y + 260]);
  Porter.die('bleed');
  const row = S.legacy[leg0], record = !!row && row.name === name && row.scars === 3 && JSON.stringify(row.look) === JSON.stringify(look);
  const slip = document.getElementById('deathPortrait').getAttribute('src') === Render.walkerFaceURL(5);
  /* the manual's pages carry the wound in plates, and the stone's page two */
  S.flags.tut.firstScar = S.flags.tut.firstScarStone = true;
  ManualUI.open('lessons'); const tab = ManualUI.tab() === 'lessons';
  const pages = [...document.querySelectorAll('.fmLesson')], scarPg = pages.find(e => e.querySelector('.fmTitle').textContent.startsWith(DATA.tutorialTitles.firstScar)), stonePg = pages.find(e => e.querySelector('.fmTitle').textContent.startsWith(DATA.tutorialTitles.firstScarStone));
  const plates = !!scarPg && [...scarPg.querySelectorAll('.fmPlates img')].map(im => im.getAttribute('src')).join() === ['bolt', 'scar', 'dressed'].map(k => Render.rigOverlayURL(k, 3)).join() && !!stonePg && stonePg.querySelectorAll('.fmPlates img').length === 2;
  ManualUI.render(); ManualUI.close();
  /* the card: a mark for each scar and how many */
  Memorial.raise('waylight');
  Memorial.open('waylight'); const card = [...document.querySelectorAll('#memBody .memCard')].find(e => e.textContent.includes(name));
  const cardOk = !!card && card.querySelectorAll('.memScars img').length === 3 && /3 scars carried to th/.test(card.textContent) && card.querySelector('.memPortrait img').getAttribute('src') === Render.walkerFaceURL(4, look);
  Memorial.close();
  const mr = Memorial.rows('waylight').find(x => x.i === leg0);
  window.__stone = { i: leg0, ord: mr ? mr.ord : 0 };
  return { record, slip, tab, plates, cardOk };
});
const sc1 = r;
/* the stone notched in the scar's red, up to three (against the same stone uncut) */
const notch = await ev(async () => {
  const sl = Memorial.slotFor(__stone.ord, 'waylight');
  WL.tp([sl.x + 150, sl.y + 120]); S.weather.state = 'clear'; __clearAmb(sl.x, sl.y, 300); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = sl.x; Render.cam.y = sl.y; __at(0.3); WL.timeScale = 0.001;
  await __wait(300); await __frames(3);
  const red = __hex('#6a2a22'), a = __near(sl.x, sl.y, red, 6, 40);
  const row = S.legacy[__stone.i], n0 = row.scars; row.scars = 0; await __wait(150); await __frames(3);
  const b = __near(sl.x, sl.y, red, 6, 40); row.scars = 1; await __wait(150); await __frames(3); const one = __near(sl.x, sl.y, red, 6, 40); row.scars = n0;
  __done(); WL.timeScale = 0.001;
  return { three: a, none: b, one };
});
ok('THE SCAR CARRIED TO THE STONE: a scar closed is written on the walk, and the walker fallen carries the count to the stone (two closed and the one still open — three) with the coat they cut; the death slip wears the Walker\'s own bust; the manual\'s scar page carries the wound in three rig plates (the bolt, the scar, the dressing) and the stone\'s page two; the memorial card shows a mark for each and says how many, in the bust of that coat; the stone is notched in the scar\'s red, up to three (pixel-sampled against the same stone uncut, and with one)',
  Object.values(sc1).every(Boolean) && notch.three > notch.one && notch.one > notch.none && notch.none === 0, JSON.stringify(sc1) + ' notches=' + JSON.stringify(notch));
ok('THE ROAD TO THE RING: a real click on a live camp\'s marks pins its roll with the road on it (walk to the ring — the distance to its near edge); a real click on the road plans the walk to the ring\'s near edge (just outside the loaded pack\'s danger ring), lets the roll go with the sheet open, and plants the ring pin on the sheet in place of the numbered circle (read off the sheet texel for texel) — the lesson; the engine\'s own door plans the same walk',
  !!roadRow && /walk to the ring — [\d.]+ km to its near edge/.test(roadRow) && ring1.planned && ring1.letGo && ring1.pin >= 0.85 && ring1.lesson && ring1.door, JSON.stringify({ roadRow, ...ring1 }));

/* ================= 10 · THE SAVE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash');
  S.camps.ash.grudge = { t: S.time, said: false, fired: 3 }; S.camps.ash.chiefGen = 1; S.camps.ash.chiefFelledBy = 'walker';
  S.grievances = [{ id: 4242, to: 'elm', from: 'haven', kind: 'coat', name: 'a mended coat', t: S.time, how: 'ground', n: 1, remembered: false, word: 'promise', wordT: S.time - 100 }];
  S.stations.mill.kin = { t: S.time, names: ['A B', 'C D'], spots: [0, 1] };
  State.save(); State.load();
  const word = Economy.grievancesFor('elm')[0] && Economy.grievancesFor('elm')[0].word === 'promise' && Economy.wordLeft(Economy.grievancesFor('elm')[0]) > 0;
  const kin = !!Republic.kinAt('mill') && Republic.kinAt('mill').names.length === 2;
  const grudge = !!Republic.grudgeOf(ash) && Republic.chiefKit(ash) === 'chief2' && S.camps.ash.chiefFelledBy === 'walker';
  const stone = S.legacy.some(x => x.scars === 3 && x.look);
  return { word, kin, grudge, stone };
});
ok('THE SAVE: a promise and the hours left on it, the kin keeping the place, the new chief\'s grudge (his generation and whose hand it was) and the stone with its scars and its coat survive a save and load',
  Object.values(r).every(Boolean), JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
await T.finish('the word at the door');
