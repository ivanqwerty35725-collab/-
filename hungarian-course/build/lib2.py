"""Версия 2 сборки: русский рассказчик, повтор фраз, паузы с кольцом, без углового ярлыка и субтитров."""
import asyncio, hashlib, json, os, subprocess
import lib
from lib import *

VOICE_HU = "hu-HU-TamasNeural"
VOICE_RU = "ru-RU-SvetlanaNeural"
RATE_HU = "-15%"
RATE_RU = "+8%"
RATE_HU_SLOW = "-30%"
RATE_QUOTE = "+0%"
GAP_REPEAT = 2.0     # пауза между первым и вторым произнесением
GAP_SPEAK = 3.0      # пауза, чтобы повторить вслух
GAP_THINK = 5.0      # пауза на обдумывание в проверке
ENTER = 0.6          # вход элемента


def tts2(text, voice, rate):
    os.makedirs(lib.TTS_CACHE, exist_ok=True)
    key = hashlib.sha1(f"{voice}|{rate}|{text}".encode()).hexdigest()[:16]
    mp3 = f"{lib.TTS_CACHE}/{key}.mp3"
    meta = f"{lib.TTS_CACHE}/{key}.json"
    if not os.path.exists(meta):
        import edge_tts

        async def run():
            c = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
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


class Video2(Video):
    BRIDGES = ["Ещё раз, медленнее.", "Послушайте ещё раз.", "Ещё раз, по словам.", "И ещё раз, внимательно."]
    YOURS = ["Теперь вы.", "Ваша очередь.", "Повторите вслух."]

    def __init__(self, num, slug, title_ru, ru_voice=VOICE_RU):
        super().__init__(num, slug, "", title_ru)
        self.ru_voice = ru_voice
        self._b = 0
        self._ring_n = 0
        self.script = []   # (kind, text) для экспорта сценария

    def enter(self, sel, at=None, kind="up", dur=ENTER):
        return super().enter(sel, at=at, kind=kind, dur=dur)

    def _speak(self, text, voice, rate, spans=None, prefix=None, pre=0.15, post=0.6, hl="keep"):
        orig = lib.tts
        lib.tts = lambda t, r: tts2(t, voice, r)
        try:
            return Video.say(self, text, spans=spans, prefix=prefix, rate=rate, pre=pre, post=post, hl=hl)
        finally:
            lib.tts = orig

    # рассказчик по-русски; слова в «кавычках» читаются отдельно, медленнее и с паузами
    def narrate(self, text, post=0.5):
        import re as _re
        self.script.append(("RU", text))
        parts = [p for p in _re.split(r"(«[^»]+»)", text) if p.strip()]
        if len(parts) == 1:
            return self._speak(text, self.ru_voice, RATE_RU, post=post)
        for i, p in enumerate(parts):
            last = i == len(parts) - 1
            if p.startswith("«"):
                self._speak(p.strip("«»"), self.ru_voice, RATE_QUOTE, pre=0.4, post=post if last else 0.4)
            else:
                p = p.strip(" ,")
                if not p or p in (".", ":", "?"):
                    continue
                self._speak(p, self.ru_voice, RATE_RU, pre=0.05, post=post if last else 0.05)

    # венгерская фраза один раз
    def hu(self, text, spans=None, prefix=None, post=0.8, hl="flash", rate=RATE_HU):
        self.script.append(("HU" if rate == RATE_HU else "HU_SLOW", text))
        return self._speak(text, VOICE_HU, rate, spans=spans, prefix=prefix, post=post, hl=hl)

    # пауза с кольцом отсчёта, без надписей
    def ring(self, secs):
        self._ring_n += 1
        rid = f"rg{self._ring_n}"
        c = 2 * 3.14159 * 18
        self._cur["html"] += (
            f'<svg class="ring" id="{rid}" viewBox="0 0 44 44" width="52" height="52" data-layout-ignore>'
            f'<circle cx="22" cy="22" r="18" fill="none" stroke="{BORDER}" stroke-width="3"/>'
            f'<circle id="{rid}c" cx="22" cy="22" r="18" fill="none" stroke="{ACC}" stroke-width="3" '
            f'stroke-linecap="round" transform="rotate(-90 22 22)" stroke-dasharray="{c:.1f}" stroke-dashoffset="0"/></svg>')
        t0 = self.t
        self.tw(f"#{rid}", {"opacity": 0}, {"opacity": 1}, 0.3, t0, ease="power2.out")
        self.tw(f"#{rid}c", {"strokeDashoffset": 0}, {"strokeDashoffset": round(c, 1)}, secs, t0, ease="none")
        self.tw(f"#{rid}", {"opacity": 1}, {"opacity": 0}, 0.3, t0 + secs - 0.3, ease="power2.in", ir=False)
        self.script.append(("PAUSE", f"{secs:.0f} с"))
        self.t = t0 + secs

    # фраза дважды + пауза, чтобы повторить
    def _next(self, lst):
        x = lst[self._b % len(lst)]
        return x

    # фраза: обычный темп → связка → медленно → «теперь вы» → пауза
    def drill(self, text, spans=None, prefix=None):
        _, d1, _ = self.hu(text, spans=spans, prefix=prefix, post=0.9)
        self.narrate(self._next(self.BRIDGES), post=0.4)
        self.hu(text, spans=spans, prefix=prefix, post=0.6, rate=RATE_HU_SLOW)
        self.narrate(self._next(self.YOURS), post=0.2)
        self._b += 1
        self.ring(max(GAP_SPEAK, round(d1 * 1.6, 1)))
        self.t += 0.5

    # ряд слов: каждое отдельно с паузой, потом строка медленно, потом «теперь вы»
    def drill_words(self, items, spans):
        for w, sp in zip(items, spans):
            self.hu(w, spans=[sp], post=1.2)
        self.narrate("Вся строка, медленно.", post=0.4)
        self.hu(", ".join(items) + ".", spans=spans, post=0.6, rate=RATE_HU_SLOW)
        self.narrate(self._next(self.YOURS), post=0.2)
        self._b += 1
        self.ring(4.0)
        self.t += 0.5

    # заголовок блока: 2,2 с, без голоса
    def block(self, sid, title):
        self.script.append(("SCENE", title))
        self.scene(sid, f'<div class="blk" id="{sid}b"><div class="blkt">{esc(title)}</div></div>')
        self.enter(f"#{sid}b", kind="fade")
        self.t += 1.6
        self.leave(f"#{sid}b", dur=0.3)
        self.t += 0.3
        self.end_scene(0.0)

    def end_card(self, html):
        self.scene("end", f'<div class="endbox2" id="endbox">{html}</div>')
        self.enter("#endbox", kind="fade")
        self.t += 0.8

    def write(self, out_dir):
        self.extra_css += """
:root{--ru:#46515A;}
.ring{position:absolute;left:614px;top:612px;opacity:0;}
.blk{position:absolute;left:80px;top:310px;opacity:0;}
.blkt{font-family:'Source Serif 4',serif;font-weight:600;font-size:64px;color:var(--ink);}
.endbox2{position:absolute;left:80px;right:80px;top:70px;bottom:70px;padding:36px 48px;background:var(--panel);border:1px solid var(--border);border-radius:16px;opacity:0;}
.eh{font-family:'Source Serif 4',serif;font-weight:600;font-size:34px;color:var(--ink);margin-bottom:16px;}
.esec{margin-bottom:30px;}
.egrid{display:grid;grid-template-columns:300px 230px 230px 230px;row-gap:10px;align-items:baseline;}
.egrid .h{font-family:'Source Serif 4',serif;font-style:italic;font-weight:500;font-size:28px;color:var(--ink);}
.egrid .l{font-family:'Source Serif 4',serif;font-style:italic;font-weight:400;font-size:27px;color:var(--ru);}
.egrid .c{font-family:'Source Serif 4',serif;font-weight:600;font-size:32px;color:var(--ink);}
.egrid .c b,.ph b{color:var(--acc);font-weight:700;}
.pgrid{display:grid;grid-template-columns:420px 1fr;row-gap:10px;align-items:baseline;}
.ph{font-family:'Source Serif 4',serif;font-weight:600;font-size:36px;color:var(--ink);}
.pr{font-family:'Source Serif 4',serif;font-style:italic;font-size:28px;color:var(--ru);}
"""
        total = super().write(out_dir)
        # убрать угловой ярлык и пустую дорожку субтитров
        idx = open(f"{out_dir}/index.html").read()
        import re
        idx = re.sub(r'<div id="frame"[^>]*></div>\n?', "", idx)
        if not self.caps:
            idx = re.sub(r'<div id="caps"[^>]*></div>\n?', "", idx)
        open(f"{out_dir}/index.html", "w").write(idx)
        for f in ("frame.html",) + (("caps.html",) if not self.caps else ()):
            p = f"{out_dir}/compositions/{f}"
            if os.path.exists(p):
                os.remove(p)
        return total

    def export_script(self, path, title):
        lines = [f"# {title}", ""]
        for k, t in self.script:
            if k == "RU":
                lines.append(f"Рассказчик: {t}")
            elif k == "HU":
                lines.append(f"Диктор (венг.): {t}")
            elif k == "HU_SLOW":
                lines.append(f"Диктор (венг., медленно): {t}")
            elif k == "PAUSE":
                lines.append(f"Пауза {t}")
            elif k == "SCENE":
                lines += ["", f"## {t}"]
            elif k == "SCREEN":
                lines.append(f"Экран: {t}")
        open(path, "w").write("\n".join(lines) + "\n")
