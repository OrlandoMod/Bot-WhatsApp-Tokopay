let config = {
    admin: {
        id: process.env.ADMIN_ID,
        number: process.env.ADMIN_NUMBER
    },
    bot: {}
};
const {
    checkSSHAccount,
    checkVlessAccount,
    checkTrojanAccount,
    checkVmessAccount,
    checkShadowsocksAccount
} = require('@fightertunnel/cekft');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/servers.db');

async function cekAkun(ctx) {
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
        await ctx.reply(`Silakan pilih server dari daftar di bawah ini:\n\n${serverList}`);

        let selectedServer = null;

        let col = ctx.MessageCollector({
            time: 60000
        });

        col.on("collect", async (m) => {
            const content = m.content.trim();
            const serverIndex = parseInt(content, 10) - 1;
            if (selectedServer === null && serverIndex >= 0 && serverIndex < servers.length) {
                selectedServer = servers[serverIndex];
                await ctx.reply("Silakan pilih jenis pemeriksaan:\n1. SSH\n2. VMESS\n3. TROJAN\n4. VLESS\n5. SHADOWSOCKS");
            } else if (selectedServer) {
                const typeIndex = parseInt(content, 10);
                let result;

                try {
                    switch (typeIndex) {
                        case 1:
                            result = await checkSSHAccount(selectedServer.address);
                            break;
                        case 2:
                            result = await checkVmessAccount(selectedServer.address);
                            break;
                        case 3:
                            result = await checkTrojanAccount(selectedServer.address);
                            break;
                        case 4:
                            result = await checkVlessAccount(selectedServer.address);
                            break;
                        case 5:
                            result = await checkShadowsocksAccount(selectedServer.address);
                            break;
                        default:
                            await ctx.reply("Jenis pemeriksaan tidak valid. Silakan pilih dari: 1. SSH, 2. VMESS, 3. TROJAN, 4. VLESS, 5. SHADOWSOCKS.");
                            return;
                    }
                    const resultMessage = `${result}`;
                    await ctx.reply(resultMessage);
                } catch (error) {
                    console.error('Error:', error.message);
                    await ctx.reply("Terjadi kesalahan saat memeriksa status akun.");
                }
            } else {
                await ctx.reply("Server tidak valid. Pilih server yang tersedia.");
            }
        });

        col.on("end", async () => {
            await ctx.reply("Proses cek akun selesai.");
        });
    });
}

module.exports = cekAkun;