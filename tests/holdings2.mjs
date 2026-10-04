/* holdings2.mjs — v3.39 THE LOSABLE HOLDINGS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48
   source was lost; its figures sampled on the courier's grid). What it proves: a risen town takes a third answer beside the
   quell and the parley — THE STORMING, gated on the mountain road and funded from the bank; the column's arrival TAKES the
   town (lit under a garrison of two shields drawn in the square under Farkeep's grey, forty likes gone with the Unlit's
   banner, three relations moved, the Unlit's season of reprisal, the mail, the lesson); held ground eats three rations off
   the shelf every two minutes, the drum beats ×1.5 through the season, a garrisoned town is never the rising's pick however
   hot, and RELEASE by a real click gives ten likes and the town's own choice back; a held watchpost is STORMED by night in
   the reprisal season and LOST against two shields (the ring the camps' again, the grey pennant lying in it, the town
   poorer, the retake dearer); STAND THE POST holds it at three, the walker and a back hold it at two, four is the most; the
   grey banners' wars (the larder raided burns LOW and bites on half its ring, the file passing HUSHES it, each resolved from
   the live world); the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const drain = async () => { await ev(() => { WL.timeScale = 1; }); await T.drain(); await ev(() => { WL.timeScale = 0.001; }); };   // the screen's titles run on the clock
await ev(() => {
  for (const id of ['elm', 'mill', 'green', 'quarry']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources();
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  /* the titles the game puts on the screen, in order (the CRT shows one at a time) */
  window.__titles = []; const ct = Render.crtTitle; Render.crtTitle = (a, b) => { __titles.push(a + ' — ' + b); return ct(a, b); };
  /* the rolls this suite stages are rolled on a die it holds */
  window.__die = (v, fn) => { const r0 = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = r0; } };
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(() => {
  const D = REP.DOCTRINE.storm, W = REP.WATCHPOST.storm, E = REP.EVENTS;
  const storm = D.name === 'THE STORMING' && D.cost.metal === 90 && D.cost.provisions === 30 && D.column === 5 && D.needs === 'mountain' && D.likesHit === 40 && D.garrison === 2 && D.tithePeriod === 120 && D.titheGood === 'food' && D.titheAmt === 3 && D.releaseLikes === 10 && D.casualty > REP.DOCTRINE.quell.casualty && D.cost.metal > REP.DOCTRINE.quell.cost.metal;
  const post = W.knives === 3 && W.walkerR === 260 && W.reinforceCost.metal === 40 && W.reinforceCost.provisions === 10 && W.shieldsMax === 4 && W.retakeMul === 1.5 && W.fallenDur === 600 && W.casualtyLost === 0.6 && W.casualtyHeld < W.casualtyLost && W.lostLikes === 6 && W.chance > 0 && W.chance < 1 && W.at > 0.6;
  const wars = E.unlitReprisal.kind === 'reprisal' && E.unlitReprisal.trigger === 'storm' && E.unlitReprisal.dur === 600 && E.unlitReprisal.pressureMul === 1.5 && E.unlitReprisal.actor === 'rebels'
    && E.larderRaid.needs === 'larderNearCamp' && E.larderRaid.lowDur === 420 && E.larderRaid.night && E.larderRaid.actor === 'raiders' && E.larderRaid.victim === 'cannibals'
    && E.reaperVisit.needs === 'mistyLarder' && E.reaperVisit.hushDur === 300 && E.reaperVisit.actor === 'reapers' && E.reaperVisit.victim === 'cannibals'
    && ['unlitReprisal', 'larderRaid', 'reaperVisit'].every(k => E[k].mail && E[k].mail.length === 2 && E[k].line);
  const pairs = ['cannibals|raiders', 'cannibals|reapers', 'farkeep|rebels', 'rebels|waylight', 'flamekeepers|waylight', 'farkeep|raiders'].every(k => REP.RELATIONS.base[k] !== undefined);   // the wars write pairs the ledger already held
  /* the garrison's figure: the Farkeeper shield, drawn by hand on its own grid (v3.51), from the Farkeepers' base colours */
  const F = SPRITES.FIG.shield, FK = SPRITES.FK_PAL;
  const shield = !!F && F.fam === 'fk' && ['E', 'S', 'N'].every(fc => F.frames[fc] && F.frames[fc].idle.length === F.h && F.frames[fc].idle.every(s => s.length === F.w)) && ['O', 'S', 'e'].every(k => F.pal[k] === FK[k]) && /#8d979c/i.test(Object.values(F.pal).join(','));
  const lessons = ['firstStorm', 'firstPostFell'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]) && /GARRISON/.test(DATA.tutorials.firstStorm) && /STAND THE POST/.test(DATA.tutorials.firstPostFell), lessonsN = Object.keys(DATA.tutorials).length;
  return { storm, post, wars, pairs, shield, lessons, lessonsN };
});
ok('THE REGISTRIES: THE STORMING is a doctrine row (five shields, 90 metal and 30 provisions — dearer and deadlier than the quell — gated on the mountain road; forty likes gone, a garrison of two, three rations off the shelf every two minutes, ten likes back on release); the watchpost\'s storm row (three knives by night in the season, the walker\'s ring of 260, STAND THE POST at 40 metal and 10 provisions up to four, a retake ×1.5, the grey pennant ten minutes, the stone likelier lost than held, six likes off the nearest town); three more wars on the v3.34 law — the Unlit\'s reprisal fired by the storming (a season of 600 s, the drum ×1.5), the larder raid (a larder a live camp can reach, LOW 420 s), the file\'s visit (a larder in the mist, HUSHED 300 s), each with its mail on pairs the ledger already held; the garrison\'s shield drawn by hand on its own grid in Farkeep\'s grey from the Farkeepers\' base colours (v3.51: SPRITES.FIG.shield); two lessons (v3.49: the manual at 93 pages)',
  r.storm && r.post && r.wars && r.pairs && r.shield && r.lessons && r.lessonsN >= 93, JSON.stringify(r));

/* ================= 2 · THE STORMING ================= */
await drain();
r = await ev(() => {
  Republic.rebellionStrike('mill');
  const risen = Republic.isUnlit('mill') && !S.stations.mill.connected;
  /* the parley beside it wants a town that loved you once: refused below its likes */
  S.stations.mill.likesTo = 10; const parley = Republic.tryParley('mill') === false && Republic.isUnlit('mill');
  S.stations.mill.likesTo = 60; S.stations.mill.appr = 50;
  window.__rel0 = { fr: Republic.rel('farkeep', 'rebels'), rw: Republic.rel('rebels', 'waylight'), kw: Republic.rel('flamekeepers', 'waylight') };
  /* gated on the road: the banner sheet's button stands disabled, the verb refused by hand */
  const gate = Republic.canStorm('mill'), bank0 = S.banked.metal;
  RepublicUI.open();
  const btn = document.querySelector('#repBody [data-storm="mill"]');
  const gatedSheet = !!btn && btn.disabled && /the storming waits on the mountain road/.test(document.getElementById('repBody').textContent) && !!document.querySelector('#repBody [data-quell="mill"]');
  const refused = Republic.fundStorm('mill') === false && S.banked.metal === bank0 && !Republic.quell();
  /* the road cut: the button stands open */
  S.rep.mountain.phase = 'open'; RepublicUI.render();
  const open = Republic.canStorm('mill').ok && !document.querySelector('#repBody [data-storm="mill"]').disabled;
  window.__bankS = { metal: S.banked.metal, provisions: S.banked.provisions };
  return { risen, parley, gated: !gate.ok && /mountain road is not cut/.test(gate.line), gatedSheet, refused, open };
});
const st1 = r;
await page.click('#repBody [data-storm="mill"]'); await page.waitForTimeout(300);
await drain();
r = await ev(() => {
  const q = Republic.quell(), D = REP.DOCTRINE.storm;
  const funded = !!q && q.kind === 'storm' && q.target === 'mill' && q.col === 5 && S.banked.metal === __bankS.metal - 90 && S.banked.provisions === __bankS.provisions - 30;
  const marching = /THE COLUMN MARCHES ON THE DOOR/.test(document.getElementById('repBody').textContent);
  RepublicUI.close();
  __titles.length = 0; S.mails.length = 0;
  q.t = q.dur - 0.01; Republic.tick(0.02);   // the column arrives at the door
  const st = S.stations.mill, h = Republic.held().mill, R0 = __rel0;
  const title = Render.crtText(), shown = !!title && title.big === 'THE STORMING' && /TAKEN/.test(title.small);
  const taken = Republic.isHeld('mill') && !Republic.isUnlit('mill') && st.connected && st.litT === 1 && !!h && h.shields === D.garrison && st.likesTo === 60 - D.likesHit && st.appr === 10 && !Republic.quell();
  const rels = { fr: Republic.rel('farkeep', 'rebels') - R0.fr, rw: Republic.rel('rebels', 'waylight') - R0.rw, kw: Republic.rel('flamekeepers', 'waylight') - R0.kw };
  const moved = rels.fr === -2 && rels.rw === -1 && rels.kw === -1 && /storming of The Mill/.test(Republic.relations().find(x => x.a === 'rebels' && x.b === 'waylight').why || '');
  const season = !!Republic.unlitReprisal() && Republic.unlitReprisal().t === 600 && Republic.unlitReprisal().town === 'mill';
  const mail = S.mails.some(m => m.subj === 'The Mill: taken by the mountain' && /2 shields stand under it/.test(m.body) && /3 rations off the town's own shelf every 120 seconds/.test(m.body)) && S.mails.some(m => m.subj === 'The story of the storming walks');
  const lesson = !!S.flags.tut.firstStorm;
  RepublicUI.open(); const body = document.getElementById('repBody').textContent;
  const sheet = /THE REPUBLIC — GARRISONED/.test(body) && /RELEASE THE GARRISON/.test(body) && /2\/4 shields under the pennant/.test(body) && /THE STORY OF THE STORMING — \d+s: the Unlit's drum beats ×1\.5/.test(body);
  RepublicUI.close();
  return { funded, marching, shown, titles: __titles.slice(0, 3), taken, likes: st.likesTo, rels, moved, season, mail, lesson, sheet };
});
ok('THE STORMING: a risen town\'s answers stand on the banner sheet — the quell, the parley (refused to a town that never loved you enough), and THE STORMING gated (the button disabled, "the storming waits on the mountain road", the verb refused by hand with the bank untouched); the road cut, a real click funds it (90 metal, 30 provisions, five shields on the road — THE COLUMN MARCHES ON THE DOOR); the arrival TAKES the town: lit under a garrison of two, forty likes and forty of appreciation gone with the banner, the title THE STORMING, three relations moved (Farkeep and the Unlit twice colder with the season, the Unlit and the Order, the Keepers and the Order, the ledger naming the storming), the Unlit\'s season of 600 s, the mails, the lesson; the sheet reads THE REPUBLIC — GARRISONED with RELEASE, 2/4 shields and the season\'s drum',
  st1.risen && st1.parley && st1.gated && st1.gatedSheet && st1.refused && st1.open && r.funded && r.marching && r.shown && r.taken && r.moved && r.season && r.mail && r.lesson && r.sheet, JSON.stringify(st1) + ' ' + JSON.stringify(r));

/* ================= 3 · HELD GROUND ================= */
r = await ev(() => {
  const st = S.stations.mill, h = Republic.held().mill, R = REP.REBELLION;
  /* the garrison eats: two periods of the tithe clock, six rations off the shelf */
  st.stock.food = 40; h.tithe = 0; h.ate = 0; S.rep.pressure = 0; S.cov = 0.6;
  for (let i = 0; i < 4; i++) Republic.tick(60);
  const ate = { food: +st.stock.food.toFixed(2), ate: h.ate };
  /* the drum: the pressure clock beats ×1.5 through the season */
  S.cov = 0.6; Republic.tick(0.5); S.rep.pressure = 0;
  for (let i = 0; i < 10; i++) Republic.tick(0.5);
  const withSeason = S.rep.pressure, season = S.rep.unlitReprisal; S.rep.unlitReprisal = null; S.rep.pressure = 0;
  for (let i = 0; i < 10; i++) Republic.tick(0.5);
  const without = S.rep.pressure; S.rep.unlitReprisal = season;
  /* the hottest town is never the rising's pick while it is garrisoned */
  S.heat.mill = 500; S.rep.pressure = R.period - 0.1; S.cov = 0.6;
  const unlit0 = Republic.unlitList().length;
  __die(0.5, () => Republic.tick(0.5));
  const struck = Republic.unlitList().filter(id => id !== 'mill');
  const skipped = struck.length === 1 && !Republic.isUnlit('mill') && Republic.isHeld('mill');
  for (const id of struck) { delete S.rep.unlit[id]; S.stations[id].connected = true; S.stations[id].litT = 1; }
  State.refreshSources();
  return { ate, rate: +(withSeason / without).toFixed(3), withSeason: +withSeason.toFixed(3), without: +without.toFixed(3), unlit0, struck, skipped };
});
const held1 = r;
/* the square's grey: the garrison drawn under Farkeep's pennant, against the same frame with the town released */
await drain();
const sq = await ev(async () => {
  const d = DATA.stations.mill, look = async () => { WL.tp([d.x + 190, d.y + 170]); S.weather.state = 'clear'; __clearAmb(d.x, d.y, 360); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = d.x; Render.cam.y = d.y + 20; await __wait(250); await __frames(3); };
  const T2 = DATA.T.dayLen; S.time = Math.floor(S.time / T2) * T2 + T2 * 0.3;
  await look();
  const grey = __hex('#8d979c'), at = [[-76, 54], [76, 54]];
  const A = at.map(([ox, oy]) => __grab(d.x + ox, d.y + oy - 16, 36)), greyOn = at.reduce((a, [ox, oy]) => a + __near(d.x + ox, d.y + oy - 30, grey, 10, 130), 0);   // the helm's grey
  const labelOn = Render.labelBoxes().some(b => b.str === 'GARRISONED — THE REPUBLIC');
  const h = S.rep.held.mill; delete S.rep.held.mill; await __wait(150); await __frames(3);
  const B = at.map(([ox, oy]) => __grab(d.x + ox, d.y + oy - 16, 36)), greyOff = at.reduce((a, [ox, oy]) => a + __near(d.x + ox, d.y + oy - 30, grey, 10, 130), 0);
  S.rep.held.mill = h; __done();
  return { diff: A.map((a, i) => __diff(a, B[i])), greyOn, greyOff, labelOn };
});
await ev(() => { WL.timeScale = 0.001; RepublicUI.open(); window.__rel1 = Republic.rel('rebels', 'waylight'); window.__lk1 = S.stations.mill.likesTo;
  /* the rations eaten, counted on the sheet: the garrisoned row reads what the shelf gave */
  const row = [...document.querySelectorAll('#repBody .rpHold')].find(x => x.querySelector('.rpName').textContent === DATA.stations.mill.name);
  window.__ateRow = { ate: Republic.held().mill.ate, sheet: !!row && new RegExp(`the garrison has eaten ${Republic.held().mill.ate} rations off the shelf`).test(row.textContent) }; });
await page.click('#repBody [data-release="mill"]'); await page.waitForTimeout(300);
r = await ev(() => {
  const st = S.stations.mill;
  const released = !Republic.isHeld('mill') && st.likesTo === __lk1 + 10 && Republic.rel('rebels', 'waylight') === __rel1 + 1 && S.mails.some(m => m.subj === 'The Mill: the garrison marches home') && st.connected;
  const sheet = !/THE REPUBLIC — GARRISONED/.test(document.getElementById('repBody').textContent);
  RepublicUI.close();
  /* its own choice returned: the hottest town is the rising's pick again */
  S.rep.pressure = REP.REBELLION.period - 0.1; S.cov = 0.6;
  __die(0.5, () => Republic.tick(0.5));
  const choice = Republic.isUnlit('mill');
  delete S.rep.unlit.mill; st.connected = true; st.litT = 1; S.heat.mill = 0; State.refreshSources();
  return { released, sheet, choice };
});
const ateRow = await ev(() => window.__ateRow);
ok('HELD GROUND: the garrison eats six rations in two periods of the tithe clock, and the sheet counts them (its garrisoned row reads the garrison has eaten 6 rations off the shelf); through the Unlit\'s season the drum beats at ×1.5 the rate it beats without; the hottest town in the valley is never the rising\'s pick while its garrison holds it (the pick walked past it to another door); the square is drawn Farkeep\'s grey — two shields flanking the yard under the pennant with GARRISONED — THE REPUBLIC on the ground (pixel-sampled against the same frame with the garrison gone); a real click on RELEASE THE GARRISON sends it home: ten likes back at once, the Unlit and the Order a step warmer, the mail — and the town\'s own choice returns (the hottest town is the pick again)',
  held1.ate.ate === 6 && held1.ate.food === 34 && ateRow.ate === 6 && ateRow.sheet && Math.abs(held1.rate - 1.5) < 0.01 && held1.skipped && sq.diff.every(n => n > 40) && sq.greyOn > sq.greyOff + 20 && sq.labelOn && r.released && r.sheet && r.choice,
  JSON.stringify(held1) + ' sheet=' + JSON.stringify(ateRow) + ' square=' + JSON.stringify(sq) + ' ' + JSON.stringify(r));

/* ================= 4 · THE POST STORMED AND LOST ================= */
r = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge;
  c.taken = null; c.pacified = false; c.lost = null; c.runners = [];
  const cost0 = Republic.takeCost('ridge');
  if (!Republic.fundTake('ridge')) return { took: false };
  const q = Republic.quell(); q.t = q.dur - 0.01; __die(0.99, () => Republic.tick(0.02));
  const took = !!c.taken && c.taken.shields === 2 && c.pacified && !!Republic.reprisal();
  /* the season's night at the storm's hour, the walker away at Haven: the camps roll for the ground */
  WL.tp('haven'); S.mails.length = 0; __titles.length = 0;
  const near = 'quarry', lk0 = S.stations[near].likesTo;
  S.stations[near].likesTo = 40;
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.75;
  const fr0 = Republic.rel('farkeep', 'raiders');
  __die(0.01, () => Republic.tick(0.5));
  const lost = !c.taken && !c.pacified && !!c.lost && c.lost.n === 1 && !c.stash.length && S.stations[near].likesTo === 34 && Republic.rel('farkeep', 'raiders') === fr0 - 1
    && S.mails.some(m => m.subj === 'Ridge Camp: the watchpost FELL' && /3 knives against 2 shields/.test(m.body)) && !!S.flags.tut.firstPostFell && __titles.some(t => /^THE POST FELL — Ridge Camp is the camps' again/.test(t));
  const once = c.lost.n === 1 && __die(0.01, () => { Republic.tick(0.5); return c.lost.n === 1; });   // rolled once a night
  /* the ring the camps' again: its runners back */
  Systems.update(0.02, {});
  const runners = c.runners.length === cd.runners && c.runners.every(k => ['bowman', 'ram', 'knife'].includes(k.cls));
  const cost1 = Republic.takeCost('ridge');
  const dearer = cost1.metal === Math.round(cost0.metal * 1.5) && cost1.wood === Math.round(cost0.wood * 1.5) && cost1.provisions === Math.round(cost0.provisions * 1.5);
  RepublicUI.open(); const body = document.getElementById('repBody').textContent;
  const day = Math.floor(c.lost.t / DL) + 1;
  const sheet = new RegExp(`the post here FELL on day ${day} — the camps expect the column: the taking costs ×1\\.5`).test(body) && body.includes(`THE TAKING — ${Systems.fmtCost(cost1)}`);
  RepublicUI.close();
  S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
  return { took, lost, once, runners, cost0, cost1, dearer, sheet, day };
});
const lost1 = r;
/* the grey pennant lies in the ring with the pole across it (against the same frame once its ten minutes have passed) */
const pen = await ev(async () => {
  const cd = DATA.camps.find(c => c.id === 'ridge'), c = S.camps.ridge, px = cd.x - 40 + 10, py = cd.y + 44 + 4;
  WL.tp([cd.x + 150, cd.y + 150]); S.weather.state = 'clear'; S.cargo = S.cargo.filter(x => x.cat === 'tool'); __clearAmb(cd.x, cd.y, 400); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = cd.x - 20; Render.cam.y = cd.y + 40;
  await __wait(250); await __frames(3);
  const a = __grab(px, py, 40), label = Render.labelBoxes().some(b => b.str === 'THE POST FELL');
  const t0 = c.lost.t; c.lost.t = S.time - REP.WATCHPOST.storm.fallenDur - 1; await __wait(150); await __frames(3);
  const b = __grab(px, py, 40), labelGone = !Render.labelBoxes().some(x => x.str === 'THE POST FELL'); c.lost.t = t0;
  __done(); WL.timeScale = 0.001; WL.tp('haven');
  return { pennant: __diff(a, b), label, labelGone };
});
ok('THE POST STORMED AND LOST: a camp taken by the column (the season of reprisal with it) is rolled on the season\'s night at the storm\'s hour with the walker away — three knives against two shields: the post FALLS (the ring the camps\' again with its runners back by its own roll, the salvage scattered, the nearest town six likes poorer, the raiders and the mountain a step colder, the mail naming the knives and the shields, the lesson, THE POST FELL on the screen), once a night; the grey pennant lies in the ring with THE POST FELL on the ground for its ten minutes (pixel-sampled against the same frame after them); the retake costs ×1.5 and the sheet prints the price and the day it fell',
  lost1.took && lost1.lost && lost1.once && lost1.runners && lost1.dearer && lost1.sheet && pen.pennant > 40 && pen.label && pen.labelGone, JSON.stringify(lost1) + ' pennant=' + JSON.stringify(pen));

/* ================= 5 · STAND THE POST ================= */
r = await ev(() => {
  const c = S.camps.ridge, b0 = { metal: S.banked.metal, wood: S.banked.wood, provisions: S.banked.provisions }, cost = Republic.takeCost('ridge');
  if (!Republic.fundTake('ridge')) return { retook: false };
  const paid = S.banked.metal === b0.metal - cost.metal && S.banked.wood === b0.wood - cost.wood && S.banked.provisions === b0.provisions - cost.provisions;
  const q = Republic.quell(); q.t = q.dur - 0.01; __die(0.99, () => Republic.tick(0.02));
  RepublicUI.open();
  window.__bankP = { metal: S.banked.metal, provisions: S.banked.provisions };
  return { retook: !!c.taken && c.taken.shields === 2, paid, btn: !!document.querySelector('#repBody [data-stand="ridge"]') };
});
const sp0 = r;
await page.click('#repBody [data-stand="ridge"]'); await page.waitForTimeout(250);
r = await ev(() => {
  const cd = DATA.camps.find(x => x.id === 'ridge'), c = S.camps.ridge;
  const three = c.taken.shields === 3 && S.banked.metal === __bankP.metal - 40 && S.banked.provisions === __bankP.provisions - 10 && /3\/4<\/b>|3\/4 shields stand the fire/.test(document.getElementById('repBody').innerHTML);
  RepublicUI.close(); S.mails.length = 0;
  /* held at three: the rolled night breaks on the shields */
  WL.tp('haven'); const fell = Republic.stormPost(cd);
  const heldAt3 = fell === false && !!c.taken && S.mails.some(m => m.subj === 'Ridge Camp: the post HELD' && /3 knives against 3 shields\./.test(m.body));
  /* at two, the walker standing it with a fed back beside them (v3.40: with the walker in the ring the storm is fought on the
     ground — the roll that counts them is the engine's own resolve) */
  c.taken.shields = 2; S.mails.length = 0;
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); NPC.hire(n, 'companion'); n.hungry = false;
  WL.tp([cd.x + 90, cd.y + 60]); n.cx = S.px + 20; n.cy = S.py + 20;
  const fell2 = Republic.stormPost(cd, 'resolve');
  const heldAt2 = fell2 === false && !!c.taken && NPC.party().length === 1 && S.mails.some(m => m.subj === 'Ridge Camp: the post HELD' && /and the walker who stood the fire with 1 back beside them/.test(m.body));
  n.state = 'pool'; n.at = 'haven'; WL.tp('haven');
  RepublicUI.open();
  return { three, heldAt3, heldAt2 };
});
const sp1 = r;
await page.click('#repBody [data-stand="ridge"]'); await page.waitForTimeout(200);
await page.click('#repBody [data-stand="ridge"]'); await page.waitForTimeout(200);
r = await ev(() => {
  const c = S.camps.ridge, btn = document.querySelector('#repBody [data-stand="ridge"]'), body = document.getElementById('repBody').textContent, m0 = S.banked.metal;
  const four = c.taken.shields === 4 && btn.disabled && /4\/4 shields stand the fire/.test(body) && /the camps may STORM it by night this season — 3 knives/.test(body);
  const refused = Republic.standPost('ridge') === false && c.taken.shields === 4 && S.banked.metal === m0;
  RepublicUI.close();
  return { four, refused, shields: c.taken.shields };
});
ok('STAND THE POST: the post retaken at the dearer price; a real click on STAND THE POST puts a third shield at the fire (40 metal, 10 provisions) and the rolled night HOLDS at three (the mail: three knives against three shields); at two the walker standing the fire with a fed back beside them holds it (the mail names them — v3.40: with the walker in the ring the storm is fought on the ground, so the roll that counts them is the engine\'s resolve); two more clicks stand four and the button goes dark at the most, the verb by hand refused with the bank untouched; the sheet reads 4/4 shields and the season\'s warning',
  sp0.retook && sp0.paid && sp0.btn && sp1.three && sp1.heldAt3 && sp1.heldAt2 && r.four && r.refused, JSON.stringify(sp0) + ' ' + JSON.stringify(sp1) + ' ' + JSON.stringify(r));

/* ================= 6 · THE GREY BANNERS' WARS ================= */
r = await ev(() => {
  const E = REP.EVENTS, sites = S.rep.sites.filter(s => s.p === 'hollowfire' && !s.cleared), DL = DATA.T.dayLen;
  for (const s2 of sites) { s2.raided = 0; s2.hushed = 0; s2.biteT = 0; s2.warned = 0; }
  const night = () => { S.time = Math.floor(S.time / DL) * DL + DL * 0.75; };
  const fire = (id, v) => { for (const k of Object.keys(E)) S.rep.evCd[k] = 99999; S.rep.evCd[id] = 0; night(); __die(v, () => Republic.tick(0.5)); };
  /* the raid's need reads the live world: no camp standing within reach, nothing (the post at Ridge is held, not standing) */
  const saved = DATA.camps.map(cd => [cd.id, S.camps[cd.id].pacified]);
  for (const cd of DATA.camps) if (!S.camps[cd.id].taken) S.camps[cd.id].pacified = true;
  fire('larderRaid', 0.01);
  const none = sites.every(s2 => !s2.raided);
  const ash = DATA.camps.find(cd => cd.id === 'ash'); S.camps.ash.pacified = false; S.camps.ash.stash = [];
  const near = sites.filter(s2 => U.dist(s2.x, s2.y, ash.x, ash.y) < E.larderRaid.reach);
  const kr0 = Republic.rel('cannibals', 'raiders'); S.mails.length = 0;
  fire('larderRaid', 0.01);
  const L = sites.find(s2 => s2.raided);
  const raided = !!L && near.includes(L) && sites.filter(s2 => s2.raided).length === 1 && S.camps.ash.stash.length === 1 && S.camps.ash.stash[0].defId === 'food' && Republic.rel('cannibals', 'raiders') === kr0 - 1 && /Ash Camp's raid on the larder near/.test(Republic.relations().find(x => x.a === 'cannibals' && x.b === 'raiders').why) && S.mails.some(m => m.subj === 'A camp raided a larder' && /Ash Camp/.test(m.body));
  for (const [id, p] of saved) S.camps[id].pacified = p;
  S.camps.ash.stash = [];
  RepublicUI.open(); const plateLow = /RAIDED — BURNS LOW · \d+s/.test(document.getElementById('repBody').textContent); RepublicUI.close();
  /* the larder bites on its ring at night: a raided larder\'s ring is halved — the same ground does not bite */
  const bite = (s2, d) => { WL.tp([s2.x + d, s2.y]); S.health = 100; s2.biteT = 0; for (let i = 0; i < 7; i++) Republic.tick(0.5); return 100 - S.health; };
  for (const k of Object.keys(E)) S.rep.evCd[k] = 99999;
  const lowBite = bite(L, 100);
  const raidedT = L.raided; L.raided = 0;
  const fullBite = bite(L, 100);
  L.raided = raidedT;
  /* the file passes: the need is a larder in the mist; the eaters hide — no hunt at all */
  const vr0 = Republic.rel('cannibals', 'reapers'); S.mails.length = 0;
  const misty = sites.filter(s2 => World.mistAt(s2.x, s2.y) >= E.reaperVisit.minMist);
  fire('reaperVisit', 0.01);
  const H = sites.find(s2 => s2.hushed > S.time);
  const hushed = !!H && misty.includes(H) && Math.round(H.hushed - S.time) === E.reaperVisit.hushDur && Republic.rel('cannibals', 'reapers') === vr0 - 1 && S.mails.some(m => m.subj === 'The file walked through a larder');
  for (const k of Object.keys(E)) S.rep.evCd[k] = 99999;
  const hushBite = H ? bite(H, 30) : -1;
  RepublicUI.open(); const plateHush = /HUSHED — THE FILE PASSED · \d+s/.test(document.getElementById('repBody').textContent); RepublicUI.close();
  /* every larder hushed, the need finds none */
  for (const s2 of sites) s2.hushed = S.time + 100;
  S.mails.length = 0; fire('reaperVisit', 0.01);
  const noneLeft = !S.mails.some(m => m.subj === 'The file walked through a larder');
  for (const s2 of sites) { s2.hushed = 0; s2.raided = 0; }
  for (const k of Object.keys(E)) S.rep.evCd[k] = 99999;
  const door = Republic.fireEvent('noSuchWar', null) === false;   // one door to fire through: a row it does not hold fires nothing
  WL.tp('haven'); S.health = 100; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
  return { none, raided, plateLow, lowBite, fullBite, misty: misty.length, hushed, hushBite, plateHush, noneLeft, door };
});
ok('THE GREY BANNERS\' WARS: the larder raid\'s need reads the live world — with no camp standing within reach nothing fires; with Ash up (Ridge held, Pass stood down) it raids the larder Ash can reach: the fire burns LOW (the sheet\'s RAIDED — BURNS LOW · Ns), a crate of rations in Ash\'s stash it never earned on the road, the raiders and the eaters a step colder on the ledger with the raid named, the mail; at night the larder bites the ground inside its ring — raided, its ring halved, the same ground does not bite; the file\'s visit finds a larder in the mist and HUSHES it for 300 s (the Reapers and the eaters colder, the mail, the sheet\'s HUSHED — THE FILE PASSED · Ns) — and a hushed larder does not hunt at all, even at its fire; with every larder hushed the need finds none; the one door fires no row it does not hold',
  r.none && r.raided && r.plateLow && r.lowBite === 0 && r.fullBite > 0 && r.misty >= 1 && r.hushed && r.hushBite === 0 && r.plateHush && r.noneLeft && r.door, JSON.stringify(r));

/* ================= 7 · THE SAVE ================= */
r = await ev(() => {
  /* a garrison mid-clock, a post with its shields and its fall, the Unlit's season */
  Republic.rebellionStrike('green');
  S.rep.mountain.phase = 'open'; if (!Republic.fundStorm('green')) return { stormed: false };
  const q = Republic.quell(); q.t = q.dur - 0.01; __die(0.99, () => Republic.tick(0.02));
  const h = Republic.held().green; h.tithe = 47; h.ate = 3; h.shields = 3;
  const c = S.camps.ridge; c.lost = { t: S.time - 100, n: 1 };
  const ur = Republic.unlitReprisal(); ur.t = 321;
  State.save(); State.load();
  const h2 = Republic.held().green, c2 = S.camps.ridge;
  const garrison = !!h2 && h2.tithe === 47 && h2.ate === 3 && h2.shields === 3 && Republic.isHeld('green');
  const post = !!c2.taken && c2.taken.shields === 4 && !!c2.lost && c2.lost.n === 1 && Republic.takeCost('ridge').metal === Math.round(REP.DOCTRINE.take.cost.metal * 1.5);
  const season = !!Republic.unlitReprisal() && Republic.unlitReprisal().t === 321 && Republic.unlitReprisal().town === 'green';
  return { stormed: true, garrison, post, season };
});
ok('THE SAVE: a garrison with its tithe clock, its rations eaten and its shields, a post\'s shields and its fall (the dearer retake after it), and the Unlit\'s season with its clock survive a save and load',
  r.stormed && r.garrison && r.post && r.season, JSON.stringify(r));

await ev(() => { Render.crtTitle = Render.crtTitle; WL.timeScale = 1; });
await T.finish('the losable holdings');
