"""Assembles proj/index.html and proj/compositions/s*.html from tools/scenes/*.html + plan.json."""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.join(HERE, "..", "proj")
plan = json.load(open(os.path.join(HERE, "plan.json")))
OV = 0.6  # each scene's host outlives its slot by this much (the next scene enters on top)

FONTS = """@font-face{font-family:'Source Serif 4';font-style:normal;font-weight:200 900;font-display:block;src:url('assets/fonts/SS4var-roman-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
@font-face{font-family:'Source Serif 4';font-style:normal;font-weight:200 900;font-display:block;src:url('assets/fonts/SS4var-roman-latinext.woff2') format('woff2');unicode-range:U+0100-02FF;}
@font-face{font-family:'Source Serif 4';font-style:italic;font-weight:200 900;font-display:block;src:url('assets/fonts/SS4var-italic-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+2000-206F;}
@font-face{font-family:'Source Serif 4';font-style:italic;font-weight:200 900;font-display:block;src:url('assets/fonts/SS4var-italic-cyrillic.woff2') format('woff2');unicode-range:U+0400-045F,U+2116;}"""

COMMON = """#root{position:absolute;inset:0;overflow:hidden;font-family:'Source Serif 4',serif;color:#211B16;
  --ink:#211B16;--ru:#6A584A;--paper:#F4EDDF;--green:#2D6A4F;--blue:#3B6E9B;--ochre:#9A6B1F;--rule:#CBBBA0;}
#root .paper{position:absolute;left:0;top:0;width:1280px;height:720px;}
#root .hd{position:absolute;left:64px;top:38px;font-style:italic;font-weight:420;font-size:30px;line-height:40px;color:#3A3029;white-space:nowrap;}
#root .hu{font-weight:650;font-optical-sizing:auto;white-space:nowrap;}
#root .ru{font-style:italic;font-weight:400;color:#6A584A;white-space:nowrap;}
#root .g{color:#2D6A4F;} #root .b{color:#3B6E9B;} #root .o{color:#9A6B1F;}
#root canvas.full{position:absolute;left:0;top:0;width:1280px;height:720px;}"""

def scene_T(sc):
    ru, hu = [], []
    for e in sc["events"]:
        if e["kind"] == "hu":
            hu.append({"t": e["t"], "dur": e["dur"], "text": e["text"], "w": [[w[0], round(e["t"] + w[1], 3)] for w in e["words"]]})
        else:
            ru.append({"t": e["t"], "end": e["end"], "text": e["text"], "parts": [{"t": p["t"], "dur": p["dur"], "text": p["text"], "w": [[w[0], round(p["t"] + w[1], 3)] for w in p["words"]]} for p in e["parts"]]})
    return {"dur": sc["dur"], "ru": ru, "hu": hu, "parts": [p for e in ru for p in e["parts"]]}

hosts = []
scenes = {s["id"]: s for s in plan["scenes"]}
order = [s["id"] for s in plan["scenes"]]
SPAN = {"s6": "s7"}  # s6 stays underneath s7 (blurred backdrop)
total = plan["total"]
for i, sid in enumerate(order):
    sc = scenes[sid]
    src = open(os.path.join(HERE, "scenes", sid + ".html")).read()
    style = "\n".join(re.findall(r"<style>(.*?)</style>", src, re.S))
    script = "\n".join(re.findall(r"<script>(.*?)</script>", src, re.S))
    body = re.sub(r"<style>.*?</style>|<script>.*?</script>|<!--.*?-->", "", src, flags=re.S).strip()
    start = sc["start"]
    dur = sc["dur"] + OV
    if sid in SPAN:
        dur = scenes[SPAN[sid]]["start"] + scenes[SPAN[sid]]["dur"] + OV - start
    if i == len(order) - 1:
        dur = total - start
    dur = round(min(dur, total - start), 3)
    T = scene_T(sc); T["slot"] = dur; T["next"] = scenes[order[i + 1]]["dur"] if i + 1 < len(order) else 0
    html = f"""<template>
<style>
{FONTS}
{COMMON}
{style}
</style>
<div id="root" data-composition-id="{sid}" data-width="1280" data-height="720" data-duration="{dur}">
{body}
</div>
<script>
(function () {{
const T = {json.dumps(T, ensure_ascii=False)};
{script}
}})();
</script>
</template>
"""
    open(os.path.join(PROJ, "compositions", sid + ".html"), "w").write(html)
    hosts.append(f'  <div id="{sid}" data-composition-id="{sid}" data-composition-src="compositions/{sid}.html" data-start="{start}" data-duration="{dur}" data-track-index="{i + 1}" data-track-kind="graphics" data-width="1280" data-height="720" style="z-index:{(i + 1) * 10}"></div>')

grain_iter = int(total / 0.5) + 2
index = f"""<!doctype html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1280, height=720" />
<title>Hova? Hol? Honnan? · пробный ролик</title>
<script src="assets/js/gsap.min.js"></script>
<script src="assets/js/kirill-manifest.js"></script>
<script src="assets/js/objects-manifest.js"></script>
<script src="assets/js/map-data.js"></script>
<script src="assets/js/kirill.js"></script>
<style>
{FONTS}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:1280px; height:720px; overflow:hidden; background:#F4EDDF; }}
#root {{ position:relative; width:1280px; height:720px; overflow:hidden; background:#F4EDDF; }}
#ground {{ position:absolute; left:0; top:0; width:1280px; height:720px; }}
#grain-overlay {{ position:absolute; inset:0; pointer-events:none; z-index:1000; overflow:hidden; }}
#grain-overlay .grain-texture {{ position:absolute; top:-50%; left:-50%; width:200%; height:200%; opacity:0.05; mix-blend-mode:multiply;
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  animation: hf-grain-noise 0.5s steps(1) {grain_iter} both; }}
@keyframes hf-grain-noise {{ 0%,100%{{transform:translate(0,0)}} 10%{{transform:translate(-5%,-5%)}} 20%{{transform:translate(-10%,5%)}} 30%{{transform:translate(5%,-10%)}} 40%{{transform:translate(-5%,15%)}} 50%{{transform:translate(-10%,5%)}} 60%{{transform:translate(15%,0)}} 70%{{transform:translate(0,10%)}} 80%{{transform:translate(-15%,0)}} 90%{{transform:translate(10%,5%)}} }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{total}" data-width="1280" data-height="720">
  <img id="ground" src="assets/img/paper.jpg" alt="" />
{chr(10).join(hosts)}
  <!-- registry: grain-overlay (finite iterations) -->
  <div id="grain-overlay"><div class="grain-texture"></div></div>
  <audio id="voice" class="clip" src="assets/audio/voice.mp3" data-start="0" data-duration="{total}" data-track-index="20" data-volume="1"></audio>
</div>
<script>
window.__timelines = window.__timelines || {{}};
const tl = gsap.timeline({{ paused: true }});
tl.set({{}}, {{}}, {total});
window.__timelines["main"] = tl;
</script>
</body>
</html>
"""
open(os.path.join(PROJ, "index.html"), "w").write(index)
print("built", len(hosts), "scenes, total", total)
