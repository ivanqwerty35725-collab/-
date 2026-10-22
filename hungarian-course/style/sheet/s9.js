/* 9. Hungarian folk embroidery (Matyó): flat stylised house in satin stitch, framed by Matyó roses, tulips,
   paprika drops, fishbone leaves and stem-stitch tendrils on linen. Red / blue / green on light. */
window.STYLE = async function (root) {
  const { AW, AH, DPR, R, clamp, lerp, smooth, noise, fbm, hex, mix, rgba, mulberry32 } = U;
  const W = AW * DPR, H = AH * DPR;
  R.seed(909);
  const { c, g } = U.artCanvas(root);
  // ---- linen
  { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); const im = g.createImageData(W, H), d = im.data, r = mulberry32(9);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; const sx = noise(x * 0.004, y * 0.4) * 0.6, sy = noise(x * 0.4, y * 0.004 + 9) * 0.6; const wv = 0.5 + 0.25 * Math.cos((x + sx * 4) * Math.PI / 2.2) + 0.25 * Math.cos((y + sy * 4) * Math.PI / 2.2); const v = 0.955 + 0.03 * wv + 0.018 * fbm(x * 0.01, y * 0.01, 2) + (r() - 0.5) * 0.02; d[k] = 246 * v; d[k + 1] = 239 * v; d[k + 2] = 224 * v; d[k + 3] = 255; }
    g.putImageData(im, 0, 0); g.restore(); }
  g.lineCap = "round";
  const RED = "#c42330", RED2 = "#a3172a", PINK = "#e46a86", BLUE = "#1f4f9e", BLUE2 = "#3b74c4", GREEN = "#2f8a46", GREEN2 = "#1f6b37", YEL = "#f0b323", WHITE = "#fffdf8", BLACK = "#22201f";
  // one stitch: thread with shadow + sheen
  function stitch(x0, y0, x1, y1, col, w = 1.25) {
    const cc = hex(col), L = Math.hypot(x1 - x0, y1 - y0); if (L < 0.4) return;
    const nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    g.strokeStyle = rgba(mix(cc, "#000", 0.45), cc[0] > 240 && cc[2] > 230 ? 0.16 : 0.35); g.lineWidth = w + 0.5; g.beginPath(); g.moveTo(x0 + 0.35, y0 + 0.5); g.lineTo(x1 + 0.35, y1 + 0.5); g.stroke();
    const j = R.rr(-8, 8); g.strokeStyle = rgba([clamp(cc[0] + j, 0, 255), clamp(cc[1] + j, 0, 255), clamp(cc[2] + j, 0, 255)]); g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    if (L > 2) { const s = 0.18; g.strokeStyle = rgba(mix(cc, "#fff", 0.45), 0.55); g.lineWidth = w * 0.32; g.beginPath(); g.moveTo(lerp(x0, x1, s) + nx * w * 0.18, lerp(y0, y1, s) + ny * w * 0.18); g.lineTo(lerp(x0, x1, 1 - s) + nx * w * 0.18, lerp(y0, y1, 1 - s) + ny * w * 0.18); g.stroke(); }
  }
  // satin fill: parallel stitches at angle, long stitches split brick-wise
  function satin(poly, col, ang = 0, sp = 1.15, w = 1.3, maxLen = 16) {
    const ca = Math.cos(ang), sa = Math.sin(ang), rp = poly.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
    const vs = rp.map((p) => p[1]); let k = 0;
    for (let v = Math.min(...vs) + sp / 2; v < Math.max(...vs); v += sp, k++) {
      const xs = []; for (let i = 0; i < rp.length; i++) { const p = rp[i], q = rp[(i + 1) % rp.length]; if ((p[1] > v) !== (q[1] > v)) xs.push(p[0] + (v - p[1]) / (q[1] - p[1]) * (q[0] - p[0])); }
      xs.sort((a, b) => a - b);
      for (let m = 0; m + 1 < xs.length; m += 2) {
        const u0 = xs[m] + 0.3, u1 = xs[m + 1] - 0.3, L = u1 - u0; if (L <= 0.3) continue;
        const n = Math.max(1, Math.ceil(L / maxLen)); const off = (k % 2) * 0.5;
        const cuts = [u0]; for (let t = 1; t < n; t++) cuts.push(u0 + L * (t - off * (t === 1 ? 0 : 0) + (k % 2 ? 0.5 : 0)) / n); cuts.push(u1);
        const cs = cuts.filter((u) => u >= u0 && u <= u1).sort((a, b) => a - b);
        for (let t = 0; t + 1 < cs.length; t++) { const a = cs[t], b = cs[t + 1]; if (b - a < 0.4) continue; stitch(a * ca - v * sa, a * sa + v * ca, b * ca - v * sa, b * sa + v * ca, col, w); }
      }
    }
  }
  // fishbone leaf / petal along base->tip, width profile
  function leaf(bx, by, tx, ty, wd, col, col2 = null, sp = 1.25) {
    const L = Math.hypot(tx - bx, ty - by), ux = (tx - bx) / L, uy = (ty - by) / L, nx = -uy, ny = ux;
    for (let s = 0; s < L; s += sp) {
      const t = s / L, hw = wd * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02 + 0.02)), 0.75) * (t < 0.15 ? t / 0.15 * 0.6 + 0.4 : 1);
      const px = bx + ux * s, py = by + uy * s, f = Math.min(L - s, hw * 0.6);
      for (const side of [-1, 1]) { const ex = px + ux * f + nx * hw * side, ey = py + uy * f + ny * hw * side; stitch(px + nx * side * 0.6, py + ny * side * 0.6, ex, ey, side < 0 || !col2 ? col : col2, 1.2); }
    }
  }
  // stem stitch along a polyline
  function stem(pts, col, w = 1.5, step = 3.2) {
    const rs = U.resample(pts, step / 2, false);
    for (let i = 0; i + 2 < rs.length; i += 1) { const a = rs[i], b = rs[i + 2]; const nx = -(b[1] - a[1]), ny = b[0] - a[0], l = Math.hypot(nx, ny) || 1; stitch(a[0] + nx / l * 0.5, a[1] + ny / l * 0.5, b[0] - nx / l * 0.5, b[1] - ny / l * 0.5, col, w); }
  }
  function knot(x, y, r, col) { const cc = hex(col); g.fillStyle = rgba(mix(cc, "#000", 0.5), 0.35); g.beginPath(); g.arc(x + 0.4, y + 0.6, r + 0.3, 0, 7); g.fill(); g.fillStyle = rgba(cc); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = rgba(mix(cc, "#000", 0.3), 0.6); g.lineWidth = 0.5; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x, y, r * 0.55, k * 2.1, k * 2.1 + 1.6); g.stroke(); } g.fillStyle = rgba(mix(cc, "#fff", 0.6), 0.7); g.beginPath(); g.arc(x - r * 0.3, y - r * 0.35, r * 0.3, 0, 7); g.fill(); }
  // radial satin ring with scalloped outer edge (Matyó rose)
  function ring(cx, cy, r0, r1, petals, col, gap = 0.05, sc = 0.18, rot = 0) {
    const step = 1.15 / r1;
    for (let a = 0; a < Math.PI * 2; a += step) {
      const ph = ((a - rot) / (Math.PI * 2)) * petals, f = ph - Math.floor(ph); if (f < gap || f > 1 - gap) continue;
      const rr = r1 * (1 - sc + sc * Math.sin(Math.PI * f));
      stitch(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, col, 1.3);
    }
  }
  function rose(cx, cy, r, scheme = 0) {
    const [c1, c2, c3] = scheme ? [BLUE, RED, YEL] : [RED, BLUE, YEL];
    ring(cx, cy, r * 0.62, r, 7, c1, 0.06, 0.22, 0.3);
    ring(cx, cy, r * 0.34, r * 0.6, 7, c2, 0.07, 0.25, 0.75);
    ring(cx, cy, r * 0.14, r * 0.32, 6, scheme ? RED2 : PINK, 0.08, 0.2, 0.1);
    satin(circle(cx, cy, r * 0.14, 16), c3, 0.8, 1.1, 1.2);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3; knot(cx + Math.cos(a) * r * 0.47, cy + Math.sin(a) * r * 0.47, 1.4, WHITE); }
  }
  function tulip(x, y, s, ang, col, col2) {
    const ca = Math.cos(ang), sa = Math.sin(ang), P = (u, v) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s];
    const [bx, by] = P(0, 0), [tx, ty] = P(0, -26); leaf(bx, by, tx, ty, 6 * s, col, null);
    const [lx, ly] = P(-14, -22), [rx, ry] = P(14, -22); leaf(bx, by, lx, ly, 6 * s, col2); leaf(bx, by, rx, ry, 6 * s, col2);
    const [kx, ky] = P(0, -4); knot(kx, ky, 1.6 * s, YEL);
  }
  function paprika(x, y, s, ang, col) { const ca = Math.cos(ang), sa = Math.sin(ang); const P = (u, v) => [x + (u * ca - v * sa) * s, y + (u * sa + v * ca) * s]; const p = []; for (let i = 0; i <= 20; i++) { const t = i / 20; const w = 5 * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - t * 0.3); p.push(P(w, t * 22)); } for (let i = 20; i >= 0; i--) { const t = i / 20; const w = 5 * Math.sin(Math.PI * Math.pow(t, 0.7)) * (1 - t * 0.3); p.push(P(-w, t * 22)); } satin(p, col, ang + 0.4, 1.1); const [ax, ay] = P(0, 0), [bx, by] = P(0, -4); stitch(ax, ay, bx, by, GREEN, 2); }
  const circle = (cx, cy, r, n = 30) => { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return p; };
  const curve = (fn, n = 40) => { const p = []; for (let i = 0; i <= n; i++) p.push(fn(i / n)); return p; };

  // ================= frame: running stitch double border
  function running(x0, y0, x1, y1, col, dash = 6, gap = 3.5) { const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L; for (let s = 0; s < L - 1; s += dash + gap) { const e = Math.min(L, s + dash); stitch(x0 + ux * s, y0 + uy * s, x0 + ux * e, y0 + uy * e, col, 1.5); } }
  const F1 = 14, F2 = 22;
  running(F1, F1, AW - F1, F1, RED); running(AW - F1, F1, AW - F1, AH - F1, RED); running(AW - F1, AH - F1, F1, AH - F1, RED); running(F1, AH - F1, F1, F1, RED);
  for (let x = F2 + 6; x < AW - F2; x += 14) { stitch(x - 2.5, F2 - 2.5, x + 2.5, F2 + 2.5, BLUE, 1.2); stitch(x - 2.5, F2 + 2.5, x + 2.5, F2 - 2.5, BLUE, 1.2); stitch(x - 2.5, AH - F2 - 2.5, x + 2.5, AH - F2 + 2.5, BLUE, 1.2); stitch(x - 2.5, AH - F2 + 2.5, x + 2.5, AH - F2 - 2.5, BLUE, 1.2); }

  // ================= house (flat, stylised)
  const S = 0.92, OX = 400 - 210 * S, OY = 352 - 226 * S;
  const T = (p) => [OX + p[0] * S, OY + p[1] * S], TP = (a) => a.map(T);
  const Hs = U.HOUSE, [wx0, wy0, wx1, wy1] = Hs.wall, rf = Hs.roof, ch = Hs.chim;
  // ground: green stem stitch line + grass stitches
  stem(curve((t) => [lerp(190, 610, t), 354 + 2 * Math.sin(t * 9)]), GREEN, 1.6);
  for (let x = 196; x < 606; x += 7) { const h = R.rr(4, 8); stitch(x, 353, x - 2, 353 - h, GREEN, 1.2); stitch(x + 2, 353, x + 4, 353 - h * 0.8, GREEN2, 1.2); }
  // walls: white satin (vertical), outlined in blue stem stitch
  satin(TP(U.rect(wx0, wy0 + 2, wx1, Hs.plinth)), WHITE, Math.PI / 2, 0.95, 1.35, 14);
  satin(TP(U.rect(wx0, Hs.plinth, wx1, wy1)), BLUE, Math.PI / 2, 1.1, 1.3);
  // decorative zigzag on plinth (white)
  { const pts = []; for (let x = wx0 + 3, i = 0; x <= wx1 - 3; x += 7, i++) pts.push(T([x, i % 2 ? Hs.plinth + 3 : wy1 - 3])); for (let i = 0; i + 1 < pts.length; i++) stitch(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], WHITE, 1.3); }
  stem(TP([[wx0, wy0 + 2], [wx0, wy1], [wx1, wy1], [wx1, wy0 + 2]]), BLUE, 1.5);
  // windows: blue satin glass with white cross, red shutters with blue edge, green flower boxes with red knots
  for (const [x, y, w, h] of Hs.wins) {
    satin(TP(U.rect(x, y, x + w, y + h)), BLUE, 0, 1.1, 1.3);
    const [ax, ay] = T([x + w / 2, y]), [bx, by] = T([x + w / 2, y + h]); stitch(ax, ay, bx, by, WHITE, 2.2);
    const [cx0, cy0] = T([x, y + h * 0.42]), [cx1] = T([x + w, 0]); stitch(cx0, cy0, cx1, cy0, WHITE, 2.2);
    for (const sx of [x - 14, x + w + 3]) { satin(TP(U.rect(sx, y, sx + 11, y + h)), RED, Math.PI / 2 + 0.0, 1.15, 1.3); }
    satin(TP([[x - 10, y - 4], [x + w / 2, y - 16], [x + w + 10, y - 4]]), RED, 0, 1.1, 1.3);
    satin(TP(U.rect(x - 4, y + h + 2, x + w + 4, y + h + 8)), GREEN, 0, 1.1, 1.3);
    for (let k = 0; k < 6; k++) { const [px, py] = T([x + 2 + k * (w - 4) / 5, y + h]); knot(px, py - 1, 2.1, k % 2 ? RED : PINK); }
  }
  // door: blue with red heart-tulip, porch posts in blue stem stitch with red knots
  const [dx0, dy0, dx1, dy1] = Hs.porch.door;
  satin(TP(U.rect(dx0, dy0, dx1, dy1)), BLUE, Math.PI / 2, 1.1, 1.3, 20);
  { const [tx, ty] = T([(dx0 + dx1) / 2, dy0 + 36]); tulip(tx, ty, 0.55, 0, RED, RED2); }
  for (const px of Hs.porch.posts) { stem(TP([[px - 1.5, wy0 + 2], [px - 1.5, wy1]]), BLUE2, 1.6); stem(TP([[px + 1.5, wy0 + 2], [px + 1.5, wy1]]), BLUE2, 1.6); for (const yy of [160, 186, 206]) { const [kx, ky] = T([px, yy]); knot(kx, ky, 2, RED); } }
  for (const [a, b] of [[60, 76], [116, 132]]) { stem(TP([[a, 186], [b, 186]]), GREEN, 1.4); for (let x = a + 2; x < b; x += 4.5) { const [p0x, p0y] = T([x, 188]), [p1x, p1y] = T([x, 206]); stitch(p0x, p0y, p1x, p1y, GREEN, 1.2); } }
  // steps
  satin(TP(U.rect(68, 214, 122, 220)), RED2, 0, 1.1, 1.3); satin(TP(U.rect(62, 220, 128, 226)), RED, 0, 1.1, 1.3);
  // roof: rows of red satin "tiles" (alternating stitch direction per row), blue outline, white zigzag eave
  const roofF = [[rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY]];
  const rows = 6;
  for (let i = 0; i < rows; i++) {
    const t0 = i / rows, t1 = (i + 1) / rows;
    const y0 = lerp(rf.eaveY, rf.ridgeY, t0), y1 = lerp(rf.eaveY, rf.ridgeY, t1);
    const a0 = lerp(rf.ex0, rf.rx0, t0), b0 = lerp(rf.ex1, rf.rx1, t0), a1 = lerp(rf.ex0, rf.rx0, t1), b1 = lerp(rf.ex1, rf.rx1, t1);
    satin(TP([[a1 + 0.6, y1 + 1], [b1 - 0.6, y1 + 1], [b0 - 0.6, y0 - 1], [a0 + 0.6, y0 - 1]]), i % 2 ? RED : RED2, i % 2 ? 0.75 : -0.75, 1.15, 1.3, 10);
    if (i > 0) { const pts = []; for (let x = a0 + 4; x <= b0 - 4; x += 5) pts.push(T([x, y0])); for (let k = 0; k + 1 < pts.length; k += 2) stitch(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], WHITE, 1.2); }
  }
  stem(TP([...roofF, roofF[0]]), BLUE, 1.6);
  { const pts = []; for (let x = rf.ex0 + 2, i = 0; x <= rf.ex1 - 2; x += 6, i++) pts.push(T([x, i % 2 ? rf.eaveY + 2 : rf.eaveY + 8])); for (let i = 0; i + 1 < pts.length; i++) stitch(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], GREEN, 1.4); }
  // chimney: white satin with red band, blue cap
  satin(TP(U.rect(ch.x0, ch.top + 6, ch.x1, ch.base - 26)), WHITE, Math.PI / 2, 1.1, 1.3);
  satin(TP(U.rect(ch.x0, ch.top + 8, ch.x1, ch.top + 14)), RED, 0, 1.1, 1.3);
  satin(TP(U.rect(ch.x0 - 4, ch.top, ch.x1 + 4, ch.top + 6)), BLUE, 0, 1.1, 1.3);
  // smoke: blue stem-stitch spiral
  stem(curve((t) => { const a = t * Math.PI * 3.4; const r = 3 + t * 12; const [bx, by] = T([256 + t * 40, ch.top - 6 - t * 50]); return [bx + Math.cos(a) * r * 0.6, by + Math.sin(a) * r * 0.4]; }, 80), BLUE2, 1.3, 3);

  // ================= Matyó ornament
  // side bouquets (mirror)
  function bouquet(sx) {
    const M = (x) => (sx > 0 ? x : AW - x);
    // main stems
    stem(curve((t) => [M(lerp(150, 120, t) + 18 * Math.sin(t * 3)), lerp(392, 120, t)]), GREEN, 1.6);
    stem(curve((t) => [M(lerp(150, 200, t)), lerp(392, 300, t) - 30 * Math.sin(t * 2.6)]), GREEN, 1.6);
    stem(curve((t) => [M(lerp(140, 72, t)), lerp(392, 250, t) - 20 * Math.sin(t * 3)]), GREEN, 1.6);
    // leaves
    for (const [bx, by, tx, ty, cl] of [[134, 330, 98, 300, GREEN], [140, 280, 176, 252, GREEN2], [128, 220, 92, 196, GREEN], [126, 170, 160, 150, GREEN2], [170, 330, 204, 342, GREEN], [100, 300, 66, 312, GREEN2], [150, 378, 112, 396, GREEN], [156, 380, 196, 398, GREEN2]]) leaf(M(bx), by, M(tx), ty, 7.5, cl, cl === GREEN ? GREEN2 : GREEN);
    // big rose, mid roses, tulip, paprika, buds
    rose(M(146), 384, 40, 0);
    rose(M(204), 296, 24, 1);
    rose(M(72), 246, 22, 1);
    tulip(M(120), 118, 1.15, sx > 0 ? -0.15 : 0.15, RED, BLUE);
    paprika(M(186), 214, 1.1, sx > 0 ? -0.6 : 0.6, RED);
    paprika(M(64), 330, 1, sx > 0 ? 0.5 : -0.5, BLUE);
    for (const [x, y, col] of [[96, 150, BLUE], [102, 160, RED], [176, 180, BLUE], [208, 250, RED], [56, 210, RED], [52, 286, BLUE], [214, 360, BLUE], [92, 360, RED], [190, 410, RED]]) knot(M(x), y, 2.6, col);
    // little spiral tendrils
    for (const [x, y, s] of [[176, 140, 1], [46, 176, -1], [230, 336, 1]]) stem(curve((t) => { const a = t * Math.PI * 2.6; const r = 14 * (1 - t * 0.85); return [M(x + Math.cos(a) * r * s), y + Math.sin(a) * r]; }, 50), GREEN2, 1.2, 2.6);
  }
  bouquet(1); bouquet(-1);
  // top garland arching over the house
  stem(curve((t) => [lerp(150, 650, t), 74 - 26 * Math.sin(Math.PI * t)]), GREEN, 1.5);
  for (let i = 1; i < 10; i++) { const t = i / 10, x = lerp(150, 650, t), y = 74 - 26 * Math.sin(Math.PI * t); if (Math.abs(x - 400) < 30) continue; const up = i % 2 ? -1 : 1; leaf(x, y, x + 14, y + up * 14, 5, i % 3 ? GREEN : GREEN2); knot(x - 4, y - up * 7, 2.2, i % 2 ? RED : BLUE); }
  rose(400, 48, 18, 0);
  for (const s of [-1, 1]) { leaf(400 + s * 18, 52, 400 + s * 42, 40, 6, GREEN, GREEN2); paprika(400 + s * 52, 58, 0.7, s * 1.2, s > 0 ? BLUE : RED); }
  // bottom garland under the house, mirrored from the top one
  stem(curve((t) => [lerp(240, 560, t), 404 + 14 * Math.sin(Math.PI * t)]), GREEN, 1.5);
  for (let i = 1; i < 8; i++) { const t = i / 8, x = lerp(240, 560, t), y = 404 + 14 * Math.sin(Math.PI * t); if (Math.abs(x - 400) < 34) continue; const up = i % 2 ? -1 : 1; leaf(x, y, x + (x < 400 ? -14 : 14), y + up * 13, 5, i % 3 ? GREEN : GREEN2); knot(x + 4, y - up * 7, 2.2, i % 2 ? BLUE : RED); }
  rose(400, 420, 20, 1);
  for (const s2 of [-1, 1]) tulip(400 + s2 * 40, 424, 0.7, s2 * 1.25, RED, BLUE);
};
