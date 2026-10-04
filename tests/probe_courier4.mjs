/* probe_courier4 — v3.50: people side by side at the courier's scale: the Walker, two hands, a Farkeeper of each class, a
   camp's chief, the town's own; at the play camera and near; the roll and the wedge card. Writes shots/cs4_*.png. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message) + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300); await page.click('#btnBegin'); await page.waitForTimeout(400); await page.click('#briefGo'); await page.waitForTimeout(300); await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
const ev = (fn, a) => page.evaluate(fn, a);
await ev(() => { WL.timeScale = 0.001; S.flags.guideDone = true; WL.calm(); Render.setFx(false); const H = DATA.stations.haven; WL.tp([H.x + 520, H.y + 260]); S.weather.state = 'clear'; const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3; Render.faceWalker('S');
  const mk = (dx, fk, cls) => { const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.state = 'companion'; if (fk) { n.fk = true; n.fkCls = cls; } n.cx = S.px + dx; n.cy = S.py + 4; n._px = n.cx; n._py = n.cy; n._dir = Math.PI / 2; return n; };
  mk(-70); mk(-38); mk(44, true, 'pugugly'); mk(84, true, 'longbowmen'); mk(120, true, 'berserker'); mk(154, true, 'rifle_rider'); mk(188, true, 'recon_rider');
  for (const n of NPC.party()) n.follow = false; });
await page.waitForTimeout(500);
const pos = () => ev(() => { const w = Render.cam, z = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (S.px - w.x) * z, y: innerHeight / 2 + (S.py - w.y) * z }; });
await ev(() => { Render.setZoomStep(2); WL.timeScale = 0.001; Render.cam.x = S.px + 60; Render.cam.y = S.py - 20; for (const n of NPC.party()) { n._px = n.cx; n._py = n.cy; } }); await page.waitForTimeout(400);
let p = await pos(); await page.screenshot({ path: 'shots/cs4_people.png', clip: { x: Math.round(p.x - 180), y: Math.round(p.y - 160), width: 760, height: 230 } });
await ev(() => { Render.setZoomStep(0); Render.cam.x = S.px + 60; Render.cam.y = S.py - 20; }); await page.waitForTimeout(400);
p = await pos(); await page.screenshot({ path: 'shots/cs4_people_play.png', clip: { x: Math.round(p.x - 150), y: Math.round(p.y - 110), width: 520, height: 170 } });
await ev(() => { WL.timeScale = 1; });
// the roll and the wedge card
await ev(() => { if (typeof UI !== 'undefined' && UI.openMuster) UI.openMuster(); else if (typeof MusterUI !== 'undefined' && MusterUI.open) MusterUI.open(); });
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/cs4_roll.png' });
console.log('ERRORS', errors.length, errors.slice(0, 4).join(' | '));
await b.close();
