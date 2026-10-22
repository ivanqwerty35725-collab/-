/* 3. Risograph: three inks (green, ochre, fluorescent pink) as separations -> halftone screens -> misregistered multiply on paper. */
window.STYLE = async function (root) {
  const { AW, AH, DPR, R, clamp, lerp, smooth, noise, fbm, hex, mulberry32 } = U;
  const W = AW * DPR, H = AH * DPR;
  const INKS = {
    g: { col: hex("#2D6A4F"), ang: 15, cell: 6.2, off: [1.6, -1.1], rot: 0.0025 },
    o: { col: hex("#E8A33A"), ang: 0, cell: 6.0, off: [0, 0], rot: 0 },
    p: { col: hex("#FF5AA8"), ang: 75, cell: 6.2, off: [-2.0, 1.4], rot: -0.002 },
  };
  const L = {}; for (const k in INKS) { const c = U.canvas(W, H), g = c.getContext("2d", { willReadFrequently: true }); g.fillStyle = "#000"; g.fillRect(0, 0, W, H); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.lineCap = "round"; g.lineJoin = "round"; L[k] = g; }
  const gray = (d) => { const v = Math.round(clamp(d, 0, 1) * 255); return `rgb(${v},${v},${v})`; };
  // fill a Path2D on all separations; spec: {g,o,p} each number or [d0,d1,x0,y0,x1,y1] linear gradient
  function F(p, spec, mode = "fill", lw = 1) {
    for (const k in L) {
      const g = L[k]; let d = spec[k] ?? 0, st;
      if (Array.isArray(d)) { const gr = g.createLinearGradient(d[2], d[3], d[4], d[5]); gr.addColorStop(0, gray(d[0])); gr.addColorStop(1, gray(d[1])); st = gr; } else st = gray(d);
      if (mode === "fill") { g.fillStyle = st; g.fill(p); } else { g.strokeStyle = st; g.lineWidth = lw; g.stroke(p); }
    }
  }
  // stroke only on the given inks (leaves others untouched) — for key lines
  function S(p, spec, lw) { for (const k in spec) { const g = L[k]; g.strokeStyle = gray(spec[k]); g.lineWidth = lw; g.stroke(p); } }
  function Fo(p, spec) { for (const k in spec) { const g = L[k]; g.fillStyle = gray(spec[k]); g.fill(p); } }
  const T = (fn) => { for (const k in L) { L[k].save(); fn(L[k]); } };
  const TR = () => { for (const k in L) L[k].restore(); };
  const P = (pts) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; };
  const rect = (x0, y0, x1, y1) => P(U.rect(x0, y0, x1, y1));
  const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; };
  R.seed(303);

  // ---------- separations ----------
  // sky: ochre gradient towards horizon, pale pink haze band
  F(rect(0, 0, AW, AH), { o: [0.0, 0.42, 0, 40, 0, 330], p: [0, 0.16, 0, 120, 0, 330] });
  // sun
  F(circ(214, 150, 92), { p: 0.95, o: 0.18 });
  // sun rays knocked as rings
  for (const r of [104, 116]) S((() => { const p = new Path2D(); p.arc(214, 150, r, 0, Math.PI * 2); return p; })(), { p: 0.55 }, 3);
  // mountains (Carpathian ridge)
  const ridge = (x) => 250 - 70 * Math.max(0, 1 - Math.abs(x - 610) / 210) - 46 * Math.max(0, 1 - Math.abs(x - 330) / 170) - 30 * Math.max(0, 1 - Math.abs(x - 90) / 140) - 6 * fbm(x * 0.03, 1, 3);
  const mpts = []; for (let x = -10; x <= AW + 10; x += 4) mpts.push([x, ridge(x)]); mpts.push([AW + 10, 400], [-10, 400]);
  F(P(mpts), { g: [0.62, 0.3, 0, 170, 0, 330], p: 0.2, o: [0.0, 0.3, 0, 200, 0, 330] });
  // snowy / lit facets: knock out green on left faces
  for (const [px, pw, ph] of [[610, 210, 70], [330, 170, 46]]) { const top = ridge(px); const facet = P([[px, top], [px - pw * 0.55, top + ph * 0.75 + 30], [px - pw * 0.2, top + ph * 0.6 + 10], [px - 8, top + 50]]); Fo(facet, { g: 0.25 }); }
  // forested hills
  const hill = (x) => 318 - 20 * Math.sin(x * 0.011 + 1.3) - 8 * Math.sin(x * 0.04);
  const hpts = []; for (let x = -10; x <= AW + 10; x += 4) hpts.push([x, hill(x)]); hpts.push([AW + 10, 420], [-10, 420]);
  F(P(hpts), { g: 0.78, o: 0.35, p: 0.08 });
  // rows of tiny spruces along the hill (green solid)
  for (let x = -4; x < AW; x += R.rr(7, 12)) { const y = hill(x) + R.rr(2, 16), h = R.rr(10, 18); Fo(P([[x, y - h], [x + h * 0.32, y], [x - h * 0.32, y]]), { g: 1, p: 0.25 }); }
  // meadow
  const gy = (x) => 384 + 4 * Math.sin(x * 0.012);
  const gpts = []; for (let x = -10; x <= AW + 10; x += 4) gpts.push([x, gy(x)]); gpts.push([AW + 10, AH + 10], [-10, AH + 10]);
  F(P(gpts), { g: [0.5, 0.75, 0, 384, 0, AH], o: [0.7, 0.55, 0, 384, 0, AH], p: 0 });
  // field furrow stripes
  for (let i = 0; i < 9; i++) { const y = 398 + i * 9 + i * i * 0.6; const p = new Path2D(); p.moveTo(-10, y); p.quadraticCurveTo(AW / 2, y + 6, AW + 10, y - 2); S(p, { g: 0.95 }, 1.2 + i * 0.25); }

  // ---------- house ----------
  const S0 = 1.24, OX = (AW - 410 * S0) / 2 + 4, OY = 386 - 226 * S0;
  T((g) => { g.translate(OX, OY); g.scale(S0, S0); });
  const Hs = U.HOUSE, [wx0, wy0, wx1, wy1] = Hs.wall, rf = Hs.roof;
  // big spruces behind right
  for (const [x, y, h, w] of [[404, 228, 168, 34], [436, 230, 128, 26], [-12, 230, 120, 24]]) {
    for (let i = 0; i < 4; i++) { const t = i / 4, yy = y - h + h * t * 0.85, ww = w * (0.35 + 0.65 * (t + 0.25)); F(P([[x, yy], [x + ww, yy + h * 0.32], [x - ww, yy + h * 0.32]]), { g: 1, o: 0.3, p: 0.15 }); }
    F(rect(x - 2.5, y - 8, x + 2.5, y), { g: 0.8, p: 0.6, o: 0.6 });
  }
  // shadow on ground
  Fo(P([[wx1, 224], [440, 226], [480, 238], [60, 238], [40, 226]]), { g: 0.95, p: 0.25 });
  // side wall
  F(P([[wx1, 138], [398, 146], [398, 216], [wx1, 222]]), { g: 0.22, p: [0.05, 0.25, 0, 140, 0, 220], o: 0.08 });
  F(P([[wx1, 208], [398, 205], [398, 216], [wx1, 222]]), { g: 1, p: 0.3 });
  F(P([[372, 160], [388, 163], [388, 186], [372, 184]]), { g: 1, p: 0.6 });
  // front wall (paper white) with ochre shading under eave
  F(rect(wx0, wy0, wx1, wy1), { o: [0.32, 0.0, 0, wy0, 0, wy0 + 34], p: [0.12, 0, 0, wy0, 0, wy0 + 26] });
  F(rect(wx0, wy0, Hs.porch.x1, wy1), { o: [0.45, 0.12, 0, wy0, 0, wy1], p: 0.12, g: 0.06 });
  F(rect(wx0, Hs.plinth, wx1, wy1), { g: 1, o: 0, p: 0 });
  // windows
  for (const [x, y, w, h] of Hs.wins) {
    const s = Hs.shutter;
    for (const sx of [x - s - 3, x + w + 3]) { F(rect(sx, y - 1, sx + s, y + h + 1), { g: 1, p: 0, o: 0.1 }); for (let k = 1; k < 7; k++) F(rect(sx + 2, y - 1 + k * (h + 2) / 7 - 0.7, sx + s - 2, y - 1 + k * (h + 2) / 7 + 0.7), { g: 0.35 }); }
    F(P([[x - 8, y - 4], [x + w / 2, y - 16], [x + w + 8, y - 4]]), { g: 1, p: 0.0 });
    F(circ(x + w / 2, y - 8, 2.2), { p: 1 });
    F(rect(x - 3, y - 3, x + w + 3, y + h + 3), {});
    F(rect(x, y, x + w, y + h), { g: 1, p: 0.85, o: 0 });
    F(P([[x + 5, y + h], [x + 18, y], [x + 25, y], [x + 12, y + h]]), { g: 0.55, p: 0.3 });
    F(rect(x + w / 2 - 1.5, y, x + w / 2 + 1.5, y + h), {}); F(rect(x, y + h * 0.4 - 1.5, x + w, y + h * 0.4 + 1.5), {});
    F(rect(x - 5, y + h + 3, x + w + 5, y + h + 10), { o: 1, p: 0.6, g: 0.2 });
    for (let k = 0; k < 7; k++) F(circ(x + 2 + k * (w - 4) / 6, y + h + 1, 3.8), { g: 1, o: 0.4 });
    for (let k = 0; k < 6; k++) F(circ(x + 5 + k * (w - 10) / 5, y + h - 2 + (k % 2) * 2, 3.2), { p: 1, o: 0.15 });
  }
  // door
  const [dx0, dy0, dx1, dy1] = Hs.porch.door;
  F(rect(dx0 - 3, dy0 - 3, dx1 + 3, dy1), {});
  F(rect(dx0, dy0, dx1, dy1), { o: 1, p: 0.55, g: 0.45 });
  for (let k = 1; k < 4; k++) S((() => { const p = new Path2D(); const x = dx0 + (dx1 - dx0) * k / 4; p.moveTo(x, dy0 + 2); p.lineTo(x, dy1); return p; })(), { g: 1 }, 1.2);
  F(circ(dx1 - 6, (dy0 + dy1) / 2, 2), { o: 0.2, p: 0, g: 0 });
  // steps
  F(rect(70, 214, 120, 220), { o: 0.8, p: 0.3, g: 0.2 }); F(rect(64, 220, 126, 226), { o: 0.8, p: 0.4, g: 0.45 });
  // railings + posts
  for (const [a, b] of [[58, 76], [114, 132]]) { F(rect(a, 186, b, 189), { o: 1, g: 0.6, p: 0.3 }); for (let x = a + 2; x < b - 1; x += 4.2) F(rect(x, 189, x + 2, 208), { o: 1, g: 0.5, p: 0.2 }); }
  for (const px of Hs.porch.posts) {
    F(rect(px - 4, 136, px + 4, 222), { o: 1, g: 0.55, p: 0.35 }); F(rect(px - 4, 136, px - 1.5, 222), { o: 1, g: 0.2, p: 0.15 });
    const dir = px < 90 ? 1 : -1, p = new Path2D(); p.arc(px + dir * 15, 136, 15, dir > 0 ? Math.PI * 0.5 : 0, dir > 0 ? Math.PI : Math.PI * 0.5); S(p, { o: 1, g: 0.55, p: 0.35 }, 3.5);
  }
  for (let k = 0; k < 8; k++) F(P([[47, 150 + k * 4.6], [52, 150 + k * 4.6], [49.5, 156 + k * 4.6]]), { p: 1, o: 1 });
  // roof: pink+ochre overprint = red; hip side darker with green
  const roofF = P([[rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY]]);
  const roofS = P([[rf.ex1, rf.eaveY], [rf.rx1, rf.ridgeY], [418, rf.eaveY + 12]]);
  F(roofS, { p: 1, o: 1, g: 0.55 });
  F(roofF, { p: [0.72, 1, 40, 0, 360, 0], o: [1, 0.85, 40, 0, 360, 0], g: [0, 0.18, 40, 0, 380, 0] });
  T((g) => g.clip(roofF));
  const rows = 8;
  for (let i = 1; i <= rows; i++) {
    const y = lerp(rf.eaveY, rf.ridgeY, (i - 1) / rows) - 1, tw = 13, sc = new Path2D(); sc.moveTo(0, y);
    for (let x = (i % 2) * 6.5 - 13; x < 420; x += tw) sc.quadraticCurveTo(x + tw / 2, y + 5, x + tw, y);
    S(sc, { g: 0.9 }, 1.6);
  }
  // highlight streak on left hip (knock ochre down, pink left -> rosy)
  Fo(P([[rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY], [rf.rx0 + 12, rf.ridgeY], [rf.ex0 + 16, rf.eaveY]]), { o: 0.55, g: 0 });
  TR();
  F(rect(rf.rx0 - 4, rf.ridgeY - 4, rf.rx1 + 4, rf.ridgeY + 3), { p: 1, o: 1, g: 0.8 });
  F(rect(rf.ex0 - 4, rf.eaveY - 2, rf.ex1 + 4, rf.eaveY + 4), { g: 1, p: 0.8, o: 0.6 });
  for (let x = rf.ex0 + 2; x < rf.ex1; x += 8) { const p = new Path2D(); p.arc(x + 4, rf.eaveY + 4, 3, 0, Math.PI); F(p, { g: 1, p: 0.8, o: 0.6 }); }
  // chimney
  const ch = Hs.chim;
  F(rect(ch.x0, ch.top + 6, ch.x1, ch.base), { o: [0, 0.2, 0, ch.top, 0, ch.base], p: 0.06 });
  F(rect(ch.x1 - 7, ch.top + 6, ch.x1, ch.base), { g: 0.22, p: 0.15, o: 0.1 });
  F(rect(ch.x0, ch.top + 6, ch.x1, ch.top + 13), { p: 1, o: 1, g: 0.2 });
  F(rect(ch.x0 - 4, ch.top, ch.x1 + 4, ch.top + 6), { g: 1, p: 1, o: 0.3 });
  // smoke: pink halftone puffs
  [[262, -12, 10], [278, -30, 13], [300, -46, 16]].forEach(([x, y, r], i) => F(circ(x, y, r), { p: 0.25 - i * 0.05, o: 0.05 }));
  // flowers at the foot + sunflowers
  for (let i = 0; i < 26; i++) { const x = R.pick([R.rr(8, 38), R.rr(150, 182), R.rr(336, 360)]), y = R.rr(214, 226); F(circ(x, y, R.rr(3, 5)), { g: 1, o: 0.5 }); }
  for (let i = 0; i < 12; i++) { const x = R.pick([R.rr(8, 38), R.rr(150, 182), R.rr(336, 360)]), y = R.rr(210, 224); F(circ(x, y, 2.4), { p: 1 }); }
  for (const [x, h] of [[456, 74], [478, 56]]) { F(rect(x - 1.5, 226 - h, x + 1.5, 226), { g: 1 }); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, p = new Path2D(); p.ellipse(x + Math.cos(a) * 8, 226 - h + Math.sin(a) * 8, 5, 2.4, a, 0, 7); F(p, { o: 1, p: 0.12 }); } F(circ(x, 226 - h, 5.5), { g: 1, p: 1, o: 0.8 }); }
  TR();
  // path from the steps
  F(P([[OX + 66 * S0, 386], [OX + 124 * S0, 386], [OX + 170 * S0, AH + 2], [OX + 24 * S0, AH + 2]]), { o: 0.3, p: 0.1, g: 0.12 });

  // ---------- halftone + print ----------
  const out = U.canvas(W, H), og = out.getContext("2d");
  const img = og.createImageData(W, H), od = img.data, rp = mulberry32(31);
  // paper
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4, v = 0.965 + 0.02 * fbm(x * 0.01, y * 0.01, 2) + (rp() - 0.5) * 0.035; od[k] = 248 * v; od[k + 1] = 242 * v; od[k + 2] = 228 * v; od[k + 3] = 255; }
  for (const k in INKS) {
    const ink = INKS[k], src = L[k].getImageData(0, 0, W, H).data;
    const th = (ink.ang * Math.PI) / 180, ca = Math.cos(th), sa = Math.sin(th), cell = ink.cell;
    const [ox, oy] = [ink.off[0] * DPR, ink.off[1] * DPR], cr = Math.cos(ink.rot), sr = Math.sin(ink.rot);
    const ic = ink.col, rn = mulberry32(k.charCodeAt(0) * 7);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      // misregistration: sample separation at shifted / slightly rotated position
      const cx = x - W / 2, cy = y - H / 2;
      const sx = Math.round(cr * cx + sr * cy + W / 2 - ox), sy = Math.round(-sr * cx + cr * cy + H / 2 - oy);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      let d = src[(sy * W + sx) * 4] / 255; if (d <= 0.01) continue;
      // screen
      const u = (ca * x + sa * y) / cell, v = (-sa * x + ca * y) / cell;
      const fu = u - Math.floor(u) - 0.5, fv = v - Math.floor(v) - 0.5;
      const t = (fu * fu + fv * fv) * 2; // 0 centre .. 1 corner
      let a = d >= 0.97 ? 1 : smooth(t - 0.09, t + 0.09, d * 1.04);
      // ink texture: uneven drum coverage, speckle voids, faint banding
      const n = fbm(x * 0.012 + ink.ang, y * 0.012, 3);
      a *= 0.86 + 0.12 * n + 0.04 * Math.sin(y * 0.05 + ink.ang);
      if (noise(x * 0.35 + ink.ang, y * 0.35) > 0.62) a *= 0.35;
      if (rn() < 0.012) a *= 0.4;
      a = clamp(a * 0.95, 0, 1);
      const o = (y * W + x) * 4;
      od[o] *= 1 - a * (1 - ic[0] / 255); od[o + 1] *= 1 - a * (1 - ic[1] / 255); od[o + 2] *= 1 - a * (1 - ic[2] / 255);
    }
  }
  // stray ink dust
  for (let i = 0; i < 900; i++) { const x = Math.floor(rp() * W), y = Math.floor(rp() * H), ic = INKS[["g", "p", "o"][i % 3]].col; const r = rp() < 0.9 ? 1 : 2; for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const X = x + xx, Y = y + yy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const o = (Y * W + X) * 4; for (let c = 0; c < 3; c++) od[o + c] *= 1 - 0.5 * (1 - ic[c] / 255); } }
  og.putImageData(img, 0, 0);
  const { c, g } = U.artCanvas(root); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(out, 0, 0);
};
