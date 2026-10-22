import json,os
P="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_1.json"
d=json.load(open(P))
d.update({
"50":{"hu":"Reggel busszal megyek a munkába. Az iroda a téren van, a bankhoz közel. Délben a boltba megyek. Este villamossal megyek haza. A lakásom a pályaudvarhoz közel van.",
"ru":"Утром я еду на работу на автобусе. Офис находится на площади, недалеко от банка. В полдень я иду в магазин. Вечером я еду домой на трамвае. Моя квартира недалеко от вокзала.",
"gloss":[["busszal","на автобусе (busz + -val → busszal)"],["a munkába","на работу (-ba)"],["a téren","на площади"],["a bankhoz közel","близко к банку (-hoz)"],["a boltba","в магазин"],["villamossal","на трамвае"],["haza","домой"],["a pályaudvarhoz","к вокзалу"]],
"qs":["На чём Кирилл едет на работу?","Где находится офис?","На чём он едет домой вечером?"]},
"51":{"hu":"A barátom Permben lakik. Szombaton a barátomhoz megyek. A barátommal a piacra megyek. A piac a pályaudvarnál van. A piacról busszal megyek haza.",
"ru":"Мой друг живёт в Перми. В субботу я иду к другу. С другом я иду на рынок. Рынок находится у вокзала. С рынка я еду домой на автобусе.",
"gloss":[["a barátom","мой друг"],["a barátomhoz","к моему другу (-hoz)"],["a barátommal","с моим другом (-m + -val → -mmal)"],["a piacra","на рынок (-ra)"],["a pályaudvarnál","у вокзала (-nál)"],["a piacról","с рынка (-ról)"],["busszal","на автобусе"],["haza","домой"]],
"qs":["Куда Кирилл идёт в субботу?","С кем он идёт на рынок?","Где находится рынок?"]},
"52":{"hu":"A nagyapám vonattal jön Liszvából Permbe. A vonat a pályaudvarra jön. A nagyapámmal a pályaudvarról a lakásomba megyek. Vasárnap a nagyapám a templomba jár. A templom a tértől nem messze van.",
"ru":"Мой дед едет на поезде из Лысьвы в Пермь. Поезд приходит на вокзал. С дедом я иду с вокзала в свою квартиру. В воскресенье дед ходит в церковь. Церковь недалеко от площади.",
"gloss":[["vonattal","на поезде"],["jön","приходит, приезжает"],["Liszvából","из Лысьвы (-ból)"],["Permbe","в Пермь (-be)"],["a nagyapámmal","с моим дедом"],["a pályaudvarról","с вокзала"],["a templomba jár","ходит в церковь"],["messze","далеко"]],
"qs":["Откуда и куда едет дед?","Куда Кирилл идёт с дедом с вокзала?","Куда дед ходит в воскресенье?"]},
"53":{"hu":"– Hova mész, Kirill?\n– A bankba megyek.\n– Busszal?\n– Nem, villamossal.\n– És honnan jössz?\n– Az irodából jövök.",
"ru":"– Куда ты идёшь, Кирилл?\n– Я иду в банк.\n– На автобусе?\n– Нет, на трамвае.\n– А откуда ты идёшь?\n– Я иду из офиса.",
"gloss":[["hova","куда"],["mész","ты идёшь"],["a bankba","в банк"],["busszal","на автобусе"],["villamossal","на трамвае"],["honnan","откуда"],["jössz","ты идёшь (сюда), приходишь"],["az irodából","из офиса"]],
"qs":["Куда идёт Кирилл?","На чём он едет?","Откуда он идёт?"]},
"54":{"hu":"Csománfalva Kárpátalján van, Técsőhöz közel. Csománfalváról Técsőre busz jár. Técsőről Ungvárra vonattal lehet menni. Ungvárról Budapestre vonat jár. A nagyapám Csománfalván született, és most az Urálban él.",
"ru":"Чумалёво находится в Закарпатье, недалеко от Тячева. Из Чумалёва в Тячев ходит автобус. Из Тячева в Ужгород можно доехать на поезде. Из Ужгорода в Будапешт ходит поезд. Мой дед родился в Чумалёве, а сейчас живёт на Урале.",
"gloss":[["Técsőhöz közel","близко к Тячеву"],["Csománfalváról","из Чумалёва (-ról)"],["Técsőre","в Тячев (-re)"],["jár","ходит (регулярно)"],["Ungvárra","в Ужгород"],["menni","ехать, идти (инфинитив от megy)"],["Ungvárról","из Ужгорода"],["Budapestre","в Будапешт"]],
"qs":["Рядом с каким городом находится Чумалёво?","Как добраться из Тячева в Ужгород?","Куда ходит поезд из Ужгорода?"]},
"55":{"hu":"Az édesanyám tanár, az iskolában dolgozik. Reggel fél nyolckor megy az iskolába. Az iskola a templomhoz közel van. Délután az iskolából a boltba megy. Este a boltból megy haza. Vasárnap az édesapámmal a piacra jár.",
"ru":"Моя мать учительница, она работает в школе. Утром в половине восьмого она идёт в школу. Школа находится недалеко от церкви. После полудня она идёт из школы в магазин. Вечером из магазина она идёт домой. В воскресенье она с моим отцом ходит на рынок.",
"gloss":[["az iskolában","в школе"],["az iskolába","в школу"],["a templomhoz közel","близко к церкви"],["az iskolából","из школы"],["a boltba","в магазин"],["a boltból","из магазина"],["haza","домой"],["az édesapámmal","с моим отцом"]],
"qs":["Во сколько мать идёт в школу?","Куда она идёт после школы?","С кем она ходит на рынок в воскресенье?"]},
"56":{"hu":"Permből Budapestre nincs repülő. Permből Moszkvába repülővel megyek. Moszkvából Budapestre repülő jár. Budapesten metró és villamos van. A konzulátus Moszkvában van, és Moszkvába vonattal lehet menni.",
"ru":"Из Перми в Будапешт нет самолёта. Из Перми в Москву я лечу на самолёте. Из Москвы в Будапешт летает самолёт. В Будапеште есть метро и трамвай. Консульство находится в Москве, а в Москву можно доехать на поезде.",
"gloss":[["Permből","из Перми (-ből)"],["Budapestre","в Будапешт"],["nincs repülő","нет самолёта"],["Moszkvába","в Москву"],["repülővel","на самолёте"],["Budapesten","в Будапеште (-n)"],["konzulátus","консульство"],["menni","ехать (инфинитив)"]],
"qs":["Есть ли самолёт из Перми в Будапешт?","Какой транспорт есть в Будапеште?","Где находится консульство?"]},
})
json.dump(d,open(P,"w"),ensure_ascii=False,indent=0)
