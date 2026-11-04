"""Prepare silent looping films and stills; preserve source length and aspect ratio."""
import argparse
from pathlib import Path
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--ffmpeg', default='ffmpeg')
args = parser.parse_args()
output = Path(__file__).resolve().parents[1] / 'public/media/chapters'
for name, source in [('species', 'Species taxanomy.mp4'), ('masterplan', 'masterplaning taxanomy.mp4')]:
    source = str(Path('C:/Website/AOI/Videos/Video') / source)
    for variant, width, quality in [('desktop', 1920, 22), ('mobile', 960, 25)]:
        subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-i', source,
            '-map', '0:v:0', '-an', '-vf', f'scale={width}:-2', '-c:v', 'libx264',
            '-preset', 'fast', '-crf', str(quality), '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
            str(output / f'{name}-{variant}.mp4')], check=True)
    subprocess.run([args.ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.5', '-i', source,
        '-frames:v', '1', '-vf', 'scale=1600:-2', '-q:v', '3', str(output / f'{name}-poster.jpg')], check=True)
    print(f'Prepared {name} desktop/mobile film and poster.', flush=True)
