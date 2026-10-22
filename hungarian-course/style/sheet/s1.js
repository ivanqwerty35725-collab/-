/* 1. Gouache — uses the procedural gouache engine (paint.js) from style B, house isolated as a book vignette. */
window.STYLE = async function (root) {
  const P = window.PAINT, { AW, AH, DPR, clamp, fbm, noise, mulberry32 } = U;
  const K = 1.13, CX = 784, CY = 470, OX = 400, OY = 288; // engine (CX,CY) -> css (OX,OY)
  const setT = (g) => g.setTransform(DPR * K, 0, 0, DPR * K, DPR * (OX - CX * K), DPR * (OY - CY * K));
  const W = AW * DPR, H = AH * DPR;

  // ---- paper
  const paper = U.canvas(W, H); {
    const g = paper.getContext("2d"), im = g.createImageData(W, H), r = mulberry32(5);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4;
      const fib = fbm(x * 0.22, y * 0.035, 2) * 0.5 + fbm(x * 0.035, y * 0.22, 2) * 0.5;
      const mot = fbm(x * 0.003, y * 0.003, 3);
      let v = 0.955 + 0.03 * mot + 0.025 * fib + (r() - 0.5) * 0.04;
      const tooth = noise(x * 0.45, y * 0.45); if (tooth > 0.55) v -= 0.05 * (tooth - 0.55) / 0.45;
      v = clamp(v, 0, 1); im.data[k] = 255 * v; im.data[k + 1] = 249 * v; im.data[k + 2] = 236 * v; im.data[k + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  }

  // ---- painting layer (engine units)
  const L = U.canvas(W, H), g = L.getContext("2d"); setT(g); g.lineCap = "round"; g.lineJoin = "round";
  const { region, dab, bristle, blade, rough, edge, seed, rr, jit, mix, hex, rgba } = { ...P, mix: P.mix, hex: P.hex, rgba: P.rgba };

  // backdrop: loose sky wash with dry-brush ragged edge
  seed(7);
  const sky = []; for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2; const rx = 262, ry = 150; let x = CX + Math.cos(a) * rx, y = 430 + Math.sin(a) * ry; if (y > 515) y = 515; sky.push([x, y]); }
  const skyR = U.rough(sky, 7, 0.012, true, 3, 4);
  const skyCol = (x, y) => P.ramp([[0, "#9fb6c9"], [0.35, "#bccbd3"], [0.62, "#e8dcc4"], [0.8, "#f1d3a6"], [1, "#eec393"]], (y - 280) / 235);
  region(g, skyR, skyCol, { density: 0.05, len: [30, 80], w: [8, 18], a: 0.22, ang: 0, angJ: 0.06, jit: 6, dry: 0.3 });
  for (let i = 0; i < 260; i++) { const a = rr(0, Math.PI * 2), x = CX + Math.cos(a) * rr(225, 275), y = 430 + Math.sin(a) * rr(125, 160); if (y > 510) continue; bristle(g, x, y, rr(-0.08, 0.08), rr(30, 70), rr(5, 10), jit(skyCol(x, y), 5), 0.28); }
  // soft clouds
  for (let i = 0; i < 160; i++) { const cx = rr(0, 1) < 0.5 ? 640 : 900, x = cx + rr(-55, 55), y = 330 + rr(-12, 10) + (cx > 800 ? -18 : 0); dab(g, x, y, rr(-0.2, 0.2), rr(10, 26), rr(6, 12), jit("#f8efe2", 5), rr(0.2, 0.5)); }
  // distant blue hills inside the wash
  const hill = []; for (let x = 520; x <= 1040; x += 6) hill.push([x, 478 - 22 * Math.sin((x - 520) * 0.012) - 10 * P.fbm(x * 0.02, 2, 3)]);
  hill.push([1040, 520], [520, 520]);
  g.save(); P.polyPath(g, skyR); g.clip();
  region(g, hill, (x, y) => mix("#8899a8", "#a7b3a6", (y - 450) / 60), { density: 0.08, len: [10, 24], w: [3, 7], a: 0.5, ang: 0.3, angJ: 0.4, jit: 5 });
  const hill2 = []; for (let x = 520; x <= 1040; x += 6) hill2.push([x, 500 - 14 * Math.sin((x - 600) * 0.016 + 1) - 6 * P.fbm(x * 0.03, 5, 3)]);
  hill2.push([1040, 530], [520, 530]);
  region(g, hill2, (x, y) => mix("#7e977a", "#9fae80", 0.5 + 0.5 * Math.sin(x * 0.02)), { density: 0.1, len: [8, 20], w: [3, 6], a: 0.55, ang: 0, angJ: 0.4, jit: 7 });
  g.restore();

  // meadow patch the house sits on
  seed(21);
  const mead = []; for (let i = 0; i <= 40; i++) { const t = i / 40, x = 488 + t * 590; mead.push([x, 508 + 6 * Math.sin(t * 9)]); }
  for (let i = 0; i <= 30; i++) { const t = i / 30, x = 1078 - t * 590; mead.push([x, 548 + 32 * Math.sin(t * Math.PI) + 6 * Math.sin(t * 13)]); }
  const meadR = rough(mead, 6, 0.03, true, 9);
  const mcol = (x, y) => { const d = clamp((y - 505) / 70, 0, 1); let c = P.ramp([[0, "#a9b261"], [0.4, "#8c9d4f"], [1, "#6b8443"]], d + 0.15 * P.fbm(x * 0.02, y * 0.04, 3)); return mix(c, "#d9c47a", clamp(1 - (x - 480) / 400, 0, 1) * 0.25); };
  region(g, meadR, mcol, { density: 0.08, len: [12, 28], w: [3, 6], a: 0.6, ang: 0, angJ: 0.2, jit: 9, dry: 0.25 });
  for (let i = 0; i < 900; i++) {
    const x = rr(495, 1070), y = rr(508, 590); if (!U.inPoly(x, y, meadR)) continue;
    const c = jit(mcol(x, y), 12);
    if (rr(0, 1) < 0.4) bristle(g, x, y, rr(-0.1, 0.1), rr(12, 26), rr(3, 6), c, 0.35);
    else blade(g, x, y, x + rr(-2, 3), y - rr(4, 10), rr(-0.3, 0.3), 1.6, 0.3, mix(c, rr(0, 1) < 0.5 ? "#e3d48a" : "#40592f", 0.35), 0.75);
  }
  // ragged grass fringe under the meadow edge
  for (let i = 0; i < 260; i++) { const t = rr(0, 1), x = 1078 - t * 590, y = 548 + 32 * Math.sin(t * Math.PI) + rr(-4, 3); blade(g, x, y, x + rr(-3, 3), y - rr(5, 14), rr(-0.4, 0.4), 2, 0.3, jit(mix("#5d7a3a", "#a5b25e", rr(0, 1)), 8), 0.8); }
  // dirt path from steps forward
  seed(23);
  const pathPts = [[650, 534], [676, 534], [700, 560], [712, 590], [650, 590], [640, 560]];
  region(g, rough(pathPts, 3, 0.05), (x, y) => mix("#cdb48c", "#b39a74", (y - 534) / 60), { density: 0.4, len: [6, 14], w: [2, 4], a: 0.55, ang: 0, angJ: 0.3, jit: 8 });

  // spruces behind right corner + walnut-ish shrub left
  P.spruce(g, 1000, 520, 150, 34, 31); P.spruce(g, 1034, 524, 118, 28, 32); P.spruce(g, 968, 516, 96, 22, 33);
  // house + porch
  P.house(g); P.woodpile(g);
  // closed door (from index.html drawDoor, o = 0)
  { const x0 = 646, x1 = 680, y0 = 447, y1 = 513;
    g.fillStyle = "#6e4a2e"; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.strokeStyle = "rgba(40,26,16,0.55)"; g.lineWidth = 0.9; for (let i = 1; i < 4; i++) { const x = x0 + (x1 - x0) * i / 4; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke(); }
    g.strokeStyle = "rgba(40,26,16,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + 2, y0 + 14); g.lineTo(x1 - 2, y0 + 14); g.moveTo(x0 + 2, y1 - 14); g.lineTo(x1 - 2, y1 - 14); g.stroke();
    g.fillStyle = "rgba(255,210,160,0.25)"; g.fillRect(x0, y0, 6, y1 - y0);
    g.fillStyle = "#c9a14a"; g.beginPath(); g.arc(x1 - 5, (y0 + y1) / 2, 1.4, 0, 7); g.fill();
    for (let i = 0; i < 40; i++) dab(g, rr(x0 + 2, x1 - 2), rr(y0 + 2, y1 - 2), 1.57, rr(6, 14), rr(1.5, 3), jit("#6e4a2e", 10), 0.35);
  }
  P.porchFront(g);
  // shrubs / geraniums at the foot
  seed(77);
  for (let i = 0; i < 220; i++) { const x = rr(575, 990), y = rr(520, 532); if (x > 628 && x < 700) continue; dab(g, x, y, rr(-1, 1), rr(4, 8), rr(2, 4), jit(P.pick(["#5d7a35", "#476530", "#7f9a45"]), 6), 0.85); }
  for (let i = 0; i < 60; i++) { const x = rr(575, 990), y = rr(517, 530); if (x > 628 && x < 700) continue; g.fillStyle = rgba(jit(P.pick(["#e9e4d4", "#d8a03a", "#c24a3a", "#8d7ac2", "#c24a3a"]), 10)); g.beginPath(); g.arc(x, y, rr(1.2, 2.2), 0, 7); g.fill(); }
  // sunflowers by the corner
  P.sunflower(g, 1058, 556, 70, 95); P.sunflower(g, 1080, 560, 56, 96); P.sunflower(g, 538, 552, 52, 97);
  // chimney smoke
  const puffs = [P.paintPuff(501), P.paintPuff(502), P.paintPuff(503)];
  [[800, 316, 26, 0.55], [810, 298, 36, 0.42], [826, 280, 46, 0.3], [848, 262, 58, 0.18]].forEach(([x, y, s, a], i) => { g.globalAlpha = a; g.drawImage(puffs[i % 3], x - s / 2, y - s / 2, s, s); g.globalAlpha = 1; });
  P.granulate(g, 0.22, 0.8);

  // ---- organic displacement + compose
  const D = P.displace(L, "rough-s");
  const { c, g: out } = U.artCanvas(root);
  out.setTransform(1, 0, 0, 1, 0, 0);
  out.drawImage(paper, 0, 0);
  // faint shadow of paint thickness
  out.globalAlpha = 0.18; out.filter = "blur(1.5px)"; out.globalCompositeOperation = "multiply"; out.drawImage(D, 1.5, 2); out.filter = "none"; out.globalAlpha = 1;
  out.globalCompositeOperation = "source-over"; out.drawImage(D, 0, 0);
  out.globalCompositeOperation = "multiply"; out.globalAlpha = 0.85; out.drawImage(paper, 0, 0); out.globalAlpha = 1; out.globalCompositeOperation = "source-over";
};
