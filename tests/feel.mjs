/* feel.mjs — the seven complaints, verified: pack buttons click, the companion is clickable and fights,
   shift-click strings routes (world and map), terminals have a named voice, the Walker speaks, and the
   words 'porter' and 'likes' are out of every line a player reads. */
import { chromium } from 'playwright';
const results = [], errors = [];
let r;
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
page.on('pageerror', e => errors.push(e.message));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());

/* 0a. THE TITLE SCREEN IS 1996: the Roll of the Order (Cannon Fodder's hill), rotating box-copy taglines,
       and cheat codes typed blind */
await page.waitForTimeout(400);
const roll0 = await page.evaluate(() => document.getElementById('rollBody').innerText);
ok('the Roll of the Order stands on the title screen — the dead are named and counted', /Juno Longwalk/.test(roll0) && /214/.test(roll0) && /the Silt took her/.test(roll0), roll0.split('\n').slice(0, 2).join(' · '));
const tag1 = await page.evaluate(() => document.getElementById('tagline').textContent);
await page.waitForTimeout(5600);
const tag2 = await page.evaluate(() => document.getElementById('tagline').textContent);
ok('the tagline under the logo turns over like a box quote', tag1.length > 8 && tag2.length > 8 && tag1 !== tag2, `"${tag1}" → "${tag2}"`);
await page.keyboard.type('MELLYGIBS', { delay: 40 }); await page.waitForTimeout(300);
const cheat = await page.evaluate(() => ({ echo: document.getElementById('cheatEcho').textContent, toast: document.getElementById('toasts').innerText }));
ok('typing MELLYGIBS on the title screen works like it\'s 1996 — the Dispatch answers', /MELLYGIBS/.test(cheat.echo) && /(CODE ACCEPTED|OLD TRICKS|DISPATCH SEES)/.test(cheat.toast) && /ROAD WARRIOR/.test(cheat.toast), cheat.toast.replace(/\n/g, ' · ').slice(0, 90));

/* 0. no Death Stranding vocabulary in what a player reads: title, intro, briefing, help */
const titleText = await page.evaluate(() => document.getElementById('titleScreen').innerText.replace(/MELLYGIBS/, ''));
await page.click('#btnNew'); await page.waitForTimeout(150);
const introText = await page.evaluate(() => document.getElementById('introCard').innerText);
await page.click('#btnBegin'); await page.waitForTimeout(250);
const briefText = await page.evaluate(() => document.getElementById('briefOv').innerText);
await page.click('#briefGo'); await page.waitForTimeout(200);
const cgText = await page.evaluate(() => document.getElementById('chargen').innerText);
await page.click('#cgBegin'); await page.waitForTimeout(500);
const helpText = await page.evaluate(() => document.getElementById('helpOv') ? document.getElementById('helpOv').innerText : '');
const visible = titleText + introText + briefText + cgText + helpText;
ok('no "porter" anywhere a player reads (title, intro, briefing, chargen, help)', !/\bporters?\b/i.test(visible), (visible.match(/[^\n]*porter[^\n]*/i) || ['clean'])[0]);
ok('the trade has a name: "Waylighter" carries the intro, the creed closes it', /Waylighters/.test(introText) && /Somebody has to walk it/.test(introText) && /somebody has to walk it/i.test(titleText), introText.split('\n').slice(-3).join(' · ').slice(0, 120));
ok('the intro is The Postman\'s spine: a dead Order, a coat on a hook, Mara holding it out', /Order of Waylighters/.test(introText) && /coat/.test(introText) && /It always fits somebody/.test(introText), introText.split('\n').slice(1, 3).join(' ').slice(0, 130));
ok('pay is "trust", not likes', /trust/.test(briefText) && !/\blikes\b/i.test(briefText), (briefText.match(/[^\n]*trust[^\n]*/) || [''])[0].slice(0, 110));
ok('the briefing is told by a person — Mara Voss', /Mara Voss/.test(briefText));

await page.evaluate(() => { WL.calm(); Render.setFx(false); S.weather.state = 'clear'; S.weather.t = 99999; S.weather.intensity = 0; S.time = 60; });
r = await page.evaluate(() => ({ flares: S.gear.flares, cheated: !!S.flags.cheated }));
ok('the cheat took: five flares in the pack, and the save is marked — help goes on your record', r.flares >= 5 && r.cheated, JSON.stringify(r));

/* 1. the pack is real UI: its buttons click, and clicking them never walks the Walker */
await page.evaluate(() => { WL.tp('haven'); S.px += 500; S.moveTo = null; State.addCargo(State.makeItem('ration')); });
await page.keyboard.press('i'); await page.waitForTimeout(300);
const dropBtn = await page.evaluate(() => { const el = document.querySelector('#cargoList [data-drop]'); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
const before = await page.evaluate(() => ({ n: S.cargo.length, drops: S.drops.length }));
await page.mouse.click(dropBtn.x, dropBtn.y); await page.waitForTimeout(250);
r = await page.evaluate(() => ({ n: S.cargo.length, drops: S.drops.length, moveTo: !!S.moveTo }));
ok('clicking "drop" in the pack drops the item — and does NOT start a walk', r.n === before.n - 1 && r.drops === before.drops + 1 && !r.moveTo, JSON.stringify(r));
const panelPt = await page.evaluate(() => { const p = document.getElementById('cargoPanel').getBoundingClientRect(); return { x: p.x + 30, y: p.y + 20 }; });
await page.mouse.click(panelPt.x, panelPt.y); await page.waitForTimeout(200);
r = await page.evaluate(() => !!S.moveTo);
ok('clicking the pack panel itself moves nothing', !r);
await page.keyboard.press('i'); await page.waitForTimeout(150);

/* 2. the companion chip is clickable and giving works in two clicks */
await page.evaluate(() => {
  S.drops.length = 0;   // section 1's stage litter — the party's hands now reliably stow a crate at their feet (v3.19 law), so clear the floor
  const n = NPC.gen({ at: 'haven' }); n.state = 'companion'; n.carry = []; n.x = S.px + 40; n.y = S.py; n.cx = S.px + 40; n.cy = S.py; n.food = 100; S.npcs.push(n);
  State.addCargo(State.makeItem('food'));
  UI2.updateVitals ? UI2.updateVitals() : null;
});
for (let i = 0; i < 20; i++) { const c = await page.evaluate(() => { if (S.cine && WL.skipCine) WL.skipCine(); return !!S.cine || document.getElementById('hud').classList.contains('hidden'); }); if (!c) break; await page.waitForTimeout(200); }
await page.waitForFunction(() => { const el = document.getElementById('compChip'); return !el.classList.contains('hidden') && /carrying/.test(el.innerText); }, null, { timeout: 8000 });
const chip = await page.evaluate(() => { const el = document.getElementById('compChip'); const r2 = el.getBoundingClientRect(); return { hidden: el.classList.contains('hidden'), x: r2.x + r2.width / 2, y: r2.y + r2.height / 2, text: el.innerText }; });
ok('the companion chip shows who they are and what they carry', !chip.hidden && /carrying/.test(chip.text) && /hand over/.test(chip.text), chip.text.replace(/\n/g, ' · ').slice(0, 90));
await page.click('#compChip'); await page.waitForTimeout(300);   // a real click, actionability-checked: visible, stable, receives the event
r = await page.evaluate(() => ({ open: !document.getElementById('packOv').classList.contains('hidden'), title: document.getElementById('txTitle').innerText, yours: document.querySelectorAll('#txYou [data-txgive]').length, moveTo: !!S.moveTo, cargo: S.cargo.length }));

ok('clicking the chip opens the Waylighter pack screen: you and them, side by side — and nobody walks', r.open && /⇄/.test(r.title) && r.yours >= 1 && !r.moveTo, JSON.stringify(r));
await page.waitForFunction(() => document.querySelector('#txYou [data-txgive]:not(.stuck)'), null, { timeout: 5000 }).catch(() => {});

await page.click('#txYou [data-txgive]:not(.stuck)'); await page.waitForTimeout(250);
r = await page.evaluate(() => ({ carried: NPC.companion().carry.length, theirs: document.querySelectorAll('#txThem [data-txtake]').length }));
ok('one click hands a crate across — it appears in their column at once', r.carried === 1 && r.theirs === 1, JSON.stringify(r));
const takeRow = await page.evaluate(() => ({ kg: document.getElementById('txThemKg').textContent }));
await page.click('#txThem [data-txtake]'); await page.waitForTimeout(250);
r = await page.evaluate(() => ({ carried: NPC.companion().carry.length, kg: document.getElementById('txThemKg').textContent, moveTo: !!S.moveTo }));
ok('ONE CLICK TAKES IT BACK — their column empties, their weight bar drops, nobody walks anywhere', r.carried === 0 && r.kg !== takeRow.kg && !r.moveTo, JSON.stringify(r));
await page.click('#txYou [data-txgive]:not(.stuck)'); await page.waitForTimeout(250);
r = await page.evaluate(() => NPC.companion().carry.length);
ok('one click gives it across again — the screen manages both packs', r === 1);
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
r = await page.evaluate(() => document.getElementById('packOv').classList.contains('hidden'));
ok('Esc closes the hand-over', r);

/* 3. clicking the companion out in the world walks to them and opens the hand-over */
r = await page.evaluate(() => {
  const n = NPC.companion(); n.x = S.px + 300; n.y = S.py + 60;
  const okm = Systems.moveTo(n.x, n.y);
  return { okm, act: S.moveTo && S.moveTo.act, hasFn: !!(S.moveTo && S.moveTo.fn), label: S.moveTo && S.moveTo.label };
});
ok('clicking your walking partner is a real target: walk over and the hand-over opens', r.okm && r.act && r.hasFn, JSON.stringify(r));
await page.evaluate(() => { S.moveTo = null; });

/* 4. shift-click strings a route in the world */
r = await page.evaluate(() => {
  S.route = []; S.moveTo = null;
  Systems.queueMove(S.px + 250, S.py);          // first mark starts the walk
  Systems.queueMove(S.px + 250, S.py + 250);    // the rest string on
  Systems.queueMove(S.px, S.py + 250);
  return { moving: !!S.moveTo, queued: S.route.length };
});
ok('three marks: the first starts the walk, two wait in the string', r.moving && r.queued === 2, JSON.stringify(r));
await page.evaluate(() => { WL.timeScale = 6; });
let chained = false;
for (let i = 0; i < 60; i++) { await page.waitForTimeout(250); const st = await page.evaluate(() => ({ q: S.route.length, m: !!S.moveTo })); if (st.q === 0 && !st.m) { chained = true; break; } }
await page.evaluate(() => { WL.timeScale = 1; });
ok('the Walker takes the marks in order and finishes the string', chained);

/* 5. the map: shift-click strings marks without closing; plain click closes and walks */
await page.keyboard.press('m'); await page.waitForTimeout(400);
const mapPt = await page.evaluate(() => UI.mapPoint(S.px + 600, S.py - 300));
const mapPt2 = await page.evaluate(() => UI.mapPoint(S.px + 900, S.py - 100));
await page.keyboard.down('Shift');
await page.mouse.click(mapPt.x, mapPt.y); await page.waitForTimeout(150);
await page.mouse.click(mapPt2.x, mapPt2.y); await page.waitForTimeout(150);
await page.keyboard.up('Shift');
r = await page.evaluate(() => ({ open: !document.getElementById('mapWrap').classList.contains('hidden'), moving: !!S.moveTo, q: S.route.length }));
ok('two shift-clicks on the map: still open, walking the first, one queued', r.open && r.moving && r.q === 1, JSON.stringify(r));
const mapPt3 = await page.evaluate(() => UI.mapPoint(S.px + 300, S.py + 100));
await page.mouse.click(mapPt3.x, mapPt3.y); await page.waitForTimeout(250);
r = await page.evaluate(() => ({ open: !document.getElementById('mapWrap').classList.contains('hidden'), moving: !!S.moveTo, q: S.route.length }));
ok('a plain click closes the map, drops the string, and walks there', !r.open && r.moving && r.q === 0, JSON.stringify(r));
await page.evaluate(() => { Systems.cancelMove(); });

/* 6. the companion does not watch you die: a charging scrapper gets met and knocked flat */
r = await page.evaluate(() => {
  const n = NPC.companion(); n.shoveCd = 0; n.hungry = false;
  const cdef = DATA.camps[0], c = S.camps[cdef.id];
  WL.tp([cdef.x, cdef.y]); n.x = S.px + 30; n.y = S.py; n.cx = S.px + 30; n.cy = S.py;   // the live party position rides n.cx now
  S.cargo.push(State.makeItem('food'));
  c.runners.length = 0; c.runners.push({ x: S.px + 120, y: S.py, wa: 0, state: 'patrol', cd: 0 });
  const r0 = c.runners[0];
  for (let i = 0; i < 40; i++) Systems.update(0.05, {});
  return { dist: U.dist(r0.x, r0.y, S.px, S.py) | 0, cd: +r0.cd.toFixed(1), taught: !!S.flags.tut.firstIntercept, hp: S.health | 0 };
});
ok('the companion meets the charge: scrapper knocked back and cooling down, you untouched', r.dist > 150 && r.cd > 0 && r.taught && r.hp === 100, JSON.stringify(r));

/* 7. every terminal has a face: Mara greets a stranger, and the line follows the station's state */
r = await page.evaluate(() => {
  WL.tp('haven'); S.stations.haven.met = false;
  WL.openStation('haven');
  const hello = document.getElementById('keeperLine').innerText;
  document.getElementById('stationClose').click();
  S.stations.haven.stock.food = 5; S.stations.haven.stock.meds = 5; S.stations.haven.stock.lumenCell = 5;
  WL.openStation('haven');
  const crit = document.getElementById('keeperLine').innerText;
  document.getElementById('stationClose').click();
  return { hello, crit };
});
ok('first visit: the keeper introduces themself by name', /MARA VOSS/i.test(r.hello) && /Make me proud/.test(r.hello), r.hello.slice(0, 90));
ok('the greeting follows the station\'s state: empty stores get the hard line', /We are OUT/.test(r.crit), r.crit.slice(0, 90));

/* 8. the Walker has a voice: night falls out in the open and they say so */
r = await page.evaluate(() => {
  WL.tp([6500, 10100]); S.moveTo = null; S.wasNight = false; S.flags.barks = {};
  S.time = DATA.T.dayLen * 0.62;
  Systems.update(0.05, {});
  return { barked: (S.flags.barks.night || 0) >= 1 };
});
ok('night falls in the open — the Walker says something about it (once, not a chatterbox)', r.barked, JSON.stringify(r));

/* 8b. scrappers talk trash when the chase starts; a delivery a keeper needed gets their voice on the results screen */
r = await page.evaluate(() => {
  S.time = 60; const cdef = DATA.camps[0], c = S.camps[cdef.id];
  WL.tp([cdef.x, cdef.y - cdef.r * 0.5]); S.cargo = [State.makeItem('food')]; c.shoutCd = 0;
  const n = NPC.companion(); if (n) { n.x = 0; n.y = 0; n.shoveCd = 99; }   // companion far away: the shout is the scrappers' moment
  window.__says = []; const s0 = Render.say; Render.say = (x, y, t, col) => { window.__says.push(t); return s0(x, y, t, col); };
  for (let i = 0; i < 30; i++) Systems.update(0.05, {});
  Render.say = s0;
  return { shouted: window.__says.some(t => DATA.scrapShouts.includes(t)) };
});
ok('scrappers yell when the chase starts — the bad guys have manners from Mutant League', r.shouted, JSON.stringify(r));
r = await page.evaluate(() => {
  S.cargo = []; S.orders.active = []; WL.tp('elm'); S.stations.elm.met = true; S.stations.mill.met = true; S.stations.mill.stock.food = 5;
  Systems.acceptOrder(Economy.ordersFor('elm').find(x => x.item === 'food' && x.to === 'mill'), false);
  WL.tp('mill'); WL.openStation('mill'); WL.skipHandover();
  const shown = !document.getElementById('results').classList.contains('hidden');
  const body = shown ? document.getElementById('scoreRows').innerText : '';
  const stamp = document.getElementById('gradeLine').textContent;
  document.getElementById('resultsClose').click();
  return { shown, body, stamp };
});
ok('the results screen carries the keeper\'s voice and an arcade stamp line', r.shown && /Bo Tammen/.test(r.body) && /RATIONS! EVERYBODY/.test(r.body) && r.stamp.length > 4, `stamp "${r.stamp}" · ` + r.body.replace(/\n/g, ' · ').slice(0, 110));

/* 8c. NBA Jam booth: chained stops get the Dispatch shouting; ranks arrive as FIELD PROMOTIONS */
r = await page.evaluate(() => {
  S.cargo = []; S.orders.active = []; S.trip = { n: 1, lastT: S.time };   // one stop already landed this trip
  WL.tp('elm'); S.stations.haven.stock.food = 30;
  Systems.acceptOrder(Economy.ordersFor('elm').find(x => x.item === 'food' && x.to === 'haven'), false);
  WL.tp('haven'); WL.openStation('haven'); WL.skipHandover();
  const a = document.getElementById('announce').textContent;
  document.getElementById('resultsClose').click();
  return { a };
});
ok('second stop of one trip — the Dispatch calls it: "DOUBLE DROP. THE WIRE NOTICES."', /DOUBLE DROP/.test(r.a), r.a);
r = await page.evaluate(() => { State.grantLikes(1700 - S.likes); const t = Render.crtText(); return { a: t ? t.big + ' | ' + t.small : '', lvl: S.level }; });
ok('crossing a rank: FIELD PROMOTION takes the big CRT voice, dispatch subtitle under it', /FIELD PROMOTION/.test(r.a) && /MUDFOOT/.test(r.a) && /DISPATCH/.test(r.a), `${r.a} (lv ${r.lvl})`);

/* 9. accepting an order gives visible feedback: the card flashes and slides */
r = await page.evaluate(() => {
  S.time = 60; WL.tp('haven'); S.stations.elm.met = true; S.stations.elm.stock.tools = 30;
  WL.openStation('haven');
  const btn = document.querySelector('#stationBody .orderCard:not(.prio) [data-accept]');
  if (!btn) return { none: true };
  btn.click();
  const card = document.querySelector('#stationBody .orderCard.taken');
  return { taken: !!card };
});
ok('accepting an order marks the card "taken" — it flashes gold and slides off', r.taken === true, JSON.stringify(r));

console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed · errors: ${errors.length ? errors.join(' | ') : 'none'}`);
await b.close();
