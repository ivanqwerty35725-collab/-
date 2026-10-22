// 7. 2.5D camera: flat layers in depth, camera dolly + depth of field (blur by distance from focus plane)
(function () {
  let seekFn;
  window.SCENE = {
    still: 3.5,
    build(st) {
      const F = 1000;
      U.css(`.L7{position:absolute;left:0;top:0;width:1280px;height:764px;transform-origin:640px 382px;will-change:transform,filter}
        #t7{position:absolute;left:84px;top:96px;font-family:Inter;color:#1b2a2f;white-space:nowrap}
        #t7 .w{font-weight:800;font-size:104px;letter-spacing:-4px;line-height:1}
        #t7 .ba{color:#2D6A4F}
        #t7 .ru{font-family:'Source Serif 4';font-style:italic;font-size:46px;color:#2b3a3c;margin-top:10px;margin-left:4px}`);
      const S = (inner) => `<svg width="1280" height="764" viewBox="0 0 1280 764" style="position:absolute;left:0;top:0;overflow:visible">${inner}</svg>`;
      // --- layer art
      const sky = S(`<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc6e2"/><stop offset=".55" stop-color="#cfe3e6"/><stop offset=".8" stop-color="#f7e5c6"/></linearGradient>
          <radialGradient id="sun"><stop offset="0" stop-color="#fffbea"/><stop offset=".25" stop-color="#fff3cf" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7b0" stop-opacity="0"/></radialGradient></defs>
        <rect x="-400" y="-300" width="2080" height="1400" fill="url(#sk)"/>
        <circle cx="1060" cy="215" r="230" fill="url(#sun)"/><circle cx="1060" cy="215" r="44" fill="#fffdf2"/>
        <g fill="#ffffff" opacity=".75"><ellipse cx="380" cy="330" rx="120" ry="18"/><ellipse cx="450" cy="318" rx="70" ry="16"/><ellipse cx="1180" cy="380" rx="140" ry="14"/></g>`);
      const mtn = S(`<path d="M-300 520 L-120 410 L20 470 L180 330 L320 430 L470 360 L620 450 L780 300 L930 420 L1070 350 L1230 440 L1400 380 L1600 470 L1600 800 L-300 800 Z" fill="#9fbdd3"/>
        <path d="M-300 560 L-60 470 L120 520 L300 430 L520 520 L700 450 L900 530 L1100 460 L1320 520 L1600 480 L1600 800 L-300 800 Z" fill="#86aac4"/>
        <path d="M780 300 L820 330 L800 335 L760 322 Z M180 330 L210 352 L170 350 Z" fill="#eef4f8" opacity=".9"/>`);
      const hills = S(`<path d="M-300 600 C -100 520, 120 540, 300 560 C 500 580, 640 520, 860 530 C 1060 540, 1240 500, 1600 540 L1600 900 L-300 900 Z" fill="#7fae7f"/>
        <path d="M-300 640 C 0 590, 260 610, 520 600 C 760 590, 1000 610, 1600 590 L1600 900 L-300 900 Z" fill="#6c9d70"/>
        <g fill="#4f8360">${[60, 140, 190, 1120, 1170, 1230, 380].map((x, i) => `<ellipse cx="${x}" cy="${560 - (i % 3) * 8}" rx="${14 + (i % 2) * 6}" ry="${20 + (i % 3) * 4}"/>`).join("")}</g>`);
      const trees = S(`<g>
          <rect x="455" y="380" width="10" height="220" fill="#4b5a3c"/><ellipse cx="460" cy="400" rx="44" ry="120" fill="#3e7a52"/><ellipse cx="452" cy="420" rx="24" ry="90" fill="#4c8c60"/>
          <rect x="1135" y="420" width="12" height="200" fill="#4b5a3c"/><circle cx="1140" cy="430" r="90" fill="#3b7550"/><circle cx="1100" cy="470" r="60" fill="#468559"/><circle cx="1185" cy="470" r="62" fill="#346c49"/>
          <circle cx="560" cy="470" r="70" fill="#3f7c55"/><circle cx="610" cy="500" r="52" fill="#4a8a5e"/><rect x="556" y="500" width="10" height="100" fill="#4b5a3c"/>
        </g>`);
      const house = S(`<defs><linearGradient id="wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fbf8f1"/><stop offset="1" stop-color="#efe6d6"/></linearGradient>
          <linearGradient id="thatch" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9c8a68"/><stop offset="1" stop-color="#7a6648"/></linearGradient>
          <linearGradient id="path" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#d9c6a0"/><stop offset="1" stop-color="#c9b083"/></linearGradient>
          <radialGradient id="warm" cx="50%" cy="80%" r="70%"><stop offset="0" stop-color="#ffe6a8"/><stop offset="1" stop-color="#eaa452"/></radialGradient>
          <clipPath id="roofC"><path d="M660 330 L1092 330 L1132 458 L772 458 Z"/></clipPath>
          <clipPath id="gabC"><path d="M560 452 L660 342 L760 452 Z"/></clipPath></defs>
        <rect x="-300" y="598" width="1900" height="400" fill="#79a86f"/>
        <path d="M934 600 L990 600 L1120 980 L760 980 Z" fill="url(#path)"/>
        <ellipse cx="840" cy="603" rx="330" ry="12" fill="#5d8a55" opacity=".6"/>
        <!-- side (long) wall with porch -->
        <rect x="772" y="452" width="350" height="148" fill="#e9dfcc"/>
        <rect x="772" y="452" width="350" height="26" fill="#000" opacity=".10"/>
        <rect x="940" y="490" width="56" height="110" fill="#6b4a2f"/><rect x="945" y="495" width="46" height="105" fill="url(#warm)"/>
        <path d="M945 495 L966 501 L966 604 L945 600 Z" fill="#2D6A4F"/>
        <g><rect x="1030" y="500" width="40" height="46" fill="#3b5d7a"/><rect x="1033" y="503" width="34" height="40" fill="#bcd9ea"/><path d="M1050 503 V543" stroke="#efe6d6" stroke-width="3"/></g>
        <rect x="772" y="582" width="350" height="18" fill="#c9a46a"/>
        <g fill="url(#wall)">${[800, 880, 1010, 1092].map((x) => `<rect x="${x}" y="470" width="22" height="130"/>`).join("")}</g>
        <g fill="#000" opacity=".08">${[800, 880, 1010, 1092].map((x) => `<rect x="${x + 22}" y="470" width="8" height="130"/>`).join("")}</g>
        <!-- reed thatch roof plane -->
        <path d="M660 330 L1092 330 L1132 458 L772 458 Z" fill="url(#thatch)"/>
        <g clip-path="url(#roofC)" stroke="#6a573c" stroke-width="2" opacity=".55">${Array.from({ length: 70 }, (_, i) => { const x = 640 + i * 7; return `<path d="M${x} 330 L${x + 42} 460"/>`; }).join("")}</g>
        <path d="M772 458 L1132 458" stroke="#5f4d33" stroke-width="6"/>
        <path d="M660 330 L1092 330" stroke="#6a573c" stroke-width="7" stroke-linecap="round"/>
        <!-- gable front -->
        <rect x="560" y="452" width="200" height="148" fill="url(#wall)"/>
        <rect x="560" y="582" width="200" height="18" fill="#d3b075"/>
        <path d="M560 452 L660 342 L760 452 Z" fill="#9a6538"/>
        <g clip-path="url(#gabC)" stroke="#7b4d28" stroke-width="3">${Array.from({ length: 20 }, (_, i) => `<path d="M${566 + i * 10} 340 V460"/>`).join("")}</g>
        <path d="M640 420 h40 v14 h-40 Z M650 394 h20 v14 h-20 Z" fill="#5a3a1e"/>
        <path d="M546 458 L660 334 L774 458" fill="none" stroke="#5f4d33" stroke-width="12" stroke-linejoin="round"/>
        <rect x="556" y="448" width="208" height="8" fill="#7b4d28"/>
        <g><rect x="588" y="486" width="44" height="54" fill="#2f6f9f"/><rect x="592" y="490" width="36" height="46" fill="#bcd9ea"/><path d="M610 490 V536 M592 512 H628" stroke="#f4efe4" stroke-width="3.5"/></g>
        <g><rect x="688" y="486" width="44" height="54" fill="#2f6f9f"/><rect x="692" y="490" width="36" height="46" fill="#bcd9ea"/><path d="M710 490 V536 M692 512 H728" stroke="#f4efe4" stroke-width="3.5"/></g>
        <rect x="846" y="296" width="28" height="44" fill="#efe6d6"/><rect x="842" y="292" width="36" height="8" fill="#b9ad97"/>
        <!-- plank fence with opening for the path -->
        <g>${Array.from({ length: 60 }, (_, i) => { const x = 200 + i * 19; if (x > 900 && x < 1010) return ""; const c = ["#8b6a48", "#7d5e3f", "#96744f"][i % 3]; return `<path d="M${x} 662 L${x} 604 Q${x + 8} 596 ${x + 16} 604 L${x + 16} 662 Z" fill="${c}"/>`; }).join("")}</g>
        <rect x="196" y="618" width="706" height="7" fill="#6b5034"/><rect x="1008" y="618" width="400" height="7" fill="#6b5034"/>`);
      const fg = S(`<g>
          ${Array.from({ length: 70 }, (_, i) => { const r = U.rng(40 + i); const x = -80 + i * 22 + r() * 18, h = 120 + r() * 200, c = ["#2e5f3f", "#3a7049", "#24502f"][i % 3]; return `<path d="M${x} 800 Q${x + (r() - 0.5) * 50} ${800 - h * 0.6} ${x + (r() - 0.5) * 90} ${800 - h} Q${x + 10} ${800 - h * 0.5} ${x + 18} 800 Z" fill="${c}"/>`; }).filter((_, i) => i < 16 || i > 56).join("")}
          <g transform="translate(150 610) rotate(-14)">
            <path d="M0 40 C 10 120, 0 200, -10 300" stroke="#3f6b2f" stroke-width="16" fill="none"/>
            <path d="M-6 150 C -90 120, -140 160, -160 210 C -100 210, -40 190, -6 150 Z" fill="#4a7d34"/>
            ${Array.from({ length: 22 }, (_, i) => `<ellipse cx="0" cy="-118" rx="24" ry="62" fill="${i % 2 ? "#f6c32c" : "#f0b21c"}" transform="rotate(${i * (360 / 22)})"/>`).join("")}
            <circle r="74" fill="#5a3518"/><circle r="56" fill="#6e4320"/><circle r="30" fill="#4a2a12"/>
          </g>
          <g transform="translate(1250 -20)">
            ${Array.from({ length: 9 }, (_, i) => `<ellipse cx="${-40 - i * 34}" cy="${40 + (i % 3) * 22 + i * 6}" rx="44" ry="20" fill="${["#3b6e3f", "#2f5f36", "#467c46"][i % 3]}" transform="rotate(${20 + i * 6} ${-40 - i * 34} ${40 + i * 8})"/>`).join("")}
            <path d="M40 -10 C -80 40, -200 70, -330 110" stroke="#4b3a26" stroke-width="10" fill="none"/>
          </g>
        </g>`);
      const LAYERS = [
        { html: sky, z: 9000, inf: true },
        { html: mtn, z: 4200 },
        { html: hills, z: 2100 },
        { html: trees, z: 1350 },
        { html: house, z: 1000 },
        { html: `<div id="t7"><div class="w">a ház<span class="ba">ba</span></div><div class="ru">в дом</div></div>`, z: 1000, text: true },
        { html: fg, z: 430 },
      ];
      const els = LAYERS.map((L) => { const d = U.el("div", { class: "L7" }, st, L.html); return { ...L, el: d }; });
      // camera
      const ease = (t) => { t = U.clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
      seekFn = (t) => {
        const p = ease(t / 3.5);
        const camZ = U.lerp(-260, 0, p), camX = U.lerp(-70, 0, p), camY = U.lerp(-20, 0, p);
        const focusD = U.lerp(430, 1000, ease((t - 0.6) / 2.2)); // rack focus: foreground -> house
        const A = 9.5;
        for (const L of els) {
          const z0 = L.z, d = z0 - camZ, k = z0 / F, s = (k * F) / d; // s=1 at camZ=0
          const tx = (-camX * F) / d, ty = (-camY * F) / d;
          L.el.style.transform = `translate(${tx}px,${ty}px) scale(${L.inf ? 1 + (s - 1) * 0.15 : s})`;
          const blur = L.inf ? 0 : A * F * Math.abs(1 / d - 1 / focusD);
          L.el.style.filter = blur > 0.25 ? `blur(${blur.toFixed(2)}px)` : "none";
          if (L.text) { L.el.style.opacity = U.clamp((t - 0.9) / 0.8, 0, 1); }
        }
      };
      seekFn(0);
    },
    seek(t) { seekFn(t); },
  };
})();
