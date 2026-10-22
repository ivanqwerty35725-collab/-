import json, sys, urllib.error, urllib.request, urllib.parse, ssl
UA = "StyleSheetBot/1.0 (educational project) python-urllib"
ctx = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
def api(params):
    params = dict(params, format="json")
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    import time
    for i in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            r = json.load(urllib.request.urlopen(req, context=ctx)); time.sleep(32); return r
        except urllib.error.HTTPError as e:
            if e.code==429: time.sleep(35); continue
            raise
        except (urllib.error.URLError, ConnectionError, TimeoutError) as e:
            time.sleep(10); continue
mode = sys.argv[1]
if mode == "search":
    for q in sys.argv[2:]:
        d = api({"action":"query","generator":"search","gsrnamespace":6,"gsrlimit":20,"gsrsearch":q,
                 "prop":"imageinfo","iiprop":"size|extmetadata|url","iiextmetadatafilter":"LicenseShortName|Artist"})
        print("==", q)
        for p in (d.get("query",{}).get("pages",{}) or {}).values():
            ii = p.get("imageinfo",[{}])[0]; em = ii.get("extmetadata",{})
            print(f"  {p['title']} | {ii.get('width')}x{ii.get('height')} | {em.get('LicenseShortName',{}).get('value')}")
elif mode == "cat":
    for c in sys.argv[2:]:
        d = api({"action":"query","generator":"categorymembers","gcmtitle":c,"gcmtype":"file","gcmlimit":50,
                 "prop":"imageinfo","iiprop":"size|extmetadata","iiextmetadatafilter":"LicenseShortName"})
        print("==", c)
        for p in (d.get("query",{}).get("pages",{}) or {}).values():
            ii = p.get("imageinfo",[{}])[0]; em = ii.get("extmetadata",{})
            print(f"  {p['title']} | {ii.get('width')}x{ii.get('height')} | {em.get('LicenseShortName',{}).get('value')}")
elif mode == "info":
    for t in sys.argv[2:]:
        d = api({"action":"query","titles":t,"prop":"imageinfo","iiprop":"size|extmetadata|url","iiurlwidth":2000})
        for p in d["query"]["pages"].values():
            ii = p["imageinfo"][0]; em = ii["extmetadata"]
            print(json.dumps({"title":p["title"],"url":ii["url"],"thumb":ii.get("thumburl"),"desc":ii["descriptionurl"],
              "w":ii["width"],"h":ii["height"],
              **{k:em.get(k,{}).get("value") for k in ["LicenseShortName","LicenseUrl","Artist","Credit","ImageDescription","DateTimeOriginal"]}},ensure_ascii=False,indent=1))
elif mode == "get":
    url, out = sys.argv[2], sys.argv[3]
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    open(out,"wb").write(urllib.request.urlopen(req, context=ctx).read())
