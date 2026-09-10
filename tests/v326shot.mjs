/* v326shot.mjs — evidence: THE DARKLANDS briefing table (established · turned · leaned-in), the padded globe. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(200);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
const ev = fn => page.evaluate(fn);
await ev(() => {
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine(); S.flags.guideDone = true; WL.calm();
  // a world with miles on it: light grown, roads laid, a camp quieted, a party walking
  S.cov = 0.34; setInterval(() => { S.cov = Math.max(S.cov, 0.34); }, 200); S.likes = 212; S.stats.delivered = 47;
  for (const id of ['elm', 'mill', 'quarry', 'green']) S.stations[id].connected = true;
  const r0 = DATA.roads[0]; for (let i = 0; i < Math.min(9, r0.segs); i++) S.roads[r0.id][i] = true;
  S.camps[DATA.camps[0].id].pacified = true;
  S.banked.metal = 500; S.banked.ceramic = 300;
  for (let i = 0; i < 2; i++) S.npcs.push(NPC.gen({ at: 'haven' }));
  for (const n of S.npcs.filter(x => x.state === 'pool' && x.at === 'haven').slice(0, 2)) NPC.hire(n, 'companion');
});
await ev(() => { const a = document.getElementById('announce'); if (a) a.classList.remove('slam'); document.getElementById('toasts').innerHTML = ''; });
await page.keyboard.press('KeyM'); await page.waitForTimeout(300);
await page.click('#btnViewCont'); await page.waitForTimeout(1100);
await page.screenshot({ path: '/tmp/v326_table.png' });
// turned by the hand
await ev(() => { Continent._st.yaw = 0.34; Continent._st.vel = 0; });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/v326_turned.png' });
// leaned in on the subject
await ev(() => { Continent._st.yaw = -0.1; Continent._st.zoom = 1.62; });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/v326_leanin.png' });
// the padded globe, demoted
await page.click('#btnViewWorld'); await page.waitForTimeout(1000);
await page.screenshot({ path: '/tmp/v326_globe.png' });
console.log('v326 shots done');
await b.close();
