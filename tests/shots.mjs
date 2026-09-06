/* shots.mjs — screenshots of the redesigned board, tray, results and map for visual QA */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(e.message));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.screenshot({ path: '/tmp/shot_title.png' });
await page.click('#btnNew'); await page.waitForTimeout(150);
await page.screenshot({ path: '/tmp/shot_intro.png' });
await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.screenshot({ path: '/tmp/shot_brief.png' });
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/shot_start.png' });
// a mid-game state: Elm connected, Mill met, some stock moved
await page.evaluate(() => {
  WL.calm(); WL.skipCine && WL.skipCine();
  S.orders.prioIdx = 3; S.orders.prioAccepted = false; S.flags.guideDone = true;
  S.stations.elm.connected = true; S.stations.elm.met = true; S.stations.elm.stars = 2; S.stations.mill.met = true; S.stations.green.met = true;
  S.stations.haven.stock.food = 22; S.stations.haven.stock.meds = 61; S.stations.mill.stock.food = 9; S.stations.elm.stock.meds = 12;
  Economy.update(0.01);
  State.refreshSources && State.refreshSources();
  WL.tp('haven');
});
await page.waitForTimeout(400);
await page.evaluate(() => WL.openStation('haven'));
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/shot_board.png' });
// accept a few and look at the tray in the field
await page.evaluate(() => {
  const board = Systems.boardFor('haven');
  for (const bd of board.slice(0, 3)) Systems.acceptOrder(bd.def, false);
  document.getElementById('stationClose').click();
});
await page.waitForTimeout(300);
await page.evaluate(() => { WL.tp && WL.tp('haven'); S.px += 260; S.py -= 180; });
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/shot_field.png' });
// the map
await page.keyboard.press('m'); await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/shot_map.png' });
await page.keyboard.press('m'); await page.waitForTimeout(200);
// a delivery result at the Mill (food they are out of)
await page.evaluate(() => { WL.tp('mill'); });
await page.waitForTimeout(300);
await page.evaluate(() => WL.openStation('mill'));
await page.waitForTimeout(600);
for (let i = 0; i < 20; i++) { const cine = await page.evaluate(() => !!S.cine); if (!cine) break; await page.evaluate(() => WL.skipCine && WL.skipCine()); await page.waitForTimeout(300); }
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/shot_results.png' });
const vis = await page.evaluate(() => ({ results: !document.getElementById('results').classList.contains('hidden'), station: UI.curStation, cine: !!S.cine }));
console.log('after delivery:', JSON.stringify(vis));
if (vis.results) { await page.click('#resultsClose'); await page.waitForTimeout(400); await page.evaluate(() => WL.openStation('mill')); await page.waitForTimeout(500); await page.screenshot({ path: '/tmp/shot_mill_board.png' }); }
console.log('errors:', errors.length ? errors : 'none');
await b.close();
