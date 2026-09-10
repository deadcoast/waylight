/* v324shot.mjs — evidence: the party wedge with a mounted companion, the globe's valley pin
   with the aboard tally, the rain dial. (THE RIDE frames captured by rideshot.mjs.) */
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
await ev(() => { for (let i = 0; i < 15 && S.cine; i++) WL.skipCine(); S.flags.guideDone = true; WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999; S.time = 30; State.refreshSources(true); });

/* A — the party of four on the road, one companion mounted */
await ev(() => {
  WL.tp([DATA.stations.haven.x + 240, DATA.stations.haven.y + 160]); S.moveTo = null;
  S.banked.metal = 900; S.banked.ceramic = 500; S.banked.provisions = 60;
  for (let i = 0; i < 3; i++) S.npcs.push(NPC.gen({ at: 'haven' }));
  const pool = S.npcs.filter(n => n.state === 'pool' && n.at === 'haven');
  for (const n of pool.slice(0, 3)) NPC.hire(n, 'companion');
  NPC.party()[1].horse = { breed: 'fjord', owned: true };
  S.flags.unlocks.horse = true;
  document.getElementById('toasts').innerHTML = ''; document.getElementById('earnFeed').innerHTML = '';
});
await ev(() => { WL.moveTo(S.px + 420, S.py + 60); });
await page.waitForTimeout(2800);
await ev(() => { document.getElementById('toasts').innerHTML = ''; });
await page.waitForTimeout(150);
await page.screenshot({ path: '/tmp/v324_party.png' });

/* B — the globe, valley pin centered, cargo aboard */
await ev(() => {
  const mk = (to, n, base) => { const ids = []; for (let i = 0; i < n; i++) { const it = State.makeItem('letters', base); State.addCargo(it); ids.push(it.id); } S.orders.active.push({ idNum: base, item: 'letters', from: 'haven', to, items: ids, t0: S.time, par: 999 }); };
  mk('mill', 4, 999001); mk('elm', 2, 999002);
});
await page.keyboard.press('KeyM'); await page.waitForTimeout(400);
await page.click('#btnViewWorld'); await page.waitForTimeout(800);
await ev(() => { const v = Globe.REGIONS[0]; Globe._st.rot = v.lon - Math.PI / 2; Globe._st.vel = 0; });
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/v324_globe.png' });
await page.click('#btnViewValley'); await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/v324_badges.png' });
await page.keyboard.press('KeyM'); await page.waitForTimeout(300);

/* C — the rain dial in the pause sheet */
await page.keyboard.press('Escape'); await page.waitForTimeout(350);
{
  const box = await ev(() => {
    const el = document.getElementById('rainSlider').closest('.sheet');
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: Math.max(0, r.x - 10), y: Math.max(0, r.y - 10), width: Math.min(1440, r.width + 20), height: Math.min(860, r.height + 20) };
  });
  await page.screenshot({ path: '/tmp/v324_sound.png', clip: box });
}
console.log('v324 shots done');
await b.close();
