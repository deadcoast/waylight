/* v327shot.mjs — evidence: the two shelves, the works standing and paying, the ecosystem ledger. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(200);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
const ev = fn => page.evaluate(fn);
await ev(() => { for (let i = 0; i < 15 && S.cine; i++) WL.skipCine(); S.flags.guideDone = true; WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999; S.time = 30; State.refreshSources(true);
  S.flags.unlocks.kit = true; S.banked.metal = 300; S.banked.ceramic = 200; S.banked.wood = 60; S.banked.lumen = 40; });

/* A — the two shelves at the terminal */
await ev(() => { WL.tp('haven'); S.moveTo = null; UI.openStation('haven'); UI.gotoTab('fab'); });
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/v327_shelves.png' });
await ev(() => UI.closeAllModals());

/* B — a sawcamp standing at the treeline, paying (chip in flight) */
await ev(() => {
  const hv = DATA.stations.haven;
  const f = World.nearestForest(hv.x, hv.y, 2000);
  S.structures.push({ id: U.uid(), type: 'sawcamp', x: f.x + 40, y: f.y + 10, ang: 0, hp: 100, by: 'you', likes: 0 });
  const st = S.structures[S.structures.length - 1];
  WL.tp([f.x + 100, f.y + 60]); S.moveTo = null;
  document.getElementById('toasts').innerHTML = ''; document.getElementById('earnFeed').innerHTML = '';
  st.workT = DATA.T.sawRate - 0.05; Systems.update(0.2, {});
});
await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 4, null, { timeout: 15000 });
await page.waitForTimeout(250);
await page.screenshot({ path: '/tmp/v327_sawcamp.png' });

/* C — the ecosystem ledger, three works + tiers tallied */
await ev(() => {
  const hv = DATA.stations.haven;
  let misty = null;
  for (let rr = 200; rr < 3000 && !misty; rr += 140) for (let a = 0; a < 12 && !misty; a++) {
    const x = hv.x + Math.cos(a / 12 * 7) * rr, y = hv.y + Math.sin(a / 12 * 7) * rr;
    if (!World.terrainAt(x, y).blocked && !World.terrainAt(x, y).water && World.mistBase(x, y) >= DATA.T.stillMist + 0.05) misty = { x, y };
  }
  S.structures.push({ id: U.uid(), type: 'lumenstill', x: misty.x, y: misty.y, ang: 0, hp: 100, by: 'you', likes: 0, made: 3 });
  S.structures.push({ id: U.uid(), type: 'watchtower', x: hv.x + 220, y: hv.y + 60, ang: 0, hp: 62, by: 'you', likes: 0, tier: 3, made: 2 });
  S.eco.produced = { wood: 4, lumen: 3, metal: 2 };
  UI.openStation('haven'); UI.gotoTab('ledger');
  document.querySelector('.sheetBody').scrollTop = 0;
});
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/v327_ledger.png' });
console.log('v327 shots done');
await b.close();
