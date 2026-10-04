#!/usr/bin/env python3
"""THE COURIER SET — authoring bench (v3.50).

Every texel below is placed by hand. A facing is built from hand-drawn parts — the upper body, the near arm in each
swing, the legs in each step — and a frame is those parts placed together (the upper body rises a row on a passing step).
The parts are drawn on the 32×32 grid they land on; nothing is scaled, generated or filtered.

Letters (the worn palette's own, and the shades the game derives from them — see Render.courierPal):
  O outline · H hood, h hood shade, I hood light · S skin, s skin shade, e eye
  C coat, D coat shade, L coat light, c the coat's trim · T the scarf (the trim colour), t its shade · A the pack's canvas
  (a muted tint of the trim), a its shade, u its deep shade and the straps, Y the buckles and the stitched lamp · B boots, b boot shade · P trousers, p trouser shade

Run: python3 tools/courier/courier.py            → shots/courier_sheet.png (8×) + the registry block in src/12e_sprites.js
     python3 tools/courier/courier.py --check    → validate only
"""
import os, re, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from draft import render, derive, PAL_WALKER

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
W = H = 32
LETTERS = set('OHhISseCDLcTtAauYBbPp')


META = {}
ARMS_AT = {}   # (facing, frame) → the texels the arms cover


def mask_of(blk, x0, y0):
    return [(x0 + i, y0 + j) for j, s in enumerate(blk) for i, ch in enumerate(s) if ch not in ' .']


def blank():
    return [['.'] * W for _ in range(H)]


def hand_of(blk, x0, y0):
    """the hand's texel: the first skin texel of an arm block, placed"""
    for j, s in enumerate(blk):
        i = s.find('S')
        if i >= 0:
            return [x0 + i, y0 + j]
    raise ValueError('an arm with no hand')


def put(g, x, y, s):
    """write a run of texels; a space leaves what is under it"""
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


# =====================================================================================================================
# SIDE (facing east; west is the same rows mirrored)
# =====================================================================================================================
E_PACK = [   # at (4, 11): the bedroll's round end on top, the flap and its buckle, a strap, the side pocket
    '   OOOO   ',
    '  OPPPpO  ',
    '  OpPppO  ',
    '  OOOOOOOO',
    ' OYAAAAAAa',
    ' OAAAAAAAa',
    ' OaaaYaaau',
    ' OAAAuAAAa',
    'OOAAAuAAAa',
    'OAaAAuAAAa',
    'OAaAAuAAaa',
    'OaaAAuAAau',
    'OOaaAuAaau',
    ' OaaaauuuO',
    '  OOOOOOO ',
]
E_HEAD = [   # at (12, 9): the hood, the face in profile under its brim
    '  OOOO    ',
    ' OIIIHO   ',
    'OIHHHHHO  ',
    'OHHHHHhSO ',
    'OHHHHhSeSO',
    'OhHHHhSSSO',
    'OhhHHhsSO ',
]
E_TORSO = [  # at (12, 16): the scarf's tail over the strap, the coat, the belt, the hem
    'TOTTTTTTO ',
    'tuOLLLLLLO'[0:0] + ' OuLLLLLO ',
    ' OuCCCCcO ',
    ' ODCCCCcO ',
    ' ODCCCCcO ',
    ' ODCCCCcO ',
    ' OuuuuYuO ',
    ' ODCCCCcO ',
    'ODDCCCCcO ',
    'OcccccccO ',
]
E_TAIL = {   # the scarf's tail: still, and blown back on the walk
    'still': [(11, 17, 'Tt'), (11, 18, 't')],
    'blow1': [(10, 17, 'TTt'), (9, 18, 'tt')],
    'blow2': [(10, 16, 'Tt'), (9, 17, 'TTt')],
}
E_ARM = {    # the near arm, from the shoulder; (x, y) of the block's top-left at rest
    'hang': (16, 18, [
        'OCLc',
        'OCLc',
        'ODCD',
        'ODCD',
        'OccO',
        'OSSO',
        'OsO ',
    ]),
    'back': (13, 18, [   # swung back: the elbow behind the hip, the hand at the pack's foot
        '  OCLO',
        '  OCLO',
        ' ODCO ',
        ' ODCO ',
        'OccO  ',
        'OSSO  ',
        'OsO   ',
    ]),
    'fwd': (16, 18, [    # swung forward: the hand out past the chest
        'OCLc ',
        'OCLO ',
        ' OCLO',
        ' ODCO',
        '  OccO',
        '  OSSO',
        '   OsO',
    ]),
    'grip': (15, 17, [   # braced: the hand up on the strap at the chest
        ' OCLO',
        'OCLCO',
        'ODCO ',
        'OSSO ',
        'OsO  ',
    ]),
}
E_LEGS = {   # rows 25..30 (the first row hides under the hem unless the body has risen); columns from 8
    'stand': [
        '.....OppOPPPO...',
        '.....OppOPPPO...',
        '.....OppOPPPO...',
        '.....OppOPPpO...',
        '....ObbbOBBBBO..',
        '....OOOOObbbbO..',
    ],
    'contactA': [   # the near leg reaching, heel down; the far leg pushing off behind
        '.....OppPPPO....',
        '....OppOOPPPO...',
        '...OppO..OPPPO..',
        '..OppO....OPPpO.',
        '.ObbO.....OBBBBO',
        'ObbbO.....ObbbO.',
    ],
    'passA': [      # the near leg under the body; the far leg swinging through, its foot lifted
        '.....OppPPPO....',
        '.....OppOPPPO...',
        '....OppO.OPPO...',
        '...ObbO..OPPO...',
        '...ObO..OBBBBO..',
        '.........ObbbO..',
    ],
    'contactB': [   # the far leg reaching; the near leg pushing off behind
        '.....OPPPppO....',
        '....OPPPOOppO...',
        '...OPPPO..OppO..',
        '..OPPpO....OppO.',
        '.OBBBO.....ObbbO',
        'ObbbO......ObbO.',
    ],
    'passB': [      # the far leg under the body; the near leg swinging through
        '.....OPPPppO....',
        '.....OPPPOppO...',
        '....OPPpO.OpO...',
        '...OBBBO..OpO...',
        '...ObbO..ObbbO..',
        '.........OOOO...',
    ],
    'brace': [      # knees bent, feet apart, the weight low
        '....OppOOPPPO...',
        '...OppO..OPPPO..',
        '...OppO...OPPO..',
        '..ObbbO..OBBBBO.',
        '..OOOOO..ObbbbO.',
        '................',
    ],
    'dangle': [     # hanging from the wire: the legs together, the boots' toes down
        '.....OppPPPO....',
        '.....OppPPPO....',
        '.....OppPPPO....',
        '.....OppPPpO....',
        '.....ObbBBBO....',
        '......ObBBBO....',
    ],
    'ride': [       # astride: the thigh forward along the back, the shin down the flank, the boot in the iron
        '.....OPPPPPO....',
        '.......OOPPPO...',
        '.........OPPO...',
        '.........OPPO...',
        '........OBBBBO..',
        '........ObbbbO..',
    ],
}


def east(frame):
    """compose a side-view frame"""
    if frame in LOW_DY:
        return east_low(frame)
    walk = {'walk1': ('contactA', 0, 'back', 'blow1', 'fwd'), 'walk2': ('passA', -1, 'hang', 'blow2', None),
            'walk3': ('contactB', 0, 'fwd', 'blow1', None), 'walk4': ('passB', -1, 'hang', 'blow2', None)}
    if frame in walk:
        legs, dy, arm, tail, far = walk[frame]
    elif frame == 'brace':
        legs, dy, arm, tail, far = 'brace', 2, 'grip', 'still', None
    elif frame == 'ride':
        legs, dy, arm, tail, far = 'ride', 0, 'hang', 'still', None

    else:
        legs, dy, arm, tail, far = 'stand', 0, 'hang', 'still', None
    g = blank()
    stamp(g, 8, 25 if legs != 'brace' else 26, E_LEGS[legs])
    # the far hand swung forward shows past the chest, behind the body
    stamp(g, 4, 11 + dy, E_PACK)
    stamp(g, 12, 9 + dy, E_HEAD)
    stamp(g, 12, 16 + dy, E_TORSO)
    for x, y, s in E_TAIL[tail]:
        put(g, x, y + dy, s)
    ax, ay, blk = E_ARM[arm]
    stamp(g, ax, ay + dy, blk)
    META[('E', frame)] = {'dy': dy, 'hand': hand_of(blk, ax, ay + dy)}
    ARMS_AT[('E', frame)] = mask_of(blk, ax, ay + dy)
    out = rows(g)
    if frame == 'idle2':
        out = breath(out)
    return out


def breath(r):
    """the breath: the chest's light rises a row (shading migration reads as volume); the silhouette holds to the texel"""
    g = [list(s) for s in r]
    for x in range(W):
        for y in range(1, H - 1):
            if r[y][x] == 'L' and r[y + 1][x] == 'C':
                g[y + 1][x] = 'L'
                break
    return [''.join(x) for x in g]


# =====================================================================================================================
# FRONT (facing south, toward the eye)
# =====================================================================================================================
S_BACK = [   # at (8, 11): what shows of the pack behind: the bedroll's two rounded ends, strapped, and the pack's top corners
    '.OO..........OO.',
    'OPpO........OpPO',
    'Opu..........upO',
    '.OO..........OO.',
    '.OA..........aO.',
    '.OA..........aO.',
]
S_HEAD = [   # at (11, 9): the hood round the face; two eyes; the hood's shade over the brow
    ' OOOOOOOO ',
    'OIIIIIIHHO',
    'OIhhhhhhHO',
    'OHhSSSShHO',
    'OHSeSSeSHO',
    'OhSSSSSShO',
    'OhhsSSshhO',
]
S_TORSO = [  # at (10, 16): the scarf wound twice, its ends down the chest; the straps and the chest strap; belt; hem
    ' OTTTTTTTTO ',
    'OLLuTTTTuLLO',
    'OLCuCtTCuCLO',
    'OCCuuuYuuuCO',
    'OCDuCtTCuDCO'.replace('tT', 'Cc'),
    'OCDCCCcCCCDO',
    'OuuuuYYuuuuO',
    'OCDCCCcCCCDO',
    'ODDCCCcCCDDO',
    'OccccOOccccO',
]
S_ARM = {    # an arm at the side, from the shoulder: (dx inward, rows) — the left drawn, the right is its mirror
    'hang': (0, ['OLC', 'OLC', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO']),
    'fwd':  (0, ['OLC', 'OLC', 'OCD', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO']),   # swung toward the eye: the hand lower
    'back': (1, ['OLC', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO']),               # swung away: shorter, tucked to the hip
    'grip': (2, ['OLC', 'OCD', 'OSs', 'OO ']),                                     # braced: the hand up on the strap
    'up':   (0, [' OO', 'OSs', 'Oss', 'Occ', 'OLC', 'OLC', 'OLC', 'OCD', 'OCD', 'OCD', 'OCD', 'OLC']),   # on the wire: up past the hood to the trolley (placed from row 6)
}
S_LEGS = {   # rows 25..31, columns from 8
    'dangle': [     # hanging from the wire: the legs together, the toes down
        '...OPPPOOPPPO...',
        '...OPPpOOpPPO...',
        '...OPPpOOpPPO...',
        '...OBBBOOBBBO...',
        '...OBBBOOBBBO...',
        '....ObbOObbO....',
        '................',
    ],
    'stand': [
        '...OPPPOOPPPO...',
        '...OPPpOOpPPO...',
        '...OPPpOOpPPO...',
        '...OBBBOOBBBO...',
        '..OBBBBOOBBBBO..',
        '..ObbbbOObbbbO..',
        '................',
    ],
    'contactA': [   # the left foot comes toward the eye (a row lower); the right pushes off behind (a row higher)
        '...OPPPOOPPPO...',
        '...OPPpOOpPPO...',
        '...OPPpOOBBBO...',
        '...OPPpOOBBBBO..',
        '...OBBBOObbbbO..',
        '..OBBBBO.OOOO...',
        '..ObbbbO........',
    ],
    'passA': [      # the left foot swinging through, lifted a row
        '...OPPPOOPPPO...',
        '...OPPpOOpPPO...',
        '...OBBBOOpPPO...',
        '...OBBBOOBBBO...',
        '...ObbbOOBBBO...',
        '....OOO.ObbbO...',
        '................',
    ],
    'passB': [      # the right foot swinging through
        '...OPPPOOPPPO...',
        '...OPPpOOpPPO...',
        '...OPPpOOBBBO...',
        '...OBBBOOBBBO...',
        '...OBBBOObbbO...',
        '...ObbbO.OOO....',
        '................',
    ],
    'contactB': [
        '...OPPPOOPPPO...',
        '...OPPpOOpPPO...',
        '...OBBBOOpPPO...',
        '..OBBBBOOpPPO...',
        '..ObbbbOOBBBO...',
        '...OOOO.OBBBBO..',
        '........ObbbbO..',
    ],
    'brace': [      # feet planted wide, knees out
        '..OPPPO..OPPPO..',
        '.OPPpO....OpPPO.',
        '.OBBBO....OBBBO.',
        'OBBBBO....OBBBBO',
        'ObbbbO....ObbbbO',
        '................',
        '................',
    ],
}


def arm_rows(pose, side):
    dx, blk = S_ARM[pose]
    if side == 'R':
        blk = [s[::-1] for s in blk]
    return dx, blk


def south(frame):
    if frame in LOW_DY:
        return south_low(frame)
    # v3.51: the passing frames in the order the feet take them — after the right foot reaches (contact A) the LEFT swings
    # through (pass B lifts the eye's right foot, the courier's left); v3.50 lifted the planted foot
    walk = {'walk1': ('contactA', 0, 'back', 'fwd'), 'walk2': ('passB', -1, 'hang', 'hang'),
            'walk3': ('contactB', 0, 'fwd', 'back'), 'walk4': ('passA', -1, 'hang', 'hang')}
    if frame in walk:
        legs, dy, armL, armR = walk[frame]
    elif frame == 'brace':
        legs, dy, armL, armR = 'brace', 2, 'grip', 'grip'
    elif frame == 'zip':
        legs, dy, armL, armR = 'dangle', 0, 'up', 'up'
    else:
        legs, dy, armL, armR = 'stand', 0, 'hang', 'hang'
    g = blank()
    stamp(g, 8, 11 + dy, S_BACK)
    stamp(g, 8, 25 if legs != 'brace' else 26, S_LEGS[legs])
    stamp(g, 11, 9 + dy, S_HEAD)
    stamp(g, 10, 16 + dy, S_TORSO)
    ay = 6 if armL == 'up' else 18 + dy
    dx, blk = arm_rows(armL, 'L'); stamp(g, 7 + dx, ay, blk)
    handR = hand_of(blk, 7 + dx, ay)   # the courier's right hand: on the eye's left
    armsm = mask_of(blk, 7 + dx, ay)
    dx, blk = arm_rows(armR, 'R'); stamp(g, 22 - dx, ay, blk)
    armsm += mask_of(blk, 22 - dx, ay)
    META[('S', frame)] = {'dy': dy, 'hand': handR}
    ARMS_AT[('S', frame)] = armsm
    out = rows(g)
    return breath(out) if frame == 'idle2' else out


# =====================================================================================================================
# BACK (facing north, away from the eye): the pack is the figure
# =====================================================================================================================
N_HEAD = [   # at (11, 9): the hood's crown over the bedroll, its seam down the back
    '  OOOOOO  ',
    ' OIIIIHHO ',
    'OHHHHhHHhO',
]
N_PACK = [   # at (7, 12): the bedroll lashed across, the flap and its edge, the side straps and their buckles, the Order's lamp stitched on
    '.OOOOOOOOOOOOOOOO.',
    'OPPPPuPPPPPPuPPPpO',
    'OpppPupppppPupppuO',
    '.OOOOOOOOOOOOOOOO.',
    '..OYAAAAAAAAAAaO..',
    '..OaaaaauuaaaauO..',
    '..OAuAAAuuAAAuaO..',
    '..OAuAAuYYuAAuaO..',
    '..OAYAuYYYYuAYaO..',
    '..OAuAAuYYuAAuaO..',
    '..OauAAAuuAAAuaO..',
    '..OOaaaaaaaaaaOO..',
    '...OOOOOOOOOOOO...',
]
N_ARM = {    # the arms past the pack's sides, from the shoulder (the left drawn; the right is its mirror)
    'hang': ['OLL', 'OLC', 'OCD', 'OCD', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO'],
    'fwd':  ['OLL', 'OLC', 'OCD', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO'],                # swung away: shorter
    'back': ['OLL', 'OLC', 'OCD', 'OCD', 'OCD', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO'],  # swung toward the eye
    'grip': ['OLL', 'OLC', 'OCD', 'OCD', 'OSs', ' OO'],
}
N_LEGS = {   # rows 25..31, columns from 8: the coat's skirt below the pack, the legs, the heels
    'stand': [
        '..OCCCCccCCCCO..',
        '...OPPPOOPPPO...',
        '...OPpPOOPpPO...',
        '...OBBBOOBBBO...',
        '...OBBBOOBBBO...',
        '...ObbbOObbbO...',
        '................',
    ],
    'contactA': [   # the left foot reaches away (a row higher); the right heel comes back toward the eye
        '..OCCCCccCCCCO..',
        '...OPPPOOPPPO...',
        '...OPpPOOPpPO...',
        '...OBBBOOPpPO...',
        '...ObbbOOBBBO...',
        '....OOO.OBBBO...',
        '........ObbbO...',
    ],
    'passA': [      # the left heel lifting as it swings through
        '..OCCCCccCCCCO..',
        '...OPPPOOPPPO...',
        '...OPpPOOPpPO...',
        '...OBBBOOBBBO...',
        '...ObbbOOBBBO...',
        '....OOO.ObbbO...',
        '................',
    ],
    'passB': [      # the right heel
        '..OCCCCccCCCCO..',
        '...OPPPOOPPPO...',
        '...OPpPOOPpPO...',
        '...OBBBOOBBBO...',
        '...OBBBOObbbO...',
        '...ObbbO.OOO....',
        '................',
    ],
    'contactB': [
        '..OCCCCccCCCCO..',
        '...OPPPOOPPPO...',
        '...OPpPOOPpPO...',
        '...OPpPOOBBBO...',
        '...OBBBOObbbO...',
        '...OBBBO.OOO....',
        '...ObbbO........',
    ],
    'brace': [
        '..OCCCCccCCCCO..',
        '.OPPPO....OPPPO.',
        '.OBBBO....OBBBO.',
        'OBBBBO....OBBBBO',
        'ObbbbO....ObbbbO',
        '................',
        '................',
    ],
}


def north(frame):
    # v3.51: the right foot reaches with the LEFT arm (contact B puts the courier's right foot away from the eye); v3.50
    # swung the arm and the foot of one side together
    walk = {'walk1': ('contactB', 0, 'fwd', 'back'), 'walk2': ('passA', -1, 'hang', 'hang'),
            'walk3': ('contactA', 0, 'back', 'fwd'), 'walk4': ('passB', -1, 'hang', 'hang')}
    if frame in walk:
        legs, dy, armL, armR = walk[frame]
    elif frame == 'brace':
        legs, dy, armL, armR = 'brace', 2, 'grip', 'grip'
    else:
        legs, dy, armL, armR = 'stand', 0, 'hang', 'hang'
    g = blank()
    stamp(g, 8, 25 + (0 if legs != 'brace' else 1), N_LEGS[legs])
    stamp(g, 11, 9 + dy, N_HEAD)
    # the torso's shoulders behind the pack, then the arms, then the pack over all
    blkL = N_ARM[armL]; blkR = [s[::-1] for s in N_ARM[armR]]
    stamp(g, 6, 16 + dy, blkL); stamp(g, 23, 16 + dy, blkR)
    META[('N', frame)] = {'dy': dy, 'hand': hand_of(blkR, 23, 16 + dy)}   # the courier's right hand: on the eye's right
    ARMS_AT[('N', frame)] = mask_of(blkL, 6, 16 + dy) + mask_of(blkR, 23, 16 + dy)
    stamp(g, 7, 12 + dy, N_PACK)
    out = rows(g)
    return breath(out) if frame == 'idle2' else out

# =====================================================================================================================
# v3.51 — LOW POSES (E and S): the courier SITS (on the ground, knees up, the pack set down behind, the hands on the knees —
# the stranded walker a rescue finds) and KNEELS (on the knees, the hands bound behind — the captive in the ride, on his
# knees before the guns). Composed from the courier's own parts — the pack, the head, the torso, the scarf's tail, the back
# of the pack from the front — with only the legs and the arms drawn new; the upper body sinks by the frame's dy.
# =====================================================================================================================
LOW_DY = {'sit': 6, 'kneel': 3}     # the upper body's drop; sitting, the pack is set down on the ground (+5) behind
LOW_PACK = {'sit': 5, 'kneel': 1}   # sitting, the pack set down on the ground; kneeling, it rides up its straps as the hips drop
LOW_TORSO = {   # the torso's rows shown (the courier's own E_TORSO / S_TORSO rows): sitting, the coat below the belt folds
    'sit': [0, 1, 2, 3, 4, 5, 6, 8],                # under the seat to its flared skirt; kneeling, the skirt row folds on the
    'kneel': [0, 1, 2, 3, 4, 5, 6, 7, 9],           # thighs and the hem lies a row higher
}
E_LOW_LEGS = {   # (x, y, rows)
    'sit': (19, 23, [       # the near knee up before the chest (the thigh under the coat's lap), the shin straight down to
        '..OOO...',         # the boot flat on the ground, its toe forward
        '.OPPPO..',
        '..OPPpO.',
        '...OPpO.',
        '...OPpO.',
        '...OPpO.',
        '..OBBBBO',
        '..ObbbbbO',
    ]),
    'kneel': (9, 26, [      # under the hem the knee on the ground, pushed a texel past the coat; the shin laid back along the
        '...ObO........',   # ground to the boot, its toes tucked under and its heel up behind
        '..ObBBO.......',
        '..OBBBOPPPPPPPO',
        '.OBBBPPPPpPPPPO',
        '.OOOOOOOOOOOOOOO',
    ]),
}
E_LOW_ARM = {
    'sit': (16, 24, [       # from the shoulder, forward: the hand at the knee
        'OCLc  ',
        ' OCLSS',
        '  OOsO',
    ]),
    'kneel': (13, 21, [     # drawn back: the elbow out behind over the pack's strap, the hands bound at the small of the back
        '   OCLc',
        '  OCLCO',
        ' OCDCO ',
        'ODCDO  ',
        'OccO   ',
        'OSSO   ',
    ]),
}
S_LOW_LEGS = {   # (x, y, rows)
    'sit': (9, 25, [        # the knees up before the chest, the shins down to the boots, the toes toward the eye
        '..OPPPOOPPPO..',
        '..OPPpOOpPPO..',
        '..OPpPOOPpPO..',
        '..OPPpOOpPPO..',
        '.OBBBBOOBBBBO.',
        '.ObbbbOObbbbO.',
    ]),
    'kneel': (8, 28, [      # the knees on the ground under the hem; the shins run away from the eye, out of sight
        '...OPPPOOPPPO...',
        '...OPpPOOPpPO...',
    ]),
}
S_LOW_ARM = {    # (dx inward, rows) — the left drawn, the right is its mirror
    'sit': (1, ['OLC', 'OCDO', 'OCDSO', ' OSsO', '  OO']),   # down and in: the hand on the knee's cap
    'kneel': (1, ['OLC', 'OCD', 'OCD', 'OCD', 'Occ', ' OO']),   # drawn back: the hands out of sight behind the back
}


def east_low(frame):
    dy = LOW_DY[frame]
    g = blank()
    stamp(g, 4, 11 + LOW_PACK[frame], E_PACK)     # the pack: set down on the ground (sit) or on the back, sunk with it (kneel)
    stamp(g, 12, 9 + dy, E_HEAD)
    stamp(g, 12, 16 + dy, [E_TORSO[i] for i in LOW_TORSO[frame]])
    for x, y, s in E_TAIL['still']:
        put(g, x, y + dy, s)
    lx, ly, legs = E_LOW_LEGS[frame]
    stamp(g, lx, ly, legs)
    ax, ay, blk = E_LOW_ARM[frame]
    stamp(g, ax, ay, blk)
    META[('E', frame)] = {'dy': dy, 'hand': hand_of(blk, ax, ay)}
    ARMS_AT[('E', frame)] = mask_of(blk, ax, ay)
    return rows(g)


def south_low(frame):
    dy = LOW_DY[frame]
    g = blank()
    stamp(g, 8, 11 + LOW_PACK[frame], S_BACK)
    stamp(g, 11, 9 + dy, S_HEAD)
    stamp(g, 10, 16 + dy, [S_TORSO[i] for i in LOW_TORSO[frame]])
    lx, ly, legs = S_LOW_LEGS[frame]
    stamp(g, lx, ly, legs)
    dx, blk = S_LOW_ARM[frame]
    ay = 18 + dy
    stamp(g, 7 + dx, ay, blk)
    armsm = mask_of(blk, 7 + dx, ay)
    handR = hand_of(blk, 7 + dx, ay) if frame == 'sit' else [7 + dx + 1, ay + len(blk) - 2]   # bound: the hands behind the hip
    w = max(len(s) for s in blk)
    blkR = [s.ljust(w)[::-1] for s in blk]        # the right arm: the left mirrored about the centre line
    stamp(g, 25 - dx - w, ay, blkR)
    armsm += mask_of(blkR, 25 - dx - w, ay)
    META[('S', frame)] = {'dy': dy, 'hand': handR}
    ARMS_AT[('S', frame)] = armsm
    return rows(g)


FRAMES = ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4', 'brace']


def close_outline(r):
    """the outline law, closed by hand's rule: a coloured texel that meets the open air gets its outline texel there — except
    a boot's sole on the ground line, which is the dark edge itself"""
    g = [list(s) for s in r]
    add = []
    for y in range(H):
        for x in range(W):
            ch = r[y][x]
            if ch in '.O':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x + dx, y + dy
                if not (0 <= xx < W and 0 <= yy < H):
                    continue
                if r[yy][xx] != '.':
                    continue
                if ch in 'b' and dy == 1:
                    continue   # the sole
                add.append((xx, yy))
    for (x, y) in add:
        g[y][x] = 'O'
    return [''.join(s) for s in g]


def build():
    out = {'E': {f: east(f) for f in FRAMES + ['ride', 'sit', 'kneel']}, 'S': {f: south(f) for f in FRAMES + ['zip', 'sit', 'kneel']},
           'N': {f: north(f) for f in FRAMES}}
    return {fc: {n: close_outline(r) for n, r in fr.items()} for fc, fr in out.items()}


def check(sets):
    bad = []
    for fc, frames in sets.items():
        for name, r in frames.items():
            if len(r) != H or any(len(s) != W for s in r):
                bad.append(f'{fc}.{name}: not {W}×{H}')
            for y, s in enumerate(r):
                for x, ch in enumerate(s):
                    if ch != '.' and ch not in LETTERS:
                        bad.append(f'{fc}.{name}: letter {ch!r} at {x},{y}')
    return bad


if __name__ == '__main__':
    sets = build()
    bad = check(sets)
    if bad:
        print('\n'.join(bad)); sys.exit(1)
    SP = '/tmp/claude-0/-home-claude/6b4ed241-f59c-5646-95c9-b16861a92127/scratchpad/'
    for fc in sets:
        fr = [(f'{fc} {n}', r) for n, r in sets[fc].items()]
        render(fr, SP + f'{fc.lower()}_frames.png', k=8, cols=4)
    allfr = [(f'{fc} {n}', r) for fc in 'SEN' for n, r in sets[fc].items()]
    render(allfr, SP + 'all_small.png', k=3, cols=8)
    print('ok', {k: len(v) for k, v in sets.items()})
