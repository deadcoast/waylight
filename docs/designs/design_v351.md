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
