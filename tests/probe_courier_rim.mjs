/* probe_courier_rim — v3.50: the rim at night from every side (the lamp's side keeps its dark outline; the warm light lies
   inside it). Writes shots/cr_night_*.png. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300); await page.click('#btnBegin'); await page.waitForTimeout(400); await page.click('#briefGo'); await page.waitForTimeout(300); await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
const ev = (fn, a) => page.evaluate(fn, a);
await ev(() => { S.flags.guideDone = true; WL.calm(); Render.setFx(false); UI.announce = () => {}; for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999; });
for (let i = 0; i < 80; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); }
await ev(() => { document.getElementById('toasts').style.display = 'none'; });
await ev(() => { const H = DATA.stations.haven; S.moveTo = null; S.route = []; S.speed = 0; WL.tp([H.x + 1500, H.y + 900]); S.weather.state = 'clear'; const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.86; Render.setZoomStep(3); WL.timeScale = 1; S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true; });
await page.waitForTimeout(350);
await ev(() => { WL.timeScale = 0.001; S.moveTo = null; S.speed = 0; Render.cam.x = S.px; Render.cam.y = S.py - 30; });
const at = () => ev(() => { const w = Render.cam, z = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (S.px - w.x) * z, y: innerHeight / 2 + (S.py - w.y) * z }; });
for (const [fc, dir] of [['S', 0.3], ['E', 0], ['N', -0.3], ['W', Math.PI]]) {
  await ev(([fc, dir]) => { S.dir = dir; Render.faceWalker(fc); }, [fc, dir]); await page.waitForTimeout(250);
  const p = await at(); await page.screenshot({ path: `shots/cr_night_${fc}.png`, clip: { x: Math.round(p.x - 75), y: Math.round(p.y - 160), width: 150, height: 190 } });
}
console.log('ERRORS', errors.length, errors.slice(0, 3).join(' | '));
await b.close();
