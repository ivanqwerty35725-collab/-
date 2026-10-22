"""Shared builder: scenes, TTS with word timings, HyperFrames project writer."""
import asyncio, hashlib, json, os, re, shutil, subprocess, html as H

ROOT = "/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu"
FONTS = f"{ROOT}/fonts"
TTS_CACHE = f"{ROOT}/tts/cache"
VOICE = "hu-HU-TamasNeural"
W, HGT, FPS = 1280, 720, 30

# palette (MOTION.md)
BG, PANEL, BORDER = "#F5F6F2", "#FFFFFF", "#D8DDD6"
INK, MUTED = "#1C2226", "#5D6871"
ACC, SOFT = "#2D6A4F", "#E4EFE8"
WARN, WARN_BG = "#9A6B1F", "#F6ECD8"
ERR, ERR_BG = "#9B3B3B", "#F5E1E1"
BACK, FRONT, ROUND = "#9A6B1F", "#2D6A4F", "#3B6E9B"

EASE = "expo.out"  # ≈ cubic-bezier(0.16,1,0.3,1)


def esc(s):
    return H.escape(s, quote=False)


# ---------------------------------------------------------------- TTS
def _strip(w):
    return re.sub(r"^[^\w]+|[^\w]+$", "", w, flags=re.U)


def tts(text, rate="-8%"):
    """Returns (mp3 path, duration s, [(word, start, dur)...]). Cached."""
    os.makedirs(TTS_CACHE, exist_ok=True)
    key = hashlib.sha1(f"{VOICE}|{rate}|{text}".encode()).hexdigest()[:16]
    mp3 = f"{TTS_CACHE}/{key}.mp3"
    meta = f"{TTS_CACHE}/{key}.json"
    if not os.path.exists(meta):
        import edge_tts

        async def run():
            c = edge_tts.Communicate(text, VOICE, rate=rate, boundary="WordBoundary")
            words = []
            with open(mp3, "wb") as f:
                async for ch in c.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        words.append((ch["text"], ch["offset"] / 1e7, ch["duration"] / 1e7))
            return words

        words = asyncio.run(run())
        dur = float(subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3]).decode().strip())
        json.dump({"dur": dur, "words": words}, open(meta, "w"), ensure_ascii=False)
    m = json.load(open(meta))
    return mp3, m["dur"], [tuple(w) for w in m["words"]]


# ---------------------------------------------------------------- words markup
def words(prefix, text, cls="hu", extra_cls=None, colors=None, raw=False):
    """Split text on spaces (or | when raw) into highlightable spans. colors: optional dict idx->color."""
    toks = text.split("|") if raw else text.split(" ")
    if raw:
        esc_ = lambda x: x
    else:
        esc_ = esc
    spans = []
    for i, t in enumerate(toks):
        style = f' style="color:{colors[i]}"' if colors and i in colors else ""
        c = "w" + (f" {extra_cls[i]}" if extra_cls and i in extra_cls else "")
        spans.append(f'<span class="{c}" id="{prefix}-w{i}"{style}>{esc_(t)}</span>')
    return f'<div class="{cls}" id="{prefix}">' + " ".join(spans) + "</div>"


# ---------------------------------------------------------------- video
class Video:
    def __init__(self, num, slug, label, title_ru):
        self.num, self.slug, self.label, self.title_ru = num, slug, label, title_ru
        self.t = 0.0
        self.scenes = []      # dicts: id, start, dur, html
        self.caps = []        # (start, dur, text)
        self.audio = []       # (id, file, start, dur)
        self.tweens = []      # js lines
        self.extra_css = ""
        self._audio_n = 0
        self._cur = None

    # ---- scene handling
    def scene(self, sid, html):
        """Open a scene at current time; returns self. Close with end_scene."""
        self._cur = {"id": sid, "start": self.t, "html": html, "tweens": []}
        self.scene_start = self.t
        return self

    def end_scene(self, hold=0.6):
        self.t += hold
        self._cur["dur"] = self.t - self._cur["start"]
        for c in self.caps:
            if c[1] is None:
                c[1] = self.t - c[0]
        self.scenes.append(self._cur)
        self._cur = None

    def cap(self, text, start=None, until=None):
        """Russian caption in the lower third; lasts until next caption or scene end."""
        st = start if start is not None else self.t
        for c in self.caps:
            if c[1] is None:
                c[1] = max(0.1, st - c[0])
        self.caps.append([st, None, text])

    def _close_caps(self):
        for i, c in enumerate(self.caps):
            if c[1] is None:
                end = self.caps[i + 1][0] if i + 1 < len(self.caps) else self.total
                c[1] = end - c[0]

    def wait(self, s):
        self.t += s

    # ---- animation helpers (absolute times)
    def tw(self, sel, frm, to, dur, at, ease=EASE, ir=None):
        f = json.dumps(frm)
        t = dict(to)
        t["duration"] = round(dur, 3)
        t["ease"] = ease
        if ir is not None:
            t["immediateRender"] = ir
        if self._cur is not None:
            self._cur["tweens"].append(f'tl.fromTo("{sel}", {f}, {json.dumps(t)}, {round(at - self._cur["start"], 3)});')
        else:
            self.tweens.append(f'tl.fromTo("{sel}", {f}, {json.dumps(t)}, {round(at, 3)});')

    def enter(self, sel, at=None, kind="up", dur=0.35):
        at = self.t if at is None else at
        if kind == "up":
            self.tw(sel, {"opacity": 0, "y": 24}, {"opacity": 1, "y": 0}, dur, at)
        elif kind == "fade":
            self.tw(sel, {"opacity": 0}, {"opacity": 1}, dur, at)
        elif kind == "stick":   # suffix glued to the root: 40px -> 0, 0.45 s
            self.tw(sel, {"opacity": 0, "x": 40}, {"opacity": 1, "x": 0}, 0.45, at)
        elif kind == "left":
            self.tw(sel, {"opacity": 0, "x": -24}, {"opacity": 1, "x": 0}, dur, at)
        elif kind == "blur":
            self.tw(sel, {"opacity": 0, "filter": "blur(6px)"}, {"opacity": 1, "filter": "blur(0px)"}, dur, at)
        return at + dur

    def leave(self, sel, at=None, dur=0.2):
        at = self.t if at is None else at
        self.tw(sel, {"opacity": 1}, {"opacity": 0, "filter": "blur(6px)"}, dur, at, ease="power3.in", ir=False)
        return at + dur

    def draw(self, sel, at=None, dur=0.6, length=1000):
        """SVG stroke draws from start to end (stroke-dashoffset)."""
        at = self.t if at is None else at
        self.tw(sel, {"strokeDasharray": length, "strokeDashoffset": length, "opacity": 1},
                {"strokeDashoffset": 0}, dur, at, ease="power2.inOut")
        return at + dur

    # ---- speech
    def say(self, text, spans=None, prefix=None, rate="-8%", pre=0.15, post=0.5, hl="keep"):
        """Speak text at current time; highlight spans per word boundary.
        spans: list of css selectors (one per spoken word, None to skip) or prefix for words()."""
        mp3, dur, wb = tts(text, rate)
        if wb:
            dur = min(dur, wb[-1][1] + wb[-1][2] + 0.3)
        self._audio_n += 1
        aid = f"a{self._audio_n}"
        start = self.t + pre
        self.audio.append((aid, mp3, start, dur))
        toks = [t for t in text.split(" ") if _strip(t)]
        if spans is None and prefix is not None:
            spans = [f"#{prefix}-w{i}" for i in range(len(toks))]
        if spans:
            if len(wb) != len(spans):
                # fallback: even split
                print(f"  [warn] boundary mismatch for '{text}': {len(wb)} vs {len(spans)}; even split")
                n = len(spans)
                seg = dur / n
                wb = [(t, i * seg, seg * 0.9) for i, t in enumerate(range(n))]
            for (w, off, wd), sel in zip(wb, spans):
                if not sel:
                    continue
                t0 = start + off
                if hl == "bg":
                    self.tw(sel, {"backgroundColor": "rgba(228,239,232,0)"},
                            {"backgroundColor": SOFT}, 0.1, t0, ease="power2.out", ir=False)
                    self.tw(sel, {"backgroundColor": SOFT}, {"backgroundColor": "rgba(228,239,232,0)"},
                            0.18, t0 + max(wd, 0.25), ease="power2.out", ir=False)
                    continue
                self.tw(sel, {"backgroundColor": "rgba(228,239,232,0)", "color": INK},
                        {"backgroundColor": SOFT, "color": ACC}, 0.1, t0, ease="power2.out", ir=False)
                if hl == "keep":
                    self.tw(sel, {"backgroundColor": SOFT}, {"backgroundColor": "rgba(228,239,232,0)"},
                            0.18, t0 + max(wd, 0.25), ease="power2.out", ir=False)
                else:
                    self.tw(sel, {"backgroundColor": SOFT, "color": ACC},
                            {"backgroundColor": "rgba(228,239,232,0)", "color": INK},
                            0.18, t0 + max(wd, 0.25), ease="power2.out", ir=False)
        self.t = start + dur + post
        return start, dur, wb

    # ---- end card
    def end_card(self, lines, ru_note="Повтор: вкладка Схемы"):
        ls = "".join(f'<div class="sum">{l}</div>' for l in lines)
        self.scene("end", f'<div class="endbox" id="endbox">{ls}<div class="note" id="endnote">{esc(ru_note)}</div></div>')
        self.enter("#endbox", kind="blur", dur=0.35)
        self.t += 3.0 - 0.6
        self.end_scene(hold=0.6)

    # ---- output
    def _css(self, fontface):
        return f"""
{fontface}
:root {{ --bg:{BG}; --panel:{PANEL}; --border:{BORDER}; --ink:{INK}; --muted:{MUTED}; --acc:{ACC}; --soft:{SOFT};
  --warn:{WARN}; --warnbg:{WARN_BG}; --err:{ERR}; --errbg:{ERR_BG}; --back:{BACK}; --front:{FRONT}; --round:{ROUND}; }}
#root {{ position:absolute; inset:0; font-family:'IBM Plex Sans', sans-serif; color:var(--ink); }}
#root * {{ margin:0; padding:0; box-sizing:border-box; }}
.scene {{ position:absolute; inset:0; padding:110px 80px 0 80px; }}
.cap {{ position:absolute; left:80px; right:80px; top:596px; height:48px; }}
.capin {{ font-family:'IBM Plex Sans'; font-weight:400; font-size:30px; line-height:48px; color:var(--muted); opacity:0; white-space:nowrap; }}
.corner {{ position:absolute; top:44px; right:80px; height:28px; }}
.cornerin {{ font-family:'IBM Plex Mono'; font-weight:500; font-size:20px; line-height:28px; color:var(--muted); }}
.hu {{ font-family:'Source Serif 4', serif; font-weight:600; font-size:72px; line-height:1.2; color:var(--ink); }}
.hu .w {{ border-radius:8px; padding:0 .08em; }}
.title {{ font-family:'Source Serif 4', serif; font-weight:700; font-size:88px; line-height:1.15; color:var(--ink); }}
.title .w {{ border-radius:10px; padding:0 .08em; }}
.sub {{ font-family:'IBM Plex Sans'; font-weight:400; font-size:34px; color:var(--muted); margin-top:18px; }}
.ru {{ font-family:'IBM Plex Sans'; font-weight:400; font-size:30px; color:var(--muted); }}
.rule {{ font-family:'IBM Plex Sans'; font-weight:500; font-size:32px; color:var(--ink); margin-bottom:22px; }}
.mono {{ font-family:'IBM Plex Mono'; font-weight:500; font-size:34px; color:var(--muted); }}
.in {{ opacity:0; }}
.endbox {{ position:absolute; left:80px; right:80px; top:200px; padding:40px 48px; background:var(--panel); border:1px solid var(--border); border-radius:16px; box-shadow:0 2px 6px rgba(0,0,0,.08); opacity:0; }}
.sum {{ font-family:'Source Serif 4', serif; font-weight:600; font-size:44px; line-height:1.3; color:var(--ink); }}
.sum b {{ color:var(--acc); font-weight:700; }}
.note {{ font-family:'IBM Plex Sans'; font-size:28px; color:var(--muted); margin-top:28px; }}
{self.extra_css}
"""

    def _sub(self, cid, css, inner, tweens):
        return f"""<template>
<style>
{css}
</style>
<div id="root" data-composition-id="{cid}" data-width="{W}" data-height="{HGT}">
{inner}
</div>
<script>
const tl = gsap.timeline({{ paused: true }});
{chr(10).join(tweens)}
window.__timelines["{cid}"] = tl;
</script>
</template>
"""

    def write(self, out_dir):
        self.total = round(self.t, 2)
        self._close_caps()
        os.makedirs(f"{out_dir}/assets/fonts", exist_ok=True)
        os.makedirs(f"{out_dir}/assets/audio", exist_ok=True)
        os.makedirs(f"{out_dir}/compositions", exist_ok=True)
        for f in os.listdir(FONTS):
            if f.endswith(".woff2"):
                shutil.copy(f"{FONTS}/{f}", f"{out_dir}/assets/fonts/{f}")
        fontface = open(f"{FONTS}/fontface.css").read()
        css = self._css(fontface)
        hosts = []
        def host(cid, start, dur, track, kind):
            return (f'<div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" '
                    f'data-start="{start:.3f}" data-duration="{dur:.3f}" data-track-index="{track}" '
                    f'data-track-kind="{kind}" data-width="{W}" data-height="{HGT}"></div>')
        for s in self.scenes:
            hosts.append(host(s["id"], s["start"], s["dur"], 0, "graphics"))
            open(f"{out_dir}/compositions/{s['id']}.html", "w").write(
                self._sub(s["id"], css, f'<div class="scene">{s["html"]}</div>', s["tweens"]))
        # captions composition (spans the whole film; caption clips timed inside it)
        caps = []
        for i, (st, du, tx) in enumerate(self.caps):
            caps.append(f'<div id="cap{i}" class="clip cap" data-start="{st:.3f}" data-duration="{du:.3f}" '
                        f'data-track-index="0" data-layout-allow-caption-zone><div class="capin" id="cap{i}in">{esc(tx)}</div></div>')
            self.tw(f"#cap{i}in", {"opacity": 0, "y": 12}, {"opacity": 1, "y": 0}, 0.3, st)
        hosts.append(host("caps", 0, self.total, 1, "captions"))
        open(f"{out_dir}/compositions/caps.html", "w").write(self._sub("caps", css, chr(10).join(caps), self.tweens))
        # frame composition: lesson label
        frame = (f'<div class="corner" data-layout-ignore><span class="cornerin" id="cornerin">{esc(self.label)}</span></div>')
        hosts.append(host("frame", 0, self.total, 2, "graphics"))
        open(f"{out_dir}/compositions/frame.html", "w").write(
            self._sub("frame", css, frame, ['tl.fromTo("#cornerin", {opacity: 0}, {opacity: 1, duration: 0.3, ease: "power2.out"}, 0);']))
        audios = []
        for aid, mp3, st, du in self.audio:
            fn = f"{aid}.mp3"
            shutil.copy(mp3, f"{out_dir}/assets/audio/{fn}")
            audios.append(f'<audio id="{aid}" class="clip" src="assets/audio/{fn}" data-start="{st:.3f}" '
                          f'data-duration="{du:.3f}" data-track-index="3" data-volume="1"></audio>')
        page = f"""<!doctype html>
<html lang="hu" data-resolution="landscape">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width={W}, height={HGT}" />
<title>{esc(self.title_ru)}</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>
* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:{W}px; height:{HGT}px; overflow:hidden; background:{BG}; }}
#root {{ position:relative; width:{W}px; height:{HGT}px; }}
#bg {{ position:absolute; inset:0; background:{BG}; }}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{self.total}" data-width="{W}" data-height="{HGT}">
<div id="bg"></div>
{chr(10).join(hosts)}
{chr(10).join(audios)}
</div>
<script>
const tl = gsap.timeline({{ paused: true }});
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
"""
        open(f"{out_dir}/index.html", "w").write(page)
        json.dump({"id": self.slug, "name": self.slug, "createdAt": "2026-10-21T23:00:00.000Z"},
                  open(f"{out_dir}/meta.json", "w"))
        for f in ("package.json", "hyperframes.json"):
            shutil.copy(f"{ROOT}/hf/proj/{f}", f"{out_dir}/{f}")
        print(f"{self.slug}: {self.total}s, {len(self.scenes)} scenes, {len(self.audio)} audio clips")
        return self.total
