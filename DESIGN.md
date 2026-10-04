# WAYLIGHT — Shipped Design Doc (v3.52 · LEDGERLIGHT · Within Reach)

Playable build: **https://claude.ai/code/artifact/9ed799db-2103-4667-b424-0de78dce88c5** (single-file HTML5, canvas, ~33,800 lines, no libraries; three save slots in localStorage per browser, carried anywhere as save codes; v1/v2 saves migrate and are seeded with stock). Future sessions: republish to this URL via the Artifact tool's `url` parameter (read the live version first — the tool requires it). Source parts live in the session workspace at `waylight/src/*` assembled by `build.py`; that workspace is ephemeral — the artifact is the durable copy. Companion docs: `research-death-stranding-delivery-mechanics.md`, `research-loop-psychology.md`, `research-zomboid-permadeath.md`, `game-approaches.md`, `waylight-expansion-design.md`.

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

## v3.6 — one law: no alpha in the world. Light is palette; transparency is dither.

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
caught changing shape between looks) plus the full battery re-run: **293 checks green across fifteen suites** (at v3.15; the battery has since grown).

## v3.16 — THE POST: letters stop being filler and become the Order itself

The verdict: letters repeated city-to-city forever and read as broke-insurance — a repeatable floor
wearing filler's clothes. The floor stays (there must always be repeat work); the filler dies, by
building the floor into four interlocking systems. Genre grounding: RimWorld's skills grow per unit
time worked, multiplied by passion — our callings — with rising level costs and redundancy as strategy;
Vagrus gates one-time prizes and persistent boons behind reputation tiers, with the biggest earned, not
accrued. Adopted whole.

**1 · The service rule.** Letters and dispatches take **no fee — ever**. Zero trust moves; the grade
still stamps (professional pride costs nothing). Every other crate is luxury, and luxury pays. The
service pays in the two things trust cannot buy: **porter skill by tier** (+14/+20/+26 Footwork, long
walks add Endurance, the grey walk adds Lumenistry) and **appreciation**. The results screen has a
service slip of its own: "Fee taken — NONE — Waylighters carry the mail", the read-aloud letter, and
the town's thanks counted in laurels, not diamonds.

**2 · The mailbag and its tiers.** Each station's outbound bag fills as the town writes (~0.11/s; a
Letter runner on the post more than doubles it). One bagful posts a run, two post a second, a brimming
bag posts the third — accepting drains 35. The WALK sets the tier, measured on the route the feet would
take: **LOCAL POST** (near, safe), **LONG POST** (far, or scrapper ground), **GREY POST** (deep grey en
route, or a dimmed/quiet destination). Tier sets the XP and the appreciation. Below one bagful nothing
posts: the mail is never fake.

**3 · Appreciation** — each town's own ladder, parallel to trust and stars, shown beside them
(KNOWN 40 · TRUSTED 100 · HONOURED 180 · BELOVED 280). The boons are things money is not: a warm meal
pressed into your hands when you arrive hungry; the town's children running your mailbags to the gate
(letters from there weigh nothing) and locals pointing out salvage; the **rider's dispatch** — a quest,
not an accrual — which swears the militia to you; and at BELOVED the town lamp and volunteer wages.

**4 · The militia.** Carry the riders' own dispatch and from then on an attack — a scrapper landing a
hit, a wraith's grab — brings **two riders at the gallop** from the nearest sworn town: authored
horse-and-rider sprites, dust, a spoken line, scrappers flung and cowed, wraiths burned by lantern-light,
your struggle broken. Then they leave. Five minutes between calls; when the Grey is thick a rider falls,
and rides home across a saddle. It clears the CHASE, never the camp — the militia is a boon, not a
trivializer.

**5 · The city post — hire, train, manage.** Six mailroom jobs, all letters, each training a different
verb: Letter runner (Footwork, fills the bag), Parcel rounds (Hauling), Tower courier (Climbing), Night
post (Lumenistry, extra appreciation), Hearth post (Hearthcraft), Sort & mend (Mending). A shift is 90
seconds: one provision out in wages (BELOVED towns volunteer), calling-multiplied XP in, appreciation up.
No provisions — the round stalls, honestly, until paid. Two desks per station, a third at TRUSTED. And
the point of it all: **staff are the same waylighters you field.** Train Hauling in the mailroom and the
same hire carries +6 kg beside you on the road tomorrow — the city is the training ground, the road is
the exam, and the road stays faster for the skills it teaches. Managed from the new **Post tab** (bag,
ladder, militia status, staff with per-skill progress) and the Waylighters roster.

Also in this pass: the wraith-line coastline is gradient-normalized — a fixed-width stitched LINE on the
ground (~3 texels) however shallow the light falloff runs, where a slow gradient used to fatten it into a
forty-unit checker band.

Verification: `tests/post.mjs` (18 checks — bag fill alone vs crewed, pacing thresholds, tier mapping,
zero-fee delivery with tiered appreciation and XP, weightless TRUSTED mailbags, wages/stall/level-up
carrying into field capacity, desk caps, the HONOURED-gated dispatch, the sworn rescue with cooldown,
save round-trip) plus the re-anchored shoreline check and the full battery: **311 checks green across
sixteen suites.**

## v3.17 — THE ROAD HAS MORE THAN ONE SPEED: attainable, alive, and taught in a line

The verdict: go-here-go-here is not a loop; prices read as fantasies; companions read as bags; the
player looked like the only person alive; mechanics arrived over hours instead of in a line. Fixed at
each mechanism:

**Reset vs. New Waylighter, finally honest.** The title menu gains **Reset the Valley** behind a
confirm that spells out what burns (stations, roads, appreciation, the Roll — everything) and that it
is NOT the New Waylighter button. And New Waylighter itself now means what it says: with a save
present it retires the current walker to the Roll — "hung up the coat" — racks their cargo in Haven's
lockers, and opens char-gen over the SAME valley; network, roads and reputation kept. Only the
confirmed reset unmakes the world.

**The price of things, re-laddered.** Hire fees halved (16+3/skill metal). Kit 16 metal, ladder 8,
flare 6 lumen. Generator 28, bridge 48, shelter 26, watchtower 18, zipline 30+8. Every road segment
cut ~a third (Elm Road 48+28). Gear cut 35-40% top to bottom — Exo Frame I is 70 metal now, and the
20-game-minute greedy bot banks **90 metal / 143 ceramic / 58 provisions** in one sitting, connects six
stations, and dies zero times: the ladder's every rung is inside a session's reach. Donations and
salvage yields rose to match (quarry 6+5★ metal, piles 12-20).

**The post horse — movement diversity, introduced early and honestly.** Accepting *Light for the Mill*
(minute ~2 of the taught line) puts you in the saddle of Mara's loaner: ×1.75 speed, the horse spends
its own legs (zero stamina drain), no wobble — and real limits: it balks at water and crossings (you
lead it off and walk), scrappers spook it into bolting, it comes back when the trouble is done. The
Mill delivered, the loaner trots home and a day's ride rents for 4 provisions at any lit terminal (R).
Walk → horse → roads → zipline is now a visible speed ladder from the first session.

**The valley is not just you.** Ambient waylighters — generated, named, packs stacked on their backs —
are always on runs of their own, along paved roads when they exist, greeting you as they pass. Lit
station yards keep two townsfolk pottering among the crates. Companions grew hands and a voice:
they pick up your dropped crates and stow them ("Got it."), speak to the ground you're crossing, and
**train while walking with you** — the road is a slower mailroom, feeding the same Balance and Hauling
the post trains, so the training loop and the field are one loop.

**Wants visible from the bottom rung.** The Fabricate board now lists tomorrow's gear LOCKED with its
condition on the plate (EXO FRAME I · ★ Foundry) instead of hiding it; the Post tab already shows the
appreciation ladder the same way. Leaving a yard with a fresh load gets its send-off — a spoken line
and THE RUN plate (crates · kg · destinations) — so a run begins with a moment, not a transition.

Verification: `tests/progression.mjs` (18 checks — the confirm's exact copy, price rails, the loaner
grant and its retirement, ride ratio ×1.78 measured, water dismount, spook, the rental charge, ambient
walkers advancing, companion pickup and field-training, locked rows refusing to print, the send-off
firing once, New-Waylighter-keeps-the-valley walked through a real reload, reset actually burning) plus
the full battery and the 20-minute balance session: **329 checks green across seventeen suites.**

## v3.18 — THE SHAPES OF WORK (the same walk, different questions)

The mid-game's remaining debt was order variety: past the taught line, every contract was
point-to-point — go here, go here, go here. v3.18 adds three order **shapes**, unlocked the moment
the Greenhouse joins the wire (four towns changes the questions; announced with NEW SHAPES OF WORK,
explained in a mail, backfilled quietly into old saves). Each shape asks a different skill of the
same walk, and each is a distinct card with its own tag on the board.

**CIRCUIT — one contract, many doors.** A ★★ station with three known neighbours posts a 2-3 leg
chain through the towns that want what it makes, nearest-neighbour ordered. **Every leg's crates
load at accept** — 60 kg all at once is a normal signing, so the pack is the puzzle before the boots
move (the pack-as-puzzle debt, landed). Doors open in order: the tray reads *door 1 of 3*, a middle
door takes its crates with the full hand-over ceremony, fills the town's stock, toasts LEG n/N —
ONWARD and hands you no slip — the ledger waits. The last door grades the whole contract: par over
the summed chain, condition averaged across every door, total kg carried, **×1.35** — and the slip's
route line names every door. Abandoning a circuit turns each remaining leg's crates into lost cargo
bound for its *own* door.

**CONVOY — the cargo is a person.** A junior walker of the Order (generated, named, skills capped
at 2 — that is the point) needs the road walked to a connected town the pathfinder can actually
find. Their pace caps yours: drift past 220 units and they stop and call out — the horse learns
patience. Scrappers inside camp ground go for **their** crates first (the softer mark): a catch
knocks a gold crate loose that you recover off the ground and hand back at their side. A wraith
within 260 of them in mist **freezes them mid-stride** (checker haze, FROZEN label, the tray says
go to them) until your lantern stands within 60. Arrival counts only when you BOTH stand at the
gate: luxury pay (letters stay the only service), +10 appreciation to the town that asked, CONVOY
THROUGH from the Dispatch — and the walker joins the destination's fire pool, hireable, already
road-trained (+26 Footwork): the convoy is a talent pipeline, not an escort minigame.

**SALVAGE — grey work is paid work.** A town short of something (worst stock under 70) posts its
top shortage by name; a wreck — tipped cart, fallen planks, two gold crates in the checker — stands
900-1400 units out where mistBase exceeds 0.5, drawn while the run holds it, labeled THE WRECK.
Walk out empty (the Guide aims at the site), E loads 2-3 *Salvaged* crates — 11-17 kg each,
55-80% condition, honest about their history — then walk it home. The slip pays **×1.6** on top of
the shortage multiplier, and condition grades **against what the wreck gave**, not the factory:
bring them back no worse and the stars are full.

All three survive save → reload mid-shape (a circuit at door 2, a convoy at 2/3 crates), the session
bot weighs circuits like a porter and leaves escorts to walkers, and the Guide arbitrates: a frozen
or left-behind convoy outranks the arrow's usual habits.

Verification: `tests/shapes.mjs` (19 checks — the lock before the Greenhouse, the unlock mail, circuit
posting/all-crates-at-accept/in-order doors/middle-door-no-slip/final ×1.35/abandon-per-door, convoy
posting/follow/lag-stop/knock-drop/hand-back/freeze-unfreeze/arrive-together, salvage naming/site-in-
the-grey/battered-gold-loot/×1.6-against-the-wreck, save/reload mid-shape, zero page errors) plus the
full battery: **536 checks green across twenty-eight suites.**

## The body remembers (v3.19 — the pack authored, the weather interactive, the pushback earned)

The post-testing verdict was about the BODY: what it carries, what lands on it, what it has learned.

**The pack is authored.** Every kind of thing on a back has its own glyph, stamped in texels on the
tower: the medicine crossed white, tins ribbed steel, bales soft-cornered, seed sacks tied, drums
stamped (coolant blue, filter teal), lumen cells with a lit cyan window, the mail in its satchel, the
core aglow, ingots and slabs as themselves — and every small thing rolls into one duffel at the base.
THE LAW extends to the new pack: order-bound cargo wears the gold band, on every glyph (a band row is
injected where the shape had none). The frame the walker EQUIPPED is drawn holding the load — the wide
pack's timber rails, the courier rig's strap and gold band, the exo's steel struts with lit nodes —
and the coat and boots they bought recolour the rig's own texels over rank's coat (the attachment-swap
law from the pixel-systems research: same rig, new cluster palette).

**Alive is interaction** — the MIVIM law, two canon proofs, zero effect-spam. Leaf gusts (capped at
14, meadow and forest, never in snowfall) put leaves in MOTION: one whose path crosses the walker
deflects off the coat, or sticks a beat and drops, or passes clean behind — and one that misses NEVER
bends its line. In the deep north greyfall falls as FLAKES, not more raindrops, and it lands: snow
piles on the hood, then the shoulders, then the full cap — by how hard it falls and how still the
body is (a working body sheds most of it; warmth and shelter melt it) — drawn in rig-texel space,
riding the pack's top crate too, saved with the porter.

**Nothing plops down blind.** Choosing a build hangs its BLUEPRINT: a half-there ghost at the cursor
(or ahead of the walker), honest about validity and why — BAD FOOTING, NEEDS WAYLIGHT, MATERIALS
SHORT, ANOTHER STANDS RIGHT THERE. Ladders and bridges seek their crossing around the aim and hang
at the exact pose they will take. Click or E lays it precisely there; Esc, B or right-click folds it
away un-spent; a click far past an invalid ghost is a walk order — placement never traps the mouse.
And built things stay the PLAYER'S: V re-hangs an owned structure as a free blueprint and re-seats it
exactly (sources refreshed, ziplines relinked); X takes it down — a ladder folds back onto the pack,
a structure hands back 60% of its metal.

**The wobble is earned pushback, not a minigame** — this is an AUTOMATION game: the porter builds a
kit and a body to automate the chain they planned. Calm ground at a sane load (≤62%) never wobbles at
all. Rough ground has a Balance level that walks it clean — scree 4, rock 2, snowfield 4, marsh 3,
shallows 5 — and a body at that level auto-steadies: a breath of stamina, no ring, walk on. The ring
is reserved for beyond-the-kit: overloaded, or untrained on rough country. A failed ring still costs
(the stumble, the dropped crate) but NEVER cancels the strung route — the chain finishes itself.

**The valley keeps walking when you switch away** — by choice. A pause-sheet toggle ("keep walking
when you switch away") lets long trips run while the window is hidden: a 250ms background clock steps
the sim, saves as it goes, and hands back to the render loop cleanly on return. Hidden windows always
auto-steady — a ring nobody sees must never hang the walk. Blur with the toggle off still pauses, the
old promise kept.

**Alive is never a burden.** A convoy junior stuck past a river — or stopped too long calling "can't
keep your pace" — finds the crossing you found and appears at your back within a few breaths. A
companion left three hundred units behind catches up on their own. The wraith-freeze stays (that is
drama, and your lantern is the answer); the pathfinding chore does not.

Verification: `tests/body.mjs` (30 checks — six glyphs distinct + the gold band law, cell window and
med cross measured in canvas pixels, worn boots/coat on the rig's texels, exo struts drawn, the leaf
three-way split + the never-bends law + the sparse cap, snow accumulate/shed/melt + flakes-not-rain at
the settled camera + the cap drawn on the hood, blueprint valid/refuse-with-why/exact-lay/keyboard-
aim/cancel-unspent, move-for-free + dismantle refund + ladder fold-back, escort suck-to-back +
companion catch-up, zero rings on mastered meadow + Balance-6 scree + overload keeps teeth + stumble-
survives-chain, the toggle off-by-default + hidden-window walking + no hidden rings, save strips the
ghost and keeps the snow) plus the full battery below.

## The working world (v3.20 — traffic writes the land, crews work it, every coin is seen)

**Living paths.** Every completed delivery and every route-charter run is FEET: the walked line
between the two towns wears in — trampled grass, then bare earth — whatever route the player took.
The player's own steps stay the accelerant, the stages are permanent (grass needs human intervention
to return), the tread spreads, and bare trail walks faster. Pathfinding costs prefer worn and paved
ground, so the player's click-routes and every walker of the Order fall onto the paths the world
made: the land itself becomes the map of how the valley moves.

**The tier ladder.** A bare trail can be IMPROVED, underfoot, with P: scrap plates (3 metal), then
cobbles (3 ceramic), then a wood way (3 timber) — each tier its own authored paint (riveted steel,
bright-set stones, warm plank rows), its own speed, wobble-free like a road, flat even over marsh
(the boardwalk law), and permanent: laid ground is finished ground and never repaints as dirt.

**Field crews.** From a terminal's Waylighters tab, the same pooled people go OUT (three per town, a
provision a round, stalled honest when unpaid): the PATH PRESSER walks the line until the ground
agrees; the MASON lays cobble along it, a slab a stretch; the FORRESTER walks to standing wood and
fells it — the map itself changes, stump by stump, timber to the bank, "the near woods are CLEARED"
when done; the HAULER walks real freight onto the far end's worst shelf, and a back grown to
Hauling 5 becomes the DONKEY CARAVAN — thirty crates behind a patient grey donkey, drawn where it
walks. All of them are visible in the world with their job on a label, and all of it survives the
save.

**The LOOTER habit (earned).** A companion trained to Hauling 2 sweeps ground cargo that enters the
player's sight — reach grows with every level — stows it, and falls back in line. QOL that is
BOUGHT with training, not given.

**The earn feed.** Every currency lands as a SEEN, animated chip beside the trust readout: the
Order's gold diamond for trust, a hearth-heart carrying the town's name for appreciation, the banded
crate for materials — bursts merge into one chip that counts up, bumps, and fades. The Renegade
bandana already has its seat for the karma ledger. Nobody wonders whether they just earned something
again.

Verification: `tests/working.mjs` (17 checks — traffic wears the delivery line and the charter line,
green grass refuses plates / bare trail takes them / tiers only climb / the way walks faster, presser
walks-and-wears, mason cobbles and drains ceramic, forrester turns forest to meadow and banks timber,
hauler stocks the far shelf and earns the caravan at Hauling 5, the three-hand cap and recall, the
earned looter sweep, chips merge-count-animate per currency, pave and fell ride the save and reload)
plus the full battery below.

## The builds earn their ground (v3.21 — upgrade ladders, towers that act, the room, the box)

"I only use ladders" was the verdict, and a chase once ran straight through a stronghold that did
nothing. Now the network acts.

**Every standing build has a ladder to climb** (U, beside it): the generator's Twin burner grows the
aura a third and pours stamina back, and its Hearth housing HEALS whoever rests by the fire; the
watchtower raises The horn, then the Armed post; the shelter opens The room, then makes The bed; the
zipline greases its line (×1.35 flight), then cradles it (+300 reach — far pylons come into range).
First upgrades are cheap and useful; the last asks for real work — the bed wants timber, and timber
wants a forrester. Gold pips on the base wear the rank.

**The towers fight back.** A scrapper chasing you under a horn tower's watch is CALLED OUT — "THE
TOWER SEES YOU" — and slowed to two-thirds pace; an armed post knocks a runner sprawling as it
passes beneath. Cover you built is cover that acts.

**The room.** A tier-2 shelter is enterable: step in and the walker rests unseen behind a lit
doorway — nothing with claws or made of grey can follow, stamina pours back, and the tier-3 bed
closes wounds and mends battered cargo while you breathe. Any step is a step out.

**The PO Box** (6 metal): stash the loose load on the road — mission crates stay on your back, THE
LAW — take it back later, or leave it for the walkers: donated hand tools ARM a waylighter, the
rest earns regard.

**Donation you can SEE.** Every crate of hand tools given — at the donate desk or through the box —
arms one walker at that town, counted aloud. At ten, the town says so out loud: the announce, a
letter, the town's regard — and an ARMED WATCH walks the yard's edge with lamps while the camps
nearby shrink their claim and slow their feet. The road is measurably safer, and everyone knows
whose tools did it.

Verification: `tests/ground.mjs` (15 checks — two earned tiers then finished, the grown aura, the
healing hearth, paid-for upgrades refused broke, the horn call and the post knock, ten-armed camp
shrinkage measured by chase-closure before/after, the letter and the regard, no-door-then-door, the
grab-proof rest, the healing bed and step-out, the box's stash/law/take/donate cycle, the cradled
line linking 1850 units, tiers/box/armed riding the save and reload) plus the full battery below.

## Karma & the Republic (v3.22 — two coins, the quiet work, and the mountain come down)

**The karma ledger** holds two currencies, and neither is the mirror of the other — the Han Solo
law, built the way CK3 builds loved-and-feared. APPRECIATION is what the towns hold of you.
RENEGADE is what the road knows you are willing to do: a global name that only grows — Clean Hands,
Grey Hand, Road's Own, Free Walker — landing as its own bandana-marked chip, read in the character
sheet under a heading that says it plainly: NOT GOOD AND BAD. TWO COINS, BOTH YOURS.

**The quiet work.** Elm's far lean-to offers two crates of highleaf smokes in OUTLAW GREEN — the
contra band, never the Order's gold — for a rotating buyer, and the risk is a number you can read:
an armed watch has eyes (+20%), daylight tells (+15%), night is kind (−10%), and a known grey hand
slips easier. Passed CLEAN it pays three ways at once — trust, renegade, and the buyer's
appreciation RISES, because the town wanted them — and the yard shows it: loungers on the steps,
embers, a lazy ribbon of smoke for ten minutes. CAUGHT, the crates are ash and HEAT lands at that
town alone (Bannerlord's per-territory lesson): a colder keeper, a mark in the ledger — which cools
with time, or is settled at the terminal for coin. After the first clean pass the fixer posts THE
SKIM — a counting-room cutpurse job at a named town, same equation, heavier fall.

**The road's respect is SEEN.** At Road's Own with no mission gold on the back, raider camps keep a
fifteen-percent shorter claim and their shouts change — "Road's own. Eyes forward, boys." Put the
Order's gold on your back and business is business again.

**The Republic of Connection.** At fifteen percent coverage — or the moment the road first learns
your name — the mountain takes notice: the banner, and the founding letter. Two peoples, one wire:
the WAYLIGHTERS — connection, warmth, love, loyalty, trust — and the FARKEEPERS, the larger,
fiercely loyal mountain folk who came down when the Waylighters fed the Farlands famine; ancient
men hardened by a climate neither man nor beast could face, NOT giants. The lore correction lands
everywhere at once: every rider who ever answered your horn was a FARKEEPER rider, in every line
the player reads. And Farkeeper WARDS join the fires — named, drawn a head taller and a hand wider
in iron and pale, hired as companions who meet trouble first and hit like the mountain.

**Eight factions, each with a culture and a palette** — the Republic's two, the live Raiders, the
shoot-on-sight Reapers and Hollow Fires, and the seeded Unlit, Flame Keepers and Iron Giants behind
the door the roadmap leaves open. **Five horse breeds** with stats where their real strengths are —
the Fjord stands its ground when scrappers hit, the Arabian measurably outruns everything and
spooks at shadows, the Percheron was born to carry — and every stable keeps its town's horse.

Verification: `tests/karma.mjs` (21 checks — the tiered ledger and its chip, the green-never-gold
crates, the three-way clean pay, the visible smoke, the Republic's arrival, per-town heat on a
caught pass with seizure and mail, settlement and decay, the legible risk equation, the skim, the
measured camp-claim respect and its gold exception, the seeded named wards and their heavy
intercept, the corrected strings, breed data and the measured Arabian, eight cultured factions, the
karma panel, save/reload) plus the full battery below.

## The myth in the flesh (v3.23 — the legend, the micro-cines, THE HANDOFF, the coat that is yours)

The Postman's best beat — the founder walking back into a city that treats him as a myth — carried
through gameplay, never a dialogue screen.

**The legend ladder.** Four tiers off the walker's level: a stranger, SPOKEN OF, THE WALKER, THE
MYTH IN THE FLESH. Lit yards STOP — townsfolk halt mid-stride and face you — and what they say is
CITED FROM THE RECORD: this town's stars, your delivery count, "I lived here UNLIT," the far towns
that know the name. Keepers bend their hellos at tier two. At the top, children run the fences to
keep you in sight and shout about touching the coat. The first yard you enter after a new tier
earns the zoom.

**Micro-cines** are cognitive signals, nothing more: letterbox, ONE slow zoom, the first line —
hard-capped at 2.2 seconds, skippable by any input, the sim never pausing underneath. Important
info announces itself and gets out of the way.

**THE HANDOFF.** Mounted, letters aboard, first approach to a town: a kid runs to the roadside
with the letter held HIGH, and the game spends effects money it has no business having — the world
drops to quarter speed, three camera CUTS land (wide, close, SUPER ZOOM), radial speed lines rake
the frame, the envelope arcs hand to hand, a white flash, a freeze frame stamped THE LETTER RIDES.
Three and a half seconds against the janky low-bit world — the contrast is the joke, and the
craft. Once per town, ever. The town's regard rises and a mother writes you about it.

**The coat is yours.** The enlistment form cuts it: six coats, six trims, the valley's own hoods
and skins, previewed on a LIVE rig. The look walks in-world — identity under rank, rank under
equipped gear — and THE TAILOR at any lit terminal recuts it whenever. The character panel now
stands the walker up: a live paperdoll, four gear slots, one-click wear. Permadeath stings because
the one who falls was YOURS.

**The breath.** From the audited pixel research: the idle now breathes by shading drift alone —
silhouette identical to the texel, interior clusters migrating on an uneven cadence (hold two
seconds, breathe for half of one). Measured in the suite: zero silhouette pixels moved, ten
interior pixels drifted.

Verification: `tests/myth.mjs` (19 checks — the chargen swatch rows and live rig, the look walking
in-world, idle/idle2 differing, the silhouette law by alpha-mask diff, tier climb + record-cited
lines, the capped letterboxed zoom + auto-release + skip, the stopped yard + new-tier zoom + keeper
prefixes, the handoff's wide-cut open at quarter speed, the measured world crawl, cuts to the SUPER
ZOOM with release + regard + the mother's letter, once-per-town + skip, the tailor recut, the
paperdoll and one-click wear, look and once-ledger riding the save while scenes never do) plus the
full battery below.

## The wider world & the production (v3.24 — the Cine engine, THE RIDE, the globe, the party of four)

Four systems shipped as one version, each leaning on what already stood (the standing law).

**The CINE ENGINE (`src/16cb_cine.js`).** The 90s grammar formalized so a scene is a SHOT LIST,
never bespoke camera code — built from the research (`research-90s-directing.md`: The Postman's
slow-mo myth beats and displaced violence; Waterworld/Semler's intimacy-first 27mm). Five moves:
**CUT** (hard reposition, 2%/s drift for life), **PUSH** (the Postman slow zoom), **DOLLY**
(Steadicam lag on a moving subject), **VEER** (the mercy crane — up and away while the SOUND
carries the event), **HOLD** (world frozen, stamp card slammed at −0.06 rad). Slow motion is the
world (`S.timeScale`) while the camera clock runs REAL — scenes stay short. Shot fields: dur/at
(point or fn)/zoom/zoomTo/move/ts/say/fx (speedlines, flash@, shots@ — three muzzle flickers plus
`Snd.sfx.gunshots` — stamp)/on(seq). Any input skips. The screen effects are shared primitives now
(`fxSpeedLines/fxFlash/fxStamp/fxBands` — stepped bands, never a gradient; the handoff rents the
same tools). The engine owns the camera outright while a sequence runs; letterbox and timeScale
restore on end or skip.

**THE RIDE (`16d_myth.js`).** The firing-squad parody, displaced the 90s way. Once ever, on the
first deep-grey push after the legend starts (mist > 0.6, tier ≥ 1, far from towns): a captive
Waylighter kneels before four Reaper cloaks (pale #9aa4ff eyes, one cold staff-lamp pooling light —
the only light out there), a second rider held at the edge, and on the watch ridge Haven's people
with a kid pressed to the front. Six shots: wide CUT ("Reapers. They took two of ours at the
crossing.") → PUSH on the ridge ("THAT'S MY DAD!") → CUT close ("RIDE, WAYLIGHTER! RIIIIIIIDE!!",
the rifles level, the rider BOLTS toward the nearest lit town) → DOLLY with speed lines → VEER up
and away, three gunshots HEARD (distant boom + crack + hills answering; muzzle flickers as faint
sky-flash pulses) → HOLD: "THE MAIL GOT OUT." Aftermath: recon mail, +4 likes, the kid "has not
stopped saying RIDE." Skippable at every beat; `WL.ride()` restages it for tests.

**THE GLOBE (`16e_globe.js`).** The survey sheet grew a second tab: THE VALLEY (texels and paper)
⇄ THE WORLD — a per-pixel shaded PLANET, laughably past the game's station: procedurally baked
equirect maps (murmur-finalizer value-noise fBm continents at 29% land, hypsometric tints, ice
caps, sea-ice fringe), orthographic per-pixel projection with static tables so spinning is cheap
(30 fps sustained), N·L diffuse with a softened terminator, specular sun on the sea, TWO cloud
laws (deck drifting at its own rate, its shadow thrown west), night-side city lights (a world FULL
of people we cannot reach yet), a stepped blue atmosphere rim and halo — and NOT ONE canvas
gradient call (the doctrine's builds check still counts exactly one radial gradient in the whole
build). Drag to turn, idle spin, inertia. Pins are game-UI chunk on top of the smooth planet (the
contrast kept on purpose): THE VALLEY — YOU ARE HERE on a coast, with the regional cargo tally
("N aboard"), plus four UNCHARTED regions (Frostreach, the Salt Flats, Emberfall, Low Marrow) as
`Globe.REGIONS` — {id, name, lon, lat, open, blurb} — the futureproofing for the Frostpunk-style
recon/outpost system.

**The delivery badges.** `Systems.deliverableCounts()` is the ONE truth about the load — mission
crates held per destination door plus lost finds riding home. The classic map draws a crate badge
(the earn feed's own authored 9×9 crate icon) with ×N at every town you hold cargo for — "unload
the most in one place," seen at a glance; the globe aggregates the same counts into the valley
pin's tally.

**THE PARTY OF FOUR (`15b_npc.js`).** Hire up to THREE companions (party cap 3 + the walker):
a staggered wedge with per-member positions (`n.cx/cy`), voices in turns, per-member upkeep,
anti-stuck, one looter-fetcher at a time, and the pack riding whichever back has the most room
(`give()` finds it; `take()` searches all three). Companions can be **mounted**: at any connected
town's stable, rent a saddle for a party member (3 provisions, loaner returns on dismissal/KO) or
buy it outright (12 — theirs for good); a mounted member holds a mounted pace (speed ×2.1). Every
single-companion contract still stands — intercept, steady, struggle bonus (now +12% per extra fed
back), shove — iterating the wedge.

**The party IS the health pool.** Any blow that would drop the walker is taken by a conscious
companion instead: they go down doing it (KO → carried to the nearest lit town, `recoverT` 540 s,
re-hirable fee-free when they wake — "you already paid it in blood"), and the walker stands back
up at 32. Three companions = three quarters; **the player character always falls last (4/4)** —
and the blood-debt dies with the porter (a dead walker's mending companions never rally to a
stranger's rescue).

**The rescue ride.** When the last quarter is spent, the town with the highest appreciation gets
ONE chance to reach you: odds `0.25 + 0.18 × apprLevel` (the riders who come are the riders you
fed), cooldown 1500 s. Success — a 2-shot Cine (CUT on the fallen walker, "RIDERS! Riders out of
HAVEN—" → DOLLY on three banner riders at the gallop, flare flash), the walker stood up at 30,
wraiths within 800 burned off the road, camp runners cooled, and every mending companion RALLIED
back to the saddle; the town is proud (+1 appr) and the mail says "Don't thank us. Deliver."
Failure — the mail says one saddle came home empty, and death is death. Inside the cooldown the
grey keeps what it catches.

**THE TOWN LAW.** No one starves or freezes to death inside walls — within 300 u of any station,
hunger and cold damage are OFF (immediate immunity), and a starving walker gets the mercy meal
(food → 24, once per town per 300 s: "Not in MY yard, walker. Eat."). The wild keeps its teeth —
the same hunger outside the walls drains as before.

**The sound, redesigned (`11_audio.js`).** The rain was radio static with the gain up; now it is
WATER — three layers on one bus (lowpassed wash, band-passed patter breathing on a gust LFO, a
storm rumble that only arrives when it pours), fed RAW intensity with the loudness law living in
Snd. The rain has its own persisted dial (pause sheet slider; zero mutes the weather while every
doorbell stays). The wraith drone — the one sound the scaffolding got right — was kept and taught
to breathe: a third barely-wrong partial and a slow filter swell. The sfx palette was designed,
not defaulted: jittered footfalls (no two alike), quieter hands, warmer accept bell, a low thump
under builds, plus `gunshots()` (distant triple crack with the hills answering) for the VEER.

Verification: `tests/wider.mjs` (27 checks — engine play/cut/hold-stamp/skip, RIDE actors/bolt/
displaced-gunfire/aftermath-once-ever, globe regions/planet-renders/rotation/counts/map-badge,
party hire-cap/wedge/roomiest-back/three-quarters/mend-refusal/player-falls-last, next-porter,
rescue fire/resolve/one-per-debt, town-law inside/outside, rain dial/layered-water) plus the full
battery: **477 checks green across twenty-four suites.**

## The names & the exiles (v3.25 — Waylight is a CITY, the protagonist framed, the Lamplighter, the Society)

**THE NAMES.** Waylight is the CAPITAL — the first dawning of the last light, seat of the REPUBLIC
OF CONNECTION (Waylight + Farkeep, per the karma notes) — so no sheet calls the world by it. The
land under the player's boots is formally THE GREYMARCH (the borderland march of the Grey;
"the valley" stays colloquial), the survey tabs read THE GREYMARCH ⇄ THE KNOWN WORLD, the title
ladder tops out LEGEND OF THE GREYMARCH, and the globe pins the lore's real places: the Greymarch
walked; WAYLIGHT (THE FIRST LIGHT · SEAT OF THE REPUBLIC, glowing from orbit, coastal by law) and
THE FARLANDS (FARKEEP · THE REPUBLIC OF CONNECTION) known across the water; two reaches uncharted
for recon.

**THE CLOAKED TORCH (the protagonist framed in fragments, before the class exists).** Beat one:
cross the deep grey and the next lit yard noticed — "You came out of the grey walking EASY. Where
does a coat learn the dark like that?" Beat two, two doors: a scrapper reads the stance ("I know
that stance. Lamplighter.") at renegade ≥ 1, or a tier-2 yard asks about the cloaked torch. Both
are micro-cines; both must land before the exiles come.

**THE LAMPLIGHTER (the rescue nobody else would ride).** Two doors into ONE once-ever Cine scene:
CORNERED (hurt, deep grey, scrappers closing, far from towns) or THE FALL — the rescue system's
exile lane: when the pool is spent and NO yard qualifies, the Lamplighters take the ride. Three
cracks from a ridge (the camera looks straight at the gun this time — THE RIDE's displacement,
subverted), every chase within 640 broken, the cloaked figure with the hooded lantern ("The Order
teaches falling; we teach standing."), the raised-tongue stranger stepping out, HOLD: "THE CLOAKED
TORCH." Handoff: the C14 Timberwolf + 12 counted rounds, the LAMPLIGHTER class unlocked for this
world (chargen gate S.flags.lampClass — a fresh world never offers it), two letters, the record
promised.

**THE TIMBERWOLF (karma with a bolt handle, KeyY).** No aim minigame — the shot is a DECISION.
Nothing in reach: a warning crack scatters every chase inside 540 for one round, ledger clean.
A scrapper inside 430: he drops for 25 s, his friends dive, and +2 RENEGADE and +2 town heat write
it — the exact violence that made the exiles exiles. Cooldown 6 s (renegade tier trims it and
reaches further — the outlaw's ladder trains the hand); ammo scarce; dry fire says so; the prompt
rail offers the rifle only when scrappers stand inside its argument. The class: −2 pts,
foot 1 / sal 1, +6 kg exile-trained back, spawns with the rifle and 6 rounds — and the rifle is a
hand-me-down between EXILES only (a courier successor starts without one; the Nomads collect
their own).

**THE FACTIONS (two step out of rumor).** THE LAMPLIGHTER NOMADS (WARY — exile marksmen, crafty,
hard to track, "somewhere out past the maps the exiles even found a city to call their own") and
THE DIEFENBUNKER SOCIETY (UNKNOWN — the last of the old world, all of one northern origin nobody
says outright: carbines with a red leaf etched into the sights, "something about the cold,
something about the water" — the Fallout homage played straight). Their record arrives as the comm
array allows: three SBSN founding logs (Reed / O'Connel / Butler — the unsealing, the doors that
cannot reseal, the red leaf and "a place called Canada") on Society paper (.sbsn dossier styling),
delivered in order after first contact, wording preserved and spelling normalized.

Verification: `tests/exiles.mjs` (20 checks — fresh-world class absence, names/tabs/regions/title
ladder, both framing beats in order, arc staging/cracks/stranger/handoff/once-ever, warning vs
connecting shot ledgers, cooldown/dry-fire, prompt rail, faction rosters and hints, the SBSN chain
in order with the Canada log, the fall lane, class unlock + lamplighter porter + courier reset)
plus the full battery: **536 checks green across twenty-eight suites.**

## The Darklands table (v3.26 — the scale ladder made honest)

The verdict was earned: the map ladder shipped local → planet with NOTHING between, and the globe's
atmosphere clipped square at its canvas edge — a pasted asset, shipped unexamined. v3.26 answers
with the CONTINENTAL MAP as the actual developed middle scale, and the ladder reads honestly:
**THE GREYMARCH** (survey sheet) → **THE DARKLANDS** (the briefing table) → **THE KNOWN WORLD**
(the globe, demoted to the farthest pull of the glass — an ornament, and it says so).

**THE DARKLANDS (`src/16f_continent.js`).** The reference grammar — a tilted plane receding to a
horizon, wire-grid and contour terrain, leader-line labels, side data columns — rebuilt in the
register's own ink, never the references' neon: bone contour lines climbing 13 rings with real
RELIEF lift, a dotted land-density field brighter with height, a stippled grey-blue sea (a
surface, never a hole), the graticule receding with depth-stepped alpha, far coasts continuing
past the table edge so the map never just ends, gold corner ticks, a scale bar, the survey stamp.
The terrain is sampled from the SAME planet bake the globe renders (`Globe.elevAt`) windowed
around the Greymarch pin — one truth about the world. The subject carries the LIVE game: the
Greymarch footprint framed in gold dashes, its light coverage as gold stipple that grows with
`S.cov`, station pips (lit gold / dark grey) that scale as the table is leaned into, rust rings on
un-quieted camps, the walker a white pulse. The uncharted region pins live on this table — the
recon system's future ground drawn where it will happen. The columns are the LEDGER, real:
[ CONTINENTAL SURVEY ] region/coverage/stations/roads/party · [ CONDITIONS ] weather/the walk ·
[ THE LEDGER ] trust/karma tier/deliveries/camps quiet. Drag turns the table (yaw, clamped, with
inertia); scroll leans in; 60 fps with every layer on.

**The globe, demoted and padded.** The canvas now carries padding past the halo (PADF 0.26) so the
atmosphere ends where IT ends — corners verified empty, glow verified alive between disc and edge
— and the caption owns the new station: "the farthest the glass pulls back · an ornament of the
survey, for now."

Verification: `tests/continent.mjs` (9 checks — the three-tab ladder with engine exclusivity,
reopen-where-you-left, same-bake windowing with the subject framed on real land, painted-density
floor (thousands of samples: bone/gold/sea all present), live yaw, ≥20 fps floor, footprint
mapping, uncharted-on-table, halo corners + glow + demotion caption) plus the full battery:
**506 checks green across twenty-six suites.**

## The ecosystem (v3.27 — utilities ride the pack, works hold the ground, the loop revolves)

The directive named the missing distinction and the missing motion: direct utilities and build
items are TWO SEPARATE THINGS, and both belong to a factory-style loop where everything has a
purpose and everything helps the other. v3.27 makes the taxonomy explicit and CLOSES the loop.

**The two shelves.** The terminal's Fabricate sheet opens on the split, named in the register's
voice — UTILITIES (what rides the pack) · WORKS (what holds the ground, via kits and B) — with the
loop law printed at the counter and a ↻ loop line per item saying what it eats and what it feeds.

**Works PRODUCE (`updateWorks`).** Three new production works, each SITED by terrain (the factory
floor is geography, and the ghost is honest about a bad site BEFORE the kit is spent):
- **LUMEN STILL** (metal 14 + ceramic 6) — wants the VEIL thick at its site (mistBase ≥ 0.22: the
  light's edge, not its heart); pays 1 lumen / 90 s, and GREY WEATHER RUNS IT AT DOUBLE — the
  storm is a harvest.
- **SAWCAMP** (metal 10 + wood 4) — wants a treeline in reach (240); pays 1 wood / 75 s — and a
  FORRESTER working the same stand runs the camp ×1.25 while the camp sharpens the axe ×1.25
  right back: the synergy is mutual and measured.
- **CLAY OVEN** (metal 8 + wood 6) — wants wet ground close (marsh/shallows within 160); pays
  1 ceramic / 85 s.
The TIERS join the loop: the watchtower's armed post sweeps the SPOTTER'S TITHE (1 metal / 110 s)
and the shelter's room hangs a DRYING RACK (1 provisions / 120 s where meadow grows in reach —
and says NO MEADOW IN REACH instead of paying where none does). Every banked resource now has an
automated, sited source.

**The loop's honesty.** Every unit LANDS as an earn chip labeled by its work, with a puff at the
site and a first-pay tutorial. DISREPAIR (hp < 30) pauses hands — the clock holds, nothing pays —
and repair costs 5 metal: the loop feeding back. Because forests and marshes sit at the light's
edge, the build-in-waylight law makes generators the road TO production sites — infrastructure
begets production begets infrastructure. `Systems.workInfo/workState` is the ONE truth read by
the tick, the ledger and the labels.

**The ledger reads it.** The station Ledger tab's [ THE ECOSYSTEM ] block lists every producing
work — state (WORKING / DISREPAIR / BAD SITE / NO MEADOW IN REACH), rate, lifetime pay, percent
mended — and the all-works, all-time tally from `S.eco.produced`.

Verification: `tests/ecosystem.mjs` (14 checks — the two shelves + loop lines, the build bar's
works, all three siting laws honest on the one-truth path AND the build path with the kit kept,
production paying bank/lifetime/tally/chip, the storm doubling the still, the mutual synergy at
×1.25 measured both ways, disrepair freezing the clock, tithe and rack with the honest no-meadow
state, the ledger block, the closed loop) plus the full battery: **520 checks green across
twenty-seven suites.**

## The watchdog (v3.28a — the frozen-input report answered as law)

The field report: inputs dead (no click-to-move, no WASD) with ESC still opening the menu. The
exact trigger could not be reproduced from fresh boots, migrated saves, or a full UI fuzz — so the
answer is DEFENSE IN DEPTH, shipped as law:

**The step can never die silently.** The sim, the myth clocks and the frame are each guarded; the
first fault of any kind is reported ON SCREEN (`⚠ Waylight caught a fault in <where> — the walk
continues`, with the message — so any future report carries its own diagnosis) and in full to the
console, and the loop keeps stepping. A save-borne crasher can no longer freeze the game.

**Stuck gates are repaired within two seconds.** The watchdog compares every input gate against
what is actually on screen and fixes desyncs silently: a paused clock with no pause sheet; a
station sheet with nobody home (which eats every click while it stands); a stranded timeScale or
letterbox with no scene running; a zip state with no ride under it; a map flag out of step with
its sheet; a mouse button the browser never released.

**The gaps found on the way are closed.** The tailor now counts as the modal it is
(modalExceptMap), answers ESC like every other sheet (escPressed), and is torn down by
closeAllModals. Unknown legacy structure types (the classic save-migration crasher) leave the
world quietly in decay and produce nothing, instead of throwing every frame.

**And the battery now walks the player's own page.** `tests/inputs.mjs` runs on waylight.html
with NO debug flag — the first suite that boots exactly what the artifact serves.

Verification: `tests/inputs.mjs` (16 checks — non-debug boot with live WASD/click, the pause/map/
skills/blueprint/tailor fuzz, all four watchdog repairs each within two seconds, the legacy-type
survival, the sabotage check where the sim is made to throw and must report on screen and keep
walking, zero uncaught page errors) plus the full battery: **536 checks green across
twenty-eight suites.**

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

450 automated Playwright checks green, console clean, frame time 16.6 ms, across twenty-three suites — the twelfth the pixel pass, the thirteenth the builds pass, the fourteenth the lamps pass, the fifteenth the glow pass, the sixteenth the post suite, the seventeenth the progression suite, the eighteenth the shapes suite, the nineteenth the body suite (30), the twentieth the working-world suite (17), the twenty-first the ground suite (15), the twenty-second the karma suite (21), the twenty-third the myth suite above (19) — all rerun against the v3.6 light field (the light suite's pixel measurements — lit/grey luma and warmth ratios, the boundary rim, night punch-through, map growth — hold on the quantized palette bands) — including **the feel suite** (31: the Roll on the title screen, rotating taglines, a cheat typed end-to-end onto the record, the coat in the intro, Dispatch chain callouts and field promotions, scrapper trash talk, keeper voices on the results screen, panel clicks never move the Walker, two-click hand-over, companion interception, strung routes in world and map, keeper voices by state, barks, no DS vocabulary anywhere a player reads) — including **the light, measured in pixels** (10: lit/grey brightness and warmth ratios on matched terrain, the boundary rim, whole-map brightening with coverage, night punch-through, wraith burn and its tutorial) — the other seven: the delivery loop and network progression (33), the character-layer systems (35), the keys-and-clicks player-fidelity run (31), the **screen-reading first walk** (24), the **mouse-only run** (18), the **economy dynamics** (24: needs and moods set boards and pay, stock fills and drains, the wire flows and is multiplied by roads and porters, dimming, star loss, going quiet and relighting, chain bonuses, letters, crises, night, skill verbs, save migration), and the **v3 loop rules** (14: the lost-crate Guide/compass/tray chain, pickup recovery, stash tracking, giving up, companion hand-over, thriving suppression, letter scarcity, camp-skirting loaded routes, the wire's star-loss exemption, best-stock crises, honest stall handling, the wire cinematic) — plus the 30-game-minute balance session above.

## Future-work candidates

Touch controls; a suggested-route line on the map; NPC route events; relationships between waylighters; gear durability with Mending repairs; a second procedural valley after the Pharos; stock visible from the field (a bar over the station when near).


## The dead boot law (v3.28b — the frozen-input report answered at the ROOT)

The report stood after v3.28a: still no click-to-move, no WASD, ESC menu alive. The watchdog's
gates were all sound — so the cause had to be a gate the watchdog never checked. It was `S.dead`.

**The mechanism, reproduced end to end.** `die()` set `dead:true` and showed the Certificate of
Passage — but never saved; the death-screen AUTO-SAVE (switching tabs fires it, and `playing` is
still true on the death screen) wrote the save WITH the death and WITHOUT the ceremony. Every
boot after: `load()` normalized every transient EXCEPT `dead`, no death sheet was presented, and
every input gate that reads `S.dead` stayed shut forever — clicks refused by `canTravel`, the sim
(and so WASD movement) gated off at the step, ESC menu the one living surface. The player's
report, word for word.

**The law.** Death is COMMITTED the moment it happens: `die()` stores the certificate's facts on
the save (`S.deadInfo`) and saves at once — no alt-F4 resurrection; the Zomboid doctrine with
teeth. A save carrying a committed death boots INTO the Certificate (older dead saves that lack
the facts get an honest fallback: "the road took them between saves"), the ceremony hands off to
char-gen, and the next walker takes a valley EXACTLY as it was left — likes, structures, graves,
legacy, all proven untouched by the suite. The watchdog stands guard behind it all: any zombie
world it ever meets (dead walker, no certificate on screen) is presented the ceremony within ~2s.

**The no-purge law** (a standing order from the desk): nothing is ever deleted as fixing. Before
`load()` reads a byte, the save as it stood is stashed whole in a backup slot
(`waylight_save_v1_bak`). The v3.28a guard that dropped unknown legacy structure types was
amended the same hour it was named: they now go to THE ATTIC — kept in the save, out of the sim —
and step back into the world the moment a build that knows their type loads it. Proven round-trip
in the suite.

**The player's own tools, in the one menu that always answers.** The ESC menu carries a live
diagnostic line naming every gate holding the boots ("boots: held by a scene · a slowed clock"),
and FREE MY BOOTS — a release that clears stuck transient state (scenes, rings, sheets, clocks,
stolen focus), closes every sheet, and DELETES NOTHING; a committed death is not "released" but
finally shown its certificate. And when a fault fires every frame, a pinned chip spells the
diagnosis verbatim (`⚠ FAULT EVERY FRAME · the sim: <message> · ESC → FREE MY BOOTS`) so any
future report carries its own root cause.

**Proof.** `deadboot.mjs`, 19 checks green on the player's own page: the commit, the dead boot
into the Certificate, the fallback text, the backup slot, valley continuity across the handoff,
live boots after, the watchdog heal, the diag line, the release and its no-deletion proof, the
fault chip, and the attic's round-trip restore. Full battery: **475 tallied checks across
twenty-nine suites, zero fails.**


## The frontier (v3.28 — RECON & OUTPOSTS: the Darklands table becomes a working desk)

The v3.26 table promised it in its own caption — "recon will open the far marches" — and v3.28
delivers it as the Frostpunk law: send scouts to the frontier and the map fills in behind them,
then hold the frontier and it pays.

**The desk.** The uncharted pins (THE SALT FLATS, LOW MARROW) are click targets now. A click on a
pin (not a drag — the table still turns by hand) opens the frontier desk: a LEDGERLIGHT paper
sheet pinned to the table's corner — the reach's blurb, the honest costs, the banked line, one
gold button. Far pins clamp to the table's edge rather than dropping off it: the pin marks the
direction the rider goes; recon is what pulls the march onto the paper.

**The ride.** FUND THE RECON RIDE (20 metal · 6 provisions, and it wants a connected stable town
— the rider is a named Farkeeper on that town's own breed). Recon runs itself: a white dot walks
the dashed survey line across the table, live. At the midpoint the hazard rolls (30%): the rider
GOES QUIET — rust label, a worried mail, +45s — but always comes home; the mountain does not lose
riders to weather. The reach CHARTS with a survey letter in the register's voice.

**The outposts.** A charted reach takes an outpost (40 metal · 20 wood · 12 provisions; the
founding caravan takes half a cycle to arrive). Each reach is a DIFFERENT mouth feeding the v3.27
loop: PANHOUSE STATION cuts salt-pan slabs (ceramic) and cures stores (provisions); MARROW
DIGGINGS rakes bog-iron (metal) and bottles the marsh-light that pools instead of fleeing
(lumen). Every cycle the caravan walks the haul into the SAME bank the ecosystem revolves
through — earn chips land, the ecosystem tally counts it, and the caravan dot walks home across
the table as the cycle closes.

**The raid dice and the escort.** An unguarded haul rolls 35%: raided caravans limp in at half,
on record — mail, a rust toast, the table's CARAVANS RAIDED line. The answer is the Republic's
muscle at the wage law's price: fund the FARKEEPER ESCORT (2 provisions a cycle) and the mountain
walks beside every haul — zero raids while paid, and an unpaid escort LAPSES exactly like any
unpaid hand. [ THE FRONTIER ] column keeps the whole business on the table: riders out, reaches
charted, outposts, hauls landed, caravans raided — one truth.

**The batched automations, same logistics family.** The path-presser takes a CLICKED MARK: the
picker gains "→ a point on the land," and the presser wears a trail from town to wherever you
clicked (right-click or ESC puts the mark away). And the LOOTER completes (haul ≥ 4, earned):
trained backs work blooms, scrap and ruins in your sight straight into the bank, and a back past
80% full empties itself into the next lit town's lockers — kept and retrievable, never the void.

**Proof.** frontier.mjs, 24 checks green: refusals with the bank untouched, exact costs, the
chart and its mail, hauls landing in the bank, clean escorted arithmetic (3+1 per cycle, to the
unit), the lapse, both reaches' distinct yields, the desk's buttons working the real contract,
the presser walking a real path to the mark, the looter's sweep and locker deposit, and the
frontier riding the save. Full battery: **480 tallied checks across thirty suites, zero fails.**


## The clean shop (v3.28c — the standards correction, executed as work)

The verdict from the desk: a guardrail against deletion-as-fixing had been answered with
hoarding-as-fixing — the attic — and the shop floor was covered in artifacts nobody could
account for. v3.28c answers with the two things actually owed: the real mechanism, and the
accounting.

**The type ledger.** The audit of every shipped version found the structure-type history
ADDITIVE-ONLY — no rename or removal ever shipped — so the attic quarantined a case that could
not occur while the real case (a save from a NEWER build) had no correct path. Now:
`DATA.MIGRATE_TYPES` is the standing law that a type is forever (any future rename ships its map
entry in the same edit), `load()` walks every save through it at ONE seam, and a type past the
map becomes a real `unmapped` world object — authored tarp-and-rope glyph, visible, inert,
original type carried on the object — that steps back into itself the moment a build that knows
it loads the save. No attic, no splice, no guard forest: def is always real, and runtime garbage
is a code bug that surfaces LOUDLY through the fault guard instead of being absorbed.

**The shop audit.** `tools/audit.py` — destructure-aware, spread-aware, ternary-aware lexical
reference analysis over every source and test file, honest in print about what lexical analysis
cannot see. It raised 61 findings; every one was verified by hand before anything was touched:
one shipped unreachable branch (`&& false`) removed; six dead declarations removed; one dead UI
subsystem removed end to end (the DOM cine-title — a title with a hide routine and no show
caller, superseded by the canvas cine engine); forty-four dead exports trimmed while their
living functions stayed; nine analyzer false-positives fixed in the INSTRUMENT, not the code.
The complete finding-by-finding ledger ships as SHOP-AUDIT.md.

**The gate.** `tests/shopaudit.mjs` runs the audit inside the battery: any future dead
declaration, dead export, unread tuning constant, unfired tutorial, unreachable branch, or ghost
save-field FAILS the build. The shop stays swept because the sweep is a gate, not a memory.

**Proof.** Battery green after the sweep: **481 checks across thirty-one suites, zero fails** —
deadboot re-proves the ledger round-trip, inputs re-proves loud-not-absorbed, and the gate
itself stands in the count.


## The memorial (v3.29 — the ground that keeps the Order's own)

The permadeath research said it plainly: every life must bank something VISIBLE, and the
strongest form of a dead self is a world entity. v3.29 makes the bank a PLACE.

**The Lantern Rows.** A war-memorial ground near Haven, found once on open passable ground and
kept on the save. Every fallen or retired walker on the roll earns a stone, cut to the walk they
walked — the Darkest Dungeon headstone law: small for the short road, mid past eight deliveries,
GRAND past twenty-five or 350 ◆, and the grand stones carry their own glow. The ground GROWS
with the roll — kept ground (a plinth and a promise), the stones (flanked by lit lantern posts),
the rows (a paved apron up the center), and THE HALL (an etched wall crowning the ground at six
names). Lanterns, not crosses: this is the Order's ground, and its light is the point.

**The ceremony.** A new stone doesn't stand itself — it waits as a cut block on skids until the
walking successor RAISES it by hand (the Dwarf Fortress slab law: the interaction is the
memorial). Raising pays +8 ◆, mails the epitaph in the register's voice, and an unraised stone is
a DUTY mark on the compass from anywhere — the ground pulls until the Order's debt is paid.

**The sheet.** Read the stones and the roll opens as PLAYERCARDS: the stapled portrait (drawn by
the same engine that drew the walker alive — old rows without a stored face get one deterministic
face forever), name, class, epitaph, the numbers, the fate, and the REMEMBERED stamp. Grand
walkers read gold on paper too; WALKED WITH HELP is stamped exactly where the Roll always
stamped it. Full modal law, all four lists.

**Cross-faction by architecture — the future-proofing order.** ONE data table, ONE renderer,
FOUR complete designs shipped today: THE LANTERN ROWS (Waylight — bone stelae, gold light, the
open flame), THE HOODED ROW (Lamplighters — dark stones, the hood lifted exactly once), THE
STANDING TEETH (Farkeep — grey monoliths, a cold iron ring, no flame by doctrine), THE BRASS
WALL (Diefenbunker — green-bronze plaques, the red leaf etched and never explained). Legacy rows
carry their banner at write; the renderer reads the table; the Lamplighter city (v3.30) and every
ground after plugs in without touching the architecture. This per-walker, per-faction identity
layer is what the CK3-style sandbox (v3.31) hangs forces and cities from.

**Proof.** memorial.mjs, 20 checks green: the site real and saved, the full stage ladder, the
tier law, the paid ceremony oldest-first, the sheet with a card per name and the modal law, the
ground standing in PIXELS at the site, the compass duty, four-design completeness with honest
fallback, the save round-trip whole, and a real death writing a stone-ready row. Full battery:
**501 checks across thirty-two suites, zero fails.**


## The exile roads (v3.30 — Shutterlight, the guild, the C-series, the Hooded Row)

The v3.25 lore made a promise — "somewhere out past the maps the exiles even found a city" — and
v3.30 keeps it on the systems already standing.

**Shutterlight is REVEALED, never charted.** No Farkeeper rider will ride toward the exiles; the
city arrives because the exiles decide you have seen enough. The v3.25 rescue (or an exile
walker's own coat) MARKS the Darklands table — "a mark nobody made," a hooded lantern charcoaled
onto the frame — and FOLLOW THE MARK runs a guided journey down a road no survey will hold. The
city opens on the table's far north-west edge with its own pin (a lantern with the shutter half
down) and its own desk.

**The exchange and the guild.** The exchange sells .338 at three metal a round from a cycled
stock of six — dear, because the Nomads collect rifles, not brass. The guild posts the quiet
work, gated HONESTLY by what already exists: a rifle on your back (v3.25) and a party of two at
it (v3.24). Ridge watch, caravan gun, and the quiet collection — which writes the Renegade
ledger, because the karma system was always going to color this — run on the wage-law clock with
a mid-contract hazard roll: "it went loud" pays half and asks no questions it already knows the
answers to. Contracts done build guild standing: three opens the C3A1 shelf, seven turns THE
COLD DOOR's corner of the table.

**The C-series rides ONE fire path.** C14 Timberwolf, the hand-me-down; C3A1 at standing two,
the red-leaf service bolt; C20 behind the cold door, the semi-automatic answer. Each is a set of
multipliers on the v3.25 rifle constants — range, cooldown, drop time, warning radius — and the
rifle is NAMED on the pack, the prompt, and the dry-fire line. A knock at the cold door plays
the raised-tongue scene and opens the last shelf; the walkable interior itself rides v3.32 with
the faction-places work, stated plainly.

**The Hooded Row — the cross-faction law proven in play.** The Lamplighter memorial ground goes
LIVE on the v3.29 architecture: revealed with the city, sited far from every station (the exiles
bury their own where no map minds), dark stelae under hooded-lantern accents, UNHOODED for a
stamp — and a Lamplighter-class walker's death routes their stone THERE by the banner on their
legacy row, never to the Lantern Rows. One table, one renderer, two grounds standing.

**Standards revisions, same ship.** Screen shake is REMOVED AT THE ROOT by directive: the
per-frame random camera jolt — fed continuously by damage-over-time, which is why the game read
as violently vibrating — is deleted with all nine callers and the HUD heart jitter; impact
speaks through sound, stagger, and bursts, and THE STILLNESS LAW now stands in the battery (the
ground provably still to the pixel under bleeding). And the appreciation icon is sized like it
matters: 30px beside "+N APPRECIATION" on the waybill, proven on a real local-post delivery.

**Proof.** exileroads.mjs, 22 checks green end to end; the stillness law and the icon in the
battery; full battery **524 checks across thirty-four suites, zero fails**; shop audit CLEAN.


## The delivery ledgers (v3.31 — the RimWorld-style management layer)

**The item-system audit came first, and the verdict is: NO database.** The game already keeps
ONE merged flat definition map (DATA.items, with the character-era table folded in at load) —
97 defs, each carrying its own cat/slot/scrap fields. A database would be overhead with no
customer: what the management layer needed was not storage but MEANING — a taxonomy over the
defs and a policy store over the taxonomy. Both ship as pure data layers; zero defs moved.

**THE TAXO TREE.** Cargo → Equipable (utilities, provisions, weapon, wearables by SLOT — boots,
coats, packs, charms) · Buildables (station, works) · Resources (wood — every cut and grade
files under the one parent — metal, ceramic, lumen) · Consumables (food, medical, books) ·
Freight (post, trade) · Curios (relics, junk, contraband). classify() reads each def's own
fields, a four-line OVERRIDES map catches the tools that build rather than deploy, and
coverage() is a standing battery check: 97 classified, zero missed — a def added tomorrow
that fits no branch FAILS the suite rather than silently vanishing from the books.

**ONE policy store, three sheets over it.** S.ledger holds marks per node or per item across
five verbs — Deliver / Store / Donate / Scrap / Pickup — resolved item → leaf → root →
default. THE PARENT LAW is the sandbox standard done visibly: marking a parent clears every
descendant override so the whole column under it flips as one, and a mixed column renders the
half-bar tri-state. The three sheets are THE DELIVERY DOSSIER (the pass and its toggles, with
the donate-EXEMPT search box), HAULIN' MANIFEST (the streamlined book — ONE take-mark over the
category tree), and THE CARGO CHECKLIST (the in-depth book — a searchable grid where every
category and item unfolds to its five marks; Enter opens the chain and lights the row).

**THE DOSSIER RUNS IN STRICT ORDER at any lit town: missions FIRST** — the priority chain is
accepted before anything else moves — then Deliver (letters walk before cargo), Store, Donate
(exemptions held back), Scrap, Pickup (letters first, capacity honest). One slip totals the
pass. The map rail carries the travel-options widget as sketched: run-on-arrival, grab all
letters, deliver applicable — and the on-arrival edge fires once per town with a cooldown, so
riding past a door is never a surprise transaction. The whole engine is ITEM-AGNOSTIC by
imperative: the same policy resolution is the base the COMPANION management layer will stand on.

## The fairness pass (v3.31 — four field verdicts, answered at the root)

The field report named four core-loop injustices. Each was found in source, fixed at the root,
and pinned by fairness.mjs — ten checks that measure the WORLD, not the code's opinion of it.

**1 · The chase obeys the world.** The scrapper sprint was flat 152 — faster than an unloaded
walk, tuned to "catch the player" rather than to be a pair of boots. Now: 118 on the flat,
taxed by the SAME terrain and slope the player pays, a leash at 720, a stall-giveup, and the
mounted law — a runner who sees the gap growing under hooves calls it ("A horse. Forget it.")
and stops burning your attention. Proof: mounted gap 150→613 px in 3.5 s with the give-up
line; on foot, light-and-sprinting pulls away while loaded-and-walking stays honestly caught.

**2 · The hill is not a minigame.** The wobble rang on slope alone, so every hill on a route
demanded Space — the route-killer verdict. The ring now needs a REASON: overloaded past 1.0,
sprinting on rough ground, fear, or empty lungs — a sane load WALKING steep ground never
rings; the hill's price is breath and pace. Proof with the wobble LIVE (the calm debug flag
explicitly cleared — the earlier green here was vacuous and is called out as such): sixteen
seconds on 0.32+ slope, ZERO rings; overloaded on the same ground, the ring still comes.

**3 · The balk is a beat, not a chore.** Water and rungs still dismount the rider — the horse
has an opinion — but the horse now WANTS back on: it auto-remounts the far side of the
obstacle with no button, no spook lockout, one quiet line the first time. A CHOSEN dismount
(R) stays dismounted — the automation serves the balk only and never overrides the player.

**4 · The ladder law — every warp found and killed.** Root cause: planned waypoints landed
NEAR spans, not ON them, so walkers ground against cliff faces beside their own ladders — and
three separate "self-heal" mechanisms then MOVED them by fiat. snapCrossings() now projects
any planned waypoint within a span's reach ONTO the rungs — player routes and field crews
both — and the fiat movers are dead: escortSnap (the convoy junior "sucked to your back") is
DELETED — a wedged junior now plans the crossing and WALKS it under the same passable() law as
the player, trudging at half pace when left behind (never frozen, never warped); the field-hand
no-progress check — which counted slow walkers as stuck because they gain under 1px a frame
and would have popped every mason forward every eight seconds forever — now measures ground
gained over a full window and RETARGETS without ever writing a position; and the companion
catch-up teleport (300 px behind for 7 s = appear at your boots) is replaced by a visible run
that closes any gap in seconds on their own legs. Proof: a routed ladder crossing sampled at
100 ms — crossed, max step NINE pixels; the snap math exact on a real placed ladder; the
convoy junior closing 200+ px with every stride bounded under 60.

**Proof.** ledgers.mjs 16 checks (coverage, chains, the parent law, a full dossier pass at
Haven with the slip totalled, exemptions, letters-first, the arrival edge, save round-trip,
modal law); fairness.mjs 10; body and shapes rewritten where they had enshrined the OLD warp
law as correct; full battery **571 tallied checks across thirty-five suites, zero fails**;
shop audit CLEAN.


## The Republic in force (v3.32 — the CK3 sandbox foundation)

The memorial proved a scaling law in v3.29 — four faction designs, one renderer, a row per
banner. v3.32 applies that law to the WHOLE sandbox. Every faction, presence, doctrine and
interior is a REGISTRY ROW (12d_republic.js) read by ONE engine (15g_republic.js) and one set
of render glyphs. A future faction, a future doctrine, a future room is a row — never a new code
path. That is the entire architectural bet, and it is the reason this ships lean on eleven
sources instead of exploding across the codebase.

**STANCE PLAY, sealed where lore seals it, walked where it doesn't.** One ordered ladder —
Absolute Ally · Ally · Friendly · Wary · Hostile · Absolute Hostile · Unknown — and a RULES row
per banner saying what play may move it and through which gate. Waylight and Farkeep are SEALED
ABSOLUTE_ALLY by the founding; the Reapers and Hollow Fires SEALED ABSOLUTE_HOSTILE (shoot on
sight is mercy). No play moves a seal. The rest walk: the Raiders can be brought to a WARY TRUCE
at Road's-Own renegade standing; the Flame Keepers climb Wary → Friendly → Ally as you FEED their
shrines; the Unlit's posture is yours to set (LISTEN slows their drum, HARD LINE feeds it); the
Lamplighters and the Diefenbunker MIRROR ledgers that already exist (the guild rank, the cold
door). Every gate reads a system already standing — the renegade tiers, the exile rank, shrines
fed — never a new currency. THE BANNER SHEET (the survey-sheet rail, or Farkeep's own desk once
the road is cut) is the Republic in session: the court on the left, the holdings on the right.

**THE UNLIT, and the two answers.** A town whose people decide the wire is a leash douses its
own waylight BY CHOICE — political dark, not starvation, and NO delivered core will answer it.
The Republic holds two doctrines, and the choice between them is the game: THE QUELL sends a
column of Farkeeper shields that MARCHES the real road (snapped to the crossings like any
walker), restores the light by force, costs the town's love, and can cost the mountain a name —
a casualty raises a stone on the Standing Teeth. THE PARLEY is your own boots at their cold
fire, a gift of stores, and the oldest argument the Order owns — slower, gated behind a town
that loved you once, remembered longer. The first rising is authored (the stone-cutters at the
Quarry); after that the drum reads your caught work at each town, and the valley never loses more
than two lights off-screen, so the sandbox stays playable.

**PRESENCES from one table, all SEEN on the ground.** The Flame Keepers' shrines stand on the
walked ways — a stone bowl you FEED with carried lumen, burning tall for most of a day, warming
their stance. The Hollow Fires' larders burn far from every station, and at night the ring
around one HUNTS; the Farkeepers answer a larder with THE BURNING, not a parley. The Reapers
cross the night grey in a hooded FILE that harvests only what walks into it — no chase. And the
Iron Giant is a machine-shape that stands up out of the far mist at the light's turn, too tall,
one red running-light turning over once, gone when the grey shifts — sighted, mailed, and after
three sightings the Republic posts a standing watch. (The far shape draws LATE, after the mist
that would otherwise bury it, with the world transform restored by hand — a render-order bug
found and fixed in this pass; without it the shape would never have appeared in play at all.)

**THE MOUNTAIN ROAD — the expansion door, funded and CUT.** The pass the Farkeepers walked DOWN
when the Order fed the Farlands famine is cut back UP: a road-gang project on the Darklands
table's far east edge. When it opens, the Farlands go live on the globe, Farkeep answers the wire
with its own desk, and the kit of the mountain HIRES — the Longbowman (answers trouble at 320),
the Rifle Rider (a breech and a horse, 380), the Berserker (a claymore and a horrible knock up
close). The intercept READS THE CLASS ROW: a ward meets a runner from its own trade — a fist
knocks him flat, a bow or a breech DROPS him where he stands. A future class is a stats row.

**THE DIEFENBUNKER, WALKED.** The cold door, once knocked open (v3.30), now STEPS INSIDE — a
registry ROOM with its own floor: concrete ribs, cold strip light, lockers, the SBSN log desk
you can read standing up, the brass wall of a century's names, and the armory cage with the
red-stencilled C20 crate. Nothing made of grey follows you in. The room is a data row
(INTERIORS.diefenbunker); Farkeep's long hall and Shutterlight's guild room are future rows on
the same engine.

**Proof.** republic.mjs — 19 checks measuring the WORLD: the registries seed real open ground,
the seals hold against play, the truce gates then walks and stands the camps AND the horns down,
the rising douses a lamp with no core posted, the parley and the quell each restore it (the quell
marching on real ground, paying appreciation, raising a Standing Teeth stone), the shrines feed
and climb the ladder, the procession harvests only what walks in, the far shape stands whole in
frame, the mountain road cuts and lives the whole kit, the class-read intercept drops a runner at
range, the hall is walked end to end, and the banner sheet obeys the modal law with no TODO
anywhere. Full battery **~590 tallied checks across thirty-six suites, zero fails**; shop audit
CLEAN.


## The asset pass (v3.33 — the PixelLab pipeline, on our terms)

The gate opened: PixelLab credits landed (a Pixel Artisan subscription, 3,324 generations in the
cycle). The asset law had been written for this moment — generate → quantize to OUR bands → embed
as rows, never hotlink — and the pass spent twenty generations proving where that law holds and
where it doesn't.

**Where it doesn't: people.** The Farkeeper probe came back clean and thirty-eight texels tall in
realistic proportion. Against the hand-authored 12×18 rig it is a giant at native scale (canon says
NOT giants) and a nine-wide stick at an integer downscale. No scale makes a generated human sit in
this game's stocky texel grammar — so the rig stays hand-authored, as the standing directive
already said, and THE KIT was DRAWN: five Farkeeper classes at 14×22 in the walker's own letters —
a head taller and a hand wider, which v3.22 had faked with a 1.16×1.22 scale and v3.33 now draws.
The Pugugly's shoulders fill the grid; the Longbowman carries the stave up the back; the Berserker's
claymore stands over the shoulder above a fur collar; the Rifle Rider's breech crosses the back; the
Recon Rider wears the pale short cloak. The Flame Keeper tender — promised at ALLY since v3.32 and
never drawn — is drawn, and stands the fed bowls with her torch.

**Where it holds: the stable.** A horse is a big object with more texels, and at the right size the
generated quadruped lands at exactly this world's density (3 screen px a texel) and proportion. The
right size was the discovery: the standard model draws the animal to the requested size inside its
canvas, and size 24 yields 26–30 texels of horse — a walker's height and a half its length,
which is what a horse is. (Size 48 gave house-sized animals; a ×2 downscale of those gave mush —
legs merged, shading gone — and was rejected on sight.) Six were generated: the five breeds the
data already named and the caravan donkey the field crews already hauled with, each with a
four-frame template walk. Every one is DISTINCT — dun Mustang with black points, dun Fjord with the
cream upright mane, white Arabian, black Percheron with the massive neck, chestnut Icelandic under a
flaxen mane, and the grey donkey with its crates lashed on.

**The quantize.** Each sprite's opaque pixels are clustered by a k-means in CIE Lab (six centres —
hue survives, so the donkey's crates stay wood beside a grey coat), each centre snapped to the
nearest of the game's own sprite bands (the union of every authored palette plus a set of coat
bands), letters assigned darkest→lightest with the outline forced to the game's one outline. Rows
are cropped on ONE bounding box across a frame set (pivot-centred frames keep their anchors), then
cluster-disciplined: a texel whose four neighbours all differ is noise, not a cluster, and takes the
majority. The registry row carries the anchors — GROUND under the hooves, SEAT on the back — and
the renderer composes any rider onto the seat with exact texel math (a texel is k buffer pixels,
k/m.a local units under whatever transform the caller stands in). One `drawMount` serves every
saddle in the game: the player's rented breed, the militia and rescue wards on the Farkeepers' own
Fjords, companions on their home town's stable, the ride set-piece, the caravan donkey. The authored
HORSE_F stands as the fallback row. The walk runs on an UNEVEN cadence (0.17 · 0.11 · 0.17 · 0.11),
per the audited research: a four-beat with two short beats reads as a gait, not a loop.

**A bug the pass surfaced.** `glyphSprite` cached by the FIRST row only; every idle/A/B frame of a
figure shares its top row, so the first walk cycle through the cache would have collided every
frame into one. The key now hashes every row.

**What waits.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

**Proof.** assets.mjs, 13 checks: the registry embeds (no URL, under budget), integrity (rectangular
rows, letters in palette, anchors inside), THE SCALE LAW (horses 24–32 × 18–26, classes 14×22, the
tender 12×18), distinctness of every breed/class/frame, zero orphan texels, the uneven cadence — and
ON SCREEN: five mounts as five different pictures, the seat anchor on the back, three hired classes
as three different figures, the crated donkey and the torch-bearing tender in pixels, the fallback
row standing, the cache key fixed. Full battery **~583 tallied checks across thirty-seven suites,
zero fails**; shop audit CLEAN; twenty generations spent, 3,304 in hand.

## The holdings (v3.34 — conquest, the world's own wars, two walked halls)

v3.32 built the sandbox and said so honestly: the Republic RESTORED towns by force but did not
conquer; the banners had stances toward the player and none toward each other; two interiors were
cued and not built. v3.34 answers all three on the same registry law — four new tables in
12d_republic.js, one engine extension, one glyph set — and adds nothing that is not a row.

**THE TAKING.** The doctrine the founding promised ("they can take towns by force") lands on the
raider camps: `DOCTRINE.take` (70 metal · 20 wood · 30 provisions, five shields, 120 s on the real
road, casualty 0.45) gated on the mountain road — Farkeep takes no ground it cannot reach. The
column marches the same runner the quell and the burning ride; on arrival the camp is HELD: a
REPUBLIC WATCHPOST (`WATCHPOST` row) with two shields standing the fire in shifts under Farkeep's
grey pennant, tents pitched in mountain grey, a salvage tithe hauled in from the ring (a crate per
90 s, capped at four, carried off by the prompt at the post), and a HELD RING — a chase that
crosses into 0.7 of the old claim is broken by the post (the runner cools twelve seconds and turns
back to his own ring; proven on a temporary camp row, since the world's own camps stand too far
apart to cross). The price is written by the world, not by a number: a raider truce, if one stood,
DIES with the first shield in the ring; the nearest town breathes easier (+6); the mountain may
pay a name (the casualty roll raises a Standing Teeth stone — `casualtyRoll` now serves the quell
and the taking alike); and the RAIDER REPRISAL fires — a 420 s season in which every camp that
stands claims 1.25× wider and runs 1.15× quicker. The light's own patient answer is untouched and
proven beside it: a camp the wire reaches still stands down by ITSELF with its gift, and a held
camp is never counted twice (`pacified` is the quiet flag; `taken` is how).

**THE WORLD'S OWN WARS.** One `EVENTS` registry of what the banners do to EACH OTHER, seen on the
ground, that the Republic may answer or ignore: a row names its actor, its victim, its kind, its
conditions (night, a target resolver, a truce veto, a chance), its clock, and its text. Four rows
ship. THE DOUSED BOWL — the Raiders kick a fed shrine over in the night: the bowl goes cold with a
scorch on the ground (a third shrine glyph), and the Flame Keepers ASK — an entry under THE WORLD
ASKS on the banner sheet that AGES (600 s): feed the bowl again by hand and the question closes
warm; send the mountain to the nearest camp (the sheet offers THE TAKING there, gated like every
taking) and it closes cold; let it lapse and the Keepers' stance cools a step and they say so.
THE REAPERS' CULL — a camp in the night grey loses a runner to the file: a hooded stake stands
where he stood and the camp restaffs one knife short for a day. THE COURTING — when the rising's
pressure passes 55 % of its period the Unlit TALK to the town they will take next: a half-flown
shutter beside its door (the same texel glyph as the rebel banner, hung low enough to be denied)
and HEAR THEM OUT on the sheet (8 provisions, 20 likes at their door): the drum drops 45 % of a
period, the courting clears, the town warms; ignored, the rising takes the courted town FIRST. THE
REPRISAL is the fourth row, fired by the taking rather than by a clock. Every event writes the
RELATIONS ledger — sixteen lore pairs (`RELATIONS.base`, keyed on the sorted pair, deltas in the
save) read in five bands (WAR · FEUD · COLD · TRUCE · ALLIED) with a line each and "last moved by
…" — under THE WORLD'S OWN WARS on the sheet. Farkeep and the Raiders open at FEUD and go to WAR
with the first taking; the Society and the Nomads stand ALLIED ("one fire, two banners").

**THE HOLDINGS VIEW.** Every place the table knows now carries its OWNER on the plate: towns (THE
ORDER / THE ORDER — COURTED / THE UNLIT / NOBODY — DARK), camps (THE RAIDERS / STOOD DOWN — THE
LIGHT'S / THE REPUBLIC — WATCHPOST, with the held-since day and the tithe count), larders, bowls
(FED / COLD / DOUSED), the charted reaches and outposts, Shutterlight (THE NOMADS) and the
Diefenbunker (THE SOCIETY) once found. TAKE stands on every raider camp, disabled with the gate
line until the road is cut.

**TWO MORE WALKED ROOMS, and THE FIT LAW.** FARKEEP — THE LONG HALL (stone) enters from Farkeep's
desk: the SHIELD WALL hangs a darkened shield for every stone at the Standing Teeth and reads the
fallen by name; the hearth tells the founding in three fragments (the famine, the descent, and THE
CHILD carried down the pass "grey-eyed, and it did not cry once in the dark" — the warden looks a
beat too long); the practice yard hires the kit from its rows on three keys. SHUTTERLIGHT — THE
GUILD ROOM (timber) enters from the Shutterlight desk: the board reads the Nomads' opinion of you,
the counter sells .338 across the exchange, and the hooded lantern tells three fragments (the hood,
the sword, and THE MARK cut under the lip "in a hand you know — the same hand that signs your
manifests"; "Some exiles are born. Some are only late."). Both are protagonist-origin fragments,
never said outright, per the rolling law. Rooms now carry a `style` (a `ROOM_STYLES` material
table: concrete, stone, timber — one renderer, three materials) and an `exitLine` in their own
voice. THE FIT LAW: the v3.32 bunker (520×300) CLIPPED in the 480×287 buffer at 1440×860; every
room row is now ≤ 400×190 so it stands whole down to a 1280×720 viewport, the furniture glyphs
read their own widths, the title sits on the ceiling band, and the walker inside is the rig itself
in the coat it wears — no stand-in figure down there either.

**Pixel polish on the touched source (the rolling law).** The v3.32 sandbox glyphs were sub-texel
rects in world units; everything v3.34 touched became a texel glyph in the registry grammar: THE
SHIELD figure row (14×22, three frames, drawn by the kit's own blit — the column marches it, the
watchpost stands it), the shrine's three states, the Unlit's shutter flown and half-flown, the
Reapers' stake, Farkeep's pennant, the salvage crates, a wide hearth fire.

**Proof.** holdings.mjs, 19 checks: the registries; the holdings view gated before the road; THE
TAKING end to end (refused/funded/marched/held/truce dead/reprisal/likes/stone/WAR); the tithe
capped and carried; the held ring breaking a chase; the light's own answer beside the taking; the
doused bowl and the ask, answered by walking, lapsed to a cooler stance; the cull; the courting
heard out and ignored; the ledger's bands and memory; both rooms walked (walls, every hotspot, the
fragments, the hires, the doors' own voices); the materials; the save; the modal law. Evidence
frames: the column on the road, the watchpost holding, the doused bowl, the courted door, the
stake, the sheet, both halls. Full battery **602 tallied checks across thirty-eight suites, zero
fails** (two parallel-timing flakes rerun green sequentially); shop audit CLEAN.

## The player's pass (v3.35 — the field manual, the keys, the passage papers)

The audit that opened the pass was of the whole game as a person lives with it, not of any one
system: thirty-four lessons taught once as seven-second toasts with no way to read them again; a
controls card that listed thirteen of the keys the game binds; one save, in one browser, with no
way to carry it, name it, or stand a second valley beside it. Every system was there; the way IN
to them was not. v3.35 is for the people who play it.

**THE KEYS (12f_keys.js).** Every action the game binds is one row — default codes, a name, a
group, whether it is held — and 18_main resolves every keydown through `KEYS.action(code)`; the
old `keymap` and the switch on raw codes are gone. A rebind is a data change persisted in the
player's options (`waylight.keys`), never a code path: click a cap in the manual, press a key, and
the cap that LISTENED reads the new key; a key another action answers is refused by its holder's
name, the rail's letters (E · R · L · G · C · T · V · X · P · U — the world's own prompt labels,
printed beside what they do) and the build bar's digits are refused as what they are, Esc and
Enter stand fixed, and a reset hands every key back to the Order's print. Lessons and the rail
read with YOUR keys: `KEYS.say` rewrites every `<b>KEY</b>` token in a lesson to the cap that
answers it now, and the rail's E is the interact cap wherever it was bound.

**THE FIELD MANUAL (16j_manual.js, F1 · the pause sheet · the survey rail · the title).** Four
tabs on LEDGERLIGHT paper. CONTROLS from the registry, grouped THE WALK / THE HANDS / THE PAPERS,
plus the mouse and the rail's letters. LESSONS — every page the road has taught, in full, with a
search over the walked ones; the unwalked stay SEALED ("a page not yet walked"), so discovery is
kept and re-reading is allowed; the count is printed. THE PAPERS — every sheet the Order keeps
(`PAPERS` registry: name, what it is, how it opens) with an OPEN that steps out of the manual and
into the ledgers, the banner sheet, the survey, the table, the globe, the cargo, the record. THE
PASSAGE, below.

**THE PASSAGE PAPERS.** Three valleys. Slot 1 keeps the key every save has ever used, so a browser
that saved before slots exists in slot 1 unchanged; slots 2 and 3 stand beside it; the chosen slot
is the player's, persisted with the options, never the porter's. The title shows the three as
plates (walker, day, level, stones on the Roll; the chosen one gold), and choosing one reloads the
drift behind the menu. RETURN TO THE TITLE from the pause sheet saves this valley and steps out —
`leaveWorld` unwinds the HUD, the modals and the clocks, and CONTINUE walks back in. A PASSAGE
CODE is a valley as text: the save deflated (`CompressionStream('deflate-raw')`, a third of the
page) and base64'd under a WL1 seal, or plain under WL0 where a browser cannot deflate — either
seal reads on either browser. Export writes the code into a box with COPY (the clipboard where the
browser allows it, a selection where it does not); import validates the seal, the bytes and the
page (a valley has a version, stations and a bank), STASHES whatever the target slot held in its
backup first — the no-purge law — and refuses by name with nothing written otherwise. In play, a
code imports only into another valley; on the title, into any.

**For the people, the rest.** PAPER SCALE (Small / Standard / Large / Larger) rides a CSS zoom on
the reading surfaces only — the sheets, prompts, toasts, the guide, the desk — the world and the
HUD meters untouched, sheets held inside the viewport. THE COURT reads the faction `live` flag at
last: the five banners v3.32 put in the field (the Reapers' file, the Hollow Fires' larders, the
Unlit's risings, the Flame Keepers' bowls, the Society's door) are IN THE FIELD; the Iron Giants
carry the one RUMOUR seal until a sighting is more than a shape over the mist. And the last two
sub-texel rows of the sandbox became texel glyphs: the larder (three frames — the wrong fire with
its green heart, the rack, what hangs drawn small and unclear) and the Reaper (8×18, the slit its
only light, facing the file's way).

**A test corrected.** inputs.mjs measured the stillness law 600 ms after a walker stopped — inside
the camera's settle — and read a settling camera as shake on a slow frame. It measures a SETTLED
frame now and says so.

**Proof.** manual.mjs, 19 checks: the registries; rebinding by law (clash, rail, digits, fixed,
persistence, reset) and the walk reading the row (N opens the sheet while it holds the binding);
the sheet under the modal law with a cap that listens to a real keypress; lessons walked in full
and sealed otherwise, the search reading only the walked; the papers opening sheets; the passage
code sealed, decoded, imported byte for byte, the plain seal, the backup, two refusals with nothing
written; the passage tab; return to the title, three plates, choosing valleys, an empty valley,
F1 on the title, CONTINUE walking back in; paper scale; the court's rumour; the glyphs. Evidence
frames: the four tabs, the pause sheet, the title's valleys, the larder and the file. Full battery
**621 tallied checks across thirty-nine suites, zero fails**; shop audit CLEAN.

## The muster (v3.36 — standing orders for the people who walk with you)

v3.31 built the delivery ledgers item-agnostic on purpose and wrote the promise down: the same
marks-over-taxonomy policy engine "is the base for companion management later." v3.36 keeps it,
and keeps it in the register — a MUSTER ROLL, not a settings grid.

**The engine, kept honest.** `Ledger.effective / setMark / markState` were three functions over
one store, the pack's. They are now wrappers over `effectiveIn / setMarkIn / markStateIn`, each
taking the store it reads or writes, plus `seedStore` — a preset landing on a store top-down by
the parent law. Proven: for every item and every verb the pack's wrappers read identically through
the parameterized engine, and a mark on a walker's store leaves the pack's ledger untouched.

**The registry (12g_muster.js).** Four scalar ORDERS, each a row with its choices, default and a
line per choice: STATION (wedge · close · loose · point — where they walk), MESS (the bank · their
pack · fast — how they eat), STAND (meet it · hold · quiet — how they meet trouble), VOICE (talk ·
quiet). Two TREES over the taxonomy: SWEEP INTO THEIR PACK (what a trained back picks up for you)
and TAKE MY OVERFLOW (what they lift off your back, unasked, the moment you carry more than the
pack allows — mission cargo, tools and the lost never move). Five PRESETS by name — THE WALKER'S
OWN, THE PACK MULE, THE SHIELD, THE SCOUT, THE QUARTERMASTER. Slot geometry per station (three
slots each, dealt by index so two backs at one station never share a spot), station effects (the
looter's reach × 0.7 at close and × 1.35 at loose; a steadier hand at the elbow), the HOLD ring
(120 px around you), and the roll-call words.

**The orders move real feet (15b_npc.js).** A hire walks in as THE WALKER'S OWN; a Farkeeper of
the kit as THE SHIELD. STATION is the slot the wedge walks — CLOSE brings both inside 40 px, LOOSE
past 90, POINT puts them AHEAD of you. SWEEP gates the looter's fetch and, node by node, the
automated harvest (a junk drop inside reach stays on the ground with junk OFF; mark it ON and the
same back walks over and takes it). THE OVERFLOW: throttled to a beat, the heaviest allowed crate
moves from your back to a back that will take it, with a word, until you are under — the contract
crate stays. THE MESS: their pack eats the ration they carry and leaves the bank whole; the bank
draws one provision; a fast draws nothing and the back goes hungry by orders, which is a real
trade (a hungry back walks but will not watch yours). THE STAND: quiet keeps every hand down —
no intercept, no shove; hold screens YOU only (a runner at 200 walks, one at 100 is met); meet
it answers at the class's full reach. VOICE quiet silences the road talk; the calls that matter
still come. Every back keeps a SERVICE stripe — kilometres beside you, crates handled, runners
met, sweeps, meals, steadies — and the last thing it did, in its own words.

**THE MUSTER ROLL (16k_musterui.js; O · the survey rail · the Waylighters tab · the manual).**
Everyone under your command on one paper, grouped by where they stand: WALKING WITH YOU, AT THE
FIRES, IN THE FIELD, ON THE ROADS, AT THE POSTS, MENDING. Each plate carries the walker's OWN
figure — `Render.npcRigURL` renders the rig in their hood and scarf, Farkeep grey for the
mountain, the kit's drawn class for a class the registry draws — on a stamped dark plate; the
name; a state plate; a skills stripe in the register's icons; the service stripe; the preset
stamp or HAND-SET ORDERS; the last note. THE WEDGE PLATE is a canvas in the sheet's ink: the way
you walk as north, YOU at the centre, every back at the slot its orders describe with a dotted
tie, the HOLD ring when a stand holds it, empty slots for the backs not yet hired, and — the
detail the sheet earns — a gold ghost mark where a back stands RIGHT NOW when it has not reached
its slot, tied to the slot it is walking to. Figures paint nearest-last. Below it the STANDING
ORDERS pane in the ledgers' grammar: preset plates, four orders on pressed choice plates with the
chosen line under each, and the two trees with tri-state marks over the taxonomy — the parent law
on one back's store. CALL THE ROLL closes the sheet and every back sounds off on the ground, in
turn, in the roll-call words ("Tam: on point, holding your back, eating my own.").

**Proof.** muster.mjs, 13 checks: the registries and the parameterized engine (identity over every
item and verb); default orders and a walker's store apart from the pack's; STATION on real feet
(close / loose / point / two slots); SWEEP refusing then taking a junk drop; THE OVERFLOW lifting
scrap crate by crate with the contract crate staying; THE MESS three ways; THE STAND three ways
with the stripe counting; VOICE, THE SCOUT landing whole, the roll call's lines; the sheet on O
under the modal law — plates with figures drawn, the stripe, five presets, twelve choices, fifty
marks, a wedge plate with pixels on it; the parent law on one back's store (Resources OFF clears
the children, Wood ON alone reads MIXED); the papers, the keys, the lessons; the save. Full
battery **634 tallied checks across forty suites, zero fails**; shop audit CLEAN.

## The working orders (v3.37 — the field and the roads, on the same stores)

v3.36 left three things on the record as REMAINING: orders for the field and the roads on the
same stores, a walker's mood on the plate, and the wedge plate as a HUD card. v3.37 is those
three, whole, plus the v3.35 note about the rail's caps.

**The same stores, in fact.** A hauler, a presser, a mason, a forrester and a charter runner keep
their orders in the SAME `n.orders` store a companion keeps, read by the same engine. The station
goods were already item defs (`cat: 'goods'`), classified under the taxonomy's freight branch —
so THE FREIGHT LIST is a third policy tree (verb `haul`, rooted on `freight`, default: every
trade good ON, the post OFF) and a hauler's list and a charter's list are marks on the ledger's
own tree, per crate kind. The registry (12g_muster.js) adds seven WORK_ORDERS rows and names,
per job, which rows it walks under: FIELD.hauler → THE LOAD + the freight list; FIELD.presser →
THE MARKS; FIELD.mason → THE RESERVE; FIELD.forrester → THE REACH + THE WOODS; ROAD → THE RUN +
THE PACE + the freight list. `NPC.workOf(n)` returns the sheet a walker answers to — the walk's
rows for a companion, the job's rows for a field hand, the road's for a charter — and the muster
roll renders whatever it is handed. A new field job is one registry entry.

**Repaired, never purged.** A v3.36 save holds stores with loot and hand marks and no haul mark
anywhere. `ordersOf` seeds a tree's registry default into a store only when that tree has NO mark
at all in it — every mark the store already holds stands, the working rows take their defaults,
and the pack's ledger is untouched. Proven on a hand-built v3.36-shaped store.

**The orders work the land (15b_npc.js, 13_world.js).** THE FREIGHT LIST gates a hauler's
arrival: of what THIS town needs, only what is on the list; the emptiest allowed shelf first,
what the other end makes preferred. Nothing on the list that the town wants → the pack arrives
EMPTY, the roll says so in the walker's words and a toast says it once — an honest empty pack, not
a silent one. THE LOAD: full is one good to the cap; split is two goods, half each, so two shelves
climb at once. THE MARKS: a presser's clicked point is the first of a CHAIN — ADD A MARK on the
roll arms the ground and the next click appends; the walked line is the valley's own path from
the town through every mark in order and back; STRIKE takes the last mark, never the first. At
every end the presser MEASURES the trail — `World.trailState` samples the polyline at wear-cell
pitch and counts, of the ground that can wear at all, how much is bare or laid — and under COME
IN (the default) a trail bare end to end walks them to the fire with a mail, and the wage stops
with the work; KEEP THE BEAT keeps them walking for as long as you pay. The marks stand on the
ground as gold flags on poles, numbered in order from the town, with the walked line dotted at
texel pitch between them while the presser is near. THE RESERVE: a mason lays only down to the
floor you name (none · keep 20 · keep 60) and says on the roll that it is holding the reserve.
THE REACH: far searches nearly twice the radius for standing wood. THE WOODS: thin keeps every
other tree — after a fell, the next tree the axe would take is KEPT by cell index, for good, and
the one past it falls; the wood stands, thinner. THE RUN on a charter: the post pays appreciation
at both ends as before; freight walks a crate from the freight list onto the emptiest shelf of
the ends in turn for half the thanks. THE PACE: hard comes round in seven tenths of the time and
eats twice for it. The service stripe counts the WORK now — kilometres walked, runs, crates
walked in (and empty runs, in rust), stretches cobbled and the reserve, trees felled and left
standing, the trail's bare fraction and the marks — each job in its own words.

**The mood (MUSTER.MOOD).** Summed live from causes the game already tracks, never stored:
hungry (−6), unpaid (−3), fasting by orders (−2), a meal in them (+1, within the last cycle),
owes you their walk (+2), walking the Grey (−2), walking nights (−1), loaded near the cap (−1),
walking point (−1), in the saddle (+1), went down for you lately (−1), mending (−2), by a fire
(+1), walking in company (+1), seasoned beside you (+1 past ten kilometres), long out of a fire
(−1). Five bands, lowest first: DONE · LOW · WORN · STEADY · BRIGHT, a fresh hire reading STEADY
at nought. The band DOES something: BRIGHT steadies your pack × 1.3 and reaches × 1.15; LOW
× 0.7 and × 0.85; DONE × 0.5 and × 0.7. A band change is said on the ground in the walker's own
lines ("I need a fire, Walker." / "That is enough. Next fire, I sit."), and a companion DONE for
a minute beside a lit town SITS DOWN: off the party, into the pool at that fire, the cargo racked
in the lockers, a mail naming every cause, re-hirable when it lifts. The plate carries the band in
its colour and the causes with their signs — the plate says why.

**THE WEDGE CARD (16b_ui2.js).** The companion chip, grown: every back walking with you on one
glass — their own figure, first name, mood band in its colour with the causes on hover, class,
what they carry, HUNGRY where true — and beside them a LIVE formation glyph at 10 Hz: the slots
the orders describe, the hold ring, you in gold, and a dot in each back's mood colour where it
actually stands in your frame. Click the card to hand over (as before); THE MUSTER cap opens the
roll; the − cap puts the card away and a slim tab stands in for it; the survey rail says SHOWN or
PUT AWAY and toggles it. The choice keeps in the HUD paper (`waylight.hud`).

**The v3.35 note, kept.** The hint strip prints the caps KEYS holds now — rebind map to N in the
manual and the strip reads N beside map at once; reset and it reads M.

**Proof.** workorders.mjs, 16 checks: the registries whole and every station good an item under
freight; a v3.36 store repaired, not purged; THE FREIGHT LIST walking medicine alone then an
honest empty pack; THE LOAD split landing two goods in one arrival; THE MARKS as a chain walked in
order, struck, measured near-nothing fresh; KEEP THE BEAT walking on at 100% and COME IN walking
them to the fire with the mail; THE RESERVE holding at twenty and resuming; THE WOODS thin felling
three and keeping two by cell with the nearest standing tree a kept one, THE REACH re-reading the
ground; THE RUN and THE PACE measured to the provision and the second; the mood's sums, bands and
effects; a DONE walker sitting down after the minute with the mail; the sheet (the hauler's pane,
the freight list by name, a good's box, the charter's pane, the presser's chain with STRIKE and
ADD landing a click as mark two); the wedge card with both moods, a painted glyph, put away and
kept, the tab, the rail, the cap; the hint strip in your keys; the lessons; the save. Full battery
**650 tallied checks across forty-one suites, zero fails**; shop audit CLEAN.

## The posted orders (v3.38 — the posts on the same store, the working world's mood, the survey)

v3.37 left four things on the record: orders for the posts, field-hand mood beyond paid and
unpaid, the wedge glyph on the survey, a presser's chain on the survey. v3.38 is the four.

**The posts on the same store (12g_muster.js, 15b_npc.js).** A post hand walks under three rows
on the same WORK_ORDERS table — `MUSTER.POST.rows = hours · training · keep` — read from the same
`n.orders` store by the same `ordersOf`. THE HOURS: round the clock, DAYS or NIGHTS — the shift
clock only ticks in the hours the hand keeps, so a days hand rests at night with the clock held
(the plate says *resting — the round keeps its hours*), and the lamp-lit round pays the town one
appreciation more per shift because a town that sleeps easier thanks the hand that walks it. THE
TRAINING: the round's own verb, or CROSS-TRAIN — half the lesson to the round's verb and half to
the hand's weakest skill, the note naming which. THE KEEP: wages from the bank as before, or THE
TOWN'S TABLE — no provision drawn, two rations off the town's own shelf each shift, half the
thanks; at the floor (ten rations) the round STALLS and the roll says the table is bare, exactly as
an unpaid round stalls. `NPC.workOf` hands the roll a fourth sheet kind, `post`, and the muster
roll renders it with the hand's stripe: shifts, the skill trained with its progress, the
appreciation given. A lesson, THE POSTED ORDERS, walks on the first post order set.

**The working world's mood.** Five causes join the sixteen: working in the greyfall (−2, read at
the hand's own feet through `Systems.rainAt`), working nights (−2, a field hand at night or a post
hand keeping nights), far from home (−1, a route or a chain past 2.4 km from the town), a town
that thanks them (+1, HONOURED or better), fed at the town's table (+1). A stalled hand is still
out there in it — the weather counts, paid or not. Every band carries a WORK PACE the field speed
reads (BRIGHT × 1.1, LOW × 0.85, DONE × 0.7), and a field hand DONE for the minute comes in to
the fire off the job with a mail naming every cause — the same law as a walker sitting down.
Unpaid, in the greyfall, at night, far from home is that minute.

**The survey (16_ui.js).** Every field hand stands on the sheet as a green pip with its job and
name (rust when unpaid); a presser's chain as numbered gold flags with the walked line dotted
between them; and THE WEDGE at your marker — the formation your orders describe, screen-constant
at any zoom, in your frame (the way you walk drawn as a tick), each back's live spot as a dot in
its mood colour with its name, the hold ring when a stand holds it. The legend names all three.
And the wheel now zooms toward the pointer: the ground under the cursor stays under it.

**Proof.** postorders.mjs, 9 checks: the registry (three post rows on the ten-row table, twenty-one
causes, a work pace per band); THE HOURS on the clock (a morning shift closes, a night one never
starts, nights pay one more); THE KEEP off the shelf (no provision, two rations, half the thanks,
the table on the plate, the stall at the floor, wages resuming); THE TRAINING split to Lumen at
nought; the working causes read at the greenhouse's latitude by night in the greyfall, an HONOURED
town's thanks, the far line; a DONE hauler coming in after the minute with the mail; the survey's
pixels (a flag at each mark, the gold line along the chain, the green pip, the party's dot at the
glyph's scale, the legend); the sheet, the lesson, the save. Full battery **659 tallied checks
across forty-two suites, zero fails**; shop audit CLEAN.

## The losable holdings (v3.39 — towns taken by force, a post that can fall, the grey banners' wars)

v3.34 left three things on the record: towns taken by force, a watchpost that can be LOST, and
wars between third parties beyond the registry's four rows. v3.39 is the three, on the same law —
a doctrine row, a watchpost row, three event rows, one engine, one sheet.

**THE STORMING (DOCTRINE.storm).** The founding's line — "they can take towns by force" — kept
whole. A risen town now takes a third answer beside the quell and the parley: the column goes
THROUGH the door. Five shields, 90 metal and 30 provisions, gated on the mountain road like the
taking. The arrival does not restore the light; it TAKES the town — the lamp goes back up under a
GARRISON of two shields (drawn in the square under Farkeep's grey pennant, the plate reading
GARRISONED — THE REPUBLIC), forty likes go out with the Unlit's banner, three relations move
(Farkeep↔the Unlit, the Unlit↔Waylight, the Keepers↔Waylight), and the garrison EATS: three
rations off the town's own shelf every two minutes, counted on the sheet. A garrisoned town cannot
rise — the rebellion's pick skips it, which is what the garrison is for. The world answers in its
own ink: `unlitReprisal`, a second reprisal row fired by the verb — for ten minutes the Unlit's
drum beats × 1.5 in every town with a lamp to douse. RELEASE THE GARRISON on the banner sheet
frees the town: ten likes come back at once, the rest is earned a crate at a time, and the town's
own choice returns with it.

**A post that can FALL (WATCHPOST.storm).** In the camps' season of reprisal a held watchpost is
rolled once a night: three knives come for the ground. The post HOLDS when its shields, and the
walker standing the fire inside 260 units with every fed back beside them, match the knives — the
mail names them. It FALLS otherwise: the ring is the camps' again with its runners back, the
salvage scattered, the grey pennant lying in the ring for ten minutes with the pole across it,
the nearest town six likes poorer, a stone likelier (0.6), the mail and a lesson. STAND THE POST
on the sheet puts another shield at the fire (40 metal, 10 provisions) up to four — the third and
fourth stand at the pennant's foot on the ground; the sheet shows SHIELDS n/4 and the season's
warning. A post lost once costs × 1.5 to take again, and × 1.5 again for every fall after — the
camps expect the column now; the sheet prints the price and the day it fell.

**Three more wars (EVENTS).** A row, a need, a resolver — the v3.34 door, walked through three
times. `larderRaid` (raiders → the Hollow Fires, by night, a larder a live camp can reach): the
fire burns LOW for seven minutes — its hunting ring halves, so the same ground that bit does not —
and a crate of rations lands in the camp's stash it did not earn on the road. `reaperVisit`
(the Reapers → the Hollow Fires, a larder in the mist): the file walks through and the eaters go
to ground — the larder is HUSHED for five minutes and does not hunt at all. Both write the
RELATIONS ledger on pairs it already held (the raiders and the eaters, the eaters and the file),
both mail, both read on the banner sheet as a plate on the larder's row (RAIDED — BURNS LOW ·
Ns, HUSHED — THE FILE PASSED · Ns). `unlitReprisal` is the third.

**Proof.** holdings2.mjs, 8 checks: the registries; THE STORMING gated then funded, the arrival's
garrison with the love gone, the relations, the season, the mail, the lesson; held ground eating
six rations in two periods, the drum at the season's rate, the hottest town never the pick while
garrisoned, the square's grey, RELEASE; THE POST STORMED and LOST against two shields with the
ring reverting and the dearer retake; STAND THE POST holding at three, the walker with a back
holding at two, four refused and holding by hand, the sheet's rows; the two wars with the larder
biting, not biting, hushed, and the needs resolving from the live world; the save. Full battery
**667 tallied checks across forty-three suites, zero fails** (two parallel-timing flakes — the
glowpass day-beam sample under the guide's edge label, the progression pickup — rerun green
sequentially); shop audit CLEAN.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The standing ground (v3.40 — the letters, the wedge on the compass, the square that rises, the storm seen, the Society's war)

v3.38 and v3.39 each left a line on the record. v3.40 is both lines, whole, on the same laws —
a tree row, a doctrine row, a watchpost row, an event row, one engine each, one sheet.

**THE LETTERS (TREES.post).** The post subtree carried two kinds — letters and the riders'
dispatch — and a mark over two kinds meant nothing a runner could feel. It carries three now:
PARCELS, the town's own to its own (a mended coat, a jar of preserves, a child's shoes — 4 kg,
fragile, a service good filed under the post by the same classifier that files everything). The
fourth tree on the same policy store answers the question the v3.38 record asked: a runner's
round marked for letters fills the town's bag twice as fast, and struck it does not; a parcels
round marked for parcels packs a parcel every second shift, three at most, and the board posts
ONE PARCEL RUN for the nearest lit town carrying what was packed — accepted, the shelf empties;
delivered, it is the Order's service: no fee, thanked by tier, no need line, no letter read
aloud. The riders' dispatch is the Order's own and rides regardless. The plate counts the parcels
packed and the round's last word is the packing; the orders pane shows the tree with its kinds.

**THE WEDGE ON THE COMPASS.** The survey's wedge, read without the sheet. The first draft put
every back at its bearing on the strip — and the frame said no: the strip reads what is AHEAD,
and a wedge walks BEHIND you, so every pip sat clamped at the masked rim, invisible. The answer
is a REAR RAIL under the strip, mirrored like a glass over your shoulder: straight behind is the
centre, a back drifting to your left shows left of it; a back AHEAD (the point station, a scout
that ran on) rides the marks' row at its own bearing. Each pip is its back's first name under a
square in its mood's colour — dim in its slot, BRIGHT when it has fallen more than a stride out
of it. The wedge card put away leaves the pips.

**THE SQUARE RISES (DOCTRINE.storm.rise).** A garrison holds a town by fear or by love. It is
RESTLESS when the town's love is at five likes or less AND the shields are two or fewer; a
restless square rolls once a night and RISES — the shields go out through the gate with the town
behind them, the lamp comes down BY CHOICE before morning (the Unlit's again), Farkeep and the
Unlit a step colder, a stone at 0.5, the title, the mail, a lesson. The storming alone does not
make a square restless — it takes forty likes and leaves the town above the line; hate has to
deepen (the garrison eats the shelf; the town is not delivered to). REINFORCE THE GARRISON on the
sheet puts another shield in the square (40 metal, 10 provisions) up to four, and the square
will not rise against more than two; the sheet reads shields n/4, warns THE SQUARE IS RESTLESS,
disables the button at the most; the world draws as many shields as the square stands.

**THE STORM, SEEN (WATCHPOST.storm.seen).** v3.39 resolved the season's night in a roll even
with the walker in the ring. Now the walker standing the post turns the roll into a fight on
the ground: three knives stand up at the ring's edge and WALK for the FIRE (92 a second), not
for you — a knife that stands at the fire three and a half seconds takes the post while you
watch. The shields knock the nearest knife at the fire's edge back 130 and down for seven, in
turn, on a cadence of 4.5 s divided by the shields; the party meets what comes inside its reach
with the same intercept every runner meets; a knife at your pack is shoved by a free hand or CUTS
for five; the rifle counts every knife on its feet. The storm spends itself at twenty-six seconds
— HELD in the open, the mail counting the knocks between the shields, your backs and your own
hands. A knocked knife LIES where it fell: no new sprite — the rig's own idle row turned a
quarter, head the way it was facing, and a quarter turn keeps every texel a texel (each source
pixel lands on one k×k block), so the doctrine bends nowhere. THE STORM — Ns TO HOLD stands over
the fire; the sheet's row reads THE KNIVES ARE AT THE FIRE. Away from the ring the night is still
rolled as v3.39 rolls it.

**THE SOCIETY'S WAR ON THE CAMPS (EVENTS.bunkerSweep).** The eighth row on the v3.34 law, a
fourth banner's war. Once the cold door is OPENED the Society comes down out of the north by
night (0.4, every fifteen minutes) and sweeps the northernmost camp that stands — it does not
raid, it INVENTORIES: the camp is COUNTED for eight minutes, its salvage gone into the cold
behind the door, its hunting ring × 0.7 (the runners will not walk far from a fire that has been
counted), a concrete stencil with the raised tongue left on a post, COUNTED — THE SOCIETY. The
Society and the raiders a step colder on a pair the ledger already held; the mail; the toast; the
sheet's plate with the count's clock; a counted camp is skipped and the next one south is
counted; the count survives a save.

**Proof.** standing.mjs, 8 checks: the registries; THE LETTERS — the bag at twice the pace only
while marked, the packing on the second shift with the note and the lesson, the cap of three,
idle with the mark struck, the run posted whole for the nearest lit town, accepted (the shelf
empty, not reposted), delivered as a service; THE WEDGE ON THE COMPASS — two pips on the rear
rail inside the strip's visible middle, dim in the slot, one fallen out bright on its own side,
one ahead on the marks' row, the card put away, the party dismissed; THE SQUARE RISES — not
restless at fifteen likes, reinforced to three then four and refused at five with the sheet's row,
restless at three likes under two, the roll missed and stood (once a night), made and risen with
the mail, the relation, the stone, the lesson, a loved thin garrison standing, the verb by hand;
THE STORM, SEEN — started with the walker in the ring (edge, title, lesson, toast, sheet), the
walk, the knock and its cadence, the intercept, the cut and the shove, held in the open with the
knocks counted, lost at the fire with the mail; THE SOCIETY'S WAR — nothing with the door shut,
the northernmost camp counted with its stash gone and the multiplier, the plate, the next one
south; the save. Full battery **675 tallied checks across forty-four suites, zero fails**; shop
audit CLEAN. Frames eyeballed and re-staged until they stood: the storm at night with two knives
on the approach and one lying DOWN, the garrison of three, the restless row, the letters plate
and tree, the PARCEL POST card, the rear rail, the stencil at the eye's height.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The camps' own (v3.41 — the raiders by trade, the parcels addressed, the square's own, the count bought)

v3.40 left five lines on the record and the directive added a sixth: the version had to draw its
own pixel art. v3.41 is the five, whole, and the art is the part that could not be a row alone —
three raider figures and a townsman, hand-drawn in the kit's grammar, because the v3.33 measurement
still stands: no generator fits a person to this grid.

**THE CAMPS' OWN (FACT.CAMP_CLASSES, the camp rows' `roll`).** The camps carried one kind of
runner. They carry four trades now, one row each, and every camp names its people in order: Pass
Camp a chief and two knives, Ridge Camp a bowman, a ram and a knife, Ash Camp all four. The road
sends the knives in the roll's order and never the chief — he keeps the fire, and is drawn beside
the flames of a live camp with his name under him. A storm brings the first three. Each trade is
its stats: the BOWMAN stands off at his range and looses at the shields every six seconds, and
the shield he hits keeps that arm down while the arrow is in it (one arm of two swings on the full
cadence); on the road his arrow staggers and cuts inside 260. The RAM shrugs the first blow — a
stagger, up in a second — and goes down on the second; he walks at three-quarters pace and takes
a fire at six-tenths of the wait. The CHIEF rallies: while he stands the knives get up twice as
fast; put him down — a shield, a back, your own hands or a round, the engine does not care which
— and the storm BREAKS: the knives run for the grey and the post is HELD with the mail saying so.
Every blow in the game goes through one door, `Systems.absorbHit`: the party's intercept, the
shove, the rifle, and the post's shields all ask it whether the man they hit stays down.

**The kit, hand-drawn.** Three 14×22 figures in the raiders' own palette — rust coats, dark hoods,
hide and scrap, the red rag, the plank door — on the kit's shared alphabet plus one letter (P, a
plank): the bowman with a short bow and a quiver, the ram with a door on one arm and a beam over
the other, the chief with the rag across his brow, a pale hide cloak and the long knife at his
hip; and the town's own, a cap, a leather coat, a round wooden shield with a boss and a staff with
a fork on it, in the town's colours. Three frames each, blitted by the same kit blit with a
palette handed in; a knocked figure lies by the same texel-exact quarter turn. The contact sheet
was eyeballed at 6× before a line of engine was written to them.

**THE PARCELS ADDRESSED (DATA.parcelKinds, S.traffic).** A parcel is the town's own to its own,
so it names a door. A town's shelf is a list now, each parcel addressed and of a kind — a mended
coat, a jar of preserves, a child's shoes, a twist of seed, a folded blanket, a sharpened knife,
a bundle of old letters, a tin of buttons. The round packs for the doors the town's traffic runs
to: every completed delivery counts one on the line between its two towns, and the addressee is
drawn by that count plus one — so the parcels follow the roads you actually walk, which is the
only honest way a town could know where its people are. The board posts one run per door, naming
what is addressed; accepted, the shelf keeps what is addressed elsewhere; delivered, each parcel
is opened at the terminal and read aloud on the slip in the keeper's own words. An older save's
count becomes a list the same way (derived, never dropped).

**THE PIP IS A DOOR.** The rear rail's pips take the pointer; a click opens the muster roll on
that back's plate. Nothing happens with another sheet open.

**THE SQUARE STANDS ITS OWN (DOCTRINE.storm.rise).** A garrison holds by fear or by love, and
love has a shape now: a garrisoned town brought back to forty likes sends one of its own under
the pennant every four minutes, two at most — round shields beside the mountain's grey, eating at
their own tables, not off the shelf the garrison tithes. They count against the rising: two grey
and two of the town's own is not a thin garrison. Below thirty likes they go home, which is the
warning before the square is restless; RELEASE takes them with the garrison.

**THE COUNT BOUGHT (EVENTS.bunkerSweep.sell).** The Society does not raid and it does not give.
It sells. While its stencil stands on a camp's post and the cold door is open, BUY THE COUNT on
the banner sheet makes the camp a watchpost by contract — two shields at the fire, the runners
walked north with their inventory numbers, no column and no season of reprisal (the camps saw no
column). The Society and the Order a step warmer on a pair the ledger did not hold before, the
nearest town easier, the stencil kept with the Order's lamp under the tongue: COUNTED — SOLD TO
THE ORDER.

**Proof.** campsown.mjs, 9 checks: the registries (rows, rolls, the kit's geometry and palette
coverage with three distinct frames, the kinds, the recruit and sale rows, the seventeenth pair,
the lessons); the parcels addressed (forty trips to Elm and none to the Mill — thirty-nine parcels
follow; one run per door; the board's line; the shelf keeping the rest; the keeper's line; two
parcels read on the slip; the derived count); the pip as a door; the square standing its own
(none before four minutes, one after, two after the next, two at most; the tithe unchanged; not
thin at two and two; home below thirty; restless at three; back above the line; released); the
camps' own on the road (Ridge by roll, Pass two knives; the bowman's arrow once per cooldown; the
ram's shrug and fall; the slower walk); the storm with the kit (the chief named in the toast; the
bowman standing off and pinning, one arm on the full cadence; the ram shrugging then down for half
the span under the chief's rally; the chief's pace; the break, the run, HELD with the mail; a
second storm LOST to the ram at six-tenths); the count bought (both gates, the offer, the price,
the contract, the ledger reason, no season, sold once); the save. Full battery **684 tallied
checks across forty-five suites, zero fails** (two parallel-timing flakes — the mouse sprint ramp,
the convoy hand-back — rerun green sequentially); shop audit CLEAN. Frames re-staged until they
stood: the kit sheet, the storm with all three trades and the ram lying in his kit, the road with
every trade in view, the chief at his fire, the square's own with the label split off a cottage's,
the sold stencil moved clear of its label, the addressed card without its doubled line, the slip.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The remembering (v3.42 — the survey's marks, a chief who remembers, the town's own on the roll, the grievance, the bolt)

v3.41 left five lines and the directive stood: the version draws its own art, in the same grammar,
to the same standard. v3.42 is the five, and every one of them is a thing the world REMEMBERS —
a camp its chief, a town its parcel, the roll the town's own, the body the arrow, the sheet the
camps' own. The art came first and was eyeballed at 8× before an engine line was written to it.

**THE CAMPS' OWN ON THE SURVEY SHEET.** The sheet drew a camp as a ring and a name. Under a live
camp's fire it draws the camp's roll now, as seven hand-drawn 7×7 marks in one palette — the
knife's blade, the bowman's bow, the ram's plank door, the chief's red rag — with the chief's fire
lit gold in a soft halo while he stands, the rag gone to a stake while he is mourned, and the
Society's tongue on a counted or sold camp. Three screen pixels a texel, screen-constant at any
zoom, drawn by one small blit (`mapGlyph`) the same way the wedge is drawn, with a line under
them in the sheet's own register and a row in the legend. The test reads the sheet's pixels: the
rag's red, the plank's brown, the blade's steel and the fire's gold under Ash Camp; the fire out
and the stake's wood once the chief has fallen; the tongue under a counted Ridge.

**A CHIEF WHO REMEMBERS (WATCHPOST.storm.seen.mourn, EVENTS.campCourting).** v3.41 let the chief
break a storm by going down. Now he does not get up for the camp: the storm's end marks the camp
for the doctrine's mourning span. The red rag goes on a stake where he stood (THE CHIEF — GONE —
the RAGSTAKE glyph, the camp's own memorial beside the reapers' hooded stake in the same
grammar), the road walks one knife short, the next storm comes without him — and the leaderless
fire LOOKS FOR A BANNER. The ninth world event, a court on the v3.34 law: by night a mourning
camp's runners carry the Unlit's word to the nearest lit door that is neither risen nor held,
and the half-flown shutter goes up there with the camp named in the mail; the Unlit are a step
warmer against the Order for it, on a pair the ledger holds. The banner sheet says SHORT A CHIEF
on the camp's row. The span passed, a chief comes up again and the stake comes down.

**THE TOWN'S OWN ON THE MUSTER ROLL (NPC.genOwn, MUSTER.SQUARE, rise.hoursFx).** v3.41 counted a
garrison's recruits. They are people now: a recruit is a record like any hand's, in the town's
kit, on the roll under AT THE SQUARES with a plate — the round shield on the portrait, a stripe
of watches stood and whether they are in the square this hour, a mood that reads their own square
(+2, and −2 round the clock) — and never yours to hire or dismiss: the square decides when they go
home. THE HOURS is the one row on their orders pane, read in the square's own words: round the
clock they stand day and night and the town's love wears (they are away from their fields); DAYS
they stand the light and the town's thanks grow; NIGHTS they stand the dark and the Unlit's drum
is slower for every night a town is seen standing with the Order — twelve seconds off the rising's
clock a period, per recruit. The cover follows the hour, and the rising counts only those
standing. The count on the garrison (`h.own`) is derived from the roll, never a second number.

**THE GRIEVANCE (T.grievance, S.grievances).** A parcel off the pack is not cargo on the ground.
The address rides the crate, and when a knife's knock puts it on the road the door it was
addressed to raises a grievance in its own words: −4 appreciation, a mail naming the parcel and
who it was for, the crate TORN on the pack, on the ground and on paper, the compass naming it a
parcel and keeping the mark. A runner carrying it into a camp deepens it (−4 more); giving the run
up makes what is still on the pack a grievance too (−6, and lost toward its door). Carry it
through after all — on the run, with a made-right line on the slip, or as lost cargo — and the
door thanks you MORE than it would have (+8). Left two days it becomes the town's memory: three
likes gone for good, REMEMBERED on the board's grievances plate, and the town says nothing about
it, which is worse. Appreciation runs below nothing now, as the caught crate already let it: a
town can hold you in debt.

**THE BOLT (T.arrow, Systems.boltIn, Render.arrow).** A bowman's shot was a line and a bruise.
It is an arrow now — texels laid along its line, grid-true at any angle, a shadow under it and a
hand's-width of arc — and it stays IN: the wind comes back at half pace, the wound seeps, A BOLT
IN sits on the HUD and the bolt is drawn in the back shoulder, fletching out. Three hands pull it:
a field medic walking with you, inside reach, in a breath, for nothing (their note, and the trade
learns); a lit town's hands at the terminal; or your own, standing still for the price. The
medic answers — that is the line, and it is a mechanism: a medic in the party is now worth
walking beside a bowman's camp.

**Proof.** remembering.mjs, 8 checks: the registries (the rows, the marks' geometry, the
palettes, the counts); the survey read by its pixels; the chief who remembers (the fall, the
short road, the storm without him, the courting at the nearest door by the clock, the sheet, the
span); the town's own on the roll (records, the roll and the pane, the cover by the hour, the mood,
a period's love and thanks and drum, the sheet, home when the love falls); the grievance (raised,
deepened, given, made right twice, remembered, the board); the bolt (the wind, the seep, the three
pulls, a far medic no medic); the save. Full battery **692 tallied checks across forty-six
suites, zero fails**; shop audit CLEAN. Frames eyeballed and re-staged: the survey's marks
enlarged after the first frame read too small; the roll shot again after a storming's title lay
over it; a dropped parcel renamed on the compass after the frame called it a crate.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The face at the door (v3.43 — the grievance said to your face, the town's own who fall, the chief's return as a scene, the scar, the click into the roll)

v3.42 left five lines and the directive stood: the version draws its own art, in the same grammar,
to the same standard, and nothing ships that the eye has not seen. v3.43 is the five, and every one
of them is a thing the world SHOWS you instead of telling you — a face where a board was, a stone
where a number was, a walk where a flag flipped, a wound that stays on the coat, a plate that opens
where the eye already is. The art came first: eight faces, a bare stake, a scar and its dressing,
eyeballed at 8× on a contact sheet before an engine line was written to them.

**THE FACES (SPRITES.FACES, Render.faceURL).** Eight keepers, eight hand-drawn 16×16 busts on one
alphabet (outline, hair and its shade, skin and its shade, eye, mouth, coat and its shade, white,
an accent, a cap, glass, beard) in eight palettes of their own: Mara Voss's cropped hair and bone
collar, Aldous Wren's straw hat and red kerchief, Bo Tammen's shaved head under a red band and a
grin with teeth, Dr. Callas's wild grey hair and round glasses, Sela Marsh's headscarf and the scar
through one brow, Corporal Finch's peaked cap and thin moustache, Brand's soot and the goggles
pushed up, Keeper Aster's long pale hair and sea-blue shawl. The renderer serves them as cached portraits at any scale, and they appear in two
places: on the terminal beside the keeper's words (every keeper, every visit, grievance or none),
and on the HUD plate at the door.

**THE GRIEVANCE AS A FACE (UI.faceAtDoor, DATA.keeperGrief).** v3.42 raised a grievance on the
board. Now the keeper says it to you first. Crossing into a town's reach with a grievance open
against you — on the same arrival edge the dossier uses — the keeper's plate comes up on the HUD:
their face, their name and role and door, and their words in rust, in their own voice, five lines
each for the five ways a parcel goes wrong (on the road, in a camp, given up, remembered, made
right): Wren waiting rather than angry, Bo SHOUTING, Callas out of polite verbs, Finch filing it
neatly, Brand counting the debt both ways, Aster sad on a child's behalf. The first sentence of it
is said aloud at the door in the world (cut at a word past sixty-four characters, with a dash),
the plate goes down on its own after nine seconds, and the keeper does not repeat it on the next
arrival — only after a while, or when the grievance has deepened and there is a new thing to say.
Made right, the face says THAT, in gold, at the door and on the terminal for three minutes; the
terminal's greeting reads the same ladder (made right > grievance > relit > mood). The board still
carries the plate; the face comes first.

**THE TOWN'S OWN WHO FALL (Republic.ownFall, T.ownFall, DESIGNS.town).** A square that rises under
a thin garrison sends the garrison home. The town's own standing the square that hour — round the
clock, or DAYS by day, or NIGHTS by night — do not all get home: each has an even chance of
falling, and one who falls is a stone on the roll, a legacy row in the town's kit with the fate
written (fell when the square rose at Mill Town), the shield on the portrait, the watches stood as
the count. The first fall reveals THE FIELD STONES at the fields' edge past Haven, a ground of its
own beside the walkers' and the hands' — stones with the round shield cut in for an accent, the
names staggered on two lines so they never touch, "stood the square" for the epitaph, HOME for the
stamp — with its mail, and the town is five likes colder for each of its own it lost standing for
the Order. The memorial sheet reads the ground and the card the same as any.

**THE CHIEF'S RETURN, AS A SCENE (Republic.tickChiefs, RETURN).** v3.42 let a chief come back when
the mourning span passed, as a flag. He walks in now. The span passed at a live camp, a man starts
at the ring's edge and walks six seconds to the fire — the camp still short a chief while he walks,
the rag still on the stake, A CHIEF COMES UP under the fire — reaches the stake, says it (He was my
brother. The fire is mine now. Rag down. Rag on.), and in the next breath and a half takes the rag
down: THE RAG COMES DOWN, a burst, the camp whole (the mail, the lesson), the road walking whole,
and the pole standing bare beside the fire for a day after. The stake stands in ONE place through
all of it — rag on it while he is gone, rag down when the new one takes it, bare a day after — so
the eye never sees a pole move; the first frame of it did, and the render was corrected before the
scene was called seen. A camp taken or pacified in the span never gets its scene.

**THE SCAR (T.scar, Systems.dressScar).** v3.42 put a bolt in the shoulder and three hands to pull
it. Pulled, it leaves a scar now — drawn on the coat where the bolt was, a dark red cross on the
rig's own texel grid — and the wind's ceiling stands at 85 until it is dressed, three times: by a
field medic walking with you (once a minute inside reach, their note, the trade learns), or by a
lit town's hands once a visit at the door, or nothing. The HUD counts the dressings (A SCAR · 2/3
DRESSED); the dressing is drawn over the cross once a hand has wound it, a white patch. Dressed
thrice, the ceiling lifts and the scar closes in a day; undressed it hangs on and closes late, in
two. A texel law came out of it: an overlay stamped ON the rig (the bolt, the scar, the dressing,
the snow cap) is snapped to the rig's own buffer origin, whole pixels with the coat, never a
half-texel off it — the first dressing frame read soft at 8×, and the whole family was moved
onto one stamp.

**THE CLICK INTO THE ROLL (UI.campRollHTML).** The survey's marks were a reading. They open now:
hovering a live camp's marks on the sheet shows the camp's roll — every trade with its mark, name
and line, the fire's keeper (the chief keeps it; or GONE — the rag on a stake, nobody keeps it),
and how many walk the road and come to a storm — and a click on the marks pins it. Pinned, the
plate stands BESIDE the marks (to the right, or the left at the sheet's edge) so the marks and
their line stay in view under it, no walk is planned, the sheet stays open, moving away leaves it,
and the next click anywhere lets it go and plans no walk either. The camp's own on the sheet is the
same registry the roll reads.

**Proof.** faces.mjs, 8 checks: the registries (eight faces, distinct, served; the bare stake and
the scar's rows in their palettes; five lines in every keeper's voice; the rows; the town design;
the four lessons, fifty-five in all); the face at the door (the plate, the words, the say, once and
then again when deeper, down on its own, made right in gold, every keeper at the terminal); the
town's own who fall (the one on NIGHTS fell, the one on DAYS was home; the stone, the ground, the
mail, the card); the chief's return (begun at the ring's edge, still gone while he walks, the line
at six seconds, whole at seven and a half, bare a day); the scar (the ceiling, the medic's minute,
the town's once a visit, lifted, healed, late); the click into the roll (hover, pin, stays, let go,
the gone row) by a real mouse on the sheet; the save; no errors. Full battery **700 tallied checks
across forty-seven suites, zero fails**; shop audit CLEAN. Frames eyeballed and re-staged: the
return scene shot again with the Walker's own bark worn out and the camera cut (the debug clock
holds the frame's fx too, so a bark never fades under it); the chief's long line shortened to one
say-width after it wrapped into his head; the stake moved to one place after the first frame put
the chief on top of it; the scar frames moved out of the approach ring (the HUD fades there) and
off the light's edge; the pinned plate moved beside the marks after the first frame put a lid over
them.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The word at the door (v3.44 — the Walker's answer, the kin in the square, the new chief's grudge, the scar on the stone, the road to the ring)

v3.43 left five lines and the directive stood harder: no function ships without its own pixel art and its
polish, to the HD-2D standard. v3.44 is the five, and every one of them turns something the world DID to
you into something you DO back — a keeper's grievance answered with your own face, a fallen shield's kin
keeping the place, a chief you felled coming back as a different man with your name in his teeth, a scar
carried to your stone, a camp's road walked from the sheet. The art came first: the Walker's face, six
survey marks, the kin, the new chief, the ring pin, the sworn parcel — eyeballed at 8× on a contact sheet
before an engine line touched them.

**THE WALKER'S FACE (SPRITES.WALKER_FACE, Render.walkerFaceURL).** The keepers had faces; the Walker had a
vector portrait drawn with arcs. Now the Walker has a bust on the keepers' own 16×16 alphabet — the hood up,
the face in its shadow, the trim at the throat — bound at draw time to the coat they cut at the tailor: the
hood and skin they chose, the coat and its trim from the worn palette. It answers a keeper on the door
plate, sits on the death slip and the skills sheet, and goes to the stone: a legacy row now keeps the
Walker's look, so a new stone's card carries the bust in that coat, not a stranger's. The procedural
portrait stays where it was for the hands (their busts are the next line; see the roadmap). The courier
rig stayed as it was until v3.50 drew the courier set by hand at 32×32; the face is a plate, not the walk.

**THE WORD AT THE DOOR (T.word, Economy.giveWord).** A keeper who says a grievance to your face can be
answered, and the answer is a mechanism, not a line. On the door plate — under the keeper's words, with
your face and your name beside it — and on the rail (P and X) and on the board's grievance row, two
answers with their own marks. A PROMISE (the knotted string) binds you: the town WAITS the word's two days
instead of remembering; the parcel wears the SWORN string wherever it lies — on the pack, on the ground
(a parcel on the ground is drawn as a parcel now, paper, string, knot, not a generic crate), on paper;
the guide walks your word first; kept inside the span, the door pays two over the making-right and the
town is a like warmer, and the keeper says your word was kept; the span run out, the word is BROKEN and
the town remembers at six likes for good, the keeper reads your word back to you at the door, and the
board says YOUR WORD, BROKEN. An APOLOGY (the open hand) pays five appreciation now, at the counter, and
when the grievance's days run the town lets it go quietly — the likes kept. Thirty-two new lines, four a
keeper in their own voice: Bo takes your WORD or names the saw after you; Callas files a broken word
under annuals; Finch draws a small box around a kept one. A memory cannot be answered; a grievance is
answered once. The Walker says it aloud at the door in their own voice (You have my word. It comes
through. / That one is mine. I am sorry.).

**THE KIN IN THE SQUARE (rise.kin, Republic.kinAt/stonesOf/recruitEvery, FIGURES.kin).** A town's own
who fell now leave kin. Where the shield stood, a figure in a grey mourning shawl with a lantern held low
keeps the place for a day — in the square, lit or the Unlit's (a square that rose is dark, and the kin
stand in it all the same), their lanterns punching their own holes in the night — and one stands on the
centre path at THE FIELD STONES, turned to the newest stone. A town that has buried its own recruits
slower: two minutes longer on the clock for every stone, up to three; the banner sheet says so, held or
released. Its own in the square feel the stones in their mood: one stone, a cause; more, the heavier
(twenty-five causes now). The stone mark (7×7) carries it on the plates.

**THE NEW CHIEF'S GRUDGE (storm.seen.grudge, Republic.tickGrudges, KIT.chief2).** The chief you put down
had a brother, and the eye should see it: a camp's chiefs alternate two hand-drawn men now — the first,
and the new one who walks in at the return with a beard at the jaw, a hide vest, a long spear on the
road-side and the same rag on the brow. The storm remembers WHOSE hand put the chief down — your shove,
your round (the walker), a back's intercept, a shield's knock — and a chief felled by the Walker's own
hand comes back with a grudge: the nearest post you hold is his first storm, the NEXT night at the
storm's hour, in or out of the reprisal season, with him among the knives; he says so at the fire when
you come near (You put him down. Ridge Camp first.); THE CHIEF — A GRUDGE under the fire, the grudge
mark (the rag with a blade through it) on the survey sheet with a rust halo and THE CHIEF HOLDS A GRUDGE
— YOUR POST FIRST under it, the roll and the banner sheet naming the post. Stood, the storm is SEEN and
his (THE GRUDGE on the title, his camp's knives at your post); unstood, it is rolled like any other.
Held or lost, the grudge is paid and he does not carry it twice; a post taken or pacified voids it; three
days with no post to storm and it cools. The projection carries the grudge, the chief's generation and
whose hand it was.

**THE SCAR CARRIED TO THE STONE (S.pStats.scars, MARKS.scar).** A scar that closes is written on the walk
— who pulled the bolt, who dressed it, whether it closed late — and goes to the stone with you: the coat
hung up or the walker fallen carries the count (open scar included); the memorial card shows a mark for
each (the scar's cross, 7×7) and says how many; the stone itself is notched in the scar's red, up to three,
centred on the face by tier. The manual's page for the scar carries the wound in plates — the Walker's own
rig with the bolt in, the scar, the dressing, composed by the renderer from the registry's rows at whole
texels — and the stone's page two more.

**THE ROAD TO THE RING (UI.ringWalk, RINGPIN).** A pinned roll on the survey sheet carries the camp's road
as a line — the road mark, the distance to the ring's near edge, or how far inside it you stand — and a
click on it plans the walk to the near edge of the ring (just outside the loaded pack's danger ring, so
the feet find a way), lets the roll go with the sheet open, and plants the ring pin (a stake with a rust
pennant, 7×11) on the sheet with THE RING · ASH CAMP under it in place of the numbered circle; the wedge
walks it with you as it walks every planned road. The pinned plate now stands clear of the marks AND the
line under them (the grudge's line is long), and the plate's own clicks answer: the road walks, anywhere
else lets go.

**Polish, on the same law.** The lantern in hand is stamped on the rig's own texels now (a handle, a 2×2
glass) through the v3.43 rig stamp, no fractional widths. The room's greeting answers the word given from
the board without reopening. The memorial's kin and the stones' notches read by tier. The survey's pinned
plate moved off the marks' line.

**Proof.** word.mjs, 11 checks: the registries (the Walker's face bound to the look, six marks, the kin,
the new chief distinct from the first, the ring pin, the sworn glyph, three rig plates, the rows, the
doctrine, thirty-two keeper lines, twenty-five causes, sixty lessons); the promise kept (the plate by a
real click, the rail, the string, the guide, the board, the greeting, the town waiting, kept over made
right, a like warmer, the face); the word broken; the apology from the board by a real click; the kin
(two named, the slower clock, the mood, the sheet, home in a day) and the kin SEEN by pixel on the game
canvas; the grudge end to end (your hand, the new man's kit, no target without a post, the next night not
the same one, the say, the sheet, the storm from his camp with him in front, paid, cooled); the scar to
the stone (the record, the plates, the card, the notches by pixel); the road to the ring by a real click
on the pinned plate and by the engine's own door; the save; no errors. Full battery **711 tallied checks
across forty-eight suites, zero fails** (two parallel flakes rerun green sequentially); shop audit CLEAN.
Frames eyeballed and re-staged: the plate's marks read at the keeper-face size until a rule sized them;
the answers wrapped until the plate widened and the labels shortened; the parcel on the ground read as a
crate until the ground drew the parcel's own glyph; the kin stood on the stones until they stood on the
path; the storming's title lay over the kin until the frame drained it; the chief's line sat on his head
until it rose; the pinned plate covered the grudge's line until it moved out.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The word kept (v3.45 — the hands' faces, a word remembered, the kin's errand, the grudge answered, the line at the ring)

v3.44 left five lines, and the directive stood: no function ships without its own pixel art and its polish,
to the HD-2D standard. v3.45 is the five, and every one of them makes a thing you did last time count this
time — the people who walk with you wear their own faces, a town keeps the book of your word, the fallen's
kin ask for what was left, the chief's grudge can be answered at his fire (and the camp that cut down one
of yours is marked for it), and a walk to a ring ends with the line standing at its edge. The art came
first: the hands' layers, two chiefs' faces, nine marks, the kin's shield and lanterns and the sealed letter
— eyeballed at 8× on kp_sheet.png before an engine line touched them.

**THE HANDS' FACES (SPRITES.HANDS, handFace(seed, trade), Render.handFaceURL).** The keepers and the Walker
had busts; the people you hire still wore vector portraits. Now every hand wears a 16×16 bust on the same
alphabet, composed from layers by their seed: a skin from six pairs, a jaw (square two times in five), a
hair from seven (cropped, long, a bun, curls, buzzed, swept, a braid — and the old go bald), a beard or
stubble, glasses where the trade allows them, and the TRADE drawn over all of it — the courier's blue cap
and gold scarf, the rigger's goggles, the scavenger's hood and mask, the lightkeeper's mantle and gold pin,
the mountaineer's fur band with the rope coiled at the shoulder, the medic's white wrap and green cross,
the hearthkeeper's plum kerchief and apron, the drifter's wide brim, the lamplighter's deep hood and clasp,
the Farkeeper's grey helm and gorget, the town's own flat cap. Hair never grows through a hat: every trade
names its brim row and the hair stops there. The same seed and trade is the same face every time; forty
seeds in every trade compose in palette and nearly all distinct. They are worn where the hands are met: the
terminal's hire cards (2×), the Waylighters (grey while they mend), the muster plates beside the figure
(3×), the memorial's Farkeeper rows (4×), the passage slots (the Walker's bust in their own coat), and the
new walker's sheet, where the bust follows the swatches as the coat is cut. No two hands answer to one
first name any more — the cards, the roll and the line call them by it.

THE WHOLE-PIXEL LAW. The sheet's global `box-sizing: border-box` had been eating the frame of every framed
portrait: a 32-pixel face drawn at 2× was being shown at 28 pixels, off the grid. Framed portraits are
content-box now and every face URL is asked for at exactly the size it is shown (the terminal's keeper at
3×, 48 pixels; the door plate and the muster at their own); the suite measures the shown size against the
drawn size.

**A WORD REMEMBERED (Economy.book/bookWrite/canPromise/answerable, T.word.errand*).** A town now keeps a
book of your word: kept, broken, sorry, a log of the last twelve. Kept words are credit, and at two the
keeper posts THE KEEPER'S ERRAND on the board — a sealed letter (paper, red seal) for the farthest lit
door, two days, service of the Order, asked to your face in the keeper's own voice. Carried through inside
the word it pays more than any run: appreciation and likes at home, appreciation at the far door; the far
keeper breaks the seal on the slip ("…reads it once, and puts it inside their coat"), the slip says THE
KEEPER'S ERRAND — KEPT with the home keeper's own line, and no second errand posts without new credit. A
broken word — a promise run out, or the errand late — SHUTS the door to promises there: the plate shows
PROMISES SHUT and offers only the apology, the rail prints X and no P, a promise is refused in the keeper's
own words, the board and the terminal header say so. A grievance there made right without a word opens the
door again (the mail). The terminal header carries the book in marks with its status (AN ERRAND ON THE
BOARD / THE ERRAND — hours left / PROMISES SHUT); the Ledger tab writes the book out, row by row. The
keepers' lines are spoken in sentences: a thing's name that opens one stands capitalised there.

**THE KIN'S ERRAND (Republic.kinErrandsOpen/kinWaits/kinLight, S.kinErrands, T.kin).** The kin who kept the
place now ask for something. When a square rises and the town's own fall, each leaves a thing in the square
— a round shield or a lantern gone cold — and the kin write (the mail, "<kin>, at THE FIELD STONES"). The
shield lies face-up in the square, the lantern dark beside it; the compass marks the square's worth as one
mark. After the day in the square, the kin waits at the stones. The shield carried home and given there
marks the stone's row HOME, warms the town, and the kin write again. The lantern is harder: cold at the
stone, the guide sends it to the nearest lit waylight, where the rail offers the flame; lit, it hangs on
the pack's back with its own glow and its own light in the night, the HUD counts its fifteen minutes, and
it burns out on the clock if the walk is long — take the flame again. Set lit at the stone, the row is
marked LIT and the lantern burns beside the stone at night. The memorial card carries both marks. An errand
left its three days goes home with the kin. The keepsakes file under Curios › Keepsakes in the ledger's
tree, and the dossier never puts one in a locker.

**THE GRUDGE ANSWERED (Republic.parley/standAt/truceAt/pactAt, T.parley).** At the new chief's fire the rail
prints P, and the parley plate carries his face (the new man's, on the keepers' alphabet — two chiefs'
faces, the rag on both), the Walker's, his line, and three answers with their marks. THE GIFT (provisions
and metal from the bank) cools the grudge. THE STAND — fifteen seconds: his runners come in and ring the
Walker at arm's length without cutting, the HUD counts; stood out, the grudge cools and a truce holds for a
day — loaded inside his ring, his runners let you walk; walked away from, his storm comes tonight and the
mail says you walked. THE WORD holds his fire from the column for three days; a column sent against it
breaks the word, every fire hears (a season of reprisal), and no fire takes your word after.

THE WALKER'S SCORE (S.scores, MOOD cause `score`). When a camp's knife or bolt fells one of the party — the
companion takes the blow that would drop you — the score is set against that camp: the mail, the lesson;
the muster roll marks the one who went down (FELLED BY ASH CAMP'S KNIVES — YOUR SCORE); walking again they
carry a score to settle and meet that camp's runners from farther (not another camp's); it is settled when
the camp is taken, stood down, or its chief falls, and cools in three days. The survey sheet draws the
score's mark under the camp, and the camp's roll names it (twenty-six causes now).

**THE LINE AT THE RING (S.ringHold, T.ring).** A walk planned to a ring puts THE RING on the compass with
its pin and the distance. Arriving, the line holds: the backs stand abreast on slots a stride apart across
the camp's bearing, each turned to the camp, the pin planted where it holds and THE LINE HOLDS AT ASH
CAMP'S RING on the ground; the compass reads THE RING · ASH. Walked away from, or held past two minutes, or
a new walk planned, the line lifts and the wedge follows again.

**Polish, on the same law.** THE LAMP LAW — a lamp lights what is round it, never its holder's own texels:
the lamp's corona now lies behind the Walker, centred on the glass in hand, with only a small glint over
the sprite; the coat keeps its navy at the chest (a pale wash of some fifteen hundred pixels before, none
after), the pack keeps its tan, and the kin's lantern on the pack's back glows at itself. THE CROWDED
STRIP — the compass measures its words: a mark whose words would land on a placed label keeps its pin bare
at its bearing and gives its words to the hover; an ordinary mark whose pin would land on a pin yields; a
back walking ahead never writes its name over a mark's words. THE LABEL LAW — a label on the ground never
lands on a label: one that would is stepped down a row, so a line of names at a ring reads as names.

**Proof.** kept.mjs, 12 checks: the registries (eleven trades × forty seeds in palette, the trade read
off each face's own texels, two chiefs, nine marks, the kin's things, twenty-six causes, sixty-six
lessons); the faces worn (the sheet, the cards, the muster, the passage, the whole-pixel law measured);
the book and the errand end to end; broken, shut and opened; the kin's errand (the lantern seen by pixel,
the burn, the expiry); the parley (the gift by a real click, the stand, the walk-away, the word kept and
broken); the score (set, the roll, the mood, the reach against Ash and not Ridge, settled, cooled, the
sheet's mark by pixel); the line (the compass, the hold, the slots, the facing, the pin by pixel, every
name drawn and no two labels overlapping, the release); the save; the lamp law and the crowded strip
(pixel-sampled, measured); the keepsake in the book; no errors. Full battery **723 tallied checks across forty-nine suites, zero fails** (three parallel flakes — the
fire's frames, the camera's zoom, a station's walk — rerun green sequentially); shop audit CLEAN. Frames
eyeballed and re-staged: the lamp's corona washed the Walker's own coat until it went behind him; two hands
named WREN stood in one line until no two hands could share a first name, and PETRA and HALLA ran together
until the label law; the compass wrote UNLIT over the stones until it measured its words; the flame's HUD
frame sat over a 2.6× world until it was taken at the walking zoom; the fire frames carried the guide's card
until it was put away for them; the new walker's bust scrolled out of its frame until the sheet came back to
the name; a keeper opened a sentence with a lower-case thing's name until the lines were capitalised by the
sentence.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The word carried (v3.46 — the word on the wire, the kin's thanks, the truce as a road, the score settled, the line's orders)

v3.45 left five lines — my proposal, not the docs' — and the directive stood: no function ships without its
own pixel art and its polish, to the HD-2D standard. v3.46 is the five, and every one of them carries a
thing past the place it happened: a word walks the wire to the towns that did not see it, a finished
errand sends something back, a truce becomes a road your runners use, a paid score is walked to the ring
and said, and a line at a ring takes an order. The art came first: fourteen marks, the letter on the wire
(kept and broken), the truce stake, the settled stones, the chief's runner's bundle on the rig's grid and
six keepsakes (a mark and a token each) — eyeballed at 8× on wc_sheet.png before an engine line touched
them.

**THE WORD ON THE WIRE (Economy.wireWord/wireWords/wireWordAt/tickWire/wordWeight, T.word.wire).** A word
written in a town's book — kept or broken — now walks the wire to the two nearest lit towns, on the wire's
own route (the charter road where one is built, straight where none is), at the wire's pace. It is seen:
a letter on the world, paper with a gold seal for a word kept and a rust seal for a word broken, a tail of
its seal's colour behind it; on the survey sheet the route faint and the letter on it. Landing, each town
hears it — a word kept warms it by a like and by appreciation, a word broken cools it by a like — and the
keeper says it at the door in their own voice ("The wire says you kept your word at Elm Farm. I heard it
before you were in my yard."). The book logs what it heard; every connected terminal's header carries ON
THE WIRE — kept · broken — and, on its own row, what that town heard last.

**THE KIN'S THANKS (Republic.keepsakeOf/keepsakesAt, SPRITES.KEEPSAKES, DATA.keepsakeLines,
T.kin.keepsakeLikes).** An errand finished — the shield home, the lantern lit — and the kin give the
Walker something of the fallen's to carry: one of six keepsakes (a whetstone, a brass button, a carved
bird, a tin whistle, a pressed flower, an iron ring), the same thing for the same name every time, named
for them ("Halvard's tin whistle"), with the kin's own line in the mail. It hangs under the pack on its
string, two at most, on the rig's own grid. Every delivery into that town with it is a like warmer, and
the slip says THE KIN'S THANKS; the town's plate carries it; the dossier never stores it; and when the
Walker hangs up the coat, the memorial card carries what they carried.

**THE STONE'S FLAME (Republic.kinTakeLantern/lanternOff, T.kin.relights/relightLikes).** A lantern set lit
at a stone burns through the night it was set and goes out at the next dark, and the kin ask again: the
mail, the lesson, the stone's flame on the compass, the guide's step. The cold lantern stands at the
stone; taken from it (G), given a flame at any lit waylight (L), set back (G), it burns and the town is
warmer. Twice; after that the kin keep it themselves. Left its days, the kin carry it to the waylight
themselves — it takes them the whole of a night.

**THE TRUCE AS A ROAD (Republic.truceRoadFor/truceRoads/ringCross, T.parley.roadMul).** A camp holding a
truce or your word opens its ring to your charter runners: a run whose line crosses it comes quicker by
the road's multiplier, the run's note names it, the camp counts the runs. Where the line meets the ring
the white rags stand on their stakes, THE TRUCE ROAD on the ground; the runner is seen walking through,
and the camp's knives let him by. The survey sheet draws the road dashed across the ring with the rags
and THE TRUCE ROAD — <RUNNER>'S RUN; the camp's roll names it.

**THE CHIEF'S RUNNER (S.giftRunner, T.parley.giftBack).** On the pact's last day the chief sends a runner
from his fire to the nearest lit door: the white rag in his hand and a bundle on his back, drawn on the
rig's own grid; the compass marks him. Arriving, the bank takes the gift (metal and provisions, the mail,
the lesson). If the word breaks while he walks — a column sent against the fire — he turns back, THE
RUNNER — TURNED BACK, and nothing comes.

**THE SCORE SETTLED (Republic.startSettle/tickSettle/settleStones, S.settle, DATA.settleLines, T.score,
MOOD cause `settled`).** The take, the stand-down or the chief's fall now PAY a score; it is not yet
settled. The mail says so, the plate says ASH CAMP IS PAID — WALK <NAME> THERE, the compass marks it, the
guide walks you. At the ring's edge with them in the party, the one who fell steps out toward the camp,
stands a moment, says it in their own words ("They put me in the ditch. Now the ring's ours. Square."),
and sets a stone down beside where they stood. The settled stones — a cairn with a red thread — stand
there after, named on the ground and on the sheet, and the camp's roll names them. The score closes; the
plate carries SETTLED AT ASH CAMP (walked to the ring and said it — how — the day) and the Walker's own
line; the mood carries a score settled for a day (twenty-seven causes). A score paid and never walked in
three days is let go (the mail).

**THE LINE'S ORDERS (Systems.lineOrder, UI.lineOrders, S.ringHold.order, T.ring).** At a held line the rail
prints Q, and the line's plate carries every back's face, the lead's line and two orders with their
marks. HOLD — the line steps up to the ring's very edge and keeps it while you walk in alone (as long as
five minutes), a rope strung hand to hand along the backs; a knife that comes out after you near the
line is turned back to its fire — the U of the way back over his hood, the backs' "Not past us.", his
"Hah— fine." — and the back who turned him has it on their plate; walk back out past them and they fall
in. COME — the line forms on the Walker and walks in abreast: a knife will not close on it and gives
ground (a bow still looses), there is no running while the line walks, and out past the ring's edge it
breaks back into the wedge. The compass reads THE LINE HOLDS · ASH or THE LINE COMES · ASH; the ground
reads THE LINE HOLDS — YOU GO IN ALONE or THE LINE COMES IN.

**Polish, on the same law.** THE PACK — a keepsake and the kin's lantern hang on their own strings: they
no longer ride the tower over the head as a smeared crate or the duffel under it. THE CARAVAN — the wire's
pulses had never drawn (the route's length came back NaN from object points); they walk the wire now.
THE HAND'S LAMP — the first companion's small lamp had never lit (it read a position the backs never
carry); it lights the dark round them now, and so does the one walking out to settle. THE SPOKEN LINE — a
line longer than a row climbs from where one row sits, instead of hanging down over the speaker's face.
THE KNIFE'S HEADLAMP — thrown up-screen, away from the eye, the fan lies behind his body; a knife turned
back looks at nobody. THE STRIP'S NAMES — backs abreast no longer run their names together on the
compass rails. THE SHEET'S RAGS — a rag that would fall on a door's name is left to the door. THE ORDER'S
WORDS — a standing order's words on the ground hold their place first. THE LINE'S FACES — three backs sit
in one row on the plate. THE STRING HOLDS — a knock from a knife or a grab from the grey takes a crate,
never a keepsake.

**Proof.** carried.mjs, 10 checks: the registries (fourteen marks, the letter, the stake, the stones, the
runner's bundle, six keepsakes, the rows, the voices, twenty-seven causes, seventy-three lessons, Q on
the rail); the word on the wire end to end (the letter pixel-sampled on the canvas and the sheet, the
landing, the door, the weight, the ledger, a broken word cooler); the kin's thanks (the token under the
pack sampled against the same frame without it, the slip, the plate, the dossier, the card); the stone's
flame (the cold lantern sampled — dark, no flame); the truce road (closed hostile, open at truce, the
rags sampled, the sheet); the chief's runner (the bundle sampled, the gift, turned back and nothing
comes); the score settled (the stones and the red thread sampled); the line's orders (a real click each,
the rope sampled, the U sampled); the save; no errors. Full battery **733 tallied checks across fifty
suites, zero fails** (the fire's noon frame, a parallel flake, rerun green sequentially; the kept suite's
arrival step now clears a knock taken in the gap before it); shop audit CLEAN. Frames eyeballed and re-staged: the keepsake rode the tower as a
smeared crate until the pack hung it on its own string; the likes' diamonds hung frozen over three frames
until the frames let them go; the rag on the survey sheet stood on FOUNDRY until a rag at a door was left
to the door; the heard line ran off the terminal's header until it took its own row; the settling was
shot in the dark with its line said over the speaker's face until the Walker walked it with them in
their light and the spoken line climbed; the HOLD frame lost the Walker off its top until it was framed
wider; the compass came back black under a town's first-sight letterbox until the scene was spent; the
turned knife's U sat on his face and his headlamp washed him until the U went over the hood and the fan
behind him; the line's words lost their place to the settled stone's until a standing order's words held
first; two backs' names ran together on the rear rail; the chief's runner stood in a clump with a route
runner and a knife until he was taken out of the ring, alone; "+1 like a delivery" read wrong until it
said "+1 like on every delivery here".

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The word answered (v3.47 — the door that heard, the keepsake set down, the road kept, the stone's keeping, the line's watch)

v3.46 left five lines. They were my proposal, not the docs'. The user took them whole ("BEGIN REMAINING
(ROADMAP 4n)"), and the directive still stood: no function ships without its own pixel art and its polish,
to the HD-2D standard. v3.47 is those five. Each one answers something v3.46 set going:

- a word carried down the wire is answered at a door that never saw it;
- a keepsake carried on the pack is set down where it belongs;
- a truce road is kept, or torn down;
- a settled cairn is kept, or kicked over;
- a line held at a ring is left there for the night.

The art came first and was eyeballed at 8× on wa_sheet.png before any engine line touched it:

- seven marks;
- the six keepsakes as they lie at a stone;
- the truce stake kept (a gold knot), stripped (a scrap on the nail) and its rag in the dirt;
- the settled stones kicked over;
- the watch fire in two frames;
- the rag on its switch at the pack;
- the road's gift.

Where the user's words left a choice open, the reading below is mine and is marked as mine.

**THE WORD ANSWERED (Economy.answer/answeredAt/doneRight, T.word.answer {kept 3, broken 2},
DATA.keeperGrief[*].answered/hearsay/seen).**

A kept word heard on the wire. A door that has never seen you keep a word there counts the kept words it
hears on the wire. At the third it answers: the keeper's errand posts on the wire's word, before you have
kept anything at that door. This comes with the mail, the lesson and the book's line. The plate says it in
the keeper's own voice ("Wire says three. Kept. Not here. Here's mine. Sealed. Relay. Two days. Show me."),
the header reads AN ERRAND ON THE WIRE'S WORD, and the board's card is tagged THE KEEPER'S ERRAND · ON THE
WIRE'S WORD. Accepting it spends the wire's credit, and the keeper says so to your face. Once it is kept at
the far door, the door has seen you itself, and the wire posts no more for it.

A broken word heard twice. A door that hears your word broken twice shuts BY HEARSAY. The mail, the
lesson and the book record it. The plate's chip reads PROMISES SHUT — BY HEARSAY with its own mark, and the
Ledger's row reads the same. A promise asked there is refused in the keeper's words ("Wire says two. Broke.
Didn't see it. Don't need to. No words here. Do right here first.").

Making it right. *My reading* of "until you make things right there": the door must see you do right
itself. That means a delivery walked through it in good time (any grade but C), or a grievance there made
right as before. The slip then says SEEN AT THE DOOR in the keeper's words, and the door opens. A late
delivery leaves it shut. The survey sheet puts each door's mark (answered or hearsay) beside its name.

**THE KEEPSAKE SET DOWN (Republic.keepsakeRow, the stone's G, SPRITES.KEEPSAKE_SET, DATA.keepsakeSetLines,
T.kin {setLikes 3, setAppr 4, setR 60}).**

While a keepsake rides the pack, the compass marks the fallen's stone ("set it down · Halvard"). At the
stone, G sets it down. The thing leaves the pack, and the stone's row in the memorial wears it. The town is
warmer by three likes and four of appreciation. The kin write one last time, in their own line for that
thing ("The carved bird is on Halvard's stone. A child from the square came to look at it this morning and
did not take it. That is how I know it is in the right place… I won't write again."). The lesson follows.

The thing lies at the foot of the stone, drawn as it lies: six objects at the stone's own scale. The
memorial card reads "the tin whistle at the stone — you set it down". A stone takes its keepsake once.

**THE ROAD KEPT (Republic.roadCamps/giftFor/takeRoadGift/tickRoads/onRoad/onAnyRoad, items.fireGift,
T.road {gift: 30 provisions + 20 metal, kg 6, reach 150, roadW 70, bareDays 1}, TRUCESTAKE_KEPT/BARE,
RAG_DOWN, RAG_CELLS).**

Taking the gift. While a camp holds your word and a charter road crosses its ring, every lit board offers
THE ROAD'S GIFT. *My reading* of "walk the road with a gift": the gift is taken at any lit door, paid from
the bank, and walked to the chief at his fire. It rides lashed on the pack, pale cloth tied with twine, and
the compass and the guide follow it.

Keeping the road. Given at the fire, the gift keeps the road. The word is renewed and counted, the chief
says it, and the mail, the lesson and the roll record it. The poles wear a gold knot new for a day, with
THE ROAD KEPT on the ground and on the sheet.

The word run out ungifted. A new man comes up at the fire. *My reading* of "a new chief" is the camp's
new man in the chief's place, with his own face. His knives walk out to every pole and pull the rags down.
Mid-pull the knife is seen at the pole; after, the poles stand bare and the rags lie in the dirt, with THE
RAGS DOWN — A NEW MAN AT THE FIRE on the ground. The mail, the lesson and the roll record it, and the road
is shut: the runs go round again. A word broken (a column sent at the fire) brings the rags down under the
same chief, and the ground says YOUR WORD BROKE.

Walking the road loaded. On the truce road inside the ring, within the road's width, the Walker walks
loaded and the knives let them. They stand off and say it ("The rag's up. Walk on." — or, seeing the gift,
"A gift. Walk it in."). Off the road they do not. The white rag flies from a switch stuck upright in the
pack's back corner, clear of the head and apart from anything lashed on the pack: a truce flag the knives
read at a glance.

**THE STONE'S KEEPING (the backs' pause, Republic.tickStones, SETTLESTONE_DOWN, DATA.stoneLines, T.stone
{passR 70, pauseT 1.6, passCd 240, moodDays 1, walk 5, kick 1.2}, MOOD causes `cairn`/`watched`).**

The pause. A back of yours passing a standing cairn stops a beat and faces it. The one who set it says
their own line ("Still standing."), the others theirs, and a kicked cairn has its own. Their stones seen
standing sit in the mood for a day. The Order's walkers on the road stop at the cairns too.

The kick. *My reading* of "a camp that turns hostile again" is the camp up again: no word, no truce, not
taken, its chief at the fire. When that happens a knife walks out from the ring's edge to the cairn, kicks
it, and the stones go over in a breath of dust with his line ("Your stones. Our ring."). They lie in the
dirt after, KICKED OVER on the ground.

The new score. The one who set the stones has a score with that camp again (the mail). Their plate reads
KICKED OVER AT ASH CAMP — YOUR SCORE, and their settled row reads SETTLED AT ASH CAMP — KICKED OVER. The
roll says so, and the lesson follows. Settling it again sets new stones and clears the kicked ones.

**THE LINE'S WATCH (Systems.watches/watchAt/watchDark/watchers/watchSlot/watchFire, lineOrder('watch'),
T.watch {speed 84, fallInR 260, fireR 76, moodDays 1}, WATCHFIRE, MARKS.watch).**

The order. *My reading*: the watch is a third order at a held line. Q offers HOLD, COME or WATCH, and the
plate carries all three with their marks. WATCH leaves the line at the ring's very edge for the night. The
wedge empties, and the mail and the lesson follow. The line keeps its slots with the Walker gone. The roll
and the compass name it (THE WATCH · ASH, pinned), and before dark it turns a knife at the edge the way
HOLD does.

By day and at dark. By day a fire lies laid behind the line. At dark it burns, the backs' lamps are lit
and the rope runs hand to hand. From dark it is a watch, and the camp stays in:

- the knives circle close at their own fire;
- a knife near a loaded Walker inside the ring goes back ("There's a line out there. Stay in.");
- a charter run across the ring passes as at a truce (THROUGH THE WATCHED RING on the sheet, no rags);
- a grudge's storm from that fire stays in.

Home at dawn. *My reading* of "comes home": when dawn has held a while, the line walks to the nearest lit
door (the mail "The watch comes home") and waits there, with HOME FROM THE WATCH under them and the compass
marking "the watch, home · Foundry". The watch sits in their mood for a day. They fall in when the Walker
comes by, or go to the pool with the fee waived if the wedge is full. A watch can be called in early with
Q at the line, and it falls in at once.

**Polish, on the same law.**

- THE RUNNER'S WORDS: a runner's line rides with him. A knife walking on no longer leaves his words
  hanging in the air behind; the knives', bows' and rams' twelve barks follow their speakers.
- THE SHEET'S TIPS: a tip near the sheet's right or bottom edge turns to the cursor's other side instead
  of squeezing thin, and the pinned roll is measured unsqueezed.
- THE GIFT'S CORD: twine, on the pack and on the tower's glyph. A red cord on pale cloth read as a medic's
  cross.
- THE RAG'S SWITCH: the rag tied at the pack's corner vanished into anything lashed there, so it flies on
  its own switch.
- THE COUNTS: the header's YOUR WORD row shows only when there is a count.
- THE SHEET'S MARKS: the rags down leave door names alone, and the chief's runner's words give way to the
  camp's rows once he is home inside his ring.
- THE WATCH HOME: it waits below its door's plate, not on it.
- The lessons and the mood: seven lessons (80 pages) and two mood causes (29).

**Proof.** answered.mjs, 8 checks:

- the registries;
- the word answered end to end (three kept words heard, the errand on the wire's word, the credit spent;
  two broken, shut by hearsay, refused, a late delivery leaving it shut, a good one opening it with SEEN AT
  THE DOOR);
- the keepsake set down (the thing at the stone's foot pixel-sampled against the same frame without it);
- the road kept (the board's card by a real click, the rag at the pack pixel-sampled on the road and off
  it, the knives letting the loaded Walker by, the gold knot pixel-sampled, the rags down pixel-sampled);
- the stone's keeping (the pause, the kick, the stones in the dirt pixel-sampled, the score again);
- the watch (by a real click, the fire pixel-sampled laid and lit, the camp kept in, the run through, the
  storm held, home at dawn, called in early);
- the save;
- no errors.

Full battery **741 tallied checks across fifty-one suites, zero fails** (four parallel flakes — the briefing table's frame rate, a settled cairn's thread in the carried suite, the inputs suite's boot and the shapes escort's knock — each rerun green sequentially; the carried suite now prints the cairn's state when its thread is missed); shop audit CLEAN.

**Frames eyeballed and re-staged:**

- the road's gift lashed with a red cord read as a medic's cross, until the cord became twine on the pack
  and on the tower glyph both;
- the rag at the pack's corner vanished into the gift's cloth, until it flew on its own switch;
- a knife's line hung where he had said it while he walked on, until a runner's line rode with him;
- the camp's pinned roll squeezed to a strip at the sheet's edge, until the tip measured itself
  unsqueezed;
- the gift at the fire had the chief's name over the Walker's head and the chief's runner crowding the
  frame, until the Walker stood clear and the runner was spent;
- the kick was shot while the knife was still walking out, until the frame took the moment the stones
  went over, with his line and the dust;
- the watch home stood on its station's plate, until it waited below it, and then its words were cut off
  at the frame's foot, until the frame came down;
- the doors' sheet frame cut both towns, until each had its own;
- a door answered or shut by hearsay showed empty YOUR WORD counts, until they were hidden;
- the rags-down mark sat on FOUNDRY, until it left the door alone;
- the runner's words sat over the camp's rows once he was home, until they gave way;
- the rags-down frames stood the Walker under the ground's words, until he stood clear of them.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The word gone ahead (v3.48 — the word gone ahead, the camp on the wire, the watch's siege, the stones set again, the kin's day)

v3.47 left five lines. They were my proposal, not the docs'. The user took them whole (the REMAINING quoted
back), and the directive still stood: no function ships without its own pixel art and its polish, to the
HD-2D standard. v3.48 is those five. Each one carries something v3.47 set going one step further:

- a door that answered you writes ahead to a town you have never reached;
- a road kept three times asks for the wire;
- a watch held three nights running tires the camp;
- a kicked cairn, its score paid, is set again;
- a keepsake set down on a stone gives that stone a day.

The art came first and was eyeballed at 8× on wg_sheet.png before any engine line touched it:

- eight marks (the word gone ahead, the camp asks, on the wire, the camp tired, the talk at the line, set
  twice, the kin's day, the town's hand);
- the letter gone ahead, in the waylight's teal;
- the relay mast, lit and dark (its lamp, the camp's red rag);
- the knives' board;
- the relay kit, as its own glyph on the pack's tower;
- the white rag on its stick;
- the cairn set twice (a second red thread);
- the kin's candles, in two frames;
- the town's ribbon on the rig.

Where the user's words left a choice open, the reading below is mine and is marked as mine.

**THE WORD GONE AHEAD (Economy.writeAhead/landAhead, T.ahead {appr 6, likes 4, firstLikes 6},
WORDNOTE.ahead, MARKS.ahead, DATA.keeperGrief[*].ahead).**

The letter. *My reading* of "a town that answered you": a door whose errand on the wire's word (v3.47) you
walked through in good time. When it is kept, that keeper writes ahead, once, down the wire to the nearest
town you have never reached (not a camp's post, and not one already written to). The mail and the book say
who wrote and to where. The letter walks the wire as a word does, in the waylight's teal rather than a kept
word's gold, and the survey sheet traces its route in teal.

The landing. *My reading* of "friendlier on first arrival": the town is warmer before you ever come (six
of appreciation, four likes), it is on every board as if known (doors post to it before you have been
there), and the lesson and its book say so. The first time its board opens, the keeper greets you by the
letter in their own voice ("Letter. {who}. {town}. Says you keep it. Board's there. Don't make the letter
wrong." — Marsh at the Quarry), and the plate's chip reads WRITTEN AHEAD — {who}, {town}. The first
delivery through its door pays the letter's worth, six likes more, and the slip says WRITTEN AHEAD; the
second does not, and the chip is gone. Both books keep it: WROTE AHEAD FOR YOU at the writer's door, the
letter at the reader's. The sheet puts the mark beside the town's name.

**THE CAMP ON THE WIRE (Republic.campAsks/relayCamps/kitFor/takeRelayKit/raiseRelay/postOf,
State.syncPosts/postRow, DATA.campPosts, items.relayKit, T.post {asks 3, kit 40 metal + 24 ceramic + 6
lumen, kg 16, reach 150, at [40,62]}, RELAY_MAST, CAMP_BOARD, the pack's CG.relayKit, MARKS.asks/wired).**

The ask. The third time the road's gift is walked to a camp's fire (v3.47's road kept), the chief asks for
the wire in his own words ("Three times you walked it in. Put us on your wire."). The mail, the lesson and
the roll record it, and the sheet marks the fire. *My reading*: only a camp that keeps a chief at its fire
can ask, which means Pass and Ash. Ridge's bowmen keep no chief, so Ridge never asks. A road let lapse
without its gift clears the ask.

The kit. *My reading* of "carry a relay kit": while a camp asks, every lit board offers THE RELAY KIT. The
bank pays for it (40 metal, 24 ceramic, 6 lumen), and it rides the pack's tower at 16 kg as its own glyph:
the lamp head on its poles over the Walker's shoulder, the wire coiled beside it. The guide and the compass
("the wire · Ash") walk it to the fire.

The raise. At the chief's fire with the kit, G raises the relay, and the connection scene lights it as it
lights any door. The camp becomes a town:

- a door in the station registry with its own row, standing at T.post.at from the fire;
- the chief who was at the fire as its keeper, with his own voice for every word a keeper has (every
  grievance, a letter written ahead, five stars) and his own face on the plate ("Three gifts down my road
  and a lamp on my fire. The Foundry smokes about it. Board's there. Read it.");
- a board, and a market that drains and is fed like any town's;
- light where no other door's light had reached, and the wire.

A delivery through its door pays the knives' salvage (three metal, and three more per star). The camp
stands down for good: no runner, no cut on a loaded Walker in the ring, the rags stay up, no gift is
wanted, and no pact runner leaves its fire. On the ground, the relay's mast stands behind the knives' board (the lamp lit at dark, unlit by
day, the camp's red rag on it). The board by the door carries its notices, with the chief beside it (THE
CHIEF — KEEPS THE DOOR) and two knives at home by their fire. The sheet rings the camp and says ON THE WIRE.

*My reading*: the registry is live. A new valley has no post, and loading an old one puts it back. Every
module holds the registry by reference, so the post is a door everywhere at once: on the board, on the
wire, on the sheet, in the light and among the hands for hire.

**THE WATCH'S SIEGE (Systems.siegeCount/tickSiege, T.siege {nights 3, speed 60, talk 5, truceDays 2},
RAG_STICK, MARKS.tired/talk, DATA.siegeLines, the camp's watchRun/siegeTruce).**

The count. *My reading* of "three nights running": each dawn a watch has held at a camp's ring counts one
more night if the last one counted was the night before. If a night was missed, the count starts again at
one. The line's plate says which night this is (WATCH · night 2 of 3), and the roll counts ("2 nights
running — at 3 the camp tires").

The walk out. At the third night's dawn the camp is tired. The chief walks out from his fire toward the
line with a white rag on a stick over his shoulder, and the line stays until it is done. *My reading*: a
fire with no chief (Ridge) sends its eldest knife, the bowman. He reaches the line and talks ("You win the
dark. Put your lamps down and talk."), and the line answers ("Nobody wanted the fourth night."). A truce
stands for two days, like any truce: the knives let a loaded Walker by and the rags go up. The mail, the
lesson and the roll record it (A TRUCE AT THE LINE), and the count is spent. He walks back to his fire, and
then the watch walks home as before. There is no fight.

**THE STONES SET AGAIN (Republic.startSettle/tickStones, twice; SETTLESTONE_TWICE, DATA.twiceLines,
MARKS.twice).**

*My reading* of "the fallen sets it again": the one whose cairn was kicked sets it again, once their score
with that camp is paid (v3.47's new score). Walked to the ring, they step out and set the stones a second
time ("Twice now. It stays."). The kicked stones go, and the new cairn carries two red threads. The mail
says settled twice and the lesson follows. The plate carries both rows (KICKED OVER, and TWICE) and the
roll says "set twice".

The knives leave it. When the camp comes back up, no knife walks out to kick a cairn set twice. A runner
who comes near steps round it, keeping 44 clear of it, and says so ("Leave it. That one's twice."). The
ground reads SETTLED TWICE, in gold.

**THE KIN'S DAY (Republic.kinDayRows/kinDayToday/kinDayNow/kinDaySlot/kinNameOf/sendHelper, T.kinDay
{every 7, from 0.52, to 0.74, hearR 150, likes 2, leg 20}, KIN_CANDLES, HELPER_CELLS, MARKS.kinday/sent,
DATA.kinDayLines).**

The day. A stone that wears its keepsake (v3.47's keepsake set down) has a day every seventh day from the
day the thing was set on it. That morning the kin write ("Wenna Penrose: Halvard's day"), and the compass
marks the stone ("the kin's day · Halvard"). The memorial card says it is its day today, and on other days
in how many days it falls. *My reading* of "at dusk": the kin stand at the stone from dusk into the night.
Two candles burn at its foot and the kin stands beside it, facing it, with {KIN} — {FIRST}'S DAY under
them.

The helper. Come by while they stand there and the kin say the name ("It is Halvard's day. We light two
candles and say the name."). The town is warmer by two likes, and it sends one of its hands. *My readings*
for the hand:

- the hand is lent even past a full wedge (a hire is still refused at a full wedge);
- no fee, and the town's ribbon across the chest;
- one hand at a time;
- the roll says "walking your leg — sent by The Mill";
- after twenty seconds on the road, at the next lit door, they rack what they carried there and say their
  line ("My leg's done. The Mill is that way. Go well.");
- then they walk home to their own town's hire board.

**Polish, on the same law.**

- THE WORDS WITH WHO SAID THEM: a line said by one of the hands rides with that hand, as a runner's does.
  Before, a hand's line was placed nowhere and never showed.
- THE PLATE'S KICKED DAY: a hand's plate read its kicked day from stones that no longer lay in the dirt
  once they were set twice, which broke the plate. It reads the day from the hand's own record.
- THE SHEET'S WORDS: a camp that became a door says ON THE WIRE alone under its ring, and its truce road's
  label gives way.
- THE WORLD'S M AND W: in the 3×5 face painted into the world, M and W were three texels wide and each read
  as an H (SETTLED TWICE read SETTLED THICE). Both are now five wide and advance six, and every label is
  measured with them.
- NO PACT RUNNER FROM A POST: a camp on the wire still held the word you gave at its fire, and on that word's
  last day it would have sent a runner with a gift to another door. A camp on the wire trades through its
  own door, so it sends none.
- THE LESSONS: six lessons (86 pages). No new mood cause (29).
- THE BUDGET: the sprite registry passed 97 KB, so the budget in assets.mjs is raised to 98 KB, with the
  note in the suite.

**Proof.** ahead.mjs, 9 checks:

- the registries;
- the word gone ahead (a town never reached on no board, the errand kept and the letter written to the
  nearest, the teal word pixel-sampled on the world, the landing warmer and on every board, the greeting,
  the chip, the first delivery paid and the second not, both books, once);
- the camp asks (three gifts, asked once, the kit by a real click, paid from the bank, pixel-sampled on the
  pack, taken once, the guide and compass);
- the camp on the wire (raised once, the registry row at its place, the keeper, the face, the board, the
  market, the salvage, the calm ring, no pact runner, the lamp, the board and the knives pixel-sampled);
- the watch's siege (the night count, the chief out with the rag pixel-sampled, the talk, the truce, home;
  the count reset by a missed night; the eldest sent from a chiefless fire);
- the stones set again (the second setting, both plate rows, the roll, left alone, stepped round, the
  threads pixel-sampled);
- the kin's day (no day at six days, the morning mail, the compass, the card, not before dusk, the candles
  and the kin pixel-sampled, the hand lent past a full wedge, one at a time, the ribbon pixel-sampled,
  home);
- the save (a new valley without a post; loading puts it back);
- no errors.

**The checks corrected.** Five sampled checks were passing or failing on the weather and on who happened to
walk by, not on the art. This version fixes them:

- answered.mjs looked for the rag at the pack's middle. The rag has not flown there since it got its switch
  in v3.47, so the check passed only when the chief's cloth stood behind the Walker at the road's middle.
  It now counts pale cloth where the rag flies, on the road clear of the chief's fire.
- The gold knot, the cairn standing and the cairn kicked are now measured against the same frame without
  them, so the sky's tint is in both frames.
- A bleed from an earlier cut no longer counts against the knife trials.
- The pact's own runner (tested in carried.mjs) no longer walks through the road's frames.
- Walkers passing on the road are kept out of every sampled frame in both suites.
- ahead.mjs measures the twice cairn the same way, against the same frame with it carried off.
- manual.mjs checked its eighty-six lessons against eighty.

Full battery **750 tallied checks across fifty-two suites, zero fails** (three flakes under the parallel run: the faces and inputs suites' boots under load, and the kin's day's frame, whose "not its day" was a minute later rather than a day, now a day in the suite; each rerun green sequentially); shop audit CLEAN.

**Frames eyeballed and re-staged:**

- the twice cairn's words read SETTLED THICE, until the world's M and W were drawn five wide;
- the contact sheet drew the relay kit as cells on the rig that the pack never wore (the pack carries the
  kit on its tower), until the cells went and the sheet showed the glyph the pack does wear;
- the twice cairn was not drawn at all (its second thread sampled nothing), until its own branch went into
  the stones' render;
- the chief at the post stood over the knives' board, until he stood beside it;
- three knives at home read as a crowd round one spot, until two stood by the fire;
- the kin's candles were hidden behind the kin, until one burned at each side of the stone;
- the post's words on the sheet stacked over the camp's name and the truce road's, until ON THE WIRE stood
  alone under the ring and the truce road's label gave way;
- the raise's title sat low and was cut at the frame's foot, until the frame was taller and taken later in
  the scene;
- the siege walk-out was taken once the chief had already reached the line, until it was taken as he set
  out;
- the siege's words read as one more label among the camp's, until they stood a size up as the moment's
  words;
- the fade and the announcement banner lay across several frames, until each frame was taken clear of
  them;
- the post's sheet frame was off-centre, until the Walker stood at the post (the sheet centres on the
  Walker);
- the hand's words on joining never showed in the frame, until a hand's line was placed where the hand
  walks and rode with them.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The word passed on (v3.49 — the letters passed on, the wire cut, the ring given, the knives' stone, the hand who stays; the wheel, the plain names, the storage tab)

v3.48 left five lines. They were my proposal, not the docs'. The user took them whole ("BEGIN OR CONTINUE DEVELOPMENT FOR:
REMAINING"), with the standing directive (no function ships without its own pixel art and its polish, to the HD-2D standard;
a visual inconsistency is answered with the art or the fix that corrects it) and four corrections added onto the work:

- the mouse wheel zooms the camera;
- no made-up names on the main windows, tabs or buttons — a window says what it is, and the theme lives in its subtitle and
  its art;
- the storage tab designed properly: icons, mission items at the top and out of the way, filtering, colour — designed, not
  crammed;
- the step from initial integrations to ECOSYSTEM integrations: mechanics that complement the delivery loop without burden
  or busywork, and progression systems delivered into the main bus.

v3.49 is the five and the four. Each of the five closes a thing v3.48 opened:

- a town reached on a letter passes the letter on, and the letters chain across the valley;
- a camp on the wire can have its wire cut, and a coil from any lit board splices it;
- a camp that came out to your line twice gives its ring up, and the fire becomes a rest stop on your routes;
- a cairn set twice and left standing a week gets the camp's own stone beside it;
- a hand who walked three kin's days stays on.

The art, eyeballed at 8× on wp_sheet.png (drawn from the live registry, the rows the game draws):

- seven marks (the letter passed on, the end of three letters, the wire cut, the splice coil, the ring given, the knives'
  stone, the hand who stays);
- the letter gone ahead with two teal pips under it, and with three;
- the cut mast, 17 wide: the legs exactly where the standing mast's stand, the pole snapped in splinters above the brace,
  the lamp's cage dark on its side in the dirt with the camp's red rag;
- the knives' board boarded up (two pale planks crossed over the bare nails, the red rag knotted where they cross);
- the spark where live wire parts or is spliced, in three frames (the star, its rays, the ember);
- the rest stop's sign with the waylight's lantern painted on it in gold, the pegs a struck tent leaves, the stones laid
  round the fire, and the rolled hide a fighter carries off to the hills;
- the knives' stone, an upright stone with a black thread wound round it and its loose end trailing, and the stone as a
  knife carries it out;
- the white pin through the ribbon where the sash crosses the chest;
- the splice coil, its own glyph on the pack and its own icon on paper.

Where the user's words left a choice open, the reading below is mine and is marked as mine.

**THE LETTERS PASSED ON (Economy.passOn/passedAt, writeAhead(stId, chain), T.passed {errandAt 3}, WORDNOTE.ahead2/ahead3,
MARKS.passed/third, DATA.keeperGrief[*].third).**

The chain. A town you reached on a letter (v3.48's word gone ahead) writes ahead in its turn once you keep a word there.
*My reading* of "keep a word there": a promise kept at that door, or its keeper's errand kept — the book's own kept rows.
Its keeper passes the letter on, once, down the wire to the nearest door you have never reached: the second letter in the
chain (the mail, the lesson, the book). The letter walks the wire with two teal pips under it; the third walks with three.
Landing, the town is warmer and on every board as in v3.48, its keeper greets you by the one who wrote, and the chip reads
LETTER 2 OF A CHAIN with its mark.

The end of three letters. The door at the end of three letters opens with its keeper's errand already posted, before you
have ever walked in: the lesson; the keeper greets you by the one who wrote last, in their own voice (Marsh at the Quarry:
"Three letters. Last from {who}. {town}. My errand's sealed. On the board. Waiting."); the chip; the board's card THE
KEEPER'S ERRAND · AT THE END OF THREE LETTERS. Accepting it spends the chain's word — the keeper asks it to your face and
no second errand posts. Walked through, it is a word kept like any. With every door in the valley already heard of you,
the chain ends, and the mail says so. The map draws every landed letter from writer to reader in teal, with its place in
the chain.

**THE WIRE CUT (Republic.tickCuts/startCut/takeCoil/splice/cutAt/cutPosts/raiderCamps/coilFor/mastOf, State.refreshSources,
T.cut {chance 0.5, graceDays 3, walk 5, cut 1.4, back 3, kg 6, reach 150, relight 2.2, pay 24, likes 6}, items.wireCoil,
RELAY_MAST_CUT, CAMP_BOARD_SHUT, SPARK_F, MARKS.cut/coil, DATA.cutLines).**

The raider. On a storm night (greyfall after dark), once a night, a raider may walk in on a camp on the wire. *My reading*
of "raiders": he comes from the nearest camp still up — not on the wire, not given, not taken, not stood down, and not one
that has set its own stone by yours. *My reading* of the cadence, under the fourth correction: an even chance on a storm
night, and none inside three days of the relay going up or the last splice — an event every few days while camps are up,
never a nightly chore. He is seen walking in from his camp's way (A RAIDER AT THE MAST, his words on the ground), cuts the
mast in a breath and a half, and runs.

The door dark. The post goes dark: its light gone (the light field leaves it out), its board shut and no board posting to
it, nothing handed over, the wire carrying nothing to or from it. The mail names his camp, the lesson follows, and the roll
of the camp that cut it says it raids. The terminal is one tab — Board shut — with the boarded board and what to carry,
and the chief says it at the door ("They cut it in the storm. Board's shut till it's spliced."). On the ground: the mast
broken above the legs, no lamp, the board boarded up with the rag, the live end sparking now and then between quiet
moments, THE WIRE CUT — THE BOARD SHUT.

The splice. *My reading* of "a coil from any lit board": every lit board carries THE SPLICE COIL with a plain Accept, from
nobody's bank — a card like any run. It rides the pack at 6 kg; the guide and the compass walk it to the mast. G at the
mast, in reach, takes the coil off the pack and splices it: sparks at the broken top for a couple of seconds (SPLICING THE
WIRE), then the lamp lights, the board opens and is posted to, the wire feeds it again, and the splice pays like a
delivery (24 likes, the post six likes warmer; the chief's line, the mail, the lesson). No coil card is left on any board.

The web closes. Every camp brought onto the wire, given, or that has set its stone by yours is one fewer that can cut: with
every camp in, no raider is left, a storm night past every grace brings nobody, and no roll says raiders. The cut is the
reason to finish the camps, not a chore laid on top of them.

**THE RING GIVEN (Republic.giveRing/givenAt/restFire/tickGiven, T.given {lines 2, leave 12, fireR 110, lightR 64, likes 30},
PEGS, HEARTH_STONES, RESTSIGN, BUNDLE, MARKS.given, DATA.givenLines).**

*My reading* of "came out to the line twice": the watch's siege (v3.48) — each time the chief (or a chiefless fire's eldest)
walks out to the line under the white rag counts. After the first, the roll says the next time it gives its ring up. The
second time he gives it up, no truce needed: the count spent, likes, the mail, the lesson ("Twice you sat out there. Take
the fire. We're going up to the hills."). He walks back, the watch walks home, and the fighters leave for the hills on the
far side of the ring from your line, their hides rolled on their backs, with their words.

*My reading* of "the fire becomes a rest stop": a real stop on your routes, made of things the game already had.

- the big hide left pitched as a shelter: the rain kept off, and the Walker mends under it;
- a box that keeps cargo, as any box;
- the fire warm, and the Walker mends at it as at a door — and not out on the road;
- a light at night;
- the valley keeps them (no decay where a shelter of yours wears in the same storm);
- open ground: no runner, no cut, and no raider from it again.

Seen: the pegs where the tents stood, the stones round the fire, the sign with its lamp and its words. The roll is a rest
stop's plate, and the map marks it.

**THE KNIVES' STONE (Republic.tickKnivesStone, T.kstone {days 7, walk 5, set 1.4, back 3, moodDays 3}, SETTLESTONE_KNIVES,
CARRY_STONE, MARKS.kstone, DATA.kstoneLines, MOOD cause `kstone`).**

A cairn set twice (v3.48) and left standing a week from its second setting: a knife walks out from the camp's side of the
ring carrying a stone of their own, sets it beside the cairn with a black thread wound round it ("From us. Leave it
standing."), and walks back. It is the first thing the knives have ever given you. The one who set the cairn is lifted (a
mood cause for three days, thirty-one causes now); their plate says THE KNIVES SET A STONE BESIDE IT; the roll says so; the
mail, the lesson; once. A cairn at six days has nothing. *My reading*: the camp stays up — a stone is a gift, not a
surrender — but it sends no raider against your wire again.

**THE HAND WHO STAYS (Republic.stayOn, tickHelpers, sendHelper, T.stays {legs 3}, PIN_CELLS, MARKS.stays, DATA.staysLines,
MOOD cause `stays`).**

*My reading* of "a helper who walked three kin's days": the same hand. On its next kin's day the town sends the same hand
it sent before, and at the door where their third leg ends they ask to stay on ("Three of {first}'s days now. Let me stay
on."). For good: the ribbon kept, with a white pin through it; no fee; a place in the wedge like any hire. The plate says
STAYED ON — HALVARD'S DAY, the roll says whose day they walk for, and the mood carries it. The next kin's day the town sends
someone new. *My reading* for a full wedge: the hand waits at that door's fire and joins the moment there is room, still
for no fee. The fire pool's aging spares them.

**THE CORRECTIONS.**

The wheel (Render.nudgeZoom/zoomStepOf/setZoomStep/zoomLevel/zoomRange/texelLaw, UI.opts.zoomStep, #zoomNote). Wheel up
zooms the camera in a level and wheel down out, and ZOOM +1 flashes under the prompts. A level is the size of the pixel block
the world lands on screen in, not a stretch of the world: at every level a sprite texel is one buffer pixel and a ground
texel two, and the block grows a whole screen pixel a notch (0.8 · 1.2 · 1.6 · 2.0 · 2.4 screen pixels a world unit at one
device pixel a pixel; the play camera's own level is the middle one, as before). The first cut stretched the world instead:
the sprites stayed at the one buffer pixel they cannot go under while the ground halved beneath them, so at the far level
the Walker stood twice the size of the valley. Looking at the four levels side by side found it; now the Walker, the crew
and Haven's longhouse keep their proportion at every level. The same law puts the play camera's base level in proportion on
a 150% display, where the sprites had stood a third too large. Rooms keep the base block. The level is remembered for this
viewer and a fresh page opens at it. It stops at the nearest and farthest levels. A trackpad's nudge is not a notch (the
wheel adds up to a notch before it moves). With a window open, the wheel is the window's.

The plain names. Every window title, tab and button says what it is; the theme stays in the subtitles and the art. The
sweep:

- the terminal's tabs read Orders · Mail · Fabricate · Hire · Donate · Storage · Records, and every card's button reads
  Accept (it had read Carry it on the mail, and other made-up verbs elsewhere);
- the Survey Sheet is the Map (Valley · Region · World), under the subtitles The Greymarch · the valley, The Darklands ·
  the region around the valley, The Known World;
- the Delivery Ledgers are Cargo Rules (Arrival routine · Simple rules · Item list); the Banner Sheet is Factions; the
  Muster Roll is Crew (Report orders); the Field Manual is the Manual (Controls · Lessons · Windows · Saves);
- the waybill is a Delivery, and the slip reads Delivery complete; the hand-over is Transfer cargo; the Peddler's sheet is
  the Trader;
- the Certificate of Passage is the Death certificate; the Enlistment is New character (Randomize, Start); the tailor is
  Appearance; Reset the Valley is Reset world; passage codes are save codes (Export save code); Free my boots is Unstick;
  paper scale is Interface scale; the wedge card is the Party card;
- the keys' names and the manual's index of windows name them the same way.

The storage tab. One filter row counts both sides by kind (All · Mission · Materials · Goods · Gear · Tools · Food & use ·
Other — a chip shows only for a kind that is there). Two columns — On your back · Lockers here — every item with its icon, grouped under coloured heads, the
mission group first in each column with its names in gold and a mission item's icon gold where the same crate's is not. A
condition bar where condition matters. A crate over your load cannot be taken. A click on a chip filters both columns to
that kind. Store all leaves the mission crate and the tools on your back; Take all takes the mission crate first and stops
at your load. Under 720 pixels the columns stack.

The words on the ground. Every lit texel of a label on the ground now carries its dark outline all round (the texel above,
below and to each side), not only a shadow under it, so gold words read on the golden shore and pale words on snow.

The ecosystem, in this version. The fourth correction is a direction for the work ahead, and v3.49 is built to it where it
touches:

- the cut is an event every few days while camps are up, never a nightly chore, and the web closing ends it;
- the coil is a run from any board that pays like a delivery;
- the given ring is a stop on your routes (shelter, box, fire), not a place to visit;
- the hand who stays is a free back for the loads you carry;
- the letters put doors you have never reached on every board and post their errands to you.

The full pass — every system delivered into the delivery bus — is the REMAINING below (ROADMAP 4q), my proposal.

**Polish, on the same law.**

- THE CHAIN'S ERRAND: an accepted errand did not carry the chain's mark, so the chain's errand spent a word's credit and the
  keeper never said the end-of-three line; the order carries it now (found by the suite). Its card had said the keeper
  "watched you keep your word twice" — a keeper who has never met you; it says the keeper read three letters about you down
  the wire, the last from whom, and has never met you.
- THE CUT MAST'S ROWS: the cut mast's first cut had one row too many and stood its legs a texel low against the standing
  mast's; it is 24 rows, the legs where the standing mast's stand (the registry check and the eye both).
- THE REST STOP'S SIGN: the lamp painted on it was a gold plus, and a plus on a board reads as a medic's cross; it is a
  lantern now (handle, glass, flame, base).
- THE CUT POST'S HEADER: a cut post's terminal called itself on the wire; it says the wire cut.
- THE WORDS OUT OF THE WAY: THEY LEAVE FOR THE HILLS rides under the fighters' feet, not across a face; the rest stop's
  name stands under its box, not across it.
- THE HEADER'S GUTTER: a terminal's long subtitle ran up against the bank's column; the header keeps a gutter between
  them, and a mark on the book's line stands a breath off its words.
- THE SAVE CODE'S REFUSAL: says what a save code begins with.
- A FILTER THAT FILTERED NOTHING: the party's blow-taking list passed every back through a filter that let every back
  through; it is the party, plainly (the rebuilt audit found it).
- THE LESSONS: seven lessons (93 pages); two mood causes (31).

**The workspace, rebuilt.** Mid-version the cloud workspace was reset and everything in it was lost: the source split, the
unpublished v3.49 work, the tools and the test battery. The published v3.48 page is the durable copy. It was split back into
its sources by its own build markers (the rebuild is byte-identical to the published page), and v3.49 was re-applied from
this session's record. The keepers' end-of-three lines were written again. build.py was written again. The shop audit was
rebuilt as tools/audit.py (dead exports, the lessons and their titles and firings, every tuning row's keys read, dead
branches, TODO), and it reads honestly what it cannot see: an export the v3.48 gate passed with the whole battery is credited
to that battery (tools/exports_v348.json, taken from the published v3.48 page) while its suites are not in the workspace;
anything exported since must be read here. The battery beyond this version's own suites — fifty suites — lives in the v3.48
package and was not in the workspace to run.

**Proof.** passed.mjs, 15 checks:

- the registries (seven marks, the pips, the cut mast, the boarded board, the sparks, the rest stop's pieces, the knives'
  stone and its carry, the pin, the coil's glyph and icon, the rows, every keeper's end-of-three line and the camps' doors',
  the voices, 93 lessons, 31 causes);
- the letters passed on end to end (the pips pixel-sampled against the same letter as a first; the chip, the greeting; the
  third, its errand posted, a real click accepting it, kept; the chain's end; the map's teal lines pixel-sampled);
- the wire cut (the raider seen walking in; the dark, the shut board, the wire; the terminal's one tab, the chief; the roll;
  the coil card by a real click, the guide, the compass; the coil on the pack, the cut mast, the boarded board, the rag and
  the spark, all pixel-sampled against the same dark frame with the mast standing);
- the splice (reach, the sparks sampled, lit, paid, open, fed, no card, the grace);
- the ring given (twice to the line, given, the structures, the leaving fighters and the rest stop sampled, the mending at
  the fire and not away, the shelter, the box, kept by the valley, the plate, the map);
- the knives' stone (not at six days, the knife walking out with his stone sampled, set, the mood, the plate, the roll,
  once, no raider; the stone and its black thread sampled);
- the hand who stays (the same hand three times, the stay, the plate, the roll, the mood, someone new; a full wedge
  waiting and joining; the pin sampled);
- the wheel (levels, the note, remembered, the ends, a trackpad's nudge, a window's wheel; at every level a sprite texel one
  buffer pixel, a ground texel two, the block whole; a fresh page at the level left);
- the windows say what they are (tabs, buttons, no made-up names anywhere, the index, the keys, the rail, the title menu);
- the storage tab (the chips, the columns, icons, mission first and gold, colours, conditions, over the load, a real click
  filtering, Store all, Take all);
- the words on the ground (the outline above every lit texel);
- the web closes; the save; no errors.

ahead.mjs (v3.48's suite, its counts brought to 93 lessons and 31 causes) runs beside it. The fifty suites lost with the
workspace run again when the v3.48 package is back in the workspace.

**The checks corrected.** The cut post's frames were taken with the splice coil on the pack, so the guide's beacon stood on
the mast in the cut frame and not in the frame with the mast standing, and the legs read as moved. The frames are taken with
the coil off the pack, the drifting wisps off, and against a dark frame (the grey veils unlit ground the same in both). The
wheel's check had counted levels; it measures the texel law at every level now.

**Frames eyeballed and re-staged:**

- the far level of the wheel stood the Walker twice the size of the valley, until a level was the size of the pixel block;
- the rest stop's sign read as a medic's cross, until its lamp was drawn as a lantern;
- the chain's errand card told a keeper who never met you that they had watched you keep your word, until it said what
  they had read;
- a cut post's header called itself on the wire, until it said the wire cut;
- THEY LEAVE FOR THE HILLS crossed a fighter's face, until it rode under their feet; the rest stop's name lay across its
  box, until it stood under it;
- a long subtitle ran against the bank's column, until the header kept a gutter; the book's mark touched its words;
- the cut mast's legs stood a texel low against the standing mast's, until its rows matched;
- the coil card read Carry it, until every card read Accept;
- the storage tab was a wall of text, until it had icons, groups, colours, chips and two columns;
- the frames themselves: the map was shot under an announcement's banner, a raider was framed off his own frame, the cut
  post's words ran off the frame's edge, the splice was shot with the Walker out of reach, the knife carrying his stone was
  cut off at the top, the plate read a day below nothing from a staged clock — each re-staged until it stood.

**Held.** The courier set, until v3.50 drew it by hand at 32×32 (see *The courier set*).

## The courier set (v3.50 — the Walker and every courier redrawn at 32×32 by hand; the people and the stable brought to its scale)

The user's word, repeated over versions, was to create the courier set's pixel art at 32×32. v3.50 makes it.

**The set.** The courier is drawn by hand on the 32×32 grid it lands on. Every texel is placed; nothing is scaled,
generated or filtered. The courier:

- wears a hood that frames a face, a scarf wound twice at the throat, and a long coat with a trim, a belt and a buckle;
- has a shoulder strap and a chest strap, trousers and boots;
- carries a pack on the back with the bedroll lashed across its top. From behind it has a flap, side straps with their
  buckles and the Order's lamp stitched on.

There are three facings:

- east, with west as its mirror;
- south, toward the eye;
- north, away from the eye, where the pack is the whole figure.

Each facing has:

- the idle, and the breath (the chest's light rises a row, and the silhouette holds to the texel);
- four steps on the uneven cadence (the two contacts held 0.17 s, the two passings 0.11 s): the stride and the arm swing
  from the side, the feet and the arms alternating toward and away from the eye;
- the brace (knees bent, a hand up on the strap).

Two more frames:

- east rides, astride, with the thigh along the horse's back and the boot in the iron;
- the front hangs from the wire by both hands on the trolley's bar (*my reading*: the zip is ridden facing the eye; from
  the side the raised arm hides the hood).

That makes 23 frames.

The outline law holds on every frame: a coloured texel that meets the open air is an outline texel, and a boot's sole is
its own dark edge. The figure is 22 texels from crown to sole from every side, on the same ground row.

**The palette.** The frames use the worn palette's own letters: hood, skin, eye, coat, trim, the scarf and trim colour,
boots. Every shade the art asks for is derived from those letters when it is drawn, never stored (`Render.courierPal`):

- the coat's shade and light;
- the hood's shade and light;
- the skin's shade;
- the pack's canvas and its shade: *my reading*, the trim colour muted halfway toward a canvas tan, so a hand with a teal
  scarf carries a teal-grey pack, not a teal one;
- the straps;
- the buckles;
- the trousers over the boots.

So every coat cut at the tailor, every trim, hood, skin and pair of boots recolours every texel that is theirs. The rank's
coats, the bought coats and boots, the hands' hoods and scarves, the scrappers' rust and the ghosts' blue do too.

**One rig.** Every figure that walked on the old 12×18 rig now walks on these rows in its own colours:

- the Walker;
- the hands;
- the Order's walkers;
- the scrappers;
- the militia's riders;
- the ghosts;
- the Walker in a hall.

The old rig and its cells (the ribbon's, the pin's, the rag's, the gift's) are retired from the registry. What the courier
carries is re-lashed on the courier's own grid, at anchors set by facing (*my reading* for each place):

- **The tower:** the loads stand on the bedroll, one texel of a crate a texel of the coat (the old tower's crates had
  fallen between buffer pixels). Toward the eye it stands behind the head, with the lowest crate over the hood. From the
  side it stands on the pack's back. From behind it stands on the pack and hides the hood, as a tall load does. It sways
  in whole texels, more the higher the crate.
- **The equipped frames' rails:** up the pack's sides from its foot to over the tower. The wide frame's are doubled with a
  crossbar, the rig's have a gold strap across, the exo's are lit teal at the foot (and at the head on the second).
- **The tools' hafts:** over the pack.
- **The road's gift:** on the pack's top, as a cloth bundle tied with twine.
- **The white rag on a truce road:** on its switch at the pack's top corner, flying back.
- **The kin's lantern:** at the pack's back, dark or lit with its glow.
- **The keepsakes:** under the pack on their strings.
- **The bolt:** in the back shoulder. Toward the eye only its fletching shows over the shoulder.
- **The scar and its dressing:** on the shoulder; they are not seen from the front.
- **The snow:** laid on the top texel of every column of the frame drawn, the hood first, then the shoulders and the
  pack's top, then a thicker cap.
- **The lantern at night:** it hangs under the hand in every frame, and its corona lies behind the coat (the lamp law).
- **The ribbon of a lent hand:** shoulder to hip over the coat and under the arm, and over the shoulder from behind.
- **The pin of a hand who stayed:** through the ribbon at its middle, where the ribbon's edge runs under it.

A Walker who stops keeps facing the way they last walked.

**The people and the stable at the courier's scale.** The courier stands 22 texels tall, where the old rig stood 17. Three
proportions the old rig kept would have broken, and v3.50 restores them:

- **The Farkeepers:** they were drawn "a head taller and a hand wider", and the Pugugly "huge to Waylighters". All five
  classes are a third larger again (20 or 18 wide, 28–29 tall), a courier's head taller, each on its own foot column.
- **The Flame Keepers' tender:** a third larger again, so it no longer reads as a child.
- **The Reapers' hooded figure:** a third larger again, a tall cloak beside the courier.
- **The stable:** a rider of 22 on a horse sized for 17 sat like an adult on a pony. All six breeds are a third larger
  again, their seat and ground carried to the new grid, and the rider sits astride with the hips on the back line.

These were resampled, not redrawn (*my reading*: the fastest way to keep what was drawn and fix the proportion now). Each
went through two Scale2x passes to 4×, which keeps edges and adds no colours, then a vote in every 3×3 block down to 4/3,
where the outline wins a tie. A face's single eye texel (and the Reaper's pale slit) is set back where its centre lands.
The camps' own and the town's own stay at 22, a courier's height.

**On paper.** Every portrait of a courier is the figure cropped from its frame toward the eye, head to boots: 16×24
texels, the old portrait's own 2:3, at whole-texel scales.

- Enlistment and the tailor show it at six.
- The equip doll shows it at five.
- The roll shows it at three.
- The wedge card's rows and the formation board show it at two.

The frames that hold them were widened by their borders, so an image is never squeezed a pixel. The roll's figure frame
grew to hold a Farkeeper. The manual's plates of the bolt, the scar and the dressing are the courier's side view with
them stamped at the anchors the game uses.

**The bench.** The art lives in the registry as rows (`SPRITES.COURIER`). The hand-drawn parts it was composed from are in
`tools/courier/courier.py`: the upper body, each swing of each arm and each step of the legs, drawn on the grid they land
on. `tools/courier/export.py` composes the frames, closes the outline, records each frame's rise and hand, and lays the
ribbon. It writes the registry block between its markers and the 8× sheet (shots/courier_sheet.png). The stable's and the
people's resample is `tools/stable/upscale.py`.

**Found on the way.**

- **The suite caught an export line swallowed by a comment:** a line comment added after the new debug export commented
  out the rest of the renderer's exports on that line, and the title screen's drift stopped. The export now carries a
  block comment.
- **The front view's two passing steps were the same frame:** each is its own now.
- **The pin was on the belt's buckle:** it had landed on a ribbon texel whose edge had been cut away there. It sits where
  the ribbon's edge runs under it.
- **The old tower's crates fell between buffer pixels:** they stand on the texel grid now.
- **The rim light at night painted the outline itself:** on the courier's closed outline the lamp's side read as a staff
  held down the coat's front, and toward the eye it lay on the side away from the lamp. The outline keeps its dark edge
  now; the warm light lies on the first coloured texel inside it, on the side of the hand that holds the lamp.

**Proof.** courier.mjs, 10 checks:

- **The registry:** 23 frames, 32×32, the palette, distinct, the outline law, one height of 22 from every side, the
  soles, the hands, the ribbon, the glyphs, the old cells retired, the stable, the people.
- **The palette:** derived, with every worn letter recolouring its texels.
- **The four sides, texel for texel:** at every third opaque texel of the frame shown, the screen pixel at the texel's
  centre and at two quarter points is its own palette colour. The face shows toward the eye; the pack's canvas shows away,
  and to the east, mirrored in the west.
- **The step, the breath, the brace:** all four steps come round, the contacts held longer, the facing follows the walk,
  the breath on its beat, the space bar's brace.
- **The tower:** four tiers, the medicine's cross over the hood toward the eye, the hood hidden from behind against the
  same frame bare.
- **What is lashed on:** rails, tools, the gift, the rag, the keepsakes, the kin's lantern, the bolt, the scar and the
  dressing, each against the same frame without it; the snow by stage; the lamp's glass at night, and the rim on the side of the hand
  that holds it (east, toward the eye, west): the outline there as dark as anywhere, the coat warm at its edge and its own
  colour within.
- **The hands:** in their own colours from every side, with the ribbon.
- **The ride and the wire:** astride on the larger horse; hung from the trolley's bar.
- **The papers:** every portrait at its size, every frame's content box exactly its image.
- No errors.

passed.mjs and ahead.mjs were moved to the courier's grid: the pin, the ribbon, and the coil and the relay kit sampled
where the tower now stands.

**Held.** Nothing. The courier's face bust (the 16×16 plate on the keepers' alphabet) still
matches the new hood and scarf. The fifty suites of the v3.48 battery are still in the v3.48 package, not in the
workspace; some sample the old rig's pixels and will need moving to the courier's grid when they come back.

## What it moved (v3.51 — the cast drawn by hand; the ecosystem pass; the battery rebuilt on the courier's grid)

The user's word after v3.50 was its honest REMAINING, whole: the ecosystem pass of 4q (the bus map, the slip saying what
it moved, the surplus on the board, the camps on the routes, the standings in the pay); the town's own and the camps' own
in three facings and four steps; the set pieces' figures as registry rows; the stable and the Farkeepers redrawn by hand at
the new scale; the Walker's bust drawn from the courier's head; the fifty v3.48 suites moved onto the courier's grid. The
five ecosystem items are my proposal from v3.49's REMAINING (the user set the direction: from initial integrations to
ecosystem integrations); their numbers are mine.

**The cast.** Every figure in the valley is drawn by hand on the grid it lands on, under one law (tools/figures/STYLE.md:
the references, the grids, the facings, the frames, the outline law, the light, the letters, what a bench writes). Nothing
is resampled. Five benches draw them — tools/people, tools/fk, tools/dark, tools/everyday, tools/stable — and
tools/figures/export.py writes their rows into the registry between its markers.

- **The camps' own and the town's own**, on the courier's 32×32 grid, the courier's height (22 texels crown to sole; what
  they carry stands above): the knife (the blade in the right hand), the bowman (the bow in the left), the ram (the beam in
  the right, the plank door on the left arm), the chief (the knife at the right hip, the cloak over the left shoulder), the
  second chief (the spear), the town's shield (the fork in the right, the shield on the left), the kin (the lantern in the
  right), the wanderer (the hat and the staff; he waves with the left as you come near). Three facings — east (west its
  mirror), toward the eye, away — each with the idle, the breath and four steps on the uneven cadence. The raiders wear
  their own rust and hide, the town its own homespun (*my reading* for both palettes, and the wanderer's).
- **The Farkeepers**, on a 32×40 grid, a courier's head taller (29): the Pugugly, the longbowmen, the berserker, the rifle
  rider, the recon rider and the Republic's shield-bearer, each in the mountain's slate with its own helm, and each with
  a ride frame whose seat texel lands on the saddle's.
- **The dark:** the Reaper (32×40, and its aim in profile for the ride), the Lamplighter (32×40; the lamp's light is a
  texel in every frame), the stranger (32×32), the Flame Keepers' tender (the flame's light carried), the far shape in the
  grey (40×64, one face, the eye its only light).
- **The kid**, a child's height (16), with the letter held high (the hold frame) and a child's quick cadence.
- **The stable**, six breeds side-on — the fjord, the mustang, the Icelandic, the Arabian, the Percheron and the donkey
  with its pack saddle and crates — the idle and a true four-beat walk, the ground under the hooves and the saddle's seat
  carried as texels.
- **What the set pieces hold**, on the same grid: the letter in flight, the forrester's axe in its swing (up, mid, down,
  each with the texel that sits in the hand), the mason's cut stones, and — *mine* — the Reapers' cold lamp on its staff and
  the Walker's sled.
- **The Walker's bust**, drawn from the courier's own head: the hood with its lit rim and the shade over the brow, the eyes,
  the scarf wound twice, the coat's shoulders and the straps; recoloured by what the Walker wears.
- **The courier** gained two frames, east and toward the eye: sitting on the ground and kneeling (the upper body drops six
  and three texels; kneeling toward the eye, the hands are bound out of sight behind the back — *my reading*). 27 frames.

**One figure engine.** A figure is one registry row (`SPRITES.FIG`): its grid (w×h, the foot column, the soles' row), its
frames, the right hand's texel and the upper body's rise per frame, where what it carries is lashed (`at`: the knife's
gift, the rolled hide of the camps' own leaving), its seat, its light, the giant's eye, its cadence, and its palette —
derived from ten worn letters as the courier's are, or carried whole. One path draws them all (`blitFig`, `figDrawn`,
`figStamp`, `seatOrigin`: a rider's seat texel on a saddle's seat whichever way they face). The v3.50 resamples are retired
from the registry (KIT, FIGURES, the tender's rows, the Reaper's, the scrappers' palette, the shield-bearer's function).

**Where the cast stands.** Every place a figure appears draws it from its row:

- the camps' own on the road and at their fire, the storm's knives at a held post (one down on its side), the fighters
  leaving for the hills with their hides rolled on their backs;
- the garrison's shields, the town's own in a square, the kin keeping a place;
- the Farkeepers walking and astride (the recon rider carries the rescue);
- the ride: the captive kneeling, the Reapers' rifles level in profile, the cold lamp, the watchers and the kid, the rider
  bolting on the Walker's own horse (*my reading*: the figures spaced a body apart, so each reads as a person);
- the lamp scene: the Lamplighter and the stranger;
- the procession at night, the far shape in the grey (its veils in stepped alpha over it);
- the tender at her post, the kids at the fence, the kid with the letter;
- the field crews: the axe at the swing, the mason's stones, a hauler's crates stacked as towers;
- the rescue: a walker sat (the courier's sit), a walker down;
- the gift runner: the knife with the chief's gift on his back.

**The ecosystem pass.** Every system reads back into the delivery — nothing new was wired in by adding a chore.

- **What it moved.** The Delivery complete slip ends with WHAT IT MOVED: what the walk changed besides the pay. The valley
  is read before and after the delivery (`Economy.snap`: the light's reach, the town's stars, every camp stood down or not,
  every fundable road's next stretch and its cost, the bank, the words on the wire, the town's standing), and the slip says
  the difference (`Economy.movedLines`), each line under the mark of what moved:
  - the town's shelf (short → steady, and a bar: what it held in bone, what you added in gold, to the pixel);
  - the town's book (your word kept there, what it pays now, a crate more);
  - your word on the wire (kept here, walking to the towns it names), a letter written ahead or passed on;
  - the light (a star more; the valley's coverage before and after), or a town coming on the wire;
  - a road's next stretch (the bank's metal and ceramic against the paver's cost, or "the bank can pave it now");
  - a camp the light reached (its knives stood down);
  - the bank's surplus (what went out as freight).
  A delivery that moved nothing says nothing.
- **The surplus on the board.** What the bank holds past its reserve (80 metal, 60 ceramic, 60 wood, 30 lumen, 50
  provisions — *mine*) is packed as freight — ten of a material to a crate (five lumen): metal as machine parts, ceramic as
  water filters, wood as hand tools, lumen as lumen cells, provisions as rations (*mine*) — and posted as SURPLUS FREIGHT,
  up to three crates, on the board where that material was last banked: a works banks what it makes at the nearest lit
  door, the woods and the sweeps likewise, the outposts' caravans at Haven (Haven when nothing was made yet — *my reading*:
  the bank's home). It is bound for the lit town shortest of the good. One card a board (the material furthest past its
  reserve), after the town's own goods and before its post; one run of a material on the road at a time. Accepting it, the
  bank pays for the crates; the town pays for the walk (a tenth over a plain delivery).
- **The standings in the pay.** A town pays by its book — 6% for every word kept at its door, 3% for every word heard kept
  down the wire, less 10% for every word broken there and 3% for every one heard broken — times the stance of whoever holds
  its door, counted a tenth a step from where that faction started: the knives at a camp on the wire (the Road's Own truce
  pays 10% more), the Unlit courting a square (your hard line on them pays 10% less), the mountain in a garrisoned town
  (locked; no step). Between ×0.75 and ×1.3 (*all mine*). Two kept words there put a crate more on what is sent to it; a
  book gone bad takes one off (never below one). The same number is on the card, in the grade and on the slip, and the
  board says it over its cards: THE STANDING, the book in words, pays ×1.24.
- **The camps on the routes.** A camp brought in is part of the road (`Republic.onRoutes`: on the wire, given, or its
  stone set). None of them is ground the planner walks round, nor a hazard on a card.
  - A ring given is a rest fire (v3.49); a camp on the wire is a door.
  - The knives whose stone stands beside yours let a loaded Walker, and a convoy, through their ring, and say so (*mine*:
    the stone was the first thing they gave; passage is the second).
  - Every day those knives send one of theirs with the camp's salvage lashed on his back (the scrap and a cog, on the
    knife's bundle anchor), walking the valley's own path planner to the nearest lit town short of machine parts or hand
    tools. At the door the shelf fills by fourteen and the town is two likes warmer toward you. The first walk writes to
    you; the sheet draws the way in bone with the route's mark and the knife on it; the camp's roll says it is on your
    routes.
  - Hurt (under 55) or cold (under 35) with a load, the Guide stops you at a given ring's fire or a camp's door that lies
    within a third again of the walk: "Hurt — stop at Pass Camp's fire on the way". At the fire it lets you walk on.
- **The bus map.** Every window says, in one plain line in the manual's Windows tab, what it does for your deliveries,
  under the mark of what it moves; the windows the index had left out are rows now — Delivery complete, Transfer cargo,
  Ruin, Trader, Appearance, Build menu, Farkeep's desk, a camp's roll, Death certificate (twenty in all). The table below is
  every system in the game, what it takes from the delivery loop and what it gives back.

| System | Takes from the loop | Gives back |
|---|---|---|
| The board and the needs economy | a walk, crates carried, the clock | likes; the town's shelf and mood; stars; the next board's work |
| The wire (connection) | the ★ cores walked in | goods flowing between lit towns; the light's reach (land made safe); camps stood down |
| Stars | likes delivered at a door | a wider light; blueprints and the town's boons |
| The post (letters, parcels, the dispatch) | service walks, no fee | appreciation and its boons (a meal, weightless mail, the riders sworn); skill |
| The word (promises, the book, the wire's word, letters ahead) | parcels brought through in time | the standing in the pay; the keeper's errands; letters that put new towns on the boards |
| Roads and pavers | the bank's metal and ceramic (every delivery's donation) | faster walks; the wire's route; the slip names the next stretch |
| Builds (ladders, bridges, ziplines, shelters, generators, watchtowers, PO boxes) | the bank's materials | crossings, rests, storage, light, safer routes |
| The works | a build's cost and a site | materials banked; past the reserve, surplus freight on the nearest board |
| Outposts and caravans (Farkeep's desk) | recon and founding costs; an escort's provisions | hauls into Haven's bank; past the reserve, freight on Haven's board |
| The surplus on the board | the bank past its reserve | freight for the town short of it, paid as a delivery |
| Crew (hires, standing orders, the post's runners, field hands) | fees, meals, attention | carry beside you, the mailbag's pen, the woods and ruins banked |
| Skills | walks | stamina, balance, capacity, the lumen sense |
| Gear and the tailor | materials | warmth on the far roads, capacity, the face the towns know |
| The grey, weather and wraiths | risk on the road | why the light matters; the grey post's tier |
| Camps | cargo at risk; attention | once brought in: passage, rest fires, doors, salvage walked to your towns |
| Factions and stances | doctrine choices, shrines fed, a truce called | the pay at the doors they hold; the horns; the mountain's help |
| Holdings (a taken camp, a garrison, the storming) | materials and shields | safe rings, tithes |
| The memorial and the kin | the fallen | the kin's day hands; keepsakes worth a like at a door |
| Exiles and rifles | rank work, metal | the rifle's crack clearing a ring; contracts |
| The maps (valley, region, world) | nothing | the plan: who is short, where loads are bound, the routes |
| The myth (the ride, the lamp) | a night on the road | the legend the keepers greet you with |
| Death | the body and what it carried | a stone; the crates lost to their doors for the next walker |

**The battery rebuilt.** The sources of the v3.48 battery's suites went with the workspace; their records did not. v3.48
counted fifty-two suites; fifty-one were lost (ahead.mjs was in the workspace). I re-authored all fifty-one from their records
in this document — each check, in order, a sentence of what it proves — on the courier's grid, with helper agents writing side
by side against a frozen page and the whole battery then run on the final build (*my rebuild*; the originals' exact
instruments are lost). Forty-five had records that set down their checks. The six earliest — the delivery loop and the
network (loop.mjs, 33 checks), the character layer (character.mjs, 35), the keys-and-clicks run from the player's chair
(keys.mjs, 31), the mouse-only run (mouse.mjs, 18), the economy's dynamics (economy.mjs, 24) and the v3 loop rules (rules.mjs,
14) — are named in the record only by their subjects and their counts, so each of their checks is *my reading* of one
subject, tested as the game has it now; their file names are mine. The thirty-minute balance session, which the record
counts beside the suites, is a suite again (session.mjs). They share one boot and one set of instruments
(tests/lib/harness.mjs); tools/battery.sh runs them one at a time and tallies; tools/slot.sh keeps side-by-side runs to the
machine's cores. With ahead.mjs, passed.mjs, courier.mjs and the new moved.mjs, the battery is fifty-six suites, and the
shop audit's credit for what the lost suites read (tools/exports_v348.json) is retired: every export is read here. Where a
record described something since changed by design (the plain names of v3.49, the cast of v3.51), the check tests the
design as it stands and says so in its name. Where a check pinned a count later versions grow (the lessons), the older
suites hold a floor and the manual's suite pins the whole.

**Found on the way — by the rebuilt battery.** Each of these failed a check its record made, and each is fixed:

- **A hired Farkeeper never met a runner:** the intercept read a position no back carries (x; a back walks on cx) — republic.mjs.
- **A companion could not be clicked or traded with in the world, and their "Hold on — pull!" was said nowhere:** the
  same misread — feel.mjs. The call now rides over their head and walks with them.
- **The scrappers' death certificate closed on no epitaph:** the lookup used the certificate's words where it wanted the cause's key; a
  fall printed as "fall". Every cause is said in words now, and the Reapers' and the Hollow Fires' deaths have lines of
  their own (*mine*).
- **The fault chip sent you to FREE MY BOOTS:** the menu's button has been Unstick since v3.49.
- **A C20's crack warned no farther than the Timberwolf's:** the rifle's own warning radius went unread.
- **The desk's buttons lost a press held across its half-second refresh:** a press is its button's now, whatever the
  refresh did under it, and the refresh rewrites only what changed.
- **The valley map came up blank** after the sheet was opened on the region tab and stepped down: the hidden canvas had
  been sized to nothing.
- **A pip on the rear rail opened Crew on no one:** its id arrived as text.
- **The station's beam stood on its head:** brightest and narrowest at the top, widest and dimmest at the cage.
- **The night lay a fraction of a pixel off the ground:** every texel edge in a lamp's pool was half dark (the partial alpha
  the law forbids). It lies on the ground's own whole-pixel origin.
- **A gold card had lost the paper's grain** (and the splice coil's, and every card under the pointer): the tint lies over
  the paper now.
- **The enlistment photograph was squeezed into its own border** (74 pixels of 80).
- **A hunting wraith burning at the light's edge never taught the lesson:** the hunt set it burning before the lesson's
  check could see it.
- **No safe walk was ever LONG POST:** the line was 300 seconds and no walk in the valley takes that long. It is a minute
  (*mine*).
- **The Salvage shape posted a wreck run for a shelf the town had plenty of** (between 65 and 70).
- **Time ran backwards for a frame** after an unpause or a slow step (the title's tour faulted on it).
- **Three fields rode every save for nobody** (roadFund, awayStamp, a town's wireT). They are gone.
- **Elm Farm's fresh boots counted twice:** "+4% walk speed" walked 8.2% faster (and the LONGLEGS cheat's +12%, 16.8%); the
  boots ride the Walker's own speed once — loop.mjs.
- **Randomize could roll the locked Lamplighter** on the New character sheet, with no card chosen; a locked calling rolls
  only where the sheet offers it — character.mjs.
- **A terminal tended the Walker only when a crate was handed over:** the Courier's second wind, the journal's
  transcription, a relic finding its people and the town's hands on a bleed waited for a delivery. Every visit does them now
  — character.mjs.
- **The stamina ceiling never moved:** it was set once at enlistment, so Endurance and Deep Lungs raised nothing. It follows
  them from the walker's own hundred — character.mjs.
- **A station's rest ignored the walker:** Restless and the Child's drawing changed nothing — character.mjs.
- **Keen Eyes and the compass rose saw no further:** the compass read fixed ranges (and the watchtowers' reach on the map
  the same) — character.mjs.
- **Lucky Find leaned to the common lines of a ruin's table.** It takes a second look now and keeps the rarer line (*mine*)
  — character.mjs.
- **A Hearthkeeper's companions ate more often**, not 30% less: the meal clock was multiplied by the smaller upkeep — character.mjs.
- **A companion's load did not deliver with you** unless the Walker carried something of their own for the same door: the
  door counted only the Walker's back. The crates the party carries count at the door, and they leave the pack one by one with
  the rest — rules.mjs.

**Found on the way — the eye.**

- The marks on the slip were drawn at 16 pixels, sixteen-sevenths of a pixel a texel; they are at 14.
- The sheet's marks started between screen pixels, every texel's edge blurred; they start on whole pixels.
- The shield-bearer's spear rode off the top of his grid on the passing steps (v3.51's own art); it is two texels shorter.
- The first surplus built posted a card for every material past its reserve, and on a rich bank they crowded the town's
  post off Haven's board; it is one card a board, after the town's own goods.
- Four walking frames of the camps' own spelled T, O, D, O across a belt's end, which the ship's check reads as a note left in
  the page; the belt's last texel takes the trim's shade there, the belt turning away.
- At a door with four prompts on the rail, the rail covered the party card's foot (its PARTY label and "click to hand over");
  the card stands above the rail's tallest stack — character.mjs.
- On an 800-pixel window the Delivery complete slip, WHAT IT MOVED and all, hid Carry on below a scroll; under 940 pixels the
  slip draws its grade and rows closer, and it fits.

**Proof.** moved.mjs, 11 checks: the registries; the surplus on the board (posted where it was made, a real click, the bank
paying); what it moved on the slip (the shelf's bar to the pixel, the bank's line, the marks' texels); the book, the word,
the road and the camp; the standings in the pay (the book, the crates, the holder's stance, the board, the card, the grade
and the slip agreeing); the knives letting you through; the salvage walked in (seen on the ground, the shelf, the sheet,
the roll); a stop on the way; the bus map; the save; no errors. courier.mjs 10 checks, its registry now the cast beside the
courier (27 frames; twenty figures on their own grids, every frame its own, the outline law, every letter in its palette,
the camps' own at the courier's height, the Farkeepers' riders a head taller, the kid a child's). The six earliest suites,
*my reading*: loop.mjs 33 (the board, a real click, the walk and the door, the slip, a chained trip, the core and the wire,
the light measured, stars and what they open, three towns lit and their goods moving, a camp in the light, a road, the
network outliving the walker), economy.mjs 24 (the needs and moods, the drain and the fill, the wire's flow and its roads and
porters, dimming, a star lost, quiet and relit, the chain, letters, crises, night, the skill verbs, a v1 and a v2 save),
character.mjs 35 (the New character sheet by real clicks, the eight callings and their perks, the traits, the skills and
their curve, the manuals, the body and its moodles, the kit, the ruins, a companion and a route porter, an event, death in the
light and in the grey, the journal at 70%, the ground's rules, the HUD, the ★ order posted again), rules.mjs 14 (the lost
crate's chain, recovery, the stash, giving up, the companion's load, thriving not posted, the mailbag, loaded routes round the
camps, the star kept while the wire closes a shortage, the crisis, the honest stall, the wire's scene), keys.mjs 31 (the
player's page from the title by keys and real clicks only: enlistment, every key of the registry, the first orders walked and
delivered, the character layer met unprompted inside a minute of play) and mouse.mjs 18 (no key after boot: the first
delivery by the mouse alone, and each tap — the route round a cliff, the Silt refused in its own words, a ladder laid and
taken, a camp skirted loaded and walked through empty, a ruin, a crate, a cairn, a paver, a pylon, an event — the steer, the
sprint, the map's travel, the honest stall). The whole battery run on the final build: **937 tallied checks across fifty-six suites, zero fails**; shop audit CLEAN. (One check was re-run on the same build: courier.mjs's four sides met the rail's E cap, left over from Haven's door after the stage's teleport, whose bobbing arrow had crossed a sampled texel of the Walker. The check now reads the rail where the Walker stands, and every sampled texel is its own colour.)

**Held.**

- The rebuilt suites are *my reading* of their records: the originals' instruments are lost, and the six earliest suites'
  records name only their subjects.
- A walker on the mouse alone cannot open the Map from the field: M and Tab are keys, and the pause sheet opens on Esc.
  mouse.mjs opens it by staging; its click on the map is real.
- On a window under about 760 pixels the slip's last line (FILE UNDER · DELIVERED) scrolls; Carry on stays in view down to 720.

## Within reach (v3.52 — the papers row, the short window, the records traced)

The user's word after v3.51 was its honest REMAINING, whole: a walker on the mouse alone could not open the Map or the
pause menu from the field (M, Tab and Esc are keys); below about 760 pixels the Delivery complete slip's last line
scrolled; and the rebuilt suites are my reading of their records, the original test code being lost.

**The papers row.** The six papers the keys open — KEYS' own `papers` group: Map, Cargo & equipment, Skills, Crew, Manual,
Pause — stand as a row of buttons under the ◆ and the day, each a glyph drawn by hand for it (the bench tools/hud/hud.py
writes `SPRITES.HUDGLYPH`: 12×12 on the survey marks' palette, under the outline law; the survey sheet folded in three with
a red route walked to a gold pin, the courier's pack from behind with its flap and buckle, three bars rising to gold, two
hoods, the field manual with the lamp stamped on its cover, two bars of paper), shown at two screen pixels a texel. The
pointer on a button reads its paper's own name and the key that answers it now under the row; a button is lit while its
paper is open. A click takes the key's own path (the main loop's one paper act), so a rebound key reads in the row and
answers the same as the click. The REMAINING named the Map and the pause menu; the row carries the whole papers group
(*mine*: the pack, the skills, the crew and the manual a click away beside them).

- **Every paper closes by a click.** The map folds away by its own CLOSE (it folded only by a key, or by walking somewhere
  off it); the pack has its CLOSE, at its foot; the Paused sheet's Resume stands under its settings, outside the scroll (it lay below a
  scroll even on an 860-pixel window), and on a short window the settings lie in two columns.
- **Every window within the mouse's reach.** The region and world maps on the map's own tabs; the cargo rules, the factions
  and the crew on its rail; the manual from the Paused sheet; and the Paused sheet from the manual's index of windows, where
  it is listed at last — twenty-one windows, its own 7×7 mark, and every paper of the row shows its button's glyph beside its
  key there.
- The pack, the earn feed and the zoom note stand under the row now, at every paper scale.

**The short window.**

- **The slip.** Carry on and the file line stand in the slip's foot, outside the scroll, at any height. Under 800 pixels high
  a slip that moved something lies in two columns — the grade and its rows on the left; the grade's line, the pay and WHAT IT
  MOVED on the right — and under 660 the two columns draw closer (the stamp, the pay, every row). The fullest slip the
  ecosystem pass writes (seven things moved) reads whole, nothing scrolled, at 1280×720, 1366×650, 1280×600 and 1024×600; at
  560 high the body scrolls by a hand's breadth under the pinned foot. A tall window keeps the one column.
- **The intro card** fits a short window: on a 600-pixel window its head had stood above the window and the title's foot
  line had lain over Start and taken its click (a walker on that window could not begin). The card is held to the window,
  its story scrolls if it must and Start stays in view; the foot line hides while the card is up and never takes a click.
- **Banners wait for a paper.** A banner called while a paper is up (the slip, a terminal, a sheet) has its words set and
  lands over the field when the paper is gone, one at a time in the order called (the star's NEW SHAPES OF WORK had crossed
  the slip's rows). *Mine*: held, not moved.

**The narrow window** (*mine* — found by measuring the row on narrow windows; no report named it).

- **The top band keeps its middle.** The compass, the Guide and the toasts keep the middle of the HUD's top, between the
  vitals and the right-hand column (the ◆ and the day, the papers row, the pack's column), at every window width and paper
  scale. Under about 1,230 pixels wide the Guide narrows and wraps, centred under the compass with the toasts beneath it;
  under about 1,040 the compass narrows rather than reach the vitals. Where the middle is too narrow for the Guide to read —
  under about 860 pixels wide at Small, 950 at Standard, 1,090 at Large, 1,225 at Larger — it steps down under the vitals, left of the
  Walker who stands mid-window, and the toasts take its place at the compass's foot, the Guide always under them. At 1,280
  wide and up, at Standard, nothing moved. (Under 960 pixels the Guide had lain over the vitals, under 900 over the papers
  row, under 800 over the ◆ and the day; under 1,020 the compass had crossed the vitals.)
- **The band's scale.** The Guide, the toasts, the pack and the name read under the row are paper: they are drawn at the
  paper scale, or as near it as the window's width allows the toasts a column of their own — Large keeps its size down to
  about 860 pixels wide and Larger down to about 970, and below that they are drawn smaller (Larger at 1.25 on a 960
  window, 1.2 at 900, 1.05 at 800); the reading sheets keep the scale chosen. The papers row is pixel art, like the vitals: its glyphs stay at two screen pixels a texel at every scale
  (at Small and Larger they had fallen between pixels). The earn feed and the zoom read keep whole pixels and stand under
  the row at every scale (at Larger they had lain across it); the name read under the row takes the zoom read's place while
  the pointer is on a button, and the pack opens under it.
- **The pack** is no taller than the room above the order tray, its list scrolling, its CLOSE at its foot (a full pack had
  run past the window's foot and over the tray; a ◆ landing in the earn feed had covered the CLOSE).
- A Guide line with nowhere to point keeps no empty arrow column.

**The records, traced.** The originals are in no place this session reaches: the artifact's published files (it is a single
page), the project (no uploads), the workspace (v3.49's package holds only ahead.mjs, passed.mjs and the probes). What can be
shown is how close the rebuild stands to its records. Each rebuilt suite has a ledger (tests/records/<suite>.json: the
record's stated count and the words that state it, the record cut into what it says a check proves — each clause verbatim —
every check by its title with the clauses it proves, the changes by design, and every figure the record names with what the
check asserts of it), and tools/records.py reads them all against the documents with the rebuild's own account cut out of
them, so no ledger can quote the rebuild as its record. It fails on a count the suite does not keep, a clause not in the
record's words, a clause no check proves, or a check that proves no clause and is not marked mine.

- 52 suites, 851 checks, 1,549 record clauses, every clause proven; 109 clauses the game has since changed by design; 11
  checks mine (the loop's eight that the record names only by its subject, the character layer's three from the v2.0 design
  outside the repo).
- The counts: from v3.39 on the records count the harness's own no-errors check among their checks (and so does the shapes
  suite's), and the ledgers count it there; five checks stand beyond their record's count (the shop audit's record counts
  the gate as one check in the battery's tally and the rebuild makes four; the watchdog's stillness law came at v3.30 with no
  count; one in the shapes suite whose record does not say which two of its items the original proved in one check); two
  records state no count at all (the balance session, the shop audit).
- The record's own figures: 339 asserted exactly, 74 as a threshold, 27 changed by design, 27 not pinned.
- The tracing found clauses no check proved, and each check nearest the clause was extended to prove it (never its title,
  never the count): the pack buttons' feedback and the interception's ring (feel), the horse spooked into bolting by the
  knives (progression), no decision repeated and every teleport where a ladder would go (session), the dossier never
  storing a keepsake (carried), fear and the rungs among the ring's reasons and the balk (fairness), the dossier's strict
  order through Store (ledgers), the garrison's rations counted on the sheet (holdings2), the waybill's appreciation mark at
  30 pixels and the ledgers' at 16 and 18 (exileroads). Twelve checks whose names claimed more than their conditions asserted
  now assert it (the last door's par and averaged condition, the knives going for the junior first, the hidden walk's clean
  return, a slab a stretch, the kid's letter held high, the freeze-frame's stamp, the cold staff-lamp, the badge's image and
  counts, the rescue's two shots, the runners cooled, the camera on the gun, the paper pinned on the desk). The work orders'
  party card had flaked: a half-second mood cache raced the staging; it is read after the cache turns over.

**Found on the way — by the tracing.**

- **A wraith's grab could not be torn free on a long frame.** The drain was taken before the escape was tested, and the meter
  stops at the top, so on a frame of more than a twentieth of a second — a machine under twenty frames a second, or a fast
  clock — no press could reach the escape: the walker was held until a yank took the crate, or held in the grey until they
  starved (the balance session's two intermittent failures). The press that fills the meter frees you now, whatever the
  frame carries. The session's bot plays a grab as a sixty-frame player would and eats from its pack on the road.
- **The stand read as cut with a bolt left in.** The word-kept suite's stand at the new chief's fire had failed now and then:
  a bowman's bolt from the walks before was still lodged, and it seeps, so the Walker ended the stand a point short of
  whole. The stand's staging pulls it first, as v3.51's warmed and fed the Walker; the check now says why when it does not
  hold. The feel suite's clicks on the pack land on its own paper (CLOSE went to its foot, and the old fractions of the
  panel had come to land on a crate's drop).
- **The rest stop's lamp read in the rain.** The passed suite read the sign's lamp by its own colour, and under the grey's
  rain at Pass Camp its light reads paler, so the check failed whenever it rained there; it samples under clear skies now.
  The top band's check asks for at least its own two toasts (the game had posted a third in the middle of it).

**Found on the way — the eye:** the Paused sheet's Resume below a scroll; the intro card's head above a 600 window and its
Start under the foot line; a banner across the slip; the map with no close but a key; the pack with no close but a key; the
Paused sheet missing from the index of windows; on narrow windows the Guide over the vitals, the papers row and the ◆, and
the compass over the vitals; at the Small scale the Guide raised onto the compass; at the Larger scale the earn feed and the
zoom read across the row; the pack past the window's foot and over the tray, and its CLOSE under a landing ◆; the Guide's
empty arrow column on a line with nowhere to point.

**Proof.** reach.mjs, 12 checks: the papers row drawn (the registry, the outline law, every texel of every glyph its own
colour on the screen at two pixels a texel, its place under the ◆ and the day); clear of every panel of the HUD at
1440×860, 1280×720 and 1024×640 with the HUD at its busiest; every paper opened and closed by a click with no key pressed
(lit, its name and key under the row, the Paused sheet holding the clock); the key and the click one path (a rebound key in
the row and on the map's CLOSE); every window within the mouse's reach; the Paused sheet in the index (twenty-one, its mark
texel for texel, every paper's button beside its key); the slip on a short window (two columns, nothing scrolled, the foot
pinned at 560); no banner across a paper; a grab torn free on a slow frame; the intro card on a 600 window through to the
Paused sheet; the records traced (tools/records.py CLEAN over the fifty-two); the top band keeps its middle (seventy-two
layouts — nine window sizes from 1440 down to 700 wide, the four paper scales, the Guide's longest line and an order's
line with its arrow, the pack open, the ◆ in the feed, two toasts in the air — no piece over another, the pack clear of the
tray with its CLOSE in view). mouse.mjs opens the map by a click on the row
and folds it by its CLOSE (the staging gone); the character layer's HUD check counts the papers row among the panels; the
manual's and the passed suites pin twenty-one windows; the feel suite clicks the pack's own paper; the word-kept suite's
stand pulls a lodged bolt first. The whole battery on the final build: 950/950 checks across fifty-seven suites — 948 on the first pass, its two
failures test-side (the lamp read by its colour in the rain; a toast the game posted mid-check), both fixed and re-run
green on the same build.

**The records, suite by suite** (tools/records.py --table; "Its count" is the record's own; "Checks" counts the harness's
no-errors check where the record counts it):

| Suite | Record | Its count | Checks | Beyond it | Clauses proved | Changed by design | Mine |
|---|---|---|---|---|---|---|---|
| answered.mjs | v3.47 · DESIGN.md — The word answered (v3.47 — the door that heard, the keepsake set down, the road kept, the stone's keeping, the line's watch) · Proof | 8 | 8 | 0 | 24/24 | 3 | 0 |
| assets.mjs | v3.33 · DESIGN.md — The asset pass (v3.33 — the PixelLab pipeline, on our terms) | 13 | 13 | 0 | 15/15 | 3 | 0 |
| body.mjs | v3.19 · DESIGN.md — The body remembers (v3.19 — the pack authored, the weather interactive, the pushback earned) | 30 | 30 | 0 | 64/64 | 3 | 0 |
| builds.mjs | v3.12 · DESIGN.md — v3.12 — THE BUILDS: the player's trophies get station-grade art, and the doctrine closes | 12 | 12 | 0 | 14/14 | 1 | 0 |
| campsown.mjs | v3.41 · DESIGN.md — The camps' own (v3.41 — the raiders by trade, the parcels addressed, the square's own, the count bought) · Proof | 9 | 9 | 0 | 31/31 | 5 | 0 |
| carried.mjs | v3.46 · DESIGN.md — The word carried (v3.46 — the word on the wire, the kin's thanks, the truce as a road, the score settled, the line's orders) · Proof | 10 | 10 | 0 | 26/26 | 2 | 0 |
| character.mjs | v2.0 · DESIGN.md — Three lessons, all kept (v2.0 → v2.1) · Everything below is as shipped in v2.x · The two laws · Verification — the character-layer systems, named by their subjects (the v2.0 design itself is the Project doc, outside the repo) | 35 | 35 | 0 | 15/15 | 3 | 3 |
| continent.mjs | v3.26 · DESIGN.md — The Darklands table (v3.26 — the scale ladder made honest) | 9 | 9 | 0 | 19/19 | 1 | 0 |
| deadboot.mjs | v3.28b · DESIGN.md — The dead boot law (v3.28b — the frozen-input report answered at the ROOT) | 19 | 19 | 0 | 31/31 | 5 | 0 |
| economy.mjs | v3.0 · DESIGN.md — Verification: the economy dynamics (24) and its subjects — clauses from The economy (what a delivery is now), v3.0, and the save line of the build's header | 24 | 24 | 0 | 38/38 | 1 | 0 |
| ecosystem.mjs | v3.27 · DESIGN.md — The ecosystem (v3.27 — utilities ride the pack, works hold the ground, the loop revolves) | 14 | 14 | 0 | 33/33 | 1 | 0 |
| exileroads.mjs | v3.30 · DESIGN.md — The exile roads (v3.30 — Shutterlight, the guild, the C-series, the Hooded Row) | 22 | 22 | 0 | 28/28 | 1 | 0 |
| exiles.mjs | v3.25 · DESIGN.md — The names & the exiles (v3.25 — Waylight is a CITY, the protagonist framed, the Lamplighter, the Society) | 20 | 20 | 0 | 53/53 | 2 | 0 |
| faces.mjs | v3.43 · DESIGN.md — The face at the door (v3.43 — the grievance said to your face, the town's own who fall, the chief's return as a scene, the scar, the click into the roll) · Proof | 8 | 8 | 0 | 27/27 | 2 | 0 |
| fairness.mjs | v3.31 · DESIGN.md — The fairness pass (v3.31 — four field verdicts, answered at the root); its Proof line shared with the delivery ledgers | 10 | 10 | 0 | 20/20 | 0 | 0 |
| feel.mjs | v3.2 · DESIGN.md — v3.2 — identity, hands, and a working companion · v3.3 — the 90s pass · Verification: the feel suite | 31 | 31 | 0 | 54/54 | 2 | 0 |
| firstwalk.mjs | v2.2 · DESIGN.md — Three lessons, all kept (v2.1 → v2.2) · The first walk (unchanged, re-verified) · v3.14's DELIVER ceremony, walked by the screen-reading bot | 24 | 24 | 0 | 13/13 | 0 | 0 |
| frontier.mjs | v3.28 · DESIGN.md — The frontier (v3.28 — RECON & OUTPOSTS: the Darklands table becomes a working desk) | 24 | 24 | 0 | 41/41 | 0 | 0 |
| glowpass.mjs | v3.15 · DESIGN.md — v3.15 — LIGHT HAS A BODY: the sources are fixed, not deleted, and the props join the hand | 10 | 10 | 0 | 19/19 | 0 | 0 |
| ground.mjs | v3.21 · DESIGN.md — The builds earn their ground (v3.21 — upgrade ladders, towers that act, the room, the box) | 15 | 15 | 0 | 32/32 | 0 | 0 |
| holdings.mjs | v3.34 · DESIGN.md — The holdings (v3.34 — conquest, the world's own wars, two walked halls) | 19 | 19 | 0 | 44/44 | 2 | 0 |
| holdings2.mjs | v3.39 · DESIGN.md — The losable holdings (v3.39 — towns taken by force, a post that can fall, the grey banners' wars) | 8 | 8 | 0 | 33/33 | 1 | 0 |
| inputs.mjs | v3.28a · DESIGN.md — The watchdog (v3.28a — the frozen-input report answered as law) | 16 | 17 | 1 | 23/23 | 2 | 0 |
| karma.mjs | v3.22 · DESIGN.md — Karma & the Republic (v3.22 — two coins, the quiet work, and the mountain come down) | 21 | 21 | 0 | 40/40 | 1 | 0 |
| kept.mjs | v3.45 · DESIGN.md — The word kept (v3.45 — the hands' faces, a word remembered, the kin's errand, the grudge answered, the line at the ring) · Proof | 12 | 12 | 0 | 34/34 | 4 | 0 |
| keys.mjs | v2.1 · DESIGN.md — Three lessons, all kept (v2.0 → v2.1) · Controls · Verification — the keys-and-clicks player-fidelity run, named by its subject | 31 | 31 | 0 | 8/8 | 2 | 0 |
| lamps.mjs | v3.13 · DESIGN.md — v3.13 — LIGHT BEHAVES (a retraction, then the fix) | 9 | 9 | 0 | 11/11 | 0 | 0 |
| ledger.mjs | v3.9 · DESIGN.md — v3.9 — LEDGERLIGHT: the house style, named (8 checks) · v3.10 — the interface is the Order's paperwork (four new checks) | 12 | 12 | 0 | 21/21 | 5 | 0 |
| ledgers.mjs | v3.31 · DESIGN.md — The delivery ledgers (v3.31 — the RimWorld-style management layer); its Proof line closes the fairness pass section | 16 | 16 | 0 | 22/22 | 5 | 0 |
| light.mjs | v3.1 · DESIGN.md — The light is the screen (v3.1) · Verification: the light, measured in pixels | 10 | 10 | 0 | 17/17 | 2 | 0 |
| loop.mjs | v3.0 · DESIGN.md — Verification: the delivery loop and network progression (33) — the record names the suite by its subjects only; clauses from the v3.0 sections (The economy · The light is the screen · Where the features now live · Controls · The first walk · The two laws), and the subject words themselves where a check reads a subject those sections do not describe | 33 | 33 | 0 | 35/35 | 0 | 8 |
| manual.mjs | v3.35 · DESIGN.md — The player's pass (v3.35 — the field manual, the keys, the passage papers) | 19 | 19 | 0 | 30/30 | 7 | 0 |
| memorial.mjs | v3.29 · DESIGN.md — The memorial (v3.29 — the ground that keeps the Order's own) | 20 | 20 | 0 | 26/26 | 3 | 0 |
| mouse.mjs | v3.0 · DESIGN.md — Controls: one hand for travel, two for trouble · Verification — the mouse-only run, named by its subject | 18 | 18 | 0 | 13/13 | 0 | 0 |
| muster.mjs | v3.36 · DESIGN.md — The muster (v3.36 — standing orders for the people who walk with you) | 13 | 13 | 0 | 28/28 | 2 | 0 |
| myth.mjs | v3.23 · DESIGN.md — The myth in the flesh (v3.23 — the legend, the micro-cines, THE HANDOFF, the coat that is yours) | 19 | 19 | 0 | 44/44 | 2 | 0 |
| paths.mjs | v3.7 · DESIGN.md — v3.7 — the ground remembers, and the world speaks in pixels | 9 | 9 | 0 | 8/8 | 0 | 0 |
| pixelpass.mjs | v3.11 · DESIGN.md — v3.11 — PLATE & PAPER: the pixel pass | 21 | 21 | 0 | 32/32 | 5 | 0 |
| post.mjs | v3.16 · DESIGN.md — v3.16 — THE POST: letters stop being filler and become the Order itself | 18 | 18 | 0 | 42/42 | 2 | 0 |
| postorders.mjs | v3.38 · DESIGN.md — The posted orders (v3.38 — the posts on the same store, the working world's mood, the survey) | 9 | 9 | 0 | 22/22 | 3 | 0 |
| progression.mjs | v3.17 · DESIGN.md — v3.17 — THE ROAD HAS MORE THAN ONE SPEED: attainable, alive, and taught in a line | 18 | 18 | 0 | 33/33 | 5 | 0 |
| remembering.mjs | v3.42 · DESIGN.md — The remembering (v3.42 — the survey's marks, a chief who remembers, the town's own on the roll, the grievance, the bolt) · Proof | 8 | 8 | 0 | 27/27 | 4 | 0 |
| republic.mjs | v3.32 · DESIGN.md — The Republic in force (v3.32 — the CK3 sandbox foundation) | 19 | 19 | 0 | 32/32 | 2 | 0 |
| rules.mjs | v3.0 · DESIGN.md — Losing a crate · Controls · Balance (the session bot) · Verification — the v3 loop rules, named by their subjects | 14 | 14 | 0 | 25/25 | 0 | 0 |
| session.mjs | v3.0 · DESIGN.md — Three lessons, all kept (v2.3 → v3.0) · Balance (the session bot) | — | 8 | 0 | 14/14 | 1 | 0 |
| shapes.mjs | v3.18 · DESIGN.md — v3.18 — THE SHAPES OF WORK (the same walk, different questions) | 19 | 20 | 1 | 49/49 | 2 | 0 |
| shopaudit.mjs | v3.28c · DESIGN.md — The clean shop (v3.28c — the standards correction, executed as work): the gate and its Proof | — | 4 | 3 | 6/6 | 0 | 0 |
| standing.mjs | v3.40 · DESIGN.md — The standing ground (v3.40 — the letters, the wedge on the compass, the square that rises, the storm seen, the Society's war) · Proof | 8 | 8 | 0 | 43/43 | 5 | 0 |
| wider.mjs | v3.24 · DESIGN.md — The wider world & the production (v3.24 — the Cine engine, THE RIDE, the globe, the party of four) | 27 | 27 | 0 | 85/85 | 1 | 0 |
| word.mjs | v3.44 · DESIGN.md — The word at the door (v3.44 — the Walker's answer, the kin in the square, the new chief's grudge, the scar on the stone, the road to the ring) · Proof | 11 | 11 | 0 | 28/28 | 2 | 0 |
| working.mjs | v3.20 · DESIGN.md — The working world (v3.20 — traffic writes the land, crews work it, every coin is seen) | 17 | 17 | 0 | 40/40 | 1 | 0 |
| workorders.mjs | v3.37 · DESIGN.md — The working orders (v3.37 — the field and the roads, on the same stores) | 16 | 16 | 0 | 37/37 | 3 | 0 |

**Held.**

- The rebuilt suites stay my reading of their records: the ledgers show that reading clause by clause, and they cannot
  recover the original test code, which is in no place this session can reach.
- 27 of the records' own figures are read by their checks rather than asserted (the works' rates and reaches the ecosystem
  suite reads from the tuning rows, a die held under a stone's chance, the six seconds of a stall), and 74 are asserted as a
  threshold where the record gives a number.
- At the Small, Large and Larger paper scales the pixel marks inside the papers (the pack's crate icons among them) fall
  between whole screen pixels, as they have since the paper scale came in at v3.35; the papers row keeps whole texels.
- The HUD is proven down to 700 pixels wide; at Larger under about 900 a long toast wraps to five lines in its column.
