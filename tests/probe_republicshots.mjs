/* probe_republicshots — v3.32 evidence: the banner sheet, an Unlit town on the ground, the quell
   column marching, a fed shrine, the far shape, and the walked hall. Staged, framed, eyeballed. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });

/* 1 · the banner sheet — mid-game state so the court reads real */
await page.evaluate(() => {
  Republic.tick(0.01);
  S.renegade = 25; Republic.setStance('raiders', 'WARY');
  for (const s2 of Republic.sites('flameshrine')) s2.fedUntil = S.time + 400;
  S.stations.quarry.connected = true; State.refreshSources();
  Republic.rebellionStrike('quarry');
  S.banked.metal = 120; S.banked.wood = 80; S.banked.provisions = 60;
  RepublicUI.open();
});
await page.waitForTimeout(6000);   // let the rising's CRT announce fade fully — the sheet stands alone
await page.screenshot({ path: 'shots/ev_banner_sheet.png' });

/* 2 · the Unlit town on the ground — doused lamp, flown shutter, dark door */
await page.evaluate(() => {
  UI.closeAllModals();
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;   // midday — the dark is THEIRS, not the hour's
  const d = DATA.stations.quarry; WL.tp([d.x - 10, d.y + 110]);
  document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(900);
await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/ev_unlit_town.png' });

/* 3 · the quell column marching — shields on the road, seen from the walk */
await page.evaluate(() => {
  Republic.fundQuell('quarry');
  const q = Republic.quell(); q.t = q.dur * 0.5;
  const p = Republic.columnPos(0.5, 26);
  if (p) WL.tp([p.x + 40, p.y + 60]);
});
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/ev_quell_column.png' });

/* 4 · a fed shrine burning tall on the walked way */
await page.evaluate(() => { const s2 = Republic.sites('flameshrine')[0]; WL.tp([s2.x + 30, s2.y + 40]); });
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/ev_fed_shrine.png' });

/* 5 · the far shape at the light's turn — hand-placed on clean open ground directly ahead,
   camera snapped to frame it. The additive ghost-sheet reads on any backdrop. */
const gOk = await page.evaluate(() => {
  const T2 = DATA.T;
  S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.56 + T2.dayLen * 2;   // dusk
  // find clean open ground with a viewport of room above it
  let gx = null, gy = null;
  outer: for (let y = 3000; y < DATA.H - 3000; y += 200) for (let x = 2000; x < DATA.W - 2000; x += 200) {
    let clean = true;
    for (let dx = -120; dx <= 120; dx += 40) for (let dy = -180; dy <= 40; dy += 40) {
      const t = World.terrainAt(x + dx, y + dy); if (t.blocked || t.water) { clean = false; break; }
    }
    if (clean) { gx = x; gy = y; break outer; }
  }
  if (gx === null) { gx = DATA.stations.haven.x; gy = DATA.stations.haven.y - 900; }
  S.rep.giant.seen = 0; S.rep.giant.cd = REP.PRESENCES.irongiant.cd;
  S.rep.giant.act = { x: gx, y: gy, t: REP.PRESENCES.irongiant.dur };   // hand-placed, so it stands exactly where framed
  WL.tp([gx + 150, gy + 20]);   // the walker a small foreground figure off to the side — the colossus looms clear beside them
  document.getElementById('toasts').innerHTML = '';
  return true;
});
console.log('giant staged:', gOk);
await page.waitForTimeout(5500);   // let the camera settle AND any idle bark time out
await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(200);
await page.screenshot({ path: 'shots/ev_far_shape.png' });

/* 6 · the walked hall */
await page.evaluate(() => {
  S.exile = S.exile || {}; S.exile.door = 'opened';
  Republic.enterRoom('diefenbunker');
  S.room.x = 200; S.room.y = 150;
});
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/ev_bunker_hall.png' });

console.log('6 frames written');
await b.close();
