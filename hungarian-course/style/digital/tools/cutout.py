import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB"); W, H = im.size
a = np.asarray(im).astype(np.float32)
R, G, B = a[..., 0], a[..., 1], a[..., 2]
lum = 0.299 * R + 0.587 * G + 0.114 * B
# sky: bright, bluish/neutral, low saturation-to-blue ratio
sky = ((B > R + 6) & (lum > 150)) | ((lum > 205) & (np.abs(R - B) < 40) & (G > 190))
sky = sky & (np.arange(H)[:, None] < 520)  # only above eaves
m = Image.fromarray((sky * 255).astype(np.uint8))
# closing: remove thin power lines inside sky
m = m.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
# opening to drop isolated sky specks inside the thatch
m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
skym = np.asarray(m) > 127
# house polygon (generous outside the roof, tight elsewhere) + torn bottom edge
rng = np.random.default_rng(4)
poly = [(160, 528), (198, 352), (232, 300), (420, 196), (505, 160), (560, 176), (690, 212), (762, 222), (840, 250), (925, 245), (1010, 345), (1100, 415), (1218, 512), (1200, 530), (1160, 534), (1160, 652)]
# torn bottom from right to left
xs = np.linspace(1160, 96, 70)
for i, x in enumerate(xs):
    base = 652 + (1160 - x) / (1160 - 680) * 128 if x > 680 else 780 + (680 - x) / (680 - 96) * -20
    poly.append((float(x), float(base + rng.normal(0, 4.5) + (6 if i % 2 else 0))))
poly += [(96, 610), (118, 545)]
pm = Image.new("L", (W, H), 0); ImageDraw.Draw(pm).polygon(poly, fill=255)
mask = (np.asarray(pm) > 127) & (~skym)
mask[250:335, 826:918] = False  # floating stork nest (pole lost in keying)
alpha = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
rgba = im.copy(); rgba.putalpha(alpha)
bbox = alpha.getbbox(); rgba = rgba.crop(bbox)
rgba.save(out); print("bbox", bbox, rgba.size)
