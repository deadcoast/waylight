/* exiles.mjs — v3.25 THE NAMES & THE EXILES (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48
   source was lost; its figures sampled on the courier's grid). Waylight is a city: a fresh world's enlistment offers no
   Lamplighter; the land is the Greymarch, the sheets and the survey's tabs say so, the globe pins the lore's places (Waylight
   glowing from orbit on its coast, the Farlands, two reaches uncharted) and the title ladder tops out Legend of the Greymarch.
   The cloaked torch framed in fragments, in order — out of the deep grey walking easy, then the name said (a scrapper who
   knows the stance, or a yard that heard the stories). The Lamplighter arc cornered in the grey: the staging, the three
   cracks that break every chase, the raised-tongue stranger stepping out (against the same frame without), the Timberwolf
   and its rounds handed down with two letters, once ever. The Timberwolf's ledgers: the warning crack clean, the connecting
   shot on the renegade ledger and a town's heat; the bolt's cooldown, the outlaw's steadier hand, the dry fire; the rail
   offering the rifle only when a scrapper stands inside its argument. The two factions out of rumour with their hints; the
   Society's three records in order on their own paper, the third naming Canada; the fall lane when no yard would ride; and
   the class unlocked for this world — a Lamplighter porter with the rifle, a courier after them without one. */
import { boot } from './lib/harness.mjs';

const T = await boot({ start: false });
const { page, ev, ok, drain } = T;

/* ================= 1 · A FRESH WORLD OFFERS NO LAMPLIGHTER ================= */
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
const fresh = await ev(() => ({ shown: !document.getElementById('chargen').classList.contains('hidden'), classes: [...document.querySelectorAll('#cgClasses [data-cls]')].map(e => e.dataset.cls), flag: !!(S && S.flags && S.flags.lampClass), defined: !!CHAR.CLASSES.lamplighter && CHAR.CLASSES.lamplighter.locked === 'lampClass' }));
await page.click('#cgBegin'); await page.waitForTimeout(1200);
await T.skipCine();
await ev(() => {   // the harness's calm, by hand: the first-sight scenes spent, no letterbox takes a frame
  S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  window.__rec = (obj, key) => { const calls = [], f = obj[key]; obj[key] = (...a) => { calls.push(a); return f.apply(obj, a); }; return { calls, off: () => { obj[key] = f; } }; };
});
ok('A FRESH WORLD OFFERS NO LAMPLIGHTER: enlistment in a new valley lists every class but the Lamplighter — the class exists, locked behind this world\'s own flag, which a fresh world never carries',
  fresh.shown && fresh.defined && !fresh.flag && fresh.classes.length === 8 && !fresh.classes.includes('lamplighter') && fresh.classes.includes('courier'), JSON.stringify(fresh));

/* ================= 2 · THE NAMES ================= */
const names = await ev(() => {
  let text = ''; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: t => /^(SCRIPT|STYLE)$/.test(t.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT }); while (tw.nextNode()) text += tw.currentNode.nodeValue + ' ';
  const worldCalledWaylight = /world of waylight|waylight valley|valley of waylight|the waylight world/i.test(text);
  const gm = Globe.REGIONS.find(r => r.id === 'greymarch'), wl = Globe.REGIONS.find(r => r.id === 'waylight');
  const rep = FACT.FACTIONS.waylight.name, letter = /REPUBLIC OF CONNECTION/.test(document.getElementById('mapSub').textContent + ' ') || true;
  return { worldCalledWaylight, gm: gm.name, gmBlurb: gm.blurb, capital: wl.name, capitalSub: wl.sub, mapSub: document.getElementById('mapSub').textContent, globeCap: document.getElementById('globeCap').textContent.slice(0, 16), contCap: document.getElementById('contCap').textContent.slice(0, 15) };
});
ok('THE NAMES: Waylight is the capital — WAYLIGHT, THE FIRST LIGHT · SEAT OF THE REPUBLIC — and no sheet calls the world by it; the land under the boots is THE GREYMARCH (the map\'s own line, the globe\'s pin: everything you have ever walked), the Darklands and the Known World beyond it',
  !names.worldCalledWaylight && names.gm === 'THE GREYMARCH' && /Everything you have ever walked/.test(names.gmBlurb) && names.capital === 'WAYLIGHT' && names.capitalSub === 'THE FIRST LIGHT · SEAT OF THE REPUBLIC'
  && /^The Greymarch/.test(names.mapSub) && names.globeCap.startsWith('THE KNOWN WORLD') && names.contCap.startsWith('THE DARKLANDS'), JSON.stringify(names));

/* ================= 3 · THE TABS ================= */
await page.keyboard.press('KeyM'); await page.waitForTimeout(350);
const tabRead = () => ev(() => ({ title: document.getElementById('mapTitle').textContent, sub: document.getElementById('mapSub').textContent, tabs: [...document.querySelectorAll('#mapViewBtns .viewBtn')].map(b => b.textContent.trim()) }));
const tabs = { valley: await tabRead() };
await page.click('#btnViewWorld'); await page.waitForTimeout(500); tabs.world = await tabRead();
ok('THE TABS (v3.26: three rungs, v3.49: the plain names): the survey\'s tabs run from the valley to the world — VALLEY · REGION · WORLD — the valley\'s window naming THE GREYMARCH and the farthest pull THE KNOWN WORLD',
  tabs.valley.tabs.join() === 'VALLEY,REGION,WORLD' && /The Greymarch/.test(tabs.valley.sub) && tabs.world.title === 'World map' && /^The Known World/.test(tabs.world.sub), JSON.stringify(tabs));

/* ================= 4 · THE REGIONS ================= */
const regions = await ev(async () => {
  const R = Globe.REGIONS, kinds = Object.fromEntries(R.map(r => [r.id, r.kind]));
  const coast = rg => { const SEA = Globe.SEA; if (Globe.elevAt(rg.lon, rg.lat) < SEA) return false; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; if (Globe.elevAt(rg.lon + Math.cos(a) * 0.05, rg.lat + Math.sin(a) * 0.05) < SEA) return true; } return false; };
  /* Waylight's own light read from orbit: the globe turned until its pin faces the glass, the gold of its shells counted */
  const ov = document.getElementById('globeOv'); let best = 0, bestRot = 0;
  for (let k = 0; k < 24; k++) {
    Globe._st.rot = k / 24 * Math.PI * 2; Globe._st.vel = 0; await __frames(2);
    const d = ov.getContext('2d').getImageData(0, 0, ov.width, ov.height).data; const n = __count(d, __hex('#ffd98f'), 4);
    if (n > best) { best = n; bestRot = Globe._st.rot; }
  }
  return { ids: R.map(r => r.id), kinds, farlands: R.find(r => r.id === 'farlands').sub, uncharted: R.filter(r => r.kind === 'uncharted').map(r => r.name), capitalCoast: coast(R.find(r => r.id === 'waylight')), valleyCoast: coast(R.find(r => r.id === 'greymarch')), glow: best, bestRot: +bestRot.toFixed(2) };
});
await page.keyboard.press('KeyM'); await page.waitForTimeout(200);
ok('THE REGIONS: the globe pins the lore\'s real places — the Greymarch walked (on a coast), WAYLIGHT known across the water on its own coast and glowing from orbit (its gold counted on the glass with the globe turned to it), THE FARLANDS (FARKEEP · THE REPUBLIC OF CONNECTION), and two reaches uncharted for recon',
  regions.ids.join() === 'greymarch,waylight,farlands,saltflats,lowmarrow' && regions.kinds.greymarch === 'open' && regions.kinds.waylight === 'home' && regions.kinds.farlands === 'home'
  && regions.farlands === 'FARKEEP · THE REPUBLIC OF CONNECTION' && regions.uncharted.length === 2 && regions.capitalCoast && regions.valleyCoast && regions.glow > 20, JSON.stringify(regions));

/* ================= 5 · THE TITLE LADDER ================= */
const ladder = await ev(() => ({ titles: DATA.titles.map(t => t[1]), top: State.titleFor(99), at28: State.titleFor(28), at27: State.titleFor(27), first: State.titleFor(1) }));
ok('THE TITLE LADDER: from Greenhand of the Order to its top rung — LEGEND OF THE GREYMARCH at level 28 — the ladder named for the land, never for the capital',
  ladder.top === 'Legend of the Greymarch' && ladder.at28 === 'Legend of the Greymarch' && ladder.at27 !== ladder.at28 && ladder.first === 'Greenhand of the Order' && !ladder.titles.some(t => /Waylight(?!er)/.test(t)), JSON.stringify(ladder));

/* ================= 6–7 · THE CLOAKED TORCH, FRAMED IN ORDER ================= */
const frame = await ev(async () => {
  S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = false; S.wasDeep = false; S.renegade = 0; S.level = 1; WL.timeScale = 0.001;
  const out = {}, line = () => (S.mcine ? S.mcine.line : null);
  const tick = n => { for (let i = 0; i < n; i++) Myth.tick(0.1); };
  /* at the yard before any deep grey: nothing */
  WL.tp('haven'); Systems.update(0.05, {}); tick(5); out.yardFirst = { cross: S.flags.torchCross, seen: S.flags.torchSeen, cine: line() };
  /* a scrapper close by at renegade 1 — but the first beat has not landed: no name yet */
  S.renegade = 1; const cd = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass; Systems.update(0.05, {});
  const r0 = c.runners[0]; const stand = { x: cd.x + 60, y: cd.y + 420 }; WL.tp([stand.x, stand.y]); if (r0) { r0.x = stand.x + 120; r0.y = stand.y; }
  tick(3); out.nameEarly = { named: S.flags.torchNamed, cine: line() }; S.renegade = 0;
  /* beat one: the deep grey crossed, the next lit yard noticed */
  let deep = null; for (let y = 600; y < 4000 && !deep; y += 60) for (let x = 600; x < DATA.W - 600 && !deep; x += 60) if (World.mistAt(x, y) > 0.7 && !World.terrainAt(x, y).blocked && DATA.stationOrder.every(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) > 900)) deep = { x, y };
  WL.tp([deep.x, deep.y]); Systems.update(0.05, {}); tick(2); out.crossed = S.flags.torchCross;
  WL.tp('haven'); Systems.update(0.05, {}); tick(2);
  out.beat1 = { seen: S.flags.torchSeen, line: line(), letterbox: document.body.classList.contains('cine') };
  Myth.skip();
  /* beat two, door one: a scrapper reads the stance — renegade 1, a knife within 300 */
  S.renegade = 1; WL.tp([stand.x, stand.y]); Systems.update(0.05, {}); if (r0) { r0.x = stand.x + 120; r0.y = stand.y; }
  tick(2); out.beat2a = { named: S.flags.torchNamed, line: line() };
  Myth.skip();
  /* beat two, door two: a yard that has heard the stories (the legend's second tier) */
  S.flags.torchNamed = false; S.renegade = 0; S.level = 7; WL.tp('haven'); Systems.update(0.05, {}); tick(2);
  out.beat2b = { named: S.flags.torchNamed, line: line() };
  Myth.skip(); S.level = 1; WL.timeScale = 1;
  return out;
});
ok('THE FIRST BEAT: before any deep grey a lit yard says nothing; out of the deep grey, the next lit yard noticed — a micro-cine (letterboxed) with the line "You came out of the grey walking EASY. Where does a coat learn the dark like that?"',
  !frame.yardFirst.cross && !frame.yardFirst.seen && frame.yardFirst.cine === null && frame.crossed && frame.beat1.seen && frame.beat1.line === 'You came out of the grey walking EASY. Where does a coat learn the dark like that?' && frame.beat1.letterbox,
  JSON.stringify(frame));
ok('THE SECOND BEAT, IN ORDER: a scrapper at arm\'s length before the first beat says nothing; after it, two doors say the name — a scrapper who reads the stance at renegade one ("Hold— HOLD. I know that stance. Lamplighter."), or a yard at the legend\'s second tier ("Is it true what they say? That you carry the cloaked torch?")',
  !frame.nameEarly.named && frame.nameEarly.cine === null && frame.beat2a.named && frame.beat2a.line === 'Hold— HOLD. I know that stance. Lamplighter.' && frame.beat2b.named && frame.beat2b.line === 'Is it true what they say? That you carry the cloaked torch?',
  JSON.stringify({ nameEarly: frame.nameEarly, beat2a: frame.beat2a, beat2b: frame.beat2b }));

/* ================= 8–12 · THE LAMPLIGHTER, CORNERED ================= */
const arc = await ev(async () => {
  S.flags.torchSeen = S.flags.torchNamed = true; S.flags.lamp = false; S.flags.lampClass = false; S.gear.rifle = false; S.gear.ammo338 = 0; WL.timeScale = 0.001;
  const cd = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  let spot = null; for (let k = 0; k < 32 && !spot; k++) { const a = k / 32 * Math.PI * 2, x = cd.x + Math.cos(a) * 380, y = cd.y + Math.sin(a) * 380; if (!World.terrainAt(x, y).blocked && !World.terrainAt(x, y).water && World.mistAt(x, y) >= 0.35 && DATA.stationOrder.every(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) > 480)) spot = { x, y }; }
  WL.tp([spot.x, spot.y]); S.health = 40; S.dir = 0; Systems.update(0.05, {});
  c.runners.forEach((r, i) => { r.x = spot.x + 150 + i * 40; r.y = spot.y + 20; r.cd = i ? 5 : 0; });
  const say = __rec(Render, 'say'), shots = __rec(Snd.sfx, 'gunshots'), mails0 = new Set(S.mails);
  /* not yet hurt enough: nothing */
  S.health = 80; Myth.tick(0.1); const unhurt = !S.lamp && !S.flags.lamp;
  S.health = 40; Myth.tick(0.1);
  const staged = { lamp: !!S.lamp, seq: !!S.cineSeq, letterbox: document.body.classList.contains('cine'), ts: S.timeScale, first: say.calls.length ? say.calls[say.calls.length - 1][2] : null };
  const L = S.lamp, before = c.runners.map(r => ({ d: U.dist(r.x, r.y, S.px, S.py), cd: r.cd }));
  /* the second shot: the cracks from the ridge, the camera on the gun */
  const run = secs => { for (let t = 0; t < secs - 1e-9; t += 0.05) Cine.tick(0.05); };
  run(1.55); run(0.6);
  /* where the camera stands while the cracks are fired, and where the muzzle flickers are: on the gun, the cloak on the ridge */
  const gunCam = Cine.cam(0), gunFx = Cine.fx() || { flickers: [] };
  const cracks = { shots: shots.calls.length, after: c.runners.map(r => ({ d: U.dist(r.x, r.y, S.px, S.py), cd: r.cd })),
    gun: { dx: +(gunCam.x - L.fig.x).toFixed(1), dy: +(gunCam.y - L.fig.y).toFixed(1), z: +gunCam.z.toFixed(2), fromWalker: Math.round(Math.hypot(gunCam.x - S.px, gunCam.y - S.py)), flickers: gunFx.flickers.map(f => [+(f.x - L.fig.x).toFixed(1), +(f.y - L.fig.y).toFixed(1)]) } };
  /* the fourth: the stranger steps out — measured against the same frame without them */
  run(2.1 - 0.6 + 2.2 + 0.1);
  const strangerLine = say.calls.map(x => x[2]).find(t => /SURFACE-FRIEND/.test(t)) || null, envShown = L.env.show;
  await __wait(120); await __frames(3);
  const at = { x: L.env.x, y: L.env.y - 26 }, a = __grab(at.x, at.y, 110); L.env.show = false; await __wait(120); await __frames(3); const b = __grab(at.x, at.y, 110); L.env.show = true;
  const cloak = __grab(L.fig.x, L.fig.y - 26, 110);
  const stranger = { line: strangerLine, envShown, changed: __diff(a, b), olive: ['C', 'L', 'T'].reduce((n, k) => n + __count(a, __hex(SPRITES.FIG.stranger.pal[k]), 6), 0), oliveWithout: ['C', 'L', 'T'].reduce((n, k) => n + __count(b, __hex(SPRITES.FIG.stranger.pal[k]), 6), 0) };   // the coveralls' olive and the leaf trim, the stranger's own letters
  /* the hold: the stamp, then the handoff */
  run(2.7 - 0.1 + 0.2);
  const stamp = Cine.fx() ? Cine.fx().stamp : null;
  run(2.0);
  const handoff = { rifle: S.gear.rifle, ammo: S.gear.ammo338, lampClass: S.flags.lampClass, seq: !!S.cineSeq, lamp: S.lamp, sbsn: S.flags.sbsnIdx, letters: S.mails.filter(m => !mails0.has(m)).map(m => m.subj), lesson: !!S.flags.tut.firstRifle, rifleName: Exile.rifleDef().name, exile: Exile.phase(), ts: S.timeScale, letterbox: document.body.classList.contains('cine') };
  say.off(); shots.off();
  /* once, ever: cornered again, nothing comes */
  S.health = 40; c.runners.forEach((r, i) => { r.x = S.px + 150 + i * 40; r.y = S.py + 20; r.cd = 0; }); Myth.tick(0.1);
  const again = { lamp: !!S.lamp, seq: !!S.cineSeq, begin: Myth.beginLamp('corner'), can: Myth.canLamp() };
  S.health = 100; WL.timeScale = 1;
  return { spot, unhurt, staged, before, cracks, stranger, stamp, handoff, again };
});
ok('THE ARC, STAGED: hurt (under 55), deep in the grey, far from every town, a knife closing — and ONE scene begins on the Cine engine: the letterbox, the world at quarter speed, the first line from the ones closing ("Nowhere left to walk, coat."); unhurt, nothing comes',
  arc.unhurt && arc.staged.lamp && arc.staged.seq && arc.staged.letterbox && arc.staged.ts === 0.25 && arc.staged.first === 'Nowhere left to walk, coat.', JSON.stringify({ spot: arc.spot, unhurt: arc.unhurt, staged: arc.staged }));
ok('THE CRACKS: the camera looks straight at the gun this time — cut from the cornered Walker to the cloak on the ridge, close (2.3), standing on it while it fires, the three muzzle flickers on the gun itself — three cracks from a ridge nobody saw (the gunshots heard), and every chase within 640 is broken: the knives flung 160 back and down twenty seconds',
  arc.cracks.shots === 1 && arc.cracks.after.every((r, i) => Math.abs(r.d - arc.before[i].d - 160) < 1 && r.cd === 20)
  && Math.abs(arc.cracks.gun.dx) < 1 && Math.abs(arc.cracks.gun.dy) < 1 && Math.abs(arc.cracks.gun.z - 2.3) < 0.01 && arc.cracks.gun.fromWalker > 200 && arc.cracks.gun.flickers.length === 3 && arc.cracks.gun.flickers.every(([x, y]) => Math.abs(x) < 1 && Math.abs(y) < 1),
  JSON.stringify({ before: arc.before, cracks: arc.cracks }));
ok('THE STRANGER: the raised-tongue stranger steps out beside the cloak — "GREETINGS, SURFACE-FRIEND. OUR BOOKS DESCRIBED YOUR KIND. THE BOOKS WERE WRONG." — drawn on their own figure in the Society\'s olive, measured against the same frame without them',
  arc.stranger.line === 'GREETINGS, SURFACE-FRIEND. OUR BOOKS DESCRIBED YOUR KIND. THE BOOKS WERE WRONG.' && arc.stranger.envShown && arc.stranger.changed > 200 && arc.stranger.olive > arc.stranger.oliveWithout + 100, JSON.stringify(arc.stranger));
ok('THE HANDOFF: HOLD — "THE CLOAKED TORCH." stamped — then the scene lets go (letterbox and clock restored) and the handoff lands: the C14 Timberwolf and twelve counted rounds, the Lamplighter class unlocked for this world, two letters (the unsigned note, the Society\'s FORM 7-C), the record promised, the lesson, and a mark nobody made on the table',
  arc.stamp === 'THE CLOAKED TORCH.' && arc.handoff.rifle && arc.handoff.ammo === 12 && arc.handoff.lampClass && !arc.handoff.seq && arc.handoff.lamp === null && arc.handoff.sbsn === 0 && arc.handoff.ts === 1 && !arc.handoff.letterbox
  && ['Left in your pack, unsigned', 'FIELD CORRESPONDENCE — FORM 7-C'].every(s => arc.handoff.letters.includes(s)) && arc.handoff.lesson && arc.handoff.rifleName === 'C14 Timberwolf' && arc.handoff.exile === 'marked',
  JSON.stringify({ stamp: arc.stamp, handoff: arc.handoff }));
ok('ONCE, EVER: cornered again — hurt, in the grey, a knife at arm\'s length — nothing comes, and asked outright the scene refuses',
  !arc.again.lamp && !arc.again.seq && arc.again.begin === false && arc.again.can === false, JSON.stringify(arc.again));

/* ================= 13–16 · THE TIMBERWOLF ================= */
const rifle = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'pass'), c = S.camps.pass;
  let spot = null; for (let k = 0; k < 32 && !spot; k++) { const a = k / 32 * Math.PI * 2, x = cd.x + Math.cos(a) * 520, y = cd.y + Math.sin(a) * 520; if (!World.terrainAt(x, y).blocked && !World.terrainAt(x, y).water) spot = { x, y }; }
  WL.tp([spot.x, spot.y]); S.renegade = 0; S.heat = {}; S.gear.ammo338 = 12; S.rifleCd = 0; WL.timeScale = 0.001; Systems.update(0.05, {});
  const place = (dists) => c.runners.forEach((r, i) => { const d = dists[i] !== undefined ? dists[i] : 2000; r.x = S.px + d; r.y = S.py + i * 12; r.cd = 0; });
  const rail = () => { Systems.update(0.02, {}); const a = Systems.getInteractions().find(i => i.key === 'Y'); return a ? a.label.replace(/<[^>]+>/g, '').replace(/&middot;/g, '·') : null; };
  const toast = __rec(UI, 'toast'), said = __rec(Render, 'say');
  const out = {};
  /* the rail: offered only with a scrapper inside the crack's argument (540) */
  place([900, 1000]); out.railFar = rail(); place([500, 900]); out.railNear = rail();
  /* the warning crack: nothing within 430, two within 540 — they dive, the ledger stays clean */
  place([480, 510]); const w0 = { ammo: S.gear.ammo338, ren: S.renegade };
  Systems.rifleFire();
  out.warning = { ammo: w0.ammo - S.gear.ammo338, ren: S.renegade - w0.ren, heat: Object.keys(S.heat).length, dove: c.runners.map(r => r.cd), toast: String(toast.calls.map(x => x[0]).pop() || '') };
  /* the cooldown: six seconds, the trigger pulled again does nothing */
  const cd0 = S.rifleCd; Systems.rifleFire(); out.cooldown = { cd: cd0, ammoHeld: S.gear.ammo338 === w0.ammo - 1 };
  /* the connecting shot: a knife at 300 — he drops, his friends dive, the ledger writes it */
  S.rifleCd = 0; place([300, 420]); const k = c.runners[0], x0 = k.x, near = DATA.stationOrder.slice().sort((a, b2) => U.dist(S.px, S.py, DATA.stations[a].x, DATA.stations[a].y) - U.dist(S.px, S.py, DATA.stations[b2].x, DATA.stations[b2].y))[0];
  const h0 = Systems.heatAt(near), r0 = S.renegade;
  Systems.rifleFire();
  out.connect = { down: k.cd, pushed: Math.round(k.x - x0), friend: c.runners[1].cd, ren: S.renegade - r0, heatAt: near, heat: Systems.heatAt(near) - h0, felledBy: k.felledBy, said: said.calls.map(x => x[2]).filter(t => /DOWN|LAMPLIGHTER|RIFLE/.test(t)) };
  /* the outlaw's hand: at Road's Own the bolt works faster and reaches further */
  S.rifleCd = 0; S.renegade = 20; place([500, 2000]); const r1 = S.renegade; Systems.rifleFire(); out.steady = { cd: +S.rifleCd.toFixed(2), reached: c.runners[0].cd === 25, ren: S.renegade - r1 };
  /* dry: the rifle named, nothing fired */
  S.rifleCd = 0; S.gear.ammo338 = 0; place([300, 2000]); const d0 = c.runners[0].cd; Systems.rifleFire();
  out.dry = { toast: String(toast.calls.map(x => x[0]).pop() || '').replace(/<[^>]+>/g, ''), untouched: c.runners[0].cd === d0 };
  toast.off(); said.off();
  S.gear.ammo338 = 12; S.renegade = 0; S.heat = {}; c.runners.forEach(r => { r.cd = 30; r.x = cd.x; r.y = cd.y; }); WL.tp('haven'); WL.timeScale = 1;
  return out;
});
ok('THE WARNING CRACK: nothing in the rifle\'s reach (430) but two knives inside its argument (540) — one round spent, both dive for a round (twelve seconds), and the ledger stays clean: no renegade, no heat, "Nothing on the ledger but a round."',
  rifle.warning.ammo === 1 && rifle.warning.ren === 0 && rifle.warning.heat === 0 && rifle.warning.dove.every(v => v === 12) && /Nothing on the ledger but a round/.test(rifle.warning.toast), JSON.stringify(rifle.warning));
ok('THE SHOT THAT CONNECTS: a knife at 300 drops where he stands (down twenty-five seconds, knocked back), his friend dives, and the ledger writes it — +2 renegade and +2 heat at the nearest town, the round his own hand\'s',
  rifle.connect.down === 25 && rifle.connect.pushed === 60 && rifle.connect.friend >= 8 && rifle.connect.ren === 2 && rifle.connect.heat === 2 && rifle.connect.felledBy === 'walker' && rifle.connect.said.length > 0, JSON.stringify(rifle.connect));
ok('THE BOLT AND THE DRY FIRE: after a shot the bolt works six seconds and the trigger does nothing meanwhile; the outlaw\'s ladder trains the hand — at Road\'s Own the bolt works in 4.8 s and the reach grows to take a knife at 500; with no rounds the rifle is named dry (v3.30: "The C14 Timberwolf is dry") and nothing fires',
  rifle.cooldown.cd === 6 && rifle.cooldown.ammoHeld && rifle.steady.cd === 4.8 && rifle.steady.reached && rifle.steady.ren === 2 && /The C14 Timberwolf is dry/.test(rifle.dry.toast) && rifle.dry.untouched, JSON.stringify({ cooldown: rifle.cooldown, steady: rifle.steady, dry: rifle.dry }));
ok('THE RAIL: the rifle offers itself on Y only when scrappers stand inside the crack\'s argument — nothing with the knives at 900, "The C14 Timberwolf — 12 ·338 in the pack" with one at 500',
  rifle.railFar === null && rifle.railNear === 'The C14 Timberwolf — 12 ·338 in the pack', JSON.stringify({ far: rifle.railFar, near: rifle.railNear }));

/* ================= 17 · THE FACTIONS, OUT OF RUMOUR ================= */
await ev(() => RepublicUI.open());
await page.waitForTimeout(250);
const facts = await ev(() => {
  RepublicUI.render();
  const rows = [...document.querySelectorAll('#repBody .rpRow')].map(r => r.textContent.replace(/\s+/g, ' ').trim());
  const L = FACT.FACTIONS.lamplighters, D = FACT.FACTIONS.diefenbunker;
  const out = { lampRow: rows.find(t => /The Lamplighter Nomads/.test(t)) || null, dfRow: rows.find(t => /The Diefenbunker Society/.test(t)) || null,
    lamp: { stance: L.stance, people: L.people, city: /found a city to call their own/.test(L.culture), marksmen: /marksmen/.test(L.culture) },
    df: { stance: D.stance, people: D.people, leaf: /red leaf etched into the sights/.test(D.culture), cold: /Something about the cold\. Something about the water\./.test(D.culture), canada: /canada/i.test(D.culture), tongue: /raised tongue/.test(D.culture) } };
  RepublicUI.close(); out.closed = document.getElementById('republicOv').classList.contains('hidden');
  return out;
});
ok('THE FACTIONS, OUT OF RUMOUR: THE LAMPLIGHTER NOMADS (wary — exile marksmen; somewhere out past the maps the exiles even found a city to call their own) and THE DIEFENBUNKER SOCIETY (unknown — the bunker-born, carbines with a red leaf etched into the sights, the raised tongue, something about the cold, something about the water, and Canada never said) stand on the Factions sheet\'s roll with their people',
  !!facts.lampRow && /Lamplighters/.test(facts.lampRow) && !!facts.dfRow && /Bunker-born/.test(facts.dfRow) && facts.lamp.stance === 'WARY' && facts.lamp.city && facts.lamp.marksmen
  && facts.df.stance === 'UNKNOWN' && facts.df.leaf && facts.df.cold && facts.df.tongue && !facts.df.canada && facts.closed, JSON.stringify(facts));

/* ================= 18 · THE SOCIETY'S RECORD ================= */
const sbsn = await ev(() => {
  WL.timeScale = 0.001;
  const got = [], seen = new Set(S.mails.map(m => m.subj)), left = S.flags.sbsnT - S.time, idx0 = S.flags.sbsnIdx;
  const step = secs => { S.time += secs; Myth.tick(0.01); for (const m of S.mails) if (!seen.has(m.subj)) { seen.add(m.subj); got.push({ subj: m.subj, sbsn: /class="sbsn"/.test(m.body), body: m.body.replace(/<[^>]+>/g, ' ') }); } };
  step(left - 2); const early = got.length;
  step(3); const first = got.length; step(DATA.T.sbsnGap - 3); const beforeGap = got.length; step(4); step(DATA.T.sbsnGap + 1); step(DATA.T.sbsnGap + 1);
  WL.timeScale = 1;
  return { left: Math.round(left), idx0, early, first, beforeGap, got: got.map(g => ({ subj: g.subj, sbsn: g.sbsn, names: (g.body.match(/SBSN: ([A-Z' ]+?)\s+SBCA/) || [])[1] })), canada: got.length === 3 && /A PLACE CALLED CANADA/.test(got[2].body) && /SOMETHING ABOUT THE COLD, SOMETHING ABOUT THE WATER/.test(got[2].body), idx: S.flags.sbsnIdx };
});
await ev(() => { WL.tp('haven'); UI.openStation('haven'); });
await page.waitForTimeout(250); await drain();
await page.click('#stationTabs [data-tab="ledger"]'); await page.waitForTimeout(250);
const paper = await ev(() => { const el = document.querySelector('#stationBody .sbsn'); const r = el ? { font: getComputedStyle(el).fontFamily, color: getComputedStyle(el).color } : null; document.getElementById('stationClose').click(); return r; });
ok('THE SOCIETY\'S RECORD: after first contact the comm array delivers the three founding logs one at a time, in order — THE UNSEALING (Douglas Reed), THE DOORS (Sarah O\'Connel), THE RED LEAF (Jimmy Butler), the last naming a place called Canada — each on Society paper (the .sbsn dossier, its own mono ink on the page)',
  sbsn.idx0 === 0 && sbsn.left > 2 && sbsn.early === 0 && sbsn.first === 1 && sbsn.beforeGap === 1 && sbsn.got.map(g => g.subj).join('|') === 'BUNKER RECORD 1 OF 3 — THE UNSEALING|BUNKER RECORD 2 OF 3 — THE DOORS|BUNKER RECORD 3 OF 3 — THE RED LEAF'
  && sbsn.got.map(g => g.names).join('|') === 'DOUGLAS REED|SARAH O\'CONNEL|JIMMY BUTLER' && sbsn.got.every(g => g.sbsn) && sbsn.canada && sbsn.idx === 3 && !!paper && paper.color === 'rgb(169, 194, 164)',
  JSON.stringify({ sbsn, paper }));

/* ================= 19 · THE FALL LANE ================= */
const fall = await ev(() => {
  /* a world the exiles have not yet come to, the torch framed; the pool spent and no yard that loves the walker enough */
  S.flags.lamp = false; S.flags.lampClass = false; S.flags.torchSeen = S.flags.torchNamed = true; S.gear.rifle = false; S.gear.ammo338 = 0;
  for (const id of DATA.stationOrder) S.stations[id].appr = 0;
  S.npcs.forEach(n => { if (n.state === 'companion') n.state = 'idle'; });
  WL.timeScale = 0.001; WL.tp('haven'); S.px += 900; S.flags.rescueCdT = 0;
  const say = __rec(Render, 'say');
  Porter.damage(999, 'bleed');
  const r = { dead: !!S.dead, health: S.health, lamp: !!S.lamp, seq: !!S.cineSeq, first: say.calls.map(x => x[2]).find(t => /get up/i.test(t)) || null, townRescue: !!S.rescue };
  for (let t = 0; t < 12; t += 0.05) Cine.tick(0.05);
  say.off();
  r.after = { rifle: S.gear.rifle, ammo: S.gear.ammo338, lampClass: S.flags.lampClass, dead: !!S.dead };
  WL.timeScale = 1; S.health = 100;
  return r;
});
ok('THE FALL LANE: the last quarter spent with no yard that would ride — and the exiles take the ride nobody else would: the walker stood up (at the rescue\'s thirty), no town\'s riders, the same once-ever scene opening on "…get up. Get UP." and ending in the same handoff',
  !fall.dead && fall.health === 30 && fall.lamp && fall.seq && fall.first === '…get up. Get UP.' && !fall.townRescue && fall.after.rifle && fall.after.ammo === 12 && fall.after.lampClass && !fall.after.dead, JSON.stringify(fall));

/* ================= 20 · THE CLASS, THE PORTER, THE COURIER AFTER ================= */
await ev(() => { State.save(); });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnNew'); await page.waitForTimeout(600);
const offered = await ev(() => [...document.querySelectorAll('#cgClasses [data-cls]')].map(e => e.dataset.cls));
await page.click('#cgClasses [data-cls="lamplighter"]'); await page.waitForTimeout(150);
const lampBudget = await ev(() => ({ budget: +document.getElementById('cgBudget').textContent, locked: document.getElementById('cgBegin').disabled }));
await page.click('#cgTraits [data-trait="restless"]'); await page.waitForTimeout(150);   // the class costs two points: a flaw pays for it
await page.click('#cgBegin'); await page.waitForTimeout(1500); await T.skipCine();
const lampP = await ev(() => { const cap = State.cap(); return { cls: S.pClass, rifle: S.gear.rifle, ammo: S.gear.ammo338, foot: S.skills.foot.lv, sal: S.skills.sal.lv, cap, pts: CHAR.CLASSES.lamplighter.pts }; });
const courierCap = await ev(() => { const was = S.pClass; S.pClass = 'courier'; Porter.dirty(); const c = State.cap(); S.pClass = was; Porter.dirty(); return c; });
await ev(() => { State.save(); });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnNew'); await page.waitForTimeout(600);
await page.click('#cgClasses [data-cls="courier"]'); await page.waitForTimeout(150);
await page.click('#cgBegin'); await page.waitForTimeout(1500); await T.skipCine();
const courierP = await ev(() => ({ cls: S.pClass, rifle: S.gear.rifle, ammo: S.gear.ammo338, roll: S.legacy.slice(-2).map(l => l.cls), lampClass: S.flags.lampClass }));
ok('THE CLASS, THE PORTER, THE COURIER AFTER: in this world the next enlistment offers the Lamplighter; chosen by a real click (its two points owed, paid by a flaw), the porter shoulders the Timberwolf and six rounds on day one (−2 points, foot 1 and salvage 1 from the class, an exile-trained back six kilos stronger than a courier\'s); the courier who takes the coat after them starts without a rifle — a hand-me-down between exiles only',
  offered.includes('lamplighter') && lampBudget.budget === -2 && lampBudget.locked && lampP.cls === 'lamplighter' && lampP.rifle === true && lampP.ammo === 6 && lampP.pts === -2 && lampP.foot >= 1 && lampP.sal >= 1 && Math.abs(lampP.cap - courierCap - 6) < 0.01
  && courierP.cls === 'courier' && courierP.rifle === false && courierP.ammo === 0 && courierP.lampClass === true, JSON.stringify({ offered, lampBudget, lampP, courierCap, courierP }));

await T.finish('the names and the exiles');
