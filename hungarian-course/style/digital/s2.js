// 2. Glassmorphism: frosted glass panels over vivid orbs
(function () {
  let tl;
  const houseSVG = (fill, holes) => {
    // house silhouette in a 420x470 box, windows/door as holes
    const s = `<svg xmlns='http://www.w3.org/2000/svg' width='420' height='470' viewBox='0 0 420 470'>
      <mask id='m'><rect width='420' height='470' fill='white'/>${holes ? `<rect x='80' y='250' width='70' height='70' rx='14' fill='black'/><rect x='270' y='250' width='70' height='70' rx='14' fill='black'/>` : ""}</mask>
      <path d='M210 8 Q222 0 234 10 L404 168 Q420 184 398 186 L372 186 L372 446 Q372 470 348 470 L72 470 Q48 470 48 446 L48 186 L22 186 Q0 184 16 168 L186 10 Q198 0 210 8Z' fill='${fill}' mask='url(#m)'/></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(s)}")`;
  };
  window.SCENE = {
    still: 2.25,
    build(st) {
      U.css(`
      #g2bg{left:0;top:0;width:1280px;height:764px;background:
        radial-gradient(120% 90% at 10% 0%, #3b1d8f 0%, rgba(59,29,143,0) 60%),
        radial-gradient(90% 80% at 100% 100%, #0c4a6e 0%, rgba(12,74,110,0) 60%),
        linear-gradient(135deg,#1a1240,#160f33 50%,#0d1b3a)}
      .orb{position:absolute;border-radius:50%}
      #oA{left:110px;top:90px;width:400px;height:400px;background:radial-gradient(circle at 32% 28%, #ffd27a 0%, #ff8a3d 28%, #ff3d77 70%, #b8105a 100%);box-shadow:0 40px 120px rgba(255,61,119,.45)}
      #oB{left:930px;top:20px;width:300px;height:300px;background:radial-gradient(circle at 30% 30%, #b8fff2 0%, #22d3c5 35%, #0e7490 85%);box-shadow:0 30px 100px rgba(34,211,197,.4)}
      #oC{left:560px;top:520px;width:250px;height:250px;background:radial-gradient(circle at 30% 30%, #f5b5ff 0%, #a855f7 45%, #5b21b6 100%);box-shadow:0 30px 90px rgba(168,85,247,.45)}
      #oD{left:600px;top:120px;width:90px;height:90px;background:radial-gradient(circle at 30% 30%, #fff6c2, #facc15 50%, #ca8a04)}
      #oE{left:1150px;top:560px;width:150px;height:150px;background:radial-gradient(circle at 30% 30%, #9ef0b8, #34d399 45%, #047857)}
      .glass{position:absolute;backdrop-filter:blur(26px) saturate(165%) brightness(1.08);-webkit-backdrop-filter:blur(26px) saturate(165%) brightness(1.08)}
      #house{left:96px;top:150px;width:420px;height:470px;-webkit-mask:${houseSVG("white", true)};mask:${houseSVG("white", true)};
        background:linear-gradient(150deg,rgba(255,255,255,.34),rgba(255,255,255,.10) 55%,rgba(255,255,255,.18))}
      #houseEdge,#houseShadow{left:96px;top:150px;width:420px;height:470px}
      #houseShadow{filter:blur(28px);opacity:.55;transform:translate(16px,30px)}
      #door{left:256px;top:470px;width:100px;height:150px;border-radius:50px 50px 8px 8px;
        background:linear-gradient(160deg,rgba(255,255,255,.55),rgba(255,255,255,.2));
        backdrop-filter:blur(10px) saturate(180%);border:1.5px solid rgba(255,255,255,.7);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 10px 30px rgba(20,10,60,.25)}
      #card{left:620px;top:226px;width:590px;height:330px;border-radius:40px;
        background:linear-gradient(140deg,rgba(255,255,255,.30),rgba(255,255,255,.08) 60%,rgba(255,255,255,.14));
        border:1.5px solid rgba(255,255,255,.45);
        box-shadow:inset 0 1.5px 0 rgba(255,255,255,.8),inset 0 -1px 0 rgba(255,255,255,.15),0 30px 80px rgba(10,5,40,.45)}
      #card,#house{overflow:hidden}
      #card .sheen,#house .sheen{position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.28) 45%,rgba(255,255,255,0) 60%);transform:translateX(-120%)}
      #card .sheen{border-radius:40px}
      #txt{left:676px;top:268px;color:#fff;font-family:Inter;white-space:nowrap}
      #txt .w{font-weight:700;font-size:118px;letter-spacing:-4px;line-height:1;display:flex;align-items:baseline}
      #txt .w .h{text-shadow:0 2px 24px rgba(30,10,80,.35)}
      #chip{position:relative;display:inline-block;margin-left:10px;padding:0 22px 10px 18px;border-radius:30px;line-height:1;
        background:linear-gradient(150deg,rgba(80,200,140,.75),rgba(45,106,79,.85));backdrop-filter:blur(14px) saturate(160%);
        border:1.5px solid rgba(190,255,220,.7);box-shadow:inset 0 1.5px 0 rgba(220,255,235,.9),0 16px 40px rgba(6,60,40,.45);color:#fff;transform:translateY(8px)}
      #txt .ru{font-family:'Source Serif 4';font-style:italic;font-size:50px;margin-top:34px;margin-left:6px;color:rgba(255,255,255,.88)}
      #btn{left:520px;top:458px;width:116px;height:116px;border-radius:50%;
        background:linear-gradient(145deg,rgba(255,255,255,.45),rgba(255,255,255,.12));border:1.5px solid rgba(255,255,255,.75);
        box-shadow:inset 0 2px 0 rgba(255,255,255,.9),0 20px 50px rgba(10,5,40,.4)}
      #btn svg{position:absolute;left:0;top:0}
      #pill{left:700px;top:600px;width:250px;height:64px;border-radius:32px;background:linear-gradient(145deg,rgba(255,255,255,.28),rgba(255,255,255,.06));border:1.5px solid rgba(255,255,255,.4);box-shadow:inset 0 1.5px 0 rgba(255,255,255,.7),0 16px 40px rgba(10,5,40,.35)}
      #pill i{position:absolute;top:22px;height:20px;border-radius:10px;background:rgba(255,255,255,.55)}
      #grain{left:0;top:0;width:1280px;height:764px;opacity:.07;mix-blend-mode:overlay;background:url(${U.noiseURL(256, 255, 3)})}
      `);
      st.innerHTML = `
        <div id="g2bg"></div>
        <div class="orb" id="oA"></div><div class="orb" id="oB"></div><div class="orb" id="oC"></div><div class="orb" id="oD"></div><div class="orb" id="oE"></div>
        <svg id="houseShadow" viewBox="0 0 420 470"><path d="M210 8 L404 168 L372 186 L372 470 L48 470 L48 186 L16 168 Z" fill="#0a0428"/></svg>
        <div class="glass" id="house"><div class="sheen"></div></div>
        <svg id="houseEdge" viewBox="0 0 420 470" style="overflow:visible">
          <defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".45" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity=".7"/></linearGradient></defs>
          <path d="M210 8 Q222 0 234 10 L404 168 Q420 184 398 186 L372 186 L372 446 Q372 470 348 470 L72 470 Q48 470 48 446 L48 186 L22 186 Q0 184 16 168 L186 10 Q198 0 210 8Z" fill="none" stroke="url(#eg)" stroke-width="2"/>
          <rect x="80" y="250" width="70" height="70" rx="14" fill="none" stroke="url(#eg)" stroke-width="1.6"/>
          <rect x="270" y="250" width="70" height="70" rx="14" fill="none" stroke="url(#eg)" stroke-width="1.6"/>
        </svg>
        <div class="glass" id="door"></div>
        <div class="glass" id="card"><div class="sheen"></div></div>
        <div id="txt"><div class="w"><span class="h">a ház</span><span id="chip">ba</span></div><div class="ru">в дом</div></div>
        <div class="glass" id="pill"><i style="left:22px;width:90px"></i><i style="left:124px;width:46px;opacity:.6"></i></div>
        <div class="glass" id="btn"><svg width="116" height="116" viewBox="0 0 116 116"><path d="M74 58 H38 M54 41 L37 58 L54 75" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div id="grain"></div>`;
      tl = gsap.timeline({ paused: true });
      tl.from("#oA", { scale: 0.6, x: -60, y: 40, duration: 2.2, ease: "power3.out" }, 0)
        .from("#oB", { scale: 0.5, x: 80, y: -40, duration: 2.2, ease: "power3.out" }, 0.1)
        .from("#oC", { scale: 0.5, y: 80, duration: 2.2, ease: "power3.out" }, 0.2)
        .from(["#oD", "#oE"], { scale: 0, duration: 1, ease: "back.out(2)", stagger: 0.15 }, 0.6)
        .to("#oA", { x: 30, y: -16, duration: 3.5, ease: "sine.inOut" }, 1.0)
        .from(["#house", "#houseEdge", "#houseShadow"], { y: 120, opacity: 0, duration: 1.1, ease: "expo.out" }, 0.3)
        .from("#door", { scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, ease: "expo.out" }, 0.9)
        .from("#card", { x: 160, opacity: 0, duration: 1.1, ease: "expo.out" }, 0.55)
        .from("#txt .h", { y: 40, opacity: 0, duration: 0.8, ease: "expo.out" }, 0.9)
        .from("#chip", { scale: 0.4, opacity: 0, duration: 0.8, ease: "back.out(1.8)" }, 1.25)
        .from("#txt .ru", { y: 20, opacity: 0, duration: 0.7, ease: "power3.out" }, 1.45)
        .from("#pill", { x: 60, opacity: 0, duration: 0.9, ease: "expo.out" }, 1.1)
        .from("#btn", { scale: 0, opacity: 0, duration: 0.8, ease: "back.out(1.7)" }, 1.6)
        .to("#btn", { x: -150, y: 20, duration: 0.9, ease: "power3.inOut" }, 2.3)
        .to("#btn", { scale: 0.55, opacity: 0, duration: 0.35, ease: "power2.in" }, 3.05)
        .to("#door", { background: "linear-gradient(160deg,rgba(255,255,255,.9),rgba(255,236,170,.55))", boxShadow: "inset 0 1px 0 rgba(255,255,255,.9),0 0 60px rgba(255,220,140,.8)", duration: 0.5 }, 3.0)
        .to("#card .sheen", { x: "120%", duration: 1.2, ease: "power2.inOut" }, 1.5)
        .to("#house .sheen", { x: "120%", duration: 1.2, ease: "power2.inOut" }, 1.7)
        .to({}, { duration: 0.1 }, 3.5);
    },
    seek(t) { tl.seek(t, false); },
  };
})();
