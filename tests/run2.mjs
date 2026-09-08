import { chromium } from 'playwright';

const BASE = 'file:///home/claude/waylight/dist/test.html?debug';
const shots = '/home/claude/waylight/shots';
const errors = [];
const results = [];
const ok = (name, cond, extra = '') => {
  results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
  if (!cond) process.exitCode = 1;
};

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const noise = /fonts\.g|favicon|ERR_CONNECTION|Failed to load resource/;
page.on('console', m => { if (m.type() === 'error' && !noise.test(m.text())) errors.push('console: ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n  ' + String(e.stack).split('\n').slice(0, 3).join('\n  ')));

await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());

// ---------- char-gen with a real build ----------
await page.click('#btnNew'); await page.waitForTimeout(150);
await page.click('#btnBegin'); await page.waitForTimeout(300);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('[data-cls="mountaineer"]');
await page.click('[data-trait="greymarked"]'); // +5 covers the -2
await page.click('[data-trait="surefoot"]');   // -4 => net -1 <0, begin disabled
let disabled = await page.evaluate(() => document.getElementById('cgBegin').disabled);
ok('over-budget build blocks begin', disabled === true);
await page.click('[data-trait="surefoot"]');   // deselect => +3 net
await page.waitForTimeout(100);
await page.evaluate(() => { document.getElementById('cgName').value = 'Test Porter'; document.getElementById('cgName').dispatchEvent(new Event('input')); });
await page.click('#cgBegin');
await page.waitForTimeout(500);
let snap = await page.evaluate(() => WL.snapshot());
let porter = await page.evaluate(() => WL.porter());
ok('porter created with class skills', porter.cls === 'mountaineer' && porter.skills.climb === 2, JSON.stringify(porter.skills));
ok('trait applied', porter.traits.includes('greymarked'), porter.traits.join(','));
ok('ruins seeded', snap.ruins >= 20, `ruins=${snap.ruins}`);
await page.screenshot({ path: `${shots}/50_newporter.png` });

// ---------- action XP ----------
await page.evaluate(() => WL.calm());
await page.evaluate(() => WL.tp([3800, 9900]));   // open meadow west of Haven, clear of scrapper ground
await page.keyboard.down('a'); await page.waitForTimeout(2500); await page.keyboard.up('a');
const footXp = await page.evaluate(() => WL.S.skills.foot.xp + WL.S.skills.foot.lv * 999);
ok('walking grants Footwork XP', footXp > 0, `xp=${footXp.toFixed(1)}`);
const endXp = await page.evaluate(() => WL.S.skills.end.xp);
await page.evaluate(() => { WL.tp([3800, 9900]); });
await page.keyboard.down('Shift'); await page.keyboard.down('a');
await page.waitForTimeout(2000);
await page.keyboard.up('a'); await page.keyboard.up('Shift');
ok('sprinting grants Endurance XP', await page.evaluate(() => WL.S.skills.end.xp) > endXp);

// ---------- skills panel ----------
await page.keyboard.press('k'); await page.waitForTimeout(250);
ok('skills panel opens', await page.evaluate(() => !document.getElementById('skillsOv').classList.contains('hidden')));
await page.screenshot({ path: `${shots}/51_skills.png` });
await page.keyboard.press('k');

// ---------- eating & moodles ----------
await page.evaluate(() => { WL.S.food = 20; });
let moodles = await page.evaluate(() => Porter.moodles().map(m => m.id));
ok('hungry moodle shows', moodles.includes('hungry'), moodles.join(','));
await page.keyboard.press('h'); await page.waitForTimeout(200);
ok('eating restores food', await page.evaluate(() => WL.S.food) > 40);

// ---------- ruin looting ----------
const ruinRes = await page.evaluate(() => {
  const r = WL.S.ruins.find(r => !r.looted);
  WL.tp([r.x + 10, r.y + 10]);
  const act = WL.Systems.getInteractions().find(i => i.label.includes('Search'));
  if (!act) return 'no-action';
  act.fn();
  return { looted: r.looted };
});
await page.waitForTimeout(300);
ok('ruin lootable', ruinRes !== 'no-action' && ruinRes.looted === true, JSON.stringify(ruinRes));
await page.screenshot({ path: `${shots}/52_loot.png` });
const cargoAfterLoot = await page.evaluate(() => {
  const n = WL.S.cargo.length;
  document.getElementById('lootTake').click();
  return { before: n, after: WL.S.cargo.length };
});
ok('loot taken into cargo', cargoAfterLoot.after >= cargoAfterLoot.before, JSON.stringify(cargoAfterLoot));
ok('salvage XP granted', await page.evaluate(() => WL.S.skills.sal.xp + WL.S.skills.sal.lv * 999) > 0);

// ---------- junk scrapping ----------
await page.evaluate(() => { WL.tool('junk_cog', 2); WL.tp('haven'); });
const scrapped = await page.evaluate(() => WL.Systems.scrapJunk('haven'));
ok('junk scraps into materials', scrapped >= 2, `scrapped=${scrapped}`);

// ---------- manual study ----------
await page.evaluate(() => { WL.tool('man_climb1', 1); });
const manRes = await page.evaluate(() => {
  const m = WL.S.cargo.find(c => c.defId === 'man_climb1');
  Porter.readManual(m);
  return WL.S.manuals.climb1 === true;
});
ok('manual studied', manRes === true);

// ---------- equip gear ----------
await page.evaluate(() => { WL.tool('boots_tread', 1); });
const equipRes = await page.evaluate(() => {
  const it = WL.S.cargo.find(c => c.defId === 'boots_tread');
  WL.State.removeCargo(it.id);
  WL.S.equip.boots = it;
  Porter.dirty();
  return Porter.eff().wobbleMul;
});
ok('gear affects effects', equipRes < 1, `wobbleMul=${equipRes.toFixed(2)}`);

// ---------- NPC hire as companion ----------
await page.evaluate(() => { WL.npcAt('haven'); WL.give({ metal: 500, ceramic: 300, lumen: 100 }); });
const hireRes = await page.evaluate(() => {
  const n = WL.S.npcs.find(x => x.state === 'pool');
  const okh = NPC.hire(n, 'companion');
  return { ok: okh, comp: !!NPC.companion() };
});
ok('companion hired', hireRes.ok && hireRes.comp, JSON.stringify(hireRes));
const giveRes = await page.evaluate(() => {
  WL.tool('food', 1);
  const it = WL.S.cargo.find(c => c.defId === 'food');
  NPC.give(it);
  return NPC.companion().carry.length;
});
ok('companion carries given cargo', giveRes === 1);
await page.waitForTimeout(400);
await page.screenshot({ path: `${shots}/53_companion.png` });

// ---------- rescue event resolves & waives fee ----------
const rescueRes = await page.evaluate(async () => {
  WL.tool('bandage', 1);
  const npc = NPC.gen({});
  WL.S.event = { id: 999, type: 'rescueInjured', x: WL.S.px + 30, y: WL.S.py, t: 400, data: { npc } };
  const act = WL.Systems.getInteractions().find(i => i.label.includes('Treat'));
  if (!act) return 'no-treat';
  act.fn();
  await new Promise(r => setTimeout(r, 200));
  const saved = WL.S.npcs.find(n => n.id === npc.id);
  return saved ? { bond: saved.bond, waived: saved.feeWaived, state: saved.state } : 'not-saved';
});
ok('rescue saves NPC with waived fee', rescueRes.bond === true && rescueRes.waived === true, JSON.stringify(rescueRes));

// ---------- route automation ----------
const routeRes = await page.evaluate(async () => {
  // connect elm so a route pair exists; boost coverage for slots
  WL.calm();
  for (let i = 0; i < 3; i++) {
    const p = DATA.priority[WL.S.orders.prioIdx];
    WL.acceptPrio(); WL.tp(p.to); WL.instantPar(); WL.openStation(p.to); WL.skipHandover();
    await new Promise(r => setTimeout(r, 300));
    WL.skipCine();
    await new Promise(r => setTimeout(r, 350));
    UI.showNextResult(); UI.showNextResult(); UI.closeAllModals();
  }
  for (const id of ['haven', 'elm']) for (let i = 0; i < 5; i++) WL.Systems.addStationLikes(id, 600);
  const n = WL.S.npcs.find(x => x.state === 'pool') || (WL.npcAt('haven'), WL.S.npcs[WL.S.npcs.length - 1]);
  n.state = 'pool'; n.feeWaived = true;
  if (!NPC.hire(n, 'route')) return 'hire-fail: slots=' + NPC.routeSlots();
  NPC.assignRoute(n, 'haven', 'elm');
  const likes0 = WL.S.likes;
  WL.S.banked.provisions = 10;
  n.route.t = 0.05;
  await new Promise(r => setTimeout(r, 400));
  return { runs: n.route.runs, likesGained: WL.S.likes - likes0, prov: WL.S.banked.provisions };
});
ok('route porter completes runs', routeRes.runs >= 1, JSON.stringify(routeRes));

// ---------- cooking ----------
await page.evaluate(() => { WL.tp('haven'); WL.S.banked.provisions = 12; });
await page.waitForTimeout(250);
const cookRes = await page.evaluate(() => {
  const act = WL.Systems.getInteractions().find(i => i.key === 'C');
  if (!act) return 'no-cook';
  act.fn();
  return WL.S.cargo.some(c => c.defId === 'warmmeal');
});
ok('cooking makes a warm meal', cookRes === true, String(cookRes));

// ---------- trader ----------
const tradeRes = await page.evaluate(() => {
  WL.give({ metal: 500, ceramic: 300, lumen: 100 });
  UI2.openTrader(NPC.peddlerStock());
  const n0 = WL.S.cargo.length;
  document.querySelector('[data-buy="0"]').click();
  const bought = WL.S.cargo.length > n0;
  document.getElementById('traderClose').click();
  return bought;
});
ok('peddler trade works', tradeRes === true);

// ---------- DEATH in the light: cairn + echo + rebirth ----------
const preDeath = await page.evaluate(() => ({
  name: WL.S.pName, footLv: WL.S.skills.foot.lv, footTotal: Math.round(WL.S.skills.foot.total),
  stations: Object.values(WL.S.stations).filter(s => s.connected).length,
  cargo: WL.S.cargo.length,
}));
// dying mid-priority-order must not lock the chain: the origin re-posts it
const prioBefore = await page.evaluate(() => { const p = DATA.priority[WL.S.orders.prioIdx]; if (p && !WL.S.orders.prioAccepted) WL.acceptPrio(); return { idx: WL.S.orders.prioIdx, acc: WL.S.orders.prioAccepted, active: WL.S.orders.active.filter(o => o.prio).length }; });
await page.evaluate(() => { WL.tp('haven'); WL.S.px += 300; Porter.transcribe(); WL.kill('scrappers'); });
await page.waitForTimeout(500);
const prioAfter = await page.evaluate(() => ({ idx: WL.S.orders.prioIdx, acc: WL.S.orders.prioAccepted, reposted: Systems.boardFor(DATA.priority[WL.S.orders.prioIdx].from).some(b => b.prio), lostAtGrave: WL.S.graves[0] && WL.S.graves[0].items.filter(i => i.lostTo).length }));
ok('priority order re-posts after death (no soft-lock)', prioBefore.acc && !prioAfter.acc && prioAfter.reposted && prioAfter.idx === prioBefore.idx, JSON.stringify({ before: prioBefore, after: prioAfter }));
ok('death overlay shows', await page.evaluate(() => !document.getElementById('deathOv').classList.contains('hidden')));
await page.screenshot({ path: `${shots}/54_death.png` });
snap = await page.evaluate(() => WL.snapshot());
ok('grave + legacy recorded', snap.graves === 1 && snap.legacy === 1, JSON.stringify({ g: snap.graves, l: snap.legacy }));
ok('fallen porter joins echo roster', await page.evaluate(() => WL.S.echoRoster.includes('Test Porter')));
ok('companion survived to pool', await page.evaluate(() => !NPC.companion() && WL.S.npcs.some(n => n.state === 'pool')));
await page.click('#deathContinue');
await page.waitForTimeout(300);
ok('char-gen after death', await page.evaluate(() => !document.getElementById('chargen').classList.contains('hidden')));
await page.click('[data-cls="courier"]');
await page.click('#cgBegin');
await page.waitForTimeout(500);
snap = await page.evaluate(() => WL.snapshot());
porter = await page.evaluate(() => WL.porter());
ok('world persists across death', snap.stations.elm.c === true && snap.graves === 1, JSON.stringify(snap.stations.elm));
ok('new porter is fresh', porter.skills.climb === 0 && porter.name !== 'Test Porter', porter.name);

// ---------- cairn recovery: gear + journal skills ----------
const claimRes = await page.evaluate(() => {
  const g = WL.S.graves[0];
  WL.tp([g.x, g.y]);
  const act = WL.Systems.getInteractions().find(i => i.label.includes('Recover'));
  if (!act) return 'no-claim';
  const before = WL.S.cargo.length;
  act.fn();
  return { gained: WL.S.cargo.length - before, graves: WL.S.graves.length, footTotal: Math.round(WL.S.skills.foot.total) };
});
ok('cairn recovered: items + journal XP', claimRes.graves === 0 && claimRes.footTotal > 0, JSON.stringify(claimRes));

// ---------- DEATH in the grey: porter-wraith, flare frees ----------
const wraithDeath = await page.evaluate(() => {
  let spot = null;
  for (let y = 2400; y < 6000 && !spot; y += 120) for (let x = 1200; x < 7200; x += 120) {
    if (WL.World.mistAt(x, y) > 0.6 && !WL.World.terrainAt(x, y).blocked) { spot = [x, y]; break; }
  }
  if (!spot) return 'no-spot';
  WL.tp(spot);
  WL.kill('wraith');
  return { wraith: WL.S.graves[0] && WL.S.graves[0].wraith };
});
ok('death in grey makes porter-wraith', wraithDeath.wraith === true, JSON.stringify(wraithDeath));
await page.waitForTimeout(300);
await page.click('#deathContinue'); await page.waitForTimeout(250);
await page.click('[data-cls="lightkeeper"]').catch(() => {});
await page.evaluate(() => { // lightkeeper is -4: add grey-marked +5
  const t = document.querySelector('[data-trait="greymarked"]'); if (t) t.click();
});
await page.click('#cgBegin');
await page.waitForTimeout(400);
await page.screenshot({ path: `${shots}/55_wraithgrave.png` });
const freeRes = await page.evaluate(async () => {
  const g = WL.S.graves[0];
  WL.S.gear.flares = 1;
  WL.tp([g.x + 60, g.y]);
  WL.Systems.useFlare();
  await new Promise(r => setTimeout(r, 200));
  return { wraith: g.wraith, echo: WL.S.echoRoster.length };
});
ok('flare frees the kept porter', freeRes.wraith === false && freeRes.echo >= 2, JSON.stringify(freeRes));

// ---------- save v2 roundtrip ----------
const pName2 = await page.evaluate(() => { WL.State.save(); return WL.S.pName; });
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue');
await page.waitForTimeout(600);
snap = await page.evaluate(() => WL.snapshot());
ok('v2 save restores porter + world', await page.evaluate(() => WL.S.pName) === pName2 && snap.legacy === 2 && snap.npcs >= 1,
  JSON.stringify({ legacy: snap.legacy, npcs: snap.npcs }));

// ---------- v1 migration ----------
// navigate to the title first so the live game's unload autosave can't clobber the crafted v1 save
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => {
  const s = JSON.parse(localStorage.getItem('waylight_save_v1'));
  // strip v2 fields back to a v1 shape
  const v1 = { ...s, v: 1 };
  for (const k of ['graves', 'npcs', 'ruins', 'legacy', 'echoRoster', 'compPos', 'event', 'eventCd', 'surgeT', 'stormT', 'poolT',
    'pName', 'pClass', 'pTraits', 'pSeed', 'pLine', 'skills', 'health', 'food', 'warmth', 'bleeding', 'bruisedT', 'foodZeroT',
    'buffs', 'manuals', 'equip', 'journal', 'pStats', 'dead']) delete v1[k];
  v1.gear = { tarp: true, frame1: true, frame2: false, sled: true, sledOn: false, flares: 3 };
  v1.level = 8; v1.stamMax = 132; v1.capBase = 84;
  delete v1.banked.provisions;
  localStorage.setItem('waylight_save_v1', JSON.stringify(v1));
});
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue');
await page.waitForTimeout(700);
const mig = await page.evaluate(() => ({
  v: WL.S.v, name: WL.S.pName, cls: WL.S.pClass,
  coat: WL.S.equip.coat.defId, pack: WL.S.equip.pack.defId,
  sledInCargo: WL.S.cargo.some(c => c.defId === 'pack_sled'),
  flares: WL.S.gear.flares, prov: WL.S.banked.provisions,
  endLv: WL.S.skills.end.lv, ruins: WL.S.ruins.length,
  elmConnected: WL.S.stations.elm.connected,
}));
ok('v1 save migrates: the Founder inherits', mig.v === 3 && mig.name === 'The Founder' && mig.coat === 'coat_wax' && mig.pack === 'pack_exo1' && mig.sledInCargo && mig.flares === 3 && mig.prov === 12 && mig.endLv >= 4 && mig.ruins >= 20, JSON.stringify(mig));
ok('migrated world intact', mig.elmConnected === true);

console.log('\n=== EXPANSION RESULTS ===');
results.forEach(r => console.log(r));
console.log('\n=== ERRORS (' + errors.length + ') ===');
errors.slice(0, 12).forEach(e => console.log(e));
await b.close();
