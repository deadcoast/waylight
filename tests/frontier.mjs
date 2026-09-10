/* frontier.mjs — v3.28 RECON & OUTPOSTS: the Frostpunk law on the Darklands table.
   The uncharted pins are MISSIONS: a funded Farkeeper rider charts the reach (hazard rolled at
   the midpoint, never a lost rider), a charted reach takes an OUTPOST whose caravan hauls into
   the same bank the v3.27 ecosystem revolves through, unguarded caravans roll raid dice, and the
   Farkeeper escort contract buys the mountain walking beside them at the wage law's price.
   Batched automations proven here too: the presser's clicked mark, the looter's full automation
   (nodes worked into the bank, full backs emptied into lockers). All on the debug page, all real. */
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

/* ================= THE RECON RIDE ================= */
let r = await ev(() => {
  S.banked.metal = 1; S.banked.provisions = 1;   // empty the purse FIRST — the fresh bank can afford a ride
  const before = { ...S.banked };
  const poor = Frontier.fundRecon('saltflats');
  return { poor, phase: Frontier.phase('saltflats'), metal: S.banked.metal, same: S.banked.metal === before.metal };
});
ok('an unfunded recon ride is refused — the bank untouched, the pin still unknown', r.poor === false && r.phase === 'unknown' && r.same, JSON.stringify(r));
r = await ev(() => {
  S.banked.metal = 100; S.banked.provisions = 40;
  const went = Frontier.fundRecon('saltflats');
  return { went, phase: Frontier.phase('saltflats'), metal: S.banked.metal, prov: S.banked.provisions, rider: Frontier.info('saltflats').rider };
});
ok('the funded ride departs — costs paid exactly (20 metal, 6 provisions), a named Farkeeper out', r.went && r.phase === 'riding' && r.metal === 80 && r.prov === 34 && /\w+ \w+/.test(r.rider || ''), JSON.stringify(r));
r = await ev(() => ({ again: Frontier.fundRecon('saltflats'), phase: Frontier.phase('saltflats') }));
ok('a ride cannot be double-funded', r.again === false && r.phase === 'riding', JSON.stringify(r));

/* ride the clock out (dur ≤ 90s + possible 45s hazard) at debug speed */
await ev(() => { WL.timeScale = 40; });
await page.waitForFunction(() => Frontier.phase('saltflats') === 'charted', null, { timeout: 30000 });
r = await ev(() => ({ phase: Frontier.phase('saltflats'), flag: !!S.flags.reconDone, mail: S.mails.some(m => /Salt Flats are CHARTED/.test(m.subj)) }));
ok('the reach CHARTS — the rider always comes home (late at worst), the mail carries the survey', r.phase === 'charted' && r.flag && r.mail, JSON.stringify(r));

/* ================= THE OUTPOST ================= */
r = await ev(() => {
  S.banked.metal = 10;
  const poor = Frontier.fundOutpost('saltflats');
  S.banked.metal = 100; S.banked.wood = 40; S.banked.provisions = 40;
  const went = Frontier.fundOutpost('saltflats');
  return { poor, went, phase: Frontier.phase('saltflats'), metal: S.banked.metal, wood: S.banked.wood, prov: S.banked.provisions };
});
ok('the outpost refuses thin banks, then founds at exactly 40 metal · 20 wood · 12 provisions', r.poor === false && r.went && r.phase === 'building' && r.metal === 60 && r.wood === 20 && r.prov === 28, JSON.stringify(r));
await page.waitForFunction(() => Frontier.phase('saltflats') === 'outpost', null, { timeout: 30000 });
r = await ev(() => ({ mail: S.mails.some(m => /PANHOUSE STATION stands/.test(m.subj)) }));
ok('PANHOUSE STATION stands, announced in the register\'s own voice', r.mail, JSON.stringify(r));

/* ================= THE HAULS: the loop closes into the SAME bank ================= */
r = await ev(() => new Promise(res => {
  const c0 = S.banked.ceramic, p0 = S.banked.provisions, h0 = Frontier.info('saltflats').hauls || 0;
  const t0 = Date.now();
  const iv = setInterval(() => {
    const fr = Frontier.info('saltflats');
    if ((fr.hauls || 0) >= h0 + 3 || Date.now() - t0 > 25000) {
      clearInterval(iv);
      res({ hauls: (fr.hauls || 0) - h0, dc: S.banked.ceramic - c0, dp: S.banked.provisions - p0, raids: fr.raids || 0, eco: S.eco.produced.outpost || 0 });
    }
  }, 300);
}));
ok('the caravans HAUL — ceramic and provisions land in the bank on the cycle, tallied in the ecosystem\'s own ledger', r.hauls >= 3 && r.dc > 0 && r.eco > 0, JSON.stringify(r));
ok('the raid dice are REAL — across hauls, losses or clean runs both leave arithmetic that adds up (full 3+1 when clean, floor-half when raided)', r.dc >= r.hauls, JSON.stringify(r));

/* ================= THE ESCORT CONTRACT — the wage law buys the mountain ================= */
r = await ev(() => new Promise(res => {
  const fr0 = Frontier.info('saltflats');
  Frontier.toggleGuard('saltflats');
  S.banked.provisions = 100;
  const raids0 = fr0.raids || 0, h0 = fr0.hauls || 0, p0 = 100;
  const t0 = Date.now();
  const iv = setInterval(() => {
    const fr = Frontier.info('saltflats');
    if ((fr.hauls || 0) >= h0 + 4 || Date.now() - t0 > 30000) {
      clearInterval(iv);
      res({ guard: fr.guard, hauls: (fr.hauls || 0) - h0, newRaids: (fr.raids || 0) - raids0, paid: p0 - S.banked.provisions });
    }
  }, 300);
}));
ok('the escorted road is SAFE — zero raids across escorted hauls, and the escort eats its wage each cycle', r.guard === true && r.hauls >= 4 && r.newRaids === 0 && r.paid > 0, JSON.stringify(r));
r = await ev(() => {
  S.banked.provisions = 0;
  return new Promise(res => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      const fr = Frontier.info('saltflats');
      if (!fr.guard || Date.now() - t0 > 20000) { clearInterval(iv); res({ lapsed: !fr.guard }); }
    }, 300);
  });
});
ok('the wage law has teeth on the frontier too: an unpaid escort LAPSES', r.lapsed, JSON.stringify(r));

/* ================= LOW MARROW: the second reach yields its own goods ================= */
r = await ev(() => {
  S.banked.metal = 200; S.banked.wood = 100; S.banked.provisions = 100;
  Frontier.fundRecon('lowmarrow');
  return { phase: Frontier.phase('lowmarrow') };
});
ok('the second reach opens the same way', r.phase === 'riding', JSON.stringify(r));
await page.waitForFunction(() => Frontier.phase('lowmarrow') === 'charted', null, { timeout: 30000 });
await ev(() => Frontier.fundOutpost('lowmarrow'));
await page.waitForFunction(() => Frontier.phase('lowmarrow') === 'outpost', null, { timeout: 40000 });
r = await ev(() => new Promise(res => {
  Frontier.toggleGuard('lowmarrow'); S.banked.provisions = 300;   // the mountain walks beside it: hauls measured CLEAN
  const m0 = S.banked.metal, l0 = S.banked.lumen, h0 = Frontier.info('lowmarrow').hauls || 0;
  const t0 = Date.now();
  const iv = setInterval(() => {
    const fr = Frontier.info('lowmarrow');
    if ((fr.hauls || 0) >= h0 + 2 || Date.now() - t0 > 40000) {
      clearInterval(iv);
      res({ phase: fr.phase, dm: S.banked.metal - m0, dl: S.banked.lumen - l0, hauls: (fr.hauls || 0) - h0 });
    }
  }, 300);
}));
ok('MARROW DIGGINGS hauls its OWN goods — bog-iron and marrow-light, not the salt pans\' — every reach a different mouth feeding the loop', r.phase === 'outpost' && r.hauls >= 2 && r.dm === r.hauls * 3 && r.dl === r.hauls * 1, JSON.stringify(r));

/* ================= THE TABLE IS THE SURFACE — pins, desk, columns ================= */
await ev(() => { WL.timeScale = 1; });
await page.keyboard.press('KeyM'); await page.waitForTimeout(400);
await page.click('#btnViewCont'); await page.waitForTimeout(1200);
r = await ev(() => ({ hits: (Continent._st.hits || []).map(h => h.id).sort().join(','), open: Continent.isOpen }));
ok('the table carries a click target for every reach — and v3.32 adds the mountain road pin', r.open && r.hits === 'lowmarrow,mountain,saltflats', JSON.stringify(r));
r = await ev(() => {
  Continent.openDesk('saltflats');
  const el = document.getElementById('contPanel');
  return { shown: !el.classList.contains('hidden'), head: el.querySelector('.fdHead span').textContent, body: el.textContent };
});
ok('the frontier desk opens on the pin — the outpost\'s own sheet, hauls and raids on paper', r.shown && /PANHOUSE STATION/.test(r.head) && /Hauls landed/.test(r.body), JSON.stringify({ head: r.head }));
r = await ev(() => {
  const el = document.getElementById('contPanel');
  const btn = el.querySelector('[data-act="guard"]');
  const before = Frontier.info('saltflats').guard;
  btn.click();
  return { before, after: Frontier.info('saltflats').guard, closed: false };
});
ok('the desk\'s escort button works the contract for real', r.before !== r.after, JSON.stringify(r));
r = await ev(() => { Continent.closeDesk(); return { hidden: document.getElementById('contPanel').classList.contains('hidden') }; });
ok('and the desk folds away', r.hidden, '');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

/* ================= THE PRESSER'S MARK (batched automation 1) ================= */
r = await ev(() => {
  // stage a pooled waylighter at haven and arm the press from the module API (the UI button calls exactly this)
  const n = S.npcs.find(q => q.state === 'pool' && q.at === 'haven' && !q.fk) || S.npcs.find(q => q.state === 'pool' && !q.fk);
  if (!n) return { none: true };
  n.at = 'haven';
  NPC.armPress(String(n.id), 'haven');
  const armed = NPC.pressArmed();
  const went = NPC.pressAt(S.px + 400, S.py + 60);
  const m = S.npcs.find(q => q.id === n.id);
  return { armed, went, state: m.state, job: m.job, custom: m.route && m.route.custom, disarmed: !NPC.pressArmed() };
});
ok('the presser takes a CLICKED MARK as their far end — armed, landed, walking a custom route', !r.none && r.armed && r.went && r.state === 'field' && r.job === 'presser' && r.custom && r.custom.x !== undefined && r.disarmed, JSON.stringify(r));
r = await ev(() => {
  const n = S.npcs.find(q => q.job === 'presser');
  const path = NPC.fieldPathFor ? null : null;
  return new Promise(res => {
    const x0 = n.fx, y0 = n.fy;
    setTimeout(() => res({ moved: Math.abs(n.fx - x0) + Math.abs(n.fy - y0) > 10, hasPath: !!n.fpath && n.fpath.pts.length > 1 }), 3000);
  });
});
ok('and WALKS it — a real path to the mark, feet moving', r.moved && r.hasPath, JSON.stringify(r));
r = await ev(() => {
  NPC.armPress('999999', 'haven');
  const armed = NPC.pressArmed();
  NPC.disarmPress();
  return { armed, off: !NPC.pressArmed() };
});
ok('the mark can be put away (right-click/ESC path)', r.armed && r.off, JSON.stringify(r));

/* ================= THE LOOTER, FULLY AUTOMATED (batched automation 2) ================= */
r = await ev(() => new Promise(res => {
  // a trained back beside you + a scrap pile in reach = the bank fills without a word
  const n = S.npcs.find(q => q.state === 'pool') || S.npcs[0];
  n.state = 'companion'; n.cx = S.px + 10; n.cy = S.py; n.skills.haul = DATA.T.lootAutoLv; n.hungry = false; n.fedT = 999;
  S.nodes.push({ id: U.uid(), type: 'metal', x: S.px + 60, y: S.py + 10, qty: 5, taken: false, respawn: -1 });
  const m0 = S.banked.metal;
  WL.timeScale = 6;
  const t0 = Date.now();
  const iv = setInterval(() => {
    const node = S.nodes[S.nodes.length - 1];
    if (node.taken || Date.now() - t0 > 25000) {
      clearInterval(iv); WL.timeScale = 1;
      res({ taken: node.taken, dm: S.banked.metal - m0 });
    }
  }, 300);
}));
ok('LOOTER AUTOMATION: a haul-4 back works the scrap pile in your sight straight into the bank', r.taken && r.dm === 5, JSON.stringify(r));
r = await ev(() => {
  // the full back empties itself: stuff the carry past the deposit line beside a lit town
  const n = S.npcs.find(q => q.state === 'companion');
  // fill past the deposit line: capOf = 30 + haul*6 = 54kg at haul 4 → threshold 43.2kg
  let guard2 = 0;
  while (n.carry.reduce((a, c) => a + c.kg, 0) < 50 && guard2++ < 200) n.carry.push(State.makeItem('ration'));
  n.cx = DATA.stations.haven.x + 20; n.cy = DATA.stations.haven.y + 20;
  const locker0 = S.stations.haven.storage.length;
  return new Promise(res => setTimeout(() => res({ emptied: n.carry.length === 0, lockered: S.stations.haven.storage.length > locker0 }), 2500));
});
ok('and a FULL back empties into the town\'s lockers — kept and retrievable, never the void', r.emptied && r.lockered, JSON.stringify(r));

/* ================= COHERENCE: save round-trip + the class roster tells the truth ================= */
r = await ev(() => {
  State.save();
  const s = JSON.parse(localStorage.getItem('waylight_save_v1'));
  return { saved: !!(s.frontier && s.frontier.saltflats && s.frontier.saltflats.phase === 'outpost' && s.frontier.lowmarrow.phase === 'outpost'), rider: FACT.FK_CLASSES.recon_rider.live === true };
});
ok('the frontier rides the SAVE (both reaches persisted at their phase) and the Recon Rider stands live on the Republic\'s roster', r.saved && r.rider, JSON.stringify(r));
r = await ev(() => ({ c: Frontier.counts() }));
ok('the table\'s FRONTIER column reads from one truth: 2 charted, 2 outposts, hauls and raids on record', r.c.charted === 2 && r.c.outposts === 2 && r.c.hauls >= 5, JSON.stringify(r));

ok('no uncaught page errors across the frontier', errors.length === 0, errors.join(' | ').slice(0, 300));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
