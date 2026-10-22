// 3. Mesh gradient / aurora, Apple-like minimalism
(function () {
  let tl;
  const HOUSE = "M640 96 L792 226 L792 392 L488 392 L488 226 Z";
  window.SCENE = {
    still: 3.4,
    build(st) {
      U.css(`
      #m3{left:0;top:0;width:1280px;height:764px;background:#f6f1ec;overflow:hidden}
      #m3 .b{position:absolute;border-radius:50%;filter:blur(70px)}
      #inner .b{position:absolute;border-radius:50%;filter:blur(36px)}
      #grain3{left:0;top:0;width:1280px;height:764px;opacity:.10;mix-blend-mode:soft-light;background:url(${U.noiseURL(256, 255, 11)})}
      #t3{left:0;top:440px;width:1280px;text-align:center;font-family:Inter;color:#16181d;white-space:nowrap}
      #t3 .w{font-weight:600;font-size:132px;letter-spacing:-6px;line-height:1}
      #t3 .ba{background:linear-gradient(100deg,#1d5c43 0%,#2D6A4F 35%,#2f8f66 70%,#1f6e7a 100%);-webkit-background-clip:text;background-clip:text;color:transparent;padding-right:6px}
      #t3 .ru{font-family:'Source Serif 4';font-style:italic;font-weight:400;font-size:46px;color:rgba(22,24,29,.62);margin-top:6px;letter-spacing:0}
      #inner{left:0;top:0;width:1280px;height:764px;clip-path:path("${HOUSE}")}
      `);
      const blob = (x, y, w, h, c, o = 1) => `<div class="b" style="left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px;background:${c};opacity:${o}"></div>`;
      st.innerHTML = `
        <div id="m3">
          <div id="bgb">
          ${blob(160, 120, 620, 480, "#ffc9a8")}
          ${blob(1120, 110, 640, 460, "#c9b8ff")}
          ${blob(1060, 640, 700, 420, "#ade8cf")}
          ${blob(220, 660, 640, 420, "#a9d4ff", 0.9)}
          ${blob(640, 330, 520, 380, "#ffd6ea", 0.85)}
          </div>
        </div>
        <div id="inner">
          <div style="position:absolute;left:470px;top:80px;width:340px;height:330px;background:linear-gradient(180deg,#0b2733 0%,#123f3a 45%,#1b6a50 80%,#2D6A4F 100%)"></div>
          <div class="b" style="left:500px;top:150px;width:90px;height:300px;background:#62f0b0;opacity:.75;filter:blur(26px);transform:rotate(-12deg)"></div>
          <div class="b" style="left:600px;top:110px;width:70px;height:280px;background:#8af7cf;opacity:.6;filter:blur(22px);transform:rotate(-6deg)"></div>
          <div class="b" style="left:690px;top:120px;width:90px;height:260px;background:#5fc8ff;opacity:.55;filter:blur(28px);transform:rotate(8deg)"></div>
          <div class="b" style="left:580px;top:60px;width:240px;height:110px;background:#a08cff;opacity:.45;filter:blur(30px)"></div>
          <div class="b" style="left:480px;top:330px;width:320px;height:120px;background:#2D6A4F;opacity:.9;filter:blur(24px)"></div>
          <div id="glow" class="b" style="left:585px;top:290px;width:110px;height:150px;background:#fff7d6;filter:blur(30px);opacity:.9"></div>
        </div>
        <svg id="lines3" width="1280" height="764" viewBox="0 0 1280 764" style="left:0;top:0;overflow:visible">
          <defs>
            <linearGradient id="rib" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".55" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff"/></linearGradient>
            <filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
            <filter id="glowf" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <g id="ribbons" fill="none" stroke-linecap="round">
            <path id="r1" d="M-40 300 C 180 250, 360 380, 610 360" stroke="#ffffff" stroke-opacity=".55" stroke-width="22" filter="url(#soft)" pathLength="1"/>
            <path id="r2" d="M-40 410 C 200 420, 380 300, 612 372" stroke="#ffd9b0" stroke-opacity=".7" stroke-width="14" filter="url(#soft)" pathLength="1"/>
          </g>
          <path id="hline" d="${HOUSE}" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" filter="url(#glowf)" pathLength="1"/>
          <path id="door3" d="M612 392 V340 a28 28 0 0 1 56 0 V392" fill="rgba(255,250,235,.95)" stroke="#fff" stroke-width="3" filter="url(#glowf)"/>
          <path id="aline" d="M120 330 C 300 300, 420 380, 600 368" fill="none" stroke="url(#rib)" stroke-width="3" stroke-linecap="round" pathLength="1"/>
          <circle id="spark" r="7" fill="#fff" filter="url(#glowf)"/>
        </svg>
        <div id="t3"><div class="w">a ház<span class="ba">ba</span></div><div class="ru">в дом</div></div>
        <div id="grain3"></div>`;
      const aline = st.querySelector("#aline"), spark = st.querySelector("#spark");
      const L = aline.getTotalLength(), S = { p: 0 };
      const place = () => { const p = aline.getPointAtLength(S.p * L); spark.setAttribute("cx", p.x); spark.setAttribute("cy", p.y); spark.style.opacity = S.p > 0.01 && S.p < 0.995 ? 1 : 0; };
      ["#hline", "#aline", "#r1", "#r2"].forEach((s) => { const e = st.querySelector(s); e.style.strokeDasharray = "1 1"; e.style.strokeDashoffset = 1; });
      const bs = st.querySelectorAll("#bgb .b"), ib = st.querySelectorAll("#inner .b");
      tl = gsap.timeline({ paused: true });
      // slow mesh drift
      tl.fromTo(bs[0], { x: -60, y: -30 }, { x: 60, y: 30, duration: 3.5, ease: "sine.inOut" }, 0)
        .fromTo(bs[1], { x: 50, y: 20 }, { x: -70, y: 40, duration: 3.5, ease: "sine.inOut" }, 0)
        .fromTo(bs[2], { x: 40, y: 30 }, { x: -60, y: -30, duration: 3.5, ease: "sine.inOut" }, 0)
        .fromTo(bs[3], { x: -40, y: 20 }, { x: 80, y: -20, duration: 3.5, ease: "sine.inOut" }, 0)
        .fromTo(bs[4], { scale: 0.8 }, { scale: 1.15, duration: 3.5, ease: "sine.inOut" }, 0)
        .fromTo(ib[0], { x: -30 }, { x: 40, duration: 3.5, ease: "sine.inOut" }, 0)
        .fromTo(ib[1], { y: 30 }, { y: -20, x: -40, duration: 3.5, ease: "sine.inOut" }, 0)
        .fromTo(ib[2], { x: 40 }, { x: -40, duration: 3.5, ease: "sine.inOut" }, 0)
        .from("#inner", { opacity: 0, duration: 1.2, ease: "power2.out" }, 0.5)
        .to("#hline", { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 0.1)
        .from("#door3", { opacity: 0, scaleY: 0, transformOrigin: "50% 100%", duration: 0.7, ease: "expo.out" }, 1.2)
        .to(["#r1", "#r2"], { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", stagger: 0.15 }, 1.0)
        .to("#aline", { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 1.3)
        .to(S, { p: 1, duration: 1.4, ease: "power2.inOut", onUpdate: place }, 1.3)
        .fromTo("#glow", { opacity: 0.2, scale: 0.6 }, { opacity: 1, scale: 1.4, duration: 0.6, ease: "power2.out" }, 2.6)
        .from("#t3 .w", { y: 40, opacity: 0, filter: "blur(12px)", duration: 1.1, ease: "expo.out" }, 0.7)
        .from("#t3 .ru", { y: 16, opacity: 0, duration: 0.9, ease: "power3.out" }, 1.3)
        .to({}, { duration: 0.1 }, 3.5);
      place();
    },
    seek(t) { tl.seek(t, false); },
  };
})();
