/* shapes.mjs — v3.18 THE SHAPES OF WORK (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). The same walk, different questions, unlocked the moment the Greenhouse
   joins the wire: CIRCUIT (one contract, many doors — every leg's crates at accept, doors in order, the middle doors no
   slip, the last door grading the whole chain ×1.35, abandoned legs lost toward their own doors), CONVOY (the cargo is a
   person — a junior walker who follows, calls out when left, loses a crate to the scrappers first, freezes in the grey until
   your lantern stands by, and counts only when you BOTH stand at the gate, then joins that town's fire), SALVAGE (grey work
   is paid work — the town's worst shortage by name, a wreck in the deep grey, battered crates, ×1.6 judged against what the
   wreck gave), and every shape surviving a save mid-shape. v3.31's fairness pass stands where it rewrote the escort: a junior
   left behind trudges on at half pace, never warped to your back. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;

await ev(() => {
  /* the valley before the Greenhouse: Haven a two-star town with Elm, the Mill and the Quarry known to it */
  for (const id of ['elm', 'mill']) { const st = S.stations[id]; st.connected = true; st.met = true; st.litT = 1; }
  S.stations.quarry.met = true; S.stations.haven.stars = 2;
  State.refreshSources();
  S.banked.provisions = 60;
  window.__shape = o => o.circuit ? 'circuit' : o.convoy ? 'convoy' : o.salvage ? 'salvage' : null;
  window.__shapes = stId => Economy.ordersFor(stId).map(__shape).filter(Boolean);
  window.__mark = () => S.mails[0];
  window.__since = mk => { const i = S.mails.indexOf(mk); return i < 0 ? S.mails.slice() : S.mails.slice(0, i); };
  window.__toasts = []; new MutationObserver(ms => { for (const m of ms) for (const n2 of m.addedNodes) if (n2.textContent) __toasts.push(n2.textContent); }).observe(document.getElementById('toasts'), { childList: true });
  window.__says = []; const say0 = Render.say; Render.say = (x, y, text, ...rest) => { __says.push(text); return say0(x, y, text, ...rest); };
  window.__labels = () => Render.labelBoxes().map(b => b.str);
});

/* ================= 1 · THE LOCK, AND THE KEY ================= */
let r = await ev(async () => {
  const S0 = { elm: S.stations.elm.stock.tools, mill: S.stations.mill.stock.textiles };
  S.stations.elm.stock.tools = 30; S.stations.mill.stock.textiles = 30;
  const before = { shapes: __shapes('haven'), unlocked: !!S.flags.unlocks.shapes, stars: S.stations.haven.stars, known: DATA.stationOrder.filter(id => id !== 'haven' && (S.stations[id].connected || S.stations[id].met)).length };
  const m0 = __mark();
  const g = S.stations.green; g.connected = true; g.met = true; g.litT = 1; State.refreshSources();
  WL.timeScale = 1; const t0 = performance.now(); while (!S.flags.unlocks.shapes && performance.now() - t0 < 3000) await __frames(2);
  await __wait(1200);   // the slam follows a beat after the unlock
  const mail = __since(m0).find(m => m.subj === 'New shapes of work');
  return { before, unlocked: !!S.flags.unlocks.shapes, announce: document.getElementById('announce').textContent, toast: __toasts.some(t => /CIRCUIT/.test(t) && /CONVOY/.test(t) && /SALVAGE/.test(t)), mail: mail ? mail.body : null };
});
ok('THE LOCK: before the Greenhouse joins the wire no board posts a shape — Haven a two-star town with three towns known to it posts no circuit, no convoy, no salvage',
  r.before.shapes.length === 0 && !r.before.unlocked && r.before.stars === 2 && r.before.known >= 3, JSON.stringify(r.before));
ok('THE UNLOCK: the moment the Greenhouse joins the wire the shapes open — NEW SHAPES OF WORK slammed across the screen, the boards\' teeth named in a toast, and a mail that explains each (circuits load every leg at once and pay at the last door, convoys walk a walker, salvage pays for grey work)',
  r.unlocked && r.announce === 'NEW SHAPES OF WORK' && r.toast && !!r.mail && /CIRCUITS: every leg’s crates load at once/.test(r.mail) && /CONVOYS/.test(r.mail) && /SALVAGE/.test(r.mail), JSON.stringify({ unlocked: r.unlocked, announce: r.announce, toast: r.toast, mail: r.mail }));

/* ================= 2 · THE CIRCUIT ================= */
r = await ev(() => {
  WL.timeScale = 0.0001;
  const st = S.stations; st.elm.stock.tools = 30; st.mill.stock.textiles = 30; st.quarry.stock.textiles = 30;
  const cc = Economy.ordersFor('haven').find(o => o.circuit);
  if (!cc) return { none: true, shapes: __shapes('haven') };
  const H = DATA.stations.haven; let px = H.x, py = H.y, nn = true;
  const rest = cc.legs.map(l => l.to);
  for (let i = 0; i < cc.legs.length; i++) {   // each door the nearest of those left, from where the last one stood
    const near = rest.slice(i).sort((a, b) => U.dist(px, py, DATA.stations[a].x, DATA.stations[a].y) - U.dist(px, py, DATA.stations[b].x, DATA.stations[b].y))[0];
    if (near !== cc.legs[i].to) nn = false; px = DATA.stations[cc.legs[i].to].x; py = DATA.stations[cc.legs[i].to].y;
  }
  const wants = cc.legs.every(l => DATA.stations[l.to].needs.includes(l.item) && DATA.stations.haven.makes.includes(l.item) && Economy.needMood(l.to, l.item) !== 'thriving');
  WL.tp('haven'); UI.openStation('haven'); UI.gotoTab('orders');
  const card = [...document.querySelectorAll('#stationBody .orderCard')].find(el => /CIRCUIT/.test(el.querySelector('.wbTag') ? el.querySelector('.wbTag').textContent : ''));
  if (card) card.querySelector('[data-accept]').id = '__ccAccept';
  return { legs: cc.legs.map(l => [l.to, l.item, l.n]), nn, wants, card: card ? card.textContent.replace(/\s+/g, ' ').slice(0, 120) : null };
});
ok('THE CIRCUIT, POSTED: a two-star station with three towns known to it posts one contract through two or three doors that want what it makes, nearest door first from wherever the last one stood — a card of its own on the board, tagged CIRCUIT',
  !r.none && r.legs.length >= 2 && r.legs.length <= 3 && r.nn && r.wants && /CIRCUIT/.test(r.card || '') && /One contract, \d doors/.test(r.card || ''), JSON.stringify(r));
const legs0 = r.legs;

await page.click('#__ccAccept');
await page.waitForTimeout(300);
r = await ev(() => {
  document.getElementById('stationClose').click();
  const o = S.orders.active.find(x => x.circuit); if (!o) return { none: true };
  const want = o.legs.reduce((a, l) => a + l.n, 0), onBack = o.legs.every(l => l.items.length === l.n && l.items.every(id => S.cargo.some(c => c.id === id)));
  const kg = o.legs.reduce((a, l) => a + l.items.reduce((b, id) => b + S.cargo.find(c => c.id === id).kg, 0), 0);
  window.__cc = o.idNum;
  /* the clock the last door will grade by, read the moment the contract is signed: the summed chain of doors (Haven, then
     each door from the one before it) — and, to set it apart, the clock of the first door alone */
  { const H = DATA.stations.haven, pad = DATA.T.parPad, floor = DATA.T.parFloor, prem = o.premium ? 0.8 : 1; let secs = 0, px = H.x, py = H.y;
    for (const l of o.legs) { const d2 = DATA.stations[l.to]; secs += World.pathTime(px, py, d2.x, d2.y).seconds; px = d2.x; py = d2.y; }
    const f = DATA.stations[o.legs[0].to];
    window.__ccPar = { chain: Math.max(floor, secs * pad) * prem, first: Math.max(floor, World.pathTime(H.x, H.y, f.x, f.y).seconds * pad) * prem }; }
  UI.updateTray();
  return { crates: want, onBack, kg: +kg.toFixed(1), kgTotal: +o.kgTotal.toFixed(1), tray: document.getElementById('orderTray').textContent.replace(/\s+/g, ' ') };
});
ok('EVERY LEG AT ACCEPT: signing the circuit (a real click on its Accept) loads every leg\'s crates NOW — every door\'s crates on the back before the boots move, the contract\'s whole weight counted — and the tray reads door 1 of the chain',
  !r.none && r.onBack && r.crates >= 3 && r.kg === r.kgTotal && /CIRCUIT — door 1 of \d/.test(r.tray), JSON.stringify(r));

r = await ev(async () => {
  /* the second door first: it takes nothing — the doors open in order */
  const o = S.orders.active.find(x => x.idNum === __cc), second = o.legs[1].to;
  WL.tp(second); WL.instantPar();
  const got = Systems.deliverablesAt(second).some(x => x.idNum === __cc), res = Systems.handleDelivery(second).results.filter(x => x.order && x.order.idNum === __cc);
  const still = o.legs.every(l => l.items.every(id => S.cargo.some(c => c.id === id))) && o.leg === 0;
  /* the first door: the hand-over ceremony, the town's stock filled, LEG 1/N — ONWARD, and no slip */
  const first = o.legs[0], stock0 = S.stations[first.to].stock[first.item];
  WL.tp(first.to); WL.timeScale = 1;
  UI.openStation(first.to);
  const ceremony = !!S.handover;
  WL.skipHandover(); await __wait(400);
  const said = __says.includes(`LEG 1/${o.legs.length} — ONWARD`), toast = __toasts.some(t => new RegExp(`CIRCUIT\\s*Door 1 of ${o.legs.length} closed — onward to`).test(t));
  const slip = !document.getElementById('results').classList.contains('hidden');
  const out = { second, got, res: res.length, still, ceremony, leg: o.leg, to: o.to, gone: first.items.every(id => !S.cargo.some(c => c.id === id)), stock: +(S.stations[first.to].stock[first.item] - stock0).toFixed(1), said, toast, slip, tray: document.getElementById('orderTray').textContent.replace(/\s+/g, ' ') };
  WL.timeScale = 0.0001;
  const cl = document.getElementById('stationClose'); if (!document.getElementById('stationOv').classList.contains('hidden')) cl.click();
  return out;
});
ok('THE DOORS IN ORDER: walked to the second door first, the circuit hands over nothing there (the tray still on door one); the first door takes its crates with the full hand-over ceremony, fills the town\'s stock, says LEG 1/N — ONWARD, and the tray moves on to door two',
  !r.got && r.res === 0 && r.still && r.ceremony && r.leg === 1 && r.gone && r.stock > 0 && r.said && /CIRCUIT — door 2 of \d/.test(r.tray), JSON.stringify(r));
ok('THE MIDDLE DOOR: no slip — the ledger waits for the last door; the toast only closes the door and names the next',
  r.toast && !r.slip && r.to === legs0[1][0], JSON.stringify({ toast: r.toast, slip: r.slip, next: r.to }));

r = await ev(async () => {
  /* the rest of the doors, in order; the last grades the whole contract. The crates still to hand over walk in at their own
     condition — the middle doors' at 64, the last door's at 52, the first door's as it was handed over — so a grade read off
     one door alone cannot pass for the average of every door */
  const o = S.orders.active.find(x => x.idNum === __cc), n = o.legs.length, conds = [];
  for (let i = o.leg; i < n; i++) for (const id of o.legs[i].items) S.cargo.find(c => c.id === id).cond = i === n - 1 ? 52 : 64;
  let res = null;
  for (let i = o.leg; i < n; i++) {
    const l = o.legs[i]; conds.push(l.items.map(id => S.cargo.find(c => c.id === id).cond).reduce((a, v) => a + v, 0) / l.items.length);
    WL.tp(l.to); WL.instantPar();
    const out = Systems.handleDelivery(l.to).results; if (i === n - 1) res = out.find(x => x.order && x.order.idNum === __cc);
  }
  if (!res) return { none: true };
  UI.queueResults([res]);
  const route = document.getElementById('resultRoute').textContent, rows = document.getElementById('scoreRows').textContent.replace(/\s+/g, ' ');
  document.getElementById('resultsClose').click();
  const doors = [...o.condAcc, conds[conds.length - 1]], mean = doors.reduce((a, v) => a + v, 0) / doors.length;   // every door's condition, the last door's own crates the last of them
  return { paymul: res.paymul, legs: res.circuit && res.circuit.legs, kg: +res.kg.toFixed(1), kgTotal: +o.kgTotal.toFixed(1), par: +o.par.toFixed(3), parChain: +__ccPar.chain.toFixed(3), parFirst: +__ccPar.first.toFixed(3),
    cond: +res.cond.toFixed(3), mean: +mean.toFixed(3), doors: doors.map(v => +v.toFixed(1)), condAcc: o.condAcc.map(Math.round), route, row: /CIRCUIT — \d doors, one contract\s*×1\.35/.test(rows), announce: document.getElementById('announce').textContent, names: o.legs.map(l => DATA.stations[l.to].name) };
});
ok('THE LAST DOOR: the final door grades the whole contract — par over the summed chain (the clock read off the walk Haven → every door in turn when the contract was signed, longer than the first door\'s alone), condition averaged across every door (the doors handed over at different conditions, the grade their mean, not the last door\'s own), the total weight carried, ×1.35 (CIRCUIT CLOSED — EVERY DOOR) — and the slip\'s route line names every door in order',
  !r.none && r.paymul === 1.35 && r.legs === r.names.length && r.kg === r.kgTotal && r.condAcc.length === r.names.length - 1 && r.route === `Haven → ${r.names.join(' → ')} · CIRCUIT` && r.row && r.announce === 'CIRCUIT CLOSED — EVERY DOOR'
  && Math.abs(r.par - r.parChain) < 0.01 && r.parChain > r.parFirst + 1 && r.doors.length === r.names.length && new Set(r.doors.map(Math.round)).size > 1 && Math.abs(r.cond - r.mean) < 0.01, JSON.stringify(r));

r = await ev(() => {
  /* a second circuit, given up at once: every leg's crates become lost cargo bound for their OWN door */
  const st = S.stations; st.elm.stock.tools = 30; st.mill.stock.textiles = 30; st.quarry.stock.textiles = 30; S.time += 5;
  WL.tp('haven');
  const cc = Economy.ordersFor('haven').find(o => o.circuit); if (!cc) return { none: true };
  Systems.acceptOrder(cc, false);
  const o = S.orders.active.find(x => x.circuit);
  const map = o.legs.map(l => ({ to: l.to, ids: l.items.slice() }));
  Systems.abandonOrder(o.idNum);
  const lost = map.map(m => ({ to: m.to, lostTo: m.ids.map(id => (S.cargo.find(c => c.id === id) || {}).lostTo) }));
  const ok2 = lost.every(l => l.lostTo.every(t => t === l.to));
  for (const m of map) for (const id of m.ids) State.removeCargo(id);
  return { lost, ok2, gone: !S.orders.active.includes(o) };
});
ok('THE CIRCUIT GIVEN UP: abandoning a circuit turns each remaining leg\'s crates into lost cargo bound for its own door — every door keeps its claim on what was meant for it',
  !r.none && r.ok2 && r.gone && r.lost.length >= 2 && new Set(r.lost.map(l => l.to)).size === r.lost.length, JSON.stringify(r));

/* ================= 3 · THE CONVOY ================= */
r = await ev(async () => {
  S.time += 100; WL.tp('haven');
  const cv = Economy.ordersFor('haven').find(o => o.convoy); if (!cv) return { none: true };
  const H = DATA.stations.haven, D = DATA.stations[cv.to], p = World.pathTime(H.x, H.y, D.x, D.y, true, Systems.walkOpts(true));
  let grey = 0; for (const [x, y] of p.path || []) grey = Math.max(grey, World.mistAt(x, y));
  UI.openStation('haven'); UI.gotoTab('orders');
  const card = [...document.querySelectorAll('#stationBody .orderCard')].find(el => /CONVOY/.test(el.textContent));
  const text = card ? card.textContent.replace(/\s+/g, ' ') : null;
  document.getElementById('stationClose').click();
  Systems.acceptOrder(cv, false);
  const c = S.convoy, o = S.orders.active.find(x => x.convoy);
  window.__cv = o.idNum;
  await __wait(60);   // the toast lands in the page's own time
  return { to: cv.to, connected: S.stations[cv.to].connected, found: p.found, grey: +grey.toFixed(2), card: text && text.slice(0, 90), name: c && c.n.name, crates: c && c.crates, skills: c && Math.max(...Object.values(c.n.skills)), announced: __toasts.some(t => /falls in behind you/.test(t)) };
});
ok('THE CONVOY, POSTED: the cargo is a person — a card of its own (CONVOY, walk a walker) for a connected town the pathfinder can find without the deep grey; accepted, a junior walker of the Order (generated, named, no skill above 2 — that is the point) shoulders three crates and falls in behind you',
  !r.none && r.connected && r.found && r.grey <= 0.68 && /CONVOY/.test(r.card || '') && !!r.name && r.crates === 3 && r.skills <= 2 && r.announced, JSON.stringify(r));

r = await ev(async () => {
  const c = S.convoy; WL.tp([c.x + 150, c.y + 10]); S.moveTo = null; WL.timeScale = 1;
  const d0 = U.dist(c.x, c.y, S.px, S.py); await __wait(1200);
  const follow = { d0: Math.round(d0), d1: Math.round(U.dist(c.x, c.y, S.px, S.py)), moving: c.moving || U.dist(c.x, c.y, S.px, S.py) < 50 };
  /* left behind past 220: they call out, and trudge on at half their pace — never warped to your back */
  WL.tp([c.x + 420, c.y]); const x0 = c.x, s0 = __says.length; await __wait(1000);
  const lag = { waiting: c.waiting, said: __says.slice(s0).some(t => ['Wait— your legs are longer!', 'I can’t match that pace!', 'Walker, the crates!'].includes(t)), crept: Math.round(c.x - x0), full: Math.round(NPC.speedOf(c.n)), label: __labels().some(s => /^WAITING — /.test(s)), guide: (Guide.current() || {}).id, maxStep: 0 };
  /* stride by stride: no step longer than a stride */
  let last = [c.x, c.y], maxStep = 0; for (let i = 0; i < 20; i++) { await __frames(1); maxStep = Math.max(maxStep, U.dist(last[0], last[1], c.x, c.y)); last = [c.x, c.y]; }
  lag.maxStep = +maxStep.toFixed(1); lag.warped = U.dist(c.x, c.y, S.px, S.py) < 100;
  WL.timeScale = 0.0001;
  return { follow, lag };
});
ok('THE FOLLOW: the junior walks to you at their own pace — a Walker 150 units ahead has them closing the gap within a second',
  r.follow.d1 < r.follow.d0 - 60, JSON.stringify(r.follow));
ok('THE LAG (v3.31, the fairness pass: never frozen, never warped): drift past 220 units and the junior calls out ("Wait— your legs are longer!"), WAITING under their feet and the Guide turned to them — and trudges on at half their pace, stride by stride, never warped to your back',
  r.lag.waiting && r.lag.said && r.lag.label && r.lag.guide === 'convoy' && r.lag.crept > 0 && r.lag.crept < r.lag.full * 0.75 && r.lag.maxStep < 12 && !r.lag.warped, JSON.stringify(r.lag));

r = await ev(async () => {
  /* scrappers go for THEIR crates first: inside a camp's ground, with the Walker a mark too — a crate of the Walker's own on
     the back, standing inside the claim — a knife nearer the junior goes for the junior's crates and leaves the Walker's */
  const cd = DATA.camps.find(c => !S.camps[c.id].pacified) || DATA.camps[0], c = S.convoy, cs = S.camps[cd.id];
  c.x = cd.x + cd.r * 0.5; c.y = cd.y; c.frozen = false; c.waiting = false; c.stag = 0; c.crates = 3;
  let W = null;
  for (const [dx, dy] of [[70, 110], [70, -110], [110, 70], [110, -70], [40, 130], [40, -130]]) { const t = World.terrainAt(c.x + dx, c.y + dy); if (!t.blocked && !t.water) { W = [c.x + dx, c.y + dy]; break; } }
  WL.tp(W || [c.x + 30, c.y + 20]); S.moveTo = null;
  const bait = State.makeItem('textiles'); State.addCargo(bait);   // the Walker's own crate: a mark for any knife that wants one
  cs.runners.length = 0; const run = { x: c.x - 80, y: c.y + 10, wa: 1, state: 'patrol', cd: 0, cls: 'knife' }; cs.runners.push(run);
  const marks = { walkerIn: U.dist(S.px, S.py, cd.x, cd.y) < cd.r * 0.85, juniorIn: U.dist(c.x, c.y, cd.x, cd.y) < cd.r, carrying: S.cargo.some(x => x.cat !== 'tool'),
    toJunior: Math.round(U.dist(run.x, run.y, c.x, c.y)), toWalker: Math.round(U.dist(run.x, run.y, S.px, S.py)) };
  const drops0 = S.drops.length; WL.timeScale = 1;
  const t0 = performance.now(); while (c.crates === 3 && performance.now() - t0 < 5000) await __frames(1);
  cs.runners.length = 0; cs.pacified = true;   // the moment of the catch the camp's knives are held off the board: the crate on the ground is the Walker's to recover before any knife collects it
  const knocked = { crates: c.crates, dropped: S.drops.length - drops0, told: __toasts.some(t => /Scrappers knocked a crate off/.test(t)) };
  const baitKept = S.cargo.some(x => x.id === bait.id) && !S.drops.some(d => d.item.id === bait.id);
  State.removeCargo(bait.id);
  const dr = S.drops.find(d => d.item.convoy === __cv);
  cs.runners.length = 0; WL.timeScale = 0.0001;
  window.__cvCamp = cd.id;
  return { camp: cd.id, marks, baitKept, knocked, crate: dr ? { name: dr.item.name, gold: !!dr.item.convoy } : null, at: dr ? [Math.round(dr.x), Math.round(dr.y)] : null };
});
const knock = r;
/* recover it off the ground (E) and hand it back at their side (E) — real presses */
await ev(() => { const dr = S.drops.find(d => d.item.convoy === __cv); if (dr) WL.tp([dr.x, dr.y]); S.moveTo = null; WL.timeScale = 1; });
await page.waitForTimeout(250); await page.keyboard.press('KeyE'); await page.waitForTimeout(250);
const held = await ev(() => S.cargo.some(c => c.convoy === __cv));
await ev(() => { const c = S.convoy; WL.tp([c.x + 30, c.y]); S.moveTo = null; });
await page.waitForTimeout(250); await page.keyboard.press('KeyE'); await page.waitForTimeout(250);
r = await ev(() => { const out = { crates: S.convoy.crates, onBack: S.cargo.some(c => c.convoy === __cv), thanked: __says.includes('Got it. Thank you. Really.') }; S.camps[__cvCamp].pacified = false; S.camps[__cvCamp].runners.length = 0; return out; });
await ev(() => { WL.timeScale = 0.0001; });
ok('THE KNOCK AND THE HAND-BACK: inside a camp\'s ground the scrappers go for the junior\'s crates first — the softer mark: with the Walker a mark too (a crate of their own on the back, inside the claim), a knife nearer the junior takes the junior\'s crate and leaves the Walker\'s where it rides — and a catch knocks a gold-banded crate loose (their load three to two, the toast says so); recovered off the ground (E) and handed back at their side (E), their load is whole again ("Got it. Thank you. Really.")',
  knock.marks.walkerIn && knock.marks.juniorIn && knock.marks.carrying && knock.marks.toJunior < knock.marks.toWalker && knock.baitKept
  && knock.knocked.crates === 2 && knock.knocked.dropped >= 1 && knock.knocked.told && knock.crate && knock.crate.gold && held && r.crates === 3 && !r.onBack && r.thanked, JSON.stringify({ knock, held, back: r }));

r = await ev(async () => {
  /* the grey roots junior feet: a wraith within 260 in mist freezes them until your lantern stands within reach */
  let spot = null; for (let y = 2400; y < 6000 && !spot; y += 60) for (let x = 800; x < 7600 && !spot; x += 60) if (World.mistAt(x, y) > 0.5 && World.classAt(x, y) === World.MEADOW && !World.terrainAt(x, y).blocked) spot = [x, y];
  const c = S.convoy; c.x = spot[0]; c.y = spot[1]; c.frozen = false; c.stag = 0; c.waiting = false;
  WL.tp([spot[0] + 200, spot[1]]); S.moveTo = null; S.wraiths.length = 0; Render.cam.x = spot[0] + 100; Render.cam.y = spot[1];   // the camera there with them, both in the frame
  S.wraiths.push({ id: U.uid(), x: spot[0] - 150, y: spot[1] - 60, alert: 0, state: 'drift', cd: 5, ph: 0 });
  WL.timeScale = 1; await __wait(400);
  const frozen = { frozen: c.frozen, label: __labels().some(s => /^FROZEN — /.test(s)), guide: (Guide.current() || {}).head || null };
  const x0 = c.x; S.wraiths.length = 0; await __wait(600); const stuck = Math.round(Math.abs(c.x - x0));
  WL.tp([c.x + 40, c.y]); S.wraiths.length = 0;
  let freedAt = null; const t1 = performance.now(); while (performance.now() - t1 < 1500) { await __frames(1); if (!c.frozen) { freedAt = Math.round(performance.now() - t1); break; } }   // the grey keeps sending its own; the moment the lantern arrives is the moment read
  const freed = { frozen: c.frozen, at: freedAt, said: __says.includes('…okay. Okay. Staying close.') };
  WL.timeScale = 0.0001;
  return { mist: +World.mistAt(spot[0], spot[1]).toFixed(2), frozen, stuck, freed };
});
ok('THE FREEZE: a wraith within 260 of the junior in the mist freezes them mid-stride — FROZEN under their feet, the Guide sends you to them — and they stay rooted with the wraith gone, until your lantern stands beside them; then they move again',
  r.frozen.frozen && r.frozen.label && /frozen in the grey/.test(r.frozen.guide || '') && r.stuck === 0 && r.freed.frozen === false && r.freed.said, JSON.stringify(r));

r = await ev(async () => {
  /* the gate: the junior alone at the door is not arrival; both of you, and it counts */
  const c = S.convoy, o = S.orders.active.find(x => x.idNum === __cv), D = DATA.stations[o.to];
  c.x = D.x + 20; c.y = D.y + 40; c.frozen = false; c.waiting = false; c.stag = 0; c.crates = 3;
  WL.tp([D.x + 600, D.y + 300]); S.moveTo = null; WL.timeScale = 1;
  await __wait(300); const alone = !!S.convoy;
  const appr0 = S.stations[o.from].appr || 0, likes0 = S.likes, name = c.n.name, pool0 = S.npcs.filter(n => n.at === o.to && n.state === 'pool').length;
  WL.tp([D.x + 30, D.y + 50]); c.x = D.x + 20; c.y = D.y + 40;
  const t0 = performance.now(); while (S.convoy && performance.now() - t0 < 3000) await __frames(2);
  await __wait(300);
  const n = S.npcs.find(x => x.name === name);
  const slip = document.getElementById('resultRoute').textContent;
  const out = { alone, through: !S.convoy, appr: (S.stations[o.from].appr || 0) - appr0, likes: S.likes - likes0, joined: !!n && n.state === 'pool' && n.at === o.to, foot: n ? (n.trainXp || {}).foot || 0 : 0, footLv: n ? n.skills.foot : null, announce: document.getElementById('announce').textContent, slip };
  const rc = document.getElementById('resultsClose'); if (!document.getElementById('results').classList.contains('hidden')) rc.click();
  WL.timeScale = 0.0001;
  return out;
});
ok('ARRIVING TOGETHER: the junior at the gate with the Walker far off is not an arrival — both at the gate and it counts: luxury pay (likes, where letters pay none), +10 appreciation to the town that asked, CONVOY THROUGH from the Dispatch, and the walker joins the destination\'s fire, hireable, already road-trained (+26 Footwork)',
  r.alone && r.through && r.appr === 10 && r.likes > 0 && r.joined && (r.foot >= 26 || r.footLv >= 1) && r.announce === 'CONVOY THROUGH' && /CONVOY THROUGH/.test(r.slip), JSON.stringify(r));

/* ================= 4 · SALVAGE ================= */
r = await ev(() => {
  /* the Greenhouse short of something: its worst stock under seventy names the prize */
  const g = S.stations.green; for (const k of Object.keys(g.stock)) g.stock[k] = 80; g.stock.seeds = 22; S.time += 200;
  const sv = Economy.ordersFor('green').find(o => o.salvage); if (!sv) return { none: true };
  const G = DATA.stations.green, d = U.dist(G.x, G.y, sv.site.x, sv.site.y);
  WL.tp('green'); UI.openStation('green'); UI.gotoTab('orders');
  const card = [...document.querySelectorAll('#stationBody .orderCard')].find(el => /SALVAGE/.test(el.textContent));
  const text = card ? card.textContent.replace(/\s+/g, ' ') : '';
  document.getElementById('stationClose').click();
  const calm = (() => { for (const k of Object.keys(g.stock)) g.stock[k] = 90; S.time += 200; return Economy.ordersFor('green').some(o => o.salvage); })();
  g.stock.seeds = 22; S.time += 200;
  window.__sv = Economy.ordersFor('green').find(o => o.salvage);
  return { item: sv.item, name: DATA.goodsInfo[sv.item].name, dist: Math.round(d), mistBase: +World.mistBase(sv.site.x, sv.site.y).toFixed(2), card: text.slice(0, 160), named: text.includes(DATA.goodsInfo[sv.item].name), calm };
});
ok('THE SALVAGE, NAMED: a town short of something (its worst stock under seventy) posts its top shortage by name — the Greenhouse, out of seed, posts a wreck run for Seeds, a card of its own (SALVAGE, ×1.6 — grey work); a comfortable town sends nobody into the grey',
  !r.none && r.item === 'seeds' && r.named && /SALVAGE/.test(r.card) && /×1\.6/.test(r.card) && r.calm === false, JSON.stringify(r));

r = await ev(async () => {
  const sv = __sv; Systems.acceptOrder(sv, false);
  const o = S.orders.active.find(x => x.salvage); window.__svId = o.idNum;
  const G = DATA.stations.green, d = U.dist(G.x, G.y, o.site.x, o.site.y);
  WL.timeScale = 1; await __wait(300);
  const guide = Guide.target(), aimed = !!guide && Math.round(guide.x) === Math.round(o.site.x) && Math.round(guide.y) === Math.round(o.site.y);
  /* out to the site: the wreck stands there while the run holds it */
  WL.tp([o.site.x + 90, o.site.y + 40]); S.moveTo = null; Render.setZoom(2); Render.cam.x = o.site.x; Render.cam.y = o.site.y; await __wait(400); await __frames(3);
  const label = __labels().includes('THE WRECK'), paint = ['#d8d2bd', '#ffd98f'].reduce((s2, h) => s2 + __near(o.site.x, o.site.y, __hex(h), 6, 60), 0);
  Render.setZoom(null); WL.timeScale = 0.0001;
  return { dist: Math.round(d), mistBase: +World.mistBase(o.site.x, o.site.y).toFixed(2), empty: o.items.length === 0, aimed, label, paint };
});
ok('THE SITE IN THE GREY: the wreck stands 900-1400 units out where the mist\'s base runs past half — accepted empty-handed, the Guide aims at the site, and out there the wreck is drawn (the tipped cart, its gold crates) and labelled THE WRECK while the run holds it',
  r.dist >= 900 && r.dist <= 1400 && r.mistBase > 0.5 && r.empty && r.aimed && r.label && r.paint > 20, JSON.stringify(r));

/* E at the wreck: a real press */
await ev(() => { const o = S.orders.active.find(x => x.idNum === __svId); WL.tp([o.site.x + 10, o.site.y + 10]); S.moveTo = null; WL.timeScale = 1; });
await page.waitForTimeout(300); await page.keyboard.press('KeyE'); await page.waitForTimeout(300);
r = await ev(() => {
  const o = S.orders.active.find(x => x.idNum === __svId), its = o.items.map(id => S.cargo.find(c => c.id === id)).filter(Boolean);
  WL.timeScale = 0.0001;
  return { looted: o.looted, n: its.length, kg: its.map(c => c.kg), cond: its.map(c => c.cond), names: its.map(c => c.name), gold: its.every(c => !!c.orderId), foundCond: Math.round(o.foundCond) };
});
ok('THE WRECK\'S LOAD: E at the wreck loads two or three Salvaged crates — eleven to seventeen kilos each, fifty-five to eighty per cent, honest about their history — bound to the run (gold, mission cargo)',
  r.looted && r.n >= 2 && r.n <= 3 && r.kg.every(k => k >= 11 && k <= 17) && r.cond.every(c => c >= 55 && c <= 80) && r.names.every(n => /^Salvaged /.test(n)) && r.gold, JSON.stringify(r));

r = await ev(() => {
  /* home: ×1.6 on top of the shortage multiplier, condition judged against what the wreck gave */
  const o = S.orders.active.find(x => x.idNum === __svId);
  WL.tp('green'); WL.instantPar();
  const res = Systems.handleDelivery('green').results.find(x => x.order && x.order.idNum === __svId);
  if (!res) return { none: true };
  UI.queueResults([res]);
  const rows = document.getElementById('scoreRows').textContent.replace(/\s+/g, ' '), route = document.getElementById('resultRoute').textContent;
  document.getElementById('resultsClose').click();
  return { paymul: res.paymul, needMul: res.needMul, ptsC: res.ptsC, cond: Math.round(res.cond), found: Math.round(o.foundCond), grey: /Grey work — out of the wreck\s*×1\.6/.test(rows), against: /Condition — against what the wreck gave/.test(rows), route };
});
ok('×1.6 AGAINST THE WRECK: walked home no worse than the wreck gave them, the crates grade full stars for condition (judged against what the wreck gave, not the factory) and the slip pays ×1.6 on top of the shortage\'s own multiplier',
  !r.none && r.paymul === 1.6 && r.needMul > 1 && r.ptsC === 4 && r.cond === r.found && r.grey && r.against && /· SALVAGE/.test(r.route), JSON.stringify(r));

/* ================= 5 · THE SAVE, MID-SHAPE ================= */
r = await ev(() => {
  /* a circuit at its second door and a convoy at two crates of three, saved and loaded */
  const st = S.stations; st.elm.stock.tools = 30; st.mill.stock.textiles = 30; st.quarry.stock.textiles = 30; S.time += 5; WL.tp('haven');
  for (const o of [...S.orders.active]) Systems.abandonOrder(o.idNum);
  S.cargo = S.cargo.filter(c => c.cat === 'tool');
  const cc = Economy.ordersFor('haven').find(o => o.circuit); Systems.acceptOrder(cc, false);
  const o = S.orders.active.find(x => x.circuit); WL.tp(o.legs[0].to); WL.instantPar(); Systems.handleDelivery(o.legs[0].to);
  S.time += 100; WL.tp('haven');
  const cv = Economy.ordersFor('haven').find(x => x.convoy); Systems.acceptOrder(cv, false); S.convoy.crates = 2;
  const before = { leg: o.leg, legs: o.legs.length, to: o.to, onBack: o.legs.slice(1).every(l => l.items.every(id => S.cargo.some(c => c.id === id))), crates: S.convoy.crates, junior: S.convoy.n.name, cvTo: S.orders.active.find(x => x.convoy).to };
  State.save(); const loaded = State.load();
  const o2 = S.orders.active.find(x => x.circuit), c2 = S.convoy;
  const after = { leg: o2 && o2.leg, legs: o2 && o2.legs.length, to: o2 && o2.to, onBack: !!o2 && o2.legs.slice(1).every(l => l.items.every(id => S.cargo.some(c => c.id === id))), crates: c2 && c2.crates, junior: c2 && c2.n.name, cvTo: (S.orders.active.find(x => x.convoy) || {}).to };
  return { loaded, before, after, same: JSON.stringify(before) === JSON.stringify(after) };
});
ok('THE SAVE, MID-SHAPE: a circuit standing at its second door (the first handed over, the rest of its crates on the back) and a convoy down to two crates of three both survive a save and a load, exactly where they stood',
  r.loaded && r.same && r.before.leg === 1, JSON.stringify(r));

await T.finish('the shapes of work');
