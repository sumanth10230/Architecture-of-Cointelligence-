"""Optimize the supplied assets, preserving diagram transparency and geometry."""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parents[1]
output = root / 'public/images/tensile'
output.mkdir(parents=True, exist_ok=True)
source = Path('C:/Portfolio/Draft 7_18,02,2026/Draft 7_18,02,2026 Folder/Links')
prefix_a = 'BB_D_2DCCO_S40_0A_W1_SR0_0A_ISO_'
prefix_b = 'BB_D_2DVRN_EXP_S100_4A_W1_SR100_'
pairs = [
    (13, 2, 0, [prefix_a+'Initial Tension.png', prefix_a+'Relaxed Tension.png']),
    (14, 3, 0, [prefix_b+'3A_ISO_Initial Pull.png', prefix_b+'3A_ISO_Tension Relaxed.png']),
    (7, 3, 6, [prefix_b+'3A_ISO_Tension Anchored Initial.png', prefix_b+'3A_ISO_Tension Anchored Relaxed.png']),
    (8, 4, 2, [prefix_b+'2A_ISO_Tension Anchored Initial.png', prefix_b+'2A_ISO_Tension Anchored Relaxed.png']),
]
# Shared crop bounds retain the relative position/scale of every diagram.
images = [Image.open(source/name).convert('RGBA') for *_, names in pairs for name in names]
boxes = [im.getbbox() for im in images]
crop = (min(b[0] for b in boxes)-60, min(b[1] for b in boxes)-60,
        max(b[2] for b in boxes)+60, max(b[3] for b in boxes)+60)
records=[]
for i, (iteration, force, anchors, names) in enumerate(pairs):
    paths=[]
    for j, name in enumerate(names):
        im=images[i*2+j].crop(crop)
        im.thumbnail((1000,600), Image.Resampling.LANCZOS)
        filename=f'iteration-{iteration}-{j+1}.webp'
        im.save(output/filename, lossless=True)
        paths.append('/images/tensile/'+filename)
    records.append(dict(iteration=iteration, force=force, anchors=anchors, images=paths, originals=names))
(root/'src/data/tensile-studies.json').write_text(json.dumps(records, indent=2)+'\n', encoding='utf-8')
photo=Image.open('C:/Website/AOI/Images/sheet7.png').convert('RGB')
photo.thumbnail((2560,1440), Image.Resampling.LANCZOS)
photo.save(output/'workshop.webp', quality=90)
print('Prepared workshop photograph and eight transparent diagrams; captions transcribed from supplied reference.')
