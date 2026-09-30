import sys, glob
from PIL import Image
out, *files = sys.argv[1:]
ims = [Image.open(f).resize((640, 360)) for f in files]
cols = 3; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (640 * cols, 360 * rows))
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * 640, (i // cols) * 360))
sheet.save(out)
