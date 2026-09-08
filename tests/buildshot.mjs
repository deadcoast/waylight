import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
page.on('pageerror', e => console.log('PAGEERROR:', e.message));
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => {
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  const d = DATA.stations.haven, bx = d.x - 500, by = d.y - 260;
  WL.tp([bx + 60, by + 150]); S.moveTo = null;
  S.structures.push(
    { id: 9001, type: 'generator', x: bx - 120, y: by, ang: 0, hp: 100 },
    { id: 9002, type: 'shelter', x: bx + 40, y: by - 30, ang: 0, hp: 100 },
    { id: 9003, type: 'watchtower', x: bx + 200, y: by - 10, ang: 0, hp: 100 },
    { id: 9004, type: 'zipline', x: bx + 330, y: by + 40, ang: 0, hp: 100 },
    { id: 9005, type: 'zipline', x: bx + 620, y: by - 60, ang: 0, hp: 100 },
    { id: 9006, type: 'bridge', x: bx + 60, y: by + 190, ang: 0.4, hp: 100 },
    { id: 9007, type: 'ladder', x: bx + 250, y: by + 170, ang: -0.2, hp: 100 },
    { id: 9008, type: 'shelter', x: bx - 60, y: by + 300, ang: 0, hp: 30 },   // a failing one
  );
  S.zipLinks.push([9004, 9005]);
  document.getElementById('guide').style.display = 'none'; document.getElementById('toasts').style.display = 'none';
  Render.setZoom(1.35);
});
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/builds1.png' });
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x - 460, d.y - 220]); S.moveTo = null; Render.setZoom(2.2); });
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/builds_close.png', clip: { x: 200, y: 60, width: 1040, height: 640 } });
// night: the trophies hold their lamps
await page.evaluate(() => { S.time = 60 + DATA.T.dayLen * 0.72; Render.setZoom(1.35); });
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/builds_night.png' });
await page.evaluate(() => { S.time = 60; Render.setZoom(null); });
await page.waitForTimeout(400);
// the certificate of passage
await page.evaluate(() => { UI2.showDeath({ name: S.pName || 'Lorn Miles', cls: 'Courier', cause: 'the Silt', seed: 12345, stats: { deliveries: 23, km: 41300, likes: 412, bornAt: Date.now() - 3600000 }, wraith: false }); });
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/builds_cert.png' });
await page.evaluate(() => { document.getElementById('deathOv').classList.add('hidden'); });
// the service record
await page.keyboard.press('k'); await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/builds_svc.png', clip: { x: 250, y: 40, width: 940, height: 480 } });
console.log('done');
await b.close();
