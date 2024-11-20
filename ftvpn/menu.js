let config = {
    admin: {
        id: process.env.ADMIN_ID,
        number: process.env.ADMIN_NUMBER
    },
    bot: {}
};
module.exports = (bot) => {
    bot.command("admin", async (ctx) => {
        const senderId = ctx._sender.jid;
        if (senderId !== config.admin.id) {
            await ctx.reply("Maaf, hanya admin yang dapat menggunakan perintah ini.");
            return;
        }

        const adminMenuMessage = `
  ╭─ 〣 Admin - Menu 〣
  │ • !addserver - Tambah Server Ke Database
  │ • !deleteserver - Hapus Server Di Database
  │ • !tariksaldo - Tarik Saldo Tokopay
  │ • !ceksaldo - Cek Saldo Tokopay
  │ • !cekakun - Cek Akun Vpn Yang Login
  ╰────────────────────╯
        `;
        await ctx.reply(adminMenuMessage);
    });

    bot.command("menu", async (ctx) => {
        const userMenuMessage = `
  ╭─ 〣 Member - Menu 〣
  │ • !create
  │ • !renew - soon
  ╰────────────────────╯
        `;
        await ctx.reply(userMenuMessage);
    });
};