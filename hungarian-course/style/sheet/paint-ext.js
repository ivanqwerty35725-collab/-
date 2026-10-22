/* Procedural gouache painting engine + Carpathian scene layers.
   Everything is seeded: identical output on every load. */
(function () {
  "use strict";
  const W = 1280, H = 720, M = 90, R = 1.4;
  const LW = Math.round((W + 2 * M) * R), LH = Math.round((H + 2 * M) * R);

  // ---------- seeded random ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rnd = mulberry32(1);
  const seed = (s) => (rnd = mulberry32(s));
  const rr = (a, b) => a + (b - a) * rnd();
  const ri = (a, b) => Math.floor(rr(a, b + 1));
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  // ---------- simplex noise ----------
  const perm = new Uint8Array(512);
  (function () {
    const r = mulberry32(777), p = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  })();
  const G = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  function noise(x, y) {
    const F2 = 0.366025403, G2 = 0.211324865;
    const s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2, x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0, tt, g;
    tt = 0.5 - x0 * x0 - y0 * y0; if (tt > 0) { g = G[perm[ii + perm[jj]] & 7]; tt *= tt; n += tt * tt * (g[0] * x0 + g[1] * y0); }
    tt = 0.5 - x1 * x1 - y1 * y1; if (tt > 0) { g = G[perm[ii + i1 + perm[jj + j1]] & 7]; tt *= tt; n += tt * tt * (g[0] * x1 + g[1] * y1); }
    tt = 0.5 - x2 * x2 - y2 * y2; if (tt > 0) { g = G[perm[ii + 1 + perm[jj + 1]] & 7]; tt *= tt; n += tt * tt * (g[0] * x2 + g[1] * y2); }
    return 70 * n;
  }
  function fbm(x, y, o = 4) { let a = 0.5, f = 1, s = 0, n = 0; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f); n += a; a *= 0.5; f *= 2.03; } return s / n; }

  // ---------- colour ----------
  function hex(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { a = typeof a === "string" ? hex(a) : a; b = typeof b === "string" ? hex(b) : b; return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function rgba(c, a = 1) { c = typeof c === "string" ? hex(c) : c; return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
  function jit(c, amt = 10) { c = typeof c === "string" ? hex(c) : c; const d = rr(-amt, amt); return [clamp(c[0] + d + rr(-amt, amt) * 0.4, 0, 255), clamp(c[1] + d + rr(-amt, amt) * 0.4, 0, 255), clamp(c[2] + d + rr(-amt, amt) * 0.4, 0, 255)]; }
  function ramp(stops, t) { // stops [[t,col],...]
    t = clamp(t, 0, 1);
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i]; return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0] || 1)); }
    return hex(stops[stops.length - 1][1]);
  }

  // ---------- canvases ----------
  function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function layer() { const c = canvas(LW, LH), g = c.getContext("2d"); g.setTransform(R, 0, 0, R, M * R, M * R); g.lineCap = "round"; g.lineJoin = "round"; return { c, g }; }

  // grain tile (pigment granulation) and paper
  const grainTile = (function () {
    const n = 256, c = canvas(n, n), g = c.getContext("2d"), im = g.createImageData(n, n), r = mulberry32(99);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = 0.5 + 0.5 * fbm(x * 0.09, y * 0.09, 3), w = r();
      const k = (y * n + x) * 4, d = clamp(v * 0.75 + w * 0.25, 0, 1);
      im.data[k] = im.data[k + 1] = im.data[k + 2] = 0; im.data[k + 3] = Math.round(Math.pow(d, 2.2) * 120);
    }
    g.putImageData(im, 0, 0); return c;
  })();
  function granulate(g, alpha = 0.35, scale = 1) {
    g.save(); g.globalCompositeOperation = "source-atop"; g.globalAlpha = alpha;
    const p = g.createPattern(grainTile, "repeat"); p.setTransform(new DOMMatrix([scale / R, 0, 0, scale / R, 0, 0]));
    g.fillStyle = p; g.fillRect(-M, -M, W + 2 * M, H + 2 * M); g.restore();
  }

  // ---------- brush primitives ----------
  function dab(g, x, y, ang, len, w, col, a) {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = rgba(col, a);
    g.beginPath(); g.ellipse(0, 0, len / 2, w / 2, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  // tapered curved stroke (grass blade, branch, needle)
  function blade(g, x0, y0, x1, y1, bend, w0, w1, col, a) {
    const mx = (x0 + x1) / 2 + bend * (y1 - y0) * 0.3, my = (y0 + y1) / 2 - bend * (x1 - x0) * 0.3;
    const steps = 6; g.fillStyle = rgba(col, a); g.beginPath();
    const L = [], Rr = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, it = 1 - t;
      const px = it * it * x0 + 2 * it * t * mx + t * t * x1, py = it * it * y0 + 2 * it * t * my + t * t * y1;
      const dx = 2 * it * (mx - x0) + 2 * t * (x1 - mx), dy = 2 * it * (my - y0) + 2 * t * (y1 - my);
      const dl = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, t) / 2;
      L.push([px - dy / dl * w, py + dx / dl * w]); Rr.push([px + dy / dl * w, py - dx / dl * w]);
    }
    g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]); for (let i = Rr.length - 1; i >= 0; i--) g.lineTo(Rr[i][0], Rr[i][1]);
    g.closePath(); g.fill();
  }
  // dry-brush stroke: several bristle lines
  function bristle(g, x, y, ang, len, w, col, a) {
    const n = Math.max(3, Math.round(w / 1.6)), ca = Math.cos(ang), sa = Math.sin(ang);
    g.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const o = (i / (n - 1) - 0.5) * w, l = len * rr(0.55, 1), s = rr(-0.15, 0.15) * len;
      const ox = -sa * o, oy = ca * o;
      g.strokeStyle = rgba(jit(col, 6), a * rr(0.5, 1)); g.lineWidth = rr(0.6, 1.6);
      g.beginPath(); g.moveTo(x + ox + ca * (s - l / 2), y + oy + sa * (s - l / 2)); g.lineTo(x + ox + ca * (s + l / 2), y + oy + sa * (s + l / 2)); g.stroke();
    }
  }

  // rough polygon: resample + displace along normal by fbm
  function rough(pts, amp = 2, freq = 0.05, closed = true, sd = 0) {
    const out = [], n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / 3));
      const nx = -(b[1] - a[1]) / (d || 1), ny = (b[0] - a[0]) / (d || 1);
      for (let j = 0; j < k; j++) {
        const t = j / k, x = lerp(a[0], b[0], t), y = lerp(a[1], b[1], t);
        const o = amp * (fbm(x * freq + sd, y * freq - sd, 3) + 0.35 * noise(x * freq * 6, y * freq * 6 + sd));
        out.push([x + nx * o, y + ny * o]);
      }
    }
    if (!closed) out.push(pts[n - 1]);
    return out;
  }
  function polyPath(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
  function bbox(pts) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } return [a, b, c, d]; }

  // paint a region: base fill + many brush dabs clipped inside, colour from fn(x,y)
  function region(g, pts, colFn, o = {}) {
    const bb = bbox(pts), area = (bb[2] - bb[0]) * (bb[3] - bb[1]);
    g.save(); polyPath(g, pts); g.fillStyle = rgba(colFn((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2)); g.fill();
    if (o.under) { g.fillStyle = rgba(o.under); g.fill(); }
    g.clip();
    // base pass fills, then texture strokes
    const n = Math.round(area * (o.density || 0.02));
    for (let i = 0; i < n; i++) {
      const x = rr(bb[0] - 6, bb[2] + 6), y = rr(bb[1] - 6, bb[3] + 6);
      const ang = (typeof o.ang === "function" ? o.ang(x, y) : o.ang || 0) + rr(-1, 1) * (o.angJ ?? 0.25);
      const len = rr(o.len?.[0] ?? 8, o.len?.[1] ?? 22), w = rr(o.w?.[0] ?? 3, o.w?.[1] ?? 8);
      const c = jit(colFn(x, y), o.jit ?? 8);
      if (o.dry && rnd() < o.dry) bristle(g, x, y, ang, len * 1.3, w, c, o.a ?? 0.5);
      else dab(g, x, y, ang, len, w, c, (o.a ?? 0.5) * rr(0.5, 1));
    }
    g.restore();
  }
  // darker pigment line along a polygon edge (gouache edge pooling), partly broken
  function edge(g, pts, col, a = 0.35, w = 1.2) {
    g.save(); g.lineCap = "round"; g.strokeStyle = rgba(col, a);
    for (let i = 0; i < pts.length - 1; i++) {
      if (noise(pts[i][0] * 0.05, pts[i][1] * 0.05) < -0.35) continue;
      g.lineWidth = w * (0.6 + 0.6 * (0.5 + 0.5 * noise(pts[i][0] * 0.1, pts[i][1] * 0.1)));
      g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]); g.stroke();
    }
    g.restore();
  }

  // ================= SKY =================
  const SKY = [[0, "#7f9fbd"], [0.22, "#a9bccb"], [0.42, "#d9d3c2"], [0.55, "#efd7b0"], [0.66, "#f3c793"], [1, "#eeb880"]];
  const skyCol = (y) => ramp(SKY, (y + M) / (560 + M));
  function paintSky() {
    seed(11); const { c, g } = layer();
    for (let y = -M; y < H + M; y += 2) { g.fillStyle = rgba(skyCol(y)); g.fillRect(-M, y, W + 2 * M, 2.5); }
    // warm sun bloom from upper-left (sun outside frame)
    let rg = g.createRadialGradient(-60, 300, 10, -60, 300, 760);
    rg.addColorStop(0, "rgba(255,236,190,0.75)"); rg.addColorStop(0.45, "rgba(255,214,160,0.28)"); rg.addColorStop(1, "rgba(255,214,160,0)");
    g.fillStyle = rg; g.fillRect(-M, -M, W + 2 * M, H + 2 * M);
    // broad horizontal gouache strokes
    for (let i = 0; i < 2600; i++) {
      const x = rr(-M, W + M), y = rr(-M, 560);
      const sun = Math.max(0, 1 - Math.hypot(x + 60, y - 300) / 760);
      const col = mix(jit(skyCol(y + rr(-30, 30)), 7), [255, 232, 196], sun * 0.5);
      if (rnd() < 0.25) bristle(g, x, y, rr(-0.06, 0.06), rr(50, 140), rr(6, 14), col, 0.16);
      else dab(g, x, y, rr(-0.05, 0.05), rr(40, 150), rr(8, 22), col, rr(0.05, 0.14));
    }
    granulate(g, 0.22, 1.3);
    return c;
  }
  function paintCloud(sd, w, h, warm) {
    seed(sd); const pad = 40, cw = Math.round((w + pad * 2) * R), ch = Math.round((h + pad * 2) * R);
    const c = canvas(cw, ch), g = c.getContext("2d"); g.setTransform(R, 0, 0, R, pad * R, pad * R);
    // lobes along a flat base
    const lobes = []; const n = ri(6, 9);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, r = h * (0.28 + 0.42 * Math.sin(Math.PI * t) * rr(0.7, 1.1)); lobes.push([w * t + rr(-8, 8), h - r * rr(0.75, 0.95), r]); }
    for (let i = 0; i < 4; i++) lobes.push([rr(w * 0.15, w * 0.85), h * rr(0.55, 0.75), h * rr(0.18, 0.3)]);
    const inside = (x, y) => { if (y > h + 2) return 0; let m = 0; for (const l of lobes) { const d = Math.hypot(x - l[0], y - l[1]) / l[2]; m = Math.max(m, 1 - d); } return m; };
    const lit = warm ? "#fff1dc" : "#fbf3e6", mid = warm ? "#efd2c0" : "#e4dcd6", sh = warm ? "#b9a8b8" : "#aeb0c2";
    const colAt = (x, y) => { const v = clamp((y / h) + 0.25 * fbm(x * 0.02, y * 0.02), 0, 1); return ramp([[0, lit], [0.45, lit], [0.75, mid], [1, sh]], v); };
    // soft underpaint
    g.filter = "blur(5px)";
    for (const l of lobes) { g.fillStyle = rgba(colAt(l[0], l[1] + l[2] * 0.3), 0.55); g.beginPath(); g.arc(l[0], l[1], l[2] * 0.95, 0, Math.PI * 2); g.fill(); }
    g.filter = "none";
    // dabs
    for (let i = 0; i < w * h * 0.09; i++) {
      const x = rr(-10, w + 10), y = rr(-10, h + 4), m = inside(x, y); if (m <= 0.02) continue;
      const a = smooth(0, 0.25, m) * rr(0.25, 0.7);
      dab(g, x, y, rr(-0.5, 0.5) + (y > h * 0.8 ? 0 : 0), rr(5, 14), rr(3, 8), jit(colAt(x, y), 6), a);
    }
    // flat cool underside stroke
    for (let i = 0; i < 30; i++) dab(g, rr(w * 0.1, w * 0.9), h - rr(0, 6), rr(-0.03, 0.03), rr(20, 60), rr(3, 6), jit(sh, 6), 0.35);
    return { c, w: w + pad * 2, h: h + pad * 2, pad };
  }

  // ================= MOUNTAINS =================
  function ridgeFn(sd, base, amp, f, peaks) {
    return (x) => {
      let y = base - amp * (0.55 * fbm(x * f + sd, sd * 0.3, 5) + 0.45 * (1 - Math.abs(noise(x * f * 0.6 + sd * 2, 3.3))));
      for (const p of peaks) y -= p[2] * Math.exp(-Math.pow((x - p[0]) / p[1], 2));
      return y;
    };
  }
  function paintRange(o) {
    seed(o.seed); const { c, g } = layer();
    const rf = o.ridge, pts = [];
    for (let x = -M - 10; x <= W + M + 10; x += 3) pts.push([x, rf(x)]);
    pts.push([W + M + 10, o.bottom], [-M - 10, o.bottom]);
    const top = Math.min(...pts.map((p) => p[1]));
    const colFn = (x, y) => {
      const r = rf(x), depth = clamp((y - r) / (o.bottom - top), 0, 1);
      // spurs: ridge slope sampled with a depth-dependent offset gives diagonal light/dark
      const xs = x - (y - r) * 0.9, s = (rf(xs + 6) - rf(xs - 6)) / 12;
      const light = clamp(-s * o.slopeK + 0.15 * fbm(x * 0.03, y * 0.03), -1, 1);
      let col = mix(o.col, light > 0 ? o.lit : o.shade, Math.abs(light));
      col = mix(col, o.haze, smooth(0.15, 1, depth) * o.hazeK);
      return col;
    };
    region(g, pts, colFn, { density: 0.03, len: [10, 26], w: [3, 7], a: 0.55, jit: 6, ang: (x, y) => { const s = (rf(x + 4) - rf(x - 4)) / 8; return Math.atan(s) * 0.8 + 0.5 * Math.sign(s); }, angJ: 0.3, dry: 0.15 });
    if (o.trees) {
      // tiny conifers: dense on the forested slopes, breaking the ridgeline
      for (let i = 0; i < o.trees; i++) {
        const x = rr(-M, W + M), r = rf(x), y = r + Math.pow(rnd(), 1.6) * (o.bottom - r) * 0.8 - 2;
        if (fbm(x * 0.012 + 5, y * 0.02, 3) < o.forest) continue;
        const depth = clamp((y - r) / (o.bottom - top), 0, 1), hh = rr(5, 9) * o.treeS * (1 + depth * 0.6), ww = hh * 0.38;
        let col = mix(o.treeCol, o.haze, smooth(0.1, 1, depth) * o.hazeK * 0.9);
        g.fillStyle = rgba(jit(col, 5), 0.85); g.beginPath(); g.moveTo(x, y - hh); g.lineTo(x + ww, y); g.lineTo(x - ww, y); g.closePath(); g.fill();
        g.fillStyle = rgba(mix(col, o.lit, 0.5), 0.5); g.beginPath(); g.moveTo(x, y - hh); g.lineTo(x - ww * 0.2, y); g.lineTo(x - ww, y); g.closePath(); g.fill();
      }
    }
    // mist band at the foot
    const mg = g.createLinearGradient(0, o.mistY - 40, 0, o.mistY + 30);
    mg.addColorStop(0, rgba(o.mist, 0)); mg.addColorStop(0.6, rgba(o.mist, o.mistA)); mg.addColorStop(1, rgba(o.mist, o.mistA));
    g.save(); polyPath(g, pts); g.clip(); g.fillStyle = mg; g.fillRect(-M, o.mistY - 40, W + 2 * M, o.bottom - o.mistY + 60);
    for (let i = 0; i < 260; i++) dab(g, rr(-M, W + M), o.mistY + rr(-30, 10), rr(-0.02, 0.02), rr(40, 120), rr(4, 9), jit(o.mist, 5), rr(0.08, 0.2));
    g.restore();
    edge(g, pts.slice(0, -2), o.edge, 0.25, 1.1);
    granulate(g, 0.3, 1);
    return c;
  }

  // ================= HILLS (forested foothills) =================
  function spruceMark(g, x, y, hh, col, lit, a = 1) {
    const ww = hh * 0.36;
    g.fillStyle = rgba(jit(col, 5), a); g.beginPath(); g.moveTo(x, y - hh);
    const k = 4; for (let i = 1; i <= k; i++) { const t = i / k; g.lineTo(x + ww * t * 1.05, y - hh + hh * t - hh * 0.05); g.lineTo(x + ww * t * 0.55, y - hh + hh * t - hh * 0.02); }
    for (let i = k; i >= 1; i--) { const t = i / k; g.lineTo(x - ww * t * 0.55, y - hh + hh * t - hh * 0.02); g.lineTo(x - ww * t * 1.05, y - hh + hh * t - hh * 0.05); }
    g.closePath(); g.fill();
    g.fillStyle = rgba(lit, a * 0.55); g.beginPath(); g.moveTo(x, y - hh); g.lineTo(x - ww * 0.15, y - hh * 0.1); g.lineTo(x - ww, y - hh * 0.06); g.closePath(); g.fill();
  }
  function blobTree(g, x, y, r, col, lit, shade, a = 1) {
    for (let i = 0; i < 14; i++) {
      const ang = rr(0, Math.PI * 2), d = rr(0, r * 0.6), px = x + Math.cos(ang) * d, py = y - r + Math.sin(ang) * d * 0.9;
      const l = clamp(0.5 - (px - x) / r * 0.5 - (py - (y - r)) / r * 0.4, 0, 1);
      dab(g, px, py, rr(0, 3), r * rr(0.5, 0.8), r * rr(0.4, 0.7), jit(mix(shade, lit, l), 5), a * 0.8);
    }
  }
  function paintHills() {
    seed(31); const { c, g } = layer();
    const haze = "#b9bfb8";
    const hills = [
      { f: (x) => 396 - 26 * Math.sin(x * 0.0042 + 1.2) - 12 * fbm(x * 0.008, 1, 3), col: "#7d9284", lit: "#a8b39a", sh: "#5f7676", haze: 0.55 },
      { f: (x) => 428 - 22 * Math.sin(x * 0.0055 + 3.4) - 10 * fbm(x * 0.01, 7, 3), col: "#6d8a6f", lit: "#a5b483", sh: "#4f6a62", haze: 0.32 },
    ];
    hills.forEach((h, hi) => {
      const pts = []; for (let x = -M - 10; x <= W + M + 10; x += 3) pts.push([x, h.f(x)]); pts.push([W + M + 10, 560], [-M - 10, 560]);
      const colFn = (x, y) => {
        const s = (h.f(x + 6) - h.f(x - 6)) / 12, d = clamp((y - h.f(x)) / 120, 0, 1);
        const fv = fbm(x * 0.006 + hi * 9, y * 0.012, 3), meadow = fv > 0.06;
        let col = meadow ? mix(h.lit, "#c4c08a", 0.3) : mix(h.col, "#2f4a40", 0.35);
        col = mix(col, s < 0 ? h.lit : h.sh, clamp(Math.abs(s) * 2.5, 0, 0.5));
        return mix(col, haze, h.haze * (0.6 + 0.4 * d));
      };
      region(g, pts, colFn, { density: 0.03, len: [10, 24], w: [3, 6], a: 0.55, jit: 6, ang: 0, angJ: 0.15 });
      // forest: conifers + rounded deciduous where not meadow
      const N = hi === 0 ? 6000 : 7000;
      const trees = [];
      for (let i = 0; i < N; i++) {
        const x = rr(-M, W + M), top = h.f(x), y = top + Math.pow(rnd(), 1.3) * (560 - top) * 0.9 + 3;
        if (fbm(x * 0.006 + hi * 9, y * 0.012, 3) > 0.04) continue;
        trees.push([x, y]);
      }
      trees.sort((a, b) => a[1] - b[1]);
      for (const [x, y] of trees) {
        const d = clamp((y - h.f(x)) / 120, 0, 1), sc = (hi === 0 ? 0.8 : 1.15) * (1 + d * 0.5);
        const tcol = mix(hi === 0 ? "#4f6964" : "#3f5c4c", haze, h.haze * 0.8), tlit = mix("#9fb08a", haze, h.haze * 0.6);
        if (rnd() < 0.7) spruceMark(g, x, y, rr(7, 12) * sc, tcol, rgba(tlit), 0.9);
        else blobTree(g, x, y, rr(3, 5) * sc, mix(tcol, "#6f8a5a", 0.3), mix(tlit, "#c8c27a", 0.3), tcol, 0.9);
      }
      edge(g, pts.slice(0, -2), mix(h.sh, "#334", 0.2), 0.25, 1);
      if (hi === 0) {
        // tiny wooden church with tiered roof on the far hill
        const cx = 1060, cy = h.f(1060) + 6;
        g.fillStyle = rgba("#6f5d52"); g.fillRect(cx - 7, cy - 12, 14, 12);
        g.fillStyle = rgba("#3f3a3e"); g.beginPath(); g.moveTo(cx - 10, cy - 12); g.lineTo(cx, cy - 22); g.lineTo(cx + 10, cy - 12); g.fill();
        g.fillRect(cx - 2.5, cy - 32, 5, 11); g.beginPath(); g.moveTo(cx - 5, cy - 30); g.lineTo(cx, cy - 40); g.lineTo(cx + 5, cy - 30); g.fill();
        g.strokeStyle = rgba("#3f3a3e"); g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx, cy - 40); g.lineTo(cx, cy - 45); g.moveTo(cx - 1.8, cy - 43); g.lineTo(cx + 1.8, cy - 43); g.stroke();
        g.fillStyle = rgba("#efe3cc", 0.6); g.fillRect(cx - 7, cy - 12, 4, 12);
      } else {
        // haystacks on poles + far cottages in meadows
        const stacks = [[180, 0], [240, 6], [1180, 2], [1215, 8]];
        for (const [sx, o] of stacks) { const sy = h.f(sx) + 26 + o; g.fillStyle = rgba("#a08a52"); g.beginPath(); g.moveTo(sx, sy - 16); g.quadraticCurveTo(sx + 9, sy - 4, sx + 7, sy); g.lineTo(sx - 7, sy); g.quadraticCurveTo(sx - 9, sy - 4, sx, sy - 16); g.fill(); g.fillStyle = rgba("#d3bf7c", 0.7); g.beginPath(); g.moveTo(sx, sy - 16); g.quadraticCurveTo(sx - 9, sy - 4, sx - 7, sy); g.lineTo(sx - 2, sy); g.fill(); g.strokeStyle = rgba("#4b3a2a"); g.lineWidth = 0.8; g.beginPath(); g.moveTo(sx, sy - 16); g.lineTo(sx, sy - 21); g.stroke(); }
        for (const [hx, ho] of [[120, 14], [1135, 18]]) { const hy = h.f(hx) + ho; g.fillStyle = rgba("#e8dcc4"); g.fillRect(hx - 9, hy - 8, 18, 8); g.fillStyle = rgba("#9c5a3c"); g.beginPath(); g.moveTo(hx - 11, hy - 8); g.lineTo(hx - 4, hy - 15); g.lineTo(hx + 4, hy - 15); g.lineTo(hx + 11, hy - 8); g.fill(); g.fillStyle = rgba("#b9b4ae"); g.fillRect(hx + 3, hy - 8, 6, 8); }
      }
    });
    granulate(g, 0.3, 1);
    return c;
  }

  // ================= MID GROUND: meadow, trees, house, path, fence =================
  const crest = (x) => 452 - 18 * Math.sin(x * 0.004 + 0.4) - 6 * fbm(x * 0.012, 3, 3) + (x > 1000 ? (x - 1000) * 0.05 : 0);
  // walking path (frame coords at zoom 1)
  const YARD = { s: 1.38, ax: 745, ay: 524, dx: 30, dy: 2 };
  function yard(g) { g.translate(YARD.ax + YARD.dx, YARD.ay + YARD.dy); g.scale(YARD.s, YARD.s); g.translate(-YARD.ax, -YARD.ay); }
  const PATH_IN = [[250, 590], [380, 572], [520, 552], [610, 540], [650, 534]];
  const PATH_OUT = [[668, 536], [780, 543], [900, 548], [1010, 556], [1110, 572], [1210, 596], [1330, 628]];

  function spruce(g, x, y, hh, wid, sd) {
    seed(sd);
    const dark = "#28433a", mid = "#3b5b47", lit = "#7f9a5c", tip = "#a9b46e";
    // trunk
    g.fillStyle = rgba("#4a3628"); g.fillRect(x - 2, y - hh * 0.15, 4, hh * 0.15);
    const tiers = Math.round(hh / 5);
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers, ty = y - hh + hh * t + 2, Lw = wid * Math.pow(t, 0.85) * rr(0.8, 1.1) + 2;
      for (const side of [-1, 1]) {
        const n = Math.max(2, Math.round(Lw / 3));
        for (let k = 0; k < n; k++) {
          const l = Lw * rr(0.5, 1), droop = rr(0.25, 0.55);
          const ex = x + side * l, ey = ty + l * droop;
          const lightF = side < 0 ? 0.6 : 0.1;
          blade(g, x + side * rr(0, 2), ty + rr(-1, 1), ex, ey, side * rr(-0.3, 0.1), rr(2.4, 4), 0.6, jit(mix(dark, mid, rnd() * 0.8), 5), 0.9);
          if (rnd() < lightF) blade(g, x + side * l * 0.4, ty + l * 0.4 * droop - 1, ex, ey - 1, 0, 1.6, 0.4, jit(mix(lit, tip, rnd()), 6), 0.75);
        }
      }
    }
    g.fillStyle = rgba(dark); g.beginPath(); g.moveTo(x, y - hh - 6); g.lineTo(x + 2, y - hh + 6); g.lineTo(x - 2, y - hh + 6); g.fill();
  }

  function walnut(g, x, y, sd) {
    seed(sd);
    const barkD = "#3f3028", bark = "#5e4a3a", barkL = "#a08868";
    // trunk with root flare
    const tr = rough([[x - 20, y + 2], [x - 11, y - 18], [x - 9, y - 70], [x - 14, y - 104], [x + 8, y - 104], [x + 6, y - 70], [x + 9, y - 20], [x + 19, y + 2]], 1.6, 0.08);
    region(g, tr, (px) => mix(barkL, barkD, clamp((px - x + 12) / 26, 0, 1)), { density: 1.2, len: [6, 14], w: [1.2, 2.4], a: 0.7, ang: 1.57, angJ: 0.12, jit: 8 });
    edge(g, tr, "#2a1f19", 0.5, 1.2);
    // main limbs + twigs
    const limbs = [[-4, -100, -95, -170, 11], [0, -100, 70, -185, 10], [-2, -102, -20, -228, 9], [-6, -92, -150, -128, 7], [4, -94, 135, -132, 7], [-3, -140, -60, -215, 5]];
    const tips = [];
    for (const l of limbs) {
      blade(g, x + l[0], y + l[1], x + l[2], y + l[3], rr(-0.25, 0.25), l[4], 2.5, bark, 1);
      blade(g, x + l[0] - 1, y + l[1], x + l[2] - 1, y + l[3], 0, l[4] * 0.35, 1, barkL, 0.6);
      for (let k = 0; k < 3; k++) { const t = rr(0.5, 0.95), bx = lerp(x + l[0], x + l[2], t), by = lerp(y + l[1], y + l[3], t), a = rr(-2.8, -0.3); const ex = bx + Math.cos(a) * rr(20, 45), ey = by + Math.sin(a) * rr(15, 35); blade(g, bx, by, ex, ey, rr(-0.3, 0.3), 3, 0.8, bark, 0.9); tips.push([ex, ey]); }
    }
    // canopy masses
    const cx = x - 6, cy = y - 168;
    const masses = [
      [cx - 92, cy + 28, 62, 46], [cx - 30, cy - 34, 78, 52], [cx + 62, cy - 6, 70, 52], [cx + 112, cy + 46, 46, 36],
      [cx - 2, cy + 40, 76, 44], [cx - 128, cy + 72, 40, 30], [cx + 50, cy + 70, 56, 30], [cx - 66, cy - 10, 50, 40],
    ].sort((a, b) => a[1] - b[1]);
    const dark = "#253b25", mid = "#4c6a34", lit = "#8fa548", hl = "#d2c867";
    const inside = (m, px, py) => { const a = Math.atan2((py - m[1]) / m[3], (px - m[0]) / m[2]); const r = 1 + 0.2 * noise(Math.cos(a) * 1.7 + m[0] * 0.1, Math.sin(a) * 1.7); return Math.hypot((px - m[0]) / m[2], (py - m[1]) / m[3]) / r; };
    for (const m of masses) {
      // shadowed core
      for (let i = 0; i < m[2] * m[3] * 0.09; i++) { const px = m[0] + rr(-1, 1) * m[2], py = m[1] + rr(-1, 1) * m[3], d = inside(m, px, py); if (d > 0.95) continue; dab(g, px, py, rr(0, 3), rr(6, 12), rr(4, 8), jit(mix(dark, "#1d2f22", 0.3), 4), 0.8); }
      // leaf strokes, lit from upper-left
      const n = m[2] * m[3] * 0.55;
      for (let i = 0; i < n; i++) {
        const px = m[0] + rr(-1.15, 1.15) * m[2], py = m[1] + rr(-1.15, 1.15) * m[3], d = inside(m, px, py); if (d > 1.04) continue;
        const nx = (px - m[0]) / m[2], ny = (py - m[1]) / m[3];
        let l = 0.42 - nx * 0.32 - ny * 0.55 + 0.25 * (d - 0.5) * (ny < 0 ? 1 : -0.6) + 0.12 * noise(px * 0.08, py * 0.08);
        l = clamp(l, 0, 1);
        const col = l < 0.3 ? mix(dark, mid, l / 0.3) : l < 0.68 ? mix(mid, lit, (l - 0.3) / 0.38) : mix(lit, hl, (l - 0.68) / 0.32);
        const ang = Math.atan2(ny, nx) + rr(-0.6, 0.6);
        dab(g, px, py, ang, rr(3.5, 7.5), rr(1.8, 3.6), jit(col, 7), rr(0.75, 1));
      }
    }
    // sky holes through the canopy (upper part only) with twigs crossing them
    g.save(); g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 26; i++) { const m = pick(masses); const a = rr(0, 6.28), px = m[0] + Math.cos(a) * m[2] * rr(0.55, 0.9), py = m[1] + Math.sin(a) * m[3] * rr(0.5, 0.85); if (py > y - 125) continue; for (let k = 0; k < 4; k++) dab(g, px + rr(-4, 4), py + rr(-3, 3), rr(0, 3), rr(3, 7), rr(2, 4), [0, 0, 0], 0.95); }
    g.restore();
    for (const tp of tips) if (rnd() < 0.6) blade(g, tp[0], tp[1], tp[0] + rr(-12, 12), tp[1] - rr(6, 16), rr(-0.3, 0.3), 1.6, 0.5, "#3a2e26", 0.85);
  }

  function tileRow(g, x0, x1, y, hgt, w, cols, shade) {
    // scalloped clay tiles: each tile a rounded-bottom shape
    for (let x = x0 - w * rnd(); x < x1 + w; x += w) {
      const c = jit(pick(cols), 9), m = mix(c, shade, 0.35);
      g.fillStyle = rgba(shade, 0.45); g.beginPath(); g.moveTo(x + 1.5, y - hgt * 0.3); g.lineTo(x + w + 1.5, y - hgt * 0.3); g.lineTo(x + w + 1.5, y); g.quadraticCurveTo(x + w / 2 + 1.5, y + hgt * 0.62, x + 1.5, y); g.closePath(); g.fill();
      g.fillStyle = rgba(m); g.beginPath(); g.moveTo(x, y - hgt); g.lineTo(x + w, y - hgt); g.lineTo(x + w, y - 2); g.quadraticCurveTo(x + w / 2, y + hgt * 0.5, x, y - 2); g.closePath(); g.fill();
      g.fillStyle = rgba(c, 0.95); g.beginPath(); g.moveTo(x + 0.6, y - hgt); g.lineTo(x + w * 0.6, y - hgt); g.lineTo(x + w * 0.6, y - 1); g.quadraticCurveTo(x + w * 0.3, y + hgt * 0.38, x + 0.6, y - 2.5); g.closePath(); g.fill();
      if (rnd() < 0.5) { g.fillStyle = rgba(mix(c, "#f0c39a", 0.45), 0.7); g.fillRect(x + 1.2, y - hgt + 1, 1.4, hgt * 0.7); }
      if (rnd() < 0.08) { g.fillStyle = rgba("#6f7a45", 0.45); g.beginPath(); g.ellipse(x + w / 2, y - hgt * 0.4, w * 0.4, hgt * 0.3, 0, 0, 7); g.fill(); }
    }
    g.fillStyle = rgba(shade, 0.55); g.fillRect(x0 - w, y - 0.5, x1 - x0 + 2 * w, 1.6);
  }

  function house(g) {
    seed(51);
    const wall = "#f1e7d3", wallSh = "#c8c4cc", wallWarm = "#f7e3c3", blue = "#5d7fa6", wood = "#6a4a30", woodL = "#9a7450", woodD = "#3e2a1e";
    const X0 = 590, X1 = 900, Y0 = 428, Y1 = 520, SX = 958; // front facade + receding right side
    // cast shadow on ground to the right
    g.fillStyle = rgba("#4f6a52", 0.45); polyPath(g, rough([[X1, Y1 + 2], [SX + 4, Y1 - 6], [1080, Y1 + 6], [1030, Y1 + 22], [X1, Y1 + 12]], 2)); g.fill();
    // ---- side wall (shade)
    const side = rough([[X1, Y0 + 2], [SX, Y0 + 12], [SX, Y1 - 7], [X1, Y1]], 0.8, 0.08);
    region(g, side, (x, y) => mix(wallSh, "#b4b6c6", (y - Y0) / 100), { density: 0.25, len: [4, 10], w: [2, 4], a: 0.5, ang: 1.57, angJ: 0.2, jit: 5 });
    // blue plinth
    region(g, [[X1, Y1 - 13], [SX, Y1 - 18], [SX, Y1 - 7], [X1, Y1]], () => hex("#3f5a7a"), { density: 0.4, len: [4, 8], w: [2, 3], a: 0.5, jit: 5 });
    // small side window (shuttered, in shade)
    g.fillStyle = rgba("#3d5878"); g.beginPath(); g.moveTo(918, 456); g.lineTo(940, 459); g.lineTo(940, 485); g.lineTo(918, 484); g.fill();
    g.strokeStyle = rgba("#d9d3cc", 0.8); g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = rgba("#22344a", 0.8); g.lineWidth = 0.8; g.beginPath(); g.moveTo(929, 457.5); g.lineTo(929, 484.5); for (let k = 1; k < 6; k++) { g.moveTo(919, 456 + k * 4.6); g.lineTo(939, 459 + k * 4.4); } g.stroke();
    // ---- front wall (lit warm)
    const front = rough([[X0, Y0], [X1, Y0 + 2], [X1, Y1], [X0, Y1]], 0.8, 0.08);
    region(g, front, (x, y) => mix(mix(wallWarm, wall, (x - X0) / 300), "#e6d6bd", smooth(Y0, Y1, y) * 0.5), { density: 0.22, len: [5, 12], w: [2, 5], a: 0.45, ang: 1.57, angJ: 0.35, jit: 5 });
    // damp stains & lime wash streaks
    for (let i = 0; i < 40; i++) dab(g, rr(X0 + 4, X1 - 4), rr(Y1 - 30, Y1 - 12), 1.57, rr(6, 16), rr(2, 4), "#cdbfa6", 0.18);
    // plinth band
    const pl = rough([[X0, Y1 - 13], [X1, Y1 - 13], [X1, Y1], [X0, Y1]], 0.8, 0.1);
    region(g, pl, (x) => mix(blue, "#7e9cbf", 0.2 + 0.2 * Math.sin(x)), { density: 0.4, len: [5, 10], w: [2, 3], a: 0.5, jit: 6 });
    g.fillStyle = rgba("#2f425a", 0.5); g.fillRect(X0, Y1 - 13, X1 - X0, 1.2);
    // foundation stones
    for (let x = X0 - 2; x < SX; x += rr(7, 12)) { g.fillStyle = rgba(jit("#8d8a84", 10)); g.beginPath(); g.ellipse(x, Y1 + 2 - (x > X1 ? (x - X1) * 0.12 : 0), rr(4, 6), 2.6, 0, 0, 7); g.fill(); }
    // eave shadow on front wall
    const es = g.createLinearGradient(0, Y0, 0, Y0 + 22); es.addColorStop(0, "rgba(90,80,110,0.55)"); es.addColorStop(1, "rgba(90,80,110,0)");
    g.fillStyle = es; g.fillRect(X0, Y0, X1 - X0, 22);

    // ---- windows (front): carved trims, shutters, sill flower boxes
    const wins = [[742, 452, 40, 44], [826, 452, 40, 44]];
    for (const [wx, wy, ww, wh] of wins) {
      // carved top trim
      g.fillStyle = rgba("#5f7fa3"); g.beginPath(); g.moveTo(wx - 7, wy - 3); g.lineTo(wx + ww / 2, wy - 13); g.lineTo(wx + ww + 7, wy - 3); g.lineTo(wx + ww + 7, wy); g.lineTo(wx - 7, wy); g.fill();
      g.fillStyle = rgba("#f3ecdc"); g.beginPath(); g.arc(wx + ww / 2, wy - 5, 2.2, 0, 7); g.fill();
      // shutters
      for (const sx of [wx - 13, wx + ww + 1]) { region(g, [[sx, wy], [sx + 12, wy], [sx + 12, wy + wh], [sx, wy + wh]], () => hex("#4f7299"), { density: 0.6, len: [6, 12], w: [1.5, 2.5], a: 0.6, ang: 1.57, angJ: 0.05, jit: 6 }); g.strokeStyle = rgba("#2e4762", 0.7); g.lineWidth = 0.8; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(sx + 2, wy + k * wh / 6); g.lineTo(sx + 10, wy + k * wh / 6); g.stroke(); } }
      // frame + dark glass (sky reflection)
      g.fillStyle = rgba("#efe8da"); g.fillRect(wx - 3, wy - 1, ww + 6, wh + 3);
      const gg = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gg.addColorStop(0, "#5b7088"); gg.addColorStop(0.5, "#2f3e51"); gg.addColorStop(1, "#243142");
      g.fillStyle = gg; g.fillRect(wx, wy + 1, ww, wh - 1);
      g.fillStyle = "rgba(220,230,240,0.22)"; g.beginPath(); g.moveTo(wx + 4, wy + wh - 2); g.lineTo(wx + 16, wy + 2); g.lineTo(wx + 22, wy + 2); g.lineTo(wx + 10, wy + wh - 2); g.fill();
      g.fillStyle = rgba("#efe8da"); g.fillRect(wx + ww / 2 - 1.3, wy, 2.6, wh); g.fillRect(wx, wy + wh * 0.38, ww, 2.4);
      // sill + geraniums
      g.fillStyle = rgba("#7a5638"); g.fillRect(wx - 6, wy + wh + 1, ww + 12, 4);
      g.fillStyle = rgba("#9a5a3a"); g.fillRect(wx - 2, wy + wh + 5, ww + 4, 6);
      for (let k = 0; k < 18; k++) dab(g, wx + rr(0, ww), wy + wh + rr(-3, 4), rr(0, 3), rr(3, 6), rr(2, 4), jit("#4d6b34", 8), 0.9);
      for (let k = 0; k < 14; k++) { const fx = wx + rr(2, ww - 2), fy = wy + wh + rr(-6, 0); g.fillStyle = rgba(jit(pick(["#c8302c", "#d9483a", "#b52a35"]), 8)); g.beginPath(); g.arc(fx, fy, rr(1.6, 2.6), 0, 7); g.fill(); }
    }
    // ---- door (on porch) closed; door states drawn dynamically on top
    g.fillStyle = rgba("#efe8da"); g.fillRect(643, 444, 40, 70);
    // porch floor & steps
    region(g, [[606, 512], [716, 512], [716, 518], [606, 518]], () => hex(woodL), { density: 0.6, len: [8, 16], w: [1.5, 2], a: 0.6, jit: 8 });
    g.fillStyle = rgba(woodD, 0.6); g.fillRect(606, 517, 110, 1.6);
    region(g, [[638, 518], [688, 518], [690, 526], [636, 526]], () => hex("#8a6a4a"), { density: 0.8, len: [6, 12], w: [1.5, 2], a: 0.6, jit: 8 });
    region(g, [[632, 526], [694, 526], [697, 534], [629, 534]], () => hex("#7c5e40"), { density: 0.8, len: [6, 12], w: [1.5, 2], a: 0.6, jit: 8 });
    g.fillStyle = rgba(woodD, 0.5); g.fillRect(636, 525, 54, 1.2); g.fillRect(629, 533, 68, 1.4);

    // ---- roof: front plane trapezoid + right hip plane, terracotta tile rows
    const eaveY = 430, ridgeY = 328, ex0 = 574, ex1 = 924, rx0 = 668, rx1 = 834;
    const roofF = [[ex0, eaveY], [rx0, ridgeY], [rx1, ridgeY], [ex1, eaveY]];
    const roofS = [[ex1, eaveY], [rx1, ridgeY], [985, eaveY + 13]];
    const cols = ["#b5552f", "#a84a2a", "#c3683c", "#9c4426", "#b9603a", "#a35233"];
    g.save(); polyPath(g, roofF); g.fillStyle = rgba("#8c3c22"); g.fill(); g.clip();
    let y = eaveY + 2, rows = 0;
    while (y > ridgeY) {
      const h = lerp(9.5, 6.5, (eaveY - y) / (eaveY - ridgeY)); const t = (eaveY - y) / (eaveY - ridgeY);
      const xa = lerp(ex0, rx0, t), xb = lerp(ex1, rx1, t);
      tileRow(g, xa, xb, y, h, lerp(11, 9, t), cols, "#5a2414"); y -= h * 0.82; rows++;
    }
    // warm light along roof (sun from left) and soft cool falloff to the right
    const rl = g.createLinearGradient(ex0, 0, ex1, 0); rl.addColorStop(0, "rgba(255,200,140,0.22)"); rl.addColorStop(0.6, "rgba(255,200,140,0)"); rl.addColorStop(1, "rgba(60,40,70,0.18)");
    g.fillStyle = rl; g.fillRect(ex0, ridgeY, ex1 - ex0, eaveY - ridgeY);
    g.restore();
    // hip side (in shade)
    g.save(); polyPath(g, roofS); g.fillStyle = rgba("#6e2f1d"); g.fill(); g.clip();
    for (let k = 0; k < 16; k++) { const t = k / 16, yy = lerp(eaveY + 8, ridgeY, t); tileRow(g, lerp(ex1, rx1, t) - 4, lerp(985, rx1, t) + 2, yy + (1 - t) * 3, 7, 9, ["#7d3622", "#733120", "#86402a"], "#3a1a10"); }
    g.restore();
    // ridge cap & hip line
    g.strokeStyle = rgba("#6a2d1a"); g.lineWidth = 4; g.beginPath(); g.moveTo(rx0 - 2, ridgeY + 1); g.lineTo(rx1 + 2, ridgeY + 1); g.stroke();
    g.strokeStyle = rgba("#d08356", 0.8); g.lineWidth = 1.5; g.beginPath(); g.moveTo(rx0, ridgeY - 1); g.lineTo(rx1, ridgeY - 1); g.stroke();
    g.strokeStyle = rgba("#5a2716", 0.9); g.lineWidth = 2.4; g.beginPath(); g.moveTo(ex1, eaveY); g.lineTo(rx1, ridgeY); g.moveTo(ex0, eaveY); g.lineTo(rx0, ridgeY); g.stroke();
    // carved fascia board under the eave
    g.fillStyle = rgba(woodD); g.fillRect(ex0, eaveY - 1, ex1 - ex0, 4);
    g.beginPath(); g.moveTo(ex1, eaveY - 1); g.lineTo(985, eaveY + 12); g.lineTo(985, eaveY + 15); g.lineTo(ex1, eaveY + 3); g.fill();
    for (let x = ex0 + 4; x < ex1; x += 8) { g.fillStyle = rgba(woodD, 0.9); g.beginPath(); g.arc(x, eaveY + 3, 2.4, 0, Math.PI); g.fill(); }
    // chimney
    const chx = 786;
    g.fillStyle = rgba("#5a2414", 0.55); g.beginPath(); g.moveTo(chx + 26, 352); g.lineTo(chx + 58, 366); g.lineTo(chx + 52, 392); g.lineTo(chx + 26, 386); g.fill();
    region(g, [[chx, 346], [chx + 18, 346], [chx + 18, 386], [chx, 386]], (x, y) => mix(mix("#f6e8cc", "#d9cbb6", (x - chx) / 18), "#c9b9a4", smooth(370, 386, y) * 0.6), { density: 1.6, len: [3, 7], w: [1.5, 2.5], a: 0.6, ang: 1.57, jit: 6 });
    g.fillStyle = rgba("#8a7a6a", 0.35); g.fillRect(chx + 3, 352, 1, 9); g.fillRect(chx + 11, 362, 1, 7);
    g.strokeStyle = rgba("#6b5848", 0.6); g.lineWidth = 0.8; g.strokeRect(chx, 346, 26, 40);
    region(g, [[chx + 18, 346], [chx + 26, 349], [chx + 26, 380], [chx + 18, 386]], () => hex("#b8b2c0"), { density: 1.4, len: [3, 7], w: [1.5, 2.5], a: 0.6, ang: 1.57, jit: 5 });
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { g.fillStyle = rgba(jit(r % 2 ? "#a4553a" : "#94472f", 10)); g.fillRect(chx - 1 + k * 5 + (r % 2) * 2.5, 338 + r * 3.2, 4.4, 2.8); }
    g.fillStyle = rgba("#6e3626"); g.beginPath(); g.moveTo(chx + 19, 338); g.lineTo(chx + 27, 341); g.lineTo(chx + 27, 348); g.lineTo(chx + 19, 348); g.fill();
    g.fillStyle = rgba("#4a4248"); g.fillRect(chx - 4, 334, 33, 3.5); g.fillRect(chx + 1, 329, 23, 2.6);
    g.fillStyle = rgba("#2a2226"); g.fillRect(chx + 1, 331.5, 2.4, 3); g.fillRect(chx + 21, 331.5, 2.4, 3);
    g.fillStyle = rgba("#6b2f1d", 0.6); g.beginPath(); g.moveTo(chx + 26, 382); g.lineTo(chx + 40, 384); g.lineTo(chx + 26, 388); g.fill();
    // ---- porch posts with carved brackets (drawn into separate front sprite for depth)
  }
  function porchFront(g) {
    seed(57);
    const wood = "#6a4a30", woodL = "#a07a54", woodD = "#3e2a1e";
    for (const px of [610, 712]) {
      g.fillStyle = rgba(wood); g.fillRect(px - 3, 432, 6, 82);
      g.fillStyle = rgba(woodL, 0.8); g.fillRect(px - 3, 432, 2, 82);
      g.fillStyle = rgba(woodD); g.fillRect(px - 4.5, 468, 9, 3); g.fillRect(px - 4.5, 508, 9, 4);
      // bracket arcs
      g.strokeStyle = rgba(wood); g.lineWidth = 3;
      g.beginPath(); g.arc(px + (px < 650 ? 14 : -14), 432, 14, px < 650 ? Math.PI * 0.5 : 0, px < 650 ? Math.PI : Math.PI * 0.5); g.stroke();
    }
    // railings beside the steps
    for (const [a, b] of [[613, 636], [690, 709]]) {
      g.fillStyle = rgba(wood); g.fillRect(a, 490, b - a, 3);
      for (let x = a + 3; x < b; x += 5) { g.fillStyle = rgba(jit(woodL, 8)); g.fillRect(x, 493, 2.2, 19); g.fillStyle = rgba(woodD, 0.5); g.fillRect(x + 1.6, 493, 0.8, 19); }
    }
    // string of red peppers hanging on the left post
    for (let k = 0; k < 9; k++) { g.fillStyle = rgba(jit(k % 2 ? "#b8322a" : "#c9452e", 10)); g.beginPath(); g.ellipse(603 + Math.sin(k) * 1.2, 446 + k * 3.6, 2, 3.4, 0.2, 0, 7); g.fill(); }
  }

  function wattle(g, x0, x1, yb, hgt, sd, posts) {
    seed(sd);
    const step = 38;
    const stakes = []; for (let x = x0; x <= x1; x += step * rr(0.85, 1.15)) stakes.push(x);
    // stakes behind
    for (const x of stakes) { blade(g, x, yb + 4, x + rr(-2, 2), yb - hgt - rr(4, 10), 0, 5, 3.5, jit("#5b4636", 8), 1); }
    // woven rods
    const rows = Math.round(hgt / 4.2);
    for (let r = 0; r < rows; r++) {
      const yy = yb - r * (hgt / rows) - 2;
      for (let i = 0; i < stakes.length - 1; i++) {
        const a = stakes[i], b = stakes[i + 1], up = (i + r) % 2 ? -1 : 1;
        const c = jit(pick(["#7a5f42", "#8a6c4a", "#6a5039", "#9a7b55"]), 8);
        g.strokeStyle = rgba(mix(c, "#2b1f17", 0.5), 0.8); g.lineWidth = 4.4; g.beginPath(); g.moveTo(a - 3, yy + 1); g.quadraticCurveTo((a + b) / 2, yy + 1 + up * 2.2, b + 3, yy + 1); g.stroke();
        g.strokeStyle = rgba(c); g.lineWidth = 3.2; g.beginPath(); g.moveTo(a - 3, yy); g.quadraticCurveTo((a + b) / 2, yy + up * 2.2, b + 3, yy); g.stroke();
        g.strokeStyle = rgba(mix(c, "#f2d6a6", 0.45), 0.7); g.lineWidth = 0.9; g.beginPath(); g.moveTo(a, yy - 1); g.quadraticCurveTo((a + b) / 2, yy - 1 + up * 2.2, b, yy - 1); g.stroke();
      }
    }
    // stake tops in front + clay pots
    stakes.forEach((x, i) => {
      g.fillStyle = rgba("#4a382b"); g.fillRect(x - 2.2, yb - hgt - 8, 4.4, 10);
      if (posts && i % 3 === 1) {
        const py = yb - hgt - 10;
        g.fillStyle = rgba(jit("#a8562f", 6)); g.beginPath(); g.moveTo(x - 7, py + 3); g.quadraticCurveTo(x - 9, py - 8, x - 3, py - 11); g.lineTo(x + 3, py - 11); g.quadraticCurveTo(x + 9, py - 8, x + 7, py + 3); g.closePath(); g.fill();
        g.fillStyle = rgba("#d98a5a", 0.7); g.beginPath(); g.ellipse(x - 3.5, py - 5, 1.6, 4.5, 0.2, 0, 7); g.fill();
        g.fillStyle = rgba("#6b2f1a"); g.fillRect(x - 7.5, py + 1, 15, 2.6);
      }
    });
  }
  function sunflower(g, x, y, hh, sd) {
    seed(sd);
    blade(g, x, y, x + rr(-6, 6), y - hh, rr(-0.2, 0.2), 4, 2.5, "#4d6a2c", 1);
    for (let i = 0; i < 4; i++) { const ly = y - hh * rr(0.2, 0.8), s = i % 2 ? 1 : -1; blade(g, x, ly, x + s * rr(14, 20), ly - rr(-2, 6), s * 0.3, 7, 0.5, jit("#5b7a30", 8), 0.95); }
    const hx = x + rr(-6, 6), hy = y - hh, r = rr(8, 11);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; dab(g, hx + Math.cos(a) * r, hy + Math.sin(a) * r * 0.9, a, r * 0.75, 3.4, jit("#e8b83a", 12), 0.95); }
    g.fillStyle = rgba("#5a3a1e"); g.beginPath(); g.ellipse(hx, hy, r * 0.62, r * 0.58, 0, 0, 7); g.fill();
    g.fillStyle = rgba("#8a5a2a", 0.7); g.beginPath(); g.ellipse(hx - 1.5, hy - 1.5, r * 0.3, r * 0.28, 0, 0, 7); g.fill();
  }
  function woodpile(g) {
    seed(61);
    // log ends stacked against the shaded side wall
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) {
      const x = 912 + k * 7.2 + (r % 2) * 3.6, y = 513 - r * 6.4 - k * 0.6; const c = jit("#c79a5e", 12);
      g.fillStyle = rgba(mix(c, "#4a3424", 0.55)); g.beginPath(); g.arc(x + 0.8, y + 0.8, 3.6, 0, 7); g.fill();
      g.fillStyle = rgba(mix(c, "#9d8aa0", 0.25)); g.beginPath(); g.arc(x, y, 3.1, 0, 7); g.fill();
      g.strokeStyle = rgba("#8b6a45", 0.6); g.lineWidth = 0.5; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.stroke();
    }
  }

  function paintMid() {
    seed(41); const { c, g } = layer();
    // meadow
    const pts = []; for (let x = -M - 10; x <= W + M + 10; x += 3) pts.push([x, crest(x)]); pts.push([W + M + 10, H + M], [-M - 10, H + M]);
    const meadow = (x, y) => {
      const d = clamp((y - crest(x)) / 280, 0, 1);
      let col = ramp([[0, "#c2c274"], [0.2, "#a6b25e"], [0.5, "#86994c"], [0.8, "#6a8443"], [1, "#55703a"]], d + 0.14 * fbm(x * 0.008, y * 0.02, 3));
      const patch = fbm(x * 0.0035 + 4, y * 0.007, 3);
      col = mix(col, patch > 0 ? "#cdbd6a" : "#4f6a48", Math.min(0.35, Math.abs(patch) * 0.9));
      const sun = clamp(1 - (x + 100) / 1500, 0, 1); col = mix(col, "#e2c879", sun * 0.3 * (1 - d));
      return col;
    };
    region(g, pts, meadow, { density: 0.03, len: [12, 30], w: [3, 6], a: 0.55, ang: 0, angJ: 0.18, jit: 10, dry: 0.2 });
    // perspective strokes: bigger, looser marks toward the viewer
    for (let i = 0; i < 2600; i++) {
      const x = rr(-M, W + M), y = rr(crest(x) + 4, H + M), d = clamp((y - crest(x)) / 280, 0, 1);
      const c = jit(meadow(x, y), 12);
      if (rnd() < 0.45) bristle(g, x, y, rr(-0.12, 0.12), lerp(14, 46, d), lerp(3, 9, d), c, 0.35);
      else blade(g, x, y, x + rr(-3, 4), y - lerp(3, 12, d), rr(-0.3, 0.3), lerp(1.2, 2.6, d), 0.3, mix(c, rnd() < 0.5 ? "#e0d184" : "#3f5a30", 0.35), 0.7);
    }
    // spruces behind house (right) and a distant hedge
    for (let i = 0; i < 70; i++) { const x = rr(-M, W + M); if (x > 560 && x < 990) continue; const y = crest(x) + rr(2, 8); blobTree(g, x, y, rr(6, 11), "#55703f", "#a7ad5c", "#3f5733", 0.9); }
    g.save(); yard(g);
    spruce(g, 1000, 520, 175, 30, 71); spruce(g, 1052, 526, 145, 26, 72); spruce(g, 965, 512, 120, 22, 73); spruce(g, 1100, 532, 110, 22, 74);
    // walnut behind the house's left corner
    walnut(g, 430, 532, 81);
    // grass shadow of walnut
    g.fillStyle = rgba("#45603a", 0.4); polyPath(g, rough([[340, 540], [430, 530], [560, 534], [600, 548], [480, 556], [360, 552]], 3)); g.fill();
    // paths: worn earth ribbons with grass edges
    function pathRibbon(P, w0, w1) {
      const L = [], Rt = [];
      for (let i = 0; i < P.length; i++) {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy);
        const t = i / (P.length - 1), w = lerp(w0, w1, t);
        L.push([P[i][0] - dy / dl * w, P[i][1] + dx / dl * w * 0.5]); Rt.push([P[i][0] + dy / dl * w, P[i][1] - dx / dl * w * 0.5]);
      }
      const poly = rough(L.concat(Rt.reverse()), 2, 0.08);
      region(g, poly, (x, y) => mix("#c9ae7c", "#a88a5e", clamp((y - 530) / 90, 0, 1) * 0.6 + 0.2 * fbm(x * 0.05, y * 0.05)), { density: 0.25, len: [4, 12], w: [1.5, 3.5], a: 0.55, ang: 0, angJ: 0.4, jit: 10, dry: 0.3 });
      edge(g, poly, "#6e7a3c", 0.4, 1.4);
      // grass tufts creeping on the path edges
      for (let i = 0; i < poly.length; i += 2) { const p = poly[i]; if (rnd() < 0.5) blade(g, p[0], p[1] + 1, p[0] + rr(-3, 3), p[1] - rr(3, 7), rr(-0.3, 0.3), 1.6, 0.3, jit("#6f8a3c", 10), 0.9); }
    }
    pathRibbon([[-120, 640], ...PATH_IN, [662, 534]], 22, 9);
    pathRibbon(PATH_OUT, 9, 26);
    // fence right (garden) behind the outgoing path
    wattle(g, 985, 1400, 548, 34, 91, true);
    sunflower(g, 1032, 552, 64, 95); sunflower(g, 1060, 555, 76, 96); sunflower(g, 1092, 560, 58, 97);
    // house
    house(g); woodpile(g);
    // shrubs/flowers at the house foot
    for (let i = 0; i < 160; i++) { const x = rr(560, 990), y = rr(522, 532); if (x > 625 && x < 700) continue; dab(g, x, y, rr(-1, 1), rr(4, 8), rr(2, 4), jit(pick(["#5d7a35", "#476530", "#7f9a45"]), 6), 0.85); }
    for (let i = 0; i < 40; i++) { const x = rr(560, 990), y = rr(518, 530); if (x > 625 && x < 700) continue; g.fillStyle = rgba(jit(pick(["#e9e4d4", "#d8a03a", "#c24a3a", "#8d7ac2"]), 10)); g.beginPath(); g.arc(x, y, rr(1.2, 2), 0, 7); g.fill(); }
    g.restore();
    // meadow wildflowers (small, scattered by noise)
    for (let i = 0; i < 380; i++) { const x = rr(-M, W + M), y = rr(crest(x) + 10, H + M); if (fbm(x * 0.01, y * 0.01) < 0.2) continue; g.fillStyle = rgba(jit(pick(["#e3dcc0", "#e2bf4c", "#c9b8d8", "#e2bf4c"]), 10), 0.7); g.beginPath(); g.arc(x, y, rr(0.8, 1.6) * (1 + (y - 500) / 300), 0, 7); g.fill(); }
    granulate(g, 0.28, 0.9);
    const front = layer(); front.g.save(); yard(front.g); porchFront(front.g); front.g.restore();
    return { c, porch: front.c };
  }

  // ================= FOREGROUND =================
  const FG_FLOWERS = [];
  function paintFG() {
    seed(201); const { c, g } = layer();
    const bank = (x) => 668 - 26 * Math.exp(-Math.pow((x + 20) / 260, 2)) - 70 * Math.exp(-Math.pow((x - 1330) / 230, 2)) + 6 * fbm(x * 0.02, 1, 3);
    const pts = []; for (let x = -M - 10; x <= W + M + 10; x += 3) pts.push([x, bank(x)]); pts.push([W + M + 10, H + M], [-M - 10, H + M]);
    region(g, pts, (x, y) => ramp([[0, "#6f8a3c"], [0.4, "#4f6c30"], [1, "#2f4a25"]], clamp((y - bank(x)) / 110, 0, 1)), { density: 0.05, len: [8, 18], w: [2, 4], a: 0.6, ang: -1.4, angJ: 0.3, jit: 10 });
    // dense grass blades along the bank
    for (let i = 0; i < 2600; i++) {
      const x = rr(-M, W + M), b = bank(x), y = b + Math.pow(rnd(), 0.7) * 90;
      const hh = rr(14, 46) * (1 + (y - b) / 120) * (x < 120 || x > 1120 ? 1.5 : 1);
      const lean = rr(-0.35, 0.35) + 0.12;
      const lit = clamp(1 - (y - b) / 90, 0, 1);
      const col = mix(pick(["#3f5c2a", "#4d6b30", "#5c7a35"]), pick(["#9fae52", "#c3b85a", "#aab866"]), lit * rr(0.3, 0.9));
      blade(g, x, y, x + lean * hh, y - hh, rr(-0.4, 0.4), rr(2, 4), 0.4, jit(col, 8), 0.95);
    }
    granulate(g, 0.25, 0.8);
    // swaying flowers (drawn per frame) — positions only
    seed(222);
    const kinds = ["daisy", "poppy", "corn", "grass", "grass", "butter", "yarrow", "poppy", "grass"];
    for (let i = 0; i < 58; i++) {
      let x = rr(-M + 20, W + M - 20); if (x > 330 && x < 980 && rnd() < 0.75) x = rnd() < 0.5 ? rr(-60, 330) : rr(980, 1340);
      const b = bank(x), y = b + rr(14, 60);
      FG_FLOWERS.push({ x, y, h: rr(34, 80) * (x < 150 || x > 1100 ? 1.35 : 1), k: pick(kinds), ph: rr(0, 6.28), sp: rr(0.6, 1.1), s: rr(0.85, 1.25), lean: rr(-0.2, 0.25) });
    }
    FG_FLOWERS.sort((a, b) => a.y - b.y);
    return c;
  }
  function drawFlower(g, f, t) {
    const sway = Math.sin(t * 1.3 * f.sp + f.ph) * 0.06 + Math.sin(t * 0.55 + f.ph * 2) * 0.03 + f.lean;
    const tx = f.x + Math.sin(sway) * f.h, ty = f.y - Math.cos(sway) * f.h;
    g.lineCap = "round";
    g.strokeStyle = "rgba(62,88,40,0.95)"; g.lineWidth = 1.8 * f.s;
    g.beginPath(); g.moveTo(f.x, f.y); g.quadraticCurveTo(f.x + Math.sin(sway) * f.h * 0.3, f.y - f.h * 0.55, tx, ty); g.stroke();
    if (f.k === "grass") {
      g.fillStyle = "rgba(196,178,104,0.95)";
      for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(tx + Math.sin(sway) * i * 2.5, ty + i * 3.2 * f.s, 1.6 * f.s, 3 * f.s, sway + (i % 2 ? 0.5 : -0.5), 0, 7); g.fill(); }
      return;
    }
    // leaf
    g.fillStyle = "rgba(78,108,48,0.95)"; g.beginPath(); g.ellipse(f.x + Math.sin(sway) * f.h * 0.4 + 5 * f.s, f.y - f.h * 0.4, 7 * f.s, 2.4 * f.s, -0.5, 0, 7); g.fill();
    const s = f.s;
    if (f.k === "daisy") {
      g.save(); g.translate(tx, ty); g.rotate(sway * 0.8 + (f.ph - 3) * 0.12); g.scale(1, 0.55 + 0.3 * Math.abs(Math.sin(f.ph)));
      for (let i = 0; i < 13; i++) { const a = i / 13 * 6.283 + f.ph; g.fillStyle = i % 3 ? "rgba(246,240,226,0.97)" : "rgba(214,208,210,0.97)"; g.beginPath(); g.ellipse(Math.cos(a) * 5 * s, Math.sin(a) * 5 * s, 4.2 * s, 1.6 * s, a, 0, 7); g.fill(); }
      g.fillStyle = "#e0a52c"; g.beginPath(); g.arc(0, 0, 2.7 * s, 0, 7); g.fill(); g.fillStyle = "rgba(160,100,30,0.7)"; g.beginPath(); g.arc(0.8 * s, 0.8 * s, 1.4 * s, 0, 7); g.fill();
      g.restore();
    } else if (f.k === "yarrow") {
      for (let i = 0; i < 14; i++) { const a = (i * 2.4) % 6.283, d = Math.sqrt(i / 14) * 7 * s; g.fillStyle = i % 2 ? "rgba(240,232,214,0.95)" : "rgba(222,212,200,0.95)"; g.beginPath(); g.arc(tx + Math.cos(a) * d, ty + Math.sin(a) * d * 0.45, 1.7 * s, 0, 7); g.fill(); }
    } else if (f.k === "poppy") {
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.283 + f.ph; g.fillStyle = i % 2 ? "rgba(196,46,36,0.97)" : "rgba(220,64,44,0.97)"; g.beginPath(); g.ellipse(tx + Math.cos(a) * 3.6 * s, ty + Math.sin(a) * 2.6 * s - 1, 5 * s, 4 * s, a, 0, 7); g.fill(); }
      g.fillStyle = "#2c2224"; g.beginPath(); g.arc(tx, ty - 1, 1.9 * s, 0, 7); g.fill();
    } else if (f.k === "corn") {
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + f.ph; g.fillStyle = i % 2 ? "rgba(70,110,190,0.97)" : "rgba(96,132,206,0.97)"; g.beginPath(); g.ellipse(tx + Math.cos(a) * 3.4 * s, ty + Math.sin(a) * 2.6 * s, 3.2 * s, 1.4 * s, a, 0, 7); g.fill(); }
      g.fillStyle = "#3a3a7a"; g.beginPath(); g.arc(tx, ty, 1.3 * s, 0, 7); g.fill();
    } else {
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + f.ph; g.fillStyle = "rgba(236,190,48,0.97)"; g.beginPath(); g.ellipse(tx + Math.cos(a) * 2.4 * s, ty + Math.sin(a) * 2 * s, 2.6 * s, 1.8 * s, a, 0, 7); g.fill(); }
    }
  }

  // left foreground fence fragment (closer depth)
  function paintNearFence() {
    seed(301); const { c, g } = layer();
    wattle(g, -160, 120, 650, 44, 303, true);
    granulate(g, 0.25, 0.9);
    return c;
  }

  function paintFG2() {
    seed(601); const { c, g } = layer();
    const clumps = [[-70, 250, 1], [1310, 210, -1]];
    for (const [x0, span, side] of clumps) {
      for (let i = 0; i < 260; i++) {
        const x = x0 + side * Math.pow(rnd(), 1.4) * span * (rnd() < 0.5 ? 1 : 0.5), y = H + M - rr(0, 40);
        const near = 1 - Math.abs(x - x0) / span, hh = rr(70, 250) * (0.45 + 0.75 * near);
        const lean = side * rr(0.05, 0.45);
        const col = mix(pick(["#1f3020", "#2a3f24", "#33492a"]), "#7f8d45", rnd() < 0.18 ? rr(0.4, 0.8) : rr(0, 0.15));
        blade(g, x, y, x + lean * hh, y - hh, rr(-0.5, 0.5), rr(4, 9), 0.6, jit(col, 6), 1);
      }
      // broad plantain / burdock leaves
      for (let k = 0; k < 4; k++) {
        const lx = x0 + side * rr(20, span * 0.6), ly = H + M - rr(40, 120), a = -Math.PI / 2 + side * rr(0.3, 1.0), L = rr(60, 110), Wd = L * 0.32;
        g.save(); g.translate(lx, ly); g.rotate(a);
        g.fillStyle = rgba(jit("#2f4a29", 6)); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.4, -Wd, L, 0); g.quadraticCurveTo(L * 0.4, Wd, 0, 0); g.fill();
        g.fillStyle = rgba("#5f7a3a", 0.6); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.4, -Wd, L, 0); g.quadraticCurveTo(L * 0.5, -Wd * 0.2, 0, 0); g.fill();
        g.strokeStyle = rgba("#a5ad6a", 0.55); g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, 0); g.lineTo(L * 0.95, 0); g.stroke();
        g.lineWidth = 0.7; for (let v = 1; v < 6; v++) { const vx = L * v / 6; g.beginPath(); g.moveTo(vx, 0); g.lineTo(vx + L * 0.1, -Wd * 0.55); g.moveTo(vx, 0); g.lineTo(vx + L * 0.1, Wd * 0.55); g.stroke(); }
        g.restore();
      }
    }
    return c;
  }

  // ================= PAPER =================
  function paintPaper() {
    const c = canvas(W, H), g = c.getContext("2d"), im = g.createImageData(W, H), r = mulberry32(5);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4;
      const fib = fbm(x * 0.35, y * 0.05, 2) * 0.5 + fbm(x * 0.05, y * 0.35, 2) * 0.5; // crossed fibres
      const mot = fbm(x * 0.004, y * 0.004, 3);
      let v = 0.94 + 0.035 * mot + 0.03 * fib + (r() - 0.5) * 0.05;
      const tooth = noise(x * 0.6, y * 0.6); if (tooth > 0.55) v -= 0.06 * (tooth - 0.55) / 0.45;
      v = clamp(v, 0, 1);
      im.data[k] = 255 * v; im.data[k + 1] = 250 * v; im.data[k + 2] = 238 * v; im.data[k + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    // edge darkening like an aged page
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    vg.addColorStop(0, "rgba(120,90,50,0)"); vg.addColorStop(1, "rgba(120,90,50,0.22)");
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    return c;
  }
  // gouache puff sprite for chimney smoke
  function paintPuff(sd) {
    seed(sd); const s = 64, c = canvas(s, s), g = c.getContext("2d");
    g.filter = "blur(4px)"; g.fillStyle = "rgba(196,190,204,0.6)"; g.beginPath(); g.arc(32, 32, 17, 0, 7); g.fill(); g.filter = "none";
    for (let i = 0; i < 110; i++) { const a = rr(0, 6.28), d = Math.pow(rnd(), 0.8) * 20; dab(g, 32 + Math.cos(a) * d, 32 + Math.sin(a) * d * 0.8, rr(0, 3), rr(6, 13), rr(4, 8), jit(d > 10 && Math.sin(a) > -0.2 ? "#9f99ae" : "#d6d0d8", 6), rr(0.15, 0.35)); }
    return c;
  }

  // ---------- SVG displacement (feTurbulence/feDisplacementMap) for organic edges ----------
  function displace(src, filterId) {
    const out = canvas(src.width, src.height), g = out.getContext("2d");
    try { g.filter = `url(#${filterId})`; g.drawImage(src, 0, 0); g.filter = "none"; } catch (e) { g.drawImage(src, 0, 0); }
    // guard: if the filter produced nothing, keep the original
    const probe = g.getImageData(out.width >> 1, out.height - 4, 1, 1).data;
    if (probe[3] === 0) { g.clearRect(0, 0, out.width, out.height); g.drawImage(src, 0, 0); }
    return out;
  }

  window.PAINT = { house, porchFront, woodpile, spruce, walnut, sunflower, wattle, region, dab, blade, bristle, rough, edge, granulate, polyPath, jit, seed, rr, ri, pick, paintPuff, displace, ramp, canvas, tileRow,
    W, H, M, R, LW, LH, mulberry32, noise, fbm, rgba, mix, clamp, lerp, smooth, hex,
    PATH_IN, PATH_OUT, YARD, crest, FG_FLOWERS, drawFlower,
    build() {
      const t0 = performance.now();
      const sky = paintSky();
      const clouds = [paintCloud(401, 300, 70, true), paintCloud(402, 220, 55, false), paintCloud(403, 380, 80, true), paintCloud(404, 170, 40, false), paintCloud(405, 260, 60, true)];
      const far1 = paintRange({ seed: 101, ridge: ridgeFn(3.1, 330, 70, 0.0045, [[880, 160, 55], [1180, 120, 40], [300, 200, 20]]), bottom: 520, col: "#9ba7c0", lit: "#c9c4cf", shade: "#8592b0", haze: "#d6d0cc", hazeK: 0.65, slopeK: 2.2, edge: "#7d86a3", mistY: 380, mist: "#e2d5c6", mistA: 0.6 });
      const far2 = paintRange({ seed: 102, ridge: ridgeFn(7.7, 372, 55, 0.006, [[150, 180, 35], [560, 150, 25]]), bottom: 540, col: "#7d8fa2", lit: "#aeb3ae", shade: "#677a93", haze: "#c9c8c0", hazeK: 0.55, slopeK: 2.4, edge: "#5d6b82", mistY: 410, mist: "#d9d0c2", mistA: 0.55, trees: 9000, forest: -0.15, treeS: 1, treeCol: "#5a6f80" });
      const hills = paintHills();
      const mid = paintMid();
      const nearFence = paintNearFence();
      const fg = paintFG(); const fg2 = paintFG2();
      const paper = paintPaper();
      const puffs = [paintPuff(501), paintPuff(502), paintPuff(503)];
      const L = { sky, far1: displace(far1, "rough-l"), far2: displace(far2, "rough-l"), hills: displace(hills, "rough-m"), mid: displace(mid.c, "rough-s"), porch: mid.porch, nearFence: displace(nearFence, "rough-s"), fg: displace(fg, "rough-m"), fg2: displace(fg2, "rough-m"), clouds, paper, puffs };
      L.buildMs = performance.now() - t0;
      return L;
    },
  };
})();
