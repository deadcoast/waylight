'use strict';
/* Waylight v3.28 — THE FRONTIER: recon & outposts, the Frostpunk law on the Darklands table.
   The two uncharted pins (the Salt Flats, Low Marrow) become MISSIONS: fund a Farkeeper recon
   rider from a stable town and the map fills in behind them; a charted region takes an OUTPOST —
   a far works cluster that hauls what the valley can't make into the same bank the v3.27
   ecosystem revolves through. Caravans walk dark roads: unguarded hauls roll raid dice, and a
   Farkeeper ESCORT CONTRACT (provisions per cycle — the wage law, same as every other pair of
   hands) buys the mountain walking beside them. Everything lands as earn chips; everything reads
   from the table's own columns. Leans on: the banked economy (v3.18), the wage law (v3.20), the
   Republic's muscle (v3.22), the ecosystem loop (v3.27), the Darklands table (v3.26). */

const Frontier = (() => {
  const T = () => DATA.T;
  const rand = () => Math.random();

  /* the reaches: what recon finds, what an outpost there hauls, in the register's voice */
  const REACHES = {
    saltflats: {
      name: 'THE SALT FLATS',
      outpost: 'PANHOUSE STATION',
      yields: { ceramic: 'outpostHaul', provisions: 'outpostAlt' },
      yieldLine: 'salt-pan slabs + cured stores',
      chartMail: ['The Salt Flats are CHARTED', 'A sea that forgot itself — leagues of white pan, hard as fired clay, and brine pools that cure a haunch better than any smokehouse. The rider staked the survey line and rode home caked to the shoulder. The table will take an outpost there now: pan-cut slabs walk like ceramic, and the cured stores walk like provisions.'],
      standMail: ['PANHOUSE STATION stands', 'Three sheds and a wind-scoured cookhouse on the white. The pan-cutters send their first caravan with the tide of the season behind it. Every cycle, the haul walks: slabs for the kilns, cured stores for the road.'],
    },
    lowmarrow: {
      name: 'LOW MARROW',
      outpost: 'MARROW DIGGINGS',
      yields: { metal: 'outpostHaul', lumen: 'outpostAlt' },
      yieldLine: 'bog-iron + marrow-light',
      chartMail: ['Low Marrow is CHARTED', 'Older roads than ours, sunk to the hubs in black water — and under the water, BOG IRON in ropes a hand thick. The rider marked seams the old world never finished. Stranger: the marsh lights don\'t flee a lantern here. They pool. An outpost could bottle that.'],
      standMail: ['MARROW DIGGINGS stands', 'Duckboard streets over the black water and a rake-house for the iron ropes. The diggers walk iron out every cycle — and the bottled marsh-light rides the same cart, glowing through the canvas.'],
    },
  };

  /* transient per-region state lives on the SAVE (S.frontier) — phases:
     unknown → riding (t/dur, hazard rolled once at the midpoint) → charted → building → outpost */
  function st(id) {
    S.frontier = S.frontier || {};
    return S.frontier[id] = S.frontier[id] || { phase: 'unknown' };
  }
  const RIDER_F = ['Ulfar', 'Brenna', 'Skarde', 'Halla', 'Jorund', 'Eir', 'Ragnvald', 'Sigrun'];
  const RIDER_L = ['Stonejaw', 'Coldbrook', 'Ironthigh', 'Longwinter', 'Hardmark', 'Greymantle'];

  const canAfford = cost => Object.entries(cost).every(([k, v]) => (S.banked[k] || 0) >= v);
  const pay = cost => { for (const [k, v] of Object.entries(cost)) S.banked[k] -= v; };
  const stableTown = () => Object.keys(FACT.STABLES).find(id => S.stations[id] && S.stations[id].connected);

  /* ---------- the orders ---------- */
  function fundRecon(id) {
    const r = st(id), reach = REACHES[id];
    if (!reach || r.phase !== 'unknown') return false;
    const stab = stableTown();
    if (!stab) { UI.toast('Recon wants a RIDER — light a town with a stable first', 'rust', 5000); return false; }
    if (!canAfford(T().reconHire)) { UI.toast(`The recon ride wants <b>${Systems.fmtCost(T().reconHire)}</b> banked — kit, shoes, and trail feed`, 'rust', 5000); return false; }
    pay(T().reconHire);
    r.phase = 'riding'; r.t = 0; r.dur = T().reconHazardDelay * 2; r.hazarded = false; r.hazRolled = false;
    r.rider = U.pick(rand, RIDER_F) + ' ' + U.pick(rand, RIDER_L);
    UI.toast(`<b>${r.rider}</b> takes a ${FACT.HORSES[FACT.STABLES[stab]].name} out of ${DATA.stations[stab].name} — bound past the table's edge for <b>${reach.name}</b>`, 'gold', 7000);
    Systems.addMail(`A rider goes out — ${reach.name}`, `${r.rider}, Farkeeper, mounted and provisioned from ${DATA.stations[stab].name}. Recon runs itself: the map fills in behind them. The mountain does not send riders it expects to lose.`);
    Snd.sfx.accept();
    Systems.tut && Systems.tut('firstRecon');
    return true;
  }
  function fundOutpost(id) {
    const r = st(id), reach = REACHES[id];
    if (!reach || r.phase !== 'charted') return false;
    if (!canAfford(T().outpostCost)) { UI.toast(`The founding caravan wants <b>${Systems.fmtCost(T().outpostCost)}</b> banked`, 'rust', 5000); return false; }
    pay(T().outpostCost);
    r.phase = 'building'; r.t = 0; r.dur = T().outpostCycle / 2;
    UI.toast(`The founding caravan rolls for <b>${reach.name}</b> — ${reach.outpost} goes up where the rider staked it`, 'gold', 7000);
    Snd.sfx.build();
    return true;
  }
  function toggleGuard(id) {
    const r = st(id);
    if (r.phase !== 'outpost') return false;
    r.guard = !r.guard;
    UI.toast(r.guard
      ? `A Farkeeper escort takes the ${REACHES[id].outpost} road — <b>${T().contractCost} provisions</b> a cycle, and the mountain walks beside every haul`
      : `The escort contract at ${REACHES[id].outpost} is let go — the caravans walk the dark roads alone`, r.guard ? 'gold' : '', 6000);
    Snd.sfx.ui && Snd.sfx.ui();
    return true;
  }

  /* ---------- the clock ---------- */
  function tick(dt) {
    if (!S) return;
    for (const id of Object.keys(REACHES)) {
      const r = (S.frontier && S.frontier[id]);
      if (!r) continue;
      const reach = REACHES[id];
      if (r.phase === 'riding') {
        r.t += dt;
        if (!r.hazRolled && r.t >= T().reconHazardDelay) {
          r.hazRolled = true;
          if (rand() < T().reconHazard) {
            r.hazarded = true; r.dur += T().reconHazardDelay;
            Systems.addMail(`${r.rider} has gone quiet`, `Past the table's edge there is no wire to carry word. The mountain's counsel: a rider who misses one check-in is riding around something, not under it. The survey runs late, not lost.`);
            UI.toast(`<b>${r.rider}</b> has gone quiet past the edge of the table — the survey runs late`, 'rust', 6000);
          }
        }
        if (r.t >= r.dur) {
          r.phase = 'charted';
          if (r.hazarded) Systems.addMail(`${r.rider} rides back in`, `Led the horse the last league — a thrown shoe and a detour around ground that "didn't want walking on." The survey came home complete. The mountain does not lose riders to weather.`);
          Systems.addMail(reach.chartMail[0], reach.chartMail[1]);
          UI.toast(`<b>${reach.name}</b> is CHARTED — the Darklands table will take an outpost there`, 'gold', 8000);
          Snd.sfx.levelup && Snd.sfx.levelup();
          S.flags.reconDone = true;
        }
      } else if (r.phase === 'building') {
        r.t += dt;
        if (r.t >= r.dur) {
          r.phase = 'outpost'; r.cyc = 0; r.hauls = 0; r.raids = 0; r.guard = false;
          Systems.addMail(reach.standMail[0], reach.standMail[1]);
          UI.toast(`<b>${reach.outpost}</b> stands — the first haul is on the road`, 'gold', 8000);
          Snd.sfx.build();
          Systems.tut && Systems.tut('firstOutpost');
        }
      } else if (r.phase === 'outpost') {
        r.cyc = (r.cyc || 0) + dt;
        if (r.cyc >= T().outpostCycle) {
          r.cyc = 0;
          resolveHaul(id, r, reach);
        }
      }
    }
  }
  function resolveHaul(id, r, reach) {
    /* the escort wage first — the wage law: no provisions, no mountain */
    let guarded = false;
    if (r.guard) {
      if ((S.banked.provisions || 0) >= T().contractCost) { S.banked.provisions -= T().contractCost; guarded = true; }
      else { r.guard = false; UI.toast(`The ${reach.outpost} escort went unpaid — the contract lapses and the caravan walks alone`, 'rust', 6000); }
    }
    const haul = {};
    for (const [k, cname] of Object.entries(reach.yields)) haul[k] = T()[cname];
    let raided = false;
    if (!guarded && rand() < T().raidOdds) {
      raided = true; r.raids = (r.raids || 0) + 1;
      for (const k of Object.keys(haul)) haul[k] = Math.max(0, Math.floor(haul[k] / 2));
      if (r.raids === 1) Systems.addMail(`The ${reach.outpost} caravan was hit`, `Scrappers on the dark road — half the haul gone into the grey. The drivers walked away; freight doesn't bleed. The Farkeepers put a price on an escort for exactly this arithmetic.`);
    }
    for (const [k, v] of Object.entries(haul)) if (v > 0) State.bank(k, v);
    r.hauls = (r.hauls || 0) + 1;
    S.eco = S.eco || { produced: {} };
    S.eco.produced.outpost = (S.eco.produced.outpost || 0) + Object.values(haul).reduce((a, b2) => a + b2, 0);
    const near = U.dist(S.px, S.py, DATA.stations.haven.x, DATA.stations.haven.y) < 1400;
    if (raided) UI.toast(`The ${reach.outpost} caravan limps in <b>RAIDED</b> — half the haul lost on the dark road`, 'rust', 6000);
    else if (near || (r.hauls % 3 === 1)) UI.toast(`The ${reach.outpost} caravan walks in — <b>${Object.entries(haul).map(([k, v]) => `${v} ${k}`).join(' + ')}</b> banked${guarded ? ' · the mountain walked beside it' : ''}`, 'gold', 5000);
  }

  /* ---------- read APIs for the table and the sheet ---------- */
  function phase(id) { return (S && S.frontier && S.frontier[id] && S.frontier[id].phase) || 'unknown'; }
  function info(id) { const r = (S && S.frontier && S.frontier[id]) || { phase: 'unknown' }; return { ...r, reach: REACHES[id] }; }
  function progress(id) { const r = S && S.frontier && S.frontier[id]; return r && r.dur ? U.clamp((r.t || 0) / r.dur, 0, 1) : 0; }
  function counts() {
    let riding = 0, charted = 0, outposts = 0, hauls = 0, raids = 0;
    if (S && S.frontier) for (const id of Object.keys(REACHES)) {
      const r = S.frontier[id]; if (!r) continue;
      if (r.phase === 'riding') riding++;
      if (r.phase === 'charted' || r.phase === 'building' || r.phase === 'outpost') charted++;
      if (r.phase === 'outpost') { outposts++; hauls += r.hauls || 0; raids += r.raids || 0; }
    }
    return { riding, charted, outposts, hauls, raids };
  }

  return { REACHES, fundRecon, fundOutpost, toggleGuard, tick, phase, info, progress, counts };
})();
