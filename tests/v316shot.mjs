/* v316shot.mjs — evidence for THE POST */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => {
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  for (const id of ['elm', 'mill', 'green', 'relay', 'foundry']) S.stations[id].met = true;
  S.stations.haven.appr = 196; S.stations.haven.bag = 100;
  S.banked.provisions = 30;
  const mk = (cls, job, lv) => { const n = NPC.gen({ at: 'haven', cls }); S.npcs.push(n); n.feeWaived = true; NPC.assignPost(n, 'haven', job); n.skills[CHAR.JOBS[job].skill] = lv; n.trainXp = { [CHAR.JOBS[job].skill]: 31 }; return n; };
  mk('courier', 'runner', 4); mk('hearthkeeper', 'hearthpost', 2);
  WL.tp('haven');
});
/* 1. the board: tiered MAILBAG cards + the militia dispatch, all fee-less */
await page.evaluate(() => { UI.openStation('haven'); });
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/v316_board.png', clip: { x: 290, y: 40, width: 870, height: 700 } });
/* 2. THE POST tab: bag, ladder, staff on rounds */
await page.evaluate(() => { UI.gotoTab('post'); });
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/v316_post_tab.png', clip: { x: 290, y: 40, width: 870, height: 760 } });
/* 3. the service slip: deliver a mail run */
await page.evaluate(() => {
  UI.closeAllModals();
  S.orders.active = []; S.cargo = [];
  const run = Economy.ordersFor('haven').find(o => o.item === 'letters');
  Systems.acceptOrder(run, false);
  WL.tp(run.to); WL.instantPar();
  window.__runTo = run.to;
});
await page.waitForTimeout(300);
await page.evaluate(() => { UI.openStation(window.__runTo); });
await page.waitForTimeout(700);
await page.screenshot({ path: '/tmp/v316_service_slip.png', clip: { x: 430, y: 60, width: 580, height: 660 } });
/* 4. the militia, mid-rescue, at night */
await page.evaluate(() => {
  UI.closeAllModals();
  S.militia.unlocked.haven = true; S.militia.cdT = 0;
  const d = DATA.stations.haven;
  WL.tp([d.x - 700, d.y - 460]); S.moveTo = null;
  S.time = 60 + DATA.T.dayLen * 0.75;
  S.wraiths.push({ id: 88801, x: S.px + 90, y: S.py - 20, alert: 1, state: 'hunt', cd: 0, ph: 0 });
  document.getElementById('guide').style.display = 'none';
  document.getElementById('toasts').style.display = 'none';
  document.getElementById('hud').style.display = 'none';
  Render.setZoom(2.0);
  Systems.militiaCall();
});
await page.waitForTimeout(1500);   // riders arriving
await page.screenshot({ path: '/tmp/v316_militia_in.png', clip: { x: 300, y: 120, width: 850, height: 560 } });
await page.waitForTimeout(700);    // work phase
await page.screenshot({ path: '/tmp/v316_militia_work.png', clip: { x: 300, y: 120, width: 850, height: 560 } });
console.log('shots saved');
await b.close();
