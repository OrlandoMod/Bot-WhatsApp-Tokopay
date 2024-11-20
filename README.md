# VpnBotStore

VpnBotStore adalah bot yang dirancang untuk memudahkan pengguna dalam melakukan transaksi pembayaran menggunakan QRIS. Bot ini mendukung berbagai metode pembayaran dan menyediakan panduan langkah demi langkah untuk pengguna.

## Fitur

- **Pembayaran QRIS**: Memungkinkan pengguna untuk melakukan pembayaran dengan mudah menggunakan kode QR.
- **Pengelolaan Server**: Pengguna dapat menambahkan dan menghapus server dengan mudah.
- **Notifikasi Pembayaran**: Memberikan notifikasi kepada pengguna tentang status pembayaran.

## Prerequisites

Sebelum menjalankan proyek ini, pastikan Anda memiliki:

- <img src="https://www.google.com/s2/favicons?domain=nodejs.org" width="16" height="16"> Node.js (versi terbaru)
- <img src="https://www.google.com/s2/favicons?domain=npmjs.com" width="16" height="16"> NPM (Node Package Manager)
- <img src="https://www.google.com/s2/favicons?domain=tokopay.id" width="16" height="16"> Akun TOKOPAY ([REGISTRASI](https://tokopay.id?ref=AutoFtBot))
- <img src="https://www.google.com/s2/favicons?domain=virtualserver.com" width="16" height="16"> VPS yang menggunakan  script FighterTunnel ([AutoScript](https://github.com/FighterTunnel/tunnel))
- <img src="https://www.google.com/s2/favicons?domain=pm2.io" width="16" height="16"> PM2 untuk pengelolaan proses

## Instalasi

1. Clone repositori ini:
   ```bash
   git clone https://github.com/AutoFTbot/VpnBotStore.git
   ```

2. Masuk ke direktori proyek:
   ```bash
   cd VpnBotStore
   ```

3. Instal dependensi:
   ```bash
   npm install
   ```

4. Konfigurasi file `.env` sesuai dengan kebutuhan Anda.

5. Instalasi PM2 untuk pengelolaan proses:
   ```bash
   npm install pm2 -g
   ```

6. Buat file `ecosystem.config.js` untuk konfigurasi PM2:
   ```bash
   pm2 init
   ```

7. Edit file `ecosystem.config.js` untuk menambahkan konfigurasi VpnBotStore:
   ```javascript
   module.exports = {
     apps: [{
       name: 'VpnBotStore',
       script: './app.js',
       instances: 1,
       autorestart: true,
       watch: true,
       max_memory_restart: '1G',
       env: {
         NODE_ENV: 'production'
       }
     }]
   };
   ```

8. Simpan perubahan pada file `ecosystem.config.js`.

## Penggunaan

1. Jalankan bot menggunakan PM2:
   ```bash
   pm2 start ecosystem.config.js
   ```

2. Ikuti instruksi di dalam chat untuk melakukan transaksi dan mengelola server.

3. Untuk memulai ulang bot, jalankan perintah:
   ```bash
   pm2 restart VpnBotStore
   ```

4. Untuk mematikan bot, jalankan perintah:
   ```bash
   pm2 stop VpnBotStore
   ```

## Kontribusi

Jika Anda ingin berkontribusi pada proyek ini, silakan buat pull request atau buka isu untuk diskusi.

## Lisensi

Proyek ini dilisensikan di bawah MIT License. Lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.

## Kontak

Jika Anda memiliki pertanyaan atau saran, silakan hubungi saya di [Telegram](https://t.me/AutoFtBot).

## Terima Kasih

Terima kasih kepada TOKOPAY dan FighterTunnel atas kontribusi dan kerjasamanya yang sangat berharga dan berarti dalam pengembangan proyek ini.
