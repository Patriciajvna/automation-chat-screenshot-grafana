const {Client, LocalAuth, NoAuth, LocalWebCacheOptions} = require("whatsapp-web.js");
const qrcodeTerm = require("qrcode-terminal");

const newBotClient = (sendEvent) => {
    const client = new Client({
        restartOnAuthFail: true,
        puppeteer: {
            headless: true,
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--single-process", // <- this one doesn't work in Windows
                "--disable-gpu",
                // "--proxy-server=proxy3.bri.co.id:1707",
            ],
        },
        authStrategy: new NoAuth(),
        webVersion: "2.2405.4"
    });

    client.on("qr", (qr) => {
        qrcodeTerm.generate(qr, {small: true})
        sendEvent("qr", qr);
    });

    client.on("ready", () => {
        console.log("Whatsapp is ready!");
        sendEvent("ready", "");
    });

    client.on("authenticated", () => {
        console.log("AUTHENTICATED");
        sendEvent("authenticated", "");
    });

    client.on("auth_failure", () => console.log("Auth failure, restarting..."));

    client.on("disconnected", () => {
        console.log("client disconnected");
        client.initialize();
    });

    client.on("message", (msg) => {
        if (msg.body === "!ping") {
            msg.reply("pong");
        }
    });

    client.initialize();
    return client;
};

module.exports  = {newBotClient};
