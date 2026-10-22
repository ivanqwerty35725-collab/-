import json,os
P="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_1.json"
d=json.load(open(P))
d.update({
"29":{"hu":"Permben lakom, egy lakásban. A lakás kicsi: egy szoba és egy konyha. Van egy ágy, egy asztal és egy szék. Nincs autóm, de van számítógépem.",
"ru":"Я живу в Перми, в квартире. Квартира маленькая: одна комната и кухня. Есть кровать, стол и стул. У меня нет машины, но есть компьютер.",
"gloss":[["lakásban","в квартире"],["kicsi","маленький"],["szoba","комната"],["konyha","кухня"],["ágy","кровать"],["nincs autóm","у меня нет машины"],["de","но"],["van számítógépem","у меня есть компьютер"]],
"qs":["Какая квартира у Кирилла?","Какая мебель есть в квартире?","Чего у Кирилла нет, а что есть?"]},
"30":{"hu":"– Hogy vagy, Kirill?\n– Köszönöm, jól. És te?\n– Jól. Hogy van az édesapád?\n– Jól van, köszönöm.\n– És a nagyapád?\n– A nagyapám idős, de jól van.",
"ru":"– Как ты, Кирилл?\n– Спасибо, хорошо. А ты?\n– Хорошо. Как твой отец?\n– Хорошо, спасибо.\n– А твой дед?\n– Мой дед пожилой, но у него всё хорошо.",
"gloss":[["hogy vagy","как ты"],["köszönöm, jól","спасибо, хорошо"],["te","ты"],["hogy van","как он / как вы"],["az édesapád","твой отец"],["a nagyapád","твой дед"],["idős","пожилой"],["de","но"]],
"qs":["Как дела у Кирилла?","Как дела у его отца?","Что говорит Кирилл о деде?"]},
"31":{"hu":"Az iroda Permben van. Az irodában van egy nagy asztal és egy új számítógép. Van telefon és papír. Az asztalon van egy toll. Könyv nincs az irodában.",
"ru":"Офис находится в Перми. В офисе есть большой стол и новый компьютер. Есть телефон и бумага. На столе лежит ручка. Книги в офисе нет.",
"gloss":[["az irodában","в офисе"],["nagy","большой"],["új","новый"],["számítógép","компьютер"],["papír","бумага"],["az asztalon","на столе"],["toll","ручка"],["nincs","нет (отсутствует)"]],
"qs":["Где находится офис?","Какой стол и какой компьютер в офисе?","Чего нет в офисе?"]},
"32":{"hu":"A nagyapám háza Liszvában van. A ház régi és nagy. A házban három szoba és egy konyha van. Telefon van, de számítógép nincs. Van egy régi óra és egy régi asztal.",
"ru":"Дом моего деда находится в Лысьве. Дом старый и большой. В доме три комнаты и кухня. Телефон есть, а компьютера нет. Есть старые часы и старый стол.",
"gloss":[["háza","его дом (-a: его)"],["régi","старый"],["nagy","большой"],["a házban","в доме"],["szoba","комната"],["de","а, но"],["nincs","нет (отсутствует)"],["óra","часы"]],
"qs":["Где находится дом деда?","Сколько комнат в доме?","Что в доме есть, а чего нет?"]},
"33":{"hu":"Az édesapám autója új. Az új autó drága. Nincs autóm, nincs pénzem. Van egy régi telefonom és egy magyar könyvem. A könyv nem drága.",
"ru":"Машина моего отца новая. Новая машина дорогая. У меня нет машины, нет денег. У меня есть старый телефон и венгерская книга. Книга недорогая.",
"gloss":[["autója","его машина (-ja: его)"],["új","новый"],["drága","дорогой"],["nincs autóm","у меня нет машины"],["nincs pénzem","у меня нет денег"],["régi","старый"],["telefonom","мой телефон"],["könyvem","моя книга"]],
"qs":["Какая машина у отца Кирилла?","Чего нет у Кирилла?","Что есть у Кирилла?"]},
"34":{"hu":"Hol van a táskám? A táskám itt van, az ágyon. A táskában van egy könyv, egy toll és papír. A telefon nincs a táskában. A telefon az asztalon van.",
"ru":"Где моя сумка? Моя сумка здесь, на кровати. В сумке книга, ручка и бумага. Телефона в сумке нет. Телефон на столе.",
"gloss":[["a táskám","моя сумка"],["itt van","вот здесь"],["az ágyon","на кровати"],["a táskában","в сумке"],["toll","ручка"],["papír","бумага"],["nincs a táskában","нет в сумке"],["az asztalon","на столе"]],
"qs":["Где сумка Кирилла?","Что лежит в сумке?","Где телефон?"]},
"35":{"hu":"Perm nagy város, Liszva kicsi város. Permben van egyetem, Liszvában nincs. Permben a lakás drága, Liszvában nem drága. A nagyapám Liszvában lakik, egy régi házban. Kirill Permben lakik, egy kicsi, új lakásban.",
"ru":"Пермь — большой город, Лысьва — маленький город. В Перми есть университет, в Лысьве нет. В Перми квартира дорогая, в Лысьве недорогая. Мой дед живёт в Лысьве, в старом доме. Кирилл живёт в Перми, в маленькой новой квартире.",
"gloss":[["nagy","большой"],["kicsi","маленький"],["egyetem","университет"],["nincs","нет (отсутствует)"],["lakás","квартира"],["drága","дорогой"],["régi házban","в старом доме"],["új","новый"]],
"qs":["Какой город больше: Пермь или Лысьва?","В каком городе есть университет?","В каком доме живёт дед?"]},
})
json.dump(d,open(P,"w"),ensure_ascii=False,indent=0)
