/* paths.mjs — desire paths and the pixel voice: the ground wears, remembers, and pays back speed. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); });

/* 1. direct wear accumulates on grass and clamps */
let r = await page.evaluate(() => {
  const d = DATA.stations.haven; const x = d.x + 60, y = d.y - 420;
  const w1 = World.addWear(x, y, 3);
  for (let i = 0; i < 200; i++) World.addWear(x, y, 30);
  return { w1, wMax: World.wearAt(x, y) };
});
ok('wear accumulates on meadow and clamps at 255', r.w1 >= 3 && r.wMax === 255, JSON.stringify(r));

/* 2. walking actually wears the ground (systems integration, real movement) */
// find a real meadow lane first — the wear system only takes prints on grass
const lane = await page.evaluate(() => {
  const d = DATA.stations.haven;
  for (let ry = -400; ry > -2400; ry -= 60) for (let rx = -900; rx < 900; rx += 60) {
    const x = d.x + rx, y = d.y + ry;
    let good = true;
    for (let t = 0; t <= 1; t += 0.2) if (World.classAt(x + t * 130, y) !== World.MEADOW) { good = false; break; }
    if (good) return { x, y };
  }
  return null;
});
ok('a meadow lane exists to test on', !!lane, JSON.stringify(lane));
r = await page.evaluate(l => {
  WL.tp([l.x, l.y]); S.moveTo = null;
  return { cls: World.classAt(l.x + 60, l.y), before: World.wearAt(l.x + 60, l.y) };
}, lane);
await page.evaluate(() => { WL.timeScale = 1; });
for (let pass = 0; pass < 6; pass++) {
  await page.evaluate(({ l, pass }) => {
    Systems.moveTo(pass % 2 ? l.x : l.x + 130, l.y, { plain: true });
  }, { l: lane, pass });
  await page.waitForFunction(() => !WL.S.moveTo, null, { timeout: 15000 }).catch(() => {});
}
r.after = await page.evaluate(l => World.wearAt(l.x + 65, l.y), lane);
ok('six real walking passes wear a visible trail (systems, not debug)', r.after >= 12, `class ${r.cls}, wear ${r.before} → ${r.after}`);

/* 3. worn ground repaints the terrain canvas — the pixel actually changes */
r = await page.evaluate(() => {
  const d = DATA.stations.haven; const x = d.x + 200, y = d.y - 900;
  const tx = Math.floor(x / World.TS), ty = Math.floor(y / World.TS);
  const g = World.tc.getContext('2d');
  const before = [...g.getImageData(tx, ty, 1, 1).data];
  for (let i = 0; i < 40; i++) World.addWear(x, y, 30);
  World.flushWear(99);
  const after = [...g.getImageData(tx, ty, 1, 1).data];
  return { before, after, changed: before.join() !== after.join() };
});
ok('a bare path lands in the terrain paint itself', r.changed, `${r.before.slice(0,3)} → ${r.after.slice(0,3)}`);

/* 4. the light field's copy of that ground refreshes too — tested on GREY meadow, strictly */
r = await page.evaluate(() => {
  const d = DATA.stations.haven;
  for (let ry = -600; ry > -3000; ry -= 80) for (let rx = -1200; rx < 1200; rx += 80) {
    const x = d.x + rx, y = d.y + ry;
    if (World.classAt(x, y) === World.MEADOW && World.lightAt(x, y) < 0.18) {
      const tx = Math.floor(x / World.TS), ty = Math.floor(y / World.TS);
      const g = World.lightOv.getContext('2d');
      const before = [...g.getImageData(tx, ty, 2, 2).data];
      for (let i = 0; i < 40; i++) World.addWear(x, y, 30);
      World.flushWear(99);
      const after = [...g.getImageData(tx, ty, 2, 2).data];
      return { found: true, changed: before.join() !== after.join() };
    }
  }
  return { found: false };
});
ok('the light overlay repaints over worn grey ground (no stale grass under the veil)', r.found && r.changed, JSON.stringify(r));

/* 5. bare paths walk faster */
r = await page.evaluate(async l => {
  const sx = l.x, sy = l.y;
  // wear the lane to bare
  for (let x = sx - 20; x <= sx + 160; x += 8) for (let i = 0; i < 40; i++) World.addWear(x, sy, 30);
  World.flushWear(99);
  const sample = async (fromX, y) => new Promise(res => {
    WL.tp([fromX, y]); S.moveTo = null;
    Systems.moveTo(fromX + 110, y, { plain: true });
    let top = 0; const t0 = performance.now();
    const iv = setInterval(() => {
      if (S.speed > top) top = S.speed;
      if (!S.moveTo || performance.now() - t0 > 6000) { clearInterval(iv); res(top); }
    }, 50);
  });
  const worn = await sample(sx, sy);
  const fresh = await sample(sx, sy + 300);
  return { worn, fresh };
}, lane);
ok('packed earth pays speed: worn lane beats fresh meadow', r.worn > r.fresh * 1.03, `worn ${r.worn | 0} vs fresh ${r.fresh | 0}`);

/* 6. the paths survive save and load */
await page.evaluate(() => State.save());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue').catch(() => {});
await page.waitForTimeout(1200);
r = await page.evaluate(() => {
  const d = DATA.stations.haven;
  return { bare: World.wearAt(d.x + 200, d.y - 900),
    px: [...World.tc.getContext('2d').getImageData(Math.floor((d.x + 200) / World.TS), Math.floor((d.y - 900) / World.TS), 1, 1).data] };
});
ok('paths survive death of the session: wear and paint both load back', r.bare >= 64 && r.px.join() !== '0,0,0,0', `bare ${r.bare}, texel ${r.px.slice(0,3)}`);

/* 7. the world speaks in the pixel face: a bark paints gold texels near the walker */
r = await page.evaluate(async () => {
  WL.tp('haven'); S.moveTo = null;
  await new Promise(res => setTimeout(res, 900));                  // let the camera settle on the walker
  Render.say(S.px, S.py, 'TEST OF THE VOICE');
  await new Promise(res => setTimeout(res, 400));
  const cv2 = document.getElementById('game');
  const g = cv2.getContext('2d');
  const z2 = Render.effZoom();
  const cx2 = cv2.width / 2 + (S.px - Render.cam.x) * z2, cy2 = cv2.height / 2 + (S.py - Render.cam.y) * z2;
  const id = g.getImageData(Math.round(cx2 - 160), Math.round(cy2 - 150), 320, 130).data;
  let goldish = 0;
  for (let i = 0; i < id.length; i += 4) if (id[i] > 200 && id[i + 1] > 170 && id[i + 2] < 190 && id[i + 1] > id[i + 2]) goldish++;
  return { goldish };
});
ok('a spoken line lands as gold pixel-face texels in the world', r.goldish > 30, `${r.goldish} gold px`);

ok('no page errors through the path suite', errors.length === 0, errors.slice(0, 2).join(' | '));
await b.close();
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
