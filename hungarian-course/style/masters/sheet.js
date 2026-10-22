const { chromium } = require("/opt/node-tools/node_modules/playwright");
const path = require("path"), fs = require("fs");
(async () => {
  const [a, b, c] = process.argv.slice(2);
  let html = fs.readFileSync(path.join(__dirname, "sheet.html"), "utf8").replace("SHEET1", a).replace("SHEET2", b).replace("SHEET3", c);
  fs.writeFileSync(path.join(__dirname, "_sheet.html"), html);
  const br = await chromium.launch({ args: ["--allow-file-access-from-files"] });
  const p = await br.newPage({ viewport: { width: 2400, height: 540 } });
  await p.goto("file://" + path.join(__dirname, "_sheet.html"));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  await p.screenshot({ path: path.join(__dirname, "masters-sheet.jpg"), type: "jpeg", quality: 90 });
  await br.close(); console.log("sheet ok");
})();
