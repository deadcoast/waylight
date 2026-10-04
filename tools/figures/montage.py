"""montage.py — v3.51: compose shots/cast_in_game.png from the in-game frames tests/probe_cast.mjs writes (shots/cast_*.png):
the cast on the ground it stands on, 1:1 (never scaled), captioned above each row. `python3 montage.py eco` composes
shots/eco_in_game.png from tests/probe_eco.mjs's frames (shots/eco_*.png), each cut to what it shows, 1:1; `python3 montage.py
reach` composes shots/reach_in_game.png from tests/probe_reach.mjs's (v3.52)."""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
SHOTS = os.path.join(ROOT, 'shots')
BG, INK = (21, 24, 29), (226, 214, 176)
GAP, CAP, PAD = 14, 20, 14

ROWS = [
    ("THE CAMPS' OWN on the road (knife, bowman, ram) and the chief at his fire - the storm's knives at a held post, one down - the wanderer",
     ['camp', 'storm', 'wanderer']),
    ("THE GARRISON - the mountain's shields, the town's own, the kin keeping a place - THE FARKEEPERS walking, one astride",
     ['garrison', 'farkeep']),
    ('THE RIDE - the captive kneeling, the Reapers\' rifles level, the cold lamp, the watchers and the kid, the rider bolting - THE LAMPLIGHTER and the stranger',
     ['ride', 'lamp']),
    ('THE RESCUE riders at the gallop, a walker sat - a walker down - THE KID with the letter held high, the kids running the fence - the tender',
     ['riders', 'down', 'kids', 'tender']),
    ('THE PROCESSION at night - THE FAR SHAPE in the grey - THE FIELD CREWS (the axe at the swing, the stones, a hauler\'s crates)',
     ['procession', 'giant', 'work']),
    ('THE STABLE under the Walker (east; the fjord west, the seat on the saddle both ways) - the sled',
     ['mount_fjord', 'mount_mustang', 'mount_icelandic', 'mount_arabian', 'mount_percheron', 'mount_west', 'sled']),
]


def font():
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSansCondensed.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, 11)
    return ImageFont.load_default()


# the ecosystem pass: (caption, [(shot, crop box (x0, y0, x1, y1) or None)])
ECO = [
    ("THE STANDING over the Mill's board - the card to Relay Hill at x1.24 and a crate more - SURPLUS FREIGHT: the bank's metal as parts",
     [('board', (212, 196, 1068, 700))]),
    ('WHAT IT MOVED - the freight at Relay Hill (the shelf, the light, the bank) - a word kept at Elm Farm (the book, the word on the wire, a road)',
     [('slip', (362, 520, 918, 770)), ('slip_word', (362, 640, 918, 770))]),
    ("THE CAMPS ON THE ROUTES - a knife walks Ridge Camp's salvage to Elm Farm - the sheet: the ring in bone, the way, the knife - the camp's roll",
     [('runner', None), ('map', (430, 50, 900, 460)), ('roll', (720, 172, 1104, 520))]),
    ("A STOP ON THE WAY - hurt, the Guide stops you at a given ring's fire - THE BUS MAP: every window, what it does for your deliveries",
     [('guide', None), ('manual', (192, 160, 1088, 520))]),
]


def eco():
    rows = []
    for cap, parts in ECO:
        ims = []
        for n, box in parts:
            fp = os.path.join(SHOTS, f'eco_{n}.png')
            if os.path.exists(fp):
                im = Image.open(fp).convert('RGB')
                ims.append(im.crop(box) if box else im)
        if ims:
            rows.append((cap, ims))
    compose(rows, 'eco_in_game.png')


# v3.52 within reach: (caption, [(shot, crop box or None)])
REACH = [
    ("THE PAPERS ROW under the ◆ and the day - the pointer on the map's button reads its name and key - the pack open under the row, its button lit, its CLOSE at its foot",
     [('row', None), ('pack', None)]),
    ("THE MAP folds by its own CLOSE - THE MANUAL'S INDEX: each paper's button beside its key, and the Paused sheet listed at last",
     [('maphead', None)]),
    ('', [('index', (0, 0, 900, 560)), ('index_paused', None)]),
    ('THE SLIP ON A SHORT WINDOW - seven things moved, two columns, nothing scrolled, Carry on pinned: 1280×720 - 1024×600',
     [('slip720', None), ('slip600', None)]),
    ('THE PAUSED SHEET at 1280×720 - two columns, Resume pinned - THE INTRO CARD at 1280×600, Start in view and taking the click',
     [('pause720', None), ('intro600', (300, 0, 980, 600))]),
    ('THE TOP BAND keeps its middle - 1024 wide: the Guide narrows under the compass, the toasts beneath it - 900 wide: the Guide steps down under the vitals, the toasts at the compass\'s foot',
     [('band1024', None), ('band900', None)]),
    ('- 800 wide at the Larger paper scale: the band drawn as near Larger as the width allows',
     [('band800L', None)]),
]


def reach():
    rows = []
    for cap, parts in REACH:
        ims = []
        for n, box in parts:
            fp = os.path.join(SHOTS, f'reach_{n}.png')
            if os.path.exists(fp):
                im = Image.open(fp).convert('RGB')
                ims.append(im.crop(box) if box else im)
        if ims:
            rows.append((cap, ims))
    compose(rows, 'reach_in_game.png')


def compose(rows, name):
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
    out.save(os.path.join(SHOTS, name))
    print(name, out.size)


def main():
    rows = []
    for cap, names in ROWS:
        ims = [Image.open(os.path.join(SHOTS, f'cast_{n}.png')).convert('RGB') for n in names if os.path.exists(os.path.join(SHOTS, f'cast_{n}.png'))]
        if ims:
            rows.append((cap, ims))
    compose(rows, 'cast_in_game.png')


if __name__ == '__main__':
    import sys
    eco() if sys.argv[1:] == ['eco'] else reach() if sys.argv[1:] == ['reach'] else main()
