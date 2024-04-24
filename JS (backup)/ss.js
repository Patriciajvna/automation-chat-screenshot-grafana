const puppeteer = require('puppeteer');

async function captureGrafanaDashboardScreenshot(page, path) {
    // Set a fixed viewport size
    const viewportWidth = 1920;
    const viewportHeight = 1080;

    await page.setViewport({ width: viewportWidth, height: viewportHeight });

    // Wait for a short delay for Grafana to load content
    await page.waitForTimeout(3000); // Adjust delay as needed

    // Scroll the page to capture the entire content
    const bodyHandle = await page.$('body');
    const { height: bodyHeight } = await bodyHandle.boundingBox();
    await bodyHandle.dispose();

    await page.evaluate((bodyHeight, viewportHeight) => {
        window.scrollTo(0, bodyHeight);
    }, bodyHeight, viewportHeight);

    // Wait for a short delay for the page to settle after scrolling
    await page.waitForTimeout(1000); // Adjust delay as needed

    // Capture screenshot of the entire page
    const screenshot = await page.screenshot({ path: path, fullPage: true });
    return screenshot;
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Adjust the URL to your Grafana dashboard
    await page.goto('https://your-grafana-dashboard-url');

    // Capture the Grafana dashboard screenshot
    await captureGrafanaDashboardScreenshot(page, 'grafana_dashboard.png');

    await browser.close();
})();