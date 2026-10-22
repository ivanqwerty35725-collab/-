import sys, json, re, runpy, unicodedata, os
BASE="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu"
WORDS=runpy.run_path(BASE+"/words.py")["WORDS"]
OUT=BASE+"/texts_4.json"

def deacc(s):
    s=s.replace('ő','o').replace('ű','u').replace('Ő','o').replace('Ű','u')
    return ''.join(c for c in unicodedata.normalize('NFD',s) if unicodedata.category(c)!='Mn').lower()

FUNC=set("""én te ő mi ti ők ön önök engem téged őt minket titeket őket önt önöket nekem neked neki nekünk nektek nekik önnek önöknek
velem veled vele velünk veletek velük önnel tőlem tőled tőle tőlünk tőlük róla rólam rólad róluk rólunk nálam nálad nála nálunk náluk hozzám hozzád hozzá hozzánk hozzájuk
bennem benned benne bennünk bennük belőle rám rád rá ránk rájuk érte értem értünk ellene
magam magad maga magunk magatok maguk magát magának magamat magammal magunkat magáról magamról magamnak
ez az ezt azt ezek azok ezeket azokat ennek annak ebben abban ebből abból ebbe abba ezen azon erre arra erről arról ehhez ahhoz ettől attól ezzel azzal ezekben azokban ezekre ezekkel azokkal ezeknek
ilyen olyan ilyet olyat ilyenek olyanok ennyi annyi ennyit annyit így úgy ugyanaz ugyanazt ugyanott ugyanígy
ki kik kit kinek mi mit minek mivel mire hol hova hová honnan mikor miért hogyan hogy hány hányan mennyi mennyit milyen melyik melyiket meddig mióta
aki akik akit akinek akivel ami amit amiről amivel amely amelyet amelyik ahol ahova ahonnan amikor amíg ahogy amennyi
és de vagy hogy ha mert hiszen pedig is sem se nem ne csak még már mindig soha néha gyakran ritkán talán persze igen nagyon túl eléggé inkább
itt ott ide oda innen onnan most ma holnap tegnap holnapután tegnapelőtt majd aztán azután akkor ekkor azóta ezért azért tehát
minden mindent mindenki mindenkit mindenkinek mindenhol mindenhova mindenből mindenre mindenről mindennap semmi semmit senki senkit senkinek valaki valakit valakinek valami valamit valamilyen valahol valahova valamikor bármi bármit bárki bárhol mind mindkét mindegyik egyik másik másikat mások másokat más mást több többet többi többiek legtöbb kevesebb kevesebbet sok sokat sokan sokszor sokáig kevés keveset
van vannak nincs nincsenek sincs sincsenek volt voltak voltam voltál voltunk voltatok lesz leszek lesznek leszünk lesztek lenne lennék lennének volna legyen legyek legyünk legyenek lenni lehet lehetett lehetne lehetnek lehetséges
kell kellett kellene kelljen szabad fog fogok fogsz fogunk fogja fogom fogjuk fogják tud tudok tudsz tudunk tudja tudom tudjuk tudják tudott tudtam tudta tudtuk tudtad tudni tudjon tudjam
jó jól jobb jobban legjobb rossz rosszul rosszabb nagy nagyobb kicsi kis kisebb új régi régebben hosszú rövid röviden egész egészen fél
el meg ki be fel le át vissza haza oda ide össze szét rá hozzá végig tovább elő előre
egy két kettő három négy öt hat hét nyolc kilenc tíz
nap napot napon napja napján napig napra napok napokat naponta hét hete héten hetet hetente hetes év éve évet évben évig évek évente éves évesen hónap hónapot hónapja hónapban hónapig hónapja perc percet percig percre percen
úr úrnak urat uram asszony asszonynak
szintén mégis szintén egyáltalán főleg szinte majdnem éppen pont pontosan először másodszor utoljára végre
apja anyja fia lánya fiát fiának apját anyját apjának anyjának fiai lányai
ág ága ágról ágon ágat ágak ágból ágán
él élt éltem éltek élünk élnek élni élek élsz élje éljen élt
ad adok adsz adja adom adunk adnak adott adtam adtad adta adtuk adták adni adjon adjak adják adjuk
ír írok írsz írja írom írunk írnak írt írtam írtad írta írtuk írták írni írjon írjak írják írjuk
hónapon hónappal hónapot hónapom hónapja hónapig enyém tiéd övé ezelőtt köszönjük köszöni nulla nullára hosszan annyit ennyit véget korában ban ben ra re val vel hoz hez höz övék ugyanolyan múltját múltja ár ára árak árakat árát árai nálatok nálunk gyors gyorsan gyorsabban nappal vége végén végére végéig elején eleje közepén legnagyobb legkisebb kor korban pontot pontokat pontja lassan lassabban rosszat múlt út útja útját úton útra utat ugyanekkor ugyanitt igazi mellé alá elé mögé közé fölé mik jók igazak előtte utána mellette közötte hanem újra ugyanilyen tesz teszek teszünk teszi tette tettem tenni tegye tegyen sokan
igaz igazán biztos biztosan rajta rajtam rajtad rajtunk rajtuk ugyanazon ugyanúgy ugyanakkor
""".split())
FUNCD=set(deacc(f) for f in FUNC)
IGEK=["el","meg","ki","be","fel","le","at","vissza","haza","oda","ide","ossze","szet","ra","hozza","vegig","tovabb","elo"]
NUMRX=re.compile(r"^(egy|ket|harom|negy|ot|hat|het|nyolc|kilenc|tiz|tizen|husz|huszon|harminc|negyven|otven|hatvan|hetven|nyolcvan|kilencven|szaz|ezer|millio|ezred|szazad|elso|masodik|harmadik|negyedik|otodik|hatodik|hetedik|nyolcadik|kilencedik|tizedik)")
PROPER=set(deacc(x) for x in """Kirill Iván Ivánt Ivánnal Mária Máriával Babics Babicsék Fjodor Anna Alekszinec Liszva Liszvában Liszvába Liszvából Liszvai Perm Permben Permbe Permből Permi Csománfalva Csománfalván Csománfalvára Csománfalváról Csománfalvai Újbárd Újbárdon Újbárdról Kárpátalja Kárpátalján Kárpátaljára Kárpátaljáról Kárpátaljai Máramaros Máramarosban Máramarosi Beregszász Beregszászon Beregszászi Técső Técsőn Técsői Ungvár Ungváron Moszkva Moszkvában Moszkvába Moszkvából Moszkvai Budapest Budapesten Budapestre Budapestről Budapesti Franciaország Franciaországban Franciaországba Francia Urál Urálba Urálban Uráli Oroszország Oroszországban Oroszországból Orosz Ukrajna Ukrajnában Ukrajnából Ukrán Magyarország Magyarországon Magyarországra Magyarországról Magyar Csehszlovákia Csehszlovákiához Csehszlovák Szovjetunió Szovjetunióhoz Szovjet Európa Európában Európába Európai Jandex Zoltán Zoli Zolival Eszter Eszterrel Trianon Tisza Duna Kárpátok Kárpátokban Jekatyerinburg Jekatyerinburgba Jekatyerinburgban Kama Szibéria Szibériában Balaton Balatonnál Balatonon Kossuth Dunántúl Dunántúlon Prága Prágában Debrecen Debrecenben Debrecenbe Debrecenből Mátyás Zoltánnak Zoltánnal Zoltán Zolival Zoli Lenin Tandem Tandemen Anki Duolingo Alaptörvény Alaptörvényt Himnusz PGGPU Fjodorovics Fjodorovna Ivanovics Ivanovna Pável Pávellel Szentpétervár Szentpétervárra Szentpéterváron Balaton Balatonon Bécs Bécsbe Bécsben Prága Kijev Kijevben Lviv Lvivben Csernyivci Eger Egerben Pécs Pécsen Szeged Szegeden Dnyeper Volga Ural Franciaországból Ivánnak Máriának Kirillnek Kirillt Kirillel Kirillnél Fjodort Fjodornak Annát Annának Ivánról Fjodorról Annáról Máriáról Kirillről Ivánék Oroszországra Ukrajnára Técsőre Técsőről Beregszászra Beregszászról Ungvárra Ungvárról Lille Lille-ben Lyon Lyonban Párizs Párizsban Párizsba Csehszlovákiában Csehszlovákiába Szovjetunióban Szovjetunióba Technikum Szverdlovszk Szverdlovszkban Krasznokamszk IT Tokaj Tokaji Szása Szásával Törökország Törökországban Kazahsztán Kazahsztánban Isztambul Isztambulon Parlament Parlamentet Buda Budai Pest Pesti""".split())

EXTRA=['szulet','internet','gyakorl','ertesit','ujsag','aggod','ismetel','program','koltoz','mutat','dokumentum','bizonyit','fordit','segit','szulo','elet','nev']
def stems(upto):
    S=[(e,e) for e in EXTRA]
    for w in range(1,upto+1):
        for h,r in WORDS[w]:
            for part in re.split(r"[\s/,?!()–-]+",h):
                p=deacc(part.strip("-.?!"))
                if not p: continue
                if p.endswith("ik") and len(p)>=5: st=p[:-2]
                elif len(p)>=4: st=p[:-1]
                else: st=p
                S.append((st,p))
                for ig in IGEK:
                    if p.startswith(ig) and len(p)>=len(ig)+4:
                        q=p[len(ig):]
                        S.append((q[:-1] if len(q)>=4 else q, q))
    return S

def known(tok,S):
    t=deacc(tok)
    if t in FUNC or deacc(tok) in set(deacc(f) for f in FUNC): return True
    if NUMRX.match(t): return True
    if t in PROPER: return True
    if tok[0].isupper() and t.rstrip("-") in PROPER: return True
    for st,p in S:
        if t==p or (len(st)>=3 and t.startswith(st)): return True
    if t.startswith('leg') and len(t)>6:
        r=t[3:]
        if r in FUNCD or any(r==p or (len(st)>=3 and r.startswith(st)) for st,p in S): return True
    for ig in IGEK:
        if t.startswith(ig) and len(t)>len(ig)+2:
            rest=t[len(ig):]
            if rest in FUNCD: return True
            for st,p in S:
                if rest==p or (len(st)>=3 and rest.startswith(st)): return True
    return False

SUF=set("lal val vel ban ben t ra re en on n ba be ból ből nak nek hoz hez höz tól től ról ről e es as os ös".split())
def toks(text):
    out=[]
    for x in re.findall(r"[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű][A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű-]*",text):
        if x.lower().startswith("e-mail"): continue
        for i,part in enumerate(x.split("-")):
            if not part: continue
            if i>0 and part.lower() in SUF: continue
            if len(part)<=2 and part.lower() not in ('én','te','ő','ők','ön','ez','az','ki','mi','is','de','ha','ne','el','ki','be','le','fel','át','rá','jó','ma','ad','ír','él','út','év','ág'): continue
            out.append(part)
    return out

def check(day,item):
    w=(day-1)//7+1
    S=stems(w)
    unk={}
    for tk in toks(item["hu"]):
        if not known(tk,S):
            unk.setdefault(deacc(tk),tk)
    gl=[deacc(g[0]) for g in item["gloss"]]
    glstems=[]
    for g in gl:
        for part in re.split(r"[\s/,?!()–-]+",g):
            if part: glstems.append(part)
    missing=[]
    for k,orig in unk.items():
        ok=False
        for g in glstems:
            st=g[:-1] if len(g)>=4 else g
            if k==g or (len(st)>=3 and k.startswith(st)) or g.startswith(k): ok=True
        if not ok: missing.append(orig)
    sents=len(re.findall(r"[.!?](\s|$)",item["hu"]))
    lines=item["hu"].count("–")
    return dict(week=w,unknown=list(unk.values()),missing=missing,ngloss=len(item["gloss"]),nq=len(item["qs"]),sents=sents,lines=lines,chars=len(item["hu"]))

if __name__=="__main__":
    src=sys.argv[1]
    new=runpy.run_path(src)["T"]
    data={}
    if os.path.exists(OUT):
        data=json.load(open(OUT,encoding="utf-8"))
    for d,item in new.items():
        r=check(int(d),item)
        flag=""
        if len(r["unknown"])>5: flag+=" TOO_MANY_NEW"
        if r["missing"]: flag+=" MISSING_IN_GLOSS"
        if not (8<=r["ngloss"]<=12): flag+=" GLOSS_COUNT"
        if r["nq"]!=3: flag+=" QS"
        print(d, f"w{r['week']} sents={r['sents']} lines={r['lines']} chars={r['chars']} gloss={r['ngloss']} new={len(r['unknown'])}:{r['unknown']} missing={r['missing']}{flag}")
        data[str(d)]=item
    json.dump(data,open(OUT,"w",encoding="utf-8"),ensure_ascii=False,indent=1)
    json.load(open(OUT,encoding="utf-8"))
    print("saved",len(data),"keys")
