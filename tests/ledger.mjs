/* ledger.mjs — LEDGERLIGHT doctrine: every system writes its state into the land.
   The wire is caravans, the windows are the stock report, the coat is the rank, the title is the valley. */
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

/* 1. the title screen is the living ledger: the camera tours the valley */
const cam1 = await page.evaluate(() => ({ x: Render.cam.x, y: Render.cam.y }));
await page.waitForTimeout(2600);
const cam2 = await page.evaluate(() => ({ x: Render.cam.x, y: Render.cam.y }));
ok('the title camera drifts across the valley', Math.hypot(cam2.x - cam1.x, cam2.y - cam1.y) > 30, `moved ${Math.hypot(cam2.x - cam1.x, cam2.y - cam1.y) | 0} u`);

/* 2. the authored wordmark is painted, two-tone with the beacon */
let r = await page.evaluate(() => {
  const c = document.getElementById('logoCv'); if (!c) return null;
  const d = c.getContext('2d').getImageData(0, 0, 47, 11).data;
  let bone = 0, gold = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    if (d[i] > 220 && d[i + 1] > 210) bone++;
    else if (d[i] > 220 && d[i + 1] > 140 && d[i + 2] < 140) gold++;
  }
  return { bone, gold };
});
ok('the WAYLIGHT wordmark is authored pixels, bone and gold', r && r.bone > 30 && r.gold > 40, JSON.stringify(r));

await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  Render.setFx(false);   // grain off: measurements read true colours
  for (const id of ['green', 'elm']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(); World.rebuildLight();
});

/* 3. the wire spawns caravans between connected stations, and they advance */
await page.evaluate(() => { WL.timeScale = 4; });
const gotPulse = await page.waitForFunction(() => Economy.pulses.length > 0, null, { timeout: 60000 }).then(() => true).catch(() => false);
await page.evaluate(() => { WL.timeScale = 1; });
ok('the wire spawns light caravans between connected stations', gotPulse, '');
if (gotPulse) {
  const t1 = await page.evaluate(() => Economy.pulses[0] && Economy.pulses[0].t);
  await page.waitForTimeout(700);
  const t2 = await page.evaluate(() => Economy.pulses[0] && Economy.pulses[0].t);
  ok('a caravan walks its route', t2 === undefined || t2 > t1, `t ${t1 && t1.toFixed(2)} → ${t2 && t2.toFixed(2)}`);
}

/* 4. the windows are the stock report — halo quenched (litT 0.05 keeps `lit` true, kills the glow),
   so the ONLY #ffd98f near the hut is the window glass itself */
await page.evaluate(() => { const d = DATA.stations.green; S.stations.green.litT = 0.05; WL.tp([d.x + 30, d.y + 130]); S.moveTo = null; });
await page.waitForTimeout(1600);
const bayCount = () => page.evaluate(() => {
  const cv2 = document.getElementById('game'), g = cv2.getContext('2d');
  const z = Render.effZoom();
  const d = DATA.stations.green;
  const sx = cv2.width / 2 + (d.x - 40 - Render.cam.x) * z, sy = cv2.height / 2 + (d.y - 26 - Render.cam.y) * z;
  const img = g.getImageData(Math.round(sx), Math.round(sy), Math.ceil(80 * z), Math.ceil(46 * z)).data;
  let gold = 0;
  for (let i = 0; i < img.length; i += 4) if (img[i] === 0xff && img[i + 1] === 0xd9 && img[i + 2] === 0x8f) gold++;
  return gold;
});
await page.evaluate(() => { for (const g of Object.keys(S.stations.green.stock)) S.stations.green.stock[g] = 92; Render.stockDebug('green'); });
await page.waitForTimeout(450);
const fullGold = await bayCount();
const srFull = await page.evaluate(() => Render.stockDebug('green').bays);
await page.evaluate(() => { for (const g of Object.keys(S.stations.green.stock)) S.stations.green.stock[g] = 6; Render.stockDebug('green'); });
await page.waitForTimeout(450);
const critGold = await bayCount();
const srCrit = await page.evaluate(() => Render.stockDebug('green').bays);
ok('stockRead maps pantry to bays: full → 2, starved → 0', srFull === 2 && srCrit === 0, `${srFull} vs ${srCrit}`);
ok('window glass dims on screen when the pantry empties (delta over a constant scene floor)', fullGold > critGold + 5, `full ${fullGold} vs starved ${critGold}`);
await page.evaluate(() => { S.stations.green.litT = 1; });

/* 5. rank goes on the coat — same spot, only S.level changes */
const pal0 = await page.evaluate(() => { S.level = 0; return Render.coatPal(); });
const pal30 = await page.evaluate(() => { S.level = 30; return Render.coatPal(); });
ok('the coat swaps with rank: drab wool at Greenhand, dark gold-lined coat at Legend',
  pal0.C === '#4a5560' && pal30.C === '#2a3038' && pal30.c === '#a07830' && pal0.c !== pal30.c,
  `lv0 ${pal0.C}/${pal0.c} lv30 ${pal30.C}/${pal30.c}`);

/* 6. the interface is the Order's paperwork */
const paper = await page.evaluate(() => {
  const bg = getComputedStyle(document.querySelector('.glass')).backgroundImage;
  UI.openStation('green');
  const tag = document.querySelector('.orderCard .wbTag');
  const tabs = document.querySelector('.tab.active');
  const tabRaised = tabs && getComputedStyle(tabs).borderBottomStyle === 'none';
  const slip = document.querySelector('#results h2').textContent;
  document.getElementById('stationClose').click();
  return { dither: /data:image\/svg/.test(bg), tag: tag ? tag.textContent : null, tabRaised, slip };
});
ok('panels are printed on the world\'s own dither-paper', paper.dither, '');
ok('orders are waybills: a stamp leads every card', /WAYBILL|DISPATCH|MAILBAG/.test(paper.tag || ''), paper.tag || 'none');
ok('tabs are the ledger\'s index, not web nav', paper.tabRaised === true, '');
ok('the results screen is a stamped delivery slip', /Waybill/.test(paper.slip), paper.slip);

ok('no page errors through the ledger suite', errors.length === 0, errors.slice(0, 2).join(' | '));
await b.close();
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
