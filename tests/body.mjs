/* body.mjs — v3.19 THE BODY REMEMBERS (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source was
   lost; its figures sampled on the courier's grid). What the body carries, what lands on it, what it has learned: the pack
   authored (a glyph for every kind of thing on a back, the gold band on everything order-bound, the equipped frame holding
   the load, the coat and boots bought recolouring the rig's own texels); alive as interaction (leaves that meet the coat
   three ways and never bend a line they missed, a sparse cap; snow that piles on the hood by how hard it falls and how still
   the body is, sheds with work and melts with warmth, falls as flakes in the north); nothing plopped down blind (the
   blueprint, valid or refusing with why, laid exactly, aimed by keyboard hands, folded away unspent; built things the
   player's — moved free, taken down for a refund, a ladder folding back); the pushback earned (no ring on mastered ground, a
   trained body steadying itself, overload keeping its teeth, a stumble that never cancels the chain); the valley walking on
   when you switch away (off by default, walking hidden, never a hidden ring); and the save. Where v3.31's fairness pass
   rewrote a v3.19 behaviour (no escort warped to your back, no companion teleported, no ring without a reason) the
   current law is tested and named. */
import { boot, PAGE } from './lib/harness.mjs';

const T = await boot();
const { ev, ok, page } = T;

await ev(() => {
  window.__toasts = []; new MutationObserver(ms => { for (const m of ms) for (const n2 of m.addedNodes) if (n2.textContent) __toasts.push(n2.textContent); }).observe(document.getElementById('toasts'), { childList: true });
  window.__says = []; const say0 = Render.say; Render.say = (x, y, text, ...rest) => { __says.push(text); return say0(x, y, text, ...rest); };
  window.__labels = () => Render.labelBoxes().map(b => b.str);
  window.__gw = (wx, wy, r) => __grab(wx, wy, r * Render.effZoom() / devicePixelRatio);   // a square of half-side r WORLD units
  window.__nw = (wx, wy, hex, tol, r) => __count(__gw(wx, wy, r), __hex(hex), tol);
  window.__pack = ids => { S.cargo = S.cargo.filter(c => c.cat === 'tool'); const out = ids.map(id => { const it = State.makeItem(id); State.addCargo(it); return it; }); return out; };
  window.__rowsOf = fc => SPRITES.COURIER.frames[fc === 'W' ? 'E' : fc][Render.walkerDrawn().frame];
  /* the north: open ground cold enough to snow on (the fall at nine tenths of its greyfall), walkable four hundred units east */
  window.__north = (() => { for (let y = 1500; y < 2400; y += 40) for (let x = 400; x < 7800; x += 40) { let okn = true; for (let d = 0; d <= 420 && okn; d += 12) { const t = World.terrainAt(x + d, y); if (t.blocked || t.water || t.slope > 0.25) okn = false; } if (okn) return [x, y]; } return null; })();
});

/* ================= 1 · THE PACK, AUTHORED ================= */
let r = await ev(() => {
  const G = id => Render.cargoGlyph(State.makeItem(id));
  const six = ['meds', 'food', 'textiles', 'seeds', 'coolant', 'lumenCell'].map(id => ({ id, rows: G(id).rows.join('|') }));
  const more = ['letters', 'core'].map(id => ({ id, rows: G(id).rows.join('|') }));
  const mats = [['metal', 'ingot'], ['ceramic', 'slab']].map(([m]) => ({ id: m, rows: Render.cargoGlyph({ ...State.makeItem('meds'), cat: 'mat', mat: m }).rows.join('|') }));
  const all = [...six, ...more, ...mats], distinct = new Set(all.map(g => g.rows)).size;
  const drumBlue = G('coolant').pal.B, drumTeal = G('filters').pal.B, sameDrum = G('coolant').rows.join() === G('filters').rows.join();
  const white = G('meds').rows.join('').split('W').length - 1, window2 = G('lumenCell').rows.join('').split('W').length - 1, glow = !!G('lumenCell').glow;
  /* every small thing rolls into ONE duffel at the base */
  const smalls = ['ration', 'salve', 'warmmeal'].filter(k => DATA.items[k] && DATA.items[k].kg < 3);   // a ration, a salve, a warm meal
  return { six: six.length, all: all.length, distinct, drumBlue, drumTeal, sameDrum, white, window: window2, glow, smalls };
});
const packReg = r;
await ev(async () => { await __stage(); });
r = await ev(async smalls => {
  const S0 = [...S.cargo];
  __pack(smalls); Render.faceWalker('S'); await __wait(120); await __frames(3);
  const tiersSmall = Render.walkerDrawn().tiers;
  __pack(['meds', 'food', ...smalls]); await __wait(120); await __frames(3);
  const tiersMix = Render.walkerDrawn().tiers;
  S.cargo = S0; return { tiersSmall, tiersMix };
}, packReg.smalls);
ok('THE PACK\'S GLYPHS: every kind of thing on a back has its own glyph, stamped in texels on the tower — the medicine crossed white, tins ribbed, bales soft-cornered, seed sacks tied, drums stamped (coolant blue, filter teal on the same drum), lumen cells with a lit window; the mail in its satchel, the core, ingots and slabs as themselves — every one of them distinct; and every small thing rolls into one duffel at the base (three small things, one tier)',
  packReg.six === 6 && packReg.distinct === packReg.all && packReg.sameDrum && packReg.drumBlue !== packReg.drumTeal && packReg.white >= 6 && packReg.window >= 4 && packReg.glow && packReg.smalls.length === 3 && r.tiersSmall === 1 && r.tiersMix === 3,
  JSON.stringify({ ...packReg, ...r }));

r = await ev(async () => {
  const kinds = ['meds', 'food', 'textiles', 'seeds', 'coolant', 'filters', 'lumenCell', 'letters'];
  const law = kinds.map(id => {
    const it = State.makeItem(id), free = Render.cargoGlyph(it), bound = Render.cargoGlyph({ ...it, orderId: 77 }), lost = Render.cargoGlyph({ ...it, lostTo: 'elm' });
    const band = g => id === 'letters' ? g.pal.W === '#ffd98f' : (g.pal.B === '#ffd98f' && /^[.B]+$/.test(g.rows[g.rows.length - 2]) && g.rows[g.rows.length - 2].includes('B'));
    return { id, bound: band(bound), lost: band(lost), free: free.pal.B !== '#ffd98f' && (id !== 'letters' || free.pal.W !== '#ffd98f') };
  });
  /* on the back, on screen: a bound crate's band is gold on the tower; the same crate unbound shows none */
  const A = SPRITES.COURIER.at.N; Render.faceWalker('N');   // from behind: the tower whole on the pack
  const it = __pack(['textiles'])[0]; await __stage();
  const p = Render.walkerAt(A.tower[0], A.tower[1] - 2), free = __nw(p.x, p.y, '#ffd98f', 8, 14);
  it.orderId = 77; await __wait(100); await __frames(3); const gold = __nw(p.x, p.y, '#ffd98f', 8, 14);
  S.cargo = S.cargo.filter(c => c.cat === 'tool');
  return { law, free, gold };
});
ok('THE GOLD BAND LAW: order-bound cargo wears the gold band on every glyph — a band row injected where the shape had none (the bale, the sack, the tin, the drum, the cell), the satchel\'s flap gone gold — whether signed for or lost toward its door; free cargo never shows the gold; on the tower the same bale shows its band gold only when bound',
  r.law.every(g => g.bound && g.lost && g.free) && r.free === 0 && r.gold > 8, JSON.stringify(r));

r = await ev(async () => {
  /* the medicine's white cross and the lumen cell's lit window, in canvas pixels on the tower, against the tower without them */
  Render.faceWalker('S'); await __stage();
  const A = SPRITES.COURIER.at.S, p = Render.walkerAt(A.tower[0], A.tower[1] - 5), R = 9;
  const count = () => ({ white: __nw(p.x, p.y, '#f2ead4', 8, R), cyan: __count(__gw(p.x, p.y, R), [100, 234, 214], 30) });
  __pack(['meds', 'lumenCell']); await __wait(120); await __frames(3); const loaded = { ...count(), tiers: Render.walkerDrawn().tiers };
  S.cargo = S.cargo.filter(c => c.cat === 'tool'); await __wait(120); await __frames(3); const bare = count();
  return { loaded, bare };
});
ok('THE CROSS AND THE WINDOW, IN PIXELS: on the Walker\'s tower the medicine\'s white cross and the lumen cell\'s lit cyan window are there in the canvas\'s own pixels — and the same tower bare shows neither',
  r.loaded.tiers === 2 && r.loaded.white > 10 && r.loaded.cyan > 4 && r.bare.white === 0 && r.bare.cyan === 0, JSON.stringify(r));

r = await ev(async () => {
  /* the coat and the boots they bought recolour the rig's own texels over rank's coat */
  Render.faceWalker('S'); const keep = { coat: S.equip.coat, boots: S.equip.boots };
  const texel = ch => { const rows = __rowsOf('S'); for (let y = 12; y < 32; y++) for (let x = 0; x < 32; x++) if (rows[y][x] === ch) return [x, y]; return null; };
  const read = () => { const c = texel('C'), b = texel('B'), pc = Render.walkerAt(c[0], c[1]), pb = Render.walkerAt(b[0], b[1]); return { coat: __px(pc.x, pc.y), boots: __px(pb.x, pb.y) }; };
  S.equip.coat = State.makeItem('coat0'); S.equip.boots = State.makeItem('boots0'); await __stage(); const rank = { ...read(), pal: Render.courierPal(Render.wornPal()).C, rankCoat: Render.coatPal().C };
  S.equip.coat = State.makeItem('coat_high'); S.equip.boots = State.makeItem('boots_tread'); await __stage(); const worn = { ...read(), C: Render.courierPal(Render.wornPal()).C, B: Render.courierPal(Render.wornPal()).B, rankCoat: Render.coatPal().C };
  S.equip.coat = keep.coat; S.equip.boots = keep.boots;
  return { rank, worn };
});
ok('WORN, NOT LISTED: the coat and the boots equipped recolour the rig\'s own coat and boot texels — the Highland coat\'s red over rank\'s coat (rank still dresses the default: Render.coatPal is unchanged), Treadfast boots on the boot texels — sampled on the canvas at the courier\'s own texels',
  r.rank.coat === r.rank.pal && r.worn.coat === r.worn.C && r.worn.C === '#6e4a4a' && r.worn.boots === r.worn.B && r.worn.B === '#5a4a30' && r.rank.coat !== r.worn.coat && r.rank.boots !== r.worn.boots && r.worn.rankCoat === r.rank.rankCoat,
  JSON.stringify(r));

r = await ev(async () => {
  /* the frame the Walker EQUIPPED holds the load: the exo's steel struts with their lit nodes up the pack's sides */
  Render.faceWalker('N'); const keep = S.equip.pack;
  __pack(['meds', 'textiles']);
  const at = () => { const p = Render.walkerAt(16, 16), R = Math.abs(Render.walkerAt(31, 0).x - Render.walkerAt(0, 0).x) * 0.6; return { steel: __nw(p.x, p.y, '#8d979c', 5, R), lit: __nw(p.x, p.y, '#6fe3d2', 5, R) }; };   // the whole figure: the rails run up the pack's two sides
  S.equip.pack = State.makeItem('pack0'); await __stage(); const plain = at();
  S.equip.pack = State.makeItem('pack_exo1'); await __stage(); const exo = at();
  S.equip.pack = keep; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  return { plain, exo };
});
ok('THE EXO\'S STRUTS: equipped with the Exo frame, the Walker\'s tower stands between steel struts with lit nodes up the pack\'s sides (from behind) — the plain pack under the same load shows neither',
  r.exo.steel > 12 && r.exo.lit > 2 && r.plain.lit === 0 && r.exo.steel > r.plain.steel, JSON.stringify(r));

/* ================= 2 · ALIVE IS INTERACTION: THE LEAVES ================= */
r = await ev(async () => {
  await __stage(); WL.timeScale = 1; Render.setFx(true);
  const L = Render.leaves(); L.length = 0;
  Render.gust(4);   // four real leaves of a gust, aimed: three across the Walker's line, one over their head
  const mk = (i, id, dy) => Object.assign(L[i], { id, x: S.px - 46, y: S.py + dy, vx: 92, vy: 0, t: 0, ph: 0, life: 6, state: 'fly', met: false });
  mk(0, 300, -12); mk(1, 301, -12); mk(2, 302, -12); mk(3, 303, -70);
  const miss = L[3], track = [];
  const t0 = performance.now(); while (performance.now() - t0 < 1100) { await __frames(1); track.push([miss.x, miss.vx, miss.met]); }
  const [deflect, stick, pass] = [L.find(l => l.id === 300), L.find(l => l.id === 301), L.find(l => l.id === 302)];
  const out = { deflect: deflect && { met: deflect.met, vx: Math.round(deflect.vx), x: Math.round(deflect.x - S.px) }, stick: stick && { met: stick.met, state: stick.state }, pass: pass && { met: pass.met, vx: Math.round(pass.vx), x: Math.round(pass.x - S.px) } };
  /* the one that missed: never met, its x only ever forward, its speed only ever the air's drag */
  let monotone = true, sign = true; for (let i = 1; i < track.length; i++) { if (track[i][0] < track[i - 1][0]) monotone = false; if (track[i][1] <= 0 || track[i][1] > track[i - 1][1] + 1e-9) sign = false; }
  out.miss = { met: miss.met, monotone, sign, vx0: 92, vx: +miss.vx.toFixed(1) };
  WL.timeScale = 0.001; Render.setFx(false);
  return out;
});
ok('THE LEAF, THREE WAYS: a gust\'s leaves whose path crosses the Walker meet the coat — one deflects off it (thrown back the way it came), one sticks a beat on the coat and drops, one passes clean behind',
  r.deflect && r.deflect.met && r.deflect.vx < 0 && r.deflect.x < 0 && r.stick && r.stick.met && ['stuck', 'ground'].includes(r.stick.state) && r.pass && r.pass.met && r.pass.vx > 0 && r.pass.x > 20, JSON.stringify(r));
ok('THE NEVER-BENDS LAW: a leaf that misses never bends its line — over the same second it never met the Walker, moved only ever forward, and its speed only ever fell to the air\'s drag',
  r.miss.met === false && r.miss.monotone && r.miss.sign && r.miss.vx < 92 && r.miss.vx > 80, JSON.stringify(r.miss));

r = await ev(async () => {
  const L = Render.leaves(); L.length = 0;
  const burst = Render.gust(40), capped = L.length; L.length = 0;
  /* the valley's own gusts: on the meadow they come; in the north's snowfall never */
  Render.setFx(true);
  const run = async (at, weather) => { WL.tp(at); S.weather = weather; Render.cam.x = S.px; Render.cam.y = S.py; L.length = 0; WL.timeScale = 20; let most = 0; const t0 = performance.now(); while (performance.now() - t0 < 2200) { await __frames(1); most = Math.max(most, L.length); } WL.timeScale = 0.001; return most; };
  const H = DATA.stations.haven, meadow = await run([H.x + 520, H.y + 260], { state: 'clear', t: 9999, intensity: 0 });
  const north = __north;
  const snowy = await run(north, { state: 'grey', t: 9999, intensity: 0.9 }), snowAt = +Systems.snowAt(S.px, S.py).toFixed(2);
  S.weather = { state: 'clear', t: 9999, intensity: 0 }; L.length = 0; Render.setFx(false); await __stage();
  return { burst, capped, max: DATA.T.leafMax, meadow, snowy, snowAt, cls: World.classAt(north[0], north[1]) };
});
ok('THE SPARSE CAP: leaves are an event, not a blizzard — a gust asked for forty puts no more than fourteen in the air; the valley\'s own gusts come on the meadow, and never in the north\'s snowfall',
  r.capped <= r.max && r.max === 14 && r.meadow > 0 && r.meadow <= 14 && r.snowy === 0 && r.snowAt > 0.05, JSON.stringify(r));

/* ================= 3 · THE SNOW ================= */
await ev(() => { window.__noWraith = true; const f = () => { if (window.__noWraith) { S.wraiths.length = 0; requestAnimationFrame(f); } }; requestAnimationFrame(f); });   // the north is deep grey: its wraiths are not this suite's
const snow = await ev(async () => {
  const P = __north;
  const rate = async (intensity, walk) => {
    WL.tp(P); S.weather = { state: 'grey', t: 9999, intensity }; S.snowPack = 0; S.moveTo = null; S.speed = 0; WL.timeScale = 1;
    if (walk) Systems.moveTo(S.px + 600, S.py);
    await __wait(200); const p0 = S.snowPack, t0 = S.time; await __wait(900);
    const out = +((S.snowPack - p0) / (S.time - t0)).toFixed(4), moving = S.speed > 8; S.moveTo = null; return { rate: out, moving, s: +Systems.snowAt(S.px, S.py).toFixed(2) };
  };
  const light = await rate(0.45, false), hard = await rate(0.9, false), walking = await rate(0.9, true);
  /* melting: out of the fall, the cold dark lets it go slowly; shelter or warmth four times as fast */
  const melt = async warm => {
    WL.tp(P); S.weather = { state: 'clear', t: 9999, intensity: 0 }; S.snowPack = 0.8; S.moveTo = null; WL.timeScale = 1;
    const gen = warm ? { id: U.uid(), type: 'generator', x: S.px + 30, y: S.py, ang: 0, hp: 100, by: 'you', likes: 0 } : null; if (gen) S.structures.push(gen);
    await __wait(150); const p0 = S.snowPack, t0 = S.time; await __wait(800);
    const out = +((p0 - S.snowPack) / (S.time - t0)).toFixed(4); if (gen) S.structures.splice(S.structures.indexOf(gen), 1); return out;
  };
  const cold = await melt(false), sheltered = await melt(true);
  WL.timeScale = 0.001;
  return { light, hard, walking, cold, sheltered, acc: DATA.T.snowAcc, meltRow: DATA.T.snowMelt };
});
ok('THE SNOW PILES ON: in the north\'s greyfall snow collects on a still body by how hard it falls — twice the fall, twice the pile (each second\'s gain measured on the game\'s clock)',
  snow.light.rate > 0 && snow.hard.rate > 0 && Math.abs(snow.hard.rate / snow.light.rate - 2) < 0.25 && Math.abs(snow.hard.rate - snow.acc * snow.hard.s) < 0.006, JSON.stringify({ light: snow.light, hard: snow.hard }));
ok('THE SNOW LET GO: a working body sheds most of it — walking through the same fall it gathers about a third of what standing does — and out of the fall it melts, four times as fast in a generator\'s warmth as in the cold dark',
  snow.walking.moving && Math.abs(snow.walking.rate / snow.hard.rate - 0.35) < 0.08 && snow.cold > 0 && Math.abs(snow.sheltered / snow.cold - 4) < 0.6, JSON.stringify(snow));

r = await ev(async () => {
  /* flakes, not rain: the same greyfall read by the settled camera — the north's comes as flakes, the south's as rain */
  Render.setFx(true); Render.setZoom(null);
  const look = async P => {
    WL.tp(P); S.moveTo = null; S.snowPack = 0; WL.timeScale = 1;
    Render.cam.x = S.px; Render.cam.y = S.py; S.weather = { state: 'clear', t: 9999, intensity: 0 }; await __wait(500);   // the camera settles on the walker before the sky is read
    WL.timeScale = 0.001; await __wait(150); await __frames(3);
    const cv = document.getElementById('game'), W2 = cv.width, H2 = cv.height, grab = () => cv.getContext('2d').getImageData(0, 0, W2, H2).data;
    const clear = grab();
    S.weather = { state: 'grey', t: 9999, intensity: 0.9 }; await __wait(150); await __frames(4);
    const fall = grab(), mask = new Uint8Array(W2 * H2);
    for (let i = 0, p = 0; i < fall.length; i += 4, p++) if (Math.abs(fall[i] - clear[i]) + Math.abs(fall[i + 1] - clear[i + 1]) + Math.abs(fall[i + 2] - clear[i + 2]) > 60) mask[p] = 1;   // the sky that fell, against the same frame clear
    /* each thing that fell, by its shape: a flake is a square blob, a raindrop a tall thin dash */
    let flakes = 0, rain = 0; const st = [], aspects = [];
    for (let p = 0; p < mask.length; p++) {
      if (!mask[p]) continue;
      let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1, n = 0; st.push(p); mask[p] = 0;
      while (st.length) { const q = st.pop(), x = q % W2, y = (q / W2) | 0; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        for (const nq of [q - 1, q + 1, q - W2, q + W2]) if (nq >= 0 && nq < mask.length && mask[nq] && Math.abs((nq % W2) - x) <= 1) { mask[nq] = 0; st.push(nq); } }
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      if (n < 4) continue;
      aspects.push(h / w);
      if (h >= w * 3) rain++; else if (w <= 16 && h <= 16) flakes++;   // a dash is three times as tall as it is wide; a flake a blob a texel or two a side
    }
    S.snowPack = 0;
    aspects.sort((a, b) => a - b);
    return { mode: Render.precipMode(), flakes, rain, n: aspects.length, aspect: aspects.length ? +aspects[aspects.length >> 1].toFixed(2) : null, snowAt: +Systems.snowAt(Render.cam.x, Render.cam.y).toFixed(2), rainAt: +Systems.rainAt(Render.cam.x, Render.cam.y).toFixed(2) };
  };
  const north = await look(__north);
  const south = await look([5900, 8400]);   // the south's unlit meadow, where the greyfall rains
  S.weather = { state: 'clear', t: 9999, intensity: 0 }; WL.timeScale = 0.001; Render.setFx(false);
  return { north, south };
});
ok('FLAKES, NOT MORE RAIN: under the same greyfall the settled camera reads the north as SNOW — sparse square flakes on the canvas (each thing that fell read by its shape against the same frame clear: square as a rule, flakes many times the dashes), not rain — and the south\'s unlit meadow as rain, tall solid dashes as a rule (the middle shape three times as tall as wide)',
  r.north.mode === 'snow' && r.north.n >= 8 && r.north.aspect < 2 && r.north.flakes >= 5 * Math.max(1, r.north.rain) && r.south.mode === 'rain' && r.south.n >= 8 && r.south.aspect >= 3 && r.south.rain > r.south.flakes, JSON.stringify(r));

r = await ev(async () => {
  /* the cap: the hood first, then the shoulders and the pack's top crate, then the full cap */
  __pack(['meds']); Render.faceWalker('S'); await __stage();
  const snowCount = () => { const p = Render.walkerAt(16, 12); return __nw(p.x, p.y, '#e8f2f8', 6, 24) + __nw(p.x, p.y, '#c2d4e0', 6, 24); };
  const stage = async a => { S.snowPack = a; await __wait(120); await __frames(3); return snowCount(); };
  const s0 = await stage(0), s1 = await stage(0.3);
  /* at the first stage every snow texel lies on the hood: each column's crown texel over a hood letter, and only those */
  const rows = __rowsOf('S'); let onHood = 0, offHood = 0;
  for (let c = 0; c < 32; c++) { let rr = 0; while (rr < 32 && rows[rr][c] === '.') rr++; if (rr >= 32) continue; const below = rows[Math.min(31, rr + 1)][c], p = Render.walkerAt(c, rr), px = __px(p.x, p.y), isSnow = px === '#e8f2f8' || px === '#c2d4e0'; if ('HIh'.includes(below)) { if (isSnow) onHood++; } else if (isSnow) offHood++; }
  const s2 = await stage(0.6), s3 = await stage(0.9);
  const top = (() => { const A = SPRITES.COURIER.at.S, w = Render.walkerDrawn(), p = Render.walkerAt(A.tower[0], w.towerTop); return __nw(p.x, p.y, '#dce8f0', 6, 6); })();
  S.snowPack = 0; S.cargo = S.cargo.filter(c => c.cat === 'tool');
  return { s0, s1, s2, s3, onHood, offHood, top };
});
ok('THE CAP DRAWN ON THE HOOD: drawn in the rig\'s own texels, stage by stage — at the first only the hood\'s crown (every snow texel over a hood texel, none elsewhere), then the shoulders and the pack\'s top crate too, then a second row over all: more snow at every stage, none without it',
  r.s0 === 0 && r.s1 > 0 && r.onHood > 2 && r.offHood === 0 && r.s2 > r.s1 && r.s3 > r.s2 && r.top > 0, JSON.stringify(r));
await ev(() => { window.__noWraith = false; S.weather = { state: 'clear', t: 9999, intensity: 0 }; });

/* ================= 4 · NOTHING PLOPS DOWN BLIND ================= */
/* a kit on the back, metal in the bank, the Walker on Haven's lit meadow; the cursor is the page's own mouse */
await ev(async () => {
  await __stage(520, 260, 2); WL.timeScale = 1;
  S.flags.unlocks.kit = true; S.banked.metal = 300; S.banked.ceramic = 100;
  S.cargo = S.cargo.filter(c => c.cat !== 'tool'); WL.tool('kitTool', 3);
  for (const st of [...S.structures]) if (st.type === 'generator') S.structures.splice(S.structures.indexOf(st), 1);
  window.__scr = (wx, wy) => __toScr(wx, wy);
  window.__kits = () => State.countTool('kit');
  window.__near = (x, y) => U.dist(S.px, S.py, x, y);
});
const toScr = (wx, wy) => ev(([x, y]) => __toScr(x, y), [wx, wy]);
const hover = async (wx, wy) => { const p = await toScr(wx, wy); await page.mouse.move(p.x, p.y); await page.waitForTimeout(250); return p; };
await page.keyboard.press('KeyB'); await page.waitForTimeout(250);
const barOpen = await ev(() => !document.getElementById('buildBar').classList.contains('hidden'));
await page.click('#buildBar [data-b="generator"]'); await page.waitForTimeout(200);
const spot = await ev(() => [S.px + 110, S.py + 30]);
const hp = await hover(spot[0], spot[1]);
r = await ev(hp => { const w = Render.screenToWorld(hp.x, hp.y); return { place: S.place && { type: S.place.type, valid: S.place.valid, why: S.place.why, x: +S.place.x.toFixed(1), y: +S.place.y.toFixed(1) }, cursor: [+w.x.toFixed(1), +w.y.toFixed(1)], label: __labels().includes('Generator — HERE'), built: S.structures.filter(s2 => s2.type === 'generator').length, kits: __kits(), bank: S.banked.metal }; }, hp);
ok('THE BLUEPRINT: choosing a build (B, then the Generator on the bar — a real click) hangs its blueprint in the world at the cursor, honest that the ground will take it — "Generator — HERE" under the ghost — and nothing is built or spent yet',
  barOpen && r.place && r.place.type === 'generator' && r.place.valid && Math.abs(r.place.x - r.cursor[0]) < 1.5 && Math.abs(r.place.y - r.cursor[1]) < 1.5 && r.label && r.built === 0 && r.kits === 3 && r.bank === 300, JSON.stringify({ barOpen, spot, ...r }));
const why = {};
{
  /* BAD FOOTING: water or a wall within the leash; NEEDS WAYLIGHT: past the light's edge; MATERIALS SHORT: the bank empty; ANOTHER STANDS RIGHT THERE: a generator beside it */
  const wet = await ev(() => { const H = DATA.stations.haven; for (let a = 0; a < 64; a++) for (let d = 200; d < 700; d += 20) { const x = H.x + Math.cos(a / 64 * 6.283) * d, y = H.y + Math.sin(a / 64 * 6.283) * d, t = World.terrainAt(x, y); if (!(t.water || t.blocked)) continue; for (let b = 0; b < 16; b++) { const sx = x + Math.cos(b / 16 * 6.283) * 110, sy = y + Math.sin(b / 16 * 6.283) * 110, t2 = World.terrainAt(sx, sy); if (!t2.water && !t2.blocked && World.lightAt(sx, sy) > 0.5) return { x, y, stand: [sx, sy] }; } } return null; });
  const edge = await ev(() => { const H = DATA.stations.haven; for (let d = 400; d < 1400; d += 10) { const x = H.x + d, y = H.y + 300, x2 = x + 120; if (World.lightAt(x, y) > 0.34 && World.lightAt(x, y) < 0.5 && World.lightAt(x2, y) < 0.3 && !World.terrainAt(x, y).blocked && !World.terrainAt(x2, y).blocked && !World.terrainAt(x2, y).water) return { stand: [x, y], dark: [x2, y] }; } return null; });
  const readWhy = () => ev(() => ({ why: S.place && S.place.why, valid: S.place && S.place.valid, label: __labels().find(l => /^(BAD FOOTING|NEEDS WAYLIGHT|MATERIALS SHORT|ANOTHER STANDS RIGHT THERE)$/.test(l)) || null }));
  const tryClick = async (wx, wy) => { const p = await toScr(wx, wy); const n0 = await ev(() => S.structures.length); await page.mouse.click(p.x, p.y); await page.waitForTimeout(250); return ev(n => ({ built: S.structures.length - n, toast: __toasts[__toasts.length - 1] || '' }), n0); };
  await ev(w => { WL.tp(w.stand); Render.cam.x = S.px; Render.cam.y = S.py; }, wet); await page.waitForTimeout(300);
  await hover(wet.x, wet.y); why.footing = { ...(await readWhy()), ...(await tryClick(wet.x, wet.y)) };
  await ev(e => { WL.tp(e.stand); Render.cam.x = S.px; Render.cam.y = S.py; }, edge); await page.waitForTimeout(300);
  await hover(edge.dark[0], edge.dark[1]); why.light = { ...(await readWhy()), ...(await tryClick(edge.dark[0], edge.dark[1])) };
  await ev(() => { WL.tp([DATA.stations.haven.x + 520, DATA.stations.haven.y + 260]); Render.cam.x = S.px; Render.cam.y = S.py; S.banked.metal = 5; }); await page.waitForTimeout(300);
  await hover(spot[0], spot[1]); why.short = { ...(await readWhy()), ...(await tryClick(spot[0], spot[1])) };
  await ev(() => { S.banked.metal = 300; S.structures.push({ id: U.uid(), type: 'generator', x: S.px + 60, y: S.py - 90, ang: 0, hp: 100, by: 'you', likes: 0, __other: true }); });
  await hover(spot[0], spot[1]); why.another = { ...(await readWhy()), ...(await tryClick(spot[0], spot[1])) };
  await ev(() => { const o = S.structures.find(s2 => s2.__other); S.structures.splice(S.structures.indexOf(o), 1); });
  why.kits = await ev(() => __kits());
}
ok('THE REFUSAL, WITH WHY: the ghost says why it will not stand — BAD FOOTING over water or a wall, NEEDS WAYLIGHT past the light\'s edge, MATERIALS SHORT with the bank empty, ANOTHER STANDS RIGHT THERE beside a generator already raised — the reason under it, and a click on it refuses in those words, nothing built, no kit spent',
  why.footing.why === 'BAD FOOTING' && why.light.why === 'NEEDS WAYLIGHT' && why.short.why === 'MATERIALS SHORT' && why.another.why === 'ANOTHER STANDS RIGHT THERE'
  && [why.footing, why.light, why.short, why.another].every(w => w.valid === false && w.label === w.why && w.built === 0 && w.toast.toLowerCase().startsWith(w.why.toLowerCase().slice(0, 8))) && why.kits === 3, JSON.stringify(why));

const lay = await (async () => {
  await ev(() => { Render.cam.x = S.px; Render.cam.y = S.py; }); await page.waitForTimeout(200);
  const target = await ev(() => [S.px + 95, S.py + 55]);
  const p = await hover(target[0], target[1]);
  const w0 = await ev(([x, y]) => Render.screenToWorld(x, y), [p.x, p.y]);
  const b0 = await ev(() => ({ metal: S.banked.metal, kits: __kits(), n: S.structures.length }));
  await page.mouse.click(p.x, p.y); await page.waitForTimeout(300);
  return ev(({ w0, b0 }) => { const g = S.structures.find(s2 => s2.type === 'generator'); return { at: g ? [+g.x.toFixed(1), +g.y.toFixed(1)] : null, cursor: [+w0.x.toFixed(1), +w0.y.toFixed(1)], paid: b0.metal - S.banked.metal, kitsSpent: b0.kits - __kits(), placeGone: !S.place, n: S.structures.length - b0.n }; }, { w0, b0 });
})();
ok('THE EXACT LAY: a click on a valid ghost lays the generator precisely where it hung — under the cursor to the unit — the kit spent and its 28 metal paid, the blueprint put away',
  !!lay.at && Math.abs(lay.at[0] - lay.cursor[0]) < 1.5 && Math.abs(lay.at[1] - lay.cursor[1]) < 1.5 && lay.paid === 28 && lay.kitsSpent === 1 && lay.placeGone && lay.n === 1, JSON.stringify(lay));

/* the keyboard's hands: a second valley in the same browser that has never seen the mouse — B, the bar's digit, E */
const kb = await (async () => {
  const p2 = await T.b.newPage({ viewport: { width: 1440, height: 860 } });
  await p2.route(/fonts\.(googleapis|gstatic)\.com/, rr => rr.abort());
  const errs = []; p2.on('pageerror', e => errs.push(String(e.message)));
  await p2.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await p2.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
  await p2.evaluate(() => localStorage.clear());
  for (const id of ['btnNew', 'btnBegin', 'briefGo', 'cgBegin']) { await p2.evaluate(i => document.getElementById(i).click(), id); await p2.waitForTimeout(id === 'cgBegin' ? 1200 : 350); }   // enlisted without a pointer: the page has never seen the mouse
  for (let i = 0; i < 30; i++) { const c = await p2.evaluate(() => !!(window.S && S.cine)); if (!c) break; await p2.evaluate(() => WL.skipCine()); await p2.waitForTimeout(250); }
  const idx = await p2.evaluate(() => {
    S.flags.guideDone = true; WL.calm(); S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
    const H = DATA.stations.haven; WL.tp([H.x + 520, H.y + 260]); S.dir = 0; S.moveTo = null;
    S.flags.unlocks.kit = true; S.banked.metal = 300; WL.tool('kitTool', 2);
    return Systems.buildOptions().findIndex(o => o.type === 'generator');
  });
  await p2.waitForTimeout(300);
  await p2.keyboard.press('KeyB'); await p2.waitForTimeout(200);
  await p2.keyboard.press(`Digit${idx + 1}`); await p2.waitForTimeout(300);
  const ahead = await p2.evaluate(() => S.place && { x: +(S.place.x - S.px).toFixed(1), y: +(S.place.y - S.py).toFixed(1), valid: S.place.valid });
  await p2.evaluate(() => { S.dir = Math.PI / 2; }); await p2.waitForTimeout(300);
  const turned = await p2.evaluate(() => S.place && { x: +(S.place.x - S.px).toFixed(1), y: +(S.place.y - S.py).toFixed(1), valid: S.place.valid });
  const at = await p2.evaluate(() => [S.px, S.py]);
  await p2.keyboard.press('KeyE'); await p2.waitForTimeout(300);
  const built = await p2.evaluate(a => { const g = S.structures.find(s2 => s2.type === 'generator'); return g ? [+(g.x - a[0]).toFixed(1), +(g.y - a[1]).toFixed(1)] : null; }, at);
  await p2.close();
  return { idx, ahead, turned, built, errs };
})();
ok('THE KEYBOARD\'S HANDS: in a valley that has never seen the mouse, B and the bar\'s digit hang the blueprint ahead of the Walker (ninety units the way they face), it swings when they turn, and E lays it exactly there',
  kb.idx >= 0 && kb.ahead && Math.abs(kb.ahead.x - 90) < 1 && Math.abs(kb.ahead.y) < 1 && kb.ahead.valid && kb.turned && Math.abs(kb.turned.x) < 1 && Math.abs(kb.turned.y - 90) < 1 && kb.built && Math.abs(kb.built[0]) < 1 && Math.abs(kb.built[1] - 90) < 1 && kb.errs.length === 0, JSON.stringify(kb));

const cancel = await (async () => {
  const out = {};
  const hang = async () => { await ev(() => { Systems.beginPlace('watchtower'); }); await page.waitForTimeout(150); };
  const state = () => ev(() => ({ place: !!S.place, kits: __kits(), metal: S.banked.metal, n: S.structures.length }));
  const s0 = await state();
  await hang(); await page.keyboard.press('Escape'); await page.waitForTimeout(200); out.esc = await state();
  await hang(); await page.keyboard.press('KeyB'); await page.waitForTimeout(200); out.b = await state();
  await hang(); await hover(spot[0], spot[1] - 40); const pr = await toScr(spot[0], spot[1] - 40); await page.mouse.click(pr.x, pr.y, { button: 'right' }); await page.waitForTimeout(200); out.right = await state();
  /* a click far past an invalid ghost is a walk order: the blueprint folds, and the Walker walks */
  await ev(() => { S.banked.metal = 2; }); await hang(); await hover(spot[0], spot[1]);
  const inv = await ev(() => S.place && { valid: S.place.valid, why: S.place.why });
  const far = await ev(() => [S.px - 260, S.py + 180]), pf = await toScr(far[0], far[1]);
  await page.mouse.click(pf.x, pf.y); await page.waitForTimeout(300);
  out.walk = { inv, ...(await state()), moving: await ev(f => !!S.moveTo && U.dist(S.moveTo.x, S.moveTo.y, f[0], f[1]) < 30, far) };
  await ev(() => { S.moveTo = null; S.banked.metal = 300; });
  out.s0 = s0; return out;
})();
ok('CANCEL, UNSPENT: Esc, B or a right-click folds the blueprint away with nothing spent (the kits on the back, the bank as it was, nothing raised); and a click far past an invalid ghost is a walk order — the blueprint folds and the Walker sets off: placement never traps the mouse',
  ['esc', 'b', 'right'].every(k => !cancel[k].place && cancel[k].kits === cancel.s0.kits && cancel[k].metal === cancel.s0.metal && cancel[k].n === cancel.s0.n) && cancel.walk.inv && cancel.walk.inv.valid === false && !cancel.walk.place && cancel.walk.moving && cancel.walk.kits === cancel.s0.kits,
  JSON.stringify(cancel));

/* ================= 5 · BUILT THINGS ARE THE PLAYER'S ================= */
const mv = await (async () => {
  const g0 = await ev(() => { const g = S.structures.find(s2 => s2.type === 'generator'); WL.tp([g.x + 30, g.y + 20]); S.moveTo = null; Render.cam.x = S.px; Render.cam.y = S.py; return { id: g.id, x: g.x, y: g.y, metal: S.banked.metal, kits: __kits() }; });
  await page.waitForTimeout(400);
  const prompt = await ev(() => (Systems.getInteractions().find(i => i.key === 'V') || {}).label || null);
  await page.keyboard.press('KeyV'); await page.waitForTimeout(250);
  const hung = await ev(() => S.place && { moving: S.place.moving, valid: S.place.valid });
  const dest = await ev(() => [S.px - 120, S.py + 40]); const p = await hover(dest[0], dest[1]);
  const w0 = await ev(([x, y]) => Render.screenToWorld(x, y), [p.x, p.y]);
  await page.mouse.click(p.x, p.y); await page.waitForTimeout(300);
  return ev(({ g0, w0 }) => { const g = S.structures.find(s2 => s2.id === g0.id); return { prompt: null, hung: null, at: g ? [+g.x.toFixed(1), +g.y.toFixed(1)] : null, cursor: [+w0.x.toFixed(1), +w0.y.toFixed(1)], metal: S.banked.metal - g0.metal, kits: __kits() - g0.kits, n: S.structures.filter(s2 => s2.type === 'generator').length }; }, { g0, w0 }).then(o => ({ ...o, prompt, hung }));
})();
ok('MOVED FOR FREE: by the Walker\'s own generator V hangs it again as a blueprint (free), and a click re-seats it exactly where the cursor stands — no metal, no kit, the same generator',
  /Move the <b>generator<\/b>/.test(mv.prompt || '') && mv.hung && mv.hung.moving && mv.hung.valid && !!mv.at && Math.abs(mv.at[0] - mv.cursor[0]) < 1.5 && Math.abs(mv.at[1] - mv.cursor[1]) < 1.5 && mv.metal === 0 && mv.kits === 0 && mv.n === 1, JSON.stringify(mv));

const down = await (async () => {
  const g0 = await ev(() => { const g = S.structures.find(s2 => s2.type === 'generator'); window.__gDown = g; WL.tp([g.x + 30, g.y + 20]); S.moveTo = null; return { metal: S.banked.metal }; });
  await page.waitForTimeout(400);
  await page.keyboard.press('KeyX'); await page.waitForTimeout(300);
  return ev(g0 => { const out = { gone: !S.structures.some(s2 => s2.type === 'generator'), refund: S.banked.metal - g0.metal, cost: DATA.structures.generator.cost.metal, back: DATA.T.dismantleBack, toast: __toasts.some(t => /Generator taken down — 16 metal recovered/.test(t)) }; const m1 = S.banked.metal; out.again = Systems.dismantleStruct(__gDown); out.refund2 = S.banked.metal - m1; return out; }, g0);
})();
ok('TAKEN DOWN, WITH A REFUND: X by an owned structure takes it down and hands back sixty per cent of its metal — the generator\'s 28 returns 16, and the toast counts it; what is down is down — taking it down again returns nothing more',
  down.gone && down.refund === Math.floor(down.cost * down.back) && down.refund === 16 && down.toast && down.again === false && down.refund2 === 0, JSON.stringify(down));

const fold = await (async () => {
  const l0 = await ev(() => { const st = { id: U.uid(), type: 'ladder', x: S.px + 40, y: S.py, ang: 0, hp: 100, by: 'you', likes: 0, flat: false }; S.structures.push(st); return { ladders: State.countTool('ladder'), id: st.id }; });
  await page.waitForTimeout(400);
  const prompt = await ev(() => (Systems.getInteractions().find(i => i.key === 'X') || {}).label || null);
  const hang = await ev(id => { const st = S.structures.find(s2 => s2.id === id); return { hung: Systems.beginMove(st), place: !!S.place, v: Systems.getInteractions().some(i => i.key === 'V') }; }, l0.id);
  await page.keyboard.press('KeyX'); await page.waitForTimeout(300);
  return ev(l0 => ({ gone: !S.structures.some(s2 => s2.id === l0.id), ladders: State.countTool('ladder') - l0.ladders }), l0).then(o => ({ ...o, prompt, hang }));
})();
ok('THE LADDER FOLDS BACK: a ladder is laid across its gap, never hung as a blueprint to move (no V, and no blueprint when asked); X by a ladder the Walker laid takes it up — it folds back onto the pack, one more ladder on the back to lay again',
  /it folds back onto the pack/.test(fold.prompt || '') && fold.hang.hung === false && !fold.hang.place && !fold.hang.v && fold.gone && fold.ladders === 1, JSON.stringify(fold));

/* ================= 6 · ALIVE IS NEVER A BURDEN (v3.31: the fairness pass — nobody warped) ================= */
await ev(() => { window.__noWraith = true; const f = () => { if (window.__noWraith) { S.wraiths.length = 0; requestAnimationFrame(f); } }; requestAnimationFrame(f); });
const escort = await ev(async () => {
  /* a cliff line between the junior and the Walker, and the ladder the Walker laid over it */
  let gap = null;
  for (let y = 5600; y < 7200 && !gap; y += 30) for (let x = 600; x < 7800 && !gap; x += 30) {
    if (World.terrainAt(x, y).blocked || World.terrainAt(x, y).water) continue;
    let wall = -1, dry = -1; for (let d = 10; d <= 200; d += 5) { const t = World.terrainAt(x, y + d); if (wall < 0 && t.cls === World.CLIFF) wall = d; if (wall > 0 && !t.water && !t.blocked) { dry = d; break; } }
    if (!(wall > 20 && wall < 80 && dry > 0 && dry < 140)) continue;
    let longWall = true; for (const dx of [-120, -60, 60, 120]) { const t = World.terrainAt(x + dx, y + wall + 2); if (!t.blocked) longWall = false; }   // a wall, not a boulder: no walking round it close by
    if (longWall) gap = { x, y, wall, dry };
  }
  if (!gap) return { none: true };
  S.px = gap.x; S.py = gap.y; S.dir = Math.PI / 2; WL.tool('ladderTool');
  const laid = Systems.tryBuild('ladder'), lad = S.structures[S.structures.length - 1];
  const o = { idNum: U.uid(), id: 'cv_test', convoy: true, from: 'haven', to: 'pharos', t0: S.time, par: 999, items: [], item: null, n: 0, likesMul: 1 };
  S.orders.active.push(o);
  S.convoy = { orderId: o.idNum, n: NPC.gen({ at: 'haven' }), x: gap.x, y: gap.y - 10, dir: Math.PI / 2, frozen: false, waiting: false, moving: false, crates: 3, sayCd: 0, stag: 0 };
  WL.tp([gap.x, gap.y + gap.dry + 60]); S.moveTo = null; Render.cam.x = S.px; Render.cam.y = S.py; WL.timeScale = 1;
  const c = S.convoy, s0 = __says.length; let maxStep = 0, rungs = false, last = [c.x, c.y], crossed = false;
  const t0 = performance.now();
  while (performance.now() - t0 < 12000) {
    await __frames(1); if (!S.convoy) break;
    maxStep = Math.max(maxStep, U.dist(last[0], last[1], c.x, c.y)); last = [c.x, c.y];
    if (Systems.crossingAt(c.x, c.y) === lad) rungs = true;
    if (c.y > gap.y + gap.dry) { crossed = true; break; }
  }
  const out = { gap, laid, crossed, rungs, maxStep: +maxStep.toFixed(1), saw: __says.slice(s0).includes('The ladder— I see it!'), at: [Math.round(c.x - gap.x), Math.round(c.y - gap.y)] };
  S.orders.active.splice(S.orders.active.indexOf(o), 1); S.convoy = null; S.structures.splice(S.structures.indexOf(lad), 1); WL.timeScale = 0.001;
  return out;
});
ok('THE ESCORT FINDS THE CROSSING (v3.31, the fairness pass: the junior is never warped to your back): a convoy junior wedged behind a cliff line from the Walker plans the crossing the Walker laid and walks it — onto the rungs and over, every stride a stride',
  !escort.none && escort.laid && escort.crossed && escort.rungs && escort.maxStep < 12, JSON.stringify(escort));

const comp = await ev(async () => {
  await __stage(520, 260, 2); WL.timeScale = 1;
  const n = NPC.gen({ at: 'haven', cls: 'courier' }); n.feeWaived = true; S.npcs.push(n); NPC.hire(n, 'companion');
  n.cx = S.px - 520; n.cy = S.py + 40; n.hustled = false;
  const s0 = __says.length; let last = [n.cx, n.cy], maxStep = 0, closed = null; const t0 = performance.now();
  while (performance.now() - t0 < 6000) { await __frames(1); maxStep = Math.max(maxStep, U.dist(last[0], last[1], n.cx, n.cy)); last = [n.cx, n.cy]; if (U.dist(n.cx, n.cy, S.px, S.py) < 70) { closed = +(performance.now() - t0).toFixed(0); break; } }
  const out = { closed, maxStep: +maxStep.toFixed(1), called: __says.slice(s0).includes('Wait— coming!') };
  n.state = 'pool'; WL.timeScale = 0.001;
  return out;
});
ok('THE COMPANION CATCHES UP (v3.31, the fairness pass: no teleport to your boots): a companion left five hundred units behind calls "Wait— coming!" and RUNS the gap shut on their own legs within seconds — every stride bounded, never a jump',
  comp.closed !== null && comp.closed < 5000 && comp.called && comp.maxStep < 60, JSON.stringify(comp));

/* ================= 7 · THE PUSHBACK, EARNED ================= */
await ev(() => {
  /* the wobble live — the calm flag the suites walk under is cleared here — and every roll the ground makes coming up, so what
     CAN ring, rings: a walk measured, not a coin tossed */
  window.__walkRoll = async (at, load, bal) => {
    WL.tp(at); S.moveTo = null; S.qte = null; S.stagger = 0; S.stam = S.stamMax; S.flags.calm = false; S.skills.bal.lv = bal;
    S.cargo = []; const it = State.makeItem('meds'); it.kg = Math.round(State.cap() * load); State.addCargo(it);
    const ld = +(State.weight() / State.cap()).toFixed(2), st0 = S.stats.steadies, mr = Math.random;
    WL.timeScale = 1; Systems.moveTo(S.px + 200, S.py); await __wait(250);
    const stam0 = S.stam; let ring = false, fired = 0;
    for (let k = 0; k < 3 && !ring; k++) {   // three single frames in which every roll the ground makes comes up
      Math.random = () => 1e-9; await __frames(1); Math.random = mr; fired++;
      for (let i = 0; i < 6; i++) { await __frames(1); if (S.qte) ring = true; }
    }
    Math.random = mr; const out = { load: ld, ring, steadies: S.stats.steadies - st0, stam: +(S.stam - stam0).toFixed(1), cls: World.classAt(S.px, S.py), fired };
    S.qte = null; UI.showQTE(false); S.moveTo = null; S.flags.calm = true; WL.timeScale = 0.001; S.cargo = [];
    return out;
  };
  window.__scree = (() => { for (let y = 3000; y < 10800; y += 20) for (let x = 400; x < 8000; x += 20) { let okr = true; for (let d = 0; d <= 220 && okr; d += 10) { const t = World.terrainAt(x + d, y); if (t.cls !== World.SCREE || t.blocked) okr = false; } if (okr && World.mistAt(x, y) < 0.5) return [x, y]; } return null; })();
  window.__meadow = [DATA.stations.haven.x + 520, DATA.stations.haven.y + 260];
});
r = await ev(async () => ({ meadow: await __walkRoll(__meadow, 0.5, 0), scree: __scree }));
ok('NO RING ON MASTERED GROUND: walking calm meadow at a sane load (under 62%) never wobbles at all — with every roll the ground could make coming up, not a ring and not so much as a steadying breath',
  r.meadow.load <= 0.62 && !r.meadow.ring && r.meadow.steadies === 0 && r.meadow.cls === 0, JSON.stringify(r));
const scree = await ev(async () => ({ bal6: await __walkRoll(__scree, 0.5, 6), bal0: await __walkRoll(__scree, 0.5, 0), need: 4 }));
ok('THE TRAINED BODY STEADIES ITSELF (v3.31, the fairness pass: the ring needs a reason): on scree at a sane load a body at Balance 6 — past the scree\'s own 4 — steadies itself, a breath of stamina, no ring; and since v3.31 even an untrained body at a sane load pays a breath there, never a ring',
  scree.bal6.cls === 2 && scree.bal6.load <= 0.62 && !scree.bal6.ring && scree.bal6.steadies > 0 && scree.bal6.stam < 0 && !scree.bal0.ring && scree.bal0.steadies > 0, JSON.stringify(scree));
const teeth = await ev(async () => ({ over: await __walkRoll(__scree, 1.5, 6) }));
ok('OVERLOAD KEEPS ITS TEETH: the ring is saved for beyond the kit — overloaded on the same scree even Balance 6 gets the steadying ring',
  teeth.over.load > 1 && teeth.over.ring, JSON.stringify(teeth));

const chain = await ev(async () => {
  /* a strung route, a failed ring: the stumble costs (the stagger, a crate on the ground) but the chain finishes itself */
  WL.tp(__scree); S.moveTo = null; S.qte = null; S.stagger = 0; S.flags.calm = false; S.skills.bal.lv = 0;
  S.cargo = S.cargo.filter(c => c.cat === 'tool'); const it = State.makeItem('meds'); it.kg = 80; State.addCargo(it);
  const x0 = S.px, dest1 = [S.px + 180, S.py], dest2 = [S.px + 180, S.py + 120];
  WL.timeScale = 1; Systems.moveTo(dest1[0], dest1[1]); Systems.queueMove(dest2[0], dest2[1]);
  const mr = Math.random; await __wait(250);
  let rang = false; for (let k = 0; k < 5 && !rang; k++) { Math.random = () => 1e-9; await __frames(1); Math.random = mr; for (let i = 0; i < 4; i++) { await __frames(1); if (S.qte) rang = true; } }
  Math.random = () => 0.99;   // the ring left to run out: nobody steadies it
  let stumbled = false; const t1 = performance.now(); while (performance.now() - t1 < 3000) { await __frames(1); if (S.stagger > 0) stumbled = true; if (stumbled && !S.stagger) break; }
  const dropped = S.drops.some(d => d.item === it), mid = { stumbled, moveTo: !!S.moveTo, route: (S.route || []).length };
  const t2 = performance.now(); while (performance.now() - t2 < 5000 && U.dist(S.px, S.py, dest2[0], dest2[1]) > 30) await __frames(2);
  Math.random = mr; S.flags.calm = true;
  const out = { rang, dropped, mid, arrived: U.dist(S.px, S.py, dest2[0], dest2[1]) <= 30, walked: Math.round(S.px - x0) };
  S.drops = S.drops.filter(d => d.item !== it); S.moveTo = null; WL.timeScale = 0.001;
  return out;
});
ok('THE STUMBLE SURVIVES THE CHAIN: a failed ring still costs — the stumble, the stagger, the overloaded crate on the ground — but it never cancels the strung route: the Walker gets up and walks both legs of it to the end',
  chain.rang && chain.mid.stumbled && chain.dropped && chain.mid.moveTo && chain.arrived, JSON.stringify(chain));

/* ================= 8 · THE VALLEY KEEPS WALKING ================= */
const tog = {};
tog.stored = await ev(() => { let o = {}; try { o = JSON.parse(localStorage.getItem('waylight.opts') || '{}'); } catch (e) {} return { opt: !!UI.opts.bgRun, stored: !!o.bgRun }; });
await ev(() => { WL.timeScale = 1; window.dispatchEvent(new Event('blur')); });
await page.waitForTimeout(300);
tog.blurOff = await ev(() => ({ paused: !document.getElementById('pause').classList.contains('hidden'), box: document.getElementById('ckBgRun').checked }));
await page.click('#ckBgRun'); await page.waitForTimeout(200);
tog.clicked = await ev(() => { let o = {}; try { o = JSON.parse(localStorage.getItem('waylight.opts') || '{}'); } catch (e) {} return { opt: !!UI.opts.bgRun, stored: !!o.bgRun }; });
tog.sheet = await ev(() => ({ sound: Snd.on, rainVol: Snd.rainVol, slider: +document.getElementById('rainSlider').value }));
await page.click('#resumeBtn'); await page.waitForTimeout(300);
tog.resumed = await ev(() => document.getElementById('pause').classList.contains('hidden'));
await ev(() => window.dispatchEvent(new Event('blur'))); await page.waitForTimeout(300);
tog.blurOn = await ev(() => !document.getElementById('pause').classList.contains('hidden'));
ok('THE TOGGLE, OFF BY DEFAULT: "keep walking when you switch away" sits unchecked on the pause sheet in a fresh browser, and with it off a blur still pauses (the old promise kept); checked (a real click) it is remembered in the browser, and a blur no longer stops the walk — the sheet\'s other settings standing as they were (the rain\'s own volume where its slider says)',
  !tog.stored.opt && !tog.stored.stored && tog.blurOff.paused && !tog.blurOff.box && tog.clicked.opt && tog.clicked.stored && tog.resumed && !tog.blurOn && tog.sheet.rainVol === tog.sheet.slider / 100, JSON.stringify(tog));

const hid = await ev(async () => {
  /* the window hidden: the background clock steps the walk, a quarter second at a time, and saves as it goes */
  await __stage(520, 260, 2); WL.timeScale = 1; S.flags.calm = true;
  S.cargo = S.cargo.filter(c => c.cat === 'tool');
  Systems.moveTo(S.px + 600, S.py); await __wait(200);
  localStorage.removeItem('waylight_save_v1');
  const hide = h => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => h }); document.dispatchEvent(new Event('visibilitychange')); };
  const x0 = S.px; hide(true);
  const saved = !!localStorage.getItem('waylight_save_v1');
  const steps = []; let lastX = S.px; const t0 = performance.now();
  while (performance.now() - t0 < 1600) { await __wait(50); if (S.px !== lastX) { steps.push(+(S.px - lastX).toFixed(1)); lastX = S.px; } }
  const hiddenWalked = Math.round(S.px - x0);
  /* hidden, overloaded on scree, every roll coming up: the wobble steadies itself — a ring nobody sees must never hang the walk */
  WL.tp(__scree); S.qte = null; S.flags.calm = false; S.skills.bal.lv = 0; const it = State.makeItem('meds'); it.kg = 80; State.addCargo(it);
  const st0 = S.stats.steadies; Systems.moveTo(S.px + 200, S.py); const mr = Math.random; Math.random = () => 0.001;
  let ring = false; const t1 = performance.now(); while (performance.now() - t1 < 1500) { await __wait(50); if (S.qte) ring = true; }
  Math.random = mr; const steadied = S.stats.steadies - st0;
  /* the return: walking the meadow again while still hidden (the background clock's quarter-second strides), then the window
     shown — the render loop takes the walk back: stepped frame by frame, the walk going on, no stride and no catch-up jump */
  S.qte = null; UI.showQTE(false); S.flags.calm = true; State.removeCargo(it.id);
  WL.tp([DATA.stations.haven.x + 520, DATA.stations.haven.y + 260]); S.moveTo = null; Systems.moveTo(S.px + 600, S.py);
  const bg = []; let hb = S.px; const t2 = performance.now();
  while (performance.now() - t2 < 900) { await __wait(50); if (S.px !== hb) { bg.push(+(S.px - hb).toFixed(1)); hb = S.px; } }
  hide(false);
  const back = []; let lb = S.px;
  for (let i = 0; i < 45; i++) { await __frames(1); back.push(+(S.px - lb).toFixed(2)); lb = S.px; }
  S.moveTo = null; delete document.hidden;
  return { hiddenWalked, steps: steps.slice(0, 6), quarter: steps.length >= 4 && steps.every(s2 => s2 > 10), saved, ring, steadied,
    bg, back: { frames: back.length, walking: back.filter(s2 => s2 > 0).length, max: Math.max(...back), first: back.slice(0, 5), hidden: !!document.hidden } };
});
ok('WALKING HIDDEN: with the toggle on, a hidden window hands the walk to the background clock — the Walker keeps walking the strung route in quarter-second strides while nobody watches, the valley saved the moment it hid, and the render loop takes it back on return (shown again mid-walk, the walk goes on stepped frame by frame — no quarter-second stride left, no catch-up jump)',
  hid.hiddenWalked > 80 && hid.quarter && hid.saved && hid.bg.filter(s2 => s2 > 10).length >= 2 && !hid.back.hidden && hid.back.walking >= 30 && hid.back.max < 10, JSON.stringify(hid));
ok('NO HIDDEN RINGS: a ring nobody sees must never hang the walk — hidden, overloaded on scree with every roll coming up, the wobble always steadies itself (a breath of stamina) and never rings',
  !hid.ring && hid.steadied > 0, JSON.stringify({ ring: hid.ring, steadied: hid.steadied }));
await ev(() => { window.__noWraith = false; UI.opts.bgRun = false; UI.saveOpts && UI.saveOpts(); });

/* ================= 9 · THE SAVE ================= */
r = await ev(() => {
  S.flags.unlocks.kit = true; WL.tool('kitTool'); S.banked.metal = 300; Systems.beginPlace('generator'); S.snowPack = 0.7;
  const hung = !!S.place;
  State.save();
  const raw = JSON.parse(localStorage.getItem(State.slot() === 1 ? 'waylight_save_v1' : `waylight_save_v1_s${State.slot()}`));
  const loaded = State.load();
  return { hung, savedPlace: raw.place, savedSnow: raw.snowPack, loaded, place: S.place, snow: S.snowPack };
});
ok('THE SAVE: a blueprint in hand is never saved (the ghost is stripped from the page and from the load), and the snow on the Walker\'s shoulders is — it rides the save with the porter',
  r.hung && r.savedPlace === null && r.savedSnow === 0.7 && r.loaded && r.place === null && r.snow === 0.7, JSON.stringify(r));

await T.finish('the body');
