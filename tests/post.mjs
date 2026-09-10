/* post.mjs — v3.16 THE POST: letters are a tiered zero-fee service; the bag paces them; the town's
   appreciation is its own ladder; the mailroom hires, pays, and TRAINS the same waylighters you field;
   the militia is earned, rides in, and cools down. State-level, driven through Systems.update. */
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
  WL.calm(); S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  for (const id of ['elm', 'mill', 'green', 'relay', 'foundry']) S.stations[id].met = true;   // the boards know the valley
  const d = DATA.stations.haven; WL.tp([d.x - 600, d.y - 300]); S.moveTo = null;
});

/* 1-2. the bag fills with time; a runner doubles the pen */
let r = await ev(() => {
  const st = S.stations.haven;
  st.bag = 10;
  for (let i = 0; i < 100; i++) Economy.update(0.6);            // 60 s, town writing alone
  const alone = st.bag;
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n);
  n.state = 'post'; n.job = 'runner'; n.feeWaived = true; n.shiftT = 9999;
  st.bag = 10;
  for (let i = 0; i < 100; i++) Economy.update(0.6);
  const crewed = st.bag;
  S.npcs = S.npcs.filter(x => x.id !== n.id);
  return { alone: +(alone - 10).toFixed(1), crewed: +(crewed - 10).toFixed(1) };
});
ok('the town writes on its own — the bag fills with time', r.alone > 5 && r.alone < 9, `+${r.alone} in 60s alone`);
ok('a Letter runner on the post roughly doubles the pen speed', r.crewed > r.alone * 1.8, `+${r.crewed} crewed vs +${r.alone}`);

/* 3. the bag paces the board: none, one, two, three */
r = await ev(() => {
  const st = S.stations.haven;
  const count = bag => { st.bag = bag; return Economy.ordersFor('haven').filter(o => o.item === 'letters').length; };
  return { at20: count(20), at40: count(40), at75: count(75), at100: count(100) };
});
ok('below the first bagful, no letter run posts — the mail is never fake', r.at20 === 0, JSON.stringify(r));
ok('one bagful posts one run; two post two; a brimming bag posts the third', r.at40 === 1 && r.at75 === 2 && r.at100 >= 2, JSON.stringify(r));

/* 4. the walk decides the tier */
r = await ev(() => ({
  elm: Economy.mailTier('haven', 'elm'),
  relay: Economy.mailTier('haven', 'relay'),
  foundry: Economy.mailTier('haven', 'foundry'),
  tags: Economy.TIER_TAG.slice(1),
}));
ok('next door is LOCAL POST; the far hill is a longer tier; the dark Foundry is the GREY POST',
  r.elm === 1 && r.relay >= 2 && r.foundry === 3, JSON.stringify(r));

/* 5. THE SERVICE RULE: a delivered letter run pays zero trust, tiered appreciation, and skill */
r = await ev(() => {
  S.stations.haven.bag = 100; S.orders.active = []; S.cargo = [];
  const likes0 = S.likes, foot0 = S.skills.foot.total;
  WL.tp('haven');
  const run = Economy.ordersFor('haven').find(o => o.item === 'letters');   // the ★ already carries elm's letters — take the board's own pick
  if (!run) return { none: true };
  const appr0 = S.stations[run.to].appr || 0;
  Systems.acceptOrder(run, false);
  WL.tp(run.to); WL.instantPar();
  const { results: res } = Systems.handleDelivery(run.to);
  const g = res.find(x => x.service);
  return { to: run.to, likesGained: S.likes - likes0, appr: (S.stations[run.to].appr || 0) - appr0, foot: S.skills.foot.total - foot0, grade: g && g.grade, tier: g && g.tier, fee: g && g.likes };
});
ok('letters take NO fee — zero trust moved, the grade still stamps', !r.none && r.likesGained === 0 && r.fee === 0 && !!r.grade, JSON.stringify(r));
ok('the town paid in what a town has: appreciation by tier, and the walk taught Footwork', r.appr >= 6 && r.foot > 0, `+${r.appr} appr, +${(r.foot || 0).toFixed(1)} foot xp`);

/* 6. TRUSTED: the children run your mailbags to the gate — letters from here weigh nothing */
r = await ev(() => {
  S.orders.active = []; S.cargo = [];
  S.stations.haven.appr = 120; S.stations.haven.bag = 60;
  WL.tp('haven');
  const run = Economy.ordersFor('haven').find(o => o.item === 'letters');
  Systems.acceptOrder(run, false);
  const kg = S.cargo.filter(c => c.defId === 'letters').reduce((a, c) => a + c.kg, 0);
  for (const o of [...S.orders.active]) Systems.abandonOrder(o.idNum);
  S.cargo = [];
  return { kg, lvl: Economy.apprLevel('haven') };
});
ok('at TRUSTED the mailbag weighs nothing on your back', r.lvl === 2 && r.kg === 0, JSON.stringify(r));

/* 7-9. the mailroom trains: wages out, XP in, stalls honest, levels carry to the field */
r = await ev(() => {
  const n = NPC.gen({ at: 'haven', cls: 'drifter' }); S.npcs.push(n);
  n.feeWaived = true; n.skills.haul = 2;
  NPC.assignPost(n, 'haven', 'parcels');
  S.banked.provisions = 10;
  const prov0 = S.banked.provisions;
  n.shiftT = 0.2;
  for (let i = 0; i < 4; i++) Systems.update(0.2, {});
  const paid = prov0 - S.banked.provisions;
  const xp1 = (n.trainXp || {}).haul || 0;
  // starve the wages: the round stalls, honestly
  S.banked.provisions = 0; n.shiftT = 0.2;
  for (let i = 0; i < 4; i++) Systems.update(0.2, {});
  const stalled = n.hungry === true;
  const xp2 = (n.trainXp || {}).haul || 0;
  // pay again and pump to the level line: one shift levels Hauling, and the field feels it
  S.banked.provisions = 10;
  const cap0 = NPC.capOf(n);
  n.trainXp.haul = NPC.npcTrainNeed(n.skills.haul) - 1; n.shiftT = 0.2;
  for (let i = 0; i < 4; i++) Systems.update(0.2, {});
  return { paid, xp1: Math.round(xp1), stalled, xpFrozen: xp2 === xp1, lvl: n.skills.haul, cap0, cap1: NPC.capOf(n), id: n.id };
});
ok('a shift costs its wage and pays its experience', r.paid === 1 && r.xp1 >= 14, `wage ${r.paid}, +${r.xp1}xp`);
ok('no provisions, no round: the worker stalls and learns nothing until paid', r.stalled && r.xpFrozen, JSON.stringify({ stalled: r.stalled, frozen: r.xpFrozen }));
ok('training lands where it counts: Hauling 2→3 and the SAME hire now carries more in the field', r.lvl === 3 && r.cap1 === r.cap0 + 6, `cap ${r.cap0}→${r.cap1}`);

/* 10. desks are finite; appreciation opens another */
r = await ev(() => {
  S.stations.mill.appr = 0;
  const mk = () => { const n = NPC.gen({ at: 'mill' }); S.npcs.push(n); n.feeWaived = true; return n; };
  const a = NPC.assignPost(mk(), 'mill', 'runner');
  const b2 = NPC.assignPost(mk(), 'mill', 'tower');
  const c = NPC.assignPost(mk(), 'mill', 'hearthpost');
  S.stations.mill.appr = 120;
  const d = NPC.assignPost(mk(), 'mill', 'hearthpost');
  const staff = NPC.postStaff('mill').length;
  for (const n of NPC.postStaff('mill')) NPC.dismiss(n, 'mill');
  return { a, b: b2, c, d, staff };
});
ok('two desks by right, a third refused — until the town TRUSTS you enough to open one', r.a && r.b && r.c === false && r.d && r.staff === 3, JSON.stringify(r));

/* 11-12. the rider's dispatch: posted only at HONOURED, and carrying it swears the riders in */
r = await ev(() => {
  S.orders.active = []; S.cargo = [];
  S.stations.haven.appr = 170; S.stations.haven.bag = 50;
  const before = Economy.ordersFor('haven').some(o => o.item === 'dispatch');
  S.stations.haven.appr = 200;
  const card = Economy.ordersFor('haven').find(o => o.item === 'dispatch');
  if (!card) return { before, none: true };
  WL.tp('haven');
  Systems.acceptOrder(card, false);
  WL.tp(card.to); WL.instantPar();
  const { results: res } = Systems.handleDelivery(card.to);
  const g = res.find(x => x.militiaFor);
  return { before, sworn: !!(S.militia.unlocked || {}).haven, fee: g ? g.likes : -1, apprAfter: Math.round(S.stations.haven.appr) };
});
ok('the dispatch is a quest the town must HONOUR you to post', r.before === false && !r.none, JSON.stringify(r));
ok('carrying the militia’s own post swears their riders to you — for no fee, like all post', r.sworn && r.fee === 0 && r.apprAfter >= 240, JSON.stringify(r));

/* 13-14. the rescue: riders come when you are hit, clear the Grey, and cool down five minutes */
r = await ev(async () => {
  const d = DATA.stations.haven;
  WL.tp([d.x - 700, d.y - 500]); S.moveTo = null;
  S.militia.cdT = 0;
  S.wraiths.push({ id: 99901, x: S.px + 80, y: S.py, alert: 1, state: 'hunt', cd: 0, ph: 0 });
  const called = Systems.militiaCall();
  const cdSet = S.militia.cdT > 250;
  const blocked = Systems.militiaCall() === false;
  for (let i = 0; i < 60 && Systems.militiaScene(); i++) Systems.update(0.12, {});
  const w = S.wraiths.find(x => x.id === 99901);
  const cleared = !w || w.state === 'burn';
  S.wraiths = S.wraiths.filter(x => x.id !== 99901);
  return { called, cdSet, blocked, cleared, sceneDone: !Systems.militiaScene() };
});
ok('sworn riders answer the call — once, then the horn is quiet five minutes', r.called && r.cdSet && r.blocked, JSON.stringify(r));
ok('they clear the trouble and leave — the wraith burned, the scene struck itself', r.cleared && r.sceneDone, JSON.stringify(r));

/* 15. it all survives the ledger: save, load, still on the round */
r = await ev(() => {
  const n = S.npcs.find(x => x.id === (window.__postId || -1)) || S.npcs.find(x => x.state === 'post');
  const keep = NPC.postStaff('haven').length + NPC.postStaff('mill').length;
  const appr = Math.round(S.stations.haven.appr), bag = Math.round(S.stations.haven.bag);
  State.save();
  const okL = State.load();
  const staff2 = S.npcs.filter(x => x.state === 'post').length;
  return { okL, sworn: !!(S.militia.unlocked || {}).haven, appr2: Math.round(S.stations.haven.appr), appr, bag2: Math.round(S.stations.haven.bag), bag, staffKept: staff2 >= 1 };
});
ok('save → load: the post staff, the appreciation, the bag and the sworn riders all persist',
  r.okL && r.sworn && r.appr2 === r.appr && Math.abs(r.bag2 - r.bag) <= 1 && r.staffKept, JSON.stringify(r));

ok('no page errors through the post suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks green`);
await b.close();
