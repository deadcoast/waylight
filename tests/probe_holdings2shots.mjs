/* probe_holdings2shots — v3.39 evidence: a garrisoned town's square (two shields under the grey pennant,
   the plate), a watchpost standing four shields, a post that fell (the pennant in the ring), and the
   banner sheet with THE STORMING beside the quell, GARRISONED with RELEASE, STAND THE POST, the
   season's warning, a larder RAIDED. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
const clean = () => page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; S.wraiths.length = 0; S.struggle = null; });
const drain = async () => { for (let i = 0; i < 40; i++) { const on = await page.evaluate(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); } };

await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 80;
  for (const id of ['elm', 'mill', 'green', 'quarry']) S.stations[id].connected = true;
  for (const k of Object.keys(REP.EVENTS)) S.rep && (S.rep.evCd = S.rep.evCd || {}); Republic.tick(0.01); for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  Republic.fundMountain(); Republic.mountain().t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
  /* the mill risen and STORMED */
  Republic.rebellionStrike('mill'); S.stations.mill.likesTo = 55;
  Republic.fundStorm('mill'); let q = Republic.quell(); const mr = Math.random; Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02);
  /* the pass camp taken and stood at four shields; the second camp taken and FALLEN */
  Republic.fundTake(DATA.camps[0].id); q = Republic.quell(); q.t = q.dur + 1; Republic.tick(0.02);
  S.camps[DATA.camps[0].id].taken.shields = 4;
  Republic.fundTake(DATA.camps[1].id); q = Republic.quell(); q.t = q.dur + 1; Republic.tick(0.02);
  Math.random = () => 0.1; Republic.stormPost(DATA.camps[1]); Math.random = mr;
  /* a larder raided */
  const larder = Republic.sites('hollowfire')[0]; Republic.fireEvent('larderRaid', { site: larder, camp: DATA.camps[2] });
  document.getElementById('toasts').innerHTML = '';
});
await drain();
/* the garrisoned square */
await page.evaluate(() => { const d = DATA.stations.mill; WL.tp([d.x - 10, d.y + 150]); S.dir = -Math.PI / 2; });
await clean(); await page.waitForTimeout(1800); await clean(); await drain();
await page.screenshot({ path: 'shots/h2_garrison.png', clip: { x: 720 - 330, y: 430 - 300, width: 660, height: 420 } });
/* four shields at the post */
await page.evaluate(() => { const cd = DATA.camps[0]; WL.tp([cd.x + 10, cd.y + 130]); S.dir = -Math.PI / 2; });
await clean(); await page.waitForTimeout(1800); await clean(); await drain();
await page.screenshot({ path: 'shots/h2_post4.png', clip: { x: 720 - 330, y: 430 - 300, width: 660, height: 420 } });
/* the post that fell */
await page.evaluate(() => { const cd = DATA.camps[1]; WL.tp([cd.x - 20, cd.y + 150]); S.dir = -Math.PI / 2; S.camps[cd.id].runners = []; });
await clean(); await page.waitForTimeout(1800); await clean(); await drain();
await page.screenshot({ path: 'shots/h2_fell.png', clip: { x: 720 - 330, y: 430 - 300, width: 660, height: 420 } });
/* the banner sheet */
await page.evaluate(() => { Republic.rebellionStrike('green'); });
await page.waitForTimeout(300); await drain(); await clean();
await page.evaluate(() => { RepublicUI.open(); const el = document.querySelector('#republicOv .sheetBody'); if (el) el.scrollTop = 0; });
await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/h2_sheet.png' });
await page.evaluate(() => { const el = document.querySelector('#republicOv .sheetBody'); if (el) el.scrollTop = 620; });
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/h2_sheet_posts.png' });
await page.evaluate(() => RepublicUI.close());
console.log('losable-holdings frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
