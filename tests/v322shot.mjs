/* v322shot.mjs — evidence: outlaw green on the pack, the smoked yard, the Farkeeper ward, the karma ledger. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => { for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); S.flags.guideDone = true; S.weather.state = 'clear'; S.weather.t = 99999; WL.calm(); S.time = 30; State.refreshSources(true); S.stations.elm.connected = true; S.stations.mill.connected = true; });
const settle = async () => { await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 3 && Math.abs(Render.cam.y - S.py) < 3, null, { timeout: 15000 }); await page.waitForTimeout(300); };
const clipAt = (wu, hu, lift = 10) => page.evaluate(([wu2, hu2, l2]) => { const z = Render.effZoom(), cv = document.getElementById('game'), r = cv.getBoundingClientRect(); return { x: r.x + r.width / 2 - wu2 * z / 2, y: r.y + r.height / 2 - hu2 * z / 2 - l2 * z, width: wu2 * z, height: hu2 * z }; }, [wu, hu, lift]);
const clearToasts = () => ev(() => { document.getElementById('toasts').innerHTML = ''; document.getElementById('guide').style.display = 'none'; });

/* A — the quiet work rides in outlaw green (never gold) beside a gold mission crate */
await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 420, d.y - 300]); S.moveTo = null; S.dir = 0;
  S.cargo = [];
  State.addCargo(State.makeItem('highleaf'));                    // the road's green…
  State.addCargo(State.makeItem('highleaf'));
  State.addCargo(State.makeItem('textiles'));
  State.addCargo({ ...State.makeItem('meds'), orderId: 7 });     // …and the Order's gold, never confused
  Render.setZoom(3.2);
});
await settle(); await clearToasts();
await page.screenshot({ path: '/tmp/v322_contra.png', clip: await clipAt(130, 110, 22) });

/* B — the smoked yard: the town the quiet work supplied, visibly at ease */
await ev(() => {
  S.stations.mill.smokeT = 600;
  S.stations.mill.litT = 1; State.refreshSources(true);
  const d = DATA.stations.mill;
  WL.tp([d.x + 30, d.y + 74]); S.moveTo = null; S.dir = 0;
  Render.setZoom(2.9);
});
await settle(); await clearToasts();
await page.screenshot({ path: '/tmp/v322_smoke.png', clip: await clipAt(240, 105, 22) });

/* C — the ward: a Farkeeper walking at the shoulder, a head taller, iron and pale */
await ev(() => {
  Systems.fkIntro();
  const fk = S.npcs.find(n => n.fk) || (NPC.seedFarkeeper(), S.npcs.find(n => n.fk));
  fk.feeWaived = true; fk.state = 'companion'; fk.fedT = 999; fk.carry = fk.carry || [];
  const d = DATA.stations.haven;
  WL.tp([d.x - 520, d.y - 360]); S.moveTo = null; S.dir = 0;
  S.compPos = { x: S.px - 34, y: S.py + 6 };
  Render.setZoom(3.2);
});
await settle(); await clearToasts();
await page.screenshot({ path: '/tmp/v322_ward.png', clip: await clipAt(140, 100, 16) });

/* D — the karma ledger, two coins named */
await ev(() => { S.renegade = 23; Systems.addHeat('mill', 2); UI2.toggleSkills(true); const sb = document.getElementById('skillsBody'); (sb.closest('.sheetBody') || sb).scrollTop = 99999; sb.scrollTop = 99999; });
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/v322_karma.png', clip: { x: 290, y: 330, width: 860, height: 400 } });
await ev(() => UI2.toggleSkills(false));

console.log('shots done');
await b.close();
