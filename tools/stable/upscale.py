#!/usr/bin/env python3
"""Experiment: the stable at the courier's scale — each horse's rows at 4/3 by Scale2x twice (4×, edges kept, no new
colours) and a 3×3 vote down (each texel the letter most of its block holds; the outline wins a tie). Preview only."""
import json, os, re, sys, subprocess
from collections import Counter
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'courier'))
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def horses():
    js = subprocess.check_output(['node', '-e', """
const src=require('fs').readFileSync('src/12e_sprites.js','utf8');
const a=src.indexOf('const HORSES = {'); const b=src.indexOf('const CADENCE');
const H=eval('('+src.slice(a+'const HORSES = '.length, src.lastIndexOf('};',b)+1)+')');
console.log(JSON.stringify(H));"""], cwd=ROOT)
    return json.loads(js)


def scale2x(g):
    h, w = len(g), len(g[0])
    at = lambda x, y: g[min(h - 1, max(0, y))][min(w - 1, max(0, x))]
    out = [['.'] * (w * 2) for _ in range(h * 2)]
    for y in range(h):
        for x in range(w):
            P = g[y][x]; A = at(x, y - 1); B = at(x + 1, y); C = at(x - 1, y); D = at(x, y + 1)
            e1 = e2 = e3 = e4 = P
            if C == A and C != D and A != B: e1 = A
            if A == B and A != C and B != D: e2 = B
            if D == C and D != B and C != A: e3 = C
            if B == D and B != A and D != C: e4 = D
            out[2 * y][2 * x] = e1; out[2 * y][2 * x + 1] = e2; out[2 * y + 1][2 * x] = e3; out[2 * y + 1][2 * x + 1] = e4
    return out


def vote3(g, prio='O'):
    h, w = len(g) // 3, len(g[0]) // 3
    out = []
    for y in range(h):
        row = []
        for x in range(w):
            c = Counter(g[3 * y + j][3 * x + i] for j in range(3) for i in range(3))
            best = max(c.values())
            cands = [k for k, v in c.items() if v == best]
            if len(cands) > 1 and prio in cands: row.append(prio)
            elif len(cands) > 1 and '.' in cands and len(cands) == 2: row.append([k for k in cands if k != '.'][0])
            else: row.append(cands[0])
        out.append(row)
    return out


def keep_details(src, out, letters):
    """a single texel that carries a face (an eye) survives the vote: set where its centre lands"""
    for y, row in enumerate(src):
        for x, ch in enumerate(row):
            if ch in letters:
                xx, yy = int((x + 0.5) * 4 / 3), int((y + 0.5) * 4 / 3)
                if yy < len(out) and xx < len(out[yy]):
                    out[yy] = out[yy][:xx] + ch + out[yy][xx + 1:]
    return out


def up43(rows, details=''):
    g = [list(r) for r in rows]
    # pad to a multiple of 3 after 4× (4w must divide by 3: pad w to a multiple of 3)
    w, h = len(g[0]), len(g)
    pw = (-w) % 3; ph = (-h) % 3
    g = [r + ['.'] * pw for r in g] + [['.'] * (w + pw) for _ in range(ph)]
    g4 = scale2x(scale2x(g))
    out = [''.join(r) for r in vote3(g4)]
    return keep_details(rows, out, details) if details else out


if __name__ == '__main__':
    H = horses()
    SP = '/tmp/claude-0/-home-claude/6b4ed241-f59c-5646-95c9-b16861a92127/scratchpad/'
    k = 6
    items = []
    for name, v in H.items():
        items.append((name, v['frames']['idle'], v['pal']))
        items.append((name + ' 4/3', up43(v['frames']['idle']), v['pal']))
    W = sum(len(r[0]) * k + 20 for _, r, _ in items) + 20
    Hh = max(len(r) * k for _, r, _ in items) + 40
    im = Image.new('RGB', (W, Hh), '#2a2f37'); d = ImageDraw.Draw(im); x0 = 10
    for name, rows, pal in items:
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch == '.': continue
                d.rectangle([x0 + x * k, 10 + y * k, x0 + x * k + k - 1, 10 + y * k + k - 1], fill=pal.get(ch, '#f0f'))
        d.text((x0, Hh - 20), name, fill='#ccc')
        x0 += len(rows[0]) * k + 20
    im.save(SP + 'stable43.png')
    print('ok')


def write_registry():
    """rewrite SPRITES.HORSES at 4/3: every frame of every breed, the ground and the seat carried to the new grid"""
    H = horses()
    p = os.path.join(ROOT, 'src', '12e_sprites.js')
    src = open(p).read()
    a = src.index('  const HORSES = {')
    b = src.index('  const CADENCE = [')
    out = ['  const HORSES = {']
    for name, v in H.items():
        fr = {'idle': up43(v['frames']['idle']), 'walk': [up43(f) for f in v['frames']['walk']]}
        rows = fr['idle']
        # trim the padding rows/columns every frame leaves empty
        allf = [fr['idle']] + fr['walk']
        hh = max(max((y for y, r in enumerate(f) if r.strip('.')), default=0) for f in allf) + 1
        ww = max(max((len(r.rstrip('.')) for r in f), default=0) for f in allf)
        allf = [[r[:ww] for r in f[:hh]] for f in allf]
        fr = {'idle': allf[0], 'walk': allf[1:]}
        s = lambda c: int(round((c + 0.5) * 4 / 3 - 0.5))
        ground = {'x': s(v['ground']['x']), 'y': max(y for y, r in enumerate(fr['idle']) if r.strip('.'))}
        seat = {'x': s(v['seat']['x']), 'y': s(v['seat']['y'])}
        out.append(f"    {name}: {{ w: {ww}, h: {hh}, pal: {json.dumps(v['pal'])}, ground: {json.dumps(ground)}, seat: {json.dumps(seat)},")
        out.append('      frames: { idle: [')
        for r in fr['idle']:
            out.append(f"        '{r}',")
        out.append('      ], walk: [[')
        for i, f in enumerate(fr['walk']):
            for r in f:
                out.append(f"        '{r}',")
            out.append('      ], [' if i < len(fr['walk']) - 1 else '      ]] } },')
    out.append('  };')
    src = src[:a] + '\n'.join(out) + '\n\n' + src[b:]
    open(p, 'w').write(src)
    return {k: None for k in H}


if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == '--write':
    print(write_registry())


FARKEEP = ['pugugly', 'longbowmen', 'berserker', 'rifle_rider', 'recon_rider']


def write_kit():
    """v3.50: the Farkeeper classes a courier's head taller again — their idle, A and B at 4/3, the eyes kept, trimmed
    to one box per class (the feet on its last row but one, as every figure's)"""
    js = subprocess.check_output(['node', '-e', """
const src=require('fs').readFileSync('src/12e_sprites.js','utf8');
const a=src.indexOf('const KIT = {'); const b=src.indexOf('const RAID_PAL');
console.log(JSON.stringify(eval('('+src.slice(a+'const KIT = '.length, src.lastIndexOf('};',b)+1)+')')));"""], cwd=ROOT)
    K = json.loads(js)
    p = os.path.join(ROOT, 'src', '12e_sprites.js')
    src = open(p).read()
    sizes = {}
    for name in FARKEEP:
        fr = {f: up43(K[name][f], 'e') for f in ('idle', 'A', 'B')}
        allf = list(fr.values())
        top = min(min((y for y, r in enumerate(f) if r.strip('.')), default=99) for f in allf)
        bot = max(max((y for y, r in enumerate(f) if r.strip('.')), default=0) for f in allf)
        left = min(min((len(r) - len(r.lstrip('.')) for r in f if r.strip('.')), default=99) for f in allf)
        right = max(max((len(r.rstrip('.')) for r in f), default=0) for f in allf)
        w = right - left
        if w % 2: right += 1; w += 1   # an even width: the figure's middle on the anchor
        fr = {k: [r[left:right].ljust(w, '.') for r in f[top:bot + 1]] + ['.' * w] for k, f in fr.items()}
        ax = int(round(7 * 4 / 3)) - left   # the old grid's middle (column 7 of 14), carried: where the feet stand
        sizes[name] = (w, len(fr['idle']), ax)
        a = src.index(f'\n    {name}: {{\n') + 1
        b = src.index('\n    },\n', a) + len('\n    },\n')
        out = [f'    {name}: {{   // v3.50: a third again — a courier\'s head taller ({w}×{len(fr["idle"])}, the stable\'s resample, the eyes kept)', f'      ax: {ax},']
        for k, f in fr.items():
            out.append(f'      {k}: [')
            for i in range(0, len(f), 4):
                out.append('        ' + ', '.join(f"'{r}'" for r in f[i:i + 4]) + ',')
            out.append('      ],')
        out.append('    },\n')
        src = src[:a] + '\n'.join(out) + src[b:]
    open(p, 'w').write(src)
    return sizes


if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == '--kit':
    print(write_kit())


def fmt_rows(rows, per=4, ind='    '):
    return '\n'.join(ind + ', '.join(f"'{r}'" for r in rows[i:i + per]) + ',' for i in range(0, len(rows), per))


def write_people():
    """v3.50: the Flame Keepers' tender and the Reapers' hooded figure a third again, beside the courier — their eyes (the
    tender's eye, the Reaper's pale slit) kept through the vote"""
    js = subprocess.check_output(['node', '-e', """
const src=require('fs').readFileSync('src/12e_sprites.js','utf8');
const t=src.indexOf('const TENDER = ['); const T=eval(src.slice(t+'const TENDER = '.length, src.indexOf('];', t)+1));
const r2=require('fs').readFileSync('src/17_render.js','utf8'); const r=r2.indexOf('const REAPER = ['); const R=eval(r2.slice(r+'const REAPER = '.length, r2.indexOf('];', r)+1));
console.log(JSON.stringify({T, R}));"""], cwd=ROOT)
    d = json.loads(js)
    trim = lambda rows: [r for r in rows]
    T = up43(d['T'], 'e'); R = up43(d['R'], 'L')
    def box(rows):
        top = min(y for y, r in enumerate(rows) if r.strip('.')); bot = max(y for y, r in enumerate(rows) if r.strip('.'))
        left = min(len(r) - len(r.lstrip('.')) for r in rows if r.strip('.')); right = max(len(r.rstrip('.')) for r in rows)
        w = right - left + ((right - left) % 2)
        return [r[left:left + w].ljust(w, '.') for r in rows[top:bot + 1]] + ['.' * w]
    T = box(T); R = box(R)
    p = os.path.join(ROOT, 'src', '12e_sprites.js'); s = open(p).read()
    a = s.index('  const TENDER = ['); b = s.index('  ];', a) + len('  ];')
    s = s[:a] + f"  const TENDER = [   // v3.50: a third again, beside the courier ({len(T[0])}×{len(T)}, the stable's resample, the eye kept)\n" + fmt_rows(T) + '\n  ];' + s[b:]
    open(p, 'w').write(s)
    p = os.path.join(ROOT, 'src', '17_render.js'); s = open(p).read()
    a = s.index('  const REAPER = ['); b = s.index('  ];', a) + len('  ];')
    s = s[:a] + f"  const REAPER = [   // v3.50: a third again — a tall cloak beside the courier ({len(R[0])}×{len(R)}, the stable's resample, the slit kept)\n" + fmt_rows(R) + '\n  ];' + s[b:]
    open(p, 'w').write(s)
    return (len(T[0]), len(T)), (len(R[0]), len(R))


if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == '--people':
    print(write_people())
