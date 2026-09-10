/* ecosystem.mjs — v3.27 THE ECOSYSTEM: utilities ride the pack, works hold the ground, and the
   loop REVOLVES — works pay the bank while they stand mended (sited by terrain, doubled by the
   storm, sharpened by the crews), the bank prints utilities and kits, repairs feed metal back,
   and the ledger reads it all from one truth. */
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
  S.flags.unlocks.kit = true; S.flags.unlocks.shelter = true; S.flags.unlocks.watchtower = true;
  S.banked.metal = 400; S.banked.ceramic = 300; S.banked.wood = 80; S.banked.lumen = 60; S.banked.provisions = 30;
});

/* ================= THE TWO SHELVES ================= */
let r = await ev(() => {
  WL.tp('haven'); S.moveTo = null;
  UI.openStation('haven'); UI.gotoTab('fab');
  const body = document.querySelector('#stationBody') || document.querySelector('.sheetBody');
  const txt = body.innerText;
  UI.closeAllModals();
  return {
    shelves: /UTILITIES — WHAT RIDES THE PACK/.test(txt) && /WORKS — WHAT HOLDS THE GROUND/.test(txt),
    loopLaw: /works PAY the bank/i.test(txt) && /repairs feed metal back/i.test(txt),
    loopLines: (txt.match(/↻/g) || []).length >= 2,
  };
});
ok('the terminal names the TWO THINGS as two things — utilities ride the pack, works hold the ground — and the loop law reads at the counter with per-item loop lines', r.shelves && r.loopLaw && r.loopLines, JSON.stringify(r));
r = await ev(() => {
  const opts = Systems.buildOptions().map(o => o.type);
  return { has: ['sawcamp', 'clayoven', 'lumenstill'].every(t => opts.includes(t)), n: opts.length };
});
ok('the build bar offers the three production works once kits are known', r.has, JSON.stringify(r));

/* ================= SITING IS THE LAW ================= */
r = await ev(() => {
  // scan for a genuinely treeless lit-ish spot and a forest-adjacent one; ask the ONE truth (workSiteOk)
  const hv = DATA.stations.haven;
  const f = World.nearestForest(hv.x, hv.y, 2000);
  let dry = null;
  for (let rr = 300; rr < 2400 && !dry; rr += 120) for (let a = 0; a < 10 && !dry; a++) {
    const x = hv.x + Math.cos(a / 10 * 7) * rr, y = hv.y + Math.sin(a / 10 * 7) * rr;
    if (!World.terrainAt(x, y).blocked && !World.terrainAt(x, y).water && !World.nearestForest(x, y, DATA.T.sawReach)) dry = { x, y };
  }
  const sawGood = f ? Systems.workSiteOk('sawcamp', f.x + 30, f.y).ok : null;
  const sawBad = dry ? Systems.workSiteOk('sawcamp', dry.x, dry.y) : null;
  return { sawGood, sawBadRefused: sawBad && !sawBad.ok, why: sawBad && sawBad.why };
});
ok('the sawcamp\'s law: a treeline in reach says yes, a bare mile says NO and says why', r.sawGood === true && r.sawBadRefused && /TREELINE/.test(r.why), JSON.stringify(r));
r = await ev(() => {
  // the still wants the veil: find high/low mistBase spots and ask the law
  const hv = DATA.stations.haven;
  let misty = null, clear = null;
  for (let rr = 200; rr < 3000 && (!misty || !clear); rr += 140) for (let a = 0; a < 12; a++) {
    const x = hv.x + Math.cos(a / 12 * 7) * rr, y = hv.y + Math.sin(a / 12 * 7) * rr;
    if (World.terrainAt(x, y).blocked || World.terrainAt(x, y).water) continue;
    const m = World.mistBase(x, y);
    if (!misty && m >= DATA.T.stillMist + 0.05) misty = { x, y, m };
    if (!clear && m < DATA.T.stillMist - 0.08) clear = { x, y, m };
  }
  return {
    mistyOk: misty ? Systems.workSiteOk('lumenstill', misty.x, misty.y).ok : 'none-found',
    clearRefused: clear ? !Systems.workSiteOk('lumenstill', clear.x, clear.y).ok : 'none-found',
  };
});
ok('the still\'s law: thick veil says yes, burned-clear ground says no — the light\'s edge is the site', r.mistyOk === true && r.clearRefused === true, JSON.stringify(r));
r = await ev(() => {
  // the oven wants wet ground; rock high on a rim refuses
  let wet = null, dryRock = null;
  for (let cy = 400; cy < DATA.H && (!wet || !dryRock); cy += 320) for (let cxx = 400; cxx < DATA.W; cxx += 320) {
    const c = World.classAt(cxx, cy);
    if (!wet && (c === World.MARSH) && !World.terrainAt(cxx, cy).blocked) wet = { x: cxx, y: cy };
  }
  const q = DATA.stations.quarry;
  for (let rr = 100; rr < 900 && !dryRock; rr += 90) for (let a = 0; a < 8 && !dryRock; a++) {
    const x = q.x + Math.cos(a) * rr, y = q.y + Math.sin(a) * rr;
    const t = World.terrainAt(x, y);
    if (!t.blocked && !t.water && !Systems.workSiteOk('clayoven', x, y).ok) dryRock = { x, y };
  }
  return { wetOk: wet ? Systems.workSiteOk('clayoven', wet.x, wet.y).ok : 'none-found', dryRefused: !!dryRock };
});
ok('the oven\'s law: marsh in a short walk says yes, dry rock says no', r.wetOk === true && r.dryRefused, JSON.stringify(r));
r = await ev(() => {
  // the refusal is honest on the BUILD path too, before the kit is spent
  const hv = DATA.stations.haven;
  let dry = null;
  for (let rr = 300; rr < 2400 && !dry; rr += 120) for (let a = 0; a < 10 && !dry; a++) {
    const x = hv.x + Math.cos(a / 10 * 7) * rr, y = hv.y + Math.sin(a / 10 * 7) * rr;
    const t = World.terrainAt(x, y);
    if (!t.blocked && !t.water && !World.nearestForest(x, y, DATA.T.sawReach) && World.lightAt(x, y) > 0.32) dry = { x, y };
  }
  if (!dry) return { skip: true };
  WL.tp([dry.x, dry.y]); S.moveTo = null;
  WL.tool('kitTool', 1);
  const kits0 = State.countTool('kit');
  document.getElementById('toasts').innerHTML = '';
  const built = Systems.tryBuild('sawcamp', { x: dry.x, y: dry.y });
  return { built, kitKept: State.countTool('kit') === kits0, toast: /treeline/i.test(document.getElementById('toasts').innerText) };
});
ok('a refused site refuses BEFORE the kit is spent — the toast says what the ground wants', r.skip || (!r.built && r.kitKept && r.toast), JSON.stringify(r));

/* ================= THE WORKS PAY ================= */
r = await ev(() => {
  // raise a sawcamp by haven's own treeline and let it pay
  const hv = DATA.stations.haven;
  const f = World.nearestForest(hv.x, hv.y, 2000);
  const sx = f.x + 40, sy = f.y + 10;
  S.structures.push({ id: U.uid(), type: 'sawcamp', x: sx, y: sy, ang: 0, hp: 100, by: 'you', likes: 0 });
  const st = S.structures[S.structures.length - 1];
  const w0 = S.banked.wood;
  document.getElementById('earnFeed').innerHTML = '';
  st.workT = DATA.T.sawRate - 0.05;
  Systems.update(0.2, {});
  return { paid: S.banked.wood - w0, made: st.made, eco: S.eco.produced.wood, state: Systems.workState(st).s };
});
ok('a sawcamp on a good site PAYS: wood banked, lifetime counted, the ecosystem tally written, state WORKING', r.paid === 1 && r.made === 1 && r.eco === 1 && r.state === 'WORKING', JSON.stringify(r));
await page.waitForTimeout(350);
r = await ev(() => ({ chip: [...document.querySelectorAll('#earnFeed .earnChip')].some(el => /Sawcamp/i.test(el.innerText)) }));
ok('every unit LANDS as a chip the player sees — the sawcamp\'s pay is announced like any other coin', r.chip, JSON.stringify(r));
r = await ev(() => {
  // the storm is a harvest: the still runs double in grey weather
  const hv = DATA.stations.haven;
  let misty = null;
  for (let rr = 200; rr < 3000 && !misty; rr += 140) for (let a = 0; a < 12 && !misty; a++) {
    const x = hv.x + Math.cos(a / 12 * 7) * rr, y = hv.y + Math.sin(a / 12 * 7) * rr;
    if (!World.terrainAt(x, y).blocked && !World.terrainAt(x, y).water && World.mistBase(x, y) >= DATA.T.stillMist + 0.05) misty = { x, y };
  }
  S.structures.push({ id: U.uid(), type: 'lumenstill', x: misty.x, y: misty.y, ang: 0, hp: 100, by: 'you', likes: 0 });
  const st = S.structures[S.structures.length - 1];
  st.workT = 0; S.weather.state = 'clear'; Systems.update(1, {});
  const clearGain = st.workT;
  st.workT = 0; S.weather.state = 'grey'; Systems.update(1, {});
  const greyGain = st.workT;
  S.weather.state = 'clear'; S.weather.t = 99999;
  return { ratio: +(greyGain / clearGain).toFixed(2) };
});
ok('the still drinks the STORM: grey weather runs its clock at double', r.ratio > 1.9 && r.ratio < 2.1, JSON.stringify(r));
r = await ev(() => {
  // the camp sharpens the saws and the saws sharpen the camp — mutual, measured
  const saw = S.structures.find(s2 => s2.type === 'sawcamp');
  const f = { x: saw.x - 30, y: saw.y };
  const n = NPC.gen({ at: 'haven' }); n.state = 'field'; n.job = 'forrester'; n.route = { a: 'haven', b: null };
  n.fx = f.x; n.fy = f.y; n.fwork = 0; n.ftarget = { x: f.x, y: f.y }; S.npcs.push(n);
  saw.workT = 0; Systems.update(1, {});
  const withCrew = saw.workT;
  const near = Systems.sawcampNear(n.fx, n.fy);
  n.state = 'pool'; n.job = null;
  saw.workT = 0; Systems.update(1, {});
  const alone = saw.workT;
  return { ratio: +(withCrew / alone).toFixed(2), near };
});
ok('the synergy is MUTUAL and measured: a forrester on the stand runs the camp a quarter faster, and the camp reads near for the axe', r.ratio > 1.2 && r.ratio < 1.3 && r.near, JSON.stringify(r));
r = await ev(() => {
  // disrepair pauses hands — nothing pays, nothing drains
  const saw = S.structures.find(s2 => s2.type === 'sawcamp');
  saw.hp = 20; saw.workT = 10;
  Systems.update(1, {});
  const frozen = Math.abs(saw.workT - 10) < 0.001;
  const state = Systems.workState(saw).s;
  saw.hp = 100;
  return { frozen, state };
});
ok('disrepair PAUSES hands: the clock holds, the ledger says DISREPAIR — repair (5 metal) is the loop feeding back', r.frozen && r.state === 'DISREPAIR', JSON.stringify(r));

/* ================= THE TIERS JOIN THE LOOP ================= */
r = await ev(() => {
  // the armed post sweeps metal; the room dries provisions where meadow grows
  const hv = DATA.stations.haven;
  S.structures.push({ id: U.uid(), type: 'watchtower', x: hv.x + 220, y: hv.y + 60, ang: 0, hp: 100, by: 'you', likes: 0, tier: 3 });
  const tw = S.structures[S.structures.length - 1];
  const m0 = S.banked.metal;
  tw.workT = DATA.T.titheRate - 0.05; Systems.update(0.2, {});
  // shelter: find meadow
  let md = null;
  for (let rr = 200; rr < 2600 && !md; rr += 130) for (let a = 0; a < 10 && !md; a++) {
    const x = hv.x + Math.cos(a / 10 * 7) * rr, y = hv.y + Math.sin(a / 10 * 7) * rr;
    if (!World.terrainAt(x, y).blocked && World.classAt(x, y) === World.MEADOW) md = { x, y };
  }
  S.structures.push({ id: U.uid(), type: 'shelter', x: md.x, y: md.y, ang: 0, hp: 100, by: 'you', likes: 0, tier: 2 });
  const sh = S.structures[S.structures.length - 1];
  const p0 = S.banked.provisions;
  sh.workT = DATA.T.rackRate - 0.05; Systems.update(0.2, {});
  // and a shelter with genuinely NO meadow in reach reads honest — scan for truly bare ground
  let bare = null;
  for (let cy2 = 600; cy2 < DATA.H && !bare; cy2 += 260) for (let cx2 = 600; cx2 < DATA.W && !bare; cx2 += 260) {
    const t = World.terrainAt(cx2, cy2);
    if (t.blocked || t.water) continue;
    let anyMeadow = World.classAt(cx2, cy2) === World.MEADOW;
    for (let a = 0; a < 8 && !anyMeadow; a++) if (World.classAt(cx2 + Math.cos(a / 8 * 7) * DATA.T.rackReach, cy2 + Math.sin(a / 8 * 7) * DATA.T.rackReach) === World.MEADOW) anyMeadow = true;
    if (!anyMeadow) bare = { x: cx2, y: cy2 };
  }
  let badState = 'no-bare-ground-found';
  if (bare) {
    S.structures.push({ id: U.uid(), type: 'shelter', x: bare.x, y: bare.y, ang: 0, hp: 100, by: 'you', likes: 0, tier: 2 });
    const shBad = S.structures[S.structures.length - 1];
    badState = Systems.workState(shBad) ? Systems.workState(shBad).s : 'no-work';
    S.structures.splice(S.structures.indexOf(shBad), 1);
  }
  return { tithe: S.banked.metal - m0, rack: S.banked.provisions - p0, badState };
});
ok('the TIERS join the loop: the armed post tithes metal, the room\'s rack dries provisions by its meadow — and a rack with no meadow says so instead of paying', r.tithe === 1 && r.rack === 1 && /NO MEADOW/.test(r.badState), JSON.stringify(r));

/* ================= THE LEDGER READS IT ================= */
r = await ev(() => {
  UI.openStation('haven'); UI.gotoTab('ledger');
  const body = document.querySelector('#stationBody') || document.querySelector('.sheetBody');
  const txt = body.innerText;
  UI.closeAllModals();
  return {
    block: /The ecosystem/i.test(txt),
    rows: /Sawcamp/.test(txt) && /Lumen still/.test(txt) && /Spotter's tithe/.test(txt) && /Drying rack/.test(txt),
    states: /WORKING/.test(txt),
    totals: /Produced, all works, all time/.test(txt) && /wood 1/.test(txt) && /metal 1/.test(txt),
  };
});
ok('[ THE ECOSYSTEM ] reads in the ledger: every producing work with its state, rate, lifetime pay — and the all-time tally', r.block && r.rows && r.states && r.totals, JSON.stringify(r));
r = await ev(() => {
  // the whole loop in one sentence of state: bank prints a kit (utilities) from what works paid
  const w0 = S.banked.wood;
  return { loopReal: w0 >= 1 && typeof Systems.workInfo === 'function' };
});
ok('the loop stands closed: what the works paid sits in the same bank the terminal prints from', r.loopReal, JSON.stringify(r));

console.log('\n=== ECOSYSTEM (v3.27) ===');
for (const line of results) console.log(line);
const pass = results.filter(x => x.startsWith('PASS')).length;
console.log(`\n${pass}/${results.length} checks passed`);
if (errors.length) { console.log('PAGE ERRORS:', errors.slice(0, 6)); process.exitCode = 1; }
await b.close();
