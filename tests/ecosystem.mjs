/* ecosystem.mjs — v3.27 THE ECOSYSTEM (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). Utilities ride the pack, works hold the ground, the loop revolves: the
   terminal's Fabricate sheet opened by a real click on its two shelves with the loop law at the counter and a loop line for
   every utility; the build bar's works on real keys; the three siting laws honest on the one-truth path (workSiteOk), on the
   ghost and on the build path, a bad site refused with the kit kept on the back and nothing paid; a work paying — the bank,
   its lifetime count, the all-time tally, the earn chip under its name, the puff at the site, the first-pay lesson; the grey
   weather running the still at double; the sawcamp and the forrester sharpening each other at ×1.25, measured on both
   clocks; disrepair holding the clock with nothing paid and a repair of five metal starting it again; the armed post's
   tithe; the room's drying rack paying where meadow grows and saying NO MEADOW IN REACH where none does; the Records tab's
   ecosystem block; and the loop closed — every banked resource with a sited source, and what the works pay printing a kit. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok, drain } = T;

/* the valley lit, the Walker's hands full of kits, the build bar's unlocks earned; a finder for a lit, walkable site where a
   work's siting law says yes or no, clear of every other build */
await ev(() => {
  for (const id of DATA.stationOrder) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true); S.flags.fkIntro = true;
  Object.assign(S.flags.unlocks, { kit: true, flare: true, shelter: true, watchtower: true, zipline: true });
  S.cargo = S.cargo.filter(c => c.cat !== 'tool'); S.orders.active = [];
  Object.assign(S.banked, { metal: 400, ceramic: 200, wood: 120, lumen: 60, provisions: 80 });
  S.weather.state = 'clear'; WL.timeScale = 0.001;
  window.__site = (type, want, near, skip = []) => {
    let best = null, bd = 1e9;
    for (let y = 80; y < DATA.H - 80; y += 40) for (let x = 80; x < DATA.W - 80; x += 40) {
      if (World.lightAt(x, y) < 0.5 || World.lightAt(x, y + 40) < 0.45) continue;
      const t = World.terrainAt(x, y), t2 = World.terrainAt(x, y + 40); if (t.blocked || t.water || t2.blocked || t2.water) continue;
      if (Systems.workSiteOk(type, x, y).ok !== want) continue;
      if (S.structures.some(s => U.dist(s.x, s.y, x, y) < 300) || skip.some(p => U.dist(p.x, p.y, x, y) < 300)) continue;
      if (DATA.stationOrder.some(id => U.dist(DATA.stations[id].x, DATA.stations[id].y, x, y) < 200)) continue;
      const d = U.dist(x, y, near.x, near.y); if (d < bd) { bd = d; best = { x, y }; }
    }
    return best;
  };
  /* the sim stepped by hand: the clock the works read, advanced in known steps (the loop's own clock held still) */
  window.__step = (secs, dt = 0.5, before) => { for (let t = 0; t < secs - 1e-9; t += dt) { if (before) before(); S.weather.state = S.__wx || 'clear'; Systems.update(Math.min(dt, secs - t), {}); } };
});

const TUNE = await ev(() => ({ workSynergy: DATA.T.workSynergy, titheRate: DATA.T.titheRate, rackRate: DATA.T.rackRate }));

/* ================= 1 · THE TWO SHELVES ================= */
await ev(() => { WL.tp('haven'); UI.openStation('haven'); });
await page.waitForTimeout(300); await drain();
await page.click('#stationTabs [data-tab="fab"]'); await page.waitForTimeout(300);
const shelves = await ev(() => {
  const body = document.getElementById('stationBody') || document.querySelector('#stationOv .body') || document.getElementById('stationOv');
  const txt = body.textContent, rows = [...body.querySelectorAll('.rowline')].map(r => r.textContent);
  const loops = DATA.fabItems.map(f => { const row = rows.find(t => t.includes(f.name)); const m = row && row.match(/↻\s*([^\n]+)/); return { id: f.id, line: m ? m[1].trim() : null }; });
  const tab = [...document.querySelectorAll('#stationTabs .tab')].map(b => b.textContent);
  return { utilities: /UTILITIES — WHAT RIDES THE PACK/.test(txt), works: /WORKS — WHAT HOLDS THE GROUND/.test(txt), law: /One loop, revolving: works PAY the bank while they stand mended/.test(txt) && /repairs feed metal back/.test(txt), loops, tab };
});
await ev(() => document.getElementById('stationClose').click());
ok('THE TWO SHELVES: a real click on the terminal\'s Fabricate tab (v3.49: the plain names) opens on the split named in the register\'s voice — UTILITIES, what rides the pack · WORKS, what holds the ground — with the loop law printed at the counter (works pay while they stand mended, the bank prints utilities and kits, kits raise works, repairs feed metal back) and a ↻ loop line on every utility saying what it eats and what it feeds',
  shelves.utilities && shelves.works && shelves.law && shelves.tab.includes('Fabricate') && shelves.loops.length === 3 && shelves.loops.every(l => l.line && /^eats /.test(l.line) && l.line.includes('·')),
  JSON.stringify(shelves));

/* ================= 2 · THE BUILD BAR'S WORKS ================= */
await ev(() => { WL.tool('kitTool', 1); WL.tp('haven'); S.py += 120; });
await page.keyboard.press('KeyB'); await page.waitForTimeout(250);
const bar = await ev(() => { const el = document.getElementById('buildBar'); return { shown: !el.classList.contains('hidden'), opts: [...el.querySelectorAll('.buildOpt')].map(o => ({ type: o.dataset.b, k: o.querySelector('.k').textContent, name: o.querySelector('h5').textContent, cost: o.querySelector('.costs').textContent, no: o.classList.contains('no') })) }; });
const sawKey = (bar.opts.find(o => o.type === 'sawcamp') || {}).k;
if (sawKey) await page.keyboard.press('Digit' + sawKey);
await page.waitForTimeout(150);
const hung = await ev(() => { const p = S.place ? S.place.type : null; Systems.cancelPlace(true); return p; });
const cost = t => (bar.opts.find(o => o.type === t) || {}).cost;
ok('THE BUILD BAR\'S WORKS: B opens the bar with the production works on it beside the standing builds — Sawcamp, Clay oven, Lumen still, each at its cost (10 metal + 4 wood · 8 metal + 6 wood · 14 metal + 6 ceramic) — nine works on the bar\'s nine keys; the sawcamp\'s digit, pressed, hangs its blueprint',
  bar.shown && bar.opts.length === 9 && bar.opts.map(o => o.k).join() === '1,2,3,4,5,6,7,8,9' && ['sawcamp', 'clayoven', 'lumenstill'].every(t => bar.opts.some(o => o.type === t && !o.no))
  && bar.opts.find(o => o.type === 'sawcamp').name === 'Sawcamp' && cost('sawcamp') === '10 metal + 4 wood' && cost('clayoven') === '8 metal + 6 wood' && cost('lumenstill') === '14 metal + 6 ceramic' && hung === 'sawcamp',
  JSON.stringify({ bar, hung }));

/* ================= 3–5 · THE SITING LAWS: one truth, the ghost, the build path ================= */
const siting = type => ev(async type => {
  const H = DATA.stations.haven, good = __site(type, true, H), bad = __site(type, false, H, good ? [good] : []);
  if (!good || !bad) return { type, good, bad };
  const truth = { good: Systems.workSiteOk(type, good.x, good.y), bad: Systems.workSiteOk(type, bad.x, bad.y) };
  const try1 = async (at) => {
    WL.tp([at.x, at.y + 40]); S.cargo = S.cargo.filter(c => c.defId !== 'kitTool'); WL.tool('kitTool', 1);
    Systems.beginPlace(type); Systems.update(0.02, { hover: { x: at.x, y: at.y } });
    const ghost = { valid: S.place.valid, why: S.place.why, x: Math.round(S.place.x), y: Math.round(S.place.y) };
    const bank0 = { ...S.banked }, n0 = S.structures.length;
    const placed = Systems.confirmPlace();
    const kit = State.countTool('kit'), paid = Object.keys(bank0).some(k => S.banked[k] !== bank0[k]), built = S.structures.length - n0;
    Systems.cancelPlace(true);
    /* the other door in: the build path itself, handed the same spot */
    let direct = null;
    if (!placed) { const k0 = State.countTool('kit'); direct = { ok: Systems.tryBuild(type, { x: at.x, y: at.y }), kitKept: State.countTool('kit') === k0 }; }
    return { ghost, placed, kit, paid, built, direct };
  };
  const onBad = await try1(bad), onGood = await try1(good);
  const st = S.structures.find(s => s.type === type && U.dist(s.x, s.y, good.x, good.y) < 2);
  /* the same work set down on the bad ground by other means is named by the one truth the ledger reads */
  const fake = { id: -7, type, x: bad.x, y: bad.y, hp: 100, by: 'you' };
  const badState = Systems.workState(fake).s;
  const terrain = { mistGood: World.mistBase(good.x, good.y), mistBad: World.mistBase(bad.x, bad.y), forestGood: !!World.nearestForest(good.x, good.y, DATA.T.sawReach), forestBad: !!World.nearestForest(bad.x, bad.y, DATA.T.sawReach), stillMist: DATA.T.stillMist };
  return { type, good, bad, truth, onBad, onGood, standing: !!st, goodState: st ? Systems.workState(st).s : null, badState, terrain };
}, type);
const lawOk = (r, why) => r.good && r.bad && r.truth.good.ok && !r.truth.bad.ok && r.truth.bad.why === why && r.onBad.ghost.valid === false && r.onBad.ghost.why === why
  && r.onBad.placed === false && r.onBad.kit === 1 && !r.onBad.paid && r.onBad.built === 0 && r.onBad.direct && r.onBad.direct.ok === false && r.onBad.direct.kitKept
  && r.onGood.ghost.valid && r.onGood.placed && r.onGood.kit === 0 && r.onGood.paid && r.onGood.built === 1 && r.standing && r.goodState === 'WORKING' && r.badState === 'BAD SITE';
const still = await siting('lumenstill');
ok('THE STILL\'S SITE: a lumen still wants the veil thick at its site (mistBase at or over 0.22 — the light\'s edge, not its heart): the one truth says so, the ghost hung over lit ground in the light\'s heart reads WANTS THE VEIL — SITE IT NEARER THE GREY before the kit is spent, the click is refused and the build path refuses it too, the kit kept and nothing paid; at the veil\'s edge it raises and works, and the same still on the heart\'s ground is named BAD SITE',
  lawOk(still, 'WANTS THE VEIL — SITE IT NEARER THE GREY') && still.terrain.mistGood >= still.terrain.stillMist && still.terrain.mistBad < still.terrain.stillMist, JSON.stringify(still));
const saw = await siting('sawcamp');
ok('THE SAWCAMP\'S SITE: a sawcamp wants a treeline in reach (240): away from the forest the ghost reads WANTS A TREELINE IN REACH, the click and the build path refuse it with the kit kept and nothing paid; by the trees it raises and works; the one truth names it BAD SITE on open ground',
  lawOk(saw, 'WANTS A TREELINE IN REACH') && saw.terrain.forestGood && !saw.terrain.forestBad, JSON.stringify(saw));
const oven = await siting('clayoven');
ok('THE OVEN\'S SITE: a clay oven wants wet ground close (marsh or shallows within 160): on dry ground the ghost reads WANTS WET GROUND CLOSE, the click and the build path refuse it with the kit kept and nothing paid; by the water it raises and works; the one truth names it BAD SITE on the dry',
  lawOk(oven, 'WANTS WET GROUND CLOSE'), JSON.stringify(oven));

/* ================= 6 · A WORK PAYS ================= */
const pays = await ev(async () => {
  const st = S.structures.find(s => s.type === 'sawcamp'); if (!st) return null;
  WL.tp([st.x, st.y + 40]);
  const puffs = [], p0 = Render.puff; Render.puff = (x, y) => { puffs.push([Math.round(x), Math.round(y)]); return p0(x, y); };
  S.flags.tut.firstWork = false; S.eco.produced = {};
  const before = { wood: S.banked.wood, made: st.made || 0 };
  st.workT = DATA.T.sawRate - 0.8; __step(1.0, 0.5);
  Render.puff = p0;
  await __wait(600); await __frames(2);   // the chip counts up before it is read
  const chip = [...document.querySelectorAll('#earnFeed .earnChip.mat')].map(c => c.textContent);
  return { before, after: { wood: S.banked.wood, made: st.made }, tally: { ...S.eco.produced }, chip, puffs, site: [Math.round(st.x), Math.round(st.y - 8)], lesson: !!S.flags.tut.firstWork, workT: st.workT };
});
ok('A WORK PAYS: the sawcamp\'s clock comes round (a unit a 75 s) and the unit lands everywhere at once — the bank\'s wood up one, the work\'s own lifetime count, the all-works tally, an earn chip under the work\'s name (+1 Sawcamp), a puff at the site, and the first-pay lesson',
  !!pays && pays.after.wood === pays.before.wood + 1 && pays.after.made === pays.before.made + 1 && pays.tally.wood === 1 && pays.chip.some(t => /\+1/.test(t) && /Sawcamp/.test(t))
  && pays.puffs.length === 1 && pays.puffs[0][0] === pays.site[0] && pays.puffs[0][1] === pays.site[1] && pays.lesson && pays.workT < 1,
  JSON.stringify(pays));

/* ================= 7 · THE STORM IS A HARVEST ================= */
const storm = await ev(() => {
  const st = S.structures.find(s => s.type === 'lumenstill'); if (!st) return null;
  WL.tp([st.x, st.y + 40]);
  st.workT = 0; S.__wx = 'clear'; __step(12, 0.5); const clear = st.workT;
  st.workT = 0; S.__wx = 'grey'; __step(12, 0.5); const grey = st.workT; S.__wx = 'clear';
  const L0 = S.banked.lumen; st.workT = DATA.T.stillRate - 0.6; S.__wx = 'clear'; __step(0.5, 0.5); const paidClear = S.banked.lumen - L0;
  const L1 = S.banked.lumen; st.workT = DATA.T.stillRate - 0.6; S.__wx = 'grey'; __step(0.5, 0.5); const paidGrey = S.banked.lumen - L1; S.__wx = 'clear';
  return { clear, grey, ratio: grey / clear, paidClear, paidGrey };
});
ok('THE STORM IS A HARVEST: the same twelve seconds run the lumen still\'s clock twice as far in grey weather as in clear — and the same half-second before its pay banks the lumen in the grey and not in the clear',
  !!storm && Math.abs(storm.clear - 12) < 0.01 && Math.abs(storm.ratio - 2) < 0.01 && storm.paidClear === 0 && storm.paidGrey === 1, JSON.stringify(storm));

/* ================= 8 · THE SAW AND THE AXE ================= */
const synergy = await ev(() => {
  const st = S.structures.find(s => s.type === 'sawcamp'); if (!st) return null;
  const tree = World.nearestForest(st.x, st.y, DATA.T.sawReach); if (!tree) return { tree: null };
  const home = DATA.stationOrder.slice().sort((a, b) => U.dist(DATA.stations[a].x, DATA.stations[a].y, tree.x, tree.y) - U.dist(DATA.stations[b].x, DATA.stations[b].y, tree.x, tree.y))[0];
  const n = NPC.gen({ at: home }); S.npcs.push(n);
  const assigned = NPC.assignField(n, home, 'forrester');
  const pin = () => { n.fx = tree.x; n.fy = tree.y; n.ftarget = tree; n.shiftT = 999; };
  /* the axe's clock: with the sawcamp standing by the stand, then with it gone to disrepair */
  pin(); n.fwork = 0; __step(3.2, 0.4, pin); const axeWith = n.fwork;
  const hp0 = st.hp; st.hp = 20; pin(); n.fwork = 0; __step(3.2, 0.4, pin); const axeWithout = n.fwork; st.hp = hp0;
  /* the saw's clock: with the forrester at the stand, then with the forrester off the land */
  pin(); st.workT = 0; __step(12, 0.4, () => { pin(); n.fwork = 0; }); const sawWith = st.workT;
  n.state = 'idle'; st.workT = 0; __step(12, 0.4); const sawWithout = st.workT;
  S.npcs.splice(S.npcs.indexOf(n), 1);
  return { assigned, home, near: Math.round(U.dist(tree.x, tree.y, st.x, st.y)), axeWith, axeWithout, axe: axeWith / axeWithout, sawWith, sawWithout, saw: sawWith / sawWithout };
});
ok('THE SAW AND THE AXE: a forrester felling on the sawcamp\'s stand works the tree ×1.25 faster than with the camp in disrepair, and the camp saws ×1.25 faster while the forrester works there than with the forrester off the land — the synergy mutual, measured on both clocks',
  !!synergy && synergy.assigned && Math.abs(synergy.axe - TUNE.workSynergy) < 0.01 && Math.abs(synergy.saw - TUNE.workSynergy) < 0.01 && TUNE.workSynergy === 1.25, JSON.stringify(synergy));

/* ================= 9 · DISREPAIR HOLDS THE CLOCK ================= */
const dis = await ev(() => {
  const st = S.structures.find(s => s.type === 'clayoven'); if (!st) return null;
  WL.tp([st.x, st.y + 40]);
  st.hp = DATA.T.workHpMin - 3; st.workT = DATA.T.ovenRate - 2; const c0 = S.banked.ceramic, m0 = st.made || 0;
  const state = Systems.workState(st).s; __step(20, 0.5, () => { st.hp = DATA.T.workHpMin - 3; });
  return { state, workT: st.workT, held: Math.abs(st.workT - (DATA.T.ovenRate - 2)) < 1e-9, paid: S.banked.ceramic - c0, made: (st.made || 0) - m0 };
});
ok('DISREPAIR HOLDS THE CLOCK: a clay oven under 30% mended is in DISREPAIR — twenty seconds from its pay, its clock does not move and nothing is paid',
  !!dis && dis.state === 'DISREPAIR' && dis.held && dis.paid === 0 && dis.made === 0, JSON.stringify(dis));

/* ================= 10 · THE REPAIR FEEDS THE LOOP ================= */
await ev(() => { const st = S.structures.find(s => s.type === 'clayoven'); WL.tp([st.x, st.y + 30]); Systems.update(0.3, {}); });
const promptSeen = await ev(() => Systems.getInteractions().find(i => /^Repair Clay oven — 5 metal/.test(i.label.replace(/<[^>]+>/g, ''))) ? true : false);
const metal0 = await ev(() => S.banked.metal);
await page.keyboard.press('KeyE'); await page.waitForTimeout(150);
const rep = await ev(() => {
  const st = S.structures.find(s => s.type === 'clayoven');
  const r = { hp: st.hp, state: Systems.workState(st).s };
  const c0 = S.banked.ceramic; __step(2.5, 0.5); r.paid = S.banked.ceramic - c0; return r;
});
const repM = await ev(() => S.banked.metal);
ok('THE REPAIR FEEDS THE LOOP: at the oven the prompt offers the repair for five metal; E pays it — five metal out of the bank, the oven mended whole, WORKING again, and its held clock runs on to pay the slab it was two seconds from',
  promptSeen && metal0 - repM === 5 && rep.hp > 99.99 && rep.state === 'WORKING' && rep.paid === 1, JSON.stringify({ promptSeen, metal0, rep, metalNow: repM }));

/* ================= 11 · THE SPOTTER'S TITHE ================= */
const tithe = await ev(() => {
  const H = DATA.stations.haven;
  const at = __site('lumenstill', false, { x: H.x + 400, y: H.y - 300 }) || { x: H.x + 400, y: H.y - 300 };
  WL.tp([at.x, at.y + 40]); S.cargo = S.cargo.filter(c => c.defId !== 'kitTool'); WL.tool('kitTool', 1);
  const built = Systems.tryBuild('watchtower', { x: at.x, y: at.y }); const st = S.structures.find(s => s.type === 'watchtower' && U.dist(s.x, s.y, at.x, at.y) < 2);
  if (!st) return { built };
  const infoT1 = Systems.workInfo(st);
  const m0 = S.banked.metal; const up1 = Systems.upgradeStruct(st), m1 = S.banked.metal, infoT2 = Systems.workInfo(st), up2 = Systems.upgradeStruct(st), m2 = S.banked.metal;
  const info = Systems.workInfo(st);
  st.workT = DATA.T.titheRate - 0.6; const b0 = S.banked.metal; __step(1, 0.5);
  return { built, infoT1, infoT2, up1, up2, cost1: m0 - m1, cost2: m1 - m2, tier: st.tier, info, paid: S.banked.metal - b0, state: Systems.workState(st).s };
});
ok('THE SPOTTER\'S TITHE: a watchtower pays nothing at its first two tiers; raised to its armed post (the horn for eight metal, the post for sixteen metal and eight ceramic), it sweeps the spotter\'s tithe — 1 metal every 110 s into the bank',
  tithe.built && tithe.infoT1 === null && tithe.infoT2 === null && tithe.up1 && tithe.up2 && tithe.cost1 === 8 && tithe.cost2 === 16 && tithe.tier === 3
  && tithe.info.kind === 'metal' && tithe.info.rate === TUNE.titheRate && tithe.info.label === 'Spotter\'s tithe' && tithe.paid === 1 && tithe.state === 'WORKING', JSON.stringify(tithe));

/* ================= 12 · THE DRYING RACK, AND THE HONEST NO ================= */
const rack = await ev(() => {
  const meadowNear = (x, y) => { for (let a = 0; a < 8; a++) if (World.classAt(x + Math.cos(a / 8 * 7) * DATA.T.rackReach * 0.8, y + Math.sin(a / 8 * 7) * DATA.T.rackReach * 0.8) === World.MEADOW) return true; return World.classAt(x, y) === World.MEADOW; };
  let green = null, bare = null;
  const H = DATA.stations.haven;
  for (let y = 100; y < DATA.H - 100 && !(green && bare); y += 50) for (let x = 100; x < DATA.W - 100; x += 50) {
    const t = World.terrainAt(x, y); if (t.blocked || t.water) continue;
    if (!green && World.lightAt(x, y) > 0.5 && meadowNear(x, y) && U.dist(x, y, H.x, H.y) < 900 && !S.structures.some(s => U.dist(s.x, s.y, x, y) < 300)) green = { x, y };
    if (!bare && !meadowNear(x, y)) bare = { x, y };
  }
  if (!green || !bare) return { green, bare };
  const mk = at => { const st = { id: U.uid(), type: 'shelter', x: at.x, y: at.y, ang: 0, hp: 100, by: 'you', likes: 0 }; S.structures.push(st); return st; };
  const a = mk(green), b2 = mk(bare);
  const t1 = { a: Systems.workInfo(a), b: Systems.workInfo(b2) };
  Systems.upgradeStruct(a); Systems.upgradeStruct(b2);
  const info = Systems.workInfo(a), sa = Systems.workState(a).s, sb = Systems.workState(b2).s;
  a.workT = DATA.T.rackRate - 0.6; b2.workT = DATA.T.rackRate - 0.6; const p0 = S.banked.provisions; WL.tp([green.x, green.y + 40]); __step(1, 0.5);
  return { green, bare, t1, tierA: a.tier, tierB: b2.tier, info, sa, sb, paid: S.banked.provisions - p0, heldB: b2.workT };
});
ok('THE DRYING RACK, AND THE HONEST NO: a shelter pays nothing until the room; with the room, where meadow grows in reach its drying rack banks provisions (1 every 120 s) — and a room raised where no meadow grows says NO MEADOW IN REACH and pays nothing, its clock held',
  !!rack.info && rack.t1.a === null && rack.t1.b === null && rack.tierA === 2 && rack.tierB === 2 && rack.info.kind === 'provisions' && rack.info.rate === TUNE.rackRate && rack.info.label === 'Drying rack'
  && rack.sa === 'WORKING' && rack.sb === 'NO MEADOW IN REACH' && rack.paid === 1 && Math.abs(rack.heldB - (TUNE.rackRate - 0.6)) < 1e-9, JSON.stringify(rack));

/* ================= 13 · THE LEDGER READS IT ================= */
await ev(() => { WL.tp('haven'); UI.openStation('haven'); });
await page.waitForTimeout(250); await drain();
await page.click('#stationTabs [data-tab="ledger"]'); await page.waitForTimeout(300);
const ledger = await ev(() => {
  const body = document.getElementById('stationBody') || document.getElementById('stationOv'), rows = [...body.querySelectorAll('.rowline')].map(r => r.textContent.replace(/\s+/g, ' ').trim());
  const works = S.structures.map(s => Systems.workState(s)).filter(Boolean);
  const eco = rows.filter(t => /pays 1 (wood|ceramic|lumen|metal|provisions) \/ \d+s · made \d+ lifetime · \d+% mended/.test(t));
  const tally = rows.find(t => /^Produced, all works, all time/.test(t)) || '';
  const want = Object.entries(S.eco.produced).map(([k, v]) => `${k} ${v}`).join(' · ');
  const states = ['WORKING', 'NO MEADOW IN REACH'].every(s2 => eco.some(t => t.includes(s2)));
  const tab = [...document.querySelectorAll('#stationTabs .tab')].find(b => b.dataset.tab === 'ledger').textContent;
  const head = /The ecosystem/i.test(body.textContent);
  document.getElementById('stationClose').click();
  return { tab, head, n: works.length, rows: eco.length, eco: eco.slice(0, 7), tally, want, states };
});
ok('THE LEDGER READS IT: the terminal\'s Records tab (v3.49: the plain names — the station\'s ledger) carries the ecosystem block — every producing work on its own row from the one truth (its name, its state — WORKING, NO MEADOW IN REACH — its rate, its lifetime pay, its percent mended) and the all-works, all-time tally',
  ledger.tab === 'Records' && ledger.head && ledger.rows === ledger.n && ledger.n >= 6 && ledger.states && ledger.tally.includes(ledger.want) && ledger.want.length > 0, JSON.stringify(ledger));

/* ================= 14 · THE LOOP, CLOSED ================= */
const loop = await ev(() => {
  const kinds = [...new Set(S.structures.map(s => Systems.workInfo(s)).filter(Boolean).map(w => w.kind))].sort();
  const oven = S.structures.find(s => s.type === 'clayoven');
  WL.tp([oven.x, oven.y + 40]);
  Object.assign(S.banked, { metal: 16, ceramic: 7 }); S.cargo = S.cargo.filter(c => c.defId !== 'kitTool');
  const short = State.canAfford({ metal: 16, ceramic: 8 });
  oven.workT = DATA.T.ovenRate - 0.3; oven.hp = 100; __step(0.5, 0.5);
  return { kinds, short, afford: State.canAfford({ metal: 16, ceramic: 8 }), ceramic: S.banked.ceramic };
});
await ev(() => { WL.tp('haven'); UI.openStation('haven'); });
await page.waitForTimeout(250); await drain();
await page.click('#stationTabs [data-tab="fab"]'); await page.waitForTimeout(250);
const kitIdx = await ev(() => Systems.fabList('haven').findIndex(f => f.id === 'kit'));
const btnQuiet = await ev(i => { const b = document.querySelector(`[data-fab="${i}"]`); return b ? b.classList.contains('quiet') : null; }, kitIdx);
await page.click(`[data-fab="${kitIdx}"]`); await page.waitForTimeout(200);
const printed = await ev(() => { const r = { kits: State.countTool('kit'), bank: { metal: S.banked.metal, ceramic: S.banked.ceramic } }; document.getElementById('stationClose').click(); return r; });
ok('THE LOOP, CLOSED: every banked resource has an automated, sited source standing — metal (the spotter\'s tithe), wood (the sawcamp), ceramic (the clay oven), lumen (the still), provisions (the drying rack) — and what the works pay prints at the counter: a kit one slab short until the oven pays it, then a real click on Print puts the kit on the back and empties the bank into it',
  loop.kinds.join() === 'ceramic,lumen,metal,provisions,wood' && !loop.short && loop.afford && btnQuiet === false && printed.kits === 1 && printed.bank.metal === 0 && printed.bank.ceramic === 0,
  JSON.stringify({ loop, kitIdx, btnQuiet, printed }));

await ev(() => { WL.timeScale = 1; });
await T.finish('the ecosystem');
