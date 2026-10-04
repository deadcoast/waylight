/* probe_player49 — the player's own page (no debug flag): boots, walks on WASD, the wheel zooms, no page errors */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/waylight.html', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#btnNew', { state: 'visible', timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300); await page.click('#btnBegin'); await page.waitForTimeout(400);
for (let i = 0; i < 60; i++) {   // the player's way in: whatever stands in front — the briefing, the new character, a scene — answered as a player answers it
  const v = await page.evaluate(() => { const vis = id => { const el = document.getElementById(id); return !!el && el.offsetParent !== null; }; return { begin: vis('btnBegin'), brief: vis('briefGo'), cg: vis('cgBegin'), playing: typeof S !== 'undefined' && S && !S.cine && document.getElementById('hud') && !document.getElementById('hud').classList.contains('hidden') }; });
  if (v.begin) await page.click('#btnBegin'); else if (v.brief) await page.click('#briefGo'); else if (v.cg) await page.click('#cgBegin'); else if (v.playing) break; else await page.keyboard.press('Space');
  await page.waitForTimeout(400);
}
for (let i = 0; i < 20; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.keyboard.press('Space'); await page.waitForTimeout(400); }
const debug = await page.evaluate(() => typeof window.WL !== 'undefined');
const p0 = await page.evaluate(() => [S.px, S.py]);
await page.mouse.move(720, 430);
await page.keyboard.down('KeyD'); await page.waitForTimeout(900); await page.keyboard.up('KeyD');
const p1 = await page.evaluate(() => [S.px, S.py]);
await page.mouse.wheel(0, -120); await page.waitForTimeout(1600);
const z = await page.evaluate(() => ({ step: Render.zoomStepOf(), z: Render.zoomLevel(), law: Render.texelLaw() }));
await page.mouse.wheel(0, 120); await page.waitForTimeout(400);
console.log(JSON.stringify({ debug, moved: Math.round(p1[0] - p0[0]), z }), 'ERRORS', errors.length, errors.slice(0, 3).join(' | '));
await b.close();
