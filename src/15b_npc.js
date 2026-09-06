'use strict';
/* Waylight: Second Wind — waylighters (procedural NPCs), companions, routes, events, ruins, the Peddler */

const NPC = (() => {
  const { CLASSES, TRAITS, RUIN_TYPES, RUIN_SPREAD, EVENTS } = CHAR;
  const rand = Math.random;

  /* ---------- generation ---------- */
  function gen(opts = {}) {
    const rng = opts.rng || rand;
    const cls = opts.cls || U.pick(rng, Object.keys(CLASSES));
    const skills = {};
    let sum = 0;
    for (const id of CHAR.SKILL_IDS) {
      let lv = Math.max(0, Math.floor(rng() * 4) - 1);
      if (CLASSES[cls].skills[id]) lv += CLASSES[cls].skills[id] + (rng() < 0.5 ? 1 : 0);
      lv = Math.min(7, lv);
      skills[id] = lv; sum += lv;
    }
    return {
      id: U.uid(), name: Porter.randomName(rng), cls,
      traits: Porter.randomTraits(CLASSES[cls].pts, rng).slice(0, 2),
      skills, seed: (rng() * 1e9) | 0,
      line: U.pick(rng, CHAR.QUIRKS),
      fee: { metal: 30 + sum * 6, ceramic: 15 + sum * 3 },
      likes: 20 + (rng() * 300 | 0),
      bond: false, feeWaived: false, hungry: false,
      state: 'pool', at: opts.at || 'haven', age: 0,
      carry: [], fedT: 360, shoveCd: 0, route: null,
    };
  }
  const capOf = n => 30 + (n.skills.haul || 0) * 6;
  const speedOf = n => 118 + (n.skills.foot || 0) * 5;

  function companion() { return S.npcs.find(n => n.state === 'companion') || null; }

  /* ---------- pools ---------- */
  function refreshPools() {
    for (const id of DATA.stationOrder) {
      if (!S.stations[id].connected) continue;
      const want = S.stations[id].stars >= 3 ? 2 : 1;
      const here = S.npcs.filter(n => n.state === 'pool' && n.at === id);
      for (const n of here) { n.age++; if (n.age > 3 && !n.bond && here.length > 1 && rand() < 0.5) S.npcs.splice(S.npcs.indexOf(n), 1); }
      while (S.npcs.filter(n => n.state === 'pool' && n.at === id).length < want) S.npcs.push(gen({ at: id }));
    }
  }
  // the first waylighter at Haven is affordable on day one
  function seedStarterPool() {
    const n = gen({ at: 'haven', cls: U.pick(rand, ['courier', 'scavenger', 'medic', 'hearthkeeper']) });
    n.fee = { metal: 20, ceramic: 8 };
    n.line = 'has been waiting by this fire for someone worth following';
    S.npcs.push(n);
  }

  /* ---------- hire / manage ---------- */
  function hireCost(n) {
    if (n.feeWaived) return null;
    const m = Porter.eff().hireMul;
    return { metal: Math.round(n.fee.metal * m), ceramic: Math.round(n.fee.ceramic * m) };
  }
  function hire(n, mode) {
    if (mode === 'companion' && companion()) { UI.toast('You already walk with someone — part ways first', 'rust'); return false; }
    if (mode === 'route' && routesActive() >= routeSlots()) { UI.toast(routeSlots() ? `All ${routeSlots()} route charters are spoken for — coverage opens more` : 'Route charters open once the light covers more of the valley', 'rust'); return false; }
    const cost = hireCost(n);
    if (cost && !State.canAfford(cost)) { UI.toast(`${n.name} asks ${Systems.fmtCost(cost)} — banked`, 'rust'); return false; }
    if (cost) State.pay(cost);
    n.feeWaived = true; // one fee, for life
    if (mode === 'companion') {
      n.state = 'companion';
      S.compPos = { x: S.px + 30, y: S.py + 30 };
      UI.toast(`<b>${n.name}</b> falls in beside you. ${n.line}.`, 'gold');
      Render.say(S.px + 40, S.py - 10, U.pick(rand, ['Point me at the weight.', 'I walk, you plan. Deal.', 'Been a while since anyone hired anyone.']));
    }
    Snd.sfx.accept();
    return true;
  }
  function dismiss(n, stationId) {
    if (n.state === 'companion' && n.carry.length) {
      const st = S.stations[stationId || Systems.nearStation(150) || 'haven'];
      for (const it of n.carry) st.storage.push(it);
      n.carry = [];
      UI.toast(`${n.name} racks the cargo in the lockers`);
    }
    n.state = 'pool';
    n.at = stationId || Systems.nearStation(150) || 'haven';
    n.route = null; n.age = 0;
  }
  function assignRoute(n, a, b) {
    if (n.state !== 'route' && routesActive() >= routeSlots()) { UI.toast(`All ${routeSlots()} route charters are spoken for`, 'rust'); return false; }
    n.state = 'route';
    n.route = { a, b, t: routeInterval(n), runs: 0 };
    UI.toast(`<b>${n.name}</b> takes the ${DATA.stations[a].name} – ${DATA.stations[b].name} run. The network breathes on its own a little more.`, 'gold');
    Snd.sfx.accept();
    return true;
  }
  function routeSlots() { return S.cov < 0.055 ? 0 : U.clamp(1 + Math.floor((S.cov - 0.055) / 0.12), 0, 4); }
  function routesActive() { return S.npcs.filter(n => n.state === 'route').length; }
  function routeInterval(n) {
    const skill = (n.skills.foot || 0) + (n.skills.haul || 0) + (n.skills.bal || 0);
    return U.clamp(150 - skill * 5, 75, 150);
  }

  function give(item) {
    const n = companion();
    if (!n) return false;
    const w = n.carry.reduce((a, c) => a + c.kg, 0);
    if (w + item.kg > capOf(n)) { UI.toast(`${n.name} is loaded full (${capOf(n)} kg)`, 'rust'); return false; }
    State.removeCargo(item.id);
    n.carry.push(item);
    Snd.sfx.pickup();
    return true;
  }
  function take(itemId) {
    const n = companion();
    if (!n) return false;
    const i = n.carry.findIndex(c => c.id === itemId);
    if (i < 0) return false;
    State.addCargo(n.carry.splice(i, 1)[0]);
    return true;
  }

  /* ---------- assists ---------- */
  function assistWobble() {
    const n = companion();
    if (!n || n.hungry) return false;
    if (rand() < (n.skills.bal || 0) * 0.03 + (n.bond ? 0.06 : 0.02)) {
      UI.toast(`${n.name.split(' ')[0]} steadies your pack`, '', 1800);
      Snd.sfx.steady();
      return true;
    }
    return false;
  }
  function struggleBonus() { const n = companion(); return n && !n.hungry ? 1.35 : 1; }
  const SHOVE_LINES = ['Not this one.', 'Back off.', 'Try me instead.', 'Walk away.', 'Wrong pack, friend.'];
  function tryShove() {
    const n = companion();
    if (!n || n.hungry || n.shoveCd > 0) return false;
    n.shoveCd = 9;
    Render.say(n.x, n.y, U.pick(rand, SHOVE_LINES));
    Render.burst(S.px, S.py);
    Snd.sfx.escape();
    return true;
  }
  /* they do not stand and watch: a runner closing on you gets met first */
  function intercept(r) {
    const n = companion();
    if (!n || n.hungry || n.shoveCd > 0) return false;
    if (U.dist(n.x, n.y, r.x, r.y) > 150) return false;
    n.shoveCd = 8;
    const d = Math.max(1, U.dist(r.x, r.y, n.x, n.y));
    r.x += (r.x - n.x) / d * 190; r.y += (r.y - n.y) / d * 190;   // knocked sprawling
    r.cd = 5;
    Render.burst(r.x, r.y);
    Render.say(n.x, n.y, U.pick(rand, SHOVE_LINES));
    Snd.sfx.stumble();
    if (!S.flags.tut.firstIntercept) { S.flags.tut.firstIntercept = true; UI.toast(`<b>${n.name.split(' ')[0]}</b> knocks the scrapper flat. Waylighters walk together for a reason.`, 'gold', 5000); }
    return true;
  }

  function onPorterDeath() {
    const n = companion();
    if (!n) return;
    const stId = nearestConnected(S.px, S.py);
    if (n.carry.length) {
      for (const it of n.carry) S.stations[stId].storage.push(it);
      Systems.addMail(`${n.name} carried it home`, `Everything you handed them waits in ${DATA.stations[stId].name}'s lockers. They waited too, a while.`);
      n.carry = [];
    }
    n.state = 'pool'; n.at = stId;
  }
  function nearestConnected(x, y) {
    let best = 'haven', bd = 1e9;
    for (const id of DATA.stationOrder) {
      if (!S.stations[id].connected) continue;
      const d = U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y);
      if (d < bd) { bd = d; best = id; }
    }
    return best;
  }

  /* ---------- per-frame ---------- */
  function update(dt) {
    const n = companion();
    if (n) {
      if (n.shoveCd > 0) n.shoveCd -= dt;
      // follow: glide toward a point trailing the porter
      const tx = S.px - Math.cos(S.dir) * 42, ty = S.py - Math.sin(S.dir) * 42;
      const d = U.dist(S.compPos.x, S.compPos.y, tx, ty);
      if (d > 6) {
        const sp = Math.min(d * 3, speedOf(n) * 1.6);
        S.compPos.x += (tx - S.compPos.x) / d * sp * dt;
        S.compPos.y += (ty - S.compPos.y) / d * sp * dt;
      }
      // upkeep
      n.fedT -= dt;
      if (n.fedT <= 0) {
        if (S.banked.provisions >= 1) {
          S.banked.provisions -= 1;
          n.fedT = 360 * Porter.eff().upkeepMul;
          if (n.hungry) { n.hungry = false; UI.toast(`${n.name.split(' ')[0]} eats — back in step`); }
        } else if (!n.hungry) {
          n.hungry = true;
          UI.toast(`<b>${n.name}</b> is hungry — no provisions banked. They walk, but won't watch your back.`, 'rust', 6000);
        } else n.fedT = 60;
      }
    }
    // routes
    for (const r of S.npcs) {
      if (r.state !== 'route' || !r.route) continue;
      r.route.t -= dt;
      if (r.route.t <= 0) {
        r.route.t = routeInterval(r);
        if (S.banked.provisions >= 0.5) {
          S.banked.provisions = Math.round((S.banked.provisions - 0.5) * 10) / 10;
          r.route.runs++;
          const likes = 5 + Math.round(((r.skills.foot || 0) + (r.skills.bal || 0)) * 0.8);
          Systems.addStationLikes(r.route.a, likes);
          Systems.addStationLikes(r.route.b, likes);
          State.grantLikes(Math.round(likes * 0.6));
          if (rand() < 0.25) S.banked.metal += 4;
          if (r.route.runs % 4 === 0) UI.toast(`${r.name.split(' ')[0]}'s run: ${DATA.stations[r.route.a].name} ⇄ ${DATA.stations[r.route.b].name} · +${likes} ◆ each end`, '', 3500);
        } else if (!r.hungry) {
          r.hungry = true;
          Systems.addMail(`${r.name}'s route is stalled`, 'No provisions banked. Waylighters cannot eat gratitude.');
          UI.toast(`<b>${r.name}</b>'s route stalled — bank provisions`, 'rust');
        }
        if (r.hungry && S.banked.provisions >= 2) r.hungry = false;
      }
    }
    // pools refresh
    S.poolT = (S.poolT || 0) - dt;
    if (S.poolT <= 0) { S.poolT = 480; refreshPools(); }
    updateEvents(dt);
  }

  /* ---------- events director ---------- */
  function updateEvents(dt) {
    if (S.surgeT > 0) S.surgeT -= dt;
    if (S.stormT > 0) {
      S.stormT -= dt;
      S.weather.state = 'grey'; S.weather.intensity = 1.2; S.weather.t = Math.max(S.weather.t, 5);
      if (S.stormT <= 0) { S.weather.t = 1; UI.toast('The superstorm breaks. The valley exhales.'); }
    }
    if (S.event) {
      const ev = S.event;
      ev.t -= dt;
      if (ev.type === 'rescueWraith') {
        const near = S.wraiths.some(w => w.pinned === ev.id && w.state !== 'burn' && U.dist(w.x, w.y, ev.x, ev.y) < 280);
        if (!near) return resolveRescue('They watched the light take it. Then they wept, briefly, and shouldered their pack.');
      }
      if (ev.type === 'rescueCaptive' && ev.data.stage === 'following') {
        const camp = DATA.camps.find(c => c.id === ev.data.camp);
        if (S.cargo.length > 0) { ev.data.stage = 'waiting'; UI.toast('They freeze — scrappers watch loaded walkers. Come back empty-handed.', 'rust'); }
        else {
          ev.x = U.lerp(ev.x, S.px - Math.cos(S.dir) * 36, Math.min(1, 4 * dt));
          ev.y = U.lerp(ev.y, S.py - Math.sin(S.dir) * 36, Math.min(1, 4 * dt));
          if (U.dist(ev.x, ev.y, camp.x, camp.y) > camp.r + 90) return resolveRescue('Clear of the fires, they finally breathe.');
        }
      }
      if (ev.t <= 0) {
        if (ev.type === 'supplyDrop') UI.toast('The supply drop went quiet — scrappers got there first', 'rust');
        else if (ev.type.startsWith('rescue')) UI.toast('The call for help faded. The Grey keeps its own ledger.', 'rust');
        else if (ev.type === 'peddler') UI.toast('The Peddler\'s lantern dwindles down the road');
        clearEvent();
      }
      return;
    }
    if (Guide.quiet()) return;                     // the first walk is taught, not interrupted
    S.eventCd = (S.eventCd === undefined ? 45 : S.eventCd) - dt;
    if (S.eventCd > 0 || S.cine || S.dead || UI.anyModal()) return;
    if (!S.flags.firstEvent) { S.flags.firstEvent = true; spawnFirstEvent(); }
    else spawnEvent();
    S.eventCd = 150 + rand() * 150;
  }
  function clearEvent() {
    if (S.event && S.event.type === 'rescueWraith') for (const w of S.wraiths) if (w.pinned === S.event.id) w.state = 'burn';
    S.event = null;
  }
  function findSpot(pred, rmin = 500, rmax = 1200, tries = 40) {
    for (let i = 0; i < tries; i++) {
      const a = rand() * 7, d = rmin + rand() * (rmax - rmin);
      const x = S.px + Math.cos(a) * d, y = S.py + Math.sin(a) * d;
      if (x < 200 || y < 200 || x > DATA.W - 200 || y > DATA.H - 200) continue;
      const t = World.terrainAt(x, y);
      if (t.blocked || t.water) continue;
      if (!pred || pred(x, y)) return { x, y };
    }
    return null;
  }
  // the first event is always something you can walk to and profit from
  function spawnFirstEvent() {
    const p = findSpot(null, 380, 700);
    if (!p) return false;
    if (rand() < 0.5) {
      S.event = { id: U.uid(), type: 'peddler', x: p.x, y: p.y, t: 300, data: { stock: peddlerStock() } };
      UI.toast('<b>A lantern sways in the dark nearby — the Peddler.</b> Materials for marvels. Follow the ! on your compass', 'gold', 9000);
    } else {
      S.event = { id: U.uid(), type: 'supplyDrop', x: p.x, y: p.y, t: 240, data: {} };
      UI.toast('<b>A supply drop whistles down close by.</b> Follow the ! on your compass before the scrappers do', 'gold', 9000);
      Snd.sfx.flare();
    }
    return true;
  }
  function spawnEvent() {
    const roll = rand();
    const mk = (type, x, y, data = {}) => {
      S.event = { id: U.uid(), type, x, y, t: EVENTS[type].ttl, data };
      return true;
    };
    if (roll < 0.36) {
      // a rescue
      const kinds = [];
      if (findSpot((x, y) => World.mistAt(x, y) > 0.55, 600, 1400)) kinds.push('rescueWraith');
      const camp = DATA.camps.find(c => !S.camps[c.id].pacified && U.dist(c.x, c.y, S.px, S.py) < 2600);
      if (camp) kinds.push('rescueCaptive');
      kinds.push('rescueInjured', 'rescueStarving');
      const kind = U.pick(rand, kinds);
      const npc = gen({});
      if (kind === 'rescueWraith') {
        const p = findSpot((x, y) => World.mistAt(x, y) > 0.55, 600, 1400);
        if (!p) return false;
        mk(kind, p.x, p.y, { npc });
        for (let i = 0; i < 2; i++) S.wraiths.push({ id: U.uid(), x: p.x + (rand() - 0.5) * 120, y: p.y + (rand() - 0.5) * 120, alert: 0, state: 'drift', cd: 0, ph: rand() * 7, pinned: S.event.id });
        UI.toast(`<b>Someone's pinned by wraiths</b> ${U.fmtDist(U.dist(S.px, S.py, p.x, p.y))} out — light drives them off`, 'rust', 7000);
      } else if (kind === 'rescueCaptive') {
        mk(kind, camp.x + 40, camp.y + 30, { npc, camp: camp.id, stage: 'waiting' });
        UI.toast(`<b>The scrappers at ${camp.name} keep a captive.</b> They ignore walkers carrying nothing.`, 'rust', 7000);
      } else {
        const p = findSpot(null, 500, 1100);
        if (!p) return false;
        mk(kind, p.x, p.y, { npc });
        UI.toast(kind === 'rescueInjured' ? '<b>A Waylighter is down</b> nearby — they need a bandage or salve' : '<b>A drifter is starving</b> nearby — any food will do', 'rust', 7000);
      }
      return true;
    }
    if (roll < 0.51) {
      const p = findSpot(null, 400, 900);
      if (!p) return false;
      mk('supplyDrop', p.x, p.y, {});
      UI.toast('<b>A supply drop whistles down</b> — get there before the scrappers do', 'gold', 6000);
      Snd.sfx.flare();
      return true;
    }
    if (roll < 0.61) {
      if (World.mistBase(S.px, S.py) < 0.3) return false;
      S.surgeT = 120;
      UI.toast('<b>Wraith surge.</b> The Grey leans in — and sheds twice the lumen', 'rust', 6000);
      return mk('surge', S.px, S.py, {}) && (S.event = null, true);
    }
    if (roll < 0.71) {
      UI.toast('<b>The pressure drops. Superstorm coming.</b> Shelter your cargo — and watch the blooms glow', 'rust', 7000);
      S.stormT = 100;
      return true;
    }
    if (roll < 0.86) {
      // peddler on a road or near a station
      let p = null;
      const builtRoads = DATA.roads.filter(r => S.roads[r.id].some(b => b));
      if (builtRoads.length) {
        const r = U.pick(rand, builtRoads);
        const pt = U.polyAt(r.pts, U.polyLen(r.pts) * rand());
        p = { x: pt.x, y: pt.y };
      } else p = findSpot(null, 400, 800);
      if (!p) return false;
      mk('peddler', p.x, p.y, { stock: peddlerStock() });
      UI.toast('<b>A lantern sways on the road — the Peddler.</b> Materials for marvels, while they linger', 'gold', 7000);
      return true;
    }
    // crisis order
    const lit = DATA.stationOrder.filter(id => S.stations[id].connected);
    if (lit.length < 3) return false;
    const from = U.pick(rand, lit);
    const to = U.pick(rand, lit.filter(i => i !== from));
    return Systems.postCrisis(from, to);
  }
  function resolveRescue(flavor) {
    const ev = S.event;
    const npc = ev.data.npc;
    npc.bond = true; npc.feeWaived = true; npc.age = -2;
    npc.state = 'pool'; npc.at = nearestConnected(ev.x, ev.y);
    S.npcs.push(npc);
    State.grantLikes(25);
    Systems.addMail(`${npc.name} owes you their walk`, `${flavor} Find them at ${DATA.stations[npc.at].name} — no fee, ever. Just food.`);
    UI.toast(`<b>${npc.name}</b> saved — they'll wait at ${DATA.stations[npc.at].name}, contract free`, 'gold', 7000);
    Snd.connectionChord();
    S.event = null;
  }
  function eventInteractions(out) {
    const ev = S.event;
    if (!ev) return;
    const d = U.dist(S.px, S.py, ev.x, ev.y);
    if (ev.type === 'rescueInjured' && d < 50) {
      const med = S.cargo.find(c => ['bandage', 'salve'].includes(c.defId));
      if (med) out.push({ key: 'E', label: `Treat <b>${ev.data.npc.name}</b> (${DATA.items[med.defId].name})`, fn: () => { State.removeCargo(med.id); Porter.xp('mend', 18); resolveRescue('The wound closes under your hands.'); } });
      else out.push({ key: 'E', label: 'They need a <b>bandage or salve</b>', fn: () => UI.toast('Fabricate one at any terminal — ceramic and lumen', 'rust') });
    }
    if (ev.type === 'rescueStarving' && d < 50) {
      const food = S.cargo.find(c => DATA.items[c.defId] && DATA.items[c.defId].cat === 'food');
      if (food) out.push({ key: 'E', label: `Feed <b>${ev.data.npc.name}</b> (${DATA.items[food.defId].name})`, fn: () => { State.removeCargo(food.id); Porter.xp('hearth', 14); resolveRescue('They eat like the world is ending gentler now.'); } });
      else out.push({ key: 'E', label: 'They need <b>food</b> — anything', fn: () => UI.toast('Rations print at terminals from provisions', 'rust') });
    }
    if (ev.type === 'rescueCaptive' && ev.data.stage === 'waiting' && d < 60) {
      if (S.cargo.length === 0) out.push({ key: 'E', label: `Lead the captive out — <b>stay empty-handed</b>`, fn: () => { ev.data.stage = 'following'; UI.toast('They fall in behind you, silent as held breath'); } });
      else out.push({ key: 'E', label: 'The captive eyes your cargo — <b>drop everything first</b>', fn: () => UI.toast('Scrappers only chase loaded walkers. Stash your load, come back light.', 'rust') });
    }
    if (ev.type === 'supplyDrop' && d < 50) {
      out.push({ key: 'E', label: 'Crack open the <b>supply drop</b>', fn: () => { lootDrop(); } });
    }
    if (ev.type === 'peddler' && d < 60) {
      out.push({ key: 'E', label: 'Trade with <b>the Peddler</b>', fn: () => UI2.openTrader(ev.data.stock) });
    }
  }
  function lootDrop() {
    const got = [];
    for (let i = 0; i < 3; i++) got.push(rollLoot(['manual', 'gear', 'food', 'mat', 'charm'][Math.floor(rand() * (rand() < 0.3 * Porter.eff().luck ? 5 : 4))]));
    for (const it of got) if (it) State.addCargo(it);
    Porter.xp('sal', 20);
    Snd.sfx.pickup();
    UI.toast(`Salvaged: ${got.filter(Boolean).map(i => i.name).join(' · ')}`, 'gold', 6000);
    S.event = null;
  }

  /* ---------- loot tables ---------- */
  const GEAR_POOL = ['boots_tread', 'boots_cleat', 'coat_wax', 'coat_high', 'pack_wide', 'pack_rig'];
  const JUNK_POOL = ['junk_cog', 'junk_wire', 'junk_lens', 'junk_boot', 'junk_sign', 'junk_lantern', 'junk_rope', 'junk_tin', 'junk_umbrella'];
  const RELIC_POOL = ['relic_photo', 'relic_ring', 'relic_ticket', 'relic_letter', 'relic_chart', 'relic_bird', 'relic_seed'];
  const CHARM_POOL = ['charm_coin', 'charm_feather', 'charm_bell', 'charm_rose', 'charm_draw', 'charm_music'];
  const FOOD_POOL = ['ration', 'trailbread', 'preserves', 'stew', 'lumentea'];
  function rollLoot(kind) {
    if (kind === 'junk') return State.makeItem(U.pick(rand, JUNK_POOL));
    if (kind === 'relic') return State.makeItem(U.pick(rand, RELIC_POOL));
    if (kind === 'charm') return State.makeItem(U.pick(rand, CHARM_POOL));
    if (kind === 'food') return State.makeItem(U.pick(rand, FOOD_POOL));
    if (kind === 'gear') return State.makeItem(U.pick(rand, GEAR_POOL));
    if (kind === 'manual') {
      const sid = U.pick(rand, CHAR.SKILL_IDS);
      const vol = rand() < 0.55 ? 1 : rand() < 0.7 ? 2 : 3;
      return State.makeItem(`man_${sid}${vol}`);
    }
    if (kind === 'mat') {
      const it = State.makeItem(U.pick(rand, ['metal', 'ceramic', 'metal', 'lumen']));
      return it;
    }
    return null;
  }
  function lootRuin(ruin) {
    const def = RUIN_TYPES[ruin.type];
    const got = [];
    const luck = Porter.eff().luck;
    for (let i = 0; i < def.rolls; i++) {
      let r = rand() * 100;
      if (luck > 1 && rand() < 0.3) r *= 0.75; // lean toward the rarer end
      let acc = 0, kind = 'junk';
      for (const [k, w] of def.table) { acc += w; if (r < acc) { kind = k; break; } }
      const it = rollLoot(kind);
      if (it) got.push(it);
      Porter.xp('sal', 12);
    }
    ruin.looted = true;
    return got;
  }
  function seedRuins(rng) {
    S.ruins = [];
    // hand-placed ruins on the early routes — the first ten minutes must pass a story or two
    const early = [
      { type: 'cottage', x: 4620, y: 9640 }, { type: 'caravan', x: 3350, y: 9560 }, { type: 'post', x: 4330, y: 8980 },
      { type: 'watchpost', x: 5330, y: 8740 }, { type: 'camp', x: 2900, y: 9900 }, { type: 'cottage', x: 5700, y: 9250 },
      { type: 'camp', x: 3880, y: 10320 }, { type: 'post', x: 4780, y: 10260 },
    ];
    for (const e of early) {
      let x = e.x, y = e.y, okp = !World.terrainAt(x, y).blocked && !World.terrainAt(x, y).water;
      for (let k = 0; k < 24 && !okp; k++) { const a = k * 0.8, r = 40 + k * 25; x = e.x + Math.cos(a) * r; y = e.y + Math.sin(a) * r; const t = World.terrainAt(x, y); okp = !t.blocked && !t.water; }
      if (okp) S.ruins.push({ id: U.uid(), type: e.type, x, y, looted: false, seed: (rng() * 1e9) | 0 });
    }
    const spread = [...RUIN_SPREAD, 'cottage', 'caravan', 'camp', 'post', 'watchpost', 'shrine',
      'cottage', 'caravan', 'camp', 'watchpost', 'cottage', 'post', 'camp', 'caravan', 'shrine', 'cottage', 'watchpost'];
    let tries = 0;
    const target = S.ruins.length + spread.length;
    while (S.ruins.length < target && tries++ < 900) {
      const x = 350 + rng() * (DATA.W - 700), y = 350 + rng() * (DATA.H - 700);
      const t = World.terrainAt(x, y);
      if (t.blocked || t.water) continue;
      if (DATA.stationOrder.some(id => U.dist(x, y, DATA.stations[id].x, DATA.stations[id].y) < 520)) continue;
      if (S.ruins.some(r => U.dist(x, y, r.x, r.y) < 600)) continue;
      const type = spread[Math.min(spread.length - 1, Math.max(0, S.ruins.length - 6))];
      if (type === 'shrine' && World.mistBase(x, y) < 0.45) continue; // shrines belong to the dark
      S.ruins.push({ id: U.uid(), type, x, y, looted: false, seed: (rng() * 1e9) | 0 });
    }
  }

  /* ---------- the Peddler ---------- */
  function peddlerStock() {
    const stock = [];
    const man1 = rollLoot('manual'), man2 = rollLoot('manual');
    stock.push({ item: man1, cost: { metal: 40, ceramic: 30 } });
    stock.push({ item: man2, cost: { metal: 40, ceramic: 30 } });
    stock.push({ item: State.makeItem(U.pick(rand, CHARM_POOL)), cost: { lumen: 18 } });
    stock.push({ item: State.makeItem(U.pick(rand, GEAR_POOL)), cost: { metal: 70, ceramic: 40 } });
    stock.push({ item: State.makeItem('stew'), cost: { provisions: 4 } });
    stock.push({ item: State.makeItem('salve'), cost: { ceramic: 3, lumen: 2 } });
    return stock;
  }

  return {
    gen, companion, capOf, speedOf, refreshPools, seedStarterPool, hire, hireCost, dismiss, assignRoute, routeSlots, routesActive,
    give, take, assistWobble, struggleBonus, tryShove, intercept, onPorterDeath, update, eventInteractions, lootRuin, seedRuins, rollLoot, peddlerStock, nearestConnected, clearEvent,
  };
})();
