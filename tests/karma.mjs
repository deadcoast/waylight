/* karma.mjs — v3.22 KARMA & THE REPUBLIC: the Renegade ledger beside Appreciation (never its
   mirror), the quiet work with SEEN outcomes per place, heat that cools or settles, the road's
   respect, the Farkeepers arriving as the Republic's muscle, and horses with real breeds. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => {
  S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  S.flags.guideDone = true; S.orders.prioIdx = 99; WL.calm();
  S.stations.elm.connected = true; S.stations.mill.connected = true; S.stations.quarry.connected = true;
});

/* ---------- the two ledgers ---------- */
let r = await ev(async () => {
  document.getElementById('earnFeed').innerHTML = '';
  const t0 = Systems.renegadeTier();
  Systems.addRenegade(9);
  await new Promise(res => setTimeout(res, 400));
  const chip = [...document.querySelectorAll('#earnFeed .earnChip.renegade')].length;
  return { t0, t1: Systems.renegadeTier(), val: S.renegade, chip, name: FACT.RENEGADE_TIERS[Systems.renegadeTier()][1] };
});
ok('Renegade is its OWN ledger with its own tiers — and lands as its own marked chip', r.t0 === 0 && r.t1 === 1 && r.val === 9 && r.chip === 1 && r.name === 'Grey Hand', JSON.stringify(r));

/* ---------- the quiet work: clean ---------- */
r = await ev(() => {
  WL.tp([DATA.stations.elm.x + 40, DATA.stations.elm.y]); S.moveTo = null;
  const offered = Systems.getInteractions().some(a => /quiet work/.test(a.label));
  Systems.offerSmuggle();
  const contra = S.cargo.filter(c => c.cat === 'contra');
  const green = Render.cargoGlyph(contra[0]).pal.X === '#4a6e3a';
  const to = S.contra.to;
  WL.tp([DATA.stations[to].x + 40, DATA.stations[to].y]); S.moveTo = null;
  const passAct = Systems.getInteractions().some(a => /quietly/.test(a.label));
  const l0 = S.likes, rg0 = S.renegade, ap0 = S.stations[to].appr || 0;
  Systems.passContraband(to, 'clean');
  return {
    offered, crates: contra.length, green, passAct, to,
    paid: S.likes - l0, renegade: S.renegade - rg0, appr: (S.stations[to].appr || 0) - ap0,
    smoke: S.stations[to].smokeT > 0, cleared: !S.contra, offPack: !S.cargo.some(c => c.cat === 'contra'),
    republic: !!S.flags.fkIntro,
  };
});
ok('the lean-to offers, the crates ride in OUTLAW GREEN — never gold — and the buyer\'s yard takes them quietly', r.offered && r.crates === 2 && r.green && r.passAct, JSON.stringify(r));
ok('a CLEAN pass pays in trust AND renegade AND the buyer\'s regard — the Han Solo law, all three at once', r.paid === 120 && r.renegade === 3 && r.appr === 2 && r.cleared && r.offPack, JSON.stringify(r));
ok('the supplied yard SHOWS it — smoke on the steps for a long while', r.smoke, JSON.stringify(r));
ok('the first clean pass brings THE REPUBLIC down from the mountain', r.republic, JSON.stringify(r));

/* ---------- the quiet work: caught ---------- */
r = await ev(() => {
  Systems.offerSmuggle();
  const to = S.contra.to;
  WL.tp([DATA.stations[to].x + 40, DATA.stations[to].y]); S.moveTo = null;
  const ap0 = S.stations[to].appr || 0, rg0 = S.renegade, l0 = S.likes;
  Systems.passContraband(to, 'caught');
  return {
    to, heat: Systems.heatAt(to), appr: (S.stations[to].appr || 0) - ap0,
    renegade: S.renegade - rg0, paid: S.likes - l0, seized: !S.cargo.some(c => c.cat === 'contra'),
    mail: S.mails.some(m => /Word from/.test(m.subj)),
  };
});
ok('CAUGHT lands HEAT at that town only — crates seized, regard down, no pay, and still a sliver of renegade (you took the risk)', r.heat >= 3 && r.appr === -4 && r.renegade === 1 && r.paid === 0 && r.seized && r.mail, JSON.stringify(r));
r = await ev(() => {
  const heated = Object.keys(S.heat)[0];
  WL.tp([DATA.stations[heated].x + 40, DATA.stations[heated].y]); S.moveTo = null;
  const act = Systems.getInteractions().find(a => /Settle the ledger/.test(a.label));
  S.likes = Math.max(S.likes, 100);
  const l0 = S.likes;
  const settled = Systems.settleHeat(heated);
  return { act: !!act, settled, cost: l0 - S.likes, heat: Systems.heatAt(heated) };
});
ok('heat can be SETTLED at the terminal — the fine paid, the ledger square (Bannerlord\'s lesson)', r.act && r.settled && r.cost >= 12 && r.heat === 0, JSON.stringify(r));
r = await ev(() => {
  Systems.addHeat('mill', 2);
  const h0 = Systems.heatAt('mill');
  for (let i = 0; i < 400; i++) Systems.update(0.25, {});
  return { h0, h1: Systems.heatAt('mill') };
});
ok('or heat simply COOLS with time', r.h0 === 2 && r.h1 < 1.1, JSON.stringify(r));

/* ---------- the risk is legible ---------- */
r = await ev(() => {
  S.stations.mill.armed = 0;
  const day = (S.time % DATA.T.dayLen) / DATA.T.dayLen;
  const base = Systems.smuggleRisk('mill');
  S.stations.mill.armed = DATA.T.armedSafe;
  const armed = Systems.smuggleRisk('mill');
  S.stations.mill.armed = 0;
  const rg0 = S.renegade; S.renegade = 45;
  const known = Systems.smuggleRisk('mill');
  S.renegade = rg0;
  return { base: +base.toFixed(2), armed: +armed.toFixed(2), known: +known.toFixed(2) };
});
ok('the ARMED WATCH you funded has eyes — and a known grey hand slips easier: risk is a real equation', r.armed > r.base && r.known < r.base, JSON.stringify(r));

/* ---------- the skim ---------- */
r = await ev(() => {
  if (!S.cut) Systems.passContraband; // (cutpurse offered on the earlier clean pass)
  const has = !!S.cut;
  const at = has ? S.cut.at : 'mill';
  if (!has) S.cut = { at };
  WL.tp([DATA.stations[at].x + 40, DATA.stations[at].y]); S.moveTo = null;
  const act = Systems.getInteractions().some(a => /skim/.test(a.label));
  const l0 = S.likes, rg0 = S.renegade;
  Systems.palmSkim(at, 'clean');
  return { offered: has, act, paid: S.likes - l0, renegade: S.renegade - rg0, cleared: !S.cut };
});
ok('the skim follows the first clean pass — palmed clean, it pays quiet trust and the road remembers', r.offered && r.act && r.paid >= 40 && r.renegade === 2 && r.cleared, JSON.stringify(r));

/* ---------- the road's respect ---------- */
r = await ev(() => {
  const camp = DATA.camps[0];
  const cs = S.camps[camp.id]; cs.pacified = false;
  if (!cs.runners.length) Systems.update(0.05, {});
  S.cargo = S.cargo.filter(c => c.cat === 'tool'); State.addCargo(State.makeItem('food'));
  S.renegade = 25;   // ROAD'S OWN
  // stand where a full claim reaches but the respected claim does not
  WL.tp([camp.x + camp.r * 0.9, camp.y]); S.moveTo = null;
  const rr = cs.runners[0]; rr.x = camp.x + camp.r * 0.5; rr.y = camp.y; rr.cd = 0; rr.carry = null;
  const d0 = U.dist(rr.x, rr.y, S.px, S.py);
  for (let i = 0; i < 8; i++) Systems.update(0.25, {});
  const respected = d0 - U.dist(rr.x, rr.y, S.px, S.py);
  // the Order's gold on the back makes it business again
  State.addCargo({ ...State.makeItem('meds'), orderId: 9 });
  rr.x = camp.x + camp.r * 0.5; rr.y = camp.y; rr.cd = 0;
  const d1 = U.dist(rr.x, rr.y, S.px, S.py);
  for (let i = 0; i < 8; i++) Systems.update(0.25, {});
  const business = d1 - U.dist(rr.x, rr.y, S.px, S.py);
  S.cargo = S.cargo.filter(c => !c.orderId);
  return { respected: Math.round(respected), business: Math.round(business) };
});
ok('ROAD\'S OWN walks a shorter claim — until the Order\'s gold is on the back, and business is business', r.respected < 40 && r.business > 60, JSON.stringify(r));

/* ---------- the Republic's muscle ---------- */
r = await ev(() => {
  const fk = S.npcs.find(n => n.fk);
  const named = fk && / /.test(fk.name);
  const cls = FACT.FK_CLASSES[fk ? fk.fkCls : 'pugugly'];
  return { seeded: !!fk, named, at: fk && fk.at, cls: cls.name, cultured: /take towns by force/.test(FACT.FACTIONS.farkeep.culture), notGiants: /NOT giants/.test(FACT.FACTIONS.farkeep.culture) };
});
ok('the Farkeepers came down — a named ward by a fire, a culture that can take towns by force and is NOT giants', r.seeded && r.named && r.cls === 'Pugugly' && r.cultured && r.notGiants, JSON.stringify(r));
r = await ev(() => {
  const fk = S.npcs.find(n => n.fk);
  fk.feeWaived = true; fk.state = 'companion'; fk.fedT = 999; fk.carry = [];
  S.compPos = { x: S.px - 20, y: S.py };
  fk.x = S.compPos.x; fk.y = S.compPos.y;
  const runner = { x: S.px + 180, y: S.py, cd: 0, wa: 0, state: 'patrol' };
  const far = !NPC.intercept({ x: S.px + 300, y: S.py, cd: 0 });   // beyond even the mountain's reach
  const hit = NPC.intercept(runner);
  const heavy = runner.cd >= 8;
  const quick = fk.shoveCd <= 5;
  fk.state = 'pool'; S.compPos = null;
  return { far, hit, heavy, quick };
});
ok('a Farkeeper ward meets trouble FIRST and hits like the mountain — longer reach, harder knock, barely a pause', r.far && r.hit && r.heavy && r.quick, JSON.stringify(r));
r = await ev(() => {
  // the lore correction is in the strings the player actually reads — every account transferred
  const src = [...document.scripts].map(s => s.textContent).join('');
  const ok2 = src.includes('FARKEEPER riders are coming') && src.includes('FARKEEPER riders trust you with their own post')
    && src.includes("Farkeeper riders owe you") && !src.includes('The militia is coming') && !src.includes('The militia trusts you');
  return { ok2 };
});
ok('the accounts are CORRECTED — the riders who answer are Farkeeper riders, in every line the player reads', r.ok2, JSON.stringify(r));

/* ---------- horses with real breeds ---------- */
r = await ev(() => {
  const breeds = Object.keys(FACT.HORSES);
  const stable = FACT.STABLES.quarry;
  const arab = FACT.HORSES.arabian, perch = FACT.HORSES.percheron;
  return { n: breeds.length, stable, fast: arab.speedMul > 1.1, draft: perch.speedMul < 0.95 && perch.capBonus > 0, steady: FACT.HORSES.fjord.spookResist > FACT.HORSES.arabian.spookResist };
});
ok('five real breeds, stats where their real strengths are — and every stable keeps its town\'s horse', r.n === 5 && r.stable === 'fjord' && r.fast && r.draft && r.steady, JSON.stringify(r));
r = await ev(async () => {
  // the Arabian outruns the Mustang on the same flat
  const d = DATA.stations.haven;
  WL.tp([d.x - 600, d.y - 300]); S.moveTo = null; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  const top = breed => {
    S.horse = { loaner: true, on: true, spookT: 0, breed };
    let t = 0;
    for (let i = 0; i < 12; i++) { Systems.update(0.12, { right: true }); t = Math.max(t, S.speed); }
    WL.tp([d.x - 600, d.y - 300]); S.moveTo = null;
    return t;
  };
  const mus = top('mustang'), arab = top('arabian');
  S.horse = { loaner: false, rentedUntil: 0, on: false, spookT: 0 };
  return { mus: Math.round(mus), arab: Math.round(arab) };
});
ok('the Arabian is the fastest thing on four legs, measurably', r.arab > r.mus * 1.1, JSON.stringify(r));

/* ---------- the factions ledger ---------- */
r = await ev(() => {
  const F = FACT.FACTIONS;
  return {
    n: Object.keys(F).length,
    allies: F.waylight.stance === 'ABSOLUTE_ALLY' && F.farkeep.stance === 'ABSOLUTE_ALLY',
    hostiles: F.reapers.stance === 'ABSOLUTE_HOSTILE' && F.cannibals.stance === 'ABSOLUTE_HOSTILE',
    identities: Object.values(F).every(f => f.culture && f.culture.length > 60 && f.pal && f.pal.A),
    todoSeeded: !!(F.raiders && F.rebels && F.flamekeepers && F.irongiants),
  };
});
ok('the faction roster, every one with a CULTURE and a palette — allies absolute, horrors shoot-on-sight (v3.25 added the exiles and the Society: ten)', r.n === 10 && r.allies && r.hostiles && r.identities && r.todoSeeded, JSON.stringify(r));

/* ---------- the karma panel & the save ---------- */
r = await ev(() => {
  UI2.toggleSkills(true);
  const txt = document.getElementById('skillsBody').textContent;
  UI2.toggleSkills(false);
  return { panel: /karma ledger/.test(txt) && /Renegade/.test(txt) && /not good and bad/i.test(txt) };
});
ok('the KARMA LEDGER reads in the character sheet — two coins, named as such', r.panel, JSON.stringify(r));
r = await ev(() => { State.save(); const raw = JSON.parse(localStorage.getItem('waylight_save_v1')); return { renegade: raw.renegade >= 20, heat: typeof raw.heat === 'object' }; });
ok('the road\'s ledger rides the save', r.renegade && r.heat, JSON.stringify(r));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue'); await page.waitForTimeout(900);
r = await ev(() => ({ renegade: S.renegade >= 20, fk: S.npcs.some(n => n.fk), republic: !!S.flags.fkIntro }));
ok('after reload: the name still travels, the Farkeepers still stand', r.renegade && r.fk && r.republic, JSON.stringify(r));

ok('no page errors across the whole suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log('\n=== KARMA (v3.22: the renegade ledger · the quiet work · heat · the Republic · breeds · factions) ===');
for (const line of results) console.log(line);
console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
