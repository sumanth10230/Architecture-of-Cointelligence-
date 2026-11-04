from pathlib import Path
import subprocess
from PIL import Image
Image.MAX_IMAGE_PIXELS = 150_000_000
root = Path(__file__).resolve().parents[1]
ffmpeg = root.parents[1] / 'work/media-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe'
assets = [
 (Path('C:/Website/AOI/Images/3rd image.png'), 'images/tensile/system-detail'),
 (Path('C:/AADRL/Spyropoulos studio/Phase 2/00_WIP/Linkedin post/1.png'), 'images/project/intelligent-biome'),
]
for source, dest in assets:
 with Image.open(source) as image:
  image = image.convert('RGB')
  for suffix, width in [('', 2560), ('-mobile', 1280)]:
   copy = image.copy()
   copy.thumbnail((width, width), Image.Resampling.LANCZOS)
   target = root / 'public' / (dest + suffix + '.webp')
   target.parent.mkdir(parents=True, exist_ok=True)
   copy.save(target, 'WEBP', quality=88, method=6)
   print(target.name, copy.size, target.stat().st_size, flush=True)
source = 'C:/Website/AOI/Videos/Video/TS_Architecture of Co Intelligence_Screen 4.mp4'
out = root / 'public/media/chapters'
for size, width, quality in [('desktop', 1920, 22), ('mobile', 960, 25)]:
 subprocess.run([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-an', '-vf', f'scale={width}:-2', '-c:v', 'libx264', '-preset', 'medium', '-crf', str(quality), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(out / f'architecture-{size}.mp4')], check=True)
subprocess.run([str(ffmpeg), '-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.5', '-i', source, '-frames:v', '1', '-vf', 'scale=1600:-2', '-q:v', '3', str(out / 'architecture-poster.jpg')], check=True)
print('Architecture film prepared; natural duration 8.72 seconds.', flush=True)
