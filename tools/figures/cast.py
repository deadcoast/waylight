#!/usr/bin/env python3
"""cast.py — v3.51: the whole cast from the benches' json, for the eye.

Reads tools/{people,fk,dark,everyday}/*.json and tools/stable/stable.json and writes one strip per figure: each facing's
idle and its four steps (and any extra frames), at a whole-texel scale, every figure in its own derived palette.
  python3 tools/figures/cast.py [--k 3] [--only people,fk] [--out shots/cast_sheet.png]
"""
import json, os, sys
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'courier'))
from draft import derive

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BG, INK, CELLBG = (21, 24, 29), (226, 214, 176), (42, 47, 55)


def full_pal(f):
    if 'palFull' in f:
        return dict(f['palFull'])
    p = dict(f.get('pal', {}))
    base = {k: p[k] for k in 'OHSeCcTtBb' if k in p}
    if len(base) == 10:
        d = derive(base)
        d.update({k: v for k, v in p.items() if k not in d})
        return d
    return p


def hexrgb(h):
    n = int(h[1:], 16)
    return (n >> 16, (n >> 8) & 255, n & 255)


def draw_rows(img, rows, ox, oy, k, pal):
    d = ImageDraw.Draw(img)
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch == '.':
                continue
            c = pal.get(ch)
            d.rectangle([ox + x * k, oy + y * k, ox + x * k + k - 1, oy + y * k + k - 1], fill=hexrgb(c) if c else (255, 0, 255))


def strips(k=3, only=None):
    out = []   # (label, [(name, rows)], pal)
    for fam in ('people', 'fk', 'dark', 'everyday'):
        if only and fam not in only:
            continue
        d = json.load(open(os.path.join(ROOT, 'tools', fam, fam + '.json')))
        for n, f in d['figures'].items():
            pal = full_pal(f)
            for fc in ('E', 'S', 'N'):
                fr = f['frames'].get(fc)
                if not fr:
                    continue
                out.append((f'{fam}/{n} {fc}', [(k2, v) for k2, v in fr.items()], pal))
    if not only or 'stable' in only:
        d = json.load(open(os.path.join(ROOT, 'tools', 'stable', 'stable.json')))
        for n, f in d['figures'].items():
            pal = dict(f['pal'])
            out.append((f'stable/{n}', [('idle', f['frames']['idle'])] + [(f'walk{i + 1}', r) for i, r in enumerate(f['frames']['walk'])], pal))
    return out


def sheet(path, k=3, only=None):
    rows = strips(k, only)
    cellw = max(len(r[1][0][1][0]) for r in rows) * k + 6
    cellh = max(len(r[1][0][1]) for r in rows) * k + 6
    ncol = max(len(r[1]) for r in rows)
    W = 150 + ncol * cellw + 10
    H = 10 + len(rows) * (cellh + 4)
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    y = 10
    for label, frames, pal in rows:
        d.text((8, y + cellh // 2 - 6), label, fill=INK)
        x = 150
        for name, r in frames:
            d.rectangle([x, y, x + cellw - 3, y + cellh - 3], fill=CELLBG)
            draw_rows(img, r, x + 2, y + 2 + (cellh - 6 - len(r) * k), k, pal)
            d.text((x + 2, y + 1), name, fill=(120, 128, 138))
            x += cellw
        y += cellh + 4
    img.save(path)
    return img.size


if __name__ == '__main__':
    k = 3; only = None; out = os.path.join(ROOT, 'shots', 'cast_sheet.png')
    a = sys.argv[1:]
    for i, v in enumerate(a):
        if v == '--k': k = int(a[i + 1])
        if v == '--only': only = a[i + 1].split(',')
        if v == '--out': out = a[i + 1]
    print(out, sheet(out, k, only))
