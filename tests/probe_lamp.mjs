/* probe_lamp — v3.45 the lamp law: the Walker at night with the lamp in hand (facing each way), and with the kin's
   lantern lit on the pack — the corona behind, the glass glinting, the coat's own texels kept. */
import { chromium } from 'playwright';
const tag = process.argv[2] || 'lp';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(400);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true; });
const clean = () => page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; S.wraiths.length = 0; S.struggle = null; Render.clearFx && Render.clearFx(); });
const stage = (dir, lantern) => page.evaluate(([dir, lantern]) => {
  const d = DATA.stations.haven, T2 = DATA.T; WL.timeScale = 1;
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.85;
  WL.tp([d.x + 1700, d.y - 1300]); S.dir = dir; S.room = null; S.scar = null; S.arrow = null;
  S.cargo = S.cargo.filter(c => c.defId !== 'kinLantern');
  if (lantern) S.cargo.push({ ...DATA.items.kinLantern, defId: 'kinLantern', lit: true, kin: true });
  Systems.update(0.05, {}); UI.tick && UI.tick();
  Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 14; WL.timeScale = 0.001;
}, [dir, lantern]);
for (const [name, dir, lantern] of [['r', 0, false], ['l', Math.PI, false], ['kin', Math.PI, true], ['kinr', 0, true]]) {
  await stage(dir, lantern); await page.waitForTimeout(450); await clean(); await page.waitForTimeout(120);
  if (process.env.PQ) console.log(name, await page.evaluate(() => JSON.stringify((UI.prompts || []).map(p => [p.key, p.label]))));
  await page.screenshot({ path: `shots/${tag}_${name}.png`, clip: { x: 720 - 120, y: 430 - 110, width: 240, height: 180 } });
}
/* the crowded strip: two cairns on one bearing and a ruin beside — one label, one bare pin, nothing overlapping */
await page.evaluate(() => {
  WL.timeScale = 1; Render.setZoom(null); const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  const d = DATA.stations.haven; WL.tp([d.x + 1700, d.y - 1300]); S.dir = -Math.PI / 2; S.cargo = S.cargo.filter(c => c.defId !== 'kinLantern');
  const bx = S.px + Math.cos(S.dir) * 900, by = S.py + Math.sin(S.dir) * 900;
  S.graves = [{ id: 'g1', x: bx, y: by, name: 'A', wraith: false, items: [], ph: 0 }, { id: 'g2', x: bx + 60, y: by - 400, name: 'B', wraith: true, items: [], ph: 0 }];
  Systems.update(0.05, {}); for (let i = 0; i < 120; i++) UI.tick();
});
await page.waitForTimeout(400);
console.log(await page.evaluate(() => [...document.querySelectorAll('#compassInner .cMark')].map(m => `${m.className.trim()}|${m.title}|${m.textContent.trim()}`).join('  ##  ')));
{ const c = await page.evaluate(() => { const r = document.getElementById('compass').getBoundingClientRect(); return { x: r.x - 6, y: Math.max(0, r.y - 6), width: r.width + 12, height: r.height + 12 }; }); await page.screenshot({ path: 'shots/kp_strip.png', clip: c }); }
console.log('lamp frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
