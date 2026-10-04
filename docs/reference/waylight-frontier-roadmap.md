# WAYLIGHT — Frontier Roadmap (post-testing notes, 2026-09-08)

The player's post-testing verdicts and directives, captured in build order. Nothing here is optional
colour — each line is a directive from play. Details not specified are to be completed per the game's
theme and per common management/diplomacy mechanics (named references: Crusader Kings 3, Bannerlord 2).

## v3.19 — THE BODY REMEMBERS (in build)
The game must feel alive through INTERACTION, never through effect-spam. Screen shake and motion blur
are the things players turn off; MIVIM environment effects are interactive or they are cut.
- Cargo visuals on the player: complete overhaul. Authored looks for the default spawn items and a
  thorough base set; gear (boots/coat/pack) visibly worn on the rig. Pixel methods per
  `research-pixel-art-systems.md` (attachment swaps, cluster discipline, palette ramps).
- MIVIM weather law, the two canonical examples:
  - LEAVES ON THE WIND: a gust puts leaves in motion; leaves that hit the character model deflect or
    stick on it for a moment; leaves that miss never change trajectory. Sparse and eloquent, never thick.
  - SNOW ACCUMULATION: snow piles on the player's shoulders/head as a function of snowfall intensity
    and how much they move; then melts. Weather is never "more/fewer raindrops".
- Placement ghosts: every placeable (ladders first — they currently plop at random angles) hovers as a
  semi-transparent blueprint of its eventual placement before the player commits. Applies to ALL
  buildings/placed items.
- Pause-on-minimize TOGGLE: for long trips, players can switch screens without the game pausing.
- WOBBLE REWORK: far, far too common. Pushback matters, but frivolous wobbles must not cancel the
  automation travel chain the player set up. This is an AUTOMATION mechanic, not an idle one: the
  player builds their character/kit to automate the chain their way (map "go here, then here", chain
  clicking a safe route); they run into trouble and see why full automation must be earned. There is
  never just one way to accomplish this.

## v3.20 — THE WORKING WORLD
- LIVING PATHS: deliveries between two areas wear a natural foot path along the assumed traffic line
  regardless of the player's walked route. The player's own steps accelerate wear visibly: trampled →
  bare dirt → permanent (human intervention to regrow; grass dies, sharp rock smooths into vague
  steps) — exaggerated for progression identity, realized over a few passes, widening to a full bare
  footpath like the city-link paths. Paths feed NPC routing, are followable targets, and grant speed.
- PATH UPGRADES: footpath → metal-scrap road → cobblestone → wood road, … Logistics get easier by this
  progression (not the paver-only ladder).
- COMPANION JOBS (Waylighter side): HAULER (huge capacity, slow → upgrades to DONKEY_CARAVAN, which
  wants Farkeeper protection), MASON (cobblestone), FORRESTER (fells trees — REAL environment change,
  wood for wood paths), PATH PRESSER (custom footpaths — automated exploration or player-assigned
  click routes).
- EARNER SKILLS (companion QOL, earned): LOOTER — companion loots anything entering the player's
  vision (chests, items, lost cargo, nodes); upgrades: bigger packs → fully automated looting,
  bringing large resource loads home to sell/build with.

## v3.21 — THE BUILDS EARN THEIR GROUND
- "I only use ladders." Structures must FEEL useful, never be required. NPC strongholds did nothing
  while scrappers chased the player straight through them — builds act on pursuers.
- Upgrade ladder per structure: cheap first upgrades with useful traits; full upgrades very helpful
  but demanding real job-work and earning. Fully upgraded feels EARNED.
- Any building big enough to house a room is enterable (safety, item placement), priced by the safety
  it provides. Cheaper POBOX: dump items, leave donations.
- DONATION VISIBILITY: donating demonstrably does something. A donated weapon arms an NPC waylighter;
  ten armed and the area is measurably safer — and the player is told it is safer because of them.

## v3.22 — KARMA & THE REPUBLIC (research first: CK3 / Bannerlord-class systems)
- KARMA oversees two independent currencies: APPRECIATION (exists) and RENEGADE (new). Not good/bad —
  each biased but independent (cowboys weren't universally hated; Han Solo was hated by many and loved
  by few, until he was loved by many and hated by few). Renegade acts may leave appreciation
  unchanged, or even raise it.
- Fed by choices and missions: cutpurse jobs; smuggling runs (highleaf smokes out of the farm — caught
  on delivery or not, each outcome lands differently per area); mercenary-guild work gated by weapons,
  party, and training a fresh Waylighter lacks. Choices are SEEN and FELT in the world — butterfly
  effects, never delivered through dialogue or text alone.
- THE REPUBLIC OF CONNECTION — default members WAYLIGHT + FARKEEP. Founded when the Waylighters,
  having intervened in the colossal Farlands famine, merged societies with the FARKEEPERS and
  descended them from a mountain climate and wars neither man nor beast could face. The Farkeepers —
  a larger, fiercely loyal, nordic mountain people (ancient men hardened by climate: elongated thighs,
  broadened chests — NOT giants) — saw the light and changed their ways, but not their nature. The
  Waylighters, no fools, had relied on mercenaries and bought corruption with them; in the Farkeepers
  they saw allies and solution.
- LORE CORRECTION (standing): ALL security/battle purpose transfers to FARKEEPERS — the militia riders
  of v3.16 become Farkeepers wherever accounts say otherwise. Waylighters uphold connection, warmth,
  love, loyalty, trust. Farkeepers equip the weapons, protect the society, quell / silence-the-light
  of Renegade rebellions and towns lost to darkness, and can take towns by force.
- DIPLOMACY: player-decided, player-controlled, affected by the Karma currencies.
  Defaults — ABSOLUTE_ALLY (defend at all costs): Waylighters. ABSOLUTE_HOSTILE (shoot on sight):
  Reapers, Cannibals.
- Faction data to create, each with cultural + visual identity: REAPERS, RAIDERS, REBELS, CANNIBALS,
  FLAME KEEPERS, IRON GIANTS.
- Farkeeper companion classes: LONGBOWMEN (ranged security), PUGUGLY (bigger than most Farkeepers —
  huge to Waylighters — bare-knuckle, surprising agility), RIFLE_RIDER (upgraded longbowman; requires
  horse — introduce HORSE BREED DATA: real common breeds with stats reflecting their actual
  strengths), RECON_RIDER (quick, low damage, automated exploration), BERSERKER (pistol + claymore).
- Expansion door stays open: revisiting the Farlands, traversing the mountain to Farkeep, connecting
  the Farkeepers' homeland with the allies won on the current map.

## Standing laws gathered from these notes
- Alive = interaction. No cheap ambient effects the player neither cares about nor touches.
- New integrations require targeted identity, visually and conceptually. Factions require identities
  in culture and design recognition.
- Fill unlisted operational detail from genre knowledge, always bent to the theme.

## PIXELLAB MCP — INTEGRATED (v3.20)
The PixelLab MCP (https://api.pixellab.ai/mcp) is reachable from this cloud session by direct
JSON-RPC over HTTP — `tools/pixellab.mjs` wraps it (list tools · call any tool · queue a character ·
poll and save the PNG). Toolkit: characters (humanoid + quadruped with a HORSE template — the breed
data and donkey), animations, top-down tilesets, PATH TILES, building kits, UI assets.
STATUS (v3.33): CREDITS LANDED — Pixel Artisan subscription, 3,304 generations in hand after the
first pass (20 spent). The pipeline is built and proven on the stable (tools/pl.mjs · quantize.py ·
stable.py · embed_stable.sh · lineup.py); generated PEOPLE were rejected on measured evidence. Asset law: generate → quantize to the game's palette bands → embed
(rig-texel tables or data URIs), never hotlink. Queue for the first pass: default courier set, pack donkey,
horse breeds, Farkeeper classes. (v3.50: the courier set was drawn by hand at 32×32 — see 4r.)

## v3.23 — THE MYTH IN THE FLESH (captured from MIVIM's Postman notes, 2026-09-08)
- THE POSTMAN's return-to-the-city beat: the founder treated as a myth in the flesh ("I saw him
  once, before the light, when I lived in unlit [city]"). Carry the spirit through GAMEPLAY —
  the world reacts to the walker's LEGEND, citing the player's ACTUAL record, never through
  dialogue screens. Start framing the mysterious protagonist.
- Micro-cutscenes as cognitive signals only: a slow zoom for the FIRST line of dialogue, no
  longer. Never bog gameplay down; flow with it.
- Play as a rookie Waylighter who carries the player's overworld-simulation knowledge — we live
  the gameplay through the character we create.
- CHARACTER INVESTMENT SUITE [inventory, equip screen, creation screen, character editor]:
  permadeath requires caring; the editor is essential — every real sandbox has one.
- THE HANDOFF PARODY: the famous Postman scene (child holds the letter up; slow-mo horse trot;
  zooms, angles; the classic SUPER ZOOM on the handoff). Absurdly over-produced effects against
  the janky low-bit aesthetic = the joke and the identity. Short bursts of absurd, well-done
  scenes beat long ones nobody watches. Our muscle is CODE — the effects are hand-controlled.
- PIXELLAB SHELVED by directive: the current art style is a real aesthetic in its infancy.
  Polish it comprehensively with the audited research (research-pixel-art-audited.md) EVERY time
  the source is touched. No corner cutting, no shortcuts, no assumptions.

## v3.24 — THE WIDER WORLD & THE PRODUCTION (captured 2026-09-08 · SHIPPED same day — 477/24 green)
> Shipped: the Cine engine + 90s research, THE RIDE, the globe with region pins + delivery badges,
> the party of four + companion horses + THE POOL + the rescue ride + the town law, the sound
> overhaul with the rain dial. Still open from this batch: the recon/outpost mission system itself
> (the globe's REGIONS data shape is its foundation) and any further absurd-realism placements.
- THE GLOBAL MAP: the whole current map is ONE REGION of Waylight. Add the global layer — not yet
  populated — LAUGHABLY more realistic/advanced in render than everything else (the cartoon cut to
  a fully painted frame; that contrast IS Waylight). Fixed-position but rotatable presentation.
  Future home of the recon/outpost mission system (Frostpunk 1 first-outpost reference). Continue
  the absurd-realism trend in targeted places at Claude's judgment.
- NUMERIC DELIVERY BADGES on the classic map (and the global regional view, futureproofed): per-town
  counts of deliverables on the player's back + companion inventories — unload the most at one stop.
- PARTY: hire up to 3 companions (party of 4 total). Horses hireable/buyable for companions.
- AUDIO: mute + volume for rain, and RESOURCE it — current rain is white radio static. Full SFX
  overhaul: everything but the wraith eerie (keep, polish) is scaffolding to be replaced with
  targeted, designed sound.
- THE RIDE: The Postman firing-squad scene, parodied in-universe — a Waylighter caught behind
  Reaper lines, a recon Waylighter watching with all of Haven's behind him, the scream, "RIDE,
  WAYLIGHTER! RIIIIDE!", the camera veering out, the shots heard. Over-produced, short, targeted.
- CINE ENGINE TOOLS: formalize the production kit for reuse — camera angles, cuts, dolly, slow
  zooms, aesthetic treatments, timeScale — so every future parody scene is a shot list, not
  bespoke code. Research 90s directing style (The Postman, Waterworld) as the framing blueprint.
- DEATH REBALANCE: Waylighters die far too easily (~30 deliveries is not economically viable).
  NEVER hunger/thirst death in town (immediate immunity); the party is the HP POOL — companions
  are knocked out first in quarters, the player's character always falls LAST; and a downed party
  gets a LAST-CHANCE RESCUE from the player's highest-appreciation town (success scales with that
  appreciation; the riders rally the party and clear the field, or die trying — then it is real).
- All of it leans on the existing systems and interacts coherently.

## v3.25 — THE NAMES & THE EXILES (captured 2026-09-08 · SHIPPED same day — 497/25 green)
The directive batch, verbatim-intent:

**THE NAMES.**
- "The World of Waylight" is WRONG for the global map menu — WAYLIGHT is the mythic civilization/
  capital, not the world. Retitle such menus.
- Waylight = the mythic utopia in the far lands, the ORIGINAL CAPITAL CITY of the Waylighters,
  "first dawning of the last light [Waylight]" — where ALL waylights get their light from. Their
  home region [TO BE NAMED] hosts the economic utopia. Some have tried to take what the
  Waylighters give; some succeeded, some did not — but with the FARKEEPERS so intertwined in the
  founding of the joint civilization (NOTES CONFIRM: **the Republic** — "the Republic's muscle,"
  12c_factions.js), homeland security is solidified through migration and intermingling. The
  Farkeepers could always defend what little they had (written into blood and society); the
  Waylight society had too much and no way to defend it. Yin met yang — balance for each other.
- Waylighters = Romans WITHOUT the conquest (spreading light, Roman aesthetic + intelligence);
  Waylight City = ancient Rome. Farkeepers = alt-universe Viking/Celtic mountain people, by
  nature huge/tall/muscular, from mountains (NOTES: the Farlands — "the Farlands famine").
- The current/default map has NO formal land name — it must get one. (Editorial call, reversible:
  **THE GREYMARCH** — the borderland march of the Grey; "the valley" stays as the colloquial.)
- Regions/factions were lined out in the karma notes with a request to COMPLETE the rest of the
  factions — Farkeepers ARE integrated (v3.22 FK ward/riders/fkIntro) but the globe's regions
  ignored the lore; wire the globe to the REAL places (Waylight, the Farlands) and audit the
  cascade for missing integrations.

**THE PROTAGONIST → THE LAMPLIGHTER.**
- The protagonist is the 'scorned hero' Waylighter — the ONE who chose the dark, cloaked torch:
  THE EVER-ELUSIVE LAMPLIGHTER. Frame him FIRST (neat cut scenes); the LampLighter CLASS is
  introduced ONLY AFTER the protagonist is well introduced/written. "Lamplighters should be the
  protagonist's sort of 'rescue.'"
- Lamplighters = Waylighter EXILES (rose up and chose the sword → exile). Freedom + hauling power
  of Waylighters + long-range PRECISION fire. NOT melee, NOT brutes — hard-hitting SNIPERS.
  Crafty, sneaky, hard to track; formidable wherever they train.
- In exile they turned to the open world; in survival they found friends: a strange ally speaking
  a raised tongue, emerged from the core of the earth through steam and copper — THE DIEFENBUNKER
  SOCIETY (appeared in the darklands around the same time the Waylighters showed up; rumors, no
  confirmation). In reality the Society took the Lamplighters in — the most level-headed of the
  new world to these sheltered bunker pups. The Society has old-war weapons but not the will or
  understanding of the new world; the Lamplighters supply both.
- The Lamplighter name/lore OPENS TWO NEW FACTIONS: THE LAMPLIGHTER NOMADS (exiles so numerous
  they are their own migrant faction, in all reaches of the Waylight universe — they even founded
  a city/home of their own, findable through progression, story decisions, missions or
  exploration) and THE DIEFENBUNKER SOCIETY.

**THE DIEFENBUNKER SOCIETY.** The last of the old world — hundreds of years on, all of Canadian
origin, NEVER said outright, all the hints given (C8s with the red leaf etched in the sights,
leaders' pins, "a place called Canada... the last haven of the free world. Something about the
cold, something about the water."). Highly educated, highly trained; the last political class so
far down the line they almost stopped believing the old world existed. Our homage to FALLOUT —
done correctly, properly. Dictionary: SBSN (Social Bunker Security Number), SBCA (Social Bunker
Career Assignment). Three founding diary logs supplied (Douglas Reed, Prime Administer, 13 days
post Unseal/New World Day — "we didn't find ruin... we found death we thought couldn't exist";
Sarah O'Connel, Mechanic, 12 days post "whatever the opposite of hope is" — math said radiation
had dropped OR food ran out (both at once; whichever gauge was faulty is up for debate), doors
designed to unseal PERMANENTLY, no tech to reseal, "doors open until we get the welders up";
Jimmy Butler, Enforcement Lieutenant, 16 days post NWD — red alert, C8s from the racks, the pins
of the old times and the ancient ones). Arsenal: infantry small arms C8A3 (red leaf optic), C7A2
(olive drab, C79 Elcan), C22 pistol in storage grease; THE LAMPLIGHTER ARSENAL — C14 Timberwolf
(.338 Lapua bolt-action), C3A1 (legacy 7.62 bolt), C20 DMR (semi-auto 7.62); strategic assets —
Bank of Canada bullion crates as blast-tunnel barricades, Federal Warning Centre comm arrays,
radiation decon shower tunnels.

**Standing:** add targeted, complete, cohesive; lean on existing systems (karma/renegade is the
violence ledger the rifle writes to; the rescue system gains the exile lane; the Republic lore
already in FACTIONS). All prior cued work (recon/outposts, remaining non-live factions) stays
cued. WE ARE MIVIM : MIVIM ERA WE * STANDARDS.


## v3.26 — THE CONTINENTAL MAP (captured 2026-09-08 mid-v3.25 · SHIPPED same day — 506/26 green)
- The v3.24 globe is NOT what "global map" meant — global map does not literally mean a globe, and
  the delivered artifact was not remotely the demanded quality. The scale ladder shipped wrong:
  (1) the local area and (2) the entire world, with NO in-between.
- THE GLOBE STAYS as an aesthetic FOURTH layer only — no purpose yet beyond marking the farthest
  zoom-out of the NEW scale ladder. (Defect on record, to fix regardless: the atmosphere halo
  clips SQUARE at the canvas edge — a pasted circular asset cut off at the edges with no padding,
  shipped unexamined. Never again: padding around the asset, and LOOK at it.)
- THE CONTINENTAL MAP is the ACTUAL developed map — the new middle scale, the real strategic
  layer (and the recon system's future home).
- Presentation law: designed at the ANGLE of the provided reference screenshots (Ace Combat 7
  briefing tables) with a SIMILAR DEPTH of development — the tilted 3D wire-grid/holotable manner
  of presenting the map. The AESTHETIC IS NOT MIRRORED; only the angle/manner of presentation.
  The map must fit the game aesthetic we have built (LEDGERLIGHT: bone contours on void, gold for
  the lit and ours, grey-blue for the dark, rust for trouble, chunky bracket labels, stepped
  bands, no smooth gradients).
- The references are screenshots of a 3D wire-grid style map. If that is the effect best
  recreated in, do that — tweaked and incorporated into the game's aesthetic: contour-line
  terrain, receding grid, region tint washes, leader-line labels, side data columns fed by REAL
  ledger data, depth fade toward a horizon.
- Scale ladder after v3.26: THE GREYMARCH (survey sheet) → THE CONTINENT (developed strategic
  map) → THE KNOWN WORLD (globe, aesthetic-only farthest zoom).

## v3.27 — THE ECOSYSTEM (captured 2026-09-08 · SHIPPED same day — 520/27 green)
- Gameloop additions NEVER replace or overwrite cued work — they are reviewed and PLACED IN THE
  CUE where the logic is best developed with the rest. There must be comprehensive cues still;
  comprehensive requests were made. (Answered below: THE CUE, consolidated and ordered.)
- Direct utilities and build items are TWO SEPARATE THINGS:
  - PLAYER UTILITY ITEMS (what rides the pack);
  - BUILDABLE SHELTERS and QOL BUILDINGS to fabricate (what holds the ground).
- Both sides form a FACTORY-STYLE AUTOMATION LOOP: everything has a purpose, everything helps the
  other, all things revolve in this ecosystem.

## THE CUE (consolidated open queue, ordered by where each logic best develops — standing)
1. **v3.27 THE ECOSYSTEM** (this batch): the utilities/works split made explicit, and the loop
   CLOSED — works PRODUCE into the banked economy (terrain-sited, weather-aware, visible as earn
   chips), utilities and further works CONSUME it, field jobs automate the middle, disrepair
   pauses hands and repair feeds metal back in. Placed first: it leans directly on the field jobs
   (v3.20), structure tiers (v3.21) and stock economy (v3.18), and everything after eats from it.
1b. **v3.28a/b THE WATCHDOG & THE DEAD BOOT LAW** (SHIPPED, interleaved on the field report):
   v3.28a guarded the step and repaired stuck gates; v3.28b found the ROOT of the frozen-input
   report — a save carrying a committed death booted a zombie world (sim gated, clicks/WASD
   refused, ESC menu alive) — and extinguished the class: death commits with its certificate
   facts, a dead save boots into the Certificate of Passage, the watchdog presents the ceremony
   to any zombie world, FREE MY BOOTS + a gate-naming diagnostic live in the ESC menu, a fault
   chip pins per-frame faults on screen, and the NO-PURGE LAW stands (pre-read save backup slot;
   THE ATTIC quarantines-and-restores instead of deleting). deadboot.mjs: 19 checks, standing.
2. **v3.28 RECON & OUTPOSTS** (SHIPPED): the
   Frostpunk-1-style recon/outpost mission system over the
   Darklands table's uncharted pins — recon riders (RECON_RIDER activates), the first outpost as a
   remote WORKS cluster fed by the v3.27 loop (why the ecosystem ships first). Batched with the
   automation completions that share its logistics: caravan protection contracts (Farkeepers),
   path-presser custom player-clicked routes, LOOTER full automation.
2b. **v3.28c THE CLEAN SHOP** (SHIPPED, standards correction executed on the field verdict):
   the attic corrected to the REAL mechanism — THE TYPE LEDGER (versioned structure-type
   migration at one load() seam; foreign types become visible inert `unmapped` objects that
   restore themselves) — plus the full dead-code audit: 61 findings verified one by one, dead
   branch/declarations/UI subsystem removed, 44 dead exports trimmed, analyzer false-positives
   fixed in the instrument, and the audit installed as a STANDING BATTERY GATE (shopaudit.mjs).
   The ledger of every finding and resolution: SHOP-AUDIT.md.
2c. **v3.29 THE MEMORIAL** (SHIPPED — placed BEFORE the exile roads so every future faction
   city ships carrying its own variant on the shared architecture): a war-memorial ground the
   player VISITS in-world — playercards / stylized portraits of every fallen walker, with VISUAL
   PROGRESSION as runs accumulate (the ground grows: stones → colonnade → hall as the roll
   lengthens). CROSS-FACTION BY DESIGN: one memorial data architecture (S.legacy + echoRoster +
   graves + Porter.portrait already carry the facts), a UNIQUE visual design per faction —
   Waylighter default ships first; Lamplighter, Farkeep, and Diefenbunker variants follow as
   those become playable. IMPERATIVE future-proofing for diplomacy and the Crusader-Kings-style
   sandbox: forces and cities accumulated through progression and strategy will hang off this
   same per-faction identity layer.
3. **v3.30 THE EXILE ROADS** (SHIPPED — the Lamplighter memorial variant live on the shared architecture): the Lamplighter Nomads' own city (found through progression, story
   decisions, missions or exploration), the Diefenbunker as a walkable place, C3A1/C20 as gear
   tiers, .338 trade lanes, and mercenary-guild work (weapon + party gated — the rifle and the
   party of four now exist to gate it honestly).
3b. **v3.31 THE DELIVERY LEDGERS** (SHIPPED — with THE FAIRNESS PASS riding the same ship: chase honesty, the ring's reasons, the balk beat, the ladder law, EVERY warp killed; item-audit verdict: no database, taxonomy + policy as pure data layers; 571-check battery, 35 suites; see DESIGN.md) — the original capture (the RimWorld-style
   manifest/dossier/checklist batch, captured in full):
   · STEP 1, THE ITEM AUDIT (answer required in the ship): critically assess the current item
     system for this scope — the flat `items` def map + `cat` field + S.cargo array. Position
     going in: no database (a browser save of hundreds of items needs none — that would be
     overhead); what is MISSING is a TAXONOMY layer (parent → child categories, data not
     infrastructure) and per-item POLICY flags; the audit proves or corrects this.
   · THE TAXONOMY: every item gains a parent chain that collapses into itself — Equipable
     (Utilities / Provisions / Weapon; armor-slot subcategories: boots, coat, pack, charm),
     Buildables (Station works / field works), Resources (Wood, Metal, Ceramic, Lumen — grades
     collapse into their parent), Consumables (Food, Medical, Books/Manuals). Complete Waylight
     content in every category — no placeholder rows anywhere (the TODO markers in the request
     were guardrail artifacts, struck by directive).
   · THE DELIVERY DOSSIER (both styles use it): the automated town pass, STRICTLY hierarchical —
     1 Deliver (letters/cargo toggles) → 2 Store (marked essentials to lockers) → 3 Donate
     (with a search box to EXEMPT items from donate-all) → 4 Scrap (junk gone for max turnover)
     → 5 Pickup all marked (letters/cargo toggles) — and MISSION ITEMS ALWAYS ACCEPTED/PICKED
     FIRST, above the whole ladder.
   · THE TWO STYLES, one dossier under both: HAULIN' MANIFEST (streamlined — allow-all with
     collapsing category filters) and CARGO CHECKLIST (in-depth — searchable item box; every
     category and item unfolds to its five marks: Deliver / Store / Donate / Scrap / Pickup).
   · THE PARENT LAW: checking a parent checks every child, VISIBLY — the standard sandbox
     cascade; indeterminate state when children mix.
   · THE MAP WIDGET: a travel-options widget on the survey sheet with its own toggles (run the
     dossier on arrival, grab all letters while in town, deliver applicable automatically).
   · FUTURE-PROOFING (imperative): the same spreadsheet-style policy engine and UI is the base
     for COMPANION management later — build the policy layer item-agnostic.
4. **v3.32 THE REPUBLIC IN FORCE** (SHIPPED — the CK3-sandbox foundation on ONE registry+engine, the memorial's scaling law applied to the whole sandbox): the Unlit's risings and BOTH
   answers (the quell that marches + costs + raises a stone, the parley that walks), full stance
   play/diplomacy on the banner sheet (seals held, gates reading existing ledgers), the Flame
   Keepers' fed shrines, the Hollow Fires' hunting larders, the Reaper procession, the Iron Giant
   sightings, the Farkeeper combat kit (longbowman / rifle_rider / berserker) via a class-read
   intercept, the mountain road opening the Farlands + Farkeep's desk, and the walkable
   Diefenbunker interior. republic.mjs 19 checks; ~590-check battery, 36 suites. — **SHIPPED (v3.32)**
   · The CK3 depth deferred here SHIPPED as **v3.34 THE HOLDINGS** (see 4b).
4b. **v3.34 THE HOLDINGS** (SHIPPED — conquest, the world's own wars, two walked halls, on the same
   registry law): THE TAKING (a raider camp taken by a five-shield column, gated on the mountain
   road, HELD as a REPUBLIC WATCHPOST — standing shields, a held ring that breaks chases, a salvage
   tithe — at a price the world writes: the truce dies, the reprisal season, the casualty stone,
   Farkeep↔Raiders to WAR; the light's own pacify untouched beside it); the EVENTS registry of
   third-party wars (the doused bowl + the Keepers' aging ask, the Reapers' cull, the Unlit
   courting + HEAR THEM OUT, the reprisal) writing a RELATIONS ledger read on the banner sheet;
   the HOLDINGS view with an owner plate on every place; FARKEEP — THE LONG HALL and SHUTTERLIGHT
   — THE GUILD ROOM as registry rooms with a material style table and THE FIT LAW (every room
   whole at 1280×720); protagonist-origin fragments at the hearth and the lantern. holdings.mjs
   19 checks; 602-check battery, 38 suites.
   · REMAINING for later depth: TOWNS taken by force (today the mountain takes camps and restores
     towns); a watchpost that can be LOST (a reprisal that storms the post); offensive war
     declarations between third parties beyond the registry's four rows (the door is open — a
     new war is a row + a resolver). — all three SHIPPED as **v3.39 THE LOSABLE HOLDINGS** (see 4g).
4c. **v3.35 THE PLAYER'S PASS** (SHIPPED — the audit of the game as a person lives with it): THE
   KEYS registry with rebinding by law and lessons that read with your keys; THE FIELD MANUAL
   (controls · every lesson walked, sealed otherwise, searchable · the papers index that opens
   sheets · the passage); THREE VALLEYS on the title with RETURN TO THE TITLE; PASSAGE CODES that
   carry a valley to any browser under the no-purge law; paper scale; the court reading `live`;
   the larder and the Reaper as texel glyphs. manual.mjs 19 checks; 621-check battery, 39 suites.
   · NEXT on the same line (for the people): key caps on the rail read from KEYS for every prompt
     (today the rail's letters are labels by law). — the hint strip SHIPPED in v3.37 (see 4e).
4d. **v3.36 THE MUSTER** (SHIPPED — the v3.31 promise kept: companion management on the policy
   engine, parameterized by store): four scalar orders + two policy trees + five presets as
   registry rows; orders on real feet (station slots, sweep, the overflow, the mess, the stand,
   the voice); the service stripe; THE MUSTER ROLL with each back's OWN figure, the wedge plate
   with live ghost marks, the orders pane in the ledgers' grammar, CALL THE ROLL. muster.mjs 13
   checks; 634-check battery, 40 suites.
   · REMAINING on this line: orders for the FIELD and the ROADS (a hauler's route policy, a
     presser's mark policy) on the same stores; a walker's MOOD read on the plate (the bond, the
     hunger, the days since a meal — the plate has the room); the wedge plate as a HUD card in
     the world (a small live formation glyph beside the prompts, toggled). — all three SHIPPED as
     **v3.37 THE WORKING ORDERS** (see 4e).
4e. **v3.37 THE WORKING ORDERS** (SHIPPED — the v3.36 REMAINING, whole): the field and the roads
   on the SAME per-walker stores — THE FREIGHT LIST as a third policy tree over the taxonomy's
   freight branch (the station goods are items), seven working-order rows named per job by the
   registry (THE LOAD · THE MARKS · THE RESERVE · THE REACH · THE WOODS · THE RUN · THE PACE),
   `NPC.workOf` handing the roll whichever sheet a walker answers to; a v3.36 store repaired and
   never purged; the orders working the land (an honest empty pack, the split load, the chain of
   marks walked in order with the trail MEASURED and COME IN, the marks as numbered flags on the
   ground, the reserve floor, the far reach, the thinned wood kept by cell, the charter's freight
   run and hard pace); the work stripe; THE MOOD summed from sixteen causes into five bands with
   real effects and a DONE walker sitting down at a fire with the mail; THE WEDGE CARD on the HUD
   with a live glyph, put away and kept; the hint strip in your keys. workorders.mjs 16 checks;
   650-check battery, 41 suites.
   · REMAINING on this line: orders for the POSTS (a mailroom hand's round policy on the same
     store — which letters, which hours); a walker's mood for field hands beyond paid/unpaid (the
     weather they work in, the distance from home); the wedge card's glyph as a compass overlay
     when the survey is open; a presser's chain drawn on the survey sheet. — all four SHIPPED as
     **v3.38 THE POSTED ORDERS** (see 4f).
4f. **v3.38 THE POSTED ORDERS** (SHIPPED — the v3.37 REMAINING, whole): the posts on the same
   store (THE HOURS · THE TRAINING · THE KEEP as WORK_ORDERS rows, `workOf` kind `post`, the post
   stripe); the working world's mood (greyfall, nights, far from home, a thanking town, the table;
   a work pace per band; a DONE field hand coming in); the survey drawing field hands, a presser's
   chain of flags and line, and THE WEDGE at the walker's marker; the wheel zooming toward the
   pointer. postorders.mjs 9 checks; 659-check battery, 42 suites.
   · REMAINING on this line: a post hand's LETTERS (which post the round carries — the town's own
     or the riders' dispatches — once the post subtree carries more than two kinds); the survey's
     wedge as a HUD compass mark when the sheet is closed. — both SHIPPED as **v3.40 THE STANDING
     GROUND** (see 4h).
4g. **v3.39 THE LOSABLE HOLDINGS** (SHIPPED — the v3.34 REMAINING, whole): THE STORMING (a risen
   town taken and GARRISONED at the town's love, the garrison eating off its shelf, the Unlit's
   season, RELEASE); a watchpost that can FALL (the season's night roll — three knives against the
   shields and the walker standing the fire; LOST with the pennant in the ring and a dearer retake;
   STAND THE POST to four); three more wars on the v3.34 law (a larder raided and burning low, a
   larder hushed by the file, the Unlit's reprisal). holdings2.mjs 8 checks; 667-check battery,
   43 suites.
   · REMAINING on this line: a garrison that can be thrown OUT (a risen town under a garrison too
     thin — the storming answered by a rising in the square); the storm SEEN when the walker stands
     the post (knives on the ground, the intercept, not a resolved night); a fourth banner's war
     (the Society against the camps, once the door is open). — all three SHIPPED as **v3.40 THE
     STANDING GROUND** (see 4h).
4h. **v3.40 THE STANDING GROUND** (SHIPPED — the v3.38 and v3.39 REMAINING, whole): THE LETTERS
   (a fourth tree on the same store — `TREES.post`, root `post` — over the post subtree that now
   carries THREE kinds: letters, the riders' dispatch, and PARCELS, a fragile service good of the
   town's own; a runner fills the bag twice as fast only while marked for letters; a parcels round
   packs a parcel every second shift, three to a run, into a PARCEL RUN posted for the nearest lit
   town — service, no fee, thanked); THE WEDGE ON THE COMPASS (every back a pip on a REAR RAIL
   under the strip — the wedge walks behind you, so straight behind is the centre — in its mood's
   colour, bright when it has fallen out of the wedge; a back ahead rides the marks' row); THE
   SQUARE RISES (a garrison RESTLESS under two shields and a town at five likes or less rolls by
   night and throws the garrison OUT — the lamp doused by choice, a stone likelier; REINFORCE THE
   GARRISON to four); THE STORM, SEEN (the walker standing the post turns the season's roll into a
   fight on the ground — three knives walk for the FIRE, the shields knock the nearest down in
   turn on the row's cadence, the party's intercept meets what comes inside its reach, the walker's
   shove and cut and the rifle count; a knife that stands at the fire long enough takes the post;
   the storm spent, HELD in the open; a knocked knife LIES where it fell — the rig turned a texel-
   exact quarter); THE SOCIETY'S WAR ON THE CAMPS (once the cold door is open the eighth world
   event sweeps the northernmost live camp — COUNTED, its salvage gone north, its ring shrunk to
   0.7 for the count's span, a stencil on a post). standing.mjs 8 checks; 675-check battery,
   44 suites.
   · REMAINING on this line: parcels ADDRESSED (a parcel run bound for the town a parcel names,
     not the nearest lit door — a parcel with a letter's line read aloud on delivery); the rear
     rail's pips as a click (open that back's plate from the compass); a garrison that RECRUITS from
     the square it holds once the town loves the Order again (shields from the town's own, no
     tithe); the storm's knives with the camps' own kit (a leader, a bowman) once the camps carry
     classes; the Society's sweep answered (a counted camp SOLD to the Order — the door's own
     contract). — all five SHIPPED as **v3.41 THE CAMPS' OWN** (see 4i).
4i. **v3.41 THE CAMPS' OWN** (SHIPPED — the v3.40 REMAINING, whole, with the custom pixel art the
   directive required): THE CAMPS' OWN (`FACT.CAMP_CLASSES` — knife, bowman, ram, chief — and a
   `roll` on every camp row; the road sends the knives by trade, never the chief, who keeps the fire
   and is drawn there; a bowman looses on the road (an arrow that staggers and cuts) and at a post
   stands off at his range and PINS a shield's arm; a ram shrugs the first blow — up in a second —
   and takes a fire at six-tenths of the wait; a chief's rally halves the knives' downtime, and put
   down he BREAKS the storm — the knives run and the post is HELD; three hand-drawn 14×22 kit
   figures in the raiders' own palette and one for the town's own, on the shared alphabet plus one
   letter); THE PARCELS ADDRESSED (a town's shelf is a list of parcels each addressed to a lit door
   — the round packs for the doors the town's traffic runs to, on the count every delivery leaves on
   the line; one run per door; eight parcel kinds each with the keeper's line read aloud on the slip;
   an older count derived into a list); THE PIP IS A DOOR (a click on the rear rail opens that
   back's plate); THE SQUARE STANDS ITS OWN (a garrisoned town back at forty likes sends its own
   under the pennant, one every four minutes to two, no tithe, drawn in the square with round
   shields; they count against the rising and go home below thirty); THE COUNT BOUGHT (BUY THE
   COUNT on a counted camp through an open door — a watchpost by contract, no column and no season,
   the Society a step warmer on a new ledger pair, the stencil kept with the Order's lamp under the
   tongue). campsown.mjs 9 checks; 684-check battery, 45 suites.
   · REMAINING on this line: the camps' own on the survey sheet (a camp's roll read from the map,
     the chief's fire marked); a chief who REMEMBERS (a camp that lost its chief in a storm walks
     one knife short and courts the Unlit); the town's own with their own orders on the muster roll
     (a garrison hand as a posted worker: THE HOURS on the square); parcels that can be LOST (a
     parcel dropped on the road becomes the town's grievance, not just cargo); the bowman's arrow as
     a wound the medic answers (a bolt to pull). — all five SHIPPED as **v3.42 THE REMEMBERING**
     (see 4j).
4j. **v3.42 THE REMEMBERING** (SHIPPED — the v3.41 REMAINING, whole, with its own pixel art):
   THE CAMPS' OWN ON THE SURVEY SHEET (a live camp's roll as seven hand-drawn 7×7 trade marks under
   its fire — blade, bow, door, rag — with the chief's fire lit gold in a halo while he stands, the
   rag gone to a stake while he is mourned, the Society's tongue on a counted camp; a line in the
   sheet's register; a legend row); A CHIEF WHO REMEMBERS (a chief knocked down in the open does
   not get up for the camp: `c.chiefLost` for the doctrine's mourning span — the red rag on a stake
   where he stood, the road one knife short, the next storm without him, and the leaderless fire
   COURTING THE UNLIT: the ninth world event walks the camp's runners to the nearest lit door with
   the Unlit's word — the half-flown shutter, the Unlit warmer against the Order); THE TOWN'S OWN
   ON THE MUSTER ROLL (a garrison's recruits are records — `NPC.genOwn`, AT THE SQUARES, the town's
   own figure on the plate, a stripe of watches stood, never yours to hire or dismiss; THE HOURS on
   the square read in the square's words — full stands day and night and wears the town's love,
   DAYS stands the light and grows the thanks, NIGHTS stands the dark and slows the Unlit's drum;
   the cover follows the hour); THE GRIEVANCE (a parcel knocked off the pack is the town's own on
   the road: `S.grievances` keyed by the parcel's id — raised on the road, deepened when a runner
   carries it into a camp, given when the run is given up; appreciation lost by the row; the crate
   torn on the pack, on the ground and on paper; the board's grievances plate; MADE RIGHT at more
   than it cost when carried through — on the run or as lost cargo; unanswered two days the town
   REMEMBERS, likes gone for good); THE BOLT (a bowman's arrow flies as texels on its line and
   stays IN: the wind at half pace, the seep; pulled by a field medic walking with you in a
   breath, by a lit town's hands at the terminal, or by your own hand standing still for the
   price; the overlay on the rig, A BOLT IN on the HUD). remembering.mjs 8 checks; 692-check
   battery, 46 suites.
   · REMAINING on this line: the grievance as a face (the keeper at the door says it to you, in
     the room, before the board does); the town's own who FALL (a recruit knocked down when the
     square rises — a stone on the roll, the town colder); the chief's return as a scene (a new
     chief comes up at the fire with the rag taken down, seen); the bolt's scar (a pulled bolt
     leaves a wound the medic dresses over a day — the walk's own memory); the camps' own on the
     survey as a click (the roll from the sheet). — all five SHIPPED as **v3.43 THE FACE AT THE
     DOOR** (see 4k). The courier set was held until v3.50 drew it by hand at 32×32 (see 4r).
4k. **v3.43 THE FACE AT THE DOOR** (SHIPPED — the v3.42 REMAINING, whole, with its own pixel art):
   THE FACES (eight keepers' hand-drawn 16×16 busts on one alphabet in eight palettes, served as
   portraits on the terminal beside every keeper's words and on the plate at the door); THE
   GRIEVANCE AS A FACE (crossing into a town's reach with a grievance open, the keeper's plate comes
   up on the HUD — face, name, door, the words in rust in their own voice, five lines a keeper for
   the five ways a parcel goes wrong — and the first of it is said aloud at the door; down on its
   own, said once and again only when deeper; made right, the face says THAT in gold; the terminal
   reads the same ladder); THE TOWN'S OWN WHO FALL (a square rising takes an even chance of each
   of the town's own standing that hour — a stone on the roll in the town's kit with the fate, THE
   FIELD STONES revealed past Haven with the shield cut into the stones, the town five likes colder
   each, the mail, the card); THE CHIEF'S RETURN, AS A SCENE (a new chief starts at the ring's edge
   and walks six seconds to the fire while the camp is still short — A CHIEF COMES UP — says it at
   the stake, takes the rag down — THE RAG COMES DOWN — and the pole stands bare a day, in one
   place through the whole of it); THE SCAR (a pulled bolt leaves a dark red cross on the coat and
   the wind's ceiling at 85 until it is dressed thrice — a field medic once a minute inside reach,
   a lit town's hands once a visit — the HUD counting, the white dressing drawn over it; dressed it
   closes in a day, undressed in two; the rig stamp law — every overlay on the walker snaps to the
   rig's own pixels); THE CLICK INTO THE ROLL (hovering a camp's marks on the sheet opens its roll
   — the trades with their marks and lines, the fire's keeper, the counts; a click pins it beside
   the marks, no walk planned; the next click lets it go). faces.mjs 8 checks; 700-check battery,
   47 suites.
   · REMAINING on this line: the Walker's word at the door (an answer to the face — a promise that
     binds the next run to that parcel, or an apology that costs appreciation now for likes kept);
     the fallen own's kin in the square (a town that lost its own recruits slower, and its mood
     reads the stones); the new chief's grudge (a camp whose chief YOU felled storms your nearest
     post first, and says so at the fire); the scar carried to the stone (the walk's scars on the
     legacy row and the memorial card, the manual's page for the wound); the roll's road as a walk
     (a click on a pinned roll's road line plans the walk to the camp's ring, with the wedge). — all
     five SHIPPED as **v3.44 THE WORD AT THE DOOR** (see 4l). The courier set was held until v3.50
     drew it by hand at 32×32 (see 4r).
4l. **v3.44 THE WORD AT THE DOOR** (SHIPPED — the v3.43 REMAINING, whole, with its own pixel art and
   its polish): THE WALKER'S FACE (a 16×16 bust on the keepers' alphabet bound to the coat they cut;
   on the door plate, the death slip, the skills sheet and a new stone's card); THE WORD AT THE DOOR
   (a keeper's grievance answered — on the plate with your own face, on the rail, on the board:
   PROMISE binds you and the town waits, the parcel wears the sworn string wherever it lies and the
   guide walks it first, kept pays more and warms the town, broken remembers at twice the cost and
   the keeper reads your word back; APOLOGY pays now and the town lets it go with the likes kept;
   thirty-two keeper lines; a parcel on the ground drawn as a parcel); THE KIN IN THE SQUARE (a
   shawled figure with a lantern where each shield stood, a day, lit or the Unlit's, and one at the
   field stones; the recruit clock slower by the stones; the town's own's mood reads them); THE NEW
   CHIEF'S GRUDGE (the storm remembers whose hand; a second hand-drawn chief walks in by generation;
   a chief the Walker felled storms the nearest post you hold the next night, season or none, with
   him in front, seen or rolled; he says so at the fire; the mark and line on the sheet; paid, voided
   or cooled); THE SCAR CARRIED TO THE STONE (the walk's record, the count on the coat hung up, the
   marks on the card, the notches on the stone, the manual's rig plates); THE ROAD TO THE RING (a
   pinned roll's road line plans the walk to the ring's near edge, the ring pin on the sheet, the
   plate clear of the marks' line). word.mjs 11 checks; 711-check battery, 48 suites.
   · REMAINING on this line: the hands' faces (the party and the posts on the keepers' alphabet —
     the vector portraits on the cards, the muster plates and the passage slots replaced by busts
     from the seed and the trade); a word remembered (a kept word counted on the town's dossier and
     opening a bigger errand; a broken one closing the door to promises there); the kin's errand (a
     kin at the stones with something to ask — the fallen's tool brought home, a lantern kept lit —
     as a mail and a run); the grudge answered (a parley with the new chief at his fire — a gift, a
     stand, a word — that cools it, and the Walker's own grudge marked on the roll when a camp fells
     one of the party); the ring walk on the ground (THE RING on the compass, the wedge stopping at
     the ring's edge and turning to the camp). — all five SHIPPED as **v3.45 THE WORD KEPT** (see
     4m). The courier set was held until v3.50 drew it by hand at 32×32 (see 4r).
4m. **v3.45 THE WORD KEPT** (SHIPPED — the v3.44 REMAINING, whole, with its own pixel art and its
   polish): THE HANDS' FACES (16×16 busts composed from the seed on the keepers' alphabet — six skins,
   a jaw, seven hairs, beard, glasses, and eleven trades drawn over all, the hair stopping at every
   brim; on the hire cards, the Waylighters, the muster plates, the Farkeeper rows, the passage slots
   and the new walker's sheet; the whole-pixel law — every portrait shown at the size it was drawn;
   no two hands share a first name); A WORD REMEMBERED (the town's book — kept, broken, sorry, the log;
   two kept words post THE KEEPER'S ERRAND, a sealed letter for the farthest lit door, two days, asked
   to your face, paying more than any run and broken open on the far slip; a broken word or a late
   errand SHUTS promises there — PROMISES SHUT, X and no P, refused in the keeper's voice — until a
   grievance there is made right without one; the header's marks and the Ledger's rows); THE KIN'S
   ERRAND (the fallen's shield and cold lantern in the square, the kin's mail; the shield home at the
   stones; the lantern lit at a waylight, carried lit on the pack against its fifteen-minute clock
   and set burning by the stone; HOME and LIT on the rows and the card; keepsakes in the ledger's
   tree, never in a locker); THE GRUDGE ANSWERED (the parley at the new chief's fire — his face and
   yours, GIFT, STAND, WORD: the gift cools it, the stand rings you with his runners uncut and buys a
   truce or, walked from, his storm tonight, the word holds his fire from the column and breaks at
   every fire if a column goes; and THE WALKER'S SCORE — a camp that fells one of the party is marked
   on the roll, the sheet and the mood, met from farther, settled by the take, the stand-down or the
   chief); THE LINE AT THE RING (THE RING on the compass with its pin; arrived, the backs stand
   abreast across the camp's bearing turned to it, the pin planted; walked away, the wedge again).
   Polish on the same law: THE LAMP LAW (a lamp's corona behind its holder, the coat's own texels
   kept), THE CROWDED STRIP (the compass measures its words — bare pins with words on hover), THE
   LABEL LAW (a ground label never lands on a label). kept.mjs 12 checks; 723-check battery, 49 suites.
   · REMAINING on this line: the word travels (a kept or broken word heard along the wire — the
     nearest lit doors warmer or cooler for it, the book's weight on every connected terminal); the
     kin's thanks (a kin whose errand you finished sends something back — a keepsake on the pack, a
     line on the plate — and the lit stone asks for its flame again at the next dark); the truce as a
     road (a camp at truce lets your charter runners through its ring, and on the pact's last day the
     chief's runner brings the bank a gift); the score settled as a scene (the one who fell walks the
     settling with you and says it at the camp; their plate wears SETTLED AT ASH); the line's orders
     (from a held line — HOLD: the backs keep the ring's edge while you walk in alone, turning the
     runners who come out; COME: the line walks in with you). — all five SHIPPED as **v3.46 THE WORD
     CARRIED** (see 4n). The courier set was held until v3.50 drew it by hand at 32×32 (see 4r).
4n. **v3.46 THE WORD CARRIED** (SHIPPED — the v3.45 REMAINING, whole, with its own pixel art and its
   polish): THE WORD ON THE WIRE (a word written in a book walks the wire's own route to the two
   nearest lit towns — a letter on the world and the sheet, a gold seal kept, a rust seal broken;
   landing, the town warmer or cooler, the keeper saying it at the door, the book logging it, ON THE
   WIRE on every lit terminal); THE KIN'S THANKS (an errand finished, a keepsake named for the fallen —
   six things, the same for the same name — hung under the pack; a like warmer at that town's every
   delivery, on the slip, the plate and the memorial card) and THE STONE'S FLAME (a lit stone's lantern
   goes out at the next dark and the kin ask again — take it, light it, set it back; twice, then the
   kin keep it); THE TRUCE AS A ROAD (a camp at truce or holding your word lets your charter runs
   through its ring, quicker; white rags where the line meets the ring, the runner seen passing the
   knives; the sheet's road) and THE CHIEF'S RUNNER (on the pact's last day, a runner with the rag and
   a bundle for the bank — turned back if the word breaks while he walks); THE SCORE SETTLED (paid by
   the take, walked to the ring by the one who fell, said, a cairn set down; SETTLED AT ASH CAMP on
   their plate, the mood, the sheet, the roll; let go if never walked); THE LINE'S ORDERS (Q at a held
   line, every back's face on the plate — HOLD keeps the ring's edge with a rope hand to hand and turns
   the knives that come out, the U over the hood; COME walks the line in abreast, knives holding off,
   no running). Polish on the same law: the pack's strings, the wire's pulses walking, the hand's lamp
   lit, the spoken line climbing, the knife's headlamp behind him, the strip's names, the sheet's rags
   at doors, the order's words first. carried.mjs 10 checks; 733-check battery, 50 suites.
   · REMAINING on this line (MY PROPOSAL — nothing in the docs specifies it): the word answered (a town
     that has heard three kept words from you on the wire posts a promise for you before you ever kept
     one there, and a broken word heard twice shuts its door by hearsay until a grievance there is
     made right); the keepsake set down (on the kin's last day, carry the keepsake to the fallen's stone
     and set it at the foot — the stone wears the thing, the kin's last letter, the town's likes); the
     road kept (a new chief at the fire tears the white rags down unless the Walker walks the truce road
     with a gift before the pact's last day; the Walker may walk that road loaded with the rag in hand,
     unchallenged); the stone's keeping (the settled stones are a place — backs passing stop a beat and
     the one who settled it speaks; a camp gone hostile again kicks them over: a grievance, a new score);
     the line's watch (a line holding a ring's edge through a night becomes a watch — the camp's runners
     stay in, the charter runs pass as at a truce, and the line comes home in the morning lifted or worn
     by the cold). — all five SHIPPED as **v3.47 THE WORD ANSWERED** (see 4o). The courier set was
     held until v3.50 drew it by hand at 32×32 (see 4r).
4o. **v3.47 THE WORD ANSWERED** (SHIPPED — the v3.46 REMAINING, whole, with its own pixel art and its
   polish): THE WORD ANSWERED (three kept words heard on the wire at a door that never saw one and the
   keeper's errand posts on the wire's word — the plate, the header, the board's tag; two broken words
   heard and the door shuts BY HEARSAY — the chip, the Ledger, a promise refused — until the door sees
   you do right there: a delivery in good time or a grievance made right, SEEN AT THE DOOR on the slip);
   THE KEEPSAKE SET DOWN (G at the fallen's stone — the thing lies at its foot, the town warmer, the
   kin's last letter, the card); THE ROAD KEPT (THE ROAD'S GIFT on every lit board, walked to the chief's
   fire — the word renewed, the gold knot new on the poles; run out ungifted, a new man and his knives
   pull the rags — bare poles, the rags in the dirt, the road shut; on the truce road the Walker walks
   loaded under the rag on its switch and the knives let them); THE STONE'S KEEPING (backs stop a beat
   at a standing cairn and speak — the setter's line, the mood; a camp up again sends a knife to kick it
   over — the dust, the stones in the dirt, a new score on the plate); THE LINE'S WATCH (Q: HOLD, COME or
   WATCH — the line stays at the ring's edge for the night, the fire laid by day and lit at dark, lamps
   and rope; the camp kept in, the charter runs through, a grudge's storm held; home at dawn to the
   nearest lit door, waiting, falling in as you pass; called in early with Q). Polish on the same law:
   the runner's words ride with him, the sheet's tips turn at the edge, the gift's cord twine, the rag
   on its own switch, the counts only when counted, the sheet's marks clear of the doors. My readings,
   marked in DESIGN.md: "doing right there", the gift from any lit board, the new chief, "hostile
   again" as the camp up, the watch as a third order and its dawn walk. answered.mjs 8 checks;
   741-check battery, 51 suites.
   · REMAINING on this line (MY PROPOSAL — nothing in the docs specifies it): the word gone ahead (an
     answered door's keeper writes for you down the wire to a town you have never reached — its first
     sight opens warmer: a like, its board open at once, the keeper greeting you by the wire's word);
     the camp on the wire (a camp whose road you have kept three times asks to be put on the wire —
     carry a relay kit to its fire and it becomes a lit door, the chief its keeper, its own board of the
     knives' needs, the rags left up for good); the watch's siege (a camp watched three nights running
     tires — at the third dawn its chief walks out to the line to parley: a truce without a blade); the
     stones set again (a kicked cairn's score paid, the one who fell sets them again with a second red
     thread — twice settled, and the camp's knives step round it after); the kin's day (every seventh
     day at dusk the kin stand at a stone that wears its keepsake — the Walker passing hears them, and
     the town sends a hand to walk the next leg with you). — all five SHIPPED as **v3.48 THE WORD GONE
     AHEAD** (see 4p). The courier set was held until v3.50 drew it by hand at 32×32 (see 4r).
4p. **v3.48 THE WORD GONE AHEAD** (SHIPPED — the v3.47 REMAINING, whole, with its own pixel art and its
   polish): THE WORD GONE AHEAD (an answered door's keeper, its errand walked through in time, writes
   ahead once down the wire to the nearest town never reached — the letter in the waylight's teal on the
   world and the sheet; landing, the town warmer and on every board, the keeper's greeting by the
   letter, WRITTEN AHEAD on the chip, the first delivery paying the letter's worth on the slip); THE
   CAMP ON THE WIRE (the third road's gift and the chief asks for the wire; THE RELAY KIT on every lit
   board, carried on the pack to the fire; G raises the relay — the camp a lit door in a live registry,
   the chief its keeper with his voice and face, its board and market, the knives' salvage, the mast
   lit at dark, the chief by the board, two knives at home; the camp stood down for good); THE WATCH'S
   SIEGE (the nights counted running on the line's plate and the roll; at the third dawn the chief — or
   a chiefless fire's eldest — walks out with the white rag on its stick, talks, and a truce stands
   without a blade); THE STONES SET AGAIN (a kicked cairn's score paid, the one who fell sets it again
   with a second red thread; the plate's KICKED OVER and TWICE; the knives step round it and say so);
   THE KIN'S DAY (every seventh day from the setting, the kin stand at the stone from dusk with two
   candles — the mail, the compass, the card; come by and the town sends a hand with its ribbon, lent
   past a full wedge, who walks your leg and goes home to its own board). Polish on the same law: a
   hand's words ride with the hand, the plate's kicked day from the hand's own record, ON THE WIRE
   alone on the sheet, the world's M and W five texels wide (no longer an H), no pact runner from a post;
   five sampled checks corrected (answered.mjs's rag had been passing on the chief's cloth). My readings, marked in DESIGN.md: "a town that answered you", "friendlier", the
   kit from any lit board, only a chief's fire asks, the nights running, the eldest sent, the one who
   fell sets it, the kin's hours, the hand's loan. ahead.mjs 9 checks; 750-check battery, 52 suites.
   · REMAINING on this line (MY PROPOSAL — nothing in the docs specifies it): the letters passed on (a
     town you reached on a letter, once you keep a word there, writes ahead in its turn — the letters
     chain across the valley on the sheet, and a town at the end of three letters opens with its
     keeper's own errand already posted); the wire cut (a post on the wire is the grey banners' mark —
     on a storm night its mast is cut and the post goes dark, its board shut and its light gone, until
     the Walker carries a coil from any lit board and splices it at the mast); the ring given (a camp
     that has come out to the line twice gives its ring up without a fight — the knives walk off to the
     far hills and the fire becomes a waystation on the charter runs: a shelter, a box, a fire to rest
     at); the knives' stone (a cairn set twice and left standing a full week gets a stone set beside it
     by the camp itself, with a black thread — the first thing the knives have ever given you); the hand
     who stays (a town's hand who has walked your leg on three kin's days asks to stay on — hired for
     good with the ribbon and no fee, their plate saying whose day they walked for). — all five SHIPPED
     as **v3.49 THE WORD PASSED ON** (see 4q). The courier set was held until v3.50 drew it by hand at 32×32 (see 4r).
4q. **v3.49 THE WORD PASSED ON** (SHIPPED — the v3.48 REMAINING, whole, with its own pixel art and its
   polish, and the user's four corrections added onto the work): THE LETTERS PASSED ON (a town reached
   on a letter, once a word is kept there, writes ahead in its turn — two teal pips under the second
   letter, three under the third, LETTER 2 OF A CHAIN on the chip; the door at the end of three letters
   opens with its keeper's errand already posted, in the keeper's own words; the map draws the chain in
   teal); THE WIRE CUT (on a storm night past three days' grace, an even chance a raider from the
   nearest camp still up cuts the mast — the post dark, its board boarded, its terminal one tab, Board
   shut; THE SPLICE COIL on every lit board, 6 kg, spliced with G at the mast and paid like a delivery;
   the web closes as the camps come in, and with every camp in no raider is left); THE RING GIVEN (twice
   out to the line and the camp gives its ring up — the fighters leave for the far hills; the fire a
   rest stop on your routes: shelter, box, a warm fire to mend at, a light, kept by the valley); THE
   KNIVES' STONE (a cairn set twice and left standing a week — a knife sets the camp's own stone beside
   it with a black thread; the setter lifted; no raider from that camp again); THE HAND WHO STAYS (the
   same hand on three kin's days, and they stay on — a white pin through the ribbon, no fee, a place in
   the wedge, the plate naming whose day). The corrections: THE WHEEL (the mouse wheel zooms; a level
   is the size of the pixel block, so the Walker keeps their proportion to the valley at every level,
   and on a 150% display); THE PLAIN NAMES (every window, tab and button says what it is — Orders ·
   Mail · Fabricate · Hire · Donate · Storage · Records, Accept, Map, Cargo Rules, Factions, Crew,
   Manual, Delivery complete, Death certificate, save codes …; the theme in subtitles and art); THE
   STORAGE TAB (chips by kind, two columns with icons under coloured heads, the mission group first and
   gold, condition bars, Store all · Take all, stacked when narrow); THE ECOSYSTEM STEP (built to where
   this version touches it — the full pass is the REMAINING below). Polish on the same law: the chain's
   errand carries its mark, the cut mast's rows, the sign a lantern (it had read as a medic's cross),
   the cut post's header, the words out of the way, the header's gutter, the words on the ground
   outlined all round, a filter that filtered nothing. The cloud workspace was reset mid-version: the
   sources were split back out of the published v3.48 page (the rebuild byte-identical), v3.49
   re-applied, the audit rebuilt. My readings, marked in DESIGN.md: "keep a word there", the raiders'
   camp, the cut's cadence, the coil from nobody's bank, "twice to the line", the rest stop, the stone's
   camp stays up, the same hand, the full wedge. passed.mjs 15 checks + ahead.mjs 9; audit CLEAN; the
   other fifty suites of the 750-check battery run again when the v3.48 package is back.
   · REMAINING on this line (MY PROPOSAL — the user's fourth correction set the direction, from initial
     integrations to ecosystem integrations; these items are mine): THE BUS MAP (every system in the
     game listed with what it takes from the delivery loop and what it gives back — a table in
     DESIGN.md, and one plain line per window in the Manual saying how it helps your deliveries; a
     system that gives nothing back is wired in by one of the lines below or retired, and nothing is
     wired in by adding a chore); THE SLIP SAYS WHAT IT MOVED (the Delivery complete slip names what the
     delivery changed beyond its pay — the town's stock and mood, the wire's reach, a road's progress, a
     camp's standing, a letter's chain — so every progression reads as the consequence of a delivery);
     THE SURPLUS ON THE BOARD (what the works and outposts bank past what you build with is posted as
     freight to the towns short of it — a delivery, paid as one — so production feeds the boards); THE
     CAMPS ON THE ROUTES (a camp brought in — on the wire, given, or its stone set — joins the route
     planner and the wire's flow, its salvage feeding the towns near it); THE STANDINGS IN THE PAY (a
     faction's stance and a town's book read into what its board posts and pays, so the promises kept
     and the diplomacy change the work on offer, not a separate screen). Infrastructure: the fifty
     suites of the v3.48 battery back in the workspace, and the full battery run on the pass. The
     courier set: SHIPPED as **v3.50 THE COURIER SET** (see 4r). The ecosystem pass and the battery:
     SHIPPED as **v3.51 WHAT IT MOVED** (see 4s).
4r. **v3.50 THE COURIER SET** (SHIPPED — the user's word, repeated across versions: create the courier
   set's pixel art at 32×32): the Walker and every courier drawn by hand at 32×32 — three facings (east,
   west its mirror, toward the eye, away), the breath, four steps on the uneven cadence, the brace,
   astride, hung from the wire; 23 frames in the registry, the outline law on every one, 22 texels crown
   to sole from every side; the palette derived from the worn letters, so every coat, trim, hood, skin
   and boot recolours it (the pack's canvas the trim muted — my reading); one rig for the Walker, the
   hands, the Order's walkers, the scrappers, the riders, the ghosts, the Walker in a hall; the tower on
   the bedroll on the courier's own texel grid and everything lashed on re-anchored by facing (the
   frames' rails, the tools, the road's gift, the white rag, the kin's lantern, the keepsakes, the bolt,
   the scar and its dressing, the snow, the lamp at night, the ribbon, the pin); the people and the
   stable brought to its scale — the Farkeepers a courier's head taller again, the tender and the
   Reapers a third larger, the six breeds a third larger with the rider astride on the back line
   (resampled, not redrawn: my reading); the portraits on paper cropped head to boots at whole-texel
   scales, never squeezed. Found on the way: a line comment that had swallowed the renderer's exports
   on its line, the front view's repeated passing step, the pin on the belt's buckle, the old tower's
   crates between buffer pixels, the rim light at night painted on the outline (it lies inside it now, on
   the lamp's side). courier.mjs 10 checks; passed.mjs 15 and ahead.mjs 9 moved onto the
   courier's grid; audit CLEAN.
   · REMAINING on this line (MY PROPOSAL): the ecosystem pass of 4q stays the next line, whole (the bus
     map, the slip says what it moved, the surplus on the board, the camps on the routes, the standings
     in the pay). The art the courier set leaves behind it, mine: the town's own and the camps' own in
     the courier's three facings and four steps (they are side-on, two steps); the set pieces' figures
     (the Lamplighter, the stranger, the ride's Reapers — rectangles in world units) as registry rows at
     the courier's scale; the stable and the Farkeepers redrawn by hand at the new scale, the resample
     standing in until then; the Walker's bust drawn from the courier's own head. Infrastructure: the
     fifty suites of the v3.48 battery back in the workspace, moved onto the courier's grid where they
     sample the old rig. — all of it SHIPPED as **v3.51 WHAT IT MOVED** (see 4s); the suites were rebuilt
     from their records, the package never came back.
4s. **v3.51 WHAT IT MOVED** (SHIPPED — the v3.50 REMAINING, whole, the user's word being to ship it so):
   THE CAST drawn by hand on the grids they land on (twenty figures: the camps' own and the town's own at
   the courier's height in three facings, the breath and four steps; the six Farkeeper classes a
   courier's head taller with their ride frames; the Reaper, the Lamplighter, the stranger, the tender,
   the far shape; the kid), the stable's six breeds redrawn (idle and a four-beat walk), the set pieces'
   things (the letter, the axe's swing, the stones, the cold lamp and the sled — mine), the Walker's bust
   from the courier's head, the courier's sit and kneel — one figure engine for all of it, every set piece
   drawing from its row; THE ECOSYSTEM PASS (mine, from 4q): WHAT IT MOVED on the Delivery complete slip
   (the shelf, the book, the word on the wire, the light, a road's next stretch, a camp, the bank's
   surplus — each under its mark), THE SURPLUS ON THE BOARD (the bank past its reserve as freight for the
   town short of it, posted where it was made), THE STANDINGS IN THE PAY (the book and the holder's stance
   on the card, in the grade, on the slip and over the board; a crate more or fewer), THE CAMPS ON THE
   ROUTES (no ground to walk round; the stone's knives let you through and walk their salvage in; the
   Guide stops a hurt Walker at a given fire), THE BUS MAP (every window's line for your deliveries; the
   system table in DESIGN.md); THE BATTERY REBUILT from the records of the lost suites (my rebuild): all
   fifty-one of v3.48's lost suites on the courier's grid, the six earliest (the loop, the character layer,
   the keys-and-clicks run, the mouse-only run, the economy's dynamics, the v3 loop rules) from the subjects
   their record names (my reading), the balance session a suite again — fifty-six suites — and what it found
   fixed (see DESIGN.md: a Farkeeper who met no runner, a companion no click could reach, an epitaph never
   said, the beam on its head, the night half a pixel off, LONG POST unreachable, time run backwards for a
   frame, Elm's boots counted twice, a terminal that tended the Walker only beside a delivery, a stamina
   ceiling that never moved, Lucky Find leaning to the common lines, a companion's load that would not
   deliver alone, and more). moved.mjs 11 checks; the battery 937 checks across fifty-six suites, zero fails; audit CLEAN.
   · REMAINING on this line (MY PROPOSAL): a mouse path to the Map and the pause sheet from the field (a
     walker on the mouse alone cannot open either: M, Tab and Esc are keys — the one gap the rebuilt
     mouse-only run found in "one hand for travel"); the Delivery complete slip's last line on a window
     under about 760 pixels. Nothing of the v3.50 REMAINING is left open. — both SHIPPED as **v3.52 WITHIN
     REACH** (see 4t), with the rebuild traced to its records.
4t. **v3.52 WITHIN REACH** (SHIPPED — the v3.51 REMAINING, whole: the mouse-only path to the Map and the pause
   menu, the slip on a short window, and the rebuilt suites being my reading of their records): THE PAPERS
   ROW — the six papers the keys open (Map, Cargo & equipment, Skills, Crew, Manual, Pause) a hand-drawn
   button each under the ◆ and the day, lit while open, the paper's name and key under the row, the key and
   the click one path (the four beyond the Map and the pause menu mine); the map's and the pack's own CLOSE;
   the Paused sheet's Resume pinned and its settings in two columns on a short window; the Paused sheet in
   the manual's index at last — every window within the mouse's reach. THE SHORT WINDOW — the slip's foot
   pinned, two columns under 800 pixels high when it moved something, the fullest slip whole down to
   600; the intro card held to the window with Start in view and the foot line out of its way; banners that
   wait for a paper (mine). THE NARROW WINDOW (mine, found by measuring the row) — the compass, the Guide
   and the toasts keep the middle of the HUD's top at every width and paper scale; the Guide steps down
   under the vitals where the middle is too narrow to read, the toasts at the compass's foot; the band
   drawn as near the paper scale as the width allows; the pack bounded above the order tray, its CLOSE at
   its foot. THE RECORDS, TRACED — the originals searched for and in no reachable place; a
   ledger per rebuilt suite and tools/records.py reading all fifty-two against their records (851 checks,
   1,549 clauses, every one proven; 109 changed by design; 11 checks mine); the clauses no check proved
   closed in their nearest checks, twelve overclaiming checks made to assert their names. Found on the way:
   a wraith's grab no press could break on a frame longer than a twentieth of a second, the Paused sheet's
   Resume below a scroll, the intro card's Start under the title's foot line at 600 high, banners across the
   slip; on narrow windows the Guide over the vitals, the row and the ◆, the compass over the vitals; the
   pack past the window's foot. reach.mjs 12 checks; the battery 950/950 across fifty-seven suites (two test-side failures fixed and re-run); audit and records CLEAN.
   · REMAINING on this line (MY PROPOSAL): the rebuilt suites stay my reading of their records — the original
     code comes back only if the v3.48 package is found; the records' 27 figures read rather than asserted to
     pin, and 74 thresholds to tighten, suite by suite; at the Small, Large and Larger paper scales the pixel
     marks inside the papers (the pack's crate icons among them) fall between whole screen pixels — the papers
     row keeps whole texels now, the rest could snap the same way; the HUD proven down to 700 pixels wide, and
     at Larger under about 900 a long toast wraps to five lines in its column.
5. **THE ASSET PASS** (SHIPPED v3.33 — credits landed; twenty generations spent): the pipeline
   (generate → Lab k-means ramp snapped to OUR bands → quantize → cluster discipline → embed as
   registry rows) proven on THE STABLE — five breeds + the caravan donkey at the discovered
   world-scale size, four-frame walks on an uneven cadence, one mount draw for every saddle — and
   REJECTED for people on the measured evidence (a generated human fits the 12×18 rig at no
   scale): THE KIT's five Farkeeper classes and the Flame Keeper tender were HAND-DRAWN in the
   rig's grammar instead. assets.mjs 13 checks; ~583-check battery, 37 suites.
   · The courier set: SHIPPED v3.50, drawn by hand at 32×32 (see 4r). 3,304 generations in hand for future rows (a new breed; the
     halls' furniture was hand-drawn in v3.34 on the texel grammar).
6. **Rolling opens inside every version** (never a version of their own): protagonist origin
   fragments continue to drip; absurd-realism placements at judgment; pixel-art polish on every
   source touch. WE ARE MIVIM : MIVIM ERA WE * STANDARDS.
