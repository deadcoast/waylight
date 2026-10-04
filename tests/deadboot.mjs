/* deadboot.mjs — v3.28b THE DEAD BOOT LAW (v3.51 rebuild, mine: re-authored from its record in DESIGN.md — the v3.48 source
   was lost; its figures sampled on the courier's grid). On the player's own page (waylight.html, no debug flag): a death is
   COMMITTED the moment it happens (die() stores the certificate's facts on the save and writes it at once — a tab closed
   without its unload handlers brings the death back byte for byte); a dead save boots INTO the Death certificate with the
   committed facts, an older dead save without them gets the honest fallback ("the road took them between saves"); the save
   as it stood is stashed whole in the backup slot before load() reads a byte (an unreadable page too); the certificate hands
   off to New character and the next walker takes the valley EXACTLY as it was left (likes, structures, graves, legacy, bank,
   mails), and the boots are live after (a real click on the ground walks, a real key walks); the watchdog presents the
   ceremony to a zombie world within ~2s; the ESC menu's diagnostic line names the gates holding the boots and reads free
   when none do; the release (v3.49: Unstick) frees a stranded scene, a ring, a slowed clock, a stuck sheet and the pause with
   a real click and deletes nothing, and meeting a committed death it shows the certificate instead of releasing it; a fault
   firing every frame pins a chip that spells the diagnosis; and the type ledger (v3.28c: the attic corrected) keeps a type
   this build does not know as a real, visible, inert unmapped object, walks a renamed type forward, drains the old attic back
   into the world, and hands the object back to itself the moment a build that knows it loads the save. */
import { boot } from './lib/harness.mjs';

const T = await boot({ player: true });
const { ok } = T;
const page = T.page;
const ev = (fn, arg) => page.evaluate(fn, arg);

/* the player's page has no debug hooks: it is ready when the valley is baked (the title's drift loaded), and its scenes are
   finished through the same engine calls the skip key makes */
const ready = async () => {
  await page.waitForFunction(() => typeof S !== 'undefined' && S !== null && typeof UI !== 'undefined' && !!document.getElementById('btnNew'), null, { timeout: 90000 });
  await page.waitForTimeout(400);
  await T.instruments();
};
const skipScenes = async () => {
  for (let i = 0; i < 30; i++) {
    const c = await ev(() => !!(S.cine || S.mcine || S.handoff || S.cineSeq)); if (!c) break;
    await ev(() => { Systems.finishCine(); Cine.skip(); }); await page.waitForTimeout(250);
  }
};
const calm = () => ev(() => {
  S.flags.guideDone = true; S.flags.calm = true; S.flags.torchCross = S.flags.torchSeen = S.flags.torchNamed = true; S.flags.mythSeen = 9;
  S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true;
  if (S.rep && S.rep.evCd) for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999;
});
const vis = id => ev(id => !document.getElementById(id).classList.contains('hidden'), id);
/* ALT-F4: the tab dies without its unload handlers getting a last save in (the page's save is cut off first, as a killed
   window's is) and the page is opened again */
const altF4 = async () => {
  await ev(() => { State.save = () => false; });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await ready();
};
/* the valley's ledger, as the save and the next walker must keep it */
const ledgerOf = () => ev(() => ({
  likes: S.likes, level: S.level, banked: { ...S.banked },
  structures: S.structures.map(s => [s.id, s.type, Math.round(s.x), Math.round(s.y), s.box ? s.box.map(c => c.id) : null]),
  graves: S.graves.map(g => [g.id, g.name, (g.items || []).length]),
  legacy: JSON.stringify(S.legacy), echo: S.echoRoster.slice(),
  mails: S.mails.map(m => m.subj), lit: Object.keys(S.stations).filter(k => S.stations[k].connected),
  roads: JSON.stringify(S.roads), stats: { ...S.stats },
}));

await ready();
await T.newGame(); await skipScenes(); await calm();

/* ================= 1 · THE COMMIT ================= */
/* a valley with a history: likes earned, a PO box built by the kit's own path, a letter kept — then the walker falls */
let r = await ev(() => {
  const H = DATA.stations.haven;
  S.px = H.x + 150; S.py = H.y + 120;
  State.grantLikes(137);
  State.addCargo(State.makeItem('kitTool'));
  const built = Systems.tryBuild('pobox');
  const box = S.structures.find(x => x.type === 'pobox');
  State.addCargo(State.makeItem('relic_photo'));
  const boxed = !!box && Systems.poboxStash(box) && box.box.some(c => c.defId === 'relic_photo');   // the loose things on the back boxed on the road — a photograph among them — before the fall
  Systems.addMail('deadboot: the letter the valley keeps', 'A word left in the register before the road.');
  State.save();
  const before = localStorage.getItem('waylight_save_v1');
  const name = S.pName, cls = CHAR.CLASSES[S.pClass].name;
  Porter.die('bleed');   // one synchronous step: whatever the save holds after it, die() wrote
  const raw = localStorage.getItem('waylight_save_v1'), j = JSON.parse(raw), j0 = JSON.parse(before);
  const di = j.deadInfo || {};
  return {
    built, boxed, name, cls, wasAlive: j0.dead === false, dead: S.dead === true && j.dead === true,
    facts: di.name === name && di.cls === cls && di.cause === 'bled out on the road' && di.seed === S.pSeed && !!di.stats && di.stats.deliveries === S.pStats.deliveries && di.wraith === false,
    sameFacts: JSON.stringify(di) === JSON.stringify(S.deadInfo), raw, savedAfter: j.savedAt >= j0.savedAt, legacyRow: j.legacy.length === j0.legacy.length + 1, grave: j.graves.length === j0.graves.length + 1,
  };
});
const R1 = r.raw, who = { name: r.name, cls: r.cls };
delete r.raw;
ok('THE COMMIT: a death is committed the moment it happens — Porter.die() stores the certificate\'s facts on the save (deadInfo: the name, the class, the cause, the seed, the numbers) and writes the save in the same step: the save that held a living walker holds a dead one with the facts, the grave and the stone\'s row, before anything else runs',
  r.built && r.boxed && r.wasAlive && r.dead && r.facts && r.sameFacts && r.savedAfter && r.legacyRow && r.grave, JSON.stringify(r));

/* ================= 2 · THE CERTIFICATE AT THE FALL ================= */
const px0 = await ev(() => ({ x: S.px, y: S.py }));
await page.keyboard.down('KeyD'); await page.waitForTimeout(450); await page.keyboard.up('KeyD');
r = await ev(({ name, cls, px0 }) => ({
  shown: !document.getElementById('deathOv').classList.contains('hidden'),
  title: document.querySelector('#deathOv h2').textContent.trim(),
  nameLine: document.getElementById('deathName').textContent, cause: document.getElementById('deathCause').textContent,
  gates: UI.gateReport(), held: Math.hypot(S.px - px0.x, S.py - px0.y) < 0.5, want: `${name} fell.`, wantCause: `${cls} · bled out on the road`,
}), { ...who, px0 });
ok('THE CERTIFICATE AT THE FALL: the Death certificate (v3.49: the plain names) is on screen the moment the walker falls — the name, "Taken by" the class and the cause — and the world is held behind it: the gates name the committed death, and a real key held on the keyboard walks nobody',
  r.shown && r.title === 'Death certificate' && r.nameLine === r.want && r.cause === r.wantCause && r.gates.includes('a committed death (the certificate is owed)') && r.held, JSON.stringify(r));

/* ================= 3 · NO ALT-F4 RESURRECTION ================= */
await altF4();
r = await ev(() => {
  const si = State.slotInfo(1);
  return { raw: localStorage.getItem('waylight_save_v1'), plate: { dead: si.dead, name: si.name }, cont: !document.getElementById('btnContinue').classList.contains('hidden'), title: !document.getElementById('titleScreen').classList.contains('hidden'), driftDead: S.dead === true };
});
ok('NO ALT-F4 RESURRECTION: the tab killed with no last save on the way out and opened again — the save in the slot is byte for byte the one die() committed (nothing after it was needed), the title offers Continue, the slot\'s plate reads the walker dead, and the title\'s drift loads a dead walker',
  r.raw === R1 && r.plate.dead === true && r.plate.name === who.name && r.cont && r.title && r.driftDead, JSON.stringify({ ...r, raw: r.raw === R1 ? 'identical' : `differs (${(r.raw || '').length} vs ${R1.length} bytes)` }));

/* ================= 4 · THE DEAD BOOT ================= */
await page.click('#btnContinue'); await page.waitForTimeout(700);
r = await ev(({ name, cls }) => ({
  cert: !document.getElementById('deathOv').classList.contains('hidden'), chargen: !document.getElementById('chargen').classList.contains('hidden'),
  hud: !document.getElementById('hud').classList.contains('hidden'),
  nameLine: document.getElementById('deathName').textContent, cause: document.getElementById('deathCause').textContent,
  facts: document.getElementById('deathName').textContent === `${name} fell.` && document.getElementById('deathCause').textContent === `${cls} · bled out on the road`,
  dead: S.dead, gates: UI.gateReport(),
}), who);
ok('THE DEAD BOOT: Continue on a save carrying a committed death boots INTO the Death certificate with the committed facts (the name, the class, the cause) — never a zombie world with its boots nailed down: the certificate is the thing on screen, char-gen waits behind it',
  r.cert && !r.chargen && r.facts && r.dead === true && r.gates.includes('the death sheet'), JSON.stringify(r));

/* ================= 5 · THE FALLBACK ================= */
const R2 = await ev(raw => { const j = JSON.parse(raw); delete j.deadInfo; const s = JSON.stringify(j); localStorage.setItem('waylight_save_v1', s); return s; }, R1);   // a dead save from a build before the commit: dead, no facts
await altF4();
await page.click('#btnContinue'); await page.waitForTimeout(700);
r = await ev(({ name, cls }) => ({
  cert: !document.getElementById('deathOv').classList.contains('hidden'),
  nameLine: document.getElementById('deathName').textContent, cause: document.getElementById('deathCause').textContent,
  ok2: document.getElementById('deathName').textContent === `${name} fell.` && document.getElementById('deathCause').textContent === `${cls} · the road took them between saves`,
  info: S.deadInfo || null,
}), who);
ok('THE FALLBACK: an older dead save that lacks the certificate\'s facts still boots into the certificate, honestly — the walker\'s own name and class from the save, and the cause as "the road took them between saves"',
  r.cert && r.ok2 && !r.info, JSON.stringify(r));

/* ================= 6 · THE BACKUP SLOT ================= */
r = await ev(() => {
  const bak = localStorage.getItem('waylight_save_v1_bak');
  /* an unreadable page in the third valley: load() cannot read it, and still keeps it whole before it tries */
  State.setSlot(3);
  localStorage.setItem('waylight_save_v1_s3', '{"v":3,"a page the ink ran on');
  const loaded = State.load(), bak3 = localStorage.getItem('waylight_save_v1_s3_bak'), live3 = localStorage.getItem('waylight_save_v1_s3');
  localStorage.removeItem('waylight_save_v1_s3'); localStorage.removeItem('waylight_save_v1_s3_bak');
  State.setSlot(1);
  return { bak, loaded, bak3, live3, slot: State.slot(), stillDead: S.dead === true };
});
ok('THE BACKUP SLOT — the no-purge law: before load() reads a byte, the save as it stood is stashed whole in waylight_save_v1_bak (byte for byte the dead save this boot read); a page load() cannot read at all is stashed whole too before it refuses it, and the slot keeps it untouched',
  r.bak === R2 && r.loaded === false && r.bak3 === '{"v":3,"a page the ink ran on' && r.live3 === r.bak3 && r.slot === 1 && r.stillDead, JSON.stringify({ ...r, bak: r.bak === R2 ? 'identical' : 'differs' }));

/* ================= 7 · THE HANDOFF ================= */
await page.click('#deathContinue'); await page.waitForTimeout(500);
const cgUp = await ev(() => ({ chargen: !document.getElementById('chargen').classList.contains('hidden'), cert: !document.getElementById('deathOv').classList.contains('hidden'), title: document.querySelector('#chargen h2') ? document.querySelector('#chargen h2').textContent.trim() : '' }));
await page.click('#cgBegin'); await page.waitForTimeout(900);
await skipScenes(); await calm();
r = await ev(name => {
  const j = JSON.parse(localStorage.getItem('waylight_save_v1'));
  return { dead: S.dead, info: S.deadInfo, newName: S.pName, other: S.pName !== name, saved: j.dead === false && j.deadInfo === null, gates: UI.gateReport(), hud: !document.getElementById('hud').classList.contains('hidden') };
}, who.name);
ok('THE HANDOFF: the certificate\'s Continue hands off to New character (v3.49: the plain names), and Start makes the next walker — the death is spent (not dead, no certificate owed, the save says so), a new name carries the coat, and nothing holds the boots',
  cgUp.chargen && !cgUp.cert && /New character/i.test(cgUp.title) && r.dead === false && r.info === null && r.saved && r.gates.length === 0 && r.hud, JSON.stringify({ cgUp, ...r }));

/* ================= 8 · VALLEY CONTINUITY ================= */
const L1 = (() => { const j = JSON.parse(R1); return {
  likes: j.likes, level: j.level, banked: j.banked, structures: j.structures.map(s => [s.id, s.type, Math.round(s.x), Math.round(s.y), s.box ? s.box.map(c => c.id) : null]),
  graves: j.graves.map(g => [g.id, g.name, (g.items || []).length]), legacy: JSON.stringify(j.legacy), echo: j.echoRoster,
  mails: j.mails.map(m => m.subj), lit: Object.keys(j.stations).filter(k => j.stations[k].connected), roads: JSON.stringify(j.roads), stats: j.stats,
}; })();
const L2 = await ledgerOf();
const same = k => JSON.stringify(L1[k]) === JSON.stringify(L2[k]);
const cont = Object.fromEntries(Object.keys(L1).map(k => [k, same(k)]));
/* what the fallen boxed on the road waits there for the next walker, who takes it back */
const took = await ev(() => { const box = S.structures.find(x => x.type === 'pobox'); const ok2 = Systems.poboxTake(box); return { ok: ok2, onBack: S.cargo.some(c => c.defId === 'relic_photo'), empty: box.box.length === 0 }; });
ok('VALLEY CONTINUITY: the next walker takes the valley EXACTLY as it was left — the likes and the level, the bank, every structure (the PO box where it was built, the photograph the fallen boxed still in it — the next walker takes it back out), every grave (the fallen\'s own with what they carried), the legacy rows, the echo roster, the mails, the lit towns, the roads and the valley\'s tallies, each equal to the save the death committed',
  Object.values(cont).every(Boolean) && L2.structures.some(s => s[1] === 'pobox' && s[4] && s[4].length >= 1) && took.ok && took.onBack && took.empty && L2.graves.some(g => g[1] === who.name) && JSON.parse(L2.legacy).some(l => l.name === who.name && l.fate === 'bled out on the road'),
  JSON.stringify({ cont, took, likes: L2.likes, structures: L2.structures.length, graves: L2.graves.length }));

/* ================= 9 · LIVE BOOTS — THE CLICK ================= */
const aim = await ev(() => {
  const out = [];
  for (const [dx, dy] of [[170, 0], [0, 170], [-170, 0], [0, -170], [120, 120], [-120, 120]]) {
    const x = S.px + dx, y = S.py + dy;
    let open = true; for (let f = 0.1; f <= 1.001; f += 0.1) { const t = World.terrainAt(S.px + dx * f, S.py + dy * f); if (t.blocked || t.water) open = false; }
    if (open) out.push({ x, y, dx, dy });
  }
  const a = out[0]; if (!a) return null;
  const p = __toScr(a.x, a.y);
  return { ...a, sx: p.x, sy: p.y, from: { x: S.px, y: S.py }, d0: Math.hypot(a.x - S.px, a.y - S.py) };
});
await page.mouse.click(aim.sx, aim.sy);
await page.waitForTimeout(1600);
r = await ev(aim => ({ d1: Math.hypot(aim.x - S.px, aim.y - S.py), moved: Math.hypot(S.px - aim.from.x, S.py - aim.from.y), dead: S.dead }), aim);
ok('LIVE BOOTS — THE CLICK: after the handoff a real click on the ground (the canvas, at the screen point over open ground) walks the new walker toward it — the click-to-move gate the zombie world had shut is open',
  !!aim && r.moved > 40 && r.d1 < aim.d0 - 40 && !r.dead, JSON.stringify({ aim: aim && { dx: aim.dx, dy: aim.dy, d0: Math.round(aim.d0) }, d1: Math.round(r.d1), moved: Math.round(r.moved) }));

/* ================= 10 · LIVE BOOTS — THE KEYS ================= */
const keyPick = await ev(() => {
  const K = [['KeyD', 1, 0], ['KeyS', 0, 1], ['KeyA', -1, 0], ['KeyW', 0, -1]];
  S.moveTo = null; S.route = [];
  for (const [k, dx, dy] of K) { let open = true; for (let d = 20; d <= 120; d += 20) { const x = S.px + dx * d, y = S.py + dy * d, t = World.terrainAt(x, y); if (t.blocked || t.water) open = false; } if (open) return { k, dx, dy, x: S.px, y: S.py }; }
  return null;
});
await page.waitForTimeout(300);
const k0 = await ev(() => ({ x: S.px, y: S.py }));
await page.keyboard.down(keyPick.k); await page.waitForTimeout(900); await page.keyboard.up(keyPick.k);
r = await ev(({ k0, kp }) => ({ along: (S.px - k0.x) * kp.dx + (S.py - k0.y) * kp.dy }), { k0, kp: keyPick });
ok('LIVE BOOTS — THE KEYS: a real key held on the keyboard (WASD) walks the new walker along its heading — the sim is stepping again, the gate the committed death held is open',
  !!keyPick && r.along > 25, JSON.stringify({ key: keyPick && keyPick.k, along: Math.round(r.along) }));

/* ================= 11 · THE WATCHDOG HEAL ================= */
/* a zombie world as the old death-screen auto-save left it: dead, no facts, no certificate on screen */
/* measured on the game's own clock (every frame's step, capped as the loop caps it) and on the wall's */
const heal = await ev(() => new Promise(res => {
  S.dead = true; S.deadInfo = null;
  const t0 = performance.now(); let game = 0, last = t0, frames = 0;
  const f = now => { game += Math.min(0.08, (now - last) / 1000); last = now; frames++; if (!document.getElementById('deathOv').classList.contains('hidden')) return res({ game: +game.toFixed(2), wallMs: Math.round(now - t0), frames }); if (performance.now() - t0 > 20000) return res({ game: -1, wallMs: -1, frames }); requestAnimationFrame(f); };
  requestAnimationFrame(f);
}));
r = await ev(() => ({ cause: document.getElementById('deathCause').textContent, name: document.getElementById('deathName').textContent, pn: S.pName }));
ok('THE WATCHDOG HEAL: a zombie world (a dead walker, no certificate on screen) is presented the ceremony by the watchdog within ~2s of the game\'s clock — the Death certificate, with the honest fallback when the facts were never written',
  heal.game >= 0 && heal.game <= 2.0 && r.name === `${r.pn} fell.` && /the road took them between saves/.test(r.cause), JSON.stringify({ heal, ...r }));
await page.click('#deathContinue'); await page.waitForTimeout(400); await page.click('#cgBegin'); await page.waitForTimeout(900); await skipScenes(); await calm();

/* ================= 12 · THE DIAG LINE — HELD ================= */
await ev(() => { S.cineSeq = true; S.timeScale = 0.35; });   // a scene stranded with no shot list, and its slowed clock
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
r = await ev(() => ({ pause: !document.getElementById('pause').classList.contains('hidden'), diag: document.getElementById('pauseDiag').textContent, row: [...document.querySelectorAll('#pause .setRow')].map(x => x.textContent).find(t => /Unstick/.test(t)) || '' }));
ok('THE DIAG LINE — HELD: the ESC menu (a real Escape), the one surface that always answers, carries a live diagnostic line naming every gate holding the boots right now — "boots: held by a scene · a slowed clock" for a stranded scene and its clock',
  r.pause && r.diag === 'boots: held by a scene · a slowed clock', JSON.stringify(r));

/* ================= 13 · THE RELEASE ================= */
await ev(() => {
  S.qte = { t: 0, dur: 99 };                                          // a steady-ring nobody can answer
  UI.openStation('haven');                                            // a sheet left standing under the menu
});
const beforeRelease = await ledgerOf();
const saveBefore = await ev(() => localStorage.getItem('waylight_save_v1'));
await page.click('#unstickBtn'); await page.waitForTimeout(400);
r = await ev(() => ({
  scene: !!(S.cineSeq || S.cine || S.mcine || S.handoff), qte: !!S.qte, clock: S.timeScale, pause: !document.getElementById('pause').classList.contains('hidden'),
  station: !document.getElementById('stationOv').classList.contains('hidden'), gates: UI.gateReport(), modal: UI.anyModal(),
  toast: [...document.querySelectorAll('#toasts > *')].map(t => t.textContent).find(t => /Boots freed/.test(t)) || '',
  btn: document.getElementById('unstickBtn').textContent.trim(),
}));
ok('THE RELEASE (v3.49: the plain names — Free my boots is Unstick, its button Release): a real click in the ESC menu releases the stuck transient state — the stranded scene, the steady-ring, the slowed clock, the sheet left standing and the pause — every sheet closed, nothing left holding the boots, and the notice names what it freed',
  !r.scene && !r.qte && r.clock === 1 && !r.pause && !r.station && r.gates.length === 0 && !r.modal && /released: .*steady-ring.*scene.*clock/.test(r.toast) && r.btn === 'Release', JSON.stringify(r));

/* ================= 14 · THE NO-DELETION PROOF ================= */
const afterRelease = await ledgerOf();
const saveAfter = await ev(() => localStorage.getItem('waylight_save_v1'));
const keep = Object.fromEntries(Object.keys(beforeRelease).map(k => [k, JSON.stringify(beforeRelease[k]) === JSON.stringify(afterRelease[k])]));
ok('THE NO-DELETION PROOF: the release deletes nothing — every ledger line is the same after it as before (the likes, the bank, the structures, the graves, the legacy, the roster, the mails, the lit towns, the roads, the tallies) and the save it never wrote is byte for byte the one before',
  Object.values(keep).every(Boolean) && saveAfter === saveBefore, JSON.stringify({ keep, save: saveAfter === saveBefore }));

/* ================= 15 · THE DIAG LINE — FREE ================= */
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
r = await ev(() => ({ pause: !document.getElementById('pause').classList.contains('hidden'), diag: document.getElementById('pauseDiag').textContent }));
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
const resumed = await ev(() => document.getElementById('pause').classList.contains('hidden'));
ok('THE DIAG LINE — FREE: with the boots released, the ESC menu\'s line reads "boots: free — the road answers", and Escape again resumes the walk',
  r.pause && r.diag === 'boots: free — the road answers' && resumed, JSON.stringify({ ...r, resumed }));

/* ================= 16 · THE RELEASE MEETS A DEATH ================= */
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
/* the watchdog would present the certificate on its own within its beat: the test waits for a beat to pass (a sheet with
   nobody home is folded by it) and clicks inside the next one */
await ev(() => document.getElementById('stationOv').classList.remove('hidden'));
for (let i = 0; i < 60; i++) { if (!(await vis('stationOv'))) break; await page.waitForTimeout(40); }
await ev(() => { S.dead = true; S.deadInfo = { name: S.pName, cls: CHAR.CLASSES[S.pClass].name, cause: 'lost to the river', wraith: false, seed: S.pSeed, stats: S.pStats }; });
await page.click('#unstickBtn'); await page.waitForTimeout(400);
r = await ev(() => ({
  cert: !document.getElementById('deathOv').classList.contains('hidden'), dead: S.dead, cause: document.getElementById('deathCause').textContent,
  toast: [...document.querySelectorAll('#toasts > *')].map(t => t.textContent).find(t => /certificate was owed/.test(t)) || '',
}));
ok('THE RELEASE MEETS A DEATH: a committed death is not "released" — Release shows it its certificate at last (the committed cause on it), the walker stays dead, and the notice says the certificate was owed and the valley kept everything',
  r.cert && r.dead === true && /lost to the river/.test(r.cause) && /valley kept everything/.test(r.toast), JSON.stringify(r));
await page.click('#deathContinue'); await page.waitForTimeout(400); await page.click('#cgBegin'); await page.waitForTimeout(900); await skipScenes(); await calm();

/* ================= 17 · THE FAULT CHIP ================= */
const errN = T.errors.length;
await ev(() => { window.__realUpdate = Systems.update; Systems.update = () => { throw new Error('deadboot: a step that throws every frame'); }; });
let chipText = '';
for (let i = 0; i < 400; i++) { const c = await ev(() => { const el = document.getElementById('faultChip'); return el.classList.contains('hidden') ? '' : el.textContent; }); if (c) { chipText = c; break; } await page.waitForTimeout(100); }   // 120 frames of the fault, however slow the machine draws them
await ev(() => { Systems.update = window.__realUpdate; delete window.__realUpdate; });
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
r = await ev(() => ({ diag: document.getElementById('pauseDiag').textContent, release: [...document.querySelectorAll('#pause .setRow')].map(x => x.firstChild && x.firstChild.textContent ? x.firstChild.textContent.trim() : '').find(t => /^Unstick/.test(t)) || '' }));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
const injected = T.errors.splice(errN).filter(e => !/deadboot: a step that throws every frame|the sim/.test(e));
T.errors.push(...injected);   // only the fault this check threw is not an error of the page
const wantChip = '⚠ FAULT EVERY FRAME · the sim: deadboot: a step that throws every frame · ESC → UNSTICK';
ok('THE FAULT CHIP: a fault firing every frame pins a chip the player can read back verbatim — "⚠ FAULT EVERY FRAME · the sim: <message> · ESC → " and the ESC menu\'s release by the name the menu shows it (v3.49: the plain names — Free my boots is Unstick) — and the ESC menu\'s line lists the fault caught',
  chipText === wantChip && /faults caught: the sim: deadboot: a step that throws every frame/.test(r.diag),
  JSON.stringify({ chip: chipText, want: wantChip, diag: r.diag, releaseRow: r.release }));

/* ================= 18 · THE TYPE LEDGER ================= */
r = await ev(async () => {
  const H = DATA.stations.haven; S.px = H.x + 150; S.py = H.y + 120; S.moveTo = null; S.route = [];
  State.save();
  const j = JSON.parse(localStorage.getItem('waylight_save_v1')), n0 = j.structures.length;
  /* a save from a NEWER register: a clay oven this build keeps off its shelf, a works renamed since (its map entry shipped
     with the rename), and a v3.28b attic that still holds a PO box */
  j.structures.push({ id: 91001, type: 'clayoven', x: S.px + 70, y: S.py + 6, ang: 0, hp: 100, by: 'you', likes: 0 });
  j.structures.push({ id: 91002, type: 'lookoutPost', x: S.px - 300, y: S.py + 260, ang: 0, hp: 100, by: 'you', likes: 0 });
  j.attic = [{ id: 91003, type: 'pobox', x: S.px + 320, y: S.py - 240, ang: 0, hp: 90, by: 'you', likes: 0, box: [] }];
  localStorage.setItem('waylight_save_v1', JSON.stringify(j));
  window.__shelf = DATA.structures.clayoven; delete DATA.structures.clayoven;
  DATA.MIGRATE_TYPES.lookoutPost = 'watchtower';
  const loaded = State.load();
  const un = S.structures.find(s => s.id === 91001), ren = S.structures.find(s => s.id === 91002), att = S.structures.find(s => s.id === 91003);
  const kept = S.structures.length === n0 + 3 && !('attic' in S);
  /* visible: the tarp-and-rope glyph at its site, against the same frame without it */
  S.weather.state = 'clear'; const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * 0.3;
  Render.setFx(false); Render.setZoom(3); __clearAmb(S.px, S.py, 400);
  await __wait(500); await __frames(4);
  const A = __grab(un.x, un.y - 6, 18);
  const at = S.structures.indexOf(un); S.structures.splice(at, 1);
  await __wait(150); await __frames(4);
  const B = __grab(un.x, un.y - 6, 18);
  S.structures.splice(at, 0, un);
  await __wait(150); await __frames(4);
  const A2 = __grab(un.x, un.y - 6, 18);
  const rope = __count(A, __hex('#6b7076'), 10), ropeB = __count(B, __hex('#6b7076'), 10);
  const hp0 = un.hp; await __wait(1200); const inert = un.hp === hp0 && un.type === 'unmapped' && DATA.structures.unmapped.decay === 0 && !DATA.structures.unmapped.work && DATA.structures.unmapped.cost === null;
  const glyph = Render.structDebug('unmapped');
  return {
    loaded, kept, un: un && { type: un.type, origType: un.origType }, ren: ren && ren.type, att: att && att.type,
    diff: __diff(A, B), same: __diff(A, A2), rope, ropeB, inert, glyph,
  };
});
ok('THE TYPE LEDGER (v3.28c: the attic corrected to the real mechanism): a save carrying a type this build does not know loads with NOTHING dropped — the foreign works becomes a real unmapped object (its original type carried on it) standing where it stood, its authored tarp-and-rope glyph drawn on the ground (against the same frame without it — the frame redrawn with it back differs from the first by a fraction of that), inert (no decay, no work, never built); a renamed type walks forward through DATA.MIGRATE_TYPES; the old attic drains back into the world and is gone from the save',
  r.loaded && r.kept && r.un && r.un.type === 'unmapped' && r.un.origType === 'clayoven' && r.ren === 'watchtower' && r.att === 'pobox' && r.diff > 60 && r.same < r.diff / 5 && r.rope > 8 && r.ropeB === 0 && r.inert && r.glyph.w === 12 && r.glyph.h === 10,
  JSON.stringify(r));

/* ================= 19 · THE ROUND TRIP ================= */
r = await ev(async () => {
  State.save();
  const j = JSON.parse(localStorage.getItem('waylight_save_v1'));
  const inSave = j.structures.find(s => s.id === 91001);
  /* a build that knows the clay oven loads the save */
  DATA.structures.clayoven = window.__shelf; delete window.__shelf;
  const loaded = State.load();
  const back = S.structures.find(s => s.id === 91001);
  const A = __grab(back.x, back.y - 6, 18);
  await __wait(300); await __frames(4);
  const B = __grab(back.x, back.y - 6, 18);
  const tarp = __count(B, __hex('#6b7076'), 10);
  State.save();
  const j2 = JSON.parse(localStorage.getItem('waylight_save_v1')), again = j2.structures.find(s => s.id === 91001);
  delete DATA.MIGRATE_TYPES.lookoutPost;
  Render.setZoom(null); Render.setFx(true);   // the player's page has no debug clock to hand back
  return { saved: inSave && { type: inSave.type, origType: inSave.origType }, loaded, back: back && { type: back.type, orig: 'origType' in back }, again: again && again.type, tarp, redraw: __diff(A, B) };
});
ok('THE ROUND TRIP: the unmapped object rides the save with its original type on it, and the moment a build that knows the type loads the save it steps back into itself — a clay oven again, the original type spent, drawn as itself (the tarp gone from its site), and saved as itself',
  r.saved && r.saved.type === 'unmapped' && r.saved.origType === 'clayoven' && r.loaded && r.back && r.back.type === 'clayoven' && !r.back.orig && r.again === 'clayoven' && r.tarp === 0 && r.redraw > 30,
  JSON.stringify(r));

await T.finish('the dead boot');
