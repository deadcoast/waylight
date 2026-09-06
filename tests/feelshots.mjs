import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.screenshot({ path: '/tmp/feel_title.png' });
await page.click('#btnNew'); await page.waitForTimeout(150);
await page.screenshot({ path: '/tmp/feel_intro.png' });
await page.click('#btnBegin'); await page.waitForTimeout(250); await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; });
// terminal with the keeper's voice
await page.evaluate(() => { WL.tp('haven'); S.stations.haven.stock.food = 12; WL.openStation('haven'); });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/feel_keeper.png' });
await page.evaluate(() => document.getElementById('stationClose').click());
// companion + strung route in the field
await page.evaluate(() => {
  const n = NPC.gen({ at: 'haven' }); n.state = 'companion'; n.carry = [State.makeItem('food')]; n.x = S.px + 60; n.y = S.py + 20; n.food = 100; S.npcs.push(n);
  WL.tp('haven'); S.px += 400; S.py -= 100;
  S.route = []; S.moveTo = null;
  Systems.queueMove(S.px + 380, S.py - 60);
  Systems.queueMove(S.px + 520, S.py + 260);
  Systems.queueMove(S.px + 180, S.py + 420);
  Systems.bark('campNear');
});
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/feel_route.png' });
// map with the strung route
await page.keyboard.press('m'); await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/feel_map_route.png' });
console.log('done');
await b.close();
