"""Bryullov — Italian Midday (1827). usage: bryullov.py build | frames t,..."""
import sys, os, time
from common import *

NAME = 'bryullov'
W_ = f'{R}/work'
DUR = 9.0
img = pz.imread(f'{R}/src/{NAME}.png')
H, W = img.shape[:2]
D = np.load(f'{W_}/{NAME}_depth.npy')
LP = f'{W_}/{NAME}_layers.npz'


def fg_alpha():
    m = D > 0.20
    # the shoulder ruffle of the blouse is estimated too far by the depth model: attach it to the figure
    zone = poly_mask(img.shape, [(370, 770), (460, 680), (600, 595), (720, 620), (790, 690), (820, 780), (820, 900), (700, 1010), (520, 1130), (420, 1140), (360, 960)]) > 0.5
    m |= zone & (img.mean(2) > 0.28)
    m = pz.clean_mask(m, 3000, 60000)          # fills the blouse hole inside the figure
    g = pz.guided_color(img, m.astype(np.float32), 5, 1.5e-3)
    a = pz.smoothstep(0.3, 0.7, g)
    return cv2.GaussianBlur(a.astype(np.float32), (0, 0), 1.0)


def build():
    a1 = fg_alpha()
    own1 = a1 > 0.5
    w1 = pz.pullpush(D, own1.astype(np.float32))
    w1 = cv2.GaussianBlur(w1, (0, 0), 35)
    layers = pz.build_layers(img, D, [np.ones((H, W), np.float32), a1], wmaps=[None, w1], sigma=25, band=120, cache=f'{W_}/{NAME}', dil=6)
    save_layers(LP, layers)
    s = 0.5
    L = layers[1]
    chk = ((np.indices(L.alpha.shape).sum(0) // 40) % 2).astype(np.float32)[..., None] * 0.3 + 0.35
    pz.imwrite(f'{W_}/{NAME}_L1.jpg', cv2.resize(L.rgb * L.alpha[..., None] + chk * (1 - L.alpha[..., None]), None, fx=s, fy=s, interpolation=cv2.INTER_AREA))
    pz.imwrite(f'{W_}/{NAME}_L0.jpg', cv2.resize(layers[0].rgb, None, fx=s, fy=s, interpolation=cv2.INTER_AREA))


GRAPES = (850, 380)
cam = pz.Cam([
    (0.0, dict(cx=745, cy=715, vw=1470, px=0, py=0, k=0.0)),
    (DUR, dict(cx=805, cy=540, vw=1330, px=8, py=45, k=0.05)),
], fx=lambda u: pz.ease_io(u, 1.6))
FOCUS = GRAPES

# ---- living details ----
nA = fbm_noise((H // 2, W // 2 + 200), 22, 3, 2)
nB = fbm_noise((H // 2 + 200, W // 2), 22, 4, 2)
dap = fbm_noise((H // 4, W // 4 + 200), 30, 8, 2)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
# leaf region of the foreground layer (vine + leaves upper left / upper right), excluding hand and grapes
leaf_fg = np.clip(poly_mask(img.shape, [(0, 0), (650, 0), (640, 120), (520, 160), (420, 330), (300, 420), (0, 420)], blur=25)
                  + poly_mask(img.shape, [(1050, 0), (1500, 0), (1500, 420), (1100, 300)], blur=25), 0, 1)


def samp(field, sx, sy, fx, ox=0.0, oy=0.0):
    return cv2.remap(field, (sx * fx + ox).astype(np.float32), (sy * fx + oy).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def tremble(sx, sy, t, amp):
    a = samp(nA, sx, sy, 0.5, ox=t * 9.0)
    b = samp(nB, sx, sy, 0.5, oy=t * 7.0)
    s1 = np.sin(2 * np.pi * (0.9 * t) + 6 * a)
    s2 = np.cos(2 * np.pi * (0.7 * t) + 6 * b)
    return amp * s1 * (0.6 + 0.4 * a), amp * 0.8 * s2 * (0.6 + 0.4 * b)


def disp0(sx, sy, t):
    return tremble(sx, sy, t, 1.6)


def disp1(sx, sy, t):
    m = samp(leaf_fg, sx, sy, 1.0)
    dx, dy = tremble(sx, sy, t + 3.1, 1.3)
    return dx * m, dy * m


dap_full = cv2.resize(dap, (W + 800, H))


def tex0(L, t):
    # drifting sun-flecks on the foliage
    off = int(t * 30)
    n = dap_full[:, off:off + W]
    gain = 1 + 0.10 * np.clip(n * 1.6, -1, 1)
    p = L.prem.copy()
    p[..., :3] = np.clip(p[..., :3] * gain[..., None], 0, 1)
    return p


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
