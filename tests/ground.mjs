/* ground.mjs — v3.21 THE BUILDS EARN THEIR GROUND: upgrade ladders with earned tiers, towers that
   fight back, the enterable room, the PO Box, and donation the whole road can SEE. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => {
  S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  S.flags.guideDone = true; S.orders.prioIdx = 99; WL.calm();
  S.banked = { ...S.banked, metal: 200, ceramic: 200, lumen: 40, wood: 40, provisions: 60 };
  S.flags.unlocks.kit = true; S.flags.unlocks.shelter = true; S.flags.unlocks.watchtower = true; S.flags.unlocks.zipline = true;
});

/* ---------- the upgrade ladder ---------- */
let r = await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 300, d.y - 160]); S.moveTo = null;
  State.addCargo(State.makeItem('kitTool')); State.addCargo(State.makeItem('kitTool')); State.addCargo(State.makeItem('kitTool'));
  Systems.tryBuild('generator');
  const g = S.structures.find(s2 => s2.type === 'generator' && !s2.echo);
  WL.tp([g.x + 20, g.y]); S.moveTo = null;
  const hasU = Systems.getInteractions().some(a => a.key === 'U');
  const a1 = Systems.auraOf(g);
  const m0 = S.banked.metal;
  const up2 = Systems.upgradeStruct(g);
  const a2 = Systems.auraOf(g);
  const up3 = Systems.upgradeStruct(g);
  const noMore = !Systems.upgradeStruct(g);
  window._gen = g.id;
  return { hasU, up2, up3, noMore, tier: g.tier, a1, a2, grew: a2 > a1 * 1.25, spent: m0 - S.banked.metal };
});
ok('U raises a build: two earned tiers, then it is FINISHED — and the twin burner\'s aura grows a third', r.hasU && r.up2 && r.up3 && r.noMore && r.tier === 3 && r.grew && r.spent === 32, JSON.stringify(r));
r = await ev(async () => {
  // the hearth housing HEALS whoever rests in its reach
  S.health = 60;
  const g = S.structures.find(s2 => s2.id === window._gen);
  WL.tp([g.x + 30, g.y]); S.moveTo = null;
  for (let i = 0; i < 40; i++) Systems.update(0.25, {});
  return { health: Math.round(S.health) };
});
ok('the hearth housing heals the walker by the fire', r.health > 62, JSON.stringify(r));
r = await ev(() => {
  const g = S.structures.find(s2 => s2.id === window._gen);
  const m0 = S.banked.metal; S.banked.metal = 0;
  const g2 = { id: 999123, type: 'watchtower', x: g.x + 400, y: g.y, hp: 100, by: 'you', likes: 0 };
  S.structures.push(g2);
  const refused = !Systems.upgradeStruct(g2);
  S.banked.metal = m0;
  const okUp = Systems.upgradeStruct(g2);
  return { refused, okUp, tier: g2.tier };
});
ok('an upgrade is PAID for — empty banks are refused, the horn goes up when the metal is real', r.refused && r.okUp && r.tier === 2, JSON.stringify(r));

/* ---------- the network fights back ---------- */
r = await ev(() => {
  // a tier-2 horn tower over a chasing runner: called out, slowed; tier-3 armed post knocks him flat
  const camp = DATA.camps[0];
  const tw = { id: 999200, type: 'watchtower', x: camp.x + camp.r * 0.7, y: camp.y, hp: 100, by: 'you', likes: 0, tier: 2 };
  S.structures.push(tw);
  WL.tp([camp.x + camp.r * 0.7 + 40, camp.y]); S.moveTo = null;
  S.cargo = S.cargo.filter(c => c.cat === 'tool'); State.addCargo(State.makeItem('food'));
  const cs = S.camps[camp.id]; cs.pacified = false;
  if (!cs.runners.length) Systems.update(0.05, {});
  const rr = cs.runners[0];
  rr.x = tw.x - 60; rr.y = tw.y; rr.cd = 0; rr.carry = null; rr.postCd = 0;
  const under = !!Systems.towerOver(rr.x, rr.y);
  Systems.update(0.25, {});
  const horn = (tw.hornCd || 0) > 0;
  tw.tier = 3; rr.x = tw.x - 40; rr.y = tw.y; rr.cd = 0; rr.postCd = 0;
  Systems.update(0.25, {});
  const knocked = rr.cd > 5;
  window._tw = tw.id;
  return { under, horn, knocked };
});
ok('the horn tower CALLS OUT a pursuer under its watch — and the armed post knocks him sprawling', r.under && r.horn && r.knocked, JSON.stringify(r));

/* ---------- donation the road can SEE ---------- */
r = await ev(() => {
  // ten crates of hand tools arm ten walkers; the near camp's claim shrinks and its feet slow
  const camp = DATA.camps[0];
  let stId = null, bd = 1e9;
  for (const id of DATA.stationOrder) { const d2 = U.dist(camp.x, camp.y, DATA.stations[id].x, DATA.stations[id].y); if (d2 < bd) { bd = d2; stId = id; } }
  if (bd > DATA.T.armedCampR) return { skip: true, bd };
  const cs = S.camps[camp.id]; cs.pacified = false;
  // stand between the shrunken claim and the full one: a threat before arming, none after
  const pd = camp.r * 0.88;
  WL.tp([camp.x + pd, camp.y]); S.moveTo = null;
  const rr = cs.runners[0];
  rr.x = camp.x + camp.r * 0.5; rr.y = camp.y; rr.cd = 0; rr.carry = null;
  const d0 = U.dist(rr.x, rr.y, S.px, S.py);
  for (let i = 0; i < 10; i++) Systems.update(0.25, {});
  const closedBefore = d0 - U.dist(rr.x, rr.y, S.px, S.py);
  for (let i = 0; i < DATA.T.armedSafe; i++) Systems.armWalker(stId);
  const armed = S.stations[stId].armed;
  rr.x = camp.x + camp.r * 0.5; rr.y = camp.y; rr.cd = 0;
  const d1 = U.dist(rr.x, rr.y, S.px, S.py);
  for (let i = 0; i < 10; i++) Systems.update(0.25, {});
  const closedAfter = d1 - U.dist(rr.x, rr.y, S.px, S.py);
  window._armedSt = stId;
  return { stId, armed, closedBefore: Math.round(closedBefore), closedAfter: Math.round(closedAfter) };
});
ok('TEN ARMED WALKERS shrink the near camp\'s claim — the same ground stops being hunted', r.skip || (r.armed >= 10 && r.closedBefore > 40 && r.closedAfter < r.closedBefore * 0.4), JSON.stringify(r));
r = await ev(() => {
  // and the town SAYS so — mail carries it, appreciation rises
  const stId = window._armedSt;
  const mail = S.mails.some(m => /walks armed/i.test(m.subj || ''));
  return { mail, appr: (S.stations[stId].appr || 0) >= 6 };
});
ok('the player is TOLD the area is safer because of them — the letter and the town\'s regard', r.mail && r.appr, JSON.stringify(r));

/* ---------- the room you can enter ---------- */
r = await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 520, d.y - 260]); S.moveTo = null;
  Systems.tryBuild('shelter');
  const sh = S.structures.find(s2 => s2.type === 'shelter' && !s2.echo);
  WL.tp([sh.x + 24, sh.y]); S.moveTo = null;
  const noDoorYet = !Systems.getInteractions().some(a => /Step inside/.test(a.label));
  Systems.upgradeStruct(sh);   // the room
  const door = Systems.getInteractions().some(a => /Step inside/.test(a.label));
  const entered = Systems.enterShelter(sh);
  window._sh = sh.id;
  return { noDoorYet, door, entered, inside: S.inside === sh.id };
});
ok('a tier-1 shelter has no door to speak of; THE ROOM opens one — and the walker steps inside', r.noDoorYet && r.door && r.entered && r.inside, JSON.stringify(r));
r = await ev(() => {
  // nothing with claws or made of grey follows you in
  S.stam = 10;
  S.wraiths.push({ x: S.px + 8, y: S.py, state: 'hunt', alert: 1, cd: 0, ph: 0 });
  const camp = DATA.camps[0]; const cs = S.camps[camp.id];
  for (let i = 0; i < 20; i++) Systems.update(0.25, {});
  const safe = !S.struggle && !S.dead;
  const rested = S.stam > 60;
  S.wraiths.length = 0;
  return { safe, rested, stillIn: !!S.inside };
});
ok('inside the room: the grey cannot grab, the claws cannot reach, and the body rests FAST', r.safe && r.rested && r.stillIn, JSON.stringify(r));
r = await ev(() => {
  // the bed: wounds close, cargo mends — and one step is a step out
  const sh = S.structures.find(s2 => s2.id === window._sh);
  Systems.upgradeStruct(sh);   // the bed
  S.health = 55;
  State.addCargo(State.makeItem('food')); S.cargo[S.cargo.length - 1].cond = 50;
  for (let i = 0; i < 40; i++) Systems.update(0.25, {});
  const healed = S.health > 60;
  const mended = S.cargo[S.cargo.length - 1].cond > 60;
  Systems.update(0.25, { right: true });
  const stepped = !S.inside;
  return { healed, mended, stepped };
});
ok('the bed heals and mends while you breathe — and any step is a step out', r.healed && r.mended && r.stepped, JSON.stringify(r));

/* ---------- the PO Box ---------- */
r = await ev(() => {
  const opts = Systems.buildOptions().map(o => o.type);
  const d = DATA.stations.haven;
  WL.tp([d.x - 240, d.y - 320]); S.moveTo = null;
  Systems.tryBuild('pobox');
  const bx = S.structures.find(s2 => s2.type === 'pobox');
  WL.tp([bx.x + 20, bx.y]); S.moveTo = null;
  S.cargo = S.cargo.filter(c => c.cat === 'tool');
  State.addCargo(State.makeItem('food'));
  State.addCargo(State.makeItem('tools'));
  State.addCargo({ ...State.makeItem('meds'), orderId: 5 });   // mission crate — THE LAW holds
  Systems.poboxStash(bx);
  const missionStays = S.cargo.some(c => c.orderId === 5);
  const boxed = (bx.box || []).length;
  Systems.poboxTake(bx);
  const back = S.cargo.filter(c => !c.orderId && c.cat !== 'tool').length;
  window._bx = bx.id;
  return { inBar: opts.includes('pobox'), built: !!bx, missionStays, boxed, back };
});
ok('the PO Box stashes the loose load — mission crates STAY on the back — and hands it all back', r.inBar && r.built && r.missionStays && r.boxed === 2 && r.back === 2, JSON.stringify(r));
r = await ev(() => {
  const bx = S.structures.find(s2 => s2.id === window._bx);
  const stId = window._armedSt || 'haven';
  const armed0 = S.stations.haven.armed || 0;
  // box the tools again and leave the lot for the walkers
  Systems.poboxStash(bx);
  const l0 = S.likes;
  Systems.poboxDonate(bx);
  const armedUp = Object.values(S.stations).some(s2 => (s2.armed || 0) > 0);
  return { emptied: (bx.box || []).length === 0, likes: S.likes > l0, armedUp };
});
ok('left for the walkers, the box empties by morning — tools ARM someone, the rest earns regard', r.emptied && r.likes && r.armedUp, JSON.stringify(r));

/* ---------- the cradled line ---------- */
r = await ev(() => {
  const d = DATA.stations.haven;
  const a = { id: 999301, type: 'zipline', x: d.x - 900, y: d.y - 900, hp: 100, by: 'you', likes: 0 };
  const b2 = { id: 999302, type: 'zipline', x: d.x - 900 + 1850, y: d.y - 900, hp: 100, by: 'you', likes: 0 };
  S.structures.push(a, b2);
  Systems.rebuildZipLinks();
  const before = S.zipLinks.some(l => l.includes(999301) && l.includes(999302));
  a.tier = 3;
  Systems.rebuildZipLinks();
  const after = S.zipLinks.some(l => l.includes(999301) && l.includes(999302));
  S.structures = S.structures.filter(s2 => s2.id !== 999301 && s2.id !== 999302);
  Systems.rebuildZipLinks();
  return { before, after };
});
ok('1850 units is too far for a line — until the CRADLED pylon reaches it', !r.before && r.after, JSON.stringify(r));

/* ---------- it all survives the save ---------- */
r = await ev(() => { State.save(); const raw = JSON.parse(localStorage.getItem('waylight_save_v1')); return { tiered: raw.structures.some(s2 => (s2.tier || 1) >= 3), boxKept: raw.structures.some(s2 => s2.type === 'pobox'), armedKept: Object.values(raw.stations).some(s2 => (s2.armed || 0) >= 10), insideClean: !raw.inside }; });
ok('tiers, the box, and the armed count all ride the save — the room does not trap the ghost of you', r.tiered && r.boxKept && r.armedKept && r.insideClean, JSON.stringify(r));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue'); await page.waitForTimeout(900);
r = await ev(() => ({ gen3: S.structures.some(s2 => s2.type === 'generator' && (s2.tier || 1) === 3), armed: Object.values(S.stations).some(s2 => (s2.armed || 0) >= 10), inside: S.inside || null }));
ok('after reload the hearth housing still stands raised and the armed watch still walks', r.gen3 && r.armed && !r.inside, JSON.stringify(r));

ok('no page errors across the whole suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log('\n=== GROUND (v3.21: upgrade ladders · towers that act · the room · the PO Box · armed donation) ===');
for (const line of results) console.log(line);
console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
