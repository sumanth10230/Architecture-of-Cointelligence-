"""Create web-sized copies of supplied photo cards without redrawing or cropping.
Usage: python scripts/prepare-cards.py path/to/Photocards.zip
Requires Pillow only at authoring time. Originals are not changed.
"""
import io
import json
import re
import sys
import zipfile
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw

root = Path(__file__).resolve().parents[1]
destination = root / 'public' / 'images' / 'cards'
destination.mkdir(parents=True, exist_ok=True)
natural = lambda name: [int(part) if part.isdigit() else part.lower() for part in re.split(r'(\d+)', name)]
cards = []
thumbs = []
with zipfile.ZipFile(sys.argv[1]) as archive:
    names = sorted([n for n in archive.namelist() if n.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')) and not n.startswith('__MACOSX/')], key=natural)
    if len(names) != 88:
        raise ValueError('This edition uses exactly 88 supplied images.')
    for index, name in enumerate(names):
        original = ImageOps.exif_transpose(Image.open(io.BytesIO(archive.read(name)))).convert('RGB')
        filename = f'{index+1:03d}'
        for suffix, size in (('', (700, 600)), ('-mobile', (350, 300))):
            image = original.copy()
            image.thumbnail(size, Image.Resampling.LANCZOS)
            image.save(destination / f'{filename}{suffix}.webp', 'WEBP', quality=88, method=6)
        cards.append({'id': index, 'source': Path(name).name, 'image': f'/images/cards/{filename}.webp', 'mobileImage': f'/images/cards/{filename}-mobile.webp', 'aspect': round(original.width/original.height, 8), 'label': f'Botanical research card — {Path(name).stem}'})
        thumb = original.copy()
        thumb.thumbnail((140, 120))
        thumbs.append((thumb, Path(name).name))
(root/'src/data/botanical-cards.json').write_text(json.dumps(cards, indent=2), encoding='utf-8')
grid = Image.new('RGB', (764, 1208), '#fafaf8')
for index, (thumb, _) in enumerate(thumbs[:44]):
    grid.paste(thumb, ((index%5)*156, (index//5)*136))
grid.save(destination/'layer-a.webp', quality=88)
sheet = Image.new('RGB', (1500, 14 * ((len(thumbs)+9)//10) + 120 * ((len(thumbs)+9)//10)), '#dededb')
draw = ImageDraw.Draw(sheet)
for index, (thumb, label) in enumerate(thumbs):
    x, y = (index%10)*150, (index//10)*134
    sheet.paste(thumb, (x, y))
    draw.text((x+2, y+120), label, fill='black')
sheet.save(root/'public/images/cards/contact-sheet.jpg', quality=88)
print(f'Prepared {len(names)} archival cards. The scene selects the first 80 in two groups of 40; all 88 remain inspectable.')
