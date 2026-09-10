/* rideshot.mjs — evidence: THE RIDE, shot by shot. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(250);
await page.click('#cgBegin'); await page.waitForTimeout(500);
const ev = fn => page.evaluate(fn);
await ev(() => { for (let i = 0; i < 15 && S.cine; i++) WL.skipCine(); S.flags.guideDone = true; WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999; S.time = 30; State.refreshSources(true);
  WL.tp([DATA.stations.haven.x + 640, DATA.stations.haven.y + 480]); S.dir = 0.5; S.level = 5; S.moveTo = null;
  document.getElementById('toasts').innerHTML = ''; document.getElementById('earnFeed').innerHTML = ''; });
await page.waitForFunction(() => Math.abs(Render.cam.x - S.px) < 4, null, { timeout: 15000 });
await ev(() => WL.ride());
const shotAt = async (pred, name, settle = 350) => {
  await page.waitForFunction(pred, null, { timeout: 25000 }).catch(() => console.log('MISS', name));
  await page.waitForTimeout(settle);
  await page.screenshot({ path: '/tmp/ride_' + name + '.png' });
  console.log('shot', name);
};
await page.waitForTimeout(900);
await page.screenshot({ path: '/tmp/ride_wide.png' }); console.log('shot wide');            // A: the ground, established
await shotAt(() => Render.cam.z > 2.0 && !S.ride.rider.bolted, 'dad', 200);                  // B: the push on the ridge
await shotAt(() => S.ride && S.ride.aim, 'order', 150);                                      // C: rifles level, the line said
await shotAt(() => { const f = Cine.fx(); return f && f.lines > 0.5; }, 'dolly', 250);                         // D: the bolt, speed lines
await shotAt(() => { const f = Cine.fx(); return f && f.flickers.length > 0; }, 'veer', 60); // E: veered out, gun light
await shotAt(() => { const f = Cine.fx(); return f && f.stamp; }, 'stamp', 300);             // F: the stamp
await page.waitForFunction(() => !S.cineSeq, null, { timeout: 15000 });
console.log('done');
await b.close();
