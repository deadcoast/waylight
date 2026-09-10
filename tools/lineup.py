#!/usr/bin/env python3
"""lineup.py — render sprite row tables side by side at the game's texel size (×3, then ×2 for the eye)
   and VALIDATE them: every row the same width, every letter in the palette. Usage:
   python3 tools/lineup.py out.png  (reads src/12e_sprites.js + the walker rig from 17_render.js)"""
import re
import sys

from PIL import Image, ImageDraw

src = open('src/12e_sprites.js').read()
rs = open('src/17_render.js').read()
def table(name_pat, text):
    m = re.search(name_pat, text, re.DOTALL)
    return re.findall(r"'([^']*)'", m[1]) if m else None
def pal(name_pat, text):
    m = re.search(name_pat, text)
    return dict(re.findall(r"(\w): '(#[0-9a-f]{6})'", m[1])) if m else {}
FK_PAL = pal(r"const FK_PAL = \{([^}]*)\}", src)
T_PAL = pal(r"const TENDER_PAL = \{([^}]*)\}", src)
W_PAL = pal(r"const PAL_WALKER = \{([^}]*)\}", rs)
walker = table(r"idle: \[(.*?)\],\n    A:", rs)
tender = table(r"const TENDER = \[(.*?)\];", src)
kit = {}
for cls in ['pugugly', 'longbowmen', 'berserker', 'rifle_rider', 'recon_rider']:
    blk = re.search(cls + r": \{(.*?)\n    \},", src, re.DOTALL)[1]
    kit[cls] = {
        fr: re.findall(
            r"'([^']*)'", re.search(fr + r": \[(.*?)\]", blk, re.DOTALL)[1]
        )
        for fr in ['idle', 'A', 'B']
    }
errs = []
def check(name, rows, p):
    w = len(rows[0])
    for i, r in enumerate(rows):
        if len(r) != w: errs.append(f'{name} row {i}: width {len(r)} != {w}')
        for ch in r:
            if ch != '.' and ch not in p: errs.append(f'{name} row {i}: letter {ch} not in palette')
check('walker', walker, W_PAL)
check('tender', tender, T_PAL)
for cls, frs in kit.items():
    for fr, rows in frs.items(): check(f'{cls}.{fr}', rows, FK_PAL)
if errs: print('\n'.join(errs)); sys.exit(1)
K = 3
items = (
    [('walker', walker, W_PAL)]
    + [(c, kit[c]['idle'], FK_PAL) for c in kit]
    + [(f'{c}.A', kit[c]['A'], FK_PAL) for c in kit]
    + [('tender', tender, T_PAL)]
)
W = sum(len(r[0]) + 4 for _, r, _ in items) * K + 8
H = 30 * K
im = Image.new('RGB', (W, H), '#3a4a34')
d = ImageDraw.Draw(im)
x = 4
for name, rows, p in items:
    oy = H - 3 * K - len(rows) * K
    for y, r in enumerate(rows):
        for xx, ch in enumerate(r):
            if ch == '.': continue
            d.rectangle([x + xx * K, oy + y * K, x + xx * K + K - 1, oy + y * K + K - 1], fill=p.get(ch, '#ff00ff'))
    x += (len(rows[0]) + 4) * K
im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
im.save(sys.argv[1])
print('ok', im.size)
