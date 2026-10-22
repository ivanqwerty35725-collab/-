/* 7. Cut-paper collage: scissor-cut and torn coloured papers with fibre texture, white torn cores, layered drop shadows. */
window.STYLE = async function (root) {
  const { AW, AH, DPR, R, clamp, lerp, smooth, noise, fbm, hex, mix, rgba, mulberry32 } = U;
  const W = AW * DPR, H = AH * DPR;
  const { c, g } = U.artCanvas(root);
  R.seed(707);

  // ---- paper texture tile (grey ~128 for overlay): mottling + fibres
  const TS = 640, tile = U.canvas(TS, TS); {
    const tg = tile.getContext("2d"), im = tg.createImageData(TS, TS), d = im.data, r = mulberry32(17);
    for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) { const k = (y * TS + x) * 4; const v = 128 + 16 * fbm(x * 0.02, y * 0.02, 3) + 9 * (r() - 0.5) + 6 * noise(x * 0.3, y * 0.3); d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = 255; }
    tg.putImageData(im, 0, 0);
    for (let i = 0; i < 900; i++) { const x = r() * TS, y = r() * TS, a = r() * Math.PI * 2, L = 6 + r() * 22; tg.strokeStyle = r() < 0.7 ? `rgba(255,255,255,${0.18 + r() * 0.28})` : `rgba(0,0,0,${0.12 + r() * 0.15})`; tg.lineWidth = 0.6 + r() * 0.9; tg.beginPath(); tg.moveTo(x, y); tg.quadraticCurveTo(x + Math.cos(a + 0.5) * L * 0.5, y + Math.sin(a + 0.5) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); tg.stroke(); }
  }
  const pat = g.createPattern(tile, "repeat");
  function texture(path, k = 0.55) {
    g.save(); g.clip(path); g.globalCompositeOperation = "overlay"; g.globalAlpha = k;
    const t = g.getTransform(); g.setTransform(1, 0, 0, 1, 0, 0); const ox = R.rr(0, TS), oy = R.rr(0, TS);
    pat.setTransform(new DOMMatrix([1, 0, 0, 1, ox, oy])); g.fillStyle = pat; g.fillRect(0, 0, W, H); g.setTransform(t); g.restore();
  }
  const orient = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.sign(a) || 1; };
  // scissor cut: straight facets with small angle changes
  function cutPts(pts, j = 0.7) { return U.resample(pts, 9, true).map((p) => [p[0] + R.rr(-j, j), p[1] + R.rr(-j, j)]); }
  // torn edge: fibrous high-frequency displacement; outward offset for the white core
  function tornPts(pts, amp = 1.6, out = 0, sd = R.rr(0, 99)) {
    const rs = U.resample(pts, 1.4, true), n = rs.length, o = orient(pts), res = [];
    for (let i = 0; i < n; i++) {
      const p = rs[i], a = rs[(i - 1 + n) % n], b = rs[(i + 1) % n]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const nx = ty * o, ny = -tx * o; // outward
      const dsp = amp * (0.9 * fbm(p[0] * 0.05 + sd, p[1] * 0.05, 3) + 0.5 * noise(p[0] * 0.5 + sd, p[1] * 0.5)) + out * (0.7 + 0.6 * Math.abs(noise(p[0] * 0.15 + sd, p[1] * 0.15 + 3)));
      res.push([p[0] + nx * dsp, p[1] + ny * dsp]);
    }
    return res;
  }
  const P2 = (pts) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; };
  // place a piece of paper
  function piece(pts, col, o = {}) {
    const torn = o.torn, sh = o.shadow ?? 1;
    const base = torn ? tornPts(pts, o.amp ?? 1.6, 0) : cutPts(pts, o.j ?? 0.6);
    const path = P2(base);
    g.save();
    g.shadowColor = `rgba(45,30,20,${0.32 * sh})`; g.shadowBlur = (o.blur ?? 5) * DPR; g.shadowOffsetX = (o.sx ?? 1.6) * DPR; g.shadowOffsetY = (o.sy ?? 2.6) * DPR;
    if (torn) { const core = P2(tornPts(pts, (o.amp ?? 1.6) * 1.2, o.core ?? 1.8)); g.fillStyle = rgba(mix(col, "#fbf8f0", 0.82)); g.fill(core); g.shadowColor = "transparent"; }
    g.fillStyle = typeof col === "string" ? col : rgba(col); g.fill(path);
    g.restore();
    texture(path, o.tex ?? 0.6);
    if (torn) { const core = P2(tornPts(pts, (o.amp ?? 1.6) * 1.2, o.core ?? 1.8)); g.save(); g.clip(core); g.restore(); }
    return path;
  }
  const circle = (x, y, r, n = 40) => { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; p.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } return p; };
  const rect = U.rect;

  // ================= background board
  g.fillStyle = "#bcd6dc"; g.fillRect(0, 0, AW, AH); texture(P2(rect(0, 0, AW, AH)), 0.7);
  // sun (torn yellow) + rays of thin cut strips
  piece(circle(146, 104, 44, 60), "#f3c04a", { torn: 1, amp: 2, core: 2.2 });
  piece(circle(146, 104, 30, 50), "#f7d773", { torn: 1, amp: 1.4, core: 1.6, shadow: 0.6 });
  // clouds: white scissor-cut scallops
  function cloud(x, y, s) { const p = []; const bumps = [[0, 0, 16], [22, -12, 20], [48, -16, 24], [74, -6, 18], [92, 0, 14]]; for (let i = 0; i <= 60; i++) { const t = i / 60, a = Math.PI + t * Math.PI; let best = null; for (const b of bumps) { const px = x + (b[0] + Math.cos(a) * b[2]) * s, py = y + (b[1] + Math.sin(a) * b[2]) * s; } } const pts = []; for (const b of bumps) for (let k = 0; k <= 10; k++) { const a = Math.PI + (k / 10) * Math.PI; pts.push([x + (b[0] + Math.cos(a) * b[2]) * s, y + (b[1] + Math.sin(a) * b[2]) * s]); } pts.push([x + 106 * s, y + 6 * s], [x - 16 * s, y + 6 * s]); piece(pts, "#fbf8f1", { j: 0.4, tex: 0.5 }); }
  cloud(500, 76, 1); cloud(660, 150, 0.7); cloud(250, 170, 0.55);
  // mountains: torn papers, two layers
  const m1 = (x) => 268 - 92 * Math.max(0, 1 - Math.abs(x - 590) / 230) - 50 * Math.max(0, 1 - Math.abs(x - 300) / 170) - 8 * fbm(x * 0.02, 3, 2);
  { const pts = []; for (let x = -20; x <= AW + 20; x += 8) pts.push([x, m1(x)]); pts.push([AW + 20, 360], [-20, 360]); piece(pts, "#8f92ba", { torn: 1, amp: 2.4, core: 2 }); }
  // snow caps as torn white paper on the highest peak
  piece([[590, 177], [622, 204], [606, 200], [596, 212], [584, 202], [570, 210], [560, 204]], "#f4f2ee", { torn: 1, amp: 1.2, core: 0.8, shadow: 0.6 });
  const m2 = (x) => 300 - 46 * Math.max(0, 1 - Math.abs(x - 140) / 180) - 40 * Math.max(0, 1 - Math.abs(x - 760) / 160) - 18 * Math.sin(x * 0.012) - 6 * fbm(x * 0.03, 8, 2);
  { const pts = []; for (let x = -20; x <= AW + 20; x += 8) pts.push([x, m2(x)]); pts.push([AW + 20, 380], [-20, 380]); piece(pts, "#6f8bab", { torn: 1, amp: 2.2, core: 2 }); }
  // hill
  const hl = (x) => 336 - 14 * Math.sin(x * 0.01 + 1.2) - 5 * Math.sin(x * 0.04);
  { const pts = []; for (let x = -20; x <= AW + 20; x += 8) pts.push([x, hl(x)]); pts.push([AW + 20, AH + 20], [-20, AH + 20]); piece(pts, "#86b56c", { torn: 1, amp: 2, core: 2 }); }
  // distant cut spruces along the hill
  function spruce(x, y, h, w, col = "#2f6650", col2 = "#3f7c5e") {
    piece(rect(x - 2.5 * w / 20, y - 8, x + 2.5 * w / 20, y + 2), "#6a4a34", { shadow: 0.6, blur: 3 });
    for (let i = 0; i < 3; i++) { const t = i / 2, top = y - h + t * h * 0.34, bot = y - h * 0.5 + t * (h * 0.5 - 6), ww = w * (0.55 + 0.45 * t); piece([[x, top], [x + ww, bot], [x - ww, bot]], i % 2 ? col2 : col, { shadow: 0.8, blur: 4, j: 0.5 }); }
  }
  for (const [x, h] of [[30, 46], [56, 36], [722, 44], [748, 54], [776, 38]]) spruce(x, hl(x) + 18, h, h * 0.36, "#3b7458", "#4a875f");

  // ================= house
  const S = 1.22, OX = (AW - 420 * S) / 2 + 8, OY = 392 - 226 * S;
  g.save(); g.translate(OX, OY); g.scale(S, S);
  const Hs = U.HOUSE, [wx0, wy0, wx1, wy1] = Hs.wall, rf = Hs.roof, ch = Hs.chim;
  spruce(426, 226, 160, 34); spruce(456, 230, 118, 26, "#3b7458", "#4a875f");
  // side wall, front wall, plinth
  piece([[wx1 - 2, 138], [398, 146], [398, 217], [wx1 - 2, 223]], "#cfc6d8");
  piece(rect(wx0, wy0 - 2, wx1, wy1 + 1), "#f5efe3");
  piece(rect(wx0, wy0, Hs.porch.x1, wy1), "#e4d6c3", { shadow: 0.5, blur: 3, sx: 0.6, sy: 1 }); // porch recess paper
  piece(rect(wx0 - 1, Hs.plinth, wx1 + 1, wy1 + 1), "#3e6fa8", { shadow: 0.7, blur: 3 });
  piece([[wx1, Hs.plinth], [398, 205], [398, 217], [wx1, wy1 + 1]], "#2f5a8c", { shadow: 0.5, blur: 3 });
  piece([[372, 160], [388, 163], [388, 186], [372, 184]], "#2f4e7a", { shadow: 0.6, blur: 2 });
  // windows
  for (const [x, y, w, h] of Hs.wins) {
    for (const sx of [x - 16, x + w + 4]) { piece(rect(sx, y - 1, sx + 12, y + h + 1), "#4c7bb5", { blur: 3 }); for (let k = 1; k < 6; k++) piece(rect(sx + 1.5, y + k * h / 6 - 1, sx + 10.5, y + k * h / 6 + 0.6), "#36639a", { shadow: 0.4, blur: 1.5, sx: 0.4, sy: 0.8, j: 0.2 }); }
    piece(rect(x - 3, y - 3, x + w + 3, y + h + 3), "#fbf8f1", { blur: 3 });
    piece(rect(x, y, x + w, y + h), "#2b4670", { shadow: 0.5, blur: 2 });
    piece([[x + 5, y + h - 2], [x + 16, y + 2], [x + 22, y + 2], [x + 11, y + h - 2]], "#47699a", { shadow: 0, j: 0.3 });
    piece(rect(x + w / 2 - 1.6, y, x + w / 2 + 1.6, y + h), "#fbf8f1", { shadow: 0.6, blur: 2, sx: 0.6, sy: 1, j: 0.2 });
    piece(rect(x, y + h * 0.4 - 1.6, x + w, y + h * 0.4 + 1.6), "#fbf8f1", { shadow: 0.6, blur: 2, sx: 0.6, sy: 1, j: 0.2 });
    piece([[x - 9, y - 4], [x + w / 2, y - 17], [x + w + 9, y - 4]], "#4c7bb5", { blur: 3 });
    piece(rect(x - 6, y + h + 3, x + w + 6, y + h + 11), "#a86f45", { blur: 3 });
    for (let k = 0; k < 7; k++) piece(circle(x - 2 + k * (w + 4) / 6, y + h + 1, 4, 12), k % 2 ? "#4f8f4f" : "#3f7b44", { shadow: 0.6, blur: 2, j: 0.3 });
    for (let k = 0; k < 6; k++) piece(circle(x + 2 + k * (w - 4) / 5, y + h - 3 + (k % 2) * 2, 3.4, 12), "#d63a30", { shadow: 0.7, blur: 2, j: 0.3 });
  }
  // door + planks + steps
  const [dx0, dy0, dx1, dy1] = Hs.porch.door;
  piece(rect(dx0 - 3, dy0 - 3, dx1 + 3, dy1), "#fbf8f1", { blur: 3 });
  piece(rect(dx0, dy0, dx1, dy1), "#8a5a3a", { blur: 2 });
  for (let k = 0; k < 4; k++) piece(rect(dx0 + 1 + k * 8.4, dy0 + 2, dx0 + 7.6 + k * 8.4, dy1 - 2), k % 2 ? "#9a6a46" : "#7d4f31", { shadow: 0.35, blur: 1.5, sx: 0.4, sy: 0.6, j: 0.25 });
  piece(rect(dx0 + 2, dy0 + 14, dx1 - 2, dy0 + 18), "#6b4229", { shadow: 0.5, blur: 1.5, j: 0.2 }); piece(rect(dx0 + 2, dy1 - 18, dx1 - 2, dy1 - 14), "#6b4229", { shadow: 0.5, blur: 1.5, j: 0.2 });
  piece(circle(dx1 - 6, (dy0 + dy1) / 2 + 2, 2.2, 10), "#f2c14e", { shadow: 0.6, blur: 1 });
  piece(rect(68, 214, 122, 220), "#c08a5c", { blur: 3 }); piece(rect(62, 220, 128, 227), "#a87650", { blur: 3 });
  // railings, posts, brackets, peppers
  for (const [a, b] of [[58, 76], [114, 132]]) { for (let x = a + 2; x < b - 1; x += 4.4) piece(rect(x, 188, x + 2.2, 208), "#a87350", { shadow: 0.5, blur: 1.5, j: 0.2 }); piece(rect(a, 185, b, 189), "#8a5a3c", { shadow: 0.6, blur: 2, j: 0.2 }); }
  for (const px of Hs.porch.posts) {
    piece(rect(px - 4.5, 134, px + 4.5, 223), "#8a5a3c", { blur: 3 });
    piece(rect(px - 6, 166, px + 6, 171), "#6a4330", { shadow: 0.5, blur: 1.5 });
    const dir = px < 90 ? 1 : -1, arc = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * 0.5 + (i / 12) * Math.PI * 0.5; arc.push([px + dir * (16 + Math.cos(a) * 16), 134 + Math.sin(a) * 16]); } for (let i = 12; i >= 0; i--) { const a = Math.PI * 0.5 + (i / 12) * Math.PI * 0.5; arc.push([px + dir * (16 + Math.cos(a) * 12), 134 + Math.sin(a) * 12]); }
    piece(arc, "#8a5a3c", { shadow: 0.6, blur: 2, j: 0.2 });
  }
  for (let k = 0; k < 8; k++) piece([[46, 148 + k * 4.8], [52, 148 + k * 4.8], [49, 155 + k * 4.8]], k % 2 ? "#d63a30" : "#b82a22", { shadow: 0.6, blur: 1.5, j: 0.2 });
  // roof: dark base, hip side, then scalloped tile strips row by row from the eave up (each casts a shadow on the next)
  piece([[rf.ex1 - 4, rf.eaveY], [rf.rx1, rf.ridgeY], [420, rf.eaveY + 13]], "#8c3622", { blur: 4 });
  const roofBase = piece([[rf.ex0, rf.eaveY + 2], [rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY + 2]], "#9e3d25", { blur: 5 });
  g.save(); g.clip(roofBase);
  const rows = 7, tones = ["#d4613a", "#e07148", "#cc5a34", "#de6e44", "#d2603a", "#e3784d", "#d0643c"];
  for (let i = 0; i < rows; i++) {
    const yb = lerp(rf.eaveY + 4, rf.ridgeY + 8, i / rows), th = (rf.eaveY - rf.ridgeY) / rows + 9, tw = 16, off = (i % 2) * 8;
    const pts = [[-10, yb - th]]; for (let x = -10 + off - tw; x < 430; x += tw) for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI; pts.push([x + tw / 2 - Math.cos(a) * (tw / 2 - 0.6), yb + Math.sin(a) * 8 - 6]); }
    pts.push([430, yb - th]);
    piece(pts, tones[i], { blur: 3, sx: 0.6, sy: 2.4, j: 0.15, tex: 0.5 });
  }
  g.restore();
  // ridge strip + eave board with cut scallops
  piece(rect(rf.rx0 - 6, rf.ridgeY - 5, rf.rx1 + 6, rf.ridgeY + 2), "#8c3622", { blur: 3 });
  { const pts = [[rf.ex0 - 4, rf.eaveY - 1], [rf.ex1 + 4, rf.eaveY - 1]]; for (let x = rf.ex1 + 4; x > rf.ex0 - 4; x -= 8) for (let k = 0; k <= 4; k++) { const a = (k / 4) * Math.PI; pts.push([x - 4 + Math.cos(a) * 4, rf.eaveY + 4 + Math.sin(a) * 3.5]); } piece(pts, "#5a3424", { blur: 3 }); }
  // chimney
  piece(rect(ch.x0, ch.top + 5, ch.x1, ch.base - 8), "#f5efe3", { blur: 4 });
  piece(rect(ch.x1 - 7, ch.top + 5, ch.x1, ch.base - 8), "#d8ccd6", { shadow: 0.4, blur: 2 });
  piece(rect(ch.x0, ch.top + 6, ch.x1, ch.top + 13), "#b9553a", { shadow: 0.6, blur: 2 });
  piece(rect(ch.x0 - 4, ch.top, ch.x1 + 4, ch.top + 6), "#4f4447", { blur: 3 });
  // smoke: torn white tissue puffs
  for (const [x, y, r] of [[262, -10, 8], [276, -28, 11], [298, -48, 14]]) piece(circle(x, y, r, 30), "#f4f2f2", { torn: 1, amp: 1.6, core: 0.6, shadow: 0.5, tex: 0.4 });
  // bushes & flowers at the foot
  for (const [x, r] of [[14, 12], [30, 9], [160, 9], [176, 7], [344, 11], [362, 8]]) { piece(circle(x, 222 - r * 0.4, r, 18), "#4f8f4f", { j: 0.8 }); piece(circle(x - r * 0.3, 220 - r * 0.6, r * 0.6, 14), "#6aa85f", { shadow: 0.5, blur: 2, j: 0.5 }); }
  for (const [x, y, col] of [[10, 210, "#fbf8f1"], [22, 214, "#d63a30"], [34, 208, "#f2c14e"], [158, 214, "#d63a30"], [174, 210, "#fbf8f1"], [342, 208, "#d63a30"], [356, 214, "#fbf8f1"], [366, 210, "#f2c14e"]]) piece(circle(x, y, 3, 10), col, { shadow: 0.7, blur: 1.5, j: 0.2 });
  // sunflowers
  for (const [x, h] of [[478, 78], [500, 60]]) {
    piece(rect(x - 1.6, 226 - h, x + 1.6, 228), "#3f7b44", { blur: 2, j: 0.2 });
    piece([[x, 226 - h * 0.45], [x + 16, 226 - h * 0.62], [x + 2, 226 - h * 0.38]], "#4f8f4f", { blur: 2 });
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2, cx = x, cy = 226 - h; piece([[cx + Math.cos(a - 0.22) * 5, cy + Math.sin(a - 0.22) * 5], [cx + Math.cos(a) * 15, cy + Math.sin(a) * 15], [cx + Math.cos(a + 0.22) * 5, cy + Math.sin(a + 0.22) * 5]], k % 2 ? "#f3b733" : "#f7c948", { shadow: 0.5, blur: 1.5, j: 0.2 }); }
    piece(circle(x, 226 - h, 6, 14), "#6b3f23", { blur: 2, j: 0.3 });
  }
  g.restore();
  // path (torn kraft) + foreground torn grass strip
  piece([[OX + 66 * S, 392], [OX + 124 * S, 392], [OX + 190 * S, AH + 10], [OX + 0 * S, AH + 10]], "#d9b88c", { torn: 1, amp: 1.8, core: 1.6 });
  { const pts = []; for (let x = -20; x <= AW + 20; x += 8) pts.push([x, 446 + 8 * Math.sin(x * 0.015) + 4 * Math.sin(x * 0.05)]); pts.push([AW + 20, AH + 20], [-20, AH + 20]); piece(pts, "#5e9a55", { torn: 1, amp: 2.4, core: 2.2 }); }
  for (const [x, y] of [[80, 440], [130, 452], [640, 436], [700, 448], [740, 438]]) { piece([[x - 4, y + 8], [x - 1, y - 12], [x + 1, y + 8]], "#4a8a46", { shadow: 0.5, blur: 2, j: 0.2 }); piece([[x + 2, y + 8], [x + 8, y - 8], [x + 5, y + 8]], "#6aa85f", { shadow: 0.5, blur: 2, j: 0.2 }); piece(circle(x - 1, y - 14, 4, 12), "#d63a30", { shadow: 0.6, blur: 2, j: 0.3 }); }
};
