const {
    Client,
    Events
} = require("@mengkodingan/ckptw");
const {
    S_WHATSAPP_NET
} = require("@whiskeysockets/baileys");
const {
    createSSHAccount,
    createVlessAccount,
    createTrojanAccount,
    createVmessAccount,
    createShadowsocksAccount
} = require('@fightertunnel/createft');
const { 
    createTransaction, 
    checkPaymentStatus, 
    checkAccountBalance, 
    tarikSaldo 
} = require('./function/tokopay');
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const menu = require('./ftvpn/menu');
const cekAkun = require('./ftvpn/cekakun');

let config = {
    admin: {
        id: process.env.ADMIN_ID,
        number: process.env.ADMIN_NUMBER
    },
    bot: {}
};

const db = new sqlite3.Database('./database/servers.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS servers (
        id INTEGER PRIMARY KEY, 
        displayname TEXT, 
        address TEXT, 
        price_per_day INTEGER,
        ip_price INTEGER,
        default_quota INTEGER
    )`);
});

const groupDb = new sqlite3.Database('./database/group.db');

groupDb.serialize(() => {
    groupDb.run("CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, group_id TEXT, purchase_count INTEGER DEFAULT 0)");
});

const usePairingCode = true;
const phoneNumber = process.env.PHONE_NUMBER;

const bot = new Client({
    prefix: "!",
    phoneNumber: phoneNumber,
    usePairingCode: usePairingCode,
    printQRInTerminal: !usePairingCode,
    WAVersion: [2, 3000, 1015901307],
    selfReply: true
});

bot.ev.once(Events.ClientReady, async (m) => {
    console.log(`[fightertunnel-bot] Bot ready at ${m.user.id}`);
    config.bot.number = m.user.id.split(/[:@]/)[0];
    config.bot.id = config.bot.number + S_WHATSAPP_NET;
});

bot.ev.on(Events.MessagesUpsert, async (m, ctx) => {
    // Tambahkan logika penanganan pesan di sini jika diperlukan ya bebas si lu maunya apa jga asal ngerti aja
});

bot.command("create", async (ctx) => {
    let servers = [];
    db.all("SELECT * FROM servers", [], async (err, rows) => {
        if (err) {
            console.error(err.message);
            return await ctx.reply("Terjadi kesalahan saat mengambil data server. Silakan coba lagi nanti.");
        }
        
        rows.forEach((row) => {
            servers.push(row);
        });

        if (servers.length === 0) {
            return await ctx.reply("Tidak ada server yang tersedia.");
        }

        let serverList = servers.map((server, index) => `${index + 1}. ${server.displayname}`).join("\n");
        await ctx.reply(`🌐 *Pilih Server* 🌐\n\nSilakan pilih server dari daftar di bawah ini dan masukkan nomor yang sesuai dengan server yang Anda inginkan:\n\n${serverList}\n\nContoh: 1`);

        let promptsSSH = [
            "Masukkan nama pengguna (tanpa spasi):",
            "Masukkan kata sandi (min 6 karakter):",
            "Masukkan masa berlaku (format angka):",
            "Masukkan batasan IP (format angka):"
        ];

        let promptsOther = [
            "Masukkan nama pengguna (tanpa spasi):",
            "Masukkan masa berlaku (format angka):",
            "Masukkan batasan IP (format angka):"
        ];

        let data = {};
        let currentStep = 0;
        let selectedService;
        let selectedServer;
        let col = ctx.MessageCollector({
            time: 60000
        });

        let isCancelled = false;

        col.on("collect", async (m) => {
            try {
                const content = m.content.trim();

                if (content.toLowerCase() === "cancel") {
                    isCancelled = true;
                    await ctx.reply("Pembayaran dibatalkan. Silakan mulai dari awal.");
                    col.stop();
                    return;
                }

                if (!selectedServer) {
                    const serverIndex = parseInt(content, 10) - 1;
                    if (isNaN(serverIndex) || serverIndex < 0 || serverIndex >= servers.length) {
                        return await ctx.reply("Server tidak valid. Pilih server yang tersedia.");
                    }
                    selectedServer = servers[serverIndex];
                    await ctx.reply(`Pilih layanan: SSH, VMESS, TROJAN, VLESS, SHADOWSOCKS`);
                } else if (!selectedService) {
                    const validServices = ["SSH", "VMESS", "TROJAN", "VLESS", "SHADOWSOCKS"];
                    if (!validServices.includes(content.toUpperCase())) {
                        return await ctx.reply("Layanan tidak valid. Pilih salah satu dari: SSH, VMESS, TROJAN, VLESS, SHADOWSOCKS.");
                    }
                    selectedService = content.toUpperCase();
                    await ctx.reply(`${selectedService} dipilih. Silakan masukkan detail berikut.`);
                    await ctx.reply(selectedService === "SSH" ? promptsSSH[currentStep] : promptsOther[currentStep]);
                } else {
                    if (selectedService === "SSH") {
                        switch (currentStep) {
                            case 0:
                                if (/\s/.test(content)) return await ctx.reply("Nama pengguna tidak boleh mengandung spasi.");
                                data.username = content;
                                break;
                            case 1:
                                if (content.length < 6) return await ctx.reply("Password minimal harus 6 karakter.");
                                data.password = content;
                                break;
                            case 2:
                                if (!/^\d+$/.test(content)) return await ctx.reply("Masa berlaku harus berupa angka.");
                                if (parseInt(content, 10) > 30) return await ctx.reply("Masa berlaku tidak boleh lebih dari 30 hari.");
                                data.expiry = content;
                                break;
                            case 3:
                                if (!/^\d+$/.test(content)) return await ctx.reply("Batasan IP harus berupa angka.");
                                data.iplimit = content;
                                break;
                        }
                    } else {
                        switch (currentStep) {
                            case 0:
                                if (/\s/.test(content)) return await ctx.reply("Nama pengguna tidak boleh mengandung spasi.");
                                data.username = content;
                                break;
                            case 1:
                                if (!/^\d+$/.test(content)) return await ctx.reply("Masa berlaku harus berupa angka.");
                                if (parseInt(content, 10) > 30) return await ctx.reply("Masa berlaku tidak boleh lebih dari 30 hari.");
                                data.expiry = content;
                                data.quota = selectedServer.default_quota;
                                break;
                            case 2:
                                if (!/^\d+$/.test(content)) return await ctx.reply("Batasan IP harus berupa angka.");
                                data.iplimit = content;
                                break;
                        }
                    }
                    currentStep++;
                    if (currentStep < (selectedService === "SSH" ? promptsSSH.length : promptsOther.length)) {
                        await ctx.reply(selectedService === "SSH" ? promptsSSH[currentStep] : promptsOther[currentStep]);
                    } else {
                        col.stop();
                    }
                }
            } catch (error) {
                console.error("Error during message collection:", error.message);
                await ctx.reply("Terjadi kesalahan saat memproses input Anda. Silakan coba lagi.");
            }
        });

        const checkPaymentInterval = 5000;
        const maxCheckAttempts = 60;

        col.on("end", async () => {
            if (!selectedServer || !selectedService || currentStep < (selectedService === "SSH" ? promptsSSH.length : promptsOther.length)) {
                await ctx.reply("Proses dihentikan sebelum semua data terkumpul. Silakan mulai dari awal.");
                return;
            }
            
            const refId = Math.random().toString(36).substring(2, 15);
            const nominalPerDay = parseInt(data.expiry, 10) * selectedServer.price_per_day;
            const nominalIpPrice = parseInt(data.iplimit, 10) > 2 ? (parseInt(data.iplimit, 10) - 2) * selectedServer.ip_price : 0;
            const nominal = nominalPerDay + nominalIpPrice;

            try {
                const transaction = await createTransaction(refId, nominal, "QRISREALTIME");
                if (transaction && transaction.data && transaction.data.qr_link) {
                    const panduanPembayaran = `1. Screenshot kode QR yang tampil\n` +
                                              `2. Masuk ke aplikasi dompet digital Anda yang telah mendukung QRIS seperti (Dana, Gopay, Ovo, Shopeepay, Link aja, Dll)\n` +
                                              `3. Buka Scan QR pada aplikasi dompet digital anda\n` +
                                              `4. Scan QR yang muncul pada halaman pembelian anda/ Pilih dari galeri hasil screenshot kode QR\n` +
                                              `5. Akan muncul detail transaksi. Pastikan data transaksi sudah sesuai\n` +
                                              `6. Selesaikan proses pembayaran Anda\n` +
                                              `7. Transaksi selesai. Simpan bukti pembayaran Anda`;
                    await ctx.sendMessage(ctx.id, { 
                        image: { url: transaction.data.qr_link }, 
                        caption: `${panduanPembayaran}` 
                    });
                } else {
                    await ctx.reply("Gagal mendapatkan gambar QRIS. Silakan coba lagi.");
                    return;
                }
                let attempts = 0;
                let paymentSuccess = false;

                while (attempts < maxCheckAttempts && !paymentSuccess) {
                    try {
                        const paymentStatus = await checkPaymentStatus(refId, nominal, "QRISREALTIME");

                        if (isCancelled) {
                            await ctx.reply("Pembayaran dibatalkan. Silakan mulai dari awal.");
                            return;
                        }

                        if (paymentStatus.data.status === "Success") {
                            paymentSuccess = true;
                            await ctx.reply("Pembayaran berhasil. Akun akan segera dikirim.");
                            groupDb.all("SELECT group_id, purchase_count FROM groups", [], async (err, rows) => {
                                if (err) {
                                    console.error(err.message);
                                    return;
                                }

                                rows.forEach(async (row) => {
                                    const newPurchaseCount = row.purchase_count + 1;
                                    groupDb.run(`UPDATE groups SET purchase_count = ? WHERE group_id = ?`, [newPurchaseCount, row.group_id], function (err) {
                                        if (err) {
                                            return console.log(err.message);
                                        }
                                    });

                                    const notificationMessage = `
TRX #${newPurchaseCount}
━━━━━━━━━━━━━━━━━━
⟨ NEW TRANSACTION ⟩
━━━━━━━━━━━━━━━━━━
Nominal :Rp.${nominal}
➥AKUN :${selectedService}
➥SERVER :${selectedServer.displayname}
━━━━━━━━━━━━━━━━━━

║▌║▌║ - ║▌║▌║
𝗖𝗢𝗡𝗧𝗔𝗖𝗧
➥Hubungi https://wa.me/${config.admin.number}
║▌║▌║ - ║▌║▌║
━━━━━━━━━━━━━━━━━━`;

                                    await ctx.sendMessage(row.group_id, {
                                        image: { url: 'https://github.com/AutoFTbot/AutoFTbot/blob/main/assets/order.png?raw=true' },
                                        caption: notificationMessage
                                    });
                                });
                            });

                            if (selectedService === "VMESS") {
                                await createVmessAccount(selectedServer.address, data, ctx);
                            } else if (selectedService === "TROJAN") {
                                await createTrojanAccount(selectedServer.address, data, ctx);
                            } else if (selectedService === "VLESS") {
                                await createVlessAccount(selectedServer.address, data, ctx);
                            } else if (selectedService === "SHADOWSOCKS") {
                                await createShadowsocksAccount(selectedServer.address, data, ctx);
                            } else if (selectedService === "SSH") {
                                await createSSHAccount(selectedServer.address, data, ctx);
                            }
                        } else {
                            attempts++;
                            await new Promise(resolve => setTimeout(resolve, checkPaymentInterval));
                        }
                    } catch (error) {
                        console.error("Gagal memeriksa status pembayaran:", error.message);
                        attempts++;
                        await new Promise(resolve => setTimeout(resolve, checkPaymentInterval));
                    }
                }

                if (!paymentSuccess) {
                    await ctx.reply("Pembayaran dibatalkan otomatis, silakan lakukan create ulang.");
                }
            } catch (error) {
                console.error("Error during transaction processing:", error.message);
                await ctx.reply("Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.");
            }
        });
    });
});

bot.command("addserver", async (ctx) => {
    const senderId = ctx._sender.jid;
    if (senderId !== config.admin.id) {
        await ctx.reply("Maaf, hanya admin yang dapat menggunakan perintah ini.");
        return;
    }

    await ctx.reply("Masukkan nama server:");
    let serverData = {};
    let currentStep = 0;
    let prompts = [
        "Masukkan nama server:",
        "Masukkan alamat server:",
        "Masukkan harga per hari (dalam rupiah contoh: 100):",
        "Masukkan harga per IP jika lebih dari 2 IP (dalam rupiah contoh: 10):",
        "Masukkan kuota default (dalam GB contoh: 50):"
    ];

    let col = ctx.MessageCollector({
        time: 60000
    });

    col.on("collect", async (m) => {
        try {
            const content = m.content;

            switch (currentStep) {
                case 0:
                    serverData.displayname = content;
                    break;
                case 1:
                    serverData.address = content;
                    break;
                case 2:
                    const price = parseInt(content, 10);
                    if (isNaN(price) || price <= 0) {
                        await ctx.reply("Harga tidak valid. Harus berupa angka positif.");
                        return;
                    }
                    serverData.price_per_day = price;
                    break;
                case 3:
                    const ipPrice = parseInt(content, 10);
                    if (isNaN(ipPrice) || ipPrice <= 0) {
                        await ctx.reply("Harga per IP tidak valid. Harus berupa angka positif.");
                        return;
                    }
                    serverData.ip_price = ipPrice;
                    break;
                case 4:
                    const defaultQuota = parseInt(content, 10);
                    if (isNaN(defaultQuota) || defaultQuota <= 0) {
                        await ctx.reply("Kuota default tidak valid. Harus berupa angka positif.");
                        return;
                    }
                    serverData.default_quota = defaultQuota;
                    break;
            }

            currentStep++;
            if (currentStep < prompts.length) {
                await ctx.reply(prompts[currentStep]);
            } else {
                col.stop();
            }
        } catch (error) {
            console.error("Error during server data collection:", error.message);
            await ctx.reply("Terjadi kesalahan saat memproses input Anda. Silakan coba lagi.");
        }
    });

    col.on("end", async () => {
        if (currentStep < prompts.length) {
            await ctx.reply("Proses dihentikan sebelum semua data terkumpul. Silakan mulai dari awal.");
        } else {
            db.run(`INSERT INTO servers (displayname, address, price_per_day, ip_price, default_quota) VALUES (?, ?, ?, ?, ?)`, [serverData.displayname, serverData.address, serverData.price_per_day, serverData.ip_price, serverData.default_quota], function (err) {
                if (err) {
                    return console.log(err.message);
                }
                ctx.reply(`Server ${serverData.displayname} berhasil ditambahkan dengan harga per hari ${serverData.price_per_day} rupiah, harga per IP ${serverData.ip_price} rupiah, dan kuota default ${serverData.default_quota} GB.`);
            });
        }
    });
});

bot.command("deleteserver", async (ctx) => {
    const senderId = ctx._sender.jid;
    if (senderId !== config.admin.id) {
        await ctx.reply("Maaf, hanya admin yang dapat menggunakan perintah ini.");
        return;
    }

    let servers = [];
    db.all("SELECT * FROM servers", [], async (err, rows) => {
        if (err) {
            console.error(err.message);
            return await ctx.reply("Terjadi kesalahan saat mengambil data server.");
        }
        
        rows.forEach((row) => {
            servers.push(row);
        });

        if (servers.length === 0) {
            return await ctx.reply("Tidak ada server yang tersedia.");
        }

        let serverList = servers.map((server, index) => `${index + 1}. ${server.displayname}`).join("\n");
        await ctx.reply(`Silakan pilih server dari daftar di bawah ini dan masukkan nomor yang sesuai dengan server yang ingin Anda hapus:\n\n${serverList}`);

        let col = ctx.MessageCollector({
            time: 60000
        });

        col.on("collect", async (m) => {
            const content = m.content;
            const serverIndex = parseInt(content, 10) - 1;
            if (serverIndex >= 0 && serverIndex < servers.length) {
                const selectedServer = servers[serverIndex];
                db.run(`DELETE FROM servers WHERE id = ?`, [selectedServer.id], function (err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    ctx.reply(`Server ${selectedServer.displayname} berhasil dihapus.`);
                });
                col.stop();
            } else {
                await ctx.reply("Server tidak valid. Pilih server yang tersedia.");
            }
        });

        col.on("end", async () => {
            if (servers.length === 0) {
                await ctx.reply("Proses dihentikan sebelum server dihapus.");
            }
        });
    });
});

bot.command("ceksaldo", async (ctx) => {
    const senderId = ctx._sender.jid;
    if (senderId !== config.admin.id) {
        await ctx.reply("Maaf, hanya admin yang dapat menggunakan perintah ini.");
        return;
    }

    try {
        const { nama_toko, saldo_tersedia, saldo_tertahan } = await checkAccountBalance();
        await ctx.reply(`Informasi Akun:\nNama Toko: ${nama_toko}\nSaldo Tersedia: ${saldo_tersedia}\nSaldo Tertahan: ${saldo_tertahan}`);
    } catch (error) {
        console.error(error.message);
        await ctx.reply("Terjadi kesalahan saat memeriksa saldo akun.");
    }
});

bot.command("tariksaldo", async (ctx) => {
    const senderId = ctx._sender.jid;
    if (senderId !== config.admin.id) {
        await ctx.reply("Maaf, hanya admin yang dapat menggunakan perintah ini.");
        return;
    }

    await ctx.reply("Masukkan nominal yang ingin ditarik:");

    let col = ctx.MessageCollector({
        time: 60000
    });

    col.on("collect", async (m) => {
        const content = m.content;
        const nominal = parseInt(content, 10);

        if (isNaN(nominal) || nominal <= 0) {
            await ctx.reply("Nominal tidak valid. Harus berupa angka positif.");
            return;
        }

        try {
            const result = await tarikSaldo(nominal);
            if (result.status === 1) {
                await ctx.reply(`Penarikan berhasil: ${result.message}`);
            } else {
                await ctx.reply(`Gagal melakukan penarikan: ${result.error_msg}`);
            }
        } catch (error) {
            console.error(error.message);
            await ctx.reply("Terjadi kesalahan saat melakukan tarik saldo.");
        }

        col.stop();
    });

    col.on("end", async () => {
        await ctx.reply("Proses tarik saldo selesai.");
    });
});

bot.command("addnotif", async (ctx) => {
    const senderId = ctx._sender.jid;
    if (senderId !== config.admin.id) {
        await ctx.reply("Maaf, hanya admin yang dapat menggunakan perintah ini.");
        return;
    }
    const groupId = ctx._msg.key.remoteJid;
    if (!groupId) {
        await ctx.reply("Gagal mendapatkan ID grup.");
        return;
    }
    groupDb.run(`INSERT INTO groups (group_id) VALUES (?)`, [groupId], function (err) {
        if (err) {
            return console.log(err.message);
        }
        ctx.reply(`berhasil ditambahkan untuk notifikasi.`);
    });
});

bot.command("cekakun", cekAkun);

menu(bot);

bot.launch().catch((error) => console.error("[fightertunnel-bot] Error:", error));
