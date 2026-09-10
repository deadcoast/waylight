/* exileroads.mjs — v3.30 THE EXILE ROADS: Shutterlight, the guild, the C-series, the Hooded Row.
   The v3.25 promise kept on standing systems: the Lamplighter arc REVEALS the city (no rider
   charts the exiles), the table carries its pins, the wage-law grammar runs guild contracts
   gated HONESTLY by rifle + party, the karma ledger colors the quiet work, the C-series tiers
   ride the one fire path, the cold door answers at standing 3, and an exile walker's stone
   stands in THE HOODED ROW on the shared memorial architecture. */
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
const ev = fn => page.evaluate(fn);

/* ================= THE REVEAL: the exiles find YOU ================= */
let r = await ev(() => ({ phase: Exile.phase(), pin: Exile.visible('shutterlight'), door: Exile.visible('colddoor') }));
ok('before the Lamplighter arc, Shutterlight does not exist on any table — hidden phase, no pins', r.phase === 'hidden' && !r.pin && !r.door, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  S.flags.lamp = true;   // the v3.25 rescue fired — the exiles have seen you
  setTimeout(() => res({ phase: Exile.phase(), pin: Exile.visible('shutterlight'), mail: S.mails.some(m => /A mark nobody made/.test(m.subj)) }), 1200);
}));
ok('the rescue MARKS you: a charcoal mark appears on the table, mailed in the register\'s voice — no Farkeeper rider involved', r.phase === 'marked' && r.pin && r.mail, JSON.stringify(r));
r = await ev(() => { const went = Exile.follow(); return { went, phase: Exile.phase() }; });
ok('FOLLOW THE MARK — the guided journey begins', r.went && r.phase === 'following', JSON.stringify(r));
await ev(() => { WL.timeScale = 40; });
await page.waitForFunction(() => Exile.phase() === 'open', null, { timeout: 30000 });
r = await ev(() => ({
  mail: S.mails.some(m => /SHUTTERLIGHT/.test(m.subj)), tut: !!S.flags.tut.firstExile,
  ground: !!Memorial.site('lamplighters'), grounds: Memorial.grounds().join(','),
  rowMail: S.mails.some(m => /THE HOODED ROW/.test(m.subj)),
}));
ok('SHUTTERLIGHT opens — and THE HOODED ROW reveals with it on the shared memorial architecture', r.mail && r.tut && r.ground && /lamplighters/.test(r.grounds) && r.rowMail, JSON.stringify(r));
r = await ev(() => {
  const s2 = Memorial.site('lamplighters');
  const t = World.terrainAt(s2.x, s2.y);
  let nd = 1e9; for (const id of DATA.stationOrder) nd = Math.min(nd, U.dist(s2.x, s2.y, DATA.stations[id].x, DATA.stations[id].y));
  return { open: !t.blocked && !t.water, remote: nd > 900, nd: Math.round(nd) };
});
ok('the exiles bury their own where no map minds — the Hooded Row stands on open ground, FAR from every station', r.open && r.remote, JSON.stringify(r));

/* ================= THE EXCHANGE ================= */
r = await ev(() => {
  const refused = Exile.buyRifle('c3a1');            // no rifle on the back at all
  S.gear.rifle = true; S.gear.ammo338 = 0;           // the arc's Timberwolf, dry
  S.banked.metal = 100;
  const before = S.exile.stock.a338;
  const went = Exile.buyRounds(3);
  return { refused, went, before, ammo: S.gear.ammo338, metal: S.banked.metal, stock: S.exile.stock.a338, def: Exile.rifleDef().name };
});
ok('the exchange sells .338 at 3 metal apiece from a cycled stock — exact arithmetic, the Timberwolf named on the pack', r.refused === false && r.went && r.before === 6 && r.ammo === 3 && r.metal === 91 && r.stock === 3 && r.def === 'C14 Timberwolf', JSON.stringify(r));
r = await ev(() => { Exile.buyRounds(3); const dry = Exile.buyRounds(1); return { dry, stock: S.exile.stock.a338 }; });
ok('a drained cycle refuses — the Nomads collect rifles, not brass', r.dry === false && r.stock === 0, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  const t0 = Date.now();
  const iv = setInterval(() => { if (S.exile.stock.a338 > 0 || Date.now() - t0 > 20000) { clearInterval(iv); res({ restocked: S.exile.stock.a338 === DATA.T.a338Stock }); } }, 300);
}));
ok('and the cycle restocks the shelf', r.restocked, JSON.stringify(r));

/* ================= THE GUILD: gated honestly, paid honestly ================= */
r = await ev(() => {
  const noParty = Exile.takeContract('ridgewatch');   // rifle yes, party no
  for (const n of S.npcs.slice(0, 2)) { n.state = 'companion'; n.cx = S.px; n.cy = S.py; n.fedT = 999; n.hungry = false; }
  while (S.npcs.filter(n => n.state === 'companion').length < 2) { const n = NPC.gen({ at: 'haven', cls: 'courier' }); n.state = 'companion'; n.cx = S.px; n.cy = S.py; n.fedT = 999; S.npcs.push(n); }
  const can = Exile.canWork();
  const took = Exile.takeContract('ridgewatch');
  return { noParty, can, took, active: S.exile.guild.active && S.exile.guild.active.kind };
});
ok('guild work is GATED honestly — refused without the party, taken with rifle + two at your back', r.noParty === false && r.can && r.took && r.active === 'ridgewatch', JSON.stringify(r));
r = await ev(() => new Promise(res => {
  const likes0 = S.likes, metal0 = S.banked.metal;
  const t0 = Date.now();
  const iv = setInterval(() => {
    if (!S.exile.guild.active || Date.now() - t0 > 25000) {
      clearInterval(iv);
      res({ done: S.exile.guild.done, dLikes: S.likes - likes0, dMetal: S.banked.metal - metal0 });
    }
  }, 300);
}));
ok('the ridge watch resolves on the wage-law clock and PAYS (full or loud-half, never nothing)', r.done === 1 && r.dLikes >= 20 && r.dMetal >= 5, JSON.stringify(r));
r = await ev(() => new Promise(async res => {
  // the quiet collection writes the OTHER ledger — and grind standing to rank 2
  const ren0 = S.renegade;
  const runOne = kind => new Promise(res2 => {
    Exile.takeContract(kind);
    const t0 = Date.now();
    const iv = setInterval(() => { if (!S.exile.guild.active || Date.now() - t0 > 25000) { clearInterval(iv); res2(); } }, 250);
  });
  await runOne('quietcollection');
  await runOne('caravangun');
  res({ done: S.exile.guild.done, ren: S.renegade - ren0, rank: Exile.rank() });
}));
ok('the quiet collection writes the Renegade ledger (+1) — and three contracts done is guild standing 2', r.done === 3 && r.ren >= 1 && r.rank === 2, JSON.stringify(r));

/* ================= THE C-SERIES: tiers on one fire path ================= */
r = await ev(() => {
  S.banked.metal = 300; S.banked.ceramic = 60; S.banked.wood = 60;
  const c20early = Exile.buyRifle('c20');            // rank 2, door unseen
  const went = Exile.buyRifle('c3a1');
  return { c20early, went, tier: S.gear.rifleTier, name: Exile.rifleDef().name, range: Exile.rifleDef().rangeMul, metal: S.banked.metal, cer: S.banked.ceramic };
});
ok('standing 2 buys the C3A1 (80 metal · 20 ceramic, exact) — the C20 stays behind the cold door', r.c20early === false && r.went && r.tier === 'c3a1' && r.name === 'C3A1' && r.range > 1 && r.metal === 220 && r.cer === 40, JSON.stringify(r));
r = await ev(() => new Promise(async res => {
  const runOne = kind => new Promise(res2 => {
    Exile.takeContract(kind);
    const t0 = Date.now();
    const iv = setInterval(() => { if (!S.exile.guild.active || Date.now() - t0 > 25000) { clearInterval(iv); res2(); } }, 250);
  });
  await runOne('ridgewatch'); await runOne('caravangun'); await runOne('ridgewatch'); await runOne('caravangun');
  setTimeout(() => res({ done: S.exile.guild.done, rank: Exile.rank(), door: S.exile.door, mail: S.mails.some(m => /THE COLD DOOR/.test(m.subj)), pin: Exile.visible('colddoor') }), 1200);
}));
ok('seven contracts is standing 3 — THE COLD DOOR turns its corner of the table, mailed and pinned', r.done === 7 && r.rank === 3 && r.door === 'seen' && r.mail && r.pin, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  const knocked = Exile.knock();
  setTimeout(() => {
    S.mcine = null;                                   // the scene played; the test moves on
    const went = Exile.buyRifle('c20');
    res({ knocked, door: S.exile.door, went, tier: S.gear.rifleTier, name: Exile.rifleDef().name, doorMail: S.mails.some(m => /Past the cold door/.test(m.subj)) });
  }, 1500);
}));
ok('a KNOCK opens the Society\'s door — and the C20 comes across the counter behind it', r.knocked && r.door === 'opened' && r.went && r.tier === 'c20' && r.name === 'C20' && r.doorMail, JSON.stringify(r));

/* ================= THE DESK ON THE TABLE ================= */
await ev(() => { WL.timeScale = 1; });
await page.keyboard.press('KeyM'); await page.waitForTimeout(400);
await page.click('#btnViewCont'); await page.waitForTimeout(1200);
r = await ev(() => ({ hits: (Continent._st.hits || []).map(h => h.id).sort().join(',') }));
ok('the table carries the exile pins beside the frontier\'s', /colddoor/.test(r.hits) && /shutterlight/.test(r.hits) && /saltflats/.test(r.hits), JSON.stringify(r));
r = await ev(() => {
  Continent.openDesk('shutterlight');
  const el = document.getElementById('contPanel');
  return { shown: !el.classList.contains('hidden'), head: el.querySelector('.fdHead span').textContent, body: el.textContent };
});
ok('the Shutterlight desk stands on the table — standing, rifle, exchange and guild on one paper', r.shown && /SHUTTERLIGHT/.test(r.head) && /Guild standing/.test(r.body) && /C20/.test(r.body), JSON.stringify({ head: r.head }));
r = await ev(() => {
  const el = document.getElementById('contPanel');
  const a0 = S.gear.ammo338, btn = el.querySelector('[data-act="rounds"]');
  if (btn) btn.click();
  const out = { hadBtn: !!btn, ammo: S.gear.ammo338 - a0 };
  Continent.closeDesk();
  return out;
});
ok('the desk\'s buttons work the real exchange', r.hadBtn && r.ammo > 0, JSON.stringify(r));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

/* ================= THE HOODED ROW: an exile's stone stands with its own ================= */
r = await ev(() => {
  S.pClass = 'lamplighter';
  Porter.die('the far dark');
  const row = S.legacy[S.legacy.length - 1];
  return { fact: row.fact, way: Memorial.rows('waylight').some(x => x.name === row.name), hood: Memorial.rows('lamplighters').some(x => x.name === row.name), wait: !!Memorial.nextUnraised('lamplighters') };
});
ok('a Lamplighter walker\'s death routes the stone to THE HOODED ROW — never the Lantern Rows', r.fact === 'lamplighters' && !r.way && r.hood && r.wait, JSON.stringify(r));
r = await ev(() => {
  const likes0 = S.likes;
  const went = Memorial.raise('lamplighters');
  return { went, dLikes: S.likes - likes0, mail: S.mails.some(m => /A stone for/.test(m.subj) && /UNHOODED/.test(m.body)) };
});
ok('the raise ceremony speaks the exiles\' own voice — UNHOODED on the stone\'s letter', r.went && r.dLikes === 8 && r.mail, JSON.stringify(r));
r = await ev(() => {
  Memorial.open('lamplighters');
  const head = document.getElementById('memHead').textContent;
  const out = { hood: /Hooded Row/i.test(head), voice: /hood comes off the lantern exactly once/.test(head) };
  document.getElementById('memOv').classList.add('hidden');
  return out;
});
ok('and the sheet reads the ground underfoot — THE HOODED ROW\'s paper, not the Order\'s', r.hood && r.voice, JSON.stringify(r));

/* ================= THE SAVE ROUND-TRIP ================= */
await ev(() => { document.getElementById('deathOv').classList.add('hidden'); S.dead = false; S.deadInfo = null; State.save(); });
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue'); await page.waitForTimeout(1500);
r = await ev(() => ({
  phase: Exile.phase(), rank: Exile.rank(), done: S.exile.guild.done, door: S.exile.door,
  tier: S.gear.rifleTier, ground: !!Memorial.site('lamplighters'), hood: Memorial.rows('lamplighters').length,
}));
ok('the exile roads ride the save whole — city open, standing 3, door open, C20 shouldered, the Hooded Row and its stone kept', r.phase === 'open' && r.rank === 3 && r.done === 7 && r.door === 'opened' && r.tier === 'c20' && r.ground && r.hood === 1, JSON.stringify(r));

const realErrors = errors.filter(e => !/CHIP-FAULT/.test(e));
ok('no uncaught page errors across the exile roads', realErrors.length === 0, realErrors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
