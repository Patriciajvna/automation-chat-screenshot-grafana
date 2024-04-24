const {MessageMedia} = require("whatsapp-web.js");
const express = require("express");
const {body, validationResult} = require("express-validator");
const http = require("http");
const fs = require("fs");
const {getGroupId, findGroupByName} = require("./middleware/get-group-id")
const fileUpload = require("express-fileupload");
const axios = require("axios");
const crypto = require("crypto")
const {newBotClient} = require("./bot");
const {sendEvent, registerSse, unregisterSse, sendLastDataSse} = require("./sse");

const port = process.env.PORT || 8001;

const app = express();
const server = http.createServer(app);

const client = newBotClient(sendEvent);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

app.use(
    fileUpload({
        debug: false,
    })
);

app.get("/whatsapp-status", (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE with client

    let id = registerSse(res);
    sendLastDataSse(res);
    // If client closes connection, stop sending events
    res.on('close', () => {
        unregisterSse(id);
    });
});

// app.post(
//     "/send-media",
//     body("id").custom((value, {req}) => {
//         if (!value && !req.body.name) {
//             throw new Error("Invalid value, you can use `id` or `name`");
//         }
//         return true;
//     }),
//     body("message").notEmpty(),
//     getGroupId(client),
//     async (req, res) => {
//         const number = req.body.number;
//         const caption = req.body.caption;
//         const mediaPath = req.body.mediaPath;

//         const media = MessageMedia.fromFilePath(mediaPath);

//         console.log("number:", number);
//         client
//             .sendMessage(number, media, {
//                 caption: caption,
//             })
//             .then((response) => {
//                 fs.unlink(mediaPath, (err) => {
//                     if (err) console.error(err);
//                     console.log("file:", mediaPath, " ,success deleted");
//                 });
//                 res.status(200).json({
//                     status: true,
//                     response: response,
//                 });
//             })
//             .catch((err) => {
//                 console.error(err);
//                 res.status(500).json({
//                     status: false,
//                     response: err,
//                 });
//             });
//     }
// );

// Send media

app.post("/send-media", async (req, res) => {
    try {
      const number = req.body.number;
      const caption = req.body.caption;
      const mediaPath = req.body.mediaPath;
  
      // Baca file gambar
      fs.readFile(mediaPath, (err, data) => {
        if (err) {
          console.error('Error reading file:', err);
          return res.status(500).json({ status: false, response: err });
        }
  
        // Tentukan tipe mime gambar Anda
        const mimetype = 'image/jpg'; // Ganti dengan tipe mime yang sesuai dengan gambar Anda
  
        // Buat objek MessageMedia dari data gambar
        const media = new MessageMedia(mimetype, data.toString('base64'), "Media");
  
        // Kirim pesan WhatsApp dengan gambar
        client.sendMessage(number, media, { caption: caption })
          .then((response) => {
            res.status(200).json({ status: true, response: response });
          })
          .catch((err) => {
            console.error('Error sending WhatsApp message:', err);
            res.status(500).json({ status: false, response: err });
          });
      });
    } catch (error) {
      console.error('Error handling request:', error);
      res.status(500).json({ status: false, response: error });
    }
  });

app.post(
    "/send-group-media-via-url",
    body("id").custom((value, {req}) => {
        if (!value && !req.body.name) {
            throw new Error("Invalid value, you can use `id` or `name`");
        }
        return true;
    }),
    body("message").notEmpty(),
    getGroupId(client),
    async (req, res) => {
        const number = req.body.chatId;
        const caption = req.body.message;
        const fileUrl = req.body.file;

        let mimetype = "";
        const attachment = await axios.get(fileUrl, {
            responseType: 'arraybuffer'
        }).then(response => {
            mimetype = response.headers['content-type'];
            return response.data.toString('base64');
        }).catch((err) => {
            console.log(err);
        });

        if (mimetype === "" || !mimetype.startsWith("image")) {
            client
                .sendMessage(number, caption)
                .then((response) => {
                    res.status(200).json({
                        status: true,
                        response: response,
                    });
                })
                .catch((err) => {
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                });
        } else {
            const media = new MessageMedia(mimetype, attachment, 'Media');
            client
                .sendMessage(number, media, {
                    caption: caption,
                })
                .then((response) => {
                    fs.unlink(fileUrl, (err) => {
                        if (err) console.error(err);
                        console.log("file:", fileUrl, " ,success deleted");
                    });
                    res.status(200).json({
                        status: true,
                        response: response,
                    });
                })
                .catch((err) => {
                    console.error(err);
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                });
        }
    }
);

// Send message to group
// You can use chatID or group name, yea!
app.post(
    "/send-group-message",
    body("id").custom((value, {req}) => {
        if (!value && !req.body.name) {
            throw new Error("Invalid value, you can use `id` or `name`");
        }
        return true;
    }),
    body("message").notEmpty(),
    getGroupId(client),
    async (req, res) => {
        const errors = validationResult(req).formatWith(({msg}) => {
            return msg;
        });

        if (!errors.isEmpty()) {
            return res.status(422).json({
                status: false,
                message: errors.mapped(),
            });
        }

        let chatId = req.body.chatId;
        const message = req.body.message;

        client
            .sendMessage(chatId, message)
            .then((response) => {
                res.status(200).json({
                    status: true,
                    response: response,
                });
            })
            .catch((err) => {
                res.status(500).json({
                    status: false,
                    response: err,
                });
            });
    }
);

// app.post(
//     "/check-group",
//     body("name").custom((value, {req}) => {
//         return !value;
//     }),
//     async (req, res) => {
//         console.log(req.body);
//         let chats = await client.getChats();
//         console.log(chats.length);
//         let found = chats.find(
//             (chat) => chat.isGroup && chat.name.toLowerCase() === req.body.name.toLowerCase()
//         );
//         if (found) {
//             return res.status(200);
//         } else {
//             return res.status(422);
//         }
//     }
// );

server.listen(port, function () {
    console.log("App running on *: " + port);
});

module.exports = {
    apps : [
        {
            name: "myapp",
            script: "./app.js",
            watch: true,
            env: {
                "NODE_ENV": "development",
                "PORT": "8001",
                "HTTP_PROXY": "proxy3.bri.co.id:1707",
                "HTTPS_PROXY": "proxy3.bri.co.id:1707",
            }
        }
    ]
}
