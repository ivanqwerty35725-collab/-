from lib import *

def build():
    v = Video(5, "05-targyas", "05 · Tárgyas ragozás", "Определённое и неопределённое спряжение")
    v.extra_css = f"""
.title {{ font-size:64px; }}
.ln {{ display:flex; align-items:baseline; gap:36px; margin-bottom:18px; opacity:0; }}
.ln .hu {{ font-size:64px; white-space:nowrap; }}
.ln .ru {{ font-size:28px; white-space:nowrap; }}
.ind {{ color:{BACK}; }}
.def {{ color:var(--acc); }}
table.c {{ border-collapse:collapse; margin-top:10px; }}
table.c th {{ font-family:'IBM Plex Mono'; font-weight:500; font-size:26px; color:var(--muted); text-align:left; padding:4px 36px 10px 0; }}
table.c td {{ font-family:'Source Serif 4', serif; font-weight:600; font-size:40px; line-height:1.15; color:var(--ink); padding:7px 36px 7px 0; white-space:nowrap; }}
table.c td.p {{ font-family:'IBM Plex Mono'; font-weight:500; font-size:26px; color:var(--muted); width:90px; }}
table.c td span {{ border-radius:6px; padding:0 .12em; margin:0 -.12em; }}
table.c tr {{ opacity:0; }}
"""
    # ---- A
    v.scene("s1", words("s1t", "Alanyi és tárgyas ragozás", cls="title")
            + '<div class="sub in" id="s1s">Неопределённое и определённое спряжение</div>')
    v.tw("#s1t", {"opacity": 1}, {"opacity": 1}, 0.05, 0); v.enter("#s1s", at=v.t + 0.2)
    v.cap("У каждого глагола два набора окончаний. Выбор зависит от объекта")
    v.t += 0.5
    v.say("Alanyi és tárgyas ragozás.", prefix="s1t", post=0.9)
    v.end_scene(0.3)

    # ---- B: pair
    def ln(pid, raw_text, ru):
        return f'<div class="ln" id="{pid}">{words(pid + "h", raw_text, raw=True)}<div class="ru">{esc(ru)}</div></div>'
    v.scene("s2", '<div class="rule in" id="s2rule">Какой дом? Неважно какой — или именно этот</div>'
            + ln("b1", 'Lát<span class="ind">ok</span>|egy|házat.', "вижу какой-то дом")
            + ln("b2", 'Lát<span class="def">om</span>|a|házat.', "вижу этот дом"))
    v.enter("#s2rule", kind="fade"); v.t += 0.8
    v.cap("egy házat — объект неопределённый → látok (alanyi)")
    v.enter("#b1", kind="left"); v.t += 0.45
    v.say("Látok egy házat.", prefix="b1h", post=0.7)
    v.cap("a házat — объект определённый → látom (tárgyas)")
    v.enter("#b2", kind="left"); v.t += 0.45
    v.say("Látom a házat.", prefix="b2h", post=0.8)
    v.end_scene(0.4)

    # ---- C: table
    pr = ["én", "te", "ő", "mi", "ti", "ők"]
    al = ["látok", "látsz", "lát", "látunk", "láttok", "látnak"]
    ta = ["látom", "látod", "látja", "látjuk", "látjátok", "látják"]
    t = '<table class="c"><tr id="th" style="opacity:1"><th></th><th>alanyi · egy házat</th><th>tárgyas · a házat</th></tr>'
    for i in range(6):
        t += (f'<tr id="r{i}"><td class="p">{pr[i]}</td><td><span id="a{i}">{al[i]}</span></td>'
              f'<td><span id="t{i}">{ta[i]}</span></td></tr>')
    t += '</table>'
    v.scene("s3", t)
    v.cap("lát — видеть. Слева неопределённое, справа определённое")
    for i in range(6):
        v.enter(f"#r{i}", kind="fade", dur=0.25); v.t += 0.1
    v.t += 0.4
    v.cap("alanyi: -ok, -sz, –, -unk, -tok, -nak")
    v.say("látok, látsz, lát, látunk, láttok, látnak.", spans=[f"#a{i}" for i in range(6)], rate="-12%", hl="bg", post=0.6)
    v.cap("tárgyas: -om, -od, -ja, -juk, -játok, -ják")
    v.say("látom, látod, látja, látjuk, látjátok, látják.", spans=[f"#t{i}" for i in range(6)], rate="-12%", hl="bg", post=0.8)
    v.end_scene(0.4)

    # ---- D: when definite
    v.scene("s4", '<div class="rule in" id="s4rule">Когда объект определённый → tárgyas</div>'
            + ln("d1", 'Lát<span class="def">om</span>|a|házat.', "артикль a / az")
            + ln("d2", 'Lát<span class="def">om</span>|Kirillt.', "имя")
            + ln("d3", 'Lát<span class="def">om</span>|a|házamat.', "притяжательное: мой дом"))
    v.enter("#s4rule", kind="fade"); v.t += 0.7
    v.cap("Артикль a / az → определённое")
    v.enter("#d1", kind="left"); v.t += 0.4
    v.say("Látom a házat.", prefix="d1h", post=0.5)
    v.cap("Имя собственное → определённое")
    v.enter("#d2", kind="left"); v.t += 0.4
    v.say("Látom Kirillt.", prefix="d2h", post=0.5)
    v.cap("Притяжательное окончание (-m, -d…) → определённое")
    v.enter("#d3", kind="left"); v.t += 0.4
    v.say("Látom a házamat.", prefix="d3h", post=0.8)
    v.end_scene(0.4)

    v.end_card(["egy házat → lát<b>ok</b> · a házat → lát<b>om</b>",
                "a/az, имя, мой/твой → определённое спряжение"])
    return v

if __name__ == "__main__":
    build().write(f"{ROOT}/hf/v05")
