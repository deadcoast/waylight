import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  const d = DATA.stations.haven; WL.tp([d.x + 60, d.y - 420]); S.moveTo = null;
  // a well-walked desire path: a lazy S-curve of many passes, worn to bare earth in the middle
  for (let t2 = 0; t2 <= 1; t2 += 0.008) {
    const wx = S.px - 260 + t2 * 520, wy = S.py + Math.sin(t2 * 5.2) * 60;
    World.addWear(wx, wy, t2 > 0.2 && t2 < 0.8 ? 90 : 40);
  }
  World.flushWear(99);
  document.getElementById('guide').style.display = 'none'; document.getElementById('toasts').style.display = 'none';
});
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/art_path.png', clip: { x: 400, y: 240, width: 640, height: 380 } });
console.log('path done');
await b.close();
