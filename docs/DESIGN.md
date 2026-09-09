# WAYLIGHT — Shipped Design Doc (v3.15 · LEDGERLIGHT · Light Has a Body)

Playable build: **<https://claude.ai/code/artifact/9ed799db-2103-4667-b424-0de78dce88c5>** (single-file HTML5, canvas, ~8,700 lines, no libraries; saves to localStorage per browser; v1/v2 saves migrate and are seeded with stock). Future sessions: republish to this URL via the Artifact tool's `url` parameter (read the live version first — the tool requires it). Source parts live in the session workspace at `waylight/src/*` assembled by `build.py`; that workspace is ephemeral — the artifact is the durable copy. Companion docs: `research-death-stranding-delivery-mechanics.md`, `research-loop-psychology.md`, `research-zomboid-permadeath.md`, `game-approaches.md`, `waylight-expansion-design.md`.

## Three lessons, all kept

**v2.0 → v2.1.** The character layer shipped verified only through debug shortcuts and was invisible from the player's chair. *Implemented and unreachable is the same as scaffolding.* Every feature must be encountered, unprompted, inside the first ten minutes, and verified by a keys-and-clicks-only bot.

**v2.1 → v2.2.** The first objective was impossible on foot (a wadeable creek carved as a canyon) and nothing on screen said what to do. *A test that borrows the game's internal knowledge is not a test of the game.* The first delivery is walked by a bot that reads only the screen (`tests/firstwalk.mjs`).

**v2.3 → v3.0.** The verdict on v2.3 in play: *"the game is just 'go here' … you failed to integrate the features … the theme is literally just lighting beacons."* Correct. Orders were random templates with no consequence; nothing a delivery did changed what the next delivery was worth; roads, porters, skills and weather sat beside the loop instead of inside it; and the fiction reduced to a light switch. v3.0 replaces the order generator with a **needs economy** so that every feature enters a decision, and reframes connection as a **wire** (goods move) rather than a light (a switch flips). The balance bot (`tests/session.mjs`) is the new law: *a greedy bot must not find a degenerate loop*. It found three before the design held — see Balance below.

## v3.2 — identity, hands, and a working companion

The v3.1 verdict in play: the pack UI was unclickable (its buttons sat under click-to-move), the hired companion was "a bag that follows you" and watched the player get beaten, travel had one rigid line, the UI gave no click feedback, and the world had no people in it — "am I a slave? am I a hero? a mailman?" — plus a vocabulary correction: *porter* is Death Stranding's word. Fixes, each with checks in `tests/feel.mjs`:

- **Input.** Every HUD panel is now event-solid: pack buttons (eat/use/study/equip/give/drop) click, and clicking a panel never starts a walk. Root cause: the HUD root is `pointer-events:none` and the pack panel never opted back in, so clicks fell through to the canvas.
- **The companion is a person with hands.** Their chip (portrait, class, carried kg) is clickable → opens the hand-over; clicking them in the world walks to them and opens it; `G` beside them does the same. They **intercept** scrappers charging a loaded Walker — the runner is met 220 u out and knocked sprawling (8 s cooldown, off while hungry), with an impact ring and a spoken line ("Not this one."); they call out when a wraith grabs you; they say something when hired.
- **Routes are strung, not straight.** Shift-click — in the world or on the map, which stays open for it — strings up to eight numbered marks; feet take them in order (each leg pathfinds; strung marks never snap to ruins or terminals). Plain click still walks-and-uses. Keys still cancel everything.
- **UI feedback.** Press states with brightness pulse on every button, hover glow, tab underline and shadow, panels animate in, an accepted order card flashes gold and slides off the board before the redraw.
- **Vocabulary.** *Porter* is gone from every player-facing line; the trade is **Waylighter**, informally **Walker**; pay is **trust** (◆), not likes; the dead in the grey are **the kept**; title ladder now Greenhand → Mudfoot → Waylighter → Pathbinder → Lifeline → Lamplord → Legend of the Valley.
- **Identity — The Postman, not Kojima.** The register is the 90s apocalyptic scorned hero: concrete, warm, dry, unapologetic. Three mechanisms carry it:
  1. **Keepers.** Every terminal has a named face — Mara Voss (Haven quartermaster), old Wren (Elm, farming for a diabetic granddaughter), Bo Tammen (Mill head sawyer), Dr. Callas (Greenhouse), Sela Marsh (Quarry forewoman), Corporal Finch (Relay Hill, still logging after four hundred days), Brand (Foundry, four words a sentence), Keeper Aster (the Pharos). Each greets by station state: a first-visit hello, a line per mood, a line for the day you relight them. The briefing is Mara talking, at the fire.
  2. **The Walker speaks.** A bark system (`Systems.bark`) — dry one-liners spoken into the world at nightfall in the open, wading, dropping cargo, tearing free of a wraith, entering the deep grey, overloading, landing a critical delivery, relighting a station, crossing scrapper ground. Cooldown-gated (30 s, each line retires after three uses): a voice, not a chatterbox.
  3. **The creed.** Title screen: *somebody has to walk it.* The intro ends on the trade's name and its pay: thanks, tomatoes, and a bed by whichever fire you reach by dark.

## v3.3 — the 90s pass, built from the named sources

The v3.2 identity pass was rejected: quiet prestige-drama lines wearing a 90s label. The correction demanded the actual sources, each as a mechanism (`tests/feel.mjs` covers all of it):

- **The Postman → the Order of Waylighters.** The why. There used to be an institution — coats, lanterns, an oath, a dispatch bell on every terminal — and the quiet ate it. The intro is Mara Voss taking the last coat off Haven's hook and holding it out: "It'll fit. It always fits somebody." Ranks are field promotions IN the Order (Greenhand of the Order → Mudfoot → Waylighter, Sworn → Pathbinder → Lifeline → Lamplord → Legend of the Valley).
- **Cannon Fodder → the Roll of the Order.** The title screen keeps the dead in view: Juno Longwalk, 214 deliveries, the Silt took her; Old Marrow, 402, sat down by his fire and stayed. Your own dead join the top of the Roll with their record and cause — and a save that used codes is marked WALKED WITH HELP, forever.
- **NBA Jam → the Dispatch booth.** The Order's pre-quiet automation still runs, all caps, zero doubt. Chained stops escalate across the screen: "DOUBLE DROP. THE WIRE NOTICES." → "THREE STOPS — THE WIRE SINGS!" → "FIVE STOPS — THEY WILL SING ABOUT THIS ONE." Grades slam with a stamp line ("TEXTBOOK. FRAME IT." / "IT ARRIVED. TECHNICALLY."). Rank-ups slam "ORDER OF WAYLIGHTERS — FIELD PROMOTION."
- **The era itself → cheat codes, typed blind on the title screen.** MELLYGIBS (five flares, go be the road warrior), TOMATOES, LONGLEGS, BIGLANTERN, BOOTHILL. The Dispatch answers ("DISPATCH SEES NOTHING. WINK." / "THAT CODE DIED WITH THE NINETIES."), the footer says CODES WORK HERE. TYPE ONE., and cheating goes on your permanent record on the Roll.
- **Z / Carmageddon attitude → everything talks.** Rotating box-copy taglines under the logo ("Scrappers hate this one weird trick: DELIVERY."). Scrappers yell when a chase starts ("DROP THE PACK AND WALK, HERO!"). Keepers were rewritten from mood into want — Bo Tammen shouts, Wren owes and hates owing, Finch rehearsed his greeting eleven times — and a keeper's own voice lands on the results screen when you fill a need they were short on. Death screens close with a cause epitaph ("The ground was there the whole time.").

## v3.4 → v3.5 — the game LOOKS 90s: skin, then strawman, then actual pixel art

Two-stage lesson, recorded because the first stage repeated the project's recurring failure in a new place.

**v3.4 (the skin and the pipeline).** The HUD was reskinned to the era — 2px borders, hard chunk shadows (`--chunk: 3px 3px 0`), uppercase 800-weight buttons that physically displace 3px when pressed, segmented tick meters, a hot gold/rust palette — and the world pass was rerouted through a 1/2.6-resolution buffer blitted back with smoothing off, plus a saturation filter. Verdict in play: *"slapping a pixel filter on the game is not what i said. what you just did is a strawman."* Correct. Downsampling soft gradient art produces mud, not pixel art; 90s games were not low-resolution photographs of modern games — they were **drawn** at that resolution.

**v3.5 (authored art).** The filter is gone and the art is drawn:

- **Terrain is painted in designed 4-tone ramps** — one authored palette per surface (meadow, forest, scree, rock, snow, marsh, shallow, deep, cliff, station pad) — with the tone at each texel picked by **4×4 ordered Bayer dithering**, the random RGB jitter deleted. Land dithers in deliberate 2×2 blocks; water keeps fine bands. Hillshade folds into the tone *index* (banded light, like a palette artist shaded it) instead of multiplying the colour. Contour steps at fixed height intervals. On top: a fixed 4-texel **grass-tuft glyph** stamped across scattered cells of meadow and marsh (the LTTP move), 2×2 canopy crowns clumped over the forest floor, speckle on scree and rock, banding on cliffs.
- **Characters are sprites.** One 9×14 humanoid rig with two stride frames and an idle, blitted on a snapped texel grid and flipped by facing — palette-swapped for the Walker (blue coat, tan pack), companions (green hoods, their portrait colours), and scrappers (rust). The companion animates when she walks and faces where she goes. The Walker pulls out a pixel hand-lantern in the dark. Cargo is chunky outlined crates with a lash strap, stacked on the pack; tools are slung poles.
- **Stations are buildings.** A 16×8 stone longhouse — ridge highlight, banded roof, three window bays that burn gold when the station is on the wire, dark doorway — with the beacon mast rising behind the roofline and a yard: stacked crates port side, a rain barrel starboard. A depot, not a lawn ornament.
- Honest scope: **wraiths are still gradient glow** (deliberately — they are the one thing in the valley that *isn't* solid), and the progression/item/risk-reward overhaul demanded alongside identity is still owed, not claimed.

Evidence standard for this pass: same-frame before/after screenshots against the previously published build (`tests/artshot.mjs` boots both, lights the Greenhouse, and shoots the identical composition), because the v3.1 lesson — *every mechanical claim had a bot, the pixel claim had none* — now applies to art claims too.

## v3.6 — one law: no alpha in the world. Light is palette; transparency is dither

v3.5 drew the world in pixels but still LIT it like 2020: translucent veils, radial-gradient glows, an alpha night screen — modern compositing airbrushed over authored art. v3.6 states one art law and enforces it on every world-layer element: **nothing in the world is translucent. Light is a palette change; transparency is ordered dither.** The fusion this buys is the project's founding sentence made literal — the network's reach is not a glow over the picture, it IS the picture's palette:

- **The light field recolours the ground itself.** A per-texel overlay holds a palette-remapped copy of the terrain in five light bands — two cold blue-dark steps in the quiet, a bare neutral shelf, two warm gold steps on the wire — with Bayer dither only where bands meet. Band edges become dithered gradient rings around every station: territory with a visible edge. Mist deepens a band; there is no mist alpha.
- **The coastline.** At exactly L = 0.30 — the light level a wraith cannot cross — the band boundary is drawn as a dithered golden shore, day and night. The safety radius of the network is a gold checkered coastline you can walk along. Nobody ships their threat boundary as cartography; it is the single most identifying mark on the screen.
- **Night is a cartridge palette swap, not a veil.** A second night field bakes the same land two palette steps deeper and bluer, lit ground keeping its day face (the punch-through, now structural). Dusk steps through it in hard stages. The old full-screen rgba night veil is deleted.
- **Every glow is dithered shells.** Station halos, the beacon pillar, headlamp, camp fires, lumen pickups, ruin echoes, the peddler's lantern, grave-wraiths, mist wisps, the connection ring's flood: all rebuilt from three Bayer-coverage shells of solid additive dots (75/45/20%) — the era's faked light. Zero radial or linear gradients remain in the world pass (HUD and vignette keep their own language).
- **Wraiths are dither-bodied.** The one unsolid thing in the valley is rendered in the era's own language for unsolid things: its body IS a breathing ordered-dither cloud with two hard pixel eyes and tendrils of solid squares. Ghosts were checkerboards in 1996.
- **Water sparkles; rain is dashes.** Foam texels blink on shallow water in slow shifts; greyfall rain fell as alpha strokes and now falls as solid pixel dashes.
- Engineering: the light overlay repaints incrementally (diff of the light grid → dirty-region repaint, ~250 ms full paint once at bake, bursts batched to ~4 Hz through the connect cinematic); roads repaint their strip of the field when paved. Frame time unchanged at 16.6 ms.

## v3.7 — the ground remembers, and the world speaks in pixels

Two gaps remained after v3.6, both found by looking at the screenshots the way a player would.

**The seam of type.** The world was 1996 but its voice was 2024 — barks in italic serif, station names in display type, labels in UI sans, all floating over pixel art. Now every piece of text painted INTO the world uses one authored 3×5 bitmap face (five octal digits per glyph, drop-shadowed on the texel grid): station names and their trust diamonds, spoken barks (word-wrapped, fading in hard steps), companion and grave names, ruin and paver labels, the Peddler, structure credits, route-mark numbers. The DOM HUD keeps its clean era type; the valley itself is all texels.

**Desire paths — the ground remembers your feet.** The deepest missing Death Stranding idea: repeated walking should carve paths, and the land forgot every step. Now every six metres walked on grass leaves a print in a wear grid (companions tread lighter); enough passes and the meadow visibly wears — first trampled yellow-green, then bare packed earth — dithered into the terrain paint itself in the ground's own ramps, young paths broken, old paths solid. Worn-bare ground walks 7% faster: the network's roads are bought, but the walker's paths are EARNED, and both are read off the land, not a menu. Paths persist through save, death and inheritance (the next Waylighter walks the last one's trails); a new valley grows its grass back. The first path worn to bare earth teaches itself — a toast, and the Walker looks down: "A road nobody paid for. Mine."

Also in the pass: **footprints** stamped behind the feet (dark on grass, bright-pressed on snow, brief on scree), **foam splashes** while wading, **cloud shadows** — two slow dither-shade blobs drifting on the day wind under the no-alpha law — the **coastline breathes** (gold texels blinking along the wraith line), and scrapper **tents are an authored glyph** with fire-lit doors. Verification grew a tenth suite (`tests/paths.mjs`, 9 checks): wear accumulates and clamps, six real walking passes wear a visible trail through the systems (no debug shortcuts), the bare path lands in the terrain canvas and the light field's copy of it, the worn lane measurably outruns fresh meadow, paths round-trip save/load, and a spoken line lands as gold pixel-face texels on the composited canvas.

## v3.8 — integer-pixel discipline (the verdict: "unlegible text… over-sharpened grid overlays… glass UI")

The v3.7 screenshots from real play convicted the pass on one root cause: font texels, dither cells and pattern fills were drawn in WORLD space at fractional buffer pixels — the canvas antialiased them, the nearest-neighbour upscale magnified the antialiasing, and the result read as mush passing for pixels. Cartridges never did this: labels were screen-space tiles, glows were baked sprites. Three corrections, all structural:

- **Labels never scale with the camera and never land between pixels.** Every world label (station names, barks, grave and companion names, ruin/paver/peddler tags, route numbers) is queued during the world pass and drawn AFTER the upscale, in screen space, at integer texels snapped to the texel grid — constant size at every zoom, crisp by construction. `GREENHOUSE` is now readable at any camera height.
- **Every dithered glow is a baked sprite, drawn nearest.** Halos, the beacon pillar, fires, lanterns, wraith bodies, cloud shadows: hard Bayer dots baked once into an offscreen sprite and `drawImage`d with smoothing off — nearest sampling keeps the dots square at any scale, where pattern fills and per-frame fillRect dither produced the moiré the screenshots showed. (Rule of thumb now enforced: sparse dither may only reach the screen through nearest-sampled images, never through fractional-coordinate fills.)
- **The HUD stopped arguing with the world.** One typeface family (the serif display face is gone), opaque bevel-edged panels instead of translucent glass, solid borders instead of alpha borders, and every glow-blur text shadow replaced with a hard offset. The DOM chrome now reads like the game's menu system, not a modern overlay.

All 229 checks green on ten suites after the rewrite; 16.6 ms/frame.

## v3.9 — LEDGERLIGHT: the house style, named

What the art passes were converging on is now stated as doctrine, and it is ours:

> **LEDGERLIGHT.** Every system must write its state into the land itself, in palette steps and ordered dither. Nothing floats. The world is the interface.

The valley already kept three ledgers — light as palette bands, safety as a golden coastline, effort as desire paths. v3.9 makes the doctrine total:

- **The wire is caravans.** The economy's flow between connected stations was invisible arithmetic; now every feeding pair sends **caravans of light** down the road between them (the crow-line until one is paved) — three gold texels and a tail, spawn rate tied to the real flow multiplier. Stand anywhere in a grown network and you can watch it breathe. At night, the valley is crossed by moving lights you built.
- **The windows are the stock report.** A station's longhouse reads its own pantry: full, both window bays burn; running short, one goes dark; starved, both are out and the doorway gutters. Station health is read from across a field, not from a panel.
- **The coat is the rank.** The Order writes itself on the Walker's back: drab wool at Greenhand, the blue coat once Sworn, gold trim as a Lifeline, and the dark gold-lined coat of a Legend. Progression you can see on the sprite you steer.
- **The title screen is the ledger itself.** No static menu: the camera tours YOUR saved valley — its lights, its worn paths, its coastlines — behind an **authored WAYLIGHT wordmark** (drawn letter by letter, bone and gold, the beacon burning over the I of LIGHT). The save greets you as terrain. A new player tours the dark valley they are about to fix.

Verification grew an eleventh suite (`tests/ledger.mjs`, 8 checks): the title camera provably drifts, the wordmark's bone and gold pixels are counted, caravans spawn between connected stations and advance along their routes, stockRead maps pantry → bays (2 full / 0 starved) with the on-screen glass dimming measured as a delta, and the coat palette swaps by rank. A hard-won testing lesson is recorded here: pixel-hunting a busy composited frame kept getting defeated by the game's own honesty (a starving station dims, which moves its coastline into the sample box) — the reliable instruments are state-delta measurements and source-level asserts, with full-frame screenshots as the human check.

## v3.10 — the interface is the Order's paperwork (and the last curves die)

The gate question before expanding to new systems: *is the visual identity actually resolved, or would building on it propagate an unresolved one?* Honest answer: the world was resolved; the UI was not. v3.8's HUD pass was subtraction — glass and gradients removed — and subtraction is not identity. A clean dark game UI is nobody's. The chrome did not participate in LEDGERLIGHT.

The resolution extends the doctrine to the chrome by asking what interface this institution would actually have. The Order is postal. Its interface objects are its **paperwork**:

- **Orders are waybills.** Every card leads with a stamped tag — WAYBILL, MAILBAG, PRIORITY DISPATCH — and carries a perforated left edge. Accepting one is taking a slip off the board (the gold flash-and-slide was already there; now it reads as tearing off the sheet).
- **The terminal is the station's ledger book.** Its tabs are raised file-folder index tabs, not web nav; the active tab joins the page.
- **The results screen is the stamped delivery slip** — "WAYBILL — DELIVERED · OFFICE OF THE DISPATCH · THE ORDER OF WAYLIGHTERS", the grade slammed on it like ink.
- **Panels are printed on the world's own matter**: every panel and card is textured with a 4-pixel tile of the game's Bayer dither — paper grain in the same language as the terrain — via an inline SVG tile, nearest-rendered.
- **No curve survives in the world.** The remaining smooth geometry died: every sprite shadow is now two stacked slabs (`pixShadow`), the station platform is a stepped stone slab instead of an ellipse pair, the float sled is slab-drawn. `cx.ellipse` count in the world pass: zero.

Four new checks in `tests/ledger.mjs` pin the paperwork (dither-paper computed style, waybill stamps on live cards, raised ledger tabs, the delivery-slip title): 241 checks green across eleven suites.

## v3.11 — PLATE & PAPER: the pixel pass (a directed asset review, translated, not transplanted)

The direction arrived as a library of pixel-art techniques — push-buttons, hearts, a CRT display font, an SCSS pixel-border kit, texture generators, a retro documentation layout, suited pixel figures — with orders to review each one meticulously, integrate selectively and app-wide, and jam nothing. The review's full rulings live in `PIXELPASS-PLAN.md`; the thesis it produced completes the doctrine:

**Paper is read; plate is pressed.** Paperwork (cards, slips, waybills) stays typographic, perforated, dither-grained, casting the diagonal desk shadow. Everything interactive became a **plate**: its border is four side-slabs of box-shadow — which leaves the corner texels empty, the notch that reads "pixel" — its face sits raised on an extruded base, and pressing it drives the face *straight down* onto that base. One geometry, unchanged inks, applied to every button, mini-button, tab, prompt chip, key chip, build-bar cell. Values live in **grooves** (the same side-slabs plus a sunken bevel): every meter, needs bar, load bar, the rebuilt pixel slider, the new stamped checkbox. Every sheet announces itself from a riveted **nameplate**. The last chrome curve (`.k`'s border-radius) died; meter gradients flattened to two-step banded fills.

What each reviewed asset became, and where (adopt / adapt / reject, per the plan):

- **The push-button (third variant, the one that presses)** → the plate standard above, and the **[E] keycap in the world**: a pixel keycap beside the walker whenever E would do something, a bone arrow stepping down at it — and when the real E goes down, the drawn key goes down with it, glyph gone gold. Screen-space, integer texels, hidden in modals, QTE, struggle, cinematics. The bottom-left prompt list stays.
- **Animated pixel hearts** → health, exactly as directed: five hearts of twenty, half-heart steps, brick rust from the family palette. The last live heart beats, faster as it empties; damage knocks the row and flashes bone; bleeding is a slow texel of blood dripping from the last heart. Stamina, food and warmth stay meters — wounds are counted, flows are watched.
- **The CRT overlay font** → a full authored 5×7 display alphabet (grown from the wordmark letterforms — no third-party font crossed the border) behind `Render.crtTitle`: near-fullscreen white type burning through a dark band, scanlines, mains flicker, a roll-in tear. **Four doors only**: a station joining the wire, field promotions, first greyfall, first sight of the Kept. Chain callouts keep the mid-tier slam; headings never touch this face.
- **The retro documentation layout** → the map became the **Survey Sheet**: nameplate title bar, a docked left rail (legend, a live "THE WALK" readout, field options), a footer strip of keycap hints. And the QOL it houses: **the world no longer freezes under the open map** — `[ ] Pause Movement on Map` (browser-persistent, default off) restores the old behaviour for planners; a QTE or wraith grab tears the sheet away so you see what has you. Results slip gained the doc footer ("FILE UNDER · DELIVERED").
- **The pixel folder (folder only, as directed)** → the terminal's file-cabinet completed: closed folder on every shelf tab, open folder on the active one, a two-step pop on switch.
- **The block-texture generator** → **crate chips**: 12-texel planked crates stencil-banded per goods, cached as data-URIs, shown wherever cargo is physically handled (pack, companion carry, hand-over columns). Waybills stay typographic — paper is read.
- **The stone-wall generator (one variant, world-accurate)** → ruins: seeded courses of cut stone, light edge per block, dark mortar, a crown the years have bitten off, fallen blocks in the grass — replacing four loose grey rects. The same pass squared the surviving world curves it exposed: cairns restacked from slabs, cart and caravan wheels cut square, the zip wire and chute cord sagging in straight runs.
- **The D20 (die only, background stripped)** → the one place rolling happens: a 12-texel die tumbling three faces on "Roll a stranger" and "reroll". No dice mechanic was invented to justify a prop.
- **The suited pixel figures (black suits → leather brown)** → adapted, not transplanted: **Mara Voss's personnel photo** on the briefing — a 24×26 authored bust, leather-brown greatcoat, bone shirt, one gold pin the Order supposedly ran out of, in a bone photo frame captioned M. VOSS · HAVEN.
- **The night-sky scene** → rejected, with reasons on file: the title screen already runs the living valley — a real night in our own quantized light beats a recolored static one, and scenery does not belong on paperwork.

A latent race surfaced by the new timing (a deferred terminal refresh landing after the sheet closed) got its guard. Verification grew a twelfth suite (`tests/pixelpass.mjs`, 21 checks): Mara's palette counted on her canvas, the die confined to its two buttons, plate/groove/nameplate computed styles, square-cut chips, movement measured under the open sheet (walked with WASD, frozen by the toggle, the preference round-tripping the browser store), the grab tearing the sheet away, the keycap shown/pressed/released against real key events, hearts counted at 100/50/10 through the damage flash, the CRT voice burning white through its band and then going silent, first-greyfall firing once and never twice, folder states differing by tab, and the Survey Sheet's anatomy. 262 checks green across twelve suites.

## v3.12 — THE BUILDS: the player's trophies get station-grade art, and the doctrine closes

The honest note at the end of v3.11 named the debt: the player's own structures — the physical record of their progression — were still wireframes and quadratic domes next to authored stations. A progression game whose trophies are its worst art has its priorities inverted. v3.12 closes that, and with it the last open edges of the doctrine:

- **Every build is an authored sprite.** Generator (stone base, dynamo drum with a lumen window, a texel lamp breathing under dithered glow), shelter (timber A-frame, ridge highlight, dark doorway), watchtower (lattice legs, X-braces, railed platform, blinking lumen lamp), zip pylon (post, cross-arm, wheel) — row-string sprites in the timber palette, baked once per (type, echo, damage), drawn nearest on the texel grid. Echo builds remap to the lumen palette; **damage bites texels out of the sprite** and pulls planks from the bridge deck. Bridges became real decking — dark under-bed, walked-dull planks laid one by one, bone rope rails, end posts — and the zip rider is a hanging figure, not a marble.
- **Auras stopped being stroked circles.** A build's reach is a stitched hem of dots at its edge — baked once per radius — that only fades in while the walker is inside it: the ground tells you when you are in a build's care, and says nothing when the information is not yours to need.
- **The doctrine's circle is a ring of dots; its reticle is four brackets.** One `dotRing` draws every pulse that used to be a stroked arc — the connect cinematic's marching coastline, flare and build rings, scrapper-shock bursts, the supply-drop pulse. One `drawBrackets` replaces every targeting circle — the click-to-walk marker, the brace indicator, the Guide's beacon (its gradient shaft now a dithered column baked per ink). Beacon flames are stacked breathing texels; the scrapper's hunting headlamp is a checkered fan of dots; wraith-grave eyes are square. `cx.arc`, `quadraticCurveTo`, and `createLinearGradient` counts in the renderer: **zero** (one radial gradient survives — the screen vignette, which is the camera, not the world).
- **The Order's last paperwork is filed.** Death is a **CERTIFICATE OF PASSAGE** — dispatch stamp, greyscale file photo in a bone frame, TAKEN BY field, the record in ledger lines, filed under THE ROLL OF THE ORDER. Skills are a stamped **SERVICE RECORD** with the porter's photo; the help sheet is **FM-1 · PROPERTY OF THE ORDER**; chargen is the **ENLISTMENT** form, its portrait stapled square. The chrome's survivors joined the law: the steady-QTE timer drains around a square, moodles are square chips, the grade's stamp ghost is a stamp edge, and the last border-radius died.

Verification grew a thirteenth suite (`tests/builds.mjs`, 12 checks): the no-curve law asserted at the **source level** (arc/quadratic/linear-gradient counts equal zero, exactly one radial for the vignette), all four sprites bake at their authored dimensions, a seven-structure camp with a strung wire renders live without error, the certificate/service-record/manual/enlistment stamps all present, and the square steady-timer still reads progress. 274 checks green across thirteen suites.

## v3.13 — LIGHT BEHAVES (a retraction, then the fix)

The verdict: every light in the game was a checkered yellow circle, and at night the player just follows one around. **Correct, and the doc's own earlier claims about "dithered glow shells" were dressing on that failure.** Measured on the shipped build: the old lantern raised the ground brightness around the walker by a factor of **0.96 — that is, not at all.** The additive dot-discs painted gold OVER the world and lit NOTHING. The one part that was real light — the baked field that repaints terrain by palette band — only ever covered stations.

The fix is architectural, not cosmetic. Everything dark is now a **layer**: the night palette, and the quiet's grey dim (the day field was split — its warm bands are paint, drawn straight to the ground and never touched; its dim bands joined the darkness layer). Every local light — the walker's lantern, a generator, a watchtower, a camp fire, the peddler's cart, a lumen bloom, a companion in the dark — **erases banded holes in that layer** on the terrain's own texel grid: a solid heart, two hems of ordered dither, nothing else. What shows through a hole is the ground's real colours. And the law that governs the whole world was finally applied to light itself: **no partial alpha anywhere — a texel of night is either gone or intact, and falloff is carried entirely by dither coverage.** The old glow discs are dead; emitters keep a bloom a few texels wide at the flame itself, nothing on the ground.

Measured after (world-anchored, class-matched meadow, source-instrumented via the darkness layer's own alpha): ground inside the lantern pool is **×7.3 the brightness** of the same meadow 260 u away, reads as green-led terrain with **zero** painted-gold pixels, and the falloff steps 0.05 → 0.60 → 1.00 through the hems. A generator carves the same pool at its camp; by day the lantern clears the grey dim off the ground the walker holds; on station-lit ground there is nothing to punch. `tests/lamps.mjs`, 9 checks.

## v3.14 — THE HAND, DRAWN: the moiré dies, the people are hand-drawn, and DELIVER is a moment

Four more convictions from play, each traced to its mechanism and fixed there:

- **The phasing lines across the world** were the renderer's own arithmetic: the world buffer upscaled ×2.6 — a fraction — so every buffer pixel landed as alternately 2 and 3 screen pixels, and those uneven columns beat against the scrolling texels; a second beat came from terrain texels landing on fractional buffer pixels. Now the upscale is an **exact ×3**, zoom is quantized so a terrain texel is always a whole number of buffer pixels, and the world scrolls in whole pixels. No beat frequencies remain, in any direction, at any speed.
- **The characters were the last un-drawn art** — the old rig drew 1.7-unit texels that fell BETWEEN buffer pixels and antialiased into the "blurry mess"; palette-swapped patches on top of that made it worse. The porter is **redrawn by hand**: a 12×18 hooded figure with an eye in the hood, a real stride, the pack on the back — baked per palette (coat tiers, companions, scrappers) and landing on whole buffer pixels at every zoom, scaling with the world in whole-pixel steps, its tower, lantern and slung tools anchored to its own texels. Every humanoid in the valley now belongs to the same hand as Mara's photo. The TENT and HUT glyphs went through the same door.
- **DELIVER is the reward, and it was being auto-swallowed by a doorway.** Walking into a terminal no longer silently hands everything in. In range of a destination the prompt list leads with a gold **DELIVER** plate; pressing it roots the walker and the crates leave the pack **one by one** — an arc, a thud, one fewer on the back, a small pile by the door — then "RECEIVED — N CRATES", then the slips, then the board. What's still on the pack is announced in one line, and the tower on the walker's back empties crate by crate as the hand-over plays. The station stock-report windows (full pantry = both bays burning, short = one dark, starved = door guttering) were found regressed to static during the refactors and restored in the crisp glyph idiom.
- **Items got faces and one law.** An authored 12-texel icon leads every item title everywhere items are read — crate, ration tin, vial, book, boots, coat, pack-frame, charm, ladder, kit, cog, ingots, relic. **Mission items — order-bound crates, beacon cores, signed lost cargo — are gold, icon and title, always, immune to every setting.** A settings toggle colour-codes the rest for identification (consumables green, gear and utility blue, junk grey); off, they are neutral bone. The vitals reordered to hearts → stamina → load → food; the tab folder appears only on the open drawer and pops once.

Verification: the lamps suite above plus updated checks across the battery (the DELIVER ceremony walked by the screen-reading bot and the keys-only bot, ceremony fast-forward for the state-level suites via `WL.skipHandover` — the same door `skipCine` uses, icon law asserted with computed styles, single-folder law, stock windows full-vs-starved delta): **283 checks green across fourteen suites.**

## v3.15 — LIGHT HAS A BODY: the sources are fixed, not deleted, and the props join the hand

An honest correction of the correction. v3.13 fixed the ground — darkness is punched away, that stays —
but the sources themselves went two wrong ways: several glows were shrunk toward nothing (removal wearing
a fix's clothes), and every lit building still wore a 28-unit-wide full-body Bayer pillar, at noon and at
midnight alike. The research pass went to the people who solved this: Slynyrd's ramp law (hue warms as it
brightens, saturation peaks mid-ramp), saint11's halo and fire tutorials (a light source is an emissive
core plus a few HARD concentric bands; fire is 2–3 authored frames), the pillow-shading warning (light
with no direction reads fake), and Octopath Traveler II, whose HD-2D team calls dynamic day/night lighting
the heart of the look — warm sources against cool ambient dark, tight bloom cores, shafts that belong to
the atmosphere that justifies them.

The corona law replaces the checker: every lamp, flame, bloom and cairn-light now draws a **banded corona**
— a near-white emissive core, two solid hue-warmed bands at stepped alpha, and dither only as a one-texel
stitch at each seam. Full-coverage checker is reserved for the one thing it is for — the unsolid: wraith
bodies and the haze around the Kept keep it under its own name (`ghostBody`). The station pillar is dead;
in its place a **beacon shaft that belongs to the night**: gated to zero by day, at night a narrow column
brightest at the flame, three vertical alpha bands with dithered hems and a one-texel sway, dithering out
at its top. Lit longhouse bays cast **window-spill pools** on the yard after dark — banded trapezoids with
Bayer hems, the pillow-shading cure: light with a direction. Fires are **authored three-frame flames on
logs** — camps and every beacon cage. At night the walker takes a **one-texel rim light** down the lantern
side of the coat, baked from the rig's own edge — the source writing itself on the sprite.

And the prop patchwork joined the hand: authored sprites for the station mast (a timber lattice with a
stone footing and an iron fire-cage — the stroked A-frame retired), metal and ceramic salvage piles, lumen
blooms as two-frame crystal clusters, ground crates (planked, banded by the icon law: gold for signed and
lost cargo, lumen for cores), cairns, the supply drop with its fallen chute, the Peddler's cart with its
hanging lantern, the road paver with its warning stripe, the zip rider, and the Kept — who are now the rig
itself in a ghost palette, standing where they fell, because they were walkers. The scrapper headlamp cone
went from checker-skip to banded falloff with a dithered rim. Zero `.arc(` calls survive in the renderer.

Verification: `tests/glowpass.mjs` (10 checks — the law asserted at source level, the day-column measured
empty and the night shaft measured present AND narrow, prop sprites sampled at their own paint, the fire
caught changing shape between looks) plus the full battery re-run: **293 checks green across fifteen suites.**

## The economy (what a delivery is now)

Every station has a population, three or four **needs** and a few things it **makes**. Stock for each need sits on a 0–100 bar that drains with time (0.035/s × population; the unconnected ration at half rate). A delivered crate adds 28. Stock sets a **mood** — *critical* < 15, *wanting* < 35, *steady* < 65, *thriving* — and mood sets the price: ×2.2 / ×1.5 / ×1.0 / nothing. **A station never posts an order for a need it is thriving on.** The board at any terminal is therefore not a list of templates but a reading of the valley: what *this* station can spare, who among the places you know is short of it, how badly, how far, what the walk asks (wading, scrappers, deep grey, steep, or "river — needs a crossing"), and what your pack will weigh after you say yes. Several crates landed in one trip pay a rising chain bonus (+15% per further stop, capped ×1.6), so the load is a plan, not a pick.

The opening is true to the fiction: Elm Farm is out of medicine (8), Haven is eating its reserves (31), the Mill is hungry (18), the Greenhouse is nearly out of seed. Haven makes tools and textiles; Elm grows food and seed; the Greenhouse grows medicine and filters; the Mill makes parts and tools; the Quarry tools; Relay Hill lumen cells; the Foundry coolant and parts; the Pharos makes nothing and needs everything.

**The wire.** When a station is connected, what its connected neighbours make flows to it on its own (0.06/s per feeding maker) — more than its people consume, so a connected pair sustains itself and its stock climbs to full. A **paved road** between two stations multiplies that flow (×1.6 partial, ×2.2 complete); a **chartered route porter** adds ×1 more. The player is told this the first time it happens ("Haven is being fed by the wire now — Elm Farm sends what they can on their own") and the connection cinematic names who will feed whom. The consequence is the shape of the whole game: **the connected core saturates and stops posting; the frontier is where the crates are needed.** The wire pushes the player outward; roads and porters are how the player makes the core self-sufficient behind them.

**Neglect.** A connected station critical on a need that a *known* maker could supply **dims** (its light radius shrinks by a quarter, so the safe ground shrinks). If the wire is not already closing that shortage (no connected maker), four minutes of it costs a **star** — "people are leaving" — and with no stars left the station **goes quiet**: off the wire, light out, and every lit terminal posts a *Relight X* core order. Shortages of goods nobody you know makes are rationed, not held against you.

**Letters** go everywhere people are — light, half pay, and each one read aloud on delivery (24 lines from the valley). A place's mailbag refills only every ~5–8 minutes once carried off; they are proof, not income. **Crises** (events after three stations are lit) empty a station's best-stocked need in one stroke. A **day** is 8 minutes; the last 40% is night: wraiths wake in thinner mist, the cold bites harder, a veil settles on the screen, and the HUD says so.

**Skill verbs** (the character layer inside the loop): Rigging 2 lays a *field ladder* from 8 scrap when none is packed; Hearthcraft 2 cooks a warm meal anywhere; Salvage 2 (or a Scavenger) pings scrap and lumen on the compass.

## The light is the screen (v3.1)

The theme selection promised one thing above all: *"network % is not a number on a screen — it is the screen."* v3.0 shipped the mechanics of light (safety, regen, pacification, coverage) with the picture missing — a 55% dark veil over already-dark art and a warm glow at an effective 4% opacity, tuned to protect the terrain art instead of serving the design sentence. The failure mechanism is recorded here because it is the project's recurring one: every mechanical claim had a bot, the pixel claim had none, so it got no pressure.

v3.1 regrades the world and pins it with measurements (`tests/light.mjs`, sampling the composited canvas):

- **Grey land** sits under a cold blue-dark veil (62% + mist) — dark, not black; terrain stays faintly readable and the porter's own lantern carries them.
- **Lit land** burns the veil off entirely and takes a warm gold wash. Measured on the same meadow class: lit ground is **×2.6 the brightness** of grey ground by day, 30 points warmer in r−b.
- **The boundary** carries a golden rim (a measured warm bump above the inside→beyond blend line) at exactly the light level wraiths cannot stand — a hunting wraith crossing it burns away within a second, and the first burn teaches the rule on screen.
- **Night** is a veil the waylight burns holes in (destination-out by the light field): lit ground keeps ~96% of its day face while the grey drowns — the lit/grey ratio grows to **×3.2**. Crossing your own network at night reads as islands of day.
- **The map** draws the same overlay, so territory reclaimed is territory brightened: +19% whole-map luminance at 14% coverage, scaling with the network. Connecting a station repaints both the field and the map in the cinematic's expanding ring.

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

293 automated Playwright checks green, console clean, frame time 16.6 ms, across fifteen suites — the twelfth the pixel pass, the thirteenth the builds pass, the fourteenth the lamps pass, the fifteenth the glow pass above — all rerun against the v3.6 light field (the light suite's pixel measurements — lit/grey luma and warmth ratios, the boundary rim, night punch-through, map growth — hold on the quantized palette bands) — including **the feel suite** (31: the Roll on the title screen, rotating taglines, a cheat typed end-to-end onto the record, the coat in the intro, Dispatch chain callouts and field promotions, scrapper trash talk, keeper voices on the results screen, panel clicks never move the Walker, two-click hand-over, companion interception, strung routes in world and map, keeper voices by state, barks, no DS vocabulary anywhere a player reads) — including **the light, measured in pixels** (10: lit/grey brightness and warmth ratios on matched terrain, the boundary rim, whole-map brightening with coverage, night punch-through, wraith burn and its tutorial) — the other seven: the delivery loop and network progression (33), the character-layer systems (35), the keys-and-clicks player-fidelity run (31), the **screen-reading first walk** (24), the **mouse-only run** (18), the **economy dynamics** (24: needs and moods set boards and pay, stock fills and drains, the wire flows and is multiplied by roads and porters, dimming, star loss, going quiet and relighting, chain bonuses, letters, crises, night, skill verbs, save migration), and the **v3 loop rules** (14: the lost-crate Guide/compass/tray chain, pickup recovery, stash tracking, giving up, companion hand-over, thriving suppression, letter scarcity, camp-skirting loaded routes, the wire's star-loss exemption, best-stock crises, honest stall handling, the wire cinematic) — plus the 30-game-minute balance session above.

## Future-work candidates

Touch controls; a suggested-route line on the map; NPC route events; relationships between waylighters; gear durability with Mending repairs; a second procedural valley after the Pharos; stock visible from the field (a bar over the station when near).
