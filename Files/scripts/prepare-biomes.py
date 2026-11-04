"""Copy the supplied transparent PNGs unchanged for the three floating studies."""
from pathlib import Path
from shutil import copyfile

output = Path(__file__).resolve().parents[1] / 'public/images/biomes'
output.mkdir(parents=True, exist_ok=True)
for number in range(1, 4):
    copyfile(f'C:/Website/AOI/Images/mirror {number}.png', output / f'mirror-{number}.png')
