/* probe_smoke49 — scratch: exercise every v3.49 path once and report errors */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message) + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300); await page.click('#btnBegin'); await page.waitForTimeout(400); await page.click('#briefGo'); await page.waitForTimeout(300); await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
const ev = (fn, a) => page.evaluate(fn, a);
await ev(() => { S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9; for (const id of ['elm', 'mill', 'green', 'quarry', 'relay', 'foundry']) S.stations[id].connected = true; S.banked.metal = 900; S.banked.ceramic = 300; S.banked.lumen = 80; S.banked.provisions = 500; for (let i = 0; i < 6; i++) S.npcs.push(NPC.gen({ at: 'haven' })); });
// the wheel
const z0 = await ev(() => Render.zoomLevel());
await page.mouse.move(700, 400); await page.mouse.wheel(0, -120); await page.waitForTimeout(700);
const z1 = await ev(() => ({ step: Render.zoomStepOf(), z: Render.zoomLevel(), opt: UI.opts.zoomStep }));
await page.mouse.wheel(0, 240); await page.waitForTimeout(700);
const z2 = await ev(() => ({ step: Render.zoomStepOf(), z: Render.zoomLevel() }));
console.log('WHEEL', z0, JSON.stringify(z1), JSON.stringify(z2));
// storage
const st = await ev(() => { WL.tp('haven'); S.cargo.push(State.makeItem('metal')); S.cargo.push(State.makeItem('meds')); S.stations.haven.storage.push(State.makeItem('food')); UI.openStation('haven'); UI.gotoTab('storage'); const b2 = document.getElementById('stationBody'); const out = { rows: b2.querySelectorAll('.stRow').length, chips: [...b2.querySelectorAll('.stChip')].map(x => x.textContent.trim()), groups: [...b2.querySelectorAll('.stGroup')].map(x => x.textContent.trim()), tabs: document.getElementById('stationTabs').textContent }; return out; });
console.log('STORAGE', JSON.stringify(st));
await page.click('[data-stbulk="store"]'); await page.waitForTimeout(200);
console.log('BULK', await ev(() => ({ back: S.cargo.length, lockers: S.stations.haven.storage.length })));
await ev(() => document.getElementById('stationClose').click());
// the wire: raise Ash, cut it, splice it
const w1 = await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash; c.taken = null; c.pacified = false; c.asks = S.time; const took = Republic.takeRelayKit('ash'); WL.tp([ash.x - 30, ash.y + 60]); const raised = Republic.raiseRelay(ash); return { took, raised }; });
for (let i = 0; i < 30; i++) { const c = await ev(() => !!S.cine); if (!c) break; await ev(() => WL.skipCine()); await page.waitForTimeout(250); }
const w2 = await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'), pass = DATA.camps.find(c => c.id === 'pass'); S.camps.pass.pacified = false; S.camps.pass.taken = null; const raiders = Republic.raiderCamps().map(c => c.id); const started = Republic.startCut(ash, pass); for (let i = 0; i < 40; i++) Republic.tick(0.25); const st = S.stations.ashfire; return { raiders, started, cut: !!st.cut, light: World.lightAt(DATA.stations.ashfire.x, DATA.stations.ashfire.y), orders: Economy.ordersFor('ashfire').length, cutPosts: Republic.cutPosts().map(c => c.id) }; });
console.log('CUT', JSON.stringify(w1), JSON.stringify(w2));
const w3 = await ev(() => { WL.tp('ashfire'); UI.openStation('ashfire'); const txt = document.getElementById('stationBody').textContent.slice(0, 120), tabs = document.getElementById('stationTabs').textContent; document.getElementById('stationClose').click(); WL.tp('haven'); UI.openStation('haven'); const card = !!document.querySelector('[data-splicecoil="ash"]'); document.getElementById('stationClose').click(); return { txt, tabs, card }; });
console.log('SHUT', JSON.stringify(w3));
const w4 = await ev(() => { const ash = DATA.camps.find(c => c.id === 'ash'); const took = Republic.takeCoil('ash'); const m = Republic.mastOf(ash); WL.tp([m.x + 20, m.y + 30]); const g = Systems.getInteractions().find(i => i.key === 'G' && /Splice/.test(i.label)); if (g) g.fn(); for (let i = 0; i < 20; i++) Republic.tick(0.25); return { took, g: !!g, cut: !!S.stations.ashfire.cut, light: World.lightAt(DATA.stations.ashfire.x, DATA.stations.ashfire.y) }; });
console.log('SPLICE', JSON.stringify(w4));
// the ring given
const g1 = await ev(() => { const pass = DATA.camps.find(c => c.id === 'pass'); const ok = Republic.giveRing(pass, { x: pass.x, y: pass.y + 400 }); const sts = S.structures.filter(x => x.given === 'pass').map(x => x.type); WL.tp([pass.x + 20, pass.y + 30]); const warm = !!Republic.restFire(S.px, S.py); for (let i = 0; i < 60; i++) Republic.tick(0.25); return { ok, sts, warm, left: S.camps.pass.given.left, raiders: Republic.raiderCamps().map(c => c.id), roll: UI.campRollHTML(pass, true).slice(0, 80) }; });
console.log('GIVEN', JSON.stringify(g1));
// the knives' stone
const k1 = await ev(() => { const ridge = DATA.camps.find(c => c.id === 'ridge'), n = NPC.party()[0] || S.npcs[0]; S.camps.ridge.taken = null; S.camps.ridge.pacified = false; Republic.settleStones().push({ x: ridge.x + 40, y: ridge.y + ridge.r + 60, name: n.name.split(' ')[0], npc: n.id, camp: 'ridge', t: S.time - DATA.T.dayLen * 7 - 5, how: 'taken', calm: true, twice: true }); for (let i = 0; i < 40; i++) Republic.tick(0.25); const st2 = Republic.settleStones().slice(-1)[0]; return { set: !!(st2.kstone && st2.kstone.set), given: !!S.camps.ridge.stoneGiven, raiders: Republic.raiderCamps().map(c => c.id), nk: !!n.kstone }; });
console.log('KSTONE', JSON.stringify(k1));
// the hand who stays
const h1 = await ev(() => { const DL = DATA.T.dayLen, KD = DATA.T.kinDay; if (typeof Memorial !== 'undefined') Memorial.revealGround('town'); S.legacy.push({ name: 'Halvard Penrose', cls: 'x', fate: 'x', likes: 0, km: '0', deliveries: 1, cheated: false, seed: 4242, fact: 'town', kit: 'townshield', town: 'mill', home: true, keepsake: 'whistle', keepsakeT: S.time - DL * 7 - 1, kinName: 'Wenna Penrose' }); Memorial.raise('town'); const r0 = S.legacy[S.legacy.length - 1], sl = Republic.kinDaySlot(r0); const ids = [];
  for (let leg = 0; leg < 3; leg++) { const n = Republic.sendHelper(r0, sl); if (!n) return { fail: leg }; ids.push(n.id); n.lent.t -= KD.leg + 1; WL.tp('haven'); Republic.tick(0.02); for (let i = 0; i < 4000 && n.state === 'lentHome'; i++) Republic.tick(0.25); }
  const n = S.npcs.find(x => x.id === ids[2]); return { same: new Set(ids).size === 1, stays: !!n.stays, state: n.state, fee: n.feeWaived, legs: n.kinLegs }; });
console.log('STAYS', JSON.stringify(h1));
// frames of the new world art, quickly (no assertions)
await ev(() => { UI.toggleMap(true); }); await page.waitForTimeout(400); await ev(() => { UI.toggleMap(false); });
console.log('ERRORS', errors.length, errors.slice(0, 4).join(' | '));
await b.close();

