import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); });
// 1 — night lantern AFTER (same framing as the before from v3.12)
await page.evaluate(() => { S.time = 60 + DATA.T.dayLen * 0.75; const d = DATA.stations.haven; WL.tp([d.x - 820, d.y - 560]); S.moveTo = null;
  document.getElementById('guide').style.display = 'none'; document.getElementById('toasts').style.display = 'none'; Render.setZoom(1.6); });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/light_after.png', clip: { x: 400, y: 150, width: 640, height: 520 } });
// 2 — the walker up close, day, mid-stride with a companion
await page.evaluate(() => { S.time = 60; const d = DATA.stations.haven; WL.tp([d.x + 90, d.y + 70]); S.moveTo = null;
  const n = NPC.gen({ at: 'haven' }); n.state = 'companion'; n.carry = []; n.x = S.px - 40; n.y = S.py + 16; n.food = 100; S.npcs.push(n);
  S.compPos = { x: S.px - 40, y: S.py + 16 };
  S.cargo.push(State.makeItem('meds', 555), State.makeItem('food'));
  Render.setZoom(2.6); });
await page.waitForTimeout(700);
await page.keyboard.down('d');
await page.waitForTimeout(420);
await page.screenshot({ path: '/tmp/v314_walkers.png', clip: { x: 420, y: 140, width: 620, height: 480 } });
await page.keyboard.up('d');
await page.evaluate(() => Render.setZoom(null));
console.log('done');
await b.close();
