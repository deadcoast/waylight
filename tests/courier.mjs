/* courier.mjs — v3.50 THE COURIER SET (v3.51: the sit and the kneel, and the cast beside it): the Walker and every figure on the shared rig, redrawn by hand at 32×32. The registry
   (three facings, the breath, four steps on the uneven cadence, the brace, the ride, the wire; the outline law; the palette
   derived from the worn letters); on screen, texel for texel (every sampled texel centre is its palette colour, whole texels
   on the sprite grid); the four sides; the step, the breath, the brace; the tower on the bedroll; everything lashed on (the
   frame's rails, the tools, the road's gift, the white rag, the kin's lantern, the keepsakes, the bolt, the scar, the snow,
   the lantern at night) each against the same frame without it; the hands in their own colours with the ribbon; the ride
   on the stable at the courier's scale; the wire; the papers (the tailor, the doll, the roll, the manual's plates). */
import { chromium } from 'playwright';
import { distUrl, browserOptions } from './lib/runtime.mjs';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch(browserOptions);
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
page.on('console', m => { if (m.type() === 'error' && /WAYLIGHT fault/.test(m.text())) errors.push(m.text()); });   // a frame's fault is caught by the loop and reported
await page.goto(process.env.WL_URL || distUrl('test.html?debug'), { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
/* the papers at enlistment: the courier being cut, toward the eye */
const cg = await page.evaluate(() => new Promise(res => { const im = document.getElementById('cgRig'), t = new Image(); t.onload = () => res({ w: im.clientWidth, h: im.clientHeight, nw: t.naturalWidth, nh: t.naturalHeight }); t.src = im.src; }));
await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
const ev = (fn, arg) => page.evaluate(fn, arg);
await ev(() => {
  S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  window.__toScr = (wx, wy) => { const z2 = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (wx - Render.cam.x) * z2, y: innerHeight / 2 + (wy - Render.cam.y) * z2 }; };
  window.__grab = (wx, wy, rad) => { const p = __toScr(wx, wy), cv = document.getElementById('game'), g = cv.getContext('2d'), dpr = devicePixelRatio; return g.getImageData(Math.max(0, Math.round((p.x - rad) * dpr)), Math.max(0, Math.round((p.y - rad) * dpr)), Math.round(rad * 2 * dpr), Math.round(rad * 2 * dpr)).data; };
  window.__px = (wx, wy) => { const p = __toScr(wx, wy), g = document.getElementById('game').getContext('2d'), dpr = devicePixelRatio; const d = g.getImageData(Math.round(p.x * dpr), Math.round(p.y * dpr), 1, 1).data; return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); };
  window.__diff = (a, b2) => { let n = 0; for (let i = 0; i < Math.min(a.length, b2.length); i += 4) if (Math.abs(a[i] - b2[i]) + Math.abs(a[i + 1] - b2[i + 1]) + Math.abs(a[i + 2] - b2[i + 2]) > 60) n++; return n; };
  window.__count = (d, col, tol) => { let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - col[0]) < tol && Math.abs(d[i + 1] - col[1]) < tol && Math.abs(d[i + 2] - col[2]) < tol) n++; return n; };
  window.__hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  window.__frames = n => new Promise(res => { let k = 0; const f = () => (++k >= n ? res() : requestAnimationFrame(f)); requestAnimationFrame(f); });
  window.__wait = ms => new Promise(res => setTimeout(res, ms));
  window.__clearAmb = (x, y, rad) => { for (const w of NPC.ambient()) if (w.x !== undefined && U.dist(w.x, w.y, x, y) < rad) { w.d = w.end || w.len; w.x = undefined; } };
  /* an open, lit meadow east of Haven: the Walker alone, the weather clear, the day high, the effects off */
  window.__stage = async (dx = 520, dy = 260) => {
    const H = DATA.stations.haven; WL.tp([H.x + dx, H.y + dy]); S.weather.state = 'clear'; S.speed = 0; S.braced = false;
    const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
    for (const n of NPC.party()) { n.cx = S.px + 600; n.cy = S.py + 600; }
    __clearAmb(S.px, S.py, 300); Render.clearFx(); Render.setFx(false); Render.setZoom(3); Render.cam.x = S.px; Render.cam.y = S.py - 30; WL.timeScale = 0.001;
    await __wait(300); await __frames(3);
  };
  window.__done = () => { WL.timeScale = 1; Render.setZoom(null); Render.setFx(true); };
  for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
});

/* ================= 1 · THE REGISTRY ================= */
let r = await ev(() => {
  const CO = SPRITES.COURIER, LET = new Set('OHhISseCDLcTtAauYBbPp'), d = Render.courierPal(Render.wornPal());
  const want = { E: ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4', 'brace', 'ride', 'sit', 'kneel'], S: ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4', 'brace', 'zip', 'sit', 'kneel'], N: ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4', 'brace'] };
  const sets = Object.keys(want).every(fc => want[fc].every(f => CO.frames[fc][f])) && Object.keys(CO.frames).length === 3;
  const all = Object.entries(CO.frames).flatMap(([fc, fr]) => Object.entries(fr).map(([n, rows]) => ({ fc, n, rows })));
  const grid = all.every(f => f.rows.length === 32 && f.rows.every(s => s.length === 32));
  const letters = all.every(f => [...f.rows.join('')].every(ch => ch === '.' || (LET.has(ch) && d[ch])));
  const distinct = Object.values(CO.frames).every(fr => new Set(Object.values(fr).map(x => x.join(''))).size === Object.keys(fr).length);
  let outline = 0;   // the outline law: a coloured texel that meets the open air is an outline texel — a boot's sole is its own dark edge
  for (const f of all) for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const ch = f.rows[y][x]; if (ch === '.' || ch === 'O') continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx > 31 || yy > 31) continue; if (f.rows[yy][xx] === '.' && !(ch === 'b' && dy === 1)) { outline++; break; } } }
  const top = rows => rows.findIndex(s => /[^.]/.test(s)), low = rows => 31 - [...rows].reverse().findIndex(s => /[^.]/.test(s));
  const height = ['S', 'E', 'N'].map(fc => low(CO.frames[fc].idle) - top(CO.frames[fc].idle) + 1);
  const soles = all.every(f => [30, 31].includes(low(f.rows))) && ['S', 'E', 'N'].every(fc => low(CO.frames[fc].idle) === 30);
  /* a hand in every frame on a hand texel — but for the kneel toward the eye, the hands bound behind the back, out of sight
     (v3.51); the upper body's rise: the step's lift, the brace's crouch, the kneel's and the sit's drop */
  const anchors = ['S', 'E', 'N'].every(fc => { const A = CO.at[fc]; return A && A.tower && A.rails && A.railFoot && Object.keys(CO.frames[fc]).every(f => { const h = CO.hand[fc][f]; return h && h[0] >= 0 && h[0] < 32 && h[1] >= 0 && h[1] < 32 && [-1, 0, 2, 3, 6].includes(CO.dy[fc][f]) && (CO.frames[fc][f][h[1]][h[0]] === 'S' || (fc === 'S' && f === 'kneel')); }); });
  const low2 = { sit: CO.dy.E.sit === 6 && CO.dy.S.sit === 6, kneel: CO.dy.E.kneel === 3 && CO.dy.S.kneel === 3 };
  const onGrid = cells => cells.every(([c, r2]) => c >= 0 && c < 32 && r2 >= 0 && r2 < 32);
  const sash = ['S', 'E', 'N'].every(fc => Object.keys(CO.frames[fc]).every(f => onGrid(CO.sash[fc][f]) && CO.sash[fc][f].every(([, , ch]) => SPRITES.HELPER_PAL[ch]) && CO.pin[fc][f].every(([c, r2]) => CO.sash[fc][f].some(([c2, r3]) => c2 === c && r3 === r2))));
  const glyphs = Object.values(CO.glyphs).every(rows => rows.every(s => s.length === rows[0].length) && [...rows.join('')].every(ch => ch === '.' || CO.glyphPal[ch]));
  /* the old 12×18 rig and its cells are gone from the registry: one rig, the courier's */
  const retired = !('HELPER_CELLS' in SPRITES) && !('PIN_CELLS' in SPRITES) && !('RAG_CELLS' in SPRITES) && !('GIFT_CELLS' in SPRITES);
  /* the stable at the courier's scale: every breed a third again, its seat and ground carried */
  const HS = Object.values(SPRITES.HORSES), stable = HS.length === 6 && HS.every(h => h.w >= 36 && h.h >= 28 && [h.frames.idle, ...h.frames.walk].every(f => f.length === h.h && f.every(s => s.length === h.w)) && h.seat.x < h.w && h.seat.y < h.ground.y && h.frames.idle[h.ground.y].trim().replace(/\./g, '').length > 0);
  /* v3.51 THE CAST beside the courier: every figure drawn by hand on its own grid — three facings (the giant only faces you),
     the idle, the breath and four steps (the tender stands at her post), every frame its own, the outline law, every letter in
     its palette (a derived figure's shades from its ten worn letters, as the courier's); its soles on its grid's ground row; the
     camps' own and the stranger at the courier's height (22 texels, crown to sole, the knife's and the bowman's own), the
     Farkeepers' riders a courier's head taller (29), the kid a child's (16); the v3.50 resamples gone from the registry */
  const F = SPRITES.FIG, STEPS = ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4'];
  const figH = (f, fc) => { const q = f.frames[fc].idle; return (f.h - 1 - [...q].reverse().findIndex(s => /[^.]/.test(s))) - q.findIndex(s => /[^.]/.test(s)) + 1; };
  const figLow = (f, rows) => f.h - 1 - [...rows].reverse().findIndex(s => /[^.]/.test(s));
  const castSets = Object.keys(F).length === 20 && Object.entries(F).every(([n, f]) => n === 'giant' ? !!f.frames.S.idle : ['E', 'S', 'N'].every(fc => f.frames[fc] && (n === 'tender' ? ['idle', 'idle2'] : STEPS).every(k => f.frames[fc][k])));
  let castOutline = 0, castMiss = 0, castGrid = true, castDistinct = true, castSoles = true;
  for (const f of Object.values(F)) {
    const pal = f.derive ? { ...f.pal, ...Render.courierPal(f.pal) } : f.pal;
    for (const fr of Object.values(f.frames)) {
      if (new Set(Object.values(fr).map(x => x.join(''))).size !== Object.keys(fr).length) castDistinct = false;
      if (![f.sole, f.sole + 1].includes(figLow(f, fr.idle))) castSoles = false;
      for (const rows of Object.values(fr)) {
        if (rows.length !== f.h || rows.some(s => s.length !== f.w)) { castGrid = false; continue; }
        for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
          const ch = rows[y][x]; if (ch === '.') continue; if (!pal[ch]) castMiss++; if (ch === 'O') continue;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= f.w || yy >= f.h) continue; if (rows[yy][xx] === '.' && !(dy === 1 && (ch === 'b' || y >= f.sole))) { castOutline++; break; } }
        }
      }
    }
  }
  const people = castSets && castGrid && castDistinct && castSoles && castOutline === 0 && castMiss === 0
    && ['knife', 'bowman', 'chief', 'kin', 'stranger'].every(n => ['E', 'S', 'N'].every(fc => figH(F[n], fc) === 22))
    && ['pugugly', 'rifle_rider', 'recon_rider'].every(n => ['E', 'S', 'N'].every(fc => figH(F[n], fc) === 29)) && ['E', 'S', 'N'].every(fc => figH(F.kid, fc) === 16)
    && ['KIT', 'FIGURES', 'TENDER', 'TENDER_PAL'].every(k => !(k in SPRITES)) && low2.sit && low2.kneel;
  const cast = { castSets, castGrid, castDistinct, castSoles, castOutline, castMiss };
  return { sets, grid, letters, distinct, outline, height, soles, anchors, sash, glyphs, retired, stable, people, cast, frames: all.length };
});
ok('THE REGISTRY: the courier set — three facings (east, and west its mirror; toward the eye; away), each with the idle, the breath, four steps and the brace; east rides, the front hangs from the wire; east and the front sit on the ground and kneel (v3.51: the upper body drops six and three texels, the kneel toward the eye with the hands bound out of sight); 27 frames, every one 32×32, every letter one the worn palette derives, every frame its own; the outline law (a coloured texel meeting the open air is an outline texel, a sole its own dark edge); one height from every side (22 texels, crown to sole) and every idle on the same ground row; a hand in every frame on a hand texel; the ribbon and the pin on the grid; the glyphs lashed on in their palette; the old 12×18 rig\'s cells retired; the stable at the courier\'s scale (six breeds a third again, rectangular, the seat and the ground carried); THE CAST beside it (v3.51): twenty figures drawn by hand, each on its own grid in three facings with the idle, the breath and four steps (the giant only faces you, the tender stands), every frame its own, the outline law, every letter in its palette, soles on the ground row — the camps\' own and the stranger at the courier\'s height, the Farkeepers\' riders a courier\'s head taller, the kid a child\'s; the v3.50 resamples gone',
  r.sets && r.grid && r.letters && r.distinct && r.outline === 0 && r.height.every(h => h === 22) && r.soles && r.anchors && r.sash && r.glyphs && r.retired && r.stable && r.people && r.frames === 27, JSON.stringify(r));

/* ================= 2 · THE PALETTE ================= */
r = await ev(() => {
  const base = Render.wornPal(), d = Render.courierPal(base), lum = h => { const [a, b2, c] = __hex(h); return a * 0.3 + b2 * 0.59 + c * 0.11; };
  const shades = lum(d.D) < lum(d.C) && lum(d.L) > lum(d.C) && lum(d.h) < lum(d.H) && lum(d.I) > lum(d.H) && lum(d.s) < lum(d.S) && lum(d.a) < lum(d.A) && lum(d.u) < lum(d.a) && lum(d.P) > lum(d.B) && lum(d.Y) > lum(d.T);
  const dist = (x, y) => { const [a1, b1, c1] = __hex(x), [a2, b2, c2] = __hex(y); return Math.abs(a1 - a2) + Math.abs(b1 - b2) + Math.abs(c1 - c2); };
  const canvas = d.A !== d.T && dist(d.A, '#8c7c60') < dist(d.T, '#8c7c60');   // the pack's canvas: the trim, muted toward canvas
  const recolour = (k, v, letters) => { const d2 = Render.courierPal({ ...base, [k]: v }); return letters.every(l => d2[l] !== d[l]); };
  const coat = recolour('C', '#6e4a4a', ['C', 'D', 'L']), trim = recolour('T', '#6fe3d2', ['T', 'A', 'a', 'u', 'Y']), hood = recolour('H', '#5a3d3d', ['H', 'h', 'I']), skin = recolour('S', '#8a6248', ['S', 's']), boots = recolour('B', '#5a4a30', ['B', 'P', 'p']);
  return { shades, canvas, coat, trim, hood, skin, boots };
});
ok('THE PALETTE: the courier\'s shades are derived from the worn letters, never stored — the coat\'s shade and light, the hood\'s, the skin\'s, the pack\'s canvas (the trim, muted toward canvas) and its shade and straps, the buckles, the trousers over the boots; a coat, a trim, a hood, a skin, a pair of boots each recolour every texel that is theirs',
  Object.values(r).every(Boolean), JSON.stringify(r));

/* ================= 3 · ON SCREEN: THE FOUR SIDES, TEXEL FOR TEXEL ================= */
await ev(() => { S.cargo.length = 0; S.equip.pack = State.makeItem('pack0'); S.arrow = null; S.scar = null; S.snowPack = 0; });
const sides = await ev(async () => {
  const out = {};
  for (const fc of ['S', 'E', 'N', 'W']) {
    Render.faceWalker(fc); await __stage(); UI.updatePrompts(Systems.getInteractions()); await __wait(120); await __frames(2);   // the rail read where the Walker now stands: Haven's E cap, left over from the door, off the shoulder (its bobbing arrow had crossed a texel)
    const w = Render.walkerDrawn(), CO = SPRITES.COURIER, f = fc === 'W' ? 'E' : fc, rows = CO.frames[f][w.frame], d = Render.courierPal(Render.wornPal());
    let n = 0, hit = 0, quarter = 0;
    for (let y = 0; y < 32; y += 1) for (let x = 0; x < 32; x += 1) {
      const ch = rows[y][x]; if (ch === '.' || (x + y) % 3) continue;
      const p = Render.walkerAt(x, y); n++;
      if (__px(p.x, p.y) === d[ch]) hit++;
      const T2 = (Render.walkerAt(1, 0).x - Render.walkerAt(0, 0).x) * (fc === 'W' ? -1 : 1);   // a texel, in world units
      if (__px(p.x - T2 * 0.3, p.y - T2 * 0.3) === d[ch] && __px(p.x + T2 * 0.3, p.y + T2 * 0.3) === d[ch]) quarter++;
    }
    const face = Render.walkerAt(fc === 'N' ? 15 : (f === 'E' ? 18 : 15), 13), pack = f === 'E' ? Render.walkerAt(8, 20) : Render.walkerAt(13, 18);
    out[fc] = { frame: w.frame, n, hit, quarter, faceSkin: __count(__grab(face.x, face.y, 10), __hex(d.S), 6), packCanvas: __count(__grab(pack.x, pack.y, 14), __hex(d.A), 6), packRight: pack.x > S.px };
  }
  __done(); return out;
});
ok('ON SCREEN — THE FOUR SIDES: the Walker drawn on the courier\'s rows, texel for texel: at every third opaque texel of the frame shown, the pixel at the texel\'s centre and at its two quarter points is that texel\'s own palette colour (whole texels on the sprite grid, never smeared, never a half-texel off) — toward the eye the face, away the pack\'s canvas and no face, east the pack behind, west its mirror',
  ['S', 'E', 'N', 'W'].every(k => sides[k].n > 40 && sides[k].hit / sides[k].n > 0.97 && sides[k].quarter / sides[k].n > 0.9) && sides.S.faceSkin > 20 && sides.N.faceSkin === 0 && sides.N.packCanvas > 60 && sides.E.packCanvas > 40 && !sides.E.packRight && sides.W.packRight && sides.W.packCanvas > 40 && sides.E.faceSkin > 5,
  JSON.stringify(sides));

/* ================= 4 · THE STEP, THE BREATH, THE BRACE ================= */
const step = await ev(async () => {
  const H = DATA.stations.haven; WL.tp([H.x + 520, H.y + 260]); S.weather.state = 'clear'; Render.setZoom(null); WL.timeScale = 1;
  const seen = {}, fcs = {};
  const walk = async (dx, dy, key) => { Systems.moveTo(S.px + dx, S.py + dy); const t0 = performance.now(); const cnt = {}; while (performance.now() - t0 < 1400) { await __frames(1); const w = Render.walkerDrawn(); if (S.speed > 5 && w) { cnt[w.frame] = (cnt[w.frame] || 0) + 1; fcs[key] = w.fc; } } seen[key] = cnt; };
  await walk(520, 0, 'east'); await walk(0, 420, 'south'); await walk(0, -420, 'north'); await walk(-520, 0, 'west');
  Systems.moveTo(S.px, S.py); S.speed = 0; await __wait(300);
  const br = {}; const t0 = performance.now(); while (performance.now() - t0 < 5200) { await __frames(1); const w = Render.walkerDrawn(); br[w.frame] = (br[w.frame] || 0) + 1; }
  return { seen, fcs, br };
});
/* braced: the Walker holds the space bar */
await page.keyboard.down('Space'); await page.waitForTimeout(250); step.brace = await ev(() => Render.walkerDrawn().frame); await page.keyboard.up('Space');
const e4 = step.seen.east || {}, contacts = (e4.walk1 || 0) + (e4.walk3 || 0), passes = (e4.walk2 || 0) + (e4.walk4 || 0);
ok('THE STEP, THE BREATH, THE BRACE: walking, all four steps come round, the contacts held longer than the passings (the uneven cadence); the facing follows the walk — east, south toward the eye, north away, west the mirror; standing, the breath comes on its own beat (the hold longer than the breath); braced, the knees bend and a hand takes the strap',
  ['walk1', 'walk2', 'walk3', 'walk4'].every(k => e4[k] > 0) && contacts > passes && step.fcs.east === 'E' && step.fcs.south === 'S' && step.fcs.north === 'N' && step.fcs.west === 'W' && step.br.idle > (step.br.idle2 || 0) && step.br.idle2 > 0 && step.brace === 'brace',
  JSON.stringify(step));

/* ================= 5 · THE TOWER ON THE BEDROLL ================= */
const tower = await ev(async () => {
  S.cargo.length = 0; for (const id of ['meds', 'food', 'textiles']) S.cargo.push(State.makeItem(id)); S.cargo.push(State.makeItem('letters'));
  const out = {};
  for (const fc of ['S', 'E', 'N']) {
    Render.faceWalker(fc); await __stage(); await __wait(120); await __frames(2);
    const w = Render.walkerDrawn(), A = SPRITES.COURIER.at[fc];
    const HA = { S: [12, 12], E: [14, 12], N: [15, 11] }[fc];
    const mid = Render.walkerAt(A.tower[0], A.tower[1] - 2.5), hood = Render.walkerAt(HA[0], HA[1]), d = Render.courierPal(Render.wornPal());   // the medicine, the lowest tier
    out[fc] = { tiers: w.tiers, top: w.towerTop, cross: __count(__grab(mid.x, mid.y, 24), __hex('#f2ead4'), 8), hood: __count(__grab(hood.x, hood.y, 6), __hex(d.H), 6) };
  }
  S.cargo.length = 0; await __frames(3); Render.faceWalker('N'); await __wait(100); await __frames(2);
  const hoodBare = (() => { const hd = Render.walkerAt(15, 11), d = Render.courierPal(Render.wornPal()); return __count(__grab(hd.x, hd.y, 6), __hex(d.H), 6); })();
  __done(); return { ...out, hoodBare };
});
ok('THE TOWER: the loads stand on the bedroll on the courier\'s own texel grid — four loads (four tiers, the medicine lowest), the tower\'s top over the crown; toward the eye it stands behind the head, the medicine\'s cross seen over the hood; from the side on the pack\'s back; from behind, the tower on the pack hides the hood it stands in front of (the same frame bare shows it)',
  ['S', 'E', 'N'].every(k => tower[k].tiers === 4 && tower[k].top < 9 && tower[k].cross > 3) && tower.S.hood > 0 && tower.N.hood < tower.hoodBare,
  JSON.stringify(tower));

/* ================= 6 · WHAT IS LASHED ON ================= */
const lashed = await ev(async () => {
  const pr = n => State.makeItem(n);
  const shoot = async (fc, set, unset) => { Render.faceWalker(fc); set(); await __stage(); await __wait(80); await __frames(2); const c = Render.walkerAt(16, 14); const a = __grab(c.x, c.y, 150); unset(); await __frames(3); await __wait(60); await __frames(2); const b2 = __grab(c.x, c.y, 150); return __diff(a, b2); };
  const out = {};
  out.rails = await shoot('N', () => { S.cargo.push(pr('meds')); S.equip.pack = pr('pack_rig'); }, () => { S.equip.pack = pr('pack0'); }); S.cargo.length = 0;
  out.tools = await shoot('E', () => { WL.tool('ladderTool'); WL.tool('kitTool'); }, () => { S.cargo.length = 0; });
  out.gift = await shoot('N', () => { const g = pr('fireGift'); g.gift = true; S.cargo.push(g); }, () => { S.cargo.length = 0; });
  const road = Republic.onAnyRoad; out.rag = await shoot('E', () => { Republic.onAnyRoad = () => true; }, () => { Republic.onAnyRoad = road; });
  out.keepsakes = await shoot('E', () => { const k1 = pr('keepsake'); k1.keepsake = { thing: 'whistle' }; const k2 = pr('keepsake'); k2.keepsake = { thing: 'flower' }; S.cargo.push(k1, k2); }, () => { S.cargo.length = 0; });
  out.kin = await shoot('E', () => { const kl = pr('kinLantern'); kl.lit = true; S.cargo.push(kl); }, () => { S.cargo.length = 0; });
  out.bolt = await shoot('E', () => { S.arrow = { t0: S.time, from: 'ash', n: 1, pullT: 0, medT: 0 }; }, () => { S.arrow = null; });
  out.scar = await shoot('N', () => { S.scar = { t0: S.time, dressed: 0, dressT: 0, by: 'x' }; }, () => { S.scar = null; });
  out.dressed = await shoot('E', () => { S.scar = { t0: S.time, dressed: 1, dressT: 0, by: 'x' }; }, () => { S.scar = null; });
  /* the snow, stage by stage, on the hood first */
  const snow = []; for (const a of [0, 0.3, 0.6, 0.95]) { Render.faceWalker('S'); await __stage(); S.snowPack = a; await __frames(2); const c = Render.walkerAt(16, 10); snow.push(__count(__grab(c.x, c.y, 60), __hex('#e8f2f8'), 10)); S.snowPack = 0; }
  out.snow = snow;
  /* the lantern at night: the glass under the hand */
  Render.faceWalker('E'); await __stage(); const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.85; WL.tp([S.px + 1200, S.py + 700]); Render.cam.x = S.px; Render.cam.y = S.py - 30; await __wait(150); await __frames(3);
  const lit = World.lightAt(S.px, S.py) < 0.35, hd = Render.walkerDrawn().hand, g = Render.walkerAt(hd[0], hd[1] + 3); out.lantern = { lit, glass: __count(__grab(g.x, g.y, 10), __hex('#ffd98f'), 30) };
  /* the rim at night, from the side and toward the eye: on the side of the hand that holds the lamp, the outline keeps its
     dark edge and the warm light lies on the coloured texel inside it */
  out.rim = {};
  for (const f of ['E', 'S', 'W']) {
    Render.faceWalker(f); await __frames(3); await __wait(60); await __frames(2);
    const w = Render.walkerDrawn(), fc = w.fc === 'W' ? 'E' : w.fc, flip = w.fc === 'W', hx = flip ? 31 - w.hand[0] : w.hand[0], side = hx < 16 ? -1 : 1;
    const rows = SPRITES.COURIER.frames[fc][w.frame], at = (x, y) => (x < 0 || x > 31) ? '.' : rows[y][flip ? 31 - x : x];
    const cells = Render.rimCells(fc, w.frame, flip, side), key = new Set(cells.map(([x, y]) => x + ',' + y));
    const rgb = (x, y) => { const q = Render.walkerAt(flip ? 31 - x : x, y); return __hex(__px(q.x, q.y)); };
    const inside = cells.length > 10 && cells.every(([x, y]) => at(x, y) !== 'O' && at(x, y) !== '.');
    const lampSide = cells.reduce((s2, [x]) => s2 + (x - 15.5) * side, 0) > 0;   // the rim lies, on the whole, on the lamp's side
    let edgeDark = 0, edgeN = 0;
    for (const [x, y] of cells) if (at(x + side, y) === 'O') { edgeN++; const e = rgb(x + side, y); if (e[0] + e[1] + e[2] < 160) edgeDark++; }
    const wr = [], cr = [], avg = a => Math.round(a.reduce((s2, v) => s2 + v, 0) / Math.max(1, a.length));
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const k = at(x, y); if (k !== 'C' && k !== 'D' && k !== 'L') continue; const p = rgb(x, y); (key.has(x + ',' + y) ? wr : cr).push(p[0] - p[2]); }
    out.rim[f] = { side, cells: cells.length, inside, lampSide, edgeDark, edgeN, warm: avg(wr), cool: avg(cr), nWarm: wr.length };
  }
  __done(); return out;
});
ok('WHAT IS LASHED ON: each against the same frame without it — the equipped frame\'s rails up the pack\'s sides past the tower, the tools\' hafts over the pack, the road\'s gift on the pack\'s top, the white rag on its switch on a truce road, the keepsakes on their strings under the pack, the kin\'s lantern at the pack\'s back, the bolt in the back shoulder, the scar and the dressing on it; the snow on the hood, more at every stage; at night the lamp in the hand, its glass under the hand texel, and the rim on the side of the hand that holds it, east, toward the eye and west: that side keeps its dark outline, the warm light on the coloured texel inside it (the coat warm at its edge, its own colour within)',
  ['rails', 'tools', 'gift', 'rag', 'keepsakes', 'kin', 'bolt', 'scar', 'dressed'].every(k => lashed[k] > 4) && lashed.snow[0] === 0 && lashed.snow[1] > 0 && lashed.snow[2] > lashed.snow[1] && lashed.snow[3] > lashed.snow[2] && lashed.lantern.lit && lashed.lantern.glass > 0
  && Object.values(lashed.rim).every(q => q.inside && q.lampSide && q.edgeN > 8 && q.edgeDark === q.edgeN && q.nWarm > 2 && q.warm > q.cool + 25) && lashed.rim.E.side === 1 && lashed.rim.W.side === -1,
  JSON.stringify(lashed));

/* ================= 7 · THE HANDS ================= */
const hands = await ev(async () => {
  await __stage(); const out = {};
  const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.state = 'companion';
  const rg = U.rng(n.seed), hood = U.pick(rg, CHAR.PORTRAIT.hoods), scarf = U.pick(rg, CHAR.PORTRAIT.scarves);
  const d = Render.courierPal({ ...Render.wornPal(), H: '#41522f', C: hood, c: '#41522f', T: scarf, t: '#94804f' });
  for (const [k, dir] of [['S', Math.PI / 2], ['E', 0], ['N', -Math.PI / 2]]) {
    n.cx = S.px + 50; n.cy = S.py; n._px = n.cx; n._py = n.cy; n._dir = dir; await __frames(3); await __wait(60); await __frames(2);
    out[k] = { scarf: __count(__grab(n.cx, n.cy - 30, 30), __hex(d.T), 6), canvas: __count(__grab(n.cx, n.cy - 30, 30), __hex(d.A), 6), coat: __count(__grab(n.cx, n.cy - 25, 30), __hex(d.C), 6) };
  }
  n._dir = Math.PI / 2; await __frames(2); const a = __grab(n.cx, n.cy - 22, 30); n.lent = { town: 'mill', t: S.time, for: 'x' }; await __frames(3); await __wait(60); await __frames(2); const b2 = __grab(n.cx, n.cy - 22, 30);
  out.ribbon = __diff(a, b2); n.lent = null;
  S.npcs.splice(S.npcs.indexOf(n), 1); __done(); return out;
});
ok('THE HANDS: a hand walks on the courier\'s rows in their own hood, coat and scarf — the scarf toward the eye, the pack\'s canvas (their scarf, muted) from behind, the coat from every side; a lent hand wears the town\'s ribbon shoulder to hip (against the same frame without it)',
  hands.S.scarf > 4 && hands.N.canvas > 30 && hands.S.coat > 20 && hands.E.coat > 10 && hands.N.coat > 4 && hands.ribbon > 4, JSON.stringify(hands));

/* ================= 8 · THE RIDE AND THE WIRE ================= */
const ride = await ev(async () => {
  const hon = Systems.horseOn; S.horse = { breed: 'fjord', on: true }; Systems.horseOn = () => true; S.dir = 0; Render.faceWalker('E');
  await __stage(); await __wait(100); await __frames(2);
  const frame = Render.walkerDrawn().frame, H = SPRITES.HORSES.fjord, horse = __count(__grab(S.px, S.py - 10, 60), __hex(H.pal.B), 8);
  Systems.horseOn = hon; S.horse = null;
  /* the wire: hung by both hands from the trolley, toward the eye */
  S.state = 'zip'; S.zip = { x0: S.px, y0: S.py, x1: S.px + 600, y1: S.py, t: 0, dur: 1e9 };
  await __wait(120); await __frames(3);
  const bar = __count(__grab(S.px, S.py - 34, 30), __hex('#7a8a8f'), 6), hands = __count(__grab(S.px, S.py - 30, 90), __hex(Render.courierPal(Render.wornPal()).S), 6);
  S.state = 'walk'; S.zip = null; __done();
  return { frame, horse, bar, hands };
});
ok('THE RIDE AND THE WIRE: mounted, the courier sits astride (the ride frame) on the stable\'s horse drawn a third larger — the horse under the rider on screen; on a zip line the courier hangs toward the eye by both hands from the trolley\'s bar, where the wire runs',
  ride.frame === 'ride' && ride.horse > 30 && ride.bar > 4 && ride.hands > 2, JSON.stringify(ride));

/* ================= 9 · THE PAPERS ================= */
const papers = await ev(async () => {
  const size = src => new Promise(res => { const im = new Image(); im.onload = () => res([im.naturalWidth, im.naturalHeight]); im.onerror = () => res([0, 0]); im.src = src; });
  const n = NPC.gen({ at: 'haven' });
  const doll = await size(Render.rigPreviewURL(Render.wornPal(), 5)), tailor = await size(Render.rigPreviewURL(Render.wornPal(), 6)), roll = await size(Render.npcRigURL(n, 3)), row = await size(Render.npcRigURL(n, 2)), plate = await size(Render.rigOverlayURL('bolt', 3));
  const plates = await Promise.all(['bolt', 'scar', 'dressed'].map(k => Render.rigOverlayURL(k, 3)));
  /* the frames the papers are shown in: each image drawn at its own size inside its border, never squeezed */
  const box = async id => { const im = document.getElementById(id); if (!im) return null; await new Promise(res => (im.complete ? res() : (im.onload = res))); return [im.clientWidth, im.clientHeight, im.naturalWidth, im.naturalHeight]; };
  UI2.openTailor(); await __wait(150); const tailorBox = await box('tailorRig'); document.getElementById('tailorOv').classList.add('hidden');
  UI2.toggleSkills(true); await __wait(150); const dollBox = await box('dollRig'); UI2.toggleSkills(false);
  return { doll, tailor, roll, row, plate, platesDistinct: new Set(plates).size === 3, tailorBox, dollBox };
});
const cgOk = cg.nw === 96 && cg.nh === 144 && cg.w === cg.nw && cg.h === cg.nh;   // drawn at its own size inside its border: never squeezed a pixel
ok('THE PAPERS: the courier cropped head to boots toward the eye (16×24 texels, the old portrait\'s own 2:3) at whole-texel scales — enlistment and the tailor at six (96×144), the equip doll at five, the roll at three, the crew\'s rows at two; the manual\'s plates of the bolt, the scar and the dressing on the courier\'s side view at the anchors the game stamps them (60×72), three different plates',
  cgOk && papers.doll.join() === '80,120' && papers.tailor.join() === '96,144' && papers.roll.join() === '48,72' && papers.row.join() === '32,48' && papers.plate.join() === '60,72' && papers.platesDistinct && papers.tailorBox && papers.tailorBox.join() === '96,144,96,144' && papers.dollBox && papers.dollBox.join() === '80,120,80,120', JSON.stringify({ cg, papers }));

ok('no page errors across the courier set', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(results.join('\n'));
console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks passed`);
await b.close();
