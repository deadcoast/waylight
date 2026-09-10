#!/usr/bin/env python3
"""stable.py — the asset pass driver for THE STABLE. For one breed:
     python3 tools/stable.py <name> <idle.png> [walk0.png walk1.png ...] [--js out.js]
   · one bounding box across every frame (pivot-centred sets keep their anchors)
   · the ramp is DERIVED from the coat: opaque pixels are clustered by luminance into
     outline / dark / mid / light / highlight, each centre SNAPPED to the nearest of the game's
     own sprite bands (the union of every authored sprite palette + the coat bands below)
   · rows quantized (tools/quantize.py machinery), orphans disciplined
   · emits a registry row: { w, h, pal, ground, seat, frames: { idle, walk[] } }
"""
import sys, json, re
from collections import Counter
sys.path.insert(0, 'tools')
from quantize import load_grid, quantize, orphans, rgb2lab, hex2rgb
from PIL import Image

# the game's sprite bands: every authored sprite palette colour in 17_render.js + coat bands
def game_bands():
    rs = open('src/17_render.js').read()
    hexes = set(h.lower() for h in re.findall(r"'(#[0-9a-fA-F]{6})'", rs))
    coats = ['#8a6a42', '#6b5030', '#a88a5c', '#d1b48a', '#e8dcc0', '#b39264', '#8a6f48', '#8a4a2a', '#663520', '#b56a3e',
             '#d8c090', '#c9c4b8', '#9a958a', '#ece8e0', '#2e2c30', '#1f1d21', '#48464c', '#8a8578', '#6e6a5e', '#a8a394',
             '#241708', '#2e1c0c', '#4a3418', '#3a3a40', '#5a2a14', '#12161c', '#23282f']
    return sorted(hexes | set(coats))

def snap(rgb, bands_lab):
    lab = rgb2lab(rgb)
    best, bd = None, 1e18
    for hx, bl in bands_lab:
        d = (lab[0] - bl[0]) ** 2 + (lab[1] - bl[1]) ** 2 + (lab[2] - bl[2]) ** 2
        if d < bd: bd, best = d, hx
    return best

def derive_ramp(grids, k=6):
    """k-means in CIE Lab over the opaque pixels (hue survives — a crate stays wood beside a grey
       coat), centres snapped to the game's bands, letters assigned darkest → lightest"""
    pix = [p[:3] for g in grids for row in g for p in row if p is not None]
    c = Counter(pix)
    pts = [(rgb2lab(rgb), n, rgb) for rgb, n in c.items()]
    # seeds: spread by luminance
    pts_sorted = sorted(pts, key=lambda t: t[0][0])
    cents = [pts_sorted[int(i * (len(pts_sorted) - 1) / max(1, k - 1))][0] for i in range(k)]
    for _ in range(12):
        groups = [[] for _ in range(k)]
        for lab, n, rgb in pts:
            j = min(range(k), key=lambda i: sum((lab[d] - cents[i][d]) ** 2 for d in range(3)))
            groups[j].append((lab, n))
        newc = []
        for i, g in enumerate(groups):
            if not g: newc.append(cents[i]); continue
            tot = sum(n for _, n in g)
            newc.append(tuple(sum(lab[d] * n for lab, n in g) / tot for d in range(3)))
        cents = newc
    bands = game_bands(); bands_lab = [(h, rgb2lab(hex2rgb(h))) for h in bands]
    # snap each centre to a band (by Lab distance), ordered by luminance, letters darkest→lightest
    def snap_lab(lab):
        return min(bands_lab, key=lambda hb: sum((lab[d] - hb[1][d]) ** 2 for d in range(3)))[0]
    order = sorted(range(k), key=lambda i: cents[i][0])
    letters = ['O', 'M', 'b', 'B', 'L', 'l', 'x', 'y']
    pal, seen = {}, set()
    for li, i in enumerate(order):
        if not any(True for _ in [1]) : pass
        hx = snap_lab(cents[i])
        if hx in seen: continue
        seen.add(hx); pal[letters[len(pal)]] = hx
    pal['O'] = '#12161c'   # the outline is the game's one outline — the darkest cluster IS the outline
    return pal

def bbox(grids):
    xs, ys = [], []
    for g in grids:
        for y, row in enumerate(g):
            for x, p in enumerate(row):
                if p is not None: xs.append(x); ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)

def crop(g, bb):
    x0, y0, x1, y1 = bb
    return [row[x0:x1 + 1] for row in g[y0:y1 + 1]]

def main():
    js = None
    argv = sys.argv[1:]
    if '--js' in argv: i = argv.index('--js'); js = argv[i + 1]; argv = argv[:i] + argv[i + 2:]
    args = [a for a in argv if not a.startswith('--')]
    name, idle, walks = args[0], args[1], args[2:]
    grids = [load_grid(idle, 96)] + [load_grid(w, 96) for w in walks]
    bb = bbox(grids)
    grids = [crop(g, bb) for g in grids]
    pal = derive_ramp(grids)
    frames = []
    for g in grids:
        rows = quantize(g, pal)
        rows, _ = orphans(rows)
        frames.append(rows)
    w, h = len(frames[0][0]), len(frames[0])
    # anchors: ground = bottom-centre of the idle silhouette; seat = the back's top at 45% of the length
    idle_rows = frames[0]
    cols = [x for x in range(w) if any(r[x] != '.' for r in idle_rows)]
    ground = {'x': (cols[0] + cols[-1]) // 2, 'y': h - 1}
    sx = cols[0] + int((cols[-1] - cols[0]) * 0.42)
    sy = next((y for y in range(h) if idle_rows[y][sx] != '.'), h // 2)
    seat = {'x': sx, 'y': sy}
    row = {'w': w, 'h': h, 'pal': pal, 'ground': ground, 'seat': seat, 'frames': {'idle': frames[0], 'walk': frames[1:]}}
    fr = lambda rows: '[\n' + ''.join(f"        '{r}',\n" for r in rows) + '      ]'
    out = f"    {name}: {{ w: {w}, h: {h}, pal: {json.dumps(pal)}, ground: {json.dumps(ground)}, seat: {json.dumps(seat)},\n      frames: {{ idle: {fr(frames[0])}, walk: [{', '.join(fr(f) for f in frames[1:])}] }} }},\n"
    if js: open(js, 'w').write(out)
    print(json.dumps({'name': name, 'w': w, 'h': h, 'pal': pal, 'ground': ground, 'seat': seat, 'frames': len(frames)}))

if __name__ == '__main__': main()
