// 9. Duotone photomontage: CC0 photo cut-out (Nagyrákos tájház, Zerind / Wikimedia Commons) + flat graphics
(function () {
  let tl;
  const DARK = [16, 52, 40], LIGHT = [246, 239, 220];
  window.SCENE = {
    still: 3.4,
    src: "Фото: Zerind, «Nagyrákos, tájház» (2019), Wikimedia Commons, CC0",
    async build(st) {
      // S-curve duotone tables
      const N = 12, curve = (x) => { const k = 1 / (1 + Math.exp(-7 * (x - 0.5))); const k0 = 1 / (1 + Math.exp(3.5)), k1 = 1 / (1 + Math.exp(-3.5)); return (k - k0) / (k1 - k0); };
      const tab = (c) => Array.from({ length: N + 1 }, (_, i) => { const v = curve(i / N); return ((DARK[c] + (LIGHT[c] - DARK[c]) * v) / 255).toFixed(3); }).join(" ");
      const img = new Image(); img.src = "assets/house_cut.png"; await img.decode();
      const S = 0.74, IW = img.naturalWidth * S, IH = img.naturalHeight * S, IX = 30, IY = 214;
      const DX = IX + 725 * S, DY = IY + 440 * S; // first porch door
      let dots = "";
      for (let y = 0; y < 30; y++) for (let x = 0; x < 30; x++) { const r = 2 + (x + y) * 0.16; dots += `<circle cx="${x * 20 + (y % 2) * 10}" cy="${y * 18}" r="${Math.min(r, 8.5).toFixed(2)}"/>`; }
      const svg = U.svgRoot(st, 1280, 764, `
        <defs>
          <filter id="duo" color-interpolation-filters="sRGB">
            <feColorMatrix type="matrix" values="0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0 0 0 1 0"/>
            <feComponentTransfer><feFuncR type="table" tableValues="${tab(0)}"/><feFuncG type="table" tableValues="${tab(1)}"/><feFuncB type="table" tableValues="${tab(2)}"/></feComponentTransfer>
          </filter>
          <filter id="drop" x="-10%" y="-10%" width="125%" height="130%"><feGaussianBlur in="SourceAlpha" stdDeviation="6"/><feOffset dx="8" dy="12"/><feComponentTransfer><feFuncA type="linear" slope=".35"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="rough9" x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="2"/><feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>
          <clipPath id="circ"><circle cx="420" cy="388" r="282"/></clipPath>
        </defs>
        <rect width="1280" height="764" fill="#efe6d2"/>
        <g id="circleG">
          <circle id="sunC" cx="420" cy="388" r="282" fill="#ee5a36"/>
          <g clip-path="url(#circ)"><g fill="#c8401f" opacity=".5" transform="translate(120 96)">${dots}</g></g>
        </g>
        <g id="lines" stroke="#1a1a1a" stroke-width="3">
          <path d="M60 700 H1220"/><path d="M60 712 H600" stroke-width="1.5"/>
        </g>
        <rect id="greenbar" x="1000" y="0" width="56" height="764" fill="#2D6A4F" opacity=".95"/>
        <g id="photo" filter="url(#drop)"><image href="assets/house_cut.png" x="${IX}" y="${IY}" width="${IW}" height="${IH}" filter="url(#duo)"/></g>
        <g id="txt">
          <text id="t1" x="636" y="190" style="font-family:Unbounded;font-weight:800" font-size="112" letter-spacing="-4" fill="#171717">a ház</text>
          <text id="t2" x="0" y="190" style="font-family:Unbounded;font-weight:800" font-size="112" letter-spacing="-4" fill="#f6efdc">ba</text>
        </g>
        <g id="label" transform="translate(905 262) rotate(-4)">
          <path d="M-8 -50 L232 -54 L236 18 L-4 22 Z" fill="#fbf8f0" filter="url(#rough9)"/>
          <text x="20" y="0" style="font-family:'Source Serif 4';font-style:italic" font-size="52" fill="#171717">в дом</text>
        </g>
        <g id="arrow9">
          <path id="ap9" d="M960 330 C 960 450, 860 520, ${DX + 40} ${DY}" fill="none" stroke="#171717" stroke-width="16" stroke-linecap="square"/>
          <path id="ah9" d="M-30 -24 L4 0 L-30 24" fill="none" stroke="#171717" stroke-width="16" stroke-linecap="square"/>
        </g>
        <g id="meta" style="font-family:'JetBrains Mono';font-weight:500" font-size="15" fill="#171717" letter-spacing="1.5">
          <text x="64" y="740">NAGYRÁKOS · HU · 2019</text><text x="1216" y="740" text-anchor="end">-BA / -BE  ·  ILLATÍVUSZ</text>
        </g>
        <g id="reg" stroke="#171717" stroke-width="2" fill="none" transform="translate(1180 70)"><circle r="14"/><path d="M-24 0 H24 M0 -24 V24"/></g>
        <rect width="1280" height="764" fill="url(#np9)" opacity=".10" style="mix-blend-mode:multiply"/>
      `);
      svg.querySelector("defs").insertAdjacentHTML("beforeend", `<pattern id="np9" width="256" height="256" patternUnits="userSpaceOnUse"><image href="${U.noiseURL(256, 255, 19)}" width="256" height="256"/></pattern>`);
      const t1 = svg.querySelector("#t1"), t2 = svg.querySelector("#t2");
      const b1 = t1.getBBox(); t2.setAttribute("x", b1.x + b1.width + 6);
      const b2 = t2.getBBox(), gb = svg.querySelector("#greenbar"); gb.setAttribute("x", b2.x - 16); gb.setAttribute("width", b2.width + 32);
      const mt = svg.querySelectorAll("#meta text")[1]; mt.setAttribute("x", b2.x - 40);
      const ap = svg.querySelector("#ap9"), ah = svg.querySelector("#ah9"), L = ap.getTotalLength();
      ap.style.strokeDasharray = `${L} ${L}`;
      const A = { p: 0 };
      const place = () => { ap.style.strokeDashoffset = L * (1 - A.p); const d = Math.max(1, A.p * L), a = ap.getPointAtLength(d), b = ap.getPointAtLength(Math.max(0, d - 3)); ah.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI})`); ah.style.opacity = A.p > 0.04 ? 1 : 0; };
      tl = gsap.timeline({ paused: true });
      tl.from("#sunC", { attr: { r: 0 }, duration: 0.9, ease: "expo.out" }, 0)
        .from("#circleG > g", { opacity: 0, duration: 0.6 }, 0.4)
        .from("#greenbar", { scaleY: 0, transformOrigin: "50% 0%", duration: 0.7, ease: "expo.out" }, 0.15)
        .from("#lines path", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.8, stagger: 0.1, ease: "expo.out" }, 0.2)
        .from("#photo", { y: 560, duration: 1.0, ease: "expo.out" }, 0.3)
        .fromTo("#photo image", { attr: { x: IX - 30 } }, { attr: { x: IX + 10 }, duration: 3.5, ease: "none" }, 0)
        .from("#t1", { x: 80, opacity: 0, duration: 0.7, ease: "expo.out" }, 0.8)
        .from("#t2", { y: -90, opacity: 0, duration: 0.7, ease: "back.out(2)" }, 1.1)
        .from("#label", { scale: 0, rotation: 14, transformOrigin: "50% 50%", duration: 0.6, ease: "back.out(2)" }, 1.35)
        .to(A, { p: 1, duration: 0.9, ease: "power2.inOut", onUpdate: place }, 1.7)
        .from(["#meta text", "#reg"], { opacity: 0, duration: 0.5, stagger: 0.1 }, 1.2)
        .to({}, { duration: 0.1 }, 3.5);
      place();
    },
    seek(t) { tl.seek(t, false); },
  };
})();
