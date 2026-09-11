/* probe_woshots — v3.37 evidence: the muster roll with a field crew and a charter on it (a hauler
   selected, THE FREIGHT LIST open), the presser's chain of marks standing on the ground with the
   dotted line between them, the wedge card on the HUD with the party's moods, and a plate at LOW
   saying why. */
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

/* the crew: a hauler Mill→Elm on a meds-only list, a presser on a two-mark chain out of Haven, a mason
   holding a reserve, a forrester thinning, a charter running freight hard; a party of two walking */
await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;
  S.stations.elm.connected = true; S.stations.mill.connected = true; S.banked.provisions = 400; S.banked.ceramic = 44; S.cov = 0.3;
  const mk = (cls, at, name) => { const n = NPC.gen({ at, cls }); n.name = name; n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true; S.npcs.push(n); return n; };
  const H = mk('scavenger', 'mill', 'Wren Ashby'); H.skills.haul = 3; H.skills.foot = 6; NPC.assignField(H, 'mill', 'hauler', 'elm');
  NPC.setTreeMark(H, 'haul', 'freight', false); NPC.setTreeMark(H, 'haul', 'meds', true, true); NPC.setOrder(H, 'load', 'split');
  Object.assign(NPC.svc(H), { km: 6.2, runs: 4, crates: 5, last: 'walked 6 medicine and 6 hand tools into Elm Farm' });
  const d = DATA.stations.haven;
  const P = mk('courier', 'haven', 'Isolde Marrow'); P.skills.foot = 7; NPC.assignField(P, 'haven', 'presser', { x: d.x + 560, y: d.y - 220 }); NPC.addMark(P, d.x + 700, d.y - 40);
  const M = mk('hearthkeeper', 'haven', 'Tam Quill'); NPC.assignField(M, 'haven', 'mason', 'elm'); NPC.setOrder(M, 'reserve', 'twenty'); NPC.svc(M).laid = 38; NPC.svc(M).km = 3.1;
  const F = mk('scavenger', 'haven', 'Brenna Coldbrook'); NPC.assignField(F, 'haven', 'forrester'); NPC.setOrder(F, 'woods', 'thin'); NPC.svc(F).felled = 7; F.fkept = [1, 2, 3]; NPC.svc(F).km = 2.4;
  const R = mk('courier', 'haven', 'Halla Ridge'); NPC.assignRoute(R, 'haven', 'elm'); NPC.setOrder(R, 'run', 'freight'); NPC.setOrder(R, 'pace', 'hard'); NPC.svc(R).runs = 9; NPC.svc(R).crates = 4; NPC.svc(R).km = 0;
  const a = mk('medic', 'haven', 'Jorund Greymantle'); a.skills.mend = 3; a.skills.bal = 2; NPC.hire(a, 'companion'); a.bond = true; NPC.svc(a).lastMeal = S.time; NPC.svc(a).km = 11.3;
  const c = mk('scavenger', 'haven', 'Eir Longwinter'); c.skills.haul = 4; NPC.hire(c, 'companion'); NPC.applyPreset(c, 'scout');
  for (let i = 0; i < 20; i++) Systems.update(0.25, {});
  window._ids = { H: H.id, P: P.id, M: M.id, F: F.id, R: R.id, a: a.id, c: c.id };
  document.getElementById('toasts').innerHTML = '';
  MusterUI.open(H.id);
});
await page.waitForTimeout(700);
await page.screenshot({ path: 'shots/wo_roll.png' });
await page.evaluate(() => { const el = document.querySelector('#musterOv .sheetBody'); if (el) el.scrollTop = 560; });
await page.waitForTimeout(250);
await page.screenshot({ path: 'shots/wo_freight.png' });
/* the presser selected: the chain of marks pane */
await page.evaluate(() => { MusterUI.open(window._ids.P); const el = document.querySelector('#musterOv .sheetBody'); if (el) el.scrollTop = 420; });
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/wo_marks_pane.png' });
await page.evaluate(() => MusterUI.close());

/* the marks on the ground: flags and the dotted line, the presser walking it */
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 380, d.y - 150]); S.dir = 0; });
await clean(); await page.waitForTimeout(1800); await clean();
await page.screenshot({ path: 'shots/wo_marks.png', clip: { x: 720 - 380, y: 430 - 240, width: 760, height: 480 } });

/* the wedge card: the party, moods, the live glyph */
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 330]); S.dir = 0; });
await clean(); await page.waitForTimeout(2600); await clean();
await page.evaluate(() => UI2.updateMoodles());
await page.waitForTimeout(200);
await page.screenshot({ path: 'shots/wo_hud.png', clip: { x: 0, y: 860 - 320, width: 420, height: 320 } });

/* a plate at LOW: hungry, in the dark, loaded — and the card's pip turns */
await page.evaluate(() => {
  const c = S.npcs.find(n => n.id === window._ids.c);
  c.hungry = true; c.koT = S.time; NPC.svc(c).km = 0.4;
  UI2.updateMoodles();
  MusterUI.open(c.id);
  const el = document.querySelector('#musterOv .sheetBody'); if (el) el.scrollTop = 0;
});
await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/wo_mood.png', clip: { x: 190, y: 120, width: 560, height: 420 } });
console.log('working-orders frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
