const axios = require('axios'); // Untuk mengirim pesan ke localhost
const sql = require('mssql');
const { body, validationResult } = require('express-validator');
const fs = require('fs');

// Konfigurasi koneksi SQL Server
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

// Fungsi untuk menulis ke file log
const writeToLogFile = (message, timestamp) => {
  const logMessage = `[${timestamp}] ${message}\n`;

  fs.appendFile('message_log.txt', logMessage, (err) => {
    if (err) {
      console.error('Gagal menulis ke file log:', err);
    }
  });
};

// Kueri mengambil data dari database
const getDataFromDatabase = async () => {
    try {
      let pool = await sql.connect(config);
      let result = await pool.request().query('SELECT userID, FirstName FROM TabelNama');
      return result.recordset;
    } catch (err) {
      throw new Error(err);
    }
  };
  
// Mengirim pesan menggunakan Axios
const sendMessage = async () => {
  try {
    const data = await getDataFromDatabase(); // Mengambil data dari database
    if (data.length > 0) {
      // Variabel untuk menyimpan pesan yang akan dikirim
      let chatMessage = '';

      for (let i = 0; i < data.length; i++) {
        const userID = data[i].userID; // Mendapatkan userID dari hasil kueri database
        const firstName = data[i].FirstName; // Mendapatkan FirstName dari hasil kueri database
          
        // Menambahkan pesan ke dalam chatMessage
        chatMessage += `Hello ${firstName}, your userID is ${userID}\n`;
      }
          
      // Untuk mengirim pesan ke localhost
      axios.post('http://localhost:8001/send-message', {
        number: '+6289674235468', // Nomor WhatsApp penerima 
        message: chatMessage // Pesan yang akan dikirim diambil dari chatMessage
      })
      
      // history / log
      .then((response) => {
        const timestamp = new Date().toISOString();
        const logMessage = `Pesan berhasil terkirim ke ${'+6289674235468'}`;
        console.log('Response:', response.data);
        writeToLogFile(logMessage, timestamp);
      })
      
      .catch((error) => {
        console.error('Error:', error.response.data);
      });
    } else {
      console.log('Tidak ada data yang ditemukan dalam database.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
};
  
// Panggil fungsi sendMessage untuk mengirim pesan
sendMessage();