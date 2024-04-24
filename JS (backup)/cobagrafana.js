const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');

// Fungsi login
async function login(page) {
    await page.waitForSelector(".css-1n6y0bv-input-input"); // Wait for an element with the class (username) to appear on the page.
    await page.type(".css-1n6y0bv-input-input", "admin", { delay: 100 }); // Type a username into the "username" input field with a 100ms delay between key presses.
    
    await page.waitForSelector("#current-password"); // Wait for an element with the id "current-password" to appear on the page.
    await page.type("#current-password", "admin", { delay: 100 }); // Type a password into the "password" input field with a 100ms delay between key presses.

    await page.click(".css-1c5twjv-button"); // Click on a 'Login' button
    
    // Click on a 'Skip' button
    await page.waitForSelector(".css-bhnz0e-button");
    await page.click(".css-bhnz0e-button");
    
    // Wait for the page after login to fully load
    await page.waitForSelector(".flowchart-panel__chart", { timeout: 600000 });
}

// Fungsi screenshoot
async function takeScreenshot(page, loginUrl, outputPath) {
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(loginUrl);
  await new Promise(resolve => setTimeout(resolve, 30000));
  await page.screenshot({ path: outputPath });
}

// Fungsi mengirim pesan gambar ke WhatsApp
async function sendMediaToWhatsApp(mediaPath, number, caption) {
  try {
    const imageData = fs.readFileSync(mediaPath);
    const response = await axios.post('http://localhost:8001/send-media', {
      number: number,
      caption: caption,
      mediaPath: 'D:\\JS\\image\\screenshot.jpg' 
    });

    console.log('Pesan WhatsApp terkirim! Response:', response.data);

    // Tulis log pesan terkirim ke dalam file
    const logMessage = `[${new Date().toLocaleString()}] Pesan WhatsApp terkirim! "${caption}"\n`;
    fs.appendFileSync('message_log.txt', logMessage);

  } catch (error) {
    console.error('Gagal mengirim pesan WhatsApp:', error);
  }
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

    // Create a new page in the browser.
    const page = await browser.newPage();
    const loginUrl = 'http://203.194.113.64:3000/d/d3800699-9ce9-4c62-b8c7-56dcc8029a36/new-dashboard-brimen?orgId=1&from=1713235496264&to=1713257096264'; // URL yang akan di capture

    // Navigate to the website you want to log into.
    await page.goto(loginUrl, { waitUntil: 'networkidle0' });

    // Call the login function to perform login
    await login(page);

    // Path tempat menyimpan hasil screenshoot (sementara)
    const mediaPath = 'D:\\JS\\image\\screenshot.jpg'; 

    // Take screenshot after successful login
    await takeScreenshot(page, loginUrl, mediaPath);
    
    const currentTime = new Date().toLocaleString();
    const caption = `Screenshot website pada ${currentTime}`;

    // Kirim gambar ke WhatsApp
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