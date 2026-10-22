import os, sys, numpy as np, cv2, subprocess, json, math
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, R + '/tools')
import pz

FPS = 30
OW, OH = 1280, 720
RW, RH = 1920, 1080   # supersampled render


def depth_alphas(img, D, ths, min_area=4000, hole_area=3000, gr=6, geps=2e-3, extra=None):
    """cumulative alphas from depth thresholds, edge-snapped with a color guided filter.
    extra: optional dict {i: (add_mask, remove_mask)} float masks applied to the binary before filtering."""
    al = [np.ones(D.shape, np.float32)]
    prev = None
    for i, th in enumerate(ths):
        m = D > th
        if extra and (i + 1) in extra:
            add, rem = extra[i + 1]
            if add is not None: m = m | (add > 0.5)
            if rem is not None: m = m & ~(rem > 0.5)
        m = pz.clean_mask(m, min_area, hole_area)
        g = pz.guided_color(img, m.astype(np.float32), gr, geps)
        a = pz.smoothstep(0.3, 0.7, g).astype(np.float32)
        # 1px feather for clean antialiased edges
        a = cv2.GaussianBlur(a, (0, 0), 0.8)
        if prev is not None:
            a = np.minimum(a, prev)    # keep cumulative ordering
        al.append(a); prev = a
    return al


def save_layers(path, layers):
    np.savez(path, **{f"rgb{i}": L.rgb.astype(np.float16) for i, L in enumerate(layers)},
             **{f"a{i}": L.alpha.astype(np.float16) for i, L in enumerate(layers)},
             **{f"w{i}": L.w.astype(np.float32) for i, L in enumerate(layers)})


def load_layers(path):
    z = np.load(path)
    n = len([k for k in z.files if k.startswith('rgb')])
    return [pz.Layer(z[f"rgb{i}"].astype(np.float32), z[f"a{i}"].astype(np.float32), z[f"w{i}"], f"L{i}") for i in range(n)]


def poly_mask(shape, pts, blur=0):
    m = np.zeros(shape[:2], np.uint8)
    cv2.fillPoly(m, [np.array(pts, np.int32)], 1)
    m = m.astype(np.float32)
    if blur:
        m = cv2.GaussianBlur(m, (0, 0), blur)
    return m


def fbm_noise(shape, scale, seed, octaves=3):
    """smooth value noise field in [-1,1] (approx) of given shape; scale = feature size px."""
    rng = np.random.RandomState(seed)
    H, W = shape
    out = np.zeros((H, W), np.float32); amp = 1.0; tot = 0
    for o in range(octaves):
        s = max(2, int(scale / (2 ** o)))
        g = rng.randn(H // s + 3, W // s + 3).astype(np.float32)
        up = cv2.resize(g, ((W // s + 3) * s, (H // s + 3) * s), interpolation=cv2.INTER_CUBIC)[:H, :W]
        out += up * amp; tot += amp; amp *= 0.5
    return out / tot


def make_audio(out_wav, clips, dur):
    """clips: list of (mp3, start_sec, gain_db)"""
    args = ["ffmpeg", "-y", "-loglevel", "error"]
    flt = []
    for i, (f, st, g) in enumerate(clips):
        args += ["-i", f]
        flt.append(f"[{i}:a]aresample=48000,volume={g}dB,adelay={int(st*1000)}|{int(st*1000)},apad[a{i}]")
    mix = "".join(f"[a{i}]" for i in range(len(clips)))
    flt.append(f"{mix}amix=inputs={len(clips)}:normalize=0,atrim=0:{dur},afade=t=out:st={dur-0.3}:d=0.3[out]")
    args += ["-filter_complex", ";".join(flt), "-map", "[out]", "-ac", "2", "-ar", "48000", out_wav]
    subprocess.run(args, check=True)


def mux(video, audio, out):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", audio, "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
                    "-shortest", "-movflags", "+faststart", out], check=True)


def render_type(spec, outdir):
    os.makedirs(outdir, exist_ok=True)
    sp = outdir + "/spec.json"
    json.dump(spec, open(sp, "w"), ensure_ascii=False)
    subprocess.run(["node", R + "/type/render_type.js", sp, outdir], check=True)
