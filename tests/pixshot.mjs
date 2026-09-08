import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE:', m.text()); });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/pix_chargen.png' });
await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); });
await page.waitForTimeout(400);
// 1 — standing at a terminal: E-keycap beside the walker + hearts in the HUD
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 40]); S.moveTo = null; S.health = 64; S.bleeding = true; });
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/pix_ekey.png' });
// pressed state
await page.keyboard.down('e');
await page.waitForTimeout(120);
await page.screenshot({ path: '/tmp/pix_ekey_down.png', clip: { x: 500, y: 180, width: 500, height: 420 } });
await page.keyboard.up('e');
await page.waitForTimeout(300);
// close whatever E opened
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 2 — the survey sheet
await page.keyboard.press('m'); await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/pix_map.png' });
await page.keyboard.press('m'); await page.waitForTimeout(200);
// 3 — CRT title
await page.evaluate(() => Render.crtTitle('GREYFALL', 'the rain that eats · cargo rots in the dark — light protects'));
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/pix_crt.png' });
await page.waitForTimeout(3200);
// 4 — pause sheet: buttons, slider, nameplate
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/pix_pause.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// 5 — station terminal sheet: nameplate, tabs, buttons
await page.evaluate(() => UI.openStation('haven'));
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/pix_station.png' });
console.log('done');
await b.close();
