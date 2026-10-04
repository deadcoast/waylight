/* karma.mjs — v3.22 KARMA & THE REPUBLIC (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). Two coins, both yours: the renegade ledger's four tiers and the
   bandana chip it lands as; the quiet work out of Elm's lean-to — two crates in outlaw green on the courier's tower and never
   the Order's gold; the clean pass paying three ways (trust, renegade, the buyer's regard) and the yard showing it (loungers,
   embers, smoke, against the same frame without them); the Republic arriving at the first clean pass and at fifteen percent
   coverage (the banner, the founding letter, the wards seeded); a caught pass writing heat at that town alone with the crates
   seized and the mail; the heat settled for coin and cooling on its own; the legible risk equation; the skim and its heavier
   fall; the Road's Own claim measured shorter at a camp and the Order's gold making it business again; the named Farkeeper
   wards a head taller on screen and their heavy intercept; the corrected strings (every rider a Farkeeper rider); the five
   breeds and the Arabian outrunning them all, measured; the factions and their cultures; the karma panel; the save. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { page, ev, ok, drain } = T;

/* one buyer on the wire (the Mill), so the quiet work's buyer is the Mill every time; the Walker unhurt and fed */
await ev(() => {
  for (const id of ['elm', 'mill']) { S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; }
  State.refreshSources(true);
  S.renegade = 0; S.heat = {}; S.contra = null; S.cut = null; S.flags.fkIntro = false; S.likes = 200;
  S.cargo = S.cargo.filter(c => c.cat === 'tool' && c.defId !== 'ladderTool'); S.orders.active = [];
  S.health = 100; S.food = 90; S.warmth = 90;
  window.__rec = (obj, key) => { const calls = [], f = obj[key]; obj[key] = (...a) => { calls.push(a); return f.apply(obj, a); }; return { calls, off: () => { obj[key] = f; } }; };
  window.__sayRec = __rec(Render, 'say');   // every line spoken over the world, kept for the checks that listen
});

/* ================= 1 · THE TIERED LEDGER ================= */
const ledger = await ev(() => {
  const ann = __rec(Render, 'announce'), mails0 = new Set(S.mails), out = [];
  const step = n => { Systems.addRenegade(n); out.push({ ren: S.renegade, tier: Systems.renegadeTier(), ren2: Republic.renTier(), name: FACT.RENEGADE_TIERS[Systems.renegadeTier()][1] }); };
  step(7); step(1); step(12); step(20);
  ann.off();
  const names = S.mails.filter(m => !mails0.has(m)).map(m => m.subj);
  return { tiers: FACT.RENEGADE_TIERS.map(t => [t[0], t[1]]), out, announced: ann.calls.map(c => c[0]), names };
});
ok('THE TIERED LEDGER: renegade is its own coin with its own ladder — Clean Hands, Grey Hand at 8, Road\'s Own at 20, Free Walker at 40 — and it only grows: seven says nothing, the eighth makes the road call you GREY HAND (the announce, a name travelling by mail), then ROAD\'S OWN, then FREE WALKER; the Republic reads the same tier',
  ledger.tiers.map(t => t.join(':')).join() === '0:Clean Hands,8:Grey Hand,20:Road\'s Own,40:Free Walker' && ledger.out.map(o => o.tier).join() === '0,1,2,3' && ledger.out.every(o => o.tier === o.ren2)
  && ledger.announced.join('|') === 'THE ROAD CALLS YOU GREY HAND|THE ROAD CALLS YOU ROAD\'S OWN|THE ROAD CALLS YOU FREE WALKER' && ledger.names.filter(n => n === 'A name travels').length === 3,
  JSON.stringify(ledger));

/* ================= 2 · ITS CHIP ================= */
await ev(() => { S.renegade = 0; document.getElementById('earnFeed').innerHTML = ''; Systems.addRenegade(2); Systems.addRenegade(3); });
await page.waitForTimeout(700);
const chip = await ev(async () => {
  const chips = [...document.querySelectorAll('#earnFeed .earnChip.renegade')], im = chips[0] && chips[0].querySelector('img');
  if (!im) return { n: chips.length };
  const pix = await new Promise(res => { const t = new Image(); t.onload = () => { const c = document.createElement('canvas'); c.width = t.width; c.height = t.height; const g = c.getContext('2d'); g.drawImage(t, 0, 0); res({ w: t.width, h: t.height, d: [...g.getImageData(0, 0, t.width, t.height).data] }); }; t.src = im.src; });
  const hexAt = i => '#' + pix.d.slice(i, i + 3).map(v => v.toString(16).padStart(2, '0')).join('');
  const cols = new Set(); for (let i = 0; i < pix.d.length; i += 4) if (pix.d[i + 3]) cols.add(hexAt(i));
  const others = [...document.querySelectorAll('#earnFeed .earnChip')].length;
  UI.earn('trust', 1); await __wait(50);
  const trust = document.querySelector('#earnFeed .earnChip.trust img');
  return { n: chips.length, num: chips[0].querySelector('.num').textContent, size: [pix.w, pix.h], cols: [...cols].sort(), others, distinct: !!trust && trust.src !== im.src };
});
ok('ITS CHIP: the renegade coin lands as its own chip in the earn feed — the authored 9×9 black bandana with its one eye slit (never the Order\'s gold diamond) — and two gains in a breath merge and count up on one chip (+5)',
  chip.n === 1 && chip.num === '+5' && chip.size.join() === '9,9' && ['#642a2a', '#4a1e1e', '#f0d0c0', '#d9736b'].every(c => chip.cols.includes(c)) && !chip.cols.includes('#ffd98f') && chip.distinct, JSON.stringify(chip));

/* ================= 3 · THE GREEN, NEVER THE GOLD ================= */
await ev(() => { S.renegade = 0; WL.tp('elm'); Systems.update(0.3, {}); });
const leanTo = await ev(() => { const a = Systems.getInteractions().find(i => /the quiet work/.test(i.label)); return a ? { key: a.key, label: a.label.replace(/<[^>]+>/g, '') } : null; });
await page.keyboard.press('KeyL'); await page.waitForTimeout(200);
const crates = await ev(async () => {
  const cr = S.cargo.filter(c => c.cat === 'contra');
  const g = Render.cargoGlyph(cr[0]), palCols = [...new Set(g.rows.join('').replace(/\./g, ''))].map(ch => g.pal[ch]);   // the colours its texels are drawn in
  const icon = UI.iconTag(cr[0]), mission = UI.iconTag({ defId: 'textiles', cat: 'goods', orderId: 1 });
  /* on the Walker's back, seen from behind: the tower of two crates in outlaw green; the same tower as two of the Order's
     crates wears the gold band */
  const shoot = async () => { Render.faceWalker('N'); await __stage(); await __wait(100); await __frames(2); const A = SPRITES.COURIER.at.N, c = Render.walkerAt(A.tower[0], A.tower[1] - 5); const d = __grab(c.x, c.y, 44); return { green: __count(d, __hex('#4a6e3a'), 9) + __count(d, __hex('#5f8a4a'), 9), gold: __count(d, __hex('#ffd98f'), 9), tiers: Render.walkerDrawn().tiers }; };
  const keep = S.cargo.slice();
  S.cargo = cr.slice(); const quiet = await shoot();
  S.cargo = [0, 1].map(() => { const it = State.makeItem('textiles'); it.orderId = 99; return it; }); const order = await shoot();
  S.cargo = keep; __done();
  return { n: cr.length, kg: cr.map(c => c.kg), to: S.contra && S.contra.to, palGold: palCols.includes('#ffd98f'), palGreen: palCols.includes('#4a6e3a') && palCols.includes('#5f8a4a'), iconMission: UI.isMission(cr[0]), iconSame: icon === mission, quiet, order, toast: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).find(t => /under sacking/.test(t)) || null };
});
ok('THE GREEN, NEVER THE GOLD: at Elm the rail offers the far lean-to\'s quiet work, and L takes it — two crates of highleaf smokes (5 kg each) under sacking for the buyer on the wire; they ride the courier\'s tower in outlaw green, the contra band, and not a texel of the Order\'s gold (the same tower of two mission crates wears the gold band), on paper never marked as the Order\'s either',
  !!leanTo && leanTo.key === 'L' && crates.n === 2 && crates.kg.join() === '5,5' && crates.to === 'mill' && !crates.palGold && crates.palGreen && !crates.iconMission && !crates.iconSame
  && crates.quiet.tiers === 2 && crates.quiet.green > 20 && crates.quiet.gold === 0 && crates.order.gold > 10 && crates.order.green === 0 && !!crates.toast,
  JSON.stringify({ leanTo, crates }));

/* ================= 4 · THE CLEAN PASS PAYS THREE WAYS ================= */
const pass = await ev(() => {
  WL.tp('mill'); Systems.update(0.3, {});
  const a = Systems.getInteractions().find(i => /Pass the crates/.test(i.label));
  const crt = __rec(Render, 'crtTitle'), mails0 = new Set(S.mails);
  const before = { likes: S.likes, ren: S.renegade, appr: S.stations.mill.appr || 0, fk: !!S.flags.fkIntro, contra: S.cargo.filter(c => c.cat === 'contra').length };
  const done = Systems.passContraband('mill', 'clean');
  crt.off();
  const after = { likes: S.likes, ren: S.renegade, appr: S.stations.mill.appr || 0, fk: !!S.flags.fkIntro, contra: S.cargo.filter(c => c.cat === 'contra').length, smokeT: S.stations.mill.smokeT, open: S.contra };
  window.__door1 = { crt: crt.calls.map(c => c.slice(0, 2)), letter: S.mails.filter(m => !mails0.has(m)).find(m => /THE REPUBLIC/.test(m.subj)) || null, wards: S.npcs.filter(n => n.fk).map(n => n.at), fkBefore: before.fk, fkAfter: after.fk, crtNow: Render.crtText() };
  return { prompt: a ? a.label.replace(/<[^>]+>/g, '') : null, done, before, after };
});
ok('THE CLEAN PASS PAYS THREE WAYS: at the Mill the rail offers the quiet pass; passed clean it pays trust (two crates, 120 ◆), renegade (+3) and the buyer\'s own regard RISES (+2 — the town wanted them), the crates gone off the back and the job closed',
  !!pass.prompt && pass.done && pass.after.likes - pass.before.likes === 120 && pass.after.ren - pass.before.ren === 3 && pass.after.appr - pass.before.appr === 2 && pass.before.contra === 2 && pass.after.contra === 0 && pass.after.open === null,
  JSON.stringify(pass));

/* ================= 5 · THE YARD SHOWS IT ================= */
const smoke = await ev(async () => {
  const d = DATA.stations.mill; WL.tp([d.x + 60, d.y + 150]); S.weather.state = 'clear';
  const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
  __clearAmb(d.x, d.y, 400); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = d.x + 75; Render.cam.y = d.y + 40; WL.timeScale = 0.001;
  for (const n of NPC.party()) { n.cx = S.px + 900; n.cy = S.py + 900; }
  const st = S.stations.mill, keep = st.smokeT;
  await __wait(250); await __frames(3); const on = __grab(d.x + 75, d.y + 40, 60), embers = __count(on, __hex('#ffb54f'), 12) + __count(on, __hex('#8a4a2a'), 12);
  st.smokeT = 0; await __wait(120); await __frames(3); const off = __grab(d.x + 75, d.y + 40, 60), embersOff = __count(off, __hex('#ffb54f'), 12) + __count(off, __hex('#8a4a2a'), 12);
  st.smokeT = keep; __done();
  return { smokeT: keep, changed: __diff(on, off), embers, embersOff };
});
ok('THE YARD SHOWS IT: for ten minutes (the clock set at the pass) the Mill\'s yard wears the quiet work — two loungers on the steps with embers at their hands and a lazy ribbon of smoke — measured against the same frame without them',
  smoke.smokeT > 590 && smoke.smokeT <= 600 && smoke.changed > 60 && smoke.embers > 0 && smoke.embersOff === 0, JSON.stringify(smoke));

/* ================= 6 · THE REPUBLIC ARRIVES ================= */
const arrive = await ev(() => {
  const door1 = window.__door1;
  /* the other door: fifteen percent of the valley lit (stations off the quiet work's buyer list) */
  S.flags.fkIntro = false; S.npcs = S.npcs.filter(n => !n.fk);
  const cov0 = S.cov;
  const crt = __rec(Render, 'crtTitle'), mails0 = new Set(S.mails);
  /* the valley lit town by town, each with a star or two over its door, until the light passes fifteen percent */
  for (const id of ['haven', 'elm', 'mill', 'green', 'pharos', 'quarry', 'relay', 'foundry']) { if (World.coverage() >= 0.15) break; S.stations[id].connected = true; S.stations[id].met = true; S.stations[id].litT = 1; S.stations[id].stars = Math.max(S.stations[id].stars, 2); State.refreshSources(true); }
  const lit = DATA.stationOrder.filter(id => S.stations[id].connected);
  State.refreshSources();   // the light changed: the valley's milestones are read
  crt.off();
  const letter = S.mails.filter(m => !mails0.has(m)).find(m => /THE REPUBLIC/.test(m.subj));
  /* and it arrives once: asked again, the mountain has already come down */
  const mails1 = S.mails.length, wards1 = S.npcs.filter(n => n.fk).length; Systems.fkIntro(); const once = S.mails.length === mails1 && S.npcs.filter(n => n.fk).length === wards1;
  return { door1, cov0, cov: S.cov, lit, fk: !!S.flags.fkIntro, crt: crt.calls.map(c => c.slice(0, 2)), letter, wards: S.npcs.filter(n => n.fk).map(n => n.at).sort(), once };
});
const banner = c => c && c[0] === 'THE REPUBLIC OF CONNECTION' && /Farkeep carries the weight of keeping it/.test(c[1]);
const letterOk = l => !!l && l.subj === 'From the Dispatch — THE REPUBLIC' && /Two peoples, one wire/.test(l.body) && /WAYLIGHTERS/.test(l.body) && /FARKEEPERS/.test(l.body) && /They always were\./.test(l.body);
ok('THE REPUBLIC ARRIVES: the moment the road first learns your name (the first clean pass) the mountain takes notice — the banner (THE REPUBLIC OF CONNECTION · Waylight carries the light, Farkeep carries the weight of keeping it), the founding letter (two peoples, one wire; when riders answer your horn they are Farkeeper riders — they always were), wards seeded by the lit fires of Haven and the Mill; and in a valley that had not yet heard, fifteen percent of it lit brings the same arrival — once',
  !arrive.door1.fkBefore && arrive.door1.fkAfter && arrive.door1.crt.some(banner) && letterOk(arrive.door1.letter) && arrive.door1.wards.sort().join() === 'haven,mill'
  && arrive.cov0 < 0.15 && arrive.cov >= 0.15 && arrive.fk && arrive.crt.some(banner) && letterOk(arrive.letter) && arrive.wards.join() === 'haven,mill' && arrive.once,
  JSON.stringify(arrive));

/* ================= 7 · CAUGHT: HEAT WHERE IT HAPPENED ================= */
const caught = await ev(() => {
  WL.tp('elm'); S.renegade = 3;
  const mr = Math.random; Math.random = () => 0; const took = Systems.offerSmuggle(); Math.random = mr;   // the buyer the fixer names first: the Mill
  const to = S.contra && S.contra.to; WL.tp('mill');
  const mails0 = new Set(S.mails), before = { ren: S.renegade, appr: S.stations.mill.appr || 0, likes: S.likes, contra: S.cargo.filter(c => c.cat === 'contra').length };
  Systems.passContraband('mill', 'caught');
  const heat = Object.fromEntries(DATA.stationOrder.map(id => [id, Systems.heatAt(id)]));
  const mail = S.mails.filter(m => !mails0.has(m)).find(m => m.subj === `Word from ${DATA.stations.mill.name}`);
  return { took, to, before, after: { ren: S.renegade, appr: S.stations.mill.appr || 0, likes: S.likes, contra: S.cargo.filter(c => c.cat === 'contra').length, open: S.contra }, heat, mail };
});
ok('CAUGHT: a caught pass is seized — the crates ash, gone off the back, no pay — and HEAT lands at that town alone (the Mill 3, every other door cold), the keeper colder (regard −4), the road respecting the attempt (renegade +1), and the Mill\'s word by mail',
  caught.took && caught.to === 'mill' && caught.before.contra === 2 && caught.after.contra === 0 && caught.after.open === null && caught.after.likes === caught.before.likes && caught.heat.mill === 3
  && Object.entries(caught.heat).every(([k, v]) => k === 'mill' || v === 0) && caught.after.appr - caught.before.appr === -4 && caught.after.ren - caught.before.ren === 1 && !!caught.mail && /The crates are ash/.test(caught.mail.body),
  JSON.stringify(caught));

/* ================= 8 · THE LEDGER SETTLED ================= */
const settle = await ev(() => {
  WL.tp('mill'); Systems.update(0.3, {});
  const a = Systems.getInteractions().find(i => /Settle the ledger at/.test(i.label));
  const label = a ? a.label.replace(/<[^>]+>/g, '') : null, name = DATA.stations.mill.name;
  S.likes = 20; const broke = Systems.settleHeat('mill'), heatBroke = Systems.heatAt('mill');
  S.likes = 100; const paid = Systems.settleHeat('mill');
  return { label, name, broke, heatBroke, paid, likes: S.likes, heat: Systems.heatAt('mill'), inLedger: 'mill' in S.heat };
});
ok('THE LEDGER SETTLED: at the Mill\'s terminal the rail offers to make it right for coin — twelve ◆ a point of heat (36 ◆); twenty ◆ is refused with the heat kept, and a hundred pays it, the heat struck from the ledger',
  settle.label === `Settle the ledger at ${settle.name} — 36 ◆ makes it right` && settle.broke === false && settle.heatBroke > 2.9 && settle.paid === true && settle.likes === 64 && settle.heat === 0 && !settle.inLedger,
  JSON.stringify(settle));

/* ================= 9 · THE HEAT COOLS ================= */
const cool = await ev(() => {
  WL.tp('haven'); Systems.addHeat('quarry', 2); Systems.addHeat('quarry', -5); const floor = Systems.heatAt('quarry'); Systems.addHeat('quarry', 2);
  const at0 = Systems.heatAt('quarry');
  for (let i = 0; i < 90; i++) Systems.update(1, {});
  const at90 = Systems.heatAt('quarry');
  for (let i = 0; i < 95; i++) Systems.update(1, {});
  return { floor, at0, at90, at185: Systems.heatAt('quarry'), gone: !('quarry' in S.heat) };
});
ok('THE HEAT COOLS: left alone, a town\'s heat cools a point every ninety seconds (2 → 1 after 90 s) and is gone from the ledger by three minutes; heat never falls below nothing',
  cool.floor === 0 && cool.at0 === 2 && Math.abs(cool.at90 - 1) < 0.02 && cool.at185 === 0 && cool.gone, JSON.stringify(cool));

/* ================= 10 · THE RISK, LEGIBLE ================= */
const risk = await ev(() => {
  const DL = DATA.T.dayLen, at = f => { S.time = Math.floor(S.time / DL) * DL + DL * f; };
  const r = (f, armed, ren) => { at(f); S.stations.mill.armed = armed; S.renegade = ren; return +Systems.smuggleRisk('mill').toFixed(3); };
  const rows = { day: r(0.3, 0, 0), night: r(0.8, 0, 0), dayArmed: r(0.3, 10, 0), dayArmedGrey: r(0.3, 10, 8), nightFreeWalker: r(0.8, 0, 40), dayRoadsOwn: r(0.3, 0, 20) };
  /* the rail prints the number: a pass at the Mill by day, eyes on the yard */
  at(0.3); S.stations.mill.armed = 10; S.renegade = 0; WL.tp('elm'); const mr = Math.random; Math.random = () => 0; Systems.offerSmuggle(); Math.random = mr; WL.tp('mill'); Systems.update(0.3, {});
  const a = Systems.getInteractions().find(i => /Pass the crates/.test(i.label)), label = a ? a.label.replace(/<[^>]+>/g, '') : null;
  S.stations.mill.armed = 0; for (const c of S.cargo.filter(c2 => c2.cat === 'contra')) State.removeCargo(c.id); S.contra = null;
  return { rows, label };
});
ok('THE RISK, LEGIBLE: the chance of being caught is a number you can read — thirty in a hundred, an armed watch\'s eyes +20, daylight +15, night −10, a known grey hand six fewer a tier, never under five nor over eighty-five — and the rail prints it at the buyer\'s door (65% eyes on an armed yard by day)',
  risk.rows.day === 0.45 && risk.rows.night === 0.2 && risk.rows.dayArmed === 0.65 && risk.rows.dayArmedGrey === 0.59 && risk.rows.nightFreeWalker === 0.05 && risk.rows.dayRoadsOwn === 0.33
  && risk.label === 'Pass the crates quietly — 65% eyes on the yard', JSON.stringify(risk));

/* ================= 11 · THE SKIM ================= */
const skim = await ev(() => {
  const mr = Math.random; Math.random = () => 0;   // the fixer's pick and the skim's take, fixed for the measure
  try {
    S.renegade = 8; S.cut = null; WL.tp('elm'); Systems.offerSmuggle(); WL.tp('mill');
    const mails0 = new Set(S.mails); Systems.passContraband('mill', 'clean');
    const offered = S.cut ? S.cut.at : null, mail = S.mails.filter(m => !mails0.has(m)).find(m => m.subj === 'The skim');
    WL.tp(offered); Systems.update(0.3, {});
    const a = Systems.getInteractions().find(i => /skim/.test(i.label)), label = a ? a.label.replace(/<[^>]+>/g, '') : null;
    const b = { likes: S.likes, ren: S.renegade }; Systems.palmSkim(offered, 'clean'); const clean = { likes: S.likes - b.likes, ren: S.renegade - b.ren, open: S.cut };
    /* the second skim, walked the same way, and caught */
    WL.tp('elm'); Systems.offerSmuggle(); WL.tp('mill'); Systems.passContraband('mill', 'clean'); const again = S.cut ? S.cut.at : null;
    const c0 = { ren: S.renegade, appr: S.stations[again].appr || 0, heat: Systems.heatAt(again), likes: S.likes };
    const riskSkim = Systems.smuggleRisk(again) + 0.1;
    Systems.palmSkim(again, 'caught');
    const fall = { ren: S.renegade - c0.ren, appr: (S.stations[again].appr || 0) - c0.appr, heat: Systems.heatAt(again) - c0.heat, likes: S.likes - c0.likes };
    delete S.heat[again];
    return { offered, mail: mail ? mail.body.slice(0, 60) : null, label, clean, again, fall, riskSkim: +riskSkim.toFixed(3), riskPass: +Systems.smuggleRisk(again).toFixed(3) };
  } finally { Math.random = mr; }
});
ok('THE SKIM: after a clean pass by a grey hand the fixer posts THE SKIM at a named town (the mail, the rail\'s "Palm the counting-room skim" at its door); palmed clean it pays 40–70 ◆ that never had a name on it and +2 renegade; the same equation, heavier: its risk ten points over the pass\'s, and caught it lands 4 heat and −6 regard (the smokes\' 3 and −4), +1 renegade, nothing paid',
  skim.offered === 'haven' && !!skim.mail && skim.label === 'Palm the counting-room skim' && skim.clean.likes === 40 && skim.clean.ren === 2 && skim.clean.open === null
  && skim.again === 'haven' && skim.fall.heat === 4 && skim.fall.appr === -6 && skim.fall.ren === 1 && skim.fall.likes === 0 && Math.abs(skim.riskSkim - skim.riskPass - 0.1) < 1e-9,
  JSON.stringify(skim));

/* ================= 12–13 · THE ROAD'S RESPECT, MEASURED ================= */
const claim = await ev(() => {
  const cd = DATA.camps.find(c => c.id === 'pass'), c = S.camps[cd.id];
  /* an open bearing off the fire: walkable at every distance the measure stands at */
  let ang = null;
  for (let k = 0; k < 24 && ang === null; k++) { const a = k / 24 * Math.PI * 2; if ([0.5, 0.7, 0.8, 0.92, 1.0].every(f => { const t = World.terrainAt(cd.x + Math.cos(a) * cd.r * f, cd.y + Math.sin(a) * cd.r * f); return !t.blocked && !t.water; })) ang = a; }
  const goods = () => { const it = State.makeItem('textiles'); return it; };
  const measure = (f, ren, gold) => {
    S.renegade = ren; S.cargo = S.cargo.filter(x => x.cat === 'tool'); const it = goods(); if (gold) it.orderId = 777; S.cargo.push(it);
    S.px = cd.x + Math.cos(ang) * cd.r * f; S.py = cd.y + Math.sin(ang) * cd.r * f;
    c.runners = []; Systems.update(0.05, {});   // the camp puts its knives out at the fire
    c.runners.forEach((r, i) => { const px = -Math.sin(ang) * (i - 0.5) * 50, py = Math.cos(ang) * (i - 0.5) * 50; r.x = cd.x + Math.cos(ang) * cd.r * 0.5 + px; r.y = cd.y + Math.sin(ang) * cd.r * 0.5 + py; r.cd = 0; r.state = 'patrol'; });   // the knives at the edge of their round, on the walker's side of the fire
    c.shoutCd = 0; __sayRec.calls.length = 0;
    const d0 = c.runners.map(r => U.dist(r.x, r.y, S.px, S.py));
    for (let i = 0; i < 10; i++) { S.px = cd.x + Math.cos(ang) * cd.r * f; S.py = cd.y + Math.sin(ang) * cd.r * f; Systems.update(0.1, {}); }
    const d1 = c.runners.map(r => U.dist(r.x, r.y, S.px, S.py)), closed = d0.reduce((s, v, i) => s + (v - (d1[i] || v)), 0) / Math.max(1, d0.length);
    const shouts = __sayRec.calls.map(x => x[2]).filter(t => typeof t === 'string');
    return { f, ren, gold, chase: closed > 60, closed: Math.round(closed), shouts };
  };
  const out = {
    clean92: measure(0.92, 0, false), roads92: measure(0.92, 20, false), roads80: measure(0.8, 20, false), gold92: measure(0.92, 20, true), roads70: measure(0.7, 20, false), clean70: measure(0.7, 0, false),
  };
  S.cargo = S.cargo.filter(x => x.cat === 'tool'); S.renegade = 0; WL.tp('haven'); for (const r of c.runners) r.cd = 30;
  return { ang, r: cd.r, ...out };
});
const roadsLines = ['Road\'s own. Eyes forward, boys.', 'Not that one. He knows people.', 'Let the grey hand pass.'];
ok('THE ROAD\'S RESPECT, MEASURED: at Pass Camp, a walker with a pack standing at 92% of the claim is chased by a Clean Hands and left alone as the Road\'s Own — the claim fifteen percent shorter, not gone (at 80% the knives still come) — and the shouts change: "Road\'s own. Eyes forward, boys." where a clean walker hears the usual',
  claim.ang !== null && claim.clean92.chase && !claim.roads92.chase && claim.roads80.chase && claim.roads70.shouts.some(t => roadsLines.includes(t)) && claim.clean70.shouts.length > 0 && !claim.clean70.shouts.some(t => roadsLines.includes(t)),
  JSON.stringify(claim));
ok('THE GOLD EXCEPTION: put the Order\'s gold on the Road\'s Own back — a mission crate — and business is business again: at 92% of the claim the knives come for it',
  claim.gold92.chase && !claim.roads92.chase, JSON.stringify({ gold92: claim.gold92, roads92: claim.roads92 }));

/* ================= 14 · THE WARDS, NAMED AND DRAWN ================= */
const wards = await ev(async () => {
  const W = S.npcs.filter(n => n.fk);
  const names = W.map(n => n.name), FIRST = ['Ulfar', 'Brenna', 'Skarde', 'Halla', 'Jorund', 'Eir', 'Ragnvald', 'Sigrun'], LAST = ['Stonejaw', 'Coldbrook', 'Ironthigh', 'Longwinter', 'Hardmark', 'Greymantle'];
  const named = W.every(n => { const [f, l] = n.name.split(' '); return FIRST.includes(f) && LAST.includes(l); });
  const kit = W.every(n => n.fkCls === 'pugugly' && n.fee.metal === 34 && n.fee.ceramic === 16 && n.skills.bal === 6 && n.skills.haul === 6);
  const F = SPRITES.FIG.pugugly, CO = SPRITES.COURIER.frames.S.idle;
  const ext = rows => { let y0 = 99, y1 = -1, x0 = 99, x1 = -1; rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); } }); return { h: y1 - y0 + 1, w: x1 - x0 + 1 }; };
  const reg = { ward: ext(F.frames.S.idle), courier: ext(CO) };
  /* on screen: a ward and a courier hand in the party side by side, each measured against the same frame without them
     (the figure alone — the name plate under the feet left out) */
  const ward = W[0], hand = NPC.gen({ at: 'haven' }); S.npcs.push(hand);
  for (let s = hand.seed, i = 0; i < 64; i++, s++) if (U.pick(U.rng(s), CHAR.PORTRAIT.hoods) !== '#33404d') { hand.seed = s; break; }   // v3.51: a hand in any hood but the slate one — the slate hood\'s light shade is the mountain\'s iron within the sampling\'s tolerance, and a random hand wore it one time in eight
  S.npcs.forEach(n => { if (n.state === 'companion') n.state = 'idle'; });
  ward.state = 'companion'; hand.state = 'companion';
  Render.faceWalker('S'); await __stage(520, 260, 2);
  const place = () => { ward.cx = ward._px = S.px + 110; ward.cy = ward._py = S.py + 10; hand.cx = hand._px = S.px - 110; hand.cy = hand._py = S.py + 10; ward._dir = hand._dir = Math.PI / 2; };
  const R = 150, box = async (n, cx, cy) => {
    place(); await __frames(3); await __wait(60); await __frames(2); const a = __grab(cx, cy - 34, R);
    const st0 = n.state; n.state = 'idle'; await __frames(3); await __wait(60); await __frames(2); const b = __grab(cx, cy - 34, R); n.state = st0; place();
    const side = Math.round(Math.sqrt(a.length / 4)), feet = __toScr(cx, cy + 2).y - (__toScr(cx, cy - 34).y - R);
    let y0 = 1e9, y1 = -1, x0 = 1e9, x1 = -1, iron = 0, pale = 0;
    for (let i = 0; i < a.length; i += 4) {
      const p = i / 4, x = p % side, y = (p / side) | 0; if (y > feet) continue;
      if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) <= 60) continue;
      y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      if (Math.abs(a[i] - 0x56) < 8 && Math.abs(a[i + 1] - 0x62) < 8 && Math.abs(a[i + 2] - 0x6e) < 8) iron++;
      if (Math.abs(a[i] - 0xef) < 8 && Math.abs(a[i + 1] - 0xeb) < 8 && Math.abs(a[i + 2] - 0xe1) < 8) pale++;
    }
    return { h: y1 - y0 + 1, w: x1 - x0 + 1, iron, pale, clipped: y0 === 0 || x0 === 0 || x1 === side - 1 };
  };
  place(); const wBox = await box(ward, S.px + 110, S.py + 10), hBox = await box(hand, S.px - 110, S.py + 10);
  const iron = wBox.iron, pale = wBox.pale;
  ward.state = 'idle'; hand.state = 'idle'; S.npcs.splice(S.npcs.indexOf(hand), 1); __done();
  return { n: W.length, at: W.map(n => n.at).sort(), names, named, kit, reg, wBox, hBox, iron, pale, fkPal: typeof SPRITES.FK_PAL.G === 'string' };
});
ok('THE WARDS, NAMED AND DRAWN: the Farkeeper wards by the fires of Haven and the Mill carry mountain names (Ulfar Stonejaw\'s kind), the bruiser\'s trade, the mountain\'s fee (34 metal, 16 ceramic) and its balance and haul — and they are drawn a head taller and a hand wider than any courier, in iron and pale (on the registry 29 texels to the courier\'s 22; on screen, each against the same frame without them — v3.51: the cast drawn by hand)',
  wards.n === 2 && wards.at.join() === 'haven,mill' && wards.named && wards.kit && wards.reg.ward.h === 29 && wards.reg.courier.h === 22 && wards.reg.ward.w > wards.reg.courier.w
  && !wards.wBox.clipped && !wards.hBox.clipped && wards.wBox.h / wards.hBox.h > 1.2 && wards.wBox.w > wards.hBox.w && wards.iron > 200 && wards.pale > 4 && wards.hBox.iron === 0 && wards.hBox.pale === 0 && wards.fkPal, JSON.stringify(wards));

/* ================= 15 · THEIR HEAVY INTERCEPT ================= */
const hit = await ev(() => {
  const ward = S.npcs.find(n => n.fk), hand = NPC.gen({ at: 'haven' }); S.npcs.push(hand);
  S.npcs.forEach(n => { if (n.state === 'companion') n.state = 'idle'; });
  const at = { x: S.px + 400, y: S.py };
  const trial = (n, dist) => {
    S.npcs.forEach(m => { if (m.state === 'companion') m.state = 'idle'; }); n.state = 'companion'; n.shoveCd = 0; n.hungry = false;
    n.x = n.cx = at.x; n.y = n.cy = at.y;
    const r = { x: at.x + dist, y: at.y, cd: 0 }, x0 = r.x;
    const met = NPC.intercept(r, null);
    return { met, knocked: Math.round(r.x - x0), down: r.cd, cd: n.shoveCd };
  };
  const out = { ward180: trial(ward, 180), hand180: trial(hand, 180), ward100: trial(ward, 100), hand100: trial(hand, 100), stats: FACT.FK_CLASSES.pugugly.stats };
  ward.state = 'idle'; hand.state = 'idle'; S.npcs.splice(S.npcs.indexOf(hand), 1);
  return out;
});
ok('THEIR HEAVY INTERCEPT: a ward meets trouble first and hits like the mountain — a runner at 180 is met by the ward and not by a courier hand (reach 210 to 150); met at 100, the ward knocks him 260 sprawling and down 8 s, the courier hand 190 and 5 s; the ward is ready again in 5 s, the hand in 8',
  hit.ward180.met && !hit.hand180.met && hit.ward100.met && hit.hand100.met && hit.ward100.knocked === 260 && hit.hand100.knocked === 190 && hit.ward100.down === 8 && hit.hand100.down === 5 && hit.ward100.cd === 5 && hit.hand100.cd === 8 && hit.stats.intercept === 2,
  JSON.stringify(hit));

/* ================= 16 · THE CORRECTED STRINGS ================= */
const strings = await ev(() => {
  const vals = [], walk = (o, depth = 0) => { if (depth > 8 || o == null) return; if (typeof o === 'string') vals.push(o); else if (Array.isArray(o)) o.forEach(v => walk(v, depth + 1)); else if (typeof o === 'object') Object.values(o).forEach(v => walk(v, depth + 1)); };
  walk(DATA); walk(CHAR); walk(FACT); walk(REP);
  const militia = vals.filter(v => /militia/i.test(v)).slice(0, 5);
  let pageText = ''; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: t => /^(SCRIPT|STYLE)$/.test(t.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT }); while (tw.nextNode()) pageText += tw.currentNode.nodeValue + ' ';
  const dom = /militia/i.test(pageText) || [...document.querySelectorAll('[title]')].some(e => /militia/i.test(e.title));
  /* the horn answered: the call's own words */
  S.militia.unlocked = { haven: true }; S.militia.cdT = 0; WL.tp('haven');
  const tr = __rec(UI, 'toast');
  const called = Systems.militiaCall();
  tr.off(); const toast = tr.calls.map(c => String(c[0]).replace(/<[^>]+>/g, '')).join(' | ');
  for (let i = 0; i < 12; i++) Systems.update(0.5, {});
  S.militia.cdT = 0; S.militia.unlocked = {};
  const fk = FACT.FACTIONS.farkeep.culture, letter = (S.mails.find(m => m.subj === 'From the Dispatch — THE REPUBLIC') || {}).body || '';
  return { militia, dom, pageChars: pageText.length, called, toast, notGiants: /NOT giants/.test(fk), letterHorn: /When riders answer your horn, they are FARKEEPER riders\. They always were\./.test(letter), n: vals.length };
});
ok('THE CORRECTED STRINGS: the lore correction landed everywhere at once — no line the player can read calls the riders a militia (thousands of strings in the data, the factions, the Republic, and every word on the page); the horn answered says the FARKEEPER riders are coming; the founding letter says they always were; the Farkeepers are larger, never giants',
  strings.militia.length === 0 && !strings.dom && strings.n > 1000 && strings.called && /The FARKEEPER riders are coming/.test(strings.toast) && strings.letterHorn && strings.notGiants, JSON.stringify(strings));

/* ================= 17 · THE BREEDS ================= */
const breeds = await ev(() => {
  const H = FACT.HORSES, ids = Object.keys(H);
  const stables = DATA.stationOrder.every(id => H[FACT.STABLES[id]]);
  const drawn = ids.every(id => SPRITES.HORSES[id]);
  const fastest = ids.slice().sort((a, b) => H[b].speedMul - H[a].speedMul)[0], steadiest = ids.slice().sort((a, b) => H[b].spookResist - H[a].spookResist)[0];
  const carrier = ids.filter(id => H[id].capBonus).join();
  S.horse = { breed: 'fjord', on: false, loaner: true, spookT: 0, rentedUntil: 0 };
  const avail = Systems.horseAvail(); S.horse.on = true; const on = Systems.horseOn(); S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 };
  return { ids, stables, drawn, fastest, steadiest, carrier, arabianSpook: H.arabian.spookResist, fjordCold: !!H.fjord.coldProof, avail, on, stableOf: FACT.STABLES };
});
ok('THE BREEDS: five real breeds with stats where their strengths are — the Fjord the steadiest (stands its ground, cold-proof), the Arabian the fastest and spooking at shadows (no resistance at all), the Percheron the one born to carry — every stable in the valley keeps its town\'s horse and every breed is drawn in the stable; a horse to hand is available and rides',
  breeds.ids.join() === 'mustang,fjord,arabian,percheron,icelandic' && breeds.stables && breeds.drawn && breeds.fastest === 'arabian' && breeds.steadiest === 'fjord' && breeds.carrier === 'percheron' && breeds.arabianSpook === 0 && breeds.fjordCold && breeds.avail && breeds.on,
  JSON.stringify(breeds));

/* ================= 18 · THE ARABIAN, MEASURED ================= */
const gallop = await ev(() => {
  /* a long flat run of meadow: the same start and the same two seconds for every breed */
  let start = null;
  const H0 = DATA.stations.haven;
  for (let y = H0.y - 2400; y < H0.y + 1000 && !start; y += 40) for (let x = 400; x < DATA.W - 1200 && !start; x += 40) {
    let okRun = true; for (let d = 0; d <= 760 && okRun; d += 20) { const t = World.terrainAt(x + d, y); if (t.blocked || t.water || Systems.crossingAt(x + d, y) || World.paveAt(x + d, y)) okRun = false; }
    if (okRun && !DATA.camps.some(cd => U.dist(cd.x, cd.y, x, y) < cd.r + 500)) start = { x, y };
  }
  if (!start) return { start };
  const S0 = S.cargo.slice(); S.cargo = S.cargo.filter(c => c.cat === 'tool');
  const run = breed => {
    S.horse = breed ? { breed, on: true, loaner: true, spookT: 0, rentedUntil: 0 } : { loaner: false, rentedUntil: 0, on: false, spookT: 0 };
    S.px = start.x; S.py = start.y; S.speed = 0; S.moveTo = null; S.route = []; S.stam = 100;
    for (let i = 0; i < 40; i++) Systems.update(0.05, { right: true });
    return Math.round(S.px - start.x);
  };
  const out = { foot: run(null) }; for (const b of Object.keys(FACT.HORSES)) out[b] = run(b);
  S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 }; S.cargo = S0; WL.tp('haven');
  return { start, ...out };
});
const others = Object.keys(gallop).filter(k => !['start', 'arabian', 'foot'].includes(k));
ok('THE ARABIAN, MEASURED: from the same start over the same two seconds of open ground, the Arabian measurably outruns everything — every other breed by a tenth or more, and every horse outruns the walker on foot',
  !!gallop.start && others.every(k => gallop.arabian > gallop[k] * 1.1) && others.every(k => gallop[k] > gallop.foot) && gallop.arabian > gallop.foot * 1.5, JSON.stringify(gallop));

/* ================= 19 · THE FACTIONS ================= */
const facts = await ev(() => {
  const F = FACT.FACTIONS, ids = Object.keys(F);
  const whole = ids.every(id => F[id].name && F[id].people && F[id].culture.length > 80 && /^#[0-9a-f]{6}$/.test(F[id].pal.A) && /^#[0-9a-f]{6}$/.test(F[id].pal.B) && ['ABSOLUTE_ALLY', 'ABSOLUTE_HOSTILE', 'HOSTILE', 'WARY', 'UNKNOWN'].includes(F[id].stance));
  const palettes = new Set(ids.map(id => F[id].pal.A + F[id].pal.B)).size === ids.length;
  return { ids, whole, palettes, stances: Object.fromEntries(ids.map(id => [id, F[id].stance])) };
});
const EIGHT = ['waylight', 'farkeep', 'raiders', 'reapers', 'cannibals', 'rebels', 'flamekeepers', 'irongiants'];
ok('THE FACTIONS (v3.25: ten — the exiles\' two stepped out of rumour beside the eight): eight cultured factions each with its people, a culture in a paragraph and its own palette — the Republic\'s two absolute allies, the live Raiders, the shoot-on-sight Reapers and Hollow Fires, the Unlit, the Flame Keepers and the Iron Giants — and the Lamplighter Nomads and the Diefenbunker Society beside them',
  EIGHT.every(id => facts.ids.includes(id)) && facts.ids.length === 10 && facts.ids.includes('lamplighters') && facts.ids.includes('diefenbunker') && facts.whole && facts.palettes
  && facts.stances.waylight === 'ABSOLUTE_ALLY' && facts.stances.farkeep === 'ABSOLUTE_ALLY' && facts.stances.reapers === 'ABSOLUTE_HOSTILE' && facts.stances.cannibals === 'ABSOLUTE_HOSTILE',
  JSON.stringify(facts));

/* ================= 20 · THE KARMA PANEL ================= */
await ev(() => { S.renegade = 11; Systems.addHeat('green', 2.4); });
await page.keyboard.press('KeyK'); await page.waitForTimeout(300);
const panel = await ev(() => {
  const ov = document.getElementById('skillsOv'), body = document.getElementById('skillsBody'), txt = body.innerText, raw = body.textContent;
  const r = { shown: !ov.classList.contains('hidden'), head: /The karma ledger — not good and bad\. Two coins, both yours\./i.test(raw), towns: /Appreciation\s*THE TOWNS/.test(raw), road: /Renegade\s*THE ROAD\s*11/.test(raw), tier: /Grey Hand — fixers nod; the quiet work finds you/.test(raw), next: /9 to Road's Own/.test(raw), heat: /Heat/.test(raw) && /Greenhouse\s*3/.test(raw) };
  return r;
});
await page.keyboard.press('KeyK'); await page.waitForTimeout(150);
await ev(() => { delete S.heat.green; });
ok('THE KARMA PANEL: the character sheet (K) reads the ledger under a heading that says it plainly — not good and bad, two coins, both yours: Appreciation for the towns, Renegade for the road with its count, the tier by name with its line and the distance to the next (9 to Road\'s Own), and the heat by town with how to cool it',
  Object.values(panel).every(Boolean), JSON.stringify(panel));

/* ================= 21 · THE SAVE ================= */
const saved = await ev(() => {
  S.renegade = 23; Systems.addHeat('quarry', 5); WL.tp('elm'); Systems.offerSmuggle(); S.cut = { at: 'green' };
  State.save();
  return { ren: S.renegade, heat: Systems.heatAt('quarry'), contra: S.contra && S.contra.to, crates: S.cargo.filter(c => c.cat === 'contra').length, cut: S.cut.at, fk: S.flags.fkIntro, wards: S.npcs.filter(n => n.fk).map(n => n.name).sort(), appr: S.stations.mill.appr, smokeT: Math.round(S.stations.mill.smokeT) };
});
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue'); await page.waitForTimeout(1500);
const loaded = await ev(() => ({ ren: S.renegade, heat: Systems.heatAt('quarry'), contra: S.contra && S.contra.to, crates: S.cargo.filter(c => c.cat === 'contra').length, cut: S.cut && S.cut.at, fk: S.flags.fkIntro, wards: S.npcs.filter(n => n.fk).map(n => n.name).sort(), appr: S.stations.mill.appr, smokeT: Math.round(S.stations.mill.smokeT), tier: Systems.renegadeTier() }));
ok('THE SAVE: the renegade coin (Road\'s Own), a town\'s heat, the quiet work on the back with its buyer, the skim posted, the Republic\'s arrival, the named wards and the regard all ride the save and come back on CONTINUE',
  loaded.ren === saved.ren && Math.abs(loaded.heat - saved.heat) < 0.2 && loaded.contra === saved.contra && loaded.crates === 2 && loaded.cut === saved.cut && loaded.fk === true && loaded.wards.join() === saved.wards.join() && loaded.appr === saved.appr && loaded.tier === 2,
  JSON.stringify({ saved, loaded }));

await T.finish('karma and the Republic');
