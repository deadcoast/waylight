/* probe_postshots — v3.38 evidence: a post hand's working orders on the roll (THE HOURS · THE TRAINING ·
   THE KEEP, the stripe counting shifts and thanks), the survey sheet with the field crew, a presser's
   chain of flags and the wedge at the walker's marker. */
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

await page.evaluate(() => {
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.75;   // night: the lamp-lit round
  S.stations.elm.connected = true; S.stations.mill.connected = true; S.banked.provisions = 400; S.stations.haven.appr = DATA.T.apprTiers[2];
  const mk = (cls, at, name) => { const n = NPC.gen({ at, cls }); n.name = name; n.fee = { metal: 0, ceramic: 0 }; n.feeWaived = true; S.npcs.push(n); return n; };
  const p1 = mk('courier', 'haven', 'Rook Locke'); NPC.hire(p1, 'post'); NPC.assignPost(p1, 'haven', 'nightpost'); NPC.setOrder(p1, 'hours', 'nights'); NPC.setOrder(p1, 'training', 'cross'); Object.assign(NPC.svc(p1), { shifts: 11, appr: 33, last: 'ran the night post round by lamplight' });
  const p2 = mk('hearthkeeper', 'haven', 'Mara Stillwater'); NPC.hire(p2, 'post'); NPC.assignPost(p2, 'haven', 'hearthpost'); NPC.setOrder(p2, 'hours', 'days'); NPC.setOrder(p2, 'keep', 'table'); Object.assign(NPC.svc(p2), { shifts: 6, appr: 3, last: 'ran the hearth post round on the town\'s table' });
  const d = DATA.stations.haven;
  const P = mk('courier', 'haven', 'Isolde Marrow'); P.skills.foot = 7; NPC.assignField(P, 'haven', 'presser', { x: d.x + 560, y: d.y - 220 }); NPC.addMark(P, d.x + 700, d.y - 40); NPC.addMark(P, d.x + 1100, d.y - 300);
  const H = mk('scavenger', 'mill', 'Wren Ashby'); NPC.assignField(H, 'mill', 'hauler', 'elm');
  const F = mk('scavenger', 'haven', 'Brenna Coldbrook'); NPC.assignField(F, 'haven', 'forrester');
  const a = mk('medic', 'haven', 'Jorund Greymantle'); NPC.hire(a, 'companion'); a.bond = true; NPC.svc(a).lastMeal = S.time; NPC.svc(a).km = 11.3;
  const c = mk('scavenger', 'haven', 'Eir Longwinter'); NPC.hire(c, 'companion'); NPC.applyPreset(c, 'scout');
  for (let i = 0; i < 24; i++) Systems.update(0.25, {});
  window._ids = { p1: p1.id, P: P.id };
  document.getElementById('toasts').innerHTML = '';
  MusterUI.open(p1.id);
});
await page.waitForTimeout(700);
await page.evaluate(() => { const el = document.querySelector('#musterOv .sheetBody'); if (el) el.scrollTop = 0; });
await page.screenshot({ path: 'shots/po_post.png' });
await page.evaluate(() => MusterUI.close());

/* the survey: the crew on the sheet, the chain, the wedge at the marker */
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 300, d.y - 100]); S.dir = -Math.PI / 4; });
await clean(); await page.waitForTimeout(2200); await clean();
await page.evaluate(() => { UI.toggleMap(true); });
await page.waitForTimeout(500);
await page.screenshot({ path: 'shots/po_survey.png' });
/* zoomed on the walker: the wheel, three notches in, over the marker */
const pt = await page.evaluate(() => UI.mapPoint(S.px, S.py));
await page.mouse.move(pt.x, pt.y);
for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -100); await page.waitForTimeout(80); }
await page.waitForTimeout(400);
const pz = await page.evaluate(() => UI.mapPoint(S.px, S.py));
await page.screenshot({ path: 'shots/po_survey_zoom.png', clip: { x: Math.max(0, pz.x - 380), y: Math.max(0, pz.y - 260), width: 760, height: 480 } });
await page.evaluate(() => UI.toggleMap(false));
console.log('posted-orders frames written · errors:', errors.length ? errors.slice(0, 3).join(' | ') : 'none');
await b.close();
