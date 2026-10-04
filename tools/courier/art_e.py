#!/usr/bin/env python3
"""Side view (facing east) — the idle, by hand, layer by layer."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from draft import render

def blank():
    return [['.'] * 32 for _ in range(32)]

def put(g, x, y, s):
    for i, ch in enumerate(s):
        if ch == ' ': continue
        if 0 <= x + i < 32 and 0 <= y < 32: g[y][x + i] = ch

def rows(g): return [''.join(r) for r in g]

def side_idle():
    g = blank()
    # --- the pack: the bedroll lashed on top, the flap and its buckle, a band, a side pocket
    put(g, 6, 9,  ' OOOO')
    put(g, 6, 10, 'OPPPpO')
    put(g, 6, 11, 'OpPppO')
    put(g, 5, 12, ' OOOOOO')
    put(g, 5, 13, 'OYTTTTTt')
    put(g, 5, 14, 'OTTTTTTt')
    put(g, 5, 15, 'OtttYttu')
    put(g, 5, 16, 'OTTTYTTt')
    put(g, 4, 17, 'OOTTTuTTt')
    put(g, 4, 18, 'OTtTTuTTt')
    put(g, 4, 19, 'OTtTTuTtt')
    put(g, 4, 20, 'OttTTuTtu')
    put(g, 4, 21, 'OOttTutuu')
    put(g, 5, 22, 'OtttuuuO')
    put(g, 6, 23, 'OOOOOO')
    # --- the hood, the face in profile
    put(g, 14, 9,  'OOOO')
    put(g, 13, 10, 'OIIIHO')
    put(g, 12, 11, 'OIHHHHHO')
    put(g, 12, 12, 'OHHHHHhSO')
    put(g, 12, 13, 'OHHHHhSeSO')
    put(g, 12, 14, 'OhHHHhSSSO')
    put(g, 12, 15, 'OhhHHhsSO')
    # --- the scarf wound at the throat, its tail over the strap
    put(g, 13, 16, 'OTTTTTTO')
    put(g, 12, 16, 'T')
    put(g, 11, 17, 'Tt')
    put(g, 11, 18, 't')
    # --- the coat
    put(g, 13, 17, 'OLLLLLLO')
    put(g, 13, 18, 'ODCCCCcO')
    put(g, 13, 19, 'ODCCCCcO')
    put(g, 13, 20, 'ODCCCCcO')
    put(g, 13, 21, 'ODCCCCcO')
    put(g, 13, 22, 'OuuuuYuO')
    put(g, 13, 23, 'ODCCCCcO')
    put(g, 12, 24, 'ODDCCCCcO')
    put(g, 12, 25, 'OcccccccO')
    # --- the strap from the pack's top to the chest
    put(g, 14, 17, 'u')
    put(g, 14, 18, 'u')
    # --- the near arm, hanging; the hand at the hem
    put(g, 16, 18, 'OCLc')
    put(g, 16, 19, 'OCLc')
    put(g, 16, 20, 'ODCD')
    put(g, 16, 21, 'ODCD')
    put(g, 16, 22, 'Occ')
    put(g, 16, 23, 'OSS')
    put(g, 16, 24, 'OsO')
    # --- the legs and the boots
    put(g, 13, 26, 'OppOPPPO')
    put(g, 13, 27, 'OppOPPPO')
    put(g, 13, 28, 'OppOPPpO')
    put(g, 12, 29, 'ObbbOBBBBO')
    put(g, 12, 30, 'OOOOObbbbO')
    return rows(g)

if __name__ == '__main__':
    SP='/tmp/claude-0/-home-claude/6b4ed241-f59c-5646-95c9-b16861a92127/scratchpad/'
    render([('E idle', side_idle())], SP+'e_idle.png', k=12, cols=1)
    render([('E idle', side_idle())]*3, SP+'e_idle_small.png', k=4, cols=3)
