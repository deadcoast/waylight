/* glowpass.mjs — v3.15 LIGHT HAS A BODY: coronas are banded, shafts belong to the night,
   props are authored sprites. Sampled at the source colours; law asserted at source level. */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };

/* 1-2. the law, at the source */
const src = readFileSync('/home/claude/waylight/src/17_render.js', 'utf8');
ok('no arc() survives anywhere in the renderer', !/\.arc\(/.test(src));
ok('the checkered pillar is dead at the source: no beamSprite, and pickups draw no polygons',
  !/beamSprite/.test(src) && !src.slice(src.indexOf('function drawPickups'), src.indexOf('function drawCamps')).includes('beginPath'));

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
await page.evaluate(() => {
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  const d = DATA.stations.haven;
  WL.tp([d.x + 40, d.y + 40]); S.moveTo = null;
  document.getElementById('guide').style.display = 'none';
  document.getElementById('toasts').style.display = 'none';
  Render.setZoom(1.6);
});
await page.waitForTimeout(2600);   // the arrival bark drains before any sampling

/* a warm-pixel counter over a world-anchored box */
const warmCount = (wx0, wy0, wx1, wy1) => page.evaluate(([ax0, ay0, ax1, ay1]) => {
  const cv2 = document.getElementById('game'), g = cv2.getContext('2d');
  const z2 = Render.effZoom();
  const sx = Math.round(cv2.width / 2 + (ax0 - Render.cam.x) * z2), sy = Math.round(cv2.height / 2 + (ay0 - Render.cam.y) * z2);
  const w = Math.round((ax1 - ax0) * z2), h = Math.round((ay1 - ay0) * z2);
  const px2 = g.getImageData(sx, sy, Math.max(1, w), Math.max(1, h)).data;
  let n = 0;
  for (let i = 0; i < px2.length; i += 4) if (px2[i] > 200 && px2[i + 1] > 160 && px2[i + 2] < 180 && px2[i] > px2[i + 2] + 40) n++;
  return n;
}, [wx0, wy0, wx1, wy1]);

/* 3. by day the beacon has no pillar: the column above the flame is empty air */
await page.evaluate(() => { S.time = 60; });
await page.waitForTimeout(700);
const H = await page.evaluate(() => DATA.stations.haven);
const dayCol = await warmCount(H.x - 15, H.y - 190, H.x + 15, H.y - 130);
ok('by day there is no beam at all — the column above the flame holds zero warm pixels', dayCol === 0, `${dayCol} warm px at noon`);

/* 4-5. by night the shaft stands, and stands NARROW */
await page.evaluate(() => { S.time = 60 + DATA.T.dayLen * 0.75; });
await page.waitForTimeout(900);
const nightCol = await warmCount(H.x - 15, H.y - 190, H.x + 15, H.y - 130);
const nightOff = await warmCount(H.x - 72, H.y - 190, H.x - 48, H.y - 130);
ok('by night the beacon shaft stands in the same column', nightCol > 15, `${nightCol} warm px at midnight`);
ok('and it is a shaft, not a flood: 50 units to the side, nothing', nightOff === 0, `${nightOff} warm px off-column`);

/* 6-8. authored props: sampled at their own paint */
await page.evaluate(() => {
  S.time = 60;
  const d = DATA.stations.haven;
  // a cleared stage: nothing world-seeded may overdraw the props under test
  const far = o => U.dist(o.x, o.y, d.x - 240, d.y + 300) > 150;
  S.ruins = S.ruins.filter(far); S.lost = S.lost.filter(far); S.graves = S.graves.filter(far);
  S.structures = S.structures.filter(far); S.nodes = S.nodes.filter(far); S.drops = S.drops.filter(far); S.snags = S.snags.filter(far);
  S.nodes.push({ id: 99201, type: 'metal', x: d.x - 300, y: d.y + 300, qty: 8, taken: false });
  S.nodes.push({ id: 99202, type: 'lumen', x: d.x - 240, y: d.y + 300, qty: 5, taken: false, respawn: 0 });
  S.drops.push({ id: 99203, item: State.makeItem('meds'), x: d.x - 180, y: d.y + 300 });
  WL.tp([d.x - 240, d.y + 360]); S.moveTo = null;
  Render.setZoom(2.0);
});
await page.waitForTimeout(700);
const hasColor = (wx0, wy0, wx1, wy1, hex, tol = 14) => page.evaluate(([ax0, ay0, ax1, ay1, hx, tl]) => {
  const cv2 = document.getElementById('game'), g = cv2.getContext('2d');
  const z2 = Render.effZoom();
  const sx = Math.round(cv2.width / 2 + (ax0 - Render.cam.x) * z2), sy = Math.round(cv2.height / 2 + (ay0 - Render.cam.y) * z2);
  const w = Math.round((ax1 - ax0) * z2), h = Math.round((ay1 - ay0) * z2);
  const px2 = g.getImageData(sx, sy, Math.max(1, w), Math.max(1, h)).data;
  const n2 = parseInt(hx.slice(1), 16), tr = n2 >> 16, tg = (n2 >> 8) & 255, tb = n2 & 255;
  let n = 0;
  for (let i = 0; i < px2.length; i += 4)
    if (Math.abs(px2[i] - tr) <= tl && Math.abs(px2[i + 1] - tg) <= tl && Math.abs(px2[i + 2] - tb) <= tl) n++;
  return n;
}, [wx0, wy0, wx1, wy1, hex, tol]);
const P = await page.evaluate(() => ({ x: DATA.stations.haven.x, y: DATA.stations.haven.y }));
const mSalv = await hasColor(P.x - 320, P.y + 285, P.x - 280, P.y + 310, '#9aa2ab');
ok('the metal pile is an authored sprite — its highlight steel is on the ground', mSalv > 3, `${mSalv} px of #9aa2ab`);
const lTip = await page.evaluate(() => {
  const d = DATA.stations.haven, cv2 = document.getElementById('game'), g = cv2.getContext('2d'), z2 = Render.effZoom();
  const sx = Math.round(cv2.width / 2 + (d.x - 260 - Render.cam.x) * z2), sy = Math.round(cv2.height / 2 + (d.y + 280 - Render.cam.y) * z2);
  const px2 = g.getImageData(sx, sy, Math.round(40 * z2), Math.round(34 * z2)).data;
  let n = 0;
  for (let i = 0; i < px2.length; i += 4) if (px2[i + 1] > 190 && px2[i + 2] > 180 && px2[i] < 180) n++;   // any crystal cyan
  return n;
});
ok('the lumen bloom grows authored crystals — cyan facets found', lTip > 8, `${lTip} px of crystal`);
const plank = await hasColor(P.x - 195, P.y + 288, P.x - 165, P.y + 312, '#8a6a42');
ok('a dropped crate is a planked crate now, not a rect', plank > 4, `${plank} px of plank`);

/* 9. the camp fire is animated frames, not a pulsing rect */
await page.evaluate(() => {
  const c = DATA.camps[0];
  WL.tp([c.x - 80, c.y + 50]); S.moveTo = null;
  Render.setZoom(2.0);
});
await page.waitForTimeout(700);
const fireBox = await page.evaluate(() => {
  const c = DATA.camps[0], cv2 = document.getElementById('game'), z2 = Render.effZoom();
  return {
    sx: Math.round(cv2.width / 2 + (c.x - 12 - Render.cam.x) * z2),
    sy: Math.round(cv2.height / 2 + (c.y - 18 - Render.cam.y) * z2),
    w: Math.round(24 * z2), h: Math.round(22 * z2),
  };
});
const grab = () => page.evaluate(([sx, sy, w, h]) => {
  const g = document.getElementById('game').getContext('2d');
  return Array.from(g.getImageData(sx, sy, w, h).data);
}, [fireBox.sx, fireBox.sy, fireBox.w, fireBox.h]);
const fa = await grab();
await page.waitForTimeout(420);
const fb = await grab();
let diff = 0;
for (let i = 0; i < fa.length; i += 4) if (Math.abs(fa[i] - fb[i]) > 30 || Math.abs(fa[i + 1] - fb[i + 1]) > 30) diff++;
ok('the camp fire burns in authored frames — the flame changed shape between looks', diff > 20, `${diff} px moved in 0.42s`);

ok('no page errors through the glow pass', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks green`);
await b.close();
