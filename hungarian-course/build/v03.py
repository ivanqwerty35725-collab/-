from lib import *

def build():
    v = Video(3, "03-irany", "03 · Hova? Hol? Honnan?", "Куда? Где? Откуда?")
    v.extra_css = """
.q { display:flex; gap:56px; align-items:baseline; }
.q .title { font-size:80px; }
.qru { display:flex; gap:56px; margin-top:6px; }
.qru div { font-family:'IBM Plex Sans'; font-size:30px; color:var(--muted); opacity:0; }
.lines { position:absolute; left:80px; top:120px; width:620px; }
.ln { display:flex; align-items:baseline; gap:28px; margin-bottom:22px; opacity:0; }
.ln .hu { font-size:64px; white-space:nowrap; }
.ln .ru { font-size:28px; white-space:nowrap; }
.pic { position:absolute; right:80px; top:120px; width:460px; height:400px; }
table.g { border-collapse:collapse; margin-top:14px; }
table.g th { font-family:'IBM Plex Mono'; font-weight:500; font-size:28px; color:var(--muted); text-align:left; padding:6px 22px 12px 0; }
table.g td { font-family:'IBM Plex Mono'; font-weight:500; font-size:30px; color:var(--ink); padding:12px 22px 12px 0; border-top:1px solid var(--border); white-space:nowrap; }
table.g td.l { font-family:'IBM Plex Sans'; font-weight:400; font-size:26px; color:var(--muted); width:250px; }
table.g td span { border-radius:6px; padding:0 .15em; margin:0 -.15em; }
table.g tr { opacity:0; }
.sent .ln .hu { font-size:66px; }
.sent .ln .ru { width:320px; }
"""
    # ---- A: title
    v.scene("s1", words("s1t", "Hova? Hol? Honnan?", cls="title")
            + '<div class="sub in" id="s1s">Три вопроса о месте — три группы окончаний</div>')
    v.tw("#s1t", {"opacity": 1}, {"opacity": 1}, 0.05, 0); v.enter("#s1s", at=v.t + 0.2)
    v.cap("Hova? — куда?   Hol? — где?   Honnan? — откуда?")
    v.t += 0.5
    v.say("Hova? Hol? Honnan?", prefix="s1t", rate="-15%", post=0.8)
    v.end_scene(0.3)

    # ---- B: house diagram
    svg = f'''<svg class="pic" viewBox="0 0 460 400" width="460" height="400" data-layout-ignore>
<polygon id="roof" points="90,190 230,70 370,190" fill="{PANEL}" stroke="{INK}" stroke-width="4" stroke-linejoin="round" opacity="0"/>
<rect id="wall" x="120" y="190" width="220" height="160" fill="{PANEL}" stroke="{INK}" stroke-width="4" opacity="0"/>
<rect id="door" x="205" y="270" width="50" height="80" fill="{BG}" stroke="{INK}" stroke-width="4" opacity="0"/>
<path id="ar1" d="M 10 240 L 185 240" fill="none" stroke="{ACC}" stroke-width="6" stroke-linecap="round" opacity="0"/>
<polyline id="ah1" points="165,222 187,240 165,258" fill="none" stroke="{ACC}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
<circle id="dot" cx="230" cy="235" r="16" fill="{ACC}" opacity="0"/>
<path id="ar2" d="M 275 240 L 445 240" fill="none" stroke="{ACC}" stroke-width="6" stroke-linecap="round" opacity="0"/>
<polyline id="ah2" points="425,222 447,240 425,258" fill="none" stroke="{ACC}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
</svg>'''
    def ln(pid, text, ru, raw=False):
        return f'<div class="ln" id="{pid}">{words(pid + "h", text, raw=raw)}<div class="ru">{esc(ru)}</div></div>'
    v.scene("s2", '<div class="lines">' + ln("h1", "a házba", "в дом") + ln("h2", "a házban", "в доме")
            + ln("h3", "a házból", "из дома") + '</div>' + svg)
    v.cap("Дом как ориентир: движение внутрь, нахождение внутри, движение изнутри")
    for sel in ("#wall", "#roof", "#door"):
        v.enter(sel, kind="fade", dur=0.3); v.t += 0.12
    v.t += 0.4
    # into
    v.cap("Hova? → -ba / -be: в дом")
    v.enter("#h1", kind="left"); v.draw("#ar1", at=v.t + 0.1, length=200); v.enter("#ah1", at=v.t + 0.6, kind="fade", dur=0.15)
    v.t += 0.8
    v.say("a házba.", spans=[None, "#h1h-w1"], post=0.6)
    # inside
    v.cap("Hol? → -ban / -ben: в доме")
    v.enter("#h2", kind="left")
    v.tw("#dot", {"opacity": 0, "scale": 0.2, "transformOrigin": "50% 50%"}, {"opacity": 1, "scale": 1}, 0.35, v.t + 0.2)
    v.t += 0.7
    v.say("a házban.", spans=[None, "#h2h-w1"], post=0.6)
    # out of
    v.cap("Honnan? → -ból / -ből: из дома")
    v.enter("#h3", kind="left"); v.draw("#ar2", at=v.t + 0.1, length=200); v.enter("#ah2", at=v.t + 0.6, kind="fade", dur=0.15)
    v.t += 0.8
    v.say("a házból.", spans=[None, "#h3h-w1"], post=0.7)
    v.end_scene(0.4)

    # ---- C: 3x3 table
    rows = [("внутрь / внутри", ["-ba/-be", "-ban/-ben", "-ból/-ből"], "házba, házban, házból."),
            ("на поверхность", ["-ra/-re", "-n/-on/-en/-ön", "-ról/-ről"], "asztalra, asztalon, asztalról."),
            ("рядом, к кому-то", ["-hoz/-hez/-höz", "-nál/-nél", "-tól/-től"], "orvoshoz, orvosnál, orvostól.")]
    t = '<table class="g"><tr id="th" style="opacity:1"><th></th><th>Hova?</th><th>Hol?</th><th>Honnan?</th></tr>'
    for i, (lab, cells, _) in enumerate(rows):
        t += f'<tr id="r{i}"><td class="l">{esc(lab)}</td>' + "".join(
            f'<td><span id="r{i}c{j}">{esc(c)}</span></td>' for j, c in enumerate(cells)) + '</tr>'
    t += '</table>'
    v.scene("s3", '<div class="rule in" id="s3rule">Одно направление — одна колонка</div>' + t)
    v.enter("#s3rule", kind="fade"); v.t += 0.6
    caps = ["ház: házba — házban — házból", "asztal (стол): asztalra — asztalon — asztalról",
            "orvos (врач): orvoshoz — orvosnál — orvostól"]
    for i, (lab, cells, spoken) in enumerate(rows):
        v.cap(caps[i])
        v.enter(f"#r{i}", kind="fade", dur=0.3); v.t += 0.4
        v.say(spoken, spans=[f"#r{i}c{j}" for j in range(3)], rate="-12%", hl="bg", post=0.5)
    v.end_scene(0.5)

    # ---- D: Perm sentences
    v.scene("s4", '<div class="sent">' + ln("p1", "Permbe megyek.", "еду в Пермь")
            + ln("p2", "Permben lakom.", "живу в Перми") + ln("p3", "Permből jövök.", "еду из Перми") + '</div>')
    v.cap("Perm: передний ряд → -be / -ben / -ből")
    for pid, spoken in (("p1", "Permbe megyek."), ("p2", "Permben lakom."), ("p3", "Permből jövök.")):
        v.enter(f"#{pid}", kind="left"); v.t += 0.45
        v.say(spoken, prefix=pid + "h", post=0.6)
    v.end_scene(0.4)

    v.end_card(["Hova? <b>-ba/-be</b> · Hol? <b>-ban/-ben</b> · Honnan? <b>-ból/-ből</b>",
                "Perm<b>be</b> megyek · Perm<b>ben</b> lakom · Perm<b>ből</b> jövök"])
    return v

if __name__ == "__main__":
    build().write(f"{ROOT}/hf/v03")
