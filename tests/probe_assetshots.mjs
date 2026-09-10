/* probe_assetshots — v3.33 evidence, IN GAME: the walker mounted on each of the five breeds, the
   five Farkeeper classes standing in a row, riders at the gallop on their Fjords, the caravan
   donkey under its crates, and the Flame Keeper tender at a fed bowl. Clips composited. */
import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });

/* a clean midday meadow near Haven; the HUD hidden by clipping to the centre */
await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 320]);
  document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(600);
const clip = { x: 720 - 240, y: 430 - 200, width: 480, height: 320 };

/* 1 · the five breeds under the walker, one clip each */
const breeds = ['mustang', 'fjord', 'arabian', 'percheron', 'icelandic'];
for (const br of breeds) {
  await page.evaluate(br2 => { S.horse = { loaner: false, rentedUntil: S.time + 9999, on: true, spookT: 0, wantRemount: false, breed: br2 }; S.dir = 0; document.getElementById('toasts').innerHTML = ''; }, br);
  await page.waitForTimeout(350);
  await page.screenshot({ path: `shots/asset_mount_${br}.png`, clip });
}
/* 2 · the kit: one class at a time beside the walker (the wedge slot), settled, barks faded */
await page.evaluate(() => { S.horse.on = false; for (const n of NPC.party()) n.state = 'pool'; });
for (const cls of ['pugugly', 'longbowmen', 'berserker', 'rifle_rider', 'recon_rider']) {
  await page.evaluate(cls2 => {
    for (const n of NPC.party()) n.state = 'pool';
    const n = NPC.gen({ at: 'haven', cls: 'courier' });
    n.fk = true; n.fkCls = cls2; n.name = 'Kit'; n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true;
    S.npcs.push(n); NPC.hire(n, 'companion');
    n.cx = S.px + 34; n.cy = S.py + 12; n._px = n.cx - 1; n._py = n.cy;
    document.getElementById('toasts').innerHTML = '';
  }, cls);
  await page.waitForTimeout(2600);
  await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
  await page.screenshot({ path: `shots/asset_kit_${cls}.png`, clip: { x: 720 - 110, y: 430 - 110, width: 220, height: 200 } });
}

/* 3 · riders at the gallop: Farkeepers on Fjords (the rescue scene, staged) */
await page.evaluate(() => {
  for (const n of NPC.party()) n.state = 'pool';
  S.rescue = { riders: [{ x: S.px - 150, y: S.py - 40, in: false, ph: 0 }, { x: S.px - 90, y: S.py + 10, in: false, ph: 1 }], t: 0 };
  document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/asset_riders.png', clip: { x: 720 - 330, y: 430 - 200, width: 520, height: 300 } });
await page.evaluate(() => { S.rescue = null; });

/* 4 · the caravan donkey under its crates */
await page.evaluate(() => {
  const n = NPC.gen({ at: 'haven', cls: 'courier' }); n.skills.haul = DATA.T.haulLvCaravan; n.name = 'Hauler';
  S.npcs.push(n); n.state = 'field'; n.job = 'hauler'; n.route = { a: 'haven', b: 'elm', custom: null };
  n.fx = S.px + 90; n.fy = S.py + 40; n.fdir = 0; n.fmoving = true; n.fseg = 0; n.fdirn = 1; n.fwork = 0; n.facc = 0; n.shiftT = 999;
  n.fpath = { t: S.time, pts: [[n.fx, n.fy], [n.fx + 400, n.fy]] };
  document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(450);
await page.screenshot({ path: 'shots/asset_donkey.png', clip: { x: 720 - 60, y: 430 - 120, width: 420, height: 260 } });

/* 5 · the tender at a fed bowl, at ALLY */
await page.evaluate(() => {
  Republic.tick(0.01);
  for (const s2 of Republic.sites('flameshrine')) s2.fedUntil = S.time + 400;
  S.rep.stance.flamekeepers = 'ALLY';
  const s2 = Republic.sites('flameshrine')[0]; WL.tp([s2.x - 20, s2.y + 50]);
  document.getElementById('toasts').innerHTML = '';
});
await page.waitForTimeout(700);
await page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
await page.screenshot({ path: 'shots/asset_tender.png', clip: { x: 720 - 200, y: 430 - 200, width: 440, height: 300 } });

console.log('asset frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
