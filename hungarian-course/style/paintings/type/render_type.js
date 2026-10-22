// Renders typography elements to transparent full-frame PNGs (1280x720).
// usage: node render_type.js spec.json outdir
// spec: {elements:[{name, html, css}]}; for each element writes name.png and name_plaque.png (plaque only, text hidden)
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const fs = require("fs"), path = require("path");
const specPath = path.resolve(process.argv[2]), outDir = path.resolve(process.argv[3]);
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
const dir = __dirname;
const BASE_CSS = `
html,body{margin:0;padding:0;background:transparent;width:1280px;height:720px;overflow:hidden}
body{font-family:'Source Serif 4',serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;font-kerning:normal}
.el{position:absolute}
.plaque{background:rgba(247,242,231,0.86);border-radius:12px;padding:20px 30px 22px;box-shadow:0 8px 30px rgba(10,8,5,0.28)}
.hu{font-weight:700;font-style:normal;color:#1E1A15;font-size:62px;line-height:1.05;letter-spacing:-0.005em;white-space:nowrap}
.ru{font-style:italic;font-weight:400;color:#4B4338;font-size:29px;line-height:1.2;margin-top:8px;white-space:nowrap}
.attr{font-style:italic;font-weight:400;font-size:19px;color:rgba(250,246,238,0.78);text-shadow:0 1px 2px rgba(0,0,0,0.85),0 0 6px rgba(0,0,0,0.7),0 0 14px rgba(0,0,0,0.5);white-space:nowrap}
.hidetext .hu,.hidetext .ru,.hidetext .attr{visibility:hidden}
.noplaque .plaque{background:transparent;box-shadow:none}
`;
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  fs.mkdirSync(outDir, { recursive: true });
  const fontcss = fs.readFileSync(path.join(dir, "fontface.css"), "utf8");
  for (const el of spec.elements) {
    for (const mode of ["", "plaque"]) {
      const html = `<!doctype html><html><head><meta charset="utf-8"><base href="file://${dir}/"><style>${fontcss}${BASE_CSS}${spec.css || ""}</style></head>
<body class="${mode === "plaque" ? "hidetext" : ""}"><div class="el" style="${el.css}">${el.html}</div></body></html>`;
      const f = path.join(outDir, `_tmp.html`);
      fs.writeFileSync(f, html);
      await page.goto("file://" + f);
      await page.evaluate(async () => { await document.fonts.ready; });
      const ok = await page.evaluate(() => [...document.fonts].filter(f => f.status === "loaded").map(f => f.family + " " + f.style + " " + f.weight));
      if (mode === "") console.log(el.name, "fonts:", ok.length, JSON.stringify(await page.evaluate(() => { const r = document.querySelector('.el').getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); })));
      await page.screenshot({ path: path.join(outDir, `${el.name}${mode ? "_" + mode : ""}.png`), omitBackground: true });
    }
  }
  await browser.close();
})();
