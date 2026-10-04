/* probe_cast — v3.51: THE CAST in the valley, for the eye. Stages every figure the version drew on the ground it stands on
   and writes shots/cast_*.png (tools/figures/montage.py composes them): the camps' own on the road and at the fire, the
   wanderer, the storm's knives, the garrison and the town's own, the kin, the Farkeepers walking and riding, the rescue
   riders, the ride, the Lamplighter and the stranger, the kid with the letter held high and the kids running, the
   procession, the far shape, the tender, the field crews, the walker sat and down, the stable under the Walker, the sled. */
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
const errors = []; page.on('pageerror', e => errors.push(String(e.message)));
await page.goto('file:///home/claude/waylight/dist/test.html?debug', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.WL && WL.snapshot && WL.snapshot().baked, null, { timeout: 60000 });
await page.evaluate(() => localStorage.clear());
await page.click('#btnNew'); await page.waitForTimeout(300); await page.click('#btnBegin'); await page.waitForTimeout(400); await page.click('#briefGo'); await page.waitForTimeout(300); await page.click('#cgBegin'); await page.waitForTimeout(1200);
for (let i = 0; i < 30; i++) { const c = await page.evaluate(() => !!S.cine); if (!c) break; await page.evaluate(() => WL.skipCine()); await page.waitForTimeout(250); }
const ev = (fn, a) => page.evaluate(fn, a);
await ev(() => { S.flags.guideDone = true; WL.calm(); Render.setFx(false); UI.announce = () => {}; for (const k of Object.keys(REP.EVENTS)) S.rep.evCd[k] = 99999; });
for (let i = 0; i < 80; i++) { const on = await ev(() => Render.crtActive && Render.crtActive()); if (!on) break; await page.waitForTimeout(200); }
await ev(() => { document.getElementById('toasts').style.display = 'none'; });
/* a clean stage: the Walker at a point, the clock held, nothing to pick up in frame, the camera where we say */
const stage = async (x, y, step, frac = 0.3, camDx = 0, camDy = -30) => {
  await ev(([x, y, step, frac]) => { S.moveTo = null; S.route = []; S.speed = 0; WL.tp([x, y]); S.nodes = S.nodes.filter(n => Math.hypot(n.x - S.px, n.y - S.py) > 300); S.drops = S.drops.filter(d => Math.hypot(d.x - S.px, d.y - S.py) > 300); S.weather.state = 'clear'; const DL = DATA.T.dayLen; S.time = Math.floor(S.time / DL) * DL + DL * frac; Render.setZoomStep(step); WL.timeScale = 1; S.flags.barks = { deepgrey: 3, night: 3, dawn: 3 }; S.wasDeep = true; }, [x, y, step, frac]);
  await page.waitForTimeout(350);
  await ev(([dx, dy]) => { WL.timeScale = 0.001; S.moveTo = null; S.speed = 0; Render.cam.x = S.px + dx; Render.cam.y = S.py + dy; }, [camDx, camDy]);
};
const at = (wx, wy) => ev(([wx, wy]) => { const w = Render.cam, z = Render.effZoom() / devicePixelRatio; return { x: innerWidth / 2 + (wx - w.x) * z, y: innerHeight / 2 + (wy - w.y) * z }; }, [wx, wy]);
const shot = async (name, wx, wy, w, h) => { await page.waitForTimeout(250); const p = await at(wx, wy); await page.screenshot({ path: `shots/cast_${name}.png`, clip: { x: Math.round(p.x - w / 2), y: Math.round(p.y - h / 2), width: w, height: h } }); };
const H = await ev(() => ({ x: DATA.stations.haven.x, y: DATA.stations.haven.y }));
const open = { x: H.x - 450, y: H.y - 100 };

/* 1. the camps' own on the road: a knife, a bowman, a ram walking, the chief at his fire */
const camp = await ev(() => { const cd = DATA.camps.find(c => (c.roll || []).includes('chief')) || DATA.camps[0]; return { id: cd.id, x: cd.x, y: cd.y }; });
await stage(camp.x + 40, camp.y + 160, 2, 0.3, 0, -120);
await ev(([cid]) => { const c = S.camps[cid], cd = DATA.camps.find(k => k.id === cid); c.pacified = false; c.taken = null; c.wired = null; c.given = null; c.storm = null;
  c.runners = ['knife', 'bowman', 'ram', 'knife'].map((cls, i) => ({ x: cd.x - 90 + i * 60, y: cd.y + 70 + (i % 2) * 14, wa: i * 1.3, state: 'patrol', cd: 5, cls })); }, [camp.id]);
await ev(() => { WL.timeScale = 0.05; }); await page.waitForTimeout(400); await ev(() => { WL.timeScale = 0.001; });
await shot('camp', camp.x, camp.y + 30, 520, 300);
/* 2. the wanderer at a camp that stood down, waving as you come */
await ev(([cid]) => { const c = S.camps[cid]; c.pacified = true; c.runners = []; }, [camp.id]);
await ev(([x, y]) => { WL.tp([x - 57 + 60, y + 60]); }, [camp.x, camp.y]); await page.waitForTimeout(700);
await shot('wanderer', camp.x - 57, camp.y + 5, 200, 150);
/* 3. the storm: the knives walk for a held post's fire, one of them down */
await ev(([cid]) => { const c = S.camps[cid], cd = DATA.camps.find(k => k.id === cid); c.pacified = true; c.taken = { t0: S.time, shields: 2 }; c.stash = [];
  c.storm = { t: 1, dur: 60, shieldT: 0.6, pinned: 0, broke: false, from: null, knives: ['knife', 'bowman', 'ram', 'knife'].map((cls, i) => ({ x: cd.x + 120 + i * 34, y: cd.y - 30 + i * 22, cd: i === 3 ? 5 : 0, cls, wa: i })) }; }, [camp.id]);
await stage(camp.x + 140, camp.y + 60, 2, 0.3, -40, -60);
await shot('storm', camp.x + 90, camp.y, 520, 300);
await ev(([cid]) => { const c = S.camps[cid]; c.storm = null; c.taken = null; c.pacified = false; }, [camp.id]);
/* 4. the garrison: the mountain's shields and the town's own in the square, the kin keeping a place */
const town = await ev(() => { const id = DATA.stationOrder.find(i => i !== 'haven' && !DATA.stations[i].post); const d = DATA.stations[id]; return { id, x: d.x, y: d.y }; });
await ev(([id]) => { const st = S.stations[id]; st.connected = true; st.litT = 1; Republic.held()[id] = { t0: S.time, shields: 4, own: 2, ate: 0 }; st.kin = { t: S.time, spots: [0, 1], name: 'Aila Venn' }; }, [town.id]);
await stage(town.x, town.y + 170, 2, 0.3, 0, -110);
await shot('garrison', town.x, town.y + 50, 560, 330);
await ev(([id]) => { delete Republic.held()[id]; S.stations[id].kin = null; }, [town.id]);
/* 5. the Farkeepers walking, and one astride */
await stage(open.x, open.y, 3, 0.3, 60, -30);
await ev(() => { const mk = (dx, cls, horse) => { const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.state = 'companion'; n.fk = true; n.fkCls = cls; n.cx = S.px + dx; n.cy = S.py + 4; n._px = n.cx; n._py = n.cy; n._dir = Math.PI / 2; if (horse) { n.horse = { breed: 'fjord' }; n.breed = 'fjord'; n._dir = 0; } return n; };
  mk(-60, 'pugugly'); mk(-20, 'longbowmen'); mk(20, 'berserker'); mk(60, 'rifle_rider'); mk(100, 'recon_rider'); mk(140, 'shield'); mk(210, 'rifle_rider', true); });
await page.waitForTimeout(300);
await shot('farkeep', open.x + 70, open.y - 20, 620, 220);
await ev(() => { S.npcs = S.npcs.filter(n => n.state !== 'companion'); });
/* 6. the rescue riders at the gallop (the recon rider astride the mountain's fjord), the walker sat and a walker down */
await stage(open.x, open.y + 200, 3, 0.3, 0, -30);
await ev(() => { S.rescue = { riders: [{ x: S.px - 90, y: S.py, in: false }, { x: S.px + 90, y: S.py + 10, in: true }], stId: 'haven', t: 0 }; S.event = { id: 9e9, type: 'rescueCold', x: S.px - 10, y: S.py + 50, t: 999, data: { npc: { seed: 42 } } }; });
await shot('riders', open.x, open.y + 210, 520, 240);
await ev(() => { S.event.type = 'rescueInjured'; });
await shot('down', open.x - 10, open.y + 240, 200, 120);
await ev(() => { S.rescue = null; S.event = null; });
/* 7. the ride: the captive on his knees, the Reapers' rifles level, the cold lamp, the watchers and the kid, the rider bolting */
await stage(open.x, open.y + 420, 2, 0.8, 30, -20);
await ev(() => { const gx = S.px + 80, gy = S.py; S.ride = { gx, gy, aim: true, captive: { x: gx, y: gy, seed: 771 },
  reapers: [0, 1, 2, 3].map(i => ({ x: gx + 44, y: gy - 30 + i * 20 })), rider: { x: gx - 10, y: gy + 70, seed: 4412, bolted: true, boltAng: 0, gf: 0, gone: 1 },
  watchers: [0, 1, 2, 3, 4].map(i => ({ x: S.px - 70 + i * 18, y: S.py - 40 + (i % 2) * 6, seed: 900 + i * 37, kid: i === 2 })) }; });
await shot('ride', open.x + 40, open.y + 420, 560, 260);
await ev(() => { S.ride = null; });
/* 8. the Lamplighter on the ridge, the stranger beside; night, so the slit's glow reads */
await stage(open.x, open.y + 600, 3, 0.86, 30, -30);
await ev(() => { S.lamp = { fig: { x: S.px + 60, y: S.py }, env: { x: S.px + 110, y: S.py + 6, show: true }, t: 0 }; });
await shot('lamp', open.x + 70, open.y + 580, 360, 200);
await ev(() => { S.lamp = null; });
/* 9. the kid with the letter held high, and the kids running the fence */
await stage(open.x + 400, open.y, 3, 0.3, 0, -30);
await ev(() => { S.handoff = { t: 0, town: 'haven', phase: 1, px: S.px + 60, py: S.py, kidX: S.px + 60, kidY: S.py + 4, kidTX: S.px + 60, kidTY: S.py + 4, seed: 12345, passed: false, flash: 0, frozeT: 0, envT: -1 };
  S.kids = [{ x: S.px - 60, y: S.py + 20, t: 0, dur: 99, seed: 7 }, { x: S.px - 100, y: S.py + 34, t: 0, dur: 99, seed: 13 }]; S.dir = 0; });
await shot('kids', open.x + 390, open.y, 420, 180);
await ev(() => { S.handoff = null; S.kids = null; UI.setLetterbox(false); S.timeScale = 1; });
/* 10. the procession at night, the far shape in the grey */
await stage(open.x + 400, open.y + 300, 2, 0.86, 0, -60);
await ev(() => { S.rep.evt = { t: 0, file: [0, 1, 2, 3, 4].map(i => ({ x: S.px - 120 + i * 34, y: S.py - 60 + i * 6 })), vx: 20, vy: 2, hitCd: 99 }; S.rep.giant.act = { x: S.px + 150, y: S.py + 40, t: 999 }; });
await shot('procession', open.x + 360, open.y + 240, 320, 170);
await shot('giant', open.x + 550, open.y + 280, 360, 460);
await ev(() => { S.rep.evt = null; S.rep.giant.act = null; });
/* 11. the tender at a fed bowl, the Flame Keepers allied */
const shrine = await ev(() => { const s2 = (S.rep.sites || []).find(x => x.p === 'flameshrine'); if (!s2) return null; s2.fedUntil = S.time + 9999; S.rep.stance.flamekeepers = 'ALLY'; return { x: s2.x, y: s2.y }; });
if (shrine) { await stage(shrine.x, shrine.y + 120, 3, 0.3, 0, -120); await ev(([x, y]) => { const s2 = S.rep.sites.find(q => q.p === 'flameshrine' && q.x === x); s2.fedUntil = S.time + 9999; }, [shrine.x, shrine.y]); await shot('tender', shrine.x + 10, shrine.y - 20, 240, 160); }
/* 12. the field crews: a forrester at the swing, a mason by his stones, a hauler's crates on the bedroll */
await stage(open.x + 800, open.y, 3, 0.3, 40, -30);
await ev(() => { const mk = (dx, job) => { const n = NPC.gen({ at: 'haven' }); S.npcs.push(n); n.state = 'field'; n.job = job; n.route = { a: 'haven' }; n.fx = S.px + dx; n.fy = S.py; n.fdir = 0; n.fmoving = false; n.fwork = 5; n.skills.haul = 0; return n; }; mk(-40, 'forrester'); mk(30, 'mason'); mk(100, 'hauler'); });
await shot('work', open.x + 830, open.y - 10, 360, 150);
await ev(() => { S.npcs = S.npcs.filter(n => n.state !== 'field'); });
/* 13. the stable under the Walker, east; the fjord west (the seat on the saddle both ways); the sled */
const breeds = await ev(() => Object.keys(SPRITES.HORSES).filter(b => b !== 'donkey'));
for (const br of breeds) {
  await stage(open.x + 1200, open.y, 3, 0.3, 0, -40);
  await ev(([br]) => { S.horse = { breed: br, on: true }; Systems.horseOn = () => true; S.dir = 0; Render.faceWalker('E'); }, [br]);
  await shot('mount_' + br, open.x + 1200, open.y - 30, 170, 150);
}
await ev(() => { S.dir = Math.PI; Render.faceWalker('W'); });
await shot('mount_west', open.x + 1200, open.y - 30, 170, 150);
await ev(() => { Systems.horseOn = () => false; S.horse = null; S.gear.sled = true; S.gear.sledOn = true; S.dir = 0; Render.faceWalker('E'); });
await shot('sled', open.x + 1190, open.y - 10, 190, 110);
console.log('ERRORS', errors.length, errors.slice(0, 4).join(' | '));
await b.close();
