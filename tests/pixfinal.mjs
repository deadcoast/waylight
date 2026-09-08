import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(300);
// 1 — the briefing: Mara's personnel photo on the file
await page.screenshot({ path: '/tmp/v311_brief.png' });
await page.click('#briefGo'); await page.waitForTimeout(250); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); });
await page.waitForTimeout(300);
// 2 — walking with the survey sheet open (route drawn, rail live)
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 60]); Systems.moveTo(d.x - 700, d.y - 400); });
await page.keyboard.press('m'); await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/v311_survey.png' });
await page.keyboard.press('m'); await page.waitForTimeout(300);
// 3 — hearts + [E] keycap beside the walker, bleeding, at play zoom
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 40]); S.moveTo = null; S.health = 47; S.bleeding = true; document.getElementById('guide').style.display = 'none'; document.getElementById('toasts').style.display = 'none'; });
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/v311_ekey_hearts.png' });
await page.evaluate(() => { S.bleeding = false; S.health = 100; });
// 4 — GREYFALL takes the CRT voice
await page.evaluate(() => { S.weather.state = 'grey'; S.weather.intensity = 0.7; Render.crtTitle('GREYFALL', 'the rain that eats · cargo rots in the dark — light protects'); });
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/v311_crt.png' });
await page.waitForTimeout(3200);
await page.evaluate(() => { S.weather.state = 'clear'; S.weather.intensity = 0; });
// 5 — the terminal: nameplate, folder tabs, plates, grooves
await page.evaluate(() => { S.cargo.push(State.makeItem('meds'), State.makeItem('food'), State.makeItem('lumenCell')); UI.openStation('haven'); });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/v311_terminal.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
// 6 — a ruin wall, close: the stone-wall generator in the world
await page.evaluate(() => {
  S.cargo = []; UI.refreshCargo();
  const rn = S.ruins.find(r => !r.looted && r.type === 'cottage') || S.ruins.find(r => r.type !== 'shrine');
  WL.tp([rn.x - 6, rn.y + 52]); S.moveTo = null; Render.setZoom(2.6);
  document.getElementById('guide').style.display = 'none'; document.getElementById('toasts').style.display = 'none';
});
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/v311_ruin.png', clip: { x: 420, y: 120, width: 600, height: 480 } });
await page.evaluate(() => Render.setZoom(null));
console.log('done');
await b.close();
