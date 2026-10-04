"""montage.py — v3.50: compose shots/courier_in_game.png from the in-game frames tests/probe_courier_final.mjs writes
(shots/cf_*.png): the four sides, the stride, a load on the bedroll, the ride, the wire, the lamp at night, and the people
side by side. Frames are pasted 1:1 (never scaled), captioned above each row."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SHOTS = os.path.join(ROOT, 'shots')
BG, INK = (21, 24, 29), (226, 214, 176)
GAP, CAP, PAD = 14, 20, 14

ROWS = [
    ('THE FOUR SIDES - toward the eye, east, away, west (its mirror)',
     ['side_S', 'side_E', 'side_N', 'side_W']),
    ('THE STRIDE - four steps, the contacts held longer',
     ['stride_walk1', 'stride_walk2', 'stride_walk3', 'stride_walk4']),
    ('A LOAD ON THE BEDROLL (the rig frame, three crates) - the ride - the wire - the lamp at night (the rim on the lamp\'s side)',
     ['load_S', 'load_E', 'load_N', 'ride', 'zip', 'night']),
    ('SIDE BY SIDE - two hands and the Walker (couriers), five Farkeepers a courier\'s head taller',
     ['people']),
]


def font():
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, 11)
    return ImageFont.load_default()


def main():
    rows = [(cap, [Image.open(os.path.join(SHOTS, f'cf_{n}.png')).convert('RGB') for n in names]) for cap, names in ROWS]
    W = max(PAD * 2 + sum(im.width for im in ims) + GAP * (len(ims) - 1) for _, ims in rows)
    H = PAD + sum(CAP + max(im.height for im in ims) + GAP for _, ims in rows)
    out = Image.new('RGB', (W, H), BG)
    d, f = ImageDraw.Draw(out), font()
    y = PAD
    for cap, ims in rows:
        d.text((PAD, y), cap, fill=INK, font=f)
        y += CAP
        x = PAD
        for im in ims:
            out.paste(im, (x, y))
            x += im.width + GAP
        y += max(im.height for im in ims) + GAP
    out.save(os.path.join(SHOTS, 'courier_in_game.png'))
    print('courier_in_game.png', out.size)


if __name__ == '__main__':
    main()
