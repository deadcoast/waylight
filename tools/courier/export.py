#!/usr/bin/env python3
"""Write the courier set into the sprite registry (src/12e_sprites.js), between its markers, and the 8× sheet.

The registry holds what the game draws: the frames as rows, each frame's rise and hand, the anchors where what the
courier carries is lashed (at rest; the game adds the frame's rise), the ribbon's texels for every frame, and the small
glyphs drawn on the courier's grid. Run from anywhere: python3 tools/courier/export.py
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
import courier as C
from draft import render, derive, PAL_WALKER

ROOT = C.ROOT
REG = os.path.join(ROOT, 'src', '12e_sprites.js')
BEGIN, END = '  /* COURIER:BEGIN', '  /* COURIER:END */'

# where what is carried lands on the courier, at rest (x, y on the 32×32 grid); 'back' = drawn before the courier
ANCHORS = {
    'E': {'tower': [9, 10], 'towerBack': True, 'rails': [3], 'railFoot': 24, 'railBack': True,
          'bolt': [9, 13], 'boltFlip': False, 'boltBack': False, 'scar': [14, 17],
          'kin': [1, 18], 'kinBack': False, 'keep': [[6, 26], [9, 26]], 'gift': [4, 9], 'giftBack': False,
          'rag': [2, 5], 'ragFlip': True, 'ragBack': False, 'tools': [4, 10], 'toolsBack': False},
    'S': {'tower': [16, 10], 'towerBack': True, 'rails': [9, 22], 'railFoot': 16, 'railBack': True,
          'bolt': [5, 11], 'boltFlip': False, 'boltBack': True, 'scar': None,
          'kin': None, 'kinBack': True, 'keep': None, 'gift': [12, 5], 'giftBack': True,
          'rag': [22, 5], 'ragFlip': False, 'ragBack': True, 'tools': [20, 10], 'toolsBack': True},
    'N': {'tower': [16, 11], 'towerBack': False, 'rails': [9, 22], 'railFoot': 24, 'railBack': False,
          'bolt': [18, 11], 'boltFlip': True, 'boltBack': False, 'scar': [23, 17],
          'kin': [10, 20], 'kinBack': False, 'keep': [[11, 25], [19, 25]], 'gift': [12, 12], 'giftBack': False,
          'rag': [6, 5], 'ragFlip': True, 'ragBack': False, 'tools': [19, 8], 'toolsBack': False},
}

# the ribbon a lent hand wears: shoulder to hip, over the coat only (never over an arm, the pack or the face)
SASH = {'S': ((12, 17), (19, 24), 'CDLcuTt'), 'E': ((14, 17), (19, 23), 'CDLcu'), 'N': ((7, 16), (8, 19), 'CDL')}   # from behind: over the left shoulder

GLYPHS = {   # drawn on the courier's own grid
    'rag': ['Y...', 'YKKK', 'YKkK', 'YKKk', 'YKK.', 'YK..', 'Y...', 'Y...', 'Y...'],          # the white rag on its switch
    'gift': ['.OOOOO.', 'OKkYkKO', 'OYYYYYO', 'OKkYkKO', '.OOOOO.'],                            # the road's gift, cloth on twine
    'lantern': ['.h.', 'OYO', 'OFO', 'OfO', '.O.'],                                            # the lamp in the hand
    'tool': ['O', 'w', 'w', 'W'],                                                               # a tool's haft over the pack
    'trolley': ['......OOOO......', '......OWWO......', 'OOOOOOOWWOOOOOOO', 'OwwwwwwwwwwwwwwO'],     # the zip's pulley and bar
}
GLYPH_PAL = {'O': '#12161c', 'Y': '#a08050', 'K': '#e8e0c8', 'k': '#b8b09a', 'h': '#8a7a5a', 'F': '#ffd98f',
             'f': '#e0a05e', 'w': '#7a8a8f', 'W': '#b8c2c8'}


def line(a, b):
    (x0, y0), (x1, y1) = a, b
    n = max(abs(x1 - x0), abs(y1 - y0))
    return [(round(x0 + (x1 - x0) * t / n), round(y0 + (y1 - y0) * t / n)) for t in range(n + 1)]


def sash_cells(fc, frame, rows, dy, arm_mask):
    (a, b, ok) = SASH[fc]
    cells, seen = [], set()
    for (x, y) in line((a[0], a[1] + dy), (b[0], b[1] + dy)):
        for (xx, yy, ch) in ((x, y, 'Y'), (x, y + 1, 'y')):
            if (xx, yy) in seen or not (0 <= xx < 32 and 0 <= yy < 32):
                continue
            if rows[yy][xx] in ok and (fc == 'N' or (xx, yy) not in arm_mask):   # from behind it lies over the shoulder's sleeve
                cells.append([xx, yy, ch]); seen.add((xx, yy))
    return cells


def arm_mask(fc, frame):
    """the texels an arm covers in this frame (the ribbon runs under the arm)"""
    m = set()
    for (x, y) in C.ARMS_AT.get((fc, frame), []):
        m.add((x, y))
    return m


def build_block(sets):
    out = []
    frames = {fc: {n: r for n, r in fr.items()} for fc, fr in sets.items()}
    dy = {fc: {n: C.META[(fc, n)]['dy'] for n in fr} for fc, fr in sets.items()}
    hand = {fc: {n: C.META[(fc, n)]['hand'] for n in fr} for fc, fr in sets.items()}
    sash, pin = {}, {}
    for fc, fr in sets.items():
        sash[fc], pin[fc] = {}, {}
        for n, r in fr.items():
            cells = sash_cells(fc, n, r, dy[fc][n], arm_mask(fc, n))
            sash[fc][n] = cells
            mid = [c for c in cells if c[2] == 'Y']
            whole = [c for c in mid if any(d[0] == c[0] and d[1] == c[1] + 1 for d in cells)]   # a texel with its ribbon's edge under it
            pick = whole or mid
            p = pick[len(pick) // 2] if pick else None   # the pin through the ribbon at its middle texel on the chest
            pin[fc][n] = ([[p[0], p[1], 'W']] + ([[p[0], p[1] + 1, 'F']] if any(c[0] == p[0] and c[1] == p[1] + 1 for c in cells) else [])) if p else []
    j = lambda o: json.dumps(o, separators=(',', ':'))
    out.append(BEGIN + ' — v3.50 THE COURIER SET: 32×32, hand-authored on the grid it lands on (the bench: tools/courier/courier.py,')
    out.append('     written here by tools/courier/export.py). Three facings — E (west is E mirrored), S toward the eye, N away — each with')
    out.append('     idle, the breath, four steps, the brace; E also rides and hangs from the wire. Letters: O outline · H/h/I hood · S/s skin,')
    out.append('     e eye · C/D/L coat and its shade and light, c trim · T/t the scarf · A/a the pack\'s canvas, u its deep shade and the straps,')
    out.append('     Y buckles · B/b boots · P/p trousers — the worn palette\'s own letters and the shades Render.courierPal derives from them,')
    out.append('     so every coat, hood, trim and boot recolours it. */')
    out.append('  const COURIER = {')
    out.append('    w: 32, h: 32, ax: 16,')
    out.append('    frames: {')
    for fc, fr in frames.items():
        out.append(f'      {fc}: {{')
        for n, r in fr.items():
            out.append(f'        {n}: [')
            for i in range(0, 32, 2):
                out.append('          ' + ', '.join(f"'{s}'" for s in r[i:i + 2]) + ',')
            out.append('        ],')
        out.append('      },')
    out.append('    },')
    out.append(f'    dy: {j(dy)},')
    out.append(f'    hand: {j(hand)},')
    out.append(f'    at: {j(ANCHORS)},')
    out.append(f'    sash: {j(sash)},')
    out.append(f'    pin: {j(pin)},')
    out.append(f'    glyphs: {j(GLYPHS)},')
    out.append(f'    glyphPal: {j(GLYPH_PAL)},')
    out.append('  };')
    out.append(END)
    return '\n'.join(out) + '\n'


def write(sets):
    src = open(REG).read()
    block = build_block(sets)
    if BEGIN in src:
        a = src.index(BEGIN); b = src.index(END) + len(END) + 1
        src = src[:a] + block + src[b:]
    else:
        at = src.index('  return { FK_PAL,')
        src = src[:at] + block + src[at:]
    open(REG, 'w').write(src)
    return len(block)


def sheet(sets, path, k=8):
    fr = [(f'{fc} {n}', r) for fc in ('S', 'E', 'N') for n, r in sets[fc].items()]
    render(fr, path, k=k, cols=8)


if __name__ == '__main__':
    sets = C.build()
    bad = C.check(sets)
    if bad:
        print('\n'.join(bad)); sys.exit(1)
    n = write(sets)
    os.makedirs(os.path.join(ROOT, 'shots'), exist_ok=True)
    sheet(sets, os.path.join(ROOT, 'shots', 'courier_sheet.png'))
    print('registry block', n, 'bytes;', sum(len(v) for v in sets.values()), 'frames')
