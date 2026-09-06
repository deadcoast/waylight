import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.waitForTimeout(600);
await page.keyboard.type('MELLYGIBS', { delay: 30 }); await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/id_title.png' });
await page.click('#btnNew'); await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/id_intro.png' });
await page.click('#btnBegin'); await page.waitForTimeout(250); await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); });
// the Dispatch calling a double drop over the results screen
await page.evaluate(() => {
  S.trip = { n: 1, lastT: S.time }; S.stations.elm.met = true; WL.tp('elm'); S.stations.haven.stock.food = 20;
  Systems.acceptOrder(Economy.ordersFor('elm').find(x => x.item === 'food' && x.to === 'haven'), false);
  WL.tp('haven'); WL.openStation('haven');
});
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/id_doubledrop.png' });
console.log('done');
await b.close();
