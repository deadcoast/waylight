/* probe_mustershots — v3.36 evidence: the muster roll with a full party (a Farkeeper of the kit
   among them), one walker selected with the orders pane open, the wedge plate with a HOLD ring
   and a scout on point; the roll call sounding off on the ground; the overflow taken. */
import { chromium } from 'playwright';
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
const clean = () => page.evaluate(() => { document.getElementById('toasts').innerHTML = ''; S.wraiths.length = 0; S.struggle = null; });

/* a party of three: two Waylighters and a longbowman of Farkeep; some service on the stripe */
await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  const a = NPC.gen({ at: 'haven', cls: 'scavenger' }); a.name = 'Isolde Marrow'; a.skills.haul = 4; a.skills.sal = 3; a.fee = { metal: 0, ceramic: 0 }; a.feeWaived = true;
  const c = NPC.gen({ at: 'haven', cls: 'medic' }); c.name = 'Tam Quill'; c.skills.mend = 3; c.skills.bal = 2; c.fee = { metal: 0, ceramic: 0 }; c.feeWaived = true;
  const k = NPC.gen({ at: 'haven', cls: 'courier' }); k.fk = true; k.fkCls = 'longbowmen'; k.name = 'Brenna Stonejaw'; k.skills.bal = 6; k.skills.haul = 5; k.fee = { metal: 0, ceramic: 0 }; k.feeWaived = true;
  S.npcs.push(a, c, k);
  NPC.hire(a, 'companion'); NPC.hire(c, 'companion'); NPC.hire(k, 'companion');
  NPC.applyPreset(a, 'quartermaster'); NPC.applyPreset(c, 'scout'); NPC.applyPreset(k, 'shield');
  Object.assign(NPC.svc(a), { km: 12.4, crates: 9, met: 2, sweeps: 5, meals: 3, steadies: 1, last: 'took scrap metal off your back', lastT: S.time });
  Object.assign(NPC.svc(c), { km: 8.1, crates: 2, met: 0, sweeps: 0, meals: 4, steadies: 4, last: 'steadied your pack', lastT: S.time });
  Object.assign(NPC.svc(k), { km: 3.0, crates: 0, met: 6, sweeps: 0, meals: 1, steadies: 0, last: 'met a runner', lastT: S.time });
  const p = S.npcs.find(n => n.state === 'pool' && n.at === 'haven'); if (p) { NPC.svc(p); }
  document.getElementById('toasts').innerHTML = '';
  MusterUI.open(a.id);
});
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/mu_roll.png' });
await page.evaluate(() => { const el = document.querySelector('#musterOv .sheetBody'); if (el) el.scrollTop = 420; });
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/mu_orders.png' });
await page.evaluate(() => MusterUI.close());

/* the party on the ground in their stations: scout on point, the shield at the elbow, the quartermaster in the wedge */
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 330]); S.dir = 0; });
await clean(); await page.waitForTimeout(3200); await clean();
await page.screenshot({ path: 'shots/mu_ground.png', clip: { x: 720 - 300, y: 430 - 200, width: 600, height: 380 } });

/* the roll call: each back sounds off */
await page.evaluate(() => { NPC.rollCall(); });
await page.waitForTimeout(2900); await clean();
await page.screenshot({ path: 'shots/mu_rollcall.png', clip: { x: 720 - 320, y: 430 - 220, width: 640, height: 400 } });

console.log('muster frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
