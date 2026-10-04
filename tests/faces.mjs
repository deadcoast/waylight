/* faces.mjs — v3.43 THE FACE AT THE DOOR (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). What it proves: eight keepers wear hand-drawn busts (served as
   cached portraits at any scale, on the terminal and on the door plate); a grievance is said to your face at the door —
   the plate with the keeper's face and words in rust, the first of it said aloud, once (again only after a while or when it
   deepened), down on its own, made right in gold at the door and on the terminal; a square that rises under a thin garrison
   takes the town's own standing that hour — a stone at THE FIELD STONES, the town colder, the mail, the card; a mourned
   chief's return is a scene (from the ring's edge, still gone while he walks, his line at six seconds, the rag down at seven
   and a half, the pole bare a day); a pulled bolt leaves a scar (the wind's ceiling until dressed thrice — a medic's minute,
   a town's once a visit — healed in a day, late in two); the survey sheet's marks open the camp's roll under a real mouse
   (hover, pin beside the marks, stays, let go, the gone row); the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const drain = async () => { await ev(() => { WL.timeScale = 1; }); await T.drain(); await ev(() => { WL.timeScale = 0.001; }); };
await ev(() => {
  for (const id of DATA.stationOrder) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources();
  S.banked.metal = 900; S.banked.wood = 300; S.banked.provisions = 500; S.banked.ceramic = 300; S.banked.lumen = 80; S.cov = 0.6;
  window.__says = []; const sy = Render.say; Render.say = (x, y, str, col, who) => { __says.push({ str: String(str), col }); return sy(x, y, str, col, who); };
  window.__die = (v, fn) => { const r0 = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = r0; } };
  window.__at = f => { const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * f; };
  WL.timeScale = 0.001;
});

/* ================= 1 · THE REGISTRIES ================= */
let r = await ev(async () => {
  const inPal = (rows, pal, w, h) => rows.length === h && rows.every(rw => rw.length === w) && [...new Set(rows.join('').replace(/\./g, ''))].every(ch => pal[ch]);
  const F = SPRITES.FACES, ids = DATA.stationOrder;
  const faces = Object.keys(F).length === 8 && ids.every(id => F[id] && inPal(F[id].rows, F[id].pal, 16, 16)) && new Set(ids.map(id => F[id].rows.join(''))).size === 8 && new Set(ids.map(id => JSON.stringify(F[id].pal))).size === 8;
  const size = src => new Promise(res => { const im = new Image(); im.onload = () => res(im.naturalWidth + 'x' + im.naturalHeight); im.onerror = () => res('0'); im.src = src; });
  const served = ids.every(id => /^data:image\/png/.test(Render.faceURL(id, 3))) && Render.faceURL('mill', 3) === Render.faceURL('mill', 3) && Render.faceURL('mill', 3) !== Render.faceURL('mill', 4) && await size(Render.faceURL('mill', 3)) === '48x48' && await size(Render.faceURL('mill', 4)) === '64x64';
  const rag = rows => (rows.join('').match(/[Rr]/g) || []).length, stake = inPal(SPRITES.BARESTAKE, SPRITES.RAGSTAKE_PAL, 7, 13) && !/R/.test(SPRITES.BARESTAKE.join('')) && rag(SPRITES.BARESTAKE) * 4 < rag(SPRITES.RAGSTAKE);   // the rag gone — a stain of the knot on the pole
  const scar = inPal(SPRITES.SCAR, SPRITES.SCAR_PAL, 3, 3) && inPal(SPRITES.DRESSING, SPRITES.SCAR_PAL, 4, 3);
  const voices = ids.every(id => ['ground', 'camp', 'given', 'remembered', 'made'].every(k => typeof DATA.keeperGrief[id][k] === 'string' && DATA.keeperGrief[id][k].length > 20)) && new Set(ids.map(id => DATA.keeperGrief[id].ground)).size === 8;
  const S2 = DATA.T.scar, O = DATA.T.ownFall;
  const rows = S2.stamMul === 0.85 && S2.dressings === 3 && S2.dressEvery === 60 && S2.medicR === 90 && S2.healDays === 1 && S2.undressedDays === 2 && O.chance === 0.5 && O.likes === 5;
  const D = Memorial.DESIGNS.town, design = D.ground === 'THE FIELD STONES' && D.epitaph === 'stood the square' && D.stampWord === 'HOME' && D.accent === 'shield' && !!D.pal;
  const lessons = ['firstFace', 'firstOwnFell', 'firstScar', 'firstChiefBack'].every(k => DATA.tutorials[k] && DATA.tutorialTitles[k]), lessonsN = Object.keys(DATA.tutorials).length;
  return { faces, served, stake, scar, voices, rows, design, lessons, lessonsN };
});
ok('THE REGISTRIES: eight keepers\' 16×16 busts on one alphabet, each in a palette of its own, all distinct; served as cached portraits at any scale (the same URL twice, 48 px at three, 64 at four); the bare stake (7×13, the rag gone — a stain where it was knotted) and the scar\'s cross and its dressing in their palette; five lines in every keeper\'s voice for the five ways a parcel goes wrong; the scar\'s row and the fall\'s; THE FIELD STONES as a design of its own (the shield for an accent, "stood the square", HOME); four lessons (v3.49: the manual at 93 pages)',
  Object.entries(r).every(([k, v]) => k === 'lessonsN' ? v >= 93 : v === true), JSON.stringify(r));

/* ================= 2 · THE FACE AT THE DOOR ================= */
const arrive = id => ev(id => { document.getElementById('keeperSay').classList.add('hidden'); WL.tp([DATA.stations.haven.x + 520, DATA.stations.haven.y - 700]); Systems.update(0.02, {}); __says.length = 0; WL.tp(id); Systems.update(0.02, {}); return !document.getElementById('keeperSay').classList.contains('hidden') && __says.length > 0; }, id);
r = await ev(() => {
  const M = 'mill'; S.grievances = [];
  const it = State.makeItem('parcel'); it.parcel = { id: 9001, to: M, from: 'haven', kind: 'coat', name: 'a mended coat' };
  Economy.grieve(it, 'ground');
  return { g: Economy.grievancesFor(M).length };
});
let shown = await arrive('mill');
r = await ev(() => {
  const el = document.getElementById('keeperSay'), k = DATA.keepers.mill, V = DATA.keeperGrief.mill;
  const img = el.querySelector('img'), face = !!img && img.getAttribute('src') === Render.faceURL('mill', 4);
  const name = el.querySelector('.ksName').textContent.includes(k.name) && el.querySelector('.ksName').textContent.includes(k.role) && el.querySelector('.ksName').textContent.includes('The Mill');
  const lineEl = el.querySelector('.ksLine'), words = !!lineEl && lineEl.textContent.includes(V.ground.replace(/\{name\}/g, 'a mended coat').slice(1, 30)) && !el.classList.contains('made');
  const sayRust = __says.find(s => s.col === '224,101,74'), first = V.ground.replace(/\{name\}/g, 'a mended coat');
  const firstSentence = first.split(/(?<=[.!?…])\s/)[0], want = firstSentence.length > 64 ? firstSentence.slice(0, 64).replace(/\s+\S*$/, '') + '—' : firstSentence;
  const said = !!sayRust && sayRust.str.toLowerCase() === want.toLowerCase() && sayRust.str.length <= 65;
  const lesson = !!S.flags.tut.firstFace;
  return { face, name, words, said, lesson, say: sayRust && sayRust.str };
});
const fd1 = { shown, ...r };
const again = await arrive('mill');   // said once
await ev(() => { const it = State.makeItem('parcel'); it.parcel = { id: 9001, to: 'mill', from: 'haven', kind: 'coat', name: 'a mended coat' }; Economy.grieve(it, 'camp', DATA.camps[2]); });
const deeper = await arrive('mill');   // said again when it deepened
r = await ev(() => {
  const el = document.getElementById('keeperSay'), V = DATA.keeperGrief.mill;
  const campWords = el.querySelector('.ksLine').textContent.includes(V.camp.replace(/\{name\}/g, 'a mended coat').slice(1, 30));
  /* down on its own: (v3.44) it holds twenty-two seconds while it offers your answer — nine for what cannot be answered */
  S.time += 10; UI.tick(); const stillOffering = !el.classList.contains('hidden');
  S.time += 13; UI.tick(); const down = el.classList.contains('hidden');
  const g = Economy.grievancesFor('mill')[0]; g.word = 'sorry'; S.stations.mill.faceSaid = null;
  return { campWords, stillOffering, down };
});
const fd2 = r;
const said9 = await arrive('mill');
r = await ev(() => {
  const el = document.getElementById('keeperSay');
  S.time += 10; UI.tick(); const down9 = el.classList.contains('hidden');
  /* made right: the face says THAT, in gold, at the door and on the terminal for three minutes */
  const g = Economy.grievancesFor('mill')[0]; g.word = null; __says.length = 0;
  const said = Economy.strikeGrievance({ id: 9001 }, 'mill');
  const gold = !el.classList.contains('hidden') && el.classList.contains('made') && !!__says.find(s => s.col === '255,201,120');
  UI.openStation('mill'); const kl = document.getElementById('keeperLine');
  const madeLine = S.stations.mill.madeSaid, terminal = !!madeLine && kl.textContent.includes(madeLine.line.slice(0, 30)) && !kl.querySelector('.keeperWords.grief');
  document.getElementById('stationClose').click();
  S.stations.mill.madeSaid.t -= 181; UI.openStation('mill'); const after = !document.getElementById('keeperLine').textContent.includes(madeLine.line.slice(0, 30)); document.getElementById('stationClose').click();
  /* every keeper at the terminal, beside their words, grievance or none */
  const every = DATA.stationOrder.every(id => { UI.openStation(id); const im = document.querySelector('#keeperLine img.keeperFace'); const ok2 = !!im && im.getAttribute('src') === Render.faceURL(id, 3) && document.getElementById('keeperLine').textContent.includes(DATA.keepers[id].name); document.getElementById('stationClose').click(); return ok2; });
  el.classList.add('hidden');
  return { down9, said: !!said, gold, terminal, after, every };
});
ok('THE FACE AT THE DOOR: crossing into a town\'s reach with a grievance open, the keeper\'s plate comes up — their face (served at 4×), their name, role and door, their words in rust in their own voice — and the first sentence is said aloud at the door (cut at a word past sixty-four characters, with a dash), the lesson; the next arrival it is not said again, until the grievance deepens (carried into a camp: said again, the camp\'s words); down on its own (v3.44: it holds twenty-two seconds while it offers your answer, nine for what can no longer be answered); made right, the face says THAT in gold at the door and on the terminal for three minutes, then no more; every keeper\'s face beside their words at the terminal',
  fd1.shown && fd1.face && fd1.name && fd1.words && fd1.said && fd1.lesson && again === false && deeper && fd2.campWords && fd2.stillOffering && fd2.down && said9 && r.down9 && r.said && r.gold && r.terminal && r.after && r.every,
  JSON.stringify(fd1) + ' again=' + again + ' deeper=' + deeper + ' ' + JSON.stringify(fd2) + ' said9=' + said9 + ' ' + JSON.stringify(r));

/* ================= 3 · THE TOWN'S OWN WHO FALL ================= */
r = await ev(() => {
  const M = 'mill', st = S.stations[M];
  S.rep.held[M] = { t0: S.time, from: M, tithe: 0, shields: 2, riseDay: -1 }; st.likesTo = 45;
  const a = Republic.recruitOwn(M), b = Republic.recruitOwn(M);
  NPC.setOrder(a, 'hours', 'nights'); NPC.setOrder(b, 'hours', 'days'); NPC.svc(a).stood = 4;
  const aName = a.name, bName = b.name, grounds0 = Memorial.grounds().includes('town');
  st.likesTo = 40; S.mails.length = 0; __at(0.75);
  const leg0 = S.legacy.length;
  __die(0.3, () => Republic.squareRises(M));
  const rows2 = S.legacy.slice(leg0).filter(x => x.fact === 'town');
  const fell = rows2.length === 1 && rows2[0].name === aName && rows2[0].fate === 'fell when the square rose at The Mill' && rows2[0].kit === 'townshield' && rows2[0].town === M && rows2[0].deliveries === 4 && rows2[0].cls === 'The town\'s own';
  const home = !S.legacy.some(x => x.name === bName) && !NPC.ownAt(M).length;
  const ground = !grounds0 && Memorial.grounds().includes('town') && !!Memorial.site('town');
  const colder = st.likesTo === 40 - DATA.T.ownFall.likes;
  const mail = S.mails.some(m => m.subj === 'The Mill: its own fell in the square' && m.body.includes(aName) && !m.body.includes(bName)) && !!S.flags.tut.firstOwnFell;
  Memorial.raise('town');
  Memorial.open('town');
  const head = document.getElementById('memHead').textContent, card = [...document.querySelectorAll('#memBody .memCard')].find(e => e.textContent.includes(aName));
  const sheet = /The Field Stones · the town's own/.test(head) && !!card && /The town's own · stood the square/.test(card.textContent) && /fell when the square rose at The Mill/.test(card.textContent) && /HOME/.test(card.querySelector('.memStamp').textContent) && !!card.querySelector('.memPortrait img');
  Memorial.close();
  delete S.rep.unlit[M]; st.connected = true; st.litT = 1; State.refreshSources(); __at(0.3);
  return { fell, home, ground, colder, mail, sheet };
});
ok('THE TOWN\'S OWN WHO FALL: a square rising by night under a thin garrison sends it home, and of the town\'s own the one keeping NIGHTS was standing and fell — a stone on the roll in the town\'s kit with the fate written (fell when the square rose at The Mill) and the watches stood as the count — while the one keeping DAYS was home; the first fall reveals THE FIELD STONES, a ground of its own; the town five likes colder for its own it lost; the mail names the fallen and not the living; the memorial sheet reads the ground and the card (the kit\'s portrait, "stood the square", HOME)',
  Object.values(r).every(Boolean), JSON.stringify(r));

/* ================= 4 · THE CHIEF'S RETURN, AS A SCENE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, span = REP.WATCHPOST.storm.seen.mourn * DATA.T.dayLen;
  for (const cd of DATA.camps) { const c2 = S.camps[cd.id]; c2.taken = null; c2.pacified = false; c2.storm = null; }
  c.chiefLost = S.time - span - 1; c.chiefReturn = null; c.stakeBare = 0; S.mails.length = 0; __says.length = 0;
  WL.tp([ash.x + 100, ash.y + 180]);
  Republic.tick(0.05);
  const rt = c.chiefReturn; if (!rt) return { begun: false };
  const edge = Math.abs(U.dist(rt.x0, rt.y0, ash.x, ash.y) - ash.r * 0.9) < 1 && rt.tx === ash.x - 30 && rt.ty === ash.y + 18;
  for (let i = 0; i < 50; i++) Republic.tick(0.1);   // ~5 s in
  const walking = Republic.chiefGone(ash) && !!c.chiefReturn && !c.chiefReturn.said && !__says.some(s => /brother|fire is mine|Rag down/.test(s.str));
  for (let i = 0; i < 12 && !c.chiefReturn.said; i++) Republic.tick(0.1);
  const t6 = c.chiefReturn.t, line = c.chiefReturn.said && t6 >= 6 && t6 < 6.2 && __says.some(s => ['He was my brother.', 'The fire is mine now.', 'Rag down. Rag on.'].includes(s.str)) && Republic.chiefGone(ash);
  for (let i = 0; i < 20 && c.chiefReturn; i++) Republic.tick(0.1);
  const whole = !c.chiefReturn && !c.chiefLost && Republic.chiefUp(ash) && S.mails.some(m => m.subj === 'Ash Camp: a new chief') && !!S.flags.tut.firstChiefBack && Republic.stakeBare(ash);
  const bareT = c.stakeBare; S.time += DATA.T.dayLen - 5; const bareStill = Republic.stakeBare(ash); S.time += 10; const bareGone = !Republic.stakeBare(ash); S.time -= DATA.T.dayLen + 5;
  c.stakeBare = bareT;
  /* a camp taken in the span gets no scene */
  const ridge = DATA.camps.find(x => x.id === 'pass'), cp = S.camps.pass; cp.chiefLost = S.time - span - 1; cp.chiefReturn = null; cp.taken = { t0: S.time, from: 'haven', tithe: 0, shields: 2, stormDay: -1 }; cp.pacified = true;
  Republic.tick(0.05); const noScene = !cp.chiefReturn; cp.taken = null; cp.pacified = false; cp.chiefLost = 0;
  WL.tp('haven');
  return { begun: true, edge, walking, line, t6: +t6.toFixed(2), whole, bareStill, bareGone, noScene };
});
const cr1 = r;
/* seen: while he walks the stake keeps its rag and A CHIEF COMES UP stands under the fire; after, the pole stands bare where it stood */
await drain();
const crSeen = await ev(async () => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash, span = REP.WATCHPOST.storm.seen.mourn * DATA.T.dayLen;
  __at(0.3); c.chiefLost = S.time - span - 1; c.chiefReturn = null; c.stakeBare = 0; c.runners = [];
  WL.tp([ash.x + 60, ash.y + 200]); S.cargo = S.cargo.filter(x => x.cat === 'tool'); __clearAmb(ash.x, ash.y, 400); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = ash.x - 50; Render.cam.y = ash.y;
  Republic.tick(0.05); c.chiefReturn.t = 2; await __wait(250); await __frames(3);
  const sx = ash.x - 70 + 9, red = __hex('#c9553a'), wood = __hex('#4a3320');
  const walkRag = __near(sx, ash.y + 4, red, 12, 34), walkWood = __near(sx, ash.y + 10, wood, 12, 34), label = Render.labelBoxes().some(b => b.str === 'A CHIEF COMES UP');
  c.chiefReturn.t = 7.4; Republic.tick(0.2); await __wait(150); await __frames(3);
  const bareRag = __near(sx, ash.y + 4, red, 12, 34), bareWood = __near(sx, ash.y + 10, wood, 12, 34);
  __done(); WL.timeScale = 0.001; WL.tp('haven');
  return { walkRag, walkWood, label, bareRag, bareWood, up: Republic.chiefUp(ash) };
});
ok('THE CHIEF\'S RETURN, AS A SCENE: the mourning span passed at a live camp, a new man starts at the ring\'s edge and walks for the fire — the camp still short a chief while he walks, nothing said; at six seconds he reaches the stake and says it (He was my brother. / The fire is mine now. / Rag down. Rag on.); at seven and a half the rag comes down and the camp is whole (the mail, the lesson) with the pole standing bare beside the fire for a day, then gone; a camp taken in the span gets no scene; seen: while he walks the stake keeps its rag with A CHIEF COMES UP under the fire, after it the same pole stands bare in the same place (the wood where it was, no rag — pixel-sampled)',
  cr1.begun && cr1.edge && cr1.walking && cr1.line && cr1.whole && cr1.bareStill && cr1.bareGone && cr1.noScene && crSeen.walkRag > 10 && crSeen.label && crSeen.bareRag < crSeen.walkRag / 3 && crSeen.bareWood > 4 && Math.abs(crSeen.bareWood - crSeen.walkWood) <= crSeen.walkWood && crSeen.up,
  JSON.stringify(cr1) + ' seen=' + JSON.stringify(crSeen));

/* ================= 5 · THE SCAR ================= */
r = await ev(() => {
  const C = DATA.T.scar, HV = DATA.stations.haven;
  for (const x of S.npcs.filter(m => m.state === 'companion')) { x.state = 'pool'; x.at = 'haven'; }
  WL.tp([HV.x + 520, HV.y + 260]); S.arrow = null; S.scar = null; S.stagger = 0; S.speed = 0;
  Systems.boltIn('ridge'); WL.tp('mill'); Systems.handleDelivery('mill');   // a town's hands pull the bolt — and dress the wound, once this visit
  const scar = !!S.scar && !S.arrow && !!S.flags.tut.firstScar && S.scar.dressed === 1;
  Systems.handleDelivery('mill'); const onceAVisit = S.scar.dressed === 1;
  /* the ceiling: the wind stands at 85 until it is dressed thrice */
  WL.tp([HV.x + 520, HV.y + 260]); S.stam = S.stamMax; S.stagger = 0; Systems.update(0.1, {}); const ceiling = Math.abs(S.stam - S.stamMax * C.stamMul) < 0.5;
  UI.updateHUD(); const hud = /A SCAR · 1\/3 DRESSED/.test(document.getElementById('buffs').textContent);
  /* the medic's minute: walking with you inside reach, once a minute — their note, the trade learns */
  const med = NPC.gen({ at: 'haven', cls: 'medic' }); S.npcs.push(med); NPC.hire(med, 'companion'); med.hungry = false; med.shoveCd = 0;
  const xp0 = (med.trainXp || {}).mend || 0, lv0 = med.skills.mend || 0;
  for (let i = 0; i < 110; i++) { med.cx = S.px + 30; med.cy = S.py; S.stagger = 0; Systems.update(0.5, {}); }   // 55 s
  const notYet = S.scar.dressed === 1;
  for (let i = 0; i < 12; i++) { med.cx = S.px + 30; med.cy = S.py; S.stagger = 0; Systems.update(0.5, {}); }   // 61 s
  const minute = S.scar.dressed === 2 && /dressed the bolt's wound \(2\/3\)/.test(NPC.svc(med).last) && ((med.trainXp || {}).mend > xp0 || med.skills.mend > lv0);
  med.state = 'pool'; med.at = 'haven';
  /* a town once a visit: the next minute at a lit door, the third */
  S.time += 61; WL.tp('green'); Systems.handleDelivery('green'); const third = S.scar.dressed === 3 && Systems.dressScar('town') === false && S.scar.dressed === 3;   // thrice is the most
  WL.tp([HV.x + 520, HV.y + 260]); S.stam = S.stamMax; S.stagger = 0; Systems.update(0.1, {}); const lifted = S.stam > S.stamMax * C.stamMul + 5;
  UI.updateHUD(); const hudDone = /A SCAR · DRESSED/.test(document.getElementById('buffs').textContent);
  /* dressed, it closes in a day; undressed, late, in two */
  const t0 = S.scar.t0; S.pStats = S.pStats || {}; S.pStats.scars = [];
  S.scar.t0 = S.time - C.healDays * DATA.T.dayLen + 2; Systems.update(0.1, {}); const openStill = !!S.scar;
  S.scar.t0 = S.time - C.healDays * DATA.T.dayLen - 1; Systems.update(0.1, {});
  const healed = !S.scar && S.pStats.scars.length === 1 && S.pStats.scars[0].late === false && S.pStats.scars[0].dressed === 3 && S.pStats.scars[0].by === 'town';
  S.scar = { t0: S.time - C.healDays * DATA.T.dayLen - 1, dressed: 0, dressT: 0, by: 'self' }; Systems.update(0.1, {}); const notLate = !!S.scar;
  S.scar.t0 = S.time - C.undressedDays * DATA.T.dayLen - 1; Systems.update(0.1, {});
  const late = !S.scar && S.pStats.scars.length === 2 && S.pStats.scars[1].late === true && S.pStats.scars[1].dressed === 0;
  WL.tp('haven');
  return { scar, onceAVisit, ceiling, hud, notYet, minute, third, lifted, hudDone, openStill, healed, notLate, late };
});
ok('THE SCAR: a pulled bolt leaves a scar (the lesson) — the wind\'s ceiling stands at 85 until it is dressed; a lit town\'s hands dress it once a visit (a second hand-over the same minute does not); A SCAR · 1/3 DRESSED on the HUD; a field medic walking with you inside reach dresses it once a minute (not at 55 s; at a minute — their note, the trade learns); the next visit\'s town the third (a fourth hand refused); dressed thrice the ceiling lifts (A SCAR · DRESSED) and the scar closes in a day (written on the walk: who pulled it, dressed thrice, not late); undressed it hangs on past a day and closes late in two',
  Object.values(r).every(Boolean), JSON.stringify(r));

/* ================= 6 · THE CLICK INTO THE ROLL ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash');
  for (const cd of DATA.camps) { const c = S.camps[cd.id]; c.taken = null; c.pacified = false; c.chiefLost = 0; c.chiefReturn = null; c.swept = 0; }
  S.moveTo = null; S.route = []; WL.tp([ash.x - 400, ash.y + 1400]);
  UI.toggleMap(true); UI.drawMap();
  const m = UI.mapPoint(ash.x, ash.y);
  return { x: m.x, y: m.y + 24 };
});
const marks = r;
await page.mouse.move(marks.x + 3, marks.y); await page.waitForTimeout(150);
r = await ev(() => {
  const tip = document.getElementById('mapTip'), t = tip.textContent;
  const hover = tip.style.display === 'block' && tip.classList.contains('roll') && !tip.classList.contains('pinned') && /Ash Camp/.test(t) && ['Chief', 'Bowman', 'Ram', 'Knife'].every(n => t.includes(n)) && /the fire/.test(t) && /3 walk the road · 3 come to a storm/.test(t) && tip.querySelectorAll('.crRow img').length >= 5;
  return { hover };
});
const cl1 = r;
await page.mouse.click(marks.x, marks.y); await page.waitForTimeout(200);
r = await ev(() => {
  const tip = document.getElementById('mapTip'), tr = tip.getBoundingClientRect(), ash = DATA.camps.find(c => c.id === 'ash'), m = UI.mapPoint(ash.x, ash.y);
  const wAll = 5 * (7 * 3 + 4) - 4, mk = { l: m.x - wAll / 2, r: m.x + wAll / 2, t: m.y + 14, b: m.y + 14 + 21 + 20 };
  const beside = tr.left >= mk.r || tr.right <= mk.l;
  const pinned = tip.classList.contains('pinned') && tip.style.display === 'block' && beside && !S.moveTo && !document.getElementById('mapWrap').classList.contains('hidden');
  return { pinned, beside, tip: [Math.round(tr.left), Math.round(tr.right)], marks: [Math.round(mk.l), Math.round(mk.r)] };
});
const cl2 = r;
await page.mouse.move(marks.x + 260, marks.y + 220); await page.waitForTimeout(150);
const stays = await ev(() => { const tip = document.getElementById('mapTip'); return tip.classList.contains('pinned') && tip.style.display === 'block'; });
await page.mouse.click(marks.x + 260, marks.y + 220); await page.waitForTimeout(200);
r = await ev(() => {
  const tip = document.getElementById('mapTip');
  const letGo = tip.style.display === 'none' && !tip.classList.contains('pinned') && !S.moveTo && !document.getElementById('mapWrap').classList.contains('hidden');
  /* the gone row: the chief mourned, the roll says nobody keeps the fire */
  Republic.chiefFalls(DATA.camps.find(c => c.id === 'ash'), 'shield'); UI.drawMap();
  return { letGo };
});
const cl3 = r;
await page.mouse.move(marks.x - 3, marks.y); await page.waitForTimeout(150);
r = await ev(() => {
  const t = document.getElementById('mapTip').textContent;
  const gone = /GONE — the rag on a stake/.test(t) && /nobody keeps it/.test(t) && /2 walk the road|3 walk the road/.test(t);
  UI.toggleMap(false); S.camps.ash.chiefLost = 0;
  return { gone };
});
ok('THE CLICK INTO THE ROLL: a real mouse over a live camp\'s marks on the sheet shows the camp\'s roll — every trade with its mark, name and line, the fire\'s keeper, how many walk the road and come to a storm; a click on the marks pins it BESIDE them (clear of the marks), plans no walk and leaves the sheet open; moving away leaves it pinned; the next click anywhere lets it go and plans no walk either; with the chief mourned the roll says GONE — the rag on a stake, nobody keeps the fire',
  cl1.hover && cl2.pinned && stays && cl3.letGo && r.gone, JSON.stringify({ ...cl1, ...cl2, stays, ...cl3, ...r }));

/* ================= 7 · THE SAVE ================= */
r = await ev(() => {
  const ash = DATA.camps.find(c => c.id === 'ash'), c = S.camps.ash;
  S.scar = { t0: S.time, dressed: 2, dressT: 12, by: 'medic', lastBy: 'town' };
  c.chiefLost = 0; c.chiefReturn = null; c.stakeBare = S.time; c.chiefReturned = S.time;
  S.stations.green.madeSaid = null;
  const legN = S.legacy.filter(x => x.fact === 'town').length;
  State.save(); State.load();
  const scar = !!S.scar && S.scar.dressed === 2 && S.scar.by === 'medic';
  const stake = Republic.stakeBare(ash) && S.camps.ash.chiefReturned > 0 && Republic.chiefUp(ash);
  const stones = S.legacy.filter(x => x.fact === 'town').length === legN && legN >= 1 && Memorial.grounds().includes('town');
  S.scar = null;
  return { scar, stake, stones };
});
ok('THE SAVE: a scar mid-dressing (who pulled it, how many dressings), a chief come back with the pole bare beside his fire, and the town\'s own at THE FIELD STONES survive a save and load',
  Object.values(r).every(Boolean), JSON.stringify(r));

await ev(() => { WL.timeScale = 1; });
await T.finish('the face at the door');
