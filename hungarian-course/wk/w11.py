import json,os
P="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_1.json"
d=json.load(open(P))
d.update({
"71":{"hu":"– Jó napot! Mennyibe kerül egy kiló alma?\n– Száz rubel.\n– Két kilót kérek.\n– Tessék. Más valamit?\n– Fél kiló sajtot kérek. Mennyit fizetek?\n– Ötszáz rubelt.",
"ru":"– Добрый день! Сколько стоит килограмм яблок?\n– Сто рублей.\n– Два килограмма, пожалуйста.\n– Пожалуйста. Что-нибудь ещё?\n– Полкило сыра, пожалуйста. Сколько я плачу?\n– Пятьсот рублей.",
"gloss":[["mennyibe kerül","сколько стоит"],["egy kiló alma","килограмм яблок"],["rubel","рубль"],["két kilót kérek","прошу два килограмма (вин. п.)"],["tessék","пожалуйста (вот)"],["más valamit","что-нибудь ещё"],["mennyit fizetek","сколько я плачу"],["ötszáz rubelt","пятьсот рублей (вин. п.)"]],
"qs":["Сколько стоит килограмм яблок?","Сколько яблок берёт Кирилл?","Сколько он платит всего?"]},
"72":{"hu":"Permben egy kiló kenyér ötven rubel. Egy liter tej hetven rubel: olcsó. Budapesten a kenyér forintba kerül: egy kiló kenyér nyolcszáz forint. Egy kávé Permben száz rubel, Budapesten ötszáz forint. Ez sok? Forintban sok, rubelben kevés.",
"ru":"В Перми килограмм хлеба — пятьдесят рублей. Литр молока — семьдесят рублей: дёшево. В Будапеште хлеб стоит в форинтах: килограмм хлеба — восемьсот форинтов. Кофе в Перми — сто рублей, в Будапеште — пятьсот форинтов. Это много? В форинтах много, в рублях мало.",
"gloss":[["kiló","килограмм"],["liter","литр"],["olcsó","дешёвый"],["forintba kerül","стоит (столько-то) форинтов"],["nyolcszáz","восемьсот"],["forintban","в форинтах"],["sok","много"],["kevés","мало"]],
"qs":["Сколько стоит литр молока в Перми?","Сколько стоит килограмм хлеба в Будапеште?","Сколько стоит кофе в Перми и в Будапеште?"]},
"73":{"hu":"Szombaton a piacra megyek. Hány almát veszek? Öt darabot. Mennyi krumplit? Három kilót. Hány tojást? Tíz darabot. Ez elég egy hétre. Mindent a piacon vásárolok, a boltban semmit.",
"ru":"В субботу я иду на рынок. Сколько яблок я покупаю? Пять штук. Сколько картошки? Три килограмма. Сколько яиц? Десять штук. Этого хватит на неделю. Всё я покупаю на рынке, в магазине ничего.",
"gloss":[["hány","сколько (штук)"],["almát veszek","покупаю яблок (вин. п.)"],["darabot","штук (вин. п. от darab)"],["mennyi","сколько (объём)"],["kilót","килограмма (вин. п.)"],["elég","достаточно"],["egy hétre","на неделю (hét = неделя)"],["mindent … semmit","всё … ничего (вин. п.)"]],
"qs":["Сколько яблок покупает Кирилл?","Сколько картошки он берёт?","Где он покупает всё, а где ничего?"]},
"74":{"hu":"Mennyibe kerül a lakás Permben? Húszezer rubelbe. Ez sok. A busz harminc rubelbe kerül, ez kevés. Hányszor fizetek? Minden hónapban egyszer. A pénz fontos, de nem minden.",
"ru":"Сколько стоит квартира в Перми? Двадцать тысяч рублей. Это много. Автобус стоит тридцать рублей, это мало. Сколько раз я плачу? Каждый месяц один раз. Деньги важны, но это не всё.",
"gloss":[["mennyibe kerül","сколько стоит"],["húszezer rubelbe","двадцать тысяч рублей (ответ на mennyibe)"],["sok","много"],["kevés","мало"],["hányszor","сколько раз"],["minden hónapban","каждый месяц (hónap = месяц)"],["egyszer","один раз"],["de","но"]],
"qs":["Сколько стоит квартира в Перми?","Сколько стоит автобус?","Как часто Кирилл платит за квартиру?"]},
"75":{"hu":"A nagyapám keveset vásárol. Vasárnap a piacra jár, és először halat vesz, egy kilót. A piacon néhány almát és egy kenyeret vesz. Bort nem iszik, sört vesz: két darabot. Mennyit fizet? Ötszáz rubelt. Ez nem sok, nem kevés: elég.",
"ru":"Мой дед покупает мало. В воскресенье он ходит на рынок и сначала покупает рыбу, один килограмм. На рынке он покупает несколько яблок и хлеб. Вино он не пьёт, он покупает пиво: две штуки. Сколько он платит? Пятьсот рублей. Это не много и не мало: достаточно.",
"gloss":[["keveset","мало (вин. п. от kevés)"],["vásárol","покупает"],["először","сначала"],["halat vesz","покупает рыбу"],["néhány","несколько"],["két darabot","две штуки (вин. п.)"],["mennyit fizet","сколько он платит"],["elég","достаточно"]],
"qs":["Что дед покупает сначала?","Что ещё он покупает на рынке?","Сколько он платит?"]},
"76":{"hu":"A konzulátus Moszkvában van. Hány papír kell? Sok: tíz darab. Mennyibe kerül a fordítás? Egy papír kétezer rubelbe kerül, tíz papír húszezer rubelbe. Ez sok pénz, és minden papír fontos.",
"ru":"Консульство находится в Москве. Сколько нужно бумаг? Много: десять штук. Сколько стоит перевод? Одна бумага стоит две тысячи рублей, десять бумаг — двадцать тысяч рублей. Это много денег, и каждая бумага важна.",
"gloss":[["konzulátus","консульство"],["hány papír kell","сколько нужно бумаг"],["darab","штука"],["mennyibe kerül","сколько стоит"],["fordítás","перевод"],["kétezer rubelbe","две тысячи рублей (ответ на mennyibe)"],["sok pénz","много денег"],["minden","каждый, всё"]],
"qs":["Где находится консульство?","Сколько бумаг нужно?","Сколько стоит перевод одной бумаги?"]},
"77":{"hu":"Ma vasárnap van, semmit nem vásárolok. Minden a lakásban van: kenyér, tej, sajt és néhány alma. Ez elég egy napra. Hétfőn a boltba megyek: kevés tejet és sok kenyeret veszek. Mennyibe kerül? Kétszáz rubelbe. Hányszor megyek a boltba? Hetente kétszer.",
"ru":"Сегодня воскресенье, я ничего не покупаю. Всё есть в квартире: хлеб, молоко, сыр и несколько яблок. Этого хватит на один день. В понедельник я иду в магазин: покупаю немного молока и много хлеба. Сколько это стоит? Двести рублей. Сколько раз я хожу в магазин? Два раза в неделю.",
"gloss":[["semmit","ничего (вин. п.)"],["minden","всё"],["néhány","несколько"],["elég","достаточно"],["egy napra","на один день (nap = день)"],["kevés tejet","немного молока (вин. п.)"],["sok kenyeret","много хлеба (вин. п.)"],["hetente kétszer","два раза в неделю"]],
"qs":["Почему Кирилл ничего не покупает сегодня?","Что он купит в понедельник?","Сколько раз в неделю он ходит в магазин?"]},
})
json.dump(d,open(P,"w"),ensure_ascii=False,indent=0)
