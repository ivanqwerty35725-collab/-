import json, sys, time, urllib.parse, urllib.request, ssl, os
ctx = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
UA = "HuLessonEdu/1.0 (educational video project) python-urllib/3.13"
def get(url, tries=9):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            return urllib.request.urlopen(req, context=ctx, timeout=60).read()
        except Exception as e:
            print("retry", e, file=sys.stderr); time.sleep(5 + 8*i); err = e
    raise err
def api(**p):
    p.update(format="json")
    return json.loads(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(p)))
def search(q, n=20):
    return [r["title"] for r in api(action="query", list="search", srsearch=q, srnamespace=6, srlimit=n)["query"]["search"]]
def info(titles, thumb=None):
    p = dict(action="query", titles="|".join(titles), prop="imageinfo", iiprop="url|size|extmetadata")
    if thumb: p["iiurlwidth"] = thumb
    r = api(**p)
    out = []
    for pg in r["query"]["pages"].values():
        ii = pg.get("imageinfo", [{}])[0]
        em = ii.get("extmetadata", {})
        g = lambda k: em.get(k, {}).get("value", "")
        out.append(dict(title=pg["title"], w=ii.get("width"), h=ii.get("height"), url=ii.get("url"), thumb=ii.get("thumburl"),
            page=ii.get("descriptionurl"), lic=g("LicenseShortName"), artist=g("Artist")[:120], date=g("DateTimeOriginal")[:80], obj=g("ObjectName")[:120], size=ii.get("size")))
    return out
if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "search":
        for t in search(sys.argv[2]): print(t)
    elif cmd == "info":
        for d in info(sys.argv[2:]): print(json.dumps(d, ensure_ascii=False))
    elif cmd == "dl":
        open(sys.argv[3], "wb").write(get(sys.argv[2]))
