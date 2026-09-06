/* lightshots.mjs — before/after evidence of the dark→light contrast */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.weather.intensity = 0; S.time = 60; });
const settle = async () => { await page.waitForTimeout(600); };

// 1. day, standing in Haven's light
await page.evaluate(() => { WL.tp('haven'); S.px += 340; S.py -= 60; });
await settle(); await page.screenshot({ path: '/tmp/light_lit_day.png' });
// 2. day, the grey — same latitude, no light
await page.evaluate(() => { WL.tp([6600, 10100]); });
await settle(); await page.screenshot({ path: '/tmp/light_unlit_day.png' });
// 3. the boundary — Haven's light edge
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + d.baseR * 0.72, d.y - 200]); });
await settle(); await page.screenshot({ path: '/tmp/light_boundary.png' });
// 4. map at the start (~2% coverage)
await page.keyboard.press('m'); await settle(); await page.screenshot({ path: '/tmp/light_map_before.png' });
await page.keyboard.press('m'); await page.waitForTimeout(200);
// 5. connect four stations, map again
await page.evaluate(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry']) { const st = S.stations[id]; st.connected = true; st.met = true; st.litT = 1; st.stars = 2; }
  State.refreshSources(); World.rebuildLight(); S.cov = World.coverage();
});
await page.evaluate(() => { WL.tp('haven'); S.px += 340; S.py -= 60; });
await page.keyboard.press('m'); await settle(); await page.screenshot({ path: '/tmp/light_map_after.png' });
await page.keyboard.press('m'); await page.waitForTimeout(200);
// 6. night at the boundary: lit ground vs the dark
await page.evaluate(() => { S.time = DATA.T.dayLen * 0.78; });
await settle(); await page.screenshot({ path: '/tmp/light_night.png' });
// 7. night in the deep grey for the counter-shot
await page.evaluate(() => { WL.tp([6600, 10100]); });
await settle(); await page.screenshot({ path: '/tmp/light_night_unlit.png' });
console.log('coverage:', await page.evaluate(() => Math.round(S.cov * 100) + '%'));
await b.close();
