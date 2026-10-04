/* holdings.mjs — v3.34 THE HOLDINGS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). Conquest, the world's own wars and two walked halls, on the registry
   law: the rows; the holdings view with its owner on every plate and the taking gated on the road; THE TAKING end to end
   (refused, funded, marched and seen, held — the watchpost drawn, the truce dead — and the price the world writes: the
   reprisal season, the nearest town's thanks, the stone, WAR); the tithe capped and carried; the held ring breaking a
   chase; the light's own patient answer standing beside it; the doused bowl and the Keepers' ask, answered by walking and
   lapsed to a cooler stance; the Reapers' cull; the courting heard out and ignored; the relations ledger's bands and
   memory; Farkeep's long hall and Shutterlight's guild room walked (walls, every hotspot, the fragments, the hires on three
   keys, the doors' own voices); the materials and the fit law; the save; the modal law. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;
await ev(() => {
  window.__toasts = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join(' | ');
  window.__mail = re => S.mails.find(m => re.test(m.subj)) || null;
  window.__look = async (x, y, o = {}) => {
    const { wx = x + 300, wy = y + 180, zoom = 3, frac = 0.3 } = o;
    WL.tp([wx, wy]); S.weather.state = 'clear'; S.speed = 0; S.braced = false; S.moveTo = null;
    const DL = DATA.T.dayLen; if (frac !== null) S.time = Math.floor(S.time / DL) * DL + DL * frac;
    for (const n of NPC.party()) { n.cx = S.px + 600; n.cy = S.py + 600; }
    __clearAmb(x, y, 500); Render.clearFx(); Render.setFx(false); Render.setZoom(zoom); Render.cam.x = x; Render.cam.y = y; WL.timeScale = 0.001;
    await __wait(300); await __frames(3);
  };
  window.__camp = id => DATA.camps.find(c => c.id === id);
  window.__holds = () => Object.fromEntries([...document.querySelectorAll('#repBody .rpHold')].map(x => [x.querySelector('.rpName').textContent, x]));
  /* a registry room walked by its own floor law */
  window.__go = (tx, ty) => { const rm = S.room; for (let i = 0; i < 900 && U.dist(rm.x, rm.y, tx, ty) > 2; i++) Republic.moveRoom(0.05, { left: rm.x > tx + 1, right: rm.x < tx - 1, up: rm.y > ty + 1, down: rm.y < ty - 1 }); return U.dist(rm.x, rm.y, tx, ty) <= 2.5; };
  window.__prompt = re => Republic.interactions().find(i => re.test(i.label)) || null;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const D = REP.DOCTRINE.take, W = REP.WATCHPOST, E = REP.EVENTS, R = REP.RELATIONS;
  const take = D.cost.metal === 70 && D.cost.wood === 20 && D.cost.provisions === 30 && D.column === 5 && D.dur === 120 && D.casualty === 0.45 && D.needs === 'mountain';
  const post = W.shields === 2 && W.safeR === 0.7 && W.tithePeriod === 90 && W.titheCap === 4 && W.likesNear === 6;
  const events = ['shrineRaid', 'reaperCull', 'unlitCourting', 'raiderReprisal'].every(k => E[k] && E[k].actor && E[k].victim && E[k].kind && E[k].mail) && E.shrineRaid.askDur === 600 && E.raiderReprisal.trigger === 'take' && E.raiderReprisal.dur === 420 && E.raiderReprisal.claimMul === 1.25 && E.raiderReprisal.chaseMul === 1.15 && E.unlitCourting.pressureAt === 0.55 && E.unlitCourting.hearGift.provisions === 8 && E.unlitCourting.hearLikes === 20;
  const keys = Object.keys(R.base), sorted = keys.every(k => k.split('|').join() === k.split('|').sort().join()) && keys.every(k => k.split('|').every(f => FACT.FACTIONS[f]));
  const bands = R.bands.map(b => b[1]).join() === 'WAR,FEUD,COLD,TRUCE,ALLIED' && R.bands.every(b => R.lines[b[1]]);
  const rooms = ['farkeep_hall', 'shutterlight_guild', 'diefenbunker'].map(id => REP.INTERIORS[id]), styles = Object.keys(REP.ROOM_STYLES).join() === 'concrete,stone,timber';
  const fit = rooms.every(x => x.w <= 400 && x.h <= 190 && REP.ROOM_STYLES[x.style] && x.exitLine && x.hotspots.some(h => h.id === 'exit'));
  const halls = REP.INTERIORS.farkeep_hall.style === 'stone' && REP.INTERIORS.farkeep_hall.fragments.length === 3 && REP.INTERIORS.shutterlight_guild.style === 'timber' && REP.INTERIORS.shutterlight_guild.fragments.length === 3;
  const F = SPRITES.FIG.shield, shield = F.w === 32 && F.h === 40 && ['E', 'S', 'N'].every(fc => ['idle', 'walk1', 'walk2', 'walk3', 'walk4'].every(k => F.frames[fc][k]));
  return { take, post, events, pairs: keys.length, sorted, bands, styles, fit, halls, shield };
});
ok('THE REGISTRIES: THE TAKING a doctrine row (seventy metal, twenty wood, thirty provisions, a column of five for 120 s, the stone likelier at 0.45, gated on the mountain); THE WATCHPOST a row (two shields, the held ring at 0.7 of the claim, a crate per 90 s to four, six likes to the nearest town); the world\'s own wars one EVENTS table (the doused bowl and its aging ask, the cull, the courting and its hearing, the reprisal fired by the taking at 1.25× the claim and 1.15× the run for 420 s); RELATIONS keyed on the sorted pair (v3.41: seventeen pairs with the Society\'s door) read in five bands with a line each; three room rows in three materials, every one within the fit law with a door and a voice of its own; the shield figure drawn by hand on the tall grid (v3.51)',
  r.take && r.post && r.events && r.pairs === 17 && r.sorted && r.bands && r.styles && r.fit && r.halls && r.shield, JSON.stringify(r));

/* ================= 2 · THE HOLDINGS VIEW, GATED BEFORE THE ROAD ================= */
r = await ev(() => {
  const e0 = S.exile ? JSON.parse(JSON.stringify(S.exile)) : null;
  S.exile = S.exile || { phase: 'hidden', t: 0, dur: 0, guild: { done: 0, active: null }, stock: { a338: 6, cycleT: 0 }, door: 'hidden' };
  S.exile.phase = 'open'; S.exile.door = 'opened';   // the exile city and the cold door, found
  RepublicUI.open(); const H = __holds();
  const towns = DATA.stationOrder.every(id => { const h = H[DATA.stations[id].name]; return h && (S.stations[id].connected ? /THE ORDER/.test(h.textContent) && /LIT/.test(h.textContent) : /NOBODY — DARK/.test(h.textContent)); });
  const camps = DATA.camps.every(cd => { const h = H[cd.name], b = h && h.querySelector(`button[data-take="${cd.id}"]`); return h && /THE RAIDERS/.test(h.textContent) && b && b.disabled && /the mountain road is not cut — Farkeep takes no ground it cannot reach/.test(h.textContent); });
  const bowls = Object.keys(H).filter(k => /^THE BOWL NEAR/.test(k)).length === 3 && Object.keys(H).filter(k => /^THE BOWL NEAR/.test(k)).every(k => /THE FLAME KEEPERS/.test(H[k].textContent) && /COLD/.test(H[k].textContent));
  const larders = [...document.querySelectorAll('#repBody .rpHold')].filter(x => /A HOLLOW FIRE/.test(x.textContent) && /THE HOLLOW FIRES/.test(x.textContent)).length === 2;
  const exile = !!H.SHUTTERLIGHT && /THE NOMADS/.test(H.SHUTTERLIGHT.textContent) && !!H['THE DIEFENBUNKER'] && /THE SOCIETY/.test(H['THE DIEFENBUNKER'].textContent);
  RepublicUI.close();
  const gate = Republic.canTake('pass'), refused = !Republic.fundTake('pass') && !Republic.quell() && /Farkeep takes no ground it cannot reach/.test(__toasts());
  if (e0) S.exile = e0; else delete S.exile;
  return { towns, camps, bowls, larders, exile, gate, refused };
});
ok('THE HOLDINGS VIEW, GATED BEFORE THE ROAD: every place the table knows carries its owner on the sheet — the towns THE ORDER and LIT or NOBODY — DARK, the three camps THE RAIDERS, the three bowls THE FLAME KEEPERS and COLD, the two larders THE HOLLOW FIRES, Shutterlight THE NOMADS and the Diefenbunker THE SOCIETY once found — and THE TAKING stands on every camp disabled with its gate line; asked anyway, it is refused by that line',
  r.towns && r.camps && r.bowls && r.larders && r.exile && !r.gate.ok && /cannot reach/.test(r.gate.line) && r.refused, JSON.stringify(r));

/* ================= 3 · THE TAKING, FUNDED AND MARCHED ================= */
await ev(() => {
  S.rep.mountain = { phase: 'open', t: 0 }; Republic.mountain();   // the road cut: Farkeep can reach the camps
  S.renegade = 20; Republic.setStance('raiders', 'WARY');           // a raider truce stands when the column goes
  S.banked.metal = 30; S.banked.wood = 5; S.banked.provisions = 5;
});
const poorTake = await ev(() => ({ refused: !Republic.fundTake('pass') && !Republic.quell() && /The taking wants/.test(__toasts()), gate: Republic.canTake('pass').ok }));
await ev(() => { S.banked.metal = 400; S.banked.wood = 200; S.banked.provisions = 200; S.banked.ceramic = 200; RepublicUI.open(); });
await page.click('#repBody button[data-take="pass"]');   // a real click funds the column
r = await ev(async () => {
  const q = Republic.quell(), paid = S.banked.metal === 330 && S.banked.wood === 180 && S.banked.provisions === 170;
  RepublicUI.close();
  if (!q) return { q: null, paid };
  let bad = 0; for (let i = 1; i < q.pts.length; i++) { const [x0, y0] = q.pts[i - 1], [x1, y1] = q.pts[i], k = Math.max(1, Math.ceil(U.dist(x0, y0, x1, y1) / 12)); for (let j = 0; j <= k; j++) { const t = World.terrainAt(x0 + (x1 - x0) * j / k, y0 + (y1 - y0) * j / k); if (t.blocked || (t.water && !Systems.crossingAt(x0 + (x1 - x0) * j / k, y0 + (y1 - y0) * j / k))) bad++; } }
  q.t = q.dur * 0.3; const p = Republic.columnPos(0.3, 88);
  await __look(p.x, p.y, { wx: p.x + 460, wy: p.y + 300 });
  const A1 = __grab(p.x, p.y - 20, 150); S.rep.quell = null; await __wait(200); await __frames(3);
  const B1 = __grab(p.x, p.y - 20, 150); S.rep.quell = q; WL.timeScale = 1; __done();
  return { kind: q.kind, camp: q.camp, col: q.col, dur: q.dur, from: q.from, paid, bad, seen: __diff(A1, B1), truce: Republic.truce() };
});
ok('THE TAKING, FUNDED AND MARCHED: with the mountain road cut the taking is refused without its stores, then a real click on THE TAKING at the Pass pays seventy metal, twenty wood and thirty provisions and five Farkeeper shields muster at the nearest lit town and march the walked road for 120 s — on ground a walker can stand on, SEEN on the ground against the same frame without them',
  poorTake.refused && poorTake.gate && r.kind === 'take' && r.camp === 'pass' && r.col === 5 && r.dur === 120 && r.paid && r.bad === 0 && r.seen > 200 && r.truce, JSON.stringify({ poorTake, r }));

/* ================= 4 · THE CAMP HELD: THE WATCHPOST, THE TRUCE DEAD ================= */
await T.drain();
r = await ev(async () => {
  const cd = __camp('pass'), c = S.camps.pass, legacy0 = S.legacy.length, near = DATA.stationOrder.reduce((b, id) => U.dist(cd.x, cd.y, DATA.stations[id].x, DATA.stations[id].y) < U.dist(cd.x, cd.y, DATA.stations[b].x, DATA.stations[b].y) ? id : b, 'haven'), likes0 = S.stations[near].likesTo;
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
  Republic.quell().t = Republic.quell().dur;
  const rnd = Math.random; Math.random = () => 0; try { Republic.tick(0.01); } finally { Math.random = rnd; }   // the column arrives; the casualty roll comes up
  window.__take = { legacy0, near, likes0 };
  const crt = Render.crtText();
  const held = !!c.taken && c.taken.shields === 2 && c.pacified && !c.runners.length && Republic.watchpostAt(cd.x + 10, cd.y) === cd && !Republic.quell();
  const truceDead = Republic.stance('raiders') === 'HOSTILE' && !Republic.truce() && /The truce is dead/.test(__toasts());
  /* seen holding: the shields at the fire, the grey pennant over it, the mountain's canvas */
  await __look(cd.x, cd.y - 10, { wx: cd.x + 380, wy: cd.y + 280 });
  const g = __grab(cd.x, cd.y - 10, 200);
  const pennant = __near(cd.x + 12, cd.y - 58, __hex('#8d979c'), 10, 30) + __near(cd.x + 12, cd.y - 58, __hex('#5a6a7a'), 10, 30);
  const Fp = SPRITES.FIG.shield, fp = { ...Fp.pal, ...Render.courierPal(Fp.pal) }, shields = __near(cd.x - 66, cd.y + 20, __hex(fp.C), 12, 40) + __near(cd.x + 66, cd.y + 20, __hex(fp.C), 12, 40);
  const tents = __count(g, __hex('#6e7a82'), 8);
  WL.timeScale = 1; __done();
  return { held, truceDead, crt, pennant, shields, tents, mail: !!__mail(/^The Pass: taken and HELD$|: taken and HELD$/) };
});
ok('THE CAMP HELD: the column arrives and the Pass is a REPUBLIC WATCHPOST (the CRT reads THE TAKING, the mail) — two shields standing its fire, its runners gone, its ring held — the raider truce DIES with the first shield in the ring, said; and it is seen holding: the shields flanking the fire, Farkeep\'s grey pennant over it, the tents pitched in mountain grey',
  r.held && r.truceDead && r.crt && r.crt.big === 'THE TAKING' && r.mail && r.pennant > 20 && r.shields > 20 && r.tents > 40, JSON.stringify(r));

/* ================= 5 · THE PRICE THE WORLD WRITES ================= */
r = await ev(() => {
  const cd = __camp('pass'), t = __take, rp = Republic.reprisal(), mul = Republic.reprisalMul();
  const season = !!rp && rp.t === REP.EVENTS.raiderReprisal.dur && rp.camp === 'pass' && mul.claim === 1.25 && mul.chase === 1.15 && !!__mail(/^The camps remember the shields$/);
  const likes = +(S.stations[t.near].likesTo - t.likes0).toFixed(1);
  const row = S.legacy.slice(t.legacy0).find(g => g.fact === 'farkeep'), stone = !!row && new RegExp(`fell taking ${cd.name}`).test(row.fate) && Memorial.grounds().includes('farkeep');
  const war = Republic.relations().find(x => x.a === 'farkeep' && x.b === 'raiders');
  RepublicUI.open(); const H = __holds(), sheet = /THE REPUBLIC — WATCHPOST/.test(H[cd.name].textContent) && /held since day/.test(H[cd.name].textContent) && /THE CAMPS' SEASON OF REPRISAL/.test(document.getElementById('repBody').textContent); RepublicUI.close();
  return { season, likes, stone, war: war && { v: war.v, name: war.name, why: war.why }, sheet, lesson: !!S.flags.tut.firstTaking };
});
ok('THE PRICE THE WORLD WRITES: the camps\' season of reprisal opens (420 s — every camp that stands claims 1.25× wider and runs 1.15× quicker, the mail), the town nearest breathes easier by six, the mountain pays a name at the Standing Teeth (a shield who fell taking the Pass), and Farkeep and the Raiders go from FEUD to WAR, last moved by the taking; the sheet reads the watchpost and the season; the lesson',
  r.season && r.likes === 6 && r.stone && r.war && r.war.name === 'WAR' && /the taking of/.test(r.war.why) && r.sheet && r.lesson, JSON.stringify(r));

/* ================= 6 · THE TITHE, CAPPED AND CARRIED ================= */
r = await ev(async () => {
  const cd = __camp('pass'), c = S.camps.pass, W = REP.WATCHPOST, cov = S.cov; S.cov = 0; S.rep.pressure = 0;
  const piles = [];
  for (let i = 0; i < 6; i++) { c.taken.tithe = W.tithePeriod - 0.05; Republic.tick(0.6); piles.push(c.stash.length); }
  S.cov = cov;
  const metal = c.stash.every(it => it.defId === W.titheGood);
  /* the pile by the post, seen */
  await __look(cd.x + 30, cd.y + 10, { wx: cd.x + 420, wy: cd.y + 300 });
  const crates = __near(cd.x + 36, cd.y + 14, __hex('#6e747c'), 10, 30) + __near(cd.x + 36, cd.y + 14, __hex('#b8c2c8'), 10, 30);
  WL.timeScale = 1; __done();
  WL.tp([cd.x + 20, cd.y + 20]); S.speed = 0;
  const p = Systems.getInteractions().find(i => /Take the salvage tithe at/.test(i.label)), n0 = S.cargo.filter(x => x.defId === W.titheGood).length;
  if (p) p.fn();
  const carried = S.cargo.filter(x => x.defId === W.titheGood).length - n0;
  return { piles, metal, crates, prompt: !!p, carried, left: c.stash.length };
});
ok('THE TITHE, CAPPED AND CARRIED: the post hauls a crate of salvage in from the ring every ninety seconds and stops at four; the iron-grey pile stands by the post on the ground; at the post the rail offers the tithe and the Walker carries all four off',
  r.piles.join() === '1,2,3,4,4,4' && r.metal && r.crates > 10 && r.prompt && r.carried === 4 && r.left === 0, JSON.stringify(r));

/* ================= 7 · THE HELD RING BREAKS A CHASE ================= */
r = await ev(() => {
  const cd = __camp('pass'), R0 = cd.r * REP.WATCHPOST.safeR;
  /* the world's own camps stand too far apart to cross, so a temporary camp row stands beside the post (the record's own proof) */
  let dir = null;
  for (const a of [0, Math.PI, Math.PI / 2, -Math.PI / 2, Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, -3 * Math.PI / 4]) {
    const ok2 = [R0 - 80, R0 - 40, R0, R0 + 60, R0 + 120, R0 + 200, R0 + 260].every(d => { const t = World.terrainAt(cd.x + Math.cos(a) * d, cd.y + Math.sin(a) * d); return !t.blocked && !t.water; });
    if (ok2) { dir = a; break; }
  }
  if (dir === null) return { dir: null };
  const ux = Math.cos(dir), uy = Math.sin(dir), tmp = { id: 'tmpfire', name: 'The Borrowed Fire', x: cd.x + ux * (R0 + 700), y: cd.y + uy * (R0 + 700), r: 760, runners: 1, roll: ['knife'] };
  DATA.camps.push(tmp); S.camps.tmpfire = { runners: [], stash: [], pacified: false, alert: 0 };
  WL.tp([cd.x + ux * (R0 - 70), cd.y + uy * (R0 - 70)]); S.speed = 0; S.state = 'walk'; S.moveTo = null; S.health = 100;
  if (!S.cargo.some(x => x.cat !== 'tool' && !x.keepsake)) State.addCargo(State.makeItem('food'));
  const rr = { x: cd.x + ux * (R0 + 190), y: cd.y + uy * (R0 + 190), wa: 0, state: 'patrol', cd: 0, cls: 'knife' };
  S.camps.tmpfire.runners = [rr];
  let broke = null; const hp0 = S.health;
  for (let i = 0; i < 80 && !broke; i++) { Systems.update(0.05, {}); if (rr.cd > 0) broke = { t: +(i * 0.05).toFixed(2), cd: +rr.cd.toFixed(1), fromPost: Math.round(U.dist(rr.x, rr.y, cd.x, cd.y)), toWalker: Math.round(U.dist(rr.x, rr.y, S.px, S.py)) }; }
  const said = !!broke;
  for (let i = 0; i < 40; i++) Systems.update(0.05, {});
  const back = Math.round(U.dist(rr.x, rr.y, cd.x, cd.y));
  const hurt = hp0 - S.health;
  DATA.camps.splice(DATA.camps.indexOf(tmp), 1); delete S.camps.tmpfire;
  return { dir: +dir.toFixed(2), R0: Math.round(R0), broke, back, hurt };
});
ok('THE HELD RING BREAKS A CHASE: a knife from a fire beside the post runs down a loaded Walker standing inside the post\'s held ring — the moment he crosses into 0.7 of the old claim the post breaks the chase (he cools twelve seconds, never reaching the Walker) and he walks back out toward his own ring',
  r.dir !== null && !!r.broke && r.broke.cd >= 11 && r.broke.fromPost <= r.R0 && r.broke.fromPost > r.R0 - 20 && r.broke.toWalker > 30 && r.back > r.broke.fromPost && r.hurt === 0, JSON.stringify(r));

/* ================= 8 · THE LIGHT'S OWN ANSWER, BESIDE IT ================= */
r = await ev(() => {
  const ridge = __camp('ridge'), pass = __camp('pass'), cr = S.camps.ridge, cp = S.camps.pass;
  const likes0 = S.likes, pStash0 = cp.stash.length, mails0 = S.mails.filter(m => /joined the network/.test(m.subj)).length;
  World.setSources([...(DATA.stationOrder.filter(id => S.stations[id].connected).map(id => ({ x: DATA.stations[id].x, y: DATA.stations[id].y, r: DATA.stations[id].baseR }))), { x: ridge.x, y: ridge.y, r: 520 }, { x: pass.x, y: pass.y, r: 520 }]);
  Systems.onLightChanged();   // the wire reaches both camps
  const stood = cr.pacified && !cr.taken && cr.stash.length === 3 && cr.stash.map(i => i.defId).sort().join() === 'ceramic,metal,metal' && S.likes - likes0 === 40 && !!__mail(new RegExp(`^${ridge.name} joined the network$`));
  const once = cp.stash.length === pStash0 && !!cp.taken && S.mails.filter(m => /joined the network/.test(m.subj)).length === mails0 + 1;
  State.refreshSources(true);
  RepublicUI.open(); const H = __holds(), sheet = /STOOD DOWN — THE LIGHT'S/.test(H[ridge.name].textContent) && /THE REPUBLIC — WATCHPOST/.test(H[pass.name].textContent); RepublicUI.close();
  return { stood, once, sheet, likes: S.likes - likes0 };
});
ok('THE LIGHT\'S OWN ANSWER, BESIDE IT: the wire reaching the Ridge still stands that camp down by ITSELF — pacified, not taken, its gift in the stash (two metal, a ceramic), forty likes, the mail — while the post under the same light is never counted twice (no second gift, no second mail): pacified is the quiet flag, taken is how; the sheet reads STOOD DOWN — THE LIGHT\'S beside THE REPUBLIC — WATCHPOST',
  r.stood && r.once && r.sheet, JSON.stringify(r));

/* ================= 9 · THE DOUSED BOWL, AND THE ASK ANSWERED BY WALKING ================= */
r = await ev(async () => {
  const s = Republic.sites('flameshrine')[0], si = S.rep.sites.indexOf(s);
  s.fedUntil = S.time + 300; S.rep.stance.flamekeepers = 'FRIENDLY';
  const rel0 = Republic.rel('flamekeepers', 'raiders'), relW0 = Republic.rel('flamekeepers', 'waylight');
  Republic.fireEvent('shrineRaid', s);
  const a = Republic.asks().find(x => x.site === si), doused = !(s.fedUntil > S.time) && s.doused === S.time && !!a && a.dur === 600 && a.answers.join() === 'feed,take' && Republic.rel('flamekeepers', 'raiders') === rel0 - 1 && !!__mail(/^The Raiders doused a bowl$/) && !!S.flags.tut.firstAsk;
  /* the scorch on the ground, against the same bowl merely cold */
  await __look(s.x, s.y - 14, { wx: s.x + 380, wy: s.y + 240 });
  const A1 = __grab(s.x, s.y - 16, 44), d0 = s.doused; s.doused = 0; await __wait(200); await __frames(3);
  const B1 = __grab(s.x, s.y - 16, 44); s.doused = d0; WL.timeScale = 1; __done();
  RepublicUI.open(); const body = document.getElementById('repBody').textContent, H = __holds(), nm = a.name.toUpperCase();
  const sheet = !!H[nm] && /THE FLAME KEEPERS ASK/.test(H[nm].textContent) && /s TO ANSWER/.test(H[nm].textContent) && !!H[nm].querySelector('button[data-take]') && /DOUSED/.test(body); RepublicUI.close();
  /* answered by walking: the Walker feeds the bowl again by hand */
  WL.tp([s.x + 20, s.y + 12]); S.banked.lumen = 10; const f = __prompt(/Feed the flame/); if (f) f.fn();
  const warm = !Republic.asks().some(x => x.site === si) && Republic.rel('flamekeepers', 'waylight') === relW0 + 1 && !!__mail(/^The Keepers mark an answer$/) && /fed .* again by hand/.test(Republic.relations().find(x => x.a === 'flamekeepers' && x.b === 'waylight').why);
  return { doused, scorch: __diff(A1, B1), sheet, warm };
});
ok('THE DOUSED BOWL, AND THE ASK ANSWERED BY WALKING: the Raiders kick a fed bowl over in the night — the bowl cold, the scorch on the ground (against the same bowl merely cold), the mail and the lesson, the Raiders\' ledger with the Keepers a step worse — and the Keepers ASK: under THE WORLD ASKS the question ages with its seconds to answer and THE TAKING offered at the nearest camp; the Walker walks there and feeds the bowl again by hand, and the question closes warm (the Keepers\' ledger with the Order a step better, last moved by it; their mail)',
  r.doused && r.scorch > 40 && r.sheet && r.warm, JSON.stringify(r));

/* ================= 10 · THE ASK LAPSED ================= */
r = await ev(() => {
  const s = Republic.sites('flameshrine')[1], si = S.rep.sites.indexOf(s);
  s.fedUntil = S.time + 300; S.rep.stance.flamekeepers = 'FRIENDLY';
  const relW0 = Republic.rel('flamekeepers', 'waylight');
  Republic.fireEvent('shrineRaid', s);
  const a = Republic.asks().find(x => x.site === si); a.t0 = S.time - a.dur - 1;   // nobody came
  Republic.tick(0.6);
  return { gone: !Republic.asks().some(x => x.site === si), stance: Republic.stance('flamekeepers'), rel: Republic.rel('flamekeepers', 'waylight') - relW0, why: Republic.relations().find(x => x.a === 'flamekeepers' && x.b === 'waylight').why, mail: !!__mail(/^The Keepers read your silence$/), toast: /The Keepers read your silence/.test(__toasts()) };
});
ok('THE ASK LAPSED: a second bowl doused and nobody comes — when the ask outlives its 600 s the Keepers read the silence: their stance cools a step (FRIENDLY to WARY), their ledger with the Order a step worse, last moved by the Republic\'s silence, said in the mail and on the road',
  r.gone && r.stance === 'WARY' && r.rel === -1 && /silence/.test(r.why) && r.mail && r.toast, JSON.stringify(r));

/* ================= 11 · THE CULL ================= */
r = await ev(async () => {
  const cd = __camp('ash'), c = S.camps.ash, rel0 = Republic.rel('reapers', 'raiders');
  c.runners = []; Systems.update(0.05, {}); const full = c.runners.length;
  Republic.fireEvent('reaperCull', cd);
  const culled = c.culled === S.time && c.runners.length === full - 1 && Republic.rel('reapers', 'raiders') === rel0 - 1 && !!__mail(/^A camp went quiet in the night$/);
  c.runners = []; Systems.update(0.05, {}); const short = c.runners.length;   // the camp restaffs one knife short for a day
  /* the hooded stake where he stood */
  await __look(cd.x - 70, cd.y + 20, { wx: cd.x - 460, wy: cd.y + 320 });
  for (const r2 of c.runners) { r2.x = cd.x + 300; r2.y = cd.y - 300; }
  await __wait(150); await __frames(3);
  const A1 = __grab(cd.x - 70, cd.y + 22, 36), ct = c.culled; c.culled = 0; await __wait(200); await __frames(3);
  const B1 = __grab(cd.x - 70, cd.y + 22, 36); c.culled = ct; WL.timeScale = 1; __done();
  c.culled = S.time - DATA.T.dayLen - 1; c.runners = []; Systems.update(0.05, {}); const after = c.runners.length;
  RepublicUI.open(); c.culled = S.time; RepublicUI.render(); const sheet = /a hooded stake stands in the ring/.test(__holds()[cd.name].textContent); RepublicUI.close();
  return { full, culled, short, after, stake: __diff(A1, B1), sheet };
});
ok('THE CULL: the Reapers harvest a runner at the Ash camp in the night — one fewer knife on its ring, the Reapers\' ledger with the Raiders a step worse, the mail — a hooded stake stands where he stood (against the same ground without it), the camp restaffs one knife short for a day and whole after it, and the sheet notes the stake',
  r.culled && r.short === r.full - 1 && r.after === r.full && r.stake > 40 && r.sheet, JSON.stringify(r));

/* ================= 12 · THE COURTING HEARD OUT ================= */
r = await ev(async () => {
  const id = 'elm', E = DATA.stations[id], st = S.stations[id];
  st.connected = true; st.met = true; st.litT = 1; State.refreshSources(true);
  S.rep.courted = null; S.rep.pressure = REP.REBELLION.period * 0.6; S.cov = 0.5;
  const need = !!(Republic.courted() === null);
  Republic.fireEvent('unlitCourting', { id });
  const courted = !!Republic.courted() && Republic.courted().id === id && !!__mail(new RegExp(`^The Unlit are COURTING ${E.name}$`)) && !!S.flags.tut.firstCourting;
  /* the half-flown shutter beside the door */
  await __look(E.x + 50, E.y + 10, { wx: E.x + 440, wy: E.y + 300 });
  const A1 = __grab(E.x + 50, E.y + 12, 40), c0 = S.rep.courted; S.rep.courted = null; await __wait(200); await __frames(3);
  const B1 = __grab(E.x + 50, E.y + 12, 40); S.rep.courted = c0; WL.timeScale = 1; __done();
  RepublicUI.open(); const H = __holds(), sheet = /THE ORDER — COURTED/.test(H[E.name].textContent) && !!H[E.name].querySelector('button[data-hear]'); RepublicUI.close();
  st.likesTo = 10; S.banked.provisions = 100;
  const refused = !Republic.hearOut() && !!Republic.courted() && S.banked.provisions === 100 && /will not sit with you yet/.test(__toasts());
  st.likesTo = 30; const p0 = S.rep.pressure, rel0 = Republic.rel('rebels', 'waylight');
  const heard = Republic.hearOut() && !Republic.courted() && S.banked.provisions === 92 && Math.abs((p0 - S.rep.pressure) - REP.REBELLION.period * 0.45) < 0.01 && st.likesTo === 34 && Republic.rel('rebels', 'waylight') === rel0 + 1 && !!__mail(new RegExp(`^${E.name}: heard out$`));
  return { courted, shutter: __diff(A1, B1), sheet, refused, heard };
});
ok('THE COURTING HEARD OUT: past 55 % of the drum\'s period the Unlit court a lit town (the mail, the lesson) — a half-flown shutter hangs beside its door (against the same door without it) and the sheet reads THE ORDER — COURTED with HEAR THEM OUT; under twenty likes the town will not sit with the Walker; at thirty, eight provisions hear them out — the drum drops 45 % of a period, the shutter comes down, the town warms by four and the Unlit\'s ledger with the Order a step better',
  r.courted && r.shutter > 40 && r.sheet && r.refused && r.heard, JSON.stringify(r));

/* ================= 13 · THE COURTING IGNORED ================= */
r = await ev(() => {
  const id = 'mill', st = S.stations[id];
  st.connected = true; st.met = true; st.litT = 1; st.likesTo = 50; State.refreshSources(true);
  const q = S.stations.quarry; q.connected = true; q.met = true; q.litT = 1; State.refreshSources(true);   // the authored first rising's own town stands lit beside it
  Republic.fireEvent('unlitCourting', { id });
  S.rep.pressure = REP.REBELLION.period; S.cov = 0.5; const risings0 = S.rep.rising || 0;
  Republic.tick(0.6);   // nobody heard them: the drum reaches its period
  return { mill: Republic.isUnlit(id), quarry: Republic.isUnlit('quarry'), courted: Republic.courted(), risings: (S.rep.rising || 0) - risings0 };
});
ok('THE COURTING IGNORED: a courted town nobody hears out is the rising\'s FIRST choice — when the drum reaches its period the Mill douses its lamp, not the Quarry the first rising is authored for, and the courting ends where the rising begins',
  r.mill && !r.quarry && r.courted === null && r.risings === 1, JSON.stringify(r));

/* ================= 14 · THE LEDGER: BANDS AND MEMORY ================= */
r = await ev(() => {
  const L = Republic.relations();
  const bands = L.every(x => REP.RELATIONS.lines[x.name] === x.line && x.col) && L.every(x => { const b = REP.RELATIONS.bands.filter(b2 => x.v >= b2[0]).pop(); return b[1] === x.name; });
  const allied = L.find(x => x.a === 'diefenbunker' && x.b === 'lamplighters'), fr = L.find(x => x.a === 'farkeep' && x.b === 'raiders');
  const moved = L.filter(x => x.why).map(x => `${x.a}|${x.b}`);
  /* the ledger holds its deltas in the save and never runs past four */
  const k = 'cannibals|reapers', d0 = S.rep.rel[k] || 0; for (let i = 0; i < 9; i++) Republic.fireEvent('reaperVisit', Republic.sites('hollowfire')[0]);
  const clamp = S.rep.rel[k] === -4; S.rep.rel[k] = d0;
  RepublicUI.open(); const rows = [...document.querySelectorAll('#repBody .rpRel')], sheet = rows.length === L.length && rows.some(x => /WAR/.test(x.textContent) && /last moved by the taking of/.test(x.textContent)) && rows.some(x => /ALLIED/.test(x.textContent) && /one fire, two banners/.test(x.textContent)); RepublicUI.close();
  return { n: L.length, bands, allied: allied && allied.name, allLine: allied && allied.line, fr: fr && [fr.v, fr.name], moved, clamp, sheet };
});
ok('THE LEDGER: THE WORLD\'S OWN WARS reads every pair (v3.41: seventeen) in its band with its line — the Society and the Nomads ALLIED, one fire, two banners; Farkeep and the Raiders at WAR since the taking — and remembers what last moved each pair (the taking, the dousing, the silence, the harvest, the hearing); the deltas never run past four',
  r.n === 17 && r.bands && r.allied === 'ALLIED' && r.allLine === 'one fire, two banners' && r.fr[1] === 'WAR' && ['farkeep|raiders', 'flamekeepers|raiders', 'flamekeepers|waylight', 'raiders|reapers', 'rebels|waylight'].every(k => r.moved.includes(k)) && r.clamp && r.sheet, JSON.stringify(r));

/* ================= 15 · FARKEEP — THE LONG HALL, WALKED ================= */
await ev(async () => {
  for (const n of NPC.party()) { n.state = 'pool'; n.at = 'haven'; }
  S.banked.metal = 600; S.banked.ceramic = 300; S.banked.wood = 300;
  S.horse = { loaner: false, rentedUntil: S.time + 99999, on: false, spookT: 0, breed: 'fjord' };
  WL.timeScale = 1; WL.tp('haven'); UI.toggleMap(true); UI.setMapView('continent'); await __wait(300); await __frames(3); Continent.openDesk('farkeepdesk');
});
await page.waitForTimeout(200);
await page.click('#contPanel [data-act="rep_hall"]');   // the desk walks the Walker into the hall
await page.waitForTimeout(300);
const hall0 = await ev(async () => {
  const R = REP.INTERIORS.farkeep_hall, rm = S.room, inside = !!rm && rm.id === 'farkeep_hall' && /FARKEEP — THE LONG HALL/.test(__toasts()) && !Continent.isOpen;
  __go(200, 140); __go(20, 140); Republic.moveRoom(0.05, { left: true }); for (let i = 0; i < 100; i++) Republic.moveRoom(0.05, { left: true }); const west = rm.x;
  for (let i = 0; i < 300; i++) Republic.moveRoom(0.05, { right: true }); const east = rm.x;
  const walls = west >= 16 && west < 22 && east <= R.w - 16 && east > R.w - 22;
  /* the shield wall reads the Standing Teeth by name, and a hung shield darkens for every stone */
  __go(200, 140); __go(100, 140); __go(100, 80); __go(200, 80);
  const fallen = S.legacy.filter(g => g.fact === 'farkeep'), sw = __prompt(/THE SHIELD WALL/); if (sw) sw.fn();
  const names = !!sw && fallen.length > 0 && fallen.slice(-4).every(g => __toasts().includes(g.name));
  await __wait(200); await __frames(3);
  const cv = document.getElementById('game'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, hung = __count(d, __hex('#5a6a7a'), 8), bare = __count(d, __hex('#8d979c'), 8);
  return { inside, walls, west: Math.round(west), east: Math.round(east), names, fallen: fallen.length, hung, bare };
});
const hearth = await ev(() => {
  __go(100, 80); __go(100, 140); __go(50, 130);
  const out = []; for (let i = 0; i < 3; i++) { const h = __prompt(/The hearth/); if (h) h.fn(); out.push((__toasts().match(/THE (FAMINE|DESCENT|CHILD)\./g) || []).pop()); }
  const child = /grey-eyed, and it did not cry once in the dark/.test(__toasts()) && /a beat too long/.test(__toasts()), mail = !!__mail(/^The founding, in three fragments$/);
  __go(100, 140); __go(200, 140); __go(353, 130);
  return { out, child, mail, yard: ['E', 'R', 'T'].map(k => (Republic.interactions().find(i => i.key === k) || {}).label || '') };
});
await page.keyboard.press('e'); await page.waitForTimeout(150);
await page.keyboard.press('r'); await page.waitForTimeout(150);
await page.keyboard.press('t'); await page.waitForTimeout(150);
r = await ev(() => {
  const kit = NPC.party().map(n => n.fkCls).join();
  __go(200, 150); __go(200, 164); const ex = __prompt(/The shield-door/); if (ex) ex.fn();
  return { kit, out: !S.room && /The shield-door swings to behind you/.test(__toasts()) };
});
ok('FARKEEP — THE LONG HALL, WALKED: Farkeep\'s desk walks the Walker into the stone hall; the walls hold at both ends; the SHIELD WALL reads the Standing Teeth by name with a darkened shield hung for every stone; the hearth tells the founding in three fragments in order — the famine, the descent, and THE CHILD carried down the pass, grey-eyed, that did not cry once in the dark, the warden looking a beat too long — and mails it; the practice yard hires the kit on three real keys (E the Longbowman, R the Rifle Rider, T the Berserker); the shield-door walks them out in its own voice',
  hall0.inside && hall0.walls && hall0.names && hall0.hung > 20 && hall0.bare > 20 && hearth.out.join() === 'THE FAMINE.,THE DESCENT.,THE CHILD.' && hearth.child && hearth.mail && /Longbowman/.test(hearth.yard[0]) && /Rifle Rider/.test(hearth.yard[1]) && /Berserker/.test(hearth.yard[2]) && r.kit === 'longbowmen,rifle_rider,berserker' && r.out, JSON.stringify({ hall0, hearth, r }));

/* ================= 16 · SHUTTERLIGHT — THE GUILD ROOM, WALKED ================= */
await ev(async () => {
  S.exile = S.exile || { phase: 'hidden', t: 0, dur: 0, guild: { done: 0, active: null }, stock: { a338: 6, cycleT: 0 }, door: 'hidden' };
  S.exile.phase = 'open'; S.exile.stock.a338 = 6; S.exile.guild.done = 4;
  UI.toggleMap(true); UI.setMapView('continent'); await __wait(300); await __frames(3); Continent.openDesk('shutterlight');
});
await page.waitForTimeout(200);
await page.click('#contPanel [data-act="guild"]');
await page.waitForTimeout(300);
r = await ev(() => {
  const R = REP.INTERIORS.shutterlight_guild, rm = S.room, inside = !!rm && rm.id === 'shutterlight_guild' && /SHUTTERLIGHT — THE GUILD ROOM/.test(__toasts());
  __go(195, 130); const frags = []; for (let i = 0; i < 3; i++) { const l = __prompt(/The hooded lantern/); if (l) l.fn(); frags.push((__toasts().match(/THE (HOOD|SWORD|MARK)\./g) || []).pop()); }
  const mark = /a hand you know — the same hand that signs your manifests/.test(__toasts()) && /Some exiles are born/.test(__toasts()) && /Some are only late/.test(__toasts()), mail = !!__mail(/^The lantern, in three fragments$/);
  __go(140, 124); __go(140, 70); __go(90, 70); const b = __prompt(/THE BOARD/); if (b) b.fn(); const board = !!b && /THE BOARD\. Guild standing 2/.test(__toasts());
  __go(310, 70); const m0 = S.banked.metal, a0 = S.gear.ammo338 || 0, c = __prompt(/The counter/); if (c) c.fn();
  const counter = !!c && S.banked.metal === m0 - 3 * DATA.T.a338Cost && (S.gear.ammo338 || 0) === a0 + 3;
  __go(240, 70); __go(240, 150); __go(200, 160); const ex = __prompt(/The shutter — walk out/); if (ex) ex.fn();
  return { inside, frags, mark, mail, board, counter, out: !S.room && /The shutter drops behind you with a sound like a decision/.test(__toasts()) };
});
ok('SHUTTERLIGHT — THE GUILD ROOM, WALKED: the Shutterlight desk walks the Walker into the timber room; the hooded lantern tells its three fragments in order — the hood, the sword, and THE MARK under the lip in a hand you know, the same hand that signs your manifests ("Some exiles are born. Some are only late.") — and mails them; the board reads the Nomads\' opinion (guild standing); the counter sells .338 across the exchange, three for their metal; the shutter walks them out in its own voice',
  r.inside && r.frags.join() === 'THE HOOD.,THE SWORD.,THE MARK.' && r.mark && r.mail && r.board && r.counter && r.out, JSON.stringify(r));

/* ================= 17 · THE MATERIALS AND THE FIT LAW ================= */
await page.setViewportSize({ width: 1280, height: 720 });
await page.waitForTimeout(500);
r = await ev(async () => {
  const out = {};
  const look0 = S.look ? { ...S.look } : null;
  for (const id of ['diefenbunker', 'farkeep_hall', 'shutterlight_guild']) {
    Republic.enterRoom(id); await __wait(250); await __frames(3);
    const R = REP.INTERIORS[id], ST = REP.ROOM_STYLES[R.style], cv = document.getElementById('game'), g = cv.getContext('2d'), P = Render.texelLaw().P;
    const bw = Math.ceil(cv.width / P), bh = Math.ceil(cv.height / P), ox = Math.round((bw - R.w) / 2), oy = Math.round((bh - R.h) / 2) + 6;
    const pt = (x, y) => [Math.round((ox + x) * P + 1), Math.round((oy + y) * P + 1)];
    const at = (x, y) => { const [px, py] = pt(x, y), d = g.getImageData(px, py, 1, 1).data; return [d[0], d[1], d[2], px, py]; };
    /* the frame's own vignette (5,7,11 at up to 0.55 from 0.42 of the short side to 0.75 of the long) laid over what the room paints */
    const vig = (px, py) => { const vw = cv.width, vh = cv.height, d = Math.hypot(px - vw / 2, py - vh / 2), r0 = Math.min(vw, vh) * 0.42, r1 = Math.max(vw, vh) * 0.75; return 0.55 * U.clamp((d - r0) / (r1 - r0), 0, 1); };
    const near = (a, hex, t = 26) => { const al = vig(a[3], a[4]), b = __hex(hex).map((v, i) => v * (1 - al) + [5, 7, 11][i] * al); return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) <= t; };
    const whole = ox - 10 >= 0 && ox + R.w + 10 <= bw && oy - 26 >= 0 && oy + R.h + 10 <= bh;
    const samp = [at(-5, 100), at(R.w + 5, 100), at(200, R.h + 5), at(230, -22)], walls = samp.slice(0, 3).every(c => near(c, ST.side, 30)) && near(samp[3], ST.wall, 30);
    const floor = near(at(135, 150), ST.floor, 20) || near(at(135, 150), ST.dot, 20) || near(at(135, 150), ST.grid, 20);
    const band = g.getImageData(Math.round((ox + R.w / 2 - 110) * P), Math.round((oy - 12) * P), Math.round(220 * P), Math.round(9 * P)).data, title = __count(band, __hex(ST.title), 20);
    /* the walker in here is the rig itself, in the coat it wears: cut a coat and the same texels answer in it */
    const full = g.getImageData(0, 0, cv.width, cv.height).data, coat = __count(full, __hex(Render.wornPal().C), 10);
    S.look = { ...(S.look || {}), C: '#b03a8c' }; await __wait(200); await __frames(3);
    const cut = __count(g.getImageData(0, 0, cv.width, cv.height).data, __hex('#b03a8c'), 10);
    if (look0) S.look = look0; else delete S.look;
    __go(200, 150); __go(200, 164); const ex = __prompt(/walk out/); if (ex) ex.fn(); await __wait(150);
    out[id] = { whole, walls, floor, title, coat, cut, style: R.style, samp: walls ? undefined : samp.map(c => '#' + c.slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('')) };
  }
  return { out, rank: Render.coatPal().C === Render.wornPal().C || !!S.look };
});
await page.setViewportSize({ width: 1440, height: 860 });
await page.waitForTimeout(400);
ok('THE MATERIALS AND THE FIT LAW: at a 1280×720 viewport each of the three rooms stands WHOLE on screen — both side walls, the floor\'s foot and the ceiling band inside the frame — in its own material (the concrete bunker, the stone hall, the timber guild room: walls and floor in its style\'s colours), its title on the ceiling band, and the Walker inside is the rig itself in the coat it wears (cut a new coat and the same texels answer in it)',
  Object.values(r.out).every(v => v.whole && v.walls && v.floor && v.title > 20 && v.coat > 10 && v.cut >= v.coat * 0.8) && r.rank, JSON.stringify(r));

/* ================= 18 · THE SAVE ================= */
r = await ev(() => {
  const before = { taken: JSON.stringify(S.camps.pass.taken), pac: S.camps.ridge.pacified, rel: JSON.stringify(S.rep.rel), log: JSON.stringify(S.rep.relLog), rep: !!S.rep.reprisal, frag: JSON.stringify(S.rep.frag), mt: S.rep.mountain.phase, unlit: Object.keys(S.rep.unlit).join(), legacy: S.legacy.filter(g => g.fact === 'farkeep').length };
  S.rep.asks.push({ id: 'shrineRaid', t0: S.time, dur: 600, site: 2, name: 'the bowl near somewhere', answers: ['feed', 'take'] });
  S.rep.courted = { id: 'green', t0: S.time };
  State.save(); const loaded = State.load();
  const after = { taken: JSON.stringify(S.camps.pass.taken), pac: S.camps.ridge.pacified, rel: JSON.stringify(S.rep.rel), log: JSON.stringify(S.rep.relLog), rep: !!S.rep.reprisal, frag: JSON.stringify(S.rep.frag), mt: S.rep.mountain.phase, unlit: Object.keys(S.rep.unlit).join(), legacy: S.legacy.filter(g => g.fact === 'farkeep').length };
  const asks = Republic.asks().some(a => a.name === 'the bowl near somewhere'), courted = !!Republic.courted() && Republic.courted().id === 'green';
  const post = !!Republic.watchpostAt(__camp('pass').x, __camp('pass').y) && FACT.FK_CLASSES.longbowmen.live;
  S.rep.asks = S.rep.asks.filter(a => a.name !== 'the bowl near somewhere'); S.rep.courted = null;
  return { loaded, same: JSON.stringify(before) === JSON.stringify(after), asks, courted, post, before };
});
ok('THE SAVE: the holdings survive a save and load — the watchpost (its shields and tithe clock) and its held ring, the light\'s stood-down camp, the relation deltas and what last moved them, the reprisal season, an open ask, a courted town, the rooms\' fragment places, the mountain road cut with its kit live, the Unlit towns, the stones',
  r.loaded !== false && r.same && r.asks && r.courted && r.post, JSON.stringify(r));

/* ================= 19 · THE MODAL LAW ================= */
await ev(async () => { WL.timeScale = 1; WL.tp('haven'); UI.toggleMap(true); UI.setMapView('continent'); await __wait(300); await __frames(3); Continent.openDesk('farkeepdesk'); });
await page.waitForTimeout(200);
await page.click('#contPanel [data-act="rep_sheet"]');   // Farkeep's desk opens the Republic in session
await page.waitForTimeout(250);
const modal = await ev(() => ({ open: !document.getElementById('republicOv').classList.contains('hidden'), table: Continent.isOpen, map: UI.mapOpen, any: UI.anyModal(), frozen: UI.worldFrozen(), gate: UI.gateReport().includes('the republic sheet'), todo: /\b(TODO|FIXME|XXX)\b/.test(document.getElementById('republicOv').innerHTML) }));
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const esc = await ev(() => document.getElementById('republicOv').classList.contains('hidden') && !UI.anyModal());
await ev(() => RepublicUI.open());
const all = await ev(() => { UI.closeAllModals(); return document.getElementById('republicOv').classList.contains('hidden') && !UI.anyModal(); });
ok('THE MODAL LAW: from Farkeep\'s desk OPEN FACTIONS closes the table and opens the sheet — it holds the world like every sheet (the modal list, the frozen clock, the gate report names it), Esc adjourns it, closing every window closes it; no TODO on it',
  modal.open && !modal.table && !modal.map && modal.any && modal.frozen && modal.gate && !modal.todo && esc && all, JSON.stringify({ modal, esc, all }));

await T.finish('the holdings');
