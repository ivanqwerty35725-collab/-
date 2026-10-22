/* Kirill, 24: dark short hair, dark-green sweater, jeans, brown backpack.
   Painted as puppet parts. Each part has its pivot at (0,0) in design units (figure = 200 units tall). */
(function () {
  const U = window.GOU;
  const { seed, rr, mix, rgba, jit, region, edge, wash, rough, polyPath, ellipsePts, spline, limb, rrect, sprite, granulate, dab, bristle, blade } = U;
  const S = 3; // canvas px per design unit
  const C = {
    skin: "#E8BE98", skinL: "#F4D5B6", skinD: "#C48E6C", blush: "#D98A78",
    hair: "#2A201B", hairL: "#4C3D33", hairD: "#17110E",
    sw: "#33503F", swL: "#4E6E59", swD: "#1F3328", rib: "#2A4535",
    jean: "#4F6B8C", jeanL: "#7690AE", jeanD: "#33496A",
    pack: "#8A5538", packL: "#B07A55", packD: "#5A3322", strap: "#5E3B28",
    shoe: "#2F2723", shoeL: "#5A4B42", sole: "#E6DECF",
    ink: "#1E1813",
  };
  const OUT = {}; // name -> {c, ox, oy, S, outline:[[...]], detail:[[...]]}

  // light from upper-left: t in 0..1 across the part, returns lit->shade colour
  const litFn = (L, M, D, cx, w, cy, h, k = 1) => (x, y) => {
    const u = (x - cx) / w, v = (y - cy) / h; const t = U.clamp(0.5 + 0.55 * u * k + 0.25 * v, 0, 1);
    return t < 0.5 ? mix(L, M, t * 2) : mix(M, D, (t - 0.5) * 2);
  };
  function finish(sp, name, outline, detail, filt = "rough-s") {
    granulate(sp.g, 0.28, 1);
    const c = U.displace(sp.c, filt);
    OUT[name] = { c, ox: sp.ox, oy: sp.oy, S, outline: outline || [], detail: detail || [] };
  }
  function paintShape(g, pts, col, o = {}) {
    const bb = U.bbox(pts), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, w = (bb[2] - bb[0]) / 2 || 1, h = (bb[3] - bb[1]) / 2 || 1;
    const fn = o.fn || litFn(col[0], col[1], col[2], cx, w, cy, h, o.k ?? 1);
    region(g, pts, fn, { density: o.density ?? 0.9, len: o.len || [2.2, 5.5], w: o.w || [0.9, 2.0], a: o.a ?? 0.55, ang: o.ang ?? 1.57, angJ: o.angJ ?? 0.5, jit: o.jit ?? 6, dry: o.dry ?? 0.25, lw: 0.22 });
    if (o.edge !== false) edge(g, pts, o.edgeCol || col[2], o.edgeA ?? 0.5, o.edgeW ?? 0.55);
  }
  const R = (pts, amp = 0.35, f = 0.35, sd = 0) => rough(pts, amp, f, true, sd, 0.8);
  const arc = (cx, cy, rx, ry, a0, a1, n = 10) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; };
  const qd = (a, c, b, n = 8) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]); } return o; };

  // ---------------- FRONT VIEW ----------------
  function headF() {
    seed(101); const sp = sprite([-18, -42, 18, 5], S); const g = sp.g;
    const neck = R([[-5.4, -8], [5.4, -8], [6, 4], [-6, 4]]);
    paintShape(g, neck, [C.skinL, C.skin, C.skinD]);
    wash(g, neck, C.skinD, 0.55); // under-chin shadow
    const face = []; for (let i = 0; i < 48; i++) { const t = (i / 48) * Math.PI * 2, s = Math.sin(t); const tap = s > 0 ? 1 - 0.2 * Math.pow(s, 2.2) : 1; face.push([Math.cos(t) * 13 * tap, -20 + s * (s > 0 ? 16.6 : 17.4)]); }
    const F = R(face, 0.25, 0.3, 3);
    for (const sx of [-1, 1]) { const ear = R(ellipsePts(sx * 13, -19, 2.7, 4.3, 20), 0.2); paintShape(g, ear, [C.skinL, C.skin, C.skinD], { density: 1.5 }); dab(g, sx * 13.3, -19, 1.57, 4, 1.2, C.skinD, 0.5); }
    paintShape(g, F, [C.skinL, C.skin, C.skinD], { density: 1.1, k: 0.8 });
    // soft modelling: shade on the right cheek and under the hair line
    g.save(); polyPath(g, F); g.clip(); g.filter = "blur(1.6px)";
    g.fillStyle = rgba(C.skinD, 0.35); g.beginPath(); g.ellipse(10, -16, 6, 13, 0, 0, 7); g.fill();
    g.fillStyle = rgba(C.skinL, 0.45); g.beginPath(); g.ellipse(-6, -24, 5, 5, 0, 0, 7); g.fill();
    g.fillStyle = rgba(C.blush, 0.22); g.beginPath(); g.ellipse(-7.2, -13, 3, 1.8, 0, 0, 7); g.ellipse(7.2, -13, 3, 1.8, 0, 0, 7); g.fill();
    g.restore();
    // hair: short, dark, a soft fringe pushed to one side
    const hair = R(spline([[-14, -19], [-14.6, -27], [-11.5, -34.5], [-4, -38.8], [4.5, -38.6], [11.5, -35], [14.6, -27.5], [14, -19.5], [12.6, -23.5], [10.5, -27.2], [6.5, -28.6], [2.5, -27.4], [-1.5, -29.0], [-6.5, -28.2], [-10.5, -26.4], [-12.6, -23]], 5), 0.3, 0.4, 7);
    region(g, hair, (x, y) => mix(C.hairL, C.hair, U.clamp(0.4 + (x + 14) / 40 + (y + 38) / 60, 0, 1)), { density: 1.6, len: [3, 7], w: [0.6, 1.4], a: 0.7, ang: (x, y) => Math.atan2(y + 20, x) + 1.57, angJ: 0.3, jit: 5 });
    for (let i = 0; i < 26; i++) { const x = rr(-11, 9), y = rr(-37, -30); blade(g, x, y, x + rr(2, 5), y + rr(3, 6), 0.3, 0.9, 0.2, mix(C.hairL, "#6a5446", 0.3), 0.45); }
    edge(g, hair, C.hairD, 0.6, 0.5);
    const jaw = face.filter((q) => q[1] > -23); jaw.sort((a, b) => Math.atan2(b[1] + 20, b[0]) - Math.atan2(a[1] + 20, a[0]));
    finish(sp, "headF", [hair], [jaw.reverse(), arc(-13, -19, 2.7, 4.3, Math.PI * 0.5, Math.PI * 1.5), arc(13, -19, 2.7, 4.3, -Math.PI * 0.5, Math.PI * 0.5), [[-5.4, -4], [-6, 4]], [[5.4, -4], [6, 4]]]);
  }
  function faceF() {
    seed(111); const sp = sprite([-12, -28, 12, -6], S); const g = sp.g;
    g.lineCap = "round";
    for (const sx of [-1, 1]) {
      // eye: dark iris with a lid line and a glint
      g.fillStyle = rgba("#F3EBE0", 0.9); g.beginPath(); g.ellipse(sx * 4.9, -19.2, 2.0, 1.15, 0, 0, 7); g.fill();
      g.fillStyle = rgba("#2B211C"); g.beginPath(); g.ellipse(sx * 4.9 + 0.2, -19.2, 1.15, 1.25, 0, 0, 7); g.fill();
      g.strokeStyle = rgba(C.hairD, 0.85); g.lineWidth = 0.55; g.beginPath(); g.moveTo(sx * 2.8, -19.6); g.quadraticCurveTo(sx * 4.9, -20.9, sx * 7.0, -19.4); g.stroke();
      g.fillStyle = "rgba(255,255,255,0.85)"; g.beginPath(); g.arc(sx * 4.9 - 0.35, -19.6, 0.32, 0, 7); g.fill();
      // brow
      g.strokeStyle = rgba(C.hair, 0.9); g.lineWidth = 1.0; g.beginPath(); g.moveTo(sx * 2.6, -22.9); g.quadraticCurveTo(sx * 5.2, -24.1, sx * 7.8, -23.2); g.stroke();
    }
    // nose: shadow side + nostril hint
    g.strokeStyle = rgba(C.skinD, 0.75); g.lineWidth = 0.7; g.beginPath(); g.moveTo(0.9, -20); g.quadraticCurveTo(1.6, -16, 1.8, -14.6); g.quadraticCurveTo(0.6, -13.8, -1.2, -14.2); g.stroke();
    // mouth: a calm, slight smile
    g.strokeStyle = rgba("#94503F", 0.9); g.lineWidth = 0.75; g.beginPath(); g.moveTo(-2.8, -9.9); g.quadraticCurveTo(0, -8.7, 2.8, -9.9); g.stroke();
    g.strokeStyle = rgba(C.skinD, 0.5); g.lineWidth = 0.5; g.beginPath(); g.moveTo(-1.4, -7.6); g.quadraticCurveTo(0, -7.1, 1.4, -7.6); g.stroke();
    const det = [];
    for (const sx of [-1, 1]) { det.push(qd([sx * 2.8, -19.6], [sx * 4.9, -20.9], [sx * 7.0, -19.4])); det.push(arc(sx * 4.9 + 0.2, -19.2, 1.0, 1.1, 0, Math.PI * 2, 10)); det.push(qd([sx * 2.6, -22.9], [sx * 5.2, -24.1], [sx * 7.8, -23.2])); }
    det.push(qd([0.9, -20], [1.6, -16], [1.8, -14.6])); det.push(qd([1.8, -14.6], [0.6, -13.8], [-1.2, -14.2], 4)); det.push(qd([-2.8, -9.9], [0, -8.7], [2.8, -9.9]));
    OUT.faceF = { c: sp.c, ox: sp.ox, oy: sp.oy, S, outline: [], detail: det };
  }
  function packF() {
    seed(121); const sp = sprite([-26, -66, 26, -8], S); const g = sp.g;
    const p = R(rrect(-23.5, -62, 47, 52, 9), 0.35, 0.3, 2);
    paintShape(g, p, [C.packL, C.pack, C.packD], { density: 0.8 });
    finish(sp, "packF", [p], []);
  }
  function torsoF() {
    seed(131); const sp = sprite([-24, -68, 24, 20], S); const g = sp.g;
    // jeans hips
    const hips = R([[-17.6, -2], [17.6, -2], [18, 12], [6, 15], [-6, 15], [-18, 12]]);
    paintShape(g, hips, [C.jeanL, C.jean, C.jeanD]);
    // sweater body
    const body = R(spline([[-6.4, -64.5], [-14.5, -62], [-19.4, -58.6], [-21.2, -52], [-20.6, -40], [-19, -22], [-18.4, -8], [-18.8, 1.6], [0, 2.8], [18.8, 1.6], [18.4, -8], [19, -22], [20.6, -40], [21.2, -52], [19.4, -58.6], [14.5, -62], [6.4, -64.5], [0, -61.6]], 4), 0.3, 0.35, 5);
    paintShape(g, body, [C.swL, C.sw, C.swD], { density: 1.0, len: [2.5, 6], ang: 1.57, angJ: 0.25, k: 1.1 });
    // knit ribs and folds
    g.save(); polyPath(g, body); g.clip();
    for (let x = -20; x <= 20; x += 2.3) { g.strokeStyle = rgba(C.swD, 0.13); g.lineWidth = 0.45; g.beginPath(); g.moveTo(x + rr(-0.3, 0.3), -62); g.lineTo(x + rr(-0.6, 0.6), 2); g.stroke(); }
    g.filter = "blur(1.2px)";
    g.fillStyle = rgba(C.swD, 0.35); g.beginPath(); g.ellipse(15, -30, 6, 30, 0, 0, 7); g.fill();
    g.fillStyle = rgba(C.swL, 0.25); g.beginPath(); g.ellipse(-10, -50, 8, 9, 0, 0, 7); g.fill();
    g.filter = "none";
    for (const [x0, y0, x1, y1] of [[-14, -10, -6, -6], [4, -8, 13, -11], [-3, -16, 4, -14]]) { g.strokeStyle = rgba(C.swD, 0.35); g.lineWidth = 0.7; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 1.5, x1, y1); g.stroke(); }
    // hem rib
    const hem = R([[-18.9, -5.5], [18.9, -5.5], [18.8, 1.6], [0, 2.8], [-18.8, 1.6]], 0.2);
    region(g, hem, () => U.hex(C.rib), { density: 2, len: [1.5, 3], w: [0.6, 1], a: 0.6, ang: 1.57, angJ: 0.05 });
    for (let x = -18; x <= 18; x += 1.4) { g.strokeStyle = rgba(C.swD, 0.45); g.lineWidth = 0.35; g.beginPath(); g.moveTo(x, -5.2); g.lineTo(x, 2); g.stroke(); }
    g.restore();
    // collar
    g.strokeStyle = rgba(C.rib); g.lineWidth = 2.4; g.beginPath(); g.moveTo(-7, -64.2); g.quadraticCurveTo(0, -59.6, 7, -64.2); g.stroke();
    g.strokeStyle = rgba(C.swL, 0.5); g.lineWidth = 0.5; g.beginPath(); g.moveTo(-6.4, -63.2); g.quadraticCurveTo(0, -58.9, 6.4, -63.2); g.stroke();
    // backpack straps
    for (const sx of [-1, 1]) {
      const st = []; const a = [sx * 11.5, -64], b = [sx * 13.6, -40], c = [sx * 14.2, -27];
      const L = spline([a, [sx * 12.8, -55], b, c], 6, false);
      g.strokeStyle = rgba(C.strap); g.lineWidth = 3.6; g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      g.strokeStyle = rgba(sx < 0 ? C.packL : C.packD, 0.6); g.lineWidth = 0.6; g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0] - sx * 1.2, p[1]) : g.moveTo(p[0] - sx * 1.2, p[1])); g.stroke();
      g.fillStyle = rgba("#C9B48A"); g.fillRect(sx * 13.9 - 2, -36, 4, 1.6);
      st.push(L);
    }
    const det = [qd([-7, -64.2], [0, -59.6], [7, -64.2]), [[-18.8, -5.5], [18.8, -5.5]]];
    for (const sx of [-1, 1]) det.push(spline([[sx * 11.5, -64], [sx * 12.8, -55], [sx * 13.6, -40], [sx * 14.2, -27]], 6, false).map((p) => [p[0] - sx * 1.8, p[1]]), spline([[sx * 11.5, -64], [sx * 12.8, -55], [sx * 13.6, -40], [sx * 14.2, -27]], 6, false).map((p) => [p[0] + sx * 1.8, p[1]]));
    finish(sp, "torsoF", [body, hips], det);
  }
  function armF(name, side, open) {
    // side -1 = viewer-left arm (lit), +1 = viewer-right (shade)
    seed(141 + (side > 0 ? 7 : 0) + (open ? 3 : 0));
    const k = side < 0 ? 0 : 0.25;
    {
      const sp = sprite([-8, -6, 8, 36], S); const g = sp.g;
      const ua = R(limb([0, 0], [0, 31], 11, 9.4), 0.3);
      paintShape(g, ua, [mix(C.swL, C.sw, k), C.sw, C.swD], { density: 1.1, k: -side * 0.5 });
      g.save(); polyPath(g, ua); g.clip(); for (let x = -6; x <= 6; x += 2.2) { g.strokeStyle = rgba(C.swD, 0.14); g.lineWidth = 0.4; g.beginPath(); g.moveTo(x, -4); g.lineTo(x, 34); g.stroke(); } g.restore();
      finish(sp, name + "U", [ua], []);
    }
    {
      const sp = sprite([-8, -6, 8, 44], S); const g = sp.g;
      // hand first (under the cuff)
      let hand;
      if (open) {
        hand = R(spline([[-3.6, 27], [-4.2, 32], [-4.4, 37], [-3.4, 40.6], [-1.8, 37.2], [-1.2, 41.4], [0.3, 37.4], [1.2, 41.6], [2.4, 37.4], [3.6, 40.6], [4.0, 35], [6.4, 31.2], [5.2, 29.8], [3.8, 27]], 4), 0.2);
      } else {
        hand = R(spline([[-3.4, 27], [-3.9, 33], [-2.8, 38.4], [0, 39.6], [2.8, 38.2], [3.9, 32.5], [4.6, 30.5], [3.4, 27]], 5), 0.2);
      }
      paintShape(g, hand, [C.skinL, C.skin, C.skinD], { density: 1.6, edgeA: 0.6 });
      const fa = R(limb([0, 0], [0, 28.5], 9.4, 8.2), 0.3);
      paintShape(g, fa, [mix(C.swL, C.sw, k), C.sw, C.swD], { density: 1.1, k: -side * 0.5 });
      const cuff = R(rrect(-4.4, 24.6, 8.8, 4.4, 1.5), 0.15);
      region(g, cuff, () => U.hex(C.rib), { density: 2.4, len: [1.2, 2.5], w: [0.6, 1], a: 0.6, ang: 1.57, angJ: 0.05 });
      for (let x = -4; x <= 4; x += 1.2) { g.strokeStyle = rgba(C.swD, 0.45); g.lineWidth = 0.3; g.beginPath(); g.moveTo(x, 24.8); g.lineTo(x, 28.8); g.stroke(); }
      finish(sp, name + "L", [fa, hand], [[[-4.4, 24.8], [4.4, 24.8]]]);
    }
  }
  function legF(name, side) {
    seed(161 + (side > 0 ? 5 : 0)); const sp = sprite([-11, -4, 11, 99], S); const g = sp.g;
    const sh = R(spline([[-8.6, 88.4], [-9.2, 92.6], [-7.4, 95.4], [side * 3 + 0, 96.2], [7.6, 95.2], [8.8, 92], [7.6, 88.2]], 5), 0.2);
    paintShape(g, sh, [C.shoeL, C.shoe, "#15100D"], { density: 1.5 });
    g.strokeStyle = rgba(C.sole, 0.95); g.lineWidth = 1.3; g.beginPath(); g.moveTo(-8.6, 94.2); g.quadraticCurveTo(0, 96.6, 8.4, 94.0); g.stroke();
    g.strokeStyle = rgba("#F2EDE4", 0.6); g.lineWidth = 0.5; g.beginPath(); g.moveTo(-3, 89.4); g.lineTo(3, 89.2); g.stroke();
    const leg = R([[-8.2, 0], [-8.0, 22], [-7.0, 46], [-6.4, 70], [-6.6, 89], [6.6, 89], [6.4, 70], [6.8, 46], [7.8, 22], [8.2, 0]], 0.3, 0.3, side);
    const k = side < 0 ? 0 : 0.3;
    paintShape(g, leg, [mix(C.jeanL, C.jean, k), C.jean, C.jeanD], { density: 1.0, len: [2.5, 6], ang: 1.57, angJ: 0.2, k: 1.2 });
    g.save(); polyPath(g, leg); g.clip(); g.filter = "blur(1px)";
    g.fillStyle = rgba(C.jeanD, 0.4); g.beginPath(); g.ellipse(-side * 6.5, 40, 2.5, 46, 0, 0, 7); g.fill();
    g.fillStyle = rgba(C.jeanL, 0.35); g.beginPath(); g.ellipse(-1, 46, 3, 3, 0, 0, 7); g.fill();
    g.filter = "none";
    g.strokeStyle = rgba("#C9A86A", 0.35); g.lineWidth = 0.4; g.setLineDash([0.9, 0.9]); g.beginPath(); g.moveTo(side * 5.6, 2); g.lineTo(side * 5.2, 82); g.stroke(); g.setLineDash([]);
    g.restore();
    const cuff = R(rrect(-6.9, 83.4, 13.8, 5.2, 1.4), 0.15);
    paintShape(g, cuff, [C.jeanL, mix(C.jean, C.jeanL, 0.3), C.jeanD], { density: 2 });
    finish(sp, name, [leg, sh], [[[-6.9, 83.6], [6.9, 83.6]], qd([-8.6, 94.2], [0, 96.6], [8.4, 94.0])]);
  }

  // ---------------- SIDE VIEW (facing right) ----------------
  function headS() {
    seed(201); const sp = sprite([-19, -42, 20, 6], S); const g = sp.g;
    const neck = R([[-6.6, -7], [4.6, -6], [5.4, 5], [-6.4, 5]]);
    paintShape(g, neck, [C.skinL, C.skin, C.skinD]); wash(g, neck, C.skinD, 0.45);
    const head = R(spline([[-8, -4.5], [-14.6, -12], [-16, -22], [-12.5, -32.5], [-4, -37.4], [5, -36.6], [11.2, -30.5], [13.3, -24.2], [12.9, -21.6], [14.0, -20.0], [16.9, -15.6], [13.8, -13.9], [14.1, -11.9], [13.0, -10.4], [13.6, -8.8], [12.4, -5.6], [9.4, -3.4], [3.4, -4.4]], 4), 0.2, 0.3, 4);
    paintShape(g, head, [C.skinL, C.skin, C.skinD], { density: 1.1, k: -0.6 });
    g.save(); polyPath(g, head); g.clip(); g.filter = "blur(1.4px)";
    g.fillStyle = rgba(C.skinD, 0.32); g.beginPath(); g.ellipse(-2, -10, 9, 6, 0, 0, 7); g.fill();
    g.fillStyle = rgba(C.blush, 0.25); g.beginPath(); g.ellipse(8.4, -13.5, 3, 2, 0, 0, 7); g.fill();
    g.restore();
    const hair = R(spline([[11, -27], [10, -31.8], [6, -35.8], [-1, -38], [-8.6, -36], [-14.4, -30], [-16.6, -21.6], [-15.4, -13], [-11.6, -7.2], [-8.8, -9.6], [-7.6, -15.6], [-4.4, -22.4], [1.8, -23.8], [3.4, -18.4], [4.8, -18.2], [5.4, -23.4], [8.4, -25.6]], 5), 0.3, 0.4, 9);
    region(g, hair, (x, y) => mix(C.hairL, C.hair, U.clamp(0.35 + (x + 16) / 50 + (y + 38) / 70, 0, 1)), { density: 1.6, len: [3, 7], w: [0.6, 1.4], a: 0.7, ang: (x, y) => Math.atan2(y + 18, x + 2) + 1.57, angJ: 0.3, jit: 5 });
    for (let i = 0; i < 22; i++) { const x = rr(-12, 7), y = rr(-37, -29); blade(g, x, y, x + rr(-5, -2), y + rr(3, 6), 0.3, 0.9, 0.2, mix(C.hairL, "#6a5446", 0.3), 0.45); }
    edge(g, hair, C.hairD, 0.6, 0.5);
    const ear = R(ellipsePts(-1.6, -16.6, 2.8, 4.3, 20), 0.2);
    paintShape(g, ear, [C.skinL, C.skin, C.skinD], { density: 1.6 }); dab(g, -1.3, -16.4, 1.4, 4, 1.1, C.skinD, 0.55);
    // eye, brow, mouth, nostril
    g.fillStyle = rgba("#F3EBE0", 0.85); g.beginPath(); g.ellipse(10.1, -20.4, 1.5, 1.1, 0, 0, 7); g.fill();
    g.fillStyle = rgba("#2B211C"); g.beginPath(); g.ellipse(10.5, -20.4, 0.95, 1.2, 0, 0, 7); g.fill();
    g.strokeStyle = rgba(C.hairD, 0.85); g.lineWidth = 0.5; g.beginPath(); g.moveTo(8.4, -21.2); g.quadraticCurveTo(10.2, -22.0, 11.6, -21); g.stroke();
    g.strokeStyle = rgba(C.hair, 0.9); g.lineWidth = 1.0; g.beginPath(); g.moveTo(7.6, -23.9); g.quadraticCurveTo(10, -25.0, 12.2, -24.2); g.stroke();
    g.strokeStyle = rgba("#94503F", 0.85); g.lineWidth = 0.65; g.beginPath(); g.moveTo(11.2, -10.2); g.quadraticCurveTo(12.4, -10.0, 13.2, -10.5); g.stroke();
    g.strokeStyle = rgba(C.skinD, 0.7); g.lineWidth = 0.55; g.beginPath(); g.moveTo(13.6, -14.6); g.quadraticCurveTo(14.6, -14.4, 15.0, -15.2); g.stroke();
    finish(sp, "headS", [head, hair], []);
  }
  function torsoS() {
    seed(211); const sp = sprite([-18, -70, 18, 16], S); const g = sp.g;
    const seat = R([[-14, -5], [13, -5], [13.6, 7], [4, 12], [-8, 12], [-14.8, 6]]);
    paintShape(g, seat, [C.jeanL, C.jean, C.jeanD]);
    const body = R(spline([[-6, -66], [-11.6, -61], [-14.2, -48], [-13.6, -30], [-12.8, -14], [-13.6, 2], [12.6, 2], [12.2, -14], [13.6, -30], [14.6, -42], [12.4, -56], [6.4, -64.6], [0, -67]], 5), 0.3, 0.35, 6);
    paintShape(g, body, [C.swL, C.sw, C.swD], { density: 1.0, len: [2.5, 6], ang: 1.57, angJ: 0.25, k: -0.4 });
    g.save(); polyPath(g, body); g.clip();
    for (let x = -14; x <= 14; x += 2.3) { g.strokeStyle = rgba(C.swD, 0.13); g.lineWidth = 0.45; g.beginPath(); g.moveTo(x, -66); g.lineTo(x + rr(-0.5, 0.5), 2); g.stroke(); }
    g.filter = "blur(1.2px)"; g.fillStyle = rgba(C.swD, 0.35); g.beginPath(); g.ellipse(-11, -30, 5, 32, 0, 0, 7); g.fill(); g.filter = "none";
    const hem = R([[-13.8, -5.5], [12.8, -5.5], [12.6, 2], [-13.6, 2]], 0.2);
    region(g, hem, () => U.hex(C.rib), { density: 2, len: [1.5, 3], w: [0.6, 1], a: 0.6, ang: 1.57, angJ: 0.05 });
    for (let x = -13.5; x <= 12.5; x += 1.4) { g.strokeStyle = rgba(C.swD, 0.45); g.lineWidth = 0.35; g.beginPath(); g.moveTo(x, -5.2); g.lineTo(x, 2); g.stroke(); }
    g.restore();
    g.strokeStyle = rgba(C.rib); g.lineWidth = 2.4; g.beginPath(); g.moveTo(-6, -65.5); g.quadraticCurveTo(0, -64.2, 6.2, -64.2); g.stroke();
    // strap over the shoulder, down the chest
    const L = spline([[-4, -64.5], [3, -62], [8.6, -50], [10.4, -36], [10.8, -26]], 6, false);
    g.strokeStyle = rgba(C.strap); g.lineWidth = 3.4; g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    g.strokeStyle = rgba(C.packL, 0.55); g.lineWidth = 0.6; g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0] - 1.1, p[1]) : g.moveTo(p[0] - 1.1, p[1])); g.stroke();
    g.fillStyle = rgba("#C9B48A"); g.save(); g.translate(10.2, -38); g.rotate(-0.12); g.fillRect(-2, -0.8, 4, 1.6); g.restore();
    finish(sp, "torsoS", [body, seat], []);
  }
  function packS() {
    seed(221); const sp = sprite([-36, -72, -8, -8], S); const g = sp.g;
    const p = R(spline([[-12.6, -62], [-19.5, -66.4], [-27.6, -63.6], [-31.6, -52], [-32.4, -30], [-31, -17], [-24.4, -12.6], [-13, -13.6]], 5), 0.3, 0.35, 2);
    paintShape(g, p, [C.packL, C.pack, C.packD], { density: 1.0, k: 0.6 });
    const flap = R(spline([[-13, -62], [-19.5, -66], [-27.5, -63.4], [-31.6, -52], [-31.4, -44], [-25, -42.4], [-17, -45.6], [-13.2, -47]], 5), 0.25);
    paintShape(g, flap, [mix(C.packL, C.pack, 0.4), mix(C.pack, C.packD, 0.3), C.packD], { density: 1.2 });
    g.save(); polyPath(g, flap); g.clip(); g.filter = "blur(1px)"; g.fillStyle = rgba(C.packD, 0.4); g.beginPath(); g.ellipse(-22, -42, 12, 2.6, 0, 0, 7); g.fill(); g.restore();
    const pocket = R(rrect(-33.6, -36, 8, 19, 3), 0.2);
    paintShape(g, pocket, [C.packL, C.pack, C.packD], { density: 1.4 });
    g.strokeStyle = rgba(C.strap); g.lineWidth = 2; g.beginPath(); g.moveTo(-26, -44.2); g.lineTo(-27.6, -33); g.stroke();
    g.fillStyle = rgba("#C9B48A"); g.fillRect(-28.9, -35, 2.8, 2);
    g.strokeStyle = rgba("#F0E2C8", 0.35); g.lineWidth = 0.35; g.setLineDash([0.8, 0.8]); polyPath(g, U.rough(rrect(-30.4, -60, 15.6, 44, 6), 0.1)); g.stroke(); g.setLineDash([]);
    finish(sp, "packS", [p], []);
  }
  function armS(name, far) {
    seed(231 + (far ? 9 : 0)); const dk = far ? 0.32 : 0;
    const sw = [mix(C.swL, C.swD, dk), mix(C.sw, C.swD, dk), mix(C.swD, "#0f1a14", dk)];
    {
      const sp = sprite([-8, -6, 8, 36], S); const g = sp.g;
      const ua = R(limb([0, 0], [0, 31], 10.6, 9.2), 0.3);
      paintShape(g, ua, sw, { density: 1.1, k: -0.4 });
      finish(sp, name + "U", [ua], []);
    }
    {
      const sp = sprite([-8, -6, 9, 42], S); const g = sp.g;
      const hand = R(spline([[-3.2, 26], [-3.6, 32], [-2.4, 37.4], [0.6, 38.6], [3, 36.6], [3.6, 33.6], [5, 31], [3.4, 26]], 5), 0.2);
      paintShape(g, hand, [mix(C.skinL, C.skinD, dk), mix(C.skin, C.skinD, dk), C.skinD], { density: 1.6, edgeA: 0.6 });
      const fa = R(limb([0, 0], [0, 28], 9.2, 8.0), 0.3);
      paintShape(g, fa, sw, { density: 1.1, k: -0.4 });
      const cuff = R(rrect(-4.3, 24.2, 8.6, 4.4, 1.5), 0.15);
      region(g, cuff, () => U.hex(mix(C.rib, "#0f1a14", dk)), { density: 2.4, len: [1.2, 2.5], w: [0.6, 1], a: 0.6, ang: 1.57, angJ: 0.05 });
      finish(sp, name + "L", [fa, hand], []);
    }
  }
  function legS(name, far) {
    seed(251 + (far ? 9 : 0)); const dk = far ? 0.3 : 0;
    const jn = [mix(C.jeanL, C.jeanD, dk), mix(C.jean, C.jeanD, dk), mix(C.jeanD, "#1c2638", dk)];
    {
      const sp = sprite([-11, -6, 11, 52], S); const g = sp.g;
      const th = R(spline([[-8.2, 0], [-7.4, 16], [-6.6, 36], [-6.4, 47], [0, 49.6], [6.6, 46.8], [7.4, 32], [8.8, 14], [8.6, 0], [0, -3.5]], 5), 0.3, 0.3, far ? 3 : 1);
      paintShape(g, th, jn, { density: 1.0, len: [2.5, 6], ang: 1.57, angJ: 0.2, k: -0.5 });
      finish(sp, name + "T", [th], []);
    }
    {
      const sp = sprite([-9, -6, 20, 54], S); const g = sp.g;
      const shoe = R(spline([[-5.6, 42.4], [-6.0, 49.4], [-3, 51], [15.6, 51.2], [18.6, 49.2], [17.6, 46], [10, 43.6], [4.6, 41.4]], 5), 0.2);
      paintShape(g, shoe, [mix(C.shoeL, C.shoe, dk), C.shoe, "#15100D"], { density: 1.6 });
      g.strokeStyle = rgba(mix(C.sole, "#8f887c", dk), 0.95); g.lineWidth = 1.4; g.beginPath(); g.moveTo(-5.6, 49.8); g.lineTo(18, 49.8); g.stroke();
      g.strokeStyle = rgba("#F2EDE4", 0.5 - dk); g.lineWidth = 0.45; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(5 + i * 2.2, 43.2 + i * 0.6); g.lineTo(6.4 + i * 2.2, 45.6 + i * 0.6); g.stroke(); }
      const sh = R(spline([[-6.6, 0], [-6.2, 20], [-5.6, 44.4], [5.4, 44.4], [5.8, 24], [6.8, 10], [6.8, 0], [0, -2.4]], 5), 0.3, 0.3, far ? 5 : 2);
      paintShape(g, sh, jn, { density: 1.0, len: [2.5, 6], ang: 1.57, angJ: 0.2, k: -0.5 });
      const cuff = R(rrect(-6.2, 39.6, 12.2, 5, 1.4), 0.15);
      paintShape(g, cuff, [mix(C.jeanL, C.jeanD, dk), mix(C.jean, C.jeanL, 0.3 - dk), jn[2]], { density: 2 });
      finish(sp, name + "S", [sh, shoe], []);
    }
  }

  window.paintKirill = function () {
    headF(); faceF(); packF(); torsoF(); armF("armFl", -1, false); armF("armFr", 1, false); armF("armFw", 1, true); legF("legFl", -1); legF("legFr", 1);
    headS(); torsoS(); packS(); armS("armSn", false); armS("armSf", true); legS("legSn", false); legS("legSf", true);
    return OUT;
  };
})();
