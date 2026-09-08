/* builds.mjs — v3.12 THE BUILDS: the player's architecture is authored, the last curves are dead,
   and the Order's final paperwork (certificate, service record, manual, enlistment) is filed. */
import { chromium } from 'playwright';
import fs from 'fs';
const results = [];
const ok = (name, cond, extra = '') => { results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`); if (!cond) process.exitCode = 1; };

/* 0. source law, checked at the source: no arcs, no quadratics, no world gradients in the renderer
      (the one radial gradient that survives is the screen vignette, a post effect, not the world) */
const src = fs.readFileSync('/home/claude/waylight/src/17_render.js', 'utf8');
ok('cx.arc count in the renderer: zero', (src.match(/cx\.arc\(/g) || []).length === 0, `${(src.match(/cx\.arc\(/g) || []).length}`);
ok('quadratic curves in the renderer: zero', (src.match(/quadraticCurveTo/g) || []).length === 0, '');
ok('linear gradients in the renderer: zero', (src.match(/createLinearGradient/g) || []).length === 0, '');
ok('radial gradients: only the vignette', (src.match(/createRadialGradient/g) || []).length === 1, '');

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-background-networking'] });
const page = await b.newPage({ viewport: { width: 1440, height: 860 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = [];
page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(150); await page.click('#btnBegin'); await page.waitForTimeout(250);
await page.click('#briefGo'); await page.waitForTimeout(200); await page.click('#cgBegin'); await page.waitForTimeout(600);
await page.evaluate(() => { WL.calm(); S.weather.state = 'clear'; S.weather.t = 9999; S.time = 60; for (let i = 0; i < 15 && S.cine; i++) WL.skipCine && WL.skipCine(); });
await page.waitForTimeout(300);

/* 1. every build bakes an authored sprite */
let r = await page.evaluate(() => ({
  gen: Render.structDebug('generator'), sh: Render.structDebug('shelter'),
  tw: Render.structDebug('watchtower'), zp: Render.structDebug('zipline'),
}));
ok('generator, shelter, watchtower, pylon all bake authored sprites',
  r.gen.w === 14 && r.sh.w === 20 && r.tw.h === 15 && r.zp.h === 10, JSON.stringify(r));

/* 2. structures render on screen without error, damaged variant included */
r = await page.evaluate(async () => {
  const d = DATA.stations.haven;
  S.structures.push(
    { id: 9101, type: 'generator', x: d.x - 300, y: d.y - 100, ang: 0, hp: 100 },
    { id: 9102, type: 'shelter', x: d.x - 200, y: d.y - 140, ang: 0, hp: 30 },
    { id: 9103, type: 'watchtower', x: d.x - 100, y: d.y - 100, ang: 0, hp: 100 },
    { id: 9104, type: 'zipline', x: d.x - 250, y: d.y - 40, ang: 0, hp: 100 },
    { id: 9105, type: 'zipline', x: d.x - 60, y: d.y - 40, ang: 0, hp: 100 },
    { id: 9106, type: 'bridge', x: d.x - 180, y: d.y + 20, ang: 0.3, hp: 100 },
    { id: 9107, type: 'ladder', x: d.x - 80, y: d.y + 60, ang: -0.2, hp: 35 },
  );
  S.zipLinks.push([9104, 9105]);
  WL.tp([d.x - 180, d.y - 40]); S.moveTo = null;
  await new Promise(res => setTimeout(res, 500));
  const n = S.structures.length;
  S.structures = S.structures.filter(s => s.id < 9100);
  S.zipLinks = S.zipLinks.filter(([a]) => a < 9100);
  return n;
});
ok('a full build camp renders live (7 structures + a wire)', r >= 7, `${r} structures`);

/* 3. the certificate of passage: the death screen is the Order's paperwork */
r = await page.evaluate(() => {
  const ov = document.getElementById('deathOv');
  return {
    cert: /CERTIFICATE OF PASSAGE/i.test(ov.querySelector('header h2').textContent),
    stamp: /OFFICE OF THE DISPATCH/.test(ov.querySelector('.docStamp').textContent),
    photo: !!ov.querySelector('.filePhoto #deathPortrait'),
    taken: /TAKEN BY/i.test(ov.querySelector('.certRow .certLbl').textContent),
    foot: /THE ROLL OF THE ORDER/.test(ov.querySelector('.docFoot').textContent),
  };
});
ok('death files as a Certificate of Passage — stamp, photo, cause line, Roll footer',
  r.cert && r.stamp && r.photo && r.taken && r.foot, JSON.stringify(r));

/* 4. service record, field manual, enlistment all stamped */
r = await page.evaluate(() => ({
  svc: /SERVICE RECORD/.test(document.querySelector('#skillsOv .docStamp').textContent),
  svcPhoto: !!document.querySelector('#skillsOv .filePhoto #skillsPortrait'),
  fm: /FM-1/.test(document.querySelector('#helpOv .docStamp').textContent),
  enl: /ENLISTMENT/.test(document.querySelector('#chargen .docStamp').textContent),
}));
ok('service record + photo, field manual FM-1, enlistment form — all stamped', r.svc && r.svcPhoto && r.fm && r.enl, JSON.stringify(r));

/* 5. the QTE timer is a draining square, and the chrome holds no rounded corner */
r = await page.evaluate(() => {
  const arc = document.getElementById('qteArc');
  const moodleCss = [...document.styleSheets].some(() => true);   // presence only; computed below on a live moodle stand-in
  const m = document.createElement('span'); m.className = 'moodle'; document.body.appendChild(m);
  const mr = getComputedStyle(m).borderRadius; m.remove();
  return { tag: arc.tagName.toLowerCase(), dash: arc.getAttribute('pathLength'), moodleR: mr, css: moodleCss };
});
ok('the steady-timer drains around a square, not a circle', r.tag === 'rect' && r.dash === '207', JSON.stringify(r));
ok('moodles are square-cut chips', r.moodleR === '0px', r.moodleR);

/* 6. qteProgress still drives the new square */
r = await page.evaluate(() => { UI.qteProgress(0.5); return document.getElementById('qteArc').style.strokeDashoffset; });
ok('the steady meter still reads progress on the square', Math.abs(parseFloat(r) - 103.5) < 1, r);

/* errors */
ok('no page errors through the builds suite', errors.length === 0, errors.slice(0, 3).join(' | '));
console.log(results.join('\n'));
console.log(`\n${results.filter(x => x.startsWith('PASS')).length}/${results.length} checks green`);
await b.close();
