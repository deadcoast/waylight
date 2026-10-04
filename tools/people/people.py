#!/usr/bin/env python3
"""THE PEOPLE — authoring bench (v3.51): the camps' own and the town's own, by hand on the courier's grid.

Every texel below is placed by hand, the courier's way (tools/courier/courier.py): hand-drawn part blocks — a head, a
torso (front, side and BACK: these people carry no pack, so the back of a coat is drawn), an arm in each swing, the legs
in each step — composed per frame with stamp/put, then close_outline. The courier's legs and arms are reused as drawn;
heads, torsos and gear are drawn new per figure and facing. Gear held in a hand is placed from that hand's texel, so it
goes where the hand goes from frame to frame.

Hands (STYLE.md): the RIGHT hand is E's near arm, S's arm on the eye's left, N's arm on the eye's right.

Run: python3 tools/people/people.py          → tools/people/people.json, shots/people_sheet.png, shots/people_lineup.png
     python3 tools/people/people.py --check  → validate only
     python3 tools/people/people.py --draft knife ram   → scratch renders of those figures only
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'courier'))
import courier as CR
from courier import E_LEGS, E_ARM, S_LEGS, S_ARM, N_LEGS, close_outline, stamp, put, blank, rows
from draft import derive, render
from PIL import Image, ImageDraw

W = H = 32
SOLE = 30
BASE = 'OHSeCcTtBb'
DERIVED = 'hIsDLYPp'
GEAR = 'WwGgFfRrKkMmVvNnXx'
LETTERS = set(BASE + DERIVED + GEAR)
FACINGS = ('E', 'S', 'N')
FRAMES = ('idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4')
SP = '/tmp/claude-0/-home-claude/6b4ed241-f59c-5646-95c9-b16861a92127/scratchpad/'

# =====================================================================================================================
# THE STEP — which legs, the rise, and each arm's swing, per facing and frame. The law (STYLE.md): walk1 the right leg
# reaches, the right arm swings back; walk2 the right leg under the body, the left swinging through lifted; walk3/walk4
# the mirror. The courier's leg blocks are picked by which foot they put where: in S the right foot is on the eye's LEFT
# (S_LEGS contactA puts it forward, passB lifts the other); in N on the eye's RIGHT (N_LEGS contactB puts it forward,
# passA lifts the left). E is the courier's order.
# =====================================================================================================================
STEP = {   # frame → (legs, dy, right arm's swing, left arm's swing); a swing is 'hang', 'back' or 'fwd' in the body's terms
    'E': {'idle': ('stand', 0, 'hang', 'hang'), 'walk1': ('contactA', 0, 'back', 'fwd'), 'walk2': ('passA', -1, 'hang', 'hang'),
          'walk3': ('contactB', 0, 'fwd', 'back'), 'walk4': ('passB', -1, 'hang', 'hang')},
    'S': {'idle': ('stand', 0, 'hang', 'hang'), 'walk1': ('contactA', 0, 'back', 'fwd'), 'walk2': ('passB', -1, 'hang', 'hang'),
          'walk3': ('contactB', 0, 'fwd', 'back'), 'walk4': ('passA', -1, 'hang', 'hang')},
    'N': {'idle': ('stand', 0, 'hang', 'hang'), 'walk1': ('contactB', 0, 'back', 'fwd'), 'walk2': ('passA', -1, 'hang', 'hang'),
          'walk3': ('contactA', 0, 'fwd', 'back'), 'walk4': ('passB', -1, 'hang', 'hang')},
}


def step(fc, frame):
    return STEP[fc].get(frame, STEP[fc]['idle'])


def swap(blk, table):
    """the same block with some letters traded (a far arm in shade, a sleeve of another cloth)"""
    return [''.join(table.get(ch, ch) for ch in s) for s in blk]


def mirror(blk):
    return [s[::-1] for s in blk]


def sym(half):
    """a row symmetric about the figure's centre (between columns 15 and 16)"""
    return half + half[::-1]


def first(blk, ch='S'):
    for j, s in enumerate(blk):
        i = s.find(ch)
        if i >= 0:
            return i, j
    raise ValueError('no ' + ch)


def at(g, x, y, cells):
    """place (dx, dy, letter) cells from an anchor texel"""
    for dx, dy, ch in cells:
        put(g, x + dx, y + dy, ch)


def vline(g, x, y0, y1, ch):
    for y in range(y0, y1 + 1):
        put(g, x, y, ch)


def shift(a, dx=0, dy=0):
    return None if a is None else (a[0] + dx, a[1] + dy, a[2])


# =====================================================================================================================
# THE PLAIN ADULT — the shared body every figure is dressed over: no pack, no bedroll, 22 texels crown to sole
# =====================================================================================================================
# ---- SIDE (east) ----
HOOD_E = [   # at (12, 9): a hood in profile (the courier's cut)
    '  OOOO    ',
    ' OIIIHO   ',
    'OIHHHHHO  ',
    'OHHHHHhSO ',
    'OHHHHhSeSO',
    'OhHHHhSSSO',
    'OhhHHhsSO ',
]
TORSO_E = [  # at (12, 16): the hood's cowl at the neck, the coat, the belt, the skirt; the back is the coat's own edge
    ' OhhhhhhO ',
    ' OLLLLLLO ',
    ' ODCCCCcO ',
    ' ODCCCCcO ',
    ' ODCCCCcO ',
    ' ODCCCCcO ',
    ' OTTTTYTO ',
    ' ODCCCCcO ',
    'ODDCCCCcO ',
    'OcccccccO ',
]
FAR = {'C': 'D', 'L': 'C', 'c': 'D'}
FAR_E = {    # the far (left) arm, drawn under the torso: only what swings past the body shows
    'hang': None,
    'fwd': (17, 18, swap(E_ARM['fwd'][2], FAR)),    # the far hand past the chest
    'back': (11, 18, swap(E_ARM['back'][2], FAR)),  # the far hand behind the back
}
# ---- FRONT (south) ----
HOOD_S = [   # at (11, 9)
    ' OOOOOOOO ',
    'OIIIIIIHHO',
    'OIhhhhhhHO',
    'OHhSSSShHO',
    'OHSeSSeSHO',
    'OhSSSSSShO',
    'OhhsSSshhO',
]
TORSO_S = [  # at (10, 16)
    ' OhhhhhhhhO ',
    'OLLLLLLLLLLO',
    'OLCCCCcCCCLO',
    'OCCCCCcCCCCO',
    'OCDCCCcCCCDO',
    'OCDCCCcCCCDO',
    'OTTTTYYTTTTO',
    'OCDCCCcCCCDO',
    'ODDCCCcCCDDO',
    'OccccOOccccO',
]
# ---- BACK (north) ----
HOOD_N = [   # at (11, 9): the back of the hood, its seam
    ' OOOOOOOO ',
    'OIIIIIIIIO',
    'OHIIIIIIHO',
    'OHHHHhHHHO',
    'OHHHHhHHHO',
    'OhHHHhHHhO',
    'OhhhhhhhhO',
]
TORSO_N = [  # at (10, 16): the back of the coat — the yoke, the seam, the belt, the vent
    ' OhhhhhhhhO ',
    'OLLLLLLLLLLO',
    'OCCCCCcCCCCO',
    'ODCCCCcCCCDO',
    'ODCCCCcCCCDO',
    'ODCCCCcCCCDO',
    'OTTTTTTTTTTO',
    'ODCCCCcCCCDO',
    'ODDCCCcCCDDO',
    'OccccOOccccO',
]
# a bare neck or a cap: the coat's collar where a hood's cowl would be
COLLAR = {'E': [' OccccccO '] + TORSO_E[1:], 'S': [' OccccccccO '] + TORSO_S[1:], 'N': [' OccccccccO '] + TORSO_N[1:]}
N_LEGS_P = {k: ['...OPPPOOPPPO...'] + v[1:] for k, v in N_LEGS.items()}   # the trousers under the hem (no skirt below a pack)

# the arms of the front and the back are the courier's S arms; seen from behind, a swing away is the short arm and a swing
# toward the eye the long one
S_SWING = {'hang': 'hang', 'back': 'back', 'fwd': 'fwd'}
N_SWING = {'hang': 'hang', 'back': 'fwd', 'fwd': 'back'}


def arm_front(swing, side, view):
    """(x, block) of an arm in S or N: side 'L' is the eye's left"""
    dx, blk = S_ARM[(S_SWING if view == 'S' else N_SWING)[swing]]
    if side == 'L':
        return 7 + dx, blk
    return 22 - dx, mirror(blk)


# the near arm holding an upright haft ahead of the chest (E): the fist at (21, 21) at rest, a row lower swung back and a
# row higher swung ahead; the haft stands in column 22, through the fist
E_HOLD = {
    'hang': (16, 18, [
        'OCLc    ',
        'OCLc    ',
        'ODCDOOOO',
        'ODCLcSSO',
        'ODDDcsSO',
        'OOOOOOOO',
    ]),
    'back': (16, 18, [
        'OCLc    ',
        'OCLc    ',
        'ODCD    ',
        'ODCDOOOO',
        'ODCLcSSO',
        'ODDDcsSO',
        'OOOOOOOO',
    ]),
    'fwd': (16, 18, [
        'OCLc    ',
        'OCLcOOOO',
        'ODCLcSSO',
        'ODDDcsSO',
        'OOOOOOOO',
    ]),
}
# the front and back arm bent to hold a haft up against the shoulder (the ram's beam): the fist at the chest
GRIP_S = {'hang': ['OLC', 'OLC', 'OCD', 'OSs', ' OO'], 'back': ['OLC', 'OLC', 'OSs', ' OO'],
          'fwd': ['OLC', 'OLC', 'OCD', 'OCD', 'OSs', ' OO']}


REST_HAND = {'E': 21, 'S': 24, 'N': 24}   # the holding fist's row at rest (E_HOLD, the hanging arm)


def haft_rows(c, top, bot):
    """a haft's rows at rest, carried by the fist's travel this frame (its swing and the body's rise)"""
    d = c['hr'][1] - REST_HAND[c['fc']]
    return top + d, bot + d


def breathe(r, pairs, y0=16, y1=24):
    """the breath: per column the first lit texel over its base (in the chest's rows) spreads a row down — the chest's
    light rises; the silhouette holds to the texel"""
    g = [list(s) for s in r]
    for x in range(W):
        for y in range(y0, y1):
            if (r[y][x], r[y + 1][x]) in pairs:
                g[y + 1][x] = r[y][x]
                break
    return [''.join(s) for s in g]


class Fig:
    """a figure: parts per facing and the hooks that dress it; the default is the plain adult"""
    name = 'plain'
    notes = ''
    extra = ()                 # extra (facing, frame) pairs beyond the six

    def head(self, fc):
        return {'E': (12, 9, HOOD_E), 'S': (11, 9, HOOD_S), 'N': (11, 9, HOOD_N)}[fc]

    def torso(self, fc, c):
        return {'E': (12, 16, TORSO_E), 'S': (10, 16, TORSO_S), 'N': (10, 16, TORSO_N)}[fc]

    def legs(self, fc, legs, c):
        return 8, 25, {'E': E_LEGS, 'S': S_LEGS, 'N': N_LEGS_P}[fc][legs]

    def arm_r(self, fc, swing, dy):
        if fc == 'E':
            x, y, blk = E_ARM[swing]
            return x, y + dy, blk
        x, blk = arm_front(swing, 'L' if fc == 'S' else 'R', fc)
        return x, 18 + dy, blk

    def arm_l(self, fc, swing, dy):
        if fc == 'E':
            return shift(FAR_E[swing], 0, dy)
        x, blk = arm_front(swing, 'R' if fc == 'S' else 'L', fc)
        return x, 18 + dy, blk

    # the layers: each hook draws into g; c carries the frame's facts and both hands
    def behind(self, g, c): pass        # under everything (far gear, a cloak's back)
    def over_torso(self, g, c): pass    # on the body, under the arms
    def under_arm(self, g, c): pass     # gear the hand grips, under the fist
    def front(self, g, c): pass         # over everything

    def breath(self, r, fc):
        return breathe(r, {('L', 'C')})


def prune(r):
    """drop outline texels that close nothing (the edge of a part the body hides): no doubled outline is left behind"""
    g = [list(s) for s in r]
    for y in range(H):
        for x in range(W):
            if r[y][x] == 'O' and not any(0 <= x + i < W and 0 <= y + j < H and r[y + j][x + i] not in '.O'
                                          for i in (-1, 0, 1) for j in (-1, 0, 1)):
                g[y][x] = '.'
    return [''.join(s) for s in g]


def compose(fig, fc, frame):
    legs, dy, rsw, lsw = step(fc, frame)
    fig.cur = frame
    g = blank()
    ar = fig.arm_r(fc, rsw, dy)
    al = fig.arm_l(fc, lsw, dy)
    hand_r = [ar[0] + first(ar[2])[0], ar[1] + first(ar[2])[1]] if ar else None
    hand_l = [al[0] + first(al[2])[0], al[1] + first(al[2])[1]] if al else None
    c = dict(fc=fc, frame=frame, dy=dy, legs=legs, rsw=rsw, lsw=lsw, hr=hand_r, hl=hand_l, ar=ar, al=al)
    fig.behind(g, c)
    if fc == 'E' and al:
        stamp(g, *al)                   # the far arm, under the body
    lx, ly, lb = fig.legs(fc, legs, c)
    stamp(g, lx, ly, lb)
    tx, ty, tb = fig.torso(fc, c)
    stamp(g, tx, ty + dy, tb)
    hx, hy, hb = fig.head(fc)
    stamp(g, hx, hy + dy, hb)
    fig.over_torso(g, c)
    fig.under_arm(g, c)                 # what a hand grips: the fist is drawn over it
    if fc != 'E' and al:
        stamp(g, *al)
    if ar:
        stamp(g, *ar)
    fig.front(g, c)
    if getattr(fig, 'refist', False) and ar:
        for j, s in enumerate(ar[2]):          # the fist shows over a drape that covers the arm above it
            for i, ch in enumerate(s):
                if ch in 'Ss':
                    put(g, ar[0] + i, ar[1] + j, ch)
    out = rows(g)
    if frame == 'idle2':
        out = fig.breath(out, fc)
    return close_outline(prune(out)), {'dy': dy, 'hand': hand_r}


def build(fig):
    frames, meta = {}, {}
    for fc in FACINGS:
        frames[fc], meta[fc] = {}, {}
        for fr in FRAMES + tuple(f for (f_fc, f) in fig.extra if f_fc == fc):
            frames[fc][fr], meta[fc][fr] = compose(fig, fc, fr)
    return frames, meta


# =====================================================================================================================
# THE CAMPS' OWN
# =====================================================================================================================
RAID_PAL = {'O': '#150f0c', 'H': '#3a2921', 'S': '#d8b890', 'e': '#241a12', 'C': '#8a4432', 'c': '#6b3426', 'T': '#5a4a3a',
            't': '#453a2e', 'B': '#20242a', 'b': '#15181e',
            'F': '#c9b098', 'f': '#a08a72', 'R': '#c9553a', 'r': '#8a3a2c', 'W': '#9a9a8a', 'w': '#6a6a5e', 'V': '#8a6534',
            'v': '#6e5230', 'M': '#6e5a42', 'm': '#5a4a3a', 'G': '#8d979c', 'g': '#6e747c', 'X': '#ffd98f', 'x': '#e0a05e',
            'N': '#33241e', 'n': '#241a12'}


class Knife(Fig):
    """the plain runner — a hood, a blade, a headlamp"""
    name = 'knife'
    pal = RAID_PAL
    notes = ('The camps\' plain runner: a raider\'s hood with a small headlamp on its brow (glass X in a steel housing, '
             'its strap round the hood), the rust coat, a short blade in the RIGHT fist (point down, a reverse grip).')
    HEAD = {
        'E': (12, 9, [   # the hood; the strap round it and the lamp standing off the brow, the glass looking ahead
            '  OOOO     ',
            ' OIIIIO    ',
            'OwwwwwwwX  ',
            'OHHHHHhSO  ',
            'OHHHHhSeSO ',
            'OhHHHhSSSO ',
            'OhhHHhsSO  ',
        ]),
        'S': (11, 9, [   # the lamp on the brow in its housing, clear of the face
            ' OOOOOOOO ',
            'OIIwXXwIHO',
            'OIhhhhhhHO',
            'OHhSSSShHO',
            'OHSeSSeSHO',
            'OhSSSSSShO',
            'OhhsSSshhO',
        ]),
        'N': (11, 9, [   # the lamp's strap round the back of the hood
            ' OOOOOOOO ',
            'OIIIIIIIIO',
            'OwwwwwwwwO',
            'OHHHHhHHHO',
            'OHHHHhHHHO',
            'OhHHHhHHhO',
            'OhhhhhhhhO',
        ]),
    }
    BLADE = {   # the blade in the right fist, from the hand texel: the grip's end, then the steel
        ('E', 'hang'): [(1, 1, 'n'), (2, 2, 'W'), (3, 3, 'W'), (4, 4, 'w')],
        ('E', 'back'): [(0, 1, 'n'), (-1, 2, 'W'), (-2, 3, 'W'), (-3, 4, 'w')],
        ('E', 'fwd'): [(1, 0, 'n'), (2, 0, 'W'), (3, 0, 'W'), (4, 0, 'w')],
        'S': [(0, 1, 'n'), (0, 2, 'W'), (0, 3, 'W'), (0, 4, 'w')],
        'N': [(0, 1, 'n'), (0, 2, 'W'), (0, 3, 'W'), (0, 4, 'w')],
    }

    def head(self, fc):
        return self.HEAD[fc]

    def front(self, g, c):
        key = (c['fc'], c['rsw']) if c['fc'] == 'E' else c['fc']
        at(g, *c['hr'], self.BLADE[key])


# ---- the bow (the bowman's left hand): a short stave, the string toward the body, the belly outward ----
BOW_R = [    # bulging to the eye's right; stamped with its string on the column beside the fist
    '.v.',
    'F.V',
    'F.V',
    'F.V',
    'F.V',
    'F.V',
    'F.V',
    'F.V',
    '.v.',
]
BOW_L = mirror(BOW_R)


class Bowman(Fig):
    """a deep hood over the brow, a short bow in the left hand, a quiver of hide on the back"""
    name = 'bowman'
    pal = RAID_PAL
    notes = ('Stands off and looses: a deep hood whose brim shades the brow, a short bow (V stave, F string) held at the '
             'ready in the LEFT fist, from hip to shoulder; a hide quiver (T) on the back, its fletching (F) over the '
             'right shoulder and its strap (N) across the chest. The right hand is empty.')
    HEAD = {
        'E': (12, 9, [   # the hood's brim reaches over the brow: the eye under its shadow
            '  OOOO    ',
            ' OIIIIO   ',
            'OIHHHHHHO ',
            'OHHHHHHhO ',
            'OHHHHhSeSO',
            'OhHHHhSSSO',
            'OhhHHhsSO ',
        ]),
        'S': (11, 9, [
            ' OOOOOOOO ',
            'OIIIIIIHHO',
            'OIhhhhhhHO',
            'OHhhhhhhHO',
            'OHSeSSeSHO',
            'OhSSSSSShO',
            'OhhsSSshhO',
        ]),
        'N': (11, 9, HOOD_N),
    }
    QUIVER_E = [   # at (9, 11): on the back, its mouth over the right shoulder, the fletching up behind the hood
        ' OO  ',
        'OFfO ',
        'OFFO ',
        'OTTO ',
        'OTtO ',
        ' OTtO',
        ' OTtO',
        ' OTtO',
        ' OTtO',
        ' OTtO',
        ' OTtO',
        ' OttO',
        '  OO ',
    ]
    QUIVER_N = [   # at (14, 11): slung from the right shoulder (the eye's right) toward the left hip
        '....OOOO',
        '...OFfFO',
        '...OFFfO',
        '...OTTTO',
        '...OTTtO',
        '..OTTtO',
        '..OTTtO',
        '..OTTtO',
        '.OTTtO',
        '.OTTtO',
        '.OTTtO',
        '.OtttO',
        '..OOO',
    ]
    FLETCH_S = [(9, 13, 'F'), (10, 13, 'f'), (9, 14, 'f'), (10, 14, 'F'), (9, 15, 'T'), (10, 15, 'T'), (9, 16, 'T'), (10, 16, 't')]
    STRAP_S = [(12, 17, 'N'), (13, 18, 'N'), (14, 19, 'N'), (15, 20, 'N'), (16, 21, 'N'), (17, 22, 'N'), (18, 23, 'N'), (19, 24, 'N')]

    def head(self, fc):
        return self.HEAD[fc]

    BOW_ARM = {   # the left arm holding the bow at the ready: the forearm raised toward the eye, the grip at the hip
        'hang': (0, ['OLC', 'OCD', 'OCD', 'Occ', 'OSs', ' OO']),
        'fwd': (0, ['OLC', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO']),
        'back': (1, ['OLC', 'OCD', 'Occ', 'OSs', ' OO']),
    }

    def arm_l(self, fc, swing, dy):
        if fc == 'E':
            return None   # the far fist is drawn with the bow
        dx, blk = self.BOW_ARM[(S_SWING if fc == 'S' else N_SWING)[swing]]
        if fc == 'S':
            return 22 - dx, 18 + dy, mirror(blk)
        return 7 + dx, 18 + dy, blk

    def behind(self, g, c):
        fc, dy = c['fc'], c['dy']
        if fc == 'E':
            stamp(g, 9, 11 + dy, self.QUIVER_E)
            gx = {'hang': 21, 'fwd': 22, 'back': 20}[c['lsw']]
            gy = 21 + dy
            stamp(g, gx, gy - 4, BOW_R)
            put(g, gx, gy, 'S'); put(g, gx + 1, gy, 'S'); put(g, gx, gy + 1, 's')
        elif fc == 'S':
            at(g, 0, dy, self.FLETCH_S)

    def over_torso(self, g, c):
        if c['fc'] == 'N':
            stamp(g, 14, 11 + c['dy'], self.QUIVER_N)
        elif c['fc'] == 'S':
            at(g, 0, c['dy'], self.STRAP_S)

    def under_arm(self, g, c):
        fc = c['fc']
        if fc == 'S':
            hx, hy = c['hl']
            stamp(g, hx + 1, hy - 4, BOW_R)
        elif fc == 'N':
            hx, hy = c['hl']
            stamp(g, hx - 3, hy - 4, BOW_L)

    def front(self, g, c):
        fc = c['fc']
        if fc == 'S':
            hx, hy = c['hl']; put(g, hx + 1, hy, 'S')
        elif fc == 'N':
            hx, hy = c['hl']; put(g, hx - 1, hy, 'S')


# ---- THE RAM: the width of a big man; a door on the left arm, a beam on the right ----
RAM_TORSO_S = [   # at (8, 16): sixteen wide
    '   OhhhhhhhhO   ',
    'OLLLLLLLLLLLLLLO',
    'OLCCCCCCcCCCCCLO',
    'OCCCCCCCcCCCCCCO',
    'OCDCCCCCcCCCCCDO',
    'OCDCCCCCcCCCCCDO',
    'OTTTTTTYYTTTTTTO',
    'OCDCCCCCcCCCCCDO',
    'ODDCCCCCcCCCCDDO',
    'OccccccOOccccccO',
]
RAM_TORSO_N = [
    '   OhhhhhhhhO   ',
    'OLLLLLLLLLLLLLLO',
    'OCCCCCCCcCCCCCCO',
    'ODCCCCCCcCCCCCDO',
    'ODCCCCCCcCCCCCDO',
    'ODCCCCCCcCCCCCDO',
    'OTTTTTTTTTTTTTTO',
    'ODCCCCCCcCCCCCDO',
    'ODDCCCCCcCCCCDDO',
    'OccccccOOccccccO',
]
RAM_TORSO_E = [   # at (11, 16): a hand deeper than a plain man
    '  OhhhhhhO ',
    ' OLLLLLLLLO',
    ' ODCCCCCCcO',
    ' ODCCCCCCcO',
    ' ODCCCCCCcO',
    ' ODCCCCCCcO',
    ' OTTTTTTYTO',
    ' ODCCCCCCcO',
    'ODDCCCCCCcO',
    'OcccccccccO',
]
RAM_LEGS = {   # the front and back legs a texel stouter each side (rows 25..31, columns from 8)
    'S': {
        'stand': ['..OPPPPOOPPPPO..', '..OPPPpOOpPPPO..', '..OPPPpOOpPPPO..', '..OBBBBOOBBBBO..', '.OBBBBBOOBBBBBO.',
                  '.ObbbbbOObbbbbO.', '................'],
        'contactA': ['..OPPPPOOPPPPO..', '..OPPPpOOpPPPO..', '..OPPPpOOBBBBO..', '..OPPPpOOBBBBBO.', '..OBBBBOObbbbbO.',
                     '.OBBBBBO.OOOOO..', '.ObbbbbO........'],
        'passA': ['..OPPPPOOPPPPO..', '..OPPPpOOpPPPO..', '..OBBBBOOpPPPO..', '..OBBBBOOBBBBO..', '..ObbbbOOBBBBO..',
                  '...OOOO.ObbbbO..', '................'],
        'passB': ['..OPPPPOOPPPPO..', '..OPPPpOOpPPPO..', '..OPPPpOOBBBBO..', '..OBBBBOOBBBBO..', '..OBBBBOObbbbO..',
                  '..ObbbbO.OOOO...', '................'],
        'contactB': ['..OPPPPOOPPPPO..', '..OPPPpOOpPPPO..', '..OBBBBOOpPPPO..', '.OBBBBBOOpPPPO..', '.ObbbbbOOBBBBO..',
                     '..OOOOO.OBBBBBO.', '........ObbbbbO.'],
    },
    'N': {
        'stand': ['..OPPPPOOPPPPO..', '..OPPPPOOPPPPO..', '..OPPpPOOPpPPO..', '..OBBBBOOBBBBO..', '..OBBBBOOBBBBO..',
                  '..ObbbbOObbbbO..', '................'],
        'contactA': ['..OPPPPOOPPPPO..', '..OPPPPOOPPPPO..', '..OPPpPOOPpPPO..', '..OBBBBOOPpPPO..', '..ObbbbOOBBBBO..',
                     '...OOOO.OBBBBO..', '........ObbbbO..'],
        'contactB': ['..OPPPPOOPPPPO..', '..OPPPPOOPPPPO..', '..OPPpPOOPpPPO..', '..OPPpPOOBBBBO..', '..OBBBBOObbbbO..',
                     '..OBBBBO.OOOO...', '..ObbbbO........'],
        'passA': ['..OPPPPOOPPPPO..', '..OPPPPOOPPPPO..', '..OPPpPOOPpPPO..', '..OBBBBOOBBBBO..', '..ObbbbOOBBBBO..',
                  '...OOOO.ObbbbO..', '................'],
        'passB': ['..OPPPPOOPPPPO..', '..OPPPPOOPPPPO..', '..OPPpPOOPpPPO..', '..OBBBBOOBBBBO..', '..OBBBBOObbbbO..',
                  '..ObbbbO.OOOO...', '................'],
    },
}
DOOR_FACE = [   # the door's face: three planks, two rails of rivets
    'OOOOOOOOOOO',
    'OMMmMMmMMmO',
    'OWMmMWmMWmO',
    'OMMmMMmMMmO',
    'OMMmMMmMMmO',
    'OMMmMMmMMmO',
    'OMMmMMmMMmO',
    'OMMmMMmMMmO',
    'OMMmMMmMMmO',
    'OWMmMWmMWmO',
    'OmmmmmmmmmO',
    'OOOOOOOOOOO',
]
DOOR_BACK = [   # the door's back: the planks, the two ledges nailed across and the brace between them
    'OOOOOOOOOOO',
    'OmmmmmmmmmO',
    'OWMMMMMMMWO',
    'OmmmmmmmMmO',
    'OmmmmmmMmmO',
    'OmmmmmMmmmO',
    'OmmmmMmmmmO',
    'OmmmMmmmmmO',
    'OmmMmmmmmmO',
    'OWMMMMMMMWO',
    'OmmmmmmmmmO',
    'OOOOOOOOOOO',
]


class Ram(Fig):
    """the width of a big man under a raider's hood: a door on the left arm, a beam on the right"""
    name = 'ram'
    pal = RAID_PAL
    notes = ('A big man under a raider\'s hood, a hand wider and deeper than the others: a plank DOOR (M planks, W '
             'rivets; its ledged back from behind) on the LEFT arm, a BEAM (V) in the RIGHT fist, gripped at its foot '
             'against the shoulder and rising past the hood.')

    def torso(self, fc, c):
        return {'E': (11, 16, RAM_TORSO_E), 'S': (8, 16, RAM_TORSO_S), 'N': (8, 16, RAM_TORSO_N)}[fc]

    def legs(self, fc, legs, c):
        if fc == 'E':
            return Fig.legs(self, fc, legs, c)
        return 8, 25, RAM_LEGS[fc][legs]

    def arm_r(self, fc, swing, dy):
        if fc == 'E':
            return shift(E_HOLD[swing], 1, dy)
        blk = GRIP_S[{'S': S_SWING, 'N': N_SWING}[fc][swing]]
        if fc == 'S':
            return 5, 18 + dy, blk
        return 24, 18 + dy, mirror(blk)

    def arm_l(self, fc, swing, dy):
        if fc == 'E':
            return None
        a = Fig.arm_l(self, fc, swing, dy)
        return shift(a, 2 if fc == 'S' else -2)

    def door_dy(self, c):
        return {'hang': 0, 'fwd': 1, 'back': -1}[c['lsw']] if c['fc'] == 'S' else \
            {'hang': 0, 'fwd': -1, 'back': 1}[c['lsw']]

    def behind(self, g, c):
        if c['fc'] == 'E':
            dx = {'hang': 0, 'fwd': 1, 'back': -1}[c['lsw']]
            stamp(g, 1 + dx, 15 + c['dy'], DOOR_FACE)

    def under_arm(self, g, c):
        fc, (hx, hy) = c['fc'], c['hr']
        top = 6 + (hy - 21)
        if fc == 'E':
            x0 = 22
        elif fc == 'S':
            x0 = hx
        else:
            x0 = hx - 1
        vline(g, x0, top, hy + 1, 'V'); vline(g, x0 + 1, top, hy + 1, 'v')
        put(g, x0, top, 'v')

    def front(self, g, c):
        fc, dy = c['fc'], c['dy']
        if fc == 'S':
            stamp(g, 19, 16 + dy + self.door_dy(c), DOOR_FACE)
        elif fc == 'N':
            stamp(g, 2, 16 + dy + self.door_dy(c), DOOR_BACK)

    def breath(self, r, fc):
        return breathe(r, {('L', 'C')}, 16, 24)


# ---- THE CHIEF: the red rag across the hood's brow, a cloak of stitched pale hide over the left shoulder ----
CLOAK_S = [   # at (16, 16): thrown over the left shoulder (the eye's right), its inner edge falling across the chest, two
    'OOOOOO    ',   # hides stitched along a slanting seam (T), the hem left ragged
    'OFFFFFOO  ',
    ' OFFFFFFO ',
    ' OfFFFFFFO',
    '  OFFfFFFO',
    '  OfFFfFFO',
    '  OfFTFfFO',
    '   OFFTFFO',
    '   OfFFTFO',
    '   OffFFTO',
    '   OffFfFO',
    '    OfOfO ',
    '     O O  ',
]
CLOAK_N = mirror(CLOAK_S)   # at (6, 16): over the same (left) shoulder, seen from behind on the eye's left
CLOAK_E = [   # at (9, 16): from the far shoulder down the back, the seam and the ragged hem behind
    '  OOOO',
    ' OFFFFO',
    'OFFFFFO',
    'OFFfFFO',
    'OFfFFFO',
    'OFfFFFO',
    'OTFTFTO',
    'OFfFFFO',
    'OFfFFFO',
    'OffFfFO',
    'OfOfOfO',
    ' O O O ',
]
RAG_TAILS_E = [(12, 11, 'R'), (11, 12, 'R'), (11, 13, 'r'), (10, 13, 'R'), (10, 14, 'r')]   # the knot behind, its tails


class Chief(Fig):
    """the camp's own: a hood with the red rag tied across the brow, a cloak of stitched hides, the long knife at the hip"""
    name = 'chief'
    pal = RAID_PAL
    notes = ('The camp\'s own: the RED RAG (R) tied across the hood\'s brow, its knot and tails behind; a cloak of '
             'stitched pale hide (F, T stitches, a ragged hem) over the LEFT shoulder; the long knife (W) hung at the '
             'RIGHT hip. Both hands are empty.')
    HEAD = {
        'E': (12, 9, [
            '  OOOO    ',
            ' OIIIHO   ',
            'ORRRRRRO  ',
            'OHHHHHhSO ',
            'OHHHHhSeSO',
            'OhHHHhSSSO',
            'OhhHHhsSO ',
        ]),
        'S': (11, 9, [
            ' OOOOOOOO ',
            'OIIIIIIHHO',
            'ORRRRRRRRO',
            'OHhSSSShHO',
            'OHSeSSeSHO',
            'OhSSSSSShO',
            'OhhsSSshhO',
        ]),
        'N': (11, 9, [   # the knot at the back, its tails down the hood
            ' OOOOOOOO ',
            'OIIIIIIIIO',
            'ORRRRRRRRO',
            'OHHHRRHHHO',
            'OHHHrRHHHO',
            'OhHHRhrHhO',
            'OhhhhhhhhO',
        ]),
    }
    KNIFE = {   # the long knife at the right hip: its grip at the belt, the blade down the thigh
        'E': [(20, 22, 'n'), (20, 23, 'W'), (21, 24, 'W'), (21, 25, 'W'), (21, 26, 'w')],
        'S': [(11, 22, 'n'), (11, 23, 'W'), (11, 24, 'W'), (11, 25, 'W'), (11, 26, 'w')],
        'N': [(20, 22, 'n'), (20, 23, 'W'), (20, 24, 'W'), (20, 25, 'W'), (20, 26, 'w')],
    }

    def head(self, fc):
        return self.HEAD[fc]

    def behind(self, g, c):
        if c['fc'] == 'E':
            stamp(g, 9, 16 + c['dy'], CLOAK_E)
            at(g, 0, c['dy'], RAG_TAILS_E)

    def over_torso(self, g, c):
        at(g, 0, c['dy'], self.KNIFE[c['fc']])

    def front(self, g, c):
        if c['fc'] == 'S':
            stamp(g, 16, 16 + c['dy'], CLOAK_S)
        elif c['fc'] == 'N':
            stamp(g, 6, 16 + c['dy'], CLOAK_N)

    def breath(self, r, fc):
        return breathe(r, {('L', 'C'), ('F', 'f')})


# ---- THE NEW CHIEF: a different man under the same rag and cloak ----
class Chief2(Chief):
    """the new chief: bare-headed, bearded, a hide vest over the coat, a long spear; the same rag, the same cloak"""
    name = 'chief2'
    notes = ('THE NEW CHIEF, told from the old at 1:1: bare-headed (dark hair, the ears showing) under the same RED RAG, '
             'a full dark beard along the jaw, a laced hide vest (F) over the coat, and a long SPEAR (V shaft, W head) '
             'upright in the RIGHT fist; the same cloak of stitched hide over the LEFT shoulder. No knife.')
    HEAD = {
        'E': (12, 9, [   # hair, the rag's band, the ear, the beard along the jaw
            '  OOOO    ',
            ' OIIIHO   ',
            'ORRRRRRO  ',
            'OHHHHsSSO ',
            'OHHHsSSeSO',
            'OhHHHHSSSO',
            ' OshHHHHO ',
        ]),
        'S': (11, 9, [
            '  OOOOOO  ',
            ' OIIIIIIO ',
            'ORRRRRRRRO',
            'OHSSSSSSHO',
            'OsSeSSeSsO',
            'OHHSSSSHHO',
            ' OHHHHHHO ',
        ]),
        'N': (11, 9, [
            '  OOOOOO  ',
            ' OIIIIIIO ',
            'ORRRRRRRRO',
            'OHHHRRHHHO',
            'OsHHrRHHsO',
            'OhHHRhrHhO',
            ' OhsssshO ',
        ]),
    }
    VEST_S = [   # at (12, 17): the hide vest over the coat's chest, laced up the middle
        'OFFFTFFO',
        'OFFFTfFO',
        'OFfFTFFO',
        'OFFFTFfO',
        'OFFFTFFO',
        'OTTTYYTO',
        'OffftffO',
    ]
    VEST_E = [(18, 17, 'F'), (19, 17, 'F'), (19, 18, 'F'), (19, 19, 'f'), (19, 20, 'F')]

    def torso(self, fc, c):
        return {'E': (12, 16, COLLAR['E']), 'S': (10, 16, COLLAR['S']), 'N': (10, 16, COLLAR['N'])}[fc]

    def arm_r(self, fc, swing, dy):
        if fc == 'E':
            return shift(E_HOLD[swing], 0, dy)
        return Fig.arm_r(self, fc, swing, dy)

    def over_torso(self, g, c):
        fc, dy = c['fc'], c['dy']
        if fc == 'S':
            stamp(g, 12, 17 + dy, self.VEST_S)
        elif fc == 'E':
            at(g, 0, dy, self.VEST_E)

    def under_arm(self, g, c):
        fc, (hx, hy) = c['fc'], c['hr']
        col = 22 if fc == 'E' else hx
        top, bot = haft_rows(c, 8, 28)
        vline(g, col, top, bot, 'V')
        at(g, col, top, [(0, -4, 'W'), (0, -3, 'W'), (1, -3, 'w'), (0, -2, 'W'), (1, -2, 'w'), (0, -1, 'w')])


# =====================================================================================================================
# THE TOWN'S OWN
# =====================================================================================================================
TOWN_PAL = {'O': '#12161c', 'H': '#5a4630', 'S': '#d8c0a0', 'e': '#2a2118', 'C': '#6e5a42', 'c': '#54432f', 'T': '#8a6534',
            't': '#6e4f2a', 'B': '#3a3028', 'b': '#2a221a',
            'F': '#c9b98a', 'f': '#a3956c', 'W': '#b8c2c8', 'w': '#6e747c', 'V': '#a08050', 'v': '#6e5a42',
            'G': '#8d979c', 'g': '#6e747c', 'X': '#ffd98f', 'x': '#e0a05e', 'N': '#4a3320', 'n': '#33241e'}
SHIELD_FACE = [   # the round shield's face: bone-pale boards, the wooden rim, the steel boss
    '  OOOOO  ',
    ' OVVVVVO ',
    'OVFFFFFvO',
    'OVFFFFFvO',
    'OVFFWFFvO',
    'OVFFFFfvO',
    'OVFfFffvO',
    ' OvvvvvO ',
    '  OOOOO  ',
]
SHIELD_BACK = [   # its back: the boards and the grip across them
    '  OOOOO  ',
    ' OvVVVvO ',
    'OvVvVVvVO',
    'OvVvVVvVO',
    'ONNNNNNNO',
    'OvVvVVvVO',
    'OvVvVVvVO',
    ' OvvvvvO ',
    '  OOOOO  ',
]


class TownShield(Fig):
    """the town's recruit: a cap, a leather coat, a round wooden shield on the left arm, a hay fork in the right hand"""
    name = 'townshield'
    pal = TOWN_PAL
    notes = ('The town\'s recruit: a peaked cap, the leather coat, a ROUND wooden shield (F face, V rim, W boss) on the '
             'LEFT arm, a hay fork (V haft, W tines) upright in the RIGHT fist.')
    HEAD = {
        'E': (12, 9, [   # the cap, its band and its peak over the brow; the hair (its shade) at the nape, the ear
            '  OOOO    ',
            ' OIIIIO   ',
            'OIHHHHHOO ',
            'OHHHHHHHHO',
            'OhhhSSSeSO',
            'OhhsSSSSSO',
            ' OhsSSSsO ',
        ]),
        'S': (11, 9, [   # the cap's crown, the peak's shadow on the brow, the hair at the temples
            ' OOOOOOOO ',
            'OIIIIIIHHO',
            'OhhhhhhhhO',
            'OhSSSSSShO',
            'OSSeSSeSSO',
            'OsSSSSSSsO',
            ' OsSSSSsO ',
        ]),
        'N': (11, 9, [   # the cap's back to its band, the hair below it, the ears, the nape
            ' OOOOOOOO ',
            'OIIIIIIIIO',
            'OHHHHHHHHO',
            'OHHHHHHHHO',
            'OshhhhhhsO',
            'Oshhhhhhs'+'O',
            ' OhsssshO ',
        ]),
    }

    def head(self, fc):
        return self.HEAD[fc]

    def torso(self, fc, c):
        return {'E': (12, 16, COLLAR['E']), 'S': (10, 16, COLLAR['S']), 'N': (10, 16, COLLAR['N'])}[fc]

    def arm_r(self, fc, swing, dy):
        if fc == 'E':
            return shift(E_HOLD[swing], 0, dy)
        return Fig.arm_r(self, fc, swing, dy)

    def arm_l(self, fc, swing, dy):
        if fc == 'E':
            return None   # the far arm is behind the shield it holds
        return Fig.arm_l(self, fc, swing, dy)

    def shield_d(self, c):
        return {'hang': 0, 'fwd': 1, 'back': -1}[c['lsw']]

    def behind(self, g, c):
        if c['fc'] == 'E':
            stamp(g, 5 + self.shield_d(c), 17 + c['dy'], SHIELD_FACE)

    def under_arm(self, g, c):
        fc, (hx, hy) = c['fc'], c['hr']
        col = 22 if fc == 'E' else hx
        top, bot = haft_rows(c, 8, 28)
        vline(g, col, top, bot, 'V')
        at(g, col, top, [(-1, -1, 'W'), (0, -1, 'W'), (1, -1, 'W'), (-1, -2, 'W'), (1, -2, 'W'), (-1, -3, 'W'), (1, -3, 'W')])

    def front(self, g, c):
        fc, dy = c['fc'], c['dy']
        d = self.shield_d(c)
        if fc == 'S':
            stamp(g, 19, 17 + dy + d, SHIELD_FACE)
        elif fc == 'N':
            stamp(g, 4, 17 + dy - d, SHIELD_BACK)


# ---- THE KIN: a grey shawl over the head and shoulders, a dark dress, a lantern held low ----
LANTERN = [   # hung from the fist: the bail, the cap, the glass in its rim, the base
    '.N.',
    'NWN',
    'xXx',
    'xXx',
    'NNN',
]
KIN_BODICE = {   # the dress above the waist (under the shawl's drape): (x, y, rows)
    'E': (12, 16, [' OccccccO ', ' OCCCCCCO ', ' ODCCCCcO ', ' ODCCCCcO ', ' ODCCCCcO ', ' ODCCCCcO ', ' OTTTTTTO ',
                   ' ODCCCCcO ']),
    'S': (10, 16, [' OccccccccO ', 'OCCCCCCCCCCO', 'OCCCCCcCCCCO', 'OCDCCCcCCCDO', 'OCDCCCcCCCDO', 'OCDCCCcCCCDO',
                   'OTTTTTTTTTTO', 'OCDCCCcCCCDO']),
    'N': (10, 16, [' OccccccccO ', 'OCCCCCCCCCCO', 'OCCCCCcCCCCO', 'ODCCCCcCCCDO', 'ODCCCCcCCCDO', 'ODCCCCcCCCDO',
                   'OTTTTTTTTTTO', 'ODCCCCcCCCDO']),
}
KIN_SKIRT = {   # the skirt from the waist to the hem (rows 24..28, rising with the body): per facing and step
    'S': {'stand': (8, [sym('..ODDCCc'), sym('..OCDCCc'), sym('.OCDCCCc'), sym('.ODDCCCc'), sym('.Occcccc')])},
    'N': {'stand': (8, [sym('..ODDCCc'), sym('..ODCCCc'), sym('.ODDCCCc'), sym('.ODDCCCc'), sym('.Occcccc')])},
    'E': {   # at x=10: the skirt falls from the waist and flares to the hem; a contact pushes its front out
        'stand': (10, ['..ODDCCCcO. ', '..ODCCCCCcO ', '..ODCCCCCCcO', '.ODDCCCCCCcO', '.OcccccccccO']),
        'contact': (10, ['..ODDCCCcO.  ', '..ODCCCCCCcO ', '..ODCCCCCCCcO', '.ODDCCCCCCCcO', '.OccccccccccO']),
        'pass': (10, ['..ODDCCCcO. ', '..ODCCCCCcO ', '..ODCCCCCcO ', '..ODCCCCCCcO', '.OcccccccccO']),
    },
}
KIN_SHOES = {   # the shoes under the hem (rows 28..31, on the ground): per facing and frame
    'S': {'idle': ['...OPPO..OPPO...', '...OBBO..OBBO...', '...ObbO..ObbO...', '................'],
          'walk1': ['...OPPO.........', '...OPPO.........', '...OBBO.........', '...ObbO.........'],
          'walk2': ['...OPPO.........', '...OBBO.........', '...ObbO.........', '................'],
          'walk3': ['.........OPPO...', '.........OPPO...', '.........OBBO...', '.........ObbO...'],
          'walk4': ['.........OPPO...', '.........OBBO...', '.........ObbO...', '................']},
    'N': {'idle': ['...OPPO..OPPO...', '...OBBO..OBBO...', '...ObbO..ObbO...', '................'],
          'walk1': ['...OPPO.........', '...OPPO.........', '...OBBO.........', '...ObbO.........'],
          'walk2': ['.........OPPO...', '.........OBBO...', '.........ObbO...', '................'],
          'walk3': ['.........OPPO...', '.........OPPO...', '.........OBBO...', '.........ObbO...'],
          'walk4': ['...OPPO.........', '...OBBO.........', '...ObbO.........', '................']},
    'E': {'idle': ['......OPPO....', '......OBBBO...', '......ObbbbO..', '..............'],
          'walk1': ['........OPPO..', '........OBBBO.', '.Ob.....ObbbbO', '..............'],
          'walk2': ['.....OPPPO....', '.....OBBBO....', '.....ObbbbO...', '..............'],
          'walk3': ['........OppO..', '........ObbbO.', '.OB.....ObbbbO', '..............'],
          'walk4': ['.....OpppO....', '.....ObbbO....', '.....ObbbbO...', '..............']},
}
KIN_SHAWL = {   # the shawl's drape over the shoulders and the arms' tops, drawn over the arms: (x, y, rows)
    'S': (7, 16, [sym('...OgGGGG'), sym('.OGGGGGGG'), sym('OGGGGGGGG'), sym('OgGGGGGGG'), sym('.OgGGGGGG'),
                  sym('..OggGGGG'), sym('....OggGG'), sym('......Ogg'), sym('.......OO')]),
    'N': (7, 16, [sym('...OGGGGG'), sym('.OGGGGGGG'), sym('OGGGGGGGG'), sym('OgGGGGGGG'), sym('.OgGGGGGG'),
                  sym('..OgGGGGG'), sym('...OggGGG'), sym('.....OggG'), sym('.......Og'), sym('........O')]),
    'E': (12, 16, ['OGGGGGgO  ', 'OGGGGGGgO ', 'OgGGGGGgO ', 'OgGGGggO  ', 'OggggO    ', 'OggO      ', ' OO       ']),
}


class Kin(Fig):
    """the kin who keep a fallen one's place: a grey shawl over the head and shoulders, a lantern held low"""
    name = 'kin'
    pal = TOWN_PAL
    notes = ('The kin who keeps a fallen one\'s place: a grey shawl (G/g) over the head and the shoulders, a long dress '
             'of the town\'s brown with a sash, the shoes stepping under the hem, a lantern (X glass, x rim, N frame, W '
             'cap) held low in the RIGHT fist.')
    HEAD = {
        'E': (12, 9, [
            '  OOOO    ',
            ' OGGGGO   ',
            'OGGGGGGO  ',
            'OGGGGGgSO ',
            'OGGGGgSeSO',
            'OgGGGgSSSO',
            'OggGGgsSO ',
        ]),
        'S': (11, 9, [
            ' OOOOOOOO ',
            'OGGGGGGGGO',
            'OGggggggGO',
            'OGgSSSSgGO',
            'OGSeSSeSGO',
            'OgSSSSSSgO',
            'OggsSSsggO',
        ]),
        'N': (11, 9, [
            ' OOOOOOOO ',
            'OGGGGGGGGO',
            'OGGGGGGGGO',
            'OGGGGgGGGO',
            'OGGGGgGGGO',
            'OgGGGgGGgO',
            'OggggggggO',
        ]),
    }

    def head(self, fc):
        return self.HEAD[fc]

    def torso(self, fc, c):
        return KIN_BODICE[fc]

    def legs(self, fc, legs, c):
        fr = c['frame'] if c['frame'] in KIN_SHOES[fc] else 'idle'
        return (11 if fc == 'E' else 8), 28, KIN_SHOES[fc][fr]

    def behind(self, g, c):
        pass

    def over_torso(self, g, c):
        fc, legs = c['fc'], c['legs']
        if fc == 'E':
            key = 'stand' if legs == 'stand' else ('contact' if legs.startswith('contact') else 'pass')
        else:
            key = 'stand'
        x, blk = KIN_SKIRT[fc][key]
        stamp(g, x, 24 + c['dy'], blk)

    def front(self, g, c):
        x, y, blk = KIN_SHAWL[c['fc']]
        stamp(g, x, y + c['dy'], blk)
        hx, hy = c['hr']
        stamp(g, hx - 1, hy + 1, LANTERN)

    def breath(self, r, fc):
        return breathe(r, {('G', 'g')}, 16, 22)


# ---- THE WANDERER: a traveller of the valley ----
WANDER_PAL = {'O': '#14161a', 'H': '#4a4238', 'S': '#d6ba94', 'e': '#262019', 'C': '#968a6a', 'c': '#74694e', 'T': '#6e5236',
              't': '#54402a', 'B': '#3a332c', 'b': '#29241f', 'R': '#7e5646', 'r': '#5e4034', 'V': '#8a6a44', 'v': '#6a5034'}
TUNIC = {'C': 'T', 'L': 'T', 'D': 't', 'c': 't'}   # the sleeves and the shirt under the poncho: a dun tunic
PONCHO_S = [   # at (7, 16): over the shoulders and the arms, a madder band along the hem, the hem falling to a point
    sym('....Ohhhh'),
    sym('...OLLLLL'),
    sym('..OLLLCCC'),
    sym('.OLLCCCCC'),
    sym('OLCCCCCCC'),
    sym('ORCCCCCCC'),
    sym('.ORRCCCCC'),
    sym('..OORRCCC'),
    sym('....OORRC'),
    sym('......OOR'),
    sym('........O'),
]
PONCHO_E = [   # at (11, 16): a bell from the neck over the near arm, the band along its hem
    '   OhhhO   ',
    '  OLLLLLO  ',
    ' OLLLLLLLO ',
    ' OLCCCCCLO ',
    'OLCCCCCCCLO',
    'OCCCCCCCCCO',
    'ODCCCCCCCDO',
    'ORRRRRRRRRO',
    'OOOOOOOOOOO',
]
WAVE_S = [   # at (23, 9): the left arm (the eye's right) raised out from under the poncho's side, the hand open
    '..S.S',
    '..SSS',
    '..sSs',
    '..tt.',
    '..Tt.',
    '..Tt.',
    '..Tt.',
    '..Tt.',
    '.TTt.',
    'TTt..',
]


class Wanderer(Fig):
    """a traveller of the valley: a wide-brimmed hat, a poncho, a walking staff"""
    name = 'wanderer'
    pal = WANDER_PAL
    extra = (('S', 'wave'),)
    refist = True    # the fist on the staff shows over the poncho's front edge
    notes = ('A neutral traveller of the valley: a wide-brimmed felt hat with a madder band, a poncho of undyed oat wool '
             '(the band again along its hem) over a dun tunic, a walking staff (V) in the RIGHT fist. S wave: the LEFT '
             'arm raised out of the poncho, the hand open.')
    HEAD = {
        'E': (9, 8, [
            '     OOOO     ',
            '    OIIIIO    ',
            '    ORRRRO    ',
            ' OOOIIIIIIIOOO',
            'OhhhhhhhhhhhhO',
            '   OHHHHhSeSO ',
            '   OhHHHhSSSO ',
            '   OhhHHhsSO  ',
        ]),
        'S': (9, 8, [
            '    OOOOOO    ',
            '   OIIIIIIO   ',
            '   ORRRRRRO   ',
            ' OOIIIIIIIIOO ',
            'OhhhhhhhhhhhhO',
            '  OsSeSSeSsO  ',
            '  OsSSSSSSsO  ',
            '   OssSSssO   ',
        ]),
        'N': (9, 8, [
            '    OOOOOO    ',
            '   OIIIIIIO   ',
            '   ORRRRRRO   ',
            ' OOIIIIIIIIOO ',
            'OhhhhhhhhhhhhO',
            '  OHHHHHHHHO  ',
            '  OhHHHHHHhO  ',
            '   OhhhhhhO   ',
        ]),
    }

    def head(self, fc):
        return self.HEAD[fc]

    def torso(self, fc, c):
        x, y, blk = {'E': (12, 16, COLLAR['E']), 'S': (10, 16, COLLAR['S']), 'N': (10, 16, COLLAR['N'])}[fc]
        return x, y, swap(blk, TUNIC)

    def arm_r(self, fc, swing, dy):
        if fc == 'E':
            a = shift(E_HOLD[swing], 0, dy)
        else:
            a = Fig.arm_r(self, fc, swing, dy)
        return a[0], a[1], swap(a[2], TUNIC)

    def arm_l(self, fc, swing, dy):
        if self.cur == 'wave':
            return None   # raised: drawn over the poncho
        a = Fig.arm_l(self, fc, swing, dy)
        return None if a is None else (a[0], a[1], swap(a[2], TUNIC))

    def under_arm(self, g, c):
        fc, (hx, hy) = c['fc'], c['hr']
        col = 22 if fc == 'E' else hx
        top, bot = haft_rows(c, 10, 29)
        vline(g, col, top, min(bot, 29), 'V')
        put(g, col, top, 'v')

    def front(self, g, c):
        fc, dy = c['fc'], c['dy']
        if fc == 'E':
            stamp(g, 11, 16 + dy, PONCHO_E)
        else:
            stamp(g, 7, 16 + dy, PONCHO_S)
        if c['frame'] == 'wave':
            stamp(g, 23, 9, WAVE_S)

    def breath(self, r, fc):
        return breathe(r, {('L', 'C')}, 16, 22)


FIGS = [Knife, Bowman, Ram, Chief, Chief2, TownShield, Kin, Wanderer]


# =====================================================================================================================
# THE COURIER, read from the registry (src/12e_sprites.js, between its markers) — the lineup's scale reference
# =====================================================================================================================
def courier_rows():
    import re
    src = open(os.path.join(ROOT, 'src', '12e_sprites.js')).read()
    blk = src[src.index('/* COURIER:BEGIN'):src.index('/* COURIER:END */')]
    out, fc, fr = {}, None, None
    for ln in blk.splitlines():
        m = re.match(r'^ {6}([ESN]): \{', ln)
        if m:
            fc = m.group(1); out[fc] = {}; continue
        m = re.match(r'^ {8}(\w+): \[', ln)
        if m and fc:
            fr = m.group(1); out[fc][fr] = []; continue
        if fc and fr and ln.strip().startswith("'"):
            out[fc][fr] += re.findall(r"'([^']*)'", ln)
        if ln.startswith('    },'):
            fc = None
    return out


def paint(im, x0, y0, r, pal, k):
    d = ImageDraw.Draw(im)
    for y, row in enumerate(r):
        for x, ch in enumerate(row):
            if ch != '.':
                d.rectangle([x0 + x * k, y0 + y * k, x0 + x * k + k - 1, y0 + y * k + k - 1], fill=pal.get(ch, '#ff00ff'))


def lineup(entries, path, k=3, ground='#525a25'):
    """every entry (label, rows, palette) standing on one ground line at k×"""
    pad, gap, lab = 12, 4, 14
    wpx = pad * 2 + len(entries) * (W * k + gap)
    hpx = pad + H * k + lab + pad
    im = Image.new('RGB', (wpx, hpx), '#1b1e24')
    d = ImageDraw.Draw(im)
    d.rectangle([pad - 4, pad, wpx - pad + 4, pad + H * k - 1], fill=ground)
    gy = pad + (SOLE + 1) * k   # the ground line: the row under the soles
    d.line([pad - 4, gy, wpx - pad + 4, gy], fill='#3a4119')
    for i, (label, r, pal) in enumerate(entries):
        x0 = pad + i * (W * k + gap)
        paint(im, x0, pad, r, derive(pal), k)
        d.text((x0 + 2, pad + H * k + 2), label, fill='#9aa2ab')
    im.save(path)


def draft(fig, frames=None):
    """scratch renders for the eye: the 8× sheet of one figure, and its idles and contacts at 3× and 1× by the courier"""
    from draft import PAL_WALKER
    frames = frames or build(fig)[0]
    fr = [(f'{fc} {n}', r) for fc in FACINGS for n, r in frames[fc].items()]
    render(fr, SP + f'{fig.name}_sheet.png', k=8, cols=7 if fig.extra else 6, pal=fig.pal)
    co = courier_rows()
    ent = [('courier S', co['S']['idle'], PAL_WALKER), ('courier E', co['E']['idle'], PAL_WALKER)]
    ent += [(f'{fig.name} {fc}', frames[fc]['idle'], fig.pal) for fc in ('S', 'E', 'N')]
    ent += [(f'{fc} {w}', frames[fc][w], fig.pal) for fc in ('S', 'E', 'N') for w in ('walk1', 'walk3')]
    lineup(ent, SP + f'{fig.name}_lineup3.png', k=3)


# =====================================================================================================================
# THE CHECKS — what STYLE.md asks of every bench, and the eye's own
# =====================================================================================================================
def mask(r):
    return [(x, y) for y, s in enumerate(r) for x, ch in enumerate(s) if ch != '.']


def open_edges(r):
    """coloured texels meeting the open air on a side without their outline (a boot's sole is its own edge)"""
    bad = []
    for y in range(H):
        for x in range(W):
            ch = r[y][x]
            if ch in '.O':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                xx, yy = x + dx, y + dy
                if not (0 <= xx < W and 0 <= yy < H):
                    if not (ch == 'b' and dy == 1):
                        bad.append((x, y, 'edge of grid'))
                    continue
                if r[yy][xx] == '.' and not (ch == 'b' and dy == 1):
                    bad.append((x, y, ch))
    return bad


def stranded(r):
    """outline texels touching no coloured texel, even at a corner (a doubled outline leaves these)"""
    out = []
    for y in range(H):
        for x in range(W):
            if r[y][x] != 'O':
                continue
            if not any(0 <= x + i < W and 0 <= y + j < H and r[y + j][x + i] not in '.O'
                       for i in (-1, 0, 1) for j in (-1, 0, 1)):
                out.append((x, y))
    return out


def check(name, frames, meta):
    """(hard failures, notes for the eye)"""
    bad, notes = [], []
    for fc, fr in frames.items():
        for n, r in fr.items():
            if len(r) != H or any(len(s) != W for s in r):
                bad.append(f'{name} {fc}.{n}: not {W}x{H}')
                continue
            for y, s in enumerate(r):
                for x, ch in enumerate(s):
                    if ch != '.' and ch not in LETTERS:
                        bad.append(f'{name} {fc}.{n}: letter {ch!r} at {x},{y}')
            oe = open_edges(r)
            if oe:
                bad.append(f'{name} {fc}.{n}: {len(oe)} texels open to the air, first {oe[:3]}')
            st = stranded(r)
            if st:
                notes.append(f'{name} {fc}.{n}: {len(st)} stranded outline texels {st[:4]}')
            hx, hy = meta[fc][n]['hand']
            if r[hy][hx] not in 'Ss':
                notes.append(f'{name} {fc}.{n}: the right hand texel {hx},{hy} is {r[hy][hx]!r}')
        if mask(fr['idle2']) != mask(fr['idle']):
            bad.append(f'{name} {fc}: idle2 silhouette differs from idle')
        if fr['idle2'] == fr['idle']:
            bad.append(f'{name} {fc}: idle2 is idle (no breath)')
        ys = [y for (x, y) in mask(fr['idle'])]
        if max(ys) != SOLE or any(ch != '.' for ch in fr['idle'][SOLE + 1]):
            bad.append(f'{name} {fc}: idle soles on row {max(ys)}, not {SOLE}')
    tops = {fc: min(y for (x, y) in mask(frames[fc]['idle'])) for fc in frames}
    if len(set(tops.values())) != 1:
        bad.append(f'{name}: crown rows differ by facing {tops}')
    return bad, notes, tops


def used_pal(fig, frames):
    used = set(ch for fr in frames.values() for r in fr.values() for s in r for ch in s) - {'.'}
    pal = {k: fig.pal[k] for k in BASE}
    pal.update({k: v for k, v in fig.pal.items() if k in GEAR and k in used})
    return pal


def build_all():
    out = {}
    for F in FIGS:
        fig = F()
        frames, meta = build(fig)
        out[fig.name] = (fig, frames, meta)
    return out


def write_json(built, path):
    figs = {}
    for name, (fig, frames, meta) in built.items():
        figs[name] = {
            'frames': {fc: {n: r for n, r in fr.items()} for fc, fr in frames.items()},
            'hand': {fc: {n: meta[fc][n]['hand'] for n in fr} for fc, fr in frames.items()},
            'dy': {fc: {n: meta[fc][n]['dy'] for n in fr} for fc, fr in frames.items()},
            'pal': used_pal(fig, frames),
            'notes': fig.notes,
        }
    doc = {'family': 'people', 'grid': {'w': W, 'h': H, 'ax': 16, 'sole': SOLE}, 'figures': figs}
    with open(path, 'w') as f:
        json.dump(doc, f, indent=1)
    return doc


def sheet(built, path, k=8):
    """every frame of every figure at 8x (draft.py render, each figure in its own palette), a row per facing"""
    import tempfile
    parts = []
    with tempfile.TemporaryDirectory() as td:
        for name, (fig, frames, meta) in built.items():
            for fc in FACINGS:
                tmp = os.path.join(td, f'{name}_{fc}.png')
                render([(f'{name} {fc} {n}', r) for n, r in frames[fc].items()], tmp, k=k, cols=7, pal=fig.pal)
                parts.append((name if fc == 'E' else None, Image.open(tmp).convert('RGB')))
    head = 22
    wpx = max(im.width for _, im in parts)
    hpx = sum(im.height + (head if t else 0) for t, im in parts)
    out = Image.new('RGB', (wpx, hpx), '#1b1e24')
    d = ImageDraw.Draw(out)
    y = 0
    for t, im in parts:
        if t:
            d.rectangle([0, y, wpx, y + head - 1], fill='#2a2f37')
            d.text((10, y + 5), f'{t.upper()}  -  {built[t][0].__doc__}'.replace('\u2014', '-'), fill='#e2d6b0')
            y += head
        out.paste(im, (0, y)); y += im.height
    out.save(path)
    return out.size


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--draft':
        want = args[1:] or [F.name for F in FIGS]
        for F in FIGS:
            if F.name in want:
                draft(F())
        print('drafted', want)
        sys.exit(0)
    built = build_all()
    fails, notes = [], []
    print('THE PEOPLE - checks')
    for name, (fig, frames, meta) in built.items():
        b, n, tops = check(name, frames, meta)
        fails += b; notes += n
        nfr = sum(len(v) for v in frames.values())
        print(f'  {name:11s} {nfr:2d} frames  top texel row {tops["E"]} in E/S/N  {"ok" if not b else "FAIL"}')
    for n in notes:
        print('  note:', n)
    if fails:
        print('\n'.join('  FAIL ' + f for f in fails)); sys.exit(1)
    print('  every frame 32x32, letters in the law, idle2 = idle silhouette, idle soles on row 30, every edge outlined')
    if args and args[0] == '--check':
        sys.exit(0)
    doc = write_json(built, os.path.join(HERE, 'people.json'))
    size = sheet(built, os.path.join(ROOT, 'shots', 'people_sheet.png'))
    from draft import PAL_WALKER
    co = courier_rows()
    ent = [('courier S', co['S']['idle'], PAL_WALKER), ('courier E', co['E']['idle'], PAL_WALKER)]
    for name, (fig, frames, meta) in built.items():
        ent += [(f'{name} S', frames['S']['idle'], fig.pal), (f'{name} E', frames['E']['idle'], fig.pal)]
    lineup(ent, os.path.join(ROOT, 'shots', 'people_lineup.png'), k=3)
    print(f'  wrote tools/people/people.json ({len(doc["figures"])} figures), shots/people_sheet.png {size}, shots/people_lineup.png')
