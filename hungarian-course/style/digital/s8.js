// 8. Soft "clay" 3D look in 2D: SVG lighting filters (diffuse + specular on a blurred height map) + contact shadows
(function () {
  let tl;
  window.SCENE = {
    still: 3.3,
    build(st) {
      const clay = (id, blur = 10, scale = 7, spec = 0.55) => `
        <filter id="${id}" filterUnits="userSpaceOnUse" x="-100" y="-100" width="1480" height="964" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="h0"/>
          <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="3" result="tn"/>
          <feColorMatrix in="tn" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.022 0" result="bump"/>
          <feComposite in="h0" in2="bump" operator="arithmetic" k2="1" k3="1" result="h"/>
          <feDiffuseLighting in="h" surfaceScale="${scale}" diffuseConstant="1.1" lighting-color="#fff" result="dif"><feDistantLight azimuth="235" elevation="50"/></feDiffuseLighting>
          <feComposite in="SourceGraphic" in2="dif" operator="arithmetic" k1="0.78" k2="0.34" result="shade"/>
          <feSpecularLighting in="h" surfaceScale="${scale}" specularConstant="${spec}" specularExponent="22" lighting-color="#fff" result="sp"><feDistantLight azimuth="235" elevation="58"/></feSpecularLighting>
          <feComposite in="sp" in2="SourceAlpha" operator="in" result="spIn"/>
          <feComposite in="shade" in2="spIn" operator="arithmetic" k2="1" k3="0.55" result="lit"/>
          <feComposite in="lit" in2="SourceAlpha" operator="in" result="obj"/>
          <feGaussianBlur in="SourceAlpha" stdDeviation="9" result="sb"/><feOffset in="sb" dx="10" dy="16" result="so"/>
          <feFlood flood-color="#8a4a3a" flood-opacity=".28"/><feComposite in2="so" operator="in" result="shadow"/>
          <feMerge><feMergeNode in="shadow"/><feMergeNode in="obj"/></feMerge>
        </filter>`;
      const svg = U.svgRoot(st, 1280, 764, `
        <defs>
          ${clay("clay", 10, 7)}${clay("clayS", 5, 5, 0.45)}${clay("clayT", 6, 6, 0.6)}${clay("clayB", 14, 8)}
          <radialGradient id="bg8" cx="45%" cy="40%" r="80%"><stop offset="0" stop-color="#fde9da"/><stop offset=".7" stop-color="#f7d3bf"/><stop offset="1" stop-color="#eebda5"/></radialGradient>
        </defs>
        <rect width="1280" height="764" fill="url(#bg8)"/>
        <ellipse cx="380" cy="640" rx="340" ry="40" fill="#e4a88f" opacity=".45"/>
        <g id="sun" filter="url(#clay)"><circle cx="150" cy="140" r="58" fill="#ffd25e"/></g>
        <g id="cloud" filter="url(#clayB)"><path d="M560 170 a40 40 0 0 1 70 -30 a52 52 0 0 1 96 18 a36 36 0 0 1 10 70 h-160 a30 30 0 0 1 -16 -58Z" fill="#ffffff"/></g>
        <g id="hill" filter="url(#clayB)"><path d="M20 690 C 120 560, 300 590, 420 600 C 560 610, 660 560, 760 640 L 760 700 L20 700Z" fill="#9edcb0"/></g>
        <g id="tree" filter="url(#clay)">
          <rect x="606" y="470" width="30" height="150" rx="15" fill="#c9875a"/>
          <circle cx="621" cy="430" r="72" fill="#7fcf98"/><circle cx="575" cy="470" r="46" fill="#7fcf98"/><circle cx="668" cy="470" r="46" fill="#7fcf98"/>
        </g>
        <g id="house">
          <g filter="url(#clay)"><rect x="398" y="262" width="44" height="100" rx="12" fill="#ff8f73"/></g>
          <g filter="url(#clay)"><rect x="160" y="400" width="300" height="226" rx="34" fill="#fff1cf"/></g>
          <g filter="url(#clay)"><path d="M310 230 Q326 220 342 232 L494 378 Q516 404 482 410 L138 410 Q104 404 126 378 L278 232 Q294 220 310 230Z" fill="#ff8f73"/></g>
          <g filter="url(#clayS)"><circle cx="310" cy="330" r="30" fill="#9fd3f5"/></g>
          <g filter="url(#clayS)">
            <rect x="196" y="452" width="74" height="74" rx="18" fill="#9fd3f5"/>
            <rect x="350" y="452" width="74" height="74" rx="18" fill="#9fd3f5"/>
          </g>
          <g id="door" filter="url(#clayS)"><path d="M272 626 V546 a38 38 0 0 1 76 0 V626 Z" fill="#45a87c"/></g>
          <g filter="url(#clayS)"><circle cx="333" cy="590" r="7" fill="#ffd25e"/></g>
        </g>
        <g id="arrowC" filter="url(#clayT)"><path id="ap" d="M760 560 C 690 690, 470 700, 372 620" fill="none" stroke="#b9a3ff" stroke-width="30" stroke-linecap="round"/>
          <path id="ah" d="M-34 -30 L6 0 L-34 30" fill="none" stroke="#b9a3ff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g id="txt" style="font-family:Nunito;font-weight:900">
          <g filter="url(#clayT)"><text id="t1" x="712" y="318" font-size="138" fill="#7466e0" letter-spacing="-2">a ház</text></g>
          <g filter="url(#clayT)"><text id="t2" x="0" y="318" font-size="138" fill="#2f9466" letter-spacing="-2">ba</text></g>
          <text id="ru" x="720" y="404" style="font-family:'Source Serif 4';font-style:italic;font-weight:400" font-size="54" fill="#5a4a8a">в дом</text>
        </g>
        <g id="sparks" filter="url(#clayS)" fill="#ffd25e">
          <circle cx="1170" cy="170" r="14"/><circle cx="1210" cy="230" r="8" fill="#ff8f73"/><circle cx="880" cy="140" r="10" fill="#9fd3f5"/><circle cx="1150" cy="610" r="16" fill="#7fcf98"/>
        </g>
        <rect width="1280" height="764" fill="url(#np8)" opacity=".05" style="mix-blend-mode:multiply"/>
      `);
      svg.querySelector("defs").insertAdjacentHTML("beforeend", `<pattern id="np8" width="256" height="256" patternUnits="userSpaceOnUse"><image href="${U.noiseURL(256, 255, 8)}" width="256" height="256"/></pattern>`);
      const t1 = svg.querySelector("#t1"), t2 = svg.querySelector("#t2");
      const b1 = t1.getBBox(); t2.setAttribute("x", b1.x + b1.width + 4);
      const b2 = t2.getBBox();
      const ap = svg.querySelector("#ap"), ah = svg.querySelector("#ah");
      ap.setAttribute("d", `M${b2.x + b2.width / 2} 370 C ${b2.x + b2.width / 2 - 10} 620, 600 690, 372 612`);
      const L = ap.getTotalLength(); ap.style.strokeDasharray = `${L} ${L}`;
      const S = { p: 0 };
      const place = () => { ap.style.strokeDashoffset = L * (1 - S.p); const d = Math.max(1, S.p * L), a = ap.getPointAtLength(d), b = ap.getPointAtLength(Math.max(0, d - 3)); ah.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI})`); ah.style.opacity = S.p > 0.03 ? 1 : 0; };
      tl = gsap.timeline({ paused: true });
      const pop = (sel, t, o = "50% 100%") => tl.from(sel, { scale: 0, transformOrigin: o, duration: 0.8, ease: "elastic.out(1, 0.55)" }, t);
      pop("#hill", 0.0); pop("#house > g:nth-child(2)", 0.15); pop("#house > g:nth-child(3)", 0.3, "50% 100%"); pop("#house > g:nth-child(1)", 0.45);
      pop("#house > g:nth-child(4)", 0.5, "50% 50%"); pop("#house > g:nth-child(5)", 0.55, "50% 50%"); pop("#door", 0.6); pop("#house > g:nth-child(7)", 0.7, "50% 50%");
      pop("#tree", 0.35); pop("#sun", 0.2, "50% 50%"); pop("#cloud", 0.4, "50% 50%");
      tl.from("#t1", { y: -260, duration: 0.9, ease: "bounce.out" }, 0.8)
        .from("#t2", { y: -260, duration: 0.9, ease: "bounce.out" }, 1.1)
        .from("#t2", { scaleX: 1.25, scaleY: 0.7, transformOrigin: "50% 100%", duration: 0.5, ease: "elastic.out(1,0.4)" }, 1.75)
        .from("#ru", { opacity: 0, y: 14, duration: 0.5 }, 1.6)
        .to(S, { p: 1, duration: 1.0, ease: "power2.inOut", onUpdate: place }, 1.8)
        .from("#sparks circle", { scale: 0, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.1, ease: "back.out(3)" }, 1.2)
        .to("#door", { scaleY: 0.92, transformOrigin: "50% 100%", duration: 0.15, yoyo: true, repeat: 1 }, 2.75)
        .to("#cloud", { x: 40, duration: 3.5, ease: "sine.inOut" }, 0)
        .to({}, { duration: 0.1 }, 3.5);
      place();
    },
    seek(t) { tl.seek(t, false); },
  };
})();
