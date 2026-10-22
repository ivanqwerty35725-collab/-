import sys
from lib2 import *

def SCR(v, text):
    v.script.append(("SCREEN", text))

def item(pid, hu_html, ru, cls=""):
    return f'<div class="item {cls}" id="{pid}"><div class="hu">{hu_html}</div><div class="tr">{esc(ru)}</div></div>'

def build(ru_voice="ru-RU-DmitryNeural"):
    v = Video2(3, "03-irany", "Куда? Где? Откуда?", ru_voice=ru_voice)
    v.extra_css = """
.item { opacity:0; margin-bottom:34px; }
.item .hu { font-size:64px; white-space:nowrap; }
.item .tr { font-family:'Source Serif 4', serif; font-style:italic; font-weight:400; font-size:34px; color:var(--ru); margin-top:4px; }
.hu .w { border-radius:8px; padding:0 .08em; }
.suf { color:var(--acc); }
.trio { display:grid; grid-template-columns:repeat(3, max-content); column-gap:72px; margin-top:180px; }
.endbox2 { bottom:auto !important; top:110px !important; }
.trio .item { opacity:1; }
.trio .hu { font-family:'Source Serif 4', serif; font-weight:700; font-size:84px; }
.trio .tr { opacity:0; font-size:40px; }
.lines { position:absolute; left:80px; top:150px; }
.pic { position:absolute; right:80px; top:150px; width:460px; height:400px; }
table.g { border-collapse:collapse; margin-top:60px; }
table.g th { font-family:'Source Serif 4', serif; font-style:italic; font-weight:500; font-size:34px; color:var(--ink); text-align:left; padding:0 30px 14px 0; width:250px; }
table.g th.l { width:310px; }
table.g td { font-family:'Source Serif 4', serif; font-weight:600; font-size:38px; color:var(--ink); padding:16px 30px 16px 0; border-top:1px solid var(--border); white-space:nowrap; }
table.g td.l { font-family:'Source Serif 4', serif; font-style:italic; font-weight:400; font-size:31px; color:var(--ru); }
table.g td span { border-radius:6px; padding:0 .12em; margin:0 -.12em; }
table.g tr { opacity:0; }
.quiz { position:absolute; left:80px; top:210px; right:80px; }
.qq { font-family:'Source Serif 4', serif; font-style:italic; font-weight:500; font-size:60px; color:var(--ink); opacity:0; }
.qa { font-family:'Source Serif 4', serif; font-weight:600; font-size:84px; color:var(--ink); margin-top:30px; opacity:0; }
.pcols { display:grid; grid-template-columns:repeat(3, 1fr); column-gap:30px; }
.pcols .hu { font-size:36px; }
.pcols .tr { font-size:27px; }
.pcols .item { opacity:1; margin:0; }
.pcols b { color:var(--acc); }
"""
    # ---------------- Три вопроса
    v.script.append(("SCENE", "Три вопроса"))
    trio = '<div class="trio">' + "".join(
        f'<div class="item"><div class="hu"><span class="w" id="t{i}">{hu}</span></div><div class="tr" id="t{i}r">{ru}</div></div>'
        for i, (hu, ru) in enumerate([("Hova?", "куда?"), ("Hol?", "где?"), ("Honnan?", "откуда?")])) + '</div>'
    v.scene("s1", trio)
    v.enter(".trio", kind="fade")
    SCR(v, "три вопроса крупно, перевод появляется под каждым по мере произнесения")
    v.t += 0.8
    v.narrate("В венгерском нет предлогов, как в русском: «в доме», «на столе», «из дома».")
    v.narrate("Вместо них к концу слова приклеивается окончание. Какое именно, зависит от вопроса.", post=0.6)
    for i in range(3):
        v.enter(f"#t{i}r", kind="fade")
        v.hu(["Hova?", "Hol?", "Honnan?"][i], spans=[f"#t{i}"], post=0.9)
    v.narrate("Куда, где и откуда. Посмотрим, как это работает.", post=0.6)
    v.end_scene(0.4)

    # ---------------- Образ: дом
    v.block("b2", "Образ: дом")
    svg = f'''<svg class="pic" viewBox="0 0 460 400" width="460" height="400" data-layout-ignore>
<polygon id="roof" points="90,190 230,70 370,190" fill="{PANEL}" stroke="{INK}" stroke-width="4" stroke-linejoin="round" opacity="0"/>
<rect id="wall" x="120" y="190" width="220" height="160" fill="{PANEL}" stroke="{INK}" stroke-width="4" opacity="0"/>
<rect id="door" x="205" y="270" width="50" height="80" fill="{BG}" stroke="{INK}" stroke-width="4" opacity="0"/>
<path id="ar1" d="M 10 240 L 185 240" fill="none" stroke="{ACC}" stroke-width="6" stroke-linecap="round" opacity="0"/>
<polyline id="ah1" points="165,222 187,240 165,258" fill="none" stroke="{ACC}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
<circle id="dot" cx="230" cy="235" r="16" fill="{ACC}" opacity="0"/>
<path id="ar2" d="M 275 240 L 440 240" fill="none" stroke="{ACC}" stroke-width="6" stroke-linecap="round" opacity="0"/>
<polyline id="ah2" points="420,222 442,240 420,258" fill="none" stroke="{ACC}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
</svg>'''
    def hh(pid, suf):
        return f'<span class="w" id="{pid}a">a</span> <span class="w" id="{pid}b">ház<span class="suf" id="{pid}s">{suf}</span></span>'
    v.scene("s2", '<div class="lines">' + item("h1", hh("h1", "ba"), "в дом") + item("h2", hh("h2", "ban"), "в доме")
            + item("h3", hh("h3", "ból"), "из дома") + '</div>' + svg)
    for sel in ("#wall", "#roof", "#door"):
        v.enter(sel, kind="fade"); v.t += 0.2
    SCR(v, "справа рисуется дом")
    v.t += 0.4
    v.narrate("Возьмём слово «дом». По-венгерски оно звучит так.")
    v.hu("ház.", post=1.0)
    steps = [("Если я иду в дом, это вопрос «куда?». Окончание выделено зелёным.", "h1", "a házba.", "стрелка в дом"),
             ("Если я уже в доме, это вопрос «где?».", "h2", "a házban.", "точка внутри дома"),
             ("А если выхожу из дома, это вопрос «откуда?».", "h3", "a házból.", "стрелка из дома")]
    for k, (ru, pid, hu, scr) in enumerate(steps):
        v.narrate(ru, post=0.3)
        v.enter(f"#{pid}", kind="left")
        if k == 0:
            v.draw("#ar1", at=v.t + 0.1, length=200); v.enter("#ah1", at=v.t + 0.7, kind="fade", dur=0.3)
        elif k == 1:
            v.tw("#dot", {"opacity": 0, "scale": 0.2, "transformOrigin": "50% 50%"}, {"opacity": 1, "scale": 1}, 0.6, v.t + 0.2)
        else:
            v.draw("#ar2", at=v.t + 0.1, length=200); v.enter("#ah2", at=v.t + 0.7, kind="fade", dur=0.3)
        SCR(v, f"{scr}, {hu} и перевод под ним")
        v.t += 1.1
        v.hu(hu, spans=[f"#{pid}a", f"#{pid}b"], post=1.2)
    for i, s in enumerate(("#h1s", "#h2s", "#h3s")):
        v.tw(s, {"backgroundColor": "rgba(228,239,232,0)"}, {"backgroundColor": SOFT}, 0.4, v.t + 0.3 * i, ease="power2.out")
    v.narrate("Все три окончания начинаются на одну букву. Это пространство внутри.", post=1.2)
    v.end_scene(0.4)

    # ---------------- Вся система
    v.block("b3", "Вся система")
    rows = [("внутрь, внутри", [("ház","ba"), ("ház","ban"), ("ház","ból")]),
            ("на поверхность", [("asztal","ra"), ("asztal","on"), ("asztal","ról")]),
            ("к человеку, у него", [("orvos","hoz"), ("orvos","nál"), ("orvos","tól")])]
    t = '<table class="g"><tr style="opacity:1"><th class="l"></th><th>куда?</th><th>где?</th><th>откуда?</th></tr>'
    for i, (lab, cells) in enumerate(rows):
        t += f'<tr id="r{i}"><td class="l">{esc(lab)}</td>' + "".join(
            f'<td><span id="r{i}c{j}">{c[0]}<span class="suf">{c[1]}</span></span></td>' for j, c in enumerate(cells)) + '</tr>'
    t += '</table>'
    v.scene("s3", t)
    SCR(v, "таблица 3×3, строки появляются по одной")
    v.t += 0.6
    intro = ["Таких групп три. Первая вам уже знакома.",
             "Вторая про поверхность. Слово «стол»: «на стол», «на столе», «со стола».",
             "Третья про людей: «к врачу», «у врача», «от врача»."]
    for i, (lab, cells) in enumerate(rows):
        v.narrate(intro[i], post=0.4)
        v.enter(f"#r{i}", kind="fade"); v.t += 0.8
        for j, c in enumerate(cells):
            v.hu(c[0] + c[1] + ".", spans=[f"#r{i}c{j}"], post=1.0)
        v.t += 0.4
    v.narrate("Колонки всегда одинаковы: «куда?», «где?» и «откуда?».", post=0.2)
    for j in range(3):
        at = v.t + 1.0 * j
        for i in range(3):
            v.tw(f"#r{i}c{j}", {"backgroundColor": "rgba(228,239,232,0)"}, {"backgroundColor": SOFT}, 0.4, at, ease="power2.out", ir=False)
            v.tw(f"#r{i}c{j}", {"backgroundColor": SOFT}, {"backgroundColor": "rgba(228,239,232,0)"}, 0.4, at + 0.9, ease="power2.out", ir=False)
    v.t += 3.6
    v.end_scene(0.4)

    # ---------------- Ваш город
    v.block("b4", "Ваш город")
    def pp(pid, suf, verb):
        return f'<span class="w" id="{pid}h-w0">Perm<span class="suf">{suf}</span></span> <span class="w" id="{pid}h-w1">{verb}</span>'
    v.scene("s4", '<div class="lines">' + item("p1", pp("p1", "be", "megyek."), "Я еду в Пермь.")
            + item("p2", pp("p2", "ben", "lakom."), "Я живу в Перми.")
            + item("p3", pp("p3", "ből", "jövök."), "Я еду из Перми.") + '</div>')
    v.t += 0.4
    v.narrate("В слове «Пермь» мягкий гласный, поэтому и окончания мягкие.", post=0.5)
    for pid, hu in (("p1", "Permbe megyek."), ("p2", "Permben lakom."), ("p3", "Permből jövök.")):
        v.enter(f"#{pid}", kind="left"); v.t += 0.8
        v.hu(hu, prefix=pid + "h", post=1.4)
    v.end_scene(0.4)

    # ---------------- Проверьте себя
    v.block("b5", "Проверьте себя")
    v.scene("s5", '<div class="quiz"></div>')
    v.narrate("Подумайте, как это сказать по-венгерски. Ответ появится через несколько секунд.", post=0.6)
    v.end_scene(0.2)
    quiz = [("у врача", "orvosnál."), ("в доме", "a házban."), ("Я еду из Перми.", "Permből jövök.")]
    for k, (ru, hu) in enumerate(quiz):
        pid = f"qa{k}"
        v.scene(f"s5q{k}", f'<div class="quiz"><div class="qq" id="qq{k}x">{esc(ru)}</div>{words(pid, hu, cls="qa")}</div>')
        SCR(v, f"вопрос: {ru}")
        v.enter(f"#qq{k}x", kind="fade")
        v.t += 0.6
        v.narrate(f"«{ru.rstrip('.')}»", post=0.2)
        v.ring(GAP_THINK)
        v.enter(f"#{pid}", kind="up")
        SCR(v, f"ответ: {hu}")
        v.t += 0.5
        v.hu(hu, prefix=pid, post=1.6)
        v.end_scene(0.3)

    # ---------------- Итог
    v.block("b6", "Итог")
    eg = ('<div class="egrid"><div></div><div class="h">куда?</div><div class="h">где?</div><div class="h">откуда?</div>'
          '<div class="l">внутрь, внутри</div><div class="c">-<b>ba</b> / -<b>be</b></div><div class="c">-<b>ban</b> / -<b>ben</b></div><div class="c">-<b>ból</b> / -<b>ből</b></div>'
          '<div class="l">на поверхность</div><div class="c">-<b>ra</b> / -<b>re</b></div><div class="c">-<b>n</b></div><div class="c">-<b>ról</b> / -<b>ről</b></div>'
          '<div class="l">к человеку, у него</div><div class="c">-<b>hoz</b> / -<b>hez</b></div><div class="c">-<b>nál</b> / -<b>nél</b></div><div class="c">-<b>tól</b> / -<b>től</b></div></div>')
    pc = '<div class="pcols">' + "".join(
        f'<div class="item"><div class="hu">{h}</div><div class="tr">{esc(r)}</div></div>' for h, r in
        [("Perm<b>be</b> megyek.", "Я еду в Пермь."), ("Perm<b>ben</b> lakom.", "Я живу в Перми."), ("Perm<b>ből</b> jövök.", "Я еду из Перми.")]) + '</div>'
    v.end_card(f'<div class="esec"><div class="eh">Правило</div>{eg}</div><div class="esec" style="margin-bottom:0"><div class="eh">Фразы</div>{pc}</div>')
    SCR(v, "панель: «Правило» с таблицей окончаний, «Фразы» с тремя фразами, перевод под каждой")
    v.narrate("Три вопроса, три окончания. Гласный в окончании подстраивается под слово.", post=3.0)
    v.end_scene(0.8)
    return v

if __name__ == "__main__":
    v = build()
    v.write(f"{ROOT}/hf/v03e")
    v.export_script(f"{ROOT}/video/03-irany-scenario-v5.md", "Hova? Hol? Honnan? Сценарий, версия 5")
