/* builds.mjs — v3.12 THE BUILDS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was lost; its
   figures sampled on the courier's grid). The player's trophies get station-grade art and the doctrine closes: the no-curve
   law asserted at the source level (no arc, no quadratic or bezier curve, no ellipse, no linear gradient in the renderer —
   exactly one radial, the vignette, which is the camera and not the world); the four build sprites (generator, shelter,
   watchtower, zip pylon) baked at the dimensions their rows are authored at and standing in the world on the texel grid; a
   seven-structure camp with its pylons' wire strung, raised through the build path and rendered live without error; and the
   Order's last paperwork filed — the certificate (v3.49: the Death certificate), the service record, the manual (FM-1), the
   enlistment (v3.49: New character) — and the steady-timer draining around a square, still reading progress. */
import { boot } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;
const t0 = Date.now();

/* the renderer's own source, cut from the page by the build's markers */
await ev(() => {
  const all = [...document.querySelectorAll('script')].map(s => s.textContent).join('\n');
  const a = all.indexOf('/* ================ 17_render.js ================ */'), b = all.indexOf('/* ================ 18_main.js ================ */');
  window.__RSRC = a >= 0 && b > a ? all.slice(a, b) : '';
});

/* ================= 1 · THE NO-CURVE LAW: CURVES ================= */
let r = await ev(() => {
  const s = __RSRC, n = re => (s.match(re) || []).length;
  return { bytes: s.length, arc: n(/\.arc\(/g), arcTo: n(/\.arcTo\(/g), quad: n(/quadraticCurveTo/g), bezier: n(/bezierCurveTo/g), ellipse: n(/\.ellipse\(/g), roundRect: n(/\.roundRect\(/g) };
});
ok('THE NO-CURVE LAW, CURVES: asserted at the source level — the renderer (cut from the page by its build marker) calls no arc, no arcTo, no quadratic or bezier curve, no ellipse, no rounded rect: every circle in the world is a ring of dots, every reticle four brackets',
  r.bytes > 100000 && r.arc === 0 && r.arcTo === 0 && r.quad === 0 && r.bezier === 0 && r.ellipse === 0 && r.roundRect === 0, JSON.stringify(r));

/* ================= 2 · THE NO-CURVE LAW: GRADIENTS ================= */
r = await ev(() => {
  const s = __RSRC, n = re => (s.match(re) || []).length, k = s.indexOf('createRadialGradient');
  const around = k >= 0 ? s.slice(Math.max(0, k - 400), k + 300) : '';
  return { linear: n(/createLinearGradient/g), radial: n(/createRadialGradient/g), conic: n(/createConicGradient/g), vignette: /vign/.test(around) && /function resize/.test(s.slice(Math.max(0, k - 900), k)) };
});
ok('THE NO-CURVE LAW, GRADIENTS: the renderer builds no linear or conic gradient, and exactly one radial — the screen vignette, baked once in resize(): the camera, not the world',
  r.linear === 0 && r.conic === 0 && r.radial === 1 && r.vignette, JSON.stringify(r));

/* ================= 3–6 · THE FOUR SPRITES ================= */
const sprite = type => ev(async type => {
  /* the rows as authored in the source */
  const s = __RSRC, a = s.indexOf('const STRUCT_ROWS'), body = s.slice(a, s.indexOf('};', a));
  const m = new RegExp(type + ':\\s*\\[([\\s\\S]*?)\\]').exec(body), rows = m ? [...m[1].matchAll(/'([^']*)'/g)].map(x => x[1]) : [];
  const authored = { w: rows.length ? rows[0].length : 0, h: rows.length, even: rows.every(q => q.length === (rows[0] || '').length) };
  const baked = Render.structDebug(type);
  /* standing in the world: raised through the build path on lit meadow east of Haven, the same frame without it */
  const H = DATA.stations.haven, x = H.x + 470, y = H.y + 300;
  S.structures = S.structures.filter(q => q.by !== 'you');
  await __stage(470, 380);
  Render.cam.x = x; Render.cam.y = y - 10; await __wait(80); await __frames(3);
  const without = __grab(x, y - 12, 70);
  WL.tool('kitTool', 1); WL.give({ metal: 200, ceramic: 200, lumen: 60 });
  const px0 = S.px, py0 = S.py; S.px = x; S.py = y;
  const built = Systems.tryBuild(type);
  S.px = px0; S.py = py0;
  await __wait(80); await __frames(3);
  const withIt = __grab(x, y - 12, 70), magenta = __count(withIt, [255, 0, 255], 8), drawn = __diff(withIt, without);
  const st = S.structures.find(q => q.type === type && q.by === 'you');
  __done();
  return { authored, baked, built, placed: !!st, drawn, magenta };
}, type);
const DIMS = {};
for (const [type, name] of [['generator', 'THE GENERATOR'], ['shelter', 'THE SHELTER'], ['watchtower', 'THE WATCHTOWER'], ['zipline', 'THE ZIP PYLON']]) {
  const s = await sprite(type);
  DIMS[type] = s.baked;
  const say = { generator: 'stone base, the dynamo drum with its lumen window, the lamp', shelter: 'the timber A-frame, its ridge, the dark doorway', watchtower: 'lattice legs, X-braces, the railed platform', zipline: 'the post, the cross-arm, the wheel' }[type];
  ok(`${name}: the sprite (${say}) bakes at exactly the dimensions its rows are authored at in the renderer's source (${s.authored.w}×${s.authored.h} texels), and raised through the build path it stands in the world — drawn on the composited canvas where the same frame without it has meadow, every texel in its palette (no magenta for a letter the palette lacks)`,
    s.authored.even && s.authored.w > 8 && s.authored.h > 8 && s.baked.w === s.authored.w && s.baked.h === s.authored.h && s.built && s.placed && s.drawn > 300 && s.magenta === 0, JSON.stringify(s));
}

/* ================= 7 · THE CAMP ================= */
r = await ev(async () => {
  const H = DATA.stations.haven, cx0 = H.x + 400, cy0 = H.y + 250;
  S.structures = S.structures.filter(q => q.by !== 'you'); Systems.rebuildZipLinks();
  await __stage(400, 250);
  Render.setZoom(1.5); Render.cam.x = cx0; Render.cam.y = cy0; await __wait(120); await __frames(3);
  const at = [['generator', -180, -40], ['shelter', 0, -60], ['watchtower', 180, -40], ['zipline', -230, 80], ['zipline', 230, 80]];
  const foot0 = (x, y) => { for (let rr = 0; rr <= 90; rr += 10) for (let a = 0; a < 6.283; a += 0.5) { const qx = x + Math.cos(a) * rr, qy = y + Math.sin(a) * rr, t = World.terrainAt(qx, qy); if (t.cls === World.MEADOW && !t.blocked && !t.water && World.lightAt(qx, qy) >= 0.4) return { x: qx, y: qy }; if (rr === 0) break; } return { x, y }; };
  for (const a of at) { const f = foot0(cx0 + a[1], cy0 + a[2]); a[1] = f.x - cx0; a[2] = f.y - cy0; }
  const shots0 = at.map(([, dx, dy]) => __grab(cx0 + dx, cy0 + dy - 12, 26));
  WL.tool('kitTool', 6); WL.tool('ladderTool', 1); WL.give({ metal: 400, ceramic: 200, lumen: 80 });
  const px0 = S.px, py0 = S.py, res = [];
  /* each build on open meadow inside the light, as a walker would stand to raise it: the nearest good footing to its mark */
  for (const [type, dx, dy] of at) { S.px = cx0 + dx; S.py = cy0 + dy; res.push([type, Systems.tryBuild(type)]); }
  /* the crossings, laid at a pose the way a blueprint lays them */
  res.push(['ladder', Systems.tryBuild('ladder', { x: cx0 - 60, y: cy0 + 150, ang: 0 })]);
  S.px = cx0; S.py = cy0 + 120;
  res.push(['bridge', Systems.tryBuild('bridge', { x: cx0 + 80, y: cy0 + 190, ang: 0.3 })]);
  S.px = px0; S.py = py0;
  const mine = S.structures.filter(q => q.by === 'you'), pyl = mine.filter(q => q.type === 'zipline'), refused = [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).filter(t => /Kits only|Bad footing|right there|Needs/.test(t));
  const strung = pyl.length === 2 && S.zipLinks.some(([a, b]) => (a === pyl[0].id && b === pyl[1].id) || (a === pyl[1].id && b === pyl[0].id));
  /* live: a second of frames at the real clock, then the camp against the same frame without it */
  WL.timeScale = 1; const f0 = performance.now(); await __frames(30); const ms = (performance.now() - f0) / 30; WL.timeScale = 0.001;
  await __wait(80); await __frames(3);
  const shots1 = at.map(([, dx, dy]) => __grab(cx0 + dx, cy0 + dy - 12, 26));
  if (pyl.length < 2) { __done(); return { built: res, n: mine.length, types: mine.map(q => q.type), strung, toasts: [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).slice(-4), drawn: [], cross: [] }; }
  const mid = { x: (pyl[0].x + pyl[1].x) / 2, y: (pyl[0].y + pyl[1].y) / 2 - 6 }, wire1 = __grab(mid.x, mid.y, 8);
  const cross1 = [__grab(cx0 - 60, cy0 + 150, 20), __grab(cx0 + 80, cy0 + 190, 20)];
  const keep = S.structures.slice(), links = S.zipLinks.slice(); S.structures = S.structures.filter(q => q.by !== 'you'); S.zipLinks = [];
  await __wait(60); await __frames(3);
  const wire0 = __grab(mid.x, mid.y, 8), cross0 = [__grab(cx0 - 60, cy0 + 150, 20), __grab(cx0 + 80, cy0 + 190, 20)];
  S.structures = keep; S.zipLinks = links;
  const drawn = at.map((a, k) => __diff(shots1[k], shots0[k])), wire = __diff(wire1, wire0), cross = cross1.map((d, k) => __diff(d, cross0[k]));
  __done();
  return { built: res, n: mine.length, types: [...new Set(mine.map(q => q.type))].sort(), strung, drawn, wire, cross, msPerFrame: +ms.toFixed(1), refused };
});
ok('THE CAMP: seven structures raised through the build path around one fire — generator, shelter, watchtower, two zip pylons with the wire strung between them, a ladder and a bridge — render live at the real clock without an error: every build drawn where it stands, the crossings laid, and the wire sagging in straight runs between the pylons, each against the same frame without the camp',
  r.built.every(([, b]) => b === true) && r.n === 7 && r.strung && r.drawn.length === 5 && r.drawn.every(d => d > 60) && r.wire > 0 && r.cross.every(d => d > 30) && T.errors.length === 0, JSON.stringify(r));

/* ================= the papers: the service record and the manual, opened by their keys ================= */
await ev(() => { for (const t of [...document.querySelectorAll('#toasts .toast')]) t.remove(); });
await page.keyboard.press('KeyK');
await page.waitForTimeout(400);
const service = await ev(() => {
  const ov = document.getElementById('skillsOv'), stamp = ov.querySelector('.docStamp'), ph = ov.querySelector('.filePhoto'), img = document.getElementById('skillsPortrait');
  const cs = ph ? getComputedStyle(ph) : null;
  return { open: !ov.classList.contains('hidden'), stamp: stamp && stamp.textContent.trim(), photo: !!(img && img.getAttribute('src')), frame: cs && { radius: cs.borderTopLeftRadius, w: ph.getBoundingClientRect().width, h: ph.getBoundingClientRect().height }, paper: /svg/.test(getComputedStyle(ov.querySelector('.sheet')).backgroundImage), name: document.getElementById('skillsName').textContent };
});
await page.keyboard.press('KeyK');
await page.waitForTimeout(250);
await page.keyboard.press('F1');
await page.waitForTimeout(400);
const manual = await ev(() => {
  const ov = document.getElementById('helpOv'), stamp = ov.querySelector('.docStamp');
  return { open: !ov.classList.contains('hidden'), title: ov.querySelector('h2').textContent.trim(), stamp: stamp && stamp.textContent.trim(), tabs: [...ov.querySelectorAll('#fmTabs .tab')].map(t => t.textContent.trim()) };
});
await page.keyboard.press('Escape');
await page.waitForTimeout(250);

/* ================= the steady-timer, on a real wobble ring ================= */
const steady = await ev(async () => {
  WL.timeScale = 1; S.qte = { t: 0, dur: 2.4 }; UI.showQTE(true);
  const arc = document.getElementById('qteArc'), q = document.getElementById('qte');
  await __wait(300); await __frames(2);
  const a = +getComputedStyle(arc).strokeDashoffset.replace('px', ''), ta = S.qte ? S.qte.t : null;
  await __wait(700); await __frames(2);
  const b = +getComputedStyle(arc).strokeDashoffset.replace('px', ''), tb = S.qte ? S.qte.t : null;
  const shape = { tag: arc.tagName.toLowerCase(), w: arc.getAttribute('width'), h: arc.getAttribute('height'), rx: arc.getAttribute('rx'), len: arc.getAttribute('pathLength'), ring: getComputedStyle(q.querySelector('.ring')).borderTopLeftRadius };
  const shown = !q.classList.contains('hidden');
  Systems.steadyOk();
  const gone = q.classList.contains('hidden');
  return { a, b, ta, tb, expectA: ta !== null ? +(207 * ta / 2.4).toFixed(1) : null, expectB: tb !== null ? +(207 * tb / 2.4).toFixed(1) : null, shape, shown, gone };
});

/* ================= the certificate, on a real death — and the enlistment it hands on to ================= */
const cert = await ev(async () => {
  S.pStats.deliveries = 3; Porter.die('cold');
  await __wait(400);
  const ov = document.getElementById('deathOv'), ph = ov.querySelector('.filePhoto img');
  return {
    open: !ov.classList.contains('hidden'), title: ov.querySelector('h2').textContent.trim(), stamp: (ov.querySelector('.docStamp') || {}).textContent,
    taken: [...ov.querySelectorAll('.certRow')].map(rw => rw.textContent.trim()), cause: document.getElementById('deathCause').textContent,
    photo: !!(ph && ph.getAttribute('src')), grey: ph ? getComputedStyle(ph).filter : null, frameBorder: getComputedStyle(ov.querySelector('.filePhoto')).borderTopColor,
    record: document.getElementById('deathStats').textContent.replace(/\s+/g, ' ').trim().slice(0, 160), foot: (ov.querySelector('.docFoot') || {}).textContent, dead: S.dead, info: !!S.deadInfo,
  };
});
await page.click('#deathContinue');
await page.waitForTimeout(700);
const enlist = await ev(() => {
  const ov = document.getElementById('chargen'), stamp = ov.querySelector('.docStamp'), por = document.getElementById('cgPortrait'), cs = getComputedStyle(por), b = por.getBoundingClientRect();
  const staple = getComputedStyle(por.parentElement, '::before').content + ' ' + getComputedStyle(por, '::after').content;
  return { open: !ov.classList.contains('hidden'), title: ov.querySelector('h2').textContent.trim(), stamp: stamp && stamp.textContent.trim(), square: Math.round(b.width) === Math.round(b.height), radius: cs.borderTopLeftRadius, rendering: cs.imageRendering, buttons: [...ov.querySelectorAll('button')].map(x => x.textContent.trim()).filter(x => /Randomize|Start|Begin/.test(x)), staple };
});

/* ================= 8 · THE CERTIFICATE ================= */
ok('THE CERTIFICATE: a death is filed as the Order\'s paper (v3.49: the Death certificate — it had read CERTIFICATE OF PASSAGE) — the dispatch stamp, a greyscale file photo in its frame, the TAKEN BY field with the cause, the record in ledger lines, filed under THE ROLL OF THE ORDER — and the death is committed to the save with its facts',
  cert.open && cert.title === 'Death certificate' && /OFFICE OF THE DISPATCH · THE ORDER OF WAYLIGHTERS/.test(cert.stamp || '') && cert.taken.some(t => /^Taken by/i.test(t)) && cert.cause.length > 3 && cert.photo && /grayscale/.test(cert.grey || '') && cert.record.length > 20 && /THE ROLL OF THE ORDER/.test(cert.foot || '') && cert.dead && cert.info,
  JSON.stringify(cert));

/* ================= 9 · THE SERVICE RECORD ================= */
ok('THE SERVICE RECORD: K opens the skills as a stamped SERVICE RECORD with the walker\'s file photo in a square frame, on the Order\'s dither paper',
  service.open && /^SERVICE RECORD/.test(service.stamp || '') && service.photo && service.frame && service.frame.radius === '0px' && Math.abs(service.frame.w - service.frame.h) < 2 && service.paper, JSON.stringify(service));

/* ================= 10 · THE MANUAL ================= */
ok('THE MANUAL: F1 opens the help as FM-1 · PROPERTY OF THE ORDER (v3.49: the Field Manual is the Manual — Controls · Lessons · Windows · Saves)',
  manual.open && manual.title === 'Manual' && /^FM-1 · PROPERTY OF THE ORDER/.test(manual.stamp || '') && manual.tabs.join('·') === 'Controls·Lessons·Windows·Saves', JSON.stringify(manual));

/* ================= 11 · THE ENLISTMENT ================= */
ok('THE ENLISTMENT: the certificate hands on to the enlistment form (v3.49: New character — Randomize, Start), stamped ENLISTMENT · THE ORDER TAKES WHOEVER COMES, its portrait stapled square — no rounded corner, drawn pixelated',
  enlist.open && enlist.title === 'New character' && /^ENLISTMENT/.test(enlist.stamp || '') && enlist.square && enlist.radius === '0px' && enlist.rendering === 'pixelated', JSON.stringify(enlist));

/* ================= 12 · THE SQUARE STEADY-TIMER ================= */
ok('THE SQUARE STEADY-TIMER: the steady ring drains around a square (an SVG rect, no corner radius, its path 207 long) and still reads progress — the stroke\'s offset tracks the ring\'s own clock as it runs, and a steady closes it',
  steady.shown && steady.shape.tag === 'rect' && steady.shape.w === steady.shape.h && !steady.shape.rx && steady.shape.len === '207' && steady.shape.ring === '0px' && steady.b > steady.a && Math.abs(steady.a - steady.expectA) < 12 && Math.abs(steady.b - steady.expectB) < 12 && steady.gone,
  JSON.stringify(steady));

console.log(`builds: ${((Date.now() - t0) / 1000).toFixed(1)} s after boot`);
await T.finish('the builds');
