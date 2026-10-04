/* kept.mjs — v3.45 THE WORD KEPT (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was lost;
   its figures sampled on the courier's grid). What it proves: every hand wears a face composed by seed and trade, worn where
   the hands are met at exactly the size it is shown (the whole-pixel law); a town keeps a book of your word — two kept buys
   THE KEEPER'S ERRAND, a sealed letter for the farthest lit door, and a broken word SHUTS the door to promises until a
   grievance there is made right without one; the kin's errand (the shield home, the lantern's flame carried, burned, set lit
   at the stone, or left to go home); the grudge answered at the new chief's fire (the gift, the stand, the walk-away, the
   word kept and broken); the Walker's score against the camp that felled a back; the line at the ring; the lamp law and the
   crowded strip; the keepsakes in the book; the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const drain = async () => { await ev(() => { WL.timeScale = 1; }); await T.drain(); await ev(() => { WL.timeScale = 0.001; }); };
await ev(() => {
  for (const id of DATA.stationOrder) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources();
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  for (let i = 0; i < 4; i++) S.npcs.push(NPC.gen({ at: 'haven' }));
  window.__says = []; const sy = Render.say; Render.say = (x, y, str, col, who) => { __says.push({ str: String(str), col }); return sy(x, y, str, col, who); };
  window.__die = (v, fn) => { const r0 = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = r0; } };
  window.__at = f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; };
  window.__sheetMark = (cd, k, idx, count) => {   // one mark of a camp's row on the survey sheet, texel for texel
    UI.toggleMap(true); UI.drawMap();
    const c = document.getElementById('map'), g = c.getContext('2d'), r0 = c.getBoundingClientRect(), sc = c.width / r0.width, p = UI.mapPoint(cd.x, cd.y), mk = 3, gap = 4, wAll = count * (7 * mk + gap) - gap;
    const x0 = (p.x - r0.left) * sc - wAll / 2 + idx * (7 * mk + gap), y0 = (p.y - r0.top) * sc + 14, rows = SPRITES.MARKS[k]; let n = 0, hit = 0;
    for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) { const ch = rows[j][i]; if (ch === '.') continue; n++; const d = g.getImageData(Math.floor(x0 + (i + 0.5) * mk), Math.floor(y0 + (j + 0.5) * mk), 1, 1).data, w = __hex(SPRITES.MARK_PAL[ch]); if (Math.abs(d[0] - w[0]) + Math.abs(d[1] - w[1]) + Math.abs(d[2] - w[2]) < 12) hit++; }
    UI.toggleMap(false); return +(hit / n).toFixed(2);
  };
  window.__hideSay = () => document.getElementById('keeperSay').classList.add('hidden');
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const inPal = (rows, pal, w, h) => rows.length === h && rows.every(rw => rw.length === w) && [...new Set(rows.join('').replace(/\./g, ''))].every(ch => pal[ch]);
  const H = SPRITES.HANDS, trades = Object.keys(H.trades);
  let inPalette = true, distinct = 11 * 40, tradeRead = true;
  for (const t of trades) {
    const tc = new Set(Object.values(H.trades[t].pal || {}).map(v => v.toLowerCase())), seen = new Set();
    for (let s = 1; s <= 40; s++) {
      const f = SPRITES.handFace(s * 7919, t);
      if (!inPal(f.rows, f.pal, 16, 16)) inPalette = false;
      const used = new Set([...f.rows.join('')].filter(ch => ch !== '.').map(ch => String(f.pal[ch]).toLowerCase()));
      if (tc.size && ![...tc].some(c => used.has(c))) tradeRead = false;   // the trade drawn over it all, read off the face's own texels
      seen.add(f.rows.join('') + JSON.stringify(f.pal));
    }
    distinct -= 40 - seen.size;
  }
  const same = SPRITES.handFace(1234, 'medic').rows.join('') === SPRITES.handFace(1234, 'medic').rows.join('');
  const layers = SPRITES.HAND_SKINS.length === 6 && Object.keys(SPRITES.HAND_HAIRS).length >= 7 && trades.length === 11 && trades.every(t => Number.isFinite(H.trades[t].hat) || H.trades[t].hat === undefined);
  const chiefs = ['chief', 'chief2'].every(k => SPRITES.CHIEF_FACES[k] && inPal(SPRITES.CHIEF_FACES[k].rows, SPRITES.CHIEF_FACES[k].pal, 16, 16)) && SPRITES.CHIEF_FACES.chief.rows.join('') !== SPRITES.CHIEF_FACES.chief2.rows.join('');
  const NINE = ['kept', 'broken', 'shut', 'errand', 'gift', 'stand', 'score', 'lantern', 'home'], marks = NINE.every(k => inPal(SPRITES.MARKS[k], SPRITES.MARK_PAL, 7, 7)) && new Set(NINE.map(k => SPRITES.MARKS[k].join(''))).size === 9;
  const things = SPRITES.KINSHIELD_DOWN.length === 5 && SPRITES.KINSHIELD_DOWN.every(x => x.length === 9) && [SPRITES.KINLANTERN, SPRITES.KINLANTERN_DARK].every(L => L.length === 8 && L.every(x => x.length === 5)) && SPRITES.KINLANTERN.join('') !== SPRITES.KINLANTERN_DARK.join('') && SPRITES.KINLANTERN_SMALL.length === 5 && SPRITES.KINLANTERN_SMALL.every(x => x.length === 3);
  const g = x => Render.cargoGlyph(x).rows.join(''), glyphs = new Set([g({ defId: 'parcel', kg: 4, cat: 'goods', sealed: true }), g({ defId: 'kinShield', kg: 5, cat: 'kin' }), g({ defId: 'kinLantern', kg: 1, cat: 'kin', lit: true }), g({ defId: 'kinLantern', kg: 1, cat: 'kin' }), g({ defId: 'parcel', kg: 4, cat: 'goods' })]).size >= 4;
  const W = DATA.T.word, K = DATA.T.kin, P = DATA.T.parley, Sc = DATA.T.score, R = DATA.T.ring;
  const rows = W.errandAt === 2 && W.errandDays === 2 && W.errandAppr === 20 && W.errandLikes === 3 && W.errandDest === 6 && K.errandDays === 3 && K.burn === 900 && K.likes === 4 && K.appr === 6 && P.reach === 150 && P.gift.provisions === 40 && P.gift.metal === 30 && P.standTime === 15 && P.standR === 120 && P.truceDays === 1 && P.pactDays === 3 && Sc.days === 3 && Sc.reachMul === 1.25 && Sc.near === 400 && R.holdR === 420 && R.holdMax === 120 && R.gap === 34;
  const causesN = Object.keys(MUSTER.MOOD.causes).length, lessons = ['firstBook', 'firstErrand', 'firstKinErrand', 'firstParley', 'firstScore', 'firstLine'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]), lessonsN = Object.keys(DATA.tutorials).length;
  return { inPalette, distinct, tradeRead, same, layers, chiefs, marks, things, glyphs, rows, causesN, lessons, lessonsN };
});
ok('THE REGISTRIES: eleven trades × forty seeds of hands\' faces, every one 16×16 in its own palette, nearly all distinct, the same seed and trade the same face, and the trade read off each face\'s own texels (six skins, seven hairs, the trade drawn over all); two chiefs\' faces; nine 7×7 marks; the kin\'s things (the shield face-up, the lantern lit and cold, the small lantern) and their glyphs with the sealed letter\'s; the rows (the errand, the kin, the parley, the score, the ring); v3.49: 31 causes; six lessons (v3.49: the manual at 93 pages)',
  r.inPalette && r.distinct >= 400 && r.tradeRead && r.same && r.layers && r.chiefs && r.marks && r.things && r.glyphs && r.rows && r.causesN === 31 && r.lessons && r.lessonsN >= 93, JSON.stringify(r));

/* ================= 2 · THE FACES WORN ================= */
r = await ev(async () => {
  const done = im => new Promise(res => (im.complete && im.naturalWidth ? res() : (im.onload = res)));
  const sizes = {};   // the whole-pixel law, measured: [shown width, shown height, drawn width, drawn height]
  const law = async (key, im, px) => { if (!im) { sizes[key] = null; return false; } await done(im); sizes[key] = [im.clientWidth, im.clientHeight, im.naturalWidth, im.naturalHeight]; return im.naturalWidth === px && im.clientWidth === px && im.clientHeight === px; };
  /* the terminal's hire cards at 2× */
  WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('way');
  const cards = [...document.querySelectorAll('#stationBody img.handFace')];
  const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven');
  const hire = cards.length >= 2 && cards.every(im => pool.some(n => im.getAttribute('src') === Render.handFaceURL(n, 2))) && await law('hire', cards[0], 32);
  const keeper = await law('keeper', document.querySelector('#keeperLine img.keeperFace'), 48);   // the terminal's keeper at 3×
  document.getElementById('stationClose').click();
  /* the muster plates beside the figure at 3× */
  const n0 = pool[0]; NPC.hire(n0, 'companion');
  MusterUI.open(n0.id); const mf = document.querySelector('#musterBody img.muFace');
  const muster = !!mf && mf.getAttribute('src') === Render.handFaceURL(n0, 3) && await law('muster', mf, 48); MusterUI.close();
  /* the memorial's Farkeeper rows at 4× */
  S.legacy.push({ name: 'Brenna Coldbrook', cls: 'Farkeeper Shield', fate: 'fell holding Ridge Camp', likes: 0, km: '0.0', deliveries: 0, cheated: false, seed: 777, fact: 'farkeep' });
  Memorial.revealGround('farkeep'); Memorial.open('farkeep');
  const fk = [...document.querySelectorAll('#memBody .memCard')].find(e => e.textContent.includes('Brenna Coldbrook')), fim = fk && fk.querySelector('.memPortrait img');
  const memorial = !!fim && /^data:image\/png/.test(fim.getAttribute('src')) && await law('memorial', fim, 64); Memorial.close();
  /* the passage slots: the Walker's bust in their own coat */
  State.save(); const si = State.slotInfo(State.slot());
  ManualUI.open('passage'); const sf = document.querySelector('.fmSlotFace');
  const passage = !!sf && !si.empty && sf.getAttribute('src') === Render.walkerFaceURL(3, si.look || {}) && await law('passage', sf, 48); ManualUI.close();
  /* the door plate at 4× */
  const it = State.makeItem('parcel'); it.parcel = { id: 6060, to: 'elm', from: 'haven', kind: 'coat', name: 'a mended coat' }; Economy.grieve(it, 'ground');
  UI.keeperAtDoor('elm', 'A test line.', 'grief', Economy.grievancesFor('elm')[0]);
  const door = await law('door', document.querySelector('#keeperSay > img'), 64);
  __hideSay(); S.grievances = [];
  /* the new walker's sheet: the bust at 5× follows the swatches as the coat is cut */
  UI2.openCharGen(null); const cp = document.getElementById('cgPortrait'), before = cp.getAttribute('src');
  const sw = document.querySelector('#cgLookRows [data-look^="coat:"]:not(.sel)'); if (sw) sw.click();
  const after = cp.getAttribute('src'), follows = !!sw && before !== after && /^data:image\/png/.test(after);
  const sheet = follows && await law('sheet', cp, 80);
  document.getElementById('chargen').classList.add('hidden');
  return { hire, keeper, muster, memorial, passage, door, follows, sheet, sizes };
});
ok('THE FACES WORN: the hands wear their own faces where they are met — the terminal\'s hire cards at 2×, the keeper at 3×, the muster plate beside the figure at 3×, the memorial\'s Farkeeper rows at 4×, the passage slot with the Walker\'s bust in their own coat, the door plate at 4×, the new walker\'s sheet at 5× following the swatches as the coat is cut; THE WHOLE-PIXEL LAW measured: every framed face shown at exactly the size it is drawn (the frame outside the image, never squeezed a pixel)',
  r.hire && r.keeper && r.muster && r.memorial && r.passage && r.door && r.follows && r.sheet, JSON.stringify(r));

/* ================= 3 · THE BOOK AND THE ERRAND ================= */
r = await ev(() => {
  const M = 'mill', b = Economy.book(M); b.kept = 2; b.credit = 2; b.log.unshift({ t: S.time, kind: 'kept', name: 'a mended coat' }, { t: S.time, kind: 'kept', name: 'a twist of seed' });
  S.orders.active = []; S.cargo = S.cargo.filter(x => x.cat === 'tool');
  const eo = (Economy.ordersFor(M) || []).find(o => o.errand === M);
  const far = DATA.stationOrder.filter(id => id !== M && S.stations[id].connected).sort((a, c) => U.dist(DATA.stations[M].x, DATA.stations[M].y, DATA.stations[c].x, DATA.stations[c].y) - U.dist(DATA.stations[M].x, DATA.stations[M].y, DATA.stations[a].x, DATA.stations[a].y))[0];
  const posted = !!eo && eo.to === far && eo.parcels[0].kind === 'sealed' && eo.service && eo.n === 1;
  WL.tp(M); UI.openStation(M); UI.gotoTab('orders');
  const header = /AN ERRAND ON THE BOARD/.test(document.getElementById('bookLine').textContent) && /YOUR WORD/.test(document.getElementById('bookLine').textContent);
  const card = [...document.querySelectorAll('#stationBody .orderCard.errand')].some(el => /THE KEEPER'S ERRAND/.test(el.textContent) && !!el.querySelector('[data-accept]'));
  window.__er = { far };
  return { posted, header, card, far };
});
const er1 = r;
if (er1.card) { await page.click('#stationBody .orderCard.errand [data-accept]'); await page.waitForTimeout(300); }
r = await ev(() => {
  const M = 'mill', b = Economy.book(M), o = S.orders.active.find(x => x.errand === M), V = DATA.keeperGrief[M];
  const accepted = !!o && !!o.due && b.credit === 0 && !!S.cargo.find(c => c.sealed) && !!S.flags.tut.firstErrand;
  const ask = !document.getElementById('keeperSay').classList.contains('hidden') && document.getElementById('keeperSay').textContent.toLowerCase().includes(V.errand.replace(/\{town\}/g, DATA.stations[o.to].name).slice(0, 20).toLowerCase());
  UI.renderStation && UI.renderStation(); const out = /THE ERRAND — \d+ h/.test(document.getElementById('bookLine').textContent);
  document.getElementById('stationClose').click(); __hideSay();
  const noSecond = !(Economy.ordersFor(M) || []).some(x => x.errand === M);
  /* walked through inside the word: more than any run, and the far keeper breaks the seal on the slip */
  const ap0 = S.stations[M].appr || 0, lk0 = S.stations[M].likesTo, fa0 = S.stations[o.to].appr || 0;
  WL.tp(o.to); WL.instantPar();
  const res = Systems.handleDelivery(o.to).results.find(x => x.order && x.order.errand === M);
  const kept = !!res && res.errand && res.errand.kept && (S.stations[M].appr || 0) === ap0 + DATA.T.word.errandAppr && S.stations[M].likesTo === lk0 + DATA.T.word.errandLikes && (S.stations[o.to].appr || 0) === fa0 + DATA.T.word.errandDest + res.appr && b.errands === 1 && b.kept === 3;
  UI.queueResults([res], null); const slipT = document.getElementById('scoreRows').textContent;
  const slip = /THE KEEPER'S ERRAND — KEPT/.test(slipT) && /reads it once, and puts it inside their coat/.test(slipT) && (!res.errand.line || slipT.includes(res.errand.line.slice(0, 20)));
  document.getElementById('results').classList.add('hidden');
  const again = !(Economy.ordersFor(M) || []).some(x => x.errand === M);   // no second errand without new credit
  WL.tp(M); UI.openStation(M); UI.gotoTab('ledger'); const book = /THE ERRAND, KEPT/.test(document.getElementById('stationBody').textContent) && /Your word in The Mill's book — 3 kept/.test(document.getElementById('stationBody').textContent); document.getElementById('stationClose').click();
  return { accepted, ask, out, noSecond, kept, slip, again, book };
});
ok('THE BOOK AND THE ERRAND: two kept words at a door buy THE KEEPER\'S ERRAND — a sealed letter for the farthest lit door, the Order\'s service (the terminal header: YOUR WORD, AN ERRAND ON THE BOARD; the board\'s card); a real click accepts it: the seal on the pack, the credit spent, the keeper asks it to your face in their own voice, the lesson, the header THE ERRAND — hours left, no second errand; walked through inside the word it pays more than any run (appreciation and likes at home, appreciation at the far door), the far keeper breaks the seal on the slip and the slip says THE KEEPER\'S ERRAND — KEPT with the home keeper\'s line; no second errand without new credit; the Records tab writes the book out, row by row',
  er1.posted && er1.header && er1.card && Object.values(r).every(Boolean), JSON.stringify(er1) + ' ' + JSON.stringify(r));

/* ================= 4 · BROKEN, SHUT AND OPENED ================= */
r = await ev(() => {
  const M = 'mill', b = Economy.book(M); b.credit = 2;
  const eo = (Economy.ordersFor(M) || []).find(o => o.errand === M); WL.tp(M); Systems.acceptOrder(eo, false); __hideSay();
  const o = S.orders.active.find(x => x.errand === M); o.due = S.time - 1; S.mails.length = 0;
  for (let i = 0; i < 12; i++) Economy.update(0.5);
  const shut = o.errandLate && !!b.shut && Economy.shutAt(M) && b.broken === 1 && S.mails.some(m => m.subj === 'The Mill: the errand, late');
  S.orders.active = S.orders.active.filter(x => x !== o); S.cargo = S.cargo.filter(c => c.cat === 'tool');
  /* a grievance there: the plate shows PROMISES SHUT and offers only the apology; the rail X and no P */
  const it = State.makeItem('parcel'); it.parcel = { id: 7070, to: M, from: 'haven', kind: 'coat', name: 'a mended coat' }; Economy.grieve(it, 'ground');
  document.getElementById('keeperSay').classList.add('hidden'); WL.tp([DATA.stations.haven.x + 520, DATA.stations.haven.y - 700]); Systems.update(0.02, {}); WL.tp(M); Systems.update(0.02, {});
  const el = document.getElementById('keeperSay');
  const plate = !el.classList.contains('hidden') && /PROMISES SHUT/.test(el.textContent) && !el.querySelector('[data-word^="promise:"]') && !!el.querySelector('[data-word^="sorry:"]');
  const ints = Systems.getInteractions(), rail = ints.some(i => i.key === 'X' && /Apologize/.test(i.label)) && !ints.some(i => i.key === 'P' && /Give your word/.test(i.label));
  /* a promise asked anyway is refused in the keeper's own words */
  const refused = Economy.giveWord(7070, 'promise') === false && el.textContent.includes(Economy.keeperWordLine(M, 'shut', Economy.grievancesFor(M)[0]).slice(0, 24));
  UI.openStation(M); const header = /PROMISES SHUT/.test(document.getElementById('bookLine').textContent), board = [...document.querySelectorAll('#stationBody .grievances .ksShut')].some(e => /PROMISES SHUT/.test(e.textContent)); document.getElementById('stationClose').click();
  /* made right without a word, the door opens again */
  S.mails.length = 0; Economy.strikeGrievance({ id: 7070 }, M);
  const opened = !Economy.shutAt(M) && S.mails.some(m => m.subj === 'The Mill opens its door again') && Economy.book(M).log[0].kind === 'opened';
  __hideSay();
  return { shut, plate, rail, refused, header, board, opened };
});
ok('BROKEN, SHUT AND OPENED: the keeper\'s errand run late breaks the word and SHUTS the door to promises (the book, the mail); a grievance there brings the plate with PROMISES SHUT and only the apology on it, the rail X and no P; a promise asked anyway is refused in the keeper\'s own words; the terminal header and the board say PROMISES SHUT; a grievance there made right without a word opens the door again (the mail, the book)',
  Object.values(r).every(Boolean), JSON.stringify(r));

/* ================= 5 · THE KIN'S ERRAND ================= */
r = await ev(() => {
  const G = 'green', st = S.stations[G];
  S.rep.held[G] = { t0: S.time, from: G, tithe: 0, shields: 2, riseDay: -1 }; st.likesTo = 45;
  const a = Republic.recruitOwn(G), b = Republic.recruitOwn(G); NPC.setOrder(a, 'hours', 'full'); NPC.setOrder(b, 'hours', 'full');
  S.kinErrands = []; S.mails.length = 0; __at(0.75);
  __die(0.2, () => Republic.squareRises(G));
  delete S.rep.unlit[G]; st.connected = true; st.litT = 1; State.refreshSources(); __at(0.3);
  const E = S.kinErrands, sh = E.find(e => e.kind === 'shield'), la = E.find(e => e.kind === 'lantern');
  const drops = S.drops.filter(d => d.item && d.item.kin);
  const asked = E.length === 2 && !!sh && !!la && drops.length === 2 && S.mails.filter(m => /, at THE FIELD STONES$/.test(m.subj)).length === 2 && !!S.flags.tut.firstKinErrand;
  WL.tp([DATA.stations[G].x + 400, DATA.stations[G].y + 300]); for (let i = 0; i < 40; i++) UI.tick();
  const compass = [...document.querySelectorAll('#compassInner .cMark')].filter(m => /the kin asks/.test(m.title)).length === 1;
  /* the shield carried home to the stones and given there */
  for (const d of drops) { State.addCargo(d.item); S.drops.splice(S.drops.indexOf(d), 1); }
  const ms = Memorial.site('town'); Memorial.raise('town'); Memorial.raise('town');
  WL.tp([ms.x, ms.y + 40]); const lk0 = st.likesTo, ap0 = st.appr || 0;
  const g1 = Systems.getInteractions().find(i => i.key === 'G' && /shield/.test(i.label)); if (g1) g1.fn();
  const row = S.legacy.find(x => x.fact === 'town' && x.name === sh.fallen);
  const home = !!g1 && sh.state === 'done' && row.home === true && st.likesTo === lk0 + DATA.T.kin.likes && (st.appr || 0) === ap0 + DATA.T.kin.appr && S.mails.some(m => /the shield is home/.test(m.subj));
  /* the lantern: cold at the stone — the guide sends it to the nearest lit waylight */
  const g2 = Systems.getInteractions().find(i => i.key === 'G' && /DARK/.test(i.label));
  Guide.tick(0.3); const gs = Guide.current(), guide = !!gs && /is cold — take a flame at/.test(gs.head);
  const lt = S.cargo.find(c => c.kin === la.id);
  UI.updateHUD(); const cold = /A COLD LANTERN/.test(document.getElementById('buffs').textContent);
  /* the flame at a lit waylight: the rail's L */
  WL.tp('haven'); const L = Systems.getInteractions().find(i => i.key === 'L'); if (L) L.fn();
  const lit = !!L && lt.lit === true; UI.updateHUD(); const hud = /A FLAME · 15:00|A FLAME · 14:5\d/.test(document.getElementById('buffs').textContent);
  window.__kn = { la: la.id, lt: lt.id };
  return { asked, compass, home, g2: !!g2, guide, cold, lit, hud };
});
const kn1 = r;
/* the flame on the pack's back, with its own glow in the night (against the same frame with the lantern cold) */
await drain();
const flame = await ev(async () => {
  const H = DATA.stations.haven, lt = S.cargo.find(c => c.id === __kn.lt); __at(0.85);
  WL.tp([H.x + 1300, H.y - 900]); Render.faceWalker('E'); S.weather.state = 'clear'; __clearAmb(S.px, S.py, 300); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 30;
  await __wait(300); await __frames(3);
  const w = Render.walkerDrawn(), at = Render.walkerAt(6, 18), a = __grab(at.x, at.y, 34);
  lt.lit = false; await __wait(150); await __frames(3); const b = __grab(at.x, at.y, 34); lt.lit = true; lt.litT = S.time;
  __done(); WL.timeScale = 0.001; __at(0.3);
  return { glow: __diff(a, b), frame: w.frame };
});
r = await ev(() => {
  const la = S.kinErrands.find(e => e.id === __kn.la), lt = S.cargo.find(c => c.id === __kn.lt), K = DATA.T.kin;
  /* the burn: a quarter of an hour on the clock, and it goes out */
  lt.litT = S.time - K.burn - 1; Republic.tick(0.02); const burned = lt.lit === false;
  lt.lit = true; lt.litT = S.time;
  /* set lit at the stone: the row LIT, the kin write; the card carries both marks */
  const ms = Memorial.site('town'); WL.tp([ms.x, ms.y + 40]);
  const g = Systems.getInteractions().find(i => i.key === 'G' && /lantern.*lit/i.test(i.label)); if (g) g.fn();
  const row = S.legacy.find(x => x.fact === 'town' && x.name === la.fallen);
  const set = !!g && la.state === 'done' && row.lit === true && S.mails.some(m => /the lantern is lit/.test(m.subj));
  Memorial.open('town'); const cards = [...document.querySelectorAll('#memBody .memCard')];
  const card = cards.some(e => /the shield brought home/.test(e.textContent)) && cards.some(e => e.querySelector('.memKin img') && /lantern|lit/i.test(e.querySelector('.memKin').textContent) && e.textContent.includes(la.fallen)); Memorial.close();
  /* an errand left its three days goes home with the kin */
  const e3 = { id: 'kinX', town: 'green', fallen: 'Ansel Test', kin: 'Wenna Test', kind: 'shield', t: S.time - K.errandDays * DATA.T.dayLen - 1, state: 'open' };
  S.kinErrands.push(e3); const it = State.makeItem('kinShield'); it.kin = 'kinX'; S.drops.push({ id: U.uid(), item: it, x: 0, y: 0 }); S.mails.length = 0;
  Republic.tick(0.02);
  const expiry = e3.state === 'gone' && !S.drops.some(d => d.item === it) && S.mails.some(m => m.subj === 'Wenna Test went home');
  WL.tp('haven');
  return { burned, set, card, expiry };
});
ok('THE KIN\'S ERRAND: the town\'s own fell and each left a thing in the square — a round shield and a lantern gone cold — and the kin write (two mails, "… at THE FIELD STONES", the lesson); the compass marks the square\'s worth as one mark; the shield carried to the stones and given there marks the row HOME, warms the town (+4 likes, +6 appreciation), the kin write again; the lantern is cold at the stone (the rail says so, A COLD LANTERN on the HUD) and the guide sends it to the nearest lit waylight, where the rail\'s L gives it the flame (A FLAME · 15:00); lit, it hangs on the pack\'s back with its own glow in the night (pixel-sampled against the same frame with it cold); it burns out on the clock; set lit at the stone the row is LIT and the kin write; the card carries both marks; an errand left its three days goes home with the kin',
  Object.values(kn1).every(Boolean) && flame.glow > 20 && Object.values(r).every(Boolean), JSON.stringify(kn1) + ' flame=' + JSON.stringify(flame) + ' ' + JSON.stringify(r));

/* ================= 6 · THE GRUDGE ANSWERED ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  for (const cd of DATA.camps) { const x = S.camps[cd.id]; x.taken = null; x.pacified = false; x.storm = null; x.chiefLost = 0; x.chiefReturn = null; x.pact = null; x.truce = 0; }
  S.fireWordBroken = 0; S.stand = null;
  c.chiefGen = 1; c.grudge = { t: S.time, said: true, fired: Math.floor(S.time / DATA.T.dayLen) };
  WL.tp([ash.x - 30, ash.y + 60]); __hideSay();
  const near = Republic.parleyNear() === ash;
  const p = Systems.getInteractions().find(i => i.key === 'P'); if (p) p.fn();
  const el = document.getElementById('keeperSay');
  const plate = !!p && !el.classList.contains('hidden') && el.classList.contains('parley') && el.querySelector('img').getAttribute('src') === Render.chiefFaceURL('chief2', 4) && !!el.querySelector('img.ksWalker') && ['gift', 'stand', 'word'].every(k => !!el.querySelector(`[data-parley="${k}:ash"]`));
  window.__pb = { metal: S.banked.metal, provisions: S.banked.provisions };
  return { near, plate };
});
const pa1 = r;
if (pa1.plate) { await page.click('#keeperSay [data-parley="gift:ash"]'); await page.waitForTimeout(250); }
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, P = DATA.T.parley;
  const gift = !c.grudge && S.banked.metal === __pb.metal - P.gift.metal && S.banked.provisions === __pb.provisions - P.gift.provisions && S.mails.some(m => m.subj === 'Ash Camp: the gift taken') && !!S.flags.tut.firstParley;
  /* the stand: fifteen seconds at his fire, his runners ring you at arm's length and do not cut */
  c.grudge = { t: S.time, said: true, fired: Math.floor(S.time / DATA.T.dayLen) }; c.runners = [];
  S.cargo.push(State.makeItem('metal')); S.health = 100; S.warmth = 100; S.food = 100; S.arrow = null; S.bleeding = false; S.state = 'walk'; WL.tp([ash.x - 30, ash.y + 60]);   // v3.51: warm and fed — seventeen seconds at a northern fire must not cost a point of health to the cold, or the stand reads as cut; v3.52: and no bolt left in from the walks before (a bowman's arrow seeps — the stand had read as cut when one was lodged)
  Republic.parley('ash', 'stand'); Systems.update(0.02, {});
  const ringed = []; for (let i = 0; i < 30; i++) { Systems.update(0.25, {}); }
  const around = c.runners.length > 0 && c.runners.every(k => { const d = U.dist(k.x, k.y, S.px, S.py); return k.watch && d > 45 && d < 95; });
  UI.updateHUD(); const hudStand = /STANDING AT HIS FIRE · \d+ s/.test(document.getElementById('buffs').textContent);
  for (let i = 0; i < 40 && S.stand; i++) Systems.update(0.25, {});
  const stood = !S.stand && !c.grudge && Republic.truceAt(ash) && S.health === 100 && S.mails.some(m => m.subj === 'Ash Camp: you stood at his fire');
  window.__standWhy = { stand: !!S.stand, grudge: !!c.grudge, truce: !!Republic.truceAt(ash), hp: S.health, warm: Math.round(S.warmth), food: Math.round(S.food), arrow: !!S.arrow, bleeding: !!S.bleeding, mail: S.mails.some(m => m.subj === 'Ash Camp: you stood at his fire') };   // v3.52: why, when it does not hold
  /* loaded inside his ring at truce, his runners let you walk */
  const r0 = { x: S.px + 150, y: S.py, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }; c.runners = [r0]; const d0 = U.dist(r0.x, r0.y, S.px, S.py);
  Systems.update(0.3, {}); const letWalk = U.dist(r0.x, r0.y, S.px, S.py) >= d0 - 1 && S.health === 100;
  /* walked away from: his storm comes tonight, the mail says you walked */
  c.truce = 0; c.grudge = { t: S.time, said: true, fired: Math.floor(S.time / DATA.T.dayLen) }; c.runners = [];
  Republic.parley('ash', 'stand'); WL.tp([ash.x - 30 + 400, ash.y + 60]); Republic.tick(0.02);
  const walked = !S.stand && !!c.grudge && c.grudge.fired === -1 && S.mails.some(m => m.subj === 'Ash Camp: you walked from his fire');
  /* the word: his fire held from the column three days — a column sent against it breaks it at every fire */
  WL.tp([ash.x - 30, ash.y + 60]);
  const word = Republic.parley('ash', 'word') && Republic.pactAt(ash) && !c.grudge;
  S.rep.mountain.phase = 'open'; S.rep.quell = null; S.rep.reprisal = null;
  Republic.fundTake('ash');
  const broken = !Republic.pactAt(ash) && !!S.fireWordBroken && !!Republic.reprisal() && S.mails.some(m => m.subj === 'Your word at the fires, broken');
  S.rep.quell = null;
  const ridge = DATA.camps.find(x => x.id === 'ridge'); S.camps.ridge.grudge = { t: S.time, said: true, fired: 0 }; S.camps.ridge.chiefGen = 1;
  const after = Republic.parley('ridge', 'word') === false && !Republic.pactAt(ridge);
  S.camps.ridge.grudge = null; S.cargo = S.cargo.filter(x => x.cat === 'tool'); c.runners = []; __hideSay(); WL.tp('haven');
  return { gift, around, hudStand, stood, letWalk, walked, word, broken, after, ...(stood ? {} : { why: __standWhy }) };
});
ok('THE GRUDGE ANSWERED: at the new chief\'s fire the rail prints P and the parley plate carries his face (the new man\'s), the Walker\'s and three answers; a real click on THE GIFT pays from the bank and cools the grudge (the mail, the lesson); THE STAND — his runners come in and ring the Walker at arm\'s length without cutting (STANDING AT HIS FIRE on the HUD), stood out the grudge cools and a truce holds: loaded inside his ring his runners let you walk; walked away from, his storm comes tonight and the mail says you walked; THE WORD holds his fire from the column — a column sent against it breaks it at every fire (a season of reprisal) and no fire takes your word after',
  pa1.near && pa1.plate && Object.values(r).every(Boolean), JSON.stringify(pa1) + ' ' + JSON.stringify(r));

/* ================= 7 · THE WALKER'S SCORE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), ridge = DATA.camps.find(c => c.id === 'ridge');
  for (const cd of DATA.camps) { const x = S.camps[cd.id]; x.taken = null; x.pacified = false; x.pact = null; x.truce = 0; x.grudge = null; }
  S.scores = {}; S.fireWordBroken = 0;
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && !x.lent); NPC.hire(n, 'companion');
  /* a camp's knife fells one of the party: the companion takes the blow that would drop you */
  WL.tp([ash.x + 300, ash.y + 400]); S.hitBy = { camp: 'ash', t: S.time }; S.mails.length = 0; S.health = 5;
  Porter.damage(20, 'scrappers', { bruise: true });
  const sc = Republic.scores().ash, set = !!sc && sc.npc === n.id && n.state === 'recover' && S.mails.some(m => m.subj === 'Your score with Ash Camp') && !!S.flags.tut.firstScore;
  MusterUI.open(n.id); const roll = /FELLED BY ASH CAMP'S KNIVES — YOUR SCORE/.test(document.getElementById('musterBody').textContent); MusterUI.close();
  /* walking again, they carry it — and meet that camp's runners from farther (not another camp's) */
  n.state = 'companion'; n.recoverT = 0; n.shoveCd = 0; n.hungry = false; n.cx = S.px; n.cy = S.py;
  const mood = NPC.mood(n).causes.some(c => c.id === 'score');
  const knife = () => ({ x: n.cx + 170, y: n.cy, cd: 0, cls: 'knife' });
  const kA = knife(), hitA = NPC.intercept(kA, 'ash'); n.shoveCd = 0; const kR = knife(), hitR = NPC.intercept(kR, 'ridge');
  const reach = hitA && !hitR;
  /* the sheet's mark under the camp */
  const markA = __sheetMark(ash, 'score', 5, 6);
  /* paid by the take (v3.46: paid is not yet settled — walked to the ring it is settled), and a score unpaid cools in three days */
  Republic.scorePaid(ash, 'taken'); const paid = Republic.scores().ash && Republic.scores().ash.paid === 'taken';
  delete S.scores.ash;
  Republic.scoreSet('ridge', n); S.scores.ridge.t = S.time - DATA.T.score.days * DATA.T.dayLen - 1; S.mails.length = 0; Republic.tick(0.02);
  const cooled = !Republic.scores().ridge && S.mails.some(m => m.subj === 'The score with Ridge Camp cools');
  WL.tp('haven'); S.health = 100;
  return { set, roll, mood, reach, markA, paid, cooled };
});
ok('THE WALKER\'S SCORE: a camp\'s knife fells one of the party — the companion takes the blow that would drop you — and the score is set against that camp (the mail, the lesson); the roll marks the one who went down FELLED BY ASH CAMP\'S KNIVES — YOUR SCORE; walking again they carry a score to settle in their mood and meet Ash\'s runners from farther, not Ridge\'s; the survey sheet draws the score\'s mark under the camp (read off the sheet texel for texel); the take pays it (v3.46: paid, not yet settled — settled when walked to the ring); a score unpaid three days cools',
  r.set && r.roll && r.mood && r.reach && r.markA >= 0.95 && r.paid && r.cooled, JSON.stringify(r));

/* ================= 8 · THE LINE AT THE RING ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash');
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  const pool = S.npcs.filter(x => x.state === 'pool' && x.at === 'haven' && !x.lent).slice(0, 3); for (const x of pool) NPC.hire(x, 'companion');
  S.cargo = S.cargo.filter(x => x.cat === 'tool'); S.ringHold = null;
  WL.tp([ash.x + 200, ash.y + 1600]);
  UI.toggleMap(true); UI.ringWalk('ash'); UI.toggleMap(false);
  const m = S.moveTo; for (let i = 0; i < 60; i++) UI.tick();
  const compass = [...document.querySelectorAll('#compassInner .cMark.ring')].some(e => /^THE RING/.test(e.title) && !!e.querySelector('img.cPin'));
  WL.tp([m.x + 3, m.y + 3]); for (const x of NPC.party()) { x.cx = S.px + 20; x.cy = S.py + 20; }
  Systems.update(0.05, {});
  const h = S.ringHold, holds = !!h && h.camp === 'ash' && !!S.flags.tut.firstLine;
  for (let i = 0; i < 60; i++) Systems.update(0.1, {});
  const pt = NPC.party(), ux = ash.x - h.x, uy = ash.y - h.y, ul = Math.hypot(ux, uy), px2 = -uy / ul, py2 = ux / ul;
  const offs = pt.map(x => (x.cx - h.x) * px2 + (x.cy - h.y) * py2).sort((a, b) => a - b);
  const slots = pt.length === 3 && offs.every((v, i) => i === 0 || Math.abs(v - offs[i - 1] - DATA.T.ring.gap) < 12 || Math.abs(v - offs[i - 1] - 2 * DATA.T.ring.gap) < 12);
  const facing = pt.every(x => Math.abs(Math.atan2(Math.sin(x.holdDir - Math.atan2(uy, ux)), Math.cos(x.holdDir - Math.atan2(uy, ux)))) < 0.01);
  for (let i = 0; i < 60; i++) UI.tick();
  const compass2 = [...document.querySelectorAll('#compassInner .cMark')].some(e => /^THE RING · ASH/.test(e.title));
  window.__line = { x: h.x, y: h.y };
  return { compass, holds, slots, offs: offs.map(v => Math.round(v)), facing, compass2 };
});
const ln1 = r;
await drain();
const lineSeen = await ev(async () => {
  const ash = DATA.camps.find(c => c.id === 'ash'), h = S.ringHold; if (!h) return { none: true };
  const ux = ash.x - h.x, uy = ash.y - h.y, ul = Math.hypot(ux, uy), bx = h.x - ux / ul * 26, by = h.y - uy / ul * 26;
  __at(0.3); S.weather.state = 'clear'; __clearAmb(h.x, h.y, 300); S.camps.ash.runners = []; Render.clearFx(); Render.setFx(false); Render.setZoom(2); Render.cam.x = h.x; Render.cam.y = h.y; WL.timeScale = 0.001;
  await __wait(300); await __frames(3);
  const red = __hex('#c9553a'), pinOn = __near(bx, by - 6, red, 14, 24);
  const labels = Render.labelBoxes(), line = labels.some(b => b.str === 'THE LINE HOLDS AT ASH CAMP\'S RING');
  const names = NPC.party().every(x => labels.some(b => b.str.toUpperCase().includes(x.name.split(' ')[0].toUpperCase())));
  let overlap = 0; for (let i = 0; i < labels.length; i++) for (let j = i + 1; j < labels.length; j++) { const a = labels[i], b = labels[j]; if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) overlap++; }
  const hh = S.ringHold; S.ringHold = null; await __wait(120); await __frames(3); const pinOff = __near(bx, by - 6, red, 14, 24); S.ringHold = hh;
  __done(); WL.timeScale = 0.001;
  return { pinOn, pinOff, line, names, overlap, n: labels.length };
});
r = await ev(() => {
  /* walked away from, the line lifts; held past two minutes it lifts; a new walk lifts it */
  const h = S.ringHold; WL.tp([h.x + DATA.T.ring.holdR + 20, h.y]); Systems.update(0.02, {}); const walked = !S.ringHold;
  S.ringHold = { ...h, t: S.time - DATA.T.ring.holdMax - 1 }; WL.tp([h.x + 10, h.y]); Systems.update(0.02, {}); const timed = !S.ringHold;
  S.ringHold = { ...h, t: S.time }; Systems.moveTo(h.x - 800, h.y + 900); const newWalk = !S.ringHold; S.moveTo = null;
  WL.tp('haven');
  return { walked, timed, newWalk };
});
ok('THE LINE AT THE RING: a walk planned to a ring puts THE RING on the compass with its pin; arriving, the line holds (the lesson) — the backs abreast on slots a stride apart across the camp\'s bearing, each turned to the camp; the compass reads THE RING · ASH; seen: the pin planted where it holds (pixel-sampled against the same frame with the line lifted), THE LINE HOLDS AT ASH CAMP\'S RING on the ground, every back\'s name drawn and no two labels overlapping; walked away from, or held past two minutes, or a new walk planned, the line lifts',
  ln1.compass && ln1.holds && ln1.slots && ln1.facing && ln1.compass2 && lineSeen.pinOn > lineSeen.pinOff + 10 && lineSeen.line && lineSeen.names && lineSeen.overlap === 0 && Object.values(r).every(Boolean), JSON.stringify(ln1) + ' seen=' + JSON.stringify(lineSeen) + ' ' + JSON.stringify(r));

/* ================= 9 · THE SAVE ================= */
r = await ev(() => {
  const M = 'mill', b = Economy.book(M); b.credit = 1; b.shut = 0;
  S.kinErrands.push({ id: 'kinS', town: 'green', fallen: 'Colm Save', kin: 'Brisa Save', kind: 'lantern', t: S.time, state: 'open' });
  S.camps.ash.truce = S.time; S.camps.ridge.pact = { t: S.time };
  S.scores = { pass: { t: S.time, npc: 1, name: 'A B', why: 'felled' } };
  State.save(); State.load();
  const book = Economy.book(M).kept === 3 && Economy.book(M).credit === 1 && Economy.book(M).log.length > 0;
  const kin = (S.kinErrands || []).some(e => e.id === 'kinS' && e.state === 'open');
  const parley = Republic.truceAt(DATA.camps.find(c => c.id === 'ash')) && Republic.pactAt(DATA.camps.find(c => c.id === 'ridge'));
  const score = !!Republic.scores().pass;
  S.scores = {};
  return { book, kin, parley, score };
});
ok('THE SAVE: a town\'s book (kept, credit, the log), an open kin\'s errand, a truce and a word at the fires, and the Walker\'s score survive a save and load',
  Object.values(r).every(Boolean), JSON.stringify(r));

/* ================= 10 · THE LAMP LAW AND THE CROWDED STRIP ================= */
const lamp = await ev(async () => {
  const H = DATA.stations.haven; for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  S.cargo = S.cargo.filter(x => x.cat === 'tool'); __at(0.85);
  WL.tp([H.x + 1300, H.y - 900]); Render.faceWalker('S'); S.weather.state = 'clear'; __clearAmb(S.px, S.py, 300); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 30; WL.timeScale = 0.001;
  await __wait(300); await __frames(4);
  /* the coat keeps its navy at the chest: every coat texel there is its own colour, darkened by the night — never a pale wash */
  const w = Render.walkerDrawn(), fc = w.fc === 'W' ? 'E' : w.fc, rows = SPRITES.COURIER.frames[fc][w.frame], d = Render.courierPal(Render.wornPal());
  let n = 0, pale = 0, warm = 0;
  for (let y = 16; y < 24; y++) for (let x = 11; x < 21; x++) { const ch = rows[y][x]; if (ch !== 'C' && ch !== 'D' && ch !== 'L') continue; const p = Render.walkerAt(x, y), px = __hex(__px(p.x, p.y)), c0 = __hex(d[ch]); n++; if (px[0] + px[1] + px[2] > c0[0] + c0[1] + c0[2] + 90) pale++; }
  /* the corona lies behind the Walker at the glass in hand: bright round it */
  const hd = w.hand, gp = Render.walkerAt(hd[0], hd[1] + 3), corona = __count(__grab(gp.x, gp.y, 26), __hex('#ffd98f'), 60);
  __done(); WL.timeScale = 0.001; __at(0.3);
  return { n, pale, corona };
});
const strip = await ev(() => {
  WL.tp([DATA.stations.haven.x + 600, DATA.stations.haven.y - 600]); S.dir = 0;
  S.orders.active = []; S.drops = S.drops.filter(x => !x.test);
  /* two crates you signed for, lying on one bearing; a stray on the same bearing; a back walking ahead on it */
  const mk = (dx, dy, signed) => { const it = State.makeItem('metal'); const dr = { id: U.uid(), item: it, x: S.px + dx, y: S.py + dy, test: true }; S.drops.push(dr); return it; };
  const a = mk(900, 0), b = mk(930, 6), c = mk(960, -4);
  S.orders.active.push({ id: 'tst', idNum: 99991, to: 'foundry', from: 'haven', items: [a.id, b.id], item: 'metal', n: 2, t0: S.time, par: 999 });
  for (let i = 0; i < 90; i++) UI.tick();
  const marks = [...document.querySelectorAll('#compassInner .cMark')].filter(e => /^crate|^dropped/.test(e.title));
  const crates = marks.filter(e => /^crate/.test(e.title)), bare = crates.filter(e => e.classList.contains('bare'));
  const measured = crates.length === 2 && bare.length === 1 && bare[0].textContent.trim() === '' && /^crate /.test(bare[0].title);   // its pin kept bare at its bearing, its words on the hover
  const yields = !marks.some(e => /^dropped/.test(e.title));   // an ordinary mark on a placed pin yields
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven' && !x.lent); NPC.hire(n, 'companion'); n.cx = S.px + 300; n.cy = S.py + 2;
  for (let i = 0; i < 30; i++) UI.tick();
  const pip = [...document.querySelectorAll('#compassInner .cBack.fore')].find(e => e.dataset.npc === String(n.id));
  const hush = !!pip && pip.textContent === '';   // a back ahead never writes its name over a mark's words
  S.orders.active = []; S.drops = S.drops.filter(x => !x.test); n.state = 'pool'; n.at = 'haven';
  return { measured, yields, hush };
});
ok('THE LAMP LAW AND THE CROWDED STRIP: at night the lamp lights what is round it, never its holder\'s own texels — the coat keeps its navy at the chest (no coat texel washed pale) while the corona burns behind the Walker at the glass in hand (pixel-sampled); the compass measures its words — of two marks on one bearing the second keeps its pin bare and gives its words to the hover, a stray mark whose pin would land on a placed pin yields, and a back walking ahead on that bearing never writes its name over a mark\'s words',
  lamp.n > 10 && lamp.pale === 0 && lamp.corona > 10 && strip.measured && strip.yields && strip.hush, JSON.stringify({ lamp, strip }));

/* ================= 11 · THE KEEPSAKE IN THE BOOK ================= */
r = await ev(() => {
  const cls = ['kinShield', 'kinLantern', 'keepsake'].map(id => Ledger.classify(id));
  const tree = JSON.stringify(Ledger.TAXO), filed = cls.every(c => c === 'keepsakes') && /curios/i.test(tree) && /Keepsakes/.test(tree);
  /* the dossier never puts one in a locker: store marked on the whole tree, a keepsake stays on the pack while metal goes */
  const L = Ledger.led(); const d0 = { ...L.dossier }; L.dossier.store = true; L.dossier.deliver = false; L.dossier.scrap = false; L.dossier.pickup = false; L.dossier.donate = false;
  const ks = State.makeItem('keepsake'); ks.name = 'Halvard\'s tin whistle'; ks.keepsake = { town: 'mill', fallen: 'Halvard Penrose', kin: 'Wenna Penrose', thing: 'whistle' };
  const met = State.makeItem('metal'); S.cargo.push(ks, met);
  Ledger.setMark('keepsakes', 'store', true); Ledger.setMark(Ledger.classify('metal'), 'store', true);
  const st = S.stations.mill, s0 = st.storage.length; Ledger.runDossier('mill');
  const locker = S.cargo.includes(ks) && !st.storage.includes(ks) && st.storage.includes(met) && Ledger.DEFAULTS.store === false;
  Object.assign(L.dossier, d0); S.cargo = S.cargo.filter(x => x !== ks); st.storage = st.storage.filter(x => x !== met);
  /* Cargo Rules (v3.49's plain name for the ledgers) shows the kind in its tree */
  LedgerUI.open && LedgerUI.open(); LedgerUI.render(); const ui = /Keepsakes/.test(document.body.textContent); LedgerUI.close();
  return { cls, filed, locker, ui, defaults: JSON.stringify(Ledger.DEFAULTS) };
});
ok('THE KEEPSAKE IN THE BOOK: the kin\'s things — the fallen\'s shield, their lantern, the keepsake — file under Curios › Keepsakes in the ledger\'s tree (Cargo Rules, v3.49\'s plain name, shows it), and the dossier never puts one in a locker: with the store marked on the whole tree the keepsake stays on the pack while the metal goes',
  r.filed && r.locker && r.ui, JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
await T.finish('the word kept');
