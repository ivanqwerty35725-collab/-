from lib import *

def build():
    v = Video(6, "06-mult", "06 · Múlt idő", "Прошедшее время")
    v.extra_css = f"""
.ln {{ display:flex; align-items:baseline; gap:36px; margin-bottom:18px; opacity:0; }}
.ln .hu {{ font-size:64px; white-space:nowrap; }}
.ln .ru {{ font-size:28px; white-space:nowrap; }}
.t {{ color:var(--acc); }}
table.c {{ border-collapse:collapse; margin-top:4px; }}
table.c td {{ font-family:'Source Serif 4', serif; font-weight:600; font-size:40px; line-height:1.15; color:var(--ink); padding:6px 36px 6px 0; white-space:nowrap; }}
table.c td.p {{ font-family:'IBM Plex Mono'; font-weight:500; font-size:26px; color:var(--muted); width:90px; }}
table.c td.r {{ font-family:'IBM Plex Sans'; font-weight:400; font-size:26px; color:var(--muted); }}
table.c td span {{ border-radius:6px; padding:0 .12em; margin:0 -.12em; }}
table.c tr {{ opacity:0; }}
.date {{ font-family:'IBM Plex Mono'; font-weight:500; font-size:44px; color:var(--muted); opacity:0; }}
.chunks {{ display:flex; gap:22px; margin-top:26px; }}
.ch {{ opacity:0; }}
.ch .hu {{ font-size:56px; white-space:nowrap; }}
.ch .ru {{ font-size:22px; margin-top:2px; }}
.whole {{ margin-top:30px; }}
.whole .hu {{ font-size:60px; }}
.sent .hu {{ font-size:56px; line-height:1.25; }}
.sent .ru {{ margin-top:16px; font-size:30px; }}
"""
    # ---- A
    v.scene("s1", words("s1t", "Múlt idő", cls="title") + '<div class="sub in" id="s1s">Прошедшее время: показатель -t / -tt</div>')
    v.tw("#s1t", {"opacity": 1}, {"opacity": 1}, 0.05, 0); v.enter("#s1s", at=v.t + 0.2)
    v.cap("Одно прошедшее время на все случаи: корень + -t + личное окончание")
    v.t += 0.5
    v.say("Múlt idő.", prefix="s1t", post=0.9)
    v.end_scene(0.3)

    # ---- B: tanul table
    pr = ["én", "te", "ő", "mi", "ti", "ők"]
    forms = ["tanul<span class=t>t</span>am", "tanul<span class=t>t</span>ál", "tanul<span class=t>t</span>",
             "tanul<span class=t>t</span>unk", "tanul<span class=t>t</span>atok", "tanul<span class=t>t</span>ak"]
    ru = ["я учился", "ты учился", "он / она учился", "мы учились", "вы учились", "они учились"]
    t = '<table class="c">'
    for i in range(6):
        t += f'<tr id="r{i}"><td class="p">{pr[i]}</td><td><span id="f{i}">{forms[i]}</span></td><td class="r">{ru[i]}</td></tr>'
    t += '</table>'
    v.scene("s2", '<div class="rule in" id="s2rule">tanul — учиться → tanul + t + окончание</div>' + t)
    v.enter("#s2rule", kind="fade"); v.t += 0.6
    v.cap("Показатель -t- стоит между корнем и личным окончанием")
    for i in range(6):
        v.enter(f"#r{i}", kind="fade", dur=0.25); v.t += 0.1
    v.t += 0.4
    v.say("tanultam, tanultál, tanult, tanultunk, tanultatok, tanultak.", spans=[f"#f{i}" for i in range(6)],
          rate="-12%", hl="bg", post=0.8)
    v.end_scene(0.4)

    # ---- C: voltam, mentem, születtem
    def ln(pid, raw_text, ru_):
        return f'<div class="ln" id="{pid}">{words(pid + "h", raw_text, raw=True)}<div class="ru">{esc(ru_)}</div></div>'
    v.scene("s3", '<div class="rule in" id="s3rule">Три формы, которые нужны чаще всего</div>'
            + ln("c1", 'vol<span class=t>t</span>am', "я был (van)")
            + ln("c2", 'men<span class=t>t</span>em', "я пошёл, я поехал (megy)")
            + ln("c3", 'szüle<span class=t>tt</span>em', "я родился (születik)"))
    v.enter("#s3rule", kind="fade"); v.t += 0.7
    v.cap("van → voltam: корень меняется, показатель -t тот же")
    v.enter("#c1", kind="left"); v.t += 0.4
    v.say("voltam.", prefix="c1h", post=0.5)
    v.cap("megy → mentem")
    v.enter("#c2", kind="left"); v.t += 0.4
    v.say("mentem.", prefix="c2h", post=0.5)
    v.cap("születik → születtem: после согласного -tt-")
    v.enter("#c3", kind="left"); v.t += 0.4
    v.say("születtem.", prefix="c3h", post=0.8)
    v.end_scene(0.4)

    # ---- D: the year
    chunks = [("ezer", "тысяча"), ("kilenc", "девять"), ("száz", "сто"), ("ötven", "пятьдесят"), ("egy", "один"), ("ben", "в")]
    ch = '<div class="chunks">' + "".join(
        f'<div class="ch" id="k{i}"><div class="hu">{esc(a)}</div><div class="ru">{esc(b)}</div></div>' for i, (a, b) in enumerate(chunks)) + '</div>'
    v.scene("s4", '<div class="date" id="date">1951-ben</div>' + ch
            + '<div class="whole in" id="whole">' + words("wh", "ezerkilencszázötvenegyben") + '</div>')
    v.cap("Год пишется цифрами, читается одним словом, окончание -ban / -ben")
    v.enter("#date", kind="left"); v.t += 0.7
    v.cap("ezer · kilenc·száz · ötven·egy + -ben → в 1951 году")
    for i in range(6):
        v.enter(f"#k{i}", kind="up", dur=0.3); v.t += 0.14
    v.t += 0.6
    v.enter("#whole", kind="fade"); v.t += 0.4
    v.say("ezerkilencszázötvenegyben.", prefix="wh", rate="-15%", post=0.9)
    v.end_scene(0.4)

    # ---- E: the sentence
    v.scene("s5", '<div class="sent">' + words("se", "A nagyapám ezerkilencszázötvenegyben született Csománfalván.")
            + '<div class="ru in" id="seru">Мой дедушка родился в 1951 году в Чоманфалве.</div></div>')
    v.cap("Всё вместе: подлежащее — год — глагол в прошедшем — место")
    v.enter("#se", kind="left"); v.enter("#seru", at=v.t + 0.3); v.t += 0.7
    v.say("A nagyapám ezerkilencszázötvenegyben született Csománfalván.", prefix="se", rate="-12%", post=1.0)
    v.end_scene(0.4)

    v.end_card(["корень + <b>-t / -tt</b> + окончание: tanul<b>t</b>am · vol<b>t</b>am · szüle<b>tt</b>em",
                "1951-ben = ezerkilencszázötvenegy<b>ben</b>"])
    return v

if __name__ == "__main__":
    build().write(f"{ROOT}/hf/v06")
