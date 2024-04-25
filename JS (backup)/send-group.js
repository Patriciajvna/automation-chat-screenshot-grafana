const puppeteer = require('puppeteer');
const mssql = require('mssql');
const fs = require('fs');
const axios = require('axios');

async function login(page, loginData, isFirstLoop) {
    if (isFirstLoop) {
        await page.goto(loginData.loginUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector("input[name=user]"); 
        await page.type("input[name=user]", "rco_eng", { delay: 100 }); // Selector Username
        await page.type("input[name=password]", "P@ssw0rd", { delay: 100 }); // Selector Password
        await page.click(".css-6ntnx5-button"); // Selector Login Button
        await page.waitForSelector(loginData.dashboardSelector, { delay: 5000, timeout: 6000000 });
    } else {
        await page.goto(loginData.loginUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector(loginData.dashboardSelector, { delay: 5000, timeout: 6000000 });
    }
    await page.reload({ delay: 5000 });
}

// Fungsi mengambil tangkapan layar
async function takeScreenshot(page, outputPath, viewportHeight) {
    await page.setViewport({ width: 1920, height: viewportHeight });
    await new Promise(resolve => setTimeout(resolve, 25000)); 
    await page.waitForFunction('document.readyState === "complete"');
    await page.screenshot({ path: outputPath , fullPage: true, quality: 100 });
}

// Fungsi kirim media ke WhatsApp
async function sendMediaToWhatsApp(mediaPath, groupName, caption, idDashboard, namaDashboard, currentTime) {
    try {
        for (const media of mediaPath) {
            const response = await axios.post('http://localhost:8001/send-group-media', {
                name: groupName,
                caption: caption,
                mediaPath: media
            });
            console.log('Pesan WhatsApp terkirim!');

            const logData = {
                idDashboard: idDashboard,
                namaDashboard: namaDashboard,
                status: (response.status === 200) ? 'Pesan berhasil terkirim' : 'Gagal mengirim pesan',
                timestamp: currentTime
            };
            const logQuery = `INSERT INTO WhatsAppMessageLog (idDashboard, namaDashboard, status, timestamp) VALUES (${logData.idDashboard}, '${logData.namaDashboard}', '${logData.status}', '${logData.timestamp}')`;
            await mssql.query(logQuery);
        }   
    } catch (error) {
        console.error('Gagal mengirim pesan WhatsApp:', error);
    }
}

// Fungsi untuk memeriksa apakah waktu saat ini sudah melewati pukul 20.00
function isAfter() {
    const currentHour = new Date().getHours(); // Ambil jam dari waktu saat ini
    return currentHour >= 20; // Mengembalikan true jika waktu saat ini adalah setelah pukul 20.00
}

// Fungsi utama
async function main() {
    let browser;
    try {
        // Buka koneksi ke SQL Server
        const config = {
            user: 'patriciajovena',
            password: 'patricia',
            server: 'localhost',
            port: 1433,
            database: 'Patricia',
            options: {
              encrypt: false,
              trustServerCertificate: true,
            }
        };
        await mssql.connect(config);

        // Ambil data login dari database
        const query = 'SELECT id, loginUrl, dashboardSelector, namaDashboard, heightViewPort, isActive FROM LoginTable WHERE isActive = 1';
        const result = await mssql.query(query);

        // Array untuk menyimpan path tangkapan layar
        const screenshotPaths = [];

        // Counter untuk nama file
        let screenshotCounter = 1;

        browser = await puppeteer.launch({
            headless: true, 
            args: ['--remote-debugging-port=9222', '--remote-debugging-address=localhost', '--no-sandbox']
        });

        // Lakukan iterasi untuk setiap baris hasil query
        for (const row of result.recordset) {
            const page = await browser.newPage();
            try {
                // Lakukan login
                await login(page, row, screenshotCounter === 1);

                // Lakkukan screenshot
                const viewportHeight = row.heightViewPort;
                const screenshotPath = `D:\\JS\\image\\screenshot${screenshotCounter}.jpg`;
                await takeScreenshot(page, screenshotPath, viewportHeight);
                screenshotPaths.push(screenshotPath);

                // Lakukan pengiriman pesan ke whatsapp
                const idDashboard = row.id;
                const namaDashboard = row.namaDashboard;
                const currentTime = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ');
                const caption = `Screenshots ${namaDashboard} pada ${currentTime}`;
                const groupName = 'Test';
                await sendMediaToWhatsApp([screenshotPath], groupName, caption, idDashboard, namaDashboard, currentTime);
 
                // Increment counter
                screenshotCounter++;

            } catch (error) {
                console.error('Error:', error);
            } finally {
                await page.close();
            }
        }

        console.log('Proses selesai!');
        process.exit();
    } catch (error) {
        console.error('Terjadi kesalahan:', error);
        process.exit(1);
    }
}

// Panggil fungsi utama hanya jika waktu saat ini bukan melebihi pukul 20.00
if (!isAfter()) {
    main();
} else {
    console.log("Program tidak dieksekusi karena waktu saat ini sudah melebihi pukul 20.00");
}