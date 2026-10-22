// usage: node rec.js <scene> still t1 t2 ...   |   node rec.js <scene> video [fps]
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const path = require("path"), fs = require("fs"), { spawn } = require("child_process");
const dir = __dirname;
(async () => {
  const [name, mode, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ["--allow-file-access-from-files", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on("console", (m) => console.log("[page]", m.text()));
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  await page.goto("file://" + path.join(dir, "scene.html") + "?s=" + name);
  await page.waitForFunction(() => window.READY || window.ERR, null, { timeout: 600000 });
  const err = await page.evaluate(() => window.ERR); if (err) { console.log("ERR", err); process.exit(1); }
  console.log("build ms", await page.evaluate(() => window.BUILD_MS | 0));
  const dur = await page.evaluate(() => window.SCENE.dur);
  if (mode === "still") {
    for (const ts of rest) {
      const t = parseFloat(ts), t0 = Date.now();
      await page.evaluate((t) => window.SCENE.frame(t), t);
      await page.screenshot({ path: path.join(dir, "shots", `${name}-${ts}.png`) });
      console.log("t", ts, Date.now() - t0, "ms");
    }
  } else {
    const fps = parseInt(rest[0] || "30"), N = Math.round(dur * fps);
    const out = path.join(dir, "frames", `${name}-v.mp4`);
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "png", "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(fps), out], { stdio: ["pipe", "inherit", "inherit"] });
    const t0 = Date.now();
    for (let i = 0; i < N; i++) {
      await page.evaluate((t) => window.SCENE.frame(t), i / fps);
      const buf = await page.screenshot({ type: "png" });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
      if (i % 30 === 0) console.log("frame", i, "/", N, ((Date.now() - t0) / (i + 1)) | 0, "ms/f");
    }
    ff.stdin.end(); await new Promise((r) => ff.on("close", r));
    console.log("video", out, Date.now() - t0, "ms");
  }
  await browser.close();
})();
