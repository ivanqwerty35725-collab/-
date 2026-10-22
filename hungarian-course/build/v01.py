from lib import *

def build():
    v = Video(1, "01-hangrend", "01 · Hangrend", "Гармония гласных")
    v.extra_css = """
.row { display:flex; align-items:baseline; gap:36px; margin-bottom:26px; }
.rl { width:400px; font-size:28px; color:var(--muted); flex:none; }
.ex { display:flex; align-items:baseline; gap:40px; margin-top:26px; }
.ex .ru { width:300px; flex:none; }
.suf { display:inline-block; }
.alt { position:relative; display:inline-block; }
.alt .b { position:absolute; left:0; top:0; opacity:0; }
"""
    # ---- A: title
    v.scene("s1", words("s1t", "Hangrend", cls="title") + '<div class="sub in" id="s1s">Гармония гласных</div>')
    v.tw("#s1t", {"opacity": 1}, {"opacity": 1}, 0.05, 0); v.enter("#s1s", at=v.t + 0.2)
    v.cap("Какое окончание выбрать: -ban или -ben? Решают гласные слова")
    v.t += 0.5
    v.say("Hangrend.", prefix="s1t", post=0.9)
    v.end_scene(0.3)

    # ---- B: three groups
    rows = [("s2v1", "a á o ó u ú", "a, á, o, ó, u, ú.", BACK, "задний ряд"),
            ("s2v2", "e é i í", "e, é, i, í.", FRONT, "передний ряд"),
            ("s2v3", "ö ő ü ű", "ö, ő, ü, ű.", ROUND, "передний огублённый")]
    html = ""
    for pid, disp, spoken, col, lab in rows:
        n = len(disp.split())
        html += f'<div class="row in" id="{pid}r"><div class="rl">{lab}</div>' + \
                words(pid, disp, colors={i: col for i in range(n)}) + '</div>'
    v.scene("s2", html)
    v.cap("Три группы гласных. Ряд последнего гласного задаёт форму окончания")
    for pid, disp, spoken, col, lab in rows:
        v.enter(f"#{pid}r", kind="left")
        v.t += 0.3
        v.say(spoken, prefix=pid, hl="bg", post=0.45)
    v.end_scene(0.4)

    # ---- C1: rule + házban / Permben
    def ex(pid, root, suf, col, ru, alt=None):
        r = esc(root)
        if alt:  # (plain, changed): last letter changes when suffix sticks
            r = esc(root[:-1]) + f'<span class="alt" data-layout-allow-overlap><span class="a" id="{pid}a">{esc(alt[0])}</span><span class="b" id="{pid}b">{esc(alt[1])}</span></span>'
        return (f'<div class="ex" id="{pid}"><div class="hu in" id="{pid}w"><span id="{pid}root">{r}</span>'
                f'<span class="suf in" id="{pid}s" style="color:{col}">{esc(suf)}</span></div>'
                f'<div class="ru in" id="{pid}ru">{esc(ru)}</div></div>')

    def ex_play(pid, spoken, alt=False):
        v.enter(f"#{pid}w", kind="left"); v.t += 0.45
        v.enter(f"#{pid}s", kind="stick")
        if alt:
            v.tw(f"#{pid}a", {"opacity": 1}, {"opacity": 0}, 0.3, v.t + 0.1, ir=False)
            v.tw(f"#{pid}b", {"opacity": 0}, {"opacity": 1}, 0.3, v.t + 0.1, ir=False)
        v.enter(f"#{pid}ru", at=v.t + 0.25); v.t += 0.5
        v.say(spoken, spans=[f"#{pid}w"], hl="bg", post=0.55)

    rule = '<div class="rule in" id="s3rule">Окончание повторяет ряд последнего гласного</div>'
    v.scene("s3", rule + ex("x1", "ház", "ban", BACK, "в доме") + ex("x2", "Perm", "ben", FRONT, "в Перми"))
    v.enter("#s3rule", kind="fade"); v.t += 0.9
    v.cap("ház: гласный á — задний ряд → -ban")
    ex_play("x1", "házban")
    v.cap("Perm: гласный e — передний ряд → -ben")
    ex_play("x2", "Permben")
    v.end_scene(0.4)

    # ---- C2: Csománfalván / Técsőhöz
    rule2 = '<div class="rule in" id="s4rule">То же правило для любого окончания</div>'
    v.scene("s4", rule2 + ex("x3", "Csománfalva", "n", BACK, "в Чоманфалве", alt=("a", "á"))
            + ex("x4", "Técső", "höz", ROUND, "к Тячеву"))
    v.enter("#s4rule", kind="fade"); v.t += 0.7
    v.cap("-n / -on / -en / -ön: последний a — задний ряд, a → á перед окончанием")
    ex_play("x3", "Csománfalván", alt=True)
    v.cap("-hoz / -hez / -höz: последний ő — огублённый передний → -höz")
    ex_play("x4", "Técsőhöz")
    v.end_scene(0.4)

    # ---- D: mixed words
    rule3 = '<div class="rule in" id="s5rule">Смешанные слова: i, í, e, é не мешают заднему ряду</div>'
    v.scene("s5", rule3 + ex("x5", "Iván", "nak", BACK, "Ивану") + ex("x6", "Kirill", "nek", FRONT, "Кириллу"))
    v.enter("#s5rule", kind="fade"); v.t += 0.8
    v.cap("Iván: i + á → решает á, задний ряд → -nak")
    ex_play("x5", "Ivánnak")
    v.cap("Kirill: только i → передний ряд → -nek")
    ex_play("x6", "Kirillnek")
    v.end_scene(0.4)

    v.end_card(["Последний гласный слова → ряд окончания",
                "ház<b>ban</b> · Perm<b>ben</b> · Técső<b>höz</b> · Kirill<b>nek</b>"])
    return v

if __name__ == "__main__":
    import sys
    v = build()
    v.write(f"{ROOT}/hf/v01")
