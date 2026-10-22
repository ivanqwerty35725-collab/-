const { chromium } = require("playwright");
const path = require("path"), fs = require("fs"), { spawn } = require("child_process");
const dir = __dirname, BASE = "http://127.0.0.1:8765/";
const args = process.argv.slice(2);
const http = require("http");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".ttf": "font/ttf", ".json": "application/json", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split("?")[0]); const f = path.join(dir, u === "/" ? "index.html" : u);
  if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(8765, "127.0.0.1", r));
  const browser = await chromium.launch({ args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
  async function open(n, mode, vp, dsf, v="") {
    const page = await browser.newPage({ viewport: vp, deviceScaleFactor: dsf });
    page.on("console", (m) => { if (m.type() === "error" || m.type()==="warning") console.log(`[${n}] ${m.type()}:`, m.text()); });
    page.on("pageerror", (e) => console.log(`[${n}] pageerror`, e.message));
    await page.goto(`${BASE}frame.html?n=${n}&mode=${mode}&v=${v}`);
    await page.waitForFunction(() => window.READY === true, null, { timeout: 300000 });
    const err = await page.evaluate(() => window.ERR);
    if (err) throw new Error("cell " + n + ": " + err);
    return page;
  }
  const cmd = args[0];
  if (cmd === "cells") {
    for (const a of args.slice(1)) {
      const [n, v=""] = a.split(":");
      const t0 = Date.now();
      const page = await open(n, "cell", { width: 800, height: 533 }, 2, v);
      const T = await page.evaluate(() => window.SCENE.still);
      await page.evaluate((T) => window.seek(T), T);
      await page.waitForTimeout(150);
      await page.screenshot({ path: path.join(dir, `cell-${n}${v}.png`) });
      console.log("cell", n+v, Date.now() - t0, "ms");
      await page.close();
    }
  } else if (cmd === "sheet") {
    const page = await browser.newPage({ viewport: { width: 2400, height: 1600 } });
    await page.goto(BASE + "sheet.html?" + Date.now());
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    await page.screenshot({ path: path.join(dir, "digital-sheet.jpg"), type: "jpeg", quality: 92 });
    console.log("sheet ok");
  } else if (cmd === "frames") { // frames n t1 t2 ... -> snapshot pngs in snaps/
    const [_, n, ...ts] = args; fs.mkdirSync(path.join(dir,"snaps"),{recursive:true});
    const page = await open(n, "motion", { width: 1280, height: 720 }, 1);
    for (const t of ts) { await page.evaluate((t) => window.seek(+t), t); await page.screenshot({ path: path.join(dir, "snaps", `m${n}-${t}.png`) }); }
  } else if (cmd === "bench") { // bench n1 n2 ... : 30 frames 1280x720 PNG each, ms/frame
    for (const n of args.slice(1)) {
      const page = await open(n, "motion", { width: 1280, height: 720 }, 1);
      const t0 = Date.now();
      for (let i = 0; i < 30; i++) { await page.evaluate((t) => window.seek(t), 0.5 + i / 10); await page.screenshot({ type: "png" }); }
      console.log("bench", n, ((Date.now() - t0) / 30).toFixed(0), "ms/frame"); await page.close();
    }
  } else if (cmd === "motion") { // motion n dur out
    const [_, n, dur, out] = args; const fps = 30, N = Math.round(+dur * fps);
    const page = await open(n, "motion", { width: 1280, height: 720 }, 1);
    const ff = spawn("ffmpeg", ["-y","-loglevel","error","-f","image2pipe","-framerate",String(fps),"-i","-","-c:v","libx264","-preset","slow","-crf","17","-pix_fmt","yuv420p","-movflags","+faststart", path.join(dir, out)], { stdio: ["pipe","inherit","inherit"] });
    const t0 = Date.now();
    for (let i = 0; i < N; i++) {
      await page.evaluate((t) => window.seek(t), i / fps);
      const buf = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once("drain", r));
    }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
    console.log("motion", n, N, "frames", ((Date.now()-t0)/N).toFixed(0), "ms/frame");
  }
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
