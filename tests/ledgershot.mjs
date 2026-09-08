import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/led_title.png' });   // the living-ledger title with the wordmark
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  // connect green + elm so the wire has pairs; fill green, starve elm for the window read
  for (const id of ['green', 'elm']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(); World.rebuildLight();
  for (const g of Object.keys(S.stations.green.stock)) S.stations.green.stock[g] = 92;
  for (const g of Object.keys(S.stations.elm.stock)) S.stations.elm.stock[g] = 6;
  S.level = 30;   // Legend coat
  const d = DATA.stations.elm; WL.tp([d.x + 30, d.y + 130]); S.moveTo = null;
  document.getElementById('guide').style.display = 'none'; document.getElementById('toasts').style.display = 'none';
});
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/led_elm_critical.png', clip: { x: 480, y: 120, width: 480, height: 420 } });
await page.evaluate(() => { const d = DATA.stations.green; WL.tp([d.x + 30, d.y + 130]); S.moveTo = null; });
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/led_green_full.png', clip: { x: 480, y: 120, width: 480, height: 420 } });
// wire pulse: wait for a caravan between haven-elm/green then wide shot
await page.evaluate(() => { WL.timeScale = 3; Render.setZoom(0.55); WL.tp([ (DATA.stations.haven.x + DATA.stations.elm.x)/2, (DATA.stations.haven.y + DATA.stations.elm.y)/2 ]); S.moveTo = null; });
await page.waitForFunction(() => Economy.pulses.length > 0, null, { timeout: 60000 }).catch(() => {});
await page.evaluate(() => { WL.timeScale = 1; });
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/led_wire.png' });
console.log('pulses:', await page.evaluate(() => Economy.pulses.length));
await b.close();
