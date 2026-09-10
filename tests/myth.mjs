/* myth.mjs — v3.23 THE MYTH IN THE FLESH: the legend the world cites from the record, micro-cines
   capped at one slow zoom, the over-produced handoff parody, the coat that is YOURS (creator,
   tailor, equip sheet), and the breath the research taught the idle. */
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
await page.click('#briefGo'); await page.waitForTimeout(300);

/* ---------- the coat is cut at the enlistment desk ---------- */
let r = await page.evaluate(() => {
  const rows = document.querySelectorAll('#cgLookRows .lookRow').length;
  const sw = document.querySelectorAll('#cgLookRows .lsw').length;
  const rig0 = document.getElementById('cgRig').src;
  document.querySelector('[data-look="coat:2"]').click();
  document.querySelector('[data-look="trim:1"]').click();
  document.querySelector('[data-look="skin:3"]').click();
  const rig1 = document.getElementById('cgRig').src;
  return { rows, sw, preview: rig0.length > 60, changed: rig0 !== rig1 };
});
ok('the enlistment form cuts the coat — four swatch rows, a LIVE rig that changes as you choose', r.rows === 4 && r.sw >= 24 && r.preview && r.changed, JSON.stringify(r));
await page.click('#cgBegin'); await page.waitForTimeout(600);
const ev = fn => page.evaluate(fn);
await ev(() => {
  S.weather.state = 'clear'; S.weather.t = 99999;
  for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine();
  S.flags.guideDone = true; S.orders.prioIdx = 99; WL.calm();
});
r = await ev(() => ({ C: S.look && S.look.C, S2: S.look && S.look.S, worn: Render.wornPal().C, skin: Render.wornPal().S }));
ok('the chosen coat WALKS — the world rig wears the picked colours, skin included', r.C === '#7a4432' && r.worn === '#7a4432' && r.S2 === r.skin, JSON.stringify(r));

/* ---------- the idle BREATHES (research: shading drift, silhouette untouched) ---------- */
r = await ev(() => {
  const pal = Render.wornPal();
  const a = document.createElement('canvas'), b2 = document.createElement('canvas');
  a.width = b2.width = 12; a.height = b2.height = 18;
  // pull both frames through the cache
  const g1 = a.getContext('2d'); g1.drawImage((() => { const s2 = Render.rigPreviewURL(pal, 1, 'idle'); const i2 = new Image(); i2.src = s2; return i2; })(), 0, 0);
  return { urlsDiffer: Render.rigPreviewURL(pal, 1, 'idle') !== Render.rigPreviewURL(pal, 1, 'idle2') };
});
ok('idle and idle2 are different pictures', r.urlsDiffer, JSON.stringify(r));
r = await ev(async () => {
  // silhouette law: decode both frames, compare alpha masks and interiors
  const pal = Render.wornPal();
  const load = url => new Promise(res => { const i2 = new Image(); i2.onload = () => res(i2); i2.src = url; });
  const A = await load(Render.rigPreviewURL(pal, 1, 'idle')), B = await load(Render.rigPreviewURL(pal, 1, 'idle2'));
  const px2 = img => { const c = document.createElement('canvas'); c.width = 12; c.height = 18; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, 12, 18).data; };
  const da = px2(A), db = px2(B);
  let silDiff = 0, inDiff = 0;
  for (let i = 0; i < da.length; i += 4) {
    const oa = da[i + 3] > 0, ob = db[i + 3] > 0;
    if (oa !== ob) silDiff++;
    else if (oa && (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2])) inDiff++;
  }
  return { silDiff, inDiff };
});
ok('the BREATH moves shading only — silhouette identical to the texel, interior clusters drift', r.silDiff === 0 && r.inDiff >= 4, JSON.stringify(r));

/* ---------- the legend ladder & the record-cited lines ---------- */
r = await ev(() => {
  const t0 = (S.level = 1, Myth.tier());
  const t1 = (S.level = 5, Myth.tier());
  const t3 = (S.level = 11, Myth.tier());
  S.level = 1;
  S.stations.haven.stars = 3; S.stats.delivered = 40;
  const seen = new Set();
  for (let i = 0; i < 60; i++) seen.add(Myth.mythLine('haven'));
  const cites = [...seen].some(l => /3 stars/.test(l)) && [...seen].some(l => /40 deliveries/.test(l)) && [...seen].some(l => /UNLIT/.test(l));
  S.stations.haven.stars = 0; S.stats.delivered = 0;
  return { t0, t1, t3, variants: seen.size, cites };
});
ok('legend tiers climb with the record — and bystander lines CITE it: the stars, the count, the unlit days', r.t0 === 0 && r.t1 === 1 && r.t3 === 3 && r.variants >= 4 && r.cites, JSON.stringify(r));

/* ---------- the micro-cine: one slow zoom, one line, release ---------- */
r = await ev(() => {
  const began = Myth.microCine(S.px + 60, S.py, 'It is HIM.');
  return { began, letterbox: document.body.classList.contains('cine'), capped: S.mcine.dur <= 2.2 };
});
ok('a micro-cine opens the letterbox and is CAPPED at the slow-zoom length', r.began && r.letterbox && r.capped, JSON.stringify(r));
await page.waitForTimeout(1300);
r = await ev(() => ({ z: +Render.cam.z.toFixed(2), said: S.mcine && S.mcine.said }));
ok('the camera performs ONE slow zoom while the first line lands', r.z > 1.2 && r.said, JSON.stringify(r));
await page.waitForTimeout(1300);
r = await ev(() => ({ released: !S.mcine, letterbox: document.body.classList.contains('cine') }));
ok('and releases on its own — gameplay never waits on dialogue', r.released && !r.letterbox, JSON.stringify(r));
r = await ev(() => { Myth.microCine(S.px, S.py, 'skip me'); const s2 = Myth.skip(); return { skipped: s2, gone: !S.mcine, box: document.body.classList.contains('cine') }; });
ok('any input SKIPS a micro-cine instantly', r.skipped && r.gone && !r.box, JSON.stringify(r));

/* ---------- the yard notices ---------- */
r = await ev(() => {
  S.level = 8; S.flags.mythSeen = 2;   // tier already seen: this is the ambient reaction path
  const d = DATA.stations.haven;
  WL.tp([d.x + 60, d.y + 40]); S.moveTo = null;
  for (let i = 0; i < 8; i++) Myth.tick(0.25);
  const say = S.mythSay && S.mythSay.stId === 'haven';
  const newTier = (S.level = 11, Myth.tick(0.25), !!S.mcine || S.flags.mythSeen === 3);
  Myth.skip(); S.mythSay = null;
  return { say, newTier, prefix2: Myth.legendPrefix('haven').length > 0, prefix0: (S.level = 2, Myth.legendPrefix('haven')) === '' };
});
ok('a lit yard STOPS and speaks at tier 1+ — and a NEW tier\'s first yard earns the zoom; keepers bend their hellos at tier 2+', r.say && r.newTier && r.prefix2 && r.prefix0, JSON.stringify(r));

/* ---------- THE HANDOFF: the famous scene, once per town ---------- */
r = await ev(() => {
  S.level = 5; S.flags.unlocks.horse = true;
  S.horse = { loaner: true, on: true, spookT: 0, breed: 'mustang' };
  S.orders.active.push({ idNum: 888, item: 'letters', to: 'mill', items: [], t0: S.time, par: 999 });
  const d = DATA.stations.mill;
  const ang = Math.PI;   // approach from the east
  WL.tp([d.x + 380, d.y]); S.moveTo = null; S.dir = ang;
  Myth.tick(0.2);
  const h = S.handoff;
  return { began: !!h, p0: h && h.phase, town: h && h.town, slow: S.timeScale === 0.25, letterbox: document.body.classList.contains('cine'), once: S.flags.handoffs && S.flags.handoffs.mill };
});
ok('letters aboard, mounted, first time near the town — THE SCENE begins on the WIDE cut: quarter speed, letterbox down', r.began && r.p0 === 0 && r.town === 'mill' && r.slow && r.letterbox && r.once, JSON.stringify(r));
r = await ev(() => {
  const t0 = S.time;
  return new Promise(res => setTimeout(() => res({ dtWorld: +(S.time - t0).toFixed(2) }), 1000));
});
ok('the WORLD truly crawls beneath it — a real second passes, the valley moves a quarter of one', r.dtWorld > 0.1 && r.dtWorld < 0.45, JSON.stringify(r));
r = await ev(async () => {
  // run the scene to the pass and through release on real frames
  let phases = new Set();
  for (let i = 0; i < 46 && S.handoff; i++) { phases.add(S.handoff.phase); await new Promise(res => setTimeout(res, 100)); }
  return { phases: [...phases], done: !S.handoff, ts: S.timeScale, appr: (S.stations.mill.appr || 0) >= 3, mail: S.mails.some(m => /mother at The Mill/.test(m.subj)) };
});
ok('the cuts advance to the SUPER ZOOM — the pass fires, and the road releases with the town talking', r.phases.includes(2) && r.done && r.ts === 1 && r.appr && r.mail, JSON.stringify(r));
r = await ev(() => {
  // never twice: same approach, no scene
  const d = DATA.stations.mill;
  WL.tp([d.x + 380, d.y]); S.moveTo = null;
  Myth.tick(0.2);
  const again = !!S.handoff;
  // a second town still gets ITS first
  S.orders.active.push({ idNum: 889, item: 'letters', to: 'quarry', items: [], t0: S.time, par: 999 });
  const q = DATA.stations.quarry;
  WL.tp([q.x + 380, q.y]); S.moveTo = null;
  Myth.tick(0.2);
  const second = !!S.handoff;
  const skipped = Myth.skip();
  return { again, second, skipped, released: !S.handoff && S.timeScale === 1 };
});
ok('the scene plays ONCE per town — a new town gets its own, and any input skips straight to the road', !r.again && r.second && r.skipped && r.released, JSON.stringify(r));

/* ---------- the tailor & the equip sheet ---------- */
r = await ev(() => {
  const d = DATA.stations.haven;
  WL.tp([d.x + 40, d.y]); S.moveTo = null;
  const act = Systems.getInteractions().some(a => /tailor/.test(a.label));
  UI2.openTailor();
  const open = !document.getElementById('tailorOv').classList.contains('hidden');
  document.querySelector('#tailorRows [data-look="coat:5"]').click();
  const recut = S.look.C === '#26202e';
  document.getElementById('tailorDone').click();
  return { act, open, recut, closed: document.getElementById('tailorOv').classList.contains('hidden') };
});
ok('the TAILOR waits at any lit terminal — recut live on the rig, walk it out', r.act && r.open && r.recut && r.closed, JSON.stringify(r));
r = await ev(() => {
  State.addCargo(State.makeItem('boots_tread'));
  UI2.toggleSkills(true);
  const doll = document.getElementById('skillsDoll');
  const img = doll && doll.querySelector('#dollRig');
  const slots = doll ? doll.querySelectorAll('.equipRow').length : 0;
  const btn = doll && doll.querySelector('[data-dollwear]');
  const b0 = S.equip.boots.defId;
  btn && btn.click();
  const worn = S.equip.boots.defId;
  const tailorBtn = !!document.getElementById('dollTailor');
  UI2.toggleSkills(false);
  return { doll: !!doll, img: !!img && img.src.length > 60, slots, swapped: b0 !== worn && worn === 'boots_tread', tailorBtn };
});
ok('the EQUIP SHEET stands the walker up — live paperdoll, four slots, one-click wear, the tailor a step away', r.doll && r.img && r.slots === 4 && r.swapped && r.tailorBtn, JSON.stringify(r));

/* ---------- it all survives, and the scenes never haunt a save ---------- */
r = await ev(() => { State.save(); const raw = JSON.parse(localStorage.getItem('waylight_save_v1')); return { look: raw.look && raw.look.C === '#26202e', clean: !raw.handoff && !raw.mcine && raw.timeScale === 1, onceKept: raw.flags.handoffs && raw.flags.handoffs.mill }; });
ok('the cut coat and the once-per-town ledger ride the save; the scenes themselves never do', r.look && r.clean && r.onceKept, JSON.stringify(r));
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.click('#btnContinue'); await page.waitForTimeout(900);
r = await ev(() => ({ look: S.look && S.look.C === '#26202e', worn: Render.wornPal().C === '#26202e' || !!(S.equip.coat && S.equip.coat.defId !== 'coat0'), ts: S.timeScale === 1 }));
ok('after reload the coat is still yours and time runs true', r.look && r.ts, JSON.stringify(r));

ok('no page errors across the whole suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log('\n=== MYTH (v3.23: the legend cited from the record · micro-cines · THE HANDOFF · the coat that is yours) ===');
for (const line of results) console.log(line);
console.log(`${results.filter(x => x.startsWith('PASS')).length}/${results.length} passed`);
await b.close();
