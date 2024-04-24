const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    try {
        const page = await browser.newPage();

        await page.setViewport({ width: 1280, height: 1024 });
        await page.goto("https://apple.com/", {
            waitUntil: ["load", "domcontentloaded"],
        });

        await page.screenshot({
            type: "jpeg",
            path: "screenshot.jpeg",
            fullPage: true,
        });
    } catch (e) {
        console.log(e);
    } finally {
        await browser.close();
    }
})();