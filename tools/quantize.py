#!/usr/bin/env python3
"""quantize.py — THE ASSET LAW's middle step: generate → QUANTIZE → embed.

A PNG (PixelLab output, or anything) becomes a letter-keyed texel-row table in the game's own
palette — the same format every authored sprite in 17_render.js uses (RIGF, HORSE_F, ...).

    python3 tools/quantize.py in.png --pal '{"O":"#12161c","B":"#5c4232",...}' [--trim] [--scale 2]
        [--alpha 96] [--orphans] [--name mustang] [--js out.js] [--report]

Doctrine applied (research-pixel-art-audited.md):
  · nearest colour in CIE Lab — the palette is OURS, every generated pixel snaps to a band
  · cluster discipline (--orphans): a pixel whose four neighbours all differ from it is noise, not
    a cluster — it takes the majority neighbour; repeated until stable
  · integer downscale only (--scale N): majority vote per N×N block, alpha-gated — never a resample
  · transparent → '.' ; the outline letter is whatever the palette maps black to
"""
import argparse
import json
from collections import Counter

from PIL import Image


def hex2rgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb2lab(rgb):
    # sRGB → XYZ → Lab (D65), pure python
    r, g, b = [c / 255.0 for c in rgb]
    def lin(c): return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
    r, g, b = lin(r), lin(g), lin(b)
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
    def f(t): return t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))

def nearest(lab, pal_lab):
    best, bd = None, 1e18
    for k, pl in pal_lab.items():
        d = (lab[0] - pl[0]) ** 2 + (lab[1] - pl[1]) ** 2 + (lab[2] - pl[2]) ** 2
        if d < bd: bd, best = d, k
    return best

def load_grid(path, alpha_min):
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    px = im.load()
    grid = [[(px[x, y] if px[x, y][3] >= alpha_min else None) for x in range(w)] for y in range(h)]
    return grid

def trim(grid):
    rows = [y for y, row in enumerate(grid) if any(p is not None for p in row)]
    cols = [x for x in range(len(grid[0])) if any(grid[y][x] is not None for y in range(len(grid)))]
    if not rows or not cols: return grid
    return [row[cols[0]:cols[-1] + 1] for row in grid[rows[0]:rows[-1] + 1]]

def downscale(grid, n):
    h, w = len(grid), len(grid[0])
    out = []
    for by in range(0, h - h % n, n):
        row = []
        for bx in range(0, w - w % n, n):
            block = [grid[y][x] for y in range(by, by + n) for x in range(bx, bx + n)]
            solid = [p for p in block if p is not None]
            if len(solid) * 2 < len(block): row.append(None); continue   # alpha-gated: a block is opaque only by majority
            # majority colour by rounded rgb
            c = Counter((p[0] >> 3, p[1] >> 3, p[2] >> 3) for p in solid).most_common(1)[0][0]
            # pick the actual pixel closest to that bucket
            pick = min(solid, key=lambda p: abs((p[0] >> 3) - c[0]) + abs((p[1] >> 3) - c[1]) + abs((p[2] >> 3) - c[2]))
            row.append(pick)
        out.append(row)
    return out

def quantize(grid, pal):
    pal_lab = {k: rgb2lab(hex2rgb(v)) for k, v in pal.items()}
    cache = {}
    rows = []
    for row in grid:
        s = ''
        for p in row:
            if p is None: s += '.'; continue
            key = (p[0], p[1], p[2])
            if key not in cache: cache[key] = nearest(rgb2lab(key), pal_lab)
            s += cache[key]
        rows.append(s)
    return rows

def orphans(rows):
    """cluster discipline: a lone texel among four different neighbours takes the majority neighbour"""
    h, w = len(rows), len(rows[0])
    grid = [list(r) for r in rows]
    removed = 0
    for _ in range(4):
        changed = 0
        for y in range(h):
            for x in range(w):
                c = grid[y][x]
                if c == '.': continue
                nb = [grid[y2][x2] for y2, x2 in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)) if 0 <= y2 < h and 0 <= x2 < w]
                if nb and all(n != c for n in nb):
                    solid = [n for n in nb if n != '.']
                    grid[y][x] = Counter(solid).most_common(1)[0][0] if solid else '.'
                    changed += 1
        removed += changed
        if not changed: break
    return [''.join(r) for r in grid], removed

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('png'); ap.add_argument('--pal', required=True)
    ap.add_argument('--trim', action='store_true'); ap.add_argument('--scale', type=int, default=1)
    ap.add_argument('--alpha', type=int, default=96); ap.add_argument('--orphans', action='store_true')
    ap.add_argument('--name', default='SPR'); ap.add_argument('--js'); ap.add_argument('--report', action='store_true')
    ap.add_argument('--pad', type=int, default=0, help='pad to this width (right) so every frame of a set shares a canvas')
    a = ap.parse_args()
    pal = json.loads(a.pal)
    grid = load_grid(a.png, a.alpha)
    if a.trim: grid = trim(grid)
    if a.scale > 1: grid = downscale(grid, a.scale)
    if a.trim: grid = trim(grid)
    rows = quantize(grid, pal)
    rem = 0
    if a.orphans: rows, rem = orphans(rows)
    if a.pad: rows = [r + '.' * max(0, a.pad - len(r)) for r in rows]
    js = '[\n' + ''.join(f"    '{r}',\n" for r in rows) + '  ]'
    if a.js:
        with open(a.js, 'w') as f: f.write(f'const {a.name} = {js};\n')
    if a.report:
        used = Counter(ch for r in rows for ch in r if ch != '.')
        print(json.dumps({'w': len(rows[0]) if rows else 0, 'h': len(rows), 'used': dict(used), 'orphansFixed': rem, 'texels': sum(used.values())}))
    else:
        print(js)

if __name__ == '__main__': main()
