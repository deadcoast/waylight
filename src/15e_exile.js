'use strict';
/* Waylight v3.30 — THE EXILE ROADS: Shutterlight, the Nomads' own city, out past every map.
   The v3.25 lore made a promise ("somewhere out past the maps the exiles even found a city");
   this module keeps it, on the systems already standing: the Darklands table carries the pins
   (v3.26/28), the Lamplighter arc gates the reveal (v3.25 — the exiles find YOU, no Farkeeper
   rider charts them), the wage-law grammar runs the guild contracts, the karma ledger colors the
   quiet work, the party of four (v3.24) and the rifle (v3.25) gate mercenary work HONESTLY, and
   the C-series arsenal (FACT.RIFLES) tiers the one fire path. The city's dead route to THE
   HOODED ROW on the shared memorial architecture (v3.29) — the variant this version owed.

   Phases: hidden → marked (a mark nobody made appears on the table) → following (a hooded guide
   leads, on the follow clock) → open (the exchange and the guild stand). The COLD DOOR reveals
   at guild rank 3; a knock opens the C20 shelf. */

const Exile = (() => {
  const T = () => DATA.T;
  const rand = () => Math.random();

  /* ---------- the guild's book: contracts on the wage-law grammar ---------- */
  const CONTRACTS = {
    ridgewatch: {
      name: 'Ridge watch', dur: 120, pay: { likes: 40, metal: 10 },
      line: 'Sit a ridge over a lane the Nomads care about. Nothing happens, and that is the product.',
    },
    caravangun: {
      name: 'Caravan gun', dur: 180, pay: { metal: 25, a338: 2 },
      line: 'Ride shotgun over freight the exiles will not name. The pay is honest even if the manifest is not.',
    },
    quietcollection: {
      name: 'Quiet collection', dur: 150, pay: { likes: 25, a338: 3 }, renegade: 1,
      line: 'A debt walks back to Shutterlight. You are the reminder. The road\'s other ledger takes a line.',
    },
  };

  function ex() {
    S.exile = S.exile || {
      phase: 'hidden', t: 0, dur: 0,
      guild: { done: 0, active: null },
      stock: { a338: T().a338Stock, cycleT: 0 },
      door: 'hidden',
    };
    return S.exile;
  }
  const phase = () => (S && S.exile && S.exile.phase) || 'hidden';
  const visible = id => id === 'shutterlight' ? phase() !== 'hidden' : id === 'colddoor' ? (S && S.exile && S.exile.door !== 'hidden') : false;
  const rank = () => { const d = (S.exile && S.exile.guild.done) || 0; return d >= T().exRank3 ? 3 : d >= T().exRank2 ? 2 : 1; };
  const rifleDef = () => FACT.RIFLES[(S.gear && S.gear.rifleTier) || 'c14'];

  /* ---------- the reveal: the exiles find YOU ---------- */
  function tick(dt) {
    if (!S) return;
    const e = ex();
    if (e.phase === 'hidden' && (S.flags.lamp || S.flags.lampClass)) {
      e.phase = 'marked';
      Systems.addMail('A mark nobody made', 'Charcoal on the Darklands table\'s frame, drawn while the room was empty: a hooded lantern, and a line walking off the paper\'s north-west edge. No Farkeeper will ride toward it. The Farkeepers say it is nothing. They say it too quickly.');
      UI.toast('Something new on the <b>Darklands table</b> — a mark nobody made', 'gold', 8000);
    }
    if (e.phase === 'following') {
      e.t += dt;
      if (e.t >= e.dur) {
        e.phase = 'open';
        Systems.addMail('SHUTTERLIGHT', 'A city with its shutter down: lamplit streets you cannot see until you are IN them, hide tarps over iron roofs, and more people than anyone admits — in every reach of the world, and here, home. The guide lifted one hood-flap at the gate: "You carried the light wrong-side-out like us once. Trade fair and the shutter stays open to you."');
        UI.toast('<b>SHUTTERLIGHT</b> stands open to you — the exiles\' own city, on the table\'s far edge', 'gold', 9000);
        Snd.sfx.levelup && Snd.sfx.levelup();
        Systems.tut && Systems.tut('firstExile');
        if (typeof Memorial !== 'undefined' && Memorial.revealGround) Memorial.revealGround('lamplighters');
        State.save();
      }
    }
    if (e.phase === 'open') {
      // the exchange restocks on its cycle
      e.stock.cycleT = (e.stock.cycleT || 0) + dt;
      if (e.stock.cycleT >= T().a338Cycle) { e.stock.cycleT = 0; e.stock.a338 = T().a338Stock; }
      // the active contract runs its clock
      const a = e.guild.active;
      if (a) {
        a.t += dt;
        if (!a.hazRolled && a.t >= a.dur / 2) {
          a.hazRolled = true;
          if (rand() < T().exHazard) { a.hazarded = true; }
        }
        if (a.t >= a.dur) resolveContract(e, a);
      }
      // rank 3 turns the cold door's corner of the table
      if (rank() >= 3 && e.door === 'hidden') {
        e.door = 'seen';
        Systems.addMail('THE COLD DOOR', 'North of even Shutterlight, the Nomads keep a door in a hillside — old-world concrete, a raised tongue stenciled over the lintel, hundreds of years of cold behind it. The guild says the Society answers a knock now. Something about the cold. Something about the water.');
        UI.toast('The guild marks <b>THE COLD DOOR</b> on the table — the Society answers a knock now', 'gold', 8000);
      }
    }
  }
  function follow() {
    const e = ex();
    if (e.phase !== 'marked') return false;
    e.phase = 'following'; e.t = 0; e.dur = T().exFollowDur;
    UI.toast('You follow the mark off the table\'s edge — a hooded figure falls in ahead of you, never looking back', 'gold', 7000);
    Systems.addMail('The guide', 'They set a pace that assumes you keep it and take a line no survey would draw — under, around, through. Twice you lose them; twice a hooded lantern opens one shutter\'s worth, exactly long enough.');
    Snd.sfx.accept();
    return true;
  }

  /* ---------- the exchange ---------- */
  function buyRounds(n = 1) {
    const e = ex();
    if (e.phase !== 'open') return false;
    n = Math.min(n, e.stock.a338);
    if (n <= 0) { UI.toast('The exchange is out of .338 this cycle — the Nomads collect rifles, not brass', 'rust', 5000); return false; }
    const cost = n * T().a338Cost;
    if ((S.banked.metal || 0) < cost) { UI.toast(`Rounds run <b>${T().a338Cost} metal</b> apiece — the exchange wants ${cost} banked`, 'rust', 5000); return false; }
    S.banked.metal -= cost;
    e.stock.a338 -= n;
    S.gear.ammo338 = (S.gear.ammo338 || 0) + n;
    UI.toast(`<b>${n} × .338</b> across the counter — ${cost} metal. The pack rides heavier and better`, 'gold', 5000);
    Snd.sfx.pickup();
    return true;
  }
  function buyRifle(id) {
    const e = ex(), def = FACT.RIFLES[id];
    if (e.phase !== 'open' || !def || !def.cost) return false;
    if (!S.gear.rifle) { UI.toast('The exchange sells to RIFLE hands — shoulder a Timberwolf first (the exiles\' arc opens it)', 'rust', 6000); return false; }
    if (rank() < def.rank) { UI.toast(`The ${def.name} shelf opens at guild standing <b>${def.rank}</b> — work the contracts`, 'rust', 6000); return false; }
    if (def.door && e.door !== 'opened') { UI.toast('The C20 crates sit behind THE COLD DOOR — knock first', 'rust', 6000); return false; }
    if ((S.gear.rifleTier || 'c14') === id) { UI.toast(`The ${def.name} already rides your pack`, '', 4000); return false; }
    if (!State.canAfford(def.cost)) { UI.toast(`The ${def.name} wants <b>${Systems.fmtCost(def.cost)}</b> banked`, 'rust', 5000); return false; }
    State.pay(def.cost);
    S.gear.rifleTier = id;
    UI.toast(`The <b>${def.name}</b> comes across the counter — ${def.line}`, 'gold', 8000);
    Systems.addMail(`The ${def.name}`, `${def.line[0].toUpperCase() + def.line.slice(1)}. The Timberwolf goes back to the wall for the next exile who needs one — that is how the Nomads have rifles at all.`);
    Snd.sfx.levelup && Snd.sfx.levelup();
    State.save();
    return true;
  }

  /* ---------- the guild ---------- */
  function canWork() { return !!(S.gear && S.gear.rifle) && NPC.party().length >= 2; }
  function takeContract(kind) {
    const e = ex(), def = CONTRACTS[kind];
    if (e.phase !== 'open' || !def || e.guild.active) return false;
    if (!canWork()) { UI.toast('Guild work wants a <b>rifle</b> on your back and a <b>party of two</b> at it — the Nomads do not hire the underequipped to die', 'rust', 7000); return false; }
    e.guild.active = { kind, t: 0, dur: def.dur, hazRolled: false, hazarded: false };
    UI.toast(`Contract taken: <b>${def.name}</b> — ${def.line}`, 'gold', 7000);
    Snd.sfx.accept();
    return true;
  }
  function resolveContract(e, a) {
    const def = CONTRACTS[a.kind];
    e.guild.active = null;
    e.guild.done++;
    const half = a.hazarded;
    const pay = {};
    for (const [k, v] of Object.entries(def.pay)) pay[k] = half ? Math.max(1, Math.floor(v / 2)) : v;
    if (pay.likes) State.grantLikes(pay.likes);
    if (pay.metal) State.bank('metal', pay.metal);
    if (pay.a338) S.gear.ammo338 = (S.gear.ammo338 || 0) + pay.a338;
    if (def.renegade) Systems.addRenegade ? Systems.addRenegade(def.renegade) : null;
    const payLine = Object.entries(pay).map(([k, v]) => `${v} ${k === 'a338' ? '× .338' : k === 'likes' ? '◆' : k}`).join(' · ');
    if (half) Systems.addMail(`${def.name} — it went loud`, `It was not supposed to go loud. It went loud. The guild pays half on loud (${payLine}) and asks no questions it already knows the answers to. Standing holds: the work got done.`);
    UI.toast(half ? `<b>${def.name}</b> went LOUD — half pay: ${payLine}` : `<b>${def.name}</b> done clean — <b>${payLine}</b> · guild standing ${e.guild.done}`, half ? 'rust' : 'gold', 7000);
    Snd.sfx.accept();
  }

  /* ---------- the cold door ---------- */
  function knock() {
    const e = ex();
    if (e.door !== 'seen') return false;
    e.door = 'opened';
    Myth.microCine && Myth.microCine(S.px, S.py, 'The door opens on the third knock. A raised tongue: "Bienvenue. You would be the rifle the Nomads vouch for."', { col: '143,176,138' });
    Systems.addMail('Past the cold door', 'Steel racks to the dark\'s edge: carbines with the red leaf, bolt rifles in cosmoline, bullion crates fit to stop a battering ram. They will not sell the racks. They will sell what the Nomads vouch for — and they wrote your SBSN in a ledger nobody has opened in three hundred years, under CAREER ASSIGNMENT: "as observed."', );
    UI.toast('THE COLD DOOR opens — the C20 shelf stands behind it', 'gold', 8000);
    State.save();
    return true;
  }

  /* ---------- the desk on the Darklands table ---------- */
  function renderDesk(el, id) {
    const e = ex();
    const bankRow = `<div class="fdBank">BANKED · metal <b>${Math.floor(S.banked.metal || 0)}</b> · ceramic <b>${Math.floor(S.banked.ceramic || 0)}</b> · wood <b>${Math.floor(S.banked.wood || 0)}</b> · .338 in pack <b>${S.gear.ammo338 || 0}</b></div>`;
    let head = '', body = '';
    if (id === 'colddoor') {
      head = '[ THE COLD DOOR ]';
      body = e.door === 'opened'
        ? `<div class="fdLine">Open. The Society answers — in the raised tongue, correct to the syllable.</div><div class="fdLine dim">The C20 shelf stands at Shutterlight's exchange now, for guild standing 3.</div>
           <button class="fdBtn" data-act="inside">STEP INSIDE — the entry hall knows you now</button>`
        : `<div class="fdLine">Old-world concrete in a hillside north of even Shutterlight. Hundreds of years of cold behind it.</div>
           <button class="fdBtn" data-act="knock">KNOCK</button>`;
    } else {
      head = '[ SHUTTERLIGHT ]';
      if (e.phase === 'marked') {
        body = `<div class="fdLine">A hooded lantern, charcoaled by no hand anyone saw, and a line walking off the paper's edge.</div>
          <div class="fdLine dim">No rider will chart this. The exiles find YOU — and they already did, once, on a dark road.</div>
          <button class="fdBtn" data-act="follow">FOLLOW THE MARK</button>`;
      } else if (e.phase === 'following') {
        body = `<div class="fdLine">The guide is ahead of you — <b>${Math.round((e.t / e.dur) * 100)}%</b> of a road no survey will ever hold.</div>`;
      } else if (e.phase === 'open') {
        const rk = rank(), a = e.guild.active;
        const rifleRows = Object.entries(FACT.RIFLES).filter(([, d]) => d.cost).map(([rid, d]) => {
          const owned = (S.gear.rifleTier || 'c14') === rid;
          const gate = owned ? 'ON YOUR BACK' : rk < d.rank ? `GUILD ${d.rank} WANTED` : (d.door && e.door !== 'opened') ? 'BEHIND THE COLD DOOR' : null;
          return gate
            ? `<div class="fdLine dim">${d.name} — ${gate}</div>`
            : `<button class="fdBtn" data-act="rifle:${rid}">${d.name} — ${Object.entries(d.cost).map(([k, v]) => `${v} ${k}`).join(' · ')}</button>`;
        }).join('');
        const work = a
          ? `<div class="fdLine">Under contract: <b>${CONTRACTS[a.kind].name}</b> — ${Math.round((a.t / a.dur) * 100)}%${a.hazarded ? ' · IT WENT LOUD' : ''}</div>`
          : canWork()
            ? Object.entries(CONTRACTS).map(([k, d]) => `<button class="fdBtn" data-act="work:${k}">${d.name.toUpperCase()} — ${Object.entries(d.pay).map(([pk, pv]) => `${pv} ${pk === 'a338' ? '× .338' : pk === 'likes' ? '◆' : pk}`).join(' · ')}${d.renegade ? ' · the other ledger' : ''}</button>`).join('')
            : `<div class="fdLine dim">Guild work wants a RIFLE on your back and a PARTY OF TWO at it. The Nomads do not hire the underequipped to die.</div>`;
        body = `<div class="fdLine">The shutter is open to you. Guild standing <b>${rk}</b> · contracts done <b>${e.guild.done}</b> · rifle: <b>${rifleDef().name}</b>.</div>
          <button class="fdBtn" data-act="guild">STEP INSIDE — the guild room: the board, the counter, the lantern</button>
          ${bankRow}
          <div class="fdLine dim">THE EXCHANGE — .338 in stock this cycle: <b>${e.stock.a338}</b> at ${T().a338Cost} metal apiece</div>
          <button class="fdBtn" data-act="rounds">BUY .338 × ${Math.min(3, e.stock.a338) || 0}</button>
          ${rifleRows}
          <div class="fdLine dim" style="margin-top:8px">THE GUILD — the quiet work, posted</div>
          ${work}`;
      }
    }
    el.innerHTML = `<div class="fdHead"><span>${head}</span><button class="fdX" data-act="close">✕</button></div>${body}`;
  }
  function deskAct(act, id) {
    if (act === 'follow') return follow();
    if (act === 'knock') return knock();
    if (act === 'inside') {   // v3.32: the door opened — the hall is WALKED now, not described
      if (typeof Continent !== 'undefined' && Continent.close) Continent.close();
      UI.toggleMap(false);
      return typeof Republic !== 'undefined' && Republic.enterRoom('diefenbunker');
    }
    if (act === 'guild') {    // v3.34: the guild room is WALKED — board, counter, the hooded lantern
      if (typeof Continent !== 'undefined' && Continent.close) Continent.close();
      UI.toggleMap(false);
      return typeof Republic !== 'undefined' && Republic.enterRoom('shutterlight_guild');
    }
    if (act === 'rounds') return buyRounds(3);
    if (act.startsWith('rifle:')) return buyRifle(act.slice(6));
    if (act.startsWith('work:')) return takeContract(act.slice(5));
    return false;
  }

  return { phase, visible, rank, rifleDef, tick, follow, buyRounds, buyRifle, canWork, takeContract, knock, renderDesk, deskAct };
})();
