#!/usr/bin/env python3
"""Drafting bench for the courier set: render a grid at scale with the Walker's palette, for the eye."""
import sys
from PIL import Image, ImageDraw

def shade(h, k):
    n = int(h[1:], 16); r, g, b = n >> 16, (n >> 8) & 255, n & 255
    f = lambda v: max(0, min(255, round(v * k)))
    return '#%02x%02x%02x' % (f(r), f(g), f(b))

def light(h, k):
    n = int(h[1:], 16); r, g, b = n >> 16, (n >> 8) & 255, n & 255
    f = lambda v: max(0, min(255, round(v + (255 - v) * k)))
    return '#%02x%02x%02x' % (f(r), f(g), f(b))

def mix(h1, h2, k):
    a = int(h1[1:], 16); b = int(h2[1:], 16)
    f = lambda s: round(((a >> s) & 255) * (1 - k) + ((b >> s) & 255) * k)
    return '#%02x%02x%02x' % (f(16), f(8), f(0))

def derive(p):
    """the courier's full palette from the worn letters (O H S e C c T t B b) — the JS derivation mirrors this"""
    d = dict(p)
    d['h'] = shade(p['H'], 0.72); d['I'] = light(p['H'], 0.2)
    d['s'] = shade(p['S'], 0.8)
    d['D'] = shade(p['C'], 0.72); d['L'] = light(p['C'], 0.18)
    d['A'] = mix(p['T'], '#8c7c60', 0.5); d['a'] = shade(d['A'], 0.8)
    d['u'] = shade(d['a'], 0.72); d['Y'] = light(p['T'], 0.4)
    d['P'] = light(p['B'], 0.14); d['p'] = light(p['B'], 0.05)
    return d

PAL_WALKER = {'O': '#12161c', 'H': '#2c4258', 'S': '#e0c298', 'e': '#2a2118', 'C': '#3d5a74', 'c': '#2c4258', 'T': '#c9a05a', 't': '#a5824a', 'B': '#23282f', 'b': '#171b21'}

def render(frames, path, k=10, cols=4, pal=None, bg='#2a2f37'):
    pal = derive(pal or PAL_WALKER)
    W = 32; pad = 10; lab = 14
    rows_n = (len(frames) + cols - 1) // cols
    im = Image.new('RGB', (cols * (W * k + pad) + pad, rows_n * (W * k + pad + lab) + pad), '#1b1e24')
    d = ImageDraw.Draw(im)
    for i, (name, g) in enumerate(frames):
        ox = pad + (i % cols) * (W * k + pad); oy = pad + (i // cols) * (W * k + pad + lab)
        d.rectangle([ox, oy, ox + W * k - 1, oy + W * k - 1], fill=bg)
        for y, row in enumerate(g):
            for x, ch in enumerate(row):
                if ch == '.': continue
                d.rectangle([ox + x * k, oy + y * k, ox + x * k + k - 1, oy + y * k + k - 1], fill=pal.get(ch, '#ff00ff'))
        # a faint guide: the anchor column and the sole row
        d.line([ox + 16 * k, oy + W * k, ox + 16 * k, oy + W * k + 3], fill='#9aa2ab')
        d.text((ox, oy + W * k + 2), name, fill='#9aa2ab')
    im.save(path)
