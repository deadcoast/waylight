/* pixelpass.mjs — the v3.11 pixel pass: plates that press, the survey sheet that doesn't stop
   the world, the keycap beside the walker, hearts for wounds, the CRT voice for pivotal moments,
   crates you can see, and Mara's photo on the file. */
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

/* 0. Mara's photo is authored pixels on the briefing */
let r = await page.evaluate(() => {
  const c = document.getElementById('maraCv'); if (!c) return null;
  const d = c.getContext('2d').getImageData(0, 0, 24, 26).data;
  let coat = 0, face = 0, pin = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] === 0x6b && d[i + 1] === 0x4a && d[i + 2] === 0x30) coat++;
    if (d[i] === 0xcf && d[i + 1] === 0xa8 && d[i + 2] === 0x7e) face++;
    if (d[i] === 0xff && d[i + 1] === 0xd9 && d[i + 2] === 0x8f) pin++;
  }
  return { coat, face, pin };
});
ok('Mara Voss — leather-brown coat, a face, one gold pin', r && r.coat > 80 && r.face > 40 && r.pin === 1, JSON.stringify(r));

await page.click('#briefGo'); await page.waitForTimeout(200);

/* 1. the d20 rides only where rolling happens */
r = await page.evaluate(() => {
  const roll = document.querySelector('#cgRoll .d20'), re = document.querySelector('#cgReName .d20');
  const anywhereElse = document.querySelectorAll('.d20').length;
  return { roll: !!roll && /data:image\/png/.test(roll.style.backgroundImage), re: !!re, count: anywhereElse };
});
ok('the die sits on "Roll a stranger" and "reroll" — and nowhere else', r.roll && r.re && r.count === 2, JSON.stringify(r));

await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); });
await page.waitForTimeout(300);

/* 2. plate chrome: buttons carry the side-plate border and the extruded base */
r = await page.evaluate(() => {
  const bs = getComputedStyle(document.getElementById('btnHelp') || document.querySelector('.btn')).boxShadow;
  const grooves = getComputedStyle(document.querySelector('.meter')).boxShadow;
  return { plates: (bs.match(/rgb/g) || []).length >= 6, base: /0px 5px 0px/.test(bs), border: getComputedStyle(document.querySelector('.btn')).borderStyle, groove: /inset/.test(grooves) };
});
ok('buttons are plates: side-slabs + straight-down base, no CSS border', r.plates && r.base && r.border === 'none', JSON.stringify(r));
ok('meters are grooves: side-slabs + sunken inner shadow', r.groove === true, '');

/* 3. the .k keycap lost its border-radius — no curve survives the chrome */
r = await page.evaluate(() => getComputedStyle(document.querySelector('.k')).borderRadius);
ok('key chips are square-cut', r === '0px', r);

/* 4. movement continues under the open survey sheet (default) */
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 40]); S.moveTo = null; });
await page.waitForTimeout(200);
await page.keyboard.press('m'); await page.waitForTimeout(300);
r = await page.evaluate(() => ({ open: UI.mapOpen, ck: document.getElementById('mapPauseCk').checked, frozen: UI.worldFrozen() }));
ok('survey sheet opens with movement live: toggle default OFF, world not frozen', r.open && !r.ck && !r.frozen, JSON.stringify(r));
const p0 = await page.evaluate(() => ({ x: S.px, y: S.py }));
await page.keyboard.down('w');
await page.waitForTimeout(700);
await page.keyboard.up('w');
const p1 = await page.evaluate(() => ({ x: S.px, y: S.py }));
ok('WASD walks the porter while the sheet is open', Math.hypot(p1.x - p0.x, p1.y - p0.y) > 12, `moved ${Math.hypot(p1.x - p0.x, p1.y - p0.y) | 0} u`);

/* 5. the toggle pauses the world, and the choice persists in the browser */
await page.check('#mapPauseCk'); await page.waitForTimeout(150);
r = await page.evaluate(() => ({ frozen: UI.worldFrozen(), saved: (JSON.parse(localStorage.getItem('waylight.opts') || '{}')).mapPause }));
ok('checking "Pause Movement on Map" freezes the world and persists', r.frozen === true && r.saved === true, JSON.stringify(r));
const p2 = await page.evaluate(() => ({ x: S.px, y: S.py }));
await page.keyboard.down('w'); await page.waitForTimeout(500); await page.keyboard.up('w');
const p3 = await page.evaluate(() => ({ x: S.px, y: S.py }));
ok('with the toggle on, the boots wait', Math.hypot(p3.x - p2.x, p3.y - p2.y) < 2, `moved ${Math.hypot(p3.x - p2.x, p3.y - p2.y) | 0} u`);
await page.evaluate(() => { document.getElementById('mapPauseCk').checked = false; document.getElementById('mapPauseCk').dispatchEvent(new Event('change')); });

/* 6. danger drops the paper: a struggle beginning closes the sheet */
r = await page.evaluate(async () => {
  S.struggle = { meter: 0.4, wraith: null };
  await new Promise(res => setTimeout(res, 350));
  const open = UI.mapOpen;
  S.struggle = null; UI.showStruggle(false);
  return open;
});
ok('a wraith grab tears the survey sheet away', r === false, '');

/* 7. the [E] keycap stands beside the walker at a terminal, and the real key presses it */
await page.evaluate(() => { const d = DATA.stations.haven; WL.tp([d.x + 40, d.y + 40]); S.moveTo = null; });
await page.waitForTimeout(400);
r = await page.evaluate(() => Render.eKeyState());
ok('an E-interaction in range shows the keycap', r.shown === true && r.held === false, JSON.stringify(r));
await page.keyboard.down('e');
r = await page.evaluate(() => Render.eKeyState().held);
ok('holding the real E presses the drawn key', r === true, '');
await page.keyboard.up('e');
r = await page.evaluate(() => Render.eKeyState().held);
ok('releasing E lets the key back up', r === false, '');
await page.keyboard.press('Escape'); await page.waitForTimeout(250);

/* 8. hearts: five of twenty, counted in wounds */
r = await page.evaluate(() => {
  const count = hp => {
    S.health = hp; for (let i = 0; i < 30; i++) UI.drawHearts();   // burn through the damage flash
    const c = document.getElementById('hpHearts');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let body = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 0xd9 && d[i + 1] === 0x6b && d[i + 2] === 0x4f) body++;
    return body;
  };
  const full = count(100), half = count(50), low = count(10);
  S.health = 100;
  return { full, half, low };
});
ok('hearts drain in half-heart steps: 100 > 50 > 10 body pixels', r.full > r.half && r.half > r.low && r.low > 0, JSON.stringify(r));

/* 9. the CRT voice: big white type, scanlines, then silence */
r = await page.evaluate(() => { Render.crtTitle('PROOF OF VOICE', 'a subtitle under it', { hold: 1.2 }); return Render.crtActive(); });
await page.waitForTimeout(500);
r = await page.evaluate(() => {
  const c = document.getElementById('crtCv'); if (!c) return null;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let white = 0, dark = 0;
  for (let i = 0; i < d.length; i += 16) { if (d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240 && d[i + 3] > 200) white++; if (d[i + 3] > 100 && d[i] < 20) dark++; }
  return { active: Render.crtActive(), white, dark };
});
ok('the CRT title burns white through a dark band', r && r.active && r.white > 150 && r.dark > 400, JSON.stringify(r));
await page.waitForTimeout(1100);
r = await page.evaluate(() => Render.crtActive());
ok('and then it is gone — the voice does not linger', r === false, '');

/* 10. the voice speaks only at its four doors: first greyfall fires it once */
r = await page.evaluate(async () => {
  S.flags.sawGreyfall = false; S.weather.state = 'veil'; S.weather.t = 0.01;
  await new Promise(res => setTimeout(res, 250));
  const first = Render.crtText();
  const active1 = Render.crtActive();
  // run it out, then a second greyfall must stay silent
  await new Promise(res => setTimeout(res, 3800));
  S.weather.state = 'veil'; S.weather.t = 0.01;
  await new Promise(res => setTimeout(res, 250));
  return { first: first && first.big, again: Render.crtActive() };
});
ok('first GREYFALL takes the big voice — the second stays quiet', r.first === 'GREYFALL' && r.again === false, JSON.stringify(r));

/* 11. every item leads with its icon — and a mission item is gold, icon and title, always */
r = await page.evaluate(() => {
  S.cargo.push(State.makeItem('meds', 999), State.makeItem('food'), State.makeItem('bandage'));
  UI.toggleCargo(true); UI.refreshCargo();
  const chips = document.querySelectorAll('#cargoList .crateChip').length;
  const distinct = new Set([...document.querySelectorAll('#cargoList .crateChip')].map(i => i.src)).size;
  const gold = document.querySelectorAll('#cargoList .missionTx').length;
  const goldColor = gold ? getComputedStyle(document.querySelector('#cargoList .missionTx')).color : '';
  S.cargo = S.cargo.filter(c => c.orderId !== 999);
  UI.refreshCargo(); UI.toggleCargo(false);
  return { chips, distinct, gold, goldColor };
});
ok('every pack item leads with an icon; the order-bound one is gold, icon and title',
  r.chips >= 3 && r.distinct >= 3 && r.gold >= 1 && /255, 217, 143/.test(r.goldColor), JSON.stringify(r));

/* 12. the folder finishes the file cabinet: open on the active tab, closed on the rest */
r = await page.evaluate(() => {
  UI.openStation('haven');
  const act = getComputedStyle(document.querySelector('.tab.active'), '::before');
  const idle = getComputedStyle(document.querySelectorAll('.tab:not(.active)')[0], '::before');
  const v = { activeFolder: /svg/.test(act.backgroundImage), idleBare: !/svg/.test(idle.backgroundImage), pops: /folderPop/.test(act.animationName) };
  UI.closeStation();
  return v;
});
ok('ONE folder, on the open drawer only — it appears with the active tab and pops once', r.activeFolder && r.idleBare && r.pops, JSON.stringify(r));

/* 13. the survey sheet is a document: rail, legend, footer, nameplate */
r = await page.evaluate(() => ({
  rail: !!document.getElementById('mapRail'),
  legend: !!document.querySelector('#mapRail #mapLegend'),
  foot: !!document.getElementById('mapFoot'),
  plate: /0px 5px/.test(getComputedStyle(document.querySelector('#mapHead h2')).boxShadow),
}));
ok('the map is the Survey Sheet: docked rail, legend, footer strip, riveted nameplate', r.rail && r.legend && r.foot && r.plate, JSON.stringify(r));

/* errors gate */
ok('no page errors across the pass', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks green`);
await b.close();
