/* v318shot.mjs — evidence for v3.18 THE SHAPES OF WORK */
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
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  for (const id of DATA.stationOrder) S.stations[id].met = true;
  S.flags.guideDone = true; S.orders.prioIdx = 99;
  S.stations.haven.stars = 3;
  S.stations.elm.connected = true; S.stations.mill.connected = true; S.stations.green.connected = true;
  S.stations.elm.stock.tools = 20; S.stations.mill.stock.textiles = 20; S.stations.quarry.stock.textiles = 20;
  S.stations.haven.stock.food = 14;   // haven's own shortage → a salvage run posts here too
  S.flags.unlocks.shapes = true;
});
/* 1. the board: all three shapes posted at Haven */
await page.evaluate(() => { UI.openStation('haven'); UI.gotoTab('orders'); });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/v318_board.png', clip: { x: 290, y: 140, width: 870, height: 660 } });
await page.evaluate(() => document.getElementById('stationClose').click());
/* 2. the convoy walker on the road behind the player, crates aboard */
await page.evaluate(() => {
  document.getElementById('guide').style.display = 'none';
  document.getElementById('toasts').style.display = 'none';
  const cv = Economy.ordersFor('haven').find(o => o.convoy);
  if (cv) Systems.acceptOrder(cv, false);
  const d = DATA.stations.haven;
  WL.tp([d.x - 260, d.y - 120]); S.moveTo = null;
  if (S.convoy) { S.convoy.x = S.px + 60; S.convoy.y = S.py + 34; }
  Render.setZoom(2.2);
});
await page.evaluate(() => new Promise(res => { let i = 0; const iv = setInterval(() => { Systems.update(0.05, { left: true }); if (++i > 10) { clearInterval(iv); res(); } }, 50); }));
await page.waitForTimeout(250);
await page.screenshot({ path: '/tmp/v318_convoy.png', clip: { x: 470, y: 210, width: 520, height: 380 } });
/* 3. the salvage card, on the board of the town that is short */
await page.evaluate(() => {
  document.getElementById('hud').style.display = '';
  window._svAt = Economy.ordersFor('haven').some(o => o.salvage) ? 'haven' : 'foundry';
  S.stations[window._svAt].connected = true; S.stations[window._svAt].litT = 1;
  UI.openStation(window._svAt); UI.gotoTab('orders');
});
await page.waitForTimeout(500);
const svClip = await page.evaluate(() => {
  const el = [...document.querySelectorAll('.orderCard')].find(c => /SALVAGE/.test(c.textContent));
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: Math.max(0, r.x - 8), y: Math.max(0, r.y - 8), width: Math.min(900, r.width + 16), height: Math.min(400, r.height + 16) };
});
if (svClip) await page.screenshot({ path: '/tmp/v318_salvage_card.png', clip: svClip });
/* 4. the wreck out in the deep grey — midday, a recovery lamp burning the mist off it */
await page.evaluate(() => {
  document.getElementById('stationClose').click();
  document.getElementById('hud').style.display = 'none';
  S.wraiths = [];
  S.time = DATA.T.dayLen * 0.3;   // midday — the grey is still the grey, but the sun helps the camera
  const sv = Economy.ordersFor(window._svAt).find(o => o.salvage);
  if (sv) {
    const o = Systems.acceptOrder(sv, false);
    S.structures.push({ id: U.uid(), type: 'generator', x: o.site.x + 60, y: o.site.y + 26, ang: 0, hp: 100 });
    State.refreshSources(true);
    WL.tp([o.site.x + 6, o.site.y + 40]); S.moveTo = null;
    Render.setZoom(2.2);
  }
});
await page.waitForFunction(() => {   // the camera glides after a teleport — wait for it to settle on the walker
  const c = Render.cam;
  return Math.abs(c.x - S.px) < 4 && Math.abs(c.y - S.py) < 4;
}, null, { timeout: 15000 });
await page.waitForTimeout(400);
const wkClip = await page.evaluate(() => {
  const o = S.orders.active.find(x => x.salvage);
  if (!o) return null;
  const c = Render.cam, z = Render.effZoom();
  const sx = (o.site.x - c.x) * z + innerWidth / 2, sy = (o.site.y - c.y) * z + innerHeight / 2;
  return { x: Math.max(0, sx - 260), y: Math.max(0, sy - 150), width: 540, height: 400 };
});
await page.screenshot({ path: '/tmp/v318_wreck.png', clip: wkClip || { x: 460, y: 170, width: 540, height: 420 } });
console.log('shots saved');
await b.close();
