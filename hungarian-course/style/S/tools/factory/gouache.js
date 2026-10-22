/* Gouache engine, generalised from style B paint.js: any canvas size, design-unit painting.
   Every random call is seeded, so the same build gives the same pixels. */
(function () {
  "use strict";
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

  const perm = new Uint8Array(512);
  (function () { const r = mulberry32(777), p = []; for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255]; })();
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
  function jit(c, amt = 10) { c = hex(c); const d = rr(-amt, amt); return [clamp(c[0] + d + rr(-amt, amt) * 0.4, 0, 255), clamp(c[1] + d + rr(-amt, amt) * 0.4, 0, 255), clamp(c[2] + d + rr(-amt, amt) * 0.4, 0, 255)]; }

  function canvas(w, h) { const c = document.createElement("canvas"); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }

  const grainTile = (function () {
    const n = 256, c = canvas(n, n), g = c.getContext("2d"), im = g.createImageData(n, n), r = mulberry32(99);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const v = 0.5 + 0.5 * fbm(x * 0.09, y * 0.09, 3), w = r();
      const k = (y * n + x) * 4, d = clamp(v * 0.75 + w * 0.25, 0, 1);
      im.data[k] = im.data[k + 1] = im.data[k + 2] = 0; im.data[k + 3] = Math.round(Math.pow(d, 2.2) * 120);
    }
    g.putImageData(im, 0, 0); return c;
  })();
  // pigment granulation inside what is already painted (works in device px)
  function granulate(g, alpha = 0.3, scale = 1) {
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-atop"; g.globalAlpha = alpha;
    const p = g.createPattern(grainTile, "repeat"); p.setTransform(new DOMMatrix([scale, 0, 0, scale, 0, 0]));
    g.fillStyle = p; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore();
  }

  function dab(g, x, y, ang, len, w, col, a) {
    g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = rgba(col, a);
    g.beginPath(); g.ellipse(0, 0, len / 2, w / 2, 0, 0, Math.PI * 2); g.fill(); g.restore();
  }
  function blade(g, x0, y0, x1, y1, bend, w0, w1, col, a) {
    const mx = (x0 + x1) / 2 + bend * (y1 - y0) * 0.3, my = (y0 + y1) / 2 - bend * (x1 - x0) * 0.3;
    const steps = 8; g.fillStyle = rgba(col, a); g.beginPath(); const L = [], R = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, it = 1 - t;
      const px = it * it * x0 + 2 * it * t * mx + t * t * x1, py = it * it * y0 + 2 * it * t * my + t * t * y1;
      const dx = 2 * it * (mx - x0) + 2 * t * (x1 - mx), dy = 2 * it * (my - y0) + 2 * t * (y1 - my);
      const dl = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, t) / 2;
      L.push([px - dy / dl * w, py + dx / dl * w]); R.push([px + dy / dl * w, py - dx / dl * w]);
    }
    g.moveTo(L[0][0], L[0][1]); for (const p of L) g.lineTo(p[0], p[1]); for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath(); g.fill();
  }
  function bristle(g, x, y, ang, len, w, col, a, lw = 0.35) {
    const n = Math.max(3, Math.round(w / (lw * 1.6))), ca = Math.cos(ang), sa = Math.sin(ang);
    g.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const o = (i / (n - 1) - 0.5) * w, l = len * rr(0.55, 1), s = rr(-0.15, 0.15) * len;
      const ox = -sa * o, oy = ca * o;
      g.strokeStyle = rgba(jit(col, 6), a * rr(0.5, 1)); g.lineWidth = lw * rr(0.6, 1.5);
      g.beginPath(); g.moveTo(x + ox + ca * (s - l / 2), y + oy + sa * (s - l / 2)); g.lineTo(x + ox + ca * (s + l / 2), y + oy + sa * (s + l / 2)); g.stroke();
    }
  }
  // resample + displace along the normal by fbm (organic edge)
  function rough(pts, amp = 0.6, freq = 0.2, closed = true, sd = 0, step = 1.2) {
    const out = [], n = pts.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = pts[i], b = pts[(i + 1) % n], d = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.ceil(d / step));
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

  // paint a region: base fill + many brush dabs clipped inside; colour from fn(x,y)
  function region(g, pts, colFn, o = {}) {
    const bb = bbox(pts), area = (bb[2] - bb[0]) * (bb[3] - bb[1]);
    g.save(); polyPath(g, pts);
    if (o.base !== false) { g.fillStyle = rgba(colFn((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2), o.baseA ?? 1); g.fill(); }
    g.clip();
    if (o.under) { g.fillStyle = rgba(o.under); g.fill(); }
    const n = Math.round(area * (o.density || 0.5));
    const pad = o.pad ?? 2;
    for (let i = 0; i < n; i++) {
      const x = rr(bb[0] - pad, bb[2] + pad), y = rr(bb[1] - pad, bb[3] + pad);
      const ang = (typeof o.ang === "function" ? o.ang(x, y) : o.ang || 0) + rr(-1, 1) * (o.angJ ?? 0.25);
      const len = rr(o.len?.[0] ?? 3, o.len?.[1] ?? 7), w = rr(o.w?.[0] ?? 1.2, o.w?.[1] ?? 2.6);
      const c = jit(colFn(x, y), o.jit ?? 7);
      if (o.dry && rnd() < o.dry) bristle(g, x, y, ang, len * 1.3, w, c, o.a ?? 0.5, o.lw ?? 0.3);
      else dab(g, x, y, ang, len, w, c, (o.a ?? 0.5) * rr(0.5, 1));
    }
    g.restore();
  }
  // darker pigment pooled along the edge, partly broken
  function edge(g, pts, col, a = 0.35, w = 0.5, closed = true) {
    g.save(); g.lineCap = "round"; g.strokeStyle = rgba(col, a);
    const n = closed ? pts.length : pts.length - 1;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      if (noise(p[0] * 0.13, p[1] * 0.13) < -0.4) continue;
      g.lineWidth = w * (0.6 + 0.6 * (0.5 + 0.5 * noise(p[0] * 0.3, p[1] * 0.3)));
      g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
    }
    g.restore();
  }
  // soft wash inside a polygon (shading), feathered with a blur
  function wash(g, pts, col, a, blur = 0) {
    g.save(); polyPath(g, pts); g.clip();
    g.filter = blur ? `blur(${blur}px)` : "none";
    g.fillStyle = rgba(col, a); g.fill(); g.restore();
  }

  // ----- shape helpers (design units) -----
  function ellipsePts(cx, cy, rx, ry, n = 40, rot = 0) {
    const out = [], c = Math.cos(rot), s = Math.sin(rot);
    for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2, x = Math.cos(t) * rx, y = Math.sin(t) * ry; out.push([cx + x * c - y * s, cy + x * s + y * c]); }
    return out;
  }
  // Catmull-Rom through points (closed or open)
  function spline(pts, n = 8, closed = true) {
    const out = [], L = pts.length, get = (i) => closed ? pts[(i + L) % L] : pts[Math.max(0, Math.min(L - 1, i))];
    const segs = closed ? L : L - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
                  0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    if (!closed) out.push(pts[L - 1]);
    return out;
  }
  // limb: tapered capsule from p0 (width w0) to p1 (width w1)
  function limb(p0, p1, w0, w1, n = 10) {
    const dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    const out = [];
    // cap around p1: from +n through +u to -n
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI, r = w1 / 2, c = Math.cos(a), s = Math.sin(a); out.push([p1[0] + (nx * c + ux * s) * r, p1[1] + (ny * c + uy * s) * r]); }
    // cap around p0: from -n through -u to +n
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI, r = w0 / 2, c = Math.cos(a), s = Math.sin(a); out.push([p0[0] + (-nx * c - ux * s) * r, p0[1] + (-ny * c - uy * s) * r]); }
    return out;
  }
  function rrect(x, y, w, h, r, n = 5) {
    const out = [], cs = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    for (const [cx, cy, a0] of cs) for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return out;
  }

  // ----- SVG displacement for organic edges -----
  function displace(src, filterId) {
    const out = canvas(src.width, src.height), g = out.getContext("2d");
    try { g.filter = `url(#${filterId})`; g.drawImage(src, 0, 0); g.filter = "none"; } catch (e) { g.drawImage(src, 0, 0); }
    // guard: if the filter produced nothing, keep the original
    const d = g.getImageData(0, 0, out.width, out.height).data; let any = false;
    for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 0) { any = true; break; }
    if (!any) { g.clearRect(0, 0, out.width, out.height); g.drawImage(src, 0, 0); }
    return out;
  }

  // a sprite: canvas with design-unit transform; bounds [x0,y0,x1,y1] in design units
  function sprite(bounds, S, margin = 4) {
    const [x0, y0, x1, y1] = bounds;
    const c = canvas((x1 - x0 + 2 * margin) * S, (y1 - y0 + 2 * margin) * S), g = c.getContext("2d");
    g.setTransform(S, 0, 0, S, (-x0 + margin) * S, (-y0 + margin) * S); g.lineCap = "round"; g.lineJoin = "round";
    return { c, g, S, ox: x0 - margin, oy: y0 - margin };
  }

  window.GOU = { mulberry32, seed, rr, ri, pick, clamp, lerp, smooth, noise, fbm, hex, mix, rgba, jit, canvas, granulate, dab, blade, bristle,
    rough, polyPath, bbox, region, edge, wash, ellipsePts, spline, limb, rrect, displace, sprite, get rnd() { return rnd; } };
})();
