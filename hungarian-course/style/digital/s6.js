// 6. Glitch / chromatic aberration: canvas pipeline (clean plate -> RGB split -> slice shift -> blocks -> scanlines/noise -> HUD)
(function () {
  let render;
  window.SCENE = {
    still: 2.04,
    build(st, mode) {
      const W = 1280, H = 764, PR = mode === "cell" ? 1.25 : 1;
      const cw = Math.round(W * PR), ch = Math.round(H * PR);
      const out = U.el("canvas", { width: cw, height: ch, style: { left: 0, top: 0, width: W + "px", height: H + "px" } }, st);
      const mk = () => { const c = document.createElement("canvas"); c.width = cw; c.height = ch; return [c, c.getContext("2d")]; };
      const [clean, cx] = mk(), [tmp, tx] = mk(), [acc, ax] = mk();
      const octx0 = null;
      const GREEN = "#2fe58a";
      // ---- clean plate
      const plate = (tt) => {
        cx.setTransform(PR, 0, 0, PR, 0, 0);
        cx.fillStyle = "#07080c"; cx.fillRect(0, 0, W, H);
        // faint grid
        cx.strokeStyle = "rgba(90,120,255,.07)"; cx.lineWidth = 1;
        for (let x = 0; x <= W; x += 40) { cx.beginPath(); cx.moveTo(x + 0.5, 0); cx.lineTo(x + 0.5, H); cx.stroke(); }
        for (let y = 0; y <= H; y += 40) { cx.beginPath(); cx.moveTo(0, y + 0.5); cx.lineTo(W, y + 0.5); cx.stroke(); }
        // big wireframe house behind the text
        const hx = 640, base = 700, hw = 200, wall = 210, roof = 140;
        const draw = (ctx) => {
          ctx.beginPath();
          ctx.moveTo(hx - hw - 40, base - wall + 8); ctx.lineTo(hx, base - wall - roof); ctx.lineTo(hx + hw + 40, base - wall + 8);
          ctx.moveTo(hx - hw, base - wall - 10); ctx.lineTo(hx - hw, base); ctx.lineTo(hx + hw, base); ctx.lineTo(hx + hw, base - wall - 10);
          ctx.stroke();
        };
        cx.lineJoin = "miter"; cx.lineCap = "square";
        cx.strokeStyle = "rgba(140,175,255,.95)"; cx.lineWidth = 9; draw(cx);
        // door: bright doorway (the destination)
        const dw = 78, dh = 120;
        const g = cx.createLinearGradient(0, base - dh, 0, base); g.addColorStop(0, "#d8fff0"); g.addColorStop(1, GREEN);
        cx.fillStyle = g; cx.fillRect(hx - dw / 2, base - dh, dw, dh);
        cx.fillStyle = "rgba(47,229,138,.16)"; cx.fillRect(hx - dw / 2 - 30, base - dh - 30, dw + 60, dh + 30);
        // text
        cx.textBaseline = "alphabetic"; cx.textAlign = "left";
        cx.font = "800 150px Unbounded";
        const s1 = "a ház", s2 = "ba";
        const w1 = cx.measureText(s1).width, w2 = cx.measureText(s2).width, gap = 8;
        const x0 = hx - (w1 + gap + w2) / 2, y0 = 250;
        cx.fillStyle = "#f4f6ff"; cx.fillText(s1, x0, y0);
        cx.fillStyle = GREEN; cx.fillText(s2, x0 + w1 + gap, y0);
        cx.font = "italic 400 64px 'Source Serif 4'"; cx.fillStyle = "#e9ecff"; cx.textAlign = "center";
        cx.fillText("в дом", hx, 336);
        // arrow chevrons into the door
        cx.strokeStyle = GREEN; cx.lineWidth = 9; cx.lineCap = "butt"; cx.lineJoin = "miter";
        for (let i = 0; i < 3; i++) { const yy = 500 + i * 22 + ((tt * 44) % 22); cx.globalAlpha = 0.35 + i * 0.3; cx.beginPath(); cx.moveTo(hx - 28, yy); cx.lineTo(hx, yy + 18); cx.lineTo(hx + 28, yy); cx.stroke(); }
        cx.globalAlpha = 1;
        // HUD
        cx.font = "600 22px 'JetBrains Mono'"; cx.textAlign = "left"; cx.fillStyle = "rgba(235,240,255,.85)";
        cx.fillText("PLAY ▶", 48, 62);
        cx.fillStyle = "#ff3355"; cx.beginPath(); cx.arc(W - 160, 54, 9, 0, 7); cx.fill();
        cx.fillStyle = "rgba(235,240,255,.85)"; cx.fillText("REC", W - 140, 62);
        const fr = Math.floor(tt * 30), tc = `00:00:${String(3 + Math.floor(tt)).padStart(2, "0")}:${String(fr % 30).padStart(2, "0")}`;
        cx.fillText(tc, 48, H - 44);
        cx.textAlign = "right"; cx.fillText("CH 03  SP", W - 48, H - 44);
        cx.setTransform(1, 0, 0, 1, 0, 0);
      };
      const chan = (src, col) => { tx.globalCompositeOperation = "copy"; tx.drawImage(src, 0, 0); tx.globalCompositeOperation = "multiply"; tx.fillStyle = col; tx.fillRect(0, 0, cw, ch); tx.globalCompositeOperation = "source-over"; return tmp; };
      const octx = out.getContext("2d", { willReadFrequently: true });
      render = (t) => {
        plate(t);
        const f = Math.floor(t * 30), rnd = U.rng(1000 + f * 7);
        // glitch intensity envelope: bursts
        const burst = (a, b) => (t >= a && t <= b ? 1 : 0);
        const I = Math.max(0.16, burst(0.25, 0.55), burst(1.3, 1.5) * 0.9, burst(2.0, 2.1) * 0.42, burst(2.55, 2.75), burst(3.2, 3.3) * 0.6);
        const dx = (3 + I * 10) * PR;
        // RGB split
        ax.globalCompositeOperation = "copy"; ax.fillStyle = "#000"; ax.fillRect(0, 0, cw, ch);
        ax.globalCompositeOperation = "lighter";
        ax.drawImage(chan(clean, "#ff0000"), -dx, 0);
        ax.drawImage(chan(clean, "#00ff00"), 0, 0);
        ax.drawImage(chan(clean, "#0000ff"), dx, dx * 0.15);
        ax.globalCompositeOperation = "source-over";
        // slice displacement
        octx.globalCompositeOperation = "copy"; octx.drawImage(acc, 0, 0); octx.globalCompositeOperation = "source-over";
        const nS = Math.floor(2 + I * 9);
        for (let i = 0; i < nS; i++) {
          const y = Math.floor(rnd() * ch), h = Math.floor((4 + rnd() * (I > 0.5 ? 46 : 14)) * PR), off = (rnd() - 0.5) * 2 * (10 + I * 90) * PR;
          octx.drawImage(acc, 0, y, cw, h, off, y, cw, h);
          if (rnd() < 0.3) { octx.fillStyle = rnd() < 0.5 ? "rgba(255,40,90,.18)" : "rgba(40,220,255,.16)"; octx.fillRect(0, y, cw, h); }
        }
        // block corruption
        const nB = Math.floor(I * 10);
        for (let i = 0; i < nB; i++) {
          const bw = (30 + rnd() * 160) * PR, bh = (8 + rnd() * 40) * PR, sx = rnd() * (cw - bw), sy = rnd() * (ch - bh);
          octx.drawImage(acc, sx, sy, bw, bh, sx + (rnd() - 0.5) * 120 * PR, sy + (rnd() - 0.5) * 30 * PR, bw, bh);
        }
        // pixel-sort-like vertical smear from text area
        if (I > 0.5) { const sx = (300 + rnd() * 680) * PR, sw = (20 + rnd() * 60) * PR; octx.globalAlpha = 0.55; octx.drawImage(acc, sx, 300 * PR, sw, 4 * PR, sx, 300 * PR, sw, 160 * PR); octx.globalAlpha = 1; }
        // VHS tracking band
        const by = ((t * 0.32) % 1) * ch * 1.3 - ch * 0.15;
        const bg = octx.createLinearGradient(0, by, 0, by + 70 * PR); bg.addColorStop(0, "rgba(255,255,255,0)"); bg.addColorStop(0.5, "rgba(255,255,255,.07)"); bg.addColorStop(1, "rgba(255,255,255,0)");
        octx.fillStyle = bg; octx.fillRect(0, by, cw, 70 * PR);
        // noise
        const nd = octx.getImageData(0, 0, cw, ch), d = nd.data, nr = U.rng(77 + f);
        for (let i = 0; i < d.length; i += 4) { const n = (nr() - 0.5) * 34; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
        // scanlines
        for (let y = 0; y < ch; y++) if (y % Math.round(3 * PR) === 0) { const row = y * cw * 4; for (let x = 0; x < cw * 4; x += 4) { d[row + x] *= 0.62; d[row + x + 1] *= 0.62; d[row + x + 2] *= 0.62; } }
        octx.putImageData(nd, 0, 0);
        // bloom + vignette
        octx.globalCompositeOperation = "lighter"; octx.globalAlpha = 0.35; octx.filter = `blur(${10 * PR}px)`; octx.drawImage(out, 0, 0); octx.filter = "none"; octx.globalAlpha = 1; octx.globalCompositeOperation = "source-over";
        const vg = octx.createRadialGradient(cw / 2, ch / 2, ch * 0.35, cw / 2, ch / 2, cw * 0.75); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.75)");
        octx.fillStyle = vg; octx.fillRect(0, 0, cw, ch);
      };
      render(0);
    },
    seek(t) { render(t); },
  };
})();
