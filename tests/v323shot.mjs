/* v323shot.mjs — evidence: THE HANDOFF at full absurdity, the coat being cut, the paperdoll, the myth noticed. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(300);

/* B — the enlistment desk: the coat being cut, live on the rig */
await page.evaluate(() => { document.querySelector('[data-look="coat:2"]').click(); document.querySelector('[data-look="trim:1"]').click(); });
await page.waitForTimeout(200);
{
  const box = await page.evaluate(() => {
    document.getElementById('cgLook').scrollIntoView({ block: 'center' });
    const r = document.getElementById('cgLook').getBoundingClientRect();
    const x = Math.max(0, r.x - 12), y = Math.max(0, r.y - 34);
    return { x, y, width: Math.min(1440 - x, r.width + 24), height: Math.min(860 - y, r.height + 44) };
  });
  await page.screenshot({ path: '/tmp/v323_look.png', clip: box });
}
await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => { for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); S.flags.guideDone = true; S.weather.state = 'clear'; S.weather.t = 99999; WL.calm(); S.time = 30; State.refreshSources(true); });

/* A — THE HANDOFF: caught at the super zoom, speed lines up, the letter mid-air */
await ev(() => {
  S.flags.unlocks.horse = true;
  S.horse = { loaner: true, on: true, spookT: 0, breed: 'mustang' };
  S.orders.active.push({ idNum: 888, item: 'letters', to: 'mill', items: [], t0: S.time, par: 999 });
  const d = DATA.stations.mill;
  WL.tp([d.x + 380, d.y]); S.moveTo = null; S.dir = Math.PI;
  Myth.tick(0.2);
  document.getElementById('toasts').innerHTML = '';
});
await page.waitForFunction(() => S.handoff && S.handoff.phase === 2 && !S.handoff.passed, null, { timeout: 8000 }).catch(() => {});
await page.waitForTimeout(250);
await page.screenshot({ path: '/tmp/v323_zoom.png' });
await page.waitForFunction(() => S.handoff && S.handoff.passed, null, { timeout: 6000 }).catch(() => {});
await page.waitForTimeout(120);
await page.screenshot({ path: '/tmp/v323_stamp.png' });
await page.waitForFunction(() => !S.handoff, null, { timeout: 8000 }).catch(() => {});

/* C — the equip sheet paperdoll */
await ev(() => { State.addCargo(State.makeItem('boots_tread')); State.addCargo(State.makeItem('coat_lumen')); UI2.toggleSkills(true); });
await page.waitForTimeout(300);
{
  const box = await page.evaluate(() => {
    document.getElementById('skillsDoll').scrollIntoView({ block: 'center' });
    const r = document.getElementById('skillsDoll').getBoundingClientRect();
    const x = Math.max(0, r.x - 14), y = Math.max(0, r.y - 14);
    return { x, y, width: Math.min(1440 - x, r.width + 28), height: Math.min(860 - y, r.height + 28) };
  });
  await page.screenshot({ path: '/tmp/v323_doll.png', clip: box });
}
await ev(() => UI2.toggleSkills(false));

/* D — the yard notices the myth: letterbox, slow zoom, the line */
await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x + 90, d.y + 40]); S.moveTo = null;
});
await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 4 && Math.abs(Render.cam.y - S.py) < 4, null, { timeout: 15000 });
await ev(() => { S.level = 11; S.flags.mythSeen = 2; document.getElementById('toasts').innerHTML = ''; document.getElementById('earnFeed').innerHTML = ''; Myth.tick(0.25); });
await page.waitForTimeout(1400);
await page.screenshot({ path: '/tmp/v323_myth.png' });
await ev(() => Myth.skip());

console.log('shots done');
await b.close();
