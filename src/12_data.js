'use strict';
/* Waylight — all content & tuning data */

const DATA = (() => {
  const W = 8400, H = 11200;

  /* ---------- terrain height features: elliptical gaussians ---------- */
  const features = [
    { x: 500, y: 9800, rx: 1400, ry: 2800, h: 0.50 },    // SW rim
    { x: 8000, y: 9600, rx: 1200, ry: 3000, h: 0.55 },   // SE rim
    { x: 4200, y: 11120, rx: 3600, ry: 640, h: 0.45 },   // S rim
    { x: 5360, y: 9400, rx: 380, ry: 1080, h: 0.46 },    // haven-mill ridge
    { x: 5320, y: 8840, rx: 260, ry: 300, h: -0.34 },    // the saddle gap
    { x: 1200, y: 6600, rx: 1440, ry: 1440, h: 0.60 },   // quarry highlands
    { x: 1580, y: 7040, rx: 520, ry: 400, h: -0.22 },    // quarry pocket
    { x: 6860, y: 6040, rx: 860, ry: 780, h: 0.50 },     // relay hill
    { x: 6840, y: 6000, rx: 240, ry: 220, h: -0.14 },    // relay pocket
    { x: 4200, y: 8600, rx: 1900, ry: 1440, h: -0.12 },  // mid basin
    { x: 3800, y: 600, rx: 4200, ry: 1440, h: 0.75 },    // north rim
    { x: 3440, y: 1400, rx: 800, ry: 660, h: 0.35 },     // pharos peak
    { x: 3760, y: 2350, rx: 360, ry: 900, h: -0.30 },    // the pilgrim pass (notch through the rim)
    { x: 3560, y: 1830, rx: 340, ry: 560, h: -0.24 },    // pass upper ramp
    { x: 3440, y: 1400, rx: 430, ry: 340, h: -0.32 },    // pharos shelf
    { x: 6280, y: 3900, rx: 1040, ry: 840, h: -0.16 },   // foundry basin
    { x: 4200, y: 3200, rx: 3800, ry: 1900, h: 0.28 },   // north band
    { x: 8100, y: 4800, rx: 1040, ry: 2600, h: 0.50 },   // E rim north
    { x: 500, y: 4400, rx: 1040, ry: 3200, h: 0.55 },    // W rim north
    { x: 4660, y: 6840, rx: 840, ry: 620, h: -0.08 },    // greenhouse pocket
    { x: 5500, y: 3240, rx: 600, ry: 480, h: -0.10 },    // ash pocket
    { x: 2720, y: 6460, rx: 560, ry: 440, h: -0.08 },    // ridge camp pocket
  ];

  const rivers = [
    { name: 'Elm Creek', w: 42, deep: false, pts: [[1960, 10960], [2660, 10160], [3120, 9640], [3400, 8960], [3600, 8360], [3700, 7960]] },
    { name: 'River Silt', w: 90, deep: true, pts: [[-300, 7640], [280, 7660], [1400, 7800], [2600, 7920], [3800, 7860], [5000, 7720], [6200, 7500], [7400, 7280], [8320, 7120], [8800, 7040]] },
    { name: 'Cold Run', w: 68, deep: true, pts: [[6700, 5040], [5600, 4760], [4500, 4600], [3400, 4760], [2300, 4560], [1400, 4100]] },
  ];

  /* ---------- stations: people, what they run short of, what they have to spare ----------
     needs deplete over time and set the price of a delivery; makes are what a station hands a Waylighter to carry.
     pop scales consumption. keep is the one thing they never run out of. */
  const stations = {
    haven: { name: 'Haven', x: 4200, y: 9980, role: 'Depot of the south · sixty people who kept the last light lit', prelit: true, baseR: 1090, pop: 1.0,
      needs: ['food', 'meds', 'lumenCell'], makes: ['tools', 'textiles'], line: 'They ration by candlelight and pretend it is tradition.' },
    elm: { name: 'Elm Farm', x: 2460, y: 9360, role: 'Growers · the valley eats because they do', baseR: 880, pop: 0.8,
      needs: ['meds', 'tools', 'filters'], makes: ['food', 'seeds', 'seedlings'], line: 'Two hundred acres and one diabetic child.' },
    mill: { name: 'The Mill', x: 6160, y: 9040, role: 'Sawyers & ceramicists · everything that is built starts here', baseR: 880, pop: 0.9,
      needs: ['food', 'textiles', 'meds'], makes: ['parts', 'tools'], line: 'The saws have been quiet a year. The kilns never went cold.' },
    green: { name: 'Greenhouse', x: 4660, y: 6840, role: 'Botanists · medicine grows under glass north of the Silt', baseR: 950, pop: 0.7,
      needs: ['seeds', 'lumenCell', 'food'], makes: ['filters', 'seedlings', 'meds'], line: 'They talk to the plants. The plants are doing better than most.' },
    quarry: { name: 'Quarry', x: 1580, y: 7040, role: 'Stonecutters · iron in the terraces, no one to send it to', baseR: 920, pop: 0.8,
      needs: ['food', 'meds', 'textiles'], makes: ['tools'], line: 'Hard people. They cut the terraces you will climb to reach them.' },
    relay: { name: 'Relay Hill', x: 6840, y: 6040, role: 'Signal keepers · they still listen, every night, to nothing', baseR: 950, pop: 0.6,
      needs: ['parts', 'food', 'coolant'], makes: ['lumenCell', 'relayParts'], line: 'The dish turns by hand now. Someone always volunteers.' },
    foundry: { name: 'Foundry', x: 6280, y: 3900, role: 'Smiths · the only fire in the deep grey', baseR: 990, pop: 0.9,
      needs: ['food', 'filters', 'lumenCell'], makes: ['coolant', 'parts'], line: 'They never went dark. They went quiet, which is worse.' },
    pharos: { name: 'The Pharos', x: 3440, y: 1400, role: 'The great light of the north · a hundred people no one has heard from', baseR: 1530, pop: 1.2,
      needs: ['food', 'meds', 'lumenCell', 'coolant'], makes: [], line: 'If the Pharos is lit, the whole valley can see it. It has not been lit.' },
  };
  /* goods: what a crate is, and what it means to the people who open it */
  const goodsInfo = {
    food: { name: 'Rations', why: 'nobody plans on an empty stomach' }, meds: { name: 'Medicine', why: 'the difference between a bad week and a funeral' },
    lumenCell: { name: 'Lumen cells', why: 'light, warmth, and the wire itself' }, tools: { name: 'Hand tools', why: 'repairs stop when the tools do' },
    textiles: { name: 'Textiles', why: 'coats before the greyfall, blankets after' }, filters: { name: 'Water filters', why: 'the Silt is not water you drink' },
    seeds: { name: 'Seed stock', why: 'next season, or no season' }, seedlings: { name: 'Seedlings', why: 'the greenhouse sends spring by hand' },
    parts: { name: 'Machine parts', why: 'saws, pumps, the dish — everything that turns' }, coolant: { name: 'Coolant', why: 'a foundry without it is a fire with no one at the door' },
    relayParts: { name: 'Relay optics', why: 'eyes for the hill' }, letters: { name: 'Letters', why: 'proof that someone is still there' },
    parcel: { name: 'Parcels', why: 'a mended coat, a jar of preserves, a child\'s shoes — the town\'s own, sent to its own' },
  };
  const stationOrder = ['haven', 'elm', 'mill', 'green', 'quarry', 'relay', 'foundry', 'pharos'];

  /* the person behind each terminal: what they say depends on how their people are doing.
     hello = first time through their door · relit = you just brought them back from the quiet */
  const keepers = {
    haven: { name: 'Mara Voss', role: 'quartermaster', voice: {
      hello: 'New boots! Mara Voss — quartermaster. Sixty souls, one light, zero patience for standing around. Board’s behind me, Walker. Make me proud.',
      critical: 'We are OUT. You want a hero’s welcome? It’s waiting behind one crate. Move like you mean it.',
      wanting: 'The ledger says we’re fine. My gut says pack heavier. Back the gut.',
      steady: 'Stores full enough to argue over. Kettle’s hot, roads are open — go make somewhere lucky.',
      thriving: 'Look at these shelves. LOOK at them. Like the old days. First bowl of soup is on Haven, forever.',
      relit: 'The light kicked on and sixty people lost their minds in the yard. You. YOU. Get in here.' },
      react: { critical: 'Knew you’d come through. SOUP’S ON, EVERYBODY.', wanting: 'Good timing beats good intentions. This was both.' } },
    elm: { name: 'Aldous Wren', role: 'farmer', voice: {
      hello: 'Wren. Farm’s mine, debts are mine, and that laughing kid in the rows is mine too — she’s why medicine outranks everything here. Now you know me.',
      critical: 'I’ve buried better harvests than this one. Read the board slow, walk it fast.',
      wanting: 'We stretch. Stew gets thinner, my jokes get worse. Nobody wins.',
      steady: 'Fields behaving, kid’s laughing. Take food where they ain’t so lucky and tell them Wren sent it.',
      thriving: 'Barn is FULL. Say it with me — FULL. Take a crate of anything and brag about us.',
      relit: 'You lit my farm back up. There’s a chair by our fire with your name carved in it now. Carved deep.' },
      react: { critical: 'The kid’s already into it. Wren owes you — and Wren HATES owing.', wanting: 'That’s a winter argument settled. Obliged.' } },
    mill: { name: 'Bo Tammen', role: 'head sawyer', voice: {
      hello: 'HA! A real live Waylighter! BO TAMMEN — head sawyer, loudest man in the valley. Mind the blades. They’re louder.',
      critical: 'Empty bellies, silent saws. Know what a quiet mill is? A DEAD one. Fix that and I’ll name a blade after you.',
      wanting: 'We’re down to burning offcuts and patience, and I was born short on one of those.',
      steady: 'Kilns hot, crew fed, timber for days. Ask big — Bo delivers.',
      thriving: 'You HEAR that?! SAWS! Best song ever written, and you put it back on!',
      relit: 'Yard lights hit the blades and my whole crew started work LAUGHING. You did that.' },
      react: { critical: 'RATIONS! EVERYBODY — RATIONS! Somebody get this Walker a chair and the good mug!', wanting: 'HA! Right on time. Bo remembers.' } },
    green: { name: 'Dr. Imre Callas', role: 'botanist', voice: {
      hello: 'A visitor with legs instead of leaves! Forgive the staring — Dr. Callas. The tomatoes and I were just discussing you.',
      critical: 'The beds are dying and I have run out of polite verbs. Help. That one still works.',
      wanting: 'The glasshouse makes its own weather. Supplies, alas, are weather I cannot grow.',
      steady: 'Everything green is behaving, which is frankly suspicious. Take medicine to whoever is not.',
      thriving: 'The tomatoes have opinions again — loud ones. Magnificent. Take a crate before they unionize.',
      relit: 'Light on glass! Every leaf in the house turned to look. So did we. So did I.' },
      react: { critical: 'The beds will live! I am going to go tell them RIGHT NOW.', wanting: 'The plants noticed before I did. They approve.' } },
    quarry: { name: 'Sela Marsh', role: 'forewoman', voice: {
      hello: 'Marsh. You climbed my terraces without dying, so you’ll do. Board’s there. Gloves are a suggestion.',
      critical: 'Stone doesn’t complain. My crew has earned the right. Feed them and watch what this quarry does.',
      wanting: 'We cut, we stack, we wait. Two out of three keeps a body sane.',
      steady: 'Crew’s fed, cuts are clean. Iron’s yours if your spine’s honest.',
      thriving: 'Terraces are singing. Don’t grin about it. …Fine. One grin.',
      relit: 'Lights on the stone again. Crew pretended not to cheer. They cheered. I counted.' },
      react: { critical: 'Crew eats tonight. That buys you the good rope, permanently.', wanting: 'Solid. Marsh doesn’t say that twice.' } },
    relay: { name: 'Corporal Finch', role: 'signal keeper', voice: {
      hello: 'Corporal Finch, Relay Hill, still at post. You are the first traffic in four hundred days, and I have rehearsed this greeting eleven times. Welcome.',
      critical: 'Post status: failing. I keep the log regardless. Posterity deserves handwriting.',
      wanting: 'The dish turns by hand. Mine. Supplies thin, morale adequate, wrist legendary.',
      steady: 'Post status: holding. I wrote it twice, for the pleasure of it.',
      thriving: 'Full stores, clear channel. I have begun logging jokes. Filed under: morale, preventative.',
      relit: 'Signal restored. I logged the exact minute your light crested the hill. That page gets a frame.' },
      react: { critical: 'Resupply received. Log entry reads, in full: “FINALLY.”', wanting: 'Noted, weighed, and appreciated. Underlined twice.' } },
    foundry: { name: 'Brand', role: 'smith', voice: {
      hello: 'Brand. Fire’s mine. Speak.',
      critical: 'Short on everything. Fire doesn’t care. I do.',
      wanting: 'It runs. Barely counts.',
      steady: 'Fire’s fed. Take coolant. Don’t drop it.',
      thriving: 'Best heats in years. Smiled once. Nobody saw.',
      relit: 'You walked light into the deep grey for us. That’s a debt. Brand pays debts.' },
      react: { critical: 'Fire eats tonight. Good hands.', wanting: 'Kept us running. Remembered.' } },
    pharos: { name: 'Keeper Aster', role: 'keeper of the great light', voice: {
      hello: 'A hundred of us watched your lantern climb the last mile — the children named it a star. I am Aster. Welcome to the top of the world.',
      critical: 'A hundred mouths, one tower, and the sea wind takes its cut of everything. We need all of it.',
      wanting: 'We hold. Holding is the Pharos’ whole profession.',
      steady: 'The tower stands easier with full stores. So do I.',
      thriving: 'If the Pharos is lit, the whole valley can see it. Tonight — look UP, valley.',
      relit: 'The great light turns again, and every station below knows exactly who to thank. So do we.' },
      react: { critical: 'A hundred people just learned your name at once. Listen — you can almost hear it.', wanting: 'The tower thanks you. The keeper too.' } },
  };

  /* per-station star rewards (index = star reached) */
  const starRewards = {
    haven: [null, { note: '+donated metal with every delivery' }, { note: 'Storage lockers doubled' }, { note: 'Haven pays +10% trust on all orders from here', effect: 'havenPay' }, { note: 'Haven crews restore your cargo containers at this terminal' }, { note: 'Haven honors you — trust flows from the whole south' }],
    elm: [null, { note: 'Elm donates rations — +ceramic trickle' }, { note: 'Fresh boots: +4% walk speed everywhere', effect: 'speed4' }, { note: 'Elm sends preserves — orders here pay +15%' }, { note: 'Seed exchange — +metal & ceramic gifts' }, { note: 'The farm thrives' }],
    mill: [null, { note: 'Mill donates ceramics per delivery' }, { note: 'Reinforced containers: cargo wear −12%', effect: 'wear12' }, { note: 'The Mill outfits Waylighters — wide frames on the bench' }, { note: 'Seasoned timber — bridges decay 2× slower' }, { note: 'The saws sing again' }],
    green: [null, { note: 'Greenhouse donates resin-ceramic per delivery' }, { note: 'Trail rations: stamina regens +20% faster', effect: 'regen20' }, { note: 'Greenhouse orders pay +15%' }, { note: 'Rooftop beds — big material gifts' }, { note: 'The glass houses glow' }],
    quarry: [null, { note: 'Quarry donates metal — the road fund begins' }, { note: 'Quarry donates heavy metal per delivery' }, { note: 'Blasting powder — paver costs −20%', effect: 'paver20' }, { note: 'Deep seams — huge metal gifts' }, { note: 'Stone flows south' }],
    relay: [null, { note: 'Forecast unlocked — greyfall shown on map', effect: 'forecast' }, { note: 'Signal boost — waylights reach +60 further', effect: 'reach60' }, { note: 'Blueprint: WATCHTOWER Mk II — reveals 2× area' }, { note: 'Relay pays +20% on express orders' }, { note: 'They see the whole valley now' }],
    foundry: [null, { note: 'Blueprint: EXO FRAME I — carry +40 kg', effect: 'frame1Bp' }, { note: 'Blueprint: FLOAT SLED — carry +100 kg, no sprint', effect: 'sledBp' }, { note: 'Blueprint: EXO FRAME II — +80 kg & steadier', effect: 'frame2Bp' }, { note: 'Alloy lattice — structures decay 2× slower' }, { note: 'The forges never cool' }],
    pharos: [null, { note: 'The valley is awake' }, { note: 'Pilgrim roads — all trust +10%' }, { note: 'The light holds' }, { note: 'Nothing left in the dark' }, { note: 'Legend' }],
  };

  /* ---------- roads: chains of pavers ---------- */
  const roads = [
    { id: 'r_elm', name: 'Elm Road', pts: [[4040, 9900], [3400, 9760], [2940, 9580], [2600, 9440], [2460, 9360]], segs: 2, cost: { metal: 48, ceramic: 28 }, needs: ['haven', 'elm'] },
    { id: 'r_mill', name: 'Saddle Road', pts: [[4360, 9900], [4900, 9800], [5320, 9540], [5720, 9300], [6020, 9180], [6160, 9040]], segs: 3, cost: { metal: 55, ceramic: 32 }, needs: ['haven', 'mill'] },
    { id: 'r_green', name: 'Silt Road', pts: [[4200, 9860], [4220, 9300], [4280, 8760], [4300, 8240], [4300, 7920], [4300, 7660], [4400, 7280], [4660, 6840]], segs: 4, cost: { metal: 60, ceramic: 40 }, span: 2, needs: ['haven', 'green'] },
    { id: 'r_quarry', name: 'Terrace Road', pts: [[4660, 6840], [3800, 6800], [3000, 6760], [2300, 6800], [1900, 6900], [1580, 7040]], segs: 3, cost: { metal: 60, ceramic: 40 }, needs: ['green', 'quarry'] },
    { id: 'r_relay', name: 'Signal Road', pts: [[4660, 6840], [5300, 6660], [5900, 6400], [6400, 6200], [6840, 6040]], segs: 3, cost: { metal: 60, ceramic: 40 }, needs: ['green', 'relay'] },
    { id: 'r_foundry', name: 'Cold Road', pts: [[6840, 6040], [6960, 5620], [6920, 5240], [6700, 5040], [6500, 4600], [6360, 4200], [6280, 3900]], segs: 4, cost: { metal: 75, ceramic: 46 }, span: 2, needs: ['relay', 'foundry'] },
    { id: 'r_pharos', name: 'Pilgrim Road', pts: [[6280, 3900], [5800, 3600], [5200, 3400], [4600, 3200], [4000, 2900], [3700, 2400], [3560, 1900], [3440, 1400]], segs: 5, cost: { metal: 90, ceramic: 60 }, needs: ['foundry', 'pharos'] },
  ];

  /* ---------- scrapper camps ---------- */
  /* v3.41: each camp's ROLL — its people by trade, in order (FACT.CAMP_CLASSES). The road sends
     the first `runners` of them that walk the road (the chief keeps the fire); a storm brings the
     first three, the chief among them. */
  const camps = [
    { id: 'pass', name: 'Pass Camp', x: 4280, y: 8520, r: 760, runners: 2, roll: ['chief', 'knife', 'knife'] },
    { id: 'ridge', name: 'Ridge Camp', x: 2720, y: 6460, r: 780, runners: 3, roll: ['bowman', 'ram', 'knife'] },
    { id: 'ash', name: 'Ash Camp', x: 5500, y: 3240, r: 830, runners: 3, roll: ['chief', 'bowman', 'ram', 'knife'] },
  ];
  /* v3.43 THE FACE AT THE DOOR — what each keeper says about a grievance, in their own voice, at the
     door before the board: {name} is the parcel. One line per state; the face is in SPRITES.FACES. */
  const keeperGrief = {
    haven: { ground: '{name} for the Penhallows is lying on the road, Walker. I heard before your boots hit my yard. Pick it up. That is the whole speech.', camp: 'A camp has {name} that was addressed to my door. MY door. Get it back, or don\'t come in here smiling.', given: 'You gave up the run with {name} on it. I don\'t give up on crates, and I don\'t give up on people who give up on crates — but I remember them.', remembered: '{name} never came. I stopped waiting. I did not stop counting.', made: '{name}. Here. After all that. …Fine. You\'re forgiven. Soup\'s on — half a bowl.', promise: 'Your word. All right. I write words down, Walker — two days, and {name} is in this yard, or the ledger says what you are.', sorry: 'Sorry. …Fine. I will take sorry — it costs you at my counter, not at my door. The town keeps its opinion of you. I keep mine.', broken: 'Two days. {name} is not in my yard. You gave your word and I wrote it down, and now I read it back to the town.', kept: '{name}. Your word, kept. I cross it off. That is the highest thing I do for anyone.', errand: 'You kept your word twice. Here — my own letter, sealed, for {town}. Two days. I will not ask what took you if it is late. I will simply know.', errandKept: 'It got there. {town} wrote back before you were home. I have put your name in the good column. There is only the one column, now.', shut: 'No. No more promises at this counter. Bring one of ours through first, without a word, and then we will talk about words.', heardKept: 'The wire says you kept your word at {town}. I heard it before you were in my yard. I have written it down here too — words travel, Walker, and I keep copies.', heardBroken: 'The wire says your word broke at {town}. News walks faster than you do. I have written it down here too, and I will read it back if I need to.', answered: 'The wire has brought me your word kept three times, and never once in my yard. I keep copies. Here is my own letter, sealed, for {town} — two days. Let me see the original.', hearsay: 'Twice now the wire has brought me your word broken. I did not see it with my own eyes and I am not waiting to. No promises at this counter until I see what you do in my yard.', seen: 'I heard what the wire said about you. Now I have seen what you do in my yard. They are not the same walker. The counter takes your word again.', ahead: '{who} wrote ahead from {town}. I keep copies of everything, so I have read it twice. The board is behind me, Walker. Do not make me correct my copies.', third: 'Three letters about you, Walker — the last from {who} at {town}. I keep copies; I have read all three twice. My own errand is sealed and on the board. It was there before you were.' },
    elm: { ground: '{name} — for the kid. It\'s on the road somewhere between here and wherever you dropped it. I ain\'t angry. I\'m something worse than angry: I\'m waiting.', camp: 'The camps have {name}. Sent to a child, and it\'s warming a scrapper\'s tent. Wren doesn\'t forget a thing like that.', given: 'You gave it up. {name}. You gave it UP. Get off my porch a minute, Walker; I need to look at the fields.', remembered: '{name} never came. The kid stopped asking. That\'s the part I hold against you.', made: '{name}! Kid, come see — it CAME. Walker, you owe Wren nothing. Wren owes you. Wren HATES owing.', promise: 'Your word? I\'ll take your word. The kid\'s at the window every morning — two days, Walker. I\'ll tell the kid two days.', sorry: 'You\'re sorry. …Yeah. Okay. Sorry counts here. Wren won\'t hold {name} against you at the town — just at the porch, for a while.', broken: 'You told me two days. I told the KID two days. Get off my porch, Walker; I have to go unsay something.', kept: '{name} — you said two days and it\'s here in one. Kid! Walker kept their word. That\'s a thing to see.', errand: 'Walker. You kept it twice. This one\'s mine — for {town}, sealed, and it matters. Two days. The kid doesn\'t know about this one. Keep it that way.', errandKept: '{town} got it. Wren slept last night. First time in a while. Whatever you want off this farm, ask.', shut: 'Don\'t. I\'m not taking another promise off you. Bring something of ours home first. No words. Then maybe.', heardKept: '{town} says you kept your word there. Came down the wire this morning. Wren told the kid. The kid says of course you did.', heardBroken: 'Heard on the wire you broke your word at {town}. Wren didn\'t tell the kid. Wren doesn\'t know how.', answered: 'Three times the wire says you kept your word. Never here, though. Here — for {town}, sealed. Two days. Show the kid the wire tells the truth.', hearsay: 'Twice the wire\'s said your word broke somewhere. Wren didn\'t see it. Wren doesn\'t need to. No promises off this porch till I see you do right by us.', seen: 'Wire said one thing. You did another, right here on my porch. Wren believes the porch. Your word\'s good here again.', ahead: '{who} wrote from {town} — says you keep your word. Never met you. Don\'t need to. Board\'s there. The kid already told the goats.', third: 'Three letters now. Last one from {who}, {town}. Kid read \'em all to the goats. My own letter\'s sealed and on the board — been waiting on you.' },
    mill: { ground: '{name} — ON THE ROAD?! Sent to MY yard and lying in the DIRT? Bo doesn\'t shout. THIS IS BO SHOUTING.', camp: 'A CAMP has {name} that was coming HERE. Get it BACK, or I name a blade after somebody ELSE.', given: 'You GAVE UP a run with {name} on it. The saws heard. The saws remember. So does BO.', remembered: '{name} never came. Quiet mill, quiet Bo. You don\'t want quiet Bo.', made: '{name}! HA! It CAME! EVERYBODY — the Walker brought it! Chair, mug, the GOOD mug!', promise: 'YOUR WORD? Bo takes your WORD. Two days, and {name} on this yard — or Bo names the SAW after you and it CUTS.', sorry: 'SORRY? …Bo hears sorry. Bo takes sorry off your ledger and NOT off the town\'s. Don\'t make Bo hear it twice.', broken: 'Two DAYS, you said. The saws counted. {name} never came and now the whole yard knows what your word weighs.', kept: '{name}! Your WORD, and it CAME! Bo said two days and you said two days and HERE IT IS. The GOOD mug!', errand: 'TWICE! Bo likes a walker who does it TWICE. Here — Bo\'s own letter. SEALED. For {town}. Two days, and NOBODY opens it but them!', errandKept: '{town} got Bo\'s LETTER! In TIME! You walk like a SAW cuts — straight and when you SAID! The GOOD mug is yours now. Keep it!', shut: 'NO MORE PROMISES. Bo is DONE with promises from you. Bring ours through — NO WORDS — and Bo will think about it.', heardKept: 'THE WIRE SAYS you kept your word at {town}! Bo heard it over the SAWS! Bo tells EVERYBODY things like that!', heardBroken: 'The WIRE says your word BROKE at {town}. Bo heard it over the saws. Bo is not shouting. Bo is THINKING.', answered: 'THREE TIMES the wire says you KEPT YOUR WORD and not ONCE in BO\'S YARD! Here — Bo\'s letter, SEALED, for {town}! Two days! PROVE IT TO BO!', hearsay: 'The WIRE says your word broke TWICE. Bo did not SEE it. Bo does not NEED to. NO PROMISES in this yard till Bo SEES what you do HERE.', seen: 'The wire said one thing. BO SAW ANOTHER! In BO\'S YARD! Bo believes the yard! Your word\'s GOOD here again!', ahead: '{who} wrote Bo a LETTER! From {town}! Says you KEEP YOUR WORD! Bo never met you and Bo LIKES you ALREADY! Board\'s THERE!', third: 'THREE LETTERS! The last from {who} at {town}! Bo read them ALL! Bo\'s OWN errand is SEALED and on the BOARD — it was waiting for YOU!' },
    green: { ground: 'I am told {name}, addressed to this glasshouse, is presently horizontal on a road. The tomatoes are appalled. I am worse.', camp: 'A camp has {name}. A CAMP. Cultivated by nobody, sent to my door, rotting in theirs. I have run out of polite verbs again.', given: 'You abandoned the run. {name}. I will not raise my voice; the plants dislike it. I will simply note it, permanently.', remembered: '{name} never arrived. I have filed it under weather I could not grow. It is a thick file.', made: '{name}! Delivered! Late, battered, and MINE. Forgiven — provisionally, botanically, entirely.', promise: 'A promise. How horticultural. Two days, then — {name} at this glasshouse. I shall mark the calendar the way I mark a frost.', sorry: 'An apology. I accept it, provisionally and expensively. The plants will not hold it against you; the plants have no ledger. I have.', broken: 'Two days, you said, and the calendar is a ruin. {name} did not come. I have filed your word under annuals: pretty, and gone by autumn.', kept: '{name}, on the day you promised. I have never once been on time for anything that mattered. I am impressed, and I resent it.', errand: 'Two words kept. A trend, then, and I trust trends. My own letter, sealed — for {town}. Two days. It concerns a graft. Do not ask. Do not drop it.', errandKept: '{town} has my letter, and I have their answer. The graft took. I am told I smiled. I deny it, but it is in the record.', shut: 'The glasshouse accepts no further promises from you. Deliver something of ours without one. Plants trust what grows, not what is said.', heardKept: 'Word came down the wire from {town}: you kept yours. I have pressed it between two pages. It will keep.', heardBroken: 'The wire brought a word from {town}: yours, broken. I have noted it in the margin, beside the blight.', answered: 'The wire has told me thrice that your word keeps, though never under my glass. I trust what grows elsewhere, provisionally. My letter, sealed — for {town}. Two days. Graft me some evidence.', hearsay: 'The wire has twice carried news of your word withering somewhere else. Blight travels on the wind; I close the vents. No promises in this glasshouse until I see what you grow here.', seen: 'Hearsay said blight. The glasshouse says otherwise — I watched what you brought through my own door. The vents are open. Your word may come in.', ahead: 'A letter from {who} at {town} arrived before you did — a grafted reputation, if you like. I have taken the cutting. The board is yours; do not make me regret the rootstock.', third: 'Three letters, the last from {who} at {town} — a reputation propagated by cuttings. I have sealed my own errand and pinned it to the board. It has been waiting in the light for you.' },
    quarry: { ground: '{name}. On the road. I heard. Pick it up.', camp: 'Camp\'s got {name}. Was ours. Get it back.', given: 'You gave it up. {name}. Marsh counts that.', remembered: '{name} never came. Crew noticed. I noticed first.', made: '{name}. Here. Late. …Counts. The good rope stays yours.', promise: 'Your word. Two days. Marsh counts.', sorry: 'Sorry. Heard. It costs you here. Crew won\'t hear it from me.', broken: 'Two days. {name} never came. Your word\'s the thing that went short.', kept: '{name}. Your word. Kept. Marsh counted. Counts.', errand: 'Twice. Good. Mine. Sealed. {town}. Two days.', errandKept: '{town} got it. Crew knows. Marsh knows. Good.', shut: 'No more words. Bring ours. Then talk.', heardKept: 'Wire says {town}. Word kept. Marsh heard. Counts here too.', heardBroken: 'Wire says {town}. Word broke. Marsh heard. Counts here too.', answered: 'Wire says three. Kept. Not here. Here\'s mine. Sealed. {town}. Two days. Show me.', hearsay: 'Wire says two. Broke. Didn\'t see it. Don\'t need to. No words here. Do right here first.', seen: 'Wire said broke. Saw you here. Counts more. Words again.', ahead: 'Letter. {who}. {town}. Says you keep it. Board\'s there. Don\'t make the letter wrong.', third: 'Three letters. Last from {who}. {town}. My errand\'s sealed. On the board. Waiting.' },
    relay: { ground: 'Log entry: {name}, addressed to this post, reported ON THE ROAD. Status: recoverable. Morale: adjusted downward.', camp: 'Log entry: {name} now in hostile hands. Filed under: losses, avoidable. I have underlined avoidable.', given: 'Log entry: the carrier abandoned the run with {name} aboard. Posterity will read this page. I have written it neatly.', remembered: 'Log entry: {name} never arrived. Case closed. The page stays in the book.', made: 'Log entry: {name} DELIVERED. Late. Amended: forgiven. I have used the good ink.', promise: 'Log entry: the carrier gives their WORD — {name} within two days. Noted, dated, initialled. The page is open.', sorry: 'Log entry: an apology tendered. Accepted; charged against the carrier\'s standing at this post, not the town\'s. Filed.', broken: 'Log entry: the promised {name} not received by the stated day. Word: broken. Underlined, twice. The town has been read the page.', kept: 'Log entry: {name} received within the promised span. Word: KEPT. I have drawn a small box around it.', errand: 'Log entry: the carrier has kept their word twice. Entrusted: the keeper\'s own sealed letter, for {town}, two days. I have written the time. I will write it again when it lands.', errandKept: 'Log entry: the keeper\'s letter delivered to {town} within the span. I have drawn a box around the box. That has never happened.', shut: 'Log entry: promises from this carrier no longer accepted at this post. Condition for reinstatement: one grievance made right, unsworn. Filed.', heardKept: 'Log entry: received over the wire from {town} — the carrier\'s word, KEPT. Copied into this post\'s book. A small box, drawn.', heardBroken: 'Log entry: received over the wire from {town} — the carrier\'s word, broken. Copied into this post\'s book. Underlined, once.', answered: 'Log entry: three reports over the wire — the carrier\'s word, KEPT, at other posts. None at this one. Entrusted anyway: the keeper\'s own sealed letter, for {town}, two days. Condition: verification in person.', hearsay: 'Log entry: two reports over the wire — the carrier\'s word, broken, at other posts. Unverified here. Promises from this carrier suspended at this post pending a delivery observed in person.', seen: 'Log entry: delivery observed in person, correctly made. Hearsay struck from the record at this post. Promises from this carrier accepted again. A small box, drawn.', ahead: 'Log entry: correspondence received over the wire from {who}, {town}, in advance of the carrier. Content: the carrier keeps their word. Carrier now arrived. Board opened on the strength of it.', third: 'Log entry: third letter received, from {who}, {town}. Pattern confirmed across three doors. The keeper\'s own errand sealed and posted before the carrier arrived. Carrier: it is yours.' },
    foundry: { ground: '{name}. On the road. Get it.', camp: 'Camp has {name}. Ours. Debt.', given: 'Gave it up. {name}. Brand remembers debts. Both ways.', remembered: '{name}. Never came. Fire doesn\'t care. I do.', made: '{name}. Here. Debt paid. Good hands.', promise: 'Your word. Two days. Brand holds it.', sorry: 'Sorry. Costs you. Not the town. Brand remembers that too.', broken: 'Two days. Nothing. Your word\'s slag now.', kept: '{name}. Your word, kept. Good iron. Brand says so.', errand: 'Twice. Brand\'s letter. Sealed. {town}. Two days.', errandKept: '{town} has it. Debt? None. Brand owes you now.', shut: 'No words. Deeds. One of ours, through. Then words.', heardKept: 'Wire. {town}. Word kept. Good iron travels.', heardBroken: 'Wire. {town}. Word broke. Slag travels too.', answered: 'Wire. Three. Kept. Not here. Brand\'s letter. Sealed. {town}. Two days. Show Brand.', hearsay: 'Wire. Two. Broke. Brand didn\'t see. No words at this fire. Iron first.', seen: 'Wire said slag. Brand saw iron. Iron wins. Words again.', ahead: '{who} wrote. {town}. Says you\'re good iron. Board\'s hot. Show Brand.', third: 'Three letters. Last from {who} at {town}. That\'s tempered iron. Brand\'s own errand is sealed and on the board. Take it.' },
    pharos: { ground: 'A hundred of us heard before you climbed the last mile: {name}, on the road. Nobody is angry, Walker. Somebody is sad, and it is a child.', camp: 'A camp has {name}. Sent to the tower, held by the dark. We keep the light for exactly this reason; I will keep it a little brighter tonight.', given: 'You gave the run up, with {name} aboard. The tower does not judge. The tower also does not forget; it is what a tower is for.', remembered: '{name} never came. We stopped watching the road for it. That is a hard thing to make a hundred people do.', made: '{name} — it came. Late and dear. The children will name your lantern a star again tonight, and I will let them.', promise: 'Your word — I will carry it up the stairs and tell a child. Two days, Walker. A child counts days.', sorry: 'You are sorry. The tower hears it, and takes it off your standing here rather than the town\'s — that is what a tower can do, and no more.', broken: 'Two days, you said, and I said it to a child on the stairs. {name} did not come. I do not know yet what I will say tonight.', kept: '{name} — your word, kept, and a child on the stairs saw it come up the road. That is the light doing what it is for.', errand: 'You kept it twice, and a child on the stairs saw both. This is mine — sealed, for {town}. Two days. The tower does not often ask.', errandKept: '{town} has the tower\'s letter. We lit a second lamp for it tonight. The children asked why. I said: because someone kept their word.', shut: 'The tower will not take another promise from you. Bring one of ours through, unsworn. The light is patient; I am trying to be.', heardKept: 'The wire brought it up the stairs from {town}: you kept your word there. A child carried the message to the lamp room. We lit it early.', heardBroken: 'The wire brought it from {town}: your word, broken there. I did not let a child carry that one up the stairs.', answered: 'The wire has carried your word kept three times up these stairs, and never once from this door. The tower will trust what it has only heard. Take our letter, sealed, to {town} — two days. A child will count them.', hearsay: 'Twice the wire has brought your word broken up the stairs. The tower saw none of it, and I cannot unhear it. No promises at this door until the tower sees what you do here.', seen: 'The wire said one thing about you, and the tower has seen another from its own door. We believe the light. Your word is welcome on the stairs again.', ahead: '{who} wrote up the stairs from {town} before you ever climbed them. The tower read it to the children. You are expected, Walker — the board is open to you.', third: 'Three letters climbed the stairs before you did, the last from {who} at {town}. The children know your name. My own errand is sealed and waiting on the board, Walker.' },
  };
  /* v3.41 THE PARCELS ADDRESSED — what a town's own sends to its own, and what happens when it is
     opened. {who} is the keeper at the door it was addressed to, {town} that town. Read aloud on
     delivery the way a letter is. */
  const parcelKinds = [
    { id: 'coat', name: 'a mended coat', line: '{who} at {town} holds the coat up to the lamp, finds the mend, and puts it on over the one they are wearing.' },
    { id: 'preserves', name: 'a jar of preserves', line: 'The jar is opened at the terminal before you have signed. {who} eats one spoon standing up and says nothing, which is the review.' },
    { id: 'shoes', name: 'a child\'s shoes', line: 'The shoes are two sizes too big. {who} says the child will grow into them by the time the road is safe enough to walk in them.' },
    { id: 'seed', name: 'a twist of seed', line: '{who} at {town} unrolls the paper on the desk and counts the seed twice. Forty-one. It goes in a tin with the town\'s name on it.' },
    { id: 'blanket', name: 'a folded blanket', line: 'Somebody\'s grandmother wove it; {who} knows whose. It does not go on the shelf. It goes out the back door to a bed that needed it tonight.' },
    { id: 'knife', name: 'a kitchen knife, sharpened', line: '{who} tests the edge on a thumbnail and nods. The one at {town} has been a butter knife since the spring.' },
    { id: 'letters', name: 'a bundle of old letters', line: 'Not the post — older. {who} reads the top one at the terminal and has to stop. You are asked to wait outside a minute.' },
    { id: 'tin', name: 'a tin of buttons', line: '{who} at {town} pours the buttons out on the desk and there is a whole conversation in them: whose coat, whose wedding, whose funeral.' },
  ];

  /* v3.45 — the keeper's own sealed letter (THE KEEPER'S ERRAND), read at the far door: {who} the keeper there, {from} the keeper who sent it */
  const errandLetter = { name: 'a sealed letter', line: '{who} breaks the seal at the terminal, reads it once, and puts it inside their coat. Whatever {from} wrote, it was the kind of thing you send by the one walker you trust.' };
  /* v3.46 THE KIN'S THANKS — what the kin says handing the Walker the fallen's keepsake ({first} the fallen) */
  const keepsakeLines = {
    whetstone: '{first} sharpened everything on it — knives, hoes, the town\'s one good axe. It should walk with somebody.',
    button: '{first} kept a brass button off their father\'s coat. It rode the square every night they stood it.',
    bird: '{first} carved birds for the children in the square. This one never got given. It is yours.',
    whistle: '{first} played that whistle on the long nights in the square. Nobody else can. Maybe you will.',
    flower: '{first} pressed a flower in a letter they never sent. Keep the flower. I have kept the letter.',
    ring: '{first} wore that ring on a cord. Iron, worth nothing — worth everything. Take it on the road.',
  };
  /* v3.47 THE KEEPSAKE SET DOWN — the kin's last letter, once the thing is on the fallen's stone ({first}) */
  const keepsakeSetLines = {
    whetstone: 'The whetstone is on {first}\'s stone. It will not sharpen anything there, and that is right — {first} is done working. Thank you for carrying it that far.',
    button: 'The brass button is on {first}\'s stone, where the rain can shine it. Our father would have laughed. Thank you for bringing it home.',
    bird: 'The carved bird is on {first}\'s stone. A child from the square came to look at it this morning and did not take it. That is how I know it is in the right place.',
    whistle: 'The tin whistle is on {first}\'s stone. The wind plays it a little when it comes off the field — I have heard it. Thank you.',
    flower: 'The pressed flower is on {first}\'s stone, and the letter it was pressed in is under it now. Some things should be sent even late. Thank you.',
    ring: 'The iron ring is on {first}\'s stone, back on its cord. It is worth nothing to anyone passing, which is how it will stay there. Thank you.',
  };
  /* v3.47 THE STONE'S KEEPING — said passing a cairn ({name} the one who set it, {camp} the camp); the knife who kicks it over */
  const stoneLines = {
    own: ['Still standing.', 'That\'s mine. {camp} knows it.', 'I said my piece here. It holds.'],
    others: ['{name}\'s stones.', 'That\'s where {name} said it.', 'Leave them be. {name}\'s.'],
    kicked: ['They kicked it over. It\'s not finished.', '{camp} put my stones in the dirt. Right.'],
    kicker: ['Your stones. Our ring.', 'Nobody leaves stones at our fire.', 'Kick it. Kick it all.'],
  };
  /* v3.47 THE ROAD KEPT and THE WATCH — the chief taking the road's gift, the new man pulling the rags, the knives on the road;
     the line keeping a ring through the night */
  const roadLines = {
    kept: ['The road stays. Tell your runners.', 'A gift walked down the road. That buys it.', 'Keep your word, keep your road.'],
    down: ['The old man\'s word ran out. Mine hasn\'t started.', 'Rags down. The ring\'s ours again.'],
    walk: ['The rag\'s up. Walk on.', 'Road\'s open. Keep to it.', 'On the road you\'re his guest. Off it, you\'re ours.'],
    gift: ['That\'s for the fire? Go on through.', 'A gift. Walk it in.'],
  };
  const watchLines = {
    order: ['We\'ll keep it till morning.', 'Go on. We\'ve got the night.', 'A fire, a line, the dark. We\'ve done worse.'],
    dark: ['Lamps up. Nobody comes out.', 'The watch holds.'],
    dawn: ['Morning. The camp slept. So did we, nearly.', 'Held it. Walking home.'],
    inside: ['There\'s a line out there. Stay in.', 'Their lamps are up. Sit down.'],
    home: ['Home from the watch.', 'Held till morning. Here we are.'],
  };
  /* v3.48 THE CAMP ON THE WIRE — a camp whose road you kept three times asks for the wire; the relay raised at its fire makes
     it a lit door. These are its rows, materialized into the station registry while the relay stands (State.syncPosts): the
     door's place (T.post.at from the fire), what the knives need and what a scrapper camp spares, the chief who keeps the door
     (the man at the fire when the relay went up names it), his voice at the board, his words for your grievances and your
     word, and what its stars bring. A camp without a chief keeps no road and never asks. */
  const campPosts = {
    pass: {
      id: 'passfire', role: 'The knives\' fire · on the wire', line: 'Two knives and a chief who kept a road three times.',
      needs: ['food', 'meds', 'textiles'], makes: ['parts'], chiefs: { chief: 'Garrow', chief2: 'Denn' },
      voice: {
        hello: 'You walked my road three times with a gift on your back. Now you walk it with a crate. Board\'s there. My knives read it slow.',
        critical: 'We are hungry out here, and the knives remember how we used to fix that. Don\'t make them remember.',
        wanting: 'Short, not starving. A camp can live on short. It gets mean on it.',
        steady: 'Fed, warm, lit. My knives sit by the lamp and argue about the wire. Better than the road.',
        thriving: 'Look at it. A camp with a lamp and full pots. Nobody in the valley believes it. I barely do.',
        relit: 'The lamp back on the pole. The knives cheered. Don\'t tell anyone they cheered.',
      },
      react: { critical: 'That fills the pots tonight. My knives will sleep instead of walking.', wanting: 'Good. Short beats hungry.' },
      grief: {
        ground: '{name} is lying on the road with our name on it. We used to take things off that road. Now we wait for them. Don\'t make waiting a mistake.',
        camp: 'Another camp has {name}. One of ours, once. Get it back.',
        given: 'You gave up the run with {name}. On the wire we get told what\'s coming. We were told. It didn\'t come.',
        remembered: '{name} never came. The knives stopped asking. I didn\'t.',
        made: '{name}. Here, after all. The knives saw it come in. Good.',
        promise: 'Your word. I took your word three times at this fire already. Two days, then.',
        sorry: 'Sorry. We don\'t say it out here. You paid it at the board. That counts.',
        broken: '{name}, two days, and not here. Your word broke at the fire it lit. The knives saw.',
        kept: '{name}, in time. Your word held at my fire again.',
        errand: 'You kept your word twice at this board. Here — my own letter, sealed, for {town}. Two days. The knives want to see the wire carry it.',
        errandKept: '{town} has it. The first letter this camp ever sent. The knives are pretending not to be proud.',
        shut: 'No more words at this fire. Bring one of ours through without one first.',
        heardKept: 'The wire says you kept your word at {town}. Out here that\'s news. The knives passed it round.',
        heardBroken: 'The wire says your word broke at {town}. I kept a road on your word. Don\'t make me sorry.',
        answered: 'Wire says three, kept, none here. You kept my road three times — I count that. My letter, sealed, for {town}. Two days.',
        hearsay: 'Twice the wire says you broke it. I didn\'t see it. The knives want no words from you till they see something.',
        seen: 'The wire said broke. The knives watched you do it right at our board. Words again.',
        ahead: '{who} wrote from {town}. To a knife camp. Says you keep your word. I know you do. Board\'s there.',
        third: 'Three letters about you. Last one from {who} at {town}. My own is sealed and on the board. Carry it.',
      },
      stars: [null, { note: 'The knives share their salvage — metal with every delivery, more with every star' }, { note: 'The lamp burns higher — the camp\'s light reaches further' }, { note: 'The ring walks easy — the light holds the grey off the road' }, { note: 'The knives walk the road for the wire' }, { note: 'Pass Camp — a door in the valley' }],
    },
    ash: {
      id: 'ashfire', role: 'The ash fire · on the wire', line: 'The far camp under the Foundry, lit last and meanest about it.',
      needs: ['food', 'meds', 'lumenCell'], makes: ['parts'], chiefs: { chief: 'Harl', chief2: 'Oake' },
      voice: {
        hello: 'Three gifts down my road and a lamp on my fire. The Foundry smokes about it. Board\'s there. Read it.',
        critical: 'The lamp eats cells and my knives eat what they can get. Both running out. Fix one.',
        wanting: 'Short. Out here short means somebody walks at night. I\'d rather they didn\'t.',
        steady: 'The lamp burns, the pots are full, the knives sit. That\'s all anybody out here ever wanted.',
        thriving: 'Full pots, a lit lamp, a board with paper on it. Ash Camp. Who knew.',
        relit: 'The lamp\'s back. The knives stood up when it came on. Every one of them.',
      },
      react: { critical: 'Cells for the lamp, food for the knives. That\'s tonight fixed.', wanting: 'That helps. Say nothing about it.' },
      grief: {
        ground: '{name} is on the road with Ash on it. Out here a thing on the road gets taken. Get there first.',
        camp: 'A camp has {name}. Ours. Get it back before my knives go and do it their way.',
        given: 'You gave up the run with {name}. The wire told us it was coming. We lit the lamp for it.',
        remembered: '{name} never came. We don\'t forget out here. We didn\'t used to have to.',
        made: '{name}, here. Late. Here. My knives turned the lamp up a notch.',
        promise: 'Your word, at my fire. I have held your word before. Two days.',
        sorry: 'Sorry. Out here we say it with a knife put down. You paid it at the board instead. Fine.',
        broken: 'Two days and no {name}. You broke your word at a fire you lit. Everybody in the ring saw.',
        kept: '{name}, in time. Your word stands at this fire. It always has.',
        errand: 'Twice your word held at my board. Here — my letter, sealed, for {town}. Two days. Ash never wrote anybody before.',
        errandKept: '{town} has it. Ash Camp wrote a letter and it got there. The knives laughed about it all night.',
        shut: 'No more words at this fire. One of ours through without a promise. Then talk.',
        heardKept: 'Wire says you kept your word at {town}. Good. You kept mine first.',
        heardBroken: 'Wire says your word broke at {town}. I lit this lamp on your word. Think about that.',
        answered: 'Wire says three, kept. Not here — here you kept my road. My letter, sealed, for {town}. Two days.',
        hearsay: 'Wire says twice you broke it. Didn\'t see it. Don\'t need to. No words at my fire till I do.',
        seen: 'Wire said broke. My knives saw you do right at our own board. That counts more. Words again.',
        ahead: '{who} wrote from {town}. To Ash. Says you keep your word. I lit my lamp on it once already. Board\'s there.',
        third: 'Three letters reached Ash, the last from {who} at {town}. I sealed my own before you came. It\'s on the board.',
      },
      stars: [null, { note: 'The knives share their salvage — metal with every delivery, more with every star' }, { note: 'The lamp burns higher — the camp\'s light reaches further' }, { note: 'The ring walks easy — the light holds the grey off the road' }, { note: 'The knives walk the road past the Foundry' }, { note: 'Ash Camp — a door in the valley' }],
    },
  };
  /* v3.49 — the raider who cuts the mast in the storm, the chief at the dark board, the splice; the chief who gives the ring
     up and the fighters who leave for the hills; the knife who sets the camp's own stone by the cairn set twice; the hand
     who asks to stay on ({first}: whose day they walked for) */
  const cutLines = {
    raider: ['Lamp\'s out. Your wire\'s done.', 'Storm night. Nobody\'s watching the pole.', 'Let\'s see them read their board now.'],
    chief: ['They cut it in the storm. Board\'s shut till it\'s spliced.', 'Wire\'s down. The lamp\'s dark. You know what to bring.', 'Somebody\'s knives came in the rain. The board waits for the wire.'],
    splice: ['Spliced. The lamp\'s ours again.', 'There it is. Board\'s open.', 'Lit. Tell whoever cut it we noticed.'],
  };
  const givenLines = {
    chief: ['Twice you sat out there. Take the fire. We\'re going up to the hills.', 'Twice. I\'m not sitting a third. The fire\'s yours — keep it lit.', 'Take it. Hides, box, fire. We\'ll find a colder ring.'],
    leave: ['Up the hills, then.', 'Pack the hides. Leave the big one.', 'Don\'t look back at it.'],
  };
  const kstoneLines = {
    set: ['From us. Leave it standing.', 'That one\'s ours. Beside theirs.', 'Seven days it stood. It gets company.'],
  };
  /* v3.51 THE CAMPS ON THE ROUTES — the knives whose stone stands beside yours: letting you through, walking their salvage in */
  const routeLines = {
    pass: ['Stone-friend. Walk through.', 'Let that one by. The stone.', 'Go on. Our stone stands by yours.'],
    leave: ['Salvage for the lit door. Back by dark.', 'Taking it down to their shelf.', 'For the town. In the Walker\'s name.'],
    door: ['From the knives. Salvage, for your shelf.', 'The camp sends this. Tell the Walker.', 'Scrap and parts. From the stone-friends.'],
  };
  const staysLines = {
    ask: ['Three of {first}\'s days now. Let me stay on.', 'I\'ve walked {first}\'s day three times. I\'d like to keep walking.', 'Don\'t send me back. For {first}.'],
  };
  /* v3.48 — the chief asking for the wire and on it; the chief out at the watch's line under a white rag, and the line's
     answer; the stones set twice, and a knife passing them; the kin on the kin's day ({first}), and the hand the town sends */
  const postLines = {
    ask: ['Three times you walked it in. Put us on your wire.', 'You kept my road three times. Bring the wire to my fire.', 'Three gifts. My knives ask what you want. I ask for the lamp.'],
    wired: ['The lamp is ours now. Tell the valley.', 'On the wire. My knives don\'t know what to do with their hands.', 'Lit. Nobody here has seen that from the inside.'],
  };
  const siegeLines = {
    chief: ['Three nights. Nobody in my camp has slept. Talk.', 'You win the dark. Put your lamps down and talk.', 'Enough. The rag is up. What do you want?'],
    line: ['Then sleep. We\'re walking home.', 'A truce, then. We heard you.', 'Nobody wanted the fourth night.'],
  };
  const twiceLines = {
    set: ['Twice now. It stays.', 'Set again. They\'ll step round it this time.', 'Kick that. I\'ll set it a third time.'],
    left: ['Leave it. That one\'s twice.', 'Step round. Not that one.', 'Twice set. Walk on.'],
  };
  const kinDayLines = {
    kin: ['It is {first}\'s day. We light two candles and say the name.', 'Seven days again. {first} would have laughed at the candles.', '{first}\'s day. The town sent you someone for the road — go on.'],
    join: ['{town} sent me. I walk your next leg.', 'The kin asked. {town} sent me. Where to?', 'For {first}. I\'ll carry what you give me.'],
    leave: ['This is where I turn back. Go well.', 'My leg\'s done. {town} is that way. Go well.', 'Back to {town}. Tell them I walked it.'],
  };
  /* v3.46 A SCORE SETTLED — what the one who fell says at the camp's ring ({camp}), by how it was paid */
  const settleLines = {
    taken: ['{camp} flies the Order\'s grey now. That was for me.', 'They put me in the ditch. Now the ring\'s ours. Square.'],
    'stood down': ['They put the knives down. That\'s enough for me.', 'The light got there first. I\'ll take it. We\'re done.'],
    chief: ['Their chief went down in the open. I watched it from here. Done.', 'The rag\'s on a stake. That\'s my score. Let\'s walk.'],
  };

  /* ---------- echo porters ---------- */
  const echoNames = ['K. Harlan', 'M. Osei', 'Juno Longwalk', 'T. Vasquez', 'R. Bell', 'Old Marrow', 'S. Ito', 'Wren', 'Cassa', 'The Twins'];
  /* candidate echo structures, spawned as connections advance (trigger = station id just connected) */
  const echoSpots = [
    { trigger: 'mill', type: 'ladder', x: 3490, y: 8660, ang: 0.35, by: 'K. Harlan', likes: 214 },
    { trigger: 'mill', type: 'generator', x: 5310, y: 8810, by: 'M. Osei', likes: 96 },
    { trigger: 'green', type: 'ladder', x: 2600, y: 7916, ang: 1.62, by: 'Juno Longwalk', likes: 340 },
    { trigger: 'green', type: 'shelter', x: 5200, y: 7200, by: 'R. Bell', likes: 158 },
    { trigger: 'quarry', type: 'watchtower', x: 3000, y: 7040, by: 'S. Ito', likes: 122 },
    { trigger: 'relay', type: 'shelter', x: 6620, y: 6460, by: 'Old Marrow', likes: 273 },
    { trigger: 'relay', type: 'ladder', x: 6704, y: 5046, ang: 1.35, by: 'Wren', likes: 187 },
    { trigger: 'foundry', type: 'generator', x: 6670, y: 4880, by: 'T. Vasquez', likes: 205 },
    { trigger: 'foundry', type: 'ladder', x: 3404, y: 4764, ang: 1.5, by: 'Cassa', likes: 311 },
    { trigger: 'foundry', type: 'shelter', x: 3720, y: 2360, by: 'The Twins', likes: 402 },
  ];

  /* ---------- structures ---------- */
  /* v3.28c THE TYPE LEDGER — the law: a structure type is FOREVER. Any future rename or removal
     ships its map entry here in the same edit, and load() walks every save forward through it.
     The audit of every shipped version found the type history ADDITIVE-ONLY, so the ledger opens
     empty — the seam existing is the fix; a rename without its entry is a build that doesn't ship. */
  const MIGRATE_TYPES = {};
  const structures = {
    ladder: { name: 'Ladder', span: 190, cost: null, hp: 100, decay: 1.5, desc: 'Crosses a cliff or river. Slow going, but going.' },
    fieldladder: { name: 'Field ladder', span: 190, cost: { metal: 8 }, hp: 100, decay: 1.5, desc: 'Lashed from scrap where you stand. Rigging 2.' },
    bridge: { name: 'Bridge', span: 270, cost: { metal: 48 }, hp: 100, decay: 0.7, desc: 'A real crossing. Full speed, full load.' },
    generator: { name: 'Generator', aura: 400, cost: { metal: 28 }, hp: 100, decay: 1.0, desc: 'Warmth and light. Stamina refills fast nearby; leaves you warmed.',
      tiers: [{ cost: { metal: 10 }, name: 'Twin burner', desc: 'The aura grows a third; stamina refills half again as fast.' }, { cost: { metal: 22, lumen: 6 }, name: 'Hearth housing', desc: 'The fire HEALS whoever rests in its reach, and the warmth soaks deep.' }] },
    shelter: { name: 'Shelter', aura: 380, cost: { ceramic: 26 }, hp: 100, decay: 1.0, desc: 'Rain cannot reach you here. Repairs containers, restores you.',
      tiers: [{ cost: { ceramic: 10 }, name: 'The room', desc: 'Big enough to step INSIDE — nothing with claws or made of grey can follow. Rest fast. A drying rack under the eave banks PROVISIONS when meadow grows in reach.' }, { cost: { ceramic: 18, wood: 8 }, name: 'The bed', desc: 'Inside, wounds close and battered cargo mends while you breathe.' }] },
    watchtower: { name: 'Watchtower', aura: 1150, cost: { metal: 18 }, hp: 100, decay: 1.0, desc: 'Reveals the land, marks lost cargo and lumen.',
      tiers: [{ cost: { metal: 8 }, name: 'The horn', desc: 'Pursuers under its watch are CALLED OUT and slowed — the land itself takes your side.' }, { cost: { metal: 16, ceramic: 8 }, name: 'Armed post', desc: 'A walker stands the platform: runners passing beneath are knocked sprawling — and the spotter\'s tithe sweeps stray METAL into your bank between rounds.' }] },
    zipline: { name: 'Zipline pylon', cost: { metal: 30, lumen: 8 }, hp: 100, decay: 0.8, range: 1700, desc: 'Links to pylons in range. Fly over everything.',
      tiers: [{ cost: { lumen: 4 }, name: 'Greased line', desc: 'Lines from this pylon fly a third faster.' }, { cost: { metal: 10, lumen: 8 }, name: 'Cradled line', desc: 'Reaches 300 further — the far pylons come into range.' }] },
    pobox: { name: 'PO Box', cost: { metal: 6 }, hp: 90, decay: 0.5, desc: 'A weatherproof box on a post: stash cargo on the road, take it back later — or leave it for the walkers.' },
    /* v3.27 THE ECOSYSTEM — production works: sited by terrain, paying into the bank, feeding the
       utilities that built them. Everything has a purpose; everything helps the other. */
    lumenstill: { name: 'Lumen still', cost: { metal: 14, ceramic: 6 }, hp: 90, decay: 0.9, work: 'lumen',
      desc: 'Condenses the grey itself into lumen. Wants the VEIL thick at its site — the light\'s edge, not its heart — and a storm is a harvest.' },
    sawcamp: { name: 'Sawcamp', cost: { metal: 10, wood: 4 }, hp: 90, decay: 0.9, work: 'wood',
      desc: 'Saws and racks by a treeline. Wants FOREST in reach — and it sharpens any forrester working the same stand, who sharpens it right back.' },
    clayoven: { name: 'Clay oven', cost: { metal: 8, wood: 6 }, hp: 90, decay: 0.9, work: 'ceramic',
      desc: 'Bakes marsh clay into slab. Wants WET GROUND close — marsh or shallows within a short walk.' },
    /* v3.28c — the honest form of a type past the ledger (a save from a NEWER build): a real,
       visible, inert object. decay 0, no work, never buildable (buildOptions is curated), carries
       its original type on the object and steps back into itself the moment a build knows it. */
    unmapped: { name: 'Unmapped works', span: 60, cost: null, hp: 100, decay: 0, desc: 'A build from a newer register. It stands quiet until a build that knows it.' },
  };

  /* ---------- cargo item defs ---------- */
  const items = {
    core: { name: 'Beacon core', kg: 18, fragile: false, cat: 'core' },
    coreHeavy: { name: 'The Pharos Core', kg: 30, fragile: false, cat: 'core' },
    meds: { name: 'Medicine', kg: 7, fragile: true, cat: 'goods' },
    letters: { name: 'Letters', kg: 2, fragile: false, cat: 'goods', service: true },
    dispatch: { name: 'Rider’s dispatch', kg: 1.5, fragile: false, cat: 'goods', service: true },
    parcel: { name: 'Parcels', kg: 4, fragile: true, cat: 'goods', service: true },   // v3.40: the third kind of post — the town's own, to its own
    food: { name: 'Rations', kg: 12, fragile: false, cat: 'goods' },
    seeds: { name: 'Seed stock', kg: 8, fragile: false, cat: 'goods' },
    parts: { name: 'Machine parts', kg: 15, fragile: false, cat: 'goods' },
    lumenCell: { name: 'Lumen cells', kg: 8, fragile: true, cat: 'goods' },
    filters: { name: 'Water filters', kg: 10, fragile: false, cat: 'goods' },
    textiles: { name: 'Textiles', kg: 9, fragile: false, cat: 'goods' },
    seedlings: { name: 'Seedlings', kg: 6, fragile: true, cat: 'goods' },
    coolant: { name: 'Coolant', kg: 11, fragile: false, cat: 'goods' },
    relayParts: { name: 'Relay optics', kg: 9, fragile: true, cat: 'goods' },
    tools: { name: 'Hand tools', kg: 12, fragile: false, cat: 'goods' },
    bigCrate: { name: 'Bulk crate', kg: 34, fragile: false, cat: 'goods' },
    metal: { name: 'Scrap metal', kg: 8, fragile: false, cat: 'mat', mat: 'metal', qty: 10 },
    ceramic: { name: 'Ceramic slabs', kg: 7, fragile: false, cat: 'mat', mat: 'ceramic', qty: 10 },
    lumen: { name: 'Raw lumen', kg: 3, fragile: false, cat: 'mat', mat: 'lumen', qty: 5 },
    wood: { name: 'Cut timber', kg: 6, fragile: false, cat: 'mat', mat: 'wood', qty: 10 },
    highleaf: { name: 'Highleaf smokes', kg: 5, fragile: false, cat: 'contra' },
    ladderTool: { name: 'Ladder', kg: 3, fragile: false, cat: 'tool', tool: 'ladder' },
    kitTool: { name: 'Build kit', kg: 5, fragile: false, cat: 'tool', tool: 'kit' },
    /* v3.45 — the kin's errand: what the fallen left in the square, carried home to the stones */
    kinShield: { name: 'A round shield', kg: 5, fragile: false, cat: 'kin' },
    kinLantern: { name: 'A lantern', kg: 2, fragile: true, cat: 'kin' },
    keepsake: { name: 'A keepsake', kg: 0.2, fragile: false, cat: 'kin' },
    fireGift: { name: 'The road\'s gift', kg: 6, fragile: false, cat: 'gift' },   // v3.47: carried to a camp's fire to keep its truce road   // v3.46: the kin's thanks — named for the fallen and the thing
    relayKit: { name: 'The relay kit', kg: 16, fragile: false, cat: 'gift' },   // v3.48: raised at a camp's fire to put it on the wire
    wireCoil: { name: 'The splice coil', kg: 6, fragile: false, cat: 'gift' },   // v3.49: carried to a cut mast and spliced there
  };

  /* ---------- priority chain ---------- */
  const priority = [
    {
      id: 'p1', from: 'haven', to: 'elm', items: [['meds', 1], ['letters', 1]],
      title: 'First steps', brief: 'Elm Farm ran out of insulin four days ago. Haven has some. Nobody has walked it over. You are nobody, for now.',
      arrive: 'You did that. Look at their medicine bar — that is what a crate means here. And the letters? Letters pay nothing. They pay ANYWAY — open THE POST at any terminal and watch a town warm to you.',
    },
    {
      id: 'p2', from: 'elm', to: 'haven', items: [['food', 2]],
      title: 'The crossing', brief: 'Haven has been eating its reserves. Elm sends food back — two crates, feel the weight change. They packed two ladders with it: lay one over the creek and keep the crates dry.',
      grant: { ladders: 2 },
      arrive: 'Haven eats tonight. Look at the board — Elm needs tools, and Haven makes them.',
    },
    {
      id: 'p3', from: 'haven', to: 'elm', items: [['core', 1], ['letters', 1]],
      title: 'First light', brief: 'Elm Farm’s waylight has been dark a year. Haven spared a beacon core — eighteen kilograms. With both lit, food and tools move between them on their own, and the quiet loses a field.',
      connect: 'elm',
      arrive: 'Elm Farm is on the wire. From here on Haven eats and Elm mends — without you. That is what you are building.',
    },
    {
      id: 'p4', from: 'haven', to: 'mill', items: [['core', 1], ['parts', 1]],
      title: 'Light for the Mill', brief: 'The Mill has been hungry since winter and nobody has heard the saws. A core over the saddle puts them on the wire — and every road starts with their timber. Mara throws you the reins of the POST HORSE for the run: the Order moved faster than boots, once. It will again.',
      grant: { ladders: 1, horse: true },
      connect: 'mill', unlock: ['kit'],
      hint: 'R mounts and dismounts the horse — fast, tireless, steady, but it balks at water and crossings. The ▲ is a direction, not a road; a ladder (B) spans a cliff.',
      arrive: 'The Mill is on the wire. Sawyers wave from the yard — and Elm’s food will find them now without you.',
    },
    {
      id: 'p5', from: 'haven', to: 'green', items: [['core', 1], ['meds', 1]],
      title: 'Across the Silt', brief: 'The Greenhouse grows the valley’s medicine and cannot get it across a river that does not care. Bridge it at the narrows, or find another way — every farm south of here is waiting.',
      grant: { kits: 1 },
      connect: 'green', unlock: ['shelter', 'watchtower'],
      hint: 'The Silt is deep. Wade to the edge of the deep water and lay a ladder — or bridge the narrows with your kit where waylight reaches.',
      arrive: 'Glass roofs catch the new light. The botanists send everyone tomatoes.',
    },
    {
      id: 'p6', from: 'green', to: 'quarry', items: [['core', 1], ['food', 1]],
      title: 'Stone and wire', brief: 'The Quarry has iron and nobody to send it to. Scrappers hold the ridge between — Waylighters who were never paid, once. They only chase a loaded one.',
      connect: 'quarry',
      hint: 'Scrappers chase loaded walkers. Outrun them, route around, or wait — waylight pacifies a camp for good.',
      arrive: 'Stonecutters light the terraces. The road fund begins — the Quarry pays in metal.',
    },
    {
      id: 'p7', from: 'green', to: 'relay', items: [['core', 1], ['relayParts', 1]],
      title: 'The high watch', brief: 'Relay Hill still listens every night to nothing. With optics they could see the whole valley — who is dark, who is short, who is moving. Fragile. The climb is not kind.',
      connect: 'relay',
      hint: 'Fragile optics: every stumble costs the grade. Hold Space to brace on the climb.',
      arrive: 'The dish turns. The north map unrolls: the deep grey, and the Foundry inside it.',
    },
    {
      id: 'p8', from: 'relay', to: 'foundry', items: [['core', 1], ['coolant', 1]],
      title: 'Into the grey', brief: 'The Foundry never went dark — it went quiet, which is worse. Their coolant runs out in weeks. The mist between is deep enough for wraiths. Move slow, or burn flares.',
      connect: 'foundry',
      hint: 'Wraiths hunt movement in deep grey. Creep braced (hold Space), or burn a flare (F). Fabricate flares at any terminal.',
      arrive: 'The forges roar back. Smiths press blueprints into your hands.',
    },
    {
      id: 'p9', from: 'foundry', to: 'pharos', items: [['coreHeavy', 1]],
      title: 'The Pharos', brief: 'A hundred people nobody has reached in a year, at the one light the whole valley could see. Thirty kilograms of core through the deepest grey. Everything you have built is for this walk.',
      connect: 'pharos',
      hint: 'Thirty kilos. Roads, ziplines, shelters, a companion — everything you built is for this walk.',
      arrive: 'The Pharos ignites.',
    },
  ];

  /* ---------- letters: read aloud when they arrive (from → to) ---------- */
  const letterLines = [
    'The saws are quiet but the children are not. Send thread if you have it. — M.',
    'We buried Odd on the terrace he cut. He would have hated the speech. — the Quarry',
    'Tell the Greenhouse the seed they sent came up. All of it. Every row. — Elm',
    'The dish turned by itself last night for six seconds. Nobody slept after. — Relay',
    'We have enough coolant for a month if nobody breathes on the furnace. — Foundry',
    'Ask your Waylighter what the sky looks like where you are. We have forgotten. — Pharos',
    'If this reaches you the road is open. If it does not, it was open once. — Haven',
    'The child is walking again. Whatever was in that crate, send it twice. — Elm',
    'Found a photograph in the kiln ash. Four people squinting. One of them is you. — Mill',
    'We are fine. We are fine. We are fine. Please answer. — Relay',
    'The glass held through the storm. The tomatoes did not. Send anyone who likes soup. — Greenhouse',
    'A Waylighter died on the ridge last winter. We kept her name on the board. Bring us another. — Quarry',
    'Coolant for parts, parts for coolant. That is not trade, that is a marriage. — Foundry',
    'The light you carry is not the point. The carrying is. — old Waylighter saying, quoted at every fire',
    'We can hear the Pharos bell on still nights. It is ringing for someone. — Relay',
    'Half the valley thinks the mist is weather. The other half stopped talking. — Haven',
    'Send textiles before the greyfall season. Send them anyway. — Mill',
    'Our doctor is nineteen and learning from a book you delivered. Send the next volume. — Quarry',
    'The seedlings arrived bruised and alive, like everyone else. — Elm',
    'We put a lantern in the window every night for the walkers. It has never once been needed. Keep it lit. — Greenhouse',
    'Tell Haven the debt is forgiven. Tell them to send food. — Foundry',
    'What do we call it, the mist? We call it the quiet. It grows where nothing moves. — Pharos',
    'The pump runs again. Parts from the Mill, hands from nowhere. — Greenhouse',
    'You walked through scrapper ground to bring letters. They were mostly complaints. Thank you. — Mill',
  ];

  /* ---------- fabrication ---------- */
  const fabItems = [
    { id: 'ladder', name: 'Ladder', cost: { metal: 8 }, gives: 'ladderTool', desc: '3 kg on the back. Crosses cliffs and rivers.' },
    { id: 'kit', name: 'Build kit', cost: { metal: 16, ceramic: 8 }, gives: 'kitTool', needs: 'kit', desc: '5 kg. Becomes a bridge, generator, shelter, watchtower or pylon.' },
    { id: 'flare', name: 'Flare', cost: { lumen: 6 }, needs: 'flare', desc: 'Burns the mist. Wraiths cannot stand it.', max: 5 },
  ];

  /* ---------- tuning ---------- */
  const T = {
    baseCap: 60, baseStam: 100,
    walk: 100, sprintMul: 1.55, braceMul: 0.72,
    zipSpeed: 720, roadMul: 1.6, ladderMul: 0.42,
    sprintDrain: 7, ladderDrain: 4, riverDrain: 9,
    standRegen: 9, litRegenMul: 1.5, walkRegenLit: 2.5,
    lowStam: 22,
    wobbleWindow: 0.95, wobbleStamCost: 3,
    stumbleDmg: [10, 24], stumbleDropChance: 0.55,
    rainDmg: 0.4,             // %/s at full intensity, unprotected
    decayBase: 0.035,          // structure %/s baseline in dark (≈48 min life)
    grabDrain: 0.20, grabGain: 0.085, grabStart: 0.45,
    wraithSpeed: 118, wraithSense: 400, wraithMist: 0.68,
    /* v3.31 THE FAIRNESS PASS — the chase obeys the world: raiders are FOOT (a sprint outruns
       them unloaded, a horse ALWAYS does), they climb slopes like everyone, stop at cliffs, and
       give up past their leash. 152 flat was a relative-chase cheat; it is gone. */
    scrapSpeed: 118, scrapCatch: 38, scrapLeash: 720,
    starThresholds: [100, 260, 520, 900, 1450],
    levelBase: 70, levelPow: 1.38,
    likesBase: 12, likesPerSec: 0.45, likesPerKg: 0.85,
    needMul: { critical: 2.2, wanting: 1.5, steady: 1.0, thriving: 0.6 },   // what a crate is worth depends on who is waiting for it
    chainBonus: 0.15,          // each further stop on one trip pays this much more
    /* THE POST — letters are the Order's SERVICE: zero trust, ever. Goods are luxury; luxury pays.
       The mailbag fills with time (townsfolk write); a Letter runner on staff doubles the pen speed.
       Tiers by the walk: LOCAL POST / LONG POST / GREY POST — paid in porter XP and appreciation. */
    bagFill: 0.11, bagRunner: 0.13, bagCost: 35, parcelCap: 3, parcelEvery: 2, mailFarSecs: 60,   // v3.51: a walk of more than a minute on the feet's own route is LONG POST (300 s was more than any walk in the valley takes — no safe run was ever far)   // v3.40: a parcels round packs a parcel every second shift, three to a run
    /* v3.42 THE GRIEVANCE — a parcel off the pack is the town's own on the ground, and the town says so:
       appreciation lost at the door it was addressed to when it hits the ground, again when a camp carries
       it in, more when the run is given up; made right (delivered after all) it pays back more than it
       cost; unanswered for fadeDays it becomes the town's MEMORY — likes gone for good */
    grievance: { ground: 4, camp: 4, given: 6, made: 8, fadeDays: 2, memory: 3 },
    /* v3.42 THE BOLT — a bowman's arrow left in: stamina comes back at half pace and the wound seeps
       until it is pulled — by a medic walking with you (medicR, medicTime), by your own hand (pullSelf
       health, pullTime standing still), or by a lit town's hands at the terminal */
    arrow: { seep: 0.12, stamMul: 0.5, medicR: 90, medicTime: 2.5, pullSelf: 4, pullTime: 2.4 },
    /* v3.43 THE SCAR — a pulled bolt leaves a wound: the wind's ceiling lower until it is dressed (a medic
       walking with you, every dressEvery inside medicR; a lit town's hands once a visit); dressed it heals
       in healDays, undressed it hangs on undressedDays — the walk's own memory */
    scar: { stamMul: 0.85, dressings: 3, dressEvery: 60, medicR: 90, healDays: 1, undressedDays: 2 },
    /* v3.43 THE TOWN'S OWN WHO FALL — when a square rises, each of the town's own standing in it rolls; the town is colder for every one */
    ownFall: { chance: 0.5, likes: 5 },
    /* v3.44 THE WALKER'S WORD — an answer to the face at the door. A PROMISE binds you to bring that parcel
       through in promiseDays: while it stands the town does not remember (it waits); kept, the door thanks
       you kept more and the town is keptLikes warmer; broken, the town remembers at brokenMemory likes for
       good. An APOLOGY costs sorryCost appreciation now, and the grievance goes quietly when its days run —
       the likes kept. A memory cannot be answered. */
    word: { promiseDays: 2, kept: 2, keptLikes: 1, brokenMemory: 6, sorryCost: 5,
      /* v3.45 A WORD REMEMBERED — the town's book counts your words: errandAt kept at a door opens THE KEEPER'S ERRAND (a
         sealed letter to the farthest lit door, due in errandDays: kept pays errandAppr and errandLikes at home and errandDest
         at the far door, and counts as a kept word; late, it is a broken word); a broken word SHUTS promises at that door
         until a grievance there is made right without one */
      errandAt: 2, errandDays: 2, errandAppr: 20, errandLikes: 3, errandDest: 6,
      /* v3.46 THE WORD ON THE WIRE — a word kept or broken at a lit town walks the wire (speed world units a second) to its
         near nearest lit towns; landing, kept warms each by likes and appr, broken cools each by likes */
      wire: { near: 2, likes: 1, appr: 2, speed: 260 },
      /* v3.47 THE WORD ANSWERED — a town that has HEARD kept words down the wire (answer.kept) and never kept one of yours at
         its own door posts THE KEEPER'S ERRAND on the wire's word; one that has heard broken words (answer.broken) shuts its
         promises by hearsay until you do right by it there (a delivery in good time, or a grievance made right) */
      answer: { kept: 3, broken: 2 } },
    /* v3.45 THE KIN'S ERRAND — the kin keeps the stones errandDays: the shield brought home or the lantern set lit (a flame
       taken at a lit waylight burns burn seconds) pays likes and appr at the town */
    kin: { errandDays: 3, burn: 900, likes: 4, appr: 6, keepsakeLikes: 1, relights: 2, relightLikes: 2, setLikes: 3, setAppr: 4, setR: 60 },   // v3.46: the keepsake's like at its town; the stone's flame asked again at dark, twice, then the kin keep it; v3.47: the keepsake set at the stone (setR of it)
    /* v3.47 THE ROAD KEPT — THE ROAD'S GIFT (gift, from the bank, kg on the pack) walked to the fire (reach of the chief)
       before the word or the truce runs out renews the word for pactDays; run out ungifted, the knives put up their own man
       and pull the rags (the pole bare bareDays). On a truce road inside an open ring (roadW of its line) the knives let a
       loaded Walker walk, and a Walker carrying the gift walks the whole ring */
    road: { gift: { provisions: 30, metal: 20 }, kg: 6, reach: 150, roadW: 70, bareDays: 1 },
    /* v3.47 THE STONE'S KEEPING — a back passing (passR) a standing cairn stops pauseT and faces it (once in passCd a stone);
       the one who set it is lighter moodDays. A camp that comes back up sends a knife from its ring's edge to kick the cairn
       (walk seconds out, kick seconds at it) — and the one who set it has a score again */
    stone: { passR: 70, pauseT: 1.6, passCd: 240, moodDays: 1, walk: 5, kick: 1.2 },
    /* v3.47 THE WATCH — the line left at a ring for the night: from dark to dawn the camp stays in and your charter runs cross
       its ring as at a truce; at dawn the backs walk home (speed) to the nearest lit door and fall in within fallInR of it;
       the fire behind the line lights fireR; the watch in the mood moodDays */
    watch: { speed: 84, fallInR: 260, fireR: 76, moodDays: 1 },
    /* v3.48 THE WORD GONE AHEAD — a door that answered you, its errand kept, writes ahead down the wire to the nearest town you
       have never reached: landing, that town is appr and likes warmer and counts as known (boards post to it), and the first
       delivery walked through its door pays firstLikes more */
    ahead: { appr: 6, likes: 4, firstLikes: 6 },
    /* v3.48 THE CAMP ON THE WIRE — a camp whose road you kept `asks` times asks for the wire: THE RELAY KIT (kit, from the bank,
       kg on the pack) raised at its fire (reach of the chief) makes it a lit door, the chief its keeper; its light reaches
       baseR, its people are pop; the door stands at `at` from the fire (v3.49: the relay's mast at `mast` from the door — where it is
       drawn, cut and spliced) */
    post: { asks: 3, kit: { metal: 40, ceramic: 24, lumen: 6 }, kg: 16, reach: 150, baseR: 640, pop: 0.5, at: [40, 62], mast: [42, -10] },
    /* v3.48 THE WATCH'S SIEGE — a camp watched `nights` nights running tires: at that dawn its chief walks out (speed) to the line
       under a white rag, talks `talk` seconds, and a truce of truceDays stands — no fight */
    siege: { nights: 3, speed: 60, talk: 5, truceDays: 2 },
    /* v3.48 THE KIN'S DAY — every `every`th day from the day a keepsake went on a stone, from dusk (from) into the night (to)
       the kin stand at it with two candles; the Walker come within hearR hears them (the town likes warmer) and the fallen's
       town sends a hand to walk the next leg, home at the next lit door once `leg` seconds are walked */
    kinDay: { every: 7, from: 0.52, to: 0.74, hearR: 150, likes: 2, leg: 20 },
    /* v3.49 THE LETTERS PASSED ON — a town reached on a letter, once you keep a word there, writes ahead in its turn; a town at
       the end of errandAt letters posts its keeper's errand before you ever come */
    passed: { errandAt: 3 },
    /* v3.49 THE WIRE CUT — on a storm night (greyfall after dark) a camp still up sends a raider to cut a camp on the wire's
       mast (chance a storm night, not within graceDays of the raise or the last splice): he walks `walk` seconds in, cuts for
       `cut`, and runs; the post is dark until THE SPLICE COIL (a card on every lit board, kg on the pack) is spliced at the
       mast (reach) — `relight` seconds of sparks — which pays like a delivery: `pay` likes, the post `likes` warmer */
    cut: { chance: 0.5, graceDays: 3, walk: 5, cut: 1.4, back: 3, kg: 6, reach: 150, relight: 2.2, pay: 24, likes: 6 },   // an event every few days while camps are up, never a nightly chore
    /* v3.49 THE RING GIVEN — a camp that has come out to the line `lines` times gives its ring up: its fighters walk `leave`
       seconds for the hills; the fire is a rest stop — warm within fireR, a light of lightR at night */
    given: { lines: 2, leave: 12, fireR: 110, lightR: 64, likes: 30 },
    /* v3.49 THE KNIVES' STONE — a cairn set twice and left standing `days` days: a knife walks out (walk), sets the camp's own
       stone beside it (set) and walks back; the one who set the cairn is lifted moodDays */
    kstone: { days: 7, walk: 5, set: 1.4, back: 3, moodDays: 3 },
    /* v3.49 THE HAND WHO STAYS — a town's hand who has walked `legs` legs with you on its kin's days asks to stay on */
    stays: { legs: 3 },
    /* v3.51 THE ECOSYSTEM PASS (these numbers are mine) —
       THE SURPLUS ON THE BOARD: what the bank holds past `floor` (the reserve you build and eat from) is packed as freight —
       `pack` of a material to a crate of the good it makes (`makes`) — and posted at the board where it was last banked, to the
       known town shortest of that good: `max` crates a card, paid as a delivery at likesMul.
       THE STANDINGS IN THE PAY: a town's book — words kept at its door (`kept` each), heard kept down the wire (`heard` each),
       broken (`broken` each) — times the stance of whoever holds its door, moved from where that faction started (`stance` a
       step), is what its board pays, within [min, max]; `extraAt` kept words post a crate more, a book gone bad one fewer.
       THE CAMPS ON THE ROUTES: a camp whose stone stands beside yours sends a knife with its salvage every `every` days to the
       nearest lit town short of what it salvages — `stock` points of it, walked at `speed`; the Guide stops you at a rest
       fire or a camp's door on the way when you are hurt (`hurt`) or cold (`cold`) and it lies within `detour` of the walk. */
    surplus: { floor: { metal: 80, ceramic: 60, wood: 60, lumen: 30, provisions: 50 }, pack: { metal: 10, ceramic: 10, wood: 10, lumen: 5, provisions: 10 },
      makes: { metal: 'parts', ceramic: 'filters', wood: 'tools', lumen: 'lumenCell', provisions: 'food' }, max: 3, likesMul: 1.1 },
    standing: { kept: 0.06, heard: 0.03, broken: 0.1, stance: 0.1, min: 0.75, max: 1.3, extraAt: 2 },
    routes: { every: 1, stock: 14, speed: 64, likes: 2, hurt: 55, cold: 35, detour: 1.3, goods: ['parts', 'tools'] },
    /* v3.45 THE GRUDGE ANSWERED — a parley at the new chief's fire: a GIFT from the bank, a STAND at his fire (standTime still
       inside standR; he grants a truce of truceDays — his runners let you walk), or your WORD not to march on his camp for
       pactDays (broken, the fires remember: a season of reprisal) */
    parley: { reach: 150, gift: { provisions: 40, metal: 30 }, standTime: 15, standR: 120, truceDays: 1, pactDays: 3, roadMul: 0.7, giftBack: { metal: 30, provisions: 24 }, runnerSpeed: 72 },   // v3.46: the truce road's run, the chief's runner
    /* v3.45 THE WALKER'S SCORE — a camp that fells one of the party: the felled one meets its runners from reachMul farther
       and a score to settle is in their mood; settled when the camp is taken, stood down, or its chief falls; days, it cools */
    score: { days: 3, reachMul: 1.25, near: 400, settleR: 180, walkDays: 3, settledDays: 1, spot: 110 },   // v3.46: paid, the one who fell walks to the ring's edge with you
    /* v3.45 THE LINE AT THE RING — a ring walk ends with the wedge holding a line at the ring's edge, facing the camp, gap apart,
       until you walk holdR from the line or holdMax seconds pass */
    ring: { holdR: 420, holdMax: 120, gap: 34, holdLong: 300, turnR: 70, turnCd: 14, comeR: 110 },   // v3.46: the line's orders — HOLD the edge, COME in abreast
    apprByTier: [0, 6, 12, 22], apprTiers: [40, 100, 180, 280],
    apprNames: ['A FACE IN TOWN', 'KNOWN', 'TRUSTED', 'HONOURED', 'BELOVED'],
    shiftLen: 90, shiftWage: 1, shiftXp: 14, postAppr: 1,
    militiaCd: 300, militiaR: 320,
    horseMul: 1.75, horseRent: 4, horseRentT: 300,   // the road has more than one speed
    /* THE SHAPES OF WORK — the same walk, different questions. A circuit is one contract, many
       doors (every crate loads at accept: the pack is the puzzle; pay lands at the last door).
       A convoy's cargo is a person. Salvage is grey work, and grey work pays. */
    circuitMul: 1.35, salvageMul: 1.6, convoyLag: 220, dismantleBack: 0.6,
    /* v3.20 THE WORKING WORLD */
    paveLayR: 80, paveSpeed: [1, 1.12, 1.18, 1.24], trafficWear: 2, trafficStep: 11,
    fellRadius: 860, fellTime: 5, fellWood: 2, haulCap: 12, caravanCap: 30, haulLvCaravan: 5,
    fieldShift: 110, looterBase: 170, looterPer: 45,
    /* v3.21 THE BUILDS EARN THEIR GROUND */
    armedSafe: 10, armedCampR: 1700, armedCampMul: 0.78, armedChaseMul: 0.88,
    towerSlow: 0.7, towerKnockR: 130, insideRest: 34, insideHeal: 2.2, insideMend: 3,
    /* v3.24 THE PARTY OF FOUR — permadeath demands investment, and investment demands MERCY with
       teeth: companions are the health pool's first three quarters, the town never lets its own
       starve inside the walls, and the best-loved yard sends riders before the ledger closes. */
    partyMax: 3, koRecover: 540, koHeal: 32,
    townSafeR: 300, mercyMealCd: 300,
    rescueCd: 1500, rescueBase: 0.25, rescuePer: 0.18, rescueHeal: 30,
    compHorseRent: 3, compHorseBuy: 12,
    /* v3.25 THE EXILES — the cloaked torch and the rifle it carries. Precision fire is the
       Lamplighter's whole argument: not melee, not brutes, hard-hitting marksmen. The warning
       shot costs nothing but a round; the shot that CONNECTS writes the renegade ledger — the
       exact violence that made them exiles. */
    rifleRange: 430, rifleWarnR: 540, rifleCd: 6, rifleDropCd: 25,
    rifleRenegade: 2, rifleHeat: 2, lampAmmoStart: 12, lampClassAmmo: 6,
    lampTriggerHp: 55, sbsnGap: 240,
    /* v3.27 THE ECOSYSTEM — production clocks (seconds per unit banked) and siting reach.
       Disrepair below workHpMin pauses hands; the still doubles in grey weather; a sawcamp and a
       forrester on the same stand speed each other by the synergy factor. */
    stillRate: 90, sawRate: 75, ovenRate: 85, titheRate: 110, rackRate: 120,
    stillMist: 0.22, sawReach: 240, ovenReach: 160, rackReach: 220,
    workHpMin: 30, workSynergy: 1.25,
    /* v3.28 RECON & OUTPOSTS — the Frostpunk law, in the register's ink: a rider sent past the
       table's edge, sites that take real riding, an outpost that becomes a LINE HOME fed by the
       ecosystem, and Farkeeper steel purchasable over every caravan that walks it. */
    reconHire: { metal: 20, provisions: 6 },
    reconHazard: 0.3, reconHazardDelay: 45,
    outpostCost: { metal: 40, wood: 20, provisions: 12 },
    outpostCycle: 240, outpostHaul: 3, outpostAlt: 1,
    contractCost: 2, raidOdds: 0.35,
    lootAutoLv: 4, lootDepositFill: 0.8, lootNodeTime: 1.2,
    /* v3.30 THE EXILE ROADS — Shutterlight's clocks and prices. The follow is a guided journey
       (the exiles find YOU); rounds are dear because the Nomads collect rifles, not brass;
       contracts run on the wage-law's grammar with a hazard roll like the recon ride's. */
    exFollowDur: 90, a338Cost: 3, a338Stock: 6, a338Cycle: 240,
    exHazard: 0.25, exRank2: 3, exRank3: 7,
    /* THE BODY REMEMBERS — pushback is earned trouble, not frivolous QTEs. Wobble is rare on
       mastered ground, auto-steadied by a body that knows its footing, and NEVER cancels the
       travel chain: the player automates the walk, the valley shows them what still needs earning. */
    wobbleBaseMul: 0.38, wobbleSafeLoad: 0.62, autoSteadyStam: 2.5,
    snowAcc: 0.055, snowMelt: 0.045, snowCold: 0.42,   // shoulders collect the north; movement sheds it
    leafMax: 14,
    stockPerCrate: 28, stockDrain: 0.035, wireFlow: 0.06,                  // stock points: per delivered crate; lost per second (×pop); gained per second along a connected pair
    dayLen: 480,               // seconds per day; night is the last 40%
    gradeMult: { S: 1.6, A: 1.25, B: 1.0, C: 0.7 },
    premiumMult: 1.45,
    starR: 260, capMilestone: 0.15, zipMilestone: 0.26,
    coreLight: 0.35,           // light threshold counting as covered
    parPad: 1.6, parFloor: 50,
  };

  /* ranks of the Order — read them like a promotion, because they are one */
  const titles = [[0, 'Greenhand of the Order'], [4, 'Mudfoot'], [8, 'Waylighter, Sworn'], [12, 'Pathbinder'], [17, 'Lifeline'], [22, 'Lamplord'], [28, 'Legend of the Greymarch']];

  /* THE ORDER OF WAYLIGHTERS — the dead institution whose coat you wear and whose dispatch still runs.
     The Dispatch is the game's emcee: pre-quiet automation, all caps, zero doubt. Z's commander, NBA Jam's booth. */
  const dispatch = {
    chain: [null, null, 'DOUBLE DROP. THE WIRE NOTICES.', 'THREE STOPS — THE WIRE SINGS!', 'FOUR STOPS. WHO RAISED YOU?', 'FIVE STOPS — THEY WILL SING ABOUT THIS ONE.', 'SIX?! LEAVE SOME GLORY FOR THE REST OF THE ORDER.'],
    promo: 'ORDER OF WAYLIGHTERS — FIELD PROMOTION. RANK: %RANK%. THE COAT FITS BETTER ALREADY.',
    codeOk: ['CODE ACCEPTED, HOTSHOT.', 'THE OLD TRICKS STILL WORK.', 'DISPATCH SEES NOTHING. WINK.'],
    codeBad: ['NICE TRY.', 'THAT CODE DIED WITH THE NINETIES.', 'DENIED. WALK IT OFF.'],
    ignite: 'STATION ON THE WIRE — THE ORDER GROWS.',
  };
  /* the Roll of the Order — Cannon Fodder's hill: the dead are named, counted, and kept on the title screen.
     These walked before you; your own dead join them. */
  const rollSeed = [
    { name: 'Juno Longwalk', cls: 'Mountaineer', fate: 'the Silt took her', deliveries: 214, km: '61.0' },
    { name: 'K. Harlan', cls: 'Rigger', fate: 'fell with the bridge he was raising', deliveries: 168, km: '44.2' },
    { name: 'Old Marrow', cls: 'Hearthkeeper', fate: 'sat down by his fire and stayed', deliveries: 402, km: '90.8' },
    { name: 'M. Osei', cls: 'Courier', fate: 'outran everything except winter', deliveries: 131, km: '52.6' },
    { name: 'Wren’s Wren', cls: 'Scavenger', fate: 'the Grey kept her, boots and all', deliveries: 77, km: '31.3' },
    { name: 'The Twins', cls: 'Drifters', fate: 'one grave, by request', deliveries: 96, km: '38.0' },
  ];
  /* attract-mode taglines — box-copy with a pulse, rotating under the logo */
  const taglines = [
    'No chosen one. Just a pack and bad weather.',
    'The apocalypse still expects its mail.',
    'Pay: thanks, tomatoes, a bed by the fire.',
    'Scrappers hate this one weird trick: DELIVERY.',
    'Your knees will forgive you. The valley won’t forget you.',
    'Walk it off.',
    'Sixty kilos of hope and it’s raining.',
  ];
  /* typed on the title screen, like it’s 1996. Cheating is legal and goes on your permanent record. */
  const cheats = {
    TOMATOES: { fx: 'provisions', note: 'PAYDAY. FIFTY PROVISIONS, PRE-TOMATOED.' },
    MELLYGIBS: { fx: 'flares', note: 'FIVE FLARES. GO BE THE ROAD WARRIOR.' },
    LONGLEGS: { fx: 'legs', note: 'LEG DAY, PERMANENTLY. +12%% WALK SPEED.' },
    BIGLANTERN: { fx: 'lantern', note: 'LANTERN: EMBARRASSINGLY LARGE.' },
    BOOTHILL: { fx: 'roll', note: 'THE ROLL REMEMBERS EVERYONE.' },
  };

  /* the stamp under the grade — arcade-loud, one line, gone in a blink */
  const gradeLines = {
    S: ['TEXTBOOK. FRAME IT.', 'CLEAN AS DAWN. SIGNED.', 'THE STUFF OF FIRESIDE SONGS.'],
    A: ['GOOD HANDS. FAST FEET.', 'STRONG WALK. ONE NOTE: FASTER.'],
    B: ['DELIVERED. DENTED. FORGIVEN.', 'THE VALLEY TAKES IT.'],
    C: ['IT ARRIVED. TECHNICALLY.', 'THIS CRATE HAS SEEN THINGS.'],
  };
  /* the last line on a death screen, by what did it */
  const epitaphs = {
    scrappers: 'They only wanted the pack. They took the rest to be thorough.',
    wraith: 'The Grey reached out. This time it kept hold.',
    cold: 'The valley is honest about winter. Every Waylighter gambles against it once too often.',
    water: 'The river was patient. Rivers always are.',
    fall: 'The ground was there the whole time.',
    bleed: 'A small wound and a long road. The road won.',
    starve: 'An empty pack kills slower than an empty stomach.',
    reaper: 'They walk in step, and they do not stop for anyone.',   // v3.51: the two deaths that had no line of their own
    cannibal: 'The fire was warm. That was the trap.',
  };
  /* what scrappers yell when the chase starts — Mutant League manners */
  const scrapShouts = ['DROP THE PACK AND WALK, HERO!', 'Nice crates. OURS now!', 'RUN! We love it when they run!', 'The pack stays. YOU can go!', 'Fresh boots! GET ’EM!'];

  /* what the Walker says to nobody in particular — dry, quiet, out loud */
  const barks = {
    night: ['Dark comes fast out here.', 'And there goes the sun. Wonderful.', 'Night shift. My favorite. Said nobody.'],
    firstpath: ['Look at that. The ground remembers my feet.', 'A road nobody paid for. Mine.', 'Walk a line often enough and the valley agrees with you.'],
    dawn: ['Made it. Morning.', 'Still here. Still walking.', 'Morning, valley. Miss me?'],
    wade: ['Cold. Cold cold cold.', 'Boots were dry a whole day. Personal record.', 'The river charges a toll. The toll is dignity.'],
    drop: ['No no no — not the cargo.', 'That better not have been the medicine.', 'Ten years of practice. Gravity: still undefeated.'],
    wraithFree: ['Keep grabbing. The pack stays mine.', 'Not today. Walk on.', 'Buy it dinner first.'],
    deepgrey: ['Nothing out here but weather and the things it hides.', 'Talk to yourself. It helps. I read that somewhere.', 'Deep grey. Where the map shrugs.'],
    overload: ['My knees have filed a complaint.', 'Heavy is just pay you carry.', 'One more crate. Famous last words, every time.'],
    lifesaver: ['Somebody sleeps easier tonight.', 'That one mattered. Felt it in the straps.', 'THAT is why we walk.'],
    relight: ['One more light. Getting to be a habit.', 'There you are, valley. There you are.'],
    campNear: ['Scrapper ground. Feet quiet, eyes up.', 'They only want the pack. The pack disagrees.'],
  };

  const tutorials = {
    firstWobble: 'Rough ground under a load — press <b>Space</b> when the ring appears, or hold <b>Space</b> to brace and walk slow.',
    firstRain: 'Greyfall. It eats containers in the dark. Light, shelters and tarps blunt it.',
    firstLadder: 'Press <b>B</b> and pick the ladder — its <b>blueprint</b> hangs where it will land. <b>Click</b> or <b>E</b> lays it; <b>Esc</b> puts it away.',
    firstWade: 'Cold water. It slows you, drinks your stamina, and soaks the crates — the grade will show it. A ladder laid across keeps everything dry.',
    firstKit: 'Build kits raise real structures — press <b>B</b>, pick one, and its <b>blueprint</b> follows your aim. <b>Click</b> or <b>E</b> raises it. They only rise where waylight reaches.',
    firstScrap: 'Scrapper territory. They chase walkers with cargo. Outrun them, drop nothing, or route around. Light will end them one day.',
    firstRifle: 'The Timberwolf rides your pack — press <b>Y</b>. Empty ground: a <b>warning crack</b> that scatters every chase, clean ledger. A scrapper in reach: he <b>drops</b> — and the Renegade ledger writes it. Rounds are scarce; the exiles will not always be on the ridge.',
    firstWork: 'Your work just PAID — a unit banked, all on its own. Works produce as long as they stand mended (repairs want metal — the loop feeds back). Site them where their desc says and the clock never stops.',
    firstRecon: 'A rider is OUT past the table\'s edge. Recon runs itself — the map fills in behind them. When the region reads CHARTED, the Darklands table will take an <b>outpost</b> there: a far station that hauls what the valley can\'t make.',
    firstMemorial: 'The Order keeps its own. Every walker who falls or hangs up the coat earns a STONE here — raise it, read it, and watch the ground grow with the roll. Nothing here is ever lost; that is the whole point of the wire.',
    firstRising: 'A town went dark BY CHOICE — that is the UNLIT, and no delivered core will answer doctrine. The Republic holds two answers on FACTIONS (on the map\'s side rail): THE QUELL marches Farkeeper shields there and restores the light by force; THE PARLEY is your own boots, their fire, and a gift — slower, remembered longer.',
    firstBanner: 'FACTIONS is the Republic in session: every faction the world knows, its stance sealed by lore or walked by your play, every town\'s light as a political fact, and the doctrines that answer the dark ones. The sandbox reads from here.',
    firstShrine: 'You FED a shrine. The Flame Keepers hold that light must be fed, not wired — every bowl you keep burning warms their stance in Factions, and a fed bowl is real light on real ground.',
    firstMountain: 'THE MOUNTAIN ROAD IS CUT. Farkeep answers the wire: the kit of the mountain — longbowman, rifle rider, berserker — hires at their desk on the table, and each answers trouble from its own trade when it closes on your walk.',
    firstInterior: 'You are INSIDE — a walked room, not a described one. The prompts read the floor: the plates, the record, the cage, and the door out. Nothing made of grey follows you in.',
    firstTaking: 'THE TAKING landed: a raider camp is a REPUBLIC WATCHPOST now — shields stand its fire, a chase that crosses its ring is broken, and salvage from the ring piles by the post for you to carry. The price is written by the world: the camps that stand grow bolder for a season, and a truce dies with the first shield. The light\'s own patient answer — a camp reached by the wire stands down by itself — still stands beside this one.',
    firstAsk: 'THE WORLD ASKED the Republic a question — it stands in Factions under THE WORLD ASKS, and it AGES. Answer it by walking (feed the doused bowl by hand) or by sending the mountain (the taking, at the camp nearest it). Silence is also an answer, and the banner that asked will read it.',
    firstMuster: 'CREW is everyone under your command on one paper: where they stand, what they have done beside you, and their STANDING ORDERS — the wedge they walk, how they eat, how they meet trouble, what they sweep into their pack and what they lift off your back when you are over. Presets are a start; every order is yours to set. Report orders and they sound off.',
    firstCourting: 'The Unlit are COURTING a town — the half-flown shutter beside its door is the warning before a rising. HEAR THEM OUT in Factions (a gift of stores, and enough of the town\'s love that they sit with you) and the drum slows; ignore it and the rising takes that town first.',
    firstDossier: 'THE ARRIVAL ROUTINE ran its pass — missions first, then Deliver → Store → Donate → Scrap → Pickup, letters before cargo, never past your pack\'s capacity. Set its marks in CARGO RULES (on the map\'s side rail), and the walk manages itself.',
    firstExile: 'SHUTTERLIGHT is open to you — the exiles\' own city, out past every map. The EXCHANGE sells .338 by the cycle; the GUILD posts contracts for a rifle with a party at its back. Work the contracts and the deeper shelves open.',
    firstOutpost: 'Your outpost STANDS. Every few minutes its caravan walks the haul into the bank — watch the chips land. Caravans can be raided on the dark roads: fund the <b>Farkeeper escort</b> on the table and the mountain walks beside them.',
    firstBurn: 'It burned at the light\'s edge. Wraiths cannot cross onto lit ground — the gold rim is a wall to them. Run for the light.',
    firstWraith: 'A wraith. Movement draws them — creep braced with <b>Space</b>, or sprint and pray. A flare (<b>F</b>) burns them off.',
    firstCircuit: 'A circuit is one contract with many doors — every leg\'s crates are on your back <b>now</b>. Pack it right; the pack is the puzzle. Grade and pay settle at the last door.',
    firstConvoy: 'The cargo is a person. Their pace, your lantern: run too far ahead and they stop and call. Scrappers go for <b>their</b> crates; the deep grey roots their feet until you stand beside them.',
    firstSalvage: 'The wreck lies out in the deep grey — walk out empty, load what the Grey left, walk back heavy. Grey work pays ×1.6.',
    firstSnag: 'It took cargo to a snag. The marker shows where. Nothing stays lost that a Waylighter can reach.',
    firstPaver: 'A road paver. Feed it metal and ceramic — banked or carried — and it paves a segment for good. Roads are fast, safe, forever — and the wire carries twice as much between the stations they join.',
    firstZip: 'Pylons within range link into ziplines automatically. Press <b>E</b> under one to fly.',
    firstPave: 'A path your feet argued into the ground can be IMPROVED: press <b>P</b> on bare trail to lay <b>scrap plates</b> (3 metal), again for <b>cobbles</b> (3 ceramic), again for a <b>wood way</b> (3 timber). Each tier walks faster — and everyone\'s feet prefer it.',
    firstField: 'Field work: from a terminal\'s <b>Waylighters</b> tab you can put hands on the LAND — a <b>path presser</b> wears trails in, a <b>mason</b> lays cobbles, a <b>forrester</b> fells timber, a <b>hauler</b> walks freight. They eat a provision a round, and the valley works while you walk.',
    firstUpgrade: 'Your builds can be RAISED: stand by one and press <b>U</b>. First upgrades are cheap and useful; the last one asks for real work — and earns it.',
    firstPobox: 'The PO Box holds what you stash — <b>E</b> stashes your non-mission load, <b>G</b> takes it back, <b>L</b> leaves it for the walkers as a donation. Hand tools left this way ARM a walker.',
    firstArmed: 'A donated crate of hand tools ARMS a waylighter. Ten armed, and the roads around that town are measurably safer — and everyone will know it was you.',
    firstWorking: 'WORKING ORDERS: a field hand or a charter runner keeps its orders in Crew, like a walker keeps its wedge. A hauler and a charter carry only what is on THE FREIGHT LIST; THE LOAD splits a hauler\'s pack across two shelves; a mason holds THE RESERVE of ceramic you name; a forrester walks THE REACH and leaves THE WOODS standing or not; a charter runs the post or freight, steady or hard.',
    firstMarks: 'THE MARKS: a presser walks a CHAIN of points in order from the town and back — add a mark from Crew, then click the ground. The trail is measured every time they reach an end; bare end to end, a presser under COME IN walks to the fire and the wage stops with the work.',
    firstPosted: 'THE POSTED ORDERS: a post hand keeps its round\'s orders in Crew too — THE HOURS (round the clock, days only, or the lamp-lit nights the town thanks more), THE TRAINING (the round\'s own verb, or half of it to their weakest skill), THE KEEP (a provision a shift from the bank, or the town\'s own table for thinner thanks). A hand keeping days rests at night; the plate says so.',
    firstLetters: 'THE LETTERS: a post hand carries what its round is marked for. Letters ON, a runner fills the town\'s bag twice as fast; PARCELS ON, a parcels round packs the town\'s own parcels — a mended coat, preserves, a child\'s shoes — and every second shift a PARCEL RUN posts on the board for the nearest lit town: the Order\'s service, fragile, and thanked. The riders\' dispatch is the Order\'s own and rides regardless.',
    firstSquare: 'THE SQUARE ROSE: a garrison holds a town by fear or by love, and a town that hates the Order under two shields will rise against them in the night — the garrison thrown out, the lamp doused BY CHOICE again, a stone likelier. Feed the town above the line, REINFORCE THE GARRISON, or RELEASE it before the square decides.',
    firstTrades: 'THE CAMPS\' OWN: the camps carry trades now. A BOWMAN stands off and looses — on the road his arrow staggers you; at a post it pins a shield\'s arm down. A RAM takes a knock and keeps coming — the second puts him down, and he takes a fire fast. A CHIEF keeps the fire and only comes out for a storm: while he stands the knives get up twice as fast; put him down — the rifle, the shields, your own hands — and the knives RUN.',
    firstOwn: 'THE SQUARE STANDS ITS OWN: a garrisoned town that has come to love the Order again sends its own to stand under the pennant — a round shield and a fork, no tithe off the shelf. The square will not rise while its own stand in it; let the love fall and they go home.',
    firstSold: 'THE COUNT BOUGHT: the Society sells what it counted. While a stencil stands on a camp\'s post and the cold door is open, Factions buys the ground for the Order — no column, no season of reprisal, the camp a watchpost by contract. The stencil stays: COUNTED — SOLD TO THE ORDER.',
    firstGrievance: 'THE GRIEVANCE: a parcel knocked off your pack is not cargo on the ground — it is a coat somebody mended for somebody, and the door it was addressed to knows. The town\'s thanks fall when it hits the road, again when a camp carries it in, more if you give the run up. Pick it up and carry it through and they thank you MORE than they would have. Left two days, it becomes the town\'s memory.',
    firstArrow: 'THE BOLT: a bowman\'s arrow stays IN. Your wind comes back at half pace and the wound seeps until it is pulled — a medic walking with you pulls it in a breath, the hands at any lit terminal pull it, or pull it yourself standing still, and pay for it.',
    firstMourning: 'THE CHIEF, GONE: a camp whose chief went down in the open remembers. The rag goes on a stake where he stood, the road walks one knife short for a day, and the camp COURTS THE UNLIT — a leaderless fire looks for a banner, and the half-flown shutter can go up at the nearest lit door. The map marks the rag.',
    firstSquareRoll: 'THE TOWN\'S OWN ON THE ROLL: a square that stands its own puts them in your Crew — AT THE SQUARES, with a plate each and THE HOURS to set. Round the clock they stand day and night and the town\'s love wears (they are away from their fields); DAYS they stand by daylight and the town\'s thanks grow, but the square is theirs alone at night; NIGHTS they stand the dark — and the Unlit\'s drum is slower for every night a town is seen standing with the Order.',
    firstFace: 'THE FACE AT THE DOOR: a town that holds a grievance against you says so to your face — the keeper at the door, in their own words, before the board does. Make it right and they say that too.',
    firstOwnFell: 'THE TOWN\'S OWN FELL: when a square rises against its garrison, the town\'s own standing in it can fall — a stone on the roll at THE FIELD STONES, and the town colder for every one. Their hours decided who stood that night.',
    firstScar: 'THE SCAR: a pulled bolt leaves a wound. Your wind\'s ceiling is lower until it is DRESSED — a medic walking with you winds it three times over the minutes, or a lit town\'s hands dress it once a visit. Dressed, it heals in a day; left, it hangs on for two.',
    firstChiefBack: 'THE CHIEF, RETURNED: a mourned camp gets a new chief. He walks in from the ring\'s edge, takes the rag down off the stake and ties it on, and the fire is his. The road walks whole again and the courting stops — the camp remembers, but it does not wait.',
    firstWord: 'YOUR WORD AT THE DOOR: a keeper with a grievance can be answered. A PROMISE binds you — that parcel comes through in two days, and while your word stands the town waits instead of remembering; kept, the door thanks you more and the town is a like warmer; broken, it remembers at twice the cost. An APOLOGY pays five appreciation now, and when the grievance\'s days run out the town lets it go — the likes kept. A town that already remembers cannot be answered.',
    firstKin: 'THE KIN IN THE SQUARE: one of the town\'s own fell when the square rose, and their kin keep the place a day — a grey shawl and a lantern where the shield stood, and again at THE FIELD STONES. A town that has buried its own recruits slower for every stone, and its own in the square feel the stones in their mood.',
    firstGrudge: 'THE CHIEF\'S GRUDGE: the chief you put down had a brother. The new chief carries it — the nearest post you hold is his first storm, on the next night, in or out of the reprisal season, with him among the knives; he says so at the fire when you come near. Hold that post, or lose it, and the grudge is paid. Unpaid three days, it cools.',
    firstScarStone: 'THE SCAR ON THE STONE: a scar that closes is written on the walk — who pulled the bolt, who dressed it, whether it closed late — and goes to the stone with you: the marks on the memorial card, the notches on the stone. The Manual\'s page for the scar carries the wound in plates.',
    firstRingWalk: 'THE ROAD TO THE RING: a pinned roll on the map carries the camp\'s road as a line you can click — the walk is planned to the near edge of the camp\'s ring, the pin planted on the map, and the wedge walks it with you. A click on the map lets the pin go, as any walk does.',
    firstBook: 'THE TOWN\'S BOOK: a town writes your word down. Every promise kept, broken, and every sorry sits on its terminal header and in the Records tab — two kept at a door and the keeper trusts you with THE KEEPER\'S ERRAND; one broken and that door SHUTS its promises until you bring one of its grievances through without a word.',
    firstErrand: 'THE KEEPER\'S ERRAND: a keeper who has watched you keep your word twice hands you their own sealed letter for the farthest lit door, and your word goes with it — two days. Through in time, it pays more than any run on the board; late, it is a broken word, and the door shuts.',
    firstKinErrand: 'THE KIN\'S ERRAND: the fallen left something in the square — a round shield, a lantern — and the kin at the stones asks for it. Bring the shield home; carry the lantern to a lit waylight for its flame and set it at the stone before it burns out. The kin waits three days.',
    firstParley: 'THE PARLEY: a chief with a grudge will talk at his fire. A GIFT from the bank; a STAND — still at his fire while his knives look you over (walk away and his storm comes tonight), and he grants a day\'s truce; or your WORD not to march on his camp for three days. Break that word and every fire hears it.',
    firstScore: 'YOUR SCORE: a camp\'s knives felled one of your party. The one who went down meets that camp\'s runners from farther and wants it settled — take the camp, stand it down, or put its chief down and the score is paid; left three days, it cools. The roll and the map mark it.',
    firstLine: 'THE LINE AT THE RING: a walk planned to a camp\'s ring ends with your wedge holding a line at its edge, facing the camp. Walk in alone, or bring them — they hold until you are well away from the line.',
    firstWireWord: 'THE WORD ON THE WIRE: a word kept or broken at a lit town walks the wire to its nearest lit neighbours — you can watch the letter go. Landing, a kept word leaves them a like warmer, a broken one a like cooler, and every lit terminal carries your word\'s weight.',
    firstKeepsake: 'THE KIN\'S THANKS: a kin whose errand you finished gives you something of the fallen\'s to carry — a keepsake that hangs under your pack. The town sees it: every delivery there is a like warmer. It goes to your stone with you.',
    firstRelight: 'THE STONE\'S FLAME: a lantern set lit at a stone goes out at the next dark, and the kin asks again. Take it from the stone (G), light it at any lit waylight (L), set it back (G) before it burns down. Kept lit a few nights, the kin keep it themselves.',
    firstTruceRoad: 'THE TRUCE ROAD: while a camp holds a truce or your word, the road through its ring is open — your charter runners walk straight through and their runs come quicker. White rags mark the road at the ring\'s edge.',
    firstGiftRunner: 'THE CHIEF\'S RUNNER: a chief who held your word to its last day sends a runner to the nearest lit door with a gift for the bank. Break the word before he gets there and he turns back.',
    firstSettled: 'A SCORE SETTLED: when a score is paid, walk the one who fell to that camp\'s ring — they step out, say it, and leave a stone there. Their plate carries it for good, and they walk lighter for a day.',
    firstLineOrders: 'THE LINE\'S ORDERS (Q at a held line): HOLD — the backs keep the ring\'s edge while you walk in alone, and turn the knives that come out after you; COME — the line walks in abreast with you, and the knives will not close on it (the bows still loose). The line walks: no running.',
    firstAnswered: 'THE WORD ANSWERED: a town that has heard your word kept three times down the wire trusts you before you ever kept one at its door — its keeper posts THE KEEPER\'S ERRAND on the wire\'s word.',
    firstHearsay: 'SHUT BY HEARSAY: a town that has heard your word broken twice down the wire shuts its promises to you without having seen it. Do right by it yourself — a delivery through its door in good time, or one of its grievances made right — and the door opens again.',
    firstKeepsakeSet: 'THE KEEPSAKE SET DOWN: carry a keepsake to the fallen\'s stone and set it there (G). The stone wears the thing, the town is warmer, and the kin write one last time. It no longer rides under your pack.',
    firstRoadKept: 'THE ROAD KEPT: a truce road stands on a chief\'s word, and words run out. Take THE ROAD\'S GIFT from any lit terminal\'s board and walk it to his fire before the word runs out — he keeps the road. On the road through an open ring your pack wears the white rag and the knives let you walk.',
    firstRagsDown: 'THE RAGS DOWN: the word ran out with no gift walked to the fire. The knives put up their own man and he pulled the white rags down — the road is shut and the camp is up again.',
    firstStonesKicked: 'THE STONES KICKED: a camp that comes back up — its post retaken, its word run out, a new chief at the fire — sends a knife to kick over the stones left at its ring. The one who set them has a score again.',
    firstWatch: 'THE WATCH: from a held line, WATCH leaves the line at the ring\'s edge for the night. From dark it is a watch — the camp stays in, and your charter runs cross its ring as if at a truce. At dawn the line walks home to the nearest lit door and falls in when you come by.',
    firstAhead: 'THE WORD GONE AHEAD: a door that answered you — its errand walked through in time — writes ahead down the wire to the nearest town you have never reached. The letter lands before you do: that town is on every board, its keeper greets you by the letter, and the first delivery through its door pays more.',
    firstCampAsks: 'THE CAMP ASKS: you kept its road three times and the chief asks for the wire. Take THE RELAY KIT from any lit board and raise it at his fire (G) — the camp becomes a lit door.',
    firstOnWire: 'THE CAMP ON THE WIRE: the relay stands at the fire and the camp is a lit door. The chief keeps it; its board posts what the knives need and what they spare; its light pushes the grey back; its ring stays open for good.',
    firstSiege: 'THE WATCH\'S SIEGE: a camp watched three nights running tires. At the third dawn its chief walks out to your line under a white rag and talks — a truce, with no fight.',
    firstTwice: 'THE STONES SET AGAIN: a kicked cairn\'s score paid and walked, the one who fell sets the stones again with a second red thread. The knives leave a cairn set twice alone.',
    firstKinDay: 'THE KIN\'S DAY: every seventh day from the day a keepsake went on a stone, the kin stand at it at dusk with two candles. Come by and hear them — the fallen\'s town sends a hand to walk your next leg with you, home again at the next lit door.',
    firstPassed: 'THE LETTERS PASSED ON: a town you reached on a letter writes ahead in its turn once you keep a word at its door — down the wire to the next town you have never reached. The map draws the chain in teal.',
    firstThird: 'THE END OF THREE LETTERS: a town reached on the third letter in a chain has read all three. Its keeper posts the sealed errand before you ever walk in — it waits on the board.',
    firstWireCut: 'THE WIRE CUT: on a storm night a camp still up can send a raider to cut a camp on the wire\'s mast. The door goes dark — its board shut, its light gone — until the splice coil is spliced there. Every camp you bring onto the wire or talk out of its ring is one fewer that can cut it.',
    firstSplice: 'THE SPLICE: the coil spliced at the mast (G) and the lamp lights again — the board open, the light back, the wire whole.',
    firstGiven: 'THE RING GIVEN: a camp that has come out to your line twice gives its ring up without a fight. Its fighters leave for the hills; the fire is a rest stop on your routes now — the hide shelter keeps the rain off and mends you, the box keeps cargo, the fire warms, and the runs cross the ring.',
    firstKnivesStone: 'THE KNIVES\' STONE: a cairn set twice and left standing a week — the camp sets a stone of its own beside it, with a black thread. The first thing the knives have ever given you.',
    firstStays: 'THE HAND WHO STAYS: a town\'s hand who has walked your leg on three of a stone\'s days asks to stay on — for good, with the ribbon and no fee. The plate says whose day they walk for.',
    firstMoved: 'WHAT IT MOVED: the Delivery complete slip ends with what the walk changed besides your pay — the town\'s stock, the light\'s reach, a road\'s next stretch, a camp, your word on the wire. Nothing on it happened anywhere but through that delivery.',
    firstSurplus: 'SURPLUS FREIGHT: what the bank holds past its reserve is packed as freight for the towns short of it — posted on the board where it was made. Accept it and the bank pays the crates; the town pays you for the walk.',
    firstStanding: 'THE STANDING: a town pays by its book. Words kept at its door and heard kept down the wire raise what its board pays and put a crate more on it; broken ones lower both. Whoever holds the door counts too — a truce with the knives, the Unlit in a square.',
    firstCampRoute: 'CAMPS ON YOUR ROUTES: a camp brought in is part of the road. A ring given is a rest fire, a camp on the wire a door, and knives who set their stone beside yours let you walk and send their salvage to the town that needs it. The Guide stops you at a fire when you are hurt or cold.',
    firstStormSeen: 'THE STORM, SEEN: you stood the post when the knives came. They walk for the FIRE, not for you — a knife that reaches it and stands there long enough takes the post. The shields knock the nearest knife down in turn; your backs meet what comes inside their reach; your own shove and the rifle count. Hold the fire until the storm spends itself.',
    firstStorm: 'THE STORMING: the mountain\'s third answer to a rising. The column goes through the door; the lamp goes back up under a GARRISON, the town\'s love for the Order goes out with the Unlit\'s banner, and the shields eat off the town\'s own shelf. A garrisoned town cannot rise — and every town watching remembers. RELEASE the garrison in Factions when you can afford to be loved again.',
    firstPostFell: 'THE POST FELL: in the camps\' season of reprisal a held watchpost can be STORMED by night — three knives against its shields. The post holds when its shields, and the walker standing the fire with their backs, match the knives. STAND THE POST in Factions for another shield; a post lost once costs more to take again, because the camps expect the column now.',
    firstMood: 'A walker\'s MOOD is in Crew — summed from what the walk is doing to them: hunger, the Grey, nights, a load near the cap, a meal, a bond, company. A BRIGHT walker steadies your pack more and reaches further; a LOW one less. One who says they are DONE sits down at the next fire they pass. The plate says why.',
  };
  /* v3.35 THE FIELD MANUAL — every lesson above has a page title; the manual indexes the pages a
     walker has walked (S.flags.tut) in full and seals the rest. A new lesson wants a title here. */
  const tutorialTitles = {
    firstWobble: 'The wobble', firstRain: 'Greyfall', firstLadder: 'The ladder and its blueprint', firstWade: 'Cold water',
    firstKit: 'Build kits', firstScrap: 'Scrapper territory', firstRifle: 'The Timberwolf', firstWork: 'A work that pays',
    firstRecon: 'The recon ride', firstMemorial: 'The kept ground', firstRising: 'The Unlit', firstBanner: 'Factions',
    firstShrine: 'A fed shrine', firstMountain: 'The mountain road', firstInterior: 'A walked room', firstTaking: 'The taking',
    firstAsk: 'The world asks', firstMuster: 'Crew', firstCourting: 'The courting', firstDossier: 'The arrival routine', firstExile: 'Shutterlight',
    firstOutpost: 'An outpost stands', firstBurn: 'The light\'s edge', firstWraith: 'A wraith', firstCircuit: 'The circuit',
    firstConvoy: 'The convoy', firstSalvage: 'Salvage', firstSnag: 'A snag', firstPaver: 'The road paver', firstZip: 'Ziplines',
    firstPave: 'Paving a path', firstField: 'Field work', firstUpgrade: 'Raising a build', firstPobox: 'The PO Box', firstArmed: 'Walkers armed',
    firstWorking: 'Working orders', firstMarks: 'The marks', firstMood: 'A walker\'s mood', firstPosted: 'The posted orders',
    firstStorm: 'The storming', firstPostFell: 'The post fell', firstLetters: 'The letters', firstSquare: 'The square rose', firstStormSeen: 'The storm, seen',
    firstTrades: 'The camps\' own', firstOwn: 'The square stands its own', firstSold: 'The count bought',
    firstGrievance: 'The grievance', firstArrow: 'The bolt', firstMourning: 'The chief, gone', firstSquareRoll: 'The town\'s own on the roll',
    firstFace: 'The face at the door', firstOwnFell: 'The town\'s own fell', firstScar: 'The scar', firstChiefBack: 'The chief, returned',
    firstWord: 'Your word at the door', firstKin: 'The kin in the square', firstGrudge: 'The chief\'s grudge', firstScarStone: 'The scar on the stone', firstRingWalk: 'The road to the ring',
    firstBook: 'The town\'s book', firstErrand: 'The keeper\'s errand', firstKinErrand: 'The kin\'s errand', firstParley: 'The parley', firstScore: 'Your score', firstLine: 'The line at the ring', firstWireWord: 'The word on the wire', firstKeepsake: 'The kin\'s thanks', firstRelight: 'The stone\'s flame', firstTruceRoad: 'The truce road', firstGiftRunner: 'The chief\'s runner', firstSettled: 'A score settled', firstLineOrders: 'The line\'s orders',
    firstAnswered: 'The word answered', firstHearsay: 'Shut by hearsay', firstKeepsakeSet: 'The keepsake set down', firstRoadKept: 'The road kept', firstRagsDown: 'The rags down', firstStonesKicked: 'The stones kicked', firstWatch: 'The watch',
    firstAhead: 'The word gone ahead', firstCampAsks: 'The camp asks', firstOnWire: 'The camp on the wire', firstSiege: 'The watch\'s siege', firstTwice: 'The stones set again', firstKinDay: 'The kin\'s day',
    firstPassed: 'The letters passed on', firstThird: 'The end of three letters', firstWireCut: 'The wire cut', firstSplice: 'The splice', firstMoved: 'What it moved', firstSurplus: 'Surplus freight', firstStanding: 'The standing', firstCampRoute: 'Camps on your routes', firstGiven: 'The ring given', firstKnivesStone: 'The knives\' stone', firstStays: 'The hand who stays',
  };

  return { W, H, features, rivers, stations, stationOrder, goodsInfo, letterLines, parcelKinds, errandLetter, keepsakeLines, keepsakeSetLines, stoneLines, roadLines, watchLines, settleLines, campPosts, postLines, siegeLines, twiceLines, kinDayLines, cutLines, givenLines, kstoneLines, routeLines, staysLines, keeperGrief, starRewards, roads, camps, echoNames, echoSpots, structures, MIGRATE_TYPES, items, priority, fabItems, T, titles, tutorials, tutorialTitles, keepers, barks, gradeLines, epitaphs, scrapShouts, dispatch, rollSeed, taglines, cheats };
})();


