#!/usr/bin/env python3
"""THE DARK SET — v3.51 figure bench, family `dark`: the set pieces' figures, drawn by hand at the courier's scale.

  reaper       tall grid 32×40 — the mist's own uniform: the procession's hooded file and the ride's firing line
  lamplighter  tall grid 32×40 — the exile on the ridge: the Reapers' cut, a hooded lantern, the C14 across the back
  stranger     courier grid 32×32 — the raised-tongue stranger out of the bunker
  tender       courier grid 32×32 — the Flame Keepers' tender who stands the fed bowl, torch up
  giant        its own grid 40×64 — the far shape in the grey

Every texel below is placed by hand, the way tools/courier/courier.py builds the courier: part blocks drawn as row
strings (the hood, the body, an arm in each swing, the hem or the legs in each step) composed per frame with
`stamp`/`put`, then the outline law closed by `close_outline`. Nothing is scaled, generated, rotated or filtered.

Run: python3 tools/dark/dark.py            → tools/dark/dark.json, shots/dark_sheet.png (8×), shots/dark_lineup.png (3×)
     python3 tools/dark/dark.py --check    → validate only
"""
import os, sys, json
sys.dont_write_bytecode = True   # read the courier's bench; never write into its folder
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'courier'))
from draft import derive, shade, light, PAL_WALKER   # noqa: E402
import courier as COURIER_BENCH                      # noqa: E402  (its close_outline, the law, for 32×32 frames)

LETTERS = set('OHSeCcTtBb' 'hIsDLAauYPp' 'WwGgFfRrKkMmVvNnXx')
BASE = 'OHSeCcTtBb'


# =====================================================================================================================
# the bench's hands: a grid, a run of texels, a block
# =====================================================================================================================
def blank(w, h):
    return [['.'] * w for _ in range(h)]


def put(g, x, y, s):
    """write a run of texels; a '.' or a space leaves what is under it"""
    for i, ch in enumerate(s):
        if ch in ' .':
            continue
        if 0 <= y < len(g) and 0 <= x + i < len(g[0]):
            g[y][x + i] = ch


def stamp(g, x, y, block):
    for j, s in enumerate(block):
        put(g, x, y + j, s)


def rows(g):
    return [''.join(r) for r in g]


def mirror(block):
    return [s[::-1] for s in block]


def close_outline(r):
    """the outline law (tools/courier/courier.py close_outline, the same rule on any grid): a coloured texel that meets the
    open air gets its outline texel there — except a boot's sole on the ground line, which is the dark edge itself"""
    h, w = len(r), len(r[0])
    if (w, h) == (32, 32):
        return COURIER_BENCH.close_outline(r)
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
                if ch in 'b' and dy == 1:
                    continue   # the sole
                g[yy][xx] = 'O'
    return [''.join(s) for s in g]


def breath(r, pairs=(('L', 'C'),)):
    """the breath: the chest's light rises a row (shading migration reads as volume); the silhouette holds to the texel.
    For each column, the first light texel with its material under it spreads one row down — the courier's rule."""
    g = [list(s) for s in r]
    for x in range(len(r[0])):
        for y in range(1, len(r) - 1):
            hit = next(((a, b) for a, b in pairs if r[y][x] == a and r[y + 1][x] == b), None)
            if hit:
                g[y + 1][x] = hit[0]
                break
    return [''.join(s) for s in g]


def full_pal(base, gear):
    """the whole palette a frame is drawn with: the base letters, what derive() makes of them, the gear letters"""
    d = derive(base)
    d.update(gear)
    return d


# =====================================================================================================================
# the eye: draft.py's render, on any grid (a tall figure is 40 rows, the far shape 64)
# =====================================================================================================================
from PIL import Image, ImageDraw, ImageFont   # noqa: E402

def font(sz=11):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


def paint(im, r, pal, ox, oy, k):
    d = ImageDraw.Draw(im)
    for y, row in enumerate(r):
        for x, ch in enumerate(row):
            if ch != '.':
                d.rectangle([ox + x * k, oy + y * k, ox + x * k + k - 1, oy + y * k + k - 1], fill=pal.get(ch, '#ff00ff'))


def render(frames, path, k=8, cols=6, bg='#2a2f37', ax=None):
    """frames: [(label, rows, pal)] — each cell its own grid; labelled, the anchor column ticked under it"""
    pad, lab = 10, 14
    cw = max(len(r[0]) for _, r, _ in frames) * k
    ch = max(len(r) for _, r, _ in frames) * k
    n = len(frames); rn = (n + cols - 1) // cols
    im = Image.new('RGB', (cols * (cw + pad) + pad, rn * (ch + pad + lab) + pad), '#1b1e24')
    d = ImageDraw.Draw(im); f = font(11)
    for i, (name, r, pal) in enumerate(frames):
        w, h = len(r[0]) * k, len(r) * k
        ox = pad + (i % cols) * (cw + pad); oy = pad + (i // cols) * (ch + pad + lab) + (ch - h)
        d.rectangle([ox, oy, ox + w - 1, oy + h - 1], fill=bg)
        paint(im, r, pal, ox, oy, k)
        a = (ax if ax is not None else len(r[0]) // 2)
        d.line([ox + a * k, oy + h, ox + a * k, oy + h + 3], fill='#9aa2ab')
        d.text((ox, oy + h + 2), name, fill='#9aa2ab', font=f)
    im.save(path)
    return im


# =====================================================================================================================
# the courier, as the game draws it: the registry block in src/12e_sprites.js (COURIER:BEGIN … COURIER:END)
# =====================================================================================================================
def courier_rows():
    import re
    s = open(os.path.join(ROOT, 'src', '12e_sprites.js')).read()
    blk = s[s.index('const COURIER = {'):s.index('/* COURIER:END */')]
    blk = blk[blk.index('frames: {'):blk.index('    dy:')]
    out, fc, name = {}, None, None
    for line in blk.splitlines():
        m = re.match(r'^\s{6}([ESN]): \{', line)
        if m:
            fc = m.group(1); out[fc] = {}; continue
        m = re.match(r'^\s{8}(\w+): \[', line)
        if m:
            name = m.group(1); out[fc][name] = []; continue
        out[fc][name].extend(re.findall(r"'([^']*)'", line)) if name else None
    return out


def lineup(groups, path, k=3, bg='#2a2f37', ground='#3a3f36', gap=10):
    """groups: [(caption, [(label, rows, pal)])] — every frame's bottom edge (the row under the soles) on one ground line"""
    f = font(11)
    pad, cap = 14, 18
    bands = []
    for caption, frames in groups:
        hmax = max(len(r) for _, r, _ in frames) * k
        wsum = sum(len(r[0]) * k for _, r, _ in frames) + gap * (len(frames) - 1)
        bands.append((caption, frames, hmax, wsum))
    W = max(pad * 2 + b[3] for b in bands)
    H = pad + sum(cap + b[2] + 16 + pad for b in bands)
    im = Image.new('RGB', (W, H), '#1b1e24')
    d = ImageDraw.Draw(im)
    y = pad
    for caption, frames, hmax, wsum in bands:
        d.text((pad, y), caption, fill='#e2d6b0', font=f)
        y += cap
        base = y + hmax                     # every frame's bottom edge
        d.rectangle([pad - 6, y, pad + wsum + 5, base - 1], fill=bg)
        d.rectangle([pad - 6, base - k, pad + wsum + 5, base + 3], fill=ground)   # the ground under the soles
        x = pad
        for label, r, pal in frames:
            w, h = len(r[0]) * k, len(r) * k
            paint(im, r, pal, x, base - h, k)
            d.text((x, base + 4), label, fill='#9aa2ab', font=f)
            x += w + gap
        y = base + 16 + pad
    im.save(path)
    return im


def grid32(block, w=32):
    """a block of full-width rows (every column spelled out): checked to the grid's width"""
    for s in block:
        assert len(s) == w, (len(s), s)
    return block


# ---- the courier's own parts (tools/courier/courier.py, v3.50), pinned here so this set holds still while that bench
# grows; the legs renamed by the law's steps (walk1 contact A: the right leg reaching — facing the eye, its foot a row lower on
# the eye's left; facing away, a row higher on the eye's right; walk2 passing A: the right planted, the left lifted)
PIN_LEGS = {
    'E': {
        'stand': [   # the courier's E_LEGS['stand']
            '.....OppOPPPO...',
            '.....OppOPPPO...',
            '.....OppOPPPO...',
            '.....OppOPPpO...',
            '....ObbbOBBBBO..',
            '....OOOOObbbbO..',
        ],
        'contactA': [   # the courier's E_LEGS['contactA']
            '.....OppPPPO....',
            '....OppOOPPPO...',
            '...OppO..OPPPO..',
            '..OppO....OPPpO.',
            '.ObbO.....OBBBBO',
            'ObbbO.....ObbbO.',
        ],
        'passA': [   # the courier's E_LEGS['passA']
            '.....OppPPPO....',
            '.....OppOPPPO...',
            '....OppO.OPPO...',
            '...ObbO..OPPO...',
            '...ObO..OBBBBO..',
            '.........ObbbO..',
        ],
        'contactB': [   # the courier's E_LEGS['contactB']
            '.....OPPPppO....',
            '....OPPPOOppO...',
            '...OPPPO..OppO..',
            '..OPPpO....OppO.',
            '.OBBBO.....ObbbO',
            'ObbbO......ObbO.',
        ],
        'passB': [   # the courier's E_LEGS['passB']
            '.....OPPPppO....',
            '.....OPPPOppO...',
            '....OPPpO.OpO...',
            '...OBBBO..OpO...',
            '...ObbO..ObbbO..',
            '.........OOOO...',
        ],
    },
    'S': {
        'stand': [   # the courier's S_LEGS['stand']
            '...OPPPOOPPPO...',
            '...OPPpOOpPPO...',
            '...OPPpOOpPPO...',
            '...OBBBOOBBBO...',
            '..OBBBBOOBBBBO..',
            '..ObbbbOObbbbO..',
            '................',
        ],
        'contactA': [   # the courier's S_LEGS['contactA']
            '...OPPPOOPPPO...',
            '...OPPpOOpPPO...',
            '...OPPpOOBBBO...',
            '...OPPpOOBBBBO..',
            '...OBBBOObbbbO..',
            '..OBBBBO.OOOO...',
            '..ObbbbO........',
        ],
        'passA': [   # the courier's S_LEGS['passB']
            '...OPPPOOPPPO...',
            '...OPPpOOpPPO...',
            '...OPPpOOBBBO...',
            '...OBBBOOBBBO...',
            '...OBBBOObbbO...',
            '...ObbbO.OOO....',
            '................',
        ],
        'contactB': [   # the courier's S_LEGS['contactB']
            '...OPPPOOPPPO...',
            '...OPPpOOpPPO...',
            '...OBBBOOpPPO...',
            '..OBBBBOOpPPO...',
            '..ObbbbOOBBBO...',
            '...OOOO.OBBBBO..',
            '........ObbbbO..',
        ],
        'passB': [   # the courier's S_LEGS['passA']
            '...OPPPOOPPPO...',
            '...OPPpOOpPPO...',
            '...OBBBOOpPPO...',
            '...OBBBOOBBBO...',
            '...ObbbOOBBBO...',
            '....OOO.ObbbO...',
            '................',
        ],
    },
    'N': {
        'stand': [   # the courier's N_LEGS['stand']
            '..OCCCCccCCCCO..',
            '...OPPPOOPPPO...',
            '...OPpPOOPpPO...',
            '...OBBBOOBBBO...',
            '...OBBBOOBBBO...',
            '...ObbbOObbbO...',
            '................',
        ],
        'contactA': [   # the courier's N_LEGS['contactB']
            '..OCCCCccCCCCO..',
            '...OPPPOOPPPO...',
            '...OPpPOOPpPO...',
            '...OPpPOOBBBO...',
            '...OBBBOObbbO...',
            '...OBBBO.OOO....',
            '...ObbbO........',
        ],
        'passA': [   # the courier's N_LEGS['passA']
            '..OCCCCccCCCCO..',
            '...OPPPOOPPPO...',
            '...OPpPOOPpPO...',
            '...OBBBOOBBBO...',
            '...ObbbOOBBBO...',
            '....OOO.ObbbO...',
            '................',
        ],
        'contactB': [   # the courier's N_LEGS['contactA']
            '..OCCCCccCCCCO..',
            '...OPPPOOPPPO...',
            '...OPpPOOPpPO...',
            '...OBBBOOPpPO...',
            '...ObbbOOBBBO...',
            '....OOO.OBBBO...',
            '........ObbbO...',
        ],
        'passB': [   # the courier's N_LEGS['passB']
            '..OCCCCccCCCCO..',
            '...OPPPOOPPPO...',
            '...OPpPOOPpPO...',
            '...OBBBOOBBBO...',
            '...OBBBOObbbO...',
            '...ObbbO.OOO....',
            '................',
        ],
    },
}
PIN_E_ARM = {   # the near arm: (x, y) of the block at rest, its rows
    'hang': (16, 18, ['OCLc', 'OCLc', 'ODCD', 'ODCD', 'OccO', 'OSSO', 'OsO ']),
    'back': (13, 18, ['  OCLO', '  OCLO', ' ODCO ', ' ODCO ', 'OccO  ', 'OSSO  ', 'OsO   ']),
    'fwd': (16, 18, ['OCLc ', 'OCLO ', ' OCLO', ' ODCO', '  OccO', '  OSSO', '   OsO']),
}
PIN_S_ARM = {   # an arm at the side: (dx inward, rows) — the eye's-left arm drawn, the other its mirror
    'hang': (0, ['OLC', 'OLC', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO']),
    'fwd': (0, ['OLC', 'OLC', 'OCD', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO']),
    'back': (1, ['OLC', 'OCD', 'OCD', 'OCD', 'Occ', 'OSs', ' OO']),
}
PIN_E_HEAD = ['  OOOO    ', ' OIIIHO   ', 'OIHHHHHO  ', 'OHHHHHhSO ', 'OHHHHhSeSO', 'OhHHHhSSSO', 'OhhHHhsSO ']   # the hooded head in profile, at (12, 9)
PIN_S_HEAD = [' OOOOOOOO ', 'OIIIIIIHHO', 'OIhhhhhhHO', 'OHhSSSShHO', 'OHSeSSeSHO', 'OhSSSSSShO', 'OhhsSSshhO']   # the hooded head facing the eye, at (11, 9)


def hand_of(blk, x0, y0):
    """the hand's texel: the first skin texel of an arm block, placed (the courier bench's rule)"""
    for j, s in enumerate(blk):
        i = s.find('S')
        if i >= 0:
            return [x0 + i, y0 + j]
    raise ValueError('an arm with no hand')


def arm_rows(pose, side):
    """a side arm facing the eye or away: the eye's-left arm as drawn, the eye's-right its mirror"""
    dx, blk = PIN_S_ARM[pose]
    return dx, (mirror(blk) if side == 'R' else blk)


# =====================================================================================================================
# THE REAPER — the mist's own uniform (tall grid 32×40, soles on row 38). A tall hood cut to a short point, the face a dark
# slit with two pale eyes; a cowl that falls onto the shoulders and points down the chest; the long cloak A-lined to a torn
# hem on the ground. No hands at rest. The file walks in it — the hem sways, a boot's toe shows at the reach; the firing
# line brings its rifles level out of it.
# Letters: H/h/I the hood and cowl · C/D/L the cloak · c the hem band and the seam · X the near eye, x the far (cold blue)
#          B/b a boot under the hem · w the long dark barrel, W the steel of the action (the aim)
# The light comes from the upper left of the screen in every facing, as on the courier.
# =====================================================================================================================
TALL = {'w': 32, 'h': 40, 'ax': 16, 'sole': 38}
R_BASE = {'O': '#12151f', 'H': '#2a3048', 'S': '#0b0d12', 'e': '#9aa4ff', 'C': '#232840', 'c': '#1a1e2c',
          'T': '#2a3048', 't': '#1e2334', 'B': '#343947', 'b': '#22252f'}
R_GEAR = {'X': '#9aa4ff', 'x': '#5c66b8', 'W': '#6e7883', 'w': '#2e3440'}

R_S_HOOD = grid32([   # rows 12..19
    '...............OO...............',
    '..............OIIO..............',
    '.............OIIHHO.............',
    '............OIIHHHhO............',
    '...........OIHhhhhhhO...........',   # the brow over the slit, in its own shade
    '...........OHOXOOXOhO...........',   # the slit: two pale eyes in the dark
    '...........OHhOOOOhhO...........',
    '...........OhhhOOhhhO...........',
])
R_S_CLOAK = grid32([  # rows 20..32: the cowl over the shoulders to its point on the chest; the cloak; the seam; two folds,
    # each a lit ridge beside its valley, the valleys widening toward the hem
    '..........OIIHhhhhhHhO..........',
    '..........OIHhhhhhhhhO..........',
    '..........OLHhhhhhhhDO..........',
    '..........OLChhhhhhCDO..........',
    '..........OLCChhhhCCDO..........',
    '..........OLCCChhCCCDO..........',
    '..........OLCCCCcCCCDO..........',
    '.........OLCCCLCcCLCDDO.........',
    '.........OLCCLDCcCLDCDO.........',
    '.........OLCCLDCcCLDCDO.........',
    '.........OLCCLDCcLDDCDO.........',
    '.........OLCLDDCcLDDCDO.........',
    '.........OLCLDDCcLDDCDO.........',
])
R_N_HOOD = grid32([   # rows 12..19: the hood's back
    '...............OO...............',
    '..............OIIO..............',
    '.............OIIHHO.............',
    '............OIIHHHhO............',
    '...........OIHHHHHHhO...........',
    '...........OHHHHHHHhO...........',
    '...........OHHHHHHHhO...........',
    '...........OhHHHHHHhO...........',
])
R_N_CLOAK = grid32([  # rows 20..32: the cowl down the back to its point; the back seam; the folds as in front
    '..........OIIHHHHHHhhO..........',
    '..........OIHHHHHHHhhO..........',
    '..........OLHHHHHHHhDO..........',
    '..........OLCHHHHHhCDO..........',
    '..........OLCChHHhCCDO..........',
    '..........OLCCChhCCCDO..........',
    '..........OLCCCCcCCCDO..........',
    '.........OLCCCLCcCLCDDO.........',
    '.........OLCCLDCcCLDCDO.........',
    '.........OLCCLDCcCLDCDO.........',
    '.........OLCCLDCcLDDCDO.........',
    '.........OLCLDDCcLDDCDO.........',
    '.........OLCLDDCcLDDCDO.........',
])
# the hem, facing the eye or away: (first row, rows). The stride is the hem's: over the leg toward the eye it hangs a row
# lower; on a passing step the body has risen a row and the hem with it, the planted boot showing under it.
R_SN_HEM = {
    'stand': (33, grid32([
        '........OLCCLDDCcLDDCCDO........',
        '........OLCCLDDCcLDDCCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OcccOOcccccOccDO........',
        '........OOOO..OOOOO.OOOO........',
    ])),
    'lowL': (33, grid32([   # the eye's left toward the eye
        '........OLCCLDDCcLDDCCDO........',
        '........OLCCLDDCcLDDCCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OLCLDDDCcccOccDO........',
        '........OcccOOccOOO.OOOO........',
        '........OOOO..OO................',
    ])),
    'lowR': (33, grid32([   # the eye's right toward the eye
        '........OLCCLDDCcLDDCCDO........',
        '........OLCCLDDCcLDDCCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OcccOccccLDDDCDO........',
        '........OOOO.OOOcccOOcDO........',
        '................OOO..OOO........',
    ])),
    'upL': (32, grid32([    # risen; the boot planted under the eye's left
        '........OLCCLDDCcLDDCCDO........',
        '........OLCCLDDCcLDDCCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OcccccccOOcccODO........',
        '........OOBBBOOO..OOO.OO........',
        '.........ObbbO..................',
    ])),
    'upR': (32, grid32([    # risen; the boot planted under the eye's right
        '........OLCCLDDCcLDDCCDO........',
        '........OLCCLDDCcLDDCCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OLCLDDDCcLDDDCDO........',
        '........OccOcccOOcccccDO........',
        '........OOO.OOO..OOBBBOO........',
        '..................ObbbO.........',
    ])),
}

R_E_HOOD = grid32([   # rows 12..19: the point set back, the brow out over the slit, the near eye and the far
    '............OO..................',
    '...........OIIOO................',
    '...........OIHHHOO..............',
    '...........OIHHHHHOO............',
    '...........OHHHHHHhhhO..........',
    '...........OHHHHhOXOxO..........',
    '...........OhHHHhOOOOO..........',
    '...........OhhHHhhOOhO..........',
])
R_E_CLOAK = grid32([  # rows 20..32: the cowl's drape to its point at the front; the near arm's long fold (a ridge, a
    # valley) to the hand still inside it; a fold down the front
    '..........OIhhhhhhhhhO..........',
    '..........OLIhhhhhhhhO..........',
    '..........OLCHhhhhhhDO..........',
    '..........OLCLDhhhhhcO..........',
    '..........OLCLDCChhhcO..........',
    '..........OLCLDCCChhcO..........',
    '..........OLCLDCCCCDcO..........',
    '.........OLCCLDCCCCDcO..........',
    '.........OLCCLDCCCLDCcO.........',
    '.........OLCCCLDCCLDCcO.........',
    '.........OLCCCLDDCLDCcO.........',
    '.........OLCCCCCCLDCCcO.........',
    '.........OLCCCCCCLDCCcO.........',
])
R_E_HEM = {
    'stand': (33, grid32([
        '........OLCCCCCCCCLDCcO.........',
        '........OLCCCCCCCCLDCCcO........',
        '........OLCCCCCCCLDDCCcO........',
        '........OLCCCCCCCLDDCCcO........',
        '........OcccOOccccOccccO........',
        '........OOOO..OOOO.OOOOO........',
    ])),
    'contactA': (33, grid32([   # the near leg reaching: the hem pushed forward over the shin, the near boot's toe out ahead
        '........OLCCCCCCCCLDCcO.........',
        '........OLCCCCCCCCLDCCcO........',
        '........OLCCCCCCCCLDCCCcO.......',
        '.......OLCCCCCCCCLDDCCCcO.......',
        '.......OcccOOcccccOccccOBBO.....',
        '.......OOOO..OOOOO.OOOObbbO.....',
    ])),
    'passA': (32, grid32([      # risen: the hem swung back, the near boot planted under it
        '........OLCCCCCCCCLDCcO.........',
        '........OLCCCCCCCCLDCCcO........',
        '.......OLCCCCCCCCLDDCCcO........',
        '.......OLCCCCCCCCLDDCCcO........',
        '.......OccccOOccccOcccO.........',
        '.......OOOOO..OOOBBBBOO.........',
        '................ObbbbbO.........',
    ])),
    'contactB': (33, grid32([   # the far leg reaching, its toe in shade; the near heel pushing off under the back hem
        '........OLCCCCCCCCLDCcO.........',
        '........OLCCCCCCCCLDCCcO........',
        '........OLCCCCCCCCLDCCCcO.......',
        '.......OLCCCCCCCCLDDCCCcO.......',
        '......OBcccOOcccccOccccObbO.....',
        '......ObbOO..OOOOO.OOOObbbO.....',
    ])),
    'passB': (32, grid32([      # risen: the far boot planted (in shade), the near swinging through, hidden
        '........OLCCCCCCCCLDCcO.........',
        '........OLCCCCCCCCLDCCcO........',
        '.......OLCCCCCCCCLDDCCcO........',
        '.......OLCCCCCCCCLDDCCcO........',
        '.......OcccOOccccOccccO.........',
        '.......OOOO..OOObbbbbOO.........',
        '...............ObbbbbO..........',
    ])),
}
R_AIM = (19, grid32([   # E only: the rifle brought level out of the cloak under the eyes — the near sleeve up from the
    # elbow to the grip, the far sleeve out under the fore-end, dark gloves on the stock, the long barrel past the cloak
    '...........OhhHHhhOOhOOOOOOOOOO.',
    '..........OIhhhhhhOWwwwwwwwwwwO.',
    '..........OLIhhhOLLBDDDDDbOOOOO.',
    '..........OLCHhOLCDOOOOOOO......',
    '..........OLCCOLCDO.............',
    '..........OLCCOCDO..............',
    '..........OLCCDOOhcO............',
]))
# ---- composing a frame --------------------------------------------------------------------------------------------
R_STEP = {'walk1': ('contactA', 0), 'walk2': ('passA', -1), 'walk3': ('contactB', 0), 'walk4': ('passB', -1)}
R_SN_STEP = {'S': {'stand': 'stand', 'contactA': 'lowL', 'passA': 'upL', 'contactB': 'lowR', 'passB': 'upR'},
             # away from the eye the reaching foot goes up the screen: at contact A the right (the eye's right) reaches
             # away and the left pushes off toward the eye — the eye's left hangs lower, as facing it
             'N': {'stand': 'stand', 'contactA': 'lowL', 'passA': 'upR', 'contactB': 'lowR', 'passB': 'upL'}}
R_HAND = {'E': (16, 30), 'S': (11, 30), 'N': (20, 30)}   # the right hand's texel at rest: still, inside the cloak


def reaper(fc, frame):
    step, dy = R_STEP.get(frame, ('stand', 0))
    g = blank(32, 40)
    if fc == 'E':
        y0, hem = R_E_HEM[step]
        stamp(g, 0, 20 + dy, R_E_CLOAK)
        stamp(g, 0, y0, hem)
        stamp(g, 0, 12 + dy, R_E_HOOD)
        hand = [R_HAND['E'][0], R_HAND['E'][1] + dy]
        if frame == 'aim':
            ya, blk = R_AIM
            stamp(g, 0, ya, blk)
            hand = [19, 21]   # on the grip under the action
    else:
        y0, hem = R_SN_HEM[R_SN_STEP[fc][step]]
        stamp(g, 0, 20 + dy, R_S_CLOAK if fc == 'S' else R_N_CLOAK)
        stamp(g, 0, y0, hem)
        stamp(g, 0, 12 + dy, R_S_HOOD if fc == 'S' else R_N_HOOD)
        hand = [R_HAND[fc][0], R_HAND[fc][1] + dy]
    out = rows(g)
    if frame == 'idle2':
        out = breath(out, (('L', 'C'), ('I', 'h'), ('I', 'H')))
    return out, hand, dy


# =====================================================================================================================
# THE LAMPLIGHTER — the exile on the ridge (tall grid 32×40, soles on row 38): the Reapers' cut to the texel (the mist
# dresses everyone the same) — and every difference a person makes: a face in the hood; the Waylighter's scarf, faded to
# the exiles' khaki, at the throat; a warm binding down the seam and round the hem; boots under it; the C14 across the back
# (the muzzle up past the right shoulder, the butt out past the left hip, the sling over the chest); the left hand on the
# sling; in the right hand, low, the HOODED LANTERN — one gold slit where the light escapes.
# Letters: H/h/I hood · S/s/e the face · T/t the scarf · C/D/L cloak · c the warm binding · B/b boots
#          w barrel and the lantern's iron · W steel (the muzzle's crown, the bolt) · V/v the stock · N/n the sling
#          X the slit's gold, x its brass rim
# =====================================================================================================================
L_BASE = {'O': '#12161c', 'H': '#262b33', 'S': '#d8b894', 'e': '#2a2118', 'C': '#1f242b', 'c': '#8a7250',
          'T': '#a8925e', 't': '#826f4a', 'B': '#23282f', 'b': '#171b21'}
L_GEAR = {'X': '#ffd98f', 'x': '#b08440', 'w': '#3a4048', 'W': '#8d979c', 'N': '#4a3a2a', 'n': '#33281d',
          'V': '#6b4a30', 'v': '#4a3320'}

L_S_UP = grid32([   # rows 12..36, facing the eye (the right hand and its lantern are their own block)
    '.........O.....OO...............',
    '........OWO...OIIO..............',   # 13 the muzzle's crown, up past the right shoulder
    '........OwO..OIIHHO.............',
    '........OwO.OIIHHHhO............',
    '.........OwOIHhhhhhhO...........',   # 16 the barrel shares the hood's edge down to the shoulder
    '.........OwOHhssssshO...........',
    '.........OwOHseSSeshO...........',   # 18 a face in the hood's shadow
    '.........OwOhhsSSshhO...........',
    '..........OIINTTTTTHhO..........',   # 20 the scarf at the throat; the sling over the right shoulder
    '..........OIHNNhhhhhhO..........',
    '..........OLHhNNhhhhDO..........',
    '..........OLChhNNhhCDO..........',
    '..........OLCChhSSNCDO..........',   # 24 the left hand on the sling, out of the cloak's opening
    '..........OLCCChSsNNDO..........',
    '..........OLCCCCcCCNNO..........',   # 26 the warm binding down the seam
    '.........OLCCCCCcCCCNNO.........',
    '.........OLCCCCCcCCCDNNO........',
    '.........OLCCCCCcCCCDDVO........',   # 29 the stock out past the left hip
    '........OLCCCCCCcCCDCDVVO.......',
    '........OLCCCCCCcCCDCDOvvO......',
    '........OLCCCCCCcCCDCCDOnO......',
    '........OLCCCCCCcCCDCCDOO.......',
    '........OLCCCCCCcCCDCCDO........',
    '........OcccccccccccccDO........',   # 35 the warm hem
    '........OOOOOOOOOOOOOOOO........',
])
L_N_UP = grid32([   # rows 12..36, away from the eye: the rifle whole across the back, muzzle up past the right shoulder
    '...............OO.......O.......',
    '..............OIIO.....OWO......',   # 13 the muzzle's crown
    '.............OIIHHO....OwO......',
    '............OIIHHHhO..OwO.......',
    '...........OIHHHHHHhO.OwO.......',
    '...........OHHHHHHHhOOwO........',
    '...........OHHHHHHHhOwO.........',
    '...........OhHHHHHHhOwO.........',
    '..........OIIHHHHHHhwwO.........',   # 20 over the right shoulder
    '..........OIHHHHHHhwwhO.........',
    '..........OLHHHHHHwwhDO.........',
    '..........OLCHHHHwwhCDO.........',
    '..........OLCChHwwhDCDO.........',
    '..........OLCCChWWDCCDO.........',   # 25 the bolt
    '..........OLCCCVVvCCCDO.........',
    '.........OLCCCVVvcCCCDDO........',   # 27 the stock
    '.........OLCCVVvCcCCDCDO........',
    '.........OLCVVvCCcCCDCDO........',
    '........OnVVvCCCCcCCDCCDO.......',   # 30 the butt out past the left hip
    '........OnnOCCCCCcCCDCCDO.......',
    '........OOLCCCCCCcCCDCCDO.......',
    '........OLCCCCCCcCCDCCDO........',
    '........OLCCCCCCcCCDCCDO........',
    '........OcccccccccccccDO........',
    '........OOOOOOOOOOOOOOOO........',
])
L_E_UP = grid32([   # rows 12..36, the side: the rifle's line up the back past the hood, the sling across the chest
    '..........O.OO..................',
    '.........OWOIIOO................',   # 13 the muzzle's crown behind the hood
    '.........OwOIHHHOO..............',
    '.........OwOIHHHHHOO............',
    '.........OwOHHHHHHhhhO..........',
    '.........OwOHHHHhhseSO..........',   # 17 the face in profile, the eye under the brow
    '.........OwOhHHHhhsSSO..........',
    '.........OwOhhHHhhhsSO..........',
    '..........OIhhNhhhhTTO..........',   # 20 the scarf at the throat; the sling over the shoulder
    '..........OLIhhNNhhhtO..........',
    '..........OLCHhhhNNhDO..........',
    '..........OLCCDhhhhNNO..........',   # 23 the sling goes round to the far hip
    '..........OLCCDCChhhcO..........',
    '..........OLCCDCCChhcO..........',
    '..........OLCCDCCCCDcO..........',
    '.........OLCCCDCCCCDcO..........',
    '........OVOLCCDCCCCDCcO.........',   # 28 the stock out behind the hip
    '.......OVVOLCCCDCCCDCcO.........',
    '.......OvvOLCCCCDDCDCcO.........',
    '.......OnOOLCCCCCCCDCCcO........',
    '........OOLCCCCCCCCDCCcO........',
    '........OLCCCCCCCCDCCCcO........',
    '........OLCCCCCCCCDCCCcO........',
    '........OccccccccccccccO........',
    '........OOOOOOOOOOOOOOOO........',
])

# the lantern in the right hand, low: the block's top-left at rest, then its rows. The hand comes out at the cloak's edge
# onto the bail; the lantern hangs under it, hooded, the light out of one slit (the renderer's glow goes on `light`).
L_LANTERN = {   # held low at the thigh; the warm hem band shows under the base, so no outline doubles the hem's
    'S': (6, 25, [   # the hand and the bail take their outline from the law, only where they meet the air
        '.......',
        '...S...',   # the hand out at the cloak's edge, on the bail
        '...s...',
        '...w...',
        '.OOwOO.',
        '.OwwwO.',   # the hood over the light
        'OwwwwwO',
        'OxXXXxO',   # the one slit
        'OwwwwwO',
        '.OOOOO.',
    ]),
    'E': (14, 25, [   # the near hand before the body, the lantern hanging in front of the cloak
        '...O...',
        '..OSO..',
        '..OsO..',
        '..OwO..',
        '.OOwOO.',
        '.OwwwO.',
        'OwwwwwO',
        'OxXXXxO',
        'OwwwwwO',
        '.OOOOO.',
    ]),
    'N': (20, 25, [
        '.......',
        '...S...',
        '...s...',
        '...w...',
        '.OOwOO.',
        '.OwwwO.',
        'OwwwwwO',
        'OxXXXxO',
        'OwwwwwO',
        '.OOOOO.',
    ]),
}
L_SWING = {   # the lantern sways on its bail with the stride, sideways (its base never meets the hem's outline)
    'E': {'back': (-1, 0), 'fwd': (1, 0)},
    'S': {'back': (-1, 0), 'fwd': (1, 0)},
    'N': {'back': (1, 0), 'fwd': (-1, 0)},
}
# the stride under the hem is the courier's own legs (PIN_LEGS), stamped 8 rows down on the tall grid: only the boots show
L_STEP = {'walk1': ('contactA', 0, 'back'), 'walk2': ('passA', -1, 'hang'), 'walk3': ('contactB', 0, 'fwd'),
          'walk4': ('passB', -1, 'hang')}


def lamplighter(fc, frame):
    step, dy, swing = L_STEP.get(frame, ('stand', 0, 'hang'))
    g = blank(32, 40)
    stamp(g, 8, 33, PIN_LEGS[fc][step])                                    # the boots, on the ground
    stamp(g, 0, 12 + dy, {'S': L_S_UP, 'E': L_E_UP, 'N': L_N_UP}[fc])     # the cloaked body, risen on a passing step
    x0, y0, blk = L_LANTERN[fc]
    ddx, ddy = L_SWING[fc].get(swing, (0, 0))
    stamp(g, x0 + ddx, y0 + ddy + dy, blk)
    hand = next([x0 + ddx + i, y0 + ddy + dy + j] for j, s in enumerate(blk) for i, ch in enumerate(s) if ch == 'S')
    light = next([x0 + ddx + i, y0 + ddy + dy + j] for j, s in enumerate(blk) for i, ch in enumerate(s) if ch == 'X')
    out = rows(g)
    if frame == 'idle2':
        out = breath(out, (('L', 'C'), ('I', 'h'), ('I', 'H')))
    return out, hand, dy, [light[0] + 1, light[1]]


# =====================================================================================================================
# THE STRANGER — the raised-tongue stranger out of the bunker (courier grid 32×32, soles on row 30): olive coveralls,
# bunker-clean, zipped to a turned collar and belted in their own cloth; the leaf-green sash of an assigned career over the
# right shoulder to the left hip; hair cut short and parted; a face that has never seen weather; wire spectacles, one lens
# catching the light. Empty-handed. The arms and legs are the courier's own (the legs in coverall cloth).
# Letters: H/h/I hair · S/s/e the face · w the spectacles' wire, W the glint · C/D/L the coveralls · c the seams, the
#          collar, the zip, the belt · T/t the sash · B/b boots
# =====================================================================================================================
COURIER_GRID = {'w': 32, 'h': 32, 'ax': 16, 'sole': 30}
ST_BASE = {'O': '#12161c', 'H': '#3a2e26', 'S': '#d8c9b8', 'e': '#2a2118', 'C': '#5a6e52', 'c': '#435239',
           'T': '#8fb08a', 't': '#6e8c6a', 'B': '#2a3328', 'b': '#1c231b'}
ST_GEAR = {'W': '#fff2c8', 'w': '#5e646c'}

ST_S_HEAD = [   # at (11, 9)
    '..OOOOOO..',
    '.OIIIIHHO.',
    'OIIHHHHHhO',
    'OHHSSSSHhO',
    'OHwWwwewhO',   # the wire across the eyes, the right lens (the eye's left) catching the light
    'OhSSSSSShO',
    '.OhsSSshO.',
]
ST_S_TORSO = [  # at (10, 16): the turned collar, the zip, the sash right shoulder to left hip, the belt, the hips
    '...OcSScO...',
    'OLTTcccLLLLO',
    'OCTTtCcCCLCO',
    'OCDTTtcCCCDO',
    'OCDCTTtCCCDO',
    'OCDCCTTtCCDO',
    'OcccccTTtccO',
    'OCDCCCcTTtDO',
    'ODDCCCcCTTtO',
    'ODDCCCOCCTTO',
]
ST_E_HEAD = [   # at (12, 9): the parted hair, the wire's arm back to the ear, the lens at the eye
    '..OOOOO...',
    '.OIIIIHO..',
    'OIIHHHHHO.',
    'OHHHHHSSO.',
    'OHHhwwWeSO',
    'OhHhSSSSSO',
    '.OhhsSSSO.',
]
ST_E_TORSO = [  # at (12, 16): the back straight, the sash over the near shoulder and down the chest, the belt
    '...OcSSO..',
    '.OLTTTcLO.',
    '.OCCtTTTO.',
    '.ODCCCtTO.',
    '.ODCCCCtO.',
    '.ODCCCCcO.',
    '.OcccccTO.',
    '.ODCCCCcO.',
    '.ODDCCCcO.',
    '.OODDCCcO.',
]
ST_N_HEAD = [   # at (11, 9): the back of the head, the hair cut square to the collar, the ears
    '..OOOOOO..',
    '.OIIIIHHO.',
    'OIIHHHHHhO',
    'OHHHHHHHhO',
    'OsHHHHHHsO',
    'OhHHHHHHhO',
    '.OhhhhhhO.',
]
ST_N_TORSO = [  # at (10, 16): the collar at the nape, the sash across the back from the right shoulder, the belt
    '...OccccO...',
    'OLLLcccLTTLO',
    'OCLCCcCTTtCO',
    'OCDCCcTTtCDO',
    'OCDCCTTtCCDO',
    'OCDCTTtcCCDO',
    'OcccTTtccccO',
    'OCDTTtcCCCDO',
    'ODTTtCcCCCDO',
    'ODDCCCOCCDDO',
]
ST_LEGS = str.maketrans('Pp', 'CD')   # the courier's legs, in coverall cloth

# the stride, by the law's steps: legs, the rise, the right arm, the left arm
PEOPLE_STEP = {'idle': ('stand', 0, 'hang', 'hang'), 'idle2': ('stand', 0, 'hang', 'hang'),
               'walk1': ('contactA', 0, 'back', 'fwd'), 'walk2': ('passA', -1, 'hang', 'hang'),
               'walk3': ('contactB', 0, 'fwd', 'back'), 'walk4': ('passB', -1, 'hang', 'hang')}
# away from the eye an arm swung back comes toward the eye (the longer block), one swung forward goes away (the shorter)
N_SWING = {'hang': 'hang', 'back': 'fwd', 'fwd': 'back'}


def stranger(fc, frame):
    step, dy, armR, armL = PEOPLE_STEP[frame]
    g = blank(32, 32)
    if fc == 'E':
        stamp(g, 8, 25, [s.translate(ST_LEGS) for s in PIN_LEGS['E'][step]])
        stamp(g, 12, 9 + dy, ST_E_HEAD)
        stamp(g, 12, 16 + dy, ST_E_TORSO)
        ax, ay, blk = PIN_E_ARM[armR]
        stamp(g, ax, ay + dy, blk)
        hand = hand_of(blk, ax, ay + dy)
    else:
        stamp(g, 8, 25, [s.translate(ST_LEGS) for s in PIN_LEGS[fc][step]])   # facing away: the heels
        stamp(g, 11, 9 + dy, ST_S_HEAD if fc == 'S' else ST_N_HEAD)
        stamp(g, 10, 16 + dy, ST_S_TORSO if fc == 'S' else ST_N_TORSO)
        if fc == 'S':   # the right arm on the eye's left
            left, right = armR, armL
        else:           # away: the right arm on the eye's right
            left, right = N_SWING[armL], N_SWING[armR]
        dxl, bl = arm_rows(left, 'L'); stamp(g, 7 + dxl, 18 + dy, bl)
        dxr, br = arm_rows(right, 'R'); stamp(g, 22 - dxr, 18 + dy, br)
        hand = hand_of(bl, 7 + dxl, 18 + dy) if fc == 'S' else hand_of(br, 22 - dxr, 18 + dy)
    out = rows(g)
    if frame == 'idle2':
        out = breath(out)
    return out, hand, dy


# =====================================================================================================================
# THE TENDER — the Flame Keepers' tender who stands the fed bowl (courier grid 32×32, soles on row 30; the courier's
# height, as the old tender stood the old walker's): a hooded robe to the ground in the Keepers' red, a cord at the waist,
# wide sleeves; the TORCH held up in the right hand, its flame above the hood. The hood is the courier's own hood shape.
# Letters: H/h/I the hood · S/s/e the face · C/D/L the robe · c its folds and hem · T/t the cord · V/v the torch's haft ·
#          n the pitch-wrapped head · X the flame's heart, x its edge
# =====================================================================================================================
TE_BASE = {'O': '#12161c', 'H': '#642a2a', 'S': '#d8b890', 'e': '#2a2118', 'C': '#8a3a2a', 'c': '#5e2820',
           'T': '#a08050', 't': '#7a6040', 'B': '#23282f', 'b': '#171b21'}
TE_GEAR = {'X': '#ffd98f', 'x': '#ffb54f', 'V': '#6e5230', 'v': '#4a3320', 'n': '#2e2218'}

TE_TORCH = [   # the flame, the pitch-wrapped head, the haft down into the hand (5 wide, the haft on the middle column)
    '..O..',
    '.OxO.',
    'OxXxO',
    'OXXXO',
    'OxXxO',
    'OnnnO',
    '.OVO.',
    '.OVO.',
    '.OVO.',
    '.OVO.',
    '.OvO.',
]
TE_N_HOOD = [   # at (11, 9): the hood from behind, its seam
    ' OOOOOOOO ',
    'OIIIIIIHHO',
    'OIHHHHHHHO',
    'OHHHHHhHHO',
    'OHHHHHhHHO',
    'OhHHHHhHhO',
    'OhhhhhhhhO',
]
TE_ROBE = {   # rows 16..30 at x=0: the robe to the ground, the cord at the waist; the hanging (left) arm in its sleeve
    'E': grid32([
        '............OhhhhhhO............',
        '............OLLLLLLO............',
        '............OCCCCCLCO...........',
        '............ODCCCCCCO...........',
        '............ODCCCCCcO...........',
        '............OTTTTTTtO...........',
        '............ODCCCCcCO...........',
        '...........ODCCCCcCCO...........',
        '...........ODCCCcCCCO...........',
        '...........ODCCCcCCCCO..........',
        '...........ODCCcCCCCCO..........',
        '..........ODDCCcCCCCCO..........',
        '..........ODDCCcCCCCCO..........',
        '..........OccccccccccO..........',
        '..........OOOOOOOOOOOO..........',
    ]),
    'S': grid32([
        '...........OhhhsSshhhO..........',
        '..........OLLLLLLLLLLOOO........',
        '..........OCCCCCCCCCDOCDO.......',
        '..........OCCCcCCcCCDOCDO.......',
        '..........OCCCcCCcCCDOCDO.......',
        '..........OTTTTTTTTTtOCDO.......',
        '..........OCCCcCCcCCDOccO.......',
        '.........OCCCCcCCcCCDDOO........',
        '.........OCCCCcCCcCCCDO.........',
        '.........OCCCcCCCCcCCDO.........',
        '.........OCCCcCCCCcCCDDO........',
        '........OCCCCcCCCCcCCCDO........',
        '........OCCCCcCCCCcCCCDO........',
        '........OccccccccccccccO........',
        '........OOOOOOOOOOOOOOOO........',
    ]),
    'N': grid32([
        '...........OhhhhhhhhhO..........',
        '........OOOLLLLLLLLLLO..........',
        '.......OCDOCCCCCcCCCDO..........',
        '.......OCDOCCCCCcCCCDO..........',
        '.......OCDOCCCCCcCCCDO..........',
        '.......OCDOTTTTTTTTTtO..........',
        '.......OccOCCCCCcCCCDO..........',
        '........OODCCCCCcCCCCDO.........',
        '.........ODCCCCCcCCCCDO.........',
        '.........ODCCCCCcCCCCDO.........',
        '........ODCCCCCCcCCCCDO.........',
        '........ODCCCCCCcCCCCCDO........',
        '........ODCCCCCCcCCCCCDO........',
        '........OccccccccccccccO........',
        '........OOOOOOOOOOOOOOOO........',
    ]),
}
TE_ARM = {   # the right arm raised, the hand on the haft; (x, y) of the torch block, then the arm's rows at x=0
    'E': ((22, 2), grid32([   # forward of the face: the forearm up from the elbow, the sleeve fallen back to it
        '................................',   # 12
        '.......................OSSO.....',   # 13 the hand round the haft
        '.......................OsSO.....',
        '......................OLCcO.....',   # 15 the sleeve's cuff
        '....................OLCCDO......',
        '.................OLLCCDOO.......',   # 17 the sleeve to the shoulder
        '................OCCCDDO.........',
    ])),
    'S': ((6, 2), grid32([   # on the eye's left: up beside the hood
        '................................',
        '.......OSSSO....................',
        '.......OsSsO....................',
        '.......OLCcO....................',
        '.......OLCDO....................',
        '.......OLCDO....................',
        '........OLCDO...................',
    ])),
    'N': ((21, 2), grid32([   # on the eye's right: up beside the hood
        '................................',
        '......................OSSSO.....',
        '......................OsSsO.....',
        '......................OLCcO.....',
        '......................OLCDO.....',
        '......................OLCDO.....',
        '.....................OLCDO......',
    ])),
}


def tender(fc, frame):
    g = blank(32, 32)
    stamp(g, 0, 16, TE_ROBE[fc])
    if fc == 'E':
        stamp(g, 12, 9, PIN_E_HEAD)
    elif fc == 'S':
        stamp(g, 11, 9, PIN_S_HEAD)
    else:
        stamp(g, 11, 9, TE_N_HOOD)
    (tx, ty), arm = TE_ARM[fc]
    stamp(g, 0, 12, arm)
    stamp(g, tx, ty, TE_TORCH)
    hand = next([x, 12 + j] for j, s in enumerate(arm) for x, ch in enumerate(s) if ch == 'S')
    light = [tx + 2, ty + 3]   # the flame's heart
    out = rows(g)
    if frame == 'idle2':   # the breath, and the flame's heart drawn up a row (the silhouette holds)
        out = breath(out)
        f = [list(s) for s in out]
        f[ty + 2][tx + 2], f[ty + 3][tx + 2] = 'X', 'x'
        out = [''.join(s) for s in f]
    return out, hand, 0, light


# =====================================================================================================================
# THE FAR SHAPE — the giant in the grey (its own grid 40×64, the axis at column 20, soles on row 62; drawn at 2.5 world
# units a texel like everything else, so it stands 63 texels = the old 156 units). A machine silhouette punched out of the
# ghost-light: two leg columns on broad feet, knee housings high under the hull, the hull over the mist, a shoulder block
# on each side (the right a row lower), and on top a head-shape too small for the hull and a texel off its axis, its crown
# cut on a slant — wrong for it. The dusk finds the top edges (the rim); one red running light for an eye.
# Letters: O the body (near-black) · c/t the housings' and plates' faces (near-blacks) · C the shoulders' dimmer rim ·
#          L the rim along the hull's and the head's top edges · X the running light, x its hot point
# =====================================================================================================================
GIANT_GRID = {'w': 40, 'h': 64, 'ax': 20, 'sole': 62}
G_BASE = {'O': '#090b0e', 'H': '#12161c', 'S': '#090b0e', 'e': '#090b0e', 'C': '#6e7883', 'c': '#13171d',
          'T': '#1b2027', 't': '#0f1217', 'B': '#12161c', 'b': '#0d1015'}
G_GEAR = {'X': '#c25038', 'x': '#ff8a6a'}
GIANT = [   # rows 0..63 on its own grid (the axis at column 20)
    '........................................',  # 0
    '......................OOOO..............',  # 1 the crown, cut on a slant
    '...................OOOLLLO..............',  # 2
    '................OOOLLLOOOO..............',  # 3
    '................OLLOOOOOOO..............',  # 4
    '................OOTTxXTTOO..............',  # 5 the visor band, the running light
    '................OOOOOOOOOO..............',  # 6
    '................OOOccccOOO..............',  # 7 the grille, one slot
    '.................OOOOOOOO...............',  # 8
    '..................OOOOOO................',  # 9
    '...................OOOO.................',  # 10 the neck
    '.........OOOOOOOOOOOOOOOOOOOOOO.........',  # 11 the hull's back, rounded
    '.......OOLLLLLLLLLLOOOOLLLLLLLLOO.......',  # 12 the rim, broken in the neck's shadow
    '......OLLOOOOOOOOOOOOOOOOOOOOOOLLO......',  # 13
    '.....OLOOOOOOOOOOOOOOOOOOOOOOOOOOLO.....',  # 14
    '...OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.....',  # 15 the left shoulder block's top, chamfered
    '..OCCOOOOTTTTTTTTTTOOTTTTTTTTTTOOOOOO...',  # 16 the chest plates; the right shoulder's top, a row lower
    '.OCOOOOOTTTTTTTTTTTOOTTTTTTTTTTTOOOCCO..',  # 17
    '.OOOOOOOTTTTTTTTTTTOOTTTTTTTTTTTOOOOOCO.',  # 18
    '.OOOOOOOTTTTTTTTTTTOOTTTTTTTTTTTOOOOOOO.',  # 19
    '.OOOOOOOTTTTTTTTTTTOOTTTTTTTTTTTOOOOOOO.',  # 20
    '.OOOOOOOOTTTTTTTTTTOOTTTTTTTTTTOOOOOOOO.',  # 21
    '.OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.',  # 22 the seam under the plates
    '.OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.',  # 23
    '.OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.',  # 24
    '.OOOOOOOOOccccccccOOOOccccccccOOOOOOOOO.',  # 25 the vents
    '.OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.',  # 26
    '.OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.',  # 27 the shoulders' foot
    '.....OOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.....',  # 28
    '.....OOOOOOOOOOOOOOOOOOOOOOOOOOOOOO.....',  # 29
    '......OOOOOOOOOOOOOOOOOOOOOOOOOOOO......',  # 30 the underside, drawn in
    '.......OOOOOOOOOOOOOOOOOOOOOOOOOO.......',  # 31
    '........OOOOOOOOOOOOOOOOOOOOOOOO........',  # 32
    '.........OOOOOOOOOOOOOOOOOOOOOO.........',  # 33
    '.........OOOOOOOO.......OOOOOO..........',  # 34 the knee housings, high under the hull
    '.........OCCCCCCO......OOOOOOOO.........',  # 35
    '.........OTTTTTTO......OCCCCCCO.........',  # 36
    '.........OTTTTTTO......OTTTTTTO.........',  # 37
    '.........OTTTTTTO......OTTTTTTO.........',  # 38
    '.........OTTTTTTO......OTTTTTTO.........',  # 39
    '.........OTTTTTTO......OTTTTTTO.........',  # 40
    '.........OTTTTTTO......OTTTTTTO.........',  # 41
    '.........OOOOOOOO......OOOOOOOO.........',  # 42
    '..........OOOOOO........OOOOOO..........',  # 43 the leg columns
    '..........OOccOO........OOccOO..........',  # 44
    '..........OOccOO........OOccOO..........',  # 45
    '..........OOccOO........OOccOO..........',  # 46
    '..........OOccOO........OOccOO..........',  # 47
    '..........OOccOO........OOccOO..........',  # 48
    '..........OOccOO........OOccOO..........',  # 49
    '..........OOccOO........OOccOO..........',  # 50
    '..........OOccOO........OOccOO..........',  # 51
    '..........OOccOO........OOccOO..........',  # 52
    '..........OOccOO........OOccOO..........',  # 53
    '..........OOccOO........OOccOO..........',  # 54
    '..........OOccOO........OOccOO..........',  # 55
    '..........OOccOO........OOccOO..........',  # 56
    '..........OOOOOO........OOOOOO..........',  # 57
    '..........OOOOOO........OOOOOO..........',  # 58 the ankles
    '.........OOttttOO......OOttttOO.........',  # 59 the feet, the insteps
    '........OOOOOOOOO......OOOOOOOOO........',  # 60
    '........OOOOOOOOO......OOOOOOOOO........',  # 61
    '........OOOOOOOOO......OOOOOOOOO........',  # 62 the ground
    '........................................',  # 63
]
GIANT_EYE = [20, 5]   # the running light: x (its hot point) at (20, 5), X beside it at (21, 5)


# =====================================================================================================================
# THE SET: every frame composed, the outline law closed; checked; written
# =====================================================================================================================
WALK = ['idle', 'idle2', 'walk1', 'walk2', 'walk3', 'walk4']
FIGURES = {   # name: (grid, base, gear, composer, frames per facing, notes)
    'reaper': (TALL, R_BASE, R_GEAR, reaper, {'E': WALK + ['aim'], 'S': WALK, 'N': WALK},
               'The Reapers: the mist\'s own uniform — the procession\'s hooded file and the ride\'s firing line. A tall hood cut to '
               'a short point, the face a dark slit with two pale eyes (X near, x far), the cowl to a point on the chest, the '
               'cloak A-lined to a torn hem. No hands at rest: `hand` is where the right hand rests inside the cloak. The stride '
               'is the hem\'s (a boot\'s toe at the reach, the planted boot under the risen hem). E `aim`: the rifle level out of '
               'the cloak under the eyes — the right hand on the grip under the action (W), the left far out under the fore-end, '
               'dark gloves, the long barrel (w).'),
    'lamplighter': (TALL, L_BASE, L_GEAR, lamplighter, {'E': WALK, 'S': WALK, 'N': WALK},
                    'The Lamplighter on the ridge: the Reapers\' cut to the texel, and a person in it — a face in the hood, the '
                    'faded khaki scarf at the throat, the warm binding down the seam and round the hem, boots under it. The '
                    'HOODED LANTERN hangs low from the RIGHT hand (one gold slit X, brass rim x; `light` is the slit\'s middle for '
                    'the glow); the LEFT hand holds the sling at the chest. The C14 across the back: muzzle up past the right '
                    'shoulder, butt out past the left hip, the sling over the chest.'),
    'stranger': (COURIER_GRID, ST_BASE, ST_GEAR, stranger, {'E': WALK, 'S': WALK, 'N': WALK},
                 'The raised-tongue stranger out of the bunker: olive coveralls zipped to a turned collar and belted in their own '
                 'cloth, the leaf-green sash of an assigned career over the right shoulder to the left hip, hair short and parted, '
                 'a face that has never seen weather, wire spectacles (w) with the right lens catching the light (W). Empty-'
                 'handed; `hand` is the bare right hand. Arms and legs are the courier\'s own blocks (legs in coverall cloth).'),
    'tender': (COURIER_GRID, TE_BASE, TE_GEAR, tender, {'E': ['idle', 'idle2'], 'S': ['idle', 'idle2'], 'N': ['idle', 'idle2']},
               'The Flame Keepers\' tender who stands the fed bowl: a hooded robe to the ground in the Keepers\' red, a cord at '
               'the waist, the courier\'s hood shape; the TORCH held up in the RIGHT hand in every frame (haft V/v, the pitch-'
               'wrapped head n, the flame X heart / x edge above the hood; `light` is the flame\'s heart). The left arm hangs '
               'in its sleeve. idle2: the breath, and the flame\'s heart drawn up a row.'),
}


def giant(fc, frame):
    return list(GIANT), None, 0


def build():
    """{name: {'grid','frames','hand','dy','light'?}} — every frame through the outline law"""
    out = {}
    for name, (grid, base, gear, fn, facings, notes) in FIGURES.items():
        fr, hd, dys, lt = {}, {}, {}, {}
        for fc, frames in facings.items():
            fr[fc], hd[fc], dys[fc], lt[fc] = {}, {}, {}, {}
            for f in frames:
                res = fn(fc, f)
                r, hand, dy = res[0], res[1], res[2]
                fr[fc][f] = close_outline(r)
                hd[fc][f] = list(hand)
                dys[fc][f] = dy
                if len(res) > 3:
                    lt[fc][f] = list(res[3])
        out[name] = {'grid': grid, 'frames': fr, 'hand': hd, 'dy': dys, 'light': lt if any(lt.values()) else None,
                     'base': base, 'gear': gear, 'notes': notes}
    out['giant'] = {'grid': GIANT_GRID, 'frames': {'S': {'idle': list(GIANT)}}, 'hand': {'S': {'idle': None}},
                    'dy': {'S': {'idle': 0}}, 'light': None, 'eye': GIANT_EYE, 'base': G_BASE, 'gear': G_GEAR,
                    'notes': 'The far shape in the grey, COLOSSAL: 63 texels crown to sole (the old 156 world units at 2.5 a texel). '
                             'One frame, facing the eye. Near-black body (O) with near-black plate faces (T, c, t); the dusk\'s rim (L) '
                             'along the hull\'s and the crown\'s top edges, a dimmer rim (C) on the shoulder blocks and the knee '
                             'housings; one red running light in the visor band — `eye` is its hot point x at (20, 5), X beside it '
                             'at (21, 5) (pulse the pair between X and x as the old eye did). The head stands a texel right of the '
                             'axis and its crown is cut on a slant; the right shoulder and knee housing sit a row lower.'}
    return out


def check(sets):
    """STYLE.md's checks, printed: sizes, letters, the breath's mask, the soles, the outline law; and no orphan outline
    (an outline texel with nothing coloured beside it: the mark of a doubled outline)"""
    bad, warn, n = [], [], 0
    for name, s in sets.items():
        w, h, sole = s['grid']['w'], s['grid']['h'], s['grid']['sole']
        for fc, frames in s['frames'].items():
            for f, r in frames.items():
                n += 1
                tag = f'{name}.{fc}.{f}'
                if len(r) != h or any(len(x) != w for x in r):
                    bad.append(f'{tag}: not {w}×{h}')
                    continue
                for y, row in enumerate(r):
                    for x, ch in enumerate(row):
                        if ch != '.' and ch not in LETTERS:
                            bad.append(f'{tag}: letter {ch!r} at {x},{y}')
                        if ch in '.O':
                            continue
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                            xx, yy = x + dx, y + dy
                            if not (0 <= xx < w and 0 <= yy < h):
                                if not (ch == 'b' and dy == 1):
                                    bad.append(f'{tag}: {ch} at {x},{y} on the grid\'s edge')
                            elif r[yy][xx] == '.' and not (ch == 'b' and dy == 1):
                                bad.append(f'{tag}: {ch} at {x},{y} meets the air without its outline')
                if f == 'idle':
                    filled = [y for y, row in enumerate(r) if row.strip('.')]
                    if filled[-1] != sole:
                        bad.append(f'{tag}: lowest texel on row {filled[-1]}, not the sole row {sole}')
                if name != 'giant':
                    for y, row in enumerate(r):
                        for x, ch in enumerate(row):
                            if ch != 'O':
                                continue
                            nb = [r[y + dy][x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
                                  if 0 <= x + dx < w and 0 <= y + dy < h]
                            if '.' in nb and all(c in '.O' for c in nb) and not any(
                                    r[y + dy][x + dx] not in '.O' for dx in (-1, 0, 1) for dy in (-1, 0, 1)
                                    if 0 <= x + dx < w and 0 <= y + dy < h):
                                warn.append(f'{tag}: orphan outline at {x},{y}')
            if 'idle2' in frames:
                m1 = [[c != '.' for c in row] for row in frames['idle']]
                m2 = [[c != '.' for c in row] for row in frames['idle2']]
                if m1 != m2:
                    bad.append(f'{name}.{fc}: idle2\'s silhouette differs from idle\'s')
    return bad, warn, n


def pal_of(s):
    """the palette as the integration reads it: the base letters and the gear letters it uses"""
    used = {ch for fr in s['frames'].values() for r in fr.values() for row in r for ch in row if ch != '.'}
    p = dict(s['base'])
    p.update({k: v for k, v in s['gear'].items() if k in used})
    return p


def pal_full(s):
    """every letter the rows use, as drawn: the base, what derive() makes of it, the gear"""
    used = {ch for fr in s['frames'].values() for r in fr.values() for row in r for ch in row if ch != '.'}
    d = full_pal(s['base'], s['gear'])
    return {k: d[k] for k in sorted(used)}


def to_json(sets):
    out = {'family': 'dark', 'grid': COURIER_GRID, 'figures': {}}
    for name, s in sets.items():
        f = {'grid': s['grid'], 'frames': s['frames'], 'hand': s['hand'], 'dy': s['dy'], 'pal': pal_of(s),
             'palFull': pal_full(s), 'notes': s['notes']}
        if s.get('light'):
            f['light'] = s['light']
        if s.get('eye'):
            f['eye'] = s['eye']
        out['figures'][name] = f
    return out


def sheet(sets, path, k=8):
    """every frame of every figure at k×, a band per figure and facing, each figure in its own palette, labelled"""
    pad, lab, capw = 10, 16, 0
    f = font(11)
    bands = []
    for name, s in sets.items():
        P = full_pal(s['base'], s['gear'])
        for fc in ('E', 'S', 'N'):
            if fc in s['frames']:
                bands.append([(f'{name} {fc} {fr}', r, P, s['grid']['ax']) for fr, r in s['frames'][fc].items()])
    W = max(pad + sum(len(r[0]) * k + pad for _, r, _, _ in b) for b in bands)
    H = pad + sum(max(len(r) for _, r, _, _ in b) * k + lab + pad for b in bands)
    im = Image.new('RGB', (W, H), '#1b1e24')
    d = ImageDraw.Draw(im)
    y = pad
    for b in bands:
        hmax = max(len(r) for _, r, _, _ in b) * k
        x = pad
        for label, r, P, ax in b:
            w, h = len(r[0]) * k, len(r) * k
            oy = y + hmax - h
            d.rectangle([x, oy, x + w - 1, oy + h - 1], fill='#2a2f37')
            paint(im, r, P, x, oy, k)
            d.line([x + ax * k, oy + h, x + ax * k, oy + h + 3], fill='#9aa2ab')   # the anchor column
            d.text((x, oy + h + 3), label, fill='#9aa2ab', font=f)
            x += w + pad
        y += hmax + lab + pad
    im.save(path)
    return im.size


def lineup_bands(sets, path):
    """each figure's S idle and E idle at 3× on one ground line beside the courier; the far shape at 1× beside a courier
    at 1× (and at 3×, to be read)"""
    CR = courier_rows(); CP = derive(PAL_WALKER)
    P = {n: full_pal(s['base'], s['gear']) for n, s in sets.items()}
    people = [('courier S', CR['S']['idle'], CP), ('courier E', CR['E']['idle'], CP)]
    for n in ('reaper', 'lamplighter', 'stranger', 'tender'):
        for fc in ('S', 'E'):
            people.append((f'{n} {fc}', sets[n]['frames'][fc]['idle'], P[n]))
    far = [('courier', CR['S']['idle'], CP), ('giant', sets['giant']['frames']['S']['idle'], P['giant'])]
    bands = [
        ('3x - each figure\'s S idle and E idle on one ground line beside the courier (3 screen px a texel: the game at 1:1)', people, 3, '#2a2f37', '#3a3f36'),
        ('the same in the grey', people, 3, '#8a949e', '#6e7672'),
        ('1x - the far shape beside a courier (on the ghost-sheet it is drawn against)', far, 1, '#aeb8c2', '#6e7672'),
        ('3x - the far shape beside a courier', far, 3, '#aeb8c2', '#6e7672'),
    ]
    f = font(11)
    pad, cap, gap = 14, 18, 10
    W = max(pad * 2 + sum(len(r[0]) * k for _, r, _ in fr) + gap * (len(fr) - 1) for _, fr, k, _, _ in bands)
    H = pad + sum(cap + max(len(r) for _, r, _ in fr) * k + 16 + pad for _, fr, k, _, _ in bands)
    im = Image.new('RGB', (W, H), '#1b1e24')
    d = ImageDraw.Draw(im)
    y = pad
    for caption, fr, k, bg, ground in bands:
        d.text((pad, y), caption, fill='#e2d6b0', font=f)
        y += cap
        hmax = max(len(r) for _, r, _ in fr) * k
        wsum = sum(len(r[0]) * k for _, r, _ in fr) + gap * (len(fr) - 1)
        base = y + hmax                     # every frame's bottom edge: the row under the soles
        d.rectangle([pad - 6, y, pad + wsum + 5, base - 1], fill=bg)
        d.rectangle([pad - 6, base - k, pad + wsum + 5, base + 2], fill=ground)
        x = pad
        for label, r, pal in fr:
            w, h = len(r[0]) * k, len(r) * k
            paint(im, r, pal, x, base - h, k)
            if k > 1:
                d.text((x, base + 4), label, fill='#9aa2ab', font=f)
            x += w + gap
        y = base + 16 + pad
    im.save(path)
    return im.size


def main():
    sets = build()
    bad, warn, n = check(sets)
    print(f'dark: {len(sets)} figures, {n} frames')
    for name, s in sets.items():
        g = s['grid']
        print(f"  {name:12s} {g['w']}x{g['h']} ax {g['ax']} sole {g['sole']}  " +
              '  '.join(f"{fc}: {len(fr)}" for fc, fr in s['frames'].items()))
    print('checks: every frame its grid\'s size; letters in the law\'s alphabet; idle2\'s silhouette = idle\'s; the soles on '
          'the sole row in idle; every coloured texel closed by its outline; no orphan outline (a doubled edge)')
    print(f'  {"FAIL" if bad else "ok"} — {len(bad)} failures, {len(warn)} warnings')
    for b in bad + warn:
        print('   ', b)
    if bad:
        sys.exit(1)
    if '--check' in sys.argv:
        return
    js = os.path.join(HERE, 'dark.json')
    with open(js, 'w') as fh:
        json.dump(to_json(sets), fh, indent=1)
    os.makedirs(os.path.join(ROOT, 'shots'), exist_ok=True)
    s1 = sheet(sets, os.path.join(ROOT, 'shots', 'dark_sheet.png'))
    s2 = lineup_bands(sets, os.path.join(ROOT, 'shots', 'dark_lineup.png'))
    print(f'wrote tools/dark/dark.json ({os.path.getsize(js)} bytes), shots/dark_sheet.png {s1}, shots/dark_lineup.png {s2}')


if __name__ == '__main__':
    main()
