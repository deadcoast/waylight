#!/usr/bin/env python3
"""Preview: the Farkeeper classes at 4/3 (a courier's head taller), by the stable's resample."""
import json, os, sys, subprocess
sys.path.insert(0, os.path.dirname(__file__))
from upscale import up43, ROOT
from PIL import Image, ImageDraw

def kit():
    js = subprocess.check_output(['node', '-e', """
const src=require('fs').readFileSync('src/12e_sprites.js','utf8');
const a=src.indexOf('const KIT = {'); const b=src.indexOf('const RAID_PAL');
const K=eval('('+src.slice(a+'const KIT = '.length, src.lastIndexOf('};',b)+1)+')');
const pa=src.indexOf('const FK_PAL = '); const pal=eval('('+src.slice(pa+'const FK_PAL = '.length, src.indexOf(';', pa))+')');
console.log(JSON.stringify({K, pal}));"""], cwd=ROOT)
    return json.loads(js)

if __name__ == '__main__':
    d = kit(); K, pal = d['K'], d['pal']
    SP = '/tmp/claude-0/-home-claude/6b4ed241-f59c-5646-95c9-b16861a92127/scratchpad/'
    k = 6; items = []
    for name in ['pugugly', 'longbowmen', 'berserker', 'rifle_rider', 'recon_rider']:
        items.append((name, K[name]['idle'])); items.append((name + ' 4/3', up43(K[name]['idle'], 'e')))
    W = sum(len(r[0]) * k + 16 for _, r in items) + 16; Hh = max(len(r) * k for _, r in items) + 40
    im = Image.new('RGB', (W, Hh), '#2a2f37'); dr = ImageDraw.Draw(im); x0 = 8
    for name, rows in items:
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch == '.': continue
                dr.rectangle([x0 + x * k, 8 + y * k, x0 + x * k + k - 1, 8 + y * k + k - 1], fill=pal.get(ch, '#f0f'))
        dr.text((x0, Hh - 18), name, fill='#ccc'); x0 += len(rows[0]) * k + 16
    im.save(SP + 'kit43b.png'); print('ok')
