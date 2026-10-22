import json, subprocess
from lib import *

def measure(texts, size=76, weight=600, fam="Source Serif 4"):
    items = [{"t": t, "f": fam, "s": size, "w": weight} for t in texts]
    out = subprocess.check_output(["node", f"{ROOT}/build/measure.mjs", json.dumps(items)]).decode()
    return dict(zip(texts, json.loads(out)))

def build():
    v = Video(4, "04-igekoto", "04 · Igekötők", "Глагольные приставки")
    SZ = 76
    m = measure(["meg", "nézem", "nézni", "nem", "Ma", "akarom", " "], size=SZ)
    sp = m[" "]
    v.extra_css = f"""
.stage {{ position:relative; height:110px; margin-top:20px; }}
.stage .p {{ position:absolute; top:0; left:0; font-family:'Source Serif 4', serif; font-weight:600; font-size:{SZ}px; line-height:1.2; white-space:nowrap; border-radius:8px; padding:0 .08em; margin:0 -.08em; }}
.stage .pre {{ color:var(--acc); }}
.tr {{ font-family:'IBM Plex Sans'; font-size:32px; color:var(--muted); margin-top:10px; opacity:0; }}
.hint {{ font-family:'IBM Plex Mono'; font-weight:500; font-size:30px; color:var(--muted); margin-top:44px; opacity:0; }}
.hint b {{ color:var(--acc); font-weight:500; }}
"""
    # ---- A: title
    v.scene("s1", words("s1t", "Igekötők", cls="title") + '<div class="sub in" id="s1s">Глагольные приставки: meg-, el-, ki-, be-…</div>')
    v.tw("#s1t", {"opacity": 1}, {"opacity": 1}, 0.05, 0); v.enter("#s1s", at=v.t + 0.2)
    v.cap("Приставка пишется слитно, но может отделяться и уходить за глагол")
    v.t += 0.5
    v.say("Igekötők.", prefix="s1t", post=0.9)
    v.end_scene(0.3)

    # ---- A2: common prefixes
    pre = [("meg", "завершённость"), ("el", "прочь"), ("ki", "наружу"), ("be", "внутрь"), ("fel", "вверх"), ("le", "вниз")]
    v.extra_css += """
.plist { display:flex; gap:40px; margin-top:16px; }
.plist .it { opacity:0; }
.plist .hu { font-size:68px; color:var(--acc); }
.plist .ru { font-size:26px; margin-top:2px; }
"""
    pl = '<div class="plist">' + "".join(
        f'<div class="it" id="pi{i}"><div class="hu" id="pih{i}">{a}-</div><div class="ru">{b}</div></div>' for i, (a, b) in enumerate(pre)) + '</div>'
    v.scene("s1b", '<div class="rule in" id="s1brule">Самые частые приставки</div>' + pl)
    v.enter("#s1brule", kind="fade"); v.t += 0.5
    v.cap("Приставка уточняет направление или говорит: действие доведено до конца")
    for i in range(6):
        v.enter(f"#pi{i}", kind="up"); v.t += 0.12
    v.t += 0.4
    v.say("meg, el, ki, be, fel, le.", spans=[f"#pih{i}" for i in range(6)], rate="-15%", hl="bg", post=0.9)
    v.end_scene(0.4)

    def stage(pid, parts):
        """parts: list of (id, text, x, cls, visible)"""
        h = '<div class="stage" data-layout-allow-overlap>'
        for sid, text, x, cls, vis in parts:
            h += f'<span class="p {cls}" id="{pid}{sid}" style="left:{x:.1f}px;opacity:{1 if vis else 0}">{esc(text)}</span>'
        return h + '</div>'

    # ---- B: megnézem
    v.scene("s2", stage("b", [("meg", "meg", 0, "pre", 1), ("v", "nézem", m["meg"], "", 1)])
            + '<div class="tr" id="btr">посмотрю (это), досмотрю</div>'
            + '<div class="hint" id="bh"><b>meg-</b> + nézem · приставка впереди, слитно</div>')
    v.cap("Утверждение: приставка на месте, перед глаголом")
    v.tw("#bmeg", {"opacity": 0, "x": -24}, {"opacity": 1, "x": 0}, 0.35, v.t)
    v.tw("#bv", {"opacity": 0, "x": -24}, {"opacity": 1, "x": 0}, 0.35, v.t + 0.08)
    v.enter("#btr", at=v.t + 0.3); v.enter("#bh", at=v.t + 0.6); v.t += 0.8
    start, dur, wb = v.say("megnézem.", spans=["#bmeg"], hl="bg", post=0.8)
    t0 = start + wb[0][1]
    v.tw("#bv", {"backgroundColor": "rgba(228,239,232,0)"}, {"backgroundColor": SOFT}, 0.1, t0, ir=False)
    v.tw("#bv", {"backgroundColor": SOFT}, {"backgroundColor": "rgba(228,239,232,0)"}, 0.18, t0 + max(wb[0][2], 0.25), ir=False)
    v.end_scene(0.3)

    # ---- C: negation — prefix flies after the verb
    def detach_scene(sid, pid, front, front_tr, cap1, cap2, spoken, hint, tr_final, offset_hint):
        x0 = m[front] + sp                     # where "meg" sits before the move
        xv = x0 + m["meg"]                     # verb position
        x_after = xv + m["nézem"] + sp         # landing spot for the prefix
        v.scene(sid, stage(pid, [(front_tr, front, 0, "", 0), ("meg", "meg", x0, "pre", 1), ("v", "nézem", xv, "", 1)])
                + f'<div class="tr" id="{pid}tr">{esc(tr_final)}</div>'
                + f'<div class="hint" id="{pid}h">{hint}</div>')
        v.cap(cap1)
        v.t += 0.9
        v.cap(cap2)
        v.tw(f"#{pid}{front_tr}", {"opacity": 0, "x": -24}, {"opacity": 1, "x": 0}, 0.35, v.t)
        v.t += 0.55
        # prefix leaves: 0.5 s to the right, lands after the verb; the verb closes the gap
        x_meg_final = m[front] + sp + m["nézem"] + sp
        v.tw(f"#{pid}meg", {"x": 0, "y": 0}, {"x": x_meg_final - x0, "y": 0}, 0.5, v.t, ease="power2.inOut")
        v.tw(f"#{pid}v", {"x": 0}, {"x": -m["meg"]}, 0.5, v.t, ease="power2.inOut")
        v.t += 0.6
        v.enter(f"#{pid}tr", at=v.t); v.enter(f"#{pid}h", at=v.t + 0.2); v.t += 0.5
        v.say(spoken, spans=[f"#{pid}{front_tr}", f"#{pid}v", f"#{pid}meg"], hl="bg", post=1.0)
        v.end_scene(0.5)

    detach_scene("s3", "c", "nem", "neg", "Отрицание: nem встаёт перед глаголом…",
                 "…а приставка отделяется и уезжает за глагол", "nem nézem meg.",
                 "nem + nézem + <b>meg</b> · приставка после глагола, отдельно", "не посмотрю (это)", 0)
    detach_scene("s4", "d", "Ma", "foc", "Фокус: важное слово встаёт перед глаголом (Ma — сегодня)…",
                 "…и приставка снова уезжает за глагол", "Ma nézem meg.",
                 "<b>Ma</b> nézem meg · «именно сегодня посмотрю»", "именно сегодня посмотрю", 0)

    # ---- E: meg akarom nézni
    x_meg = 0
    x_ak = m["meg"] + sp
    x_inf = x_ak + m["akarom"] + sp
    v.scene("s5", stage("e", [("meg", "meg", x_meg, "pre", 1), ("ak", "akarom", x_ak, "", 0),
                              ("v", "nézem", m["meg"], "", 1), ("inf", "nézni", x_inf, "", 0)])
            + '<div class="tr" id="etr">хочу посмотреть (это)</div>'
            + '<div class="hint" id="eh"><b>meg</b> + akarom + nézni · модальный глагол между приставкой и инфинитивом</div>')
    v.cap("Хочу / могу / должен: приставка остаётся впереди, но отделяется…")
    v.t += 0.9
    v.cap("…глагол akarom встаёт между ними, а nézem → nézni (инфинитив)")
    v.tw("#ev", {"x": 0}, {"x": x_inf - m["meg"]}, 0.5, v.t, ease="power2.inOut")
    v.tw("#eak", {"opacity": 0, "y": 20}, {"opacity": 1, "y": 0}, 0.35, v.t + 0.3)
    v.tw("#ev", {"opacity": 1}, {"opacity": 0}, 0.25, v.t + 0.55, ir=False)
    v.tw("#einf", {"opacity": 0}, {"opacity": 1}, 0.25, v.t + 0.6)
    v.t += 1.0
    v.enter("#etr", at=v.t); v.enter("#eh", at=v.t + 0.2); v.t += 0.5
    v.say("meg akarom nézni.", spans=["#emeg", "#eak", "#einf"], hl="bg", post=0.8)
    v.end_scene(0.4)

    v.end_card(["<b>meg</b>nézem → nem nézem <b>meg</b> → Ma nézem <b>meg</b>",
                "nem или фокус перед глаголом — приставка уезжает за глагол"])
    return v

if __name__ == "__main__":
    build().write(f"{ROOT}/hf/v04")
