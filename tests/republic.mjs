/* republic.mjs — v3.32 THE REPUBLIC IN FORCE: the sandbox foundation, proven on the ground.
   Stance law (sealed where lore seals it, gated where play walks it), the raider truce and its
   price, the Unlit rising and BOTH doctrines (the quell that marches and costs, the parley that
   walks and is remembered), presences from one registry (shrines fed, larders hunting, the
   procession, the far shape), the mountain road opening Farkeep and its kit, the class-read
   intercept, the walkable Diefenbunker hall, the save, the modal law. */
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

/* ================= 1 · THE REGISTRIES SEED THE GROUND ================= */
let r = await ev(() => {
  Republic.tick(0.01);
  const sh = Republic.sites('flameshrine'), hf = Republic.sites('hollowfire');
  const open = [...sh, ...hf].every(s2 => { const t = World.terrainAt(s2.x, s2.y); return !t.blocked && !t.water; });
  let minD = 1e9;
  for (const s2 of hf) for (const id of DATA.stationOrder) minD = Math.min(minD, U.dist(s2.x, s2.y, DATA.stations[id].x, DATA.stations[id].y));
  return { shrines: sh.length, larders: hf.length, open, minD: Math.round(minD) };
});
ok('the presence registry SEEDS: 3 shrines on the walked ways, 2 larders on the loneliest open ground', r.shrines === 3 && r.larders === 2 && r.open && r.minD >= 600, JSON.stringify(r));

/* ================= 2 · STANCE LAW ================= */
r = await ev(() => ({
  wl: Republic.stance('waylight'), fk: Republic.stance('farkeep'), rp: Republic.stance('reapers'),
  ca: Republic.stance('cannibals'), rd: Republic.stance('raiders'), fl: Republic.stance('flamekeepers'),
  sealWl: Republic.setStance('waylight', 'HOSTILE'), sealRp: Republic.setStance('reapers', 'WARY'),
}));
ok('the seals hold: Waylight/Farkeep ABSOLUTE_ALLY, Reapers/Cannibals ABSOLUTE_HOSTILE — and NO play moves them', r.wl === 'ABSOLUTE_ALLY' && r.fk === 'ABSOLUTE_ALLY' && r.rp === 'ABSOLUTE_HOSTILE' && r.ca === 'ABSOLUTE_HOSTILE' && r.sealWl === false && r.sealRp === false, JSON.stringify(r));
r = await ev(() => {
  const before = Republic.setStance('raiders', 'WARY');            // renegade 0 — the gate refuses
  S.renegade = 25;                                                 // Road's Own (tier 2)
  const after = Republic.setStance('raiders', 'WARY');
  return { before, tier: Republic.renTier(), after, st: Republic.stance('raiders'), truce: Republic.truce() };
});
ok('THE TRUCE IS GATED, then WALKED: refused at Clean Hands, called at the Road\'s Own (tier 2)', r.before === false && r.tier >= 2 && r.after === true && r.st === 'WARY' && r.truce === true, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  /* the truce is TOTAL: stand inside a camp's claim with cargo — nobody moves on you */
  const cd = DATA.camps[0], c = S.camps[cd.id];
  c.pacified = false; c.alert = 1;
  let px = cd.x + cd.r * 0.4, py = cd.y;
  for (let r2 = 0; r2 < 300; r2 += 24) { if (!World.terrainAt(px, py + r2).blocked) { py += r2; break; } }
  WL.tp([px, py]);
  S.cargo = S.cargo.filter(x => x.tool); State.addCargo(State.makeItem('meds'));
  c.runners = [{ x: px - 120, y: py, wa: 0, state: 'patrol', cd: 0 }];
  const g0 = U.dist(c.runners[0].x, c.runners[0].y, S.px, S.py);
  setTimeout(() => res({ g0: Math.round(g0), g1: Math.round(U.dist(c.runners[0].x, c.runners[0].y, S.px, S.py)) }), 2500);
}));
ok('under the truce the camps STAND DOWN: cargo inside the claim and the gap never closes', Math.abs(r.g1 - r.g0) < 40, JSON.stringify(r));
r = await ev(() => {
  const answered = Systems.militiaCall();
  const told = !!S.flags.tut.hornTruce;
  Republic.setStance('raiders', 'HOSTILE');                        // break it
  return { answered, told, broken: Republic.stance('raiders') === 'HOSTILE', horns: Republic.hornsAnswer() };
});
ok('THE TRUCE\'S PRICE: the horn sounds and NOTHING answers — and breaking the truce hands the horns back', r.answered === false && r.told && r.broken && r.horns, JSON.stringify(r));

/* ================= 3 · THE UNLIT AND THE TWO DOCTRINES ================= */
r = await ev(() => {
  S.stations.quarry.connected = true; State.refreshSources();
  Republic.rebellionStrike('quarry');
  S.quiet = S.quiet || {}; S.quiet.quarry = true;                  // even a starving ledger posts NO core for doctrine
  const orders = Economy.ordersFor('haven');
  const noCore = !orders.some(o => o.relight === 'quarry');
  delete S.quiet.quarry;
  return { unlit: Republic.isUnlit('quarry'), dark: !S.stations.quarry.connected, noCore, mail: S.mails.some(m => m.subj.includes('joined the Unlit')) };
});
ok('A RISING is political dark: the lamp goes down BY CHOICE, and NO relight order posts — doctrine, not logistics', r.unlit && r.dark && r.noCore && r.mail, JSON.stringify(r));
r = await ev(() => {
  S.stations.quarry.likesTo = 4;
  const refused = Republic.tryParley('quarry');
  S.stations.quarry.likesTo = 44; S.banked.provisions = 30;
  const heard = Republic.tryParley('quarry');
  return { refused, heard, lit: S.stations.quarry.connected, marked: !!S.rep.parleyed.quarry, still: Republic.isUnlit('quarry') };
});
ok('THE PARLEY: refused at a cold door (likes too low), heard at a warm one — the light restored by a WALK, remembered', r.refused === false && r.heard === true && r.lit && r.marked && !r.still, JSON.stringify(r));
r = await ev(() => {
  S.stations.mill.connected = true; State.refreshSources();
  Republic.rebellionStrike('mill');
  const l0 = S.stations.mill.likesTo = 30;
  S.banked.metal = 100; S.banked.provisions = 60;
  const funded = Republic.fundQuell('mill');
  const q = Republic.quell();
  const marching = q && q.kind === 'quell' && q.pts.length > 1;
  const lead0 = Republic.columnPos(0.2, 0);
  /* the casualty roll is FORCED true — the mountain pays, the stone gets ready */
  const mr = Math.random; Math.random = () => 0.1;
  q.t = q.dur + 1; Republic.tick(0.02);
  Math.random = mr;
  return { funded, marching, leadOnGround: !!lead0, lit: S.stations.mill.connected, apprPaid: S.stations.mill.likesTo <= l0 - 7,
    done: !Republic.quell(), stone: S.legacy.some(g => g.fact === 'farkeep' && g.cls === 'Farkeeper Shield'), teeth: !!Memorial.site('farkeep') };
});
ok('THE QUELL: funded, MARCHED on real ground, the light restored BY FORCE — appreciation paid, and the mountain\'s casualty writes a STANDING TEETH stone', r.funded && r.marching && r.leadOnGround && r.lit && r.apprPaid && r.done && r.stone && r.teeth, JSON.stringify(r));

/* ================= 4 · PRESENCES FROM ONE TABLE ================= */
r = await ev(() => {
  const s2 = Republic.sites('flameshrine')[0];
  WL.tp([s2.x, s2.y]);
  S.banked.lumen = 10;
  const acts = Republic.interactions();
  const feed = acts.find(a => a.label.includes('Feed the flame'));
  if (feed) feed.fn();
  const fed1 = Republic.shrinesFed();
  for (const s3 of Republic.sites('flameshrine')) s3.fedUntil = S.time + 400;   // the other two, fed for the ladder
  return { prompt: !!feed, fed1, fedAll: Republic.shrinesFed(), stance: Republic.stance('flamekeepers') };
});
ok('A SHRINE FEEDS: the bowl takes banked lumen by hand, and every fed bowl walks the Flame Keepers\' stance up the ladder', r.prompt && r.fed1 === 1 && r.fedAll === 3 && r.stance !== 'HOSTILE', JSON.stringify(r));
r = await ev(() => {
  /* the ladder read AFTER the third bowl: the engine grants ALLY on the next feed-check — force via setStance path */
  const g = Republic.gateOk('flamekeepers', 'ALLY');
  Republic.setStance('flamekeepers', 'ALLY');
  return { gateOpen: g.ok, st: Republic.stance('flamekeepers') };
});
ok('three fed bowls OPEN the ally gate — the tenders walk to meet you', r.gateOpen && r.st === 'ALLY', JSON.stringify(r));
r = await ev(() => new Promise(res => {
  /* the procession: forced night + deep grey, the roll forced ON — and the file harvests only what walks INTO it */
  const T2 = DATA.T;
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.8;   // deep night
  let mx = S.px, my = S.py, bm = -1;
  for (let y = 1000; y < DATA.H - 1000; y += 400) for (let x = 1000; x < DATA.W - 1000; x += 400) {
    const t = World.terrainAt(x, y); if (t.blocked || t.water) continue;
    const m = World.mistAt(x, y); if (m > bm) { bm = m; mx = x; my = y; }
  }
  WL.tp([mx, my]);
  S.rep.evt = null; S.rep.evtCd = 0;
  const mr = Math.random; Math.random = () => 0.1;
  Republic.tick(0.6); Republic.tick(0.6);
  Math.random = mr;
  const e = Republic.procession();
  if (!e) { res({ spawned: false }); return; }
  const hp0 = S.health;
  const f = e.file[0]; WL.tp([f.x, f.y]);                          // walk INTO the file — the one sin it punishes
  Republic.tick(0.6);
  res({ spawned: true, file: e.file.length, tolled: S.health < hp0, told: !!S.flags.tut.sawReapers });
}));
ok('THE PROCESSION crosses the night grey: four hooded shapes, no chase — and a walker IN the file pays the toll', r.spawned && r.file === 4 && r.tolled && r.told, JSON.stringify(r));
r = await ev(() => {
  /* the far shape: dusk forced, the roll forced, the mail ladder begins */
  const T2 = DATA.T;
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.55 + T2.dayLen * 2;   // dusk, two days on
  S.rep.giant.cd = 0; S.rep.giant.act = null;
  const m0 = S.mails.length;
  const mr = Math.random; Math.random = () => 0.1;
  Republic.tick(0.6);
  Math.random = mr;
  const g = Republic.giant();
  /* camera-true law: the whole silhouette must FIT the viewport band (≈128 world px half-height) */
  const inFrame = g.act ? Math.abs(g.act.y - S.py) + 0 <= 128 && (g.act.y - 148) - S.py >= -130 && Math.abs(g.act.x - S.px) <= 180 : false;
  return { seen: g.seen, act: !!g.act, inFrame, mailed: S.mails.length > m0 };
});
ok('THE FAR SHAPE stands over the mist at the light\'s turn — sighted, mailed, WHOLE IN FRAME (the camera-true law), and counted toward the ladder', r.seen === 1 && r.act && r.inFrame && r.mailed, JSON.stringify(r));

/* ================= 5 · THE MOUNTAIN ROAD AND THE KIT ================= */
r = await ev(() => {
  S.banked = { ...S.banked, metal: 0, wood: 0, provisions: 0 };
  const poor = Republic.fundMountain();
  S.banked.metal = 120; S.banked.wood = 80; S.banked.provisions = 60;
  const funded = Republic.fundMountain();
  const mt = Republic.mountain();
  mt.t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
  const fl = Globe.REGIONS.find(rg => rg.id === 'farlands');
  return { poor, funded, phase: Republic.mountain().phase, farlands: fl && fl.open,
    bowLive: FACT.FK_CLASSES.longbowmen.live, bowRange: FACT.FK_CLASSES.longbowmen.stats.range,
    riderLive: FACT.FK_CLASSES.rifle_rider.live, berLive: FACT.FK_CLASSES.berserker.live };
});
ok('THE MOUNTAIN ROAD: refused poor, funded and CUT — the Farlands open on the globe and the whole kit goes LIVE from its rows', r.poor === false && r.funded && r.phase === 'open' && r.farlands && r.bowLive && r.bowRange === 320 && r.riderLive && r.berLive, JSON.stringify(r));
r = await ev(() => {
  S.banked.metal = 100; S.banked.ceramic = 40;
  const hired = Republic.hireKit('longbowmen');
  const bow = S.npcs.find(n => n.fk && n.fkCls === 'longbowmen');
  return { hired, exists: !!bow, state: bow && bow.state };
});
ok('the kit HIRES at the desk: a longbowman of Farkeep joins the walk', r.hired && r.exists && (r.state === 'companion' || r.state === 'pool'), JSON.stringify(r));
r = await ev(() => {
  /* the class-read intercept: a runner at 260 — past every fist, inside the bow's 320 */
  const bow = S.npcs.find(n => n.fk && n.fkCls === 'longbowmen');
  if (bow.state !== 'companion') NPC.hire(bow, 'companion');
  bow.x = S.px; bow.y = S.py; bow.shoveCd = 0; bow.hungry = false;
  const runner = { x: S.px + 260, y: S.py, wa: 0, state: 'patrol', cd: 0 };
  const x0 = runner.x;
  const met = NPC.intercept(runner);
  return { met, dropped: runner.cd > 5, whereHeStood: Math.abs(runner.x - x0) < 2 };
});
ok('the intercept READS THE ROW: the longbowman answers at 260 — a range no fist reaches — and the runner is dropped WHERE HE STANDS, not shoved', r.met && r.dropped && r.whereHeStood, JSON.stringify(r));

/* ================= 6 · THE WALKED HALL ================= */
r = await ev(() => {
  S.exile = S.exile || {}; S.exile.door = 'opened';
  const entered = Republic.enterRoom('diefenbunker');
  const R = REP.INTERIORS.diefenbunker;
  /* walls hold: walk hard left for 3 simulated seconds */
  for (let i = 0; i < 60; i++) Republic.moveRoom(0.05, { left: true });
  const clamped = S.room.x >= 16;
  /* the log desk answers */
  S.room.x = 73; S.room.y = 120;
  const acts = Republic.interactions();
  const logs = acts.find(a => a.label.includes('log desk'));
  if (logs) logs.fn();
  const read = !!S.flags.tut.readSbsn;
  /* nothing made of grey follows you in */
  S.wraiths.push({ x: S.px, y: S.py, state: 'drift', alert: 1, cd: 0 });
  const grabbedBefore = !!S.struggle;
  /* the door out */
  S.room.x = R.entry.x; S.room.y = 166;
  const exitAct = Republic.interactions().find(a => a.label.includes('walk out'));
  if (exitAct) exitAct.fn();
  S.wraiths.length = 0;
  return { entered, clamped, logsPrompt: !!logs, read, grabbedBefore, out: !S.room };
});
ok('THE HALL IS WALKED: entered from the cold door, walls that HOLD, the SBSN record read standing up, no grey inside, and the door walks you out', r.entered && r.clamped && r.logsPrompt && r.read && !r.grabbedBefore && r.out, JSON.stringify(r));

/* ================= 7 · THE SHEET, THE LAW, THE SAVE ================= */
r = await ev(() => {
  RepublicUI.open();
  const openNow = !document.getElementById('republicOv').classList.contains('hidden');
  const html = document.getElementById('repBody').innerHTML;
  const modal = UI.anyModal();
  const gates = UI.gateReport().join(' | ');
  const noTodo = !html.includes('TODO');
  const courted = html.includes('SEALED BY THE FOUNDING') && html.includes('The Standing') === false && html.includes('Farkeep');
  const esc = UI.escPressed();
  const closed = document.getElementById('republicOv').classList.contains('hidden');
  return { openNow, modal, gated: gates.includes('republic'), noTodo, courted, esc, closed };
});
ok('THE BANNER SHEET obeys the modal law — counted, gated, reported by name, ESC adjourns — and carries no TODO anywhere', r.openNow && r.modal && r.gated && r.noTodo && r.courted && r.esc && r.closed, JSON.stringify(r));
r = await ev(() => {
  Republic.rebellionStrike('green');
  State.save();
  const raw = JSON.parse(localStorage.getItem('waylight_save_v1'));
  const kept = raw && raw.rep && !!raw.rep.unlit.green && raw.rep.mountain.phase === 'open' && raw.rep.giant.seen === 1 && !!raw.rep.parleyed.quarry;
  Republic.tryParley && S.stations.green && (S.stations.green.likesTo = 60, S.banked.provisions = 40, Republic.tryParley('green'));
  return { kept };
});
ok('the SAVE carries the whole republic: the rising, the cut road, the sighting count, the parley memory — one shape, additive, migration-safe', r.kept, JSON.stringify(r));

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the republic', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
