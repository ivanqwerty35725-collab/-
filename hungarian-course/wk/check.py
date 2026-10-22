import json,re,sys,importlib.util,os
D="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu"
spec=importlib.util.spec_from_file_location("words",D+"/words.py");m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);WORDS=m.WORDS
NAMES="kirill iván mária fjodor babics anna alekszinec liszva perm csománfalva kárpátalja újbárd urál franciaország budapest ungvár técső beregszász moszkva káma tisza magyarország oroszország ukrajna".split()
NUMS="egy kett két három négy öt hat hét nyolc kilenc tíz tizen húsz huszon harminc negyven ötven hatvan hetven nyolcvan száz ezer fél negyed egyszer kétszer".split()
STEMS="lak dolgoz esz isz reggeliz ebédel vacsoráz feksz kel utaz érkez tud tanul beszél ért ír olvas főz úsz énekel vezet megy men mész jön jöv jössz vagy vesz kér fizet vásárol él nap akar lakik jár ház apja anyja édesapád édesanyád nagyapád busszal".split()
SUF="sal sel zal zel ban ben on en ön n ba be ból ből ra re ról ről hoz hez höz nál nél tól től val vel szal szel mal mel tal tel nak nek t ot et at öt k ok ek ak ök m om em am d od ed ad ja je a e i ul ül kor ig ni sz ol el unk ünk ik ért nk".split()
def norm(s): return s.translate(str.maketrans("áéíóöőúüű","aeiooouuu"))
def toks(t): return re.findall(r"[a-záéíóöőúüű]+",t.lower())
SUFN={norm(s) for s in SUF}
def sufmatch(s,depth=0):
    if s=="": return True
    if depth>3: return False
    return any(s.startswith(x) and sufmatch(s[len(x):],depth+1) for x in SUFN)
def match(s,roots,depth=0):
    if s=="": return True
    if depth>3: return False
    for a in roots:
        if s.startswith(a) and (len(a)>=3 or a in SHORT):
            r=s[len(a):]
            if sufmatch(r) or match(r,roots,depth+1): return True
    return False
SHORT={norm(x) for x in STEMS+NUMS if len(x)<3}|{"a","az","jo","is","ott","itt","es","ki","mi","ma","ha","de","te","en","uj","ez","az","ad","ut","le","fel"}
def allowed_for(w):
    al=set()
    for k in range(1,w+1):
        for hu,ru in WORDS[k]:
            al.update(toks(hu))
    al.update(NAMES);al.update(NUMS);al.update(STEMS);al.update(["a","az"])
    return {norm(a) for a in al}
data=json.load(open(D+"/texts_1.json"))
bad=0
for d in sorted(data,key=int):
    t=data[d];w=(int(d)-1)//7+1;roots=allowed_for(w)
    un=sorted({tok for tok in toks(t["hu"]) if not match(norm(tok),roots)})
    gl=" ".join(norm(g[0].lower()) for g in t["gloss"])
    notg=[u for u in un if norm(u) not in gl]
    sents=t["hu"].count("\n")+1 if t["hu"].startswith("–") else len([s for s in re.split(r"[.!?]+\s",t["hu"].strip()) if s.strip()])
    flags=[]
    if notg: flags.append("NOT IN GLOSS: "+",".join(notg))
    if len(un)>2: flags.append("NEW>2")
    if not 5<=len(t["gloss"])<=8: flags.append("GLOSS N=%d"%len(t["gloss"]))
    if len(t["qs"])!=3: flags.append("QS")
    lim=(3,4) if w<=3 else ((4,5) if w<=7 else (5,6))
    if not lim[0]<=sents<=lim[1]+1: flags.append("SENT=%d"%sents)
    print(d,"w%d"%w,"new:",un,"sent:",sents,"|"," ".join(flags))
    if flags: bad+=1
print("days:",len(data),"flagged:",bad)
