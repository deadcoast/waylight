#!/usr/bin/env python3
"""Write THE CAST into the sprite registry (src/12e_sprites.js): every figure the v3.51 benches drew by hand, the stable,
the glyphs the set pieces hold, and the Walker's bust.

Reads tools/{people,fk,dark,everyday}/<family>.json and tools/stable/stable.json (each bench writes its own; this file
only carries their rows into the registry). Blocks between markers are replaced on every run:
  FIGURES:BEGIN … FIGURES:END   const FIG = {…}, const GLYPHS = {…}
  STABLE:BEGIN  … STABLE:END    const HORSES = {…}
  BUST:BEGIN    … BUST:END      const WALKER_FACE_PAL, WALKER_FACE
The first run also retires what these replace: the v3.50 KIT and FIGURES (4/3 resamples), the tender's resample, the
generated stable, the old bust. Run from anywhere: python3 tools/figures/export.py
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REG = os.path.join(ROOT, 'src', '12e_sprites.js')
j = lambda o: json.dumps(o, separators=(',', ':'))

ORDER = [('people', ['knife', 'bowman', 'ram', 'chief', 'chief2', 'townshield', 'kin', 'wanderer']),
         ('fk', ['pugugly', 'longbowmen', 'berserker', 'rifle_rider', 'recon_rider', 'shield']),
         ('dark', ['reaper', 'lamplighter', 'stranger', 'tender', 'giant']),
         ('everyday', ['kid'])]
BASE = set('OHSeCcTtBb')
# where what a figure carries is lashed, per facing (x, y of a glyph's top-left on the figure's grid, at rest; the game
# adds the frame's rise); Back: drawn before the figure. The knife carries the chief's gift on his back to a lit door.
# small props drawn here, on the same grid and law (mine): the Reapers' cold lamp on its staff (the ride's only light), the
# Walker's sled (the slate deck on its lumen runner, curled up at the front)
EXTRA_GLYPHS = {
    'coldlamp': {'rows': ['.OOO.', 'OXxXO', 'OxXxO', 'OXxXO', '.OVO.', '.OVO.', '.OVO.', '.OVO.', '.OVO.', '.OVO.', '.OVO.', '.OvO.', '.OOO.'],
                 'pal': {'O': '#12151f', 'X': '#9aa4ff', 'x': '#c9d0ff', 'V': '#2a3048', 'v': '#1a1e2c'}},
    'sled': {'rows': ['..........OO', '.OOOOOOOOOXO', 'OMmMmMmMmOXO', 'OMMMMMMMMMXO', 'OXXXXXXXXXxO', '.OOOOOOOOOO.'],
             'pal': {'O': '#12161c', 'M': '#4a5a5f', 'm': '#3a474b', 'X': '#6fe3d2', 'x': '#57c0b2'}},
}
_BUNDLE = {'E': {'bundle': [9, 15], 'bundleBack': True}, 'S': {'bundle': [19, 12], 'bundleBack': True}, 'N': {'bundle': [14, 16], 'bundleBack': False}}
FIG_AT = {   # the camps' own leave for the hills with their hides rolled on their backs (the bundle)
    'knife': {fc: {**_BUNDLE[fc], **g} for fc, g in {'E': {'gift': [8, 17], 'giftBack': True}, 'S': {'gift': [13, 12], 'giftBack': True}, 'N': {'gift': [13, 17], 'giftBack': False}}.items()},
    'bowman': _BUNDLE, 'ram': _BUNDLE, 'chief': _BUNDLE, 'chief2': _BUNDLE,
}


def load(fam):
    return json.load(open(os.path.join(ROOT, 'tools', fam, fam + '.json')))


def rows_lines(rows, ind):
    out = []
    per = 2 if len(rows[0]) <= 34 else 1
    for i in range(0, len(rows), per):
        out.append(ind + ', '.join(f"'{s}'" for s in rows[i:i + per]) + ',')
    return out


def fig_block():
    L = []
    L.append('  /* FIGURES:BEGIN — v3.51 THE CAST: every figure drawn by hand on the grid it lands on (the benches: tools/people,')
    L.append('     tools/fk, tools/dark, tools/everyday — the law they share is tools/figures/STYLE.md; written here by')
    L.append('     tools/figures/export.py). A figure: its grid (w×h, ax the foot column, sole the soles\' row), three facings — E (west')
    L.append('     is E mirrored), S toward the eye, N away — each with idle, the breath (idle2: the same silhouette, the light risen) and')
    L.append('     four steps, and the frames its part asks (ride, aim, wave, hold); hand: the right hand\'s texel per frame; dy: the')
    L.append('     upper body\'s rise; at: where what it carries is lashed; pal: its colours — derive: true builds the shades from the ten worn letters as the courier\'s do')
    L.append('     (Render.courierPal); seed: a kid is coloured by seed like a hand; the rest carry every letter they use. seat: the texel that')
    L.append('     lands on a saddle\'s seat in the ride frame; light: the texel a lamp or torch shines from; eye: the giant\'s light. */')
    L.append('  const FIG = {')
    for fam, names in ORDER:
        d = load(fam)
        g0 = d.get('grid') or {'w': 32, 'h': 32, 'ax': 16, 'sole': 30}
        for n in names:
            f = d['figures'][n]
            g = f.get('grid') or g0
            full = 'palFull' in f
            pal = f['palFull'] if full else f['pal']
            if not full and not BASE.issubset(pal):
                raise SystemExit(f'{fam}/{n}: the palette lacks base letters {sorted(BASE - set(pal))}')
            head = {'fam': fam, 'w': g['w'], 'h': g['h'], 'ax': g['ax'], 'sole': g['sole'], 'derive': not full}
            if n == 'kid':
                head['seed'] = True   # coloured by seed like a hand (the mate's coat, their own hood and scarf)
            L.append(f'    {n}: {{ ' + ', '.join(f'{k}: {j(v)}' for k, v in head.items()) + ',')
            L.append('      frames: {')
            for fc in ('E', 'S', 'N'):
                if fc not in f['frames']:
                    continue
                L.append(f'        {fc}: {{')
                for fr, rows in f['frames'][fc].items():
                    assert len(rows) == g['h'] and all(len(r) == g['w'] for r in rows), (n, fc, fr)
                    # a belt's end, an outline, a sleeve's shade, an outline read T,O,D,O — the four letters of a note left in the
                    # page, which the ship's check refuses: the belt's last texel takes the trim's own shade (t), the belt turning away
                    rows = [r.replace('TODO', 'tODO') for r in rows]
                    L.append(f'          {fr}: [')
                    L.extend(rows_lines(rows, '            '))
                    L.append('          ],')
                L.append('        },')
            L.append('      },')
            for key in ('hand', 'dy', 'seat', 'light', 'eye', 'cadence'):
                if key in f:
                    L.append(f'      {key}: {j(f[key])},')
            if n in FIG_AT:
                L.append(f'      at: {j(FIG_AT[n])},')
            L.append(f'      pal: {j(pal)},')
            L.append('    },')
    L.append('  };')
    ev = load('everyday')
    L.append('  /* the things the set pieces hold, on the same grid: the letter in flight, the forrester\'s axe in its swing (grip: the')
    L.append('     texel that sits on the right hand), the mason\'s cut stones, the Reapers\' cold lamp, the Walker\'s sled */')
    L.append('  const GLYPHS = {')
    for n, g in list(ev['glyphs'].items()) + list(EXTRA_GLYPHS.items()):
        extra = f", grip: {j(g['grip'])}" if 'grip' in g else ''
        L.append(f"    {n}: {{ rows: {j(g['rows'])}, pal: {j(g['pal'])}{extra} }},")
    L.append('  };')
    L.append('  /* FIGURES:END */')
    return '\n'.join(L) + '\n'


def stable_block():
    d = load('stable')
    L = []
    L.append('  /* STABLE:BEGIN — v3.51 THE STABLE, redrawn by hand at the courier\'s scale (the bench: tools/stable/stable.py; written')
    L.append('     here by tools/figures/export.py): six breeds side-on facing east (west mirrored), one rig shaped per breed, a true')
    L.append('     four-beat walk held on the uneven cadence, saddle and bridle so a rider sits (the donkey a pack saddle and its')
    L.append('     crates). ground: the texel under the hooves\' centre · seat: the saddle\'s seat, where a rider\'s seat texel lands. */')
    L.append('  const HORSES = {')
    for n, f in d['figures'].items():
        head = {'w': f['w'], 'h': f['h'], 'pal': f['pal'], 'ground': f['ground'], 'seat': f['seat']}
        L.append(f'    {n}: {{ ' + ', '.join(f'{k}: {j(v)}' for k, v in head.items()) + ',')
        L.append('      frames: {')
        L.append('        idle: [')
        L.extend(rows_lines(f['frames']['idle'], '          '))
        L.append('        ],')
        L.append('        walk: [')
        for fr in f['frames']['walk']:
            L.append('          [')
            L.extend(rows_lines(fr, '            '))
            L.append('          ],')
        L.append('        ],')
        L.append('      },')
        L.append('    },')
    L.append('  };')
    L.append('  /* STABLE:END */')
    return '\n'.join(L) + '\n'


def bust_block():
    b = load('everyday')['busts']['walker_bust']
    L = ['  /* BUST:BEGIN — v3.51: the Walker\'s bust drawn from the courier\'s own head (tools/everyday/everyday.py): the hood with its',
         '     light rim (I) and the shade over the brow, the eyes, the scarf wound twice (R, r its shade), the coat\'s shoulders and the',
         '     straps. Render.walkerFacePal recolours K/k/I from the hood, S/s the skin, C/c the coat, R/r the scarf. */',
         f"  const WALKER_FACE_PAL = {j(b['pal'])};",
         '  const WALKER_FACE = ['] + [f"    '{r}'," for r in b['rows']] + ['  ];', '  /* BUST:END */']
    return '\n'.join(L) + '\n'


def replace_between(src, begin, end, block):
    a = src.index(begin); b = src.index(end) + len(end) + 1
    return src[:a] + block + src[b:]


def main():
    src = open(REG).read()
    # FIG + GLYPHS
    if '/* FIGURES:BEGIN' in src:
        src = replace_between(src, '  /* FIGURES:BEGIN', '  /* FIGURES:END */', fig_block())
    else:
        a = src.index('  const KIT = {'); b = src.index("  /* the raiders' palette")
        src = src[:a] + fig_block() + src[b:]
        a = src.index('  /* ---------- v3.34 THE FIGURES'); b = src.index('  /* ---------- v3.42 THE REMEMBERING')
        src = src[:a] + src[b:]
        a = src.index('  /* ---------- THE FLAME KEEPER TENDER'); b = src.index('  ];\n', src.index('  const TENDER = [')) + 5
        src = src[:a] + src[b:].lstrip('\n')
    # HORSES
    if '/* STABLE:BEGIN' in src:
        src = replace_between(src, '  /* STABLE:BEGIN', '  /* STABLE:END */', stable_block())
    else:
        a = src.index('  /* ---------- THE STABLE: filled by the pass'); b = src.index('  const CADENCE')
        src = src[:a] + stable_block() + '\n' + src[b:]
    # the bust
    if '/* BUST:BEGIN' in src:
        src = replace_between(src, '  /* BUST:BEGIN', '  /* BUST:END */', bust_block())
    else:
        a = src.index('  const WALKER_FACE_PAL'); b = src.index("'];\n", src.index('  const WALKER_FACE = [')) + 4
        src = src[:a] + bust_block() + src[b:]
    # the registry's exports
    m = re.search(r'return \{ FK_PAL, RAID_PAL, TOWN_PAL, KIT, FIGURES, TENDER_PAL, TENDER, HORSES,', src)
    if m:
        src = src.replace(m.group(0), 'return { FK_PAL, RAID_PAL, TOWN_PAL, FIG, GLYPHS, HORSES,')
    open(REG, 'w').write(src)
    n = sum(len(v) for _, v in ORDER)
    print('the cast written:', n, 'figures,', len(load('everyday')['glyphs']), 'glyphs,', len(load('stable')['figures']), 'breeds, the bust')


if __name__ == '__main__':
    main()
