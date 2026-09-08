import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); });
await page.waitForTimeout(300);
// 1 — a ruin with the stone-wall texture
await page.evaluate(() => {
  const rn = S.ruins.find(r => !r.looted && r.type !== 'shrine') || S.ruins[0];
  WL.tp([rn.x + 30, rn.y + 34]); S.moveTo = null;
  document.getElementById('guide').style.display = 'none'; document.getElementById('toasts').style.display = 'none';
});
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/pix_ruin.png', clip: { x: 480, y: 180, width: 500, height: 420 } });
// 2 — E-keycap up + held (visual state via noteE)
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 40]); S.moveTo = null; S.health = 47; S.bleeding = true; });
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/pix_ekey_up.png', clip: { x: 560, y: 240, width: 360, height: 300 } });
await page.evaluate(() => Render.noteE(true));
await page.waitForTimeout(80);
await page.screenshot({ path: '/tmp/pix_ekey_held.png', clip: { x: 560, y: 240, width: 360, height: 300 } });
await page.evaluate(() => Render.noteE(false));
// hearts closeup
await page.screenshot({ path: '/tmp/pix_hearts.png', clip: { x: 0, y: 0, width: 300, height: 200 } });
// 3 — cargo panel with crate chips
await page.evaluate(() => {
  S.cargo.push(State.makeItem('meds'), State.makeItem('food'), State.makeItem('lumenCell'), State.makeItem('letters'));
  UI.refreshCargo();
});
await page.keyboard.press('i'); await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/pix_cargo.png', clip: { x: 1100, y: 60, width: 340, height: 560 } });
await page.keyboard.press('i'); await page.waitForTimeout(200);
// 4 — station tabs with folders
await page.evaluate(() => UI.openStation('haven')); await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/pix_tabs.png', clip: { x: 290, y: 250, width: 900, height: 140 } });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// 5 — chargen die
await page.evaluate(() => { document.getElementById('chargen').classList.remove('hidden'); });
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/pix_die.png', clip: { x: 900, y: 30, width: 540, height: 160 } });
await page.evaluate(() => { const b2 = document.getElementById('cgRoll'); b2 && b2.click(); });
await page.waitForTimeout(90);
await page.screenshot({ path: '/tmp/pix_die_roll.png', clip: { x: 900, y: 30, width: 540, height: 160 } });
console.log('done');
await b.close();
