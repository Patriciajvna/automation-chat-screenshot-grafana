const puppeteer = require('puppeteer');
const fs = require('fs');
const axios = require('axios');

// Fungsi screenshoot
async function takeScreenshot(url, outputPath) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(url);
  await new Promise(resolve => setTimeout(resolve, 10000));
  await page.screenshot({ path: outputPath });
  await browser.close();
}

// Fungsi mengirim pesan gambar ke WhatsApp
async function sendMediaToWhatsApp(mediaPath, number, caption) {
  try {
    const imageData = fs.readFileSync(mediaPath);

    // Mengirim gambar ke WhatsApp menggunakan Axios
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

async function main() {
  try {
    // Ambil screenshot dari Google (example)
    const mediaPath = 'D:\\JS\\image\\screenshot.jpg'; // Path tempat menyimpan hasil screenshoot (sementara)
    // const url = 'http://admin:admin@203.194.113.64:3000/d/f354fb20-f8d2-407b-9150-80d3936a8849/new-dashboard-4?orgId=1'; // URL yang akan di capture
    const url = 'http://admin:admin@203.194.113.64:3000/d/d3800699-9ce9-4c62-b8c7-56dcc8029a36/new-dashboard-brimen?orgId=1&from=1713235496264&to=1713257096264'; // URL yang akan di capture

    await takeScreenshot(url, mediaPath);
    
    const currentTime = new Date().toLocaleString();
    const caption = `Screenshot website pada ${currentTime}`;

    // Kirim gambar ke WhatsApp
    await sendMediaToWhatsApp(mediaPath, '6289674235468@c.us', caption);

    console.log('Proses selesai!');

  } catch (error) {
    console.error('Terjadi kesalahan:', error);
  }
}

// Panggil fungsi utama
main();