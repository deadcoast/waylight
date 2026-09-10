/* v320shot.mjs — evidence: the tier ladder in the paint, the donkey caravan on the road,
   the forrester changing the map, the earn feed landing its chips. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => { for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); S.flags.guideDone = true; S.weather.state = 'clear'; S.weather.t = 99999; WL.calm(); S.time = 30; State.refreshSources(true); S.banked.provisions = 90; });
const settle = async () => { await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 3 && Math.abs(Render.cam.y - S.py) < 3, null, { timeout: 15000 }); await page.waitForTimeout(300); };
const clipAt = (wu, hu, lift = 10) => page.evaluate(([wu2, hu2, l2]) => { const z = Render.effZoom(), cv = document.getElementById('game'), r = cv.getBoundingClientRect(); return { x: r.x + r.width / 2 - wu2 * z / 2, y: r.y + r.height / 2 - hu2 * z / 2 - l2 * z, width: wu2 * z, height: hu2 * z }; }, [wu, hu, lift]);

/* A — the tier ladder written in the ground: trail → plates → cobbles → planks */
await ev(() => {
  const d = DATA.stations.haven;
  const y0 = d.y - 340, x0 = d.x - 760;
  for (let x = 0; x < 560; x += 6) for (let o = -22; o <= 22; o += 5) for (let k = 0; k < 90; k++) World.addWear(x0 + x, y0 + o, 3);
  for (let cx2 = x0 + 150; cx2 <= x0 + 250; cx2 += 20) World.layPave(cx2, y0, 30, 1);
  for (let cx2 = x0 + 280; cx2 <= x0 + 380; cx2 += 20) { World.layPave(cx2, y0, 30, 1); World.layPave(cx2, y0, 30, 2); }
  for (let cx2 = x0 + 410; cx2 <= x0 + 520; cx2 += 20) { World.layPave(cx2, y0, 30, 1); World.layPave(cx2, y0, 30, 2); World.layPave(cx2, y0, 30, 3); }
  WL.tp([x0 + 250, y0 + 6]); S.moveTo = null; S.dir = 0; S.cargo = [];
  Render.setZoom(2.2);
});
await settle();
await ev(() => { document.getElementById('toasts').innerHTML = ''; });
await page.screenshot({ path: '/tmp/v320_tiers.png', clip: await clipAt(560, 200, 0) });

/* B — the donkey caravan, freight on foot */
await ev(() => {
  S.stations.elm.connected = true;
  const H = NPC.gen({ at: 'haven' }); H.feeWaived = true; H.skills.haul = 9; H.skills.foot = 5; S.npcs.push(H);
  NPC.assignField(H, 'haven', 'hauler', 'elm');
  H.fpath = { t: S.time + 9999, pts: [[S.px - 60, S.py + 14], [S.px + 85, S.py + 14]] };
  H.fseg = 1; H.fdirn = 1; H.fx = S.px - 40; H.fy = S.py + 14; H.fmoving = true; H.fdir = 0;
  document.getElementById('toasts').innerHTML = '';
  window._H = H.id;
});
await page.waitForTimeout(500);
await ev(() => { document.getElementById('toasts').innerHTML = ''; });
await page.screenshot({ path: '/tmp/v320_caravan.png', clip: await clipAt(230, 130, 8) });

/* C — the forrester: the woods become clearings, stump by stump */
await ev(() => {
  let home = null, spot = null;
  for (const id of DATA.stationOrder) { spot = World.nearestForest(DATA.stations[id].x, DATA.stations[id].y, 900); if (spot) { home = id; break; } }
  // a worked clearing behind them
  World.fellAt(spot.x, spot.y); World.fellAt(spot.x - 12, spot.y + 4); World.fellAt(spot.x + 10, spot.y - 8); World.fellAt(spot.x - 4, spot.y - 12);
  const next = World.nearestForest(spot.x, spot.y, 300) || spot;
  const F = NPC.gen({ at: home }); F.feeWaived = true; S.npcs.push(F);
  NPC.assignField(F, home, 'forrester');
  F.fx = next.x - 8; F.fy = next.y; F.fwork = 1; F.fmoving = false; F.ftarget = next;
  WL.tp([next.x - 40, next.y + 30]); S.moveTo = null;
  Render.setZoom(2.6);
});
await settle();
await ev(() => { document.getElementById('toasts').innerHTML = ''; });
await page.screenshot({ path: '/tmp/v320_forrester.png', clip: await clipAt(230, 140, 14) });

/* D — the earn feed: every coin SEEN landing */
await ev(async () => {
  document.getElementById('earnFeed').innerHTML = '';
  State.grantLikes(24);
  Economy.addAppr('haven', 4);
  State.bank('wood', 6);
  await new Promise(res => setTimeout(res, 500));
});
await page.screenshot({ path: '/tmp/v320_earnfeed.png', clip: { x: 1080, y: 0, width: 360, height: 300 } });

console.log('shots done');
await b.close();
