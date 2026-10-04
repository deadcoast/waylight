#!/usr/bin/env python3
"""THE EVERYDAY SET — authoring bench (v3.51).

The set pieces that were still scaled sprites or rectangles, drawn by hand at the courier's scale:

  kid          a child of the valley (the handoff kid, the kids who run the fences, the kid on the watch ridge): hood,
               coat and scarf in the courier's letters, no pack, 16 texels crown to sole on the courier's 32×32 grid.
               E/S/N: idle, idle2, walk1-4; E and S: hold (the letter held HIGH over the head in the right hand).
  glyphs       envelope (the letter in flight) · axe_up/axe_mid/axe_down (the forrester's swing, each with its grip)
               · stones (the mason's pile of cut stones)
  walker_bust  the Walker's own 16×16 portrait bust, drawn from the courier's head (S_HEAD / S_TORSO)

The courier's own new poses (sit, kneel) live in tools/courier/courier.py; this bench draws them on its sheet and lineup.

Every texel is placed by hand; parts are row strings composed with the courier bench's stamp/put, closed by its
close_outline. Nothing is scaled, generated, rotated or filtered.

Run: python3 tools/everyday/everyday.py          → tools/everyday/everyday.json, shots/everyday_sheet.png, shots/everyday_lineup.png
     python3 tools/everyday/everyday.py --check  → validate only
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'courier'))
import courier as C
from courier import put, stamp, blank, rows, mask_of, close_outline
from draft import render, derive, PAL_WALKER
from PIL import Image, ImageDraw

W = H = 32
SOLE = 30
BASE = set('OHSeCcTtBb')
DERIVED = set('hIsDLAauYPp')
GEAR = set('WwGgFfRrKkMmVvNnXx')
LETTERS = BASE | DERIVED | GEAR


# =====================================================================================================================
# THE KID — a child of the valley: the hood up like the Walker's, a short coat, the scarf wound once with its end down
# the chest, sturdy boots. 16 texels crown (row 15) to sole (row 30). No pack.
# =====================================================================================================================

# ---------- SIDE (facing east) ----------
KE_HEAD = [   # at (12, 15): the hood, the face in profile at its mouth
    '..OOOO...',
    '.OIIIHO..',
    'OIHHHhSO.',
    'OHHHhSeSO',
    'OhHHhSSSO',
    '.OhhhsSO.',
]
KE_TORSO = [  # at (12, 21): the scarf wound at the neck, the short coat (its back in shade, its front seam), the hem
    'OTTTTTTO',
    'ODLLLLcO',
    'ODCCCCcO',
    'ODCCCCcO',
    'ODCCCCcO',
    'OccccccO',
]
KE_TAIL = {   # the scarf's end: hanging at the nape at rest, flying back on the run
    'still': [(11, 22, 'Tt'), (11, 23, 't')],
    'fly1': [(9, 21, 'TTt'), (8, 22, 'tt')],
    'fly2': [(9, 20, 'Tt'), (8, 21, 'TTt')],
}
KE_ARM = {    # the near (right) arm from the shoulder: (x, y, rows) — its front texel is the coat's seam (the courier's rule)
    'hang': (15, 22, [
        'OCLc',
        'OCLc',
        'ODCc',
        'OSSc',
        'OsO ',
    ]),
    'back': (12, 22, [   # swung back: the forearm to the hip, the hand at the coat's back edge (their outlines one)
        '   OCL',
        '  OCLO',
        'ODCO  ',
        'OSSO  ',
        'OsO   ',
    ]),
    'fwd': (15, 22, [    # swung forward: the hand out past the coat's front
        'OCLc ',
        'OCLcO',
        ' OCDO',
        ' OSSO',
        '  OsO',
    ]),
    'up': (12, 14, [     # raised HIGH over the hood's near side: the fist closed on the letter's lower edge, the sleeve slid
        ' SS   ',         # to the elbow; its back edge the hood's own outline (never a doubled edge)
        'OSsO  ',
        'OSs   ',
        'OLL   ',
        'OLL   ',
        'OLC   ',
        'OLC   ',
        ' OCD  ',
        '  OCLc',
    ]),
}
KE_LEGS = {   # rows 26..30 (the first hides under the hem unless the body has risen); columns from 10
    'stand': [
        '...OppOPPO..',
        '...OppOPPO..',
        '...OppOPpO..',
        '..ObbbOBBBO.',
        '...OOOObbbO.',
    ],
    'contactA': [   # the near leg reaching, heel down; the far leg pushing off behind — a runner's long stride
        '...OppPPO...',
        '..OppOOPPO..',
        '.OppO..OPPO.',
        'ObbO....OBBO',
        'ObbbO...ObbbO',
    ],
    'passA': [      # the float: the near leg under the body, the far heel kicked up behind — both boots off the ground
        '...OppPPO...',
        '..OppOOPPO..',
        '.ObbO.OPPO..',
        '.OO..OBBBO..',
        '.....ObbbO..',
    ],
    'contactB': [   # the far leg reaching; the near leg pushing off behind
        '...OPPppO...',
        '..OPPOOppO..',
        '.OPPO..OppO.',
        'OBBO....ObbO',
        'ObbbO...ObbbO',
    ],
    'passB': [      # the float: the far leg under the body, the near heel kicked up behind
        '...OPPppO...',
        '..OPPOOppO..',
        '.OBBO.OppO..',
        '.OO..ObbbO..',
        '.....OOOOO..',
    ],
}


def kid_east(frame):
    walk = {'walk1': ('contactA', 0, 'back', 'fly1'), 'walk2': ('passA', -1, 'hang', 'fly2'),
            'walk3': ('contactB', 0, 'fwd', 'fly1'), 'walk4': ('passB', -1, 'hang', 'fly2')}
    if frame in walk:
        legs, dy, arm, tail = walk[frame]
    elif frame == 'hold':
        legs, dy, arm, tail = 'stand', 0, 'up', 'still'
    else:
        legs, dy, arm, tail = 'stand', 0, 'hang', 'still'
    g = blank()
    stamp(g, 10, 26 + (dy if legs.startswith('pass') else 0), KE_LEGS[legs])
    stamp(g, 12, 21 + dy, KE_TORSO)
    stamp(g, 12, 15 + dy, KE_HEAD)
    for x, y, s in KE_TAIL[tail]:
        put(g, x, y + dy, s)
    ax, ay, blk = KE_ARM[arm]
    if frame == 'hold':
        stamp(g, 11, 10, LETTER_HELD)
    stamp(g, ax, ay + dy, blk)
    META[('E', frame)] = {'dy': dy, 'hand': C.hand_of(blk, ax, ay + dy)}
    out = rows(g)
    return kid_breath(out) if frame == 'idle2' else out


# ---------- FRONT (facing south) ----------
KS_HEAD = [   # at (11, 15): the hood round a round face; two eyes under the hood's shade
    '..OOOOOO..',
    '.OIIIIIHO.',
    'OIhhhhhhHO',
    'OHSeSSeSHO',
    'OhSSSSSShO',
    '.OhsSSshO.',
]
KS_TORSO = [  # at (12, 21): the scarf wound at the neck, its end over the left breast; the short coat, its seam, the hem
    'OTTTTTTO',
    'OLLLLTtO',
    'OCCCcTtO',
    'OCDCcCDO',
    'OCDCcCDO',
    'OccccccO',
]
KS_ARM = {    # the left drawn; the right is its mirror: (dy, rows)
    'hang': (0, ['OLC', 'OCD', 'OCD', 'OSs', ' OO']),
    'fwd': (0, ['OLC', 'OCD', 'OCD', 'OCD', 'OSs', ' OO']),
    'back': (0, ['OLC', 'OCD', 'OSs', ' OO']),
    'up': (0, ['OSs ', 'OSs ', 'OSs ', 'OLC ', 'OLC ', 'OLC ', 'OCD ', ' OCD', ' OLC']),   # raised: the fist at the letter's foot, up the hood's side
}
KS_LEGS = {   # rows 26..31 (the first hides under the hem unless the body has risen), columns from 11
    'stand': [
        '.OPpOOpPO.',
        '.OPpOOpPO.',
        '.OPpOOpPO.',
        'OBBBOOBBBO',
        'ObbbOObbbO',
        '..........',
    ],
    'contactA': [   # the right foot (the eye's left) comes toward the eye a row lower; the left pushes off a row higher
        '.OPpOOpPO.',
        '.OPpOOpPO.',
        '.OPpOOBBO.',
        'OBBBOObbbO',
        'OBBBO.OOO.',
        'ObbbO.....',
    ],
    'passA': [      # the float (the whole kid a row up): the right leg under the body, the left foot (the eye's right)
        '.OPpOOpPO.',   # swinging through, lifted
        '.OPpOOpPO.',
        '.OPpOOBBO.',
        'OBBBOObbO.',
        'ObbbO.OO..',
        '..........',
    ],
    'contactB': [   # the left foot (the eye's right) comes toward the eye a row lower; the right pushes off a row higher
        '.OPpOOpPO.',
        '.OPpOOpPO.',
        '.OBBOOpPO.',
        'ObbbOOBBBO',
        '.OOO.OBBBO',
        '.....ObbbO',
    ],
    'passB': [      # the float: the left leg under the body, the right foot (the eye's left) swinging through, lifted
        '.OPpOOpPO.',
        '.OPpOOpPO.',
        '.OBBOOpPO.',
        '.ObbOOBBBO',
        '..OO.ObbbO',
        '..........',
    ],
}


def kid_south(frame):
    walk = {'walk1': ('contactA', 0, 'back', 'fwd'), 'walk2': ('passA', -1, 'hang', 'hang'),
            'walk3': ('contactB', 0, 'fwd', 'back'), 'walk4': ('passB', -1, 'hang', 'hang')}
    if frame in walk:
        legs, dy, armL, armR = walk[frame]
    elif frame == 'hold':
        legs, dy, armL, armR = 'stand', 0, 'up', 'hang'
    else:
        legs, dy, armL, armR = 'stand', 0, 'hang', 'hang'
    g = blank()
    stamp(g, 11, 26 + (dy if legs.startswith('pass') else 0), KS_LEGS[legs])
    stamp(g, 12, 21 + dy, KS_TORSO)
    stamp(g, 11, 15 + dy, KS_HEAD)
    _, blk = KS_ARM[armL]
    ay = (14 if armL == 'up' else 22) + dy
    ax = 8 if armL == 'up' else 9
    if frame == 'hold':
        stamp(g, 6, 10, LETTER_HELD)
    stamp(g, ax, ay, blk)
    handR = C.hand_of(blk, ax, ay)   # the kid's right hand: on the eye's left
    _, blk = KS_ARM[armR]
    blk = [s[::-1] for s in blk]
    stamp(g, 20, 22 + dy, blk)
    META[('S', frame)] = {'dy': dy, 'hand': handR}
    out = rows(g)
    return kid_breath(out) if frame == 'idle2' else out


# ---------- BACK (facing north) ----------
KN_HEAD = [   # at (11, 15): the hood's back, its crown lit, its seam
    '..OOOOOO..',
    '.OIIIIIHO.',
    'OIIHHHHHhO',
    'OHHHHhHHhO',
    'OhHHHhHHhO',
    '.OhhhhhhO.',
]
KN_TORSO = [  # at (12, 21): the scarf wound at the nape, its end over the (kid's) left shoulder; the coat's back
    'OTTTTTTO',
    'OtLLLLLO',
    'OtCCCCDO',
    'OCDCCDCO',
    'OCDCCDCO',
    'OccccccO',
]
KN_LEGS = {   # rows 26..31, columns from 11: the backs of the legs, the heels
    'stand': [
        '.OPpOOPpO.',
        '.OPpOOPpO.',
        '.OPpOOPpO.',
        '.OBBOOBBO.',
        '.ObbOObbO.',
        '..........',
    ],
    'contactA': [   # the right foot (the eye's right) reaches away a row higher; the left heel pushes off toward the eye
        '.OPpOOPpO.',
        '.OPpOOPpO.',
        '.OPpOOBBO.',
        '.OBBOObbO.',
        '.OBBO.OO..',
        '.ObbO.....',
    ],
    'passA': [      # the float: the left heel lifting as it swings through
        '.OPpOOPpO.',
        '.OPpOOPpO.',
        '.OBBOOPpO.',
        '.ObbOOBBO.',
        '..OO.ObbO.',
        '..........',
    ],
    'contactB': [   # the left foot reaches away; the right heel pushes off toward the eye
        '.OPpOOPpO.',
        '.OPpOOPpO.',
        '.OBBOOPpO.',
        '.ObbOOBBO.',
        '..OO.OBBO.',
        '.....ObbO.',
    ],
    'passB': [
        '.OPpOOPpO.',
        '.OPpOOPpO.',
        '.OPpOOBBO.',
        '.OBBOObbO.',
        '.ObbO.OO..',
        '..........',
    ],
}
KN_ARM = {
    'hang': ['OLC', 'OCD', 'OCD', 'OSs', ' OO'],
    'fwd': ['OLC', 'OCD', 'OSs', ' OO'],
    'back': ['OLC', 'OCD', 'OCD', 'OCD', 'OSs', ' OO'],
}


def kid_north(frame):
    walk = {'walk1': ('contactA', 0, 'fwd', 'back'), 'walk2': ('passA', -1, 'hang', 'hang'),
            'walk3': ('contactB', 0, 'back', 'fwd'), 'walk4': ('passB', -1, 'hang', 'hang')}
    if frame in walk:
        legs, dy, armL, armR = walk[frame]
    else:
        legs, dy, armL, armR = 'stand', 0, 'hang', 'hang'
    g = blank()
    stamp(g, 11, 26 + (dy if legs.startswith('pass') else 0), KN_LEGS[legs])
    stamp(g, 12, 21 + dy, KN_TORSO)
    stamp(g, 11, 15 + dy, KN_HEAD)
    blkL = KN_ARM[armL]; blkR = [s[::-1] for s in KN_ARM[armR]]
    stamp(g, 9, 22 + dy, blkL); stamp(g, 20, 22 + dy, blkR)
    META[('N', frame)] = {'dy': dy, 'hand': C.hand_of(blkR, 20, 22 + dy)}   # the kid's right hand: on the eye's right
    out = rows(g)
    return kid_breath(out) if frame == 'idle2' else out


def kid_breath(r):
    """the breath: the chest's light drops into the coat a row (the courier's rule); the silhouette holds"""
    return C.breath(r)


ENVELOPE = [   # the letter: paper K, the flap's folds k meeting at the gold seal X (Y is the courier's derived buckle light, so
    'OOOOOOO',   # the seal takes X: a fixed gold whatever the scarf)
    'OkKKKkO',
    'OKkXkKO',
    'OKKKKKO',
    'OOOOOOO',
]
LETTER_HELD = ENVELOPE   # the kid holds the very letter that flies

META = {}
KID_FRAMES = ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4']


def build_kid():
    out = {'E': {f: kid_east(f) for f in KID_FRAMES + ['hold']},
           'S': {f: kid_south(f) for f in KID_FRAMES + ['hold']},
           'N': {f: kid_north(f) for f in KID_FRAMES}}
    return {fc: {n: close_outline(r) for n, r in fr.items()} for fc, fr in out.items()}


KID_PAL = {**PAL_WALKER, 'K': '#f2ead4', 'k': '#c8bc9c', 'X': '#ffd98f', 'x': '#c9a05a'}


# =====================================================================================================================
# THE GLYPHS — small rows placed on the courier's grid by the game. Cores are drawn without their outline; close_glyph
# closes it by the outline law (a texel of O wherever a coloured texel meets the air), padding a texel all round.
# =====================================================================================================================
def close_glyph(core):
    w = max(len(r) for r in core) + 2
    h = len(core) + 2
    g = [['.'] * w for _ in range(h)]
    for y, r in enumerate(core):
        for x, ch in enumerate(r):
            if ch not in ' .':
                g[y + 1][x + 1] = ch
    add = []
    for y in range(h):
        for x in range(w):
            if g[y][x] in '.O':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x + dx, y + dy
                if 0 <= xx < w and 0 <= yy < h and g[yy][xx] == '.':
                    add.append((xx, yy))
    for x, y in add:
        g[y][x] = 'O'
    return [''.join(r) for r in g]


AXE_CORES = {   # the forrester's chop about the fist: raised (the head up, the bit forward), coming over, the bite (the bit
    'axe_up': ([          # down). V the haft, v its end in the fist; w the head, W its bit, fanning wider than the eye
        '...W',
        '.wwW',
        'VwwW',
        'V.wW',
        'V..W',
        'V...',
        'V...',
        'V...',
        'v...',
    ], (0, 8)),
    'axe_mid': ([
        '.....WW',
        '....wwW',
        '...VwwW',
        '..V..wW',
        '.V.....',
        'V......',
        'v......',
    ], (0, 6)),
    'axe_down': ([
        'vVVVVVww.',
        '......www',
        '.....wwww',
        '....WWWWW',
    ], (0, 0)),
}
STONES_CORE = [   # the mason's pile: two cut blocks on the ground, a third across them — lit tops W, faces w
    '..WWW..',
    '..www..',
    'WWW.WWW',
    'www.www',
]
GLYPH_PALS = {
    'envelope': {'O': '#12161c', 'K': '#f2ead4', 'k': '#c8bc9c', 'X': '#ffd98f'},
    'axe': {'O': '#12161c', 'V': '#8e6a44', 'v': '#6b4a30', 'W': '#d0d6da', 'w': '#9aa2ab'},
    'stones': {'O': '#12161c', 'W': '#aea999', 'w': '#8a8578'},
}


def build_glyphs():
    out = {'envelope': {'rows': ENVELOPE, 'pal': GLYPH_PALS['envelope']}}
    for n, (core, (gx, gy)) in AXE_CORES.items():
        out[n] = {'rows': close_glyph(core), 'grip': [gx + 1, gy + 1], 'pal': GLYPH_PALS['axe']}
    out['stones'] = {'rows': close_glyph(STONES_CORE), 'pal': GLYPH_PALS['stones']}
    return out


# =====================================================================================================================
# THE WALKER'S BUST — 16×16 on the keepers' alphabet, drawn from the courier's own head and chest (S_HEAD, S_TORSO): the
# hood with its lit rim and the shade over the brow, the face and its two eyes, the scarf wound twice, the coat's
# shoulders under the straps. K/k hood · I hood light · S/s skin · e eye · m mouth · C/c coat and its trim · R/r scarf
# =====================================================================================================================
BUST = [   # the straps take k, the darkest letter short of the outline (the keepers' alphabet has no leather)
    '................',
    '....OOOOOOOO....',
    '...OIIIIIIIKO...',
    '..OIIKKKKKKKKO..',
    '..OIkkkkkkkkKO..',
    '..OKkkSSSSkkKO..',
    '..OKkSeSSeSkKO..',
    '..OKSSSSSSSSKO..',
    '..OkSSSSSSSSkO..',
    '..OkksSmmSskkO..',
    '...OkksSSskkO...',
    '..ORRRRRRRRRRO..',
    '.OCCkrRRRRrkCCO.',
    'OCCCkCRrCCCkCCCO',
    'OCCCkCRrCCCkCCCO',
    'OCCCkCRRCCCkCCCO',
]
BUST_PAL = {'O': '#12161c', 'K': '#2c4258', 'k': '#1f2f3f', 'I': '#566879', 'S': '#e0c298', 's': '#b89a78', 'e': '#2a2118',
            'm': '#8a5a4a', 'C': '#3d5a74', 'c': '#2c4258', 'R': '#c9a05a', 'r': '#a5824a'}


# =====================================================================================================================
# the checks (STYLE.md): every frame the grid's size; only the law's letters; idle2's mask equal to idle's; soles on the
# sole row in idle; no coloured texel next to the air without its outline; and no doubled outline along a silhouette
# =====================================================================================================================
AIR = '.'


def outline_breaks(r, sole_ok=True):
    """coloured texels that meet the air on a side with no outline between (a sole's underside is its own edge)"""
    h, w = len(r), len(r[0])
    bad = []
    for y in range(h):
        for x in range(w):
            ch = r[y][x]
            if ch in '.O':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x + dx, y + dy
                if not (0 <= xx < w and 0 <= yy < h):
                    continue
                if r[yy][xx] == AIR and not (sole_ok and ch == 'b' and dy == 1):
                    bad.append((x, y))
    return bad


def doubled(r):
    """an outline two texels thick across a silhouette's edge: colour, O, O, air in a straight line, the outer O bordering no
    colour of its own (a corner, a heel's step or a tail's edge borders colour and is a single outline)"""
    h, w = len(r), len(r[0])
    at = lambda x, y: r[y][x] if 0 <= x < w and 0 <= y < h else AIR
    coloured = lambda x, y: any(at(x + dx, y + dy) not in '.O' for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
    out = []
    for y in range(h):
        for x in range(w):
            if r[y][x] != 'O' or coloured(x, y):
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if at(x + dx, y + dy) == AIR and at(x - dx, y - dy) == 'O' and at(x - 2 * dx, y - 2 * dy) not in '.O':
                    out.append((x, y))
    return sorted(set(out))


def mask(r):
    return [[ch != AIR for ch in row] for row in r]


def check_frames(name, frames, sole=SOLE, idle_rule=True):
    bad, warn = [], []
    for fc, fr in frames.items():
        for n, r in fr.items():
            tag = f'{name} {fc}.{n}'
            if len(r) != H or any(len(row) != W for row in r):
                bad.append(f'{tag}: not {W}x{H}')
                continue
            for y, row in enumerate(r):
                for x, ch in enumerate(row):
                    if ch != AIR and ch not in LETTERS:
                        bad.append(f'{tag}: letter {ch!r} at {x},{y}')
            ob = outline_breaks(r)
            if ob:
                bad.append(f'{tag}: {len(ob)} texels meet the air unoutlined, first {ob[0]}')
            step31 = fc in 'SN' and n in ('walk1', 'walk3')
            if r[H - 1].strip('.') and not step31:
                bad.append(f'{tag}: row {H - 1} not empty')
            if step31 and set(r[H - 1]) - set('.Ob'):
                bad.append(f'{tag}: row {H - 1} holds more than the near boot')
            dd = doubled(r)
            if dd:
                warn.append(f'{tag}: doubled outline at {dd}')
        if idle_rule and 'idle' in fr:
            r = fr['idle']
            if 'idle2' in fr and mask(fr['idle2']) != mask(r):
                bad.append(f'{name} {fc}: idle2 mask differs from idle')
            if 'idle2' in fr and fr['idle2'] == r:
                bad.append(f'{name} {fc}: idle2 is idle (no breath)')
            if 'b' not in r[sole]:
                bad.append(f'{name} {fc}.idle: no sole on row {sole}')
    return bad, warn


def check_rows(tag, r, letters, w=None, h=None, open_edges=''):
    """a glyph or the bust: its size, its letters, the outline law (edges named in open_edges are cut by the frame)"""
    bad = []
    if len({len(row) for row in r}) != 1:
        bad.append(f'{tag}: ragged rows')
        return bad
    if w and len(r[0]) != w or h and len(r) != h:
        bad.append(f'{tag}: not {w}x{h}')
    for y, row in enumerate(r):
        for x, ch in enumerate(row):
            if ch != AIR and ch not in letters:
                bad.append(f'{tag}: letter {ch!r} at {x},{y}')
    hh, ww = len(r), len(r[0])
    for (x, y) in outline_breaks(r, sole_ok=False):
        pass
    for y in range(hh):
        for x in range(ww):
            if r[y][x] in '.O':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x + dx, y + dy
                if not (0 <= xx < ww and 0 <= yy < hh):
                    edge = 'L' if xx < 0 else 'R' if xx >= ww else 'T' if yy < 0 else 'B'
                    if edge not in open_edges:
                        bad.append(f'{tag}: colour at the {edge} edge {x},{y}')
                elif r[yy][xx] == AIR:
                    bad.append(f'{tag}: {x},{y} meets the air unoutlined')
    return bad


BUST_LETTERS = set('OKkSsemCcR') | set('Ir')


def validate(kid, cour, glyphs):
    bad, warn = check_frames('kid', kid)
    low = {fc: {n: r for n, r in fr.items() if n in C.LOW_DY} for fc, fr in cour.items()}
    b2, w2 = check_frames('courier', {fc: fr for fc, fr in low.items() if fr}, idle_rule=False)
    bad += b2; warn += w2
    for fc, fr in kid.items():
        for n in fr:
            if (fc, n) not in META:
                bad.append(f'kid {fc}.{n}: no hand/dy')
            else:
                hx, hy = META[(fc, n)]['hand']
                if fr[n][hy][hx] not in 'Ss':
                    bad.append(f'kid {fc}.{n}: the hand {hx},{hy} is not skin ({fr[n][hy][hx]!r})')
    for n, g in glyphs.items():
        bad += check_rows(f'glyph {n}', g['rows'], set(g['pal']))
        if 'grip' in g:
            gx, gy = g['grip']
            if g['rows'][gy][gx] not in 'Vv':
                bad.append(f'glyph {n}: the grip {gx},{gy} is not on the haft')
    bad += check_rows('walker_bust', BUST, BUST_LETTERS, 16, 16, open_edges='B')
    return bad, warn


# =====================================================================================================================
# the eye: the sheet (8×) and the lineup (3× on one ground line beside the courier; the bust at 8× beside the courier's face)
# =====================================================================================================================
BG, INK, CELL = '#1b1e24', '#9aa2ab', '#2a2f37'


def paint(d, rws, pal, ox, oy, k):
    for y, row in enumerate(rws):
        for x, ch in enumerate(row):
            if ch != '.':
                d.rectangle([ox + x * k, oy + y * k, ox + x * k + k - 1, oy + y * k + k - 1], fill=pal.get(ch, '#ff00ff'))


# the valley's own colours, as the game dresses a hand by seed (Render.drawNpcFigure: PAL_MATE with C the seeded hood and T
# the seeded scarf; CHAR.PORTRAIT.hoods / scarves) — the lineup shows the kid in a few of them
PAL_MATE = {'O': '#12161c', 'H': '#41522f', 'S': '#d8b890', 'e': '#2a2118', 'C': '#54683f', 'c': '#41522f', 'T': '#b8a06a',
            't': '#94804f', 'B': '#23282f', 'b': '#171b21'}
SEEDED = [('#33404d', '#ffc978'), ('#5a3d3d', '#6fe3d2'), ('#3d5548', '#d96b4f'), ('#4a3d55', '#e0d2a0')]


def seeded_pal(hood, scarf):
    return derive({**PAL_MATE, 'C': hood, 'T': scarf, **{g: KID_PAL[g] for g in 'KkXx'}})


def lineup(kid, cour, path):
    wp, kp = derive(PAL_WALKER), derive(KID_PAL)
    k, gap = 3, 6
    rows_ = [
        ("THE KID beside the courier: S idle and E idle at 3x on one ground line (and the kid's back, and the letter held HIGH)",
         [('courier S idle', cour['S']['idle'], wp), ('kid S idle', kid['S']['idle'], kp), ('courier E idle', cour['E']['idle'], wp),
          ('kid E idle', kid['E']['idle'], kp), ('kid N idle', kid['N']['idle'], kp), ('kid S hold', kid['S']['hold'], kp),
          ('kid E hold', kid['E']['hold'], kp)]),
        ("THE KID in the valley's colours (the game's seed law: the mate's palette, the hood as the coat, the scarf)",
         [(f'kid S {i}', kid['S']['idle'], seeded_pal(h, t)) for i, (h, t) in enumerate(SEEDED)] +
         [(f'kid E {i}', kid['E']['walk2'], seeded_pal(h, t)) for i, (h, t) in enumerate(SEEDED[:3])]),
        ("THE COURIER sits and kneels, beside the courier idle, 3x",
         [('courier E idle', cour['E']['idle'], wp), ('courier E sit', cour['E']['sit'], wp), ('courier E kneel', cour['E']['kneel'], wp),
          ('courier S idle', cour['S']['idle'], wp), ('courier S sit', cour['S']['sit'], wp), ('courier S kneel', cour['S']['kneel'], wp)]),
    ]
    bw = 16 * 8
    Wd = max(max(16 + len(r) * (32 * k + gap) for _, r in rows_), 16 + bw + 24 + 32 * 8 + 16)
    Hd = 12 + len(rows_) * (16 + 32 * k + 14) + 16 + 32 * 8 + 16
    im = Image.new('RGB', (Wd, Hd), BG)
    d = ImageDraw.Draw(im)
    y = 12
    for title, pieces in rows_:
        d.text((16, y), title, fill=INK)
        y += 14
        d.rectangle([8, y, Wd - 8, y + 32 * k - 1], fill=CELL)
        d.line([8, y + 31 * k, Wd - 8, y + 31 * k], fill='#4a515b')   # the ground line: the soles' row stands on it
        for i, (lab, r, pal) in enumerate(pieces):
            ox = 16 + i * (32 * k + gap)
            paint(d, r, pal, ox, y, k)
            d.text((ox, y + 32 * k + 1), lab, fill=INK)
        y += 32 * k + 16
    d.text((16, y), "THE WALKER'S BUST at 8x, beside the courier's S idle at 8x", fill=INK)
    y += 14
    d.rectangle([16, y, 16 + bw - 1, y + bw - 1], fill='#10161f')
    paint(d, BUST, BUST_PAL, 16, y, 8)
    ox = 16 + bw + 24
    d.rectangle([ox, y, ox + 32 * 8 - 1, y + 32 * 8 - 1], fill=CELL)
    paint(d, cour['S']['idle'], wp, ox, y, 8)
    im.save(path)


def sheet(kid, cour, glyphs, path, scratch):
    """every frame at 8x (draft.render, each figure in its own palette), then the glyphs and the bust at 8x"""
    kid_fr = [(f'kid {fc} {n}', r) for fc in ('S', 'E', 'N') for n, r in kid[fc].items()]
    render(kid_fr, scratch + 'ev_kid.png', k=8, cols=7, pal=KID_PAL)
    low = [(f'courier {fc} {n}', cour[fc][n]) for fc in ('E', 'S') for n in ('sit', 'kneel')]
    render([('courier E idle', cour['E']['idle'])] + low[:2] + [('courier S idle', cour['S']['idle'])] + low[2:], scratch + 'ev_low.png', k=8, cols=7, pal=PAL_WALKER)
    a, b = Image.open(scratch + 'ev_kid.png'), Image.open(scratch + 'ev_low.png')
    k = 8
    items = [(n, g['rows'], g['pal'], g.get('grip')) for n, g in glyphs.items()] + [('walker_bust', BUST, BUST_PAL, None)]
    gh = max(len(r) for _, r, _, _ in items) * k + 40
    Wd = max(a.width, b.width, 10 + sum(len(r[0]) * k + 24 for _, r, _, _ in items))
    im = Image.new('RGB', (Wd, 24 + a.height + 24 + b.height + 24 + gh), BG)
    d = ImageDraw.Draw(im)
    d.text((10, 6), 'THE KID - S / E / N: idle, idle2 (the breath), walk1-4 (the run, the float a row up), hold (the letter HIGH) - 8x', fill=INK)
    im.paste(a, (0, 20))
    y = 20 + a.height + 4
    d.text((10, y), "THE COURIER'S LOW POSES (tools/courier/courier.py) - E and S: sit, kneel - beside the idle - 8x", fill=INK)
    im.paste(b, (0, y + 16))
    y += 16 + b.height + 4
    d.text((10, y), 'THE GLYPHS (the grip marked) and THE WALKER\'S BUST - 8x', fill=INK)
    y += 16
    x = 10
    for n, r, pal, grip in items:
        d.rectangle([x, y, x + len(r[0]) * k - 1, y + len(r) * k - 1], fill='#10161f' if n == 'walker_bust' else CELL)
        paint(d, r, pal, x, y, k)
        if grip:
            gx, gy = grip
            d.rectangle([x + gx * k + 2, y + gy * k + 2, x + gx * k + k - 3, y + gy * k + k - 3], outline='#ff3060')
        d.text((x, y + len(r) * k + 3), n, fill=INK)
        x += len(r[0]) * k + 24
    im.save(path)


def export(kid, cour, glyphs):
    fr = lambda fc, n: META[(fc, n)]
    cad = [0.09, 0.12, 0.09, 0.12]
    data = {
        'family': 'everyday',
        'grid': {'w': W, 'h': H, 'ax': 16, 'sole': SOLE},
        'figures': {
            'kid': {
                'frames': kid,
                'hand': {fc: {n: fr(fc, n)['hand'] for n in f} for fc, f in kid.items()},
                'dy': {fc: {n: fr(fc, n)['dy'] for n in f} for fc, f in kid.items()},
                'cadence': cad,
                'pal': {c: KID_PAL[c] for c in 'OHSeCcTtBbKkX'},
                'notes': ('A child of the valley (the handoff kid, the kids who run the fences, the kid on the watch ridge): the hood '
                          'up like the Walker, a short coat, the scarf wound once with one end over the left breast and one down the '
                          'back (it flies behind on the run), sturdy boots; no pack. 16 texels crown (row 15) to sole (row 30). The '
                          'base letters recolour by seed exactly as a courier does (Render.courierPal derives h I s D L P p Y from them); '
                          'K k X are fixed gear (the letter\'s paper, its folds, its gold seal - X, since Y is derived). Right hand: E the '
                          'near arm, S the eye\'s left, N the eye\'s right. hold (E, S): the letter held HIGH in the right fist, the fist '
                          'closed on its lower edge - the same rows as the envelope glyph. The run: the contacts a long stride, the '
                          'passings a float - the whole kid a row up, both boots off the ground (dy -1 is the upper body; the legs rise '
                          'with it), the scarf flying; the cadence is quicker than the courier\'s and holds the float, not the contact.'),
            },
        },
        'glyphs': {n: dict(g, notes=GLYPH_NOTES[n]) for n, g in glyphs.items()},
        'busts': {
            'walker_bust': {
                'rows': BUST, 'pal': BUST_PAL,
                'letters': 'O K k S s e m C c R (WALKER_FACE_PAL) + I (hood light) + r (scarf shade)',
                'notes': ('The Walker\'s own bust, 16x16 on the keepers\' alphabet, drawn from the courier\'s head and chest (S_HEAD, '
                          'S_TORSO): the hood with its lit rim (I) and the shade over the brow (k), the face and two eyes, the scarf '
                          'wound twice with its end hanging, the coat\'s shoulders under the straps. Two letters join WALKER_FACE_PAL: '
                          'I = the hood light (courierPal\'s I: lightHex(H, 0.2)) and r = the scarf shade (the worn t, else darkHex(T, '
                          '0.8)). The straps are k (the keepers\' alphabet has no leather; k is the darkest letter short of the '
                          'outline). The bottom row is cut by the frame.'),
            },
        },
        'courier': {
            'added': {'E': ['sit', 'kneel'], 'S': ['sit', 'kneel']},
            'dy': {fc: {n: C.META[(fc, n)]['dy'] for n in ('sit', 'kneel')} for fc in ('E', 'S')},
            'hand': {fc: {n: C.META[(fc, n)]['hand'] for n in ('sit', 'kneel')} for fc in ('E', 'S')},
            'notes': ('The courier\'s low poses live in tools/courier/courier.py (build(); export.py writes them into SPRITES.COURIER '
                      'with their dy, hand, sash and pin). sit: on the ground, the near knee up, the pack set down behind on the '
                      'ground (+5 rows), the upper body down 6, the hands on the knees. kneel: on both knees, the hands bound behind '
                      '(the elbow drawn back, the hands at the small of the back; in S out of sight), the upper body down 3, the pack '
                      'riding up its straps (+1). In S kneel the hand anchor is where the bound hands are, behind the hip.'),
        },
    }
    with open(os.path.join(HERE, 'everyday.json'), 'w') as f:
        json.dump(data, f, indent=1)
    return data


GLYPH_NOTES = {
    'envelope': ('The letter in flight: paper K, the flap\'s folds k meeting at the gold seal X. 7x5. The kid\'s hold frames carry '
                 'these very rows at the raised fist, so the letter that leaves the hand is the letter that flies.'),
    'axe_up': ('The forrester\'s axe, raised: the haft V up from the fist, the head w with its bit W forward. Place the grip texel on '
               'the courier\'s right-hand texel (COURIER.hand[fc][frame]); mirror with the figure.'),
    'axe_mid': 'The axe coming over, 45 degrees forward of the fist. Grip on the right-hand texel.',
    'axe_down': 'The bite: the haft level forward of the fist, the bit down. Grip on the right-hand texel.',
    'stones': ('The mason\'s pile of cut stones: two blocks on the ground, a third across them; lit tops W, faces w. Set its bottom '
               'row (the outline) on the courier grid\'s sole row (30), beside the feet.'),
}


if __name__ == '__main__':
    kid = build_kid()
    cour = C.build()
    glyphs = build_glyphs()
    bad, warn = validate(kid, cour, glyphs)
    n_kid = sum(len(v) for v in kid.values())
    print(f'the kid: {n_kid} frames ({", ".join(f"{fc} {len(v)}" for fc, v in kid.items())}), each {W}x{H}')
    print(f'the courier\'s low poses: E sit, E kneel, S sit, S kneel (dy {C.LOW_DY})')
    print(f'glyphs: ' + ', '.join(f'{n} {len(g["rows"][0])}x{len(g["rows"])}' + (f' grip {g["grip"]}' if 'grip' in g else '') for n, g in glyphs.items()))
    print(f'walker_bust: {len(BUST[0])}x{len(BUST)}, letters {"".join(sorted(set("".join(BUST)) - {"."}))}')
    print('checks: size, letters, idle2 mask = idle, soles on row 30 in idle, the outline law, row 31 only a contact step\'s near boot')
    for b in bad:
        print('  FAIL', b)
    for w in warn:
        print('  note', w)
    if bad:
        sys.exit(1)
    print('  all pass')
    if '--check' in sys.argv:
        sys.exit(0)
    SP = '/tmp/claude-0/-home-claude/6b4ed241-f59c-5646-95c9-b16861a92127/scratchpad/'
    os.makedirs(os.path.join(ROOT, 'shots'), exist_ok=True)
    export(kid, cour, glyphs)
    sheet(kid, cour, glyphs, os.path.join(ROOT, 'shots', 'everyday_sheet.png'), SP)
    lineup(kid, cour, os.path.join(ROOT, 'shots', 'everyday_lineup.png'))
    print('wrote tools/everyday/everyday.json, shots/everyday_sheet.png, shots/everyday_lineup.png')
