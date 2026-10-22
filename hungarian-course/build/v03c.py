import sys
from lib2 import *

def SCR(v, text):
    v.script.append(("SCREEN", text))

def build(ru_voice):
    v = Video2(3, "03-irany", "Куда? Где? Откуда?", ru_voice=ru_voice)
    v.extra_css = """
.qru { display:grid; grid-template-columns:repeat(3, max-content); column-gap:64px; margin-top:22px; }
.qru div { font-family:'IBM Plex Sans'; font-size:34px; color:var(--muted); opacity:0; }
.lines { position:absolute; left:80px; top:170px; }
.ln { display:grid; grid-template-columns:380px 220px; column-gap:24px; align-items:baseline; margin-bottom:30px; opacity:0; }
.ln .hu { font-size:66px; white-space:nowrap; }
.ln .ru { font-size:30px; white-space:nowrap; }
.wide .ln { grid-template-columns:600px 360px; }
.suf { color:var(--acc); }
.pic { position:absolute; right:80px; top:150px; width:460px; height:400px; }
table.g { border-collapse:collapse; margin-top:70px; }
table.g th { font-family:'IBM Plex Sans'; font-weight:500; font-size:30px; color:var(--muted); text-align:left; padding:6px 30px 14px 0; width:250px; }
table.g th.l { width:300px; }
table.g td { font-family:'IBM Plex Mono'; font-weight:500; font-size:32px; color:var(--ink); padding:16px 30px 16px 0; border-top:1px solid var(--border); white-space:nowrap; }
table.g td.l { font-family:'IBM Plex Sans'; font-weight:400; font-size:28px; color:var(--muted); }
table.g td span { border-radius:6px; padding:0 .15em; margin:0 -.15em; }
table.g tr { opacity:0; }
.quiz { position:absolute; left:80px; top:220px; right:80px; }
.qq { font-family:'IBM Plex Sans'; font-size:46px; color:var(--muted); opacity:0; }
.qa { font-family:'Source Serif 4', serif; font-weight:600; font-size:84px; color:var(--ink); margin-top:28px; opacity:0; }
.qa .w { border-radius:8px; padding:0 .08em; }
"""
    # ---------------- 1. Три вопроса (заход, без заголовка: сам экран и есть заголовок)
    v.script.append(("SCENE", "Три вопроса"))
    v.scene("s1", '<div style="margin-top:150px">' + words("s1t", "Hova? Hol? Honnan?", cls="title")
            + '<div class="qru"><div id="q1">куда?</div><div id="q2">где?</div><div id="q3">откуда?</div></div></div>')
    SCR(v, "крупно Hova? Hol? Honnan?, под каждым перевод")
    v.enter("#s1t", kind="fade")
    v.t += 0.8
    v.narrate("В венгерском нет предлогов «в», «на» и «из». Их заменяет окончание, а какое именно, зависит от вопроса: куда, где или откуда.")
    v.enter("#q1", at=v.t); v.enter("#q2", at=v.t + 0.3); v.enter("#q3", at=v.t + 0.6)
    v.t += 1.0
    v.narrate("Сначала послушайте, потом повторяйте вслух в паузах.", post=0.6)
    v.drill("Hova? Hol? Honnan?", prefix="s1t")
    v.end_scene(0.4)

    # ---------------- 2. Образ
    v.block("b2", "Образ: дом")
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
    steps = [("Если я иду в дом, это вопрос «куда». Окончание выделено зелёным.", "h1", "a házba.", "стрелка в дом"),
             ("Если я уже нахожусь в доме, это вопрос «где».", "h2", "a házban.", "точка внутри дома"),
             ("А если я выхожу из дома, это вопрос «откуда».", "h3", "a házból.", "стрелка из дома")]
    for k, (ru, pid, hu, scr) in enumerate(steps):
        v.narrate(ru)
        v.enter(f"#{pid}", kind="left")
        if k == 0:
            v.draw("#ar1", at=v.t + 0.1, length=200); v.enter("#ah1", at=v.t + 0.7, kind="fade", dur=0.3)
        elif k == 1:
            v.tw("#dot", {"opacity": 0, "scale": 0.2, "transformOrigin": "50% 50%"}, {"opacity": 1, "scale": 1}, 0.6, v.t + 0.2)
        else:
            v.draw("#ar2", at=v.t + 0.1, length=200); v.enter("#ah2", at=v.t + 0.7, kind="fade", dur=0.3)
        SCR(v, f"{scr}, строка {hu}")
        v.t += 1.2
        v.drill(hu, spans=[f"#{pid}a", f"#{pid}b"])
    for i, s in enumerate(("#h1s", "#h2s", "#h3s")):
        v.tw(s, {"backgroundColor": "rgba(228,239,232,0)"}, {"backgroundColor": SOFT}, 0.4, v.t + 0.3 * i, ease="power2.out")
    v.narrate("Все три окончания начинаются на одну букву. Это пространство внутри.", post=0.8)
    v.end_scene(0.4)

    # ---------------- 3. Вся система
    v.block("b3", "Вся система")
    rows = [("внутрь / внутри", ["házba", "házban", "házból"]),
            ("на поверхность", ["asztalra", "asztalon", "asztalról"]),
            ("к человеку / у него", ["orvoshoz", "orvosnál", "orvostól"])]
    t = '<table class="g"><tr id="th" style="opacity:1"><th class="l"></th><th>куда?</th><th>где?</th><th>откуда?</th></tr>'
    for i, (lab, cells) in enumerate(rows):
        t += f'<tr id="r{i}"><td class="l">{esc(lab)}</td>' + "".join(
            f'<td><span id="r{i}c{j}">{esc(c)}</span></td>' for j, c in enumerate(cells)) + '</tr>'
    t += '</table>'
    v.scene("s3", t)
    SCR(v, "таблица 3×3, строки появляются по одной")
    v.t += 0.6
    intro = ["Таких групп три. Первая вам уже знакома.",
             "Вторая про поверхность, как русское «на». Слово «стол»: на стол, на столе, со стола.",
             "Третья про людей: к врачу, у врача, от врача."]
    for i, (lab, cells) in enumerate(rows):
        v.narrate(intro[i])
        v.enter(f"#r{i}", kind="fade"); v.t += 0.8
        sp = [f"#r{i}c{j}" for j in range(3)]
        if i == 0:
            for w, s_ in zip(cells, sp):
                v.hu(w + ".", spans=[s_], post=1.2)
        else:
            v.drill_words([c for c in cells], sp)
    v.narrate("Колонки всегда одинаковы: куда, где и откуда.")
    for j in range(3):
        at = v.t + 1.0 * j
        for i in range(3):
            v.tw(f"#r{i}c{j}", {"backgroundColor": "rgba(228,239,232,0)"}, {"backgroundColor": SOFT}, 0.4, at, ease="power2.out", ir=False)
            v.tw(f"#r{i}c{j}", {"backgroundColor": SOFT}, {"backgroundColor": "rgba(228,239,232,0)"}, 0.4, at + 0.9, ease="power2.out", ir=False)
    v.t += 3.4
    v.end_scene(0.4)

    # ---------------- 4. Ваш город
    v.block("b4", "Ваш город")
    def ln2(pid, text, ru):
        return f'<div class="ln" id="{pid}">{words(pid + "h", text)}<div class="ru">{esc(ru)}</div></div>'
    v.scene("s4", '<div class="wide lines">' + ln2("p1", "Permbe megyek.", "еду в Пермь")
            + ln2("p2", "Permben lakom.", "живу в Перми") + ln2("p3", "Permből jövök.", "еду из Перми") + '</div>')
    v.t += 0.4
    v.narrate("В слове «Пермь» мягкий гласный, поэтому и окончания мягкие.")
    for pid, ru, hu in (("p1", "Я еду в Пермь.", "Permbe megyek."), ("p2", "Я живу в Перми.", "Permben lakom."),
                        ("p3", "Я еду из Перми.", "Permből jövök.")):
        v.narrate(ru, post=0.3)
        v.enter(f"#{pid}", kind="left"); v.t += 0.8
        v.drill(hu, prefix=pid + "h")
    v.end_scene(0.4)

    # ---------------- 5. Проверьте себя
    v.block("b5", "Проверьте себя")
    v.scene("s5", '<div class="quiz"></div>')
    v.narrate("Я говорю по-русски, вы отвечаете вслух по-венгерски. Ответ появится после паузы.", post=0.6)
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
    v.block("b6", "Итог")
    eg = ('<div class="egrid"><div></div><div class="h">куда?</div><div class="h">где?</div><div class="h">откуда?</div>'
          '<div class="l">внутрь / внутри</div><div class="c">-<b>ba</b> / -<b>be</b></div><div class="c">-<b>ban</b> / -<b>ben</b></div><div class="c">-<b>ból</b> / -<b>ből</b></div>'
          '<div class="l">на поверхность</div><div class="c">-<b>ra</b> / -<b>re</b></div><div class="c">-<b>n</b></div><div class="c">-<b>ról</b> / -<b>ről</b></div>'
          '<div class="l">к человеку / у него</div><div class="c">-<b>hoz</b> / -<b>hez</b></div><div class="c">-<b>nál</b> / -<b>nél</b></div><div class="c">-<b>tól</b> / -<b>től</b></div></div>')
    pg = ('<div class="pgrid"><div class="ph">Perm<b>be</b> megyek.</div><div class="pr">Я еду в Пермь.</div>'
          '<div class="ph">Perm<b>ben</b> lakom.</div><div class="pr">Я живу в Перми.</div>'
          '<div class="ph">Perm<b>ből</b> jövök.</div><div class="pr">Я еду из Перми.</div></div>')
    v.end_card(f'<div class="esec"><div class="eh">Правило</div>{eg}</div><div class="esec" style="margin-bottom:0"><div class="eh">Фразы</div>{pg}</div>')
    SCR(v, "панель: «Правило» с таблицей окончаний, «Фразы» с тремя фразами и переводом")
    v.narrate("Три вопроса, три окончания. Повторите фразы вместе с диктором.", post=0.4)
    v.hu("Permbe megyek. Permben lakom. Permből jövök.", post=0.3)
    v.ring(5.0)
    v.end_scene(0.8)
    return v

if __name__ == "__main__":
    tag, voice = sys.argv[1], sys.argv[2]
    v = build(voice)
    v.write(f"{ROOT}/hf/v03c-{tag}")
    v.export_script(f"{ROOT}/video/03-irany-scenario-v3.md", "Hova? Hol? Honnan? Сценарий, версия 3")
