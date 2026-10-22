"""Final assembly: parallax frames + typography + voice. usage: final.py NAME [stills_only t1,t2] """
import sys, os, time, importlib
from common import *

NAME = sys.argv[1]
S = importlib.import_module(NAME)
OUT = R
TD = f'{R}/work/{NAME}_type'
A = f'{R}/audio'

ACC_G = '#2D6A4F'; ACC_B = '#3B6E9B'


def plaque(name, hu_stem, hu_end, ru, css, color, accent=True):
    end = f"<span style='color:{color if accent else 'inherit'}'>{hu_end}</span>" if hu_end else ""
    return {"name": name, "css": css, "html": f"<div class='plaque'><div class='hu'>{hu_stem}{end}</div><div class='ru'>{ru}</div></div>"}


def attr(text, css="left:26px;bottom:20px"):
    return {"name": "attr", "css": css, "html": f"<div class='attr'>{text}</div>"}


CFG = {
    'bilibin': dict(
        dur=9.0,
        els=[plaque('p1', 'a ház', 'ba', 'в дом', 'right:70px;bottom:92px', ACC_G, False),
             plaque('p1a', 'a ház', 'ba', 'в дом', 'right:70px;bottom:92px', ACC_G, True),
             attr('Иван Билибин, «Василиса Прекрасная у избушки Бабы-Яги», 1899')],
        tl=[('attr', 0.6, 99, None), ('p1', 1.0, 99, ('p1a', 1.55))],
        audio=[(f'{A}/hazba.mp3', 1.3, 0), (f'{A}/hazba.mp3', 5.0, 0)],
        stills=[3.2, 7.6]),
    'aivazovsky': dict(
        dur=10.0,
        els=[plaque('p1', 'A nagyapám tengerész volt.', '', 'Мой дед был моряком.', 'left:70px;top:64px', ACC_B, False),
             plaque('p2', 'a hajó', 'n', 'на корабле', 'left:70px;top:64px', ACC_B, False),
             plaque('p2a', 'a hajó', 'n', 'на корабле', 'left:70px;top:64px', ACC_B, True),
             attr('Иван Айвазовский, «Бриг „Меркурий“ после победы над двумя турецкими судами встречается с русской эскадрой», 1848')],
        tl=[('attr', 0.6, 99, None), ('p1', 0.8, 4.7, None), ('p2', 5.2, 99, ('p2a', 5.72))],
        audio=[(f'{A}/nagyapam.mp3', 1.1, 0), (f'{A}/hajon.mp3', 5.5, 0), (f'{A}/hajon.mp3', 7.7, 0)],
        stills=[3.0, 8.4]),
    'bryullov': dict(
        dur=9.0,
        els=[plaque('p1', 'a kert', 'ben', 'в саду', 'right:70px;top:64px', ACC_B, False),
             plaque('p1a', 'a kert', 'ben', 'в саду', 'right:70px;top:64px', ACC_B, True),
             attr('Карл Брюллов, «Итальянский полдень», 1827')],
        tl=[('attr', 0.6, 99, None), ('p1', 1.0, 99, ('p1a', 1.56))],
        audio=[(f'{A}/kertben.mp3', 1.3, 0), (f'{A}/kertben.mp3', 5.0, 0)],
        stills=[3.2, 7.6]),
}
C = CFG[NAME]
DUR = C['dur']
NF = int(round(DUR * FPS))


def opacity(t, t_in, t_out, din=0.7, dout=0.5):
    if t < t_in:
        return 0.0, 1.0
    u = min(1.0, (t - t_in) / din)
    o = pz.ease(u)
    if t > t_out:
        o *= 1 - pz.ease(min(1.0, (t - t_out) / dout))
    return o, 1 - pz.ease(u)


def compose(base, t, E):
    f = base
    for name, t_in, t_out, acc in C['tl']:
        o, rise = opacity(t, t_in, t_out)
        if o <= 0:
            continue
        dy = 10 * rise
        if acc:
            an, ta = acc
            ua = pz.ease(min(1, max(0, (t - ta) / 0.35)))
            if ua < 1:
                f = pz.comp_type(f, E[name], o * (1 - ua) if ua > 0 else o, dy, blur=True)
            if ua > 0:
                f = pz.comp_type(f, E[an], o * ua, dy, blur=(ua >= 1))
        else:
            f = pz.comp_type(f, E[name], o, dy, blur=(name != 'attr'))
    # fade from / to black
    g = min(1.0, t / 0.5) * min(1.0, (DUR - t) / 0.6)
    return f * pz.ease(g) if g < 1 else f


def main():
    render_type({"elements": C['els']}, TD)
    E = {e['name']: pz.TypeEl(TD, e['name']) for e in C['els']}
    layers = load_layers(S.LP)
    mode = sys.argv[2] if len(sys.argv) > 2 else 'video'
    if mode == 'stills':
        ts = [float(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else C['stills']
        for i, t in enumerate(ts):
            f = compose(S.frame(layers, t), t, E)
            pz.imwrite(f'{R}/work/{NAME}_still_{t:05.2f}.jpg', f)
        return
    vtmp = f'{R}/work/{NAME}_v.mp4'
    enc = pz.Encoder(vtmp, crf=15)
    t0 = time.time()
    stills = {int(round(t * FPS)): k for k, t in enumerate(C['stills'])}
    for n in range(NF):
        t = n / FPS
        f = compose(S.frame(layers, t), t, E)
        enc.write(f)
        if n in stills:
            im = np.clip(f * 255 + 0.5, 0, 255).astype(np.uint8)
            cv2.imwrite(f'{OUT}/{NAME}-{stills[n] + 1}.jpg', cv2.cvtColor(im, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 93])
        if n % 30 == 0:
            print(f'frame {n}/{NF} {time.time() - t0:.0f}s', flush=True)
    enc.close()
    wav = f'{R}/work/{NAME}_a.wav'
    make_audio(wav, C['audio'], DUR)
    mux(vtmp, wav, f'{OUT}/{NAME}-live.mp4')
    print('done', time.time() - t0)


if __name__ == '__main__':
    main()
