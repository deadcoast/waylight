/* pixelpass.mjs — v3.11 PLATE & PAPER, THE PIXEL PASS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48
   source was lost; its figures sampled on the courier's grid). Paper is read; plate is pressed. Mara Voss's personnel photo
   counted texel by texel on its canvas; the die, confined to its two buttons and tumbling three faces; the plate (four
   side-slabs, the notched corners, the face pressed straight down onto its base), the groove, the riveted nameplate; the
   square-cut crate chips; the world walking on under the open map (WASD), frozen by its toggle, the toggle round-tripping
   the browser store across a reload; a grab tearing the map away; the [E] keycap shown, pressed and released against real key
   events; the hearts counted at 100/50/10 through the damage flash; the CRT voice burning white through its band and going
   silent; the first greyfall firing its CRT once and never twice; the folder on the open drawer only; and the map's anatomy
   (v3.49: the Survey Sheet is the Map). */
import { boot } from './lib/harness.mjs';

const T = await boot({ start: false });
const { ev, ok, page } = T;
const t0 = Date.now();
const R = {};   // evidence, gathered in the order the walk allows and filed in the record's order

/* ================= the briefing: Mara's photo ================= */
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(500);
R.mara = await ev(() => {
  const src = [...document.querySelectorAll('script')].map(s => s.textContent).join('\n'), a = src.indexOf('function drawMara'), body = src.slice(a, src.indexOf('function boot', a));
  const rows = [...body.slice(body.indexOf('const ROWS'), body.indexOf('];', body.indexOf('const ROWS'))).matchAll(/'([^']*)'/g)].map(m => m[1]);
  const pal = Object.fromEntries([...body.slice(body.indexOf('const C = {')).split('}')[0].matchAll(/(\w): '(#[0-9a-f]{6})'/g)].map(m => [m[1], m[2]]));
  const want = {}; for (const rw of rows) for (const ch of rw) if (ch !== '.') want[pal[ch]] = (want[pal[ch]] || 0) + 1;
  const cv = document.getElementById('maraCv'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, got = {};
  for (let i = 0; i < d.length; i += 4) { const h = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); got[h] = (got[h] || 0) + 1; }
  const same = Object.entries(want).every(([h, n]) => got[h] === n);
  const cs = getComputedStyle(cv), cap = document.querySelector('#maraPhoto .tag');
  const coat = (got['#6b4a30'] || 0) + (got['#503722'] || 0) + (got['#8a6534'] || 0);
  return { shown: !document.getElementById('briefOv').classList.contains('hidden'), rows: rows.length, same, want, pin: got['#ffd98f'] || 0, shirt: got['#d8d2bd'] || 0, coat, bg: got['#141a22'] || 0, frame: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor, pixelated: cs.imageRendering, caption: cap && cap.textContent };
});
await page.click('#briefGo'); await page.waitForTimeout(400);

/* ================= the enlistment: the die ================= */
R.die = await ev(async () => {
  const dice = [...document.querySelectorAll('.d20')], hosts = dice.map(d => d.parentElement.id);
  const b = document.getElementById('cgRoll'), d0 = b.querySelector('.d20'), faces = new Set([d0.style.backgroundImage]);
  b.click();
  for (let k = 0; k < 8; k++) { await __wait(40); faces.add(d0.style.backgroundImage); }
  await __wait(400);
  const img = new Image(); img.src = d0.style.backgroundImage.slice(5, -2); await img.decode();
  return { n: dice.length, hosts, labels: ['cgRoll', 'cgReName'].map(id => document.getElementById(id).textContent.trim()), faces: faces.size, restFace: d0.style.backgroundImage === [...faces][0], die: [img.naturalWidth, img.naturalHeight], rendering: getComputedStyle(d0).imageRendering };
});
await page.click('#cgBegin'); await page.waitForTimeout(1200);
await T.skipCine();
await ev(() => {
  S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
  S.weather.state = 'clear'; S.weather.t = 99999;   // no greyfall but the one this suite stages
});
await T.instruments();

/* ================= the plate, the groove, the nameplate ================= */
await page.keyboard.press('KeyM'); await page.waitForTimeout(400);
{
  await page.locator('#railLedgersBtn').scrollIntoViewIfNeeded();
  const box = await page.locator('#railLedgersBtn').boundingBox();
  const rest = await ev(() => { const s = getComputedStyle(document.getElementById('railLedgersBtn')); return { shadow: s.boxShadow, transform: s.transform, radius: s.borderTopLeftRadius, border: s.borderTopStyle }; });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  const pressed = await ev(() => { const s = getComputedStyle(document.getElementById('railLedgersBtn')); return { shadow: s.boxShadow, transform: s.transform}; });
  await page.mouse.move(box.x + box.width / 2 + 400, box.y - 300); await page.mouse.up();   // released off the plate: no click
  R.plate = { rest, pressed, rulesOpened: await ev(() => { const el = document.getElementById('ledgerOv') || document.querySelector('#lgTabDossier'); return !!el && !!el.offsetParent; }) };
}
await page.keyboard.press('KeyM'); await page.waitForTimeout(300);
R.groove = await ev(() => { const m = document.querySelector('#vitals .meter'), s = getComputedStyle(m), a = getComputedStyle(m, '::after'); return { shadow: s.boxShadow, radius: s.borderTopLeftRadius, ticks: a.backgroundImage.slice(0, 40), fill: getComputedStyle(m.querySelector('i')).backgroundImage }; });
await ev(() => { WL.tp('haven'); UI.openStation('haven'); });
await T.drain();
R.nameplate = await ev(() => {
  const heads = [...document.querySelectorAll('.sheet header h2')], live = heads.filter(h => h.offsetParent), s = getComputedStyle(live[0]);
  const plated = heads.every(h => { const c = getComputedStyle(h); return (c.boxShadow.match(/-2px 0px 0px/g) || []).length >= 1 && (c.boxShadow.match(/px/g) || []).length >= 16; });
  return { n: heads.length, live: live.map(h => h.textContent.trim()).slice(0, 3), shadow: s.boxShadow, bg: s.backgroundColor, display: s.display, plated };
});

/* ================= the folder, on the open drawer only ================= */
{
  const fold = () => ev(() => [...document.querySelectorAll('#stationTabs .tab')].map(t => { const b = getComputedStyle(t, '::before'); return { name: t.textContent.trim(), active: t.classList.contains('active'), folder: /svg/.test(b.backgroundImage) && b.content !== 'none', anim: b.animationName }; }));
  const a = await fold();
  await page.click('#stationTabs .tab[data-tab="fab"]'); await page.waitForTimeout(300);
  const b = await fold();
  R.folder = { a, b };
  await page.click('#stationClose'); await page.waitForTimeout(200);
}

/* ================= the square-cut chips ================= */
await page.keyboard.press('KeyI'); await page.waitForTimeout(400);
R.chips = await ev(async () => {
  const im = [...document.querySelectorAll('#cargoPanel img.crateChip')];
  const one = im[0]; let nat = null;
  if (one) { const t = new Image(); t.src = one.getAttribute('src'); await t.decode(); nat = [t.naturalWidth, t.naturalHeight]; }
  const cs = one ? getComputedStyle(one) : null;
  return { n: im.length, png: im.every(i => /^data:image\/png/.test(i.getAttribute('src') || '')), nat, shown: one ? [one.clientWidth, one.clientHeight] : null, radius: cs && cs.borderTopLeftRadius, rendering: cs && cs.imageRendering, distinct: new Set(im.map(i => i.getAttribute('src'))).size };
});
await page.keyboard.press('KeyI'); await page.waitForTimeout(200);

/* ================= walking under the open map; the toggle; the grab ================= */
const walk = async ms => { const x0 = await ev(() => S.px); await page.keyboard.down('KeyD'); await page.waitForTimeout(ms); await page.keyboard.up('KeyD'); await page.waitForTimeout(150); return +((await ev(() => S.px)) - x0).toFixed(1); };
await ev(async () => { const H = DATA.stations.haven; WL.tp([H.x + 400, H.y + 260]); S.speed = 0; S.moveTo = null; WL.timeScale = 1; await __frames(2); });
await page.keyboard.press('KeyM'); await page.waitForTimeout(300);
R.sheet = { open: await ev(() => UI.mapOpen), walked: await walk(900) };
/* the box is clicked for real, then the eye goes back to the sheet (a click on its title) so the keys walk again */
await page.click('#mapPauseCk'); await page.click('#mapTitle'); await page.waitForTimeout(200);
R.sheet.focus = await ev(() => document.activeElement.tagName);
R.sheet.frozenPx = await walk(900);
R.sheet.stored = await ev(() => JSON.parse(localStorage.getItem('waylight.opts') || '{}').mapPause);
R.sheet.frozen = await ev(() => UI.worldFrozen());
await page.click('#mapPauseCk'); await page.click('#mapTitle'); await page.waitForTimeout(200);
R.sheet.storedOff = await ev(() => JSON.parse(localStorage.getItem('waylight.opts') || '{}').mapPause);
R.sheet.again = await walk(700);
/* the grab: a hunting wraith closes on the Walker while the map is open */
R.grab = await ev(async () => {
  /* out in the deep grey of the north, where the kept hunt */
  let spot = null;
  for (let y = 1800; y < 4200 && !spot; y += 150) for (let x = 1200; x < 7200 && !spot; x += 150) { const t = World.terrainAt(x, y), t2 = World.terrainAt(x + 20, y); if (!t.blocked && !t.water && !t2.blocked && !t2.water && World.mistAt(x, y) > 0.6 && World.mistAt(x + 20, y) > 0.6) spot = { x, y }; }
  WL.tp([spot.x, spot.y]); S.speed = 0; S.moveTo = null; await __frames(2);
  const before = UI.mapOpen;
  S.wraiths = [{ id: U.uid(), x: S.px + 20, y: S.py, alert: 1, state: 'hunt', cd: 0, ph: 0 }];
  Systems.update(1 / 60, {});
  const gripped = !!S.struggle;
  await __frames(3); await __wait(100);
  const after = UI.mapOpen, sheetHidden = document.getElementById('mapWrap').classList.contains('hidden');
  S.struggle = null; UI.showStruggle && UI.showStruggle(false); S.wraiths = [];
  const H = DATA.stations.haven; WL.tp([H.x + 400, H.y + 260]); await __frames(2);
  return { spot, mist: +World.mistAt(spot.x, spot.y).toFixed(2), before, gripped, after, sheetHidden };
});
await page.keyboard.press('KeyM'); await page.waitForTimeout(350);
R.anatomy = await ev(() => {
  const q = s => document.querySelector(s), txt = s => (q(s) || {}).textContent || '';
  const rail = q('#mapRail'), foot = q('#mapFoot'), head = q('#mapHead');
  const hr = head.getBoundingClientRect(), rr = rail.getBoundingClientRect(), fr = foot.getBoundingClientRect(), cr = q('#mapCanvasWrap').getBoundingClientRect();
  return {
    title: txt('#mapTitle'), sub: txt('#mapSub'), views: [...document.querySelectorAll('#mapViewBtns button')].map(b => b.textContent.trim()),
    railHeads: [...rail.querySelectorAll('.railHead')].map(h => h.textContent.trim()), legend: rail.querySelectorAll('#mapLegend > div').length,
    pause: !!q('#mapPauseCk') && /Pause Movement on Map/.test(txt('#mapRail')), keys: [...foot.querySelectorAll('.k')].map(k => k.textContent.trim()),
    docked: rr.left <= cr.left && rr.top >= hr.bottom - 1 && fr.top >= cr.bottom - 1, headPlate: getComputedStyle(q('#mapTitle')).fontWeight,
  };
});
/* the live readout: a shift-click on the valley strings a mark (the sheet stays open for it) and the rail reads the walk */
{
  R.anatomy.before = await ev(() => document.getElementById('railWalk').textContent);
  const pt = await ev(() => UI.mapPoint(S.px + 260, S.py + 40));
  await page.keyboard.down('Shift'); await page.mouse.click(pt.x, pt.y); await page.keyboard.up('Shift');
  await page.waitForTimeout(500);
  R.anatomy.readout = await ev(() => document.getElementById('railWalk').textContent);
  R.anatomy.walking = await ev(() => !!S.moveTo);
  R.anatomy.stillOpen = await ev(() => UI.mapOpen);
  await ev(() => { if (S.moveTo) Systems.cancelMove(); S.route = []; });
  /* and the toggle left on, for the reload at the end */
  await page.click('#mapPauseCk'); await page.click('#mapTitle'); await page.waitForTimeout(150);
  await page.keyboard.press('KeyM'); await page.waitForTimeout(200);
}

/* ================= the [E] keycap ================= */
R.keycap = {};
await ev(async () => {
  const H = DATA.stations.haven; WL.tp([H.x + 360, H.y + 260]); S.speed = 0; S.moveTo = null;
  S.structures.push({ id: U.uid(), type: 'watchtower', x: S.px + 30, y: S.py - 10, ang: 0, hp: 40, by: 'you', likes: 0 });
  S.banked.metal = 0;   // a repair wanted and nothing to pay it with: E is refused, the prompt stands
  __clearAmb(S.px, S.py, 300); Render.clearFx(); WL.timeScale = 1; await __wait(400); await __frames(3);
});
const capLook = () => ev(() => {
  const p = __toScr(S.px, S.py), g = document.getElementById('game').getContext('2d'), dpr = devicePixelRatio;
  const d = g.getImageData(Math.round((p.x + 8) * dpr), Math.round((p.y - 84) * dpr), Math.round(44 * dpr), Math.round(56 * dpr)).data;
  return { state: Render.eKeyState(), prompt: (UI.prompts || []).filter(x => x.key === 'E').map(x => x.label.replace(/<[^>]+>/g, '')), gold: __count(d, [255, 217, 143], 6), bone: __count(d, [242, 234, 212], 6), face: __count(d, [57, 67, 76], 4), faceDown: __count(d, [46, 54, 63], 4) };
});
R.keycap.shown = await capLook();
await page.keyboard.down('KeyE'); await page.waitForTimeout(160);
R.keycap.pressed = await capLook();
await page.keyboard.up('KeyE'); await page.waitForTimeout(160);
R.keycap.released = await capLook();
await ev(() => { S.structures = S.structures.filter(s => !(s.type === 'watchtower' && s.hp === 40)); S.banked.metal = 100; });

/* ================= the hearts ================= */
R.hearts = await ev(async () => {
  const cv = document.getElementById('hpHearts'), g = cv.getContext('2d');
  const count = () => { UI.drawHearts(); const d = g.getImageData(0, 0, cv.width, cv.height).data; return { blood: __count(d, [217, 107, 79], 3), empty: __count(d, [34, 19, 23], 3), bone: __count(d, [242, 234, 212], 3) }; };
  S.health = 100; S.bleeding = false; await __wait(400); await __frames(3);
  const at100 = count();
  Porter.damage(50, 'fall'); await __frames(1); const flash50 = count();
  await __wait(450); await __frames(2); const at50 = count();
  Porter.damage(40, 'fall'); await __frames(1); const flash10 = count();
  await __wait(450); await __frames(2); const at10 = count();
  S.health = 100; S.bleeding = false;
  return { at100, flash50, at50, flash10, at10, size: [cv.width, cv.height], shown: [cv.clientWidth, cv.clientHeight] };
});

/* ================= the CRT voice, on the first greyfall ================= */
R.crt = await ev(async () => {
  const crt = () => { const c = document.getElementById('crtCv'); if (!c) return { white: 0, band: 0 }; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let white = 0, band = 0; for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 200 && d[i] > 240 && d[i + 1] > 240 && d[i + 2] > 240) white++; else if (d[i + 3] > 60 && d[i] < 20 && d[i + 1] < 20 && d[i + 2] < 30) band++; } return { white, band }; };
  S.flags.sawGreyfall = false; S.weather.state = 'veil'; S.weather.t = 0.01; WL.timeScale = 1;
  await __frames(3); await __wait(700); await __frames(2);
  const first = { text: Render.crtText(), active: Render.crtActive(), ...crt(), weather: S.weather.state, saw: !!S.flags.sawGreyfall };
  for (let k = 0; k < 40 && Render.crtActive(); k++) await __wait(200);
  await __frames(3);
  const after = { active: Render.crtActive(), text: Render.crtText(), ...crt() };
  /* a second greyfall: the rain comes, the CRT does not */
  S.weather.state = 'clear'; S.weather.t = 0.01; await __frames(3);
  S.weather.state = 'veil'; S.weather.t = 0.01; await __frames(3); await __wait(500);
  const second = { weather: S.weather.state, active: Render.crtActive(), text: Render.crtText(), ...crt() };
  S.weather.state = 'clear'; S.weather.t = 99999;
  return { first, after, second };
});

/* ================= the reload: the map's toggle kept by the browser ================= */
await ev(() => State.save());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
R.sheet.reloaded = await ev(() => ({ checked: document.getElementById('mapPauseCk').checked, stored: JSON.parse(localStorage.getItem('waylight.opts') || '{}').mapPause, title: !document.getElementById('titleScreen').classList.contains('hidden') }));

/* ================= the checks, in the record's order ================= */
ok('MARA\'S PHOTO: the briefing is Mara Voss talking, her personnel photo counted texel by texel on its 24×26 canvas — every colour of the authored rows in exactly its count: the leather-brown greatcoat the largest mass, the bone shirt, one gold pin the Order supposedly ran out of — in a bone photo frame, pixelated, captioned M. VOSS · HAVEN',
  R.mara.shown && R.mara.rows === 26 && R.mara.same && R.mara.pin === 1 && R.mara.coat > R.mara.shirt && R.mara.shirt > 5 && /3px solid rgb\(216, 210, 189\)/.test(R.mara.frame) && R.mara.pixelated === 'pixelated' && R.mara.caption === 'M. VOSS · HAVEN', JSON.stringify({ ...R.mara, want: undefined }));
ok('THE DIE: the one place rolling happens — a 12-texel d20 on the enlistment\'s two roll buttons and nowhere else (v3.49: Randomize, and reroll), tumbling three faces when a stranger is rolled and coming to rest on the first',
  R.die.n === 2 && R.die.hosts.join() === 'cgRoll,cgReName' && R.die.labels[0] === 'Randomize' && R.die.labels[1] === 'reroll' && R.die.faces === 3 && R.die.restFace && R.die.die.join() === '12,12' && R.die.rendering === 'pixelated', JSON.stringify(R.die));
ok('THE PLATE: every button is a plate — four side-slabs of shadow with the corner texels left empty (the notch that reads pixel), the face raised on an extruded base; held down by a real mouse the face goes straight down three pixels onto its base, and released off the plate nothing fires',
  (R.plate.rest.shadow.match(/-2px 0px 0px 0px|2px 0px 0px 0px|0px -2px 0px 0px|0px 2px 0px 0px/g) || []).length >= 4 && /0px 5px 0px/.test(R.plate.rest.shadow) && R.plate.rest.radius === '0px' && R.plate.rest.transform === 'none' && /matrix\(1, 0, 0, 1, 0, 3\)/.test(R.plate.pressed.transform) && /0px 2px 0px/.test(R.plate.pressed.shadow) && !R.plate.rulesOpened,
  JSON.stringify(R.plate));
ok('THE GROOVE: every meter is a groove pressed into the paper — the same side-slabs, a sunken bevel inside, segmented ticks over a banded fill, no rounded end',
  (R.groove.shadow.match(/inset/g) || []).length >= 2 && (R.groove.shadow.match(/2px 0px 0px/g) || []).length >= 2 && R.groove.radius === '0px' && /repeating-linear-gradient/.test(R.groove.ticks), JSON.stringify(R.groove));
ok('THE NAMEPLATE: every sheet announces itself from a riveted nameplate — every sheet\'s title in the page sits on a raised plate (the side-slabs, its base, its bevel), the open terminal\'s among them',
  R.nameplate.n >= 8 && R.nameplate.plated && R.nameplate.display === 'inline-block' && R.nameplate.bg === 'rgb(22, 29, 39)', JSON.stringify(R.nameplate));
ok('THE CHIPS: where cargo is physically handled every row leads with a square-cut 12-texel chip (v3.14: the crate chips became each item\'s own 12-texel icon) — cached as data-URIs, drawn pixelated at twice their size, no rounded corner, a different chip for different goods',
  R.chips.n >= 2 && R.chips.png && R.chips.nat && R.chips.nat[0] === 12 && R.chips.shown && R.chips.shown[0] === R.chips.nat[0] * 2 && R.chips.shown[1] === R.chips.nat[1] * 2 && R.chips.radius === '0px' && R.chips.rendering === 'pixelated' && R.chips.distinct >= 2, JSON.stringify(R.chips));
ok('THE WORLD UNDER THE MAP: the world no longer freezes under the open map — held D walks the Walker on with the sheet up',
  R.sheet.open && R.sheet.walked > 20, JSON.stringify({ open: R.sheet.open, walked: R.sheet.walked }));
ok('THE TOGGLE: [ ] Pause Movement on Map, clicked, freezes the world under the sheet for planners — the same held D walks nowhere — and cleared, the same keys walk again',
  R.sheet.focus !== 'INPUT' && R.sheet.frozen && R.sheet.frozenPx === 0 && R.sheet.again > 15, JSON.stringify({ focus: R.sheet.focus, frozen: R.sheet.frozen, frozenPx: R.sheet.frozenPx, again: R.sheet.again }));
ok('THE BROWSER KEEPS IT: the toggle is a browser-persistent preference (default off) — stored on the click, cleared on the next, and a reload of the page comes back with the box as it was left',
  R.sheet.stored === true && R.sheet.storedOff === false && R.sheet.reloaded.checked === true && R.sheet.reloaded.stored === true && R.sheet.reloaded.title, JSON.stringify({ stored: R.sheet.stored, storedOff: R.sheet.storedOff, reloaded: R.sheet.reloaded }));
ok('THE GRAB TEARS THE SHEET AWAY: a wraith\'s grab on the Walker while the map is open tears the sheet away, so you see what has you',
  R.grab.before && R.grab.gripped && !R.grab.after && R.grab.sheetHidden, JSON.stringify(R.grab));
ok('THE KEYCAP, SHOWN: whenever E would do something (a repair wanted beside the Walker) a pixel keycap stands beside them with a bone E on its face and the arrow stepping down at it',
  R.keycap.shown.state.shown && !R.keycap.shown.state.held && R.keycap.shown.prompt.length > 0 && R.keycap.shown.bone >= 8 && R.keycap.shown.gold === 0 && R.keycap.shown.face > 20, JSON.stringify(R.keycap.shown));
ok('THE KEYCAP, PRESSED: when the real E goes down the drawn key goes down with it — face onto its base, the E and the arrow gone gold',
  R.keycap.pressed.state.shown && R.keycap.pressed.state.held && R.keycap.pressed.gold >= 8 && R.keycap.pressed.bone === 0 && R.keycap.pressed.faceDown > 20, JSON.stringify(R.keycap.pressed));
ok('THE KEYCAP, RELEASED: and when E comes up the key comes back up, bone again',
  R.keycap.released.state.shown && !R.keycap.released.state.held && R.keycap.released.bone >= 8 && R.keycap.released.gold === 0, JSON.stringify(R.keycap.released));
ok('HEARTS AT 100: health is five hearts of twenty, drawn texel by texel in brick rust — at full health all five full (25 blood texels a heart) and none empty',
  R.hearts.at100.blood === 125 && R.hearts.at100.empty === 0 && R.hearts.size.join() === '63,13', JSON.stringify({ at100: R.hearts.at100, size: R.hearts.size, shown: R.hearts.shown }));
ok('HEARTS AT 50: half-heart steps — a blow of fifty flashes the row bone, then two full hearts, a half, and two empty remain',
  R.hearts.flash50.bone > R.hearts.flash50.blood && R.hearts.at50.blood === 25 * 2 + 14 && R.hearts.at50.empty > 0 && R.hearts.at50.bone <= 3, JSON.stringify({ flash: R.hearts.flash50, at50: R.hearts.at50 }));
ok('HEARTS AT 10: through the second blow\'s flash, one half heart of blood is left in a row of empties',
  R.hearts.flash10.bone > R.hearts.flash10.blood && R.hearts.at10.blood === 14 && R.hearts.at10.empty > R.hearts.at50.empty, JSON.stringify({ flash: R.hearts.flash10, at10: R.hearts.at10 }));
ok('THE CRT VOICE: the first greyfall speaks through the CRT face — near-fullscreen white type burning through a dark band laid across the screen',
  R.crt.first.text && R.crt.first.text.big === 'GREYFALL' && R.crt.first.white > 500 && R.crt.first.band > 2000 && R.crt.first.weather === 'grey', JSON.stringify(R.crt.first));
ok('THE CRT GOES SILENT: its hold spent, the tube goes dark — no line queued, not a white pixel left on its canvas',
  !R.crt.after.active && !R.crt.after.text && R.crt.after.white === 0 && R.crt.after.band === 0, JSON.stringify(R.crt.after));
ok('THE FIRST GREYFALL, ONCE: the greyfall\'s CRT is a door that opens once — the next greyfall rains without a word on the tube',
  R.crt.first.saw && R.crt.second.weather === 'grey' && !R.crt.second.active && R.crt.second.white === 0, JSON.stringify(R.crt.second));
ok('THE FOLDER: the terminal\'s file cabinet marks the open drawer — the active tab carries the folder and pops it once, no other tab carries one, and a real click on another tab moves the folder there (v3.15: one folder, on the open drawer only)',
  R.folder.a.filter(t => t.folder).length === 1 && R.folder.a.find(t => t.folder).active && R.folder.a.find(t => t.active).anim === 'folderPop' && R.folder.b.filter(t => t.folder).length === 1 && R.folder.b.find(t => t.folder).name === 'Fabricate', JSON.stringify(R.folder));
ok('THE MAP\'S ANATOMY: the sheet has a nameplate title bar (v3.49: the Survey Sheet is the Map — Valley · Region · World, under The Greymarch · the valley), a docked left rail (the legend, the live route readout, the options with Pause Movement on Map), and a footer strip of keycap hints; a shift-click strings a mark on the open sheet and the rail\'s readout goes from standing still to the walk\'s next mark',
  R.anatomy.title === 'Map' && /The Greymarch/.test(R.anatomy.sub) && R.anatomy.views.join() === 'VALLEY,REGION,WORLD' && R.anatomy.railHeads.includes('Legend') && R.anatomy.railHeads.includes('Route') && R.anatomy.railHeads.includes('Options') && R.anatomy.legend >= 6 && R.anatomy.pause && R.anatomy.keys.length >= 4 && R.anatomy.docked && R.anatomy.before === 'standing still' && /^walking — .+ to the next mark/.test(R.anatomy.readout) && R.anatomy.stillOpen,
  JSON.stringify(R.anatomy));

console.log(`pixelpass: ${((Date.now() - t0) / 1000).toFixed(1)} s after boot`);
await T.finish('the pixel pass');
