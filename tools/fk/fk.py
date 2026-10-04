#!/usr/bin/env python3
"""THE FARKEEPERS — authoring bench (v3.51): the mountain Republic's hired muscle, a courier's head taller and a hand wider,
NOT giants — redrawn by hand on the tall grid (32 wide x 40 high, centre column 16, soles on row 38, row 39 empty at rest).

Built the way tools/courier/courier.py builds the Walker: ONE Farkeeper body rig first — the head, the broad torso, the arms
in each swing, the legs in each step, from the front (S), the side (E; west is E mirrored) and the back (N) — composed per
frame with stamp/put and closed by the courier's close_outline. Each class is then dressed on that rig with its own head and
gear; gear held in a hand is placed from that hand's texel, so it follows the hand frame to frame. Every texel is placed by
hand in the row strings below; nothing is generated, scaled, resampled, rotated or filtered.

Frames, every class and facing: idle, idle2 (the breath: the same silhouette, the chest's light a row lower), walk1 (contact,
the right leg reaching), walk2 (passing, the upper body a row higher), walk3 (contact, the left leg), walk4 (passing); and E
ride (astride: the thigh along the back, the shin down the flank, the boot in the iron, the hips on the seat).

Letters: O outline · H hair/hood/helm, h its shade, I its light · S skin, s its shade, e eye · C coat, D its shade, L its light,
c trim/seams · T/t leather, Y buckle and rounds (T lightened) · B/b boots · P/p trousers — the derived ones (h I s D L Y P p)
come from tools/courier/draft.py derive(). Gear: W/w steel · G/g grey cloth (the recon's cloak; the shield's grey-steel field) ·
F/f fur and fletching · R/r linen wraps · V/v wood (stave, haft, stock) · N/n dark leather.

Run: python3 tools/fk/fk.py            validate, then write tools/fk/fk.json, shots/fk_sheet.png, shots/fk_lineup.png
     python3 tools/fk/fk.py --check    validate only
     python3 tools/fk/fk.py --rig      the bare rig beside the courier (scratchpad)
     python3 tools/fk/fk.py --pv [..]  one sheet per class and a lineup (scratchpad)
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'courier'))
import courier as CO            # close_outline: the outline law
from draft import derive        # the palette derivation (h I s D L Y P p)
from PIL import Image, ImageDraw, ImageFont

W, H, SOLE, AX = 32, 40, 38, 16
SP = '/tmp/claude-0/-home-claude/6b4ed241-f59c-5646-95c9-b16861a92127/scratchpad/'   # previews only; the deliverables go to tools/fk and shots


def blank():
    return [['.'] * W for _ in range(H)]


def put(g, x, y, s):
    for i, ch in enumerate(s):
        if ch in ' .':
            continue
        if 0 <= x + i < W and 0 <= y < H:
            g[y][x + i] = ch


def stamp(g, x, y, block):
    for j, s in enumerate(block):
        put(g, x, y + j, s)


def rows(g):
    return [''.join(r) for r in g]


def close(r):
    old = CO.W, CO.H
    CO.W, CO.H = W, H
    try:
        return CO.close_outline(r)
    finally:
        CO.W, CO.H = old


# =====================================================================================================================
# THE PALETTE — FK_PAL's identity (the Farkeep grey), lifted so the form reads at 1:1. The old coat (#3a4048) equalled the
# hair and sat two steps off the outline: at 1:1 the figures were near-black blobs. C and c are raised about 40 % in value
# (C #3a4048 -> #56626e, c #2a3038 -> #3a434d), so derive() gives D #3e4750 for the sides and L #747e88 for the shoulders:
# three readable tones, still the mountain's cold slate beside the pennant (#8d979c) and the shields (#6e7a82). H is set per
# class (see each class). Gear keeps FK_PAL's colours; f and r are new shades for the fur and the wraps.
# =====================================================================================================================
PAL_FK = {'O': '#12161c', 'H': '#3e4650', 'S': '#d8c0a0', 'e': '#2a2118', 'C': '#56626e', 'c': '#3a434d',
          'T': '#6e5a42', 't': '#54432f', 'B': '#23282f', 'b': '#171b21',
          'F': '#d8c9b8', 'f': '#b0a291', 'R': '#c9b098', 'r': '#a08a70', 'W': '#b8c2c8', 'w': '#6e747c',
          'V': '#8a6534', 'v': '#6e5230', 'G': '#8d979c', 'g': '#6e747c', 'M': '#5a4a3a', 'm': '#4a3a2a',
          'N': '#33241e', 'n': '#241a12'}


# =====================================================================================================================
# THE RIG — one Farkeeper body, drawn once: the head, the broad torso, the arms in each swing, the legs in each step
# =====================================================================================================================
# ---------------------------------------------- S (toward the eye) --------------------------------------------------
S_HEAD = [   # at (11, 10): cropped hair, the brow low, the jaw square
    '..OOOOOO..',
    '.OIIIIIHO.',
    'OHIIHHHHhO',
    'OHhhhhhhhO',
    'OhSeSSeShO',
    'OSSSSsSSSO',
    'OsSSSSSSsO',
    '.OsSSSSsO.',
]
S_TORSO = [  # at (9, 18): the neck, the collar, the shoulders, the coat's front panel lapped over its seam, the belt, the hem
    'OOOOssssssOOOO',
    'OLLLLcsscLLLLO',
    'OLLLCCccCCLLLO',
    'ODLCCCCcLCCLDO',
    'ODCCCCCcLCCCDO',
    'ODCCCCCcLCCCDO',
    'ODCCCCCcLCCCDO',
    'ODDCCCCcLCCDDO',
    'OtTTTTTYYTTTtO',
    'ODCCCCCcLCCCDO',
    'ODCCCCCcLCCCDO',
    'ODDCCCCcLCCDDO',
    'OccccccOcccccO',
]
S_ARM = {    # the right arm (on the eye's left), from the shoulder; the left is its mirror. (dx outward, rows)
    'hang': (0, ['.OLL', 'OLLC', 'OLCC', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'Occc', 'OSSs', 'OSss', '.OOO']),
    'fwd':  (0, ['.OLL', 'OLLC', 'OLCC', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'Occc', 'OSSs', 'OSss', '.OOO']),
    'back': (0, ['.OLL', 'OLLC', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'Occc', 'OSSs', 'OSss', '.OOO']),
}
S_LEGS = {   # rows 30..39, columns from 9
    'stand': [
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPppOOppPPO.',
        '.OBBBBOOBBBBO.',
        '.OBBBBOOBBBBO.',
        'OBBBBBOOBBBBBO',
        'ObbbbbOObbbbbO',
        '..............',
    ],
    'contactA': [   # the right foot (the eye's left) comes toward the eye, a row lower; the left pushes off, a row higher
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOBBBBO.',
        '.OPPppOOBBBBO.',
        '.OBBBBOOBBBBBO',
        '.OBBBBOObbbbbO',
        'OBBBBBO.OOOOO.',
        'ObbbbbO.......',
    ],
    'passA': [      # the left foot swinging through, lifted
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPppOOBBBBO.',
        '.OBBBBOOBBBBO.',
        '.OBBBBOOBBBBO.',
        'OBBBBBOObbbbO.',
        'ObbbbbO.OOOO..',
        '..............',
    ],
    'contactB': [
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OBBBBOOpPPPO.',
        '.OBBBBOOppPPO.',
        'OBBBBBOOBBBBO.',
        'ObbbbbOOBBBBO.',
        '.OOOOO.OBBBBBO',
        '.......ObbbbbO',
    ],
    'passB': [
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OBBBBOOppPPO.',
        '.OBBBBOOBBBBO.',
        '.OBBBBOOBBBBO.',
        '.ObbbbOOBBBBBO',
        '..OOOO.ObbbbbO',
        '..............',
    ],
}

# ---------------------------------------------- E (facing right) ---------------------------------------------------
E_HEAD = [   # at (14, 10): the head in profile — the crown, the ear, the brow over the eye, the nose, the jaw
    '..OOOOO....',
    '.OIIIIHO...',
    'OHIIHHHhO..',
    'OHHHHHhhhO.',
    'OHHSsSSeSO.',
    'OhHssSSSSSO',
    '.OhhSSSSsSO',
    '..OOssSSSO.',
]
E_TORSO = [  # at (9, 18): the neck under the jaw, the collar behind it, the broad back, the chest, the belt, the skirt
    '....OOOssssO..',
    '..OOLLcssssLLO',
    '.OLLLLLLLCCCLO',
    '.OLCCCCCCCCCCO',
    '.ODCCCCCCCCCCO',
    '.ODCCCCCCCCCcO',
    '.ODCCCCCCCCCcO',
    '.ODDCCCCCCCcO.',
    '.OtTTTTTTTYTO.',
    '.ODCCCCCCCCcO.',
    '.ODDCCCCCCCcO.',
    '.ODDCCCCCCCCO.',
    '.OccccccccccO.',
]
E_ARM = {    # the near (right) arm; (x, y, rows) at rest
    'hang': (18, 20, [
        'OCLc',
        'OCLc',
        'ODCD',
        'ODCD',
        'ODCD',
        'ODCD',
        'ODCD',
        'ODCD',
        'OcccO',
        'OSSSO',
        'OSSsO',
        '.OOO.',
    ]),
    'back': (15, 20, [   # swung back: the elbow behind, the hand at the seat; the chest shows before the arm
        '...OCLc',
        '...OCLc',
        '..ODCDc',
        '.ODCDO.',
        '.ODCDO.',
        '.ODCDO.',
        'ODCDO..',
        'OcccO..',
        'OSSSO..',
        'OSSsO..',
        '.OOO...',
    ]),
    'fwd': (18, 20, [    # swung forward: the hand out before the belly
        'OCLc..',
        'OCLcO.',
        'ODCDO.',
        '.ODCDO',
        '.ODCDO',
        '.ODCDO',
        '.OcccO',
        '.OSSSO',
        '.OSSsO',
        '..OOO.',
    ]),
}
E_ARM['rein'] = (18, 20, [   # astride: the forearm forward, the fist on the reins before the belly
    'OCLc...',
    'OCLc...',
    'ODCD...',
    'ODCDO..',
    'ODCCDO.',
    '.OcCCDO',
    '..OcccO',
    '...OSSO',
    '...OSsO',
    '....OO.',
])
E_FAR = {    # the far (left) hand where it shows past the body on a swing
    'fwd': (22, 26, ['Os.', 'Oss', 'OO.']),
    'back': (8, 25, ['.OD', 'Oss', 'Os.', '.O.']),
}
E_LEGS = {   # rows 30..39, columns from 8
    'stand': [
        '...OpppppOPPPPO.',
        '...OppppOPPPPPO.',
        '...OppppOPPPPO..',
        '...OppppOPPPPO..',
        '...OppppOPPPpO..',
        '...OppppOPPPpO..',
        '...ObbbbOBBBBO..',
        '..ObbbbbOBBBBBO.',
        '..OOOOOOOObbbbbO',
        '................',
    ],
    'contactA': [   # the near leg reaching, heel down; the far leg pushing off behind
        '...OppppPPPPPO..',
        '..OppppOOPPPPO..',
        '..OpppO.OPPPPPO.',
        '.OpppO...OPPPPO.',
        '.OpppO...OPPPPPO',
        'OpppO.....OPPPpO',
        'ObbO......OBBBBO',
        'ObbbO.....OBBBBB',
        'ObbbO.....Obbbbb',
        '................',
    ],
    'passA': [      # the near leg under the body; the far leg swinging through, its foot lifted
        '...OppppPPPPPO..',
        '...OppppOPPPPO..',
        '...OppppOPPPPO..',
        '..OppppOOPPPPO..',
        '..OpppO.OPPPpO..',
        '.OpppO..OPPPpO..',
        '.ObbbO..OBBBBO..',
        '.ObbO..OBBBBBO..',
        '..OO...ObbbbbO..',
        '................',
    ],
    'contactB': [   # the far leg reaching; the near leg pushing off behind
        '...OPPPPPpppO...',
        '..OPPPPOOppppO..',
        '..OPPPPO.OppppO.',
        '.OPPPPO...OpppO.',
        '.OPPPPO...OppppO',
        'OPPPpO.....OpppO',
        'OBBBO......ObbbO',
        'OBBBBO.....Obbbb',
        'ObbbbO.....OOOOO',
        '................',
    ],
    'passB': [      # the far leg under the body; the near leg swinging through
        '...OPPPPPpppO...',
        '...OPPPPOppppO..',
        '...OPPPPOppppO..',
        '..OPPPPOOppppO..',
        '..OPPPpO.OpppO..',
        '.OPPPpO..OpppO..',
        '.OBBBBO..ObbbO..',
        '.ObbbO..ObbbbO..',
        '..OOO...OOOOOO..',
        '................',
    ],
    'ride': [       # astride: the thigh forward along the back, the knee, the shin down the flank, the boot in the iron
        '...OPPPPPPPPPO..',
        '....OOOPPPPPPPO.',
        '.......OOOOPPPO.',
        '..........OPPPO.',
        '..........OPPpO.',
        '..........OBBBO.',
        '.........OBBBBBO',
        '.........ObbbbbO',
        '................',
        '................',
    ],
}

# ---------------------------------------------- N (away from the eye) -----------------------------------------------
N_HEAD = [   # at (11, 10): the back of the cropped head, the nape
    '..OOOOOO..',
    '.OIIIIHHO.',
    'OHIIHHHHhO',
    'OHHHHHHHhO',
    'OHHHHHHHhO',
    'OhHHHHHhhO',
    'OhhhhhhhhO',
    '.OssssssO.',
]
N_TORSO = [  # at (9, 18): the collar at the back of the neck, the shoulders, the belt, the vent
    'OOOOccccccOOOO',
    'OLLLLLLLLLLLLO',
    'OLLLLLLLLLLLLO',
    'OCLCCCCCCCCLCO',
    'ODCCCCCCCCCCDO',
    'ODCCCCCCCCCCDO',
    'ODCCCCCCCCCCDO',
    'ODDCCCCCCCCDDO',
    'OtTTTTTTTTTTtO',
    'ODCCCCCcCCCCDO',
    'ODCCCCCcCCCCDO',
    'ODDCCCCcCCCDDO',
    'OccccccOcccccO',
]
N_ARM = {    # the left arm (on the eye's left); the right is its mirror
    'hang': ['.OLL', 'OLLC', 'OLCC', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'Occc', 'OsSS', 'OssS', '.OOO'],
    'fwd':  ['.OLL', 'OLLC', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'Occc', 'OsSS', 'OssS', '.OOO'],
    'back': ['.OLL', 'OLLC', 'OLCC', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'OCCD', 'Occc', 'OsSS', 'OssS', '.OOO'],
}
N_LEGS = {   # rows 30..39, columns from 9: from behind, the heels
    'stand': S_LEGS['stand'],
    'contactA': [   # the left foot reaches away (a row higher); the right heel comes back toward the eye (a row lower)
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OBBBBOOpPPPO.',
        '.OBBBBOOppPPO.',
        'OBBBBBOOBBBBO.',
        'ObbbbbOOBBBBO.',
        '.OOOOO.OBBBBBO',
        '.......ObbbbbO',
    ],
    'passA': S_LEGS['passB'],
    'contactB': [
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOpPPPO.',
        '.OPPPpOOBBBBO.',
        '.OPPppOOBBBBO.',
        '.OBBBBOOBBBBBO',
        '.OBBBBOObbbbbO',
        'OBBBBBO.OOOOO.',
        'ObbbbbO.......',
    ],
    'passB': S_LEGS['passA'],
}

WALK = {'walk1': ('contactA', 0), 'walk2': ('passA', -1), 'walk3': ('contactB', 0), 'walk4': ('passB', -1)}
FRAMES = ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4']


def mirror(blk):
    return [s[::-1] for s in blk]


BREATHE = {('L', 'C'), ('I', 'H'), ('I', 'G'), ('F', 'f')}   # the coat's light, a mantle's or a cloak's, the fur's


def breath(r):
    """the breath: the chest's light reaches a row lower — on the coat, or on the mantle, cloak or fur that covers it; only
    the torso's rows breathe (never the head); the silhouette holds to the texel"""
    g = [list(s) for s in r]
    for x in range(W):
        for y in range(18, 31):
            if (r[y][x], r[y + 1][x]) in BREATHE:
                g[y + 1][x] = r[y][x]
                break
    return [''.join(x) for x in g]


SWING = {'S': {'walk1': ('back', 'fwd'), 'walk3': ('fwd', 'back')},      # (right arm, left arm)
         'N': {'walk1': ('back', 'fwd'), 'walk3': ('fwd', 'back')},
         'E': {'walk1': ('back', 'fwd'), 'walk3': ('fwd', 'back')}}      # (near arm, far hand)


def hand_of(blk, x0, y0, at=None):
    """the hand's texel: the first skin or wrapped texel of an arm block, placed (or the arm's own point when the hand is
    out of sight)"""
    if at:
        return [x0 + at[0], y0 + at[1]]
    for want in 'RS':   # a wrapped fist before bare skin: the pugugly's forearm is bare above its fist
        for j, s in enumerate(blk):
            i = s.find(want)
            if i >= 0:
                return [x0 + i, y0 + j]
    raise ValueError('an arm with no hand')


def lay(g, F, fc, z, dy, hand, frame):
    """the figure's gear on layer z: (z, x, y, rows, mode) — mode 'body' rides the upper body's rise, 'legs' stays,
    'hand' is placed from the right hand's texel; a rows dict picks by frame"""
    for (zz, x, y, blk, mode) in F[fc].get('gear', []):
        if zz != z:
            continue
        if isinstance(blk, dict):
            blk = blk.get(frame, blk.get('*'))
            if blk is None:
                continue
            if isinstance(blk, tuple):
                x, y, blk = blk
        if mode == 'hand':
            stamp(g, hand[0] + x, hand[1] + y, blk)
        else:
            stamp(g, x, y + (dy if mode == 'body' else 0), blk)


def compose(F, fc, frame):
    """one frame of figure F in facing fc: back gear, legs, torso, its gear, the head, the arms, what the hand holds"""
    P = F[fc]
    legs, dy = WALK.get(frame, ('stand', 0))
    if frame == 'ride':
        legs, dy = 'ride', 0
    sw = P.get('swing', SWING[fc]).get(frame, ('hang', 'hang' if fc != 'E' else None))
    if frame == 'ride':
        sw = P.get('ride_arms', ('rein', None))
    g = blank()
    # where the right hand is this frame
    A = P['arm'][sw[0]] if fc == 'E' else P['armR'][sw[0]]
    ax, ay, ablk = A[:3]
    hand = hand_of(ablk, ax, ay + dy, A[3] if len(A) > 3 else None)
    if fc == 'E' and sw[1] and P['far'].get(sw[1]):   # the far hand, deepest of all (none where the back's gear hides it)
        x, y, blk = P['far'][sw[1]]; stamp(g, x, y + dy, blk)
    lay(g, F, fc, 0, dy, hand, frame)
    lay(g, F, fc, 1, dy, hand, frame)
    stamp(g, P.get('legs_x', 9 if fc != 'E' else 8), 30, P['legs'][legs])
    lay(g, F, fc, 2, dy, hand, frame)
    x, y, blk = P['torso_ride'] if frame == 'ride' and 'torso_ride' in P else P['torso']; stamp(g, x, y + dy, blk)
    lay(g, F, fc, 3, dy, hand, frame)
    x, y, blk = P['head']; stamp(g, x, y + dy, blk)
    lay(g, F, fc, 4, dy, hand, frame)
    if fc == 'E':
        stamp(g, ax, ay + dy, ablk)
    else:
        lx, ly, lblk = P['armL'][sw[1]][:3]
        stamp(g, lx, ly + dy, lblk)
        stamp(g, ax, ay + dy, ablk)
    lay(g, F, fc, 5, dy, hand, frame)
    out = close(rows(g))
    META[(F['name'], fc, frame)] = {'dy': dy, 'hand': hand}
    return breath(out) if frame == 'idle2' else out


META = {}


def arms_S(R, x=5, y=19, xl=23):
    """an S or N arm set from the right arm's rows: {pose: (x, y, rows)}; the left is the mirror"""
    armR = {k: (x, y, v) for k, v in R.items()}
    armL = {k: (xl + (4 - max(len(s) for s in v)), y, mirror(v)) for k, v in R.items()}
    return armR, armL


BASE_S_R = {k: v[1] for k, v in S_ARM.items()}
BASE_N_L = N_ARM


def rig():
    """the bare rig as a figure"""
    sR, sL = arms_S(BASE_S_R)
    nR = {k: (23, 19, mirror(v)) for k, v in BASE_N_L.items()}   # from behind the right arm is on the eye's right
    nL = {k: (5, 19, v) for k, v in BASE_N_L.items()}
    return {'name': 'rig', 'pal': PAL_FK,
            'S': {'head': (11, 10, S_HEAD), 'torso': (9, 18, S_TORSO), 'armR': sR, 'armL': sL, 'legs': S_LEGS},
            'E': {'head': (13, 10, E_HEAD), 'torso': (9, 18, E_TORSO), 'arm': E_ARM, 'far': E_FAR, 'legs': E_LEGS},
            'N': {'head': (11, 10, N_HEAD), 'torso': (9, 18, N_TORSO), 'armR': nR, 'armL': nL, 'legs': N_LEGS}}


# =====================================================================================================================
# THE CLASSES — each dressed on the rig: its own head, its own gear, the same body underneath
# =====================================================================================================================
def pal(**kw):
    p = dict(PAL_FK)
    p.update(kw)
    return p


# ------------------------------------------------------------------ PUGUGLY -------------------------------------------
# bare-knuckle bruiser: cropped hair, the brow low, a jaw of iron, the widest shoulders, the sleeves rolled off bare
# forearms, the fists wrapped in linen (R). Both fists the same; nothing carried.
PU_S_HEAD = [   # at (10, 10): the brows low over the eyes, the nose knocked aside, the jaw wider than the skull, no neck
    '...OOOOOO...',
    '..OIIIIIHO..',
    '.OHIIHHHHhO.',
    '.OHhhSShhHO.',
    '.OsSeSSeSsO.',
    '.OsSSsSSSsO.',
    'OsSSSSSSSSsO',
    'OsSSsssSSSsO',
    'OssSSSSSSssO',
]
PU_S_TORSO = [  # at (8, 18): a hand wider again than the rig
    'OOOOOssssssOOOOO',
    'OLLLLLcsscLLLLLO',
    'OLLLLCCccCCLLLLO',
    'ODLLCCCCcLCCLLDO',
    'ODCCCCCCcLCCCCDO',
    'ODCCCCCCcLCCCCDO',
    'ODDCCCCCcLCCCDDO',
    'ODDCCCCCcLCCCDDO',
    'OtTTTTTYYTTTTTtO',
    'ODCCCCCCcLCCCCDO',
    'ODCCCCCCcLCCCCDO',
    'ODDCCCCCcLCCCDDO',
    'OcccccccOccccccO',
]
PU_S_ARM = {    # the right arm (the eye's left): the sleeve rolled at the elbow, the bare forearm, the wrapped fist
    'hang': ['.OLL', 'OLLC', 'OLCC', 'OCCD', 'OCCD', 'Occc', 'OSSs', 'OSSs', 'OSSs', 'ORRr', 'ORRr', 'ORrr', '.OOO'],
    'fwd':  ['.OLL', 'OLLC', 'OLCC', 'OCCD', 'OCCD', 'OCCD', 'Occc', 'OSSs', 'OSSs', 'OSSs', 'ORRr', 'ORRr', 'ORrr', '.OOO'],
    'back': ['.OLL', 'OLLC', 'OCCD', 'OCCD', 'Occc', 'OSSs', 'OSSs', 'ORRr', 'ORRr', 'ORrr', '.OOO'],
}
PU_E_HEAD = [   # at (13, 10): the brow ridge out over the eye, the flat nose, the jaw deep and square
    '..OOOOO....',
    '.OIIIIHO...',
    'OHIIHHHhO..',
    'OHHHHHhhhO.',
    'OHHsSSSeSO.',
    'OhHssSSSSSO',
    '.OhSSSSSsSO',
    '.OsSSSSSSSO',
    '..OssssssO.',
]
PU_E_ARM = {
    'hang': (18, 20, ['OCLc', 'OCLc', 'ODCD', 'ODCD', 'OcccO', 'OSSsO', 'OSSsO', 'OSSsO', 'ORRRO', 'ORRrO', 'ORrrO', '.OOO.']),
    'back': (15, 20, ['...OCLc', '...OCLc', '..ODCDc', '.OcccO.', '.OSSsO.', '.OSSsO.', 'OSSsO..', 'ORRRO..', 'ORRrO..', 'ORrrO..', '.OOO...']),
    'fwd':  (18, 20, ['OCLc..', 'OCLcO.', 'ODCDO.', '.OcccO', '.OSSsO', '.OSSsO', '.OSSsO', '.ORRRO', '.ORRrO', '.ORrrO', '..OOO.']),
    'rein': (18, 20, ['OCLc...', 'OCLc...', 'ODCD...', 'OcccO..', 'OSSsSO.', '.OSSSsO', '..ORRRO', '..ORRrO', '...OOO.']),
}
PU_E_FAR = {'fwd': (22, 26, ['Or.', 'Orr', 'OO.']), 'back': (8, 25, ['.OD', 'Orr', 'Or.', '.O.'])}
PU_N_HEAD = [   # at (11, 10)
    '..OOOOOO..',
    '.OIIIIHHO.',
    'OHIIHHHHhO',
    'OHHHHHHHhO',
    'OHHHHHHHhO',
    'OhHHHHHhhO',
    'OshhhhhhsO',
    '.OssssssO.',
]
PU_N_TORSO = [  # at (8, 18)
    'OOOOOccccccOOOOO',
    'OLLLLLLLLLLLLLLO',
    'OCLLCCCCCCCCLLCO',
    'ODCCCCCCCCCCCCDO',
    'ODCCCCCCCCCCCCDO',
    'ODCCCCCCCCCCCCDO',
    'ODDCCCCCCCCCCDDO',
    'ODDCCCCCCCCCCDDO',
    'OtTTTTTTTTTTTTtO',
    'ODCCCCCCcCCCCCDO',
    'ODCCCCCCcCCCCCDO',
    'ODDCCCCCcCCCCDDO',
    'OcccccccOccccccO',
]
PU_N_ARM = {    # the left arm (the eye's left)
    'hang': ['.OLL', 'OLLC', 'OLCC', 'OCCD', 'OCCD', 'Occc', 'OsSS', 'OsSS', 'OsSS', 'OrRR', 'OrRR', 'OrrR', '.OOO'],
    'fwd':  ['.OLL', 'OLLC', 'OCCD', 'OCCD', 'Occc', 'OsSS', 'OsSS', 'OrRR', 'OrRR', 'OrrR', '.OOO'],
    'back': ['.OLL', 'OLLC', 'OLCC', 'OCCD', 'OCCD', 'OCCD', 'Occc', 'OsSS', 'OsSS', 'OsSS', 'OrRR', 'OrRR', 'OrrR', '.OOO'],
}


def pugugly():
    sR = {k: (4, 19, v) for k, v in PU_S_ARM.items()}
    sL = {k: (24, 19, mirror(v)) for k, v in PU_S_ARM.items()}
    nL = {k: (4, 19, v) for k, v in PU_N_ARM.items()}
    nR = {k: (24, 19, mirror(v)) for k, v in PU_N_ARM.items()}
    return {'name': 'pugugly', 'pal': pal(H='#4a3f36', R='#efebe1', r='#b9b2a3'),
            'notes': 'Bare-knuckle bruiser: cropped hair, a jaw of iron, the widest shoulders, sleeves rolled off bare forearms, '
                     'both fists wrapped in linen (R). Nothing carried; the right fist is the hand anchor.',
            'S': {'head': (10, 10, PU_S_HEAD), 'torso': (8, 18, PU_S_TORSO), 'armR': sR, 'armL': sL, 'legs': S_LEGS},
            'E': {'head': (13, 10, PU_E_HEAD), 'torso': (9, 18, E_TORSO), 'arm': PU_E_ARM, 'far': PU_E_FAR, 'legs': E_LEGS},
            'N': {'head': (11, 10, PU_N_HEAD), 'torso': (8, 18, PU_N_TORSO), 'armR': nR, 'armL': nL, 'legs': N_LEGS}}


# ------------------------------------------------------------------ BERSERKER -----------------------------------------
# pistol and claymore: a bare head, the hair to the jaw, a fur collar (F) over the shoulders, the claymore on the back —
# its hilt (W, the grip N) standing over the RIGHT shoulder, the blade down the back — and the pistol holstered on the
# RIGHT hip (the holster N, the grip V). The rig's width: narrower than the pugugly, the same height.
BE_S_HEAD = [   # at (11, 10): the hair falls to the jaw, the beard on it
    '..OOOOOO..',
    '.OIIIIIHO.',
    'OHIIHHHHhO',
    'OHHSSSShhO',
    'OHSeSSeShO',
    'OHSSSSSShO',
    'OhHSssSHhO',
    'OhhHHHHhhO',
]
BE_S_FUR = [    # at (5, 18): the fur collar round the neck and over the shoulders, its edge in clumps
    '....OOFFFO..OFFFOO....',
    '.OOOFFFFFFFFFFFFFFOOO.',
    'OFFFFFFFFFFFFFFFFFFFFO',
    'OfFFfFFFfFFFFfFFFfFFfO',
    '.OffOfffOffffOfffOffO.',
    '..OO.OOO.OOOO.OOO.OO..',
]
BE_S_HILT = [   # at (7, 9): the pommel, the grip, the guard over the right shoulder (behind the head)
    '..OO...',
    '.OWWO..',
    '.ONnO..',
    '.ONnO..',
    '.ONnO..',
    '.ONnO..',
    'OOWWOO.',
    'OWWWWWO',
    '.OwwO..',
]
BE_S_GUN = [    # at (10, 25): the pistol's grip over the holster at the right hip
    'OVVO',
    'OVNO',
    '.ONO',
    '.ONO',
    '.OnO',
]
BE_E_HEAD = [   # at (13, 10): the hair down the nape, the beard along the jaw
    '..OOOOO....',
    '.OIIIIHO...',
    'OHIIHHHhO..',
    'OHHHHHHhSO.',
    'OHHHsSSeSO.',
    'OhHHsSSSSSO',
    'OhHhHHSsSO.',
    '.OhhhHHHHO.',
]
BE_E_FUR = [    # at (9, 17): the fur at the nape and over the shoulder
    '....OOFO.....',
    '...OFFFFOO..O',
    '.OOFFFFFFFFFO',
    'OFFFFFFFFFFFO',
    'OfFFfFFfFFfFO',
    '.OffOffOffOO.',
    '..OO.OO.OO...',
]
BE_E_SWORD = [  # at (7, 8): the hilt behind the head, the blade down the back
    '..OO.',
    '.OWWO',
    '.ONnO',
    '.ONnO',
    '.ONnO',
    '.ONnO',
    'OWWWWO',
    'OwWwwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '.OWwO',
    '..OO.',
]
BE_E_GUN = [    # at (13, 25): the grip angled back over the holster on the near hip
    'OVVO.',
    'OVVNO',
    '.ONNO',
    '.ONnO',
    '.ONnO',
    '..OO.',
]
BE_N_HEAD = [   # at (11, 10): the back of the head, the hair to the collar
    '..OOOOOO..',
    '.OIIIIHHO.',
    'OHIIHHHHhO',
    'OHHHHHHHhO',
    'OHHHHHHHhO',
    'OhHHHHHHhO',
    'OhHHHHHhhO',
    'OhhhhhhhhO',
]
BE_N_FUR = [    # at (5, 18): the fur across the upper back
    '....OOFFFFFFFFFFFFOO....'[0:22],
    '.OOOFFFFFFFFFFFFFFOOO.',
    'OFFFFFFFFFFFFFFFFFFFFO',
    'OfFFfFFFfFFFFfFFFfFFfO',
    '.OffOfffOffffOfffOffO.',
    '..OO.OOO.OOOO.OOO.OO..',
]
BE_N_SWORD = [  # at (17, 8): the claymore on the back at the right shoulder blade (the eye's right), point down
    '...OO..',
    '..OWWO.',
    '..ONnO.',
    '..ONnO.',
    '..ONnO.',
    '..ONnO.',
    'OOOWWOOO',
    'OWWWWWWO',
    '..OwwO..',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '..OWwO.',
    '...OO..',
]
BE_N_GUN = [    # at (18, 25): the grip and holster at the right hip (the eye's right)
    'OVVO',
    'ONVO',
    'ONO.',
    'ONO.',
    'OnO.',
]


def berserker():
    sR = {k: (5, 19, v) for k, v in BASE_S_R.items()}
    sL = {k: (23, 19, mirror(v)) for k, v in BASE_S_R.items()}
    nL = {k: (5, 19, v) for k, v in BASE_N_L.items()}
    nR = {k: (23, 19, mirror(v)) for k, v in BASE_N_L.items()}
    return {'name': 'berserker', 'pal': pal(H='#6e4630', F='#d8c9b8', f='#a99a86'),
            'notes': 'Pistol and claymore: a bare head, the hair to the jaw, a fur collar (F) over the shoulders. The claymore rides '
                     'the back, its hilt (W, grip N) over the RIGHT shoulder and the blade down the back; the pistol is holstered on the '
                     'RIGHT hip. Both hands are bare and free.',
            'S': {'head': (11, 10, BE_S_HEAD), 'torso': (9, 18, S_TORSO), 'armR': sR, 'armL': sL, 'legs': S_LEGS,
                  'gear': [(0, 5, 9, BE_S_HILT, 'body'), (3, 10, 25, BE_S_GUN, 'body'), (4, 5, 18, BE_S_FUR, 'body')]},
            'E': {'head': (13, 10, BE_E_HEAD), 'torso': (9, 18, E_TORSO), 'arm': E_ARM, 'far': E_FAR, 'legs': E_LEGS,
                  'gear': [(0, 7, 8, BE_E_SWORD, 'body'), (3, 13, 25, BE_E_GUN, 'body'), (4, 10, 17, BE_E_FUR, 'body')]},
            'N': {'head': (11, 10, BE_N_HEAD), 'torso': (9, 18, N_TORSO), 'armR': nR, 'armL': nL, 'legs': N_LEGS,
                  'gear': [(3, 18, 25, BE_N_GUN, 'body'), (4, 5, 18, BE_N_FUR, 'body'), (4, 17, 8, BE_N_SWORD, 'body')]}}


# ------------------------------------------------------------------ LONGBOWMEN ----------------------------------------
# the wall of Farkeep carried on a shoulder: a hood and its short mantle, the long bow stave (V) up the LEFT side of the
# back from the hip to past the crown, the leather quiver (T) on the RIGHT side with its fletchings (F) over the right
# shoulder, its strap across the chest from the right shoulder to the left hip. Both hands free.
LB_S_HEAD = [   # at (11, 10): the hood, the brow in its shadow
    '..OOOOOO..',
    '.OIIIIIHO.',
    'OIIHHHHHhO',
    'OHhhhhhhhO',
    'OHSeSSeShO',
    'OhSSSSSShO',
    'OhSSssSShO',
    'OhhsSSshhO',
]
LB_S_MANTLE = [  # at (5, 18): the hood's short mantle over the shoulders, falling to a point on the chest
    '....OOhhhhhhhhhhOO....',
    '..OOIIHHHHHHHHHHIIOO..',
    '.OIIHHHHHHHHHHHHHHIIO.',
    'OhHHHHHHHHHHHHHHHHHHhO',
    'OhhhhHHHHHHHHHHHHhhhhO',
    '.OOOOhhHHHHHHHHhhOOOO.',
    '.....OOhhHHHHhhOO.....',
    '.......OOhhhhOO.......',
    '.........OOOO.........',
]
LB_S_STAVE = [   # at (22, 3): the stave's upper limb over the left shoulder
    '.O.',
    'OVO',
    'OVO',
    'OVO',
    'OVO',
    'OVO',
    'OVO',
    'OVO',
    'OVO',
    'OVO',
    'OVO',
    'OVO',
    'OvO',
    'OvO',
    'OvO',
    'OvO',
]
LB_S_FLETCH = [  # at (7, 12): the fletchings over the right shoulder, the quiver's mouth
    '.O.O..',
    'OFOFO.',
    'OFfFfO',
    'OfFfFO',
    'OTTTTO',
    'OtttTO',
]
LB_S_STRAP = [   # at (11, 22): the quiver's strap from the right shoulder to the left hip
    'TT.......',
    'tTT......',
    '.tTT.....',
    '..tTT....',
    '...tTT...',
    '....tTT..',
    '.....tTT.',
    '......tTT',
]
LB_E_HEAD = [   # at (13, 10): the hood in profile, the face under its brim
    '..OOOOO....',
    '.OIIIIHO...',
    'OIHHHHHHO..',
    'OHHHHHhhhO.',
    'OHHHHhSeSO.',
    'OhHHHhSSSSO',
    'OhhHHhSSsO.',
    '.OhhhhsSSO.',
]
LB_E_MANTLE = [  # at (9, 18): the mantle over the shoulder, its points fore and aft
    '....OhhhhhhO..',
    '..OOIIIIHHHHO.',
    '.OIIHHHHHHHHHO',
    'OhHHHHHHHHHHhO',
    'OhHHHHHHHHHhhO',
    'OhhHHHHHHhhOO.',
    '.OhhhhhhhhO...',
    '..OOOOOOOO....',
]
LB_E_STAVE = [   # at (7, 3): the stave behind the back, from past the crown to the hip
    '.O.', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO',
    'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OvO', 'OvO', 'OvO', 'OvO', '.O.',
]
LB_E_QUIVER = [  # at (5, 12): the quiver on the back, leaning, fletchings up behind the shoulder
    '...O.O',
    '..OFOF',
    '..OFfO',
    '..OfFO',
    '.OTTTO',
    '.OTttO',
    '.OTttO',
    '.OTttO',
    'OTttO.',
    'OTttO.',
    'OTttO.',
    'OTttO.',
    'OTtO..',
    '.OO...',
]
LB_N_HEAD = [   # at (11, 10): the hood from behind
    '..OOOOOO..',
    '.OIIIIHHO.',
    'OIIHHHHHhO',
    'OHHHHHHHhO',
    'OHHHHHHHhO',
    'OhHHHHHHhO',
    'OhHHHHHhhO',
    'OhhhhhhhhO',
]
LB_N_MANTLE = [  # at (5, 18): the mantle from behind, its point down the back
    '....OOHHHHHHHHHHOO....',
    '..OOIIHHHHHHHHHHIIOO..',
    '.OIIHHHHHHHHHHHHHHIIO.',
    'OhHHHHHHHHHHHHHHHHHHhO',
    'OhhhhHHHHHHHHHHHHhhhhO',
    '.OOOOhhHHHHHHHHhhOOOO.',
    '.....OOhhHHHHhhOO.....',
    '.......OOhhhhOO.......',
    '.........OOOO.........',
]
LB_N_STAVE = [   # at (9, 3): the stave up the left side of the back (the eye's left)
    '.O.', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO',
    'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OVO', 'OvO', 'OvO', 'OvO', 'OvO', '.O.',
]
LB_N_QUIVER = [  # at (18, 12): the quiver on the right side of the back (the eye's right)
    '.O.O.',
    'OFOFO',
    'OFfFO',
    'OfFfO',
    'OTTTO',
    'OTttO',
    'OTttO',
    'OTttO',
    'OTttO',
    'OTttO',
    'OTttO',
    'OTttO',
    'OTttO',
    '.OtO.',
    '..O..',
]


def longbowmen():
    sR = {k: (5, 19, v) for k, v in BASE_S_R.items()}
    sL = {k: (23, 19, mirror(v)) for k, v in BASE_S_R.items()}
    nL = {k: (5, 19, v) for k, v in BASE_N_L.items()}
    nR = {k: (23, 19, mirror(v)) for k, v in BASE_N_L.items()}
    return {'name': 'longbowmen', 'pal': pal(H='#3e4650', F='#d8c9b8', f='#a99a86'),
            'notes': 'The wall of Farkeep carried on a shoulder: a hood and its short mantle; the long bow stave (V) up the LEFT side of '
                     'the back from the hip to past the crown; the leather quiver (T) on the RIGHT side, its fletchings (F) over the '
                     'right shoulder and its strap across the chest to the left hip. Both hands free.',
            'S': {'head': (11, 10, LB_S_HEAD), 'torso': (9, 18, S_TORSO), 'armR': sR, 'armL': sL, 'legs': S_LEGS,
                  'gear': [(0, 22, 3, LB_S_STAVE, 'body'), (0, 7, 12, LB_S_FLETCH, 'body'), (3, 11, 22, LB_S_STRAP, 'body'),
                           (5, 5, 18, LB_S_MANTLE, 'body')]},
            'E': {'head': (13, 10, LB_E_HEAD), 'torso': (9, 18, E_TORSO), 'arm': E_ARM, 'far': E_FAR, 'legs': E_LEGS,
                  'gear': [(0, 7, 3, LB_E_STAVE, 'body'), (0, 5, 12, LB_E_QUIVER, 'body'), (5, 9, 18, LB_E_MANTLE, 'body')]},
            'N': {'head': (11, 10, LB_N_HEAD), 'torso': (9, 18, N_TORSO), 'armR': nR, 'armL': nL, 'legs': N_LEGS,
                  'gear': [(5, 5, 18, LB_N_MANTLE, 'body'), (5, 9, 3, LB_N_STAVE, 'body'), (5, 18, 12, LB_N_QUIVER, 'body')]}}


# ------------------------------------------------------------------ RIFLE RIDER ---------------------------------------
# a longbowman who earned a horse and traded the bow for a breech: the hood up, a riding coat to the knee split for the
# saddle, the bandolier (T, its rounds Y) from the left shoulder to the right hip, the rifle slung on the back — its
# muzzle (W/w) over the LEFT shoulder, the stock (V) at the RIGHT hip. Both hands free.
RR_S_TORSO = S_TORSO[:12] + [
    'ODCCCCCOCCCCDO',
    'ODCCCCCOCCCCDO',
    'ODDCCCCOCCCDDO',
    'OccccccOcccccO',
]
RR_S_MUZZLE = [   # at (21, 10): the muzzle over the left shoulder (the eye's right), leaning out, the barrel behind
    '....OO',
    '...OWO',
    '..OwwO',
    '.OwwO.',
    'OwwO..',
    'OwVO..',
    'OVO...',
    'OO....',
]
RR_S_BANDO = [    # at (11, 20): the bandolier from the left shoulder (the eye's right) to the right hip
    '........YT',
    '.......YTt',
    '......YTt.',
    '.....YTt..',
    '....YTt...',
    '...YTt....',
    '..YTt.....',
    '.YTt......',
    'YTt.......',
]
RR_E_TORSO = E_TORSO[:12] + [
    '.ODDCCCCCCCcO',
    '.ODCCCCCCCCcO',
    'ODDCCCCCCCCcO',
    'OccccccccccccO',
]
RR_E_TORSO_RIDE = E_TORSO[:12] + [
    '.OcccccccccO.',
    '.ODCCO.......',
    'ODDCO........',
    'OccO.........',
]
RR_E_RIFLE = [    # at (7, 10): the muzzle up behind the head, the barrel down the back, the breech, the stock at the hip
    '...OO',
    '..OWO',
    '..OwO',
    '..OwO',
    '..OwO',
    '..OwVO',
    '..OwVO',
    '.OwVO',
    '.OwVO',
    '.OWwO',
    '.OwwO',
    '.OVVO',
    'OVVvO',
    'OVVvO',
    'OVvvO',
    'OVvvO',
    'OvvvO',
    '.OOO.',
]
RR_E_BANDO = [    # at (14, 19): the bandolier across the chest
    '....YTO',
    '...YTt.',
    '..YTt..',
    '.YTt...',
]
RR_N_RIFLE = [    # at (4, 10): across the back from the left shoulder (the eye's left, the muzzle) to the right hip, clear of the head
    '.OO.............',
    'OWwO............',
    '.OwwO...........',
    '..OwwO..........',
    '...OwwO.........',
    '....OwVO........',
    '.....OwVO.......',
    '......OwVO......',
    '......OwVO......',
    '.......OwVO.....',
    '........OWwO....',
    '.........OwwO...',
    '..........OVVVO.',
    '...........OVVvO',
    '............OVvvO'[0:16],
    '............OVvvO'[0:16],
    '.............OOO.'[0:16],
]
RR_N_TORSO = N_TORSO[:12] + [
    'ODCCCCCcCCCCDO',
    'ODCCCCCcCCCCDO',
    'ODDCCCCcCCCDDO',
    'OccccccOcccccO',
]


def rifle_rider():
    sR = {k: (5, 19, v) for k, v in BASE_S_R.items()}
    sL = {k: (23, 19, mirror(v)) for k, v in BASE_S_R.items()}
    nL = {k: (5, 19, v) for k, v in BASE_N_L.items()}
    nR = {k: (23, 19, mirror(v)) for k, v in BASE_N_L.items()}
    return {'name': 'rifle_rider', 'pal': pal(H='#646f7b'),
            'notes': 'A longbowman who earned a horse and traded the bow for a breech: the hood up, a riding coat to the knee split for '
                     'the saddle, the bandolier (T, rounds Y) from the left shoulder to the right hip; the rifle slung on the back, its '
                     'muzzle (W/w) over the LEFT shoulder and the stock (V) at the RIGHT hip. Both hands free.',
            'S': {'head': (11, 10, LB_S_HEAD), 'torso': (9, 18, RR_S_TORSO), 'armR': sR, 'armL': sL, 'legs': S_LEGS,
                  'gear': [(0, 21, 10, RR_S_MUZZLE, 'body'), (3, 11, 20, RR_S_BANDO, 'body')]},
            'E': {'head': (13, 10, LB_E_HEAD), 'torso': (9, 18, RR_E_TORSO), 'torso_ride': (9, 18, RR_E_TORSO_RIDE), 'arm': E_ARM,
                  'far': {'fwd': E_FAR['fwd'], 'back': None}, 'legs': E_LEGS,
                  'gear': [(0, 7, 10, RR_E_RIFLE, 'body'), (3, 14, 19, RR_E_BANDO, 'body')]},
            'N': {'head': (11, 10, LB_N_HEAD), 'torso': (9, 18, RR_N_TORSO), 'armR': nR, 'armL': nL, 'legs': N_LEGS,
                  'gear': [(5, 4, 10, RR_N_RIFLE, 'body')]}}


# ------------------------------------------------------------------ RECON RIDER ---------------------------------------
# quick, quiet, low damage: a short hooded cloak in the Farkeep grey (G; the hood is the cloak's, H = G) over the coat,
# no weapon, a satchel (T) on the LEFT hip and the spyglass (W/w) in the RIGHT hand.
RC_S_HEAD = [   # at (11, 10): the cloak's hood, deep over the brow
    '..OOOOOO..',
    '.OIIIIIHO.',
    'OIIHHHHHhO',
    'OHhhhhhhhO',
    'OhSeSSeShO',
    'OhSSSSSShO',
    'OhhSssShhO',
    '.OhhSShhO.',
]
RC_S_CLOAK = [  # at (5, 18): from the shoulders over the upper arms, clasped at the throat, open below, folds down it
    '.....OGGOssssOGGO.....',
    '..OOIIIIGGWWGGIIIIOO..',
    '.OIIGGGGGgOOgGGGGGIIO.',
    'OIGGgGGGgO..OgGGGgGGIO',
    'OGGGgGGgO....OgGGgGGGO',
    'OgGGgGgO......OgGgGGgO',
    'OgggggO........OgggggO',
    '.OOOOO..........OOOOO.',
]
RC_S_SATCHEL = [  # at (19, 25): the satchel on the left hip (the eye's right)
    'OOOOOO',
    'OTTTTO',
    'OTYTtO',
    'OtttnO',
    'OtttnO',
    '.OOOO.',
]
RC_S_GLASS = [   # the spyglass, collapsed, held in the right fist and hanging below it (placed from the hand)
    'OWWO',
    'OwwO',
    'OWwO',
    'OwwO',
    '.OO.',
]
RC_E_HEAD = [   # at (13, 10)
    '..OOOOO....',
    '.OIIIIHO...',
    'OIHHHHHHO..',
    'OHHHHHhhhO.',
    'OHHHHhSeSO.',
    'OhHHHhSSSSO',
    'OhhHHhhSsO.',
    '.OhhhhhSSO.',
]
RC_E_CLOAK = [  # at (9, 18): over the shoulder and the upper arm, close down the back, longest behind
    '....OGGGGO....',
    '..OOIIIIIIOO..',
    '.OIIGGGGGGIIO.',
    'OGGGGgGGGGGGGO',
    'OGGGGgGGGGGGgO',
    'OgGGGgGGGGGggO',
    'OgGGgGGGGggOO.',
    'OggGgGGggOO...',
    'OggggggOO.....',
    '.OOOOOO.......',
]
RC_E_SATCHEL = [  # at (6, 25): behind the hip
    'OOOO.',
    'OTTTO',
    'OttTO',
    'OttnO',
    '.OOO.',
]
RC_N_CLOAK = [  # at (5, 18): the cloak from the hood down the back to the waist, folds down it
    '.....OGGGGGGGGGGO.....',
    '..OOIIIIGGGGGGIIIIOO..',
    '.OIIGGGGGGGGGGGGGGIIO.',
    'OIGGgGGGGGGGGGGGGgGGIO',
    'OGGGgGGGGGGGGGGGGgGGGO',
    'OgGGgGGGGGgGGGGGGgGGgO',
    'OggggggggggggggggggggO',
    '.OOOOOOOOOOOOOOOOOOOO.',
]
RC_N_SATCHEL = [  # at (7, 25): the left hip (the eye's left)
    'OOOOOO',
    'OTTTTO',
    'OtYTTO',
    'OnttTO',
    'OntttO',
    '.OOOO.',
]


def recon_rider():
    sR = {k: (5, 19, v) for k, v in BASE_S_R.items()}
    sL = {k: (23, 19, mirror(v)) for k, v in BASE_S_R.items()}
    nL = {k: (5, 19, v) for k, v in BASE_N_L.items()}
    nR = {k: (23, 19, mirror(v)) for k, v in BASE_N_L.items()}
    return {'name': 'recon_rider', 'pal': pal(H='#8d979c', G='#8d979c', g='#6e747c'),
            'notes': 'Quick, quiet, low damage: a short hooded cloak in the Farkeep grey (G; its hood is H = G) over the coat, no weapon. '
                     'A satchel (T) on the LEFT hip; the spyglass (W/w) in the RIGHT hand.',
            'S': {'head': (11, 10, RC_S_HEAD), 'torso': (9, 18, S_TORSO), 'armR': sR, 'armL': sL, 'legs': S_LEGS,
                  'gear': [(3, 19, 25, RC_S_SATCHEL, 'body'), (5, 5, 18, RC_S_CLOAK, 'body'), (5, -1, 2, RC_S_GLASS, 'hand')]},
            'E': {'head': (13, 10, RC_E_HEAD), 'torso': (9, 18, E_TORSO), 'arm': E_ARM, 'far': E_FAR, 'legs': E_LEGS,
                  'gear': [(0, 6, 25, RC_E_SATCHEL, 'body'), (5, 9, 18, RC_E_CLOAK, 'body'), (5, -1, 2, RC_S_GLASS, 'hand')]},
            'N': {'head': (11, 10, LB_N_HEAD), 'torso': (9, 18, N_TORSO), 'armR': nR, 'armL': nL, 'legs': N_LEGS,
                  'gear': [(3, 8, 25, RC_N_SATCHEL, 'body'), (5, 5, 18, RC_N_CLOAK, 'body'), (5, -1, 2, RC_S_GLASS, 'hand')]}}


# ------------------------------------------------------------------ SHIELD --------------------------------------------
# the Republic's shield-bearer, the garrison and the marching column: a grey helm (H) with the nose guard (W), an iron
# jaw guard (w), the coat, THE SHIELD — tall, grey-steel (G), a steel rim (W), a cold iron boss (w) — on the LEFT arm,
# and the spear (haft V, head W) upright in the RIGHT hand. Neither arm swings: the column marches.
SH_S_HEAD = [   # at (11, 10): the helm, the nose guard between the eyes, the iron jaw
    '..OOOOOO..',
    '.OIIIIIHO.',
    'OIIHHHHHhO',
    'OhhhWWhhhO',
    'OhSeWWeShO',
    'OwSSWWSSwO',
    'OwwwwwwwwO',
    '.OwwwwwwO.',
]
SH_S_GRIP = [    # the right arm (the eye's left): the forearm forward, the fist at the belt on the haft
    '.OLL', 'OLLC', 'OLCC', 'OCCD', 'OCCD', 'OCCD', 'OcCc', 'OSSs', 'OSss', '.OOO',
]
SH_SHIELD = [    # the face: the steel rim lit above and to the left, the grey-steel field, the cold iron boss
    '.OOOOOOO.',
    'OWWWWWWwO',
    'OWGGGGgwO',
    'OWGGGGgwO',
    'OWGGGGgwO',
    'OWGGGGgwO',
    'OWGWwwgwO',
    'OWGwwwgwO',
    'OWGwwwgwO',
    'OWGGGGgwO',
    'OWGGGGgwO',
    'OWGGGGgwO',
    'OWGGGggwO',
    'OWgggggwO',
    'OwwwwwwwO',
    '.OOOOOOO.',
]
SH_SPEAR_S = [   # from the right hand (x-1, y-23): the leaf head, the haft over the arm, the fist left clear, the butt (v3.51: two
    # texels shorter above the fist — the head rode off the grid's top row on the passing steps)
    '..W..',
    '.WWw.',
    '.WWw.',
    '..W..',
    '..w..',
    '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..',
    '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..',
    '.....',
    '.....',
    '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..v..',
]
SH_SPEAR_N = [   # from behind the spear stands beside the right arm, whole (v3.51: two texels shorter, as from the front)
    '..W..',
    '.WWw.',
    '.WWw.',
    '..W..',
    '..w..',
    '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..',
    '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..',
    '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..V..', '..v..',
]
SH_E_HEAD = [   # at (13, 10): the helm in profile, the nose guard, the jaw guard
    '..OOOOO....',
    '.OIIIIHO...',
    'OIHHHHHHO..',
    'OhhhhhhhWO.',
    'OHHhsSSeWO.',
    'OhHwwSSSWO.',
    '.OhwwwwwwO.',
    '..OwwwwwO..',
]
SH_E_GRIP = (18, 20, [   # the near arm: the forearm forward, the fist before the chest
    'OCLc....',
    'OCLc....',
    'ODCD....',
    'ODCDO...',
    'ODCCDOO.',
    '.OcCCCcO',
    '..OOOSSO',
    '....OSsO',
    '.....OO.',
])
SH_N_HEAD = [   # at (11, 10): the helm from behind, the iron neck guard
    '..OOOOOO..',
    '.OIIIIHHO.',
    'OIIHHHHHhO',
    'OHHHHHHHhO',
    'OHHHHHHHhO',
    'OhhhhhhhhO',
    'OwwwwwwwwO',
    '.OwwwwwwO.',
]
SH_SHIELD_BACK = [   # the shield from behind: the rim, the field's back, the arm straps and the grip
    '.OOOOOOO.',
    'OWWWWWWwO',
    'OWgggggwO',
    'OWgggggwO',
    'OWNNNNNwO',
    'OWgggggwO',
    'OWgggggwO',
    'OWgnnngwO',
    'OWgnnngwO',
    'OWgggggwO',
    'OWNNNNNwO',
    'OWgggggwO',
    'OWgggggwO',
    'OWgggggwO',
    'OwwwwwwwO',
    '.OOOOOOO.',
]
SH_N_GRIP = [    # the right arm from behind (the eye's right): the forearm forward, out of sight
    'LLO.', 'CLLO', 'CCLO', 'DCCO', 'DCCO', 'DCCO', 'cccO', 'OOO.',
]


def shield():
    still = {'walk1': ('hang', 'hang'), 'walk3': ('hang', 'hang')}
    sR = {'hang': (5, 19, SH_S_GRIP)}
    sL = {k: (23, 19, mirror(v)) for k, v in BASE_S_R.items()}
    nL = {k: (5, 19, v) for k, v in BASE_N_L.items()}
    nR = {'hang': (23, 19, SH_N_GRIP, (1, 7))}
    eA = {'hang': SH_E_GRIP, 'rein': SH_E_GRIP}
    return {'name': 'shield', 'pal': pal(H='#8d979c', G='#6e7a82', g='#57626b', w='#40464e'),
            'notes': 'The Republic\'s shield-bearer (the garrison and the marching column): a grey helm (H) with a nose guard (W), an iron '
                     'jaw guard (w), the coat; THE SHIELD — tall, grey-steel (G), steel rim (W), cold iron boss (w) — on the LEFT arm; '
                     'the spear (haft V, head W) upright in the RIGHT hand. Neither arm swings.',
            'S': {'head': (11, 10, SH_S_HEAD), 'torso': (9, 18, S_TORSO), 'armR': sR, 'armL': sL, 'legs': S_LEGS, 'swing': still,
                  'gear': [(5, -1, -23, SH_SPEAR_S, 'hand'), (5, 20, 18, SH_SHIELD, 'body')]},
            'E': {'head': (13, 10, SH_E_HEAD), 'torso': (9, 18, E_TORSO), 'arm': eA, 'far': E_FAR, 'legs': E_LEGS,
                  'swing': {'walk1': ('hang', None), 'walk3': ('hang', None)}, 'ride_arms': ('hang', None),
                  'gear': [(0, 2, 18, SH_SHIELD, 'body'), (5, -1, -23, SH_SPEAR_S, 'hand')]},
            'N': {'head': (11, 10, SH_N_HEAD), 'torso': (9, 18, N_TORSO), 'armR': nR, 'armL': nL, 'legs': N_LEGS, 'swing': still,
                  'gear': [(0, 0, -23, SH_SPEAR_N, 'hand'), (5, 3, 18, SH_SHIELD_BACK, 'body')]}}


CLASSES = [pugugly, longbowmen, berserker, rifle_rider, recon_rider, shield]


# =====================================================================================================================
# THE EYE — the sheet at 8×, the lineup beside the courier at 3× and 1×
# =====================================================================================================================


def font(n=11):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, n)
    return ImageFont.load_default()


def sheet(frames, path, k=8, cols=6, bg='#2a2f37'):
    """frames: [(label, rows, pal)] — draft.py's render, on the tall grid, each frame in its own palette"""
    pad, lab = 10, 14
    gh = max(len(it[1]) for it in frames if it)
    n = len(frames); rn = (n + cols - 1) // cols
    im = Image.new('RGB', (cols * (W * k + pad) + pad, rn * (gh * k + pad + lab) + pad), '#1b1e24')
    d = ImageDraw.Draw(im); f = font()
    for i, item in enumerate(frames):
        if item is None:   # an empty slot: each figure keeps its own three rows
            continue
        name, g, pal = item
        pal = derive(pal)
        ox = pad + (i % cols) * (W * k + pad); oy = pad + (i // cols) * (gh * k + pad + lab)
        d.rectangle([ox, oy, ox + W * k - 1, oy + len(g) * k - 1], fill=bg)
        for y, row in enumerate(g):
            for x, ch in enumerate(row):
                if ch == '.':
                    continue
                d.rectangle([ox + x * k, oy + y * k, ox + x * k + k - 1, oy + y * k + k - 1], fill=pal.get(ch, '#ff00ff'))
        d.line([ox + AX * k, oy + len(g) * k, ox + AX * k, oy + len(g) * k + 3], fill='#9aa2ab')
        d.text((ox, oy + len(g) * k + 1), name, fill='#9aa2ab', font=f)
    im.save(path)


def courier_rows():
    """the courier's rows as the game holds them (src/12e_sprites.js, COURIER:BEGIN..END)"""
    import re
    src = open(os.path.join(ROOT, 'src', '12e_sprites.js')).read()
    blk = src[src.index('/* COURIER:BEGIN'):src.index('/* COURIER:END */')]
    fr, fc, cur = {}, None, None
    for m in re.finditer(r"^\s{6}(E|S|N): \{|^\s{8}(\w+): \[|'([^']{32})'", blk, re.M):
        if m.group(1):
            fc = m.group(1); fr[fc] = {}
        elif m.group(2):
            cur = m.group(2); fr[fc][cur] = []
        elif m.group(3):
            fr[fc][cur].append(m.group(3))
    return fr


def paint(im, rows_, pal, ox, oy, k):
    d = ImageDraw.Draw(im); pal = derive(pal)
    for y, row in enumerate(rows_):
        for x, ch in enumerate(row):
            if ch != '.':
                d.rectangle([ox + x * k, oy + y * k, ox + x * k + k - 1, oy + y * k + k - 1], fill=pal.get(ch, '#ff00ff'))


def lineup(figs, path, k=3, bg='#4f5a28', label=True):
    """figs: [(label, rows, pal)] standing on one ground line: each frame's row under the soles on the line"""
    from draft import PAL_WALKER
    cr = courier_rows()
    items = [('courier S', cr['S']['idle'], PAL_WALKER), ('courier E', cr['E']['idle'], PAL_WALKER)] + figs
    gap = 2 * k
    wid = sum(W * k for _ in items) - sum(6 * k for _ in items) + gap * len(items) + 12 * k
    top = 44 * k
    im = Image.new('RGB', (wid, top + (16 if label else 4)), bg)
    x = 4 * k
    for name, r, pal in items:
        base = len(r) - 1 if len(r) == 40 else 31   # the row under the soles: 39 on the tall grid, 31 on the courier's
        oy = top - 2 * k - (base) * k
        paint(im, r, pal, x - 5 * k, oy, k)
        if label:
            ImageDraw.Draw(im).text((x, top - 2 * k + 2), name[:11], fill='#e2d6b0', font=font(9))
        x += W * k - 6 * k + gap
    im.save(path)


LETTERS = set('OHSeCcTtBb' + 'hIsDLYPp' + 'WwGgFfRrKkMmVvNnXx')


def build():
    """every class, every facing, every frame — and the E ride"""
    out = {}
    for c in CLASSES:
        F = c()
        fr = {fc: {f: compose(F, fc, f) for f in FRAMES} for fc in 'SEN'}
        fr['E']['ride'] = compose(F, 'E', 'ride')
        out[F['name']] = (F, fr)
    return out


def seat_of(rows_):
    """the ride frame's seat: the lowest texel of the rider's hips — the coat's hem over the saddle at the hips' centre"""
    ride = [r for r in rows_]
    # the hips' centre column: the middle of the hem row (the lowest row of the torso that spans the hips)
    for y in range(H - 1, 0, -1):
        xs = [x for x, ch in enumerate(ride[y]) if ch == 'c']
        if len(xs) >= 6:
            return [(xs[0] + xs[-1]) // 2, y]
    raise ValueError('no seat')


def check(figs):
    """the laws, checked: the grid's size, the letters, the breath's mask, the soles in idle, every coloured texel that meets
    open air closed by its outline (the sole on the ground excepted), no stray or doubled outline"""
    bad, n = [], 0
    for name, (F, fr) in figs.items():
        for fc, frames in fr.items():
            for f, r in frames.items():
                n += 1
                tag = f'{name}.{fc}.{f}'
                if len(r) != H or any(len(x) != W for x in r):
                    bad.append(f'{tag}: not {W}x{H}'); continue
                for y, row in enumerate(r):
                    for x, ch in enumerate(row):
                        if ch != '.' and ch not in LETTERS:
                            bad.append(f'{tag}: letter {ch!r} at {x},{y}')
                        if ch in '.O':
                            continue
                        for dx, dy_ in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            xx, yy = x + dx, y + dy_
                            if 0 <= xx < W and 0 <= yy < H and r[yy][xx] == '.' and not (ch == 'b' and dy_ == 1):
                                bad.append(f'{tag}: open edge at {x},{y}')
                for y, row in enumerate(r):
                    for x, ch in enumerate(row):
                        if ch != 'O':
                            continue
                        near = [r[yy][xx] for yy in range(max(0, y - 1), min(H, y + 2)) for xx in range(max(0, x - 1), min(W, x + 2))]
                        if not any(c not in '.O' for c in near):
                            bad.append(f'{tag}: stray outline at {x},{y}')
                if r[H - 1].strip('.') and f in ('idle', 'idle2'):
                    bad.append(f'{tag}: the row under the soles is not empty')
            for fc2 in 'SEN':
                a_, b_ = fr[fc2]['idle'], fr[fc2]['idle2']
                if [[c != '.' for c in x] for x in a_] != [[c != '.' for c in x] for x in b_]:
                    bad.append(f'{name}.{fc2}: idle2 mask differs from idle')
                sole = fr[fc2]['idle'][SOLE]
                if not sole.strip('.'):
                    bad.append(f'{name}.{fc2}: no sole on row {SOLE}')
            tops = {fc2: next(y for y, x in enumerate(fr[fc2]['idle']) if 'I' in x[9:24]) - 1 for fc2 in 'SEN'}
            if len(set(tops.values())) != 1:
                bad.append(f'{name}: crown rows differ across facings {tops}')
    return bad, n


def export(figs):
    out = {'family': 'fk', 'grid': {'w': W, 'h': H, 'ax': AX, 'sole': SOLE}, 'figures': {}}
    for name, (F, fr) in figs.items():
        hand = {fc: {f: META[(name, fc, f)]['hand'] for f in frames} for fc, frames in fr.items()}
        dy = {fc: {f: META[(name, fc, f)]['dy'] for f in frames} for fc, frames in fr.items()}
        out['figures'][name] = {
            'grid': {'w': W, 'h': H, 'ax': AX, 'sole': SOLE},
            'frames': fr,
            'hand': hand,
            'dy': dy,
            'seat': seat_of(fr['E']['ride']),
            'pal': {k: v for k, v in F['pal'].items() if k in used_letters(fr)},
            'notes': F['notes'],
        }
    return out


def used_letters(fr):
    u = set()
    for frames in fr.values():
        for r in frames.values():
            for row in r:
                u |= set(row)
    u.discard('.')
    base = set('OHSeCcTtBb')
    return u | base


def write_json(obj, path):
    """one frame row per line, the rest compact"""
    lines = ['{', f'  "family": "{obj["family"]}",', f'  "grid": {json.dumps(obj["grid"])},', '  "figures": {']
    names = list(obj['figures'])
    for i, name in enumerate(names):
        F = obj['figures'][name]
        lines.append(f'    "{name}": {{')
        lines.append(f'      "grid": {json.dumps(F["grid"])},')
        lines.append('      "frames": {')
        fcs = list(F['frames'])
        for j, fc in enumerate(fcs):
            lines.append(f'        "{fc}": {{')
            fns = list(F['frames'][fc])
            for k, fn in enumerate(fns):
                rows_ = F['frames'][fc][fn]
                lines.append(f'          "{fn}": [')
                for m, r in enumerate(rows_):
                    lines.append(f'            "{r}"' + (',' if m < len(rows_) - 1 else ''))
                lines.append('          ]' + (',' if k < len(fns) - 1 else ''))
            lines.append('        }' + (',' if j < len(fcs) - 1 else ''))
        lines.append('      },')
        lines.append(f'      "hand": {json.dumps(F["hand"])},')
        lines.append(f'      "dy": {json.dumps(F["dy"])},')
        lines.append(f'      "seat": {json.dumps(F["seat"])},')
        lines.append(f'      "pal": {json.dumps(F["pal"])},')
        lines.append(f'      "notes": {json.dumps(F["notes"])}')
        lines.append('    }' + (',' if i < len(names) - 1 else ''))
    lines.append('  }')
    lines.append('}')
    open(path, 'w').write('\n'.join(lines) + '\n')


def main():
    figs = build()
    bad, n = check(figs)
    print(f'checked {n} frames across {len(figs)} figures:')
    print('  grid 32x40 · letters · idle2 mask = idle · soles on row 38 · row 39 empty at rest · outline closed · no stray outline'
          ' · one crown row across facings')
    if bad:
        print('\n'.join('  FAIL ' + b for b in bad[:60]))
        print(f'  {len(bad)} failures'); sys.exit(1)
    print('  all pass')
    obj = export(figs)
    js = os.path.join(HERE, 'fk.json')
    write_json(obj, js)
    json.load(open(js))
    shots = os.path.join(ROOT, 'shots')
    fr = []
    for name, (F, frames) in figs.items():   # a figure a block: its S row, its E row (the ride at its end), its N row
        for fc in 'SEN':
            row = [(f'{name} {fc} {f}', frames[fc][f], F['pal']) for f in FRAMES + (['ride'] if fc == 'E' else [])]
            fr += row + [None] * (7 - len(row))
    sheet(fr, os.path.join(shots, 'fk_sheet.png'), k=8, cols=7)
    lu = []
    for name, (F, frames) in figs.items():
        short = {'longbowmen': 'longbow', 'rifle_rider': 'rifle', 'recon_rider': 'recon'}.get(name, name)
        lu += [(short + ' S', frames['S']['idle'], F['pal']), (short + ' E', frames['E']['idle'], F['pal'])]
    lineup(lu, os.path.join(shots, 'fk_lineup.png'), k=3)
    lineup(lu, SP + 'fk_lineup1.png', k=1, label=False)
    for name, o in obj['figures'].items():
        print(f'  {name:12s} seat {o["seat"]}  hand S idle {o["hand"]["S"]["idle"]}  E idle {o["hand"]["E"]["idle"]}  N idle {o["hand"]["N"]["idle"]}')
    print('wrote', os.path.relpath(js, ROOT), 'shots/fk_sheet.png shots/fk_lineup.png')


def preview(names=None):
    figs = [c() for c in CLASSES if names is None or c.__name__ in names]
    for F in figs:
        fr = [(f'{fc} {f}', compose(F, fc, f), F['pal']) for fc in 'SEN' for f in FRAMES]
        fr.append(('E ride', compose(F, 'E', 'ride'), F['pal']))
        sheet(fr, SP + f'pv_{F["name"]}.png', k=8, cols=7)
    lu = []
    for F in figs:
        lu += [(F['name'][:6] + ' S', compose(F, 'S', 'idle'), F['pal']), (F['name'][:6] + ' E', compose(F, 'E', 'idle'), F['pal'])]
    lineup(lu, SP + 'pv_lineup3.png', k=3)
    lineup(lu, SP + 'pv_lineup1.png', k=1, label=False)




def rig_preview():
    R = rig()
    fr = [(f'{fc} {f}', compose(R, fc, f), PAL_FK) for fc in 'SEN' for f in FRAMES + (['ride'] if fc == 'E' else [])]
    sheet(fr, SP + 'rig_sheet.png', k=8, cols=7)
    lineup([('rig S', compose(R, 'S', 'idle'), PAL_FK), ('rig E', compose(R, 'E', 'idle'), PAL_FK),
            ('rig N', compose(R, 'N', 'idle'), PAL_FK)], SP + 'rig_lineup3.png', k=3)


if __name__ == '__main__':
    os.makedirs(SP, exist_ok=True)
    if '--rig' in sys.argv:
        rig_preview(); print('rig drawn:', SP + 'rig_sheet.png')
    elif '--pv' in sys.argv:
        preview(sys.argv[sys.argv.index('--pv') + 1:] or None); print('preview drawn:', SP)
    elif '--check' in sys.argv:
        bad, n = check(build())
        print(f'checked {n} frames:', 'all pass' if not bad else '\n'.join(bad)); sys.exit(1 if bad else 0)
    else:
        main()
