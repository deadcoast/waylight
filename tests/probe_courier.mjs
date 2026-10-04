/* probe_courier — v3.50: the courier set in the valley. Frames of the Walker in every facing and step, loaded, at night
   with the lantern, with the crew; writes shots/cs_*.png. Scratch evidence for the eye (the suite asserts). */
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
await ev(() => { S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9; Render.setFx(false); UI.announce && (UI.announce = () => {}); });
const shot = async (name, clipW = 260, clipH = 220, dyUp = 40) => {
  const p = await ev(() => { const w = Render.cam, z = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (S.px - w.x) * z, y: innerHeight / 2 + (S.py - w.y) * z }; });
  await page.screenshot({ path: `shots/cs_${name}.png`, clip: { x: Math.round(p.x - clipW / 2), y: Math.round(p.y - clipH / 2 - dyUp), width: clipW, height: clipH } });
};
await ev(() => { WL.tp('haven'); S.px += 160; S.py += 120; S.time = Math.floor(S.time / DATA.T.dayLen) * DATA.T.dayLen + DATA.T.dayLen * 0.3; Render.setZoomStep(3); });
await page.waitForTimeout(600);
for (const fc of ['S', 'E', 'N', 'W']) {
  await ev(fc => { Render.faceWalker(fc); S.speed = 0; }, fc); await page.waitForTimeout(250);
  await shot('idle_' + fc);
}
// loaded: three crates, a small, a tool
await ev(() => { for (const id of ['meds', 'food', 'textiles']) S.cargo.push(State.makeItem(id)); S.cargo.push(State.makeItem('letters')); WL.tool('ladderTool'); });
for (const fc of ['S', 'E', 'N']) { await ev(fc => { Render.faceWalker(fc); }, fc); await page.waitForTimeout(250); await shot('load_' + fc, 260, 280, 70); }
console.log('drawn', JSON.stringify(await ev(() => Render.walkerDrawn())));
// night, the lantern
await ev(() => { S.time = Math.floor(S.time / DATA.T.dayLen) * DATA.T.dayLen + DATA.T.dayLen * 0.85; S.px += 900; });
await page.waitForTimeout(600);
for (const fc of ['S', 'E', 'N']) { await ev(fc => { Render.faceWalker(fc); }, fc); await page.waitForTimeout(250); await shot('night_' + fc, 260, 280, 70); }
console.log('ERRORS', errors.length, errors.slice(0, 4).join(' | '));
await b.close();
