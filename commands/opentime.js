module.exports = {
  name: "opentime",
  execute: async (sock, msg) => {
    const from = msg.key.remoteJid;

    await sock.groupSettingUpdate(from, "not_announcement");

    await sock.sendMessage(from, {
      text: "🔓 Groupe ouvert\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
    });
  }
};