#!/usr/bin/env python3
"""Front (facing south) and back (facing north) — the idles, by hand."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from draft import render
from art_e import blank, put, rows, side_idle

def front_idle():
    g = blank()
    # --- the bedroll across the pack's top, behind the head, out past both shoulders
    put(g, 8, 11,  'OOOOOOOOOOOOOOOO')
    put(g, 8, 12,  'OPPPPPPPPPPPPPPO')
    put(g, 8, 13,  'OppppppppppppppO')
    put(g, 8, 14,  'OOOOOOOOOOOOOOOO')
    # --- the pack's sides, showing past the body
    for y in range(15, 23):
        put(g, 9, y, 'OT'); put(g, 21, y, 'tO')
    put(g, 9, 23, 'OO'); put(g, 21, 23, 'OO')
    # --- the hood and the face, looking out
    put(g, 12, 9,  'OOOOOOOO')
    put(g, 11, 10, 'OIIIIIIHO')
    put(g, 11, 11, 'OIHhhhhHHO'[:10])
    put(g, 11, 11, 'OIhhhhhhHO')
    put(g, 11, 12, 'OHhSSSShHO')
    put(g, 11, 13, 'OHSeSSeSHO')
    put(g, 11, 14, 'OhSSSSSShO')
    put(g, 11, 15, 'OhhsSSshhO')
    # --- the scarf
    put(g, 11, 16, 'OTTTTTTTTO')
    put(g, 12, 17, 'OtTTTtO')
    # --- the coat: shoulders, the straps, the chest strap, the opening, the belt
    put(g, 10, 17, 'OO')
    put(g, 19, 17, 'OO')
    put(g, 10, 17, 'OLLu')
    put(g, 18, 17, 'uLLO')
    put(g, 10, 18, 'OLCuCCccCCuCLO'[:12])
    put(g, 10, 18, 'OLCuCCcCCuCO')
    put(g, 10, 19, 'OCCuuuYuuuCO')
    put(g, 10, 20, 'OCDuCCcCCuDO')
    put(g, 10, 21, 'OCDCCCcCCCDO')
    put(g, 10, 22, 'OuuuuYYuuuuO')
    put(g, 10, 23, 'OCDCCCcCCCDO')
    put(g, 10, 24, 'ODDCCCcCCDDO')
    put(g, 10, 25, 'OccccOOccccO')
    # --- the arms at the sides, the hands out of the cuffs
    for y in range(18, 23):
        put(g, 8, y, 'OL'); put(g, 22, y, 'DO')
    put(g, 8, 23, 'Oc'); put(g, 22, 23, 'cO')
    put(g, 8, 24, 'OS'); put(g, 22, 24, 'sO')
    put(g, 8, 25, ' O'); put(g, 22, 25, 'O ')
    # --- the legs and the boots
    put(g, 11, 26, 'OPPPOOPPPO')
    put(g, 11, 27, 'OPPpO OpPPO'[:10])
    put(g, 11, 27, 'OPPpOOpPPO')
    put(g, 11, 28, 'OBBBOOBBBO')
    put(g, 10, 29, 'OBBBBOOBBBBO')
    put(g, 10, 30, 'ObbbbOObbbbO')
    return rows(g)

def back_idle():
    g = blank()
    # --- the hood's crown above the bedroll
    put(g, 12, 9,  'OOOOOOOO')
    put(g, 11, 10, 'OIIIIIIHO')
    put(g, 11, 11, 'OHHHHHHHHO')
    # --- the bedroll lashed across the top
    put(g, 7, 12,  'OOOOOOOOOOOOOOOOOO')
    put(g, 7, 13,  'OPPPPuPPPPPPuPPPPO')
    put(g, 7, 14,  'OpppputppppputpppO'.replace('t', 'u'))
    put(g, 7, 15,  'OOOOOOOOOOOOOOOOOO')
    # --- the pack: flap, the Order's lantern stitched on it, the pockets
    put(g, 9, 16,  'OYTTTTTTTTTTtO')
    put(g, 9, 17,  'OTTTTTTTTTTTtO')
    put(g, 9, 18,  'OtttttYYttttuO')
    put(g, 9, 19,  'OTTTTOYYOTTTtO')
    put(g, 9, 20,  'OTTTOYuuYOTTtO')
    put(g, 9, 21,  'OTTTOYuuYOTTtO')
    put(g, 9, 22,  'OTTTTOYYOTTTtO')
    put(g, 9, 23,  'OtTTTTTTTTTttO')
    put(g, 9, 24,  'OttttttttttuuO')
    put(g, 9, 25,  'OOOOOOOOOOOOOO')
    # --- the arms at the sides, past the pack
    for y in range(17, 24):
        put(g, 7, y, 'OC'); put(g, 23, y, 'DO')
    put(g, 7, 17, 'OL'); put(g, 23, 17, 'LO')
    put(g, 7, 24, 'Oc'); put(g, 23, 24, 'cO')
    put(g, 7, 25, 'OS'); put(g, 23, 25, 'SO')
    put(g, 8, 26, 'O'); put(g, 23, 26, 'O')
    # --- the coat's skirt below the pack, the legs, the boots' heels
    put(g, 10, 26, 'OCCCCccCCCCO')
    put(g, 11, 27, 'OPPPOOPPPO')
    put(g, 11, 28, 'OPpPOOPpPO')
    put(g, 11, 29, 'OBBBOOBBBO')
    put(g, 11, 30, 'ObbbOObbbO')
    return rows(g)

if __name__ == '__main__':
    SP = '/tmp/claude-0/-home-claude/6b4ed241-f59c-5646-95c9-b16861a92127/scratchpad/'
    fr = [('S idle', front_idle()), ('E idle', side_idle()), ('N idle', back_idle())]
    render(fr, SP + 'sn_idle.png', k=10, cols=3)
    render(fr, SP + 'sn_idle_small.png', k=4, cols=3)
