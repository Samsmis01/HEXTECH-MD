module.exports = {
  name: "listadmins",
  execute: async (sock, msg) => {
    const from = msg.key.remoteJid;
    const metadata = await sock.groupMetadata(from);

    let text = "👑 *LISTE DES ADMINS*\n\n";
    const mentions = [];

    metadata.participants
      .filter(p => p.admin)
      .forEach((p, i) => {
        mentions.push(p.id);
        text += `${i + 1}. @${p.id.split("@")[0]}\n`;
      });

    await sock.sendMessage(from, {
      text: text + "\n> 𝚙𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝙷𝙴𝚇-𝙶𝙰𝚃𝙴",
      mentions
    });
  }
};