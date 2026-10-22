"""Aivazovsky — The brig Mercury after the victory over two Turkish ships (1848). usage: aivazovsky.py build | frames t,... """
import sys, os, time
from common import *

NAME = 'aivazovsky'
W_ = f'{R}/work'
DUR = 10.0
SC = 2 / 3
img = cv2.resize(pz.imread(f'{R}/src/{NAME}.png'), None, fx=SC, fy=SC, interpolation=cv2.INTER_AREA)
H, W = img.shape[:2]
D = cv2.resize(np.load(f'{W_}/{NAME}_depth.npy'), (W, H), interpolation=cv2.INTER_AREA)
LP = f'{W_}/{NAME}_layers.npz'
YH = 1888 * SC            # horizon
YW = 1925 * SC            # ship waterline
WSHIP = (YW - YH) / (H - YH)
yy = np.arange(H, dtype=np.float32)[:, None] * np.ones((1, W), np.float32)
xx = np.ones((H, 1), np.float32) * np.arange(W, dtype=np.float32)[None, :]


def ship_alpha():
    box = (xx > 2080 * SC) & (xx < 2650 * SC) & (yy > 1470 * SC) & (yy < YW + 2)
    m = (D > 0.08) & box
    m = pz.clean_mask(m, 300, 400)
    g = pz.guided_color(img, m.astype(np.float32), 3, 1e-3)
    a = pz.smoothstep(0.3, 0.7, g) * box
    # above the waterline grow a little (rigging, antialiasing of masts); keep the hull/water edge tight
    grown = cv2.dilate(a, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    up = pz.smoothstep(YW - 4, YW - 14, yy)
    a = np.maximum(a, grown * up)
    return cv2.GaussianBlur(a.astype(np.float32), (0, 0), 0.9)


def build():
    a1 = ship_alpha()
    w0 = np.clip((yy - YH) / (H - YH), 0, 1).astype(np.float32)
    w0 = cv2.GaussianBlur(w0, (0, 0), 3)
    w1 = np.full((H, W), WSHIP, np.float32)
    layers = pz.build_layers(img, D, [np.ones((H, W), np.float32), a1], wmaps=[w0, w1], band=120, cache=f'{W_}/{NAME}', dil=6)
    save_layers(LP, layers)
    pv = layers[0].rgb[int(900 * SC):int(2000 * SC), int(1900 * SC):int(2800 * SC)]
    pz.imwrite(f'{W_}/{NAME}_fill0_crop.jpg', pv)


# ---- camera (source px, 2560x1621) ----
SHIP = (1600, 1180)
cam = pz.Cam([
    (0.0, dict(cx=1170, cy=850, vw=2240, px=0, py=0, k=0.0)),
    (DUR, dict(cx=1440, cy=975, vw=1760, px=-150, py=0, k=0.05)),
], fx=lambda u: pz.ease_io(u, 1.5))
FOCUS = SHIP

# ---- living details ----
cloud_v = fbm_noise((H // 8, W // 8), 30, 7, 2)
cloud_v2 = fbm_noise((H // 8, W // 8), 24, 9, 2)
phase = fbm_noise((H // 4, W // 4), 40, 5, 2) * 3.0
lum = img.mean(2)
sea = pz.smoothstep(YH + 2, YH + 12, yy)
glint = (pz.smoothstep(0.42, 0.75, lum) * sea).astype(np.float32)
twk = fbm_noise((H, W + 400), 7, 21, 2)


def samp(field, sx, sy, fx):
    return cv2.remap(field, (sx * fx).astype(np.float32), (sy * fx).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def disp0(sx, sy, t):
    # clouds: slow drift and gentle deformation, fading to zero at the horizon
    skyf = pz.smoothstep(YH - 6, YH - 90, sy)
    v = samp(cloud_v, sx, sy, 1 / 8); v2 = samp(cloud_v2, sx, sy, 1 / 8)
    dx = -(t * (2.2 + 1.6 * v)) * skyf
    dy = -(0.9 * np.sin(0.5 * t + 3 * v2)) * skyf
    # sea: perspective-scaled wave heave
    g = np.clip((sy - YH) / (H - YH), 0, 1)
    ph = samp(phase, sx, sy, 1 / 4)
    lam = 30 + 240 * g
    amp = (0.35 + 4.2 * g) * pz.smoothstep(YH, YH + 6, sy)
    a1 = 2 * np.pi * (sx / lam * 0.35 + sy / lam) - 2 * np.pi * 0.23 * t + ph
    a2 = 2 * np.pi * (-sx / lam * 0.6 + sy / lam * 0.8) - 2 * np.pi * 0.31 * t + 1.7 * ph
    dx = dx + amp * (0.8 * np.sin(a1) + 0.5 * np.sin(a2))
    dy = dy + amp * 0.45 * (np.cos(a1) + 0.6 * np.cos(a2))
    return dx, dy


def tex0(L, t):
    # moonlight glitter twinkle on the sea
    y0 = int(YH)
    off = int(t * 26)
    n = twk[y0:, off:off + W]
    gain = 1 + 0.38 * n * glint[y0:]
    p = L.prem.copy()
    p[y0:, :, :3] = np.clip(p[y0:, :, :3] * gain[..., None], 0, 1)
    return p


def disp1(sx, sy, t):
    # brig: slow roll and heave around the waterline centre
    th = np.deg2rad(0.45 * np.sin(2 * np.pi * t / 5.2) + 0.15 * np.sin(2 * np.pi * t / 2.9 + 1))
    hv = 2.2 * np.sin(2 * np.pi * t / 5.2 + 0.9)
    cx, cy = 1600, YW
    x = sx - cx; y = sy - cy - hv
    c, s = np.cos(-th), np.sin(-th)
    return (c * x - s * y + cx) - sx, (s * x + c * y + cy) - sy


DISP = {0: disp0, 1: disp1}
TEX = {0: tex0}


def frame(layers, t):
    f = pz.render_frame(layers, cam, t, RW, RH, FOCUS, disp_hooks=DISP, tex_hooks=TEX)
    return cv2.resize(f, (OW, OH), interpolation=cv2.INTER_AREA)


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'build':
        build()
    elif cmd == 'frames':
        layers = load_layers(LP)
        os.makedirs(f'{W_}/{NAME}_fr', exist_ok=True)
        for ts in sys.argv[2].split(','):
            t = float(ts); t0 = time.time()
            pz.imwrite(f'{W_}/{NAME}_fr/t{t:05.2f}.jpg', frame(layers, t))
            print(t, round(time.time() - t0, 2))
