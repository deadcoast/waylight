# WAYLIGHT — Shipped Design Doc (v3.0 · The Needs Economy)

[Playable build](https://claude.ai/code/artifact/9ed799db-2103-4667-b424-0de78dce88c5) (single-file HTML5, canvas, ~7,200 lines, no libraries; saves to localStorage per browser; v1/v2 saves migrate and are seeded with stock). Future sessions: republish to this URL via the Artifact tool's `url` parameter (read the live version first — the tool requires it). Source parts live in the session workspace at `waylight/src/*` assembled by `build.py`; that workspace is ephemeral — the artifact is the durable copy. Companion docs: `research-death-stranding-delivery-mechanics.md`, `research-loop-psychology.md`, `research-zomboid-permadeath.md`, `game-approaches.md`, `waylight-expansion-design.md`.

## Three lessons, all kept

**v2.0 → v2.1.** The character layer shipped verified only through debug shortcuts and was invisible from the player's chair. *Implemented and unreachable is the same as scaffolding.* Every feature must be encountered, unprompted, inside the first ten minutes, and verified by a keys-and-clicks-only bot.

**v2.1 → v2.2.** The first objective was impossible on foot (a wadeable creek carved as a canyon) and nothing on screen said what to do. *A test that borrows the game's internal knowledge is not a test of the game.* The first delivery is walked by a bot that reads only the screen (`tests/firstwalk.mjs`).

**v2.3 → v3.0.** The verdict on v2.3 in play: *"the game is just 'go here' … you failed to integrate the features … the theme is literally just lighting beacons."* Correct. Orders were random templates with no consequence; nothing a delivery did changed what the next delivery was worth; roads, porters, skills and weather sat beside the loop instead of inside it; and the fiction reduced to a light switch. v3.0 replaces the order generator with a **needs economy** so that every feature enters a decision, and reframes connection as a **wire** (goods move) rather than a light (a switch flips). The balance bot (`tests/session.mjs`) is the new law: *a greedy bot must not find a degenerate loop*. It found three before the design held — see Balance below.

## The economy (what a delivery is now)

Every station has a population, three or four **needs** and a few things it **makes**. Stock for each need sits on a 0–100 bar that drains with time (0.035/s × population; the unconnected ration at half rate). A delivered crate adds 28. Stock sets a **mood** — *critical* < 15, *wanting* < 35, *steady* < 65, *thriving* — and mood sets the price: ×2.2 / ×1.5 / ×1.0 / nothing. **A station never posts an order for a need it is thriving on.** The board at any terminal is therefore not a list of templates but a reading of the valley: what *this* station can spare, who among the places you know is short of it, how badly, how far, what the walk asks (wading, scrappers, deep grey, steep, or "river — needs a crossing"), and what your pack will weigh after you say yes. Several crates landed in one trip pay a rising chain bonus (+15% per further stop, capped ×1.6), so the load is a plan, not a pick.

The opening is true to the fiction: Elm Farm is out of medicine (8), Haven is eating its reserves (31), the Mill is hungry (18), the Greenhouse is nearly out of seed. Haven makes tools and textiles; Elm grows food and seed; the Greenhouse grows medicine and filters; the Mill makes parts and tools; the Quarry tools; Relay Hill lumen cells; the Foundry coolant and parts; the Pharos makes nothing and needs everything.

**The wire.** When a station is connected, what its connected neighbours make flows to it on its own (0.06/s per feeding maker) — more than its people consume, so a connected pair sustains itself and its stock climbs to full. A **paved road** between two stations multiplies that flow (×1.6 partial, ×2.2 complete); a **chartered route porter** adds ×1 more. The player is told this the first time it happens ("Haven is being fed by the wire now — Elm Farm sends what they can on their own") and the connection cinematic names who will feed whom. The consequence is the shape of the whole game: **the connected core saturates and stops posting; the frontier is where the crates are needed.** The wire pushes the player outward; roads and porters are how the player makes the core self-sufficient behind them.

**Neglect.** A connected station critical on a need that a *known* maker could supply **dims** (its light radius shrinks by a quarter, so the safe ground shrinks). If the wire is not already closing that shortage (no connected maker), four minutes of it costs a **star** — "people are leaving" — and with no stars left the station **goes quiet**: off the wire, light out, and every lit terminal posts a *Relight X* core order. Shortages of goods nobody you know makes are rationed, not held against you.

**Letters** go everywhere people are — light, half pay, and each one read aloud on delivery (24 lines from the valley). A place's mailbag refills only every ~5–8 minutes once carried off; they are proof, not income. **Crises** (events after three stations are lit) empty a station's best-stocked need in one stroke. A **day** is 8 minutes; the last 40% is night: wraiths wake in thinner mist, the cold bites harder, a veil settles on the screen, and the HUD says so.

**Skill verbs** (the character layer inside the loop): Rigging 2 lays a *field ladder* from 8 scrap when none is packed; Hearthcraft 2 cooks a warm meal anywhere; Salvage 2 (or a Scavenger) pings scrap and lumen on the compass.

## Where the features now live

Weight and capacity (Hauling, packs, companions) decide how many orders one trip can chain. Balance, bracing and weather decide the condition grade. Ladders and bridges open the Silt and keep the creek's crates dry. Roads are speed on foot *and* wire throughput. Waylighters carry your overflow, and chartered routes are wire throughput. Camps sit on the routes to the Mill, the Greenhouse and the Quarry; auto-travel skirts scrapper territory when you are loaded (×5 path cost) and walks straight through when you are not, because scrappers only chase cargo. Night is a timing decision. Stars are now something you can lose. The map shows every known station's mood ring and "out of / short of" label; hovering reads its bars.

## Losing a crate

An order's crate can leave your back: a stumble drops it, a wraith snags it, scrapper runners haul drops to their stash, a companion carries it, you lock it in storage. The Guide reads where it went ("Medicine is on the ground — go back for it", "hangs at a snag", "Scrappers took Rations to Pass Camp — their stash holds it") and points there; the compass keeps a *crate* mark that never declutters; the tray card turns rust and says where. A companion's load delivers with you (handed over at the terminal). Any order can be **given up** (✕ on its tray card): its crates become lost cargo for the same place (half credit if they ever arrive) and a ★ order returns to its board.

## Controls: one hand for travel, two for trouble

**M1 tap** on the ground — walk there along a route feet can actually take (deep water and cliffs avoided, crossings used, camps skirted while loaded; a tap across an uncrossable river is refused with "No way through on foot — a ladder or bridge would change that"). **M1 tap on a terminal, ruin, crate, cairn, paver, pylon or event** — walk there and use it. **Hold M1** — steer at the cursor. **Hold M1 + M2** — sprint. **M1 on the valley map** — travel there. **W A S D** overrides; Shift sprints; Space steadies; E interacts. If feet stop advancing or six seconds of walking go nowhere, the ground ahead is marked impassable and the route re-plans (up to three times) before an honest "The ground stops you here".

## The first walk (unchanged, re-verified)

The gold Guide line under the compass always says what to do next, which key does it, and where it is. Order p1 medicine + a letter to Elm across the wadeable creek; p2 two crates of food home with two ladders granted; p3 the beacon core — "Elm Farm is on the wire: watch the terminal, Haven's food and Elm's tools now move between them on their own." Random events hold until the first delivery lands. The screen-reading bot finishes the arc in ~95 s.

## Balance (the session bot)

`tests/session.mjs` plays 30 game-minutes at 4× clock with real walking and real orders: at every terminal it takes the ★ if it fits, then the best pay-per-kilo orders up to capacity; it recovers crates it drops, gives up crates scrappers have stashed, and teleports only where a player would lay a ladder (logged). Three degenerate loops were found and closed with it:

1. **The overloaded stall.** Accepting 110% of capacity, it dropped the 18 kg core, then stood at the Mill forever with nothing deliverable. Fix: the lost-crate Guide, compass mark, tray line and give-up (above).
2. **The letter shuttle.** Letters were infinite, 4 kg and paid by distance; the bot carried mailbags Haven ⇄ Elm for twenty minutes. Fix: mailbags refill slowly, pay half.
3. **The full-station shuttle.** With Haven and Elm both at 100 stock the boards still posted food and tools at ×0.6; the bot ferried them for twenty minutes with the Mill's core riding along unopened. Fix: thriving needs are not posted. Also found: a station lost a star four minutes after its maker was connected because the wire had not yet caught up — now the wire closing a shortage exempts it from star loss.

Final run: 30 game-minutes, 49 deliveries, six stations connected (Haven, Elm, the Mill, the Greenhouse, the Quarry, Relay Hill), stars 3/3/2/1/1/0, zero deaths, zero scrapper knocks, no repeated decision anywhere in the log, and the decision mix keeps changing as the wire saturates the core — exactly the shape the design wants. (Two river legs were teleported with a note; a player lays a ladder there.)

## The two laws

1. **Connection makes land safer and richer** (DS): a core delivered puts a station on the wire; its light pushes back the grey and pacifies camps it reaches; its goods move to its neighbours on their own; roads and routes widen the wire.
2. **Porters are mortal, the network is immortal** (PZ): stations, stars, stock, roads, structures, banked materials, reputation, hired waylighters and route charters persist across deaths; class, traits, skills, equipment and cargo die with the body — recoverably.

## Everything below is as shipped in v2.x

Character layer (8 classes, 19 traits, 10 skills with PZ curve, manuals), survival-lite (health, food, warmth, moodles), death cosmology (cairns, porter-wraiths, journals), items and 36 ruins, waylighters (companions and route porters), events, terrain rules (riverbanks never cliffs; only painted cliffs and deep water block), HUD layout, the permadeath ★ re-post fix.

## Verification

179 automated Playwright checks green, console clean, across seven suites: the delivery loop and network progression (33), the character-layer systems (35), the keys-and-clicks player-fidelity run (31), the **screen-reading first walk** (24), the **mouse-only run** (18), the **economy dynamics** (24: needs and moods set boards and pay, stock fills and drains, the wire flows and is multiplied by roads and porters, dimming, star loss, going quiet and relighting, chain bonuses, letters, crises, night, skill verbs, save migration), and the **v3 loop rules** (14: the lost-crate Guide/compass/tray chain, pickup recovery, stash tracking, giving up, companion hand-over, thriving suppression, letter scarcity, camp-skirting loaded routes, the wire's star-loss exemption, best-stock crises, honest stall handling, the wire cinematic) — plus the 30-game-minute balance session above.

## Future-work candidates

Touch controls; a suggested-route line on the map; NPC route events; relationships between waylighters; gear durability with Mending repairs; a second procedural valley after the Pharos; stock visible from the field (a bar over the station when near).
