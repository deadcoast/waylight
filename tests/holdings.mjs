/* holdings.mjs — v3.34 THE HOLDINGS: the CK3 depth the Republic owed, proven on the ground.
   THE TAKING (gated on the road, marched, a camp taken and HELD as a watchpost: shields, a broken
   chase, the salvage tithe, the truce dead, the reprisal season, the mountain's stone — beside the
   light's own patient pacify), the world's own WARS from one registry (the doused bowl and the
   Keepers' aging ask, the Reapers' cull, the Unlit courting and HEAR THEM OUT, the reprisal), the
   RELATIONS ledger, the holdings view with an OWNER on every plate, and two more walked rooms
   (the long hall's shield wall / hearth fragments / yard hires; the guild room's board / counter /
   lantern fragments), the save, the modal law. */
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

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => ({
  take: !!REP.DOCTRINE.take && REP.DOCTRINE.take.needs === 'mountain' && REP.DOCTRINE.take.column === 5,
  post: !!REP.WATCHPOST && REP.WATCHPOST.tithePeriod > 0,
  events: Object.keys(REP.EVENTS), kinds: Object.values(REP.EVENTS).map(e => e.kind),
  rels: Object.keys(REP.RELATIONS.base).length, bands: REP.RELATIONS.bands.map(x => x[1]),
  rooms: Object.keys(REP.INTERIORS), styles: Object.keys(REP.ROOM_STYLES),
  every: Object.values(REP.INTERIORS).every(R => R.style && REP.ROOM_STYLES[R.style] && R.exitLine && R.hotspots.some(h => h.id === 'exit')),
}));
ok('THE REGISTRIES: a taking doctrine gated on the road, a watchpost row, four world events (strike/strike/court/reprisal), sixteen lore relations in five bands, three walked rooms each with a material style and a door out',
  r.take && r.post && r.events.length === 4 && r.kinds.join() === 'strike,strike,court,reprisal' && r.rels === 16 && r.bands.join() === 'WAR,FEUD,COLD,TRUCE,ALLIED' && r.rooms.length === 3 && r.styles.length === 3 && r.every, JSON.stringify(r).slice(0, 300));

/* ================= 2 · THE HOLDINGS VIEW, BEFORE THE ROAD ================= */
r = await ev(() => {
  Republic.tick(0.01);
  RepublicUI.open();
  const html = document.getElementById('repBody').innerHTML;
  const takes = [...document.querySelectorAll('#repBody [data-take]')];
  const out = { owners: ['THE ORDER', 'THE RAIDERS', 'THE FLAME KEEPERS', 'THE HOLLOW FIRES', 'NOBODY — DARK'].filter(o => html.includes(o)).length,
    heads: html.includes('THE WORLD ASKS') && html.includes("THE WORLD'S OWN WARS") && html.includes('EVERY PLACE, AND WHO HOLDS IT'),
    takeBtns: takes.length, allGated: takes.every(t => t.disabled), gateLine: html.includes('Farkeep takes no ground it cannot reach'),
    relRows: document.querySelectorAll('#repBody .rpRel').length, war: html.includes('>WAR<'), allied: html.includes('>ALLIED<'), noTodo: !html.includes('TODO') };
  RepublicUI.close();
  return out;
});
ok('THE HOLDINGS VIEW: every kind of place carries its OWNER on the plate, the world\'s wars and asks have their ledgers, and every TAKE stands GATED until the mountain road is cut', r.owners === 5 && r.heads && r.takeBtns === 3 && r.allGated && r.gateLine && r.relRows === 16 && r.war && r.allied && r.noTodo, JSON.stringify(r));

/* ================= 3 · THE TAKING ================= */
r = await ev(() => {
  const refused = Republic.fundTake('pass');
  S.banked.metal = 300; S.banked.wood = 200; S.banked.provisions = 200; S.banked.ceramic = 60;
  Republic.fundMountain(); Republic.mountain().t = REP.MOUNTAIN.dur + 1; Republic.tick(0.6);
  /* a truce stands — it will die with the first shield */
  S.renegade = 25; Republic.setStance('raiders', 'WARY');
  const truceBefore = Republic.truce();
  const near = (() => { let bId = 'haven', bd = 1e9; const cd = DATA.camps[0]; for (const id of DATA.stationOrder) { const d = U.dist(cd.x, cd.y, DATA.stations[id].x, DATA.stations[id].y); if (d < bd) { bd = d; bId = id; } } return bId; })();
  const likes0 = S.stations[near].likesTo;
  const funded = Republic.fundTake('pass');
  const q = Republic.quell();
  const marching = q && q.kind === 'take' && q.camp === 'pass' && q.pts.length > 1 && q.col === 5;
  const lead = Republic.columnPos(0.3, 0);
  /* the arrival, the casualty roll FORCED */
  const mr = Math.random; Math.random = () => 0.1;
  q.t = q.dur + 1; Republic.tick(0.02);
  Math.random = mr;
  const c = S.camps.pass;
  return { refused, phase: Republic.mountain().phase, truceBefore, funded, marching, leadOnGround: !!lead,
    taken: !!c.taken, quiet: c.pacified, noRunners: c.runners.length === 0, truceDead: !Republic.truce() && Republic.stance('raiders') === 'HOSTILE',
    reprisal: !!Republic.reprisal(), mul: Republic.reprisalMul().claim, likesUp: S.stations[near].likesTo >= likes0 + 5,
    stone: S.legacy.some(g => g.fact === 'farkeep' && /taking/.test(g.fate)), teeth: !!Memorial.site('farkeep'),
    mailed: S.mails.some(m => m.subj.includes('taken and HELD')) && S.mails.some(m => m.subj.includes('remember the shields')),
    told: !!S.flags.tut.firstTaking, done: !Republic.quell(), rel: Republic.rel('farkeep', 'raiders') };
});
ok('THE TAKING: refused before the road, funded after it, FIVE shields MARCHED on real ground — the camp taken and HELD, its runners gone, the truce DEAD with the first shield, the reprisal season on, the nearest town safer, the mountain\'s stone raised, and the ledger between the mountain and the camps at WAR',
  r.refused === false && r.phase === 'open' && r.truceBefore && r.funded && r.marching && r.leadOnGround && r.taken && r.quiet && r.noRunners && r.truceDead && r.reprisal && r.mul === 1.25 && r.likesUp && r.stone && r.teeth && r.mailed && r.told && r.done && r.rel <= -3, JSON.stringify(r));
r = await ev(() => {
  /* the salvage tithe: the held ground hauls scrap in from the ring, capped */
  const c = S.camps.pass; c.stash = [];
  Republic.tick(0.6); Republic.tick(REP.WATCHPOST.tithePeriod + 1);
  const one = c.stash.length;
  for (let i = 0; i < 8; i++) Republic.tick(REP.WATCHPOST.tithePeriod + 1);
  const capped = c.stash.length;
  const cd = DATA.camps[0]; WL.tp([cd.x + 10, cd.y + 30]);
  const prompt = Systems.getInteractions().find(a => a.label.includes('salvage tithe'));
  const n0 = S.cargo.length;
  if (prompt) prompt.fn();
  return { one, capped, cap: REP.WATCHPOST.titheCap, good: !!c.stash.every, prompt: !!prompt, carried: S.cargo.length > n0 };
});
ok('THE WATCHPOST HAULS: a salvage crate per period, the pile CAPPED at four, and the prompt at the post reads the tithe — carried off in the Order\'s papers', r.one === 1 && r.capped === r.cap && r.prompt && r.carried, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  /* the held ring breaks a chase: a temporary camp row pitched beside the post (the world's own
     camps stand too far apart for a chase to cross a ring — the rule is proven on a registry row) */
  const post = DATA.camps[0];
  const tmp = { id: 'tmp', name: 'Tmp Camp', x: post.x + 900, y: post.y, r: 780, runners: 1 };
  DATA.camps.push(tmp); S.camps.tmp = { pacified: false, alert: 0, stash: [], runners: [] };
  let px2 = post.x + 270, py2 = post.y;   // the walker inside the held ring, inside the tmp camp's claim (shortened for the Road's Own)
  for (let dy = 0; dy < 300; dy += 24) { if (!World.terrainAt(px2, py2 + dy).blocked) { py2 += dy; break; } }
  WL.tp([px2, py2]);
  S.cargo = S.cargo.filter(x => x.tool); State.addCargo(State.makeItem('meds'));
  const runner = { x: post.x + 360, y: py2, wa: 0, state: 'patrol', cd: 0 };   // inside the post's safe ring (0.7 × 760 = 532), his own ring EAST of him
  S.camps.tmp.runners = [runner];
  const inRing = !!Republic.watchpostAt(runner.x, runner.y), outRing = !Republic.watchpostAt(post.x + 700, post.y);
  const d0 = U.dist(runner.x, runner.y, S.px, S.py);
  const iv = setInterval(() => { S.wraiths.length = 0; S.struggle = null; }, 40);
  setTimeout(() => {
    clearInterval(iv);
    const out = { inRing, outRing, cd: Math.round(runner.cd * 10) / 10, d0: Math.round(d0), d1: Math.round(U.dist(runner.x, runner.y, S.px, S.py)), h0: S.health };
    DATA.camps.pop(); delete S.camps.tmp;
    res(out);
  }, 1500);
}));
ok('THE HELD RING: a runner whose chase crosses into the watchpost\'s safe radius is BROKEN by the post — cooled twelve seconds and turned back to his own ring, the gap to the walker never closing', r.inRing && r.outRing && r.cd >= 8 && r.d1 >= r.d0 - 5, JSON.stringify(r));
r = await ev(() => {
  /* the light's own path stands beside the taking: a wire-lit camp stands down by ITSELF, gift and all;
     the held camp is never double-counted */
  const la = World.lightAt; World.lightAt = () => 1;
  const likes0 = S.likes || 0, m0 = S.mails.length, stash0 = S.camps.pass.stash.length;
  Systems.onLightChanged();   // the moment a lamp lands on the wire — the light's own check runs here
  World.lightAt = la;
  const ridge = S.camps.ridge, ash = S.camps.ash;
  const pacified = ridge.pacified && ash.pacified && !ridge.taken && !ash.taken;
  const gifted = ridge.stash.length >= 3 && S.mails.some(m => m.subj.includes('joined the network'));
  return { pacified, gifted, heldUntouched: S.camps.pass.stash.length === stash0, mails: S.mails.length - m0 };
});
ok('THE LIGHT\'S OWN ANSWER still stands beside the taking: camps the wire reaches stand down BY THEMSELVES with their gift — and the held camp is never counted twice', r.pacified && r.gifted && r.heldUntouched, JSON.stringify(r));

/* ================= 4 · THE WORLD'S OWN WARS ================= */
r = await ev(() => {
  /* the doused bowl: night, a fed shrine, no truce, the roll forced — the Keepers ASK */
  for (const c of Object.values(S.camps)) { if (!c.taken) { c.pacified = false; c.runners = []; } }   // the camps stand again for the wars below
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.8;
  for (const s2 of Republic.sites('flameshrine')) s2.fedUntil = S.time + 400;
  S.rep.evCd = { shrineRaid: 0, reaperCull: 9999, unlitCourting: 9999 };
  const rel0 = Republic.rel('flamekeepers', 'raiders');
  const mr = Math.random; Math.random = () => 0.1;
  Republic.tick(0.6);
  Math.random = mr;
  const asks = Republic.asks();
  const doused = Republic.sites('flameshrine').filter(s2 => s2.doused && s2.fedUntil <= S.time);
  return { asks: asks.length, doused: doused.length, fedLeft: Republic.shrinesFed(), rel: Republic.rel('flamekeepers', 'raiders') - rel0,
    mailed: S.mails.some(m => m.subj === 'The Raiders doused a bowl'), told: !!S.flags.tut.firstAsk, answers: asks[0] && asks[0].answers.join() };
});
ok('THE DOUSED BOWL: the Raiders kick a fed flame over in the night — the bowl goes cold with a scorch, the Keepers\' ASK stands on the sheet with both answers, the mail lands, and the ledger between them drops', r.asks === 1 && r.doused === 1 && r.fedLeft === 2 && r.rel === -1 && r.mailed && r.told && r.answers === 'feed,take', JSON.stringify(r));
r = await ev(() => {
  /* the sheet carries the ask with the mountain's answer offered; then the walked answer: feed it by hand */
  RepublicUI.open();
  const html = document.getElementById('repBody').innerHTML;
  const onSheet = html.includes('THE FLAME KEEPERS ASK') && html.includes('TO ANSWER') && /data-take="(ridge|ash|pass)"/.test(html);
  RepublicUI.close();
  const a = Republic.asks()[0], s2 = S.rep.sites[a.site];
  WL.tp([s2.x, s2.y]); S.banked.lumen = 10;
  const rel0 = Republic.rel('flamekeepers', 'waylight');
  const feed = Republic.interactions().find(x => x.label.includes('Feed the flame'));
  if (feed) feed.fn();
  return { onSheet, feedPrompt: !!feed, answered: Republic.asks().length === 0, fed: s2.fedUntil > S.time, scorchGone: !s2.doused, rel: Republic.rel('flamekeepers', 'waylight') - rel0, mailed: S.mails.some(m => m.subj === 'The Keepers mark an answer') };
});
ok('THE ASK ANSWERED BY WALKING: the sheet offers the mountain\'s answer, and feeding the bowl by hand closes the question — the scorch gone, the Keepers\' ledger up, the answer mailed', r.onSheet && r.feedPrompt && r.answered && r.fed && r.scorchGone && r.rel === 1 && r.mailed, JSON.stringify(r));
r = await ev(() => {
  /* silence is an answer: a second dousing left to age past its clock costs a step of stance */
  Republic.setStance('flamekeepers', 'FRIENDLY'); S.rep.stance.flamekeepers = 'ALLY';
  for (const s2 of Republic.sites('flameshrine')) s2.fedUntil = S.time + 400;
  S.rep.evCd.shrineRaid = 0;
  const mr = Math.random; Math.random = () => 0.1;
  Republic.tick(0.6);
  Math.random = mr;
  const a = Republic.asks()[0];
  if (a) a.t0 = S.time - a.dur - 5;
  Republic.tick(0.6);
  return { asked: !!a, lapsed: Republic.asks().length === 0, stance: Republic.stance('flamekeepers'), mailed: S.mails.some(m => m.subj === 'The Keepers read your silence') };
});
ok('SILENCE IS AN ANSWER: an ask left past its clock lapses — the Keepers\' stance cools a step (ALLY → FRIENDLY) and they say so', r.asked && r.lapsed && r.stance === 'FRIENDLY' && r.mailed, JSON.stringify(r));
r = await ev(() => {
  /* the Reapers' cull: night in the grey at a camp that stands — one knife fewer for a day */
  const cd = DATA.camps[1], c = S.camps[cd.id];
  c.runners = [{ x: cd.x, y: cd.y, wa: 0, state: 'patrol', cd: 0 }, { x: cd.x + 10, y: cd.y, wa: 1, state: 'patrol', cd: 0 }, { x: cd.x - 10, y: cd.y, wa: 2, state: 'patrol', cd: 0 }];
  const ma = World.mistAt; World.mistAt = () => 1;
  S.rep.evCd = { shrineRaid: 9999, reaperCull: 0, unlitCourting: 9999 };
  const rel0 = Republic.rel('raiders', 'reapers');
  const mr = Math.random; Math.random = () => 0.1;
  Republic.tick(0.6);
  Math.random = mr; World.mistAt = ma;
  const culled = DATA.camps.find(cd2 => S.camps[cd2.id].culled);
  const cc = culled && S.camps[culled.id];
  /* the short ring respawns short: empty the runners and let the camp restaff itself */
  if (cc) { cc.runners = []; }
  Systems.update(0.016, {});
  return { culled: !!culled, fewer: cc ? cc.runners.length === culled.runners - 1 : false, rel: Republic.rel('raiders', 'reapers') - rel0, mailed: S.mails.some(m => m.subj === 'A camp went quiet in the night') };
});
ok('THE REAPERS\' CULL: a camp in the night grey loses a runner to the file — it restaffs ONE SHORT for a day, the stake stands, the ledger between the harvest and the harvested drops, the mail lands', r.culled && r.fewer && r.rel === -1 && r.mailed, JSON.stringify(r));
r = await ev(() => {
  /* the courting: pressure past the mark, coverage enough — the Unlit talk to the first rising's town */
  const T2 = DATA.T; S.time = Math.floor(S.time / T2.dayLen) * T2.dayLen + T2.dayLen * 0.3;   // day again
  S.stations.quarry.connected = true; State.refreshSources();
  S.cov = Math.max(S.cov, 0.5); S.rep.pressure = REP.REBELLION.period * 0.6; S.rep.courted = null; S.rep.rising = 0;
  S.rep.evCd = { shrineRaid: 9999, reaperCull: 9999, unlitCourting: 0 };
  Republic.tick(0.6);
  const ct = Republic.courted();
  RepublicUI.open();
  const html = document.getElementById('repBody').innerHTML;
  const onSheet = html.includes('THE ORDER — COURTED') && html.includes('HEAR THEM OUT');
  RepublicUI.close();
  /* refused at a cold door, heard at a warm one */
  S.stations.quarry.likesTo = 4; const refused = Republic.hearOut();
  S.stations.quarry.likesTo = 30; S.banked.provisions = 40;
  const p0 = S.rep.pressure, rel0 = Republic.rel('rebels', 'waylight');
  const heard = Republic.hearOut();
  return { courted: ct && ct.id, onSheet, told: !!S.flags.tut.firstCourting, refused, heard, cleared: !Republic.courted(), slowed: S.rep.pressure < p0 - 100,
    rel: Republic.rel('rebels', 'waylight') - rel0, mailed: S.mails.some(m => m.subj.includes('heard out')) };
});
ok('THE COURTING: the Unlit talk to the first rising\'s town before the drum lands — the half-flown shutter on the sheet, HEAR THEM OUT refused at a cold door and heard at a warm one: the drum slows, the courting clears, the ledger warms', r.courted === 'quarry' && r.onSheet && r.told && r.refused === false && r.heard && r.cleared && r.slowed && r.rel === 1 && r.mailed, JSON.stringify(r));
r = await ev(() => {
  /* ignored, the courting names the rising's town: a courted mill goes dark FIRST */
  S.stations.mill.connected = true; State.refreshSources();
  S.rep.courted = { id: 'mill', t0: S.time }; S.rep.rising = 1; S.rep.pressure = REP.REBELLION.period + 1; S.rep.quell = null;
  S.cov = Math.max(S.cov, 0.5);
  Republic.tick(0.6);
  const out = { millDark: Republic.isUnlit('mill'), courtCleared: !Republic.courted() };
  S.stations.mill.likesTo = 60; S.banked.provisions = 60; Republic.tryParley('mill');   // and the light walked back
  return out;
});
ok('IGNORED, the courting is the warning it looked like: the rising takes the courted town FIRST, and the courting ends where the rising begins', r.millDark && r.courtCleared, JSON.stringify(r));
r = await ev(() => {
  /* the reprisal season cools on its clock; the relations ledger reads bands and remembers why */
  if (!Republic.reprisal()) Republic.fireEvent('raiderReprisal', DATA.camps[0]);   // the tithe clock above outran the season — re-arm it through the registry's one door
  const armed = Republic.reprisalMul().claim === 1.25;
  Republic.reprisal().t = 0.1; Republic.tick(0.6);
  const rows = Republic.relations();
  const war = rows.find(x => x.a === 'farkeep' && x.b === 'raiders'), ally = rows.find(x => x.a === 'diefenbunker' && x.b === 'lamplighters');
  return { armed, cooled: !Republic.reprisal() && Republic.reprisalMul().claim === 1, n: rows.length, war: war && war.name, why: war && /taking of Pass Camp/.test(war.why || ''), ally: ally && ally.name, line: ally && ally.line };
});
ok('THE LEDGER READS: the reprisal cools on its clock; sixteen pairs in bands — Farkeep and the Raiders at WAR "last moved by the taking of Pass Camp", the exiles and the Society ALLIED ("one fire, two banners")', r.armed && r.cooled && r.n === 16 && r.war === 'WAR' && r.why && r.ally === 'ALLIED' && /one fire/.test(r.line), JSON.stringify(r));

/* ================= 5 · THE TWO WALKED ROOMS ================= */
r = await ev(() => {
  RepublicUI.deskAct('rep_hall');
  const R = REP.INTERIORS.farkeep_hall, inHall = S.room && S.room.id === 'farkeep_hall';
  for (let i = 0; i < 60; i++) Republic.moveRoom(0.05, { left: true });
  const clamped = S.room.x >= 16;
  /* the shield wall reads the Standing Teeth */
  S.room.x = 200; S.room.y = 58;
  const sh = Republic.interactions().find(a => a.label.includes('SHIELD WALL'));
  document.getElementById('toasts').innerHTML = '';
  if (sh) sh.fn();
  const fallen = S.legacy.find(g => g.fact === 'farkeep');
  const readsTeeth = fallen && document.getElementById('toasts').innerHTML.includes(fallen.name);
  /* the hearth: three fragments, the third the child carried down the pass */
  S.room.x = 50; S.room.y = 118;
  const m0 = S.mails.length;
  for (let i = 0; i < 3; i++) { const h = Republic.interactions().find(a => a.label.includes('hearth')); if (h) h.fn(); }
  const third = document.getElementById('toasts').innerHTML.includes('THE CHILD');
  const founding = S.mails.some(m => m.subj === 'The founding, in three fragments');
  /* the yard: the kit hires from its rows, keyed */
  S.room.x = 353; S.room.y = 120;
  const hires = Republic.interactions().filter(a => a.label.includes('Hire a'));
  S.banked.metal = 200; S.banked.ceramic = 60;
  const n0 = S.npcs.filter(n => n.fk).length;
  const bow = hires.find(h => h.label.includes('Longbowman')); if (bow) bow.fn();
  const hired = S.npcs.filter(n => n.fk).length === n0 + 1;
  /* the door out, in the hall's own voice */
  S.room.x = R.entry.x; S.room.y = 166;
  document.getElementById('toasts').innerHTML = '';
  const ex = Republic.interactions().find(a => a.label.includes('walk out')); if (ex) ex.fn();
  const outLine = document.getElementById('toasts').innerHTML.includes('shield-door');
  return { inHall, clamped, shPrompt: !!sh, readsTeeth: !!readsTeeth, third, founding, hires: hires.map(h => h.key).join(), hired, out: !S.room, outLine };
});
ok('THE LONG HALL is walked from Farkeep\'s desk: walls hold, the SHIELD WALL reads the Standing Teeth by NAME, the hearth tells the founding in three fragments (the third the child carried down the pass), the yard hires the kit from its rows on three keys, and the shield-door speaks in the hall\'s own voice',
  r.inHall && r.clamped && r.shPrompt && r.readsTeeth && r.third && r.founding && r.hires === 'E,R,T' && r.hired && r.out && r.outLine, JSON.stringify(r));
r = await ev(() => {
  S.exile = S.exile || {}; S.exile.phase = 'open'; S.exile.guild = S.exile.guild || { done: 0, active: null }; S.exile.stock = S.exile.stock || { a338: 6, cycleT: 0 }; S.exile.stock.a338 = 6; S.exile.door = S.exile.door || 'hidden';
  S.gear.ammo338 = S.gear.ammo338 || 0;
  Exile.deskAct('guild', 'shutterlight');
  const R = REP.INTERIORS.shutterlight_guild, inRoom = S.room && S.room.id === 'shutterlight_guild';
  /* the board */
  S.room.x = 90; S.room.y = 62;
  document.getElementById('toasts').innerHTML = '';
  const bd = Republic.interactions().find(a => a.label.includes('THE BOARD')); if (bd) bd.fn();
  const boardReads = document.getElementById('toasts').innerHTML.includes('Guild standing');
  /* the counter: rounds across the exchange */
  S.room.x = 310; S.room.y = 60; S.banked.metal = 200;
  const a0 = S.gear.ammo338;
  const ct = Republic.interactions().find(a => a.label.includes('counter')); if (ct) ct.fn();
  const bought = S.gear.ammo338 > a0;
  /* the lantern: three fragments, the third the mark in a hand you know */
  S.room.x = 195; S.room.y = 124;
  for (let i = 0; i < 3; i++) { const l = Republic.interactions().find(a => a.label.includes('lantern')); if (l) l.fn(); }
  const mark = document.getElementById('toasts').innerHTML.includes('THE MARK');
  const lanternMail = S.mails.some(m => m.subj === 'The lantern, in three fragments');
  S.room.x = R.entry.x; S.room.y = 166;
  document.getElementById('toasts').innerHTML = '';
  const ex = Republic.interactions().find(a => a.label.includes('walk out')); if (ex) ex.fn();
  const outLine = document.getElementById('toasts').innerHTML.includes('shutter drops');
  return { inRoom, boardReads, bought, mark, lanternMail, out: !S.room, outLine };
});
ok('THE GUILD ROOM is walked from Shutterlight\'s desk: the board reads the Nomads\' opinion of you, the counter sells .338 across the exchange, the lantern tells three fragments (the third a mark in a hand you know), and the shutter drops in the room\'s own voice',
  r.inRoom && r.boardReads && r.bought && r.mark && r.lanternMail && r.out && r.outLine, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  /* both rooms DRAW — a frame in each, no page error, the material style read */
  Republic.enterRoom('farkeep_hall');
  setTimeout(() => {
    const a = REP.ROOM_STYLES[REP.INTERIORS.farkeep_hall.style].floor;
    Republic.enterRoom('shutterlight_guild');
    setTimeout(() => { const b2 = REP.ROOM_STYLES[REP.INTERIORS.shutterlight_guild.style].floor; S.room = null; res({ stone: a, timber: b2, differ: a !== b2 }); }, 250);
  }, 250);
}));
ok('the two rooms draw in their own MATERIALS — stone for the hall, timber for the guild room — through the one renderer', r.differ && r.stone === '#2b2f33' && r.timber === '#2a2216', JSON.stringify(r));

/* ================= 6 · THE SAVE AND THE LAW ================= */
r = await ev(() => {
  State.save();
  const raw = JSON.parse(localStorage.getItem('waylight_save_v1'));
  const kept = raw && raw.camps.pass.taken && raw.rep.rel && Object.keys(raw.rep.rel).length >= 3 && raw.rep.relLog && raw.rep.frag && raw.rep.frag.farkeep_hall === 3 && Array.isArray(raw.rep.asks) && raw.room === null;
  const loaded = State.load();
  return { kept: !!kept, loaded, stillHeld: !!S.camps.pass.taken && S.camps.pass.pacified, rel: Republic.rel('farkeep', 'raiders') <= -3, noRoom: !S.room };
});
ok('THE SAVE carries the holdings: the held camp, the relations deltas and why, the fragments read, the asks — and loads back HELD, never mid-room', r.kept && r.loaded && r.stillHeld && r.rel && r.noRoom, JSON.stringify(r));
r = await ev(() => {
  RepublicUI.open();
  const modal = UI.anyModal(), gated = UI.gateReport().join(' | ').includes('republic');
  const html = document.getElementById('repBody').innerHTML;
  const esc = UI.escPressed();
  return { modal, gated, noTodo: !html.includes('TODO'), esc, closed: document.getElementById('republicOv').classList.contains('hidden') };
});
ok('the sheet still obeys the modal law with its new ledgers — counted, gated, ESC adjourns — and carries no TODO', r.modal && r.gated && r.noTodo && r.esc && r.closed, JSON.stringify(r));

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the holdings', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
