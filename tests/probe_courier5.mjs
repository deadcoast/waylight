/* probe_courier5 — v3.50: the courier in a hall, on the wire, and on paper (enlistment, the tailor, the doll, a plate) */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message) + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300); await page.click('#btnBegin'); await page.waitForTimeout(400); await page.click('#briefGo'); await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/cs5_enlist.png' });
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
const ev = (fn, a) => page.evaluate(fn, a);
await ev(() => { S.flags.guideDone = true; WL.calm(); Render.setFx(false); });
// the hall
await ev(() => { Republic.enterRoom('farkeep_hall'); }); await page.waitForTimeout(900);
await page.screenshot({ path: 'shots/cs5_hall.png' });
await ev(() => { S.room = null; });
// the wire
await ev(() => { const H = DATA.stations.haven; WL.tp([H.x + 520, H.y + 260]); S.weather.state = 'clear'; Render.setZoomStep(3); WL.timeScale = 0.001; S.state = 'zip'; S.zip = { x0: S.px, y0: S.py, x1: S.px + 600, y1: S.py, t: 0, dur: 1e9 }; Render.cam.x = S.px; Render.cam.y = S.py - 30; });
await page.waitForTimeout(500);
const p = await ev(() => { const w = Render.cam, z = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (S.px - w.x) * z, y: innerHeight / 2 + (S.py - w.y) * z }; });
await page.screenshot({ path: 'shots/cs5_zip.png', clip: { x: Math.round(p.x - 130), y: Math.round(p.y - 200), width: 260, height: 260 } });
await ev(() => { S.state = 'walk'; S.zip = null; WL.timeScale = 1; });
// the tailor, the doll
await ev(() => UI2.openTailor()); await page.waitForTimeout(400); await page.screenshot({ path: 'shots/cs5_tailor.png' }); await ev(() => document.getElementById('tailorOv').classList.add('hidden'));
await ev(() => UI2.toggleSkills(true)); await page.waitForTimeout(400); await page.screenshot({ path: 'shots/cs5_doll.png' }); await ev(() => UI2.toggleSkills(false));
console.log('ERRORS', errors.length, errors.slice(0, 4).join(' | '));
await b.close();
