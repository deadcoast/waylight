/* muster.mjs — v3.36 THE MUSTER: standing orders for the people who walk with you, on the ledgers'
   own engine, proven on the ground. The registries; the policy engine parameterized by store with
   the pack's ledger untouched; default orders (a Farkeeper walks in as THE SHIELD); STATION moving
   real feet (close, loose, point, two at one station in two slots); SWEEP gating what a back picks
   up; TAKE MY OVERFLOW lifting the heaviest allowed crate off yours (mission cargo never); MESS
   (their pack, the bank, a fast); STAND (quiet keeps hands down, hold screens you only); VOICE;
   presets and hand-set orders; the roll call in their own words; the sheet under the modal law
   with plates, the orders pane, the parent law on a walker's store, the wedge plate drawn; the
   save. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
await page.evaluate(() => { S.flags.guideDone = true; WL.calm(); });
const ev = (fn, arg) => page.evaluate(fn, arg);

/* ================= 1 · THE REGISTRIES, AND THE ENGINE PARAMETERIZED ================= */
let r = await ev(() => {
  const O = MUSTER.ORDERS, P = MUSTER.PRESETS, T2 = MUSTER.TREES;
  const ordersWhole = Object.values(O).every(row => row.name && row.line && row.choices[row.def] && Object.values(row.choices).every(c => c.name && c.line));
  const presetsWhole = Object.values(P).every(p => p.name && p.line && Object.keys(O).every(k => O[k].choices[p[k]]) && Object.keys(p.loot).every(n => Ledger.CHAIN[n]) && Object.keys(p.hand).every(n => Ledger.CHAIN[n]));
  const stations = Object.keys(MUSTER.STATIONS), slots = Object.values(MUSTER.STATIONS).every(s2 => s2.length === 3);
  const call = ['station', 'mess', 'stand'].every(k => Object.keys(O[k].choices).every(c => MUSTER.CALL[k][c]));
  /* the engine: the pack's wrappers equal the store-parameterized reads, for every item */
  const ids = Object.keys(DATA.items);
  const same = ids.every(id => Ledger.VERBS.every(v => Ledger.effective(id, v) === Ledger.effectiveIn(Ledger.led().policy, id, v)));
  const stSame = ['resources', 'curios', 'cargo'].every(n => Ledger.VERBS.every(v => Ledger.markState(n, v) === Ledger.markStateIn(Ledger.led().policy, n, v)));
  return { orders: Object.keys(O).length, ordersWhole, presets: Object.keys(P).length, presetsWhole, trees: Object.keys(T2).length, stations: stations.join(), slots, call, same, stSame };
});
ok('THE REGISTRIES: four scalar orders with defaults and lines, three trees (the freight list joined them in v3.37), five whole presets on the taxonomy, four stations of three slots, a roll-call word for every choice — and the pack\'s ledger reads IDENTICALLY through the store-parameterized engine',
  r.orders === 4 && r.ordersWhole && r.presets === 5 && r.presetsWhole && r.trees === 3 && r.stations === 'wedge,close,loose,point' && r.slots && r.call && r.same && r.stSame, JSON.stringify(r));

/* ================= 2 · DEFAULT ORDERS, AND A WALKER'S STORE APART FROM THE PACK'S ================= */
r = await ev(() => {
  const a = NPC.gen({ at: 'haven', cls: 'scavenger' }); a.name = 'Isolde Marrow'; a.skills.haul = 4; a.fee = { metal: 0, ceramic: 0 }; a.feeWaived = true;
  const k = NPC.gen({ at: 'haven', cls: 'courier' }); k.fk = true; k.fkCls = 'longbowmen'; k.name = 'Brenna Stonejaw'; k.fee = { metal: 0, ceramic: 0 }; k.feeWaived = true;
  S.npcs.push(a, k); NPC.hire(a, 'companion'); NPC.hire(k, 'companion');
  const oa = NPC.ordersOf(a), ok2 = NPC.ordersOf(k);
  const aPreset = oa.preset;   // read before the mark below clears it
  const packBefore = Ledger.markState('junk', 'scrap');
  NPC.setTreeMark(a, 'loot', 'junk', true);
  const packAfter = Ledger.markState('junk', 'scrap');
  return { aPreset, aStation: oa.station, kPreset: ok2.preset, kStation: ok2.station, kStand: ok2.stand,
    junkNow: NPC.allows(a, 'loot', 'junk_wire') || NPC.allows(a, 'loot', Object.keys(DATA.items).find(id => DATA.items[id].cat === 'junk')),
    presetCleared: NPC.ordersOf(a).preset === null, packUntouched: packBefore === packAfter, kLoot: NPC.allows(k, 'loot', 'metal') };
});
ok('DEFAULT ORDERS: a hire walks in as THE WALKER\'S OWN in the wedge, a Farkeeper as THE SHIELD at the elbow meeting everything and sweeping nothing — and a mark on a walker\'s store clears their preset and leaves the PACK\'S ledger untouched',
  r.aPreset === 'own' && r.aStation === 'wedge' && r.kPreset === 'shield' && r.kStation === 'close' && r.kStand === 'meet' && r.junkNow && r.presetCleared && r.packUntouched && r.kLoot === false, JSON.stringify(r));

/* ================= 3 · STATION moves real feet ================= */
const settle = async () => { await page.waitForTimeout(1600); return ev(() => { const pt = NPC.party(); const ca = Math.cos(S.dir), sa = Math.sin(S.dir); return pt.map(n => { const dx = n.cx - S.px, dy = n.cy - S.py; return { name: n.name.split(' ')[0], d: Math.round(Math.hypot(dx, dy)), ahead: Math.round(dx * ca + dy * sa) }; }); }); };
await ev(() => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 330]); S.dir = 0; for (const n of NPC.party()) NPC.setOrder(n, 'station', 'close'); });
const close = await settle();
await ev(() => { for (const n of NPC.party()) NPC.setOrder(n, 'station', 'loose'); });
const loose = await settle();
await ev(() => { for (const n of NPC.party()) NPC.setOrder(n, 'station', 'point'); });
const point = await settle();
r = await ev(() => { const pt = NPC.party(); return { apart: Math.round(Math.hypot(pt[0].cx - pt[1].cx, pt[0].cy - pt[1].cy)) }; });
ok('STATION is where they walk: CLOSE brings both inside 40 px, LOOSE sends both past 90, POINT puts both AHEAD of you — and two backs at one station take two slots, never one',
  close.every(x => x.d <= 40) && loose.every(x => x.d >= 90) && point.every(x => x.ahead >= 40) && r.apart >= 20, JSON.stringify({ close, loose, point, r }));

/* ================= 4 · SWEEP gates what a back picks up ================= */
r = await ev(() => new Promise(res => {
  for (const n of NPC.party()) NPC.setOrder(n, 'station', 'wedge');
  const a = NPC.party().find(n => n.name.startsWith('Isolde'));
  a.skills.haul = 4;   // a trained back: reach 170 + 2×45
  NPC.setTreeMark(a, 'loot', 'junk', false);
  const junkId = Object.keys(DATA.items).find(id => DATA.items[id].cat === 'junk');
  S.drops = [];
  S.drops.push({ id: U.uid(), item: State.makeItem(junkId), x: S.px + 90, y: S.py + 10 });
  setTimeout(() => {
    const refused = S.drops.length === 1 && !a.carry.some(c => c.defId === junkId);
    NPC.setTreeMark(a, 'loot', 'junk', true);
    setTimeout(() => res({ junkId, refused, swept: a.carry.some(c => c.defId === junkId), drops: S.drops.length, note: NPC.svc(a).last }), 3500);
  }, 3000);
}));
ok('SWEEP gates the looter: a junk drop inside reach stays on the ground with junk OFF — mark it ON and the same back walks over and takes it, and the service stripe says so',
  r.refused && r.swept && r.drops === 0 && /swept up/.test(r.note), JSON.stringify(r));

/* ================= 5 · TAKE MY OVERFLOW ================= */
r = await ev(() => new Promise(res => {
  const a = NPC.party().find(n => n.name.startsWith('Isolde')), k = NPC.party().find(n => n.fk);
  NPC.setOrder(a, 'station', 'wedge'); NPC.setOrder(k, 'station', 'wedge');
  a.carry = []; k.carry = [];
  NPC.setTreeMark(a, 'hand', 'cargo', false);   // nobody takes anything…
  NPC.setTreeMark(k, 'hand', 'cargo', false);
  S.cargo = S.cargo.filter(c => c.tool);
  const cap = State.cap();
  const mission = State.makeItem('metal', 'ORDER-1'); S.cargo.push(mission);
  while (State.weight() <= cap + 4) S.cargo.push(State.makeItem('metal'));
  const w0 = State.weight(), n0 = S.cargo.length;
  setTimeout(() => {
    const nothing = S.cargo.length === n0 && a.carry.length === 0 && k.carry.length === 0;
    NPC.setTreeMark(a, 'hand', 'resources', true);   // …then Isolde takes the overflow, resources only
    setTimeout(() => {
      const took = a.carry.filter(c => c.defId === 'metal').length;
      res({ cap, w0: Math.round(w0), nothing, took, missionStays: S.cargo.includes(mission), under: State.weight() <= State.cap(), note: NPC.svc(a).last, crates: NPC.svc(a).crates });
    }, 4500);
  }, 1600);
}));
ok('TAKE MY OVERFLOW: with every hand OFF an overloaded walker stays overloaded; mark resources ON and Isolde lifts scrap off your back, crate by crate, until you are under — the contract crate never moves',
  r.nothing && r.took >= 1 && r.missionStays && r.under && /off your back/.test(r.note) && r.crates >= 1, JSON.stringify(r));

/* ================= 6 · THE MESS ================= */
r = await ev(() => {
  const a = NPC.party().find(n => n.name.startsWith('Isolde'));
  a.hungry = false;
  /* their pack: a ration in the carry is eaten first, the bank untouched */
  NPC.setOrder(a, 'mess', 'own'); a.carry.push(State.makeItem('ration'));
  S.banked.provisions = 10; a.fedT = 0.01; NPC.update(0.05);
  const own = { ate: !a.carry.some(c => c.defId === 'ration'), bank: S.banked.provisions, fed: a.fedT > 100, meals: NPC.svc(a).meals };
  /* the bank: a banked provision */
  NPC.setOrder(a, 'mess', 'bank'); a.fedT = 0.01; NPC.update(0.05);
  const bank = { bank: S.banked.provisions, fed: a.fedT > 100 };
  /* a fast: nothing drawn, and hungry by orders */
  NPC.setOrder(a, 'mess', 'fast'); a.fedT = 0.01; NPC.update(0.05);
  const fast = { bank: S.banked.provisions, hungry: a.hungry, note: NPC.svc(a).last };
  NPC.setOrder(a, 'mess', 'bank'); a.hungry = false; a.fedT = 300;
  return { own, bank, fast };
});
ok('THE MESS: THEIR PACK eats the ration they carry and leaves the bank whole; THE BANK draws one provision; FAST draws nothing and the back goes hungry by orders',
  r.own.ate && r.own.bank === 10 && r.own.fed && r.own.meals >= 1 && r.bank.bank === 9 && r.bank.fed && r.fast.bank === 9 && r.fast.hungry && /fasting/.test(r.fast.note), JSON.stringify(r));

/* ================= 7 · THE STAND ================= */
r = await ev(() => {
  const k = NPC.party().find(n => n.fk), a = NPC.party().find(n => !n.fk);
  for (const n of NPC.party()) { n.hungry = false; n.shoveCd = 0; n.cx = S.px; n.cy = S.py; n.x = S.px; n.y = S.py; }
  const runner = at => ({ x: S.px + at, y: S.py, wa: 0, state: 'patrol', cd: 0 });
  NPC.setOrder(k, 'stand', 'quiet'); NPC.setOrder(a, 'stand', 'quiet');
  const quiet = NPC.intercept(runner(100)), shoveQuiet = NPC.tryShove();
  NPC.setOrder(k, 'stand', 'hold'); NPC.setOrder(a, 'stand', 'hold');
  const holdFar = NPC.intercept(runner(200));
  for (const n of NPC.party()) n.shoveCd = 0;
  const holdNear = NPC.intercept(runner(100));
  for (const n of NPC.party()) n.shoveCd = 0;
  NPC.setOrder(k, 'stand', 'meet'); NPC.setOrder(a, 'stand', 'meet');
  const meetFar = NPC.intercept(runner(260));   // the longbow's 320 reaches; hold would not
  for (const n of NPC.party()) n.shoveCd = 0;
  return { quiet, shoveQuiet, holdFar, holdNear, meetFar, met: NPC.svc(k).met + NPC.svc(a).met };
});
ok('THE STAND: QUIET keeps every hand down (no intercept, no shove); HOLD lets a runner at 200 walk and meets one at 100 — the screen around YOU; MEET IT answers at the longbow\'s full reach; met runners count on the stripe',
  r.quiet === false && r.shoveQuiet === false && r.holdFar === false && r.holdNear === true && r.meetFar === true && r.met >= 2, JSON.stringify(r));

/* ================= 8 · VOICE, PRESETS, THE ROLL CALL ================= */
r = await ev(() => {
  const a = NPC.party().find(n => !n.fk);
  const said = []; const realSay = Render.say; Render.say = (x, y, line, col) => { said.push(String(line)); };
  NPC.setOrder(a, 'voice', 'quiet'); a.hungry = false; a.barkT = 0.001; S.speed = 40; NPC.update(0.05);
  const quietSaid = said.length;
  NPC.setOrder(a, 'voice', 'talk'); a.barkT = 0.001; NPC.update(0.05);
  const talkSaid = said.length;
  /* the preset lands whole; the roll call speaks the orders in their own words */
  NPC.applyPreset(a, 'scout');
  const O = NPC.ordersOf(a);
  const scout = O.preset === 'scout' && O.station === 'point' && O.stand === 'hold' && O.mess === 'own' && O.voice === 'quiet' && NPC.allows(a, 'loot', 'letters') && !NPC.allows(a, 'loot', 'metal');
  said.length = 0;
  const called = NPC.rollCall();
  NPC.update(0.3); NPC.update(1.5); NPC.update(1.5);
  const lines = said.filter(l => /: /.test(l));
  Render.say = realSay; S.speed = 0;
  return { quietSaid, talkSaid, scout, called, lines, line: NPC.callLine(a) };
});
ok('VOICE quiet silences the road talk and talk restores it; THE SCOUT preset lands whole (point · hold · their pack · quiet · sweeps the post, not the scrap); CALL THE ROLL and every back sounds off its orders in its own words',
  r.quietSaid === 0 && r.talkSaid === 1 && r.scout && r.called && r.lines.length === 2 && r.lines.some(l => l.includes(r.line)) && /on point, holding your back, eating my own/.test(r.line), JSON.stringify(r).slice(0, 400));

/* ================= 9 · THE SHEET ================= */
await page.keyboard.press('KeyO'); await page.waitForTimeout(500);
r = await ev(() => {
  const ov = document.getElementById('musterOv');
  const open = !ov.classList.contains('hidden'), modal = UI.anyModal(), gated = UI.gateReport().join(' | ').includes('muster');
  const plates = document.querySelectorAll('#musterBody .muPlate').length, everyone = NPC.everyone().length;
  const figs = [...document.querySelectorAll('#musterBody .muFig img')].every(im => im.src.startsWith('data:image/png') && im.naturalWidth > 0);
  const html = document.getElementById('musterBody').innerHTML;
  const stripe = /<b>[\d.]+<\/b> km · <b>\d+<\/b> crates/.test(html), noTodo = !html.includes('TODO'), told = !!S.flags.tut.firstMuster;
  const presets = document.querySelectorAll('#muOrders [data-preset]').length, orders = document.querySelectorAll('#muOrders [data-order]').length, boxes = document.querySelectorAll('#muOrders .lgBox').length;
  const cv = document.getElementById('muWedge'), g = cv.getContext('2d');
  const px = g.getImageData(0, 0, cv.width, cv.height).data; let lit = 0; for (let i = 0; i < px.length; i += 4) if (px[i] > 60 || px[i + 1] > 60) lit++;
  return { open, modal, gated, plates, everyone, figs, stripe, noTodo, told, presets, orders, boxes, lit, sel: MusterUI.selected() };
});
ok('THE MUSTER ROLL opens on O under the modal law: a plate for everyone under your command with their OWN figure drawn, the service stripe, the orders pane (five presets, four orders on their choices, the tri-state marks) and a wedge plate that has actually been drawn',
  r.open && r.modal && r.gated && r.plates === r.everyone && r.plates >= 3 && r.figs && r.stripe && r.noTodo && r.told && r.presets === 5 && r.orders === 12 && r.boxes >= 40 && r.lit > 400 && !!r.sel, JSON.stringify(r));
r = await ev(() => {
  /* select the Farkeeper's plate; the parent law on HER store: click Resources OFF → every kid off, then Wood ON alone → parent MIXED */
  const k = NPC.party().find(n => n.fk);
  const pl = document.querySelector(`#musterBody .muPlate[data-mu="${k.id}"]`);
  if (!pl) return { dbg: 'no plate', open: !document.getElementById('musterOv').classList.contains('hidden'), plates: [...document.querySelectorAll('#musterBody .muPlate')].map(x => x.dataset.mu), kid: k.id, party: NPC.party().map(n => n.id) };
  pl.click();
  const selNow = MusterUI.selected() === k.id;
  NPC.applyPreset(k, 'own'); MusterUI.render();
  const box = (verb, node) => document.querySelector(`#muOrders .lgBox[data-tree="${verb}"][data-node="${node}"]`);
  box('loot', 'resources').click();
  const kidsOff = ['wood', 'metal', 'ceramic', 'lumen'].every(n => !box('loot', n).classList.contains('on'));
  box('loot', 'wood').click();
  const mixed = box('loot', 'resources').classList.contains('mixed'), woodOn = box('loot', 'wood').classList.contains('on');
  const allows = { wood: NPC.allows(k, 'loot', 'wood'), metal: NPC.allows(k, 'loot', 'metal') };
  document.querySelector('#muOrders [data-order="station"][data-choice="point"]').click();
  const pointSet = NPC.ordersOf(k).station === 'point', presetGone = NPC.ordersOf(k).preset === null;
  const esc = UI.escPressed();
  return { selNow, kidsOff, mixed, woodOn, allows, pointSet, presetGone, esc, closed: document.getElementById('musterOv').classList.contains('hidden') };
});
ok('THE PARENT LAW on one back\'s store: Resources OFF clears every child, Wood ON alone reads the parent MIXED — the engine says wood yes, metal no; a hand-set STATION clears the preset; ESC folds the roll',
  r.selNow && r.kidsOff && r.mixed && r.woodOn && r.allows.wood && !r.allows.metal && r.pointSet && r.presetGone && r.esc && r.closed, JSON.stringify(r));
r = await ev(() => ({ paper: PAPERS.some(p => p.id === 'muster' && p.key === 'muster'), key: KEYS.action('KeyO') === 'muster', title: !!DATA.tutorialTitles.firstMuster }));
ok('the muster is in the papers, on the keys, and in the manual\'s lessons', r.paper && r.key && r.title, JSON.stringify(r));

/* ================= 10 · THE SAVE ================= */
r = await ev(() => {
  const a = NPC.party().find(n => !n.fk), k = NPC.party().find(n => n.fk);
  NPC.setOrder(a, 'mess', 'own'); NPC.setTreeMark(a, 'hand', 'curios', true);
  const km = NPC.svc(a).km;
  State.save(); const loaded = State.load();
  const a2 = S.npcs.find(n => n.name === a.name), k2 = S.npcs.find(n => n.name === k.name);
  return { loaded, mess: NPC.ordersOf(a2).mess, curios: NPC.allows(a2, 'hand', 'relic_coin') || NPC.allows(a2, 'hand', Object.keys(DATA.items).find(id => DATA.items[id].cat === 'relic')), km: NPC.svc(a2).km === km, kStation: NPC.ordersOf(k2).station };
});
ok('THE SAVE carries every back\'s orders and service: the mess, the marks, the kilometres, the hand-set station', r.loaded && r.mess === 'own' && r.curios && r.km && r.kStation === 'point', JSON.stringify(r));

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the muster', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
