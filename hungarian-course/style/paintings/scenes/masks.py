"""mask preview: python3 masks.py name th1,th2,... -> work/name_masks.jpg"""
import sys, numpy as np, cv2
import os; R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, R + '/tools')
import pz
name = sys.argv[1]; ths = [float(x) for x in sys.argv[2].split(',')]

img = pz.imread(f'{R}/src/{name}.png'); D = np.load(f'{R}/work/{name}_depth.npy')
cols = [(0.2, 0.4, 1), (0.2, 1, 0.3), (1, 0.8, 0.1), (1, 0.2, 0.2), (1, 0, 1)]
ov = img * 0.45
for i, th in enumerate(ths):
    m = pz.clean_mask(D > th, 4000, 3000).astype(np.float32)
    g = pz.guided_color(img, m, 6, 2e-3)
    a = pz.smoothstep(0.35, 0.65, g)
    ov = ov * (1 - 0.35 * a[..., None]) + np.array(cols[i]) * 0.35 * a[..., None]
s = 1100 / max(img.shape[:2])
pz.imwrite(f'{R}/work/{name}_masks.jpg', cv2.resize(ov, None, fx=s, fy=s, interpolation=cv2.INTER_AREA))
