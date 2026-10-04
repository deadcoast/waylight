# WAYLIGHT v3.51 — the figure benches: one style law

Every figure in the valley is drawn the way v3.50 drew the courier: by hand, texel by texel, on the grid it lands on.
This file is the shared law for every bench that draws people, beasts and set pieces for v3.51. Read it whole first.

## Read before drawing (the references)

1. `tools/courier/courier.py` — the courier bench, whole. It is the model for how a figure is BUILT: hand-drawn part blocks
   (head, torso, arm in each swing, legs in each step) composed per frame with `stamp`/`put`, then `close_outline`.
2. `tools/courier/draft.py` — `derive(p)` (the palette derivation) and `render(frames, path, k, cols, pal, bg)`.
3. `shots/courier_sheet.png` (8×, every courier frame) and `shots/courier_in_game.png` (1:1 in the game) — LOOK at both.
4. The old rows of the figures you redraw (line ranges are given in your brief). They carry the figures' identity (what
   they wear and carry). They are NOT a model for texels: the v3.50 versions were resampled by 4/3 and show doubled
   outlines and uneven texels — the defects this pass exists to remove.

## The laws

- **Hand-placed.** Parts are drawn as row strings and composed; nothing is generated, scaled, resampled, rotated or filtered.
  A part may be reused across frames and figures (the courier's legs and arms are free to reuse for courier-grid people).
- **Grids and anchors.**
  - Courier grid: 32×32. The figure's centre column is 16 (the courier's head spans columns 11–20). Soles on row 30; row 31
    stays empty. Adults on this grid stand 22 texels crown to sole (rows 9–30), a hat or hood crown may add a row or two.
  - Tall grid: 32 wide × 40 high, centre column 16, soles on row 38, row 39 empty. Farkeepers stand a courier's head taller
    than the courier (28–29 texels crown to sole). Tall cloaked figures (Reapers, the Lamplighter) use this grid too.
  - The renderer places a frame so its bottom edge (the row under the soles) sits on the walker's ground point; nothing in
    the rows may assume any other placement.
- **Facings.** `E` is drawn facing right; west is `E` mirrored by the renderer (never draw W). `S` faces the eye (walking
  down the screen), `N` faces away (walking up it). The same figure must read as the same person from all three: the same
  height to the texel, the same colours, the same gear on the same hand. The right hand is: in `E` the near arm (in front of
  the body), in `S` on the viewer's LEFT, in `N` on the viewer's RIGHT. Say in your report which hand holds what.
- **Frames.** `idle`, `idle2`, `walk1`, `walk2`, `walk3`, `walk4` for every figure and facing (plus the extra frames your brief
  names). As in the courier bench:
  - `idle2` is the breath: the silhouette is identical to `idle` texel for texel; only shading migrates (the chest's light
    rises a row). Check it: the non-'.' mask of idle2 must equal idle's.
  - `walk1` contact A: the near (right) leg reaching forward, heel down; the far leg pushing off behind; the right arm swung
    back, the left arm forward. `walk2` passing A: the right leg under the body, the left leg swinging through with its foot
    lifted — the whole upper body one row HIGHER. `walk3` contact B (the mirror of A), `walk4` passing B (upper body up a row).
  - In `S` and `N` the stride reads as one foot a row lower (toward the eye) and the other a row higher, as the courier does.
- **The outline law.** One texel of `O` closes every coloured texel that meets open air on its four sides (call
  `close_outline` from `tools/courier/courier.py`; the boot's sole on the ground row is its own dark edge). Never a doubled
  outline along a silhouette. Interior `O` only where two forms must separate (an arm over the torso, the legs).
- **Light.** From above and in front: crowns and shoulders take the light letters (`I` hood/hair, `L` coat), the sides and
  undersides the shade letters (`h`, `D`, `s`, `P`/`p`). Two or three tones per material, clusters not noise, no dithering on
  a figure. Faces: skin, one shade, eyes (`e`); a figure's face must read at 1:1 (3 screen pixels a texel).
- **Readability at 1:1.** The game shows one texel as 3×3 screen pixels at the default zoom. After the 8× sheet, look at the
  1× and 3× renders too — gear must read as what it is at that size, and a figure must separate from the one beside it.
- **Letters.** Rows use these letters only (`.` is empty):
  - Base (a palette sets them): `O` outline · `H` hood/hair/hat · `S` skin · `e` eye · `C` coat · `c` coat trim/seam ·
    `T` second cloth or leather (the courier's scarf) · `t` its shade · `B` boots · `b` boot shade.
  - Derived from the base by `derive()` (never set directly): `h` H shade · `I` H light · `s` skin shade · `D` coat shade ·
    `L` coat light · `A`/`a`/`u` the pack's canvas (courier only) · `Y` buckle light (T lightened) · `P`/`p` trousers.
  - Gear (fixed colours the palette sets): `W`/`w` steel and its shade · `G`/`g` grey cloth (a cloak) · `F`/`f` fur or pale
    cloth · `R`/`r` red cloth (a rag, wraps) · `K`/`k` paper/white linen · `M`/`m` wood planks · `V`/`v` bow, haft, shaft
    wood · `N`/`n` dark leather straps · `X`/`x` a light source's glass (warm) and its rim.
  A family may leave gear letters unused. Do not invent other letters; if a figure truly needs one, name it in the report.
- **Palettes.** Give each figure (or family) a base palette: the ten base letters plus the gear letters it uses, as hex. Keep
  the identity of the old palette (listed in your brief); tune for readability and SAY what you changed and why.

## Output (what the integration reads)

Write your bench to `tools/<family>/<family>.py` and have it write `tools/<family>/<family>.json`:

```json
{
  "family": "<family>",
  "grid": {"w": 32, "h": 32, "ax": 16, "sole": 30},
  "figures": {
    "<name>": {
      "grid": {"w": 32, "h": 40, "ax": 16, "sole": 38},
      "frames": {"E": {"idle": ["32 chars", "..."], "idle2": [...], "walk1": [...], "...": [...]},
                  "S": {...}, "N": {...}},
      "hand": {"E": {"idle": [x, y], "...": [x, y]}, "S": {...}, "N": {...}},
      "dy": {"E": {"walk2": -1, "...": 0}, "S": {...}, "N": {...}},
      "pal": {"O": "#12161c", "H": "#......", "...": "#......"},
      "notes": "who this is, what they carry, which hand"
    }
  }
}
```

`hand` is the texel of the figure's RIGHT hand in each frame (x, y on its grid); `dy` the upper body's rise (0 or -1 on a
passing step, as the courier's META). A per-figure `grid` overrides the family's. Also write:
- `shots/<family>_sheet.png` — every frame of every figure at 8× (draft.py `render`, with each figure's own palette), labelled.
- `shots/<family>_lineup.png` — every figure's `S idle` and `E idle` at 3× standing on one ground line beside the courier's
  (`src/12e_sprites.js` holds the courier rows between `COURIER:BEGIN` and `COURIER:END`; `tools/courier/courier.py` builds
  them) — the scale check.

Your bench must validate before it writes: every frame the grid's size; only the letters above; idle2's mask equal to
idle's; soles on the grid's sole row in `idle`; no texel coloured next to open air without its outline. Print the checks.

## Boundaries

Write only under `tools/<family>/`, `shots/<family>_*.png` and the scratchpad
(`/tmp/claude-0/-home-claude/6b4ed241-f59c-5646-95c9-b16861a92127/scratchpad/`). Do not edit `src/`, `dist/`, `tests/`, the docs,
or another family's files (your brief says if it grants an exception). Python and PIL only; no browser needed.

## The eye

After every change, LOOK at your sheet and lineup (read the PNGs). Fix what reads wrong before you report: a hand that is
not a hand, gear that reads as something else, a leg that bends the wrong way, a face lost in its hood, a figure that is a
different height from one facing to the next. Your report names what you drew, the hands and anchors, what you changed in
the palettes, and anything you decided that the old rows did not specify (mark those as your readings).
