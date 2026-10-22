from lib import *

def build():
    v = Video(2, "02-toldalek", "02 · Toldalékok", "Агглютинация")
    v.extra_css = """
.chain { display:flex; align-items:baseline; margin-top:24px; height:100px; }
.chain .hu { font-size:80px; white-space:nowrap; }
.sufbox { position:relative; display:inline-block; vertical-align:top; height:1.2em; width:700px; }
.sufbox .v { position:absolute; left:0; top:0; white-space:nowrap; opacity:0; }
.sufbox .v.on { opacity:1; }
.ghost { visibility:hidden; }
.lk { color:var(--muted); }
.ac { color:var(--acc); }
.tr { position:relative; height:44px; margin-top:6px; }
.tr .v { position:absolute; left:0; top:0; opacity:0; font-family:'IBM Plex Sans'; font-size:32px; color:var(--muted); white-space:nowrap; }
.legend { margin-top:40px; }
.legend div { font-family:'IBM Plex Mono'; font-weight:500; font-size:30px; color:var(--muted); line-height:1.5; opacity:0; }
.legend b { color:var(--acc); font-weight:500; }
.step { display:inline-block; }
"""
    # ---- A: title
    v.scene("s1", words("s1t", "Toldalékok", cls="title") + '<div class="sub in" id="s1s">Слово собирается из морфем, как из кубиков</div>')
    v.tw("#s1t", {"opacity": 1}, {"opacity": 1}, 0.05, 0); v.enter("#s1s", at=v.t + 0.2)
    v.cap("Корень + суффиксы по порядку. Каждый суффикс — одно значение")
    v.t += 0.5
    v.say("Toldalékok.", prefix="s1t", post=0.9)
    v.end_scene(0.3)

    # ---- B: ház chain
    def chain(pid, root, variants, trs, legend):
        vs = "".join(f'<span class="v" id="{pid}v{i}" data-layout-allow-overlap>{h}</span>' for i, h in enumerate(variants))
        ts = "".join(f'<span class="v" id="{pid}t{i}">{esc(t)}</span>' for i, t in enumerate(trs))
        lg = "".join(f'<div id="{pid}l{i}">{h}</div>' for i, h in enumerate(legend))
        return (f'<div class="chain"><div class="hu in" id="{pid}w"><span id="{pid}root">{esc(root)}</span>'
                f'<span class="sufbox" id="{pid}box">{vs}</span></div></div>'
                f'<div class="tr">{ts}</div><div class="legend">{lg}</div>')

    vars_b = ['<span class="lk">a</span><span class="ac">m</span>',
              '<span class="lk">a</span><span class="ac">i</span>m',
              '<span class="ghost">aim</span><span class="ac step" id="b-ban">ban</span>']
    v.scene("s2", chain("b", "ház", vars_b, ["дом", "мой дом", "мои дома", "в моих домах"],
                        ["<b>-m</b> · мой", "<b>-i-</b> · мн. число при притяжании", "<b>-ban</b> · в"]))
    v.cap("Корень ház — дом")
    v.enter("#bw", kind="left"); v.enter("#bt0", at=v.t + 0.15); v.t += 0.5
    v.say("ház.", spans=["#bw"], hl="bg", post=0.75)
    # step 2: -am
    v.cap("+ -am → мой: házam")
    v.tw("#bv0", {"opacity": 0, "x": 40}, {"opacity": 1, "x": 0}, 0.45, v.t)
    v.tw("#bt0", {"opacity": 1}, {"opacity": 0}, 0.2, v.t, ir=False); v.tw("#bt1", {"opacity": 0}, {"opacity": 1}, 0.3, v.t + 0.15)
    v.enter("#bl0", at=v.t + 0.2); v.t += 0.6
    v.say("házam.", spans=["#bw"], hl="bg", post=0.75)
    # step 3: -i- plural
    v.cap("+ -i- → множественное число: házaim")
    v.tw("#bv0", {"opacity": 1}, {"opacity": 0}, 0.2, v.t, ir=False)
    v.tw("#bv1", {"opacity": 0, "x": 40}, {"opacity": 1, "x": 0}, 0.45, v.t + 0.1)
    v.tw("#bt1", {"opacity": 1}, {"opacity": 0}, 0.2, v.t, ir=False); v.tw("#bt2", {"opacity": 0}, {"opacity": 1}, 0.3, v.t + 0.15)
    v.enter("#bl1", at=v.t + 0.2); v.t += 0.6
    v.say("házaim.", spans=["#bw"], hl="bg", post=0.75)
    # step 4: -ban
    v.cap("+ -ban → в: házaimban")
    v.tw("#bv2", {"opacity": 0}, {"opacity": 1}, 0.05, v.t)
    v.tw("#b-ban", {"opacity": 0, "x": 40}, {"opacity": 1, "x": 0}, 0.45, v.t + 0.05)
    v.tw("#bt2", {"opacity": 1}, {"opacity": 0}, 0.2, v.t, ir=False); v.tw("#bt3", {"opacity": 0}, {"opacity": 1}, 0.3, v.t + 0.15)
    v.enter("#bl2", at=v.t + 0.2); v.t += 0.6
    v.say("házaimban.", spans=["#bw"], hl="bg", post=0.8)
    v.end_scene(0.4)

    # ---- C: barát chain
    vars_c = ['<span class="lk">o</span><span class="ac">m</span>',
              '<span class="ghost">om</span><span class="ac step" id="c-mal">mal</span>']
    v.scene("s3", chain("c", "barát", vars_c, ["друг", "мой друг", "с моим другом"],
                        ["<b>-om</b> · мой", "<b>-val</b> → <b>-mal</b> · с (v уподобляется m)"]))
    v.cap("Корень barát — друг")
    v.enter("#cw", kind="left"); v.enter("#ct0", at=v.t + 0.15); v.t += 0.5
    v.say("barát.", spans=["#cw"], hl="bg", post=0.75)
    v.cap("+ -om → мой: barátom")
    v.tw("#cv0", {"opacity": 0, "x": 40}, {"opacity": 1, "x": 0}, 0.45, v.t)
    v.tw("#ct0", {"opacity": 1}, {"opacity": 0}, 0.2, v.t, ir=False); v.tw("#ct1", {"opacity": 0}, {"opacity": 1}, 0.3, v.t + 0.15)
    v.enter("#cl0", at=v.t + 0.2); v.t += 0.6
    v.say("barátom.", spans=["#cw"], hl="bg", post=0.75)
    v.cap("+ -val → с: v превращается в m → barátommal")
    v.tw("#cv1", {"opacity": 0}, {"opacity": 1}, 0.05, v.t)
    v.tw("#c-mal", {"opacity": 0, "x": 40}, {"opacity": 1, "x": 0}, 0.45, v.t + 0.05)
    v.tw("#ct1", {"opacity": 1}, {"opacity": 0}, 0.2, v.t, ir=False); v.tw("#ct2", {"opacity": 0}, {"opacity": 1}, 0.3, v.t + 0.15)
    v.enter("#cl1", at=v.t + 0.2); v.t += 0.6
    v.say("barátommal.", spans=["#cw"], hl="bg", post=0.8)
    v.end_scene(0.4)

    # ---- D: order is the reverse of Russian
    v.extra_css += """
.map { display:flex; gap:44px; margin-top:20px; }
.map .col { opacity:0; }
.map .hu { font-size:72px; }
.map .ru { font-size:28px; margin-top:4px; }
.map .arr { font-family:'IBM Plex Mono'; font-size:26px; color:var(--acc); margin-top:6px; }
"""
    cols = [("ház", "дом", "3"), ("a", "связка", ""), ("im", "мои", "2"), ("ban", "в", "1")]
    mp = '<div class="map">' + "".join(
        f'<div class="col" id="m{i}"><div class="hu" id="m{i}h">{esc(a)}</div><div class="ru">{esc(b)}</div><div class="arr">{esc(c)}</div></div>'
        for i, (a, b, c) in enumerate(cols)) + '</div>'
    v.scene("s4", '<div class="rule in" id="s4rule">По-русски читаем с конца: в → моих → домах</div>' + mp)
    v.enter("#s4rule", kind="fade"); v.t += 0.5
    v.cap("Одно венгерское слово = три русских. Порядок суффиксов обратный")
    for i in range(4):
        v.enter(f"#m{i}", kind="up"); v.t += 0.25
    v.t += 0.5
    v.say("házaimban.", spans=["#m0h", "#m1h", "#m2h", "#m3h"][:1], hl="bg", post=0.4)
    v.cap("в моих домах — ban · im · ház")
    for i, sel in enumerate(("#m3h", "#m2h", "#m0h")):
        v.tw(sel, {"backgroundColor": "rgba(228,239,232,0)"}, {"backgroundColor": SOFT}, 0.1, v.t + i * 0.55, ease="power2.out", ir=False)
        v.tw(sel, {"backgroundColor": SOFT}, {"backgroundColor": "rgba(228,239,232,0)"}, 0.2, v.t + i * 0.55 + 0.4, ease="power2.out", ir=False)
    v.t += 2.4
    v.end_scene(0.5)

    v.end_card(["Корень → число → чей → падеж",
                "ház<b>-a-im-ban</b> · в моих домах"])
    return v

if __name__ == "__main__":
    build().write(f"{ROOT}/hf/v02")
