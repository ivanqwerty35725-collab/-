/* Karl Bryullov manner ("Italian Midday"): warm Italian sun through a vine pergola, dappled light, academic modelling,
   glazed shadows with reflected light, white linen and red velvet. The figure is built from shapes that are "inflated" into
   height fields; normals are lit per pixel with a moving leaf-shadow pattern. A painterly GL pass finishes the surface. */
(function () {
  "use strict";
  const { W, H, R, clamp, lerp, smooth, ease, eOut, seg, noise, fbm, hex, mix, rgba, canvas, layer, path, spline, ellipse, ribbon, rect } = U;
  const out = document.getElementById("out"), ctx = out.getContext("2d", { willReadFrequently: true });
  // figure box
  const BX = 360, BY = 100, BW = 600, BH = 620;
  const LGT = (() => { const v = [0.74, -0.56, 0.36], l = Math.hypot(...v); return v.map((x) => x / l); })();

  // ---------------- helpers ----------------
  function maskOf(draw) {
    const c = canvas(BW, BH), g = c.getContext("2d", { willReadFrequently: true }); g.translate(-BX, -BY); g.fillStyle = "#fff"; g.strokeStyle = "#fff"; draw(g);
    return c;
  }
  function readA(c) { const d = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, BW, BH).data, a = new Float32Array(BW * BH); for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255; return a; }
  function readL(c) { const d = c.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, BW, BH).data, a = new Float32Array(BW * BH); for (let i = 0; i < a.length; i++) a[i] = (d[i * 4] / 255) * (d[i * 4 + 3] / 255); return a; }
  function blurC(c, r) { const o = canvas(BW, BH), g = o.getContext("2d", { willReadFrequently: true }); g.filter = `blur(${r}px)`; g.drawImage(c, 0, 0); return o; }
  function boxBlur(a, r) {
    const tmp = new Float32Array(a.length), n = 2 * r + 1;
    for (let y = 0; y < BH; y++) { let s = 0; const o = y * BW; for (let x = -r; x <= r; x++) s += a[o + clamp(x, 0, BW - 1)]; for (let x = 0; x < BW; x++) { tmp[o + x] = s / n; s += a[o + Math.min(BW - 1, x + r + 1)] - a[o + Math.max(0, x - r)]; } }
    for (let x = 0; x < BW; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[clamp(y, 0, BH - 1) * BW + x]; for (let y = 0; y < BH; y++) { a[y * BW + x] = s / n; s += tmp[Math.min(BH - 1, y + r + 1) * BW + x] - tmp[Math.max(0, y - r) * BW + x]; } }
  }
  // region: mask -> inflated height -> normals
  function region(name, draw, o = {}) {
    const mc = maskOf(draw), m = readA(blurC(mc, o.soft ?? 0.8));
    const hgt = new Float32Array(BW * BH);
    for (const [r, w] of o.inflate || [[22, 34], [9, 14], [3, 4]]) { const b = readA(blurC(mc, r)); for (let i = 0; i < hgt.length; i++) hgt[i] += b[i] * w; }
    if (o.detail) { const dc = canvas(BW, BH), dg = dc.getContext("2d", { willReadFrequently: true }); dg.translate(-BX, -BY); o.detail(dg); const blurred = blurC(dc, o.detailBlur ?? 2.5), d = readL(blurred); for (let i = 0; i < hgt.length; i++) hgt[i] += (d[i] - (o.detailBias ?? 0)) * (o.detailAmp ?? 8) * Math.min(1, m[i] * 1.5); }
    boxBlur(hgt, 2); boxBlur(hgt, 2);
    const nx = new Float32Array(BW * BH), ny = new Float32Array(BW * BH), nz = new Float32Array(BW * BH);
    const k = o.k ?? 1;
    for (let y = 1; y < BH - 1; y++) for (let x = 1; x < BW - 1; x++) {
      const i = y * BW + x; if (m[i] <= 0) continue;
      const dx = (hgt[i + 1] - hgt[i - 1]) * 0.5 * k, dy = (hgt[i + BW] - hgt[i - BW]) * 0.5 * k, l = Math.hypot(dx, dy, 1);
      nx[i] = -dx / l; ny[i] = -dy / l; nz[i] = 1 / l;
    }
    const idx = []; for (let i = 0; i < m.length; i++) if (m[i] > 0.002) idx.push(i);
    return { name, m, nx, ny, nz, mc, mat: o.mat, alb: o.alb, idx: Int32Array.from(idx) };
  }

  // ---------------- figure shapes ----------------
  const S = (pts, n = 8) => spline(pts, n, true);
  const SHP = {
    torsoSkin: S([[572, 294], [618, 290], [628, 318], [660, 334], [700, 336], [728, 346], [742, 372], [736, 404], [700, 430], [640, 442], [580, 438], [540, 420], [536, 380], [552, 340], [566, 312]]),
    chemise: S([[556, 334], [524, 340], [494, 356], [476, 384], [470, 430], [478, 490], [500, 520], [600, 528], [668, 516], [700, 480], [722, 430], [708, 426], [672, 420], [632, 406], [594, 382], [570, 356]]),
    bodice: S([[494, 490], [532, 486], [584, 502], [640, 490], [690, 476], [686, 522], [668, 562], [676, 640], [702, 735], [474, 735], [488, 640], [498, 562], [490, 522]]),
    sleeveL: S([[504, 350], [472, 358], [448, 386], [438, 430], [444, 474], [458, 506], [478, 516], [496, 500], [500, 450], [506, 398]]),
    forearm: [[818, 262], [834, 222], [846, 186], [852, 168]],
    sleeveR: S([[704, 374], [714, 342], [744, 316], [780, 284], [804, 250], [826, 240], [844, 256], [838, 290], [812, 328], [780, 368], [752, 398], [724, 406]]),
    head: ellipse(600, 236, 52, 62, 48).map(([x, y]) => { const a = -0.22, cx = 600, cy = 236; return [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]; }),
    hair: null, bun: ellipse(574, 208, 36, 33, 40),
    ear: ellipse(640, 258, 9, 15, 24),
  };
  // hair = head outline on the left/back, hairline curve on the right where the lost profile shows
  SHP.hair = (() => {
    const h = SHP.head.slice(0, -1), hl = (y) => y < 226 ? 720 : 644 - Math.pow(Math.max(0, y - 226) / 70, 1.15) * 30 + 1.5 * Math.sin(y * 0.2);
    const inside = h.map(([x, y]) => x < hl(y));
    const s = inside.findIndex((v, i) => v && !inside[(i - 1 + h.length) % h.length]);
    const run = []; for (let k = 0; k < h.length; k++) { const i = (s + k) % h.length; if (!inside[i]) break; run.push(h[i]); }
    const a = run[run.length - 1], b = run[0], pts = run.slice();
    for (let k = 1; k < 16; k++) { const y = lerp(a[1], b[1], k / 16); pts.push([hl(y), y]); }
    return pts;
  })();

  // ---------------- background (painted once) ----------------
  function paintBG() {
    const L = layer(), g = L.g;
    // Italian sky on the right, warm haze toward the horizon
    let gr = g.createLinearGradient(0, 0, 0, 520); gr.addColorStop(0, "#6a93bd"); gr.addColorStop(0.42, "#b8c6c4"); gr.addColorStop(0.78, "#f0d8a4"); gr.addColorStop(1, "#f6dfae");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // soft clouds
    R.seed(4);
    g.save(); g.filter = "blur(14px)";
    for (let i = 0; i < 18; i++) { const x = R.rr(700, 1300), y = R.rr(60, 330), r = R.rr(30, 80); g.fillStyle = `rgba(250,240,222,${R.rr(0.25, 0.5)})`; g.beginPath(); g.ellipse(x, y, r * 1.8, r * 0.7, 0, 0, 7); g.fill(); }
    g.restore();
    // distant hills, aerial perspective
    g.save(); g.filter = "blur(2px)";
    g.fillStyle = "#97a2b4"; path(g, [[560, 560], ...spline([[560, 470], [700, 452], [860, 466], [1020, 444], [1280, 462]], 10), [1280, 560]]); g.fill();
    g.fillStyle = "#7f8f86"; path(g, [[560, 560], ...spline([[560, 500], [760, 486], [960, 496], [1140, 480], [1280, 490]], 10), [1280, 560]]); g.fill();
    // cypresses and stone pine
    for (const [x, h, w] of [[958, 150, 13], [992, 190, 15], [1150, 130, 12], [1210, 170, 14]]) {
      const gr2 = g.createLinearGradient(x - w, 0, x + w, 0); gr2.addColorStop(0, "#2c3826"); gr2.addColorStop(0.7, "#4e5c36"); gr2.addColorStop(1, "#7b8248");
      g.fillStyle = gr2; path(g, spline([[x, 505], [x - w, 470], [x - w * 0.9, 505 - h * 0.6], [x, 505 - h], [x + w * 0.9, 505 - h * 0.6], [x + w, 470], [x, 505]], 8)); g.fill();
    }
    g.fillStyle = "#3e4a2c"; g.beginPath(); g.ellipse(1086, 432, 60, 20, 0, 0, 7); g.fill(); g.fillStyle = "#4a3a26"; g.fillRect(1083, 440, 5, 60);
    g.restore();
    // balustrade, lit from the right
    const by = 540, x0 = 600;
    g.fillStyle = "#cdb487"; g.fillRect(x0, by, W - x0, 20);
    g.fillStyle = "#efe0bb"; g.fillRect(x0, by, W - x0, 5);
    g.fillStyle = "#806a4a"; g.fillRect(x0, by + 20, W - x0, 6);
    for (let x = x0 + 20; x < W + 20; x += 36) {
      const b = [[x - 8, by + 26], [x + 8, by + 26], [x + 5, by + 36], [x + 12, by + 62], [x + 7, by + 90], [x + 9, by + 106], [x - 9, by + 106], [x - 7, by + 90], [x - 12, by + 62], [x - 5, by + 36]];
      gr = g.createLinearGradient(x - 12, 0, x + 12, 0); gr.addColorStop(0, "#6a5538"); gr.addColorStop(0.5, "#c9b28a"); gr.addColorStop(0.85, "#efdfba"); gr.addColorStop(1, "#d8c49c");
      g.fillStyle = gr; path(g, spline(b, 4, true)); g.fill();
      g.fillStyle = "rgba(60,44,28,0.35)"; g.fillRect(x - 22, by + 26, 6, 80);
    }
    g.fillStyle = "#9c845e"; g.fillRect(x0, by + 106, W - x0, 14);
    gr = g.createLinearGradient(0, by + 120, 0, H); gr.addColorStop(0, "#6e5a40"); gr.addColorStop(1, "#3a2d1e"); g.fillStyle = gr; g.fillRect(x0, by + 120, W - x0, H);
    gr = g.createLinearGradient(0, 0, 820, 0); gr.addColorStop(0, "rgba(26,24,12,1)"); gr.addColorStop(0.5, "rgba(48,44,22,0.92)"); gr.addColorStop(0.8, "rgba(70,66,34,0.4)"); gr.addColorStop(1, "rgba(70,66,34,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 820, H);
    gr = g.createLinearGradient(0, 0, 0, 220); gr.addColorStop(0, "rgba(30,30,14,0.95)"); gr.addColorStop(1, "rgba(30,30,14,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, 220);
    // pergola in shade: dark warm foliage on the left and along the top, built from leaf dabs
    R.seed(3);
    for (let i = 0; i < 4200; i++) {
      const x = R.rr(-40, 900), y = R.rr(-40, 760);
      const dens = smooth(760, 300, x) * 0.95 + smooth(170, 0, y) * 0.9;
      if (R.r() > dens) continue;
      const lit = clamp(0.1 + 0.55 * smooth(420, 760, x + R.rr(-90, 90)) + 0.35 * (fbm(x * 0.007, y * 0.007) + 0.15) - 0.25 * smooth(300, 700, y), 0, 1);
      const c = mix(mix("#16180c", "#2e3216", R.r()), mix("#6f7a32", "#b7ad54", R.r()), lit * lit);
      g.save(); g.translate(x, y); g.rotate(R.rr(0, 6.28)); g.fillStyle = rgba(c, R.rr(0.55, 0.92));
      const s = R.rr(9, 24); g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.95, -s * 0.25, 0, s * 0.8); g.quadraticCurveTo(-s * 0.95, -s * 0.25, 0, -s); g.fill(); g.restore();
    }
    // deep shadow pooling at lower left (chiaroscuro)
    gr = g.createRadialGradient(150, 640, 50, 150, 640, 620); gr.addColorStop(0, "rgba(14,10,6,0.75)"); gr.addColorStop(1, "rgba(14,10,6,0)"); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // sun bloom upper right
    gr = g.createRadialGradient(1180, 60, 10, 1180, 60, 760); gr.addColorStop(0, "rgba(255,244,210,0.8)"); gr.addColorStop(0.35, "rgba(255,230,180,0.28)"); gr.addColorStop(1, "rgba(255,220,160,0)");
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // repaint with brush strokes sampled from the underpainting
    const src = g.getImageData(0, 0, W, H).data; R.seed(44);
    for (let i = 0; i < 26000; i++) {
      const x = R.rr(0, W), y = R.rr(0, H), k = ((y | 0) * W + (x | 0)) * 4;
      const l = R.rr(-7, 7), c = [src[k] + l, src[k + 1] + l, src[k + 2] + l * 0.8];
      const ang = (y < 520 && x > 600 ? 0.05 : 0.9) + 0.5 * noise(x * 0.004, y * 0.004);
      const len = R.rr(7, 22) * (x > 600 && y < 520 ? 1.5 : 1), wd = R.rr(2, 5);
      g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = rgba(c, R.rr(0.25, 0.6)); g.beginPath(); g.ellipse(0, 0, len / 2, wd / 2, 0, 0, 7); g.fill(); g.restore();
    }
    return L.c;
  }

  // ---------------- foreground vine (per frame, sways) ----------------
  const LEAFC = {};
  function leafSprite(lit, sd) {
    const key = lit + "_" + sd; if (LEAFC[key]) return LEAFC[key];
    const S0 = 120, c = canvas(S0, S0), g = c.getContext("2d"); g.translate(S0 / 2, S0 / 2);
    const r = U.mulberry32(sd), pts = [];
    for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 2, lob = (0.40 + 0.60 * Math.pow(0.5 + 0.5 * Math.cos(a * 6), 0.55)) * (0.86 + 0.14 * Math.cos(a)) + 0.045 * Math.abs(Math.sin(a * 34 + sd)) - 0.42 * Math.exp(-Math.pow((a - Math.PI) / 0.22, 2)); pts.push([Math.sin(a) * 46 * lob, -Math.cos(a) * 46 * lob + 6]); }
    const gr = g.createRadialGradient(-8 + r() * 10, -10, 2, 0, 0, 56);
    if (lit) { gr.addColorStop(0, "rgba(238,236,140,0.97)"); gr.addColorStop(0.5, "rgba(176,184,70,0.96)"); gr.addColorStop(1, "rgba(96,108,34,0.96)"); }
    else { gr.addColorStop(0, "rgba(84,92,40,0.97)"); gr.addColorStop(1, "rgba(30,36,16,0.97)"); }
    g.fillStyle = gr; path(g, pts); g.fill();
    // painted mottling
    g.save(); path(g, pts); g.clip();
    for (let i = 0; i < 40; i++) { g.fillStyle = lit ? `rgba(${200 + r() * 55},${200 + r() * 40},${80 + r() * 40},0.12)` : `rgba(${20 + r() * 40},${30 + r() * 30},10,0.18)`; g.beginPath(); g.ellipse(r() * 90 - 45, r() * 90 - 45, 6 + r() * 12, 3 + r() * 6, r() * 3, 0, 7); g.fill(); }
    g.restore();
    // brushed texture along the veins
    g.save(); path(g, pts); g.clip();
    for (let i = 0; i < 70; i++) { const a = (r() - 0.5) * 2.6, d = 8 + r() * 36; const x = Math.sin(a) * d, y = 34 - Math.cos(a) * d * 1.1; g.strokeStyle = lit ? `rgba(${170 + r() * 80},${180 + r() * 50},${50 + r() * 50},0.22)` : `rgba(${30 + r() * 50},${40 + r() * 40},${12 + r() * 20},0.25)`; g.lineWidth = 2 + r() * 4; g.beginPath(); g.moveTo(x * 0.6, y * 0.6 + 10); g.lineTo(x, y); g.stroke(); }
    g.restore();
    g.strokeStyle = lit ? "rgba(120,124,40,0.6)" : "rgba(12,16,6,0.5)"; g.lineWidth = 1.3;
    for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.66; g.beginPath(); g.moveTo(0, 34); g.quadraticCurveTo(Math.sin(a) * 16, 8, Math.sin(a) * 38, -Math.cos(a) * 34 + 6); g.stroke(); }
    const c2 = canvas(S0, S0), g2 = c2.getContext("2d"); g2.filter = "blur(0.8px)"; g2.drawImage(c, 0, 0);
    LEAFC[key] = c2; return c2;
  }
  function vineLeaf(g, x, y, s, rot, lit, sd) {
    const c = leafSprite(lit ? 1 : 0, (sd | 0) % 7);
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); g.drawImage(c, -60, -60); g.restore();
  }
  function grapes(g, x, y, sw, t) {
    R.seed(77);
    g.save(); g.translate(x, y); g.rotate(sw);
    g.strokeStyle = "#5a4a26"; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -30); g.quadraticCurveTo(4, -14, 0, 0); g.stroke();
    const items = [];
    for (let i = 0; i < 52; i++) { const k = i / 52, yy = 6 + k * 124, w = (1 - k) * 36 + 6; items.push([R.rr(-w, w), yy + R.rr(-4, 4), R.rr(9, 12) * (1 - k * 0.25)]); }
    items.sort((a, b) => a[1] - b[1]);
    for (const [gx, gy, r] of items) {
      const lit = clamp(0.5 + gx / 60, 0, 1);
      const gr = g.createRadialGradient(gx + r * 0.3, gy - r * 0.35, r * 0.1, gx, gy, r * 1.05);
      gr.addColorStop(0, "#fbf0b4"); gr.addColorStop(0.4, lit > 0.5 ? "#dcc464" : "#b49a44"); gr.addColorStop(0.85, "#7a6224"); gr.addColorStop(1, "#3e3010");
      g.fillStyle = gr; g.beginPath(); g.arc(gx, gy, r, 0, 7); g.fill();
      g.strokeStyle = "rgba(255,236,150,0.45)"; g.lineWidth = 1.4; g.beginPath(); g.arc(gx, gy, r - 1, -0.4, 1.2); g.stroke();
      g.fillStyle = "rgba(255,255,236,0.9)"; g.beginPath(); g.ellipse(gx + r * 0.35, gy - r * 0.42, r * 0.2, r * 0.13, -0.6, 0, 7); g.fill();
    }
    g.restore();
  }

  // ---------------- lighting ----------------
  let REG = [], BG, DAP, SHADOWS;
  const MAT = {
    skin: { alb: [0.93, 0.70, 0.55], amb: 0.34, sss: [0.30, 0.07, 0.02], rim: 0.55, spec: 0.12, sh: 18 },
    linen: { alb: [0.93, 0.91, 0.85], amb: 0.33, sss: [0.05, 0.03, 0.0], rim: 0.35, spec: 0.0, sh: 1 },
    velvet: { alb: [0.50, 0.10, 0.08], amb: 0.30, sss: [0.08, 0.0, 0.0], rim: 0.0, spec: 0.0, sh: 1, sheen: [0.95, 0.35, 0.28] },
    hair: { alb: [0.20, 0.11, 0.06], amb: 0.34, sss: [0.06, 0.02, 0.0], rim: 0.6, spec: 0.45, sh: 30 },
    ribbon: { alb: [0.14, 0.22, 0.42], amb: 0.34, sss: [0, 0, 0], rim: 0.2, spec: 0.3, sh: 20 },
  };
  function dapple(t) {
    // low-res leaf-shadow pattern, upscaled: 1 = sun, ~0.3 = shade
    const w = 160, h = 90, c = canvas(w, h), g = c.getContext("2d"), im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const X = x * 8, Y = y * 8;
      const n = fbm(X * 0.006 + t * 0.05 + 0.3 * Math.sin(t * 0.7 + Y * 0.004), Y * 0.008 - t * 0.02, 3) + 0.25 * noise(X * 0.02 + t * 0.15, Y * 0.02);
      const base = 0.25 + 0.75 * smooth(-0.05, 0.12, n);
      // the canopy thins toward the right: more sun there
      const v = clamp(base + 0.35 * smooth(500, 900, X) - 0.25 * smooth(560, 200, X), 0.12, 1);
      const k = (y * w + x) * 4; d[k] = d[k + 1] = d[k + 2] = v * 255; d[k + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    const big = canvas(), bg = big.getContext("2d", { willReadFrequently: true }); bg.imageSmoothingQuality = "high"; bg.filter = "blur(3px)"; bg.drawImage(c, 0, 0, W, H);
    return big;
  }
  let GLZ;
  function shadeFigure(img, dap, t) {
    if (!GLZ) { GLZ = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) GLZ[y * W + x] = fbm(x * 0.012, y * 0.012, 3) * 2; }
    const d = img.data, dp = dap;
    const sun = [1.0, 0.90, 0.74];
    for (const r of REG) {
      const M = MAT[r.mat], m = r.m, nx = r.nx, ny = r.ny, nz = r.nz, sh = r.shadow;
      const alb = r.alb || M.alb;
      const IDX = r.idx;
      for (let q = 0; q < IDX.length; q++) {
        const i = IDX[q], a = m[i];
        const x = i % BW, y = (i / BW) | 0, gi = ((y + BY) * W + (x + BX)) * 4;
        const X = nx[i], Y = ny[i], Z = nz[i];
        const ndl = X * LGT[0] + Y * LGT[1] + Z * LGT[2];
        let lam = Math.max(0, ndl);
        if (M === MAT.skin) lam = Math.max(0, (ndl + 0.25) / 1.25);
        const dv = (0.42 + 0.58 * dp[gi] / 255) * (sh ? 1 - 0.7 * sh[i] : 1);
        const direct = lam * dv * 1.25;
        // ambient: cool sky from above, warm bounce from below and from the sunlit linen
        const up = 0.5 - 0.5 * Y, dn = 0.5 + 0.5 * Y;
        const ar = M.amb * (0.78 * up + 0.95 * dn * 0.8), ag = M.amb * (0.82 * up + 0.72 * dn * 0.8), ab = M.amb * (0.95 * up + 0.50 * dn * 0.8);
        const vv = GLZ[(y + BY) * W + (x + BX)];
        let cr = alb[0] * (1 + 0.06 * vv) * (ar + direct * sun[0]), cg = alb[1] * (ag + direct * sun[1]), cb = alb[2] * (1 - 0.06 * vv) * (ab + direct * sun[2]);
        // warm glow in the half-shadow (subsurface / glazed shadows)
        const term = Math.max(0, 1 - Math.abs(ndl - 0.05) * 3.5) * dv;
        cr += M.sss[0] * term; cg += M.sss[1] * term; cb += M.sss[2] * term;
        // rim light where the surface turns away, on the sun side
        const rim = Math.pow(1 - Z, 2.2) * Math.max(0, X * 0.8 - Y * 0.5) * dv * M.rim;
        cr += rim * sun[0]; cg += rim * sun[1]; cb += rim * sun[2] * 0.9;
        if (M.spec > 0) { const hx = LGT[0], hy = LGT[1], hz = LGT[2] + 1, hl = Math.hypot(hx, hy, hz); const s = Math.pow(Math.max(0, (X * hx + Y * hy + Z * hz) / hl), M.sh) * M.spec * dv; cr += s; cg += s * 0.95; cb += s * 0.85; }
        if (M.sheen) { const s = Math.pow(1 - Z, 2) * 0.55 * (0.4 + 0.6 * dv); cr += M.sheen[0] * s * 0.5; cg += M.sheen[1] * s * 0.5; cb += M.sheen[2] * s * 0.5; }
        const R0 = Math.min(255, Math.pow(Math.max(cr, 0), 0.92) * 255), G0 = Math.min(255, Math.pow(Math.max(cg, 0), 0.92) * 255), B0 = Math.min(255, Math.pow(Math.max(cb, 0), 0.92) * 255);
        d[gi] = d[gi] * (1 - a) + R0 * a; d[gi + 1] = d[gi + 1] * (1 - a) + G0 * a; d[gi + 2] = d[gi + 2] * (1 - a) + B0 * a;
      }
    }
  }

  // ---------------- GL painterly pass (shared approach with the Aivazovsky scene) ----------------
  const glc = canvas(); const gl = glc.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
  const VS = `#version 300 es
  in vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`;
  const FS = `#version 300 es
  precision highp float;
  uniform vec2 res; uniform sampler2D img; out vec4 o;
  float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
  vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p+n)); }
  float gnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
    vec2 ga = h22(i)*2.-1., gb = h22(i+vec2(1,0))*2.-1., gc = h22(i+vec2(0,1))*2.-1., gd = h22(i+vec2(1,1))*2.-1.;
    return mix(mix(dot(ga,f), dot(gb,f-vec2(1,0)), u.x), mix(dot(gc,f-vec2(0,1)), dot(gd,f-vec2(1,1)), u.x), u.y)*1.4; }
  vec3 tx(vec2 p){ return texture(img, p/res).rgb; }
  float lu(vec3 c){ return dot(c, vec3(0.3, 0.55, 0.15)); }
  void main(){
    vec2 p = gl_FragCoord.xy, q = vec2(p.x, res.y - p.y);
    float r = 2.5;
    float gx = lu(tx(p + vec2(r, 0.))) - lu(tx(p - vec2(r, 0.)));
    float gy = lu(tx(p + vec2(0., r))) - lu(tx(p - vec2(0., r)));
    vec2 g = vec2(gx, gy); float gm = length(g);
    vec2 tdir = gm > 0.003 ? normalize(vec2(-g.y, g.x)) : vec2(0.7, 0.7);
    float an = 0.8 + 0.6*gnoise(q*0.006);
    vec2 hdir = vec2(cos(an), sin(an));
    tdir = normalize(mix(hdir, tdir*sign(dot(tdir, hdir) + 1e-4), smoothstep(0.003, 0.04, gm)));
    vec3 acc = vec3(0.); float ws = 0.;
    for (int i = -4; i <= 4; i++) { float fi = float(i); float w = 1. - abs(fi)/5.; acc += tx(p + tdir*fi*1.3)*w; ws += w; }
    vec3 col = mix(acc/ws, tx(p), 0.35);
    vec2 sp = vec2(dot(q, tdir*vec2(1., -1.)), dot(q, vec2(tdir.y, tdir.x)));
    float st = gnoise(vec2(sp.x*0.05, sp.y*0.5))*0.6 + gnoise(vec2(sp.x*0.12, sp.y*1.0))*0.4;
    col *= 1. + st*0.045;
    float wv = sin(q.x*2.3)*sin(q.y*2.3);
    col *= 1. + wv*0.016 + (h21(floor(q*0.5)) - 0.5)*0.018;
    // old varnish: warm, slightly compressed lights, deep transparent darks
    col = pow(col, vec3(1.04, 1.0, 1.10));
    col *= vec3(1.04, 0.99, 0.88);
    vec2 uv = q/res - 0.5;
    col *= mix(0.52, 1.0, 1. - smoothstep(0.30, 0.85, length(uv*vec2(1.0, 1.25))));
    o = vec4(clamp(col, 0., 1.), 1.);
  }`;
  let GP, GT;
  function glInit() {
    const sh = (src, ty) => { const s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    GP = gl.createProgram(); gl.attachShader(GP, sh(VS, gl.VERTEX_SHADER)); gl.attachShader(GP, sh(FS, gl.FRAGMENT_SHADER)); gl.bindAttribLocation(GP, 0, "a"); gl.linkProgram(GP);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    GT = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, GT); for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
  }
  function glPaint(src) {
    gl.viewport(0, 0, W, H); gl.useProgram(GP);
    gl.bindTexture(gl.TEXTURE_2D, GT); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.uniform2f(gl.getUniformLocation(GP, "res"), W, H); gl.uniform1i(gl.getUniformLocation(GP, "img"), 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.finish();
  }

  // ---------------- build ----------------
  function fill(pts) { return (g) => { path(g, pts); g.fill(); }; }
  function build() {
    glInit();
    BG = paintBG();
    const strokes = (lines, w, col = "#fff") => (g) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; for (const l of lines) { path(g, spline(l, 8), false); g.stroke(); } };
    R.seed(5);
    // chemise folds: gathers rising from the bodice, a diagonal drape from the left shoulder, a sag under the slipped neckline
    const chemFolds = [];
    for (const [x, w] of [[512, 1], [548, 0.7], [596, 1.2], [640, 0.8], [676, 1]]) chemFolds.push([[x + R.rr(-4, 4), 520], [x + (x - 590) * 0.05 + R.rr(-5, 5), 488], [x + (x - 590) * 0.12 + R.rr(-8, 8), 456 - w * 6]]);
    chemFolds.push([[488, 372], [540, 410], [610, 436], [690, 444]], [[482, 410], [548, 452], [640, 470]], [[520, 350], [580, 392], [660, 420]]);
    const sleeveFolds = (pts, sd) => { R.seed(sd); return pts.map((l) => l.map(([x, y]) => [x + R.rr(-3, 3), y + R.rr(-3, 3)])); };
    const hairLines = []; R.seed(9);
    for (let i = 0; i < 26; i++) { const a = -2.4 + i * 0.14, r0 = 60; hairLines.push([[600 + Math.cos(a) * r0 * 0.4 + 30, 300 + Math.sin(a) * 6], [600 + Math.cos(a) * r0 * 0.75, 236 + Math.sin(a) * r0 * 0.75], [574 + Math.cos(a) * 20, 208 + Math.sin(a) * 18]]); }
    REG = [
      region("torso", fill(SHP.torsoSkin), { mat: "skin", inflate: [[26, 40], [10, 12], [3, 3]], detail: strokes([[[600, 340], [612, 380], [604, 430]], [[690, 360], [700, 395], [690, 425]]], 10, "#000"), detailAmp: 6 }),
      region("chemise", fill(SHP.chemise), { mat: "linen", inflate: [[28, 36], [10, 10], [3, 3]], detail: strokes(chemFolds, 12), detailBlur: 9, detailAmp: 8 }),
      region("forearmL", (g) => { path(g, ribbon(spline([[476, 500], [482, 550], [494, 600]], 8), (k) => 30 - 6 * k)); g.fill(); }, { mat: "skin", inflate: [[10, 22], [4, 6], [1.5, 2]] }),
      region("bodice", fill(SHP.bodice), { mat: "velvet", inflate: [[34, 46], [12, 12], [3, 3]], detail: strokes([[[580, 520], [578, 620], [584, 730]]], 16, "#000"), detailAmp: 10 }),
      region("sleeveL", fill(SHP.sleeveL), { mat: "linen", inflate: [[18, 34], [7, 10], [2, 3]], detail: strokes(sleeveFolds([[[452, 410], [476, 424], [498, 416]], [[446, 470], [470, 480], [496, 474]], [[448, 528], [472, 540], [496, 532]], [[478, 380], [466, 440], [470, 500]]], 21), 12), detailBlur: 7, detailAmp: 8 }),
      region("forearm", (g) => { path(g, ribbon(spline(SHP.forearm, 8), (k) => 34 - 10 * k)); g.fill(); g.beginPath(); g.ellipse(856, 160, 15, 19, 0.3, 0, 7); g.fill(); }, { mat: "skin", inflate: [[10, 22], [4, 6], [1.5, 2]] }),
      region("sleeveR", fill(SHP.sleeveR), { mat: "linen", inflate: [[18, 34], [7, 10], [2, 3]], detail: strokes(sleeveFolds([[[716, 360], [740, 380], [748, 400]], [[748, 320], [770, 344], [778, 372]], [[784, 284], [806, 300], [816, 322]], [[730, 336], [790, 300], [828, 252]]], 22), 14), detailBlur: 9, detailAmp: 6 }),
      region("headskin", fill(SHP.head), { mat: "skin", inflate: [[24, 40], [9, 10], [3, 3]], detail: strokes([[[648, 240], [656, 262], [646, 296], [628, 312]]], 6), detailAmp: 5 }),
      region("ear", fill(SHP.ear), { mat: "skin", inflate: [[4, 8], [1.5, 2]], detail: strokes([[[640, 250], [644, 262], [638, 270]]], 2.5, "#000"), detailAmp: 4 }),
      region("hair", fill(SHP.hair), { mat: "hair", inflate: [[24, 40], [9, 10], [3, 3]], detail: strokes(hairLines, 1.6), detailBlur: 1.2, detailAmp: 3 }),
      region("bun", fill(SHP.bun), { mat: "hair", inflate: [[14, 30], [5, 8], [2, 2]], detail: (g) => { g.strokeStyle = "#fff"; g.lineWidth = 4; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(574, 208, 30 - k * 7, 27 - k * 6, 0.4 + k, 0.2, 5.2); g.stroke(); } }, detailBlur: 2, detailAmp: 6 }),
      region("ribbon", (g) => { path(g, ribbon(ellipse(574, 210, 36, 33, 30, 1.4, 3.3), () => 4.5)); g.fill(); }, { mat: "ribbon", inflate: [[4, 8], [1.5, 2]] }),
    ];
    // cast shadows: each region receives the shadow of the regions in front of it, offset away from the light
    const acc = canvas(BW, BH), ag = acc.getContext("2d", { willReadFrequently: true });
    for (let i = REG.length - 1; i >= 0; i--) {
      const s = blurC(acc, 5); REG[i].shadow = readA(s);
      ag.drawImage(REG[i].mc, -LGT[0] * 16, -LGT[1] * 16);
    }
  }

  // ---------------- text ----------------
  const T = { v1: 1.6, v2: 5.4 };
  function text(g, t) {
    const X = 916, Y = 392;
    const a = eOut(seg(t, T.v1 - 0.3, T.v1 + 0.3)), b = seg(t, T.v1 + 0.3, T.v1 + 0.65), c = eOut(seg(t, T.v1 + 1.0, T.v1 + 1.6));
    if (a <= 0) return;
    g.save();
    // soft light glaze behind the words
    g.globalAlpha = a; g.translate(X + 140, Y + 6); g.scale(1, 0.42); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 230); gr.addColorStop(0, "rgba(255,240,210,0.6)"); gr.addColorStop(0.6, "rgba(255,236,204,0.3)"); gr.addColorStop(1, "rgba(255,236,204,0)"); g.fillStyle = gr; g.fillRect(-230, -230, 460, 460); g.restore();
    g.save(); g.textBaseline = "alphabetic";
    g.font = "600 76px 'Source Serif 4'"; const w1 = g.measureText("a kert").width;
    g.globalAlpha = a; g.fillStyle = "#2b1d16"; g.fillText("a kert", X, Y + (1 - a) * 8);
    if (b > 0) { const pulse = Math.exp(-Math.pow((t - (T.v2 + 0.5)) / 0.35, 2)); g.save(); g.translate(X + w1 + 50, Y - 24); const sc = 1 + 0.22 * (1 - eOut(b)) + 0.1 * pulse; g.scale(sc, sc); g.globalAlpha = b; g.fillStyle = "#3B6E9B"; g.fillText("ben", -50, 24); g.restore(); }
    if (c > 0) { g.globalAlpha = c; g.font = "italic 400 34px 'Source Serif 4'"; g.fillStyle = "#5a3b2a"; g.fillText("в саду", X + 4, Y + 50 + (1 - c) * 6); }
    g.restore();
  }

  // ---------------- frame ----------------
  const work = canvas(), wg = work.getContext("2d", { willReadFrequently: true });
  function frame(t) {
    wg.setTransform(1, 0, 0, 1, 0, 0); wg.globalAlpha = 1;
    wg.drawImage(BG, 0, 0);
    const dap = dapple(t), dd = dap.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, W, H).data;
    // dappled sun on the background (multiply-ish: light pools on the right/terrace)
    wg.save(); wg.globalCompositeOperation = "soft-light"; wg.globalAlpha = 0.55; wg.drawImage(dap, 0, 0); wg.restore();
    // figure
    const img = wg.getImageData(0, 0, W, H);
    shadeFigure(img, dd, t);
    wg.putImageData(img, 0, 0);
    // hair strands: combed from the hairline toward the bun, never crossing
    wg.save(); wg.lineCap = "round"; const rh = U.mulberry32(31);
    path(wg, SHP.hair); wg.clip();
    for (let i = 0; i < 90; i++) {
      const a = Math.PI * (0.35 + 1.25 * (i / 90)) + (rh() - 0.5) * 0.03, x0 = 600 + Math.cos(a - 0.22) * 54, y0 = 236 + Math.sin(a - 0.22) * 64;
      const ex = 574 + Math.cos(a) * 14, ey = 208 + Math.sin(a) * 12, mx = (x0 + ex) / 2, my = (y0 + ey) / 2, cx = mx + (mx - 600) * 0.25, cy = my + (my - 236) * 0.25;
      const lit = clamp(Math.cos(a) * 0.8 - Math.sin(a) * 0.5, 0, 1);
      wg.strokeStyle = lit > 0.25 ? `rgba(206,150,96,${0.12 + 0.35 * lit})` : `rgba(16,8,3,${0.18 + 0.1 * rh()})`; wg.lineWidth = 0.5 + rh() * 0.8;
      wg.beginPath(); wg.moveTo(x0, y0); wg.quadraticCurveTo(cx, cy, ex, ey); wg.stroke();
    }
    wg.restore();
    // bodice lacing: eyelets and a criss-cross cord down the centre back
    { wg.save(); const cx = 584; let prev = null;
      for (let k = 0; k < 10; k++) { const y = 512 + k * 22, dx = 10 - k * 0.3;
        for (const s of [-1, 1]) { wg.fillStyle = "rgba(30,6,4,0.8)"; wg.beginPath(); wg.arc(cx + s * dx, y, 2.6, 0, 7); wg.fill(); wg.strokeStyle = "rgba(220,170,110,0.6)"; wg.lineWidth = 0.8; wg.beginPath(); wg.arc(cx + s * dx, y, 3.4, 0, 7); wg.stroke(); }
        if (k < 9) { const y2 = y + 22; for (const [a, b] of [[-1, 1], [1, -1]]) { wg.strokeStyle = "rgba(236,214,170,0.85)"; wg.lineWidth = 1.6; wg.beginPath(); wg.moveTo(cx + a * dx, y); wg.lineTo(cx + b * (dx - 0.3), y2); wg.stroke(); wg.strokeStyle = "rgba(80,50,30,0.5)"; wg.lineWidth = 0.6; wg.beginPath(); wg.moveTo(cx + a * dx + 0.8, y + 1); wg.lineTo(cx + b * (dx - 0.3) + 0.8, y2 + 1); wg.stroke(); } } }
      wg.restore(); }
    // loose wisps at the nape
    wg.save(); wg.lineCap = "round"; const rw = U.mulberry32(8);
    for (let i = 0; i < 9; i++) { const x0 = 584 + rw() * 36, y0 = 292 + rw() * 10; wg.strokeStyle = `rgba(${60 + rw() * 60},${36 + rw() * 30},20,${0.35 + rw() * 0.3})`; wg.lineWidth = 0.6 + rw() * 0.6; wg.beginPath(); wg.moveTo(x0, y0); wg.quadraticCurveTo(x0 + (rw() - 0.5) * 14, y0 + 10, x0 + (rw() - 0.5) * 10 + Math.sin(t * 1.5 + i) * 1.5, y0 + 14 + rw() * 10); wg.stroke(); }
    wg.restore();
    // gathered neckline of the chemise: a soft lit edge with small pleats
    { const nl = spline([[540, 338], [570, 358], [600, 384], [636, 406], [676, 420], [718, 426]], 10);
      wg.save(); wg.lineCap = "round";
      wg.strokeStyle = "rgba(255,248,232,0.55)"; wg.lineWidth = 2.2; path(wg, nl, false); wg.stroke();
      for (let k = 2; k < nl.length - 2; k += 2) { const [x, y] = nl[k]; wg.strokeStyle = "rgba(90,80,70,0.30)"; wg.lineWidth = 1.2; wg.beginPath(); wg.moveTo(x, y + 2); wg.lineTo(x - 2, y + 9 + (k % 4)); wg.stroke(); }
      wg.restore(); }
    // vine canopy and grapes in front
    R.seed(101);
    const leaves = [[560, 20, 1.3, -0.7, 0], [470, 70, 1.2, 0.4, 0], [360, 30, 1.4, -0.2, 0], [240, 60, 1.3, 0.7, 0], [110, 30, 1.5, 0.1, 0], [40, 170, 1.3, -0.5, 0], [650, 30, 1.2, 0.5, 1], [720, 74, 1.0, -0.3, 1], [790, 26, 1.3, 0.2, 1], [930, 60, 1.2, -0.6, 1], [990, 16, 1.4, 0.4, 1], [1060, 84, 1.0, 0.9, 1], [1150, 36, 1.3, -0.2, 1], [1236, 100, 1.1, 0.5, 1], [962, 146, 0.85, -0.4, 1], [1112, 174, 0.75, 0.2, 1], [818, 150, 0.7, -0.8, 1]];
    for (const [x, y, s, r0, lit] of leaves) { const sw = 0.05 * Math.sin(t * 1.1 + x * 0.01) + 0.03 * Math.sin(t * 2.3 + y); wg.save(); vineLeaf(wg, x + 6 * Math.sin(t * 0.8 + x), y + 3 * Math.sin(t * 0.9 + y), s * (lit ? 1 : 0.85), Math.PI + r0 * 0.6 + sw, lit, x); wg.restore(); }
    // vine stem
    wg.strokeStyle = "#4a3a22"; wg.lineWidth = 7; wg.beginPath(); wg.moveTo(560, 0); wg.bezierCurveTo(700, 90, 820, 40, 1280, 60); wg.stroke();
    grapes(wg, 872, 92 + Math.sin(t * 1.3) * 1.5, 0.04 * Math.sin(t * 1.2), t);
    // light motes drifting in the sun
    wg.save(); wg.globalCompositeOperation = "screen"; const rm = U.mulberry32(5);
    for (let i = 0; i < 26; i++) { const x = 700 + rm() * 560 + Math.sin(t * 0.5 + i) * 20, y = ((rm() * 600 + t * (8 + rm() * 10)) % 640) + 40, r = 1 + rm() * 2.2; const gr2 = wg.createRadialGradient(x, y, 0, x, y, r * 3); gr2.addColorStop(0, "rgba(255,240,200,0.55)"); gr2.addColorStop(1, "rgba(255,240,200,0)"); wg.fillStyle = gr2; wg.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
    wg.restore();
    glPaint(work);
    // gentle push-in
    const z = 1 + 0.04 * ease(seg(t, 0, 9));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.save(); ctx.translate(640, 300); ctx.scale(z, z); ctx.translate(-640, -300); ctx.drawImage(glc, 0, 0); ctx.restore();
    text(ctx, t);
  }
  window.SCENE = { dur: 9, build, frame };
})();
