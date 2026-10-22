import json,os
P="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_1.json"
d=json.load(open(P))
d.update({
"57":{"hu":"– Elnézést, hol van a pályaudvar?\n– Egyenesen, és a hídnál jobbra.\n– Messze van?\n– Nem, közel van.\n– Köszönöm!\n– Kérem.",
"ru":"– Простите, где вокзал?\n– Прямо, а у моста направо.\n– Это далеко?\n– Нет, близко.\n– Спасибо!\n– Пожалуйста.",
"gloss":[["elnézést","простите"],["hol van a pályaudvar","где вокзал"],["egyenesen","прямо"],["a hídnál","у моста (-nál)"],["jobbra","направо"],["messze","далеко"],["közel","близко"],["kérem","пожалуйста (в ответ на спасибо)"]],
"qs":["Что ищет Кирилл?","Куда нужно повернуть у моста?","Далеко ли вокзал?"]},
"58":{"hu":"Permből Liszvába vonattal utazom. A vonat reggel nyolckor indul, és tizenegykor érkezik Liszvába. A jegy nem drága. Liszva kicsi város az Urálban, Permtől nem messze. Az úton erdő és folyó van.",
"ru":"Из Перми в Лысьву я еду на поезде. Поезд отправляется утром в восемь и прибывает в Лысьву в одиннадцать. Билет недорогой. Лысьва — маленький город на Урале, недалеко от Перми. По дороге лес и река.",
"gloss":[["utazom","я еду, путешествую"],["indul","отправляется"],["érkezik","прибывает"],["a jegy","билет"],["Permtől","от Перми (-től)"],["messze","далеко"],["az úton","в пути, на дороге"],["erdő és folyó","лес и река"]],
"qs":["Во сколько отправляется поезд?","Во сколько он прибывает в Лысьву?","Что видно по дороге?"]},
"59":{"hu":"Ungvárról Csománfalvára busszal lehet utazni. Csománfalva messze van Ungvártól. Az út: Ungvárról Beregszászra, Beregszászról Técsőre, Técsőről Csománfalvára. Csománfalva a Tisza folyónál van. Ott erdő és hegy van.",
"ru":"Из Ужгорода в Чумалёво можно доехать на автобусе. Чумалёво далеко от Ужгорода. Путь: из Ужгорода в Берегово, из Берегова в Тячев, из Тячева в Чумалёво. Чумалёво находится у реки Тисы. Там лес и горы.",
"gloss":[["Ungvárról","из Ужгорода"],["Csománfalvára","в Чумалёво (-ra)"],["utazni","ехать, путешествовать"],["messze","далеко"],["Ungvártól","от Ужгорода"],["Beregszászra","в Берегово"],["a Tisza folyónál","у реки Тисы"],["hegy","гора"]],
"qs":["На чём можно доехать из Ужгорода в Чумалёво?","Через какие города идёт путь?","У какой реки находится Чумалёво?"]},
"60":{"hu":"Kárpátalja Ukrajnában van, a magyar határnál. Beregszász a határhoz közel van. Beregszászról Magyarországra vonat jár. A határon útlevél kell. Kárpátalja Permtől messze van: Kirill most nem utazik.",
"ru":"Закарпатье находится в Украине, у венгерской границы. Берегово находится близко к границе. Из Берегова в Венгрию ходит поезд. На границе нужен паспорт. Закарпатье далеко от Перми: Кирилл сейчас не едет.",
"gloss":[["Kárpátalja","Закарпатье"],["a határnál","у границы"],["a határhoz közel","близко к границе"],["Magyarországra","в Венгрию (-ra)"],["jár","ходит (регулярно)"],["a határon","на границе"],["útlevél","паспорт"],["utazik","едет, путешествует"]],
"qs":["Где находится Закарпатье?","Какой город близко к границе?","Что нужно на границе?"]},
"61":{"hu":"Reggel az irodába megyek. A lakásomból balra megyek, az utcán egyenesen. A hídnál jobbra, és itt van a tér. Az iroda a téren van, a bankhoz közel. Az iroda nincs messze, nem kell busszal menni.",
"ru":"Утром я иду в офис. Из своей квартиры я иду налево, по улице прямо. У моста направо, и вот площадь. Офис находится на площади, близко к банку. Офис недалеко, не нужно ехать на автобусе.",
"gloss":[["az irodába","в офис"],["a lakásomból","из моей квартиры"],["balra","налево"],["az utcán","по улице, на улице"],["egyenesen","прямо"],["a hídnál jobbra","у моста направо"],["itt van a tér","вот площадь"],["menni","ехать (инфинитив)"]],
"qs":["Куда Кирилл поворачивает, выходя из квартиры?","Где находится офис?","Нужно ли ему ехать на автобусе?"]},
"62":{"hu":"A nagyapám Csománfalván született, és most az Urálban él. Csománfalva messze van az Uráltól. Az út Técsőről vonattal Moszkvába megy, Moszkvából Permbe. Permből Liszvába busz jár. Az Urálban hegy, erdő és folyó van. Liszva az erdőben van, a hegynél.",
"ru":"Мой дед родился в Чумалёве, а сейчас живёт на Урале. Чумалёво далеко от Урала. Путь идёт из Тячева на поезде в Москву, из Москвы в Пермь. Из Перми в Лысьву ходит автобус. На Урале горы, леса и реки. Лысьва находится в лесу, у горы.",
"gloss":[["az Urálban","на Урале"],["az Uráltól","от Урала"],["Técsőről","из Тячева"],["Moszkvába","в Москву"],["hegy","гора"],["erdő","лес"],["folyó","река"],["az erdőben","в лесу"]],
"qs":["Где родился дед и где он живёт сейчас?","Как идёт путь из Тячева на Урал?","Где находится Лысьва?"]},
"63":{"hu":"Holnap Moszkvába utazom. A vonat este hatkor indul Permből, és reggel érkezik Moszkvába. A jegy az asztalon van. A konzulátus Moszkvában van, a metróhoz közel. Moszkvából vasárnap jövök haza.",
"ru":"Завтра я еду в Москву. Поезд отправляется из Перми вечером в шесть и прибывает в Москву утром. Билет лежит на столе. Консульство находится в Москве, близко к метро. Из Москвы я возвращаюсь домой в воскресенье.",
"gloss":[["holnap","завтра"],["utazom","я еду"],["indul","отправляется"],["érkezik","прибывает"],["a jegy","билет"],["konzulátus","консульство"],["a metróhoz közel","близко к метро"],["haza","домой"]],
"qs":["Куда Кирилл едет завтра?","Во сколько отправляется поезд?","Когда Кирилл возвращается домой?"]},
})
json.dump(d,open(P,"w"),ensure_ascii=False,indent=0)
