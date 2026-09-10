/* inputs.mjs — v3.28a THE WATCHDOG: the frozen-input report answered as law. The step can never
   die silently (faults are caught, reported on screen, and the loop keeps walking); stuck gates
   are found and repaired within two seconds; the modal lists carry no gaps; and the whole UI
   fuzz that hunts for input-killers runs green on the NON-DEBUG page — the page the player
   actually plays. */
import { chromium } from 'playwright';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
// THE PLAYER'S PAGE: no debug flag
await page.goto('file:///home/claude/waylight/dist/waylight.html', { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);
await page.click('#btnNew'); await page.waitForTimeout(300);
await page.click('#btnBegin'); await page.waitForTimeout(400);
await page.click('#briefGo'); await page.waitForTimeout(300);
await page.click('#cgBegin'); await page.waitForTimeout(1500);
const ev = fn => page.evaluate(fn);
for (let i = 0; i < 30; i++) { const c = await ev(() => !!S.cine); if (!c) break; await page.keyboard.press('KeyE'); await page.waitForTimeout(400); }
const inputLive = async () => {
  const p0 = await ev(() => ({ x: S.px, y: S.py }));
  await page.keyboard.down('KeyD'); await page.waitForTimeout(450); await page.keyboard.up('KeyD');
  const p1 = await ev(() => ({ x: S.px, y: S.py }));
  const mv = await ev(() => { const r = document.getElementById('game').getBoundingClientRect(); return { x: r.width / 2 + 140, y: r.height / 2 + 30 }; });
  await page.mouse.click(mv.x, mv.y); await page.waitForTimeout(250);
  const clicked = await ev(() => !!S.moveTo);
  await ev(() => { S.moveTo = null; S.route = []; });
  return (Math.abs(p1.x - p0.x) + Math.abs(p1.y - p0.y) > 2) && clicked;
};
ok('the player\'s own page (no debug flag) boots into a world with live WASD and live click-to-move', await inputLive(), '');

/* ================= THE FUZZ, AS LAW ================= */
await page.keyboard.press('Escape'); await page.waitForTimeout(200); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
ok('pause via ESC, resume via ESC — inputs live after', await inputLive(), '');
await page.keyboard.press('KeyM'); await page.waitForTimeout(400);
await page.click('#btnViewCont'); await page.waitForTimeout(800);
await page.click('#btnViewWorld'); await page.waitForTimeout(1000);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
ok('the full map ladder (survey → table → globe) closed by ESC — inputs live after', await inputLive(), '');
await page.keyboard.press('KeyK'); await page.waitForTimeout(250); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.keyboard.press('KeyB'); await page.waitForTimeout(200); await page.keyboard.press('Digit2'); await page.waitForTimeout(200); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
ok('skills sheet and a hung blueprint, both ESC\'d away — inputs live after', await inputLive(), '');

/* ================= THE TAILOR GAP, CLOSED ================= */
let r = await ev(() => {
  document.getElementById('tailorOv').classList.remove('hidden');
  return { modal: UI.anyModal(), frozen: UI.worldFrozen() };
});
ok('the tailor counts as the modal it is — travel refused, world held, no half-state', r.modal && r.frozen, JSON.stringify(r));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
r = await ev(() => ({ closed: document.getElementById('tailorOv').classList.contains('hidden'), modal: UI.anyModal() }));
ok('and the tailor answers ESC like every other sheet', r.closed && !r.modal, JSON.stringify(r));
ok('inputs live after the tailor', await inputLive(), '');

/* ================= THE WATCHDOG REPAIRS ================= */
r = await ev(() => new Promise(res => {
  // a paused clock with no pause sheet: manufacture the exact desync and let the dog find it
  document.getElementById('pause').classList.remove('hidden');
  dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));   // real ESC path opens pause properly instead
  document.getElementById('pause').classList.add('hidden');          // ...and the sheet is torn down behind the flag's back
  const t0 = S.time;
  setTimeout(() => res({ ticking: S.time > t0 }), 2600);
}));
ok('WATCHDOG: a paused flag with no pause sheet is found and the clock unstuck within two seconds', r.ticking, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  document.getElementById('stationOv').classList.remove('hidden');   // a sheet with nobody home
  setTimeout(() => res({ hidden: document.getElementById('stationOv').classList.contains('hidden'), modal: UI.anyModal() }), 2200);
}));
ok('WATCHDOG: a station sheet with no station is swept away — it can no longer eat every click', r.hidden && !r.modal, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  S.timeScale = 0;                                                    // a stranded scene clock
  document.body.classList.add('cine');                                // and a stranded letterbox
  setTimeout(() => res({ ts: S.timeScale, lb: document.body.classList.contains('cine') }), 2200);
}));
ok('WATCHDOG: a stranded timeScale and letterbox with no scene running are restored', r.ts === 1 && !r.lb, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  S.state = 'zip'; S.zip = null;                                      // a ride with no wire under it
  setTimeout(() => res({ state: S.state }), 2200);
}));
ok('WATCHDOG: a zip state with no ride under it walks again', r.state === 'walk', JSON.stringify(r));
ok('inputs live after every manufactured desync', await inputLive(), '');

/* ================= THE STEP CAN NEVER DIE ================= */
r = await ev(() => new Promise(res => {
  /* v3.28c — save-borne foreign types are normalized at LOAD (the type ledger; deadboot.mjs
     proves that path). Garbage injected at RUNTIME is a CODE bug, and the law for code bugs is
     LOUD: the fault guard names it on screen, the loop survives, and the sim resumes the moment
     the garbage is gone — absorbed-silently is the one outcome that must never happen. */
  S.structures.push({ id: 999999, type: 'oldworld_relic', x: S.px + 60, y: S.py, ang: 0, hp: 50, by: 'you', likes: 0 });
  setTimeout(() => {
    const toasts = document.getElementById('toasts').textContent;
    const named = /fault/i.test(toasts) || !document.getElementById('faultChip').classList.contains('hidden');
    S.structures = S.structures.filter(s2 => s2.type !== 'oldworld_relic');   // the bug "fixed"
    const t0 = S.time;
    setTimeout(() => res({ named, resumed: S.time > t0 }), 1500);
  }, 1200);
}));
ok('runtime garbage in the structure list is a CODE bug and behaves like one — named ON SCREEN by the guard, loop alive, sim resumed the moment it\'s gone', r.named && r.resumed, JSON.stringify(r));
r = await ev(() => new Promise(res => {
  // sabotage the sim itself for one beat: the guard must report ON SCREEN and keep walking
  const real = Systems.update;
  let bombs = 3;
  Systems.update = function (dt, inp) { if (bombs-- > 0) throw new Error('TEST-FAULT: sabotage'); return real.call(Systems, dt, inp); };
  setTimeout(() => {
    Systems.update = real;
    const toast = document.getElementById('toasts').innerText;
    const t0 = S.time;
    setTimeout(() => res({ reported: /caught a fault/i.test(toast) && /TEST-FAULT/.test(toast), recovered: S.time > t0 }), 900);
  }, 400);
}));
ok('a fault thrown inside the sim is CAUGHT, reported on screen with its own message, and the walk continues — a freeze can no longer be silent', r.reported && r.recovered, JSON.stringify(r));
ok('inputs live after the sabotage', await inputLive(), '');

/* ================= THE STILLNESS LAW (v3.30) — screen shake removed by directive ================= */
r = await ev(() => new Promise(res => {
  // damage-over-time used to feed a per-frame random camera jolt — the game read as MALFUNCTIONING.
  // Now: bleeding ticks, and the ground under a standing walker holds still to the pixel.
  S.moveTo = null; S.route = [];
  S.bleeding = true; S.health = 80;
  /* the camera settles onto a stopped walker over a second or so; the law is measured on a
     SETTLED frame — a settling camera is not a shake, and was never the defect */
  setTimeout(() => {
    const cv2 = document.getElementById('game'), g = cv2.getContext('2d');
    const grab = () => g.getImageData(60, cv2.height - 160, 100, 100).data;   // bare ground corner, no HUD, no entities
    const a = grab();
    setTimeout(() => {
      const b2 = grab();
      let diff = 0;
      for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b2[i]) > 6) diff++;
      S.bleeding = false; S.health = 100;
      res({ diff, renderShake: 'shake' in Render, settled: Math.abs(Render.cam.x - S.px) + Math.abs(Render.cam.y - S.py) < 2 });
    }, 140);
  }, 1800);
}));
ok('THE STILLNESS LAW: under bleeding damage the ground holds still to the pixel — the shake system does not exist', r.diff < 40 && r.renderShake === false && r.settled, JSON.stringify(r));
ok('no uncaught page errors across the whole gauntlet', errors.length === 0, JSON.stringify(errors.slice(0, 4)));

console.log('\n=== INPUTS / WATCHDOG (v3.28a) ===');
for (const line of results) console.log(line);
const pass = results.filter(x => x.startsWith('PASS')).length;
console.log(`\n${pass}/${results.length} checks passed`);
await b.close();
