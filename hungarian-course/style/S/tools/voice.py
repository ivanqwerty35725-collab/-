"""Synthesises the narration for the S sampler and writes plan.json + voice.mp3.
Run from hu/build with SSL_CERT_FILE set."""
import json, os, re, subprocess, sys
sys.path.insert(0, os.getcwd())
from lib2 import tts2

S = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RU, HU = "ru-RU-DmitryNeural", "hu-HU-TamasNeural"
R_RU, R_Q, R_HU = "+8%", "+0%", "-15%"

# each scene: lead (s before first voice), items, tail (s after last voice)
SCENES = [
 ("s1", "Персонаж + проявление тушью", 0.6, [
   ("ru", "Знакомьтесь, это Кирилл. Сегодня мы с ним разберёмся, как сказать «в доме» и «из дома»."),
   ("gap", 0.3), ("hu", "Hova? Hol? Honnan?")], 0.1),
 ("s2", "Гуашевая иллюстрация + кинетическая типографика", 0.5, [
   ("ru", "Кирилл идёт в дом. Это вопрос «куда?», и к слову добавляется окончание."),
   ("gap", 0.3), ("hu", "a házba.")], 0.2),
 ("s3", "Бумажный коллаж, движение «на двойках»", 0.6, [
   ("ru", "Теперь он внутри, за столом. Это вопрос «где?»."),
   ("gap", 0.3), ("hu", "a házban.")], 0.2),
 ("s4", "Газетная вёрстка", 0.5, [
   ("ru", "Таких окончаний девять, и все они укладываются в одну простую таблицу.")], 2.3),
 ("s5", "Схема-поток", 0.5, [
   ("ru", "Спросите себя: есть ли движение?"),
   ("gap", 0.25),
   ("ru", "Если нет, это вопрос «где?»."),
   ("gap", 0.2),
   ("ru", "Если есть, то «куда?» или «откуда?».")], 0.8),
 ("s6", "Анимированная карта", 0.6, [
   ("ru", "Дед Кирилла родился в Чумалёве, в Закарпатье, а потом переехал на Урал. По-венгерски это звучит так."),
   ("gap", 0.2), ("hu", "A nagyapám Csománfalváról az Urálba költözött.")], 0.3),
 ("s7", "Интерфейс-переписка", 0.5, [
   ("ru", "Именно такой вопрос может задать консул."),
   ("gap", 0.6), ("hu", "Honnan jön?"), ("gap", 0.5), ("hu", "Permből jövök.")], 0.2),
 ("s8", "Проверка в стиле Apple", 0.5, [
   ("ru", "Проверьте себя: как сказать «в Перми»?"),
   ("gap", 3.0), ("hu", "Permben.")], 0.3),
 ("s9", "Итог + персонаж", 0.5, [
   ("ru", "Вот и всё: три вопроса, и на каждый своё окончание. До встречи в следующем уроке.")], 1.5),
]
HU_POST = 1.0


def eff(d, words):
    """speech end inside the mp3 (edge-tts pads ~1 s of silence at the tail)"""
    if not words: return d
    w = words[-1]
    return min(d, w[1] + w[2] + 0.12)


def ru_chunks(text):
    parts = [p for p in re.split(r"(«[^»]+»)", text) if p.strip()]
    out = []
    for p in parts:
        if p.startswith("«"):
            out.append(("q", p.strip("«»")))
        else:
            p = p.strip(" ,")
            if p and p not in (".", ":", "?", "?.", "»."):
                out.append(("t", p))
    return out


plan, clips, T = [], [], 0.0
for sid, name, lead, items, tail in SCENES:
    t = lead
    sc = {"id": sid, "name": name, "start": round(T, 3), "events": []}
    for it in items:
        if it[0] == "gap":
            t += it[1]; continue
        if it[0] == "hu":
            mp3, d, words = tts2(it[1], HU, R_HU); d = eff(d, words)
            sc["events"].append({"kind": "hu", "text": it[1], "t": round(t, 3), "dur": round(d, 3), "words": words})
            clips.append((T + t, mp3)); t += d + HU_POST; continue
        chunks = ru_chunks(it[1])
        ev = {"kind": "ru", "text": it[1], "t": round(t, 3), "parts": []}
        for k, (kind, txt) in enumerate(chunks):
            if kind == "q":
                t += 0.4
                mp3, d, words = tts2(txt, RU, R_Q)
            else:
                mp3, d, words = tts2(txt, RU, R_RU)
            d = eff(d, words)
            ev["parts"].append({"text": txt, "t": round(t, 3), "dur": round(d, 3), "words": words})
            clips.append((T + t, mp3)); t += d
            if kind == "q" and k < len(chunks) - 1:
                t += 0.4
            else:
                t += 0.05
        ev["end"] = round(t, 3)
        sc["events"].append(ev)
    t = t - 0.05 + tail if sc["events"][-1]["kind"] == "ru" else t - HU_POST + max(HU_POST, tail)
    sc["dur"] = round(t, 3)
    T += t
    plan.append(sc)

json.dump({"total": round(T, 3), "scenes": plan}, open(f"{S}/tools/plan.json", "w"), ensure_ascii=False, indent=1)
for sc in plan:
    print(f'{sc["id"]} start {sc["start"]:6.2f} dur {sc["dur"]:5.2f}  {sc["name"]}')
print("total", round(T, 2))

# mix voice track
os.makedirs(f"{S}/proj/assets/audio", exist_ok=True)
args, fl = ["ffmpeg", "-v", "error", "-y"], []
for i, (st, mp3) in enumerate(clips):
    args += ["-i", mp3]
    ms = int(round(st * 1000))
    fl.append(f"[{i}:a]aresample=48000,adelay={ms}|{ms}[a{i}]")
fl.append("".join(f"[a{i}]" for i in range(len(clips))) + f"amix=inputs={len(clips)}:normalize=0:dropout_transition=0,apad=whole_dur={T:.3f}[out]")
args += ["-filter_complex", ";".join(fl), "-map", "[out]", "-ac", "1", "-ar", "48000", "-c:a", "libmp3lame", "-b:a", "128k", f"{S}/proj/assets/audio/voice.mp3"]
subprocess.check_call(args)
print("voice ok")
