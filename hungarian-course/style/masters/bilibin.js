/* Ivan Bilibin manner: ink contour, flat watercolour washes, ornamental frame with klejma, ribbon clouds, herringbone spruces. */
(function () {
  "use strict";
  const { W, H, R, clamp, lerp, smooth, ease, eOut, seg, noise, fbm, hex, mix, rgba, jit, canvas, layer, rough, spline, path, rect, bbox, ellipse, ribbon } = U;
  const out = document.getElementById("out"), ctx = out.getContext("2d");
  const INK = "#1d1712";
  const C = {
    paper: "#efe3c3", sky0: "#c4d3c0", sky1: "#f0e1a6", cloud: "#f6efd8", cloudSh: "#d9cdb4",
    far: "#7f9784", forest: "#3f5c48", spruce: "#2f4a38", spruceL: "#56744f", meadow: "#b3b25f", meadowD: "#86964a", grass: "#5f7d3a", grassL: "#93a552",
    log: "#b98a4f", logD: "#8a6234", roof: "#8f7c58", roofD: "#6f5f43", gable: "#c9a061", red: "#b03a2a", redD: "#8a2a20", ochre: "#d0a24a", green: "#4d6e3c", blue: "#4f6f8c",
    path: "#dcc58e", white: "#f4eedc", skin: "#e9c39c", hair: "#5a3820", birch: "#f2ede0",
  };
  const PIC = { x0: 206, y0: 50, x1: 1074, y1: 670 };

  // ---------- primitives ----------
  function ink(g, pts, w = 1.6, closed = true, col = INK, amp = 0.35) {
    const p = amp > 0 ? rough(pts, amp, 0.09, closed, R.rr(0, 99), 2.5) : pts;
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = "round"; g.lineJoin = "round"; path(g, p, closed); g.stroke();
  }
  function wash(g, pts, col, o = {}) {
    const bb = bbox(pts), A = Math.max(1, (bb[2] - bb[0]) * (bb[3] - bb[1]));
    g.save(); path(g, pts);
    if (o.grad) { const [x0, y0, x1, y1, a, b] = o.grad; const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, rgba(a)); gr.addColorStop(1, rgba(b)); g.fillStyle = gr; }
    else g.fillStyle = rgba(col);
    g.fill(); g.clip();
    const n = Math.min(36, 2 + A / 1800) | 0;
    for (let i = 0; i < n; i++) {
      const x = R.rr(bb[0], bb[2]), y = R.rr(bb[1], bb[3]), r = R.rr(8, Math.max(14, Math.sqrt(A) * 0.45));
      const c = R.r() < 0.5 ? mix(col, "#ffffff", 0.18) : mix(col, "#2a1a10", 0.14);
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(c, o.var ?? 0.12)); gr.addColorStop(1, rgba(c, 0));
      g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    if (o.shade) { const [x0, y0, x1, y1, a] = o.shade; const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, rgba("#2a1a10", 0)); gr.addColorStop(1, rgba("#2a1a10", a)); g.fillStyle = gr; g.fillRect(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]); }
    g.lineWidth = o.edgeW ?? 3.2; g.strokeStyle = rgba(mix(col, "#2a1508", 0.4), o.edge ?? 0.22); path(g, pts); g.stroke();
    g.restore();
  }
  function shape(g, pts, col, w = 1.6, o = {}) { wash(g, pts, col, o); ink(g, pts, w, true, INK, o.amp ?? 0.35); }
  function line(g, x0, y0, x1, y1, w = 1.2) { ink(g, [[x0, y0], [x1, y1]], w, false, INK, 0.25); }
  function circ(g, x, y, r, col, w = 1.2) { const p = ellipse(x, y, r, r, Math.max(10, r * 2 | 0)); if (col) wash(g, p, col, { edgeW: 1.5 }); ink(g, p, w, true, INK, 0.15); }

  // ---------- paper ----------
  function paperTex() {
    const c = canvas(), g = c.getContext("2d"), im = g.createImageData(W, H), d = im.data, r = U.mulberry32(9);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4;
      const v = 0.5 + 0.5 * fbm(x * 0.012, y * 0.012, 3), f = 0.5 + 0.5 * noise(x * 0.35, y * 0.05), s = r();
      const m = 244 + 11 * v - 10 * Math.pow(f, 6) - 9 * s * s;
      d[k] = m; d[k + 1] = m - 2; d[k + 2] = m - 7; d[k + 3] = 255;
    }
    g.putImageData(im, 0, 0); return c;
  }

  // ---------- trees ----------
  function spruce(g, x, yb, h, w, o = {}) {
    const col = o.col || C.spruce, lit = o.lit || C.spruceL, tiers = o.tiers || Math.max(5, Math.round(h / 26));
    // trunk
    shape(g, [[x - w * 0.06, yb], [x - w * 0.03, yb - h * 0.9], [x + w * 0.03, yb - h * 0.9], [x + w * 0.06, yb]], "#5e4128", 1.3);
    for (let i = 0; i < tiers; i++) {
      const k = i / tiers, yc = yb - h * 0.1 - k * h * 0.86, hw = w * (1 - k * 0.92) * (0.9 + 0.1 * Math.sin(i * 2.1)), th = h * 0.86 / tiers * 1.75;
      const top = [x, yc - th], pts = [top];
      const teeth = Math.max(4, Math.round(hw / 6));
      // right side droop, toothed lower edge right->left
      pts.push([x + hw * 0.55, yc - th * 0.35], [x + hw, yc + th * 0.12]);
      for (let j = 1; j <= teeth * 2; j++) {
        const u = j / (teeth * 2), xx = x + hw - u * hw * 2, sag = Math.sin(u * Math.PI) * th * 0.18;
        pts.push([xx, yc + th * 0.12 - sag + (j % 2 ? th * 0.12 : -th * 0.02)]);
      }
      pts.push([x - hw * 0.55, yc - th * 0.35]);
      wash(g, pts, col, { edgeW: 2, var: 0.1, shade: [x, yc - th, x, yc + th * 0.2, 0.25] });
      // lit herringbone needles
      g.save(); path(g, pts); g.clip();
      for (let s = -1; s <= 1; s += 2) for (let j = 0; j < hw / 4; j++) {
        const xx = x + s * (4 + j * 4), yy = yc - th * 0.8 + j * (th * 0.9) / (hw / 4) + 3;
        g.strokeStyle = rgba(lit, 0.9); g.lineWidth = 1.1;
        g.beginPath(); g.moveTo(xx - s * 3, yy - 4); g.lineTo(xx + s * 2, yy + 4); g.stroke();
      }
      g.restore();
      ink(g, pts, 1.3, true, INK, 0.2);
      // central rib & needle hatching (ёлочка)
      g.strokeStyle = INK; g.lineWidth = 0.8;
      for (let s = -1; s <= 1; s += 2) for (let j = 1; j < hw / 5.5; j++) {
        const xx = x + s * j * 5.5, yy = yc - th * 0.75 + (j * 5.5 / hw) * th * 0.85;
        g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + s * 2.5, yy + 5); g.stroke();
      }
    }
    // tip
    ink(g, [[x, yb - h - 6], [x, yb - h * 0.9]], 1.2, false);
  }
  function farForest(g, y, col, hgt, step, sd) {
    R.seed(sd);
    for (let x = PIC.x0 - 20; x < PIC.x1 + 20; x += step * R.rr(0.7, 1.1)) {
      const h = hgt * R.rr(0.7, 1.25), w = h * 0.32, pts = [[x, y - h]];
      const n = 6;
      for (let i = 1; i <= n; i++) { const k = i / n; pts.push([x + w * k * 0.95, y - h + h * k - (i % 2 ? 0 : h * 0.08)]); }
      pts.push([x + w, y + 20], [x - w, y + 20]);
      for (let i = n; i >= 1; i--) { const k = i / n; pts.push([x - w * k * 0.95, y - h + h * k - (i % 2 ? 0 : h * 0.08)]); }
      wash(g, pts, jit(col, 5), { edgeW: 2, var: 0.08 });
      ink(g, pts, 1.1, true, INK, 0.15);
    }
  }
  function birch(g, x, yb, h) {
    R.seed(31);
    const trunk = [[x - 7, yb], [x - 5, yb - h * 0.5], [x - 2, yb - h], [x + 2, yb - h], [x + 4, yb - h * 0.5], [x + 7, yb]];
    // weeping birch: arching branches carrying fringed curtains of leaves
    const masses = [];
    for (let i = 0; i < 10; i++) {
      const k = 0.38 + 0.58 * (i / 9), yy = yb - h * k, s = i % 2 ? 1 : -1, reach = (1 - k) * 60 + 30;
      masses.push({ s, y: yy, reach: reach * R.rr(0.8, 1.1), drop: R.rr(40, 70) * (1.2 - k * 0.5) });
    }
    shape(g, trunk, C.birch, 1.5);
    for (let i = 0; i < 20; i++) { const yy = yb - R.rr(0.04, 0.96) * h, ww = R.rr(4, 9), xx = x + R.rr(-3, 3); g.fillStyle = INK; g.beginPath(); g.ellipse(xx, yy, ww / 2, 1.4, R.rr(-0.2, 0.2), 0, 7); g.fill(); }
    for (const m of masses.sort((a, b) => a.y - b.y)) {
      const x0 = x + m.s * 2, x1 = x + m.s * m.reach, ytop = m.y - 16;
      const arc = spline([[x0, m.y], [lerp(x0, x1, 0.45), ytop], [x1, m.y + 6]], 10);
      // curtain: top follows the arc, bottom is a fringe of hanging tips
      const top = arc.map(([px, py]) => [px, py - 4]);
      const n = Math.max(5, Math.round(Math.abs(x1 - x0) / 7)), bot = [];
      for (let j = n; j >= 0; j--) { const u = j / n, ax = lerp(x0, x1, u), ay = arc[Math.round(u * (arc.length - 1))][1]; const d = m.drop * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 1.15))) * (j % 2 ? 1 : 0.82); bot.push([ax, ay + d]); }
      const p = top.concat(bot);
      shape(g, p, mix(C.grassL, "#c9c46a", R.r() * 0.6), 1.1, { shade: [x0, ytop, x0, m.y + m.drop, 0.25] });
      g.save(); path(g, p); g.clip(); g.strokeStyle = INK; g.lineWidth = 0.7;
      for (let j = 1; j < n; j++) { const u = j / n, ax = lerp(x0, x1, u), ay = arc[Math.round(u * (arc.length - 1))][1]; for (let yy = ay + 6; yy < ay + m.drop; yy += 7) { g.beginPath(); g.moveTo(ax - 2, yy - 2); g.quadraticCurveTo(ax, yy + 3, ax + 2, yy - 2); g.stroke(); } }
      g.restore();
      ink(g, arc, 1.2, false);
    }
  }

  // ribbon cloud: a long wavy band whose ends roll up into spirals
  function cloudBand(cx, cy, w, th, sd, dir = 1) {
    R.seed(sd);
    const pts = [];
    const spiral = (ox, oy, r0, s, turns, rev) => { const o = []; for (let i = 0; i <= 24; i++) { const k = i / 24, a = s * (Math.PI * 0.5 + k * Math.PI * 2 * turns), r = r0 * (1 - k * 0.75); o.push([ox + Math.cos(a) * r * (rev ? 1 : 1), oy - Math.sin(a) * r]); } return o; };
    const r0 = th * 0.9;
    const left = spiral(cx - w / 2, cy - r0 * 0.1, r0, -1, 1.1).reverse();
    const mid = []; for (let i = 1; i < 30; i++) { const k = i / 30; mid.push([cx - w / 2 + k * w, cy + r0 + Math.sin(k * Math.PI * 2.2 + sd) * th * 0.25 - Math.sin(k * Math.PI) * th * 0.6]); }
    const right = spiral(cx + w / 2, cy - r0 * 0.1, r0, 1, 1.1).map(([x, y]) => [x, y]);
    // right spiral should start at the bottom (joining the band) and curl inward
    const rs = []; for (let i = 0; i <= 24; i++) { const k = i / 24, a = -Math.PI * 0.5 + k * Math.PI * 2 * 1.05, r = r0 * (1 - k * 0.72); rs.push([cx + w / 2 + Math.cos(a) * r, cy - r0 * 0.1 - Math.sin(a) * r]); }
    const ls = []; for (let i = 0; i <= 24; i++) { const k = i / 24, a = -Math.PI * 0.5 - k * Math.PI * 2 * 1.05, r = r0 * (1 - k * 0.72); ls.push([cx - w / 2 + Math.cos(a) * r, cy - r0 * 0.1 - Math.sin(a) * r]); }
    const cl = ls.reverse().concat(mid, rs);
    return cl;
  }
  function cloudSprite(w, th, sd, n = 2) {
    const pad = 40, L = layer(w + 2 * pad + th * 4, th * 6 + 2 * pad), g = L.g;
    const cx = L.c.width / 2, cy = L.c.height / 2;
    for (let b = 0; b < n; b++) {
      const bw = w * (b ? 0.62 : 1), by = cy + (b ? -th * 1.25 : 0), bx = cx + (b ? w * 0.12 * (sd % 2 ? 1 : -1) : 0);
      const cl = cloudBand(bx, by, bw, th * (b ? 0.8 : 1), sd + b * 7);
      const rib = ribbon(cl, (k) => th * 1.25 * Math.pow(Math.sin(Math.PI * k), 0.35) + 1);
      shape(g, rib, b ? "#fbf6e6" : C.cloud, 1.4, { var: 0.04, shade: [0, by - th, 0, by + th * 1.6, 0.16] });
      // inner contour lines along the band
      { const inner = ribbon(cl.slice(16, cl.length - 16), () => th * 0.62), hn = inner.length / 2 | 0; ink(g, inner.slice(0, hn), 0.7, false, rgba("#5a4a3a", 0.8), 0.15); ink(g, inner.slice(hn), 0.7, false, rgba("#5a4a3a", 0.8), 0.15); }
    }
    return { c: L.c, ox: cx, oy: cy };
  }

  // ---------- house ----------
  function house(g) {
    const X0 = 520, X1 = 760, YT = 392, YB = 540, AP = [640, 238];
    // side wall receding to the right
    const sw = [[X1, YT], [858, YT - 10], [858, YB - 14], [X1, YB]];
    shape(g, sw, mix(C.log, "#5a3a20", 0.18), 1.5);
    for (let i = 1; i < 11; i++) { const k = i / 11; ink(g, [[X1, lerp(YT, YB, k)], [858, lerp(YT - 10, YB - 14, k)]], 1, false); }
    // side window
    shape(g, [[800, 440], [830, 437], [830, 474], [800, 476]], "#3a3428", 1.3); shape(g, [[795, 434], [835, 430], [835, 437], [795, 441]], C.red, 1.1);
    // side roof slope
    const sr = [[AP[0], AP[1]], [728, AP[1] - 12], [884, YT - 16], [X1 + 24, YT + 6]];
    shape(g, sr, C.roof, 1.6, { shade: [AP[0], AP[1], 884, YT, 0.18] });
    g.save(); path(g, sr); g.clip(); for (let i = 1; i < 16; i++) { const k = i / 16; ink(g, [[lerp(AP[0], 728, k), lerp(AP[1], AP[1] - 12, k)], [lerp(X1 + 24, 884, k), lerp(YT + 6, YT - 16, k)]], 0.9, false); } g.restore();
    // chimney
    shape(g, [[800, 300], [822, 297], [822, 262], [800, 264]], "#c9b48a", 1.3); shape(g, [[796, 266], [826, 262], [826, 256], [796, 259]], "#8d7a5b", 1.2);
    // front log wall
    shape(g, rect(X0, YT, X1, YB), C.log, 1.6);
    const rows = 11;
    for (let i = 0; i < rows; i++) {
      const y0 = lerp(YT, YB, i / rows), y1 = lerp(YT, YB, (i + 1) / rows), hh = y1 - y0;
      g.save(); g.beginPath(); g.rect(X0, y0, X1 - X0, hh); g.clip();
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, rgba("#fff0c8", 0.18)); gr.addColorStop(0.6, rgba("#000", 0)); gr.addColorStop(1, rgba("#3a2410", 0.25)); g.fillStyle = gr; g.fillRect(X0, y0, X1 - X0, hh); g.restore();
      if (i) ink(g, [[X0, y0], [X1, y0]], 1.1, false);
      // log ends on both corners
      for (const xe of [X0 - 9, X1 + 9]) { const p = ellipse(xe, y0 + hh / 2, 8, hh / 2 + 0.5, 20); wash(g, p, "#d8b07a", { edgeW: 1.5 }); ink(g, p, 1.1); circ(g, xe, y0 + hh / 2, 3.2, null, 0.7); }
      // wood grain flecks
      for (let k = 0; k < 6; k++) { const xx = R.rr(X0 + 8, X1 - 20); line(g, xx, y0 + hh * 0.5 + R.rr(-2, 2), xx + R.rr(8, 20), y0 + hh * 0.5 + R.rr(-2, 2), 0.6); }
    }
    // gable
    const gab = [[AP[0], AP[1] + 14], [X1 + 8, YT], [X0 - 8, YT]];
    shape(g, gab, C.gable, 1.5);
    g.save(); path(g, gab); g.clip(); for (let x = X0; x < X1; x += 11) ink(g, [[x, AP[1]], [x, YT]], 0.9, false); g.restore();
    // attic window (rounded top)
    const aw = [[628, 350], [628, 322], ...ellipse(640, 322, 12, 14, 12, Math.PI, Math.PI * 2).slice(1), [652, 350]];
    shape(g, aw, "#3a3428", 1.4);
    shape(g, [[622, 350], [658, 350], [660, 357], [620, 357]], C.red, 1.2);
    const awf = [[620, 324], ...ellipse(640, 322, 20, 24, 14, Math.PI, Math.PI * 2), [660, 324], [656, 322], ...ellipse(640, 322, 16, 19, 14, Math.PI * 2, Math.PI).slice(1), [624, 324]];
    shape(g, awf, C.ochre, 1.1);
    // bargeboards (prichelina) with hanging teardrops
    for (const s of [-1, 1]) {
      const a = [AP[0], AP[1] - 4], b = [AP[0] + s * 156, YT + 10];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * s, ny = dx / L * s;
      const bw = 14, board = [a, b, [b[0] + nx * bw * s * s, b[1] + Math.abs(ny) * bw], [a[0], a[1] + bw]];
      const pb = [[a[0], a[1]], [b[0], b[1]], [b[0] - s * 3, b[1] + bw], [a[0], a[1] + bw * 1.2]];
      shape(g, pb, C.red, 1.5);
      const n = 11;
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n, x = lerp(pb[3][0], pb[2][0], k), y = lerp(pb[3][1], pb[2][1], k);
        const drop = [[x - 5, y - 1], [x + 5, y - 1], ...ellipse(x, y + 7, 5, 6, 10, 0, Math.PI).slice(1, 10), [x - 5, y - 1]];
        const p = [[x - 6, y - 1], [x + 6, y - 1], [x + 3, y + 8], [x, y + 13], [x - 3, y + 8]];
        shape(g, p, C.ochre, 1);
      }
      // dots on board
      for (let i = 0; i < 9; i++) { const k = (i + 0.5) / 9; circ(g, lerp(a[0], b[0], k) - s * 1, lerp(a[1], b[1], k) + 7, 2, C.white, 0.8); }
    }
    // towel board (polotentse) with sun rosette
    shape(g, [[633, 250], [647, 250], [647, 300], [640, 310], [633, 300]], C.red, 1.3);
    circ(g, 640, 274, 9, C.ochre, 1.1); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; line(g, 640, 274, 640 + Math.cos(a) * 9, 274 + Math.sin(a) * 9, 0.8); }
    // ridge horse (konyok)
    const horse = [[640, 236], [646, 222], [652, 214], [660, 212], [664, 206], [668, 212], [664, 218], [656, 222], [652, 234]];
    shape(g, horse, C.roofD, 1.4);
    // eave board front
    shape(g, [[X0 - 14, YT], [X1 + 14, YT], [X1 + 14, YT + 8], [X0 - 14, YT + 8]], C.roofD, 1.4);
    // windows with nalichniki
    for (const wx of [548, 692]) window_(g, wx, 424);
    // porch canopy & door
    door0 = { x0: 621, x1: 659, y0: 452, y1: 540 };
    shape(g, rect(615, 446, 665, 540), "#6b4a2b", 1.4); // door frame
    shape(g, rect(door0.x0, door0.y0, door0.x1, door0.y1), "#2a2018", 1.2); // dark doorway (door drawn per frame)
    // steps
    shape(g, [[604, 540], [676, 540], [682, 549], [598, 549]], "#a57f52", 1.3);
    shape(g, [[596, 549], [684, 549], [690, 558], [590, 558]], "#a57f52", 1.3);
    // posts and canopy are drawn in the porch layer (above door)
  }
  let door0;
  function porch(g) {
    for (const px of [600, 680]) { shape(g, rect(px - 4, 470, px + 4, 548), "#8a6234", 1.3); for (let y = 482; y < 540; y += 14) shape(g, ellipse(px, y, 5.5, 3.5, 14), "#a57f52", 1); }
    const can = [[640, 430], [700, 472], [580, 472]];
    shape(g, can, C.red, 1.5);
    shape(g, [[640, 438], [688, 470], [592, 470]], C.gable, 1.1);
    circ(g, 640, 456, 6, C.ochre, 1);
    for (let i = 0; i < 9; i++) { const x = 586 + i * 13.5; shape(g, [[x - 5, 472], [x + 5, 472], [x, 481]], C.ochre, 0.9); }
  }
  function window_(g, x, y) {
    const w = 40, h = 44;
    // shutters
    for (const s of [-1, 1]) {
      const sx = s < 0 ? x - 18 : x + w + 2;
      shape(g, rect(sx, y, sx + 16, y + h), C.green, 1.2);
      // painted flower
      circ(g, sx + 8, y + 16, 4, C.red, 0.8); line(g, sx + 8, y + 20, sx + 8, y + 36, 0.8);
      shape(g, [[sx + 8, y + 30], [sx + 3, y + 26], [sx + 5, y + 32]], C.ochre, 0.6); shape(g, [[sx + 8, y + 28], [sx + 13, y + 24], [sx + 11, y + 30]], C.ochre, 0.6);
    }
    shape(g, rect(x, y, x + w, y + h), "#efe4bf", 1.3); // frame
    shape(g, rect(x + 4, y + 4, x + w - 4, y + h - 4), "#5c6e78", 1.1, { shade: [x, y, x + w, y + h, 0.4] });
    line(g, x + w / 2, y + 4, x + w / 2, y + h - 4, 1.4); line(g, x + 4, y + 18, x + w - 4, y + 18, 1.4);
    // kokoshnik top
    const top = [[x - 6, y - 2], [x + w + 6, y - 2], [x + w + 6, y - 8], ...ellipse(x + w / 2, y - 8, w / 2 + 6, 16, 16, 0, -Math.PI).slice(1), [x - 6, y - 8]];
    shape(g, top, C.red, 1.3); circ(g, x + w / 2, y - 12, 5, C.ochre, 0.9);
    // sill
    shape(g, [[x - 6, y + h], [x + w + 6, y + h], [x + w + 2, y + h + 8], [x - 2, y + h + 8]], C.red, 1.2);
    for (let i = 0; i < 4; i++) shape(g, [[x + 2 + i * 11, y + h + 8], [x + 10 + i * 11, y + h + 8], [x + 6 + i * 11, y + h + 15]], C.ochre, 0.8);
  }
  function fence(g, x0, x1, yb, sd) {
    R.seed(sd);
    for (let x = x0; x < x1; x += 9) {
      const h = R.rr(40, 48), p = [[x - 3.5, yb], [x - 3.5, yb - h], [x, yb - h - 7], [x + 3.5, yb - h], [x + 3.5, yb]];
      shape(g, p, mix(C.roof, "#c0a476", R.r() * 0.5), 1);
    }
    shape(g, [[x0 - 4, yb - 30], [x1, yb - 30], [x1, yb - 25], [x0 - 4, yb - 25]], C.roofD, 1);
  }

  // ---------- ground & foliage ----------
  function tuft(g, x, y, h, n, col) {
    for (let i = 0; i < n; i++) {
      const a = (i / (n - 1 || 1) - 0.5) * 1.2 + R.rr(-0.15, 0.15), hh = h * R.rr(0.6, 1.1);
      const pts = spline([[x, y], [x + Math.sin(a) * hh * 0.4, y - hh * 0.55], [x + Math.sin(a) * hh * 0.9 + a * 6, y - hh]], 6);
      const rib = ribbon(pts, (t) => 4.2 * (1 - t) + 0.3);
      wash(g, rib, jit(col, 8), { edgeW: 1, var: 0 }); ink(g, rib, 0.8, true, INK, 0);
    }
  }
  function flower(g, x, y, r, col) {
    line(g, x, y + r, x, y + r * 4, 0.9);
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 - Math.PI / 2; const p = ellipse(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.6, r * 0.6, 10); wash(g, p, col, { edgeW: 1, var: 0 }); ink(g, p, 0.8, true, INK, 0); }
    circ(g, x, y, r * 0.4, C.ochre, 0.7);
  }
  function mushroom(g, x, y, s) {
    shape(g, [[x - 4 * s, y], [x - 3 * s, y - 12 * s], [x + 3 * s, y - 12 * s], [x + 4 * s, y]], C.white, 1.1);
    const cap = [[x - 13 * s, y - 11 * s], ...ellipse(x, y - 11 * s, 13 * s, 10 * s, 16, Math.PI, Math.PI * 2).slice(1), [x + 13 * s, y - 11 * s]];
    shape(g, cap, C.red, 1.2);
    for (const [dx, dy] of [[-6, -15], [0, -18], [6, -14], [-2, -13], [9, -12]]) circ(g, x + dx * s, y + dy * s, 1.4 * s, C.white, 0.6);
  }

  // ---------- frame ----------
  function kokoshnikPanel(x0, y0, x1, y1) {
    const cx = (x0 + x1) / 2, w = x1 - x0, ah = w * 0.42, pts = [[x0, y1], [x0, y0 + ah]];
    // ogee arch
    for (let i = 0; i <= 20; i++) { const u = i / 20, xx = lerp(x0, cx, u); const yy = y0 + ah - ah * (u < 0.6 ? Math.sin(u / 0.6 * Math.PI / 2) * 0.8 : 0.8 + 0.2 * ((u - 0.6) / 0.4) ** 0.5); pts.push([xx, yy]); }
    pts.push([cx, y0 - 8]);
    for (let i = 20; i >= 0; i--) { const u = i / 20, xx = lerp(x1, cx, u); const yy = y0 + ah - ah * (u < 0.6 ? Math.sin(u / 0.6 * Math.PI / 2) * 0.8 : 0.8 + 0.2 * ((u - 0.6) / 0.4) ** 0.5); pts.push([xx, yy]); }
    pts.push([x1, y1]);
    return pts;
  }
  function band(g, x0, y0, x1, y1, horiz) {
    // ornament band: ochre ground, green rhombi with red centres, black wolf-teeth on inner edge
    shape(g, rect(x0, y0, x1, y1), C.ochre, 1.6, { var: 0.05 });
    const L = horiz ? x1 - x0 : y1 - y0, th = horiz ? y1 - y0 : x1 - x0, n = Math.round(L / (th * 1.6));
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n, cx = horiz ? lerp(x0, x1, k) : (x0 + x1) / 2, cy = horiz ? (y0 + y1) / 2 : lerp(y0, y1, k), r = th * 0.36;
      const rh = [[cx, cy - r], [cx + r * 1.15, cy], [cx, cy + r], [cx - r * 1.15, cy]];
      shape(g, rh, C.green, 1.1);
      shape(g, [[cx, cy - r * 0.45], [cx + r * 0.5, cy], [cx, cy + r * 0.45], [cx - r * 0.5, cy]], C.red, 0.9);
      // small crosses between
      const k2 = (i + 1) / n; if (i < n - 1) { const mx = horiz ? lerp(x0, x1, k2) : cx, my = horiz ? cy : lerp(y0, y1, k2); circ(g, mx, my, 2.6, C.red, 0.9); for (let a = 0; a < 4; a++) { const an = a * Math.PI / 2; line(g, mx + Math.cos(an) * 4, my + Math.sin(an) * 4, mx + Math.cos(an) * 8, my + Math.sin(an) * 8, 1); } }
    }
  }
  function klejmo(g, x0, y0, x1, y1, kind) {
    const pts = kokoshnikPanel(x0, y0, x1, y1);
    shape(g, pts, C.paper, 2, { var: 0 });
    g.save(); path(g, pts); g.clip();
    // sky + ground inside
    wash(g, rect(x0, y0 - 20, x1, y1), C.sky1, { grad: [0, y0, 0, y1 - 60, C.sky0, C.sky1], edge: 0 });
    const gy = y1 - 56;
    const hill = [[x0 - 5, gy + 8], ...spline([[x0, gy + 6], [x0 + 40, gy - 8], [x1 - 30, gy + 2], [x1, gy - 4]], 8), [x1 + 5, y1 + 5], [x0 - 5, y1 + 5]];
    shape(g, hill, C.meadow, 1.3);
    const cx = (x0 + x1) / 2;
    R.seed(kind * 13 + 1);
    if (kind === 0) { // fly agarics
      tuft(g, cx - 34, y1 - 10, 22, 4, C.grass); mushroom(g, cx - 12, y1 - 22, 2.1); mushroom(g, cx + 26, y1 - 16, 1.4); tuft(g, cx + 40, y1 - 6, 20, 4, C.grass); tuft(g, cx + 4, y1 - 4, 16, 3, C.grassL);
      flower(g, cx - 40, gy + 6, 4, C.blue);
    } else if (kind === 1) { // firebird-ish bird on a branch
      spruce(g, cx + 30, y1 - 20, 120, 34, { tiers: 6 });
      ink(g, spline([[x0 - 5, gy - 60], [cx - 20, gy - 70], [cx + 10, gy - 66]], 6), 2.4, false);
      bird(g, cx - 14, gy - 72);
      tuft(g, cx - 30, y1 - 6, 22, 4, C.grass);
    } else if (kind === 2) { // folk flower
      const sx = cx, sy = y1 - 8;
      ink(g, spline([[sx, sy], [sx - 6, sy - 60], [sx + 2, sy - 120]], 8), 2, false);
      for (const [lx, ly, s] of [[sx - 4, sy - 40, -1], [sx - 3, sy - 76, 1], [sx - 2, sy - 30, 1]]) { const lf = spline([[lx, ly], [lx + s * 16, ly - 18], [lx + s * 34, ly - 14], [lx + s * 18, ly - 4], [lx, ly]], 6); shape(g, lf, C.green, 1.1); ink(g, [[lx, ly], [lx + s * 26, ly - 12]], 0.7, false); }
      // tulip-like bloom
      const bx = sx + 2, by = sy - 130;
      shape(g, [[bx - 22, by - 6], [bx - 12, by - 30], [bx - 6, by - 14], [bx, by - 36], [bx + 6, by - 14], [bx + 12, by - 30], [bx + 22, by - 6], [bx + 10, by + 12], [bx - 10, by + 12]], C.red, 1.4);
      shape(g, [[bx - 9, by + 2], [bx, by - 16], [bx + 9, by + 2], [bx, by + 10]], C.ochre, 1);
      circ(g, bx, by - 3, 3, C.red, 0.8);
      tuft(g, sx - 26, y1 - 4, 18, 3, C.grass); tuft(g, sx + 28, y1 - 4, 18, 3, C.grass);
    } else { // little izba-less landscape: birch & spruce
      farForest(g, gy + 4, C.far, 40, 18, 77);
      shape(g, hill, C.meadow, 1.3);
      spruce(g, cx - 26, y1 - 14, 130, 36, { tiers: 6 });
      R.seed(5); tuft(g, cx + 20, y1 - 6, 20, 4, C.grass); mushroom(g, cx + 36, y1 - 18, 1.2);
    }
    g.restore();
    ink(g, pts, 2, true, INK, 0.2);
    // inner parallel line
    const inner = kokoshnikPanel(x0 + 5, y0 + 5, x1 - 5, y1 - 5);
    ink(g, inner, 0.8, true, INK, 0.1);
  }
  function bird(g, x, y) {
    const body = [[x - 14, y], [x - 8, y - 12], [x + 4, y - 14], [x + 12, y - 22], [x + 18, y - 20], [x + 14, y - 12], [x + 10, y + 2], [x - 2, y + 8]];
    const tail = spline([[x - 12, y + 2], [x - 34, y + 20], [x - 46, y + 46], [x - 30, y + 30], [x - 6, y + 8]], 6, false);
    shape(g, tail, C.red, 1.2); for (let i = 0; i < 3; i++) ink(g, [[x - 12, y + 4], [x - 26 - i * 6, y + 26 + i * 6]], 0.7, false);
    shape(g, body, C.ochre, 1.3);
    shape(g, [[x - 8, y - 4], [x + 6, y - 8], [x + 2, y + 4]], C.red, 1);
    circ(g, x + 14, y - 18, 1.4, INK, 0.5);
    shape(g, [[x + 18, y - 20], [x + 24, y - 18], [x + 18, y - 17]], C.ochre, 0.8);
    for (const dx of [-3, 3]) ink(g, [[x + dx, y + 6], [x + dx, y + 12]], 1.1, false);
  }

  // ---------- text cartouche ----------
  const CT = { x: 640, y: 82, w: 460, h: 100 };
  function cartouche(g) {
    const { x, y, w, h } = CT, x0 = x - w / 2, x1 = x + w / 2, y0 = y - h / 2, y1 = y + h / 2, c = 16;
    const pts = [[x0 + c, y0], [x1 - c, y0], [x1, y0 + c], [x1, y1 - c], [x1 - c, y1], [x0 + c, y1], [x0, y1 - c], [x0, y0 + c]];
    // rolled scroll ends: a cylinder with spiral caps
    for (const s of [-1, 1]) {
      const ex = s < 0 ? x0 - 4 : x1 + 4, rw = 15;
      const roll = [[ex - rw, y0 - 8], [ex + rw, y0 - 8], [ex + rw, y1 + 8], [ex - rw, y1 + 8]];
      shape(g, roll, C.red, 1.6, { shade: [ex - rw * s, 0, ex + rw * s, 0, 0.35] });
      for (let k = 1; k < 4; k++) ink(g, [[ex - rw + k * 7.5, y0 - 4], [ex - rw + k * 7.5, y1 + 4]], 0.6, false);
      for (const cy of [y0 - 8, y1 + 8]) {
        shape(g, ellipse(ex, cy, rw, 7, 20), C.ochre, 1.3);
        const sp = []; for (let q = 0; q <= 26; q++) { const a = q / 26 * Math.PI * 3.2, r = rw * (1 - q / 30); sp.push([ex + Math.cos(a) * r * s, cy + Math.sin(a) * r * 0.45]); }
        ink(g, sp, 0.9, false, INK, 0);
      }
      // little tassel-like ornament
      const tx = ex + s * (rw + 14);
      shape(g, [[ex + s * rw, y - 10], [tx, y - 4], [tx + s * 10, y], [tx, y + 4], [ex + s * rw, y + 10]], C.green, 1.2);
      circ(g, tx, y, 4, C.ochre, 0.9);
    }
    shape(g, pts, "#f4ead0", 2.2, { var: 0.04 });
    const ins = [[x0 + c + 6, y0 + 6], [x1 - c - 6, y0 + 6], [x1 - 6, y0 + c + 6], [x1 - 6, y1 - c - 6], [x1 - c - 6, y1 - 6], [x0 + c + 6, y1 - 6], [x0 + 6, y1 - c - 6], [x0 + 6, y0 + c + 6]];
    ink(g, ins, 1, true, INK, 0.1);
    for (const [cx, cy] of [[x0 + 12, y0 + 12], [x1 - 12, y0 + 12], [x0 + 12, y1 - 12], [x1 - 12, y1 - 12]]) circ(g, cx, cy, 3, C.red, 0.9);
  }
  function text(g, t) {
    const a1 = eOut(seg(t, 0.5, 1.1)), a2 = seg(t, T.v1 + 0.3, T.v1 + 0.7), a3 = eOut(seg(t, T.v1 + 0.9, T.v1 + 1.5));
    const pulse = Math.exp(-Math.pow((t - (T.v2 + 0.45)) / 0.35, 2)) + Math.exp(-Math.pow((t - (T.v1 + 0.45)) / 0.35, 2)) * 0.6;
    g.save();
    g.font = "64px Ruslan"; g.textBaseline = "alphabetic";
    const s1 = "a ház", s2 = "ba", w1 = g.measureText(s1).width, w2 = g.measureText(s2).width, x = CT.x - (w1 + w2) / 2, y = CT.y + 12;
    g.globalAlpha = a1; g.fillStyle = INK; g.fillText(s1, x, y);
    if (a2 > 0) {
      g.globalAlpha = a2; g.save(); g.translate(x + w1 + w2 / 2, y - 22); const sc = 1 + 0.12 * pulse + (1 - eOut(a2)) * 0.3; g.scale(sc, sc);
      g.fillStyle = "#2D6A4F"; g.fillText(s2, -w2 / 2, 22); g.restore();
    }
    g.globalAlpha = a3; g.font = "italic 400 26px 'Source Serif 4'"; g.fillStyle = "#4a3a2c"; g.textAlign = "center"; g.fillText("в дом", CT.x, CT.y + 40);
    g.restore();
  }

  // ---------- figure: girl in red sarafan, from behind ----------
  function girl(g, x, y, s, ph, walk) {
    const u = s;
    g.save(); g.translate(x, y);
    const bob = -Math.abs(Math.sin(ph)) * 1.5 * u * walk; g.translate(0, bob);
    const sw = Math.sin(ph) * 1.6 * u * walk;
    // feet (bast shoes)
    for (const k of [0, 1]) { const p = Math.sin(ph + k * Math.PI) * walk; const fx = (k ? 4 : -4) * u, fy = -1 * u - Math.max(0, p) * 2.5 * u; shape(g, ellipse(fx, fy, 3.4 * u, 2.2 * u, 12), "#b89a5e", 0.9); }
    // sleeves: wide white shirt sleeves with red embroidery
    for (const sd of [-1, 1]) {
      const a = Math.sin(ph + (sd > 0 ? 0 : Math.PI)) * 0.22 * walk + sd * 0.14;
      const sx = sd * 9.5 * u, sy = -76 * u, ex = sx + Math.sin(a) * 26 * u * sd + sd * 2 * u, ey = sy + Math.cos(a) * 26 * u;
      const arm = ribbon(spline([[sx, sy], [lerp(sx, ex, 0.5) + sd * 1.5 * u, lerp(sy, ey, 0.5)], [ex, ey]], 5), (t) => (8.5 + 2.5 * Math.sin(t * Math.PI) - 3 * t) * u);
      shape(g, arm, C.white, 1.1, { shade: [sx, sy, sx + sd * 8 * u, sy, 0.12] });
      const cuff = ribbon([[lerp(sx, ex, 0.86), lerp(sy, ey, 0.86)], [lerp(sx, ex, 0.97), lerp(sy, ey, 0.97)]], () => 6.4 * u);
      shape(g, cuff, C.red, 0.8);
      const sh = ribbon([[lerp(sx, ex, 0.08), lerp(sy, ey, 0.08)], [lerp(sx, ex, 0.22), lerp(sy, ey, 0.22)]], () => 10.5 * u);
      shape(g, sh, C.red, 0.8);
      circ(g, ex, ey + 2.4 * u, 2.5 * u, C.skin, 0.9);
    }
    // sarafan
    const sar = [[-8.5 * u, -79 * u], [8.5 * u, -79 * u], [12 * u, -50 * u], [19 * u + sw, -6 * u], [0, -3 * u], [-19 * u + sw, -6 * u], [-12 * u, -50 * u]];
    const sarS = spline(sar, 6, true);
    shape(g, sarS, C.red, 1.4, { shade: [6 * u, 0, 18 * u, 0, 0.3] });
    g.save(); path(g, sarS); g.clip();
    // two hem bands with ornament
    for (const [hy, hh, col] of [[-17, 13, C.ochre], [-26, 4, C.green]]) {
      const band = [[-24 * u + sw, hy * u], [24 * u + sw, hy * u], [24 * u + sw, (hy + hh) * u], [-24 * u + sw, (hy + hh) * u]];
      wash(g, band, col, { edgeW: 1, var: 0 }); ink(g, [[-24 * u + sw, hy * u], [24 * u + sw, hy * u]], 0.9, false); ink(g, [[-24 * u + sw, (hy + hh) * u], [24 * u + sw, (hy + hh) * u]], 0.9, false);
    }
    for (let i = -5; i <= 5; i++) { const hx = i * 4 * u + sw * 0.95; shape(g, [[hx, -14.5 * u], [hx + 1.9 * u, -10.5 * u], [hx, -6.5 * u], [hx - 1.9 * u, -10.5 * u]], i % 2 ? C.green : C.redD, 0.6); }
    // fold lines
    for (const fx of [-8, -2, 4, 9]) ink(g, [[fx * 0.55 * u, -62 * u], [fx * 1.05 * u + sw * 0.7, -27 * u]], 0.7, false);
    g.restore();
    // shirt at the shoulders, sarafan straps
    shape(g, [[-10 * u, -78 * u], [-7 * u, -85 * u], [7 * u, -85 * u], [10 * u, -78 * u], [6 * u, -76 * u], [-6 * u, -76 * u]], C.white, 1.1);
    for (const sd of [-1, 1]) shape(g, [[sd * 3.5 * u, -84 * u], [sd * 7.5 * u, -83 * u], [sd * 9.5 * u, -64 * u], [sd * 5.5 * u, -64 * u]], C.redD, 0.9);
    // head from behind: hair + red ornamented headband
    shape(g, ellipse(0, -93 * u, 7 * u, 8.4 * u, 20), C.hair, 1.2);
    for (let k = -2; k <= 2; k++) ink(g, [[k * 2.2 * u, -100 * u], [k * 2.8 * u, -87 * u]], 0.6, false);
    const hb = ribbon(ellipse(0, -93 * u, 7.4 * u, 6 * u, 14, Math.PI * 1.02, Math.PI * 1.98), () => 3.2 * u);
    shape(g, hb, C.red, 0.9);
    for (let k = 0; k < 5; k++) { const a = Math.PI * (1.15 + k * 0.17); circ(g, Math.cos(a) * 7.4 * u, -93 * u + Math.sin(a) * 6 * u, 0.8 * u, C.ochre, 0.4); }
    // ribbon ends hanging from the headband
    for (const sd of [-1, 1]) shape(g, [[sd * 1 * u, -88 * u], [sd * 3.5 * u + sw * 0.3, -70 * u], [sd * 1.5 * u + sw * 0.3, -69 * u], [0, -88 * u]], C.red, 0.7);
    // plait: alternating lobes, tapering, ends in a ribbon
    const n = 9, top = -86 * u, len = 48 * u;
    for (let i = 0; i < n; i++) {
      const k = i / n, yy = top + k * len, w = (3.2 - k * 1.4) * u, dx = Math.sin(i * 0.7 + ph * 0.4) * 0.4 * u * walk + (i % 2 ? 0.8 : -0.8) * u;
      shape(g, [[dx - w, yy], [dx + w * 0.4, yy - 1 * u], [dx + w, yy + 3.5 * u], [dx - w * 0.2, yy + len / n + 1.6 * u]], C.hair, 0.8);
    }
    const by = top + len;
    shape(g, [[-3 * u, by], [3 * u, by], [5 * u + sw * 0.4, by + 8 * u], [0, by + 5 * u], [-5 * u + sw * 0.4, by + 8 * u]], C.red, 0.8);
    g.restore();
  }

  // ---------- layers ----------
  let L = {};
  const T = { v1: 1.3, v2: 6.1 };
  const PATHPTS = spline([[540, 790], [560, 690], [660, 625], [692, 588], [652, 562], [640, 552]], 16);
  const PLEN = [0]; for (let i = 1; i < PATHPTS.length; i++) PLEN.push(PLEN[i - 1] + Math.hypot(PATHPTS[i][0] - PATHPTS[i - 1][0], PATHPTS[i][1] - PATHPTS[i - 1][1]));
  function pathAt(k) { const d = clamp(k, 0, 1) * PLEN[PLEN.length - 1]; let i = 1; while (i < PLEN.length - 1 && PLEN[i] < d) i++; const f = (d - PLEN[i - 1]) / (PLEN[i] - PLEN[i - 1] || 1); return [lerp(PATHPTS[i - 1][0], PATHPTS[i][0], f), lerp(PATHPTS[i - 1][1], PATHPTS[i][1], f)]; }

  function build() {
    R.seed(1);
    L.paper = paperTex();
    // sky
    { const { c, g } = layer(); g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
      wash(g, rect(PIC.x0, PIC.y0, PIC.x1, 400), C.sky1, { grad: [0, PIC.y0, 0, 340, C.sky0, C.sky1], var: 0.05, edge: 0 });
      // horizontal wash streaks
      g.save(); g.filter = "blur(3px)"; g.globalAlpha = 0.05; for (let i = 0; i < 26; i++) { const y = R.rr(PIC.y0, 340); g.fillStyle = rgba(R.r() < 0.5 ? "#ffffff" : "#9aa88c"); g.fillRect(PIC.x0 + R.rr(-200, 300), y, R.rr(300, 800), R.rr(4, 12)); } g.restore();
      L.sky = c; }
    L.clouds = [cloudSprite(300, 21, 11), cloudSprite(220, 16, 12), cloudSprite(380, 23, 13), cloudSprite(190, 15, 14)];
    // mid: forest, meadow, trees, house
    { const { c, g } = layer();
      farForest(g, 352, C.far, 70, 22, 3);
      farForest(g, 368, C.forest, 58, 19, 4);
      const mead = [[PIC.x0 - 10, 372], ...spline([[PIC.x0, 372], [400, 364], [640, 372], [900, 362], [PIC.x1, 370]], 10), [PIC.x1 + 10, PIC.y1 + 10], [PIC.x0 - 10, PIC.y1 + 10]];
      shape(g, mead, C.meadow, 1.6, { grad: [0, 370, 0, 670, C.meadow, C.meadowD], var: 0.06 });
      // rows of grass ticks
      R.seed(8);
      for (let y = 380; y < 660; y += 9) { const dens = 0.012 + (y - 380) / 300 * 0.02; for (let x = PIC.x0; x < PIC.x1; x += R.rr(6, 18)) { if (R.r() > dens * 40) continue; const h = 2 + (y - 380) / 60; g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x - h * 0.3, y - h); g.moveTo(x + 2, y); g.lineTo(x + 2 + h * 0.3, y - h * 1.1); g.stroke(); } }
      // back spruces behind house
      spruce(g, 470, 420, 150, 40); spruce(g, 880, 412, 170, 44); spruce(g, 930, 430, 130, 36);
      fence(g, 400, 512, 520, 21); fence(g, 860, 1000, 512, 22);
      // path
      const pl = [], pr = []; for (let i = 0; i < PATHPTS.length; i++) { const p = PATHPTS[i], k = i / (PATHPTS.length - 1), w = lerp(90, 26, Math.pow(k, 0.6)); pl.push([p[0] - w, p[1]]); pr.push([p[0] + w, p[1]]); }
      const pp = pl.concat(pr.reverse()); shape(g, pp, C.path, 1.4, { var: 0.08 });
      R.seed(41); for (let i = 0; i < 40; i++) { const k = R.r(), p = pathAt(k), w = lerp(50, 20, k); const x = p[0] + R.rr(-w, w), y = p[1] + R.rr(-4, 4); circ(g, x, y, R.rr(1, 2.6) * (1.2 - k * 0.6), "#c2a670", 0.6); }
      house(g);
      // big trees
      spruce(g, 290, 640, 520, 96, { tiers: 15 });
      birch(g, 395, 600, 330);
      spruce(g, 1000, 630, 440, 84, { tiers: 13 });
      L.mid = c; }
    { const { c, g } = layer(); porch(g); L.porch = c; }
    // foreground grass, flowers, mushrooms
    { const { c, g } = layer(); R.seed(55);
      const fgp = [[PIC.x0 - 5, 646], ...spline([[PIC.x0, 646], [420, 640], [520, 652], [760, 650], [900, 640], [PIC.x1, 646]], 8), [PIC.x1 + 5, PIC.y1 + 5], [PIC.x0 - 5, PIC.y1 + 5]];
      shape(g, fgp, C.grass, 1.5, { var: 0.06 });
      for (let x = PIC.x0 + 6; x < PIC.x1; x += R.rr(14, 26)) { if (x > 500 && x < 640) continue; tuft(g, x, 668, R.rr(26, 46), R.ri(3, 5), R.r() < 0.5 ? C.grass : C.grassL); }
      mushroom(g, 250, 668, 1.7); mushroom(g, 272, 670, 1.1); mushroom(g, 1040, 668, 1.5);
      for (const [x, y, col] of [[330, 632, C.red], [450, 640, C.blue], [770, 636, C.red], [880, 630, C.blue], [960, 640, C.red], [700, 645, C.blue]]) flower(g, x, y, 5, col);
      L.fg = c; }
    // frame
    { const { c, g } = layer(); R.seed(77);
      g.fillStyle = C.paper;
      g.fillRect(0, 0, W, PIC.y0); g.fillRect(0, PIC.y1, W, H - PIC.y1); g.fillRect(0, 0, PIC.x0, H); g.fillRect(PIC.x1, 0, W - PIC.x1, H);
      band(g, 12, 12, W - 12, 42, true); band(g, 12, H - 42, W - 12, H - 12, true);
      band(g, 12, 42, 42, H - 42, false); band(g, W - 42, 42, W - 12, H - 42, false);
      for (const [x, y] of [[27, 27], [W - 27, 27], [27, H - 27], [W - 27, H - 27]]) { shape(g, rect(x - 15, y - 15, x + 15, y + 15), C.red, 1.6); circ(g, x, y, 8, C.ochre, 1.1); circ(g, x, y, 3, C.green, 0.8); }
      // columns between band and picture
      for (const [x0, x1] of [[42, PIC.x0], [PIC.x1, W - 42]]) {
        klejmo(g, x0 + 16, 92, x1 - 16, 352, x0 < 100 ? 0 : 2);
        klejmo(g, x0 + 16, 404, x1 - 16, 652, x0 < 100 ? 1 : 3);
        const cx = (x0 + x1) / 2; circ(g, cx, 374, 10, C.red, 1.3); circ(g, cx, 374, 4, C.ochre, 0.9);
        for (const s of [-1, 1]) shape(g, [[cx + s * 12, 374], [cx + s * 34, 368], [cx + s * 46, 374], [cx + s * 34, 380]], C.green, 1);
      }
      // picture double line
      ink(g, rect(PIC.x0, PIC.y0, PIC.x1, PIC.y1), 2.4, true, INK, 0.15);
      ink(g, rect(PIC.x0 - 6, PIC.y0 - 6, PIC.x1 + 6, PIC.y1 + 6), 1, true, INK, 0.15);
      ink(g, rect(12, 12, W - 12, H - 12), 2.4, true, INK, 0.15);
      cartouche(g);
      L.frame = c; }
  }

  const CLOUDS = [[330, 150, 0, 6], [940, 150, 2, 4], [520, 222, 1, 7], [880, 236, 3, 5]];
  function smoke(g, t) {
    // stylised smoke: a chain of curly puffs (ink spiral inside), born at the chimney, drifting up and to the right
    const life = 5.0, period = 0.9;
    for (let i = 7; i >= 0; i--) {
      const age = ((t + i * period) % life + life) % life, k = age / life;
      const x = 811 + k * 110 + Math.sin(k * 5 + i) * 10, y = 250 - k * 140, r = 9 + k * 24;
      const a = Math.min(1, age / 0.5) * (1 - smooth(0.7, 1, k));
      if (a <= 0.01) continue;
      g.save(); g.globalAlpha = a;
      const pts = []; for (let q = 0; q <= 30; q++) { const an = q / 30 * Math.PI * 2, lob = 1 + 0.12 * Math.sin(an * 5 + i); pts.push([x + Math.cos(an) * r * lob, y + Math.sin(an) * r * 0.78 * lob]); }
      R.seed(600 + i); wash(g, pts, "#e9e3d3", { var: 0, edgeW: 2 }); ink(g, pts, 1.1, true, INK, 0);
      const sp = []; for (let q = 0; q <= 22; q++) { const an = q / 22 * Math.PI * 1.8 + i, rr = r * 0.62 * (1 - q / 30); sp.push([x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.75]); }
      ink(g, sp, 0.8, false, INK, 0);
      g.restore();
    }
  }
  function birds(g, t) {
    for (const [x0, y0, sp, sc, ph] of [[1100, 176, -38, 1.5, 0], [1150, 198, -36, 1.2, 1.7], [1190, 166, -40, 1.0, 3.1]]) {
      const x = x0 + t * sp, y = y0 + Math.sin(t * 1.3 + ph) * 4, f = Math.sin(t * 9 + ph) * 5 * sc;
      if (x < PIC.x0 + 10 || x > PIC.x1 - 10) continue;
      const w = 12 * sc, p = [[x - w, y - f], [x - w * 0.4, y - 3 * sc - f * 0.3], [x, y], [x + w * 0.4, y - 3 * sc - f * 0.3], [x + w, y - f], [x + w * 0.4, y - 1 * sc - f * 0.2], [x, y + 2.5 * sc], [x - w * 0.4, y - 1 * sc - f * 0.2]];
      g.fillStyle = INK; path(g, spline(p, 4, true)); g.fill();
    }
  }
  function figure(t) {
    const k = ease(seg(t, 0.4, 5.6));
    const kk = seg(t, 0.2, 5.6), dk = 1 - Math.pow(1 - kk, 1.25), p = pathAt(dk);
    let [x, y] = p; let s = lerp(2.3, 0.74, smooth(0, 1, (790 - y) / 238 * 0.5 + dk * 0.5));
    if (t > 5.6) { const q = seg(t, 5.6, 6.5); y = lerp(552, 538, q); s = 0.74 - q * 0.04; }
    const walk = t < 6.5 ? 1 : 0, ph = t * 7.2;
    return { x, y, s, ph, walk };
  }
  function doorOpen(t) { return smooth(4.9, 5.5, t) * (1 - smooth(6.7, 7.3, t)); }
  function drawDoor(g, t) {
    const o = doorOpen(t), d = door0, w = (d.x1 - d.x0) * (1 - 0.82 * o);
    // door panel hinged on the left, shrinking as it swings inward
    const p = [[d.x0, d.y0], [d.x0 + w, d.y0 + 3 * o], [d.x0 + w, d.y1 - 2 * o], [d.x0, d.y1]];
    R.seed(900);
    shape(g, p, "#9a6a3c", 1.2, { var: 0 });
    if (w > 8) { for (let i = 1; i < 3; i++) line(g, d.x0 + w * i / 3, d.y0 + 3, d.x0 + w * i / 3, d.y1 - 3, 0.7); circ(g, d.x0 + w - 5, (d.y0 + d.y1) / 2, 1.8, C.ochre, 0.6); }
  }

  function frame(t) {
    const g = ctx; R.seed(500);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
    g.drawImage(L.sky, 0, 0);
    for (const [x0, y, i, v] of CLOUDS) { const cl = L.clouds[i]; g.drawImage(cl.c, x0 + t * v - cl.ox, y - cl.oy); }
    smoke(g, t);
    birds(g, t);
    g.drawImage(L.mid, 0, 0);
    drawDoor(g, t);
    const f = figure(t);
    if (t < 6.6) {
      g.save();
      if (t > 5.75) { g.beginPath(); g.rect(door0.x0, 0, door0.x1 - door0.x0, door0.y1 + 2); g.clip(); }
      const inside = seg(t, 5.9, 6.5); g.globalAlpha = 1 - inside * 0.85;
      girl(g, f.x, f.y, f.s, f.ph, f.walk);
      g.restore();
    }
    g.drawImage(L.porch, 0, 0);
    g.drawImage(L.fg, 0, 0);
    g.drawImage(L.frame, 0, 0);
    text(g, t);
    g.globalCompositeOperation = "multiply"; g.drawImage(L.paper, 0, 0); g.globalCompositeOperation = "source-over";
  }

  window.SCENE = { dur: 9, build, frame };
})();
