/* Gouache objects for the S sampler: paper ground, cottage, interior cut-outs, stethoscope, map washes. */
(function () {
  const U = window.GOU;
  const { seed, rr, ri, pick, mix, rgba, jit, hex, region, edge, wash, rough, polyPath, ellipsePts, spline, limb, rrect, sprite, granulate, dab, bristle, blade, lerp, clamp, smooth, fbm, noise } = U;
  const OUT = {};
  const R = (pts, amp = 0.8, f = 0.08, sd = 0, st = 2) => rough(pts, amp, f, true, sd, st);
  const litFn = (L, M, D, cx, w, cy, h, k = 1) => (x, y) => { const u = (x - cx) / w, v = (y - cy) / h; const t = clamp(0.5 + 0.5 * u * k + 0.25 * v, 0, 1); return t < 0.5 ? mix(L, M, t * 2) : mix(M, D, (t - 0.5) * 2); };
  function paint(g, pts, col, o = {}) {
    const bb = U.bbox(pts), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, w = (bb[2] - bb[0]) / 2 || 1, h = (bb[3] - bb[1]) / 2 || 1;
    const fn = o.fn || litFn(col[0], col[1], col[2], cx, w, cy, h, o.k ?? 1);
    region(g, pts, fn, { density: o.density ?? 0.05, len: o.len || [6, 14], w: o.w || [2, 5], a: o.a ?? 0.5, ang: o.ang ?? 0, angJ: o.angJ ?? 0.4, jit: o.jit ?? 6, dry: o.dry ?? 0.2, lw: o.lw ?? 0.6, pad: 4 });
    if (o.edge !== false) edge(g, pts, o.edgeCol || col[2], o.edgeA ?? 0.45, o.edgeW ?? 1.4);
  }
  function done(name, sp, filt = "rough-s", meta = {}, gran = 0.3) {
    granulate(sp.g, gran, 1);
    const c = filt ? U.displace(sp.c, filt) : sp.c;
    OUT[name] = { c, meta: Object.assign({ ox: sp.ox, oy: sp.oy, S: sp.S }, meta) };
    return OUT[name];
  }
  // paper cut-out rim baked around a finished sprite
  function cutRim(name, r = 4, col = "#FBF7EF") {
    const o = OUT[name], im = o.c, pad = Math.ceil(r) + 2, c = U.canvas(im.width + 2 * pad, im.height + 2 * pad), g = c.getContext("2d");
    const tmp = U.canvas(c.width, c.height), t = tmp.getContext("2d");
    for (let i = 0; i < 32; i++) { const a = (i / 32) * Math.PI * 2, rj = r * (0.75 + 0.25 * (0.5 + 0.5 * Math.sin(i * 2.3))); t.drawImage(im, pad + Math.cos(a) * rj, pad + Math.sin(a) * rj); }
    t.globalCompositeOperation = "source-in"; t.fillStyle = col; t.fillRect(0, 0, c.width, c.height);
    g.drawImage(U.displace(tmp, "rough-s"), 0, 0);
    g.globalAlpha = 0.18; g.fillStyle = "#cbbfa8"; g.globalCompositeOperation = "source-atop"; for (let i = 0; i < 400; i++) { g.fillRect(rr(0, c.width), rr(0, c.height), rr(1, 3), 1); }
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over"; g.drawImage(im, pad, pad);
    o.c = c; o.meta.ox -= pad / o.meta.S; o.meta.oy -= pad / o.meta.S;
  }

  // ---------------- paper ground ----------------
  function paper() {
    const W = 1280, H = 720, c = U.canvas(W, H), g = c.getContext("2d"), im = g.createImageData(W, H), r = U.mulberry32(5);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4;
      const fib = fbm(x * 0.35, y * 0.05, 2) * 0.5 + fbm(x * 0.05, y * 0.35, 2) * 0.5;
      const mot = fbm(x * 0.003, y * 0.003, 3);
      let v = 0.955 + 0.025 * mot + 0.02 * fib + (r() - 0.5) * 0.035;
      const tooth = noise(x * 0.6, y * 0.6); if (tooth > 0.6) v -= 0.04 * (tooth - 0.6) / 0.4;
      v = clamp(v, 0, 1);
      im.data[k] = 247 * v; im.data[k + 1] = 240 * v; im.data[k + 2] = 225 * v; im.data[k + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.5, W / 2, H / 2, H * 1.1);
    vg.addColorStop(0, "rgba(140,105,60,0)"); vg.addColorStop(1, "rgba(140,105,60,0.12)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    OUT.paper = { c, jpg: true, meta: {} };
  }

  // ---------------- cottage (front elevation), units: Kirill = 200 tall ----------------
  const HOUSE = { x0: -270, x1: 270, wallTop: -290, plinth: -34, door: [40, -228, 145, -4], eave: -290, ridge: -500 };
  function tileRow(g, x0, x1, y, hgt, w, cols, shade) {
    for (let x = x0 - w * U.rnd(); x < x1 + w; x += w) {
      const c = jit(pick(cols), 9), m = mix(c, shade, 0.35);
      g.fillStyle = rgba(shade, 0.45); g.beginPath(); g.moveTo(x + 2, y - hgt * 0.3); g.lineTo(x + w + 2, y - hgt * 0.3); g.lineTo(x + w + 2, y); g.quadraticCurveTo(x + w / 2 + 2, y + hgt * 0.62, x + 2, y); g.closePath(); g.fill();
      g.fillStyle = rgba(m); g.beginPath(); g.moveTo(x, y - hgt); g.lineTo(x + w, y - hgt); g.lineTo(x + w, y - 2); g.quadraticCurveTo(x + w / 2, y + hgt * 0.5, x, y - 2); g.closePath(); g.fill();
      g.fillStyle = rgba(c, 0.95); g.beginPath(); g.moveTo(x + 1, y - hgt); g.lineTo(x + w * 0.6, y - hgt); g.lineTo(x + w * 0.6, y - 1); g.quadraticCurveTo(x + w * 0.3, y + hgt * 0.38, x + 1, y - 2.5); g.closePath(); g.fill();
      if (U.rnd() < 0.5) { g.fillStyle = rgba(mix(c, "#f0c39a", 0.45), 0.6); g.fillRect(x + 2, y - hgt + 2, 2.4, hgt * 0.7); }
      if (U.rnd() < 0.06) { g.fillStyle = rgba("#6f7a45", 0.4); g.beginPath(); g.ellipse(x + w / 2, y - hgt * 0.4, w * 0.4, hgt * 0.3, 0, 0, 7); g.fill(); }
    }
  }
  function house() {
    seed(51); const sp = sprite([-345, -600, 345, 40], 1.5, 6); const g = sp.g;
    const H = HOUSE, wallC = "#F2E9D8", wallW = "#F8EBD2", wallSh = "#D9D2CC", blue = "#5B7EA6";
    // ground patch + cast shadow
    const gp = R(spline([[-330, 4], [-250, -6], [-60, -9], [150, -8], [320, -4], [338, 8], [250, 22], [0, 26], [-260, 22]], 6), 3, 0.03, 4);
    paint(g, gp, ["#9DAA6A", "#7E8F52", "#5F7140"], { density: 0.08, len: [6, 14], w: [2, 4], ang: 0, angJ: 0.3, edge: false });
    for (let i = 0; i < 260; i++) { const x = rr(-320, 325), y = rr(-4, 18); if (Math.abs(x) > 300 && y > 10) continue; blade(g, x, y, x + rr(-5, 5), y - rr(8, 20), rr(-0.5, 0.5), 2.4, 0.3, jit(pick(["#5F7A40", "#7B9150", "#4E6638", "#8EA060"]), 8), 0.8); }
    for (let i = 0; i < 18; i++) { const x = rr(-320, 320), y = rr(-12, 8); g.fillStyle = rgba(pick(["#E8E2D0", "#D9A23A", "#C8463A", "#6E87C4"]), 0.9); g.beginPath(); g.arc(x, y, rr(1.8, 3), 0, 7); g.fill(); }
    // wall
    const wall = R([[H.x0, H.wallTop], [H.x1, H.wallTop], [H.x1, 0], [H.x0, 0]], 1.2, 0.05, 2);
    paint(g, wall, [wallW, wallC, "#DCD3C3"], { density: 0.05, len: [10, 22], w: [3, 7], ang: 1.57, angJ: 0.35, edgeA: 0.3, fn: (x, y) => mix(mix(wallW, wallC, (x - H.x0) / 540), "#E6D9C2", smooth(-120, 0, y) * 0.6) });
    for (let i = 0; i < 70; i++) dab(g, rr(H.x0 + 6, H.x1 - 6), rr(-70, -36), 1.57, rr(10, 26), rr(3, 6), "#CDBFA6", 0.16);
    // eave shadow
    g.save(); polyPath(g, wall); g.clip(); const es = g.createLinearGradient(0, H.wallTop, 0, H.wallTop + 46); es.addColorStop(0, "rgba(96,84,110,0.5)"); es.addColorStop(1, "rgba(96,84,110,0)"); g.fillStyle = es; g.fillRect(H.x0, H.wallTop, 540, 46); g.restore();
    // plinth
    const pl = R([[H.x0, H.plinth], [H.x1, H.plinth], [H.x1, 0], [H.x0, 0]], 0.8, 0.08, 3);
    paint(g, pl, ["#7E9CC0", blue, "#3F5A7A"], { density: 0.1, len: [8, 16], w: [3, 5], ang: 0, angJ: 0.2, edgeA: 0.4 });
    g.fillStyle = rgba("#2F425A", 0.5); g.fillRect(H.x0, H.plinth, 540, 2);
    for (let x = H.x0 - 4; x < H.x1 + 4; x += rr(12, 20)) { g.fillStyle = rgba(jit("#8D8A84", 10)); g.beginPath(); g.ellipse(x, 3, rr(7, 10), 4.5, 0, 0, 7); g.fill(); }
    // windows (with blue carved trims, shutters, geranium boxes)
    for (const cx of [-200, -75]) {
      const ww = 70, wh = 100, wx = cx - ww / 2, wy = -222;
      g.fillStyle = rgba("#5B7EA6"); g.beginPath(); g.moveTo(wx - 12, wy - 5); g.lineTo(cx, wy - 26); g.lineTo(wx + ww + 12, wy - 5); g.lineTo(wx + ww + 12, wy); g.lineTo(wx - 12, wy); g.fill();
      g.fillStyle = rgba("#F3ECDC"); g.beginPath(); g.arc(cx, wy - 10, 3.6, 0, 7); g.fill();
      for (const sx of [wx - 27, wx + ww + 1]) {
        region(g, [[sx, wy], [sx + 26, wy], [sx + 26, wy + wh], [sx, wy + wh]], () => hex("#4F7299"), { density: 0.25, len: [8, 16], w: [2, 3], a: 0.6, ang: 1.57, angJ: 0.05, jit: 6 });
        g.strokeStyle = rgba("#2E4762", 0.7); g.lineWidth = 1.2; for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(sx + 3, wy + k * wh / 8); g.lineTo(sx + 23, wy + k * wh / 8); g.stroke(); }
        g.strokeStyle = rgba("#2E4762", 0.5); g.strokeRect(sx, wy, 26, wh);
      }
      g.fillStyle = rgba("#EFE8DA"); g.fillRect(wx - 5, wy - 2, ww + 10, wh + 5);
      const gg = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gg.addColorStop(0, "#617891"); gg.addColorStop(0.5, "#34445A"); gg.addColorStop(1, "#283548");
      g.fillStyle = gg; g.fillRect(wx, wy + 2, ww, wh - 2);
      g.fillStyle = "rgba(220,230,240,0.2)"; g.beginPath(); g.moveTo(wx + 6, wy + wh - 4); g.lineTo(wx + 28, wy + 4); g.lineTo(wx + 40, wy + 4); g.lineTo(wx + 18, wy + wh - 4); g.fill();
      // lace curtain hint
      g.fillStyle = "rgba(240,236,226,0.55)"; g.beginPath(); g.moveTo(wx, wy + 2); g.quadraticCurveTo(wx + 14, wy + 30, wx + 4, wy + wh); g.lineTo(wx, wy + wh); g.fill(); g.beginPath(); g.moveTo(wx + ww, wy + 2); g.quadraticCurveTo(wx + ww - 14, wy + 30, wx + ww - 4, wy + wh); g.lineTo(wx + ww, wy + wh); g.fill();
      g.fillStyle = rgba("#EFE8DA"); g.fillRect(cx - 2.2, wy, 4.4, wh); g.fillRect(wx, wy + wh * 0.38, ww, 4);
      g.fillStyle = rgba("#7A5638"); g.fillRect(wx - 10, wy + wh + 2, ww + 20, 6);
      g.fillStyle = rgba("#9A5A3A"); g.fillRect(wx - 4, wy + wh + 8, ww + 8, 10);
      for (let k = 0; k < 26; k++) dab(g, wx + rr(0, ww), wy + wh + rr(-5, 6), rr(0, 3), rr(5, 9), rr(3, 6), jit("#4D6B34", 8), 0.9);
      for (let k = 0; k < 20; k++) { g.fillStyle = rgba(jit(pick(["#C8302C", "#D9483A", "#B52A35"]), 8)); g.beginPath(); g.arc(wx + rr(3, ww - 3), wy + wh + rr(-9, 0), rr(2.4, 4), 0, 7); g.fill(); }
    }
    // door frame + dark doorway (interior), carved lintel
    const [dx0, dy0, dx1, dy1] = H.door;
    g.fillStyle = rgba("#EFE8DA"); g.fillRect(dx0 - 9, dy0 - 9, dx1 - dx0 + 18, dy1 - dy0 + 9);
    const dg = g.createLinearGradient(0, dy0, 0, dy1); dg.addColorStop(0, "#2A211C"); dg.addColorStop(0.7, "#3B2A1E"); dg.addColorStop(1, "#7A5A30");
    g.fillStyle = dg; g.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
    { const lg = g.createRadialGradient((dx0 + dx1) / 2 + 20, dy0 + 120, 4, (dx0 + dx1) / 2 + 20, dy0 + 120, 120); lg.addColorStop(0, "rgba(255,200,120,0.32)"); lg.addColorStop(1, "rgba(255,200,120,0)"); g.fillStyle = lg; g.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
      g.fillStyle = "rgba(30,22,18,0.55)"; g.fillRect(dx0, dy0, 14, dy1 - dy0); }
    g.fillStyle = rgba("#6A4A30"); g.fillRect(dx0 - 14, dy0 - 16, dx1 - dx0 + 28, 8);
    for (let x = dx0 - 10; x < dx1 + 12; x += 9) { g.fillStyle = rgba("#4A3220", 0.9); g.beginPath(); g.arc(x, dy0 - 8, 3, 0, Math.PI); g.fill(); }
    // threshold step
    region(g, [[dx0 - 22, -2], [dx1 + 22, -2], [dx1 + 30, 12], [dx0 - 30, 12]], () => hex("#9C9488"), { density: 0.2, len: [6, 12], w: [2, 3], a: 0.6, jit: 8 });
    g.fillStyle = rgba("#5E584F", 0.5); g.fillRect(dx0 - 30, 11, dx1 - dx0 + 60, 2);
    // peppers + lantern beside the door
    for (let k = 0; k < 12; k++) { g.fillStyle = rgba(jit(k % 2 ? "#B8322A" : "#C9452E", 10)); g.beginPath(); g.ellipse(176 + Math.sin(k) * 2, -214 + k * 6.4, 3.4, 5.8, 0.2, 0, 7); g.fill(); }
    g.strokeStyle = rgba("#6B5A3A"); g.lineWidth = 1.2; g.beginPath(); g.moveTo(176, -226); g.lineTo(176, -214); g.stroke();
    // small side window right of the door
    { const wx = 196, wy = -196, ww = 46, wh = 56; g.fillStyle = rgba("#EFE8DA"); g.fillRect(wx - 4, wy - 4, ww + 8, wh + 8); const gg = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gg.addColorStop(0, "#617891"); gg.addColorStop(1, "#283548"); g.fillStyle = gg; g.fillRect(wx, wy, ww, wh); g.fillStyle = rgba("#EFE8DA"); g.fillRect(wx + ww / 2 - 2, wy, 4, wh); g.fillRect(wx, wy + wh / 2 - 2, ww, 4); g.fillStyle = rgba("#5B7EA6"); g.fillRect(wx - 8, wy - 12, ww + 16, 7); }
    // roof: hip, clay tiles
    const ex0 = -308, ex1 = 308, rx0 = -132, rx1 = 132, eaveY = H.eave + 2, ridgeY = H.ridge;
    const roof = [[ex0, eaveY], [rx0, ridgeY], [rx1, ridgeY], [ex1, eaveY]];
    const cols = ["#B5552F", "#A84A2A", "#C3683C", "#9C4426", "#B9603A", "#A35233"];
    g.save(); polyPath(g, roof); g.fillStyle = rgba("#8C3C22"); g.fill(); g.clip();
    let y = eaveY + 3;
    while (y > ridgeY) { const t = (eaveY - y) / (eaveY - ridgeY), h = lerp(17, 12, t); tileRow(g, lerp(ex0, rx0, t), lerp(ex1, rx1, t), y, h, lerp(19, 16, t), cols, "#5A2414"); y -= h * 0.82; }
    const rl = g.createLinearGradient(ex0, 0, ex1, 0); rl.addColorStop(0, "rgba(255,200,140,0.22)"); rl.addColorStop(0.55, "rgba(255,200,140,0)"); rl.addColorStop(1, "rgba(60,40,70,0.22)");
    g.fillStyle = rl; g.fillRect(ex0, ridgeY, ex1 - ex0, eaveY - ridgeY); g.restore();
    g.strokeStyle = rgba("#6A2D1A"); g.lineWidth = 7; g.beginPath(); g.moveTo(rx0 - 3, ridgeY + 2); g.lineTo(rx1 + 3, ridgeY + 2); g.stroke();
    g.strokeStyle = rgba("#D08356", 0.8); g.lineWidth = 2.4; g.beginPath(); g.moveTo(rx0, ridgeY - 1); g.lineTo(rx1, ridgeY - 1); g.stroke();
    g.strokeStyle = rgba("#5A2716", 0.9); g.lineWidth = 3.6; g.beginPath(); g.moveTo(ex1, eaveY); g.lineTo(rx1, ridgeY); g.moveTo(ex0, eaveY); g.lineTo(rx0, ridgeY); g.stroke();
    g.fillStyle = rgba("#3E2A1E"); g.fillRect(ex0, eaveY - 2, ex1 - ex0, 6);
    for (let x = ex0 + 6; x < ex1; x += 13) { g.fillStyle = rgba("#3E2A1E", 0.9); g.beginPath(); g.arc(x, eaveY + 4, 4, 0, Math.PI); g.fill(); }
    // chimney
    const chx = 120;
    region(g, [[chx, -540], [chx + 30, -540], [chx + 30, -458], [chx, -458]], (x, y) => mix("#F6E8CC", "#D9CBB6", (x - chx) / 30), { density: 0.5, len: [5, 10], w: [2, 4], a: 0.6, ang: 1.57, jit: 6 });
    region(g, [[chx + 30, -540], [chx + 42, -536], [chx + 42, -462], [chx + 30, -458]], () => hex("#B8B2C0"), { density: 0.5, len: [5, 10], w: [2, 4], a: 0.6, ang: 1.57, jit: 5 });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { g.fillStyle = rgba(jit(r % 2 ? "#A4553A" : "#94472F", 10)); g.fillRect(chx - 2 + k * 7.6 + (r % 2) * 3.8, -553 + r * 4.6, 6.6, 4); }
    g.fillStyle = rgba("#4A4248"); g.fillRect(chx - 7, -560, 56, 5.5);
    done("house", sp, "rough-m", { door: H.door });
    // door leaf (planks), drawn separately so it can swing
    seed(53); const ds = sprite([dx0, dy0, dx1, dy1], 1.5, 2); const d = ds.g;
    region(d, [[dx0, dy0], [dx1, dy0], [dx1, dy1], [dx0, dy1]], (x) => mix("#7A5536", "#5B3D27", (x - dx0) / 105), { density: 0.12, len: [14, 30], w: [2, 4], a: 0.6, ang: 1.57, angJ: 0.05, jit: 8 });
    for (let x = dx0 + 15; x < dx1; x += 15) { d.strokeStyle = rgba("#3A2618", 0.7); d.lineWidth = 1.5; d.beginPath(); d.moveTo(x, dy0); d.lineTo(x, dy1); d.stroke(); }
    for (const yy of [dy0 + 34, dy1 - 40]) { d.fillStyle = rgba("#2B2420", 0.85); d.fillRect(dx0 + 2, yy, 62, 6); }
    d.fillStyle = rgba("#C9A86A"); d.beginPath(); d.arc(dx1 - 14, -110, 4, 0, 7); d.fill();
    d.strokeStyle = rgba("#2B2420", 0.6); d.lineWidth = 2; d.strokeRect(dx0 + 1, dy0 + 1, dx1 - dx0 - 2, dy1 - dy0 - 2);
    done("door", ds, "rough-s", {});
  }

  // ---------------- interior cut-outs (scene 3) ----------------
  function table() {
    seed(301); const sp = sprite([-95, -96, 95, 2], 2, 6); const g = sp.g;
    const top = R([[-92, -86], [92, -86], [94, -78], [-94, -78]], 0.6, 0.1);
    paint(g, top, ["#A87C52", "#8B6240", "#5E3F28"], { density: 0.25, len: [10, 24], w: [1.5, 3], ang: 0, angJ: 0.05, jit: 8 });
    const apron = R([[-84, -78], [84, -78], [84, -66], [-84, -66]], 0.5, 0.1, 5);
    paint(g, apron, ["#94693F", "#7A5536", "#523822"], { density: 0.25, len: [10, 20], w: [1.5, 3], angJ: 0.05 });
    // embroidered runner over the top edge
    const cl = R([[-60, -88], [60, -88], [60, -56], [-60, -56]], 0.5, 0.15, 3);
    paint(g, cl, ["#F6F1E6", "#EDE5D4", "#CFC2A8"], { density: 0.2, len: [6, 12], w: [1.5, 3] });
    for (let x = -54; x <= 54; x += 9) { g.fillStyle = rgba(Math.round(x / 9) % 2 ? "#B33A2E" : "#22262E", 0.9); g.beginPath(); g.moveTo(x, -70); g.lineTo(x + 3.6, -66); g.lineTo(x, -62); g.lineTo(x - 3.6, -66); g.fill(); }
    g.strokeStyle = rgba("#B33A2E", 0.8); g.lineWidth = 1.2; g.beginPath(); g.moveTo(-58, -76); g.lineTo(58, -76); g.stroke();
    for (const lx of [-78, 66]) { const leg = R([[lx, -66], [lx + 12, -66], [lx + 11, 0], [lx + 1, 0]], 0.4, 0.15, lx); paint(g, leg, ["#8F6542", "#73503A", "#4A3221"], { density: 0.3, len: [8, 16], w: [1.5, 3], ang: 1.57, angJ: 0.05 }); }
    done("table", sp, "rough-s", { cut: 1 }); cutRim("table", 4.5);
  }
  function chair() {
    seed(311); const sp = sprite([-30, -112, 30, 2], 2, 6); const g = sp.g;
    const back = R([[-26, -110], [-16, -110], [-16, -52], [-26, -52]], 0.4, 0.15);
    paint(g, back, ["#8F6542", "#73503A", "#4A3221"], { density: 0.3, len: [8, 16], w: [1.5, 3], ang: 1.57, angJ: 0.05 });
    for (const yy of [-102, -86, -70]) { g.fillStyle = rgba("#6A4A30"); g.fillRect(-28, yy, 12, 5); }
    const seat = R([[-28, -54], [28, -54], [28, -46], [-28, -46]], 0.4, 0.15, 2);
    paint(g, seat, ["#A87C52", "#8B6240", "#5E3F28"], { density: 0.3, len: [10, 18], w: [1.5, 3], ang: 0, angJ: 0.05 });
    for (const lx of [-26, 18]) { const leg = R([[lx, -46], [lx + 8, -46], [lx + 8, 0], [lx, 0]], 0.3, 0.15, lx); paint(g, leg, ["#8F6542", "#73503A", "#4A3221"], { density: 0.35, len: [8, 14], w: [1.5, 3], ang: 1.57, angJ: 0.05 }); }
    done("chair", sp, "rough-s", { cut: 1 }); cutRim("chair", 4.5);
  }
  function lamp() {
    seed(321); const sp = sprite([-46, -10, 46, 150], 2, 6); const g = sp.g;
    g.strokeStyle = rgba("#3A2E26"); g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, -10); g.lineTo(0, 96); g.stroke();
    const glow = g.createRadialGradient(0, 128, 2, 0, 128, 44); glow.addColorStop(0, "rgba(255,214,140,0.85)"); glow.addColorStop(1, "rgba(255,214,140,0)");
    g.fillStyle = glow; g.beginPath(); g.arc(0, 128, 44, 0, 7); g.fill();
    const shade = R(spline([[-8, 96], [8, 96], [20, 108], [40, 128], [-40, 128], [-20, 108]], 4), 0.5, 0.1);
    paint(g, shade, ["#5E8A72", "#3F6B55", "#28473A"], { density: 0.4, len: [6, 14], w: [1.5, 3], ang: 0.4, angJ: 0.4 });
    g.fillStyle = rgba("#FFE2A6"); g.beginPath(); g.ellipse(0, 128, 39, 5, 0, 0, 7); g.fill();
    g.fillStyle = rgba("#FFF4D6"); g.beginPath(); g.arc(0, 131, 6, 0, 7); g.fill();
    done("lamp", sp, "rough-s", { cut: 1 }, 0.2); cutRim("lamp", 4);
  }
  function jug() {
    seed(331); const sp = sprite([-22, -50, 26, 2], 3, 5); const g = sp.g;
    const body = R(spline([[-6, -46], [6, -46], [7, -40], [14, -26], [16, -12], [12, -2], [0, 0], [-12, -2], [-16, -12], [-14, -26], [-7, -40]], 6), 0.3, 0.2);
    const handle = limb([12, -38], [20, -22], 4, 4);
    g.strokeStyle = rgba("#D9CDB6"); g.lineWidth = 3.4; g.beginPath(); g.moveTo(8, -38); g.quadraticCurveTo(24, -36, 14, -16); g.stroke();
    paint(g, body, ["#F4EEE2", "#E4DCCB", "#B9AE98"], { density: 0.6, len: [4, 8], w: [1, 2], angJ: 0.6, k: 1.2 });
    // folk pattern: blue band and red flowers
    g.save(); polyPath(g, body); g.clip();
    g.strokeStyle = rgba("#2D4E86", 0.85); g.lineWidth = 2.2; g.beginPath(); g.moveTo(-16, -24); g.quadraticCurveTo(0, -21, 16, -24); g.stroke();
    g.lineWidth = 1; g.beginPath(); g.moveTo(-16, -8); g.quadraticCurveTo(0, -5, 16, -8); g.stroke();
    for (const fx of [-8, 0, 8]) { g.fillStyle = rgba("#B83A2E", 0.9); for (let k = 0; k < 5; k++) { const a = k * 1.256; g.beginPath(); g.ellipse(fx + Math.cos(a) * 2, -15 + Math.sin(a) * 2, 1.6, 1, a, 0, 7); g.fill(); } g.fillStyle = rgba("#E7B53A"); g.beginPath(); g.arc(fx, -15, 0.9, 0, 7); g.fill(); }
    g.restore();
    edge(g, body, "#8E836D", 0.5, 0.6);
    done("jug", sp, "rough-s", { cut: 1 }); cutRim("jug", 2.2);
  }
  function cup() {
    seed(341); const sp = sprite([-12, -18, 15, 2], 3, 5); const g = sp.g;
    g.strokeStyle = rgba("#2D4E86"); g.lineWidth = 2.2; g.beginPath(); g.arc(9.5, -9, 4, -1.4, 1.4); g.stroke();
    const b = R([[-9, -16], [9, -16], [8, -1], [-8, -1]], 0.25, 0.2);
    paint(g, b, ["#5E83BC", "#3E62A0", "#27426E"], { density: 0.8, len: [3, 6], w: [1, 2] });
    g.fillStyle = "rgba(255,255,255,0.8)"; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(-6 + k * 3, -9, 0.9, 0, 7); g.fill(); }
    done("cup", sp, "rough-s", { cut: 1 }); cutRim("cup", 2.2);
  }
  function bread() {
    seed(351); const sp = sprite([-24, -18, 24, 3], 3, 5); const g = sp.g;
    const plate = R(ellipsePts(0, -1, 23, 3.4, 30), 0.2, 0.2);
    paint(g, plate, ["#F3EDE0", "#E2D8C4", "#B4A88E"], { density: 0.6, len: [4, 8], w: [1, 2] });
    const loaf = R(spline([[-16, -3], [-15, -10], [-8, -16], [4, -17], [14, -12], [17, -4]], 6), 0.3, 0.2);
    paint(g, loaf, ["#D9A15A", "#B87A3A", "#7E4F24"], { density: 0.8, len: [3, 7], w: [1, 2.2], k: 1.2 });
    for (const x of [-7, 0, 7]) { g.strokeStyle = rgba("#F0D29A", 0.8); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 2, -13); g.lineTo(x + 2, -8); g.stroke(); }
    done("bread", sp, "rough-s", { cut: 1 }); cutRim("bread", 2.2);
  }
  function windowIn() {
    seed(361); const sp = sprite([-72, -98, 72, 8], 2, 6); const g = sp.g;
    const fr = R([[-68, -94], [68, -94], [68, 4], [-68, 4]], 0.5, 0.1);
    paint(g, fr, ["#F2ECE0", "#E4DBC8", "#B9AD95"], { density: 0.2, len: [8, 16], w: [2, 3], ang: 1.57, angJ: 0.1 });
    // view: sky, hills and a far spruce line (Carpathian)
    g.save(); g.beginPath(); g.rect(-58, -84, 116, 76); g.clip();
    const sky = g.createLinearGradient(0, -84, 0, -8); sky.addColorStop(0, "#9DB4CB"); sky.addColorStop(0.7, "#E9D9BD"); sky.addColorStop(1, "#F1CC98"); g.fillStyle = sky; g.fillRect(-60, -86, 120, 80);
    const hill1 = [[-60, -40]]; for (let x = -60; x <= 60; x += 4) hill1.push([x, -44 - 14 * Math.sin(x * 0.03 + 1) - 6 * fbm(x * 0.05, 1)]); hill1.push([60, 0], [-60, 0]);
    region(g, hill1, () => hex("#8C9CB3"), { density: 0.2, len: [5, 10], w: [2, 3], a: 0.5 });
    const hill2 = []; for (let x = -60; x <= 60; x += 4) hill2.push([x, -26 - 8 * Math.sin(x * 0.05 - 0.4) - 4 * fbm(x * 0.07, 3)]); hill2.push([60, 0], [-60, 0]);
    region(g, hill2, (x, y) => mix("#7D9460", "#5E7444", (y + 34) / 30), { density: 0.25, len: [5, 10], w: [2, 3], a: 0.6 });
    for (let i = 0; i < 16; i++) { const x = rr(-58, 58), y = -30 - 8 * Math.sin(x * 0.05 - 0.4); g.fillStyle = rgba(jit("#3F5A3E", 8)); g.beginPath(); g.moveTo(x, y - rr(8, 14)); g.lineTo(x + 3.2, y + 1); g.lineTo(x - 3.2, y + 1); g.fill(); }
    g.restore();
    g.fillStyle = rgba("#E4DBC8"); g.fillRect(-2.5, -84, 5, 76); g.fillRect(-58, -48, 116, 4.5);
    g.strokeStyle = rgba("#9C907A", 0.6); g.lineWidth = 1; g.strokeRect(-58, -84, 116, 76);
    // sill + geranium pot
    const sill = R([[-72, -8], [72, -8], [74, 2], [-74, 2]], 0.4, 0.1, 2);
    paint(g, sill, ["#9A7450", "#7E5A3E", "#5A3E28"], { density: 0.3, len: [10, 18], w: [1.5, 3], angJ: 0.05 });
    const pot = R([[30, -26], [50, -26], [47, -8], [33, -8]], 0.3, 0.2, 4);
    paint(g, pot, ["#C2734A", "#A65A36", "#743A22"], { density: 0.8, len: [3, 6], w: [1, 2] });
    for (let k = 0; k < 30; k++) dab(g, 40 + rr(-14, 14), -30 + rr(-10, 4), rr(0, 3), rr(4, 8), rr(3, 5), jit("#4D6B34", 8), 0.9);
    for (let k = 0; k < 16; k++) { g.fillStyle = rgba(jit(pick(["#C8302C", "#D9483A"]), 8)); g.beginPath(); g.arc(40 + rr(-12, 12), -38 + rr(-6, 4), rr(2, 3.2), 0, 7); g.fill(); }
    done("window", sp, "rough-s", { cut: 1 }); cutRim("window", 4.5);
  }
  function towel() { // rushnyk draped over a rod: thin swag and two long embroidered ends
    seed(371); const sp = sprite([-62, -14, 62, 124], 2, 6); const g = sp.g;
    g.strokeStyle = rgba("#6A4A30"); g.lineWidth = 3; g.beginPath(); g.moveTo(-60, -6); g.lineTo(60, -6); g.stroke();
    const sw = R(spline([[-52, -6], [0, -6], [52, -6], [48, 6], [0, 22], [-48, 6]], 6), 0.3, 0.15, 2);
    const endL = R([[-56, -6], [-38, -6], [-37, 116], [-57, 116]], 0.3, 0.15, 4), endR = R([[38, -6], [56, -6], [57, 116], [37, 116]], 0.3, 0.15, 5);
    for (const P of [endL, endR, sw]) paint(g, P, ["#FBF7EE", "#F0E8D8", "#CDBFA6"], { density: 0.4, len: [5, 10], w: [1.2, 2.4], ang: 1.57 });
    for (const x0 of [-56, 38]) { g.save(); polyPath(g, x0 < 0 ? endL : endR); g.clip();
      for (let y = 72; y < 112; y += 5) for (let k = 0; k < 4; k++) { const x = x0 + 3 + k * 4 + ((y / 5) % 2) * 2; g.fillStyle = rgba(((k + y / 5) % 3) ? "#B3302A" : "#1E1A18", 0.9); g.fillRect(x, y, 3, 3); }
      g.fillStyle = rgba("#B3302A", 0.9); g.fillRect(x0, 66, 20, 2); g.restore();
      for (let k = 0; k < 7; k++) { g.strokeStyle = rgba("#B3302A", 0.8); g.lineWidth = 0.8; g.beginPath(); g.moveTo(x0 + 2 + k * 2.8, 116); g.lineTo(x0 + 2 + k * 2.8, 122); g.stroke(); } }
    done("towel", sp, "rough-s", { cut: 1 }); cutRim("towel", 3.5);
  }
  function wallPanel() { // big backing sheet for the collage
    seed(381); const sp = sprite([-470, -270, 470, 250], 1, 8); const g = sp.g;
    const p = R([[-465, -265], [465, -262], [462, 245], [-462, 248]], 3, 0.03, 6, 3);
    paint(g, p, ["#F3E3C4", "#EAD5AF", "#CDB287"], { density: 0.03, len: [16, 34], w: [5, 10], ang: 1.57, angJ: 0.3, edgeA: 0.25, fn: (x, y) => mix("#F4E6CA", "#E6CFA5", clamp(0.3 + y / 600 + fbm(x * 0.006, y * 0.006) * 0.4, 0, 1)) });
    // stencilled blue band (Hutsul whitewash) near the top
    g.save(); polyPath(g, p); g.clip();
    for (let x = -460; x < 460; x += 26) { g.fillStyle = rgba("#4F6F9B", 0.55); g.beginPath(); g.moveTo(x, -196); g.lineTo(x + 8, -186); g.lineTo(x, -176); g.lineTo(x - 8, -186); g.fill(); g.beginPath(); g.arc(x + 13, -186, 2.4, 0, 7); g.fill(); }
    g.fillStyle = rgba("#4F6F9B", 0.4); g.fillRect(-470, -202, 940, 2); g.fillRect(-470, -171, 940, 2);
    g.restore();
    done("wall", sp, "rough-l", { cut: 1 }, 0.25);
    seed(391); const fs = sprite([-480, -40, 480, 40], 1, 8); const f = fs.g;
    const fl = R([[-478, -36], [478, -30], [476, 36], [-476, 36]], 3, 0.03, 9, 3);
    paint(f, fl, ["#B98E62", "#9C7148", "#6E4C30"], { density: 0.05, len: [30, 60], w: [3, 6], ang: 0, angJ: 0.03, edgeA: 0.3 });
    for (let y = -24; y < 36; y += 14) { f.strokeStyle = rgba("#5E3F28", 0.35); f.lineWidth = 1.4; f.beginPath(); f.moveTo(-476, y + rr(-1, 1)); f.lineTo(476, y + rr(-1, 1)); f.stroke(); }
    done("floor", fs, "rough-m", { cut: 1 }); cutRim("floor", 4);
  }
  function steth() {
    seed(401); const sp = sprite([-44, -50, 44, 46], 3, 6); const g = sp.g;
    // tubing: Y from ear tips to chest piece
    const tube = (pts, w, col) => { const L = spline(pts, 10, false); g.strokeStyle = rgba(col); g.lineWidth = w; g.lineCap = "round"; g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); return L; };
    tube([[-26, -44], [-30, -24], [-18, -4], [0, 4]], 3.6, "#3C3F46");
    tube([[26, -44], [30, -24], [18, -4], [0, 4]], 3.6, "#3C3F46");
    tube([[0, 4], [2, 18], [16, 26], [26, 30]], 4.6, "#2F3238");
    for (const L of [[[-26, -44], [-30, -24], [-18, -4], [0, 4]], [[26, -44], [30, -24], [18, -4], [0, 4]]]) { const P = spline(L, 10, false); g.strokeStyle = "rgba(255,255,255,0.28)"; g.lineWidth = 1; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p[0] - 0.8, p[1] - 0.6) : g.moveTo(p[0] - 0.8, p[1] - 0.6)); g.stroke(); }
    for (const sx of [-1, 1]) { g.fillStyle = rgba("#C9CDD3"); g.beginPath(); g.arc(sx * 26, -45, 3.4, 0, 7); g.fill(); g.fillStyle = rgba("#8A9098"); g.beginPath(); g.arc(sx * 26 + 0.8, -44.4, 1.6, 0, 7); g.fill(); }
    const cp = R(ellipsePts(30, 32, 10, 10, 30), 0.25, 0.2);
    paint(g, cp, ["#E6E9EE", "#B8BEC7", "#7C838E"], { density: 1, len: [3, 6], w: [1, 2], k: 1.4 });
    g.fillStyle = rgba("#5C6470"); g.beginPath(); g.arc(30, 32, 6.4, 0, 7); g.fill(); g.fillStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.arc(27.6, 29.6, 2.4, 0, 7); g.fill();
    done("steth", sp, "rough-s", {});
  }
  // tileable washes for the map
  function washTile(name, cols, sd) {
    seed(sd); const n = 512, c = U.canvas(n, n), g = c.getContext("2d");
    g.fillStyle = rgba(cols[1]); g.fillRect(0, 0, n, n);
    for (let i = 0; i < 2600; i++) { const x = rr(-20, n + 20), y = rr(-20, n + 20), t = 0.5 + 0.5 * fbm(x * 0.008, y * 0.008, 3); const col = jit(mix(cols[0], cols[2], t), 5);
      for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) dab(g, x + ox, y + oy, rr(-0.4, 0.4), rr(14, 34), rr(6, 12), col, 0.18); }
    granulate(g, 0.35, 1);
    OUT[name] = { c, meta: {} };
  }
  function ridge(name, sd, w, h) { // a little painted mountain for the map
    seed(sd); const sp = sprite([-w / 2 - 4, -h - 4, w / 2 + 4, 4], 3, 3); const g = sp.g;
    const pk = [[-w / 2, 0], [-w * 0.18, -h * 0.72], [0, -h], [w * 0.2, -h * 0.66], [w / 2, 0]];
    const P = R(spline(pk, 5, false).concat([[w / 2, 0]]), 0.4, 0.2, sd);
    paint(g, P, ["#B7AD9B", "#948A78", "#6C6456"], { density: 1.2, len: [2, 5], w: [0.8, 1.6], ang: 1.2, angJ: 0.5, edgeA: 0.5, edgeW: 0.5 });
    g.save(); polyPath(g, P); g.clip(); g.fillStyle = rgba("#6C6456", 0.45); g.beginPath(); g.moveTo(0, -h); g.lineTo(w * 0.2, -h * 0.66); g.lineTo(w / 2, 0); g.lineTo(w * 0.04, 0); g.fill();
    g.fillStyle = rgba("#F4F0E8", 0.85); g.beginPath(); g.moveTo(0, -h); g.lineTo(-w * 0.08, -h * 0.8); g.lineTo(0.02 * w, -h * 0.84); g.lineTo(w * 0.1, -h * 0.78); g.fill(); g.restore();
    done(name, sp, "rough-s", { mw: w, mh: h });
  }

  window.paintObjects = function () {
    paper(); house(); table(); chair(); lamp(); jug(); cup(); bread(); windowIn(); towel(); wallPanel(); steth();
    washTile("landTile", ["#F2E6CC", "#ECDDBE", "#DCC8A0"], 601); washTile("waterTile", ["#B9C9D3", "#A6BAC7", "#8EA6B6"], 602);
    ridge("mtn1", 611, 30, 20); ridge("mtn2", 612, 24, 15); ridge("mtn3", 613, 36, 24);
    return OUT;
  };
})();
