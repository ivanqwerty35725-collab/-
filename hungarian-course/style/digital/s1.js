// 1. Shape-layer animation (classic AE): flat geometric shapes, trim paths, repeaters
(function () {
  const C = { bg: "#F6EEDB", navy: "#1E2747", tom: "#EE5A3B", mus: "#F5B83D", cream: "#FFF8EA", green: "#2D6A4F", pink: "#F7C7B4" };
  let tl;
  window.SCENE = {
    still: 3.4,
    build(st) {
      U.css(`
        #s1 text{font-family:Unbounded}
        #s1 .t{font-weight:700;font-size:104px;letter-spacing:-2.5px}
        #s1 .ru{font-family:'Source Serif 4';font-style:italic;font-size:56px}
      `);
      // ray repeater around the sun
      let rays = "";
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2, r1 = 232, r2 = i % 2 ? 252 : 270;
        rays += `<line class="ray" x1="${(Math.cos(a) * r1).toFixed(1)}" y1="${(Math.sin(a) * r1).toFixed(1)}" x2="${(Math.cos(a) * r2).toFixed(1)}" y2="${(Math.sin(a) * r2).toFixed(1)}" pathLength="1"/>`;
      }
      // roof stripe repeater
      let stripes = "";
      for (let i = 0; i < 9; i++) stripes += `<line x1="180" y1="${262 + i * 14}" x2="540" y2="${262 + i * 14}"/>`;
      // dot grid repeater
      let dots = "";
      for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) dots += `<circle class="dot" cx="${c * 22}" cy="${r * 22}" r="4.2"/>`;
      // speed lines
      const svg = U.svgRoot(st, 1280, 764, `
        <defs>
          <clipPath id="roofclip"><polygon points="190,378 360,232 530,378"/></clipPath>
          <clipPath id="doorclip"><path d="M328 560 V478 a35 35 0 0 1 70 0 V560 Z"/></clipPath>
          <pattern id="hatch" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="12" height="12" fill="${C.tom}"/><line x1="0" y1="0" x2="0" y2="12" stroke="${C.navy}" stroke-width="3" opacity=".18"/></pattern>
        </defs>
        <rect width="1280" height="764" fill="${C.bg}"/>
        <g id="dotgrid" transform="translate(70 90)" fill="${C.navy}" opacity=".9">${dots}</g>
        <g id="sunG" transform="translate(360 352)">
          <circle id="sun" r="205" fill="${C.mus}"/>
          <circle id="ring1" r="222" fill="none" stroke="${C.navy}" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>
          <g id="rays" stroke="${C.navy}" stroke-width="7" stroke-linecap="round">${rays}</g>
          <circle id="ring2" r="300" fill="none" stroke="${C.tom}" stroke-width="5" stroke-linecap="round" pathLength="1" stroke-dasharray=".18 .07" transform="rotate(-30)"/>
        </g>
        <!-- house -->
        <g id="house">
          <g id="chim"><rect x="438" y="252" width="38" height="96" fill="${C.navy}"/><rect x="430" y="244" width="54" height="16" rx="3" fill="${C.navy}"/></g>
          <rect id="body" x="226" y="364" width="268" height="196" fill="url(#hatch)"/>
          <g id="roof">
            <polygon points="190,378 360,232 530,378" fill="${C.navy}"/>
            <g clip-path="url(#roofclip)" stroke="${C.cream}" stroke-width="3" opacity=".22">${stripes}</g>
            <circle cx="360" cy="320" r="20" fill="${C.cream}"/><circle cx="360" cy="320" r="9" fill="${C.navy}"/>
          </g>
          <g id="win">
            <rect x="256" y="414" width="48" height="56" rx="6" fill="${C.cream}"/>
            <path d="M280 414 V470 M256 442 H304" stroke="${C.navy}" stroke-width="5"/>
            <rect x="420" y="414" width="48" height="56" rx="6" fill="${C.cream}"/>
            <path d="M444 414 V470 M420 442 H468" stroke="${C.navy}" stroke-width="5"/>
          </g>
          <path id="doorhole" d="M328 560 V478 a35 35 0 0 1 70 0 V560 Z" fill="${C.navy}"/>
          <g clip-path="url(#doorclip)"><circle id="doorglow" cx="363" cy="560" r="0" fill="${C.mus}"/></g>
          <path id="leaf" d="M398 560 V478 a35 35 0 0 0 -35 -35 L 363 560 Z" fill="${C.cream}" opacity="0"/>
        </g>
        <line id="ground" x1="120" y1="562" x2="610" y2="562" stroke="${C.navy}" stroke-width="8" stroke-linecap="round" pathLength="1"/>
        <g id="grass" stroke="${C.navy}" stroke-width="6" stroke-linecap="round" fill="none">
          <path d="M150 562 l10 -26 M168 562 l-2 -20 M560 562 l6 -24 M578 562 l-6 -18" pathLength="1" class="tp"/>
        </g>
        <!-- decorative shape layers -->
        <path id="zig" d="M940 140 l20 -20 l20 20 l20 -20 l20 20 l20 -20 l20 20" fill="none" stroke="${C.tom}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
        <g id="plus1" transform="translate(1200 520)" stroke="${C.navy}" stroke-width="8" stroke-linecap="round"><path d="M-16 0 H16 M0 -16 V16"/></g>
        <g id="plus2" transform="translate(700 150)" stroke="${C.tom}" stroke-width="7" stroke-linecap="round"><path d="M-12 0 H12 M0 -12 V12"/></g>
        <circle id="ring3" cx="1120" cy="135" r="26" fill="none" stroke="${C.navy}" stroke-width="7"/>
        <circle id="dot3" cx="1205" cy="660" r="12" fill="${C.mus}"/>
        <polygon id="tri" points="0,-20 18,12 -18,12" fill="${C.green}" transform="translate(905 660) rotate(18)"/>
        
        <!-- text -->
        <g id="txt">
          <clipPath id="tclip"><rect x="600" y="180" width="680" height="215"/></clipPath>
          <path id="hl" d="M0 0 H10" stroke="${C.mus}" stroke-width="16" stroke-linecap="round" pathLength="1" fill="none"/>
          <g clip-path="url(#tclip)">
            <text id="t1" class="t" x="706" y="372" fill="${C.navy}">a ház</text>
            <text id="t2" class="t" x="0" y="372" fill="${C.green}">ba</text>
          </g>
          <text id="ru" class="ru" x="726" y="462" fill="${C.navy}">в дом</text>
        </g>
        <!-- trim-path arrow from ba into the door -->
        <path id="arrow" d="M0 0" fill="none" stroke="${C.green}" stroke-width="11" stroke-linecap="round" pathLength="1"/>
        <path id="ahead" d="M-22 -16 L0 0 L-22 16" fill="none" stroke="${C.green}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      `);
      svg.id = "s1";
      // arrow head follows the path
      const t1 = svg.querySelector("#t1"), t2 = svg.querySelector("#t2");
      const bb1 = t1.getBBox(); t2.setAttribute("x", bb1.x + bb1.width + 6);
      const bb2 = t2.getBBox(), bx = bb2.x + bb2.width / 2;
      svg.querySelector("#hl").setAttribute("d", `M${bb2.x + 8} 400 H${bb2.x + bb2.width - 8}`);
      svg.querySelector("#arrow").setAttribute("d", `M${bx} 432 C ${bx + 10} 640, 640 680, 372 528`);
      const arrow = svg.querySelector("#arrow"), ahead = svg.querySelector("#ahead");
      const L = arrow.getTotalLength();
      const place = (p) => {
        const d = Math.max(0.001, p) * L, a = arrow.getPointAtLength(d), b = arrow.getPointAtLength(Math.max(0, d - 2));
        const ang = Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI;
        ahead.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${ang})`);
        ahead.style.opacity = p > 0.02 ? 1 : 0;
      };
      const st_ = { p: 0 };
      // gsap timeline
      const q = (s) => svg.querySelectorAll(s);
      const trim = (el) => { el.forEach ? el.forEach((e) => { e.style.strokeDasharray = "1 1"; e.style.strokeDashoffset = 1; }) : 0; };
      ["#ground", ".tp", "#zig", ".ray"].forEach((s) => trim(q(s)));
      q("#arrow")[0].style.strokeDasharray = "1 1"; q("#arrow")[0].style.strokeDashoffset = 1;
      tl = gsap.timeline({ paused: true });
      tl.from("#sun", { attr: { r: 0 }, duration: 0.7, ease: "back.out(1.6)" }, 0)
        .from("#ring1", { attr: { r: 0 }, opacity: 0, duration: 0.8, ease: "expo.out" }, 0.1)
        .to(".ray", { strokeDashoffset: 0, duration: 0.45, stagger: 0.025, ease: "power2.out" }, 0.25)
        .fromTo("#ring2", { attr: { "stroke-dasharray": "0 .25" } }, { attr: { "stroke-dasharray": ".18 .07" }, duration: 1, ease: "power3.out" }, 0.3)
        .to("#ring2", { rotation: 60, svgOrigin: "0 0", duration: 3.5, ease: "none" }, 0)
        .to("#ground", { strokeDashoffset: 0, duration: 0.6, ease: "power3.inOut" }, 0.2)
        .from("#body", { scaleY: 0, svgOrigin: "360 560", duration: 0.55, ease: "back.out(1.7)" }, 0.45)
        .from("#roof", { y: -260, duration: 0.6, ease: "bounce.out" }, 0.7)
        .from("#chim", { scaleY: 0, svgOrigin: "457 348", duration: 0.4, ease: "back.out(2)" }, 1.15)
        .from("#win rect", { scale: 0, transformOrigin: "50% 50%", duration: 0.4, stagger: 0.08, ease: "back.out(2.5)" }, 1.0)
        .from("#win path", { opacity: 0, duration: 0.2 }, 1.2)
        .from("#doorhole", { scaleY: 0, svgOrigin: "363 560", duration: 0.4, ease: "back.out(2)" }, 1.05)
        .to(".tp", { strokeDashoffset: 0, duration: 0.4, stagger: 0.05 }, 0.8)
        .from("#dotgrid .dot", { attr: { r: 0 }, duration: 0.3, stagger: { each: 0.012, from: "start" }, ease: "back.out(3)" }, 0.3)
        .from("#t1", { y: 180, duration: 0.7, ease: "expo.out" }, 0.9)
        .from("#t2", { y: 170, duration: 0.7, ease: "expo.out" }, 1.15)
        .fromTo("#hl", { strokeDasharray: "0 1" }, { strokeDasharray: "1 0", duration: 0.5, ease: "power2.inOut" }, 1.45)
        .from("#ru", { opacity: 0, x: -20, duration: 0.5, ease: "power2.out" }, 1.6)
        .to(st_, { p: 1, duration: 0.9, ease: "power2.inOut", onUpdate: () => { arrow.style.strokeDashoffset = 1 - st_.p; place(st_.p); } }, 1.8)
        .to("#doorglow", { attr: { r: 90 }, duration: 0.5, ease: "power2.out" }, 2.55)
        .to("#zig", { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" }, 1.2)
        .from(["#plus1", "#plus2"], { scale: 0, rotation: -180, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.1, ease: "back.out(2)" }, 0.6)
        .from(["#ring3", "#dot3", "#tri"], { scale: 0, transformOrigin: "50% 50%", duration: 0.5, stagger: 0.08, ease: "back.out(3)" }, 1.3)
        .to("#plus1", { rotation: 90, transformOrigin: "50% 50%", duration: 2, ease: "none" }, 1.4)
        .to({}, { duration: 0.1 }, 3.5);
      place(0); arrow.style.strokeDashoffset = 1;
    },
    seek(t) { tl.seek(t, false); },
  };
})();
