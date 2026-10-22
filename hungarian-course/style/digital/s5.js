// 5. Neon & light: neon tubes on a dark brick wall, bloom, chasing marquee arrow, anamorphic flare
(function () {
  let tl, chase;
  const PINK = "#ff2e88", PINKC = "#ffd1e6", CYAN = "#28d7ff", CYANC = "#d6f8ff", AMB = "#ffb02e", AMBC = "#fff0c9", GRN = "#2bff88", GRNC = "#dcffe9", WARM = "#ffe7c2";
  window.SCENE = {
    still: 3.3,
    build(st) {
      U.css(`#s5 text{font-family:Comfortaa;font-weight:500}
        #s5 .ru{font-family:'Source Serif 4';font-style:italic;font-weight:400}`);
      const glowDefs = (id, std) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="1280" height="764" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="${std[0]}" result="b0"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="${std[1]}" result="b1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="${std[2]}" result="b2"/>
          <feMerge><feMergeNode in="b2"/><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="b0"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
      const cglow = (id, col) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="1280" height="764" color-interpolation-filters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="a0"/><feGaussianBlur in="SourceAlpha" stdDeviation="10" result="a1"/><feGaussianBlur in="SourceAlpha" stdDeviation="28" result="a2"/>
          <feFlood flood-color="${col}" result="c"/>
          <feComposite in="c" in2="a0" operator="in" result="g0"/><feComposite in="c" in2="a1" operator="in" result="g1"/><feComposite in="c" in2="a2" operator="in" result="g2"/>
          <feMerge><feMergeNode in="g2"/><feMergeNode in="g2"/><feMergeNode in="g1"/><feMergeNode in="g1"/><feMergeNode in="g0"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
      // neon tube: colored glow stroke + light core
      const tube = (d, col, core, w = 9, cls = "") => `<g class="tube ${cls}">
          <path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
          <path d="${d}" fill="none" stroke="${core}" stroke-width="${w * 0.42}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      const HOUSE = "M150 300 L330 150 L510 300 M180 280 L180 560 L480 560 L480 280";
      const DOOR = "M290 560 L290 470 Q290 430 330 430 Q370 430 370 470 L370 560";
      const WIN = "M215 360 h60 v60 h-60 Z M245 360 v60 M215 390 h60";
      const WIN2 = "M385 360 h60 v60 h-60 Z M415 360 v60 M385 390 h60";
      // marquee arrow pointing left into the door
      const ARROW = "M1000 655 L560 655 L560 690 L470 630 L560 570 L560 605 L1000 605 Z";
      // bulbs along arrow
      const tmp = U.svgRoot(document.body, 10, 10, `<path id="tmpA" d="${ARROW}"/>`);
      const ap = tmp.querySelector("path"), AL = ap.getTotalLength();
      let bulbs = ""; const NB = 46;
      for (let i = 0; i < NB; i++) { const p = ap.getPointAtLength((i / NB) * AL); bulbs += `<circle class="bulb" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5.2"/>`; }
      tmp.remove();
      const svg = U.svgRoot(st, 1280, 764, `
        <defs>
          ${glowDefs("glow", [2.5, 9, 26])}
          ${glowDefs("glowT", [2, 8, 22])}
          ${cglow("gP", PINK)}${cglow("gG", GRN)}${cglow("gW", "#ffb98a")}
          <filter id="blur6" filterUnits="userSpaceOnUse" x="0" y="0" width="1280" height="1600"><feGaussianBlur stdDeviation="7"/></filter>
          <filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
          <pattern id="bricks" width="84" height="38" patternUnits="userSpaceOnUse">
            <rect width="84" height="38" fill="#150f1f"/>
            <rect x="2" y="2" width="80" height="16" rx="2" fill="#1d1529"/>
            <rect x="-40" y="21" width="80" height="16" rx="2" fill="#1b1427"/><rect x="44" y="21" width="80" height="16" rx="2" fill="#1f172b"/>
          </pattern>
          <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".85"/></radialGradient>
          <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16101f"/><stop offset="1" stop-color="#08060c"/></linearGradient>
          <linearGradient id="refFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <mask id="refMask"><rect x="0" y="700" width="1280" height="64" fill="url(#refFade)"/></mask>
          <linearGradient id="streak" x1="0" x2="1"><stop offset="0" stop-color="#7fd8ff" stop-opacity="0"/><stop offset=".5" stop-color="#e8fbff"/><stop offset="1" stop-color="#7fd8ff" stop-opacity="0"/></linearGradient>
          <radialGradient id="ghost"><stop offset="0" stop-color="#9fe6ff" stop-opacity="0"/><stop offset=".7" stop-color="#9fe6ff" stop-opacity=".10"/><stop offset=".9" stop-color="#c9a0ff" stop-opacity=".22"/><stop offset="1" stop-color="#c9a0ff" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="1280" height="764" fill="url(#bricks)"/>
        <g id="spill" filter="url(#bloom)" style="mix-blend-mode:screen">
          <ellipse cx="330" cy="380" rx="230" ry="210" fill="${PINK}" opacity=".35"/>
          <ellipse cx="330" cy="500" rx="60" ry="80" fill="${AMB}" opacity=".55"/>
          <ellipse id="spillG" cx="1080" cy="300" rx="150" ry="110" fill="${GRN}" opacity=".35"/>
          <ellipse cx="830" cy="300" rx="260" ry="120" fill="#ff7ab8" opacity=".18"/>
          <ellipse id="spillA" cx="760" cy="630" rx="300" ry="70" fill="${AMB}" opacity=".3"/>
        </g>
        
        <g id="sign">
          <!-- mounting hardware -->
          <g fill="#3a3346" stroke="#57506a" stroke-width="1.2">
            <rect x="174" y="320" width="12" height="9" rx="2"/><rect x="474" y="320" width="12" height="9" rx="2"/>
            <rect x="174" y="520" width="12" height="9" rx="2"/><rect x="474" y="520" width="12" height="9" rx="2"/>
          </g>
          <path d="M150 300 C 120 330, 110 640, 60 700" fill="none" stroke="#2a2433" stroke-width="3"/>
          ${tube(HOUSE, PINK, PINKC, 10, "house")}
          ${tube(WIN, CYAN, CYANC, 7, "win")}
          ${tube(WIN2, CYAN, CYANC, 7, "win")}
          <path id="doorFill" d="${DOOR} Z" fill="${AMB}" opacity=".18" filter="url(#blur6)"/>
          ${tube(DOOR, AMB, AMBC, 10, "door")}
          <g id="arrowG">
            <path d="${ARROW}" fill="none" stroke="#3b2a1a" stroke-width="16" stroke-linejoin="round" opacity=".9"/>
            <path d="${ARROW}" fill="none" stroke="#6b4a26" stroke-width="2" stroke-linejoin="round"/>
            <g id="bulbs" fill="${AMBC}" filter="url(#glowT)">${bulbs}</g>
          </g>
          <g id="txt">
            <text id="t1" filter="url(#gP)" x="610" y="372" font-size="124" fill="${PINKC}" letter-spacing="1">a ház</text>
            <text id="t2" filter="url(#gG)" x="0" y="372" font-size="124" fill="${GRNC}" letter-spacing="1">ba</text>
            <text id="ru" filter="url(#gW)" class="ru" x="616" y="462" font-size="54" fill="#fff6e8">в дом</text>
          </g>
        </g>
        
        <g id="flare" style="mix-blend-mode:screen">
          <ellipse cx="330" cy="500" rx="360" ry="2.4" fill="url(#streak)"/>
          <ellipse cx="330" cy="500" rx="220" ry="9" fill="url(#streak)" opacity=".35"/>
          <circle cx="330" cy="500" r="16" fill="#fff8e6" filter="url(#blur6)" opacity=".9"/>
          <circle cx="560" cy="530" r="26" fill="url(#ghost)"/>
          <circle cx="700" cy="560" r="54" fill="url(#ghost)"/>
          <circle cx="905" cy="600" r="16" fill="url(#ghost)" opacity=".8"/>
        </g>
        <rect width="1280" height="764" fill="url(#vig)"/>
        <rect id="grain5" width="1280" height="764" opacity=".06" style="mix-blend-mode:screen"/>
      `);
      svg.id = "s5";
      const t1 = svg.querySelector("#t1"), t2 = svg.querySelector("#t2");
      const b = t1.getBBox(); t2.setAttribute("x", b.x + b.width + 10);
      const g = svg.querySelector("#grain5"); g.setAttribute("fill", "url(#np)");
      const defs = svg.querySelector("defs"); defs.insertAdjacentHTML("beforeend", `<pattern id="np" width="256" height="256" patternUnits="userSpaceOnUse"><image href="${U.noiseURL(256, 255, 21)}" width="256" height="256"/></pattern>`);
      const bulbsEl = [...svg.querySelectorAll(".bulb")];
      chase = (t) => { const k = Math.floor(t * 14); bulbsEl.forEach((e, i) => e.setAttribute("opacity", (i + k) % 3 === 0 ? 1 : 0.28)); };
      // flicker helper: deterministic sequences
      const flick = (sel, t0, pattern) => { pattern.forEach(([dt, o]) => tl.set(sel, { opacity: o }, t0 + dt)); };
      tl = gsap.timeline({ paused: true });
      tl.set(["#sign .tube", "#txt text", "#doorFill", "#bulbs", "#spill ellipse", "#flare"], { opacity: 0 }, 0);
      flick("#sign .house", 0.15, [[0, 1], [0.06, 0.2], [0.12, 1], [0.2, 0.4], [0.26, 1]]);
      flick("#sign .win", 0.45, [[0, 1], [0.05, 0.3], [0.1, 1]]);
      flick("#sign .door", 0.65, [[0, 1], [0.08, 0.3], [0.14, 1]]);
      flick("#doorFill", 0.65, [[0, 0.18], [0.08, 0.05], [0.14, 0.18]]);
      flick("#t1", 0.95, [[0, 1], [0.05, 0.3], [0.09, 1], [0.18, 0.5], [0.22, 1]]);
      flick("#ru", 1.25, [[0, 0.9], [0.06, 0.2], [0.12, 1]]);
      flick("#t2", 1.55, [[0, 1], [0.04, 0.15], [0.1, 1], [0.15, 0.25], [0.24, 1]]);
      flick("#bulbs", 1.9, [[0, 1]]);
      tl.to("#spill ellipse", { opacity: (i) => [0.5, 0.7, 0.45, 0.25, 0.4][i], duration: 0.5, stagger: 0.25 }, 0.2)
        .set("#spillG", { opacity: 0 }, 0.2).to("#spillG", { opacity: 0.5, duration: 0.3 }, 1.6)
        .set("#spillA", { opacity: 0 }, 0.2).to("#spillA", { opacity: 0.3, duration: 0.3 }, 1.9)
        .to("#flare", { opacity: 1, duration: 0.4 }, 0.8)
        .fromTo("#flare", { x: -30 }, { x: 30, duration: 3, ease: "sine.inOut" }, 0.5)
        .to({}, { duration: 0.1 }, 3.5);
    },
    seek(t) { tl.seek(t, false); chase(t); },
  };
})();
