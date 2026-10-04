/* republic.mjs — v3.32 THE REPUBLIC IN FORCE (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48
   source was lost; its figures sampled on the courier's grid). The sandbox on one registry and one engine, measured on the
   WORLD: the registries seed real open ground; the seals hold against play and the mirrors read their own ledgers; the
   raiders' truce gates on the Road's Own, then walks, and stands the camps AND the horns down; the first rising douses
   the Quarry's lamp by choice and no core answers it; the parley walks it back; the quell's column marches the real road
   (seen on the ground), costs the town's love and raises a stone at the Standing Teeth; the bowls feed and the Keepers
   climb to ALLY with the tender at the bowl; the Reapers' file harvests only what walks into it; the far shape stands
   whole in frame with its one red light; the mountain road is funded, cut, and lives the whole kit; the kit hires at
   Farkeep's desk and the intercept reads the class row; the Diefenbunker is walked end to end; the banner sheet obeys
   the modal law, with no TODO anywhere. */
import { readFileSync } from 'fs';
import { boot, PAGE } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok } = T;
await ev(() => {
  window.__toasts = () => [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join(' | ');
  window.__mail = re => S.mails.find(m => re.test(m.subj)) || null;
  /* a frame looked at: the camera on (x, y), the Walker put somewhere else, the clock nearly held */
  window.__look = async (x, y, o = {}) => {
    const { wx = x + 300, wy = y + 180, zoom = 3, frac = 0.3 } = o;
    WL.tp([wx, wy]); S.weather.state = 'clear'; S.speed = 0; S.braced = false; S.moveTo = null;
    const DL = DATA.T.dayLen; if (frac !== null) S.time = Math.floor(S.time / DL) * DL + DL * frac;
    for (const n of NPC.party()) { n.cx = S.px + 600; n.cy = S.py + 600; }
    __clearAmb(x, y, 500); Render.clearFx(); Render.setFx(false); Render.setZoom(zoom); Render.cam.x = x; Render.cam.y = y; WL.timeScale = 0.001;
    await __wait(300); await __frames(3);
  };
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const ST = REP.STANCES, ords = Object.values(ST).map(s => s.ord);
  const ladder = Object.keys(ST).join() === 'ABSOLUTE_ALLY,ALLY,FRIENDLY,WARY,HOSTILE,ABSOLUTE_HOSTILE,UNKNOWN' && ords.every((o, i) => i === 0 || o === ords[i - 1] - 1);
  const facts = Object.keys(FACT.FACTIONS);
  const rules = facts.every(f => REP.RULES[f]) && Object.keys(REP.RULES).every(f => FACT.FACTIONS[f]) && facts.every(f => ST[Republic.stance(f)]);
  const R = REP.RULES, gates = R.raiders.steps.join() === 'HOSTILE,WARY' && R.raiders.gate.WARY.renegadeTier === 2 && R.flamekeepers.steps.join() === 'WARY,FRIENDLY,ALLY' && R.flamekeepers.gate.FRIENDLY.shrinesFed === 1 && R.flamekeepers.gate.ALLY.shrinesFed === 3 && R.rebels.posture && R.lamplighters.mirror === 'exileRank' && R.diefenbunker.mirror === 'coldDoor';
  const D = REP.DOCTRINE, doctrine = D.quell.cost.metal > 0 && D.quell.dur > 0 && D.quell.column === 3 && D.quell.apprHit > 0 && D.quell.casualty > 0 && D.parley.needLikes === 30 && D.parley.gift.provisions > 0 && D.burn.column > 0;
  const P = REP.PRESENCES, presences = P.flameshrine.kind === 'site' && P.flameshrine.count === 3 && P.hollowfire.kind === 'site' && P.hollowfire.count === 2 && P.reaperwalk.kind === 'event' && P.reaperwalk.night && P.irongiant.kind === 'event' && P.irongiant.mails.length === 3;
  const K = REP.KIT, kit = Object.keys(K).join() === 'longbowmen,rifle_rider,berserker' && K.longbowmen.stats.range === 320 && K.rifle_rider.stats.range === 380 && K.rifle_rider.req === 'horse' && K.berserker.stats.knock > 0 && Object.keys(K).every(k => FACT.FK_CLASSES[k] && !FACT.FK_CLASSES[k].live);
  const I = REP.INTERIORS.diefenbunker, room = !!I && I.style === 'concrete' && ['lockers', 'brasswall', 'logdesk', 'armory'].every(k => I.furniture.some(f => f.kind === k)) && ['brass', 'logs', 'armory', 'exit'].every(k => I.hotspots.some(h => h.id === k)) && I.logs.length === 3;
  const rows = REP.REBELLION.first === 'quarry' && REP.REBELLION.maxDark === 2 && REP.MOUNTAIN.pin.u > 0.9 && REP.MOUNTAIN.dur > 0;
  /* the Republic of Connection arrives once, and a Farkeeper ward waits at Haven's fire */
  const was = !!S.flags.fkIntro; Systems.fkIntro(); const n1 = S.mails.length; Systems.fkIntro();
  const intro = !was && !!S.flags.fkIntro && S.mails.length === n1 && !!__mail(/THE REPUBLIC$/) && S.npcs.some(n => n.fk && n.fkCls === 'pugugly' && n.at === 'haven' && n.state === 'pool');
  return { ladder, rules, gates, doctrine, presences, kit, room, rows, intro, factions: facts.length };
});
ok('THE REGISTRIES: one ordered ladder of seven stances; a RULES row for every one of the ten banners and a stance on that ladder read for each by the one engine (the raiders gated at the Road\'s Own, the Keepers at one bowl and three, the Unlit a posture, the guild and the cold door mirrored); the doctrines priced (the quell a column of three that costs love and can cost a name, the parley at thirty likes and a gift, the burning); the presences a table (three bowls, two larders, the file, the far shape with its three sightings); the kit three rows not yet live (320, 380 and a knock); the Diefenbunker a room row; the first rising authored at the Quarry; the Republic of Connection announced once, a Pugugly waiting at Haven\'s fire',
  r.ladder && r.rules && r.gates && r.doctrine && r.presences && r.kit && r.room && r.rows && r.intro && r.factions === 10, JSON.stringify(r));

/* ================= 2 · THE GROUND ================= */
r = await ev(() => {
  const sh = Republic.sites('flameshrine'), lf = Republic.sites('hollowfire');
  const open = s => { const t = World.terrainAt(s.x, s.y); return !t.blocked && !t.water && s.x > 0 && s.y > 0 && s.x < World.W && s.y < World.H && Number.isFinite(World.hgtAt(s.x, s.y)); };
  const pairs = [['haven', 'elm'], ['mill', 'relay'], ['green', 'quarry']];
  const segD = (p, a, b) => { const A = DATA.stations[a], B = DATA.stations[b], vx = B.x - A.x, vy = B.y - A.y, t = U.clamp(((p.x - A.x) * vx + (p.y - A.y) * vy) / (vx * vx + vy * vy), 0, 1); return U.dist(p.x, p.y, A.x + vx * t, A.y + vy * t); };
  const ways = sh.map((s, i) => Math.round(segD(s, ...pairs[i])));
  const far = lf.map(s => Math.round(Math.min(...DATA.stationOrder.map(id => U.dist(s.x, s.y, DATA.stations[id].x, DATA.stations[id].y)))));
  const apart = lf.length === 2 ? Math.round(U.dist(lf[0].x, lf[0].y, lf[1].x, lf[1].y)) : 0;
  const before = JSON.stringify(S.rep.sites.map(s => [s.p, s.x, s.y]));
  S.rep.sites = null;   // seeded again from the rows alone: the same ground
  const again = JSON.stringify(Republic.sites('flameshrine').concat(Republic.sites('hollowfire')).map(s => [s.p, s.x, s.y]));
  return { n: [sh.length, lf.length], open: sh.every(open) && lf.every(open), ways, far, minD: REP.PRESENCES.hollowfire.minStationDist, apart, same: before === again };
});
ok('THE GROUND: the rows seed real open ground inside the world (three bowls on the walked ways, each within a stone\'s throw of the line between its two towns; two larders far from every station and far from each other; none on rock or water) and seeding again from the rows alone lands exactly the same ground',
  r.n.join() === '3,2' && r.open && r.ways.every(d => d < 160) && r.far.every(d => d >= r.minD) && r.apart > 800 && r.same, JSON.stringify(r));

/* ================= 3 · THE SEALS ================= */
r = await ev(() => {
  const all = Object.keys(REP.STANCES), sealed = ['waylight', 'farkeep', 'reapers', 'cannibals', 'irongiants'];
  const before = sealed.map(f => Republic.stance(f));
  let moved = 0; for (const f of sealed) for (const s of all) if (Republic.setStance(f, s)) moved++;
  const after = sealed.map(f => Republic.stance(f));
  /* the mirrors read the ledgers that already stand — the guild's rank, the cold door — and no play sets them */
  const e0 = S.exile ? JSON.parse(JSON.stringify(S.exile)) : null;
  S.exile = S.exile || { phase: 'hidden', t: 0, dur: 0, guild: { done: 0, active: null }, stock: { a338: 0, cycleT: 0 }, door: 'hidden' };
  S.exile.guild.done = 0; S.exile.door = 'hidden';
  const m0 = [Republic.stance('lamplighters'), Republic.stance('diefenbunker')];
  const setM = Republic.setStance('lamplighters', 'ALLY') || Republic.setStance('diefenbunker', 'FRIENDLY');
  S.exile.guild.done = DATA.T.exRank2; const m2 = Republic.stance('lamplighters');
  S.exile.guild.done = DATA.T.exRank3; const m3 = Republic.stance('lamplighters');
  S.exile.door = 'opened'; const md = Republic.stance('diefenbunker');
  if (e0) S.exile = e0; else delete S.exile;
  /* the sheet shows the seal, not a control */
  RepublicUI.open();
  const rows = [...document.querySelectorAll('#repBody .rpRow')], rowOf = f => rows.find(x => x.querySelector('.rpName').textContent === FACT.FACTIONS[f].name);
  const sheetSeals = sealed.every(f => rowOf(f) && /SEALED BY THE FOUNDING/.test(rowOf(f).textContent) && !rowOf(f).querySelector('.rpStep'));
  const sheetMirror = /READ FROM THE GUILD LEDGER/.test(rowOf('lamplighters').textContent) && /READ FROM THE COLD DOOR/.test(rowOf('diefenbunker').textContent);
  const steps = [...document.querySelectorAll('#repBody .rpStep')].map(b => b.dataset.fid + ':' + b.dataset.st);
  RepublicUI.close();
  return { before, after, moved, m0, setM, m2, m3, md, sheetSeals, sheetMirror, steps };
});
ok('THE SEALS: no play moves a seal — every stance tried on Waylight, Farkeep, the Reapers, the Hollow Fires and the Iron Giants is refused and they stand ABSOLUTE ALLY, ABSOLUTE ALLY, ABSOLUTE HOSTILE, ABSOLUTE HOSTILE, UNKNOWN; the Lamplighters and the Society are never set but READ (the guild\'s rank two and three read FRIENDLY and ALLY, the cold door opened reads FRIENDLY); on the sheet the sealed rows carry the seal and no control, and the only steps are the raiders\', the Unlit\'s and the Keepers\'',
  r.moved === 0 && JSON.stringify(r.before) === JSON.stringify(r.after) && r.after.join() === 'ABSOLUTE_ALLY,ABSOLUTE_ALLY,ABSOLUTE_HOSTILE,ABSOLUTE_HOSTILE,UNKNOWN' && r.m0.join() === 'WARY,UNKNOWN' && !r.setM && r.m2 === 'FRIENDLY' && r.m3 === 'ALLY' && r.md === 'FRIENDLY' && r.sheetSeals && r.sheetMirror && r.steps.join() === 'raiders:HOSTILE,raiders:WARY,rebels:HOSTILE,rebels:WARY,flamekeepers:WARY,flamekeepers:FRIENDLY,flamekeepers:ALLY', JSON.stringify(r));

/* ================= 4 · THE TRUCE, GATED ================= */
await ev(() => { S.renegade = 10; UI.toggleMap(true); });
await page.waitForTimeout(200);
await page.click('#railRepublicBtn');   // the survey's rail opens the sheet
await page.waitForTimeout(200);
const gate0 = await ev(() => { const b = document.querySelector('#repBody .rpStep[data-fid="raiders"][data-st="WARY"]'); return { tier: Republic.renTier(), open: !document.getElementById('republicOv').classList.contains('hidden'), no: !!b && b.classList.contains('no'), line: !!b && /the Road's Own may call a truce/.test(b.closest('.rpRow').textContent) }; });
await page.click('#repBody .rpStep[data-fid="raiders"][data-st="WARY"]');
r = await ev(() => ({ st: Republic.stance('raiders'), truce: Republic.truce(), toast: /the Road's Own may call a truce/.test(__toasts()) }));
ok('THE TRUCE, GATED: at the Grey Hand (renegade tier one) the sheet opened from the survey\'s rail prints the raiders\' WARY step refused with its gate line, and a real click on it is answered by that line — the raiders stay HOSTILE, no truce',
  gate0.tier === 1 && gate0.open && gate0.no && gate0.line && r.st === 'HOSTILE' && !r.truce && r.toast, JSON.stringify({ gate0, r }));

/* ================= 5 · THE TRUCE, WALKED: THE CAMPS STAND DOWN ================= */
const chase = near => ev(near => {
  const cd = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass;
  WL.tp([cd.x, cd.y]); S.speed = 0; S.state = 'walk'; S.moveTo = null;
  if (!S.cargo.some(x => x.cat !== 'tool')) State.addCargo(State.makeItem('food'));
  c.runners = [{ x: cd.x + near, y: cd.y, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }];
  const hp0 = S.health, kg0 = S.cargo.length, d0 = U.dist(c.runners[0].x, c.runners[0].y, S.px, S.py);
  for (let i = 0; i < 10; i++) Systems.update(0.05, {});
  const r0 = c.runners[0];
  return { d0: Math.round(d0), d1: r0 ? Math.round(U.dist(r0.x, r0.y, S.px, S.py)) : null, hurt: Math.round(hp0 - S.health), lost: kg0 - S.cargo.length };
}, near);
await ev(() => { S.renegade = 20; RepublicUI.render(); S.health = 100; });
const base = await chase(150);   // no truce: a knife inside the claim closes on a loaded Walker
await ev(() => { S.health = 100; });
await page.click('#repBody .rpStep[data-fid="raiders"][data-st="WARY"]');
r = await ev(() => ({ tier: Republic.renTier(), st: Republic.stance('raiders'), truce: Republic.truce(), toast: /The truce holds/.test(__toasts()), mail: !!__mail(/^A truce, of a kind$/), sheet: /A RAIDER TRUCE STANDS/.test(document.getElementById('repBody').textContent) }));
await ev(() => RepublicUI.close());
const walked = await chase(150), cut = await chase(12);
ok('THE TRUCE, WALKED — THE CAMPS STAND DOWN: at the Road\'s Own a real click on WARY calls the truce (the toast, the mail, the sheet\'s A RAIDER TRUCE STANDS); the same knife that closed on a loaded Walker in the Pass camp\'s ring without it now walks its patrol away, and a knife at arm\'s length cuts nothing and takes nothing',
  r.tier === 2 && r.st === 'WARY' && r.truce && r.toast && r.mail && r.sheet && base.d0 - base.d1 > 40 && walked.d1 >= walked.d0 && cut.hurt === 0 && cut.lost === 0, JSON.stringify({ r, base, walked, cut }));

/* ================= 6 · THE HORNS STAND DOWN WITH THEM ================= */
r = await ev(() => {
  S.militia.unlocked = { haven: true }; S.militia.cdT = 0;
  const call = Systems.militiaCall(), said = /The horn sounds\. Nothing answers/.test(__toasts());
  return { call, said, answer: Republic.hornsAnswer(), scene: !!Systems.militiaScene() };
});
await ev(() => RepublicUI.open());
await page.click('#repBody .rpStep[data-fid="raiders"][data-st="HOSTILE"]');
const horns = await ev(() => {
  const st = Republic.stance('raiders'), off = /The truce is OFF/.test(__toasts());
  const call = Systems.militiaCall(), rode = /Horns from/.test(__toasts()) && !!Systems.militiaScene();
  RepublicUI.close();
  for (let i = 0; i < 200 && Systems.militiaScene(); i++) Systems.update(0.1, {});   // the riders do their work and leave
  return { st, off, call, rode, answer: Republic.hornsAnswer(), gone: !Systems.militiaScene() };
});
ok('THE HORNS STAND DOWN WITH THEM: under the truce the horn is blown and nothing answers (refused, said once, no riders); a real click on HOSTILE breaks the truce and the next horn brings the Farkeeper riders from Haven',
  !r.call && r.said && !r.answer && !r.scene && horns.st === 'HOSTILE' && horns.off && horns.call && horns.rode && horns.answer, JSON.stringify({ r, horns }));

/* ================= 7 · THE RISING ================= */
await ev(() => { const Q = DATA.stations.quarry, st = S.stations.quarry; st.connected = true; st.met = true; st.litT = 1; State.refreshSources(); });
await T.drain();
r = await ev(async () => {
  const Q = DATA.stations.quarry, st = S.stations.quarry, id = 'quarry';
  /* the light as the ground is painted with it (the day field, texel for texel at the door) and as the night shows it */
  const field = () => { const TS = World.TS, g = World.lightOv.getContext('2d'), d = g.getImageData(Math.floor(Q.x / TS) - 3, Math.floor(Q.y / TS) + 2, 7, 7).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) * d[i + 3] / 255; return Math.round(s / (d.length / 4)); };
  const lum = d => { let s = 0; for (let i = 0; i < d.length; i += 4) s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; return Math.round(s / (d.length / 4)); };
  const light0 = World.lightAt(Q.x, Q.y), field0 = field();
  await __look(Q.x, Q.y + 60, { wx: Q.x + 520, wy: Q.y + 340, zoom: 2, frac: 0.86 });
  const night0 = lum(__grab(Q.x, Q.y + 60, 150));
  S.rep.pressure = REP.REBELLION.period; S.cov = 0.5;
  Republic.tick(0.6);   // the drum reaches its period: the rising
  const crt = Render.crtText();
  await __wait(700); await __frames(4);
  const night1 = lum(__grab(Q.x, Q.y + 60, 150)), light1 = World.lightAt(Q.x, Q.y), field1 = field();
  World.rebuildLight(); const field2 = field(), light2 = World.lightAt(Q.x, Q.y);   // the light rebuilt whole from its sources: the dark is the town's choice, not a stale paint
  WL.timeScale = 1; __done();
  const unlit = Republic.isUnlit(id) && !st.connected && Republic.unlitList().join() === id && S.rep.rising === 1;
  const mail = !!__mail(new RegExp(`^${Q.name} joined the Unlit$`));
  /* no core answers a choice: marked quiet like a starved town, it still posts no relight — the starved town beside it does */
  S.quiet = S.quiet || {}; const g = S.stations.green, g0 = g.connected; g.connected = false; S.quiet.green = true; S.quiet.quarry = true;
  const ords = Economy.ordersFor('haven'), relQ = ords.some(o => o.relight === id), relG = ords.some(o => o.relight === 'green');
  delete S.quiet.green; delete S.quiet.quarry; g.connected = g0;
  RepublicUI.open(); const hold = [...document.querySelectorAll('#repBody .rpHold')].find(x => x.querySelector('.rpName').textContent === Q.name);
  const sheet = !!hold && /THE UNLIT/.test(hold.textContent) && /UNLIT — BY CHOICE/.test(hold.textContent) && !!hold.querySelector('[data-quell="quarry"]') && /the parley wants 30 likes/.test(hold.textContent);
  RepublicUI.close();
  return { light0: +light0.toFixed(2), light1: +light1.toFixed(2), light2: +light2.toFixed(2), field0, field1, field2, night0, night1, crt, unlit, mail, relQ, relG, sheet };
});
ok('THE RISING: the drum reaches its period and the authored first rising takes the Quarry — its waylight doused BY CHOICE (the CRT reads THE UNLIT, the mail, the town off the wire; the light at its door gone, the ground\'s painted light field dark there — and still dark when the valley\'s light is rebuilt whole from its sources — and by night the frame round its door gone from its day face to the deep blue), no core answers it (marked quiet like a starved town it posts no relight walk, where the starved town beside it does), and the sheet reads THE UNLIT — UNLIT BY CHOICE with the quell and the parley\'s terms',
  r.unlit && r.crt && r.crt.big === 'THE UNLIT' && r.mail && r.light0 > 0.5 && r.light1 < 0.1 && r.field1 < r.field0 * 0.6 && r.light2 < 0.1 && r.field2 < r.field0 * 0.6 && r.night1 < r.night0 * 0.7 && !r.relQ && r.relG && r.sheet, JSON.stringify(r));

/* ================= 8 · THE PARLEY ================= */
r = await ev(() => {
  WL.timeScale = 1;
  const Q = DATA.stations.quarry, st = S.stations.quarry; WL.tp('quarry'); S.speed = 0;
  st.likesTo = 10; S.banked.provisions = 30;
  const prompt = () => Republic.interactions().find(i => i.key === 'E' && /THE PARLEY/.test(i.label));
  const p1 = prompt(); UI.updatePrompts(Systems.getInteractions()); const onRail = /THE PARLEY/.test(document.getElementById('prompts').textContent);
  p1.fn();
  const refused = Republic.isUnlit('quarry') && S.banked.provisions === 30 && /the door remembers 30 likes/.test(__toasts());
  st.likesTo = 40; const p2 = prompt(); p2.fn();
  const walked = !Republic.isUnlit('quarry') && st.connected && S.banked.provisions === 30 - REP.DOCTRINE.parley.gift.provisions && !!S.rep.parleyed.quarry && !!__mail(new RegExp(`^${Q.name}: the light is restored by a walk$`));
  return { p1: !!p1, onRail, refused, walked, again: Republic.tryParley('quarry'), chief: Republic.parleyNear() };
});
ok('THE PARLEY: at the Quarry\'s cold fire the rail offers THE PARLEY on E; with ten likes at their door it is refused by name (the door remembers thirty) and nothing is paid; at forty the Walker\'s own boots and a gift of twelve provisions put the light back up — the town lit, the gift paid, the walk remembered, its mail — and a lit town takes no second parley (no chief\'s grudge answers here either)',
  r.p1 && r.onRail && r.refused && r.walked && r.again === false && !r.chief, JSON.stringify(r));

/* ================= 9 · THE QUELL MARCHES THE REAL ROAD ================= */
r = await ev(() => {
  const id = 'green', G = DATA.stations.green, st = S.stations.green;
  st.connected = true; st.met = true; st.litT = 1; State.refreshSources();
  Republic.rebellionStrike(id);   // a second town douses its lamp
  S.banked.metal = 10; S.banked.provisions = 5;
  const refused = !Republic.fundQuell(id) && !Republic.quell() && /The quell wants/.test(__toasts());
  S.banked.metal = 300; S.banked.provisions = 200; st.likesTo = 50;
  RepublicUI.open();
  return { unlit: Republic.isUnlit(id), refused };
});
await page.click('#repBody button[data-quell="green"]');   // a real click funds it
const march = await ev(async () => {
  const q = Republic.quell(), paid = S.banked.metal === 300 - REP.DOCTRINE.quell.cost.metal && S.banked.provisions === 200 - REP.DOCTRINE.quell.cost.provisions;
  RepublicUI.close();
  if (!q) return { q: null, paid };
  /* the road: every stretch of the column's line on ground a walker can stand on (rock never; water only at a crossing) */
  let bad = 0, n = 0;
  for (let i = 1; i < q.pts.length; i++) {
    const [x0, y0] = q.pts[i - 1], [x1, y1] = q.pts[i], L = U.dist(x0, y0, x1, y1), k = Math.max(1, Math.ceil(L / 12));
    for (let j = 0; j <= k; j++) { const x = x0 + (x1 - x0) * j / k, y = y0 + (y1 - y0) * j / k, t = World.terrainAt(x, y); n++; if (t.blocked || (t.water && !Systems.crossingAt(x, y))) bad++; }
  }
  const A = DATA.stations[q.from], G = DATA.stations.green, straight = U.dist(A.x, A.y, G.x, G.y);
  /* seen on the ground: the shields on the road, against the same frame without them */
  q.t = q.dur * 0.35;
  const p = Republic.columnPos(q.t / q.dur, 44);
  await __look(p.x, p.y, { wx: p.x + 420, wy: p.y + 260 });
  const A1 = __grab(p.x, p.y - 20, 110);
  S.rep.quell = null; await __wait(200); await __frames(3);
  const B1 = __grab(p.x, p.y - 20, 110);
  S.rep.quell = q; await __wait(200); await __frames(3);
  const seen = __diff(A1, B1);
  const onGround = [0, 44, 88].map(l => Republic.columnPos(q.t / q.dur, l)).every(c => !World.terrainAt(c.x, c.y).blocked);
  WL.timeScale = 1; __done();
  return { kind: q.kind, target: q.target, from: q.from, col: q.col, pts: q.pts.length, len: Math.round(q.len), straight: Math.round(straight), bad, n, paid, seen, onGround };
});
ok('THE QUELL MARCHES THE REAL ROAD: a second town douses its lamp; the quell is refused without its stores; a real click on THE QUELL pays forty metal and twenty provisions and three Farkeeper shields muster at the nearest lit town and take the walked road — every stretch of its line on ground a walker stands on, longer than the crow\'s line — and the column is SEEN on the ground (the shields on the road against the same frame without them)',
  r.unlit && r.refused && march.kind === 'quell' && march.target === 'green' && march.col === 3 && march.paid && march.pts > 2 && march.bad === 0 && march.len >= march.straight && march.onGround && march.seen > 150, JSON.stringify({ r, march }));

/* ================= 10 · THE QUELL LANDS: THE LIGHT BY FORCE, THE PRICE, THE STONE ================= */
await T.drain();
r = await ev(() => {
  const id = 'green', G = DATA.stations.green, st = S.stations.green, likes0 = st.likesTo, legacy0 = S.legacy.length;
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;   // by day: nothing else on the clock
  const q = Republic.quell(); q.t = q.dur;
  const rnd = Math.random; Math.random = () => 0;   // the casualty roll comes up: the mountain pays a name
  try { Republic.tick(0.01); } finally { Math.random = rnd; }
  const crt = Render.crtText();
  const lit = !Republic.isUnlit(id) && st.connected && !Republic.quell();
  const price = +(likes0 - st.likesTo).toFixed(1);
  const row = S.legacy.slice(legacy0).find(g => g.fact === 'farkeep');
  const stone = !!row && row.cls === 'Farkeeper Shield' && new RegExp(`fell quelling ${G.name}`).test(row.fate) && !!__mail(new RegExp(`^${row.name} did not march home$`)) && Memorial.grounds().includes('farkeep') && Memorial.DESIGNS.farkeep.ground === 'THE STANDING TEETH' && Memorial.rows('farkeep').some(x => x.name === row.name);
  return { lit, crt, price, hit: REP.DOCTRINE.quell.apprHit, stone, mail: !!__mail(new RegExp(`^${G.name}: the light is restored by force$`)), row: row && { name: row.name, fate: row.fate } };
});
ok('THE QUELL LANDS: the column arrives and the light is restored by force (the town lit, THE QUELL HOLDS on the CRT, its mail), the town pays the love it remembers (eight likes), and the casualty roll raises a stone — a Farkeeper Shield on the roll who fell quelling the town, the mail that says so, and THE STANDING TEETH revealed with the name on its ground',
  r.lit && r.crt && r.crt.big === 'THE QUELL HOLDS' && r.mail && r.price === r.hit && r.stone, JSON.stringify(r));

/* ================= 11 · THE BOWL FED ================= */
r = await ev(async () => {
  const s = Republic.sites('flameshrine')[0], near = DATA.stationOrder.reduce((b, id) => U.dist(s.x, s.y, DATA.stations[id].x, DATA.stations[id].y) < U.dist(s.x, s.y, DATA.stations[b].x, DATA.stations[b].y) ? id : b, 'haven');
  WL.tp([s.x + 20, s.y + 12]); S.speed = 0;
  const feed = () => Republic.interactions().find(i => i.key === 'E' && /Feed the flame/.test(i.label));
  S.banked.lumen = 0; const f1 = feed(); f1.fn();
  const refused = !(s.fedUntil > S.time) && /The bowl wants <?b?>?2 lumen/.test(__toasts().replace(/<[^>]+>/g, '')) && Republic.stance('flamekeepers') === 'WARY';
  S.banked.lumen = 10; const likes0 = S.stations[near].likesTo; feed().fn();
  const fed = s.fedUntil > S.time && S.banked.lumen === 8 && Republic.shrinesFed() === 1 && Republic.stance('flamekeepers') === 'FRIENDLY' && S.stations[near].likesTo === likes0 + REP.PRESENCES.flameshrine.appr && /The bowl takes the light/.test(__toasts());
  const warm = Republic.interactions().some(i => /The fed bowl burns tall/.test(i.label));
  /* the bowl burns tall on the ground, against the same frame cold */
  await __look(s.x, s.y - 16, { wx: s.x + 360, wy: s.y + 240 });
  const A1 = __grab(s.x, s.y - 20, 40), until = s.fedUntil;
  s.fedUntil = 0; await __wait(200); await __frames(3);
  const B1 = __grab(s.x, s.y - 20, 40); s.fedUntil = until;
  WL.timeScale = 1; __done();
  return { refused, fed, warm, seen: __diff(A1, B1) };
});
ok('THE BOWL FED: at a bowl on the walked way the rail offers the feeding; with no lumen banked it is refused and the Keepers stay WARY; with lumen the bowl takes two and burns for most of a day, the nearest town is warmer by one, the Keepers step to FRIENDLY at one bowl fed, the fed bowl warms the hands — and it stands a tall flame on the ground against the same frame cold',
  r.refused && r.fed && r.warm && r.seen > 60, JSON.stringify(r));

/* ================= 12 · THE LADDER CLIMBED: ALLY, AND THE TENDER AT THE BOWL ================= */
r = await ev(async () => {
  RepublicUI.open();
  const b = document.querySelector('#repBody .rpStep[data-fid="flamekeepers"][data-st="ALLY"]');
  const gated = !!b && b.classList.contains('no') && /feed every shrine on the march/.test(b.closest('.rpRow').textContent);
  RepublicUI.close();
  const early = Republic.setStance('flamekeepers', 'ALLY');
  S.banked.lumen = 20;
  for (const s of Republic.sites('flameshrine').slice(1)) { WL.tp([s.x + 20, s.y + 12]); const f = Republic.interactions().find(i => i.key === 'E' && /Feed the flame/.test(i.label)); if (f) f.fn(); }
  const ally = Republic.shrinesFed() === 3 && Republic.stance('flamekeepers') === 'ALLY';
  /* the promise at ALLY kept in pixels: a tender stands the fed bowl, torch up — against the same frame at FRIENDLY */
  const s = Republic.sites('flameshrine')[0];
  await __look(s.x + 10, s.y - 16, { wx: s.x + 380, wy: s.y + 240 });
  const A1 = __grab(s.x + 18, s.y - 20, 34);
  S.rep.stance.flamekeepers = 'FRIENDLY'; await __wait(200); await __frames(3);
  const B1 = __grab(s.x + 18, s.y - 20, 34);
  S.rep.stance.flamekeepers = 'ALLY'; WL.timeScale = 1; __done();
  return { gated, early, ally, tender: __diff(A1, B1) };
});
ok('THE LADDER CLIMBED: with one bowl fed the sheet holds ALLY behind its gate line (feed every shrine on the march) and play cannot jump it; the other two bowls fed by hand bring the Flame Keepers to ALLY — and a tender stands the fed bowl with her torch, against the same frame at FRIENDLY',
  r.gated && !r.early && r.ally && r.tender > 60, JSON.stringify(r));

/* ================= 13 · THE PROCESSION HARVESTS ONLY WHAT WALKS IN ================= */
/* a night in the grey, off every road and camp */
const grey = await ev(() => {
  let best = null;
  for (let y = 600; y < DATA.H - 600; y += 150) for (let x = 600; x < DATA.W - 600; x += 150) {
    const t = World.terrainAt(x, y); if (t.blocked || t.water) continue;
    if (DATA.camps.some(cd => U.dist(x, y, cd.x, cd.y) < cd.r + 300) || Republic.sites('hollowfire').some(s => U.dist(x, y, s.x, s.y) < 500) || DATA.stationOrder.some(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) < 700)) continue;
    const ok2 = [[-240, 0], [240, 0], [0, -120], [0, 120]].every(([dx, dy]) => !World.terrainAt(x + dx, y + dy).blocked);
    const m = World.mistAt(x, y); if (ok2 && (!best || m > best.m)) best = { x, y, m };
  }
  return best;
});
r = await ev(async g => {
  WL.tp([g.x, g.y]); S.speed = 0; S.health = 100; S.stagger = 0; S.bleeding = false; S.warmth = 100; S.food = 100;   // v3.51: no wound bleeding from an earlier knock (a one-in-three chance) moves the health the toll is read from
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.8;
  const wa = 0, sp = 26, mk = y => ({ t: 0, file: [0, 1, 2, 3].map(i => ({ x: g.x - 200 - i * 34, y })), vx: Math.cos(wa) * sp, vy: Math.sin(wa) * sp, hitCd: 0 });
  /* standing off its line: the file passes, does not turn, takes nothing */
  S.rep.evt = mk(g.y - 90); const v0 = [S.rep.evt.vx, S.rep.evt.vy];
  for (let i = 0; i < 30; i++) Republic.tick(0.5);
  const e1 = S.rep.evt, passed = !!e1 && e1.file[3].x > g.x + 40 && e1.vx === v0[0] && e1.vy === v0[1] && e1.file.every(f => Math.abs(f.y - (g.y - 90)) < 0.01), hp1 = S.health;
  /* the file SEEN crossing the grey: against the same frame without it */
  S.rep.evt = mk(g.y - 40); S.rep.evt.file.forEach((f, i) => { f.x = g.x + 60 - i * 34; });
  await __look(g.x - 40, g.y - 50, { wx: g.x, wy: g.y, zoom: 3, frac: null });
  const A1 = __grab(g.x - 40, g.y - 60, 90); const keep = S.rep.evt;
  S.rep.evt = null; await __wait(200); await __frames(3);
  const B1 = __grab(g.x - 40, g.y - 60, 90); S.rep.evt = keep; WL.timeScale = 1; __done();
  /* walking into it: the toll */
  WL.tp([g.x, g.y]); S.rep.evt = mk(g.y);
  for (let i = 0; i < 16 && S.health === hp1; i++) Republic.tick(0.5);
  const hit = hp1 - S.health, toast = /You walked into the file/.test(__toasts());
  S.rep.evt = null; S.health = 100; S.stagger = 0;
  return { mist: +g.m.toFixed(2), passed, hp1, hit, toll: REP.PRESENCES.reaperwalk.touchDmg, toast, seen: __diff(A1, B1) };
}, grey);
ok('THE PROCESSION HARVESTS ONLY WHAT WALKS IN: at night in the grey a hooded file of four crosses ninety paces off the Walker\'s line and takes nothing — it holds its heading and its line, no chase — and is seen crossing (against the same frame without it); step into its path and a hand like winter takes its toll, said once',
  !!grey && r.passed && r.hp1 === 100 && r.hit === r.toll && r.toast && r.seen > 40, JSON.stringify(r));

/* ================= 14 · THE FAR SHAPE STANDS WHOLE IN FRAME ================= */
r = await ev(async g => {
  WL.tp([g.x, g.y]); S.speed = 0; S.health = 100;
  const DL = DATA.T.dayLen, G = REP.PRESENCES.irongiant;
  S.time = (Math.floor(S.time / DL) + 3) * DL + DL * 0.56;   // dusk, three days on
  const gi = Republic.giant(); gi.seen = 0; gi.cd = 0; gi.act = null;
  const sight = () => { const rnd = Math.random; Math.random = () => 0; try { Republic.tick(0.6); } finally { Math.random = rnd; } return gi.act; };
  const a1 = sight(); const m1 = !!__mail(/^A SHAPE IN THE FAR GREY$/);
  gi.act = null; gi.cd = 0; sight(); gi.act = null; gi.cd = 0; const a3 = sight();
  const three = gi.seen === 3 && !!__mail(/^THE SHAPE AGAIN$/) && !!__mail(/^THE THIRD SIGHTING$/) && /standing watch/.test(__mail(/^THE THIRD SIGHTING$/).body);
  const placed = !!a1 && Math.abs(a1.x - S.px) === 95 && a1.y === S.py + 74 && a1.t === G.dur;
  /* the player's own frame: the camera on the Walker at the wheel's own level */
  Render.setZoom(null); Render.clearFx(); Render.setFx(false); __clearAmb(S.px, S.py, 600);
  WL.timeScale = 0.02; await __wait(2500); WL.timeScale = 0.001; Render.cam.x = S.px; Render.cam.y = S.py; await __wait(200); await __frames(3);
  const cv = document.getElementById('game'), W2 = cv.width, H2 = cv.height, g2 = cv.getContext('2d');
  const A1 = g2.getImageData(0, 0, W2, H2).data; const act = gi.act;
  gi.act = null; await __wait(200); await __frames(3);
  const B1 = g2.getImageData(0, 0, W2, H2).data; gi.act = act; await __wait(150); await __frames(2);
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, n = 0, red = 0;
  for (let i = 0; i < A1.length; i += 4) {
    if (Math.abs(A1[i] - B1[i]) + Math.abs(A1[i + 1] - B1[i + 1]) + Math.abs(A1[i + 2] - B1[i + 2]) <= 60) continue;
    const p = i >> 2, x = p % W2, y = (p / W2) | 0; n++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    if (A1[i] > 180 && A1[i + 1] < 150 && A1[i + 2] < 130) red++;
  }
  const L = Render.texelLaw(), tex = L.rigK / L.zw * (Render.effZoom() / devicePixelRatio) * devicePixelRatio, want = SPRITES.FIG.giant.h * tex;
  WL.timeScale = 1; __done(); gi.act = null;
  return { placed, m1, three, box: [x0, y0, x1, y1], W2, H2, n, red, hgt: y1 - y0, want: Math.round(want) };
}, grey);
ok('THE FAR SHAPE STANDS WHOLE IN FRAME: at dusk in the grey the shape stands up at the Walker\'s flank (ninety-five paces aside, its feet toward the deeper grey) and is mailed — again, and at the third sighting the Farkeepers post a standing watch; in the player\'s own frame at the wheel\'s level it stands WHOLE — every texel it changes inside the canvas, its full height drawn — with the one red running light burning',
  r.placed && r.m1 && r.three && r.n > 500 && r.box[0] > 0 && r.box[1] > 0 && r.box[2] < r.W2 - 1 && r.box[3] < r.H2 - 1 && r.hgt >= r.want * 0.9 && r.red > 0, JSON.stringify(r));

/* ================= 15 · THE MOUNTAIN ROAD, FUNDED AND CUT ================= */
await ev(async () => { S.banked.metal = 20; S.banked.wood = 0; S.banked.provisions = 0; UI.toggleMap(true); UI.setMapView('continent'); await __wait(300); await __frames(3); Continent.openDesk('mountain'); });
await page.waitForTimeout(200);
const table0 = await ev(() => ({ open: Continent.isOpen, hits: (Continent._st.hits || []).map(h => h.id), desk: document.getElementById('contPanel').textContent }));
await page.click('#contPanel [data-act="rep_mountain"]');
const poor = await ev(() => ({ phase: Republic.mountain().phase, said: /The mountain road wants/.test(__toasts()) }));
await ev(() => { S.banked.metal = 400; S.banked.wood = 200; S.banked.provisions = 200; });
await page.click('#contPanel [data-act="rep_mountain"]');
r = await ev(async () => {
  const funded = Republic.mountain().phase === 'cutting' && S.banked.metal === 400 - REP.MOUNTAIN.cost.metal && S.banked.wood === 200 - REP.MOUNTAIN.cost.wood && S.banked.provisions === 200 - REP.MOUNTAIN.cost.provisions && !!__mail(/^The road-gangs muster$/);
  Continent.closeDesk(); UI.toggleMap(false);
  await new Promise(res => { const f = () => (Render.crtActive() ? setTimeout(f, 200) : res()); f(); });
  const mt = Republic.mountain(); mt.t = REP.MOUNTAIN.dur - 0.1; Republic.tick(0.6);
  const crt = Render.crtText();
  const open = mt.phase === 'open' && Object.keys(REP.KIT).every(k => FACT.FK_CLASSES[k].live && Object.entries(REP.KIT[k].stats).every(([s, v]) => FACT.FK_CLASSES[k].stats[s] === v));
  const farlands = Globe.REGIONS.find(g => g.id === 'farlands').open === true;
  const mail = !!__mail(/^THE MOUNTAIN ROAD IS CUT$/) && !!S.flags.tut.firstMountain && Memorial.grounds().includes('farkeep');
  UI.toggleMap(true); UI.setMapView('continent'); await __wait(300); await __frames(4);
  Continent.bake(); const gm = Continent.gmRect(), hits = (Continent._st.hits || []).map(h => h.id);
  const east = REP.MOUNTAIN.pin.u > gm.u0 + gm.w && REP.MOUNTAIN.farkeepPin.u > gm.u0 + gm.w && !!Continent.win && Continent.win.lonW > 0;
  UI.setMapView('world'); await __wait(300); await __frames(3);
  const globe = Globe.isOpen && Globe._st.open && Globe._pad().R > 0;
  UI.setMapView('valley'); UI.toggleMap(false);
  return { funded, crt, open, farlands, mail, hits, east, globe };
});
ok('THE MOUNTAIN ROAD, FUNDED AND CUT: the region map carries THE MOUNTAIN PASS pin on its far EAST edge (past the valley\'s own footprint) and its desk; a real click with the bank short is refused by name; funded it pays ninety metal, sixty wood and thirty provisions and the road-gangs muster; cut, the CRT reads THE MOUNTAIN ROAD IS CUT and the kit of the mountain LIVES (every class row live with its stats), the Farlands open on the world map, the mail and the lesson, the Standing Teeth revealed, and Farkeep\'s own desk stands on the table',
  table0.open && table0.hits.includes('mountain') && !table0.hits.includes('farkeepdesk') && /FUND THE MOUNTAIN ROAD/.test(table0.desk) && poor.phase === 'unknown' && poor.said && r.funded && r.crt && r.crt.big === 'THE MOUNTAIN ROAD IS CUT' && r.open && r.farlands && r.mail && r.hits.includes('farkeepdesk') && r.east && r.globe, JSON.stringify({ table0, poor, r }));

/* ================= 16 · THE WHOLE KIT HIRES AT FARKEEP'S DESK ================= */
await ev(async () => {
  for (const n of NPC.party()) { n.state = 'pool'; n.at = 'haven'; }
  S.banked.metal = 500; S.banked.ceramic = 200; S.banked.wood = 200; S.horse = null;
  WL.tp('haven'); UI.toggleMap(true); UI.setMapView('continent'); await __wait(300); await __frames(3); Continent.openDesk('farkeepdesk');
});
await page.waitForTimeout(200);
const desk = await ev(() => document.getElementById('contPanel').textContent);
const hire = async cls => { await page.click(`#contPanel [data-act="rep_hire_${cls}"]`); await page.waitForTimeout(150); return ev(cls => ({ n: NPC.party().filter(n => n.fk && n.fkCls === cls).length, toast: __toasts() }), cls); };
const bow = await hire('longbowmen');
const noHorse = await hire('rifle_rider');
await ev(() => { S.horse = { loaner: false, rentedUntil: S.time + 600, on: false, spookT: 0, breed: 'mustang' }; });
const horseOk = await ev(() => Systems.horseAvail());
const rider = await hire('rifle_rider');
const zerk = await hire('berserker');
r = await ev(() => {
  const pt = NPC.party(), cls = pt.map(n => n.fkCls);
  Continent.closeDesk(); UI.setMapView('valley'); UI.toggleMap(false);
  return { party: cls, allFk: pt.every(n => n.fk && FACT.FK_CLASSES[n.fkCls].live), metal: S.banked.metal, ceramic: S.banked.ceramic, wood: S.banked.wood };
});
const fees = { metal: 500 - 30 - 60 - 44, ceramic: 200 - 12 - 20, wood: 200 - 16 };
ok('THE WHOLE KIT HIRES AT FARKEEP\'S DESK: the desk offers the Longbowman, the Rifle Rider (wants a horse) and the Berserker and the walk into the long hall; real clicks hire the Longbowman for his fee, refuse the Rifle Rider by name until a horse is on the papers, then hire him and the Berserker — three Farkeepers of the kit walking with the Walker, every fee paid once',
  /LONGBOWMAN/.test(desk) && /RIFLE RIDER/.test(desk) && /BERSERKER/.test(desk) && /WALK THE LONG HALL/.test(desk) && bow.n === 1 && noHorse.n === 0 && /wants a horse on your papers/.test(noHorse.toast) && horseOk && rider.n === 1 && zerk.n === 1 && r.party.join() === 'longbowmen,rifle_rider,berserker' && r.allFk && r.metal === fees.metal && r.ceramic === fees.ceramic && r.wood === fees.wood, JSON.stringify({ bow: bow.n, noHorse: noHorse.n, horseOk, rider: rider.n, zerk: zerk.n, r }));

/* ================= 17 · THE INTERCEPT READS THE CLASS ROW ================= */
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass;
  const trial = (cls, near, diag) => {
    WL.tp([cd.x, cd.y]); S.speed = 0; S.state = 'walk'; S.moveTo = null; S.health = 100; S.bleeding = false; S.warmth = 100;   // v3.51: untouched means the knife's — not an old wound's bleed
    if (!S.cargo.some(x => x.cat !== 'tool')) State.addCargo(State.makeItem('food'));
    for (const n of NPC.party()) { n.shoveCd = n.fkCls === cls ? 0 : 99; n.hungry = false; n.cx = S.px - 18; n.cy = S.py + 10; NPC.svc(n).met = 0; if (diag) { n.x = n.cx; n.y = n.cy; } }
    c.runners = [{ x: cd.x + near, y: cd.y, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }];
    const rr = c.runners[0];
    let at = null;
    for (let i = 0; i < 20; i++) { Systems.update(0.05, {}); if (rr.cd > 0 && !at) { at = { x: Math.round(rr.x - cd.x), d: Math.round(U.dist(rr.x, rr.y, S.px, S.py)), cd: +rr.cd.toFixed(1) }; break; } }
    const n = NPC.party().find(m => m.fkCls === cls);
    return { met: NPC.svc(n).met, at, hurt: 100 - S.health, nx: n.x === undefined ? 'unset' : Math.round(n.x) };
  };
  const bowT = trial('longbowmen', 210), riderT = trial('rifle_rider', 215), zerkT = trial('berserker', 150);
  /* the evidence for the fail: handed the position the engine reads, the same trials meet the knife from the row */
  const diag = { bow: trial('longbowmen', 210, true), rider: trial('rifle_rider', 215, true), zerk: trial('berserker', 150, true) };
  for (const n of NPC.party()) { n.shoveCd = 0; delete n.x; delete n.y; }
  return { bowT, riderT, zerkT, diag };
});
const dropped = t => t.met === 1 && t.at && t.at.cd >= 8 && t.hurt === 0;
ok('THE INTERCEPT READS THE CLASS ROW: a knife closing on a loaded Walker in the Pass camp\'s ring is met from the class\'s own row — the Longbowman and the Rifle Rider DROP him where he stands at range (downed, no shove, the Walker untouched), the Berserker knocks him sprawling up close',
  dropped(r.bowT) && dropped(r.riderT) && r.zerkT.met === 1 && r.zerkT.at && r.zerkT.at.d > 300 && r.zerkT.hurt === 0, JSON.stringify(r));   // v3.51: the regression this check found (the intercept read n.x, which no back carries) is fixed in NPC.intercept

/* ================= 18 · THE DIEFENBUNKER, WALKED ================= */
await ev(async () => {
  for (const n of NPC.party()) { n.cx = S.px + 600; n.cy = S.py + 600; }
  S.exile = S.exile || { phase: 'hidden', t: 0, dur: 0, guild: { done: 0, active: null }, stock: { a338: 0, cycleT: 0 }, door: 'hidden' };
  S.exile.door = 'hidden'; window.__knock0 = Exile.knock();   // a door the guild has not marked answers no knock
  S.exile.door = 'seen'; WL.tp('haven'); UI.toggleMap(true); UI.setMapView('continent'); await __wait(300); await __frames(3); Continent.openDesk('colddoor');
});
await page.waitForTimeout(200);
await page.click('#contPanel [data-act="knock"]');
await ev(() => { Myth.skip(); });
await page.waitForTimeout(200);
await page.click('#contPanel [data-act="inside"]');
await page.waitForTimeout(400);
const inside = await ev(async () => {
  const R = REP.INTERIORS.diefenbunker, rm = S.room;
  const opened = S.exile.door === 'opened' && !!rm && rm.id === 'diefenbunker' && rm.x === R.entry.x && rm.y === R.entry.y && /THE DIEFENBUNKER — ENTRY HALL/.test(__toasts());
  const knocks = { unmarked: __knock0, again: Exile.knock(), still: S.exile.door };   // the door opens once: a second knock changes nothing
  await __wait(250); await __frames(3);
  const cv = document.getElementById('game'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  const brass = __count(d, __hex('#a5854a'), 12) + __count(d, __hex('#8a6534'), 12), stencil = __count(d, __hex('#c25038'), 14), strip = __count(d, __hex('#8fb08a'), 12);
  return { opened, knocks, brass, stencil, strip };
});
await page.keyboard.down('ArrowUp'); await page.waitForTimeout(600); await page.keyboard.up('ArrowUp');   // the Walker's own keys walk the floor
r = await ev(() => {
  const R = REP.INTERIORS.diefenbunker, rm = S.room, y0 = R.entry.y, keyed = rm.y < y0 - 10;
  const step = (inp, k = 1) => { for (let i = 0; i < k; i++) Republic.moveRoom(0.05, inp); };
  const go = (tx, ty) => { for (let i = 0; i < 600 && U.dist(rm.x, rm.y, tx, ty) > 2; i++) step({ left: rm.x > tx + 1, right: rm.x < tx - 1, up: rm.y > ty + 1, down: rm.y < ty - 1 }); return U.dist(rm.x, rm.y, tx, ty) <= 2.5; };
  const read = (id, k = 1) => { const p = Republic.interactions().filter(i => i.key === 'E'); const h = R.hotspots.find(x => x.id === id), mine = p.find(i => i.label.includes(h.label.split(' — ')[0])); for (let j = 0; j < k && mine; j++) mine.fn(); return !!mine; };
  /* end to end: the walls hold at both ends of the floor */
  go(200, 140); step({ left: true }, 300); const west = rm.x; step({ right: true }, 400); const east = rm.x;
  const walls = west >= 16 && west < 22 && east <= R.w - 16 && east > R.w - 22;
  go(200, 60); const brassP = read('brass'), brassT = /THE BRASS WALL/.test(__toasts());
  go(200, 140); go(73, 140); const logsP = read('logs', 3), logMail = !!__mail(/^The SBSN record, read standing up$/), logIdx = S.rep.logIdx;
  go(327, 140); const armP = read('armory'), armT = /stencilled C20/.test(__toasts());
  /* nothing made of grey follows you in: a wraith hunting the Walker's own ground, and the Walker inside */
  go(200, 150);
  S.bleeding = false; S.warmth = 100; const hp0 = S.health; S.wraiths.push({ id: U.uid(), x: S.px + 4, y: S.py, alert: 1, state: 'hunt', cd: 0, ph: 0 });   // v3.51: the health read is the wraith's to take, not an old wound's
  for (let i = 0; i < 12; i++) Systems.update(0.05, {});
  const safe = !S.struggle && S.health === hp0;
  S.wraiths.length = 0;
  go(200, 166); const exitP = read('exit'), out = !S.room && /The cold door seals behind you/.test(__toasts());
  return { keyed, walls, west: Math.round(west), east: Math.round(east), brassP, brassT, logsP, logMail, logIdx, armP, armT, safe, exitP, out };
});
ok('THE DIEFENBUNKER, WALKED: the cold door knocked open from its desk on the region map (unmarked by the guild it answers no knock; opened, it opens once and a second knock changes nothing), a real click on STEP INSIDE sets the Walker at the entry of the concrete hall — drawn on screen (the brass wall\'s plates, the cold strip light, the red stencil on the C20 crate) — the arrow keys walk the floor, the walls hold at both ends, and the room answers at every hotspot (the brass wall, three plates of the SBSN log with its mail, the armory cage and its C20 crate); a hunting wraith on the Walker\'s own ground outside takes no hold of them in here; the cold door walks them out in its own voice',
  inside.opened && inside.knocks.unmarked === false && inside.knocks.again === false && inside.knocks.still === 'opened' && inside.brass > 200 && inside.stencil > 20 && inside.strip > 50 && r.keyed && r.walls && r.brassP && r.brassT && r.logsP && r.logMail && r.logIdx === 3 && r.armP && r.armT && r.safe && r.exitP && r.out, JSON.stringify({ inside, r }));

/* ================= 19 · THE BANNER SHEET, IN SESSION ================= */
await ev(async () => { WL.timeScale = 1; UI.toggleMap(true); await __wait(200); });
await page.click('#railRepublicBtn');
await page.waitForTimeout(250);
const sheet = await ev(() => {
  const ov = document.getElementById('republicOv'), body = document.getElementById('repBody');
  const title = ov.querySelector('header h2').textContent;
  const court = body.querySelectorAll('.rpRow').length, holds = [...body.querySelectorAll('.rpHold .rpName')].map(x => x.textContent);
  const towns = DATA.stationOrder.every(id => holds.includes(DATA.stations[id].name)), camps = DATA.camps.every(cd => holds.includes(cd.name));
  const kit = body.querySelectorAll('button[data-hire]').length, cut = /THE ROAD IS CUT/.test(body.textContent), wars = body.querySelectorAll('.rpRel').length;
  const modal = UI.anyModal() && UI.worldFrozen() && UI.gateReport().includes('the republic sheet');
  return { title: title.trim().slice(0, 40), court, towns, camps, kit, cut, wars, modal, todo: /\b(TODO|FIXME|XXX)\b/.test(body.innerHTML + ov.innerHTML) };
});
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
const esc = await ev(() => document.getElementById('republicOv').classList.contains('hidden') && !UI.anyModal());
await ev(() => RepublicUI.open());
const allClosed = await ev(() => { const was = !document.getElementById('republicOv').classList.contains('hidden'); UI.closeAllModals(); return was && document.getElementById('republicOv').classList.contains('hidden'); });
const src = readFileSync(new URL(PAGE.replace(/\?.*$/, '')), 'utf8'), todos = (src.match(/\b(TODO|FIXME|XXX)\b/g) || []).length;
ok('THE BANNER SHEET, IN SESSION: opened by a real click on the survey\'s rail it is the Factions window (v3.49: the plain names) — the court of all ten banners with the world\'s own wars under it, every town and camp as a holding, the mountain road cut with the kit\'s three hires; it holds the world like every sheet (the modal list, the frozen clock, the gate report names it), Esc adjourns it and closing every window closes it; no TODO, FIXME or XXX anywhere in the page',
  /Factions/i.test(sheet.title) && sheet.court === 10 && sheet.wars >= 16 && sheet.towns && sheet.camps && sheet.kit === 3 && sheet.cut && sheet.modal && esc && allClosed && !sheet.todo && todos === 0, JSON.stringify({ sheet, esc, allClosed, todos }));

await T.finish('the Republic in force');
