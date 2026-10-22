/* 5. Ink line + accent colour: one live line weight with slight wobble and overshoots, two flat fills slightly off-register. */
window.STYLE = async function (root) {
  const { AW, AH, DPR, R, clamp, lerp, noise, fbm, hex, rgba, mulberry32 } = U;
  const W = AW * DPR, H = AH * DPR;
  const { c, g } = U.artCanvas(root);
  R.seed(505);
  // paper
  const INKC = "#201c19", RED = "#e0673f", BLUE = "#86aed3";
  const FL = U.layer(), fg = FL.g; // fills layer (multiplied later)
  let S = 1, LW = 2.1;
  let ox = 0, oy = 0; const tf = (p) => [ox + p[0] * S, oy + p[1] * S];
  let wseed = 0;
  // live line: wobble perpendicular to direction, constant width
  function line(pts, closed = false, wob = 0.55) {
    const ps = U.resample(pts.map(tf), 3, closed); if (closed) ps.push(ps[0].slice());
    const sd = (wseed += 7.3);
    g.beginPath();
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i], q = ps[Math.min(ps.length - 1, i + 1)], o = ps[Math.max(0, i - 1)];
      let tx = q[0] - o[0], ty = q[1] - o[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const n = wob * (noise(i * 0.09 + sd, sd) + 0.35 * noise(i * 0.4 + sd, 3));
      const x = p[0] - ty * n, y = p[1] + tx * n; i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.strokeStyle = INKC; g.lineWidth = LW; g.lineCap = "round"; g.lineJoin = "round"; g.stroke();
  }
  // straight stroke with occasional overshoot past the corners
  function seg(x0, y0, x1, y1, ov = 1) {
    const L = Math.hypot(x1 - x0, y1 - y0) || 1, ux = (x1 - x0) / L, uy = (y1 - y0) / L;
    const a = R.r() < 0.5 ? R.rr(0, 3) * ov : R.rr(-1, 0.5), b = R.r() < 0.5 ? R.rr(0, 3.5) * ov : R.rr(-1, 0.5);
    line([[x0 - ux * a, y0 - uy * a], [x1 + ux * b, y1 + uy * b]]);
  }
  function box(x0, y0, x1, y1, ov = 1) { seg(x0, y0, x1, y0, ov); seg(x1, y0, x1, y1, ov); seg(x1, y1, x0, y1, ov); seg(x0, y1, x0, y0, ov); }
  function curve(fn, t0, t1, n = 40) { const pts = []; for (let i = 0; i <= n; i++) pts.push(fn(lerp(t0, t1, i / n))); line(pts); }
  const circle = (x, y, r) => { const pts = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } line(pts, true, 0.4); };
  // flat fill, loose & off-register
  function flat(pts, col, dx = 3, dy = -2.5, amp = 1.6) {
    const q = U.rough(pts.map(tf).map((p) => [p[0] + dx, p[1] + dy]), amp, 0.03, true, R.rr(0, 99), 4);
    fg.fillStyle = col; U.path(fg, q); fg.fill();
  }

  // ---------------- background: one hill line, sun, birds
  S = 1; ox = 0; oy = 0;
  circle(676, 92, 26);
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + 0.2; line([[676 + Math.cos(a) * 34, 92 + Math.sin(a) * 34], [676 + Math.cos(a) * 44, 92 + Math.sin(a) * 44]]); }
  curve((t) => [t * AW, 318 - 40 * Math.sin(t * 3.4 + 0.3) - 14 * Math.sin(t * 9)], -0.02, 0.26);
  curve((t) => [t * AW, 330 - 30 * Math.sin(t * 2.6 + 2.2) - 8 * Math.sin(t * 11)], 0.72, 1.02);
  for (const [x, y, s] of [[540, 64, 1], [568, 82, 0.75], [592, 60, 0.6]]) curve((t) => [x + t * 14 * s, y - Math.sin(t * Math.PI) * 5 * s + (t > 0.5 ? (t - 0.5) * 0 : 0)], 0, 1, 10), curve((t) => [x + 14 * s + t * 14 * s, y - Math.sin(t * Math.PI) * 5 * s], 0, 1, 10);
  // ground line + path
  curve((t) => [t * AW, 386 + 2 * Math.sin(t * 9)], -0.02, 0.25);
  curve((t) => [t * AW, 386 + 2 * Math.sin(t * 9)], 0.6, 1.02);

  // walnut tree (drawn after erasing the hill line behind it)
  { const cx = 92, cy = 236, pts = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * Math.PI * 2; const r = 60 + 8 * Math.abs(Math.sin(a * 5)) + 5 * noise(a * 2, 5); pts.push([cx + Math.cos(a) * r * 1.08, cy + Math.sin(a) * r * 0.8]); }
    g.save(); g.globalCompositeOperation = "destination-out"; U.path(g, pts); g.fill(); g.fillRect(cx - 14, 280, 28, 104); g.restore();
    line(pts, true, 0.5);
    g.save(); U.path(g, pts); g.globalCompositeOperation = "destination-out"; g.fillRect(cx - 9, 270, 18, 40); g.restore();
    line([[cx - 8, 386], [cx - 6, 300], [cx - 10, 286]]); line([[cx + 8, 386], [cx + 6, 300], [cx + 14, 284]]); line([[cx - 6, 306], [cx - 26, 286]]); line([[cx + 6, 298], [cx + 30, 280]]);
    // shade hatching on the lower right of the crown
    for (let k = 0; k < 9; k++) { const a = 0.15 + k * 0.17, r0 = 50; const x = cx + Math.cos(a) * r0 * 1.05, y = cy + Math.sin(a) * r0 * 0.78; line([[x - 4, y + 4], [x + 6, y - 6]]); } }


  // ---------------- house
  S = 1.26; ox = (AW - 420 * S) / 2 + 12; oy = 386 - 226 * S;
  { const Hs = U.HOUSE, rf = Hs.roof, ch = Hs.chim; g.save(); g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
    U.path(g, [[rf.ex0 - 6, rf.eaveY + 8], [rf.rx0, rf.ridgeY - 4], [rf.rx1, rf.ridgeY - 4], [424, rf.eaveY + 14], [400, 227], [36, 227]].map(tf)); g.fill();
    U.path(g, U.rect(ch.x0 - 5, ch.top - 3, ch.x1 + 5, 52).map(tf)); g.fill();
    for (const [x, y, h, w] of [[426, 222, 142, 28], [458, 226, 104, 22]]) { U.path(g, [[x, y - h - 4], [x + w + 4, y + 2], [x - w - 4, y + 2]].map(tf)); g.fill(); }
    U.path(g, U.rect(474, 130, 500, 227).map(tf)); g.fill();
    g.restore(); }
  LW = 2.1;
  const Hs = U.HOUSE, [wx0, wy0, wx1, wy1] = Hs.wall, rf = Hs.roof, ch = Hs.chim;
  // fills first (under the line)
  flat([[rf.ex0, rf.eaveY], [rf.rx0, rf.ridgeY], [rf.rx1, rf.ridgeY], [rf.ex1, rf.eaveY], [420, rf.eaveY + 12]], RED, 4, -3, 1.8);
  fg.save(); fg.globalCompositeOperation = 'destination-out'; U.path(fg, U.rect(ch.x0 + 1, ch.top + 6, ch.x1 + 1, 50).map(tf)); fg.fill(); fg.restore();
  flat(U.rect(ch.x0 - 3, ch.top, ch.x1 + 3, ch.top + 12), RED, 2, -1, 0.6);
  flat(U.rect(wx0, Hs.plinth, 398, wy1), BLUE, 3, 2, 1);
  for (const [x, y, w, h] of Hs.wins) { flat(U.rect(x - 15, y - 1, x - 3, y + h + 1), BLUE, 2, -2, 0.8); flat(U.rect(x + w + 3, y - 1, x + w + 15, y + h + 1), BLUE, 2, -2, 0.8); flat([[x - 8, y - 4], [x + w / 2, y - 16], [x + w + 8, y - 4]], BLUE, 2, -2, 0.5); }
  flat([[372, 160], [388, 163], [388, 186], [372, 184]], BLUE, 2, -2, 0.5);
  // geraniums (red dabs)
  for (const [x, y, w, h] of Hs.wins) for (let k = 0; k < 6; k++) { const cx = ox + (x + 4 + k * (w - 8) / 5) * S + 2, cy = oy + (y + h - 1) * S - 1; fg.fillStyle = RED; fg.beginPath(); fg.arc(cx, cy, 3.3, 0, 7); fg.fill(); }

  // spruces (zigzag line) behind right
  function spruce(x, y, h, w) {
    const n = 5, L = [], Rr = [];
    for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, yb = y - 8 - h + t1 * (h - 8), wb = w * (0.3 + 0.7 * t1); L.push([x - wb * 0.45, y - 8 - h + t0 * (h - 8) + 6], [x - wb, yb]); Rr.push([x + wb * 0.45, y - 8 - h + t0 * (h - 8) + 6], [x + wb, yb]); }
    const outl = [[x, y - h - 8], ...L.slice(1), [x - 3, y - 8], [x - 3, y], [x + 3, y], [x + 3, y - 8], ...Rr.slice(1).reverse()];
    line(outl, true, 0.4);
    for (let i = 1; i < n; i++) { const t = i / n, yb = y - 8 - h + t * (h - 8), wb = w * (0.3 + 0.7 * t); line([[x + wb * 0.2, yb - 3], [x + wb * 0.7, yb - 1]]); }
  }
  function spruceOld(x, y, h, w) {
    line([[x, y], [x, y - h]]);
    const pts = []; const n = 7; for (let i = 0; i <= n; i++) { const t = i / n, yy = y - h + t * h * 0.92, ww = w * t; pts.push([x - ww, yy + 4]); if (i < n) pts.push([x - ww * 0.35, yy + h / n * 0.7]); }
    line([[x, y - h - 2], ...pts.slice(0)]);
    const pr = []; for (let i = 0; i <= n; i++) { const t = i / n, yy = y - h + t * h * 0.92, ww = w * t; pr.push([x + ww, yy + 4]); if (i < n) pr.push([x + ww * 0.35, yy + h / n * 0.7]); }
    line([[x, y - h - 2], ...pr]);
  }
  spruce(426, 222, 142, 28); spruce(458, 226, 104, 22);
  // walls
  seg(wx0 + 8, wy1, 398, 216 + 0); seg(Hs.porch.x1, wy0 + 6, Hs.porch.x1, wy1, 0.3); seg(wx1, wy0 + 2, wx1, wy1); seg(398, 146, 398, 216);
  seg(wx0, Hs.plinth, wx1, Hs.plinth, 0.5); seg(wx1, Hs.plinth, 398, 205, 0.5);
  // side wall shade hatching (few strokes)
  for (let k = 0; k < 7; k++) { const x = wx1 + 6 + k * 4.8; line([[x, 150 + k], [x - 10, 166 + k]]); }
  box(372, 161, 388, 185, 0.6);
  // roof outline + hip + ridge
  line([[rf.ex0 - 2, rf.eaveY + 1], [rf.rx0, rf.ridgeY]]); line([[rf.rx0 - 3, rf.ridgeY], [rf.rx1 + 3, rf.ridgeY]]); line([[rf.rx1, rf.ridgeY], [rf.ex1 + 2, rf.eaveY + 1]]);
  line([[rf.rx1, rf.ridgeY], [421, rf.eaveY + 13]]); line([[rf.ex0 - 4, rf.eaveY + 1], [rf.ex1, rf.eaveY + 1]]); line([[rf.ex1, rf.eaveY + 1], [421, rf.eaveY + 13]]);
  line([[rf.ex0 - 2, rf.eaveY + 6], [rf.ex1, rf.eaveY + 6]]);
  // tiles: only suggested in a few clusters (illustrator's shorthand)
  const tileClusters = [[60, 118, 5, 3], [168, 84, 5, 3], [292, 114, 4, 2], [140, 50, 3, 2], [190, 128, 3, 1]];
  for (const [cx, cy, nx, ny] of tileClusters) for (let j = 0; j < ny; j++) for (let i = 0; i < nx - j; i++) {
    const x = cx + i * 11 + j * 5.5, y = cy - j * 10;
    curve((t) => { const a = Math.PI * t; return t < 0 ? 0 : [x + 4.5 - Math.cos(a) * 4.5, y - 7 + (t > 0.0 ? Math.sin(a) * 6 + 0 : 0) + (1 - Math.sin(a)) * 0]; }, 0, 1, 10);
    line([[x, y - 7], [x, y - 11]]); line([[x + 9, y - 7], [x + 9, y - 11]]);
  }
  // eave scallop trim
  for (let x = rf.ex0 + 4; x < rf.ex1 - 4; x += 9) curve((t) => [x + t * 8, rf.eaveY + 6 + Math.sin(t * Math.PI) * 3.2], 0, 1, 6);
  // chimney
  seg(ch.x0, ch.top + 6, ch.x0, 50, 0.3); seg(ch.x1, ch.top + 6, ch.x1, 50, 0.3); line([[ch.x0 - 4, 50], [ch.x1 + 4, 50]]); box(ch.x0 - 3, ch.top, ch.x1 + 3, ch.top + 6, 0.5);
  seg(ch.x0 + 3, ch.top + 18, ch.x0 + 11, ch.top + 18, 0.2); seg(ch.x0 + 13, ch.top + 26, ch.x1 - 3, ch.top + 26, 0.2);
  // smoke: one looping line
  for (const [x, y, r] of [[258, -4, 6], [270, -22, 9], [290, -46, 12]]) { const pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push([x + Math.cos(a) * r * (1 + 0.16 * Math.abs(Math.sin(a * 3))), y + Math.sin(a) * r * 0.78 * (1 + 0.16 * Math.abs(Math.sin(a * 3)))]); } line(pts, true, 0.3); }
  // windows
  for (const [x, y, w, h] of Hs.wins) {
    box(x - 3, y - 3, x + w + 3, y + h + 3, 0.7); box(x, y, x + w, y + h, 0.3);
    seg(x + w / 2, y, x + w / 2, y + h, 0.2); seg(x, y + h * 0.4, x + w, y + h * 0.4, 0.2);
    line([[x + 6, y + h - 6], [x + 12, y + 6]]); line([[x + w / 2 + 6, y + h - 8], [x + w / 2 + 10, y + h * 0.4 + 8]]);
    for (const sx of [x - 15, x + w + 3]) { box(sx, y - 1, sx + 12, y + h + 1, 0.5); for (let k = 1; k < 6; k++) seg(sx + 2.5, y + k * h / 6, sx + 9.5, y + k * h / 6 - 1.5, 0); }
    line([[x - 8, y - 4], [x + w / 2, y - 16], [x + w + 8, y - 4], [x - 8, y - 4]]);
    // sill + box + leaves
    box(x - 6, y + h + 3, x + w + 6, y + h + 10, 0.5);
    for (let k = 0; k < 5; k++) { const lx = x + 2 + k * (w - 4) / 4; line([[lx - 3, y + h + 3], [lx, y + h - 3], [lx + 3, y + h + 3]]); }
  }
  // porch
  const [dx0, dy0, dx1, dy1] = Hs.porch.door;
  box(dx0 - 3, dy0 - 3, dx1 + 3, dy1, 0.6); box(dx0, dy0, dx1, dy1, 0.2);
  for (let k = 1; k < 4; k++) seg(dx0 + (dx1 - dx0) * k / 4, dy0 + 2, dx0 + (dx1 - dx0) * k / 4, dy1 - 1, 0);
  seg(dx0 + 2, dy0 + 14, dx1 - 2, dy0 + 14, 0); seg(dx0 + 2, dy1 - 14, dx1 - 2, dy1 - 14, 0);
  { const pts = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; pts.push([dx1 - 6 + Math.cos(a) * 1.6, (dy0 + dy1) / 2 + Math.sin(a) * 1.6]); } line(pts, true, 0.1); }
  for (const px of Hs.porch.posts) {
    seg(px - 4, wy0 + 6, px - 4, wy1, 0.4); seg(px + 4, wy0 + 6, px + 4, wy1, 0.4);
    seg(px - 5, 168, px + 5, 168, 0); seg(px - 5, 172, px + 5, 172, 0);
    const dir = px < 90 ? 1 : -1; curve((t) => { const a = dir > 0 ? lerp(Math.PI, Math.PI * 0.5, t) : lerp(0, Math.PI * 0.5, t); return [px + dir * 16 + Math.cos(a) * 12 * dir * dir, wy0 + 6 + Math.sin(a) * 12]; }, 0, 1, 14);
  }
  for (const [a, b] of [[58, 76], [114, 132]]) { seg(a, 186, b, 186, 0.3); for (let x = a + 3; x < b; x += 4.5) seg(x, 188, x, 208, 0); }
  // peppers string
  for (let k = 0; k < 7; k++) { const y = 150 + k * 5.2; fg.fillStyle = RED; fg.beginPath(); fg.ellipse(ox + 47 * S + 2, oy + y * S, 2.4, 3.6, 0.2, 0, 7); fg.fill(); }
  line([[47.5, 146], [47, 186]]);
  // steps
  box(70, 214, 120, 220, 0.6); box(64, 220, 126, 226, 0.6);
  // grass tufts along the foot
  for (const x of [8, 26, 150, 172, 330, 352, 410, 470]) for (let k = -1; k <= 1; k++) line([[x + k * 3, 226], [x + k * 5, 226 - 7 - Math.abs(k) * -2]]);
  // flowers at the foot: stems in ink, heads as red dots
  for (const [x, h] of [[12, 16], [20, 22], [30, 14], [160, 14], [170, 20], [342, 18], [354, 13], [474, 20], [486, 26], [496, 16]]) { line([[x, 226], [x + 1, 226 - h]]); fg.fillStyle = RED; fg.beginPath(); fg.arc(ox + (x + 1) * S + 2, oy + (226 - h) * S - 1, 4, 0, 7); fg.fill(); const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; pts.push([x + 1 + Math.cos(a) * 3, 226 - h + Math.sin(a) * 3]); } line(pts, true, 0.2); }
  // path lines converging to steps
  line([[66, 226], [36, 290]]); line([[124, 226], [170, 290]]);
  // foreground tufts + small flowers
  S = 1; ox = 0; oy = 0;
  for (const [x, y] of [[60, 430], [230, 452], [610, 440], [720, 418], [400, 462]]) for (let k = -1; k <= 1; k++) line([[x + k * 4, y], [x + k * 7, y - 10 - (k === 0 ? 4 : 0)]]);

  // compose fills under lines (multiply so the paper shows), then slight paper tooth
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const lines = g.getImageData(0, 0, W, H);
  g.fillStyle = "#fbf7ef"; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.92; g.globalCompositeOperation = "multiply"; g.drawImage(FL.c, 0, 0); g.globalAlpha = 1;
  const tmp = U.canvas(W, H); tmp.getContext("2d").putImageData(lines, 0, 0);
  g.globalCompositeOperation = "multiply"; g.drawImage(tmp, 0, 0);
  g.globalCompositeOperation = "source-over";
  const im = g.getImageData(0, 0, W, H), d = im.data, rn = mulberry32(5);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4, n = (rn() - 0.5) * 6 + 2 * fbm(x * 0.01, y * 0.01, 2); d[k] += n; d[k + 1] += n; d[k + 2] += n; }
  g.putImageData(im, 0, 0); g.restore();
};
