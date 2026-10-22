import json,os
P="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_1.json"
d=json.load(open(P))
d.update({
"43":{"hu":"Reggel hétkor kelek fel. Fél nyolckor reggelizem. Délelőtt és délután dolgozom, délben ebédelek. Este hétkor vacsorázom. Éjjel tizenegykor fekszem le.",
"ru":"Утром я встаю в семь. В половине восьмого я завтракаю. До полудня и после полудня я работаю, в полдень обедаю. Вечером в семь я ужинаю. Ночью в одиннадцать я ложусь спать.",
"gloss":[["hétkor","в семь часов (-kor)"],["kelek fel","я встаю (felkel, приставка отделяется)"],["fél nyolckor","в половине восьмого (7:30)"],["reggelizem","я завтракаю"],["délelőtt","до полудня"],["ebédelek","я обедаю"],["vacsorázom","я ужинаю"],["fekszem le","я ложусь спать"]],
"qs":["Во сколько Кирилл встаёт?","Когда он обедает?","Во сколько он ложится спать?"]},
"44":{"hu":"Hétfőn, kedden, szerdán, csütörtökön és pénteken dolgozom. Szombaton és vasárnap nem dolgozom. Szombaton magyarul tanulok. Vasárnap Liszvában vagyok. Ma kedd van, dolgozom.",
"ru":"В понедельник, вторник, среду, четверг и пятницу я работаю. В субботу и воскресенье я не работаю. В субботу я учу венгерский. В воскресенье я в Лысьве. Сегодня вторник, я работаю.",
"gloss":[["hétfőn","в понедельник (-n)"],["kedden","во вторник"],["szerdán","в среду"],["csütörtökön","в четверг"],["pénteken","в пятницу"],["szombaton","в субботу"],["vasárnap","в воскресенье (без суффикса)"],["ma","сегодня"]],
"qs":["В какие дни Кирилл работает?","Что он делает в субботу?","Какой день сегодня?"]},
"45":{"hu":"– Hány óra van?\n– Fél kilenc.\n– Mikor ebédelsz?\n– Délben, tizenkettőkor.\n– És mikor vacsorázol?\n– Este hétkor.",
"ru":"– Который час?\n– Половина девятого.\n– Когда ты обедаешь?\n– В полдень, в двенадцать.\n– А когда ты ужинаешь?\n– Вечером в семь.",
"gloss":[["hány óra van","который час"],["fél kilenc","половина девятого (8:30)"],["mikor","когда"],["ebédelsz","ты обедаешь"],["délben","в полдень"],["tizenkettőkor","в двенадцать часов"],["vacsorázol","ты ужинаешь"],["este hétkor","вечером в семь"]],
"qs":["Который час в диалоге?","Когда Кирилл обедает?","Когда он ужинает?"]},
"46":{"hu":"A nagyapám idős, de reggel hatkor kel fel. Reggelizik, és délelőtt olvas. Délben ebédel. Délután a házban dolgozik. Este nyolckor vacsorázik, és tízkor fekszik le.",
"ru":"Мой дед пожилой, но утром встаёт в шесть. Он завтракает и до полудня читает. В полдень обедает. После полудня работает по дому. Вечером в восемь ужинает и в десять ложится спать.",
"gloss":[["de","но"],["hatkor","в шесть часов"],["kel fel","встаёт"],["reggelizik","завтракает"],["délelőtt","до полудня"],["ebédel","обедает"],["vacsorázik","ужинает"],["fekszik le","ложится спать"]],
"qs":["Во сколько встаёт дед?","Что он делает до полудня?","Во сколько он ложится спать?"]},
"47":{"hu":"Ma szerda van. Reggel kilenckor magyarul tanulok, délután dolgozom. Holnap csütörtök. Holnap este a nagyapám Permben van. Vasárnap nem dolgozom: vasárnap Liszvában reggelizem.",
"ru":"Сегодня среда. Утром в девять я учу венгерский, после полудня работаю. Завтра четверг. Завтра вечером мой дед в Перми. В воскресенье я не работаю: в воскресенье я завтракаю в Лысьве.",
"gloss":[["ma","сегодня"],["szerda","среда"],["kilenckor","в девять часов"],["holnap","завтра"],["csütörtök","четверг"],["este","вечером"],["vasárnap","в воскресенье"],["reggelizem","я завтракаю"]],
"qs":["Какой сегодня день?","Кто будет в Перми завтра вечером?","Где Кирилл завтракает в воскресенье?"]},
"48":{"hu":"Hány óra van? Negyed tíz. Ma szombat van, ma nem dolgozom. Szombaton nem hétkor kelek fel: tízkor. Délelőtt magyarul tanulok, este olvasok.",
"ru":"Который час? Четверть десятого. Сегодня суббота, сегодня я не работаю. В субботу я встаю не в семь: в десять. До полудня я учу венгерский, вечером читаю.",
"gloss":[["hány óra van","который час"],["negyed tíz","четверть десятого (9:15)"],["szombat","суббота"],["szombaton","в субботу"],["hétkor","в семь"],["kelek fel","я встаю"],["tízkor","в десять"],["olvasok","я читаю"]],
"qs":["Который час?","Во сколько Кирилл встаёт в субботу?","Что он делает вечером?"]},
"49":{"hu":"Mikor tanulok magyarul? Hétfőn és szerdán este, hattól nyolcig. Pénteken délután, háromtól négyig. Szombaton délelőtt, tíztől tizenkettőig. Ez nehéz, de fontos.",
"ru":"Когда я учу венгерский? В понедельник и среду вечером, с шести до восьми. В пятницу после полудня, с трёх до четырёх. В субботу до полудня, с десяти до двенадцати. Это трудно, но важно.",
"gloss":[["mikor","когда"],["hattól nyolcig","с шести до восьми (-tól … -ig)"],["pénteken","в пятницу"],["háromtól négyig","с трёх до четырёх"],["szombaton","в субботу"],["tíztől tizenkettőig","с десяти до двенадцати"],["nehéz","трудный"],["de","но"]],
"qs":["В какие дни Кирилл учит венгерский вечером?","Сколько он занимается в пятницу?","Когда он занимается в субботу?"]},
})
json.dump(d,open(P,"w"),ensure_ascii=False,indent=0)
