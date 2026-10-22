"""Bilibin — Vasilisa at Baba Yaga's hut. usage: bilibin.py build | frames t1,t2,... | video"""
import sys, os, time
from common import *

NAME = 'bilibin'
W_ = f'{R}/work'
DUR = 9.0
img = pz.imread(f'{R}/src/{NAME}.png')
H, W = img.shape[:2]
D = np.load(f'{W_}/{NAME}_depth.npy')
LP = f'{W_}/{NAME}_layers.npz'


def build():
    al = depth_alphas(img, D, [0.27, 0.62])
    layers = pz.build_layers(img, D, al, sigma=14, band=90, cache=f'{W_}/{NAME}', dil=8)
    save_layers(LP, layers)
    # previews
    s = 0.4
    for i, L in enumerate(layers):
        chk = ((np.indices(L.alpha.shape).sum(0) // 40) % 2).astype(np.float32)[..., None] * 0.3 + 0.35
        pv = L.rgb * L.alpha[..., None] + chk * (1 - L.alpha[..., None])
        pz.imwrite(f'{W_}/{NAME}_L{i}.jpg', cv2.resize(pv, None, fx=s, fy=s, interpolation=cv2.INTER_AREA))
        wv = cv2.applyColorMap((np.clip(L.w, 0, 1) * 255).astype(np.uint8), cv2.COLORMAP_INFERNO)
        cv2.imwrite(f'{W_}/{NAME}_w{i}.jpg', cv2.resize(wv, None, fx=s * 0.5, fy=s * 0.5))


# ---- camera (source px of the 2015x2750 interior) ----
WIN = (780, 395)       # hut window
cam = pz.Cam([
    (0.0, dict(cx=1000, cy=1120, vw=1880, px=0, py=0, k=0.0)),
    (DUR, dict(cx=805, cy=470, vw=1180, px=-15, py=80, k=0.06)),
], fx=lambda u: pz.ease_io(u, 1.6))
FOCUS = WIN

# ---- living details ----
# warm window glow + skull-eye glow masks (in source space)
hsv = cv2.cvtColor((img * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32)
win_m = ((hsv[..., 0] < 22) & (hsv[..., 1] > 110) & (hsv[..., 2] > 150)).astype(np.float32)
win_m *= poly_mask(img.shape, [(640, 300), (980, 300), (980, 560), (640, 560)])
win_m = cv2.GaussianBlur(win_m, (0, 0), 2.0)
lum = img.mean(2)
eye_zone = poly_mask(img.shape, [(1290, 720), (1420, 700), (1700, 1000), (1560, 1100), (1300, 860)], blur=6)
eye_m = cv2.GaussianBlur(pz.smoothstep(0.62, 0.85, lum) * eye_zone, (0, 0), 1.5)
glow_win = cv2.GaussianBlur(win_m, (0, 0), 22)
glow_eye = cv2.GaussianBlur(eye_m, (0, 0), 16)


def flick(t, seed):
    # smooth candle-like flicker in [-1,1]
    r = np.random.RandomState(seed)
    fr = r.uniform(1.3, 4.7, 5); ph = r.uniform(0, 6.28, 5); am = np.array([1, .6, .45, .3, .2])
    return float((am * np.sin(fr * t * 6.283 / 2 + ph)).sum() / am.sum())


def tex_far(L, t):
    # window flicker on far layer
    g = 0.16 * flick(t, 3) + 0.06
    p = L.prem.copy()
    y0, y1, x0, x1 = 200, 650, 500, 1100
    add = (win_m[y0:y1, x0:x1] * g)[..., None] * p[y0:y1, x0:x1, :3] + (glow_win[y0:y1, x0:x1] * (0.10 + 0.08 * g))[..., None] * np.array([1.0, 0.55, 0.2], np.float32)
    p[y0:y1, x0:x1, :3] = np.clip(p[y0:y1, x0:x1, :3] + add * p[y0:y1, x0:x1, 3:4], 0, 1)
    return p


def tex_near(L, t):
    g = 0.5 + 0.5 * flick(t, 11)
    p = L.prem.copy()
    y0, y1, x0, x1 = 600, 1200, 1200, 1800
    add = (eye_m[y0:y1, x0:x1] * 0.22 * g)[..., None] * np.array([1, 1, 0.92], np.float32) + (glow_eye[y0:y1, x0:x1] * 0.10 * g)[..., None] * np.array([0.95, 1.0, 0.85], np.float32)
    p[y0:y1, x0:x1, :3] = np.clip(p[y0:y1, x0:x1, :3] + add * p[y0:y1, x0:x1, 3:4], 0, 1)
    return p


TEX = {0: tex_far, 2: tex_near}


def frame(layers, t):
    f = pz.render_frame(layers, cam, t, RW, RH, FOCUS, tex_hooks=TEX)
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
