/* 2. Flat vector with grain (Kurzgesagt / Headspace): clean shapes, 2–3 tones per colour, shadow shapes, stippled grain gradients. */
window.STYLE = async function (root) {
  const { AW, AH, DPR, R, clamp, lerp, smooth, noise, fbm, hex, mix, rgba } = U;
  const { c, g } = U.artCanvas(root);
  const W = AW * DPR, H = AH * DPR;
  R.seed(202);

  const P = (pts) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; };
  const fill = (p, col) => { g.fillStyle = typeof col === "string" ? col : rgba(col); g.fill(p); };
  const rr = (x, y, w, h, r) => { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; };
  const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; };
  // stippled grain gradient: fn(u,v) in shape bbox -> probability; color stippled inside path
  const sh = U.canvas(W, H), shg = sh.getContext("2d");
  function grain(p, fn, col, tf = null, alpha = 1) {
    shg.setTransform(1, 0, 0, 1, 0, 0); shg.clearRect(0, 0, W, H);
    const m = tf || g.getTransform(); shg.setTransform(m); shg.fillStyle = "#fff"; shg.fill(p);
    shg.setTransform(1, 0, 0, 1, 0, 0);
    const im = shg.getImageData(0, 0, W, H), d = im.data; let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const cc = hex(col), bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0);
    for (let y = Math.max(0, y0 - 2); y < Math.min(H, y1 + 3); y++) for (let x = Math.max(0, x0 - 2); x < Math.min(W, x1 + 3); x++) {
      const k = (y * W + x) * 4, a = d[k + 3]; if (!a) continue;
      const pr = fn((x - x0) / bw, (y - y0) / bh, x / DPR, y / DPR);
      if (R.r() < pr) { d[k] = cc[0]; d[k + 1] = cc[1]; d[k + 2] = cc[2]; d[k + 3] = a * alpha; } else d[k + 3] = 0;
    }
    shg.putImageData(im, 0, 0);
    const t = g.getTransform(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(sh, 0, 0); g.setTransform(t);
  }
  const ramp = (t, a, b) => smooth(a, b, t);

  // ---------------- sky
  const sky = g.createLinearGradient(0, 0, 0, AH); sky.addColorStop(0, "#7fbcd0"); sky.addColorStop(0.55, "#b9dcd8"); sky.addColorStop(1, "#f3dfb3");
  g.fillStyle = sky; g.fillRect(0, 0, AW, AH);
  grain(P(U.rect(0, 120, AW, 330)), (u, v) => 0.85 * ramp(v, 0.05, 1), "#f6d7a4");
  grain(P(U.rect(0, 0, AW, 160)), (u, v) => 0.5 * (1 - ramp(v, 0, 1)), "#6aaec6");
  // sun with halo rings
  [[118, "#f8e6bc", 0.5], [86, "#fbeecb", 0.7], [58, "#fff6dc", 1]].forEach(([r, col, a]) => { g.globalAlpha = a; fill(circ(168, 122, r), col); g.globalAlpha = 1; });
  fill(circ(168, 122, 40), "#fffaf0");
  // clouds (pill stacks, light + underside)
  function cloud(x, y, s) {
    const top = new Path2D(); top.addPath(rr(x, y, 150 * s, 34 * s, 17 * s)); top.addPath(circ(x + 52 * s, y + 2 * s, 26 * s)); top.addPath(circ(x + 92 * s, y - 4 * s, 32 * s));
    fill(top, "#fbfaf4");
    g.save(); g.clip(top); fill(rr(x - 10, y + 20 * s, 180 * s, 30 * s, 0), "#dcebee"); g.restore();
    g.save(); g.clip(top); grain(top, (u, v) => 0.7 * ramp(v, 0.45, 0.85), "#c7dde3"); g.restore();
  }
  cloud(470, 92, 1.0); cloud(640, 150, 0.62); cloud(36, 200, 0.55);

  // ---------------- hills (3 bands, each with rim light)
  function hillBand(fy, col, rim, dark, sd) {
    const pts = []; for (let x = -10; x <= AW + 10; x += 4) pts.push([x, fy(x)]); pts.push([AW + 10, AH + 10], [-10, AH + 10]);
    const p = P(pts); fill(p, col);
    const rp = []; for (let x = -10; x <= AW + 10; x += 4) rp.push([x, fy(x)]); for (let x = AW + 10; x >= -10; x -= 4) rp.push([x, fy(x) + 5 + 2 * Math.sin(x * 0.05)]);
    g.save(); g.clip(p); fill(P(rp), rim); g.restore();
    grain(p, (u, v, x, y) => 0.55 * smooth(fy(x) + 10, fy(x) + 90, y), dark);
  }
  hillBand((x) => 292 - 34 * Math.sin(x * 0.009 + 0.6) - 14 * Math.sin(x * 0.023 + 2), "#8fbfae", "#b5d8c3", "#79a99b", 1);
  hillBand((x) => 324 - 26 * Math.sin(x * 0.012 + 2.4) - 8 * Math.sin(x * 0.03), "#5f9d86", "#86bb98", "#4b8673", 2);
  // little lollipop trees on the mid hill
  function lolly(x, y, r, a, b, trunk) { fill(rr(x - 1.6, y - r * 0.6, 3.2, r * 1.2, 1.5), trunk); const cp = circ(x, y - r * 1.2, r); fill(cp, a); g.save(); g.clip(cp); fill(P(U.rect(x, y - r * 3, x + r * 2, y + r)), b); g.restore(); }
  [[34, 318, 9], [58, 322, 7], [690, 300, 8], [712, 306, 10], [740, 312, 7]].forEach(([x, y, r]) => lolly(x, y, r, "#6fae7d", "#4f8f67", "#3d6b57"));
  // ground
  const gy = (x) => 384 - 6 * Math.sin(x * 0.01 + 1);
  hillBand(gy, "#79b464", "#a2cf7a", "#5f9a52", 3);

  // ---------------- house
  const S = 1.22, OX = (AW - 420 * S) / 2 + 6, OY = 385 - 226 * S;
  g.save(); g.translate(OX, OY); g.scale(S, S);
  const Hs = U.HOUSE, [wx0, wy0, wx1, wy1] = Hs.wall, rf = Hs.roof;
  // spruces behind on the right
  function spruce(x, y, h, w) {
    fill(rr(x - 2.5, y - 10, 5, 12, 1), "#3d5b4b");
    for (let i = 0; i < 3; i++) {
      const t = i / 3, yy = y - 8 - h * (1 - t) * 0.62 - h * 0.1, ww = w * (0.55 + 0.45 * t);
      const tri = P([[x, yy - h * 0.42], [x + ww, yy + h * 0.2], [x - ww, yy + h * 0.2]]);
      fill(tri, "#2f6b56"); g.save(); g.clip(tri); fill(P([[x, yy - h], [x - ww * 2, yy + h], [x - 2, yy + h]]), "#4b8d6c"); g.restore();
    }
  }
  spruce(418, 224, 150, 30); spruce(446, 228, 116, 24); spruce(-14, 226, 104, 22);
  // cast shadow on ground (to the right, light from upper-left)
  fill(P([[wx1, 226], [430, 222], [470, 236], [380, 244], [60, 236], [40, 226]]), "#5f9a52");
  // side wall slice
  const side = P([[wx1, 138], [398, 146], [398, 216], [wx1, 222]]);
  fill(side, "#d6cbd6");
  grain(side, (u, v) => 0.6 * v, "#bfb2c4");
  fill(P([[wx1, 208], [398, 205], [398, 216], [wx1, 222]]), "#3a5f8f");
  fill(P([[372, 160], [388, 163], [388, 186], [372, 184]]), "#3a5f8f");
  // front wall
  const front = P(U.rect(wx0, wy0, wx1, wy1));
  fill(front, "#fbf4e8");
  // porch recess (shadowed back wall)
  fill(P(U.rect(wx0, wy0, Hs.porch.x1, wy1)), "#eadccd");
  grain(P(U.rect(wx0, wy0, Hs.porch.x1, wy1)), (u, v) => 0.75 * (1 - ramp(v, 0, 0.6)), "#d9c7b8");
  // eave shadow band with grain falloff
  grain(P(U.rect(wx0, wy0, wx1, wy0 + 30)), (u, v) => 0.95 * (1 - ramp(v, 0.15, 1)), "#e3d6cf");
  fill(P(U.rect(wx0, wy0, wx1, wy0 + 6)), "#e3d6cf");
  // plinth
  fill(P(U.rect(wx0, Hs.plinth, wx1, wy1)), "#4a78b0"); fill(P(U.rect(wx0, Hs.plinth, wx1, Hs.plinth + 2.5)), "#6c98cf");
  grain(P(U.rect(wx0, Hs.plinth, wx1, wy1)), (u, v) => 0.5 * v, "#3a6397");
  // windows
  for (const [x, y, w, h] of Hs.wins) {
    const s = Hs.shutter;
    for (const sx of [x - s - 3, x + w + 3]) {
      fill(rr(sx, y - 1, s, h + 2, 1.5), "#4a78b0");
      fill(rr(sx + (sx < x ? 0 : s - 3), y - 1, 3, h + 2, 1.5), sx < x ? "#6c98cf" : "#3a6397");
      for (let k = 1; k < 7; k++) fill(rr(sx + 2, y - 1 + k * (h + 2) / 7 - 0.8, s - 4, 1.6, 0.8), "#3a6397");
    }
    fill(P([[x - 8, y - 4], [x + w / 2, y - 15], [x + w + 8, y - 4]]), "#4a78b0");
    fill(P([[x - 8, y - 4], [x + w / 2, y - 15], [x + w / 2, y - 12], [x - 4, y - 4]]), "#6c98cf");
    fill(circ(x + w / 2, y - 7.5, 2), "#fbf4e8");
    fill(rr(x - 3, y - 3, w + 6, h + 6, 2), "#ffffff");
    const gl = rr(x, y, w, h, 1); fill(gl, "#2c4a6e");
    g.save(); g.clip(gl); fill(P([[x + 6, y + h], [x + 20, y], [x + 28, y], [x + 14, y + h]]), "#40668f"); fill(P([[x + 24, y + h], [x + 34, y], [x + 37, y], [x + 27, y + h]]), "#40668f");
    grain(gl, (u, v) => 0.5 * v, "#1f3655"); g.restore();
    fill(P(U.rect(x + w / 2 - 1.5, y, x + w / 2 + 1.5, y + h)), "#ffffff"); fill(P(U.rect(x, y + h * 0.4 - 1.5, x + w, y + h * 0.4 + 1.5)), "#ffffff");
    // flower box
    fill(rr(x - 5, y + h + 2, w + 10, 8, 2), "#a5573a"); fill(rr(x - 5, y + h + 2, w + 10, 2.5, 1), "#c46e4b");
    for (let k = 0; k < 7; k++) fill(circ(x + 2 + k * (w - 4) / 6, y + h + 1, 3.6), k % 2 ? "#4f8f4f" : "#3f7b44");
    for (let k = 0; k < 6; k++) { fill(circ(x + 5 + k * (w - 10) / 5, y + h - 2 + (k % 2) * 2, 3.2), "#e2433a"); fill(circ(x + 4.2 + k * (w - 10) / 5, y + h - 2.8 + (k % 2) * 2, 1.3), "#f27a62"); }
  }
  // door
  const [dx0, dy0, dx1, dy1] = Hs.porch.door;
  fill(rr(dx0 - 3, dy0 - 3, dx1 - dx0 + 6, dy1 - dy0 + 3, 2), "#ffffff");
  fill(rr(dx0, dy0, dx1 - dx0, dy1 - dy0, 1), "#7c4b2f");
  fill(rr(dx0 + 4, dy0 + 5, dx1 - dx0 - 8, 24, 2), "#8f5d3c"); fill(rr(dx0 + 4, dy0 + 35, dx1 - dx0 - 8, 26, 2), "#8f5d3c");
  fill(rr(dx0, dy0, 4, dy1 - dy0, 1), "#9b6a46");
  grain(rr(dx0, dy0, dx1 - dx0, dy1 - dy0, 1), (u, v) => 0.7 * (1 - ramp(v, 0, 0.5)), "#5e3822");
  fill(circ(dx1 - 6, (dy0 + dy1) / 2 + 2, 2), "#f2c14e");
  // steps
  fill(rr(Hs.steps[0][0], Hs.steps[0][1], 50, 6, 1), "#b98157"); fill(rr(Hs.steps[1][0], Hs.steps[1][1], 62, 6, 1), "#a06c47");
  fill(rr(Hs.steps[0][0], Hs.steps[0][1], 50, 1.6, 0.8), "#d39b6e"); fill(rr(Hs.steps[1][0], Hs.steps[1][1], 62, 1.6, 0.8), "#c08a60");
  // porch railings
  for (const [a, b] of [[58, 76], [114, 132]]) { fill(rr(a, 186, b - a, 3, 1), "#8a5a3c"); for (let x = a + 2; x < b - 1; x += 4.2) fill(rr(x, 189, 2, 19, 0.8), "#a87350"); }
  // posts + brackets
  for (const px of Hs.porch.posts) {
    fill(rr(px - 4, 136, 8, 86, 1.5), "#8a5a3c"); fill(rr(px - 4, 136, 3, 86, 1.2), "#b07a52"); fill(rr(px + 2, 136, 2, 86, 1), "#6a4330");
    fill(rr(px - 5.5, 168, 11, 3.5, 1), "#6a4330"); fill(rr(px - 5.5, 212, 11, 5, 1), "#6a4330");
    g.strokeStyle = "#8a5a3c"; g.lineWidth = 3.5; g.beginPath(); const dir = px < 90 ? 1 : -1; g.arc(px + dir * 15, 136, 15, dir > 0 ? Math.PI * 0.5 : 0, dir > 0 ? Math.PI : Math.PI * 0.5); g.stroke();
  }
  // peppers on post
  for (let k = 0; k < 8; k++) fill(P([[47, 150 + k * 4.6], [52, 150 + k * 4.6], [49.5, 156 + k * 4.6]]), k % 2 ? "#d8382c" : "#b7261f");
  // ---- roof
  const roofF = P([[rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY]]);
  const roofS = P([[rf.ex1, rf.eaveY], [rf.rx1, rf.ridgeY], [418, rf.eaveY + 12]]);
  fill(roofS, "#a5432a");
  g.save(); g.clip(roofS); for (let i = 0; i < 9; i++) { const y = rf.eaveY + 12 - i * 12; g.strokeStyle = "#8c3622"; g.lineWidth = 2; g.beginPath(); g.moveTo(rf.rx1, y - 14); g.lineTo(430, y); g.stroke(); } g.restore();
  grain(roofS, (u, v) => 0.6 * u, "#822f1d");
  fill(roofF, "#dc6a3f");
  g.save(); g.clip(roofF);
  const rows = 8;
  for (let i = 0; i < rows; i++) {
    const t0 = i / rows, y = lerp(rf.eaveY, rf.ridgeY, t0), th = (rf.eaveY - rf.ridgeY) / rows;
    // scalloped tile edge: dark lip under each row, lighter tile face
    const tw = 13; const sc = new Path2D(); sc.moveTo(0, y - th); sc.lineTo(0, y);
    for (let x = 0; x < 420; x += tw) sc.quadraticCurveTo(x + tw / 2, y + 5.5, x + tw, y);
    sc.lineTo(420, y - th); sc.closePath();
    fill(sc, "#b9512f");
    const sc2 = new Path2D(); sc2.moveTo(0, y - th - 1); sc2.lineTo(0, y - 2.4);
    for (let x = 0; x < 420; x += tw) sc2.quadraticCurveTo(x + tw / 2, y + 2.6, x + tw, y - 2.4);
    sc2.lineTo(420, y - th - 1); sc2.closePath();
    fill(sc2, i % 2 ? "#e2734a" : "#de6d43");
    for (let x = (i % 2) * 6.5; x < 420; x += tw) fill(rr(x + 2, y - th + 1, 2.2, th - 5, 1), "#ef8c60");
  }
  // rim light on left hip, shade falloff on right with grain
  fill(P([[rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY], [rf.rx0 + 10, rf.ridgeY], [rf.ex0 + 14, rf.eaveY]]), "#f39a6b");
  g.restore();
  grain(roofF, (u, v) => 0.75 * smooth(0.45, 1.0, u), "#b04a2b");
  grain(roofF, (u, v) => 0.35 * (1 - smooth(0, 0.35, u)), "#f6a77b");
  // ridge + eave board
  fill(rr(rf.rx0 - 4, rf.ridgeY - 4, rf.rx1 - rf.rx0 + 8, 7, 3.5), "#9b3e26"); fill(rr(rf.rx0 - 2, rf.ridgeY - 4, rf.rx1 - rf.rx0 + 4, 2.5, 1.5), "#e98a5c");
  fill(rr(rf.ex0 - 4, rf.eaveY - 2, rf.ex1 - rf.ex0 + 8, 6, 2), "#5a3424");
  fill(P([[rf.ex1 + 4, rf.eaveY - 2], [420, rf.eaveY + 11], [420, rf.eaveY + 16], [rf.ex1 + 4, rf.eaveY + 4]]), "#45281c");
  for (let x = rf.ex0 + 2; x < rf.ex1; x += 8) { const p = new Path2D(); p.arc(x + 4, rf.eaveY + 4, 3, 0, Math.PI); fill(p, "#5a3424"); }
  // chimney
  const ch = Hs.chim;
  fill(P(U.rect(ch.x0, ch.top + 6, ch.x1, ch.base)), "#f7f0e6");
  fill(P(U.rect(ch.x1 - 7, ch.top + 6, ch.x1, ch.base)), "#ddd0d2");
  grain(P(U.rect(ch.x0, ch.top + 6, ch.x1, ch.base)), (u, v) => 0.55 * smooth(0.5, 1, v), "#cdbdbd");
  fill(P(U.rect(ch.x0, ch.top + 6, ch.x1, ch.top + 14)), "#b9553a"); fill(P(U.rect(ch.x0, ch.top + 9.5, ch.x1, ch.top + 10.5)), "#8f3d28");
  fill(rr(ch.x0 - 4, ch.top, ch.x1 - ch.x0 + 8, 6, 1.5), "#4f4447"); fill(rr(ch.x0 - 4, ch.top, ch.x1 - ch.x0 + 8, 2, 1), "#75696c");
  // smoke
  [[262, -10, 9], [274, -26, 12], [292, -40, 15]].forEach(([x, y, r], i) => { const p = circ(x, y, r); g.globalAlpha = 0.9 - i * 0.2; fill(p, "#f4f1f4"); g.save(); g.clip(p); fill(circ(x - r * 0.4, y - r * 0.4, r), "#ffffff"); g.restore(); g.globalAlpha = 1; });
  // bushes at foot
  function bush(x, y, r) { const p = new Path2D(); p.addPath(circ(x, y, r)); p.addPath(circ(x + r * 0.9, y + r * 0.2, r * 0.8)); p.addPath(circ(x - r * 0.9, y + r * 0.25, r * 0.75)); fill(p, "#4f9254"); g.save(); g.clip(p); fill(circ(x - r * 0.6, y - r * 0.6, r * 1.1), "#6fb167"); g.restore(); grain(p, (u, v) => 0.6 * v, "#3d7a46"); }
  bush(28, 220, 13); bush(164, 222, 9); bush(352, 222, 11); bush(-4, 226, 9);
  for (const [x, y, col] of [[22, 212, "#ffffff"], [32, 216, "#f2c14e"], [160, 216, "#e2433a"], [348, 214, "#ffffff"], [356, 218, "#e2433a"]]) fill(circ(x, y, 2.3), col);
  // sunflowers
  for (const [x, h] of [[452, 70], [474, 54]]) { fill(rr(x - 1.5, 226 - h, 3, h, 1.5), "#3f7b44"); fill(P([[x, 226 - h * 0.5], [x + 14, 226 - h * 0.62], [x + 2, 226 - h * 0.42]]), "#4f9254"); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.save(); g.translate(x, 226 - h); g.rotate(a); fill(rr(4, -2.4, 9, 4.8, 2.4), k % 2 ? "#f6be3d" : "#f2a92e"); g.restore(); } fill(circ(x, 226 - h, 5.5), "#6b3f23"); fill(circ(x - 1.5, 224 - h, 2.2), "#8a5634"); }
  g.restore();

  // foreground grass tufts
  for (let i = 0; i < 26; i++) { const x = R.rr(0, AW), y = R.rr(410, 470); const p = P([[x - 5, y], [x - 2, y - R.rr(8, 14)], [x, y - 3], [x + 2, y - R.rr(9, 15)], [x + 5, y]]); fill(p, R.r() < 0.5 ? "#6aa75c" : "#8cc06c"); }

  // ---- global fine grain (luminance noise)
  g.setTransform(1, 0, 0, 1, 0, 0);
  const im = g.getImageData(0, 0, W, H), d = im.data, rn = U.mulberry32(9);
  for (let i = 0; i < d.length; i += 4) { const n = (rn() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(im, 0, 0);
};
