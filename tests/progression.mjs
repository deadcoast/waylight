/* progression.mjs — v3.17: reset semantics, attainable prices, the post horse, the living valley,
   companions with hands, wants shown early, the send-off. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
const boot = async () => {
  await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
};
await boot();
await page.evaluate(() => localStorage.clear());

/* 1. the Reset confirm: present, explicit, and NOT the New Waylighter button */
let r = await page.evaluate(() => {
  const btn = document.getElementById('btnReset');
  const ov = document.getElementById('resetOv');
  btn.click();
  const open = !ov.classList.contains('hidden');
  const txt = ov.textContent;
  document.getElementById('resetNo').click();
  const closed = ov.classList.contains('hidden');
  return { has: !!btn, open, closed, explains: /not.*New Waylighter/i.test(txt) && /erases/i.test(txt) && /no undo/i.test(txt) };
});
ok('the title menu has Reset the Valley, and its confirm says what it burns and that it is NOT New Waylighter', r.has && r.open && r.closed && r.explains, JSON.stringify(r));

/* start a real game to build a save worth keeping */
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => {
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
});

/* 2. price rails: the first rungs are attainable */
r = await page.evaluate(() => ({
  kit: DATA.fabItems.find(f => f.id === 'kit'),
  gen: DATA.structures.generator.cost.metal,
  bridge: DATA.structures.bridge.cost.metal,
  road: DATA.roads[0].cost,
  exo1: CHAR.FAB_GEAR.find(g => g.id === 'pack_exo1').cost,
  fee: (() => { const n = NPC.gen({}); const sum = Object.values(n.skills).reduce((a, v) => a + v, 0); return { m: n.fee.metal, sum }; })(),
}));
ok('a build kit costs a walk, not a week', r.kit && r.kit.cost.metal <= 18 && r.kit.cost.ceramic <= 10, JSON.stringify(r.kit && r.kit.cost));
ok('generator ≤30 · bridge ≤50 · first road segment ≤50 metal — structures are decisions again', r.gen <= 30 && r.bridge <= 50 && r.road.metal <= 50, `gen ${r.gen}, bridge ${r.bridge}, road ${r.road.metal}`);
ok('the exo frame is a goal, not a fantasy (≤80 metal), and hire fees halved', r.exo1.metal <= 80 && r.fee.m <= 16 + r.fee.sum * 3, JSON.stringify({ exo: r.exo1.metal, fee: r.fee.m }));

/* 3. p4 hands you the horse — the movement mechanic arrives IN the teaching line */
r = await page.evaluate(() => {
  S.orders.prioIdx = 3; S.orders.prioAccepted = false; S.orders.active = []; S.cargo = [];
  WL.tp('haven');
  const p = WL.acceptPrio();
  return { granted: !!p && !!S.horse && S.horse.loaner === true && S.horse.on === true, unlocked: !!S.flags.unlocks.horse, brief: /POST HORSE/i.test(p ? p.brief : '') };
});
ok('accepting Light for the Mill grants the loaner horse, mounted, and the brief says so', r.granted && r.unlocked && r.brief, JSON.stringify(r));

/* 4-6. riding: faster, tireless, steady — and honest at water */
r = await page.evaluate(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 500, d.y - 250]); S.moveTo = null;
  const run = (mount) => {
    S.horse.on = mount; S.px = d.x - 500; S.py = d.y - 250; S.stam = 100; S.stagger = 0;
    const x0 = S.px;
    for (let i = 0; i < 20; i++) Systems.update(0.1, { right: true });
    return { moved: S.px - x0, stam: S.stam, wob: !!S.qte };
  };
  S.flags.calm = false;
  const walk = run(false), ride = run(true);
  S.flags.calm = true; S.qte = null;
  return { walk: Math.round(walk.moved), ride: Math.round(ride.moved), ratio: +(ride.moved / walk.moved).toFixed(2), rideStam: Math.round(ride.stam) };
});
ok('mounted covers ~1.6×+ the ground of walking', r.ratio >= 1.5, `walk ${r.walk}u vs ride ${r.ride}u (×${r.ratio})`);
ok('the horse spends its own legs — stamina untouched at the gallop', r.rideStam >= 99, `stam ${r.rideStam} after 2s ride`);
r = await page.evaluate(() => {
  // face the creek: riding into water dismounts with a message, never a glitch
  S.horse.on = true;
  WL.tp([2760, 10080]); S.moveTo = null;   // Elm Creek's east bank
  for (let i = 0; i < 40 && Systems.horseOn(); i++) Systems.update(0.1, { left: true });
  return { on: S.horse.on, avail: Systems.horseAvail() };
});
ok('water dismounts the rider — the horse stays yours to remount', r.on === false && r.avail === true, JSON.stringify(r));

/* 7. delivering p4 retires the loaner and opens the rental */
r = await page.evaluate(() => {
  WL.tp('mill'); WL.instantPar();
  Systems.handleDelivery('mill');
  for (let i = 0; i < 60 && S.cine; i++) WL.skipCine();
  const loanEnded = S.horse.loaner === false;
  S.banked.provisions = 10;
  WL.tp('haven');
  const prompt = Systems.getInteractions().find(p => p.key === 'R');
  const rentLabel = prompt && /provisions/i.test(prompt.label);
  if (prompt) prompt.fn();
  return { loanEnded, rentLabel, paid: S.banked.provisions === 10 - DATA.T.horseRent, riding: Systems.horseOn() };
});
ok('the Mill run done, the loaner trots home — and R at a lit terminal rents a day\'s ride for provisions', r.loanEnded && r.rentLabel && r.paid && r.riding, JSON.stringify(r));

/* 8. scrappers spook it */
r = await page.evaluate(() => {
  S.horse.on = true;
  S.horse.breed = null;   // v3.22: steady BREEDS can hold their ground — this check tests the spook itself
  Systems.__proto__; // noop
  const on0 = Systems.horseOn();
  // simulate the catch consequence directly through the exported spook path: a runner catch calls it
  S.militia.cdT = 9999;   // keep riders out of this test
  const cdef = DATA.camps[0];
  WL.tp([cdef.x, cdef.y + cdef.r * 0.5]); S.moveTo = null;
  S.cargo.push(State.makeItem('food'));
  const c = S.camps[cdef.id];
  c.runners = [{ x: S.px + 10, y: S.py, wa: 0, state: 'patrol', cd: 0 }];
  S.flags.calm = false;
  for (let i = 0; i < 50 && Systems.horseOn(); i++) Systems.update(0.1, {});
  S.flags.calm = true;
  const spooked = !Systems.horseOn() && S.horse.spookT > 0;
  S.cargo = []; c.runners = [];
  return { on0, spooked };
});
ok('a scrapper hit spooks the horse — it bolts and circles back later', r.on0 && r.spooked, JSON.stringify(r));

/* 9. the valley walks without you: ambient waylighters exist, move, and carry packs */
r = await page.evaluate(() => {
  for (let i = 0; i < 200 && NPC.ambient().length === 0; i++) Systems.update(0.25, {});
  const w = NPC.ambient()[0];
  if (!w) return { none: true };
  const d0 = w.d;
  for (let i = 0; i < 10; i++) Systems.update(0.2, {});
  return { count: NPC.ambient().length, advanced: w.d > d0, crates: w.crates >= 1, named: !!w.n.name };
});
ok('other waylighters are on runs of their own — walking, laden, named', !r.none && r.count >= 1 && r.advanced && r.crates && r.named, JSON.stringify(r));

/* 10-11. companions: hands and homework */
r = await page.evaluate(() => {
  const n = NPC.gen({ at: 'haven', cls: 'courier' }); S.npcs.push(n);
  n.feeWaived = true; NPC.hire(n, 'companion');
  WL.tp('haven'); S.compPos = { x: S.px + 20, y: S.py };
  S.drops.push({ id: 77001, item: State.makeItem('meds'), x: S.px + 25, y: S.py + 5 });
  for (let i = 0; i < 30 && !n.carry.length; i++) Systems.update(0.2, {});
  const picked = n.carry.some(c => c.defId === 'meds');
  const bal0 = n.skills.bal || 0, xp0 = (n.trainXp || {}).bal || 0;
  n.fieldD = 799; S.speed = 100;
  const d = DATA.stations.haven;
  S.px = d.x - 400; S.py = d.y - 300;
  for (let i = 0; i < 12; i++) { S.speed = 100; NPC.update(0.2); }
  const learned = ((n.trainXp || {}).bal || 0) > xp0 || (n.skills.bal || 0) > bal0;
  NPC.dismiss(n, 'haven');
  return { picked, learned };
});
ok('a companion picks up your dropped crate and stows it — hands, not a bag', r.picked, JSON.stringify(r));
ok('walking together trains them — the road is a slower mailroom', r.learned, JSON.stringify(r));

/* 12. wants visible early: locked gear shows at the Foundry with its condition */
r = await page.evaluate(() => {
  S.stations.foundry.met = true;
  const list = Systems.fabList('foundry');
  const locked = list.filter(f => f.locked);
  const exo = locked.find(f => f.id === 'pack_exo1' || f.id === 'pack_exo2' || f.id === 'pack_sled');
  const tryMake = exo ? Systems.fabricate(exo) : null;
  return { lockedN: locked.length, exo: !!exo, cond: exo ? exo.locked : '', refused: tryMake === false };
});
ok('the Fabricate board shows tomorrow\'s gear LOCKED with its unlock condition — and refuses to print it', r.lockedN >= 2 && r.exo && /★/.test(r.cond) && r.refused, JSON.stringify(r));

/* 13. the send-off: leaving the yard with a fresh load is a moment, once */
r = await page.evaluate(async () => {
  S.orders.active = []; S.cargo = []; S.horse.on = false;
  WL.tp('haven');
  const runO = Economy.ordersFor('haven').find(o => !o.service) || Economy.ordersFor('haven')[0];
  Systems.acceptOrder(runO, false);
  const had = !!S.sendoff;
  Systems.update(0.1, {});   // a beat in the yard, so the yard is where we left FROM
  WL.tp([DATA.stations.haven.x, DATA.stations.haven.y + 400]); S.moveTo = null;
  Systems.update(0.2, {});
  const fired = S.sendoff === null;
  const toasted = /THE RUN/.test(document.getElementById('toasts').textContent);
  Systems.update(0.2, {});
  const stillNull = S.sendoff === null;
  return { had, fired, toasted, once: stillNull };
});
ok('accept → walk out → THE RUN plate fires once, with the load and the destinations', r.had && r.fired && r.toasted && r.once, JSON.stringify(r));

/* 14. New Waylighter KEEPS the valley: save with a connected station, retire, re-enlist */
r = await page.evaluate(() => {
  S.stations.elm.connected = true; S.stations.elm.litT = 1;
  S.stations.haven.appr = 77;
  const oldName = S.pName;
  State.save();
  return { oldName };
});
await boot();
const oldName = r.oldName;
await page.click('#btnNew');
await page.waitForFunction(() => !document.getElementById('chargen').classList.contains('hidden'), null, { timeout: 10000 });
await page.click('#cgBegin');
await page.waitForTimeout(700);
r = await page.evaluate(() => ({
  elmKept: S.stations.elm.connected === true,
  apprKept: Math.round(S.stations.haven.appr) === 77,
  retired: S.legacy.some(l => l.fate === 'hung up the coat'),
  playing: !document.getElementById('hud').classList.contains('hidden'),
}));
ok('New Waylighter hands over the coat: network, appreciation and the Roll all KEPT, chargen walked', r.elmKept && r.apprKept && r.retired && r.playing, JSON.stringify(r));

/* 15. and Reset actually burns it */
await boot();
await page.evaluate(() => { document.getElementById('btnReset').click(); document.getElementById('resetYes').click(); });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
r = await page.evaluate(() => ({ hasSave: State.hasSave(), continueHidden: document.getElementById('btnContinue').classList.contains('hidden') }));
ok('Burn it — start over: the save is gone and the title offers no Continue', r.hasSave === false && r.continueHidden, JSON.stringify(r));

ok('no page errors through the progression suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks green`);
await b.close();
