"""2.5D parallax engine: depth-sliced layers, LaMa hole filling, smooth per-layer nearness warps."""
import numpy as np, cv2, os, subprocess, json, math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAMA_PATH = None
_sess = None


def imread(p):
    im = cv2.imread(p, cv2.IMREAD_COLOR)
    return cv2.cvtColor(im, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0


def imwrite(p, im):
    im = np.clip(im * 255 + 0.5, 0, 255).astype(np.uint8)
    if im.ndim == 3 and im.shape[2] == 3:
        im = cv2.cvtColor(im, cv2.COLOR_RGB2BGR)
    elif im.ndim == 3 and im.shape[2] == 4:
        im = cv2.cvtColor(im, cv2.COLOR_RGBA2BGRA)
    cv2.imwrite(p, im, [cv2.IMWRITE_JPEG_QUALITY, 92])


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def ease(t):  # smooth in-out (cosine)
    t = min(max(t, 0.0), 1.0)
    return 0.5 - 0.5 * math.cos(math.pi * t)


def ease_io(t, p=2.2):
    t = min(max(t, 0.0), 1.0)
    return t ** p / (t ** p + (1 - t) ** p)


def guided(I, p, r, eps):
    """Gray-guide guided filter. I,p float32."""
    if I.ndim == 3:
        I = cv2.cvtColor(I, cv2.COLOR_RGB2GRAY)
    k = (2 * r + 1, 2 * r + 1)
    mI = cv2.boxFilter(I, -1, k); mp = cv2.boxFilter(p, -1, k)
    cIp = cv2.boxFilter(I * p, -1, k) - mI * mp
    vI = cv2.boxFilter(I * I, -1, k) - mI * mI
    a = cIp / (vI + eps); b = mp - a * mI
    return cv2.boxFilter(a, -1, k) * I + cv2.boxFilter(b, -1, k)


def guided_color(I, p, r, eps):
    """Color-guide guided filter (He et al.)."""
    k = (2 * r + 1, 2 * r + 1)
    bf = lambda x: cv2.boxFilter(x, -1, k)
    mI = [bf(I[..., c]) for c in range(3)]
    mp = bf(p)
    cov_Ip = [bf(I[..., c] * p) - mI[c] * mp for c in range(3)]
    var = np.zeros(p.shape + (3, 3), np.float32)
    for i in range(3):
        for j in range(i, 3):
            v = bf(I[..., i] * I[..., j]) - mI[i] * mI[j]
            var[..., i, j] = v; var[..., j, i] = v
    var += eps * np.eye(3, dtype=np.float32)
    inv = np.linalg.inv(var)
    cov = np.stack(cov_Ip, -1)[..., None]
    a = (inv @ cov)[..., 0]
    b = mp - (a * np.stack(mI, -1)).sum(-1)
    ma = np.stack([bf(a[..., c]) for c in range(3)], -1)
    return (ma * I).sum(-1) + bf(b)


def remove_small(mask, min_area, keep_value=True):
    """remove connected components smaller than min_area (on the given binary)."""
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask.astype(np.uint8), 8)
    out = np.zeros_like(mask, bool)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= min_area:
            out |= lab == i
    return out


def clean_mask(m, min_area, hole_area):
    m = remove_small(m, min_area)
    m = ~remove_small(~m, hole_area)
    return m


def pullpush(val, wgt):
    """fill val where wgt==0 by pyramid pull-push (smooth membrane-like fill). val HxW or HxWxC."""
    squeeze = val.ndim == 2
    v0 = val[..., None] if squeeze else val
    w0 = wgt.astype(np.float32)
    pyr = [(v0 * w0[..., None], w0)]
    while min(pyr[-1][1].shape) > 4:
        v, w = pyr[-1]
        sz = ((w.shape[1] + 1) // 2, (w.shape[0] + 1) // 2)
        vv = cv2.resize(v, sz, interpolation=cv2.INTER_AREA)
        if vv.ndim == 2:
            vv = vv[..., None]
        pyr.append((vv, cv2.resize(w, sz, interpolation=cv2.INTER_AREA)))
    v, w = pyr[-1]
    cur = v / np.maximum(w, 1e-8)[..., None]
    for v, w in reversed(pyr[:-1]):
        up = cv2.resize(cur, (w.shape[1], w.shape[0]), interpolation=cv2.INTER_LINEAR)
        if up.ndim == 2:
            up = up[..., None]
        al = np.clip(w * 2.0, 0, 1)[..., None]
        cur = (v / np.maximum(w, 1e-8)[..., None]) * al + up * (1 - al)
    cur = np.where(w0[..., None] > 0.999, v0, cur)
    return cur[..., 0] if squeeze else cur


def extend_colors(rgb, known, iters=8):
    """grow colors of known pixels outward by iters px (normalized box averaging)."""
    k = known.astype(np.float32)
    v = rgb * k[..., None]
    out = rgb.copy()
    filled = known.copy()
    for _ in range(iters):
        vs = cv2.blur(v, (3, 3)); ks = cv2.blur(k, (3, 3))
        new = (ks > 1e-4) & ~filled
        nv = vs / np.maximum(ks, 1e-6)[..., None]
        out[new] = nv[new]
        filled = filled | new
        k = filled.astype(np.float32)
        v = out * k[..., None]
    return out, filled


# ---------------- LaMa ----------------
def lama_session():
    global _sess
    if _sess is None:
        import onnxruntime as ort
        from huggingface_hub import hf_hub_download
        p = hf_hub_download('Carve/LaMa-ONNX', 'lama_fp32.onnx')
        so = ort.SessionOptions(); so.intra_op_num_threads = 4
        _sess = ort.InferenceSession(p, so)
    return _sess


def lama512(img, mask):
    """img 512x512x3 float 0..1, mask 512x512 bool (True=hole) -> 512x512x3 float 0..1"""
    s = lama_session()
    x = img.transpose(2, 0, 1)[None].astype(np.float32)
    m = mask[None, None].astype(np.float32)
    out = s.run(None, {'image': x, 'mask': m})[0][0].transpose(1, 2, 0)
    if out.max() > 2:
        out = out / 255.0
    return np.clip(out, 0, 1)


def lama_fill(img, hole, band=160, tile=512, stride=352, log=None):
    """Fill hole (bool) of img. Coarse global pass at 512 + full-res tiled pass on a band near the boundary."""
    H, W = hole.shape
    res = img.copy()
    # ---- coarse pass (fit long side to 512, reflect-pad) ----
    s = 512.0 / max(H, W)
    w2, h2 = max(1, int(round(W * s))), max(1, int(round(H * s)))
    sm = cv2.resize(img, (w2, h2), interpolation=cv2.INTER_AREA)
    hm = cv2.resize(hole.astype(np.float32), (w2, h2), interpolation=cv2.INTER_AREA) > 0.01
    pad_b, pad_r = 512 - h2, 512 - w2
    smp = cv2.copyMakeBorder(sm, 0, pad_b, 0, pad_r, cv2.BORDER_REFLECT)
    hmp = cv2.copyMakeBorder(hm.astype(np.uint8), 0, pad_b, 0, pad_r, cv2.BORDER_REFLECT).astype(bool)
    hmp = cv2.dilate(hmp.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    out = lama512(smp, hmp)[:h2, :w2]
    coarse = cv2.resize(out, (W, H), interpolation=cv2.INTER_CUBIC)
    res[hole] = coarse[hole]
    # ---- medium pass at 1/2 scale if large ----
    def tiled(res, scale, bandpx):
        if scale != 1.0:
            rs = cv2.resize(res, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
            hs = cv2.resize(hole.astype(np.float32), (rs.shape[1], rs.shape[0]), interpolation=cv2.INTER_AREA) > 0.01
        else:
            rs, hs = res, hole
        h_, w_ = hs.shape
        if min(h_, w_) < tile:
            return res
        dist = cv2.distanceTransform((~hs).astype(np.uint8) * 0 + hs.astype(np.uint8), cv2.DIST_L2, 5)
        bandm = hs & (dist < bandpx)
        ys, xs = np.nonzero(bandm)
        if len(ys) == 0:
            return res
        acc = np.zeros_like(rs); wsum = np.zeros(hs.shape, np.float32)
        win1 = np.hanning(tile).astype(np.float32) * 0.98 + 0.02
        win = np.outer(win1, win1)
        y0s = list(range(max(0, ys.min() - tile // 4), max(1, ys.max() - tile // 4 + 1), stride))
        x0s = list(range(max(0, xs.min() - tile // 4), max(1, xs.max() - tile // 4 + 1), stride))
        n = 0
        for y0 in y0s:
            for x0 in x0s:
                y0c = min(max(0, y0), h_ - tile); x0c = min(max(0, x0), w_ - tile)
                bm = bandm[y0c:y0c + tile, x0c:x0c + tile]
                if bm.sum() < 20:
                    continue
                o = lama512(rs[y0c:y0c + tile, x0c:x0c + tile], cv2.dilate(bm.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool))
                acc[y0c:y0c + tile, x0c:x0c + tile] += o * win[..., None]
                wsum[y0c:y0c + tile, x0c:x0c + tile] += win
                n += 1
        fillv = acc / np.maximum(wsum, 1e-6)[..., None]
        ok = bandm & (wsum > 1e-4)
        if scale != 1.0:
            fillv = cv2.resize(fillv, (W, H), interpolation=cv2.INTER_CUBIC)
            ok = cv2.resize(ok.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR) > 0.5
            ok &= hole
        out = res.copy(); out[ok] = fillv[ok]
        # soften the inner limit of the band
        if log: log(f"  lama tiles scale={scale}: {n}")
        return out
    if max(H, W) > 1400:
        res = tiled(res, 0.5, band)       # half-res pass covering a wider band (2*band px at full res)
    res = tiled(res, 1.0, band)
    return res


# ---------------- layers ----------------
def add_grain(rgb, ref, hole, seed=1):
    """re-texture filled (smooth) regions with grain matching the reference's high-frequency statistics."""
    hp = ref - cv2.GaussianBlur(ref, (0, 0), 1.2)
    ring = cv2.dilate(hole.astype(np.uint8), np.ones((61, 61), np.uint8)).astype(bool) & ~hole
    rstd = lambda a: 1.4826 * np.median(np.abs(a - np.median(a, 0)), 0)
    sd = rstd(hp[ring]) if ring.sum() > 100 else rstd(hp.reshape(-1, 3))
    hpf = rgb - cv2.GaussianBlur(rgb, (0, 0), 1.2)
    have = rstd(hpf[hole]) if hole.sum() > 100 else sd
    add = np.sqrt(np.maximum(sd ** 2 - have ** 2, 0))
    r = np.random.RandomState(seed)
    n = r.randn(*rgb.shape[:2]).astype(np.float32)
    n = cv2.GaussianBlur(n, (0, 0), 0.6); n /= n.std() + 1e-6
    nc = cv2.GaussianBlur(r.randn(*rgb.shape).astype(np.float32), (0, 0), 0.6) * 0.3
    m = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 2)[..., None]
    return np.clip(rgb + (n[..., None] + nc) * add * m, 0, 1)



class Layer:
    def __init__(self, rgb, alpha, w, name=""):
        self.rgb, self.alpha, self.w, self.name = rgb, alpha.astype(np.float32), w.astype(np.float32), name
        self.prem = np.dstack([rgb * self.alpha[..., None], self.alpha]).astype(np.float32)


def nearness_field(D, own, sigma, fill_from=None):
    """smooth nearness map: depth values from own region, pull-push filled elsewhere, gaussian blurred."""
    val = pullpush(D.astype(np.float32), own.astype(np.float32))
    if sigma > 0:
        val = cv2.GaussianBlur(val, (0, 0), sigma)
    return val


def build_layers(img, D, alphas, wmaps=None, sigma=12, band=160, cache=None, log=print, dil=4):
    """alphas: list of N cumulative soft alphas; alphas[0] = ones. Returns Layer list (back->front)."""
    N = len(alphas)
    layers = []
    for i in range(N):
        a = alphas[i]
        if i < N - 1:
            near = alphas[i + 1]
            hole = cv2.dilate((near > 0.04).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * dil + 1, 2 * dil + 1))).astype(bool)
            cp = cache and f"{cache}_fill{i}.png"
            if cp and os.path.exists(cp):
                rgb = imread(cp)
                log(f"layer {i}: fill from cache")
            else:
                log(f"layer {i}: lama fill hole px={hole.sum()}")
                rgb = lama_fill(img, hole, band=band, log=log)
                if cp:
                    imwrite(cp, rgb)
            rgb = add_grain(rgb, img, hole)
            own = (a > 0.5) & ~hole
        else:
            rgb = img.copy()
            own = a > 0.5
        if i > 0:
            core = a > 0.97
            ext, _ = extend_colors(rgb, core, iters=6)
            m = (a <= 0.97)
            rgb = np.where(m[..., None], ext, rgb)
        if wmaps is not None and wmaps[i] is not None:
            w = wmaps[i]
        else:
            w = nearness_field(D, own, sigma)
        layers.append(Layer(rgb, a, w, name=f"L{i}"))
    return layers


# ---------------- camera / render ----------------
class Cam:
    """keyframed camera. view: (cx, cy, vw) in source px (16:9). par: (Px, Py, k) parallax.
    keys: list of (t, dict(cx,cy,vw,px,py,k))"""
    def __init__(self, keys, fx=(lambda u: ease_io(u, 1.8))):
        self.keys = keys; self.fx = fx

    def at(self, t):
        ks = self.keys
        if t <= ks[0][0]:
            return dict(ks[0][1])
        for (t0, a), (t1, b) in zip(ks, ks[1:]):
            if t <= t1:
                u = self.fx((t - t0) / (t1 - t0))
                return {k: a[k] + (b[k] - a[k]) * u for k in a}
        return dict(ks[-1][1])


def render_frame(layers, cam, t, RW, RH, focus, disp_hooks=None, tex_hooks=None, bg=(0, 0, 0)):
    c = cam.at(t)
    Z = RW / c['vw']
    xs = np.arange(RW, dtype=np.float32); ys = np.arange(RH, dtype=np.float32)
    qx, qy = np.meshgrid(xs, ys)
    s0x = c['cx'] + (qx - RW / 2 + 0.5) / Z
    s0y = c['cy'] + (qy - RH / 2 + 0.5) / Z
    Px, Py, k = c['px'], c['py'], c['k']
    Fx, Fy = focus
    out = np.zeros((RH, RW, 3), np.float32); out[:] = bg
    for i, L in enumerate(layers):
        sx, sy = s0x.copy(), s0y.copy()
        for _ in range(3):
            w = cv2.remap(L.w, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            # forward: p_screen = p + w*(P + k*(p-F)) -> backward solve p = (s0 - w*(P - k*F)) / (1 + w*k)
            sx = (s0x - w * (Px - k * Fx)) / (1 + w * k)
            sy = (s0y - w * (Py - k * Fy)) / (1 + w * k)
        if disp_hooks and disp_hooks.get(i):
            dx, dy = disp_hooks[i](sx, sy, t)
            sx = (sx + dx).astype(np.float32); sy = (sy + dy).astype(np.float32)
        tex = L.prem
        if tex_hooks and tex_hooks.get(i):
            tex = tex_hooks[i](L, t)
        smp = cv2.remap(tex, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        a = smp[..., 3:4]
        out = smp[..., :3] + out * (1 - a)
    return out


class Encoder:
    def __init__(self, path, W=1280, H=720, fps=30, crf=16):
        self.p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
                                   "-c:v", "libx264", "-preset", "slow", "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", path], stdin=subprocess.PIPE)

    def write(self, rgb):
        self.p.stdin.write(np.clip(rgb * 255 + 0.5, 0, 255).astype(np.uint8).tobytes())

    def close(self):
        self.p.stdin.close(); self.p.wait()


# ---------------- typography compositing ----------------
def load_rgba(p):
    im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    im = cv2.cvtColor(im, cv2.COLOR_BGRA2RGBA).astype(np.float32) / 255.0
    return im


class TypeEl:
    """typography element: full-frame RGBA png + plaque-only png (for backdrop blur)."""
    def __init__(self, d, name):
        self.full = load_rgba(f"{d}/{name}.png")
        pl = f"{d}/{name}_plaque.png"
        self.plq = load_rgba(pl)[..., 3] if os.path.exists(pl) else None
        a = self.full[..., 3]
        ys, xs = np.nonzero(a > 0.003)
        self.bbox = (max(0, ys.min() - 4), ys.max() + 5, max(0, xs.min() - 4), xs.max() + 5)


def comp_type(frame, el, op, dy=0.0, blur=True, blur_sigma=9):
    if op <= 0.001:
        return frame
    full = el.full
    if abs(dy) > 0.01:
        M = np.float32([[1, 0, 0], [0, 1, dy]])
        full = cv2.warpAffine(full, M, (full.shape[1], full.shape[0]), flags=cv2.INTER_LINEAR)
        plq = cv2.warpAffine(el.plq, M, (full.shape[1], full.shape[0]), flags=cv2.INTER_LINEAR) if el.plq is not None else None
    else:
        plq = el.plq
    y0, y1, x0, x1 = el.bbox
    y0 = max(0, y0 - 40); y1 = min(frame.shape[0], y1 + 40)
    f = frame[y0:y1, x0:x1]
    if blur and plq is not None:
        pm = plq[y0:y1, x0:x1]
        # plaque core (exclude the soft shadow): alpha above threshold
        core = smoothstep(0.55, 0.8, pm)[..., None] * op
        bl = cv2.GaussianBlur(f, (0, 0), blur_sigma)
        f = f * (1 - core) + bl * core
    a = full[y0:y1, x0:x1, 3:4] * op
    f = full[y0:y1, x0:x1, :3] * a + f * (1 - a)
    frame = frame.copy(); frame[y0:y1, x0:x1] = f
    return frame
