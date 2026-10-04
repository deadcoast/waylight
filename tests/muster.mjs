/* muster.mjs — v3.36 THE MUSTER (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). Standing orders for the people who walk with you, kept in the
   register: the registry rows; the ledger's engine parameterized over any store (the pack's wrappers read identically
   for every item and verb); the orders a hire and a Farkeeper walk in with, on a store apart from the pack's; STATION on
   real feet; SWEEP refusing then taking a junk drop; THE OVERFLOW lifting scrap crate by crate while the contract crate
   stays; THE MESS three ways; THE STAND three ways with the stripe counting; VOICE, THE SCOUT landing whole and the roll
   call's words; the Crew sheet on O under the modal law (plates with figures, the stripe, five presets, twelve choices,
   fifty marks, the formation board with pixels on it); the parent law on one back's store by real clicks; the papers,
   the keys, the lessons; the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;
await ev(() => {
  window.__toasts = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join(' | ');
  window.__vis = id => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
  /* what is said on the ground, heard */
  window.__said = []; const say0 = Render.say; Render.say = (x, y, txt, ...rest) => { __said.push(String(txt)); return say0(x, y, txt, ...rest); };
  window.__hire = (name, opt = {}) => { const n = NPC.gen({ at: 'haven', cls: 'courier' }); n.name = name; n.feeWaived = true; if (opt.fk) { n.fk = true; n.fkCls = opt.fk; } S.npcs.push(n); NPC.hire(n, 'companion'); return n; };
  window.__meadow = () => { const H = DATA.stations.haven; WL.tp([H.x + 520, H.y + 260]); S.speed = 0; S.dir = 0; S.moveTo = null; S.state = 'walk'; };
  window.__settle = (secs = 3) => { for (let i = 0; i < secs * 20; i++) Systems.update(0.05, {}); };
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const O = MUSTER.ORDERS, choices = Object.values(O).reduce((a, x) => a + Object.keys(x.choices).length, 0);
  const orders = Object.keys(O).join() === 'station,mess,stand,voice' && Object.values(O).every(x => x.choices[x.def] && Object.values(x.choices).every(c => c.name && c.line));
  const trees = MUSTER.TREES.loot && MUSTER.TREES.hand && MUSTER.TREES.loot.def.junk === false && MUSTER.TREES.hand.def.freight === false;
  const presets = Object.keys(MUSTER.PRESETS).join() === 'own,mule,shield,scout,quartermaster' && Object.values(MUSTER.PRESETS).every(P => P.name && P.line && Object.keys(O).every(k => O[k].choices[P[k]]));
  const slots = Object.keys(MUSTER.STATIONS).every(k => MUSTER.STATIONS[k].length === 3 && O.station.choices[k]) && MUSTER.STATIONS.point.every(([b]) => b > 0) && MUSTER.STATIONS.close.every(([b, s]) => Math.hypot(b, s) < 40) && MUSTER.STATIONS.loose.every(([b, s]) => Math.hypot(b, s) > 90);
  const fx = MUSTER.STATION_FX.close.reachMul === 0.7 && MUSTER.STATION_FX.loose.reachMul === 1.35 && MUSTER.STATION_FX.close.steady > 0 && MUSTER.HOLD_SCREEN === 120;
  const call = ['station', 'mess', 'stand'].every(k => Object.keys(O[k].choices).every(c => MUSTER.CALL[k][c]));
  return { choices, orders, trees, presets, slots, fx, call, later: Object.keys(MUSTER.TREES).join() };
});
ok('THE REGISTRIES: four scalar orders as rows (STATION, MESS, STAND, VOICE — twelve choices, each with its line and a default); the two trees with their defaults (SWEEP INTO THEIR PACK leaves junk, TAKE MY OVERFLOW leaves freight; v3.37 and v3.40 added the freight list and the letters on the same law); five presets by name, each a whole set of orders; three slots per station (point ahead of you, close inside 40, loose past 90); the station effects (the looter\'s reach ×0.7 close and ×1.35 loose, a steadier hand at the elbow); the HOLD ring of 120; the roll call\'s words',
  r.choices === 12 && r.orders && r.trees && r.presets && r.slots && r.fx && r.call && r.later === 'loot,hand,haul,post', JSON.stringify(r));

/* ================= 2 · THE ENGINE, PARAMETERIZED ================= */
r = await ev(() => {
  const L = Ledger, P = L.led().policy, items = Object.keys(DATA.items), nodes = Object.keys(L.CHAIN);
  const same = () => { let bad = 0; for (const id of items) for (const v of L.VERBS) if (L.effective(id, v) !== L.effectiveIn(P, id, v, Ledger.DEFAULTS) || L.effective(id, v) !== L.effectiveIn(P, id, v)) bad++; for (const nd of nodes) for (const v of L.VERBS) if (L.markState(nd, v) !== L.markStateIn(P, nd, v)) bad++; return bad; };
  const bad0 = same();
  const snap = JSON.stringify(P);
  L.setMark('resources', 'store', true); L.setMark('wood', 'store', false); L.setMark('junk_cog', 'scrap', false, true); L.setMark('freight', 'donate', true);
  const bad1 = same();
  const viaIn = JSON.stringify(P); L.led().policy = JSON.parse(snap);
  const P2 = L.led().policy; L.setMarkIn(P2, 'resources', 'store', true); L.setMarkIn(P2, 'wood', 'store', false); L.setMarkIn(P2, 'junk_cog', 'scrap', false, true); L.setMarkIn(P2, 'freight', 'donate', true);
  const sameWrites = JSON.stringify(P2) === viaIn;
  L.led().policy = JSON.parse(snap);
  /* a preset lands top-down by the parent law: parents first, the children kept */
  const Q = {}; L.seedStore(Q, 'loot', { cargo: true, junk: false, freight: true });
  const seeded = L.effectiveIn(Q, 'junk_cog', 'loot') === false && L.effectiveIn(Q, 'wood', 'loot') === true && L.markStateIn(Q, 'curios', 'loot') === 'mixed';
  return { checks: items.length * L.VERBS.length * 2 + nodes.length * L.VERBS.length, bad0, bad1, sameWrites, seeded, verbs: L.VERBS.join(), defaults: JSON.stringify(Ledger.DEFAULTS) };
});
ok('THE ENGINE, PARAMETERIZED: effective, setMark and markState are the pack\'s wrappers over effectiveIn, setMarkIn and markStateIn, each taking the store it reads or writes — for every item and every verb, and every node\'s tri-state, the wrappers read identically through the parameterized engine (before and after marks), the same marks written either way leave the same store, and seedStore lands a preset top-down by the parent law',
  r.bad0 === 0 && r.bad1 === 0 && r.sameWrites && r.seeded && r.checks > 1000 && r.verbs === 'deliver,store,donate,scrap,pickup', JSON.stringify(r));

/* ================= 3 · THE ORDERS THEY WALK IN WITH, ON A STORE OF THEIR OWN ================= */
r = await ev(() => {
  __meadow();
  const tam = __hire('Tam Harrow'), bo = __hire('Bo Veil'), fk = NPC.gen({ at: 'haven', cls: 'courier' }); fk.fk = true; fk.fkCls = 'pugugly'; fk.name = 'Halla Stonejaw';
  const own = NPC.ordersOf(tam), shield = NPC.ordersOf(fk);
  const walksIn = own.preset === 'own' && own.station === 'wedge' && own.mess === 'bank' && own.stand === 'meet' && own.voice === 'talk' && shield.preset === 'shield' && shield.station === 'close' && shield.voice === 'quiet' && !NPC.allows(fk, 'loot', 'metal') && !NPC.allows(fk, 'hand', 'metal');
  const pack0 = JSON.stringify(Ledger.led().policy);
  NPC.setTreeMark(tam, 'loot', 'junk', true);
  const apart = JSON.stringify(Ledger.led().policy) === pack0 && NPC.allows(tam, 'loot', 'junk_cog') && !NPC.allows(bo, 'loot', 'junk_cog') && tam.orders.policy !== bo.orders.policy && tam.orders.preset === null;
  NPC.applyPreset(tam, 'own', true);
  return { walksIn, apart, party: NPC.party().map(n => n.name).join() };
});
ok('THE ORDERS THEY WALK IN WITH, ON A STORE OF THEIR OWN: a hire walks in as THE WALKER\'S OWN (the wedge, the bank, meeting what comes, talking); a Farkeeper of the kit as THE SHIELD (close, quiet, carrying nothing of yours); a mark on one walker\'s store (junk swept) moves that back alone — the other back\'s store and the pack\'s own ledger untouched, and the preset\'s name comes off the hand-set orders',
  r.walksIn && r.apart && r.party === 'Tam Harrow,Bo Veil', JSON.stringify(r));

/* ================= 4 · STATION ON REAL FEET ================= */
r = await ev(() => {
  __meadow(); const [a, b] = NPC.party(), out = {};
  for (const st of ['close', 'loose', 'point', 'wedge']) {
    NPC.setOrder(a, 'station', st); NPC.setOrder(b, 'station', st);
    __settle(4);
    const da = U.dist(a.cx, a.cy, S.px, S.py), db = U.dist(b.cx, b.cy, S.px, S.py), ahead = [(a.cx - S.px) * Math.cos(S.dir) + (a.cy - S.py) * Math.sin(S.dir), (b.cx - S.px) * Math.cos(S.dir) + (b.cy - S.py) * Math.sin(S.dir)];
    out[st] = { da: Math.round(da), db: Math.round(db), apart: Math.round(U.dist(a.cx, a.cy, b.cx, b.cy)), ahead: ahead.map(Math.round) };
  }
  return out;
});
ok('STATION ON REAL FEET: two backs walk to the slots their orders describe — CLOSE brings both inside 40 paces, LOOSE takes both out to 90 and past, POINT puts them AHEAD of the Walker\'s way — and two backs at one station never share a spot (the slots dealt by index)',
  r.close.da < 40 && r.close.db < 40 && r.loose.da >= 89.5 && r.loose.db >= 89.5 && r.point.ahead.every(v => v > 40) && ['close', 'loose', 'point', 'wedge'].every(k => r[k].apart > 20), JSON.stringify(r));

/* ================= 5 · SWEEP: REFUSING, THEN TAKING, A JUNK DROP ================= */
r = await ev(() => {
  __meadow(); const [a, b] = NPC.party();
  NPC.setOrder(a, 'station', 'wedge'); NPC.setOrder(b, 'station', 'wedge'); b.shoveCd = 0; b.state = 'pool'; b.at = 'haven';   // one back alone, trained to sweep
  a.skills.haul = 3; a.carry = []; __settle(2);
  const it = State.makeItem('junk_cog'), drop = { id: U.uid(), item: it, x: S.px + 120, y: S.py - 60 }; S.drops.push(drop);
  __settle(4);
  const refused = S.drops.includes(drop) && !a.carry.includes(it) && !NPC.allows(a, 'loot', 'junk_cog');
  const c0 = NPC.svc(a).crates;
  NPC.setTreeMark(a, 'loot', 'junk', true);
  __settle(5);
  const took = !S.drops.includes(drop) && a.carry.includes(it) && NPC.svc(a).crates === c0 + 1 && /swept up/.test(NPC.svc(a).last);
  b.state = 'companion'; b.cx = S.px - 40; b.cy = S.py; a.carry = []; NPC.applyPreset(a, 'own', true);
  return { refused, took, reach: DATA.T.looterBase + DATA.T.looterPer };
});
ok('SWEEP, REFUSING THEN TAKING A JUNK DROP: a trained back with junk OFF on its sweep leaves a bent cog lying inside its reach; mark junk ON on that one back\'s store and the same back walks over, takes it into its own pack, and the stripe counts it in its own words',
  r.refused && r.took, JSON.stringify(r));

/* ================= 6 · THE OVERFLOW ================= */
r = await ev(() => {
  __meadow(); const [a, b] = NPC.party(); a.carry = []; b.carry = []; b.state = 'pool';
  for (const c of [...S.cargo]) if (!c.tool) State.removeCargo(c.id);
  const contract = State.makeItem('metal'); contract.orderId = 'o-test'; contract.kg = 14; State.addCargo(contract);
  while (State.weight() <= State.cap() + 9) { const m = State.makeItem('metal'); m.kg = 6; State.addCargo(m); }
  const over0 = +(State.weight() - State.cap()).toFixed(1), steps = [];
  for (let i = 0; i < 12; i++) { for (let k = 0; k < 20; k++) Systems.update(0.05, {}); steps.push(a.carry.length); if (State.weight() <= State.cap()) break; }
  const under = State.weight() <= State.cap(), kept = S.cargo.includes(contract) && !a.carry.includes(contract), all = a.carry.every(c => c.defId === 'metal' && !c.orderId);
  const said = /takes the .* — you were over/.test(__toasts()) && /off your back/.test(NPC.svc(a).last);
  for (const c of [...S.cargo]) if (!c.tool) State.removeCargo(c.id); a.carry = []; b.state = 'companion'; b.cx = S.px - 40; b.cy = S.py;
  return { over0, steps, under, kept, all, said };
});
ok('THE OVERFLOW: a Walker carrying more than the pack allows has a back under TAKE MY OVERFLOW lift the heaviest allowed crate, a beat at a time — scrap crate by crate, with a word — until the Walker is under; the contract crate stays on the Walker\'s own back',
  r.over0 > 0 && r.steps.length >= 2 && r.steps.every((v, i) => i === 0 ? v === 1 : v === r.steps[i - 1] + 1 || v === r.steps[i - 1]) && r.under && r.kept && r.all && r.said, JSON.stringify(r));

/* ================= 7 · THE MESS, THREE WAYS ================= */
r = await ev(() => {
  __meadow(); const [a, b] = NPC.party(); a.carry = []; a.hungry = false; b.state = 'pool';   // one back at the table
  const meal = mess => { NPC.setOrder(a, 'mess', mess); a.fedT = 0; const p0 = S.banked.provisions, m0 = NPC.svc(a).meals, c0 = a.carry.length; Systems.update(0.05, {}); return { bank: +(p0 - S.banked.provisions).toFixed(2), meals: NPC.svc(a).meals - m0, ate: c0 - a.carry.length, hungry: a.hungry, last: NPC.svc(a).last }; };
  S.banked.provisions = 20; a.carry.push(State.makeItem('ration'));
  const own = meal('own'), bank = meal('bank'), fast = meal('fast');
  const watch = (() => { const rr = { x: a.cx + 60, y: a.cy, cd: 0 }; return NPC.intercept(rr, null); })();   // a hungry back walks, but will not watch yours
  NPC.setOrder(a, 'mess', 'bank'); a.fedT = 0; Systems.update(0.05, {});
  b.state = 'companion'; b.cx = S.px - 40; b.cy = S.py;
  return { own, bank, fast, watch, back: !a.hungry };
});
ok('THE MESS, THREE WAYS: THEIR PACK eats the ration they carry and leaves the bank whole; THE BANK draws one provision; a FAST draws nothing and the back goes hungry by orders — a real trade: a hungry back walks but will not meet a runner for you — and the bank feeds them back into step',
  r.own.ate === 1 && r.own.bank === 0 && r.own.meals === 1 && r.bank.bank === 1 && r.bank.meals === 1 && r.fast.bank === 0 && r.fast.meals === 0 && r.fast.hungry && /fasting by orders/.test(r.fast.last) && r.watch === false && r.back, JSON.stringify(r));

/* ================= 8 · THE STAND, THREE WAYS, AND THE STRIPE COUNTING ================= */
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass, [a, b] = NPC.party();
  b.state = 'pool';
  const trial = stand => {
    WL.tp([cd.x, cd.y]); S.speed = 0; S.dir = 0; S.state = 'walk'; S.moveTo = null; S.health = 100; S.stagger = 0;
    if (!S.cargo.some(x => !x.tool)) State.addCargo(State.makeItem('food'));
    NPC.setOrder(a, 'station', 'point'); NPC.setOrder(a, 'stand', stand); a.hungry = false; a.shoveCd = 0; a.cx = S.px + 64; a.cy = S.py;
    const met0 = NPC.svc(a).met;
    c.runners = [{ x: cd.x + 230, y: cd.y + 4, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }]; const rr = c.runners[0];
    let at = null;
    for (let i = 0; i < 60 && at === null; i++) { const prev = U.dist(rr.x, rr.y, S.px, S.py); Systems.update(0.05, {}); if (NPC.svc(a).met > met0) at = Math.round(prev); if (S.health < 95) break; }   // where he stood when met (the knock carries him back after)
    return { met: NPC.svc(a).met - met0, at, hurt: Math.round(100 - S.health) };
  };
  const quiet = trial('quiet'), hold = trial('hold'), meet = trial('meet');
  NPC.setOrder(a, 'stand', 'meet'); NPC.setOrder(a, 'station', 'wedge'); b.state = 'companion'; S.health = 100; c.runners = [];
  __meadow(); b.cx = S.px - 40; b.cy = S.py; a.cx = S.px - 42; a.cy = S.py;
  for (const x of [...S.cargo]) if (!x.tool) State.removeCargo(x.id);
  return { quiet, hold, meet, stripe: NPC.svc(a).met };
});
ok('THE STAND, THREE WAYS, AND THE STRIPE COUNTING: a knife runs down a loaded Walker in the Pass camp\'s ring with a back walking point — under QUIET the back keeps its hands down and the knife reaches the Walker; under HOLD the knife walks past the back at two hundred and is met only inside the ring of 120 round the Walker; under MEET IT he is met at the back\'s full reach, far out — and the service stripe counts every one met',
  r.quiet.met === 0 && r.quiet.hurt > 0 && r.hold.met === 1 && r.hold.at <= 126 && r.hold.hurt === 0 && r.meet.met === 1 && r.meet.at > 150 && r.meet.hurt === 0 && r.stripe >= 2, JSON.stringify(r));

/* ================= 9 · VOICE, THE SCOUT, AND THE ROLL CALL ================= */
r = await ev(() => {
  __meadow(); const [a, b] = NPC.party();
  const talk = voice => { NPC.setOrder(a, 'voice', voice); NPC.setOrder(b, 'voice', voice); a.barkT = 0; b.barkT = 0; __said.length = 0; S.speed = 20; NPC.update(0.05); S.speed = 0; return __said.length; };
  const spoke = talk('talk'), hushed = talk('quiet');
  NPC.applyPreset(a, 'scout');
  const O = NPC.ordersOf(a), whole = O.preset === 'scout' && O.station === 'point' && O.mess === 'own' && O.stand === 'hold' && O.voice === 'quiet'
    && !NPC.allows(a, 'loot', 'junk_cog') && !NPC.allows(a, 'loot', 'metal') && !NPC.allows(a, 'hand', 'metal') && !NPC.allows(a, 'hand', 'ration');
  const curio = Object.keys(DATA.items).find(id => Ledger.classify(id) === 'relics'), freight = Object.keys(DATA.items).find(id => Ledger.classify(id) === 'trade');
  const sweepsRight = NPC.allows(a, 'loot', freight) && (!curio || NPC.allows(a, 'loot', curio));
  /* the roll call: every back sounds off its orders, in turn — the calls that matter still come under a quiet voice */
  __said.length = 0; NPC.rollCall(); for (let i = 0; i < 80; i++) NPC.update(0.05);
  const lines = __said.filter(l => /^(Tam|Bo): /.test(l));
  return { spoke, hushed, whole, sweepsRight, lines, want: `Tam: ${NPC.callLine(a)}` };
});
ok('VOICE, THE SCOUT, AND THE ROLL CALL: a talking back says its line on the road and a QUIET one says nothing; THE SCOUT lands whole (on point, eating its own, holding your back, quiet; sweeping freight and curios, never junk or the stores; lifting nothing off your back); CALL THE ROLL and every back sounds off in turn in the roll-call words — "Tam: on point, holding your back, eating my own." — quiet voice or not',
  r.spoke >= 1 && r.hushed === 0 && r.whole && r.sweepsRight && r.lines.length === 2 && r.lines[0] === 'Tam: on point, holding your back, eating my own.' && r.want === r.lines[0], JSON.stringify(r));

/* ================= 10 · THE CREW SHEET ON O ================= */
await ev(() => { __meadow(); UI.closeAllModals(); const a = NPC.party()[0]; a.cx = S.px + 30; a.cy = S.py + 60; });   // a ghost mark: a back not yet at its slot
await page.keyboard.press('o'); await page.waitForTimeout(700);
r = await ev(() => {
  const ov = document.getElementById('musterOv'), body = document.getElementById('musterBody');
  const plates = [...body.querySelectorAll('.muPlate')], figs = plates.map(p => [...p.querySelectorAll('.muFig img')].every(im => im.complete && im.naturalWidth > 0 && /^data:image\/png/.test(im.src)));
  const cv = document.getElementById('muWedge'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let lit = 0, gold = 0; for (let i = 0; i < d.length; i += 4) { if (Math.abs(d[i] - 0x0b) + Math.abs(d[i + 1] - 0x10) + Math.abs(d[i + 2] - 0x17) > 40) lit++; if (d[i] > 200 && d[i + 1] > 150 && d[i + 2] < 150) gold++; }
  return { open: __vis('musterOv'), title: ov.querySelector('header h2').textContent, any: UI.anyModal(), frozen: UI.worldFrozen(), gate: UI.gateReport().includes('the muster sheet'),
    plates: plates.length, figs: figs.every(Boolean), stripe: plates.every(p => /km/.test(p.querySelector('.muSvc').textContent)), groups: [...body.querySelectorAll('.fmGroup')].map(g => g.textContent).filter(t => /WALKING WITH YOU|AT THE FIRES/.test(t)).length,
    presets: body.querySelectorAll('[data-preset]').length, choices: body.querySelectorAll('[data-order]').length, marks: body.querySelectorAll('.lgBox[data-tree]').length, trees: [...new Set([...body.querySelectorAll('.lgBox[data-tree]')].map(b => b.dataset.tree))].join(), lit, gold, sel: MusterUI.selected() };
});
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
const escM = await ev(() => !__vis('musterOv') && !UI.anyModal());
ok('THE CREW SHEET ON O: a real O opens the roll (v3.49: Crew) under the modal law (the modal list, the frozen clock, the gate report names it; Esc folds it) — everyone under command grouped by where they stand, every plate with the walker\'s OWN figure drawn and the service stripe; the standing orders pane with five presets, twelve choices and the marks over the two trees (v3.45/v3.47: fifty-four — the keepsakes and the gifts joined the curios); the formation board painted with pixels (the figures, the ties, the gold ghost mark of a back not yet at its slot)',
  r.open && r.title === 'Crew' && r.any && r.frozen && r.gate && r.plates >= 3 && r.figs && r.stripe && r.groups === 2 && r.presets === 5 && r.choices === 12 && r.marks === 54 && r.trees === 'loot,hand' && r.lit > 2000 && r.gold > 20 && escM, JSON.stringify({ r, escM }));

/* ================= 11 · THE PARENT LAW ON ONE BACK'S STORE ================= */
await ev(() => { const a = NPC.party()[1]; NPC.applyPreset(a, 'own', true); MusterUI.open(a.id); });
await page.waitForTimeout(300);
await page.click('#musterBody .lgBox[data-tree="loot"][data-node="resources"]'); await page.waitForTimeout(150);
const off = await ev(() => { const a = NPC.party()[1], P = a.orders.policy, st = id => Ledger.markStateIn(P, id, 'loot'); return { res: st('resources'), kids: ['wood', 'metal', 'ceramic', 'lumen'].map(st), box: document.querySelector('#musterBody .lgBox[data-tree="loot"][data-node="wood"]').className, other: NPC.allows(NPC.party()[0], 'loot', 'metal') }; });
await page.click('#musterBody .lgBox[data-tree="loot"][data-node="wood"]'); await page.waitForTimeout(150);
const mixed = await ev(() => { const a = NPC.party()[1], P = a.orders.policy, st = id => Ledger.markStateIn(P, id, 'loot'); const box = document.querySelector('#musterBody .lgBox[data-tree="loot"][data-node="resources"]'); return { res: st('resources'), wood: st('wood'), metal: st('metal'), box: box.className, pack: Ledger.markState('resources', 'deliver'), hand: document.querySelector('#musterBody .muPlate.sel .muOrd').textContent }; });
/* the sheet is a view of the back's store: wiped and drawn again from nothing, it reads the same marks */
const redrawn = await ev(() => { document.getElementById('musterBody').innerHTML = ''; MusterUI.render(); const q = nd => document.querySelector(`#musterBody .lgBox[data-tree="loot"][data-node="${nd}"]`).className; return { res: q('resources'), wood: q('wood'), metal: q('metal'), hand: document.querySelector('#musterBody .muPlate.sel .muOrd').textContent, sel: MusterUI.selected() === NPC.party()[1].id }; });
await ev(() => MusterUI.close());
ok('THE PARENT LAW ON ONE BACK\'S STORE: on the sheet, a real click on Resources under SWEEP turns it OFF and clears every child (wood, metal, ceramic, lumen all off) on that back alone; a click on Wood turns it ON alone, and Resources reads MIXED — the plate now says HAND-SET ORDERS; and the sheet is only a view of that store (wiped and drawn again from nothing, it reads the same marks on the same back)',
  off.res === 'off' && off.kids.every(k => k === 'off') && !/on|mixed/.test(off.box.replace('lgBox', '')) && mixed.res === 'mixed' && mixed.wood === 'on' && mixed.metal === 'off' && /mixed/.test(mixed.box) && /HAND-SET ORDERS/.test(mixed.hand)
  && redrawn.sel && /mixed/.test(redrawn.res) && /\bon\b/.test(redrawn.wood) && !/\bon\b|mixed/.test(redrawn.metal.replace('lgBox', '')) && /HAND-SET ORDERS/.test(redrawn.hand), JSON.stringify({ off, mixed, redrawn }));

/* ================= 12 · THE PAPERS, THE KEYS, THE LESSONS ================= */
await ev(async () => { UI.closeAllModals(); UI.toggleMap(true); await __wait(200); });
await page.click('#railMusterBtn'); await page.waitForTimeout(300);
r = await ev(() => {
  const rail = __vis('musterOv'); MusterUI.close();
  const paper = PAPERS.find(p => p.id === 'muster');
  return { rail, paper: !!paper && paper.name === 'CREW' && paper.key === 'muster' && paper.open === 'muster', key: KEYS.capFor('muster'), lesson: !!DATA.tutorials.firstMuster && !!DATA.tutorialTitles.firstMuster && !!S.flags.tut.firstMuster, called: MUSTER.CALL.station.point };
});
await ev(() => { ManualUI.open('papers'); });
await page.click('#fmBody [data-fmopen="muster"]'); await page.waitForTimeout(300);
const fromManual = await ev(() => { const o = __vis('musterOv') && !__vis('helpOv'); MusterUI.close(); return o; });
ok('THE PAPERS, THE KEYS, THE LESSONS: the roll opens from the survey\'s rail, from its key (O, a KEYS row) and from the manual\'s Windows — where it stands as CREW with its key; its lesson walks on the first opening',
  r.rail && r.paper && r.key === 'O' && r.lesson && fromManual, JSON.stringify({ r, fromManual }));

/* ================= 13 · THE SAVE ================= */
r = await ev(() => {
  const pick = n => JSON.stringify({ o: n.orders, s: { km: +n.svc.km.toFixed(3), crates: n.svc.crates, met: n.svc.met, sweeps: n.svc.sweeps, meals: n.svc.meals, steadies: n.svc.steadies, last: n.svc.last } });
  const before = NPC.party().map(pick);
  State.save(); const okL = State.load();
  const after = NPC.party().map(pick);
  return { okL, same: JSON.stringify(before) === JSON.stringify(after), n: after.length, scout: NPC.ordersOf(NPC.party()[0]).preset };
});
ok('THE SAVE: every back\'s standing orders (the preset or the hand-set orders, the four orders, both trees\' marks) and its service stripe (kilometres, crates, runners met, sweeps, meals, steadies, the last thing it did) survive a save and load',
  r.okL && r.same && r.n === 2 && r.scout === 'scout', JSON.stringify(r));

await T.finish('the muster');
