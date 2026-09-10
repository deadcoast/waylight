/* probe_manualshots — v3.35 evidence: the manual's four tabs (a cap listening, walked and sealed
   pages under a search, the papers index, the passage with a written code), the pause sheet's new
   rows, the title's three valleys, and the two retired sub-texel rows as glyphs (larder, file). */
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

/* 1 · controls, a cap listening */
await page.evaluate(() => { KEYS.rebind('flare', 'KeyJ'); ManualUI.open('controls'); document.querySelector('#fmBody .fmCap[data-act="rifle"]').click(); });
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/man_controls.png' });
await page.keyboard.press('Escape');
/* 2 · lessons: nine pages walked, the rest sealed; then a search */
await page.evaluate(() => { for (const k of ['firstWobble', 'firstRain', 'firstLadder', 'firstScrap', 'firstZip', 'firstWraith', 'firstKit', 'firstPaver', 'firstBanner']) S.flags.tut[k] = true; ManualUI.open('lessons'); });
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/man_lessons.png' });
await page.fill('#fmSearch', 'light'); await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/man_search.png' });
/* 3 · the papers */
await page.evaluate(() => ManualUI.open('papers'));
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/man_papers.png' });
/* 4 · the passage in play, a code written */
await page.evaluate(async () => { S.pName = 'Tessaly Vane'; State.save(); const code = await State.exportCode(1); await State.importCode(code, 2); ManualUI.open('passage'); });
await page.waitForTimeout(300);
await page.click('#fmExport'); await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/man_passage.png' });
await page.evaluate(() => ManualUI.close());
/* 5 · the pause sheet's new rows */
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/man_pause.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
/* 6 · the larder and the file, in the world */
await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  const s2 = Republic.sites('hollowfire')[0]; WL.tp([s2.x - 40, s2.y + 50]); S.dir = 0;
});
await clean(); await page.waitForTimeout(5200); await clean();
await page.screenshot({ path: 'shots/man_larder.png', clip: { x: 720 - 240, y: 430 - 200, width: 480, height: 320 } });
await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.8;
  S.rep.evt = { t: 0, file: [0, 1, 2, 3].map(i => ({ x: S.px - 60 + i * 34, y: S.py - 70 })), vx: 26, vy: 0, hitCd: 0 };
});
await clean(); await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/man_file.png', clip: { x: 720 - 240, y: 430 - 200, width: 480, height: 320 } });
await page.evaluate(() => { S.rep.evt = null; });
/* 7 · the title's three valleys */
await page.evaluate(() => WL.leaveWorld());
await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/man_title.png' });
console.log('manual frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
