import json, re, sys, os
HU = '/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu'
sys.path.insert(0, HU)
import io, contextlib
from words import WORDS
with contextlib.redirect_stdout(io.StringIO()):
    from gen import W
from content import DICT, EX, LISTEN
OUT = HU + '/texts_3.json'

def norm(s):
    s = s.lower()
    for a, b in (('á','a'),('é','e'),('í','i'),('ó','o'),('ő','ö'),('ú','u'),('ű','ü')):
        s = s.replace(a, b)
    return s

def toks(s):
    return [t for t in re.findall(r"[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű]+", s)]

FUNC = """a az egy én te ő mi ti ők ez ezt ezek ezeket ennek annak erre arra ezzel azzal ettől attól ehhez ahhoz ezen azon erről arról
itt ott ide oda így úgy is csak még már nem igen hogy de mert és ha akkor aztán azután mint nap napot napon napja napján hét héten hete hetet
ezután melyik kik mik hol hova honnan mikor miért milyen hogyan hány mennyi ki mi kit mit kivel mivel kinek minek miről kiről miben kiben kihez mihez mire kire kiket miket
nekem neked neki nekünk nektek nekik engem téged őt minket titeket őket velem veled vele velünk veletek velük tőlem tőled tőle tőlünk tőlük
hozzám hozzád hozzá hozzánk hozzájuk nálam nálad nála nálunk náluk rólam rólad róla rólunk róluk bennem benned benne bennünk bennük
magam magad maga magunk magatok maguk saját
egy két kettő három négy öt hat hét nyolc kilenc tíz tizen tizenegy tizenkét tizenöt húsz huszon harminc negyven ötven hatvan hetven nyolcvan kilencven száz ezer millió
első második harmadik negyedik ötödik hatodik hetedik nyolcadik kilencedik tizedik
úr nincs nincsenek volt voltak voltam voltál voltunk vagyunk vagytok vannak van vagyok vagy
jó jól szép sok sokat kevés
""".split()
PROPER = """kirill iván mária fjodor babics anna alekszinec liszva liszvai perm permi csománfalva csománfalvai újbárd kárpátalja kárpátaljai técső técsői ungvár ungvári beregszász beregszászi
budapest budapesti urál uráli máramaros franciaország francia jekatyerinburg moszkva trianon trianoni csehszlovákia csehszlovák szovjetunió szovjet magyar királyság európa európai unió duna tisza kárpátok jandex debrecen szeged pécs orosz ukrajna ukrán oroszország magyarország
zsófi gábor szása gyima szergej cseh monarchia szlovákia románia ausztria buda pest káma szibéria lengyelország ausztria bécs kijev huszt rahó lemberg ural kama csusovaja
""".split()
PREFIXES = ['fel','le','be','ki','meg','el','vissza','át','haza','össze','oda','ide','végig']
SUFFIXES = """nak nek ban ben ból ből ba be ra re ról ről val vel hoz hez höz nál nél tól től on en ön n t k ig kor ként ul ül ért
tam tem tál tél ott ett ött tak tek tuk tük ta te tad ted tunk tünk tátok tétek ták ték tok tök
om em öm od ed öd ja je a e i juk jük uk ük unk ünk ok ek ök ak at et ot öt im id ai ei aim eim aid eid jai jei lak lek sz ol el ik
va ve ás és ság ség bb an il ni as es os ös s ű ú ú ú ú jon jen jön j d l talan telen ú ű
""".split()
SUFFIXES = sorted(set(norm(x) for x in SUFFIXES), key=len, reverse=True)
NUM = re.compile(r"^(egy|ket|kettö|harom|negy|öt|hat|het|nyolc|kilenc|tiz|tizen|huszon|husz|harminc|negyven|ötven|hatvan|hetven|nyolcvan|kilencven|szaz|ezer|millio)+[a-zöü]{0,6}$")

def allowed_for(w):
    S = set()
    def add(s):
        for t in toks(s):
            S.add(norm(t))
    for k in range(1, w+1):
        for hu, ru in WORDS[k]:
            add(hu)
        for g in W[k-1][1]:
            add(g)
        add(W[k-1][5])
        for hu, ru in DICT.get(k, []):
            add(hu)
        for q, opts, ans, expl in EX.get(k, []):
            add(q); add(ans)
        if k in LISTEN:
            add(LISTEN[k][0])
    for f in FUNC: S.add(norm(f))
    for p in PROPER: S.add(norm(p))
    # prefix-stripped verbs
    extra = set()
    for s in S:
        for p in PREFIXES:
            if s.startswith(p) and len(s) - len(p) >= 3:
                extra.add(s[len(p):])
    S |= extra
    # vowel-dropping stems: történelem -> történelm, bokor -> bokr
    vd = set()
    for s in S:
        m = re.match(r'^(.*[bcdfghjklmnprstvzyx])([aeiouö])([bcdfghjklmnprstvzyx])$', s)
        if m and len(s) >= 5:
            vd.add(m.group(1) + m.group(3))
    S |= vd
    return S

def known(tok, S):
    t = norm(tok)
    if NUM.match(t): return True
    cands = {t}
    frontier = [t]
    for _ in range(3):
        nxt = []
        for c in frontier:
            for suf in SUFFIXES:
                if c.endswith(suf) and len(c) - len(suf) >= 3:
                    st = c[:-len(suf)]
                    if st not in cands:
                        cands.add(st); nxt.append(st)
                    # handle a->á lengthening (normalized already) nothing
        frontier = nxt
    for c in cands:
        if c in S: return True
        for s in ('ir','el','ad','uj','nö','jo','ül','lo','ev','ut','ok','ö','ök','ad','hö','fö','fa','ma','eg'):
            if s in S and c.startswith(s) and len(c) <= 6: return True
        if len(c) >= 4:
            for s in S:
                if len(s) >= 4 and (s.startswith(c) or c.startswith(s)):
                    return True
    # igekötő-prefixed form of known verb
    for p in PREFIXES:
        if t.startswith(p) and len(t) - len(p) >= 4:
            if known(t[len(p):], S): return True
    return False

def sentences(txt):
    body = re.sub(r'^\s*–\s*', '', txt, flags=re.M)
    parts = [p for p in re.split(r'[.!?…]+[”"]?(?:\s|$)', body) if p.strip()]
    return len(parts)

def check_day(d, e, verbose=True):
    w = (d - 1) // 7 + 1
    S = allowed_for(w)
    hu = e['hu']
    issues = []
    is_dlg = hu.lstrip().startswith('–')
    if is_dlg:
        lines = [l for l in hu.split('\n') if l.strip()]
        if not (8 <= len(lines) <= 10): issues.append(f'dialog lines={len(lines)}')
    else:
        n = sentences(hu)
        if not (7 <= n <= 9): issues.append(f'sentences={n}')
    if not (8 <= len(e['gloss']) <= 10): issues.append(f'gloss={len(e["gloss"])}')
    if len(e['qs']) != 3: issues.append('qs!=3')
    # grammar bans
    low = ' ' + norm(hu) + ' '
    bans = []
    if w < 25:
        for f in ['fog ', 'fogok ', 'fogsz ', 'fogunk ', 'fognak ', 'fogja ', 'fogom ', 'majd ', 'jövőre']:
            if ' ' + f in low: bans.append(f)
    if w < 26:
        for f in ['ön ', 'önök ', 'önnek ', 'önt ', 'önnel ', 'önnél ', 'önöknek ']:
            if ' ' + f in low: bans.append(f)
    if w < 27:
        for f in ['aki', 'ami ', 'amit', 'amely', 'ahol', 'amikor', 'akit', 'akik', 'amik', 'pedig', 'vagy ', 'sem ']:
            if ' ' + f in low: bans.append(f)
    if w < 28:
        for f in ['mindig', 'soha', 'gyakran', 'ritkán', 'néha', 'szoktam', 'szokott']:
            if ' ' + f in low: bans.append(f)
    if w < 31:
        for f in [' nagyon', ' inkább', ' jobban', ' túl ']:
            if f in low: bans.append(f.strip())
        if re.search(r'\bleg[a-zöü]+bb\b', low): bans.append('leg-bb')
    if bans: issues.append('BAN:' + ','.join(bans))
    # vocab
    unk = []
    gl = ' '.join(norm(g[0]) for g in e['gloss'])
    sent_starts = set()
    for m in re.finditer(r'(?:^|[.!?–]\s*)([A-ZÁÉÍÓÖŐÚÜŰ][^\s]*)', hu, flags=re.M):
        sent_starts.add(m.group(1))
    for tok in toks(hu):
        if tok[0].isupper() and tok not in sent_starts and norm(tok) not in S:
            # proper noun not in list - check stem
            if not known(tok, S):
                unk.append(tok + '(P)')
            continue
        if known(tok, S): continue
        unk.append(tok)
    unk_u = []
    for u in unk:
        if u not in unk_u: unk_u.append(u)
    notgl = [u for u in unk_u if norm(u.rstrip('(P)')) not in gl]
    if len(unk_u) > 4: issues.append(f'new>{4}: {unk_u}')
    if notgl: issues.append(f'not in gloss: {notgl}')
    if verbose:
        print(d, 'w', w, 'OK' if not issues else issues, '| unk:', unk_u)
    return issues

if __name__ == '__main__':
    data = json.load(open(OUT))
    ks = sorted(int(k) for k in data)
    sel = [int(a) for a in sys.argv[1:]] or ks
    bad = 0
    for k in sel:
        if str(k) not in data: print(k, 'MISSING'); bad += 1; continue
        if check_day(k, data[str(k)]): bad += 1
    print('days', len(ks), 'bad', bad)
