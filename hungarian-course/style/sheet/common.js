/* Shared helpers for the style sheet cells. Everything seeded. */
(function () {
  "use strict";
  const AW = 800, AH = 477, DPR = 2;
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rnd = mulberry32(1);
  const R = {
    seed: (s) => (rnd = mulberry32(s)),
    r: () => rnd(),
    rr: (a, b) => a + (b - a) * rnd(),
    ri: (a, b) => Math.floor(a + (b + 1 - a) * rnd()),
    pick: (arr) => arr[Math.floor(rnd() * arr.length)],
    gauss: () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) / 1.5; },
  };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  // simplex noise
  const perm = new Uint8Array(512);
  (function () { const r = mulberry32(4242), p = []; for (let i = 0; i < 256; i++) p[i] = i; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
  const G = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  function noise(x, y) {
    const F2 = 0.366025403, G2 = 0.211324865;
    const s = (x + y) * F2, i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2, x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = 1 - i1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255; let n = 0, tt, g;
    tt = 0.5 - x0 * x0 - y0 * y0; if (tt > 0) { g = G[perm[ii + perm[jj]] & 7]; tt *= tt; n += tt * tt * (g[0] * x0 + g[1] * y0); }
    tt = 0.5 - x1 * x1 - y1 * y1; if (tt > 0) { g = G[perm[ii + i1 + perm[jj + j1]] & 7]; tt *= tt; n += tt * tt * (g[0] * x1 + g[1] * y1); }
    tt = 0.5 - x2 * x2 - y2 * y2; if (tt > 0) { g = G[perm[ii + 1 + perm[jj + 1]] & 7]; tt *= tt; n += tt * tt * (g[0] * x2 + g[1] * y2); }
    return 70 * n;
  }
  function fbm(x, y, o = 4) { let a = 0.5, f = 1, s = 0, n = 0; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f); n += a; a *= 0.5; f *= 2.03; } return s / n; }

  function hex(h) { if (Array.isArray(h)) return h; h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function mix(a, b, t) { a = hex(a); b = hex(b); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
  function rgba(c, a = 1) { c = hex(c); return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`; }
  function jit(c, amt = 10) { c = hex(c); const d = R.rr(-amt, amt); return [clamp(c[0] + d, 0, 255), clamp(c[1] + d, 0, 255), clamp(c[2] + d, 0, 255)]; }

  function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  // full-resolution art canvas inserted into #art, ctx pre-scaled so units = CSS px
  function artCanvas(root) {
    const c = canvas(AW * DPR, AH * DPR); c.style.width = AW + "px"; c.style.height = AH + "px"; c.style.display = "block";
    root.appendChild(c); const g = c.getContext("2d"); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.lineCap = "round"; g.lineJoin = "round";
    return { c, g };
  }
  function layer(w = AW * DPR, h = AH * DPR) { const c = canvas(w, h), g = c.getContext("2d"); g.setTransform(DPR, 0, 0, DPR, 0, 0); g.lineCap = "round"; g.lineJoin = "round"; return { c, g }; }

  // resample polyline / polygon into points ~step apart
  function resample(pts, step = 3, closed = true) {
    const out = [], n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / step));
      for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  // displace a polygon along its normals by noise
  function rough(pts, amp = 2, freq = 0.05, closed = true, sd = 0, step = 3) {
    const rs = resample(pts, step, closed), n = rs.length, out = [];
    for (let i = 0; i < n; i++) {
      const p = rs[i], a = rs[(i - 1 + n) % n], b = rs[(i + 1) % n];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const o = amp * (fbm(p[0] * freq + sd, p[1] * freq - sd, 3) + 0.3 * noise(p[0] * freq * 5 + sd, p[1] * freq * 5));
      out.push([p[0] - ty * o, p[1] + tx * o]);
    }
    return out;
  }
  function path(g, pts, closed = true) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (closed) g.closePath(); }
  function svgPath(pts, closed = true) { return "M" + pts.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + (closed ? "Z" : ""); }
  function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
  function bbox(pts) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } return [a, b, c, d]; }
  function inPoly(x, y, pts) { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins; } return ins; }

  /* Canonical frontal house (units). Origin top-left, ~400 x 232.
     Hipped tile roof, lime-washed walls, porch (tornác) on the left with two posts and a door,
     two shuttered windows on the right, chimney on the right roof plane, blue plinth. */
  const HOUSE = {
    ground: 226,
    wall: [40, 132, 360, 222], plinth: 208,
    roof: { eaveY: 134, ridgeY: 30, ex0: 16, ex1: 384, rx0: 124, rx1: 276 },
    chim: { x0: 244, x1: 268, top: 8, base: 66 },
    porch: { x0: 40, x1: 148, posts: [54, 136], door: [78, 150, 112, 214] },
    wins: [[184, 152, 38, 42], [282, 152, 38, 42]], shutter: 12,
    steps: [[70, 214, 120, 220], [64, 220, 126, 226]],
  };

  const CAPTIONS = [
    "Гуашь на бумаге", "Плоский вектор с зерном", "Ризограф", "Линогравюра, народная резьба",
    "Тушь и акцентный цвет", "Акварель", "Бумажный коллаж", "Цветные карандаши", "Венгерская вышивка (матьо)",
  ];

  window.U = { AW, AH, DPR, R, clamp, lerp, smooth, noise, fbm, hex, mix, rgba, jit, canvas, artCanvas, layer, resample, rough, path, svgPath, rect, bbox, inPoly, HOUSE, CAPTIONS, mulberry32 };
})();
