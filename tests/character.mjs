/* character.mjs — v2.0 THE CHARACTER LAYER (v3.51 rebuild, mine: the v3.48 source was lost and its record names only its
   subjects, so each check is my reading of one, tested as the game has it now; its figures sampled on the courier's grid).
   The v2.0 lesson kept: implemented and unreachable is scaffolding — every feature met from the player's chair and measured
   in the world's own step. The enlistment (New character, v3.49) by real clicks: the eight callings, the nineteen traits
   bought within budget, the stranger rolled; each calling's skills and learn rate for life, and each perk in play; the
   traits in play, virtues and burdens; the ten skills grown by their own verbs on the doubling curve, every level changing
   play, the two limits (capacity from Hauling, the wind from Endurance); a manual studied from the pack; health, food and
   warmth, and the moodles on the HUD; the gear, the charms, the consumables, junk and relics, and a ruin's themed loot; a
   waylighter hired, walking as a companion with a body of their own, and chartered as a route porter; the event director
   and a rescue; death in the light (the cairn) and in the grey (the porter-wraith, freed by a flare), the journal
   transcribed at every terminal and recovered at 70%, the walker mortal and the network not; the terrain's rules (a
   riverbank is never a cliff; only painted cliffs and deep water block); the HUD's layout; and the ★ order posted again
   after a death. Where a later version changed a v2.0 behaviour by design the current design is tested and named. The page's
   dice are seeded and held where a check needs them. */
import { boot } from './lib/harness.mjs';

const T = await boot({ start: false });
const { page, ev, ok } = T;
const clickIf = async sel => { if (!(await page.isVisible(sel).catch(() => false))) return false; await page.click(sel); await page.waitForTimeout(120); return true; };   // a sheet that is not there is evidence, not a crash

/* the page's dice, seeded before a line of the game runs (every module that took Math.random takes these), and held
   (force) where a check needs a roll to land one way */
await page.addInitScript(() => {
  let s = 0x5eed2d1b >>> 0;
  const R = { force: null, reseed(n) { s = n >>> 0; } };
  const next = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  Math.random = () => (R.force === null ? next() : typeof R.force === 'function' ? R.force() : R.force);
  window.__dice = R;
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await ev(() => localStorage.clear());
await T.instruments();

/* ================= 1 · NEW CHARACTER: THE FORM ================= */
await page.click('#btnNew'); await page.waitForTimeout(300);
await ev(() => { __dice.force = 0.37; });   // the valley made under held dice: the same ruins, stock and hands on every run
await page.click('#btnBegin'); await page.waitForTimeout(400);
await ev(() => { __dice.force = null; });
await ev(() => { __dice.force = 0.21; });   // the form opens under held dice: the same name and line on every run
await page.click('#briefGo'); await page.waitForTimeout(300);
await ev(() => { __dice.force = null; });
const readForm = () => ev(() => ({
  budget: document.getElementById('cgBudget').textContent, bad: document.getElementById('cgBudget').classList.contains('bad'),
  start: !document.getElementById('cgBegin').disabled, sel: (document.querySelector('#cgClasses .cgClass.sel') || { dataset: {} }).dataset.cls || null,
  summary: document.getElementById('cgSummary').textContent, name: document.getElementById('cgName').value, line: document.getElementById('cgLine').textContent,
  open: !document.getElementById('chargen').classList.contains('hidden'),
}));
const form = await ev(() => ({
  h2: document.querySelector('#chargen h2').textContent, stamp: document.querySelector('#chargen .docStamp').textContent,
  classes: [...document.querySelectorAll('#cgClasses [data-cls]')].map(e => ({ id: e.dataset.cls, h: e.querySelector('h5').textContent, sk: e.querySelector('.sk').textContent, pk: e.querySelector('.pk').textContent })),
  traits: [...document.querySelectorAll('#cgTraits [data-trait]')].map(e => ({ id: e.dataset.trait, name: e.querySelector('h6').textContent, cost: e.querySelector('.cost').textContent, neg: e.classList.contains('neg') })),
  locked: Object.keys(CHAR.CLASSES).filter(k => CHAR.CLASSES[k].locked),
}));
const byClass = {};
for (const cls of ['lightkeeper', 'hearthkeeper', 'drifter', 'mountaineer', 'courier']) { await page.click(`#cgClasses [data-cls="${cls}"]`); await page.waitForTimeout(60); byClass[cls] = await readForm(); }
const eight = ['courier', 'rigger', 'scavenger', 'lightkeeper', 'mountaineer', 'medic', 'hearthkeeper', 'drifter'];
ok('NEW CHARACTER, THE FORM (v3.49: the enlistment is the New character sheet): by real clicks through the title and the briefing, the form offers the eight callings — the Lamplighter locked behind the myth (v3.25) — each printing its skills and its perk; nineteen traits, nine virtues that cost and ten burdens that pay, each with its price; and the budget reads the calling clicked (Courier 0, Lightkeeper −4, Hearthkeeper +2, Drifter +6, Mountaineer −2)',
  form.h2 === 'New character' && /ENLISTMENT/.test(form.stamp) && form.classes.map(c => c.id).join() === eight.join() && form.locked.join() === 'lamplighter'
  && form.classes.find(c => c.id === 'courier').sk === 'Footwork 2 · Balance 1' && form.classes.find(c => c.id === 'drifter').sk === '—' && form.classes.every(c => c.pk.length > 20)
  && form.traits.length === 19 && form.traits.filter(t => !t.neg && /^−\d$/.test(t.cost)).length === 9 && form.traits.filter(t => t.neg && /^\+\d$/.test(t.cost)).length === 10
  && byClass.lightkeeper.budget === '-4' && byClass.lightkeeper.bad && !byClass.lightkeeper.start && byClass.hearthkeeper.budget === '2' && byClass.drifter.budget === '6' && byClass.mountaineer.budget === '-2' && byClass.courier.budget === '0' && byClass.courier.start && byClass.courier.sel === 'courier',
  JSON.stringify({ h2: form.h2, classes: form.classes.map(c => `${c.h} [${c.sk}]`), traits: form.traits.map(t => `${t.name} ${t.cost}`), byClass: Object.fromEntries(Object.entries(byClass).map(([k, v]) => [k, `${v.budget}${v.start ? '' : ' (Start shut)'}`])) }));

/* the stranger, rolled before the Walker is chosen (reported third) */
const unnamed = await readForm();
await ev(() => { __dice.force = 0.83; });   // and the reroll under other held dice
await page.click('#cgReName'); await page.waitForTimeout(80);
await ev(() => { __dice.force = null; });
const renamed = await readForm();
const rolls = [];
for (let i = 0; i < 36; i++) {   // the dice held for each roll, swept evenly across their whole range: every calling's slot is rolled
  await ev(v => { __dice.force = v; }, (i + 0.5) / 36);
  await page.click('#cgRoll'); await page.waitForTimeout(40);
  await ev(() => { __dice.force = null; });
  const f = await readForm(); rolls.push({ cls: f.summary.split(' · ')[0], sel: f.sel, budget: +f.budget, start: f.start });
}

/* ================= 2 · THE BUDGET LAW, AND ENLISTED AS CHOSEN ================= */
await page.click('#cgClasses [data-cls="medic"]'); await page.waitForTimeout(60);
for (const t of await ev(() => [...document.querySelectorAll('#cgTraits .cgTrait.sel')].map(e => e.dataset.trait))) { await page.click(`#cgTraits [data-trait="${t}"]`); await page.waitForTimeout(40); }   // the stranger's traits put back
const law = {};
law.medic = await readForm();
await page.click('#cgTraits [data-trait="packmule"]'); await page.waitForTimeout(60); law.mule = await readForm();
await page.click('#cgBegin', { force: true }); await page.waitForTimeout(200); law.refused = await readForm();
await page.click('#cgTraits [data-trait="packmule"]'); await page.waitForTimeout(60); law.unpicked = await readForm();
await page.click('#cgTraits [data-trait="quickhands"]'); await page.waitForTimeout(60); law.hands = await readForm();
await page.click('#cgTraits [data-trait="sweettooth"]'); await page.waitForTimeout(60); law.funded = await readForm();
await page.fill('#cgName', 'Tarn Kettle'); await page.waitForTimeout(60);
await page.click('#cgBegin'); await page.waitForTimeout(1200);
await T.skipCine();
await ev(() => {   // the first-sight scenes are spent: no letterbox takes a frame; the Walker's weather lines are said
  S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
});
const me = await ev(() => ({
  name: S.pName, cls: S.pClass, traits: S.pTraits, skills: Object.fromEntries(Object.entries(S.skills).filter(([, v]) => v.lv).map(([k, v]) => [k, v.lv])), xp: Object.values(S.skills).reduce((a, v) => a + v.total, 0),
  pack: S.cargo.map(c => c.defId), equip: Object.fromEntries(Object.entries(S.equip).map(([k, v]) => [k, v ? v.defId : null])), form: !document.getElementById('chargen').classList.contains('hidden'),
}));
ok('THE BUDGET LAW, AND ENLISTED AS CHOSEN: a virtue clicked spends the budget (Pack Mule −6: the budget red, Start shut, and a click on it enlists nobody), clicked again it is put back; a burden pays for a virtue (Quick Hands −3, then Sweet Tooth +3 → 0, Start open); a real click on Start walks in exactly the Walker built — the typed name, the Field Medic, Quick Hands and Sweet Tooth, the calling\'s skills at their levels (Mending 2, Hearthcraft 1) and nothing learned yet, a ration, a bandage and vol. I of the calling\'s first skill on the back, the worn boots, the cloak and the standard frame',
  law.medic.budget === '0' && law.mule.budget === '-6' && law.mule.bad && !law.mule.start && law.refused.open && law.unpicked.budget === '0' && law.hands.budget === '-3' && !law.hands.start && law.funded.budget === '0' && law.funded.start
  && !me.form && me.name === 'Tarn Kettle' && me.cls === 'medic' && me.traits.join() === 'quickhands,sweettooth' && JSON.stringify(me.skills) === '{"mend":2,"hearth":1}' && me.xp === 0
  && me.pack.join() === 'ration,bandage,man_mend1' && me.equip.boots === 'boots0' && me.equip.coat === 'coat0' && me.equip.pack === 'pack0' && me.equip.charm === null,
  JSON.stringify({ law: Object.fromEntries(Object.entries(law).map(([k, v]) => [k, `${v.budget}${v.start ? '' : ' shut'}${v.open ? '' : ' closed'}`])), me }));

/* ================= 3 · THE STRANGER ================= */
const lamp = rolls.findIndex(r => r.cls === 'Lamplighter');
ok('THE STRANGER: the reroll gives the Walker a new name and a new line, and Randomize rolls a whole stranger — thirty-six rolls, the dice swept across their whole range, every one within budget with Start open, and every one a calling the form offers (a fresh valley has not earned the Lamplighter)',
  renamed.name !== unnamed.name && renamed.line !== unnamed.line && renamed.name.length > 3 && rolls.length === 36 && rolls.every(r => r.budget >= 0 && r.start) && rolls.every(r => eight.includes(r.sel) && r.cls !== 'Lamplighter'),
  JSON.stringify({ renamed: { from: unnamed.name, to: renamed.name, line: renamed.line }, firstLamplighter: lamp >= 0 ? { roll: lamp + 1, ...rolls[lamp] } : null, rolled: rolls.map(r => r.cls).join(', ') }));

/* the instruments of the walk: the world stepped here, frame by frame, the live clock held */
await ev(() => {
  WL.timeScale = 1e-9;
  S.weather = { state: 'clear', t: 99999, intensity: 0 }; S.eventCd = 99999;   // no weather turns and no road events mid-measure
  for (const id of ['elm', 'mill']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true);
  window.__in = (o = {}) => ({ up: false, down: false, left: false, right: false, shift: false, space: false, ml: false, mr: false, mouse: null, ...o });
  window.__vit = () => { S.health = 100; S.bleeding = false; S.bruisedT = 0; S.warmth = 100; S.food = 100; S.state = 'walk'; S.stagger = 0; S.qte = null; S.struggle = null; S.moveTo = null; S.route = []; S.buffs = {}; S.warmT = 0; S.stam = S.stamMax; S.speed = 0; };
  window.__clean = () => { for (const c of [...S.cargo]) if (c.cat !== 'tool') State.removeCargo(c.id); };
  window.__toasts = []; new MutationObserver(ms => { for (const m of ms) for (const n2 of m.addedNodes) if (n2.textContent) __toasts.push(n2.textContent); }).observe(document.getElementById('toasts'), { childList: true });
  window.__settle = async () => { S.time += 0.12; await __wait(160); await __frames(2); };
  window.__shut = () => { UI.queueResults([], null); UI.closeAllModals(); document.getElementById('deathOv').classList.add('hidden'); S.state = 'walk'; S.struggle = null; S.qte = null; S.handover = null; UI.showQTE(false); UI.showStruggle(false); };   // every sheet shut and the slips drained: a real key reaches the world
  window.__marks = () => [...document.querySelectorAll('#compassInner .cMark')].map(m => m.title);
  window.__netSnap = () => ({ stations: DATA.stationOrder.map(id => `${id}:${S.stations[id].connected ? 1 : 0}:${S.stations[id].stars}:${Math.round(S.stations[id].likesTo)}`).join(' '), structures: S.structures.length, bank: JSON.stringify(Object.fromEntries(Object.entries(S.banked).map(([k, v]) => [k, Math.round(v)]))), likes: S.likes, routes: S.npcs.filter(n => n.state === 'route').map(n => n.name).join(), bonded: S.npcs.filter(n => n.bond).map(n => `${n.name}@${n.at}`).join(), ladder: !!window.__LAD && S.structures.includes(__LAD) });
  window.__open = (x, y, r0 = 0) => { for (let r = r0; r < 900; r += 20) for (let a = 0; a < 6.28; a += 0.3) { const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r, t = World.terrainAt(px, py); if (!t.blocked && !t.water && t.slope < 0.2) return [px, py]; } return [x, y]; };
  /* the enlisted Walker, kept: every calling staged below is a walker of its own, and this one comes back */
  window.__me = { name: S.pName, cls: S.pClass, traits: [...S.pTraits], seed: S.pSeed, line: S.pLine, skills: JSON.parse(JSON.stringify(S.skills)), cargo: S.cargo.slice(), look: S.look ? { ...S.look } : null };
  window.__restore = () => { Porter.applyToState({ name: __me.name, cls: __me.cls, traits: [...__me.traits], skills: JSON.parse(JSON.stringify(__me.skills)), seed: __me.seed, line: __me.line }); S.look = __me.look; for (const c of __me.cargo) if (!S.cargo.includes(c)) S.cargo.push(c); UI.refreshCargo(); Porter.dirty(); };
  /* a walker of a calling, traits and levels of the check's choosing — the same body otherwise */
  window.__as = (cls, traits = [], lv = {}) => { __shut(); Porter.applyToState(Porter.generate({ cls, traits: [...traits], name: S.pName })); for (const [k, v] of Object.entries(lv)) S.skills[k].lv = v; S.stamMax = DATA.T.baseStam; __vit(); Porter.dirty(); UI.refreshCargo(); };
  /* a load of whole crates to a share of what the back holds */
  window.__load = share => { __clean(); while (State.weight() + 9 <= State.cap() * share) State.addCargo(State.makeItem('textiles')); };
  /* THE WOBBLE'S RATE, read off the world's own step: on marsh at a sane load, one tenth of a second walked with every die
     held at v — the load wobbles iff v falls under the step's chance; bisected, the chance itself */
  window.__marsh = (() => { const H = DATA.stations.haven; for (let r = 300; r < 4000; r += 30) for (let a = 0; a < 6.28; a += 0.12) { const x = H.x + Math.cos(a) * r, y = H.y + Math.sin(a) * r; let good = true; for (const [dx, dy] of [[0, 0], [12, 0], [-12, 0], [0, 12], [0, -12], [24, 0]]) { const t = World.terrainAt(x + dx, y + dy); if (t.cls !== World.MARSH || t.slope > 0.25 || t.water || t.blocked) good = false; } if (good && World.mistAt(x, y) < 0.5 && !DATA.stationOrder.some(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) < 400)) return [x, y]; } return null; })();
  window.__wobble = () => {
    const P = __marsh, calm = S.flags.calm; S.flags.calm = false;
    const trial = v => {
      S.px = P[0]; S.py = P[1]; S.dir = 0; S.qte = null; S.stagger = 0; S.stam = S.stamMax; S.speed = 0; S.moveTo = null; S.braced = false; S.sprinting = false;
      const st0 = S.stats.steadies;
      __dice.force = v; try { Systems.update(0.1, __in({ right: true })); } finally { __dice.force = null; }
      const fired = S.stats.steadies > st0 || !!S.qte; S.qte = null; UI.showQTE(false); return fired;
    };
    let lo = 0, hi = 0.5;
    for (let i = 0; i < 34; i++) { const mid = (lo + hi) / 2; if (trial(mid)) lo = mid; else hi = mid; }
    S.flags.calm = calm; S.px = P[0]; S.py = P[1];
    return (lo + hi) / 2;
  };
  /* the wind spent or won in `secs` of the world's own step, standing or walking as asked */
  window.__wind = (secs, input, from) => { if (from !== undefined) S.stam = from; const s0 = S.stam; for (let _i = 0, t = 0; _i < Math.round((secs - 1e-9) * 10); _i++, t += 0.1) Systems.update(0.1, __in(input || {})); return +(S.stam - s0).toFixed(3); };
});

/* ================= 4 · THE CALLINGS ================= */
await page.keyboard.press('KeyK'); await page.waitForTimeout(250);
const sheet = await ev(() => ({ open: !document.getElementById('skillsOv').classList.contains('hidden'), rows: [...document.querySelectorAll('#skillsBody .skillRow h4')].slice(0, 10).map(h => h.textContent.replace(/\s+/g, ' ').trim()), sub: document.getElementById('skillsSub').textContent }));
await page.keyboard.press('KeyK'); await page.waitForTimeout(150);
const callings = await ev(() => {
  const out = {};
  for (const cls of ['courier', 'rigger', 'scavenger', 'lightkeeper', 'mountaineer', 'medic', 'hearthkeeper', 'drifter']) {
    __as(cls);
    const lv = Object.fromEntries(Object.entries(S.skills).filter(([, v]) => v.lv).map(([k, v]) => [k, v.lv]));
    const learned = {};
    for (const id of CHAR.SKILL_IDS) { const t0 = S.skills[id].total; Porter.xp(id, 10); learned[id] = +(S.skills[id].total - t0).toFixed(2); }
    out[cls] = { lv, learned, pts: CHAR.CLASSES[cls].pts };
  }
  __restore();
  return out;
});
const CHAR_IDS = ['foot', 'bal', 'end', 'haul', 'rig', 'sal', 'lum', 'climb', 'mend', 'hearth'];
const learnOk = Object.entries(callings).every(([cls, c]) => CHAR_IDS.every(id => { const L = c.lv[id] || 0, want = 10 * (L >= 2 ? 2 : L === 1 ? 1.5 : 1) * (cls === 'drifter' ? 1.15 : 1); return Math.abs(c.learned[id] - want) < 1e-6; }));
ok('THE CALLINGS: each of the eight starts with its skills at their levels (Courier Footwork 2 · Balance 1, Rigger Rigging 2 · Salvage 1, Scavenger Salvage 2 · Footwork 1, Lightkeeper Lumenistry 2 · Mending 1, Mountaineer Climbing 2 · Endurance 1, Field Medic Mending 2 · Hearthcraft 1, Hearthkeeper Hearthcraft 2 · Mending 1, the Drifter none) and learns them faster for life — the same ten points of work land ×2 in a level-2 calling, ×1.5 in a level-1, ×1 elsewhere, and ×1.15 in everything for the Drifter; a real K opens the body\'s ledger with the callings marked (CALLING ×2, CALLING ×1.5)',
  JSON.stringify(callings.courier.lv) === '{"foot":2,"bal":1}' && JSON.stringify(callings.rigger.lv) === '{"rig":2,"sal":1}' && JSON.stringify(callings.scavenger.lv) === '{"foot":1,"sal":2}' && JSON.stringify(callings.lightkeeper.lv) === '{"lum":2,"mend":1}'
  && JSON.stringify(callings.mountaineer.lv) === '{"end":1,"climb":2}' && JSON.stringify(callings.medic.lv) === '{"mend":2,"hearth":1}' && JSON.stringify(callings.hearthkeeper.lv) === '{"mend":1,"hearth":2}' && JSON.stringify(callings.drifter.lv) === '{}' && learnOk
  && sheet.open && sheet.rows.length === 10 && sheet.rows.some(r => /^\+?\s*Mending CALLING ×2/.test(r) || /Mending CALLING ×2/.test(r)) && sheet.rows.some(r => /Hearthcraft CALLING ×1\.5/.test(r)) && sheet.rows.filter(r => /CALLING/.test(r)).length === 2,
  JSON.stringify({ sheet, callings: Object.fromEntries(Object.entries(callings).map(([k, v]) => [k, { lv: v.lv, learned: Object.entries(v.learned).filter(([, x]) => x !== 10).map(([s2, x]) => `${s2} ${x}`).join(' · ') || 'all 10' }])) }));

/* ================= 5 · THE COURIER'S SECOND WIND ================= */
const wind = {};
for (const who of ['courier', 'scavenger']) {
  await ev(who => {
    __as(who); __clean(); S.orders.active.length = 0;
    S.stations.elm.stock.tools = 40;   // Elm short of tools again: the card is on Haven's board
    WL.tp('haven'); const b = Systems.boardFor('haven').find(x => !x.prio && x.def.item === 'tools' && x.def.to === 'elm'); Systems.acceptOrder(b.def, false);
    WL.tp('elm'); S.stam = 20;
  }, who);
  await page.keyboard.press('KeyE'); await page.waitForTimeout(60);
  wind[who + 'Delivers'] = await ev(async () => { const s = +S.stam.toFixed(2), h = !!S.handover; WL.skipHandover(); await __wait(100); for (const id of ['results', 'stationOv']) document.getElementById(id).classList.add('hidden'); return { stam: s, handover: h }; });
}
await ev(() => { __as('courier'); __clean(); S.orders.active.length = 0; WL.tp('haven'); S.stam = 20; });
await page.keyboard.press('KeyE'); await page.waitForTimeout(80);
wind.courierReaches = await ev(() => { const out = { stam: +S.stam.toFixed(2), sheet: !document.getElementById('stationOv').classList.contains('hidden'), handover: !!S.handover }; UI.closeStation(); return out; });
ok('THE COURIER\'S SECOND WIND ("reaching any terminal restores 25% stamina"): a Courier handing a crate over at Elm Farm\'s terminal is a quarter of the wind fuller on the spot (a Scavenger\'s wind does not move) — and a Courier reaching Haven\'s terminal with nothing to hand over, E opening the terminal, gets the same quarter',
  wind.courierDelivers.handover && Math.abs(wind.courierDelivers.stam - 45) < 0.01 && wind.scavengerDelivers.handover && Math.abs(wind.scavengerDelivers.stam - 20) < 0.01 && wind.courierReaches.sheet && Math.abs(wind.courierReaches.stam - 45) < 0.01,
  JSON.stringify(wind));

/* the ground the next checks stand on: a real ladder over a real gap (laid as a player lays one), a stretch of the grey
   where the rain eats cargo and no wraith rises, a cold ford out of the light */
const grounds = await ev(() => {
  __as('courier'); __clean();
  const H = DATA.stations.haven, SP = DATA.structures.ladder.span, hl = SP / 2;
  let lad = null;
  for (let rr = 150; rr < 6000 && !lad; rr += 40) for (let a = 0; a < 6.28 && !lad; a += 0.09) {
    const x = H.x + Math.cos(a) * rr, y = H.y + Math.sin(a) * rr, t = World.terrainAt(x, y);
    if (!t.blocked) continue;   // deep water or a cliff: a real gap
    for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (lad) break;
      let bank = null;
      for (let d = 12; d < 90; d += 6) { const t2 = World.terrainAt(x - ux * d, y - uy * d); if (!t2.blocked && !t2.water) { bank = [x - ux * (d + 20), y - uy * (d + 20)]; break; } }
      if (!bank || DATA.camps.some(c => U.dist(bank[0], bank[1], c.x, c.y) < c.r + 200) || World.mistAt(bank[0], bank[1]) > 0.5) continue;
      S.px = bank[0]; S.py = bank[1]; S.dir = Math.atan2(uy, ux);
      if (!State.countTool('ladder')) State.addCargo(State.makeItem('ladderTool'));
      const n0 = S.structures.length, okB = Systems.tryBuild('ladder');
      const st = okB && S.structures[S.structures.length - 1];
      if (!st || S.structures.length !== n0 + 1) continue;
      if (st.flat) { S.structures.pop(); continue; }   // a wadeable creek is not the test: the rungs must climb a wall
      lad = st;
    }
  }
  window.__LAD = lad;
  let grey = null;
  for (let i = 0; i < 40000 && !grey; i++) { const x = 400 + ((i * 7919) % (World.W - 800)), y = 3000 + ((i * 104729) % 7000), t = World.terrainAt(x, y), m = World.mistAt(x, y); if (!t.blocked && !t.water && m > 0.35 && m < 0.55 && !DATA.stationOrder.some(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) < 400) && !DATA.camps.some(c => U.dist(x, y, c.x, c.y) < c.r + 100)) grey = [x, y]; }
  window.__GREY = grey;
  let ford = null;
  for (let i = 0; i < 60000 && !ford; i++) { const x = 400 + ((i * 7919) % (World.W - 800)), y = 3000 + ((i * 104729) % 7800), t = World.terrainAt(x, y); if (t.cls === World.SHALLOW && World.terrainAt(x + 8, y).cls === World.SHALLOW && World.lightAt(x, y) < 0.1 && World.mistAt(x, y) < 0.55 && World.mistAt(x, y) > 0.1 && !DATA.stationOrder.some(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) < 400) && !DATA.camps.some(c => U.dist(x, y, c.x, c.y) < c.r + 100)) ford = [x, y]; }
  window.__FORD = ford;
  __clean(); WL.tp('haven');
  return { lad: lad && { x: Math.round(lad.x), y: Math.round(lad.y), flat: lad.flat, ang: +lad.ang.toFixed(2) }, grey, ford, marsh: __marsh };
});

/* ================= 6 · THE OTHER PERKS, IN PLAY ================= */
const perks = await ev(async () => {
  const out = {};
  /* the Rigger's sound joints: a generator raised from a kit inside the light, paid off the bank */
  const build = cls => { __as(cls); S.banked.metal = 70; State.addCargo(State.makeItem('kitTool')); const H = DATA.stations.haven; S.px = H.x + 260; S.py = H.y - 40; const m0 = S.banked.metal, n0 = S.structures.length, okB = Systems.tryBuild('generator'); const paid = m0 - S.banked.metal; if (S.structures.length > n0) S.structures.pop(); return { ok: okB, paid }; };
  out.build = { courier: build('courier'), rigger: build('rigger'), cost: DATA.structures.generator.cost.metal };
  /* the Scavenger's scrap-sense: a scrap pile a few hundred paces off pings the compass */
  const sense = async cls => { __as(cls); WL.tp(__open(DATA.stations.haven.x + 600, DATA.stations.haven.y + 300)); const node = { id: U.uid(), type: 'metal', x: S.px + 260, y: S.py - 200, qty: 12, taken: false }; S.nodes.push(node); await __settle(); const n = __marks().filter(t => /^scrap /.test(t)).length; S.nodes.splice(S.nodes.indexOf(node), 1); return n; };
  out.sense = { courier: await sense('courier'), scavenger: await sense('scavenger') };
  WL.tp('haven');
  return out;
});
const flare = {};
for (const who of ['courier', 'lightkeeper']) {
  await ev(who => { __as(who); S.gear.flares = 1; S.flareCd = 0; S.wraiths.length = 0; S.wraiths.push({ id: U.uid(), x: S.px + 600, y: S.py, alert: 0, state: 'drift', cd: 0, ph: 0 }); window.__n0 = S.nodes.length; window.__l0 = S.skills.lum.total; }, who);
  await page.keyboard.press('KeyF'); await page.waitForTimeout(80);
  flare[who] = await ev(() => { const out = { burned: S.nodes.length - __n0, lumXp: +(S.skills.lum.total - __l0).toFixed(1), flares: S.gear.flares, reach: Math.round(500 * Porter.eff().flareR) }; S.nodes.length = __n0; S.wraiths.length = 0; return out; });
}
const perks2 = await ev(async () => {
  const out = {};
  /* the Lightkeeper's kept flame in the mist: ten seconds of greyfall on a crate of medicine */
  const rot = cls => { __as(cls); __clean(); const it = State.makeItem('meds'); State.addCargo(it); S.px = __GREY[0]; S.py = __GREY[1]; S.weather = { state: 'grey', t: 99999, intensity: 0.8 }; for (let _i = 0, t = 0; _i < Math.round((10) * 10); _i++, t += 0.1) { Systems.update(0.1, __in()); S.wraiths.length = 0; } S.weather = { state: 'clear', t: 99999, intensity: 0 }; const lost = 100 - it.cond; __clean(); return +lost.toFixed(3); };
  out.rot = { courier: rot('courier'), lightkeeper: rot('lightkeeper') };
  /* the Mountaineer's ridge-born legs: the pace on a laid ladder's rungs, walked at the far end */
  const L = __LAD, c = Math.cos(L.ang), s2 = Math.sin(L.ang), far = { x: L.x + c * 200, y: L.y + s2 * 200 };
  const climb = cls => { __as(cls); __clean(); S.px = L.x - c * 40; S.py = L.y - s2 * 40; const on0 = !!Systems.crossingAt(S.px, S.py); const x0 = S.px, y0 = S.py; for (let _i = 0, t = 0; _i < Math.round((0.6) * 10); _i++, t += 0.1) Systems.update(0.1, __in({ ml: true, mouse: far })); const on1 = !!Systems.crossingAt(S.px, S.py); return { pace: +(U.dist(x0, y0, S.px, S.py) / 0.6).toFixed(1), on: on0 && on1 }; };
  out.climb = { courier: climb('courier'), mountaineer: climb('mountaineer') };
  WL.tp('haven');
  return out;
});
/* the Field Medic's steady hands: a bandage used from the pack by a real click */
const mend = {};
for (const who of ['courier', 'medic']) {
  await ev(who => { __as(who); __clean(); State.addCargo(State.makeItem('bandage')); S.health = 50; S.bleeding = true; UI.toggleCargo(true); }, who);
  await page.click(`#cargoList [data-use="${await ev(() => S.cargo.find(c => c.defId === 'bandage').id)}"]`); await page.waitForTimeout(100);
  mend[who] = await ev(() => { const out = { healed: +(S.health - 50).toFixed(2), bleeding: S.bleeding }; UI.toggleCargo(false); return out; });
}
/* the Hearthkeeper's open table: a warm meal eaten by a real click, and a companion's meal from the bank */
const table = {};
for (const who of ['courier', 'hearthkeeper']) {
  await ev(who => { __as(who); __clean(); State.addCargo(State.makeItem('warmmeal')); S.food = 40; UI.toggleCargo(true); }, who);
  await page.click(`#cargoList [data-eat="${await ev(() => S.cargo.find(c => c.defId === 'warmmeal').id)}"]`); await page.waitForTimeout(100);
  table[who] = await ev(() => {
    const out = { wellfed: Math.round(S.buffs.wellfed || 0), warmed: Math.round(S.buffs.warmed || 0) };
    UI.toggleCargo(false);
    S.banked.provisions = 20;
    const n = NPC.gen({ at: 'haven', cls: 'courier' }); S.npcs.push(n); n.state = 'companion'; n.cx = S.px + 30; n.cy = S.py + 20; n.fedT = 0;
    const p0 = S.banked.provisions; NPC.update(0.01);
    out.companion = { ate: +(p0 - S.banked.provisions).toFixed(2), nextMealIn: Math.round(n.fedT) };
    S.npcs.splice(S.npcs.indexOf(n), 1);
    return out;
  });
}
ok('THE OTHER PERKS, IN PLAY: the Rigger\'s sound joints (a generator from the same kit takes a quarter less off the bank), the Scavenger\'s scrap-sense (a scrap pile a few hundred paces off pings the compass — for a Courier it does not), the Lightkeeper\'s kept flame (a real F burns a wraith six hundred paces out that the Courier\'s flare cannot reach, and a crate of medicine rots in the greyfall a quarter slower, less again for the calling\'s Lumenistry), the Mountaineer\'s ridge-born legs (a laid ladder\'s rungs climbed at walking pace, the Courier\'s at under half), the Field Medic\'s steady hands (a bandage used from the pack by a real click mends half again), and the Hearthkeeper\'s open table (a warm meal eaten by a real click lasts twice as long and more, and a companion eats 30% less — the bank\'s provision lasting them longer)',
  perks.build.courier.ok && perks.build.rigger.ok && perks.build.courier.paid === perks.build.cost && perks.build.rigger.paid === Math.round(perks.build.cost * 0.94 * 0.8)
  && perks.sense.courier === 0 && perks.sense.scavenger >= 1
  && flare.courier.flares === 0 && flare.lightkeeper.flares === 0 && flare.courier.burned === 0 && flare.lightkeeper.burned === 1 && flare.lightkeeper.reach > 600 && flare.courier.reach < 600
  && perks2.rot.courier > 0.5 && Math.abs(perks2.rot.lightkeeper / perks2.rot.courier - 0.92 * 0.75) < 0.01
  && perks2.climb.courier.on && perks2.climb.mountaineer.on && perks2.climb.mountaineer.pace > 90 && perks2.climb.courier.pace < 50
  && Math.abs(mend.courier.healed - 10) < 0.01 && Math.abs(mend.medic.healed - 10 * 1.16 * 1.5) < 0.01 && !mend.medic.bleeding
  && table.courier.wellfed === 360 && table.hearthkeeper.wellfed === Math.round(360 * 1.18 * 2) && table.courier.companion.ate === 1 && table.hearthkeeper.companion.ate === 1 && table.hearthkeeper.companion.nextMealIn > table.courier.companion.nextMealIn * 1.3,
  JSON.stringify({ grounds, ...perks, flare, ...perks2, mend, table }));

/* ================= 7 · THE VIRTUES, IN PLAY ================= */
await ev(() => {
  /* the load readout on the HUD, for a walker of these traits */
  window.__loadLine = traits => { __as('courier', traits); UI.updateHUD(); return document.getElementById('weightNum').textContent; };
  /* the wind spent sprinting one second, from full, along the same ground */
  window.__sprint = traits => { __as('courier', traits); const H = DATA.stations.haven; S.px = H.x + 520; S.py = H.y + 260; S.dir = 0; return __wind(1, { right: true, shift: true }, 100); };
  /* the cold at the ford, three seconds of a greyfall night standing in the water */
  window.__cold = traits => { __as('courier', traits); S.px = __FORD[0]; S.py = __FORD[1]; S.weather = { state: 'grey', t: 99999, intensity: 0.8 }; const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.8; const w0 = S.warmth; for (let _i = 0, t = 0; _i < Math.round((3 - 1e-9) * 10); _i++, t += 0.1) { Systems.update(0.1, __in()); S.wraiths.length = 0; } const lost = w0 - S.warmth; S.weather = { state: 'clear', t: 99999, intensity: 0 }; S.time = Math.floor(S.time / DL) * DL + DL * 0.3; return +lost.toFixed(3); };
  /* how much a wraith two hundred paces off in the grey notices one tenth of a second of the Walker's steps */
  window.__noticed = traits => { __as('courier', traits); S.px = __GREY[0]; S.py = __GREY[1]; S.dir = 0; let wx = null; for (let a = 0; a < 6.28 && !wx; a += 0.2) { const x = S.px + Math.cos(a) * 200, y = S.py + Math.sin(a) * 200, t = World.terrainAt(x, y); if (!t.blocked && World.mistAt(x, y) > 0.34) wx = [x, y]; } S.wraiths.length = 0; const w = { id: U.uid(), x: wx[0], y: wx[1], alert: 0, state: 'drift', cd: 0, ph: 0 }; S.wraiths.push(w); Systems.update(0.1, __in({ right: true })); const a = w.alert; S.wraiths.length = 0; return +a.toFixed(6); };
});
const virtues = await ev(() => {
  const out = {};
  out.load = { plain: __loadLine([]), mule: __loadLine(['packmule']) };
  __as('courier'); __load(0.6); const w0 = __wobble(); __as('courier', ['surefoot']); __load(0.6); const w1 = __wobble(); out.wobble = { plain: +w0.toFixed(6), surefoot: +w1.toFixed(6) };
  out.sprint = { plain: __sprint([]), ironlungs: __sprint(['ironlungs']) };
  out.cold = { plain: __cold([]), warmblood: __cold(['warmblood']) };
  out.noticed = { plain: __noticed([]), greytouched: __noticed(['greytouched']) };
  WL.tp('haven');
  return out;
});
for (const who of [[], ['quickhands']]) {
  await ev(t => { __as('courier', t); State.addCargo(State.makeItem('bandage')); S.health = 50; S.bleeding = true; UI.toggleCargo(true); }, who);
  await page.click(`#cargoList [data-use="${await ev(() => S.cargo.find(c => c.defId === 'bandage').id)}"]`); await page.waitForTimeout(100);
  virtues[who.length ? 'quickhands' : 'bandage'] = await ev(() => { const h = +(S.health - 50).toFixed(2); UI.toggleCargo(false); return h; });
}
ok('THE VIRTUES, IN PLAY: Pack Mule carries ten kilos more on the HUD\'s load line; Sure-Footed wobbles a quarter less often on the same marsh at the same load (the step\'s own chance, read off the world\'s step); Iron Lungs spends 15% less wind on the same sprint; Warm Blood loses less warmth standing in the same ford on a greyfall night; Grey-Touched is noticed 30% slower by the same wraith; Quick Hands makes the same bandage mend 30% more',
  virtues.load.plain === '0.0 / 55 kg' && virtues.load.mule === '0.0 / 65 kg' && Math.abs(virtues.wobble.surefoot / virtues.wobble.plain - 0.75) < 0.002
  && virtues.sprint.plain < -5 && Math.abs(virtues.sprint.ironlungs / virtues.sprint.plain - 0.85) < 0.005
  && virtues.cold.plain > 2 && Math.abs((virtues.cold.plain - virtues.cold.warmblood) - 0.3 * 1.1 * 3) < 0.05
  && virtues.noticed.plain > 0 && Math.abs(virtues.noticed.greytouched / virtues.noticed.plain - 0.7) < 0.005
  && Math.abs(virtues.bandage - 10) < 0.01 && Math.abs(virtues.quickhands - 13) < 0.01,
  JSON.stringify(virtues));

/* ================= 8 · THE BURDENS, IN PLAY ================= */
const burdens = await ev(async () => {
  const out = {};
  out.load = { badback: __loadLine(['badback']) };
  __as('courier'); __load(0.6); const w0 = __wobble(); __as('courier', ['weakknees']); __load(0.6); const w1 = __wobble(); out.wobble = { plain: +w0.toFixed(6), weakknees: +w1.toFixed(6) };
  const rest = traits => { __as('courier', traits); const H = DATA.stations.haven; S.px = H.x + 520; S.py = H.y + 260; return __wind(1, {}, 50); };
  out.rest = { plain: rest([]), asthmatic: rest(['asthmatic']) };
  /* a stumble with the dice at 0.6: the plain crate is knocked, the clumsy one falls */
  const trip = traits => { __as('courier', traits); const H = DATA.stations.haven; S.px = H.x + 520; S.py = H.y + 260; State.addCargo(State.makeItem('textiles')); const d0 = S.drops.length; __dice.force = 0.6; try { S.qte = { t: 5, dur: 1 }; Systems.update(0.016, __in()); } finally { __dice.force = null; } const fell = S.drops.length - d0; if (fell) S.drops.length = d0; return fell; };
  out.trip = { plain: trip([]), clumsy: trip(['clumsy']) };
  const hunger = traits => { __as('courier', traits); const H = DATA.stations.haven; S.px = H.x + 520; S.py = H.y + 260; S.food = 80; for (let _i = 0, t = 0; _i < Math.round((10 - 1e-9) * 10); _i++, t += 0.1) Systems.update(0.1, __in()); return +(80 - S.food).toFixed(3); };
  out.food = { plain: hunger([]), sweettooth: hunger(['sweettooth']) };
  const wade = traits => { __as('courier', traits); S.px = __FORD[0]; S.py = __FORD[1]; S.dir = 0; const inWater = World.terrainAt(S.px, S.py).water; const d = __wind(0.2, { right: true }, 100); return { spent: d, inWater: inWater && World.terrainAt(S.px, S.py).water }; };
  out.wade = { plain: wade([]), fearwater: wade(['fearwater']) };
  out.noticed = { plain: __noticed([]), greymarked: __noticed(['greymarked']) };
  /* a cairn a long walk off: on the strip, unless the eyes lose it */
  const far = async traits => { __as('courier', traits); WL.tp('haven'); const g = { id: U.uid(), x: S.px + 2500, y: S.py - 300, name: 'Old Tam', cls: 'courier', seed: 7, items: [], flares: 0, journal: null, wraith: false, respected: false, ph: 0 }; S.graves.push(g); await __settle(); const seen = __marks().some(t => /^cairn 2\.5 km$/.test(t)); S.graves.splice(S.graves.indexOf(g), 1); return seen; };
  out.far = { plain: await far([]), shortsight: await far(['shortsight']) };
  WL.tp('haven');
  return out;
});
for (const who of [[], ['loner']]) {
  await ev(t => { __as('courier', t); WL.tp('haven'); UI.openStation('haven'); }, who);
  await page.click('#stationTabs [data-tab="way"]'); await page.waitForTimeout(150);
  burdens[who.length ? 'loner' : 'fee'] = await ev(() => { const b = document.querySelector('#stationBody [data-hirec]'); const t = b ? b.textContent : null; UI.closeStation(); return t; });
}
ok('THE BURDENS, IN PLAY: Bad Back carries eight kilos less on the HUD\'s load line; Weak Knees wobbles a quarter more often; Asthmatic wins back 20% less wind standing; Clumsy drops the crate a stumble only knocks for anyone else (the same dice); Sweet Tooth eats through food 30% faster; Fear of Water spends twice the wind wading the same ford; Grey-Marked is noticed 30% faster; Short-Sighted loses a cairn two and a half kilometres off the compass that other eyes keep; and a Loner is asked half again the fee on the Hire tab, read by real clicks',
  burdens.load.badback === '0.0 / 47 kg' && Math.abs(burdens.wobble.weakknees / burdens.wobble.plain - 1.25) < 0.002
  && burdens.rest.plain > 5 && Math.abs(burdens.rest.asthmatic / burdens.rest.plain - 0.8) < 0.005 && burdens.trip.plain === 0 && burdens.trip.clumsy === 1
  && Math.abs(burdens.food.sweettooth / burdens.food.plain - 1.3) < 0.005 && burdens.wade.plain.inWater && burdens.wade.fearwater.inWater && Math.abs(burdens.wade.fearwater.spent / burdens.wade.plain.spent - 2) < 0.1
  && Math.abs(burdens.noticed.greymarked / burdens.noticed.plain - 1.3) < 0.005 && burdens.far.plain && !burdens.far.shortsight
  && /^Companion · 20 metal \+ 8 ceramic$/.test(burdens.fee) && /^Companion · 30 metal \+ 12 ceramic$/.test(burdens.loner),
  JSON.stringify(burdens));

/* ================= 9 · THE LUNGS, THE REST, THE EYES AND THE LUCK ================= */
const four = await ev(async () => {
  const out = {};
  /* the wind a body holds: standing in the light until it will take no more */
  const ceiling = traits => { __as('courier', traits); const H = DATA.stations.haven; S.px = H.x + 520; S.py = H.y + 260; S.stam = 80; for (let _i = 0, t = 0; _i < Math.round((6) * 10); _i++, t += 0.1) Systems.update(0.1, __in()); return +S.stam.toFixed(2); };
  out.wind = { plain: ceiling([]), deeplungs: ceiling(['deeplungs']) };
  /* a station's rest: one second standing in Haven's yard */
  const rest = traits => { __as('courier', traits); WL.tp('haven'); return __wind(1, {}, 20); };
  out.rest = { plain: rest([]), restless: rest(['restless']) };
  /* the horizon: a collapsed cottage eight hundred and fifty paces off (the compass shows a ruin within seven hundred) */
  const eyes = async traits => { __as('courier', traits); WL.tp(__open(DATA.stations.haven.x + 600, DATA.stations.haven.y + 300)); const rn = { id: U.uid(), type: 'cottage', x: S.px + 850, y: S.py - 40, looted: false, seed: 11 }; S.ruins.push(rn); await __settle(); const seen = __marks().some(t => t === 'ruin 851 m'); S.ruins.splice(S.ruins.indexOf(rn), 1); return seen; };
  out.eyes = { plain: await eyes([]), keeneyes: await eyes(['keeneyes']) };
  /* the luck: a supply drop cracked open and a collapsed cottage searched, under the same dice for both walkers */
  const drop = traits => { __as('courier', traits); S.event = { id: U.uid(), type: 'supplyDrop', x: S.px + 20, y: S.py, t: 150, data: {} }; const act = Systems.getInteractions().find(i => /supply drop/.test(i.label)); let k = 0; __dice.force = () => (k++ % 2 ? 0.35 : 0.9); try { act.fn(); } finally { __dice.force = null; } const got = S.cargo.filter(c => c.cat !== 'tool').map(c => c.defId); S.event = null; return got; };
  out.drop = { plain: drop([]), luckyfind: drop(['luckyfind']) };
  const W = t => { const T2 = CHAR.RUIN_TYPES.cottage.table; for (const [k, w] of T2) if (k === t) return w; return null; };
  /* v3.51: Lucky Find takes a second look at a ruin's roll and keeps the rarer line (mine) — so the same seeded stream is
     read for both walkers across three hundred searches of a collapsed cottage, and the lines they land on are counted */
  const kindOf = it => DATA.items[it.defId].cat === 'mat' ? 'mat' : DATA.items[it.defId].cat === 'gear' && DATA.items[it.defId].slot === 'charm' ? 'charm' : DATA.items[it.defId].cat;
  const search = traits => { __as('courier', traits); let sd = 0x2a2a17; __dice.force = () => { sd = (sd + 0x6D2B79F5) >>> 0; let t = sd; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; const ks = []; try { for (let i = 0; i < 300; i++) for (const it of NPC.lootRuin({ id: U.uid(), type: 'cottage', x: 0, y: 0, looted: false, seed: 3 })) ks.push(kindOf(it)); } finally { __dice.force = null; } return ks; };   // its own seeded stream, the page's dice left where they were
  const tally = ks => { const n = ks.length, sh = set => +(ks.filter(k => set.includes(k)).length / n).toFixed(3); return { n, rare: sh(['relic', 'charm', 'manual']), junk: sh(['junk']), meanW: +(ks.reduce((a, k) => a + W(k), 0) / n).toFixed(2) }; };
  out.ruin = { plain: tally(search([])), luckyfind: tally(search(['luckyfind'])) };
  WL.tp('haven');
  return out;
});
const charm = x => x === 'charm_coin' || /^charm_/.test(x);
ok('THE LUNGS, THE REST, THE EYES AND THE LUCK: Deep Lungs holds fifteen more wind than the same walker without (standing in the light until it takes no more); Restless wins back a quarter less of a station\'s rest in Haven\'s yard; Keen Eyes sees a ruin eight hundred and fifty paces off on the compass (40% past the seven hundred other eyes read); and Lucky Find finds better — under the same dice a supply drop holds charms where a plain walker\'s holds scrap, and three hundred searches of a collapsed cottage on the same seeded dice land on its rare lines (relic, charm, manual) more often and on junk less (v3.51, mine: a second look, the rarer line kept — the old lean had pushed the roll toward the common lines)',
  out9ok(four),
  JSON.stringify(four));
function out9ok(f) {
  return f.wind.deeplungs - f.wind.plain >= 14.9 && f.rest.restless < f.rest.plain - 1 && !f.eyes.plain && f.eyes.keeneyes
    && f.drop.plain.filter(charm).length === 0 && f.drop.luckyfind.filter(charm).length >= 1
    && f.ruin.luckyfind.rare >= f.ruin.plain.rare + 0.02 && f.ruin.luckyfind.junk < f.ruin.plain.junk && f.ruin.luckyfind.meanW < f.ruin.plain.meanW;
}

/* ================= 10 · THE CURVE ================= */
const curve = await ev(async () => {
  __as('courier'); __toasts.length = 0; S.flags.tut.firstSkill = false;
  const H = S.skills.haul, C = S.skills.climb, steps = [];
  Porter.xp('haul', 29, true); steps.push([H.lv, H.xp]);
  Porter.xp('haul', 1, true); steps.push([H.lv, H.xp]);
  Porter.xp('haul', 100, true); steps.push([H.lv, H.xp]);   // sixty to the next, the rest carried
  Porter.xp('climb', CHAR.XP_CURVE.reduce((a, v) => a + v, 0), true); const master = [C.lv, C.xp];
  const t0 = C.total; Porter.xp('climb', 500, true); const past = C.total - t0;
  await __wait(60);
  return { curve: CHAR.XP_CURVE, sum: CHAR.XP_CURVE.reduce((a, v) => a + v, 0), steps, master, past, toasts: __toasts.filter(t => /^(Hauling|Climbing) \d+ —/.test(t)).slice(0, 4) };
});
await page.keyboard.press('KeyK'); await page.waitForTimeout(250);
const ledger = await ev(() => { const rows = [...document.querySelectorAll('#skillsBody .skillRow')].slice(0, 10); const rd = i => ({ name: rows[i].querySelector('h4').textContent.trim(), pips: rows[i].querySelectorAll('.pip.on').length, of: rows[i].querySelectorAll('.pip').length, num: rows[i].querySelector('.num').textContent.trim(), fx: rows[i].querySelector('.fx').textContent.trim() }); return { haul: rd(3), climb: rd(7) }; });
await page.keyboard.press('KeyK'); await page.waitForTimeout(150);
ok('THE CURVE: ten skills of ten levels on the doubling curve (30, 60, 120, 250, 500, then 900 to 4,000 — 12,560 to master), the work carried past each level; a level says what it changed ("Hauling 1 — +2.8 kg capacity") and the first points at K; the ledger (a real K) shows the pips and the way to the next level, and a mastered skill reads MASTER and takes no more',
  curve.curve.join() === '30,60,120,250,500,900,1500,2200,3000,4000' && curve.sum === 12560 && JSON.stringify(curve.steps) === '[[0,29],[1,0],[2,40]]' && curve.master[0] === 10 && curve.past === 0
  && curve.toasts[0] === 'Hauling 1 — +2.8 kg capacity · press K for your body\'s ledger' && curve.toasts[1] === 'Hauling 2 — +5.6 kg capacity'
  && ledger.haul.pips === 2 && ledger.haul.of === 10 && ledger.haul.num === '40 / 120' && /\+5\.6 kg capacity/.test(ledger.haul.fx) && ledger.climb.pips === 10 && ledger.climb.num === 'MASTER',
  JSON.stringify({ ...curve, ledger }));

/* ================= 11 · THE VERBS ================= */
const verbs = await ev(async () => {
  const tot = () => Object.fromEntries(Object.entries(S.skills).map(([k, v]) => [k, v.total]));
  const gain = (fn) => { const a = tot(); fn(); const b = tot(); return Object.fromEntries(Object.keys(a).map(k => [k, +(b[k] - a[k]).toFixed(2)]).filter(([, v]) => v)); };
  const out = {};
  const H = DATA.stations.haven, field = () => { S.px = H.x + 520; S.py = H.y + 260; S.dir = 0; };
  __as('courier');
  out.walk = gain(() => { field(); for (let _i = 0, t = 0; _i < Math.round((3) * 10); _i++, t += 0.1) Systems.update(0.1, __in({ right: true })); });
  out.sprint = gain(() => { field(); S.stam = 100; for (let _i = 0, t = 0; _i < Math.round((2) * 10); _i++, t += 0.1) Systems.update(0.1, __in({ right: true, shift: true })); });
  __load(0.8); out.haul = gain(() => { field(); for (let _i = 0, t = 0; _i < Math.round((3) * 10); _i++, t += 0.1) Systems.update(0.1, __in({ right: true })); }); __clean();
  const L = __LAD, c = Math.cos(L.ang), s2 = Math.sin(L.ang);
  out.climb = gain(() => { S.px = L.x - c * 60; S.py = L.y - s2 * 60; for (let _i = 0, t = 0; _i < Math.round((2) * 10); _i++, t += 0.1) Systems.update(0.1, __in({ ml: true, mouse: { x: L.x + c * 200, y: L.y + s2 * 200 } })); });
  out.flare = gain(() => { field(); S.gear.flares = 1; S.flareCd = 0; S.wraiths.length = 0; Systems.useFlare(); });
  out.bandage = gain(() => { const b = State.makeItem('bandage'); State.addCargo(b); S.health = 60; Porter.useItem(b); });
  out.eat = gain(() => { const r = State.makeItem('ration'); State.addCargo(r); Porter.eat(r); });
  out.scrap = gain(() => { State.addCargo(State.makeItem('junk_cog')); Systems.scrapJunk('haven'); });
  out.ruin = gain(() => { NPC.lootRuin({ id: U.uid(), type: 'shrine', x: 0, y: 0, looted: false, seed: 5 }); });
  out.build = gain(() => { S.banked.metal = 70; State.addCargo(State.makeItem('kitTool')); S.px = H.x + 260; S.py = H.y - 40; Systems.tryBuild('generator'); S.structures.pop(); });
  out.steady = gain(() => { S.qte = { t: 0, dur: 1 }; Systems.steadyOk(); });
  /* a delivery's outcome teaches too: a clean crate walked in on time */
  S.stations.elm.stock.tools = 40; WL.tp('haven'); const b = Systems.boardFor('haven').find(x => !x.prio && x.def.item === 'tools' && x.def.to === 'elm'); const o = Systems.acceptOrder(b.def, false); o.t0 = S.time; WL.tp('elm');
  out.deliver = gain(() => { Systems.handleDelivery('elm'); });
  out.par = Math.round(o.par); out.kg = DATA.items.tools.kg;
  await __wait(60); for (const id of ['results', 'stationOv']) document.getElementById(id).classList.add('hidden');
  WL.tp('haven');
  return out;
});
ok('THE VERBS: a skill grows from doing its work, measured on the Walker\'s own step — walking teaches Footwork, running teaches Endurance, a heavy pack walked teaches Hauling, a laid ladder\'s rungs teach Climbing, a flare Lumenistry (25), a bandage Mending (14), a ration eaten Hearthcraft (4), junk scrapped at a terminal and a ruin searched Salvage (10 a piece, 12 a roll), a build Rigging (45), a load steadied Balance (8, ×1.5 for a Courier\'s calling); and a delivery teaches by its outcome — Footwork by the par walked, Hauling by the kilos, Balance for a crate brought in clean',
  verbs.walk.foot > 0 && verbs.sprint.end > 0 && verbs.haul.haul > 0 && verbs.climb.climb > 0 && verbs.flare.lum === 25 && verbs.bandage.mend === 14 && verbs.eat.hearth === 4
  && verbs.scrap.sal === 10 && verbs.ruin.sal === 24 && verbs.build.rig === 45 && verbs.steady.bal === 12
  && Math.abs(verbs.deliver.foot - verbs.par * 0.25 * 2) < 0.6 && Math.abs(verbs.deliver.haul - verbs.kg * 0.5) < 0.01 && verbs.deliver.bal === 12 * 1.5,
  JSON.stringify(verbs));

/* ================= 12 · EVERY LEVEL CHANGES PLAY ================= */
const levels = await ev(async () => {
  const out = {}, H = DATA.stations.haven;
  const pace = foot => { __as('courier', [], { foot }); S.px = H.x + 520; S.py = H.y + 260; S.dir = 0; const x0 = S.px; for (let _i = 0, t = 0; _i < Math.round((0.5) * 10); _i++, t += 0.1) Systems.update(0.1, __in({ right: true })); return +((S.px - x0) / 0.5).toFixed(2); };
  out.foot = { 0: pace(0), 5: pace(5) };
  const wob = bal => { __as('courier', [], { bal }); __load(0.6); return __wobble(); };
  out.bal = { 0: +wob(0).toFixed(6), 5: +wob(5).toFixed(6) };
  const ring = bal => { __as('courier', [], { bal }); __load(1.2); S.px = __marsh[0]; S.py = __marsh[1]; S.flags.calm = false; __dice.force = 0; try { Systems.update(0.1, __in({ right: true })); } finally { __dice.force = null; S.flags.calm = true; } const d = S.qte ? +S.qte.dur.toFixed(3) : null; S.qte = null; UI.showQTE(false); S.stagger = 0; return d; };
  out.window = { 0: ring(0), 5: ring(5) };
  const L = __LAD, c = Math.cos(L.ang), s2 = Math.sin(L.ang), far = { x: L.x + c * 200, y: L.y + s2 * 200 };
  const climb = lv => { __as('courier', [], { climb: lv, foot: 0 }); S.px = L.x - c * 40; S.py = L.y - s2 * 40; const x0 = S.px, y0 = S.py; for (let _i = 0, t = 0; _i < Math.round((0.6) * 10); _i++, t += 0.1) Systems.update(0.1, __in({ ml: true, mouse: far })); return +(U.dist(x0, y0, S.px, S.py) / 0.6).toFixed(2); };
  out.climb = { 0: climb(0), 5: climb(5) };
  const reach = lum => { __as('courier', [], { lum }); S.px = H.x + 520; S.py = H.y + 260; S.gear.flares = 1; S.flareCd = 0; S.wraiths.length = 0; S.wraiths.push({ id: U.uid(), x: S.px + 600, y: S.py, alert: 0, state: 'drift', cd: 0, ph: 0 }); const n0 = S.nodes.length; Systems.useFlare(); const burned = S.nodes.length - n0; S.nodes.length = n0; S.wraiths.length = 0; return burned; };
  out.lum = { 0: reach(0), 5: reach(5) };
  const band = mend => { __as('courier', [], { mend }); const b = State.makeItem('bandage'); State.addCargo(b); S.health = 50; S.bleeding = true; Porter.useItem(b); return +(S.health - 50).toFixed(2); };
  out.mend = { 0: band(0), 5: band(5) };
  const meal = hearth => { __as('courier', [], { hearth }); const m = State.makeItem('warmmeal'); State.addCargo(m); Porter.eat(m); return Math.round(S.buffs.wellfed); };
  out.hearth = { 0: meal(0), 5: meal(5) };
  const scrap = sal => { __as('courier', [], { sal }); State.addCargo(State.makeItem('junk_cog')); const m0 = S.banked.metal; Systems.scrapJunk('haven'); return S.banked.metal - m0; };
  out.sal = { 0: scrap(0), 5: scrap(5) };
  const cost = rig => { __as('courier', [], { rig }); S.banked.metal = 70; State.addCargo(State.makeItem('kitTool')); S.px = H.x + 260; S.py = H.y - 40; const m0 = S.banked.metal; Systems.tryBuild('generator'); S.structures.pop(); return m0 - S.banked.metal; };
  out.rig = { 0: cost(0), 5: cost(5) };
  /* what level two opens */
  const opens = async lv => {
    __as('courier', [], { rig: lv, sal: lv, hearth: lv }); S.banked.metal = 40; S.banked.provisions = 20;
    WL.tp(__open(H.x + 600, H.y + 300)); const node = { id: U.uid(), type: 'metal', x: S.px + 260, y: S.py - 200, qty: 12, taken: false }; S.nodes.push(node);
    await __settle();
    const r = { fieldLadder: Systems.buildOptions().some(o => o.type === 'fieldladder'), pings: __marks().filter(t => /^scrap /.test(t)).length, cook: Systems.getInteractions().some(i => i.key === 'C' && /Cook a warm meal/.test(i.label)) };
    S.nodes.splice(S.nodes.indexOf(node), 1); return r;
  };
  out.opens = { 1: await opens(1), 2: await opens(2) };
  WL.tp('haven');
  return out;
});
ok('EVERY LEVEL CHANGES PLAY (measured at nought and at five): Footwork walks 6% faster; Balance wobbles a quarter less and widens the steady ring by a fifth of a second; Climbing takes the rungs 35% faster; Lumenistry\'s flare reaches a wraith six hundred paces out; Mending\'s bandage mends 40% more; Hearthcraft\'s meal lasts 45% longer; Salvage scraps a bent cog for half again the metal; Rigging raises the same generator for 15% less; and level two opens its verb — Rigging a field ladder lashed from scrap, Salvage the scrap piles on the compass, Hearthcraft a warm meal cooked away from any fire',
  Math.abs(levels.foot[5] / levels.foot[0] - 1.06) < 0.01 && Math.abs(levels.bal[5] / levels.bal[0] - 0.75) < 0.002 && Math.abs(levels.window[5] - levels.window[0] - 0.2) < 0.001
  && Math.abs(levels.climb[5] / levels.climb[0] - 1.35) < 0.02 && levels.lum[0] === 0 && levels.lum[5] === 1 && Math.abs(levels.mend[5] - 14) < 0.01 && levels.mend[0] === 10
  && levels.hearth[0] === 360 && levels.hearth[5] === Math.round(360 * 1.45) && levels.sal[0] === 2 && levels.sal[5] === 3 && levels.rig[0] === 28 && levels.rig[5] === Math.round(28 * 0.85)
  && !levels.opens[1].fieldLadder && levels.opens[2].fieldLadder && levels.opens[1].pings === 0 && levels.opens[2].pings >= 1 && !levels.opens[1].cook && levels.opens[2].cook,
  JSON.stringify(levels));

/* ================= 13 · THE BODY'S TWO LIMITS ================= */
const limits = await ev(() => {
  const H = DATA.stations.haven;
  const cap = (haul, level) => { __as('courier', [], { haul }); S.level = level; Porter.dirty(); UI.updateHUD(); const t = document.getElementById('weightNum').textContent; S.level = 1; return t; };
  const ceiling = end => { __as('courier', [], { end }); S.px = H.x + 520; S.py = H.y + 260; S.stam = 80; for (let _i = 0, t = 0; _i < Math.round((8) * 10); _i++, t += 0.1) Systems.update(0.1, __in()); return +S.stam.toFixed(2); };
  const regen = end => { __as('courier', [], { end }); S.px = H.x + 520; S.py = H.y + 260; return __wind(1, {}, 40); };
  return { cap: { h0: cap(0, 1), h5: cap(5, 1), h10: cap(10, 1), level12: cap(0, 12) }, ceiling: { e0: ceiling(0), e5: ceiling(5), e10: ceiling(10) }, regen: { e0: regen(0), e5: regen(5) } };
});
ok('THE BODY\'S TWO LIMITS: what a Walker carries comes from Hauling — 2.8 kg a level on the HUD\'s load line, and never from the account\'s level (a twelfth-level Walker carries what a first-level one does) — and the wind a body holds comes from Endurance: six more a level (standing in the light until it takes no more), with the wind coming back 4% faster a level',
  limits.cap.h0 === '0.0 / 55 kg' && limits.cap.h5 === '0.0 / 69 kg' && limits.cap.h10 === '0.0 / 83 kg' && limits.cap.level12 === '0.0 / 55 kg'
  && Math.abs(limits.regen.e5 / limits.regen.e0 - 1.2) < 0.005 && limits.ceiling.e5 - limits.ceiling.e0 >= 29.9 && limits.ceiling.e10 - limits.ceiling.e0 >= 59.9,
  JSON.stringify(limits));

/* ================= 14 · A MANUAL READ ================= */
await ev(() => { __restore(); WL.tp('haven'); UI.toggleCargo(true); __toasts.length = 0; });
await page.click(`#cargoList [data-read="${await ev(() => S.cargo.find(c => c.defId === 'man_mend1').id)}"]`); await page.waitForTimeout(120);
const manual = await ev(async () => {
  const out = { studied: !!S.manuals.mend1, gone: !S.cargo.some(c => c.defId === 'man_mend1') };
  await __wait(60); out.toast = __toasts.find(t => /^Studied Mending, vol\. I/.test(t)) || '';
  const learn = () => { const t0 = S.skills.mend.total; Porter.xp('mend', 10); return +(S.skills.mend.total - t0).toFixed(2); };
  out.inBand = learn(); S.skills.mend.lv = 3; S.skills.mend.xp = 0; out.pastBand = learn();
  const copy = State.makeItem('man_mend1'); State.addCargo(copy); UI.refreshCargo();
  return out;
});
await page.click(`#cargoList [data-read="${await ev(() => S.cargo.find(c => c.defId === 'man_mend1').id)}"]`); await page.waitForTimeout(120);
Object.assign(manual, await ev(async () => { await __wait(60); const v2 = State.makeItem('man_mend2'); State.addCargo(v2); UI.refreshCargo(); return { again: S.cargo.some(c => c.defId === 'man_mend1'), againToast: __toasts.includes('Already studied — pass it on') }; }));
await page.click(`#cargoList [data-read="${await ev(() => S.cargo.find(c => c.defId === 'man_mend2').id)}"]`); await page.waitForTimeout(120);
Object.assign(manual, await ev(() => { const t0 = S.skills.mend.total; Porter.xp('mend', 10); UI.toggleCargo(false); return { vol2: +(S.skills.mend.total - t0).toFixed(2) }; }));
await page.keyboard.press('KeyK'); await page.waitForTimeout(250);
manual.sheet = await ev(() => { const r = [...document.querySelectorAll('#skillsBody .skillRow h4')].find(h => /^Mending/.test(h.textContent.trim())); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; });
await page.keyboard.press('KeyK'); await page.waitForTimeout(150);
/* where manuals come from: a terminal at two stars prints vol. I of its trade (a real click on Print), the ruins' tables and the Peddler's cart */
await ev(() => { S.stations.haven.stars = 1; S.banked.metal = 45; S.banked.ceramic = 30; WL.tp('haven'); UI.openStation('haven'); });
await page.click('#stationTabs [data-tab="fab"]'); await page.waitForTimeout(150);
const fab1 = await ev(() => [...document.querySelectorAll('#stationBody .rowline h4')].map(h => h.textContent.trim()).filter(t => /vol\./.test(t)));
await ev(() => { S.stations.haven.stars = 2; UI.renderStation(); });
const fabIdx = await ev(() => Systems.fabList('haven').findIndex(f => f.id === 'man_foot1'));
await page.click(`#stationBody [data-fab="${fabIdx}"]`); await page.waitForTimeout(150);
Object.assign(manual, await ev(fab1 => {
  const out = { fabAt1: fab1, printed: S.cargo.some(c => c.defId === 'man_foot1'), paid: { metal: 45 - S.banked.metal, ceramic: 30 - S.banked.ceramic } };
  UI.closeStation(); S.stations.haven.stars = 0;
  const vols = Object.keys(DATA.items).filter(k => /^man_/.test(k));
  out.vols = vols.length; out.names = ['man_mend1', 'man_mend2', 'man_mend3'].map(k => DATA.items[k].name + ' — ' + DATA.items[k].flavor.split('. ').pop());
  out.inRuins = Object.values(CHAR.RUIN_TYPES).every(r => r.table.some(([k]) => k === 'manual'));
  return out;
}, fab1));
manual.peddler = await ev(() => { S.event = null; S.flags.firstEvent = false; S.eventCd = 0; __dice.force = 0.2; try { NPC.update(0.01); } finally { __dice.force = null; } const ev2 = S.event, st = ev2 && ev2.data && ev2.data.stock ? ev2.data.stock.map(o => o.item.defId) : null; S.event = null; S.eventCd = 99999; return { type: ev2 && ev2.type, stock: st }; });
ok('A MANUAL READ: thirty volumes, three to a skill, each for a band of levels (vol. I to level 3 at ×3, vol. II to 6 at ×5, vol. III to 9 at ×8); the Field Medic\'s own vol. I studied from the pack by a real click — gone from the pack, said, and Mending learns ×3 on top of the calling inside its band (60 for 10) and plain calling past it; a second copy is refused ("Already studied") and stays; vol. II carries on at ×5; the ledger marks "vol 1,2"; and manuals are met in play — a terminal at two stars prints vol. I of its trade by a real click (none at one star), every ruin\'s table holds them, and the Peddler\'s cart opens with two',
  manual.studied && manual.gone && !!manual.toast && manual.inBand === 60 && manual.pastBand === 20 && manual.again && manual.againToast && manual.vol2 === 100 && /Mending CALLING ×2 vol 1,2/.test(manual.sheet)
  && manual.fabAt1.length === 0 && manual.printed && manual.paid.metal === 20 && manual.paid.ceramic === 20 && manual.vols === 30 && manual.inRuins && manual.peddler.type === 'peddler' && manual.peddler.stock.slice(0, 2).every(k => /^man_/.test(k)),
  JSON.stringify(manual));

/* ================= 15 · HEALTH ================= */
const health = await ev(async () => {
  const out = {}, H = DATA.stations.haven;
  const field = () => { S.px = H.x + 520; S.py = H.y + 260; S.dir = 0; };
  /* a sane walk on the meadow, the wobble live: no wound */
  __as('courier'); __load(0.5); field(); S.flags.calm = false; for (let _i = 0, t = 0; _i < Math.round((4) * 10); _i++, t += 0.1) Systems.update(0.1, __in({ right: true })); S.flags.calm = true; out.walk = +(100 - S.health).toFixed(2); __clean();
  /* a bad stumble under an overload: the dice held under the bleed's 12% */
  __as('courier'); __load(1.25); field(); const d0 = S.drops.length; __dice.force = 0.05; try { S.qte = { t: 5, dur: 1 }; Systems.update(0.016, __in()); } finally { __dice.force = null; }
  out.stumble = { hurt: +(100 - S.health).toFixed(2), bleeding: S.bleeding, bruised: S.bruisedT > 0, dropped: S.drops.length - d0 }; S.drops.length = d0; __clean();
  /* bleeding drains until it is bound */
  const b0 = S.health; for (let _i = 0, t = 0; _i < Math.round((4) * 10); _i++, t += 0.1) Systems.update(0.1, __in()); out.bleed = +(b0 - S.health).toFixed(2);
  /* a scrapper's blow in Pass Camp's claim */
  __as('courier'); const cd = DATA.camps.find(c => c.id === 'pass'); S.px = cd.x + 260; S.py = cd.y + 120; State.addCargo(State.makeItem('textiles')); S.camps.pass.runners = [{ x: S.px + 10, y: S.py, wa: 0, state: 'patrol', cd: 0, cls: 'knife' }];
  __dice.force = 0.9; try { Systems.update(0.016, __in()); } finally { __dice.force = null; }
  out.blow = { hurt: +(100 - S.health).toFixed(2), bruised: S.bruisedT > 0 }; S.camps.pass.runners = []; S.drops.length = d0; __clean();
  /* a wraith's yank */
  __as('courier'); field(); State.addCargo(State.makeItem('textiles')); const w = { id: U.uid(), x: S.px + 26, y: S.py, alert: 1, state: 'hunt', cd: 0, ph: 0 }; S.struggle = { meter: 0.0005, wraith: w };
  __dice.force = 0.5; try { Systems.update(0.016, __in()); } finally { __dice.force = null; }
  out.yank = { hurt: +(100 - S.health).toFixed(2), cold: +(100 - S.warmth).toFixed(1), snagged: S.snags.length > 0 }; S.snags.length = 0;
  /* the deep water sweeps a stumble: the crate carried off downstream */
  __as('courier'); S.px = __FORD[0]; S.py = __FORD[1]; const cr = State.makeItem('textiles'); State.addCargo(cr); __dice.force = 0.5; try { S.qte = { t: 5, dur: 1 }; Systems.update(0.016, __in()); } finally { __dice.force = null; }
  const sw = S.drops.find(d => d.item === cr); out.sweep = { hurt: +(100 - S.health).toFixed(2), carried: sw ? Math.round(sw.x - S.px) : null }; S.drops.length = d0;
  /* a bruise slows the wind's return, and wears off */
  __as('courier'); field(); const rNo = __wind(1, {}, 40); S.bruisedT = 60; const rBr = __wind(1, {}, 40); const left = S.bruisedT; out.bruise = { plain: rNo, bruised: rBr, wearsOff: left < 60 };
  /* health comes back: resting at a station, and slowly afield on a full stomach */
  __as('courier'); WL.tp('haven'); S.health = 50; for (let _i = 0, t = 0; _i < Math.round((5) * 10); _i++, t += 0.1) Systems.update(0.1, __in()); out.restStation = +(S.health - 50).toFixed(2);
  __as('courier'); field(); S.health = 50; S.food = 90; for (let _i = 0, t = 0; _i < Math.round((5) * 10); _i++, t += 0.1) Systems.update(0.1, __in()); out.restField = +(S.health - 50).toFixed(2);
  /* bleeding, for the bandage below */
  __as('courier'); field(); State.addCargo(State.makeItem('bandage')); S.health = 70; S.bleeding = true; UI.toggleCargo(true);
  return out;
});
await page.click(`#cargoList [data-use="${await ev(() => S.cargo.find(c => c.defId === 'bandage').id)}"]`); await page.waitForTimeout(120);
health.bound = await ev(() => { const out = { bleeding: S.bleeding, health: +S.health.toFixed(2) }; const h0 = S.health; for (let _i = 0, t = 0; _i < Math.round((2) * 10); _i++, t += 0.1) Systems.update(0.1, __in()); out.after = +(S.health - h0).toFixed(3); UI.toggleCargo(false); return out; });
ok('HEALTH: wounds come from real events only — four seconds of a sane walk on the meadow with the wobble live cost nothing; a bad stumble under an overload hurts, bruises, drops the crate and (the dice under 12%) opens a bleed that drains until it is bound; a knife\'s blow in Pass Camp\'s claim hurts and bruises; a wraith\'s yank hurts, chills and snags a crate; a stumble in the water hurts and the current carries the crate downstream — and a bandage used from the pack by a real click stops the bleed and mends; a bruise slows the wind\'s return by a quarter and wears off; and health comes back resting at a station, slowly afield on a full stomach',
  health.walk === 0 && health.stumble.hurt === 4 && health.stumble.bleeding && health.stumble.bruised && health.stumble.dropped === 1 && Math.abs(health.bleed - 1) < 0.02
  && health.blow.hurt === 7 && health.blow.bruised && health.yank.hurt === 9 && health.yank.cold > 17.5 && health.yank.snagged && health.sweep.hurt === 5 && health.sweep.carried >= 90
  && !health.bound.bleeding && health.bound.health === 80 && health.bound.after >= 0 && Math.abs(health.bruise.bruised / health.bruise.plain - 0.75) < 0.005 && health.bruise.wearsOff
  && Math.abs(health.restStation - 3) < 0.05 && Math.abs(health.restField - 0.4) < 0.02,
  JSON.stringify(health));

/* ================= 16 · FOOD ================= */
const food = await ev(async () => {
  const out = {}, H = DATA.stations.haven;
  const field = () => { S.px = H.x + 520; S.py = H.y + 260; S.dir = 0; };
  __as('courier'); field(); S.food = 80; for (let i = 0; i < 50; i++) Systems.update(0.1, __in()); out.still = +(80 - S.food).toFixed(3);
  field(); S.food = 80; for (let i = 0; i < 50; i++) Systems.update(0.1, __in({ right: true })); out.walking = +(80 - S.food).toFixed(3);
  field(); S.food = 80; const fed = __wind(1, {}, 40); S.food = 30; const hungry = __wind(1, {}, 40); out.wind = { fed, hungry };
  /* at nought: thirty seconds' grace, then it hurts — afield; in a town's yard a keeper brings a bowl instead */
  field(); S.food = 0; S.foodZeroT = 0; const h0 = S.health; for (let t = 0; t < 29; t += 0.5) Systems.update(0.5, __in()); const grace = +(h0 - S.health).toFixed(3); for (let t = 0; t < 5; t += 0.5) { S.food = 0; Systems.update(0.5, __in()); } out.starve = { grace, after: +(h0 - S.health).toFixed(3) };
  __as('courier'); WL.tp('haven'); S.px += 150; S.food = 0; S.foodZeroT = 0; S.flags.mercyT = {}; __toasts.length = 0; const h1 = S.health; for (let t = 0; t < 40; t += 0.5) Systems.update(0.5, __in()); await __wait(60);
  out.town = { hurt: +(h1 - S.health).toFixed(3), food: Math.round(S.food), bowl: __toasts.find(t => /presses a bowl into your hands/.test(t)) || '' };
  /* H eats from the pack */
  __as('courier'); field(); State.addCargo(State.makeItem('ration')); S.food = 30; UI2.updateMoodles();
  return out;
});
await page.keyboard.press('KeyH'); await page.waitForTimeout(120);
Object.assign(food, await ev(() => { UI2.updateMoodles(); return { eaten: { food: Math.round(S.food), left: S.cargo.filter(c => c.defId === 'ration').length, bar: document.getElementById('foodFill').style.width } }; }));
ok('FOOD: a gentle drain — three times faster walking than standing still; hungry, the wind comes back 30% slower; at nought there are thirty seconds of grace and then it hurts, afield — never in a town\'s yard, where a keeper presses a bowl into your hands; a real H eats from the pack and the food bar under the load reads it',
  Math.abs(food.still - 0.15) < 0.002 && Math.abs(food.walking - 0.45) < 0.002 && Math.abs(food.wind.hungry / food.wind.fed - 0.7) < 0.005 && food.starve.grace === 0 && food.starve.after > 0.2
  && food.town.hurt === 0 && food.town.food >= 20 && !!food.town.bowl && food.eaten.food === 65 && food.eaten.left === 0 && food.eaten.bar === '65%',
  JSON.stringify(food));

/* ================= 17 · WARMTH ================= */
const warmth = await ev(async () => {
  const out = {}, DL = DATA.T.dayLen;
  const ford = (coat, gen) => {
    __as('courier'); if (coat) S.equip.coat = State.makeItem(coat); Porter.dirty();
    S.px = __FORD[0]; S.py = __FORD[1]; S.weather = { state: 'grey', t: 99999, intensity: 0.8 }; S.time = Math.floor(S.time / DL) * DL + DL * 0.8; S.warmth = 70;
    const g = gen ? { id: U.uid(), type: 'generator', x: S.px + 40, y: S.py, ang: 0, hp: 100, by: 'you', likes: 0 } : null; if (g) S.structures.push(g);
    const w0 = S.warmth; for (let _i = 0, t = 0; _i < Math.round((2) * 10); _i++, t += 0.1) { Systems.update(0.1, __in()); S.wraiths.length = 0; }
    if (g) S.structures.splice(S.structures.indexOf(g), 1);
    S.weather = { state: 'clear', t: 99999, intensity: 0 }; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
    return +((S.warmth - w0) / 2).toFixed(3);
  };
  out.perSecond = { cloak: ford(null), highland: ford('coat_high'), generator: ford(null, true) };
  __as('courier'); S.px = DATA.stations.haven.x + 520; S.py = DATA.stations.haven.y + 260; S.warmth = 70; for (let _i = 0, t = 0; _i < Math.round((1) * 10); _i++, t += 0.1) Systems.update(0.1, __in()); out.noonMeadow = +(S.warmth - 70).toFixed(2);
  /* the meter on the HUD: hidden while warm, shown and filled as it falls */
  S.warmth = 90; UI2.updateMoodles(); const hid = document.getElementById('warmMeter').classList.contains('hidden');
  S.warmth = 60; UI2.updateMoodles(); out.meter = { hiddenAt90: hid, shownAt60: !document.getElementById('warmMeter').classList.contains('hidden'), fill: document.getElementById('warmFill').style.width };
  /* freezing hurts afield, never in a town's yard */
  const freeze = town => { __as('courier'); if (town) { WL.tp('haven'); S.px += 150; } else { S.px = __FORD[0]; S.py = __FORD[1]; } S.warmth = 10; S.weather = { state: 'grey', t: 99999, intensity: 0.8 }; S.time = Math.floor(S.time / DL) * DL + DL * 0.8; const h = S.health; for (let i = 0; i < 20; i++) { Systems.update(0.1, __in()); S.wraiths.length = 0; } S.weather = { state: 'clear', t: 99999, intensity: 0 }; S.time = Math.floor(S.time / DL) * DL + DL * 0.3; return +(h - S.health).toFixed(3); };
  out.freezing = { afield: freeze(false), town: freeze(true) };
  WL.tp('haven');
  return out;
});
ok('WARMTH, CONTEXTUAL: the cold is where the Walker stands — on a greyfall night in a ford out of the light the cloak loses warmth fast, a Highland coat holds more of it, and a generator\'s aura turns it round to warming; the southern meadow at noon warms; the HUD\'s warmth meter hides while the Walker is warm and shows, filled, as it falls; and freezing hurts afield but never in a town\'s yard',
  warmth.perSecond.cloak < -0.9 && warmth.perSecond.highland > warmth.perSecond.cloak + 0.4 && warmth.perSecond.highland < 0 && warmth.perSecond.generator > 5 && warmth.noonMeadow > 0.6
  && warmth.meter.hiddenAt90 && warmth.meter.shownAt60 && warmth.meter.fill === '60%' && warmth.freezing.afield > 0.3 && warmth.freezing.town === 0,
  JSON.stringify(warmth));

/* ================= 18 · THE MOODLES ================= */
const moodles = await ev(() => {
  const H = DATA.stations.haven, read = () => { UI2.updateMoodles(); return [...document.querySelectorAll('#moodles .moodle')].map(m => `${m.title.split(' — ')[0]}:${m.classList.contains('good') ? 'good' : m.classList.contains('sev2') ? 'sev2' : 'sev1'}`); };
  const base = () => { __as('courier'); S.px = H.x + 520; S.py = H.y + 260; S.wraiths.length = 0; };
  const out = {};
  base(); out.none = read();
  base(); S.food = 30; out.hungry = read();
  base(); S.food = 3; out.starving = read();
  base(); S.bleeding = true; out.bleeding = read();
  base(); S.bruisedT = 30; out.bruised = read();
  base(); S.warmth = 40; out.cold = read();
  base(); S.warmth = 10; out.freezing = read();
  base(); S.px = __FORD[0]; S.py = __FORD[1]; out.wet = read();
  base(); S.wraiths.push({ id: U.uid(), x: S.px + 200, y: S.py, alert: 1, state: 'hunt', cd: 0, ph: 0 }); out.fear = read(); S.wraiths.length = 0;
  base(); S.buffs.wellfed = 60; out.wellfed = read();
  base(); S.buffs.warmed = 60; out.warmed = read();
  base(); S.buffs.teaglow = 60; Porter.dirty(); out.glow = read();
  base(); __load(1.2); out.over = read(); __clean();
  base(); out.cleared = read();
  return out;
});
const one = (k, want) => moodles[k].length === 1 && moodles[k][0] === want;
ok('THE MOODLES ON THE HUD: one glyph for each state of the body, with its severity — Hungry (amber) and Starving (rust), Bleeding (rust), Bruised (amber), Cold (amber) and Freezing (rust), Wet (in the water), Grey-fear (a wraith hunting within five hundred paces, rust), Well-fed, Warmed and Lumen glow (green), Overloaded (rust) — each named on hover, and gone the moment its cause is',
  moodles.none.length === 0 && one('hungry', 'Hungry:sev1') && one('starving', 'Starving:sev2') && one('bleeding', 'Bleeding:sev2') && one('bruised', 'Bruised:sev1') && one('cold', 'Cold:sev1') && one('freezing', 'Freezing:sev2')
  && one('wet', 'Wet:sev1') && one('fear', 'Grey-fear:sev2') && one('wellfed', 'Well-fed:good') && one('warmed', 'Warmed:good') && one('glow', 'Lumen glow:good') && one('over', 'Overloaded:sev2') && moodles.cleared.length === 0,
  JSON.stringify(moodles));

/* ================= 19 · THE GEAR ================= */
const wear = async id => { await ev(id => { State.addCargo(State.makeItem(id)); UI.toggleCargo(true); }, id); await page.click(`#cargoList [data-wear="${await ev(id => S.cargo.filter(c => c.defId === id).pop().id, id)}"]`); await page.waitForTimeout(100); await ev(() => UI.toggleCargo(false)); };
const gear = {};
await ev(() => { __as('courier'); });
await wear('pack_exo1');
gear.exo = await ev(() => { UI.updateHUD(); return { worn: S.equip.pack.defId, line: document.getElementById('weightNum').textContent }; });
await ev(() => { __as('courier'); __load(0.6); window.__w0 = __wobble(); __as('courier'); });
await wear('boots_tread');
gear.tread = await ev(() => { __load(0.6); return { worn: S.equip.boots.defId, ratio: +(__wobble() / __w0).toFixed(4) }; });
await wear('boots_cleat');
gear.swap = await ev(() => ({ worn: S.equip.boots.defId, back: S.cargo.filter(c => c.defId === 'boots_tread').length }));
await ev(() => { __as('courier'); });
await wear('coat_wax');
gear.wax = await ev(() => { const it = State.makeItem('meds'); State.addCargo(it); S.px = __GREY[0]; S.py = __GREY[1]; S.weather = { state: 'grey', t: 99999, intensity: 0.8 }; for (let i = 0; i < 100; i++) { Systems.update(0.1, __in()); S.wraiths.length = 0; } S.weather = { state: 'clear', t: 99999, intensity: 0 }; return { worn: S.equip.coat.defId, rot: +(100 - it.cond).toFixed(3) }; });
await ev(() => { __as('courier'); });
await wear('pack_sled');
gear.sled = await ev(() => { const H = DATA.stations.haven; S.px = H.x + 520; S.py = H.y + 260; S.dir = 0; S.stam = 100; const x0 = S.px; for (let i = 0; i < 5; i++) Systems.update(0.1, __in({ right: true, shift: true })); return { worn: S.equip.pack.defId, sprinting: S.sprinting, cap: State.cap(), pace: +((S.px - x0) / 0.5).toFixed(1) }; });
await page.keyboard.press('KeyK'); await page.waitForTimeout(250);
gear.doll = await ev(() => [...document.querySelectorAll('#skillsDoll .equipRow')].map(r => r.textContent.replace(/\s+/g, ' ').trim()));
await page.keyboard.press('KeyK'); await page.waitForTimeout(150);
ok('THE GEAR, WORN: four slots worn by real clicks on "equip" in the pack, each changing play — the Exo frame carries forty kilos more on the HUD\'s load line, Treadfast boots wobble a tenth less on the same marsh, a second pair worn puts the first back on the pack, the Waxed coat lets a crate of medicine rot in the greyfall 40% slower than the cloak does (0.6 of the rain), the Float sled carries a hundred kilos more but will not run and holds the pace under the walk\'s own; and the body\'s ledger shows them on the rig',
  gear.exo.worn === 'pack_exo1' && gear.exo.line === '0.0 / 95 kg' && gear.tread.worn === 'boots_tread' && Math.abs(gear.tread.ratio - 0.9) < 0.003 && gear.swap.worn === 'boots_cleat' && gear.swap.back === 1
  && gear.wax.worn === 'coat_wax' && Math.abs(gear.wax.rot / perks2.rot.courier - 0.6) < 0.01 && gear.sled.worn === 'pack_sled' && !gear.sled.sprinting && gear.sled.cap === 155 && gear.sled.pace < 100 * 0.88 * 1.1 + 0.5
  && gear.doll.some(r => /^pack\s*Float sled/.test(r)) && gear.doll.some(r => /^boots\s*Worn boots/.test(r)),
  JSON.stringify(gear));

/* ================= 20 · THE CHARMS ================= */
const charms = {};
/* the Old Post coin: the same delivery, walked the same, pays 3% more */
const payOf = async withCoin => {
  await ev(() => { __as('courier'); });
  if (withCoin) await wear('charm_coin');
  return ev(() => { S.stations.elm.stock.tools = 40; S.trip = { n: 0, lastT: -1e9 }; WL.tp('haven'); const b = Systems.boardFor('haven').find(x => !x.prio && x.def.item === 'tools' && x.def.to === 'elm'); const o = Systems.acceptOrder(b.def, false); o.t0 = S.time; WL.tp('elm'); const r = Systems.handleDelivery('elm').results[0]; for (const id of ['results', 'stationOv']) document.getElementById(id).classList.add('hidden'); return r.likes; });
};
charms.coin = { plain: await payOf(false), coin: await payOf(true) };
await ev(() => { __as('courier'); });
await wear('charm_feather');
charms.feather = await ev(() => { const ring = () => { __load(1.2); S.px = __marsh[0]; S.py = __marsh[1]; S.flags.calm = false; __dice.force = 0; try { Systems.update(0.1, __in({ right: true })); } finally { __dice.force = null; S.flags.calm = true; } const d = S.qte ? +S.qte.dur.toFixed(3) : null; S.qte = null; UI.showQTE(false); S.stagger = 0; __clean(); return d; }; const withF = ring(); const f = S.equip.charm; S.equip.charm = null; Porter.dirty(); const without = ring(); S.equip.charm = f; Porter.dirty(); return { with: withF, without }; });
await ev(() => { __as('courier'); });
await wear('charm_bell');
charms.bell = await ev(async () => { __toasts.length = 0; S.px = __GREY[0]; S.py = __GREY[1]; S.dir = 0; let wx = null; for (let a = 0; a < 6.28 && !wx; a += 0.2) { const x = S.px + Math.cos(a) * 160, y = S.py + Math.sin(a) * 160; if (!World.terrainAt(x, y).blocked && World.mistAt(x, y) > 0.34) wx = [x, y]; } const w = { id: U.uid(), x: wx[0], y: wx[1], alert: 0, state: 'drift', cd: 0, ph: 0 }; S.wraiths.length = 0; S.wraiths.push(w); let i = 0; for (; i < 60 && w.alert <= 0.35; i++) { Systems.update(0.1, __in({ right: i % 20 < 10, left: i % 20 >= 10 })); } for (let j = 0; j < 10; j++) Systems.update(0.1, __in({ right: true })); await __wait(60); S.wraiths.length = 0; return { rang: __toasts.filter(t => t === 'The glass bell rings, once.').length, alert: +w.alert.toFixed(2) }; });
const echo = async withBox => {
  await ev(() => { __as('courier'); });
  if (withBox) await wear('charm_music');
  return ev(() => { const H = DATA.stations.haven; S.px = H.x + 520; S.py = H.y + 260; const g = { id: U.uid(), type: 'generator', x: S.px + 60, y: S.py, ang: 0, hp: 100, by: 'you', likes: 0 }; S.structures.push(g); S.weather.t = 1e9; const l0 = S.likes; __dice.force = 0.5; try { Systems.update(500, __in()); } finally { __dice.force = null; } S.structures.splice(S.structures.indexOf(g), 1); __vit(); return S.likes - l0; });
};
charms.music = { plain: await echo(false), box: await echo(true) };
const roseSeen = async withRose => {
  await ev(() => { __as('courier'); });
  if (withRose) await wear('charm_rose');
  return ev(async () => { WL.tp(__open(DATA.stations.haven.x + 600, DATA.stations.haven.y + 300)); const rn = { id: U.uid(), type: 'cottage', x: S.px + 850, y: S.py - 40, looted: false, seed: 11 }; S.ruins.push(rn); await __settle(); const seen = __marks().some(t => t === 'ruin 851 m'); S.ruins.splice(S.ruins.indexOf(rn), 1); return seen; });
};
charms.rose = { plain: await roseSeen(false), rose: await roseSeen(true) };
const restWith = async withDrawing => {
  await ev(() => { __as('courier'); });
  if (withDrawing) await wear('charm_draw');
  return ev(() => { WL.tp('haven'); return __wind(1, {}, 20); });
};
charms.drawing = { plain: await restWith(false), drawing: await restWith(true) };
ok('THE CHARMS, RELICS WITH SMALL QUIRKS, WORN IN THE CHARM SLOT BY REAL CLICKS: the Old Post coin pays 3% more for the same delivery; the Wren feather widens the steady ring by an eighth of a second; the Glass bell rings, once, when a wraith starts to notice; the silent music box makes an echo who uses your build like you half again as much; the Compass rose sees a ruin eight hundred and fifty paces off on the compass (30% past the seven hundred); and the Child\'s drawing makes a station\'s rest a third richer',
  Math.abs(charms.coin.coin / charms.coin.plain - 1.03) < 0.02 && Math.abs(charms.feather.with - charms.feather.without - 0.12) < 0.002 && charms.bell.rang === 1 && charms.music.plain > 0 && charms.music.box === Math.round(charms.music.plain * 1.5)
  && !charms.rose.plain && charms.rose.rose && charms.drawing.drawing > charms.drawing.plain + 1,
  JSON.stringify(charms));

/* ================= 21 · CONSUMABLES, JUNK AND RELICS ================= */
const goods = await ev(async () => {
  const out = {};
  const eatIt = id => { __as('courier'); S.food = 40; const it = State.makeItem(id); State.addCargo(it); const s0 = S.stam = 50; Porter.eat(it); return { food: Math.round(S.food - 40), buffs: Object.fromEntries(Object.entries(S.buffs).map(([k, v]) => [k, Math.round(v)])), wind: Math.round(S.stam - s0), gone: !S.cargo.includes(it) }; };
  out.eat = { ration: eatIt('ration'), preserves: eatIt('preserves'), stew: eatIt('stew'), tea: eatIt('lumentea'), meal: eatIt('warmmeal') };
  __as('courier'); const e0 = { speed: Porter.eff().speed, sense: Porter.eff().senseMul }; S.buffs.teaglow = 60; Porter.dirty(); out.glow = { speed: +(Porter.eff().speed / e0.speed).toFixed(3), noticed: +(Porter.eff().senseMul / e0.sense).toFixed(3) };
  __as('courier'); const sv = State.makeItem('salve'); State.addCargo(sv); S.health = 50; S.bleeding = true; Porter.useItem(sv); out.salve = { healed: Math.round(S.health - 50), bleeding: S.bleeding };
  out.flavor = Object.entries(CHAR.ITEMS2).filter(([, d]) => !d.flavor || d.flavor.length < 8).map(([k]) => k);
  /* junk and relics on the back, walked to Elm Farm's terminal */
  __as('courier'); WL.tp('elm'); S.banked.metal = 20; S.banked.ceramic = 10; S.banked.lumen = 0;
  for (const id of ['junk_cog', 'junk_lens', 'junk_lantern']) State.addCargo(State.makeItem(id));
  UI.openStation('elm');
  return out;
});
await page.click('#stationTabs [data-tab="donate"]'); await page.waitForTimeout(150);
await page.click('#stationBody #scrapBtn'); await page.waitForTimeout(150);
Object.assign(goods, await ev(() => { const out = { scrapped: { metal: S.banked.metal - 20, ceramic: S.banked.ceramic - 10, lumen: S.banked.lumen, left: S.cargo.filter(c => DATA.items[c.defId].cat === 'junk').length } }; UI.closeStation(); __as('courier'); WL.tp('elm'); window.__seed = State.makeItem('relic_seed'); State.addCargo(__seed); window.__rl = { likes: S.likes, town: S.stations.elm.likesTo }; __toasts.length = 0; return out; }));
await page.keyboard.press('KeyE'); await page.waitForTimeout(150);
goods.bare = await ev(async () => { await __wait(60); const out = { kept: S.cargo.includes(__seed), likes: S.likes - __rl.likes, sheet: !document.getElementById('stationOv').classList.contains('hidden') }; UI.closeStation(); S.stations.elm.stock.tools = 40; WL.tp('haven'); const b = Systems.boardFor('haven').find(x => !x.prio && x.def.item === 'tools' && x.def.to === 'elm'); Systems.acceptOrder(b.def, false); window.__seed = State.makeItem('relic_seed'); State.addCargo(__seed); WL.tp('elm'); window.__rl = { likes: S.likes, town: S.stations.elm.likesTo }; __toasts.length = 0; return out; });   // the first packet went in at the bare visit: a second rides with the crate
await page.keyboard.press('KeyE'); await page.waitForTimeout(150);
goods.withDelivery = await ev(async () => {
  const handover = !!S.handover; WL.skipHandover(); await __wait(80);
  const out = { handover, gone: !S.cargo.includes(__seed), lore: __toasts.find(t => /^Seed packet — “SUNFLOWERS\.”/.test(t)) || '' };
  const want = Math.round(DATA.items.relic_seed.likes * 1.8); out.want = want;
  for (const id of ['results', 'stationOv']) document.getElementById(id).classList.add('hidden');
  return out;
});
ok('CONSUMABLES, JUNK AND RELICS: the regional foods feed and do their own thing (rations only fill; Elm preserves leave you Well-fed, Foundry stew Warmed, a warm meal both; lumen tea gives back thirty wind and a glow — faster, and easier to notice), a salve binds a bleed and mends twenty-five; every item carries a line of its own; junk scraps into materials at a terminal by a real click (a bent cog, a cracked lens, a dead lantern: metal, ceramic, lumen); and a relic walked to any terminal is handed in for ◆ and its line of lore — the seed packet, Elm Farm\'s own, 1.8 times over — carried there with nothing else to hand over as surely as with a crate',
  goods.eat.ration.food === 35 && Object.keys(goods.eat.ration.buffs).length === 0 && goods.eat.preserves.buffs.wellfed === 240 && goods.eat.stew.buffs.warmed === 300 && goods.eat.meal.buffs.wellfed === 360 && goods.eat.meal.buffs.warmed === 240
  && goods.eat.tea.buffs.teaglow === 90 && goods.eat.tea.wind === 30 && goods.glow.speed === 1.08 && goods.glow.noticed === 1.3 && goods.salve.healed === 25 && !goods.salve.bleeding && goods.flavor.length === 0
  && goods.scrapped.metal === 4 && goods.scrapped.ceramic === 2 && goods.scrapped.lumen === 1 && goods.scrapped.left === 0
  && goods.withDelivery.handover && goods.withDelivery.gone && !!goods.withDelivery.lore && !goods.bare.kept && goods.bare.likes >= goods.withDelivery.want,
  JSON.stringify(goods));

/* ================= 22 · A RUIN'S THEMED LOOT ================= */
const ruins = await ev(async () => {
  __as('courier');
  const kinds = {}; for (const r of S.ruins) kinds[r.type] = (kinds[r.type] || 0) + 1;
  const shrineDark = S.ruins.filter(r => r.type === 'shrine').every(r => World.mistBase(r.x, r.y) >= 0.45);
  const H = DATA.stations.haven, shrine = S.ruins.filter(r => r.type === 'shrine' && !r.looted).sort((a, b) => U.dist(a.x, a.y, H.x, H.y) - U.dist(b.x, b.y, H.x, H.y))[0];
  let spot = null; for (let r = 20; r <= 50 && !spot; r += 6) for (let a = 0; a < 6.28 && !spot; a += 0.3) { const x = shrine.x + Math.cos(a) * r, y = shrine.y + Math.sin(a) * r, t = World.terrainAt(x, y); if (!t.blocked && !t.water) spot = [x, y]; }   // within the ruin's reach, on ground the feet can stand
  __shut(); WL.tp(spot); S.wraiths.length = 0;
  window.__shrine = shrine; window.__sal0 = S.skills.sal.total;
  await __settle(); S.wraiths.length = 0;
  return { n: S.ruins.length, kinds, shrineDark, tables: Object.fromEntries(Object.entries(CHAR.RUIN_TYPES).map(([k, v]) => [k, v.table.map(x => x[0]).join('/')])), rail: Systems.getInteractions().filter(i => i.key === 'E').map(i => i.label.replace(/<[^>]+>/g, '')), onStrip: __marks().some(t => /^ruin /.test(t)), gates: UI.gateReport() };
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(200);
ruins.sheet = await ev(() => ({ open: !document.getElementById('lootOv').classList.contains('hidden'), title: document.getElementById('lootTitle').textContent, sub: document.getElementById('lootSub').textContent, items: [...document.querySelectorAll('#lootBody h4')].map(h => h.textContent) }));
await clickIf('#lootTake');
Object.assign(ruins, await ev(async () => {
  S.wraiths.length = 0;
  const got = S.cargo.filter(c => c.cat !== 'tool').map(c => ({ id: c.defId, cat: DATA.items[c.defId].slot === 'charm' ? 'charm' : DATA.items[c.defId].cat }));
  await __settle();
  const out = { got, looted: __shrine.looted, salvage: +(S.skills.sal.total - __sal0).toFixed(1), stillOnStrip: __marks().some(t => /^ruin /.test(t) && U.dist(S.px, S.py, __shrine.x, __shrine.y) < 700), again: Systems.getInteractions().some(i => /Search the/.test(i.label)) };
  WL.tp('haven');
  return out;
}));
ok('A RUIN\'S THEMED LOOT: thirty-six ruins stand in a new valley in six kinds with their own tables (the cottage, the post office, the caravan, the watchpost, the fallen Waylighter\'s camp, the Shrine of the First Light — shrines only in the dark); at the nearest shrine a real E opens its sheet by name ("what the valley kept") and every find is of the shrine\'s own table — charms, relics, manuals, food, never junk or scrap; a real click on Take all puts it on the back, the ruin is searched (off the compass, no second search) and Salvage learns from each roll',
  ruins.n === 36 && Object.keys(ruins.kinds).length === 6 && ruins.shrineDark && ruins.rail[0] === 'Search the shrine of the first light' && ruins.onStrip
  && ruins.sheet.open && ruins.sheet.title === 'Shrine of the First Light' && ruins.sheet.sub === 'what the valley kept' && ruins.sheet.items.length === 2
  && ruins.got.length === 2 && ruins.got.every(g => ['charm', 'relic', 'manual', 'food'].includes(g.cat)) && ruins.looted && !ruins.again && ruins.salvage === 24,
  JSON.stringify(ruins));

/* ================= 23 · A WAYLIGHTER HIRED ================= */
await ev(() => { __as('courier'); S.banked.metal = 60; S.banked.ceramic = 40; WL.tp('haven'); UI.openStation('haven'); });
await page.click('#stationTabs [data-tab="way"]'); await page.waitForTimeout(150);
const hire = {};
hire.card = await ev(() => { const b = document.querySelector('#stationBody [data-hirec]'), c = b.closest('.orderCard'); const n = S.npcs.find(x => x.id === +b.dataset.hirec); window.__hand = n; return { id: n.id, name: c.querySelector('h4').textContent.trim(), cls: c.querySelector('.tag').textContent, meta: c.querySelector('.meta').textContent.replace(/\s+/g, ' ').trim(), btn: b.textContent, fee: n.fee, traits: n.traits.length, skills: Object.values(n.skills).every(v => v >= 0 && v <= 7), known: !!CHAR.CLASSES[n.cls] }; });
await page.click(`#stationBody [data-hirec="${hire.card.id}"]`); await page.waitForTimeout(200);
hire.hired = await ev(() => { UI2.updateMoodles(); const chip = document.getElementById('compChip'); return { state: __hand.state, paid: { metal: 60 - S.banked.metal, ceramic: 40 - S.banked.ceramic }, card: [...document.querySelectorAll('#stationBody .orderCard h4')].map(h => h.textContent.trim()).find(t => /walking with you/.test(t)) || '', chip: !chip.classList.contains('hidden') && chip.textContent.includes(__hand.name.split(' ')[0]) }; });
await page.click(`#stationBody [data-dismiss="${hire.card.id}"]`); await page.waitForTimeout(200);
hire.parted = await ev(() => ({ state: __hand.state, at: __hand.at, btn: (document.querySelector(`#stationBody [data-hirec="${__hand.id}"]`) || {}).textContent || null }));
await page.click(`#stationBody [data-hirec="${hire.card.id}"]`); await page.waitForTimeout(200);
hire.again = await ev(() => { const out = { state: __hand.state, paid: { metal: 60 - S.banked.metal, ceramic: 40 - S.banked.ceramic } }; UI.closeStation(); return out; });
ok('A WAYLIGHTER HIRED: at Haven\'s Hire tab (v3.49: the Waylighters tab is Hire) the waylighter by the fire is a legible build — a calling, their skills with levels, two traits at most, a line of their own, the ◆ they carry — and a real click on Companion pays their fee off the bank once and they fall in (the card walking with you, the party card on the HUD); parted at the fire by a real click they wait there, and hired again their fee is waived — one fee, for life',
  hire.card.known && hire.card.traits <= 2 && hire.card.skills && /^Companion · \d+ metal \+ \d+ ceramic$/.test(hire.card.btn) && /“.+”/.test(hire.card.meta) && /◆\d+/.test(hire.card.meta)
  && hire.hired.state === 'companion' && hire.hired.paid.metal === hire.card.fee.metal && hire.hired.paid.ceramic === hire.card.fee.ceramic && /walking with you$/.test(hire.hired.card) && hire.hired.chip
  && hire.parted.state === 'pool' && hire.parted.at === 'haven' && hire.parted.btn === 'Companion · fee waived' && hire.again.state === 'companion' && hire.again.paid.metal === hire.card.fee.metal,
  JSON.stringify(hire));

/* ================= 24 · THE COMPANION'S OWN BODY ================= */
await page.click('#compChip'); await page.waitForTimeout(200);
const body = {};
body.sheet = await ev(() => { const out = { them: document.getElementById('txThemKg').textContent, name: document.getElementById('txThemName').textContent, haul: __hand.skills.haul || 0 }; document.getElementById('packOv').classList.add('hidden'); return out; });
body.pace = await ev(() => {
  const H = DATA.stations.haven, n = __hand, foot0 = n.skills.foot;
  const ride = (withHand, foot) => { __as('courier'); S.horse = { loaner: true, rentedUntil: 0, on: true, spookT: 0 }; if (withHand) { n.state = 'companion'; n.skills.foot = foot; } else n.state = 'pool'; S.px = H.x + 520; S.py = H.y + 260; S.dir = 0; n.cx = S.px - 30; n.cy = S.py; const x0 = S.px; for (let i = 0; i < 5; i++) Systems.update(0.1, __in({ right: true })); return +((S.px - x0) / 0.5).toFixed(1); };
  const out = { alone: ride(false), slow: ride(true, 0), quick: ride(true, 8), capSlow: +(NPC.speedOf({ skills: { foot: 0 } }) * 1.12).toFixed(1) };
  n.skills.foot = foot0; n.state = 'companion'; S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 };
  return out;
});
body.steady = await ev(() => {
  const n = __hand, step = withHand => { __as('courier'); n.state = withHand ? 'companion' : 'pool'; n.hungry = false; __load(0.6); const P = __marsh; S.px = P[0]; S.py = P[1]; n.cx = S.px - 30; n.cy = S.py; S.stam = 100; const st0 = S.stats.steadies, sv0 = NPC.svc(n).steadies; S.flags.calm = false; __dice.force = 0; try { Systems.update(0.1, __in({ right: true })); } finally { __dice.force = null; S.flags.calm = true; } return { steadied: S.stats.steadies - st0, byThem: NPC.svc(n).steadies - sv0, wind: +(100 - S.stam).toFixed(2), ring: !!S.qte }; };
  const out = { alone: step(false), withHand: step(true) }; n.state = 'companion'; return out;
});
body.hunger = await ev(async () => { const n = __hand; S.banked.provisions = 0; n.fedT = 0.001; n.hungry = false; __toasts.length = 0; NPC.update(0.01); await __wait(60); const out = { hungry: n.hungry, said: __toasts.some(t => t.startsWith(`${n.name} is hungry — no provisions banked`)) }; S.banked.provisions = 20; n.hungry = false; n.fedT = 360; return out; });
/* a crate handed over by real clicks, then the Walker falls: the companion carries it home */
await ev(() => { __as('courier'); __hand.state = 'companion'; WL.tp(__open(DATA.stations.haven.x + 420, DATA.stations.haven.y + 240)); __hand.cx = S.px + 20; __hand.cy = S.py + 10; State.addCargo(State.makeItem('textiles')); UI2.updateMoodles(); });
await page.click('#compChip'); await page.waitForTimeout(200);
await page.click(`#txYou [data-txgive="${await ev(() => S.cargo.find(c => c.defId === 'textiles').id)}"]`); await page.waitForTimeout(150);
await page.click('#txClose'); await page.waitForTimeout(100);
body.insured = await ev(() => { const it = __hand.carry.find(c => c.defId === 'textiles'); window.__insured = it; S.mails.length = 0; WL.kill('bleed'); const lockers = S.stations.haven.storage.includes(it); return { handed: !!it, lockers, carryLeft: __hand.carry.length, state: __hand.state, at: __hand.at, mail: (S.mails.find(m => m.subj === `${__hand.name} carried it home`) || {}).body || '', grave: S.graves.length }; });
/* the next Walker, by the certificate and the form */
const nextWalker = async () => {
  await page.click('#deathContinue'); await page.waitForTimeout(300); await page.click('#cgBegin'); await page.waitForTimeout(400);
  return ev(() => { __shut(); S.stamMax = DATA.T.baseStam; window.__after = __netSnap ? __netSnap() : null; return { dead: S.dead, name: S.pName, cls: S.pClass, traits: S.pTraits.slice(), skills: Object.fromEntries(Object.entries(S.skills).map(([k, v]) => [k, `${v.lv}/${Math.round(v.total)}`])), equip: Object.values(S.equip).map(v => v ? v.defId : null), pack: S.cargo.map(c => c.defId), manuals: Object.keys(S.manuals || {}).length, at: DATA.stationOrder.find(id => U.dist(S.px, S.py, DATA.stations[id].x, DATA.stations[id].y) < 200) || null }; });
};
body.next = await nextWalker();
const DATA_AUTO = await ev(() => DATA.T.autoSteadyStam);
ok('THE COMPANION\'S OWN BODY: their Hauling sets what they carry (the hand-over sheet reads their thirty and six a level), their Footwork sets the pace — a slow walker holds a mounted Walker to their own stride and a quick one lets the horse run; they steady a wobble for you (the dice all falling, the load steadied by their hand, not your wind); they eat from the bank, and with the bank empty they go hungry and say so; and when the Walker falls, the crate handed to them by real clicks is carried home to the nearest lit town\'s lockers, the mail telling it, and they wait by that fire',
  body.sheet.them === `0.0 / ${30 + 6 * body.sheet.haul} kg` && Math.abs(body.pace.slow - body.pace.capSlow) < 0.2 && body.pace.alone > body.pace.slow + 30 && Math.abs(body.pace.quick - body.pace.alone) < 5
  && body.steady.withHand.steadied === 1 && body.steady.withHand.byThem === 1 && body.steady.alone.byThem === 0 && Math.abs(body.steady.alone.wind - body.steady.withHand.wind - DATA_AUTO) < 0.01 && !body.steady.withHand.ring && body.hunger.hungry && body.hunger.said
  && body.insured.handed && body.insured.lockers && body.insured.carryLeft === 0 && body.insured.state === 'pool' && body.insured.at === 'haven' && /Haven's lockers/.test(body.insured.mail) && !body.next.dead,
  JSON.stringify(body));

/* ================= 25 · A ROUTE PORTER ================= */
await ev(() => { __as('courier'); S.banked.metal = 60; S.banked.ceramic = 40; S.banked.provisions = 20; WL.tp('haven'); UI.openStation('haven'); });
await page.click('#stationTabs [data-tab="way"]'); await page.waitForTimeout(150);
const route = {};
route.tab = await ev(() => { const b = document.querySelector(`#stationBody [data-hirer="${__hand.id}"]`); return { head: document.querySelector('#stationBody p').textContent.replace(/\s+/g, ' '), charter: !!b, slots: NPC.routeSlots(), cov: +S.cov.toFixed(3), picks: [...document.querySelectorAll(`#stationBody [data-pick="${__hand.id}"] [data-route]`)].map(e => e.textContent), flow0: Economy.flowMul('haven', 'elm') }; });
await page.click(`#stationBody [data-hirer="${await ev(() => __hand.id)}"]`); await page.waitForTimeout(120);
await page.click(`#stationBody [data-route="${await ev(() => __hand.id)}:elm"]`); await page.waitForTimeout(200);
Object.assign(route, await ev(async () => {
  const r = __hand; UI.closeStation();
  const out = { state: r.state, leg: r.route && [r.route.a, r.route.b], flow1: Economy.flowMul('haven', 'elm'), interval: Math.round(r.route.t), want: Math.round(Math.min(150, Math.max(75, 150 - 5 * ((r.skills.foot || 0) + (r.skills.haul || 0) + (r.skills.bal || 0))))) };
  const l0 = { h: S.stations.haven.likesTo, e: S.stations.elm.likesTo, me: S.likes, prov: S.banked.provisions };
  r.route.t = 0.001; NPC.update(0.01);
  out.run = { runs: r.route.runs, haven: S.stations.haven.likesTo - l0.h, elm: S.stations.elm.likesTo - l0.e, walker: S.likes - l0.me, ate: +(l0.prov - S.banked.provisions).toFixed(2), next: Math.round(r.route.t) };
  S.banked.provisions = 0; r.route.t = 0.001; __toasts.length = 0; S.mails.length = 0; NPC.update(0.01); await __wait(60);
  out.stall = { hungry: r.hungry, runs: r.route.runs, mail: S.mails.some(m => m.subj === `${r.name}'s route is stalled`), said: __toasts.some(t => /route stalled — bank provisions/.test(t)) };
  S.banked.provisions = 20; NPC.update(0.01);
  return out;
}));
ok('A ROUTE PORTER: with the light over enough of the valley a charter slot opens; at Haven\'s Hire tab a real click on Charter route… offers only lit towns, and a real click on Haven ⇄ Elm Farm sets the waylighter on that road — the wire between the two now runs twice as strong; a run comes round on a clock set by their Footwork, Hauling and Balance and feeds both towns\' stars, the Walker\'s ◆ and half a provision; with the bank bare the route stalls, and says so',
  route.tab.slots >= 1 && route.tab.cov > 0.055 && route.tab.charter && route.tab.picks.length >= 1 && route.tab.picks.every(t => /^Haven ⇄ (Elm Farm|The Mill)$/.test(t)) && route.tab.flow0 === 1
  && route.state === 'route' && route.leg.join() === 'haven,elm' && route.flow1 === 2 && route.interval === route.want
  && route.run.runs === 1 && route.run.haven > 0 && route.run.haven === route.run.elm && route.run.walker === Math.round(route.run.haven * 0.6) && route.run.ate === 0.5 && route.run.next === route.want
  && route.stall.hungry && route.stall.runs === 1 && route.stall.mail && route.stall.said,
  JSON.stringify(route));

/* ================= 26 · THE EVENT DIRECTOR ================= */
const director = await ev(async () => {
  __as('courier'); WL.tp(__open(DATA.stations.haven.x + 420, DATA.stations.haven.y + 240));
  for (const id of ['stationOv', 'results', 'packOv', 'lootOv', 'traderOv']) document.getElementById(id).classList.add('hidden');
  const out = {};
  /* the first walk is taught, never interrupted */
  S.flags.guideDone = false; S.orders.prioIdx = 0; S.orders.prioAccepted = false; S.event = null; S.flags.firstEvent = false; S.eventCd = 0;
  NPC.update(0.01); out.firstWalk = { event: S.event, quiet: Guide.quiet() };
  S.flags.guideDone = true;
  /* the first event is always walkable profit: the dice held under a half, the Peddler (the Walker stood where the held dice's
     spot, 476 paces out at 2.1 radians, is open ground) */
  { const H = DATA.stations.haven, ux = Math.cos(0.3 * 7), uy = Math.sin(0.3 * 7), d = 380 + 0.3 * 320; let at = null;
    for (let r = 300; r < 3000 && !at; r += 40) for (let a = 0; a < 6.28 && !at; a += 0.2) { const x = H.x + Math.cos(a) * r, y = H.y + Math.sin(a) * r, t = World.terrainAt(x, y), t2 = World.terrainAt(x + ux * d, y + uy * d); if (!t.blocked && !t.water && !t2.blocked && !t2.water && World.mistAt(x, y) < 0.5) at = [x, y]; }
    WL.tp(at); S.dir = 0.3 * 7; }   // facing the way the lantern will be: the strip reads what is ahead
  __toasts.length = 0; S.eventCd = 0; __dice.force = 0.3; try { NPC.update(0.01); } finally { __dice.force = null; }
  const ev1 = S.event; await __settle(); await __wait(1200);   // the strip's needle swings round to the facing
  out.first = { type: ev1 && ev1.type, dist: ev1 ? Math.round(U.dist(S.px, S.py, ev1.x, ev1.y)) : null, said: __toasts.find(t => /the Peddler/.test(t)) || '', mark: __marks().find(t => /^! /.test(t)) || null, marks: __marks(), tray: (document.querySelector('#orderTray .trayCard .dest') || {}).textContent || null, clock: ((document.querySelector('#orderTray .trayCard .sub .num') || {}).textContent) || null };
  /* one at a time: the clock runs out again and nothing new comes */
  S.eventCd = 0; NPC.update(0.01); out.oneAtATime = S.event === ev1;
  window.__peddler = ev1;
  WL.tp([ev1.x - 30, ev1.y + 10]); S.banked.metal = 60; S.banked.ceramic = 40;
  out.rail = Systems.getInteractions().filter(i => i.key === 'E').map(i => i.label.replace(/<[^>]+>/g, ''))[0];
  return out;
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(200);
director.cart = await ev(() => ({ open: !document.getElementById('traderOv').classList.contains('hidden'), rows: [...document.querySelectorAll('#traderBody .rowline h4')].map(h => h.textContent) }));
await page.click('#traderBody [data-buy="0"]'); await page.waitForTimeout(150);
Object.assign(director, await ev(async () => {
  const bought = __peddler.data.stock[0]; const out = { bought: { item: bought.item.defId, sold: bought.sold, onBack: S.cargo.includes(bought.item), paid: { metal: 60 - S.banked.metal, ceramic: 40 - S.banked.ceramic } } };
  document.getElementById('traderClose').click();
  /* and it goes: its clock run out, its line said */
  __toasts.length = 0; S.eventCd = 99999; __peddler.t = 0.001; NPC.update(0.01); const left = S.event; await __wait(60);
  out.gone = { event: left, said: __toasts.includes('The Peddler\'s lantern dwindles down the road') };
  return out;
}));
ok('THE EVENT DIRECTOR: nothing interrupts the first walk (its clock run out, no event while the first delivery is untaught); the first event after it is walkable profit — the Peddler\'s lantern a few hundred paces off, said aloud, a ! on the compass and a card on the tray with its clock; one event at a time (the clock runs out again and nothing new comes); a real E at the cart opens the Peddler\'s wares — manuals, a charm, gear, food, salve for materials — and a real click on Trade buys the first; and the event goes when its clock runs out, with its line',
  director.firstWalk.event === null && director.firstWalk.quiet && director.first.type === 'peddler' && director.first.dist >= 380 && director.first.dist <= 700 && !!director.first.said && !!director.first.mark && director.first.tray === '! The Peddler' && /^\d+:\d\d$/.test(director.first.clock) && director.oneAtATime
  && director.rail === 'Trade with the Peddler' && director.cart.open && director.cart.rows.length === 6 && director.bought.sold && director.bought.onBack && /^man_/.test(director.bought.item) && director.bought.paid.metal === 40 && director.bought.paid.ceramic === 30
  && director.gone.event === null && director.gone.said,
  JSON.stringify(director));

/* ================= 27 · A RESCUE ================= */
const rescue = await ev(async () => {
  __as('courier'); __clean(); WL.tp(__open(DATA.stations.haven.x + 420, DATA.stations.haven.y + 240));
  /* a waylighter down, as the director posts one (its own shape and clock) */
  const npc = NPC.gen({}); const [x, y] = __open(S.px + 520, S.py - 200);
  S.event = { id: U.uid(), type: 'rescueInjured', x, y, t: CHAR.EVENTS.rescueInjured.ttl, data: { npc } };
  window.__down = npc;
  await __settle();
  const out = { mark: __marks().find(t => /^! /.test(t)) || null, tray: (document.querySelector('#orderTray .trayCard .dest') || {}).textContent || null };
  WL.tp([x - 30, y + 10]);
  out.empty = Systems.getInteractions().filter(i => i.key === 'E').map(i => i.label.replace(/<[^>]+>/g, ''))[0];
  State.addCargo(State.makeItem('bandage'));
  out.withBandage = Systems.getInteractions().filter(i => i.key === 'E').map(i => i.label.replace(/<[^>]+>/g, ''))[0];
  window.__rs = { likes: S.likes, mend: S.skills.mend.total }; S.mails.length = 0;
  return out;
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(200);
Object.assign(rescue, await ev(() => {
  const n = __down, out = { event: S.event, bond: n.bond, feeWaived: n.feeWaived, state: n.state, at: n.at, inRoll: S.npcs.includes(n), likes: S.likes - __rs.likes, mend: +(S.skills.mend.total - __rs.mend).toFixed(1), bandage: S.cargo.some(c => c.defId === 'bandage'), mail: (S.mails.find(m => m.subj === `${n.name} owes you their walk`) || {}).body || '' };
  WL.tp(n.at); UI.openStation(n.at);
  return out;
}));
await page.click('#stationTabs [data-tab="way"]'); await page.waitForTimeout(150);
rescue.card = await ev(() => { const b = document.querySelector(`#stationBody [data-hirec="${__down.id}"]`), c = b && b.closest('.orderCard'); const out = c ? { owes: !!c.querySelector('.constraint'), btn: b.textContent } : null; UI.closeStation(); return out; });
ok('A RESCUE: a waylighter down in the field is an event — a ! on the compass and a card on the tray; walked up to, the rail asks for what they need (a bandage or salve) and with one on the back offers to treat them; a real E binds the wound and they are saved — bonded for good, their fee waived forever, walked to the nearest lit town to wait by its fire; +25 ◆, Mending learned, the mail; and at that town\'s Hire tab their card says they owe you, their hire free',
  !!rescue.mark && rescue.tray === '! Waylighter down' && rescue.empty === 'They need a bandage or salve' && rescue.withBandage === `Treat ${await ev(() => __down.name)} (Bandage)`
  && rescue.event === null && rescue.bond && rescue.feeWaived && rescue.state === 'pool' && rescue.inRoll && rescue.likes === 25 && rescue.mend === 18 && !rescue.bandage && /no fee, ever/.test(rescue.mail)
  && rescue.card && rescue.card.owes && rescue.card.btn === 'Companion · fee waived',
  JSON.stringify(rescue));

/* the frame one change makes, around (x, y): grab, change, redraw, grab, undo */
await ev(() => {
  window.__look = async (x, y, zoom = 3) => { S.weather = { state: 'clear', t: 99999, intensity: 0 }; const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3; for (const n of NPC.party()) { n.cx = x + 900; n.cy = y + 900; } __clearAmb(x, y, 400); S.wraiths.length = 0; Render.clearFx(); Render.setFx(false); Render.setZoom(zoom); Render.cam.x = x; Render.cam.y = y; await __wait(250); await __frames(3); };
  window.__with = async (x, y, rad, change, undo) => { const A = __grab(x, y, rad); change(); await __wait(120); await __frames(3); const B = __grab(x, y, rad); undo(); await __wait(120); await __frames(3); return { A, B }; };
  window.__quietAt = (x, y) => { for (let r = 0; r < 1200; r += 30) for (let a = 0; a < 6.28; a += 0.35) { const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r, t = World.terrainAt(px, py); if (t.blocked || t.water || t.slope > 0.2) continue; if (S.ruins.some(q => U.dist(q.x, q.y, px, py) < 160) || S.graves.some(q => U.dist(q.x, q.y, px, py) < 160) || S.nodes.some(q => !q.taken && U.dist(q.x, q.y, px, py) < 120) || S.drops.some(q => U.dist(q.x, q.y, px, py) < 120) || S.structures.some(q => U.dist(q.x, q.y, px, py) < 200) || DATA.stationOrder.some(id => U.dist(DATA.stations[id].x, DATA.stations[id].y, px, py) < 300)) continue; return [px, py]; } return null; };
});

/* ================= 28 · DEATH IN THE LIGHT ================= */
/* the walker who will fall: skills earned, a delivery made at Elm (the journal transcribed there), then more learned */
const pre = await ev(async () => {
  __as('medic'); S.pName = 'Tarn Kettle'; __clean(); S.orders.active.length = 0;
  Porter.xp('foot', 200, true); Porter.xp('haul', 150, true); Porter.xp('mend', 80, true);
  S.stations.elm.stock.tools = 40; WL.tp('haven'); const b = Systems.boardFor('haven').find(x => !x.prio && x.def.item === 'tools' && x.def.to === 'elm'); Systems.acceptOrder(b.def, false); WL.tp('elm'); Systems.handleDelivery('elm'); __shut();
  const atDelivery = { journal: { ...S.journal.xp }, totals: Object.fromEntries(Object.entries(S.skills).map(([k, v]) => [k, Math.round(v.total)])) };
  Porter.xp('climb', 300, true);   // learned after the last delivery
  WL.tp('haven');
  return { atDelivery };
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(150);
pre.atTerminal = await ev(() => { const out = { sheet: !document.getElementById('stationOv').classList.contains('hidden'), climbInJournal: S.journal.xp.climb || 0, climbTotal: Math.round(S.skills.climb.total) }; __shut(); return out; });
const light = await ev(async () => {
  const spot = __quietAt(DATA.stations.haven.x + 700, DATA.stations.haven.y + 100);
  WL.tp(spot); S.equip.boots = State.makeItem('boots_tread'); Porter.dirty();
  S.stations.elm.stock.tools = 40; const b = Systems.boardFor('haven').find(x => !x.prio && x.def.item === 'tools' && x.def.to === 'elm'); const o = Systems.acceptOrder(b.def, false);
  State.addCargo(State.makeItem('ration'));
  window.__before = __netSnap(); window.__dying = { name: S.pName, cls: S.pClass, skills: Object.values(S.skills).reduce((a, v) => a + v.total, 0) };
  S.mails.length = 0; const lit = +World.lightAt(S.px, S.py).toFixed(2), mist = +World.mistAt(S.px, S.py).toFixed(2);
  WL.kill('bleed');
  const g = S.graves[S.graves.length - 1]; window.__cairn = g;
  return { lit, mist, dead: S.dead, sheet: !document.getElementById('deathOv').classList.contains('hidden'), name: document.getElementById('deathName').textContent, cause: document.getElementById('deathCause').textContent, note: document.getElementById('deathNote').textContent,
    grave: { at: [Math.round(g.x - spot[0]), Math.round(g.y - spot[1])], wraith: g.wraith, items: g.items.map(i => `${i.defId}${i.lostTo ? '>' + i.lostTo : ''}`), journal: !!g.journal }, roster: S.echoRoster.includes(g.name), mails: S.mails.map(m => m.subj), active: S.orders.active.length };
});
light.next = await nextWalker();
light.after = await ev(() => __after);
Object.assign(light, await ev(async () => {
  const g = __cairn; await __settle(); const mark = __marks().find(t => /^cairn /.test(t)) || null;
  await __look(g.x, g.y - 10, 3);
  const i = S.graves.indexOf(g), z = Render.effZoom(), rad = 11;   // the stack of cut stones: nine texels of 2.5 wide, eight high, its foot on the grave
  const w2 = await __with(g.x, g.y - 3, rad, () => { S.graves.splice(i, 1); }, () => { S.graves.splice(i, 0, g); });
  const lum = d => { let t = 0; for (let k = 0; k < d.length; k += 4) t += d[k] + d[k + 1] + d[k + 2]; return t / (d.length / 4); };
  WL.tp('haven'); Render.setZoom(null);
  return { mark, cairn: { changed: __diff(w2.A, w2.B), of: (w2.A.length / 4) | 0, grey: +(lum(w2.A) - lum(w2.B)).toFixed(1) } };
}));
ok('DEATH IN THE LIGHT: a Walker who falls on lit ground gets the certificate (their name, their calling and how the road took them, "the cairn holds everything they carried"), and a cairn rises where they fell holding everything they carried — the order\'s crate, marked lost toward its door, the boots they bought, the ration — with their journal; their name joins the walkers the light remembers (the mail says so) and the order is lost with them; after the next Walker is enlisted by real clicks the cairn stands on the ground where they fell (a quarter and more of the square over its stack changed, against the same frame without it) and keeps its mark on the compass',
  light.lit > 0.3 && light.mist < 0.5 && light.dead && light.sheet && light.name === 'Tarn Kettle fell.' && light.cause === 'Field Medic · bled out on the road' && /The cairn holds everything they carried/.test(light.note)
  && Math.hypot(...light.grave.at) < 1 && !light.grave.wraith && light.grave.items.includes('tools>elm') && light.grave.items.includes('boots_tread') && light.grave.items.includes('ration') && light.grave.journal && light.roster
  && light.mails.includes('Tarn Kettle walks the network now') && light.mails.includes('Order lost with Tarn Kettle') && light.active === 0 && !light.next.dead
  && !!light.mark && light.cairn.changed > light.cairn.of * 0.25,
  JSON.stringify(light));

/* ================= 29 · DEATH IN THE GREY ================= */
const grey = await ev(async () => {
  __as('scavenger'); S.pName = 'Wren Ashdown'; __clean();
  let spot = null; for (let i = 0; i < 40000 && !spot; i++) { const x = 400 + ((i * 7919) % (World.W - 800)), y = 3200 + ((i * 104729) % 6000), t = World.terrainAt(x, y); if (!t.blocked && !t.water && t.slope < 0.2 && World.mistAt(x, y) > 0.62 && World.mistAt(x, y) < 0.8 && !DATA.camps.some(c => U.dist(x, y, c.x, c.y) < c.r + 150) && !S.ruins.some(q => U.dist(q.x, q.y, x, y) < 200)) spot = [x, y]; }
  WL.tp(spot); State.addCargo(State.makeItem('textiles')); S.mails.length = 0; S.wraiths.length = 0;
  WL.kill('wraith');
  const g = S.graves[S.graves.length - 1]; window.__kept = g;
  return { mist: +World.mistAt(spot[0], spot[1]).toFixed(2), wraith: g.wraith, name: g.name, rosterAtDeath: S.echoRoster.includes(g.name), mails: S.mails.map(m => m.subj), note: document.getElementById('deathNote').textContent };
});
grey.next = await nextWalker();
Object.assign(grey, await ev(async () => {
  const g = __kept; await __settle(); const mark = __marks().find(t => /^kept /.test(t)) || null;
  await __look(g.x, g.y - 20, 3);
  const TL = Render.texelLaw(), T2 = TL.rigK / TL.zw, cx0 = g.x, cy0 = g.y - 16 * T2, rad = 20 * T2;
  const i = S.graves.indexOf(g); const w = await __with(cx0, cy0, rad, () => { S.graves.splice(i, 1); }, () => { S.graves.splice(i, 0, g); });
  /* where the change stands: inside the courier's own 32×32 frame (16 texels either side, 32 up from its feet) */
  const W2 = Math.round(rad * 2 * devicePixelRatio), z = Render.effZoom(); let inBox = 0, all = 0, blue = 0;
  for (let k = 0; k < Math.min(w.A.length, w.B.length); k += 4) {
    if (Math.abs(w.A[k] - w.B[k]) + Math.abs(w.A[k + 1] - w.B[k + 1]) + Math.abs(w.A[k + 2] - w.B[k + 2]) <= 60) continue;
    all++;
    const dx = ((k / 4) % W2 - W2 / 2) / z, dy = ((((k / 4) / W2) | 0) - W2 / 2) / z;   // world units from the frame's middle (16 texels up from its feet)
    if (Math.abs(dx) <= 16 * T2 + 1 && Math.abs(dy) <= 16 * T2 + 1) inBox++;
    if (w.A[k] + w.A[k + 1] + w.A[k + 2] > w.B[k] + w.B[k + 1] + w.B[k + 2]) blue++;   // the kept walker is paler than the grey behind them
  }
  return { mark, ghost: { changed: all, inBox, blue, T2: +T2.toFixed(2) } };
}));
/* a flare burned over the kept walker frees them */
await ev(() => { const g = __kept; Render.setZoom(null); WL.tp([g.x + 260, g.y + 40]); S.wraiths.length = 0; S.gear.flares = 1; S.flareCd = 0; window.__gl = S.likes; S.mails.length = 0; });
await page.keyboard.press('KeyF'); await page.waitForTimeout(150);
Object.assign(grey, await ev(async () => {
  const g = __kept; const out = { freed: !g.wraith, rosterFreed: S.echoRoster.includes(g.name), likes: S.likes - __gl, mail: S.mails.some(m => m.subj === `${g.name} is free`), stands: S.graves.includes(g) };
  await __look(g.x, g.y - 10, 3); const i2 = S.graves.indexOf(g), w3 = await __with(g.x, g.y - 3, 11, () => { S.graves.splice(i2, 1); }, () => { S.graves.splice(i2, 0, g); }); out.cairnNow = { changed: __diff(w3.A, w3.B), of: (w3.A.length / 4) | 0 };
  Render.setZoom(null); WL.tp('haven'); S.wraiths.length = 0;
  return out;
}));
ok('DEATH IN THE GREY: a Walker who falls in the deep grey is kept by it — no name on the network yet, the mail and the certificate say the Grey kept them and that light frees the kept; after the next Walker is enlisted the kept walker stands where they fell, the courier\'s own frame in the ghost\'s pale palette (against the same frame without them, the change inside the courier\'s 32×32 box and paler than the grey behind), with a "kept" mark on the compass from anywhere; a flare burned over them (a real F) frees them — their name joins the network, +30 ◆, the mail — and the cairn remains in its cut stones',
  grey.mist > 0.5 && grey.wraith && !grey.rosterAtDeath && grey.mails.includes('The Grey kept Wren Ashdown') && /The Grey kept them/.test(grey.note) && !grey.next.dead
  && !!grey.mark && grey.ghost.changed > 150 && grey.ghost.inBox > grey.ghost.changed * 0.8 && grey.ghost.blue > grey.ghost.changed * 0.6
  && grey.freed && grey.rosterFreed && grey.likes === 30 && grey.mail && grey.stands && grey.cairnNow.changed > grey.cairnNow.of * 0.25,
  JSON.stringify(grey));

/* ================= 30 · THE JOURNAL ================= */
const journal = await ev(async () => {
  const g = __cairn, j = g.journal;
  __as('courier'); S.pName = 'Juno Reyes';
  const t0 = Object.fromEntries(Object.entries(S.skills).map(([k, v]) => [k, v.total]));
  WL.tp([g.x - 30, g.y + 10]); S.wraiths.length = 0; __toasts.length = 0;
  window.__jt0 = t0;
  return { recorded: { ...j.xp }, name: j.name, rail: Systems.getInteractions().filter(i => i.key === 'E').map(i => i.label.replace(/<[^>]+>/g, ''))[0] };
});
await page.keyboard.press('KeyE'); await page.waitForTimeout(150);
Object.assign(journal, await ev(async () => {
  await __wait(60);
  const gained = Object.fromEntries(Object.entries(S.skills).map(([k, v]) => [k, Math.round(v.total - __jt0[k])]).filter(([, v]) => v));
  const out = { gained, pack: S.cargo.filter(c => c.cat !== 'tool').map(c => c.defId), cairnGone: !S.graves.includes(__cairn), said: __toasts.find(t => /^Read Tarn Kettle's journal/.test(t)) || '' };
  WL.tp('haven');
  return out;
}));
const want70 = Object.fromEntries(Object.entries(journal.recorded).map(([k, v]) => [k, Math.round(v * 0.7)]).filter(([, v]) => v));
ok('THE JOURNAL: every terminal visit transcribes it — at Elm Farm\'s terminal with a crate handed over it holds the skills as they stood, and at Haven\'s terminal (a real E, nothing to hand over) it takes the Climbing learned since; recovered from the cairn by the next Walker (a real E), the pack comes back onto their back and the journal is read — 70% of every skill it recorded, the toast saying whose hands remember',
  JSON.stringify(pre.atDelivery.journal) === JSON.stringify(pre.atDelivery.totals) && pre.atTerminal.sheet && pre.atTerminal.climbInJournal === pre.atTerminal.climbTotal
  && journal.rail === 'Recover Tarn Kettle\'s pack & journal' && JSON.stringify(journal.gained) === JSON.stringify(want70) && journal.pack.includes('tools') && journal.pack.includes('ration') && journal.cairnGone && !!journal.said,
  JSON.stringify({ pre, journal, want70 }));

/* ================= 31 · THE WALKER IS MORTAL, THE NETWORK IS NOT ================= */
const heir = light.next, before = await ev(() => __before), after = light.after;
ok('THE WALKER IS MORTAL, THE NETWORK IS NOT: across a death and a New character the valley is exactly as it stood — every station\'s light, stars and likes, the structures (the laid ladder among them), the bank, the ◆, the route porter still on the road, the rescued hand still waiting by the fire — while the body starts over: the heir enlisted by real clicks at the certificate is a fresh Courier at Haven with no traits, nothing learned past the calling\'s levels, the worn kit, no manual studied, and a borrowed pack (a ration and a ladder)',
  !!after && before.stations === after.stations && before.structures === after.structures && before.bank === after.bank && before.likes === after.likes && before.routes === after.routes && before.routes.length > 0 && before.bonded === after.bonded && before.bonded.length > 0 && after.ladder
  && !heir.dead && heir.cls === 'courier' && heir.traits.length === 0 && Object.entries(heir.skills).every(([k, v]) => v === ({ foot: '2/0', bal: '1/0' }[k] || '0/0')) && heir.equip.join() === 'boots0,coat0,pack0,' && heir.manuals === 0 && heir.pack.join() === 'ration,ladderTool' && heir.at === 'haven',
  JSON.stringify({ before, after, heir }));

/* ================= 32 · RIVERBANKS NEVER CLIFFS ================= */
await ev(() => {
  /* the authored four-tone ramps every texel of ground is painted from, class by class */
  window.__RAMP = { 0: [[50, 72, 42], [70, 94, 50], [92, 116, 56], [114, 136, 64]], 1: [[26, 46, 34], [38, 62, 40], [52, 78, 46], [68, 94, 52]], 2: [[94, 86, 62], [118, 108, 76], [140, 128, 90], [162, 148, 104]], 3: [[90, 98, 106], [112, 120, 128], [136, 144, 150], [160, 168, 173]], 4: [[170, 186, 198], [196, 210, 218], [220, 230, 236], [242, 248, 250]], 5: [[42, 60, 40], [54, 74, 46], [68, 88, 52], [82, 100, 58]], 6: [[36, 106, 112], [50, 128, 132], [64, 146, 146], [80, 162, 158]], 7: [[12, 42, 64], [18, 56, 82], [24, 70, 98], [32, 84, 114]], 8: [[38, 42, 50], [52, 56, 64], [66, 71, 79], [82, 87, 95]], 9: [[86, 78, 62], [106, 96, 76], [126, 114, 90], [146, 132, 104]] };
  window.__NAMES = ['meadow', 'forest', 'scree', 'rock', 'snowfield', 'marsh', 'shallows', 'deep water', 'cliff', 'station yard'];
  window.__byCol = new Map(); for (const [c, ramp] of Object.entries(__RAMP)) for (const col of ramp) __byCol.set(col.join(), +c);
  window.__painted = (x, y) => { const d = World.tc.getContext('2d').getImageData((x / World.TS) | 0, (y / World.TS) | 0, 1, 1).data, c = __byCol.get(d[0] + ',' + d[1] + ',' + d[2]); return c === undefined ? 'overpainted' : __NAMES[c]; };
  /* the Walker's own step at fifty a second, the mouse held on a point of the ground */
  window.__walk = (sx, sy, tx, ty, secs, until) => {
    __vit(); __clean(); S.px = sx; S.py = sy; let stuck = 0, t = 0, last = [sx, sy]; const track = [];
    for (let _i = 0; _i < Math.round(secs * 50); _i++) {
      Systems.update(0.02, __in({ ml: true, mouse: { x: tx, y: ty } })); t += 0.02; S.stam = S.stamMax;
      if (Math.hypot(S.px - last[0], S.py - last[1]) < 0.01) stuck++; last = [S.px, S.py]; track.push(last);
      if ((until && until()) || Math.hypot(tx - S.px, ty - S.py) < 14) break;
    }
    S.moveTo = null;
    return { t: +t.toFixed(2), stuck, at: [+S.px.toFixed(1), +S.py.toFixed(1)], track };
  };
});
const banks = await ev(() => {
  __as('courier'); WL.calm();
  const CS = 6, out = { rivers: [] };
  /* every ground cell within three widths of each river, named at its centre as the bake named it */
  for (let ri = 0; ri < DATA.rivers.length; ri++) {
    const rv = DATA.rivers[ri], L = U.polyLen(rv.pts), seen = new Set(), o = { river: rv.name, bank: 0, cliff: 0, steep: 0, steepAs: {}, past: 0, pastCliff: 0 };
    for (let d = 0; d <= L; d += 6) {
      const p = U.polyAt(rv.pts, d), a = U.polyAt(rv.pts, Math.max(0, d - 6)), b = U.polyAt(rv.pts, Math.min(L, d + 6)), tl = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / tl, ny = (b.x - a.x) / tl;
      for (let s = -3.2 * rv.w; s <= 3.2 * rv.w; s += 3) {
        const x = p.x + nx * s, y = p.y + ny * s;
        if (x < 12 || y < 12 || x > World.W - 12 || y > World.H - 12) continue;
        const k = ((y / CS) | 0) * 100000 + ((x / CS) | 0); if (seen.has(k)) continue; seen.add(k);
        const X = ((x / CS) | 0) * CS + CS / 2, Y = ((y / CS) | 0) * CS + CS / 2, rr = World.riverAt(X, Y), c = World.classAt(X, Y), t = World.terrainAt(X, Y);
        if (c === 9 || rr.idx === 255) continue;   // a station's yard is its own ground
        const w = DATA.rivers[rr.idx].w;
        if (rr.dist < w * 2.6) { o.bank++; if (c === World.CLIFF) o.cliff++; if (rr.dist >= w * 1.15 && t.slope > 0.62) { o.steep++; o.steepAs[__NAMES[c]] = (o.steepAs[__NAMES[c]] || 0) + 1; } }
        else if (rr.dist < w * 3.2 && t.slope > 0.62) { o.past++; if (c === World.CLIFF) o.pastCliff++; }
      }
    }
    out.rivers.push(o);
  }
  /* the steepest bank a Walker can go straight down, on Elm Creek and on the Silt */
  const section = ri => {
    const rv = DATA.rivers[ri], L = U.polyLen(rv.pts); let best = null;
    for (let d = 200; d <= L - 200; d += 10) {
      const p = U.polyAt(rv.pts, d), a = U.polyAt(rv.pts, d - 6), b = U.polyAt(rv.pts, d + 6), tl = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / tl, ny = (b.x - a.x) / tl;
      for (const side of [-1, 1]) {
        let fine = true, steep = 0, as = null;
        for (let s = 2.5 * rv.w; s >= rv.w && fine; s -= 2) { const x = p.x + nx * s * side, y = p.y + ny * s * side, rr = World.riverAt(x, y), t = World.terrainAt(x, y); if (rr.idx !== ri || t.blocked || World.classAt(x, y) === 9) fine = false; else if (rr.dist >= rv.w * 1.15 && t.slope > steep) { steep = t.slope; as = t.cls; } }
        if (fine && steep > 0.62 && as === World.SCREE && World.classAt(p.x + nx * rv.w * side, p.y + ny * rv.w * side) === World.SHALLOW && (!best || steep > best.steep))
          best = { steep, sx: p.x + nx * 2.5 * rv.w * side, sy: p.y + ny * 2.5 * rv.w * side, cx: p.x, cy: p.y, wx: p.x + nx * rv.w * side, wy: p.y + ny * rv.w * side };
      }
    }
    return best;
  };
  const down = c => {
    const w = __walk(c.sx, c.sy, c.cx, c.cy, 6, () => World.terrainAt(S.px, S.py).water);
    return { steep: +c.steep.toFixed(2), from: [Math.round(c.sx), Math.round(c.sy)], t: w.t, stuck: w.stuck, wet: World.terrainAt(S.px, S.py).water && !World.terrainAt(S.px, S.py).blocked, feet: __NAMES[World.classAt(S.px, S.py)], painted: [...new Set(w.track.map(([x, y]) => __painted(x, y)))] };
  };
  const creek = section(0), silt = section(1); window.__silt = silt;
  out.creek = creek && down(creek); out.silt = silt && down(silt);
  WL.tp('haven');
  return out;
});
const bankSum = banks.rivers.reduce((a, r) => ({ past: a.past + r.past, pastCliff: a.pastCliff + r.pastCliff }), { past: 0, pastCliff: 0 });
ok('RIVERBANKS NEVER CLIFFS: the carve makes a bank steep, but a bank is a bank — around Elm Creek, the Silt and Cold Run not one ground cell within two and a half widths of its water is cliff, though thousands of them are steeper than the cliff line (a slope over 0.62) and lie as scree or marsh, while just past the bank the same steepness is cliff every time; and the Walker, the mouse held on the water, walks straight down the steepest bank of Elm Creek and of the Silt into the shallows without a single stopped step, over ground painted scree and never cliff',
  banks.rivers.length === 3 && banks.rivers.every(r => r.bank > 1000 && r.cliff === 0 && r.steep > 100 && Object.keys(r.steepAs).every(k => k === 'scree' || k === 'marsh'))
  && bankSum.past > 0 && bankSum.pastCliff === bankSum.past
  && [banks.creek, banks.silt].every(w => w && w.steep > 0.62 && w.stuck === 0 && w.wet && w.feet === 'shallows' && w.painted.includes('scree') && !w.painted.includes('cliff')),
  JSON.stringify(banks));

/* ================= 33 · ONLY PAINTED CLIFFS AND DEEP WATER BLOCK ================= */
const stops = await ev(() => {
  __as('courier'); WL.calm();
  const TS = World.TS, TW = World.tc.width, TH = World.tc.height, img = World.tc.getContext('2d').getImageData(0, 0, TW, TH).data;
  const yard = (x, y) => Object.values(DATA.stations).some(s => U.dist(x, y, s.x, s.y) < 130);
  /* the whole valley, a texel centre every seven texels: what stops the feet against what the eye is shown */
  const g = { points: 0, overpainted: 0, stop: 0, stopPainted: 0, stopElse: 0, painted: 0, cliff: 0, deep: 0, paintedOpen: 0, paintedOpenYard: 0, named: 0 };
  for (let ty = 3; ty < TH - 3; ty += 7) for (let tx = 3; tx < TW - 3; tx += 7) {
    const x = tx * TS + TS / 2, y = ty * TS + TS / 2, i = (ty * TW + tx) * 4, pc = __byCol.get(img[i] + ',' + img[i + 1] + ',' + img[i + 2]);
    g.points++;
    if (pc === undefined) { g.overpainted++; continue; }   // a worn path or a laid road over the ground
    const t = World.terrainAt(x, y), pb = pc === World.CLIFF || pc === World.DEEP;
    if (pc === World.classAt(x, y)) g.named++;
    if (t.blocked) { g.stop++; if (pb) g.stopPainted++; else g.stopElse++; }
    if (pb) { g.painted++; if (pc === World.CLIFF) g.cliff++; else g.deep++; if (!t.blocked) { g.paintedOpen++; if (yard(x, y)) g.paintedOpenYard++; } }
  }
  const out = { grid: g };
  /* how far from a point the nearest texel painted as that ground lies (0 when the point is on one) */
  const nearPaint = (x, y, name) => { let best = Infinity; const tx0 = (x / TS) | 0, ty0 = (y / TS) | 0; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const tx = tx0 + i, ty = ty0 + j; if (__painted(tx * TS + TS / 2, ty * TS + TS / 2) !== name) continue; best = Math.min(best, Math.hypot(Math.max(tx * TS - x, 0, x - (tx + 1) * TS), Math.max(ty * TS - y, 0, y - (ty + 1) * TS))); } return +best.toFixed(2); };
  /* a painted cliff met head-on, on open ground in the valley: the feet stop at its face */
  let cl = null;
  for (const [y0, y1] of [[7900, 10900], [900, 7900]]) for (let y = y0; y < y1 && !cl; y += 29) for (let x = 600; x < 7800 && !cl; x += 23) {
    const t = World.terrainAt(x, y); if (t.blocked || t.water || yard(x, y)) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      let edge = null, fine = true;
      for (let s = 1; s <= 70; s++) { const tt = World.terrainAt(x + dx * s, y + dy * s); if (tt.blocked) { edge = s; break; } if (tt.water) { fine = false; break; } }
      if (!fine || edge === null || edge < 40 || World.classAt(x + dx * (edge + 1), y + dy * (edge + 1)) !== World.CLIFF) continue;
      let solid = true; for (let s = edge; s <= edge + 15; s++) if (!World.terrainAt(x + dx * s, y + dy * s).blocked) solid = false;
      if (solid) { cl = { x, y, dx, dy }; break; }
    }
  }
  if (cl) {
    let e = null; for (let s = 0; s <= 72 && e === null; s += 0.25) if (World.terrainAt(cl.x + cl.dx * s, cl.y + cl.dy * s).blocked) e = s;
    const w = __walk(cl.x, cl.y, cl.x + cl.dx * (e + 40), cl.y + cl.dy * (e + 40), 3);
    const along = (w.at[0] - cl.x) * cl.dx + (w.at[1] - cl.y) * cl.dy, ax = w.at[0] + cl.dx * 3, ay = w.at[1] + cl.dy * 3;
    out.cliff = { from: [cl.x, cl.y], dir: [cl.dx, cl.dy], edge: e, walked: +along.toFixed(2), short: +(e - along).toFixed(2), stopped: w.stuck, feet: World.terrainAt(w.at[0], w.at[1]).blocked ? 'blocked' : 'open', aheadStops: World.terrainAt(ax, ay).blocked, paintedWithin: nearPaint(w.at[0], w.at[1], 'cliff') };
  }
  /* wading into the Silt from its bank: the shallows take the feet, the deep water stops them */
  { const c = __silt, w = __walk(c.wx, c.wy, c.cx, c.cy, 4), d = Math.hypot(c.cx - S.px, c.cy - S.py), ux = (c.cx - S.px) / d, uy = (c.cy - S.py) / d, ax = S.px + ux * 3, ay = S.py + uy * 3;
    out.deep = { waded: +Math.hypot(S.px - c.wx, S.py - c.wy).toFixed(1), stopped: w.stuck, feet: __NAMES[World.classAt(S.px, S.py)], feetOpen: !World.terrainAt(S.px, S.py).blocked, aheadStops: World.terrainAt(ax, ay).blocked, paintedWithin: nearPaint(S.px, S.py, 'deep water') }; }
  /* the steepest scree off the rivers, just under the cliff line, crossed on its fall line */
  let sc = null;
  for (let y = 900; y < World.H - 900 && !sc; y += 17) for (let x = 400; x < World.W - 400 && !sc; x += 13) {
    const t = World.terrainAt(x, y); if (t.cls !== World.SCREE || t.slope < 0.56 || t.slope > 0.62) continue;
    const rr = World.riverAt(x, y); if (rr.idx !== 255 && rr.dist < DATA.rivers[rr.idx].w * 3) continue;
    const m = Math.hypot(t.sx, t.sy), ux = t.sx / m, uy = t.sy / m; let open = true;
    for (let s = -30; s <= 30 && open; s++) { const tt = World.terrainAt(x + ux * s, y + uy * s); if (tt.blocked || tt.water) open = false; }
    if (open) sc = { x, y, slope: +t.slope.toFixed(3), ux, uy };
  }
  if (sc) { const w = __walk(sc.x - sc.ux * 30, sc.y - sc.uy * 30, sc.x + sc.ux * 30, sc.y + sc.uy * 30, 6); out.scree = { at: [sc.x, sc.y], slope: sc.slope, painted: __painted(sc.x, sc.y), t: w.t, stopped: w.stuck, crossed: Math.hypot(sc.x + sc.ux * 30 - S.px, sc.y + sc.uy * 30 - S.py) < 15 }; }
  WL.tp('haven');
  return out;
});
ok('ONLY PAINTED CLIFFS AND DEEP WATER BLOCK: what you see is what stops you — across the whole valley, a texel centre every seven texels, the ground painted is the ground named, every point that stops the feet is painted in the cliff or the deep-water ramp (nothing invisible stops them), and every point painted cliff or deep water stops them but on a station\'s yard, which is always footing; walked head-on at a painted cliff the Walker stops within a step of the ground that blocks and never inside it, the painted cliff within a texel of its feet (the ground is named on six-unit cells and painted on five-unit texels); wading into the Silt the shallows take the feet and the deep water stops them, painted within a texel; and the steepest scree off the rivers, just under the cliff line, is crossed on its fall line without a stopped step',
  stops.grid.points > 70000 && stops.grid.overpainted < stops.grid.points * 0.01 && stops.grid.named === stops.grid.points - stops.grid.overpainted
  && stops.grid.stop > 1000 && stops.grid.stopElse === 0 && stops.grid.stopPainted === stops.grid.stop && stops.grid.cliff > 0 && stops.grid.deep > 0 && stops.grid.paintedOpen === stops.grid.paintedOpenYard
  && !!stops.cliff && stops.cliff.walked > 30 && stops.cliff.short >= 0 && stops.cliff.short <= 2.5 && stops.cliff.stopped > 0 && stops.cliff.feet === 'open' && stops.cliff.aheadStops && stops.cliff.paintedWithin <= 5
  && stops.deep.waded > 15 && stops.deep.stopped > 0 && stops.deep.feet === 'shallows' && stops.deep.feetOpen && stops.deep.aheadStops && stops.deep.paintedWithin <= 5
  && !!stops.scree && stops.scree.slope > 0.55 && stops.scree.stopped === 0 && stops.scree.crossed,
  JSON.stringify(stops));

/* ================= 34 · THE HUD LAYOUT ================= */
/* the busiest HUD a walk makes: at Haven's door with the rescued hand walking beside (hired by real clicks at their fire),
   the ★ order and a crate on the tray, hungry and cold, a toast in the air and the strip a new Walker is shown */
await ev(() => { __as('courier'); __clean(); S.orders.active.length = 0; S.orders.focus = null; S.orders.prioIdx = 0; S.orders.prioAccepted = false; WL.tp(__down.at); UI.openStation(__down.at); });
await page.click('#stationTabs [data-tab="way"]'); await page.waitForTimeout(150);
await page.click(`#stationBody [data-hirec="${await ev(() => __down.id)}"]`); await page.waitForTimeout(150);
await page.click('#stationClose'); await page.waitForTimeout(120);
const hud = await ev(async () => {
  WL.tp('haven'); const n = __down; n.cx = S.px + 26; n.cy = S.py + 14; S.stations.elm.stock.tools = 40;
  const p = Systems.boardFor('haven').find(b => b.prio), o = Systems.boardFor('haven').find(b => !b.prio);
  Systems.acceptOrder(p.def, false); Systems.acceptOrder(o.def, false);
  S.food = 20; S.warmth = 38; UI2.showHint(60);
  for (let _i = 0; _i < 4; _i++) Systems.update(0.05, __in());
  UI.updateHUD(); UI2.updateMoodles(); UI.updateTray(); await __settle(); await __wait(120);
  const vw = innerWidth, vh = innerHeight, box = id => { const e = document.getElementById(id), b = e.getBoundingClientRect(); return { shown: getComputedStyle(e).display !== 'none' && !e.classList.contains('hidden') && b.width > 0 && b.height > 0, r: [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] }; };
  const ids = ['vitals', 'compass', 'guide', 'social', 'papersRow', 'toasts', 'prompts', 'compChip', 'orderTray', 'hintStrip'], P = Object.fromEntries(ids.map(id => [id, box(id)]));   // v3.52: the papers row
  const mid = id => (P[id].r[0] + P[id].r[2]) / 2, R = id => P[id].r;
  /* what each panel puts on the screen: the rail, the tray and the toasts are clear columns of their own cards */
  const COLS = { prompts: '.prompt', orderTray: '.trayCard', toasts: '.toast', papersRow: '.paperBtn' };
  const ink = id => (COLS[id] ? [...document.querySelectorAll(`#${id} ${COLS[id]}`)] : [document.getElementById(id)]).map(e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom), (e.textContent || '').trim().slice(0, 24)]; });
  const overlaps = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) for (const a of ink(ids[i])) for (const b of ink(ids[j])) if (a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]) overlaps.push(`${ids[i]}${COLS[ids[i]] ? ' “' + a[4] + '”' : ''} [${a.slice(0, 4)}] × ${ids[j]}${COLS[ids[j]] ? ' “' + b[4] + '”' : ''} [${b.slice(0, 4)}]: ${Math.min(a[2], b[2]) - Math.max(a[0], b[0])}×${Math.min(a[3], b[3]) - Math.max(a[1], b[1])}px`);
  const top = sel => { const e = document.querySelector(sel); return e ? Math.round(e.getBoundingClientRect().top) : null; };
  const tag = txt => { const e = [...document.querySelectorAll('#vitals .tag')].find(x => x.textContent.trim() === txt && getComputedStyle(x).display !== 'none'); return e ? Math.round(e.getBoundingClientRect().top) : null; };
  const vit = { health: tag('Health'), hearts: top('#hpHearts'), stamina: tag('Stamina'), load: tag('Load'), food: tag('Food'), warmth: tag('Warmth'), warmMeter: getComputedStyle(document.getElementById('warmMeter')).display !== 'none' ? top('#warmMeter') : null, foodMeter: top('#foodWarmRow .food'), moodles: top('#moodles'), glyphs: [...document.querySelectorAll('#moodles .moodle')].map(e => e.title.split(' — ')[0]) };
  /* the party card's own buttons: is the card on top where they are? */
  const hit = id => { const e = document.getElementById(id); if (!e) return null; const b = e.getBoundingClientRect(), h = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2); return h === e || e.contains(h) ? 'itself' : (h ? (h.closest('[id]') || h).id || h.className : null); };
  const place = {
    vitals: R('vitals')[0] <= 24 && R('vitals')[1] <= 20, social: R('social')[2] >= vw - 24 && R('social')[1] <= 20,
    papersRow: R('papersRow')[2] >= vw - 24 && R('papersRow')[1] >= R('social')[3] && document.querySelectorAll('#papersRow .paperBtn').length === 6,
    compass: Math.abs(mid('compass') - vw / 2) <= 1 && R('compass')[1] <= 12, guide: Math.abs(mid('guide') - vw / 2) <= 1 && R('guide')[1] >= R('compass')[3],
    toasts: Math.abs(mid('toasts') - vw / 2) <= 1 && R('toasts')[1] >= R('guide')[3], prompts: R('prompts')[0] <= 24 && R('prompts')[3] >= vh - 24,
    compChip: R('compChip')[0] <= 24 && R('compChip')[3] <= R('prompts')[1], orderTray: R('orderTray')[2] >= vw - 24 && R('orderTray')[3] >= vh - 24,
    hintStrip: Math.abs(mid('hintStrip') - vw / 2) <= 1 && R('hintStrip')[3] >= vh - 20 };
  return { vw, vh, panels: P, inside: ids.every(id => P[id].shown && R(id)[0] >= 0 && R(id)[1] >= 0 && R(id)[2] <= vw && R(id)[3] <= vh), place, overlaps, vit, prompts: [...document.querySelectorAll('#prompts .prompt')].map(e => e.textContent.trim()), tray: document.querySelectorAll('#orderTray .trayCard').length, cardButtons: { crew: hit('wcMuster'), hide: hit('wcHide') } };
});
ok('THE HUD LAYOUT: at the busiest a walk makes it — at Haven\'s door with a hand walking beside, the ★ order and a crate on the tray, hungry and cold, a toast in the air and the strip a new Walker is shown — every panel is up, inside the window and in its own place: the body\'s vitals top-left (Health, Stamina, Load, then Food with Warmth on its row, the moodles under them), the ◆ and the day top-right with the papers row under them (v3.52), the compass top-centre with the Guide beneath it and the toasts beneath that, the rail of prompts bottom-left with the party card above it (v3.37: the companion\'s chip grown into the party card), the tray bottom-right, the key strip bottom-centre; and no panel lies on another',
  hud.inside && Object.values(hud.place).every(Boolean) && hud.overlaps.length === 0 && hud.tray === 2 && hud.prompts.length >= 3
  && hud.vit.health < hud.vit.hearts && hud.vit.hearts < hud.vit.stamina && hud.vit.stamina < hud.vit.load && hud.vit.load < hud.vit.food && hud.vit.warmth === hud.vit.food && hud.vit.warmMeter === hud.vit.foodMeter && hud.vit.moodles > hud.vit.food && hud.vit.glyphs.includes('Hungry') && hud.vit.glyphs.includes('Cold')
  && hud.cardButtons.crew === 'itself' && hud.cardButtons.hide === 'itself',
  JSON.stringify(hud));

/* ================= 35 · THE ★ ORDER POSTED AGAIN AFTER A DEATH ================= */
await ev(() => { NPC.dismiss(__down, 'haven'); __as('courier'); S.pName = 'Hollis Brae'; __clean(); S.orders.active.length = 0; S.orders.focus = null; S.orders.prioIdx = 0; S.orders.prioAccepted = false; WL.tp('haven'); UI.updateTray(); UI2.updateMoodles(); });
await page.keyboard.press('KeyE'); await page.waitForTimeout(250);
const starCards = () => ev(() => [...document.querySelectorAll('#stationBody .orderCard.prio')].filter(c => /PRIORITY DISPATCH/.test(c.textContent)).map(c => c.querySelector('h4').textContent.replace('PRIORITY DISPATCH', '').trim()));
const star = { first: { open: await ev(() => !document.getElementById('stationOv').classList.contains('hidden')), cards: await starCards() } };
await page.click('#stationBody [data-accept="prio"]'); await page.waitForTimeout(250);
Object.assign(star.first, await ev(() => { const o = S.orders.active.find(x => x.prio); return { taken: S.orders.prioAccepted, id: o && o.id, to: o && o.to, crates: S.cargo.filter(c => o && c.orderId === o.idNum).map(c => c.defId), onBoard: Systems.boardFor('haven').filter(b => b.prio).length }; }));
await page.click('#stationClose'); await page.waitForTimeout(150);
star.fell = await ev(() => {
  WL.tp(__quietAt(DATA.stations.haven.x + 600, DATA.stations.haven.y - 150)); S.mails.length = 0;
  WL.kill('bleed');
  const g = S.graves[S.graves.length - 1], m = S.mails.find(x => x.subj === 'Priority order lost with Hollis Brae');
  return { mail: m ? m.body : null, taken: S.orders.prioAccepted, idx: S.orders.prioIdx, active: S.orders.active.length, cairn: g.items.filter(i => i.lostTo).map(i => `${i.defId}>${i.lostTo}`), onBoard: Systems.boardFor('haven').filter(b => b.prio).map(b => b.def.id) };
});
star.heir = await nextWalker();
star.heir.guide = await ev(async () => { await __settle(); return document.getElementById('guideHead').textContent; });
await ev(() => WL.tp('haven'));
await page.keyboard.press('KeyE'); await page.waitForTimeout(250);
star.again = { cards: await starCards() };
await page.click('#stationBody [data-accept="prio"]'); await page.waitForTimeout(250);
Object.assign(star.again, await ev(() => { const o = S.orders.active.find(x => x.prio); const out = { taken: S.orders.prioAccepted, id: o && o.id, from: o && o.from, to: o && o.to, by: S.pName, crates: S.cargo.filter(c => o && c.orderId === o.idNum).map(c => c.defId), onBoard: Systems.boardFor('haven').filter(b => b.prio).length, tray: [...document.querySelectorAll('#orderTray .trayCard')].map(c => c.querySelector('.dest').textContent + ' | ' + c.querySelector('.sub span').textContent.split(' · ')[0]) }; __shut(); return out; }));
ok('THE ★ ORDER POSTED AGAIN AFTER A DEATH: the ★ order on Haven\'s board (First steps, for Elm Farm) is taken by a real click — its medicine and letters on the back, the card off the board — and the Walker falls with it; the mail says the order was lost with them and that Haven will post it again, the cairn keeps the crates marked lost toward Elm Farm, and the chain never locks: the same ★ order is on Haven\'s board again, once, the Guide sends the next Walker (enlisted by real clicks) to it, and a real click there hands it to them — fresh medicine and letters on their back, the ★ card on their tray',
  star.first.open && star.first.cards.join() === '★ First steps' && star.first.taken && star.first.id === 'p1' && star.first.to === 'elm' && star.first.crates.join() === 'meds,letters' && star.first.onBoard === 0
  && star.fell.mail === 'Haven will post it again. What Hollis Brae carried lies where they fell — Elm Farm still wants it.' && !star.fell.taken && star.fell.idx === 0 && star.fell.active === 0 && star.fell.cairn.join() === 'meds>elm,letters>elm' && star.fell.onBoard.join() === 'p1'
  && !star.heir.dead && star.heir.name !== 'Hollis Brae' && /★ First steps waits at Haven/.test(star.heir.guide)
  && star.again.cards.join() === '★ First steps' && star.again.taken && star.again.id === 'p1' && star.again.from === 'haven' && star.again.to === 'elm' && star.again.by === star.heir.name && star.again.crates.join() === 'meds,letters' && star.again.onBoard === 0 && star.again.tray.join() === '★ Elm Farm | First steps',
  JSON.stringify(star));

await T.finish('the character layer');
