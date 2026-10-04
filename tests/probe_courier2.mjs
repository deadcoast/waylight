/* probe_courier2 — v3.50: the courier at the play camera's level with the crew around, walking; and the walk strip */
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
await ev(() => { S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9; Render.setFx(false); for (let i = 0; i < 3; i++) { const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); } });
// hire three into the party the way the muster does
await ev(() => { for (const n of S.npcs.slice(-3)) { n.state = 'companion'; n.cx = S.px; n.cy = S.py; } });
await ev(() => { WL.tp('haven'); S.px += 120; S.py += 140; for (const n of NPC.party()) { n.cx = S.px - 20; n.cy = S.py + 10; } S.time = Math.floor(S.time / DATA.T.dayLen) * DATA.T.dayLen + DATA.T.dayLen * 0.3; Render.setZoomStep(0); for (const id of ['meds', 'food']) S.cargo.push(State.makeItem(id)); });
await page.waitForTimeout(800);
// walk east a little so the crew falls in and turns
const walk = async (dx, dy, ms) => { await ev(([dx, dy]) => Systems.moveTo(S.px + dx, S.py + dy), [dx, dy]); await page.waitForTimeout(ms); };
await walk(260, 0, 1600);
const p = await ev(() => { const w = Render.cam, z = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (S.px - w.x) * z, y: innerHeight / 2 + (S.py - w.y) * z, z }; });
await page.screenshot({ path: 'shots/cs_play_walk.png', clip: { x: Math.round(p.x - 300), y: Math.round(p.y - 200), width: 600, height: 330 } });
await walk(0, 260, 1500);
await page.screenshot({ path: 'shots/cs_play_south.png', clip: { x: Math.round(p.x - 300), y: Math.round(p.y - 200), width: 600, height: 330 } });
await walk(0, -260, 1500);
await page.screenshot({ path: 'shots/cs_play_north.png', clip: { x: Math.round(p.x - 300), y: Math.round(p.y - 200), width: 600, height: 330 } });
// the walk strip at the nearest level: eight shots a tenth of a second apart
await ev(() => Render.setZoomStep(3)); await page.waitForTimeout(300);
await ev(() => Systems.moveTo(S.px + 900, S.py)); await page.waitForTimeout(500);
for (let i = 0; i < 8; i++) {
  const q = await ev(() => { const w = Render.cam, z = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (S.px - w.x) * z, y: innerHeight / 2 + (S.py - w.y) * z, d: Render.walkerDrawn().frame }; });
  await page.screenshot({ path: `shots/cs_strip_${i}.png`, clip: { x: Math.round(q.x - 90), y: Math.round(q.y - 150), width: 180, height: 190 } });
  console.log(i, q.d);
  await page.waitForTimeout(90);
}
console.log('p', JSON.stringify(p), 'party', await ev(() => NPC.party().length));
console.log('ERRORS', errors.length, errors.slice(0, 4).join(' | '));
await b.close();
