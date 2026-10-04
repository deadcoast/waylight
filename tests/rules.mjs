/* rules.mjs — v3.0 THE LOOP'S RULES (v3.51 rebuild, mine: the v3.48 source was lost and its record names only its subjects, so
   each check is my reading of one, tested as the game has it now; its figures sampled on the courier's grid). The rules the
   balance bot forced on the loop, each as a mechanism: a crate that leaves the back is never silently gone — the Guide says
   where it went and points there (on the ground, at a snag, in a camp's stash, in a town's lockers, gone for good), the
   compass keeps its crate mark through any crowd and any distance, and the tray card turns rust and says where; walked back
   to, E picks it up and a click on it walks there and lifts it, the order whole; the knives who lift a crate carry it to
   their fire and the Guide follows it into the stash, raided back with E; ✕ gives an order up — its crates lost cargo for
   the same door at half the town's credit, a ★ order back on its board; a companion's load delivers with you, handed over
   at the terminal; a board never posts for a need its town is thriving on; a mailbag carried off refills over five minutes;
   loaded, a walk plans round a camp's claim and empty it walks straight through; a shortage the wire is closing dims the
   light and costs no star; a crisis empties the best-stocked shelf, and only once three towns burn; feet that stop
   advancing mark the ground, re-plan at most three times, and stop honestly; and a town coming on the wire is a scene that
   names who will feed it. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;

await ev(() => {
  for (const id of ['elm', 'mill', 'green']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true);
  S.weather = { state: 'clear', t: 99999, intensity: 0 }; S.eventCd = 99999;   // no weather turns and no road events mid-measure
  WL.timeScale = 1e-9;   // the live clock held; the world is stepped here, frame by frame, where a check walks it
  window.__in = (o = {}) => ({ up: false, down: false, left: false, right: false, shift: false, space: false, ml: false, mr: false, mouse: null, ...o });
  window.__rnd = (v, fn) => { const R = Math.random; Math.random = typeof v === 'function' ? v : () => v; try { return fn(); } finally { Math.random = R; } };
  window.__vit = () => { S.health = 100; S.bleeding = false; S.warmth = 100; S.food = 100; S.state = 'walk'; S.stagger = 0; S.qte = null; S.struggle = null; S.moveTo = null; S.route = []; };
  window.__clean = () => { for (const c of [...S.cargo]) if (c.cat !== 'tool') State.removeCargo(c.id); };
  window.__toasts = []; new MutationObserver(ms => { for (const m of ms) for (const n2 of m.addedNodes) if (n2.textContent) __toasts.push(n2.textContent); }).observe(document.getElementById('toasts'), { childList: true });
  window.__guide = () => { const g = document.getElementById('guide'); return { head: document.getElementById('guideHead').textContent, sub: document.getElementById('guideSub').textContent, step: g.dataset.step, urgent: g.classList.contains('urgent'), color: g.style.borderLeftColor, bearing: g.dataset.bearing === undefined ? null : +g.dataset.bearing, dist: g.dataset.dist === undefined ? null : +g.dataset.dist, hidden: g.classList.contains('hidden') }; };
  window.__aim = (x, y) => +Math.atan2(y - S.py, x - S.px).toFixed(3);
  window.__card = idNum => { const c = document.querySelector(`#orderTray .trayCard[data-focus="${idNum}"]`); if (!c) return null; const m = c.querySelector('.miss'), x = c.querySelector('.giveUp'); return { missing: c.classList.contains('missing'), miss: m ? m.textContent : null, missOk: m ? m.classList.contains('ok') : null, edge: getComputedStyle(c).borderLeftColor, x: x ? getComputedStyle(x).opacity : null }; };
  window.__settle = async () => { S.time += 0.12; await __wait(160); await __frames(2); };   // a hair of game time: the Guide's arrow re-reads where the Walker now stands
  window.__accept = (from, item, to) => { const b = Systems.boardFor(from).find(x => !x.prio && x.def.item === item && x.def.to === to); return b ? Systems.acceptOrder(b.def, false) : null; };
  /* nothing a click would take instead within r of (x, y): no ruin, node, lost cargo, cairn, drop or terminal */
  window.__quiet = (x, y, r) => !S.ruins.some(q => !q.looted && U.dist(q.x, q.y, x, y) < r) && !S.nodes.some(q => !q.taken && U.dist(q.x, q.y, x, y) < r) && !S.lost.some(q => !q.taken && U.dist(q.x, q.y, x, y) < r) && !S.graves.some(q => U.dist(q.x, q.y, x, y) < r) && !S.drops.some(q => U.dist(q.x, q.y, x, y) < r) && !DATA.stationOrder.some(id => U.dist(DATA.stations[id].x, DATA.stations[id].y, x, y) < r + 140);
  /* a walkable spot of open meadow near (x, y) — and, asked, one nothing else stands near */
  window.__open = (x, y, quiet = 0) => { for (let r = 0; r < 600; r += 20) for (let a = 0; a < 6.28; a += 0.4) { const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r, t = World.terrainAt(px, py); if (!t.blocked && !t.water && t.slope < 0.2 && (!quiet || __quiet(px, py, quiet))) return [px, py]; } return [x, y]; };
});

/* ================= 1 · THE GUIDE SAYS WHERE IT WENT ================= */
await ev(async () => { await __stage(); });
const guideRun = await ev(async () => {
  __vit(); __clean();
  const o = __accept('haven', 'tools', 'elm'), it = S.cargo.find(c => c.id === o.items[0]);
  const read = async (x, y) => { await __settle(); const g = __guide(); return { ...g, aim: x === undefined ? null : __aim(x, y), card: __card(o.idNum) }; };
  const out = { name: it.name, o: o.idNum };
  /* a stumble drops it: the ring left to close, the dice held so the crate is the one that falls */
  __rnd(0, () => { S.qte = { t: 5, dur: 1 }; Systems.update(0.016, __in()); });
  const dr = S.drops.find(d => d.item.id === it.id);
  out.ground = { ...(await read(dr.x, dr.y)), off: [Math.round(dr.x - S.px), Math.round(dr.y - S.py)] };
  /* back on the pack, then a wraith's yank snags it */
  S.drops.splice(S.drops.indexOf(dr), 1); State.addCargo(it); __vit();
  const w = { id: U.uid(), x: S.px + 26, y: S.py - 8, alert: 1, state: 'hunt', cd: 0, ph: 0 };
  S.struggle = { meter: 0.0005, wraith: w };
  __rnd(0.5, () => Systems.update(0.016, __in()));
  const sn = S.snags.find(s => s.item.id === it.id);
  out.snag = await read(sn.x, sn.y); out.snag.at = sn ? [Math.round(sn.x - w.x), Math.round(sn.y - w.y)] : null;
  /* the knives carry it into Pass Camp (the carrying itself is check 5's) */
  S.snags.splice(S.snags.indexOf(sn), 1); S.camps.pass.stash.push(it); __vit();
  const cd = DATA.camps.find(c => c.id === 'pass');
  out.camp = await read(cd.x, cd.y);
  S.camps.pass.stash.splice(S.camps.pass.stash.indexOf(it), 1); State.addCargo(it);
  WL.tp('haven');
  return out;
});
/* locked in Haven's lockers by a real click on its Storage tab */
await ev(() => { UI.openStation('haven'); });
await page.click('#stationTabs [data-tab="storage"]'); await page.waitForTimeout(150);
await page.click(`#stationBody [data-store="${await ev(() => S.cargo.find(c => c.orderId && c.defId === 'tools').id)}"]`); await page.waitForTimeout(150);
await page.click('#stationClose'); await page.waitForTimeout(150);
const guideRun2 = await ev(async () => {
  WL.tp(__open(DATA.stations.haven.x + 420, DATA.stations.haven.y + 240));
  await __settle();
  const H = DATA.stations.haven, g = __guide();
  const inLockers = S.stations.haven.storage.some(c => c.orderId && c.defId === 'tools');
  const storage = { ...g, aim: __aim(H.x, H.y), inLockers };
  /* and gone for good: out of the lockers and out of the world */
  const lk = S.stations.haven.storage.find(c => c.orderId && c.defId === 'tools');
  S.stations.haven.storage.splice(S.stations.haven.storage.indexOf(lk), 1);
  await __settle();
  const gone = __guide();
  window.__toolsCrate = lk;
  return { storage, gone };
});
const oTools = guideRun.o;
const cards = await ev(async id => {
  const gone = __card(id);
  S.stations.haven.storage.push(__toolsCrate); await __settle(); const lockers = __card(id);   // the tray read at the lockers too
  S.stations.haven.storage.splice(S.stations.haven.storage.indexOf(__toolsCrate), 1); State.addCargo(__toolsCrate); await __settle(); const packed = __card(id);
  return { gone, lockers, packed };
}, oTools);
const G = guideRun, G2 = guideRun2;
const nm = G.name;
ok('THE GUIDE SAYS WHERE IT WENT: a crate that leaves the back is never silently gone — a stumble drops it ("Hand tools is on the ground — go back for it", the arrow on the crate), a wraith\'s yank snags it ("hangs at a snag", the arrow on the snag), the knives carry it off ("Scrappers took Hand tools to Pass Camp — their stash holds it", the arrow on the camp), a real click at Haven\'s Storage tab locks it up ("is in Haven\'s lockers", the arrow home, in gold), and gone out of the world the line says so ("Your cargo is gone — Elm Farm\'s order can\'t be filled") and points at the tray\'s ✕ — the line rust and urgent for every loss, gold for the lockers',
  G.ground.head === `${nm} is on the ground — go back for it` && /Elm Farm is still waiting on it/.test(G.ground.sub) && G.ground.step === 'lost' && G.ground.urgent && Math.abs(G.ground.bearing - G.ground.aim) < 0.02 && G.ground.dist < 40
  && G.snag.head === `${nm} hangs at a snag` && /The wraith carried it off/.test(G.snag.sub) && G.snag.urgent && Math.abs(G.snag.bearing - G.snag.aim) < 0.02
  && G.camp.head === `Scrappers took ${nm} to Pass Camp` && /Their stash holds it/.test(G.camp.sub) && G.camp.urgent && Math.abs(G.camp.bearing - G.camp.aim) < 0.02
  && G2.storage.inLockers && /^Hand tools is in Haven.s lockers$/.test(G2.storage.head) && !G2.storage.urgent && Math.abs(G2.storage.bearing - G2.storage.aim) < 0.02
  && /^Your cargo is gone — Elm Farm.s order can.t be filled$/.test(G2.gone.head) && /Give it up on the tray \(✕\)/.test(G2.gone.sub) && G2.gone.urgent && G2.gone.bearing === null,
  JSON.stringify({ ground: G.ground, snag: G.snag, camp: G.camp, storage: G2.storage, gone: G2.gone }));

/* ================= 2 · THE COMPASS KEEPS THE CRATE ================= */
const compass = await ev(async () => {
  __vit(); __clean(); S.orders.active.length = 0;
  const H = DATA.stations.haven;
  S.stations.mill.stock.textiles = 20;   // the Mill short: two crates on the card
  const [px, py] = __open(H.x + 520, H.y + 260);
  WL.tp([px, py]);
  const o = __accept('haven', 'textiles', 'mill');
  const [a, b] = o.items.map(id => S.cargo.find(c => c.id === id));
  /* crate A falls where the Walker stands; crate B falls a long walk north-east */
  __rnd(0, () => { S.qte = { t: 5, dur: 1 }; Systems.update(0.016, __in()); });
  __vit();
  const far = __open(px + 1050, py - 1050, 220);   // a spot nothing else a click could take stands near
  WL.tp(far); __rnd(0, () => { S.qte = { t: 5, dur: 1 }; Systems.update(0.016, __in()); });
  __vit(); WL.tp([px, py]);
  const dA = S.drops.find(d => d.item.id === a.id), dB = S.drops.find(d => d.item.id === b.id);
  /* a crowd on crate B's bearing: six loose rations near enough for the strip, dropped before it */
  const ang = Math.atan2(dB.y - py, dB.x - px);
  for (let i = 0; i < 6; i++) S.drops.unshift({ id: U.uid(), item: State.makeItem('ration'), x: px + Math.cos(ang + (i - 2.5) * 0.004) * (300 + i * 45), y: py + Math.sin(ang + (i - 2.5) * 0.004) * (300 + i * 45) });
  await __settle(); await __wait(100);
  const marks = [...document.querySelectorAll('#compassInner .cMark')].map(m => ({ t: m.title, c: m.style.color, guide: m.classList.contains('guide'), bare: m.classList.contains('bare'), words: m.textContent }));
  const crateMarks = marks.filter(m => /^crate /.test(m.t));
  const loose = marks.filter(m => /^dropped /.test(m.t));
  const distB = Math.round(U.dist(px, py, dB.x, dB.y));
  window.__cmp = { o: o.idNum, a: a.id, b: b.id, px, py };
  return { o: o.idNum, distB, crateMarks, loose: loose.length, crowd: 6, marks: marks.length, guideOn: (crateMarks.find(m => m.guide) || {}).t, card: __card(o.idNum) };
});
ok('THE COMPASS KEEPS THE CRATE: two signed crates on the ground are two rust crate marks on the strip — the nearer is the Guide\'s own mark, and the one a long walk away (past the six hundred paces where a loose drop leaves the strip) keeps its own through a crowd of six loose rations dropped on its very bearing: the crowd yields, the crate never does',
  compass.crateMarks.length === 2 && compass.crateMarks.every(m => m.c === 'rgb(224, 101, 74)') && compass.crateMarks.filter(m => m.guide).length === 1 && compass.distB > 900 && compass.crateMarks.some(m => !m.guide && m.t === `crate ${(compass.distB / 1000).toFixed(1)} km`) && compass.loose < compass.crowd,
  JSON.stringify(compass));

/* ================= 3 · THE TRAY CARD IN RUST ================= */
ok('THE TRAY CARD IN RUST: the card of an order whose crate is off the back turns rust at its edge (the page\'s rust, where a whole card wears gold) with the ✕ standing out, and says where in a line of its own — "Textiles on the ground", "Hand tools in Haven\'s lockers", and gone out of the world "cargo lost for good" — and goes back to gold with no line the moment the crate is on the back again',
  compass.card.missing && compass.card.miss === 'Textiles on the ground' && compass.card.edge === 'rgb(255, 106, 61)' && compass.card.x === '1'
  && cards.lockers.missing && /^Hand tools in Haven.s lockers$/.test(cards.lockers.miss) && cards.gone.missing && cards.gone.miss === 'cargo lost for good'
  && !cards.packed.missing && cards.packed.miss === null && cards.packed.edge === 'rgb(255, 181, 79)',
  JSON.stringify({ ground: compass.card, lockers: cards.lockers, gone: cards.gone, packed: cards.packed }));

/* ================= 4 · PICKUP RECOVERY ================= */
await ev(() => { __vit(); WL.tp([__cmp.px, __cmp.py]); });
await page.keyboard.press('KeyE'); await page.waitForTimeout(200);
const pickA = await ev(async () => {
  const o = S.orders.active.find(x => x.idNum === __cmp.o);
  const onBack = S.cargo.some(c => c.id === __cmp.a), onGround = S.drops.some(d => d.item.id === __cmp.a);
  /* crate B: walk near it and click it on the ground — the click walks there and lifts it */
  const dB = S.drops.find(d => d.item.id === __cmp.b);
  WL.tp(__open(dB.x - 150, dB.y + 60, 0));
  if (U.dist(S.px, S.py, dB.x, dB.y) < 90) WL.tp(__open(dB.x + 150, dB.y - 60, 0));
  Render.setZoom(2); Render.cam.x = S.px; Render.cam.y = S.py;
  await __frames(3);
  const p = __toScr(dB.x, dB.y);
  return { same: !!o && o.items.includes(__cmp.a) && o.items.includes(__cmp.b), onBack, onGround, click: [Math.round(p.x), Math.round(p.y)] };
});
await ev(() => { WL.timeScale = 1; });
await page.mouse.click(pickA.click[0], pickA.click[1]);
const walked = await ev(async () => {
  const t0 = performance.now(); let armed = null;
  while (performance.now() - t0 < 9000) { if (!armed && S.moveTo) armed = { act: S.moveTo.act, label: S.moveTo.label }; if (S.cargo.some(c => c.id === __cmp.b)) break; await __wait(100); }
  WL.timeScale = 1e-9;
  await __settle();
  const o = S.orders.active.find(x => x.idNum === __cmp.o);
  return { armed, lifted: S.cargo.some(c => c.id === __cmp.b), ms: Math.round(performance.now() - t0), whole: !!o && o.items.every(id => S.cargo.some(c => c.id === id)), guide: __guide(), card: __card(__cmp.o), crateMarks: [...document.querySelectorAll('#compassInner .cMark')].filter(m => /^crate /.test(m.title)).length };
});
await ev(() => { Render.setZoom(null); });
ok('PICKUP RECOVERY: walked back to a dropped crate a real E lifts it onto the back, and a real click on the other where it lies walks there and lifts it (the click taken as walk-and-use) — the order whole again (the same order, both crates on the back), the Guide back on the plan ("Carry to The Mill"), the tray card gold with no line, the strip clear of crate marks',
  pickA.same && pickA.onBack && !pickA.onGround && walked.armed && walked.armed.act && walked.lifted && walked.whole && walked.guide.step === 'carry' && walked.guide.head === 'Carry to The Mill' && !walked.card.missing && walked.card.miss === null && walked.crateMarks === 0,
  JSON.stringify({ pickA, walked }));

/* ================= 5 · STASH TRACKING ================= */
const stash = await ev(async () => {
  __vit(); __clean();
  for (const o of [...S.orders.active]) S.orders.active.splice(S.orders.active.indexOf(o), 1);
  const o = __accept('haven', 'tools', 'elm'), it = S.cargo.find(c => c.id === o.items[0]);
  const cd = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass;
  c.stash = []; c.runners = [];
  /* a knife catches the loaded Walker inside the claim and knocks the crate loose */
  const [wx, wy] = __open(cd.x + 260, cd.y + 120);
  WL.tp([wx, wy]);
  c.runners.push({ x: wx + 10, y: wy, wa: 0, state: 'patrol', cd: 0, cls: 'knife' });
  S.flags.calm = true;
  __rnd(0.2, () => Systems.update(0.016, __in()));
  const knocked = S.drops.find(d => d.item.id === it.id);
  const hp = Math.round(S.health);
  /* the Walker leaves the claim empty-handed; the knives go for what lies in their ground */
  __vit(); WL.tp(__open(cd.x - 1500, cd.y + 900));
  const seen = []; let t = 0, carried = null;
  while (t < 60) {
    Systems.update(0.05, __in()); t += 0.05;
    const w = Guide.whereIs(it.id);
    if (!seen.length || seen[seen.length - 1] !== w.where) seen.push(w.where);
    if (!carried && c.runners.some(r => r.carry && r.carry.id === it.id)) carried = { t: +t.toFixed(1), where: w.where, guide: (await __settle(), __guide().head) };
    if (c.stash.some(s => s.id === it.id)) break;
  }
  await __settle();
  const inStash = c.stash.some(s => s.id === it.id), g = __guide(), aim = __aim(cd.x, cd.y);
  window.__st = { o: o.idNum, it: it.id };
  WL.tp([cd.x + 20, cd.y + 30]); S.moveTo = null;
  return { knocked: !!knocked, hp, seen, carried, inStash, t: +t.toFixed(1), guide: g, aim, rail: Systems.getInteractions().filter(i => i.key === 'E').map(i => i.label.replace(/<[^>]+>/g, '')) };
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(200);
const raid = await ev(async () => {
  const back = S.cargo.some(c => c.id === __st.it), c = S.camps.pass;
  WL.tp('haven'); await __settle();
  return { back, stashLeft: c.stash.length, guide: __guide().head };
});
ok('STASH TRACKING: a knife that catches the loaded Walker in Pass Camp\'s claim knocks the crate loose; left lying in their ground a runner walks to it, lifts it and carries it to the fire — the Guide follows it the whole way (on the ground, then "Scrappers took Hand tools to Pass Camp" while it is carried and in the stash, the arrow on the camp) — and at the fire the rail offers the raid, a real E takes it back onto the pack and the Guide returns to the plan',
  stash.knocked && stash.carried && stash.carried.where === 'camp' && stash.carried.guide === 'Scrappers took Hand tools to Pass Camp' && stash.inStash && stash.seen.join('>') === 'ground>camp' && stash.guide.head === 'Scrappers took Hand tools to Pass Camp' && Math.abs(stash.guide.bearing - stash.aim) < 0.02 && stash.rail[0] === 'Raid stash of Pass Camp (1)' && raid.back && raid.stashLeft === 0 && !/Scrappers/.test(raid.guide),
  JSON.stringify({ stash, raid }));

/* ================= 6 · GIVING UP ================= */
const give0 = await ev(async () => {
  __vit(); __clean();
  for (const o of [...S.orders.active]) S.orders.active.splice(S.orders.active.indexOf(o), 1);
  S.stations.mill.stock.textiles = 20;
  WL.tp(__open(DATA.stations.haven.x + 420, DATA.stations.haven.y + 240));
  const o = __accept('haven', 'textiles', 'mill');
  await __settle();
  window.__gv = { o: o.idNum, items: o.items.slice() };
  return { o: o.idNum, n: o.items.length, onBoard: Systems.boardFor('haven').some(b => b.def.item === 'textiles' && b.def.to === 'mill') };
});
await page.hover(`#orderTray .trayCard[data-focus="${give0.o}"]`); await page.click(`#orderTray .trayCard[data-focus="${give0.o}"] .giveUp`); await page.waitForTimeout(200);
const give1 = await ev(async () => {
  const gone = !S.orders.active.some(x => x.idNum === __gv.o);
  const crates = __gv.items.map(id => S.cargo.find(c => c.id === id)).map(c => c && { name: c.name, lostTo: c.lostTo, orderId: c.orderId });
  const toast = __toasts.find(t => /^Gave up Textiles for The Mill/.test(t)) || '';
  const posted = Systems.boardFor('haven').some(b => b.def.item === 'textiles' && b.def.to === 'mill');
  /* delivered after all, at the Mill's terminal: lost cargo, the walker paid and the town half of it */
  WL.tp('mill'); const likes0 = S.likes, town0 = S.stations.mill.likesTo;
  UI.openStation('mill'); const handover = !!S.handover; WL.skipHandover();
  await __wait(200);
  const paid = S.likes - likes0, town = S.stations.mill.likesTo - town0;
  const left = __gv.items.filter(id => S.cargo.some(c => c.id === id)).length;
  for (const id of ['results', 'stationOv']) document.getElementById(id).classList.add('hidden');
  return { gone, crates, toast, posted, handover, paid, town, left };
});
/* the ★ given up: back on its board */
const star0 = await ev(async () => {
  __vit(); __clean();
  S.orders.prioIdx = 2; S.orders.prioAccepted = false;
  WL.tp(__open(DATA.stations.haven.x + 420, DATA.stations.haven.y + 240));
  const p = DATA.priority[2], o = Systems.acceptOrder(p, false);
  await __settle();
  window.__star = { o: o.idNum, items: o.items.slice() };
  return { o: o.idNum, title: p.title, core: S.cargo.some(c => c.defId === 'core'), onBoard: Systems.boardFor('haven').some(b => b.prio) };
});
await page.hover(`#orderTray .trayCard[data-focus="${star0.o}"]`); await page.click(`#orderTray .trayCard[data-focus="${star0.o}"] .giveUp`); await page.waitForTimeout(200);
const star1 = await ev(() => {
  const back = Systems.boardFor('haven').find(b => b.prio);
  return { accepted: S.orders.prioAccepted, back: back && back.def.title, core: S.cargo.some(c => c.defId === 'core'), letters: S.cargo.filter(c => c.defId === 'letters').map(c => c.lostTo), toast: __toasts.find(t => /^Gave up First light for Elm Farm — it is posted again at Haven/.test(t)) || '' };
});
await ev(() => { __clean(); S.orders.prioIdx = 0; S.orders.prioAccepted = false; });
ok('GIVING UP: a real click on the tray card\'s ✕ gives the order up — the card goes, its crates stay on the back as lost cargo for the same door ("Textiles (lost)", bound for The Mill, no order), the need stays posted on the board, and carried there after all they are handed over at the terminal for half the town\'s credit (the walker paid in full, the Mill\'s star meter half of it); a ★ order given up the same way goes back on its board at Haven, its core taken off the back',
  !give0.onBoard && give1.gone && give1.crates.length === 2 && give1.crates.every(c => c && c.name === 'Textiles (lost)' && c.lostTo === 'mill' && c.orderId === null) && !!give1.toast && give1.posted && give1.handover && give1.left === 0 && give1.paid > 0 && give1.town === Math.round(give1.paid * 0.5)
  && star0.core && !star0.onBoard && !star1.accepted && star1.back === star0.title && !star1.core && star1.letters.every(t => t === 'elm') && !!star1.toast,
  JSON.stringify({ give0, give1, star0, star1 }));

/* ================= 7 · THE COMPANION'S LOAD DELIVERS WITH YOU ================= */
const comp0 = await ev(async () => {
  __vit(); __clean();
  for (const o of [...S.orders.active]) S.orders.active.splice(S.orders.active.indexOf(o), 1);
  S.banked.metal = 70; S.banked.ceramic = 50; S.banked.provisions = 40;
  WL.tp('haven');
  const n = S.npcs.find(x => x.state === 'pool' && x.at === 'haven');
  NPC.hire(n, 'companion'); UI2.updateMoodles();
  const o = __accept('haven', 'tools', 'elm');
  window.__cp = { n: n.id, o: o.idNum, it: o.items[0] };
  await __settle();
  return { hired: n.state, name: n.name, o: o.idNum };
});
await page.click('#compChip'); await page.waitForTimeout(200);
await page.click(`#txYou [data-txgive="${await ev(() => __cp.it)}"]`); await page.waitForTimeout(200);
await page.click('#txClose'); await page.waitForTimeout(150);
const comp1 = await ev(async () => {
  const n = S.npcs.find(x => x.id === __cp.n);
  const withThem = n.carry.some(c => c.id === __cp.it), lost = Guide.lostCrate();
  await __settle();
  const card = __card(__cp.o), g = __guide();
  WL.tp('elm'); n.cx = S.px + 24; n.cy = S.py + 18;
  await __settle();
  const rail = Systems.getInteractions().filter(i => i.key === 'E').map(i => i.label.replace(/<[^>]+>/g, ''));
  return { withThem, lost, card, guide: g.head, rail, name: n.name };
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(250);
const comp2 = await ev(async () => {
  const handover = !!S.handover; WL.skipHandover(); await __wait(150);
  const n = S.npcs.find(x => x.id === __cp.n);
  const out = { handover, landed: !S.orders.active.some(x => x.idNum === __cp.o), stillWithThem: n.carry.some(c => c.id === __cp.it), sheet: !document.getElementById('stationOv').classList.contains('hidden') };
  UI.closeAllModals && UI.closeAllModals();
  for (const id of ['results', 'stationOv']) document.getElementById(id).classList.add('hidden');
  /* with something of the Walker's own to hand over at the same door, the hand-over runs and takes the companion's crate back
     (v3.51: a second order, its crate on the companion's back — the first landed on its own) */
  WL.tp('haven'); S.stations.elm.stock.tools = 20; const o2 = __accept('haven', 'tools', 'elm'), it2 = o2 ? o2.items[0] : null;
  if (it2) n.carry.push(S.cargo.splice(S.cargo.findIndex(c => c.id === it2), 1)[0]);
  WL.tp('elm'); n.cx = S.px + 24; n.cy = S.py + 18;
  const lostCrate = State.makeItem('meds'); lostCrate.lostTo = 'elm'; lostCrate.name += ' (lost)'; State.addCargo(lostCrate);
  const n0 = n.carry.length;
  UI.openStation('elm'); const h2 = !!S.handover; WL.skipHandover(); await __wait(150);
  out.mixed = { handover: h2, order: !!o2, landed: !!o2 && !S.orders.active.some(x => x.idNum === o2.idNum), taken: n0 > 0 && !!it2 && !n.carry.some(c => c.id === it2), lostIn: !S.cargo.includes(lostCrate) };
  for (const id of ['results', 'stationOv']) document.getElementById(id).classList.add('hidden');
  NPC.dismiss(n, 'elm');
  return out;
});
ok('THE COMPANION\'S LOAD DELIVERS WITH YOU: the order\'s crate handed to the companion by real clicks (the party card, the crate, Done) is no lost crate — the card says "with" them in the calm line, never rust, and the Guide keeps the plan (Carry to Elm Farm) — and at Elm Farm\'s door the rail offers DELIVER and a real E hands it over with you (v3.51: the companion\'s crates are counted at the door; they had been left out): the hand-over plays and the order lands (and so it does when the Walker carries something of their own for the same door — then the hand-over takes the companion\'s crate back)',
  comp1.withThem && comp1.lost === null && !comp1.card.missing && comp1.card.missOk && comp1.card.miss === `Hand tools with ${comp1.name}` && comp1.guide === 'Carry to Elm Farm' && comp1.rail.some(r => /^DELIVER — 1 crate to Elm Farm/.test(r))
  && comp2.handover && comp2.landed && !comp2.stillWithThem && comp2.mixed.handover && comp2.mixed.landed && comp2.mixed.taken && comp2.mixed.lostIn,
  JSON.stringify({ comp0, comp1, comp2 }));

/* ================= 8 · NO BOARD POSTS FOR THE THRIVING ================= */
const thrive = await ev(() => {
  __clean(); for (const o of [...S.orders.active]) S.orders.active.splice(S.orders.active.indexOf(o), 1);
  S.banked.metal = 40; S.banked.ceramic = 30; S.banked.provisions = 20; S.banked.lumen = 0; S.banked.wood = 0;   // under the reserve: no surplus card on the board
  const card = v => { S.stations.elm.stock.tools = v; const b = Economy.ordersFor('haven').find(o => o.item === 'tools' && o.to === 'elm'); return b ? { n: b.n, mood: b.mood, express: b.express } : null; };
  const ladder = { 90: card(90), 65: card(65), 64: card(64), 30: card(30), 10: card(10) };
  S.stations.elm.stock.tools = 44;
  /* every board of every lit town, every card: never a thriving need */
  for (const id of DATA.stationOrder) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = [12, 30, 50, 80, 95][(id.length + g.length) % 5];
  let cards = 0, thriving = 0;
  for (const from of DATA.stationOrder.filter(id => S.stations[id].connected)) for (const o of Economy.ordersFor(from)) { if (!o.item || o.service || o.relight || o.surplus || o.salvage || o.convoy || o.circuit) continue; cards++; if (Economy.needMood(o.to, o.item) === 'thriving') thriving++; }
  const thrivingPairs = DATA.stationOrder.flatMap(id => DATA.stations[id].needs.filter(g => Economy.needMood(id, g) === 'thriving').map(g => id + ':' + g)).length;
  for (const id of DATA.stationOrder) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 50;
  return { ladder, cards, thriving, thrivingPairs };
});
ok('NO BOARD POSTS FOR THE THRIVING: Haven\'s board asks for no tools for Elm Farm while Elm\'s shelf is thriving (90, and 65 — thriving begins there) and posts them the moment it is not (64: steady, one crate; 30: wanting, two; 10: out, two, express); and across every lit board, with shelves set high and low all over the valley, not one card is for a need its town is thriving on',
  thrive.ladder[90] === null && thrive.ladder[65] === null && thrive.ladder[64] && thrive.ladder[64].mood === 'steady' && thrive.ladder[30] && thrive.ladder[30].mood === 'wanting' && thrive.ladder[30].n >= 2 && thrive.ladder[10] && thrive.ladder[10].mood === 'critical' && thrive.ladder[10].express && thrive.cards >= 4 && thrive.thriving === 0 && thrive.thrivingPairs >= 3,
  JSON.stringify(thrive));

/* ================= 9 · THE MAILBAG REFILLS SLOWLY ================= */
const mail = await ev(() => {
  __clean(); for (const o of [...S.orders.active]) S.orders.active.splice(S.orders.active.indexOf(o), 1);
  const st = S.stations.haven, TT = DATA.T;
  st.bag = TT.bagCost;   // exactly one run's worth
  const letters = () => Economy.ordersFor('haven').filter(o => o.item === 'letters');
  const before = letters().length;
  const run = letters()[0]; Systems.acceptOrder(run, false);
  const afterBag = st.bag;
  for (const c of [...S.cargo]) if (c.defId === 'letters') State.removeCargo(c.id);
  S.orders.active = S.orders.active.filter(o => o.item !== 'letters');   // carried and delivered: the bag is what remains
  const pinned = () => { for (const id of DATA.stationOrder) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 50; };
  let t = 0, back = null, checks = 0;
  while (t < 600) { pinned(); Economy.update(1); t += 1; if (t % 10 === 0) { checks++; if (letters().length) { back = t; break; } } }
  return { before, afterBag: +afterBag.toFixed(2), back, bagFill: TT.bagFill, bagCost: TT.bagCost, bag: +st.bag.toFixed(1) };
});
ok('THE MAILBAG REFILLS SLOWLY: a town\'s bag with one run in it posts one mail run; carried off, the bag is empty and the board posts no letters at all — the town writes the next run on its own clock and the board posts it again only after five to eight minutes (the letter shuttle closed: the mail is proof, not a loop)',
  mail.before === 1 && mail.afterBag < 1 && mail.back !== null && mail.back >= 300 && mail.back <= 480,
  JSON.stringify(mail));

/* ================= 10 · LOADED, THE WALK SKIRTS THE CAMP ================= */
const skirt = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'pass');
  const A = [cd.x - 800, cd.y + 800], B = [cd.x + 800, cd.y - 800];
  const minD = pts => { let m = 1e9; for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, U.segDist(cd.x, cd.y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return Math.round(m); };
  const plan = loaded => {
    __vit(); __clean(); if (loaded) State.addCargo(State.makeItem('textiles'));
    S.px = A[0]; S.py = A[1];
    const okay = Systems.moveTo(B[0], B[1]), m = S.moveTo;
    const pts = m ? (m.path ? [A, ...m.path] : [A, [m.x, m.y]]) : [];
    const out = { ok: okay, straight: !!m && !m.path, legs: pts.length - 1, closest: pts.length ? minD(pts) : null, len: Math.round(pts.slice(1).reduce((a, p, i) => a + U.dist(pts[i][0], pts[i][1], p[0], p[1]), 0)) };
    S.moveTo = null; __clean();
    return out;
  };
  return { claim: cd.r, loaded: plan(true), empty: plan(false) };
});
ok('LOADED, THE WALK SKIRTS THE CAMP: a click across Pass Camp\'s ground plans the walk round its claim while the Walker carries cargo (a strung route whose every leg stays outside the claim, longer than the line) and straight through its fire when the Walker carries nothing — the knives only chase cargo',
  skirt.loaded.ok && !skirt.loaded.straight && skirt.loaded.closest > skirt.claim && skirt.empty.ok && skirt.empty.straight && skirt.empty.closest < skirt.claim * 0.25 && skirt.loaded.len > skirt.empty.len,
  JSON.stringify(skirt));

/* ================= 11 · THE WIRE CLOSING A SHORTAGE COSTS NO STAR ================= */
const exempt = await ev(async () => {
  const el = S.stations.elm; el.stars = 2; el.likesTo = DATA.T.starThresholds[1]; el.critT = 0;
  const run = secs => { for (let t = 0; t < secs; t++) { for (const id of DATA.stationOrder) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 50; el.stock.meds = 5; Economy.update(1); } };
  __toasts.length = 0;
  run(260); await __wait(60);
  const fed = { stars: el.stars, dimmed: el.dimmed, critT: Math.round(el.critT), toast: __toasts.some(t => /Elm Farm<\/b> lost a star|Elm Farm lost a star/.test(t)) };
  /* the maker off the wire (still known): the same shortage, now nobody's closing it */
  S.stations.green.connected = false; State.refreshSources(true);
  run(230); const at230 = { stars: el.stars, critT: Math.round(el.critT) };
  run(15); await __wait(60);
  const cut = { stars: el.stars, dimmed: el.dimmed, toast: __toasts.find(t => /Elm Farm lost a star — people are leaving/.test(t)) || '', mail: S.mails.some(m => m.subj === 'Elm Farm shrinks') };
  S.stations.green.connected = true; State.refreshSources(true);
  for (const id of DATA.stationOrder) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 50;
  return { fed, at230, cut };
});
ok('THE WIRE CLOSING A SHORTAGE COSTS NO STAR: Elm Farm out of medicine with the Greenhouse (its maker) on the wire burns dim but keeps both stars through four and a half minutes of it; with the Greenhouse off the wire (still known) the same shortage costs a star at four minutes — "people are leaving", and the mail',
  exempt.fed.stars === 2 && exempt.fed.dimmed && exempt.fed.critT === 0 && !exempt.fed.toast && exempt.at230.stars === 2 && exempt.cut.stars === 1 && !!exempt.cut.toast && exempt.cut.mail,
  JSON.stringify(exempt));

/* ================= 12 · A CRISIS EMPTIES THE BEST-STOCKED SHELF ================= */
const crisis = await ev(async () => {
  __clean(); S.orders.active.length = 0;
  for (const id of ['results', 'stationOv', 'packOv']) document.getElementById(id).classList.add('hidden');
  const lit = () => DATA.stationOrder.filter(id => S.stations[id].connected);
  /* every shelf in the valley set apart, each town's best-stocked need its own: a crash reads as the town it hit */
  const best = {};
  const set = () => { for (const id of DATA.stationOrder) { DATA.stations[id].needs.forEach((g, i) => { S.stations[id].stock[g] = 40 + i * 11 + (id.length % 3); }); best[id] = DATA.stations[id].needs[DATA.stations[id].needs.length - 1]; } };
  const snap = () => JSON.stringify(Object.fromEntries(DATA.stationOrder.map(id => [id, S.stations[id].stock])));
  const calm = () => { S.event = null; S.wraiths.length = 0; S.surgeT = 0; S.stormT = 0; S.weather = { state: 'clear', t: 99999, intensity: 0 }; };
  /* the director's own dice, rolled again and again: an event every time its clock runs out (NPC.update's own step) */
  const roll = () => { calm(); S.flags.firstEvent = true; S.eventCd = 0; NPC.update(0.01); };
  WL.tp('haven');
  /* two towns burning: never a crisis */
  S.stations.mill.connected = false; S.stations.green.connected = false;
  set(); const was0 = JSON.parse(snap()); let rolls2 = 0;
  for (let i = 0; i < 150; i++) { roll(); rolls2++; }
  const two = { lit: lit().length, rolls: rolls2, broke: DATA.stationOrder.some(id => DATA.stations[id].needs.some(g => Math.abs(S.stations[id].stock[g] - was0[id][g]) > 0.01)) };
  /* four burning: rolled until the director picks a crisis */
  S.stations.mill.connected = true; S.stations.green.connected = true;
  set(); const s1 = snap(), was1 = JSON.parse(s1); let rolls4 = 0, hit = null;
  __toasts.length = 0;
  for (let i = 0; i < 400 && !hit; i++) {
    roll(); rolls4++;
    for (const id of DATA.stationOrder) for (const g of DATA.stations[id].needs) if (Math.abs(S.stations[id].stock[g] - was1[id][g]) > 0.01) hit = { id, g, v: +S.stations[id].stock[g].toFixed(2), was: was1[id][g] };   // the held clock's own drain is a hair — a crash is a stroke
  }
  await __wait(60);
  let changed = 0; const now = JSON.parse(snap());
  for (const id of DATA.stationOrder) for (const g of DATA.stations[id].needs) if (Math.abs(now[id][g] - was1[id][g]) > 0.01) changed++;
  const four = { lit: lit().length, rolls: rolls4, hit, best: hit && best[hit.id], changed, litHit: !!hit && S.stations[hit.id].connected, toast: hit ? (__toasts.find(t => t.startsWith(`Crisis at ${DATA.stations[hit.id].name} — their`)) || '') : '' };
  /* a town with nothing over thirty on any shelf is spared */
  set(); for (const g of DATA.stations.haven.needs) S.stations.haven.stock[g] = 25 + g.length % 4;
  const h0 = JSON.stringify(S.stations.haven.stock), spared = Systems.postCrisis('elm', 'haven') === false && JSON.stringify(S.stations.haven.stock) === h0;
  calm(); S.eventCd = 99999;
  for (const id of DATA.stationOrder) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 50;
  return { two, four, spared };
});
ok('A CRISIS EMPTIES THE BEST-STOCKED SHELF: the event director rolled a hundred and fifty times with two towns burning never breaks a shelf (crises wait for three lit towns); with four burning, rolled until it picks a crisis, it breaks one lit town\'s best-stocked need in one stroke — down to 4, every other shelf in the valley standing — and says so; a town with no shelf over thirty is spared',
  crisis.two.lit === 2 && !crisis.two.broke && crisis.four.lit === 4 && !!crisis.four.hit && crisis.four.litHit && crisis.four.hit.g === crisis.four.best && crisis.four.hit.v === 4 && crisis.four.hit.was >= 30 && crisis.four.changed === 1 && !!crisis.four.toast && crisis.spared,
  JSON.stringify(crisis));

/* ================= 13 · THE HONEST STALL ================= */
const stall = await ev(async () => {
  __vit(); __clean();
  /* a pocket of scree walled in by cliff south-west of Haven: the grid routes out of its cell, the feet cannot */
  const P = [3600, 10812], Tg = [3812, 11024];
  const walk = async () => {
    __vit(); S.px = P[0]; S.py = P[1]; S.moveTo = null; S.route = [];
    const planned = Systems.moveTo(Tg[0], Tg[1]), m = S.moveTo, path = m && m.path ? m.path.length : 0;
    const log = []; let t = 0, last = 0;
    document.getElementById('toasts').innerHTML = '';
    while (S.moveTo && t < 40) { Systems.update(0.05, __in()); t += 0.05; if (S.moveTo && (S.moveTo.repaths || 0) !== last) { last = S.moveTo.repaths; log.push([last, +t.toFixed(2)]); } }
    const said = [...document.getElementById('toasts').children].map(e => e.textContent);
    return { planned, path, repaths: m ? m.repaths || 0 : null, marked: m && m.block ? m.block.size : 0, log, t: +t.toFixed(2), said, moved: Math.round(U.dist(S.px, S.py, P[0], P[1])), open: !!S.moveTo };
  };
  const real = await walk();
  /* the grid held to its first plan: every re-plan finds a way the feet cannot take — the cap is what ends it */
  const P0 = World.pathTime; let replans = 0;
  World.pathTime = function (x1, y1, x2, y2, want, opts) { if (opts && opts.block) { replans++; return P0.call(this, x1, y1, x2, y2, want, { ...opts, block: null }); } return P0.apply(this, arguments); };
  let held; try { held = await walk(); } finally { World.pathTime = P0; }
  held.replans = replans;
  __vit(); WL.tp('haven');
  return { real, held };
});
ok('THE HONEST STALL: in a pocket of scree walled in by cliff the planner finds a way out and the feet cannot take it — they stop advancing, the ground ahead is marked impassable and the walk re-plans with the marks; when no way is left the walk ends with "The ground stops you here", the Walker standing where their feet are (no warp); and with a grid that keeps offering its first plan the feet re-plan exactly three times — then stop, honestly',
  stall.real.planned && stall.real.path > 1 && stall.real.repaths === 1 && stall.real.marked > 0 && !stall.real.open && stall.real.said.includes('The ground stops you here') && stall.real.moved < 30 && stall.real.t < 8
  && stall.held.planned && stall.held.log.map(x => x[0]).join() === '1,2,3' && stall.held.repaths === 4 && stall.held.replans === 3 && !stall.held.open && stall.held.said.includes('The ground stops you here') && stall.held.moved < 30,
  JSON.stringify(stall));

/* ================= 14 · THE WIRE, A SCENE ================= */
const cine0 = await ev(async () => {
  __vit(); __clean(); for (const o of [...S.orders.active]) S.orders.active.splice(S.orders.active.indexOf(o), 1);
  for (const id of DATA.stationOrder) for (const g of DATA.stations[id].needs) S.stations[id].stock[g] = 50;
  const mill = S.stations.mill; mill.connected = false; mill.litT = 0; mill.stars = 0; mill.likesTo = 0; mill.stock.textiles = 20; mill.stock.food = 20; mill.stock.meds = 20; mill.wireTold = false; S.wireLog.mill = 0;
  State.refreshSources(true);
  S.orders.prioIdx = 3; S.orders.prioAccepted = false;
  WL.tp('haven'); const p = DATA.priority[3]; Systems.acceptOrder(p, false);
  WL.tp('mill'); await __settle();
  return { title: p.title, rail: Systems.getInteractions().filter(i => i.key === 'E').map(i => i.label.replace(/<[^>]+>/g, '')), cov0: Math.round(S.cov * 100) };
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(100);
const cine = await ev(async () => {
  WL.skipHandover();   // the crates land; the ledger settles and the station ignites
  const lit0 = !!S.cine, samples = [], titles = new Set();
  WL.timeScale = 1;
  const t0 = performance.now(); let letterOn = false, letterOff = null, maxLit = 0;
  while (performance.now() - t0 < 30000) {
    const c = S.cine;
    if (document.body.classList.contains('cine')) letterOn = true;
    const tx = Render.crtText(); if (tx) titles.add(tx.big + ' | ' + tx.small);
    if (c) { samples.push([c.phase, +S.stations.mill.litT.toFixed(2)]); maxLit = Math.max(maxLit, S.stations.mill.litT); }
    else { letterOff = !document.body.classList.contains('cine'); break; }
    await __wait(80);
  }
  const ms = Math.round(performance.now() - t0);
  WL.timeScale = 1e-9;
  const phases = [...new Set(samples.map(s => s[0]))];
  const rising = samples.filter(s => s[0] === 1).map(s => s[1]);
  const title = [...titles].find(t => /^THE MILL — ON THE WIRE/.test(t)) || [...titles].join(' || ');
  /* and the wire runs: the Mill's shelves fed by the towns the scene named, and the Walker told so */
  const m0 = { ...S.stations.mill.stock }; __toasts.length = 0;
  for (let t = 0; t < 60; t++) Economy.update(1);
  const fed = ['textiles', 'food', 'meds'].map(g => +(S.stations.mill.stock[g] - m0[g]).toFixed(1));
  await __settle();
  for (const id of ['results']) document.getElementById(id).classList.add('hidden');
  return { lit0, phases, rising: [rising[0], rising[rising.length - 1]], maxLit, letterOn, letterOff, ms, title, connected: S.stations.mill.connected, cov: Math.round(S.cov * 100), fed, wireLog: Math.round(S.wireLog.mill || 0), toast: __toasts.find(t => /^The Mill is being fed by the wire now/.test(t)) || '' };
});
ok('THE WIRE, A SCENE: the ★ core walked into the Mill and handed over by a real E puts the Mill on the wire as a scene — the letterbox, the light rising 0 → 1 over its seconds in the ring, the title "THE MILL — ON THE WIRE" naming who will feed it (Haven and Elm Farm and Greenhouse now send what the Mill lacks) with the valley\'s coverage — released on its own; then the wire runs: the Mill\'s textiles, food and medicine climb from the towns it named, and the Walker is told so',
  cine0.rail[0] === 'DELIVER — 2 crates to The Mill' && cine.lit0 && cine.phases.join() === '0,1,2,3' && cine.rising[0] < 0.3 && cine.maxLit === 1 && cine.letterOn && cine.letterOff && cine.connected
  && cine.title === `THE MILL — ON THE WIRE | HAVEN AND ELM FARM AND GREENHOUSE NOW SEND WHAT THE MILL LACKS · COVERAGE ${cine.cov}%` && cine.fed.every(v => v > 0) && /Haven, Elm Farm, Greenhouse send what they can on their own/.test(cine.toast),
  JSON.stringify({ cine0, cine }));

await T.finish('the loop\'s rules');
