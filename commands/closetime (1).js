module.exports = {
  name: "closetime",
  execute: async (sock, msg, args) => {
    const from = msg.key.remoteJid;

    if (!args[0] || isNaN(args[0])) {
      return sock.sendMessage(from, {
        text: "⏱️ Utilisation : `.closetime 10` (minutes)\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }

    const time = Number(args[0]) * 60000;

    await sock.groupSettingUpdate(from, "announcement");
    await sock.sendMessage(from, {
      text: `🔒 Groupe fermé pour ${args[0]} minute(s)\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴`
    });

    setTimeout(async () => {
      await sock.groupSettingUpdate(from, "not_announcement");
      await sock.sendMessage(from, {
        text: "🔓 Groupe rouvert automatiquement\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
      });
    }, time);
  }
};