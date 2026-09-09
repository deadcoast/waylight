# THE SHOP AUDIT — v3.28c THE CLEAN SHOP

The standing answer to: *"I literally have no idea what's redundant, what's duplicated, what's
old, what's artifact. That's your job."* Below is every finding the instrument raised, what each
one actually was, and what was done about it. The instrument itself (`tools/audit.py`) now runs
inside the battery (`tests/shopaudit.mjs`) — any future finding FAILS the build, so the shop
stays swept because the sweep is a gate, not a memory.

## The tire, changed (the attic corrected to the real mechanism)

The v3.28b "attic" hoarded unknown structure types instead of fixing why they exist. The audit of
every shipped version found the type history ADDITIVE-ONLY — no rename or removal ever shipped —
so the attic quarantined a case that could not occur, while the real forward case (a save written
by a NEWER build) had no correct path at all. Replaced end to end with:

- **THE TYPE LEDGER** (`DATA.MIGRATE_TYPES`): the standing law that a structure type is forever —
  any future rename ships its map entry in the same edit, and `load()` walks every save forward
  through the map. Opens empty because the history earned it.
- **One normalize seam in `load()`**: every structure passes the ledger; a type past it becomes a
  real, VISIBLE, inert `unmapped` object (authored tarp-and-rope glyph, decay 0, never buildable,
  original type carried on the object) that steps back into itself the moment a build that knows
  it loads the save. Proven round-trip in `deadboot.mjs`.
- **Removed**: the attic push, the attic restore loop, the v3.28a splice, and the save-field
  residue (attic contents drain back into the world on next load). Runtime garbage in the
  structure list is a CODE bug and now behaves like one — named on screen by the fault guard,
  never absorbed silently (`inputs.mjs` proves it).

## The floor, swept (61 raised → every one verified → 0 remain)

**UNREACHABLE BRANCH — removed (1).** `15_systems.js`: `if (st.type === 'zipline' && false)
continue;` — a decay exemption patched off by short-circuit instead of deletion, shipped dead.

**DEAD DECLARATIONS — removed (6).** Zero references anywhere, comments included:
`World.nearRiver` (one-liner, never called), `World.invalidatePathGrid` (grid cache poke, never
called), `Economy.MOODS` (superseded by `MOOD_RANK`), `Economy.dim` (mood shorthand, no callers),
`U.esc` + `U.segNearest` (util helpers nothing ever used), `UI.crateChip` (a self-labeled
"compat" shim with no consumers).

**DEAD UI SUBSYSTEM — removed end to end (1).** The DOM cine-title (`#cineTitle` node, 4 CSS
rules, `showCineTitle`/`hideCineTitle`, and two cleanup calls that hid a title which never
showed): `showCineTitle` had no caller anywhere — the v3.24 cine engine draws its titles on the
canvas. A title that can never appear plus code to hide it is exactly the floating artifact class.

**DEAD EXPORTS — trimmed, functions kept (44).** Working internals that were needlessly public;
the function lives, the dead export surface goes: World's raw canvas/grid handles (CP, LH, LS,
LW, glowC, lightG, mistC, rc, veilC, thumb, rebuildThumb, slopeAt, roadSegPts), U.noise2 (fbm's
own engine), State.levelNeed/totalNeedFor, Porter.readJournal, eleven Systems internals
(checkMilestones, clickTarget, convoyKnock, gradeOrder, lootWreck, lostForStation, nearestPaver,
pacifiedCampNear, paverCost, probeCrossing, spawnEchoes), four NPC internals (clearEvent,
nearestConnected, refreshPools, rollLoot), four Economy internals (MOOD_RANK, goQuiet, makersOf,
moodOf), four UI internals (apprChip, itemIcon, likeBurst, renderBuild), UI2.renderTransfer +
updateCompChip, Myth.beginHandoff/endHandoff/endMicro, Globe.baked, Frontier.st.

**FALSE POSITIVES — instrument fixed, code untouched (9).** The eyeball pass exists because a
lexical tool lies in known ways; each lie became an analyzer upgrade: spread syntax
(`{ ...PAL_WALKER }`) hid four live palettes and RUIN_SPREAD → spread now counts as a reference;
`tut(cond ? 'firstKit' : 'firstLadder')` hid two WIRED tutorials behind a ternary → any quoted
key on a `tut(` line now counts; destructured imports (`const { CAUSES } = CHAR`) and renamed
destructures (`structures: SDEF`) hid dozens of live consumers → credited; `T().key` call-style
reads hid live tuning → matched; a static DOM node with content (`#txSub`) is alive by rendering
→ only EMPTY unreferenced elements flag.

**Out of lexical reach, on the record:** dynamic-key tables (items, epitaphs, barks, keepers,
dispatch), string-built ids, and computed class names are beyond a lexical instrument — the
report prints that limit every run instead of pretending coverage.

## Proof

Build syntax green · audit CLEAN · `shopaudit.mjs` standing gate green · full battery **481
checks across 31 suites, zero fails** (deadboot re-proves the ledger round-trip; inputs re-proves
loud-not-absorbed).
