#!/usr/bin/env python3
"""THE STABLE — authoring bench (v3.51). Six breeds drawn by hand, side-on facing east, at the courier's texel.

Every texel below is placed by hand. A breed is built from hand-drawn parts on the grid it lands on: the body (barrel,
croup, shoulder), the neck and head in two carriages (up, and the nod a row lower), the tail in three hangs, and each
leg in five poses (standing square, and the four the walk passes through). A frame is those parts placed together, the
far legs first (a shade darker, a step off the near ones), the tack last; `close_outline` then closes the silhouette.
Nothing is scaled, generated, rotated or filtered.

THE WALK — a true four-beat (footfalls near hind, near fore, far hind, far fore), each leg on a duty of about 0.62,
sampled between footfalls, so every leg passes through four poses in turn:
  A  planted forward (just set down)   B  planted under the body   C  the toe leaving the ground behind   D  lifted high,
  swinging through.
  walk1  near hind A · near fore D · far hind C · far fore B   — the diagonal support (near hind + far fore planted)
  walk2  near hind B · near fore A · far hind D · far fore C   — the lateral support (the near side), the head down
  walk3  near hind C · near fore B · far hind A · far fore D   — the other diagonal
  walk4  near hind D · near fore C · far hind B · far fore A   — the far side, the head down
The held frames of SPRITES.CADENCE (0.17 s: walk1, walk3) are the diagonal supports; the short ones (0.11 s) the lateral
supports, where the head nods down. The tail swings a texel back on walk1 and forward on walk3. The barrel stays level
(the walk carries no bob a texel can show), so the seat holds in every frame.

Letters: O outline · B body · b body shade · L body light · l highlight · M mane/tail · m mane shade · E eye · H hoof ·
W white markings · T tack leather · t tack shade · Y tack metal · P/p the donkey's pack.

Run: python3 tools/stable/stable.py          → tools/stable/stable.json, shots/stable_sheet.png, shots/stable_lineup.png
     python3 tools/stable/stable.py --check  → validate only
"""
import os, sys, json
sys.dont_write_bytecode = True   # the bench reads the courier's own bench; it writes nothing into another family's folder
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'courier'))

LETTERS = set('OBbLlMmEHWTtYPp')
POSES = {   # frame: (near hind, near fore, far hind, far fore, neck, tail)
    'idle':  ('stand', 'stand', 'stand', 'stand', 'up', 'still'),
    'walk1': ('A', 'D', 'C', 'B', 'up', 'back'),
    'walk2': ('B', 'A', 'D', 'C', 'nod', 'still'),
    'walk3': ('C', 'B', 'A', 'D', 'up', 'fwd'),
    'walk4': ('D', 'C', 'B', 'A', 'nod', 'still'),
}
FRAMES = list(POSES)


# =====================================================================================================================
# the grid
# =====================================================================================================================
def blank(w, h):
    return [['.'] * w for _ in range(h)]


def put(g, x, y, s):
    """write a run of texels; '.' or a space leaves what is under it"""
    for i, ch in enumerate(s):
        if ch in ' .':
            continue
        if 0 <= x + i < len(g[0]) and 0 <= y < len(g):
            g[y][x + i] = ch


def stamp(g, x, y, block):
    for j, s in enumerate(block):
        put(g, x, y + j, s)


def rows(g):
    return [''.join(r) for r in g]


def recolor(block, m):
    return [''.join(m.get(c, c) for c in s) for s in block]


def close_outline(r):
    """the outline law: a coloured texel meeting the open air gets its outline texel there — except a hoof's underside,
    which is its own dark edge (the courier's sole rule)"""
    h, w = len(r), len(r[0])
    g = [list(s) for s in r]
    for y in range(h):
        for x in range(w):
            ch = r[y][x]
            if ch in '.O':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x + dx, y + dy
                if not (0 <= xx < w and 0 <= yy < h) or r[yy][xx] != '.':
                    continue
                if ch == 'H' and dy == 1:
                    continue
                g[yy][xx] = 'O'
    # where two parts overlap (a far leg behind a near one), a part's own outline can end up closing nothing: an outline
    # texel on the rim with no coloured texel beside it would double the line, so it goes
    for y in range(h):
        for x in range(w):
            if g[y][x] != 'O':
                continue
            nb = [g[yy][xx] if 0 <= xx < w and 0 <= yy < h else '.' for xx, yy in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))]
            if '.' in nb and all(c in 'O.' for c in nb):
                g[y][x] = '.'
    return [''.join(s) for s in g]


# =====================================================================================================================
# THE BREEDS
# =====================================================================================================================
BREEDS = {}


def breed(name, **kw):
    BREEDS[name] = kw


# ---- BREEDS:BEGIN (the drawings) ----
FAR = {'B': 'b', 'L': 'b', 'l': 'b'}   # a far leg: the same drawing in the body's shade (it stands in the near body's shadow)

# ---------------------------------------------------------------------------------------------------------------------
# FJORD — Farkeep's own: dun, stocky, deep in the barrel and short in the leg, the roached two-tone mane standing up
# the crest (pale sides round the dark centre), the dark dorsal stripe down the back into the tail, a mealy muzzle.
# ---------------------------------------------------------------------------------------------------------------------
breed('fjord', w=39, h=30, ground=(15, 29), seat=(15, 11), leg_y=19, far=(-3, 3), farmap=FAR,
      pal={'O': '#12161c', 'B': '#a8845a', 'b': '#8a6a4a', 'L': '#c0a070', 'l': '#d8c29a', 'M': '#e0dccf', 'm': '#4e3a30',
           'E': '#1c1612', 'H': '#3a3230', 'W': '#e6dcc4', 'T': '#6b4a30', 't': '#4a3320', 'Y': '#c9a05a'},
      #        0         1         2         3
      #        012345678901234567890123456789012345678
      body={
          11: '.......mmmmm.......mmm.................',
          12: '......mLLlLLLmmmmmmLLLBBBBBBBB.........',
          13: '.....mBLLLLLLLLLLLLLLLLBBBBBBBB........',
          14: '....bBBLLLLBBBBBBBBBBBBBBBBBBBLl.......',
          15: '....bBBBBBBBBBBBBBBBBBBBBBBBBBBB.......',
          16: '....bBBBBBBBBBBBBBBBBBBBBBBBBBBb.......',
          17: '....bbBBBBBBBBBBBBBBBBBBBBBBBBb........',
          18: '.....bbBBBBBBBBBBBBBBBBBBBBBBbb........',
          19: '.....bbbBBBBBbBBBBBBBBBBBBBBBb.........',
          20: '......bbbBBBb..bbbbbbbbbbbbbb..........',
          21: '................bbbbbbb................',
      },
      neck={'up': {   # the roached mane stands up the crest: a pale side, the dark centre, a pale side
           1: '.............................b.........',
           2: '.........................MMMBb.........',
           3: '........................MmmmBBM........',
           4: '......................MMmMMLLLMB.......',
           5: '.....................MmmMLLLLBEBB......',
           6: '....................MmMMLLLBBBBBBB.....',
           7: '...................MmMLLLBBBBBBBBBB....',
           8: '..................MmMLLBBBBbBBBBBBBW...',
           9: '..................mMLLBBBBBbBBBBBWmW...',
          10: '.................MMLLBBBBBBbbbbbWWWW...',
          11: '.................mLLBBBBBBBBbObbWWW....',
          12: '..................LBBBBBBBBBBb..OWW....',
          13: '..................BBBBBBBBBBBb.........',
      }, 'nod': {'shift': (0, 1), 'keep': 13}},
      tail={   # the root at the croup, hanging to the hocks: pale sides round the dark core
          'still': (1, 12, ['...mm', '..Mmm', '.MMm.', '.MMm.', '.MMm.', 'MMm..', 'MMm..', 'MMm..', 'MMm..', 'MMm..', 'MMm..', '.Mm..']),
          'back':  (1, 12, ['...mm', '..Mmm', '.MMm.', '.MMm.', '.MMm.', 'MMm..', 'MMm..', 'MMm..', 'MMm..', 'MMm..', 'Mm...', 'Mm...']),
          'fwd':   (1, 12, ['...mm', '..Mmm', '.MMm.', '.MMm.', '.MMm.', '.MMm.', '.MMm.', 'MMm..', 'MMm..', 'MMm..', 'MMm..', '.Mm..']),
      },
      fore={   # rows from leg_y; the top two sink into the chest; (x of column 0, rows)
          'stand': (22, ['.bBB..', '.bBBB.', 'ObBBO.', 'ObBBO.', 'ObBLO.', '.ObBO.', '.ObBO.', 'ObbBO.', '.ObBO.', 'OHHHO.', 'OHHHHO']),
          'A':     (22, ['.bBB....', '.bBBB...', 'ObBBO...', '.ObBBO..', '.ObBLO..', '..ObBO..', '..ObBO..', '..bbBO..', '...ObBO.', '..OHHHO.', '..OHHHHO']),
          'B':     (21, ['..bBB..', '..bBBB.', '.ObBBO.', '.ObBBO.', '.ObBLO.', '.ObBO..', 'ObBO...', 'bbBO...', 'ObBO...', 'OHHHO..', 'OHHHHO.']),
          'C':     (19, ['....bBB..', '....bBBB.', '...ObBBO.', '...ObBO..', '..ObBLO..', '..ObBO...', '.ObBO....', '.ObbO....', 'ObbO.....', 'OHHO.....', '.OHHO....']),
          'D':     (22, ['.bBB...', '.bBBB..', 'ObBBO..', '.ObBBO.', '..ObBLO', '..ObbO.', '.ObBO..', '.ObbO..', '.OHHO..', '.......', '.......']),
      },
      hind={
          'stand': (4, ['.bbBBBB.', '.bbBBBBO', 'ObbBBO..', 'ObbBO...', 'ObbBO...', '.ObBO...', '.ObBO...', 'ObbBO...', '.ObBO...', 'OHHHO...', 'OHHHHO..']),
          'A':     (4, ['.bbBBBB..', '.bbBBBBO.', '.ObbBBO..', '..ObbBO..', '..ObbBO..', '...ObBO..', '...ObBO..', '...bbBO..', '....ObBO.', '...OHHHO.', '...OHHHHO']),
          'B':     (4, ['.bbBBBB.', '.bbBBBBO', 'ObbBBO..', 'bbBBO...', 'bbBO....', 'ObBO....', 'ObBO....', 'bbBO....', 'ObBO....', 'OHHHO...', 'OHHHHO..']),
          'C':     (1, ['....bbBBBB', '....bbBBBBO', '...ObbBBO..', '..ObbBO....', '..ObBO.....', '.ObBO......', '.ObBO......', 'ObbO.......', 'ObbO.......', 'OHHO.......', '.OHHO......']),
          'D':     (4, ['.bbBBBB.', '.bbBBBBO', 'ObbBBO..', '.ObbBO..', '.ObbBBO.', '..ObBBO.', '...ObBO.', '...ObbO.', '...OHHO.', '........', '........']),
      },
      tack={
          'fixed': [(10, 10, [   # the saddle: cantle and pommel, the seat, the panel, the flap with the leather over it,
              'Tt........tT',    # the iron under the rider's boot, the girth behind the elbow
              'tTTTTTTTTTTT',
              '.tttttttttt.',
              '..tTTTTtTt..',
              '..tTTTTtTt..',
              '...ttOYYYt..',
              '.........t..',
              '.........t..',
              '.........t..',
              '.........t..',
              '.........t..',
          ])],
          'up':  [(28, 5, 't'), (28, 6, 't'), (29, 7, 't'), (29, 8, 't'), (30, 9, 't'), (32, 8, 't'), (32, 9, 't'), (31, 10, 'Y'),
                  (28, 10, 'ttt'), (24, 9, 'tttt'), (22, 8, 'tt')],
          'nod': [(28, 6, 't'), (28, 7, 't'), (29, 8, 't'), (29, 9, 't'), (30, 10, 't'), (32, 9, 't'), (32, 10, 't'), (31, 11, 'Y'),
                  (28, 11, 'ttt'), (24, 10, 'tttt'), (22, 9, 'tt')],
      },
      notes="Farkeep's own: dun, stocky, deep in the barrel and short in the leg; the roached mane standing up the crest in three bands (pale side, the dark centre, pale side); the dark dorsal stripe over the croup into the tail's dark core; a mealy muzzle. Saddle and bridle in dark leather, brass iron and bit. Seat on the saddle's seat (pommel at seat.x+5, clear of the rider's knee; cantle at seat.x-5); ground under the hooves' centre. Walk: a four-beat (near hind, near fore, far hind, far fore on a duty of about 0.62), the barrel level so the seat holds (seatDy 0); walk1 and walk3 (the held beats) the diagonal supports, walk2 and walk4 the lateral ones with the head nodded a row down; the tail a texel back on walk1, forward on walk3.")

# ---------------------------------------------------------------------------------------------------------------------
# MUSTANG — the plains horse: a buckskin paint, lean and long in the leg, the black points (mane, tail, the legs below
# knee and hock), the black mane falling down the crest, a long low-set tail, and a white tobiano splash over the flank.
# ---------------------------------------------------------------------------------------------------------------------
breed('mustang', w=38, h=30, ground=(15, 29), seat=(15, 10), leg_y=18, far=(-3, 3), farmap={**FAR, 'W': 'l', 'l': 'l'},
      pal={'O': '#12161c', 'B': '#9a8468', 'b': '#7a5a40', 'L': '#b8a07c', 'l': '#c9c4b8', 'M': '#3e3029', 'm': '#261d19',
           'E': '#1a1410', 'H': '#3a302a', 'W': '#dcd6ca', 'T': '#5e3e26', 't': '#40281a', 'Y': '#b8c2c8'},
      #        0         1         2         3
      #        01234567890123456789012345678901234567
      body={
          10: '.......LLLL.......LLL.................',
          11: '......LLLLLWWWLLLLLLLLBBBBBB..........',
          12: '.....bLLLLWWWWLLLLLLLLBBBBBBB.........',
          13: '....bBBBBWWWWWBBBBBBBBBBBBBBLL........',
          14: '....bBBBBWWWWWBBBBBBBBBBBBBBBB........',
          15: '....bBBBWWWWWBBBBBBBBBBBBBBBBB........',
          16: '....bbBBWWWWWBBBBBBBBBBBBBBBBb........',
          17: '.....bbWWWWWBBBBBBBBBBBBBBBBb.........',
          18: '.....bbWWWWWbBBBBBBBBBBBBBBb..........',
          19: '......bWWWWb..bbbbbbbbbbbbb...........',
          20: '...............bbbbbb.................',
      },
      neck={'up': {
           1: '.............................b........',
           2: '............................Bb........',
           3: '.........................MMMBBM.......',
           4: '........................MMMmLLMB......',
           5: '......................MMMmmLLBEBB.....',
           6: '.....................MMMmLLBBBBBBB.....',
           7: '....................MMmmmLLBBBBBBBB....',
           8: '...................MMmmLLBBbBBBBBBBb...',
           9: '..................MMmLLBBBBbBBBBBbmb...',
          10: '..................MmmLBBBBBbbbbbbmmm...',
          11: '.................MmLBBBBBBBBbObbmmm....',
          12: '.................mmBBBBBBBBBBb..Omm....',
          13: '..................BBBBBBBBBBBb........',
      }, 'nod': {'shift': (0, 1), 'keep': 13}},
      tail={   # set low off the sloping croup, black, long and full to below the hocks, a wave in it
          'still': (1, 12, ['...Mm', '..MMm', '..MMm', '.MMm.', '.MMm.', '.MMm.', 'MMm..', 'MMm..', 'MMm..', 'MMm..', 'MMm..', 'MMmm.', '.Mmm.', '.mm..']),
          'back':  (1, 12, ['...Mm', '..MMm', '..MMm', '.MMm.', '.MMm.', '.MMm.', 'MMm..', 'MMm..', 'MMm..', 'MMm..', 'MMm..', 'MMm..', 'Mmm..', 'mm...']),
          'fwd':   (1, 12, ['...Mm', '..MMm', '..MMm', '.MMm.', '.MMm.', '.MMm.', '.MMm.', 'MMm..', 'MMm..', 'MMm..', 'MMmm.', '.MMmm', '..Mmm', '..mm.']),
      },
      fore={   # the fjord's leg a row longer in the cannon, black below the knee
          'stand': (22, ['.bBB..', '.bBBB.', 'ObBBO.', 'ObBBO.', 'ObBLO.', '.OmMO.', '.OmMO.', '.OmMO.', 'OmmMO.', '.OmMO.', 'OHHHO.', 'OHHHHO']),
          'A':     (22, ['.bBB....', '.bBBB...', 'ObBBO...', '.ObBBO..', '.ObBLO..', '..OmMO..', '..OmMO..', '..OmMO..', '..mmMO..', '...OmMO.', '..OHHHO.', '..OHHHHO']),
          'B':     (21, ['..bBB..', '..bBBB.', '.ObBBO.', '.ObBBO.', '.ObBLO.', '.OmMO..', '.OmMO..', 'OmMO...', 'mmMO...', 'OmMO...', 'OHHHO..', 'OHHHHO.']),
          'C':     (19, ['....bBB..', '....bBBB.', '...ObBBO.', '...ObBO..', '..ObBLO..', '..OmMO...', '..OmMO...', '.OmMO....', '.OmmO....', 'OmmO.....', 'OHHO.....', '.OHHO....']),
          'D':     (22, ['.bBB...', '.bBBB..', 'ObBBO..', '.ObBBO.', '..ObBLO', '..OmmO.', '.OmMO..', '.OmMO..', '.OmmO..', '.OHHO..', '.......', '.......']),
      },
      hind={   # the tobiano's white runs from the stifle down the hind legs, its back edge in the pale shade
          'stand': (4, ['.bbWWWW.', '.bbWWWWO', 'ObbWWO..', 'ObWWO...', 'OlWWO...', '.OlWO...', '.OlWO...', '.OlWO...', 'OllWO...', '.OlWO...', 'OHHHO...', 'OHHHHO..']),
          'A':     (4, ['.bbWWWW..', '.bbWWWWO.', '.ObbWWO..', '..ObWWO..', '..OlWWO..', '...OlWO..', '...OlWO..', '...OlWO..', '...llWO..', '....OlWO.', '...OHHHO.', '...OHHHHO']),
          'B':     (4, ['.bbWWWW.', '.bbWWWWO', 'ObbWWO..', 'bbWWO...', 'lWWO....', 'OlWO....', 'OlWO....', 'OlWO....', 'llWO....', 'OlWO....', 'OHHHO...', 'OHHHHO..']),
          'C':     (1, ['....bbWWWW', '....bbWWWWO', '...ObbWWO..', '..ObWWO....', '..OlWO.....', '.OlWO......', '.OlWO......', '.OlWO......', 'OlWO.......', 'OlWO.......', 'OHHO.......', '.OHHO......']),
          'D':     (4, ['.bbWWWW.', '.bbWWWWO', 'ObbWWO..', '.ObWWO..', '.OlWWWO.', '..OlWWO.', '...OlWO.', '...OlWO.', '...OlWO.', '...OHHO.', '........', '........']),
      },
      tack={
          'fixed': [(10, 9, [   # a plains saddle, dark and plain, steel in the iron
              'Tt........tT',
              'tTTTTTTTTTTT',
              '.tttttttttt.',
              '..tTTTTtTt..',
              '..tTTTTtTt..',
              '...ttOYYYt..',
              '.........t..',
              '.........t..',
              '.........t..',
              '.........t..',
          ])],
          'up':  [(28, 5, 't'), (28, 6, 't'), (29, 7, 't'), (29, 8, 't'), (30, 9, 't'), (32, 8, 't'), (32, 9, 't'), (31, 10, 'Y'),
                  (28, 10, 'ttt'), (24, 9, 'tttt'), (21, 8, 'ttt')],
          'nod': [(28, 6, 't'), (28, 7, 't'), (29, 8, 't'), (29, 9, 't'), (30, 10, 't'), (32, 9, 't'), (32, 10, 't'), (31, 11, 'Y'),
                  (28, 11, 'ttt'), (24, 10, 'tttt'), (21, 9, 'ttt')],
      },
      notes="The plains horse: a buckskin paint, lean and a cannon longer than the fjord; black points (the mane falling down the crest, the long low-set tail, the fore legs below the knee, the dark muzzle) and a tobiano's white over the flank that runs down both hind legs. A plain dark saddle, steel iron and bit. Seat on the saddle's seat; ground under the hooves' centre. Walk: a four-beat (near hind, near fore, far hind, far fore on a duty of about 0.62), the barrel level so the seat holds (seatDy 0); walk1 and walk3 (the held beats) the diagonal supports, walk2 and walk4 the lateral ones with the head nodded a row down; the tail a texel back on walk1, forward on walk3.")

# ---------------------------------------------------------------------------------------------------------------------
# ICELANDIC — small and shaggy: a chestnut on short sturdy legs, short in the back, the thick flaxen mane falling down
# the near side of the neck, a heavy forelock over the brow, a full flaxen tail nearly to the ground.
# ---------------------------------------------------------------------------------------------------------------------
breed('icelandic', w=36, h=28, ground=(14, 27), seat=(14, 11), leg_y=18, far=(-3, 3), farmap=FAR,
      pal={'O': '#12161c', 'B': '#b56a3e', 'b': '#8e4e2e', 'L': '#c98150', 'l': '#dc9a64', 'M': '#d8c090', 'm': '#b0925e',
           'E': '#1c1410', 'H': '#3a302a', 'W': '#ece2c8', 'T': '#4e3424', 't': '#34221a', 'Y': '#c9a05a'},
      #        0         1         2         3
      #        012345678901234567890123456789012345
      body={
          11: '......LLLLL.......LLL...............',
          12: '.....bLLlLLLLLLLLLLLLBBBBB..........',
          13: '....bBLLLLLLLLLLLLLLBBBBBBB.........',
          14: '....bBBBBBBBBBBBBBBBBBBBBBBLl.......',
          15: '....bBBBBBBBBBBBBBBBBBBBBBBBB.......',
          16: '....bbBBBBBBBBBBBBBBBBBBBBBBb.......',
          17: '.....bbBBBBBBBBBBBBBBBBBBBBb........',
          18: '.....bbbBBBBbBBBBBBBBBBBBBb.........',
          19: '......bbbBBb..bbbbbbbbbbbb..........',
          20: '..............bbbbbbbb..............',
      },
      neck={'up': {
           1: '..........................b.........',
           2: '.........................Bb.........',
           3: '.....................MMMMBBMM.......',
           4: '....................MMmMMmLMMMB.....',
           5: '...................MMmMMmLLMMEBB....',
           6: '..................MMmMMmLLBBBBBBB...',
           7: '.................MMmMMmmLBBBBBBBBB..',
           8: '................MMmMMmmLBBBbBBBBBWB.',
           9: '................MMmMmMmBBBBbBBBBbmb.',
          10: '................MmmmmmBBBBBbbbbbbbb.',
          11: '................mM.m.mBBBBBbObbbbb..',
          12: '..................m...BBBBBBb..Obb..',
          13: '.....................BBBBBBb........',
      }, 'nod': {'shift': (0, 1), 'keep': 13}},
      tail={   # full and flaxen, falling nearly to the ground, the ends loose
          'still': (1, 12, ['...Mm', '..MMm', '.MMMm', '.MMMm', 'MMMm.', 'MMMm.', 'MMMm.', 'MMMm.', 'MMMm.', 'MMmm.', 'MMmm.', 'MmMm.', '.m.m.']),
          'back':  (1, 12, ['...Mm', '..MMm', '.MMMm', '.MMMm', 'MMMm.', 'MMMm.', 'MMMm.', 'MMMm.', 'MMmm.', 'MMmm.', 'Mmm..', 'mMm..', 'm.m..']),
          'fwd':   (1, 12, ['...Mm', '..MMm', '.MMMm', '.MMMm', '.MMMm', 'MMMm.', 'MMMm.', 'MMMm.', 'MMMm.', 'MMmmm', '.MMmm', '.MmMm', '..m.m']),
      },
      fore={   # the fjord's leg a row shorter in the cannon
          'stand': (20, ['.bBB..', '.bBBB.', 'ObBBO.', 'ObBBO.', 'ObBLO.', '.ObBO.', 'ObbBO.', '.ObBO.', 'OHHHO.', 'OHHHHO']),
          'A':     (20, ['.bBB....', '.bBBB...', 'ObBBO...', '.ObBBO..', '.ObBLO..', '..ObBO..', '..bbBO..', '...ObBO.', '..OHHHO.', '..OHHHHO']),
          'B':     (19, ['..bBB..', '..bBBB.', '.ObBBO.', '.ObBBO.', '.ObBLO.', '.ObBO..', 'bbBO...', 'ObBO...', 'OHHHO..', 'OHHHHO.']),
          'C':     (17, ['....bBB..', '....bBBB.', '...ObBBO.', '...ObBO..', '..ObBLO..', '.ObBO....', '.ObbO....', 'ObbO.....', 'OHHO.....', '.OHHO....']),
          'D':     (20, ['.bBB...', '.bBBB..', 'ObBBO..', '.ObBBO.', '..ObBLO', '..ObbO.', '.ObbO..', '.OHHO..', '.......', '.......']),
      },
      hind={
          'stand': (4, ['.bbBBBB.', '.bbBBBBO', 'ObbBBO..', 'ObbBO...', 'ObbBO...', '.ObBO...', 'ObbBO...', '.ObBO...', 'OHHHO...', 'OHHHHO..']),
          'A':     (4, ['.bbBBBB..', '.bbBBBBO.', '.ObbBBO..', '..ObbBO..', '..ObbBO..', '...ObBO..', '...bbBO..', '....ObBO.', '...OHHHO.', '...OHHHHO']),
          'B':     (4, ['.bbBBBB.', '.bbBBBBO', 'ObbBBO..', 'bbBBO...', 'bbBO....', 'ObBO....', 'bbBO....', 'ObBO....', 'OHHHO...', 'OHHHHO..']),
          'C':     (1, ['....bbBBBB', '....bbBBBBO', '...ObbBBO..', '..ObbBO....', '..ObBO.....', '.ObBO......', 'ObbO.......', 'ObbO.......', 'OHHO.......', '.OHHO......']),
          'D':     (4, ['.bbBBBB.', '.bbBBBBO', 'ObbBBO..', '.ObbBO..', '.ObbBBO.', '..ObBBO.', '...ObbO.', '...OHHO.', '........', '........']),
      },
      tack={
          'fixed': [(9, 10, [   # the saddle sits the short back; the rider's leg hangs past the small horse's barrel
              'Tt........tT',
              'tTTTTTTTTTTT',
              '.tttttttttt.',
              '..tTTTTtTt..',
              '..tTTTTtTt..',
              '...ttOYYYt..',
              '.........t..',
              '.........t..',
              '.........t..',
          ])],
          'up':  [(25, 6, 't'), (25, 7, 't'), (26, 8, 't'), (26, 9, 't'), (27, 10, 't'), (28, 11, 'Y'), (22, 10, 'ttt'), (19, 9, 'ttt')],
          'nod': [(25, 7, 't'), (25, 8, 't'), (26, 9, 't'), (26, 10, 't'), (27, 11, 't'), (28, 12, 'Y'), (22, 11, 'ttt'), (19, 10, 'ttt')],
      },
      notes="Small and shaggy: a chestnut on short sturdy legs, short in the back; the thick flaxen mane falling down the near side in loose strands, the forelock over the brow, a full flaxen tail nearly to the ground, a white snip. The saddle sits the short back, so the rider's pack overhangs the croup, as it would. Seat on the saddle's seat; ground under the hooves' centre. Walk: a four-beat (near hind, near fore, far hind, far fore on a duty of about 0.62), the barrel level so the seat holds (seatDy 0); walk1 and walk3 (the held beats) the diagonal supports, walk2 and walk4 the lateral ones with the head nodded a row down; the tail a texel back on walk1, forward on walk3.")

# ---------------------------------------------------------------------------------------------------------------------
# ARABIAN — a grey, fine in the bone: a short level back, the long neck arched high, the small head with the dished face
# and the dark muzzle of a grey's skin, fine long legs on small hooves, and the tail carried up off the croup in a plume.
# ---------------------------------------------------------------------------------------------------------------------
breed('arabian', w=38, h=30, ground=(15, 29), seat=(14, 10), leg_y=17, far=(-3, 3), farmap=FAR,
      pal={'O': '#12161c', 'B': '#d4d9df', 'b': '#a4acb6', 'L': '#e8ebee', 'l': '#f7f8fa', 'M': '#48464c', 'm': '#34323a',
           'E': '#16161c', 'H': '#4a4a52', 'W': '#f7f8fa', 'T': '#7a3e2a', 't': '#54281c', 'Y': '#c9a05a'},
      #        0         1         2         3
      #        01234567890123456789012345678901234567
      body={
          10: '......LLLLLL......LL..................',
          11: '.....LLLlLLLLLLLLLLLLBBBB.............',
          12: '.....bLLLLLLLLLLLLLLBBBBBBB...........',
          13: '.....bBBBBBBBBBBBBBBBBBBBBBLl.........',
          14: '.....bBBBBBBBBBBBBBBBBBBBBBBB.........',
          15: '.....bbBBBBBBBBBBBBBBBBBBBBBb.........',
          16: '......bbBBBBBBBBBBBBBBBBBBBb..........',
          17: '......bbbBBBbBBBBBBBBBBBBBb...........',
          18: '.......bbBBb..bbbbbbbbbbbb............',
          19: '...............bbbbbb.................',
      },
      neck={'up': {
           1: '............................b.........',
           2: '...........................Bb.........',
           3: '.........................MMBBL........',
           4: '........................MmLLLBB.......',
           5: '.......................MmLLLBEBB......',
           6: '......................MmLLBBBBBB......',
           7: '......................MmLBBBbBBB......',
           8: '.....................MmLBBBbbBBbbm....',
           9: '....................MmLLBBBbbbObbb....',
          10: '...................MmLLBBBBb...bb.....',
          11: '..................MmLBBBBBBb..........',
          12: '..................mLBBBBBBBb..........',
          13: '...................BBBBBBBBb..........',
      }, 'nod': {'shift': (1, 1), 'keep': 12}},
      tail={   # carried high: the dock lifts off the croup and the hair arcs over and falls behind
          'still': (1, 6, ['..MM...', '.MMmM..', 'MMm.MM.', 'MMm..MM', 'MMm....', 'MMm....', 'Mmm....', 'Mm.....', 'Mm.....', 'Mm.....', 'mm.....', 'm......']),
          'back':  (1, 6, ['..MM...', '.MMmM..', 'MMm.MM.', 'MMm..MM', 'MMm....', 'MMm....', 'Mmm....', 'Mm.....', 'Mm.....', 'mm.....', 'm......', '.......']),
          'fwd':   (1, 6, ['..MM...', '.MMmM..', 'MMm.MM.', 'MMm..MM', '.MMm...', '.MMm...', '.Mmm...', '.Mm....', '.Mm....', '.Mm....', '.mm....', '..m....']),
      },
      fore={   # fine and long: a slim forearm, a clean cannon, a small hoof
          'stand': (22, ['.bBB..', '.bBBB.', 'ObBBO.', 'ObBBO.', 'ObBBO.', 'ObBLO.', '.ObBO.', '.ObBO.', '.ObBO.', 'ObbBO.', '.ObBO.', '.OHHO.', 'OHHHO.']),
          'A':     (22, ['.bBB....', '.bBBB...', 'ObBBO...', '.ObBBO..', '.ObBBO..', '.ObBLO..', '..ObBO..', '..ObBO..', '..ObBO..', '..bbBO..', '...ObBO.', '...OHHO.', '..OHHHO.']),
          'B':     (21, ['..bBB..', '..bBBB.', '.ObBBO.', '.ObBBO.', '.ObBBO.', '.ObBLO.', '.ObBO..', '.ObBO..', 'ObBO...', 'bbBO...', 'ObBO...', 'OHHO...', 'OHHHO..']),
          'C':     (18, ['.....bBB..', '.....bBBB.', '....ObBBO.', '....ObBO..', '...ObBBO..', '...ObBLO..', '..ObBO....', '..ObBO....', '.ObBO.....', '.ObbO.....', 'ObbO......', 'OHHO......', '.OHHO.....']),
          'D':     (22, ['.bBB...', '.bBBB..', 'ObBBO..', '.ObBBO.', '..ObBBO', '..ObBLO', '..ObbO.', '.ObBO..', '.ObBO..', '.ObbO..', '.OHHO..', '.......', '.......']),
      },
      hind={
          'stand': (5, ['.bbBBBB.', '.bbBBBBO', 'ObbBBO..', 'ObbBO...', 'ObbBO...', 'ObbBO...', '.ObBO...', '.ObBO...', '.ObBO...', 'ObbBO...', '.ObBO...', '.OHHO...', 'OHHHO...']),
          'A':     (5, ['.bbBBBB..', '.bbBBBBO.', '.ObbBBO..', '..ObbBO..', '..ObbBO..', '...ObBO..', '...ObBO..', '...ObBO..', '...ObBO..', '...bbBO..', '....ObBO.', '....OHHO.', '...OHHHO.']),
          'B':     (5, ['.bbBBBB.', '.bbBBBBO', 'ObbBBO..', 'bbBBO...', 'bbBO....', 'ObBO....', 'ObBO....', 'ObBO....', 'ObBO....', 'bbBO....', 'ObBO....', 'OHHO....', 'OHHHO...']),
          'C':     (2, ['....bbBBBB', '....bbBBBBO', '...ObbBBO..', '..ObbBO....', '..ObBO.....', '.ObBO......', '.ObBO......', '.ObBO......', 'ObBO.......', 'ObbO.......', 'ObbO.......', 'OHHO.......', '.OHHO......']),
          'D':     (5, ['.bbBBBB.', '.bbBBBBO', 'ObbBBO..', '.ObbBO..', '.ObbBO..', '.ObbBBO.', '..ObBBO.', '...ObBO.', '...ObBO.', '...ObbO.', '...OHHO.', '........', '........']),
      },
      tack={
          'fixed': [(9, 9, [   # a light saddle in red leather, brass in the iron
              'Tt........tT',
              'tTTTTTTTTTTT',
              '.tttttttttt.',
              '..tTTTTtTt..',
              '..tTTTTtTt..',
              '...ttOYYYt..',
              '.........t..',
              '.........t..',
              '.........t..',
          ])],
          'up':  [(27, 5, 't'), (27, 6, 't'), (28, 7, 't'), (28, 8, 't'), (29, 9, 'Y'), (21, 9, 'ttttttt')],
          'nod': [(28, 6, 't'), (28, 7, 't'), (29, 8, 't'), (29, 9, 't'), (30, 10, 'Y'), (21, 10, 'tttttttt')],
      },
      notes="A grey, fine in the bone: a short level back, the long neck arched high, the small head with the dished face (the face line held back under a broad forehead, the small dark muzzle of a grey's skin coming forward), fine long legs on small hooves, the dark tail carried up off the croup in a plume. Red leather, brass. Its nod carries the head a texel forward as well as down. Seat on the saddle's seat; ground under the hooves' centre. Walk: a four-beat (near hind, near fore, far hind, far fore on a duty of about 0.62), the barrel level so the seat holds (seatDy 0); walk1 and walk3 (the held beats) the diagonal supports, walk2 and walk4 the lateral ones with the head nodded a row down; the tail a texel back on walk1, forward on walk3.")

# ---------------------------------------------------------------------------------------------------------------------
# PERCHERON — the draught wall: black, massive, a deep broad body on a short back, the round croup, the neck heavy and
# high in the crest under a thick black mane, the big straight head, legs like posts on broad hooves.
# ---------------------------------------------------------------------------------------------------------------------
breed('percheron', w=42, h=33, ground=(17, 32), seat=(17, 11), leg_y=21, far=(-3, 3), farmap=FAR,
      pal={'O': '#12161c', 'B': '#343b46', 'b': '#262c35', 'L': '#48515f', 'l': '#66717f', 'M': '#22262d', 'm': '#181b21',
           'E': '#0a0c0f', 'H': '#5a544c', 'W': '#d8dde2', 'T': '#8a5a34', 't': '#64402a', 'Y': '#c9b27a'},
      #        0         1         2         3         4
      #        012345678901234567890123456789012345678901
      body={
          11: '........LLLLLL......LLLL..................',
          12: '......LLLlLLLLLLLLLLLLLLLBBBBBBB..........',
          13: '.....bLLLLLLLLLLLLLLLLLLBBBBBBBBB.........',
          14: '....bBBLLLLBBBBBBBBBBBBBBBBBBBBBB.........',
          15: '....bBBBBBBBBBBBBBBBBBBBBBBBBBBBLl........',
          16: '....bBBBBBBBBBBBBBBBBBBBBBBBBBBBBB........',
          17: '....bBBBBBBBBBBBBBBBBBBBBBBBBBBBBb........',
          18: '....bbBBBBBBBBBBBBBBBBBBBBBBBBBBb.........',
          19: '.....bbBBBBBBBBBBBBBBBBBBBBBBBBbb.........',
          20: '.....bbbBBBBBBBBBBBBBBBBBBBBBBBb..........',
          21: '......bbbBBBBbBBBBBBBBBBBBBBBBb...........',
          22: '.......bbbBBb..bbbbbbbbbbbbbbb............',
          23: '................bbbbbbbbb.................',
      },
      neck={'up': {
           1: '.................................b........',
           2: '................................Bb........',
           3: '.............................MMMBBb.......',
           4: '...........................MMMMmLLLl......',
           5: '.........................MMMMmmLLLBLL.....',
           6: '........................MMMMmLLLLBLEBL....',
           7: '.......................MMMMmLLLBBBBBBBL...',
           8: '......................MMMmmLLLBBBBBBBBBL..',
           9: '.....................MMMmLLLBBBBBbBBBBBBL.',
          10: '....................MMmmLLBBBBBBbbBBBBBmB.',
          11: '...................MMmLLBBBBBBBbbbbbBBBBB.',
          12: '..................MmmmLBBBBBBBBbObbbbBBB..',
          13: '..................m.m.BBBBBBBBBb...ObbB...',
          14: '.....................BBBBBBBBBBb.........',
      }, 'nod': {'shift': (0, 1), 'keep': 14}},
      tail={   # thick and black off the round croup
          'still': (1, 12, ['....Mm', '...MMm', '..MMMm', '..MMm.', '.MMMm.', '.MMMm.', '.MMmm.', 'MMMm..', 'MMMm..', 'MMmm..', 'MMm...', 'MMm...', '.mm...']),
          'back':  (1, 12, ['....Mm', '...MMm', '..MMMm', '..MMm.', '.MMMm.', '.MMMm.', '.MMmm.', 'MMMm..', 'MMMm..', 'MMm...', 'Mmm...', 'Mm....', 'mm....']),
          'fwd':   (1, 12, ['....Mm', '...MMm', '..MMMm', '..MMm.', '.MMMm.', '.MMMm.', '.MMmm.', '.MMMm.', '.MMMm.', '.MMmm.', '.MMm..', '.MMm..', '..mm..']),
      },
      fore={   # posts: a four-wide forearm, a three-wide cannon, the feathered fetlock and the broad hoof; lit down the front
          'stand': (24, ['.bBBB..', '.bBBBB.', 'ObBBLO.', 'ObBBLO.', 'ObBBLO.', '.ObBLO.', '.ObBLO.', 'ObbBLO.', 'ObbBBO.', '.ObBLO.', 'OHHHHO.', 'OHHHHHO']),
          'A':     (24, ['.bBBB....', '.bBBBB...', 'ObBBLO...', '.ObBBLO..', '.ObBBLO..', '..ObBLO..', '..ObBLO..', '..ObbBLO.', '..ObbBBO.', '...ObBLO.', '..OHHHHO.', '..OHHHHHO']),
          'B':     (23, ['..bBBB..', '..bBBBB.', '.ObBBLO.', '.ObBBLO.', '.ObBBLO.', '.ObBLO..', 'ObBLO...', 'ObbBLO..', 'ObbBBO..', 'ObBLO...', 'OHHHHO..', 'OHHHHHO.']),
          'C':     (20, ['.....bBBB.', '.....bBBBB', '....ObBBLO', '....ObBLO.', '...ObBBLO.', '...ObBLO..', '..ObBLO...', '..ObbBO...', '.ObbO.....', 'ObbO......', 'OHHHO.....', '.OHHHO....']),
          'D':     (24, ['.bBBB...', '.bBBBB..', 'ObBBLO..', '.ObBBLO.', '..ObBBLO', '..ObbBO.', '.ObBLO..', '.ObBLO..', '.ObbBO..', '.OHHHO..', '........', '........']),
      },
      hind={
          'stand': (4, ['.bbBBBBB.', '.bbBBBBBO', 'ObbBBLO..', 'ObbBLO...', 'ObbBLO...', '.ObBLO...', '.ObBLO...', 'ObbBLO...', 'ObbBBO...', '.ObBLO...', 'OHHHHO...', 'OHHHHHO..']),
          'A':     (4, ['.bbBBBBB..', '.bbBBBBBO.', '.ObbBBLO..', '..ObbBLO..', '..ObbBLO..', '...ObBLO..', '...ObBLO..', '...ObbBLO.', '...ObbBBO.', '....ObBLO.', '...OHHHHO.', '...OHHHHHO']),
          'B':     (4, ['.bbBBBBB.', '.bbBBBBBO', 'ObbBBLO..', 'bbBBLO...', 'bbBLO....', 'ObBLO....', 'ObBLO....', 'bbBLO....', 'bbBBO....', 'ObBLO....', 'OHHHHO...', 'OHHHHHO..']),
          'C':     (1, ['....bbBBBBB', '....bbBBBBBO', '...ObbBBLO..', '..ObbBLO....', '..ObBLO.....', '.ObBLO......', '.ObBLO......', 'ObbBO.......', 'ObbO........', 'ObbO........', 'OHHHO.......', '.OHHHO......']),
          'D':     (4, ['.bbBBBBB.', '.bbBBBBBO', 'ObbBBLO..', '.ObbBLO..', '.ObbBBLO.', '..ObBBLO.', '...ObBLO.', '...ObbBO.', '...ObbBO.', '...OHHHO.', '.........', '.........']),
      },
      tack={
          'fixed': [(12, 10, [   # a broad saddle in warm leather that reads on the black
              'Tt........tT',
              'tTTTTTTTTTTT',
              '.tttttttttt.',
              '..tTTTTtTt..',
              '..tTTTTtTt..',
              '..tTTTTtTt..',
              '...ttOYYYt..',
              '.........t..',
              '.........t..',
              '.........t..',
              '.........t..',
              '.........t..',
          ])],
          'up':  [(32, 7, 't'), (32, 8, 't'), (33, 9, 't'), (33, 10, 't'), (34, 11, 't'), (36, 9, 't'), (36, 10, 't'), (35, 12, 'Y'),
                  (31, 12, 'ttt'), (27, 11, 'tttt'), (23, 10, 'tttt')],
          'nod': [(33, 8, 't'), (33, 9, 't'), (34, 10, 't'), (34, 11, 't'), (35, 12, 't'), (37, 10, 't'), (37, 11, 't'), (36, 13, 'Y'),
                  (32, 13, 'ttt'), (28, 12, 'tttt'), (23, 11, 'ttttt')],
      },
      notes="The draught wall: black, massive (42×33 — the breed demands a column past the ±4 band: it must stand the biggest in the stable), the round croup, the neck heavy and high in the crest under a thick mane, the big straight head, legs like posts lit down their fronts on broad horn hooves. The black is lifted off the outline and drawn by its lights (crest, croup, brow, the front of the face) so the form reads; the eye sits dark in a lit brow. Warm leather that reads on black. Seat on the saddle's seat; ground under the hooves' centre. Walk: a four-beat (near hind, near fore, far hind, far fore on a duty of about 0.62), the barrel level so the seat holds (seatDy 0); walk1 and walk3 (the held beats) the diagonal supports, walk2 and walk4 the lateral ones with the head nodded a row down; the tail a texel back on walk1, forward on walk3.")

# ---------------------------------------------------------------------------------------------------------------------
# DONKEY — the caravan's pack animal: grey, the big head on a low neck, the long ears, the short dark mane, the cross
# (the dark stripe down the back and across the shoulder), the pale muzzle, eye ring and belly, thin legs on small upright
# hooves, a thin tail ending in a tuft — and what it carries: two crates, iron-banded, lashed on a cream pad.
# ---------------------------------------------------------------------------------------------------------------------
breed('donkey', w=37, h=29, ground=(15, 28), seat=(15, 4), leg_y=19, far=(-3, 3), farmap={**FAR, 'W': 'b'},
      pal={'O': '#12161c', 'B': '#7d8288', 'b': '#5a6470', 'L': '#9aa0a6', 'l': '#b4b9be', 'M': '#3e3a3c', 'm': '#2a2628',
           'E': '#16120e', 'H': '#3a3430', 'W': '#d8d2bd', 'T': '#c8b890', 't': '#94805e', 'Y': '#b8bec6',
           'P': '#6e4a3c', 'p': '#4e3230'},
      #        0         1         2         3
      #        0123456789012345678901234567890123456
      body={
          12: '.......MMMMMMMMMMMMMMM...............',
          13: '......LLLLLLLLLLLLLLLLMBB.............',
          14: '.....bLLLLLLLLLLLLLLLLMBBBB...........',
          15: '.....bBBBBBBBBBBBBBBBBMBBBBB..........',
          16: '.....bBBBBBBBBBBBBBBBBMBBBBBL.........',
          17: '.....bBBBBBBBBBBBBBBBBBMBBBBB.........',
          18: '.....bbBBBBBBBBBBBBBBBBBBBBBb.........',
          19: '......bbBBBBBBBBBBBBBBBBBBBBb.........',
          20: '......bbbBBBbWWWWWWWWWWWBBBb..........',
          21: '.......bbBBbWWWWWWWWWWWWbbb...........',
      },
      neck={'up': {
           1: '............................M........',
           2: '........................m..MM........',
           3: '........................mb.Bb........',
           4: '........................bb.Bb........',
           5: '........................bb.LB........',
           6: '........................bb.BB........',
           7: '.......................MbbBBBB.......',
           8: '.....................MMmLLLBBBB......',
           9: '...................MMmLLLLBWEWBB.....',
          10: '..................MmLLLLBBBBWBBBB....',
          11: '................MMmLLLBBbBBBBBBBBB...',
          12: '...............MmLLLBBbbbBBBBBBBBBB..',
          13: '..............mLLLBBBbbbbbBBBBBBWWW.',
          14: '..............LBBBBBBbbbbbbBBBWWWmW.',
          15: '..............BBBBBBBBbbbbbbBWWWWWW.',
          16: '..............BBBBBBBBBbb..OWWWWWW..',
          17: '...............BBBBBBBBb....OWWW....',
      }, 'nod': {'shift': (0, 1), 'keep': 16}},
      tail={   # thin, set low, a dark tuft at the end
          'still': (2, 14, ['..mb', '.bb.', '.bb.', '.bb.', '.bb.', 'bb..', 'bb..', 'Mm..', 'MMm.', 'MMm.', '.m..']),
          'back':  (2, 14, ['..mb', '.bb.', '.bb.', '.bb.', '.bb.', 'bb..', 'bb..', 'Mm..', 'MMm.', 'Mmm.', 'm...']),
          'fwd':   (2, 14, ['..mb', '.bb.', '.bb.', '.bb.', '.bb.', '.bb.', '.bb.', '.Mm.', '.MMm', '.MMm', '..m.']),
      },
      fore={   # thin, straight, on a small upright hoof
          'stand': (21, ['.bBB..', '.bBBB.', 'ObBBO.', 'ObBLO.', '.ObBO.', '.ObBO.', '.ObBO.', '.ObBO.', '.OHHO.', '.OHHO.']),
          'A':     (21, ['.bBB....', '.bBBB...', 'ObBBO...', '.ObBLO..', '..ObBO..', '..ObBO..', '...ObBO.', '...ObBO.', '...OHHO.', '...OHHO.']),
          'B':     (20, ['..bBB..', '..bBBB.', '.ObBBO.', '.ObBLO.', '.ObBO..', 'ObBO...', 'ObBO...', 'ObBO...', 'OHHO...', 'OHHO...']),
          'C':     (18, ['....bBB..', '....bBBB.', '...ObBBO.', '..ObBLO..', '..ObBO...', '.ObBO....', '.ObBO....', 'ObbO.....', 'OHHO.....', '.OHHO....']),
          'D':     (21, ['.bBB...', '.bBBB..', 'ObBBO..', '.ObBLO.', '..ObbO.', '.ObBO..', '.ObbO..', '.OHHO..', '.......', '.......']),
      },
      hind={
          'stand': (5, ['.bbBBB.', '.bbBBBO', 'ObbBO..', 'ObbBO..', '.ObBO..', '.ObBO..', '.ObBO..', '.ObBO..', '.OHHO..', '.OHHO..']),
          'A':     (5, ['.bbBBB..', '.bbBBBO.', '.ObbBO..', '..ObbBO.', '...ObBO.', '...ObBO.', '...ObBO.', '....ObBO', '....OHHO', '....OHHO']),
          'B':     (5, ['.bbBBB.', '.bbBBBO', 'ObbBO..', 'bbBO...', 'ObBO...', 'ObBO...', 'ObBO...', 'ObBO...', 'OHHO...', 'OHHO...']),
          'C':     (2, ['....bbBBB', '....bbBBBO', '...ObbBO..', '..ObbO....', '..ObBO....', '.ObBO.....', '.ObBO.....', 'ObbO......', 'OHHO......', '.OHHO.....']),
          'D':     (5, ['.bbBBB.', '.bbBBBO', 'ObbBO..', '.ObbBO.', '.ObbBO.', '..ObBO.', '..ObbO.', '..OHHO.', '.......', '.......']),
      },
      tack={
          'fixed': [(8, 3, [   # two crates on a cream pad, iron-banded, a rope over them to the girth; the breeching round the rump
              '.OOOOOO.OOOOOO.',
              '.OPPpPOtOPPpPO.',
              '.OPPpPOtOPPpPO.',
              '.OYYYYOtOYYYYO.',
              '.OPPpPOtOPPpPO.',
              '.OPPpPOtOPPpPO.',
              '.OYYYYOtOYYYYO.',
              '.OPPpPOtOPPpPO.',
              '.OPPpPOtOPPpPO.',
              'TOOOOOOtOOOOOOT',
              'TTTTTTTtTTTTTTT',
              'tTTTTTTtTTTTTTt',
              '.tTTTTTtTTTTTt.',
              '..tttttttttttt.',
              '.......t.......',
              '.......t.......',
              '.......t.......',
              '.......t.......',
          ]), (5, 16, ['t', 't', 't'])],
          'up':  [(26, 8, 'T'), (26, 9, 'T'), (26, 10, 'T'), (27, 11, 'T'), (28, 12, 'T'), (31, 12, 'T'), (31, 13, 'T'), (29, 13, 'Y')],
          'nod': [(26, 9, 'T'), (26, 10, 'T'), (26, 11, 'T'), (27, 12, 'T'), (28, 13, 'T'), (31, 13, 'T'), (31, 14, 'T'), (29, 14, 'Y')],
      },
      notes="The caravan's pack animal: grey, the big head on a low neck, the long ears (the far one in shade), the short dark mane, the cross (the dark stripe down the back and the band down the shoulder), the pale muzzle, eye ring and belly, thin legs on small upright hooves, a thin tail ending in a dark tuft; a rope halter. It carries what it carried: two iron-banded crates lashed on a cream canvas pad, the rope running down between them to the girth, a breeching strap round the rump. Seat: the pack's ridge — the rope between the crates at their lids — so a courier composed there sits on the load (the game rides no donkey). Ground under the hooves' centre. Walk: a four-beat (near hind, near fore, far hind, far fore on a duty of about 0.62), the barrel level so the seat holds (seatDy 0); walk1 and walk3 (the held beats) the diagonal supports, walk2 and walk4 the lateral ones with the head nodded a row down; the tail a texel back on walk1, forward on walk3.")
# ---- BREEDS:END ----


def compose(name, frame, tack=True):
    B = BREEDS[name]
    nh, nf, fh, ff, nk, tl = POSES[frame]
    g = blank(B['w'], B['h'])
    ly = B['leg_y']
    fdx, hdx = B['far']
    x, blk = B['fore'][ff]; stamp(g, x + fdx, ly, recolor(blk, B['farmap']))
    x, blk = B['hind'][fh]; stamp(g, x + hdx, ly, recolor(blk, B['farmap']))
    tx, ty, blk = B['tail'][tl]; stamp(g, tx, ty, blk)
    for y, s in B['body'].items():
        put(g, 0, y, s)
    x, blk = B['hind'][nh]; stamp(g, x, ly, blk)
    nkd = B['neck'][nk]
    if 'shift' in nkd:   # the same neck and head, placed (dx, dy) off — the base row (keep) stays on the body
        dx, dy = nkd['shift']
        up = B['neck']['up']
        for y, s in up.items():
            if y >= nkd['keep']:
                put(g, 0, y, s)
            else:
                put(g, dx, y + dy, s)
    else:
        for y, s in nkd.items():
            put(g, 0, y, s)
    x, blk = B['fore'][nf]; stamp(g, x, ly, blk)
    if tack:
        for (x, y, blk) in B['tack'].get('fixed', []):
            stamp(g, x, y, blk)
        for (x, y, s) in B['tack'].get(nk, []):
            put(g, x, y, s)
    return close_outline(rows(g))


def build(tack=True):
    return {n: {f: compose(n, f, tack) for f in FRAMES} for n in BREEDS}


# =====================================================================================================================
# validation
# =====================================================================================================================
def check(sets):
    bad, notes = [], []
    for n, frames in sets.items():
        B = BREEDS[n]; w, h = B['w'], B['h']; gx, gy = B['ground']; sx, sy = B['seat']
        pal = B['pal']
        if w < 36 or h < 28:
            bad.append(f'{n}: {w}×{h} under the registry floor 36×28')
        if not (0 <= sx < w and 0 <= sy < gy and gy == h - 1 and 0 <= gx < w):
            bad.append(f'{n}: anchors off (ground {gx},{gy} seat {sx},{sy})')
        for f, r in frames.items():
            if len(r) != h or any(len(s) != w for s in r):
                bad.append(f'{n}.{f}: not {w}×{h}')
                continue
            for y, s in enumerate(r):
                for x, ch in enumerate(s):
                    if ch == '.':
                        continue
                    if ch not in LETTERS:
                        bad.append(f'{n}.{f}: letter {ch!r} at {x},{y}')
                    elif ch not in pal:
                        bad.append(f'{n}.{f}: {ch!r} has no colour in the palette')
                    if ch == 'O':
                        continue
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        xx, yy = x + dx, y + dy
                        if not (0 <= xx < w and 0 <= yy < h):
                            if not (ch == 'H' and dy == 1):
                                bad.append(f'{n}.{f}: {ch} at {x},{y} on the canvas edge (no room for its outline)')
                            continue
                        if r[yy][xx] == '.' and not (ch == 'H' and dy == 1):
                            bad.append(f'{n}.{f}: {ch} at {x},{y} meets the air unoutlined')
            # never a doubled outline along the silhouette: an O on the rim must close a coloured texel beside it
            for y in range(h):
                for x in range(w):
                    if r[y][x] != 'O':
                        continue
                    nb = [r[yy][xx] if 0 <= xx < w and 0 <= yy < h else '.' for xx, yy in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1))]
                    if '.' in nb and all(c in 'O.' for c in nb):
                        bad.append(f'{n}.{f}: a doubled or stray outline texel at {x},{y}')
        idle = frames['idle']
        if idle[sy][sx] not in 'Tt':
            bad.append(f'{n}: the seat {sx},{sy} is not on the saddle ({idle[sy][sx]!r})')
        feet = [x for x, ch in enumerate(idle[gy]) if ch == 'H']
        runs = sum(1 for i, x in enumerate(feet) if i == 0 or feet[i - 1] != x - 1)
        if runs < 4:
            notes.append(f'{n}: the idle ground row shows {runs} hoof runs (near and far overlap)')
        if not feet:
            bad.append(f'{n}: no hoof on the ground row in idle')
        low = max(y for y, s in enumerate(idle) if s.strip('.'))
        if low != gy:
            bad.append(f'{n}: the idle stands on row {low}, not the ground row {gy}')
        for f in FRAMES:
            if f != 'idle' and not any(ch == 'H' for ch in frames[f][gy]):
                bad.append(f'{n}.{f}: no hoof on the ground')
    return bad, notes


# =====================================================================================================================
# output
# =====================================================================================================================
def export(sets, path):
    out = {'family': 'stable', 'cadence': [0.17, 0.11, 0.17, 0.11],
           'legend': 'O outline · B body · b body shade · L body light · l highlight · M mane/tail · m mane shade · E eye · '
                     'H hoof · W white markings · T tack leather · t tack shade · Y tack metal · P/p the pack',
           'figures': {}}
    for n, fr in sets.items():
        B = BREEDS[n]
        used = sorted(set(''.join(''.join(r) for r in fr.values())) - {'.'})
        out['figures'][n] = {
            'w': B['w'], 'h': B['h'],
            'pal': {k: B['pal'][k] for k in 'OBbLlMmEHWTtYPp' if k in used},
            'ground': {'x': B['ground'][0], 'y': B['ground'][1]},
            'seat': {'x': B['seat'][0], 'y': B['seat'][1]},
            'frames': {'idle': fr['idle'], 'walk': [fr[f'walk{i}'] for i in range(1, 5)]},
            'seatDy': [0, 0, 0, 0],
            'notes': B['notes'],
        }
    with open(path, 'w') as f:
        json.dump(out, f, indent=1)
    return out


def render_rows(d, r, pal, ox, oy, k):
    for y, row in enumerate(r):
        for x, ch in enumerate(row):
            if ch != '.':
                d.rectangle([ox + x * k, oy + y * k, ox + x * k + k - 1, oy + y * k + k - 1], fill=pal.get(ch, '#ff00ff'))


def font(sz=12):
    from PIL import ImageFont
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def sheet(sets, path, k=8):
    """every frame of every breed at k×, a row per breed, its anchors ticked under the frame"""
    from PIL import Image, ImageDraw
    cw = max(B['w'] for B in BREEDS.values()) * k + 14
    ch = max(B['h'] for B in BREEDS.values()) * k + 26
    im = Image.new('RGB', (cw * len(FRAMES) + 14, ch * len(sets) + 14), '#1b1e24')
    d, f = ImageDraw.Draw(im), font(13)
    for j, (n, fr) in enumerate(sets.items()):
        B = BREEDS[n]
        for i, fn in enumerate(FRAMES):
            ox, oy = 14 + i * cw, 14 + j * ch
            d.rectangle([ox, oy, ox + B['w'] * k - 1, oy + B['h'] * k - 1], fill='#3d4a33')
            render_rows(d, fr[fn], B['pal'], ox, oy, k)
            gx, gy = B['ground']; sx, sy = B['seat']
            d.line([ox + gx * k + k // 2, oy + B['h'] * k, ox + gx * k + k // 2, oy + B['h'] * k + 4], fill='#e0a060', width=2)
            d.line([ox - 5, oy + sy * k + k // 2, ox - 1, oy + sy * k + k // 2], fill='#60c0e0', width=2)
            d.text((ox, oy + B['h'] * k + 6), f'{n} {fn}  {B["w"]}×{B["h"]}', fill='#9aa2ab', font=f)
    im.save(path)


def lineup(sets, path, k=3):
    """every breed's idle at k× on one ground line, the courier astride (E ride on the seat: its column 16 on seat.x, its
    row 27 on seat.y, as Render.drawMount composes it), the courier's E idle standing at the left for scale"""
    from PIL import Image, ImageDraw
    import courier as C
    from draft import derive, PAL_WALKER
    cs = C.build(); cpal = derive(PAL_WALKER)
    top = max(27 - B['seat'][1] + (B['h'] - 1) for B in BREEDS.values()) + 2   # rows above the ground line to fit riders
    gap = 5
    W = 2 + 22 + gap + sum(B['w'] + gap for B in BREEDS.values())
    Hh = top + 1 + 6
    im = Image.new('RGB', (W * k, Hh * k + 16), '#4a5a36')
    d, f = ImageDraw.Draw(im), font(11)
    ground = top   # the ground row (hooves' row and the courier's sole row) in lineup texels
    d.rectangle([0, (ground + 1) * k, W * k, Hh * k + 16], fill='#3d4a2c')
    render_rows(d, cs['E']['idle'], cpal, (2 - 5) * k, (ground - 30) * k, k)
    d.text((2 * k, (ground + 2) * k), 'courier', fill='#e8e0c8', font=f)
    x = 2 + 22 + gap
    for n, fr in sets.items():
        B = BREEDS[n]; gx, gy = B['ground']; sx, sy = B['seat']
        oy = ground - gy
        render_rows(d, fr['idle'], B['pal'], x * k, oy * k, k)
        render_rows(d, cs['E']['ride'], cpal, (x + sx - 16) * k, (oy + sy - 27) * k, k)
        d.text((x * k, (ground + 2) * k), n, fill='#e8e0c8', font=f)
        x += B['w'] + gap
    im.save(path)


if __name__ == '__main__':
    sets = build()
    bad, notes = check(sets)
    for n in BREEDS:
        B = BREEDS[n]
        print(f'  {n:10s} {B["w"]}×{B["h"]}  ground {B["ground"]}  seat {B["seat"]}')
    for s in notes:
        print('  note:', s)
    if bad:
        print('\n'.join(bad[:60])); print(len(bad), 'problems'); sys.exit(1)
    print('checks: sizes, letters in each palette, the outline law, no stray outline, idle on the ground row — ok')
    if '--check' in sys.argv:
        sys.exit(0)
    export(sets, os.path.join(HERE, 'stable.json'))
    os.makedirs(os.path.join(ROOT, 'shots'), exist_ok=True)
    sheet(sets, os.path.join(ROOT, 'shots', 'stable_sheet.png'))
    lineup(sets, os.path.join(ROOT, 'shots', 'stable_lineup.png'))
    print('wrote tools/stable/stable.json, shots/stable_sheet.png, shots/stable_lineup.png')
