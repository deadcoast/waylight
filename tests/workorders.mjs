/* workorders.mjs — v3.37 THE WORKING ORDERS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48
   source was lost; its figures sampled on the courier's grid). The field and the roads on the same stores a companion
   keeps: the registries whole and every station good an item under the freight branch; a v3.36 store repaired, never
   purged; THE FREIGHT LIST walking medicine alone, then an honest empty pack; THE LOAD split landing two goods in one
   arrival; THE MARKS as a chain walked in order, struck, measured near-nothing fresh; KEEP THE BEAT walking on at a bare
   trail and COME IN walking them to the fire with the mail; THE RESERVE holding at twenty and resuming; THE WOODS thin
   (three felled, two kept by cell, the nearest standing tree a kept one) and THE REACH re-reading the ground; THE RUN and
   THE PACE to the provision and the second; the mood's sums, bands and effects; a DONE walker sitting down after the
   minute with the mail; the Crew sheet's working panes (the hauler's, the freight list by name, a good's box, the
   charter's, the presser's chain with STRIKE and ADD landing a real click as mark two); the party card (both moods, a
   painted glyph, put away and kept, the tab, the rail, the Crew cap); the hint strip in your keys; the lessons; the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;
await ev(() => {
  window.__toasts = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join(' | ');
  window.__vis = id => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  window.__mail = re => S.mails.find(m => re.test(m.subj)) || null;
  window.__said = []; const say0 = Render.say; Render.say = (x, y, txt, ...rest) => { __said.push(String(txt)); return say0(x, y, txt, ...rest); };
  for (const id of ['elm', 'mill', 'green']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true);
  S.banked.provisions = 400; S.banked.metal = 400; S.banked.ceramic = 60; S.banked.wood = 50;
  window.__field = (name, job, a, b) => { const n = NPC.gen({ at: a, cls: 'courier' }); n.name = name; n.feeWaived = true; S.npcs.push(n); NPC.assignField(n, a, job, b); return n; };
  window.__run = (secs, step = 0.1) => { for (let i = 0; i < secs / step; i++) NPC.update(step); };
  /* a hand walking a route is set at the end of its line: the next step arrives there */
  window.__toEnd = (n, far) => { NPC.update(0.01); const pts = n.fpath.pts, p = far ? pts[pts.length - 1] : pts[0]; n.fx = p[0]; n.fy = p[1]; n.fseg = far ? pts.length - 1 : 0; n.fdirn = far ? 1 : -1; NPC.update(0.01); };
  window.__bare = pts => { for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], k = Math.max(1, Math.ceil(U.dist(x0, y0, x1, y1) / 5)); for (let j = 0; j <= k; j++) World.addWear(x0 + (x1 - x0) * j / k, y0 + (y1 - y0) * j / k, World.W_BARE + 8); } World.flushWear && World.flushWear(); };
});

/* ================= 1 · THE REGISTRIES, WHOLE ================= */
let r = await ev(() => {
  const WO = MUSTER.WORK_ORDERS, v337 = ['load', 'marks', 'reserve', 'reach', 'woods', 'run', 'pace'];
  const rows = v337.every(k => WO[k] && WO[k].choices[WO[k].def] && Object.values(WO[k].choices).every(c => c.name && c.line)) && WO.reserve.floor.twenty === 20 && WO.reach.mul.far === 1.9 && WO.pace.mul.hard === 0.7 && WO.pace.eat.hard === 2 && WO.run.likesMul.freight === 0.5;
  const jobs = MUSTER.FIELD.hauler.rows.join() === 'load' && MUSTER.FIELD.hauler.tree === 'haul' && MUSTER.FIELD.presser.rows.join() === 'marks' && MUSTER.FIELD.mason.rows.join() === 'reserve' && MUSTER.FIELD.forrester.rows.join() === 'reach,woods' && MUSTER.ROAD.rows.join() === 'run,pace' && MUSTER.ROAD.tree === 'haul';
  const H = MUSTER.TREES.haul, tree = H.root === 'freight' && H.def.freight === true && H.def.post === false;
  const goods = Object.keys(DATA.goodsInfo), trade = goods.filter(g => !DATA.items[g].service);
  const filed = goods.every(g => DATA.items[g] && DATA.items[g].cat === 'goods' && Ledger.CHAIN[Ledger.classify(g)].includes('freight')) && trade.every(g => Ledger.classify(g) === 'trade') && goods.filter(g => DATA.items[g].service).every(g => Ledger.classify(g) === 'post');
  const P = {}; Ledger.seedStore(P, 'haul', H.def); const dflt = trade.every(g => Ledger.effectiveIn(P, g, 'haul', { haul: false })) && !Ledger.effectiveIn(P, 'letters', 'haul', { haul: false });
  const kinds = ['walk', 'field', 'road'].join();
  return { rows, jobs, tree, filed, dflt, trade: trade.length, woRows: Object.keys(WO).length, kinds };
});
ok('THE REGISTRIES, WHOLE: seven working-order rows (THE LOAD, THE MARKS, THE RESERVE with its floors, THE REACH ×1.9, THE WOODS, THE RUN at half the thanks for freight, THE PACE at seven tenths and twice the eating — v3.38 added three more for the posts); FIELD and ROAD name the rows each job walks under; THE FREIGHT LIST a third tree rooted on freight (every trade good ON, the post OFF); every station good an item under the freight branch (eleven trade goods, the post\'s own under The Post)',
  r.rows && r.jobs && r.tree && r.filed && r.dflt && r.trade === 11 && r.woRows === 10, JSON.stringify(r));

/* ================= 2 · A v3.36 STORE, REPAIRED, NOT PURGED ================= */
r = await ev(() => {
  const n = NPC.gen({ at: 'haven', cls: 'courier' }); n.name = 'Old Save';
  n.orders = { preset: null, station: 'loose', mess: 'own', stand: 'hold', voice: 'quiet', policy: { resources: { loot: false, hand: true }, junk: { loot: true }, 'item:metal': { hand: false }, wood: { loot: true } } };   // a v3.36 store: loot and hand marks, no haul mark anywhere
  const pack0 = JSON.stringify(Ledger.led().policy), before = JSON.stringify(n.orders.policy);
  const O = NPC.ordersOf(n), P = O.policy;
  const kept = P.resources.loot === false && P.resources.hand === true && P.junk.loot === true && P['item:metal'].hand === false && P.wood.loot === true && O.station === 'loose' && O.mess === 'own' && O.stand === 'hold' && O.voice === 'quiet';
  const seeded = P.freight && P.freight.haul === true && P.post && P.post.haul === false && NPC.allows(n, 'haul', 'meds') && !NPC.allows(n, 'haul', 'letters');
  const rows = O.load === 'full' && O.marks === 'home' && O.reserve === 'none' && O.reach === 'near' && O.woods === 'clear' && O.run === 'post' && O.pace === 'steady';
  return { kept, seeded, rows, pack: JSON.stringify(Ledger.led().policy) === pack0, grew: JSON.stringify(n.orders.policy).length > before.length };
});
ok('A v3.36 STORE, REPAIRED, NOT PURGED: a store saved before the freight list existed (loot and hand marks, no haul mark anywhere) is read by the same ordersOf — every mark it held stands (the Resources and junk and wood sweeps, the metal kept on the Walker\'s back, the four walk orders), the freight list takes its registry default (every trade good ON, the post OFF), the working rows take theirs, and the pack\'s own ledger is untouched',
  r.kept && r.seeded && r.rows && r.pack && r.grew, JSON.stringify(r));

/* ================= 3 · THE FREIGHT LIST: MEDICINE ALONE, THEN AN HONEST EMPTY PACK ================= */
r = await ev(() => {
  const h = __field('Wren Hollis', 'hauler', 'haven', 'elm'); window.__h = h; h.skills.haul = 0;
  NPC.setTreeMark(h, 'haul', 'trade', false); NPC.setTreeMark(h, 'haul', 'meds', true, true);
  const E = S.stations.elm.stock; E.meds = 6;   // Elm Farm out of medicine: a crate there pays the most it can
  const s0 = { ...E }, list = NPC.freightFor(h, 'elm', 'haven'), need0 = Economy.needMul('elm', 'meds');
  __toEnd(h, true);   // into Elm Farm
  const walked = { meds: +(E.meds - s0.meds).toFixed(1), tools: +(E.tools - s0.tools).toFixed(1), filters: +(E.filters - s0.filters).toFixed(1) }, need1 = Economy.needMul('elm', 'meds');
  NPC.setTreeMark(h, 'haul', 'meds', false, true);
  const s1 = { ...E }; __toEnd(h, true);
  const empty = JSON.stringify({ ...E }) === JSON.stringify(s1) && h.fempty === 1 && /walked into Elm Farm empty — nothing on the freight list/.test(NPC.svc(h).last) && /with an empty pack/.test(__toasts());
  const n0 = document.querySelectorAll('#toasts .toast').length; __toEnd(h, true); const once = h.fempty === 2 && !/with an empty pack/.test([...document.querySelectorAll('#toasts .toast')].slice(n0).map(t => t.textContent).join(''));
  return { list, walked, cap: DATA.T.haulCap, need: [need0, need1], mul: [DATA.T.needMul.critical, DATA.T.needMul.wanting], empty, once, runs: NPC.svc(h).runs };
});
ok('THE FREIGHT LIST: a hauler whose list holds medicine alone walks medicine into Elm Farm — its shelf up by the load (the town OUT of it no longer: what a crate of medicine pays there eases from ×2.2 to ×1.5), the town\'s other needs untouched; with nothing Elm wants left on the list the pack arrives EMPTY, the roll says so in the walker\'s words and a notice says it once (the next empty run is counted, not said again)',
  r.list.join() === 'meds' && r.walked.meds === Math.min(r.cap, r.walked.meds) && r.walked.meds > 0 && r.walked.tools === 0 && r.walked.filters === 0 && r.need[0] === r.mul[0] && r.need[1] === r.mul[1] && r.need[0] > r.need[1] && r.empty && r.once && r.runs === 3, JSON.stringify(r));

/* ================= 4 · THE LOAD, SPLIT ================= */
r = await ev(() => {
  const h = __h; NPC.setTreeMark(h, 'haul', 'trade', true);
  const E = S.stations.elm.stock; E.meds = 20; E.tools = 30; E.filters = 60;
  const full = NPC.freightFor(h, 'elm', 'haven');
  NPC.setOrder(h, 'load', 'split'); const s0 = { ...E };
  __toEnd(h, true);
  return { full, d: { tools: +(E.tools - s0.tools).toFixed(1), meds: +(E.meds - s0.meds).toFixed(1), filters: +(E.filters - s0.filters).toFixed(1) }, last: NPC.svc(h).last, cap: DATA.T.haulCap };
});
ok('THE LOAD, SPLIT: split, a hauler walks two goods at half the load each — what the other end makes first (Haven\'s tools), then the emptiest allowed shelf (medicine) — so two of Elm Farm\'s shelves climb in ONE arrival, the third untouched; the roll says both in its own words',
  r.full.slice(0, 2).join() === 'tools,meds' && r.d.tools === r.cap / 2 && r.d.meds === r.cap / 2 && r.d.filters === 0 && /walked 6 tools and 6 medicine into Elm Farm|walked .* and .* into Elm Farm/.test(r.last), JSON.stringify(r));

/* ================= 5 · THE MARKS: A CHAIN WALKED IN ORDER, STRUCK, MEASURED FRESH ================= */
r = await ev(() => {
  const H = DATA.stations.haven;
  const open = (x, y) => { const t = World.terrainAt(x, y); return !t.blocked && !t.water; };
  let m1 = null, m2 = null;
  for (const [dx, dy] of [[420, 240], [380, -260], [-420, 260], [460, 60], [-400, -240]]) if (open(H.x + dx, H.y + dy) && open(H.x + dx * 1.7, H.y + dy * 1.1)) { m1 = { x: H.x + dx, y: H.y + dy }; m2 = { x: H.x + dx * 1.7, y: H.y + dy * 1.1 }; break; }
  const p = __field('Ansel Brook', 'presser', 'haven', m1); window.__p = p; window.__m = [m1, m2];
  const one = NPC.marksOf(p).length;
  NPC.addMark(p, m2.x, m2.y);
  NPC.update(0.01);
  const pts = p.fpath.pts, near = m => pts.reduce((b, q, i) => U.dist(q[0], q[1], m.x, m.y) < U.dist(pts[b][0], pts[b][1], m.x, m.y) ? i : b, 0);
  const i1 = near(m1), i2 = near(m2), d1 = U.dist(pts[i1][0], pts[i1][1], m1.x, m1.y), d2 = U.dist(pts[i2][0], pts[i2][1], m2.x, m2.y);
  const fresh = World.trailState(pts);
  const order = i1 < i2 && d1 < 30 && d2 < 30 && U.dist(pts[0][0], pts[0][1], H.x, H.y) < 30;
  const struck = NPC.strikeMark(p) && NPC.marksOf(p).length === 1 && NPC.marksOf(p)[0].x === Math.round(m1.x), never = !NPC.strikeMark(p) && NPC.marksOf(p).length === 1;
  NPC.addMark(p, m2.x, m2.y);
  return { one, two: NPC.marksOf(p).length, order, i1, i2, fresh: { frac: +fresh.frac.toFixed(3), total: fresh.total }, struck, never, lesson: !!S.flags.tut.firstMarks };
});
ok('THE MARKS: a presser\'s clicked point is the first of a chain and a second mark appends — the walked line is the valley\'s own path from the town through mark one and then mark two, in order; STRIKE takes the last mark and never the first; measured at the start the fresh line is near-nothing bare',
  r.one === 1 && r.two === 2 && r.order && r.fresh.total > 20 && r.fresh.frac < 0.1 && r.struck && r.never && r.lesson, JSON.stringify(r));

/* ================= 6 · KEEP THE BEAT, AND COME IN ================= */
r = await ev(() => {
  const p = __p; NPC.update(0.01); const pts = p.fpath.pts;
  /* first the line only TRODDEN — every wearable cell past the trampling mark and short of bare: dirt is not a trail yet */
  const cells = []; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], k = Math.max(1, Math.ceil(U.dist(x0, y0, x1, y1) / 5)); for (let j = 0; j <= k; j++) cells.push([x0 + (x1 - x0) * j / k, y0 + (y1 - y0) * j / k]); }
  const fresh = cells.filter(([x, y]) => World.wearAt(x, y) < World.W_TRAMPLE);
  for (const [x, y] of cells) for (let g = 0; g < 40 && World.wearAt(x, y) < World.W_TRAMPLE + 6; g++) World.addWear(x, y, 2);
  World.flushWear && World.flushWear();
  const worn = fresh.map(([x, y]) => World.wearAt(x, y)).filter(w => w > 0), band = worn.filter(w => w >= World.W_TRAMPLE && w < World.W_BARE).length / Math.max(1, worn.length);
  __toEnd(p, true);   // COME IN is the order they walk under
  const trod = { state: p.state, frac: +p.ftrail.frac.toFixed(3), band: +band.toFixed(3), cells: worn.length };
  __bare(pts);
  NPC.setOrder(p, 'marks', 'keep');
  __toEnd(p, true);
  const keep = { state: p.state, frac: +p.ftrail.frac.toFixed(3) };
  NPC.setOrder(p, 'marks', 'home');
  __toEnd(p, false);
  return { trod, keep, home: { state: p.state, at: p.at, mail: !!__mail(/^Ansel Brook came in$/), said: /BARE end to end/.test(__toasts()), last: NPC.svc(p).last }, done: MUSTER.TRAIL_DONE, marks: [World.W_TRAMPLE, World.W_BARE] };
});
ok('KEEP THE BEAT, AND COME IN: a chain only trodden to dirt (every wearable cell past the trampling mark and short of bare) is measured at the end for what it is — near-nothing bare — and under COME IN the presser walks on; walked bare end to end, under KEEP THE BEAT they walk on still (in the field, the trail read at a hundred per cent), and under COME IN the same measure walks them to Haven\'s fire off the job, with the mail and the notice, and the wage stops with the work',
  r.trod.state === 'field' && r.trod.band > 0.9 && r.trod.cells > 20 && r.trod.frac < 0.1 && r.keep.state === 'field' && r.keep.frac >= 0.99 && r.home.state === 'pool' && r.home.at === 'haven' && r.home.mail && r.home.said && /came in/.test(r.home.last), JSON.stringify(r));

/* ================= 7 · THE RESERVE, HOLDING AND RESUMING ================= */
r = await ev(() => {
  const m = __field('Dace Mortar', 'mason', 'haven', 'elm'); window.__mason = m;
  NPC.update(0.01); __bare(m.fpath.pts);
  NPC.setOrder(m, 'reserve', 'twenty'); S.banked.ceramic = 22;
  let laid0 = NPC.svc(m).laid || 0;
  for (let i = 0; i < 400 && !m.fstall; i++) NPC.update(0.1);
  const held = { ceramic: S.banked.ceramic, stall: !!m.fstall, laid: (NPC.svc(m).laid || 0) - laid0, last: NPC.svc(m).last, said: /holds at the reserve — 20 slabs stay banked/.test(__toasts()) };
  S.banked.ceramic = 30; laid0 = NPC.svc(m).laid || 0;
  for (let i = 0; i < 400 && S.banked.ceramic === 30; i++) NPC.update(0.1);
  return { held, resumed: { ceramic: S.banked.ceramic, stall: !!m.fstall, laid: (NPC.svc(m).laid || 0) - laid0 } };
});
ok('THE RESERVE, HOLDING AND RESUMING: a mason told to keep twenty lays the bank\'s slabs only down to that floor — at twenty the laying stops and the roll and a notice say it is holding the reserve; bank more and the cobbling resumes on the same trail',
  r.held.ceramic === 20 && r.held.stall && r.held.laid > 0 && /holding the reserve of 20/.test(r.held.last) && r.held.said && r.resumed.ceramic < 30 && !r.resumed.stall && r.resumed.laid > 0, JSON.stringify(r));

/* ================= 8 · THE WOODS, THIN; THE REACH, RE-READ ================= */
r = await ev(() => {
  const f = __field('Tove Axe', 'forrester', 'green', null); window.__f = f;
  NPC.setOrder(f, 'woods', 'thin');
  for (let i = 0; i < 1200 && (NPC.svc(f).felled || 0) < 3; i++) NPC.update(0.1);
  const H = DATA.stations.green, felled = NPC.svc(f).felled || 0, kept = (f.fkept || []).slice();
  const nearest = World.nearestForest(H.x, H.y, DATA.T.fellRadius, null), keptNearest = !!nearest && kept.includes(nearest.i);
  /* THE REACH: at Pharos no wood stands within the near reach; far re-reads the ground nearly twice as wide */
  const g = __field('Ivar Far', 'forrester', 'pharos', null); window.__g = g; const P = DATA.stations.pharos;
  NPC.update(0.1); const nearNone = !g.ftarget && /woods at Pharos Point are CLEARED|woods at .* are CLEARED/.test(__toasts()) && !!__mail(/^Ivar Far leans on the axe$/);
  NPC.setOrder(g, 'reach', 'far'); const reread = g.ftarget === null && g.fcleared === true;
  NPC.update(0.1);
  const far = g.ftarget && Math.round(U.dist(g.ftarget.x, g.ftarget.y, P.x, P.y));
  return { felled, kept: kept.length, keptNearest, last: NPC.svc(f).last, nearNone, reread, far, near: DATA.T.fellRadius };
});
ok('THE WOODS, THIN; THE REACH, RE-READ: a forrester told to thin fells three trees and keeps two by cell, for good — after each fell the next tree the axe would take is kept and the one past it falls — so the nearest standing tree to the Greenhouse is a kept one; at Pharos, where nothing stands within the near reach (the woods read CLEARED, the mail), THE REACH set far re-reads the ground and the axe walks to a tree nearly twice as far out',
  r.felled === 3 && r.kept === 2 && r.keptNearest && /felled a tree, left the next/.test(r.last) && r.nearNone && r.reread && r.far > r.near && r.far <= r.near * 1.9, JSON.stringify(r));

/* ================= 9 · THE RUN AND THE PACE ================= */
r = await ev(() => {
  const c = NPC.gen({ at: 'haven', cls: 'courier' }); c.name = 'Rook Carrow'; c.feeWaived = true; S.npcs.push(c); window.__c = c;
  c.state = 'route'; c.route = { a: 'haven', b: 'elm', t: 0.01, runs: 0 };
  const skill = (c.skills.foot || 0) + (c.skills.haul || 0) + (c.skills.bal || 0), base = U.clamp(150 - skill * 5, 75, 150);
  const run = () => { const p0 = S.banked.provisions, lA = S.stations.haven.likesTo, lB = S.stations.elm.likesTo, sA = { ...S.stations.haven.stock }, sB = { ...S.stations.elm.stock }; c.route.t = 0.001; NPC.update(0.01); return { eat: +(p0 - S.banked.provisions).toFixed(2), next: +c.route.t.toFixed(2), likesA: +(S.stations.haven.likesTo - lA).toFixed(1), likesB: +(S.stations.elm.likesTo - lB).toFixed(1), dA: Object.keys(sA).filter(k => S.stations.haven.stock[k] !== sA[k]), dB: Object.keys(sB).filter(k => S.stations.elm.stock[k] !== sB[k]) }; };
  const steady = run();
  NPC.setOrder(c, 'pace', 'hard'); const hard = run();
  NPC.setOrder(c, 'pace', 'steady'); NPC.setOrder(c, 'run', 'freight');
  const want = [NPC.freightFor(c, 'elm', 'haven')[0], NPC.freightFor(c, 'haven', 'elm')[0]], fr1 = run(), fr2 = run();
  /* on freight the charter still carries the wire between its ends as before: one more on the flow while it walks, fed */
  const flowWalk = Economy.flowMul('haven', 'elm'); c.state = 'pool'; const flowNone = Economy.flowMul('haven', 'elm'); c.state = 'route';
  c.hungry = true; const flowHungry = Economy.flowMul('haven', 'elm'); c.hungry = false;
  return { base, steady, hard, fr1, fr2, want, per: DATA.T.stockPerCrate, runs: c.route.runs, flow: [+flowNone.toFixed(2), +flowWalk.toFixed(2), +flowHungry.toFixed(2)] };
});
ok('THE RUN AND THE PACE, TO THE PROVISION AND THE SECOND: a charter on THE POST eats half a provision a run and comes round on its interval, paying thanks at both ends; HARD comes round in seven tenths of the time and eats twice for it (a whole provision); FREIGHT walks a crate from the freight list onto a shelf of the ends in turn (what the other end makes first, then the emptiest) — Elm Farm\'s, then Haven\'s — for half the thanks, the charter carrying the wire between its ends all the while (the flow one higher while it walks fed, nothing from a hungry one)',
  r.steady.eat === 0.5 && r.steady.next === r.base && r.steady.likesA > 0 && r.steady.likesA === r.steady.likesB && r.hard.eat === 1 && Math.abs(r.hard.next - r.base * 0.7) < 0.02 && r.fr1.eat === 0.5 && r.fr1.dB.join() === r.want[0] && r.fr1.dA.length === 0 && r.fr1.likesB === Math.round(r.steady.likesB * 0.5) && r.fr2.dA.join() === r.want[1] && r.fr2.dB.length === 0
  && Math.abs(r.flow[1] - r.flow[0] - 1) < 1e-6 && r.flow[2] === r.flow[0], JSON.stringify(r));

/* ================= 10 · THE MOOD: SUMS, BANDS AND EFFECTS ================= */
r = await ev(() => {
  const H = DATA.stations.haven; WL.tp([H.x + 520, H.y + 260]); S.speed = 0; S.dir = 0;
  const a = NPC.gen({ at: 'haven', cls: 'courier' }); a.name = 'Mira Tallow'; a.feeWaived = true; S.npcs.push(a); NPC.hire(a, 'companion'); window.__a = a;
  const sum = m => m.causes.reduce((s, c) => s + c.v, 0) === m.v;
  const fresh = NPC.mood(a);
  a.bond = true; NPC.svc(a).km = 12; NPC.svc(a).lastMeal = S.time; a.carry = [];
  const b = NPC.gen({ at: 'haven', cls: 'courier' }); b.name = 'Sol Ferris'; b.feeWaived = true; S.npcs.push(b); NPC.hire(b, 'companion'); window.__b = b;
  const bright = NPC.mood(a), fxB = NPC.moodFx(a);
  a.bond = false; NPC.svc(a).km = 0; delete NPC.svc(a).lastMeal; b.state = 'pool';
  a.hungry = true; const low = NPC.mood(a); NPC.moodCached(a); S.time += 1; const fxL = NPC.moodFx(a);
  NPC.setOrder(a, 'station', 'point'); const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.85; S.speed = 20;
  const done = NPC.mood(a); S.time += 1; const fxD = NPC.moodFx(a);
  /* the band change is said on the ground in the walker's own lines */
  __said.length = 0; a.moodBand = 'STEADY'; NPC.update(2.1);
  const said = __said.some(l => MUSTER.MOOD.lines.DONE.includes(l));
  S.speed = 0; a.hungry = false; NPC.setOrder(a, 'station', 'wedge'); S.time = Math.floor(S.time / DL) * DL + DL * 0.3; b.state = 'companion'; b.cx = S.px - 40; b.cy = S.py;
  return { fresh: [fresh.v, fresh.band], bright: [bright.v, bright.band, sum(bright), bright.causes.map(c => c.id).join()], fxB, low: [low.v, low.band, sum(low)], fxL, done: [done.v, done.band, sum(done), done.causes.map(c => c.id).join()], fxD, said, lesson: !!S.flags.tut.firstMood };
});
ok('THE MOOD: summed live from causes the game tracks — a fresh hire reads STEADY at nought; a bond, company, the road\'s ten kilometres and a meal sum to BRIGHT (the pack steadied ×1.3, the reach ×1.15); hungry reads LOW (×0.7, ×0.85); hungry, walking nights on point reads DONE (×0.5, ×0.7) — every sum exactly its causes — and the band change is said on the ground in the walker\'s own words; the lesson',
  r.fresh[0] === 0 && r.fresh[1] === 'STEADY' && r.bright[1] === 'BRIGHT' && r.bright[2] && r.fxB.steadyMul === 1.3 && r.fxB.reachMul === 1.15 && r.low[1] === 'LOW' && r.low[2] && r.fxL.steadyMul === 0.7 && r.fxL.reachMul === 0.85 && r.done[1] === 'DONE' && r.done[2] && r.fxD.steadyMul === 0.5 && r.fxD.reachMul === 0.7 && r.said && r.lesson, JSON.stringify(r));

/* ================= 11 · A DONE WALKER SITS DOWN AFTER THE MINUTE ================= */
r = await ev(() => {
  const a = __a, b = __b, H = DATA.stations.haven; b.state = 'pool'; a.moodBand = undefined; a.doneT = 0;
  WL.tp([H.x + 10, H.y + 30]); S.dir = 0; a.cx = S.px + 30; a.cy = S.py; a.hungry = true; a.fedT = 9999; NPC.setOrder(a, 'station', 'point');
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.85; S.speed = 20;
  const crate = State.makeItem('metal'); a.carry = [crate];
  let t = 0; const band0 = NPC.mood(a).band;
  for (let i = 0; i < 40 && a.state === 'companion'; i++) { NPC.update(2); t += 2; S.speed = 20; }
  S.speed = 0; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
  const m = __mail(/^Mira Tallow sat down$/);
  const out = { band0, t, state: a.state, at: a.at, racked: S.stations.haven.storage.includes(crate), mail: !!m, causes: !!m && /hungry/.test(m.body) && /walking nights/.test(m.body), toast: /sits down at .* fire — they were DONE/.test(__toasts()) };
  a.hungry = false; a.fedT = 360; NPC.hire(a, 'companion'); NPC.setOrder(a, 'station', 'wedge'); b.state = 'companion'; b.cx = S.px - 40; b.cy = S.py;
  out.rehired = a.state === 'companion';
  return out;
});
ok('A DONE WALKER SITS DOWN AFTER THE MINUTE: a companion DONE beside a lit town says so and, a minute on, sits down — off the party and into the pool at Haven\'s fire, what they carried racked in the lockers, a mail naming every cause (hungry, walking nights, walking point) — and hires again, no fee, when it lifts',
  r.band0 === 'DONE' && r.t >= 60 && r.t <= 66 && r.state === 'pool' && r.at === 'haven' && r.racked && r.mail && r.causes && r.toast && r.rehired, JSON.stringify(r));

/* ================= 12 · THE CREW SHEET'S WORKING PANES ================= */
await ev(() => { MusterUI.open(__h.id); });
await page.waitForTimeout(250);
const hauler = await ev(() => { const b = document.getElementById('muOrders'); return { medsName: DATA.goodsInfo.meds.name, load: [...b.querySelectorAll('[data-order="load"]')].map(x => x.textContent), list: [...b.querySelectorAll('.muTreeRow .lgName')].map(x => x.textContent), goods: [...b.querySelectorAll('.muKid span:last-child')].map(x => x.textContent), head: b.querySelector('.muSub').textContent }; });
await page.click('#muOrders .lgBox[data-tree="haul"][data-node="meds"][data-item="1"]'); await page.waitForTimeout(150);
const box = await ev(() => ({ meds: NPC.allows(__h, 'haul', 'meds'), tools: NPC.allows(__h, 'haul', 'tools'), trade: Ledger.markStateIn(__h.orders.policy, 'trade', 'haul') }));
await page.click('#muOrders [data-order="load"][data-choice="full"]'); await page.waitForTimeout(150);
const loadSet = await ev(() => ({ load: NPC.ordersOf(__h).load, lesson: !!S.flags.tut.firstWorking }));
await ev(() => { MusterUI.open(__c.id); });
await page.waitForTimeout(200);
const charter = await ev(() => { const b = document.getElementById('muOrders'); return { run: [...b.querySelectorAll('[data-order="run"]')].map(x => x.textContent), pace: [...b.querySelectorAll('[data-order="pace"]')].map(x => x.textContent), freight: !!b.querySelector('.lgBox[data-tree="haul"]'), head: b.querySelector('.muSub').textContent }; });
await ev(() => { const p = NPC.gen({ at: 'haven', cls: 'courier' }); p.name = 'Pell Marker'; p.feeWaived = true; S.npcs.push(p); NPC.assignField(p, 'haven', 'presser', __m[0]); NPC.addMark(p, __m[1].x, __m[1].y); window.__p2 = p; MusterUI.open(p.id); });
await page.waitForTimeout(200);
const chain = await ev(() => { const b = document.getElementById('muOrders'); return { rows: b.querySelectorAll('.muMarkRow').length, strike: !!b.querySelector('[data-strikemark]'), add: !!b.querySelector('[data-addmark]'), head: /THE CHAIN OF MARKS/.test(b.textContent) }; });
await page.click('#muOrders [data-strikemark]'); await page.waitForTimeout(150);
const struck = await ev(() => NPC.marksOf(__p2).length);
await page.click('#muOrders [data-addmark]'); await page.waitForTimeout(200);
const armed = await ev(() => ({ closed: !__vis('musterOv'), armed: NPC.pressArmed() }));
const spot = await ev(() => { const x = __m[1].x, y = __m[1].y; WL.timeScale = 0.001; Render.cam.x = x; Render.cam.y = y; WL.tp([x + 200, y + 150]); return null; });
await page.waitForTimeout(300);
const scr = await ev(() => {
  const p = __toScr(__m[1].x, __m[1].y);
  /* the nearest screen point over the mark where the ground itself takes the click (no card or notice above it) */
  for (let rr = 0; rr < 80; rr += 8) for (let a = 0; a < 6.28; a += 0.8) { const x = Math.round(p.x + Math.cos(a) * rr), y = Math.round(p.y + Math.sin(a) * rr), el = document.elementFromPoint(x, y); if (el && el.id === 'game') return { x, y, top: el.id, any: UI.anyModal() }; if (rr === 0) break; }
  return { x: Math.round(p.x), y: Math.round(p.y), top: (document.elementFromPoint(p.x, p.y) || {}).id, any: UI.anyModal() };
});
await page.mouse.click(scr.x, scr.y);
await page.waitForTimeout(300);
const landed = await ev(() => { const mk = NPC.marksOf(__p2); return { n: mk.length, near: mk.length === 2 && U.dist(mk[1].x, mk[1].y, __m[1].x, __m[1].y) < 60, reopened: __vis('musterOv') && MusterUI.selected() === __p2.id }; });
await ev(() => { MusterUI.close(); WL.timeScale = 1; });
ok('THE CREW SHEET\'S WORKING PANES: the hauler\'s pane reads its working orders (THE LOAD, full or split) and THE FREIGHT LIST by name — All freight, The Post, Trade goods with every good named — and a real click on one good\'s box moves that good alone (Trade reads MIXED); the charter\'s pane reads THE RUN and THE PACE over the freight list; the presser\'s pane reads THE CHAIN OF MARKS with STRIKE (a real click takes the last mark) and ADD A MARK — which folds the sheet and arms the ground, and a real click on the ground lands as mark two, the sheet reopening on the presser',
  hauler.load.join() === 'Full,Split' && ['All freight', 'The Post', 'Trade goods'].every(x => hauler.list.includes(x)) && hauler.goods.length === 11 && hauler.goods.includes(hauler.medsName) && !box.meds && box.tools && box.trade === 'mixed' && loadSet.load === 'full' && loadSet.lesson && charter.run.join() === 'The post,Freight' && charter.pace.join() === 'Steady,Hard' && charter.freight && chain.head && chain.rows >= 3 && chain.strike && chain.add && struck === 1 && armed.closed && armed.armed && landed.n === 2 && landed.near && landed.reopened, JSON.stringify({ hauler, box, loadSet, charter, chain, struck, armed, scr, landed }));

/* ================= 13 · THE PARTY CARD ================= */
await ev(async () => {
  const a = __a, b = __b; WL.timeScale = 1; UI.closeAllModals(); UI.toggleMap(false);
  const H = DATA.stations.haven; WL.tp([H.x + 520, H.y + 260]); S.speed = 0; a.cx = S.px - 40; a.cy = S.py; b.cx = S.px - 50; b.cy = S.py + 30;
  a.bond = true; NPC.svc(a).km = 12; NPC.svc(a).lastMeal = S.time; b.hungry = true; b.fedT = 9999;   // one BRIGHT, one LOW
  try { localStorage.removeItem('waylight.hud'); } catch (e) {}
  UI2.toggleWedge(true); UI2.updateMoodles(); await __wait(300);
  /* the glyph paints each back in its CACHED mood (NPC.moodCached: half a second of the world's clock), the card's rows in its
     fresh one — so the moods just set reach the glass only once that cache has turned over (300 ms alone could read a back
     still painted in the mood it had before: the LOW dot drawn STEADY). Wait for the turn, then hold the clock and stand both
     backs where they were staged, in the Walker's own frame (facing east), so the paint read is the paint of that moment */
  for (let i = 0; i < 40 && [a, b].some(n => NPC.moodCached(n).band !== NPC.mood(n).band); i++) await __wait(50);
  WL.timeScale = 0.001; S.dir = 0; a.cx = S.px - 40; a.cy = S.py; b.cx = S.px - 50; b.cy = S.py + 30;
});
r = await ev(() => {
  UI2.updateMoodles();   // the card and its glyph painted afresh, now, from the turned-over cache
  const chip = document.getElementById('compChip'), rows = [...chip.querySelectorAll('.wcRow')];
  const moods = rows.map(rw => ({ name: rw.querySelector('.nm').textContent.split(' ')[0], band: rw.querySelector('.wcMood').textContent, col: rw.querySelector('.wcMood').style.color, why: rw.querySelector('.wcMood').title, fig: rw.querySelector('img').complete && rw.querySelector('img').naturalWidth > 0, hungry: /HUNGRY/.test(rw.textContent), kg: /carrying/.test(rw.textContent) }));
  const cv = document.getElementById('wcGlyph'), W = cv.width, H2 = cv.height, d = cv.getContext('2d').getImageData(0, 0, W, H2).data;
  const px = hex => __count(d, __hex(hex), 20);
  const bandCol = b => MUSTER.MOOD.bands.find(x => x[1] === b)[2];
  /* each mark read where the glyph puts it — the Walker's gold square at the centre, each back's 3×3 dot at its live spot in
     the Walker's frame — and counted in that square alone: a count over the whole glyph takes in other marks' edges (the
     Walker's square stands on a fractional row, and its blended top row reads inside the LOW band's tolerance) */
  const ca = Math.cos(S.dir), sa = Math.sin(S.dir), pa = Math.cos(S.dir + Math.PI / 2), ps = Math.sin(S.dir + Math.PI / 2), cxp = W / 2, cyp = H2 * 0.6, k = 0.26;
  const sq = (x, y, hex) => { const c = __hex(hex); let n = 0; for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) { const i = (yy * W + xx) * 4; if (Math.abs(d[i] - c[0]) < 20 && Math.abs(d[i + 1] - c[1]) < 20 && Math.abs(d[i + 2] - c[2]) < 20) n++; } return n; };
  const spots = NPC.party().map(n => { const dx = n.cx - S.px, dy = n.cy - S.py, b2 = dx * ca + dy * sa, s2 = dx * pa + dy * ps, x = U.clamp(Math.round(cxp + s2 * k), 1, W - 3), y = U.clamp(Math.round(cyp - b2 * k), 1, H2 - 3), band = NPC.moodCached(n).band; return { name: n.name.split(' ')[0], band, at: [x, y], n: sq(x, y, bandCol(band)) }; });
  WL.timeScale = 1;
  return { shown: __vis('compChip') && UI2.wedgeShown(), moods, you: px('#ffd98f'), youAt: sq(cxp, Math.round(cyp), '#ffd98f'), dots: moods.map(m => px(bandCol(m.band))), spots, cap: !!chip.querySelector('#wcMuster') && chip.querySelector('#wcMuster').textContent };
});
await page.click('#compChip #wcHide'); await page.waitForTimeout(250);
const hidden = await ev(() => ({ chip: __vis('compChip'), tab: __vis('wcTab'), kept: JSON.parse(localStorage.getItem('waylight.hud') || '{}').wedge, rail: document.getElementById('railWedgeBtn').textContent }));
await page.click('#wcTab'); await page.waitForTimeout(250);
const back = await ev(() => ({ chip: __vis('compChip'), tab: __vis('wcTab'), kept: JSON.parse(localStorage.getItem('waylight.hud') || '{}').wedge }));
await ev(async () => { UI.toggleMap(true); await __wait(200); });
await page.click('#railWedgeBtn'); await page.waitForTimeout(200);
const viaRail = await ev(() => ({ shown: UI2.wedgeShown(), rail: document.getElementById('railWedgeBtn').textContent }));
await page.click('#railWedgeBtn'); await page.waitForTimeout(200);
const viaRail2 = await ev(() => { const o = { shown: UI2.wedgeShown(), rail: document.getElementById('railWedgeBtn').textContent }; UI.toggleMap(false); return o; });
await page.waitForTimeout(300);
await page.click('#compChip #wcMuster'); await page.waitForTimeout(300);
const crewCap = await ev(() => { const o = __vis('musterOv'); MusterUI.close(); __b.hungry = false; __b.fedT = 360; return o; });
ok('THE PARTY CARD (v3.49: the plain names): every back walking with the Walker on one glass — their own figure, first name, the mood band in its colour with the causes on hover (one BRIGHT, one LOW), what they carry, HUNGRY where true — and the live formation glyph painted, read once its half-second mood cache has turned over (the Walker\'s gold square whole at the centre, each back\'s 3×3 dot whole at its own spot in the Walker\'s frame, in the band its row reads); the − cap puts it away with a slim tab in its place and the choice kept (waylight.hud); the tab brings it back; the map\'s rail reads PARTY CARD · SHOWN or HIDDEN and toggles it; the CREW cap opens the roll',
  r.shown && r.moods.length === 2 && r.moods.some(m => m.band === 'BRIGHT') && r.moods.some(m => m.band === 'LOW' && m.hungry) && r.moods.every(m => m.fig && m.kg && m.col && m.why) && r.youAt === 9 && r.spots.length === 2 && r.spots.every(sp => { const m = r.moods.find(x => x.name === sp.name); return !!m && sp.band === m.band && sp.n === 9; }) && r.cap === 'CREW' && !hidden.chip && hidden.tab && hidden.kept === false && /HIDDEN/.test(hidden.rail) && back.chip && !back.tab && back.kept === true && !viaRail.shown && /HIDDEN/.test(viaRail.rail) && viaRail2.shown && /SHOWN/.test(viaRail2.rail) && crewCap, JSON.stringify({ r, hidden, back, viaRail, viaRail2, crewCap }));

/* ================= 14 · THE HINT STRIP IN YOUR KEYS ================= */
await ev(() => { UI2.renderHint(); ManualUI.open('controls'); });
const hint0 = await ev(() => document.getElementById('hintStrip').innerHTML);
await page.click('#fmBody .fmCap[data-act="map"]:not(.fixed)'); await page.waitForTimeout(150);
await page.keyboard.press('n'); await page.waitForTimeout(150);
const hint1 = await ev(() => document.getElementById('hintStrip').innerHTML);
await page.click('#fmBody [data-fmreset="all"]'); await page.waitForTimeout(150);
const hint2 = await ev(() => { const h = document.getElementById('hintStrip').innerHTML; ManualUI.close(); return h; });
ok('THE HINT STRIP IN YOUR KEYS: the rail\'s hint strip prints the caps KEYS holds now — rebind the map to N in the manual (a real click on its cap and a real N) and the strip reads N beside map at once; reset, and it reads M again',
  /<span class="k">M<\/span>map/.test(hint0) && /<span class="k">N<\/span>map/.test(hint1) && /<span class="k">M<\/span>map/.test(hint2), JSON.stringify({ hint0: hint0.slice(0, 200), hint1: (hint1.match(/<span class="k">[^<]*<\/span>map/) || [])[0], hint2: (hint2.match(/<span class="k">[^<]*<\/span>map/) || [])[0] }));

/* ================= 15 · THE LESSONS ================= */
r = await ev(() => {
  const ids = ['firstWorking', 'firstMarks', 'firstMood'];
  ManualUI.open('lessons'); const L = [...document.querySelectorAll('#fmBody .fmLesson')], keys = Object.keys(DATA.tutorials);
  const open = ids.map(k => { const el = L[keys.indexOf(k)]; return !!el && !el.classList.contains('sealed'); });
  ManualUI.close();
  return { titled: ids.map(k => DATA.tutorialTitles[k]), walked: ids.map(k => !!S.flags.tut[k]), open };
});
ok('THE LESSONS: three pages — working orders, the marks, a walker\'s mood — titled in the manual, each walked where the road taught it here (the first working order set on the sheet, the second mark, the band that fell) and open in full on the manual\'s Lessons tab',
  r.titled.join() === 'Working orders,The marks,A walker\'s mood' && r.walked.every(Boolean) && r.open.every(Boolean), JSON.stringify(r));

/* ================= 16 · THE SAVE ================= */
r = await ev(() => {
  const pick = n => JSON.stringify({ o: n.orders, st: n.state, job: n.job || null, marks: n.route && n.route.marks || null, kept: n.fkept || null, svc: n.svc ? { runs: n.svc.runs || 0, crates: n.svc.crates || 0, felled: n.svc.felled || 0, laid: n.svc.laid || 0, last: n.svc.last } : null, fempty: n.fempty || 0 });
  const who = [__h, __p2, __mason, __f, __c].map(n => n.id), before = who.map(id => pick(S.npcs.find(n => n.id === id)));
  State.save(); const okL = State.load();
  const after = who.map(id => pick(S.npcs.find(n => n.id === id)));
  return { okL, same: JSON.stringify(before) === JSON.stringify(after), jobs: who.map(id => { const n = S.npcs.find(x => x.id === id); return n.job || n.state; }) };
});
ok('THE SAVE: the working orders survive a save and load on every store — the hauler\'s load and freight marks, the presser\'s chain of marks, the mason\'s reserve, the forrester\'s woods and the trees it kept, the charter\'s run and pace — with the work stripe (runs, crates walked in and the empty runs, stretches cobbled, trees felled, the last thing each did)',
  r.okL && r.same && r.jobs.join() === 'hauler,presser,mason,forrester,route', JSON.stringify(r));

await T.finish('the working orders');
