/* 8. Coloured pencil: layered directional hatching with ragged stroke ends, pigment only on the paper tooth,
   loose sketchy outline in dark sepia pencil. */
window.STYLE = async function (root) {
  const { AW, AH, DPR, R, clamp, lerp, smooth, noise, fbm, hex, mulberry32 } = U;
  const W = AW * DPR, H = AH * DPR;
  R.seed(808);
  // paper + tooth
  const out = new Float32Array(W * H * 3), tooth = new Float32Array(W * H);
  { const r = mulberry32(8); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; const t = 0.5 + 0.5 * (0.55 * noise(x * 0.42, y * 0.16) + 0.35 * noise(x * 0.9, y * 0.9) + 0.25 * fbm(x * 0.05, y * 0.05, 2)); tooth[i] = clamp(t + (r() - 0.5) * 0.15, 0, 1); const v = 0.99 - 0.02 * (1 - t); out[i * 3] = 251 * v; out[i * 3 + 1] = 248 * v; out[i * 3 + 2] = 240 * v; } }
  const LC = U.canvas(W, H), lg = LC.getContext("2d", { willReadFrequently: true });
  lg.lineCap = "round"; lg.lineJoin = "round";
  let bb = null;
  const begin = () => { lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, W, H); lg.setTransform(DPR, 0, 0, DPR, 0, 0); bb = [1e9, 1e9, -1e9, -1e9]; };
  const grow = (x, y) => { if (x < bb[0]) bb[0] = x; if (y < bb[1]) bb[1] = y; if (x > bb[2]) bb[2] = x; if (y > bb[3]) bb[3] = y; };
  // lay down the pencil layer with colour: pigment only where pressure beats the paper tooth
  function commit(col, press = 1, wax = 0.95) {
    const c = hex(col), pad = 6;
    const x0 = clamp(Math.floor((bb[0] - pad) * DPR), 0, W), y0 = clamp(Math.floor((bb[1] - pad) * DPR), 0, H), x1 = clamp(Math.ceil((bb[2] + pad) * DPR), 0, W), y1 = clamp(Math.ceil((bb[3] + pad) * DPR), 0, H);
    if (x1 <= x0 || y1 <= y0) return;
    const w = x1 - x0, d = lg.getImageData(x0, y0, w, y1 - y0).data;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const a = d[((y - y0) * w + (x - x0)) * 4 + 3] / 255; if (a < 0.01) continue;
      const i = y * W + x; let e = clamp(a * press * 1.75 - (1 - tooth[i]) * 0.8, 0, 1) * wax; e = Math.min(0.95, e);
      out[i * 3] *= 1 - e * (1 - c[0] / 255); out[i * 3 + 1] *= 1 - e * (1 - c[1] / 255); out[i * 3 + 2] *= 1 - e * (1 - c[2] / 255);
    }
  }
  // hatch a polygon (screen css coords): scanline intersections in rotated frame, ragged ends, optional zigzag scribble
  function hatch(poly, o = {}) {
    const ang = o.ang ?? -0.9, sp = o.sp ?? 2.6, lw = o.w ?? 1.3, a = o.a ?? 0.75, rag = o.rag ?? 3, zig = o.zig ?? false;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const rp = poly.map(([x, y]) => [x * ca + y * sa, -x * sa + y * ca]);
    const vs = rp.map((p) => p[1]); const vmin = Math.min(...vs), vmax = Math.max(...vs);
    let prev = null;
    for (let v = vmin + R.rr(0, sp); v < vmax; v += sp * R.rr(0.75, 1.25)) {
      const xs = [];
      for (let i = 0; i < rp.length; i++) { const p = rp[i], q = rp[(i + 1) % rp.length]; if ((p[1] > v) !== (q[1] > v)) xs.push(p[0] + (v - p[1]) / (q[1] - p[1]) * (q[0] - p[0])); }
      xs.sort((m, n) => m - n);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        let u0 = xs[k] + R.rr(-rag, rag * 0.6), u1 = xs[k + 1] + R.rr(-rag * 0.6, rag);
        if (o.fade) { const t = o.fade(v, u0, u1); if (R.r() > t) continue; }
        if (u1 - u0 < 1) continue;
        const toXY = (u, vv) => [u * ca - vv * sa, u * sa + vv * ca];
        const P0 = toXY(u0, v + R.rr(-0.4, 0.4)), P1 = toXY(u1, v + R.rr(-0.4, 0.4)), bend = R.rr(-0.6, 0.6);
        const M = [(P0[0] + P1[0]) / 2 - sa * bend, (P0[1] + P1[1]) / 2 + ca * bend];
        lg.lineWidth = lw * R.rr(0.8, 1.15); lg.strokeStyle = `rgba(0,0,0,${a * R.rr(0.65, 1)})`;
        lg.beginPath();
        if (zig && prev && Math.hypot(prev[0] - P0[0], prev[1] - P0[1]) < sp * 3 && R.r() < 0.8) { lg.moveTo(prev[0], prev[1]); lg.lineTo(P0[0], P0[1]); } else lg.moveTo(P0[0], P0[1]);
        lg.quadraticCurveTo(M[0], M[1], P1[0], P1[1]); lg.stroke();
        grow(P0[0], P0[1]); grow(P1[0], P1[1]);
        prev = zig && (Math.floor(v / sp) % 2) ? P0 : P1;
      }
    }
  }
  // sketchy outline stroke (pencil): 2 passes, slight wobble
  function sk(pts, closed = false, lw = 1.1, a = 0.85) {
    for (let rep = 0; rep < 2; rep++) {
      const ps = U.resample(pts, 4, closed); if (closed) ps.push(ps[0].slice());
      const sd = R.rr(0, 99), ex = R.rr(1, 4);
      lg.lineWidth = lw * (rep ? 0.8 : 1); lg.strokeStyle = `rgba(0,0,0,${a * (rep ? 0.6 : 1)})`; lg.beginPath();
      ps.forEach((p, i) => { const x = p[0] + 0.9 * noise(i * 0.12 + sd, sd), y = p[1] + 0.9 * noise(sd, i * 0.12 + sd); i ? lg.lineTo(x, y) : lg.moveTo(x, y); grow(x, y); });
      lg.stroke();
      if (!closed && pts.length === 2) { const [a0, b0] = pts, L = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]) || 1, ux = (b0[0] - a0[0]) / L, uy = (b0[1] - a0[1]) / L; lg.beginPath(); lg.moveTo(b0[0], b0[1]); lg.lineTo(b0[0] + ux * ex, b0[1] + uy * ex); lg.stroke(); }
    }
  }
  const ellipse = (cx, cy, rx, ry, n = 32) => { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; p.push([cx + Math.cos(a) * rx * (1 + 0.04 * noise(i, cx)), cy + Math.sin(a) * ry * (1 + 0.04 * noise(cy, i))]); } return p; };

  // house transform
  const S = 1.2, OX = (AW - 420 * S) / 2 + 14, OY = 384 - 226 * S;
  const T = (p) => [OX + p[0] * S, OY + p[1] * S], TP = (a) => a.map(T);
  const Hs = U.HOUSE, [wx0, wy0, wx1, wy1] = Hs.wall, rf = Hs.roof, ch = Hs.chim;
  const roofF = TP([[rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY]]);
  const roofS = TP([[rf.ex1, rf.eaveY], [rf.rx1, rf.ridgeY], [420, rf.eaveY + 12]]);
  const houseSil = TP([[rf.ex0, rf.eaveY + 3], [rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY], [421, rf.eaveY + 13], [398, 150], [398, 216], [wx1, 223], [wx0, 223], [wx0, rf.eaveY + 3]]);
  const outside = (x, y) => !U.inPoly(x, y, houseSil) && !U.inPoly(x, y, pathP);
  const pathP = TP([[66, 226], [124, 226], [150, 290], [30, 290]]);

  // ================= SKY: loose light-blue strokes fading downward, paper around the sun
  begin(); hatch([[10, 8], [790, 8], [790, 250], [10, 250]], { ang: -0.5, sp: 3.6, w: 1.5, a: 0.5, rag: 14, zig: true, fade: (v) => 1 });
  // erase near sun & low sky by masking: simplest — redraw clear areas
  lg.save(); lg.globalCompositeOperation = "destination-out";
  { const g2 = lg.createRadialGradient(150, 92, 30, 150, 92, 120); g2.addColorStop(0, "rgba(0,0,0,1)"); g2.addColorStop(1, "rgba(0,0,0,0)"); lg.fillStyle = g2; lg.fillRect(0, 0, 400, 260); }
  { const g3 = lg.createLinearGradient(0, 120, 0, 250); g3.addColorStop(0, "rgba(0,0,0,0)"); g3.addColorStop(1, "rgba(0,0,0,1)"); lg.fillStyle = g3; lg.fillRect(0, 120, AW, 140); }
  lg.beginPath(); U.path(lg, houseSil); lg.fill(); lg.restore();
  commit("#79acd8", 0.75);
  // sun: yellow core + orange edge strokes radiating
  begin(); hatch(ellipse(150, 92, 30, 30), { ang: 0.4, sp: 2, w: 1.4, a: 0.9, rag: 1.5, zig: true }); commit("#f6cf3e", 1);
  begin(); for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; sk([[150 + Math.cos(a) * 40, 92 + Math.sin(a) * 40], [150 + Math.cos(a) * 56, 92 + Math.sin(a) * 56]], false, 1.8, 0.9); } hatch(ellipse(156, 98, 22, 22), { ang: -0.8, sp: 3, w: 1.2, a: 0.6, rag: 2 }); commit("#ef8f2a", 1);
  // ================= MOUNTAINS + HILLS
  const ridge = (x) => 272 - 70 * Math.max(0, 1 - Math.abs(x - 560) / 200) - 44 * Math.max(0, 1 - Math.abs(x - 250) / 170) - 6 * fbm(x * 0.03, 1, 3);
  const mpoly = []; for (let x = 0; x <= AW; x += 8) mpoly.push([x, ridge(x)]); mpoly.push([AW, 340], [0, 340]);
  begin(); hatch(mpoly, { ang: -1.05, sp: 2.8, w: 1.3, a: 0.6, rag: 4, fade: (v, u0, u1) => 1 }); lg.save(); lg.globalCompositeOperation = "destination-out"; U.path(lg, houseSil); lg.fill(); lg.restore(); commit("#8286c0", 1);
  begin(); hatch(mpoly.map(([x, y]) => [x, y + 16]), { ang: 0.6, sp: 4, w: 1.2, a: 0.45, rag: 6 }); lg.save(); lg.globalCompositeOperation = "destination-out"; U.path(lg, houseSil); lg.fill(); lg.restore(); commit("#56619e", 0.85);
  const hill = (x) => 324 - 12 * Math.sin(x * 0.012 + 1) - 5 * Math.sin(x * 0.04);
  const hpoly = []; for (let x = 0; x <= AW; x += 8) hpoly.push([x, hill(x)]); hpoly.push([AW, AH], [0, AH]);
  begin(); hatch(hpoly, { ang: -0.15, sp: 2.4, w: 1.5, a: 0.7, rag: 8, zig: true }); lg.save(); lg.globalCompositeOperation = "destination-out"; U.path(lg, houseSil); lg.fill(); lg.restore(); commit("#b7cf54", 0.95);
  // grass: flicks of mid and dark green, heavier toward the bottom
  begin(); for (let i = 0; i < 1100; i++) { const x = R.rr(0, AW), y = R.rr(hill(x) + 6, AH + 4); if (!outside(x, y)) continue; const h = lerp(4, 12, (y - 320) / 160); lg.lineWidth = R.rr(0.9, 1.5); lg.strokeStyle = `rgba(0,0,0,${R.rr(0.5, 0.95)})`; lg.beginPath(); lg.moveTo(x, y); lg.quadraticCurveTo(x + R.rr(-2, 2), y - h * 0.5, x + R.rr(-3, 3), y - h); lg.stroke(); grow(x, y - h); grow(x, y); } commit("#5d9a3c", 0.95);
  begin(); for (let i = 0; i < 500; i++) { const x = R.rr(0, AW), y = R.rr(390, AH + 4); if (!outside(x, y)) continue; const h = lerp(5, 14, (y - 370) / 110); lg.lineWidth = R.rr(1, 1.6); lg.strokeStyle = `rgba(0,0,0,${R.rr(0.5, 0.9)})`; lg.beginPath(); lg.moveTo(x, y); lg.quadraticCurveTo(x + R.rr(-2, 2), y - h * 0.5, x + R.rr(-3, 3), y - h); lg.stroke(); grow(x, y - h); grow(x, y); } commit("#2f6b3a", 0.9);
  // path
  const path = TP([[66, 226], [124, 226], [150, 290], [30, 290]]);
  begin(); hatch(path, { ang: 0.1, sp: 2.4, w: 1.4, a: 0.75, rag: 3, zig: true }); commit("#d9a86a", 0.9);
  begin(); hatch(path, { ang: -0.7, sp: 4.5, w: 1.1, a: 0.6, rag: 3 }); commit("#9b6a44", 0.6);
  // tree (left): green crown in two layers + trunk
  const crown = ellipse(104, 244, 70, 58, 40).map(([x, y], i) => [x + 5 * Math.sin(i * 1.7), y + 5 * Math.cos(i * 2.3)]);
  begin(); hatch([[98, 300], [112, 300], [116, 384], [94, 384]], { ang: 1.45, sp: 1.8, w: 1.3, a: 0.9, rag: 1 }); commit("#7a4f2e", 1);
  begin(); hatch(crown, { ang: -0.8, sp: 2.2, w: 1.5, a: 0.8, rag: 4, zig: true }); commit("#93c443", 1);
  begin(); hatch(ellipse(124, 266, 46, 32), { ang: 0.7, sp: 2.6, w: 1.4, a: 0.7, rag: 5, zig: true }); hatch(ellipse(78, 262, 26, 20), { ang: 0.7, sp: 2.8, w: 1.4, a: 0.6, rag: 5 }); commit("#356d34", 1);
  // spruces
  for (const [x, y, h, w] of [[426, 222, 150, 30], [460, 226, 112, 24]]) {
    const pts = []; const n = 6; for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x - w * t - 3, y - h + t * h * 0.95]); if (i < n) pts.push([x - w * t * 0.5, y - h + (t + 0.55 / n) * h * 0.95]); }
    const pr = []; for (let i = n; i >= 0; i--) { const t = i / n; if (i < n) pr.push([x + w * t * 0.5, y - h + (t + 0.55 / n) * h * 0.95]); pr.push([x + w * t + 3, y - h + t * h * 0.95]); }
    const sp = TP([[x, y - h - 6], ...pts, ...pr]);
    begin(); hatch(sp, { ang: -1.2, sp: 2, w: 1.4, a: 0.85, rag: 2, zig: true }); commit("#3e7a52", 1);
    begin(); hatch(sp.map(([px, py]) => [px + 3, py + 2]), { ang: 0.9, sp: 2.6, w: 1.3, a: 0.7, rag: 2 }); commit("#22483a", 0.9);
  }
  // ================= HOUSE
  // walls: paper left mostly white; warm grey shadow under eave, porch recess, cool side wall
  begin(); hatch(TP([[wx0, wy0], [wx1, wy0], [wx1, wy0 + 16], [wx0, wy0 + 22]]), { ang: -0.8, sp: 2.2, w: 1.2, a: 0.6, rag: 2 }); hatch(TP(U.rect(wx0, wy0, Hs.porch.x1, wy1)), { ang: -0.8, sp: 2.6, w: 1.2, a: 0.55, rag: 2 }); commit("#b2a6a0", 0.8);
  begin(); hatch(TP([[wx1, 138], [398, 146], [398, 216], [wx1, 222]]), { ang: -1.0, sp: 2, w: 1.3, a: 0.75, rag: 1.5 }); commit("#a9a2c8", 0.9);
  begin(); hatch(TP([[wx1, 138], [398, 146], [398, 216], [wx1, 222]]), { ang: 0.5, sp: 3.2, w: 1.1, a: 0.5, rag: 1.5 }); commit("#8a83aa", 0.7);
  // plinth
  begin(); hatch(TP([[wx0, Hs.plinth], [wx1, Hs.plinth], [398, 205], [398, 216], [wx1, wy1], [wx0, wy1]]), { ang: -0.2, sp: 1.6, w: 1.4, a: 0.9, rag: 1 }); commit("#3f74b8", 1);
  // roof: orange base, red second layer, brown tile rows + shadow on hip side
  begin(); hatch(roofF, { ang: -0.95, sp: 1.9, w: 1.5, a: 0.85, rag: 1.5, zig: true }); hatch(roofS, { ang: -0.95, sp: 1.9, w: 1.5, a: 0.85, rag: 1.5 }); commit("#ef8a3c", 1);
  begin(); hatch(roofF, { ang: 0.5, sp: 3.2, w: 1.4, a: 0.6, rag: 2, fade: (v) => 0.85 }); hatch(roofS, { ang: 0.5, sp: 2, w: 1.4, a: 0.8, rag: 1.5 }); commit("#c93a2a", 0.9);
  begin(); for (let i = 1; i < 9; i++) { const yy = lerp(rf.eaveY, rf.ridgeY, i / 9) + 2; const xa = lerp(rf.ex0, rf.rx0, i / 9) + 3, xb = lerp(rf.ex1, rf.rx1, i / 9) - 3; const pts = []; for (let x = xa; x <= xb; x += 6) pts.push(T([x, yy + 2.2 * Math.abs(Math.sin((x - xa) / 12 * Math.PI))])); sk(pts, false, 1.1, 0.75); } hatch(roofS, { ang: -0.3, sp: 3, w: 1.2, a: 0.7, rag: 1 }); commit("#7a2e1d", 0.95);
  // chimney
  begin(); hatch(TP(U.rect(ch.x1 - 8, ch.top + 6, ch.x1, ch.base - 12)), { ang: -1, sp: 2, w: 1.2, a: 0.7, rag: 1 }); commit("#a9a2c8", 0.9);
  begin(); hatch(TP(U.rect(ch.x0, ch.top + 6, ch.x1, ch.top + 13)), { ang: 0, sp: 1.6, w: 1.3, a: 0.9, rag: 1 }); commit("#c93a2a", 1);
  begin(); hatch(TP(U.rect(ch.x0 - 4, ch.top, ch.x1 + 4, ch.top + 6)), { ang: 0, sp: 1.4, w: 1.3, a: 0.9, rag: 1 }); commit("#4a4248", 1);
  // windows
  for (const [x, y, w, h] of Hs.wins) {
    begin(); hatch(TP([[x, y], [x + w, y], [x + w, y + h], [x + 24, y + h], [x + 10, y + h * 0.5], [x, y + h * 0.66]]), { ang: -0.9, sp: 1.6, w: 1.4, a: 0.95, rag: 1 }); commit("#2c3f78", 1);
    begin(); for (const sx of [x - 15, x + w + 3]) hatch(TP(U.rect(sx, y - 1, sx + 12, y + h + 1)), { ang: 1.45, sp: 1.8, w: 1.3, a: 0.85, rag: 1 }); hatch(TP([[x - 8, y - 4], [x + w / 2, y - 16], [x + w + 8, y - 4]]), { ang: 0, sp: 1.8, w: 1.3, a: 0.85, rag: 1 }); commit("#4f86c6", 1);
    begin(); hatch(TP(U.rect(x - 5, y + h + 3, x + w + 5, y + h + 10)), { ang: 0.2, sp: 1.8, w: 1.3, a: 0.85, rag: 1 }); commit("#a0603c", 1);
    begin(); for (let k = 0; k < 6; k++) hatch(TP(ellipse(x + 3 + k * (w - 6) / 5, y + h - 1 + (k % 2) * 2, 3.4, 3, 10)), { ang: R.rr(-1, 1), sp: 1.3, w: 1.3, a: 1, rag: 0.5, zig: true }); commit("#e0342c", 1);
    begin(); hatch(TP(ellipse(x + w / 2, y + h + 2, w / 2 + 3, 3.6)), { ang: 1.2, sp: 1.6, w: 1.2, a: 0.8, rag: 1 }); commit("#3f7a3a", 0.9);
  }
  begin(); hatch(TP([[372, 160], [388, 163], [388, 186], [372, 184]]), { ang: -0.9, sp: 1.6, w: 1.3, a: 0.95, rag: 1 }); commit("#2c3f78", 1);
  // door, posts, steps, railings, peppers
  const [dx0, dy0, dx1, dy1] = Hs.porch.door;
  begin(); hatch(TP(U.rect(dx0, dy0, dx1, dy1)), { ang: 1.5, sp: 1.6, w: 1.4, a: 0.9, rag: 1 }); Hs.porch.posts.forEach((px) => hatch(TP(U.rect(px - 4, wy0 + 2, px + 4, wy1)), { ang: 1.5, sp: 1.5, w: 1.3, a: 0.9, rag: 1 })); commit("#8a5530", 1);
  begin(); hatch(TP(U.rect(dx0, dy0, dx1, dy0 + 30)), { ang: 0.6, sp: 2.4, w: 1.2, a: 0.7, rag: 1 }); commit("#4e2f1c", 0.8);
  begin(); hatch(TP(U.rect(68, 214, 122, 226)), { ang: 0, sp: 1.8, w: 1.3, a: 0.8, rag: 1 }); for (const [a, b] of [[58, 76], [114, 132]]) for (let xx = a + 2; xx < b; xx += 4.4) sk([T([xx, 188]), T([xx, 208])], false, 1.2, 0.8); commit("#b88454", 1);
  begin(); hatch(TP([[45, 148], [51, 148], [51, 188], [45, 188]]), { ang: 0.3, sp: 1.4, w: 1.4, a: 1, rag: 0.5 }); commit("#e0342c", 1);
  // flowers & bushes at the foot, sunflowers
  begin(); for (const [x, r] of [[16, 11], [32, 8], [162, 8], [176, 6], [346, 10], [362, 7]]) hatch(TP(ellipse(x, 220, r, r * 0.8)), { ang: 0.8, sp: 1.8, w: 1.3, a: 0.85, rag: 2, zig: true }); commit("#4f8f3c", 1);
  begin(); for (const [x, y] of [[12, 212], [26, 216], [36, 210], [160, 214], [174, 212], [342, 210], [356, 214], [366, 212]]) hatch(TP(ellipse(x, y, 2.6, 2.6, 10)), { ang: 0.4, sp: 1.2, w: 1.3, a: 1, rag: 0.5 }); commit("#e0342c", 1);
  for (const [x, h] of [[478, 76], [500, 58]]) {
    begin(); sk([T([x, 226]), T([x - 2, 226 - h])], false, 1.6, 0.9); hatch(TP([[x - 1, 226 - h * 0.5], [x + 14, 226 - h * 0.64], [x + 2, 226 - h * 0.4]]), { ang: 0.4, sp: 1.4, w: 1.2, a: 0.9 }); commit("#4f8f3c", 1);
    begin(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; sk([T([x - 2 + Math.cos(a) * 5, 226 - h + Math.sin(a) * 5]), T([x - 2 + Math.cos(a) * 13, 226 - h + Math.sin(a) * 13])], false, 2.4, 1); } commit("#f2b628", 1);
    begin(); hatch(TP(ellipse(x - 2, 226 - h, 5, 5, 12)), { ang: 0.7, sp: 1.2, w: 1.3, a: 1, rag: 0.5, zig: true }); commit("#5a3820", 1);
  }
  // smoke: soft grey scribble
  begin(); for (const [x, y, r] of [[268, -6, 8], [282, -24, 11], [302, -44, 14]]) hatch(TP(ellipse(x, y, r, r * 0.75, 16)), { ang: 0.3, sp: 3, w: 1.1, a: 0.5, rag: 3, zig: true }); commit("#9a98ad", 0.7);

  // ================= OUTLINE: dark sepia pencil, loose
  begin();
  const L = (a, b) => sk([T(a), T(b)]);
  L([rf.ex0 - 2, rf.eaveY + 1], [rf.rx0, rf.ridgeY]); L([rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY]); L([rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY]); L([rf.ex0 - 2, rf.eaveY + 1], [rf.ex1, rf.eaveY + 1]);
  L([rf.rx1, rf.ridgeY], [421, rf.eaveY + 13]); L([rf.ex1, rf.eaveY + 1], [421, rf.eaveY + 13]);
  L([wx0, rf.eaveY + 2], [wx0, wy1]); L([wx0, wy1], [wx1, wy1]); L([wx1, wy0], [wx1, wy1]); L([398, 146], [398, 216]); L([wx1, wy1], [398, 216]); L([wx0, Hs.plinth], [wx1, Hs.plinth]);
  L([ch.x0, 52], [ch.x0, ch.top + 6]); L([ch.x1, 52], [ch.x1, ch.top + 6]); sk(TP(U.rect(ch.x0 - 4, ch.top, ch.x1 + 4, ch.top + 6)), true, 1, 0.8);
  for (const [x, y, w, h] of Hs.wins) { sk(TP(U.rect(x - 2, y - 2, x + w + 2, y + h + 2)), true); L([x + w / 2, y], [x + w / 2, y + h]); L([x, y + h * 0.4], [x + w, y + h * 0.4]); for (const sx of [x - 15, x + w + 3]) { sk(TP(U.rect(sx, y - 1, sx + 12, y + h + 1)), true, 0.9, 0.7); for (let k = 1; k < 6; k++) L([sx + 2, y + k * h / 6], [sx + 10, y + k * h / 6 - 1]); } sk(TP([[x - 8, y - 4], [x + w / 2, y - 16], [x + w + 8, y - 4]]), true, 0.9, 0.7); }
  sk(TP(U.rect(dx0, dy0, dx1, dy1)), true); for (let k = 1; k < 4; k++) L([dx0 + (dx1 - dx0) * k / 4, dy0 + 2], [dx0 + (dx1 - dx0) * k / 4, dy1 - 2]);
  for (const px of Hs.porch.posts) { L([px - 4, wy0 + 4], [px - 4, wy1]); L([px + 4, wy0 + 4], [px + 4, wy1]); }
  for (const [a, b] of [[58, 76], [114, 132]]) L([a, 186], [b, 186]);
  sk(TP(U.rect(68, 214, 122, 220)), true, 0.9, 0.7); sk(TP(U.rect(62, 220, 128, 226)), true, 0.9, 0.7);

  commit("#3b2a22", 1);
  // signature-ish texture: faint graphite smudge in the shadow under the eave
  begin(); hatch(TP([[wx0, wy0], [wx1, wy0], [wx1, wy0 + 6], [wx0, wy0 + 6]]), { ang: 0, sp: 1.2, w: 1.4, a: 0.9, rag: 2 }); commit("#5a4a44", 0.8);

  const { g } = U.artCanvas(root); g.setTransform(1, 0, 0, 1, 0, 0);
  const im = g.createImageData(W, H), d = im.data;
  for (let i = 0; i < W * H; i++) { d[i * 4] = out[i * 3]; d[i * 4 + 1] = out[i * 3 + 1]; d[i * 4 + 2] = out[i * 3 + 2]; d[i * 4 + 3] = 255; }
  g.putImageData(im, 0, 0);
};
