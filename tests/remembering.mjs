/* remembering.mjs — v3.42 THE REMEMBERING (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). What it proves: the survey sheet draws a live camp's roll as hand-drawn
   marks under its fire (read off the sheet texel for texel: the chief's fire lit gold, the rag gone to a stake once he is
   mourned, the Society's tongue on a counted camp); a chief who goes down in the open is GONE for the mourning span — the
   rag on a stake, the road one knife short, the next storm without him, the leaderless fire courting the Unlit at the
   nearest lit door, SHORT A CHIEF on the sheet — and comes back when it has passed; the town's own are people on the roll
   (AT THE SQUARES, THE HOURS their one row, the cover by the hour, their own square in their mood, a period's love and
   thanks and drum); THE GRIEVANCE — a parcel off the pack raises the door it was addressed to (deepened in a camp, given up,
   made right on the run and as lost cargo, remembered at two days on the board); THE BOLT stays in (the wind at half pace,
   the seep, pulled by a medic beside you, a lit town's hands or your own); the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const drain = async () => { await ev(() => { WL.timeScale = 1; }); await T.drain(); await ev(() => { WL.timeScale = 0.001; }); };
await ev(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry', 'foundry']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources();
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  window.__titles = []; const ct = Render.crtTitle; Render.crtTitle = (a, b) => { __titles.push(a + ' — ' + b); return ct(a, b); };
  window.__die = (v, fn) => { const r0 = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = r0; } };
  window.__at = f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; };
  /* the survey sheet read texel for texel: every mark of a camp's row, laid out as the sheet lays them, 3 px a texel */
  window.__sheetMarks = (cd, want) => {
    UI.toggleMap(true); UI.drawMap();
    const c = document.getElementById('map'), g = c.getContext('2d'), r0 = c.getBoundingClientRect(), sc = c.width / r0.width, m = UI.mapPoint(cd.x, cd.y);
    const cx0 = (m.x - r0.left) * sc, cy0 = (m.y - r0.top) * sc, mk = 3, gap = 4, wAll = want.length * (7 * mk + gap) - gap;
    let mx = cx0 - wAll / 2; const my = cy0 + 14, out = {};
    for (const k of want) {
      const rows = SPRITES.MARKS[k]; let n = 0, hit = 0;
      for (let j = 0; j < 7; j++) for (let i = 0; i < 7; i++) { const ch = rows[j][i]; if (ch === '.') continue; n++; const d = g.getImageData(Math.floor(mx + (i + 0.5) * mk), Math.floor(my + (j + 0.5) * mk), 1, 1).data, want2 = __hex(SPRITES.MARK_PAL[ch]); if (Math.abs(d[0] - want2[0]) + Math.abs(d[1] - want2[1]) + Math.abs(d[2] - want2[2]) < 12) hit++; }
      out[k] = +(hit / n).toFixed(2); mx += 7 * mk + gap;
    }
    UI.toggleMap(false);
    return out;
  };
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const inPal = (rows, pal, w, h) => rows.length === h && rows.every(rw => rw.length === w) && [...new Set(rows.join('').replace(/\./g, ''))].every(ch => pal[ch]);
  const SEVEN = ['knife', 'bowman', 'ram', 'chief', 'fire', 'tongue', 'gone'];
  const marks = SEVEN.every(k => inPal(SPRITES.MARKS[k], SPRITES.MARK_PAL, 7, 7)) && new Set(SEVEN.map(k => SPRITES.MARKS[k].join(''))).size === 7 && SPRITES.MARKS.fire.join('').includes('F') && SPRITES.MARKS.gone.join('').includes('R') && SPRITES.MARKS.gone.join('').includes('Y');
  const stake = inPal(SPRITES.RAGSTAKE, SPRITES.RAGSTAKE_PAL, 7, 13) && SPRITES.RAGSTAKE.join('').includes('R');
  const bolt = inPal(SPRITES.ARROW_IN, SPRITES.ARROW_PAL, 5, 5);
  const plain = Render.cargoGlyph({ defId: 'parcel', kg: 4, cat: 'goods' }), torn = Render.cargoGlyph({ defId: 'parcel', kg: 4, cat: 'goods', grieved: true });
  const tornOk = !!torn && torn.rows.join('') !== plain.rows.join('') && inPal(torn.rows, torn.pal, torn.rows[0].length, torn.rows.length);
  const ic = h => (h.match(/src="([^"]+)"/) || [])[1], icons = ic(UI.iconTag({ defId: 'parcel', cat: 'goods', grieved: true })) !== ic(UI.iconTag({ defId: 'parcel', cat: 'goods' }));
  const G = DATA.T.grievance, A = DATA.T.arrow;
  const rows = G.ground === 4 && G.camp === 4 && G.given === 6 && G.made === 8 && G.fadeDays === 2 && G.memory === 3 && A.seep === 0.12 && A.stamMul === 0.5 && A.medicR === 90 && A.medicTime === 2.5 && A.pullSelf === 4 && A.pullTime === 2.4
    && REP.WATCHPOST.storm.seen.mourn === 1 && REP.EVENTS.campCourting.needs === 'chieflessCamp' && REP.EVENTS.campCourting.night && REP.EVENTS.campCourting.chance === 0.5 && REP.EVENTS.campCourting.actor === 'rebels'
    && MUSTER.SQUARE.rows.join() === 'hours' && ['full', 'days', 'nights'].every(k => REP.DOCTRINE.storm.rise.hoursFx[k].line) && REP.DOCTRINE.storm.rise.hoursFx.full.cover === 'all';
  const MC = MUSTER.MOOD.causes, causes = MC.ownSquare.v === 2 && MC.ownClock.v === -2, causesN = Object.keys(MC).length;
  const lessons = ['firstGrievance', 'firstArrow', 'firstMourning', 'firstSquareRoll'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]), lessonsN = Object.keys(DATA.tutorials).length;
  return { marks, stake, bolt, tornOk, icons, rows, causes, causesN, lessons, lessonsN };
});
ok('THE REGISTRIES: seven 7×7 marks for the survey sheet in one palette (the knife\'s blade, the bowman\'s bow, the ram\'s plank door, the chief\'s red rag, the chief\'s fire in gold, the Society\'s tongue, the rag gone to a stake), all distinct; the red rag on a stake (7×13); the bolt in the shoulder (5×5); the torn parcel on the pack and on paper, its own glyph and icon; the grievance row (4 on the road, 4 more in a camp, 6 given up, +8 made right, two days to memory at 3 likes) and the bolt\'s (the seep, the wind at half, the medic\'s reach and breath, your own hand\'s price and time); the mourning span, the courting row, THE HOURS the square\'s one row in its own words; two mood causes (v3.49: 31 in all); four lessons (v3.49: the manual at 93 pages)',
  Object.entries(r).every(([k, v]) => k === 'causesN' ? v === 31 : k === 'lessonsN' ? v >= 93 : v === true), JSON.stringify(r));

/* ================= 2 · THE SURVEY READ BY ITS PIXELS ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), ridge = DATA.camps.find(c => c.id === 'ridge');
  for (const cd of DATA.camps) { const c = S.camps[cd.id]; c.taken = null; c.pacified = false; c.swept = 0; c.sold = 0; c.chiefLost = 0; c.chiefReturn = null; }
  WL.tp([ash.x - 200, ash.y + 900]);
  const live = __sheetMarks(ash, ['chief', 'bowman', 'ram', 'knife', 'fire']);
  Republic.chiefFalls(ash, 'shield');
  const mourned = __sheetMarks(ash, ['gone', 'bowman', 'ram', 'knife']);
  S.camps.ash.chiefLost = 0;
  S.camps.ridge.swept = S.time; WL.tp([ridge.x + 200, ridge.y + 900]);
  const counted = __sheetMarks(ridge, ['bowman', 'ram', 'knife', 'tongue']);
  S.camps.ridge.swept = 0;
  return { live, mourned, counted };
});
ok('THE SURVEY READ BY ITS PIXELS: under Ash Camp\'s fire the sheet draws its roll as marks, screen-constant at three pixels a texel — every texel of the chief\'s rag, the bowman\'s bow, the ram\'s plank door, the knife\'s blade and the chief\'s fire in gold read off the sheet in its own colour; the chief fallen, the fire goes out and the rag stands on its stake\'s wood; a counted Ridge wears the Society\'s tongue after its roll',
  Object.values(r).every(o => Object.values(o).every(v => v >= 0.95)), JSON.stringify(r));

/* ================= 3 · A CHIEF WHO REMEMBERS ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  c.runners = []; S.mails.length = 0; WL.tp('haven');
  Republic.chiefFalls(ash, 'shield');
  const fall = Republic.chiefGone(ash) && !Republic.chiefUp(ash) && S.mails.some(m => m.subj === 'Ash Camp: the chief did not get up') && !!S.flags.tut.firstMourning;
  /* the road walks one knife short */
  Systems.update(0.01, {});
  const short = c.runners.length === ash.runners - 1 && !c.runners.some(k => k.cls === 'chief');
  /* the next storm comes without him (his post's storm, from his own roll) */
  c.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 2, stormDay: -1 }; c.pacified = true; c.runners = [];
  WL.tp([ash.x + 100, ash.y + 60]); Republic.stormPost(ash);
  const without = !!c.storm && c.storm.knives.map(k => k.cls).join() === 'bowman,ram,knife';
  c.storm = null; c.taken = null; c.pacified = false; WL.tp('haven');
  /* the leaderless fire courts the Unlit — by night, at the nearest lit door that is neither risen nor held */
  S.rep.courted = null; for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999; S.rep.evCd.campCourting = 0;
  const near = DATA.stationOrder.filter(id => S.stations[id].connected).sort((a, b) => U.dist(ash.x, ash.y, DATA.stations[a].x, DATA.stations[a].y) - U.dist(ash.x, ash.y, DATA.stations[b].x, DATA.stations[b].y))[0];
  const rw0 = Republic.rel('rebels', 'waylight');
  __at(0.3); __die(0.01, () => Republic.tick(0.5)); const notByDay = !Republic.courted();
  __at(0.75); __die(0.01, () => Republic.tick(0.5));
  const ct = Republic.courted(), courting = notByDay && !!ct && ct.id === near && ct.by === 'ash' && Republic.rel('rebels', 'waylight') === rw0 - 1 && S.mails.some(m => m.subj === 'A camp without a chief courts the Unlit' && /Ash Camp/.test(m.body));
  RepublicUI.open(); const body = document.getElementById('repBody').textContent;
  const sheet = /SHORT A CHIEF — the rag on a stake, the road one knife short, the fire courting the Unlit/.test(body) && /THE ORDER — COURTED/.test(body);
  RepublicUI.close();
  S.rep.courted = null; for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999; __at(0.3);
  return { fall, short, without, near, notByDay, courting, sheet };
});
const ch1 = r;
/* seen: the rag on its stake where he stood, THE CHIEF — GONE (against the same frame with the chief at his fire) */
await drain();
const stakeSeen = await ev(async () => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, sx = ash.x - 70 + 9, sy = ash.y - 6 + 16;
  WL.tp([ash.x + 60, ash.y + 150]); S.cargo = S.cargo.filter(x => x.cat === 'tool'); c.runners = []; __clearAmb(ash.x, ash.y, 400); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = ash.x - 40; Render.cam.y = ash.y; await __wait(250); await __frames(3);
  const red = __hex('#c9553a'), a = __near(sx, sy - 8, red, 12, 30), label = Render.labelBoxes().some(b => b.str === 'THE CHIEF — GONE');
  const lost = c.chiefLost; c.chiefLost = 0; await __wait(120); await __frames(3);
  const b = __near(sx, sy - 8, red, 12, 30), label2 = Render.labelBoxes().some(x => x.str === 'THE CHIEF'); c.chiefLost = lost;
  __done(); WL.timeScale = 0.001; WL.tp('haven');
  return { rag: a, without: b, label, label2 };
});
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, span = REP.WATCHPOST.storm.seen.mourn * DATA.T.dayLen;
  /* the span passed: a chief comes up again (v3.43: he walks in as a scene — the camp still short while he walks) */
  c.chiefLost = S.time - span + 5; Republic.tick(0.1); const within = Republic.chiefGone(ash) && !c.chiefReturn;
  c.chiefLost = S.time - span - 1; Republic.tick(0.1); const walking = !!c.chiefReturn && Republic.chiefGone(ash);
  for (let i = 0; i < 80 && c.chiefReturn; i++) Republic.tick(0.1);
  const up = !c.chiefReturn && !c.chiefLost && Republic.chiefUp(ash) && !Republic.chiefGone(ash) && Republic.stakeBare(ash);
  return { within, walking, up };
});
ok('A CHIEF WHO REMEMBERS: a chief who goes down does not get up for the camp — GONE for the mourning span (the mail, the lesson); the rag on a stake where he stood with THE CHIEF — GONE on the ground (pixel-sampled against the same frame with him at his fire); the road walks one knife short; the next storm comes from his roll without him (the bowman, the ram, a knife); by night — not by day — the leaderless fire courts the Unlit at the nearest lit door that is neither risen nor held, the camp named in the mail, the Unlit a step warmer against the Order; the banner sheet says SHORT A CHIEF on the camp\'s row and COURTED at the door; inside the span he stays gone, and once it has passed a chief comes up again (v3.43: walking in from the ring\'s edge as a scene, the camp short while he walks) and the stake stands bare',
  Object.values(ch1).every(v => v === true || typeof v === 'string') && stakeSeen.rag > stakeSeen.without + 10 && stakeSeen.label && stakeSeen.label2 && r.within && r.walking && r.up, JSON.stringify(ch1) + ' seen=' + JSON.stringify(stakeSeen) + ' ' + JSON.stringify(r));

/* ================= 4 · THE TOWN'S OWN ON THE ROLL ================= */
r = await ev(() => {
  const M = 'mill', st = S.stations[M], R = REP.DOCTRINE.storm.rise;
  S.rep.held[M] = { t0: S.time, from: M, tithe: 0, shields: 2, riseDay: -1 }; st.likesTo = 45;
  const a = Republic.recruitOwn(M), b = Republic.recruitOwn(M);
  const records = NPC.ownAt(M).length === 2 && [a, b].every(n => n.state === 'square' && n.kit === 'townshield' && n.own === M && n.feeWaived) && Republic.ownOf(M) === 2 && Republic.held()[M].own === 2 && NPC.ordersOf(a).hours === 'nights';
  /* the roll and the pane: AT THE SQUARES, and THE HOURS the one row, in the square's own words */
  MusterUI.open(a.id);
  const roll = document.getElementById('musterBody').textContent, pane = document.getElementById('muOrders');
  const rollOk = /AT THE SQUARES/.test(roll) && roll.includes(a.name) && MusterUI.selected() === a.id;
  const paneOk = pane.querySelectorAll('.muOrder').length === 1 && /when the town's own stand the square/.test(pane.textContent) && /not yours to hire or dismiss/.test(pane.textContent) && !pane.querySelector('[data-dismiss]');
  MusterUI.render(); MusterUI.close();
  /* the cover follows the hour */
  NPC.setOrder(a, 'hours', 'days'); NPC.setOrder(b, 'hours', 'nights');
  __at(0.3); const day = Republic.standingOwn(M); __at(0.75); const night = Republic.standingOwn(M);
  NPC.setOrder(b, 'hours', 'full'); __at(0.3); const dayFull = Republic.standingOwn(M);
  /* the mood reads their own square — and round the clock wears them */
  const ma = NPC.mood(a).causes.map(c => c.id), mb = NPC.mood(b).causes.map(c => c.id);
  const mood = ma.includes('ownSquare') && !ma.includes('ownClock') && mb.includes('ownSquare') && mb.includes('ownClock');
  /* a period's love, thanks and drum: DAYS grows the thanks, round the clock wears the love and slows the drum */
  const h = Republic.held()[M], l0 = st.likesTo, ap0 = st.appr || 0; S.rep.pressure = 100; h.hoursT = R.recruitEvery - 0.1; h.recruitT = 0;
  Republic.tick(0.5);
  const period = st.likesTo === l0 + R.hoursFx.full.likes && (st.appr || 0) >= ap0 + R.hoursFx.days.appr && S.rep.pressure === 100 - R.hoursFx.full.drum && NPC.svc(a).stood === 1 && NPC.svc(b).stood === 1;
  NPC.setOrder(b, 'hours', 'nights'); h.hoursT = R.recruitEvery - 0.1; S.rep.pressure = 100; const l1 = st.likesTo;
  Republic.tick(0.5);
  const nights = S.rep.pressure === 100 - R.hoursFx.nights.drum && st.likesTo === l1;
  /* the sheet counts them and who stands this hour */
  __at(0.3); RepublicUI.open(); const sheet = /2 of the town's own<\/b> beside them \(no tithe\) — <b>1<\/b> in the square this hour/.test(document.getElementById('repBody').innerHTML); RepublicUI.close();
  /* home when the love falls */
  st.likesTo = 25; Republic.tick(0.5);
  const home = NPC.ownAt(M).length === 0 && !S.npcs.includes(a);
  delete S.rep.held[M]; st.likesTo = 45;
  return { records, rollOk, paneOk, day, night, dayFull, mood, period, nights, sheet, home };
});
ok('THE TOWN\'S OWN ON THE ROLL: a garrison\'s recruits are records like any hand\'s (the town\'s kit, the square they stand, no fee; NIGHTS by default; the garrison\'s count derived from the roll, never a second number); the roll (v3.49: Crew) carries them AT THE SQUARES on a plate of their own, and their pane has one row — THE HOURS, in the square\'s own words, not yours to hire or dismiss; the cover follows the hour (DAYS stand the light, NIGHTS the dark, round the clock both); the mood reads their own square (+2) and round the clock wears them (−2); a period of THE HOURS felt by the town — round the clock the love wears a like and the Unlit\'s drum is twelve seconds slower, DAYS the thanks grow, NIGHTS the drum slows — each a watch stood on their stripe; the banner sheet counts them and who stands this hour; below thirty likes they go home',
  r.records && r.rollOk && r.paneOk && r.day === 1 && r.night === 1 && r.dayFull === 2 && r.mood && r.period && r.nights && r.sheet && r.home, JSON.stringify(r));

/* ================= 5 · THE GRIEVANCE ================= */
const acceptRun = to => ev(to => {
  S.stations.haven.parcels = [{ to, kind: 'coat', name: 'a mended coat' }, { to, kind: 'shoes', name: 'a child\'s shoes' }];
  S.orders.active = S.orders.active.filter(o => o.errand); S.cargo = S.cargo.filter(x => x.cat === 'tool');
  WL.tp('haven'); const o = (Economy.ordersFor('haven') || []).find(x => x.item === 'parcel' && x.to === to && !x.errand);
  Systems.acceptOrder(o, false); return S.orders.active.find(x => x.id === o.id).idNum;
}, to);
await acceptRun('elm');
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, E = 'elm', G = DATA.T.grievance;
  S.grievances = []; S.mails.length = 0; S.stations[E].appr = 20;
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  /* a knife's knock on the road puts a parcel down: the door it was addressed to raises it */
  WL.tp([ash.x + 200, ash.y + 300]); S.state = 'walk'; S.health = 100; c.pacified = false; c.taken = null;
  const knife = { x: S.px + 10, y: S.py, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }; c.runners = [knife];
  __die(0.5, () => Systems.update(0.02, {}));
  const dr = S.drops.find(d => d.item && d.item.parcel && d.item.parcel.to === E); c.runners = [];
  if (!dr) return { knocked: false };
  const g = Economy.grievancesFor(E)[0]; window.__apprK = S.stations[E].appr;
  const raised = !!g && g.how === 'ground' && S.stations[E].appr === 20 - G.ground && S.mails.some(m => m.subj === 'Elm Farm: a grievance' && m.body.toLowerCase().includes(dr.item.parcel.name.toLowerCase())) && !!S.flags.tut.firstGrievance && dr.item.grieved === true;
  const tornGlyph = Render.cargoGlyph(dr.item).rows.join('') !== Render.cargoGlyph({ ...dr.item, grieved: false }).rows.join('') && Render.cargoGlyph(dr.item).rows.slice(0, 3).join('') === Render.cargoGlyph({ defId: 'parcel', kg: 4, cat: 'goods', grieved: true }).rows.slice(0, 3).join('');   // the tear, over the crate's own wear
  for (let i = 0; i < 40; i++) UI.tick();
  const compass = [...document.querySelectorAll('#compassInner .cMark')].some(m => /^parcel — the town's own/.test(m.title));
  const lc = Guide.lostCrate(), guide = !!lc && lc.where === 'ground' && lc.item === dr.item;
  /* carried into a camp it deepens */
  const runner = { x: dr.x, y: dr.y, wa: 0, state: 'patrol', cd: 5, cls: 'knife' }; c.runners = [runner]; WL.tp('haven');
  Systems.update(0.02, {}); const picked = runner.carry === dr.item;
  runner.x = ash.x + 5; runner.y = ash.y; Systems.update(0.02, {});
  const deeper = c.stash.includes(dr.item) && Economy.grievancesFor(E)[0].how === 'camp' && S.stations[E].appr === 20 - G.ground - G.camp;
  c.runners = [];
  window.__gv = { item: dr.item.id };
  return { knocked: true, raised, tornGlyph, compass, guide, picked, deeper };
});
const gr1 = r;
r = await ev(() => {
  const E = 'elm', G = DATA.T.grievance, o = S.orders.active.find(x => x.item === 'parcel' && x.to === E);
  /* the run given up: what is still on the pack is a grievance too, lost toward its door */
  const ap0 = S.stations[E].appr;
  Systems.abandonOrder(o.idNum);
  const left = S.cargo.find(x => x.parcel && x.parcel.to === E);
  const given = !!left && left.lostTo === E && Economy.grievancesFor(E).some(g => g.id === left.parcel.id && g.how === 'given') && S.stations[E].appr === ap0 - G.given;
  /* made right as lost cargo: carried to its door after all — more than it cost */
  const ap1 = S.stations[E].appr; WL.tp(E);
  Systems.handleDelivery(E);
  const madeLost = !Economy.grievancesFor(E).some(g => g.id === left.parcel.id) && S.stations[E].appr === ap1 + G.made;
  return { given, madeLost };
});
const gr2 = r;
await acceptRun('green');
r = await ev(() => {
  const Gn = 'green', G = DATA.T.grievance, o = S.orders.active.find(x => x.item === 'parcel' && x.to === Gn);
  /* made right on the run: a parcel put down and grieved, picked up again and carried through — the slip says so */
  const apPre = S.stations[Gn].appr || 0, it = S.cargo.find(x => x.parcel && x.parcel.to === Gn); State.removeCargo(it.id); Economy.grieve(it, 'ground'); State.addCargo(it);
  const ap0 = S.stations[Gn].appr || 0; WL.tp(Gn); WL.instantPar();
  const res = Systems.handleDelivery(Gn).results.find(x => x.order && x.order.id === o.id);
  const made = !!res && !!res.made && res.made.length === 1 && /Made right\.$/.test(res.made[0]) && !Economy.grievancesFor(Gn).length && ap0 === apPre - G.ground && (S.stations[Gn].appr || 0) === ap0 + G.made + res.appr;
  UI.queueResults([res], null); const slip = /Made right\./.test(document.getElementById('scoreRows').textContent); document.getElementById('results').classList.add('hidden');
  /* left two days, the town remembers: three likes gone for good, REMEMBERED on the board — and it says nothing */
  const E = 'elm', g = Economy.grievancesFor(E).find(x => x.how === 'camp');
  g.t = S.time - G.fadeDays * DATA.T.dayLen - 1; const l0 = S.stations[E].likesTo = 30;
  for (let i = 0; i < 12; i++) Economy.update(0.5);
  const remembered = g.remembered && S.stations[E].likesTo === l0 - G.memory && S.mails.some(m => m.subj === 'Elm Farm remembers');
  WL.tp(E); UI.openStation(E);
  const board = [...document.querySelectorAll('#stationBody .grievances .needRow.grv')].some(el => el.textContent.includes(g.name) && /REMEMBERED · never came/.test(el.textContent)) && /Elm Farm's grievances · 1/.test(document.getElementById('stationBody').textContent);
  document.getElementById('stationClose').click();
  return { made, slip, remembered, board, debt: ap0 };
});
ok('THE GRIEVANCE: a knife\'s knock on the road puts a parcel down and the door it was addressed to raises a grievance in its own words (−4 appreciation, the mail naming the parcel, the lesson, the crate TORN — its own glyph), the compass naming it a parcel, the town\'s own, and the guide walking back to it; a runner carries it into his camp and it deepens (−4 more); the run given up makes what is still on the pack a grievance too (−6, lost toward its door) — carried there after all as lost cargo it is made right (+8, more than it cost); a parcel put down and carried through on the run is made right on the slip; left two days, the town remembers — three likes gone for good, REMEMBERED on the board\'s grievances plate, the mail',
  gr1.knocked && gr1.raised && gr1.tornGlyph && gr1.compass && gr1.guide && gr1.picked && gr1.deeper && gr2.given && gr2.madeLost && r.made && r.slip && r.remembered && r.board, JSON.stringify(gr1) + ' ' + JSON.stringify(gr2) + ' ' + JSON.stringify(r));

/* ================= 6 · THE BOLT ================= */
r = await ev(() => {
  const A = DATA.T.arrow;
  const HV = DATA.stations.haven; WL.tp([HV.x + 520, HV.y + 260]); S.speed = 0; S.moveTo = null; S.arrow = null; S.scar = null; S.health = 100; S.food = 80; S.bruisedT = 0;
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  /* the wind comes back at half pace */
  const regen = () => { S.stam = 10; S.stagger = 0; S.speed = 0; Systems.update(0.5, {}); return S.stam - 10; };   // standing, not staggered
  const free = regen();
  Systems.boltIn('ridge');
  const inn = !!S.arrow && S.arrow.from === 'ridge' && !!S.flags.tut.firstArrow;
  const bolted = regen();
  const wind = Math.abs(bolted / free - A.stamMul) < 0.02;
  /* the seep; A BOLT IN on the HUD */
  const drop = () => { S.health = 90; S.stagger = 0; Systems.update(0.5, {}); Systems.update(0.5, {}); return 90 - S.health; };   // below the top, so the body's own mending runs in both
  const withBolt = drop(), ar = S.arrow; S.arrow = null; const without = drop(); S.arrow = ar;
  const seep = +(withBolt - without).toFixed(3);
  UI.updateHUD(); const hud = /A BOLT IN/.test(document.getElementById('buffs').textContent);
  /* a far medic is no medic */
  const med = NPC.gen({ at: 'haven', cls: 'medic' }); S.npcs.push(med); NPC.hire(med, 'companion'); med.hungry = false; med.shoveCd = 0;
  med.cx = S.px + 200; med.cy = S.py;
  for (let i = 0; i < 8; i++) { med.cx = S.px + 200; med.cy = S.py; Systems.update(0.5, {}); }
  const farNo = !!S.arrow;
  /* the medic beside you pulls it in a breath, for nothing — their note, and the trade learns */
  const xp0 = (med.trainXp || {}).mend || 0, lv0 = med.skills.mend || 0, h0 = S.health;
  for (let i = 0; i < 8 && S.arrow; i++) { med.cx = S.px + 30; med.cy = S.py; Systems.update(0.5, {}); }
  const medic = !S.arrow && NPC.svc(med).last === 'pulled a bolt out of your shoulder' && ((med.trainXp || {}).mend > xp0 || med.skills.mend > lv0) && h0 - S.health < 1 && !!S.scar;
  med.state = 'pool'; med.at = 'haven'; S.scar = null;
  /* a lit town's hands at the terminal */
  Systems.boltIn('ridge'); WL.tp('mill'); Systems.handleDelivery('mill'); const town = !S.arrow && !!S.scar; S.scar = null;
  /* your own hand: standing still for the price */
  WL.tp([HV.x + 520, HV.y + 260]); S.speed = 0; Systems.boltIn('ridge'); S.health = 100;
  const it = Systems.getInteractions().find(i => /Pull the bolt yourself/.test(i.label)); if (it) it.fn();
  const pulling = !!S.arrow && S.arrow.pulling; UI.updateHUD(); const hudPull = /PULLING THE BOLT/.test(document.getElementById('buffs').textContent);
  for (let i = 0; i < 8 && S.arrow; i++) { S.speed = 0; Systems.update(0.4, {}); }
  const self = !S.arrow && S.health < 100 - A.pullSelf + 0.5 && S.health > 100 - A.pullSelf - 1 && S.scar && S.scar.by === 'self';
  S.scar = null; S.health = 100; WL.tp('haven');
  return { inn, free: +free.toFixed(3), bolted: +bolted.toFixed(3), wind, seep, hud, farNo, medic, town, pulling, hudPull, self };
});
ok('THE BOLT: a bowman\'s shot stays IN (the bolt in, the lesson) — the wind comes back at half pace, the wound seeps (0.12 a second), A BOLT IN on the HUD; a field medic walking with you but out of reach pulls nothing; beside you, inside reach, in a breath and for nothing (their note, the trade learns — v3.43: the pull leaves a scar); a lit town\'s hands at the terminal pull it; your own hand pulls it standing still for the price (PULLING THE BOLT, four health)',
  r.inn && r.wind && Math.abs(r.seep - 0.12) < 0.02 && r.hud && r.farNo && r.medic && r.town && r.pulling && r.hudPull && r.self, JSON.stringify(r));

/* ================= 7 · THE SAVE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash');
  Systems.boltIn('ash'); S.arrow.n = 2;
  S.grievances = [{ id: 777, to: 'green', from: 'haven', kind: 'coat', name: 'a mended coat', t: S.time, how: 'camp', n: 2, remembered: false }];
  Republic.chiefFalls(ash, 'walker'); const lost = S.camps.ash.chiefLost;
  S.rep.held.mill = { t0: S.time, from: 'mill', tithe: 0, shields: 2, riseDay: -1 }; S.stations.mill.likesTo = 45;
  const a = Republic.recruitOwn('mill'); NPC.setOrder(a, 'hours', 'days');
  State.save(); State.load();
  const bolt = !!S.arrow && S.arrow.from === 'ash' && S.arrow.n === 2;
  const grief = Economy.grievancesFor('green').length === 1 && Economy.grievancesFor('green')[0].how === 'camp';
  const chief = S.camps.ash.chiefLost === lost && Republic.chiefGone(ash) && S.camps.ash.chiefFelledBy === 'walker';
  const own = NPC.ownAt('mill').length === 1 && NPC.ordersOf(NPC.ownAt('mill')[0]).hours === 'days' && Republic.held().mill.own === 1;
  S.arrow = null;
  return { bolt, grief, chief, own };
});
ok('THE SAVE: a bolt in the shoulder, an open grievance where it stands, a camp\'s mourning (and whose hand it was) and the town\'s own on the roll with the hours they keep survive a save and load',
  Object.values(r).every(Boolean), JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
await T.finish('the remembering');
