/* probe_courier3 — v3.50: everything the courier carries, on every facing: the tower on an equipped frame, the tools, the
   road's gift, the white rag, the kin's lantern, the keepsakes, the bolt; then the scar, the snow, the brace, the ride, the
   crew with the ribbon and the pin, a figure down. Writes shots/cs3_*.png for the eye. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message) + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300); await page.click('#btnBegin'); await page.waitForTimeout(400); await page.click('#briefGo'); await page.waitForTimeout(300); await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
const ev = (fn, a) => page.evaluate(fn, a);
await ev(() => { S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9; Render.setFx(false); UI.announce = () => {}; });
const at = () => ev(() => { const w = Render.cam, z = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (S.px - w.x) * z, y: innerHeight / 2 + (S.py - w.y) * z }; });
const shot = async (name, w = 240, h = 300, up = 110) => { const p = await at(); await page.screenshot({ path: `shots/cs3_${name}.png`, clip: { x: Math.round(p.x - w / 2), y: Math.round(p.y - up - h / 2), width: w, height: h } }); };
await ev(() => { WL.tp('haven'); S.px += 700; S.py += 500; S.time = Math.floor(S.time / DATA.T.dayLen) * DATA.T.dayLen + DATA.T.dayLen * 0.3; Render.setZoomStep(3); S.cargo.length = 0;
  for (const id of ['meds', 'food', 'textiles', 'seeds']) S.cargo.push(State.makeItem(id)); S.cargo.push(State.makeItem('letters'));
  WL.tool('ladderTool'); WL.tool('kitTool');
  const ks = State.makeItem('keepsake'); ks.keepsake = { thing: 'whistle' }; S.cargo.push(ks); const ks2 = State.makeItem('keepsake'); ks2.keepsake = { thing: 'flower' }; S.cargo.push(ks2);
  const kl = State.makeItem('kinLantern'); kl.lit = true; S.cargo.push(kl);
  const gf = State.makeItem('fireGift'); gf.gift = true; S.cargo.push(gf);
  S.equip.pack = State.makeItem('pack_rig'); Republic.onAnyRoad = () => true; S.arrow = { t0: S.time, from: 'ash', n: 1, pullT: 0, medT: 0 }; });
await page.waitForTimeout(500);
for (const fc of ['E', 'S', 'N', 'W']) { await ev(fc => Render.faceWalker(fc), fc); await page.waitForTimeout(250); await shot('all_' + fc, 240, 330, 120); }
for (const pk of ['pack_wide', 'pack_exo2']) { await ev(pk => { S.equip.pack = State.makeItem(pk); Render.faceWalker('N'); }, pk); await page.waitForTimeout(250); await shot('rails_' + pk, 240, 330, 120); }
// the scar dressed, the snow, the brace
await ev(() => { S.cargo.length = 0; S.arrow = null; S.scar = { t0: S.time, dressed: 1, dressT: 0, by: 'x' }; S.equip.pack = State.makeItem('pack0'); Republic.onAnyRoad = () => false; });
for (const fc of ['E', 'N']) { await ev(fc => Render.faceWalker(fc), fc); await page.waitForTimeout(250); await shot('scar_' + fc, 200, 200, 40); }
for (const amt of [0.3, 0.6, 0.95]) { await ev(a => { S.snowPack = a; S.scar = null; Render.faceWalker('S'); }, amt); await page.waitForTimeout(120); await ev(a => { S.snowPack = a; }, amt); await page.waitForTimeout(60); await shot('snow_' + amt, 200, 200, 40); }
await ev(() => { S.snowPack = 0; S.braced = true; S.speed = 0; }); for (const fc of ['E', 'S', 'N']) { await ev(fc => { Render.faceWalker(fc); S.braced = true; }, fc); await page.waitForTimeout(200); await shot('brace_' + fc, 200, 200, 40); }
await ev(() => { S.braced = false; S.horse = { breed: 'mustang', on: true }; Systems.horseOn = () => true; S.dir = 0; }); await page.waitForTimeout(300); await shot('ride_E', 260, 240, 50);
await ev(() => { S.dir = Math.PI; }); await page.waitForTimeout(300); await shot('ride_W', 260, 240, 50);
await ev(() => { Systems.horseOn = () => false; S.horse = null; });
// the crew: a lent hand with the ribbon, a hand who stayed with the pin, on every facing
await ev(() => { S.npcs = S.npcs.filter(n => n.state !== 'companion'); for (let i = 0; i < 3; i++) { const n = NPC.gen({ at: 'haven' }); n.state = 'companion'; n.cx = S.px + 40 * (i + 1); n.cy = S.py; n.lent = { town: 'mill', t: S.time }; if (i === 2) n.stays = { first: 'Halvard' }; S.npcs.push(n); } Render.faceWalker('S'); });
for (const [nm, d] of [['S', Math.PI / 2], ['E', 0], ['N', -Math.PI / 2]]) { await ev(d => { for (const n of NPC.party()) { n._dir = d; n._px = n.cx; n._py = n.cy; } }, d); await page.waitForTimeout(200); const p = await at(); await page.screenshot({ path: `shots/cs3_crew_${nm}.png`, clip: { x: Math.round(p.x - 40), y: Math.round(p.y - 110), width: 420, height: 170 } }); }
console.log('ERRORS', errors.length, errors.slice(0, 4).join(' | '));
await b.close();
