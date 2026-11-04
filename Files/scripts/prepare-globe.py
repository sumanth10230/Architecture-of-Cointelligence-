"""Extract a visual (not georeferenced) globe layer from the supplied map.
Run: python scripts/prepare-globe.py path/to/map.jpg
Requires Pillow and numpy; used only at authoring time, never by the website.
"""
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

root = Path(__file__).resolve().parents[1] / 'public'
source = Image.open(sys.argv[1]).convert('RGB')
rgb = np.asarray(source).astype(float)
r, g, b = rgb.transpose(2, 0, 1)
purple = (r - g > 22) & (b - g > 20) & (b > 90)
height, width = purple.shape
points = []
# One weighted centroid per occupied cell; every point comes from marked pixels.
# No synthetic locations, jitter, inferred populations or invented species data.
cell = 8
for y in range(0, height, cell):
    for x in range(0, width, cell):
        patch = purple[y:y+cell, x:x+cell]
        yy, xx = np.nonzero(patch)
        if len(xx) < 3:
            continue
        lon = ((x + xx.mean() + .5) / width) * 360 - 180
        lat = 90 - ((y + yy.mean() + .5) / height) * 180
        points.append([round(lon, 4), round(lat, 4), round(len(xx) / patch.size, 3)])

# Derive a restrained land/ocean surface from the original light-grey basemap.
# The texture and points use identical full-image bounds, so they stay aligned.
land = ((rgb.mean(axis=2) < 249) | purple).astype('uint8') * 255
mask = Image.fromarray(land).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
mask = mask.resize((2048, 1024), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(.35))
blend = np.asarray(mask).astype(float)[..., None] / 255
ocean = np.array([9, 21, 32])
continent = np.array([95, 112, 111])
texture = np.uint8(ocean + blend * (continent-ocean))
for name in ('textures', 'data'):
    (root/name).mkdir(exist_ok=True, parents=True)
Image.fromarray(texture).save(root/'textures/planet-surface.jpg', quality=92)
mask.save(root/'textures/planet-land-mask.png')
source.resize((1584, 774), Image.Resampling.LANCZOS).save(root/'textures/planet-map.jpg', quality=91)
# Monochrome fallback uses the same extracted positions, not synthetic geography.
fallback_blend = np.asarray(mask.resize((1584, 792))).astype(float)[..., None] / 255
fallback_rgb = np.repeat(np.uint8(52 + fallback_blend * (181 - 52)), 3, axis=2)
fallback = Image.fromarray(fallback_rgb)
pen = ImageDraw.Draw(fallback)
for lon, lat, _ in points:
    px, py = (lon+180)/360*1584, (90-lat)/180*792
    pen.ellipse((px-1.1, py-1.1, px+1.1, py+1.1), fill='#e32636')
fallback.save(root/'textures/planet-map-monochrome.webp', quality=88)
metadata = {
    'source': Path(sys.argv[1]).name,
    'method': 'Purple pixel clusters sampled into weighted 8px cell centroids.',
    'projection': 'Assumed equirectangular, full image spans longitude -180..180 and latitude 90..-90.',
    'limitation': 'Illustrative reconstruction from a raster image, not georeferenced source records. Weights describe coloured pixel coverage, not scientific counts.',
    'sourceSize': [width, height], 'count': len(points), 'points': points,
}
(root/'data/planet-points.json').write_text(json.dumps(metadata, separators=(',', ':')), encoding='utf-8')
print(f'Extracted {len(points)} map-derived points from {width}x{height}; saved texture and fallback.')
