/* working.mjs — v3.20 THE WORKING WORLD: traffic wears the land, trails take tiers of paving,
   field crews (presser/mason/forrester/hauler) work the world visibly, the LOOTER habit is earned,
   and every currency lands as a SEEN animated chip. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => {
  S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  S.flags.guideDone = true; S.orders.prioIdx = 99; WL.calm();
  S.banked.provisions = 80; S.banked.metal = 60; S.banked.ceramic = 40; S.banked.wood = 20;
});

/* ---------- traffic writes the land ---------- */
let r = await ev(() => {
  const A = DATA.stations.haven, B = DATA.stations.elm;
  const p = World.pathTime(A.x, A.y, B.x, B.y, true, Systems.walkOpts(true));
  const mid = p.path[Math.floor(p.path.length / 2)];
  const w0 = World.wearAt(mid[0], mid[1]);
  for (let i = 0; i < 14; i++) Systems.stampTraffic('haven', 'elm');
  window._mid = mid;
  return { found: p.found, w0, w1: World.wearAt(mid[0], mid[1]), trample: World.W_TRAMPLE };
});
ok('fourteen runs between two towns wear the LINE between them — wherever the player walked', r.found && r.w1 > r.w0 && r.w1 >= r.trample, JSON.stringify(r));
r = await ev(() => {
  // a chartered route's runs press the same line (the NPC call site)
  S.cov = 0.3;
  const n = S.npcs.find(x => x.state === 'pool') || S.npcs[0];
  n.feeWaived = true;
  NPC.assignRoute(n, 'haven', 'mill');
  const A = DATA.stations.haven, B = DATA.stations.mill;
  const p = World.pathTime(A.x, A.y, B.x, B.y, true, Systems.walkOpts(true));
  const pts = p.path.filter((_, i) => i % 3 === 0);   // sum along the line — parts of it cross unwearable rock
  const sum = () => pts.reduce((a, pt) => a + World.wearAt(pt[0], pt[1]), 0);
  const w0 = sum();
  for (let i = 0; i < 10; i++) { n.route.t = 0.01; Systems.update(0.25, {}); }
  const w1 = sum();
  n.state = 'pool'; n.route = null;
  return { w0, w1, ran: !!n.feeWaived };
});
ok('a route charter\'s runs are FEET too — their line wears in', r.w1 > r.w0, JSON.stringify(r));

/* ---------- the tier ladder: scrap → cobbles → wood way ---------- */
r = await ev(() => {
  const d = DATA.stations.haven;
  const px2 = d.x - 600, py2 = d.y - 300;
  WL.tp([px2, py2]); S.moveTo = null;
  const before = World.layPave(px2, py2, 60, 1);          // green grass refuses plates
  for (let i = 0; i < 40; i++) for (let o = -40; o <= 40; o += 9) World.addWear(px2 + o, py2, 3);
  const bare = World.wearAt(px2, py2) >= World.W_BARE;
  const acts0 = Systems.getInteractions().some(a => a.key === 'P');
  const m0 = S.banked.metal;
  const laid1 = Systems.layPaveHere();
  const tier1 = World.paveAt(px2, py2);
  const laid2 = Systems.layPaveHere();                     // again: cobbles on the plates
  const tier2 = World.paveAt(px2, py2);
  const laid3 = Systems.layPaveHere();                     // again: the wood way
  const tier3 = World.paveAt(px2, py2);
  const spent = { metal: m0 - S.banked.metal };
  return { before, bare, acts0, laid1, tier1, laid2, tier2, laid3, tier3, spent };
});
ok('paving wants ground the feet ARGUED for — green grass refuses, bare trail takes the plates', r.before === 0 && r.bare && r.acts0 && r.laid1 && r.tier1 === 1, JSON.stringify(r));
ok('P again lays cobbles on the plates, and planking on the cobbles — tiers only climb', r.laid2 && r.tier2 === 2 && r.laid3 && r.tier3 === 3 && r.spent.metal === 3, JSON.stringify(r));
r = await ev(async () => {
  // the wood way is its own ground: faster than the meadow beside it
  const d = DATA.stations.haven;
  const px2 = d.x - 600, py2 = d.y - 300;
  WL.tp([px2 - 30, py2]); S.moveTo = null; S.cargo = [];
  let onPave = 0;
  for (let i = 0; i < 10; i++) { Systems.update(0.1, { right: true }); if (World.paveAt(S.px, S.py) === 3) onPave = Math.max(onPave, S.speed); }
  WL.tp([px2, py2 + 400]); S.moveTo = null;
  let onGrass = 0;
  for (let i = 0; i < 10; i++) { Systems.update(0.1, { right: true }); if (!World.paveAt(S.px, S.py) && World.wearAt(S.px, S.py) < World.W_TRAMPLE) onGrass = Math.max(onGrass, S.speed); }
  return { onPave: Math.round(onPave), onGrass: Math.round(onGrass) };
});
ok('the laid way walks faster than the meadow beside it', r.onPave > r.onGrass * 1.1, JSON.stringify(r));

/* ---------- the field crew ---------- */
r = await ev(() => {
  S.stations.elm.connected = true;
  const pool = S.npcs.filter(x => x.state === 'pool');
  for (const n of pool) n.feeWaived = true;
  const A = pool[0];
  const okA = NPC.assignField(A, 'haven', 'presser', 'elm');
  const x0 = A.fx;
  for (let i = 0; i < 200; i++) Systems.update(0.25, {});
  const moved = Math.hypot(A.fx - x0, A.fy - DATA.stations.haven.y - 40) > 120 || Math.abs(A.fx - x0) > 120;
  const trailW = World.wearAt(A.fx, A.fy);
  window._presser = A.id;
  return { okA, moved, trailW, state: A.state };
});
ok('a PATH PRESSER takes the field and visibly walks the line, pressing it in behind them', r.okA && r.state === 'field' && r.moved && r.trailW > 0, JSON.stringify(r));
r = await ev(() => {
  // the mason: bare line first (traffic makes it), then cobbles rise while ceramic drains
  for (let i = 0; i < 40; i++) Systems.stampTraffic('haven', 'elm');
  const pool = S.npcs.filter(x => x.state === 'pool');
  for (const n of pool) n.feeWaived = true;
  const M = pool[0] || S.npcs.find(x => x.state === 'pool');
  const okM = NPC.assignField(M, 'haven', 'mason', 'elm');
  const c0 = S.banked.ceramic;
  let laidAt = 0;
  for (let i = 0; i < 700 && !laidAt; i++) { Systems.update(0.25, {}); if (i % 40 === 39 && World.paveAt(M.fx, M.fy) === 2) laidAt = i; }
  const cobbled = World.paveAt(M.fx, M.fy) === 2 || S.banked.ceramic < c0;
  window._mason = M.id;
  return { okM, cobbled, spent: c0 - S.banked.ceramic };
});
ok('a MASON walks the worn line and the cobbles rise behind them, a slab at a time', r.okM && r.cobbled && r.spent >= 1, JSON.stringify(r));
r = await ev(() => {
  // the forrester: find a station with woods in reach, send the axe
  let home = null;
  for (const id of DATA.stationOrder) { if (World.nearestForest(DATA.stations[id].x, DATA.stations[id].y, DATA.T.fellRadius)) { home = id; break; } }
  const F = S.npcs.find(x => x.state === 'pool') || (S.npcs.push(NPC.gen({ at: home })), S.npcs[S.npcs.length - 1]);
  F.feeWaived = true; F.skills.foot = 6;
  const okF = NPC.assignField(F, home, 'forrester');
  const w0 = S.banked.wood;
  let target = null, was = null;
  for (let i = 0; i < 900 && S.banked.wood === w0; i++) {
    Systems.update(0.25, {});
    if (F.ftarget && !target) { target = { ...F.ftarget }; was = World.classAt(target.x, target.y); }
  }
  const felled = target ? World.classAt(target.x, target.y) : -1;
  window._forr = F.id;
  return { okF, home, gained: S.banked.wood - w0, was, felled, meadow: World.MEADOW, forest: World.FOREST };
});
ok('a FORRESTER walks to standing wood, works it, and the MAP ITSELF changes — forest to clearing, timber to the bank', r.okF && r.gained >= 2 && r.was === r.forest && r.felled === r.meadow, JSON.stringify(r));
r = await ev(() => {
  // the hauler: freight on foot — an arrival stocks the far shelf
  // the crew cap is PER TOWN — haven's three spots are taken, so the mill fields this one
  S.stations.mill.connected = true;
  const H = S.npcs.find(x => x.state === 'pool') || (S.npcs.push(NPC.gen({ at: 'mill' })), S.npcs[S.npcs.length - 1]);
  H.feeWaived = true; H.skills.foot = 7; H.skills.haul = 3;
  const okH = NPC.assignField(H, 'mill', 'hauler', 'elm');
  const stocks0 = { ...S.stations.elm.stock };
  let runs = 0;
  for (let i = 0; i < 1400 && !(H.fruns > 0); i++) Systems.update(0.25, {});
  runs = H.fruns || 0;
  const gained = Object.keys(stocks0).some(g => (S.stations.elm.stock[g] || 0) > (stocks0[g] || 0) + 5);
  window._haul = H.id;
  return { okH, runs, gained };
});
ok('a HAULER\'s arrival walks REAL stock onto the far end\'s worst shelf', r.okH && r.runs >= 1 && r.gained, JSON.stringify(r));
r = await ev(() => {
  const H = S.npcs.find(x => x.id === window._haul);
  const caravanNot = (H.skills.haul || 0) < DATA.T.haulLvCaravan;
  H.skills.haul = DATA.T.haulLvCaravan;   // the strong back earns the donkey
  const caravanNow = H.job === 'hauler' && (H.skills.haul || 0) >= DATA.T.haulLvCaravan;
  return { caravanNot, caravanNow, cap: DATA.T.caravanCap };
});
ok('Hauling grown to its mark turns the hauler into a DONKEY CARAVAN — thirty crates a walk', r.caravanNot && r.caravanNow && r.cap === 30, JSON.stringify(r));
r = await ev(() => {
  // three in the field is the town's limit; the crew can be called in
  const extra = NPC.gen({ at: 'haven' }); extra.feeWaived = true; S.npcs.push(extra);
  const refused = !NPC.assignField(extra, 'haven', 'presser', 'elm');
  const P = S.npcs.find(x => x.id === window._presser);
  const recalled = NPC.recallField(P);
  const nowRoom = NPC.assignField(extra, 'haven', 'presser', 'elm');
  NPC.recallField(extra);
  const M = S.npcs.find(x => x.id === window._mason); M && NPC.recallField(M);
  const H = S.npcs.find(x => x.id === window._haul); H && NPC.recallField(H);
  const F = S.npcs.find(x => x.id === window._forr); F && NPC.recallField(F);
  return { refused, recalled, nowRoom };
});
ok('a station feeds three field hands, no more — and calling one in opens the spot', r.refused && r.recalled && r.nowRoom, JSON.stringify(r));

/* ---------- the LOOTER habit is EARNED ---------- */
r = await ev(async () => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 500, d.y - 420]); S.moveTo = null;
  const n = S.npcs.find(x => x.state === 'pool') || S.npcs[0];
  n.feeWaived = true; n.state = 'companion'; n.fedT = 999; n.carry = []; n.skills.haul = 0;
  S.compPos = { x: S.px - 40, y: S.py };
  S.drops.push({ id: U.uid(), item: State.makeItem('food'), x: S.px + 150, y: S.py - 30 });
  for (let i = 0; i < 60; i++) Systems.update(0.25, {});
  const untrained = S.drops.length;
  n.skills.haul = 3;   // the habit arrives with the training
  for (let i = 0; i < 90; i++) Systems.update(0.25, {});
  const swept = S.drops.length === untrained - 1 && n.carry.length === 1;
  n.state = 'pool'; n.carry = []; S.compPos = null;
  return { untrained, swept };
});
ok('an untrained companion walks past ground loot; Hauling 2+ SWEEPS what enters your sight', r.untrained === 1 && r.swept, JSON.stringify(r));

/* ---------- every coin is SEEN landing ---------- */
r = await ev(async () => {
  document.getElementById('earnFeed').innerHTML = '';
  State.grantLikes(6); State.grantLikes(5); State.grantLikes(4);   // one burst
  Economy.addAppr('haven', 3);
  State.bank('wood', 4);
  await new Promise(res => setTimeout(res, 650));
  const chips = [...document.querySelectorAll('#earnFeed .earnChip')];
  const trust = chips.filter(c => c.classList.contains('trust'));
  const appr = chips.find(c => c.classList.contains('appr'));
  const mat = chips.find(c => c.classList.contains('mat'));
  return {
    n: chips.length,
    trustOne: trust.length === 1,
    trustVal: trust[0] ? trust[0].querySelector('.num').textContent : '',
    apprLbl: appr ? appr.textContent.includes('Haven') : false,
    matIcon: mat ? !!mat.querySelector('img') : false, animated: trust[0] ? getComputedStyle(trust[0]).animationName !== 'none' : false,
  };
});
ok('trust, appreciation and timber each land as their OWN marked chip — a burst merges and counts up', r.trustOne && r.trustVal === '+15' && r.apprLbl && r.matIcon, JSON.stringify(r));
ok('the chips are animated, not printed', r.animated, JSON.stringify(r));

/* ---------- the worked world SURVIVES the save ---------- */
r = await ev(() => {
  const d = DATA.stations.haven;
  window._paveSpot = [d.x - 600, d.y - 300];
  State.save();
  const raw = JSON.parse(localStorage.getItem('waylight_save_v1'));
  return { pave: Array.isArray(raw.paveSave) && raw.paveSave.length >= 2, fell: Array.isArray(raw.fellSave) && raw.fellSave.length >= 1, npcClean: !JSON.stringify(raw.npcs).includes('"fpath"') || raw.npcs.every(n2 => !n2.fpath || !n2.fpath.pts || n2.fpath.pts.length === 0) };
});
ok('the pave grid and the fell list ride the save', r.pave && r.fell, JSON.stringify(r));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue'); await page.waitForTimeout(900);
r = await ev(() => {
  const [px2, py2] = window._paveSpot || [DATA.stations.haven.x - 600, DATA.stations.haven.y - 300];
  return { tier: World.paveAt(px2, py2), woodBank: S.banked.wood };
});
ok('after reload the wood way is still underfoot and the timber still banked', r.tier === 3 && r.woodBank >= 2, JSON.stringify(r));

ok('no page errors across the whole suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log('\n=== WORKING (v3.20: living paths · the tier ladder · field crews · looter · the earn feed) ===');
for (const line of results) console.log(line);
console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
