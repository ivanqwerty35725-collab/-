import sys
from lib2 import *

DIRS = {"to": ("#2D6A4F", "#E4EFE8"), "at": ("#3B6E9B", "#E3ECF4"), "from": ("#9A6B1F", "#F6ECD8")}
ORDER = ["to", "at", "from"]

def SCR(v, text):
    v.script.append(("SCREEN", text))

def picto(pid, kind, w=120, h=84):
    c, soft = DIRS[kind]
    box = f'<rect x="36" y="14" width="56" height="56" rx="10" fill="{soft}" stroke="{c}" stroke-width="3"/>'
    if kind == "to":
        mark = (f'<path id="{pid}l" d="M 4 42 L 58 42" stroke="{c}" stroke-width="4" stroke-linecap="round" fill="none"/>'
                f'<polyline id="{pid}h" points="46,32 60,42 46,52" stroke="{c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    elif kind == "at":
        mark = f'<circle id="{pid}l" cx="64" cy="42" r="10" fill="{c}"/>'
    else:
        mark = (f'<path id="{pid}l" d="M 66 42 L 114 42" stroke="{c}" stroke-width="4" stroke-linecap="round" fill="none"/>'
                f'<polyline id="{pid}h" points="102,32 116,42 102,52" stroke="{c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    return f'<svg class="pc" id="{pid}" viewBox="0 0 120 84" width="{w}" height="{h}" data-layout-ignore>{box}{mark}</svg>'

def hus(pid, tokens):
    """tokens: str или (корень, окончание, kind). Возвращает HTML со span-ами {pid}-w{i}."""
    out = []
    for i, t in enumerate(tokens):
        if isinstance(t, tuple):
            r, s, k = t
            out.append(f'<span class="w" id="{pid}-w{i}">{r}<span class="suf" style="color:{DIRS[k][0]}">{s}</span></span>')
        else:
            out.append(f'<span class="w" id="{pid}-w{i}">{t}</span>')
    return " ".join(out)

def conn(pid, kind, h=46):
    c = DIRS[kind][0]
    return (f'<svg class="cn" viewBox="0 0 20 {h}" width="20" height="{h}" data-layout-ignore>'
            f'<path id="{pid}" d="M 10 2 L 10 {h-6}" stroke="{c}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0"/>'
            f'<polyline id="{pid}h" points="4,{h-12} 10,{h-4} 16,{h-12}" stroke="{c}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0"/></svg>')

def head(text):
    return f'<div class="hd">{esc(text)}</div>'

def build(ru_voice="ru-RU-DmitryNeural"):
    v = Video2(3, "03-irany", "Куда? Где? Откуда?", ru_voice=ru_voice)
    v.extra_css = """
.hd { position:absolute; left:80px; top:56px; font-family:'Source Serif 4', serif; font-weight:600; font-size:42px; color:var(--ink); }
.hu .w, .w { border-radius:8px; padding:0 .06em; }
.ru2 { font-family:'Source Serif 4', serif; font-style:italic; font-weight:400; color:var(--ru); }
.cols { position:absolute; left:80px; right:80px; top:165px; display:grid; grid-template-columns:repeat(3, 1fr); text-align:center; }
.col { display:flex; flex-direction:column; align-items:center; }
.col .pc, .col .big, .col .ru2 { opacity:0; }
.big { font-family:'Source Serif 4', serif; font-weight:700; font-size:100px; line-height:1.1; margin-top:26px; }
.col .ru2 { font-size:54px; margin-top:6px; }
.cn { margin-top:10px; }
.mid { font-family:'Source Serif 4', serif; font-weight:600; font-size:42px; line-height:1.15; color:var(--ink); margin-top:30px; white-space:nowrap; }
.col .ru2.sm { font-size:32px; }
.col .mid { opacity:0; }
.rows { position:absolute; left:80px; top:170px; width:560px; }
.row { display:grid; grid-template-columns:116px 1fr; align-items:center; margin-bottom:48px; opacity:0; }
.row .hu2 { font-family:'Source Serif 4', serif; font-weight:600; font-size:68px; line-height:1.1; color:var(--ink); white-space:nowrap; }
.row .ru2 { font-size:34px; }
.house { position:absolute; left:610px; top:130px; }
.map { position:absolute; left:640px; top:140px; }
.row .hu2.pm { font-size:56px; }
table.g { position:absolute; left:80px; top:140px; border-collapse:collapse; }
table.g th { width:280px; padding:0 0 14px 0; text-align:left; vertical-align:bottom; }
table.g th.l { width:280px; }
table.g th .pc { display:block; margin-left:-6px; }
table.g th .ru2 { font-size:34px; font-weight:500; }
table.g td { font-family:'Source Serif 4', serif; font-weight:600; font-size:50px; color:var(--ink); padding:24px 0; border-top:1px solid var(--border); white-space:nowrap; }
table.g td.l { font-style:italic; font-weight:400; font-size:31px; color:var(--ru); }
table.g tr.r { opacity:0; }
table.g td span.w { border-radius:6px; }
.quiz { position:absolute; left:80px; right:80px; top:180px; display:flex; flex-direction:column; align-items:center; text-align:center; }
.quiz .ru2 { font-size:66px; color:var(--ink); font-weight:500; opacity:0; }
.ans { display:flex; align-items:center; gap:24px; margin-top:60px; opacity:0; }
.ans .hu2 { font-family:'Source Serif 4', serif; font-weight:600; font-size:88px; color:var(--ink); }
.sum { position:absolute; left:80px; top:140px; display:grid; grid-template-columns:230px repeat(3, 296px); row-gap:6px; align-items:end; opacity:0; }
.sum .q { display:flex; flex-direction:column; }
.sum .q .ru2 { font-size:30px; font-weight:500; }
.sum .l { font-family:'Source Serif 4', serif; font-style:italic; font-size:28px; color:var(--ru); padding:16px 0; border-top:1px solid var(--border); }
.sum .c { font-family:'Source Serif 4', serif; font-weight:600; font-size:40px; color:var(--ink); padding:10px 0; border-top:1px solid var(--border); }
.sum .p { padding-top:34px; }
.sum .p .hu3 { font-family:'Source Serif 4', serif; font-weight:600; font-size:30px; color:var(--ink); white-space:nowrap; }
.sum .p .ru2 { font-size:26px; }
"""
    # ================= 1. Три вопроса
    v.script.append(("SCENE", "Три главных вопроса"))
    words1 = [("Hova?", "куда?"), ("Hol?", "где?"), ("Honnan?", "откуда?")]
    cols = ""
    for i, (hu, ru) in enumerate(words1):
        k = ORDER[i]
        cols += (f'<div class="col">{picto(f"pc{i}", k, 156, 109)}<div class="big" id="b{i}" style="color:{DIRS[k][0]}">'
                 f'<span class="w" id="b{i}w">{hu}</span></div>{conn(f"cn{i}", k, 64)}<div class="ru2" id="r{i}">{ru}</div></div>')
    v.scene("s1", head("Три главных вопроса") + f'<div class="cols">{cols}</div>')
    v.t += 0.4
    v.narrate("В русском языке мы говорим «в доме», «на столе», «из дома». Сначала идёт предлог, а за ним слово.")
    v.narrate("В венгерском всё устроено иначе. Роль предлога играет окончание, и оно приклеивается к концу слова.")
    v.narrate("Какое окончание выбрать, подсказывает вопрос. Таких вопросов три.", post=0.4)
    for i in range(3):
        v.enter(f"#pc{i}", kind="fade"); v.enter(f"#b{i}", at=v.t + 0.2, kind="up")
        v.t += 0.7
        v.hu(words1[i][0], spans=[f"#b{i}w"], post=0.2, hl="bg")
        v.draw(f"#cn{i}", length=60); v.enter(f"#cn{i}h", at=v.t + 0.5, kind="fade", dur=0.2)
        v.enter(f"#r{i}", at=v.t + 0.5, kind="fade")
        v.t += 1.6
    SCR(v, "три колонки: пиктограмма, венгерский вопрос в своём цвете, стрелка вниз, перевод курсивом")
    v.narrate("Запомните цвета. Зелёным будет всё, что отвечает на вопрос «куда?», синим всё, что отвечает на вопрос «где?», а коричневым ответы на вопрос «откуда?».", post=1.2)
    v.end_scene(0.4)

    # ================= 2. Дом
    v.script.append(("SCENE", "Представим обычный дом"))
    g, b, o = DIRS["to"][0], DIRS["at"][0], DIRS["from"][0]
    house = f'''<svg class="house" viewBox="0 0 540 430" width="620" height="494" data-layout-ignore>
<line id="gr" x1="0" y1="400" x2="540" y2="400" stroke="{BORDER}" stroke-width="3" stroke-linecap="round" opacity="0"/>
<g id="hs" opacity="0">
<rect x="338" y="96" width="30" height="72" fill="#EEF1EC" stroke="{INK}" stroke-width="3"/>
<rect x="150" y="190" width="240" height="210" fill="#FBFBF7" stroke="{INK}" stroke-width="3"/>
<polygon points="122,192 270,82 418,192" fill="#DCE6DF" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>
<rect x="174" y="224" width="62" height="56" rx="4" fill="#EAF1F6" stroke="{INK}" stroke-width="2.5"/>
<line x1="205" y1="224" x2="205" y2="280" stroke="{INK}" stroke-width="2"/><line x1="174" y1="252" x2="236" y2="252" stroke="{INK}" stroke-width="2"/>
<rect x="304" y="224" width="62" height="56" rx="4" fill="#EAF1F6" stroke="{INK}" stroke-width="2.5"/>
<line x1="335" y1="224" x2="335" y2="280" stroke="{INK}" stroke-width="2"/><line x1="304" y1="252" x2="366" y2="252" stroke="{INK}" stroke-width="2"/>
<path d="M 245 400 V 330 A 25 25 0 0 1 295 330 V 400 Z" fill="#F1E9DB" stroke="{INK}" stroke-width="2.5"/>
<circle cx="286" cy="368" r="3.5" fill="{INK}"/>
</g>
<path id="a1" d="M 8 352 L 252 352" stroke="{g}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0"/>
<polyline id="a1h" points="236,340 254,352 236,364" stroke="{g}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
<circle id="d1" cx="270" cy="252" r="24" fill="{DIRS['at'][1]}" opacity="0"/>
<circle id="d2" cx="270" cy="252" r="11" fill="{b}" opacity="0"/>
<path id="a2" d="M 288 378 L 528 378" stroke="{o}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0"/>
<polyline id="a2h" points="512,366 530,378 512,390" stroke="{o}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
</svg>'''
    rows = ""
    data2 = [("to", "ba", "в дом"), ("at", "ban", "в доме"), ("from", "ból", "из дома")]
    for i, (k, suf, ru) in enumerate(data2):
        rows += (f'<div class="row" id="h{i}">{picto(f"hp{i}", k, 96, 68)}<div><div class="hu2">{hus(f"hh{i}", ["a", ("ház", suf, k)])}</div>'
                 f'<div class="ru2">{ru}</div></div></div>')
    v.scene("s2", head("Представим обычный дом") + f'<div class="rows">{rows}</div>' + house)
    v.enter("#gr", kind="fade"); v.enter("#hs", at=v.t + 0.2, kind="fade")
    v.t += 1.0
    SCR(v, "справа дом с окнами, трубой и дверью")
    v.narrate("Представим обычный дом. По-венгерски он называется так.")
    v.hu("ház.", post=1.0)
    steps = [("Я подхожу к дому и захожу внутрь. Это движение отвечает на вопрос «куда?», поэтому к слову добавляется зелёное окончание.", "a házba."),
             ("Вот я уже внутри и никуда не иду. Это вопрос «где?», и окончание теперь синее.", "a házban."),
             ("А теперь я выхожу на улицу. Это вопрос «откуда?».", "a házból.")]
    for i, (ru, hu) in enumerate(steps):
        v.narrate(ru, post=0.3)
        v.enter(f"#h{i}", kind="left")
        if i == 0:
            v.draw("#a1", at=v.t + 0.1, length=260); v.enter("#a1h", at=v.t + 0.7, kind="fade", dur=0.3)
        elif i == 1:
            v.tw("#d1", {"opacity": 0, "scale": 0.3, "transformOrigin": "50% 50%"}, {"opacity": 1, "scale": 1}, 0.6, v.t + 0.1)
            v.tw("#d2", {"opacity": 0, "scale": 0.3, "transformOrigin": "50% 50%"}, {"opacity": 1, "scale": 1}, 0.6, v.t + 0.3)
        else:
            v.draw("#a2", at=v.t + 0.1, length=260); v.enter("#a2h", at=v.t + 0.7, kind="fade", dur=0.3)
        v.t += 1.1
        v.hu(hu, spans=[f"#hh{i}-w0", f"#hh{i}-w1"], post=1.2)
    v.narrate("Заметьте, что все три окончания начинаются с одной и той же буквы. Именно она подсказывает, что речь идёт о пространстве внутри дома.", post=1.0)
    v.end_scene(0.4)

    # ================= 3. Таблица
    v.script.append(("SCENE", "Так устроена вся система"))
    rowsd = [("внутрь, внутри", "ház", ["ba", "ban", "ból"]),
             ("на поверхность", "asztal", ["ra", "on", "ról"]),
             ("к человеку, у него", "orvos", ["hoz", "nál", "tól"])]
    t = '<table class="g"><tr><th class="l"></th>' + "".join(
        f'<th>{picto(f"tp{j}", k, 96, 68)}<span class="ru2" style="color:{DIRS[k][0]}">{q}</span></th>'
        for j, (k, q) in enumerate(zip(ORDER, ["куда?", "где?", "откуда?"]))) + '</tr>'
    for i, (lab, root, sufs) in enumerate(rowsd):
        t += f'<tr class="r" id="tr{i}"><td class="l">{esc(lab)}</td>' + "".join(
            f'<td>{hus(f"t{i}{j}", [(root, s, ORDER[j])])}</td>' for j, s in enumerate(sufs)) + '</tr>'
    t += '</table>'
    v.scene("s3", head("Так устроена вся система") + t)
    v.t += 0.6
    intro = ["Таких троек в венгерском три, и устроены они одинаково. Первую вы только что видели: она нужна, когда речь о том, что внутри.",
             "Вторая тройка про поверхность, как наше «на». Например: «на стол», «на столе», «со стола».",
             "А третья нужна, когда мы говорим о человеке: «к врачу», «у врача», «от врача»."]
    for i, (lab, root, sufs) in enumerate(rowsd):
        v.narrate(intro[i], post=0.4)
        v.enter(f"#tr{i}", kind="fade"); v.t += 0.8
        for j, s in enumerate(sufs):
            v.hu(root + s + ".", spans=[f"#t{i}{j}-w0"], post=1.0)
        v.t += 0.4
    v.narrate("Колонки везде одни и те же: слева движение куда-то, посередине место, а справа движение откуда-то.", post=0.2)
    for j in range(3):
        at = v.t + 1.0 * j
        for i in range(3):
            v.tw(f"#t{i}{j}-w0", {"backgroundColor": "rgba(255,255,255,0)"}, {"backgroundColor": DIRS[ORDER[j]][1]}, 0.4, at, ease="power2.out", ir=False)
            v.tw(f"#t{i}{j}-w0", {"backgroundColor": DIRS[ORDER[j]][1]}, {"backgroundColor": "rgba(255,255,255,0)"}, 0.4, at + 0.9, ease="power2.out", ir=False)
    v.t += 3.6
    v.end_scene(0.4)

    # ================= 4. Пермь
    v.script.append(("SCENE", "Теперь про ваш город"))
    data4 = [("be", "megyek.", "Я еду в Пермь."), ("ben", "lakom.", "Я живу в Перми."), ("ből", "jövök.", "Я еду из Перми.")]
    rows = ""
    for i, (suf, verb, ru) in enumerate(data4):
        k = ORDER[i]
        rows += (f'<div class="row" id="m{i}">{picto(f"pp{i}", k, 96, 68)}<div><div class="hu2 pm">{hus(f"mm{i}", [("Perm", suf, k), verb])}</div>'
                 f'<div class="ru2">{ru}</div></div></div>')
    g, b, o = DIRS["to"][0], DIRS["at"][0], DIRS["from"][0]
    mp = f'''<svg class="map" viewBox="0 0 540 430" width="560" height="446" data-layout-ignore>
<path id="kama" d="M 300 0 C 280 80 360 130 330 200 C 300 270 210 300 230 430" fill="none" stroke="#CFE0EC" stroke-width="26" stroke-linecap="round" opacity="0"/>
<g id="city" opacity="0">
<circle cx="250" cy="210" r="70" fill="#FBFBF7" stroke="{INK}" stroke-width="3"/>
<rect x="212" y="200" width="18" height="34" fill="#E6EAE4" stroke="{INK}" stroke-width="2"/>
<rect x="234" y="182" width="22" height="52" fill="#E6EAE4" stroke="{INK}" stroke-width="2"/>
<rect x="260" y="194" width="16" height="40" fill="#E6EAE4" stroke="{INK}" stroke-width="2"/>
<rect x="280" y="206" width="14" height="28" fill="#E6EAE4" stroke="{INK}" stroke-width="2"/>
<line x1="204" y1="234" x2="300" y2="234" stroke="{INK}" stroke-width="2"/>
<text x="250" y="266" text-anchor="middle" font-family="'Source Serif 4', serif" font-weight="600" font-size="24" fill="{INK}">Perm</text>
</g>
<path id="c1" d="M 10 150 C 80 150 130 170 186 196" stroke="{g}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0"/>
<polyline id="c1h" points="168,182 188,197 166,202" stroke="{g}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
<circle id="c2a" cx="250" cy="210" r="34" fill="{DIRS['at'][1]}" opacity="0"/>
<circle id="c2b" cx="250" cy="162" r="11" fill="{b}" opacity="0"/>
<path id="c3" d="M 316 232 C 380 262 440 280 528 280" stroke="{o}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0"/>
<polyline id="c3h" points="512,268 530,280 512,292" stroke="{o}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
</svg>'''
    v.scene("s4", head("Теперь про ваш город") + f'<div class="rows">{rows}</div>' + mp)
    v.enter("#kama", kind="fade"); v.enter("#city", at=v.t + 0.3, kind="fade")
    v.t += 1.0
    SCR(v, "справа схема: река Кама и город Perm, стрелки тех же цветов")
    v.narrate("Теперь попробуем на вашем городе. В слове «Пермь» гласный мягкий, поэтому и окончания берутся в мягком варианте.", post=0.5)
    for i, (suf, verb, ru) in enumerate(data4):
        v.narrate(ru, post=0.2)
        v.enter(f"#m{i}", kind="left")
        if i == 0:
            v.draw("#c1", at=v.t + 0.1, length=220); v.enter("#c1h", at=v.t + 0.7, kind="fade", dur=0.3)
        elif i == 1:
            v.tw("#c2b", {"opacity": 0, "scale": 0.3, "transformOrigin": "50% 50%"}, {"opacity": 1, "scale": 1}, 0.6, v.t + 0.2)
        else:
            v.draw("#c3", at=v.t + 0.1, length=240); v.enter("#c3h", at=v.t + 0.7, kind="fade", dur=0.3)
        v.t += 1.0
        v.hu(f"Perm{suf} {verb}", spans=[f"#mm{i}-w0", f"#mm{i}-w1"], post=1.4)
    v.t += 1.0
    v.end_scene(0.4)

    # ================= 5. Проверка
    v.script.append(("SCENE", "Проверьте себя"))
    quiz = [("у врача", [("orvos", "nál", "at")], "orvosnál.", "at"),
            ("в доме", ["a", ("ház", "ban", "at")], "a házban.", "at"),
            ("Я еду из Перми.", [("Perm", "ből", "from"), "jövök."], "Permből jövök.", "from")]
    for q, (ru, toks, spoken, k) in enumerate(quiz):
        pid = f"qa{q}"
        v.scene(f"s5q{q}", head("Проверьте себя") + f'<div class="quiz"><div class="ru2" id="qq{q}">{esc(ru)}</div>'
                f'<div class="ans" id="{pid}">{picto(f"qp{q}", k, 108, 76)}<div class="hu2">{hus(pid + "h", toks)}</div></div></div>')
        if q == 0:
            v.narrate("Теперь проверьте себя. Я скажу фразу по-русски, а вы подумайте, как она звучит по-венгерски. Ответ появится через несколько секунд.", post=0.4)
        v.enter(f"#qq{q}", kind="fade"); v.t += 0.6
        v.narrate(f"«{ru.rstrip('.')}»", post=0.2)
        v.ring(GAP_THINK)
        v.enter(f"#{pid}", kind="up"); v.t += 0.6
        v.hu(spoken, spans=[f"#{pid}h-w{n}" for n in range(len(toks))], post=1.8)
        v.end_scene(0.3)

    # ================= 6. Итог
    v.script.append(("SCENE", "Главное из урока"))
    sm = '<div></div>' + "".join(
        f'<div class="q">{picto(f"sp{j}", k, 84, 60)}<span class="ru2" style="color:{DIRS[k][0]}">{qq}</span></div>'
        for j, (k, qq) in enumerate(zip(ORDER, ["куда?", "где?", "откуда?"])))
    for lab, pairs in (("внутрь, внутри", [("ba", "be"), ("ban", "ben"), ("ból", "ből")]),
                       ("на поверхность", [("ra", "re"), ("n", ""), ("ról", "ről")]),
                       ("к человеку, у него", [("hoz", "hez"), ("nál", "nél"), ("tól", "től")])):
        sm += f'<div class="l">{esc(lab)}</div>' + "".join(
            f'<div class="c"><span style="color:{DIRS[ORDER[j]][0]}">-{a}</span>' + (f' <span style="color:var(--muted);font-weight:400">/</span> <span style="color:{DIRS[ORDER[j]][0]}">-{bb}</span>' if bb else "") + '</div>'
            for j, (a, bb) in enumerate(pairs))
    sm += '<div></div>' + "".join(
        f'<div class="p"><div class="hu3">Perm<span style="color:{DIRS[ORDER[j]][0]}">{s}</span> {vb}</div><div class="ru2">{r}</div></div>'
        for j, (s, vb, r) in enumerate(data4))
    v.scene("end", head("Главное из урока") + f'<div class="sum" id="sum">{sm}</div>')
    v.enter("#sum", kind="fade"); v.t += 0.8
    SCR(v, "сводная таблица окончаний по трём колонкам, под каждой колонкой фраза о Перми")
    v.narrate("Подведём итог. В венгерском место и направление передаёт окончание. Вопрос подсказывает, какое из трёх выбрать, а гласные в слове подсказывают, твёрдым оно будет или мягким.", post=3.5)
    v.end_scene(0.8)
    return v

if __name__ == "__main__":
    v = build()
    v.write(f"{ROOT}/hf/v03f")
    v.export_script(f"{ROOT}/video/03-irany-scenario-v6.md", "Hova? Hol? Honnan? Сценарий, версия 6")
