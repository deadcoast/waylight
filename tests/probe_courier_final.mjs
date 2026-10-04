/* probe_courier_final — v3.50: the courier set in the valley, for the eye: the four sides, a stride, a load, the people
   side by side, the ride, the wire, the lamp at night. Writes shots/cf_*.png (the montage is composed from them). */
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
/* drain the first announcements so no banner lies over a frame */
for (let i = 0; i < 80; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); }
await ev(() => { document.getElementById('toasts').style.display = 'none'; });
const stage = async (dx, dy, step, frac = 0.3) => {
  await ev(([dx, dy, step, frac]) => { const H = DATA.stations.haven; S.moveTo = null; S.route = []; S.speed = 0; WL.tp([H.x + dx, H.y + dy]); S.nodes = S.nodes.filter(n => Math.hypot(n.x - S.px, n.y - S.py) > 260); S.drops = S.drops.filter(d => Math.hypot(d.x - S.px, d.y - S.py) > 260); S.weather.state = 'clear';   /* nothing to pick up in frame: no [E] cap over the figure */ const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * frac; Render.setZoomStep(step); WL.timeScale = 1; S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true; }, [dx, dy, step, frac]);
  await page.waitForTimeout(350);   // the prompts read the new ground before the clock is held
  await ev(() => { WL.timeScale = 0.001; S.moveTo = null; S.speed = 0; Render.cam.x = S.px; Render.cam.y = S.py - 30; });
};
const at = () => ev(() => { const w = Render.cam, z = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (S.px - w.x) * z, y: innerHeight / 2 + (S.py - w.y) * z }; });
const shot = async (name, w, h, up) => { const p = await at(); await page.screenshot({ path: `shots/cf_${name}.png`, clip: { x: Math.round(p.x - w / 2), y: Math.round(p.y - up), width: w, height: h } }); };
await stage(-450, -100, 3);
console.log('prompts', JSON.stringify(await ev(() => UI.prompts.map(p => p.key + ' ' + p.label))));
for (const fc of ['S', 'E', 'N', 'W']) { await ev(fc => Render.faceWalker(fc), fc); await page.waitForTimeout(200); await shot('side_' + fc, 150, 190, 160); }
/* a stride: the walk at normal time, four frames as they come */
await ev(() => { WL.timeScale = 1; Systems.moveTo(S.px + 700, S.py); }); await page.waitForTimeout(400);
const got = {};
for (let i = 0; i < 60 && Object.keys(got).length < 4; i++) { const f = await ev(() => { Render.cam.x = S.px; Render.cam.y = S.py - 30; return Render.walkerDrawn().frame; }); if (/walk/.test(f) && !got[f]) { got[f] = 1; await shot('stride_' + f, 150, 190, 160); } await page.waitForTimeout(35); }
await ev(() => { S.moveTo = null; S.route = []; S.speed = 0; }); await page.waitForTimeout(300);
/* a load */
await stage(-450, -100, 3); await ev(() => { S.cargo.length = 0; for (const id of ['meds', 'food', 'textiles']) S.cargo.push(State.makeItem(id)); S.equip.pack = State.makeItem('pack_rig'); });
for (const fc of ['S', 'E', 'N']) { await ev(fc => Render.faceWalker(fc), fc); await page.waitForTimeout(200); await shot('load_' + fc, 170, 280, 250); }
await ev(() => { S.cargo.length = 0; S.equip.pack = State.makeItem('pack0'); });
/* the people side by side */
await stage(-600, -100, 2); await ev(() => { Render.faceWalker('S');
  const mk = (dx, fk, cls) => { const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.state = 'companion'; if (fk) { n.fk = true; n.fkCls = cls; } n.cx = S.px + dx; n.cy = S.py + 4; n._px = n.cx; n._py = n.cy; n._dir = Math.PI / 2; return n; };
  mk(-64); mk(-32); mk(44, true, 'pugugly'); mk(84, true, 'longbowmen'); mk(120, true, 'berserker'); mk(154, true, 'rifle_rider'); mk(188, true, 'recon_rider'); Render.cam.x = S.px + 60; });
await page.waitForTimeout(300);
{ const p = await at(); await page.screenshot({ path: 'shots/cf_people.png', clip: { x: Math.round(p.x - 180), y: Math.round(p.y - 150), width: 620, height: 175 } }); }   // the first hand whole in the frame
await ev(() => { S.npcs = S.npcs.filter(n => n.state !== 'companion'); });
/* the ride */
await stage(-450, -250, 3); await ev(() => { S.horse = { breed: 'fjord', on: true }; Systems.horseOn = () => true; S.dir = 0; Render.faceWalker('E'); }); await page.waitForTimeout(250);
await shot('ride', 300, 250, 200);
await ev(() => { Systems.horseOn = () => false; S.horse = null; });
/* the wire */
await stage(300, -100, 3); await ev(() => { S.state = 'zip'; S.zip = { x0: S.px, y0: S.py, x1: S.px + 600, y1: S.py, t: 0, dur: 1e9 }; }); await page.waitForTimeout(250);
await shot('zip', 170, 240, 170);
await ev(() => { S.state = 'walk'; S.zip = null; });
/* the lamp at night */
await stage(1500, 900, 3, 0.86); await ev(() => Render.faceWalker('E')); await page.waitForTimeout(300);
await shot('night', 170, 200, 170);
console.log('strides', Object.keys(got).join(','), 'ERRORS', errors.length, errors.slice(0, 3).join(' | '));
await b.close();
