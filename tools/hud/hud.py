#!/usr/bin/env python3
"""THE PAPERS ROW — authoring bench (v3.52).

The six papers the keys open (KEYS' 'papers' group: Map, Cargo & equipment, Skills, Crew, Manual, Pause) get a row of
buttons on the HUD, so a walker on the mouse alone reaches every one of them from the field. Each button carries a glyph
drawn here by hand, 12×12 texels on the survey marks' palette (MARK_PAL, tools/figures/STYLE.md's light and outline
laws), shown at two screen pixels a texel. The Paused sheet joins the manual's window index with a 7×7 mark of its own.

  map     the survey sheet folded in three, its panels light and shade in turn; a red route walked dashed across the folds
          to a gold pin, a stand of green at its foot
  cargo   the courier's pack from behind: the bedroll strapped across its top, the leather flap and its steel buckle, the
          canvas body with its two side straps
  skills  three bars rising, the last one gold: what the walks teach, level on level
  crew    two hooded heads, one before the other: the hands who walk with you
  manual  the Order's field manual, closed: a leather cover with the lamp stamped in gold, the pages' edge below
  pause   two bars of paper — the clock held
  mark    pause, 7×7, for the manual's index of windows

Every texel is placed by hand. Nothing is scaled, generated or filtered.

Run: python3 tools/hud/hud.py           → validate, shots/hud_glyphs.png, and the rows written into src/12e_sprites.js
     python3 tools/hud/hud.py --check   → validate only
"""
import os, re, sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
SPRITES = os.path.join(ROOT, 'src', '12e_sprites.js')
SHOT = os.path.join(ROOT, 'shots', 'hud_glyphs.png')

# the survey marks' palette, read from the registry itself (one truth)
def mark_pal():
    s = open(SPRITES, encoding='utf8').read()
    m = re.search(r"const MARK_PAL = \{([^}]*)\}", s)
    return {k: v for k, v in re.findall(r"(\w):\s*'(#[0-9a-fA-F]{6})'", m.group(1))}

GLYPHS = {
    'map': [
        '............',
        'OOOO....OOOO',
        'OKKKOOOOKKKO',
        'OGGKkkkkKFFO',
        'OGKKkkkkKFYO',
        'OKKKkkkRRYKO',
        'OKKKkkRkKKKO',
        'OKKKkRkkKKKO',
        'OKKRRkkkKKKO',
        'OKRKkkkkKKKO',
        'OOOOkkkkOOOO',
        '....OOOO....',
    ],
    'cargo': [
        '....OOOO....',
        '...OPOOPO...',
        '..OPPPPPPO..',
        '.OPPPPPPPPO.',
        '.OPpPWWPpPO.',
        '.OPpPPPPpPO.',
        '.OppppppppO.',
        '.OSSSSSSSSO.',
        '.OSOOOOOOSO.',
        '.OSOSSSSOSO.',
        '.OYOYYYYOYO.',
        '..OOOOOOOO..',
    ],
    'skills': [
        '............',
        '........OOOO',
        '........OFFO',
        '........OFYO',
        '....OOOOOFYO',
        '....OKKOOFYO',
        '....OKkOOFYO',
        'OOOOOKkOOFYO',
        'OKKOOKkOOFYO',
        'OKkOOKkOOFYO',
        'OkkOOkkOOYYO',
        'OOOOOOOOOOOO',
    ],
    'crew': [
        '......OOOO..',
        '.....OwwwwO.',
        '.....OwSSwO.',
        '.OOOOOwSSwO.',
        'OPPPPOwwwwwO',
        'OPSSPOwwwwwO',
        'OPSSPOOwwwwO',
        'OPPPPPOOwwwO',
        'OPPPPPPOOOO.',
        'OYPPPPPYO...',
        'OYPPPPPYO...',
        'OOOOOOOOO...',
    ],
    'manual': [
        '............',
        '.OOOOOOOOOO.',
        '.OpPPPPPPPO.',
        '.OpPPPFPPPO.',
        '.OpPPFFFPPO.',
        '.OpPPFKFPPO.',
        '.OpPPFKFPPO.',
        '.OpPPFFFPPO.',
        '.OpPPPPPPPO.',
        '.OpOOOOOOOOO',
        '.OpKKKKKKKKO',
        '..OOOOOOOOOO',
    ],
    'pause': [
        '............',
        '.OOOO..OOOO.',
        '.OKKO..OKKO.',
        '.OKkO..OKkO.',
        '.OKkO..OKkO.',
        '.OKkO..OKkO.',
        '.OKkO..OKkO.',
        '.OKkO..OKkO.',
        '.OKkO..OKkO.',
        '.OkkO..OkkO.',
        '.OOOO..OOOO.',
        '............',
    ],
}
MARK_PAUSE = ['.......', 'OOO.OOO', 'OKO.OKO', 'OKO.OKO', 'OKO.OKO', 'OkO.OkO', 'OOO.OOO']


def check(pal):
    bad = []
    for name, rows in list(GLYPHS.items()) + [('mark:pause', MARK_PAUSE)]:
        w = 7 if name.startswith('mark') else 12
        if len(rows) != w or any(len(r) != w for r in rows):
            bad.append(f'{name}: not {w}×{w}')
            continue
        for y, r in enumerate(rows):
            for x, ch in enumerate(r):
                if ch == '.':
                    continue
                if ch not in pal:
                    bad.append(f'{name}: {ch!r} at ({x},{y}) is not a survey-mark letter')
                if ch == 'O':
                    continue
                # the outline law: a coloured texel never meets open air on its four sides
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if nx < 0 or ny < 0 or nx >= w or ny >= w or rows[ny][nx] == '.':
                        bad.append(f'{name}: {ch} at ({x},{y}) meets open air — the outline law')
                        break
    return bad


def draw(rows, pal, k):
    w = len(rows[0])
    im = Image.new('RGBA', (w * k, len(rows) * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch != '.':
                d.rectangle([x * k, y * k, x * k + k - 1, y * k + k - 1], fill=pal[ch])
    return im


def sheet(pal):
    names = list(GLYPHS)
    bg = (18, 22, 28, 255)
    W8, pad = 12 * 8, 16
    im = Image.new('RGBA', (pad + len(names) * (W8 + pad), pad * 3 + W8 + 24 + 40), bg)
    for i, n in enumerate(names):
        g8 = draw(GLYPHS[n], pal, 8)
        im.alpha_composite(g8, (pad + i * (W8 + pad), pad))
        g2 = draw(GLYPHS[n], pal, 2)
        im.alpha_composite(g2, (pad + i * (W8 + pad) + (W8 - 24) // 2, pad * 2 + W8))
        g1 = draw(GLYPHS[n], pal, 1)
        im.alpha_composite(g1, (pad + i * (W8 + pad) + (W8 - 12) // 2, pad * 2 + W8 + 30))
    m8 = draw(MARK_PAUSE, pal, 4)
    im.alpha_composite(m8, (pad, pad * 3 + W8 + 30 + 12 - 28))
    return im


def export():
    s = open(SPRITES, encoding='utf8').read()
    body = ['  /* HUDGLYPH:BEGIN — v3.52 THE PAPERS ROW: the six papers the keys open, a glyph each, 12×12 on the survey marks\'',
            '     palette, drawn by hand (the bench: tools/hud/hud.py — written here by it, do not edit between the markers) */',
            '  const HUDGLYPH = {']
    for n, rows in GLYPHS.items():
        body.append(f"    {n}: [" + ', '.join(f"'{r}'" for r in rows) + '],')
    body.append('  };')
    body.append("  MARKS.pause = [" + ', '.join(f"'{r}'" for r in MARK_PAUSE) + '];   // the Paused sheet, in the manual\'s index of windows')
    body.append('  /* HUDGLYPH:END */')
    block = '\n'.join(body)
    if '/* HUDGLYPH:BEGIN' in s:
        s = re.sub(r'  /\* HUDGLYPH:BEGIN.*?/\* HUDGLYPH:END \*/', lambda m: block, s, flags=re.S)
    else:
        anchor = s.index('  const MARKS = {')
        end = s.index('\n  };\n', anchor) + len('\n  };\n')
        s = s[:end] + block + '\n' + s[end:]
    if 'HUDGLYPH,' not in s and ', HUDGLYPH }' not in s:
        s = s.replace('COURIER, SALVAGE };', 'COURIER, SALVAGE, HUDGLYPH };', 1)
    open(SPRITES, 'w', encoding='utf8').write(s)


if __name__ == '__main__':
    pal = mark_pal()
    bad = check(pal)
    for b in bad:
        print(b)
    if bad:
        print(f'{len(bad)} faults')
        sys.exit(1)
    if '--check' in sys.argv:
        print('hud glyphs · clean')
        sys.exit(0)
    os.makedirs(os.path.dirname(SHOT), exist_ok=True)
    sheet(pal).save(SHOT)
    export()
    print(f'hud glyphs · {len(GLYPHS)} glyphs and the pause mark · clean · {os.path.relpath(SHOT, ROOT)} · written into src/12e_sprites.js')
