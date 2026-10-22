/* Kirill puppet runtime: assembles the painted parts (assets/img/kirill/*.png) into poses.
   Pure functions of the pose object: draw(ctx, pose) paints, ink(ctx, pose, p) draws the ink line-art. */
(function () {
  "use strict";
  const BASE = "assets/img/kirill/";
  let M = null; const IMG = {}, CUT = {};
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  function loadImg(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(i); i.src = src; }); }

  let LOADING = null;
  function load(manifest) { if (!LOADING) LOADING = _load(manifest || window.KIRILL_MANIFEST); return LOADING; }
  async function _load(manifest) {
    M = manifest;
    await Promise.all(Object.keys(M).map(async (k) => { IMG[k] = await loadImg(BASE + k + ".png"); try { await IMG[k].decode(); } catch (e) {} }));
  }
  // paper cut-out: a dilated off-white silhouette of each part
  function buildCut(r = 3.2, col = "#FBF7EE") {
    if (CUT.__done) return; CUT.__done = 1;
    for (const k of Object.keys(M)) {
      if (k === '__done') continue; const im = IMG[k], c = document.createElement("canvas"); c.width = im.width + 2 * Math.ceil(r * M[k].S); c.height = im.height + 2 * Math.ceil(r * M[k].S);
      const g = c.getContext("2d"), pad = Math.ceil(r * M[k].S), rp = r * M[k].S;
      for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.drawImage(im, pad + Math.cos(a) * rp, pad + Math.sin(a) * rp); }
      g.drawImage(im, pad, pad);
      g.globalCompositeOperation = "source-in"; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
      CUT[k] = { c, pad };
    }
  }

  function part(ctx, k, set) {
    const p = M[k]; if (!p) return;
    if (set === "cut") { const c = CUT[k]; if (!c) return; ctx.drawImage(c.c, p.ox - c.pad / p.S, p.oy - c.pad / p.S, c.c.width / p.S, c.c.height / p.S); return; }
    ctx.drawImage(IMG[k], p.ox, p.oy, p.w / p.S, p.h / p.S);
  }

  // ---------- skeleton ----------
  // returns an ordered list of [partName, matrix] in figure units (ground y=0)
  function rig(pose) {
    const out = []; const v = pose.view || "F";
    const T = (m, x, y, a) => { const r = m.translate(x, y); return a ? r.rotate(a * 180 / Math.PI) : r; };
    const root = new DOMMatrix();
    if (v === "F") {
      const hip = T(root, 0, -97 + (pose.bob || 0), pose.lean || 0);
      const legs = T(root, 0, -97 + (pose.bob || 0), 0);
      const A = pose.armL || [0.06, 0.04], B = pose.armR || [-0.06, -0.04];
      out.push(["packF", hip]);
      out.push(["legFl", T(legs, -8.4, 1, pose.legL || 0.02)]);
      out.push(["legFr", T(legs, 8.4, 1, pose.legR || -0.02)]);
      out.push(["torsoF", hip]);
      const neck = T(hip, 0, -62, pose.head || 0);
      out.push(["headF", neck]);
      out.push(["faceF", T(neck, pose.look || 0, 0, 0)]);
      const sl = T(hip, -18.4, -55, A[0]); out.push(["armFlU", sl]); out.push(["armFlL", T(sl, 0, 30.5, A[1])]);
      const sr = T(hip, 18.4, -55, B[0]); out.push(["armFrU", sr]); out.push([pose.wave ? "armFwL" : "armFrL", T(sr, 0, 30.5, B[1])]);
    } else {
      const hipM = T(root, 0, -97 + (pose.bob || 0), 0);
      const torso = T(root, 0, -97 + (pose.bob || 0), pose.lean || 0);
      const N = pose.armN || [0, -0.1], F = pose.armF || [0, -0.1], LN = pose.legN || [0, 0], LF = pose.legF || [0, 0];
      const shF = T(torso, 1.5, -55, F[0]); out.push(["armSfU", shF]); out.push(["armSfL", T(shF, 0, 30.5, F[1])]);
      const thF = T(hipM, 0.5, 0, LF[0]); out.push(["legSfT", thF]); out.push(["legSfS", T(thF, 0, 45.5, LF[1])]);
      out.push(["torsoS", torso]);
      out.push(["packS", torso]);
      const thN = T(hipM, -0.5, 0, LN[0]); out.push(["legSnT", thN]); out.push(["legSnS", T(thN, 0, 45.5, LN[1])]);
      out.push(["headS", T(torso, 1, -62.5, pose.head || 0)]);
      const shN = T(torso, 1.5, -55, N[0]); out.push(["armSnU", shN]); out.push(["armSnL", T(shN, 0, 30.5, N[1])]);
    }
    return out;
  }
  function base(ctx, pose) {
    const s = pose.s || 1; ctx.translate(pose.x || 0, pose.y || 0); ctx.scale(s * (pose.flip ? -1 : 1), s);
  }
  function draw(ctx, pose, set) {
    if (!M) return; ctx.save(); base(ctx, pose); if (pose.alpha != null) ctx.globalAlpha = pose.alpha;
    for (const [k, m] of rig(pose)) { ctx.save(); ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f); part(ctx, k, set); ctx.restore(); }
    ctx.restore();
  }
  // contact shadow under the feet
  function shadow(ctx, pose, a = 0.22) {
    const s = pose.s || 1; ctx.save(); ctx.translate(pose.x, pose.y); ctx.scale(s, s);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 30); gr.addColorStop(0, `rgba(60,44,28,${a})`); gr.addColorStop(1, "rgba(60,44,28,0)");
    ctx.fillStyle = gr; ctx.scale(1, 0.16); ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // ink line-art, drawn progressively (p 0..1 over all lines in rig order); each part first
  // knocks out what lies behind it with a paper-coloured silhouette, so hidden lines stay hidden
  const PAPER = {};
  function buildPaper(col) {
    for (const k of Object.keys(M)) { const im = IMG[k], c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.drawImage(im, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); PAPER[k] = c; }
  }
  function hash(i) { const x = Math.sin(i * 127.1) * 43758.5453; return x - Math.floor(x); }
  function ink(ctx, pose, p, o = {}) {
    if (!M) return; const col = o.col || "#1E1813", w = o.w || 0.8;
    if (o.paper && !PAPER.__col) { buildPaper(o.paper); PAPER.__col = o.paper; }
    const L = rig(pose); let total = 0; const items = [];
    for (const [k, m] of L) { const ls = []; for (const pl of (M[k].outline || [])) { const P = pl.p; let len = 0; const n = pl.c ? P.length : P.length - 1; for (let i = 0; i < n; i++) { const a = P[i], b = P[(i + 1) % P.length]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); } ls.push([P, pl.c, len]); total += len; } items.push([k, m, ls]); }
    // drawing order (how a hand would draw him) differs from paint order (occlusion)
    const ORDER = ["headF", "faceF", "torsoF", "armFlU", "armFlL", "armFrU", "armFrL", "armFwL", "legFl", "legFr", "packF", "headS", "torsoS", "packS", "armSnU", "armSnL", "legSnT", "legSnS", "legSfT", "legSfS", "armSfU", "armSfL"];
    const start = new Map(); let acc0 = 0;
    for (const nm of ORDER) for (const it of items) if (it[0] === nm) for (const l of it[2]) { start.set(l, acc0); acc0 += l[2]; }
    const B = clamp(p, 0, 1) * total;
    ctx.save(); base(ctx, pose); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = col;
    let n = 0;
    for (const [k, m, ls] of items) {
      const any = ls.some((l) => B > (start.get(l) || 0));
      if (!any) continue;
      ctx.save(); ctx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
      if (o.paper && PAPER[k]) { const q = M[k]; ctx.drawImage(PAPER[k], q.ox, q.oy, q.w / q.S, q.h / q.S); }
      if (o.erase) { const q = M[k]; ctx.globalCompositeOperation = "destination-out"; ctx.drawImage(IMG[k], q.ox, q.oy, q.w / q.S, q.h / q.S); ctx.globalCompositeOperation = "source-over"; }
      for (const l of ls) {
        const [P, closed, len] = l; const budget = B - (start.get(l) || 0); n++;
        if (budget <= 0) continue;
        let acc = 0; const segs = closed ? P.length : P.length - 1;
        for (let i = 0; i < segs && acc < budget; i++) {
          const a = P[i], b = P[(i + 1) % P.length], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const f = Math.min(1, (budget - acc) / (d || 1));
          ctx.lineWidth = w * (0.7 + 0.45 * Math.sin(i * 0.23 + n) + 0.25 * hash(i + n * 31));
          ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); ctx.stroke();
          acc += d;
        }
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- pose library ----------
  // side walk cycle; phase in radians (2π = two steps); amp 0..1
  function walk(phase, amp = 1) {
    const A = 0.42 * amp, s = Math.sin(phase), s2 = Math.sin(phase + Math.PI);
    const knee = (ph) => 0.06 + 0.85 * amp * Math.pow(Math.max(0, Math.cos(ph + 0.55)), 1.6);
    return {
      view: "S", bob: -2.2 * amp * (0.5 + 0.5 * Math.cos(2 * phase)) + 1.1 * amp, lean: 0.045 * amp, head: -0.03 * amp,
      legN: [-A * s, knee(phase)], legF: [-A * s2, knee(phase + Math.PI)],
      armN: [0.36 * amp * s, -0.18 - 0.22 * amp * Math.max(0, -s)], armF: [0.36 * amp * s2, -0.18 - 0.22 * amp * Math.max(0, -s2)],
    };
  }
  function stand(view = "F") {
    return view === "F" ? { view: "F", armL: [0.07, 0.05], armR: [-0.07, -0.05] } : { view: "S", legN: [0.02, 0.02], legF: [-0.03, 0.03], armN: [0.02, -0.1], armF: [-0.04, -0.12] };
  }
  // front wave; w 0..1 raises the arm, t drives the hand
  function wave(t, w = 1) {
    const up = -2.25 * w + (-0.07) * (1 - w);
    return { view: "F", wave: w > 0.35, armL: [0.07, 0.05], armR: [up, (-0.6 + 0.36 * Math.sin(t * 9.4)) * w + (-0.05) * (1 - w)] };
  }
  function sit() { return { view: "S", bob: 46, legN: [-1.5, 1.42], legF: [-1.42, 1.5], armN: [-0.95, -0.85], armF: [-0.9, -0.95], lean: -0.04 }; }

  window.KIRILL = { load, buildCut, draw, ink, shadow, rig, walk, stand, wave, sit, get ready() { return !!M; } };
})();
