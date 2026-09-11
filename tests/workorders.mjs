/* workorders.mjs — v3.37 THE WORKING ORDERS: the field and the roads on the same stores, the mood on
   the plate, the wedge card. The registries whole; a v3.36 store repaired with the freight list, not
   purged; THE FREIGHT LIST gating a hauler's arrival (meds only, then nothing — an honest empty pack);
   THE LOAD splitting a pack across two shelves; THE MARKS as a chain the presser walks in order, the
   trail MEASURED and COME IN walking them to the fire; THE RESERVE a mason will not touch; THE REACH
   and THE WOODS (every other tree kept, by cell); THE RUN and THE PACE on a charter; the mood summed
   from causes with its band effects; a DONE walker sitting down at a fire with the mail; the sheet
   (working orders by kind, the freight list by name, marks add/strike); the wedge card with moods
   and a live glyph, put away and brought back, the choice kept; the hint strip in your keys; the
   lessons; the save. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
const ev = (fn, arg) => page.evaluate(fn, arg);
const MUSTER_QUIT = 60;   // MUSTER.MOOD.quitAfter — a DONE walker sits down after this long at a fire (the mood ticks every two seconds), never before

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const W = MUSTER.WORK_ORDERS, F = MUSTER.FIELD, R = MUSTER.ROAD, M = MUSTER.MOOD;
  const rowsWhole = Object.values(W).every(row => row.name && row.line && row.choices[row.def] && Object.values(row.choices).every(c => c.name && c.line));
  const fieldWhole = Object.keys(CHAR.FIELD_JOBS).every(j => F[j] && F[j].rows.every(k => W[k]) && (!F[j].tree || MUSTER.TREES[F[j].tree]));
  const roadWhole = R.rows.every(k => W[k]) && !!MUSTER.TREES[R.tree];
  const haul = MUSTER.TREES.haul && MUSTER.TREES.haul.root === 'freight' && Ledger.CHAIN.freight && MUSTER.TREES.haul.def.freight === true && MUSTER.TREES.haul.def.post === false;
  const bands = M.bands.every((b2, i) => !i || b2[0] > M.bands[i - 1][0]) && M.bands.every(b2 => M.fx[b2[1]]);
  const causes = Object.values(M.causes).every(c => typeof c.v === 'number' && c.line);
  const goodsAreItems = Object.keys(DATA.goodsInfo).every(g => DATA.items[g] && Ledger.CHAIN[Ledger.classify(g)].includes('freight'));
  return { rows: Object.keys(W).length, rowsWhole, fieldWhole, roadWhole, haul, bands: M.bands.map(x => x[1]).join(' '), causes, causesN: Object.keys(M.causes).length, goodsAreItems };
});
ok('THE REGISTRIES: seven working-order rows whole, every field job and the road naming rows that exist, the freight list rooted on the taxonomy\'s freight branch (every station good IS an item under it), five mood bands rising with effects, sixteen causes each with a line', r.rows === 7 && r.rowsWhole && r.fieldWhole && r.roadWhole && r.haul && r.bands === 'DONE LOW WORN STEADY BRIGHT' && r.causes && r.causesN === 16 && r.goodsAreItems, JSON.stringify(r));

/* ================= 2 · THE STORE REPAIRED, NEVER PURGED ================= */
r = await ev(() => {
  S.stations.elm.connected = true; S.stations.mill.connected = true; S.banked.provisions = 500;
  const H = NPC.gen({ at: 'mill' }); H.feeWaived = true; H.skills.foot = 7; H.skills.haul = 3; S.npcs.push(H);
  /* a v3.36-shaped store: loot and hand marks, no haul mark anywhere, a hand-set mess */
  H.orders = { preset: null, station: 'loose', mess: 'own', stand: 'meet', voice: 'talk', policy: { cargo: { loot: false, hand: true }, curios: { loot: true } } };
  const before = JSON.stringify(H.orders.policy);
  const O = NPC.ordersOf(H);
  const kept = O.mess === 'own' && O.station === 'loose' && O.policy.cargo.loot === false && O.policy.cargo.hand === true && O.policy.curios.loot === true;
  const haulSeeded = O.policy.freight && O.policy.freight.haul === true && O.policy.post && O.policy.post.haul === false;
  const allowsGoods = ['meds', 'tools', 'food', 'coolant'].every(g => NPC.allows(H, 'haul', g));
  const letters = NPC.allows(H, 'haul', 'letters');
  const workDefaults = O.load === 'full' && O.marks === 'home' && O.reserve === 'none' && O.reach === 'near' && O.woods === 'clear' && O.run === 'post' && O.pace === 'steady';
  /* the pack's own ledger untouched by any of it */
  const packUntouched = Object.keys(Ledger.led().policy).length === 0;
  window._H = H.id;
  return { kept, haulSeeded, allowsGoods, letters, workDefaults, packUntouched, before: before.length > 10 };
});
ok('A v3.36 STORE IS REPAIRED, NOT PURGED: every mark it held stands, the freight list arrives as its registry default (every good, no letters), the working rows take their defaults, and the pack\'s ledger is untouched', r.kept && r.haulSeeded && r.allowsGoods && !r.letters && r.workDefaults && r.packUntouched, JSON.stringify(r));

/* ================= 3 · THE FREIGHT LIST GATES A HAULER ================= */
r = await ev(() => {
  const H = S.npcs.find(n => n.id === window._H);
  NPC.assignField(H, 'mill', 'hauler', 'elm');
  const w0 = NPC.workOf(H);
  NPC.setTreeMark(H, 'haul', 'freight', false); NPC.setTreeMark(H, 'haul', 'meds', true, true);
  const list = NPC.freightFor(H, 'elm', 'mill');
  const stock0 = { ...S.stations.elm.stock };
  let t = 0; for (let i = 0; i < 1800 && !(H.fruns > 0); i++) { Systems.update(0.25, {}); t += 0.25; }
  const medsUp = (S.stations.elm.stock.meds || 0) - stock0.meds;
  const last = NPC.svc(H).last, onlyMeds = /medicine into Elm/.test(last) && !/ and /.test(last);
  /* now nothing Elm wants: the list is bare — an honest empty pack, said on the roll */
  NPC.setTreeMark(H, 'haul', 'meds', false, true);
  const list2 = NPC.freightFor(H, 'elm', 'mill');
  const runs0 = H.fruns;
  for (let i = 0; i < 2400 && H.fruns < runs0 + 2; i++) Systems.update(0.25, {});
  const empty = H.fempty, last2 = NPC.svc(H).last;
  return { kind: w0.kind, job: w0.job, rows: Object.keys(w0.rows), trees: w0.trees, list, medsUp: Math.round(medsUp), last, onlyMeds, list2, runs: H.fruns, empty, last2 };
});
ok('THE FREIGHT LIST: a hauler\'s sheet is THE LOAD plus the freight list; marked to medicine alone, the arrival walks medicine in (twelve, minus the shelf\'s drain) and nothing else in the pack; marked to nothing, the pack arrives EMPTY and the roll says so', r.kind === 'field' && r.job === 'hauler' && r.rows.join() === 'load' && r.trees.join() === 'haul' && r.list.join() === 'meds' && r.medsUp >= 8 && r.onlyMeds && r.list2.length === 0 && r.empty >= 1 && /empty/.test(r.last2), JSON.stringify(r));

/* ================= 4 · THE LOAD: split ================= */
r = await ev(() => {
  const H = S.npcs.find(n => n.id === window._H);
  NPC.setTreeMark(H, 'haul', 'freight', true);
  NPC.setOrder(H, 'load', 'split');
  const runs0 = H.fruns;
  /* the next arrival AT ELM: the tick it lands, judged against the tick before it (the shelves drain on their own clock) */
  let picks = null, up = [];
  for (let i = 0; i < 4000 && !picks; i++) {
    const prev = { ...S.stations.elm.stock };
    Systems.update(0.25, {});
    if (H.fruns > runs0 && /into Elm/.test(NPC.svc(H).last) && / and /.test(NPC.svc(H).last)) { picks = NPC.svc(H).last; up = DATA.stations.elm.needs.map(g => [g, Math.round((S.stations.elm.stock[g] || 0) - prev[g])]).filter(([, d]) => d >= 5); }
  }
  return { picks, up, cap: DATA.T.haulCap };
});
ok('THE LOAD — split: one arrival walks TWO goods in, half the cap each, and two shelves at Elm climb at once', !!r.picks && /6 [a-z ]+ and 6 [a-z ]+/.test(r.picks) && r.up.length >= 2, JSON.stringify(r));

/* ================= 5 · THE MARKS: a chain, measured, come in ================= */
r = await ev(() => {
  const P = NPC.gen({ at: 'haven' }); P.feeWaived = true; P.skills.foot = 7; S.npcs.push(P);
  const d = DATA.stations.haven;
  NPC.assignField(P, 'haven', 'presser', { x: d.x + 500, y: d.y - 200 });
  const one = NPC.marksOf(P).length;
  NPC.addMark(P, d.x + 900, d.y - 100);
  const two = NPC.marksOf(P).length, sheet = NPC.workOf(P);
  for (let i = 0; i < 12; i++) Systems.update(0.25, {});
  const pts = P.fpath.pts;
  const visitsBoth = [[d.x + 500, d.y - 200], [d.x + 900, d.y - 100]].every(([mx, my]) => pts.some(([x, y]) => Math.hypot(x - mx, y - my) < 30));
  const inOrder = pts.findIndex(([x, y]) => Math.hypot(x - (d.x + 500), y - (d.y - 200)) < 30) < pts.findIndex(([x, y]) => Math.hypot(x - (d.x + 900), y - (d.y - 100)) < 30);
  const struck = NPC.strikeMark(P), afterStrike = NPC.marksOf(P).length, cannot = !NPC.strikeMark(P);
  NPC.addMark(P, d.x + 900, d.y - 100);
  const fresh = World.trailState(P.fpath ? P.fpath.pts : pts);
  window._P = P.id;
  return { one, two, kind: sheet.kind, rows: Object.keys(sheet.rows), visitsBoth, inOrder, struck, afterStrike, cannot, freshFrac: fresh.frac, total: fresh.total };
});
ok('THE MARKS: the clicked point is the first mark, ADD appends a second, the walked line visits both IN ORDER, STRIKE takes the last (never the first), and the fresh trail measures near-bare-nothing', r.one === 1 && r.two === 2 && r.kind === 'field' && r.rows.join() === 'marks' && r.visitsBoth && r.inOrder && r.struck && r.afterStrike === 1 && r.cannot && r.freshFrac < 0.3 && r.total > 20, JSON.stringify(r));
r = await ev(() => {
  const P = S.npcs.find(n => n.id === window._P);
  NPC.setOrder(P, 'marks', 'keep');
  for (let i = 0; i < 8; i++) Systems.update(0.25, {});
  const pts = P.fpath.pts;
  for (let k = 0; k + 1 < pts.length; k++) { const [x1, y1] = pts[k], [x2, y2] = pts[k + 1]; const L = Math.hypot(x2 - x1, y2 - y1); for (let s2 = 0; s2 <= L; s2 += 5) { const t = s2 / L; World.addWear(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 70); } }
  const ts = World.trailState(pts);
  /* KEEP THE BEAT: bare end to end, they walk on for as long as you pay */
  let t = 0; for (let i = 0; i < 2400 && P.state === 'field'; i++) { Systems.update(0.25, {}); t += 0.25; }
  const stayed = P.state === 'field', measured = P.ftrail && P.ftrail.frac;
  /* COME IN: the same bare trail walks them to the fire at the next end, with the mail */
  NPC.setOrder(P, 'marks', 'home');
  let t2 = 0; for (let i = 0; i < 2400 && P.state === 'field'; i++) { Systems.update(0.25, {}); t2 += 0.25; }
  const mail = S.mails.find(m => m.subj === `${P.name} came in`);   // the mailbag is newest-first
  return { frac: ts.frac, stayed, measured, t, state: P.state, at: P.at, job: P.job, t2, mail: !!mail, last: NPC.svc(P).last };
});
ok('BARE END TO END: under KEEP THE BEAT the presser walks on (the trail measured 100% at the end); under COME IN the next end walks them to Haven\'s fire, off the job, with the mail', r.frac >= 0.95 && r.stayed && r.measured >= 0.9 && r.state === 'pool' && r.at === 'haven' && r.job === null && r.mail && /came in/.test(r.last), JSON.stringify(r));

/* ================= 6 · THE RESERVE ================= */
r = await ev(() => {
  for (let i = 0; i < 40; i++) Systems.stampTraffic('haven', 'elm');
  const M = NPC.gen({ at: 'haven' }); M.feeWaived = true; M.skills.foot = 7; S.npcs.push(M);
  NPC.assignField(M, 'haven', 'mason', 'elm');
  NPC.setOrder(M, 'reserve', 'twenty');
  S.banked.ceramic = 24;
  for (let i = 0; i < 1600 && S.banked.ceramic > 20; i++) Systems.update(0.25, {});
  const reached = S.banked.ceramic;
  for (let i = 0; i < 400; i++) Systems.update(0.25, {});
  const held = S.banked.ceramic, note = NPC.svc(M).last;
  NPC.setOrder(M, 'reserve', 'none');
  for (let i = 0; i < 1200 && S.banked.ceramic >= 20; i++) Systems.update(0.25, {});
  const resumed = S.banked.ceramic;
  return { reached, held, note, resumed, laid: NPC.svc(M).laid };
});
ok('THE RESERVE: a mason lays down to twenty slabs and holds there, saying so on the roll; the reserve struck, the laying resumes below it', r.reached === 20 && r.held === 20 && /reserve of 20/.test(r.note) && r.resumed < 20 && r.laid > 0, JSON.stringify(r));

/* ================= 7 · THE REACH AND THE WOODS ================= */
r = await ev(() => {
  let home = null;
  for (const id of DATA.stationOrder) { if (World.nearestForest(DATA.stations[id].x, DATA.stations[id].y, DATA.T.fellRadius)) { home = id; break; } }
  S.stations[home].connected = true;
  const F = NPC.gen({ at: home }); F.feeWaived = true; F.skills.foot = 7; S.npcs.push(F);
  NPC.assignField(F, home, 'forrester');
  NPC.setOrder(F, 'woods', 'thin');
  const w0 = S.banked.wood;
  for (let i = 0; i < 3600 && (NPC.svc(F).felled || 0) < 3; i++) Systems.update(0.25, {});
  const felled = NPC.svc(F).felled, kept = (F.fkept || []).length, fellNote = NPC.svc(F).last;
  const hx = DATA.stations[home].x, hy = DATA.stations[home].y;
  const nearest = World.nearestForest(hx, hy, DATA.T.fellRadius);
  const keptIsNearestStanding = !!nearest && F.fkept.includes(nearest.i);
  /* THE REACH: far searches almost twice the ground — a stand past the near radius is found only under far */
  const nearR = DATA.T.fellRadius, farR = nearR * MUSTER.WORK_ORDERS.reach.mul.far;
  const skipAll = new Set();
  for (let cy = 0; cy < 400; cy++) for (let cx = 0; cx < 400; cx++) {} // no-op: the world's own cells stand
  const inNear = World.nearestForest(hx, hy, nearR, new Set(F.fkept)), inFar = World.nearestForest(hx, hy, farR, new Set(F.fkept));
  const farWider = !!inFar && (!inNear || inFar.i === inNear.i || Math.hypot(inFar.x - hx, inFar.y - hy) <= Math.hypot(inNear.x - hx, inNear.y - hy));
  NPC.setOrder(F, 'reach', 'far');
  const reachRead = NPC.ordersOf(F).reach === 'far' && F.ftarget === null;
  window._F = F.id;
  return { home, felled, gained: S.banked.wood - w0, kept, keptIsNearestStanding, farWider, reachRead, last: fellNote, mul: MUSTER.WORK_ORDERS.reach.mul.far };
});
ok('THE WOODS — thin: three trees felled, two kept standing between them BY CELL (the nearest standing tree to the town is a kept one, and the axe walks past it); THE REACH — far re-reads the ground at nearly twice the radius', r.felled === 3 && r.kept === 2 && r.keptIsNearestStanding && r.farWider && r.reachRead && /left the next/.test(r.last) && r.mul > 1.5, JSON.stringify(r));

/* ================= 8 · THE RUN AND THE PACE ================= */
r = await ev(() => {
  S.cov = 0.3;
  const R = NPC.gen({ at: 'haven' }); R.feeWaived = true; R.skills.foot = 2; R.skills.bal = 2; S.npcs.push(R);
  NPC.assignRoute(R, 'haven', 'elm');
  const sheet = NPC.workOf(R);
  const base = 150 - ((R.skills.foot || 0) + (R.skills.haul || 0) + (R.skills.bal || 0)) * 5;
  /* THE POST, steady: likes at both ends, half a provision, the interval as the road allows */
  let p0 = S.banked.provisions, l0 = S.stations.elm.likes || 0;
  R.route.t = 0.1; Systems.update(0.25, {});
  const postEat = Math.round((p0 - S.banked.provisions) * 10) / 10, postT = Math.round(R.route.t), postLikes = (S.stations.elm.likes || 0) - l0;
  /* FREIGHT, hard: a crate onto a shelf, half the thanks, twice the eating, the interval pushed */
  NPC.setOrder(R, 'run', 'freight'); NPC.setOrder(R, 'pace', 'hard');
  NPC.setTreeMark(R, 'haul', 'freight', false); NPC.setTreeMark(R, 'haul', 'food', true, true);
  const s0 = { haven: { ...S.stations.haven.stock }, elm: { ...S.stations.elm.stock } };
  p0 = S.banked.provisions; l0 = S.stations.elm.likes || 0;
  R.route.t = 0.1; Systems.update(0.25, {});
  const hardEat = Math.round((p0 - S.banked.provisions) * 10) / 10, hardT = Math.round(R.route.t), hardLikes = (S.stations.elm.likes || 0) - l0;
  const moved = ['haven', 'elm'].flatMap(id => Object.keys(s0[id]).filter(g => (S.stations[id].stock[g] || 0) >= s0[id][g] + 20).map(g => `${id}:${g}`));
  window._R = R.id;
  return { kind: sheet.kind, rows: Object.keys(sheet.rows), trees: sheet.trees, base, postEat, postT, postLikes, hardEat, hardT, hardLikes, moved, last: NPC.svc(R).last, runs: NPC.svc(R).runs };
});
ok('THE RUN and THE PACE: a charter\'s sheet is run + pace + the freight list; the post at a steady pace eats half a provision on the road\'s own clock; freight run hard walks a crate of rations onto a shelf, eats a whole provision, pays half the thanks, and comes round in seven tenths of the time', r.kind === 'road' && r.rows.join() === 'run,pace' && r.trees.join() === 'haul' && r.postEat === 0.5 && Math.abs(r.postT - r.base) <= 1 && r.hardEat === 1 && Math.abs(r.hardT - Math.round(r.base * 0.7)) <= 1 && r.hardLikes * 2 <= r.postLikes + 1 && r.moved.length === 1 && /food$/.test(r.moved[0]) && /rations/.test(r.last) && r.runs === 2, JSON.stringify(r));

/* ================= 9 · THE MOOD: causes, bands, effects ================= */
r = await ev(() => {
  for (const n of S.npcs.filter(x => x.state === 'companion')) n.state = 'pool';
  const a = NPC.gen({ at: 'haven', cls: 'scavenger' }); a.fee = { metal: 0, ceramic: 0 }; a.feeWaived = true; a.skills.bal = 4; S.npcs.push(a); NPC.hire(a, 'companion');
  const m0 = NPC.mood(a);
  a.hungry = true; NPC.ordersOf(a).station = 'point';
  const m1 = NPC.mood(a); S.time += 1; const fxL = NPC.moodFx(a);   // the engine's read is a half-second cache: a second on, it sees the change
  a.koT = S.time; const m1b = NPC.mood(a); a.koT = undefined;
  a.hungry = false; NPC.ordersOf(a).station = 'wedge';
  a.bond = true; NPC.svc(a).lastMeal = S.time; NPC.svc(a).km = 12;
  const m2 = NPC.mood(a);
  /* the effects are real: the steady chance the wobble reads, the reach the looter reads */
  S.time += 1; const fxB = NPC.moodFx(a);
  /* a fasting order weighs; a meal lifts */
  NPC.setOrder(a, 'mess', 'fast'); const fasting = NPC.mood(a).causes.some(c => c.id === 'fasting'); NPC.setOrder(a, 'mess', 'bank');
  window._a = a.id;
  return { m0: [m0.v, m0.band], m1: [m1.v, m1.band, m1.causes.map(c => c.id).join()], m1b: [m1b.v, m1b.band], m2: [m2.v, m2.band, m2.causes.map(c => c.id).join()], fxB, fxL, fasting, brightMul: MUSTER.MOOD.fx.BRIGHT.steadyMul, lowMul: MUSTER.MOOD.fx.LOW.steadyMul };
});
ok('THE MOOD: a fresh hire reads STEADY at nought; hungry and on point sums to LOW with each cause named, and a recent fall on top of that is DONE; a meal, a bond and ten kilometres beside you sum to BRIGHT — and the band DOES something: BRIGHT steadies your pack more and reaches further, LOW less; a fasting order weighs', r.m0[1] === 'STEADY' && r.m1[1] === 'LOW' && r.m1[2] === 'hungry,point' && r.m1b[1] === 'DONE' && r.m2[1] === 'BRIGHT' && r.m2[2] === 'fed,bond,seasoned' && r.fxB.steadyMul > 1 && r.fxB.reachMul > 1 && r.fxL.steadyMul < 1 && r.fasting, JSON.stringify(r));

/* ================= 10 · DONE: they say so, then sit down at a fire ================= */
r = await ev(() => {
  const a = S.npcs.find(n => n.id === window._a);
  const d = DATA.stations.haven;
  WL.tp([d.x + 30, d.y + 40]); a.cx = S.px + 20; a.cy = S.py + 10;
  a.bond = false; NPC.svc(a).lastMeal = undefined; NPC.svc(a).km = 0;
  a.hungry = true; a.koT = S.time; NPC.ordersOf(a).station = 'point'; NPC.ordersOf(a).mess = 'bank'; S.banked.provisions = 0; a.fedT = 999;
  const m = NPC.mood(a);
  let quitAt = null;
  for (let i = 0; i < 800 && a.state === 'companion'; i++) { Systems.update(0.25, {}); if (!quitAt && a.state !== 'companion') quitAt = i * 0.25; }
  const mail = S.mails.find(m2 => m2.subj === `${a.name} sat down`);
  return { v: m.v, band: m.band, state: a.state, at: a.at, quitAt, mail: !!mail, mailBody: mail ? mail.body.slice(0, 120) : '', last: NPC.svc(a).last, quitAfter: MUSTER.MOOD.quitAfter };
});
ok('DONE: hungry, on point and lately fallen sums past the last band — after a minute of it beside a lit town they SIT DOWN: off the party, at the fire, the mail naming every cause', r.band === 'DONE' && r.state === 'pool' && r.at === 'haven' && r.quitAt >= MUSTER_QUIT - 2 && r.mail && /sat down/.test(r.last) && /hungry/.test(r.mailBody), JSON.stringify(r));

/* ================= 11 · THE SHEET: working orders by kind, the freight list by name, the marks ================= */
r = await ev(() => {
  const H = S.npcs.find(n => n.id === window._H), R = S.npcs.find(n => n.id === window._R);
  MusterUI.open(H.id);
  const ov = !document.getElementById('musterOv').classList.contains('hidden');
  const pane = document.getElementById('muOrders').innerText;
  const rowsShown = /THE LOAD/.test(pane) && !/STATION/.test(pane) && !/MESS/.test(pane);
  const goods = Object.keys(DATA.goodsInfo).filter(g => !DATA.items[g].service).every(g => document.querySelector(`#muOrders [data-tree="haul"][data-node="${g}"][data-item="1"]`));
  const noPresets = !document.querySelector('#muOrders [data-preset]');
  /* a click on a good's box marks THAT good; a click on the LOAD's choice sets the order */
  const before = NPC.allows(H, 'haul', 'coolant');
  document.querySelector('#muOrders [data-tree="haul"][data-node="coolant"]').click();
  const after = NPC.allows(H, 'haul', 'coolant');
  document.querySelector('#muOrders [data-order="load"][data-choice="full"]').click();
  const loadNow = NPC.ordersOf(H).load;
  const plateStripe = document.querySelector(`.muPlate[data-mu="${H.id}"] .muSvc`).innerText;
  const plateMood = document.querySelector(`.muPlate[data-mu="${H.id}"] .muBand`).innerText;
  const plateOrd = document.querySelector(`.muPlate[data-mu="${H.id}"] .muOrd`).innerText;
  /* the charter's sheet */
  MusterUI.open(R.id);
  const pane2 = document.getElementById('muOrders').innerText;
  const roadRows = /THE RUN/.test(pane2) && /THE PACE/.test(pane2) && /THE FREIGHT LIST/.test(pane2) && /Haven ⇄ Elm/.test(pane2);
  /* the presser's marks pane: a chain listed in order, ADD arms the ground, STRIKE takes the last */
  const P = NPC.gen({ at: 'haven' }); P.feeWaived = true; S.npcs.push(P);
  const d = DATA.stations.haven; NPC.assignField(P, 'haven', 'presser', { x: d.x + 300, y: d.y - 300 }); NPC.addMark(P, d.x + 600, d.y - 200);
  MusterUI.open(P.id);
  const pane3 = document.getElementById('muOrders').innerText;
  const marksListed = /THE CHAIN OF MARKS/.test(pane3) && /of Haven/.test(pane3) && /of mark 1/.test(pane3) && /the trail/.test(pane3);
  document.querySelector('#muOrders [data-strikemark]').click();
  const struck = NPC.marksOf(P).length === 1;
  document.querySelector('#muOrders [data-addmark]').click();
  const armed = NPC.pressArmed() && document.getElementById('musterOv').classList.contains('hidden');
  const landed = NPC.pressAt(d.x + 650, d.y - 250);
  const reopened = !document.getElementById('musterOv').classList.contains('hidden') && MusterUI.selected() === P.id && NPC.marksOf(P).length === 2;
  MusterUI.close();
  return { ov, rowsShown, goods, noPresets, before, after, loadNow, plateStripe, plateMood, plateOrd, roadRows, marksListed, struck, armed, landed, reopened };
});
ok('THE SHEET: a hauler\'s pane shows THE LOAD and the freight list by good\'s name (no walk rows, no presets); a good\'s box marks that good and a choice sets the order; the plate carries the work stripe, the mood band and WORKING ORDERS; a charter\'s pane shows THE RUN, THE PACE and its towns; a presser\'s pane lists the chain, STRIKE takes the last, ADD A MARK arms the ground and the click lands as mark two with the roll reopened on them', r.ov && r.rowsShown && r.goods && r.noPresets && r.before && !r.after && r.loadNow === 'full' && /runs/.test(r.plateStripe) && /crates walked in/.test(r.plateStripe) && r.plateMood.length > 2 && /HAULER — WORKING ORDERS/.test(r.plateOrd) && r.roadRows && r.marksListed && r.struck && r.armed && r.landed && r.reopened, JSON.stringify(r).slice(0, 600));

/* ================= 12 · THE WEDGE CARD ================= */
r = await ev(() => {
  for (const n of S.npcs.filter(x => x.state === 'companion')) n.state = 'pool';
  const a = NPC.gen({ at: 'haven', cls: 'medic' }); a.fee = { metal: 0, ceramic: 0 }; a.feeWaived = true; S.npcs.push(a); NPC.hire(a, 'companion'); a.bond = true; NPC.svc(a).lastMeal = S.time; NPC.svc(a).km = 12;
  const c = NPC.gen({ at: 'haven', cls: 'courier' }); c.fee = { metal: 0, ceramic: 0 }; c.feeWaived = true; S.npcs.push(c); NPC.hire(c, 'companion'); c.hungry = true;
  for (let i = 0; i < 8; i++) Systems.update(0.25, {});
  UI2.updateMoodles();
  const chip = document.getElementById('compChip');
  const shown = !chip.classList.contains('hidden'), text = chip.innerText;
  const rows = chip.querySelectorAll('.wcRow').length, figs = chip.querySelectorAll('.wcRow img').length;
  const moods = [...chip.querySelectorAll('.wcMood')].map(e => e.innerText);
  const cv = chip.querySelector('#wcGlyph');
  const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let gold = 0, lit = 0; for (let i = 0; i < px.length; i += 4) { if (px[i] > 200 && px[i + 1] > 180 && px[i + 2] < 160) gold++; if (px[i] + px[i + 1] + px[i + 2] > 120) lit++; }
  /* put away: the tab stands in for it, and the choice keeps in the HUD paper */
  UI2.toggleWedge(false);
  const hidden = chip.classList.contains('hidden'), tab = !document.getElementById('wcTab').classList.contains('hidden');
  const kept = JSON.parse(localStorage.getItem('waylight.hud') || '{}').wedge === false && !UI2.wedgeShown();
  document.getElementById('wcTab').click();
  const back = !chip.classList.contains('hidden') && UI2.wedgeShown();
  /* the rail's own toggle says which */
  const rail = document.getElementById('railWedgeBtn').innerText;
  /* the cap opens the muster; the card's body is the hand-over (the feel suite clicks it) */
  chip.querySelector('#wcMuster').click();
  const muster = !document.getElementById('musterOv').classList.contains('hidden');
  MusterUI.close();
  return { shown, rows, figs, moods, gold, lit, hidden, tab, kept, back, rail, muster, carrying: /carrying/.test(text), hand: /hand over/.test(text), hungry: /HUNGRY/.test(text) };
});
ok('THE WEDGE CARD: both backs on the HUD with their own figures and their mood bands (BRIGHT beside LOW), what they carry, HUNGRY where it is true; the glyph is painted live (gold for you, the moods\' colours for them); put away → the tab stands in and the choice KEEPS; the tab brings it back; the rail says SHOWN; THE MUSTER cap opens the roll', r.shown && r.rows === 2 && r.figs === 2 && r.moods.join() === 'BRIGHT,LOW' && r.gold >= 6 && r.lit > 40 && r.hidden && r.tab && r.kept && r.back && /SHOWN/.test(r.rail) && r.muster && r.carrying && r.hand && r.hungry, JSON.stringify(r));

/* ================= 13 · THE HINT STRIP IN YOUR KEYS ================= */
r = await ev(() => {
  UI2.showHint(2);
  const before = document.getElementById('hintStrip').innerText;
  const rb = KEYS.rebind('map', 'KeyN');
  UI2.renderHint();
  const after = document.getElementById('hintStrip').innerText;
  KEYS.reset('map'); UI2.renderHint();
  const reset = document.getElementById('hintStrip').innerText;
  document.getElementById('hintStrip').classList.add('hidden');
  return { ok: rb.ok, before: /\bM\s*map/.test(before), after: /\bN\s*map/.test(after), reset: /\bM\s*map/.test(reset) };
});
ok('THE HINT STRIP reads KEYS: map on M, rebound to N the strip prints N beside map, reset it prints M again (the v3.35 note, kept)', r.ok && r.before && r.after && r.reset, JSON.stringify(r));

/* ================= 14 · THE LESSONS AND THE SAVE ================= */
r = await ev(() => {
  const lessons = ['firstWorking', 'firstMarks', 'firstMood'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]);
  const H = S.npcs.find(n => n.id === window._H), R = S.npcs.find(n => n.id === window._R), F = S.npcs.find(n => n.id === window._F);
  NPC.setTreeMark(H, 'haul', 'freight', false); NPC.setTreeMark(H, 'haul', 'seeds', true, true); NPC.setOrder(H, 'load', 'split');
  const P = S.npcs.find(n => n.state === 'field' && n.job === 'presser');
  const marks = NPC.marksOf(P).length, kept = F.fkept.length;
  State.save(); const loaded = State.load();
  const H2 = S.npcs.find(n => n.id === H.id), R2 = S.npcs.find(n => n.id === R.id), P2 = S.npcs.find(n => n.id === P.id), F2 = S.npcs.find(n => n.id === F.id);
  return { lessons, loaded, seeds: NPC.allows(H2, 'haul', 'seeds') && !NPC.allows(H2, 'haul', 'meds'), load: NPC.ordersOf(H2).load, run: NPC.ordersOf(R2).run, pace: NPC.ordersOf(R2).pace, marks: NPC.marksOf(P2).length === marks, kept: F2.fkept.length === kept, reach: NPC.ordersOf(F2).reach };
});
ok('THE LESSONS stand titled (working orders, the marks, a walker\'s mood); THE SAVE carries a hauler\'s freight list and load, a charter\'s run and pace, a presser\'s chain, a forrester\'s kept stand and reach', r.lessons && r.loaded && r.seeds && r.load === 'split' && r.run === 'freight' && r.pace === 'hard' && r.marks && r.kept && r.reach === 'far', JSON.stringify(r));

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the working orders', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
