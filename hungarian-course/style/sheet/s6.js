/* 6. Watercolour: transparent subtractive washes with pigment-pooled edges, granulation on cold-press paper,
   wet-in-wet sky, blooms, white paper left for the walls, faint pencil underdrawing, spatter. */
window.STYLE = async function (root) {
  const { AW, AH, DPR, R, clamp, lerp, smooth, noise, fbm, hex, mulberry32 } = U;
  const W = AW * DPR, H = AH * DPR;
  R.seed(606);
  // ---- paper (RGB float) + texture height
  const out = new Float32Array(W * H * 3), tex = new Float32Array(W * H);
  { const r = mulberry32(66); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; const t = 0.5 + 0.5 * (0.6 * fbm(x * 0.09, y * 0.09, 3) + 0.4 * noise(x * 0.33, y * 0.33)); tex[i] = t; const v = 0.985 - 0.035 * (1 - t) + (r() - 0.5) * 0.012; out[i * 3] = 252 * v; out[i * 3 + 1] = 250 * v; out[i * 3 + 2] = 244 * v; } }
  const MC = U.canvas(W, H), mg = MC.getContext("2d", { willReadFrequently: true });
  const BC = U.canvas(W, H), bg = BC.getContext("2d", { willReadFrequently: true });
  // Hobbs-style polygon deformation (screen units)
  function deform(pts, depth, v) {
    let p = pts.map((q) => q.slice());
    for (let d = 0; d < depth; d++) {
      const np = [];
      for (let i = 0; i < p.length; i++) {
        const a = p[i], b = p[(i + 1) % p.length]; np.push(a);
        const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const s = v * (0.3 + Math.min(1, L / 40));
        np.push([(a[0] + b[0]) / 2 + R.gauss() * s, (a[1] + b[1]) / 2 + R.gauss() * s]);
      }
      p = np; v *= 0.6;
    }
    return p;
  }
  const poly = (g, pts) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); };
  // one wash. shapes: array of polygons in css px. o: {d density, layers, v, edge, blur, gran, bloom, wet, grad:[x0,y0,x1,y1,a0,a1]}
  function wash(shapes, col, o = {}) {
    const c = hex(col), dens = o.d ?? 0.6, layers = o.layers ?? 10, v = o.v ?? 2.2;
    mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, W, H); mg.setTransform(DPR, 0, 0, DPR, 0, 0);
    let bb = [1e9, 1e9, -1e9, -1e9];
    for (const s of shapes) {
      const b = U.bbox(s); bb = [Math.min(bb[0], b[0]), Math.min(bb[1], b[1]), Math.max(bb[2], b[2]), Math.max(bb[3], b[3])];
      const base = deform(s, 3, v * 1.4);
      mg.fillStyle = `rgba(0,0,0,${1 / layers * 1.6})`;
      for (let l = 0; l < layers; l++) { poly(mg, deform(base, 2, v)); mg.fill(); }
    }
    if (o.wet) { bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, W, H); bg.filter = `blur(${o.wet}px)`; bg.drawImage(MC, 0, 0); bg.filter = "none"; mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, W, H); mg.drawImage(BC, 0, 0); mg.setTransform(DPR, 0, 0, DPR, 0, 0); }
    if (o.reserve) { mg.save(); mg.globalCompositeOperation = "destination-out"; mg.fillStyle = "#000"; for (const rp of o.reserve) { poly(mg, deform(rp, 2, 0.7)); mg.fill(); } mg.restore(); }
    const pad = 24, x0 = clamp(Math.floor((bb[0] - pad) * DPR), 0, W - 1), y0 = clamp(Math.floor((bb[1] - pad) * DPR), 0, H - 1), x1 = clamp(Math.ceil((bb[2] + pad) * DPR), 1, W), y1 = clamp(Math.ceil((bb[3] + pad) * DPR), 1, H);
    const w = x1 - x0, h = y1 - y0; if (w <= 0 || h <= 0) return;
    const m = mg.getImageData(x0, y0, w, h).data;
    bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, W, H); bg.filter = `blur(${o.blur ?? 5}px)`; bg.drawImage(MC, 0, 0); bg.filter = "none";
    const mb = bg.getImageData(x0, y0, w, h).data;
    const edgeK = o.edge ?? 1.6, gran = o.gran ?? 0.5, gr = o.grad, sd = R.rr(0, 100), varK = o.varK ?? 0.45;
    const blooms = (o.bloom || []).map(([bx, by, br]) => [bx * DPR, by * DPR, br * DPR]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const k = (y * w + x) * 4, a = m[k + 3] / 255; if (a < 0.004) continue;
      const X = x + x0, Y = y + y0, i = Y * W + X;
      let d = Math.min(1, a * 1.05) * dens * (1 - varK * 0.5 + varK * (0.5 + 0.5 * fbm(X * 0.006 + sd, Y * 0.006, 3)));
      if (gr) { const t = clamp(((X / DPR - gr[0]) * (gr[2] - gr[0]) + (Y / DPR - gr[1]) * (gr[3] - gr[1])) / ((gr[2] - gr[0]) ** 2 + (gr[3] - gr[1]) ** 2), 0, 1); d *= lerp(gr[4], gr[5], t); }
      const e = Math.max(0, a - mb[k + 3] / 255); d += e * edgeK * dens;
      for (const [bx, by, br] of blooms) { const r = Math.hypot(X - bx, Y - by) / br + 0.25 * noise(X * 0.05, Y * 0.05); if (r < 1) d *= lerp(0.35, 1, r * r); else if (r < 1.12) d *= 1.45; }
      if (o.vign) { const vx = (X / DPR - 400) / 372, vy = (Y / DPR - 262) / 236, vr = Math.hypot(vx, vy) + 0.12 * fbm(X * 0.004, Y * 0.004 + 7, 3); d *= 1 - smooth(0.78, 1.0, vr); }
      d *= 1 + gran * (0.5 - tex[i]) * 1.6; d = clamp(d, 0, 0.97);
      out[i * 3] *= 1 - d * (1 - c[0] / 255); out[i * 3 + 1] *= 1 - d * (1 - c[1] / 255); out[i * 3 + 2] *= 1 - d * (1 - c[2] / 255);
    }
  }
  // dry-brush stroke list -> wash using thin polygons
  function strokePoly(x0, y0, x1, y1, w) { const L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L * w / 2, ny = (x1 - x0) / L * w / 2; return [[x0 + nx * 0.3, y0 + ny * 0.3], [(x0 + x1) / 2 + nx, (y0 + y1) / 2 + ny], [x1, y1], [(x0 + x1) / 2 - nx, (y0 + y1) / 2 - ny], [x0 - nx * 0.3, y0 - ny * 0.3]]; }
  const ellipse = (cx, cy, rx, ry, n = 24) => { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; p.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return p; };

  // ---- house transform
  const S = 1.2, OX = (AW - 420 * S) / 2 + 14, OY = 382 - 226 * S;
  const T = (p) => [OX + p[0] * S, OY + p[1] * S];
  const TP = (pts) => pts.map(T);
  const Hs = U.HOUSE, [wx0, wy0, wx1, wy1] = Hs.wall, rf = Hs.roof, ch = Hs.chim;
  const HOUSE_R = [TP([[rf.ex0 - 1, rf.eaveY + 3], [rf.rx0, rf.ridgeY - 1], [rf.rx1, rf.ridgeY - 1], [421, rf.eaveY + 13], [398, 150], [398, 216], [wx1, 223], [wx0, 223], [wx0, rf.eaveY + 3]]), TP(U.rect(ch.x0 - 4, ch.top - 1, ch.x1 + 4, 40))];
  const SPR = [[426, 222, 150, 30], [460, 226, 112, 24]];

  // ================= washes (light to dark) =================
  // sky: wet-in-wet, soft, leaves paper around the roof
  wash([[[60, 40], [740, 30], [770, 250], [700, 300], [80, 310], [30, 200]]], "#86b2d4", { vign: 1, d: 0.55, layers: 8, v: 14, wet: 26, edge: 0, gran: 0.25, grad: [0, 30, 0, 300, 1, 0.15], varK: 0.8, reserve: HOUSE_R });
  wash([[[90, 210], [720, 200], [740, 320], [70, 330]]], "#f0c98a", { vign: 1, d: 0.35, layers: 6, v: 12, wet: 30, edge: 0, gran: 0.1, varK: 0.6, reserve: HOUSE_R });
  // distant mountains, pale blue-violet, hard edge
  const ridge = (x) => 272 - 62 * Math.max(0, 1 - Math.abs(x - 560) / 200) - 40 * Math.max(0, 1 - Math.abs(x - 250) / 170) - 6 * fbm(x * 0.03, 1, 3);
  { const p = []; for (let x = 70; x <= 740; x += 10) p.push([x, ridge(x)]); p.push([745, 330], [65, 330]); wash([p], "#9ea5c9", { vign: 1, d: 0.5, v: 2, edge: 2.2, gran: 0.9, grad: [0, 200, 0, 330, 1, 0.45], reserve: HOUSE_R }); }
  // far forest band
  { const p = []; for (let x = 60; x <= 750; x += 8) p.push([x, 318 - 10 * Math.sin(x * 0.03) - 6 * noise(x * 0.08, 2)]); p.push([752, 352], [58, 352]); wash([p], "#6f9a7c", { vign: 1, d: 0.55, v: 2.5, edge: 1.8, gran: 0.7, reserve: HOUSE_R }); }
  // meadow: yellow-green base, fades out at the bottom (vignette)
  wash([[[40, 336], [770, 330], [760, 440], [520, 466], [250, 462], [40, 440]]], "#a9c46a", { vign: 1, d: 0.6, v: 6, edge: 0.8, gran: 0.5, layers: 12, grad: [0, 340, 0, 470, 1, 0.3], bloom: [[640, 410, 30]], reserve: HOUSE_R });
  wash([[[40, 372], [300, 366], [520, 372], [770, 366], [760, 420], [600, 446], [200, 444], [40, 420]]], "#6c9a52", { vign: 1, d: 0.45, v: 8, edge: 1.2, gran: 0.6, layers: 10, grad: [0, 370, 0, 450, 0.6, 1], reserve: HOUSE_R });
  // path
  wash([TP([[66, 226], [124, 226], [146, 290], [34, 290]])], "#d2ad7c", { d: 0.5, v: 4, edge: 1.3, gran: 0.9, grad: [0, OY + 226 * S, 0, OY + 292 * S, 1, 0.1] });
  // walnut tree on the left: trunk first, crown glazed over it
  wash([[[112, 290], [124, 290], [128, 378], [106, 378]], strokePoly(117, 314, 96, 282, 4), strokePoly(122, 308, 142, 280, 4)], "#6e5038", { d: 0.75, v: 1.2, edge: 1.4 });
  wash([ellipse(118, 246, 74, 60)], "#9bbf5c", { d: 0.62, v: 6, edge: 1.5, gran: 0.5, layers: 12, bloom: [[96, 226, 18]] });
  wash([ellipse(140, 272, 46, 30), ellipse(92, 260, 30, 22), ellipse(150, 228, 26, 20)], "#4f7d45", { d: 0.55, v: 5, edge: 1.8, gran: 0.6 });
  // spruces right
  for (const [x, y, h, w] of SPR) {
    const tiers = 6, tl = [], td = [];
    for (let i = 0; i < tiers; i++) { const t = (i + 1) / tiers, top = y - h + (i / tiers) * h * 0.82, bot = y - h + t * h * 0.9 + 4, ww = w * (0.25 + 0.75 * t); const tri = TP([[x, top - 4], [x + ww * 0.5, (top + bot) / 2], [x + ww, bot], [x + ww * 0.3, bot - 3], [x, bot + 1], [x - ww * 0.3, bot - 3], [x - ww, bot], [x - ww * 0.5, (top + bot) / 2]]); (i % 2 ? td : tl).push(tri); }
    wash(tl, "#4b7a5c", { d: 0.7, v: 0.9, edge: 1.8, gran: 0.7 }); wash(td, "#33604d", { d: 0.75, v: 0.9, edge: 1.8, gran: 0.7 });
    wash([TP(U.rect(x - 2, y - 6, x + 2, y + 2))], "#5a4030", { d: 0.7, v: 0.4 });
  }
  // house shadow on the ground
  wash([TP([[40, 222], [410, 214], [470, 232], [380, 240], [40, 234]])], "#6a6f9a", { d: 0.4, v: 2, edge: 1.5, gran: 0.6 });
  // walls: paper left white; cool shadow under eave + porch recess + side wall
  wash([TP([[wx0, wy0], [wx1, wy0], [wx1, wy0 + 20], [wx0 + 150, wy0 + 26], [wx0, wy0 + 30]])], "#a7a2c6", { d: 0.42, v: 1.4, edge: 1.6, gran: 0.5, grad: [0, OY + wy0 * S, 0, OY + (wy0 + 26) * S, 1, 0.3] });
  wash([TP([[wx0, wy0], [wx1, wy0], [wx1, wy0 + 7], [wx0 + 200, wy0 + 9], [wx0, wy0 + 8]])], "#6f6a98", { d: 0.45, v: 1.2, edge: 1.6, gran: 0.6 });
  wash([TP(U.rect(wx0, wy0, Hs.porch.x1, wy1))], "#b49d93", { d: 0.42, v: 1.3, edge: 1.6, gran: 0.5, grad: [0, OY + wy0 * S, 0, OY + wy1 * S, 1, 0.5] });
  wash([TP([[wx1, 138], [398, 146], [398, 216], [wx1, 222]])], "#a29bc4", { d: 0.48, v: 1.2, edge: 1.8, gran: 0.6 });
  wash([TP(U.rect(wx0 + 2, Hs.plinth, wx1, wy1)), TP([[wx1, 208], [398, 205], [398, 216], [wx1, 222]])], "#4f7fb6", { d: 0.7, v: 1, edge: 1.6, gran: 0.6 });
  // roof: sienna base, carmine/ochre variation wet-in-wet, then hip side + tile strokes
  const roofF = TP([[rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY]]);
  wash([roofF], "#d0703f", { d: 0.72, v: 1.6, edge: 1.7, gran: 0.6, layers: 12, bloom: [[OX + 120 * S, OY + 70 * S, 16]] });
  wash([roofF], "#a8383a", { d: 0.4, v: 1.6, edge: 0.4, gran: 0.4, grad: [OX + 150 * S, 0, OX + 384 * S, 0, 0, 1], layers: 8 });
  wash([TP([[rf.ex1, rf.eaveY], [rf.rx1, rf.ridgeY], [420, rf.eaveY + 12]])], "#8e3c2c", { d: 0.55, v: 1.2, edge: 1.6, gran: 0.6 });
  { const st = []; for (let i = 1; i < 8; i++) { const y = lerp(rf.eaveY, rf.ridgeY, i / 8); const xa = lerp(rf.ex0, rf.rx0, i / 8) + 6, xb = lerp(rf.ex1, rf.rx1, i / 8) - 6; for (let x = xa; x < xb; x += R.rr(10, 30)) { const len = R.rr(18, 50); if (R.r() < 0.25) continue; st.push(TP(strokePoly(x, y + R.rr(-0.6, 0.6), Math.min(xb, x + len), y + R.rr(-0.6, 0.6), 1.5))); } } wash(st, "#8a3424", { d: 0.55, v: 0.5, edge: 1, gran: 0.4, layers: 4, blur: 2 }); }
  wash([TP(U.rect(rf.ex0, rf.eaveY - 1, rf.ex1, rf.eaveY + 4))], "#5c3a2a", { d: 0.7, v: 0.6, edge: 1, layers: 6 });
  // chimney: shade side, cap, brick band
  wash([TP(U.rect(ch.x1 - 8, ch.top + 6, ch.x1, ch.base - 10))], "#a29bc4", { d: 0.45, v: 0.8, edge: 1.6 });
  wash([TP(U.rect(ch.x0, ch.top + 6, ch.x1, ch.top + 13))], "#b9553a", { d: 0.65, v: 0.6, edge: 1.4 });
  wash([TP(U.rect(ch.x0 - 4, ch.top, ch.x1 + 4, ch.top + 6))], "#4b4552", { d: 0.75, v: 0.5, edge: 1.2 });
  // windows: indigo glass with a dry white reflection, cerulean shutters, red geranium blots
  for (const [x, y, w, h] of Hs.wins) {
    wash([TP([[x, y], [x + w, y], [x + w, y + h], [x + 22, y + h], [x + 10, y + h * 0.55], [x, y + h * 0.7]])], "#3c4d78", { d: 0.78, v: 0.7, edge: 1.5, gran: 0.6 });
    wash([TP(U.rect(x - 15, y - 1, x - 3, y + h + 1)), TP(U.rect(x + w + 3, y - 1, x + w + 15, y + h + 1)), TP([[x - 8, y - 4], [x + w / 2, y - 16], [x + w + 8, y - 4]])], "#4f84c0", { d: 0.7, v: 0.8, edge: 1.7, gran: 0.6 });
    wash([TP(U.rect(x - 5, y + h + 3, x + w + 5, y + h + 10))], "#a2553a", { d: 0.7, v: 0.6, edge: 1.4 });
    wash([TP(ellipse(x + w / 2, y + h + 1, w / 2 + 2, 4.5))], "#5f8a3e", { d: 0.75, v: 0.8, edge: 1.5 });
    const fl = []; for (let k = 0; k < 6; k++) fl.push(TP(ellipse(x + 3 + k * (w - 6) / 5, y + h - 1 + (k % 2) * 2, 3, 2.6, 10))); wash(fl, "#d93b33", { d: 0.85, v: 0.5, edge: 1.4 });
  }
  wash([TP([[372, 160], [388, 163], [388, 186], [372, 184]])], "#3c4d78", { d: 0.7, v: 0.6, edge: 1.4 });
  // door, porch posts, railings, steps (sepia)
  const [dx0, dy0, dx1, dy1] = Hs.porch.door;
  wash([TP(U.rect(dx0, dy0, dx1, dy1))], "#7a4f33", { d: 0.78, v: 1, edge: 1.8, gran: 0.7 });
  wash(Hs.porch.posts.map((px) => TP(U.rect(px - 3.5, wy0 + 2, px + 3.5, wy1))), "#6e4a30", { d: 0.75, v: 0.6, edge: 1.4 });
  { const rl = []; for (const [a, b] of [[58, 76], [114, 132]]) { rl.push(TP(U.rect(a, 185, b, 188))); for (let x = a + 2; x < b - 1; x += 4.4) rl.push(TP(U.rect(x, 188, x + 1.8, 208))); } wash(rl, "#8a6040", { d: 0.6, v: 0.3, edge: 1, layers: 4, blur: 2 }); }
  wash([TP(U.rect(70, 214, 120, 220)), TP(U.rect(64, 220, 126, 226))], "#9a7458", { d: 0.55, v: 0.6, edge: 1.5 });
  wash([TP([[46, 148], [50, 148], [50, 186], [46, 186]])], "#c8332a", { d: 0.8, v: 0.6, edge: 1.5 });
  // flowers at foot + sunflowers
  { const fl = []; for (let i = 0; i < 18; i++) { const x = R.pick([R.rr(4, 36), R.rr(150, 180), R.rr(336, 368)]); fl.push(TP(ellipse(x, R.rr(214, 224), R.rr(3, 6), R.rr(2.5, 4), 10))); } wash(fl, "#5f8a3e", { d: 0.7, v: 0.8, edge: 1.5 }); }
  { const fl = []; for (let i = 0; i < 12; i++) { const x = R.pick([R.rr(4, 36), R.rr(150, 180), R.rr(336, 368)]); fl.push(TP(ellipse(x, R.rr(210, 220), 2.4, 2.2, 8))); } wash(fl, "#d93b33", { d: 0.85, v: 0.4, edge: 1.2, layers: 5 }); }
  for (const [x, h] of [[478, 76], [498, 58]]) {
    wash([TP(strokePoly(x, 226, x - 2, 226 - h, 3)), TP(strokePoly(x - 1, 226 - h * 0.5, x + 14, 226 - h * 0.62, 7))], "#5b8a3c", { d: 0.75, v: 0.4, edge: 1.2, layers: 5 });
    const pet = []; for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; pet.push(TP(strokePoly(x - 2 + Math.cos(a) * 4, 226 - h + Math.sin(a) * 4, x - 2 + Math.cos(a) * 13, 226 - h + Math.sin(a) * 13, 5))); }
    wash(pet, "#f2b628", { d: 0.85, v: 0.4, edge: 1.4, layers: 6 });
    wash([TP(ellipse(x - 2, 226 - h, 5, 5, 12))], "#5a3820", { d: 0.85, v: 0.4, edge: 1 });
  }
  // smoke: very pale grey wet wash
  wash([TP(ellipse(268, -6, 10, 8)), TP(ellipse(282, -24, 14, 10)), TP(ellipse(302, -44, 18, 12))], "#a9a7b8", { d: 0.16, v: 3, wet: 10, edge: 0.2, gran: 0.3 });

  // ================= pencil underdrawing (faint, loose) =================
  const PC = U.layer(), pg = PC.g;
  pg.strokeStyle = "rgba(70,66,64,0.32)"; pg.lineWidth = 0.7;
  const pl = (pts) => { for (let rep = 0; rep < 2; rep++) { pg.beginPath(); pts.forEach((p, i) => { const q = T(p); const jx = R.rr(-0.8, 0.8), jy = R.rr(-0.8, 0.8); i ? pg.lineTo(q[0] + jx, q[1] + jy) : pg.moveTo(q[0] + jx, q[1] + jy); }); pg.stroke(); } };
  const ext = (a, b, e = 6) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L; return [[a[0] - ux * e, a[1] - uy * e], [b[0] + ux * e, b[1] + uy * e]]; };
  pl(ext([rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY])); pl(ext([rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY])); pl(ext([rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY])); pl(ext([rf.ex0, rf.eaveY], [rf.ex1, rf.eaveY]));
  pl(ext([rf.rx1, rf.ridgeY], [420, rf.eaveY + 12])); pl(ext([wx0, wy0], [wx0, wy1], 3)); pl(ext([wx1, wy0], [wx1, wy1], 3)); pl(ext([wx0, wy1], [wx1, wy1])); pl(ext([398, 146], [398, 216], 3)); pl(ext([wx1, wy1], [398, 216], 3));
  for (const [x, y, w, h] of Hs.wins) { pl([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]); pl([[x + w / 2, y], [x + w / 2, y + h]]); pl([[x, y + h * 0.4], [x + w, y + h * 0.4]]); }
  pl([[dx0, dy1], [dx0, dy0], [dx1, dy0], [dx1, dy1]]); pl([[ch.x0, 50], [ch.x0, ch.top], [ch.x1, ch.top], [ch.x1, 50]]);
  for (const px of Hs.porch.posts) pl(ext([px, wy0], [px, wy1], 3));

  // ================= spatter =================
  const sp = (n, col, x0, y0, x1, y1) => { const c = hex(col); for (let i = 0; i < n; i++) { const cx = R.rr(x0, x1) * DPR, cy = R.rr(y0, y1) * DPR, r = (R.r() < 0.85 ? R.rr(0.6, 1.6) : R.rr(2, 3.4)) * DPR, d = R.rr(0.35, 0.7); for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { if (x < 0 || y < 0 || x >= W || y >= H) continue; const q = Math.hypot(x - cx, y - cy) / r; if (q > 1) continue; const i2 = (y * W + x), dd = d * (q > 0.75 ? 1.3 : 1); for (let k = 0; k < 3; k++) out[i2 * 3 + k] *= 1 - dd * (1 - c[k] / 255); } } };
  sp(40, "#6c9a52", 180, 400, 640, 470); sp(18, "#c25a35", 260, 380, 560, 460); sp(10, "#86b2d4", 120, 40, 700, 140);

  // ================= output =================
  const { g } = U.artCanvas(root); g.setTransform(1, 0, 0, 1, 0, 0);
  const im = g.createImageData(W, H), d = im.data;
  for (let i = 0; i < W * H; i++) { d[i * 4] = out[i * 3]; d[i * 4 + 1] = out[i * 3 + 1]; d[i * 4 + 2] = out[i * 3 + 2]; d[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
  g.globalCompositeOperation = "multiply"; g.drawImage(PC.c, 0, 0); g.globalCompositeOperation = "source-over";
};
