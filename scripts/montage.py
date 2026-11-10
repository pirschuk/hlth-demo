# Склейка скриншотов телефона в ряд по общей высоте: python3 scripts/montage.py out.png a.png b.png ...
import sys
from PIL import Image

out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
h = min(im.height for im in ims)
tiles = [im.resize((int(im.width * h / im.height), h)) for im in ims]
gap = 16
sheet = Image.new('RGB', (sum(t.width for t in tiles) + gap * (len(tiles) - 1), h), (255, 255, 255))
x = 0
for t in tiles:
    sheet.paste(t, (x, 0))
    x += t.width + gap
sheet.save(out)
print(out)
