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
(rig-texel tables or data URIs), never hotlink. Queue for the first pass: default courier set (the
user's 32×32 sheet as style reference), pack donkey, horse breeds, Farkeeper classes.

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
     new war is a row + a resolver).
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
     when the survey is open; a presser's chain drawn on the survey sheet.
5. **THE ASSET PASS** (SHIPPED v3.33 — credits landed; twenty generations spent): the pipeline
   (generate → Lab k-means ramp snapped to OUR bands → quantize → cluster discipline → embed as
   registry rows) proven on THE STABLE — five breeds + the caravan donkey at the discovered
   world-scale size, four-frame walks on an uneven cadence, one mount draw for every saddle — and
   REJECTED for people on the measured evidence (a generated human fits the 12×18 rig at no
   scale): THE KIT's five Farkeeper classes and the Flame Keeper tender were HAND-DRAWN in the
   rig's grammar instead. assets.mjs 13 checks; ~583-check battery, 37 suites.
   · HELD: the courier set against the user's own 32×32 sheet — not in the workspace; the rig
     stands untouched until the sheet lands. 3,304 generations in hand for it and for future rows
     (a new breed; the halls' furniture was hand-drawn in v3.34 on the texel grammar).
6. **Rolling opens inside every version** (never a version of their own): protagonist origin
   fragments continue to drip; absurd-realism placements at judgment; pixel-art polish on every
   source touch. WE ARE MIVIM : MIVIM ERA WE * STANDARDS.
