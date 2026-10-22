const { chromium } = require("playwright");
const path = require("path");
const dir = __dirname;
(async () => {
  const args = process.argv.slice(2);
  const doSheet = args.includes("sheet");
  let cells = args.filter((a) => /^\d$/.test(a)).map(Number);
  if (!cells.length && !doSheet) cells = [1,2,3,4,5,6,7,8,9];
  const browser = await chromium.launch({ args: ["--disable-web-security", "--allow-file-access-from-files"] });
  for (const n of cells) {
    const page = await browser.newPage({ viewport: { width: 800, height: 533 }, deviceScaleFactor: 2 });
    page.on("console", (m) => console.log(`[${n}]`, m.text()));
    const t0 = Date.now();
    await page.goto("file://" + path.join(dir, "cell.html") + "?n=" + n);
    await page.waitForFunction(() => window.DONE === true, null, { timeout: 300000 });
    const err = await page.evaluate(() => window.ERR);
    if (err) { console.log("ERR cell", n, err); await page.close(); continue; }
    await page.screenshot({ path: path.join(dir, `cell-${n}.png`) });
    console.log("cell", n, Date.now() - t0, "ms");
    await page.close();
  }
  if (doSheet) {
    const page = await browser.newPage({ viewport: { width: 2400, height: 1600 }, deviceScaleFactor: 1 });
    await page.goto("file://" + path.join(dir, "sheet.html"));
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
    await page.screenshot({ path: path.join(dir, "style-sheet.jpg"), type: "jpeg", quality: 90 });
    console.log("sheet ok");
  }
  await browser.close();
})();
