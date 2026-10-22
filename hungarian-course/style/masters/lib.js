/* Shared helpers for the "masters" scenes. Everything seeded and deterministic. */
(function () {
  "use strict";
  const W = 1280, H = 720;
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
  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x, 0, 1));
  const eOut = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

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
  function ramp(stops, t) { t = clamp(t, 0, 1); for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) { const a = stops[i - 1], b = stops[i]; return mix(a[1], b[1], (t - a[0]) / (b[0] - a[0] || 1)); } return hex(stops[stops.length - 1][1]); }

  function canvas(w = W, h = H) { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; }
  function layer(w = W, h = H) { const c = canvas(w, h), g = c.getContext("2d"); g.lineCap = "round"; g.lineJoin = "round"; return { c, g }; }

  function resample(pts, step = 3, closed = true) {
    const out = [], n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / step));
      for (let j = 0; j < k; j++) out.push([lerp(a[0], b[0], j / k), lerp(a[1], b[1], j / k)]);
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }
  function rough(pts, amp = 2, freq = 0.05, closed = true, sd = 0, step = 3) {
    const rs = resample(pts, step, closed), n = rs.length, out = [];
    for (let i = 0; i < n; i++) {
      const p = rs[i], a = rs[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = rs[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const o = amp * (fbm(p[0] * freq + sd, p[1] * freq - sd, 3) + 0.3 * noise(p[0] * freq * 5 + sd, p[1] * freq * 5));
      out.push([p[0] - ty * o, p[1] + tx * o]);
    }
    return out;
  }
  // Catmull-Rom through control points
  function spline(pts, n = 10, closed = false) {
    const out = [], N = pts.length, m = closed ? N : N - 1;
    const P = (i) => closed ? pts[(i + N) % N] : pts[clamp(i, 0, N - 1)];
    for (let i = 0; i < m; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                  0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    if (!closed) out.push(pts[N - 1].slice());
    return out;
  }
  function path(g, pts, closed = true) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); if (closed) g.closePath(); }
  function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
  function bbox(pts) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const p of pts) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); c = Math.max(c, p[0]); d = Math.max(d, p[1]); } return [a, b, c, d]; }
  function ellipse(cx, cy, rx, ry, n = 48, a0 = 0, a1 = Math.PI * 2) { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
  // variable-width stroke along a polyline: w(t) gives width at param t in [0,1]
  function ribbon(pts, wfn) {
    const n = pts.length, L = [], Rr = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const w = wfn(i / (n - 1 || 1), pts[i]) / 2;
      L.push([pts[i][0] - ty * w, pts[i][1] + tx * w]); Rr.push([pts[i][0] + ty * w, pts[i][1] - tx * w]);
    }
    return L.concat(Rr.reverse());
  }
  function blur(c, r) { const o = canvas(c.width, c.height), g = o.getContext("2d"); g.filter = `blur(${r}px)`; g.drawImage(c, 0, 0); return o; }

  window.U = { W, H, R, clamp, lerp, smooth, ease, eOut, seg, noise, fbm, hex, mix, rgba, jit, ramp, canvas, layer, resample, rough, spline, path, rect, bbox, ellipse, ribbon, blur, mulberry32 };
})();
