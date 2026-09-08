/* v315before.mjs — evidence: the checkered beam pillars as they stand in v3.14 */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => {
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  const d = DATA.stations.haven;
  WL.tp([d.x - 10, d.y + 170]); S.moveTo = null;
  document.getElementById('guide').style.display = 'none';
  document.getElementById('toasts').style.display = 'none';
  document.getElementById('hud').style.display = 'none';
  Render.setZoom(1.4);
});
await page.evaluate(() => { S.time = 60; });                      // noon
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/v315_beam_day_before.png', clip: { x: 340, y: 40, width: 760, height: 640 } });
await page.evaluate(() => { S.time = 60 + DATA.T.dayLen * 0.75; }); // deep night
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/v315_beam_night_before.png', clip: { x: 340, y: 40, width: 760, height: 640 } });
/* prop lineup as it stands: salvage triangles + plain box crates */
await page.evaluate(() => {
  S.time = 60;
  const n = S.nodes.find(n2 => n2.type === 'metal' && !n2.taken);
  if (n) WL.tp([n.x - 40, n.y + 20]);
  S.drops.push({ id: 99001, item: State.makeItem('meds'), x: S.px + 60, y: S.py + 10 });
  Render.setZoom(2.2);
});
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/v315_props_before.png', clip: { x: 420, y: 140, width: 620, height: 480 } });
console.log('before frames saved');
await b.close();
