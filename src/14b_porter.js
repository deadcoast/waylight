'use strict';
/* Waylight: Second Wind — the porter engine: generation, action-XP, survival, death & legacy */

const Porter = (() => {
  const { SKILLS, SKILL_IDS, CLASSES, TRAITS, XP_CURVE, MANUAL_VOLS, FIRST, LAST, QUIRKS, CAUSES, PORTRAIT } = CHAR;
  const rand = Math.random;

  /* ---------- generation ---------- */
  function randomName(rng = rand) { return U.pick(rng, FIRST) + ' ' + U.pick(rng, LAST); }
  function randomTraits(budget, rng = rand) {
    const pos = Object.keys(TRAITS).filter(t => TRAITS[t].cost > 0);
    const neg = Object.keys(TRAITS).filter(t => TRAITS[t].cost < 0);
    const picked = [];
    let net = budget;
    const wantPos = rng() < 0.85 ? 1 + (rng() < 0.4 ? 1 : 0) : 0;
    for (let i = 0; i < wantPos; i++) {
      const t = U.pick(rng, pos.filter(p => !picked.includes(p)));
      picked.push(t); net -= TRAITS[t].cost;
    }
    let guard = 0;
    while (net < 0 && guard++ < 20) {
      const t = U.pick(rng, neg.filter(p => !picked.includes(p)));
      if (!t) break;
      picked.push(t); net += -TRAITS[t].cost;
    }
    return net >= 0 ? picked : picked.filter(t => TRAITS[t].cost < 0);
  }
  function freshSkills(cls) {
    const sk = {};
    for (const id of SKILL_IDS) sk[id] = { lv: 0, xp: 0, total: 0 };
    const c = CLASSES[cls];
    if (c) for (const [id, lv] of Object.entries(c.skills)) { sk[id].lv = lv; }
    return sk;
  }
  function generate(opts = {}) {
    const rng = opts.rng || rand;
    const cls = opts.cls || U.pick(rng, Object.keys(CLASSES));
    return {
      name: opts.name || randomName(rng),
      cls,
      traits: opts.traits || randomTraits(CLASSES[cls].pts, rng),
      skills: freshSkills(cls),
      seed: opts.seed !== undefined ? opts.seed : (rng() * 1e9) | 0,
      line: opts.line || U.pick(rng, QUIRKS),
    };
  }
  function applyToState(p) {
    S.pName = p.name; S.pClass = p.cls; S.pTraits = p.traits; S.pSeed = p.seed; S.pLine = p.line;
    S.skills = p.skills;
    S.health = 100; S.food = 85; S.warmth = 100;
    S.bleeding = false; S.bruisedT = 0; S.foodZeroT = 0;
    S.buffs = {}; S.manuals = S.manuals || {};
    S.equip = { boots: State.makeItem('boots0'), coat: State.makeItem('coat0'), pack: State.makeItem('pack0'), charm: null };
    S.manuals = {};
    S.gear.flares = 0; S.gear.sledOn = false;
    // v3.25: the Timberwolf is a hand-me-down between EXILES only — the Nomads collect their
    // rifles from the fallen. A Lamplighter porter shoulders one on day one; nobody else does.
    S.gear.rifle = p.cls === 'lamplighter'; S.gear.ammo338 = p.cls === 'lamplighter' ? DATA.T.lampClassAmmo : 0;
    S.cargo = [];
    S.journal = { name: p.name, xp: {} };
    S.pStats = { deliveries: 0, km: 0, likes: 0, bornAt: Date.now() };
    S.dead = false; S.deadInfo = null;   // v3.28b: the new walker owes the certificate nothing
    _effT = -1;
  }

  const has = t => S.pTraits && S.pTraits.includes(t);
  const isCls = c => S.pClass === c;

  /* ---------- effects (cached per sim-time) ---------- */
  let _eff = null, _effT = -1;
  function dirty() { _effT = -1; }
  function eff() {
    if (_eff && _effT === S.time) return _eff;
    _effT = S.time;
    const lv = id => S.skills && S.skills[id] ? S.skills[id].lv : 0;
    const g = slot => S.equip && S.equip[slot] ? DATA.items[S.equip[slot].defId] || {} : {};
    const boots = g('boots'), coat = g('coat'), pack = g('pack'), charm = g('charm');
    const b = S.buffs || {};
    const e = {
      speed: (1 + lv('foot') * 0.012) * (pack.speed || 1) * (b.teaglow > 0 ? 1.08 : 1) * (S.flags.effects.speed4 ? 1.04 : 1),
      speedCap: pack.speedCap || 1,
      noSprint: !!pack.noSprint,
      wobbleMul: (1 - lv('bal') * 0.05) * (has('surefoot') ? 0.75 : 1) * (has('weakknees') ? 1.25 : 1) * (boots.wobbleMul || 1) * (pack.wobbleMul || 1),
      windowAdd: lv('bal') * 0.04 + (charm.windowAdd || 0),
      stamMax: 90 + lv('end') * 6 + (has('deeplungs') ? 15 : 0),
      drainMul: has('ironlungs') ? 0.85 : 1,
      regenMul: (1 + lv('end') * 0.04) * (has('asthmatic') ? 0.8 : 1) * (S.flags.effects.regen20 ? 1.2 : 1),
      stationRegen: (charm.stationRegen || 1) * (has('restless') ? 0.75 : 1),
      cap: 55 + lv('haul') * 2.8 + (pack.cap || 0) + (has('packmule') ? 10 : 0) - (has('badback') ? 8 : 0) + (S.flags.effects.cap10 ? 10 : 0) + (isCls('lamplighter') ? 6 : 0),
      dropMul: has('clumsy') ? 1.15 : 1,
      buildCostMul: (1 - lv('rig') * 0.03) * (isCls('rigger') ? 0.8 : 1),
      decayMineMul: 1 - lv('rig') * 0.04,
      yieldMul: 1 + lv('sal') * 0.06,
      scrapMul: 1 + lv('sal') * 0.08,
      flareR: (1 + lv('lum') * 0.06) * (isCls('lightkeeper') ? 1.4 : 1),
      lumenMul: 1 + lv('lum') * 0.06,
      mistDecayMul: (1 - lv('lum') * 0.04) * (isCls('lightkeeper') ? 0.75 : 1) * (boots.mistMul || 1),
      ladderMul: isCls('mountaineer') ? 999 : 1 + lv('climb') * 0.07,
      slopeMul: (1 - lv('climb') * 0.05) * (boots.slopeMul || 1),
      mendMul: (1 + lv('mend') * 0.08) * (isCls('medic') ? 1.5 : 1) * (has('quickhands') ? 1.3 : 1),
      buffDurMul: (1 + lv('hearth') * 0.09) * (isCls('hearthkeeper') ? 2 : 1),
      upkeepMul: (1 - lv('hearth') * 0.04) * (isCls('hearthkeeper') ? 0.7 : 1),
      senseMul: (has('greytouched') ? 0.7 : 1) * (has('greymarked') ? 1.3 : 1) * (coat.senseMul || 1) * (b.teaglow > 0 ? 1.3 : 1),
      rainMul: (coat.rainMul || 1),
      warmthIns: (coat.warmth || 0) + (has('warmblood') ? 0.3 : 0),
      likesMul: charm.likesMul || 1,
      revealMul: (has('keeneyes') ? 1.4 : 1) * (charm.revealMul || 1),
      luck: has('luckyfind') ? 1.35 : 1,
      hireMul: has('loner') ? 1.5 : 1,
      xpMul: isCls('drifter') ? 1.15 : 1,
      foodMul: has('sweettooth') ? 1.3 : 1,
      fearWater: has('fearwater'),
      shortSight: has('shortsight'),
      echoMul: charm.echoMul || 1,
      bellWarn: !!charm.senseWarn,
    };
    _eff = e;
    return e;
  }

  /* ---------- XP ---------- */
  function classMult(id) {
    const c = CLASSES[S.pClass];
    if (!c || !c.skills[id]) return 1;
    return c.skills[id] >= 2 ? 2 : 1.5;
  }
  function manualMult(id) {
    const lv = S.skills[id].lv;
    for (let vi = 0; vi < 3; vi++) {
      if (S.manuals[`${id}${vi + 1}`] && lv >= MANUAL_VOLS[vi].band[0] && lv <= MANUAL_VOLS[vi].band[1]) return MANUAL_VOLS[vi].mul;
    }
    return 1;
  }
  function xp(id, amt, raw = false) {
    const sk = S.skills[id];
    if (!sk || sk.lv >= 10 || amt <= 0) return;
    if (!raw) amt *= classMult(id) * manualMult(id) * eff().xpMul;
    sk.xp += amt; sk.total += amt;
    while (sk.lv < 10 && sk.xp >= XP_CURVE[sk.lv]) {
      sk.xp -= XP_CURVE[sk.lv];
      sk.lv++;
      dirty();
      UI.toast(`${SKILLS[id].name} <b>${sk.lv}</b> — ${SKILLS[id].fx(sk.lv)}${S.flags.tut.firstSkill ? '' : ' · press <b>K</b> for your body\'s ledger'}`, 'gold', S.flags.tut.firstSkill ? 4500 : 8000);
      S.flags.tut.firstSkill = true;
      Snd.sfx.levelup();
      if (id === 'end' || id === 'haul') UI.updateHUD();
    }
  }
  // rate-limited accumulators for continuous grants
  const acc = {};
  function xpAcc(id, amt, chunk = 1) {
    acc[id] = (acc[id] || 0) + amt;
    if (acc[id] >= chunk) { const n = Math.floor(acc[id] / chunk) * chunk; acc[id] -= n; xp(id, n); }
  }

  /* ---------- survival ---------- */
  function update(dt) {
    if (S.dead) return;
    const e = eff();
    // buffs
    for (const k of Object.keys(S.buffs)) { S.buffs[k] -= dt; if (S.buffs[k] <= 0) { delete S.buffs[k]; dirty(); } }
    // food
    const moving = S.speed > 8;
    /* v3.24 THE TOWN LAW: no one starves or freezes to death inside walls — IMMEDIATE immunity.
       A town that watches a walker drop dead of hunger in its own yard is not a town. */
    const townId = Systems.nearStation(DATA.T.townSafeR);
    S.food = Math.max(0, S.food - (moving ? 0.09 : 0.03) * e.foodMul * dt);
    if (S.food <= 0) {
      S.foodZeroT += dt;
      if (townId) {   // the mercy meal: a keeper spots you swaying and brings broth
        S.flags.mercyT = S.flags.mercyT || {};
        if ((S.flags.mercyT[townId] || 0) <= S.time) {
          S.flags.mercyT[townId] = S.time + DATA.T.mercyMealCd;
          S.food = Math.max(S.food, 24);
          UI.toast(`A keeper at ${DATA.stations[townId].name} presses a bowl into your hands. <i>"Not in MY yard, walker. Eat."</i>`, 'gold', 6000);
          Snd.sfx.pickup();
        }
      } else if (S.foodZeroT > 30) damage(0.14 * dt, 'starve', { silent: true });
    }
    else S.foodZeroT = 0;
    if (S.food < 35 && !S.flags.tut.firstHunger) { S.flags.tut.firstHunger = true; UI.toast('Hungry — press <b>H</b> to eat. Rations print at any terminal from provisions; farms donate them with every delivery.', '', 8000); }
    // warmth
    const north = Math.max(0, (1 - S.py / DATA.H) - 0.5) * 1.7;
    const terr = World.terrainAt(S.px, S.py);
    let cold = north + (Systems.rainAt(S.px, S.py) > 0.05 ? 0.35 : 0) + (terr.water ? 0.5 : 0) + Economy.dayPhase().nightness * 0.35;
    let ins = e.warmthIns + (World.lightAt(S.px, S.py) > 0.3 ? 0.4 : 0) + (S.buffs.warmed > 0 ? 0.6 : 0) + (S.warmT > 0 ? 0.5 : 0);
    if (Systems.inAura('generator') || Systems.inAura('shelter') || Systems.nearStation(150)) ins += 1.2;
    const net = cold - ins;
    S.warmth = U.clamp(S.warmth + (net > 0 ? -net * 1.1 : 7) * dt, 0, 100);
    if (S.warmth < 15 && !townId) damage(0.3 * dt, 'cold', { silent: true });   // the town law covers the cold too
    if (S.warmth < 45 && !S.flags.tut.firstCold) { S.flags.tut.firstCold = true; UI.toast('The cold is in your coat. Light, fires and generators warm you; the north wants a real coat.', '', 8000); }
    // wounds
    if (S.bleeding) damage(0.25 * dt, 'bleed', { silent: true });
    if (S.bruisedT > 0) S.bruisedT -= dt;
    // regen
    if (S.health < 100 && S.food > 45 && !S.bleeding) {
      const atRest = Systems.nearStation(150) || Systems.inAura('shelter') || Systems.inAura('generator');
      S.health = Math.min(100, S.health + (atRest ? 0.6 : S.food > 70 ? 0.08 : 0) * dt);
    }
  }

  let lastCause = 'bleed';
  function damage(amt, cause, opts = {}) {
    if (S.dead || amt <= 0) return;
    S.health = Math.max(0, S.health - amt);
    lastCause = cause;
    if (opts.bleed && rand() < opts.bleed && !S.bleeding) {
      S.bleeding = true;
      UI.toast('You are <b>bleeding</b> — bandage it, or a terminal can', 'rust');
    }
    if (opts.bruise) S.bruisedT = Math.max(S.bruisedT, 60);
    if (S.health <= 0) {
      /* v3.24 THE PARTY IS THE HEALTH POOL: the player character ALWAYS falls last.
         Quarter by quarter — each companion takes a blow that would end you; when the last
         back is spent, the best-loved town gets one chance to ride. Then, and only then,
         permadeath is permadeath. */
      if (!opts.noSave) {
        const m = NPC.partyAbsorb && NPC.partyAbsorb(cause);
        if (m) { S.health = DATA.T.koHeal; S.bleeding = false; return; }
        if (Systems.rescueAttempt && Systems.rescueAttempt(cause)) return;
      }
      die(cause);
    }
  }
  function heal(amt) { S.health = Math.min(100, S.health + amt * eff().mendMul); }

  function eat(item) {
    const d = DATA.items[item.defId];
    if (!d || d.cat !== 'food') return false;
    S.food = Math.min(100, S.food + (d.food || 20));
    const dur = eff().buffDurMul;
    if (d.buff === 'wellfed') S.buffs.wellfed = 240 * dur;
    if (d.buff === 'wellfed2') { S.buffs.wellfed = 360 * dur; S.buffs.warmed = 240 * dur; }
    if (d.buff === 'warmed') S.buffs.warmed = 300 * dur;
    if (d.buff === 'teaglow') { S.buffs.teaglow = 90 * dur; S.stam = Math.min(eff().stamMax, S.stam + 30); }
    dirty();
    State.removeCargo(item.id);
    xp('hearth', d.buff ? 8 : 4);
    Snd.sfx.pickup();
    UI.toast(`${d.name} — ${d.flavor}`, '', 3500);
    return true;
  }
  function useItem(item) {
    const d = DATA.items[item.defId];
    if (d.use === 'bandage') {
      if (!S.bleeding && S.health > 92) { UI.toast('Nothing needs binding right now'); return false; }
      S.bleeding = false; heal(10);
      State.removeCargo(item.id); xp('mend', 14); Snd.sfx.repair();
      UI.toast('Bound tight. It holds.');
      return true;
    }
    if (d.use === 'salve') {
      if (S.health > 95) { UI.toast('Save it — you are whole'); return false; }
      S.bleeding = false; heal(25);
      State.removeCargo(item.id); xp('mend', 14); Snd.sfx.repair();
      UI.toast('The salve glows into the hurt.');
      return true;
    }
    return false;
  }
  function readManual(item) {
    const d = DATA.items[item.defId];
    const key = `${d.skill}${d.vol}`;
    if (S.manuals[key]) { UI.toast('Already studied — pass it on', ''); return false; }
    S.manuals[key] = true;
    State.removeCargo(item.id);
    Snd.sfx.accept();
    UI.toast(`Studied <b>${d.name}</b> — ${CHAR.SKILLS[d.skill].name} learns faster now`, 'gold');
    return true;
  }

  /* ---------- moodles ---------- */
  function moodles() {
    const m = [];
    const e = eff();
    if (S.buffs.wellfed > 0) m.push({ id: 'wellfed', good: true, name: 'Well-fed', desc: 'Stamina recovers faster' });
    if (S.buffs.warmed > 0 || S.warmT > 0) m.push({ id: 'warmed', good: true, name: 'Warmed', desc: 'Cold cannot reach you yet' });
    if (S.buffs.teaglow > 0) m.push({ id: 'glow', good: true, name: 'Lumen glow', desc: 'Faster — and easier to notice' });
    if (S.food <= 5) m.push({ id: 'starving', sev: 2, name: 'Starving', desc: 'Health is draining. Eat anything.' });
    else if (S.food < 35) m.push({ id: 'hungry', sev: 1, name: 'Hungry', desc: 'Stamina recovers 30% slower' });
    if (S.warmth < 15) m.push({ id: 'freezing', sev: 2, name: 'Freezing', desc: 'Health is draining. Find fire or light.' });
    else if (S.warmth < 45) m.push({ id: 'cold', sev: 1, name: 'Cold', desc: 'Slower, shakier. Coats, fires, light.' });
    if (S.bleeding) m.push({ id: 'bleeding', sev: 2, name: 'Bleeding', desc: 'Bandage it, or any terminal will' });
    else if (S.bruisedT > 0) m.push({ id: 'bruised', sev: 1, name: 'Bruised', desc: 'Stamina recovers slower for a while' });
    const wet = World.terrainAt(S.px, S.py).water || Systems.rainAt(S.px, S.py) > 0.25;
    if (wet) m.push({ id: 'wet', sev: 1, name: 'Wet', desc: 'The cold works faster on wet cloth' });
    if (State.weight() > e.cap) m.push({ id: 'over', sev: 2, name: 'Overloaded', desc: 'Stumbling is a promise now' });
    let fear = false;
    for (const w of S.wraiths) if (w.state === 'hunt' && U.dist(w.x, w.y, S.px, S.py) < 500) fear = true;
    if (fear) m.push({ id: 'fear', sev: 2, name: 'Grey-fear', desc: 'Hands shake — wobbles come easier' });
    return m;
  }
  function fearActive() {
    for (const w of S.wraiths) if (w.state === 'hunt' && U.dist(w.x, w.y, S.px, S.py) < 500) return true;
    return false;
  }

  /* ---------- journal & death ---------- */
  function transcribe() {
    const xpMap = {};
    for (const id of SKILL_IDS) xpMap[id] = Math.round(S.skills[id].total);
    S.journal = { name: S.pName, xp: xpMap };
  }
  function readJournal(j) {
    let gained = 0;
    for (const [id, total] of Object.entries(j.xp || {})) {
      const amt = Math.round(total * 0.7);
      if (amt > 0) { xp(id, amt, true); gained += amt; }
    }
    UI.toast(`Read <b>${j.name}'s journal</b> — their hands remember through yours. +${gained} skill XP`, 'gold', 7000);
    Snd.sfx.levelup();
  }

  function die(cause) {
    if (S.dead) return;
    S.dead = true;
    const inGrey = World.mistAt(S.px, S.py) > 0.5;
    // gather everything the porter carried
    const items = [];
    for (const c of S.cargo) {
      if (c.orderId) {
        const o = S.orders.active.find(o => o.idNum === c.orderId);
        if (o) { c.lostTo = o.to; c.name = c.name.replace(' (lost)', '') + ' (lost)'; }
        c.orderId = null;
      }
      items.push(c);
    }
    for (const slot of ['boots', 'coat', 'pack', 'charm']) {
      const it = S.equip[slot];
      if (it && !['boots0', 'coat0', 'pack0'].includes(it.defId)) items.push(it);
    }
    // find a passable resting spot
    let gx = S.px, gy = S.py;
    if (World.terrainAt(gx, gy).blocked) {
      for (let r = 30; r < 300; r += 30) {
        const a = rand() * 7;
        const tx = gx + Math.cos(a) * r, ty = gy + Math.sin(a) * r;
        if (!World.terrainAt(tx, ty).blocked) { gx = tx; gy = ty; break; }
      }
    }
    const grave = {
      id: U.uid(), x: gx, y: gy, name: S.pName, cls: S.pClass, seed: S.pSeed,
      items, flares: S.gear.flares, journal: S.journal,
      wraith: inGrey, respected: false, ph: rand() * 7,
    };
    S.graves.push(grave);
    // orders fail — their cargo waits at the grave
    for (const o of [...S.orders.active]) {
      if (o.prio) {
        S.orders.prioAccepted = false;   // the chain never locks: the origin posts it again
        Systems.addMail(`Priority order lost with ${S.pName}`, `${DATA.stations[o.from].name} will post it again. What ${S.pName} carried lies where they fell — ${DATA.stations[o.to].name} still wants it.`);
      } else Systems.addMail(`Order lost with ${S.pName}`, `${DATA.stations[o.to].name} still needs that cargo. It lies where they fell.`);
    }
    S.orders.active = [];
    // legacy
    S.legacy.push({ name: S.pName, cls: CLASSES[S.pClass].name, fate: CAUSES[cause] || cause, likes: Math.round(S.pStats.likes), km: (S.pStats.km / 1000).toFixed(1), deliveries: S.pStats.deliveries, cheated: !!S.flags.cheated, seed: S.pSeed, fact: S.pClass === 'lamplighter' ? 'lamplighters' : 'waylight' });   // v3.29/30: the face and the banner ride the roll — an exile's stone stands in the exiles' own ground
    if (!inGrey) {
      if (!S.echoRoster.includes(S.pName)) S.echoRoster.push(S.pName);
      Systems.addMail(`${S.pName} walks the network now`, 'Waylighters the light remembers never really stop delivering.');
    } else {
      Systems.addMail(`The Grey kept ${S.pName}`, 'They stand where they fell. Light frees the kept — carry a flare to them.');
    }
    NPC.onPorterDeath();
    /* v3.28b THE DEAD BOOT LAW — the death is COMMITTED the moment it happens. The certificate's
       facts ride the save (deadInfo), and the save is written NOW: no alt-F4 walks a death back,
       and any reload lands on the Certificate of Passage instead of a zombie world with its
       boots nailed down. This was the frozen-input bug: an auto-save on the death screen stored
       dead:true, and every boot after loaded a world where nothing could move but the ESC menu. */
    S.deadInfo = { name: S.pName, cls: CLASSES[S.pClass].name, cause: CAUSES[cause] || cause, wraith: inGrey, stats: S.pStats, seed: S.pSeed };
    UI2.showDeath(S.deadInfo);
    State.save();
  }

  function claimGrave(grave) {
    for (const it of grave.items) State.addCargo(it);
    S.gear.flares = Math.min(5, S.gear.flares + (grave.flares || 0));
    const j = grave.journal;
    S.graves.splice(S.graves.indexOf(grave), 1);
    Snd.sfx.pickup();
    if (j && j.name !== S.pName) readJournal(j);
    else if (j) readJournal(j);
    UI.toast(`${grave.name}'s pack, shouldered again. Nothing stays lost.`, 'gold');
    UI.refreshCargo();
  }
  function freeWraithGrave(grave) {
    grave.wraith = false;
    if (!S.echoRoster.includes(grave.name)) S.echoRoster.push(grave.name);
    Snd.connectionChord();
    Render.flare();
    UI.toast(`<b>${grave.name}</b> steps out of the Grey — and into the network. The cairn remains.`, 'gold', 7000);
    Systems.addMail(`${grave.name} is free`, 'A wraith walked into the light and remembered its name.');
    State.grantLikes(30);
  }

  /* ---------- portraits ---------- */
  const portraitCache = {};
  function portrait(seed, size = 64) {
    const key = seed + '_' + size;
    if (portraitCache[key]) return portraitCache[key];
    const rng = U.rng(seed);
    const c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d');
    const s = size / 64;
    const skin = U.pick(rng, PORTRAIT.skins), hood = U.pick(rng, PORTRAIT.hoods), scarf = U.pick(rng, PORTRAIT.scarves);
    x.fillStyle = '#10161f'; x.fillRect(0, 0, size, size);
    // hood
    x.fillStyle = hood;
    x.beginPath(); x.arc(32 * s, 34 * s, 26 * s, Math.PI, 0); x.fill();
    x.fillRect(6 * s, 34 * s, 52 * s, 30 * s);
    // face
    x.fillStyle = skin;
    x.beginPath(); x.ellipse(32 * s, 36 * s, 14 * s, 16 * s, 0, 0, 7); x.fill();
    // hood shadow
    x.fillStyle = 'rgba(0,0,0,0.35)';
    x.beginPath(); x.ellipse(32 * s, 26 * s, 15 * s, 8 * s, 0, Math.PI, 0, true); x.fill();
    // eyes
    x.fillStyle = '#1d232c';
    const ey = (36 + rng() * 4) * s, ew = (1.5 + rng() * 1.5) * s;
    if (rng() < 0.25) { // tired lines
      x.fillRect(24 * s, ey, 6 * s, 1.6 * s); x.fillRect(34 * s, ey, 6 * s, 1.6 * s);
    } else {
      x.beginPath(); x.arc(26 * s, ey, ew, 0, 7); x.arc(38 * s, ey, ew, 0, 7); x.fill();
    }
    if (rng() < 0.3) { x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1.4 * s; x.beginPath(); x.moveTo(22 * s, (ey - 5 * s)); x.lineTo(29 * s, ey - 6 * s); x.stroke(); }
    // scarf
    x.fillStyle = scarf;
    x.fillRect(14 * s, 50 * s, 36 * s, 7 * s);
    x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(14 * s, 55 * s, 36 * s, 2 * s);
    // headlamp glint
    if (rng() < 0.5) { x.fillStyle = '#ffe3b0'; x.beginPath(); x.arc(32 * s, 20 * s, 2.4 * s, 0, 7); x.fill(); }
    // freckles / scar
    if (rng() < 0.3) { x.fillStyle = 'rgba(0,0,0,0.2)'; x.fillRect(40 * s, 42 * s, 1.5 * s, 4 * s); }
    const url = c.toDataURL();
    portraitCache[key] = url;
    return url;
  }

  return { generate, applyToState, randomName, randomTraits, eff, dirty, xp, xpAcc, update, damage, heal, eat, useItem, readManual, moodles, fearActive, transcribe, die, claimGrave, freeWraithGrave, portrait, freshSkills };
})();
