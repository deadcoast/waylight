'use strict';
/* Waylight v3.36 — THE MUSTER: standing orders for the people who walk with you, as REGISTRY ROWS.
   The v3.31 ledgers were built item-agnostic so this could exist: the same marks-over-taxonomy
   policy engine, with a store per WALKER instead of one for the pack. Two trees (what they SWEEP
   into their own pack, what they TAKE off your back when you are overloaded), four scalar orders
   (where they STAND in the wedge, how they eat at the MESS, how they STAND to trouble, whether
   they have a VOICE), five named presets the Order hands out, and the slot geometry the wedge
   walks. A new order is a row; a new preset is a row; the engine and the sheet read both. */

const MUSTER = (() => {
  /* ---------- the scalar orders: each a row with its choices, a default, and a line per choice ---------- */
  const ORDERS = {
    station: {
      name: 'STATION', line: 'where they walk',
      choices: {
        wedge: { name: 'Wedge', line: 'the staggered wedge behind you — the Order\'s own formation' },
        close: { name: 'Close', line: 'at your elbow — the first blow lands on them, and the wobble is steadier' },
        loose: { name: 'Loose', line: 'well back — they see more of the ground and reach further for what lies on it' },
        point: { name: 'Point', line: 'ahead of you — the first face trouble meets, the first hands on a crate' },
      }, def: 'wedge',
    },
    mess: {
      name: 'MESS', line: 'how they eat',
      choices: {
        bank: { name: 'The bank', line: 'a banked provision every mealtime — the Order feeds its own' },
        own: { name: 'Their pack', line: 'they eat what they carry first, and draw the bank only when the pack is bare' },
        fast: { name: 'Fast', line: 'they draw nothing — and a hungry back walks, but will not watch yours' },
      }, def: 'bank',
    },
    stand: {
      name: 'STAND', line: 'how they meet trouble',
      choices: {
        meet: { name: 'Meet it', line: 'a runner inside their reach is met first — a shove, a shot, a claymore' },
        hold: { name: 'Hold', line: 'they screen YOU only — trouble is met when it closes on your pack, not before' },
        quiet: { name: 'Quiet', line: 'they keep their hands down — under a truce, or when heat is the last thing you want' },
      }, def: 'meet',
    },
    voice: {
      name: 'VOICE', line: 'whether they talk',
      choices: {
        talk: { name: 'Talk', line: 'a line now and then, fitted to the ground' },
        quiet: { name: 'Quiet', line: 'not a word on the road — the calls that matter still come' },
      }, def: 'talk',
    },
  };

  /* ---------- the two trees: policy verbs over the item taxonomy, with their defaults ----------
     loot — what a trained back sweeps into ITS OWN pack from what enters your sight.
     hand — what they TAKE OFF YOUR BACK, unasked, the moment you carry more than the pack allows.
     Mission cargo never moves by policy: a contract is yours to carry. */
  const TREES = {
    loot: { name: 'SWEEP INTO THEIR PACK', line: 'what they pick up for you', def: { resources: true, consumables: true, freight: true, curios: true, junk: false, buildables: true, equipable: false } },
    hand: { name: 'TAKE MY OVERFLOW', line: 'what they lift off your back when you are over', def: { resources: true, curios: true, buildables: true, consumables: false, freight: false, equipable: false } },
  };
  const TREE_DEFAULT = false;

  /* ---------- the presets: the Order's own standing orders, by name ---------- */
  const PRESETS = {
    own: { name: 'THE WALKER\'S OWN', line: 'the orders every hire walks in with', station: 'wedge', mess: 'bank', stand: 'meet', voice: 'talk',
      loot: TREES.loot.def, hand: TREES.hand.def },
    mule: { name: 'THE PACK MULE', line: 'a back for the weight — sweeps everything, takes your overflow, keeps its hands down', station: 'loose', mess: 'bank', stand: 'quiet', voice: 'talk',
      loot: { cargo: true, equipable: false }, hand: { cargo: true, freight: false, equipable: false } },
    shield: { name: 'THE SHIELD', line: 'the mountain\'s own — close, meets everything, carries nothing of yours', station: 'close', mess: 'bank', stand: 'meet', voice: 'quiet',
      loot: { cargo: false }, hand: { cargo: false } },
    scout: { name: 'THE SCOUT', line: 'walks point, sweeps what the road drops, screens you only', station: 'point', mess: 'own', stand: 'hold', voice: 'quiet',
      loot: { cargo: false, freight: true, curios: true, junk: false }, hand: { cargo: false } },
    quartermaster: { name: 'THE QUARTERMASTER', line: 'eats from its own pack, sweeps the stores, takes every crate you cannot carry', station: 'wedge', mess: 'own', stand: 'hold', voice: 'talk',
      loot: { resources: true, consumables: true, freight: false, curios: false, buildables: true, equipable: false }, hand: { cargo: true, freight: false } },
  };

  /* ---------- the slot geometry: [back, side] in the walker's frame, per station, by index ---------- */
  const STATIONS = {
    wedge: [[-42, 0], [-58, 30], [-58, -30]],
    close: [[-24, 14], [-24, -14], [-34, 0]],
    loose: [[-96, 0], [-112, 56], [-112, -56]],
    point: [[64, 0], [70, 34], [70, -34]],
  };
  /* what a station DOES beyond the slot: reach for the looter, the wobble's steady hand, the screen */
  const STATION_FX = {
    wedge: { reachMul: 1, steady: 0 },
    close: { reachMul: 0.7, steady: 0.05 },
    loose: { reachMul: 1.35, steady: 0 },
    point: { reachMul: 1.1, steady: 0 },
  };
  const HOLD_SCREEN = 120;   // STAND: hold — trouble is met only inside this ring around YOU

  /* the roll call: how a walker says its orders aloud */
  const CALL = {
    station: { wedge: 'in the wedge', close: 'at your elbow', loose: 'well back', point: 'on point' },
    mess: { bank: 'eating from the bank', own: 'eating my own', fast: 'fasting' },
    stand: { meet: 'meeting what comes', hold: 'holding your back', quiet: 'hands down' },
  };

  return { ORDERS, TREES, TREE_DEFAULT, PRESETS, STATIONS, STATION_FX, HOLD_SCREEN, CALL };
})();
