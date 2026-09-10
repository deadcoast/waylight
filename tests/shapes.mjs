/* shapes.mjs — v3.18 THE SHAPES OF WORK: circuits (one contract, many doors — every crate loads at
   accept), convoys (the cargo is a person: their pace, your lantern, scrappers go for THEIR crates,
   the grey roots their feet), salvage (a wreck in the deep grey, ×1.6 grey work). State-level,
   driven through Systems.update and the real board/accept/deliver plumbing. */
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
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  for (const id of DATA.stationOrder) S.stations[id].met = true;
  S.flags.guideDone = true; S.orders.prioIdx = 99;   // past the taught arc — the shapes are mid-game work
  const d = DATA.stations.haven; WL.tp([d.x - 120, d.y + 40]); S.moveTo = null;
});

/* 1. before the Greenhouse, the boards hold no shapes — however deep the standing */
let r = await ev(() => {
  S.stations.haven.stars = 3;
  S.stations.elm.connected = true; S.stations.mill.connected = true;
  S.stations.elm.stock.tools = 20; S.stations.mill.stock.textiles = 20; S.stations.quarry.stock.textiles = 20;
  const board = Economy.ordersFor('haven');
  return { shapes: !!S.flags.unlocks.shapes, n: board.filter(o => o.circuit || o.convoy || o.salvage).length };
});
ok('before the Greenhouse joins, no circuit, convoy or salvage posts anywhere', !r.shapes && r.n === 0, JSON.stringify(r));

/* 2. the Greenhouse opens them — announced, and mailed */
r = await ev(() => {
  S.stations.green.connected = true; S.stations.green.litT = 1;
  for (let i = 0; i < 4; i++) Systems.update(0.6, {});
  return { shapes: !!S.flags.unlocks.shapes, mail: S.mails.some(m => /shapes of work/i.test(m.subj)) };
});
ok('the Greenhouse connect unlocks THE SHAPES OF WORK and the mail explains them', r.shapes && r.mail, JSON.stringify(r));

/* 3. a circuit posts: one contract, many doors, nearest-chained */
r = await ev(() => {
  const cc = Economy.ordersFor('haven').find(o => o.circuit);
  window._cc = cc;
  return cc ? { legs: cc.legs.length, dests: cc.legs.map(l => l.to), items: cc.legs.map(l => l.item), distinct: new Set(cc.legs.map(l => l.to)).size } : null;
});
ok('a ★★ station with three known doors posts a CIRCUIT of 2-3 distinct legs', r && r.legs >= 2 && r.legs <= 3 && r.distinct === r.legs, JSON.stringify(r));

/* 4. every door's crates load at accept — the pack is the puzzle */
r = await ev(() => {
  const cc = window._cc;
  const before = S.cargo.length;
  const o = Systems.acceptOrder(cc, false);
  window._co = o;
  const want = cc.legs.reduce((a, l) => a + l.n, 0);
  return { got: S.cargo.length - before, want, kgTotal: o.kgTotal, to0: o.to === cc.legs[0].to, leg: o.leg };
});
ok('signing the circuit loads EVERY leg\'s crates at once', r.got === r.want && r.kgTotal > 0 && r.to0 && r.leg === 0, JSON.stringify(r));

/* 5. only the current door will take the hand-over */
r = await ev(() => {
  const o = window._co;
  return { at0: Systems.deliverablesAt(o.legs[0].to).length, at1: Systems.deliverablesAt(o.legs[1].to).length };
});
ok('doors open in order — the second door refuses what the first is owed', r.at0 === 1 && r.at1 === 0, JSON.stringify(r));

/* 6. a middle door: crates land, stock fills, NO slip — the ledger waits */
r = await ev(() => {
  const o = window._co;
  const d0 = o.legs[0].to;
  const stockBefore = S.stations[d0].stock[o.legs[0].item];
  WL.tp([DATA.stations[d0].x, DATA.stations[d0].y + 60]); S.moveTo = null;
  const res = Systems.handleDelivery(d0);
  return {
    slips: res.results.length, leg: o.leg, to: o.to === o.legs[1].to,
    gone: !o.legs[0].items.some(id => S.cargo.some(c => c.id === id)),
    fed: S.stations[d0].stock[o.legs[0].item] > stockBefore,
  };
});
ok('a middle door advances the circuit — stock fills, crates leave, no slip yet', r.slips === 0 && r.leg === 1 && r.to && r.gone && r.fed, JSON.stringify(r));

/* 7. the last door settles the whole contract at ×1.35 */
r = await ev(() => {
  const o = window._co;
  let final = null;
  while (o.leg <= o.legs.length - 1) {
    const d = o.legs[o.leg].to;
    WL.tp([DATA.stations[d].x, DATA.stations[d].y + 60]); S.moveTo = null;
    const res = Systems.handleDelivery(d);
    if (res.results.length) { final = res.results[0]; break; }
  }
  return final ? { circuit: final.circuit && final.circuit.legs, paymul: final.paymul, likes: final.likes, kg: final.kg, kgTotal: window._co.kgTotal, grade: final.grade } : null;
});
ok('the last door grades the whole walk and pays ×1.35 — one contract, every door counted',
  r && r.circuit >= 2 && r.paymul === 1.35 && r.likes > 0 && Math.abs(r.kg - r.kgTotal) < 0.01, JSON.stringify(r));

/* 8. giving a circuit up loses every remaining door's crates toward their own doors */
r = await ev(() => {
  S.cargo = [];
  S.stations.elm.stock.tools = 20; S.stations.mill.stock.textiles = 20; S.stations.quarry.stock.textiles = 20;   // the doors want again
  const cc = Economy.ordersFor('haven').find(o => o.circuit);
  if (!cc) return null;
  const o = Systems.acceptOrder(cc, false);
  Systems.abandonOrder(o.idNum);
  const wrong = [];
  for (const l of cc.legs) for (const it of S.cargo) if (l.items && l.items.includes(it.id) && it.lostTo !== l.to) wrong.push(it.name);
  const lost = S.cargo.filter(c => c.lostTo).length;
  const want = cc.legs.reduce((a, l) => a + l.n, 0);
  S.cargo = [];
  return { lost, want, wrong: wrong.length };
});
ok('an abandoned circuit turns every remaining crate into lost cargo bound for its OWN door', r && r.lost === r.want && r.wrong === 0, JSON.stringify(r));

/* 9. a convoy posts on a route the pathfinder found, and the walker falls in */
r = await ev(() => {
  const cv = Economy.ordersFor('haven').find(o => o.convoy);
  if (!cv) return null;
  const o = Systems.acceptOrder(cv, false);
  window._cvo = o;
  return { to: cv.to, connected: S.stations[cv.to].connected, escort: !!S.convoy, crates: S.convoy && S.convoy.crates, items: o.items.length, near: S.convoy && U.dist(S.convoy.x, S.convoy.y, DATA.stations.haven.x, DATA.stations.haven.y) < 120 };
});
ok('a CONVOY posts to a connected door and the junior walker falls in — three crates, none on your pack',
  r && r.connected && r.escort && r.crates === 3 && r.items === 0 && r.near, JSON.stringify(r));

/* 10. their pace, your lantern: they follow — and past the lag line they CALL and trudge at
   half pace (v3.31 FAIRNESS: the freeze is gone with the warps — going back is still faster) */
r = await ev(() => {
  const c = S.convoy;
  WL.tp([c.x + 150, c.y]); S.moveTo = null;
  const d0 = U.dist(c.x, c.y, S.px, S.py);
  for (let i = 0; i < 20; i++) Systems.update(0.1, {});
  const d1 = U.dist(c.x, c.y, S.px, S.py);
  WL.tp([c.x + 480, c.y]); S.moveTo = null;
  for (let i = 0; i < 10; i++) Systems.update(0.1, {});
  const cx0 = c.x;
  for (let i = 0; i < 10; i++) Systems.update(0.1, {});
  return { d0: Math.round(d0), d1: Math.round(d1), waiting: c.waiting, crept: Math.round(Math.abs(c.x - cx0)) };
});
ok('the escort closes at full stride in range; past the lag line they CALL and trudge at HALF pace — never frozen, never warped',
  r.d1 < r.d0 - 40 && r.waiting && r.crept >= 30 && r.crept <= 90, JSON.stringify(r));

/* 11. scrappers go for THEIR crates — the knock drops a gold crate */
r = await ev(() => {
  const c = S.convoy;
  const camp = DATA.camps[0];
  c.x = camp.x + 40; c.y = camp.y; c.frozen = false; c.waiting = false; c.stag = 0;
  WL.tp([camp.x + 190, camp.y]); S.moveTo = null;   // you, outside their claws; the junior inside
  const cs = S.camps[camp.id]; cs.pacified = false;
  if (!cs.runners.length) Systems.update(0.05, {});
  const rr = cs.runners[0];
  rr.x = c.x + 20; rr.y = c.y; rr.cd = 0; rr.carry = null;
  const before = c.crates;
  Systems.update(0.06, {});
  const drop = S.drops.find(d => d.item.convoy);
  window._cvdrop = drop && drop.id;
  for (const r2 of cs.runners) r2.cd = 99;   // hold the claws: the next check tests the hand-back, not a race for the drop
  return { crates: c.crates, before, drop: !!drop, gold: drop && !!drop.item.convoy, staggered: c.stag > 0 };
});
ok('a scrapper reaches the escort: a crate is knocked loose as GOLD ground cargo', r.before === 3 && r.crates === 2 && r.drop && r.gold && r.staggered, JSON.stringify(r));

/* 12. recover it, hand it back */
r = await ev(() => {
  const c = S.convoy;
  const drop = S.drops.find(d => d.id === window._cvdrop);
  if (drop) { State.addCargo(drop.item); S.drops.splice(S.drops.indexOf(drop), 1); }   // picked up off the ground
  WL.tp([c.x + 20, c.y]); S.moveTo = null;
  c.stag = 0;
  const act = Systems.getInteractions().find(i => /Hand the crate back/.test(i.label));
  if (act) act.fn();
  return { prompt: !!act, crates: c.crates, held: S.cargo.some(cc => cc.convoy) };
});
ok('recovered crate hands back at their side — three on their back again', r.prompt && r.crates === 3 && !r.held, JSON.stringify(r));

/* 13. the grey roots their feet; your lantern breaks it */
r = await ev(() => {
  const c = S.convoy;
  // stand them somewhere the mist actually holds
  let spot = null;
  for (let R = 400; R < 3000 && !spot; R += 100) for (let a = 0; a < 12; a++) {
    const x = c.x + Math.cos(a) * R, y = c.y + Math.sin(a) * R;
    if (World.mistAt(x, y) > 0.4 && !World.terrainAt(x, y).blocked && !World.terrainAt(x, y).water) { spot = [x, y]; break; }
  }
  if (!spot) return null;
  c.x = spot[0]; c.y = spot[1]; c.frozen = false; c.waiting = false; c.stag = 0;
  WL.tp([spot[0] + 150, spot[1]]); S.moveTo = null;
  S.wraiths.push({ id: U.uid(), x: spot[0] + 80, y: spot[1], alert: 0, state: 'drift', cd: 0, ph: 0 });
  Systems.update(0.05, {});
  const {frozen} = c;
  const cx0 = c.x;
  for (let i = 0; i < 8; i++) Systems.update(0.1, {});
  const held = Math.abs(c.x - cx0) < 2;
  WL.tp([c.x + 40, c.y]); S.moveTo = null;
  Systems.update(0.05, {});
  const after = c.frozen;
  S.wraiths = [];
  return { frozen, held, after };
});
ok('a wraith near the escort in mist FREEZES them; standing beside them breaks it', r && r.frozen && r.held && !r.after, JSON.stringify(r));

/* 14. arrive TOGETHER: pay, appreciation, and a hireable walker joins the town */
r = await ev(() => {
  const o = window._cvo, c = S.convoy;
  const D = DATA.stations[o.to];
  const apprBefore = S.stations[o.from].appr || 0;
  const likesBefore = S.likes;
  const npcId = c.n.id;
  c.x = D.x + 60; c.y = D.y + 60; c.frozen = false; c.waiting = false; c.stag = 0;
  WL.tp([D.x + 80, D.y + 80]); S.moveTo = null;
  Systems.update(0.05, {});
  const joined = S.npcs.find(n => n.id === npcId);
  return {
    done: !S.orders.active.some(x => x.idNum === o.idNum), convoy: !!S.convoy,
    likes: S.likes - likesBefore, appr: (S.stations[o.from].appr || 0) - apprBefore,
    joined: !!joined && joined.state === 'pool' && joined.at === o.to,
    slip: !document.getElementById('results').classList.contains('hidden') && /CONVOY/.test(document.getElementById('resultRoute').textContent),
  };
});
ok('arriving together completes the convoy — luxury pay, +10 appreciation, and the walker joins the town\'s fire',
  r.done && !r.convoy && r.likes > 0 && r.appr === 10 && r.joined && r.slip, JSON.stringify(r));
await ev(() => { const el = document.getElementById('results'); el.classList.add('hidden'); });

/* 15. salvage posts at a grey-adjacent town, naming its worst shortage; the wreck is real */
r = await ev(() => {
  S.stations.foundry.stock.food = 12;
  const sv = Economy.ordersFor('foundry').find(o => o.salvage);
  if (!sv) return null;
  let worst = null, wv = 101;
  for (const g of DATA.stations.foundry.needs) { const v = S.stations.foundry.stock[g]; if (v < wv) { wv = v; worst = g; } }
  const o = Systems.acceptOrder(sv, false);
  window._svo = o;
  const F = DATA.stations.foundry;
  const d = U.dist(o.site.x, o.site.y, F.x, F.y);
  return { named: sv.item === worst, mist: World.mistBase(o.site.x, o.site.y), d: Math.round(d), par: Math.round(o.par) };
});
ok('SALVAGE names the town\'s worst shortage and the wreck lies 900-1400u out in the deep grey',
  r && r.named && r.mist > 0.5 && r.d >= 900 && r.d <= 1450 && r.par > 60, JSON.stringify(r));

/* 16. the wreck loads 2-3 battered gold crates — heavy, and honest about it */
r = await ev(() => {
  const o = window._svo;
  WL.tp([o.site.x + 20, o.site.y]); S.moveTo = null;
  const act = Systems.getInteractions().find(i => /Search the wreck/.test(i.label));
  if (act) act.fn();
  const its = o.items.map(id => S.cargo.find(c => c.id === id)).filter(Boolean);
  return {
    prompt: !!act, looted: o.looted, n: its.length,
    kgOk: its.every(c => c.kg >= 11 && c.kg <= 17),
    condOk: its.every(c => c.cond >= 55 && c.cond <= 80),
    named: its.every(c => /^Salvaged /.test(c.name)),
    gold: its.every(c => c.orderId === o.idNum),
  };
});
ok('the wreck gives 2-3 salvaged crates — 11-17 kg, 55-80% condition, marked gold for the run',
  r.prompt && r.looted && r.n >= 2 && r.n <= 3 && r.kgOk && r.condOk && r.named && r.gold, JSON.stringify(r));

/* 17. grey work pays ×1.6, judged against what the wreck gave — and the town eats */
r = await ev(() => {
  const o = window._svo;
  const F = DATA.stations.foundry;
  const stockBefore = S.stations.foundry.stock[o.item];
  WL.tp([F.x, F.y + 60]); S.moveTo = null;
  const res = Systems.handleDelivery('foundry');
  const s = res.results.find(x => x.salvage);
  return s ? { paymul: s.paymul, likes: s.likes, ptsC: s.ptsC, fed: S.stations.foundry.stock[o.item] > stockBefore, grade: s.grade } : null;
});
ok('the salvage slip pays ×1.6 and grades condition against the wreck, not the factory',
  r && r.paymul === 1.6 && r.likes > 0 && r.ptsC >= 3 && r.fed, JSON.stringify(r));

/* 18. the shapes survive a real save and reload */
await ev(() => {
  S.cargo = [];
  document.getElementById('results') && document.getElementById('results').classList.add('hidden');
  S.stations.elm.stock.tools = 20; S.stations.mill.stock.textiles = 20;
  const cc = Economy.ordersFor('haven').find(o => o.circuit);
  const o = Systems.acceptOrder(cc, false);
  // walk the first door so the saved circuit is mid-contract
  const d0 = o.legs[0].to;
  WL.tp([DATA.stations[d0].x, DATA.stations[d0].y + 60]); S.moveTo = null;
  Systems.handleDelivery(d0);
  const cv = Economy.ordersFor('haven').find(x => x.convoy);
  if (cv) Systems.acceptOrder(cv, false);
  if (S.convoy) S.convoy.crates = 2;
  window._saveShape = { leg: o.leg, ccId: o.idNum, cvCrates: S.convoy && S.convoy.crates };
  State.save();
  localStorage.setItem('_shapeProbe', JSON.stringify(window._saveShape));
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue');
await page.waitForTimeout(900);
r = await ev(() => {
  const probe = JSON.parse(localStorage.getItem('_shapeProbe'));
  for (let i = 0; i < 8 && S.cine; i++) WL.skipCine && WL.skipCine();
  const o = S.orders.active.find(x => x.idNum === probe.ccId);
  return {
    circuit: !!o && o.circuit && o.leg === probe.leg && o.legs.length >= 2,
    itemsHeld: !!o && o.items.every(id => S.cargo.some(c => c.id === id)),
    convoy: !!S.convoy && S.convoy.crates === probe.cvCrates && !!S.convoy.n && !S.convoy.frozen,
  };
});
ok('a mid-contract circuit and a mid-road convoy survive save → reload → continue', r.circuit && r.itemsHeld && r.convoy, JSON.stringify(r));

ok('no page errors across the whole suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log('\n=== SHAPES (v3.18: circuits · convoys · salvage) ===');
for (const line of results) console.log(line);
console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
