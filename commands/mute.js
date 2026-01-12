module.exports = {
  name: "mute",
  execute: async (sock, msg) => {
    const from = msg.key.remoteJid;

    await sock.groupSettingUpdate(from, "announcement");

    await sock.sendMessage(from, {
      text: "🔒 Groupe verrouillé\n\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴"
    });
  }
};