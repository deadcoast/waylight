'use strict';
/* Waylight v3.36 — THE MUSTER: standing orders for the people who walk with you, as REGISTRY ROWS.
   The v3.31 ledgers were built item-agnostic so this could exist: the same marks-over-taxonomy
   policy engine, with a store per WALKER instead of one for the pack. Two trees (what they SWEEP
   into their own pack, what they TAKE off your back when you are overloaded), four scalar orders
   (where they STAND in the wedge, how they eat at the MESS, how they STAND to trouble, whether
   they have a VOICE), five named presets the Order hands out, and the slot geometry the wedge
   walks. A new order is a row; a new preset is a row; the engine and the sheet read both.
   v3.37 THE WORKING ORDERS adds, on the same law: the FREIGHT LIST tree, seven working-order rows
   the field jobs and the road walk under, and the MOOD — causes, bands, effects, the lines. */

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

  /* ================= v3.37 THE WORKING ORDERS: the field and the roads, on the same stores =================
     A hauler, a presser, a mason, a forrester, a charter runner — each keeps its orders in the SAME
     n.orders store a companion keeps, read by the same engine: scalar rows here, and the FREIGHT
     LIST as a third policy tree (verb 'haul') over the freight branch of the cargo taxonomy — the
     station goods ARE item defs, so a hauler's list and a charter's list are marks on the ledger's
     own tree. A job's orders are the rows its registry entry names; a new field job is an entry. */
  TREES.haul = { name: 'THE FREIGHT LIST', line: 'what a hauler or a charter carries between the ends', def: { freight: true, post: false }, root: 'freight' };
  const WORK_ORDERS = {
    load: {
      name: 'THE LOAD', line: 'how a hauler fills the pack',
      choices: {
        full: { name: 'Full', line: 'one good to the cap — the emptiest shelf on the freight list, filled hard' },
        split: { name: 'Split', line: 'two goods, half each — two shelves climb at once, neither as far' },
      }, def: 'full',
    },
    marks: {
      name: 'THE MARKS', line: 'what a presser does when the trail is bare end to end',
      choices: {
        home: { name: 'Come in', line: 'the trail bare, they walk in to the fire — the wage stops with the work' },
        keep: { name: 'Keep the beat', line: 'they walk the marks for as long as you pay — a presence on the line' },
      }, def: 'home',
    },
    reserve: {
      name: 'THE RESERVE', line: 'the ceramic a mason will not touch',
      choices: {
        none: { name: 'None', line: 'every slab in the bank is theirs to lay' },
        twenty: { name: 'Keep 20', line: 'the laying stops at twenty slabs — your own builds keep a floor' },
        sixty: { name: 'Keep 60', line: 'the laying stops at sixty — cobbles only from what you can spare' },
      }, def: 'none', floor: { none: 0, twenty: 20, sixty: 60 },
    },
    reach: {
      name: 'THE REACH', line: 'how far a forrester walks for wood',
      choices: {
        near: { name: 'Near', line: 'the near woods — short trips, planking by the round' },
        far: { name: 'Far', line: 'twice the ground — the deep stands, slower to the bank' },
      }, def: 'near', mul: { near: 1, far: 1.9 },
    },
    woods: {
      name: 'THE WOODS', line: 'what a forrester leaves standing',
      choices: {
        clear: { name: 'Clear', line: 'every tree in reach — the land itself changes' },
        thin: { name: 'Thin', line: 'every other tree — the wood stands, thinner; half the planking' },
      }, def: 'clear',
    },
    run: {
      name: 'THE RUN', line: 'what a charter carries',
      choices: {
        post: { name: 'The post', line: 'letters both ways — appreciation at both ends, the Order\'s own service' },
        freight: { name: 'Freight', line: 'a crate each run onto the far end\'s emptiest shelf, from the freight list — half the thanks, real stock' },
      }, def: 'post', likesMul: { post: 1, freight: 0.5 },
    },
    pace: {
      name: 'THE PACE', line: 'how hard a charter runs',
      choices: {
        steady: { name: 'Steady', line: 'the run as the road allows' },
        hard: { name: 'Hard', line: 'the run pushed — runs come faster, and eat twice for it' },
      }, def: 'steady', mul: { steady: 1, hard: 0.7 }, eat: { steady: 1, hard: 2 },
    },
    /* ---------- v3.38 THE POSTED ORDERS: a post hand's round policy, on the same store ---------- */
    hours: {
      name: 'THE HOURS', line: 'when a post hand works the round',
      choices: {
        full: { name: 'Round the clock', line: 'every shift, day and night — the whole wage, the whole gain' },
        days: { name: 'Days', line: 'daylight shifts only — half the rounds, half the wage; the night is theirs' },
        nights: { name: 'Nights', line: 'the lamp-lit round only — half the rounds, half the wage, and a town that sleeps easier thanks them more' },
      }, def: 'full', appr: { full: 0, days: 0, nights: 1 },
    },
    training: {
      name: 'THE TRAINING', line: 'what the round teaches',
      choices: {
        round: { name: 'The round\'s verb', line: 'every shift sharpens the skill the round is named for' },
        cross: { name: 'Cross-train', line: 'half the lesson to the round\'s verb, half to their weakest skill — a rounder back, slower' },
      }, def: 'round',
    },
    keep: {
      name: 'THE KEEP', line: 'who feeds a post hand',
      choices: {
        wages: { name: 'Wages', line: 'a provision a shift from the bank — the Order pays its own' },
        table: { name: 'The town\'s table', line: 'the town feeds them from its own rations — no wage, a shelf lighter each shift, and thinner thanks' },
      }, def: 'wages', apprMul: { wages: 1, table: 0.5 }, food: { wages: 0, table: 2 }, foodFloor: 10,
    },
  };
  /* v3.40 THE LETTERS — the post hand's own tree: which POST the round carries. The post subtree
     carries three kinds now (letters, the riders' dispatch, parcels), so the marks mean something:
     letters ON lets a runner fill the bag twice as fast; parcels ON lets a parcels round pack the
     town's own parcels into runs for the board. The dispatch is the Order's own and rides regardless. */
  TREES.post = { name: 'THE LETTERS', line: 'which post the round carries', def: { post: true }, root: 'post' };
  /* which rows a job walks under — the registry entry IS the job's orders sheet */
  const POST = { rows: ['hours', 'training', 'keep'], tree: 'post' };
  /* v3.42 — the town's own on the roll: a garrison's recruit answers to THE HOURS alone (the square's
     reading of full/days/nights lives on the storm doctrine's rise row) */
  const SQUARE = { rows: ['hours'], tree: null };
  const FIELD = {
    hauler: { rows: ['load'], tree: 'haul' },
    presser: { rows: ['marks'] },
    mason: { rows: ['reserve'] },
    forrester: { rows: ['reach', 'woods'] },
  };
  const ROAD = { rows: ['run', 'pace'], tree: 'haul' };
  const TRAIL_DONE = 0.9;   // the fraction of a trail's wearable ground that must be bare before a presser's work is DONE

  /* ---------- the mood: what a walker feels, summed from causes the game already tracks ----------
     bands are [minimum, name, colour], lowest first; fx per band are what a mood DOES; causes carry
     their own line so the plate can say WHY without a second table. */
  const MOOD = {
    bands: [[-99, 'DONE', '#e0654a'], [-7, 'LOW', '#d9a06b'], [-4, 'WORN', '#b8b29d'], [-1, 'STEADY', '#c9c3a8'], [4, 'BRIGHT', '#ffd98f']],
    fx: {   /* v3.38: workMul is the pace a field hand works at — a DONE hand comes in, the same law as a walker sitting down */
      DONE: { steadyMul: 0.5, reachMul: 0.7, workMul: 0.7, quits: true },
      LOW: { steadyMul: 0.7, reachMul: 0.85, workMul: 0.85 },
      WORN: { steadyMul: 1, reachMul: 1, workMul: 1 },
      STEADY: { steadyMul: 1, reachMul: 1, workMul: 1 },
      BRIGHT: { steadyMul: 1.3, reachMul: 1.15, workMul: 1.1 },
    },
    causes: {
      hungry: { v: -6, line: 'hungry' },
      unpaid: { v: -3, line: 'unpaid' },
      fasting: { v: -2, line: 'fasting by orders' },
      fed: { v: 1, line: 'a meal in them', within: 400 },
      bond: { v: 2, line: 'owes you their walk' },
      grey: { v: -2, line: 'walking the Grey', mist: 0.55 },
      night: { v: -1, line: 'walking nights' },
      loaded: { v: -1, line: 'loaded near the cap', at: 0.85 },
      point: { v: -1, line: 'walking point' },
      mounted: { v: 1, line: 'in the saddle' },
      downed: { v: -1, line: 'went down for you lately', within: 1800 },
      mending: { v: -2, line: 'mending' },
      fire: { v: 1, line: 'by a fire' },
      company: { v: 1, line: 'walking in company', party: 2 },
      seasoned: { v: 1, line: 'seasoned beside you', km: 10 },
      longOut: { v: -1, line: 'long out of a fire', after: 900 },
      /* v3.38 — the working world's own weather: what a field hand or a post hand feels */
      greyfall: { v: -2, line: 'working in the greyfall' },
      nightWork: { v: -2, line: 'working nights' },
      far: { v: -1, line: 'far from home', beyond: 2400 },
      thanked: { v: 1, line: 'a town that thanks them', apprLv: 3 },
      table: { v: 1, line: 'fed at the town\'s table' },
      /* v3.42 — the town's own: in their own square, under their own roof at night or not */
      ownSquare: { v: 2, line: 'stands in their own square' },
      ownClock: { v: -2, line: 'round the clock — away from their fields' },
      /* v3.44 — the stones at the field's edge: one of their own fell standing this square, or more */
      stone: { v: -1, line: 'a stone at the field\'s edge — one of their own' },
      stones: { v: -3, line: 'the stones at the field\'s edge — their own, more than one' },
      /* v3.45 — a camp's knives put them down on the road: they want it settled */
      score: { v: 1, line: 'a score to settle' },
      settled: { v: 2, line: 'a score settled' },   // v3.46: walked to the camp and said
      /* v3.47 — the stones they set, seen standing on the road past the ring; a night kept at a camp's ring */
      cairn: { v: 1, line: 'saw their stones standing' },
      watched: { v: 2, line: 'stood the watch at a ring' },
      /* v3.49 — the camp's own stone set beside theirs; a hand who stayed on for a stone's day */
      kstone: { v: 2, line: 'the knives set a stone beside theirs' },
      stays: { v: 1, line: 'stayed on for a stone\'s day' },
    },
    quitAfter: 60,   // seconds DONE before a companion sits down at the next fire
    fireR: 120,      // how near a lit town counts as a fire
    lines: {
      LOW: ['I need a fire, Walker.', 'How much further.', 'My feet have opinions.'],
      DONE: ['That is enough. Next fire, I sit.', 'I am done. I mean it.'],
      BRIGHT: ['Good ground. Good company.', 'I could walk this all year.'],
    },
  };

  return { ORDERS, TREES, TREE_DEFAULT, PRESETS, STATIONS, STATION_FX, HOLD_SCREEN, CALL, WORK_ORDERS, FIELD, ROAD, POST, SQUARE, TRAIL_DONE, MOOD };
})();


