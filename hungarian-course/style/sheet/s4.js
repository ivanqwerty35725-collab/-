/* 4. Linocut / Carpathian folk carving: one black block carved with gouge cuts, printed on cream paper. */
window.STYLE = async function (root) {
  const { AW, AH, DPR, R, clamp, lerp, smooth, noise, fbm, hex, mulberry32 } = U;
  const W = AW * DPR, H = AH * DPR;
  R.seed(404);
  const B = U.canvas(W, H), g = B.getContext("2d", { willReadFrequently: true });
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.lineCap = "round"; g.lineJoin = "round";
  const P = (pts) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; };
  const circ = (x, y, r) => { const p = new Path2D(); p.arc(x, y, r, 0, Math.PI * 2); return p; };
  const INK = () => { g.globalCompositeOperation = "source-over"; g.fillStyle = "#000"; g.strokeStyle = "#000"; };
  const CUT = () => { g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000"; g.strokeStyle = "#000"; };
  const fill = (p) => g.fill(p);
  // gouge cut: tapered, slightly curved sliver; w = max width
  function gouge(x0, y0, x1, y1, w, bend = 0, endBlunt = 0.25) {
    const mx = (x0 + x1) / 2 + bend * (y1 - y0), my = (y0 + y1) / 2 - bend * (x1 - x0);
    const n = 10, Lp = [], Rp = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, it = 1 - t;
      const px = it * it * x0 + 2 * it * t * mx + t * t * x1, py = it * it * y0 + 2 * it * t * my + t * t * y1;
      const dx = 2 * it * (mx - x0) + 2 * t * (x1 - mx), dy = 2 * it * (my - y0) + 2 * t * (y1 - my), dl = Math.hypot(dx, dy) || 1;
      const ww = (w / 2) * Math.pow(Math.sin(Math.PI * clamp(t * (1 - endBlunt) + endBlunt * 0.5 * (t > 0.5 ? 1 : 0) + 0.0001, 0, 1)), 0.6) * (0.85 + 0.3 * noise(px * 0.3, py * 0.3));
      Lp.push([px - dy / dl * ww, py + dx / dl * ww]); Rp.push([px + dy / dl * ww, py - dx / dl * ww]);
    }
    g.beginPath(); g.moveTo(Lp[0][0], Lp[0][1]); for (const p of Lp) g.lineTo(p[0], p[1]); for (let i = Rp.length - 1; i >= 0; i--) g.lineTo(Rp[i][0], Rp[i][1]); g.closePath(); g.fill();
  }
  // wobbly closed shape helper
  const rough = (pts, a = 1.2, f = 0.08) => P(U.rough(pts, a, f, true, R.rr(0, 50), 2.5));

  // ===== block: full ink, then carve
  INK(); g.fillRect(0, 0, AW, AH);
  const FR = 26; // frame width
  // -- frame: chip-carved "wolf teeth" triangles + inner line
  CUT();
  g.lineWidth = 2.2; g.strokeRect(FR - 6, FR - 6, AW - 2 * FR + 12, AH - 2 * FR + 12);
  const teeth = (x0, y0, x1, y1, inward) => { const L = Math.hypot(x1 - x0, y1 - y0), n = Math.round(L / 15), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy * inward, ny = ux * inward; for (let i = 0; i < n; i++) { const a = (i / n) * L, b = ((i + 1) / n) * L, m = (a + b) / 2; fill(rough([[x0 + ux * a + nx * 5, y0 + uy * a + ny * 5], [x0 + ux * b + nx * 5, y0 + uy * b + ny * 5], [x0 + ux * m + nx * 15, y0 + uy * m + ny * 15]], 0.5)); } };
  teeth(6, 6, AW - 6, 6, 1); teeth(AW - 6, AH - 6, 6, AH - 6, 1); teeth(6, AH - 6, 6, 6, 1); teeth(AW - 6, 6, AW - 6, AH - 6, 1);
  // corner rosettes in frame (small carved dots)
  for (const [x, y] of [[13, 13], [AW - 13, 13], [13, AH - 13], [AW - 13, AH - 13]]) fill(circ(x, y, 4));

  const X0 = FR, Y0 = FR, X1 = AW - FR, Y1 = AH - FR;
  g.save(); g.beginPath(); g.rect(X0, Y0, X1 - X0, Y1 - Y0); g.clip();
  // -- sky: cleared to paper, leaving the gouge ridges as tapered ink lines (dense at the top, thinning out)
  CUT(); g.fillRect(X0, Y0, X1 - X0, 330 - Y0);
  INK();
  const SX = 628, SY = 104, SR = 46;
  for (let y = Y0 + 6; y < 250; y += lerp(5.5, 15, (y - Y0) / 220)) {
    let x = X0 + R.rr(-40, 0);
    while (x < X1) {
      const len = R.rr(30, 120), w = lerp(2.6, 1.0, (y - Y0) / 220) * R.rr(0.6, 1.1);
      const xm = x + len / 2; const dS = Math.hypot(xm - SX, y - SY);
      if (dS > SR + 30 && R.r() > (y - Y0) / 260) gouge(x, y + R.rr(-0.8, 0.8), x + len, y + R.rr(-1, 1), w, R.rr(-0.02, 0.02));
      x += len + R.rr(6, 30);
    }
  }
  // sun: Carpathian six-petal rosette, rays as ink wedges
  g.lineWidth = 3.2; g.beginPath(); g.arc(SX, SY, SR, 0, 7); g.stroke();
  g.lineWidth = 1.6; g.beginPath(); g.arc(SX, SY, SR + 6, 0, 7); g.stroke();
  const pr = SR * 0.8;
  g.lineWidth = 2.4; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; g.beginPath(); g.arc(SX + Math.cos(a) * pr * 0.5, SY + Math.sin(a) * pr * 0.5, pr * 0.5, 0, 7); g.stroke(); }
  g.lineWidth = 2.2; g.beginPath(); g.arc(SX, SY, pr, 0, 7); g.stroke();
  fill(circ(SX, SY, 3.5));
  for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; g.beginPath(); g.moveTo(SX + Math.cos(a) * (pr + 1), SY + Math.sin(a) * (pr + 1)); g.lineTo(SX + Math.cos(a + 0.157) * (SR - 1), SY + Math.sin(a + 0.157) * (SR - 1)); g.lineTo(SX + Math.cos(a + 0.314) * (pr + 1), SY + Math.sin(a + 0.314) * (pr + 1)); g.closePath(); g.fill(); }
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + 0.1, r0 = SR + 12, r1 = SR + (i % 2 ? 26 : 40); const p0 = [SX + Math.cos(a - 0.06) * r0, SY + Math.sin(a - 0.06) * r0], p1 = [SX + Math.cos(a + 0.06) * r0, SY + Math.sin(a + 0.06) * r0], p2 = [SX + Math.cos(a) * r1, SY + Math.sin(a) * r1]; fill(rough([p0, p1, p2], 0.4)); }
  // smoke: three ink curls
  function curl(x, y, r) { g.lineWidth = 2.2; g.beginPath(); for (let t = 0; t <= 1.0; t += 0.02) { const a = t * Math.PI * 3.2, rr_ = r * (1 - t * 0.75); const px = x + Math.cos(a) * rr_, py = y + Math.sin(a) * rr_; t === 0 ? g.moveTo(px, py) : g.lineTo(px, py); } g.stroke(); }
  // -- mountains: solid ink silhouettes, outline cut, hatched lit faces
  const ridge = (x) => 236 - 92 * Math.max(0, 1 - Math.abs(x - 210) / 190) - 60 * Math.max(0, 1 - Math.abs(x - 470) / 150) - 40 * Math.max(0, 1 - Math.abs(x - 700) / 150) - 5 * fbm(x * 0.04, 2, 2);
  INK(); { const pts = []; for (let x = X0; x <= X1; x += 3) pts.push([x, ridge(x)]); pts.push([X1, 330], [X0, 330]); fill(P(pts)); }
  CUT();
  // lit (left) faces: diagonal gouges following slope
  for (const [px, pw, ph] of [[210, 190, 92], [470, 150, 60], [700, 150, 40]]) {
    const top = ridge(px);
    for (let k = 0; k < 18; k++) { const t = k / 18, x = px - pw * 0.9 * t - 4, y = ridge(x) + 4; const len = (ph * 0.9 + 20) * (1 - t * 0.6); gouge(x, y + 2, x + len * 0.28, y + len * 0.95, lerp(3, 1.6, t), 0.04); }
  }
  // -- forested hill band with carved spruces
  const hill = (x) => 300 - 14 * Math.sin(x * 0.014 + 0.6) - 6 * Math.sin(x * 0.05);
  INK(); { const pts = []; for (let x = X0; x <= X1; x += 3) pts.push([x, hill(x)]); pts.push([X1, AH], [X0, AH]); fill(P(pts)); }
  CUT();
  function carvedSpruce(x, y, h, w) {
    // trunk line + chevron branches cut in white (folk style)
    g.lineWidth = 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke();
    const n = Math.round(h / 6);
    for (let i = 1; i < n; i++) { const t = i / n, yy = y - h + t * h, ww = w * t; gouge(x, yy - 3, x - ww, yy + ww * 0.5, 2.8, 0.08, 0.6); gouge(x, yy - 3, x + ww, yy + ww * 0.5, 2.8, -0.08, 0.6); }
  }
  for (let x = X0 + 10; x < X1; x += R.rr(22, 30)) { const y = hill(x) + R.rr(16, 22); carvedSpruce(x, y, R.rr(30, 40), R.rr(9, 12)); }
  for (let x = X0 + 22; x < X1; x += R.rr(26, 36)) { const y = hill(x) + R.rr(44, 52); carvedSpruce(x, y, R.rr(26, 32), R.rr(8, 10)); }
  for (let y = 330; y < 380; y += 7) for (let x = X0; x < X1; x += R.rr(60, 120)) if (R.r() < 0.3) gouge(x, y, x + R.rr(20, 50), y + R.rr(-1, 1), 1.4);

  // -- ground band with grass V-cuts
  const gy = (x) => 384 + 3 * Math.sin(x * 0.02);
  CUT(); g.lineWidth = 2.2; g.beginPath(); for (let x = X0; x <= X1; x += 3) { const y = gy(x); x === X0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  for (let i = 0; i < 260; i++) { const x = R.rr(X0, X1), y = R.rr(392, Y1 - 4); const h = lerp(5, 11, (y - 390) / 60); gouge(x, y, x - h * 0.35, y - h, 2.2, 0.05, 0.5); gouge(x + 1, y, x + h * 0.35, y - h * 0.9, 2.2, -0.05, 0.5); }

  // ===== house
  const S0 = 1.2, OX = (AW - 410 * S0) / 2 - 6, OY = 386 - 226 * S0;
  g.save(); g.translate(OX, OY); g.scale(S0, S0);
  const Hs = U.HOUSE, [wx0, wy0, wx1, wy1] = Hs.wall, rf = Hs.roof;
  // knock house silhouette back to ink first (so sky cuts don't show through)
  INK(); fill(P([[rf.ex0 - 6, rf.eaveY + 4], [rf.rx0 - 4, rf.ridgeY - 6], [rf.rx1 + 4, rf.ridgeY - 6], [420, rf.eaveY + 14], [404, 228], [wx0 - 4, 228]]));
  g.fillRect(Hs.chim.x0 - 6, Hs.chim.top - 4, Hs.chim.x1 - Hs.chim.x0 + 12, 70);
  // walls carved white
  CUT();
  fill(rough(U.rect(Hs.porch.x1 + 2, wy0 + 6, wx1, Hs.plinth - 3), 0.8));
  fill(rough([[wx1 + 3, 144], [396, 151], [396, 205], [wx1 + 3, 207]], 0.8));
  // porch back wall: hatched (dense cuts -> grey value)
  for (let y = wy0 + 8; y < Hs.plinth - 2; y += 3.4) gouge(wx0 + 2, y, Hs.porch.x1, y + R.rr(-0.5, 0.5), 1.9, 0, 0.8);
  // side wall: vertical hatch leaves it in half-tone shadow
  INK(); for (let x = wx1 + 6; x < 396; x += 4.2) { g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 146 + (x - wx1) * 0.2); g.lineTo(x + R.rr(-0.5, 0.5), 206); g.stroke(); }
  // lime wall texture: sparse chatter marks left in the cut
  for (let i = 0; i < 26; i++) { const x = R.rr(wx0 + 115, wx1 - 8), y = R.rr(wy0 + 12, Hs.plinth - 8); if (Hs.wins.some(([a, b, w, h]) => x > a - 18 && x < a + w + 18 && y > b - 18 && y < b + h + 14)) continue; gouge(x, y, x + R.rr(5, 12), y + R.rr(-0.5, 0.5), 1.4); }
  // eave shadow line
  g.fillRect(wx0, wy0, wx1 - wx0, 5);
  // plinth band carved with zigzag
  CUT(); g.lineWidth = 1.8; g.beginPath(); for (let x = Hs.porch.x1 + 2, i = 0; x <= wx1; x += 6, i++) { const y = Hs.plinth + 3 + (i % 2 ? 7 : 0); i === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  // windows: ink glass, carved frame & cross, shutters with diagonal cuts, pediment with notches
  for (const [x, y, w, h] of Hs.wins) {
    INK();
    g.lineWidth = 2.2; g.strokeRect(x - 3, y - 3, w + 6, h + 6);
    fill(rough(U.rect(x, y, x + w, y + h), 0.4));
    for (const sx of [x - 15, x + w + 4]) fill(rough(U.rect(sx, y - 2, sx + 11, y + h + 2), 0.4));
    fill(rough([[x - 12, y - 6], [x + w / 2, y - 18], [x + w + 12, y - 6]], 0.4));
    fill(rough(U.rect(x - 8, y + h + 4, x + w + 8, y + h + 12), 0.4));
    CUT();
    g.lineWidth = 2.4; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.4); g.lineTo(x + w, y + h * 0.4); g.stroke();
    gouge(x + 5, y + h - 4, x + 14, y + 5, 2.6); gouge(x + w / 2 + 5, y + h - 5, x + w / 2 + 11, y + h * 0.4 + 5, 2);
    for (const sx of [x - 15, x + w + 4]) for (let k = 0; k < 7; k++) gouge(sx + 2, y + 3 + k * 6.4, sx + 9, y + 1 + k * 6.4, 2.2);
    for (let k = 0; k < 6; k++) { const t = (k + 0.5) / 6, px = lerp(x - 4, x + w + 4, t); fill(P([[px - 2.4, y - 7.5], [px + 2.4, y - 7.5], [px, y - 12]])); }
    fill(circ(x + w / 2, y - 13, 1.8));
    for (let k = 0; k < 6; k++) { const cx = x - 3 + k * (w + 6) / 5; fill(circ(cx, y + h + 8, 2.4)); }
    INK(); for (let k = 0; k < 6; k++) { const cx = x - 3 + k * (w + 6) / 5; fill(circ(cx, y + h + 8, 0.9)); }
  }
  // porch: posts (ink) with carved notch rings, door ink with plank cuts + rhombus, railings
  INK();
  for (const px of Hs.porch.posts) { fill(rough(U.rect(px - 4.5, wy0 + 2, px + 4.5, 222), 0.5)); }
  const [dx0, dy0, dx1, dy1] = Hs.porch.door;
  fill(rough(U.rect(dx0 - 4, dy0 - 5, dx1 + 4, dy1 + 2), 0.5));
  CUT();
  for (const px of Hs.porch.posts) for (const yy of [150, 168, 196, 212]) { fill(P([[px - 4, yy], [px, yy - 3], [px + 4, yy], [px, yy + 3]])); }
  for (const px of Hs.porch.posts) { const dir = px < 90 ? 1 : -1; g.lineWidth = 2; g.beginPath(); g.arc(px + dir * 14, wy0 + 2, 11, dir > 0 ? Math.PI * 0.5 : 0, dir > 0 ? Math.PI : Math.PI * 0.5); g.stroke(); }
  g.lineWidth = 1.6; g.strokeRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
  for (let k = 1; k < 4; k++) gouge(dx0 + (dx1 - dx0) * k / 4, dy0 + 4, dx0 + (dx1 - dx0) * k / 4, dy1 - 3, 1.6, 0, 0.7);
  fill(P([[dx0 + 17, dy0 + 22], [dx0 + 25, dy0 + 32], [dx0 + 17, dy0 + 42], [dx0 + 9, dy0 + 32]]));
  INK(); fill(P([[dx0 + 17, dy0 + 27], [dx0 + 21, dy0 + 32], [dx0 + 17, dy0 + 37], [dx0 + 13, dy0 + 32]]));
  CUT(); fill(circ(dx1 - 6, dy0 + 48, 1.8));
  for (const [a, b] of [[60, 74], [116, 130]]) { g.lineWidth = 1.8; g.beginPath(); g.moveTo(a, 186); g.lineTo(b, 186); g.stroke(); for (let x = a + 1; x <= b; x += 4.5) gouge(x, 189, x, 206, 2.2, 0, 0.6); }
  // steps
  g.lineWidth = 2; g.beginPath(); g.moveTo(68, 218); g.lineTo(122, 218); g.moveTo(62, 224); g.lineTo(128, 224); g.stroke();
  // roof: ink, carved tile scallops row by row, zigzag eave, ridge line
  const rows = 8;
  g.save(); g.clip(P([[rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY]]));
  for (let i = 0; i < rows; i++) {
    const y = lerp(rf.eaveY - 6, rf.ridgeY + 2, i / (rows - 0.6)), tw = 13;
    for (let x = (i % 2) * 6.5 - 13; x < 420; x += tw) { g.lineWidth = lerp(2.4, 1.6, i / rows); g.beginPath(); g.moveTo(x + 1, y - 3); g.quadraticCurveTo(x + tw / 2, y + 6, x + tw - 1, y - 3); g.stroke(); }
  }
  // light along left hip: extra cuts
  for (let k = 0; k < 9; k++) { const t = k / 9; gouge(lerp(rf.ex0, rf.rx0, t) + 8, lerp(rf.eaveY, rf.ridgeY, t) + 2, lerp(rf.ex0, rf.rx0, t) + 18, lerp(rf.eaveY, rf.ridgeY, t) + 6, 1.8); }
  g.restore();
  // hip side: dense diagonal lines (darker)
  g.save(); g.clip(P([[rf.ex1, rf.eaveY], [rf.rx1, rf.ridgeY], [420, rf.eaveY + 12]]));
  for (let k = 0; k < 14; k++) { const y = rf.eaveY + 10 - k * 8; g.lineWidth = 1.2; g.beginPath(); g.moveTo(rf.rx1 + k * 0, y - 20); g.lineTo(440, y + 6); g.stroke(); }
  g.restore();
  g.lineWidth = 2.2; g.beginPath(); g.moveTo(rf.ex0, rf.eaveY); g.lineTo(rf.rx0, rf.ridgeY); g.lineTo(rf.rx1, rf.ridgeY); g.lineTo(rf.ex1, rf.eaveY); g.moveTo(rf.ex1, rf.eaveY); g.lineTo(420, rf.eaveY + 12); g.stroke();
  // eave: carved zigzag fascia
  g.lineWidth = 1.8; g.beginPath(); for (let x = rf.ex0, i = 0; x <= rf.ex1; x += 5, i++) { const y = rf.eaveY + 1 + (i % 2 ? 4 : 0); i === 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  // chimney: carved body with ink brick joints, smoke as carved spiral
  const ch = Hs.chim;
  fill(rough(U.rect(ch.x0, ch.top + 7, ch.x1, ch.base), 0.6));
  INK(); for (let y = ch.top + 14; y < ch.base; y += 6) { g.lineWidth = 1.2; g.beginPath(); g.moveTo(ch.x0, y); g.lineTo(ch.x1, y); g.stroke(); const off = ((y - ch.top) / 6) % 2 ? 6 : 12; g.beginPath(); g.moveTo(ch.x0 + off, y); g.lineTo(ch.x0 + off, y + 6); g.stroke(); }
  fill(rough(U.rect(ch.x1 - 6, ch.top + 7, ch.x1, ch.base), 0.4));
  fill(U.rect && rough(U.rect(ch.x0 - 4, ch.top, ch.x1 + 4, ch.top + 7), 0.5));
  INK(); curl(262, -8, 7); curl(276, -26, 10); curl(296, -48, 13);
  g.restore(); // end house transform
  // path: carved white wedge from the steps with ink stones
  const sx0 = OX + 64 * S0, sx1 = OX + 126 * S0;
  CUT(); fill(rough([[sx0 + 2, 388], [sx1 - 2, 388], [sx1 + 46, Y1 + 2], [sx0 - 46, Y1 + 2]], 1.4));
  INK(); for (let i = 0; i < 18; i++) { const t = R.r(), y = lerp(392, Y1 - 4, t), x = lerp((sx0 + sx1) / 2, (sx0 + sx1) / 2, t) + R.rr(-1, 1) * lerp(24, 70, t); g.beginPath(); g.ellipse(x, y, lerp(3, 7, t), lerp(1.5, 3, t), 0, 0, 7); g.fill(); }
  // folk tulips in the bottom corners (carved white)
  CUT();
  function tulip(x, y, s, flip) {
    g.save(); g.translate(x, y); g.scale(s * flip, s);
    g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(4, -22, 0, -44); g.stroke();
    fill(P([[0, -14], [-18, -30], [-24, -22], [-10, -16]])); fill(P([[2, -24], [18, -40], [22, -30], [8, -24]]));
    fill(P([[-12, -64], [-6, -48], [0, -44], [6, -48], [12, -64], [6, -56], [0, -66], [-6, -56]]));
    g.restore();
  }
  tulip(X0 + 40, Y1 - 6, 1, 1); tulip(X0 + 70, Y1 - 4, 0.75, -1); tulip(X1 - 46, Y1 - 6, 1, -1); tulip(X1 - 76, Y1 - 4, 0.75, 1);
  g.restore(); // end inner clip

  // ===== print: roughen edges, ink starvation, paper
  const rough2 = U.canvas(W, H), rg = rough2.getContext("2d", { willReadFrequently: true });
  rg.filter = "url(#lino)"; rg.drawImage(B, 0, 0); rg.filter = "none";
  const bd = rg.getImageData(0, 0, W, H).data;
  const out = U.canvas(W, H), og = out.getContext("2d"), im = og.createImageData(W, H), d = im.data, rn = mulberry32(44);
  const paper = hex("#efe5cf"), ink = hex("#1c1714");
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = (y * W + x) * 4;
    let a = bd[k + 3] / 255;
    // ink texture: mottled coverage + paper tooth showing through
    const n1 = fbm(x * 0.02, y * 0.02, 3), tooth = noise(x * 0.55, y * 0.55);
    a *= 0.93 + 0.07 * n1; if (tooth > 0.68 + 0.2 * n1) a *= 0.35; if (rn() < 0.004) a *= 0.5;
    // stray ink on paper (block not fully cleared)
    if (a < 0.05 && fbm(x * 0.008 + 9, y * 0.008, 3) > 0.5 && noise(x * 0.4, y * 0.4) > 0.45) a = 0.22;
    const pv = 0.97 + 0.03 * fbm(x * 0.003, y * 0.003, 2) + (rn() - 0.5) * 0.03;
    for (let c = 0; c < 3; c++) d[k + c] = lerp(paper[c] * pv, ink[c], a);
    d[k + 3] = 255;
  }
  og.putImageData(im, 0, 0);
  const { g: fg } = U.artCanvas(root); fg.setTransform(1, 0, 0, 1, 0, 0); fg.fillStyle = "#efe5cf"; fg.fillRect(0, 0, W, H); fg.drawImage(out, 0, 0);
};
