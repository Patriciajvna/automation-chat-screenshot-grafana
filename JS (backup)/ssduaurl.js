const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');

// Fungsi mengirim pesan gambar ke WhatsApp
async function sendMediaToWhatsApp(mediaPath, number, caption) {
    try {
        for (const mediaPaths of mediaPath) {
            const imageData = fs.readFileSync(mediaPaths);
            const response = await axios.post('http://localhost:8001/send-media', {
                number: number,
                caption: caption,
                mediaPath: mediaPaths
            });

            console.log('Pesan WhatsApp terkirim! Response:', response.data);

            // Tulis log pesan terkirim ke dalam file
            const logMessage = `[${new Date().toLocaleString()}] Pesan WhatsApp terkirim! "${caption}"\n`;
            fs.appendFileSync('message_log.txt', logMessage);
        }
    } catch (error) {
        console.error('Gagal mengirim pesan WhatsApp:', error);
    }
}
  
// Fungsi login untuk URL pertama
async function loginFirstUrl(pageFirstUrl) {
    await pageFirstUrl.waitForSelector(".css-1n6y0bv-input-input"); // Wait for an element with the class (username) to appear on the page.
    await pageFirstUrl.type(".css-1n6y0bv-input-input", "admin", { delay: 100 }); // Type a username into the "username" input field with a 100ms delay between key presses.
    
    await pageFirstUrl.waitForSelector("#current-password"); // Wait for an element with the id "current-password" to appear on the page.
    await pageFirstUrl.type("#current-password", "admin", { delay: 100 }); // Type a password into the "password" input field with a 100ms delay between key presses.

    await pageFirstUrl.click(".css-1c5twjv-button"); // Click on a 'Login' button
    
    // Click on a 'Skip' button
    await pageFirstUrl.waitForSelector(".css-bhnz0e-button");
    await pageFirstUrl.click(".css-bhnz0e-button");
    
    // Wait for the page after login to fully load
    await pageFirstUrl.waitForSelector(".flowchart-panel__chart", { timeout: 6000000 });
}

// Fungsi login untuk URL kedua
async function loginSecondUrl(pageSecondUrl) {
    await pageSecondUrl.waitForSelector(".visx-group", { timeout: 6000000 });
}

// Fungsi screenshoot untuk URL pertama
async function takeScreenshotFirstUrl(pageFirstUrl, firstLoginUrl, outputPath) {
    await pageFirstUrl.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await pageFirstUrl.goto(firstLoginUrl);
    await new Promise(resolve => setTimeout(resolve, 30000));
    await pageFirstUrl.screenshot({ path: outputPath });
}

// Fungsi screenshoot untuk URL kedua
async function takeScreenshotSecondUrl(pageSecondUrl, secondLoginUrl, outputPath) {
    await pageSecondUrl.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
    await pageSecondUrl.goto(secondLoginUrl);
    await new Promise(resolve => setTimeout(resolve, 30000));
    await pageSecondUrl.screenshot({ path: outputPath });
}

// Fungsi utama
async function main() {
    try {
        // Launch a headless browser instance with specific settings
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--remote-debugging-port=9222', '--remote-debugging-address=localhost', '--no-sandbox'
            ]
        });

        // Create a new page in the browser for URL pertama
        const pageFirstUrl = await browser.newPage();
        const firstLoginUrl = 'http://203.194.113.64:3000/d/d3800699-9ce9-4c62-b8c7-56dcc8029a36/new-dashboard-brimen?orgId=1';
        await pageFirstUrl.goto(firstLoginUrl, { waitUntil: 'networkidle0' });
        await loginFirstUrl(pageFirstUrl);
        const mediaPathFirstUrl = 'D:\\JS\\image\\screenshot.jpg';
        await takeScreenshotFirstUrl(pageFirstUrl, firstLoginUrl, mediaPathFirstUrl);

        // Create a new page in the browser for URL kedua
        const pageSecondUrl = await browser.newPage();
        const secondLoginUrl = 'http://203.194.113.64:3000/d/acb289a3-9bb7-494b-ab63-72466be02c71/new-dashboard-mysql?orgId=1';
        await pageSecondUrl.goto(secondLoginUrl, { waitUntil: 'networkidle0' });
        await loginSecondUrl(pageSecondUrl);
        const mediaPathSecondUrl = 'D:\\JS\\image\\screenshot2.jpg';
        await takeScreenshotSecondUrl(pageSecondUrl, secondLoginUrl, mediaPathSecondUrl);

        const currentTime = new Date().toLocaleString();
        const caption = `Screenshots dari dua website pada ${currentTime}`;

        // Kirim gambar ke WhatsApp secara bersamaan
        const mediaPath = ['D:\\JS\\image\\screenshot.jpg', 'D:\\JS\\image\\screenshot2.jpg'];
        await sendMediaToWhatsApp(mediaPath, '6289674235468@c.us', caption);

        console.log('Proses selesai!');
        process.exit();

    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        process.exit(1);
    }
}

// Panggil fungsi utama
main();
