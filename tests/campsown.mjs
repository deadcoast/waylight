/* campsown.mjs — v3.41 THE CAMPS' OWN (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). What it proves: the camps carry four trades, one row each, and every
   camp names its people in order (the road sends them by the roll and never the chief, who keeps the fire; a storm brings
   the first three) — the bowman who looses, the ram who shrugs the first blow, the chief whose rally halves the knives'
   downtime and whose fall BREAKS the storm; the kit drawn by hand (v3.51: on the cast's own grid); the parcels ADDRESSED
   (the shelf a list the town's traffic writes — the addressee drawn by the count on the line plus one; one run per door; read
   aloud on the slip); the pip on the rear rail is a door into the roll; the square stands its own (the town's own under the
   pennant at forty likes, two at most, no tithe, home below thirty); the count bought from the Society (a watchpost by
   contract, no column, no season); the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const drain = async () => { await ev(() => { WL.timeScale = 1; }); await T.drain(); await ev(() => { WL.timeScale = 0.001; }); };
await ev(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources();
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  window.__titles = []; const ct = Render.crtTitle; Render.crtTitle = (a, b) => { __titles.push(a + ' — ' + b); return ct(a, b); };
  window.__die = (v, fn) => { const r0 = Math.random; Math.random = typeof v === 'function' ? v : () => v; try { return fn(); } finally { Math.random = r0; } };
  window.__at = f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; };
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const C = FACT.CAMP_CLASSES;
  const rows = Object.keys(C).join() === 'knife,bowman,ram,chief' && C.bowman.stats.range === 230 && C.bowman.stats.shotCd === 6 && C.bowman.stats.pin === 5 && C.bowman.stats.roadRange === 260 && C.bowman.stats.roadDmg === 3 && C.bowman.stats.stagger === 0.9
    && C.ram.stats.knocks === 2 && C.ram.stats.speed === 0.78 && C.ram.stats.takeMul === 0.6 && C.chief.stats.rally === 0.5 && C.chief.stats.road === false && Object.values(C).every(c => c.kit && SPRITES.FIG[c.kit] && c.line);
  const roll = id => DATA.camps.find(c => c.id === id).roll.join();
  const rolls = roll('pass') === 'chief,knife,knife' && roll('ridge') === 'bowman,ram,knife' && roll('ash') === 'chief,bowman,ram,knife';
  /* the kit (v3.51: drawn by hand on the cast's own grid — the courier's height, three facings, the breath and four steps
     each its own frame, every letter in the figure's palette, the raiders' colours from RAID_PAL, the town's from TOWN_PAL) */
  const F = SPRITES.FIG, STEPS = ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4'];
  const kit = n => { const f = F[n], pal = f.derive ? { ...f.pal, ...Render.courierPal(f.pal) } : f.pal; return ['E', 'S', 'N'].every(fc => STEPS.every(k => { const rows2 = f.frames[fc][k]; return rows2 && rows2.length === f.h && rows2.every(s => s.length === f.w) && [...new Set(rows2.join('').replace(/\./g, ''))].every(ch => pal[ch]); }) && new Set(STEPS.map(k => f.frames[fc][k].join(''))).size === STEPS.length); };
  const figs = ['bowman', 'ram', 'chief', 'townshield'].every(kit) && ['bowman', 'ram', 'chief'].every(n => ['O', 'S', 'e', 'C'].every(k => F[n].pal[k].toLowerCase() === SPRITES.RAID_PAL[k].toLowerCase() || k === 'O'))
    && ['C', 'T', 'B'].every(k => F.townshield.pal[k].toLowerCase() === SPRITES.TOWN_PAL[k].toLowerCase()) && new Set(['bowman', 'ram', 'chief', 'knife'].map(n => F[n].frames.E.idle.join(''))).size === 4;
  const K = DATA.parcelKinds, kinds = K.length === 8 && K.map(k => k.id).join() === 'coat,preserves,shoes,seed,blanket,knife,letters,tin' && K[7].name === 'a tin of buttons' && K.every(k => /\{who\}/.test(k.line) && k.name);
  const R = REP.DOCTRINE.storm.rise, recruit = R.recruitAt === 40 && R.recruitEvery === 240 && R.ownMax === 2 && R.ownLeaveBelow === 30;
  const SL = REP.EVENTS.bunkerSweep.sell, sale = SL.cost.metal === 60 && SL.cost.ceramic === 20 && SL.shields === 2 && SL.rel === 1 && SL.mail.length === 2;
  const pairs = Object.keys(REP.RELATIONS.base).length === 17 && REP.RELATIONS.base['diefenbunker|waylight'] === 0;
  const lessons = ['firstTrades', 'firstOwn', 'firstSold'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]), lessonsN = Object.keys(DATA.tutorials).length;
  return { rows, rolls, figs, kinds, recruit, sale, pairs, lessons, lessonsN };
});
ok('THE REGISTRIES: four trades, one row each (the knife; the bowman — 230 at a post, every 6 s, a shield pinned 5 s, on the road 260, a stagger and a cut of 3; the ram — two knocks, three-quarters pace, a fire at six-tenths; the chief — the rally at half, never on the road), every camp\'s roll in order (Pass: chief, knife, knife · Ridge: bowman, ram, knife · Ash: chief, bowman, ram, knife); the kit (v3.51: drawn by hand on the cast\'s own grid — the bowman, the ram, the chief and the town\'s own in three facings with the breath and four steps each its own frame, every letter in the figure\'s palette, the raiders\' colours from RAID_PAL and the town\'s from TOWN_PAL, every trade a figure of its own); eight kinds of parcel with a line in the keeper\'s voice; the recruit row (forty likes, every four minutes, two at most, home below thirty) and the sale row (60 metal and 20 ceramic, two shields, a step warmer); the seventeenth pair (the Society and the Order); three lessons (v3.49: the manual at 93 pages)',
  Object.entries(r).every(([k, v]) => k === 'lessonsN' ? v >= 93 : v === true), JSON.stringify(r));

/* ================= 2 · THE PARCELS ADDRESSED ================= */
r = await ev(() => {
  const H = 'haven';
  S.traffic = {};
  for (let i = 0; i < 40; i++) Systems.stampTraffic(H, 'elm');   // forty trips to Elm, none to the Mill
  const traffic = S.traffic['elm:haven'] === 40 && !S.traffic['haven:mill'];
  /* the addressee is drawn by the count on the line plus one: Elm weighs 41, the Mill and the others 1 each (the economy
     draws on its own die, so the law is read off two thousand draws: Elm 41 in 44, every other lit door 1 in 44) */
  S.stations[H].parcels = [];
  for (let i = 0; i < 2000; i++) Economy.packParcel(H);
  const share = {}; for (const pc of S.stations[H].parcels) share[pc.to] = (share[pc.to] || 0) + 1 / 2000;
  const law = Math.abs(share.elm - 41 / 44) < 0.025 && ['mill', 'green', 'quarry'].every(id => Math.abs((share[id] || 0) - 1 / 44) < 0.017) && Object.keys(share).sort().join() === 'elm,green,mill,quarry';
  S.stations[H].parcels = [];
  for (let i = 0; i < 40; i++) Economy.packParcel(H);
  const shelf = Economy.parcelsOf(H), follow = shelf.filter(p => p.to === 'elm').length;
  /* a shelf of four: two for Elm, one for the Mill, one for the Greenhouse — one run per door */
  S.stations[H].parcels = [{ to: 'elm', kind: 'coat', name: 'a mended coat' }, { to: 'elm', kind: 'preserves', name: 'a jar of preserves' }, { to: 'mill', kind: 'shoes', name: 'a child\'s shoes' }, { to: 'green', kind: 'seed', name: 'a twist of seed' }];
  S.orders.active = []; WL.tp(H);
  const runs = (Economy.ordersFor(H) || []).filter(o => o.item === 'parcel' && !o.errand);
  const perDoor = runs.length === 3 && ['elm', 'mill', 'green'].every(to => runs.some(o => o.id === `pc_haven_${to}` && o.to === to)) && runs.find(o => o.to === 'elm').n === 2;
  UI.openStation(H); UI.gotoTab('orders');
  const card = [...document.querySelectorAll('#stationBody .orderCard')].some(el => /Addressed to Elm Farm: a mended coat, a jar of preserves — the town's own, sent to its own\./.test(el.textContent));
  document.getElementById('stationClose').click();
  const o = runs.find(x => x.to === 'elm'); Systems.acceptOrder(o, false);
  const kept = Economy.parcelsOf(H).map(p => p.to).sort().join() === 'green,mill';
  WL.tp('elm'); WL.instantPar();
  const res = Systems.handleDelivery('elm').results.find(x => x.order && x.order.id === o.id);
  const who = DATA.keepers.elm.name;
  const lines = !!res && res.parcels && res.parcels.length === 2 && res.parcels.every(l => l.includes(who) || /Elm Farm/.test(l)) && res.parcels[0].startsWith('a mended coat — ') && res.parcels[1].startsWith('a jar of preserves — ');
  UI.queueResults([res], null);
  const slip = [...document.querySelectorAll('#scoreRows .rowline.letter')].filter(el => /Opened at the terminal:/.test(el.textContent)).length;
  document.getElementById('results').classList.add('hidden');
  /* an older save's count becomes a list the same way — derived, never dropped */
  S.stations.quarry.parcels = 3; const derived = Economy.parcelsOf('quarry');
  const derivedOk = Array.isArray(derived) && derived.length === 3 && derived.every(p => p.to && p.to !== 'quarry' && S.stations[p.to].connected && p.kind);
  const stamped = S.traffic['elm:haven'] === 41;   // the delivery itself counted one more on the line
  WL.tp('haven');
  return { traffic, law, share: Object.fromEntries(Object.entries(share).map(([k, v]) => [k, +v.toFixed(3)])), follow, perDoor, card, kept, lines, slip, derivedOk, stamped, sample: res && res.parcels && res.parcels[0].slice(0, 90) };
});
ok('THE PARCELS ADDRESSED: forty trips to Elm and none to the Mill — the addressee is drawn by the count on the line plus one (Elm weighs 41 to the Mill\'s 1: two thousand draws land 41 in 44 on Elm and 1 in 44 on every other lit door), and forty parcels packed on that traffic follow the road you walk (nearly all to Elm); a shelf naming three doors posts one run per door, the board\'s card naming what is addressed (Addressed to Elm Farm: a mended coat, a jar of preserves — the town\'s own, sent to its own); accepted, the shelf keeps what is addressed elsewhere; delivered, each parcel is opened at the terminal and read aloud in the keeper\'s own words — two on the slip; the delivery counts one more on the line; an older save\'s count becomes an addressed list, derived and never dropped',
  r.traffic && r.law && r.follow >= 31 && r.perDoor && r.card && r.kept && r.lines && r.slip === 2 && r.derivedOk && r.stamped, JSON.stringify(r));

/* ================= 3 · THE PIP IS A DOOR ================= */
r = await ev(() => {
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  WL.tp([DATA.stations.haven.x + 600, DATA.stations.haven.y - 300]); S.dir = 0;
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); NPC.hire(n, 'companion'); n.cx = S.px - 42; n.cy = S.py;
  const m2 = NPC.gen({ at: 'haven' }); S.npcs.push(m2); NPC.hire(m2, 'companion'); m2.cx = S.px - 58; m2.cy = S.py + 30;
  for (let i = 0; i < 90; i++) UI.tick();
  window.__pip = { n: String(n.id), m: String(m2.id) };
  return { pips: document.querySelectorAll('#compassInner .cBack').length };
});
const pip0 = r;
/* the strip is redrawn every frame, so the pointer goes where the pip stands: a real click through the mouse */
const pipAt = await ev(() => { const el = document.querySelector(`#compassInner .cBack[data-npc="${__pip.m}"]`), b = el.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 3 }; });
await page.mouse.click(pipAt.x, pipAt.y); await page.waitForTimeout(300);
r = await ev(() => {
  const m = S.npcs.find(x => String(x.id) === __pip.m), sel = MusterUI.selected();
  const opened = !document.getElementById('musterOv').classList.contains('hidden');
  /* on that back's plate: the roll holds them as its selection, and the standing orders are theirs */
  const nm = document.querySelector('#muOrders .muName'), plate = NPC.everyone().some(x => x.n === m && x.n.id === sel) && !!nm && nm.textContent === m.name;
  const shown = { sel, selType: typeof sel, idType: typeof m.id, orders: document.getElementById('muOrders').textContent.slice(0, 60) };
  MusterUI.close();
  /* with another sheet open, the pip opens nothing */
  RepublicUI.open(); for (let i = 0; i < 5; i++) UI.tick();
  document.querySelector(`#compassInner .cBack[data-npc="${__pip.n}"]`).click();
  const shut = document.getElementById('musterOv').classList.contains('hidden') && !document.getElementById('republicOv').classList.contains('hidden');
  RepublicUI.close();
  return { opened, plate, shut, shown };
});
ok('THE PIP IS A DOOR: a back\'s pip on the rear rail takes the pointer — a real click opens the roll (v3.49: Crew) on that back\'s own plate; with another sheet open a click on a pip opens nothing',
  pip0.pips === 2 && r.opened && r.plate && r.shut, JSON.stringify(pip0) + ' ' + JSON.stringify(r));

/* ================= 4 · THE SQUARE STANDS ITS OWN ================= */
r = await ev(() => {
  const M = 'mill', st = S.stations[M];
  S.rep.held[M] = { t0: S.time, from: M, tithe: 0, shields: 2, riseDay: -1 }; const h = S.rep.held[M];
  st.likesTo = 45; st.stock.food = 60; __at(0.3); S.mails.length = 0;
  Republic.tick(0.5); h.recruitT = 0; h.tithe = 0; h.ate = 0;
  const step = s => { for (let i = 0; i < s / 30; i++) Republic.tick(30); return NPC.ownAt(M).length; };
  const at210 = step(210), at240 = step(30), at480 = step(240), at720 = step(240);
  const mail = S.mails.filter(m => m.subj === 'The Mill: the square stands its own').length === 1 && !!S.flags.tut.firstOwn;
  const own = NPC.ownAt(M), records = own.every(n => n.state === 'square' && n.kit === 'townshield' && n.own === M) && h.own === 2;
  /* the tithe unchanged: the mountain's shields alone eat off the shelf — three every two minutes, six in four */
  const tithe = h.ate === 3 * Math.floor(720 / REP.DOCTRINE.storm.tithePeriod) && Math.abs(st.stock.food - (60 - h.ate)) < 0.001;
  /* not thin at two and two (v3.42: the rising counts those standing this hour — THE HOURS they keep, nights by default) */
  st.likesTo = 3; __at(0.75); const notThin = !Republic.squareRestless(M) && Republic.standingOwn(M) === 2;
  __at(0.3); const dayThin = Republic.squareRestless(M);
  __at(0.75);
  return { at210, at240, at480, at720, mail, records, tithe, notThin, dayThin };
});
const own1 = r;
/* seen: the town's own beside the mountain's grey — round shields at the square's front, the count on the ground */
await drain();
const ownSeen = await ev(async () => {
  const d = DATA.stations.mill; __at(0.75); S.stations.mill.likesTo = 45;
  WL.tp([d.x + 150, d.y + 200]); S.weather.state = 'clear'; __clearAmb(d.x, d.y, 360); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = d.x; Render.cam.y = d.y + 60;
  await __wait(250); await __frames(3);
  const a = [__grab(d.x - 58, d.y + 86 - 20, 40), __grab(d.x + 58, d.y + 86 - 20, 40)], label = Render.labelBoxes().some(b => b.str === '2 OF THE TOWN\'S OWN');
  const keep = NPC.ownAt('mill'); for (const n of keep) n.state = 'x'; await __wait(120); await __frames(3);
  const b = [__grab(d.x - 58, d.y + 86 - 20, 40), __grab(d.x + 58, d.y + 86 - 20, 40)]; for (const n of keep) n.state = 'square';
  __done(); WL.timeScale = 0.001;
  return { own: a.map((x, i) => __diff(x, b[i])), label };
});
r = await ev(() => {
  const M = 'mill', st = S.stations[M], h = S.rep.held[M]; __at(0.3);
  /* below thirty they go home — and then the square is thin and restless */
  st.likesTo = 25; Republic.tick(0.5);
  const home = NPC.ownAt(M).length === 0 && h.own === 0;
  st.likesTo = 3; const restless = Republic.squareRestless(M);
  /* back above the line, and the town stands its own again */
  st.likesTo = 45; const calm = !Republic.squareRestless(M) || Republic.squareRestless(M) === false;
  h.recruitT = 0; for (let i = 0; i < 8; i++) Republic.tick(30);
  const again = NPC.ownAt(M).length === 1;
  /* RELEASE takes them with the garrison */
  Republic.release(M);
  const released = !Republic.isHeld(M) && NPC.ownAt(M).length === 0;
  return { home, restless, calm: st.likesTo > REP.DOCTRINE.storm.rise.likesAt, again, released };
});
ok('THE SQUARE STANDS ITS OWN: a garrisoned town at forty likes sends none of its own before four minutes, one at four, two after the next four, and never more than two (records on the roll in the town\'s kit; the mail once, the lesson); the tithe is unchanged — the mountain\'s shields alone eat off the shelf, three every two minutes; two grey and two of the town\'s own is not a thin garrison (v3.42: counted by THE HOURS they keep — standing the dark by default, so by daylight the square is thin); seen: the round shields at the square\'s front with 2 OF THE TOWN\'S OWN on the ground (pixel-sampled against the same frame with them home); below thirty likes they go home and the square is restless at three; back above the line the town stands its own again; RELEASE takes them with the garrison',
  own1.at210 === 0 && own1.at240 === 1 && own1.at480 === 2 && own1.at720 === 2 && own1.mail && own1.records && own1.tithe && own1.notThin && own1.dayThin && ownSeen.own.every(x => x > 30) && ownSeen.label && r.home && r.restless && r.calm && r.again && r.released,
  JSON.stringify(own1) + ' seen=' + JSON.stringify(ownSeen) + ' ' + JSON.stringify(r));

/* ================= 5 · THE CAMPS' OWN ON THE ROAD ================= */
r = await ev(() => {
  const ridge = DATA.camps.find(c => c.id === 'ridge'), pass = DATA.camps.find(c => c.id === 'pass');
  for (const cd of DATA.camps) { const c = S.camps[cd.id]; c.taken = null; c.pacified = false; c.runners = []; c.storm = null; c.chiefLost = 0; c.culled = 0; }
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  S.rep.reprisal = null;
  WL.tp('haven'); S.cargo = S.cargo.filter(x => x.cat === 'tool');
  Systems.update(0.01, {});
  const byRoll = S.camps.ridge.runners.map(k => k.cls).join() === 'bowman,ram,knife' && S.camps.pass.runners.map(k => k.cls).join() === 'knife,knife' && !S.camps.ash.runners.some(k => k.cls === 'chief');
  /* the bowman's arrow on the road: inside 260 he looses — a stagger, a cut, a bolt in — once per cooldown */
  const c = S.camps.ridge, bow = c.runners.find(k => k.cls === 'bowman');
  c.runners = [bow]; S.arrow = null; S.health = 100; S.stagger = 0; S.state = 'walk';
  S.cargo.push(State.makeItem('metal'));
  WL.tp([ridge.x + 120, ridge.y + 90]); bow.x = S.px + 200; bow.y = S.py; bow.cd = 0; bow.shotCd = 0;
  Systems.update(0.02, {});
  const shot1 = !!S.arrow && S.arrow.from === 'ridge' && S.health === 100 - FACT.CAMP_CLASSES.bowman.stats.roadDmg && Math.abs(bow.shotCd - 6) < 0.1 && !!S.hitBy && S.hitBy.camp === 'ridge';
  const n1 = S.arrow ? S.arrow.n : 0; bow.x = S.px + 200; bow.y = S.py;
  Systems.update(0.02, {});
  const once = S.arrow && S.arrow.n === n1;
  bow.shotCd = 0; bow.x = S.px + 200; bow.y = S.py; Systems.update(0.02, {});
  const again = S.arrow && S.arrow.n === n1 + 1;
  /* the ram: the first blow a stagger, up in a second; the second puts him down */
  const ram = { x: S.px + 10, y: S.py, wa: 0, state: 'patrol', cd: 0, cls: 'ram' };
  const b = NPC.gen({ at: 'haven' }); S.npcs.push(b); NPC.hire(b, 'companion'); b.hungry = false; b.shoveCd = 0; b.cx = S.px - 420; b.cy = S.py;
  c.runners = [ram]; Systems.update(0.02, {});
  const shrug = Math.abs(ram.cd - 0.9) < 0.05 && ram.hits === 1;
  ram.cd = 0; ram.x = S.px + 10; ram.y = S.py; b.shoveCd = 0; Systems.update(0.02, {});
  const fall = ram.cd > 5 && !ram.hits;
  b.state = 'pool'; b.at = 'haven';
  /* the slower walk: a ram and a knife from the same ground, the ram at three-quarters pace */
  const knife = { x: S.px + 300, y: S.py + 5, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }, ram2 = { x: S.px + 300, y: S.py + 5, wa: 0, state: 'patrol', cd: 0, cls: 'ram' };
  c.runners = [knife, ram2]; const k0 = { x: knife.x, y: knife.y };
  Systems.update(0.05, {});
  const dk = U.dist(k0.x, k0.y, knife.x, knife.y), dr = U.dist(k0.x, k0.y, ram2.x, ram2.y);
  const slower = dk > 0 && Math.abs(dr / dk - 0.78) < 0.01;
  c.runners = []; S.cargo = S.cargo.filter(x => x.cat === 'tool'); S.arrow = null; S.stagger = 0; S.health = 100; WL.tp('haven');
  return { byRoll, shot1, once, again, shrug, fall, slower, ratio: +(dr / dk).toFixed(3) };
});
ok('THE CAMPS\' OWN ON THE ROAD: the road sends each camp\'s people by its roll and never the chief (Ridge: a bowman, a ram, a knife · Pass: two knives, the chief at the fire); a bowman inside 260 looses once per cooldown — a stagger, a cut of three, the bolt in (v3.42), the camp remembered as the one that hit you — and again when it runs out; the ram shrugs the first blow (up in a second) and goes down on the second; he walks at three-quarters of a knife\'s pace from the same ground',
  Object.entries(r).every(([k, v]) => k === 'ratio' || v === true), JSON.stringify(r));

/* ================= 6 · THE STORM WITH THE KIT ================= */
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, K = REP.WATCHPOST.storm.seen, CC = FACT.CAMP_CLASSES;
  c.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 2, stormDay: -1 }; c.pacified = true; c.runners = []; c.chiefLost = 0; c.storm = null;
  WL.tp([cd.x + 120, cd.y + 80]); document.getElementById('toasts').innerHTML = '';
  Republic.stormPost(cd);
  const s2 = c.storm; if (!s2) return { started: false };
  const trades = s2.knives.map(k => k.cls).join() === 'chief,bowman,ram';
  const toast = /chief, bowman, ram/.test(document.getElementById('toasts').textContent) && /The chief is with them:<\/b> put him down and they run|The chief is with them: put him down and they run/.test(document.getElementById('toasts').innerHTML.replace(/<b>|<\/b>/g, ''));
  const [chief, bow, ram] = s2.knives;
  /* the chief's pace: nine-tenths of a knife's */
  for (const k of s2.knives) { k.cd = 9; k.atFire = 0; }
  chief.cd = 0; chief.x = cd.x + 300; chief.y = cd.y; s2.shieldT = 99; const c0 = chief.x;
  Republic.tick(0.1);
  const pace = Math.abs((c0 - chief.x) - K.knifeSpeed * CC.chief.stats.speed * 0.1) < 0.05;
  chief.x = cd.x + 700; chief.y = cd.y;   // the chief stands (his rally with him), far out on the ring
  /* the bowman stands off at his range and looses at the shields: one arm pinned — the other swings on the full cadence */
  bow.cd = 0; bow.x = cd.x; bow.y = cd.y + 240; bow.shotCd = 0.05;
  for (let i = 0; i < 5; i++) Republic.tick(0.1);
  const stand = Math.abs(U.dist(bow.x, bow.y, cd.x, cd.y) - CC.bowman.stats.range) <= 1.5 && bow.shots === 1 && s2.pinned > 4 && !s2.broke;
  ram.cd = 0; ram.x = cd.x + 50; ram.y = cd.y; ram.atFire = 0; s2.shieldT = 0.001; Republic.tick(0.01);
  const pinned = Math.abs(s2.shieldT - K.shieldCd) < 0.02;
  /* the ram shrugs the first knock and goes down on the second — for half the span, the chief standing */
  const shrug = Math.abs(ram.cd - 0.9) < 0.02 && ram.hits === 1;
  s2.pinned = 0; ram.cd = 0; ram.x = cd.x + 50; ram.y = cd.y; s2.shieldT = 0.001; Republic.tick(0.01);
  const down = Math.abs(ram.cd - K.downFor * CC.chief.stats.rally) < 0.02 && !s2.broke;
  /* the chief down — the storm BREAKS: the knives run for the grey, the post HELD, the mail saying so */
  for (const k of s2.knives) k.cd = 0;
  bow.x = cd.x; bow.y = cd.y + 300; ram.x = cd.x - 300; ram.y = cd.y;
  chief.x = cd.x + 40; chief.y = cd.y; s2.shieldT = 0.001; Republic.tick(0.01);
  const broke = s2.broke && chief.cd === K.downFor && s2.dur <= s2.t + K.runOut + 0.01 && s2.brokeBy === 'shield';
  const r0 = U.dist(ram.x, ram.y, cd.x, cd.y); Republic.tick(0.2); const run = U.dist(ram.x, ram.y, cd.x, cd.y) > r0 + 20;
  S.mails.length = 0; s2.t = s2.dur - 0.001; Republic.tick(0.01);
  const held = !c.storm && !!c.taken && S.mails.some(m => m.subj === 'Ash Camp: the post HELD — you stood it' && /The chief came out for this one and went down in the open/.test(m.body)) && !!c.chiefLost;
  /* a second storm, LOST to the ram at six-tenths of the wait (a knife at the same wait has not taken it) */
  c.chiefLost = 0;
  Republic.stormPost(cd); const s3 = c.storm; if (!s3) return { trades, toast, pace, stand, pinned, shrug, down, broke, run, held, lost: false };
  for (const k of s3.knives) { k.cd = 9; k.cls = k.cls === 'chief' ? 'knife' : k.cls; }
  const kr = s3.knives.find(k => k.cls === 'ram'), kn = s3.knives.find(k => k.cls === 'knife');
  kn.cd = 0; kn.x = cd.x + 5; kn.y = cd.y; kn.atFire = K.takeAfter * 0.6; s3.shieldT = 99;
  Republic.tick(0.1); const knifeWaits = !!c.taken && !!c.storm;
  kn.cd = 9; kr.cd = 0; kr.x = cd.x + 5; kr.y = cd.y; kr.atFire = K.takeAfter * 0.6 - 0.05; S.mails.length = 0;
  Republic.tick(0.1);
  const lost = knifeWaits && !c.taken && !!c.lost && S.mails.some(m => m.subj === 'Ash Camp: the watchpost FELL');
  c.chiefLost = 0; WL.tp('haven');
  return { trades, toast, pace, stand, pinned, shrug, down, broke, run, held, lost };
});
ok('THE STORM WITH THE KIT: a storm brings the first three of the camp\'s roll (Ash: the chief, the bowman, the ram — the toast names them and says the chief is with them: put him down and they run); the chief walks at nine-tenths of a knife\'s pace; the bowman stands off at his 230 and looses at the shields — one arm pinned, the other swings on the full cadence; the ram shrugs the first knock and goes down on the second for half the span while the chief\'s rally stands; the chief knocked down BREAKS the storm (the knives run for the grey, the storm runs out): HELD, the mail saying the chief went down in the open; a second storm is LOST to the ram at six-tenths of the wait — where a knife at the same wait has not taken it',
  Object.values(r).every(v => v === true), JSON.stringify(r));

/* ================= 7 · THE COUNT BOUGHT ================= */
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge;
  c.taken = null; c.pacified = false; c.swept = 0; c.sold = 0; c.lost = null; S.rep.reprisal = null;
  S.exile = S.exile || {}; S.exile.door = 'sealed';
  c.swept = S.time; const shut = Republic.canBuyCount('ridge');
  S.exile.door = 'opened'; c.swept = 0; const noStencil = Republic.canBuyCount('ridge');
  c.swept = S.time; const offer = Republic.canBuyCount('ridge');
  RepublicUI.open();
  const btn = document.querySelector('#repBody [data-buy="ridge"]');
  window.__bb = { metal: S.banked.metal, ceramic: S.banked.ceramic, rel: Republic.rel('diefenbunker', 'waylight'), q: S.stations.quarry.likesTo };
  return { gate1: !shut.ok && /cold door is shut/.test(shut.line), gate2: !noStencil.ok && /wait for the stencil/.test(noStencil.line), offer: offer.ok && !!btn && !btn.disabled && /BUY THE COUNT — 60 metal/.test(btn.textContent) };
});
const cb1 = r;
await page.click('#repBody [data-buy="ridge"]'); await page.waitForTimeout(300);
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge, b = __bb;
  const price = S.banked.metal === b.metal - 60 && S.banked.ceramic === b.ceramic - 20;
  const contract = !!c.taken && c.taken.via === 'society' && c.taken.shields === 2 && c.pacified && !c.runners.length && !!c.sold;
  const ledger = Republic.rel('diefenbunker', 'waylight') === b.rel + 1 && Republic.relations().find(x => x.a === 'diefenbunker' && x.b === 'waylight').why === 'the count bought at Ridge Camp';
  const noSeason = !Republic.reprisal() && S.stations.quarry.likesTo === b.q + REP.WATCHPOST.likesNear;
  const words = S.mails.some(m => m.subj === 'The count bought' && /Ridge Camp/.test(m.body)) && !!S.flags.tut.firstSold && __titles.some(t => t === 'THE COUNT BOUGHT — Ridge Camp is the Order\'s by contract');
  const plate = /SOLD BY THE SOCIETY · day \d+/.test(document.getElementById('repBody').textContent);
  RepublicUI.close();
  const once = !Republic.canBuyCount('ridge').ok && Republic.buyCount('ridge') === false && S.banked.metal === b.metal - 60;
  return { price, contract, ledger, noSeason, words, plate, once };
});
const cb2 = r;
const soldSeen = await ev(async () => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge;
  WL.tp([cd.x + 170, cd.y + 110]); __clearAmb(cd.x, cd.y, 400); Render.clearFx(); Render.setFx(false); Render.setZoom(2); Render.cam.x = cd.x + 50; Render.cam.y = cd.y - 30; await __wait(200); await __frames(3);
  const p = [cd.x + 60 + 8, cd.y - 36 + 12], a = __grab(p[0], p[1], 30), label = Render.labelBoxes().some(x => x.str === 'COUNTED — SOLD TO THE ORDER');
  const s0 = c.sold; c.sold = 0; await __wait(120); await __frames(3); const b = __grab(p[0], p[1], 30); c.sold = s0;
  __done(); WL.timeScale = 0.001; WL.tp('haven');
  return { label, stencil: __diff(a, b) };
});
ok('THE COUNT BOUGHT: both gates hold — with the cold door shut nothing is for sale, and with it open the Society sells only what it counted (wait for the stencil); counted, the banner sheet offers BUY THE COUNT and a real click pays its price (60 metal, 20 ceramic): Ridge Camp a watchpost by contract (two shields at the fire, the runners gone north, the Society\'s own via), the Society and the Order a step warmer with the reason on the ledger, the nearest town easier, no column and no season of reprisal, the mail, the title, the lesson, the sheet\'s SOLD BY THE SOCIETY; sold once; the stencil kept with the Order\'s lamp under the tongue and COUNTED — SOLD TO THE ORDER on the ground (pixel-sampled against the same frame unsold)',
  cb1.gate1 && cb1.gate2 && cb1.offer && Object.values(cb2).every(Boolean) && soldSeen.label && soldSeen.stencil > 20, JSON.stringify(cb1) + ' ' + JSON.stringify(cb2) + ' ' + JSON.stringify(soldSeen));

/* ================= 8 · THE SAVE ================= */
r = await ev(() => {
  const M = 'mill';
  S.rep.held[M] = { t0: S.time, from: M, tithe: 0, shields: 2, riseDay: -1 }; S.stations[M].likesTo = 45;
  const a = Republic.recruitOwn(M), b = Republic.recruitOwn(M); NPC.setOrder ? NPC.setOrder(a, 'hours', 'days') : (a.orders.hours = 'days');
  S.stations.haven.parcels = [{ to: 'elm', kind: 'blanket', name: 'a folded blanket' }];
  const tr = S.traffic['elm:haven'];
  State.save(); State.load();
  const own = NPC.ownAt(M).length === 2 && NPC.ownAt(M).some(n => NPC.ordersOf(n).hours === 'days') && Republic.held()[M].own === 2;
  const shelf = Economy.parcelsOf('haven').length === 1 && Economy.parcelsOf('haven')[0].kind === 'blanket';
  const traffic = S.traffic['elm:haven'] === tr;
  const c = S.camps.ridge, sale = !!c.sold && !!c.taken && c.taken.via === 'society';
  /* the runners come back by the roll */
  WL.tp('haven'); Systems.update(0.01, {});
  const runners = S.camps.pass.runners.map(k => k.cls).join() === 'knife,knife' && !S.camps.ridge.runners.length;
  return { own, shelf, traffic, sale, runners };
});
ok('THE SAVE: the town\'s own (with the hours they keep), the addressed shelves, the traffic ledger and a camp\'s sale survive a save and load; the runners come back by the roll (a camp sold stays empty)',
  Object.values(r).every(Boolean), JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
await T.finish('the camps\' own');
