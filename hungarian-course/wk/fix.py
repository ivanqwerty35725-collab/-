import json
P="/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu/texts_1.json"
d=json.load(open(P))
d["73"]["hu"]="Szombaton a piacra megyek. Hány almát veszek? Öt darabot, és három kiló krumplit. Hány tojást? Tíz darabot, ez elég egy hétre. Mindent a piacon vásárolok, a boltban semmit."
d["73"]["ru"]="В субботу я иду на рынок. Сколько яблок я покупаю? Пять штук, и три килограмма картошки. Сколько яиц? Десять штук, этого хватит на неделю. Всё я покупаю на рынке, в магазине ничего."
d["73"]["gloss"]=[["hány","сколько (штук)"],["almát veszek","покупаю яблок (вин. п.)"],["darabot","штук (вин. п. от darab)"],["három kiló krumplit","три килограмма картошки"],["elég","достаточно"],["egy hétre","на неделю (hét = неделя)"],["mindent","всё (вин. п.)"],["semmit","ничего (вин. п.)"]]
d["77"]["hu"]="Ma vasárnap van, semmit nem vásárolok. Minden a lakásban van: kenyér, tej, sajt és néhány alma. Ez elég egy napra. Hétfőn a boltba megyek: kevés tejet és sok kenyeret veszek. Hányszor megyek a boltba? Hetente kétszer."
d["77"]["ru"]="Сегодня воскресенье, я ничего не покупаю. Всё есть в квартире: хлеб, молоко, сыр и несколько яблок. Этого хватит на один день. В понедельник я иду в магазин: покупаю немного молока и много хлеба. Сколько раз я хожу в магазин? Два раза в неделю."
d["74"]["hu"]="Mennyibe kerül a lakás Permben? Húszezer rubelbe, ez sok. A busz harminc rubelbe kerül, ez kevés. Hányszor fizetek? Minden hónapban egyszer. A pénz fontos, de nem minden."
d["74"]["ru"]="Сколько стоит квартира в Перми? Двадцать тысяч рублей, это много. Автобус стоит тридцать рублей, это мало. Сколько раз я плачу? Каждый месяц один раз. Деньги важны, но это не всё."
d["75"]["hu"]="A nagyapám keveset vásárol. Vasárnap a piacra jár, és először halat vesz, egy kilót. A piacon néhány almát és egy kenyeret vesz. Bort nem iszik, sört vesz: két darabot. Ötszáz rubelt fizet. Ez nem sok, nem kevés: elég."
d["75"]["ru"]="Мой дед покупает мало. В воскресенье он ходит на рынок и сначала покупает рыбу, один килограмм. На рынке он покупает несколько яблок и хлеб. Вино он не пьёт, он покупает пиво: две штуки. Он платит пятьсот рублей. Это не много и не мало: достаточно."
d["75"]["gloss"][6]=["ötszáz rubelt fizet","платит пятьсот рублей"]
d["62"]["hu"]="A nagyapám Csománfalván született, és most az Urálban él. Csománfalva messze van az Uráltól. Técsőről vonattal Moszkvába lehet menni, Moszkvából Permbe. Permből Liszvába busz jár. Az Urálban hegy, erdő és folyó van. Liszva az erdőben van, a hegynél."
d["62"]["ru"]="Мой дед родился в Чумалёве, а сейчас живёт на Урале. Чумалёво далеко от Урала. Из Тячева на поезде можно доехать до Москвы, из Москвы в Пермь. Из Перми в Лысьву ходит автобус. На Урале горы, леса и реки. Лысьва находится в лесу, у горы."
d["62"]["gloss"]=[["az Urálban","на Урале"],["az Uráltól","от Урала"],["Técsőről","из Тячева"],["Moszkvába","в Москву"],["menni","ехать (инфинитив от megy)"],["hegy","гора"],["erdő","лес"],["az erdőben","в лесу"]]
d["72"]["hu"]="Permben egy kiló kenyér ötven rubel. Egy liter tej hetven rubel: olcsó. Budapesten egy kiló kenyér nyolcszáz forintba kerül. Egy kávé Permben száz rubel, Budapesten ötszáz forint. Ez sok? Forintban sok, rubelben kevés."
d["72"]["ru"]="В Перми килограмм хлеба — пятьдесят рублей. Литр молока — семьдесят рублей: дёшево. В Будапеште килограмм хлеба стоит восемьсот форинтов. Кофе в Перми — сто рублей, в Будапеште — пятьсот форинтов. Это много? В форинтах много, в рублях мало."
d["72"]["gloss"]=[["kiló","килограмм"],["liter","литр"],["olcsó","дешёвый"],["nyolcszáz forintba kerül","стоит восемьсот форинтов"],["forintban","в форинтах"],["rubelben","в рублях"],["sok","много"],["kevés","мало"]]
json.dump(d,open(P,"w"),ensure_ascii=False,indent=0)
