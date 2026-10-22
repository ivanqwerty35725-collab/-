import json,os
P="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_1.json"
d=json.load(open(P))
d.update({
"8":{"hu":"Kirill vagyok. Permben lakom. Perm egy város Oroszországban. Liszvában születtem.",
"ru":"Я Кирилл. Я живу в Перми. Пермь — город в России. Я родился в Лысьве.",
"gloss":[["Permben","в Перми (Perm + -ben)"],["lakom","я живу"],["város","город"],["Oroszországban","в России"],["Liszvában","в Лысьве (Liszva + -ban)"],["születtem","я родился"]],
"qs":["Где живёт Кирилл?","Что такое Пермь и где она находится?","Где родился Кирилл?"]},
"9":{"hu":"Iván Csománfalván született. Csománfalva egy falu. Csománfalva Kárpátalján van. Iván most Liszvában lakik.",
"ru":"Иван родился в Чумалёве. Чумалёво — село. Чумалёво находится в Закарпатье. Иван сейчас живёт в Лысьве.",
"gloss":[["Csománfalván","в Чумалёве (сёла на -falva берут -n)"],["született","родился"],["falu","село"],["Kárpátalján","в Закарпатье"],["van","находится, есть"],["most","сейчас"],["lakik","живёт"]],
"qs":["Где родился Иван?","Что такое Чумалёво и где оно находится?","Где Иван живёт сейчас?"]},
"10":{"hu":"– Hol vagy most, Kirill?\n– Permben vagyok.\n– Hol van Perm?\n– Perm Oroszországban van, az Urálban.",
"ru":"– Где ты сейчас, Кирилл?\n– Я в Перми.\n– Где находится Пермь?\n– Пермь в России, на Урале.",
"gloss":[["hol","где"],["vagy","ты есть"],["most","сейчас"],["Permben vagyok","я в Перми"],["hol van","где находится"],["az Urálban","на Урале (с артиклем az)"]],
"qs":["Где сейчас Кирилл?","В какой стране находится Пермь?","В каком регионе находится Пермь?"]},
"11":{"hu":"Három ország: Oroszország, Ukrajna és Magyarország. Perm Oroszországban van. Csománfalva Ukrajnában van, Kárpátalján. Kirill most Oroszországban van, nem Magyarországon.",
"ru":"Три страны: Россия, Украина и Венгрия. Пермь находится в России. Чумалёво находится в Украине, в Закарпатье. Кирилл сейчас в России, а не в Венгрии.",
"gloss":[["ország","страна"],["Oroszország","Россия"],["Ukrajnában","в Украине"],["Magyarország","Венгрия"],["Magyarországon","в Венгрии (Magyarország + -on)"],["és","и"],["nem","не"]],
"qs":["Какие три страны названы?","В какой стране находится Чумалёво?","Где сейчас Кирилл: в России или в Венгрии?"]},
"12":{"hu":"Babics Fjodor Csománfalván született. Alekszinec Anna Újbárdon született. Újbárd egy falu Kárpátalján. Csománfalva falu, Técső város.",
"ru":"Фёдор Бабич родился в Чумалёве. Анна Олексишенец родилась в Новобарове. Новобарово — село в Закарпатье. Чумалёво — село, Тячев — город.",
"gloss":[["Babics Fjodor","Фёдор Бабич (венгерский порядок: фамилия, имя)"],["született","родился, родилась"],["Újbárdon","в Новобарове (Újbárd + -on)"],["falu","село"],["Kárpátalján","в Закарпатье"],["város","город"],["Técső","Тячев"]],
"qs":["Где родился Фёдор Бабич?","Где родилась Анна Олексишенец?","Что такое Тячев: село или город?"]},
"13":{"hu":"Kirill orosz, Permben lakik. Iván ruszin, Csománfalván született. Mária orosz, Liszvában született. Most Iván is Liszvában lakik.",
"ru":"Кирилл русский, живёт в Перми. Иван русин, родился в Чумалёве. Мария русская, родилась в Лысьве. Сейчас Иван тоже живёт в Лысьве.",
"gloss":[["orosz","русский"],["ruszin","русин"],["lakik","живёт"],["született","родился"],["most","сейчас"],["is","тоже (стоит после слова, к которому относится)"]],
"qs":["Кто по национальности Кирилл?","Кто по национальности Иван и где он родился?","Где сейчас живёт Иван?"]},
"14":{"hu":"Hol van a kulcs? A kulcs itt van, az asztalon. Hol van a szék? A szék ott van.",
"ru":"Где ключ? Ключ здесь, на столе. Где стул? Стул там.",
"gloss":[["hol van","где находится"],["a kulcs","ключ (с артиклем a)"],["itt van","вот здесь, здесь находится"],["az asztalon","на столе (-on)"],["ott van","там находится"],["a, az","артикль (az перед гласной)"]],
"qs":["Где ключ?","На чём лежит ключ?","Где стул?"]},
})
json.dump(d,open(P,"w"),ensure_ascii=False,indent=0)
