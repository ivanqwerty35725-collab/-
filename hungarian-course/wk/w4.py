import json,os
P="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_1.json"
d=json.load(open(P))
d.update({
"22":{"hu":"A családom Liszvában él. Az édesapám Iván, negyvennyolc éves. Az édesanyám Mária, negyvenhét éves. Huszonnégy éves vagyok, Permben lakom.",
"ru":"Моя семья живёт в Лысьве. Мой отец Иван, ему сорок восемь лет. Моя мать Мария, ей сорок семь лет. Мне двадцать четыре года, я живу в Перми.",
"gloss":[["a családom","моя семья"],["él","живёт"],["az édesapám","мой отец"],["negyvennyolc","сорок восемь"],["éves","лет (о возрасте)"],["az édesanyám","моя мать"],["negyvenhét","сорок семь"],["huszonnégy","двадцать четыре"]],
"qs":["Где живёт семья Кирилла?","Сколько лет отцу Кирилла?","Сколько лет самому Кириллу?"]},
"23":{"hu":"Iván a nagyapám. Hetvenöt éves, idős. Csománfalván született, most Liszvában él. Az apja Fjodor, az anyja Anna.",
"ru":"Иван — мой дед. Ему семьдесят пять лет, он пожилой. Он родился в Чумалёве, сейчас живёт в Лысьве. Его отец — Фёдор, его мать — Анна.",
"gloss":[["a nagyapám","мой дед"],["hetvenöt","семьдесят пять"],["idős","пожилой"],["született","родился"],["él","живёт"],["az apja","его отец (-ja: его)"],["az anyja","его мать"]],
"qs":["Сколько лет деду Ивану?","Где он родился и где живёт сейчас?","Как зовут его отца и мать?"]},
"24":{"hu":"A dédapám Babics Fjodor. Csománfalván született. A dédanyám Alekszinec Anna, Újbárdon született. A dédapám meghalt. A dédanyám is meghalt.",
"ru":"Мой прадед — Фёдор Бабич. Он родился в Чумалёве. Моя прабабушка — Анна Олексишенец, она родилась в Новобарове. Мой прадед умер. Моя прабабушка тоже умерла.",
"gloss":[["a dédapám","мой прадед"],["a dédanyám","моя прабабушка"],["született","родился, родилась"],["Újbárdon","в Новобарове"],["meghalt","умер, умерла"],["is","тоже"]],
"qs":["Как зовут прадеда Кирилла?","Где родилась прабабушка?","Живы ли прадед и прабабушка?"]},
"25":{"hu":"– Hány éves vagy, Kirill?\n– Huszonnégy éves vagyok.\n– Van testvéred?\n– Nem, nincs testvérem.\n– Hány éves az édesapád?\n– Negyvennyolc.",
"ru":"– Сколько тебе лет, Кирилл?\n– Мне двадцать четыре года.\n– У тебя есть брат или сестра?\n– Нет, у меня нет брата или сестры.\n– Сколько лет твоему отцу?\n– Сорок восемь.",
"gloss":[["hány éves vagy","сколько тебе лет"],["huszonnégy","двадцать четыре"],["van testvéred?","у тебя есть брат/сестра? (-d: твой)"],["nincs","нет (отсутствует)"],["testvérem","мой брат/сестра"],["az édesapád","твой отец"],["negyvennyolc","сорок восемь"]],
"qs":["Сколько лет Кириллу?","Есть ли у Кирилла братья или сёстры?","Сколько лет его отцу?"]},
"26":{"hu":"Iván mérnök, negyvennyolc éves. Az apja is Iván, hetvenöt éves. Iván felesége Mária, tanár. Kirill Iván fia, huszonnégy éves. A család Liszvában él, Kirill Permben.",
"ru":"Иван инженер, ему сорок восемь лет. Его отца тоже зовут Иван, ему семьдесят пять лет. Жена Ивана — Мария, учительница. Кирилл — сын Ивана, ему двадцать четыре года. Семья живёт в Лысьве, Кирилл — в Перми.",
"gloss":[["mérnök","инженер"],["az apja","его отец"],["is","тоже"],["felesége","его жена (-e: его)"],["tanár","учительница"],["fia","его сын (от fiú)"],["a család","семья"],["él","живёт"]],
"qs":["Сколько лет Ивану-инженеру?","Кто его жена и кто она по профессии?","Кем Кирилл приходится Ивану?"]},
"27":{"hu":"Az édesanyám Mária, tanár, negyvenhét éves. Mária férje Iván. Mária apja Liszvában él, idős. Mária anyja is Liszvában él. Mária gyereke Kirill.",
"ru":"Моя мать Мария, учительница, ей сорок семь лет. Муж Марии — Иван. Отец Марии живёт в Лысьве, он пожилой. Мать Марии тоже живёт в Лысьве. Ребёнок Марии — Кирилл.",
"gloss":[["az édesanyám","моя мать"],["negyvenhét","сорок семь"],["férje","её муж (-e: её)"],["apja","её отец"],["idős","пожилой"],["is","тоже"],["anyja","её мать"],["gyereke","её ребёнок"]],
"qs":["Сколько лет Марии?","Как зовут мужа Марии?","Где живут родители Марии?"]},
"28":{"hu":"A családom: az édesapám, az édesanyám, a nagyapám és én. Hány éves a nagyapám? Hetvenöt. Az édesapám negyvennyolc éves, az édesanyám negyvenhét. És én huszonnégy éves vagyok.",
"ru":"Моя семья: мой отец, моя мать, мой дед и я. Сколько лет моему деду? Семьдесят пять. Моему отцу сорок восемь лет, моей матери сорок семь. А мне двадцать четыре года.",
"gloss":[["a családom","моя семья"],["én","я"],["hány éves","сколько лет"],["a nagyapám","мой дед"],["hetvenöt","семьдесят пять"],["negyvennyolc","сорок восемь"],["negyvenhét","сорок семь"],["huszonnégy","двадцать четыре"]],
"qs":["Из кого состоит семья Кирилла?","Сколько лет деду?","Сколько лет матери?"]},
})
json.dump(d,open(P,"w"),ensure_ascii=False,indent=0)
