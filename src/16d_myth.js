'use strict';
/* Waylight v3.23 — THE MYTH IN THE FLESH.
   The Postman's return, carried through GAMEPLAY: the world reacts to the walker's LEGEND, citing
   the player's ACTUAL record — never a dialogue screen. Micro-cines are cognitive signals only
   (letterbox + one slow zoom + the FIRST line, then release). And once per town, the famous
   handoff gets the absurdly over-produced parody it deserves: slow-mo, three cuts, the SUPER ZOOM,
   a freeze frame — janky low-bit art meeting effects money can't buy, because code is our muscle. */

const Myth = (() => {
  const { stations, stationOrder, T } = DATA;

  /* ---------- the legend ladder: how loudly the valley talks ---------- */
  const TIERS = [
    [1, 'a stranger', null],
    [4, 'SPOKEN OF', 'People pause when the coat goes by.'],
    [7, 'THE WALKER', 'They stop. They point. They tell each other where they were.'],
    [10, 'THE MYTH IN THE FLESH', 'Children run the fences to keep you in sight.'],
  ];
  function tier() { let t = 0; for (let i = 0; i < TIERS.length; i++) if ((S.level || 1) >= TIERS[i][0]) t = i; return t; }

  /* a bystander's line, built from the RECORD — what this player actually did */
  function mythLine(stId) {
    const st = S.stations[stId];
    const lines = [];
    const others = stationOrder.filter(id => id !== stId && S.stations[id].connected);
    const far = others.length ? stations[others[(rnd() * others.length) | 0]].name : null;
    if (st.stars >= 3) lines.push(`${st.stars} stars over our door. ${S.pName} put every one of them there.`);
    if ((st.likesTo || 0) > 120) lines.push(`I counted the crates once. I stopped counting. It kept coming.`);
    if (st.connected) lines.push(`I lived here UNLIT. Then that coat walked out of the grey.`);
    if (far) lines.push(`I saw the ${State.titleFor(S.level).toLowerCase()} once, out past ${far}, before OUR light came.`);
    if ((S.stats.delivered || 0) > 30) lines.push(`${S.stats.delivered} deliveries, they say. I believe every one now.`);
    if (Economy.apprLevel(stId) >= 3) lines.push(`That's them. That's the one the riders answer for.`);
    lines.push(`It's the Walker. It's actually the Walker.`);
    return lines[(rnd() * lines.length) | 0];
  }
  const rnd = Math.random;

  /* ---------- the micro-cine: letterbox, ONE slow zoom, the first line, release ---------- */
  function microCine(x, y, line, opts = {}) {
    if (S.cine || S.handoff || S.mcine || S.cineSeq) return false;
    S.mcine = { t: 0, dur: Math.min(2.2, opts.dur || 2.2), x, y, line, col: opts.col || '198,206,186', said: false };
    UI.setLetterbox(true);
    return true;
  }
  function endMicro() {
    if (!S.mcine) return false;
    S.mcine = null;
    if (!S.cine && !S.handoff) UI.setLetterbox(false);
    return true;
  }

  /* ---------- bystander recognition: the yard notices, and says WHERE it was ---------- */
  const reactCd = {};
  let kidCd = 0;
  function updateLegend(dt) {
    const tr = tier();
    if (tr < 1) return;
    for (const id of stationOrder) {
      const d = stations[id], st = S.stations[id];
      if (!st.connected || st.litT <= 0) continue;
      const pd = U.dist(S.px, S.py, d.x, d.y);
      if (pd > 230) continue;
      // a NEW tier's first lit yard: the moment gets the zoom
      if ((S.flags.mythSeen || 0) < tr) {
        S.flags.mythSeen = tr;
        const bx = d.x + 46, by = d.y + 34;
        microCine(bx, by, tr >= 3 ? `It's HIM. It's actually him. THE ${State.titleFor(S.level).toUpperCase()}.` : mythLine(id), { col: '255,201,120' });
        S.mythSay = { stId: id, t: 4 };
        Snd.sfx.like(0);
        continue;
      }
      if ((reactCd[id] || 0) > S.time) continue;
      reactCd[id] = S.time + 120;
      S.mythSay = { stId: id, t: 3.2 };
      Render.say(d.x + 46, d.y + 22, mythLine(id), '198,206,186');
    }
    if (S.mythSay) { S.mythSay.t -= dt; if (S.mythSay.t <= 0) S.mythSay = null; }
    // THE MYTH: children run the fences alongside
    kidCd -= dt;
    if (tr >= 3 && kidCd <= 0 && S.speed > 20) {
      const near = stationOrder.find(id => S.stations[id].connected && U.dist(S.px, S.py, stations[id].x, stations[id].y) < 700);
      if (near) {
        kidCd = 55;
        S.kids = [];
        for (let i = 0; i < 2; i++) S.kids.push({ x: S.px - 40 - i * 22, y: S.py + 26 + i * 14, t: 0, dur: 4.5, seed: (Math.random() * 1e9) | 0 });
      }
    }
    if (S.kids) {
      for (const k of S.kids) {
        k.t += dt;
        const tx = S.px - 24 - (k.seed % 3) * 10, ty = S.py + 22 + (k.seed % 5) * 5;
        const d2 = Math.max(1, U.dist(k.x, k.y, tx, ty));
        const sp = Math.min(S.speed + 26, 150);
        k.x += (tx - k.x) / d2 * sp * dt; k.y += (ty - k.y) / d2 * sp * dt;
      }
      if (S.kids.every(k => k.t > k.dur)) { const k0 = S.kids[0]; Render.say(k0.x, k0.y - 10, U.pick(rnd, ['THE WALKER! I TOUCHED THE COAT!', 'Tell my brother! TELL HIM!', 'One day I ride too!']), '255,201,120'); S.kids = null; }
    }
  }

  /* ---------- THE HANDOFF: the famous scene, over-produced on purpose ----------
     Mounted, letters aboard for the town ahead, first time there: a kid runs to the roadside with
     a letter held HIGH. The world drops to quarter speed. Three cuts — wide, close, SUPER ZOOM —
     speed lines, the pass, a white flash, a freeze frame, a stamp. Then the road again. */
  function maybeHandoff() {
    if (S.handoff || S.cine || S.mcine || S.cineSeq || S.dead) return;
    if (!Systems.horseOn()) return;
    for (const o of S.orders.active) {
      if (o.item !== 'letters' || o.convoy || o.salvage) continue;
      const d = stations[o.to];
      const pd = U.dist(S.px, S.py, d.x, d.y);
      if (pd < 300 || pd > 430) continue;
      S.flags.handoffs = S.flags.handoffs || {};
      if (S.flags.handoffs[o.to]) continue;
      S.flags.handoffs[o.to] = true;
      beginHandoff(o.to);
      return;
    }
  }
  function beginHandoff(stId) {
    const d = stations[stId];
    const ang = Math.atan2(d.y - S.py, d.x - S.px);
    const px2 = S.px + Math.cos(ang) * 150, py2 = S.py + Math.sin(ang) * 150;   // the pass point, up the road
    S.handoff = {
      t: 0, town: stId, phase: 0,
      px: px2, py: py2,
      kidX: px2 + Math.cos(ang + Math.PI / 2) * 120, kidY: py2 + Math.sin(ang + Math.PI / 2) * 120,
      kidTX: px2 + Math.cos(ang + Math.PI / 2) * 14, kidTY: py2 + Math.sin(ang + Math.PI / 2) * 14,
      seed: (Math.random() * 1e9) | 0, passed: false, flash: 0, frozeT: 0, envT: -1,
    };
    S.timeScale = 0.25;
    UI.setLetterbox(true);
    Snd.sfx.alarm();
  }
  function updateHandoff(dt) {
    const h = S.handoff;
    if (!h) { maybeHandoff(); return; }
    h.t += dt;   // REAL time — the whole point is the world crawling underneath it
    // the kid runs out, letter high
    const kd = Math.max(1, U.dist(h.kidX, h.kidY, h.kidTX, h.kidTY));
    if (kd > 4) { h.kidX += (h.kidTX - h.kidX) / kd * 130 * dt; h.kidY += (h.kidTY - h.kidY) / kd * 130 * dt; }
    h.phase = h.t < 0.9 ? 0 : h.t < 1.8 ? 1 : 2;
    // THE PASS: the walker crosses the point, or the clock calls it
    if (!h.passed && h.phase === 2 && (U.dist(S.px, S.py, h.kidTX, h.kidTY) < 46 || h.t > 2.5)) {
      h.passed = true; h.flash = 0.14; h.envT = 0; h.frozeT = 0.42;
      S.timeScale = 0;   // the freeze frame
      Snd.sfx.like(0);
    }
    if (h.flash > 0) h.flash -= dt;
    if (h.envT >= 0) h.envT += dt;
    if (h.passed && h.frozeT > 0) { h.frozeT -= dt; if (h.frozeT <= 0) S.timeScale = 0.25; }
    if (h.t >= 3.6) endHandoff(false);
  }
  function endHandoff(skipped) {
    const h = S.handoff;
    if (!h) return false;
    S.handoff = null;
    S.timeScale = 1;
    if (!S.cine && !S.mcine) UI.setLetterbox(false);
    Economy.addAppr(h.town, 3);
    State.grantLikes(5);
    UI.toast(`The whole of ${stations[h.town].name} will hear about that handoff by dusk.`, 'gold', 5000);
    Systems.addMail(`From a mother at ${stations[h.town].name}`, `My kid hasn't stopped talking about the rider who took the letter AT FULL TROT. You could have stopped. You didn't. It was PERFECT.`);
    return true;
  }
  function skip() {
    if (S.mcine) return endMicro();
    if (S.handoff) return endHandoff(true);
    return false;
  }

  /* ---------- THE RIDE (v3.24): the firing-squad parody, displaced the 90s way ----------
     First deep push into the grey after the legend starts: a Waylighter courier caught behind
     Reaper lines. A recon Waylighter watches from the ridge with Haven's people at his back — one
     of them a kid. The captive gets one line. The second rider BOLTS. The camera does the merciful
     thing: it veers up and away, and the shots are HEARD. Then the stamp. Then the road again.
     Built entirely on the Cine engine — a shot list, never bespoke camera code. */
  function maybeRide() {
    if (S.flags.rideSeen || tier() < 1) return;
    if (S.cine || S.mcine || S.handoff || S.cineSeq || S.dead || S.inside || S.qte || S.struggle) return;
    if (S.time < 240 || S.speed < 12) return;
    if (World.mistAt(S.px, S.py) < 0.6) return;
    for (const id of stationOrder) if (U.dist(S.px, S.py, stations[id].x, stations[id].y) < 420) return;
    beginRide();
  }
  function beginRide(force) {
    if (S.cineSeq || S.ride) return false;
    S.flags.rideSeen = true;
    const ang = S.dir || 0;
    const cs = Math.cos(ang), sn = Math.sin(ang), pxc = Math.cos(ang + Math.PI / 2), pyc = Math.sin(ang + Math.PI / 2);
    const gx = S.px + cs * 250, gy = S.py + sn * 250;              // the execution ground, out in the grey
    const wx = S.px - cs * 40 + pxc * 96, wy = S.py - sn * 40 + pyc * 96;   // the watch ridge
    // the rider bolts TOWARD the light — the nearest connected town
    let bt = null, bd = 1e9;
    for (const id of stationOrder) { if (!S.stations[id].connected) continue; const dd = U.dist(gx, gy, stations[id].x, stations[id].y); if (dd < bd) { bd = dd; bt = id; } }
    const boltAng = bt ? Math.atan2(stations[bt].y - gy, stations[bt].x - gx) : ang + Math.PI;
    const R = {
      gx, gy, aim: false,
      captive: { x: gx, y: gy, seed: 771 },
      reapers: [0, 1, 2, 3].map(i => ({ x: gx + cs * 40 + pxc * (i - 1.5) * 17, y: gy + sn * 40 + pyc * (i - 1.5) * 17 })),
      rider: { x: gx - pxc * 62, y: gy - pyc * 62, seed: 4412, bolted: false, boltAng, gf: 0, gone: 0 },
      watchers: [0, 1, 2, 3, 4].map(i => ({ x: wx + pxc * (i - 2) * 13 - cs * (i % 2) * 9, y: wy + pyc * (i - 2) * 13 - sn * (i % 2) * 9, seed: 900 + i * 37, kid: i === 2 })),
    };
    const kid = R.watchers[2], recon = R.watchers[0];
    const ok = Cine.play([
      { move: 'cut', at: { x: (gx + R.rider.x) / 2, y: (gy + R.rider.y) / 2 }, zoom: 0.8, dur: 2.3,
        say: { line: 'Reapers. They took two of ours at the crossing.', col: '198,206,186', at: { x: recon.x, y: recon.y } } },
      { move: 'push', at: { x: wx, y: wy - 6 }, zoom: 1.5, zoomTo: 2.7, dur: 2.3,
        say: { line: "THAT'S MY DAD!", col: '255,201,120', at: { x: kid.x, y: kid.y } } },
      { move: 'cut', at: { x: gx, y: gy - 8 }, zoom: 2.5, dur: 2.2,
        say: { line: 'RIDE, WAYLIGHTER! RIIIIIIIDE!!', col: '224,101,74', at: { x: gx, y: gy } },
        on: () => { R.rider.bolted = true; R.aim = true; Snd.sfx.alarm(); } },
      { move: 'dolly', at: () => ({ x: R.rider.x, y: R.rider.y }), zoom: 2.0, dur: 2.4, fx: { speedlines: 1 } },
      { move: 'veer', at: { x: gx, y: gy }, zoom: 1.7, zoomTo: 0.55, dur: 2.7, veerAng: -Math.PI / 2, veerDist: 300,
        fx: { 'shots@': 1.1 } },
      { move: 'hold', at: () => ({ x: R.rider.x, y: R.rider.y }), zoom: 1.6, dur: 1.7, fx: { stamp: 'THE MAIL GOT OUT.' } },
    ], {
      ts: 0.25,
      actorTick: (dt) => {
        const r = R.rider;
        if (r.bolted && r.gone < 8) { r.gone += dt; r.x += Math.cos(r.boltAng) * 185 * dt; r.y += Math.sin(r.boltAng) * 185 * dt; r.gf += dt * 11; }
      },
      onEnd: () => {
        S.ride = null;
        State.grantLikes(4);
        Systems.addMail('Recon, in from the grey', 'We watched from the ridge. They put four guns on Marek and he still gave the bag away first. The other rider made the treeline. The kid saw all of it. He has not stopped saying RIDE.');
        UI.toast('The story of the ride will beat you to every yard in the valley.', 'gold', 6000);
      },
    });
    if (!ok) { S.flags.rideSeen = force ? true : false; return false; }
    S.ride = R;
    return true;
  }

  /* ---------- v3.25 THE CLOAKED TORCH: the protagonist framed BEFORE the class exists ----------
     The scorned hero is built the myth way — in fragments, from witnesses, never a briefing.
     Beat 1: the walker crosses the deep grey and comes out walking EASY; the next lit yard
     noticed. Beat 2: somebody finally says the NAME — a scrapper who knows the stance, or a kid
     who has heard the stories. Only after both does the world send the exiles themselves. */
  function updateTorch() {
    if (S.cine || S.mcine || S.handoff || S.cineSeq) return;
    if (S.wasDeep && !S.flags.torchCross) S.flags.torchCross = true;
    if (S.flags.torchCross && !S.flags.torchSeen) {
      for (const id of stationOrder) {
        const d = stations[id], st = S.stations[id];
        if (!st.connected || U.dist(S.px, S.py, d.x, d.y) > 230) continue;
        S.flags.torchSeen = true;
        microCine(d.x + 40, d.y + 30, 'You came out of the grey walking EASY. Where does a coat learn the dark like that?', { col: '198,206,186' });
        break;
      }
    }
    if (S.flags.torchSeen && !S.flags.torchNamed) {
      // door one: a scrapper reads the stance
      if ((S.renegade || 0) >= 1) {
        for (const cd of DATA.camps) {
          const c = S.camps[cd.id];
          if (!c || c.pacified) continue;
          const r = (c.runners || []).find(r2 => U.dist(r2.x, r2.y, S.px, S.py) < 300);
          if (r) { S.flags.torchNamed = true; microCine(r.x, r.y, 'Hold— HOLD. I know that stance. Lamplighter.', { col: '224,101,74' }); return; }
        }
      }
      // door two: a lit yard has heard the stories
      if (tier() >= 2) {
        for (const id of stationOrder) {
          const d = stations[id], st = S.stations[id];
          if (!st.connected || U.dist(S.px, S.py, d.x, d.y) > 230) continue;
          S.flags.torchNamed = true;
          microCine(d.x + 46, d.y + 34, 'Is it true what they say? That you carry the cloaked torch?', { col: '255,201,120' });
          return;
        }
      }
    }
  }

  /* ---------- v3.25 THE LAMPLIGHTER: the exiles come for the one nobody else would ----------
     Two doors into ONE once-ever scene. CORNERED: scrappers close on a hurt walker deep in the
     grey — three cracks from a ridge nobody saw. THE FALL: the pool spent and no yard that loves
     you — the rescue system's exile lane. Either way: the cloaked figure, the raised-tongue
     stranger beside them, the rifle handed down, and two factions stepping out of rumor. */
  function canLamp() { return !!(S.flags.torchSeen && S.flags.torchNamed && !S.flags.lamp && !S.cineSeq && !S.cine && !S.mcine && !S.handoff && !S.dead); }
  function maybeLamp() {
    if (!canLamp()) return;
    if (S.health >= DATA.T.lampTriggerHp || World.mistAt(S.px, S.py) < 0.35) return;
    for (const id of stationOrder) if (U.dist(S.px, S.py, stations[id].x, stations[id].y) < 420) return;
    for (const cd of DATA.camps) {
      const c = S.camps[cd.id];
      if (!c || c.pacified) continue;
      const r = (c.runners || []).find(r2 => r2.cd <= 0 && U.dist(r2.x, r2.y, S.px, S.py) < 240);
      if (r) { beginLamp('corner'); return; }
    }
  }
  function beginLamp(mode) {
    if (S.flags.lamp) return false;
    S.flags.lamp = true;
    if (mode === 'fall') {   // the exile lane stands the walker up first — the scene is the flourish, the save is the law
      S.health = DATA.T.rescueHeal; S.bleeding = false;
      S.food = Math.max(S.food, 30); S.warmth = Math.max(S.warmth, 40);
      S.qte = null; S.struggle = null; S.stagger = 0;
    }
    const ang = (S.dir || 0) + Math.PI / 2;
    const rx = S.px + Math.cos(ang) * 290, ry = S.py + Math.sin(ang) * 290;
    S.lamp = { fig: { x: rx, y: ry }, env: { x: rx + 16, y: ry + 10, show: false }, t: 0 };
    let nearR = null;
    for (const cd of DATA.camps) { const c = S.camps[cd.id]; if (!c) continue; const r = (c.runners || []).find(r2 => U.dist(r2.x, r2.y, S.px, S.py) < 420); if (r) { nearR = r; break; } }
    const ok = Cine.play([
      { move: 'cut', at: { x: nearR ? (S.px + nearR.x) / 2 : S.px, y: nearR ? (S.py + nearR.y) / 2 : S.py }, zoom: 1.45, dur: 1.5,
        say: mode === 'corner' ? { line: 'Nowhere left to walk, coat.', col: '224,101,74' } : { line: '…get up. Get UP.', col: '198,206,186' } },
      { move: 'cut', at: { x: rx, y: ry }, zoom: 2.3, dur: 2.1, fx: { 'shots@': 0.5 },
        on: () => {   // THE CRACKS — this time the gun is on OUR side, and the camera looks straight at it
          for (const cd of DATA.camps) {
            const c = S.camps[cd.id];
            if (!c || c.pacified) continue;
            for (const r of c.runners || []) if (U.dist(r.x, r.y, S.px, S.py) < 640) {
              const d = Math.max(1, U.dist(r.x, r.y, S.px, S.py));
              r.x += (r.x - S.px) / d * 160; r.y += (r.y - S.py) / d * 160; r.cd = 20;
            }
          }
        } },
      { move: 'push', at: { x: rx, y: ry - 6 }, zoom: 2.3, zoomTo: 3.3, dur: 2.2,
        say: { line: 'Still upright. Good. The Order teaches falling; we teach standing.', col: '255,201,120', at: { x: rx, y: ry } } },
      { move: 'cut', at: { x: rx + 8, y: ry }, zoom: 2.6, dur: 2.7,
        on: () => { if (S.lamp) S.lamp.env.show = true; },
        say: { line: 'GREETINGS, SURFACE-FRIEND. OUR BOOKS DESCRIBED YOUR KIND. THE BOOKS WERE WRONG.', col: '143,176,138', at: { x: rx + 16, y: ry + 4 } } },
      { move: 'hold', at: { x: rx, y: ry }, zoom: 2.2, dur: 1.7, fx: { stamp: 'THE CLOAKED TORCH.' } },
    ], { ts: 0.25, onEnd: endLamp });
    if (!ok) endLamp();   // a blocked scene never blocks the meeting itself
    return true;
  }
  function endLamp() {
    S.lamp = null;
    S.gear.rifle = true;
    S.gear.ammo338 = (S.gear.ammo338 || 0) + DATA.T.lampAmmoStart;
    S.flags.lampClass = true;
    S.flags.sbsnIdx = 0;
    S.flags.sbsnT = S.time + 45;
    Systems.tut('firstRifle');
    UI.toast('<b>The C14 Timberwolf</b> rides your pack — and the LAMPLIGHTER\'s road is open to the walkers who come after you.', 'gold', 8000);
    Systems.addMail('Left in your pack, unsigned', 'The rifle is called a Timberwolf. Twelve rounds — count them like friends, they are exactly that scarce. A crack over their heads turns a chase without a drop of blood. A crack THROUGH one of them is the thing they exiled us for, so know what your hand is buying before it buys. The loud one beside me wants to write to you. Humor them. They saved us first.');
    Systems.addMail('FIELD CORRESPONDENCE — FORM 7-C', '<div class="sbsn">SBSN: PENCE WALLERY<br>SBCA: DIEFENBUNKER EXTERNAL RELATIONS OFFICER (PROVISIONAL)<br>DATE: BY THE OLD COUNT, UNCERTAIN<br><hr>GREETINGS AGAIN, SURFACE-FRIEND. PROTOCOL REQUESTS I DEFINE OUR TERMS: SBSN, SOCIAL BUNKER SECURITY NUMBER. SBCA, SOCIAL BUNKER CAREER ASSIGNMENT. WE ALL HAVE THEM. YOU DO NOT, WHICH THE ADMINISTRATION FINDS DEEPLY UPSETTING.<br><br>THE MARKSMEN WHO KEEP US SAY YOU CAN BE TRUSTED WITH OUR RECORD. I WILL SEND IT AS THE COMM ARRAY ALLOWS. IT IS NOT A HAPPY RECORD. IT IS OURS.</div>');
  }

  /* the Society's record, delivered as the comm array allows — the founding logs, one at a time */
  const SBSN_LOGS = [
    ['BUNKER RECORD 1 OF 3 — THE UNSEALING', '<div class="sbsn">SBSN: DOUGLAS REED<br>SBCA: DIEFENBUNKER PRIME ADMINISTER<br>DATE: SAT AUG 10 &middot; 13 DAYS POST UNSEAL, AKA NEW WORLD DAY<br><hr>THE SOCIETY, OUR PERFECT LITTLE BUBBLE. IT FINALLY SURFACED; THE ALARMS BLARED, THE PISTONS AND HYDRAULICS HISSED, THE RUST BROKE FREE OF THE SEALS AND THAT 500-TON DOOR FINALLY SCRAPED OPEN. NEW WORLD DAY WAS FINALLY HERE. WE WERE SURFACING IN OUR WORK GEAR; READY TO DIG; READY TO SALVAGE; READY TO TWIST THE METAL OF THE OLD WORLD STRAIGHT. BUT WE DIDN\'T FIND RUIN, WE DIDN\'T FIND CITIES OF OLD. WE FOUND DEATH. DEATH WE THOUGHT COULDN\'T EXIST.</div>'],
    ['BUNKER RECORD 2 OF 3 — THE DOORS', '<div class="sbsn">SBSN: SARAH O\'CONNEL<br>SBCA: MECHANIC<br>DATE: SAT AUG 9 &middot; 12 DAYS POST WHATEVER THE OPPOSITE OF HOPE IS<br><hr>THE YEAR FINALLY CAME; THEY CALLED IT NEW WORLD DAY. THE DAY THE ALL-KNOWING GATES OPENED, THE DAY MATH TOLD US EARTH WAS READY TO REPOPULATE AND THE RADIATION LEVELS HAD DROPPED ENOUGH WE COULD RE-CULTIVATE THE LAND; BUT WHEN WE SURFACED WHAT WE FOUND WASN\'T WHAT WE EXPECTED. SAVAGES, BARBARIANS, REAPERS, CANNIBALS; W A R. WE TRIED TO REASON WITH THEM, THERE WASN\'T ANY. WE WANTED TO START THE NEW WORLD; INSTEAD WE RETREATED BACK TO THE IRON WALLS OF OUR OLD ONE. BUT WE COULDN\'T SHUT THE DOORS. WE COULDN\'T RESEAL WHAT WAS DESIGNED TO UNSEAL PERMANENTLY. WE DIDN\'T HAVE THE TECHNOLOGY ANYMORE TO REBUILD WHAT SEALED US IN THE FIRST PLACE; HELL, WE DIDN\'T EVEN HAVE THE FOOD OR SUPPLIES TO LAST ANOTHER CYCLE. THIS WAS OUR NEW HOME NOW, IN THE NEW WORLD, DOORS OPEN UNTIL WE GET THE WELDERS UP.</div>'],
    ['BUNKER RECORD 3 OF 3 — THE RED LEAF', '<div class="sbsn">SBSN: JIMMY BUTLER<br>SBCA: DIEFENBUNKER ENFORCEMENT DEPARTMENT — LIEUTENANT<br>DATE: SAT AUG 13 &middot; 16 DAYS POST NWD (NEW WORLD DAY)<br><hr>AS THE RED ALERT FLICKERED TO LIFE AND THE ALARMS SCREAMED MOVEMENT AT THE BUNKER HATCHES, WE PREPARED FOR THE WORST. OUR SOLDIERS GRABBED THEIR PRE-BUNKER-ERA ASSAULT RIFLES; THE ONES THAT READ C8 AND HAD THE RED LEAF ETCHED INTO THE SIGHTS. OUR LEADERS STILL WORE THEIR PINS; THE ONES OF THE OLD TIMES AND THE ANCIENT ONES. THE ONES WHO STILL BELIEVED WE CAME FROM A PLACE CALLED CANADA AND THIS BUNKER WAS ORIGINALLY THE LAST HAVEN OF THE FREE WORLD. SOMETHING ABOUT THE COLD, SOMETHING ABOUT THE WATER.</div>'],
  ];
  function updateSbsn() {
    if (S.flags.sbsnIdx === undefined || S.flags.sbsnIdx >= SBSN_LOGS.length) return;
    if (S.time < (S.flags.sbsnT || 0)) return;
    const [subj, body] = SBSN_LOGS[S.flags.sbsnIdx];
    Systems.addMail(subj, body);
    UI.toast('The comm array coughs — a <b>bunker record</b> lands in your mail.', '', 4500);
    S.flags.sbsnIdx++;
    S.flags.sbsnT = S.time + DATA.T.sbsnGap;
  }

  /* keeper hellos bend the knee at tier 2+ — a line before their own words */
  function legendPrefix(stId) {
    const tr = tier();
    if (tr < 2) return '';
    const pool = tr >= 3
      ? ['They said you were taller. They were wrong about everything else.', 'The kids drew you on the water tower. I let them.', 'You walk in here like the light itself owes you a favour. It does.']
      : ['Word walks faster than you do now.', 'People say your name like they checked the spelling.'];
    return `<i>${pool[(rnd() * pool.length) | 0]}</i> `;
  }

  function tick(dt) {
    if (S.mcine) {
      S.mcine.t += dt;
      if (!S.mcine.said && S.mcine.t > 0.5) { S.mcine.said = true; Render.say(S.mcine.x, S.mcine.y - 14, S.mcine.line, S.mcine.col); }
      if (S.mcine.t >= S.mcine.dur) endMicro();
    }
    updateHandoff(dt);
    if (!S.cine && !S.handoff && !S.mcine && !S.cineSeq) { updateLegend(dt); maybeRide(); updateTorch(); maybeLamp(); }
    updateSbsn();
  }

  return { tick, tier, microCine, beginRide, canLamp, beginLamp, skip, mythLine, legendPrefix, TIERS };
})();
