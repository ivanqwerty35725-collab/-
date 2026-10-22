import sys, re, json, glob, os, importlib.util
HU="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu"
T2=HU+"/t2"
sys.path.insert(0,HU)
from words import WORDS
src=open(HU+"/gen.py",encoding="utf-8").read()
seg=src[src.index("W = ["):]
seg=seg[:seg.index("\n]\n")+2]
HR=""
W=eval(seg[4:])
LET="a-záéíóöőúüű"
def toks(s): return re.findall("["+LET+"]+",s.lower())
BASE=set("""kirill iván mária fjodor anna babics alekszinec liszva perm csománfalva újbárd kárpátalja técső ungvár franciaország francia urál szása olena vaszil marija natasa afrika india tisza ivanovics
én te ő ők mi ti milyen miért jó nap napot idő apám anyám apád anyád menni jönni
egy kettő két három négy öt hat hét nyolc kilenc tíz tizen huszon húsz harminc negyven ötven hatvan hetven nyolcvan kilencven száz ezer kétezer""".split())
def allowed(w):
    A=set(BASE)
    for k in range(1,w+1):
        for hu,ru in WORDS[k]:
            for t in toks(hu): A.add(t)
        for g in W[k-1][1]:
            for t in toks(g): A.add(t)
    return A
def match(t,A):
    if t in A: return True
    for a in A:
        if len(a)<2: continue
        k=len(a)-(1 if (a[-1] in "aeoöáéóő" and len(a)>=4) else 0)
        if t.startswith(a[:k]): return True
    return False
def nsent(hu):
    if hu.startswith("–"):
        return sum(1 for l in hu.split("\n") if l.strip())
    return len([s for s in re.split(r"[.!?]+",hu) if s.strip()])
def load_week(w):
    p=f"{T2}/w{w}.py"
    if not os.path.exists(p): return None
    spec=importlib.util.spec_from_file_location(f"w{w}",p); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.T
def week_of(d): return (d-1)//7+1
def check(w,T):
    A=allowed(w)
    for d in sorted(T,key=int):
        e=T[d]
        hu=e["hu"]
        unk=[]
        for t in toks(hu):
            if not match(t,A) and t not in unk: unk.append(t)
        gl=[toks(g[0]) for g in e["gloss"]]
        glt=set(x for g in gl for x in g)
        uncovered=[t for t in unk if not any(t==g or (len(g)>=3 and t.startswith(g[:len(g)-1])) for g in glt)]
        ns=nsent(hu)
        lo,hi=(5,6) if w<=16 else (6,8)
        if hu.startswith("–"): lo,hi=6,8
        flag="" if lo<=ns<=hi else " <-- LEN"
        print(f"d{d} w{w} sent={ns}{flag} gloss={len(e['gloss'])} qs={len(e['qs'])} unk={unk} UNCOVERED={uncovered}")
if __name__=="__main__":
    ws=[int(x) for x in sys.argv[1:]] or range(12,23)
    for w in ws:
        T=load_week(w)
        if T is None: print("no week",w); continue
        assert set(T)=={str(d) for d in range((w-1)*7+1,w*7+1)}, (w,sorted(T))
        check(w,T)
