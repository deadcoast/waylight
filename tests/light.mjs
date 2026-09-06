/* light.mjs — the founding claim, measured in pixels: lit land and grey land must not read as the same world.
   Samples the composited game canvas (no HUD — that is DOM). World seed is fixed, so sample spots are stable. */
import { chromium } from 'playwright';
const results = [], errors = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
page.on('pageerror', e => errors.push(e.message));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(500);
await page.evaluate(() => {
  WL.calm(); Render.setFx(false);
  S.weather.state = 'clear'; S.weather.t = 99999; S.weather.intensity = 0; S.time = 60;
  window.__toasts = []; const t0 = UI.toast; UI.toast = (m, c, d) => { window.__toasts.push(String(m).replace(/<[^>]+>/g, '')); return t0(m, c, d); };
});

/* mean color of a ground patch: teleport so the spot sits off-centre (clear of the porter sprite), wait for the camera, read pixels */
async function patch(wx, wy) {
  await page.evaluate(([x, y]) => { WL.tp([x - 300, y - 190]); S.moveTo = null; }, [wx, wy]);
  await page.waitForTimeout(700);
  return page.evaluate(([x, y]) => {
    const p = WL.worldToScreen(x, y), dpr = devicePixelRatio, cvs = document.getElementById('game');
    const d = cvs.getContext('2d').getImageData((p.x - 30) * dpr, (p.y - 30) * dpr, 60 * dpr, 60 * dpr).data;
    let r = 0, g = 0, bl = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; }
    r /= n; g /= n; bl /= n;
    return { r, g, b: bl, luma: 0.2126 * r + 0.7152 * g + 0.0722 * bl, warmth: r - bl, L: World.lightAt(x, y) };
  }, [wx, wy]);
}

/* sample spots: meadow inside Haven's light, and grey meadow at the same latitude (verified terrain class in-page) */
const spots = await page.evaluate(() => {
  const hv = DATA.stations.haven;
  const cls = (x, y) => World.terrainAt(x, y).cls;
  const lit = [hv.x + 340, hv.y - 60];
  // walk east at Haven's latitude for grey ground of the SAME terrain class, far enough that no future light reaches it
  let unlit = null;
  for (let x = hv.x + 2200; x < 8200 && !unlit; x += 60) for (let y = hv.y - 200; y <= hv.y + 300; y += 50) {
    if (cls(x, y) === cls(...lit) && World.lightAt(x, y) === 0) { unlit = [x, y]; break; }
  }
  return { lit, unlit, litCls: cls(...lit), unlitCls: cls(...unlit), litL: World.lightAt(...lit), unlitL: World.lightAt(...unlit) };
});
ok('sample spots are comparable ground (both meadow; one lit, one grey)', spots.litCls === spots.unlitCls && spots.litL > 0.8 && spots.unlitL === 0, JSON.stringify(spots));

/* 1. day: lit ground is at least 1.6× as bright and clearly warmer than grey ground */
const litDay = await patch(...spots.lit);
const unlitDay = await patch(...spots.unlit);
const dayRatio = litDay.luma / Math.max(1, unlitDay.luma);
ok('day: lit ground ≥ 1.6× the brightness of grey ground', dayRatio >= 1.6, `lit ${litDay.luma.toFixed(1)} vs grey ${unlitDay.luma.toFixed(1)} → ×${dayRatio.toFixed(2)}`);
ok('day: lit ground is warmer (r−b at least 8 higher)', litDay.warmth - unlitDay.warmth >= 8, `warmth ${litDay.warmth.toFixed(1)} vs ${unlitDay.warmth.toFixed(1)}`);
ok('the grey is dark, not black — terrain stays faintly readable', unlitDay.luma >= 6 && unlitDay.luma <= 40, `grey luma ${unlitDay.luma.toFixed(1)}`);

/* 2. the boundary rim: a warm fringe where the light ends, warmer than the ground just inside and far outside */
const rim = await page.evaluate(() => {
  const hv = DATA.stations.haven; let lo = 0, hi = hv.baseR * 1.4;
  const Lat = d => World.lightAt(hv.x + d, hv.y);
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (Lat(mid) > 0.30) lo = mid; else hi = mid; }
  return { rimD: (lo + hi) / 2, inD: (lo + hi) / 2 - 260, outD: (lo + hi) / 2 + 320 };
});
const pRim = await patch(spots.lit[0] - 340 + rim.rimD, spots.lit[1] + 60);   // = haven.x + rimD, haven.y
const pIn = await patch(spots.lit[0] - 340 + rim.inD, spots.lit[1] + 60);
const pOut = await patch(spots.lit[0] - 340 + rim.outD, spots.lit[1] + 60);
ok('the light\'s edge carries a golden rim (a warm bump above the inside→beyond blend line)', pRim.warmth > (pIn.warmth + pOut.warmth) / 2 + 3 && pRim.warmth - pOut.warmth >= 6, `rim ${pRim.warmth.toFixed(1)} · inside ${pIn.warmth.toFixed(1)} · beyond ${pOut.warmth.toFixed(1)}`);

/* 3. night (measured before the network grows, so the grey sample stays grey):
      the contrast grows — lit ground keeps its day face, the grey drowns */
await page.evaluate(() => { S.time = DATA.T.dayLen * 0.78; });
const litNight = await patch(...spots.lit);
const unlitNight = await patch(...spots.unlit);
const nightRatio = litNight.luma / Math.max(1, unlitNight.luma);
ok('night: the lit/grey brightness ratio is larger than by day', nightRatio > dayRatio && nightRatio >= 2.0, `night ×${nightRatio.toFixed(2)} vs day ×${dayRatio.toFixed(2)}`);
ok('night: lit ground stays warm and readable (≥ 70% of its day brightness)', litNight.luma >= litDay.luma * 0.7 && litNight.warmth >= 8, `lit ${litDay.luma.toFixed(1)} day → ${litNight.luma.toFixed(1)} night, warmth ${litNight.warmth.toFixed(1)}`);
await page.evaluate(() => { S.time = 60; });

/* 4. the map brightens as the network grows — coverage is the screen, not a number */
async function mapLuma() {
  await page.keyboard.press('m'); await page.waitForTimeout(500);
  const v = await page.evaluate(() => {
    const c = document.getElementById('map');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let l = 0, n = 0;
    for (let i = 0; i < d.length; i += 16) { l += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; }
    return l / n;
  });
  await page.keyboard.press('m'); await page.waitForTimeout(250);
  return v;
}
const mapBefore = await mapLuma();
await page.evaluate(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry']) { const st = S.stations[id]; st.connected = true; st.met = true; st.litT = 1; st.stars = 2; }
  State.refreshSources(); World.rebuildLight(); S.cov = World.coverage();
});
const mapAfter = await mapLuma();
const cov = await page.evaluate(() => Math.round(S.cov * 100));
ok(`the whole map brightens with the network (2% → ${cov}% coverage)`, mapAfter / mapBefore >= 1.15 && mapAfter - mapBefore >= 7, `map luma ${mapBefore.toFixed(1)} → ${mapAfter.toFixed(1)} (×${(mapAfter / mapBefore).toFixed(2)})`);

/* 5. a hunting wraith crossing into the light burns — and the first one teaches the rule */
const burn = await page.evaluate(async () => {
  const hv = DATA.stations.haven;
  WL.tp('haven'); S.moveTo = null;
  S.wraiths.push({ id: U.uid(), x: hv.x + 300, y: hv.y, alert: 1, state: 'hunt', cd: 0, ph: 0 });
  const before = S.wraiths.length;
  for (let i = 0; i < 30; i++) Systems.update(0.05, {});
  return { before, after: S.wraiths.length, states: S.wraiths.map(w => w.state), toast: window.__toasts.some(t => /burned at the light/.test(t)) };
});
ok('a wraith on lit ground burns away within a second — the boundary is a wall to them', burn.after < burn.before, JSON.stringify(burn));
ok('… and the first burn teaches it: "It burned at the light\'s edge"', burn.toast, burn.toast ? 'toast shown' : 'no toast');

console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed · errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await b.close();
