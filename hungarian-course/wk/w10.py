import json,os
P="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_1.json"
d=json.load(open(P))
d.update({
"64":{"hu":"Reggel hétkor reggelizem. Reggelire kenyeret, sajtot és tojást eszem. Kávét iszom, tejjel. Délben az irodában ebédelek: levest és húst. Este vacsorázom: hal és krumpli van, és teát iszom. Éhes vagyok!",
"ru":"Утром в семь я завтракаю. На завтрак я ем хлеб, сыр и яйцо. Я пью кофе с молоком. В полдень я обедаю в офисе: суп и мясо. Вечером я ужинаю: рыба и картошка, и я пью чай. Я голоден!",
"gloss":[["reggelire","на завтрак (-re)"],["kenyeret","хлеб (вин. п. -t)"],["eszem","я ем"],["kávét","кофе (вин. п.)"],["iszom","я пью"],["tejjel","с молоком (tej + -vel → tejjel)"],["levest és húst","суп и мясо (вин. п.)"],["éhes","голодный"]],
"qs":["Что Кирилл ест на завтрак?","Что он пьёт утром?","Что он ест на ужин?"]},
"65":{"hu":"A nagyapám jól tud főzni. Vasárnap gulyást főz. A gulyásban hús, krumpli és víz van. A nagyapám bort nem iszik, sört iszik. Éhes vagyok, a gulyás finom! Vasárnap a családom Liszvában ebédel.",
"ru":"Мой дед хорошо умеет готовить. В воскресенье он варит гуляш. В гуляше мясо, картошка и вода. Дед не пьёт вино, он пьёт пиво. Я голоден, гуляш вкусный! В воскресенье моя семья обедает в Лысьве.",
"gloss":[["főz","варит, готовит"],["gulyást","гуляш (вин. п.)"],["a gulyásban","в гуляше"],["hús, krumpli és víz","мясо, картошка и вода"],["bort","вино (вин. п.)"],["sört","пиво (вин. п.)"],["éhes","голодный"],["finom","вкусный"]],
"qs":["Что готовит дед в воскресенье?","Что в гуляше?","Что пьёт дед: вино или пиво?"]},
"66":{"hu":"Permben a boltok nagyok, a piacok kicsik. A piacon almák, halak és sajtok vannak. A halak nem drágák. Az almák finomak. Az édesanyám a piacra jár: ott a tojások nem drágák. A nagy boltok drágák.",
"ru":"В Перми магазины большие, рынки маленькие. На рынке есть яблоки, рыба и сыры. Рыба недорогая. Яблоки вкусные. Моя мать ходит на рынок: там яйца недорогие. Большие магазины дорогие.",
"gloss":[["a boltok","магазины (мн. ч. -k)"],["nagyok","большие"],["kicsik","маленькие"],["almák","яблоки"],["vannak","есть, находятся (мн. ч.)"],["drágák","дорогие"],["finomak","вкусные"],["a tojások","яйца"]],
"qs":["Какие в Перми магазины и какие рынки?","Что продают на рынке?","Почему мать ходит на рынок?"]},
"67":{"hu":"– Éhes vagy, Kirill?\n– Igen, éhes vagyok.\n– Mit eszel?\n– Levest és kenyeret.\n– És mit iszol?\n– Teát, köszönöm. Nem vagyok szomjas.",
"ru":"– Ты голоден, Кирилл?\n– Да, я голоден.\n– Что ты ешь?\n– Суп и хлеб.\n– А что ты пьёшь?\n– Чай, спасибо. Я не хочу пить.",
"gloss":[["éhes","голодный"],["mit","что? (вин. п. от mi)"],["eszel","ты ешь"],["levest és kenyeret","суп и хлеб (вин. п.)"],["iszol","ты пьёшь"],["teát","чай (вин. п.)"],["szomjas","испытывающий жажду"]],
"qs":["Голоден ли Кирилл?","Что он ест?","Что он пьёт?"]},
"68":{"hu":"Magyarországon a leves fontos: a gulyás leves. A magyarok bort és sört isznak. Oroszországban az ebéd leves, hús és krumpli. Az oroszok teát isznak. Kirill most szomjas: vizet iszik. A víz nem drága.",
"ru":"В Венгрии суп важен: гуляш — это суп. Венгры пьют вино и пиво. В России обед — это суп, мясо и картошка. Русские пьют чай. Кирилл сейчас хочет пить: он пьёт воду. Вода недорогая.",
"gloss":[["Magyarországon","в Венгрии"],["leves","суп"],["a magyarok","венгры (мн. ч.)"],["bort és sört","вино и пиво (вин. п.)"],["isznak","пьют"],["az oroszok","русские (мн. ч.)"],["szomjas","испытывающий жажду"],["vizet","воду (víz + -et, гласный сокращается)"]],
"qs":["Что такое гуляш по этому тексту?","Что пьют венгры, а что русские?","Что пьёт Кирилл сейчас?"]},
"69":{"hu":"A reggeli hétkor van: tojás, kenyér és kávé. Az ebéd délben van, az irodában: leves és hal. A vacsora este hétkor: krumpli, sajt és tea. Éjjel nem eszem. A kávé az irodában nem finom, de a tea jó.",
"ru":"Завтрак в семь: яйцо, хлеб и кофе. Обед в полдень, в офисе: суп и рыба. Ужин вечером в семь: картошка, сыр и чай. Ночью я не ем. Кофе в офисе невкусный, но чай хороший.",
"gloss":[["a reggeli","завтрак"],["az ebéd","обед"],["a vacsora","ужин"],["tojás","яйцо"],["hal","рыба"],["éjjel","ночью"],["eszem","я ем"],["de","но"]],
"qs":["Во сколько завтрак и что на завтрак?","Что на обед?","Какой кофе в офисе?"]},
"70":{"hu":"Az édesanyám konyhája nagy. A konyhában egy asztal és négy szék van. Az asztalon almák és tojások vannak. Az édesanyám levest főz, a nagyapám bort iszik. Az édesapám éhes: a vacsora finom. A családom este nyolckor vacsorázik.",
"ru":"Кухня моей матери большая. На кухне стол и четыре стула. На столе яблоки и яйца. Моя мать варит суп, мой дед пьёт вино. Мой отец голоден: ужин вкусный. Моя семья ужинает вечером в восемь.",
"gloss":[["konyhája","её кухня"],["a konyhában","на кухне"],["almák és tojások","яблоки и яйца"],["vannak","есть (мн. ч.)"],["levest főz","варит суп"],["bort iszik","пьёт вино"],["éhes","голодный"],["vacsorázik","ужинает"]],
"qs":["Сколько стульев на кухне?","Что лежит на столе?","Во сколько семья ужинает?"]},
})
json.dump(d,open(P,"w"),ensure_ascii=False,indent=0)
