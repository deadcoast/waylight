/* probe_holdingshots — v3.34 evidence, IN GAME: the column marching on a camp, the watchpost
   holding (shields, pennant, grey canvas, the salvage pile), the doused bowl's scorch, the courted
   town's half-flown shutter, the Reapers' stake at a camp, the banner sheet with an owner on every
   plate + the world's own wars + the asks, and the two walked rooms. */
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
const midday = () => page.evaluate(() => { const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3; });
const clip = { x: 720 - 300, y: 430 - 210, width: 600, height: 380 };
const drain = () => page.waitForFunction(() => !Render.crtActive(), null, { timeout: 20000 });   // the CRT titles play out before a frame is judged

/* 0 · the road cut, the bank full */
await page.evaluate(() => {
  Republic.tick(0.01);
  S.banked.metal = 400; S.banked.wood = 200; S.banked.provisions = 200; S.banked.ceramic = 60; S.banked.lumen = 10;
  Republic.fundMountain(); Republic.mountain().t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
});
await midday();

/* 1 · THE COLUMN marching on Pass Camp — five shields on the road, the walker watching from the verge */
await page.evaluate(() => {
  Republic.fundTake('pass');
  const q = Republic.quell(); q.t = q.dur * 0.55;
  const lead = Republic.columnPos(0.55, 0), tail = Republic.columnPos(0.55, 4 * 44);
  WL.tp([(lead.x + tail.x) / 2, (lead.y + tail.y) / 2 + 40]); S.dir = 0;
});
await drain(); await clean(); await page.waitForTimeout(1600); await clean();
await page.screenshot({ path: 'shots/hold_column.png', clip });

/* 2 · THE WATCHPOST holding — the column arrived, the casualty roll spared */
await page.evaluate(() => {
  const q = Republic.quell(); const mr = Math.random; Math.random = () => 0.9; q.t = q.dur + 1; Republic.tick(0.02); Math.random = mr;
  const c = S.camps.pass; c.stash = [State.makeItem('metal'), State.makeItem('metal'), State.makeItem('metal')];
  const cd = DATA.camps[0]; WL.tp([cd.x - 8, cd.y + 62]); S.dir = -Math.PI / 2;
});
await drain(); await clean(); await page.waitForTimeout(1600); await clean();
await page.screenshot({ path: 'shots/hold_watchpost.png', clip });

/* 3 · THE DOUSED BOWL — the Raiders' night work, seen by day */
await page.evaluate(() => {
  const s2 = Republic.sites('flameshrine')[0];
  s2.fedUntil = S.time + 400;
  Republic.fireEvent('shrineRaid', s2);
  WL.tp([s2.x - 70, s2.y + 60]); S.dir = 0;
});
await clean(); await page.waitForTimeout(1600); await clean();
await page.screenshot({ path: 'shots/hold_doused.png', clip: { x: 720 - 220, y: 430 - 170, width: 440, height: 300 } });

/* 4 · THE COURTED TOWN — the half-flown shutter beside Elm's door */
await page.evaluate(() => {
  S.stations.elm.connected = true; State.refreshSources();
  Republic.fireEvent('unlitCourting', { id: 'elm' });
  const d = DATA.stations.elm; WL.tp([d.x - 40, d.y + 110]); S.dir = -Math.PI / 2;
});
await clean(); await page.waitForTimeout(1600); await clean();
await page.screenshot({ path: 'shots/hold_courted.png', clip: { x: 720 - 240, y: 430 - 230, width: 480, height: 330 } });

/* 5 · THE REAPERS' STAKE at Ridge Camp — a knife fewer for a day */
await page.evaluate(() => {
  const cd = DATA.camps[1], c = S.camps[cd.id];
  c.runners = [{ x: cd.x + 420, y: cd.y, wa: 0, state: 'patrol', cd: 30 }, { x: cd.x - 400, y: cd.y - 100, wa: 2, state: 'patrol', cd: 30 }, { x: cd.x + 10, y: cd.y - 420, wa: 4, state: 'patrol', cd: 30 }];
  Republic.fireEvent('reaperCull', cd);
  S.cargo = S.cargo.filter(x => x.tool);
  WL.tp([cd.x - 20, cd.y + 110]); S.dir = 0;
});
await clean(); await page.waitForTimeout(1600); await clean();
await page.screenshot({ path: 'shots/hold_stake.png', clip });

/* 6 · THE BANNER SHEET — owners, the wars, the ask */
await page.evaluate(() => { S.exile = S.exile || {}; S.exile.phase = 'open'; S.exile.guild = S.exile.guild || { done: 0, active: null }; S.exile.stock = S.exile.stock || { a338: 6, cycleT: 0 }; S.exile.door = 'opened'; RepublicUI.open(); });
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/hold_sheet.png' });
await page.evaluate(() => { const el = document.querySelector('#republicOv .sheetBody'); if (el) el.scrollTop = el.scrollHeight; });
await page.waitForTimeout(200);
await page.screenshot({ path: 'shots/hold_sheet2.png' });
await page.evaluate(() => RepublicUI.close());

/* 7 · THE LONG HALL — a shield hung for a stone, the hearth lit, the yard racked */
await page.evaluate(() => {
  if (!S.legacy.some(g => g.fact === 'farkeep')) S.legacy.push({ name: 'Brenna Stonejaw', cls: 'Farkeeper Shield', fate: 'fell taking Pass Camp', likes: 0, km: '0.0', deliveries: 0, cheated: false, seed: 7, fact: 'farkeep' });
  RepublicUI.deskAct('rep_hall');
  S.room.x = 210; S.room.y = 140;
});
await clean(); await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/hold_hall.png' });
await page.evaluate(() => { S.room = null; });

/* 8 · THE GUILD ROOM */
await page.evaluate(() => { Exile.deskAct('guild', 'shutterlight'); S.room.x = 200; S.room.y = 150; });
await clean(); await page.waitForTimeout(500); await clean();
await page.screenshot({ path: 'shots/hold_guild.png' });
await page.evaluate(() => { S.room = null; });

console.log('holdings frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
