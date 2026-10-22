"""Builds proj/index.html for the 'ház' kinetic-type styleframe (direction C)."""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.join(HERE, "..", "proj")

W, H = 1280, 720
FS = 200                      # display size, px
BASE = 0.825 * FS             # baseline offset inside the 1em line box
WORD_W = 755.5                # "a házban" at wght 720
X0 = round(W / 2 - WORD_W / 2, 1)
BASELINE_Y = 515
YTOP = BASELINE_Y - BASE

# glyph x offsets inside the word (measured with Range rects, wght 720)
GX = {"a0": 0, "h": 136.2, "a1": 249.1, "z": 346.3, "b": 434.2, "a2": 544.9, "n": 641.9, "o": 547.3, "l": 652.0}
JUNCTION = X0 + GX["b"] - 1.5          # the morpheme boundary z|b

PAD = 86
EAVE_Y = 290
PITCH = math.radians(27)
WALL_L = X0 - PAD
WALL_R = X0 + WORD_W + PAD


def house(l, r, eave=EAVE_Y, floor=H):
    cx = (l + r) / 2
    apex = eave - (r - l) / 2 * math.tan(PITCH)
    pts = [(l, eave), (cx, apex), (r, eave), (r, floor), (l, floor)]
    return "polygon(" + ", ".join(f"{x:.1f}px {y:.1f}px" for x, y in pts) + ")"


FULL = "polygon(0.0px 0.0px, 640.0px 0.0px, 1280.0px 0.0px, 1280.0px 720.0px, 0.0px 720.0px)"
HOUSE_WIDE = house(WALL_L, WALL_R)
HOUSE_STEM = house(WALL_L, JUNCTION)

PAPER = "#F2EEE6"
INK = "#15181B"
GREEN = "#2D6A4F"
BLUE = "#3B6E9B"
OCHRE = "#9A6B1F"


def glyph(key, ch, cls=""):
    # mask wrapper (static, clips at the baseline) + the moving glyph inside
    return (f'<span class="mk mk-{key}" style="left:{GX[key]}px">'
            f'<span class="g g-{key} {cls}">{ch}</span></span>')


def word():
    return (
        '<div class="word">'
        + glyph("a0", "a", "art")
        + glyph("h", "h") + glyph("a1", "a")
        + f'<span class="acc g-acc" style="left:{GX["a1"]}px">á</span>'
        + glyph("z", "z")
        + '<div class="endba">' + glyph("b", "b") + glyph("a2", "a") + '</div>'
        + glyph("n", "n")
        + glyph("o", "ó") + glyph("l", "l")
        + '</div>'
    )


CSS = f"""
@font-face{{font-family:'SS4';font-style:normal;font-weight:200 900;font-display:block;src:url('assets/fonts/SS4var-roman-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}}
@font-face{{font-family:'SS4';font-style:normal;font-weight:200 900;font-display:block;src:url('assets/fonts/SS4var-roman-latinext.woff2') format('woff2');unicode-range:U+0100-02FF;}}
@font-face{{font-family:'SS4';font-style:italic;font-weight:200 900;font-display:block;src:url('assets/fonts/SS4var-italic-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}}
@font-face{{font-family:'SS4';font-style:italic;font-weight:200 900;font-display:block;src:url('assets/fonts/SS4var-italic-cyrillic.woff2') format('woff2');unicode-range:U+0400-045F;}}
:root{{--paper:{PAPER};--ink:{INK};--green:{GREEN};--blue:{BLUE};--ochre:{OCHRE};}}
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{W}px;height:{H}px;overflow:hidden;background:var(--paper);}}
#root{{position:relative;width:{W}px;height:{H}px;overflow:hidden;font-family:'SS4',serif;}}
.layer{{position:absolute;left:0;top:0;width:{W}px;height:{H}px;}}
#paper{{background:var(--paper);}}
#ochre{{background:var(--ochre);}}
#world{{color:var(--ink);}}
#house{{background:var(--green);color:var(--paper);clip-path:{FULL};}}
#blue{{background:var(--blue);transform-origin:50% 100%;}}
.word{{position:absolute;left:{X0}px;top:{YTOP}px;width:0;height:{FS}px;}}
.mk{{position:absolute;top:0;height:{FS}px;width:{FS}px;clip-path:inset(-80px -60px {FS - BASE - 10:.0f}px -60px);}}
.g,.acc{{position:absolute;left:0;top:0;display:block;font-size:{FS}px;line-height:{FS}px;white-space:pre;
  font-optical-sizing:auto;font-variation-settings:"wght" 720;will-change:transform;}}
.g.art{{font-variation-settings:"wght" 420;}}
.acc{{clip-path:inset(0px 0px {FS - 69}px 0px);}}
.endba{{position:absolute;left:0;top:0;width:0;height:{FS}px;}}
#sub{{color:var(--paper);}}
#e{{display:inline-block;}}
.sl{{position:absolute;left:{X0 + 6}px;top:{BASELINE_Y + 48}px;height:60px;width:600px;clip-path:inset(-30px -20px 8px -20px);}}
.sl .s{{position:absolute;left:0;top:0;font-style:italic;font-size:46px;line-height:52px;white-space:pre;
  font-variation-settings:"wght" 440;font-optical-sizing:auto;}}
"""

BODY = f"""
<div id="root" data-composition-id="main" data-start="0" data-duration="11" data-width="{W}" data-height="{H}">
  <div id="paper" class="layer"></div>
  <div id="ochre" class="layer"></div>
  <div id="world" class="layer">{word()}</div>
  <div id="house" class="layer"><div id="blue" class="layer"></div>{word()}</div>
  <div id="sub" class="layer">
    <div class="sl" id="sl1"><span class="s" id="s1">в дом</span><span class="s" id="s1e" style="left:0">в дом<span id="e">е</span></span></div>
    <div class="sl" id="sl2"><span class="s" id="s2">из дома</span></div>
  </div>
  <audio id="v1" class="clip" src="assets/audio/v1.mp3" data-start="__V1__" data-duration="1.872" data-track-index="2" data-volume="1"></audio>
  <audio id="v2" class="clip" src="assets/audio/v2.mp3" data-start="__V2__" data-duration="1.968" data-track-index="2" data-volume="1"></audio>
  <audio id="v3" class="clip" src="assets/audio/v3.mp3" data-start="__V3__" data-duration="2.016" data-track-index="2" data-volume="1"></audio>
</div>
"""

T = {"V1": 0.86, "V2": 3.62, "V3": 7.02}

JS = """
(function(){
  const C = __CONST__;
  const tl = gsap.timeline({paused:true});
  const W = (v) => '"wght" ' + v;
  const both = (k) => '.g-' + k;          // same glyph in the ink copy and the paper copy

  // ---------- field geometry: one state object, painted as a pure function of it
  // f: 0 = full frame, 1 = house; r: right wall; o: ochre opening 0..1
  const S = {f: 0, r: C.R, k: 0.9};
  const house = document.getElementById('house'), ochre = document.getElementById('ochre');
  const lerp = (a, b, t) => a + (b - a) * t;
  function paint(){
    const l = C.L, r = S.r, cx = (l + r) / 2, apex = C.EAVE - (r - l) / 2 * C.TAN, f = S.f;
    const pts = [[lerp(0, l, f), lerp(0, C.EAVE, f)], [lerp(C.W/2, cx, f), lerp(0, apex, f)],
                 [lerp(C.W, r, f), lerp(0, C.EAVE, f)], [lerp(C.W, r, f), C.H], [lerp(0, l, f), C.H]];
    house.style.clipPath = 'polygon(' + pts.map(p => p[0].toFixed(2) + 'px ' + p[1].toFixed(2) + 'px').join(', ') + ')';
    // ochre: the wide house outline scaled about the house centre (k < 1 hides it behind the house)
    const k = S.k, ox = C.W / 2, oy = C.OY, wl = C.L, wr = C.R, wa = C.EAVE - (wr - wl) / 2 * C.TAN;
    const op = [[wl, C.EAVE], [(wl + wr) / 2, wa], [wr, C.EAVE], [wr, C.H], [wl, C.H]]
      .map(p => [ox + (p[0] - ox) * k, oy + (p[1] - oy) * k]);
    ochre.style.clipPath = 'polygon(' + op.map(p => p[0].toFixed(2) + 'px ' + p[1].toFixed(2) + 'px').join(', ') + ')';
  }
  paint();

  // ---------- initial states
    gsap.set('.g-acc', {x: 0, y: -250});
  gsap.set('.endba', {x: 640});
  gsap.set(['.g-b','.g-a2'], {fontVariationSettings: W(880)});
  gsap.set(['.g-n','.g-o','.g-l'], {y: 200, fontVariationSettings: W(300)});
  gsap.set('#s1, #s1e, #s2', {y: 56});
  gsap.set('#blue', {scaleY: 0});
  gsap.set('#s1e', {opacity: 0});

  // ---------- 1 · a házba (0 – 3.5)
  // the acute falls onto the a: haz -> ház; its landing folds the world into a house
  tl.to('.g-acc', {y: 0, duration: 0.42, ease: 'power3.in'}, 0.14);
  // the green world folds into the house
  tl.to(S, {f: 1, duration: 0.85, ease: 'power3.inOut', onUpdate: paint}, 0.56);
  // -ba arrives from outside and crosses the wall
  tl.to('.endba', {x: 0, duration: 0.9, ease: 'power3.out'}, 1.02);
  tl.to(['.g-b','.g-a2'], {fontVariationSettings: W(720), duration: 0.9, ease: 'power2.out'}, 1.02);
  tl.fromTo('#hblur', {attr:{stdDeviation:'22 0'}}, {attr:{stdDeviation:'0 0'}, duration: 0.4, ease: 'power2.out'}, 1.02);
  // russian gloss
  tl.to('#s1', {y: 0, duration: 0.6, ease: 'expo.out'}, 1.9);

  // ---------- 2 · a házban (3.5 – 7)
  tl.fromTo('#blue', {scaleY: 0}, {scaleY: 1, duration: 0.75, ease: 'power2.inOut'}, 3.42);
  tl.to('.g-n', {y: 0, duration: 0.7, ease: 'expo.out'}, 3.86);
  tl.to('.g-n', {fontVariationSettings: W(720), duration: 0.8, ease: 'power2.out'}, 3.86);
  tl.set('#s1', {opacity: 0}, 3.9); tl.set('#s1e', {opacity: 1, y: 0}, 3.9);
  tl.fromTo('#e', {y: 56}, {y: 0, duration: 0.6, ease: 'expo.out', immediateRender: false}, 3.92);

  // ---------- 3 · a házból (7 – 11)
  tl.to(['.g-a2','.g-n'], {y: 200, duration: 0.24, ease: 'power3.in', stagger: 0.03}, 6.98);
  tl.to(['.g-o','.g-l'], {y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.05}, 7.24);
  tl.to(['.g-o','.g-l'], {fontVariationSettings: W(720), duration: 0.7, ease: 'power2.out', stagger: 0.05}, 7.24);
  tl.to(S, {k: 3.4, duration: 1.0, ease: 'power2.inOut', onUpdate: paint}, 7.2);
  tl.to(S, {r: C.J, duration: 0.85, ease: 'power3.inOut', onUpdate: paint}, 7.36);
  tl.to('#s1e', {y: 56, duration: 0.28, ease: 'power3.in'}, 7.05);
  tl.to('#s2', {y: 0, duration: 0.6, ease: 'expo.out'}, 7.45);

  tl.set({}, {}, 11);
  window.__timelines = window.__timelines || {};
  window.__timelines['main'] = tl;
  tl.seek(0);
})();
"""


def build():
    const = {"L": WALL_L, "R": WALL_R, "J": JUNCTION, "EAVE": EAVE_Y, "TAN": math.tan(PITCH), "W": W, "H": H, "OY": 470}
    body = BODY
    for k, v in T.items():
        body = body.replace(f"__{k}__", f"{v:.2f}")
    html = f"""<!doctype html>
<html lang="hu">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width={W}, height={H}" />
<title>a ház</title>
<script src="assets/js/gsap.min.js"></script>
<style>{CSS}</style>
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><filter id="hb" x="-30%" y="0" width="160%" height="100%"><feGaussianBlur id="hblur" stdDeviation="0 0"/></filter></svg>
{body}
<script>{JS.replace('__CONST__', json.dumps(const))}</script>
</body>
</html>
"""
    html = html.replace('<div class="endba">', '<div class="endba" style="filter:url(#hb)">')
    open(os.path.join(PROJ, "index.html"), "w").write(html)
    print("X0", X0, "walls", WALL_L, WALL_R, "junction", JUNCTION)


if __name__ == "__main__":
    build()
