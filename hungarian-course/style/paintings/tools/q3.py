import sys, json, time; sys.path.insert(0, sys.argv[1])
import wm
T = ["File:Билибин img606.jpg", "File:Иван К. Айвазовский - Бриг Меркурий после победы над двумя турецкими кораблями (1848).jpg", "File:Brjullov Italianskij Poldenj.jpg"]
d = wm.api(action="query", titles="|".join(T), prop="imageinfo", iiprop="url|size|extmetadata")
for p in d["query"]["pages"].values():
    ii = p["imageinfo"][0]; em = ii["extmetadata"]
    print(json.dumps({"title": p["title"], "w": ii["width"], "h": ii["height"], "url": ii["url"], "page": ii["descriptionurl"],
        **{k: em.get(k, {}).get("value") for k in ["LicenseShortName", "License", "LicenseUrl", "Artist", "ObjectName", "DateTimeOriginal", "Credit", "ImageDescription", "Copyrighted", "UsageTerms"]}}, ensure_ascii=False))
time.sleep(20)
d = wm.api(action="parse", page=T[0], prop="wikitext")
print("WIKITEXT0", d["parse"]["wikitext"]["*"][:3000])
for t in T[1:]:
    time.sleep(20)
    d = wm.api(action="parse", page=t, prop="wikitext")
    print("WIKITEXT", t, d["parse"]["wikitext"]["*"][:3000])
