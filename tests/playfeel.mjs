import { chromium } from 'playwright';

const shots = '/home/claude/waylight/shots';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
const errs = [];
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
page.on('pageerror', e => errs.push(e.message));
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin');
await page.waitForTimeout(400);

const held = new Set();
async function setKeys(keys) {
  for (const k of [...held]) if (!keys.includes(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
}
// navigate by keyboard toward a target; auto-press Space on wobble QTE / struggle
async function walkTo(tx, ty, maxMs = 90000, opts = {}) {
  const t0 = Date.now();
  let lastPos = null, stuckMs = 0;
  while (Date.now() - t0 < maxMs) {
    const st = await page.evaluate(() => ({
      x: WL.S.px, y: WL.S.py, qte: !!WL.S.qte, struggle: !!WL.S.struggle, stagger: WL.S.stagger > 0,
      stam: WL.S.stam,
    }));
    if (st.qte || st.struggle) { await page.keyboard.press('Space'); await page.waitForTimeout(60); continue; }
    const dx = tx - st.x, dy = ty - st.y;
    if (Math.hypot(dx, dy) < 60) break;
    const keys = [];
    if (dx > 25) keys.push('d'); else if (dx < -25) keys.push('a');
    if (dy > 25) keys.push('s'); else if (dy < -25) keys.push('w');
    if (opts.sprint && st.stam > 30) keys.push('Shift');
    if (opts.brace) keys.push('Space');
    await setKeys(keys);
    await page.waitForTimeout(140);
    // stuck detection: sidestep
    if (lastPos && Math.hypot(st.x - lastPos.x, st.y - lastPos.y) < 4) {
      stuckMs += 140;
      if (stuckMs > 1400) {
        const side = Math.random() < 0.5 ? ['w', 'a'] : ['s', 'd'];
        await setKeys(side); await page.waitForTimeout(700); stuckMs = 0;
      }
    } else stuckMs = 0;
    lastPos = st;
  }
  await setKeys([]);
  return Date.now() - t0;
}

const log = [];

// --- p1 walked by hand: haven -> elm ---
await page.evaluate(() => { WL.openStation('haven'); });
await page.waitForTimeout(250);
await page.click('[data-accept="prio"]');
await page.click('#stationClose');
const elm = await page.evaluate(() => [DATA.stations.elm.x, DATA.stations.elm.y]);
const t1 = await walkTo(elm[0] + 40, elm[1] + 80, 150000);
log.push(`p1 walk took ${(t1 / 1000).toFixed(0)}s`);
await page.screenshot({ path: `${shots}/20_walk_arrive.png` });
await page.evaluate(() => WL.openStation('elm'));
await page.waitForTimeout(1000);
await page.screenshot({ path: `${shots}/21_results_real.png` });
await page.keyboard.press('Enter'); await page.waitForTimeout(250);
await page.evaluate(() => UI.closeAllModals());
let snap = await page.evaluate(() => WL.snapshot());
log.push(`p1 delivered by walking: likes=${snap.likes}`);

// --- heavy load over scree: wobble cadence ---
await page.evaluate(() => {
  WL.tp([4200, 9000]);
  for (let i = 0; i < 5; i++) WL.tool('bigCrate', 1);
});
const w0 = await page.evaluate(() => ({ st: WL.S.stats.steadies, tum: WL.S.stats.stumbles }));
await walkTo(3000, 8400, 30000);
const w1 = await page.evaluate(() => ({ st: WL.S.stats.steadies, tum: WL.S.stats.stumbles, kg: WL.State.weight(), cap: WL.State.cap() }));
log.push(`heavy walk (${w1.kg}kg/${w1.cap}): wobbles steadied=${w1.st - w0.st} stumbled=${w1.tum - w0.tum}`);
await page.screenshot({ path: `${shots}/22_heavy.png` });

// --- scrapper camp chase ---
await page.evaluate(() => { WL.tp([4280, 9280]); });
await page.waitForTimeout(300);
const chase0 = await page.evaluate(() => WL.S.cargo.length);
await walkTo(4280, 8100, 40000, { sprint: true }); // straight through pass camp
const chase1 = await page.evaluate(() => ({ cargo: WL.S.cargo.length, drops: WL.S.drops.length }));
log.push(`camp run: cargo ${chase0} -> ${chase1.cargo}, ground drops=${chase1.drops}`);
await page.screenshot({ path: `${shots}/23_campchase.png` });

// --- wraith encounter (walk unbraced in deep mist) ---
await page.evaluate(() => {
  WL.S.cargo.length = 0; WL.tool('food', 2);
  WL.tp([2600, 3400]);
});
await page.waitForTimeout(400);
let grabbed = false;
for (let i = 0; i < 90; i++) {
  const st = await page.evaluate(() => ({ w: WL.S.wraiths.map(w => w.state), struggle: !!WL.S.struggle, snags: WL.S.snags.length }));
  if (st.struggle) { grabbed = true; await page.screenshot({ path: `${shots}/24_wraithgrab.png` }); break; }
  if (st.w.includes('hunt') && i % 4 === 0) await page.screenshot({ path: `${shots}/25_wraithhunt.png` });
  // wander to make noise
  await setKeys([['w', 'a', 's', 'd'][i % 4]]);
  await page.waitForTimeout(300);
}
await setKeys([]);
// mash out or get yanked
for (let i = 0; i < 40; i++) {
  const s2 = await page.evaluate(() => ({ struggle: !!WL.S.struggle }));
  if (!s2.struggle) break;
  await page.keyboard.press('Space');
  await page.waitForTimeout(80);
}
const wr = await page.evaluate(() => ({ snags: WL.S.snags.length, escapes: WL.S.stats.escapes, wraiths: WL.S.wraiths.length }));
log.push(`wraith zone: grabbed=${grabbed} escapes=${wr.escapes} snags=${wr.snags} active=${wr.wraiths}`);

// --- rain visual in dark zone ---
await page.evaluate(() => { WL.S.weather.state = 'grey'; WL.S.weather.intensity = 0.9; WL.S.weather.t = 60; });
await page.waitForTimeout(1200);
await page.screenshot({ path: `${shots}/26_greyfall.png` });

// --- connect everything, pave a road, ride a zipline ---
await page.evaluate(async () => {
  WL.calm();
  while (WL.S.orders.prioIdx < DATA.priority.length) {
    const p = DATA.priority[WL.S.orders.prioIdx];
    WL.acceptPrio(); WL.tp(p.to); WL.instantPar(); WL.openStation(p.to);
    await new Promise(r => setTimeout(r, 320));
    WL.skipCine();
    await new Promise(r => setTimeout(r, 420));
    UI.showNextResult(); UI.showNextResult(); UI.showNextResult(); UI.closeAllModals();
  }
  for (const id of ['haven', 'green', 'foundry']) for (let i = 0; i < 5; i++) WL.Systems.addStationLikes(id, 600);
  WL.give({ metal: 3000, ceramic: 3000, lumen: 300 });
});
await page.waitForTimeout(500);
// pave all of Elm Road, walk it
await page.evaluate(() => {
  const road = DATA.roads[0];
  for (let si = 0; si < road.segs; si++) {
    const p = WL.World.paverPos(road, si);
    WL.tp([p.x, p.y]);
    const fund = WL.Systems.getInteractions().find(a => a.label.includes('Fund road'));
    if (fund) fund.fn();
  }
  WL.tp([4040, 9900]); WL.S.flags.calm = false;
});
const roadT0 = await page.evaluate(() => WL.S.px);
await walkTo(2500, 9370, 40000);
await page.screenshot({ path: `${shots}/27_roadwalk.png` });
const onRoadSpeed = await page.evaluate(() => WL.S.onRoad);
log.push(`road walk done (onRoad at end=${onRoadSpeed})`);

// zipline ride
await page.evaluate(() => {
  WL.tool('kitTool', 2);
  WL.tp('green'); WL.S.px += 140;
  WL.Systems.tryBuild('zipline');
  const p1 = WL.S.structures[WL.S.structures.length - 1];
  WL.S.px += 900;
  WL.Systems.tryBuild('zipline');
  WL.tp([p1.x + 10, p1.y + 10]);
});
await page.waitForTimeout(300);
await page.evaluate(() => { const a = WL.Systems.getInteractions().find(i => i.label.includes('Zipline')); if (a) a.fn(); });
await page.waitForTimeout(600);
await page.screenshot({ path: `${shots}/28_zipride.png` });
const zipped = await page.evaluate(() => WL.S.state);
log.push(`zip state during ride: ${zipped}`);

// title screen with live world behind it (reload, don't continue)
await page.goto(BASE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${shots}/29_title.png` });

console.log('\n=== PLAYFEEL ===');
log.forEach(l => console.log(l));
console.log('errors:', errs.length ? errs.slice(0, 5) : 'none');
await b.close();
