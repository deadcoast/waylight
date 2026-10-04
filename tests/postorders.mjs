/* postorders.mjs — v3.38 THE POSTED ORDERS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48
   source was lost; its figures sampled on the courier's grid). The posts on the same store, the working world's mood, the
   survey: the registry (three post rows on the ten-row table, the causes, a work pace per band); THE HOURS on the clock (a
   daylight shift closes, a night one never starts, the lamp-lit round pays one more); THE KEEP off the town's shelf (no
   provision, two rations, half the thanks, the table on the plate, the stall at the floor, wages resuming); THE TRAINING
   split to Lumen at nought; the working causes (the greyfall at the hand's own feet by night beside the Greenhouse, an
   HONOURED town's thanks, the far line); a DONE hauler coming in after the minute with the mail; the survey's pixels (a
   flag at each mark, the gold line along the chain, the green pip, the party's dot at the glyph's scale, the legend); the
   Crew sheet's post pane and the lesson; the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;
await ev(() => {
  window.__toasts = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join(' | ');
  window.__vis = id => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  window.__mail = re => S.mails.find(m => re.test(m.subj)) || null;
  for (const id of ['elm', 'mill', 'green']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true);
  S.banked.provisions = 300; S.banked.metal = 200;
  window.__at = f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; };
  window.__post = (name, st, job) => { const n = NPC.gen({ at: st, cls: 'courier' }); n.name = name; n.feeWaived = true; S.npcs.push(n); NPC.assignPost(n, st, job); return n; };
  window.__shift = n => { n.shiftT = 0.01; const a0 = S.stations[n.at].appr || 0, p0 = S.banked.provisions, f0 = S.stations[n.at].stock.food, s0 = NPC.svc(n).shifts || 0; NPC.update(0.02); return { closed: (NPC.svc(n).shifts || 0) - s0, appr: +((S.stations[n.at].appr || 0) - a0).toFixed(2), prov: +(p0 - S.banked.provisions).toFixed(2), food: +(f0 - S.stations[n.at].stock.food).toFixed(2), resting: !!n.resting, shiftT: +n.shiftT.toFixed(2), hungry: !!n.hungry }; };
});

/* ================= 1 · THE REGISTRY ================= */
let r = await ev(() => {
  const WO = MUSTER.WORK_ORDERS, P = MUSTER.POST;
  const rows = P.rows.join() === 'hours,training,keep' && Object.keys(WO).length === 10 && WO.hours.appr.nights === 1 && WO.hours.appr.full === 0 && WO.keep.food.table === 2 && WO.keep.apprMul.table === 0.5 && WO.keep.foodFloor === 10 && Object.keys(WO.training.choices).join() === 'round,cross';
  const C = MUSTER.MOOD.causes, v338 = { greyfall: -2, nightWork: -2, far: -1, thanked: 1, table: 1 };
  const causes = Object.entries(v338).every(([k, v]) => C[k] && C[k].v === v && C[k].line) && C.far.beyond === 2400 && C.thanked.apprLv === 3;
  const pace = Object.fromEntries(Object.entries(MUSTER.MOOD.fx).map(([b, f]) => [b, f.workMul]));
  return { rows, causes, n: Object.keys(C).length, pace, kinds: [NPC.workOf({ state: 'post', job: 'runner', orders: null }).kind] };
});
ok('THE REGISTRY: THE HOURS, THE TRAINING and THE KEEP are three post rows on the same working-order table (ten rows: the lamp-lit round one more, the table two rations and half the thanks down to a floor of ten); five working causes join the mood (the greyfall −2, working nights −2, far from home −1 past 2.4 km, a town that thanks them +1 at HONOURED, fed at the town\'s table +1 — v3.49: thirty-one causes in all); every band carries a work pace (BRIGHT ×1.1, LOW ×0.85, DONE ×0.7); a post hand answers to a fourth sheet kind, post',
  r.rows && r.causes && r.n === 31 && r.pace.BRIGHT === 1.1 && r.pace.LOW === 0.85 && r.pace.DONE === 0.7 && r.pace.STEADY === 1 && r.kinds[0] === 'post', JSON.stringify(r));

/* ================= 2 · THE HOURS, ON THE CLOCK ================= */
r = await ev(() => {
  const d = __post('Hale Dawnly', 'haven', 'runner'), n = __post('Nell Vesper', 'elm', 'runner');
  window.__d = d; window.__n = n;
  NPC.setOrder(d, 'hours', 'days'); NPC.setOrder(n, 'hours', 'nights');
  __at(0.2); const dayD = __shift(d), dayN = (() => { const t0 = n.shiftT = 5; NPC.update(1); return { resting: !!n.resting, held: n.shiftT === t0 }; })();
  __at(0.8); const nightD = (() => { const t0 = d.shiftT = 5, s0 = NPC.svc(d).shifts; NPC.update(1); return { resting: !!d.resting, held: d.shiftT === t0, none: NPC.svc(d).shifts === s0 }; })(), nightN = __shift(n);
  /* the same round kept round the clock pays the town its one; by lamplight it pays one more */
  NPC.setOrder(d, 'hours', 'full'); const fullD = __shift(d);
  __at(0.3); NPC.update(0.02);   // by day again: the nights hand rests
  return { dayD, dayN, nightD, nightN, fullD, plate: /resting — the round keeps its hours/.test((() => { MusterUI.open(n.id); const t = document.getElementById('musterBody').textContent; MusterUI.close(); return t; })()) };
});
ok('THE HOURS, ON THE CLOCK: a DAYS hand\'s morning shift closes and pays the town; by night the same hand rests with the clock held and no shift starts; a NIGHTS hand rests by day (the plate says resting — the round keeps its hours) and its lamp-lit shift pays the town one appreciation more than a round kept round the clock',
  r.dayD.closed === 1 && r.dayD.appr === 1 && !r.dayD.resting && r.dayN.resting && r.dayN.held && r.nightD.resting && r.nightD.held && r.nightD.none && r.nightN.closed === 1 && r.nightN.appr === 2 && r.fullD.closed === 1 && r.fullD.appr === 1 && r.plate, JSON.stringify(r));

/* ================= 3 · THE KEEP, OFF THE TOWN'S SHELF ================= */
r = await ev(() => {
  const n = __n; __at(0.8); S.stations.elm.stock.food = 40;
  const wages = __shift(n);
  NPC.setOrder(n, 'keep', 'table');
  const table = __shift(n), m = NPC.mood(n), onPlate = m.causes.some(c => c.id === 'table');
  MusterUI.open(n.id); const plate = /fed at the town's table/.test(document.querySelector(`#musterBody .muPlate[data-mu="${n.id}"]`).textContent); MusterUI.close();
  S.stations.elm.stock.food = 11;   // under the floor after two rations
  const stall = __shift(n), said = /table is bare/.test(NPC.svc(n).last) && /round stalled/.test(__toasts());
  NPC.setOrder(n, 'keep', 'wages'); const resume = __shift(n);
  __at(0.3);
  return { wages, table, onPlate, plate, stall, said, resume };
});
ok('THE KEEP, OFF THE TOWN\'S SHELF: on wages the lamp-lit round draws a provision from the bank; at THE TOWN\'S TABLE it draws none — two rations come off the town\'s own shelf and the thanks are halved — and the plate says fed at the town\'s table; with the shelf at the floor the round STALLS and the roll says the table is bare, as an unpaid round stalls; set back to wages it draws its provision and walks again',
  r.wages.closed === 1 && r.wages.prov === 1 && r.wages.food === 0 && r.wages.appr === 2 && r.table.closed === 1 && r.table.prov === 0 && r.table.food === 2 && r.table.appr === 1 && r.onPlate && r.plate && r.stall.closed === 0 && r.stall.food === 0 && r.stall.hungry && r.said && r.resume.closed === 1 && r.resume.prov === 1 && !r.resume.hungry, JSON.stringify(r));

/* ================= 4 · THE TRAINING, SPLIT TO LUMEN AT NOUGHT ================= */
r = await ev(() => {
  const n = __d; NPC.setOrder(n, 'hours', 'full');
  for (const id of Object.keys(n.skills)) n.skills[id] = Math.max(1, n.skills[id]); n.skills.lum = 0; n.skills.foot = 2; n.trainXp = {};
  NPC.setOrder(n, 'training', 'round'); __shift(n); const round = { foot: +(n.trainXp.foot || 0).toFixed(1), lum: +(n.trainXp.lum || 0).toFixed(1) };
  n.trainXp = {}; NPC.setOrder(n, 'training', 'cross'); __shift(n); const cross = { foot: +(n.trainXp.foot || 0).toFixed(1), lum: +(n.trainXp.lum || 0).toFixed(1) };
  return { round, cross, xp: DATA.T.shiftXp, last: NPC.svc(n).last };
});
ok('THE TRAINING, SPLIT TO LUMEN AT NOUGHT: a letter runner on the round\'s own verb puts the whole shift\'s lesson into Footwork; set to CROSS-TRAIN, the same shift puts half into Footwork and half into the hand\'s weakest skill — Lumenistry, at nought — and the note names it',
  r.round.foot > 0 && r.round.lum === 0 && r.cross.foot > 0 && r.cross.lum > 0 && Math.abs(r.cross.foot - r.round.foot / 2) < 0.01 && /cross-training lumenistry/.test(r.last), JSON.stringify(r));

/* ================= 5 · THE WORKING CAUSES ================= */
r = await ev(() => {
  const G = DATA.stations.green;
  /* the greyfall at the hand's own feet: out in the grey at the Greenhouse's latitude, by night */
  let spot = null;
  for (let dx = 300; dx < 3000 && !spot; dx += 60) for (const s of [1, -1]) { const x = G.x + s * dx, y = G.y, t = World.terrainAt(x, y); if (!t.blocked && !t.water && World.mistAt(x, y) > 0.3) { spot = { x, y }; break; } }
  const h = NPC.gen({ at: 'green', cls: 'courier' }); h.name = 'Garr Weald'; h.feeWaived = true; S.npcs.push(h); NPC.assignField(h, 'green', 'hauler', 'mill'); window.__h = h;
  h.fx = spot.x; h.fy = spot.y; h.shiftT = 9999; h.hungry = false;
  S.weather = { state: 'grey', t: 9999, intensity: 0.8 }; __at(0.8);
  const rain = +Systems.rainAt(h.fx, h.fy).toFixed(2), m1 = NPC.mood(h);
  const far = U.dist(G.x, G.y, DATA.stations.mill.x, DATA.stations.mill.y);
  /* an HONOURED town thanks the hand that works for it */
  S.stations.green.appr = DATA.T.apprTiers[2] + 5; const m2 = NPC.mood(h), lv = Economy.apprLevel('green');
  S.stations.green.appr = 0;
  /* by day in clear weather the same hand feels none of it */
  S.weather = { state: 'clear', t: 9999, intensity: 0 }; __at(0.3); const m3 = NPC.mood(h);
  const ids = m => m.causes.map(c => c.id).sort().join();
  return { spot: !!spot, rain, m1: [m1.v, ids(m1)], far: Math.round(far), m2: [m2.v, ids(m2), lv], m3: [m3.v, ids(m3)] };
});
ok('THE WORKING CAUSES: a hauler out in the grey at the Greenhouse\'s latitude by night in the greyfall feels it at their own feet (working in the greyfall −2, working nights −2) and the far line (the Greenhouse–Mill run past 2.4 km, −1); an HONOURED Greenhouse\'s thanks lift them (+1); by day in clear weather the same hand feels none of it — a stalled or paid hand alike, out there in it',
  r.spot && r.rain > 0 && r.m1[1] === ['far', 'greyfall', 'nightWork'].sort().join() && r.m1[0] === -5 && r.far > 2400 && r.m2[1] === ['far', 'greyfall', 'nightWork', 'thanked'].sort().join() && r.m2[0] === -4 && r.m2[2] === 3 && r.m3[1] === 'far' && r.m3[0] === -1, JSON.stringify(r));

/* ================= 6 · A DONE HAULER COMES IN AFTER THE MINUTE ================= */
r = await ev(() => {
  const h = __h; S.weather = { state: 'grey', t: 9999, intensity: 0.8 }; __at(0.8);
  h.hungry = true; h.shiftT = 9999; h.moodBand = undefined; h.doneT = 0;   // unpaid, in the greyfall, at night, far from home
  const m = NPC.mood(h); let t = 0;
  for (let i = 0; i < 40 && h.state === 'field'; i++) { const fx = h.fx, fy = h.fy; NPC.update(2); h.fx = fx; h.fy = fy; t += 2; }
  const mail = __mail(/^Garr Weald came in$/);
  S.weather = { state: 'clear', t: 9999, intensity: 0 }; __at(0.3);
  return { band: m.band, v: m.v, t, state: h.state, at: h.at, job: h.job, mail: !!mail, why: !!mail && /unpaid/.test(mail.body) && /greyfall/.test(mail.body) && /nights/.test(mail.body) && /far from home/.test(mail.body), toast: /comes in from the field to .* — DONE/.test(__toasts()), last: NPC.svc(h).last };
});
ok('A DONE HAULER COMES IN AFTER THE MINUTE: unpaid, in the greyfall, at night, far from home is DONE — and a minute on the hauler comes in off the job to their town\'s fire, the toast and the mail naming every cause, the roll saying they came in DONE',
  r.band === 'DONE' && r.v === -8 && r.t >= 60 && r.t <= 64 && r.state === 'pool' && r.at === 'green' && r.job === null && r.mail && r.why && r.toast && /came in DONE/.test(r.last), JSON.stringify(r));

/* ================= 7 · THE SURVEY'S PIXELS ================= */
r = await ev(async () => {
  const H = DATA.stations.haven; WL.tp([H.x + 300, H.y + 200]); S.dir = 0; S.speed = 0;
  /* a presser on a chain of two marks, a field hand's pip, and a back walking with the Walker */
  const p = NPC.gen({ at: 'haven', cls: 'courier' }); p.name = 'Ansel Brook'; p.feeWaived = true; S.npcs.push(p);
  const m1 = { x: H.x + 500, y: H.y - 300 }, m2 = { x: H.x + 900, y: H.y - 150 };
  NPC.assignField(p, 'haven', 'presser', m1); NPC.addMark(p, m2.x, m2.y); NPC.update(0.01); p.fx = H.x + 200; p.fy = H.y - 100; p.hungry = false;
  const b = NPC.gen({ at: 'haven', cls: 'courier' }); b.name = 'Tam Harrow'; b.feeWaived = true; S.npcs.push(b); NPC.hire(b, 'companion'); b.cx = S.px - 60; b.cy = S.py;
  WL.timeScale = 0.001; UI.toggleMap(true); await __wait(200); UI.drawMap();
  const c = document.getElementById('map'), g = c.getContext('2d'), rc = c.getBoundingClientRect(), dpr = devicePixelRatio;
  const at = (wx, wy) => { const q = UI.mapPoint(wx, wy); return [(q.x - rc.left) * dpr, (q.y - rc.top) * dpr]; };
  const box = (x, y, rad) => g.getImageData(Math.round(x - rad), Math.round(y - rad), Math.round(rad * 2), Math.round(rad * 2)).data;
  const flags = [m1, m2].map(m => { const [x, y] = at(m.x, m.y); return __count(box(x + 3, y - 10, 9), __hex('#c9a05a'), 16); });
  const [px2, py2] = at(p.fx, p.fy), pip = __count(box(px2, py2, 4), __hex('#9fd98a'), 16);
  p.hungry = true; UI.drawMap(); const rust = __count(box(px2, py2, 4), __hex('#e0654a'), 16); p.hungry = false;
  /* the gold line along the chain: the same sheet drawn without the presser's line */
  UI.drawMap(); const pts = p.fpath.pts, mids = pts.filter((q, i) => i % 4 === 2).slice(0, 12);
  const A = mids.map(q => { const [x, y] = at(q[0], q[1]); return box(x, y, 4); });
  const keep = p.fpath; p.fpath = null; UI.drawMap(); const B = mids.map(q => { const [x, y] = at(q[0], q[1]); return box(x, y, 4); }); p.fpath = keep; UI.drawMap();
  const line = A.reduce((s, a, i) => s + (__diff(a, B[i]) > 0 ? 1 : 0), 0);
  /* the wedge at the marker: a back's dot in its mood colour at the glyph's own scale, whatever the sheet's zoom */
  const mood = NPC.moodCached(b), [yx, yy] = at(S.px, S.py), off = (b.cx - S.px) * 0.55, dot = __count(box(yx + (b.cx - S.px) * 0.55, yy, 4), __hex(mood.col), 20);
  const legend = [...document.querySelectorAll('#mapLegend div')].map(d => d.textContent.trim());
  UI.toggleMap(false); WL.timeScale = 1;
  window.__p = p; window.__b = b;
  return { flags, pip, rust, line, of: mids.length, dot, off: Math.round(off), legend: ['Your field hands', 'A presser\'s marks & line', 'The wedge at your marker'].every(l => legend.includes(l)) };
});
ok('THE SURVEY\'S PIXELS: on the map a presser\'s chain stands as a gold flag at each mark with the walked line drawn along the chain (against the same sheet without it), a field hand as a green pip (rust when unpaid), the party\'s back as a dot in its mood colour at the wedge glyph\'s own scale from the Walker\'s marker, and the legend names all three',
  r.flags.every(v => v > 4) && r.pip > 8 && r.rust > 8 && r.line >= r.of * 0.6 && r.dot > 4 && r.legend, JSON.stringify(r));

/* ================= 8 · THE CREW SHEET'S POST PANE, AND THE LESSON ================= */
await ev(() => { MusterUI.open(__d.id); });
await page.waitForTimeout(250);
const pane = await ev(() => { const b = document.getElementById('muOrders'), pl = document.querySelector(`#musterBody .muPlate[data-mu="${__d.id}"]`); return { kind: NPC.workOf(__d).kind, head: b.querySelector('.muSub').textContent, hours: [...b.querySelectorAll('[data-order="hours"]')].map(x => x.textContent), training: [...b.querySelectorAll('[data-order="training"]')].map(x => x.textContent), keep: [...b.querySelectorAll('[data-order="keep"]')].map(x => x.textContent), letters: /THE LETTERS/.test(b.textContent), stripe: pl.querySelector('.muSvc').textContent, ord: pl.querySelector('.muOrd').textContent, lesson0: !!S.flags.tut.firstPosted }; });
await page.click('#muOrders [data-order="hours"][data-choice="days"]'); await page.waitForTimeout(150);
const set = await ev(() => { const o = { hours: NPC.ordersOf(__d).hours, lesson: !!S.flags.tut.firstPosted, titled: DATA.tutorialTitles.firstPosted }; MusterUI.close(); return o; });
ok('THE CREW SHEET\'S POST PANE, AND THE LESSON: a post hand\'s plate and pane answer to the post sheet — THE HOURS (round the clock, days, nights), THE TRAINING, THE KEEP and THE LETTERS over the same store, the stripe counting its shifts, the skill it trains with its progress and the appreciation it gave; a real click sets DAYS, and the lesson THE POSTED ORDERS walks on that first post order',
  pane.kind === 'post' && /working orders — letter runner at Haven/.test(pane.head) && pane.hours.join() === 'Round the clock,Days,Nights' && pane.training.join() === 'The round\'s verb,Cross-train' && pane.keep.join() === 'Wages,The town\'s table' && pane.letters && /shifts · trains Footwork \d+ \(\d+\/\d+\) · \+\d+ appreciation given/.test(pane.stripe) && /LETTER RUNNER — WORKING ORDERS/.test(pane.ord) && !pane.lesson0 && set.hours === 'days' && set.lesson && set.titled === 'The posted orders', JSON.stringify({ pane, set }));

/* ================= 9 · THE SAVE ================= */
r = await ev(() => {
  const pick = n => JSON.stringify({ o: [n.orders.hours, n.orders.training, n.orders.keep], st: n.state, job: n.job, at: n.at, svc: { shifts: n.svc.shifts || 0, appr: n.svc.appr || 0, last: n.svc.last }, xp: n.trainXp, skills: n.skills });
  const ids = [__d.id, __n.id], before = ids.map(id => pick(S.npcs.find(n => n.id === id)));
  State.save(); const okL = State.load();
  const after = ids.map(id => pick(S.npcs.find(n => n.id === id)));
  return { okL, same: JSON.stringify(before) === JSON.stringify(after), orders: after.map(a => JSON.parse(a).o.join('/')) };
});
ok('THE SAVE: the post hands\' orders (the hours, the training, the keep), their shifts, the appreciation given, the lesson in progress and the skill it grew all survive a save and load',
  r.okL && r.same && r.orders.join() === 'days/cross/wages,nights/round/wages', JSON.stringify(r));

await T.finish('the posted orders');
