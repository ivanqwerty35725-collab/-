from lib2 import *

def S(v, title):            # отметка сцены для экспорта сценария
    v.script.append(("SCENE", title))

def SCR(v, text):
    v.script.append(("SCREEN", text))

def build():
    v = Video2(3, "03-irany", "Куда? Где? Откуда?")
    v.extra_css = """
.qru { display:flex; gap:64px; margin-top:22px; }
.qru div { font-family:'IBM Plex Sans'; font-size:34px; color:var(--muted); opacity:0; }
.lines { position:absolute; left:80px; top:170px; width:640px; }
.ln { display:flex; align-items:baseline; gap:28px; margin-bottom:30px; opacity:0; }
.ln .hu { font-size:66px; white-space:nowrap; }
.ln .ru { font-size:30px; white-space:nowrap; }
.suf { color:var(--acc); }
.pic { position:absolute; right:80px; top:150px; width:460px; height:400px; }
table.g { border-collapse:collapse; margin-top:70px; }
table.g th { font-family:'IBM Plex Sans'; font-weight:500; font-size:30px; color:var(--muted); text-align:left; padding:6px 30px 14px 0; }
table.g td { font-family:'IBM Plex Mono'; font-weight:500; font-size:32px; color:var(--ink); padding:16px 30px 16px 0; border-top:1px solid var(--border); white-space:nowrap; }
table.g td.l { font-family:'IBM Plex Sans'; font-weight:400; font-size:28px; color:var(--muted); width:250px; }
table.g td span { border-radius:6px; padding:0 .15em; margin:0 -.15em; }
table.g tr { opacity:0; }
.sent .ln .hu { font-size:68px; }
.sent .ln .ru { width:340px; }
.quiz { position:absolute; left:80px; top:220px; right:80px; }
.qq { font-family:'IBM Plex Sans'; font-size:46px; color:var(--muted); opacity:0; }
.qa { font-family:'Source Serif 4', serif; font-weight:600; font-size:84px; color:var(--ink); margin-top:28px; opacity:0; }
.qa .w { border-radius:8px; padding:0 .08em; }
"""
    # ---------------- 1. Заход
    S(v, "1. Заход")
    v.scene("s1", '<div style="margin-top:150px">' + words("s1t", "Hova? Hol? Honnan?", cls="title")
            + '<div class="qru"><div id="q1">куда?</div><div id="q2">где?</div><div id="q3">откуда?</div></div></div>')
    SCR(v, "крупно Hova? Hol? Honnan?")
    v.enter("#s1t", kind="fade")
    v.t += 0.8
    v.narrate("В венгерском нет предлогов «в», «на» и «из». Их заменяет окончание, а какое именно, зависит от вопроса: куда, где или откуда.")
    v.enter("#q1", at=v.t); v.enter("#q2", at=v.t + 0.3); v.enter("#q3", at=v.t + 0.6)
    SCR(v, "под ними перевод: куда? где? откуда?")
    v.t += 1.0
    v.drill("Hova? Hol? Honnan?", prefix="s1t")
    v.narrate("В паузах повторяйте вслух.", post=0.6)
    v.end_scene(0.4)

    # ---------------- 2. Образ: дом
    S(v, "2. Правило через образ: дом")
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
    def ln(pid, root, suf, ru):
        return (f'<div class="ln" id="{pid}"><div class="hu"><span class="w" id="{pid}a">a</span> '
                f'<span class="w" id="{pid}b">{root}<span class="suf" id="{pid}s">{suf}</span></span></div>'
                f'<div class="ru">{esc(ru)}</div></div>')
    v.scene("s2", '<div class="lines">' + ln("h1", "ház", "ba", "в дом") + ln("h2", "ház", "ban", "в доме")
            + ln("h3", "ház", "ból", "из дома") + '</div>' + svg)
    for sel in ("#wall", "#roof", "#door"):
        v.enter(sel, kind="fade"); v.t += 0.2
    SCR(v, "справа рисуется дом")
    v.t += 0.4
    v.narrate("Возьмём простое слово: дом. По-венгерски оно звучит так.")
    v.hu("ház.", post=1.2)
    v.narrate("Если я иду в дом, это вопрос «куда». Посмотрите на зелёное окончание.")
    v.enter("#h1", kind="left"); v.draw("#ar1", at=v.t + 0.1, length=200); v.enter("#ah1", at=v.t + 0.7, kind="fade", dur=0.3)
    SCR(v, "стрелка в дом, строка a házba · в дом")
    v.t += 1.2
    v.drill("a házba.", spans=["#h1a", "#h1b"])
    v.narrate("Если я уже нахожусь в доме, это вопрос «где».")
    v.enter("#h2", kind="left")
    v.tw("#dot", {"opacity": 0, "scale": 0.2, "transformOrigin": "50% 50%"}, {"opacity": 1, "scale": 1}, 0.6, v.t + 0.2)
    SCR(v, "точка внутри дома, строка a házban · в доме")
    v.t += 1.2
    v.drill("a házban.", spans=["#h2a", "#h2b"])
    v.narrate("А если я выхожу из дома, это вопрос «откуда».")
    v.enter("#h3", kind="left"); v.draw("#ar2", at=v.t + 0.1, length=200); v.enter("#ah2", at=v.t + 0.7, kind="fade", dur=0.3)
    SCR(v, "стрелка из дома, строка a házból · из дома")
    v.t += 1.2
    v.drill("a házból.", spans=["#h3a", "#h3b"])
    for i, s in enumerate(("#h1s", "#h2s", "#h3s")):
        v.tw(s, {"backgroundColor": "rgba(228,239,232,0)"}, {"backgroundColor": SOFT}, 0.4, v.t + 0.3 * i, ease="power2.out")
    v.narrate("Все три окончания начинаются на одну букву. Это пространство внутри.", post=0.8)
    v.end_scene(0.4)

    # ---------------- 3. Система: таблица 3×3
    S(v, "3. Система: три группы")
    rows = [("внутрь / внутри", ["házba", "házban", "házból"], "házba, házban, házból."),
            ("на поверхность", ["asztalra", "asztalon", "asztalról"], "asztalra, asztalon, asztalról."),
            ("к кому-то / у кого-то", ["orvoshoz", "orvosnál", "orvostól"], "orvoshoz, orvosnál, orvostól.")]
    t = '<table class="g"><tr id="th" style="opacity:1"><th></th><th id="c0">куда?</th><th id="c1">где?</th><th id="c2">откуда?</th></tr>'
    for i, (lab, cells, _) in enumerate(rows):
        t += f'<tr id="r{i}"><td class="l">{esc(lab)}</td>' + "".join(
            f'<td><span id="r{i}c{j}">{esc(c)}</span></td>' for j, c in enumerate(cells)) + '</tr>'
    t += '</table>'
    v.scene("s3", t)
    SCR(v, "таблица 3×3, строки появляются по одной")
    v.t += 0.6
    intro = ["Таких групп три. Первая вам уже знакома.",
             "Вторая про поверхность, как русское «на». Слово «стол»: на стол, на столе, со стола.",
             "Третья про людей: к врачу, у врача, от врача."]
    for i, (lab, cells, spoken) in enumerate(rows):
        v.narrate(intro[i])
        v.enter(f"#r{i}", kind="fade"); v.t += 0.8
        if i == 0:
            v.hu(spoken, spans=[f"#r{i}c{j}" for j in range(3)], post=1.0)
        else:
            v.drill(spoken, spans=[f"#r{i}c{j}" for j in range(3)])
    v.narrate("Колонки всегда одинаковы: куда, где и откуда.")
    for j in range(3):
        at = v.t + 0.9 * j
        for i in range(3):
            v.tw(f"#r{i}c{j}", {"backgroundColor": "rgba(228,239,232,0)"}, {"backgroundColor": SOFT}, 0.4, at, ease="power2.out", ir=False)
            v.tw(f"#r{i}c{j}", {"backgroundColor": SOFT}, {"backgroundColor": "rgba(228,239,232,0)"}, 0.4, at + 0.8, ease="power2.out", ir=False)
    v.t += 3.2
    v.ring(GAP_SPEAK)
    v.end_scene(0.4)

    # ---------------- 4. Применение: Пермь
    S(v, "4. Применение: мой город")
    def ln2(pid, text, ru):
        return f'<div class="ln" id="{pid}">{words(pid + "h", text)}<div class="ru">{esc(ru)}</div></div>'
    v.scene("s4", '<div class="sent lines">' + ln2("p1", "Permbe megyek.", "еду в Пермь")
            + ln2("p2", "Permben lakom.", "живу в Перми") + ln2("p3", "Permből jövök.", "еду из Перми") + '</div>')
    v.t += 0.4
    v.narrate("Теперь ваш город. В слове «Пермь» мягкий гласный, поэтому и окончания мягкие.")
    for pid, ru, hu in (("p1", "Я еду в Пермь.", "Permbe megyek."), ("p2", "Я живу в Перми.", "Permben lakom."),
                        ("p3", "Я еду из Перми.", "Permből jövök.")):
        v.narrate(ru, post=0.3)
        v.enter(f"#{pid}", kind="left"); v.t += 0.8
        v.drill(hu, prefix=pid + "h")
    v.end_scene(0.4)

    # ---------------- 5. Проверь себя
    S(v, "5. Проверь себя")
    v.scene("s5", '<div class="quiz"><div class="qq" id="qq0"></div></div>')
    v.narrate("Проверьте себя. Я говорю по-русски, вы отвечаете вслух по-венгерски.", post=0.6)
    v.end_scene(0.2)
    quiz = [("у врача", "orvosnál."), ("в доме", "a házban."), ("Я еду из Перми.", "Permből jövök.")]
    for k, (ru, hu) in enumerate(quiz):
        pid = f"qa{k}"
        v.scene(f"s5q{k}", f'<div class="quiz"><div class="qq" id="qq{k}x">{esc(ru)}</div>{words(pid, hu, cls="qa")}</div>')
        SCR(v, f"вопрос: {ru}")
        v.enter(f"#qq{k}x", kind="fade")
        v.t += 0.6
        v.narrate(ru, post=0.2)
        v.ring(GAP_THINK)
        v.enter(f"#{pid}", kind="up")
        SCR(v, f"ответ: {hu}")
        v.t += 0.5
        v.hu(hu, prefix=pid, post=1.6)
        v.end_scene(0.3)

    # ---------------- 6. Итог
    S(v, "6. Итог")
    v.end_card(["куда? <b>-ba / -be</b> · где? <b>-ban / -ben</b> · откуда? <b>-ból / -ből</b>",
                "Perm<b>be</b> megyek · Perm<b>ben</b> lakom · Perm<b>ből</b> jövök"])
    SCR(v, "карточка с правилом и тремя фразами")
    v.narrate("Итак: три вопроса, три окончания. Повторите вместе с диктором.", post=0.4)
    v.hu("Permbe megyek. Permben lakom. Permből jövök.", post=0.3)
    v.ring(4.0)
    v.end_scene(0.8)
    return v

if __name__ == "__main__":
    v = build()
    v.write(f"{ROOT}/hf/v03b")
    v.export_script(f"{ROOT}/video/03-irany-scenario.md", "Hova? Hol? Honnan? Сценарий")
