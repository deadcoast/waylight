'use strict';
/* Waylight v3.22 — THE REPUBLIC: factions, diplomacy defaults, Farkeeper classes, horse breeds,
   and the renegade trade. Every faction carries a CULTURE and a PALETTE — identity first, per the
   standing law. Deep faction play (rebellions, force, the mountain door) builds on this data.
   live: the banner stands IN THE FIELD (a presence, a rising, a door) — v3.35 makes the court read
   it; the Iron Giants stay a rumour until a sighting is more than a shape over the mist. */

const FACT = (() => {
  /* ---------- the karma ledger ---------- */
  const RENEGADE_TIERS = [
    [0, 'Clean Hands', 'the road knows nothing about you worth whispering'],
    [8, 'Grey Hand', 'fixers nod; the quiet work finds you'],
    [20, 'Road\'s Own', 'raider camps keep their claim short around you — respect, of a kind'],
    [40, 'Free Walker', 'the valley\'s other economy treats you as weather: inevitable'],
  ];

  /* ---------- factions ---------- */
  const FACTIONS = {
    waylight: {
      name: 'Waylight', people: 'Waylighters', live: true,
      culture: 'The rebirth of civilization: connection, warmth, love, loyalty, trust. They bring the light and they carry the letters. They do not carry the weapons — not any more.',
      pal: { A: '#ffd98f', B: '#f2ead4' }, stance: 'ABSOLUTE_ALLY',
    },
    farkeep: {
      name: 'Farkeep', people: 'Farkeepers', live: true,
      culture: 'A larger, fiercely loyal mountain people — ancient men hardened by a climate neither man nor beast could face: elongated thighs, broadened chests, jaws of iron. NOT giants. They descended when the Waylighters fed the Farlands famine, saw the light, changed their ways — but not their nature. They are the Republic\'s muscle: they equip the weapons, protect the society, quell the rebellions of Renegades, silence the light of towns lost to darkness — and they can take towns by force.',
      pal: { A: '#8d979c', B: '#5a6a7a' }, stance: 'ABSOLUTE_ALLY',
    },
    raiders: {
      name: 'The Raiders', people: 'Scrappers', live: true,
      culture: 'The camps. Not a nation — a habit with knives. They respect exactly one thing: a walker the road itself seems to keep. Renegade standing is legible to them the way a coat of the Order never will be.',
      pal: { A: '#d96b4f', B: '#5a3a2a' }, stance: 'HOSTILE',
    },
    reapers: {
      name: 'The Reapers', people: 'Reapers', live: true,
      culture: 'They walk INTO the grey on purpose and come back wrong. They believe the quiet is owed its harvest and appoint themselves the scythe. No parley. No price.',
      pal: { A: '#9aa4ff', B: '#2a3048' }, stance: 'ABSOLUTE_HOSTILE',
    },
    cannibals: {
      name: 'The Hollow Fires', people: 'Cannibals', live: true,
      culture: 'Famine made them; the habit kept them. Their fires smell wrong and their larders are not discussed. Shoot on sight is not policy — it is mercy.',
      pal: { A: '#c25038', B: '#3a1e1e' }, stance: 'ABSOLUTE_HOSTILE',
    },
    rebels: {
      name: 'The Unlit', people: 'Rebels', live: true,
      culture: 'Renegades with a doctrine: that the wire is a leash and the Order a landlord. Some towns listen. When one goes dark BY CHOICE, the Farkeepers are sent.',
      pal: { A: '#e0a05e', B: '#4a3320' }, stance: 'WARY',
    },
    flamekeepers: {
      name: 'The Flame Keepers', people: 'Flame Keepers', live: true,
      culture: 'They hold that light must be FED, not wired — every lamp a shrine, every generator a blasphemy. They do not hate the Republic. They pity it, with torches.',
      pal: { A: '#ffb54f', B: '#642a2a' }, stance: 'WARY',
    },
    irongiants: {
      name: 'The Iron Giants', people: 'Iron Giants', live: false,
      culture: 'Nobody has seen one and lived close enough to describe it well. Machine-shapes in the far grey, older than the quiet. The Farkeepers sharpen accordingly.',
      pal: { A: '#8a8f98', B: '#23282f' }, stance: 'UNKNOWN',
    },
    /* v3.25 THE EXILES — the two factions the Lamplighter name opens */
    lamplighters: {
      name: 'The Lamplighter Nomads', people: 'Lamplighters', live: true,
      culture: 'The exiles. Waylighters who rose up and chose the sword — cast out for it, kept alive by it. They carry the freedom and the hauling power of the Order with none of its vows: crafty, sneaky, hard to track, and wherever they train, formidable. Not brutes. Not blades. Hard-hitting marksmen behind a hooded lantern — the dark, cloaked torch. There are more of them than anyone admits, in every reach of the world; somewhere out past the maps the exiles even found a city to call their own.',
      pal: { A: '#c9b98a', B: '#1a2029' }, stance: 'WARY',
    },
    diefenbunker: {
      name: 'The Diefenbunker Society', people: 'Bunker-born', live: true,
      culture: 'The last of the old world, hundreds of years down, all of one northern origin nobody says outright. They surfaced on New World Day expecting ruin to twist straight and found death they thought could not exist. Highly educated, highly trained, politically bred — and utterly unready; the Lamplighters supply the will their books never printed. Their unsealed wing holds the arms of old wars: carbines with a red leaf etched into the sights, bolt rifles built for flawless consistency, bullion crates fit to stop a battering ram. They speak in a raised tongue. Something about the cold. Something about the water.',
      pal: { A: '#8fb08a', B: '#2a3328' }, stance: 'UNKNOWN',
    },
  };

  /* ---------- Farkeeper companion classes (the muscle, by trade) ---------- */
  const FK_CLASSES = {
    pugugly: { name: 'Pugugly', role: 'Bare-knuckle bruiser', line: 'Larger than most Farkeepers — huge to Waylighters — with speed that insults his size.', stats: { intercept: 2, interceptCd: 5, wage: 2 }, req: null, live: true },
    longbowmen: { name: 'Longbowman', role: 'Ranged security', line: 'The wall of Farkeep, carried on a shoulder.', stats: { intercept: 1, range: 320, wage: 2 }, req: null, live: false },
    rifle_rider: { name: 'Rifle Rider', role: 'Mounted marksman', line: 'A longbowman who earned a horse and traded the bow for a breech.', stats: { intercept: 2, range: 380, wage: 3 }, req: 'horse', live: false },
    recon_rider: { name: 'Recon Rider', role: 'Automated exploration', line: 'Quick, quiet, low damage — the map fills in behind them.', stats: { wage: 2 }, req: 'horse', live: true },   // v3.28: the frontier opened and the rider answered
    berserker: { name: 'Berserker', role: 'Pistol & claymore', line: 'Smaller and less agile than his Pugugly brothers-in-arms; makes up for it swinging a human-sized sword with ease.', stats: { intercept: 3, interceptCd: 8, wage: 3 }, req: null, live: false },
  };

  /* ---------- v3.41 THE CAMPS' OWN — the raiders by trade. A camp's ROLL is its people in order:
     the road sends the knives (never the chief, who keeps the fire), the storm brings the first
     three. A class is a row — the road and the storm read the stats, the renderer reads the kit:
       speed: the walk, against the knife's · knocks: how many blows put him down (the first only
       staggers a ram) · takeMul: how long he must stand at a post's fire to take it · range: a
       bowman stands off this far from the fire and looses at the shields, PINNING one for `pin`
       seconds every `shotCd` · roadRange/roadDmg/stagger: the bowman's shot at a walker on the road
       · rally: while the chief stands, the knives' downtime is multiplied by this; put him down and
       the storm BREAKS — the knives run · road:false keeps a class at the fire. ---------- */
  const CAMP_CLASSES = {
    knife: { name: 'Knife', line: 'the plain runner — a hood, a blade, a headlamp', kit: 'knife', stats: { speed: 1, knocks: 1, takeMul: 1 } },
    bowman: { name: 'Bowman', line: 'stands off and looses — a shield he hits keeps its arm down while the arrow is in it', kit: 'bowman', stats: { speed: 1, knocks: 1, takeMul: 1, range: 230, shotCd: 6, pin: 5, roadRange: 260, roadDmg: 3, stagger: 0.9 } },
    ram: { name: 'Ram', line: 'a door on one arm and a beam on the other — the first knock only staggers him, and he takes a fire fast', kit: 'ram', stats: { speed: 0.78, knocks: 2, takeMul: 0.6 } },
    chief: { name: 'Chief', line: 'the camp\'s own — while he stands the knives get up twice as fast; put him down and they run', kit: 'chief', stats: { speed: 0.9, knocks: 1, takeMul: 1, rally: 0.5, road: false } },
  };

  /* ---------- v3.30 THE EXILE ARSENAL — the C-series, tiered (our homage stands) ----------
     The Timberwolf is the hand-me-down every exile shoulders; the C3A1 and C20 come out of the
     Society's unsealed wing, sold across the exchange at Shutterlight to guild hands the Nomads
     trust. Multipliers ride the v3.25 rifle constants — one fire path, three rifles. */
  const RIFLES = {
    c14: { name: 'C14 Timberwolf', line: 'the exile hand-me-down — collected from the fallen, passed to the standing', rangeMul: 1, cdMul: 1, dropCdMul: 1, warnMul: 1, cost: null, rank: 0 },
    c3a1: { name: 'C3A1', line: 'the old service bolt — a red leaf etched into the sights, flawless consistency its whole doctrine', rangeMul: 1.16, cdMul: 0.8, dropCdMul: 0.8, warnMul: 1.15, cost: { metal: 80, ceramic: 20 }, rank: 2 },
    c20: { name: 'C20', line: 'the semi-automatic answer — the wing\'s last word, crated behind the cold door', rangeMul: 1.3, cdMul: 0.55, dropCdMul: 0.6, warnMul: 1.3, cost: { metal: 120, wood: 24 }, rank: 3, door: true },
  };

  /* ---------- horse breeds: real breeds, stats where their real strengths are ---------- */
  const HORSES = {
    mustang: { name: 'Mustang', line: 'feral stock — tough, sure-footed, unimpressed', speedMul: 1.0, spookResist: 0.35, drainMul: 0.9 },
    fjord: { name: 'Fjord', line: 'the Farkeepers\' own — steady in cold, steady in heart', speedMul: 0.95, spookResist: 0.55, drainMul: 0.8, coldProof: true },
    arabian: { name: 'Arabian', line: 'the fastest thing on four legs, and it knows it', speedMul: 1.18, spookResist: 0.0, drainMul: 1.15 },
    percheron: { name: 'Percheron', line: 'a draft wall — slow to run, born to carry', speedMul: 0.88, spookResist: 0.4, drainMul: 0.85, capBonus: 14 },
    icelandic: { name: 'Icelandic', line: 'small, five-gaited, smooth as a letter slid under a door', speedMul: 0.97, spookResist: 0.45, drainMul: 0.82, smooth: true },
  };
  /* which stable keeps what — the town's character picks its horse */
  const STABLES = { haven: 'mustang', elm: 'percheron', mill: 'percheron', green: 'icelandic', quarry: 'fjord', relay: 'arabian', foundry: 'fjord', pharos: 'fjord' };

  /* ---------- the renegade trade ---------- */
  const SMUGGLE = {
    good: 'highleaf', name: 'Highleaf smokes', from: 'elm',
    buyers: ['mill', 'quarry', 'foundry', 'relay'],
    crates: 2, kg: 5, payPer: 60, renegadeClean: 3, renegadeCaught: 1,
    apprBuyer: 2, apprCaught: -4, heatCaught: 3,
    fixerLine: 'Wren\'s brother-in-law, technically. The barn\'s far lean-to, technically a smokehouse.',
  };
  const CUTPURSE = {
    renegade: 2, heatCaught: 4, apprCaught: -6, pay: [40, 70],
    line: 'Every counting room runs a skim. The skim can walk.',
  };

  return { RENEGADE_TIERS, FACTIONS, FK_CLASSES, CAMP_CLASSES, RIFLES, HORSES, STABLES, SMUGGLE, CUTPURSE };
})();


